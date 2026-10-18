import test from 'node:test';
import assert from 'node:assert/strict';
import {letterbox,prepareNHWC,cropOutput} from '../depth-tfjs-core.js';
for(const [w,h,expected] of [[640,480,{x:0,y:28,width:224,height:168}],[480,640,{x:28,y:0,width:168,height:224}],[100,100,{x:0,y:0,width:224,height:224}],[1920,1080,{x:0,y:49,width:224,height:126}]]){
 test(`letterbox and colour/depth alignment ${w}x${h}`,()=>{
  const rect=letterbox(w,h);assert.deepEqual(rect,expected);
  const rgba=new Uint8ClampedArray(224*224*4),depth=new Float32Array(224*224);
  for(let y=0;y<224;y++)for(let x=0;x<224;x++){const i=y*224+x;rgba.set([x,y,(x+y)%256,255],i*4);depth[i]=y*224+x;}
  const out=cropOutput(depth,rgba,rect);
  assert.equal(out.width/ out.height,rect.width/rect.height);
  for(let y=0;y<rect.height;y++)for(let x=0;x<rect.width;x++){
   const i=y*rect.width+x;assert.equal(out.depth[i],(y+rect.y)*224+x+rect.x);
   assert.deepEqual([...out.pixels.slice(i*4,i*4+2)],[x+rect.x,y+rect.y]);
  }
  const nhwc=prepareNHWC(rgba,rect),mean=[.485,.456,.406],std=[.229,.224,.225];
  for(let y=0;y<224;y++)for(let x=0;x<224;x++)for(let c=0;c<3;c++){
   const i=y*224+x,inView=x>=rect.x&&x<rect.x+rect.width&&y>=rect.y&&y<rect.y+rect.height;
   assert.ok(Math.abs(nhwc[i*3+c]-(inView?(rgba[i*4+c]/255-mean[c])/std[c]:0))<1e-6);
  }
 });
}
test('invalid dimensions, rectangle, buffers and nonfinite depth reject',()=>{
 for(const size of [[0,1],[1,-1],[NaN,5],[Infinity,10]])assert.throws(()=>letterbox(...size));
 const rect=letterbox(640,480),rgba=new Uint8ClampedArray(224*224*4),depth=new Float32Array(224*224);
 assert.throws(()=>prepareNHWC(rgba,{...rect,x:-1}));assert.throws(()=>prepareNHWC(rgba.slice(1),rect));
 assert.throws(()=>cropOutput(depth.slice(1),rgba,rect));depth[28*224]=NaN;assert.throws(()=>cropOutput(depth,rgba,rect));
});
