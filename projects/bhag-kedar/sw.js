/* Bhag Kedar service worker: lets the game install and run offline (solo / practice).
   Game files: network first (so updates arrive right away), cache as fallback.
   Fonts: cached after first load. Firebase / online play always goes to the network. */
const V = "bk-v3";
const SHELL = ["./", "index.html", "css/style.css", "js/game.js", "js/locations.js", "js/sounds.js",
  "js/firebase-config.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png",
  "icons/apple-touch-icon.png", "icons/favicon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const font = u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com";
  if (u.origin !== location.origin && !font) return;            // Firebase etc: straight to network
  if (font) {                                                    // fonts: cache first
    e.respondWith(caches.open(V).then(c => c.match(r).then(m => m || fetch(r).then(n => { c.put(r, n.clone()); return n; }).catch(() => m))));
    return;
  }
  e.respondWith(fetch(r).then(n => {                             // game files: network first
    if (n.ok) { const k = n.clone(); caches.open(V).then(c => c.put(r, k)); }
    return n;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === "navigate" ? caches.match("index.html") : Response.error()))));
});
