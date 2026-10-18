import test from 'node:test';
import assert from 'node:assert/strict';
import {createLog,cleanText,errorInfo,probeGPU} from '../depth-diagnostics.js';
test('diagnostic log is bounded, plain text, and strips URL query/fragment information',()=>{
 const el={value:'',scrollHeight:100},log=createLog(el,3);
 for(let i=0;i<5;i++)log.write('info','event-'+i,{source:'https://example.test/depth.js?token=secret#private'});
 assert.equal(log.text().split('\n').length,3);assert.doesNotMatch(log.text(),/event-0|event-1|token|secret|private/);
 assert.match(log.text(),/event-4/);assert.match(log.text(),/https:\/\/example.test\/depth.js/);
 assert.equal(cleanText('x'.repeat(5000)).length,3000);assert.equal(errorInfo(new Error('test')).message,'test');
 log.clear();assert.equal(el.value,'');
});
test('GPU diagnostics distinguish a missing API, null adapter, rejection and usable adapter',async()=>{
 const events=[],emit=(level,event,details)=>events.push({level,event,details});
 let r=await probeGPU(undefined,emit);assert.match(r.reason,/API unavailable/);
 r=await probeGPU({requestAdapter:async()=>null},emit);assert.match(r.reason,/returned null/);
 r=await probeGPU({requestAdapter:async()=>{throw new DOMException('blocked','NotAllowedError');}},emit);assert.match(r.reason,/blocked/);
 assert.equal(events.at(-1).details.name,'NotAllowedError');
 const adapter={features:new Set(['shader-f16']),limits:{maxBufferSize:1024},info:{vendor:'test',architecture:'test'}};
 r=await probeGPU({requestAdapter:async()=>adapter},emit);assert.equal(r.adapter,adapter);assert.deepEqual(events.at(-1).details.features,['shader-f16']);
});
test('compatibility adapter is tried after Core fails, and Core remains preferred',async()=>{
 const options=[],adapter={features:new Set(),limits:{}},emit=()=>{};
 const result=await probeGPU({requestAdapter:async option=>{options.push(option);return option?.featureLevel==='compatibility'?adapter:null;}},emit);
 assert.deepEqual(options,[undefined,{featureLevel:'compatibility'}]);assert.equal(result.adapter,adapter);assert.equal(result.mode,'compatibility');
 options.length=0;
 const core=await probeGPU({requestAdapter:async option=>{options.push(option);return adapter;}},emit);
 assert.equal(options.length,1);assert.equal(core.mode,'core');
});
