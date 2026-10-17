import test from 'node:test';
import assert from 'node:assert/strict';
class Element {
 constructor(){this.handlers={};this.value='';this.disabled=false;this.hidden=false;this.style={};this.dataset={};this.children=[];this.attributes={};this.textContent='';}
 addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);}
 async fire(type,event={}){for(const fn of this.handlers[type]||[])await fn(event);}
 append(child){this.children.push(child);}
 replaceChildren(){this.children=[];}
 setAttribute(name,value){this.attributes[name]=value;}
 getBoundingClientRect(){return {left:0,top:0,width:400,height:600};}
}
test('camera start, detection, lock, hidden-page cleanup, and cancelled permission request',async()=>{
 const ids='video overlay viewfinder start stop camera-facing unlock status model-status confidence confidence-value placeholder lock-readout exit-marker rate objects'.split(' ');
 const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
 elements.confidence.value='45';elements['camera-facing'].value='environment';
 const context=new Proxy({measureText:t=>({width:t.length*7}),getImageData:(x,y,w,h)=>({data:Uint8ClampedArray.from({length:w*h*4},(_,i)=>i%4===3?255:((Math.floor(i/4)*13)%251))})},{get:(o,k)=>o[k]||(()=>{})});
 elements.overlay.getContext=()=>context;
 elements.viewfinder.clientWidth=400;elements.viewfinder.clientHeight=600;
 elements.video.videoWidth=1280;elements.video.videoHeight=720;elements.video.readyState=2;elements.video.currentTime=1;elements.video.play=async()=>{};
 const doc=new Element();doc.hidden=false;doc.body=new Element();doc.getElementById=id=>elements[id];doc.querySelector=()=>new Element();
 doc.createElement=tag=>{const el=new Element();if(tag==='canvas')el.getContext=()=>context;return el;};
 globalThis.document=doc;globalThis.window=new Element();globalThis.localStorage={getItem:()=>null};
 globalThis.getComputedStyle=()=>({getPropertyValue:name=>name==='--accent'?'#a5edb4':'#dfbc7d'});
 globalThis.devicePixelRatio=1;globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
 let stopped=0;const track=new Element();track.stop=()=>stopped++;
 const media={getTracks:()=>[track],getVideoTracks:()=>[track]};
 Object.defineProperty(globalThis,'navigator',{value:{mediaDevices:{getUserMedia:async()=>media}},configurable:true});
 let worker;
 globalThis.Worker=class {constructor(){worker=this;this.messages=[];}postMessage(m){this.messages.push(m);}terminate(){this.terminated=true;}};
 await import('../camera.js');
 await elements.start.fire('click');assert.equal(elements.placeholder.hidden,true);assert.equal(worker.messages[0].type,'init');
 worker.onmessage({data:{type:'ready'}});
 await new Promise(resolve=>setTimeout(resolve,120));
 assert.equal(worker.messages.filter(m=>m.type==='frame').length,1);
 // Deliver one inference result without relying on real hardware or network.
 worker.onmessage({data:{type:'detections',generation:1,width:640,height:360,ms:100,output:new Float32Array([200,100,400,240,.9,41]).buffer}});
 assert.equal(elements.objects.children.length,1);
 await elements.objects.children[0].fire('click');assert.match(elements['lock-readout'].textContent,/CUP/);assert.equal(elements.unlock.disabled,false);
 const paused=worker;assert.equal(paused.terminated,true);
 await new Promise(resolve=>setTimeout(resolve,120));
 assert.equal(paused.messages.filter(m=>m.type==='frame').length,1,'no YOLO frames during lock');
 paused.onmessage({data:{type:'error',message:'late result'}});
 assert.match(elements['lock-readout'].textContent,/CUP/,'late detector events ignored');
 await elements.unlock.fire('click');
 assert.notEqual(worker,paused);assert.equal(worker.messages[0].type,'init','release restarts detection');
 doc.hidden=true;await doc.fire('visibilitychange');assert.equal(stopped,1);assert.equal(worker.terminated,true);assert.equal(elements.video.srcObject,null);assert.equal(elements.start.disabled,false);
 // Stop while the permission dialog is pending: the late stream must also close.
 doc.hidden=false;let resolvePermission;navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{resolvePermission=resolve;});
 const opening=elements.start.fire('click');await elements.stop.fire('click');resolvePermission(media);await opening;
 assert.equal(stopped,2);assert.equal(elements.video.srcObject,null);
});
