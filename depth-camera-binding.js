// Browser device IDs are handles, not a portable physical-camera identity.
// Never use the permission-probe stream for calibrated inference.
export async function openCalibratedCamera({mediaDevices,request,geometry,confirmCamera,isCurrent=()=>true,log=()=>{}}){
 const alive=()=>{if(!isCurrent())throw Error('Camera startup cancelled.');};
 const open=async video=>{alive();const stream=await mediaDevices.getUserMedia({audio:false,video});if(!isCurrent()){stream.getTracks().forEach(t=>t.stop());alive();}return stream;};
 try{return {stream:await open(request),deviceId:request.deviceId.exact,rebound:false};}
 catch(e){if(e.name!=='OverconstrainedError'||e.constraint!=='deviceId')throw e;}
 alive();log('warn','camera.identity.refresh',{});
 const probe=await open({facingMode:{ideal:'environment'}});
 probe.getTracks().forEach(t=>t.stop());
 const devices=await mediaDevices.enumerateDevices();alive();
 const cameras=devices.filter(d=>d.kind==='videoinput'&&d.deviceId);
 let candidate=cameras.find(d=>d.deviceId===geometry.deviceId),rebound=false;
 if(!candidate){
  const matches=cameras.filter(d=>geometry.label&&d.label===geometry.label);
  if(matches.length!==1)throw Error('Cannot uniquely identify the calibrated camera. Open scanning in the same browser/app used for calibration, or capture a new calibration there.');
  candidate=matches[0];
  if(!await confirmCamera(geometry.label))throw Error('Camera reconnection cancelled. Use the same phone and camera used for calibration.');
  alive();rebound=true;
 }
 const stream=await open({...request,deviceId:{exact:candidate.deviceId}});
 const track=stream.getVideoTracks()[0];
 if(track?.getSettings().deviceId!==candidate.deviceId||(rebound&&track.label!==geometry.label)){
  stream.getTracks().forEach(t=>t.stop());throw Error('Reconnected camera identity does not match. Scan stopped.');
 }
 log('info','camera.identity.resolved',{rebound,confirmedSamePhone:rebound});
 return {stream,deviceId:candidate.deviceId,rebound};
}
