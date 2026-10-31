import test from 'node:test';
import assert from 'node:assert/strict';
import {fitTrajectory,trajectoryLines,xyz} from '../motion-replay-view.mjs';
const p=(t,x,y=0,z=0,segment=0)=>({t,x,y,z,segment,q:[0,0,0,1]});
test('fits complete three-dimensional recording with room for cube and arrows',()=>{
 const points=[p(0,-30,-10,20),p(100,50,50,-60),p(200,0,0,0)];const view=fitTrajectory(points);
 for(const sample of points){const [x,y]=view.project(xyz(sample));assert.ok(x>=110-1e-9&&x<=590+1e-9);assert.ok(y>=100-1e-9&&y<=300+1e-9);}
 assert.notDeepEqual(view.project([0,0,0]),view.project([0,1,0]));
 assert.deepEqual(view.project([0,0,0]),view.project([0,0,0]));
});
test('stationary and one-point captures have finite projection',()=>{
 for(const samples of [[],[p(0,123,456,-789)],[p(0,1),p(100,1)]]){
 const v=fitTrajectory(samples);assert.ok(Number.isFinite(v.scale));assert.ok(v.project(samples.length?xyz(samples[0]):[0,0,0]).every(Number.isFinite));
 }
});
test('played and remaining path meet exactly at the interpolated cube position',()=>{
 const samples=[p(0,0),p(100,1),p(200,2)],pose=p(50,.5),lines=trajectoryLines(samples,50,pose);
 assert.equal(lines.length,3);assert.equal(lines[0].played,true);assert.equal(lines[0].b,pose);assert.equal(lines[1].a,pose);assert.equal(lines[1].played,false);
 assert.equal(trajectoryLines(samples,200,samples[2]).every(l=>l.played),true);
});
test('path never connects separate segments or long missing intervals',()=>{
 const samples=[p(0,0),p(100,1),p(200,2,0,0,1),p(800,3,0,0,1)];
 const lines=trajectoryLines(samples,500,null);assert.equal(lines.length,1);assert.equal(lines[0].b,samples[1]);
});

import {pathDistances} from '../motion-replay-view.mjs';
test('travelled distance follows bends and includes interpolated partial interval',()=>{
 const samples=[p(0,0),p(100,3),p(200,3,4)],pose=p(150,3,2);
 const d=pathDistances(samples,150,pose);assert.equal(d.travelled,5);assert.equal(d.total,7);assert.ok(Math.abs(d.displacement-Math.sqrt(13))<1e-12);
 assert.equal(pathDistances(samples,200,samples[2]).travelled,7);
 assert.equal(pathDistances(samples,0,samples[0]).travelled,0);
});
test('distance excludes tracking jumps and is unavailable for displacement during gap',()=>{
 const samples=[p(0,0),p(100,1),p(200,100,0,0,1),p(300,102,0,0,1)];
 const d=pathDistances(samples,150,null);assert.deepEqual(d,{travelled:1,total:3,displacement:null});
 assert.deepEqual(pathDistances([p(0,3)],0,p(0,3)),{travelled:0,total:0,displacement:0});
});
