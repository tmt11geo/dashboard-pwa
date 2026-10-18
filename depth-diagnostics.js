export const BUILD='depth-lab-2';
// Deliberately exclude camera frames, camera IDs, credentials and page query strings.
export function cleanText(value){
 return String(value).replace(/https?:\/\/[^\s)"']+/g,url=>url.split(/[?#]/)[0]).slice(0,3000);
}
export function errorInfo(error){
 return {name:cleanText(error?.name||'Error'),message:cleanText(error?.message||error||'Unknown error'),...(error?.stack?{stack:cleanText(error.stack)}:{})};
}
export function createLog(output,limit=300){
 let lines=[];
 function write(level,event,details){
  let extra='';try{if(details!==undefined)extra=' '+JSON.stringify(details);}catch{extra=' [unserializable detail]';}
  lines.push(`${new Date().toISOString()} ${level.toUpperCase()} ${cleanText(event)}${cleanText(extra)}`);
  if(lines.length>limit)lines.splice(0,lines.length-limit);
  output.value=lines.join('\n');output.scrollTop=output.scrollHeight;
 }
 return {write,text:()=>lines.join('\n'),clear:()=>{lines=[];output.value='';}};
}
export async function probeGPU(gpu,emit){
 emit('info','gpu.api',{available:!!gpu});
 if(!gpu)return {adapter:null,reason:'API unavailable in this execution context'};
 try{
  emit('info','gpu.requestAdapter.begin');
  const adapter=await gpu.requestAdapter();
  if(!adapter){emit('warn','gpu.requestAdapter.null');return {adapter:null,reason:'requestAdapter returned null'};}
  let info;try{info=adapter.info;}catch(error){emit('warn','gpu.adapter.infoUnavailable',errorInfo(error));}
  emit('info','gpu.adapter',{features:[...adapter.features],vendor:info?.vendor||'',architecture:info?.architecture||'',isFallbackAdapter:adapter.isFallbackAdapter??null,maxBufferSize:adapter.limits?.maxBufferSize??null});
  return {adapter,reason:'Adapter available'};
 }catch(error){emit('error','gpu.requestAdapter.error',errorInfo(error));return {adapter:null,reason:`requestAdapter failed: ${cleanText(error.message||error)}`};}
}
