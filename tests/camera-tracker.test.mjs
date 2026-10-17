import test from 'node:test';
import assert from 'node:assert/strict';
import {VisualTracker,grayFrame} from '../camera-tracker.js';
function scene(cx,cy,scale=1,visible=true){
 const width=320,height=180,data=new Uint8Array(width*height).fill(20);
 if(visible)for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=(x-cx)/scale,v=(y-cy)/scale;
  if(Math.abs(u)<28&&Math.abs(v)<22)data[y*width+x]=Math.max(0,Math.min(255,120+45*Math.sin(u*.35)+40*Math.cos(v*.46)+25*Math.sin((u+v)*.22)));
 }
 return {data,width,height};
}
const box={x1:72/320,y1:58/180,x2:128/320,y2:102/180};
test('visual tracker follows translation without any detector',()=>{
 const tracker=new VisualTracker(scene(100,80),box);assert.equal(tracker.valid,true);
 for(let i=1;i<=12;i++){
  const result=tracker.update(scene(100+i*4,80+i*2));assert.ok(result,'track remains valid');
  const x=(result.box.x1+result.box.x2)*160,y=(result.box.y1+result.box.y2)*90;
  assert.ok(Math.abs(x-(100+i*4))<3);assert.ok(Math.abs(y-(80+i*2))<3);
 }
});
test('initial search handles movement while YOLO was processing',()=>{
 const tracker=new VisualTracker(scene(100,80),box),result=tracker.update(scene(140,95));
 assert.ok(result);assert.ok(Math.abs((result.box.x1+result.box.x2)*160-140)<3);
});
test('small gradual scale change is tracked',()=>{
 const tracker=new VisualTracker(scene(100,80),box);
 for(let i=1;i<=5;i++)assert.ok(tracker.update(scene(100+i*2,80,1+i*.025)));
});
test('occluded target and low texture do not produce a confident match',()=>{
 const tracker=new VisualTracker(scene(100,80),box);
 assert.equal(tracker.update(scene(100,80,1,false)),null);
 assert.equal(new VisualTracker(scene(100,80,1,false),box).valid,false);
 assert.equal(tracker.update({data:new Uint8Array(100),width:10,height:10}),null);
});
test('grayscale capture bounds tracking resolution and retains image contrast',()=>{
 const rgba=new Uint8ClampedArray(640*360*4);for(let i=0;i<rgba.length;i+=4){rgba[i]=255;rgba[i+3]=255;}
 const frame=grayFrame(rgba,640,360);assert.equal(frame.width,320);assert.equal(frame.height,180);assert.equal(frame.data[0],76);
});
