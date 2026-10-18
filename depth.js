import {frameSize,colorizeDepth,makeRelief,rotatePoint} from './depth-core.js?v=1';
const $=id=>document.getElementById(id);
const ui=Object.fromEntries('start stop pause step status capability backend resolution facing frequency video standby depth-image relief empty view-depth view-relief result-title relief-tools rotate-left rotate-right relief-out relief-in reset-view inference average rate age engine'.split(' ').map(id=>[id,$(id)]));
const capture=document.createElement('canvas'),ctx=capture.getContext('2d',{willReadFrequently:true});
let generation=0,worker=null,stream=null,running=false,starting=false,ready=false,paused=false,inFlight=false;
let timer=null,watchdog=null,ageTimer=null,request=0,sentAt=0,lastVideoTime=-1,lastFresh=0;
let frames=0,samples=[],delivered=[],lastResult=0,points=[],showRelief=false,yaw=0,pitch=0,zoom=1,drag=null,drawPending=false;
function status(message){ui.status.textContent=message;}
function controls(){
 ui.start.disabled=starting||running;ui.stop.disabled=!(starting||running);
 for(const id of ['backend','resolution','facing'])ui[id].disabled=starting||running;
 ui.pause.disabled=!ready;ui.step.disabled=!ready||!paused||inFlight;
 ui.pause.textContent=paused?'Resume depth':'Pause depth';
}
function clearTimers(){clearTimeout(timer);clearTimeout(watchdog);clearInterval(ageTimer);timer=watchdog=ageTimer=null;}
function stop(message='Stopped. Camera and model released; the last depth result remains available.'){
 generation++;running=starting=ready=inFlight=false;paused=false;clearTimers();
 worker?.terminate();worker=null;
 if(stream)for(const track of stream.getTracks())track.stop();stream=null;
 ui.video.srcObject=null;ui.standby.hidden=false;controls();
 ui.age.textContent=lastResult?'Frozen':'—';if(message)status(message);
}
function fail(message){stop(`${message} Stop/retry, reduce detail, or select CPU / WASM if WebGPU fails.`);}
function guard(ms,message){clearTimeout(watchdog);watchdog=setTimeout(()=>fail(message),ms);}
function schedule(){
 clearTimeout(timer);
 if(!running||!ready||paused||inFlight)return;
 const wait=Math.max(0,1000/Number(ui.frequency.value)-(performance.now()-sentAt));
 timer=setTimeout(()=>sendFrame(false),wait);
}
function sendFrame(single=false){
 if(!running||!ready||inFlight||(!single&&paused)||document.hidden)return;
 if(ui.video.readyState<2||ui.video.currentTime===lastVideoTime){
  if(performance.now()-lastFresh>10000){fail('The camera stopped delivering fresh frames.');return;}
  clearTimeout(timer);timer=setTimeout(()=>sendFrame(single),100);return;
 }
 try{
  const size=frameSize(ui.video.videoWidth,ui.video.videoHeight,Number(ui.resolution.value));
  capture.width=size.width;capture.height=size.height;ctx.drawImage(ui.video,0,0,size.width,size.height);
  const pixels=ctx.getImageData(0,0,size.width,size.height).data;
  lastVideoTime=ui.video.currentTime;lastFresh=sentAt=performance.now();inFlight=true;request++;controls();
  guard(60000,'Depth inference exceeded 60 seconds.');
  worker.postMessage({type:'frame',id:request,...size,pixels:pixels.buffer},[pixels.buffer]);
 }catch(error){fail(error.message||'Unable to read the camera frame.');}
}
function displayResult(data){
 const depth=new Float32Array(data.depth),rgba=new Uint8ClampedArray(data.pixels);
 if(depth.length!==data.width*data.height)throw new Error('Invalid depth result');
 const image=ui['depth-image'];image.width=data.width;image.height=data.height;
 image.getContext('2d').putImageData(new ImageData(colorizeDepth(depth),data.width,data.height),0,0);
 points=makeRelief(depth,data.width,data.height,rgba);ui.empty.hidden=true;lastResult=performance.now();
 frames++;ui.inference.textContent=`${Math.round(data.inferenceMs)} ms${frames===1?' · first':''}`;
 if(frames>1){samples.push(data.inferenceMs);if(samples.length>20)samples.shift();}
 ui.average.textContent=samples.length?`${Math.round(samples.reduce((a,b)=>a+b,0)/samples.length)} ms`:'Warming up';
 delivered.push(lastResult);if(delivered.length>20)delivered.shift();
 ui.rate.textContent=paused?'Paused':delivered.length>1?`${((delivered.length-1)*1000/(lastResult-delivered[0])).toFixed(2)} / s`:'Measuring';
 ui.age.textContent='0.0 s';queueDraw();
}
async function start(){
 stop(null);const mine=++generation;starting=true;controls();
 frames=0;samples=[];delivered=[];lastResult=0;points=[];lastVideoTime=-1;
 ui.empty.hidden=false;ui['depth-image'].getContext('2d').clearRect(0,0,ui['depth-image'].width,ui['depth-image'].height);queueDraw();
 for(const id of ['inference','average','rate','age'])ui[id].textContent='—';
 ui.engine.textContent='Engine loading · no YOLO';
 status('Requesting camera permission…');
 try{
  if(!window.isSecureContext)throw new Error('Camera access requires HTTPS.');
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera access is unavailable in this browser.');
  const media=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:ui.facing.value},width:{ideal:640},height:{ideal:480}}});
  if(mine!==generation){media.getTracks().forEach(track=>track.stop());return;}
  stream=media;ui.video.srcObject=media;
  for(const track of media.getVideoTracks())track.addEventListener('ended',()=>{if(mine===generation)fail('The camera disconnected.');});
  await ui.video.play();if(mine!==generation)return;
  if(document.hidden){stop('Paused because this page is hidden. Tap Start to resume.');return;}
  ui.standby.hidden=true;running=true;starting=false;lastFresh=performance.now();controls();
  const active=new Worker(new URL('./depth-worker.js?v=1',import.meta.url),{type:'module'});worker=active;
  active.onmessage=({data})=>{
   if(mine!==generation||worker!==active)return;
   try{
    if(data.type==='progress'){status(data.message);guard(240000,'Model loading timed out.');}
    else if(data.type==='ready'){
     clearTimeout(watchdog);ready=true;controls();
     ui.engine.textContent=`${data.backend==='webgpu'?'WebGPU':'CPU / WASM'} · ${data.precision} · ${(data.modelBytes/1e6).toFixed(1)} MB weights · ${ui.resolution.value} px maximum edge`;
     status('Running. Move slowly; the first frame includes model warm-up.');
     ageTimer=setInterval(()=>{if(lastResult)ui.age.textContent=`${((performance.now()-lastResult)/1000).toFixed(1)} s${paused?' · paused':''}`;},250);
     sendFrame(false);
    }else if(data.type==='depth'&&inFlight&&data.id===request){
     clearTimeout(watchdog);inFlight=false;displayResult(data);controls();schedule();
    }else if(data.type==='error')fail(data.message||'Depth processing failed.');
   }catch(error){fail(error.message||'Unable to display depth.');}
  };
  active.onerror=()=>{if(mine===generation)fail('The depth worker could not start or crashed. Check the connection and browser support.');};
  active.onmessageerror=()=>{if(mine===generation)fail('Unable to receive depth data.');};
  guard(240000,'Model loading timed out.');active.postMessage({type:'init',backend:ui.backend.value});
 }catch(error){if(mine===generation)fail(error.name==='NotAllowedError'?'Camera permission was denied.':error.message||'Camera startup failed.');}
}
function queueDraw(){if(drawPending)return;drawPending=true;requestAnimationFrame(()=>{drawPending=false;drawRelief();});}
function drawRelief(){
 if(!showRelief)return;
 const canvas=ui.relief,rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,1.5);
 if(!rect.width||!rect.height)return;
 canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
 const context=canvas.getContext('2d');context.fillStyle='#030807';context.fillRect(0,0,canvas.width,canvas.height);
 const scale=Math.min(canvas.width,canvas.height)*.23*zoom;
 const projected=points.map(point=>({...rotatePoint(point,yaw,pitch),color:point.color})).sort((a,b)=>a.z-b.z);
 for(const p of projected){context.fillStyle=p.color;context.fillRect(canvas.width/2+p.x*scale,canvas.height/2-p.y*scale,Math.max(2,2*dpr*zoom),Math.max(2,2*dpr*zoom));}
}
function setView(relief){
 showRelief=relief;ui.relief.hidden=!relief;ui['depth-image'].hidden=relief;ui['relief-tools'].hidden=!relief;
 ui['view-depth'].setAttribute('aria-pressed',String(!relief));ui['view-relief'].setAttribute('aria-pressed',String(relief));
 ui['result-title'].textContent=relief?'Single-frame 3D relief':'Relative depth';queueDraw();
}
function turn(dx,dy=0){yaw=Math.max(-1.3,Math.min(1.3,yaw+dx));pitch=Math.max(-1,Math.min(1,pitch+dy));queueDraw();}
function magnify(factor){zoom=Math.max(.4,Math.min(3,zoom*factor));queueDraw();}
ui.start.addEventListener('click',start);ui.stop.addEventListener('click',()=>stop());
ui.pause.addEventListener('click',()=>{
 if(!ready)return;paused=!paused;clearTimeout(timer);controls();
 // Exclude intentional pause gaps from delivered-rate measurement.
 delivered=[];ui.rate.textContent=paused?'Paused':'Measuring';
 status(paused?'Depth paused; camera stays live. Use One depth frame or Resume depth.':'Running depth.');schedule();
});
ui.step.addEventListener('click',()=>{if(paused)sendFrame(true);});
ui.frequency.addEventListener('change',()=>{delivered=[];schedule();});
ui['view-depth'].addEventListener('click',()=>setView(false));ui['view-relief'].addEventListener('click',()=>setView(true));
ui['rotate-left'].addEventListener('click',()=>turn(-.12));ui['rotate-right'].addEventListener('click',()=>turn(.12));
ui['relief-out'].addEventListener('click',()=>magnify(1/1.15));ui['relief-in'].addEventListener('click',()=>magnify(1.15));
ui['reset-view'].addEventListener('click',()=>{yaw=pitch=0;zoom=1;queueDraw();});
ui.relief.addEventListener('pointerdown',event=>{if(drag)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY};ui.relief.setPointerCapture(event.pointerId);});
ui.relief.addEventListener('pointermove',event=>{if(drag?.id!==event.pointerId)return;turn((event.clientX-drag.x)*.006,(event.clientY-drag.y)*.006);drag.x=event.clientX;drag.y=event.clientY;});
for(const type of ['pointerup','pointercancel','lostpointercapture'])ui.relief.addEventListener(type,event=>{if(drag?.id===event.pointerId)drag=null;});
ui.relief.addEventListener('keydown',event=>{
 const actions={ArrowLeft:()=>turn(-.1),ArrowRight:()=>turn(.1),ArrowUp:()=>turn(0,-.1),ArrowDown:()=>turn(0,.1),'+':()=>magnify(1.1),'-':()=>magnify(1/1.1)};
 if(actions[event.key]){event.preventDefault();actions[event.key]();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(running||starting))stop('Camera and depth stopped while hidden. Tap Start to resume.');});
window.addEventListener('pagehide',()=>stop(null));window.addEventListener('resize',queueDraw);
window.addEventListener('pageshow',()=>{controls();});
ui.capability.textContent=navigator.gpu?'WebGPU API detected; adapter and model support are checked when starting.':'WebGPU API unavailable here; Auto will use the slower CPU / WASM backend.';
controls();
