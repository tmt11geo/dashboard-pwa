// Feature-based pyramidal optical flow with template recovery. No neural inference.
import {FeatureFlow} from './camera-flow.js?v=1';
import {clamp} from './camera-core.js?v=1';
const GRID=16,COUNT=GRID*GRID;
export function grayFrame(rgba,width,height,maxEdge=320){
 const ratio=Math.min(1,maxEdge/Math.max(width,height)),w=Math.round(width*ratio),h=Math.round(height*ratio);
 const data=new Uint8Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const j=(Math.min(height-1,Math.floor(y/ratio))*width+Math.min(width-1,Math.floor(x/ratio)))*4;
  data[y*w+x]=(rgba[j]*77+rgba[j+1]*150+rgba[j+2]*29)>>8;
 }
 return {data,width:w,height:h};
}
function patch(frame,cx,cy,bw,bh){
 // Track the interior to reduce background influence at the YOLO box edges.
 const w=bw*.82,h=bh*.82;
 if(w<6||h<6||cx-w/2<0||cy-h/2<0||cx+w/2>=frame.width||cy+h/2>=frame.height)return null;
 const values=new Float32Array(COUNT);let sum=0,squared=0;
 for(let y=0,i=0;y<GRID;y++)for(let x=0;x<GRID;x++,i++){
  const px=Math.round(cx+(x/(GRID-1)-.5)*w),py=Math.round(cy+(y/(GRID-1)-.5)*h);
  const v=frame.data[py*frame.width+px];values[i]=v;sum+=v;squared+=v*v;
 }
 const mean=sum/COUNT,std=Math.sqrt(Math.max(0,squared/COUNT-mean*mean));
 if(std<7)return null;
 for(let i=0;i<COUNT;i++)values[i]=(values[i]-mean)/std;
 return values;
}
function correlation(a,b){let dot=0;for(let i=0;i<COUNT;i++)dot+=a[i]*b[i];return dot/COUNT;}
export class VisualTracker {
 constructor(frame,box){
  this.width=frame.width;this.height=frame.height;
  this.x=(box.x1+box.x2)/2*frame.width;this.y=(box.y1+box.y2)/2*frame.height;
  this.bw=(box.x2-box.x1)*frame.width;this.bh=(box.y2-box.y1)*frame.height;
  this.anchor=patch(frame,this.x,this.y,this.bw,this.bh);
  this.template=this.anchor;this.recent=this.anchor;this.vx=0;this.vy=0;this.first=true;
  this.valid=Boolean(this.anchor);this.misses=0;this.flow=new FeatureFlow(frame,{x1:this.x-this.bw/2,y1:this.y-this.bh/2,x2:this.x+this.bw/2,y2:this.y+this.bh/2});
 }
 reframe(from,to){
  this.flow.reframe(from,to);
  const oldW=from.x2-from.x1,oldH=from.y2-from.y1,newW=to.x2-to.x1,newH=to.y2-to.y1;
  this.x=((from.x1+this.x/this.width*oldW)-to.x1)/newW*this.width;
  this.y=((from.y1+this.y/this.height*oldH)-to.y1)/newH*this.height;
  this.bw*=oldW/newW;this.bh*=oldH/newH;this.vx*=oldW/newW;this.vy*=oldH/newH;
 }
 similarity(frame,box){
  if(!this.valid)return -1;
  const sample=patch(frame,(box.x1+box.x2)/2*frame.width,(box.y1+box.y2)/2*frame.height,(box.x2-box.x1)*frame.width,(box.y2-box.y1)*frame.height);
  return sample?correlation(sample,this.anchor)*.7+correlation(sample,this.template)*.3:-1;
 }
 update(frame){
  if(!this.valid||frame.width!==this.width||frame.height!==this.height)return null;
  const motion=this.flow.update(frame);
  if(motion){
   this.vx=motion.x-this.x;this.vy=motion.y-this.y;this.x=motion.x;this.y=motion.y;this.bw=motion.bw;this.bh=motion.bh;this.first=false;this.misses=0;
   const current=patch(frame,this.x,this.y,this.bw,this.bh);
   if(current&&motion.quality>.7){
    this.recent=current;
    const mixed=new Float32Array(COUNT);let norm=0;
    for(let i=0;i<COUNT;i++){mixed[i]=this.template[i]*.85+current[i]*.15;norm+=mixed[i]*mixed[i];}
    norm=Math.sqrt(norm/COUNT);for(let i=0;i<COUNT;i++)mixed[i]/=norm;this.template=mixed;
   }
   return {quality:motion.quality,mode:'flow',features:motion.features,box:{x1:clamp((this.x-this.bw/2)/frame.width),y1:clamp((this.y-this.bh/2)/frame.height),x2:clamp((this.x+this.bw/2)/frame.width),y2:clamp((this.y+this.bh/2)/frame.height)}};
  }
  const radius=this.first?Math.round(Math.max(frame.width,frame.height)*.22):Math.min(64,40+this.misses*8);
  const step=this.first?5:3,px=this.x+this.vx,py=this.y+this.vy;
  let best=null;
  const evaluate=(x,y,scale)=>{
   const candidate=patch(frame,x,y,this.bw*scale,this.bh*scale);if(!candidate)return;
   const current=correlation(candidate,this.template),original=correlation(candidate,this.anchor);
   // Keep a fixed appearance reference to resist drift onto an unrelated patch.
   if(original<.40)return;
   const quality=current*.7+original*.3;
   const score=quality-(scale===1?0:.004)-Math.hypot(x-px,y-py)*.00015;
   if(!best||score>best.score)best={x,y,scale,quality,original,score,candidate};
  };
  for(const scale of [.8,.9,1,1.1,1.25])for(let dy=-radius;dy<=radius;dy+=step)for(let dx=-radius;dx<=radius;dx+=step)evaluate(px+dx,py+dy,scale);
  if(!best){this.misses++;return null;}
  const coarse=best;
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)evaluate(coarse.x+dx,coarse.y+dy,coarse.scale);
  if(best.quality<.66){this.misses++;return null;}
  this.vx=clamp((best.x-this.x)*.7+this.vx*.3,-12,12);this.vy=clamp((best.y-this.y)*.7+this.vy*.3,-12,12);
  this.x=best.x;this.y=best.y;this.bw*=best.scale;this.bh*=best.scale;this.first=false;this.misses=0;this.recent=best.candidate;
  this.flow.reset(frame,{x1:this.x-this.bw/2,y1:this.y-this.bh/2,x2:this.x+this.bw/2,y2:this.y+this.bh/2});
  if(best.quality>.85&&best.original>.65){
   const mixed=new Float32Array(COUNT);let norm=0;
   for(let i=0;i<COUNT;i++){mixed[i]=this.template[i]*.96+best.candidate[i]*.04;norm+=mixed[i]*mixed[i];}
   norm=Math.sqrt(norm/COUNT);for(let i=0;i<COUNT;i++)mixed[i]/=norm;this.template=mixed;
  }
  return {quality:best.quality,mode:'template',features:this.flow.points.length,box:{x1:clamp((this.x-this.bw/2)/frame.width),y1:clamp((this.y-this.bh/2)/frame.height),x2:clamp((this.x+this.bw/2)/frame.width),y2:clamp((this.y+this.bh/2)/frame.height)}};
 }
}
