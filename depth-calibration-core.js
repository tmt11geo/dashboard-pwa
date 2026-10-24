// Camera geometry contract and Brown–Conrady inverse image mapping.
export function validateCalibrationSession(s){
 if(s?.format!=='tactical-camera-calibration'||s.version!==1||s.board?.columns!==9||s.board?.rows!==7||s.board?.squareMetres!==.018)throw Error('Choose a Tactical calibration session JSON.');
 const g=s.metadata?.geometry;
 if(!g||g.outputWidth!==640||g.outputHeight!==480||g.mirrored||g.rotation!==0||!g.deviceId||g.facingMode!=='environment'||!s.metadata.focusLock?.locked||g.focusMode!=='manual')throw Error('Calibration needs a rear camera with locked focus and unmirrored 640 × 480 images.');
 if(![g.sourceWidth,g.sourceHeight,g.screenAngle,g.zoom,g.focusDistance,g.crop?.x,g.crop?.y,g.crop?.width,g.crop?.height].every(Number.isFinite)||g.sourceWidth<32||g.sourceHeight<32||g.crop.x<0||g.crop.y<0||g.crop.width<=0||g.crop.height<=0||g.crop.x+g.crop.width>g.sourceWidth||g.crop.y+g.crop.height>g.sourceHeight)throw Error('Invalid calibration geometry.');
 const views=s.observations;if(!Array.isArray(views)||views.length<16||views.length>24)throw Error('Calibration needs 16–24 saved views.');
 if(views.some(v=>JSON.stringify(v.geometry)!==JSON.stringify(g)||v.points?.length!==126||!v.points.every(Number.isFinite)||typeof v.image!=='string'||!v.image.startsWith('data:image/png;base64,')||v.image.length>4000000))throw Error('Calibration observations are incomplete or have mixed settings.');
 return g;
}
export function checkCamera(g,s,width,height,angle){
 const mismatches=[];
 for(const key of ['deviceId','facingMode','focusMode','resizeMode'])if((s[key]??null)!==(g[key]??null))mismatches.push(key);
 for(const key of ['zoom','focusDistance'])if(!Number.isFinite(s[key])||Math.abs(s[key]-g[key])>Math.max(.0001,Math.abs(g[key])*.001))mismatches.push(key);
 if(width!==g.sourceWidth||height!==g.sourceHeight)mismatches.push('image size');
 if(angle!==g.screenAngle)mismatches.push('phone orientation');
 if(mismatches.length)throw Error('Camera differs from calibration ('+mismatches.join(', ')+'). Keep landscape orientation and use the calibrated camera/settings.');
 return true;
}
export function scaledIntrinsics(K,w,h){return [K[0]*w/640,0,(K[2]+.5)*w/640-.5,0,K[4]*h/480,(K[5]+.5)*h/480-.5,0,0,1];}
export function undistortionMap(K,D,w,h){
 if(K?.length!==9||D?.length!==5||![...K,...D].every(Number.isFinite)||K[0]<=0||K[4]<=0)throw Error('Invalid calibration coefficients.');
 const k=scaledIntrinsics(K,w,h),map=new Float32Array(w*h*2),[k1,k2,p1,p2,k3]=D;
 for(let v=0;v<h;v++)for(let u=0;u<w;u++){
  const x=(u-k[2])/k[0],y=(v-k[5])/k[4],r=x*x+y*y,rad=1+k1*r+k2*r*r+k3*r*r*r,i=(v*w+u)*2;
  map[i]=(x*rad+2*p1*x*y+p2*(r+2*x*x))*k[0]+k[2];map[i+1]=(y*rad+p1*(r+2*y*y)+2*p2*x*y)*k[4]+k[5];
 }return map;
}
export function remapRGBA(src,map,w,h){
 if(src.length!==w*h*4||map.length!==w*h*2)throw Error('Invalid undistortion buffers');
 const out=new Uint8ClampedArray(src.length);
 for(let i=0;i<w*h;i++){const x=map[i*2],y=map[i*2+1],a=Math.floor(x),b=Math.floor(y);if(a<0||b<0||a>=w-1||b>=h-1){out[i*4+3]=255;continue;}const dx=x-a,dy=y-b;
  for(let c=0;c<3;c++)out[i*4+c]=(src[(b*w+a)*4+c]*(1-dx)+src[(b*w+a+1)*4+c]*dx)*(1-dy)+(src[((b+1)*w+a)*4+c]*(1-dx)+src[((b+1)*w+a+1)*4+c]*dx)*dy;out[i*4+3]=255;
 }return out;
}
