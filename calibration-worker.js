/* Camera pixels never leave this worker/device. Runtime assets are same-origin. */
importScripts('./calibration-engine.js?v=1');
let cv,views=[],busy=false;
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
async function digest(bytes){return hex(await crypto.subtle.digest('SHA-256',bytes));}
async function load(){
 const root='./vendor/calibration-opencv/';
 const response=await fetch(root+'manifest.json',{cache:'no-cache'});if(!response.ok)throw Error('Calibration runtime manifest unavailable.');
 const manifest=await response.json();
 const parts=await Promise.all(manifest.parts.map(async p=>{const r=await fetch(root+p.path);if(!r.ok)throw Error('Calibration runtime download failed.');const b=await r.arrayBuffer();if(b.byteLength!==p.bytes||await digest(b)!==p.sha256)throw Error('Calibration runtime part failed integrity check.');return b;}));
 const packed=await new Blob(parts).arrayBuffer();if(await digest(packed)!==manifest.gzipSha256)throw Error('Calibration runtime integrity failure.');
 const unpacked=await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 if(await digest(unpacked)!==manifest.runtimeSha256)throw Error('Calibration runtime integrity failure.');
 const url=URL.createObjectURL(new Blob([unpacked],{type:'application/javascript'}));
 try{importScripts(url);cv=await self.cv;}finally{URL.revokeObjectURL(url);}
 for(const f of ['findChessboardCorners','calibrateCamera','solvePnP','projectPoints'])if(typeof cv[f]!=='function')throw Error('Missing calibration operation: '+f);
 return {runtimeSha256:manifest.runtimeSha256};
}
self.onmessage=async({data})=>{
 if(busy){postMessage({id:data.id,type:'error',message:'Calibration worker is busy.'});return;}busy=true;
 try{
  if(data.type==='init'){const runtime=await load();views=[];postMessage({id:data.id,type:'ready',...runtime});}
  else if(data.type==='verify-session'){
   if(!cv)throw Error('Calibration runtime not ready.');
   const verified=[];
   if(!Array.isArray(data.views)||data.views.length<16||data.views.length>24)throw Error('Invalid calibration views.');
   for(const view of data.views){
    const blob=await (await fetch(view.image)).blob();const bitmap=await createImageBitmap(blob);
    try{
     if(bitmap.width!==640||bitmap.height!==480)throw Error('Invalid calibration image size.');
     const canvas=new OffscreenCanvas(640,480),ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);
     const result=CalibrationEngine.detect(cv,ctx.getImageData(0,0,640,480).data,verified);
     if(!result.accepted)throw Error('Saved board could not be verified: '+result.reason);
     const error=reverse=>Math.sqrt(result.points.reduce((sum,x,i)=>sum+(x-view.points[reverse?(62-Math.floor(i/2))*2+i%2:i])**2,0)/63);
     if(Math.min(error(false),error(true))>1)throw Error('Saved corners disagree with image.');
     verified.push(result);
    }finally{bitmap.close();}
   }
   const result=CalibrationEngine.calibrate(cv,verified);
   if(!result.passed)throw Error(result.reasons.join(' '));
   postMessage({id:data.id,type:'verified',result});
  }else if(data.type==='detect'){
   if(!cv)throw Error('Calibration runtime not ready.');
   const result=CalibrationEngine.detect(cv,new Uint8Array(data.pixels),views);
   if(result.accepted){if(views.length>=24)throw Error('Maximum 24 captures reached.');views.push(result);}
   postMessage({id:data.id,type:'detected',...result,count:views.length});
  }else if(data.type==='remove'){views.pop();postMessage({id:data.id,type:'removed',count:views.length});}
  else if(data.type==='calibrate'){postMessage({id:data.id,type:'calibrated',result:CalibrationEngine.calibrate(cv,views)});}
  else throw Error('Unknown calibration request.');
 }catch(error){postMessage({id:data.id,type:'error',message:error?.message||String(error)});}finally{busy=false;}
};
