import {connected} from './motion-replay-core.mjs?v=2';
// Fixed oblique projection: the same world basis for trajectory, pose and arrows.
export const plane = ([x,y,z]) => [x-z, -80/65*y+.4*(x+z)];
export const xyz = p => [p.x,p.y,p.z];
export function fitTrajectory(samples) {
  const points=samples.map(p=>plane(xyz(p)));
  if(!points.length)points.push([0,0]);
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const centre=[(minX+maxX)/2,(minY+maxY)/2];
  // Fixed for the entire recording; no zoom changes while playing or scrubbing.
  const scale=Math.min(130,480/Math.max(.001,maxX-minX),200/Math.max(.001,maxY-minY));
  return {scale, project(v){const p=plane(v);return [350+(p[0]-centre[0])*scale,200+(p[1]-centre[1])*scale];}};
}
export function trajectoryLines(samples,time,pose){
  const lines=[];
  for(let i=1;i<samples.length;i++){
    const a=samples[i-1],b=samples[i];
    if(!connected(a,b))continue;
    if(a.t<time && b.t>time && pose){lines.push({a,b:pose,played:true},{a:pose,b,played:false});}
    else lines.push({a,b,played:b.t<=time});
  }
  return lines;
}

export function pathDistances(samples,time,pose){
  let travelled=0,total=0;
  for(let i=1;i<samples.length;i++){
    const a=samples[i-1],b=samples[i];
    if(!connected(a,b))continue;
    const length=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
    total+=length;
    if(b.t<=time)travelled+=length;
    else if(a.t<time && pose)travelled+=length*(time-a.t)/(b.t-a.t);
  }
  const start=samples[0];
  return {travelled,total,displacement:pose&&start?Math.hypot(pose.x-start.x,pose.y-start.y,pose.z-start.z):null};
}
