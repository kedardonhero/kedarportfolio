// FinTrack: Splitwise sync (loaded after extras.js, so it shares script.js variables and helpers).
// You press "Connect Splitwise" on the Loans page; the key is saved where only the free GitHub sync job can read it
// (scripts/splitwise-sync.js). That job copies your Splitwise expenses into Firestore, and this file turns them into
// FinTrack loans ("they owe me" / "I owe them"), payments and (optionally) your own share as an expense.
(function () {
  if (typeof db === "undefined" || !db) return;
  var cache = {}, rev = 0, mergedRev = -1, meta = {}, unsubs = [], attachedUid = null;
  // Other sources (Split in Half) hand their expenses to the same importer through this hook.
  window.__ftFeed = function (items) { var ch = false; items.forEach(function (it) { var o = cache[it.id]; if (!o || o.updated !== it.updated || !!o.deleted !== !!it.deleted) { cache[it.id] = it; ch = true; } }); if (ch) rev++; };

  // ---------- Card on the Loans page ----------
  var page = document.getElementById("loans");
  var hero = page && page.querySelector(".hero");
  if (!hero) return;
  var card = document.createElement("div");
  card.className = "card";
  card.innerHTML =
    '<h2>Splitwise</h2>' +
    '<p id="sw-status" class="hint"></p>' +
    '<div id="sw-connect" class="stack">' +
      '<label>Splitwise API key<input type="password" id="sw-key" autocomplete="off" placeholder="paste your API key"></label>' +
      '<p class="hint">Get it free: open secure.splitwise.com/apps, tap Register your application (any name and website), then copy the API key.</p>' +
      '<p id="sw-msg" class="error" role="alert"></p>' +
      '<button type="button" class="primary-btn" id="sw-go">Connect Splitwise</button>' +
    '</div>' +
    '<div id="sw-on" class="stack" hidden>' +
      '<label class="check"><input type="checkbox" id="sw-share"> Count my share of each bill as an expense</label>' +
      '<button type="button" class="link-btn" id="sw-off">Disconnect Splitwise</button>' +
    '</div>';
  hero.after(card);
  var $s = function (id) { return document.getElementById(id); };

  function paint() {
    var on = !!splitwise.linked && !!cloudUser;
    card.hidden = false;
    $s("sw-connect").hidden = on;
    $s("sw-on").hidden = !on;
    $s("sw-share").checked = splitwise.countShare !== false;
    var t = cloudUser ? "Import your Splitwise expenses automatically. Friends' new expenses show up here."
                      : "Log in to an account (not guest mode) to connect Splitwise.";
    if (on) {
      t = meta.lastSync
        ? "Connected" + (meta.swName ? " as " + meta.swName : "") + ". Last check: " + new Date(meta.lastSync).toLocaleString() + ". New expenses arrive about every 10 minutes."
        : "Key saved. Waiting for the first sync (up to about 10 minutes).";
      if (meta.error) t += " " + meta.error;
    }
    $s("sw-status").textContent = t;
    $s("sw-go").disabled = !cloudUser;
  }

  $s("sw-go").onclick = function () {
    var key = $s("sw-key").value.trim();
    if (!cloudUser) return;
    if (key.length < 20) { $s("sw-msg").textContent = "Paste your full Splitwise API key."; return; }
    $s("sw-msg").textContent = "";
    db.collection("splitwiseLinks").doc(cloudUser.uid).set({ apiKey: key, createdAt: Date.now() }).then(function () {
      splitwise.linked = true; meta.error = ""; $s("sw-key").value = "";
      saveData(); paint(); showToast("Splitwise connected. First sync soon.");
    }).catch(function () { $s("sw-msg").textContent = "Could not save the key. Check your connection and rules."; });
  };
  $s("sw-off").onclick = function () {
    if (!confirm("Disconnect Splitwise? Loans already imported stay in FinTrack.")) return;
    db.collection("splitwiseLinks").doc(cloudUser.uid).delete().then(function () {
      splitwise.linked = false; saveData(); paint(); showToast("Splitwise disconnected");
    });
  };
  $s("sw-share").onchange = function () { splitwise.countShare = $s("sw-share").checked; saveData(); };

  // ---------- Listen to what the sync job saved ----------
  function attach(uid) {
    unsubs.forEach(function (u) { u(); }); unsubs = []; cache = {}; meta = {}; rev++; attachedUid = uid;
    paint();
    if (!uid) return;
    var base = db.collection("splitwiseSync").doc(uid);
    unsubs.push(base.onSnapshot(function (s) { meta = s.exists ? s.data() : {}; paint(); }, function () {}));
    unsubs.push(base.collection("expenses").onSnapshot(function (s) {
      s.docChanges().forEach(function (c) { cache[c.doc.id] = c.doc.data(); });
      rev++;
    }, function () {}));
  }

  // ---------- Turn Splitwise expenses into loans ----------
  function contactFor(u) {
    var c = contacts.find(function (x) { return x.id === splitwise.map[u.id]; }) ||
            contacts.find(function (x) { return x.name.toLowerCase() === u.name.toLowerCase(); });
    if (!c) { c = { id: "c" + Date.now() + Math.floor(Math.random() * 1000), name: u.name }; contacts.push(c); }
    splitwise.map[u.id] = c.id;
    return c;
  }
  var stamp = function (it) { return (it.updated || "") + (it.deleted ? "|del" : ""); };

  // Category sent by Split in Half: use the FinTrack category with the same name, or create it. "Miscellaneous" becomes "Other".
  function catFor(c) {
    c = String(c || "").trim();
    if (!c || /^miscellaneous$/i.test(c)) return "Other";
    try {
      var hit = getExpenseCategories().find(function (x) { return x.toLowerCase() === c.toLowerCase(); });
      if (hit) return hit;
      expenseNames.push(c);
      if (typeof fillCategories === "function") fillCategories();
    } catch (e) {}
    return c;
  }

  function applyOne(it, stats) {
    var first = splitwise.seen[it.id] === undefined;
    var olds = loans.filter(function (l) { return l.swId === it.id; });
    loans = loans.filter(function (l) { return l.swId !== it.id; });
    transactions = transactions.filter(function (t) { return t.swId !== it.id; });
    if (it.payment && !first) { loans = loans.concat(olds); return; }   // a payment can only be applied once
    if (it.deleted) return;
    if (it.cur && it.cur !== currentCurrency) { stats.skipped++; return; } // no currency conversion
    var me = it.users.find(function (u) { return u.id === it.me; });
    if (!me) return;
    var others = it.users.filter(function (u) { return u.id !== it.me; });

    if (it.payment) {   // someone paid someone back
      var other = others[0];
      if (!other) return;
      var c = contactFor(other), dir = me.paid > 0 ? "owe" : "lent";
      var open = dir === "owe" ? iOweTo(c.id) : owedBy(c.id);
      var amt = round2(Math.min(it.cost, open));
      if (amt > 0) applyPayments(c.id, dir, amt, "", false);
      return;
    }

    var base = Date.parse((it.date || today()) + "T12:00:00") + (Number(it.id) % 3600000);
    var myNet = round2(me.paid - me.owed), k = 0;
    var make = function (u, kind, amount) {
      var c = contactFor(u), old = olds.find(function (l) { return l.contactId === c.id; });
      loans.push({ id: base + (k++), kind: kind, contactId: c.id, person: c.name, accountId: "",
        payments: old ? old.payments : [], amount: amount, total: it.cost, split: it.users.length > 2,
        parts: it.users.length, paid: old ? old.paid : 0, note: it.desc + " (" + (it.src || "Splitwise") + ")", date: it.date || today(), swId: it.id });
    };
    if (myNet > 0.004) {            // I paid more than my share: the others owe me
      others.forEach(function (u) { var n = round2(u.paid - u.owed); if (n < -0.004) make(u, "lent", -n); });
    } else if (myNet < -0.004) {    // I owe whoever paid more than their share
      var pos = others.filter(function (u) { return u.paid - u.owed > 0.004; });
      var tot = pos.reduce(function (s, u) { return s + (u.paid - u.owed); }, 0);
      pos.forEach(function (u) { make(u, "paid-for-me", round2(-myNet * (u.paid - u.owed) / tot)); });
    }
    if (splitwise.countShare !== false && me.owed > 0.004) {
      transactions.push({ id: base + 7200000, type: "expense", amount: round2(me.owed), category: catFor(it.cat),
        description: it.desc + " (" + (it.src || "Splitwise") + ")", date: it.date || today(), accountId: "", shared: true, swId: it.id });
    }
  }

  function merge() {
    var ids = Object.keys(cache).filter(function (id) { return splitwise.seen[id] !== stamp(cache[id]); });
    if (!ids.length) return;
    var stats = { skipped: 0 };
    ids.map(function (id) { return cache[id]; })
      .sort(function (a, b) { return (a.date || "").localeCompare(b.date || "") || a.id.localeCompare(b.id); })
      .forEach(function (it) { applyOne(it, stats); splitwise.seen[it.id] = stamp(it); });
    saveData(); render();
    showToast("Synced: " + ids.length + " update" + (ids.length > 1 ? "s" : "") + (stats.skipped ? " (" + stats.skipped + " skipped: other currency)" : ""));
  }

  // Check every few seconds. Merge only after this device has loaded the account's cloud data,
  // so we never save over it with an empty copy.
  setInterval(function () {
    var uid = cloudUser ? cloudUser.uid : null;
    if (uid !== attachedUid) attach(uid);
    if (uid && lastSeen > 0 && profile && rev !== mergedRev) { mergedRev = rev; merge(); }
    paint();
  }, 3000);
})();
