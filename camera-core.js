// Normalised, unmirrored camera coordinates throughout detection and tracking.
export const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
export function centre(b) { return {x:(b.x1+b.x2)/2, y:(b.y1+b.y2)/2}; }
export function iou(a,b) {
 const intersection=Math.max(0,Math.min(a.x2,b.x2)-Math.max(a.x1,b.x1))*Math.max(0,Math.min(a.y2,b.y2)-Math.max(a.y1,b.y1));
 const area=b=>(b.x2-b.x1)*(b.y2-b.y1);
 return intersection/(area(a)+area(b)-intersection||1);
}
export function guidance(box, tolerance=.045) {
 const c=centre(box),dx=.5-c.x,dy=.5-c.y;
 const horizontal=Math.abs(dx)>tolerance?(dx>0?'right':'left'):null;
 const vertical=Math.abs(dy)>tolerance?(dy>0?'down':'up'):null;
 return {horizontal,vertical,centred:!horizontal&&!vertical};
}
export function exitSide(box) {
 // A disappearance in the interior could be occlusion or a missed detection.
 const c=centre(box),margin=.07;
 const x=box.x1<=margin&&c.x<.3?'left':box.x2>=1-margin&&c.x>.7?'right':'';
 const y=box.y1<=margin&&c.y<.3?'top':box.y2>=1-margin&&c.y>.7?'bottom':'';
 return [y,x].filter(Boolean).join('-')||null;
}
export function makeLock(detection, now) {
 return {...detection,seen:now,vx:0,vy:0,lost:false,missing:false,exit:null};
}
export function updateLock(lock,detections,now) {
 if(!lock||lock.lost)return lock;
 const elapsed=Math.max(1,now-lock.seen),c=centre(lock.box);
 const prediction={x:c.x+lock.vx*Math.min(elapsed,500),y:c.y+lock.vy*Math.min(elapsed,500)};
 const gate=Math.min(.28,.10+elapsed*.00018);
 const oldArea=(lock.box.x2-lock.box.x1)*(lock.box.y2-lock.box.y1);
 const candidates=detections.filter(d=>d.label===lock.label).map(d=>{
  const p=centre(d.box),distance=Math.hypot(p.x-prediction.x,p.y-prediction.y);
  const area=(d.box.x2-d.box.x1)*(d.box.y2-d.box.y1),ratio=area/(oldArea||1);
  return {d,distance,ratio,overlap:iou(lock.box,d.box)};
 }).filter(v=>v.distance<gate&&v.ratio>.25&&v.ratio<4).sort((a,b)=>(b.overlap-b.distance*2)-(a.overlap-a.distance*2));
 if(candidates.length){
  const d=candidates[0].d,p=centre(d.box);
  return {...d,seen:now,vx:lock.vx*.4+(p.x-c.x)/elapsed*.6,vy:lock.vy*.4+(p.y-c.y)/elapsed*.6,lost:false,missing:false,exit:null};
 }
 return {...lock,missing:true,lost:elapsed>1500,exit:elapsed>600?exitSide(lock.box):null};
}
export function contentRect(width,height,videoWidth,videoHeight) {
 const scale=Math.min(width/videoWidth,height/videoHeight),w=videoWidth*scale,h=videoHeight*scale;
 return {x:(width-w)/2,y:(height-h)/2,w,h};
}
export function decode(output,width,height,threshold) {
 const detections=[];
 for(let i=0;i<output.length;i+=6){
  const [x1,y1,x2,y2,score,id]=output.subarray(i,i+6);
  if(score<threshold||![x1,y1,x2,y2,score,id].every(Number.isFinite))continue;
  const box={x1:clamp(x1/width),y1:clamp(y1/height),x2:clamp(x2/width),y2:clamp(y2/height)};
  if(box.x2>box.x1&&box.y2>box.y1)detections.push({classId:Math.round(id),score,box});
 }
 return detections;
}
