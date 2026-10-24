import test from 'node:test';
import assert from 'node:assert/strict';
import {checkCamera,scaledIntrinsics,undistortionMap,remapRGBA,validateCalibrationSession} from '../depth-calibration-core.js';
import {point,register,ScanMap} from '../depth-scan-core.js';
import {render} from './fixtures/scan-render.mjs';
test('calibration resizes principal point with pixel-centre convention and uses separate focal axes',()=>{
 const K=[500,0,319.5,0,450,239.5,0,0,1],k=scaledIntrinsics(K,224,168);
 assert.equal(k[0],175);assert.equal(k[2],111.5);assert.equal(k[5],83.5);
 const f={width:224,height:168,raw:new Float32Array(224*168).fill(1),range:{scale:1},K:k};
 assert.deepEqual(point(f,{x:112,y:84}),[.5/175,-.5/157.5,1]);
});
test('zero distortion maps interior pixels identically; radial distortion maps independently calculated ray',()=>{
 const k=[100,0,50,0,100,50,0,0,1],map=undistortionMap(k,[.1,0,0,0,0],640,480);
 const i=(50*640+100)*2;assert.ok(Math.abs(map[i]-101.25)<1e-5);assert.equal(map[i+1],50);
 const zero=undistortionMap([640,0,319.5,0,480,239.5,0,0,1],[0,0,0,0,0],64,48),src=new Uint8ClampedArray(64*48*4).map((_,i)=>i%256),out=remapRGBA(src,zero,64,48);
 for(let y=1;y<47;y++)for(let x=1;x<63;x++)for(let c=0;c<3;c++)assert.equal(out[(y*64+x)*4+c],src[(y*64+x)*4+c]);
});
test('camera mismatch fails closed including focus, zoom, orientation and identity',()=>{
 const g={deviceId:'a',facingMode:'environment',focusMode:'manual',resizeMode:'none',zoom:1,focusDistance:3.4,sourceWidth:640,sourceHeight:480,screenAngle:90};
 assert.equal(checkCamera(g,g,640,480,90),true);
 for(const [key,value] of [['deviceId','b'],['focusMode','continuous'],['focusDistance',2],['zoom',2],['resizeMode','crop-and-scale']])assert.throws(()=>checkCamera(g,{...g,[key]:value},640,480,90));
 assert.throws(()=>checkCamera(g,g,480,640,90));assert.throws(()=>checkCamera(g,g,640,480,0));assert.throws(()=>validateCalibrationSession({calibration:{passed:true}}));
});
test('calibrated scan retains translation/rotation guards and rejects changed intrinsics',()=>{
 const k=[224/(2*Math.tan(55*Math.PI/360)),0,83.5,0,224/(2*Math.tan(55*Math.PI/360)),111.5,0,0,1];
 const frame=(tx=0,a=0)=>({...render(tx,a),K:k.slice()});
 const map=new ScanMap();assert.equal(map.add(frame()).ok,true);assert.equal(map.add(frame(.045)).ok,true);
 const saved=JSON.stringify(map.snapshot());assert.equal(map.add({...frame(.09),K:k.map((v,i)=>i===0?v*1.1:v)}).ok,false);assert.equal(JSON.stringify(map.snapshot()),saved);
 const rotations=new ScanMap();rotations.add(frame());assert.equal(rotations.add(frame(0,.035)).ok,false);
});
test('calibrated registration evaluates mixed-axis analytic correspondences without image-only rotation prefilter',()=>{
 const w=224,h=168,K=[150,0,109.2,0,145,81.4,0,0,1];
 const Rx=a=>[1,0,0,0,Math.cos(a),-Math.sin(a),0,Math.sin(a),Math.cos(a)],Ry=a=>[Math.cos(a),0,Math.sin(a),0,1,0,-Math.sin(a),0,Math.cos(a)],Rz=a=>[Math.cos(a),-Math.sin(a),0,Math.sin(a),Math.cos(a),0,0,0,1];
 const dot=(r,p)=>[0,1,2].map(i=>r[i*3]*p[0]+r[i*3+1]*p[1]+r[i*3+2]*p[2]);
 for(const R of [Rx(.035),Ry(.035),Rz(.035)])for(const axis of [0,1,2]){
  const a={width:w,height:h,K,raw:new Float32Array(w*h).fill(1),range:{scale:1},shift:0,features:[]},b={...a,raw:a.raw.slice(),features:[]};
  let n=0;
  for(let y=20;y<150;y+=22)for(let x=20;x<205;x+=24){const z=1+(n%3)*.45,p=[(x-K[2])*z/K[0],-(y-K[5])*z/K[4],z],q=dot(R,p);q[axis]+=.045;
   const u=Math.round(q[0]*K[0]/q[2]+K[2]),v=Math.round(-q[1]*K[4]/q[2]+K[5]);if(u<7||v<7||u>w-7||v>h-7)continue;
   const d=Array.from({length:64},(_,j)=>j===n?8:0);n++;a.features.push({x,y,d});b.features.push({x:u,y:v,d});a.raw[y*w+x]=1/z;b.raw[v*w+u]=1/q[2];
  }
  const result=register(a,b);assert.notEqual(result.code,'rotation-prefilter','calibrated path does not confuse image rotation with unresolved translation');
  if(result.ok){assert.ok(result.reprojection<=1.8);assert.ok(result.error<=.022);assert.ok(result.diagnostics.translationOverDepth>=.008);}
 }
});
test('640px calibrated flow grows accurate three-view maps across affine depth changes and rejects turns',()=>{
 const K=[429.3,0,320.2,0,422.9,245.7,0,0,1],k=scaledIntrinsics(K,224,168);
 const frame=(x=0,a=0,affine=[1,0])=>({...render(x,a,affine,{width:224,height:168,K:k,texture:'noise'}),K:k,tracking:render(x,a,affine,{width:640,height:480,K,texture:'noise'}).pixels});
 for(const affine of [[1,0],[1.4,.3],[.8,-.1]]){
  const map=new ScanMap();let count=0;
  for(const x of [0,.1,.2]){const result=map.add(frame(x,0,x?affine:[1,0]));assert.equal(result.ok,true,JSON.stringify(result));assert.ok(map.voxels.size>count);count=map.voxels.size;
   const t=map.reference.pose.t;assert.ok(Math.hypot(t[0]-x*.25,t[1],t[2])<.005,'known translation in initial depth units recovered');}
  assert.equal(map.views,3);
 }
 for(const a of [-.08,-.04,-.02,.02,.04,.08])for(const affine of [[1,0],[1.4,.3]]){const map=new ScanMap();map.add(frame());const before=JSON.stringify(map.snapshot());assert.equal(map.add(frame(0,a,affine)).ok,false);assert.equal(JSON.stringify(map.snapshot()),before);}
});
test('repetitive-texture cases that produced false low-resolution motion remain unfused',()=>{
 const K=[429.3,0,320.2,0,422.9,245.7,0,0,1],k=scaledIntrinsics(K,224,168),frame=(x,a)=>({...render(x,a,[1,0],{width:224,height:168,K:k}),K:k,tracking:render(x,a,[1,0],{width:640,height:480,K}).pixels});
 for(const [x,a] of [[.025,0],[.05,0],[.075,0],[0,-.04],[0,-.02],[0,.02]]){const map=new ScanMap();map.add(frame(0,0));const before=JSON.stringify(map.snapshot());assert.equal(map.add(frame(x,a)).ok,false);assert.equal(JSON.stringify(map.snapshot()),before);}
});
