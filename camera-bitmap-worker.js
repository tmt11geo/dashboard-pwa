import {BitmapMatcher} from './camera-bitmap.js?v=1';
let matcher=null;
self.onmessage=({data})=>{
 try{
  if(data.type==='init'){matcher=new BitmapMatcher(data.reference);self.postMessage({type:'ready'});}
  else if(data.type==='frame'&&matcher){
   const start=performance.now();
   const match=matcher.search({data:new Uint8Array(data.pixels),width:data.width,height:data.height},data.seconds);
   self.postMessage({type:'match',match,ms:performance.now()-start});
  }
 }catch(error){self.postMessage({type:'error',message:error.message||String(error)});}
};
