// FinTrack Splitwise sync. Runs on GitHub Actions (free), not in the browser.
// For every person who pressed "Connect Splitwise" in the app (their key is in splitwiseLinks/{uid}),
// it asks Splitwise for new or changed expenses and saves them in Firestore.
// The app (splitwise.js) listens to those documents and turns them into loans.
// Only one GitHub secret is needed: FIREBASE_SERVICE_ACCOUNT (JSON).
const admin = require("firebase-admin");

if (!process.env.FIREBASE_SERVICE_ACCOUNT) { console.error("Missing the FIREBASE_SERVICE_ACCOUNT secret."); process.exit(1); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();

async function splitwise(key, path, params = {}) {
  const url = new URL("https://secure.splitwise.com/api/v3.0" + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { Authorization: "Bearer " + key } });
  if (!res.ok) { const e = new Error("Splitwise answered " + res.status); e.status = res.status; throw e; }
  return res.json();
}

// Keep only what the app needs from an expense
function simplify(e, meId) {
  return {
    id: String(e.id), me: meId, desc: e.description || "Splitwise expense", cost: Number(e.cost) || 0,
    cur: e.currency_code || "", date: String(e.date || "").slice(0, 10), payment: !!e.payment,
    deleted: !!e.deleted_at, updated: e.updated_at || "",
    users: (e.users || []).map((u) => ({
      id: u.user_id,
      name: [u.user && u.user.first_name, u.user && u.user.last_name].filter(Boolean).join(" ") || "Friend",
      paid: Number(u.paid_share) || 0, owed: Number(u.owed_share) || 0,
    })),
  };
}

async function syncOne(uid, key) {
  const started = new Date();
  const meta = db.collection("splitwiseSync").doc(uid);
  try {
    const me = (await splitwise(key, "/get_current_user")).user;
    const old = (await meta.get()).data() || {};
    const params = { limit: 100 };
    if (old.cursor) params.updated_after = old.cursor;
    else params.dated_after = new Date(Date.now() - 90 * 86400000).toISOString(); // first run: last 90 days

    const all = [];
    for (let offset = 0; offset < 1000; offset += 100) {
      const list = (await splitwise(key, "/get_expenses", { ...params, offset })).expenses || [];
      all.push(...list);
      if (list.length < 100) break;
    }
    const items = all.map((e) => simplify(e, me.id));
    for (let i = 0; i < items.length; i += 400) {
      const batch = db.batch();
      items.slice(i, i + 400).forEach((it) => batch.set(meta.collection("expenses").doc(it.id), it));
      await batch.commit();
    }
    await meta.set({
      swName: [me.first_name, me.last_name].filter(Boolean).join(" "), lastSync: Date.now(), error: "",
      cursor: new Date(started.getTime() - 60000).toISOString(),   // start one minute early; the app ignores repeats
    }, { merge: true });
    console.log(uid.slice(0, 6) + "…: synced " + items.length + " expense(s).");
    return true;
  } catch (e) {
    const msg = e.status === 401 ? "Splitwise rejected the API key. Disconnect and connect again." : "Could not reach Splitwise. Will retry.";
    await meta.set({ error: msg }, { merge: true });
    console.error(uid.slice(0, 6) + "…: " + e.message);
    return false;
  }
}

(async () => {
  const links = await db.collection("splitwiseLinks").get();
  console.log(links.size + " connected account(s).");
  let failed = 0;
  for (const doc of links.docs) {
    const key = String(doc.data().apiKey || "").trim();
    if (key && !(await syncOne(doc.id, key))) failed++;
  }
  process.exit(failed ? 1 : 0);
})();
