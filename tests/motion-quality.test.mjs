import test from 'node:test';
import assert from 'node:assert/strict';
import {MotionTrail} from '../motion-core.mjs';
import {jumpInfo,assessRecording,connected,indexPath,indexedDistances,displayEdges} from '../motion-path.mjs';
import {validateRecording,poseAt} from '../motion-replay-core.mjs';
const p=(t,x,segment=0)=>({t,x,y:0,z:0,q:[0,0,0,1],segment});
const pose=x=>({transform:{position:{x,y:0,z:0},orientation:{x:0,y:0,z:0,w:1}}});
const file=samples=>({format:'tactical-motion-1',units:'metres',referenceSpace:'local',samples});
test('walking heuristic rejects small jitter, ordinary motion and long-gap inference',()=>{
 assert.equal(jumpInfo(p(0,0),p(30,.03)),null);
 assert.equal(jumpInfo(p(0,0),p(1,.29)),null);
 assert.equal(jumpInfo(p(0,0),p(100,.9)),null);
 assert.equal(jumpInfo(p(0,0),p(501,10)),null);
 assert.equal(jumpInfo(p(0,0),p(0,10)),null);
 assert.equal(jumpInfo(p(0,0),p(30,1.5)).speed,50);
});
test('capture detects jump on unsampled frame, preserves coordinates and exports boundary',()=>{
 const t=new MotionTrail(36000,10);t.add(0,pose(4));t.add(20,pose(4.02));t.add(40,pose(5.52));
 assert.equal(t.quality.jumps,1);assert.equal(t.quality.gaps,0);
 assert.equal(t.samples.at(-1).t,40);assert.equal(t.samples.at(-1).x,5.52-4);
 assert.equal(t.samples.at(-1).breakReason,'position-jump');assert.equal(connected(...t.samples),false);
 t.add(140,pose(5.62));assert.equal(t.quality.jumps,1);assert.ok(connected(...t.samples.slice(-2)));
 const normalized=validateRecording(file(t.samples));const q=assessRecording(normalized.samples);
 assert.equal(q.jumps,1);assert.equal(q.gaps,0);assert.equal(q.samples.at(-1).x,t.samples.at(-1).x);
});
test('tracking interruption counts once, persists on recovery and clears with origin reset',()=>{
 const t=new MotionTrail();t.add(0,pose(0));t.add(40,null);t.add(50,null);assert.equal(t.quality.gaps,1);
 t.add(100,pose(1));assert.equal(t.samples.at(-1).breakReason,'tracking-gap');assert.equal(t.quality.jumps,0);
 t.add(800,pose(2));assert.equal(t.quality.gaps,2);assert.equal(t.samples.at(-1).segment,2);
 t.reset();assert.deepEqual(t.quality,{jumps:0,gaps:0});assert.equal(t.pendingBreak,null);
});
test('legacy replay breaks jumps without changing geometry or endpoint; no speed or distance across jump',()=>{
 const raw=[p(0,0),p(100,.1),p(130,1.6),p(230,1.7),p(1000,2)];const before=JSON.stringify(raw);
 const q=assessRecording(raw);assert.equal(q.jumps,1);assert.equal(q.gaps,1);assert.equal(JSON.stringify(raw),before);
 for(let i=0;i<raw.length;i++)for(const k of ['t','x','y','z','q'])assert.deepEqual(q.samples[i][k],raw[i][k]);
 const r=validateRecording(file(q.samples));assert.equal(poseAt(r,115).pose,null);assert.equal(poseAt(r,100).velocity,null);
 const index=indexPath(r.samples);assert.ok(Math.abs(index.total-.2)<1e-10);
 assert.equal(indexedDistances(index,1000,poseAt(r,1000).pose).displacement,2);
 for(const e of displayEdges(r.samples))assert.equal(e.a.segment,e.b.segment);
 const again=assessRecording(q.samples);assert.equal(again.jumps,1);assert.equal(again.gaps,1);
});
