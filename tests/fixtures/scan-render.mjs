// Independently ray-rendered static surfaces. Camera translates horizontally;
// projected world texture supplies correspondence; raw depth is affine inverse Z.
export function render(tx=0,angle=0,affine=[1,0],options={}){
 const width=options.width||168,height=options.height||224,focal=Math.max(width,height)/(2*Math.tan(55*Math.PI/360)),K=options.K||[focal,0,(width-1)/2,0,focal,(height-1)/2,0,0,1],pixels=new Uint8ClampedArray(width*height*4),raw=new Float32Array(width*height),c=Math.cos(angle),s=Math.sin(angle);
 const hash=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263)^(options.seed||137);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
 const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),dx=x-ix,dy=y-iy;return (hash(ix,iy)*(1-dx)+hash(ix+1,iy)*dx)*(1-dy)+(hash(ix,iy+1)*(1-dx)+hash(ix+1,iy+1)*dx)*dy;};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const rx=(x-K[2])/K[0],ry=-(y-K[5])/K[4],dx=c*rx+s,dz=-s*rx+c;
  // Background at 4; foreground rectangular panels at 1 and 2.2.
  let z=4/dz;
  for(const [plane,x0,x1,y0,y1] of [[2.2,-.6,.6,-.65,.65],[1,-.18,.05,-.1,.17]]){const t=plane/dz,X=tx+dx*t,Y=ry*t;if(X>x0&&X<x1&&Y>y0&&Y<y1)z=Math.min(z,t);}
  const X=tx+dx*z,Y=ry*z,Z=dz*z;
  const texture=options.texture==='noise'?.7*noise(X*25,Y*25)+.3*noise(X*11,Y*11):(Math.sin(X*47+Y*13)+Math.sin(Y*59-X*17)+Math.sin(X*83+Y*71)+Math.cos(X*31-Y*97))/8+.5;
  const i=y*width+x;raw[i]=affine[0]/z+affine[1];
  pixels.set([Math.round(texture*220+20),Math.round(texture*180+40),Math.round(texture*160+60),255],i*4);
 }
 return {width,height,pixels,raw,orientation:0};
}
