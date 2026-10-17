import test from 'node:test';
import assert from 'node:assert/strict';
import {VisualTracker} from '../camera-tracker.js';
import {consensusMotion} from '../camera-flow.js';
import {trackingMiss} from '../camera-loss.js';
import {cropGray} from '../camera-zoom.js';
function frame(cx,cy,angle=0,scale=1,occlude=false){
 const width=320,height=240,data=new Uint8Array(width*height).fill(25),c=Math.cos(angle),s=Math.sin(angle);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=((x-cx)*c+(y-cy)*s)/scale,v=(-(x-cx)*s+(y-cy)*c)/scale;
  if(Math.abs(u)<50&&Math.abs(v)<40)data[y*width+x]=125+30*Math.sin(u*.23)+30*Math.cos(v*.29)+25*Math.sin(u*.11+v*.17)+20*Math.cos(u*.37-v*.13);
 }
 if(occlude)for(let y=60;y<180;y++)for(let x=cx;x<cx+70;x++)data[y*width+x]=25;
 return {data,width,height};
}
const box={x1:90/320,y1:80/240,x2:190/320,y2:160/240};
const position=r=>({x:(r.box.x1+r.box.x2)*160,y:(r.box.y1+r.box.y2)*120});
test('optical flow follows fast direction changes using multiple points',()=>{
 const t=new VisualTracker(frame(140,120),box);
 for(const [x,y] of [[164,132],[140,118],[168,130],[142,117]]){
  const r=t.update(frame(x,y));assert.ok(r);assert.equal(r.mode,'flow');assert.ok(r.features>=6);
  const p=position(r);assert.ok(Math.abs(p.x-x)<2);assert.ok(Math.abs(p.y-y)<2);
 }
});
test('feature geometry tracks gradual rotation and growth beyond the old scale window',()=>{
 const t=new VisualTracker(frame(140,120),box);
 for(let i=1;i<=8;i++){
  const x=140+i*6,y=120+i*2,r=t.update(frame(x,y,i*.06,1+i*.06));assert.ok(r);assert.equal(r.mode,'flow');
  const p=position(r);assert.ok(Math.abs(p.x-x)<2);assert.ok(Math.abs(p.y-y)<2);
 }
});
test('partial occlusion leaves sufficient verified features to retain the target',()=>{
 const t=new VisualTracker(frame(140,120),box),saved=t.recent,r=t.update(frame(145,122,0,1,true));assert.ok(r);assert.ok(r.quality<.7);assert.equal(t.recent,saved,'partial occlusion does not replace the clear bitmap reference');assert.equal(r.mode,'flow');assert.ok(r.features>=6);
 const p=position(r);assert.ok(Math.abs(p.x-145)<2);assert.ok(Math.abs(p.y-122)<2);
});
test('full occlusion reports uncertainty and retains the last good reference for recovery',()=>{
 const t=new VisualTracker(frame(140,120),box);
 assert.equal(t.update({data:new Uint8Array(320*240).fill(25),width:320,height:240}),null);
 const r=t.update(frame(145,122));assert.ok(r);const p=position(r);assert.ok(Math.abs(p.x-145)<2);assert.ok(Math.abs(p.y-122)<2);
});
test('motion consensus rejects inconsistent points and estimates similarity',()=>{
 const a=1.1*Math.cos(.12),b=1.1*Math.sin(.12),matches=[];
 for(let i=0;i<12;i++){const p={x:20+(i%4)*12,y:20+Math.floor(i/4)*15};matches.push({p,q:{x:a*p.x-b*p.y+7,y:b*p.x+a*p.y-3}});}
 for(let i=0;i<5;i++)matches.push({p:{x:50+i*8,y:10+i*13},q:{x:200-i*19,y:150+i*7}});
 const fit=consensusMotion(matches);assert.ok(fit);assert.equal(fit.good.length,12);assert.ok(Math.abs(fit.model.a-a)<1e-6);assert.ok(Math.abs(fit.model.b-b)<1e-6);
});
test('edge loss tolerates short gaps and requires five failed frames over 750 ms',()=>{
 let lock={box:{x1:.86,y1:.3,x2:.99,y2:.6},seen:0,missedFrames:0};
 for(const now of [100,200,300,400,600]){lock=trackingMiss(lock,now);assert.equal(lock.exit,null);assert.equal(lock.lost,false);}
 lock=trackingMiss(lock,800);assert.equal(lock.exit,'right');
 const oneSlowMiss=trackingMiss({...lock,missedFrames:0,seen:0},800);assert.equal(oneSlowMiss.exit,null);
 const recovered={...lock,seen:850,missedFrames:0,missing:false,exit:null};assert.equal(trackingMiss(recovered,900).exit,null);
 const interior=trackingMiss({box:{x1:.3,y1:.3,x2:.6,y2:.6},seen:0},1500);assert.equal(interior.lost,false);assert.equal(trackingMiss(interior,1600).lost,true);
});
test('snapshot crop uses destination pixel centres like nearest-neighbour canvas resizing',()=>{
 const f={width:8,height:4,data:Uint8Array.from({length:32},(_,i)=>i)},crop=cropGray(f,{x1:0,y1:0,x2:1,y2:1},4);
 assert.deepEqual([...crop.data],[9,11,13,15,25,27,29,31]);
});
test('bitmap reacquisition can use the last verified appearance after rotation',async()=>{
 const {BitmapMatcher}=await import('../camera-bitmap.js');
 const tracker=new VisualTracker(frame(140,120),box);let result,last;
 for(let i=1;i<=8;i++){last=frame(140+i*6,120+i*2,i*.06,1+i*.06);result=tracker.update(last);assert.equal(result.mode,'flow');}
 const matcher=new BitmapMatcher({anchor:tracker.anchor,recent:tracker.recent,box:result.box,side:'right'});
 assert.ok(matcher.search(last,5),'rotated target can match the saved recent appearance');
});
