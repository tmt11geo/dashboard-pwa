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
 try {const saved=localStorage.getItem('tmt11-map-brightness-green-v2');applyShade(saved===null?60:saved);} catch {applyShade(60);}
 shade.addEventListener('input',()=>{applyShade(shade.value);try{localStorage.setItem('tmt11-map-brightness-green-v2',shade.value);}catch{}});

 const contrast=document.querySelector('#map-contrast'),contrastValue=document.querySelector('#contrast-value');
 function applyContrast(value){
  const parsed=Number(value),n=Number.isFinite(parsed)?Math.min(300,Math.max(100,parsed)):150;
  contrast.value=String(n);contrastValue.value=n+'%';contrastValue.textContent=n+'%';
  const gain=n/100,offset=-.25*(gain-1);
  ['contrast-red','contrast-green','contrast-blue'].forEach(id=>{
   const channel=document.getElementById(id);channel.setAttribute('slope',String(gain));channel.setAttribute('intercept',String(offset));
  });
 }
 try{const saved=localStorage.getItem('tmt11-map-contrast-green-v2');applyContrast(saved===null?150:saved);}catch{applyContrast(150);}
 contrast.addEventListener('input',()=>{applyContrast(contrast.value);try{localStorage.setItem('tmt11-map-contrast-green-v2',contrast.value);}catch{}});

 document.querySelector('#shade-reset').addEventListener('click',()=>{applyShade(60);applyContrast(150);try{localStorage.removeItem('tmt11-map-brightness-green-v2');localStorage.removeItem('tmt11-map-contrast-green-v2');}catch{}});

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
 tiles.on('load',()=>{if(!tileError)status.textContent='';});
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
   map.setView(point,map.getZoom());
   status.textContent='Location found · accuracy about '+Math.round(accuracy)+' m · Pulse radius 30 pixels at every zoom. Tap the crosshair to update.';updateDistance();
  },error=>{locate.disabled=false;status.textContent=error.code===1?'Location permission denied. You can still explore the map. Allow location in your browser settings to try again.':error.code===3?'Location request timed out. Try again outside or near a window.':'Could not determine your location. You can still move around the map.';},{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
 });
 // User markers are separate from the GPS position.
 const pins=new Set();
 let selected=null,nextId=1,holdTimer=null,origin=null,suppressClickUntil=0;

 const pinnedLines=new Set();
 let distanceLayers=[];
 function clearDistance(){distanceLayers.forEach(layer=>map.removeLayer(layer));distanceLayers=[];}
 function bearing(from,to){
  const rad=Math.PI/180,a=from.lat*rad,b=to.lat*rad,d=(to.lng-from.lng)*rad;
  const y=Math.sin(d)*Math.cos(b),x=Math.cos(a)*Math.sin(b)-Math.sin(a)*Math.cos(b)*Math.cos(d);
  return (Math.atan2(y,x)/rad+360)%360;
 }
 const formatBearing=value=>String(Math.round(value)%360).padStart(3,'0')+'°';

 // Clip a screen-space line to the map viewport.
 function visibleSegment(a,b,width,height){
  const dx=b.x-a.x,dy=b.y-a.y;let lo=0,hi=1;
  for(const [p,q] of [[-dx,a.x],[dx,width-a.x],[-dy,a.y],[dy,height-a.y]]){
   if(p===0){if(q<0)return null;continue;}
   const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);
   if(lo>hi)return null;
  }
  return {a:{x:a.x+lo*dx,y:a.y+lo*dy},b:{x:a.x+hi*dx,y:a.y+hi*dy},lo,hi};
 }
 function labelPosition(a,b,size,width,height,occupied){
  const seg=visibleSegment(a,b,size.x,size.y);if(!seg)return null;
  const outside=p=>p.x<0||p.y<0||p.x>size.x||p.y>size.y;
  const offA=outside(a),offB=outside(b),edge=offA||offB;
  const anchor=offB?seg.b:offA?seg.a:{x:(seg.a.x+seg.b.x)/2,y:(seg.a.y+seg.b.y)/2};
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=len?-dy/len:0,ny=len?dx/len:-1;
  const clearance=Math.abs(nx)*width/2+Math.abs(ny)*height/2+10;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const candidates=[];
  for(const side of [1,-1])for(const step of [0,1,-1,2,-2,3,-3]){
   const shift=step*(height+12);
   let x=anchor.x+nx*clearance*side+(len?dx/len*shift:shift);
   let y=anchor.y+ny*clearance*side+(len?dy/len*shift:0);
   x=clamp(x,width/2+8,size.x-width/2-8);y=clamp(y,height/2+8,size.y-height/2-8);
   const rect={left:x-width/2,right:x+width/2,top:y-height/2,bottom:y+height/2};
   const overlap=r=>Math.max(0,Math.min(rect.right,r.right)-Math.max(rect.left,r.left))*Math.max(0,Math.min(rect.bottom,r.bottom)-Math.max(rect.top,r.top));
   let score=Math.hypot(x-anchor.x,y-anchor.y);
   for(const r of occupied)score+=overlap(r)*20;
   score+=overlap({left:0,right:72,top:0,bottom:260})*40;
   const lineDistance=len?Math.abs((x-a.x)*dy-(y-a.y)*dx)/len:Math.hypot(x-a.x,y-a.y);
   score+=Math.max(0,clearance-lineDistance)*15;
   if(edge)score+=Math.min(x-width/2,size.x-x-width/2,y-height/2,size.y-y-height/2)*4;
   candidates.push({x,y,rect,score});
  }
  candidates.sort((a,b)=>a.score-b.score);occupied.push(candidates[0].rect);return candidates[0];
 }

 function updateDistance(){
  clearDistance();
  for(const pin of pins)pin.setStyle(pin===selected?{radius:12,color:'#e0ffe7',weight:3,opacity:1,fillColor:'#adffc1',fillOpacity:1}:{...normalStyle,opacity:.45,fillOpacity:.4});
  if(!marker){if(selected)status.textContent='';return;}
  const targets=new Set();if(selected)targets.add(selected);for(const pin of pinnedLines)targets.add(pin);
  const occupied=[];
  for(const pin of targets){
   const from=marker.getLatLng(),to=pin.getLatLng(),metres=map.distance(from,to),pinned=pinnedLines.has(pin);
   const text=metres<1000?Math.round(metres)+' m':(metres/1000).toFixed(1)+' km';
   const bearings=metres<.1?'—/—':formatBearing(bearing(from,to))+'/'+formatBearing(bearing(to,from));
   const active=pin===selected;
   const zoom=map.getZoom(),compact=zoom<=12;
   const fontSize=zoom<=8?7:zoom<=10?8:compact?9:12;
   const boxWidth=compact?132:200,boxHeight=compact?22:34;
   const a=map.latLngToContainerPoint(from),b=map.latLngToContainerPoint(to);
   const placement=labelPosition(a,b,map.getSize(),boxWidth,boxHeight,occupied);
   if(!placement)continue;
   const mid=map.containerPointToLatLng(L.point(placement.x,placement.y));
   const line=L.polyline([from,to],{color:pinned?'#c4f5b5':'#a4e8b6',weight:2,opacity:active?.9:.3,dashArray:'4 8',lineCap:'round',interactive:false,className:'distance-ants'}).addTo(map);
   const box=document.createElement('button');box.type='button';box.className='distance-label'+(pinned?' pinned':'')+(active?' active':' inactive');box.setAttribute('aria-pressed',String(pinned));
   box.title='Tap to '+(pinned?'unpin':'pin')+' this distance line';
   box.textContent=(compact?'':'M'+pin.pinId+' · ')+(compact?(metres/1000).toFixed(1)+' km':text)+' · '+bearings;
   box.classList.toggle('compact',compact);box.style.fontSize=fontSize+'px';
   box.style.width=boxWidth+'px';box.setAttribute('aria-label','Marker '+pin.pinId+', '+text+', bearings '+bearings);
   L.DomEvent.disableClickPropagation(box);L.DomEvent.disableScrollPropagation(box);
   box.addEventListener('click',event=>{event.stopPropagation();if(pinnedLines.has(pin))pinnedLines.delete(pin);else pinnedLines.add(pin);updateDistance();});
   const label=L.marker(mid,{interactive:true,keyboard:false,icon:L.divIcon({className:'distance-label-host',html:box,iconSize:[boxWidth,boxHeight],iconAnchor:[boxWidth/2,boxHeight/2]})}).addTo(map);
   distanceLayers.push(line,label);
  }
 }
 map.on('movestart zoomstart',()=>map.getContainer().classList.add('map-in-motion'));
 map.on('moveend zoomend resize',()=>{if(!mapMoving&&!mapZooming){map.getContainer().classList.remove('map-in-motion');updateDistance();}});

 const normalStyle={radius:10,color:"#c3ffd0",weight:2,fillColor:"#91e8a7",fillOpacity:.95};
 function deselect(){if(selected)selected.setStyle(normalStyle);selected=null;removeButton.disabled=true;map.closePopup();updateDistance();}
 function select(pin){if(selected)selected.setStyle(normalStyle);selected=pin;pin.setStyle({radius:13,color:"#ffffff",weight:4,fillColor:"#adffc1",fillOpacity:1});removeButton.disabled=false;pin.openPopup();status.textContent='';updateDistance();}
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
   if(selected){const pin=selected;pinnedLines.delete(pin);deselect();map.removeLayer(pin);pins.delete(pin);}
   status.textContent='';
  });
  return box;
 };
 removeControl.addTo(map);
 function cancelHold(){if(holdTimer!==null)clearTimeout(holdTimer);holdTimer=null;origin=null;}
 const container=map.getContainer();
 container.addEventListener('pointerdown',event=>{
  activePointers.add(event.pointerId);cancelHold();
  if(activePointers.size!==1||event.button!==0||event.target.closest('.leaflet-control,.leaflet-marker-icon,.leaflet-popup,.leaflet-interactive,.distance-label-host'))return;
  origin={x:event.clientX,y:event.clientY,id:event.pointerId};
  const point=map.mouseEventToLatLng(event);
  holdTimer=setTimeout(()=>{
   holdTimer=null;origin=null;
   suppressClickUntil=Date.now()+1000;
   if(selected){
    selected.setLatLng(point);label(selected);selected.openPopup();
    status.textContent='';updateDistance();
   } else {
    const pin=L.circleMarker(point,{...normalStyle,bubblingMouseEvents:false}).addTo(map);
    pin.pinId=nextId++;pins.add(pin);pinnedLines.add(pin);label(pin);
    pin.on('click',()=>select(pin));
    pin.on('add',()=>{});
    const element=pin.getElement();
    if(element){element.setAttribute('tabindex','0');element.setAttribute('role','button');element.setAttribute('aria-label','Select marker '+pin.pinId);element.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(pin);}});}
    select(pin);
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
 map.on('click',()=>{if(Date.now()<suppressClickUntil)return;deselect();status.textContent='';});

})();