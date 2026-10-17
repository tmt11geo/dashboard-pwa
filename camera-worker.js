/* Inference only: no video, image, telemetry or detection data leaves this worker. */
'use strict';
let session=null;
const ROOT='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
const MODEL='https://huggingface.co/onnx-community/yolov10n/resolve/57657320425ee34056408a57ad9d29c4d4815bd8/onnx/model.onnx';
self.onmessage=async({data})=>{
 try{
  if(data.type==='init'){
   self.postMessage({type:'progress',message:'Loading inference runtime…'});
   importScripts(ROOT+'ort.min.js');
   ort.env.wasm.wasmPaths=ROOT;
   ort.env.wasm.numThreads=1; // Works without cross-origin isolation on GitHub Pages.
   ort.env.wasm.proxy=false;
   self.postMessage({type:'progress',message:'Downloading YOLOv10n (~9 MB)…'});
   const response=await fetch(MODEL,{signal:AbortSignal.timeout(120000)});
   if(!response.ok)throw new Error('Model download failed ('+response.status+')');
   const bytes=await response.arrayBuffer();
   self.postMessage({type:'progress',message:'Preparing YOLOv10n…'});
   session=await ort.InferenceSession.create(bytes,{executionProviders:['wasm'],graphOptimizationLevel:'all'});
   self.postMessage({type:'ready'});
  }else if(data.type==='frame'&&session){
   const start=performance.now(),rgba=new Uint8ClampedArray(data.pixels),plane=640*640;
   const values=new Float32Array(3*plane); // Zero padding at right/bottom, as model processor specifies.
   for(let y=0;y<data.height;y++)for(let x=0;x<data.width;x++){
    const src=(y*data.width+x)*4,dest=y*640+x;
    values[dest]=rgba[src]/255;values[plane+dest]=rgba[src+1]/255;values[2*plane+dest]=rgba[src+2]/255;
   }
   const input=new ort.Tensor('float32',values,[1,3,640,640]);
   let result;
   try{
    result=await session.run({[session.inputNames[0]]:input});
    const output=result[session.outputNames[0]];
    if(output.dims.length!==3||output.dims[2]!==6)throw new Error('Unexpected YOLO output shape');
    const copy=new Float32Array(output.data);
    self.postMessage({type:'detections',generation:data.generation,width:data.width,height:data.height,ms:performance.now()-start,output:copy.buffer},[copy.buffer]);
   }finally{input.dispose();if(result)for(const tensor of Object.values(result))tensor.dispose();}
  }
 }catch(error){self.postMessage({type:'error',message:error.message||String(error)});}
};
