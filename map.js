"use strict";
(() => {
 const status=document.querySelector('#status'), locate=document.querySelector('#locate'),home=document.querySelector('#home');
 if(!window.L){status.textContent='Map library could not load. Check your internet connection and reload.';return;}
 const map=L.map('map',{zoomControl:true,tapHold:false}).setView([61.48,23.63],11);
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',updateWhenIdle:true,keepBuffer:1}).addTo(map);
 L.control.scale({imperial:false}).addTo(map);
 let tileError=false,marker,circle;
 tiles.on('tileerror',()=>{tileError=true;status.textContent='Some map tiles could not load. Check your connection or move the map to retry.';});
 tiles.on('loading',()=>{tileError=false;});
 tiles.on('load',()=>{if(!tileError)status.textContent='Ready to explore. Location stays off until requested.';});
 const coordinates=()=>{const c=map.getCenter();document.querySelector('#coordinates').textContent=c.lat.toFixed(5)+'°, '+c.lng.toFixed(5)+'° · Zoom '+map.getZoom();};
 map.on('moveend zoomend',coordinates);coordinates();
 home.disabled=false;locate.disabled=false;
 home.addEventListener('click',()=>map.setView([61.48,23.63],11));
 locate.addEventListener('click',()=>{
  if(!navigator.geolocation){status.textContent='Location is unavailable in this browser.';return;}
  locate.disabled=true;status.textContent='Finding your location…';
  navigator.geolocation.getCurrentPosition(position=>{
   locate.disabled=false;const {latitude,longitude,accuracy}=position.coords,point=[latitude,longitude];
   if(marker)map.removeLayer(marker);if(circle)map.removeLayer(circle);
   marker=L.circleMarker(point,{radius:8,color:'#ffffff',weight:2,fillColor:'#85efaa',fillOpacity:1}).addTo(map).bindPopup('Your location');
   circle=L.circle(point,{radius:accuracy,color:'#85efaa',weight:1,fillOpacity:.08}).addTo(map);
   map.fitBounds(circle.getBounds(),{maxZoom:16,padding:[30,30]});
   status.textContent='Location found · accuracy about '+Math.round(accuracy)+' m. Tap Locate me to update.';
  },error=>{locate.disabled=false;status.textContent=error.code===1?'Location permission denied. You can still explore the map. Allow location in your browser settings to try again.':error.code===3?'Location request timed out. Try again outside or near a window.':'Could not determine your location. You can still move around the map.';},{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
 });
 // One user pin, separate from the GPS position.
 let pin=null,holdTimer=null,origin=null;
 const activePointers=new Set();
 const removeControl=L.control({position:'topleft'});
 let removeButton;
 removeControl.onAdd=()=>{
  const box=L.DomUtil.create('div','leaflet-bar marker-control');
  removeButton=L.DomUtil.create('button','remove-marker',box);
  removeButton.type='button';removeButton.textContent='×';
  removeButton.title='Remove marker';removeButton.setAttribute('aria-label','Remove placed marker');removeButton.disabled=true;
  L.DomEvent.disableClickPropagation(box);L.DomEvent.disableScrollPropagation(box);
  removeButton.addEventListener('click',()=>{
   if(pin){map.removeLayer(pin);pin=null;}
   removeButton.disabled=true;status.textContent='Marker removed. Long press the map to place another.';
  });
  return box;
 };
 removeControl.addTo(map);
 function cancelHold(){if(holdTimer!==null)clearTimeout(holdTimer);holdTimer=null;origin=null;}
 const container=map.getContainer();
 container.addEventListener('pointerdown',event=>{
  activePointers.add(event.pointerId);cancelHold();
  if(activePointers.size!==1||event.button!==0||event.target.closest('.leaflet-control,.leaflet-marker-icon,.leaflet-popup'))return;
  origin={x:event.clientX,y:event.clientY,id:event.pointerId};
  const point=map.mouseEventToLatLng(event);
  holdTimer=setTimeout(()=>{
   holdTimer=null;origin=null;
   if(pin)map.removeLayer(pin);
   pin=L.circleMarker(point,{radius:10,color:'#ffe4aa',weight:3,fillColor:'#edb75f',fillOpacity:1}).addTo(map);
   pin.bindPopup('Placed marker<br>'+point.lat.toFixed(5)+'°, '+point.lng.toFixed(5)+'°').openPopup();
   removeButton.disabled=false;status.textContent='Marker placed. Long press elsewhere to move it, or use × below the zoom buttons to remove it.';
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

})();