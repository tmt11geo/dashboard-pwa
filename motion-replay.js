import {MAX_BYTES,validateRecording,poseAt,rotate,connected} from './motion-replay-core.mjs?v=1';
export function createMotionReplay({getSamples,isBusy}) {
  const $=id=>document.getElementById(id), canvas=$('replay-scene'),ctx=canvas.getContext('2d');
  let recording=null,time=0,playing=false,raf=0,last=null,loadToken=0;
  const colours=['#ff9b8c','#a5ffbf','#84c9ff'];
  const project=([x,y,z])=>[350+(x-z)*65,205-y*80+(x+z)*26];
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
  }
  function render(){
    ctx.clearRect(0,0,700,400);
    const o=project([0,0,0]);
    [[2.7,0,0],[0,2.1,0],[0,0,2.7]].forEach((v,i)=>{const end=project(v);arrow(o,end,colours[i],1);label(['+X','+Y (up)','+Z'][i],[end[0]+5,end[1]],colours[i]);});
    if(!recording){label('Load a recording or use your current capture.',[125,365]);return;}
    const state=poseAt(recording,time),p=state.pose;
    if(p){
      const corners=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(v=>rotate(p.q,v.map(n=>n*.65)));
      const faces=[{v:[0,1,2,3],c:'#476f9b',name:'VIEW −Z'},{v:[4,7,6,5],c:'#253747'},{v:[3,2,6,7],c:'#4a8964',name:'UP +Y'},{v:[0,4,5,1],c:'#213b2a'},{v:[1,5,6,2],c:'#8d4e43',name:'RIGHT +X'},{v:[0,3,7,4],c:'#402b28'}];
      // Painter's order for the fixed isometric camera (view direction (1, .65, 1)).
      faces.sort((a,b)=>a.v.reduce((n,i)=>n+(corners[i][0]+.65*corners[i][1]+corners[i][2]),0)-b.v.reduce((n,i)=>n+(corners[i][0]+.65*corners[i][1]+corners[i][2]),0));
      for(const f of faces){ctx.beginPath();f.v.forEach((i,j)=>{const v=project(corners[i]);j?ctx.lineTo(...v):ctx.moveTo(...v);});ctx.closePath();ctx.fillStyle=f.c;ctx.fill();ctx.strokeStyle='#c9e3d4';ctx.lineWidth=1;ctx.stroke();}
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
      label('Tracking gap · no pose or speed interpolated',[140,200],'#ffcf70');
      $('replay-speed-value').textContent='Unavailable';$('replay-vector').textContent='Tracking gap';$('replay-position').textContent='Tracking gap';
    }
    // Small path overview; fixed bounds for the entire recording.
    const samples=recording.samples,extent=Math.max(1,...samples.map(p=>Math.max(Math.abs(p.x),Math.abs(p.z))));
    const point=p=>[78+p.x*48/extent,305+p.z*48/extent];
    ctx.fillStyle='#07100be6';ctx.fillRect(12,235,135,132);label('X / Z trail',[22,253]);
    for(let i=1;i<samples.length;i++)if(connected(samples[i-1],samples[i]))line(point(samples[i-1]),point(samples[i]),'#5f9c72',1);
    if(p){ctx.beginPath();ctx.arc(...point(p),4,0,Math.PI*2);ctx.fillStyle='#ffcf70';ctx.fill();}
    label('Cube centred for rotation · arrow = world velocity',[175,385]);
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
    const next=validateRecording(data);pause();recording=next;time=0;
    $('replay-time').max=String(recording.duration);
    $('replay-status').textContent=`${name} · ${next.samples.length} samples · ${(next.duration/1000).toFixed(1)} s`;
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
      if(file.size>MAX_BYTES)throw Error('File is too large. Maximum 5 MB.');
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
  render();update();
  return {update,stop(){loadToken++;pause();}};
}
