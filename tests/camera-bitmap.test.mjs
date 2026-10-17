import test from 'node:test';
import assert from 'node:assert/strict';
import {BitmapMatcher} from '../camera-bitmap.js';
import {VisualTracker} from '../camera-tracker.js';
function scene(objects=[],width=320,height=180){
 const data=new Uint8Array(width*height).fill(20);
 for(const {x,y,scale=1,inverted=false} of objects)for(let py=0;py<height;py++)for(let px=0;px<width;px++){
  const u=(px-x)/scale,v=(py-y)/scale;
  if(Math.abs(u)<24&&Math.abs(v)<20){const value=120+45*Math.sin(u*.35)+40*Math.cos(v*.46)+25*Math.sin((u+v)*.22);data[py*width+px]=inverted?255-value:value;}
 }
 return {data,width,height};
}
const box={x1:246/320,y1:70/180,x2:294/320,y2:110/180};
function matcher(){const tracker=new VisualTracker(scene([{x:270,y:90}]),box);return new BitmapMatcher({anchor:tracker.anchor,recent:tracker.template,box,side:'right'});}
test('bitmap search finds a returning target and tolerates modest size changes',()=>{
 for(const scale of [.8,1,1.25]){
  const match=matcher().search(scene([{x:278,y:88,scale}]),1);assert.ok(match,'match at scale '+scale);
  assert.ok(Math.abs((match.box.x1+match.box.x2)*160-278)<4);assert.ok(Math.abs((match.box.y1+match.box.y2)*90-88)<4);
 }
});
test('bitmap search rejects missing, changed and ambiguous targets',()=>{
 assert.equal(matcher().search(scene(),5),null);
 assert.equal(matcher().search(scene([{x:278,y:88,inverted:true}]),1),null);
 assert.equal(matcher().search(scene([{x:270,y:90},{x:100,y:90}]),5),null);
});
test('exit-side search expands across the full frame after four seconds',()=>{
 const m=matcher(),frame=scene([{x:100,y:90}]);assert.equal(m.search(frame,1),null);assert.ok(m.search(frame,5));
});
test('bitmap worker protocol produces ready and real matcher results',async()=>{
 const messages=[];globalThis.self={postMessage:message=>messages.push(message)};
 await import('../camera-bitmap-worker.js');
 const tracker=new VisualTracker(scene([{x:270,y:90}]),box);
 self.onmessage({data:{type:'init',reference:{anchor:tracker.anchor,recent:tracker.template,box,side:'right'}}});assert.equal(messages[0].type,'ready');
 const frame=scene([{x:278,y:88}]);self.onmessage({data:{type:'frame',width:frame.width,height:frame.height,pixels:frame.data.buffer,seconds:1}});
 assert.equal(messages[1].type,'match');assert.equal(messages[1].match.kind,'manual');assert.ok(messages[1].ms>=0);
});
test('a small target can be confirmed across successive phased search passes',()=>{
 const width=1280,height=720,data=new Uint8Array(width*height).fill(20),cx=1192,cy=361;
 for(let y=cy-8;y<cy+8;y++)for(let x=cx-8;x<cx+8;x++)data[y*width+x]=80+((x-cx)*29+(y-cy)*41+2000)%140;
 const frame={data,width,height},smallBox={x1:(cx-8)/width,y1:(cy-8)/height,x2:(cx+8)/width,y2:(cy+8)/height};
 const tracker=new VisualTracker(frame,smallBox),m=new BitmapMatcher({anchor:tracker.anchor,recent:tracker.template,box:smallBox,side:'right'});
 let found=null;for(let i=0;i<16&&!found;i++)found=m.search(frame,1);
 assert.ok(found,'phased search eventually finds the small patch');
 assert.ok(m.search(frame,1),'local refinement preserves next confirmation');assert.ok(m.search(frame,1),'local refinement preserves third confirmation');
});
