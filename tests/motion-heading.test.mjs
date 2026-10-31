import test from 'node:test';
import assert from 'node:assert/strict';
import {heading,headingGaps,alignHeadings} from '../motion-heading.mjs';
import {indexPath,indexedDistances,connected} from '../motion-path.mjs';
import {poseAt} from '../motion-replay-core.mjs';
const q=a=>[0,Math.sin(a/2),0,Math.cos(a/2)];
const p=(t,x,z,angle=0,segment=0)=>({t,x,y:.5,z,q:q(angle),segment});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const samples=()=>[p(0,0,0),p(100,0,-.1),{...p(500,.2,-.2,Math.PI/2,1),breakReason:'tracking-gap'},p(600,.1,-.2,Math.PI/2,1)];
test('aligns first post-gap heading to last pre-gap heading and rotates velocity',()=>{
 const raw=samples(),before=JSON.stringify(raw),out=alignHeadings(raw,new Set([2]));
 close(heading(out[2].q),heading(out[1].q));
 assert.deepEqual(out[2].x,raw[2].x);assert.deepEqual(out[2].z,raw[2].z);
 close(out[3].x,.2);close(out[3].z,-.3);close(out[3].y,.5);
 assert.equal(JSON.stringify(raw),before);assert.deepEqual(out[0],raw[0]);assert.deepEqual(out[1],raw[1]);
 const velocity=poseAt({samples:out,duration:600},600).velocity;close(velocity[0],0);close(velocity[2],-1);
 assert.equal(connected(out[1],out[2]),false);assert.equal(poseAt({samples:out,duration:600},300).pose,null);
 close(indexPath(out).total,indexPath(raw).total);
});
test('wraps the heading across ±180 degrees using the short rotation',()=>{
 const raw=[p(0,0,0,179*Math.PI/180),p(100,1,0,-179*Math.PI/180,1)];
 close(headingGaps(raw)[0].angle,-2*Math.PI/180);
 close(heading(alignHeadings(raw,new Set([1]))[1].q),179*Math.PI/180);
});
test('vertical views are unavailable; small horizontal heading remains valid',()=>{
 const raw=[p(0,0,0),{...p(100,1,1,0,1),q:[Math.SQRT1_2,0,0,Math.SQRT1_2]}];
 assert.equal(heading(raw[1].q),null);assert.equal(headingGaps(raw)[0].angle,null);
 assert.deepEqual(alignHeadings(raw,new Set([1])),raw);
});
test('multiple corrections compose without moving gap pivots or accumulating errors',()=>{
 const raw=[...samples(),{...p(1000,.1,-.4,Math.PI,2),breakReason:'tracking-gap'},p(1100,.1,-.3,Math.PI,2)];
 const first=alignHeadings(raw,new Set([2])),both=alignHeadings(raw,new Set([2,4]));
 close(both[4].x,first[4].x);close(both[4].z,first[4].z);
 close(heading(both[4].q),heading(both[3].q));close(heading(both[2].q),heading(both[1].q));
 close(indexPath(both).total,indexPath(raw).total);
 assert.deepEqual(alignHeadings(raw,new Set([2])),first);
 assert.deepEqual(alignHeadings(raw,new Set()),raw);
});
test('suspected position jumps are not offered as heading gaps; endpoint is not forced to origin',()=>{
 const raw=samples();raw[2].breakReason='position-jump';assert.equal(headingGaps(raw).length,0);assert.deepEqual(alignHeadings(raw,new Set([2])),raw);
 const out=alignHeadings(samples(),new Set([2]));assert.ok(indexedDistances(indexPath(out),600,out.at(-1)).displacement>.1);
});
