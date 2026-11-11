// FinTrack: live sync from the Split in Half app (same Firebase project, same login).
// Reads the groups you belong to (sih_groups) and their expenses, converts each one into the format the
// Splitwise importer already understands (paid / owed shares), and hands it over. splitwise.js then creates
// the loans, payments and (optionally) your share as an expense. People are matched to your contacts by name.
(function () {
  if (typeof db === "undefined" || !db) return;
  var warned = false, lastErr = "";
  function fail(err) { lastErr = (err && (err.code || err.message)) || "unknown"; console.warn("Split in Half sync:", err); if (!warned) { warned = true; if (typeof showToast === "function") showToast("Split in Half sync problem: " + (err && (err.code || err.message) || "unknown")); } }
  var uid = null, unsubs = [], groups = {}, raw = {}, watching = {}, items = {};

  function num(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i)) % 1e12; return String(h); }
  function ymd(t) { var d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

  function conv(gid, id, e, gone) {
    var names = (groups[gid] && groups[gid].members) || {}, cost = (e.amount || 0) / 100, split = e.split || {}, ids = {}, users = [];
    ids[e.payer] = 1; Object.keys(split).forEach(function (k) { ids[k] = 1; });
    Object.keys(ids).forEach(function (k) {
      var paid = e.payer === k ? cost : 0, owed = (split[k] || 0) / 100;
      if (paid || owed) users.push({ id: k, name: names[k] || "Friend", paid: paid, owed: owed });
    });
    var involved = users.some(function (u) { return u.id === uid; });
    return { id: num(id), me: uid, src: "Split in Half", desc: e.desc || "Split in Half", cost: cost, cur: "",
      date: ymd(e.t || Date.now()), payment: e.kind === "payment", deleted: !!gone || !involved,
      updated: [e.t, e.amount, e.desc, e.payer, JSON.stringify(split)].join("|"), users: users };
  }
  window.__sihConv = function (g, id, e, gone, me) { uid = me; groups[g] = groups[g] || {}; return conv(g, id, e, gone); };

  function rebuild(gid) {
    var docs = raw[gid] || {};
    Object.keys(docs).forEach(function (id) { items[num(id)] = conv(gid, id, docs[id], false); });
  }
  function attach(u) {
    unsubs.forEach(function (f) { f(); }); unsubs = []; groups = {}; raw = {}; watching = {}; items = {}; uid = u;
    if (!u) return;
    unsubs.push(db.collection("sih_groups").where("memberIds", "array-contains", u).onSnapshot(function (s) {
      s.docs.forEach(function (d) {
        groups[d.id] = d.data();
        if (!watching[d.id]) {
          watching[d.id] = true; raw[d.id] = {};
          unsubs.push(d.ref.collection("expenses").onSnapshot(function (es) {
            es.docChanges().forEach(function (c) {
              if (c.type === "removed") {
                delete raw[d.id][c.doc.id];
                var old = items[num(c.doc.id)];
                items[num(c.doc.id)] = { id: num(c.doc.id), me: u, src: "Split in Half", desc: "", cost: 0, cur: "", date: "", payment: false, deleted: true, updated: old ? old.updated : "x", users: [] };
              } else raw[d.id][c.doc.id] = c.doc.data();
            });
            rebuild(d.id);
          }, fail));
        }
      });
      Object.keys(raw).forEach(rebuild);   // names may have changed
    }, fail));
  }


  // ---------- On-screen status (so no console is needed) ----------
  var page = document.getElementById("loans"), hero = page && page.querySelector(".hero"), line = null;
  if (hero) {
    var box = document.createElement("div"); box.className = "card";
    box.innerHTML = '<h2>Split in Half</h2><p id="sih-status" class="hint"></p>';
    hero.after(box); line = box.querySelector("#sih-status");
  }
  function paintStatus() {
    if (!line) return;
    if (typeof cloudUser === "undefined" || !cloudUser) { line.textContent = "Log in to an account (not guest mode) to sync Split in Half."; return; }
    var n = 0; try { n = loans.filter(function (l) { return l.swId && /Split in Half/.test(l.note || ""); }).length; } catch (e) {}
    var t = "Logged in as " + (cloudUser.email || "?") + ". Groups found: " + Object.keys(groups).length +
      ". Expenses read: " + Object.keys(items).length + ". Loans imported: " + n + ".";
    if (lastErr) t += " PROBLEM: " + lastErr + " (publish the Firestore rules in the Personal Expense Tracker project).";
    else if (!Object.keys(groups).length) t += " No groups found for this login. Make sure Split in Half uses this same account.";
    else if (!window.__ftFeed) t += " The Splitwise connector file is missing. Upload the new splitwise.js.";
    else if (!n) t += " No loans yet: an expense only creates a loan when another person is in it.";
    line.textContent = t;
  }

  window.__sihDebug = function () { return { signedIn: !!uid, groups: Object.keys(groups).length, expensesSeen: Object.keys(items).length, feedHook: typeof window.__ftFeed }; };

  // Same rhythm as splitwise.js: wait until the account is loaded, then keep the importer topped up.
  setInterval(function () {
    var u = (typeof cloudUser !== "undefined" && cloudUser) ? cloudUser.uid : null;
    if (u !== uid) attach(u);
    if (u && window.__ftFeed) window.__ftFeed(Object.keys(items).map(function (k) { return items[k]; }));
    paintStatus();
  }, 3000);
})();
