"use strict";
(() => {
 const status=document.querySelector('#status');
 if(!window.L){status.textContent='Map library could not load. Check your internet connection and reload.';return;}

 const shade=document.querySelector('#map-shade'),shadeValue=document.querySelector('#shade-value');
 function applyShade(value){
  const n=Math.min(105,Math.max(45,Number(value)||60));
  shade.value=String(n);shadeValue.value=n+'%';shadeValue.textContent=n+'%';
  document.querySelector('#map').style.setProperty('--map-brightness',String(n/100));
 }
 try {const saved=localStorage.getItem('tmt11-map-brightness');applyShade(saved===null?60:saved);} catch {applyShade(60);}
 shade.addEventListener('input',()=>{applyShade(shade.value);try{localStorage.setItem('tmt11-map-brightness',shade.value);}catch{}});

 const contrast=document.querySelector('#map-contrast'),contrastValue=document.querySelector('#contrast-value');
 function applyContrast(value){
  const parsed=Number(value),n=Number.isFinite(parsed)?Math.min(300,Math.max(100,parsed)):250;
  contrast.value=String(n);contrastValue.value=n+'%';contrastValue.textContent=n+'%';
  const gain=n/100,offset=-.035*(gain-1);
  ['contrast-red','contrast-green','contrast-blue'].forEach(id=>{
   const channel=document.getElementById(id);channel.setAttribute('slope',String(gain));channel.setAttribute('intercept',String(offset));
  });
 }
 try{const saved=localStorage.getItem('tmt11-map-contrast');applyContrast(saved===null?250:saved);}catch{applyContrast(250);}
 contrast.addEventListener('input',()=>{applyContrast(contrast.value);try{localStorage.setItem('tmt11-map-contrast',contrast.value);}catch{}});

 document.querySelector('#shade-reset').addEventListener('click',()=>{applyShade(60);applyContrast(250);try{localStorage.removeItem('tmt11-map-brightness');localStorage.removeItem('tmt11-map-contrast');}catch{}});

 const map=L.map('map',{zoomControl:false,tapHold:false}).setView([61.48,23.63],11);
 let locate;
 const locationControl=L.control({position:'topleft'});
 locationControl.onAdd=()=>{
  const box=L.DomUtil.create('div','leaflet-bar marker-control location-control');
  locate=L.DomUtil.create('button','locate-target',box);
  locate.type='button';locate.innerHTML="<svg viewBox=\"0 0 32 32\" width=\"28\" height=\"28\" aria-hidden=\"true\" focusable=\"false\"><circle cx=\"16\" cy=\"16\" r=\"8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"/><path d=\"M16 2v8m0 12v8M2 16h8m12 0h8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/><circle cx=\"16\" cy=\"16\" r=\"3\" fill=\"currentColor\"/></svg>";locate.title='Locate me';locate.setAttribute('aria-label','Locate me');
  L.DomEvent.disableClickPropagation(box);L.DomEvent.disableScrollPropagation(box);
  return box;
 };
 locationControl.addTo(map);
 L.control.zoom({position:'topleft'}).addTo(map);
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',updateWhenIdle:true,keepBuffer:1}).addTo(map);
 L.control.scale({imperial:false}).addTo(map);
 let tileError=false,marker,circle;
 const pulseRadius=30; // Screen pixels, independent of map zoom.
 let pulseLayers=[],pulseFrame=null,pulseOrigin=0;
 let mapMoving=false,mapZooming=false;
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 function stopPulse(){if(pulseFrame!==null)cancelAnimationFrame(pulseFrame);pulseFrame=null;}
 function animatePulse(time){
  if(document.hidden||reducedMotion.matches||mapMoving||mapZooming){pausePulse();return;}
  if(!pulseOrigin)pulseOrigin=time;
  pulseLayers.forEach((ring,i)=>{
   const phase=((time-pulseOrigin)/2600+i*.5)%1;
   ring.setRadius(Math.max(.1,pulseRadius*phase));
   ring.setStyle({opacity:.45*(1-phase)});
  });
  pulseFrame=requestAnimationFrame(animatePulse);
 }
 function restartPulse(){
  stopPulse();pulseOrigin=0;
  pulseLayers.forEach(ring=>ring.setStyle({opacity:0}));
  if(pulseLayers.length&&!document.hidden&&!reducedMotion.matches&&!mapMoving&&!mapZooming)pulseFrame=requestAnimationFrame(animatePulse);
 }
 function pausePulse(){stopPulse();pulseLayers.forEach(ring=>ring.setStyle({opacity:0}));}
 map.on('movestart',()=>{mapMoving=true;pausePulse();});
 map.on('zoomstart',()=>{mapZooming=true;pausePulse();});
 map.on('moveend',()=>{mapMoving=false;restartPulse();});
 map.on('zoomend',()=>{mapZooming=false;restartPulse();});
 document.addEventListener('visibilitychange',restartPulse);
 reducedMotion.addEventListener('change',restartPulse);
 tiles.on('tileerror',()=>{tileError=true;status.textContent='Some map tiles could not load. Check your connection or move the map to retry.';});
 tiles.on('loading',()=>{tileError=false;});
 tiles.on('load',()=>{if(!tileError)status.textContent='Ready to explore. Location stays off until requested.';});
 const coordinates=()=>{const c=map.getCenter();document.querySelector('#coordinates').textContent=c.lat.toFixed(5)+'°, '+c.lng.toFixed(5)+'° · Zoom '+map.getZoom();};
 map.on('moveend zoomend',coordinates);coordinates();
 locate.disabled=false;
 locate.addEventListener('click',()=>{
  if(!navigator.geolocation){status.textContent='Location is unavailable in this browser.';return;}
  locate.disabled=true;status.textContent='Finding your location…';
  navigator.geolocation.getCurrentPosition(position=>{
   locate.disabled=false;const {latitude,longitude,accuracy}=position.coords,point=[latitude,longitude];
   stopPulse();pulseLayers.forEach(ring=>map.removeLayer(ring));pulseLayers=[];
   if(marker)map.removeLayer(marker);if(circle)map.removeLayer(circle);
   circle=L.circleMarker(point,{radius:pulseRadius,color:'#85c99b',weight:1,opacity:.4,fillColor:'#85efaa',fillOpacity:.04,interactive:false}).addTo(map);
   pulseLayers=[0,1].map(()=>L.circleMarker(point,{radius:.1,color:'#a4f3bc',weight:2,opacity:0,fill:false,interactive:false}).addTo(map));
   marker=L.circleMarker(point,{radius:5,color:'#c3ffd0',weight:1.5,fillColor:'#85efaa',fillOpacity:1}).addTo(map).bindPopup('Your location · 30 px display radius (not GPS accuracy)');
   restartPulse();
   map.setView(point,16);
   status.textContent='Location found · accuracy about '+Math.round(accuracy)+' m · Pulse radius 30 pixels at every zoom. Tap the crosshair to update.';
  },error=>{locate.disabled=false;status.textContent=error.code===1?'Location permission denied. You can still explore the map. Allow location in your browser settings to try again.':error.code===3?'Location request timed out. Try again outside or near a window.':'Could not determine your location. You can still move around the map.';},{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
 });
 // User markers are separate from the GPS position.
 const pins=new Set();
 let selected=null,nextId=1,holdTimer=null,origin=null,suppressClickUntil=0;
 const normalStyle={radius:10,color:"#c3ffd0",weight:2,fillColor:"#91e8a7",fillOpacity:.95};
 function deselect(){if(selected)selected.setStyle(normalStyle);selected=null;removeButton.disabled=true;map.closePopup();}
 function select(pin){if(selected)selected.setStyle(normalStyle);selected=pin;pin.setStyle({radius:13,color:"#ffffff",weight:4,fillColor:"#adffc1",fillOpacity:1});removeButton.disabled=false;pin.openPopup();status.textContent="Marker "+pin.pinId+" selected. Long press elsewhere to move it; × removes it. Tap empty map to deselect and add more.";}
 function label(pin){const p=pin.getLatLng();pin.bindPopup("Marker "+pin.pinId+"<br>"+p.lat.toFixed(5)+"°, "+p.lng.toFixed(5)+"°");}
 const activePointers=new Set();
 const removeControl=L.control({position:'topleft'});
 let removeButton;
 removeControl.onAdd=()=>{
  const box=L.DomUtil.create('div','leaflet-bar marker-control');
  removeButton=L.DomUtil.create('button','remove-marker',box);
  removeButton.type='button';removeButton.textContent='×';
  removeButton.title='Remove selected marker';removeButton.setAttribute('aria-label','Remove selected marker');removeButton.disabled=true;
  L.DomEvent.disableClickPropagation(box);L.DomEvent.disableScrollPropagation(box);
  removeButton.addEventListener('click',()=>{
   if(selected){const pin=selected;deselect();map.removeLayer(pin);pins.delete(pin);}
   status.textContent='Marker removed. Long press to add another, or tap an existing marker to select it.';
  });
  return box;
 };
 removeControl.addTo(map);
 function cancelHold(){if(holdTimer!==null)clearTimeout(holdTimer);holdTimer=null;origin=null;}
 const container=map.getContainer();
 container.addEventListener('pointerdown',event=>{
  activePointers.add(event.pointerId);cancelHold();
  if(activePointers.size!==1||event.button!==0||event.target.closest('.leaflet-control,.leaflet-marker-icon,.leaflet-popup,.leaflet-interactive'))return;
  origin={x:event.clientX,y:event.clientY,id:event.pointerId};
  const point=map.mouseEventToLatLng(event);
  holdTimer=setTimeout(()=>{
   holdTimer=null;origin=null;
   suppressClickUntil=Date.now()+1000;
   if(selected){
    selected.setLatLng(point);label(selected);selected.openPopup();
    status.textContent='Marker '+selected.pinId+' moved. Tap empty map to deselect, or × to remove it.';
   } else {
    const pin=L.circleMarker(point,{...normalStyle,bubblingMouseEvents:false}).addTo(map);
    pin.pinId=nextId++;pins.add(pin);label(pin);
    pin.on('click',()=>select(pin));
    pin.on('add',()=>{});
    const element=pin.getElement();
    if(element){element.setAttribute('tabindex','0');element.setAttribute('role','button');element.setAttribute('aria-label','Select marker '+pin.pinId);element.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(pin);}});}
    status.textContent='Marker '+pin.pinId+' added. Long press to add more. Tap a marker to select, move or remove it.';
   }
  },650);
 });
 container.addEventListener('pointermove',event=>{
  if(origin&&event.pointerId===origin.id&&Math.hypot(event.clientX-origin.x,event.clientY-origin.y)>10)cancelHold();
 });
 const endPress=event=>{activePointers.delete(event.pointerId);cancelHold();};
 window.addEventListener('pointerup',endPress);window.addEventListener('pointercancel',endPress);
 window.addEventListener('blur',()=>{activePointers.clear();cancelHold();});
 container.addEventListener('contextmenu',event=>{if(!event.target.closest('.leaflet-control'))event.preventDefault();});
 map.on('zoomstart',cancelHold);
 map.on('click',()=>{if(Date.now()<suppressClickUntil)return;deselect();status.textContent='Long press to add a marker. Tap an existing marker to move or remove it.';});

})();