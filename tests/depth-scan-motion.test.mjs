import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateMovement} from '../depth-scan-motion.js';
const size=72;
let seed=7;const source=Float32Array.from({length:size*size},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;});
function shift(dx,dy,brightness=0){return Float32Array.from(source,(_,i)=>{const x=i%size-dx,y=Math.floor(i/size)-dy;return x>=0&&x<size&&y>=0&&y<size?source[y*size+x]+brightness:0;});}
test('first view and unchanged image guide correctly',()=>{
 assert.equal(estimateMovement(null,source).state,'first');
 assert.equal(estimateMovement(source,source).state,'more');
 assert.equal(estimateMovement(source,source).progress,0);
});
test('measures signed image movement and target range despite exposure offset',()=>{
 const r=estimateMovement(source,shift(-6,0,.1));assert.equal(r.state,'ready');assert.equal(r.dx,-6);assert.equal(r.shift,8);
 assert.equal(estimateMovement(source,shift(-2,0)).arrow,'→');
 assert.equal(estimateMovement(source,shift(2,0)).arrow,'←');
});
test('overshoot points phone back toward accepted view',()=>{
 const r=estimateMovement(source,shift(-14,0));assert.equal(r.state,'back');assert.equal(r.arrow,'←');
 assert.equal(estimateMovement(source,shift(0,14)).arrow,'↓');
});
test('flat, unrelated and ambiguous views never claim ready',()=>{
 assert.equal(estimateMovement(source,new Float32Array(5184).fill(.5)).state,'lost');
 assert.equal(estimateMovement(source,shift(30,0)).state,'lost');
 const stripes=Float32Array.from(source,(_,i)=>i%4<2?1:0);
 assert.equal(estimateMovement(stripes,stripes).state,'lost');
});
