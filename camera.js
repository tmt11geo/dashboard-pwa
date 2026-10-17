import {VisualTracker,grayFrame} from './camera-tracker.js?v=1';
import {clamp,centre,guidance,makeLock,exitSide,contentRect,decode} from './camera-core.js?v=1';
const $=id=>document.getElementById(id);
const video=$('video'),canvas=$('overlay'),ctx=canvas.getContext('2d'),viewport=$('viewfinder');
const capture=document.createElement('canvas'),pixels=capture.getContext('2d',{willReadFrequently:true});
const labels='person,bicycle,car,motorcycle,airplane,bus,train,truck,boat,traffic light,fire hydrant,stop sign,parking meter,bench,bird,cat,dog,horse,sheep,cow,elephant,bear,zebra,giraffe,backpack,umbrella,handbag,tie,suitcase,frisbee,skis,snowboard,sports ball,kite,baseball bat,baseball glove,skateboard,surfboard,tennis racket,bottle,wine glass,cup,fork,knife,spoon,bowl,banana,apple,sandwich,orange,broccoli,carrot,hot dog,pizza,donut,cake,chair,couch,potted plant,bed,dining table,toilet,tv,laptop,mouse,remote,keyboard,cell phone,microwave,oven,toaster,sink,refrigerator,book,clock,vase,scissors,teddy bear,hair drier,toothbrush'.split(',');
let stream=null,worker=null,ready=false,busy=false,running=false,generation=0,opening=false;
let detections=[],lock=null,timer=null,watchdog=null,lastVideoTime=-1,lastFrameAt=0,drawHandle=0;
let tracker=null,trackTimer=null,inferenceFrame=null,detectionFrame=null,lastTrackTime=-1;
let ink='#a5edb4',amber='#dfbc7d';
function theme(){
 try{document.body.dataset.theme=localStorage.getItem('tactical-theme')==='red'?'red':'green';}catch{}
 const style=getComputedStyle(document.body);ink=style.getPropertyValue('--accent').trim();amber=style.getPropertyValue('--lock').trim();
 $('confidence-value').value=$('confidence').value+'%';
 document.querySelector('meta[name=theme-color]').content=document.body.dataset.theme==='red'?'#100707':'#07100b';
}
theme();window.addEventListener('storage',theme);
function rect(){return contentRect(viewport.clientWidth,viewport.clientHeight,video.videoWidth||16,video.videoHeight||9);}
function pathArrow(x,y,direction,color){
 const angles={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2};
 ctx.save();ctx.translate(x,y);ctx.rotate(angles[direction]);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=3;
 ctx.beginPath();ctx.moveTo(-11,0);ctx.lineTo(10,0);ctx.stroke();ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(2,-7);ctx.lineTo(2,7);ctx.closePath();ctx.fill();ctx.restore();
}
function draw(){
 drawHandle=0;
 const w=viewport.clientWidth,h=viewport.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 if(!running)return;
 const r=rect(),x=r.x+r.w/2,y=r.y+r.h/2;
 ctx.strokeStyle=amber;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-16,y);ctx.lineTo(x+16,y);ctx.moveTo(x,y-16);ctx.lineTo(x,y+16);ctx.stroke();
 ctx.strokeStyle=ink;ctx.globalAlpha=.35;ctx.strokeRect(x-r.w*.045,y-r.h*.045,r.w*.09,r.h*.09);ctx.globalAlpha=1;
 function box(d,selected){
  const b=d.box,left=r.x+b.x1*r.w,top=r.y+b.y1*r.h,bw=(b.x2-b.x1)*r.w,bh=(b.y2-b.y1)*r.h;
  ctx.strokeStyle=selected?amber:ink;ctx.lineWidth=selected?3:1.5;ctx.setLineDash(selected&&lock.missing?[6,5]:[]);ctx.strokeRect(left,top,bw,bh);ctx.setLineDash([]);
  const text=(selected?'LOCK · ':'')+d.label+(selected?' · TRACKING':' '+Math.round(d.score*100)+'%');ctx.font='600 13px system-ui';
  const tw=ctx.measureText(text).width+12,tx=clamp(left,r.x,Math.max(r.x,r.x+r.w-tw)),ty=clamp(top-24,r.y,r.y+r.h-24);
  ctx.fillStyle='#000d';ctx.fillRect(tx,ty,tw,23);ctx.fillStyle=selected?amber:ink;ctx.fillText(text,tx+6,ty+16);
  if(selected&&!lock.missing){
   const g=guidance(b),c=centre(b);
   if(g.horizontal)pathArrow(clamp(g.horizontal==='right'?left+bw+18:left-18,r.x+16,r.x+r.w-16),r.y+c.y*r.h,g.horizontal,amber);
   if(g.vertical)pathArrow(r.x+c.x*r.w,clamp(g.vertical==='down'?top+bh+18:top-18,r.y+16,r.y+r.h-16),g.vertical,amber);
  }
 }
 for(const d of detections)box(d,false);
 if(lock&&!lock.lost)box(lock,true);
 const marker=$('exit-marker');marker.hidden=!lock?.exit;
 if(lock?.exit){
  const side=lock.exit,xx=side.includes('left')?.12:side.includes('right')?.88:.5,yy=side.includes('top')?.09:side.includes('bottom')?.85:.5;
  marker.style.left=r.x+r.w*xx+'px';marker.style.top=r.y+r.h*yy+'px';
  const arrows={'top-left':'↖',top:'↑','top-right':'↗',left:'←',right:'→','bottom-left':'↙',bottom:'↓','bottom-right':'↘'};
  marker.textContent=arrows[side]+' LIKELY EXIT';
  // Keep the indicator inside the viewfinder even on a narrow screen.
  const half=marker.offsetWidth/2+6;marker.style.left=clamp(r.x+r.w*xx,half,w-half)+'px';
 }
 drawHandle=requestAnimationFrame(draw);
}
function lockText(){
 $('unlock').disabled=!lock;
 if(!lock){$('lock-readout').textContent='NO LOCK · TAP AN OBJECT';return;}
 let state;
 if(lock.exit)state='LIKELY EXIT: '+lock.exit.replace('-', ' ').toUpperCase();
 else if(lock.lost)state='LOST · RELEASE / SCAN TO REACQUIRE';
 else if(lock.missing)state='SEARCHING';
 else{const g=guidance(lock.box);state=g.centred?'CENTRED':[g.vertical,g.horizontal].filter(Boolean).join(' + ').toUpperCase();}
 $('lock-readout').textContent=lock.label.toUpperCase()+' · '+state;
}
function pauseDetector(){
 clearTimeout(watchdog);clearTimeout(timer);worker?.terminate();worker=null;ready=false;busy=false;
}
function trackingFrame(){
 const scale=Math.min(1,320/Math.max(video.videoWidth,video.videoHeight));
 const w=Math.max(1,Math.round(video.videoWidth*scale)),h=Math.max(1,Math.round(video.videoHeight*scale));
 capture.width=w;capture.height=h;pixels.drawImage(video,0,0,w,h);
 return grayFrame(pixels.getImageData(0,0,w,h).data,w,h);
}
function choose(d){
 if(!running||lock)return;
 pauseDetector();
 lock=makeLock(d,performance.now());
 tracker=detectionFrame?new VisualTracker(detectionFrame,d.box):null;
 detections=[];listSignature='';listObjects();
 $('model-status').textContent='Visual tracker · YOLO stopped';
 $('status').textContent='Following only the locked object. Release / scan to find objects again.';
 lastTrackTime=-1;
 if(!tracker?.valid){
  lock.lost=true;lock.missing=true;
  $('status').textContent='Not enough visual detail to track this area. Release / scan and choose a textured object.';
  $('rate').textContent='Tracking unavailable';
 }else trackTimer=setTimeout(track,0);
 lockText();
}
function track(){
 if(!running||!lock||lock.lost||!tracker)return;
 const started=performance.now();
 try{
  if(video.readyState>=2&&video.currentTime!==lastTrackTime){
   lastTrackTime=video.currentTime;
   const result=tracker.update(trackingFrame()),now=performance.now();
   if(result){lock={...lock,box:result.box,seen:now,missing:false,exit:null};}
   else{
    const elapsed=now-lock.seen;
    lock={...lock,missing:true,lost:elapsed>900,exit:elapsed>250?exitSide(lock.box):null};
   }
   lockText();
   const elapsed=now-(lastFrameAt||now-66);lastFrameAt=now;
   $('rate').textContent=(1000/Math.max(1,elapsed)).toFixed(1)+' tracking updates/s';
   if(lock.lost){
    $('status').textContent='Visual lock lost. Release / scan to find and select an object again.';
    $('rate').textContent='Tracking lost · YOLO stopped';return;
   }
  }
  trackTimer=setTimeout(track,Math.max(0,66-(performance.now()-started)));
 }catch{
  lock={...lock,lost:true,missing:true};lockText();
  $('status').textContent='Tracker unavailable. Release / scan to retry.';
 }
}
function releaseLock(){
 clearTimeout(trackTimer);tracker=null;lock=null;detections=[];detectionFrame=null;lastVideoTime=-1;lastFrameAt=0;
 $('exit-marker').hidden=true;lockText();listSignature='';listObjects();
 if(running){$('status').textContent='Scanning for objects. Tap a box to lock and stop YOLO.';startDetector();}
}
let listSignature='';
function listObjects(){
 // Keep buttons stable between frames so keyboard/touch activation isn't interrupted.
 const signature=detections.map(d=>d.label).join('|')+';'+(lock?.label||'')+';'+Boolean(lock?.lost);
 if(signature===listSignature)return;listSignature=signature;
 const host=$('objects');host.replaceChildren();
 if(!detections.length){const p=document.createElement('p');p.textContent=lock?'YOLO stopped while locked. Use Release / scan to find objects.':running?'No objects detected. Try better lighting or a lower confidence.':'No detections yet.';host.append(p);return;}
 detections.forEach((d,i)=>{
  const button=document.createElement('button');button.type='button';button.textContent=d.label+' #'+(i+1);
  button.setAttribute('aria-label','Lock '+d.label+', object '+(i+1));
  button.setAttribute('aria-pressed',String(Boolean(lock&&!lock.lost&&lock.label===d.label&&Math.hypot(centre(lock.box).x-centre(d.box).x,centre(lock.box).y-centre(d.box).y)<.05)));
  button.addEventListener('click',()=>{if(detections[i])choose(detections[i]);});host.append(button);
 });
}
canvas.addEventListener('click',event=>{
 if(!running)return;
 const bounds=canvas.getBoundingClientRect(),r=rect(),x=(event.clientX-bounds.left-r.x)/r.w,y=(event.clientY-bounds.top-r.y)/r.h;
 const matches=detections.filter(d=>x>=d.box.x1&&x<=d.box.x2&&y>=d.box.y1&&y<=d.box.y2).sort((a,b)=>(a.box.x2-a.box.x1)*(a.box.y2-a.box.y1)-(b.box.x2-b.box.x1)*(b.box.y2-b.box.y1));
 if(matches[0])choose(matches[0]);
});
function haltDetector(message){
 pauseDetector();clearTimeout(trackTimer);tracker=null;inferenceFrame=null;detectionFrame=null;
 detections=[];lock=null;lockText();listSignature='';listObjects();$('model-status').textContent=message;$('rate').textContent='— detections/s';
}
function stopCamera(message='Camera stopped. Tap Open camera to resume.'){
 generation++;running=false;opening=false;
 stream?.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;
 haltDetector('Detector idle');cancelAnimationFrame(drawHandle);drawHandle=0;ctx.clearRect(0,0,canvas.width,canvas.height);
 $('exit-marker').hidden=true;$('placeholder').hidden=false;$('stop').disabled=true;$('start').disabled=false;$('camera-facing').disabled=false;
 $('status').textContent=message;
}
function schedule(){clearTimeout(timer);if(running&&ready&&!lock)timer=setTimeout(detect,100);}
function detect(){
 if(!running||!ready||busy||!worker||lock)return;
 if(video.readyState<2||video.currentTime===lastVideoTime){schedule();return;}
 lastVideoTime=video.currentTime;
 const scale=640/Math.max(video.videoWidth,video.videoHeight),w=Math.max(1,Math.round(video.videoWidth*scale)),h=Math.max(1,Math.round(video.videoHeight*scale));
 capture.width=w;capture.height=h;pixels.drawImage(video,0,0,w,h);
 const frame=pixels.getImageData(0,0,w,h);inferenceFrame=grayFrame(frame.data,w,h);busy=true;
 watchdog=setTimeout(()=>{haltDetector('Detection timed out. Stop and reopen the camera to retry.');},45000);
 worker.postMessage({type:'frame',generation,width:w,height:h,pixels:frame.data.buffer},[frame.data.buffer]);
}
function startDetector(){
 worker=new Worker(new URL('./camera-worker.js?v=1',import.meta.url));
 const detector=worker;
 watchdog=setTimeout(()=>haltDetector('Model loading timed out. Check your connection, then stop and reopen to retry.'),180000);
 worker.onerror=()=>{if(worker===detector&&!lock)haltDetector('Detector could not start. Check network access to jsDelivr / Hugging Face, then reopen.');};
 worker.onmessage=({data})=>{
  if(!running||worker!==detector||lock)return;
  if(data.type==='progress')$('model-status').textContent=data.message;
  if(data.type==='ready'){clearTimeout(watchdog);ready=true;$('model-status').textContent='YOLOv10n · on-device';schedule();}
  if(data.type==='error'){haltDetector('Detection unavailable: '+data.message+'. Stop and reopen to retry.');}
  if(data.type==='detections'){
   clearTimeout(watchdog);busy=false;if(data.generation!==generation)return;
   const now=performance.now();detectionFrame=inferenceFrame;
   detections=decode(new Float32Array(data.output),data.width,data.height,Number($('confidence').value)/100).map(d=>({...d,label:labels[d.classId]||'object'}));
   lockText();listObjects();
   $('rate').textContent=(1000/(now-(lastFrameAt||now-data.ms))).toFixed(1)+' detections/s';lastFrameAt=now;schedule();
  }
 };
 worker.postMessage({type:'init'});
}
async function openCamera(){
 if(opening||running)return;
 if(!navigator.mediaDevices?.getUserMedia){$('status').textContent='Camera unavailable. Open this HTTPS page in a browser with camera support.';return;}
 opening=true;const attempt=++generation;$('start').disabled=true;$('stop').disabled=false;$('camera-facing').disabled=true;
 $('status').textContent='Waiting for camera permission…';
 try{
  const media=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:$('camera-facing').value},width:{ideal:1280},height:{ideal:720}}});
  if(attempt!==generation||document.hidden){media.getTracks().forEach(track=>track.stop());return;}
  stream=media;video.srcObject=media;await video.play();
  if(attempt!==generation)return;
  running=true;opening=false;lastVideoTime=-1;lastFrameAt=0;
  $('placeholder').hidden=true;$('status').textContent='Tap a detected box or an object button to lock. Arrows show how to move the box to centre.';
  media.getVideoTracks()[0].addEventListener('ended',()=>{if(running)stopCamera('Camera disconnected. Tap Open camera to retry.');});
  lockText();listSignature='';listObjects();draw();startDetector();
 }catch(error){
  if(attempt!==generation)return;
  const messages={NotAllowedError:'Camera permission denied. Allow Camera in this site’s browser settings, then retry.',NotFoundError:'No camera was found on this device.',NotReadableError:'Camera is busy or unavailable. Close other camera apps, then retry.'};
  stopCamera(messages[error.name]||'Could not open the camera: '+error.message);
 }
}
$('start').addEventListener('click',openCamera);$('stop').addEventListener('click',()=>stopCamera());
$('unlock').addEventListener('click',releaseLock);
$('confidence').addEventListener('input',()=>{$('confidence-value').value=$('confidence').value+'%';});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(running||opening))stopCamera('Camera paused while the page was hidden. Tap Open camera to resume.');});
window.addEventListener('pagehide',()=>stopCamera());
