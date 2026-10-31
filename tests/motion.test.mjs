import test from 'node:test';
import assert from 'node:assert/strict';
import { MotionTrail } from '../motion-core.mjs';
const pose=(x,y=0,z=0,extra={})=>({transform:{position:{x,y,z},orientation:{x:0,y:0,z:0,w:1}},...extra});
test('metre translation relative to first pose; rotation does not imply translation',()=>{
  const t=new MotionTrail();t.add(0,pose(10,2,4));
  assert.deepEqual(t.add(100,pose(11,3,2)),{t:100,x:1,y:1,z:-2,q:[0,0,0,1],segment:0});
  const p=pose(11,3,2);p.transform.orientation={x:0,y:1,z:0,w:0};
  assert.equal(t.add(200,p).x,1);assert.deepEqual(t.latest.q,[0,1,0,0]);
});
test('missing, emulated and nonfinite poses are rejected and break the line',()=>{
  const t=new MotionTrail();t.add(0,pose(0));
  assert.equal(t.add(100,null),null);assert.equal(t.latest,null);
  assert.equal(t.add(200,pose(2,0,0,{emulatedPosition:true})),null);
  assert.equal(t.add(300,pose(NaN)),null);
  t.add(400,pose(4));assert.equal(t.samples.length,2);assert.equal(t.latest.segment,1);
});
test('sampling is bounded at 10Hz and retains latest window',()=>{
  const t=new MotionTrail(3);for(let i=0;i<=40;i++)t.add(i*10,pose(i));
  assert.equal(t.samples.length,3);assert.deepEqual(t.samples.map(p=>p.t),[200,300,400]);
});
test('reference reset clears prior coordinate frame and re-establishes zero',()=>{
  const t=new MotionTrail();t.add(0,pose(5));t.add(100,pose(7));t.reset();
  assert.equal(t.samples.length,0);assert.equal(t.origin,null);
  assert.equal(t.add(200,pose(99)).x,0);
});
