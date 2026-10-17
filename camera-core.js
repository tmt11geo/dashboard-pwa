// Normalised, unmirrored camera coordinates throughout detection and tracking.
export const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
export function centre(b) { return {x:(b.x1+b.x2)/2, y:(b.y1+b.y2)/2}; }
export function iou(a,b) {
 const intersection=Math.max(0,Math.min(a.x2,b.x2)-Math.max(a.x1,b.x1))*Math.max(0,Math.min(a.y2,b.y2)-Math.max(a.y1,b.y1));
 const area=b=>(b.x2-b.x1)*(b.y2-b.y1);
 return intersection/(area(a)+area(b)-intersection||1);
}
export function guidance(box, tolerance=.045) {
 // Device guidance is the opposite of moving the box within the image.
 const c=centre(box),dx=c.x-.5,dy=c.y-.5;
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

// Rank a returning detection using label, appearance, size and exit position.
export function reacquireCandidate(target,detections,similarity,seconds=0){
 const area=b=>(b.x2-b.x1)*(b.y2-b.y1),oldArea=area(target.box);
 const candidates=[];
 for(const d of detections){
  if(d.label!==target.label||d.score<.55)continue;
  const ratio=area(d.box)/(oldArea||1);if(ratio<.2||ratio>5)continue;
  const c=centre(d.box),side=target.exit||'';
  if(seconds<4&&((side.includes('left')&&c.x>.5)||(side.includes('right')&&c.x<.5)||(side.includes('top')&&c.y>.5)||(side.includes('bottom')&&c.y<.5)))continue;
  const appearance=similarity(d);if(!Number.isFinite(appearance)||appearance<.6)continue;
  const old=centre(target.box),distance=Math.hypot(c.x-old.x,c.y-old.y);
  candidates.push({d,score:appearance*.7+d.score*.25+Math.max(0,1-distance)*.05});
 }
 candidates.sort((a,b)=>b.score-a.score);
 if(!candidates.length||(candidates[1]&&candidates[0].score-candidates[1].score<.08))return null;
 return candidates[0].d;
}
export function sameReacquisition(a,b){
 if(!a||!b||a.label!==b.label)return false;
 const ac=centre(a.box),bc=centre(b.box);
 return iou(a.box,b.box)>.15||Math.hypot(ac.x-bc.x,ac.y-bc.y)<.15;
}
