import {createScanner} from './depth-scan.js?v=2';
import {letterbox} from './depth-tfjs-core.js?v=1';
import {frameSize,colorizeDepth,makeRelief,rotatePoint} from './depth-core.js?v=1';
import {BUILD,createLog,errorInfo,probeGPU} from './depth-diagnostics.js?v=5';
const $=id=>document.getElementById(id);
const log=createLog($('diagnostic-log'));
const emit=(level,event,details)=>log.write(level,'main.'+event,details);
function environment(){return {build:BUILD,userAgent:navigator.userAgent,secureContext:window.isSecureContext,crossOriginIsolated:window.crossOriginIsolated===true,hardwareConcurrency:navigator.hardwareConcurrency,deviceMemory:navigator.deviceMemory,webgpuAPI:!!navigator.gpu,cameraAPI:!!navigator.mediaDevices?.getUserMedia,visibility:document.visibilityState,standalone:window.matchMedia?.('(display-mode: standalone)').matches===true};}
emit('info','environment',environment());
window.addEventListener('error',event=>emit('error','uncaught',{...errorInfo(event.error||event.message),source:event.filename,line:event.lineno,column:event.colno}));
window.addEventListener('unhandledrejection',event=>emit('error','unhandledrejection',errorInfo(event.reason)));
const ui=Object.fromEntries('start stop pause step status capability backend resolution facing frequency video standby depth-image relief empty view-depth view-relief result-title relief-tools rotate-left rotate-right relief-out relief-in reset-view inference average rate age engine'.split(' ').map(id=>[id,$(id)]));
const capture=document.createElement('canvas'),ctx=capture.getContext('2d',{willReadFrequently:true});
let generation=0,worker=null,stream=null,running=false,starting=false,ready=false,paused=false,inFlight=false;
let timer=null,watchdog=null,ageTimer=null,request=0,sentAt=0,lastVideoTime=-1,lastFresh=0;
let frames=0,samples=[],delivered=[],lastResult=0,points=[],showRelief=false,yaw=0,pitch=0,zoom=1,drag=null,drawPending=false;
let lastProgressLog=0;
const scanner=createScanner({
 state:()=>({running:running||starting,ready,inFlight,video:ui.video}),
 start:()=>start(true),stop:()=>stop(),capture:()=>sendFrame(true),
 log:emit,
 show:scene=>{if(scene){
  const xs=scene.points.map(p=>p[0]),ys=scene.points.map(p=>p[1]),zs=scene.points.map(p=>p[2]);
  const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,cz=(Math.min(...zs)+Math.max(...zs))/2;
  const extent=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys),Math.max(...zs)-Math.min(...zs),1),scale=4/extent;
  points=scene.points.map(p=>({x:(p[0]-cx)*scale,y:(p[1]-cy)*scale,z:(cz-p[2])*scale,color:`rgb(${p[3]},${p[4]},${p[5]})`}));
  ui.empty.hidden=true;setView(true);
 }else{points=[];ui.empty.hidden=true;setView(true);}}
});
function status(message){ui.status.textContent=message;}
function controls(){
 ui.start.disabled=starting||running;ui.stop.disabled=!(starting||running);
 for(const id of ['backend','resolution','facing'])ui[id].disabled=starting||running;
 if(ui.backend.value==='tfjs-webgl'){ui.resolution.value='224';ui.resolution.disabled=true;}
 ui.pause.disabled=!ready;ui.step.disabled=!ready||!paused||inFlight;
 ui.pause.textContent=paused?'Resume depth':'Pause depth';
 ui.frequency.disabled=!!scanner?.active;
 if(scanner?.active){ui.pause.disabled=true;ui.step.disabled=true;}
 scanner?.buttons();
}
function clearTimers(){clearTimeout(timer);clearTimeout(watchdog);clearInterval(ageTimer);timer=watchdog=ageTimer=null;}
function stop(message='Stopped. Camera and model released; the last depth result remains available.'){
 if(running||starting||worker||stream)emit('info','stop',{reason:message||'restart/navigation',running,starting,inFlight,frames});
 generation++;running=starting=ready=inFlight=false;paused=false;clearTimers();scanner?.stop();
 if(worker&&ui.backend.value==='tfjs-webgl')emit('info','tfjs.release',{method:'worker termination',note:'Browser owns context destruction; post-termination GPU counters unavailable'});
 worker?.terminate();worker=null;
 if(stream)for(const track of stream.getTracks())track.stop();stream=null;
 ui.video.srcObject=null;ui.standby.hidden=false;controls();
 ui.age.textContent=lastResult?'Frozen':'—';if(message)status(message);
}
function fail(message){emit('error','failure',{message});$('diagnostics-panel').open=true;stop(`${message} Stop/retry, reduce detail, or select another compute option.`);}
function guard(ms,message){clearTimeout(watchdog);watchdog=setTimeout(()=>fail(message),ms);}
function schedule(){
 clearTimeout(timer);
 if(!running||!ready||paused||inFlight||scanner?.active)return;
 const wait=ui.backend.value==='tfjs-webgl'?Math.max(1000,1000/Number(ui.frequency.value)):Math.max(0,1000/Number(ui.frequency.value)-(performance.now()-sentAt));
 timer=setTimeout(()=>sendFrame(false),wait);
}
function sendFrame(single=false){
 if(!running||!ready||inFlight||(!single&&paused)||document.hidden)return false;
 if(ui.video.readyState<2||ui.video.currentTime===lastVideoTime){
  if(performance.now()-lastFresh>10000){fail('The camera stopped delivering fresh frames.');return;}
  if(!scanner?.active){clearTimeout(timer);timer=setTimeout(()=>sendFrame(single),100);}return false;
 }
 try{
  const tfjs=ui.backend.value==='tfjs-webgl';
  const content=tfjs?letterbox(ui.video.videoWidth,ui.video.videoHeight):null;
  const size=tfjs?{width:224,height:224}:frameSize(ui.video.videoWidth,ui.video.videoHeight,Number(ui.resolution.value));
  capture.width=size.width;capture.height=size.height;
  if(content)ctx.drawImage(ui.video,content.x,content.y,content.width,content.height);
  else ctx.drawImage(ui.video,0,0,size.width,size.height);
  const pixels=ctx.getImageData(0,0,size.width,size.height).data;
  lastVideoTime=ui.video.currentTime;lastFresh=sentAt=performance.now();inFlight=true;request++;controls();
  guard(60000,'Depth inference exceeded 60 seconds.');
  if(frames===0||request%10===0)emit('info','frame.sent',{id:request,...size});
  worker.postMessage({type:'frame',id:request,...size,content,scan:scanner?.active===true,capture:{timestamp:sentAt,orientation:globalThis.screen?.orientation?.angle??0,sourceWidth:ui.video.videoWidth,sourceHeight:ui.video.videoHeight,content},pixels:pixels.buffer},[pixels.buffer]);return true;
 }catch(error){fail(error.message||'Unable to read the camera frame.');}
}
function displayResult(data){
 const depth=new Float32Array(data.depth),rgba=new Uint8ClampedArray(data.pixels);
 if(depth.length!==data.width*data.height)throw new Error('Invalid depth result');
 const image=ui['depth-image'];image.width=data.width;image.height=data.height;
 image.getContext('2d').putImageData(new ImageData(colorizeDepth(depth),data.width,data.height),0,0);
 if(!scanner?.active&&!scanner?.scene)points=makeRelief(depth,data.width,data.height,rgba);ui.empty.hidden=true;lastResult=performance.now();
 frames++;ui.inference.textContent=`${Math.round(data.inferenceMs)} ms${frames===1?' · first':''}`;
 if(frames>1){samples.push(data.inferenceMs);if(samples.length>20)samples.shift();}
 ui.average.textContent=samples.length?`${Math.round(samples.reduce((a,b)=>a+b,0)/samples.length)} ms`:'Warming up';
 delivered.push(lastResult);if(delivered.length>20)delivered.shift();
 ui.rate.textContent=paused?'Paused':delivered.length>1?`${((delivered.length-1)*1000/(lastResult-delivered[0])).toFixed(2)} / s`:'Measuring';
 ui.age.textContent='0.0 s';queueDraw();
}
async function start(scanMode=false){
 stop(null);if(scanMode){ui.backend.value='tfjs-webgl';ui.resolution.value='224';scanner?.begin();}const mine=++generation;starting=true;controls();
 emit('info','start',{...environment(),settings:{backend:ui.backend.value,resolution:ui.resolution.value,facing:ui.facing.value,frequency:ui.frequency.value}});
 if(ui.backend.value==='auto'||ui.backend.value==='webgpu'){
  // Diagnostic comparison only: inference remains in the worker.
  probeGPU(navigator.gpu,(level,event,details)=>{if(mine===generation)emit(level,event,details);}).then(result=>{if(mine===generation)emit('info','gpu.probe.complete',{reason:result.reason});});
 }
 frames=0;samples=[];delivered=[];lastResult=0;if(!scanner?.scene)points=[];lastVideoTime=-1;
 ui.empty.hidden=!!scanner?.scene;ui['depth-image'].getContext('2d').clearRect(0,0,ui['depth-image'].width,ui['depth-image'].height);queueDraw();
 for(const id of ['inference','average','rate','age'])ui[id].textContent='—';
 ui.engine.textContent='Engine loading · no YOLO';
 status('Requesting camera permission…');
 try{
  if(!window.isSecureContext)throw new Error('Camera access requires HTTPS.');
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera access is unavailable in this browser.');
  emit('info','camera.permission.begin');
  const media=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:ui.facing.value},width:{ideal:640},height:{ideal:480}}});
  if(mine!==generation){emit('info','camera.lateStream.released');media.getTracks().forEach(track=>track.stop());return;}
  stream=media;ui.video.srcObject=media;
  for(const track of media.getVideoTracks()){
   const settings=track.getSettings?.()||{};
   emit('info','camera.track',{state:track.readyState,width:settings.width,height:settings.height,frameRate:settings.frameRate,facingMode:settings.facingMode});
   track.addEventListener('ended',()=>{if(mine===generation)fail('The camera disconnected.');});
   for(const type of ['mute','unmute'])track.addEventListener(type,()=>{if(mine===generation)emit('warn','camera.track.'+type);});
  }
  await ui.video.play();if(mine!==generation)return;
  emit('info','camera.playing',{width:ui.video.videoWidth,height:ui.video.videoHeight,readyState:ui.video.readyState});
  if(document.hidden){stop('Paused because this page is hidden. Tap Start to resume.');return;}
  ui.standby.hidden=true;running=true;starting=false;lastFresh=performance.now();controls();
  emit('info','worker.create');lastProgressLog=0;
  const tfjs=ui.backend.value==='tfjs-webgl';
  const active=tfjs?new Worker(new URL('./depth-tfjs-worker.js?v=2',import.meta.url)):new Worker(new URL('./depth-worker.js?v=3',import.meta.url),{type:'module'});worker=active;
  active.onmessage=({data})=>{
   if(mine!==generation||worker!==active)return;
   try{
    if(data.type==='diagnostic')log.write(data.level||'info','worker.'+data.event,data.details);
    else if(data.type==='progress'){status(data.message);if(!tfjs)guard(240000,'Model loading timed out.');if(performance.now()-lastProgressLog>2000){lastProgressLog=performance.now();emit('info','worker.progress',{message:data.message});}}
    else if(data.type==='ready'){
     emit('info','worker.ready',{backend:data.backend,gpuMode:data.gpuMode,precision:data.precision,modelBytes:data.modelBytes});
     clearTimeout(watchdog);ready=true;controls();
     ui.engine.textContent=data.backend==='tfjs-webgl'?'TFJS WebGL · FP32 · 97.8 MB model · fixed 224 × 224 letterbox':`${data.backend==='webgpu'?'WebGPU'+(data.gpuMode==='compatibility'?' compatibility':''):'CPU / WASM'} · ${data.precision} · ${(data.modelBytes/1e6).toFixed(1)} MB weights · ${ui.resolution.value} px maximum edge`;
     status('Running. Move slowly; the first frame includes model warm-up.');
     ageTimer=setInterval(()=>{if(lastResult)ui.age.textContent=`${((performance.now()-lastResult)/1000).toFixed(1)} s${paused?' · paused':''}`;},250);
     if(!scanner?.active)sendFrame(false);
    }else if(data.type==='depth'&&inFlight&&data.id===request){
     emit('info','frame.complete',{id:data.id,width:data.width,height:data.height,inferenceMs:Math.round(data.inferenceMs),processingMs:Math.round(data.processingMs||0),roundTripMs:Math.round(performance.now()-sentAt)});
     clearTimeout(watchdog);inFlight=false;displayResult(data);if(scanner?.active)scanner.result(data);controls();schedule();
    }else if(data.type==='error'){emit('error','worker.error',{stage:data.stage,...data.error,message:data.message});fail(data.message||'Depth processing failed.');}
   }catch(error){fail(error.message||'Unable to display depth.');}
  };
  active.onerror=event=>{if(mine===generation){emit('error','worker.crash',{...errorInfo(event.error||event.message),source:event.filename,line:event.lineno,column:event.colno});fail('The depth worker could not start or crashed. Check the connection and browser support.');}};
  active.onmessageerror=()=>{if(mine===generation)fail('Unable to receive depth data.');};
  guard(240000,'Model loading timed out.');active.postMessage({type:'init',backend:ui.backend.value});
 }catch(error){if(mine===generation){emit('error','startup.error',errorInfo(error));fail(error.name==='NotAllowedError'?'Camera permission was denied.':error.message||'Camera startup failed.');}}
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
 ui['result-title'].textContent=relief?(scanner?.scene?'Scan relief':'Single-frame 3D relief'):'Relative depth';queueDraw();
}
function turn(dx,dy=0){yaw=yaw+dx;pitch=Math.max(-1,Math.min(1,pitch+dy));queueDraw();}
function magnify(factor){zoom=Math.max(.4,Math.min(3,zoom*factor));queueDraw();}
ui.start.addEventListener('click',()=>start(false));ui.stop.addEventListener('click',()=>stop());
ui.pause.addEventListener('click',()=>{
 if(!ready)return;paused=!paused;clearTimeout(timer);controls();
 emit('info','pause',{paused});
 // Exclude intentional pause gaps from delivered-rate measurement.
 delivered=[];ui.rate.textContent=paused?'Paused':'Measuring';
 status(paused?'Depth paused; camera stays live. Use One depth frame or Resume depth.':'Running depth.');schedule();
});
ui.step.addEventListener('click',()=>{if(paused)sendFrame(true);});
ui.backend.addEventListener('change',controls);
ui.frequency.addEventListener('change',()=>{emit('info','frequency',{value:ui.frequency.value});delivered=[];schedule();});
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
document.addEventListener('visibilitychange',()=>{emit('info','visibility',{hidden:document.hidden});if(document.hidden&&(running||starting))stop('Camera and depth stopped while hidden. Tap Start to resume.');});
window.addEventListener('pagehide',()=>stop(null));window.addEventListener('resize',queueDraw);
window.addEventListener('pageshow',()=>{controls();});
ui.capability.textContent=navigator.gpu?'WebGPU API detected; adapter and model support are checked when starting.':'WebGPU API unavailable here; Auto will use the slower CPU / WASM backend.';
$('copy-log').addEventListener('click',async()=>{
 emit('info','snapshot',{...environment(),requestedBackend:ui.backend.value,engine:ui.engine.textContent,running,starting,ready,paused,inFlight,frames});
 try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard API unavailable');await navigator.clipboard.writeText(log.text());$('log-status').textContent='Log copied. Paste it into our chat.';}
 catch{const output=$('diagnostic-log');output.focus();output.select();output.setSelectionRange(0,output.value.length);$('log-status').textContent='Log selected. Touch and hold the text, choose Copy, then paste it into our chat.';}
});
$('clear-log').addEventListener('click',()=>{log.clear();emit('info','environment',environment());$('log-status').textContent='Log cleared. Reproduce the problem, then copy the log.';});
controls();
