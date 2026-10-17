import test from 'node:test';
import assert from 'node:assert/strict';
import {fullView,zoomRegion,zoomAt,panView,imageBox,viewBox,imagePoint,followRegion,cropGray} from '../camera-zoom.js';
import {VisualTracker} from '../camera-tracker.js';
test('pinch anchor stays under the fingers and zoom/pan clamp to the image',()=>{
 const anchor={x:.75,y:.4},destination={x:.6,y:.5};
 const view=zoomAt(fullView(),3,anchor,destination),world=imagePoint(destination,zoomRegion(view));
 assert.ok(Math.abs(world.x-anchor.x)<1e-9);assert.ok(Math.abs(world.y-anchor.y)<1e-9);
 assert.equal(zoomAt(fullView(),20).scale,8);assert.deepEqual(zoomAt(view,.5),fullView());
 assert.deepEqual(panView({scale:2,x:.25,y:.25},10,-10),{scale:2,x:0,y:.5});
});
test('zoom box/tap coordinates map back to full-image coordinates',()=>{
 const region={x1:.25,y1:.1,x2:.75,y2:.6},box={x1:.2,y1:.2,x2:.8,y2:.8};
 const mapped=imageBox(box,region),roundTrip=viewBox(mapped,region);
 for(const key of Object.keys(box))assert.ok(Math.abs(roundTrip[key]-box[key])<1e-9);
 assert.ok(Math.abs(mapped.x1-.35)<1e-9);assert.ok(Math.abs(mapped.y2-.5)<1e-9);
});
test('tracking crop follows the target beyond the original zoom window',()=>{
 const width=640,height=360;
 function frame(cx){const data=new Uint8Array(width*height).fill(20);for(let y=150;y<210;y++)for(let x=Math.max(0,cx-30);x<Math.min(width,cx+30);x++)data[y*width+x]=120+45*Math.sin((x-cx)*.35)+40*Math.cos((y-180)*.46);return {data,width,height};}
 let box={x1:120/640,y1:158/360,x2:180/640,y2:202/360},region=followRegion(box,4);
 const tracker=new VisualTracker(cropGray(frame(150),region),viewBox(box,region));assert.equal(tracker.valid,true);
 for(let cx=154;cx<=470;cx+=4){
  const next=followRegion(box,4);tracker.reframe(region,next);region=next;
  const result=tracker.update(cropGray(frame(cx),region));assert.ok(result,'target stays tracked');
  box=imageBox(result.box,region);assert.ok(Math.abs((box.x1+box.x2)*320-cx)<3);
 }
 assert.ok(box.x1>.65,'target has travelled across the full image');
});
test('zoom selection preserves detail that a full-frame tracker would downsample away',()=>{
 const width=1280,height=720,data=new Uint8Array(width*height).fill(18);
 for(let y=352;y<368;y++)for(let x=592;x<608;x++)data[y*width+x]=80+(x*17+y*29)%140;
 const frame={data,width,height},box={x1:592/width,y1:352/height,x2:608/width,y2:368/height};
 const full=zoomRegion(fullView()),crop=followRegion(box,8);
 assert.equal(new VisualTracker(cropGray(frame,full),box).valid,false);
 assert.equal(new VisualTracker(cropGray(frame,crop),viewBox(box,crop)).valid,true);
});
class Element {
 constructor(){this.handlers={};this.value='';this.style={};this.children=[];this.dataset={};this.textContent='';}
 addEventListener(t,f){(this.handlers[t]??=[]).push(f);}async fire(t,event={}){for(const f of this.handlers[t]||[])await f({...event,type:t});}
 append(e){this.children.push(e);}replaceChildren(){this.children=[];}setAttribute(){}getBoundingClientRect(){return {left:0,top:0,width:400,height:600};}
}
test('pinch clears full-view boxes, rejects stale inference, crops YOLO and selects into full-image lock',async()=>{
 const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout,oldPerformance=globalThis.performance;let clock=0,id=0;const timers=new Map();
 globalThis.setTimeout=(fn,ms=0)=>{timers.set(++id,{fn,at:clock+ms});return id;};globalThis.clearTimeout=id=>timers.delete(id);Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
 const tick=ms=>{const end=clock+ms;for(;;){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;clock=due[1].at;timers.delete(due[0]);due[1].fn();}clock=end;};
 const els=Object.fromEntries('video camera-image select-area zoom-in zoom-out zoom-reset zoom-value objects-title overlay viewfinder start stop camera-facing unlock status model-status confidence confidence-value placeholder lock-readout exit-marker rate objects'.split(' ').map(x=>[x,new Element()]));
 els.confidence.value='45';els['camera-facing'].value='environment';const draws=[];
 const ctx=new Proxy({drawImage:(...args)=>draws.push(args),measureText:t=>({width:t.length*7}),getImageData:(x,y,w,h)=>({data:Uint8ClampedArray.from({length:w*h*4},(_,i)=>i%4===3?255:(Math.floor(i/4)*13)%251)})},{get:(o,k)=>o[k]||(()=>{})});
 els.overlay.getContext=()=>ctx;els.viewfinder.clientWidth=400;els.viewfinder.clientHeight=600;Object.assign(els.video,{videoWidth:1280,videoHeight:720,readyState:2,play:async()=>{}});Object.defineProperty(els.video,'currentTime',{get:()=>clock/1000});
 const doc=new Element();Object.assign(doc,{hidden:false,body:new Element(),getElementById:id=>els[id],querySelector:()=>new Element(),createElement:tag=>tag==='canvas'?{getContext:()=>ctx}:new Element()});globalThis.document=doc;globalThis.window=new Element();globalThis.localStorage={getItem:()=>null};globalThis.getComputedStyle=()=>({getPropertyValue:()=> '#dfbc7d'});globalThis.devicePixelRatio=1;globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
 const track={stop:()=>{},addEventListener:()=>{}};Object.defineProperty(globalThis,'navigator',{value:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[track],getVideoTracks:()=>[track]})}},configurable:true});
 let worker;globalThis.Worker=class{constructor(){worker=this;this.messages=[];}postMessage(m){this.messages.push(m);}terminate(){this.terminated=true;}};
 try{
  await import('../camera.js');await els.start.fire('click');worker.onmessage({data:{type:'ready'}});tick(100);
  const deliver=()=>worker.onmessage({data:{type:'detections',generation:1,width:640,height:360,ms:100,output:new Float32Array([200,100,400,240,.9,41]).buffer}});
  deliver();assert.equal(els.objects.children[0].textContent,'cup #1');tick(100); // A full-view inference is now in flight.
  const pointer=(pointerId,clientX,clientY)=>({pointerId,clientX,clientY,button:0,preventDefault:()=>{}});
  await els.overlay.fire('pointerdown',pointer(1,280,300));await els.overlay.fire('pointerdown',pointer(2,320,300));await els.overlay.fire('pointermove',pointer(2,360,300));
  assert.match(els['zoom-value'].textContent,/2×/);assert.equal(els.objects.children.length,1);assert.notEqual(els.objects.children[0].textContent,'cup #1','main-view labels cleared');
  deliver();assert.notEqual(els.objects.children[0].textContent,'cup #1','old full-view inference ignored');
  await els.overlay.fire('pointerup',pointer(1,280,300));await els.overlay.fire('pointerup',pointer(2,360,300));
  tick(100);assert.ok(draws.some(a=>a.length===9&&Math.abs(a[1]-448)<1e-8&&Math.abs(a[2]-180)<1e-8&&Math.abs(a[3]-640)<1e-8&&Math.abs(a[4]-360)<1e-8),'YOLO reads the displayed crop');deliver();
  // A pinch-generated click must not accidentally lock an object.
  await els.overlay.fire('click',{clientX:187.5,clientY:293.75});assert.notEqual(worker.terminated,true);
  tick(500);await els.overlay.fire('click',{clientX:187.5,clientY:293.75});
  assert.equal(worker.terminated,true);assert.equal(els['zoom-value'].textContent,'1× · Full view');assert.match(els['lock-readout'].textContent,/CUP · MOVE DEVICE RIGHT/,'lock uses global image position');assert.equal(els['zoom-in'].disabled,true);
  doc.hidden=true;await doc.fire('visibilitychange');assert.equal(timers.size,0);
 }finally{globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;Object.defineProperty(globalThis,'performance',{value:oldPerformance,configurable:true});}
});
