import test from 'node:test';
import assert from 'node:assert/strict';
import {reacquireCandidate,sameReacquisition} from '../camera-core.js';
const target={label:'cup',exit:'right',box:{x1:.85,y1:.3,x2:.99,y2:.6}};
const returning={label:'cup',score:.9,box:{x1:.8,y1:.3,x2:.94,y2:.6}};
test('reacquisition rejects wrong label, weak appearance, low confidence and incompatible size',()=>{
 assert.equal(reacquireCandidate(target,[{...returning,label:'person'}],()=>.9),null);
 assert.equal(reacquireCandidate(target,[returning],()=>.5),null);
 assert.equal(reacquireCandidate(target,[{...returning,score:.4}],()=>.9),null);
 assert.equal(reacquireCandidate(target,[{...returning,box:{x1:.89,y1:.4,x2:.9,y2:.41}}],()=>.9),null);
 assert.equal(reacquireCandidate(target,[returning],()=>.9),returning);
});
test('ambiguous returning objects are not automatically selected',()=>{
 assert.equal(reacquireCandidate(target,[returning,{...returning,box:{x1:.7,y1:.3,x2:.84,y2:.6}}],()=>.9),null);
});
test('exit edge gates early search; later search permits panning across the view',()=>{
 const otherSide={...returning,box:{x1:.1,y1:.3,x2:.24,y2:.6}};
 assert.equal(reacquireCandidate(target,[otherSide],()=>.9,1),null);
 assert.equal(reacquireCandidate(target,[otherSide],()=>.9,5),otherSide);
 assert.equal(sameReacquisition(returning,{...returning}),true);
 assert.equal(sameReacquisition(returning,otherSide),false);
});
test('appearance matching compares the actual retained image template',async()=>{
 const {VisualTracker}=await import('../camera-tracker.js?v=2');
 const width=160,height=100,data=new Uint8Array(width*height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)data[y*width+x]=120+45*Math.sin(x*.3)+40*Math.cos(y*.5);
 const box={x1:.3,y1:.2,x2:.65,y2:.7},frame={data,width,height};
 const tracker=new VisualTracker(frame,box);assert.equal(tracker.valid,true);
 assert.ok(tracker.similarity(frame,box)>.99);
 assert.ok(tracker.similarity({data:data.map(v=>255-v),width,height},box)<.6);
});
class Element {
 constructor(){this.handlers={};this.value='';this.disabled=false;this.hidden=false;this.style={};this.dataset={};this.children=[];this.textContent='';}
 addEventListener(t,f){(this.handlers[t]??=[]).push(f);}async fire(t){for(const f of this.handlers[t]||[])await f();}
 append(e){this.children.push(e);}replaceChildren(){this.children=[];}setAttribute(){}getBoundingClientRect(){return {left:0,top:0,width:400,height:600};}
}
test('likely exit restarts YOLO, two confirmations relock and stop YOLO; timeout stops searching',async()=>{
 const originalSetTimeout=globalThis.setTimeout,originalClearTimeout=globalThis.clearTimeout,originalPerformance=globalThis.performance;
 let clock=0,nextId=0;const timers=new Map();
 globalThis.setTimeout=(fn,delay=0)=>{const id=++nextId;timers.set(id,{fn,at:clock+delay});return id;};globalThis.clearTimeout=id=>timers.delete(id);
 Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
 const tick=ms=>{const until=clock+ms;for(;;){const due=[...timers].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;clock=due[1].at;timers.delete(due[0]);due[1].fn();}clock=until;};
 const els=Object.fromEntries('video overlay viewfinder start stop camera-facing unlock status model-status confidence confidence-value placeholder lock-readout exit-marker rate objects'.split(' ').map(id=>[id,new Element()]));
 els.confidence.value='45';els['camera-facing'].value='environment';
 const context=new Proxy({measureText:t=>({width:t.length*7}),getImageData:(x,y,w,h)=>({data:Uint8ClampedArray.from({length:w*h*4},(_,i)=>i%4===3?255:(Math.floor(i/4)*13)%251)})},{get:(o,k)=>o[k]||(()=>{})});
 els.overlay.getContext=()=>context;els.viewfinder.clientWidth=400;els.viewfinder.clientHeight=600;
 Object.assign(els.video,{videoWidth:1280,videoHeight:720,readyState:2,play:async()=>{}});Object.defineProperty(els.video,'currentTime',{get:()=>clock/1000});
 const doc=new Element();Object.assign(doc,{hidden:false,body:new Element(),getElementById:id=>els[id],querySelector:()=>new Element(),createElement:tag=>tag==='canvas'?{getContext:()=>context}:new Element()});
 globalThis.document=doc;globalThis.window=new Element();globalThis.localStorage={getItem:()=>null};globalThis.getComputedStyle=()=>({getPropertyValue:()=> '#dfbc7d'});globalThis.devicePixelRatio=1;globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
 const track={stop:()=>{},addEventListener:()=>{}};Object.defineProperty(globalThis,'navigator',{value:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[track],getVideoTracks:()=>[track]})}},configurable:true});
 let worker;const workers=[];globalThis.Worker=class{constructor(){worker=this;workers.push(this);this.messages=[];}postMessage(m){this.messages.push(m);}terminate(){this.terminated=true;}};
 // Isolate the app state machine from tracker geometry, covered in its own tests.
 const {VisualTracker}=await import('../camera-tracker.js?v=2');const update=VisualTracker.prototype.update,similarity=VisualTracker.prototype.similarity;
 VisualTracker.prototype.update=()=>null;VisualTracker.prototype.similarity=()=>.95;
 try{
  await import('../camera.js');await els.start.fire('click');worker.onmessage({data:{type:'ready'}});tick(100);
  const deliver=()=>worker.onmessage({data:{type:'detections',generation:1,width:640,height:360,ms:100,output:new Float32Array([560,100,639,200,.9,41]).buffer}});
  deliver();await els.objects.children[0].fire('click');assert.equal(worker.terminated,true);
  tick(400);assert.equal(workers.length,2,'exit automatically creates YOLO worker');assert.match(els['lock-readout'].textContent,/REACQUIRING/);
  const searching=worker;searching.onmessage({data:{type:'ready'}});tick(100);deliver();assert.notEqual(searching.terminated,true,'one match is insufficient');
  tick(100);deliver();assert.equal(searching.terminated,true,'confirmed match stops YOLO');assert.match(els.status.textContent,/reacquired/);assert.equal(els['model-status'].textContent,'Visual tracker · YOLO stopped');
  tick(400);assert.equal(workers.length,3,'a later exit can start a new search');const timeoutWorker=worker;
  tick(30001);assert.equal(timeoutWorker.terminated,true);assert.match(els.status.textContent,/without a reliable match/);assert.match(els['lock-readout'].textContent,/LIKELY EXIT/);
  await els.unlock.fire('click');assert.equal(workers.length,4,'manual scan remains available');
  worker.onmessage({data:{type:'ready'}});tick(100);deliver();await els.objects.children[0].fire('click');tick(400);
  assert.equal(workers.length,5,'automatic search restarts after a new manual selection');
  doc.hidden=true;await doc.fire('visibilitychange');assert.equal(worker.terminated,true);assert.equal(timers.size,0,'hiding cancels all search and detector timers');
 }finally{
  VisualTracker.prototype.update=update;VisualTracker.prototype.similarity=similarity;globalThis.setTimeout=originalSetTimeout;globalThis.clearTimeout=originalClearTimeout;Object.defineProperty(globalThis,'performance',{value:originalPerformance,configurable:true});
 }
});
