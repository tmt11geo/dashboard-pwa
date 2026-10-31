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
// Use only contiguous pre-gap history; require >=100 ms and limit extrapolation
// to gaps <=1 second. A ~200 ms displacement average reduces frame noise.
export function gapMotion(samples,index){
  const a=samples[index-1],b=samples[index];
  if(!a||!b||connected(a,b)||b.breakReason==='position-jump')return null;
  const dt=b.t-a.t;if(dt<=0||dt>1000)return null;
  let j=index-1;
  while(j>0&&a.t-samples[j].t<200&&connected(samples[j-1],samples[j]))j--;
  const span=a.t-samples[j].t;if(span<100)return null;
  const velocity=['x','y','z'].map(k=>(a[k]-samples[j][k])*1000/span);
  if(Math.hypot(...velocity)>10)return null;
  return {dt,span,velocity};
}
export function alignHeadings(samples,selected,positionSelected=new Set()){
  const gaps=new Map(headingGaps(samples).map(g=>[g.index,g]));
  let yaw=0,tx=0,ty=0,tz=0;
  const output=[];
  return samples.map((p,i)=>{
    let c=Math.cos(yaw),s=Math.sin(yaw);
    let x=c*p.x+s*p.z+tx,y=p.y+ty,z=-s*p.x+c*p.z+tz;
    const gap=gaps.get(i);
    if(selected.has(i)&&gap&&gap.angle!==null){
      yaw=wrap(yaw+gap.angle);c=Math.cos(yaw);s=Math.sin(yaw);
      tx=x-(c*p.x+s*p.z);tz=z-(-s*p.x+c*p.z);
    }
    const motion=positionSelected.has(i)&&gap?gapMotion(samples,i):null;
    if(motion){
      // Velocity is in the frame before this boundary's heading rotation.
      const beforeYaw=selected.has(i)&&gap.angle!==null?wrap(yaw-gap.angle):yaw;
      const c0=Math.cos(beforeYaw),s0=Math.sin(beforeYaw),[vx,vy,vz]=motion.velocity;
      const a=output[i-1],dt=motion.dt/1000;
      const nx=a.x+(c0*vx+s0*vz)*dt,ny=a.y+vy*dt,nz=a.z+(-s0*vx+c0*vz)*dt;
      tx+=nx-x;ty+=ny-y;tz+=nz-z;x=nx;y=ny;z=nz;
    }
    const result={...p,x,y,z,q:yawQuaternion(p.q,yaw)};output.push(result);return result;
  });
}
