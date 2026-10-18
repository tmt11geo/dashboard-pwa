// Depth Anything V2 predicts relative inverse depth, not metres.
export const MODEL_REVISION='4472b7362082ad9968fee890ca0f1e5aca36b93d';
export const MODEL_ROOT=`https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/${MODEL_REVISION}/onnx/`;
export const SIZES=[224,336,518];
export function frameSize(width,height,limit){
 if(!(width>0&&height>0)||!SIZES.includes(limit))throw new Error('Invalid camera size');
 // Keep the whole image, preserve aspect, and match the ViT patch size of 14.
 const scale=limit/Math.max(width,height);
 return {width:Math.max(14,Math.round(width*scale/14)*14),height:Math.max(14,Math.round(height*scale/14)*14)};
}
export function prepareInput(rgba,width,height){
 if(rgba.length!==width*height*4)throw new Error('Invalid image buffer');
 const plane=width*height,out=new Float32Array(plane*3),mean=[.485,.456,.406],std=[.229,.224,.225];
 for(let i=0;i<plane;i++)for(let c=0;c<3;c++)out[c*plane+i]=(rgba[i*4+c]/255-mean[c])/std[c];
 return out;
}
export function normalizeDepth(values){
 let min=Infinity,max=-Infinity,valid=0;
 for(const v of values)if(Number.isFinite(v)){min=Math.min(min,v);max=Math.max(max,v);valid++;}
 if(!valid||max-min<1e-6)throw new Error('Depth output has no usable variation. Try another scene or backend.');
 const out=new Float32Array(values.length),range=max-min;
 for(let i=0;i<values.length;i++)out[i]=Number.isFinite(values[i])?Math.max(0,Math.min(1,(values[i]-min)/range)):0;
 return out;
}
export function depthColor(value){
 const v=Math.max(0,Math.min(1,value));
 // Dark blue = far; amber/white = near. Independent of the saved UI theme.
 const stops=[[8,13,29],[30,61,105],[51,137,139],[224,174,85],[255,246,217]];
 const at=v*4,i=Math.min(3,Math.floor(at)),f=at-i;
 return stops[i].map((n,c)=>Math.round(n+(stops[i+1][c]-n)*f));
}
export function colorizeDepth(depth){
 const out=new Uint8ClampedArray(depth.length*4);
 for(let i=0;i<depth.length;i++){
  const at=Math.round(Math.max(0,Math.min(1,depth[i]))*255)*3,p=i*4;
  out[p]=PALETTE[at];out[p+1]=PALETTE[at+1];out[p+2]=PALETTE[at+2];out[p+3]=255;
 }
 return out;
}
const PALETTE=Uint8Array.from(Array.from({length:256},(_,i)=>depthColor(i/255)).flat());
export function makeRelief(depth,width,height,rgba){
 if(depth.length!==width*height||rgba.length!==width*height*4)throw new Error('Invalid relief frame');
 const points=[],step=Math.max(1,Math.ceil(Math.sqrt(width*height/9000))),focal=width/(2*Math.tan(55*Math.PI/360));
 for(let y=0;y<height;y+=step)for(let x=0;x<width;x+=step){
  const i=y*width+x,z=1/(.25+depth[i]*.75),p=i*4;
  points.push({x:(x-(width-1)/2)*z/focal,y:-(y-(height-1)/2)*z/focal,z:2-z,color:`rgb(${rgba[p]},${rgba[p+1]},${rgba[p+2]})`});
 }
 return points;
}
export function rotatePoint(point,yaw,pitch){
 const x=point.x*Math.cos(yaw)+point.z*Math.sin(yaw),z=-point.x*Math.sin(yaw)+point.z*Math.cos(yaw);
 return {x,y:point.y*Math.cos(pitch)-z*Math.sin(pitch),z:point.y*Math.sin(pitch)+z*Math.cos(pitch)};
}
