import test from 'node:test';
import assert from 'node:assert/strict';
import {correctedExport,correctionPlan} from '../motion-correction.mjs';
import {validateRecording} from '../motion-replay-core.mjs';
const p=(t,x,z=0,segment=0,q=[0,0,0,1])=>({t,x,y:0,z,segment,q});
const data=()=>({format:'tactical-motion-1',units:'metres',referenceSpace:'local',sampling:{requestedHz:30},samples:[p(1000,0),p(1100,.1),p(1200,.2),p(1500,2,0,1,[0,Math.SQRT1_2,0,Math.SQRT1_2]),p(1600,2.1,0,1,[0,Math.SQRT1_2,0,Math.SQRT1_2])]});
test('automatic export corrects both transforms, preserves timestamps/metadata/input and is idempotent',()=>{
 const raw=data(),before=JSON.stringify(raw),out=correctedExport(raw);
 assert.equal(JSON.stringify(raw),before);assert.equal(out.samples[3].x,.5);assert.ok(Math.abs(out.samples[4].z-.1)<1e-9);
 assert.deepEqual(out.samples.map(p=>p.t),raw.samples.map(p=>p.t));assert.deepEqual(out.sampling,raw.sampling);
 assert.deepEqual(out.gapCorrections.headingSamples,[3]);assert.deepEqual(out.gapCorrections.motionSamples,[3]);
 assert.deepEqual(correctedExport(out),out);
 const plan=correctionPlan(out,validateRecording(out).samples);assert.equal(plan.heading.size,0);assert.equal(plan.motion.size,0);
});
test('saving explicitly uncorrected replay preserves the choice on reload',()=>{
 const out=correctedExport(data(),{heading:new Set(),motion:new Set()});
 assert.equal(out.samples[3].x,2);assert.deepEqual(out.gapCorrections.headingSamples,[]);assert.deepEqual(correctedExport(out),out);
});
test('legacy corrected reference files are not corrected twice',()=>{
 const raw=data();raw.correction={method:'pre-gap-heading-and-velocity-v1',sampleIndex:3};
 const plan=correctionPlan(raw,validateRecording(raw).samples);assert.equal(plan.heading.size,0);assert.equal(plan.motion.size,0);
 const out=correctedExport(raw);assert.equal(out.samples[3].x,2);
});
test('ineligible motion gaps remain unshifted; valid heading still corrected',()=>{
 const raw=data();raw.samples[3].t=2500;raw.samples[4].t=2600;
 const out=correctedExport(raw);assert.deepEqual(out.gapCorrections.motionSamples,[]);assert.deepEqual(out.gapCorrections.headingSamples,[3]);assert.equal(out.samples[3].x,2);
});
