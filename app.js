"use strict";
let promptEvent = null;
const installButton = document.querySelector('#install');
const installStatus = document.querySelector('#install-status');
function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches; }
function installed() { installButton.hidden = true; installStatus.textContent = 'Installed — your dashboard is running as an app.'; }
if (isStandalone()) installed();
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); promptEvent = event; installStatus.textContent = 'Ready to install. Tap Install on Android.'; });
window.addEventListener('appinstalled', () => { promptEvent = null; installed(); });
installButton.addEventListener('click', async () => {
  if (!promptEvent) { installStatus.textContent = 'In Android Chrome: open ⋮ → Add to Home screen → Install. If unavailable, sign in and reload this page.'; return; }
  const event = promptEvent; promptEvent = null;
  try { await event.prompt(); const choice = await event.userChoice; installStatus.textContent = choice.outcome === 'accepted' ? 'Installation requested. Follow Chrome’s confirmation.' : 'You can install later from Chrome’s menu.'; }
  catch { installStatus.textContent = 'Use Chrome’s menu → Add to Home screen to install.'; }
});
let days = 7;
let snapshot = 0;
const samples = [52,53,52,54,54,55,56,55,58,58,59,60,59,61,63,62,64,65,66,65,67,67,68,69,69,70,71,72,73,74];
function render() {
  const values = samples.slice(-days).map((v,i) => v + (i===days-1 ? snapshot%4 : 0));
  const end = values.at(-1);
  document.querySelector('#progress').innerHTML = end + '<span>%</span>';
  document.querySelector('#progress-detail').textContent = 'Simulated progress · ' + end + '%';
  document.querySelector('#tests').innerHTML = (96 + snapshot%3) + '<span>%</span>';
  document.querySelector('#updated').textContent = 'Snapshot ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  const x = i => 38 + i/(values.length-1)*580;
  const y = v => 200 - v*1.7;
  const line = values.map((v,i) => (i?'L':'M') + x(i).toFixed(2) + ',' + y(v).toFixed(2)).join(' ');
  document.querySelector('#line').setAttribute('d',line);
  document.querySelector('#area').setAttribute('d',line+' L618,200 L38,200 Z');
  document.querySelector('#point').setAttribute('cx',618);
  document.querySelector('#point').setAttribute('cy',y(end));
  document.querySelector('#grid').innerHTML = [0,25,50,75,100].map(v => '<line x1="38" x2="618" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#2a384c"/><text x="0" y="'+(y(v)+4)+'" fill="#a3b3c9" font-size="12">'+v+'</text>').join('');
  const summary = 'Simulated delivery progress: '+values[0]+'% to '+end+'% over '+days+' days.';
  document.querySelector('#chart-desc').textContent = summary;
  document.querySelector('#chart-summary').textContent = summary;
  document.querySelector('#chart-start').textContent = (days-1)+' days ago';
}
document.querySelectorAll('.range').forEach(button => button.addEventListener('click', () => {
  days = Number(button.dataset.days);
  document.querySelectorAll('.range').forEach(b => { const active = b === button; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active)); });
  render();
}));
document.querySelector('#refresh').addEventListener('click', () => { snapshot++; render(); });
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', {scope:'./'}).catch(() => { installStatus.textContent = 'Offline notice unavailable. You can still open the dashboard online; try reloading after signing in.'; });
