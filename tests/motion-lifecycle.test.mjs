// Controlled API tests, NOT evidence of physical ARCore tracking.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
class Events {
  handlers={};
  addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);}
  async emit(name,event={}){for(const fn of this.handlers[name]||[])await fn(event);}
}
function fakeSession(){
  const s=new Events();s.visibilityState='visible';s.domOverlayState={type:'screen'};s.reference=new Events();s.ended=0;
  s.end=async()=>{s.ended++;await s.emit('end');};
  s.requestReferenceSpace=async()=>s.reference;s.updateRenderState=state=>s.renderState=state;
  s.requestAnimationFrame=fn=>s.frame=fn;return s;
}
async function setup({supported=true,request,glOK=true}={}){
  const nodes=new Map();const ctx2=new Proxy({}, {get:()=>()=>{}});
  const gl={makeXRCompatible:async()=>{},getExtension:()=>({loseContext(){}}),bindFramebuffer(){},clearColor(){},clear(){}};
  function node(){const e=new Events();e.textContent='';e.value='30';e.disabled=false;e.getContext=type=>type==='2d'?ctx2:(glOK?gl:null);e.click=()=>{};return e;}
  const document={body:{dataset:{}},getElementById:id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},createElement:node};
  let saved;
  const context=vm.createContext({document,window:new Events(),navigator:{userAgent:'controlled-test',xr:{isSessionSupported:async()=>supported,requestSession:request|| (async()=>fakeSession())}},isSecureContext:true,localStorage:{getItem:()=>null},Date,Blob,URL:{createObjectURL:b=>{saved=b;return 'blob:test';},revokeObjectURL(){}},setTimeout:()=>0,XRWebGLLayer:class{framebuffer={};}});
  const core=new vm.SourceTextModule(await readFile(new URL('../motion-core.mjs',import.meta.url),'utf8'),{context});
  const pathModule=new vm.SourceTextModule(await readFile(new URL('../motion-path.mjs',import.meta.url),'utf8'),{context});
  await core.link(()=>pathModule);
  const controller=new vm.SourceTextModule(await readFile(new URL('../motion.js',import.meta.url),'utf8'),{context});
  const replay=new vm.SyntheticModule(['createMotionReplay'],function(){this.setExport('createMotionReplay',()=>({update(){},stop(){}}));},{context});
  const replayCore=new vm.SourceTextModule(await readFile(new URL('../motion-replay-core.mjs',import.meta.url),'utf8'),{context});await replayCore.link(()=>pathModule);
  const heading=new vm.SourceTextModule(await readFile(new URL('../motion-heading.mjs',import.meta.url),'utf8'),{context});await heading.link(spec=>spec.includes('motion-path')?pathModule:replayCore);
  const correction=new vm.SourceTextModule(await readFile(new URL('../motion-correction.mjs',import.meta.url),'utf8'),{context});await correction.link(spec=>spec.includes('motion-heading')?heading:spec.includes('motion-path')?pathModule:replayCore);
  await controller.link(spec=>spec.includes('motion-correction')?correction:spec.includes('motion-replay.js')?replay:spec.includes('motion-path')?pathModule:core);await controller.evaluate();
  return {nodes,click:id=>nodes.get(id).emit('click'),saved:()=>saved,context};
}
const pose=x=>({transform:{position:{x,y:0,z:0},orientation:{x:0,y:0,z:0,w:1}}});
test('unsupported device disables start and never requests a session',async()=>{
  const h=await setup({supported:false,request:()=>{throw Error('must not request');}});
  assert.equal(h.nodes.get('start').disabled,true);assert.match(h.nodes.get('status').textContent,/cannot provide/);
});
test('denied permission allows retry with actionable error',async()=>{
  const h=await setup({request:async()=>{throw new Error('Permission denied');}});await h.click('start');
  assert.equal(h.nodes.get('start').disabled,false);assert.match(h.nodes.get('status').textContent,/Permission denied/);
});
test('track, gap, reset, export, end and restart with fresh origin',async()=>{
  let s=fakeSession();const h=await setup({request:async()=>s});await h.click('start');
  s.frame(0,{session:s,getViewerPose:()=>pose(10)});s.frame(100,{session:s,getViewerPose:()=>pose(11)});
  assert.equal(h.nodes.get('distance').textContent,'1.00 m');
  s.frame(200,{session:s,getViewerPose:()=>null});assert.match(h.nodes.get('position').textContent,/No current/);
  s.frame(300,{session:s,getViewerPose:()=>pose(12)});await h.click('save');
  let data=JSON.parse(await h.saved().text());assert.equal(data.samples.length,3);assert.equal(data.samples[2].segment,1);
  await s.reference.emit('reset');assert.equal(h.nodes.get('save').disabled,true);
  s.frame(400,{session:s,getViewerPose:()=>pose(99)});assert.equal(h.nodes.get('distance').textContent,'0.00 m');
  await h.click('stop');assert.equal(s.ended,1);assert.equal(h.nodes.get('start').disabled,false);assert.equal(h.nodes.get('save').disabled,false);
  s=fakeSession();await h.click('start');assert.equal(h.nodes.get('save').disabled,true);await h.click('stop');
});
test('stop while permission pending closes late session without starting frames',async()=>{
  let resolve;const promise=new Promise(r=>resolve=r);const h=await setup({request:()=>promise});
  const start=h.click('start');await h.click('stop');const s=fakeSession();resolve(s);await start;
  assert.equal(s.ended,1);assert.equal(s.frame,undefined);assert.equal(h.nodes.get('start').disabled,false);
});
test('failed graphics initialization ends acquired session and restores controls',async()=>{
  const s=fakeSession();const h=await setup({request:async()=>s,glOK:false});await h.click('start');
  assert.equal(s.ended,1);assert.equal(h.nodes.get('start').disabled,false);assert.match(h.nodes.get('status').textContent,/WebGL/);
});
test('emulated poses are not saved; visibility interruption breaks the trail',async()=>{
  const s=fakeSession();const h=await setup({request:async()=>s});await h.click('start');
  s.frame(0,{session:s,getViewerPose:()=>({...pose(0),emulatedPosition:true})});assert.equal(h.nodes.get('save').disabled,true);
  s.frame(100,{session:s,getViewerPose:()=>pose(0)});s.visibilityState='hidden';await s.emit('visibilitychange');
  assert.match(h.nodes.get('position').textContent,/No current/);s.visibilityState='visible';
  s.frame(200,{session:s,getViewerPose:()=>pose(1)});await h.click('save');const data=JSON.parse(await h.saved().text());assert.equal(data.samples[1].segment,1);
});
test('selector defaults to 30, locks during tracking, exports requested rate and supports next-session Maximum',async()=>{
  let s=fakeSession();const h=await setup({request:async()=>s});
  assert.equal(h.nodes.get('capture-rate').value,'30');await h.click('start');
  assert.equal(h.nodes.get('capture-rate').disabled,true);
  for(let i=0;i<=120;i++)s.frame(i*1000/60,{session:s,getViewerPose:()=>pose(i*.01)});
  assert.match(h.nodes.get('capture-rate-status').textContent,/30.0 Hz/);
  await h.click('save');let data=JSON.parse(await h.saved().text());assert.equal(data.samples.length,61);assert.equal(data.sampling.requestedHz,30);
  await h.click('stop');assert.equal(h.nodes.get('capture-rate').disabled,false);
  h.nodes.get('capture-rate').value='0';await h.nodes.get('capture-rate').emit('change');assert.match(h.nodes.get('capture-rate-help').textContent,/every available/);
  s=fakeSession();await h.click('start');for(let i=0;i<120;i++)s.frame(i*1000/60,{session:s,getViewerPose:()=>pose(i*.01)});
  await h.click('save');data=JSON.parse(await h.saved().text());assert.equal(data.samples.length,120);assert.equal(data.sampling.mode,'maximum');
});
test('live jump warning persists after recovery; stopping adds no spurious gap; export retains annotation',async()=>{
 const s=fakeSession();const h=await setup({request:async()=>s});await h.click('start');
 s.frame(0,{session:s,getViewerPose:()=>pose(0)});s.frame(30,{session:s,getViewerPose:()=>pose(1.5)});s.frame(130,{session:s,getViewerPose:()=>pose(1.6)});
 assert.match(h.nodes.get('capture-quality').textContent,/1 suspected position jump/);
 assert.match(h.nodes.get('diagnostics').textContent,/Tracking quality/);
 await h.click('stop');await h.click('save');const data=JSON.parse(await h.saved().text());
 assert.equal(data.quality.jumps,1);assert.equal(data.quality.gaps,0);assert.equal(data.samples[1].breakReason,'position-jump');assert.equal(data.samples[1].x,1.5);
});

test('Save trajectory applies automatic gap correction without changing capture position',async()=>{
 const s=fakeSession(),h=await setup({request:async()=>s});await h.click('start');
 for(const [t,x] of [[0,0],[100,.1],[200,.2]])s.frame(t,{session:s,getViewerPose:()=>pose(x)});
 s.frame(250,{session:s,getViewerPose:()=>null});s.frame(500,{session:s,getViewerPose:()=>pose(2)});s.frame(600,{session:s,getViewerPose:()=>pose(2.1)});
 const live=h.nodes.get('position').textContent;await h.click('save');const data=JSON.parse(await h.saved().text());
 assert.ok(Math.abs(data.samples.at(-1).x-.6)<1e-9);assert.deepEqual(data.gapCorrections.motionSamples,[3]);assert.equal(h.nodes.get('position').textContent,live);
 await h.click('save');assert.deepEqual(JSON.parse(await h.saved().text()).samples,data.samples);
});
