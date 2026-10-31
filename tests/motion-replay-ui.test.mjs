// Controlled DOM/animation API tests, not physical tracking or browser rendering evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const sample=(t,x=0)=>({t,x,y:0,z:0,q:[0,0,0,1],segment:0});
const fileData=samples=>({format:'tactical-motion-1',units:'metres',referenceSpace:'local',samples});
class Events{handlers={};addEventListener(n,f){(this.handlers[n]??=[]).push(f);}async emit(n){for(const f of this.handlers[n]||[])await f();}}
async function setup(){
 const nodes=new Map(),canvas=new Proxy({},{get:()=>()=>{}});let busy=false,samples=[sample(0),sample(100,.1),sample(200,.2)],next=0;
 const frames=new Map(),document=new Events();document.hidden=false;document.getElementById=id=>{if(!nodes.has(id)){const n=new Events();n.value=id==='replay-rate'?'1':'0';n.getContext=()=>canvas;n.click=()=>{};n.replaceChildren=(...options)=>{n.options=options;};nodes.set(id,n);}return nodes.get(id);};
 document.createElement=()=>({});
 const context=vm.createContext({document,window:new Events(),requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},cancelAnimationFrame:id=>frames.delete(id)});
 const core=new vm.SourceTextModule(await readFile(new URL('../motion-replay-core.mjs',import.meta.url),'utf8'),{context});
 const pathModule=new vm.SourceTextModule(await readFile(new URL('../motion-path.mjs',import.meta.url),'utf8'),{context});await core.link(()=>pathModule);
 const ui=new vm.SourceTextModule(await readFile(new URL('../motion-replay.js',import.meta.url),'utf8'),{context});const view=new vm.SourceTextModule(await readFile(new URL('../motion-replay-view.mjs',import.meta.url),'utf8'),{context});
 await view.link(()=>core);const orbit=new vm.SourceTextModule(await readFile(new URL('../motion-replay-orbit.mjs',import.meta.url),'utf8'),{context});
 const headingModule=new vm.SourceTextModule(await readFile(new URL('../motion-heading.mjs',import.meta.url),'utf8'),{context});await headingModule.link(spec=>spec.includes('motion-path')?pathModule:core);
 await ui.link(spec=>spec.includes('motion-heading')?headingModule:spec.includes('motion-replay-view')?view:spec.includes('motion-replay-orbit')?orbit:spec.includes('motion-path')?pathModule:core);await ui.evaluate();
 const api=ui.namespace.createMotionReplay({getSamples:()=>samples,isBusy:()=>busy});
 return{nodes,api,document,busy:value=>{busy=value;api.update();},samples:value=>samples=value,click:id=>nodes.get(id).emit('click'),tick:time=>{const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn(time);},frames,
 load:async(text,size=100)=>{nodes.get('replay-file').files=[{name:'capture.json',size,text:async()=>text}];await nodes.get('replay-file').emit('change');}};
}
test('current recording, play/pause, scrub, speed, rewind and end',async()=>{
 const h=await setup();await h.click('replay-current');assert.match(h.nodes.get('replay-status').textContent,/3 samples/);
 assert.equal(h.nodes.get('replay-speed-value').textContent,'1.00 m/s');
 await h.click('replay-play');h.tick(0);h.tick(50);assert.equal(h.nodes.get('replay-time').value,'50');
 await h.click('replay-play');assert.equal(h.frames.size,0);
 h.nodes.get('replay-time').value='100';await h.nodes.get('replay-time').emit('input');assert.match(h.nodes.get('replay-position').textContent,/X 0.10/);
 h.nodes.get('replay-rate').value='2';await h.click('replay-play');h.tick(1000);h.tick(1050);assert.equal(h.nodes.get('replay-time').value,'200');assert.equal(h.nodes.get('replay-play').textContent,'Play');assert.equal(h.nodes.get('replay-speed-value').textContent,'1.00 m/s');
 await h.click('replay-rewind');assert.equal(h.nodes.get('replay-time').value,'0');
});
test('JSON loading rejects malformed/oversize files without replacing valid replay',async()=>{
 const h=await setup();await h.load(JSON.stringify(fileData([sample(2000),sample(2100,.3)])));assert.equal(h.nodes.get('replay-speed-value').textContent,'3.00 m/s');assert.match(h.nodes.get('replay-vector').textContent,/capped/);
 await h.load('bad JSON');assert.match(h.nodes.get('replay-status').textContent,/Could not load/);assert.equal(h.nodes.get('replay-play').disabled,false);
 await h.load('{}',21*1024*1024);assert.match(h.nodes.get('replay-status').textContent,/too large/);
});
test('camera activity and hidden page stop playback; replay is independent of live samples',async()=>{
 const h=await setup();await h.click('replay-current');h.samples([]);h.api.update();assert.equal(h.nodes.get('replay-current').disabled,true);
 await h.click('replay-play');h.busy(true);assert.equal(h.frames.size,0);assert.equal(h.nodes.get('replay-load').disabled,true);h.busy(false);
 await h.click('replay-play');h.document.hidden=true;await h.document.emit('visibilitychange');assert.equal(h.frames.size,0);
});
test('gap shows unavailable pose and velocity; a single frame is inspectable without play',async()=>{
 const h=await setup();await h.load(JSON.stringify(fileData([sample(0),{...sample(100,5),segment:1}])));
 h.nodes.get('replay-time').value='50';await h.nodes.get('replay-time').emit('input');assert.equal(h.nodes.get('replay-position').textContent,'Tracking gap');assert.equal(h.nodes.get('replay-speed-value').textContent,'Unavailable');
 await h.load(JSON.stringify(fileData([sample(500)])));assert.equal(h.nodes.get('replay-play').disabled,true);assert.equal(h.nodes.get('replay-rewind').disabled,false);
});
test('camera zoom/reset during playback keeps time, physical speed and distances intact',async()=>{
 const h=await setup();await h.click('replay-current');await h.click('replay-play');h.tick(0);h.tick(50);
 const speed=h.nodes.get('replay-speed-value').textContent,distance=h.nodes.get('replay-travelled').textContent;
 await h.click('replay-view-in');assert.match(h.nodes.get('replay-view-status').textContent,/1.20/);assert.equal(h.nodes.get('replay-play').textContent,'Pause');assert.equal(h.nodes.get('replay-time').value,'50');
 assert.equal(h.nodes.get('replay-speed-value').textContent,speed);assert.equal(h.nodes.get('replay-travelled').textContent,distance);
 await h.click('replay-view-reset');assert.match(h.nodes.get('replay-view-status').textContent,/1.00/);h.tick(100);assert.equal(h.nodes.get('replay-time').value,'100');
});

test('imports full 36k JSON and preserves final timestamp and exact travelled distance',async()=>{
 const h=await setup(),samples=Array.from({length:36000},(_,i)=>sample(i*100,i*.01));
 await h.load(JSON.stringify(fileData(samples)),8*1024*1024);
 assert.equal(h.nodes.get('replay-time').max,'3599900');
 h.nodes.get('replay-time').value='3599900';await h.nodes.get('replay-time').emit('input');
 assert.equal(h.nodes.get('replay-travelled').textContent,'359.99 / 359.99 m');
 assert.equal(h.nodes.get('replay-position').textContent,'X 359.99 · Y 0.00 · Z 0.00 m');
});
test('legacy JSON shows quality warnings and excludes suspect jump from replay metrics',async()=>{
 const h=await setup();await h.load(JSON.stringify(fileData([sample(0),sample(100,.1),sample(130,1.6),sample(230,1.7)])));
 assert.match(h.nodes.get('replay-quality').textContent,/1 suspected position jump/);
 h.nodes.get('replay-time').value='115';await h.nodes.get('replay-time').emit('input');assert.equal(h.nodes.get('replay-speed-value').textContent,'Unavailable');
 h.nodes.get('replay-time').value='230';await h.nodes.get('replay-time').emit('input');
 assert.equal(h.nodes.get('replay-travelled').textContent,'0.20 / 0.20 m');assert.equal(h.nodes.get('replay-displacement').textContent,'1.70 m');
 await h.load(JSON.stringify(fileData([sample(0),sample(100,.1)])));assert.match(h.nodes.get('replay-quality').textContent,/No abrupt jumps detected/);
});
test('heading correction aligns selected gap, toggles original, undoes and resets on new recording',async()=>{
 const h=await setup();const raw=[sample(0),sample(100,.1),{...sample(500,.2),segment:1,q:[0,Math.SQRT1_2,0,Math.SQRT1_2]},{...sample(600,.1),segment:1,q:[0,Math.SQRT1_2,0,Math.SQRT1_2]}];
 const before=JSON.stringify(raw);h.samples(raw);await h.click('replay-current');assert.equal(h.nodes.get('replay-gap').options.length,1);assert.match(h.nodes.get('replay-alignment-status').textContent,/Original/);
 h.nodes.get('replay-time').value='600';await h.nodes.get('replay-time').emit('input');const position=h.nodes.get('replay-position').textContent,distance=h.nodes.get('replay-travelled').textContent;
 await h.click('replay-play');await h.click('replay-align');assert.equal(h.nodes.get('replay-play').textContent,'Play');assert.equal(h.frames.size,0);assert.match(h.nodes.get('replay-alignment-status').textContent,/Corrected preview/);
 h.nodes.get('replay-time').value='600';await h.nodes.get('replay-time').emit('input');assert.match(h.nodes.get('replay-position').textContent,/X 0.20.*Z -0.10/);assert.equal(h.nodes.get('replay-travelled').textContent,distance);assert.equal(JSON.stringify(raw),before);
 await h.click('replay-align-toggle');assert.equal(h.nodes.get('replay-position').textContent,position);assert.match(h.nodes.get('replay-alignment-status').textContent,/Original/);
 await h.click('replay-align-toggle');assert.match(h.nodes.get('replay-alignment-status').textContent,/Corrected/);
 await h.click('replay-align-undo');assert.equal(h.nodes.get('replay-position').textContent,position);assert.equal(h.nodes.get('replay-align-toggle').disabled,true);
 await h.click('replay-align');await h.load(JSON.stringify(fileData([sample(0),sample(100,.1)])));assert.equal(h.nodes.get('replay-align').disabled,true);assert.match(h.nodes.get('replay-alignment-status').textContent,/no tracking gaps/);
});
test('heading controls disable while camera is active and when heading is vertical',async()=>{
 const h=await setup();await h.load(JSON.stringify(fileData([sample(0),{...sample(100,.1),segment:1}])));
 h.busy(true);assert.equal(h.nodes.get('replay-align').disabled,true);await h.click('replay-align');assert.match(h.nodes.get('replay-alignment-status').textContent,/Original/);
 h.busy(false);assert.equal(h.nodes.get('replay-align').disabled,false);
 await h.load(JSON.stringify(fileData([sample(0),{...sample(100,.1),segment:1,q:[Math.SQRT1_2,0,0,Math.SQRT1_2]}])));assert.equal(h.nodes.get('replay-align').disabled,true);assert.match(h.nodes.get('replay-gap').options[0].textContent,/unavailable/);
});
