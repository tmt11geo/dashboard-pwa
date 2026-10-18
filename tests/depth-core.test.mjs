import test from 'node:test';
import assert from 'node:assert/strict';
import {frameSize,prepareInput,normalizeDepth,colorizeDepth,makeRelief,rotatePoint} from '../depth-core.js';
test('camera dimensions preserve the whole portrait/landscape image within the selected model budget',()=>{
 for(const [w,h] of [[640,480],[480,640],[1920,1080],[1080,1920]])for(const limit of [224,336,518]){
  const s=frameSize(w,h,limit);assert.equal(s.width%14,0);assert.equal(s.height%14,0);assert.ok(Math.max(s.width,s.height)<=limit);
  assert.ok(Math.abs(s.width-s.height*w/h)<=14,'aspect discrepancy bounded by one model patch');
 }
 assert.throws(()=>frameSize(0,640,224));assert.throws(()=>frameSize(640,480,500));
});
test('ImageNet normalization packs RGB planes without using alpha',()=>{
 const t=prepareInput(new Uint8Array([255,0,128,0,0,255,64,255]),2,1);
 const expected=[(1-.485)/.229,-.485/.229,-.456/.224,(1-.456)/.224,(128/255-.406)/.225,(64/255-.406)/.225];
 t.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<1e-6));
});
test('relative inverse depth handles invalid/constant outputs without a false distance display',()=>{
 assert.deepEqual([...normalizeDepth([2,4,6,NaN])],[0,.5,1,0]);
 assert.throws(()=>normalizeDepth([1,1]));assert.throws(()=>normalizeDepth([NaN,Infinity]));
 const rgba=colorizeDepth(new Float32Array([0,1]));assert.equal(rgba[3],255);assert.equal(rgba[7],255);assert.ok(rgba[4]>rgba[0]);
});
test('single-frame relief keeps colour, near/far order, bounded point count and rotation length',()=>{
 const points=makeRelief(new Float32Array([0,1]),2,1,new Uint8Array([2,3,4,255,5,6,7,255]));
 assert.equal(points[0].color,'rgb(2,3,4)');assert.ok(points[1].z>points[0].z);
 const p={x:1,y:2,z:3},r=rotatePoint(p,.8,-.4);assert.ok(Math.abs(Math.hypot(r.x,r.y,r.z)-Math.hypot(p.x,p.y,p.z))<1e-9);
 assert.ok(makeRelief(new Float32Array(518*392),518,392,new Uint8Array(518*392*4)).length<=9000);
});
