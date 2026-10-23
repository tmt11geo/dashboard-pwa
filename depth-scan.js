import {estimateMovement} from './depth-scan-motion.js?v=1';
import {CaptureGate,validateScene} from './depth-scan-core.js?v=1';
export function createScanner(hooks){
 const $=id=>document.getElementById(id);if(!$('scan-start'))return null;
 const gate=new CaptureGate(),canvas=document.createElement('canvas');canvas.width=72;canvas.height=72;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 let worker=null,tick=null,deadline=null,epoch=0,active=false,paused=false,busy=false,scene=null,preview=null,capturedPreview=null,flashTimer=null,pendingMoveCue=false;
 const tell=(message,state='hold')=>{for(const id of ['scan-guide','scan-overlay']){if($(id).textContent!==message)$(id).textContent=message;$(id).dataset.state=state;} $('scan-workspace').dataset.state=state;};
 function clearFlash(){clearTimeout(flashTimer);flashTimer=null;$('scan-workspace').classList.remove('move-flash');}
 function moveCue(){
  movementHint({state:'more',arrow:'↔',progress:0,message:'View added — move slightly sideways'});tell('✓ VIEW ADDED — MOVE NOW','move');clearFlash();
  // One soft pulse per accepted view, never on inference alone or rejection.
  void $('scan-workspace').offsetWidth;$('scan-workspace').classList.add('move-flash');
  flashTimer=setTimeout(clearFlash,1400);hooks.log('info','scan.moveCue',{views:scene.views});
 }
 function buttons(){
  $('scan-start').disabled=active||!!scene||hooks.state().running;
  for(const id of ['scan-pause','scan-camera-pause']){$(id).disabled=!active;$(id).textContent=paused?'Resume scan':'Pause scan';}
  $('scan-finish').disabled=!active;$('scan-save').disabled=!scene;
  $('scan-clear').disabled=active||!scene;$('scan-open').disabled=active||hooks.state().running;
  $('scan-count').textContent=scene?`${scene.views} accepted views · ${scene.points.length.toLocaleString()} points`:'No accepted views yet';
 }
 function stop(){
  clearFlash();pendingMoveCue=false;const wasActive=active;active=false;paused=false;busy=false;epoch++;clearInterval(tick);clearTimeout(deadline);tick=deadline=null;
  worker?.terminate();worker=null;$('scan-movement').hidden=true;$('scan-overlay').hidden=true;$('scan-camera-controls').hidden=true;buttons();
  if(wasActive)tell(scene?'Scan finished. Inspect the relief or save it to a file.':'Scan stopped. No view was accepted yet.','hold');
 }
 function movementHint(hint){
  const box=$('scan-movement');box.hidden=false;box.dataset.state=hint.state;
  $('scan-movement-arrow').textContent=hint.arrow;
  $('scan-movement-text').textContent=hint.message;
  $('scan-movement-progress').value=hint.progress;
  $('scan-movement-detail').textContent=hint.shift===undefined?'Small sideways steps; keep the phone pointing the same way':`Image shift ${hint.shift}% · aim for 6–14% · approximate`;
 }
 function sample(){
  const s=hooks.state();if(!active||paused||busy||!s.ready||s.inFlight||document.hidden||s.video.readyState<2)return;
  ctx.drawImage(s.video,0,0,72,72);const rgba=ctx.getImageData(0,0,72,72).data;
  const image=new Float32Array(72*72);for(let i=0;i<image.length;i++)image[i]=(rgba[i*4]+rgba[i*4+1]+rgba[i*4+2])/765;
  preview=image;const signal=gate.sample(image,performance.now());
  const hint=estimateMovement(gate.anchor,image);movementHint(hint);
  const positioned=hint.state==='first'||hint.state==='ready';
  if(signal.capture&&positioned){busy=true;capturedPreview=preview.slice();movementHint({state:'capture',arrow:'Ⅱ',progress:100,message:'Hold still — capturing'});tell('◷ CAPTURING — wait for green','capture');if(!hooks.capture()){busy=false;gate.complete(performance.now(),preview,false);}}
  else if(performance.now()>=gate.nextAt||hint.state==='back'||hint.state==='lost'){
   if(!positioned){tell(hint.arrow+' '+hint.message,hint.state==='more'?'move':'lost');return;}
   if(signal.state==='retry'){movementHint({...hint,state:'lost',message:'Last capture rejected — adjust your view slightly'});return;}
   if(signal.state==='slow')tell('⚠ SLOW DOWN — keep overlap','slow');
   else if(signal.state==='move')tell('→ MOVE NOW — slightly sideways','move');
   else tell('Ⅱ HOLD STILL — steady the phone','hold');
  }
 }
 function begin(){
  epoch++;active=true;paused=false;busy=false;gate.reset();$('scan-overlay').hidden=false;$('scan-camera-controls').hidden=false;
  worker=new Worker(new URL('./depth-scan-worker.js?v=1',import.meta.url),{type:'module'});
  const mine=epoch;
  worker.onmessage=({data})=>{
   if(mine!==epoch||!active||data.id!==mine)return;clearTimeout(deadline);deadline=null;busy=false;
   if(data.ok){scene=validateScene(data.scene);hooks.show(scene);if(paused){pendingMoveCue=true;tell('✓ VIEW ADDED — scan paused','paused');}else moveCue();}
   else tell('⚠ NOT ADDED — '+data.reason,'lost');
   gate.complete(performance.now(),capturedPreview,data.ok);
   hooks.log(data.ok?'info':'warn','scan.alignment',{accepted:data.ok,views:scene?.views||0,points:scene?.points.length||0,matches:data.matches,inliers:data.inliers,error:data.error,reprojection:data.reprojection,reason:data.reason});
   buttons();if(data.full){hooks.stop();tell(data.reason,'hold');}
  };
  worker.onerror=()=>{hooks.stop();tell('Alignment worker failed. The accepted scene is retained. Save it and restart.','lost');};
  tell('◷ Loading camera and depth model…','capture');$('scan-workspace').scrollIntoView({behavior:'smooth',block:'start'});tick=setInterval(sample,200);buttons();
 }
 function result(data){
  if(!active)return;
  if(!data.rawDepth){hooks.stop();tell('Raw depth is unavailable. Use TFJS WebGL for scanning.','lost');return;}
  busy=true;tell(paused?'Ⅱ PAUSED — current capture may finish':'◷ ALIGNING — wait for green',paused?'paused':'capture');
  deadline=setTimeout(()=>{hooks.stop();tell('Alignment timed out. The accepted scene is retained.','lost');},15000);
  worker.postMessage({type:'frame',id:epoch,frame:{width:data.width,height:data.height,raw:data.rawDepth,pixels:data.pixels,orientation:data.capture?.orientation??0,capturedAt:data.capture?.timestamp}},[data.rawDepth,data.pixels]);
 }
 $('scan-start').addEventListener('click',()=>{if(active||scene)return;hooks.start();});
 $('scan-pause').addEventListener('click',()=>{if(!active)return;paused=!paused;gate.previous=null;gate.stillSince=null;buttons();clearFlash();if(paused){$('scan-movement').hidden=true;tell('Ⅱ PAUSED — current capture may finish','paused');}else if(pendingMoveCue){pendingMoveCue=false;moveCue();}else if(busy)tell('◷ CAPTURING — wait for green','capture');else tell(scene?'→ MOVE NOW — slightly sideways':'Ⅱ HOLD STILL — steady the phone',scene?'move':'hold');});
 $('scan-finish').addEventListener('click',()=>hooks.stop());
 $('scan-camera-finish').addEventListener('click',()=>hooks.stop());
 $('scan-camera-pause').addEventListener('click',()=>$('scan-pause').click());
 $('scan-clear').addEventListener('click',()=>{if(active)return;scene=null;gate.reset();hooks.show(null);buttons();tell('Scene cleared. Start a new scan.');});
 $('scan-save').addEventListener('click',()=>{
  if(!scene)return;const url=URL.createObjectURL(new Blob([JSON.stringify(scene)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='tactical-relief-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);tell('Save requested. Keep the downloaded file to reopen this scene.');
 });
 $('scan-open').addEventListener('click',()=>$('scan-file').click());
 $('scan-file').addEventListener('change',async()=>{
  const file=$('scan-file').files?.[0];if(!file)return;
  const mine=epoch;
  try{if(file.size>8*1024*1024)throw Error('Relief file is too large');const loaded=validateScene(JSON.parse(await file.text()));if(active||hooks.state().running||mine!==epoch)return;scene=loaded;hooks.show(scene);buttons();tell('Saved scene opened for inspection. Clear it before starting a new scan.');}
  catch(e){tell('Unable to open scene: '+e.message,'lost');}finally{$('scan-file').value='';}
 });
 buttons();return {begin,stop,result,buttons,get active(){return active;},get scene(){return scene;}};
}
