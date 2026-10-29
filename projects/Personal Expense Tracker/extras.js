// ============================================================
// FinTrack extras: upcoming bills, savings goals that really move money,
// simple Budget tabs, and backup / restore.
// Loaded after script.js, so it can use the same variables and helpers.
// Everything is wrapped in a function so no names clash with script.js.
// ============================================================
(function () {
  const thisMonth = () => today().slice(0, 7); // the real current month, e.g. "2026-10"

  function newCard(id, html) {
    const card = document.createElement("div");
    card.className = "card";
    card.id = id;
    card.innerHTML = html;
    return card;
  }

  // ---------- Build the new cards once ----------
  const billsCard = newCard("bills-card", '<h2>Upcoming bills</h2><div id="bills-list"></div>');
  $("alerts").after(billsCard); // on Home, under the alerts

  const billsManage = newCard("bills-manage", `<h2>Bills &amp; subscriptions</h2>
    <p class="hint">Add bills that repeat every month. They show on Home with a one-tap Pay button, which adds the expense for you.</p>
    <form id="bill-form" class="x-form" novalidate>
      <label>Bill name<input id="bill-name" maxlength="30" placeholder="e.g. Rent, Netflix"></label>
      <label>Amount<input id="bill-amount" type="number" step="0.01" min="0" inputmode="decimal" placeholder="0.00"></label>
      <label>Due day<input id="bill-day" type="number" min="1" max="31" inputmode="numeric" placeholder="1-31"></label>
      <button type="submit" class="primary-btn">Add bill</button>
    </form>
    <p id="bill-error" class="error" role="alert"></p><div id="bill-manage-list"></div>`);
  const goalsCard = newCard("goals-card", `<h2>Savings goals</h2>
    <p class="hint">Pick something to save for. When you add money, it moves out of your cash or bank account into the goal, so all your balances stay correct.</p>
    <form id="goal-form" class="x-form x-form-3" novalidate>
      <label>What are you saving for?<input id="goal-name" maxlength="30" placeholder="e.g. Emergency fund, Laptop"></label>
      <label>Target amount<input id="goal-target" type="number" step="0.01" min="0" inputmode="decimal" placeholder="0.00"></label>
      <label>Finish by (optional)<input id="goal-date" type="date"></label>
      <button type="submit" class="primary-btn">Add goal</button>
    </form>
    <p id="goal-error" class="error" role="alert"></p><div id="goal-list"></div>`);
  $("budget").append(billsManage, goalsCard);

  const backupCard = newCard("backup-card", `<h2>Backup &amp; restore</h2>
    <p class="hint">Save a copy of all your data as a file, or load a copy you saved earlier. Restoring replaces the data in your account.</p>
    <div class="backup-actions"><button type="button" class="primary-btn" id="backup-export">Download backup</button>
    <label class="mini-btn file-btn">Restore from file<input type="file" id="backup-file" accept="application/json,.json" hidden></label></div>`);
  $("reports").append(backupCard);

  // ---------- 3. Upcoming bills ----------
  // A bill due on day 31 falls on the last day of shorter months
  function dueDate(bill, ym) {
    const [y, m] = ym.split("-").map(Number);
    return ym + "-" + String(Math.min(bill.day, new Date(y, m, 0).getDate())).padStart(2, "0");
  }
  const daysBetween = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 864e5);
  // Paid only while the expense it created still exists (deleting it makes the bill unpaid again)
  const isPaid = (bill, ym) => !!bill.paid && transactions.some((t) => t.id === bill.paid[ym]);

  function renderBills() {
    billsCard.style.display = bills.length ? "" : "none";
    const ym = thisMonth();
    const list = bills.map((b) => ({ b, due: dueDate(b, ym) })).sort((x, y) => x.due.localeCompare(y.due));
    $("bills-list").innerHTML = list.map(({ b, due }) => {
      const paid = isPaid(b, ym), diff = daysBetween(today(), due);
      const status = paid ? "Paid this month" : diff < 0 ? "Overdue by " + -diff + (diff === -1 ? " day" : " days") : diff === 0 ? "Due today" : diff === 1 ? "Due tomorrow" : "Due in " + diff + " days";
      const cls = paid ? "ok" : diff < 0 ? "late" : diff <= 3 ? "soon" : "";
      return `<div class="bill-row"><div><strong>${escapeHtml(b.name)}</strong><div class="hint bill-${cls}">${status}</div></div>
        <div class="bill-right"><strong>${formatMoney(b.amount)}</strong>${paid ? "" : `<button type="button" class="mini-btn" data-bill-pay="${b.id}">Pay</button>`}</div></div>`;
    }).join("");

    $("bill-manage-list").innerHTML = bills.length ? bills.map((b) => `<div class="bill-row"><div><strong>${escapeHtml(b.name)}</strong><div class="hint">${formatMoney(b.amount)} · every month on day ${b.day}</div></div>
      <button type="button" class="mini-btn danger-text" data-bill-del="${b.id}">Delete</button></div>`).join("") : '<p class="empty">No bills yet.</p>';
  }

  // Pay = add a real expense today (from your bank account, or cash if you have none)
  function payBill(id) {
    const bill = bills.find((b) => b.id === id);
    if (!bill || isPaid(bill, thisMonth())) return;
    const account = accounts.find((a) => a.kind === "checking") || accounts[0];
    const t = { id: Date.now(), type: "expense", amount: bill.amount, category: "Other", description: bill.name, date: today(), accountId: account.id };
    transactions.push(t);
    applyEffect(t, 1);
    bill.paid = bill.paid || {};
    bill.paid[thisMonth()] = t.id;
    saveData();
    render();
    showToast(bill.name + " paid from " + account.name);
  }

  $("bill-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("bill-name").value.trim(), amount = parseFloat($("bill-amount").value), day = parseInt($("bill-day").value, 10);
    const err = $("bill-error");
    if (!name) { err.textContent = "Enter the bill name."; return; }
    if (isNaN(amount) || amount <= 0) { err.textContent = "Enter an amount greater than 0."; return; }
    if (isNaN(day) || day < 1 || day > 31) { err.textContent = "Due day must be from 1 to 31."; return; }
    err.textContent = "";
    bills.push({ id: Date.now(), name, amount: round2(amount), day, paid: {} });
    e.target.reset();
    saveData();
    render();
    showToast("Bill added");
  });

  // ---------- 4. Savings goals (money really moves) ----------
  // Adding to a goal takes the money out of an account; taking out puts it back.
  // So Available money, account statements and Net worth always add up.
  const monthsUntil = (date) => Math.max(1, Math.ceil(daysBetween(today(), date) / 30.44));

  function renderGoals() {
    $("goal-list").innerHTML = goals.length ? goals.map((g) => {
      const left = round2(Math.max(0, g.target - g.saved)), done = left <= 0.004;
      const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
      let plan = "";
      if (done) plan = "Goal reached 🎉";
      else if (g.date) plan = daysBetween(today(), g.date) < 0 ? "The finish date has passed." : "Save about " + formatMoney(round2(left / monthsUntil(g.date))) + " a month to finish by " + monthName(g.date.slice(0, 7)) + ".";
      return `<div class="goal-row">
        <div class="goal-top"><strong>${escapeHtml(g.name)}</strong><span>${pct}%</span></div>
        <div class="progress"><div class="bar" style="width:${pct}%"></div></div>
        <p class="hint" style="margin:8px 0 0">${formatMoney(g.saved)} saved of ${formatMoney(g.target)}${done ? "" : " · " + formatMoney(left) + " to go"}</p>
        ${plan ? `<p class="hint goal-plan">${plan}</p>` : ""}
        <div class="goal-actions">${done ? "" : `<button type="button" class="primary-btn" data-goal-add="${g.id}">＋ Add money</button>`}${g.saved > 0 ? `<button type="button" class="filter-btn" data-goal-take="${g.id}">Take out</button>` : ""}<button type="button" class="mini-btn danger-text" data-goal-del="${g.id}">Delete</button></div></div>`;
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

  // Small pop-up for "Add money" / "Take out": pick the account and the amount
  const goalDialog = document.createElement("dialog");
  goalDialog.innerHTML = `<form id="gm-form" novalidate><h2 id="gm-title"></h2><p id="gm-sub" class="hint"></p>
    <label class="field"><span id="gm-account-label"></span><select id="gm-account"></select></label>
    <label class="field">Amount<input type="number" id="gm-amount" step="0.01" min="0" inputmode="decimal" placeholder="0.00"></label>
    <p id="gm-error" class="error" role="alert"></p>
    <div class="dialog-actions"><button type="button" id="gm-cancel" class="filter-btn">Cancel</button><button type="submit" class="primary-btn">Confirm</button></div></form>`;
  document.body.append(goalDialog);
  let moving = null; // { goalId, direction }  direction: 1 = add, -1 = take out

  function openMove(goalId, direction) {
    const g = goals.find((x) => x.id === goalId);
    if (!g) return;
    moving = { goalId, direction };
    $("gm-title").textContent = (direction > 0 ? "Add money to " : "Take money out of ") + g.name;
    $("gm-sub").textContent = direction > 0 ? formatMoney(round2(g.target - g.saved)) + " to go." : formatMoney(g.saved) + " is saved in this goal.";
    $("gm-account-label").textContent = direction > 0 ? "Take it from" : "Put it back in";
    $("gm-account").innerHTML = accounts.filter((a) => a.kind !== "credit").map((a) => `<option value="${a.id}">${escapeHtml(a.name)} (${formatMoney(a.balance)})</option>`).join("");
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
      if (amount > account.balance + 0.004) { err.textContent = account.name + " only has " + formatMoney(account.balance) + "."; return; }
      if (amount > round2(g.target - g.saved) + 0.004) { err.textContent = "You only need " + formatMoney(round2(g.target - g.saved)) + " more."; return; }
    } else if (amount > g.saved + 0.004) { err.textContent = "Only " + formatMoney(g.saved) + " is saved in this goal."; return; }
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

  // One click listener for all the buttons in the new cards
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-bill-pay],[data-bill-del],[data-goal-add],[data-goal-take],[data-goal-del]");
    if (!b) return;
    const d = b.dataset;
    if (d.billPay) payBill(Number(d.billPay));
    else if (d.billDel) {
      if (!confirm("Delete this bill?")) return;
      bills = bills.filter((x) => x.id !== Number(d.billDel));
      saveData(); render();
    } else if (d.goalAdd) openMove(Number(d.goalAdd), 1);
    else if (d.goalTake) openMove(Number(d.goalTake), -1);
    else if (d.goalDel) {
      const g = goals.find((x) => x.id === Number(d.goalDel));
      if (!g) return;
      if (g.saved > 0) { showToast("Take the money out first, then delete the goal."); return; }
      if (!confirm("Delete this goal?")) return;
      goals = goals.filter((x) => x !== g);
      saveData(); render();
    }
  });

  // ---------- 5. Backup and restore ----------
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

  // ---------- Budget page tabs: one thing at a time ----------
  const tabBar = document.createElement("div");
  tabBar.className = "seg-tabs";
  tabBar.innerHTML = '<button type="button" class="filter-btn active" data-tab="plan">Monthly plan</button><button type="button" class="filter-btn" data-tab="bills">Bills</button><button type="button" class="filter-btn" data-tab="goals">Savings goals</button>';
  const budgetTitle = document.querySelector("#budget h1");
  budgetTitle.textContent = "Budget & savings";
  budgetTitle.after(tabBar);
  function showBudgetTab(tab) {
    tabBar.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    [...$("budget").children].forEach((el) => {
      if (el === tabBar || el === budgetTitle) return;
      const belongsTo = el === billsManage ? "bills" : el === goalsCard ? "goals" : "plan";
      el.classList.toggle("tab-off", belongsTo !== tab);
    });
  }
  tabBar.addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) showBudgetTab(b.dataset.tab); });
  showBudgetTab("plan");

  // script.js calls this at the end of every render()
  window.renderExtras = function () {
    renderBills();
    renderGoals();
    // Home: tell the user how much is set aside, so Available money makes sense
    const note = document.querySelector(".money-hero .hero-main small"), inGoals = sum(goals.map((g) => g.saved));
    if (note) {
      if (!note.dataset.base) note.dataset.base = note.textContent;
      note.textContent = note.dataset.base + (inGoals > 0 ? " " + formatMoney(inGoals) + " is set aside in savings goals." : "");
    }
  };
  window.renderExtras();
})();
