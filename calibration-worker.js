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
  else if(data.type==='detect'){
   if(!cv)throw Error('Calibration runtime not ready.');
   const result=CalibrationEngine.detect(cv,new Uint8Array(data.pixels),views);
   if(result.accepted){if(views.length>=24)throw Error('Maximum 24 captures reached.');views.push(result);}
   postMessage({id:data.id,type:'detected',...result,count:views.length});
  }else if(data.type==='remove'){views.pop();postMessage({id:data.id,type:'removed',count:views.length});}
  else if(data.type==='calibrate'){postMessage({id:data.id,type:'calibrated',result:CalibrationEngine.calibrate(cv,views)});}
  else throw Error('Unknown calibration request.');
 }catch(error){postMessage({id:data.id,type:'error',message:error?.message||String(error)});}finally{busy=false;}
};
