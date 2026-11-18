'use strict';

const byId = id => document.getElementById(id);
const statusText = byId('status');
const gibs = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
const catalog = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const day = 86400000;
let point, marker, imagery, request, result;
let weatherDefaults, defaultsFetched = 0;
const map = window.L && L.map('map', {minZoom: 2, maxZoom: 18, maxBounds: [[-85.0511, -180], [85.0511, 180]], maxBoundsViscosity: 1}).setView([61.48, 23.50], 6);

function ageText(ms) {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 60) return minutes + ' min';
  if (minutes < 1440) return Math.floor(minutes / 60) + ' h ' + minutes % 60 + ' min';
  return Math.floor(minutes / 1440) + ' d ' + Math.floor(minutes / 60) % 24 + ' h';
}

function updateStatus() {
  if (!result) return;
  const {label, time, daily, note} = result;
  if (!time) {
    statusText.textContent = label + ' · acquisition date unavailable';
    return;
  }
  const elapsed = Date.now() - Date.parse(time);
  const timing = daily
    ? time + ' UTC mosaic · age ' + ageText(elapsed - day) + ' to ' + ageText(elapsed) + ' (exact pass time unavailable)'
    : new Date(time).toISOString().slice(0, 19).replace('T', ' ') + ' UTC · ' + ageText(elapsed) + ' ago';
  statusText.textContent = [label, timing, note].filter(Boolean).join(' · ');
}

async function read(url, signal, type = 'json') {
  const response = await fetch(url, {signal});
  if (!response.ok) throw Error('Imagery service returned HTTP ' + response.status + '.');
  return response[type]();
}

// Test the selected pixel because a valid tile can contain transparent gaps.
async function hasPixel(url, zoom, location, signal) {
  const p = map.project(location, zoom).floor();
  const limit = 256 * 2 ** zoom - 1;
  p.x = Math.min(limit, Math.max(0, p.x));
  p.y = Math.min(limit, Math.max(0, p.y));
  const tile = L.Util.template(url, {z: zoom, x: Math.floor(p.x / 256), y: Math.floor(p.y / 256)});
  const bitmap = await createImageBitmap(await read(tile, signal, 'blob'));
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, (p.x % 256) * bitmap.width / 256, (p.y % 256) * bitmap.height / 256,
      1, 1, 0, 0, 1, 1);
    return ctx.getImageData(0, 0, 1, 1).data[3] > 0;
  } finally { bitmap.close(); }
}

async function terrain(location, signal) {
  const query = new URLSearchParams({collections: 'sentinel-2-l2a', limit: 5, query: JSON.stringify({'eo:cloud_cover': {lte: 20}}), sortby: '-properties.datetime',
    intersects: JSON.stringify({type: 'Point', coordinates: [location.lng, location.lat]})});
  const data = await read(catalog + '?' + query, signal);
  for (const scene of data.features) {
    try {
      const meta = await read(scene.assets.tilejson.href, signal);
      const url = meta.tiles[0];
      if (!await hasPixel(url, Math.min(map.getZoom(), 14), location, signal)) continue;
      const [w, s, e, n] = meta.bounds;
      const cloud = scene.properties['eo:cloud_cover'];
      return {url, label: scene.properties.platform + ' · true colour', time: scene.properties.datetime,
        note: Number.isFinite(cloud) ? Math.round(cloud) + '% cloud across scene' : '',
        options: {bounds: [[s,w],[n,e]], maxNativeZoom: 14, attribution: 'Copernicus Sentinel-2 | Microsoft Planetary Computer'}};
    } catch (error) {
      if (signal.aborted) throw error;
      // A provider may list a scene before its tiles are available.
    }
  }
  throw Error('No terrain imagery at this point in the five most recent matching scenes.');
}

async function weatherTimes(signal) {
  if (weatherDefaults && Date.now() - defaultsFetched < 300000) return weatherDefaults;
  const xml = await read(gibs + '/1.0.0/WMTSCapabilities.xml', signal, 'text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const entries = new Map();
  for (const layer of doc.getElementsByTagNameNS('*', 'Layer')) {
    const id = layer.getElementsByTagNameNS('*', 'Identifier')[0]?.textContent;
    const value = layer.getElementsByTagNameNS('*', 'Default')[0]?.textContent;
    if (id && value) entries.set(id, value);
  }
  if (!entries.size) throw Error('Weather acquisition dates unavailable.');
  weatherDefaults = entries;
  defaultsFetched = Date.now();
  return entries;
}

async function weather(location, signal) {
  const times = await weatherTimes(signal);
  const sources = [['GOES-East_ABI', -75.2], ['GOES-West_ABI', -137], ['Himawari_AHI', 140.7]];
  const radians = Math.PI / 180;
  const nearby = sources.map(([id, lon]) => [id, Math.cos(location.lat * radians) *
    Math.cos((location.lng - lon) * radians)]).sort((a,b) => b[1] - a[1]);
  const candidates = [];
  if (nearby[0][1] > 0.42) {
    const id = nearby[0][0] + '_Band13_Clean_Infrared';
    if (times.has(id)) candidates.push({id, time: times.get(id), zoom: 6, label: nearby[0][0].split('_')[0] + ' · infrared scan'});
  }
  const polar = ['Day','Night'].map(pass => {
    const id = 'VIIRS_NOAA20_Brightness_Temp_BandI5_' + pass;
    return {id, latest: Date.parse(times.get(id)), label: 'NOAA-20 VIIRS · ' + pass.toLowerCase() + ' infrared'};
  });
  const dates = polar.flatMap(source => Array.from({length: 3}, (_, i) => ({...source, ms: source.latest - i * day})))
    .filter(c => Number.isFinite(c.ms)).sort((a,b) => b.ms - a.ms);
  for (const c of dates) candidates.push({...c, time: new Date(c.ms).toISOString().slice(0,10), zoom: 9, daily: true});
  for (const c of candidates) {
    const url = gibs + '/' + c.id + '/default/' + c.time + '/GoogleMapsCompatible_Level' + c.zoom + '/{z}/{y}/{x}.png';
    if (await hasPixel(url, c.zoom, location, signal)) return {...c, url, options: {maxNativeZoom: c.zoom, attribution: 'NASA GIBS / EOSDIS'}};
  }
  throw Error('No weather pixels found in the latest regional scan or three recent polar mosaic dates.');
}

function terrainFallback(controller) {
  if (request !== controller) return;
  imagery?.remove();
  result = {label: 'Esri World Imagery · terrain fallback'};
  const layer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18, noWrap: true, attribution: 'Esri, Maxar, Earthstar Geographics and the GIS User Community'
  });
  imagery = layer;
  layer.on('tileerror', event => {
    if (imagery === layer && isSelectedTile(event.coords)) {
      result = null;
      statusText.textContent = 'Terrain imagery could not load here. Tap Refresh to retry.';
    }
  });
  layer.addTo(map);
  updateStatus();
}

function isSelectedTile(coords) {
  const pixel = map.project(point, coords.z);
  return Math.floor(pixel.x / 256) === coords.x && Math.floor(pixel.y / 256) === coords.y;
}

async function inspect() {
  request?.abort();
  request = null;
  if (imagery) { imagery.remove(); imagery = null; }
  result = null;
  byId('position').textContent = point.lat.toFixed(4) + '°, ' + point.lng.toFixed(4) + '°';
  const streetMap = byId('mode').value === 'map';
  byId('refresh').hidden = streetMap;
  if (streetMap) {
    statusText.textContent = 'Street map · OpenStreetMap';
    return;
  }
  const controller = new AbortController();
  request = controller;
  const timer = setTimeout(() => controller.abort(), 60000);
  statusText.textContent = 'Looking up imagery at this point…';
  try {
    const data = await (byId('mode').value === 'terrain' ? terrain : weather)(point, controller.signal);
    if (request !== controller) return;
    const layer = L.tileLayer(data.url, {...data.options, maxZoom: 18, noWrap: true});
    imagery = layer;
    if (byId('mode').value === 'terrain') {
      layer.on('tileerror', event => {
        if (imagery === layer && isSelectedTile(event.coords)) terrainFallback(controller);
      });
    }
    layer.addTo(map);
    result = data;
    updateStatus();
  } catch (error) {
    if (request !== controller) return;
    if (byId('mode').value === 'terrain') terrainFallback(controller);
    else statusText.textContent = controller.signal.aborted ? 'Request timed out. Tap Refresh to retry.' : error.message;
  } finally { clearTimeout(timer); }
}

if (map) {
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
  point = map.getCenter();
  marker = L.circleMarker(point, {radius: 6, color: '#fff', weight: 2, fillColor: '#ec6b27', fillOpacity: 1, interactive: false}).addTo(map);
  map.on('click', ({latlng}) => {
    point = L.latLng(Math.max(-85.0511, Math.min(85.0511, latlng.lat)), Math.max(-180, Math.min(180, latlng.lng)));
    marker.setLatLng(point);
    inspect();
  });
  byId('mode').onchange = () => {
    const mode = byId('mode').value;
    if (mode !== 'map') map.setView(point, mode === 'terrain' ? 11 : 6);
    inspect();
  };
  byId('refresh').onclick = inspect;
  setInterval(updateStatus, 30000);
  inspect();
} else statusText.textContent = 'Map unavailable. Reconnect and reload this page.';
