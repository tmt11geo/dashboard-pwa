import test from 'node:test';
import assert from 'node:assert/strict';
import {Metronome} from '../piano-metronome.mjs';
function setup(){
  const sounds=[], timers=new Map();let nextId=0;
  const context={currentTime:0,createOscillator(){const o={frequency:{},connect(){},disconnect(){},start(t){this.startTime=t;},stop(t){this.stopTime=t;}};sounds.push(o);return o;},createGain(){return {connect(){},disconnect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}}};}};
  const clock={setInterval(fn){timers.set(++nextId,fn);return nextId;},clearInterval(id){timers.delete(id);}};
  return {context,sounds,timers,metro:new Metronome(context,{},clock)};
}
test('audio-clock intervals remain exact despite timer jitter',()=>{
  const h=setup();h.metro.start();
  for(const t of [.46,.98,1.47,1.96]){h.context.currentTime=t;h.metro.schedule();}
  assert.equal(h.sounds.length,5);
  h.sounds.forEach((sound,i)=>assert.ok(Math.abs(sound.startTime-(.03+i*.5))<1e-10));
  h.metro.start();assert.equal(h.timers.size,1);
});
test('tempo validation, live speed changes and pending click cancellation',()=>{
  const h=setup();
  for(const bpm of [0,29,241,NaN,Infinity,120.5])assert.equal(h.metro.setTempo(bpm),false);
  assert.equal(h.metro.bpm,120);h.metro.start();h.context.currentTime=.01;
  assert.equal(h.metro.setTempo(240),true);assert.equal(h.sounds[0].stopTime,.01);
  h.context.currentTime=.24;h.metro.schedule();
  assert.ok(Math.abs(h.sounds[2].startTime-h.sounds[1].startTime-.25)<1e-10);
  h.metro.stop();assert.equal(h.timers.size,0);assert.equal(h.metro.clicks.size,0);
  assert.equal(h.sounds.at(-1).stopTime,.24);
  const n=h.sounds.length;h.metro.schedule();assert.equal(h.sounds.length,n);
});
test('scheduler skips missed beats after a stall instead of emitting a burst',()=>{
  const h=setup();h.metro.setTempo(30);h.metro.start();h.context.currentTime=20;h.metro.schedule();
  assert.equal(h.sounds.length,2);assert.equal(h.sounds[1].startTime,20.03);
});
