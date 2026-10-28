// ============================================================
// FinTrack extras: spending insights, weekday bars, upcoming bills,
// savings goals, and backup / restore.
// Loaded after script.js, so it can use the same variables and helpers.
// Everything is wrapped in a function so no names clash with script.js.
// ============================================================
(function () {
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
  const insightCard = newCard("insight-card", '<h2>Spending insights</h2><div id="insight-body"></div>');
  $("alerts").after(billsCard, insightCard); // on Home, under the alerts

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
    <p class="hint">Track what you are saving for. Goals are a tracker only: they do not move money between your accounts.</p>
    <form id="goal-form" class="x-form x-form-2" novalidate>
      <label>Goal<input id="goal-name" maxlength="30" placeholder="e.g. New laptop, Trip"></label>
      <label>Target amount<input id="goal-target" type="number" step="0.01" min="0" inputmode="decimal" placeholder="0.00"></label>
      <button type="submit" class="primary-btn">Add goal</button>
    </form>
    <p id="goal-error" class="error" role="alert"></p><div id="goal-list"></div>`);
  $("budget").append(billsManage, goalsCard);

  const backupCard = newCard("backup-card", `<h2>Backup &amp; restore</h2>
    <p class="hint">Save a copy of all your data as a file, or load a copy you saved earlier. Restoring replaces the data in your account.</p>
    <div class="backup-actions"><button type="button" class="primary-btn" id="backup-export">Download backup</button>
    <label class="mini-btn file-btn">Restore from file<input type="file" id="backup-file" accept="application/json,.json" hidden></label></div>`);
  $("reports").append(backupCard);

  // ---------- 1 + 2. Spending insights and weekday bars ----------
  function renderInsights() {
    const body = $("insight-body");
    const expenses = getMonthTransactions().filter((t) => t.type === "expense");
    if (!expenses.length) { body.innerHTML = '<p class="empty">No expenses in ' + monthName(selectedMonth) + " yet.</p>"; return; }

    const total = sum(expenses.map((t) => t.amount));
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const isNow = selectedMonth === thisMonth();
    const daysPassed = isNow ? Number(today().slice(8, 10)) : daysInMonth;

    // Top category and biggest single expense
    const byCat = getSpentByCategory();
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    const big = expenses.reduce((a, b) => (b.amount > a.amount ? b : a));
    const spendDays = new Set(expenses.map((t) => t.date)).size;
    const noSpend = Math.max(0, daysPassed - spendDays);

    // Spending per weekday (0 = Sunday)
    const byDay = [0, 0, 0, 0, 0, 0, 0];
    expenses.forEach((t) => { byDay[new Date(t.date + "T00:00:00").getDay()] += t.amount; });
    const maxDay = Math.max(...byDay);
    const bars = byDay.map((v, i) => `<div class="wd"><i class="${v === maxDay ? "top" : ""}" style="height:${v > 0 ? Math.max(4, Math.round((v / maxDay) * 70)) : 2}px" title="${DAY_NAMES[i]}: ${formatMoney(round2(v))}"></i><span>${DAY_NAMES[i]}</span></div>`).join("");

    body.innerHTML = `<div class="ins-grid">
      <div class="ins"><span class="label">Daily average</span><strong>${formatMoney(round2(total / daysPassed))}</strong></div>
      <div class="ins"><span class="label">${isNow ? "On track to spend" : "Total spent"}</span><strong>${formatMoney(round2(isNow ? (total / daysPassed) * daysInMonth : total))}</strong><small>${isNow ? "by the end of the month" : monthName(selectedMonth)}</small></div>
      <div class="ins"><span class="label">Top category</span><strong>${escapeHtml(top[0])}</strong><small>${formatMoney(round2(top[1]))} (${Math.round((top[1] / total) * 100)}%)</small></div>
      <div class="ins"><span class="label">Biggest expense</span><strong>${formatMoney(big.amount)}</strong><small>${escapeHtml(big.description)}</small></div>
    </div>
    <p class="hint" style="margin:0 0 8px">${noSpend} no-spend ${noSpend === 1 ? "day" : "days"} so far. You spend the most on <strong>${DAY_NAMES[byDay.indexOf(maxDay)]}s</strong>.</p>
    <div class="wd-bars">${bars}</div>`;
  }

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

  // ---------- 4. Savings goals ----------
  function renderGoals() {
    $("goal-list").innerHTML = goals.length ? goals.map((g) => {
      const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
      return `<div class="goal-row">
        <div class="goal-top"><strong>${escapeHtml(g.name)}</strong><span>${formatMoney(g.saved)} of ${formatMoney(g.target)}${g.saved >= g.target ? " 🎉" : ""}</span></div>
        <div class="progress"><div class="bar" style="width:${pct}%"></div></div>
        <div class="goal-actions"><input type="number" step="0.01" min="0" inputmode="decimal" placeholder="Amount" aria-label="Amount for ${escapeHtml(g.name)}" data-goal-amt="${g.id}">
        <button type="button" class="mini-btn" data-goal-add="${g.id}">Add</button><button type="button" class="mini-btn" data-goal-take="${g.id}">Take out</button>
        <button type="button" class="mini-btn danger-text" data-goal-del="${g.id}">Delete</button></div></div>`;
    }).join("") : '<p class="empty">No goals yet. Add one above.</p>';
  }

  $("goal-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("goal-name").value.trim(), target = parseFloat($("goal-target").value), err = $("goal-error");
    if (!name) { err.textContent = "Enter a name for the goal."; return; }
    if (isNaN(target) || target <= 0) { err.textContent = "Enter a target amount greater than 0."; return; }
    err.textContent = "";
    goals.push({ id: Date.now(), name, target: round2(target), saved: 0 });
    e.target.reset();
    saveData();
    render();
    showToast("Goal added");
  });

  function changeGoal(id, direction) {
    const goal = goals.find((g) => g.id === id), input = document.querySelector('[data-goal-amt="' + id + '"]');
    const amount = parseFloat(input && input.value);
    if (!goal) return;
    if (isNaN(amount) || amount <= 0) { showToast("Enter an amount greater than 0."); return; }
    if (direction < 0 && amount > goal.saved + 0.004) { showToast("You only have " + formatMoney(goal.saved) + " in this goal."); return; }
    goal.saved = Math.max(0, round2(goal.saved + direction * amount));
    saveData();
    render();
    showToast(goal.saved >= goal.target ? "Goal reached! 🎉" : "Goal updated");
  }

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
    } else if (d.goalAdd) changeGoal(Number(d.goalAdd), 1);
    else if (d.goalTake) changeGoal(Number(d.goalTake), -1);
    else if (d.goalDel) {
      if (!confirm("Delete this goal?")) return;
      goals = goals.filter((x) => x.id !== Number(d.goalDel));
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

  // script.js calls this at the end of every render()
  window.renderExtras = function () { renderInsights(); renderBills(); renderGoals(); };
  window.renderExtras();
})();
