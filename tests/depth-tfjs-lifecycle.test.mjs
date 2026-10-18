import test from 'node:test';
import assert from 'node:assert/strict';
class Element{
 constructor(){this.handlers={};this.disabled=false;this.value='';this.width=224;this.height=168;}
 addEventListener(t,f){(this.handlers[t]??=[]).push(f);}async fire(t,e={}){for(const f of this.handlers[t]||[])await f(e);}
 setAttribute(){}getBoundingClientRect(){return {width:400,height:300};}
 getContext(){return {drawImage(){},clearRect(){},putImageData(){},fillRect(){},getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)})};}
}
test('TFJS parent lifecycle: bounded load/inference, stale messages, crashes, hide and late permissions',async()=>{
 const ids='start stop pause step status capability backend resolution facing frequency video standby depth-image relief empty view-depth view-relief result-title relief-tools rotate-left rotate-right relief-out relief-in reset-view inference average rate age engine diagnostic-log diagnostics-panel copy-log clear-log log-status'.split(' ');
 const el=Object.fromEntries(ids.map(x=>[x,new Element()]));el.backend.value='tfjs-webgl';el.resolution.value='518';el.frequency.value='2';el.facing.value='environment';
 Object.assign(el.video,{videoWidth:480,videoHeight:640,currentTime:1,readyState:2,play:async()=>{}});
 globalThis.document=new Element();document.getElementById=x=>el[x];document.createElement=()=>new Element();document.hidden=false;
 globalThis.window=new Element();window.isSecureContext=true;globalThis.requestAnimationFrame=()=>1;
 globalThis.ImageData=class{constructor(){}};
 let stopped=0,active;const track=new Element();track.stop=()=>stopped++;const media={getTracks:()=>[track],getVideoTracks:()=>[track]};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:async()=>media}}});
 globalThis.Worker=class{constructor(url,options){Object.assign(this,{url:String(url),options,messages:[]});active=this;}postMessage(m){this.messages.push(m);}terminate(){this.terminated=true;}};
 const original={setTimeout,clearTimeout,setInterval,clearInterval};let next=0;const timers=new Map();
 globalThis.setTimeout=(fn,ms)=>{const id=++next;timers.set(id,{fn,ms});return id;};globalThis.clearTimeout=id=>timers.delete(id);
 globalThis.setInterval=()=>++next;globalThis.clearInterval=()=>{};
 const fireTimer=ms=>{const entry=[...timers].find(([,v])=>v.ms===ms);assert.ok(entry,`timer ${ms}`);timers.delete(entry[0]);entry[1].fn();};
 try{
  await import('../depth.js?tfjs-lifecycle');assert.equal(el.resolution.value,'224');assert.equal(el.resolution.disabled,true);
  await el.start.fire('click');assert.match(active.url,/depth-tfjs-worker/);assert.equal(active.options,undefined);
  const initTimer=[...timers].find(([,v])=>v.ms===240000)[0];
  active.onmessage({data:{type:'progress',message:'still loading'}});assert.ok(timers.has(initTimer),'progress does not extend absolute TFJS deadline');
  const stale=active;fireTimer(240000);assert.equal(active.terminated,true);assert.equal(stopped,1);assert.match(el.status.textContent,/timed out/);
  await el.start.fire('click');const current=active;
  stale.onmessage({data:{type:'error',message:'stale failure'}});stale.onerror({message:'stale crash'});assert.equal(current.terminated,undefined);
  active.onmessage({data:{type:'ready',backend:'tfjs-webgl',precision:'FP32',modelBytes:97817343}});
  assert.equal(active.messages.length,2);const frame=active.messages[1];assert.deepEqual(frame.content,{x:28,y:0,width:168,height:224});
  assert.equal(frame.width,224);assert.equal(frame.height,224);
  await el.pause.fire('click');await el.step.fire('click');assert.equal(active.messages.length,2,'no second frame in flight');
  fireTimer(60000);assert.equal(stopped,2);assert.equal(active.terminated,true);assert.match(el.status.textContent,/inference exceeded/);
  await el.start.fire('click');active.onerror({message:'simulated crash'});assert.equal(stopped,3);assert.match(el['diagnostic-log'].value,/simulated crash/);
  await el.start.fire('click');active.onmessageerror();assert.equal(stopped,4);assert.match(el.status.textContent,/receive/);
  await el.start.fire('click');document.hidden=true;await document.fire('visibilitychange');assert.equal(stopped,5);assert.equal(active.terminated,true);document.hidden=false;
  await el.start.fire('click');await window.fire('pagehide');assert.equal(stopped,6);assert.equal(el.video.srcObject,null);
  let resolve;navigator.mediaDevices.getUserMedia=()=>new Promise(r=>resolve=r);const pending=el.start.fire('click');await el.stop.fire('click');resolve(media);await pending;assert.equal(stopped,7);
  navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('denied','NotAllowedError');};await el.start.fire('click');assert.match(el.status.textContent,/denied/);assert.equal(el.start.disabled,false);
  // Compute switching still selects the original module worker for every ONNX mode.
  navigator.mediaDevices.getUserMedia=async()=>media;
  for(const backend of ['auto','wasm','webgpu']){el.backend.value=backend;await el.backend.fire('change');assert.equal(el.resolution.disabled,false);await el.start.fire('click');assert.match(active.url,/depth-worker.js/);assert.equal(active.options.type,'module');await el.stop.fire('click');}
  assert.equal(timers.size,0,'all parent deadlines and pending frame timers cleared');
 }finally{Object.assign(globalThis,original);}
});
