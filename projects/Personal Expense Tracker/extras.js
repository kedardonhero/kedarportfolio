// ============================================================
// FinTrack extras (loaded after script.js, so it shares its variables and helpers)
//   - Budget & savings page: four tabs (Overview, Monthly plan, Bills, Goals) with smarter inputs
//   - Home: every dashboard card opens its own pop-up (income, expenses, left budget, saved, friends, net worth, available money)
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

  // ---------- Build the Budget & savings page: four tabs (Overview, Monthly plan, Bills, Goals) ----------
  const curSym = () => { try { return (0).toLocaleString(undefined, { style: "currency", currency: currentCurrency, currencyDisplay: "narrowSymbol", minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/[\d.,\s\u00a0]/g, "") || "$"; } catch (e) { return "$"; } };
  const nextMonth = (ym) => { const [y, m] = ym.split("-").map(Number), d = new Date(y, m, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
  const ymd = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const shortMonth = (ym) => new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1).toLocaleString("en-US", { month: "short" });
  const amountField = (id) => `<span class="amt"><span class="cur">$</span><input id="${id}" type="number" step="0.01" min="0" inputmode="decimal" placeholder="0.00"></span>`;
  const chips = (list, attr) => list.map(([label, value]) => `<button type="button" class="filter-btn" data-${attr}="${esc(value)}">${esc(label)}</button>`).join("");

  const billsCard = newCard("bills-card", '<h2>Upcoming bills</h2><div id="bills-list"></div>');
  $("alerts").after(billsCard); // on Home, under the alerts

  const TABS = [["overview", "Overview", "layout-dashboard"], ["plan", "Monthly plan", "target"], ["bills", "Bills", "receipt"], ["goals", "Goals", "piggy-bank"]];
  const budgetTitle = document.querySelector("#budget h1");
  budgetTitle.textContent = "Budget & savings";
  const tabBar = document.createElement("div");
  tabBar.className = "bs-tabs";
  tabBar.setAttribute("role", "tablist");
  tabBar.innerHTML = TABS.map(([key, label, icon]) => `<button type="button" role="tab" class="bs-tab" data-bs-tab="${key}" aria-selected="false"><i data-lucide="${icon}"></i><span>${label}</span><b class="bs-count" hidden></b></button>`).join("");
  budgetTitle.after(tabBar);
  const panel = {};
  TABS.forEach(([key]) => { const d = document.createElement("div"); d.className = "bs-panel"; d.id = "bs-" + key; d.setAttribute("role", "tabpanel"); panel[key] = d; });
  tabBar.after(panel.overview, panel.plan, panel.bills, panel.goals);

  function setTab(name) {
    if (!panel[name]) name = "overview";
    tabBar.querySelectorAll(".bs-tab").forEach((b) => { const on = b.dataset.bsTab === name; b.classList.toggle("active", on); b.setAttribute("aria-selected", on ? "true" : "false"); });
    Object.keys(panel).forEach((k) => panel[k].classList.toggle("active", k === name));
  }
  window.budgetTab = setTab;

  // Overview tab
  const snapshotCard = newCard("bs-snapshot", "");
  const savingsCard = newCard("savings-summary", "");
  const billsMini = newCard("bs-bills-mini", "");
  const goalsMini = newCard("bs-goals-mini", "");
  panel.overview.append(snapshotCard, savingsCard, billsMini, goalsMini);

  // Monthly plan tab: the old form and list are moved here, and the form gets smarter inputs
  const planTools = document.createElement("div");
  planTools.id = "plan-tools";
  const planForm = $("plan-form");
  planForm.classList.add("adv");
  planForm.innerHTML = `<div class="adv-head"><h2>Add to your plan</h2><span class="hint" id="pf-income"></span></div>
    <label class="field">What is the expense?<input type="text" id="plan-name" maxlength="30" list="plan-name-list" autocomplete="off" placeholder="e.g. Rent, Electricity, Shopping"><datalist id="plan-name-list"></datalist></label>
    <label class="field">Planned amount${amountField("plan-amount")}</label>
    <div class="chip-row"><span class="hint chip-label">Add:</span>${[10, 50, 100, 500].map((n) => `<button type="button" class="filter-btn" data-qa="${n}">+${n}</button>`).join("")}<button type="button" class="filter-btn" data-qa="clear">Clear</button></div>
    <div class="pf-preview" id="pf-preview" aria-live="polite"></div>
    <button type="submit" class="primary-btn">Add to plan</button>`;
  panel.plan.append(document.querySelector("#budget > p.hint"), planForm, $("budget-error"), planTools, document.querySelector("#budget .budget-status"));

  // Bills tab
  const billsSummary = newCard("bills-summary", "");
  const billsAdd = newCard("bills-manage", `<h2>Add a bill</h2>
    <p class="hint">Bills that repeat every month. Tap a bill in your list to pay it, mark it as already paid, or edit it.</p>
    <form id="bill-form" class="bill-form adv" novalidate>
      <label class="field wide">Bill name<input type="text" id="bill-name" maxlength="30" list="bill-name-list" autocomplete="off" placeholder="e.g. Rent, Netflix, Phone"><datalist id="bill-name-list"></datalist></label>
      <div class="chip-row wide">${chips(["Rent", "Phone", "Internet", "Electricity", "Netflix", "Insurance"].map((n) => [n, n]), "bill-idea")}</div>
      <label class="field">Amount${amountField("bill-amount")}</label>
      <label class="field">Due day of month<input id="bill-day" type="number" min="1" max="31" inputmode="numeric" placeholder="1 to 31"></label>
      <div class="chip-row wide"><span class="hint chip-label">Due on the:</span>${chips([["1st", 1], ["5th", 5], ["10th", 10], ["15th", 15], ["20th", 20], ["25th", 25], ["Last day", 31]], "bday")}</div>
      <label class="field wide">Pay from<select id="bill-method"></select></label>
      <label class="check wide"><input type="checkbox" id="bill-already"> I already paid this month. Do not take it from my accounts.</label>
      <div class="pf-preview wide" id="bill-preview" aria-live="polite"></div>
      <button type="submit" class="primary-btn wide">Add bill</button>
    </form>
    <p id="bill-error" class="error" role="alert"></p>`);
  const billsListCard = newCard("bills-list-card", `<h2>Your bills</h2><div id="bill-manage-list"></div>`);
  panel.bills.append(billsSummary, billsAdd, billsListCard);

  // Goals tab
  const goalsSummary = newCard("goals-summary", "");
  const goalsCard = newCard("goals-card", `<h2>New savings goal</h2>
    <p class="hint">Pick something to save for. Money you add moves out of your cash or bank account into the goal, so all your balances stay correct.</p>
    <form id="goal-form" class="bill-form adv" novalidate>
      <label class="field wide">What are you saving for?<input type="text" id="goal-name" maxlength="30" autocomplete="off" placeholder="e.g. Emergency fund, Laptop, Trip"></label>
      <div class="chip-row wide">${chips(["Emergency fund", "Laptop", "Trip", "Car", "Home", "Wedding"].map((n) => [n, n]), "goal-idea")}</div>
      <label class="field">Target amount${amountField("goal-target")}</label>
      <label class="field">Finish by (optional)<input id="goal-date" type="date"></label>
      <div class="chip-row wide"><span class="hint chip-label">Target:</span>${chips([["500", 500], ["1,000", 1000], ["5,000", 5000], ["10,000", 10000]], "gtarget")}</div>
      <div class="chip-row wide"><span class="hint chip-label">Finish in:</span>${chips([["3 months", 3], ["6 months", 6], ["1 year", 12], ["2 years", 24]], "gmonths")}</div>
      <div class="pf-preview wide" id="goal-preview" aria-live="polite"></div>
      <button type="submit" class="primary-btn wide">Add goal</button>
    </form>
    <p id="goal-error" class="error" role="alert"></p>`);
  const goalsListCard = newCard("goals-list-card", `<h2>Your goals</h2><div id="goal-list"></div>`);
  panel.goals.append(goalsSummary, goalsCard, goalsListCard);

  const backupCard = newCard("backup-card", `<h2>Backup &amp; restore</h2>
    <p class="hint">Save a copy of all your data as a file, or load a copy you saved earlier. Restoring replaces the data in your account.</p>
    <div class="backup-actions"><button type="button" class="primary-btn" id="backup-export">Download backup</button>
    <label class="mini-btn file-btn">Restore from file<input type="file" id="backup-file" accept="application/json,.json" hidden></label></div>`);
  $("reports").append(backupCard);
  setTab("overview");

  // Pace of spending for the real current month (null for other months)
  function paceInfo(planned, used) {
    if (selectedMonth !== thisMonth()) return null;
    const now = new Date(), dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), day = now.getDate(), left = round2(planned - used);
    return { dim, day, daysLeft: dim - day + 1, daily: left > 0 ? round2(left / (dim - day + 1)) : 0, monthPct: Math.round((day / dim) * 100) };
  }
  const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");

  // ---------- Overview tab ----------
  function renderSnapshot() {
    const planned = round2(sum(Object.values(getPlan()))), used = monthTotals(selectedMonth).expenses;
    if (planned <= 0) {
      snapshotCard.innerHTML = `<div class="snap-head"><h2>Budget in ${monthName(selectedMonth)}</h2></div>
        <p class="empty">No plan for ${monthName(selectedMonth)} yet.</p>
        <div class="snap-actions"><button type="button" class="primary-btn" data-bs-go="plan">Create your plan</button><button type="button" class="filter-btn" data-plan-copy="1">Copy last month's plan</button></div>`;
      return;
    }
    const left = round2(planned - used), pct = Math.min(100, Math.round((used / planned) * 100)), p = paceInfo(planned, used);
    snapshotCard.innerHTML = `<div class="snap-head"><h2>Budget in ${monthName(selectedMonth)}</h2><button type="button" class="mini-btn" data-dash="budget">Full details</button></div>
      <div class="snap-main ${left >= 0 ? "good" : "bad"}"><strong>${money(Math.abs(left))}</strong><span>${left >= 0 ? "left to spend" : "over your plan"}</span></div>
      <div class="progress big"><div class="bar ${left < 0 ? "over" : ""}" style="width:${pct}%"></div></div>
      <div class="plan-meta"><span>${money(used)} spent</span><span>${money(planned)} planned</span></div>
      ${p && left > 0 ? `<p class="snap-note">About <strong>${money(p.daily)}</strong> a day for the next ${plural(p.daysLeft, "day")}.</p>` : ""}
      <div class="snap-actions"><button type="button" class="primary-btn" data-bs-go="plan">Edit plan</button><button type="button" class="filter-btn" data-dash="expense">Where it went</button></div>`;
  }

  function renderSavings() {
    const t = monthTotals(selectedMonth), net = round2(t.income - t.expenses), rate = t.income > 0 ? Math.round((net / t.income) * 100) : null;
    const inGoals = sum(goals.map((g) => g.saved)), hasSavingsAcct = accounts.some((a) => a.kind === "savings");
    const tile = (label, value, tone, note) => `<div class="tile ${tone || ""}"><span class="label">${label}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ""}</div>`;
    const parts = [["In bank", kindSum("checking"), "c1"], ["In cash", kindSum("cash"), "c2"], ["Savings accounts", kindSum("savings"), "c3"], ["In goals", inGoals, "c4"]].filter((x) => x[1] > 0);
    const total = sum(parts.map((x) => x[1]));
    savingsCard.innerHTML = `<div class="snap-head"><h2>Savings in ${monthName(selectedMonth)}</h2><button type="button" class="mini-btn" data-dash="saved">Details</button></div>
      <div class="tiles">
        ${tile("Money in", money(t.income), "good")}
        ${tile("Money spent", money(t.expenses), "bad")}
        ${tile(net >= 0 ? "Saved this month" : "Overspent this month", money(Math.abs(net)), net >= 0 ? "good" : "bad", rate !== null ? rate + "% of your income" : "Money in minus money spent")}
      </div>
      <h3 class="sub-h">Where your money is now</h3>
      ${total > 0 ? `<div class="stack" role="img" aria-label="Where your money is">${parts.map((x) => `<span class="stk ${x[2]}" style="width:${(x[1] / total) * 100}%"></span>`).join("")}</div>` : ""}
      <div class="tiles">
        ${tile("In bank", money(kindSum("checking")))}
        ${tile("In cash", money(kindSum("cash")))}
        ${hasSavingsAcct ? tile("Savings accounts", money(kindSum("savings"))) : ""}
        ${tile("In savings goals", money(inGoals))}
      </div>`;
  }

  function renderMiniBills() {
    const ym = thisMonth(), open = bills.filter((b) => !isPaid(b, ym)).sort((x, y) => dueDate(x, ym).localeCompare(dueDate(y, ym)));
    let body;
    if (!bills.length) body = '<p class="empty">No bills yet. Add rent, phone or subscriptions so you never miss one.</p>';
    else if (!open.length) body = `<p class="empty">All bills are paid for ${monthName(ym)} 🎉</p>`;
    else body = open.slice(0, 3).map((b) => billRow(b, false)).join("");
    billsMini.innerHTML = `<div class="snap-head"><h2>Bills coming up</h2><button type="button" class="mini-btn" data-bs-go="bills">${bills.length ? "All bills" : "Add a bill"}</button></div>${body}`;
  }

  function renderMiniGoals() {
    let body;
    if (!goals.length) body = '<p class="empty">No goals yet. Try "Emergency fund", "New laptop" or "Trip".</p>';
    else body = goals.slice(0, 3).map((g) => { const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
      return `<div class="mini-goal"><div class="plan-top"><strong>${esc(g.name)}</strong><span>${pct}%</span></div><div class="progress thin"><div class="bar" style="width:${pct}%"></div></div><div class="hint">${money(g.saved)} of ${money(g.target)}</div></div>`; }).join("");
    goalsMini.innerHTML = `<div class="snap-head"><h2>Savings goals</h2><button type="button" class="mini-btn" data-bs-go="goals">${goals.length ? "All goals" : "Add a goal"}</button></div>${body}`;
  }

  // ---------- Monthly plan tab ----------
  const DEFAULT_IDEAS = ["Rent", "Groceries", "Transport", "Utilities", "Phone", "Internet", "Dining out", "Health"];
  let planSort = "size"; // size | used | az

  function renderPlan() {
    const plan = getPlan(), spent = getSpentByCategory();
    const names = Object.keys(plan), unplanned = Object.keys(spent).filter((n) => !(n in plan));
    const planned = round2(sum(Object.values(plan))), used = round2(sum(Object.values(spent)));
    const extra = round2(sum(unplanned.map((n) => spent[n])));
    const income = monthTotals(selectedMonth).income;

    $("plan-name-list").innerHTML = [...new Set([...expenseNames, ...DEFAULT_IDEAS])].filter((n) => n !== "Other").map((n) => `<option value="${esc(n)}"></option>`).join("");

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
        <div class="tile"><span class="label">Spent</span><strong>${money(used)}</strong></div>
        <div class="tile ${left >= 0 ? "good" : "bad"}"><span class="label">${left >= 0 ? "Left to spend" : "Over plan by"}</span><strong>${money(Math.abs(left))}</strong></div>
      </div><div class="progress big"><div class="bar ${left < 0 ? "over" : ""}" style="width:${pct}%"></div></div>
      <p class="hint plan-foot">${pct}% of your plan is used.${extra > 0 ? ` Includes ${money(extra)} spent on things that are not in your plan.` : ""}${income > 0 ? ` Your plan is ${Math.round((planned / income) * 100)}% of this month's income (${money(income)}).` : ""}</p>`;
    }
    if (!names.length) html += `<p class="empty">Nothing planned for ${monthName(selectedMonth)} yet. Tap a quick idea above, type your own, or copy last month's plan.</p>`;
    if (names.length > 1) {
      html += `<div class="sort-row"><span class="hint chip-label">Sort:</span>${[["size", "Biggest"], ["used", "Most used"], ["az", "A to Z"]].map(([k, label]) => `<button type="button" class="filter-btn ${planSort === k ? "active" : ""}" data-plan-sort="${k}">${label}</button>`).join("")}</div>`;
    }
    const ratioOf = (n) => (spent[n] || 0) / plan[n];
    const sorted = names.slice().sort((a, b) => planSort === "az" ? a.localeCompare(b) : planSort === "used" ? ratioOf(b) - ratioOf(a) : plan[b] - plan[a]);
    html += sorted.map((n) => {
      const p = plan[n], u = spent[n] || 0, over = u > p, ratio = p > 0 ? u / p : 0;
      const badge = over ? ["over", "Over"] : ratio >= 1 ? ["warn", "Fully used"] : ratio >= 0.8 ? ["warn", "Almost there"] : ["ok", "On track"];
      return `<div class="plan-row"><div class="plan-top"><strong>${esc(n)}</strong><span class="badge ${badge[0]}">${badge[1]}</span></div>
        <div class="progress"><div class="bar ${over ? "over" : ""}" style="width:${Math.min(100, Math.round(ratio * 100))}%"></div></div>
        <div class="plan-meta"><span>${money(u)} of ${money(p)} <small>(${Math.round(ratio * 100)}%)</small></span><span class="${over ? "over" : ""}">${over ? "Over by " + money(round2(u - p)) : money(round2(p - u)) + " left"}</span>
        <button type="button" class="mini-btn" data-plan-edit="${esc(n)}">Edit</button></div></div>`;
    }).join("");
    if (unplanned.length) {
      html += `<h3 class="sub-h">Spent but not in your plan (${money(extra)})</h3>` + unplanned.map((n) => `<div class="plan-row"><div class="plan-top"><strong>${esc(n)}</strong><span>${money(spent[n])}</span></div>
        <div class="plan-meta"><span class="hint">Not planned</span><button type="button" class="mini-btn" data-plan-add="${esc(n)}">＋ Add to plan</button></div></div>`).join("");
    }
    $("budget-progress").innerHTML = html;
  }

  // Live preview under the plan form: what the plan will look like after you save
  function updatePlanPreview() {
    const box = $("pf-preview");
    if (!box) return;
    const name = $("plan-name").value.trim().toLowerCase(), amt = parseFloat($("plan-amount").value);
    const plan = getPlan(), prev = budgets[previousMonth(selectedMonth)] || {};
    const key = Object.keys(plan).find((n) => n.toLowerCase() === name), prevKey = Object.keys(prev).find((n) => n.toLowerCase() === name);
    const income = monthTotals(selectedMonth).income, total = round2(sum(Object.values(plan)));
    const lines = [];
    if (name && key) lines.push(`<strong>${esc(key)}</strong> is already planned at ${money(plan[key])}. Saving will change it.`);
    if (name && prevKey) lines.push(`Last month: <strong>${money(prev[prevKey])}</strong> <button type="button" class="link-btn" data-plan-last="${prev[prevKey]}">Use this amount</button>`);
    const after = amt > 0 ? round2(total - (key ? plan[key] : 0) + amt) : total;
    lines.push(`${amt > 0 ? "Plan total after saving" : "Plan total now"}: <strong>${money(after)}</strong>${income > 0 ? ` · ${Math.round((after / income) * 100)}% of income (${money(income)})` : ""}`);
    if (income > 0 && after > income) lines.push('<span class="warn-text">This is more than the income you have recorded this month.</span>');
    box.innerHTML = lines.map((l) => `<div>${l}</div>`).join("");
    const note = $("pf-income");
    if (note) note.textContent = income > 0 ? "Income so far: " + money(income) : "";
  }
  planForm.addEventListener("input", updatePlanPreview);

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
    $("bill-name-list").innerHTML = [...new Set([...bills.map((b) => b.name), "Rent", "Phone", "Internet", "Electricity", "Netflix", "Insurance"])].map((n) => `<option value="${esc(n)}"></option>`).join("");

    // Summary tiles for this real month
    const total = round2(sum(bills.map((b) => b.amount))), paid = round2(sum(bills.filter((b) => isPaid(b, ym)).map((b) => b.amount))), open = bills.filter((b) => !isPaid(b, ym));
    const late = open.filter((b) => daysBetween(today(), dueDate(b, ym)) < 0).length, soon = open.filter((b) => { const d = daysBetween(today(), dueDate(b, ym)); return d >= 0 && d <= 3; }).length;
    billsSummary.style.display = bills.length ? "" : "none";
    billsSummary.innerHTML = `<div class="tiles">
      <div class="tile"><span class="label">Every month</span><strong>${money(total)}</strong><small>${plural(bills.length, "bill")}</small></div>
      <div class="tile good"><span class="label">Paid in ${shortMonth(ym)}</span><strong>${money(paid)}</strong></div>
      <div class="tile ${late ? "bad" : ""}"><span class="label">Still to pay</span><strong>${money(round2(total - paid))}</strong><small>${late ? plural(late, "bill") + " overdue" : open.length ? "Nothing overdue" : "All paid"}</small></div></div>`;
    const badge = tabBar.querySelector('[data-bs-tab="bills"] .bs-count'), n = late + soon;
    badge.hidden = n === 0;
    badge.textContent = n;
  }

  // Live preview under the bill form
  function updateBillPreview() {
    const box = $("bill-preview");
    if (!box) return;
    const amt = parseFloat($("bill-amount").value), day = parseInt($("bill-day").value, 10), method = getAccount($("bill-method").value);
    if (isNaN(day) || day < 1 || day > 31) { box.innerHTML = '<span class="hint">Pick the day of the month this bill is due.</span>'; return; }
    let when = dueDate({ day }, thisMonth());
    if (when < today()) when = dueDate({ day }, nextMonth(thisMonth()));
    const diff = daysBetween(today(), when);
    box.innerHTML = `Next due <strong>${prettyDate(when)}</strong> (${diff === 0 ? "today" : diff === 1 ? "tomorrow" : "in " + diff + " days"})${amt > 0 ? " · " + money(round2(amt * 12)) + " a year" : ""}${method ? " · from " + esc(method.name) : ""}`;
  }
  $("bill-form").addEventListener("input", updateBillPreview);
  $("bill-form").addEventListener("change", updateBillPreview);

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
          <label class="field wide">Name<input type="text" id="bd-name" maxlength="30" value="${esc(b.name)}"></label>
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

  function renderGoalSummary() {
    goalsSummary.style.display = goals.length ? "" : "none";
    if (!goals.length) return;
    const saved = round2(sum(goals.map((g) => g.saved))), target = round2(sum(goals.map((g) => g.target))), pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
    const done = goals.filter((g) => g.saved >= g.target - 0.004).length;
    goalsSummary.innerHTML = `<div class="tiles"><div class="tile good"><span class="label">Saved in goals</span><strong>${money(saved)}</strong><small>${plural(goals.length, "goal")}${done ? ", " + done + " reached" : ""}</small></div>
      <div class="tile"><span class="label">Total target</span><strong>${money(target)}</strong><small>${money(round2(Math.max(0, target - saved)))} to go</small></div></div>
      <div class="progress big" style="margin-top:12px"><div class="bar" style="width:${pct}%"></div></div><p class="hint plan-foot">${pct}% of all your goals.</p>`;
  }

  // Live preview under the goal form
  function updateGoalPreview() {
    const box = $("goal-preview");
    if (!box) return;
    const target = parseFloat($("goal-target").value), date = $("goal-date").value;
    if (!(target > 0)) { box.innerHTML = '<span class="hint">Enter a target to see how much to save each month.</span>'; return; }
    if (!date) { box.innerHTML = `Target <strong>${money(target)}</strong>. Add a finish date to see how much to save each month.`; return; }
    if (date < today()) { box.innerHTML = '<span class="warn-text">Pick a finish date in the future.</span>'; return; }
    const months = monthsUntil(date), perMonth = round2(target / months);
    box.innerHTML = `Save about <strong>${money(perMonth)} a month</strong> for ${plural(months, "month")} (roughly ${money(round2(perMonth / 4.35))} a week) to reach ${money(target)} by ${prettyDate(date)}.`;
  }
  $("goal-form").addEventListener("input", updateGoalPreview);
  $("goal-form").addEventListener("change", updateGoalPreview);

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
      <label class="field">Name<input type="text" id="ge-name" maxlength="30" value="${esc(g.name)}"></label>
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
    const b = e.target.closest("[data-bs-tab],[data-bs-go],[data-dash],[data-qa],[data-plan-last],[data-plan-sort],[data-bday],[data-bill-idea],[data-goal-idea],[data-gtarget],[data-gmonths],[data-bill-open],[data-plan-chip],[data-plan-copy],[data-plan-edit],[data-plan-add],[data-goal-add],[data-goal-take],[data-goal-edit]");
    if (!b) return;
    const d = b.dataset;
    if (d.bsTab) setTab(d.bsTab);
    else if (d.bsGo) { setTab(d.bsGo); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else if (d.dash) window.dashPopup(d.dash);
    else if (d.qa !== undefined) { const el = $("plan-amount"); el.value = d.qa === "clear" ? "" : round2((parseFloat(el.value) || 0) + Number(d.qa)); updatePlanPreview(); el.focus(); }
    else if (d.planLast) { $("plan-amount").value = d.planLast; updatePlanPreview(); $("plan-amount").focus(); }
    else if (d.planSort) { planSort = d.planSort; renderPlan(); }
    else if (d.bday) { $("bill-day").value = d.bday; updateBillPreview(); }
    else if (d.billIdea) { $("bill-name").value = d.billIdea; updateBillPreview(); $("bill-amount").focus(); }
    else if (d.goalIdea) { $("goal-name").value = d.goalIdea; $("goal-target").focus(); }
    else if (d.gtarget) { $("goal-target").value = d.gtarget; updateGoalPreview(); }
    else if (d.gmonths) { const dt = new Date(); dt.setMonth(dt.getMonth() + Number(d.gmonths)); $("goal-date").value = ymd(dt); updateGoalPreview(); }
    else if (d.billOpen) openBill(Number(d.billOpen));
    else if (d.planChip) { $("plan-name").value = d.planChip; updatePlanPreview(); $("plan-amount").focus(); }
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

  // ---------- Home: every dashboard card opens its own pop-up ----------
  const dash = newDialog("dash-dialog");
  dash.classList.add("dash");
  let dashKey = null;

  function shell(o) {
    return `<div class="dash-wrap">
      <div class="dash-head"><span class="dash-ico ${o.tone || ""}"><i data-lucide="${o.icon}"></i></span>
        <div class="dash-title"><h2>${o.title}</h2><p class="hint">${o.sub || ""}</p></div>
        <button type="button" class="dash-x" data-dx="close" aria-label="Close"><i data-lucide="x"></i></button></div>
      <div class="dash-hero ${o.tone || ""}"><span>${o.label}</span><strong>${o.value}</strong>${o.note ? `<small>${o.note}</small>` : ""}</div>
      ${o.body || ""}
      <div class="dash-foot">${(o.foot || []).map(([text, act, arg, cls]) => `<button type="button" class="${cls || "filter-btn"}" data-dx="${act}"${arg !== undefined ? ` data-arg="${esc(arg)}"` : ""}>${text}</button>`).join("")}</div>
    </div>`;
  }
  const tileHtml = (label, value, tone, note) => `<div class="tile ${tone || ""}"><span class="label">${label}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ""}</div>`;
  const bars = (entries, total, cls) => entries.map(([name, amt]) => { const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
    return `<div class="dash-bar"><div class="dash-bar-top"><span>${esc(name)}</span><span><strong>${money(amt)}</strong> <small>${pct}%</small></span></div><div class="progress thin"><div class="bar ${cls || ""}" style="width:${Math.max(pct, 2)}%"></div></div></div>`; }).join("");
  const txRow = (x) => `<div class="dash-row"><div><strong>${esc(x.description || x.category)}</strong><div class="hint">${prettyDate(x.date)} · ${esc(x.category)}${accountName(x.accountId) ? " · " + esc(accountName(x.accountId)) : ""}</div></div><strong class="${x.type === "income" ? "income" : "expense"}">${x.type === "income" ? "+" : "−"}${money(x.amount)}</strong></div>`;
  function versus(cur, prev, upIsGood) {
    if (!(prev > 0)) return "";
    const diff = round2(cur - prev), name = shortMonth(previousMonth(selectedMonth));
    if (Math.abs(diff) < 0.005) return "Same as " + name;
    const up = diff > 0;
    return `<span class="${up === upIsGood ? "income" : "expense"}">${up ? "▲" : "▼"} ${money(Math.abs(diff))}</span> vs ${name}`;
  }
  const latest = (type) => getMonthTransactions().filter((x) => x.type === type).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  function incomePopup() {
    const t = monthTotals(selectedMonth), prev = monthTotals(previousMonth(selectedMonth)), list = latest("income"), byCat = {};
    list.forEach((x) => { byCat[x.category] = round2((byCat[x.category] || 0) + x.amount); });
    const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    return shell({ icon: "trending-up", tone: "good", title: "Income", sub: monthName(selectedMonth), label: "Money in", value: money(t.income),
      note: versus(t.income, prev.income, true) || plural(list.length, "payment"),
      body: list.length ? (cats.length > 1 ? `<h3 class="sub-h">By category</h3>${bars(cats, t.income, "good")}` : "") + `<h3 class="sub-h">Latest income</h3>${list.slice(0, 6).map(txRow).join("")}${list.length > 6 ? `<p class="hint">and ${list.length - 6} more in History</p>` : ""}`
        : `<p class="empty">No income recorded in ${monthName(selectedMonth)} yet.</p>`,
      foot: [["See all income", "history", "income", "primary-btn"], ["Add income", "add-tx", "income"]] });
  }

  function expensePopup() {
    const t = monthTotals(selectedMonth), prev = monthTotals(previousMonth(selectedMonth)), list = latest("expense");
    const cats = Object.entries(t.byCategory).sort((a, b) => b[1] - a[1]), top = cats.slice(0, 6), rest = round2(sum(cats.slice(6).map((c) => c[1])));
    if (rest > 0) top.push(["Other categories", rest]);
    const big = list.slice().sort((a, b) => b.amount - a.amount)[0], ym = thisMonth();
    const days = selectedMonth === ym ? new Date().getDate() : selectedMonth < ym ? new Date(+selectedMonth.slice(0, 4), +selectedMonth.slice(5, 7), 0).getDate() : 0;
    return shell({ icon: "trending-down", tone: "bad", title: "Expenses", sub: monthName(selectedMonth), label: "Money spent", value: money(t.expenses),
      note: versus(t.expenses, prev.expenses, false) || plural(list.length, "payment"),
      body: list.length ? `<div class="tiles dash-tiles">${tileHtml("Per day", days ? money(round2(t.expenses / days)) : "—")}${tileHtml("Biggest", money(big.amount), "", esc(big.description || big.category))}${tileHtml("Payments", String(list.length))}</div>
        <h3 class="sub-h">Where the money went</h3>${bars(top, t.expenses, "over")}<h3 class="sub-h">Latest expenses</h3>${list.slice(0, 5).map(txRow).join("")}`
        : `<p class="empty">No expenses recorded in ${monthName(selectedMonth)} yet.</p>`,
      foot: [["See all expenses", "history", "expense", "primary-btn"], ["Add expense", "add-tx", "expense"]] });
  }

  function budgetPopup() {
    const plan = getPlan(), spent = getSpentByCategory(), planned = round2(sum(Object.values(plan))), used = monthTotals(selectedMonth).expenses;
    if (planned <= 0) return shell({ icon: "target", title: "Left budget", sub: monthName(selectedMonth), label: "No plan yet", value: "—",
      body: `<p class="empty">You have not planned any spending for ${monthName(selectedMonth)}. Add what you expect to pay (rent, groceries...) and FinTrack will show how much is left.</p>`,
      foot: [["Create your plan", "tab", "plan", "primary-btn"], ["Copy last month's plan", "copy"]] });
    const left = round2(planned - used), pct = Math.round((used / planned) * 100), p = paceInfo(planned, used);
    const names = Object.keys(plan).sort((a, b) => (spent[b] || 0) / plan[b] - (spent[a] || 0) / plan[a]);
    const unplanned = Object.keys(spent).filter((n) => !(n in plan)), extra = round2(sum(unplanned.map((n) => spent[n])));
    const overs = names.filter((n) => (spent[n] || 0) > plan[n]);
    const notes = [];
    if (left < 0) notes.push(["bad", `You are <strong>${money(Math.abs(left))}</strong> over your plan for ${monthName(selectedMonth)}.`]);
    if (p && left > 0) notes.push(["ok", `You can spend about <strong>${money(p.daily)}</strong> a day for the next ${plural(p.daysLeft, "day")}.`]);
    if (p && left === 0) notes.push(["warn", `Your plan is fully used and ${plural(p.daysLeft, "day")} of the month ${p.daysLeft === 1 ? "is" : "are"} left. Any new spending goes over the plan.`]);
    else if (p && left > 0) notes.push([pct > p.monthPct + 10 ? "warn" : "ok", pct > p.monthPct + 10 ? `Spending is running ahead: ${pct}% of the plan is used and ${p.monthPct}% of the month has passed.` : `On pace: ${pct}% of the plan is used and ${p.monthPct}% of the month has passed.`]);
    if (!p && selectedMonth < thisMonth()) notes.push([left >= 0 ? "ok" : "bad", left >= 0 ? "This month is over. You stayed within your plan." : "This month is over. You went over your plan."]);
    if (overs.length) notes.push(["bad", `${overs.length === 1 ? "1 item is" : overs.length + " items are"} over plan: ${overs.map(esc).join(", ")}.`]);
    if (extra > 0) notes.push(["warn", `${money(extra)} was spent on things that are not in your plan.`]);
    const rows = names.map((n) => { const pl = plan[n], u = spent[n] || 0, over = u > pl, ratio = u / pl, badge = over ? ["over", "Over"] : ratio >= 1 ? ["warn", "Fully used"] : ratio >= 0.8 ? ["warn", "Almost there"] : ["ok", "On track"];
      return `<div class="dash-plan"><div class="dash-bar-top"><span><strong>${esc(n)}</strong> <span class="badge ${badge[0]}">${badge[1]}</span></span><button type="button" class="mini-btn" data-dx="edit-plan" data-arg="${esc(n)}">Edit</button></div>
        <div class="progress thin"><div class="bar ${over ? "over" : ""}" style="width:${Math.min(100, Math.round(ratio * 100))}%"></div></div>
        <div class="plan-meta"><span>${money(u)} of ${money(pl)}</span><span class="${over ? "over" : ""}">${over ? "Over by " + money(round2(u - pl)) : money(round2(pl - u)) + " left"}</span></div></div>`; }).join("");
    return shell({ icon: "target", tone: left >= 0 ? "good" : "bad", title: "Left budget", sub: monthName(selectedMonth), label: left >= 0 ? "Left to spend" : "Over your plan by", value: money(Math.abs(left)),
      note: `${money(used)} spent of ${money(planned)} planned (${pct}%)`,
      body: `<div class="progress big"><div class="bar ${left < 0 ? "over" : ""}" style="width:${Math.min(100, pct)}%"></div></div>
        <ul class="dash-notes">${notes.map(([c, t]) => `<li class="${c}">${t}</li>`).join("")}</ul>
        <h3 class="sub-h">Your plan, item by item</h3>${rows}
        ${unplanned.length ? `<h3 class="sub-h">Not in your plan</h3>${unplanned.map((n) => `<div class="dash-row"><div><strong>${esc(n)}</strong></div><span><strong class="expense">${money(spent[n])}</strong> <button type="button" class="mini-btn" data-dx="add-plan" data-arg="${esc(n)}">＋ Plan</button></span></div>`).join("")}` : ""}`,
      foot: [["Edit plan", "tab", "plan", "primary-btn"], ["See expenses", "history", "expense"]] });
  }

  function savedPopup() {
    const t = monthTotals(selectedMonth), net = round2(t.income - t.expenses), rate = t.income > 0 ? Math.round((net / t.income) * 100) : null, inGoals = round2(sum(goals.map((g) => g.saved)));
    const goalRows = goals.slice(0, 4).map((g) => { const pc = Math.min(100, Math.round((g.saved / g.target) * 100));
      return `<div class="dash-bar"><div class="dash-bar-top"><span>${esc(g.name)}</span><span><strong>${money(g.saved)}</strong> <small>of ${money(g.target)}</small></span></div><div class="progress thin"><div class="bar good" style="width:${Math.max(pc, 2)}%"></div></div></div>`; }).join("");
    return shell({ icon: "piggy-bank", tone: net >= 0 ? "good" : "bad", title: "Saved this month", sub: monthName(selectedMonth), label: net >= 0 ? "You saved" : "You overspent by", value: money(Math.abs(net)),
      note: rate !== null ? `${rate}% of your income` : "Money in minus money spent",
      body: `<div class="tiles dash-tiles">${tileHtml("Money in", money(t.income), "good")}${tileHtml("Money spent", money(t.expenses), "bad")}</div>
        ${t.net !== 0 ? `<p class="hint plan-foot">${t.net > 0 ? "Moved into savings accounts" : "Taken out of savings accounts"} this month: <strong>${money(Math.abs(t.net))}</strong>.</p>` : ""}
        <h3 class="sub-h">Where your money is now</h3>
        <div class="tiles dash-tiles">${tileHtml("In bank", money(kindSum("checking")))}${tileHtml("In cash", money(kindSum("cash")))}${accounts.some((a) => a.kind === "savings") ? tileHtml("Savings accounts", money(kindSum("savings"))) : ""}${tileHtml("In goals", money(inGoals))}</div>
        ${goals.length ? `<h3 class="sub-h">Savings goals</h3>${goalRows}` : ""}`,
      foot: [["Open Budget & savings", "tab", "overview", "primary-btn"], [goals.length ? "Add to a goal" : "Create a goal", "tab", "goals"]] });
  }

  function peoplePopup(mode) {
    const owed = mode === "owed";
    const rows = contacts.map((c) => ({ c, amt: round2(owed ? owedBy(c.id) : iOweTo(c.id)) })).filter((r) => r.amt > 0.004).sort((a, b) => b.amt - a.amt);
    const total = round2(sum(rows.map((r) => r.amt)));
    return shell({ icon: owed ? "hand-coins" : "wallet", tone: owed ? "good" : "bad", title: owed ? "Friends owe me" : "I owe friends", sub: plural(rows.length, "person").replace("persons", "people"), label: owed ? "Total owed to you" : "Total you owe", value: money(total),
      body: rows.length ? `<h3 class="sub-h">Tap a name to see everything between you</h3>${rows.map((r) => `<button type="button" class="dash-person" data-dx="contact" data-arg="${esc(r.c.id)}"><span class="avatar">${esc(r.c.name.trim().charAt(0).toUpperCase())}</span><span class="dp-name">${esc(r.c.name)}</span><strong class="${owed ? "income" : "expense"}">${money(r.amt)}</strong><span class="chev" aria-hidden="true">›</span></button>`).join("")}`
        : `<p class="empty">${owed ? "Nobody owes you anything right now." : "You do not owe anyone right now."}</p>`,
      foot: [["Open Loans", "goto", "loans", "primary-btn"], [owed ? "Split a bill" : "A friend paid for me", "loan", owed ? "lent" : "paid-for-me"]] });
  }

  function networthPopup() {
    const n = getNetWorth();
    const lines = [["Cash", kindSum("cash"), 1], ["Bank accounts", kindSum("checking"), 1], ["Savings accounts", kindSum("savings"), 1], ["In savings goals", n.inGoals, 1], ["Friends owe you", n.owedToMe, 1], ["Credit card balances", n.debt, -1], ["You owe friends", n.iOwe, -1]].filter((l) => Math.abs(l[1]) > 0.004);
    return shell({ icon: "landmark", tone: n.total >= 0 ? "good" : "bad", title: "Net worth", sub: "Everything you own minus everything you owe", label: "Net worth", value: money(round2(n.total)),
      body: `<h3 class="sub-h">What it is made of</h3>${lines.map(([name, amt, sign]) => `<div class="dash-row"><span>${name}</span><strong class="${sign > 0 ? "income" : "expense"}">${sign > 0 ? "" : "−"}${money(round2(amt))}</strong></div>`).join("") || '<p class="empty">Add your cash and bank accounts on the Money page.</p>'}`,
      foot: [["Open Money page", "goto", "networth", "primary-btn"]] });
  }

  function availablePopup() {
    const list = accounts.filter((a) => a.kind === "cash" || a.kind === "checking"), total = round2(sum(list.map((a) => a.balance))), inGoals = round2(sum(goals.map((g) => g.saved)));
    return shell({ icon: "wallet", tone: "good", title: "Available money", sub: "Cash plus bank accounts", label: "You can spend", value: money(total),
      note: inGoals > 0 ? `${money(inGoals)} is set aside in savings goals and not counted.` : "Money friends owe you is not included.",
      body: `<h3 class="sub-h">Tap an account to see its statement</h3>${list.map((a) => `<button type="button" class="dash-person" data-dx="account" data-arg="${esc(a.id)}"><span class="avatar">${a.kind === "cash" ? "💵" : "🏦"}</span><span class="dp-name">${esc(a.name)}</span><strong>${money(a.balance)}</strong><span class="chev" aria-hidden="true">›</span></button>`).join("") || '<p class="empty">No cash or bank accounts yet.</p>'}`,
      foot: [["Open Money page", "goto", "networth", "primary-btn"], ["Add income", "add-tx", "income"]] });
  }

  const POPUPS = { income: incomePopup, expense: expensePopup, budget: budgetPopup, saved: savedPopup, owed: () => peoplePopup("owed"), owe: () => peoplePopup("owe"), networth: networthPopup, available: availablePopup };
  window.dashPopup = (key) => {
    if (!POPUPS[key]) return;
    dashKey = key;
    dash.innerHTML = POPUPS[key]();
    if (window.lucide) lucide.createIcons();
    if (!dash.open) dash.showModal();
    dash.scrollTop = 0;
  };
  dash.addEventListener("click", (e) => {
    if (e.target === dash) { dash.close(); return; } // tap outside the card
    const a = e.target.closest("[data-dx]");
    if (!a) return;
    const act = a.dataset.dx, arg = a.dataset.arg;
    if (act === "close") { dash.close(); return; }
    if (act === "edit-plan") { dash.close(); openPlanEdit(arg); return; }
    if (act === "add-plan") {
      if (!budgets[selectedMonth]) budgets[selectedMonth] = {};
      budgets[selectedMonth][arg] = round2(getSpentByCategory()[arg] || 0) || 1;
      saveData(); render(); window.dashPopup(dashKey); showToast(arg + " added to the plan"); return;
    }
    dash.close();
    if (act === "tab") { showView("budget"); setTab(arg); }
    else if (act === "history") goToHistory(arg);
    else if (act === "goto") showView(arg);
    else if (act === "add-tx") { showView("add"); const r = document.querySelector(`input[name="type"][value="${arg}"]`); if (r) r.click(); }
    else if (act === "copy") { showView("budget"); setTab("plan"); copyLastMonth(); }
    else if (act === "contact") { detailContact = arg; render(); showView("contact-detail"); }
    else if (act === "account") { detailTarget = { id: arg }; render(); showView("account-detail"); }
    else if (act === "loan") openLoanDialog("", arg);
  });

  // script.js calls this at the end of every render()
  window.renderExtras = function () {
    document.querySelectorAll(".amt .cur").forEach((s) => { s.textContent = curSym(); });
    renderSnapshot();
    renderSavings();
    renderMiniBills();
    renderMiniGoals();
    renderPlan();
    renderBills();
    renderGoalSummary();
    renderGoals();
    updatePlanPreview();
    updateBillPreview();
    updateGoalPreview();
    // Home: tell the user how much is set aside, so Available money makes sense
    const note = document.querySelector(".money-hero .hero-main small"), inGoals = sum(goals.map((g) => g.saved));
    if (note) {
      if (!note.dataset.base) note.dataset.base = note.textContent;
      note.textContent = note.dataset.base + (inGoals > 0 ? " " + money(inGoals) + " is set aside in savings goals." : "");
    }
  };
  window.renderExtras();
})();
