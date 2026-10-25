import test from 'node:test';import assert from 'node:assert/strict';
import {stitchFrames,buildRelief,saveSession,loadSession} from '../scan-session-core.js';
import {render} from './fixtures/scan-render.mjs';import {scaledIntrinsics} from '../depth-calibration-core.js';
const K=[429.3,0,320.2,0,422.9,245.7,0,0,1],k=scaledIntrinsics(K,224,168);
const frame=x=>({...render(x,0,[1,0],{width:224,height:168,K:k,texture:'noise'}),K:k,orientation:90,tracking:render(x,0,[1,0],{width:640,height:480,K,texture:'noise'}).pixels});
test('separate stitching places translations; relief is only built on request',()=>{const input=[frame(0),frame(.1),frame(.2)],r=stitchFrames(input);assert.equal(r.placed.length,3);assert.equal(r.points,undefined);assert.equal(input[0].pose,undefined);const scene=buildRelief(r);assert.equal(scene.views,3);assert.ok(scene.points.length>1000);});
test('duplicate gathered images remain present but do not force false translation',()=>{const input=[frame(0),frame(0),frame(.1)],r=stitchFrames(input);assert.equal(r.results.length,3);if(r.results[1].ok)assert.ok(Math.hypot(...r.frames[1].pose.t)<.005,'return to original view recovers original position');assert.equal(r.results[2].ok,true);assert.equal(input.length,3);});
test('saved session roundtrips all corrected image/depth bytes and rejects corrupt imports',()=>{const f=frame(0),s=saveSession([f],{inputSha256:'test'}),r=loadSession(JSON.parse(JSON.stringify(s)));assert.deepEqual(r.frames[0].raw,f.raw);assert.deepEqual(r.frames[0].tracking,f.tracking);s.frames[0].raw='bad';assert.throws(()=>loadSession(s));assert.throws(()=>loadSession({}));});
test('stitch fails closed for changed calibration and empty input',()=>{assert.throws(()=>stitchFrames([]));const a=frame(0),b=frame(.1);b.K=b.K.slice();b.K[0]+=10;assert.throws(()=>stitchFrames([a,b]),/Mixed/);});
test('wide saved-view search does not fuse rotation-only sweeps',()=>{
 for(const yaw of [-.08,-.04,.04,.08]){const b={...render(0,yaw,[1,0],{width:224,height:168,K:k,texture:'noise'}),K:k,orientation:90,tracking:render(0,yaw,[1,0],{width:640,height:480,K,texture:'noise'}).pixels};assert.equal(stitchFrames([frame(0),b]).placed.length,1);}
});
test('wide matching keeps unrelated views unplaced and explains failed matches',()=>{const b=frame(.1);b.tracking=new Uint8ClampedArray(b.tracking.length);const r=stitchFrames([frame(0),b]);assert.equal(r.placed.length,1);assert.equal(r.results[1].neighbour.diagnostics.matches,0);});
test('independently textured scenes are not fused by the wider search',()=>{
 const options={width:224,height:168,K:k,texture:'noise',seed:98213};const b={...render(0,0,[1,0],options),K:k,orientation:90,tracking:render(0,0,[1,0],{...options,width:640,height:480,K}).pixels};assert.equal(stitchFrames([frame(0),b]).placed.length,1);
});
test('wide saved-view matcher preserves translation across affine inverse depth changes',()=>{for(const [scale,shift] of [[1.4,.3],[.8,-.1]]){const b=frame(.1);b.raw=b.raw.map(x=>x*scale+shift);const r=stitchFrames([frame(0),b]);assert.equal(r.placed.length,2);assert.ok(Math.hypot(r.frames[1].pose.t[0]-.025,r.frames[1].pose.t[1],r.frames[1].pose.t[2])<.005);}});
