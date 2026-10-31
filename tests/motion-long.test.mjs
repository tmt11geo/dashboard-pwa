import test from 'node:test';
import assert from 'node:assert/strict';
import {MotionTrail} from '../motion-core.mjs';
import {validateRecording,poseAt} from '../motion-replay-core.mjs';
import {MAX_SAMPLES,MAX_BYTES,DISPLAY_EDGES,indexPath,indexedDistances,indexedLines,displayEdges} from '../motion-path.mjs';
import {pathDistances} from '../motion-replay-view.mjs';
import {OrbitView} from '../motion-replay-orbit.mjs';
const samples=Array.from({length:MAX_SAMPLES},(_,i)=>({t:i*100,x:Math.sin(i/40)*5,y:Math.sin(i/75),z:i*.001,q:[0,Math.sin(i/300),0,Math.cos(i/300)],segment:0}));
const data=s=>({format:'tactical-motion-1',units:'metres',referenceSpace:'local',samples:s});
test('36k recording round-trips all samples within raised file limit; excess rejected',()=>{
 const json=JSON.stringify(data(samples));assert.ok(Buffer.byteLength(json)<MAX_BYTES);
 const r=validateRecording(JSON.parse(json));assert.equal(r.samples.length,36000);assert.equal(r.duration,3599900);assert.equal(r.samples.at(-1).x,samples.at(-1).x);
 assert.throws(()=>validateRecording(data([...samples,{...samples.at(-1),t:3600000}])));
 assert.equal(validateRecording(data(samples.slice(0,3000))).samples.length,3000);
});
test('ring buffer retains every sample through capacity, then evicts only oldest in order',()=>{
 const t=new MotionTrail();
 for(let i=0;i<36005;i++)t.add(i*100,{transform:{position:{x:i,y:0,z:0},orientation:{x:0,y:0,z:0,w:1}}});
 assert.equal(t.limit,36000);assert.equal(t.count,36000);assert.equal(t.dropped,5);assert.equal(t.samples[0].t,500);assert.equal(t.samples.at(-1).x,36004);
 assert.equal(t.samples,t.samples);const snapshot=t.samples;t.add(3600500,{transform:{position:{x:36005,y:0,z:0},orientation:{x:0,y:0,z:0,w:1}}});
 assert.equal(snapshot[0].t,500);assert.equal(t.samples[0].t,600);assert.notEqual(t.samples,snapshot);t.reset();assert.equal(t.count,0);assert.equal(t.dropped,0);
});
test('bounded display path preserves all original data; exact playback uses full samples',()=>{
 const r=validateRecording(data(samples)),index=indexPath(r.samples);assert.ok(index.edges.length<=DISPLAY_EDGES);
 for(const time of [50,123450,1800050,3599850]){
 const pose=poseAt(r,time).pose,d=indexedDistances(index,time,pose),reference=pathDistances(r.samples,time,pose);
 assert.ok(Math.abs(d.travelled-reference.travelled)<1e-8);assert.ok(Math.abs(d.total-reference.total)<1e-8);
 assert.ok(indexedLines(index,time,pose).length<=DISPLAY_EDGES+1);
 }
 assert.equal(r.samples.length,36000);assert.equal(index.total,pathDistances(r.samples,3599900,r.samples.at(-1)).total);
});
test('display decimation never bridges a segment boundary or long time gap',()=>{
 const s=samples.slice(0,100).map(p=>({...p}));s[10].segment=1;for(let i=11;i<s.length;i++)s[i].segment=1;
 for(let i=60;i<s.length;i++)s[i].t+=1000;
 for(const edge of displayEdges(s,5)){
 const a=s.indexOf(edge.a),b=s.indexOf(edge.b);assert.ok(!(a<10&&b>=10));assert.ok(!(a<60&&b>=60));
 }
 const index=indexPath(s);const d=indexedDistances(index,6500,null);assert.equal(d.displacement,null);
 assert.ok(Math.abs(d.travelled-pathDistances(s,6500,null).travelled)<1e-8);
});
test('display-only simplification never changes curved path length',()=>{
 const s=Array.from({length:101},(_,i)=>({t:i*100,x:i,y:i%2,z:0,segment:0,q:[0,0,0,1]}));
 const index=indexPath(s),edges=displayEdges(s,1);assert.equal(edges.length,1);
 assert.ok(Math.abs(index.total-100*Math.SQRT2)<1e-9);assert.ok(index.total>Math.hypot(edges[0].b.x-edges[0].a.x,edges[0].b.y-edges[0].a.y));
});
test('36k camera fitting is finite without spread-argument limits',()=>{
 const v=new OrbitView(samples);assert.ok(Number.isFinite(v.scale));
 for(const s of [samples[0],samples[18000],samples.at(-1)])assert.ok(v.project([s.x,s.y,s.z]).every(Number.isFinite));
});
