import test from 'node:test';
import assert from 'node:assert/strict';
test('real depth worker reports adapter failures before any model download',async()=>{
 const messages=[],originalWarn=console.warn,originalError=console.error,originalFetch=globalThis.fetch;
 let downloads=0;
 globalThis.self={navigator:{gpu:{requestAdapter:async()=>{throw new DOMException('adapter blocked by browser','NotAllowedError');}}},isSecureContext:true,postMessage:message=>messages.push(message)};
 globalThis.fetch=async()=>{downloads++;throw Error('unexpected download');};
 try{
  await import('../depth-worker.js?diagnostic-test');
  await self.onmessage({data:{type:'init',backend:'webgpu'}});
  assert.ok(messages.some(m=>m.type==='diagnostic'&&m.event==='boot'));
  const probeError=messages.find(m=>m.event==='gpu.requestAdapter.error');assert.equal(probeError.details.name,'NotAllowedError');
  const failure=messages.find(m=>m.type==='error');assert.equal(failure.stage,'gpu-probe');assert.match(failure.message,/adapter blocked by browser/);
  assert.equal(downloads,0);
 }finally{console.warn=originalWarn;console.error=originalError;globalThis.fetch=originalFetch;delete globalThis.self;}
});
