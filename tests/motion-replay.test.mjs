import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRecording,poseAt,slerp,rotate} from '../motion-replay-core.mjs';
const p=(t,x=0,q=[0,0,0,1],segment=0)=>({t,x,y:0,z:0,q,segment});
const data=samples=>({format:'tactical-motion-1',units:'metres',referenceSpace:'local',samples});
test('validates, normalizes time/quaternion and copies without altering source',()=>{
 const source=data([p(123),p(223,1,[0,0,0,1.1])]);const r=validateRecording(source);
 assert.equal(r.duration,100);assert.deepEqual(r.samples[1].q,[0,0,0,1]);assert.equal(source.samples[0].t,123);
 source.samples[0].x=99;assert.equal(r.samples[0].x,0);
});
test('rejects wrong schema, empty/excessive samples, bad times, coordinates, rotations and segments',()=>{
 for(const bad of [{}, {...data([p(0)]),units:'feet'},data([]),data(Array.from({length:3001},(_,i)=>p(i))),data([p(1),p(1)]),data([p(0,NaN)]),data([p(0,Infinity)]),data([p(0,1e7)]),data([p(0,[1])]),data([p(0,0,[0,0,0,0])]),data([p(0,0,[0,0,0,9])]),data([p(0,0,[0,0,0,1],-1)]),data([p(0,0,undefined,2),p(100,0,undefined,1)])])assert.throws(()=>validateRecording(bad));
});
test('interpolates pose and computes physical metres/second from milliseconds',()=>{
 const r=validateRecording(data([p(0),p(100,0.1,[0,1,0,0])]));const s=poseAt(r,50);
 assert.equal(s.pose.x,.05);assert.deepEqual(s.velocity,[1,0,0]);
 const v=rotate(s.pose.q,[0,0,-1]);assert.ok(Math.abs(v[0]+1)<1e-9);assert.ok(Math.abs(v[2])<1e-9);
 assert.deepEqual(poseAt(r,100).velocity,[1,0,0]);
});
test('opposite quaternion signs interpolate as the same rotation',()=>{
 assert.deepEqual(slerp([0,0,0,1],[0,0,0,-1],.5),[0,0,0,1]);
});
test('never interpolates velocity or pose across tracking segments or long gaps',()=>{
 for(const samples of [[p(0),p(100,1,undefined,1)],[p(0),p(501,1)]]){
  const r=validateRecording(data(samples));assert.equal(poseAt(r,50).gap,true);assert.equal(poseAt(r,50).velocity,null);assert.equal(poseAt(r,r.duration).velocity,null);
 }
});
test('stationary data has zero speed; one sample has unavailable velocity',()=>{
 assert.deepEqual(poseAt(validateRecording(data([p(0),p(100)])),50).velocity,[0,0,0]);
 const r=validateRecording(data([p(100)]));assert.equal(r.duration,0);assert.equal(poseAt(r,0).velocity,null);assert.equal(poseAt(r,0).pose.x,0);
});
