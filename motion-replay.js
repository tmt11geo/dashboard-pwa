import {indexPath,indexedDistances,indexedLines,assessRecording,qualitySummary} from './motion-path.mjs?v=2';
import {OrbitView,bindOrbit} from './motion-replay-orbit.mjs?v=2';
import {xyz} from './motion-replay-view.mjs?v=3';
import {MAX_BYTES,validateRecording,poseAt,rotate,connected} from './motion-replay-core.mjs?v=3';
export function createMotionReplay({getSamples,isBusy}) {
  const $=id=>document.getElementById(id), canvas=$('replay-scene'),ctx=canvas.getContext('2d');
  let recording=null,time=0,playing=false,raf=0,last=null,loadToken=0;
  let view=new OrbitView();
  let pathIndex=null,jumpMarkers=[];
  const colours=['#ff9b8c','#a5ffbf','#84c9ff'];

  function line(a,b,colour,width=2){ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();}
  function arrow(a,b,colour,width=3){line(a,b,colour,width);const angle=Math.atan2(b[1]-a[1],b[0]-a[0]),head=Math.min(10,Math.hypot(b[0]-a[0],b[1]-a[1])*.35);for(const d of [-.5,.5])line(b,[b[0]-head*Math.cos(angle+d),b[1]-head*Math.sin(angle+d)],colour,width);}
  function label(text,p,colour='#dfede3'){ctx.fillStyle=colour;ctx.font='15px system-ui';ctx.fillText(text,p[0],p[1]);}
  function update(){
    const busy=isBusy();
    if(busy && playing)pause();
    $('replay-current').disabled=busy || !getSamples().length;
    $('replay-load').disabled=busy;
    $('replay-play').disabled=busy || !recording || !recording.duration;
    $('replay-rewind').disabled=busy || !recording;
    $('replay-time').disabled=busy || !recording;
    $('replay-play').textContent=playing?'Pause':'Play';
    for(const id of ['replay-view-reset','replay-view-in','replay-view-out'])$(id).disabled=busy || !recording;
  }
  function render(){
    ctx.clearRect(0,0,700,400);
    $('replay-view-status').textContent=`View zoom ${view.zoom.toFixed(2)}× · drag to orbit`;
    const legend=[58,348];
    [[1,0,0],[0,1,0],[0,0,1]].forEach((v,i)=>{const d=view.vector(v),end=[legend[0]+d[0]*25,legend[1]+d[1]*25];arrow(legend,end,colours[i],1);label(['+X','+Y','+Z'][i],[end[0]+3,end[1]],colours[i]);});
    if(!recording){label('Load a recording or use your current capture.',[125,365]);return;}
    const state=poseAt(recording,time),p=state.pose;
    const distances=indexedDistances(pathIndex,time,p);
    $('replay-travelled').textContent=`${distances.travelled.toFixed(2)} / ${distances.total.toFixed(2)} m`;
    $('replay-displacement').textContent=distances.displacement===null?'Unavailable':`${distances.displacement.toFixed(2)} m`;
    const edges=indexedLines(pathIndex,time,p);
    for(const played of [false,true]){
      ctx.strokeStyle=played?'#a5ffbf':'#42654e';ctx.lineWidth=played?3:2;ctx.beginPath();
      for(const edge of edges)if(edge.played===played){ctx.moveTo(...view.project(xyz(edge.a)));ctx.lineTo(...view.project(xyz(edge.b)));}
      ctx.stroke();
    }
    for(const marker of jumpMarkers){const at=view.project(xyz(marker));ctx.strokeStyle='#ffcf70';ctx.lineWidth=2;ctx.beginPath();ctx.arc(...at,7,0,Math.PI*2);ctx.stroke();}
    const first=view.project(xyz(recording.samples[0])),end=view.project(xyz(recording.samples.at(-1)));
    ctx.fillStyle='#a5ffbf';ctx.beginPath();ctx.arc(...first,4,0,Math.PI*2);ctx.fill();label('Start',[first[0]+7,first[1]+17]);
    ctx.strokeStyle='#a5ffbf';ctx.lineWidth=2;ctx.beginPath();ctx.arc(...end,5,0,Math.PI*2);ctx.stroke();label('End',[end[0]+7,end[1]-9]);
    // Cube is a constant-sized orientation glyph at the metric path position.
    const o=p?view.project(xyz(p)):[350,200];
    const project=v=>{const d=view.vector(v);return [o[0]+d[0]*35*view.zoom,o[1]+d[1]*35*view.zoom];};
    if(p){
      const corners=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(v=>rotate(p.q,v.map(n=>n*.65)));
      const faces=[{v:[0,1,2,3],c:'#476f9b',name:'VIEW −Z'},{v:[4,7,6,5],c:'#253747'},{v:[3,2,6,7],c:'#4a8964',name:'UP +Y'},{v:[0,4,5,1],c:'#213b2a'},{v:[1,5,6,2],c:'#8d4e43',name:'RIGHT +X'},{v:[0,3,7,4],c:'#402b28'}];
      // Face order uses the current camera direction, including views from below.
      faces.sort((a,b)=>a.v.reduce((n,i)=>n+view.depth(corners[i]),0)-b.v.reduce((n,i)=>n+view.depth(corners[i]),0));
      for(const f of faces){ctx.beginPath();f.v.forEach((i,j)=>{const v=project(corners[i]);j?ctx.lineTo(...v):ctx.moveTo(...v);});ctx.closePath();ctx.fillStyle=f.c+'66';ctx.fill();ctx.strokeStyle='#c9e3d4';ctx.lineWidth=1;ctx.stroke();}
      // Local viewer axes clarify rotations even when cube faces look similar.
      [[1.2,0,0],[0,1.2,0],[0,0,-1.2]].forEach((v,i)=>{const end=project(rotate(p.q,v));arrow(o,end,colours[i]);label(['right','up','view'][i],[end[0]+5,end[1]+5],colours[i]);});
      if(state.velocity){
        const speed=Math.hypot(...state.velocity),factor=speed>0?(.25+.75*Math.min(speed,2))/speed:1;
        const scaled=state.velocity.map(v=>v*factor);
        if(speed>.0001)arrow(o,project(scaled),'#ffcf70',6);
        $('replay-speed-value').textContent=`${speed.toFixed(2)} m/s`;
        $('replay-vector').textContent=`Vx ${state.velocity[0].toFixed(2)} · Vy ${state.velocity[1].toFixed(2)} · Vz ${state.velocity[2].toFixed(2)} m/s${speed>2?' · arrow capped at 2 m/s':''}`;
      }else{$('replay-speed-value').textContent='Unavailable';$('replay-vector').textContent='No connected sample pair for velocity.';}
      $('replay-position').textContent=`X ${p.x.toFixed(2)} · Y ${p.y.toFixed(2)} · Z ${p.z.toFixed(2)} m`;
    } else {
      label('Tracking break · no pose or speed interpolated',[140,200],'#ffcf70');
      $('replay-speed-value').textContent='Unavailable';$('replay-vector').textContent='Tracking break';$('replay-position').textContent='Tracking gap';
    }
    label('Bright: travelled · Dim: remaining · Amber: velocity',[155,377]);
    $('replay-time').value=String(time);
    $('replay-clock').textContent=`${(time/1000).toFixed(1)} / ${(recording.duration/1000).toFixed(1)} s`;
  }
  function pause(){playing=false;cancelAnimationFrame(raf);raf=0;last=null;update();}
  function tick(now){
    if(!playing || !recording)return;
    if(isBusy() || document.hidden){pause();return;}
    if(last!==null)time=Math.min(recording.duration,time+(now-last)*Number($('replay-rate').value));
    last=now;render();
    if(time>=recording.duration)pause();else raf=requestAnimationFrame(tick);
  }
  function load(data,name){
    // Validate before replacing a usable previous replay.
    const next=validateRecording(data),quality=assessRecording(next.samples);next.samples=quality.samples;
    jumpMarkers=next.samples.filter(p=>p.breakReason==='position-jump').slice(-100);
    $('replay-quality').textContent=qualitySummary(quality.jumps,quality.gaps);
    pause();orbitControls.cancel();recording=next;pathIndex=indexPath(next.samples);view=new OrbitView(next.samples);time=0;
    $('replay-time').max=String(recording.duration);
    $('replay-status').textContent=`${name} · ${next.samples.length.toLocaleString()} samples · ${(next.duration/1000).toFixed(1)} s`;
    render();update();
  }
  $('replay-current').addEventListener('click',()=>{
    if(isBusy())return;loadToken++;
    try{load({format:'tactical-motion-1',units:'metres',referenceSpace:'local',samples:getSamples()},'Current recording');}
    catch(e){$('replay-status').textContent=e.message;}
  });
  $('replay-load').addEventListener('click',()=>{if(!isBusy())$('replay-file').click();});
  $('replay-file').addEventListener('change',async()=>{
    const file=$('replay-file').files[0],token=++loadToken;$('replay-file').value='';
    if(!file || isBusy())return;
    try{
      if(file.size>MAX_BYTES)throw Error('File is too large. Maximum 20 MiB.');
      const text=await file.text();
      if(token!==loadToken || isBusy())return;
      load(JSON.parse(text),file.name);
    }catch(e){if(token===loadToken)$('replay-status').textContent=`Could not load recording: ${e.message}`;}
  });
  $('replay-play').addEventListener('click',()=>{
    if(isBusy() || !recording || !recording.duration)return;
    if(playing){pause();return;}
    if(time>=recording.duration)time=0;
    playing=true;last=null;update();raf=requestAnimationFrame(tick);
  });
  $('replay-rewind').addEventListener('click',()=>{if(isBusy() || !recording)return;pause();time=0;render();});
  $('replay-time').addEventListener('input',()=>{if(isBusy() || !recording)return;pause();time=Math.min(recording.duration,Math.max(0,Number($('replay-time').value)||0));render();});
  $('replay-rate').addEventListener('change',()=>{last=null;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('pagehide',pause);
  const orbitControls=bindOrbit(canvas,{getView:()=>view,enabled:()=>!!recording&&!isBusy(),changed:render});
  $('replay-view-reset').addEventListener('click',()=>{if(!recording||isBusy())return;orbitControls.cancel();view.reset();render();});
  $('replay-view-in').addEventListener('click',()=>{if(!recording||isBusy())return;view.zoomAt(1.2);render();});
  $('replay-view-out').addEventListener('click',()=>{if(!recording||isBusy())return;view.zoomAt(1/1.2);render();});
  render();update();
  return {update,stop(){loadToken++;orbitControls.cancel();pause();}};
}
