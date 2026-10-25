// Saved captures: normalized coarse patch search seeds fine optical flow.
// Uniqueness and forward/backward checks retained; pose acceptance is unchanged.
// Pyramidal Lucas–Kanade with forward/backward consistency, RGB only.
// Optical flow supplies correspondences, never a camera pose on its own.
function pyramid(rgba){
 let width=640,height=480,data=new Float32Array(width*height);for(let i=0;i<data.length;i++)data[i]=(rgba[4*i]*.299+rgba[4*i+1]*.587+rgba[4*i+2]*.114)/255;
 const levels=[{width,height,data}];for(let l=1;l<4;l++){const w=width/2,h=height/2,next=new Float32Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*2*width+x*2;next[y*w+x]=(data[i]+data[i+1]+data[i+width]+data[i+width+1])*.25;}width=w;height=h;data=next;levels.push({width,height,data});}return levels;
}
function sample(im,x,y){const a=Math.floor(x),b=Math.floor(y),dx=x-a,dy=y-b,i=b*im.width+a;return (im.data[i]*(1-dx)+im.data[i+1]*dx)*(1-dy)+(im.data[i+im.width]*(1-dx)+im.data[i+im.width+1]*dx)*dy;}
function track(a,b,x,y,seed={x:0,y:0}){
 let dx=seed.x/4,dy=seed.y/4,error=Infinity;
 for(let level=2;level>=0;level--){
  if(level<2){dx*=2;dy*=2;}const scale=2**level,X=(x+.5)/scale-.5,Y=(y+.5)/scale-.5,A=a[level],B=b[level],r=5;
  if(X<r+2||Y<r+2||X>A.width-r-3||Y>A.height-r-3)return null;
  const patch=[];let hxx=0,hxy=0,hyy=0;
  for(let v=-r;v<=r;v++)for(let u=-r;u<=r;u++){const px=X+u,py=Y+v,val=sample(A,px,py),gx=(sample(A,px+1,py)-sample(A,px-1,py))*.5,gy=(sample(A,px,py+1)-sample(A,px,py-1))*.5;patch.push({u,v,val,gx,gy});hxx+=gx*gx;hxy+=gx*gy;hyy+=gy*gy;}
  const det=hxx*hyy-hxy*hxy;if(det<1e-8)return null;
  for(let iteration=0;iteration<25;iteration++){
   if(X+dx<r+1||Y+dy<r+1||X+dx>B.width-r-2||Y+dy>B.height-r-2)return null;
   let ex=0,ey=0,sum=0;for(const p of patch){const e=sample(B,X+dx+p.u,Y+dy+p.v)-p.val;ex+=p.gx*e;ey+=p.gy*e;sum+=e*e;}
   const ux=(hyy*ex-hxy*ey)/det,uy=(hxx*ey-hxy*ex)/det;if(!Number.isFinite(ux+uy)||Math.hypot(ux,uy)>5)return null;
   dx-=ux;dy-=uy;error=Math.sqrt(sum/patch.length);if(Math.hypot(ux,uy)<.02)break;
  }
 }
 return Math.hypot(dx,dy)<=180&&error<.08?{x:x+dx,y:y+dy,error}:null;
}
export function trackMatches(reference,current){
 reference.pyramid??=pyramid(reference.tracking);current.pyramid??=pyramid(current.tracking);
 const out=[];
 for(const p of reference.features){
  const x=(p.x+.5)*640/reference.width-.5,y=(p.y+.5)*480/reference.height-.5;
  const seed=coarse(reference.pyramid[3],current.pyramid[3],x,y);if(!seed)continue;const q=track(reference.pyramid,current.pyramid,x,y,seed);if(!q)continue;const back=track(current.pyramid,reference.pyramid,q.x,q.y,{x:x-q.x,y:y-q.y});if(!back||Math.hypot(back.x-x,back.y-y)>1)continue;
  out.push({a:p,b:{x:(q.x+.5)*current.width/640-.5,y:(q.y+.5)*current.height/480-.5},flowError:q.error});
 }return out;
}

function coarse(a,b,x,y){
 const X=(x+.5)/8-.5,Y=(y+.5)/8-.5,r=3;
 if(X<r+1||Y<r+1||X>=a.width-r-2||Y>=a.height-r-2)return null;
 const values=[];for(let v=-r;v<=r;v++)for(let u=-r;u<=r;u++)values.push(sample(a,X+u,Y+v));
 const mean=values.reduce((s,v)=>s+v,0)/values.length,den=Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0));if(den<.02)return null;
 const target=values.map(v=>(v-mean)/den),candidates=[];
 for(let dy=-20;dy<=20;dy++)for(let dx=-20;dx<=20;dx++){
  if(X+dx<r+1||Y+dy<r+1||X+dx>=b.width-r-2||Y+dy>=b.height-r-2)continue;
  let sum=0,sq=0,cross=0,n=0;for(let v=-r;v<=r;v++)for(let u=-r;u<=r;u++){const z=sample(b,X+dx+u,Y+dy+v);sum+=z;sq+=z*z;cross+=target[n++]*z;}
  const d=Math.sqrt(Math.max(0,sq-sum*sum/n));if(d<.02)continue;candidates.push({dx,dy,score:1-cross/d});
 }
 candidates.sort((a,b)=>a.score-b.score);const best=candidates[0];if(!best||best.score>.25)return null;const second=candidates.find(c=>Math.hypot(c.dx-best.dx,c.dy-best.dy)>3);
 if(second&&best.score>second.score*.8)return null;return {x:best.dx*8,y:best.dy*8};
}
