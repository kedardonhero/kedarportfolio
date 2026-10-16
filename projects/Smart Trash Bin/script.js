/* Smart Waste dashboard: portfolio demo
   Runs fully in the browser. The sensor maths below mirrors the real Raspberry Pi script
   (percent from height + weight, EMA smoothing, fusion rule). Network calls to the Flask
   API are replaced by an in-memory simulation so the demo works on static hosting. */
(() => {
  "use strict";

  /* ---------- configuration (same values as the real system) ---------- */
  const PIN = "4321";                       // demo PIN only
  const CFG = {
    EMPTY_CM: 55, FULL_CM: 8,               // ultrasonic calibration
    EMPTY_KG: 0, FULL_KG: 10,               // load-cell calibration
    ALPHA: 0.35,                            // EMA smoothing
    STRONG_FULL: 85, NEAR_EMPTY: 10,        // fusion thresholds
    FULL_AT: 80, HALF_AT: 40,               // status bands
    OFFLINE_MS: 10000,                      // no data for 10 s = offline
    ALERT_REPEAT_MS: 60000, ACK_MS: 120000  // sound every 60 s, silence 2 min after acknowledge
  };
  const BOUNDS = L.latLngBounds([32.5205, -92.6485], [32.5275, -92.6325]);

  /* ---------- helpers ---------- */
  const $ = (s) => document.querySelector(s);
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rnd = (a, b) => a + Math.random() * (b - a);

  const pctHeight = (d) => clamp(((CFG.EMPTY_CM - clamp(d, CFG.FULL_CM, CFG.EMPTY_CM)) / (CFG.EMPTY_CM - CFG.FULL_CM)) * 100, 0, 100);
  const pctWeight = (w) => clamp(((clamp(w, CFG.EMPTY_KG, CFG.FULL_KG) - CFG.EMPTY_KG) / (CFG.FULL_KG - CFG.EMPTY_KG)) * 100, 0, 100);
  const ema = (prev, next) => (prev == null ? next : CFG.ALPHA * next + (1 - CFG.ALPHA) * prev);

  function fuse(h, w) {
    const base = Math.min(h, w);
    if (h >= CFG.STRONG_FULL || w >= CFG.STRONG_FULL) return { v: Math.max(base, 0.7 * Math.max(h, w)), rule: "Strong-full rule" };
    if (h <= CFG.NEAR_EMPTY && w <= CFG.NEAR_EMPTY) return { v: base, rule: "Near-empty rule" };
    return { v: base, rule: "Lower of both" };
  }

  /* ---------- state ---------- */
  const state = {
    bins: [], rows: new Map(), markers: new Map(),
    active: null, pipe: null, paused: false,
    picking: false, authorized: false, deleting: null,
    ackUntil: 0, alertLoop: null, soundOn: false, undo: null, toastTimer: null, pickMarker: null
  };

  function makeBin(id, loc, lat, lng, pct, rate, online = true) {
    const b = { id, loc, lat, lng, rate, truth: pct, distance: 0, weight: 0, hS: null, wS: null, v: 0, rule: "", last_seen: Date.now(), forceOffline: !online, hist: [], wBias: rnd(-0.06, 0.06) };
    readSensors(b, true);
    if (!online) b.last_seen = Date.now() - 60000;
    return b;
  }

  /* one sensor reading -> percent -> smoothing -> fusion (as in the Pi script) */
  function readSensors(b, first = false) {
    const noiseH = rnd(-0.03, 0.03), noiseW = rnd(-0.02, 0.02);
    const hPct = clamp(b.truth / 100 + noiseH, 0, 1);
    const wPct = clamp(b.truth / 100 + b.wBias + noiseW, 0, 1);
    b.distance = Math.round(CFG.EMPTY_CM - hPct * (CFG.EMPTY_CM - CFG.FULL_CM));
    b.weight = +(wPct * CFG.FULL_KG).toFixed(2);
    const h = pctHeight(b.distance), w = pctWeight(b.weight);
    b.hRaw = h; b.wRaw = w;
    b.hS = first ? h : ema(b.hS, h);
    b.wS = first ? w : ema(b.wS, w);
    const f = fuse(b.hS, b.wS);
    b.v = Math.round(clamp(f.v, 0, 100));
    b.rule = f.rule;
    b.hist.push(b.v);
    if (b.hist.length > 40) b.hist.shift();
  }

  const isOffline = (b) => Date.now() - b.last_seen > CFG.OFFLINE_MS;
  const statusOf = (b) => (isOffline(b) ? "offline" : b.v >= CFG.FULL_AT ? "full" : b.v >= CFG.HALF_AT ? "half" : "empty");

  function seed() {
    state.bins = [
      makeBin("B01", "IESB", 32.5257, -92.6465, 28, 0.12),
      makeBin("B02", "Cafeteria", 32.5234, -92.639, 46, 0.18),
      makeBin("B03", "Dorm", 32.522, -92.6355, 76, 0.35),
      makeBin("B04", "Campus Quad", 32.5243, -92.641, 18, 0.1, false)
    ];
    state.pipe = "B03";
  }

  /* ---------- simulation tick (1 s, like a sensor reporting) ---------- */
  function tick() {
    state.bins.forEach((b) => {
      if (b.forceOffline) return;
      if (!state.paused) b.truth = clamp(b.truth + b.rate * rnd(0.5, 1.5), 0, 100);
      readSensors(b);
      b.last_seen = Date.now();
    });
    refresh();
  }

  /* ---------- map ---------- */
  const map = L.map("map", {
    center: [32.5238, -92.6395], zoom: 16, minZoom: 15, maxZoom: 18,
    maxBounds: BOUNDS, maxBoundsViscosity: 1, scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: false
  });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
  const iconFor = (s) => L.divIcon({ className: "pinWrap", html: `<span class="pin ${s}"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] });

  map.on("click", (e) => {
    if (!state.picking) return;
    if (!BOUNDS.contains(e.latlng)) { toast("Pick inside the campus area"); return; }
    $("#newLat").value = e.latlng.lat.toFixed(6);
    $("#newLng").value = e.latlng.lng.toFixed(6);
    if (state.pickMarker) state.pickMarker.setLatLng(e.latlng);
    else state.pickMarker = L.marker(e.latlng).addTo(map);
    endPick();
    toast("Location selected ✅");
  });

  /* ---------- rendering ---------- */
  function syncStructure() {
    const ids = new Set(state.bins.map((b) => b.id));
    state.rows.forEach((el, id) => { if (!ids.has(id)) { el.remove(); state.rows.delete(id); } });
    state.markers.forEach((m, id) => { if (!ids.has(id)) { map.removeLayer(m); state.markers.delete(id); } });
    state.bins.forEach((b) => {
      if (!state.rows.has(b.id)) {
        const el = document.createElement("div");
        el.className = "row"; el.tabIndex = 0; el.setAttribute("role", "button");
        el.innerHTML = '<div class="rid"><b></b><span></span></div><div class="rstat"><em class="pct"></em><span class="pill2"><i class="dot"></i><span class="lbl"></span></span></div><div class="bar"><i></i></div>';
        el.addEventListener("click", () => openBin(b.id));
        el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBin(b.id); } });
        $("#binList").appendChild(el);
        state.rows.set(b.id, el);
      }
      if (!state.markers.has(b.id)) {
        const m = L.marker([b.lat, b.lng], { icon: iconFor("empty"), keyboard: true, title: b.id })
          .addTo(map).on("click", () => openBin(b.id));
        m.bindTooltip(b.id, { direction: "top", offset: [0, -8] });
        m._s = "empty";
        state.markers.set(b.id, m);
      }
    });
    const sel = $("#pipeSel");
    sel.innerHTML = state.bins.map((b) => `<option value="${esc(b.id)}">${esc(b.id)} · ${esc(b.loc)}</option>`).join("");
    if (!ids.has(state.pipe)) state.pipe = state.bins[0] ? state.bins[0].id : null;
    sel.value = state.pipe || "";
  }

  function refresh() {
    let f = 0, h = 0, e = 0, o = 0;
    state.bins.forEach((b) => {
      const s = statusOf(b);
      if (s === "full") f++; else if (s === "half") h++; else if (s === "offline") o++; else e++;
      const row = state.rows.get(b.id);
      if (row) {
        row.className = "row " + s;
        row.querySelector("b").textContent = b.id;
        row.querySelector(".rid span").textContent = b.loc;
        row.querySelector(".pct").textContent = s === "offline" ? "—" : b.v + "%";
        row.querySelector(".lbl").textContent = s.toUpperCase();
        row.querySelector(".bar i").style.width = (s === "offline" ? 100 : b.v) + "%";
        row.setAttribute("aria-label", `${b.id}, ${b.loc}, ${s === "offline" ? "offline" : b.v + " percent"}, ${s}`);
      }
      const m = state.markers.get(b.id);
      if (m && m._s !== s) { m.setIcon(iconFor(s)); m._s = s; }
    });
    $("#mTotal").textContent = state.bins.length;
    $("#mFull").textContent = f; $("#mHalf").textContent = h; $("#mEmpty").textContent = e; $("#mOffline").textContent = o;
    $("#liveText").textContent = state.paused ? "Filling paused" : "Live · " + new Date().toLocaleTimeString();
    $("#live").classList.toggle("paused", state.paused);
    updatePipeline(); updateDialog(); checkAlert();
  }

  function updatePipeline() {
    const b = state.bins.find((x) => x.id === state.pipe);
    const off = !b || isOffline(b);
    const set = (id, t) => ($(id).textContent = t);
    if (!b || off) {
      ["#pDist", "#pWeight", "#pSmooth", "#pFill"].forEach((i) => set(i, "—"));
      set("#pH", b ? "sensor offline" : "—"); set("#pW", b ? "sensor offline" : "—"); set("#pRule", b ? "no data" : "—");
    } else {
      set("#pDist", b.distance + " cm"); set("#pH", "= " + Math.round(b.hRaw) + "% by height");
      set("#pWeight", b.weight.toFixed(2) + " kg"); set("#pW", "= " + Math.round(b.wRaw) + "% by weight");
      set("#pSmooth", Math.round(b.hS) + "% / " + Math.round(b.wS) + "%");
      set("#pFill", b.v + "%"); set("#pRule", b.rule);
    }
    const pts = b ? b.hist.map((v, i, a) => `${(i / Math.max(a.length - 1, 1)) * 300},${62 - (v / 100) * 56}`).join(" ") : "";
    $("#sparkLine").setAttribute("points", pts);
  }

  /* ---------- bin dialog ---------- */
  function openBin(id) {
    state.active = id; state.pipe = id; $("#pipeSel").value = id;
    $("#binDialog").showModal(); updateDialog();
  }
  function updateDialog() {
    const dlg = $("#binDialog");
    if (!dlg.open) return;
    const b = state.bins.find((x) => x.id === state.active);
    if (!b) { dlg.close(); return; }
    const s = statusOf(b), off = s === "offline";
    $("#dId").textContent = b.id; $("#dLoc").textContent = b.loc;
    $("#dSeen").textContent = new Date(b.last_seen).toLocaleTimeString();
    $("#dDist").textContent = off ? "—" : b.distance;
    $("#dWeight").textContent = off ? "—" : b.weight.toFixed(2);
    const colors = { empty: "#22c55e", half: "#f59e0b", full: "#ef4444", offline: "#94a3b8" };
    $("#dFill").style.width = (off ? 100 : b.v) + "%"; $("#dFill").style.background = colors[s];
    const st = $("#dStatus"); st.textContent = off ? "OFFLINE" : s.toUpperCase() + " · " + b.v + "%"; st.style.color = colors[s];
  }
  $("#dDir").addEventListener("click", () => {
    const b = state.bins.find((x) => x.id === state.active);
    if (!b) return;
    if (isOffline(b)) { toast("This bin is OFFLINE 🚫"); return; }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}&travelmode=walking`, "_blank", "noopener");
  });
  $("#dDel").addEventListener("click", () => {
    state.deleting = state.active; $("#binDialog").close();
    $("#delPin").value = ""; $("#delPin").placeholder = "Enter PIN (4321)"; $("#delDialog").showModal();
  });

  /* close any dialog when the backdrop is clicked */
  document.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));

  /* ---------- delete / add with undo ---------- */
  $("#delGo").addEventListener("click", () => {
    if ($("#delPin").value !== PIN) { $("#delPin").value = ""; $("#delPin").placeholder = "Wrong PIN"; return; }
    const i = state.bins.findIndex((b) => b.id === state.deleting);
    if (i < 0) return;
    const removed = state.bins.splice(i, 1)[0];
    $("#delDialog").close(); syncStructure(); refresh();
    toast("Bin deleted", () => { state.bins.splice(i, 0, removed); syncStructure(); refresh(); });
  });

  $("#addBtn").addEventListener("click", () => {
    state.authorized = false; $("#pinInput").value = ""; $("#pinInput").placeholder = "Enter PIN";
    $("#pinStep").hidden = false; $("#formStep").hidden = true; $("#addDialog").showModal();
  });
  $("#pinGo").addEventListener("click", verifyPin);
  $("#pinInput").addEventListener("keydown", (e) => { if (e.key === "Enter") verifyPin(); });
  function verifyPin() {
    if ($("#pinInput").value !== PIN) { $("#pinInput").value = ""; $("#pinInput").placeholder = "Wrong PIN"; return; }
    state.authorized = true; $("#pinStep").hidden = true; $("#formStep").hidden = false;
    if (!$("#newId").value) $("#newId").value = "B" + String(state.bins.length + 1).padStart(2, "0");
  }
  $("#pickBtn").addEventListener("click", () => {
    $("#addDialog").close(); state.picking = true; $("#pickHint").hidden = false;
    $("#map").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("#pickCancel").addEventListener("click", () => { endPick(); });
  function endPick() {
    state.picking = false; $("#pickHint").hidden = true;
    $("#addDialog").showModal(); $("#pinStep").hidden = true; $("#formStep").hidden = false;
  }
  $("#addGo").addEventListener("click", () => {
    if (!state.authorized) return;
    const id = $("#newId").value.trim(), loc = $("#newLoc").value.trim();
    const lat = Number($("#newLat").value), lng = Number($("#newLng").value);
    if (!id) return toast("Bin ID is required");
    if (!loc) return toast("Location is required");
    if (!$("#newLat").value || !$("#newLng").value) return toast("Pick a location on the map first");
    if (state.bins.some((b) => b.id === id)) return toast("Bin ID already exists");
    if (!BOUNDS.contains(L.latLng(lat, lng))) return toast("Location must be inside campus 🚫");
    state.bins.push(makeBin(id, loc, lat, lng, rnd(0, 6), rnd(0.15, 0.35)));
    if (state.pickMarker) { map.removeLayer(state.pickMarker); state.pickMarker = null; }
    ["#newId", "#newLoc", "#newLat", "#newLng"].forEach((s) => ($(s).value = ""));
    $("#addDialog").close(); syncStructure(); refresh();
    toast("Bin added", () => { state.bins = state.bins.filter((b) => b.id !== id); syncStructure(); refresh(); });
  });

  /* ---------- alerts (full bins) ---------- */
  function checkAlert() {
    const fulls = state.bins.filter((b) => statusOf(b) === "full");
    const card = $("#alertCard");
    if (!fulls.length) { card.hidden = true; stopLoop(); state.ackUntil = 0; return; }
    if (Date.now() < state.ackUntil) return;
    $("#alertList").innerHTML = fulls.map((b) => `<li>🗑 ${esc(b.id)} — ${esc(b.loc)} (${b.v}%)</li>`).join("");
    if (card.hidden) card.hidden = false;
    if (!state.alertLoop) { playSound(); state.alertLoop = setInterval(playSound, CFG.ALERT_REPEAT_MS); }
  }
  function stopLoop() { clearInterval(state.alertLoop); state.alertLoop = null; }
  function playSound() {
    if (!state.soundOn) return;
    const a = $("#alertSound"); a.currentTime = 0; a.play().catch(() => {});
  }
  $("#alertAck").addEventListener("click", () => { state.ackUntil = Date.now() + CFG.ACK_MS; stopLoop(); $("#alertCard").hidden = true; });
  $("#alertClose").addEventListener("click", () => { $("#alertCard").hidden = true; });
  $("#soundBtn").addEventListener("click", (e) => {
    state.soundOn = !state.soundOn;
    e.currentTarget.setAttribute("aria-pressed", state.soundOn);
    e.currentTarget.setAttribute("aria-label", state.soundOn ? "Turn alert sound off" : "Turn alert sound on");
    e.currentTarget.textContent = state.soundOn ? "🔔" : "🔕";
    if (state.soundOn) playSound();
  });

  /* ---------- toast ---------- */
  function toast(msg, undoFn) {
    $("#toastText").textContent = msg; state.undo = undoFn || null;
    $("#toastUndo").hidden = !undoFn; $("#toast").hidden = false;
    clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => ($("#toast").hidden = true), 6000);
  }
  $("#toastUndo").addEventListener("click", () => { if (state.undo) state.undo(); state.undo = null; $("#toast").hidden = true; });

  /* ---------- simulation controls ---------- */
  const pipeBin = () => state.bins.find((b) => b.id === state.pipe);
  $("#pipeSel").addEventListener("change", (e) => { state.pipe = e.target.value; updatePipeline(); });
  $("#simTrash").addEventListener("click", () => { const b = pipeBin(); if (b) { b.truth = clamp(b.truth + 20, 0, 100); toast(`Added trash to ${b.id}. Watch the pipeline smooth it in.`); } });
  $("#simEmpty").addEventListener("click", () => { const b = pipeBin(); if (b) { b.truth = rnd(1, 5); toast(`${b.id} emptied by collection crew.`); } });
  $("#simOffline").addEventListener("click", () => {
    const b = pipeBin(); if (!b) return;
    b.forceOffline = !b.forceOffline;
    if (b.forceOffline) toast(`${b.id} sensor disconnected. It shows OFFLINE after 10 s with no data, like the real system.`);
    else { b.last_seen = Date.now(); toast(`${b.id} sensor reconnected.`); }
  });
  $("#simPause").addEventListener("click", (e) => { state.paused = !state.paused; e.currentTarget.textContent = state.paused ? "▶ Resume filling" : "⏸ Pause filling"; refresh(); });
  $("#simReset").addEventListener("click", () => { seed(); syncStructure(); refresh(); toast("Demo reset"); });

  $("#bannerClose").addEventListener("click", () => ($("#banner").hidden = true));
  $("#year").textContent = new Date().getFullYear();

  /* ---------- start ---------- */
  seed(); syncStructure(); refresh();
  setInterval(tick, 1000);
})();
