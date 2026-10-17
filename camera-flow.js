import jsfeat from './vendor/jsfeat.esm.js?v=1';
const median=values=>{const v=values.slice().sort((a,b)=>a-b);return v[Math.floor(v.length/2)];};
const copyFrame=f=>({width:f.width,height:f.height,data:new Uint8Array(f.data)});
function sample(f,x,y){
 if(x<0||y<0||x>=f.width-1||y>=f.height-1)return 0;
 const ix=Math.floor(x),iy=Math.floor(y),dx=x-ix,dy=y-iy,i=iy*f.width+ix;
 return (f.data[i]*(1-dx)+f.data[i+1]*dx)*(1-dy)+(f.data[i+f.width]*(1-dx)+f.data[i+f.width+1]*dx)*dy;
}
function inside(p,polygon){
 let sign=0;for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],cross=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
  if(Math.abs(cross)<1e-5)continue;const s=Math.sign(cross);if(sign&&s!==sign)return false;sign=s;
 }return true;
}
function bounds(points){return {x1:Math.min(...points.map(p=>p.x)),y1:Math.min(...points.map(p=>p.y)),x2:Math.max(...points.map(p=>p.x)),y2:Math.max(...points.map(p=>p.y))};}
export function findFeatures(frame,polygon,existing=[]){
 const b=bounds(polygon),cx=(b.x1+b.x2)/2,cy=(b.y1+b.y2)/2,w=b.x2-b.x1,h=b.y2-b.y1,candidates=[];
 const inset=polygon.map(p=>({x:cx+(p.x-cx)*.84,y:cy+(p.y-cy)*.84}));
 for(let y=Math.max(6,Math.ceil(b.y1));y<Math.min(frame.height-6,b.y2);y+=2)for(let x=Math.max(6,Math.ceil(b.x1));x<Math.min(frame.width-6,b.x2);x+=2){
  if(!inside({x,y},inset))continue;
  let a=0,d=0,c=0;
  for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){
   const i=(y+yy)*frame.width+x+xx,gx=(frame.data[i+1]-frame.data[i-1])/2,gy=(frame.data[i+frame.width]-frame.data[i-frame.width])/2;
   a+=gx*gx;c+=gx*gy;d+=gy*gy;
  }
  const score=(a+d-Math.hypot(a-d,2*c))/2;if(score>40)candidates.push({x,y,score});
 }
 candidates.sort((a,b)=>b.score-a.score);const points=existing.slice(0,60),minDistance=Math.max(2.5,Math.min(w,h)/9),threshold=(candidates[0]?.score||0)*.015;
 for(const p of candidates){if(p.score<threshold||points.length>=60)break;if(points.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=minDistance))points.push(p);}
 return points.map(({x,y})=>({x,y}));
}
function pyramid(frame,cap=4){
 const levels=Math.min(cap,Math.min(frame.width,frame.height)>=160?4:Math.min(frame.width,frame.height)>=64?3:2),p=new jsfeat.pyramid_t(levels);p.allocate(frame.width,frame.height,jsfeat.U8C1_t);
 p.data[0].data.set(frame.data);p.build(p.data[0],true);return p;
}
function agrees(prev,p,next,q){
 let a=0,b=0,aa=0,bb=0,ab=0,n=0;
 for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++){
  const v=sample(prev,p.x+x,p.y+y),u=sample(next,q.x+x,q.y+y);a+=v;b+=u;aa+=v*v;bb+=u*u;ab+=v*u;n++;
 }
 const va=aa-a*a/n,vb=bb-b*b/n;return va>100&&vb>100&&(ab-a*b/n)/Math.sqrt(va*vb)>.65;
}
function correspondences(previous,frame,points,cap){
 const prev=pyramid(previous,cap),next=pyramid(frame,cap),n=points.length,input=new Float32Array(n*2),output=new Float32Array(n*2),back=new Float32Array(n*2),status=new Uint8Array(n),backStatus=new Uint8Array(n);
 points.forEach((p,i)=>{input[i*2]=p.x;input[i*2+1]=p.y;});
 jsfeat.optical_flow_lk.track(prev,next,input,output,n,11,25,status,.01,.0001);
 jsfeat.optical_flow_lk.track(next,prev,output,back,n,11,25,backStatus,.01,.0001);
 const matches=[];
 for(let i=0;i<n;i++){
  const p=points[i],q={x:output[i*2],y:output[i*2+1]};
  if(!status[i]||!backStatus[i]||!Number.isFinite(q.x+q.y)||Math.hypot(back[i*2]-p.x,back[i*2+1]-p.y)>1.2||q.x<6||q.y<6||q.x>=frame.width-6||q.y>=frame.height-6)continue;
  if(agrees(previous,p,frame,q))matches.push({p,q});
 }
 return matches;
}
function apply(m,p){return {x:m.a*p.x-m.b*p.y+m.tx,y:m.b*p.x+m.a*p.y+m.ty};}
function pairModel(p,q,r,s){
 const dx=r.x-p.x,dy=r.y-p.y,du=s.x-q.x,dv=s.y-q.y,den=dx*dx+dy*dy;if(den<36)return null;
 const a=(du*dx+dv*dy)/den,b=(dv*dx-du*dy)/den,scale=Math.hypot(a,b);
 if(scale<.7||scale>1.4||Math.abs(Math.atan2(b,a))>.45)return null;
 return {a,b,tx:q.x-a*p.x+b*p.y,ty:q.y-b*p.x-a*p.y};
}
export function consensusMotion(matches){
 if(matches.length<6)return null;let best=null;
 const inliers=m=>matches.filter(({p,q})=>{const v=apply(m,p);return Math.hypot(v.x-q.x,v.y-q.y)<2.4;});
 for(let i=0;i<matches.length;i++)for(let j=i+1;j<matches.length;j++){
  const m=pairModel(matches[i].p,matches[i].q,matches[j].p,matches[j].q);if(!m)continue;
  const good=inliers(m),error=good.reduce((s,{p,q})=>{const v=apply(m,p);return s+Math.hypot(v.x-q.x,v.y-q.y);},0);
  if(!best||good.length>best.good.length||(good.length===best.good.length&&error<best.error))best={m,good,error};
 }
 if(!best||best.good.length<Math.max(6,Math.ceil(matches.length*.55)))return null;
 const mean=(key,axis)=>best.good.reduce((s,v)=>s+v[key][axis],0)/best.good.length,px=mean('p','x'),py=mean('p','y'),qx=mean('q','x'),qy=mean('q','y');
 let den=0,a=0,b=0;
 for(const {p,q}of best.good){const x=p.x-px,y=p.y-py,u=q.x-qx,v=q.y-qy;den+=x*x+y*y;a+=x*u+y*v;b+=x*v-y*u;}
 if(den<36)return null;a/=den;b/=den;
 const model={a,b,tx:qx-a*px+b*py,ty:qy-b*px-a*py},good=inliers(model);
 if(Math.hypot(a,b)<.7||Math.hypot(a,b)>1.4||Math.abs(Math.atan2(b,a))>.45||good.length<Math.max(6,Math.ceil(matches.length*.55)))return null;
 return {model,good,ratio:good.length/matches.length};
}
export class FeatureFlow {
 constructor(frame,box){this.reset(frame,box);}
 reset(frame,box){
  this.frame=copyFrame(frame);this.polygon=[{x:box.x1,y:box.y1},{x:box.x2,y:box.y1},{x:box.x2,y:box.y2},{x:box.x1,y:box.y2}];
  this.points=findFeatures(frame,this.polygon);this.age=0;
 }
 reframe(from,to){
  if(Math.abs(from.x1-to.x1)+Math.abs(from.y1-to.y1)+Math.abs(from.x2-to.x2)+Math.abs(from.y2-to.y2)<1e-9)return;
  const W=this.frame.width,H=this.frame.height,ow=from.x2-from.x1,oh=from.y2-from.y1,nw=to.x2-to.x1,nh=to.y2-to.y1;
  const move=p=>({x:(from.x1+p.x/W*ow-to.x1)/nw*W,y:(from.y1+p.y/H*oh-to.y1)/nh*H});
  const data=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)data[y*W+x]=sample(this.frame,(to.x1+x/W*nw-from.x1)/ow*W,(to.y1+y/H*nh-from.y1)/oh*H);
  this.frame={data,width:W,height:H};this.polygon=this.polygon.map(move);this.points=this.points.map(move).filter(p=>p.x>=6&&p.y>=6&&p.x<W-6&&p.y<H-6);
 }
 update(frame){
  if(frame.width!==this.frame.width||frame.height!==this.frame.height||this.points.length<6)return null;
  const n=this.points.length;
  const attempt=cap=>{
   const matches=correspondences(this.frame,frame,this.points,cap);
   return matches.length>=Math.max(6,Math.ceil(n*.35))?consensusMotion(matches):null;
  };
  let fit=attempt(4);
  // A coarse pyramid can mix an occluder into a feature's window. Retry one
  // level finer when that pass cannot form a consistent object motion.
  if(!fit&&Math.min(frame.width,frame.height)>=160)fit=attempt(3);
  if(!fit)return null;
  const old=bounds(this.polygon),m=fit.model,points=fit.good.map(v=>v.q),span=bounds(fit.good.map(v=>v.p));
  if(span.x2-span.x1<Math.max(4,(old.x2-old.x1)*.2)||span.y2-span.y1<Math.max(4,(old.y2-old.y1)*.2)){
   m.a=1;m.b=0;m.tx=median(fit.good.map(v=>v.q.x-v.p.x));m.ty=median(fit.good.map(v=>v.q.y-v.p.y));
  }
  const polygon=this.polygon.map(p=>apply(m,p)),b=bounds(polygon),x=(b.x1+b.x2)/2,y=(b.y1+b.y2)/2;
  if(!Number.isFinite(x+y)||Math.hypot(x-(old.x1+old.x2)/2,y-(old.y1+old.y2)/2)>Math.max(frame.width,frame.height)*.45)return null;
  this.polygon=polygon;this.points=points;this.frame=copyFrame(frame);this.age++;
  if(this.points.length<30||this.age%8===0)this.points=findFeatures(frame,polygon,this.points);
  return {x,y,bw:b.x2-b.x1,bh:b.y2-b.y1,quality:fit.good.length/n,features:this.points.length};
 }
}
