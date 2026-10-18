// Fixed-shape NHWC preprocessing for the validated TFJS graph.
export const TFJS_SIZE=224;
export function letterbox(width,height){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error('Invalid camera size');
 const scale=TFJS_SIZE/Math.max(width,height),w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
 return {x:Math.floor((TFJS_SIZE-w)/2),y:Math.floor((TFJS_SIZE-h)/2),width:w,height:h};
}
function validate(rect){
 if(!rect||!['x','y','width','height'].every(k=>Number.isInteger(rect[k]))||rect.x<0||rect.y<0||rect.width<1||rect.height<1||rect.x+rect.width>TFJS_SIZE||rect.y+rect.height>TFJS_SIZE)throw Error('Invalid letterbox rectangle');
}
export function prepareNHWC(rgba,rect){
 validate(rect);if(rgba.length!==TFJS_SIZE*TFJS_SIZE*4)throw Error('Invalid TFJS frame');
 const out=new Float32Array(TFJS_SIZE*TFJS_SIZE*3),mean=[.485,.456,.406],std=[.229,.224,.225];
 // Zero normalized padding equals ImageNet mean RGB; only the resized view is filled.
 for(let y=rect.y;y<rect.y+rect.height;y++)for(let x=rect.x;x<rect.x+rect.width;x++){
  const i=y*TFJS_SIZE+x;for(let c=0;c<3;c++)out[i*3+c]=(rgba[i*4+c]/255-mean[c])/std[c];
 }
 return out;
}
export function cropOutput(values,rgba,rect){
 validate(rect);if(values.length!==TFJS_SIZE*TFJS_SIZE||rgba.length!==values.length*4)throw Error('Invalid TFJS output');
 const depth=new Float32Array(rect.width*rect.height),pixels=new Uint8ClampedArray(depth.length*4);
 for(let y=0;y<rect.height;y++)for(let x=0;x<rect.width;x++){
  const source=(y+rect.y)*TFJS_SIZE+x+rect.x,target=y*rect.width+x;
  if(!Number.isFinite(values[source]))throw Error('Nonfinite TFJS depth');
  depth[target]=values[source];pixels.set(rgba.subarray(source*4,source*4+4),target*4);
 }
 return {depth,pixels,width:rect.width,height:rect.height};
}
