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

async function loadStocks() {
 try {
  const response = await fetch('./stocks.json?v=20261009', {cache:'no-store'});
  if (!response.ok) throw new Error('Prices unavailable');
  const data = await response.json();
  const colors = ['#65e1bc','#83b4ff'];
  const percent = s => s.points.map(p => (p.close/s.points[0].close-1)*100);
  const signed = n => (n>=0?'+':'')+n.toFixed(2)+'%';
  function chart(lines, unit, title) {
   const vals=lines.flatMap(l=>l.values), lo=Math.min(...vals), hi=Math.max(...vals), pad=Math.max((hi-lo)*.15,unit==='$'?.1:1);
   const min=lo-pad,max=hi+pad;
   const x=i=>54+i/(data.series[0].points.length-1)*552;
   const y=v=>180-(v-min)/(max-min)*150;
   let svg='<svg viewBox="0 0 640 220" role="img" aria-label="'+title+'"><title>'+title+'</title>';
   for(let i=0;i<4;i++){const v=min+(max-min)*i/3;svg+='<line x1="54" x2="606" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#2a384c"/><text x="3" y="'+(y(v)+4)+'" fill="#a3b3c9" font-size="12">'+(unit==='$'?'$':'')+v.toFixed(1)+(unit==='%'?'%':'')+'</text>';}
   if(unit==='%'&&min<0&&max>0)svg+='<line x1="54" x2="606" y1="'+y(0)+'" y2="'+y(0)+'" stroke="#a3b3c9" stroke-dasharray="4 4"/>';
   for(const l of lines)svg+='<path d="'+l.values.map((v,i)=>(i?'L':'M')+x(i).toFixed(2)+','+y(v).toFixed(2)).join(' ')+'" fill="none" stroke="'+l.color+'" stroke-width="3" stroke-linejoin="round"/>';
   return svg+'<text x="54" y="210" fill="#a3b3c9" font-size="12">9 Sep</text><text x="560" y="210" fill="#a3b3c9" font-size="12">8 Oct</text></svg>';
  }
  document.querySelector('#stock-cards').innerHTML=data.series.map((s,i)=>'<article><h3 style="color:'+colors[i]+'">'+s.name+' · '+s.ticker+'</h3><p class="help">'+s.exchange+' · USD</p><p class="metric">$'+s.points.at(-1).close.toFixed(2)+'</p><p class="help">'+signed(percent(s).at(-1))+' over shown period</p>'+chart([{values:s.points.map(p=>p.close),color:colors[i]}],'$',s.name+' daily closing prices in US dollars')+'</article>').join('');
  document.querySelector('#stock-comparison').innerHTML=chart(data.series.map((s,i)=>({values:percent(s),color:colors[i]})),'%', 'Nokia in mint and Intel in blue: percentage change since 9 September 2026');
  const slider=document.querySelector('#stock-day'); slider.max=data.series[0].points.length-1;slider.value=slider.max;
  const readout=()=>{const i=Number(slider.value);document.querySelector('#stock-readout').textContent=data.series[0].points[i].date+' · '+data.series.map(s=>s.name+': $'+s.points[i].close.toFixed(2)+' ('+signed(percent(s)[i])+')').join(' · ');};slider.addEventListener('input',readout);readout();
  document.querySelector('#stock-table').innerHTML='<caption>Daily closing prices (USD)</caption><thead><tr><th>Date</th><th>Nokia</th><th>Intel</th></tr></thead><tbody>'+data.series[0].points.map((p,i)=>'<tr><td>'+p.date+'</td>'+data.series.map(s=>'<td>$'+s.points[i].close.toFixed(2)+'</td>').join('')+'</tr>').join('')+'</tbody>';
 } catch { document.querySelector('#stock-error').textContent='Could not load the stock snapshot. Check your connection and reopen the app.'; }
}
loadStocks();
