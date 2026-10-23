const $=id=>document.getElementById(id),video=$('video'),overlay=$('overlay');
const WIDTH=640,HEIGHT=480,BUILD='calibration-1';
let stream=null,worker=null,views=[],calibration=null,metadata=null,ready=false,busy=false,generation=0,requestId=0,pending=null,deadline=null,overlayTimer=null;
const prompts=['Board centred, nearly straight.','Board centred, a little closer.','Board towards the upper-left quarter, tilted left.','Board towards the upper-left quarter, tilted right.','Board towards the upper-right quarter, tilted right.','Board towards the upper-right quarter, tilted left.','Board towards the lower-left quarter, tilted upward.','Board towards the lower-left quarter, tilted downward.','Board towards the lower-right quarter, tilted downward.','Board towards the lower-right quarter, tilted upward.','Board centred, tilted left about 20–30°.','Board centred, tilted right about 20–30°.','Board centred, top tilted away about 20–30°.','Board centred, bottom tilted away about 20–30°.','Board at a different distance, tilted left and upward.','Board at a different distance, tilted right and downward.'];
function message(text){$('status').textContent=text;}
function controls(){
 document.body.classList.toggle('capturing',!!stream||!!worker||views.length>0);
 $('start').disabled=!!stream||busy||views.length>0;$('capture').disabled=!ready||busy||views.length>=24;$('stop').disabled=!stream&&!worker&&!busy;
 $('undo').disabled=!ready||busy||!views.length;$('validate').disabled=!ready||busy||views.length<16;$('save').disabled=!views.length||busy;$('clear').disabled=busy||(!views.length&&!stream);
 $('count').textContent=`${views.length} / 16 views${views.length>16?' · extra views':''}`;$('progress').value=Math.min(views.length,16);
 $('phase').textContent=busy?'Working…':ready?'Camera ready':'Camera off';$('guidance').textContent=prompts[views.length]||'Ready to validate. If asked for more views, use a new position and tilt; maximum 24 views.';
}
function closeCamera(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;$('placeholder').hidden=false;}
function stop(text='Camera stopped. Save your session, or clear it to start again.'){
 generation++;ready=false;busy=false;clearTimeout(deadline);clearTimeout(overlayTimer);overlay.hidden=true;
 if(pending){pending.reject(Error('Session stopped.'));pending=null;}worker?.terminate();worker=null;closeCamera();controls();message(text);
}
function request(type,extra={},transfers=[]){
 if(!worker||pending)return Promise.reject(Error('Calibration worker unavailable or busy.'));
 return new Promise((resolve,reject)=>{const id=++requestId;pending={resolve,reject,id};deadline=setTimeout(()=>{stop('Processing timed out. Your saved views are still available to export.');},type==='init'?90000:type==='calibrate'?60000:20000);worker.postMessage({id,type,...extra},transfers);});
}
function cropFor(width,height){const ratio=WIDTH/HEIGHT;return width/height>ratio?{x:(width-height*ratio)/2,y:0,width:height*ratio,height}:{x:0,y:(height-width/ratio)/2,width,height:width/ratio};}
function settings(){const t=stream.getVideoTracks()[0],s=t.getSettings(),c=cropFor(video.videoWidth,video.videoHeight);return {deviceId:s.deviceId||null,label:t.label,sourceWidth:video.videoWidth,sourceHeight:video.videoHeight,crop:c,outputWidth:WIDTH,outputHeight:HEIGHT,mirrored:false,rotation:0,screenAngle:screen.orientation?.angle??window.orientation??0,facingMode:s.facingMode||null,zoom:s.zoom??null,focusMode:s.focusMode??null,focusDistance:s.focusDistance??null,resizeMode:s.resizeMode??null,frameRate:s.frameRate??null};}
function geometryKey(s){const {frameRate,...rest}=s;return JSON.stringify(rest);}
async function start(){
 if(stream||busy||views.length)return;busy=true;const token=++generation;controls();message('Allow rear-camera access. Keep the phone in landscape.');
 try {
  const acquired=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:640},height:{ideal:480},aspectRatio:{ideal:4/3},frameRate:{ideal:15,max:30}}});
  if(token!==generation){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;video.srcObject=stream;await video.play();
  if(token!==generation)return;
  const track=stream.getVideoTracks()[0];track.onended=()=>{if(stream)stop('Camera disconnected. Save your current session.');};
  await new Promise(r=>setTimeout(r,1200));if(token!==generation)return;
  const capabilities=track.getCapabilities?.()||{},lock={attempted:false,locked:false,error:null};
  if(capabilities.focusMode?.includes('manual')){lock.attempted=true;try{await track.applyConstraints({advanced:[{focusMode:'manual'}]});lock.locked=track.getSettings().focusMode==='manual';}catch(e){lock.error=e.message;}}
  if(token!==generation)return;
  metadata={build:BUILD,createdAt:new Date().toISOString(),userAgent:navigator.userAgent,geometry:settings(),settings:track.getSettings(),capabilities,focusLock:lock,undistorted:false,processing:'Unmirrored centre crop to 4:3, resized to 640x480; no undistortion applied.'};
  $('camera-info').textContent=`${metadata.geometry.sourceWidth} × ${metadata.geometry.sourceHeight} → 640 × 480. ${lock.locked?'Focus locked.':'Focus lock unavailable: measurements will remain provisional.'}`;
  $('placeholder').hidden=true;$('instructions').open=false;worker=new Worker('./calibration-worker.js?v=1');
  worker.onmessage=({data})=>{if(!pending||pending.id!==data.id)return;clearTimeout(deadline);const p=pending;pending=null;if(data.type==='error')p.reject(Error(data.message));else p.resolve(data);};
  worker.onerror=()=>stop('Calibration worker failed. Save any captures and reload to retry.');
  message('Loading local calibration tools (4.3 MB)…');controls();const info=await request('init');if(token!==generation)return;metadata.runtimeSha256=info.runtimeSha256;ready=true;message('Ready. Position the board as shown below, then tap Capture view.');
 }catch(e){if(token===generation)stop('Could not start: '+e.message);}finally{if(token===generation){busy=false;controls();}}
}
async function capture(){
 if(!ready||busy)return;clearTimeout(overlayTimer);overlay.hidden=true;busy=true;const token=generation;controls();message('Hold still… capturing in one second.');
 try {
  await new Promise(r=>setTimeout(r,1000));if(token!==generation)return;
  const current=settings();if(geometryKey(current)!==geometryKey(metadata.geometry)){stop('Camera geometry, orientation or focus changed. Save this session, then clear and restart.');return;}
  const c=current.crop,canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(video,c.x,c.y,c.width,c.height,0,0,WIDTH,HEIGHT);
  const pixels=ctx.getImageData(0,0,WIDTH,HEIGHT).data;const image=canvas.toDataURL('image/png');
  const shown=overlay.getContext('2d');shown.drawImage(canvas,0,0);overlay.hidden=false;message('Checking the board. Keep still until the green confirmation.');
  const out=await request('detect',{pixels:pixels.buffer},[pixels.buffer]);if(token!==generation)return;
  if(out.accepted){views.push({index:views.length,capturedAt:new Date().toISOString(),geometry:current,points:out.points,board:out.board,image});calibration=null;$('result').hidden=true;
   shown.fillStyle='#9effbb';for(let i=0;i<out.points.length;i+=2){shown.beginPath();shown.arc(out.points[i],out.points[i+1],2.5,0,Math.PI*2);shown.fill();}
   document.querySelector('.preview').classList.add('flash');setTimeout(()=>document.querySelector('.preview').classList.remove('flash'),750);
   message(views.length>=16?'View saved. You can now validate, or add more varied views.':'View saved — move the board for the next capture.');
  }else message(out.reason);
  overlayTimer=setTimeout(()=>overlay.hidden=true,1100);
 }catch(e){if(token===generation)message('Capture failed: '+e.message);}finally{if(token===generation){busy=false;controls();}}
}
async function validate(){
 if(!ready||busy||views.length<16)return;busy=true;controls();const token=generation;message('Validating two independent groups of views. This can take a moment…');
 try{const out=await request('calibrate');if(token!==generation)return;calibration=out.result;const node=$('result');node.replaceChildren();node.hidden=false;node.className=calibration.passed?'pass':'fail';
 const h=document.createElement('h2');h.textContent=calibration.passed?(metadata.focusLock.locked?'Measurements pass':'Measurements pass · focus not locked'):'More varied or sharper views needed';node.append(h);
 const p=document.createElement('p');p.textContent=`Reprojection RMS: ${calibration.rms.toFixed(3)} px. Focal agreement: ${(calibration.focalDisagreement*100).toFixed(2)}%. Centre agreement: ${calibration.centreDisagreement.toFixed(2)} px.`;node.append(p);
 for(const reason of calibration.reasons){const item=document.createElement('p');item.textContent=reason;node.append(item);}
 const note=document.createElement('p');note.textContent='Save the session and share the JSON file for independent review. This result has not been applied to the relief scanner.';node.append(note);message(calibration.passed?'Validation complete. Save your session.':'Validation found uncertainty. Add two or more varied views and validate again, or save this session for review.');
 }catch(e){if(token===generation)message('Validation failed: '+e.message);}finally{if(token===generation){busy=false;controls();}}
}
function save(){
 const session={format:'tactical-camera-calibration',version:1,board:{columns:9,rows:7,squareMetres:.018,target:'calibration-target-v1',units:'metres; printed square size affects pose scale, not intrinsics'},metadata,observations:views,calibration,usage:'Independent camera calibration capture; not yet applied to scanner. Raw distorted PNG images and raw corners. No uploads.'};
 const url=URL.createObjectURL(new Blob([JSON.stringify(session)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`tactical-calibration-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);message('Session saved to Downloads. Share the JSON file for independent review.');
}
$('start').onclick=start;$('capture').onclick=capture;$('validate').onclick=validate;$('save').onclick=save;$('stop').onclick=()=>stop();
$('undo').onclick=async()=>{if(!ready||busy||!views.length)return;busy=true;controls();const token=generation;try{await request('remove');if(token!==generation)return;views.pop();calibration=null;$('result').hidden=true;message('Last view removed.');}catch(e){message(e.message);}finally{if(token===generation){busy=false;controls();}}};
$('clear').onclick=()=>{if(views.length&&!confirm('Clear these captures? Save the session first if you need to keep it.'))return;stop('Session cleared. Ready for a new camera session.');views=[];calibration=null;metadata=null;$('result').hidden=true;$('camera-info').textContent='';controls();};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(stream||worker))stop('Camera stopped while the page was hidden. Save your captures, then clear to start a new session.');});
window.addEventListener('pagehide',()=>stop());
controls();
