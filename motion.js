import { createMotionReplay } from './motion-replay.js?v=3';
import { MotionTrail } from './motion-core.mjs?v=1';
const $ = id => document.getElementById(id);
const trail = new MotionTrail();
let session = null, space = null, gl = null, pending = false, generation = 0, supported = false;
let lastUI = -Infinity;
let replay = null;
const log = [];
try { document.body.dataset.theme = localStorage.getItem('tactical-theme') === 'red' ? 'red' : 'green'; } catch {}
function diagnostic(message) {
  log.push(`${new Date().toISOString()} ${message}`);
  if (log.length > 80) log.shift();
  $('diagnostics').textContent = log.join('\n');
}
function status(message) { if ($('status').textContent !== message) $('status').textContent = message; }
function controls() {
  $('start').disabled = !supported || pending || !!session;
  $('stop').disabled = !session && !pending;
  $('zero').disabled = !session;
  $('save').disabled = !trail.samples.length;
  replay?.update();
}
function draw() {
  const ctx = $('trail').getContext('2d');
  const points = trail.samples;
  const extent = Math.max(1, ...points.map(p => Math.max(Math.abs(p.x),Math.abs(p.z))));
  const scale = 125 / extent;
  ctx.clearRect(0,0,600,300);
  ctx.strokeStyle = '#41604c'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0,150); ctx.lineTo(600,150); ctx.moveTo(300,0); ctx.lineTo(300,300); ctx.stroke();
  ctx.fillStyle = '#c7d9cb'; ctx.font='14px system-ui';
  ctx.fillText('−Z',308,18); ctx.fillText('+X',570,143); ctx.fillText('Origin',308,170);
  ctx.strokeStyle = '#a5ffbf'; ctx.lineWidth=3; ctx.beginPath();
  let previous = null;
  for (const p of points) {
    const x=300+p.x*scale, y=150+p.z*scale;
    if (!previous || previous.segment !== p.segment) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    previous=p;
  }
  ctx.stroke();
  const p=trail.latest;
  if(p) { ctx.beginPath(); ctx.arc(300+p.x*scale,150+p.z*scale,5,0,Math.PI*2); ctx.fillStyle='#ffce75'; ctx.fill(); }
  $('scale').textContent = `Top-down X / Z · centre to top guide ≈ ${extent.toFixed(1)} m · ${points.length}/3000 samples`;
  $('position').textContent = p ? `X ${p.x.toFixed(2)} · Y ${p.y.toFixed(2)} · Z ${p.z.toFixed(2)}` : 'No current tracked position';
  $('distance').textContent = p ? `${Math.hypot(p.x,p.y,p.z).toFixed(2)} m` : '—';
  $('orientation').textContent = p ? `Orientation quaternion (x, y, z, w): ${p.q.map(v=>v.toFixed(3)).join(', ')}` : 'Orientation quaternion: —';
  controls();
}
function releaseGraphics() { gl?.getExtension('WEBGL_lose_context')?.loseContext(); gl=null; }
function finished(s) {
  if(session !== s) return;
  session=null; space=null; pending=false; generation++;
  releaseGraphics(); trail.gap(); status('Stopped. Trajectory retained; Save downloads it.'); draw(); diagnostic('Session ended');
}
async function stop() {
  generation++; pending=false;
  const s=session;
  if(s) { try { await s.end(); finished(s); } catch(e) { status(`Could not end AR: ${e.message}. Use the browser’s AR exit control.`); diagnostic(`End failed: ${e.name}`); } }
  else { status('Start cancelled. Any late session will be closed.'); controls(); }
}
async function start() {
  if(pending || session) return;
  replay?.stop();
  const token=++generation; pending=true; controls(); status('Requesting AR access…');
  let requested=null;
  try {
    // Keep this call directly in the user gesture; no awaited capability probe here.
    requested=await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures:['local','dom-overlay'], domOverlay:{root:$('overlay')}
    });
    if(token!==generation) { await requested.end(); return; }
    session=requested;
    session.addEventListener('end',()=>finished(requested),{once:true});
    if(!session.domOverlayState) throw new Error('AR controls overlay is unavailable. Try Android Chrome.');
    const canvas=document.createElement('canvas');
    gl=canvas.getContext('webgl',{alpha:true,xrCompatible:true});
    if(!gl) throw new Error('An AR-compatible WebGL context could not be created.');
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault(); if(session===requested){diagnostic('WebGL context lost');void stop();}});
    await gl.makeXRCompatible();
    if(token!==generation) return;
    session.updateRenderState({baseLayer:new XRWebGLLayer(session,gl,{alpha:true})});
    const reference=await session.requestReferenceSpace('local');
    if(token!==generation) return;
    space=reference;
    space.addEventListener('reset',()=>{
      if(session!==requested) return;
      trail.reset(); draw(); status('Tracking origin changed. Trail cleared; establishing a new origin.'); diagnostic('Reference-space reset; trail cleared');
    });
    session.addEventListener('visibilitychange',()=>{
      if(session===requested && session.visibilityState!=='visible') {
        trail.gap(); draw(); status('AR view interrupted. Waiting for tracking.');
      }
    });
    trail.reset(); pending=false; lastUI=-Infinity; draw();
    status('Move gently to establish tracking.'); diagnostic(`AR started; overlay=${session.domOverlayState.type}; reference=local`);
    session.requestAnimationFrame(frame);
  } catch(e) {
    // A stopped/older setup must never alter a newer session's controls or status.
    if(token!==generation) {
      if(requested && requested!==session) { try { await requested.end(); } catch {} }
      return;
    }
    if(requested) { try { await requested.end(); } catch {} }
    if(session===requested && requested) finished(requested);
    if(token===generation || requested) {
      pending=false;
      status(`AR could not start: ${e.message || e.name}. Check camera/AR permission, Google Play Services for AR and Android Chrome.`);
      diagnostic(`Start failed: ${e.name}: ${e.message}`); controls();
    }
  }
}
function frame(time, xrFrame) {
  const s=xrFrame.session;
  if(s!==session || !space || !gl) return;
  try {
    s.requestAnimationFrame(frame);
    const layer=s.renderState.baseLayer;
    gl.bindFramebuffer(gl.FRAMEBUFFER,layer.framebuffer);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const pose=s.visibilityState==='visible' ? xrFrame.getViewerPose(space) : null;
    const p=trail.add(time,pose);
    status(p ? 'Tracking · local pose in metres' : 'Tracking unavailable · move gently toward a textured area');
    if(time-lastUI>=100) { lastUI=time; draw(); }
  } catch(e) { diagnostic(`Frame error: ${e.message}`); void stop(); }
}
$('start').addEventListener('click',start);
$('stop').addEventListener('click',stop);
$('zero').addEventListener('click',()=>{trail.reset();draw();status('Origin cleared. The next tracked pose becomes zero.');diagnostic('User reset origin');});
$('save').addEventListener('click',()=>{
  if(!trail.samples.length) return;
  const data={format:'tactical-motion-1',created:new Date().toISOString(),units:'metres',referenceSpace:'local',
    axes:'right-handed; +Y up; X/Z runtime-local, not compass; position relative to origin; quaternion in runtime-local axes',
    timestamps:'WebXR animation timestamp in milliseconds',origin:trail.origin,limit:trail.limit,
    note:'Latest samples only. Segment changes indicate tracking gaps. Drift/jumps possible; no accuracy guarantee.',samples:trail.samples};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`tactical-motion-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
});
$('overlay').addEventListener('beforexrselect',e=>e.preventDefault());
window.addEventListener('pagehide',()=>void stop());
// XR runtimes manage visibility separately; don't terminate AR on document.hidden.
replay = createMotionReplay({getSamples:()=>trail.samples,isBusy:()=>pending || !!session});
diagnostic(`motion-lab-4; secure=${isSecureContext}; WebXR=${!!navigator.xr}; UA=${navigator.userAgent}`);
draw();
try {
  supported=!!(isSecureContext && navigator.xr && await navigator.xr.isSessionSupported('immersive-ar'));
  $('capability').textContent=supported ? 'Immersive AR is available. Start checks permission and overlay support.' : 'Immersive AR is unavailable here. Try Android Chrome on an ARCore-supported phone with Google Play Services for AR enabled.';
  status(supported ? 'Ready. Start AR tracking to begin.' : 'This browser/device cannot provide the required AR session.');
  diagnostic(`immersive-ar supported=${supported}`);
} catch(e) { $('capability').textContent=`AR support check failed: ${e.message}`;diagnostic(`Support check failed: ${e.name}`); }
controls();
