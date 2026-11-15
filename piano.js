import {frequency,noteName,keyboardLayout} from './piano-core.mjs';
try { document.body.dataset.theme = localStorage.getItem('tactical-theme') || 'green'; } catch {}
const $ = id => document.getElementById(id);
const keyboard = $('keyboard'), held = new Map(), voices = new Set();
const shortcuts = ['KeyA','KeyW','KeyS','KeyE','KeyD','KeyF','KeyT','KeyG','KeyY','KeyH','KeyU','KeyJ','KeyK'];
let start = 48, context, master, sustain = false, space = false, sustainSeconds = 3;
function audio() {
  if (!context) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error('Web Audio is unavailable in this browser.');
    context = new Audio({latencyHint:'interactive'});
    master = context.createGain();
    master.gain.value = Number($('volume').value) / 100 * .28;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value=-14; limiter.knee.value=8; limiter.ratio.value=12;
    master.connect(limiter); limiter.connect(context.destination);
  }
  if (context.state !== 'running') context.resume().then(()=>{
    $('status').textContent = context.state === 'running' ? 'A4 = 440 Hz · equal temperament' : 'Tap a key again to enable sound.';
  }).catch(()=>{ $('status').textContent='Sound blocked. Tap a key to retry.'; });
  return context;
}
function release(voice, immediate=false, seconds=.5) {
  if (voice.ended) return;
  const now=context.currentTime, duration=immediate ? .05 : seconds;
  // Pedal-up and Stop sound may shorten an existing tail, never extend it.
  if (voice.released && voice.stopAt <= now+duration) return;
  voice.released=true;
  voice.stopAt=now+duration;
  voice.gain.gain.cancelAndHoldAtTime(now);
  voice.gain.gain.setTargetAtTime(0,now,immediate ? .008 : duration / 7);
  voice.osc.stop(voice.stopAt);
}
function play(midi) {
  const ctx=audio(), now=ctx.currentTime;
  if (voices.size>=48) {
    const old=voices.values().next().value;
    release(old,true); voices.delete(old);
  }
  const osc=ctx.createOscillator(), gain=ctx.createGain();
  // Harmonics at exact integer multiples preserve concert pitch.
  osc.setPeriodicWave(ctx.createPeriodicWave(new Float32Array(9),new Float32Array([0,1,.35,.17,.08,.045,.025,.012,.008])));
  osc.frequency.value=frequency(midi);
  const filter=ctx.createBiquadFilter(); filter.type='lowpass';
  filter.frequency.setValueAtTime(Math.min(12000,frequency(midi)*12),now);
  filter.frequency.exponentialRampToValueAtTime(Math.min(7000,frequency(midi)*3),now+2);
  gain.gain.setValueAtTime(0,now); gain.gain.linearRampToValueAtTime(.65,now+.008);
  gain.gain.exponentialRampToValueAtTime(.17,now+.65);
  gain.gain.exponentialRampToValueAtTime(.0001,now+12);
  osc.connect(filter); filter.connect(gain); gain.connect(master);
  const voice={midi,osc,gain,released:false}; voices.add(voice);
  osc.onended=()=>{voice.ended=true;voices.delete(voice);osc.disconnect();filter.disconnect();gain.disconnect();};
  osc.start(now); osc.stop(now+13);
  $('status').textContent='A4 = 440 Hz · equal temperament';
  return voice;
}
function paint() {
  const notes=new Set([...held.values()].map(v=>v.midi));
  keyboard.querySelectorAll('.key').forEach(key=>key.classList.toggle('active',notes.has(Number(key.dataset.midi))));
  $('notes').textContent=notes.size ? [...notes].sort((a,b)=>a-b).map(noteName).join(' · ') : 'Ready to play';
}
function down(id,midi) {
  if(held.get(id)?.midi===midi) return;
  up(id);
  try { held.set(id,play(midi));paint(); }
  catch(error) { $('status').textContent=error.message; }
}
function up(id) {
  const voice=held.get(id); if(!voice) return;
  held.delete(id); release(voice,false,(sustain || space) ? sustainSeconds : .5); paint();
}
function pedal() {
  $('sustain').setAttribute('aria-pressed',String(sustain || space));
  $('sustain').textContent=(sustain || space) ? 'Sustain on' : 'Sustain off';
  if(!sustain && !space) {
    const active=new Set(held.values());
    voices.forEach(v=>{if(!active.has(v)) release(v);});
  }
}
function silence() {
  held.clear(); voices.forEach(v=>release(v,true)); sustain=false;space=false;pedal();paint();
}
function render() {
  silence(); keyboard.replaceChildren();
  for(const item of keyboardLayout(start)) {
    const key=document.createElement('button');key.type='button';key.className='key '+(item.black?'black':'white');
    key.dataset.midi=item.midi;key.style.left=item.left+'%';key.style.width=item.width+'%';
    key.setAttribute('aria-label',noteName(item.midi));
    const label=document.createElement('span');label.className='label';label.textContent=noteName(item.midi);key.append(label);
    if(shortcuts[item.midi-start]) {const hint=document.createElement('small');hint.textContent=shortcuts[item.midi-start].slice(3);key.append(hint);}
    // Keyboard/assistive activation is a short note; pointer playback is handled below.
    key.addEventListener('click',e=>{if(e.detail===0){const id=Symbol();down(id,item.midi);setTimeout(()=>up(id),220);}});
    keyboard.append(key);
  }
  $('range').textContent=noteName(start)+' – '+noteName(start+24);
  $('lower').disabled=start<=24; $('higher').disabled=start>=72;
}
const pointers=new Set();
function at(event) {const el=document.elementFromPoint(event.clientX,event.clientY)?.closest('.key');return el && keyboard.contains(el) ? Number(el.dataset.midi) : null;}
keyboard.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse' && event.button!==0) return;
  event.preventDefault();pointers.add(event.pointerId);keyboard.setPointerCapture(event.pointerId);
  const midi=at(event);if(midi!==null)down(event.pointerId,midi);
});
keyboard.addEventListener('pointermove',event=>{if(!pointers.has(event.pointerId))return;const midi=at(event);if(midi===null)up(event.pointerId);else down(event.pointerId,midi);});
for(const type of ['pointerup','pointercancel','lostpointercapture']) keyboard.addEventListener(type,event=>{pointers.delete(event.pointerId);up(event.pointerId);});
keyboard.addEventListener('contextmenu',event=>event.preventDefault());
window.addEventListener('keydown',event=>{
  if(event.target.matches('input,select,textarea') || event.ctrlKey || event.metaKey || event.altKey) return;
  if(event.code==='Space' && event.target.closest('button,a'))return;
  const index=shortcuts.indexOf(event.code);
  if(index>=0){event.preventDefault();if(!event.repeat)down(event.code,start+index);}
  if(event.code==='Space'){event.preventDefault();space=true;pedal();}
});
window.addEventListener('keyup',event=>{up(event.code);if(event.code==='Space'){space=false;pedal();}});
$('lower').onclick=()=>{start=Math.max(24,start-12);render();};
$('higher').onclick=()=>{start=Math.min(72,start+12);render();};
$('volume').oninput=()=>{if(master)master.gain.setTargetAtTime(Number($('volume').value)/100*.28,context.currentTime,.015);};
$('sustain-length').oninput=()=>{
  sustainSeconds=Number($('sustain-length').value);
  $('sustain-value').textContent=sustainSeconds.toFixed(1)+' s';
};
$('sustain').onclick=()=>{sustain=!sustain;pedal();};
$('silence').onclick=silence;
$('fullscreen').onclick=async()=>{
  try {
    if(document.fullscreenElement){await document.exitFullscreen();return;}
    if(!$('piano').requestFullscreen)throw new Error();
    await $('piano').requestFullscreen();
    try {await screen.orientation.lock('landscape');}catch{$('status').textContent='Turn your phone sideways for landscape.';}
  } catch {$('status').textContent='Full screen unavailable. Turn your phone sideways to play.';}
};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'Exit full screen':'Full screen';});
window.addEventListener('blur',()=>{pointers.clear();silence();});
window.addEventListener('pagehide',()=>{pointers.clear();silence();if(context)context.suspend();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pointers.clear();silence();if(context)context.suspend();}});
render();
