import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../depth-tfjs-worker.js',import.meta.url),'utf8');
for(const mode of ['no-offscreen','backend-unavailable','cpu-selected']){
 test(`TFJS refuses unsupported execution without model download: ${mode}`,async()=>{
  const messages=[],flags={};let imports=0;
  const scope={URL,performance,self:{location:{href:'https://test.invalid/dashboard-pwa/depth-tfjs-worker.js'},postMessage:m=>messages.push(m)}};
  if(mode!=='no-offscreen')scope.OffscreenCanvas=class{};
  scope.importScripts=()=>{imports++;scope.tf={version:{tfjs:'4.22.0'},env:()=>({set:(k,v)=>flags[k]=v,get:k=>flags[k]}),setBackend:async()=>mode!=='backend-unavailable',ready:async()=>{},getBackend:()=>mode==='cpu-selected'?'cpu':undefined,backend:()=>({gpgpu:{gl:{isContextLost:()=>false}}})};};
  const context=vm.createContext(scope);vm.runInContext(code,context);
  await scope.self.onmessage({data:{type:'init'}});
  assert.ok(messages.some(m=>m.type==='error'));
  assert.equal(messages.some(m=>m.type==='ready'),false);
  assert.equal(messages.some(m=>m.event==='tfjs.load.begin'),false);
  if(mode==='no-offscreen')assert.equal(imports,0);else assert.equal(flags.WEBGL_CPU_FORWARD,false);
 });
}
