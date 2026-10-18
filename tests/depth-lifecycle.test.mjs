import test from 'node:test';
import assert from 'node:assert/strict';
class Element{
 constructor(){this.handlers={};this.disabled=false;this.value='';this.hidden=false;this.textContent='';this.width=224;this.height=168;}
 addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);}
 async fire(type,event={}){for(const fn of this.handlers[type]||[])await fn(event);}
 setAttribute(){}
 getBoundingClientRect(){return {width:400,height:300};}
 getContext(){return {drawImage(){},clearRect(){},putImageData(){},fillRect(){},getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)})};}
}
test('depth session backpressure, pause/step, hidden cleanup, stale responses and permission cancellation',async()=>{
 const ids='start stop pause step status capability backend resolution facing frequency video standby depth-image relief empty view-depth view-relief result-title relief-tools rotate-left rotate-right relief-out relief-in reset-view inference average rate age engine diagnostic-log diagnostics-panel copy-log clear-log log-status'.split(' ');
 const el=Object.fromEntries(ids.map(id=>[id,new Element()]));el.backend.value='auto';el.resolution.value='224';el.frequency.value='5';el.facing.value='environment';
 Object.assign(el.video,{videoWidth:640,videoHeight:480,currentTime:1,readyState:2,play:async()=>{}});
 const doc=new Element();doc.hidden=false;doc.getElementById=id=>el[id];doc.createElement=()=>new Element();globalThis.document=doc;
 globalThis.window=new Element();window.isSecureContext=true;globalThis.requestAnimationFrame=()=>1;
 globalThis.ImageData=class {constructor(data,width,height){Object.assign(this,{data,width,height});}};
 let stopped=0;const track=new Element();track.stop=()=>stopped++;const media={getTracks:()=>[track],getVideoTracks:()=>[track]};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:async()=>media}}});
 let active;globalThis.Worker=class{constructor(){active=this;this.messages=[];}postMessage(m){this.messages.push(m);}terminate(){this.terminated=true;}};
 await import('../depth.js');
 await el.start.fire('click');assert.equal(el.stop.disabled,false);assert.equal(active.messages[0].type,'init');
 active.onmessage({data:{type:'ready',backend:'wasm',precision:'INT8',modelBytes:27000000}});
 assert.equal(active.messages.filter(m=>m.type==='frame').length,1);
 await new Promise(r=>setTimeout(r,240));assert.equal(active.messages.length,2,'no queued frame while inference is busy');
 await el.pause.fire('click');
 const frame=active.messages.at(-1),result={type:'depth',id:frame.id,width:224,height:168,inferenceMs:42,depth:new Float32Array(224*168).buffer,pixels:new Uint8Array(224*168*4).buffer};
 active.onmessage({data:result});assert.equal(el.step.disabled,false);assert.equal(el.average.textContent,'Warming up');
 await new Promise(r=>setTimeout(r,240));assert.equal(active.messages.length,2,'paused does not schedule inference');
 el.video.currentTime=2;await el.step.fire('click');assert.equal(active.messages.length,3);assert.equal(el.step.disabled,true);
 result.id=active.messages.at(-1).id;active.onmessage({data:result});assert.equal(el.average.textContent,'42 ms');
 const old=active;doc.hidden=true;await doc.fire('visibilitychange');assert.equal(stopped,1);assert.equal(old.terminated,true);assert.equal(el.video.srcObject,null);assert.equal(el.start.disabled,false);
 old.onmessage({data:{type:'ready',backend:'webgpu',precision:'FP16',modelBytes:50000000}});assert.equal(el.video.srcObject,null);assert.equal(el.pause.disabled,true);
 doc.hidden=false;let resolve;navigator.mediaDevices.getUserMedia=()=>new Promise(r=>resolve=r);
 const pending=el.start.fire('click');await el.stop.fire('click');resolve(media);await pending;assert.equal(stopped,2);assert.equal(el.video.srcObject,null);
 // A worker GPU failure must survive cleanup and be copyable, with no camera payload.
 navigator.mediaDevices.getUserMedia=async()=>media;el.backend.value='webgpu';
 await el.start.fire('click');
 active.onmessage({data:{type:'diagnostic',level:'warn',event:'gpu.requestAdapter.null'}});
 active.onmessage({data:{type:'error',stage:'gpu-probe',error:{name:'Error',message:'requestAdapter returned null'},message:'GPU unavailable'}});
 assert.equal(stopped,3);assert.equal(active.terminated,true);assert.equal(el['diagnostics-panel'].open,true);
 assert.match(el['diagnostic-log'].value,/worker.gpu.requestAdapter.null/);assert.match(el['diagnostic-log'].value,/gpu-probe/);
 let copied;navigator.clipboard={writeText:async text=>copied=text};await el['copy-log'].fire('click');
 assert.match(copied,/depth-lab-2/);assert.match(copied,/GPU unavailable/);assert.match(el['log-status'].textContent,/copied/);
 assert.doesNotMatch(copied,/pixels|deviceId/);
 navigator.clipboard.writeText=async()=>{throw Error('denied');};let selected=false;
 Object.assign(el['diagnostic-log'],{focus(){},select(){selected=true;},setSelectionRange(){}});
 await el['copy-log'].fire('click');assert.equal(selected,true);assert.match(el['log-status'].textContent,/selected/);
 await el['clear-log'].fire('click');assert.doesNotMatch(el['diagnostic-log'].value,/GPU unavailable/);
});
