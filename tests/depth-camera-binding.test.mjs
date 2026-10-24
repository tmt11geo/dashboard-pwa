import test from 'node:test';
import assert from 'node:assert/strict';
import {openCalibratedCamera} from '../depth-camera-binding.js';
const geometry={deviceId:'old',label:'rear 3'},request={deviceId:{exact:'old'},width:{ideal:640}};
function fixture({devices=[{kind:'videoinput',deviceId:'new',label:'rear 3'}],constraint='deviceId',confirmed=true}={}){
 const streams=[],requests=[];let confirmations=0,active=true;
 const mediaDevices={async getUserMedia(o){requests.push(o);if(requests.length===1)throw Object.assign(Error('rejected'),{name:'OverconstrainedError',constraint});const stream={stopped:false,getTracks(){return [{stop:()=>{stream.stopped=true;}}];},getVideoTracks(){return [{label:'rear 3',getSettings:()=>({deviceId:o.video.deviceId?.exact})}];}};streams.push(stream);return stream;},async enumerateDevices(){return devices;}};
 return {streams,requests,get confirmations(){return confirmations;},cancel(){active=false;},args:{mediaDevices,request,geometry,isCurrent:()=>active,confirmCamera:()=>{confirmations++;return confirmed;}}};
}
test('stale ID recovery stops probe, confirms unique label, opens exact new ID without changing calibration',async()=>{
 const f=fixture(),r=await openCalibratedCamera(f.args);assert.equal(r.rebound,true);assert.equal(r.deviceId,'new');assert.equal(f.confirmations,1);assert.equal(f.streams[0].stopped,true);assert.equal(f.requests[2].video.deviceId.exact,'new');assert.equal(geometry.deviceId,'old');
});
test('original ID revealed after permission is retried without rebinding',async()=>{
 const f=fixture({devices:[{kind:'videoinput',deviceId:'old',label:'rear 3'}]});assert.equal((await openCalibratedCamera(f.args)).rebound,false);assert.equal(f.confirmations,0);
});
test('absent, blank or duplicate labels do not select arbitrary cameras',async()=>{
 for(const devices of [[],[{kind:'videoinput',deviceId:'new',label:''}],[1,2].map(i=>({kind:'videoinput',deviceId:String(i),label:'rear 3'}))]){const f=fixture({devices});await assert.rejects(openCalibratedCamera(f.args),/uniquely/);assert.equal(f.requests.length,2);assert.ok(f.streams.every(s=>s.stopped));}
});
test('declined confirmation and cancelled startup never open replacement camera',async()=>{
 const f=fixture({confirmed:false});await assert.rejects(openCalibratedCamera(f.args),/cancelled/);assert.equal(f.requests.length,2);
 const g=fixture();g.args.confirmCamera=()=>{g.cancel();return true;};await assert.rejects(openCalibratedCamera(g.args),/cancelled/);assert.ok(g.streams.every(s=>s.stopped));
});
test('other constraint errors are not retried',async()=>{const f=fixture({constraint:'width'});await assert.rejects(openCalibratedCamera(f.args),/rejected/);assert.equal(f.requests.length,1);});
test('incorrect returned device is released',async()=>{const f=fixture();const open=f.args.mediaDevices.getUserMedia;f.args.mediaDevices.getUserMedia=async o=>{const s=await open(o);s.getVideoTracks=()=>[{label:'wrong',getSettings:()=>({deviceId:'wrong'})}];return s;};await assert.rejects(openCalibratedCamera(f.args),/does not match/);assert.ok(f.streams.every(s=>s.stopped));});
