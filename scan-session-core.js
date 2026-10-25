import {trackMatches as savedMatches} from './scan-session-flow.js?v=1';
import {validateFrame,features,register,compose,point,transform} from './depth-scan-core.js?v=4';
export const LIMIT=12;
export function prepareSavedFrame(f){
 validateFrame(f);if(!f.K||f.tracking?.length!==640*480*4)throw Error('Calibrated RGB and depth are required');
 const values=Array.from(f.raw).filter(x=>x>0).sort((a,b)=>a-b);
 if(!values.length||Math.max(...f.raw)-Math.min(...f.raw)<1e-6)throw Error('Depth has no variation');
 f.range={scale:values[Math.floor(values.length/2)]};f.features=features({width:640,height:480,pixels:f.tracking,descriptorRadius:8,descriptorStep:2,cellSize:40,cellLimit:3,minScore:.002}).map(p=>({...p,x:(p.x+.5)*f.width/640-.5,y:(p.y+.5)*f.height/480-.5}));return f;
}
export function stitchFrames(input,progress=()=>{}){
 if(!input.length||input.length>LIMIT)throw Error('Gather 1–12 frames first');
 const pairs=new Map();
 const frames=input.map(f=>prepareSavedFrame({...f})),placed=[],results=frames.map((_,index)=>({index,ok:false,reason:'Not connected to the anchor'}));
 if(frames.some(f=>JSON.stringify(f.K)!==JSON.stringify(frames[0].K)||f.width!==frames[0].width||f.height!==frames[0].height||f.orientation!==frames[0].orientation))throw Error('Mixed camera geometry in session');
 const anchor=frames.findIndex(f=>f.features.length>=24);if(anchor<0)throw Error('No textured anchor found. Capture a surface with visible detail.');
 frames[anchor].pose={r:[1,0,0,0,1,0,0,0,1],s:1,t:[0,0,0]};frames[anchor].shift=0;placed.push(anchor);results[anchor]={index:anchor,ok:true,anchor:true};
 // Retry unplaced views against up to three nearby placed views. No live capture gate.
 for(let pass=0;pass<2;pass++)for(let i=0;i<frames.length;i++){
  if(results[i].ok)continue;
  const refs=placed.slice().sort((a,b)=>Math.abs(a-i)-Math.abs(b-i)).slice(0,3);
  for(const j of refs){const key=j+':'+i;let r=pairs.get(key);if(!r){r=register(frames[j],frames[i],savedMatches);pairs.set(key,r);}results[i]={index:i,reference:j,ok:false,reason:r.reason,code:r.code,diagnostics:r.diagnostics};
   if(!r.ok)continue;const pose=compose(frames[j].pose,r.pose);if(pose.s<.15||pose.s>6){results[i].reason='Excessive accumulated scale drift';continue;}
   frames[i].pose=pose;frames[i].shift=r.shift;placed.push(i);results[i]={...results[i],ok:true,reason:undefined};break;
  }
  progress({pass:pass+1,index:i,placed:placed.length,total:frames.length});
 }
 // Diagnose adjacent saved views even when neither has a connected global pose.
 for(let i=1;i<frames.length;i++)if(!results[i].ok){
  const key=(i-1)+':'+i;let r=pairs.get(key);if(!r)r=register(frames[i-1],frames[i],savedMatches);
  const d=r.diagnostics;results[i].neighbour={index:i-1,ok:r.ok,code:r.code,diagnostics:d};
  if(d?.matches>=16&&d.coverage){
   results[i].reason=d.rotationSupport>.8&&d.robustRotationErrorPx<.5
    ?'Shared detail found with previous view, but turning explains most motion; reliable 3D translation was not established.'
    :r.ok?'Matches previous view, but that view has no connected pose.':'Shared detail found with previous view, but relative depths did not establish a reliable connected 3D pose.';
  }else if(d)results[i].reason=`Previous view: ${d.matches} matches; ${d.matches<16?'too few reliable matches':'matches cover too little of the image'}. No connected 3D pose.`;
  progress({pass:3,index:i,placed:placed.length,total:frames.length});
 }
 return {frames,results,placed};
}
export function buildRelief(aligned){
 const voxels=new Map();let limited=false;
 for(const i of aligned.placed){const f=aligned.frames[i];for(let y=2;y<f.height-2;y+=3)for(let x=2;x<f.width-2;x+=3){
  const p=point(f,{x,y},f.shift);if(!p)continue;const q=transform(f.pose,p);if(q.some(v=>!Number.isFinite(v)||Math.abs(v)>100))continue;
  const key=q.map(v=>Math.floor(v/.035)).join(',');if(voxels.has(key))continue;if(voxels.size>=32000){limited=true;continue;}
  const n=(y*f.width+x)*4;voxels.set(key,[...q,...f.pixels.slice(n,n+3)]);
 }}
 return {format:'tactical-relief',version:1,units:'arbitrary',views:aligned.placed.length,points:[...voxels.values()],limited};
}
function encode(a){let s='';const b=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(s);}
function decode(s,Type,n){if(typeof s!=='string'||s.length!==4*Math.ceil(n*Type.BYTES_PER_ELEMENT/3))throw Error('Invalid saved buffer');const b=Uint8Array.from(atob(s),c=>c.charCodeAt(0));if(b.length!==n*Type.BYTES_PER_ELEMENT)throw Error('Invalid saved buffer size');return new Type(b.buffer);}
export function saveSession(frames,calibration){return {format:'tactical-gather',version:1,calibration,frames:frames.map(f=>({width:f.width,height:f.height,K:f.K,orientation:f.orientation,capturedAt:f.capturedAt,raw:encode(f.raw),pixels:encode(f.pixels),tracking:encode(f.tracking)}))};}
export function loadSession(s){
 if(s?.format!=='tactical-gather'||s.version!==1||!s.calibration?.inputSha256||!Array.isArray(s.frames)||!s.frames.length||s.frames.length>LIMIT)throw Error('Choose a saved Gather session JSON');
 const frames=s.frames.map(f=>{if(f.width!==224||f.height!==168)throw Error('Unsupported capture size');const n=f.width*f.height,r={...f,raw:decode(f.raw,Float32Array,n),pixels:decode(f.pixels,Uint8ClampedArray,n*4),tracking:decode(f.tracking,Uint8ClampedArray,640*480*4)};validateFrame(r);if(!r.K)throw Error('Missing calibration');return r;});
 return {frames,calibration:s.calibration};
}
