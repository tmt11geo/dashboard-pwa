// All frame processing stays in this worker. Network requests only download public code/weights.
import {MODEL_ROOT,prepareInput,normalizeDepth} from './depth-core.js?v=1';
import {BUILD,probeGPU,errorInfo} from './depth-diagnostics.js?v=2';
const ROOT='https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
let runtime,session,busy=false,initialized=false;
let stage='boot';
function diagnostic(level,event,details){self.postMessage({type:'diagnostic',level,event,details});}
diagnostic('info','boot',{build:BUILD,secureContext:self.isSecureContext,crossOriginIsolated:self.crossOriginIsolated===true,webgpuAPI:!!self.navigator.gpu});
for(const level of ['warn','error']){
 const original=console[level].bind(console);
 console[level]=(...args)=>{diagnostic(level,'runtime.console',args.map(value=>value instanceof Error?errorInfo(value):typeof value==='string'||typeof value==='number'?value:Object.prototype.toString.call(value)));original(...args);};
}
function progress(message){self.postMessage({type:'progress',message});}
async function download(url){
 const begin=performance.now();diagnostic('info','model.download.begin',{file:url.split('/').at(-1)});
 const response=await fetch(url,{credentials:'omit',signal:AbortSignal.timeout(180000)});
 diagnostic('info','model.download.response',{status:response.status,type:response.type,contentLength:response.headers.get('content-length')});
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
 diagnostic('info','model.download.complete',{bytes:loaded,ms:Math.round(performance.now()-begin)});
 return bytes.buffer;
}
self.onmessage=async({data})=>{
 if(busy)return;
 busy=true;
 try{
  if(data.type==='init'&&!initialized){
   initialized=true;
   stage='gpu-probe';diagnostic('info','init',{requestedBackend:data.backend});
   const probe=data.backend==='wasm'?{adapter:null,reason:'CPU explicitly selected'}:await probeGPU(self.navigator.gpu,diagnostic);
   const adapter=probe.adapter;
   if(data.backend==='webgpu'&&!adapter)throw new Error(`WebGPU unavailable in the worker: ${probe.reason}. Select CPU / WASM and retry.`);
   const backend=adapter?'webgpu':'wasm',half=adapter?.features.has('shader-f16');
   const file=backend==='wasm'?'model_quantized.onnx':half?'model_fp16.onnx':'model.onnx';
   diagnostic('info','backend.selected',{backend,file,mode:probe.mode,reason:probe.reason});stage='runtime-import';
   progress(`Loading ${backend==='webgpu'?'WebGPU':'CPU / WASM'} runtime…`);
   runtime=await import(ROOT+(backend==='webgpu'?'ort.webgpu.min.mjs':'ort.wasm.min.mjs'));
   runtime.env.wasm.wasmPaths=ROOT;runtime.env.wasm.numThreads=1;runtime.env.wasm.proxy=false;
   // Ensure ORT uses the tested adapter instead of requesting a new Core-only one.
   if(adapter)runtime.env.webgpu.adapter=adapter;
   diagnostic('info','runtime.loaded',{version:runtime.env.versions,wasmThreads:1});stage='model-download';
   progress(`Downloading ${file==='model_fp16.onnx'?'FP16 (~50 MB)':file==='model.onnx'?'FP32 (~99 MB)':'INT8 (~27 MB)'} depth model…`);
   const bytes=await download(MODEL_ROOT+file);
   stage='session-create';const createStart=performance.now();diagnostic('info','session.create.begin',{backend});
   progress('Preparing depth model; first inference also needs warm-up…');
   session=await runtime.InferenceSession.create(bytes,{executionProviders:[backend],graphOptimizationLevel:'all'});
   diagnostic('info','session.create.complete',{ms:Math.round(performance.now()-createStart),inputNames:session.inputNames,outputNames:session.outputNames});
   self.postMessage({type:'ready',backend,gpuMode:probe.mode,precision:backend==='wasm'?'INT8':half?'FP16':'FP32',modelBytes:bytes.byteLength});
  }else if(data.type==='frame'&&session){
   stage='preprocessing';
   const start=performance.now(),rgba=new Uint8ClampedArray(data.pixels);
   const input=new runtime.Tensor('float32',prepareInput(rgba,data.width,data.height),[1,3,data.height,data.width]);
   let outputs;
   try{
    stage='inference';const begin=performance.now();outputs=await session.run({[session.inputNames[0]]:input});
    const inferenceMs=performance.now()-begin,tensor=outputs[session.outputNames[0]];
    stage='postprocessing';
    const [height,width]=tensor.dims.slice(-2);
    if(width!==data.width||height!==data.height||tensor.type!=='float32')throw new Error('Unexpected depth model output');
    const depth=normalizeDepth(tensor.data);
    self.postMessage({type:'depth',id:data.id,width,height,inferenceMs,processingMs:performance.now()-start,depth:depth.buffer,pixels:rgba.buffer},[depth.buffer,rgba.buffer]);
   }finally{input.dispose();if(outputs)for(const tensor of Object.values(outputs))tensor.dispose();}
  }
 }catch(error){diagnostic('error','failure',{stage,...errorInfo(error)});self.postMessage({type:'error',stage,error:errorInfo(error),message:error.message||String(error)});}
 finally{busy=false;stage='idle';}
};
