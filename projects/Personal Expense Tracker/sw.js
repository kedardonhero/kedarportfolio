const C = 'ft-v5';
const FILES = ['./', 'index.html', 'style.css', 'script.js', 'extras.js', 'firebase-config.js', 'pwa-install.js', 'manifest.webmanifest',
  'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
// Libraries and fonts FinTrack loads from CDNs. Cached so the app still opens offline.
const LIBS = ['cdn.jsdelivr.net', 'unpkg.com', 'www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const LIB_TYPES = ['script', 'style', 'font'];

self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => clients.claim())));

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (u.origin === location.origin) {
    // Your own files: network first (so updates arrive), cache as the offline fallback
    e.respondWith(fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(C).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
  } else if (LIBS.includes(u.hostname) && LIB_TYPES.includes(r.destination)) {
    // CDN libraries: cache first, refresh in the background
    e.respondWith(caches.match(r).then(hit => {
      const net = fetch(r).then(res => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(C).then(c => c.put(r, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  } // everything else (Firestore, Auth API calls) goes straight to the network
});
