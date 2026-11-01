import {viewFor,hitPlane,imageSize} from './ripple-core.mjs?v=1';
const $ = id => document.getElementById(id);
const canvas=$('water'),stage=$('water-stage'),status=$('status');
const vertex = `
precision highp float;
attribute vec2 aPosition;
uniform mediump vec2 uSize;
uniform vec4 uRotation;
uniform vec4 uCamera;
uniform vec4 uDrops[24];
uniform float uTime;
varying mediump vec2 vUV;
varying mediump vec3 vNormal;
void main(){
 vec2 p=aPosition*uSize; float h=0.; vec2 slope=vec2(0.);
 for(int i=0;i<24;i++){
  float age=uTime-uDrops[i].z;
  if(age>=0. && age<6.){
   vec2 delta=p-uDrops[i].xy; float d=length(delta); float q=d-age*.65;
   float envelope=exp(-q*q/0.035)*exp(-age*.8)*smoothstep(0.,.12,age)*uDrops[i].w;
   h+=cos(q*32.)*envelope;
   float derivative=envelope*(-32.*sin(q*32.)-2.*q/.035*cos(q*32.));
   slope+=delta/max(d,.001)*derivative;
  }
 }
 h*=.035; slope*=.035;
 float c=uRotation.x,s=uRotation.y,ct=uRotation.z,st=uRotation.w;
 vec3 pos=vec3(c*p.x-s*p.y,ct*(s*p.x+c*p.y)-st*h,st*(s*p.x+c*p.y)+ct*h);
 float depth=uCamera.z-pos.z;
 gl_Position=vec4(pos.x*uCamera.x/uCamera.y,pos.y*uCamera.x,depth*.5,depth);
 vUV=aPosition+vec2(.5); vNormal=normalize(vec3(-slope,1.));
}`;
const fragment = `
precision mediump float;
uniform sampler2D uImage;
uniform mediump vec2 uSize;
varying mediump vec2 vUV;
varying mediump vec3 vNormal;
void main(){
 vec3 n=normalize(vNormal);
 vec2 uv=clamp(vUV+n.xy*.055/uSize,vec2(.001),vec2(.999));
 vec3 color=texture2D(uImage,uv).rgb;
 float light=dot(n,normalize(vec3(-.3,.5,1.)));
 float base=dot(vec3(0.,0.,1.),normalize(vec3(-.3,.5,1.)));
 float shine=pow(max(dot(n,normalize(vec3(-.25,.4,1.))),0.),42.);
 color*=1.+(light-base)*.65;
 color+=vec3(.7,.9,1.)*shine*.24;
 gl_FragColor=vec4(color,1.);
}`;
let gl,program,texture,uniforms,indices,view,size=[3,2],drops=[],time=0,previous=0,frame=0,paused=false,lost=false,nextRain=0,imageRevision=0;
const pointers=new Map();
function report(message){status.textContent=message;}
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function init(){
 gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:false,preserveDrawingBuffer:false});
 if(!gl)throw Error('WebGL is unavailable. Enable hardware acceleration or try another browser.');
 program=gl.createProgram();const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(program);
 const vertices=[],faces=[],n=96;
 for(let y=0;y<=n;y++)for(let x=0;x<=n;x++)vertices.push(x/n-.5,y/n-.5);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const a=y*(n+1)+x,b=a+n+1;faces.push(a,a+1,b,a+1,b+1,b);}
 const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
 const a=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
 const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(faces),gl.STATIC_DRAW);indices=faces.length;
 uniforms={};for(const name of ['uSize','uRotation','uCamera','uDrops[0]','uTime','uImage'])uniforms[name]=gl.getUniformLocation(program,name);
 texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.uniform1i(uniforms.uImage,0);
}
function upload(image){
 const max=Math.min(2048,gl.getParameter(gl.MAX_TEXTURE_SIZE)),w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;
 if(!w||!h)throw Error('This image has no readable dimensions.');
 const scale=Math.min(1,max/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));c.getContext('2d').drawImage(image,0,0,c.width,c.height);
 gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
 size=imageSize(w,h);drops=[];resize();
}
function demo(){
 imageRevision++;
 const c=document.createElement('canvas');c.width=1200;c.height=800;const ctx=c.getContext('2d');
 const g=ctx.createLinearGradient(0,0,1200,800);g.addColorStop(0,'#134f60');g.addColorStop(.55,'#65bda9');g.addColorStop(1,'#e6cf95');ctx.fillStyle=g;ctx.fillRect(0,0,1200,800);
 for(let y=0;y<800;y+=80)for(let x=0;x<1200;x+=80){ctx.fillStyle=(x+y)%160?'#ffffff18':'#092b3925';ctx.fillRect(x+2,y+2,76,76);}
 ctx.fillStyle='#f4ead2';ctx.beginPath();ctx.arc(840,240,135,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#124856';ctx.font='700 90px system-ui';ctx.fillText('TOUCH',90,380);ctx.fillText('THE WATER',90,485);
 ctx.font='28px system-ui';ctx.fillText('Or load your own photograph',96,550);
 upload(c);report('Demo ready. Tap or drag the image. Your photos stay on this device.');
}
function resize(){
 if(!gl||lost)return;
 const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);
 canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));gl.viewport(0,0,canvas.width,canvas.height);
 view=viewFor(...size,canvas.width/canvas.height,+$('tilt').value,+$('yaw').value);
}
function addDrop(p){if(!p||paused||lost)return;drops.push([p[0],p[1],time,+$('strength').value/60]);if(drops.length>24)drops.shift();}
function touch(event,force=false){
 const r=canvas.getBoundingClientRect(),p=hitPlane(view,(event.clientX-r.left)/r.width*2-1,1-(event.clientY-r.top)/r.height*2);
 const last=pointers.get(event.pointerId);
 if(force||!last||time-last>=.065){addDrop(p);pointers.set(event.pointerId,time);}
}
const data=new Float32Array(96);
function draw(now){
 frame=0;if(document.hidden||lost)return;
 const dt=previous?Math.min((now-previous)/1000,.05):0;previous=now;
 if(!paused)time+=dt;
 if($('rain').checked&&!paused&&time>=nextRain){addDrop([(Math.random()-.5)*size[0],(Math.random()-.5)*size[1]]);nextRain=time+.32;}
 drops=drops.filter(d=>time-d[2]<6);
 data.fill(0);for(let i=0;i<24;i++)data[i*4+2]=-100;drops.forEach((d,i)=>data.set(d,i*4));
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform2f(uniforms.uSize,...size);gl.uniform4f(uniforms.uRotation,view.c,view.s,view.ct,view.st);gl.uniform4f(uniforms.uCamera,view.f,view.aspect,view.distance,0);gl.uniform1f(uniforms.uTime,time);gl.uniform4fv(uniforms['uDrops[0]'],data);gl.drawElements(gl.TRIANGLES,indices,gl.UNSIGNED_SHORT,0);
 frame=requestAnimationFrame(draw);
}
function start(){if(!frame&&!lost&&!document.hidden){previous=0;frame=requestAnimationFrame(draw);}}
function fullscreenLabel(){$('fullscreen').textContent=document.fullscreenElement||stage.classList.contains('expanded')?'Exit full screen':'Full screen';resize();}
async function fullscreen(){
 if(document.fullscreenElement){await document.exitFullscreen();return;}
 if(stage.classList.contains('expanded')){stage.classList.remove('expanded');document.body.classList.remove('water-expanded');fullscreenLabel();return;}
 try{if(!stage.requestFullscreen)throw Error();await stage.requestFullscreen();}catch{stage.classList.add('expanded');document.body.classList.add('water-expanded');fullscreenLabel();}
}
try{
 init();demo();new ResizeObserver(resize).observe(stage);start();
 $('load').onclick=()=>$('image-file').click();
 $('image-file').onchange=async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;
  const revision=++imageRevision;
  if(file.size>40*1024*1024){report('Choose an image smaller than 40 MB.');return;}
  const url=URL.createObjectURL(file),image=new Image();report('Opening image…');
  try{image.src=url;await image.decode();if(revision!==imageRevision||lost)return;upload(image);report(`${file.name} · ${image.naturalWidth} × ${image.naturalHeight} · Tap or drag to ripple.`);}catch{if(revision===imageRevision)report('Could not read this image. Try a JPEG, PNG or WebP photograph.');}finally{URL.revokeObjectURL(url);}
 };
 $('demo').onclick=demo;$('clear').onclick=()=>{drops=[];$('rain').checked=false;};
 $('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause';$('pause').setAttribute('aria-pressed',String(paused));};
 for(const id of ['tilt','yaw','strength'])$(id).oninput=()=>{$(`${id}-value`).value=$(id).value+(id==='strength'?'%':'°');resize();};
 $('reset').onclick=()=>{$('tilt').value=45;$('yaw').value=0;$('tilt-value').value='45°';$('yaw-value').value='0°';resize();};
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;canvas.setPointerCapture(e.pointerId);touch(e,true);});
 canvas.addEventListener('pointermove',e=>{if(pointers.has(e.pointerId))touch(e);});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>pointers.delete(e.pointerId));
 canvas.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();addDrop([0,0]);}});
 $('fullscreen').onclick=()=>fullscreen().catch(()=>report('Full screen is unavailable.'));
 document.addEventListener('fullscreenchange',fullscreenLabel);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&stage.classList.contains('expanded'))fullscreen();});
 document.addEventListener('visibilitychange',()=>{pointers.clear();if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;pointers.clear();});window.addEventListener('pageshow',start);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;report('Graphics context interrupted. Restore graphics by reloading this page and loading your image again.');});
}catch(error){report(`Water renderer could not start: ${error.message}`);for(const el of document.querySelectorAll('button,input'))el.disabled=true;}
