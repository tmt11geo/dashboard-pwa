"use strict";
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
(() => {
 let pendingInstall=null;
 const android=document.querySelector('#install-android'),iphone=document.querySelector('#install-iphone'),help=document.querySelector('#install-help');
 if(!android||!iphone||!help)return;
 const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const showInstalled=()=>{if(standalone()){help.textContent='Tactical is running as an installed app.';return true;}return false;};
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pendingInstall=event;});
 window.addEventListener('appinstalled',()=>{pendingInstall=null;help.textContent='Tactical installed. Open it from your home screen or app drawer.';});
 android.addEventListener('click',async()=>{
  if(showInstalled())return;
  if(!pendingInstall){help.textContent='Open Tactical in Chrome on Android. Tap ⋮ → Add to Home screen → Install. If you see Open in app, Tactical is already installed.';return;}
  const event=pendingInstall;pendingInstall=null;
  try{await event.prompt();const choice=await event.userChoice;help.textContent=choice.outcome==='accepted'?'Installation requested. Follow your browser’s confirmation.':'You can install later using Chrome’s menu.';}
  catch{help.textContent='In Chrome on Android, tap ⋮ → Add to Home screen → Install.';}
 });
 iphone.addEventListener('click',()=>{
  if(showInstalled())return;
  help.textContent='On iPhone, open this page in Safari. Tap Share (the square with an upward arrow) → Add to Home Screen → Add. Enable Open as Web App if offered. You may need to scroll through the Share actions to find it.';
 });
 showInstalled();
})();
