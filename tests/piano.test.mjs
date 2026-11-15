import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {frequency,noteName,isBlack,keyboardLayout} from '../piano-core.mjs';

test('concert pitch, middle C and octave ratios',()=>{
  assert.equal(frequency(69),440);
  assert.ok(Math.abs(frequency(60)-261.625565)<.000001);
  assert.equal(noteName(60),'C4');assert.equal(noteName(71),'B4');
  for(let midi=24;midi<=84;midi++)assert.ok(Math.abs(frequency(midi+12)/frequency(midi)-2)<1e-12);
});
test('all octave windows have correct 2/3 black key groups and full white coverage',()=>{
  for(let start=24;start<=72;start+=12){
    const keys=keyboardLayout(start);
    assert.equal(keys.length,25);assert.equal(keys.filter(k=>k.black).length,10);
    assert.deepEqual(keys.filter(k=>k.black).map(k=>k.midi-start),[1,3,6,8,10,13,15,18,20,22]);
    assert.equal(keys[0].left,0);assert.ok(Math.abs(keys.at(-1).left+keys.at(-1).width-100)<1e-10);
    for(const key of keys){assert.ok(key.left>=0 && key.left+key.width<=100+1e-10);assert.equal(key.black,isBlack(key.midi));}
  }
});

function harness(){
  const nodes=new Map();
  function element(){return {dataset:{},style:{},classList:{toggle(){}},children:[],value:'65',append(n){this.children.push(n);},replaceChildren(){this.children=[];},querySelectorAll(){return this.children;},setAttribute(){},addEventListener(){}};}
  const document={body:element(),getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element,addEventListener(){}};
  const oscillators=[];
  function param(){return {value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelAndHoldAtTime(){},setTargetAtTime(){}};}
  function node(){return {gain:param(),frequency:param(),threshold:param(),knee:param(),ratio:param(),connect(){},disconnect(){}};}
  class AudioContext{
    currentTime=0;state='running';destination={};
    createGain=node;createBiquadFilter=node;createDynamicsCompressor=node;
    createPeriodicWave(){return {};}
    createOscillator(){const n={...node(),setPeriodicWave(){},start(){},stop(t){this.stopTime=t;}};oscillators.push(n);return n;}
  }
  const scope=vm.createContext({document,window:{AudioContext,addEventListener(){}},localStorage:{getItem(){}},frequency,noteName,keyboardLayout,setTimeout});
  vm.runInContext(readFileSync(new URL('../piano.js',import.meta.url),'utf8').replace(/^import .*\n/,''),scope);
  return {run:code=>vm.runInContext(code,scope),oscillators};
}
test('independent fingers, chords, glissando and sustain release without stuck notes',()=>{
  const h=harness();
  h.run('down(1,60);down(2,64);down(3,67)');
  assert.equal(h.run('held.size'),3);
  assert.deepEqual(h.oscillators.map(o=>o.frequency.value),[60,64,67].map(frequency));
  h.run('up(2)');assert.equal(h.oscillators[1].stopTime,.5);assert.equal(h.run('held.size'),2);
  h.run('down(1,62)');assert.equal(h.oscillators[0].stopTime,.5);assert.equal(h.run('held.get(1).midi'),62);
  h.run('sustain=true;up(3)');assert.equal(h.oscillators[2].stopTime,13);
  h.run('sustain=false;pedal()');assert.equal(h.oscillators[2].stopTime,.5);
  h.run('silence()');assert.equal(h.run('held.size'),0);assert.equal(h.run('[...voices].every(v=>v.released)'),true);
});
test('two fingers on one key release independently, octave changes silence voices',()=>{
  const h=harness();h.run('down(1,69);down(2,69);up(1)');
  assert.equal(h.run('held.size'),1);assert.equal(h.oscillators[1].stopTime,13);
  h.run('start+=12;render()');assert.equal(h.run('held.size'),0);assert.equal(h.oscillators[1].stopTime,.05);
});
