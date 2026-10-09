// Network-only navigation keeps Cloudflare Access in the request path.
// No authenticated dashboard responses or login redirects are cached.
'use strict';
const CACHE = 'tmt11-offline-v1';
const offline = new URL('./offline.html', self.location.href).href;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch(offline, {cache:'reload', credentials:'same-origin'});
    if (!response.ok || response.redirected || response.url !== offline || !response.headers.get('Content-Type')?.includes('text/html')) throw new Error('Offline page unavailable');
    const text = await response.clone().text();
    if (!text.includes('TMT11_OFFLINE_NOTICE_V1')) throw new Error('Unexpected response');
    await (await caches.open(CACHE)).put(offline,response);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => { event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('tmt11-offline-') && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()); });
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async () => (await caches.match(offline)) || new Response('You are offline. Reconnect and reload.', {headers:{'Content-Type':'text/plain'}})));
});
