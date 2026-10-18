// Classic dedicated worker: frames never leave the device. No CPU fallback.
const RUNTIME='https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
const MODEL=new URL('./models/depth-anything-v2-small-tfjs-fp32-224-v1/model.json',self.location.href).href;
let model,gl,core,normalizeDepth,busy=false,initialized=false,stage='boot',frames=0,failed=false;
const diagnostic=(level,event,details)=>self.postMessage({type:'diagnostic',level,event,details});
const memory=()=>JSON.parse(JSON.stringify(tf.memory()));
function identity(){
 const ext=gl.getExtension('WEBGL_debug_renderer_info');
 return {tfjs:tf.version.tfjs,backend:tf.getBackend(),cpuForward:tf.env().get('WEBGL_CPU_FORWARD'),webgl:gl.getParameter(gl.VERSION),renderer:gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER),worker:true};
}
function requireBackend(){if(tf.getBackend()!=='webgl'||tf.env().get('WEBGL_CPU_FORWARD')!==false||gl.isContextLost())throw Error('TFJS WebGL backend unavailable or context lost');}
function release(){
 if(model){model.dispose();model=null;}
 if(typeof tf!=='undefined'&&tf.getBackend()==='webgl'){
  diagnostic('info','tfjs.disposed',memory());tf.removeBackend('webgl');
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
 }
}
function failure(error){
 if(failed)return;failed=true;
 const info={name:error.name||'Error',message:error.message||String(error),stack:error.stack};
 diagnostic('error','tfjs.failure',{stage,...info});
 try{release();}catch(e){diagnostic('warn','tfjs.cleanup.error',{message:String(e)});}
 self.postMessage({type:'error',stage,error:info,message:info.message});
}
self.onmessage=async({data})=>{
 if(busy||failed)return;busy=true;
 try{
  if(data.type==='init'&&!initialized){
   initialized=true;stage='runtime';
   if(typeof OffscreenCanvas==='undefined')throw Error('TFJS WebGL requires worker OffscreenCanvas support');
   self.postMessage({type:'progress',message:'Loading TFJS WebGL runtime…'});
   importScripts(RUNTIME);
   if(tf.version.tfjs!=='4.22.0')throw Error('Unexpected TFJS runtime version');
   tf.env().set('WEBGL_CPU_FORWARD',false);
   if(!await tf.setBackend('webgl'))throw Error('WebGL is unavailable in this worker; choose another compute option');
   await tf.ready();gl=tf.backend().gpgpu.gl;requireBackend();
   gl.canvas.addEventListener('webglcontextlost',()=>{if(!failed)failure(Error('TFJS WebGL context lost. Stop and restart.'));});
   diagnostic('info','tfjs.identity',identity());
   core=await import('./depth-tfjs-core.js?v=1');
   ({normalizeDepth}=await import('./depth-core.js?v=1'));
   stage='model-load';const begin=performance.now();
   diagnostic('info','tfjs.load.begin',{model:MODEL,bytes:97817343,memory:memory()});
   self.postMessage({type:'progress',message:'Downloading TFJS FP32 model (~98 MB) and preparing WebGL…'});
   model=await tf.loadGraphModel(MODEL,{requestInit:{credentials:'same-origin'}});
   requireBackend();
   diagnostic('info','tfjs.load.complete',{ms:performance.now()-begin,memory:memory()});
   self.postMessage({type:'ready',backend:'tfjs-webgl',precision:'FP32',modelBytes:97817343});
  }else if(data.type==='frame'&&model){
   stage='preprocessing';requireBackend();
   if(data.width!==224||data.height!==224)throw Error('TFJS supports only fixed 224 × 224 input');
   const start=performance.now(),rgba=new Uint8ClampedArray(data.pixels);
   let input,output;
   try{
    input=tf.tensor(core.prepareNHWC(rgba,data.content),[1,224,224,3],'float32');
    stage='inference';const begin=performance.now();
    output=await model.executeAsync(input);
    if(Array.isArray(output)||output.shape.join()!=='1,224,224,1'||output.dtype!=='float32')throw Error('Unexpected TFJS output');
    const values=await output.data(),inferenceMs=performance.now()-begin;requireBackend();
    for(const value of values)if(!Number.isFinite(value))throw Error('Nonfinite TFJS model output');
    stage='postprocessing';const result=core.cropOutput(values,rgba,data.content);
    result.depth=normalizeDepth(result.depth);frames++;
    diagnostic('info','tfjs.frame',{frame:frames,warmup:frames===1,inferenceMs,content:data.content});
    self.postMessage({type:'depth',id:data.id,...result,depth:result.depth.buffer,pixels:result.pixels.buffer,inferenceMs,processingMs:performance.now()-start},[result.depth.buffer,result.pixels.buffer]);
   }finally{if(output)tf.dispose(output);input?.dispose();if(typeof tf!=='undefined'&&tf.getBackend()==='webgl')diagnostic('info','tfjs.frame.disposed',memory());}
  }
 }catch(error){failure(error);}finally{busy=false;stage='idle';}
};
