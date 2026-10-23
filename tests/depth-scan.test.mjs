import test from 'node:test';
import assert from 'node:assert/strict';
import {fitSimilarity,transform,compose,ScanMap,validateScene,CaptureGate,features,register} from '../depth-scan-core.js';
const close=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('3D similarity recovers known rotation, translation and scale including half turn',()=>{
 const a=[[1,2,3],[-2,1,5],[4,-2,1],[0,0,0],[-1,-2,3]];
 for(const angle of [.1,Math.PI]){const c=Math.cos(angle),s=Math.sin(angle),truth={r:[c,0,s,0,1,0,-s,0,c],t:[.2,-.1,1],s:1.3},b=a.map(p=>transform(truth,p)),got=fitSimilarity(a,b);
  a.forEach((p,i)=>transform(got,p).forEach((v,k)=>close(v,b[i][k])));
  a.forEach(p=>transform(compose(truth,got),p).forEach((v,k)=>close(v,transform(truth,transform(got,p))[k])));
 }
});
import {render} from './fixtures/scan-render.mjs';
test('registered multi-view relief grows and rejected observations do not mutate it',()=>{
 const map=new ScanMap();assert.equal(map.add(render()).ok,true);const before=map.snapshot();
 const result=map.add(render(.045,0,[1.4,.3]));
 assert.equal(result.ok,true,JSON.stringify(result));assert.equal(map.views,2);assert.ok(map.voxels.size>before.points.length);
 assert.ok(before.points.every(p=>map.snapshot().points.some(q=>p.every((v,i)=>v===q[i]))),'prior points retained exactly');
 const saved=JSON.stringify(map.snapshot());
 assert.equal(map.add(render(.045,0,[1.4,.3])).ok,false,'duplicate not fused');assert.equal(JSON.stringify(map.snapshot()),saved);
 const flat=render();flat.pixels.fill(100);assert.equal(map.add(flat).ok,false);assert.equal(JSON.stringify(map.snapshot()),saved);
 const turned=render(.08);turned.orientation=90;assert.equal(map.add(turned).ok,false);assert.equal(JSON.stringify(map.snapshot()),saved);
 assert.deepEqual(validateScene(JSON.parse(saved)),JSON.parse(saved));map.clear();assert.equal(map.views,0);assert.equal(map.voxels.size,0);
});
test('pure rotation and excessive movement are rejected without corrupting accepted map',()=>{
 for(const frame of [render(0,.035),render(1)]){const map=new ScanMap();map.add(render());const saved=JSON.stringify(map.snapshot());const r=map.add(frame);assert.equal(r.ok,false,JSON.stringify(r));assert.equal(JSON.stringify(map.snapshot()),saved);}
});
test('scene import rejects wrong versions, unbounded coordinates and colours',()=>{
 const valid={format:'tactical-relief',version:1,units:'arbitrary',views:1,points:[[0,1,2,0,128,255]]};assert.deepEqual(validateScene(valid),valid);
 for(const bad of [{...valid,version:2},{...valid,points:[[Infinity,0,0,0,0,0]]},{...valid,points:[[0,0,0,999,0,0]]},{...valid,points:Array(32001).fill(valid.points[0])}])assert.throws(()=>validateScene(bad));
});
test('guidance requires stillness, novelty and post-result rest',()=>{
 const gate=new CaptureGate(),dark=new Float32Array(12).fill(.2),light=new Float32Array(12).fill(.4);
 assert.equal(gate.sample(dark,0).capture,false);assert.equal(gate.sample(dark,200).capture,false);assert.equal(gate.sample(dark,1000).capture,true);
 gate.complete(1000,dark,true);assert.equal(gate.sample(light,1200).capture,false);gate.sample(light,1400);assert.equal(gate.sample(light,2300).capture,false);assert.equal(gate.sample(light,2800).capture,true);
 gate.complete(2800,light,true);gate.sample(light,3000);gate.sample(light,3200);assert.equal(gate.sample(light,6000).state,'move');assert.equal(gate.sample(light,6000).capture,false);
});
test('an invalid-depth feature is excluded without rejecting all good correspondences',()=>{
 const map=new ScanMap(),first=render();const feature=features(first)[0];first.raw[feature.y*first.width+feature.x]=0;
 assert.equal(map.add(first).ok,true);const second=render(.045,0,[1.4,.3]);assert.equal(map.add(second).ok,true);
});
test('view and point budgets stop additions without modifying the accepted map',()=>{
 const map=new ScanMap();map.add(render());map.views=40;const before=JSON.stringify(map.snapshot());assert.equal(map.add(render(.045)).full,true);assert.equal(JSON.stringify(map.snapshot()),before);
});
test('a rejected unchanged view is not repeatedly sent to the GPU',()=>{
 const gate=new CaptureGate(),a=new Float32Array(8).fill(.2),b=new Float32Array(8).fill(.4);
 gate.complete(0,a,false);gate.sample(a,200);gate.sample(a,400);assert.equal(gate.sample(a,6000).capture,false);assert.equal(gate.sample(a,6000).state,'retry');
 gate.sample(b,6200);gate.sample(b,6400);assert.equal(gate.sample(b,7400).capture,true);
});
