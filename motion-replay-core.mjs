import {MAX_BYTES,MAX_SAMPLES,connected} from './motion-path.mjs?v=2';
export {MAX_BYTES,connected};
const finite = n => typeof n === 'number' && Number.isFinite(n);
export function validateRecording(data) {
  if (data?.format !== 'tactical-motion-1' || data.units !== 'metres' || data.referenceSpace !== 'local') throw Error('Choose a Tactical Motion Lab trajectory JSON (tactical-motion-1, metres, local).');
  if (!Array.isArray(data.samples) || !data.samples.length || data.samples.length > MAX_SAMPLES) throw Error('Recording must contain 1–36,000 samples.');
  let previous = -Infinity, segment = -1;
  const samples = data.samples.map((p,i) => {
    if (!p || ![p.t,p.x,p.y,p.z].every(finite) || p.t<0 || p.t<=previous || Math.max(Math.abs(p.x),Math.abs(p.y),Math.abs(p.z))>1e6 || !Number.isSafeInteger(p.segment) || p.segment<segment || p.segment<0 || !Array.isArray(p.q) || p.q.length!==4 || !p.q.every(finite)) throw Error(`Invalid position, time, segment or rotation at sample ${i+1}.`);
    const norm=Math.hypot(...p.q);
    if(norm<0.5 || norm>1.5) throw Error(`Invalid rotation at sample ${i+1}.`);
    previous=p.t;segment=p.segment;
    return {t:p.t,x:p.x,y:p.y,z:p.z,q:p.q.map(n=>n/norm),segment:p.segment,...(["position-jump","tracking-gap"].includes(p.breakReason)?{breakReason:p.breakReason}:{})};
  });
  const first=samples[0].t;
  return {samples:samples.map(p=>({...p,t:p.t-first})), duration:samples.at(-1).t-first};
}
export function slerp(a,b,u) {
  let dot=a.reduce((sum,v,i)=>sum+v*b[i],0), target=b;
  if(dot<0){target=b.map(v=>-v);dot=-dot;}
  dot=Math.min(1,Math.max(-1,dot));
  if(dot>0.9995){const q=a.map((v,i)=>v+(target[i]-v)*u),n=Math.hypot(...q);return q.map(v=>v/n);}
  const angle=Math.acos(dot),sin=Math.sin(angle);
  return a.map((v,i)=>(v*Math.sin((1-u)*angle)+target[i]*Math.sin(u*angle))/sin);
}
export function rotate(q,[x,y,z]) {
  const [qx,qy,qz,qw]=q;
  const tx=2*(qy*z-qz*y),ty=2*(qz*x-qx*z),tz=2*(qx*y-qy*x);
  return [x+qw*tx+qy*tz-qz*ty,y+qw*ty+qz*tx-qx*tz,z+qw*tz+qx*ty-qy*tx];
}
export function poseAt(recording,time) {
  const s=recording.samples,t=Math.max(0,Math.min(time,recording.duration));
  let low=0,high=s.length;
  while(low<high){const mid=(low+high)>>1;if(s[mid].t<=t)low=mid+1;else high=mid;}
  const i=Math.max(0,low-1),a=s[i],b=s[i+1];
  const pair=connected(a,b),between=b && t>a.t;
  if(between && !pair) return {pose:null,velocity:null,gap:true};
  let pose=a;
  if(between){const u=(t-a.t)/(b.t-a.t);pose={...a,x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u,q:slerp(a.q,b.q,u)};}
  // Forward interval, or final backward interval. Never span missing tracking.
  const left=pair?a:(i===s.length-1?s[i-1]:null),right=pair?b:a;
  const velocity=connected(left,right)?['x','y','z'].map(k=>(right[k]-left[k])*1000/(right.t-left.t)):null;
  return {pose,velocity,gap:false};
}
