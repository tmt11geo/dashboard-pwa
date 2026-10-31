import test from 'node:test';
import assert from 'node:assert/strict';
import {OrbitView,bindOrbit} from '../motion-replay-orbit.mjs';
import {plane,pathDistances} from '../motion-replay-view.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('default orbit basis matches previous overview; depth basis is perpendicular',()=>{
 const v=new OrbitView();
 for(const p of [[1,0,0],[0,1,0],[0,0,1]]){const a=v.vector(p),b=plane(p);near(a[0],b[0]);near(a[1],b[1]);}
 v.orbit(150,-100);const right=[0,1,2].map(i=>v.vector([0,1,2].map(j=>i===j?1:0))[0]);
 near(v.depth(right),0);
});
test('orbit changes projection, pan/zoom are bounded, reset restores overview exactly',()=>{
 const samples=[{x:-10,y:20,z:7},{x:30,y:-40,z:-9}],v=new OrbitView(samples),p=[1,2,3],initial=v.project(p);
 for(const s of samples){const q=v.project([s.x,s.y,s.z]);assert.ok(q[0]>=110-1e-8&&q[0]<=590+1e-8);assert.ok(q[1]>=100-1e-8&&q[1]<=300+1e-8);}
 v.orbit(100,80);assert.notDeepEqual(v.project(p),initial);v.move(50,20);v.zoomAt(2);v.reset();assert.deepEqual(v.project(p),initial);
 v.orbit(1e6,1e6);v.zoomAt(1e6);assert.equal(v.zoom,8);v.zoomAt(1e-9);assert.equal(v.zoom,.2);assert.ok(v.project(p).every(Number.isFinite));
});
test('zoom preserves anchor point and camera changes cannot mutate distance samples',()=>{
 const samples=[{t:0,x:0,y:0,z:0,segment:0},{t:100,x:3,y:4,z:0,segment:0}],copy=JSON.stringify(samples),v=new OrbitView(samples),p=[1,2,0],anchor=v.project(p);
 v.zoomAt(2,anchor);v.project(p).forEach((n,i)=>near(n,anchor[i]));v.orbit(10,20);v.move(50,60);assert.equal(JSON.stringify(samples),copy);assert.equal(pathDistances(samples,100,samples[1]).travelled,5);
});
class Events{handlers={};addEventListener(n,f){(this.handlers[n]??=[]).push(f);}emit(n,e={}){e.preventDefault??=()=>{};for(const fn of this.handlers[n]||[])fn(e);}}
test('pointer orbit, pinch zoom, two-finger pan, pointer cancellation and disabled state',()=>{
 const windowBefore=globalThis.window,documentBefore=globalThis.document;
 try{
  globalThis.window=new Events();globalThis.document=new Events();const c=new Events();c.getBoundingClientRect=()=>({left:0,top:0,width:700,height:400});c.focus=()=>{};c.setPointerCapture=()=>{};c.releasePointerCapture=()=>{};
  const v=new OrbitView();let enabled=true,changes=0;bindOrbit(c,{getView:()=>v,enabled:()=>enabled,changed:()=>changes++});
  const e=(id,x,y)=>({pointerId:id,clientX:x,clientY:y,pointerType:'touch',button:0});
  const original=v.yaw;c.emit('pointerdown',e(1,100,100));c.emit('pointermove',e(1,150,100));assert.notEqual(v.yaw,original);
  c.emit('pointerdown',e(2,250,100));const yaw=v.yaw;c.emit('pointermove',e(2,350,100));near(v.zoom,2);near(v.yaw,yaw);
  const pan=v.pan.slice();c.emit('pointermove',e(1,170,120));c.emit('pointermove',e(2,370,120));assert.notDeepEqual(v.pan,pan);
  c.emit('pointercancel',e(2,370,120));const after=v.zoom;c.emit('pointermove',e(1,180,120));near(v.zoom,after);
  enabled=false;const last=v.yaw;c.emit('pointermove',e(1,300,300));near(v.yaw,last);assert.ok(changes>=4);
 }finally{globalThis.window=windowBefore;globalThis.document=documentBefore;}
});
test('mouse pan, wheel zoom, keyboard and reset controls',()=>{
 const w=globalThis.window,d=globalThis.document;
 try{
 globalThis.window=new Events();globalThis.document=new Events();const c=new Events();c.getBoundingClientRect=()=>({left:0,top:0,width:350,height:200});c.focus=()=>{};c.setPointerCapture=()=>{};c.releasePointerCapture=()=>{};
 const v=new OrbitView();bindOrbit(c,{getView:()=>v,enabled:()=>true,changed:()=>{}});
 c.emit('pointerdown',{pointerId:1,clientX:10,clientY:10,pointerType:'mouse',button:2});c.emit('pointermove',{pointerId:1,clientX:20,clientY:20});assert.deepEqual(v.pan,[20,20]);c.emit('pointerup',{pointerId:1});
 c.emit('wheel',{clientX:175,clientY:100,deltaY:-100,deltaMode:0});assert.ok(v.zoom>1);
 c.emit('keydown',{key:'ArrowLeft',shiftKey:true});assert.equal(v.pan[0],20*v.zoom-12);
 c.emit('keydown',{key:'r'});assert.equal(v.zoom,1);assert.deepEqual(v.pan,[0,0]);
 }finally{globalThis.window=w;globalThis.document=d;}
});
