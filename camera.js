import {fullView,zoomRegion,zoomAt,panView,imagePoint,imageBox,viewBox,followRegion,cropGray,selectionBox} from './camera-zoom.js?v=2';
import {VisualTracker,grayFrame} from './camera-tracker.js?v=3';
import {clamp,centre,guidance,makeLock,exitSide,reacquireCandidate,sameReacquisition,contentRect,decode} from './camera-core.js?v=3';
const $=id=>document.getElementById(id);
const video=$('video'),canvas=$('overlay'),ctx=canvas.getContext('2d'),viewport=$('viewfinder');
const capture=document.createElement('canvas'),pixels=capture.getContext('2d',{willReadFrequently:true});
const inferenceCapture=document.createElement('canvas'),inferencePixels=inferenceCapture.getContext('2d',{willReadFrequently:true});
const labels='person,bicycle,car,motorcycle,airplane,bus,train,truck,boat,traffic light,fire hydrant,stop sign,parking meter,bench,bird,cat,dog,horse,sheep,cow,elephant,bear,zebra,giraffe,backpack,umbrella,handbag,tie,suitcase,frisbee,skis,snowboard,sports ball,kite,baseball bat,baseball glove,skateboard,surfboard,tennis racket,bottle,wine glass,cup,fork,knife,spoon,bowl,banana,apple,sandwich,orange,broccoli,carrot,hot dog,pizza,donut,cake,chair,couch,potted plant,bed,dining table,toilet,tv,laptop,mouse,remote,keyboard,cell phone,microwave,oven,toaster,sink,refrigerator,book,clock,vase,scissors,teddy bear,hair drier,toothbrush'.split(',');
let stream=null,worker=null,ready=false,busy=false,running=false,generation=0,opening=false;
let detections=[],lock=null,timer=null,watchdog=null,lastVideoTime=-1,lastFrameAt=0,drawHandle=0;
let tracker=null,trackTimer=null,inferenceFrame=null,detectionFrame=null,lastTrackTime=-1;
let reacquiring=null,reacquireTimer=null;
let bitmapWorker=null,bitmapTimer=null,bitmapWatchdog=null,bitmapBusy=false,bitmapFrame=null,lastBitmapTime=-1;
let view=fullView(),viewRevision=0,inferenceRevision=0,inferenceRegion=zoomRegion(view),trackerRegion=zoomRegion(view),trackingScale=1;
let suppressTapUntil=0;const pointers=new Map();let gesture=null,gestureMoved=false;
let manualSelecting=false,manualDraft=null;
let ink='#a5edb4',amber='#dfbc7d';
function theme(){
 try{document.body.dataset.theme=localStorage.getItem('tactical-theme')==='red'?'red':'green';}catch{}
 const style=getComputedStyle(document.body);ink=style.getPropertyValue('--accent').trim();amber=style.getPropertyValue('--lock').trim();
 $('confidence-value').value=$('confidence').value+'%';
 document.querySelector('meta[name=theme-color]').content=document.body.dataset.theme==='red'?'#100707':'#07100b';
}
theme();window.addEventListener('storage',theme);
function rect(){return contentRect(viewport.clientWidth,viewport.clientHeight,video.videoWidth||16,video.videoHeight||9);}
function layoutImage(){
 const r=rect(),region=zoomRegion(view),stage=$('camera-image');
 Object.assign(stage.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});
 video.style.transform='translate('+(-region.x1*view.scale*100)+'%,'+(-region.y1*view.scale*100)+'%) scale('+view.scale+')';
}
function syncZoomControls(){
 const enabled=running&&!lock;
 $('select-area').disabled=!running;$('select-area').textContent=manualSelecting?'Cancel selection':'Select area';$('select-area').setAttribute('aria-pressed',String(manualSelecting));
 viewport.dataset.selecting=String(manualSelecting);
 $('zoom-in').disabled=!enabled||view.scale>=8;$('zoom-out').disabled=!enabled||view.scale<=1;$('zoom-reset').disabled=!enabled||view.scale===1;
 $('zoom-value').textContent=view.scale.toFixed(1).replace('.0','')+'× · '+(view.scale>1?'Selection area':'Full view');
 $('objects-title').textContent=view.scale>1?'Objects in zoomed area':'Objects in view';
}
function setView(next,invalidate=true){
 view=next;layoutImage();syncZoomControls();
 if(!invalidate)return;
 manualDraft=null;viewRevision++;detections=[];detectionFrame=null;lastVideoTime=-1;listSignature='';listObjects();
 $('status').textContent=manualSelecting?'Drag a box around the object. Pinch to zoom first if needed.':view.scale>1?'Scanning only the zoomed area. Tap a labelled object to follow it in the full image.':'Scanning the full view. Pinch to zoom or tap an object.';
 schedule();
}
function localPoint(event){
 const bounds=canvas.getBoundingClientRect(),r=rect();
 return {x:(event.clientX-bounds.left-r.x)/r.w,y:(event.clientY-bounds.top-r.y)/r.h};
}
function startGesture(){
 const points=[...pointers.values()];
 if(!points.length){gesture=null;return;}
 const a=points[0],b=points[1];
 gesture={view:{...view},anchor:b?{x:(a.x+b.x)/2,y:(a.y+b.y)/2}:a,distance:b?Math.max(.001,Math.hypot((b.x-a.x)*rect().w,(b.y-a.y)*rect().h)):null};
}
canvas.addEventListener('pointerdown',event=>{
 if(!running||lock||event.button>0)return;
 const p=localPoint(event);if(p.x<0||p.x>1||p.y<0||p.y>1)return;
 if(!pointers.size)gestureMoved=false;
 pointers.set(event.pointerId,p);canvas.setPointerCapture?.(event.pointerId);
 if(manualSelecting){manualDraft=pointers.size===1?{id:event.pointerId,start:p,end:p}:null;}
 if(pointers.size>1)gestureMoved=true;startGesture();
});
canvas.addEventListener('pointermove',event=>{
 if(!pointers.has(event.pointerId)||!gesture||lock)return;
 pointers.set(event.pointerId,localPoint(event));
 const points=[...pointers.values()],a=points[0],b=points[1];
 if(manualSelecting&&manualDraft&&!b){event.preventDefault();manualDraft.end={x:clamp(a.x),y:clamp(a.y)};gestureMoved=true;return;}
 if(b&&gesture.distance){
  event.preventDefault();gestureMoved=true;
  const middle={x:(a.x+b.x)/2,y:(a.y+b.y)/2},distance=Math.hypot((b.x-a.x)*rect().w,(b.y-a.y)*rect().h);
  setView(zoomAt(gesture.view,gesture.view.scale*distance/gesture.distance,gesture.anchor,middle));
 }else if(!b&&view.scale>1){
  const dx=a.x-gesture.anchor.x,dy=a.y-gesture.anchor.y;
  if(Math.hypot(dx*rect().w,dy*rect().h)>5){event.preventDefault();gestureMoved=true;setView(panView(gesture.view,dx,dy));}
 }
});
function endGesture(event){
 if(!pointers.has(event.pointerId))return;
 const draft=manualSelecting&&manualDraft?.id===event.pointerId?manualDraft:null;
 if(draft){manualDraft=null;suppressTapUntil=performance.now()+400;
  pointers.delete(event.pointerId);canvas.releasePointerCapture?.(event.pointerId);startGesture();
  if(event.type!=='pointercancel')completeManualSelection(draft.start,localPoint(event));
  return;
 }
 if(gestureMoved||event.type==='pointercancel')suppressTapUntil=performance.now()+400;
 pointers.delete(event.pointerId);canvas.releasePointerCapture?.(event.pointerId);startGesture();
}
canvas.addEventListener('pointerup',endGesture);canvas.addEventListener('pointercancel',endGesture);
$('zoom-in').addEventListener('click',()=>{if(running&&!lock)setView(zoomAt(view,view.scale*1.5));});
$('zoom-out').addEventListener('click',()=>{if(running&&!lock)setView(zoomAt(view,view.scale/1.5));});
$('zoom-reset').addEventListener('click',()=>{if(running&&!lock)setView(fullView());});
$('select-area').addEventListener('click',toggleManualSelection);
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
 layoutImage();const r=rect(),x=r.x+r.w/2,y=r.y+r.h/2;
 ctx.strokeStyle=amber;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-16,y);ctx.lineTo(x+16,y);ctx.moveTo(x,y-16);ctx.lineTo(x,y+16);ctx.stroke();
 ctx.strokeStyle=ink;ctx.globalAlpha=.35;ctx.strokeRect(x-r.w*.045,y-r.h*.045,r.w*.09,r.h*.09);ctx.globalAlpha=1;
 function box(d,selected){
  const b=viewBox(d.box,zoomRegion(view)),left=r.x+b.x1*r.w,top=r.y+b.y1*r.h,bw=(b.x2-b.x1)*r.w,bh=(b.y2-b.y1)*r.h;
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
 ctx.save();ctx.beginPath();ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();
 for(const d of detections)box(d,false);
 if(lock&&!lock.lost)box(lock,true);
 if(manualDraft){
  const a=manualDraft.start,b=manualDraft.end,left=r.x+Math.min(a.x,b.x)*r.w,top=r.y+Math.min(a.y,b.y)*r.h;
  ctx.strokeStyle=amber;ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.fillStyle='#dfbc7d18';
  ctx.fillRect(left,top,Math.abs(b.x-a.x)*r.w,Math.abs(b.y-a.y)*r.h);ctx.strokeRect(left,top,Math.abs(b.x-a.x)*r.w,Math.abs(b.y-a.y)*r.h);ctx.setLineDash([]);
 }
 ctx.restore();
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
 syncZoomControls();$('unlock').disabled=!lock;
 if(!lock){$('lock-readout').textContent=manualSelecting?'DRAW A BOX · PINCH TO ZOOM':'NO LOCK · TAP AN OBJECT';return;}
 let state;
 if(reacquiring)state=(reacquiring.kind==='bitmap'?'REACQUIRING BITMAP · ':'REACQUIRING · ')+(lock.exit||'').replace('-',' ').toUpperCase();
 else if(lock.exit)state='LIKELY EXIT: '+lock.exit.replace('-', ' ').toUpperCase();
 else if(lock.lost)state='LOST · RELEASE / SCAN TO REACQUIRE';
 else if(lock.missing)state='SEARCHING';
 else{const g=guidance(lock.box);state=g.centred?'CENTRED':'MOVE DEVICE '+[g.vertical,g.horizontal].filter(Boolean).join(' + ').toUpperCase();}
 $('lock-readout').textContent=lock.label.toUpperCase()+' · '+state;
}
function pauseDetector(){
 stopBitmapSearch();
 clearTimeout(watchdog);clearTimeout(timer);worker?.terminate();worker=null;ready=false;busy=false;
}
function snapshotFrame(){
 const scale=Math.min(1,1280/Math.max(video.videoWidth,video.videoHeight)),w=Math.max(1,Math.round(video.videoWidth*scale)),h=Math.max(1,Math.round(video.videoHeight*scale));
 capture.width=w;capture.height=h;pixels.drawImage(video,0,0,w,h);
 return grayFrame(pixels.getImageData(0,0,w,h).data,w,h,1280);
}
function toggleManualSelection(){
 if(!running)return;
 if(manualSelecting){
  manualSelecting=false;manualDraft=null;pointers.clear();gesture=null;lockText();listSignature='';listObjects();
  $('status').textContent='Scanning for objects. Tap a label, or Select area to draw a box.';startDetector();return;
 }
 pauseDetector();clearTimeout(trackTimer);clearTimeout(reacquireTimer);reacquiring=null;tracker=null;lock=null;detections=[];detectionFrame=null;
 manualSelecting=true;manualDraft=null;pointers.clear();gesture=null;viewRevision++;lastVideoTime=-1;
 $('exit-marker').hidden=true;$('model-status').textContent='Manual selection · YOLO stopped';$('rate').textContent='Draw an image patch';
 $('status').textContent='Drag a box around the object. Pinch to zoom first if needed. Include visible detail; avoid excess background.';
 lockText();listSignature='';listObjects();
}
function completeManualSelection(start,end){
 if(!running||!manualSelecting)return;
 const box=selectionBox(start,end,zoomRegion(view),rect());
 if(!box){$('status').textContent='Draw a larger box (at least 12 pixels in each direction).';return;}
 if(video.readyState<2){$('status').textContent='Waiting for a camera frame. Try drawing the box again.';return;}
 try{
  detectionFrame=snapshotFrame();
  if(!choose({kind:'manual',label:'Manual target',score:1,box}))$('status').textContent='This area has too little visual detail. Draw a larger box around a textured part, or zoom in first.';
 }catch{$('status').textContent='Could not capture the selected area. Draw the box again.';}
}
function trackingFrame(region){
 const sw=video.videoWidth*(region.x2-region.x1),sh=video.videoHeight*(region.y2-region.y1);
 const scale=Math.min(1,1280/Math.max(video.videoWidth,video.videoHeight),320/Math.max(sw,sh));
 const w=Math.max(1,Math.round(sw*scale)),h=Math.max(1,Math.round(sh*scale));
 capture.width=w;capture.height=h;pixels.drawImage(video,region.x1*video.videoWidth,region.y1*video.videoHeight,sw,sh,0,0,w,h);
 return grayFrame(pixels.getImageData(0,0,w,h).data,w,h);
}
function choose(d,automatic=false){
 if(!running||(lock&&!reacquiring))return false;
 const selectedScale=d.kind==='manual'?clamp(Math.max(view.scale,.12/Math.min(d.box.x2-d.box.x1,d.box.y2-d.box.y1)),1,8):view.scale;
 const selectionRegion=d.kind==='manual'?followRegion(d.box,selectedScale):zoomRegion(view);
 const nextTracker=detectionFrame?new VisualTracker(cropGray(detectionFrame,selectionRegion),viewBox(d.box,selectionRegion)):null;
 if((automatic||d.kind==='manual')&&!nextTracker?.valid)return false;
 manualSelecting=false;manualDraft=null;
 clearTimeout(reacquireTimer);reacquiring=null;
 pauseDetector();
 lock=makeLock(d,performance.now());
 tracker=nextTracker;trackerRegion=selectionRegion;trackingScale=selectedScale;
 setView(fullView(),false);
 detections=[];listSignature='';listObjects();
 $('model-status').textContent='Visual tracker · YOLO stopped';
 $('status').textContent=d.kind==='manual'?'Following your selected image patch. Select area to draw a new target, or Release / scan for YOLO.':'Following only the locked object. Release / scan to find objects again.';
 lastTrackTime=-1;
 if(!tracker?.valid){
  lock.lost=true;lock.missing=true;
  $('status').textContent='Not enough visual detail to track this area. Release / scan and choose a textured object.';
  $('rate').textContent='Tracking unavailable';
 }else trackTimer=setTimeout(track,0);
 lockText();return true;
}
function beginReacquire(){
 if(!running||!lock?.exit||reacquiring||!tracker)return;
 clearTimeout(trackTimer);
 reacquiring={kind:lock.kind==='manual'?'bitmap':'yolo',reference:tracker,started:performance.now(),candidate:null,hits:0};
 tracker=null;lock={...lock,lost:true,missing:true};detections=[];lastVideoTime=-1;lastFrameAt=0;
 $('status').textContent=reacquiring.kind==='bitmap'?'Likely exit. Searching up to 30 seconds for your saved image patch; confirming before relocking.':'Likely exit. Searching up to 30 seconds for the same '+lock.label+'; matching appearance before relocking.';
 $('model-status').textContent=reacquiring.kind==='bitmap'?'Bitmap search · YOLO stopped':'Restarting YOLO · reacquiring '+lock.label;
 lockText();listSignature='';listObjects();
 reacquireTimer=setTimeout(()=>finishReacquire('Automatic search ended without a reliable match. Release / scan to try again.'),30000);
 if(reacquiring.kind==='bitmap')startBitmapSearch();else startDetector();
}
function finishReacquire(message){
 pauseDetector();clearTimeout(reacquireTimer);reacquiring=null;tracker=null;detections=[];
 if(lock)lock={...lock,lost:true,missing:true};
 $('status').textContent=message;$('model-status').textContent='Search stopped · YOLO stopped';$('rate').textContent='No reliable match';
 lockText();listSignature='';listObjects();
}
function tryReacquire(){
 if(!reacquiring||reacquiring.kind==='bitmap'||!detectionFrame)return false;
 const candidate=reacquireCandidate(lock,detections,d=>reacquiring.reference.similarity(detectionFrame,d.box),(performance.now()-reacquiring.started)/1000);
 if(!candidate){reacquiring.candidate=null;reacquiring.hits=0;return false;}
 reacquiring.hits=sameReacquisition(reacquiring.candidate,candidate)?reacquiring.hits+1:1;reacquiring.candidate=candidate;
 if(reacquiring.hits<2)return false;
 if(choose(candidate,true)){$('status').textContent='Object reacquired. Visual tracking resumed; YOLO stopped.';return true;}
 return false;
}
function stopBitmapSearch(){
 clearTimeout(bitmapTimer);clearTimeout(bitmapWatchdog);bitmapWorker?.terminate();bitmapWorker=null;bitmapBusy=false;bitmapFrame=null;
}
function scheduleBitmap(delay=250){
 clearTimeout(bitmapTimer);if(running&&reacquiring?.kind==='bitmap'&&bitmapWorker)bitmapTimer=setTimeout(scanBitmap,delay);
}
function scanBitmap(){
 if(!running||reacquiring?.kind!=='bitmap'||!bitmapWorker||bitmapBusy)return;
 if(video.readyState<2||video.currentTime===lastBitmapTime){scheduleBitmap();return;}
 try{
  lastBitmapTime=video.currentTime;bitmapFrame=snapshotFrame();bitmapBusy=true;
  bitmapWatchdog=setTimeout(()=>finishReacquire('Bitmap search stalled. Select area to draw a new target.'),10000);
  const copy=bitmapFrame.data.slice();
  bitmapWorker.postMessage({type:'frame',width:bitmapFrame.width,height:bitmapFrame.height,pixels:copy.buffer,seconds:(performance.now()-reacquiring.started)/1000},[copy.buffer]);
 }catch{finishReacquire('Could not capture an image for bitmap search. Select area to try again.');}
}
function startBitmapSearch(){
 lastBitmapTime=-1;bitmapBusy=false;
 try{
  const searcher=new Worker(new URL('./camera-bitmap-worker.js?v=1',import.meta.url),{type:'module'});bitmapWorker=searcher;
  const active=()=>running&&bitmapWorker===searcher&&reacquiring?.kind==='bitmap';
  bitmapWatchdog=setTimeout(()=>finishReacquire('Bitmap search could not start. Select area to try again.'),15000);
  searcher.onerror=()=>{if(active())finishReacquire('Bitmap search unavailable. Select area to try again.');};
  searcher.onmessage=({data})=>{
   if(!active())return;
   clearTimeout(bitmapWatchdog);
   if(data.type==='ready'){scheduleBitmap(0);return;}
   if(data.type==='error'){finishReacquire('Bitmap search failed. Select area to try again.');return;}
   if(data.type!=='match')return;
   bitmapBusy=false;const candidate=data.match;
   if(candidate){
    reacquiring.hits=sameReacquisition(reacquiring.candidate,candidate)?reacquiring.hits+1:1;reacquiring.candidate=candidate;
    if(reacquiring.hits>=3){
     detectionFrame=bitmapFrame;
     if(choose(candidate,true)){$('status').textContent='Bitmap target reacquired. Visual tracking resumed; search and YOLO stopped.';return;}
    }
   }else{reacquiring.hits=0;reacquiring.candidate=null;}
   $('rate').textContent='Bitmap search · '+(candidate?'confirming '+reacquiring.hits+'/3':'waiting for a reliable match');
   scheduleBitmap(Math.max(0,250-data.ms));
  };
  const ref=reacquiring.reference;
  searcher.postMessage({type:'init',reference:{anchor:ref.anchor,recent:ref.template,box:lock.box,side:lock.exit}});
 }catch{finishReacquire('Bitmap search unavailable. Select area to draw a new target.');}
}
function track(){
 if(!running||!lock||lock.lost||!tracker)return;
 const started=performance.now();
 try{
  if(video.readyState>=2&&video.currentTime!==lastTrackTime){
   lastTrackTime=video.currentTime;
   const region=followRegion(lock.box,trackingScale);tracker.reframe(trackerRegion,region);trackerRegion=region;
   const result=tracker.update(trackingFrame(region)),now=performance.now();
   if(result){lock={...lock,box:imageBox(result.box,region),seen:now,missing:false,exit:null};}
   else{
    const elapsed=now-lock.seen;
    lock={...lock,missing:true,lost:elapsed>900,exit:elapsed>250?exitSide(lock.box):null};
   }
   if(lock.exit){
    beginReacquire();return;
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
 manualSelecting=false;manualDraft=null;
 clearTimeout(reacquireTimer);reacquiring=null;pauseDetector();
 setView(fullView(),false);
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
 if(!detections.length){const p=document.createElement('p');p.textContent=manualSelecting?'Draw a box directly in the camera view. No YOLO label is required.':reacquiring?(reacquiring.kind==='bitmap'?'Searching for your saved image patch. Select area to replace it, or Release / scan for YOLO.':'YOLO is searching for the locked object. Release / scan cancels this search.'):lock?'YOLO stopped while locked. Use Release / scan to find objects.':running?'No objects detected. Try better lighting or a lower confidence.':'No detections yet.';host.append(p);return;}
 detections.forEach((d,i)=>{
  const button=document.createElement('button');button.type='button';button.textContent=d.label+' #'+(i+1);
  button.setAttribute('aria-label','Lock '+d.label+', object '+(i+1));
  button.setAttribute('aria-pressed',String(Boolean(lock&&!lock.lost&&lock.label===d.label&&Math.hypot(centre(lock.box).x-centre(d.box).x,centre(lock.box).y-centre(d.box).y)<.05)));
  button.addEventListener('click',()=>{if(detections[i])choose(detections[i]);});host.append(button);
 });
}
canvas.addEventListener('click',event=>{
 if(!running||manualSelecting||performance.now()<suppressTapUntil)return;
 const local=localPoint(event);if(local.x<0||local.x>1||local.y<0||local.y>1)return;
 const {x,y}=imagePoint(local,zoomRegion(view));
 const matches=detections.filter(d=>x>=d.box.x1&&x<=d.box.x2&&y>=d.box.y1&&y<=d.box.y2).sort((a,b)=>(a.box.x2-a.box.x1)*(a.box.y2-a.box.y1)-(b.box.x2-b.box.x1)*(b.box.y2-b.box.y1));
 if(matches[0])choose(matches[0]);
});
function haltDetector(message){
 if(reacquiring&&running){finishReacquire(message);return;}
 clearTimeout(reacquireTimer);reacquiring=null;
 pauseDetector();clearTimeout(trackTimer);tracker=null;inferenceFrame=null;detectionFrame=null;
 detections=[];lock=null;lockText();listSignature='';listObjects();$('model-status').textContent=message;$('rate').textContent='— detections/s';
}
function stopCamera(message='Camera stopped. Tap Open camera to resume.'){
 generation++;running=false;opening=false;manualSelecting=false;manualDraft=null;pointers.clear();gesture=null;setView(fullView(),false);
 stream?.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;
 haltDetector('Detector idle');cancelAnimationFrame(drawHandle);drawHandle=0;ctx.clearRect(0,0,canvas.width,canvas.height);
 $('exit-marker').hidden=true;$('placeholder').hidden=false;$('stop').disabled=true;$('start').disabled=false;$('camera-facing').disabled=false;
 $('status').textContent=message;
}
function schedule(){clearTimeout(timer);if(running&&ready&&!manualSelecting&&(!lock||reacquiring))timer=setTimeout(detect,100);}
function detect(){
 if(!running||manualSelecting||!ready||busy||!worker||(lock&&!reacquiring))return;
 if(video.readyState<2||video.currentTime===lastVideoTime){schedule();return;}
 lastVideoTime=video.currentTime;
 // Freeze one full frame for both cropped inference and the eventual tracker handoff.
 const snapshotScale=Math.min(1,1280/Math.max(video.videoWidth,video.videoHeight));
 const fullW=Math.max(1,Math.round(video.videoWidth*snapshotScale)),fullH=Math.max(1,Math.round(video.videoHeight*snapshotScale));
 capture.width=fullW;capture.height=fullH;pixels.drawImage(video,0,0,fullW,fullH);
 inferenceFrame=grayFrame(pixels.getImageData(0,0,fullW,fullH).data,fullW,fullH,1280);
 inferenceRegion=zoomRegion(view);inferenceRevision=viewRevision;
 const sw=fullW*(inferenceRegion.x2-inferenceRegion.x1),sh=fullH*(inferenceRegion.y2-inferenceRegion.y1),scale=640/Math.max(sw,sh);
 const w=Math.max(1,Math.round(sw*scale)),h=Math.max(1,Math.round(sh*scale));
 inferenceCapture.width=w;inferenceCapture.height=h;
 inferencePixels.drawImage(capture,inferenceRegion.x1*fullW,inferenceRegion.y1*fullH,sw,sh,0,0,w,h);
 const frame=inferencePixels.getImageData(0,0,w,h);busy=true;
 watchdog=setTimeout(()=>{haltDetector('Detection timed out. Stop and reopen the camera to retry.');},45000);
 worker.postMessage({type:'frame',generation,width:w,height:h,pixels:frame.data.buffer},[frame.data.buffer]);
}
function startDetector(){
 worker=new Worker(new URL('./camera-worker.js?v=1',import.meta.url));
 const detector=worker;
 watchdog=setTimeout(()=>haltDetector('Model loading timed out. Check your connection, then stop and reopen to retry.'),180000);
 worker.onerror=()=>{if(worker===detector&&(!lock||reacquiring))haltDetector('Detector could not start. Check network access to jsDelivr / Hugging Face, then reopen.');};
 worker.onmessage=({data})=>{
  if(!running||worker!==detector||(lock&&!reacquiring))return;
  if(data.type==='progress')$('model-status').textContent=data.message;
  if(data.type==='ready'){clearTimeout(watchdog);ready=true;$('model-status').textContent=reacquiring?'YOLO · reacquiring '+lock.label:'YOLOv10n · on-device';schedule();}
  if(data.type==='error'){haltDetector('Detection unavailable: '+data.message+'. Stop and reopen to retry.');}
  if(data.type==='detections'){
   clearTimeout(watchdog);busy=false;if(data.generation!==generation)return;
   if(inferenceRevision!==viewRevision){schedule();return;}
   const now=performance.now();detectionFrame=inferenceFrame;
   detections=decode(new Float32Array(data.output),data.width,data.height,Number($('confidence').value)/100).map(d=>({...d,box:imageBox(d.box,inferenceRegion),label:labels[d.classId]||'object'}));
   if(tryReacquire())return;
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
  $('placeholder').hidden=true;$('status').textContent='Tap a detected box or an object button to lock. Arrows show which direction to move the device to centre the object.';
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
