/* pwa-install.js: shared "Install app" helper (used by ShiftClock and FinTrack).
   - Any element with the data-install attribute becomes an install button.
   - Chrome / Edge / Android: shows the real install prompt.
   - iPhone / iPad / Safari / Firefox: shows short, correct how-to steps (those browsers have no install prompt API).
   - Opening the app with ?install=1 (used by the portfolio links) pops up the install dialog right away. */
(function () {
  var deferred = null, ua = navigator.userAgent || '';
  var isiOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /android/i.test(ua);
  var isFirefox = /firefox|fxios/i.test(ua);
  var isEdge = /edg/i.test(ua);
  var isChromium = /chrome|crios|chromium/i.test(ua) && !isEdge || isEdge;
  var isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|edg|android|opr\//i.test(ua);
  var isMac = /Macintosh/.test(ua) && !isiOS;
  var meta = function (n) { var m = document.querySelector('meta[name="' + n + '"]'); return m ? m.content : ''; };
  var appName = meta('application-name') || document.title;

  function standalone() {
    return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: window-controls-overlay)').matches ||
      matchMedia('(display-mode: minimal-ui)').matches || navigator.standalone === true;
  }
  function refresh() {
    var hide = standalone();
    document.querySelectorAll('[data-install]').forEach(function (b) { b.hidden = hide; });
  }

  addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; refresh(); });
  addEventListener('appinstalled', function () {
    deferred = null; refresh(); close();
    toast(appName + ' installed. Open it from your home screen, dock or Start menu.');
  });
  matchMedia('(display-mode: standalone)').addEventListener && matchMedia('(display-mode: standalone)').addEventListener('change', refresh);

  function steps() {
    if (isiOS) return [
      'Open this page in <b>Safari</b> (on iOS 16.4+ the Share menu in Chrome or Edge also works).',
      'Tap the <b>Share</b> button (the square with an arrow pointing up).',
      'Scroll down and tap <b>Add to Home Screen</b>, then tap <b>Add</b>.'];
    if (isMac && isSafari) return [
      'Click <b>File</b> in the Safari menu bar (needs macOS Sonoma or newer).',
      'Choose <b>Add to Dock</b>, then click <b>Add</b>.'];
    if (isAndroid && isFirefox) return ['Tap the <b>⋮ menu</b>.', 'Tap <b>Install</b> (or <b>Add to Home screen</b>).'];
    if (isFirefox) return [
      'Desktop Firefox cannot install web apps.',
      'Open this page in <b>Chrome</b>, <b>Edge</b> or <b>Safari</b> to install it as an app.'];
    if (isAndroid) return ['Tap the <b>⋮ menu</b> in Chrome.', 'Tap <b>Install app</b> (or <b>Add to Home screen</b>).'];
    if (isChromium) return [
      'Look for the <b>install icon</b> at the right end of the address bar and click it.',
      'No icon? Open the <b>⋮ menu</b> and choose <b>Install ' + esc(appName) + '</b> (Chrome) or <b>Apps &gt; Install this site as an app</b> (Edge).'];
    return ['Open your browser menu and look for <b>Install app</b> or <b>Add to Home Screen</b>.',
      'Works in Chrome, Edge and Safari on phones, Windows and Mac.'];
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var css = '.pwa-ov{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.pwa-box{background:var(--card,var(--surface,#fff));color:var(--tx,var(--text,#14181f));border:1px solid var(--bd,var(--border,#d8dde6));border-radius:20px;padding:22px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.4);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:left}' +
    '.pwa-box h3{margin:0 0 4px;font-size:20px}.pwa-box p{margin:0 0 12px;opacity:.75;font-size:14px}.pwa-box ol{margin:0 0 16px;padding-left:20px}.pwa-box li{margin-bottom:8px}' +
    '.pwa-head{display:flex;gap:14px;align-items:center;margin-bottom:14px}.pwa-head img{width:56px;height:56px;border-radius:14px;flex:none}' +
    '.pwa-box button{font:inherit;cursor:pointer;width:100%;padding:13px;border-radius:12px;border:1px solid var(--bd,var(--border,#d8dde6));background:transparent;color:inherit;margin-top:8px}' +
    '.pwa-box button.pwa-go{background:var(--ac,var(--accent,#0f7a55));border-color:var(--ac,var(--accent,#0f7a55));color:var(--on,var(--accent-text,#fff));font-weight:700}' +
    '.pwa-toast{position:fixed;left:16px;right:16px;bottom:90px;max-width:420px;margin:0 auto;z-index:99999;background:#14181f;color:#fff;padding:12px 16px;border-radius:12px;font:14px system-ui,sans-serif;text-align:center}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  var ov = null;
  function close() { if (ov) { ov.remove(); ov = null; document.removeEventListener('keydown', onKey); } }
  function onKey(e) { if (e.key === 'Escape') close(); }
  function toast(t) {
    var d = document.createElement('div'); d.className = 'pwa-toast'; d.textContent = t; document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 5000);
  }
  function icon() { var l = document.querySelector('link[rel="apple-touch-icon"]') || document.querySelector('link[rel="icon"]'); return l ? l.href : ''; }

  function open() {
    if (standalone()) { toast('You are already using the installed app.'); return; }
    close();
    ov = document.createElement('div'); ov.className = 'pwa-ov';
    var can = !!deferred;
    ov.innerHTML = '<div class="pwa-box" role="dialog" aria-modal="true" aria-label="Install ' + esc(appName) + '">' +
      '<div class="pwa-head">' + (icon() ? '<img src="' + icon() + '" alt="">' : '') +
      '<div><h3>Install ' + esc(appName) + '</h3><p style="margin:0">Opens like a normal app, with its own icon. Works on phone, Windows and Mac.</p></div></div>' +
      (can ? '<button class="pwa-go" data-go>Install now</button>' :
        '<p>Your browser installs apps from its own menu. Follow these steps:</p><ol>' + steps().map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>') +
      '<button data-x>' + (can ? 'Not now' : 'Got it') + '</button></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.hasAttribute('data-x')) close(); });
    var go = ov.querySelector('[data-go]');
    if (go) { go.focus(); go.onclick = function () { var p = deferred; deferred = null; close(); p.prompt(); p.userChoice.then(refresh); }; }
    document.addEventListener('keydown', onKey);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-install]');
    if (b) { e.preventDefault(); if (deferred) { var p = deferred; deferred = null; p.prompt(); p.userChoice.then(refresh); } else open(); }
  });

  function ready() {
    refresh();
    if (/[?&]install=1\b/.test(location.search)) {
      try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])install=1&?/, '$1').replace(/[?&]$/, '') + location.hash); } catch (e) {}
      setTimeout(open, 900); // give the browser a moment to fire beforeinstallprompt
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
  window.PWAInstall = { open: open };
})();
