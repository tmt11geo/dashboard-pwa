import test from 'node:test';
import assert from 'node:assert/strict';
import {viewFor,project,hitPlane,imageSize} from '../ripple-core.mjs';
test('touch rays round-trip image points across portrait/landscape, tilt and rotation',()=>{
 for(const [w,h] of [[3,2],[1,3],[3,.4]])for(const aspect of [.45,1,2.2])for(const tilt of [0,45,70])for(const yaw of [-180,-75,0,90,180]){
  const v=viewFor(w,h,aspect,tilt,yaw);
  for(const x of [-w/2,0,w/2])for(const y of [-h/2,0,h/2]){
   const p=project(v,[x,y,0]);assert.ok(Math.abs(p[0])<1&&Math.abs(p[1])<1,'plane fits viewport');
   const hit=hitPlane(v,...p);assert.ok(hit);assert.ok(Math.hypot(hit[0]-x,hit[1]-y)<1e-7);
  }
 }
});
test('outside touches do not hit image',()=>{const v=viewFor(3,2,1,45,0);assert.equal(hitPlane(v,1,1),null);});
test('image plane preserves original aspect ratio',()=>{for(const [w,h] of [[4000,3000],[900,1600],[4000,500]]){const s=imageSize(w,h);assert.equal(Math.max(...s),3);assert.ok(Math.abs(s[0]/s[1]-w/h)<1e-9);}});
