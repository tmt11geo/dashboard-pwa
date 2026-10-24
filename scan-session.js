import {LIMIT,saveSession,loadSession} from './scan-session-core.js?v=1';
export function createScanner(hooks){
 const $=id=>document.getElementById(id);let active=false,busy=false,working=false,frames=[],profile=null,scene=null,worker=null,tick=null,deadline=null,stitched=false,lastResults=[],epoch=0,cueUntil=0;
 const focusViews=()=>requestAnimationFrame(()=>{const grid=document.querySelector('.depth-grid'),bar=document.querySelector('.scan-command');window.scrollTo(0,grid.getBoundingClientRect().top+scrollY-bar.offsetHeight-8);});
 const tell=s=>{$('scan-guide').textContent=s;};
 function buttons(){
  document.body.classList.toggle('scanning',active);
  $('scan-start').disabled=active||working||frames.length>=LIMIT||!!hooks.calibration().loading;
  $('gather-capture').disabled=!active||busy||!hooks.state().ready;
  $('scan-finish').disabled=!active||busy;$('session-stitch').disabled=active||working||!frames.length;
  $('session-relief').disabled=active||working||!stitched;$('session-save').disabled=active||working||!frames.length;
  $('session-open').disabled=active||working;$('scan-clear').disabled=active||working||!frames.length;
  $('scan-save').disabled=!scene||working;$('session-cancel').disabled=!working;
  $('scan-count').textContent=`${frames.length} / ${LIMIT} captures saved${scene?' · '+scene.points.length+' relief points':''}`;
 }
 function cancel(){epoch++;worker?.terminate();worker=null;clearTimeout(deadline);working=false;stitched=false;buttons();}
 function stop(){active=false;busy=false;clearInterval(tick);buttons();if(frames.length)tell('Gathering stopped. Save the session, then choose 2 · Stitch.');}
 function begin(){focusViews();epoch++;active=true;busy=false;scene=null;stitched=false;profile=structuredClone(hooks.calibration().profile);tell('Loading camera and depth model…');tick=setInterval(()=>{buttons();if(!busy&&hooks.state().ready&&performance.now()>cueUntil)tell('Hold still and tap Capture view. Keep most of the previous view visible.');},500);buttons();}
 function result(data){if(!active)return;busy=false;const c=hooks.calibration(),tracking=c.takeTracking();
  if(!data.rawDepth||!tracking){hooks.stop();tell('Capture missing calibrated depth. Retry gathering.');return;}
  frames.push({width:data.width,height:data.height,K:c.intrinsics(data.width,data.height),orientation:data.capture?.orientation??0,capturedAt:new Date().toISOString(),raw:new Float32Array(data.rawDepth).slice(),pixels:new Uint8ClampedArray(data.pixels).slice(),tracking});
  profile=structuredClone(c.profile);hooks.log('info','gather.saved',{count:frames.length});
  cueUntil=performance.now()+2000;tell('✓ SAVED — move slowly to the next overlapping view.');$('scan-workspace').classList.remove('move-flash');void $('scan-workspace').offsetWidth;$('scan-workspace').classList.add('move-flash');const cue=frames.length;setTimeout(()=>{if(frames.length===cue)$('scan-workspace').classList.remove('move-flash');},1400);
  if(frames.length>=LIMIT){hooks.stop();tell('12 captures saved. Choose 2 · Stitch.');}buttons();
 }
 $('scan-start').onclick=()=>{const c=hooks.calibration();if(!c.profile){tell('Load calibration JSON first.');return;}
  if(frames.length&&(c.profile.inputSha256!==profile.inputSha256||JSON.stringify(c.profile.geometry)!==JSON.stringify(profile.geometry))){tell('Clear or save this session before changing calibration.');return;}hooks.start();};
 $('gather-capture').onclick=()=>{if(!active||busy)return;busy=true;tell('Hold still — capturing depth…');if(!hooks.capture())busy=false;buttons();};
 $('scan-finish').onclick=()=>hooks.stop();
 $('session-cancel').onclick=()=>{cancel();tell('Processing cancelled. Captures retained; Stitch can be retried.');};
 function work(type){working=true;buttons();clearTimeout(deadline);deadline=setTimeout(()=>{cancel();tell('Processing timed out. Captures retained. Save the session for diagnosis.');},180000);worker.postMessage(type==='stitch'?{type,frames}:{type});}
 $('session-stitch').onclick=()=>{cancel();scene=null;hooks.show(null);$('session-results').textContent='';worker=new Worker(new URL('./scan-session-worker.js?v=1',import.meta.url),{type:'module'});const mine=epoch;
  worker.onmessage=({data})=>{if(mine!==epoch)return;if(data.type==='progress'){tell(`Stitch pass ${data.pass}: ${data.placed}/${data.total} placed…`);return;}clearTimeout(deadline);working=false;
   if(data.type==='stitched'){stitched=true;lastResults=data.results;hooks.log('info','session.stitched',{placed:data.placed,total:frames.length,results:data.results});tell(`${data.placed}/${frames.length} views placed. Choose 3 · Build relief. Unplaced captures remain saved.`);$('session-results').replaceChildren(...data.results.map(r=>{const li=document.createElement('li');li.textContent=`View ${r.index+1}: ${r.ok?(r.anchor?'anchor':'placed'):'unplaced — '+(r.reason||'uncertain alignment')}`;return li;}));}
   else if(data.type==='relief'){scene=data.scene;hooks.show(scene);focusViews();tell(`${scene.views} views in relief${scene.views===1?' — single view only, no stitched extension':''}. Drag to rotate; save the relief or session.`);}
   else {stitched=false;tell(data.message||'Processing failed. Captures retained.');}buttons();};
  worker.onerror=()=>{cancel();tell('Stitch worker failed. Captures retained.');};tell('Matching saved views…');work('stitch');};
 $('session-relief').onclick=()=>{if(!stitched)return;tell('Building 3D relief from placed views…');work('relief');};
 function download(data,name){const u=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download=name+'-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
 $('session-save').onclick=()=>download({...saveSession(frames,profile),stitchResults:lastResults},'tactical-gather');$('scan-save').onclick=()=>{if(scene)download(scene,'tactical-relief');};
 $('session-open').onclick=()=>$('session-file').click();$('session-file').onchange=async()=>{const f=$('session-file').files[0];$('session-file').value='';if(!f)return;try{if(f.size>35000000)throw Error('Session exceeds 35 MB');const mine=epoch,s=loadSession(JSON.parse(await f.text()));if(mine!==epoch||active||working)return;cancel();frames=s.frames;profile=s.calibration;scene=null;hooks.show(null);$('session-results').textContent='';tell('Saved session opened. Choose 2 · Stitch; camera and calibration import are not needed for reprocessing.');buttons();}catch(e){tell(e.message);}};
 $('scan-clear').onclick=()=>{cancel();frames=[];profile=null;scene=null;hooks.show(null);$('session-results').textContent='';tell('Session cleared. Load calibration and gather a new scene.');buttons();};
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&working){cancel();tell('Processing paused when hidden. Captures retained; retry Stitch.');}});
 window.addEventListener('pagehide',cancel);window.addEventListener('beforeunload',e=>{if(frames.length){e.preventDefault();e.returnValue='';}});
 return {begin,stop,result,buttons,calibrationStatus:message=>tell(message.replaceAll('Start scan','Start gathering')),error:tell,get active(){return active;},get scene(){return scene;}};
}
