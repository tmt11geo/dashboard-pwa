import {openCalibratedCamera} from './depth-camera-binding.js?v=1';
import {validateCalibrationSession,calibratedCameraRequest,checkCamera,undistortionMap,remapRGBA,scaledIntrinsics} from './depth-calibration-core.js?v=3';
export function createCalibration({idle,log,onStatus=()=>{}}){
 const $=id=>document.getElementById(id),input=$('scan-calibration-file'),status=$('scan-calibration-status');
 if(!input)return {buttons(){},loading:false,profile:null,record(){},intrinsics(){return null;},constraints(){return null;}};
 const message=text=>{status.textContent=text;onStatus(text);};
 let boundDeviceId=null,profile=null,loading=false,worker=null,serial=0,map=null,records=[],captureRecord=null,cancelPending=null,tracking=null;
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const corrected=document.createElement('canvas');corrected.width=640;corrected.height=480;const out=corrected.getContext('2d');
 function buttons(){if(!input)return;$('scan-calibration').disabled=!idle()||loading;$('scan-replay-save').disabled=!records.length||!idle();}
 function rpc(type,extra={},timeout=90000){return new Promise((resolve,reject)=>{const id=++serial,t=setTimeout(()=>reject(Error('Calibration verification timed out.')),timeout);cancelPending=()=>{clearTimeout(t);reject(Error('Verification cancelled. Load the file again.'));};worker.onmessage=({data})=>{if(data.id!==id)return;clearTimeout(t);data.type==='error'?reject(Error(data.message)):resolve(data);};worker.onerror=()=>{clearTimeout(t);reject(Error('Calibration verification worker failed.'));};worker.postMessage({type,id,...extra});});}
 $('scan-calibration').onclick=()=>input.click();
 input.onchange=async()=>{
  const file=input.files?.[0];input.value='';if(!file||!idle())return;
  loading=true;profile=null;boundDeviceId=null;records=[];map=null;buttons();message('Checking calibration images locally…');
  try{
   if(file.size>50000000)throw Error('Calibration file exceeds 50 MB.');const text=await file.text(),session=JSON.parse(text),geometry=validateCalibrationSession(session);
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),x=>x.toString(16).padStart(2,'0')).join('');
   worker=new Worker(new URL('./calibration-worker.js?v=2',import.meta.url));await rpc('init');const {result}=await rpc('verify-session',{views:session.observations},120000);
   profile={geometry:structuredClone(geometry),cameraMatrix:result.cameraMatrix,distortion:result.distortion,rms:result.rms,inputSha256:hash};
   map=undistortionMap(profile.cameraMatrix,profile.distortion,640,480);
   message(`Calibration ready · ${result.rms.toFixed(2)} px error. Keep the phone landscape as during calibration. Start scan.`);
   log('info','calibration.ready',{rms:result.rms,views:session.observations.length});
  }catch(e){profile=null;map=null;message('Calibration not loaded: '+e.message);log('warn','calibration.error',{message:e.message});}
  finally{worker?.terminate();worker=null;cancelPending=null;loading=false;buttons();}
 };
 function assert(track,video){if(!profile)return;checkCamera({...profile.geometry,deviceId:boundDeviceId??profile.geometry.deviceId},track.getSettings(),video.videoWidth,video.videoHeight,screen.orientation?.angle??window.orientation??0);}
 async function bind(track,video){
  if(!profile)return;const g=profile.geometry,s=track.getSettings(),cap=track.getCapabilities?.()||{};
  const advanced={focusMode:'manual'};
  if(cap.zoom&&s.zoom!==g.zoom)advanced.zoom=g.zoom;
  // A known Android metadata inconsistency reports distance outside capability range.
  // Never send that invalid constraint. Accept only if read-back already agrees.
  if(s.focusDistance!==g.focusDistance&&cap.focusDistance&&g.focusDistance>=cap.focusDistance.min&&g.focusDistance<=cap.focusDistance.max)advanced.focusDistance=g.focusDistance;
  await track.applyConstraints({advanced:[advanced]});assert(track,video);records=[];captureRecord=null;
  message('Calibrated camera matched · distortion corrected · experimental stitching');buttons();
 }
 function frame(video,track){
  assert(track,video);const c=profile.geometry.crop;ctx.drawImage(video,c.x,c.y,c.width,c.height,0,0,640,480);
  const raw=ctx.getImageData(0,0,640,480);tracking=remapRGBA(raw.data,map,640,480);out.putImageData(new ImageData(tracking,640,480),0,0);
  captureRecord=records.length<12?{capturedAt:new Date().toISOString(),image:canvas.toDataURL('image/png')}:null;
  return corrected;
 }
 function depth(data){if(captureRecord)captureRecord.depth={width:data.width,height:data.height,raw:Array.from(new Float32Array(data.rawDepth)),K:scaledIntrinsics(profile.cameraMatrix,data.width,data.height),processing:'Undistorted RGB input; affine-relative inverse depth, not metres.'};}
 function record(result){if(!captureRecord)return;records.push({...captureRecord,alignment:result});captureRecord=null;buttons();}
 $('scan-replay-save').onclick=()=>{
  if(!profile||!records.length||!idle())return;
  const data={format:'tactical-calibrated-replay',version:1,calibration:profile,frames:records,processing:'Raw distorted 640x480 crop. Undistort using supplied K/D before tracking. First 12 attempts only.'};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='tactical-scan-replay-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&loading){cancelPending?.();worker?.terminate();}});
 window.addEventListener('pagehide',()=>{cancelPending?.();worker?.terminate();});
 buttons();return {buttons,async open(request,isCurrent){
  boundDeviceId=null;
  const result=await openCalibratedCamera({mediaDevices:navigator.mediaDevices,request,geometry:profile.geometry,isCurrent,log,
   confirmCamera:label=>window.confirm(`The saved camera ID is no longer available. Found “${label}”. Is this the SAME PHONE and camera used to capture this calibration? Choose Cancel if unsure. Camera settings will still be checked.`)});
  boundDeviceId=result.deviceId;
  profile.cameraBinding={method:result.rebound?'unique-label-and-user-confirmation':'original-id',confirmedSamePhone:result.rebound};
  return result.stream;
 },bind,assert,frame,record,depth,takeTracking(){const t=tracking;tracking=null;return t;},get profile(){return profile;},get loading(){return loading;},intrinsics:(w,h)=>profile?scaledIntrinsics(profile.cameraMatrix,w,h):null,
 constraints:()=>profile?calibratedCameraRequest(profile.geometry,screen.orientation?.angle??window.orientation??0):null};
}
