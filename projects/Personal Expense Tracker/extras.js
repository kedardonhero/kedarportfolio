// ============================================================
// FinTrack extras (loaded after script.js, so it shares its variables and helpers)
//   - Budget page: everything on one page (savings summary, monthly plan, bills, goals)
//   - Monthly plan: edit amounts, copy last month, quick ideas, unplanned spending
//   - Bills: payment method, clickable, "already paid" without deducting
//   - Savings goals that really move money, with edit and history
//   - Backup / restore
// Wrapped in a function so no names clash with script.js.
// ============================================================
(function () {
  "use strict";
  const esc = escapeHtml, money = formatMoney;
  const thisMonth = () => today().slice(0, 7); // the real current month, e.g. "2026-10"
  const kindSum = (k) => sum(accounts.filter((a) => a.kind === k).map((a) => a.balance));
  const accountName = (id) => { const a = getAccount(id); return a ? a.name : ""; };
  const prettyDate = (ymd) => new Date(ymd + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const daysBetween = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 864e5);
  const previousMonth = (ym) => { const [y, m] = ym.split("-").map(Number), d = new Date(y, m - 2, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };

  function newCard(id, html) {
    const card = document.createElement("div");
    card.className = "card";
    card.id = id;
    card.innerHTML = html;
    return card;
  }
  function newDialog(id) {
    const d = document.createElement("dialog");
    d.id = id;
    d.className = "x-dialog";
    document.body.append(d);
    return d;
  }

  // ---------- Build the page pieces once ----------
  const billsCard = newCard("bills-card", '<h2>Upcoming bills</h2><div id="bills-list"></div>');
  $("alerts").after(billsCard); // on Home, under the alerts

  const jumpBar = document.createElement("div");
  jumpBar.className = "jump-chips";
  jumpBar.innerHTML = '<button type="button" class="filter-btn" data-jump="savings-summary">Savings</button><button type="button" class="filter-btn" data-jump="plan-form">Monthly plan</button><button type="button" class="filter-btn" data-jump="bills-manage">Bills</button><button type="button" class="filter-btn" data-jump="goals-card">Goals</button>';
  const budgetTitle = document.querySelector("#budget h1");
  budgetTitle.textContent = "Budget & savings";
  budgetTitle.after(jumpBar);

  const savingsCard = newCard("savings-summary", "");
  jumpBar.after(savingsCard);

  const planTools = document.createElement("div");
  planTools.id = "plan-tools";
  $("budget-error").after(planTools);

  const billsManage = newCard("bills-manage", `<h2>Bills &amp; subscriptions</h2>
    <p class="hint">Bills that repeat every month. Tap a bill to pay it, mark it as already paid, or edit it.</p>
    <form id="bill-form" class="bill-form" novalidate>
      <label class="field wide">Bill name<input id="bill-name" maxlength="30" placeholder="e.g. Rent, Netflix, Phone"></label>
      <label class="field">Amount<input id="bill-amount" type="number" step="0.01" min="0" inputmode="decimal" placeholder="0.00"></label>
      <label class="field">Due day of month<input id="bill-day" type="number" min="1" max="31" inputmode="numeric" placeholder="1 to 31"></label>
      <label class="field wide">Pay from<select id="bill-method"></select></label>
      <label class="check wide"><input type="checkbox" id="bill-already"> I already paid this month. Do not take it from my accounts.</label>
      <button type="submit" class="primary-btn wide">Add bill</button>
    </form>
    <p id="bill-error" class="error" role="alert"></p><div id="bill-manage-list"></div>`);
  const goalsCard = newCard("goals-card", `<h2>Savings goals</h2>
    <p class="hint">Pick something to save for. Money you add moves out of your cash or bank account into the goal, so all your balances stay correct.</p>
    <form id="goal-form" class="bill-form" novalidate>
      <label class="field wide">What are you saving for?<input id="goal-name" maxlength="30" placeholder="e.g. Emergency fund, Laptop, Trip"></label>
      <label class="field">Target amount<input id="goal-target" type="number" step="0.01" min="0" inputmode="decimal" placeholder="0.00"></label>
      <label class="field">Finish by (optional)<input id="goal-date" type="date"></label>
      <button type="submit" class="primary-btn wide">Add goal</button>
    </form>
    <p id="goal-error" class="error" role="alert"></p><div id="goal-list"></div>`);
  $("budget").append(billsManage, goalsCard);

  const backupCard = newCard("backup-card", `<h2>Backup &amp; restore</h2>
    <p class="hint">Save a copy of all your data as a file, or load a copy you saved earlier. Restoring replaces the data in your account.</p>
    <div class="backup-actions"><button type="button" class="primary-btn" id="backup-export">Download backup</button>
    <label class="mini-btn file-btn">Restore from file<input type="file" id="backup-file" accept="application/json,.json" hidden></label></div>`);
  $("reports").append(backupCard);

  // ---------- Savings summary (top of the Budget page) ----------
  function renderSavings() {
    const t = monthTotals(selectedMonth), net = round2(t.income - t.expenses);
    const inGoals = sum(goals.map((g) => g.saved)), hasSavingsAcct = accounts.some((a) => a.kind === "savings");
    const tile = (label, value, tone, note) => `<div class="tile ${tone || ""}"><span class="label">${label}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ""}</div>`;
    savingsCard.innerHTML = `<h2>Savings in ${monthName(selectedMonth)}</h2>
      <div class="tiles">
        ${tile("Money in", money(t.income), "good")}
        ${tile("Money spent", money(t.expenses), "bad")}
        ${tile(net >= 0 ? "Saved this month" : "Overspent this month", money(Math.abs(net)), net >= 0 ? "good" : "bad", "Money in minus money spent")}
      </div>
      <h3 class="sub-h">Where your money is now</h3>
      <div class="tiles">
        ${tile("In bank", money(kindSum("checking")))}
        ${tile("In cash", money(kindSum("cash")))}
        ${hasSavingsAcct ? tile("Savings accounts", money(kindSum("savings"))) : ""}
        ${tile("In savings goals", money(inGoals))}
      </div>`;
  }

  // ---------- Monthly plan: edit, copy, quick ideas ----------
  const DEFAULT_IDEAS = ["Rent", "Groceries", "Transport", "Utilities", "Phone", "Internet", "Dining out", "Health"];

  function renderPlan() {
    const plan = getPlan(), spent = getSpentByCategory();
    const names = Object.keys(plan), unplanned = Object.keys(spent).filter((n) => !(n in plan));
    const planned = round2(sum(Object.values(plan))), used = round2(sum(names.map((n) => spent[n] || 0)));
    const extra = round2(sum(unplanned.map((n) => spent[n])));

    // Quick ideas: names you used before, then common ones, that are not in this month's plan yet
    const ideas = [...new Set([...expenseNames, ...DEFAULT_IDEAS])].filter((n) => !(n in plan) && n !== "Other").slice(0, 8);
    planTools.innerHTML = `<p class="hint tools-label">Quick ideas (tap one, then type the amount):</p>
      <div class="chip-row">${ideas.map((n) => `<button type="button" class="filter-btn" data-plan-chip="${esc(n)}">${esc(n)}</button>`).join("")}
      <button type="button" class="filter-btn copy-btn" data-plan-copy="1">Copy last month's plan</button></div>`;

    let html = "";
    if (planned > 0) {
      const left = round2(planned - used), pct = Math.min(100, Math.round((used / planned) * 100));
      html += `<div class="tiles plan-tiles">
        <div class="tile"><span class="label">Planned</span><strong>${money(planned)}</strong></div>
        <div class="tile"><span class="label">Spent on plan</span><strong>${money(used)}</strong></div>
        <div class="tile ${left >= 0 ? "good" : "bad"}"><span class="label">${left >= 0 ? "Left to spend" : "Over plan by"}</span><strong>${money(Math.abs(left))}</strong></div>
      </div><div class="progress big"><div class="bar ${left < 0 ? "over" : ""}" style="width:${pct}%"></div></div>`;
    }
    if (!names.length) html += `<p class="empty">Nothing planned for ${monthName(selectedMonth)} yet. Tap a quick idea above, type your own, or copy last month's plan.</p>`;
    html += names.map((n) => {
      const p = plan[n], u = spent[n] || 0, over = u > p, ratio = p > 0 ? u / p : 0;
      const badge = over ? ["over", "Over"] : ratio >= 0.8 ? ["warn", "Almost there"] : ["ok", "On track"];
      return `<div class="plan-row"><div class="plan-top"><strong>${esc(n)}</strong><span class="badge ${badge[0]}">${badge[1]}</span></div>
        <div class="progress"><div class="bar ${over ? "over" : ""}" style="width:${Math.min(100, Math.round(ratio * 100))}%"></div></div>
        <div class="plan-meta"><span>${money(u)} of ${money(p)}</span><span class="${over ? "over" : ""}">${over ? "Over by " + money(round2(u - p)) : money(round2(p - u)) + " left"}</span>
        <button type="button" class="mini-btn" data-plan-edit="${esc(n)}">Edit</button></div></div>`;
    }).join("");
    if (unplanned.length) {
      html += `<h3 class="sub-h">Spent but not in your plan (${money(extra)})</h3>` + unplanned.map((n) => `<div class="plan-row"><div class="plan-top"><strong>${esc(n)}</strong><span>${money(spent[n])}</span></div>
        <div class="plan-meta"><span class="hint">Not planned</span><button type="button" class="mini-btn" data-plan-add="${esc(n)}">＋ Add to plan</button></div></div>`).join("");
    }
    $("budget-progress").innerHTML = html;
  }

  const planDialog = newDialog("plan-dialog");
  let planEditing = null;
  function openPlanEdit(name) {
    const plan = getPlan();
    if (!(name in plan)) return;
    planEditing = name;
    const spent = getSpentByCategory()[name] || 0;
    planDialog.innerHTML = `<form id="pe-form" novalidate><h2>${esc(name)}</h2>
      <p class="hint">${monthName(selectedMonth)}. Spent so far: ${money(spent)}.</p>
      <label class="field">Planned amount<input type="number" id="pe-amount" step="0.01" min="0" inputmode="decimal" value="${plan[name]}"></label>
      <p id="pe-error" class="error" role="alert"></p>
      <div class="dialog-actions spread"><button type="button" class="mini-btn danger-text" id="pe-remove">Remove</button>
      <span><button type="button" class="filter-btn" id="pe-cancel">Cancel</button> <button type="submit" class="primary-btn">Save</button></span></div></form>`;
    planDialog.showModal();
    $("pe-amount").select();
    $("pe-cancel").addEventListener("click", () => planDialog.close());
    $("pe-remove").addEventListener("click", () => { planDialog.close(); removeFromPlan(name); });
    $("pe-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const amount = parseFloat($("pe-amount").value);
      if (isNaN(amount) || amount <= 0) { $("pe-error").textContent = "Enter an amount greater than 0."; return; }
      budgets[selectedMonth][planEditing] = round2(amount);
      saveData();
      planDialog.close();
      render();
      showToast(planEditing + " updated");
    });
  }

  function copyLastMonth() {
    const before = budgets[previousMonth(selectedMonth)];
    if (!before || !Object.keys(before).length) { showToast("There is no plan for " + monthName(previousMonth(selectedMonth)) + "."); return; }
    if (!budgets[selectedMonth]) budgets[selectedMonth] = {};
    let added = 0;
    Object.entries(before).forEach(([n, amt]) => { if (!(n in budgets[selectedMonth])) { budgets[selectedMonth][n] = amt; added++; } });
    if (!added) { showToast("Everything from last month is already in this plan."); return; }
    saveData();
    render();
    showToast(added + (added === 1 ? " item" : " items") + " copied from last month");
  }

  // ---------- Bills ----------
  // A bill due on day 31 falls on the last day of shorter months
  function dueDate(bill, ym) {
    const [y, m] = ym.split("-").map(Number);
    return ym + "-" + String(Math.min(bill.day, new Date(y, m, 0).getDate())).padStart(2, "0");
  }
  // bill.paid["2026-10"] is either the id of the expense we added, or "manual" (paid another way)
  const paidTx = (b, ym) => (b.paid && typeof b.paid[ym] === "number" ? transactions.find((t) => t.id === b.paid[ym]) : null);
  const isPaid = (b, ym) => !!b.paid && (b.paid[ym] === "manual" || !!paidTx(b, ym));
  function statusOf(b) {
    const ym = thisMonth();
    if (isPaid(b, ym)) return { text: "Paid for " + monthName(ym), cls: "ok" };
    const diff = daysBetween(today(), dueDate(b, ym));
    if (diff < 0) return { text: "Overdue by " + -diff + (diff === -1 ? " day" : " days"), cls: "late" };
    if (diff === 0) return { text: "Due today", cls: "soon" };
    if (diff === 1) return { text: "Due tomorrow", cls: "soon" };
    return { text: "Due in " + diff + " days", cls: diff <= 3 ? "soon" : "" };
  }
  const methodText = (b) => (accountName(b.method) ? "Pays from " + accountName(b.method) : "No payment method set");
  const accountOpts = (selected) => '<option value="">Choose an account…</option>' + accounts.map((a) => `<option value="${a.id}" ${a.id === selected ? "selected" : ""}>${esc(a.name)}${a.kind === "credit" ? " (credit card)" : " · " + money(a.balance)}</option>`).join("");

  function billRow(b, showDay) {
    const st = statusOf(b);
    return `<div class="bill-row clickable-row" data-bill-open="${b.id}" role="button" tabindex="0" aria-label="Open ${esc(b.name)}">
      <div><strong>${esc(b.name)}</strong><div class="hint bill-${st.cls}">${st.text}</div><div class="hint">${esc(methodText(b))}${showDay ? " · every month on day " + b.day : ""}</div></div>
      <div class="bill-right"><strong>${money(b.amount)}</strong><span class="chev" aria-hidden="true">›</span></div></div>`;
  }
  function renderBills() {
    billsCard.style.display = bills.length ? "" : "none";
    const ym = thisMonth(), byDue = [...bills].sort((x, y) => dueDate(x, ym).localeCompare(dueDate(y, ym)));
    $("bills-list").innerHTML = byDue.map((b) => billRow(b, false)).join("");
    $("bill-manage-list").innerHTML = byDue.length ? byDue.map((b) => billRow(b, true)).join("") : '<p class="empty">No bills yet. Add your rent, phone or subscriptions above.</p>';
    const select = $("bill-method"), keep = select.value;
    select.innerHTML = accountOpts("");
    select.value = keep;
  }

  $("bill-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("bill-name").value.trim(), amount = parseFloat($("bill-amount").value), day = parseInt($("bill-day").value, 10), err = $("bill-error");
    if (!name) { err.textContent = "Enter the bill name."; return; }
    if (isNaN(amount) || amount <= 0) { err.textContent = "Enter an amount greater than 0."; return; }
    if (isNaN(day) || day < 1 || day > 31) { err.textContent = "Due day must be from 1 to 31."; return; }
    err.textContent = "";
    const paid = {};
    if ($("bill-already").checked) paid[thisMonth()] = "manual"; // paid another way: nothing is deducted
    bills.push({ id: Date.now(), name, amount: round2(amount), day, method: $("bill-method").value, paid });
    e.target.reset();
    saveData();
    render();
    showToast("Bill added");
  });

  // The bill pop-up: pay, mark as already paid, or edit
  const billDialog = newDialog("bill-dialog");
  let openBillId = null;
  function openBill(id) { openBillId = id; drawBill(); if (!billDialog.open) billDialog.showModal(); }
  function drawBill() {
    const b = bills.find((x) => x.id === openBillId);
    if (!b) { if (billDialog.open) billDialog.close(); return; }
    const ym = thisMonth(), paid = isPaid(b, ym), tx = paidTx(b, ym), st = statusOf(b);
    const action = paid
      ? `<p>${tx ? "Paid on " + prettyDate(tx.date) + " from <strong>" + esc(accountName(tx.accountId) || "an account") + "</strong>." : "Marked as already paid. Nothing was taken from your accounts."}</p>
         <button type="button" class="filter-btn" data-bd="undo">${tx ? "Undo this payment" : "Undo"}</button>`
      : `<label class="field">Pay from<select id="bd-method">${accountOpts(b.method)}</select></label>
         <button type="button" class="primary-btn" data-bd="pay">Pay ${money(b.amount)} now</button>
         <button type="button" class="filter-btn" data-bd="manual">I already paid this month</button>
         <p class="hint"><strong>Pay now</strong> adds the expense and takes the money from that account. <strong>Already paid</strong> only marks the bill as done: no expense is added and no balance changes.</p>`;
    billDialog.innerHTML = `<h2>${esc(b.name)}</h2>
      <p class="hint">${money(b.amount)} · due ${prettyDate(dueDate(b, ym))} · <span class="bill-${st.cls}">${st.text}</span></p>
      <div class="bill-section">${action}</div>
      <p id="bd-error" class="error" role="alert"></p>
      <details class="bill-edit"><summary>Edit bill</summary>
        <div class="bill-form">
          <label class="field wide">Name<input id="bd-name" maxlength="30" value="${esc(b.name)}"></label>
          <label class="field">Amount<input id="bd-amount" type="number" step="0.01" min="0" inputmode="decimal" value="${b.amount}"></label>
          <label class="field">Due day<input id="bd-day" type="number" min="1" max="31" inputmode="numeric" value="${b.day}"></label>
          <label class="field wide">Usual payment method<select id="bd-default">${accountOpts(b.method)}</select></label>
        </div>
        <div class="dialog-actions spread"><button type="button" class="mini-btn danger-text" data-bd="delete">Delete bill</button><button type="button" class="primary-btn" data-bd="save">Save changes</button></div>
      </details>
      <div class="dialog-actions"><button type="button" class="filter-btn" data-bd="close">Close</button></div>`;
  }
  billDialog.addEventListener("click", (e) => {
    const act = e.target.closest("[data-bd]");
    if (!act) return;
    const b = bills.find((x) => x.id === openBillId), err = $("bd-error"), ym = thisMonth();
    if (!b) return;
    const what = act.dataset.bd;
    if (what === "close") billDialog.close();
    else if (what === "manual") { b.paid = b.paid || {}; b.paid[ym] = "manual"; saveData(); render(); drawBill(); showToast(b.name + " marked as paid"); }
    else if (what === "pay") {
      const account = getAccount($("bd-method").value);
      if (!account) { err.textContent = "Choose which account to pay from."; return; }
      if (account.kind !== "credit" && b.amount > account.balance + 0.004) { err.textContent = account.name + " only has " + money(account.balance) + ". Pick another account."; return; }
      const t = { id: Date.now(), type: "expense", amount: b.amount, category: b.name, description: b.name + " (bill)", date: today(), accountId: account.id };
      if (!expenseNames.includes(b.name)) { expenseNames.push(b.name); fillCategories(); } // so it counts toward a plan item with the same name
      transactions.push(t);
      applyEffect(t, 1);
      b.paid = b.paid || {};
      b.paid[ym] = t.id;
      if (!b.method) b.method = account.id;
      saveData(); render(); drawBill(); showToast(b.name + " paid from " + account.name);
    } else if (what === "undo") {
      const tx = paidTx(b, ym);
      if (tx) { applyEffect(tx, -1); transactions.splice(transactions.indexOf(tx), 1); }
      delete b.paid[ym];
      saveData(); render(); drawBill(); showToast("Payment undone");
    } else if (what === "save") {
      const name = $("bd-name").value.trim(), amount = parseFloat($("bd-amount").value), day = parseInt($("bd-day").value, 10);
      if (!name) { err.textContent = "Enter the bill name."; return; }
      if (isNaN(amount) || amount <= 0) { err.textContent = "Enter an amount greater than 0."; return; }
      if (isNaN(day) || day < 1 || day > 31) { err.textContent = "Due day must be from 1 to 31."; return; }
      Object.assign(b, { name, amount: round2(amount), day, method: $("bd-default").value });
      saveData(); render(); drawBill(); showToast("Bill updated");
    } else if (what === "delete") {
      if (!confirm("Delete " + b.name + "? Payments you already made stay in your history.")) return;
      bills = bills.filter((x) => x !== b);
      billDialog.close(); saveData(); render();
    }
  });

  // ---------- Savings goals (money really moves) ----------
  const monthsUntil = (date) => Math.max(1, Math.ceil(daysBetween(today(), date) / 30.44));

  function renderGoals() {
    $("goal-list").innerHTML = goals.length ? goals.map((g) => {
      const left = round2(Math.max(0, g.target - g.saved)), done = left <= 0.004, pct = Math.min(100, Math.round((g.saved / g.target) * 100));
      let plan = "";
      if (done) plan = "Goal reached 🎉";
      else if (g.date) plan = daysBetween(today(), g.date) < 0 ? "The finish date has passed." : "Save about " + money(round2(left / monthsUntil(g.date))) + " a month to finish by " + monthName(g.date.slice(0, 7)) + ".";
      const hist = (g.history || []).slice(-6).reverse().map((h) => `<li><span>${prettyDate(h.date)} · ${h.amount > 0 ? "Added from" : "Taken out to"} ${esc(accountName(h.accountId) || "an account")}</span><strong class="${h.amount > 0 ? "income" : "expense"}">${h.amount > 0 ? "+" : "−"}${money(Math.abs(h.amount))}</strong></li>`).join("");
      return `<div class="goal-row">
        <div class="goal-top"><strong>${esc(g.name)}</strong><span>${pct}%</span></div>
        <div class="progress"><div class="bar" style="width:${pct}%"></div></div>
        <p class="hint" style="margin:8px 0 0">${money(g.saved)} saved of ${money(g.target)}${done ? "" : " · " + money(left) + " to go"}</p>
        ${plan ? `<p class="hint goal-plan">${plan}</p>` : ""}
        <div class="goal-actions">${done ? "" : `<button type="button" class="primary-btn" data-goal-add="${g.id}">＋ Add money</button>`}${g.saved > 0 ? `<button type="button" class="filter-btn" data-goal-take="${g.id}">Take out</button>` : ""}<button type="button" class="filter-btn" data-goal-edit="${g.id}">Edit</button></div>
        ${hist ? `<details class="goal-hist"><summary>Recent activity</summary><ul>${hist}</ul></details>` : ""}</div>`;
    }).join("") : '<p class="empty">No goals yet. Try "Emergency fund", "New laptop" or "Trip".</p>';
  }

  $("goal-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("goal-name").value.trim(), target = parseFloat($("goal-target").value), date = $("goal-date").value, err = $("goal-error");
    if (!name) { err.textContent = "Enter what you are saving for."; return; }
    if (isNaN(target) || target <= 0) { err.textContent = "Enter a target amount greater than 0."; return; }
    if (date && date < today()) { err.textContent = "Pick a finish date in the future, or leave it empty."; return; }
    err.textContent = "";
    goals.push({ id: Date.now(), name, target: round2(target), saved: 0, date, history: [] });
    e.target.reset();
    saveData();
    render();
    showToast("Goal added");
  });

  // Add money / take out: pick the account and the amount
  const goalDialog = newDialog("goal-dialog");
  goalDialog.innerHTML = `<form id="gm-form" novalidate><h2 id="gm-title"></h2><p id="gm-sub" class="hint"></p>
    <label class="field"><span id="gm-account-label"></span><select id="gm-account"></select></label>
    <label class="field">Amount<input type="number" id="gm-amount" step="0.01" min="0" inputmode="decimal" placeholder="0.00"></label>
    <p id="gm-error" class="error" role="alert"></p>
    <div class="dialog-actions"><button type="button" id="gm-cancel" class="filter-btn">Cancel</button><button type="submit" class="primary-btn">Confirm</button></div></form>`;
  let moving = null; // { goalId, direction }  direction: 1 = add, -1 = take out
  function openMove(goalId, direction) {
    const g = goals.find((x) => x.id === goalId);
    if (!g) return;
    moving = { goalId, direction };
    $("gm-title").textContent = (direction > 0 ? "Add money to " : "Take money out of ") + g.name;
    $("gm-sub").textContent = direction > 0 ? money(round2(g.target - g.saved)) + " to go." : money(g.saved) + " is saved in this goal.";
    $("gm-account-label").textContent = direction > 0 ? "Take it from" : "Put it back in";
    $("gm-account").innerHTML = accounts.filter((a) => a.kind !== "credit").map((a) => `<option value="${a.id}">${esc(a.name)} (${money(a.balance)})</option>`).join("");
    $("gm-amount").value = "";
    $("gm-error").textContent = "";
    goalDialog.showModal();
  }
  $("gm-cancel").addEventListener("click", () => goalDialog.close());
  $("gm-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const g = goals.find((x) => x.id === moving.goalId), account = getAccount($("gm-account").value), err = $("gm-error");
    const amount = round2(parseFloat($("gm-amount").value));
    if (!g || !account) { goalDialog.close(); return; }
    if (isNaN(amount) || amount <= 0) { err.textContent = "Enter an amount greater than 0."; return; }
    if (moving.direction > 0) {
      if (amount > account.balance + 0.004) { err.textContent = account.name + " only has " + money(account.balance) + "."; return; }
      if (amount > round2(g.target - g.saved) + 0.004) { err.textContent = "You only need " + money(round2(g.target - g.saved)) + " more."; return; }
    } else if (amount > g.saved + 0.004) { err.textContent = "Only " + money(g.saved) + " is saved in this goal."; return; }
    const signed = moving.direction * amount;
    moveMoney(account, -signed); // adding to a goal takes money out of the account
    g.saved = Math.max(0, round2(g.saved + signed));
    g.history = g.history || [];
    g.history.push({ id: Date.now(), date: today(), amount: signed, accountId: account.id });
    goalDialog.close();
    saveData();
    render();
    showToast(g.saved >= g.target ? "Goal reached! 🎉" : signed > 0 ? "Added to " + g.name : "Moved back to " + account.name);
  });

  // Edit a goal (name, target, finish date) or delete it
  const goalEditDialog = newDialog("goal-edit-dialog");
  let editingGoal = null;
  function openGoalEdit(id) {
    const g = goals.find((x) => x.id === id);
    if (!g) return;
    editingGoal = id;
    goalEditDialog.innerHTML = `<form id="ge-form" novalidate><h2>Edit goal</h2>
      <label class="field">Name<input id="ge-name" maxlength="30" value="${esc(g.name)}"></label>
      <label class="field">Target amount<input id="ge-target" type="number" step="0.01" min="0" inputmode="decimal" value="${g.target}"></label>
      <label class="field">Finish by (optional)<input id="ge-date" type="date" value="${g.date || ""}"></label>
      <p id="ge-error" class="error" role="alert"></p>
      <div class="dialog-actions spread"><button type="button" class="mini-btn danger-text" id="ge-delete">Delete goal</button>
      <span><button type="button" class="filter-btn" id="ge-cancel">Cancel</button> <button type="submit" class="primary-btn">Save</button></span></div></form>`;
    goalEditDialog.showModal();
    $("ge-cancel").addEventListener("click", () => goalEditDialog.close());
    $("ge-delete").addEventListener("click", () => {
      if (g.saved > 0) { $("ge-error").textContent = "Take the " + money(g.saved) + " out first, then you can delete this goal."; return; }
      if (!confirm("Delete this goal?")) return;
      goals = goals.filter((x) => x !== g);
      goalEditDialog.close(); saveData(); render();
    });
    $("ge-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("ge-name").value.trim(), target = parseFloat($("ge-target").value), date = $("ge-date").value, err = $("ge-error");
      if (!name) { err.textContent = "Enter a name."; return; }
      if (isNaN(target) || target <= 0) { err.textContent = "Enter a target amount greater than 0."; return; }
      if (target < g.saved - 0.004) { err.textContent = "The target cannot be less than the " + money(g.saved) + " already saved."; return; }
      Object.assign(g, { name, target: round2(target), date });
      goalEditDialog.close(); saveData(); render(); showToast("Goal updated");
    });
  }

  // ---------- One click listener for the buttons in the new pieces ----------
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-jump],[data-bill-open],[data-plan-chip],[data-plan-copy],[data-plan-edit],[data-plan-add],[data-goal-add],[data-goal-take],[data-goal-edit]");
    if (!b) return;
    const d = b.dataset;
    if (d.jump) { const target = $(d.jump); if (target) target.scrollIntoView({ behavior: "smooth", block: "start" }); }
    else if (d.billOpen) openBill(Number(d.billOpen));
    else if (d.planChip) { $("plan-name").value = d.planChip; $("plan-amount").focus(); }
    else if (d.planCopy) copyLastMonth();
    else if (d.planEdit) openPlanEdit(d.planEdit);
    else if (d.planAdd) {
      if (!budgets[selectedMonth]) budgets[selectedMonth] = {};
      budgets[selectedMonth][d.planAdd] = round2(getSpentByCategory()[d.planAdd] || 0) || 1;
      saveData(); render(); showToast(d.planAdd + " added to the plan");
    }
    else if (d.goalAdd) openMove(Number(d.goalAdd), 1);
    else if (d.goalTake) openMove(Number(d.goalTake), -1);
    else if (d.goalEdit) openGoalEdit(Number(d.goalEdit));
  });
  document.addEventListener("keydown", (e) => {
    const row = e.target.closest && e.target.closest("[data-bill-open]");
    if (row && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openBill(Number(row.dataset.billOpen)); }
  });

  // ---------- Backup and restore ----------
  $("backup-export").addEventListener("click", () => {
    const file = { app: "FinTrack", version: 1, exportedAt: new Date().toISOString(), data: getState() };
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }));
    link.download = "fintrack-backup-" + today() + ".json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    showToast("Backup downloaded");
  });
  $("backup-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // lets you pick the same file again later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result).data;
        const lists = ["transactions", "accounts", "contacts", "loans", "transfers", "goals", "bills", "expenseNames"];
        const maps = ["budgets", "savingsPlan"];
        const bad = !data || typeof data !== "object" || !Array.isArray(data.transactions) ||
          lists.some((k) => data[k] !== undefined && !Array.isArray(data[k])) ||
          maps.some((k) => data[k] !== undefined && (!data[k] || typeof data[k] !== "object" || Array.isArray(data[k])));
        if (bad) throw new Error("not a backup");
        if (!confirm("Replace ALL your current data with this backup (" + data.transactions.length + " transactions)?")) return;
        loadState(data);
        saveData();
        fillCategories();
        render();
        showToast("Backup restored");
      } catch (err) {
        showToast("That file is not a FinTrack backup.");
      }
    };
    reader.readAsText(file);
  });

  // script.js calls this at the end of every render()
  window.renderExtras = function () {
    renderSavings();
    renderPlan();
    renderBills();
    renderGoals();
    // Home: tell the user how much is set aside, so Available money makes sense
    const note = document.querySelector(".money-hero .hero-main small"), inGoals = sum(goals.map((g) => g.saved));
    if (note) {
      if (!note.dataset.base) note.dataset.base = note.textContent;
      note.textContent = note.dataset.base + (inGoals > 0 ? " " + money(inGoals) + " is set aside in savings goals." : "");
    }
  };
  window.renderExtras();
})();
