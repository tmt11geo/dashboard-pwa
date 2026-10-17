import test from 'node:test';
import assert from 'node:assert/strict';
import {selectionBox} from '../camera-zoom.js';
test('manual rectangles support reverse drags, zoom mapping, clipping and minimum size',()=>{
 const region={x1:.25,y1:.25,x2:.75,y2:.75},size={w:400,h:225};
 assert.deepEqual(selectionBox({x:.8,y:.8},{x:.2,y:.2},region,size),{x1:.35,y1:.35,x2:.65,y2:.65});
 assert.deepEqual(selectionBox({x:-.1,y:-.1},{x:1.2,y:1.2},region,size),region);
 assert.equal(selectionBox({x:.2,y:.2},{x:.21,y:.6},region,size),null);
 assert.equal(selectionBox({x:.2,y:.2},{x:.6,y:.21},region,size),null);
});
class Element {
 constructor(){this.handlers={};this.value='';this.style={};this.children=[];this.dataset={};this.textContent='';this.attributes={};}
 addEventListener(t,f){(this.handlers[t]??=[]).push(f);}async fire(t,event={}){for(const f of this.handlers[t]||[])await f({...event,type:t});}
 append(e){this.children.push(e);}replaceChildren(){this.children=[];}setAttribute(k,v){this.attributes[k]=v;}getBoundingClientRect(){return {left:0,top:0,width:400,height:600};}
}
test('unlabelled manual selection works after zoom; small/blank/cancelled boxes do not lock; manual loss does not invoke YOLO',async()=>{
 const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout,oldPerformance=globalThis.performance;let clock=0,id=0,blank=false;const timers=new Map();
 globalThis.setTimeout=(fn,ms=0)=>{timers.set(++id,{fn,at:clock+ms});return id;};globalThis.clearTimeout=id=>timers.delete(id);Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
 const tick=ms=>{const end=clock+ms;for(;;){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;clock=due[1].at;timers.delete(due[0]);due[1].fn();}clock=end;};
 const els=Object.fromEntries('video camera-image select-area zoom-in zoom-out zoom-reset zoom-value objects-title overlay viewfinder start stop camera-facing unlock status model-status confidence confidence-value placeholder lock-readout exit-marker rate objects'.split(' ').map(x=>[x,new Element()]));
 els.confidence.value='45';els['camera-facing'].value='environment';
 const ctx=new Proxy({measureText:t=>({width:t.length*7}),getImageData:(x,y,w,h)=>({data:blank?new Uint8ClampedArray(w*h*4):Uint8ClampedArray.from({length:w*h*4},(_,i)=>i%4===3?255:(Math.floor(i/4)*13)%251)})},{get:(o,k)=>o[k]||(()=>{})});
 els.overlay.getContext=()=>ctx;els.viewfinder.clientWidth=400;els.viewfinder.clientHeight=600;Object.assign(els.video,{videoWidth:1280,videoHeight:720,readyState:2,play:async()=>{}});Object.defineProperty(els.video,'currentTime',{get:()=>clock/1000});
 const doc=new Element();Object.assign(doc,{hidden:false,body:new Element(),getElementById:id=>els[id],querySelector:()=>new Element(),createElement:tag=>tag==='canvas'?{getContext:()=>ctx}:new Element()});globalThis.document=doc;globalThis.window=new Element();globalThis.localStorage={getItem:()=>null};globalThis.getComputedStyle=()=>({getPropertyValue:()=> '#dfbc7d'});globalThis.devicePixelRatio=1;globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
 const track={stop:()=>{},addEventListener:()=>{}};Object.defineProperty(globalThis,'navigator',{value:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[track],getVideoTracks:()=>[track]})}},configurable:true});
 const workers=[];globalThis.Worker=class{constructor(url,options){this.url=String(url);this.options=options;workers.push(this);this.messages=[];}postMessage(m){this.messages.push(m);}terminate(){this.terminated=true;}};
 const {VisualTracker}=await import('../camera-tracker.js?v=4');const update=VisualTracker.prototype.update;VisualTracker.prototype.update=()=>null;
 const pointer=(x,y,id=1)=>({pointerId:id,clientX:x,clientY:y,button:0,preventDefault:()=>{}});
 const drag=async(x1,y1,x2,y2,ending='pointerup')=>{await els.overlay.fire('pointerdown',pointer(x1,y1));await els.overlay.fire('pointermove',pointer(x2,y2));await els.overlay.fire(ending,pointer(x2,y2));};
 try{
  await import('../camera.js');await els.start.fire('click');await els['zoom-in'].fire('click');await els['select-area'].fire('click');
  assert.equal(workers[0].terminated,true);assert.equal(els['select-area'].attributes['aria-pressed'],'true');assert.match(els['lock-readout'].textContent,/DRAW A BOX/);
  await drag(280,250,284,330);assert.match(els.status.textContent,/larger box/);assert.match(els['lock-readout'].textContent,/DRAW A BOX/);
  blank=true;await drag(280,250,380,330);assert.match(els.status.textContent,/too little visual detail/);assert.equal(els['zoom-value'].textContent,'1.5× · Selection area');
  blank=false;await drag(280,250,380,330,'pointercancel');assert.match(els['lock-readout'].textContent,/DRAW A BOX/);
  // A second finger cancels the draft and permits pinch zoom without choosing a target.
  await els.overlay.fire('pointerdown',pointer(240,300,1));await els.overlay.fire('pointerdown',pointer(280,300,2));await els.overlay.fire('pointermove',pointer(320,300,2));await els.overlay.fire('pointerup',pointer(240,300,1));await els.overlay.fire('pointerup',pointer(320,300,2));
  assert.match(els['lock-readout'].textContent,/DRAW A BOX/);assert.equal(workers.length,1);
  await els['zoom-reset'].fire('click');await els['zoom-in'].fire('click');
  await drag(280,250,380,330);assert.equal(els['zoom-value'].textContent,'1× · Full view');assert.match(els['lock-readout'].textContent,/MANUAL TARGET · MOVE DEVICE RIGHT/);assert.equal(els['select-area'].attributes['aria-pressed'],'false');assert.equal(workers.length,1,'manual lock never creates an inference worker');
  // Replace that lock with a manual target near the full-image right edge.
  await els['select-area'].fire('click');await drag(280,250,395,330);tick(900);
  assert.match(els['lock-readout'].textContent,/REACQUIRING BITMAP · RIGHT/);assert.equal(workers.length,2,'manual exit starts a bitmap worker');
  const search=workers[1];assert.match(search.url,/camera-bitmap-worker/);assert.equal(search.options.type,'module');
  assert.equal(search.messages[0].reference.anchor.length,256);
  search.onmessage({data:{type:'ready'}});tick(0);
  assert.equal(search.messages.filter(m=>m.type==='frame').length,1);
  const candidate={kind:'manual',label:'Manual target',score:.95,box:{x1:.72,y1:.3,x2:.96,y2:.6}};
  const confirm=()=>search.onmessage({data:{type:'match',match:candidate,ms:10}});
  confirm();assert.notEqual(search.terminated,true,'one confirmation is insufficient');tick(250);
  search.onmessage({data:{type:'match',match:null,ms:10}});assert.match(els.rate.textContent,/waiting for a reliable match/);tick(250);
  confirm();assert.notEqual(search.terminated,true,'a missed match resets confirmation');tick(250);
  confirm();assert.notEqual(search.terminated,true,'two confirmations are insufficient');tick(250);
  confirm();assert.equal(search.terminated,true,'third confirmation restores lock and stops search');assert.match(els.status.textContent,/Bitmap target reacquired/);
  search.onmessage({data:{type:'error'}});assert.match(els.status.textContent,/Bitmap target reacquired/,'stale worker results ignored');
  // Another exit can start another bitmap search; replacement must cancel it.
  tick(900);assert.equal(workers.length,3);const stalledSearch=workers[2];
  stalledSearch.onmessage({data:{type:'ready'}});tick(0);tick(10001);assert.equal(stalledSearch.terminated,true,'stalled search is terminated');assert.match(els.status.textContent,/stalled/);
  await els['select-area'].fire('click');await drag(280,250,395,330);tick(900);const cancelledSearch=workers[3];
  await els['select-area'].fire('click');await els['select-area'].fire('click');assert.equal(cancelledSearch.terminated,true,'replacement cancels active bitmap search');assert.equal(workers.length,5,'cancel returns to ordinary YOLO scanning');assert.equal(els['select-area'].attributes['aria-pressed'],'false');
  doc.hidden=true;await doc.fire('visibilitychange');assert.equal(workers[4].terminated,true);assert.equal(timers.size,0);
 }finally{VisualTracker.prototype.update=update;globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;Object.defineProperty(globalThis,'performance',{value:oldPerformance,configurable:true});}
});
