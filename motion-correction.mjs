import {validateRecording} from './motion-replay-core.mjs?v=3';
import {assessRecording} from './motion-path.mjs?v=2';
import {headingGaps,gapMotion,alignHeadings} from './motion-heading.mjs?v=2';

export function correctionPlan(data,samples){
  const lockedHeading=new Set(),lockedMotion=new Set();
  const marker=data.gapCorrections;
  const processed=marker?.version===1&&marker.processed===true;
  if(processed){
    for(const [key,set] of [['headingSamples',lockedHeading],['motionSamples',lockedMotion]])
      if(Array.isArray(marker[key]))for(const i of marker[key])if(Number.isSafeInteger(i)&&i>0&&i<samples.length)set.add(i);
  }
  // Reference files supplied before in-app corrected exports were available.
  for(const m of [data.headingCorrection,data.correction]){
    if(!Number.isSafeInteger(m?.sampleIndex)||m.sampleIndex<=0||m.sampleIndex>=samples.length)continue;
    if(['pre-gap-heading-yaw-v1','pre-gap-heading-and-velocity-v1'].includes(m.method))lockedHeading.add(m.sampleIndex);
    if(m.method==='pre-gap-heading-and-velocity-v1')lockedMotion.add(m.sampleIndex);
  }
  const heading=new Set(),motion=new Set();
  if(!processed)for(const gap of headingGaps(samples)){
    if(gap.angle!==null&&!lockedHeading.has(gap.index))heading.add(gap.index);
    if(gapMotion(samples,gap.index)&&!lockedMotion.has(gap.index))motion.add(gap.index);
  }
  return {heading,motion,lockedHeading,lockedMotion,processed};
}
// Shared by live Save and replay Save. Never changes the capture buffer.
export function correctedExport(data,selection=null){
  const valid=validateRecording(data),quality=assessRecording(valid.samples),samples=quality.samples;
  const plan=correctionPlan(data,samples);
  const headings=new Set([...(selection?.heading??plan.heading)].filter(i=>!plan.lockedHeading.has(i)));
  const motions=new Set([...(selection?.motion??plan.motion)].filter(i=>!plan.lockedMotion.has(i)));
  const transformed=alignHeadings(samples,headings,motions),offset=data.samples[0].t;
  return {...data,samples:transformed.map((p,i)=>({...data.samples[i],...p,t:p.t+offset})),
    gapCorrections:{version:1,processed:true,
      headingSamples:[...new Set([...plan.lockedHeading,...headings])],motionSamples:[...new Set([...plan.lockedMotion,...motions])],
      note:'Estimated gap correction: unchanged phone heading and constant pre-gap velocity assumed. Missing intervals stay disconnected and excluded from totals. No loop closure. Already applied; do not repeat.'}};
}
