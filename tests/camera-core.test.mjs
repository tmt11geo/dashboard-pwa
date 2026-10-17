import test from 'node:test';
import assert from 'node:assert/strict';
import {guidance,exitSide,makeLock,updateLock,contentRect,decode} from '../camera-core.js';
const detection=(x,y,label='cup')=>({label,score:.9,box:{x1:x-.05,y1:y-.05,x2:x+.05,y2:y+.05}});
test('arrows guide device movement toward the object with a centre dead zone',()=>{
 assert.deepEqual(guidance(detection(.2,.8).box),{horizontal:'left',vertical:'down',centred:false});
 assert.equal(guidance(detection(.5,.5).box).centred,true);
 assert.deepEqual(guidance(detection(.8,.2).box),{horizontal:'right',vertical:'up',centred:false});
});
test('all exit sides/corners are identified; interior disappearance stays unknown',()=>{
 for(const [x,y,name] of [[.04,.5,'left'],[.96,.5,'right'],[.5,.04,'top'],[.5,.96,'bottom'],[.04,.04,'top-left'],[.96,.04,'top-right'],[.04,.96,'bottom-left'],[.96,.96,'bottom-right']])assert.equal(exitSide(detection(x,y).box),name);
 assert.equal(exitSide(detection(.5,.5).box),null);
 // A large object touching both edges should not be claimed to have exited.
 assert.equal(exitSide({x1:0,y1:0,x2:1,y2:1}),null);
});
test('spatial lock follows the nearby same-class detection, rejects far objects and other classes',()=>{
 const original=makeLock(detection(.4,.5),0);
 const next=updateLock(original,[detection(.8,.5),detection(.43,.5),detection(.4,.5,'person')],200);
 assert.equal(next.box.x1,.43-.05);assert.equal(next.missing,false);
 const missing=updateLock(next,[detection(.9,.9)],600);assert.equal(missing.missing,true);assert.equal(missing.exit,null);
});
test('exit requires missing near edge and lost lock never jumps to a new detection',()=>{
 const original=makeLock(detection(.96,.04),0);
 const missing=updateLock(original,[],800);assert.equal(missing.exit,'top-right');assert.equal(missing.lost,false);
 const lost=updateLock(missing,[],1600);assert.equal(lost.lost,true);
 assert.equal(updateLock(lost,[detection(.96,.04)],1800),lost);
});
test('temporary interior miss recovers the lock',()=>{
 let lock=makeLock(detection(.5,.5),0);
 lock=updateLock(lock,[],300);assert.equal(lock.missing,true);
 lock=updateLock(lock,[detection(.51,.5)],500);assert.equal(lock.missing,false);
});
test('contain transform preserves alignment in portrait and landscape',()=>{
 assert.deepEqual(contentRect(400,600,1280,720),{x:0,y:187.5,w:400,h:225});
 assert.deepEqual(contentRect(600,400,720,1280),{x:187.5,y:0,w:225,h:400});
});
test('YOLO output unpads and normalises coordinates, filters confidence and invalid boxes',()=>{
 const data=new Float32Array([64,36,320,180,.9,41,10,10,20,20,.1,0,640,640,640,640,.99,0,NaN,1,3,4,.99,0]);
 const result=decode(data,640,360,.45);assert.equal(result.length,1);
 assert.deepEqual(result[0].box,{x1:.1,y1:.1,x2:.5,y2:.5});assert.equal(result[0].classId,41);
});
