// Experimental RGB/relative-depth registration. Arbitrary units; no metric SLAM.
// Rigid orientation: Horn (1987), doi:10.1364/JOSAA.4.000629.
export const MAX_POINTS=32000, MAX_VIEWS=40;
const I=[1,0,0,0,1,0,0,0,1], dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const sub=(a,b)=>a.map((v,i)=>v-b[i]), norm=a=>Math.hypot(...a);
const median=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)];};
export const rotate=(r,p)=>[dot(r.slice(0,3),p),dot(r.slice(3,6),p),dot(r.slice(6,9),p)];
export const transform=(t,p)=>rotate(t.r,p).map((v,i)=>v*t.s+t.t[i]);
export function compose(a,b){const r=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++)r.push(a.r[i*3]*b.r[j]+a.r[i*3+1]*b.r[j+3]+a.r[i*3+2]*b.r[j+6]);return {r,s:a.s*b.s,t:transform(a,b.t)};}
export function fitSimilarity(a,b,rotationOnly=false){
 if(a.length<3||a.length!==b.length)return null;
 const center=x=>[0,1,2].map(k=>x.reduce((s,p)=>s+p[k],0)/x.length),ca=rotationOnly?[0,0,0]:center(a),cb=rotationOnly?[0,0,0]:center(b);
 const aa=a.map(p=>sub(p,ca)),bb=b.map(p=>sub(p,cb)),h=Array(9).fill(0);
 for(let n=0;n<a.length;n++)for(let i=0;i<3;i++)for(let j=0;j<3;j++)h[i*3+j]+=aa[n][i]*bb[n][j];
 const [xx,xy,xz,yx,yy,yz,zx,zy,zz]=h;
 const m=[[xx+yy+zz,yz-zy,zx-xz,xy-yx],[yz-zy,xx-yy-zz,xy+yx,zx+xz],[zx-xz,xy+yx,-xx+yy-zz,yz+zy],[xy-yx,zx+xz,yz+zy,-xx-yy+zz]];
 // Jacobi symmetric eigen-decomposition, including 180-degree rotations.
 const v=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
 for(let n=0;n<40;n++){
  let p=0,q=1;for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)if(Math.abs(m[i][j])>Math.abs(m[p][q])){p=i;q=j;}
  if(Math.abs(m[p][q])<1e-12)break;
  const angle=.5*Math.atan2(2*m[p][q],m[q][q]-m[p][p]),c=Math.cos(angle),s=Math.sin(angle);
  const pp=m[p][p],qq=m[q][q],pq=m[p][q];
  for(let k=0;k<4;k++)if(k!==p&&k!==q){const kp=m[k][p],kq=m[k][q];m[k][p]=m[p][k]=c*kp-s*kq;m[k][q]=m[q][k]=s*kp+c*kq;}
  m[p][p]=c*c*pp-2*s*c*pq+s*s*qq;m[q][q]=s*s*pp+2*s*c*pq+c*c*qq;m[p][q]=m[q][p]=0;
  for(let k=0;k<4;k++){const kp=v[k][p],kq=v[k][q];v[k][p]=c*kp-s*kq;v[k][q]=s*kp+c*kq;}
 }
 let largest=0;for(let i=1;i<4;i++)if(m[i][i]>m[largest][largest])largest=i;
 const [w,x,y,z]=v.map(row=>row[largest]);
 const r=[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w),2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w),2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)];
 const den=aa.reduce((s,p)=>s+dot(p,p),0);if(den<1e-10)return null;
 const scale=rotationOnly?1:aa.reduce((s,p,i)=>s+dot(rotate(r,p),bb[i]),0)/den;
 if(!Number.isFinite(scale)||scale<=0)return null;
 return {r,s:scale,t:cb.map((v,i)=>v-scale*rotate(r,ca)[i])};
}
export function validateFrame(f){
 if(!f||!Number.isInteger(f.width)||!Number.isInteger(f.height)||f.width<32||f.height<32||f.width>224||f.height>224)throw Error('Invalid scan frame dimensions');
 if(f.raw.length!==f.width*f.height||f.pixels.length!==f.width*f.height*4)throw Error('Invalid scan buffers');
 if(!Array.from(f.raw).every(Number.isFinite))throw Error('Nonfinite scan depth');
}
export function features(f){
 const {width:w,height:h,pixels}=f,g=new Float32Array(w*h);
 for(let i=0;i<g.length;i++)g[i]=(pixels[4*i]*.299+pixels[4*i+1]*.587+pixels[4*i+2]*.114)/255;
 const candidates=[];
 for(let y=6;y<h-6;y+=2)for(let x=6;x<w-6;x+=2){
  let xx=0,yy=0,xy=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const i=(y+dy)*w+x+dx,gx=g[i+1]-g[i-1],gy=g[i+w]-g[i-w];xx+=gx*gx;yy+=gy*gy;xy+=gx*gy;}
  const score=(xx+yy-Math.hypot(xx-yy,2*xy))/2;if(score>.025)candidates.push({x,y,score});
 }
 candidates.sort((a,b)=>b.score-a.score);const out=[],cells=new Map();
 for(const p of candidates){
  const key=Math.floor(p.x/28)+','+Math.floor(p.y/28);if((cells.get(key)||0)>=6||out.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<6))continue;
  const d=[];for(let y=-4;y<=4;y+=2)for(let x=-4;x<=4;x+=2)d.push(g[(p.y+y)*w+p.x+x]);
  const mean=d.reduce((a,b)=>a+b)/d.length,sd=Math.sqrt(d.reduce((s,v)=>s+(v-mean)**2,0)/d.length);
  if(sd<.03)continue;p.d=d.map(v=>(v-mean)/sd);out.push(p);cells.set(key,(cells.get(key)||0)+1);if(out.length===240)break;
 }
 return out;
}
export function matchFeatures(a,b){
 const distance=(p,q)=>p.d.reduce((s,v,i)=>s+(v-q.d[i])**2,0)/p.d.length;
 const nearest=(from,to)=>from.map(p=>{let best=Infinity,second=Infinity,index=-1;for(let i=0;i<to.length;i++){const q=to[i];if(Math.hypot(p.x-q.x,p.y-q.y)>32)continue;const d=distance(p,q);if(d<best){second=best;best=d;index=i;}else if(d<second)second=d;}return best<.65&&best<second*.65?index:-1;});
 const ab=nearest(a,b),ba=nearest(b,a);return ab.flatMap((j,i)=>j>=0&&ba[j]===i?[{a:a[i],b:b[j]}]:[]);
}
function range(raw){let lo=Infinity,hi=-Infinity;for(const v of raw){lo=Math.min(lo,v);hi=Math.max(hi,v);}if(hi-lo<1e-6)throw Error('Depth has no variation');const scale=median(Array.from(raw).filter(v=>v>0));if(!(scale>0))throw Error('Depth has no positive values');return {lo,span:hi-lo,scale};}
function point(f,p,shift=0){
 const q=f.raw[p.y*f.width+p.x]/f.range.scale+shift;
 if(q<.08)return null;const z=1/q,focal=Math.max(f.width,f.height)/(2*Math.tan(55*Math.PI/360));
 return [(p.x-(f.width-1)/2)*z/focal,-(p.y-(f.height-1)/2)*z/focal,z];
}
function coverage(matches,w,h){const cells=new Set(matches.map(m=>Math.min(2,Math.floor(m.b.x/w*3))+','+Math.min(2,Math.floor(m.b.y/h*3))));const xs=matches.map(m=>m.b.x),ys=matches.map(m=>m.b.y);return cells.size>=4&&Math.max(...xs)-Math.min(...xs)>w*.35&&Math.max(...ys)-Math.min(...ys)>h*.35;}
export function register(reference,current){
 const matches=matchFeatures(reference.features,current.features).filter(m=>point(reference,m.a,reference.shift));
 if(matches.length<16||!coverage(matches,current.width,current.height))return {ok:false,reason:'Not enough shared detail. Return towards the last accepted view.',matches:matches.length};
 const displacement=median(matches.map(m=>Math.hypot(m.a.x-m.b.x,m.a.y-m.b.y)));
 if(displacement<2.5)return {ok:false,reason:'Move slightly sideways; this view is already captured.',matches:matches.length};
 const focalR=Math.max(current.width,current.height)/(2*Math.tan(55*Math.PI/360));
 const ray=p=>{const v=[(p.x-(current.width-1)/2)/focalR,-(p.y-(current.height-1)/2)/focalR,1];const n=norm(v);return v.map(x=>x/n);};
 const raysA=matches.map(m=>ray(m.b)),raysB=matches.map(m=>ray(m.a));
 const rotation=fitSimilarity(raysA,raysB,true);
 const rotationError=median(raysA.map((p,i)=>norm(sub(rotate(rotation.r,p),raysB[i]))*focalR));
 if(rotationError<1.5)return {ok:false,reason:'Move slightly sideways rather than only turning the phone.',matches:matches.length};
 const target=matches.map(m=>point(reference,m.a,reference.shift));
 const depth=median(target.filter(Boolean).map(p=>p[2])),threshold=depth*.035;
 let seed=2197,best=null;
 const random=n=>{seed=(1664525*seed+1013904223)>>>0;return seed%n;};
 const shifts=[-.8,-.6,-.4,-.2,-.1,0,.1,.2,.4,.6,1,0];
 for(let si=0;si<shifts.length;si++){
  if(si===11&&best){for(const d of [-.075,-.05,-.025,.025,.05,.075])shifts.push(best.shift+d);}
  const shift=shifts[si];
  const source=matches.map(m=>point(current,m.b,shift));const valid=source.flatMap((p,i)=>p?[i]:[]);if(valid.length<16)continue;
  for(let trial=0;trial<100;trial++){
   const ids=new Set();while(ids.size<4)ids.add(valid[random(valid.length)]);const sample=[...ids];
   const pose=fitSimilarity(sample.map(i=>source[i]),sample.map(i=>target[i]));if(!pose||pose.s<.2||pose.s>4)continue;
   const inliers=[];let error=0;
   for(let i=0;i<matches.length;i++){if(!source[i])continue;const e=norm(sub(transform(pose,source[i]),target[i]));if(e<threshold){inliers.push(i);error+=e;}}
   if(inliers.length<16)continue;
   const score=inliers.length-error/threshold*.2;
   if(!best||score>best.score)best={score,shift,source,inliers,pose};
  }
 }
 if(!best||best.inliers.length/matches.length<.6)return {ok:false,reason:'Depth alignment uncertain. Return towards the last accepted view.',matches:matches.length,inliers:best?.inliers.length||0};
 const pose=fitSimilarity(best.inliers.map(i=>best.source[i]),best.inliers.map(i=>target[i]));
 const accepted=best.inliers.map(i=>matches[i]);
 const angle=Math.acos(Math.max(-1,Math.min(1,(pose.r[0]+pose.r[4]+pose.r[8]-1)/2)));
 const translation=norm(pose.t)/depth;
 const errors=best.inliers.map(i=>norm(sub(transform(pose,best.source[i]),target[i]))/depth);
 const focal=Math.max(current.width,current.height)/(2*Math.tan(55*Math.PI/360));
 const reprojection=best.inliers.map(i=>{const p=transform(pose,best.source[i]),m=matches[i].a;return Math.hypot(p[0]*focal/p[2]+(current.width-1)/2-m.x,-p[1]*focal/p[2]+(current.height-1)/2-m.y);});
 if(!coverage(accepted,current.width,current.height)||median(errors)>.022||median(reprojection)>1.8||angle>.22||translation>.18||pose.s<.3||pose.s>3)return {ok:false,reason:'Move in smaller steps with more overlap; alignment rejected.',matches:matches.length};
 if(translation<.008)return {ok:false,reason:'Move slightly sideways rather than only turning the phone.',matches:matches.length};
 return {ok:true,pose,shift:best.shift,matches:matches.length,inliers:best.inliers.length,error:median(errors),reprojection:median(reprojection)};
}
export class ScanMap{
 constructor(){this.clear();}
 clear(){this.voxels=new Map();this.reference=null;this.views=0;this.orientation=null;}
 add(f){
  validateFrame(f);if(this.views>=MAX_VIEWS||this.voxels.size>=MAX_POINTS)return {ok:false,full:true,reason:'Scan limit reached. Finish and save this scene.'};
  if(this.reference&&(f.width!==this.reference.width||f.height!==this.reference.height||f.orientation!==this.orientation))return {ok:false,reason:'Keep the phone in its original orientation, or finish and start a new scan.'};
  f.range=range(f.raw);f.features=features(f);
  if(f.features.length<24)return {ok:false,reason:'Aim at a stationary surface with more detail.'};
  const result=this.reference?register(this.reference,f):{ok:true,pose:{r:I,s:1,t:[0,0,0]},shift:0,matches:0,inliers:0};
  if(!result.ok)return result;
  f.shift=result.shift;f.pose=this.reference?compose(this.reference.pose,result.pose):result.pose;
  if(f.pose.s<.15||f.pose.s>6)return {ok:false,reason:'Scale drift is too large. Finish this scene and start a new scan.'};
  // Preserve existing surfaces. New observations only fill unoccupied voxels;
  // conflicting colours/depth do not move previously accepted geometry.
  const additions=[];const keys=new Set();
  for(let y=2;y<f.height-2;y+=3)for(let x=2;x<f.width-2;x+=3){
   const p=point(f,{x,y},f.shift);if(!p)continue;const q=transform(f.pose,p);if(q.some(v=>!Number.isFinite(v)||Math.abs(v)>100))continue;
   const key=q.map(v=>Math.floor(v/.035)).join(',');if(this.voxels.has(key)||keys.has(key))continue;
   const i=(y*f.width+x)*4;additions.push([key,[...q,...f.pixels.slice(i,i+3)]]);keys.add(key);
  }
  if(this.reference&&additions.length<20)return {ok:false,reason:'This area is already covered. Move a little further sideways.'};
  if(this.voxels.size+additions.length>MAX_POINTS)return {ok:false,full:true,reason:'Scene memory limit reached. Finish and save.'};
  for(const [key,p] of additions)this.voxels.set(key,p);
  this.reference=f;this.orientation=f.orientation;this.views++;
  return {...result,views:this.views,points:this.voxels.size,added:additions.length};
 }
 snapshot(){return {format:'tactical-relief',version:1,units:'arbitrary',views:this.views,points:[...this.voxels.values()]};}
}
export function validateScene(s){
 if(!s||s.format!=='tactical-relief'||s.version!==1||s.units!=='arbitrary'||!Number.isInteger(s.views)||s.views<1||s.views>MAX_VIEWS||!Array.isArray(s.points)||!s.points.length||s.points.length>MAX_POINTS)throw Error('Unsupported or oversized relief file');
 for(const p of s.points)if(!Array.isArray(p)||p.length!==6||!p.every(Number.isFinite)||p.slice(0,3).some(v=>Math.abs(v)>100)||p.slice(3).some(v=>!Number.isInteger(v)||v<0||v>255))throw Error('Invalid relief point');
 return {format:'tactical-relief',version:1,units:'arbitrary',views:s.views,points:s.points.map(p=>p.slice())};
}
// Motion is a capture-stability heuristic, never a pose/registration estimate.
export class CaptureGate{
 constructor(){this.reset();}
 reset(){this.previous=null;this.anchor=null;this.retryImage=null;this.stillSince=null;this.nextAt=0;}
 complete(now,image,accepted){this.previous=null;this.stillSince=null;this.nextAt=now+1800;if(accepted){this.anchor=image?.slice()||null;this.retryImage=null;}else this.retryImage=image?.slice()||null;}
 sample(image,now){
  const difference=(a,b)=>a.reduce((s,v,i)=>s+Math.abs(v-b[i]),0)/a.length;
  const motion=this.previous?difference(image,this.previous):Infinity;this.previous=image.slice();
  const novelty=this.anchor?difference(image,this.anchor):Infinity;
  if(motion>.025)this.stillSince=null;else if(this.stillSince===null)this.stillSince=now;
  const stable=this.stillSince!==null&&now-this.stillSince>=800;
  const retryBlocked=this.retryImage&&difference(image,this.retryImage)<=.035;
  return {motion,novelty,capture:stable&&now>=this.nextAt&&novelty>.035&&!retryBlocked,state:motion>.08?'slow':retryBlocked?'retry':!stable?'hold':novelty<=.035?'move':'ready'};
 }
}
