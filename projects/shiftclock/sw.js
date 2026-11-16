/* ShiftClock service worker: makes the app open offline.
   - Your own files: network first (a new deploy shows up right away), cached copy when offline.
   - Firebase SDK files (versioned, never change): cache first.
   - Firestore / Auth network calls are left alone: Firebase has its own offline storage.
   Bump V when you want to force-clear old caches. */
const V = 'shiftclock-v2';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'firebase-config.js', 'pwa-install.js',
  'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))) // one missing file must not break install
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const save = (req, res) => { if (res && res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(req, copy)); } return res; };
const withTimeout = req => new Promise((ok, no) => {
  const t = setTimeout(no, 5000); // bad signal counts as offline
  fetch(req).then(r => { clearTimeout(t); ok(r); }, e => { clearTimeout(t); no(e); });
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const own = u.origin === location.origin;
  const sdk = u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/');
  if (!own && !sdk) return;

  if (sdk) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => save(req, r))));
    return;
  }
  e.respondWith(
    withTimeout(req).then(r => save(req, r)).catch(() =>
      caches.match(req, { ignoreSearch: true }).then(hit =>
        hit || (req.mode === 'navigate'
          ? caches.match('index.html').then(x => x || caches.match('./'))
          : Response.error())))
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return clients.openWindow('./');
  }));
});
