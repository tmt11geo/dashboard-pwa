// All frame processing stays in this worker. Network requests only download public code/weights.
import {MODEL_ROOT,prepareInput,normalizeDepth} from './depth-core.js?v=1';
const ROOT='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
let runtime,session,busy=false,initialized=false;
function progress(message){self.postMessage({type:'progress',message});}
async function download(url){
 const response=await fetch(url,{credentials:'omit',signal:AbortSignal.timeout(180000)});
 if(!response.ok)throw new Error(`Model download failed (${response.status}). Check the connection and retry.`);
 const reader=response.body?.getReader();
 if(!reader)return response.arrayBuffer();
 const chunks=[],total=Number(response.headers.get('content-length'))||0;let loaded=0,last=0;
 for(;;){
  const {done,value}=await reader.read();if(done)break;
  chunks.push(value);loaded+=value.length;
  if(loaded>120000000){await reader.cancel();throw new Error('Unexpected model download size');}
  if(performance.now()-last>250){last=performance.now();progress(`Downloading depth model: ${(loaded/1e6).toFixed(1)} MB${total?' / '+(total/1e6).toFixed(1)+' MB':''}…`);}
 }
 const bytes=new Uint8Array(loaded);let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return bytes.buffer;
}
self.onmessage=async({data})=>{
 if(busy)return;
 busy=true;
 try{
  if(data.type==='init'&&!initialized){
   initialized=true;
   let adapter=null;
   if(data.backend!=='wasm')try{adapter=await self.navigator.gpu?.requestAdapter();}catch{}
   if(data.backend==='webgpu'&&!adapter)throw new Error('WebGPU is unavailable here. Select CPU / WASM and retry.');
   const backend=adapter?'webgpu':'wasm',half=adapter?.features.has('shader-f16');
   const file=backend==='wasm'?'model_quantized.onnx':half?'model_fp16.onnx':'model.onnx';
   progress(`Loading ${backend==='webgpu'?'WebGPU':'CPU / WASM'} runtime…`);
   runtime=await import(ROOT+(backend==='webgpu'?'ort.webgpu.min.mjs':'ort.wasm.min.mjs'));
   runtime.env.wasm.wasmPaths=ROOT;runtime.env.wasm.numThreads=1;runtime.env.wasm.proxy=false;
   progress(`Downloading ${file==='model_fp16.onnx'?'FP16 (~50 MB)':file==='model.onnx'?'FP32 (~99 MB)':'INT8 (~27 MB)'} depth model…`);
   const bytes=await download(MODEL_ROOT+file);
   progress('Preparing depth model; first inference also needs warm-up…');
   session=await runtime.InferenceSession.create(bytes,{executionProviders:[backend],graphOptimizationLevel:'all'});
   self.postMessage({type:'ready',backend,precision:backend==='wasm'?'INT8':half?'FP16':'FP32',modelBytes:bytes.byteLength});
  }else if(data.type==='frame'&&session){
   const start=performance.now(),rgba=new Uint8ClampedArray(data.pixels);
   const input=new runtime.Tensor('float32',prepareInput(rgba,data.width,data.height),[1,3,data.height,data.width]);
   let outputs;
   try{
    const begin=performance.now();outputs=await session.run({[session.inputNames[0]]:input});
    const inferenceMs=performance.now()-begin,tensor=outputs[session.outputNames[0]];
    const [height,width]=tensor.dims.slice(-2);
    if(width!==data.width||height!==data.height||tensor.type!=='float32')throw new Error('Unexpected depth model output');
    const depth=normalizeDepth(tensor.data);
    self.postMessage({type:'depth',id:data.id,width,height,inferenceMs,processingMs:performance.now()-start,depth:depth.buffer,pixels:rgba.buffer},[depth.buffer,rgba.buffer]);
   }finally{input.dispose();if(outputs)for(const tensor of Object.values(outputs))tensor.dispose();}
  }
 }catch(error){self.postMessage({type:'error',message:error.message||String(error)});}
 finally{busy=false;}
};
