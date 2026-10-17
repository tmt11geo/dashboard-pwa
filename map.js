"use strict";
(() => {
 const status=document.querySelector('#status');
 if(!window.L){status.textContent='Map library could not load. Check your internet connection and reload.';return;}


 const themeSelect=document.querySelector('#map-theme');
 function applyTheme(theme){
  const value=theme==='red'?'red':'green';
  document.body.dataset.theme=value;themeSelect.value=value;
  document.querySelector('meta[name="theme-color"]').setAttribute('content',value==='red'?'#100707':'#07100b');
 }
 try{applyTheme(localStorage.getItem('tactical-theme'));}catch{applyTheme('green');}
 themeSelect.addEventListener('change',()=>{applyTheme(themeSelect.value);loadThemeShading();try{localStorage.setItem('tactical-theme',themeSelect.value);}catch{}});

 const shade=document.querySelector('#map-shade'),shadeValue=document.querySelector('#shade-value');
 function applyShade(value){
  const n=Math.min(themeSelect.value==='red'?155:105,Math.max(45,Number(value)||60));
  shade.value=String(n);shadeValue.value=n+'%';shadeValue.textContent=n+'%';
  document.querySelector('#map').style.setProperty('--map-brightness',String(n/100));
 }

 shade.addEventListener('input',()=>{applyShade(shade.value);try{localStorage.setItem(shadingKey('brightness'),shade.value);}catch{}});

 const contrast=document.querySelector('#map-contrast'),contrastValue=document.querySelector('#contrast-value');
 function applyContrast(value){
  const parsed=Number(value),n=Number.isFinite(parsed)?Math.min(300,Math.max(100,parsed)):150;
  contrast.value=String(n);contrastValue.value=n+'%';contrastValue.textContent=n+'%';
  const gain=n/100,offset=-.25*(gain-1);
  ['contrast-red','contrast-green','contrast-blue','red-map-contrast-r','red-map-contrast-g','red-map-contrast-b'].forEach(id=>{
   const channel=document.getElementById(id);channel.setAttribute('slope',String(gain));channel.setAttribute('intercept',String(offset));
  });
 }

 contrast.addEventListener('input',()=>{applyContrast(contrast.value);try{localStorage.setItem(shadingKey('contrast'),contrast.value);}catch{}});

 function shadingKey(kind){return 'tmt11-map-'+kind+'-'+(themeSelect.value==='red'?'red-v2':'green-v2');}
 function defaultBrightness(){return themeSelect.value==='red'?100:60;}
 function defaultContrast(){return themeSelect.value==='red'?120:150;}
 function loadThemeShading(){
  shade.max=themeSelect.value==='red'?'155':'105';
  let brightness=defaultBrightness(),detail=defaultContrast();
  try{const b=localStorage.getItem(shadingKey('brightness')),c=localStorage.getItem(shadingKey('contrast'));if(b!==null)brightness=b;if(c!==null)detail=c;}catch{}
  applyShade(brightness);applyContrast(detail);
 }
 loadThemeShading();
 document.querySelector('#shade-reset').addEventListener('click',()=>{
  applyShade(defaultBrightness());applyContrast(defaultContrast());
  try{localStorage.removeItem(shadingKey('brightness'));localStorage.removeItem(shadingKey('contrast'));}catch{}
 });

 const map=L.map('map',{zoomControl:false,tapHold:false}).setView([61.48,23.63],11);
 let locate,tracking,follow;
 const locationControl=L.control({position:'topleft'});
 locationControl.onAdd=()=>{
  const box=L.DomUtil.create('div','leaflet-bar marker-control location-control');
  locate=L.DomUtil.create('button','locate-target',box);
  locate.type='button';locate.innerHTML="<svg viewBox=\"0 0 32 32\" width=\"28\" height=\"28\" aria-hidden=\"true\" focusable=\"false\"><circle cx=\"16\" cy=\"16\" r=\"8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"/><path d=\"M16 2v8m0 12v8M2 16h8m12 0h8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"/><circle cx=\"16\" cy=\"16\" r=\"3\" fill=\"currentColor\"/></svg>";locate.title='Locate me';locate.setAttribute('aria-label','Locate me');
  L.DomEvent.disableClickPropagation(box);L.DomEvent.disableScrollPropagation(box);
  function toggleButton(name,icon){
   const button=L.DomUtil.create('button','map-toggle',box);
   button.type='button';button.innerHTML=icon;
   Object.defineProperty(button,'checked',{get(){return button.getAttribute('aria-pressed')==='true';},set(value){button.setAttribute('aria-pressed',String(Boolean(value)));button.classList.toggle('is-active',Boolean(value));button.title=name+': '+(value?'on':'off');button.setAttribute('aria-label',name);}});
   button.checked=false;
   button.addEventListener('click',()=>{button.checked=!button.checked;button.dispatchEvent(new Event('change'));});
   return button;
  }
  tracking=toggleButton('Tracking',"<svg viewBox=\"0 0 32 32\" width=\"25\" height=\"25\" aria-hidden=\"true\"><circle cx=\"16\" cy=\"16\" r=\"3\" fill=\"currentColor\"/><circle cx=\"16\" cy=\"16\" r=\"8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"/><path d=\"M6 6a14 14 0 0 0 0 20M26 6a14 14 0 0 1 0 20\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\"/></svg>");
  follow=toggleButton('Follow me',"<svg viewBox=\"0 0 32 32\" width=\"25\" height=\"25\" aria-hidden=\"true\"><path d=\"M16 5 25 26 16 21 7 26Z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linejoin=\"round\"/><path d=\"M3 13V6h7m19 7V6h-7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>");
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


 let watchId=null,lastTrackDraw=0,pendingPosition=null,trackTimer=null;
 function showPosition(position,recenter){
  const {latitude,longitude,accuracy}=position.coords,point=[latitude,longitude];
  if(marker){
   marker.setLatLng(point);circle.setLatLng(point);pulseLayers.forEach(ring=>ring.setLatLng(point));
  }else{
   circle=L.circleMarker(point,{className:'location-boundary',radius:pulseRadius,color:'#85c99b',weight:1,opacity:.4,fillColor:'#85efaa',fillOpacity:.04,interactive:false}).addTo(map);
   pulseLayers=[0,1].map(()=>L.circleMarker(point,{className:'location-pulse',radius:.1,color:'#a4f3bc',weight:2,opacity:0,fill:false,interactive:false}).addTo(map));
   marker=L.circleMarker(point,{className:'location-dot',radius:5,color:'#c3ffd0',weight:1.5,fillColor:'#85efaa',fillOpacity:1}).addTo(map);
   restartPulse();
  }
  marker.bindPopup('Your location · accuracy about '+Math.round(accuracy)+' m');
  if(recenter)map.setView(point,map.getZoom());
  status.textContent=(tracking.checked?'Tracking':'Location updated')+' · accuracy about '+Math.round(accuracy)+' m';
  updateDistance();
 }
 function locationError(error){
  status.textContent=error.code===1?'Location permission denied. Allow location in browser settings to try again.':error.code===3?'Location request timed out.':'Could not determine your location.';
  if(error.code===1){tracking.checked=false;follow.checked=false;stopTracking();}
 }
 function locateUser(){
  if(!navigator.geolocation){status.textContent='Location is unavailable in this browser.';return;}
  locate.disabled=true;status.textContent='Finding your location…';
  navigator.geolocation.getCurrentPosition(position=>{locate.disabled=false;showPosition(position,true);},error=>{locate.disabled=false;locationError(error);},{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
 }
 function stopTracking(){
  if(watchId!==null)navigator.geolocation.clearWatch(watchId);
  watchId=null;if(trackTimer!==null)clearTimeout(trackTimer);trackTimer=null;pendingPosition=null;
 }
 function drawTracked(){
  trackTimer=null;
  if(!tracking.checked||document.hidden||!pendingPosition)return;
  const position=pendingPosition;pendingPosition=null;lastTrackDraw=Date.now();
  showPosition(position,follow.checked);
 }
 function startTracking(){
  stopTracking();
  if(!tracking.checked||document.hidden)return;
  if(!navigator.geolocation){tracking.checked=false;follow.checked=false;status.textContent='Location is unavailable in this browser.';return;}
  lastTrackDraw=0;
  watchId=navigator.geolocation.watchPosition(position=>{
   if(!tracking.checked||document.hidden)return;
   pendingPosition=position;
   const delay=Math.max(0,2000-(Date.now()-lastTrackDraw));
   if(!delay){if(trackTimer!==null)clearTimeout(trackTimer);drawTracked();}
   else if(trackTimer===null)trackTimer=setTimeout(drawTracked,delay);
  },locationError,{enableHighAccuracy:true,timeout:20000,maximumAge:1000});
 }
 tracking.addEventListener('change',()=>{if(tracking.checked)startTracking();else{follow.checked=false;stopTracking();status.textContent='Tracking off';}});
 follow.addEventListener('change',()=>{if(follow.checked){if(!tracking.checked){tracking.checked=true;startTracking();}if(marker)map.setView(marker.getLatLng(),map.getZoom());}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTracking();else if(tracking.checked)startTracking();});
 window.addEventListener('pagehide',stopTracking);
 window.addEventListener('pageshow',()=>{if(tracking.checked&&watchId===null)startTracking();});
 map.on('dragstart',()=>{follow.checked=false;});
 locate.addEventListener('click',locateUser);
 // User markers are separate from the GPS position.
 const pins=new Set();
 let moveArmed=false;
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
 function labelPosition(a,b,size,width,height,occupied,controls=[]){
  const seg=visibleSegment(a,b,size.x,size.y);if(!seg)return null;
  const outside=p=>p.x<0||p.y<0||p.x>size.x||p.y>size.y;
  const offA=outside(a),offB=outside(b),edge=offA||offB;
  const anchor=offB?seg.b:offA?seg.a:{x:(seg.a.x+seg.b.x)/2,y:(seg.a.y+seg.b.y)/2};
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=len?-dy/len:0,ny=len?dx/len:-1;
  const clearance=Math.abs(nx)*width/2+Math.abs(ny)*height/2+10;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const candidates=[],positions=[];
  for(const side of [1,-1])for(const step of [0,1,-1,2,-2,3,-3]){
   const shift=step*(height+12);
   let x=anchor.x+nx*clearance*side+(len?dx/len*shift:shift);
   let y=anchor.y+ny*clearance*side+(len?dy/len*shift:0);
   x=clamp(x,width/2+8,size.x-width/2-8);y=clamp(y,height/2+8,size.y-height/2-8);
   positions.push({x,y});
  }
  // Fallback positions allow labels to move away from crowded control corners.
  for(let y=height/2+8;y<=size.y-height/2-8;y+=Math.max(height+12,24)){
   for(let x=width/2+8;x<=size.x-width/2-8;x+=Math.max(width/2,40))positions.push({x,y});
   positions.push({x:size.x-width/2-8,y});
  }
  for(const {x,y} of positions){
   const rect={left:x-width/2,right:x+width/2,top:y-height/2,bottom:y+height/2};
   const overlap=r=>Math.max(0,Math.min(rect.right,r.right)-Math.max(rect.left,r.left))*Math.max(0,Math.min(rect.bottom,r.bottom)-Math.max(rect.top,r.top));
   if(controls.some(r=>overlap(r)>0))continue;
   let score=Math.hypot(x-anchor.x,y-anchor.y);
   for(const r of occupied){
    score+=overlap(r)*100;
    // Repel nearby boxes even when their rectangles do not overlap.
    const gapX=Math.max(0,r.left-rect.right,rect.left-r.right);
    const gapY=Math.max(0,r.top-rect.bottom,rect.top-r.bottom);
    const gap=Math.hypot(gapX,gapY);
    score+=Math.pow(Math.max(0,52-gap),2)*.35;
   }

   const lineDistance=len?Math.abs((x-a.x)*dy-(y-a.y)*dx)/len:Math.hypot(x-a.x,y-a.y);
   score+=Math.max(0,clearance-lineDistance)*15;
   if(edge)score+=Math.min(x-width/2,size.x-x-width/2,y-height/2,size.y-y-height/2)*4;
   candidates.push({x,y,rect,score});
  }
  if(!candidates.length)return null;
  candidates.sort((a,b)=>a.score-b.score);occupied.push(candidates[0].rect);return candidates[0];
 }


 function leaderEndpoints(center,a,b,width,height){
  const dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy;
  const t=length2?Math.max(0,Math.min(1,((center.x-a.x)*dx+(center.y-a.y)*dy)/length2)):0;
  const junction={x:a.x+t*dx,y:a.y+t*dy};
  const vx=junction.x-center.x,vy=junction.y-center.y;
  if(Math.abs(vx)<=width/2&&Math.abs(vy)<=height/2)return null;
  const factor=Math.min(vx?width/2/Math.abs(vx):Infinity,vy?height/2/Math.abs(vy):Infinity);
  return {edge:{x:center.x+vx*factor,y:center.y+vy*factor},junction};
 }

 function updateDistance(){
  updateCompass();
  clearDistance();
  for(const pin of pins)pin.setStyle(pin===selected?{radius:12,color:'#e0ffe7',weight:3,opacity:1,fillColor:'#adffc1',fillOpacity:1,dashArray:moveArmed?'3 3':null}:{...normalStyle,opacity:.45,fillOpacity:.4,dashArray:null});
  for(const pin of pins)pin.getElement()?.classList.toggle('selected-pin',pin===selected);
  if(!marker){if(selected)status.textContent='';return;}
  const targets=new Set();if(selected)targets.add(selected);for(const pin of pinnedLines)targets.add(pin);
  const occupied=[];
  const container=map.getContainer(),bounds=container.getBoundingClientRect(),size=map.getSize();
  const sx=size.x/bounds.width,sy=size.y/bounds.height;
  const controls=Array.from(container.querySelectorAll('.leaflet-control')).map(control=>{
   const r=control.getBoundingClientRect();
   return {left:(r.left-bounds.left)*sx-8,right:(r.right-bounds.left)*sx+8,top:(r.top-bounds.top)*sy-8,bottom:(r.bottom-bounds.top)*sy+8};
  });
  // Keep callouts clear of every visible user marker and the location dot.
  const markerObstacles=[];
  for(const dot of [...pins,marker]){
   if(!dot)continue;
   const point=map.latLngToContainerPoint(dot.getLatLng());
   const radius=(dot===marker?9:dot===selected?16:13)+6;
   if(point.x+radius<0||point.y+radius<0||point.x-radius>size.x||point.y-radius>size.y)continue;
   markerObstacles.push({left:point.x-radius,right:point.x+radius,top:point.y-radius,bottom:point.y+radius});
  }
  controls.push(...markerObstacles);
  for(const pin of targets){
   const from=marker.getLatLng(),to=pin.getLatLng(),metres=map.distance(from,to),pinned=pinnedLines.has(pin);
   const text=metres<1000?Math.round(metres)+' m':(metres/1000).toFixed(1)+' km';
   const bearings=metres<.1?'—/—':formatBearing(bearing(from,to))+'/'+formatBearing(bearing(to,from));
   const active=pin===selected;
   const zoom=map.getZoom(),compact=zoom<=12;
   const fontSize=zoom<=8?7:zoom<=10?8:compact?9:12;
   const box=document.createElement('button');box.type='button';box.className='distance-label'+(pinned?' pinned':'')+(active?' active':' inactive');box.setAttribute('aria-pressed',String(pinned));
   box.title='Tap to '+(pinned?'unpin':'pin')+' this distance line';
   box.textContent=(compact?'':'M'+pin.pinId+' · ')+(compact?(metres/1000).toFixed(1)+' km':text)+' · '+bearings;
   box.classList.toggle('compact',compact);box.style.fontSize=fontSize+'px';
   box.setAttribute('aria-label','Marker '+pin.pinId+', '+text+', bearings '+bearings);
   // Measure the actual rendered label so collision and edge placement match its content.
   box.style.position='absolute';box.style.visibility='hidden';
   map.getContainer().appendChild(box);
   const bounds=box.getBoundingClientRect(),boxWidth=Math.ceil(bounds.width),boxHeight=Math.ceil(bounds.height);
   box.remove();box.style.removeProperty('position');box.style.removeProperty('visibility');
   const a=map.latLngToContainerPoint(from),b=map.latLngToContainerPoint(to);
   const placement=labelPosition(a,b,map.getSize(),boxWidth,boxHeight,occupied,controls);
   if(!placement)continue;
   const mid=map.containerPointToLatLng(L.point(placement.x,placement.y));
   const line=L.polyline([from,to],{color:pinned?'#c4f5b5':'#a4e8b6',weight:2,opacity:active?.9:.3,dashArray:'4 8',lineCap:'round',interactive:false,className:'distance-ants'+(active?' active-measurement':' inactive-measurement')}).addTo(map);
   L.DomEvent.disableClickPropagation(box);L.DomEvent.disableScrollPropagation(box);
   box.addEventListener('click',event=>{event.stopPropagation();if(pinnedLines.has(pin))pinnedLines.delete(pin);else pinnedLines.add(pin);updateDistance();});
   const label=L.marker(mid,{interactive:true,keyboard:false,icon:L.divIcon({className:'distance-label-host',html:box,iconSize:[boxWidth,boxHeight],iconAnchor:[boxWidth/2,boxHeight/2]})}).addTo(map);
   const segment=visibleSegment(a,b,map.getSize().x,map.getSize().y);
   const leader=segment&&leaderEndpoints(placement,segment.a,segment.b,boxWidth,boxHeight);
   if(leader){
    const edge=map.containerPointToLatLng(L.point(leader.edge.x,leader.edge.y));
    const junction=map.containerPointToLatLng(L.point(leader.junction.x,leader.junction.y));
    const connector=L.polyline([edge,junction],{color:'#b5e9be',weight:1,opacity:active?.8:.3,interactive:false,className:'distance-leader'}).addTo(map);
    const dot=L.circleMarker(junction,{radius:2.5,color:'#b5e9be',weight:0,fillColor:'#b5e9be',fillOpacity:active?.9:.35,interactive:false,className:'distance-leader'}).addTo(map);
    distanceLayers.push(connector,dot);
   }
   distanceLayers.push(line,label);
  }
 }
 map.on('movestart zoomstart',()=>map.getContainer().classList.add('map-in-motion'));
 map.on('moveend zoomend resize',()=>{if(!mapMoving&&!mapZooming){map.getContainer().classList.remove('map-in-motion');updateDistance();}});

 const normalStyle={radius:10,color:"#c3ffd0",weight:2,fillColor:"#91e8a7",fillOpacity:.95};
 function deselect(){moveArmed=false;if(selected)selected.setStyle(normalStyle);selected=null;removeButton.disabled=true;map.closePopup();updateDistance();}
 function select(pin){moveArmed=false;if(selected)selected.setStyle(normalStyle);selected=pin;pin.setStyle({radius:13,color:"#ffffff",weight:4,fillColor:"#adffc1",fillOpacity:1});removeButton.disabled=false;pin.openPopup();status.textContent='';updateDistance();}
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
  if(activePointers.size!==1||event.button!==0)return;
  const heldPin=Array.from(pins).find(pin=>{const el=pin.getElement();return el&&(el===event.target||el.contains(event.target));});
  if(heldPin){
   origin={x:event.clientX,y:event.clientY,id:event.pointerId};
   holdTimer=setTimeout(()=>{
    holdTimer=null;origin=null;suppressClickUntil=Date.now()+1000;
    select(heldPin);moveArmed=true;updateDistance();
    status.textContent='Marker '+heldPin.pinId+' unlocked. Long press its new position.';
   },650);
   return;
  }
  if(event.target.closest('.leaflet-control,.leaflet-marker-icon,.leaflet-popup,.leaflet-interactive,.distance-label-host'))return;
  origin={x:event.clientX,y:event.clientY,id:event.pointerId};
  const point=map.mouseEventToLatLng(event);
  holdTimer=setTimeout(()=>{
   holdTimer=null;origin=null;
   suppressClickUntil=Date.now()+1000;
   if(selected&&moveArmed){
    moveArmed=false;
    selected.setLatLng(point);label(selected);selected.openPopup();
    status.textContent='';updateDistance();
   } else {
    const pin=L.circleMarker(point,{...normalStyle,bubblingMouseEvents:false,className:'user-pin'}).addTo(map);
    pin.pinId=nextId++;pins.add(pin);pinnedLines.add(pin);label(pin);
    pin.on('click',()=>{if(Date.now()<suppressClickUntil)return;select(pin);});
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


 // Optional phone compass. Never use relative-only alpha as a north heading.
 let compassEnabled=false,compassHeading=null,lastHeadingAt=0,compassTimer=null,compassReference='';
 const compassControl=L.control({position:'topleft'});
 let compassButton;
 compassControl.onAdd=()=>{
  const box=L.DomUtil.create('div','leaflet-bar marker-control');
  compassButton=L.DomUtil.create('button','map-toggle compass-toggle',box);
  compassButton.type='button';compassButton.title='Compass';compassButton.setAttribute('aria-label','Enable phone compass');compassButton.setAttribute('aria-pressed','false');
  compassButton.innerHTML='<svg viewBox="0 0 32 32" width="25" height="25" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m21 9-3 10-7 4 3-10Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="16" r="2" fill="currentColor"/></svg>';
  L.DomEvent.disableClickPropagation(box);return box;
 };
 compassControl.addTo(map);
 const dialControl=L.control({position:'topright'});
 let compassPanel,northNeedle,targetNeedle,headingText,compassNote;
 dialControl.onAdd=()=>{
  compassPanel=L.DomUtil.create('div','compass-panel');
  compassPanel.hidden=true;
  compassPanel.innerHTML='<svg viewBox="0 0 120 120" width="112" height="112" aria-label="Phone compass"><circle cx="60" cy="60" r="48" fill="none" stroke="#4e7459"/><path d="M60 5v9m55 46h-9M60 115v-9M5 60h9" stroke="#a1c9ac"/><path d="m55 5 5-5 5 5" fill="none" stroke="#daffe4"/><g class="north-needle"><path d="M60 23 54 42h12Z" fill="#b8f2c5"/><text x="60" y="20" text-anchor="middle" fill="#d5ffe0" font-size="12">N</text></g><g class="target-needle"><path d="m60 29-5 13h10Z" fill="#e6cc86"/><path d="M60 43v12" stroke="#e6cc86" stroke-width="2"/></g><circle cx="60" cy="60" r="3" fill="#c3ffd0"/></svg><strong class="compass-heading">—</strong><span class="compass-note">Waiting for heading</span>';
  northNeedle=compassPanel.querySelector('.north-needle');targetNeedle=compassPanel.querySelector('.target-needle');headingText=compassPanel.querySelector('.compass-heading');compassNote=compassPanel.querySelector('.compass-note');
  targetNeedle.style.display='none';L.DomEvent.disableClickPropagation(compassPanel);L.DomEvent.disableScrollPropagation(compassPanel);return compassPanel;
 };
 dialControl.addTo(map);

 let declinationCache=null;
 function localDeclination(){
  if(!marker||!window.TacticalMagnetic)return null;
  const p=marker.getLatLng(),date=new Date(),year=date.getUTCFullYear();
  if(year<2025||year>=2030)return null;
  const key=p.lat.toFixed(2)+','+p.lng.toFixed(2)+','+date.toISOString().slice(0,10);
  if(declinationCache?.key===key)return declinationCache.value;
  try{const field=window.TacticalMagnetic.magneticField(p.lat,p.lng,0,date);
   const value=field.h>=2000&&Number.isFinite(field.declination)?field.declination:null;
   declinationCache={key,value};return value;
  }catch{return null;}
 }

 function updateCompass(){
  if(!compassEnabled)return;
  if(compassHeading===null||Date.now()-lastHeadingAt>5000){
   headingText.textContent='—';northNeedle.style.display='none';targetNeedle.style.display='none';
   compassNote.textContent='No heading · hold phone flat';return;
  }
  const correction=localDeclination();
  const inputTrue=document.querySelector('#compass-reference').value==='true';
  const useTrue=document.querySelector('#true-north').checked;
  let heading=compassHeading;
  if(useTrue&&!inputTrue&&correction===null){
   headingText.textContent='—';northNeedle.style.display='none';targetNeedle.style.display='none';
   compassNote.textContent='True north needs a valid location / WMM2025 model';return;
  }
  if(useTrue&&!inputTrue)heading=(heading+correction+360)%360;
  if(!useTrue&&inputTrue&&correction!==null)heading=(heading-correction+360)%360;
  const isTrue=useTrue||inputTrue&&correction===null;
  northNeedle.style.display='';northNeedle.setAttribute('transform','rotate('+(-heading)+' 60 60)');
  headingText.textContent=formatBearing(heading)+(isTrue?' T':' M');
  let note=(correction===null?'Declination unavailable':'Declination '+Math.abs(correction).toFixed(1)+'° '+(correction>=0?'E':'W'))+' · '+(inputTrue?'input true':'input magnetic*');
  if(selected&&marker&&map.distance(marker.getLatLng(),selected.getLatLng())>.1){
   let direction=bearing(marker.getLatLng(),selected.getLatLng());
   if(!isTrue){if(correction===null){targetNeedle.style.display='none';compassNote.textContent=note;return;}direction=(direction-correction+360)%360;}
   targetNeedle.style.display='';targetNeedle.setAttribute('transform','rotate('+((direction-heading+360)%360)+' 60 60)');
   note='M'+selected.pinId+' · '+note;
  }else targetNeedle.style.display='none';
  compassNote.textContent=note;
 }
 function onOrientation(event){
  if(!compassEnabled||document.hidden)return;
  let heading,reference;
  if(Number.isFinite(event.webkitCompassHeading)){
   if(Number.isFinite(event.webkitCompassAccuracy)&&(event.webkitCompassAccuracy<0||event.webkitCompassAccuracy>30)){compassHeading=null;updateCompass();compassNote.textContent='Compass unreliable · move away from metal';return;}
   heading=event.webkitCompassHeading;reference='Sensor north*';
  }else if((event.absolute===true||event.type==='deviceorientationabsolute')&&Number.isFinite(event.alpha)){heading=360-event.alpha;reference='Sensor north*';}
  else return;
  const angle=window.screen?.orientation?.angle??window.orientation??0;
  heading=((heading+Number(angle))%360+360)%360;
  compassHeading=heading;lastHeadingAt=Date.now();compassReference=reference;updateCompass();
 }
 function stopCompassSensors(){
  window.removeEventListener('deviceorientation',onOrientation);window.removeEventListener('deviceorientationabsolute',onOrientation);
  if(compassTimer!==null)clearInterval(compassTimer);compassTimer=null;compassHeading=null;
 }
 function startCompassSensors(){
  stopCompassSensors();if(!compassEnabled||document.hidden)return;
  window.addEventListener('deviceorientation',onOrientation);window.addEventListener('deviceorientationabsolute',onOrientation);
  compassTimer=setInterval(updateCompass,1000);updateCompass();
 }
 compassButton.addEventListener('click',async()=>{
  if(compassEnabled){compassEnabled=false;stopCompassSensors();compassPanel.hidden=true;}
  else{
   if(!window.DeviceOrientationEvent){status.textContent='Phone compass is unavailable in this browser.';return;}
   compassButton.disabled=true;
   try{
    if(typeof window.DeviceOrientationEvent.requestPermission==='function'){
     const result=await window.DeviceOrientationEvent.requestPermission(true);
     if(result!=='granted'){status.textContent='Compass permission denied.';return;}
    }
    compassEnabled=true;compassPanel.hidden=false;startCompassSensors();
   }catch{status.textContent='Could not enable compass. Check motion/orientation permissions.';}
   finally{compassButton.disabled=false;}
  }
  compassButton.classList.toggle('is-active',compassEnabled);compassButton.setAttribute('aria-pressed',String(compassEnabled));
  updateDistance();
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCompassSensors();else startCompassSensors();});
 window.addEventListener('pagehide',stopCompassSensors);
 window.addEventListener('pageshow',()=>{if(compassEnabled)startCompassSensors();});

 document.querySelector('#true-north').addEventListener('change',updateCompass);
 document.querySelector('#compass-reference').addEventListener('change',updateCompass);
 locateUser();
})();