// Pyramidal Lucas–Kanade with forward/backward consistency, RGB only.
// Optical flow supplies correspondences, never a camera pose on its own.
function pyramid(rgba){
 let width=640,height=480,data=new Float32Array(width*height);for(let i=0;i<data.length;i++)data[i]=(rgba[4*i]*.299+rgba[4*i+1]*.587+rgba[4*i+2]*.114)/255;
 const levels=[{width,height,data}];for(let l=1;l<4;l++){const w=width/2,h=height/2,next=new Float32Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*2*width+x*2;next[y*w+x]=(data[i]+data[i+1]+data[i+width]+data[i+width+1])*.25;}width=w;height=h;data=next;levels.push({width,height,data});}return levels;
}
function sample(im,x,y){const a=Math.floor(x),b=Math.floor(y),dx=x-a,dy=y-b,i=b*im.width+a;return (im.data[i]*(1-dx)+im.data[i+1]*dx)*(1-dy)+(im.data[i+im.width]*(1-dx)+im.data[i+im.width+1]*dx)*dy;}
function track(a,b,x,y){
 let dx=0,dy=0,error=Infinity;
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
 return Math.hypot(dx,dy)<=90&&error<.08?{x:x+dx,y:y+dy,error}:null;
}
export function trackMatches(reference,current){
 reference.pyramid??=pyramid(reference.tracking);current.pyramid??=pyramid(current.tracking);
 const out=[];
 for(const p of reference.features){
  const x=(p.x+.5)*640/reference.width-.5,y=(p.y+.5)*480/reference.height-.5;
  const q=track(reference.pyramid,current.pyramid,x,y);if(!q)continue;const back=track(current.pyramid,reference.pyramid,q.x,q.y);if(!back||Math.hypot(back.x-x,back.y-y)>1)continue;
  out.push({a:p,b:{x:(q.x+.5)*current.width/640-.5,y:(q.y+.5)*current.height/480-.5},flowError:q.error});
 }return out;
}
