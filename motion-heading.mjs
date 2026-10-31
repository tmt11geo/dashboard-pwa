import {rotate} from './motion-replay-core.mjs?v=3';
import {connected} from './motion-path.mjs?v=2';
// Yaw about world +Y. Camera forward is -Z; vertical views have no stable heading.
export function heading(q){
  const [x,,z]=rotate(q,[0,0,-1]);
  return Math.hypot(x,z)<.1 ? null : Math.atan2(-x,-z);
}
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function headingGaps(samples){
  const gaps=[];
  for(let i=1;i<samples.length;i++){
    const a=samples[i-1],b=samples[i];
    if(connected(a,b)||b.breakReason==='position-jump')continue;
    const before=heading(a.q),after=heading(b.q);
    gaps.push({index:i,time:b.t,angle:before===null||after===null?null:wrap(before-after)});
  }
  return gaps;
}
function yawQuaternion(q,angle){
  const s=Math.sin(angle/2),c=Math.cos(angle/2),[x,y,z,w]=q;
  return [c*x+s*z,c*y+s*w,c*z-s*x,c*w-s*y];
}
// Recompute from immutable original samples, never repeatedly rotate rounded results.
// Every selected boundary rotates its suffix around the transformed first post-gap
// position. This preserves the gap offset and keeps later segments in the same frame.
export function alignHeadings(samples,selected){
  const gaps=new Map(headingGaps(samples).map(g=>[g.index,g]));
  let yaw=0,tx=0,tz=0;
  return samples.map((p,i)=>{
    let c=Math.cos(yaw),s=Math.sin(yaw);
    const x=c*p.x+s*p.z+tx,z=-s*p.x+c*p.z+tz;
    const gap=gaps.get(i);
    if(selected.has(i)&&gap&&gap.angle!==null){
      yaw=wrap(yaw+gap.angle);c=Math.cos(yaw);s=Math.sin(yaw);
      tx=x-(c*p.x+s*p.z);tz=z-(-s*p.x+c*p.z);
    }
    return {...p,x,z,q:yawQuaternion(p.q,yaw)};
  });
}
