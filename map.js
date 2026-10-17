"use strict";
(() => {
 const status=document.querySelector('#status'), locate=document.querySelector('#locate'),home=document.querySelector('#home');
 if(!window.L){status.textContent='Map library could not load. Check your internet connection and reload.';return;}
 const map=L.map('map',{zoomControl:true}).setView([61.48,23.63],11);
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
})();