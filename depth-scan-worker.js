import {ScanMap} from './depth-scan-core.js?v=1';
const map=new ScanMap();
self.onmessage=({data})=>{
 try{
  if(data.type==='clear'){map.clear();return;}
  if(data.type!=='frame')return;
  const result=map.add({...data.frame,raw:new Float32Array(data.frame.raw),pixels:new Uint8ClampedArray(data.frame.pixels)});
  self.postMessage({id:data.id,...result,scene:result.ok?map.snapshot():undefined});
 }catch(e){self.postMessage({id:data.id,ok:false,reason:e.message||'Scan alignment failed'});}
};
