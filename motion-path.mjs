export const MAX_SAMPLES=36000;
export const MAX_BYTES=20*1024*1024;
export const DISPLAY_EDGES=2000;
export function connected(a,b){return !!a&&!!b&&a.segment===b.segment&&b.t>a.t&&b.t-a.t<=500;}
// Visual-only decimation. Omit buckets containing gaps rather than bridging them.
// Full samples remain available for export, poses, velocity and distance.
export function displayEdges(samples,budget=DISPLAY_EDGES){
  const stride=Math.max(1,Math.ceil((samples.length-1)/budget)),edges=[];
  let start=0,valid=true;
  for(let i=1;i<samples.length;i++){
    valid=valid&&connected(samples[i-1],samples[i]);
    if(i-start>=stride||i===samples.length-1){
      if(valid)edges.push({a:samples[start],b:samples[i]});
      start=i;valid=true;
    }
  }
  return edges;
}
export function indexPath(samples){
  const cumulative=new Float64Array(samples.length);
  for(let i=1;i<samples.length;i++){
    const a=samples[i-1],b=samples[i];
    cumulative[i]=cumulative[i-1]+(connected(a,b)?Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z):0);
  }
  return {samples,cumulative,total:cumulative.at(-1)||0,edges:displayEdges(samples)};
}
export function indexedDistances(index,time,pose){
  const {samples,cumulative,total}=index;
  let lo=0,hi=samples.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(samples[mid].t<=time)lo=mid+1;else hi=mid;}
  const i=lo-1;
  let travelled=i>=0?cumulative[i]:0;
  if(i>=0&&i+1<samples.length&&pose&&connected(samples[i],samples[i+1])){
    travelled+=(cumulative[i+1]-cumulative[i])*(time-samples[i].t)/(samples[i+1].t-samples[i].t);
  }
  const start=samples[0];
  return {travelled,total,displacement:pose&&start?Math.hypot(pose.x-start.x,pose.y-start.y,pose.z-start.z):null};
}
export function indexedLines(index,time,pose){
  const lines=[];
  for(const {a,b} of index.edges){
    if(a.t<time&&b.t>time&&pose)lines.push({a,b:pose,played:true},{a:pose,b,played:false});
    else lines.push({a,b,played:b.t<=time});
  }
  return lines;
}

// Walking-demo heuristic, not an ARCore confidence score. Never alters coordinates.
export function jumpInfo(a,b){
  if(!a||!b)return null;
  const dt=b.t-a.t,distance=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
  const speed=distance*1000/dt;
  return dt>0&&dt<=250&&distance>.3&&speed>10 ? {distance,speed,dt} : null;
}
export function assessRecording(samples){
  let segment=0,jumps=0,gaps=0;
  const marked=samples.map((p,i)=>{
    const a=samples[i-1];
    const jump=!!a&&(p.breakReason==='position-jump'||(a.segment===p.segment&&!!jumpInfo(a,p)));
    const gap=!!a&&!jump&&(a.segment!==p.segment||p.t-a.t>500);
    if(jump||gap)segment++;
    if(jump)jumps++;if(gap)gaps++;
    const out={...p,segment};
    if(jump)out.breakReason='position-jump';else if(gap)out.breakReason='tracking-gap';
    return out;
  });
  return {samples:marked,jumps,gaps};
}
export function qualitySummary(jumps,gaps){
  return jumps||gaps ? `Caution: ${jumps} suspected position jump(s), ${gaps} tracking gap(s). Broken intervals excluded from path length and speed. Coordinates may have drifted.` : 'No abrupt jumps detected. Gradual drift is still possible; accuracy is unverified.';
}
