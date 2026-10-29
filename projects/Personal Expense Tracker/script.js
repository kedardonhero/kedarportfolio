// ============================================================
// FinTrack — Personal Expense Tracker (vanilla JavaScript)
// ============================================================

// ---------- 1. Data ----------
const INCOME_CATEGORIES = ["Salary", "Allowance", "Freelance", "Other"];

let transactions = [];
let budgets = {};       // one spending plan per month, e.g. { "2026-10": { Rent: 800 } }
let expenseNames = [];  // expense names you created (shown in the Add transaction list)
const newCash = () => ({ id: "cash", kind: "cash", name: "Cash", balance: 0 });
let accounts = [newCash()]; // for credit cards "balance" is the money you OWE
let contacts = [];
let loans = [];
let transfers = [];
let goals = [];  // savings goals: { id, name, target, saved }
let bills = [];  // monthly bills: { id, name, amount, day, paid: { "2026-10": transactionId } }
let savingsPlan = {};  // where each month's leftover is kept, e.g. { "2026-10": { cash: 300, bank: 750 } }
let storeKey = "fintrack-state-guest"; // where this profile is saved in the browser
let currentCurrency = "USD";
let localUser = null;   // username of the account saved on this device (null otherwise)
let cloudUser = null;   // signed-in Firebase user (null in guest mode)
let profile = null;     // { username, country, currency }
let currentFilter = "all";
let editingId = null;    // id of the transaction being edited (null when adding a new one)
let detailTarget = null; // which account (or group) the detail page shows
let detailContact = null; // which contact the contact page shows
let categoryChart = null;
let monthlyChart = null;

const $ = (id) => document.getElementById(id);
const form = $("transaction-form");

// ---------- 2. Helper functions ----------
function formatMoney(amount) {
  return amount.toLocaleString(undefined, { style: "currency", currency: currentCurrency });
}

// All app data in one object, so it can be saved locally and in the cloud
function getState() {
  return { transactions, budgets, expenseNames, accounts, contacts, loans, transfers, savingsPlan, goals, bills };
}
function loadState(state) {
  transactions = state.transactions || [];
  budgets = state.budgets || {};
  expenseNames = state.expenseNames || [];
  accounts = state.accounts && state.accounts.length ? state.accounts : [newCash()];
  contacts = state.contacts || [];
  loans = state.loans || [];
  transfers = state.transfers || [];
  savingsPlan = state.savingsPlan || {};
  goals = state.goals || [];
  bills = state.bills || [];
  // keep names from older plans too
  Object.values(budgets).forEach((plan) => Object.keys(plan).forEach((n) => { if (!expenseNames.includes(n)) expenseNames.push(n); }));
}
// Save in this browser, and also in the cloud when logged in
function saveData() {
  localStorage.setItem(storeKey, JSON.stringify(getState()));
  if (cloudUser) scheduleCloudSave();
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// Today's date as YYYY-MM-DD using the computer's local time
function today() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// The month being viewed ("YYYY-MM"). It starts as the current month automatically.
let selectedMonth = today().slice(0, 7);

function monthName(month) {
  const [year, number] = month.split("-");
  return new Date(year, number - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
}

// Only the transactions that belong to the month being viewed
function getMonthTransactions() {
  return transactions.filter((t) => t.date.startsWith(selectedMonth));
}

// Add up the expenses of the viewed month for each category
function getSpentByCategory() {
  const totals = {};
  getMonthTransactions()
    .filter((t) => t.type === "expense")
    .forEach((t) => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
  return totals;
}

function getPlan() {
  return budgets[selectedMonth] || {};
}

function sum(numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}

// Stops typed text from being treated as HTML
function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---------- 3. Navigation ----------
const MONTH_VIEWS = ["dashboard", "history", "budget", "reports"]; // pages that depend on the selected month
function showView(name) {
  const parent = { "account-detail": "networth", "contact-detail": "contacts" }[name] || name;
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === name));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === parent));
  const bar = $("month-bar");
  bar.hidden = !MONTH_VIEWS.includes(name);
  if (name === "dashboard") document.querySelector("#dashboard .money-hero").after(bar); // Home: under the money card
  else if (bar.parentElement !== document.querySelector("main")) document.querySelector("main").prepend(bar);
  closeMonthPop();
  if (name !== "add") stopEditing();
  if (name === "reports") renderReport();
  if (name === "account-page") renderAccount();
  window.scrollTo(0, 0);
}
document.querySelectorAll(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});
document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.go));
});

// ---------- 4. Month selector ----------
function changeMonth(step) {
  const [year, number] = selectedMonth.split("-").map(Number);
  const d = new Date(year, number - 1 + step, 1);
  selectedMonth = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  render();
}
$("month-pick").addEventListener("change", (e) => { if (e.target.value) { selectedMonth = e.target.value; render(); } }); // phones: native picker
$("this-month").addEventListener("click", () => { selectedMonth = today().slice(0, 7); closeMonthPop(); render(); });

// Computer: the button opens a small month + year chooser (phones use the native picker laid over the button)
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let popYear = new Date().getFullYear();
function drawMonthPop() {
  const [selYear, selNum] = selectedMonth.split("-").map(Number);
  const [nowYear, nowNum] = today().slice(0, 7).split("-").map(Number);
  $("month-pop").innerHTML =
    '<div class="mp-year"><button type="button" data-year="-1" aria-label="Previous year">&#8249;</button><strong>' + popYear +
    '</strong><button type="button" data-year="1" aria-label="Next year">&#8250;</button></div><div class="mp-grid">' +
    MONTH_SHORT.map((m, i) => '<button type="button" data-month="' + (i + 1) + '" class="' +
      (popYear === selYear && i + 1 === selNum ? "sel " : "") + (popYear === nowYear && i + 1 === nowNum ? "now" : "") + '">' + m + "</button>").join("") + "</div>";
}
function closeMonthPop() {
  $("month-pop").hidden = true;
  $("month-btn").setAttribute("aria-expanded", "false");
}
$("month-btn").addEventListener("click", () => {
  if ($("month-pick").offsetParent !== null && getComputedStyle($("month-pick")).position === "absolute") return; // touch screen: native picker handles it
  if (!$("month-pop").hidden) { closeMonthPop(); return; }
  popYear = Number(selectedMonth.slice(0, 4));
  drawMonthPop();
  $("month-pop").hidden = false;
  $("month-btn").setAttribute("aria-expanded", "true");
});
$("month-pop").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.year) { popYear += Number(b.dataset.year); drawMonthPop(); return; }
  if (b.dataset.month) { selectedMonth = popYear + "-" + String(b.dataset.month).padStart(2, "0"); closeMonthPop(); render(); }
});
document.addEventListener("click", (e) => { if (!e.target.closest(".month-chip")) closeMonthPop(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMonthPop(); });

// ---------- 5. Adding a transaction ----------
// The category list changes depending on Income / Expense
function fillCategories() {
  const type = form.elements["type"].value;
  const list = type === "income" ? INCOME_CATEGORIES : getExpenseCategories();
  $("category").innerHTML = list.map((c) => `<option>${escapeHtml(c)}</option>`).join("");
}
form.querySelectorAll('input[name="type"]').forEach((r) => r.addEventListener("change", fillCategories));

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = parseFloat($("amount").value);
  const description = $("description").value.trim();
  const date = $("date").value;
  const errorBox = $("form-error");

  // Validation
  if (isNaN(amount) || amount <= 0) { errorBox.textContent = "Enter an amount greater than 0."; return; }
  if (description === "") { errorBox.textContent = "Enter a short description."; return; }
  if (date === "") { errorBox.textContent = "Choose a date."; return; }
  errorBox.textContent = "";

  const data = { type: form.elements["type"].value, amount: Math.round(amount * 100) / 100, category: $("category").value,
    description: description, date: date, accountId: $("account").value };
  const wasEditing = editingId !== null;
  if (wasEditing) {   // undo the old version on its account, then apply the new version
    const old = transactions.find((t) => t.id === editingId);
    if (old) { applyEffect(old, -1); Object.assign(old, data); applyEffect(old, 1); }
  } else {
    transactions.push(Object.assign({ id: Date.now() }, data));
    applyEffect(transactions[transactions.length - 1], 1); // update the account balance
  }
  saveData();

  selectedMonth = date.slice(0, 7); // show the month this transaction belongs to
  form.reset();
  fillCategories();
  $("date").value = today();
  render();
  showView("dashboard");            // go back to the home page automatically
  showToast(wasEditing ? "Changes saved" : "Transaction saved");
});

// Edit: put an existing transaction back into the form
function startEdit(t) {
  showView("add");
  editingId = t.id;
  form.elements["type"].value = t.type;
  fillCategories();
  if (![...$("category").options].some((o) => o.value === t.category)) $("category").add(new Option(t.category));
  $("category").value = t.category;
  $("amount").value = t.amount;
  $("description").value = t.description;
  $("date").value = t.date;
  $("account").value = t.accountId;
  form.querySelector('button[type="submit"]').textContent = "Save changes";
}
function stopEditing() {
  if (editingId === null) return;
  editingId = null;
  form.reset();
  fillCategories();
  $("date").value = today();
  form.querySelector('button[type="submit"]').textContent = "Save transaction";
}

// ---------- 6. Deleting ----------
function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;
  const removed = transactions.find((t) => t.id === id);
  if (removed) applyEffect(removed, -1); // undo its effect on the account
  transactions = transactions.filter((t) => t.id !== id);
  saveData();
  render();
  showToast("Transaction deleted");
}

document.querySelectorAll(".filter-btn[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn[data-filter]").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderTable();
  });
});

// ---------- 7. Monthly budget plan ----------
// Every expense name you created, plus "Other"
function getExpenseCategories() {
  return expenseNames.includes("Other") ? expenseNames : [...expenseNames, "Other"];
}

// Add an expense (or change its amount) in the plan of the viewed month
$("plan-form").addEventListener("submit", (event) => {
  event.preventDefault();
  let name = $("plan-name").value.trim();
  const amount = parseFloat($("plan-amount").value);

  if (name === "") { $("budget-error").textContent = "Type what the expense is, for example Rent."; return; }
  if (isNaN(amount) || amount <= 0) { $("budget-error").textContent = "Enter an amount greater than 0."; return; }
  $("budget-error").textContent = "";

  // "rent" and "Rent" count as the same expense
  const existing = getExpenseCategories().find((c) => c.toLowerCase() === name.toLowerCase());
  if (existing) name = existing;
  else expenseNames.push(name);

  if (!budgets[selectedMonth]) budgets[selectedMonth] = {};
  budgets[selectedMonth][name] = Math.round(amount * 100) / 100;
  saveData();

  $("plan-form").reset();
  $("plan-name").focus();   // ready to type the next expense
  fillCategories();
  render();
  showToast(name + " added to the plan");
});

// Remove one expense from the viewed month's plan
function removeFromPlan(name) {
  if (!confirm(`Remove ${name} from this month's plan?`)) return;
  delete budgets[selectedMonth][name];
  if (Object.keys(budgets[selectedMonth]).length === 0) delete budgets[selectedMonth];
  saveData();
  render();
}

// "Done" goes back to the dashboard
$("plan-done").addEventListener("click", () => {
  showView("dashboard");
  showToast("Plan saved for " + monthName(selectedMonth));
});

// Copy the most recent earlier plan into this month (keeps amounts already set here)
$("copy-plan").addEventListener("click", () => {
  const earlier = Object.keys(budgets).filter((m) => m < selectedMonth).sort();
  if (earlier.length === 0) { showToast("No earlier plan to copy"); return; }
  const from = earlier[earlier.length - 1];
  budgets[selectedMonth] = { ...budgets[from], ...(budgets[selectedMonth] || {}) };
  saveData();
  render();
  showToast("Copied from " + monthName(from));
});

// ---------- 8. Clear all data ----------
$("clear-all").addEventListener("click", () => {
  if (!confirm("This will delete ALL transactions and plans. Continue?")) return;
  transactions = [];
  budgets = {};
  expenseNames = [];
  accounts = [newCash()];
  loans = [];
  contacts = [];
  transfers = [];
  savingsPlan = {};
  goals = [];
  bills = [];
  saveData();
  render();
  fillCategories();
  showToast("All data cleared");
});

// ---------- 9. Dark / light mode ----------
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("fintrack-theme", theme);
  $("theme-toggle").querySelector("span").textContent = theme === "dark" ? "Light mode" : "Dark mode";
  $("theme-toggle").querySelector("i, svg").outerHTML = `<i data-lucide="${theme === "dark" ? "sun" : "moon"}"></i>`;
  lucide.createIcons();
  if (categoryChart) renderCharts();
}
$("theme-toggle").addEventListener("click", () => {
  applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

// ---------- 10. Drawing the page ----------
function renderSummary() {
  const monthTx = getMonthTransactions();
  const income = sum(monthTx.filter((t) => t.type === "income").map((t) => t.amount));
  const expenses = sum(monthTx.filter((t) => t.type === "expense").map((t) => t.amount));
  const balance = income - expenses;
  const planned = sum(Object.values(getPlan()));

  $("total-income").textContent = formatMoney(income);
  $("total-expenses").textContent = formatMoney(expenses);

  // "Your money right now": real balances, kept apart from money friends still owe
  const kindSum = (kind) => sum(accounts.filter((a) => a.kind === kind).map((a) => a.balance));
  const nw = getNetWorth();
  $("d-avail").textContent = formatMoney(round2(kindSum("cash") + kindSum("checking")));
  $("d-cash").textContent = formatMoney(kindSum("cash"));
  $("d-bank").textContent = formatMoney(kindSum("checking"));
  // Saved this month = income minus personal expenses, worked out automatically
  const saved = Math.max(round2(income - expenses), 0), keep = savingsPlan[selectedMonth];
  $("d-saved").textContent = formatMoney(saved);
  $("d-saved-note").textContent = keep ? "Cash " + formatMoney(keep.cash) + " · Bank " + formatMoney(keep.bank) : saved > 0 ? "Tap to choose where to keep it" : "Nothing saved yet";
  $("d-owed").textContent = formatMoney(nw.owedToMe);
  $("d-owe").textContent = formatMoney(nw.iOwe);
  $("d-budget-left").textContent = planned > 0 ? formatMoney(round2(planned - expenses)) : "Not set";
  $("d-budget-left").className = planned > 0 && planned < expenses ? "expense" : "";
  $("d-budget-note").textContent = planned > 0 ? "of " + formatMoney(planned) + " planned" : "Set a plan on the Budget page";
}

// Red warnings on the dashboard for every category that went over its plan
function renderAlerts() {
  const plan = getPlan();
  const spent = getSpentByCategory();
  let html = "";
  for (const category in plan) {
    const over = (spent[category] || 0) - plan[category];
    if (over > 0) html += `<div class="alert">⚠ ${escapeHtml(category)}: you spent ${formatMoney(over)} more than planned.</div>`;
  }
  const totalPlan = sum(Object.values(plan));
  const totalSpent = sum(Object.values(spent));
  if (totalPlan > 0 && totalSpent > totalPlan) {
    html = `<div class="alert">⚠ Total spending is ${formatMoney(totalSpent - totalPlan)} over your plan for this month.</div>` + html;
  }
  $("alerts").innerHTML = html;
}

function renderTable() {
  const body = $("transaction-body");
  body.innerHTML = "";
  const search = $("hist-search").value.trim().toLowerCase();
  const shown = ($("hist-all").checked ? transactions : getMonthTransactions())
    .filter((t) => currentFilter === "all" || t.type === currentFilter)
    .filter((t) => !$("hist-account").value || t.accountId === $("hist-account").value)
    .filter((t) => !search || (t.description + " " + t.category).toLowerCase().includes(search))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  $("history-empty").style.display = shown.length === 0 ? "block" : "none";

  shown.forEach((t) => {
    const row = document.createElement("tr");
    const sign = t.type === "income" ? "+" : "−";
    row.innerHTML = `
      <td data-label="Date">${t.date}</td>
      <td class="desc" data-label="Description"></td>
      <td data-label="Category">${escapeHtml(t.category)}</td>
      <td data-label="Account">${escapeHtml(accountName(t.accountId))}</td>
      <td data-label="Type"><span class="badge ${t.type}">${t.type}</span></td>
      <td class="right ${t.type}" data-label="Amount">${sign}${formatMoney(t.amount)}</td>
      <td class="actions"><button class="delete-btn edit-btn" aria-label="Edit transaction"><i data-lucide="pencil"></i></button><button class="delete-btn" aria-label="Delete transaction"><i data-lucide="trash-2"></i></button></td>`;
    row.querySelector(".desc").textContent = t.description; // textContent keeps typed text safe
    row.querySelector(".edit-btn").addEventListener("click", () => startEdit(t));
    row.querySelector(".delete-btn:not(.edit-btn)").addEventListener("click", () => deleteTransaction(t.id));
    body.appendChild(row);
  });
  lucide.createIcons();
}

// Budget page: a progress bar for every planned expense
function renderBudget() {
  $("plan-month").textContent = monthName(selectedMonth);
  const plan = getPlan();
  const spent = getSpentByCategory();
  const names = [...new Set([...Object.keys(plan), ...Object.keys(spent)])];

  if (names.length === 0) {
    $("budget-progress").innerHTML = '<p class="empty">No expenses planned yet. Add one above.</p>';
    return;
  }

  // First row is the total, then one row per expense
  const rows = [["Total", sum(Object.values(plan)), sum(Object.values(spent))]];
  names.forEach((n) => rows.push([n, plan[n] || 0, spent[n] || 0]));

  $("budget-progress").innerHTML = rows.map(([name, planned, used], index) => {
    const over = planned > 0 && used > planned;
    const percent = planned > 0 ? Math.min((used / planned) * 100, 100) : (used > 0 ? 100 : 0);
    let note = "Not planned yet.";
    if (planned > 0) note = over ? `Over by ${formatMoney(used - planned)}` : `${formatMoney(planned - used)} left`;
    const removeButton = index > 0 && planned > 0
      ? `<button class="delete-btn remove-plan" data-name="${escapeHtml(name)}" aria-label="Remove ${escapeHtml(name)}"><i data-lucide="x"></i></button>` : "";
    return `<div class="progress-row">
      <div class="row-head"><span>${escapeHtml(name)}</span><span>${formatMoney(used)} / ${formatMoney(planned)} ${removeButton}</span></div>
      <div class="progress"><div class="bar ${over ? "over" : ""}" style="width:${percent}%"></div></div>
      <p class="row-note ${over ? "over" : ""}">${note}</p></div>`;
  }).join("");

  document.querySelectorAll(".remove-plan").forEach((button) => {
    button.addEventListener("click", () => removeFromPlan(button.dataset.name));
  });
  lucide.createIcons();
}

function renderCharts() {
  const css = getComputedStyle(document.documentElement);
  Chart.defaults.color = css.getPropertyValue("--muted").trim();
  Chart.defaults.font.family = "Manrope, sans-serif";

  // Doughnut: expenses by category for the viewed month
  const spent = getSpentByCategory();
  const hasExpenses = Object.keys(spent).length > 0;
  $("category-empty").style.display = hasExpenses ? "none" : "block";
  $("category-chart").parentElement.style.display = hasExpenses ? "block" : "none";

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart($("category-chart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(spent),
      datasets: [{
        data: Object.values(spent),
        backgroundColor: ["#0f6b5c", "#e8a33d", "#d9503f", "#4a7fd1", "#8e5bb5", "#3cc4a6", "#c9708a", "#7c8a82", "#b5a642", "#2f9fd0", "#a0522d"],
        borderWidth: 0,
      }],
    },
    options: { maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "bottom" } } },
  });

  // Bar chart: the viewed month and the 5 months before it
  const [year, number] = selectedMonth.split("-").map(Number);
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, number - 1 - i, 1);
    months.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  }
  const totalFor = (month, type) =>
    sum(transactions.filter((t) => t.type === type && t.date.startsWith(month)).map((t) => t.amount));

  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart($("monthly-chart"), {
    type: "bar",
    data: {
      labels: months.map((m) => new Date(m + "-01T00:00").toLocaleString("en-US", { month: "short" })),
      datasets: [
        { label: "Income", data: months.map((m) => totalFor(m, "income")), backgroundColor: css.getPropertyValue("--income").trim(), borderRadius: 6 },
        { label: "Expenses", data: months.map((m) => totalFor(m, "expense")), backgroundColor: css.getPropertyValue("--expense").trim(), borderRadius: 6 },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, grid: { color: css.getPropertyValue("--border").trim() } }, x: { grid: { display: false } } },
      plugins: { legend: { position: "bottom" } },
    },
  });
}

// Redraw everything. Called whenever the data or the month changes.
function render() {
  renderGreeting();
  updateNudge();
  $("month-label").textContent = monthName(selectedMonth);
  $("month-pick").value = selectedMonth;
  fillAccountSelects();
  renderSummary();
  renderAlerts();
  renderTable();
  renderBudget();
  renderNetWorth();
  renderContacts();
  renderLoans();
  renderContactDetail();
  renderAccountDetail();
  renderCharts();
  if (window.renderExtras) renderExtras(); // bills and savings goals (extras.js)
  if ($("reports").classList.contains("active")) renderReport();
}

// ---------- Dashboard cards open the details ----------
function goToHistory(filter) {
  currentFilter = filter;
  document.querySelectorAll(".filter-btn[data-filter]").forEach((b) => b.classList.toggle("active", b.dataset.filter === filter));
  renderTable();
  showView("history");
}
const cardLinks = { "income-card": () => goToHistory("income"), "expense-card": () => goToHistory("expense"), "nw-card": () => showView("networth") };
Object.keys(cardLinks).forEach((id) => {
  $(id).addEventListener("click", cardLinks[id]);
  $(id).addEventListener("keydown", (e) => { if (e.key === "Enter") cardLinks[id](); });
});

// ---------- Accounts (cash, checking, credit) ----------
const round2 = (n) => Math.round(n * 100) / 100;
const getAccount = (id) => accounts.find((a) => a.id === id);
const accountName = (id) => (getAccount(id) ? getAccount(id).name : "—");
const remaining = (loan) => round2(loan.amount - loan.paid);

// Put money into (positive) or take money out of (negative) an account.
// A credit card balance is money owed, so it moves the opposite way.
function moveMoney(account, moneyIn) {
  account.balance = round2(account.balance + (account.kind === "credit" ? -moneyIn : moneyIn));
}
// sign = 1 applies a transaction to its account, -1 undoes it
function applyEffect(t, sign) {
  const account = getAccount(t.accountId);
  if (account) moveMoney(account, (t.type === "income" ? t.amount : -t.amount) * sign);
}

// Drop-down lists of accounts used in the forms
function accountOptions(prefix, noCredit) {
  return accounts.filter((a) => !noCredit || a.kind !== "credit")
    .map((a) => `<option value="${a.id}">${prefix}${escapeHtml(a.name)}${a.kind === "credit" ? " (credit card)" : ""}</option>`).join("");
}
function fillAccountSelects() {
  const fill = (id, html) => {
    const select = $(id), old = select.value;
    select.innerHTML = html;
    if (old && [...select.options].some((o) => o.value === old)) select.value = old;
  };
  fill("account", accountOptions("", false));
  fill("hist-account", '<option value="">All payment methods</option>' + accountOptions("", false));
  fill("transfer-from", accountOptions("From: ", true));
  fill("transfer-to", accountOptions("To: ", false));
  fill("loan-account", '<option value="">No account</option>' + accountOptions("", false));
  fill("loan-person", '<option value="">Choose a person…</option>' + contacts.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("") + '<option value="__new">＋ Add a new person…</option>');
  fill("loan-category", getExpenseCategories().map((c) => `<option>${escapeHtml(c)}</option>`).join(""));
}

function getNetWorth() {
  const money = sum(accounts.filter((a) => a.kind !== "credit").map((a) => a.balance));
  const debt = sum(accounts.filter((a) => a.kind === "credit").map((a) => a.balance));
  const owedToMe = sum(loans.filter((l) => l.kind === "lent").map(remaining));
  const iOwe = sum(loans.filter((l) => l.kind !== "lent").map(remaining));
  const inGoals = sum(goals.map((g) => g.saved)); // money set aside in savings goals still belongs to you
  return { money, debt, owedToMe, iOwe, inGoals, total: money + inGoals - debt + owedToMe - iOwe };
}

function accountRow(a) {
  let info = formatMoney(a.balance), extra = "", main = "";
  if (a.kind === "credit") {
    const used = a.limit > 0 ? Math.min((a.balance / a.limit) * 100, 100) : 0;
    info = formatMoney(a.balance) + " owed";
    extra = `<div class="progress"><div class="bar ${a.balance > a.limit ? "over" : ""}" style="width:${used}%"></div></div>
      <p class="row-note">Limit ${formatMoney(a.limit)} · Available ${formatMoney(a.limit - a.balance)}</p>`;
    main = `<button class="mini-btn" data-action="pay-card" data-id="${a.id}">Pay balance</button>`;
  } else if (a.kind === "checking") {
    main = `<button class="mini-btn" data-action="deposit" data-id="${a.id}">Deposit cash</button>`;
  }
  const editLabel = a.kind === "credit" ? "Edit amount owed" : "Edit balance";
  const edit = `<button class="delete-btn" data-action="edit-balance" data-id="${a.id}" aria-label="${editLabel}" title="${editLabel}"><i data-lucide="pencil"></i></button>`;
  const remove = a.kind === "cash" ? "" :
    `<button class="delete-btn" data-action="delete-account" data-id="${a.id}" aria-label="Delete ${escapeHtml(a.name)}" title="Delete"><i data-lucide="trash-2"></i></button>`;
  return `<div class="acct acct-${a.kind}" role="button" tabindex="0" data-action="open-account" data-id="${a.id}"><div class="row-head"><span>${escapeHtml(a.name)}</span><strong>${info}</strong></div>${extra}
    <div class="acct-actions">${main}<span class="spacer"></span>${edit}${remove}</div></div>`;
}

function renderNetWorth() {
  const n = getNetWorth();
  $("nw-total").textContent = formatMoney(n.total);
  $("nw-total").className = n.total < 0 ? "expense" : "";
  $("nw-dash").textContent = formatMoney(n.total);
  const sumOf = (kind) => sum(accounts.filter((a) => a.kind === kind).map((a) => a.balance));
  $("nw-cash").textContent = formatMoney(sumOf("cash"));
  $("nw-checking").textContent = formatMoney(sumOf("checking"));
  $("nw-debt").textContent = formatMoney(n.debt);
  $("nw-savings").textContent = formatMoney(sumOf("savings"));
  $("nw-note").textContent = `Includes loans: people owe you ${formatMoney(n.owedToMe)}, you owe ${formatMoney(n.iOwe)}${n.inGoals > 0 ? ". Savings goals: " + formatMoney(n.inGoals) : ""}`;

  const list = (kind) => accounts.filter((a) => a.kind === kind).map(accountRow).join("") || '<p class="empty">None yet.</p>';
  $("cash-list").innerHTML = list("cash");
  $("checking-list").innerHTML = list("checking");
  $("credit-list").innerHTML = list("credit");
  $("savings-list").innerHTML = list("savings");
  $("transfer-list").innerHTML = transfers.slice(-8).reverse().map((t) =>
    `<div class="transfer-line"><span>${t.date} · ${escapeHtml(t.from)} → ${escapeHtml(t.to)} ${escapeHtml(t.note)}</span><strong>${formatMoney(t.amount)}</strong></div>`).join("");
  lucide.createIcons();
}

// Add a checking account or a credit card
$("checking-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("checking-name").value.trim();
  const balance = parseFloat($("checking-balance").value || "0");
  if (name === "" || isNaN(balance) || balance < 0) { $("nw-error").textContent = "Enter an account name and a balance of 0 or more."; return; }
  $("nw-error").textContent = "";
  accounts.push({ id: "a" + Date.now(), kind: "checking", name: name, balance: round2(balance) });
  saveData(); e.target.reset(); render(); showToast(name + " added");
});
$("savings-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("savings-name").value.trim();
  const balance = parseFloat($("savings-balance").value || "0");
  if (name === "" || isNaN(balance) || balance < 0) { $("nw-error").textContent = "Enter a savings account name and a balance of 0 or more."; return; }
  $("nw-error").textContent = "";
  accounts.push({ id: "a" + Date.now(), kind: "savings", name: name, balance: round2(balance) });
  saveData(); e.target.reset(); render(); showToast(name + " added");
});
$("credit-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("credit-name").value.trim();
  const limit = parseFloat($("credit-limit").value);
  const owed = parseFloat($("credit-owed").value || "0");
  if (name === "" || isNaN(limit) || limit <= 0 || isNaN(owed) || owed < 0) { $("nw-error").textContent = "Enter a card name, a credit limit above 0, and the balance owed."; return; }
  $("nw-error").textContent = "";
  accounts.push({ id: "a" + Date.now(), kind: "credit", name: name, limit: round2(limit), balance: round2(owed) });
  saveData(); e.target.reset(); render(); showToast(name + " added");
});

// Move money between accounts (deposit cash, pay a credit card...)
$("transfer-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const from = getAccount($("transfer-from").value);
  const to = getAccount($("transfer-to").value);
  const amount = parseFloat($("transfer-amount").value);
  const error = $("nw-error");
  if (!from || !to || from === to) { error.textContent = "Choose two different accounts."; return; }
  if (isNaN(amount) || amount <= 0) { error.textContent = "Enter an amount greater than 0."; return; }
  if (from.balance < amount) { error.textContent = "Not enough money in " + from.name + "."; return; }
  if (to.kind === "credit" && amount > to.balance) { error.textContent = "That is more than the balance owed on " + to.name + "."; return; }
  error.textContent = "";
  moveMoney(from, -amount);
  moveMoney(to, amount);
  transfers.push({ id: Date.now(), date: today(), from: from.name, to: to.name, fromId: from.id, toId: to.id, amount: round2(amount), note: $("transfer-note").value.trim() });
  saveData(); e.target.reset(); render(); showToast("Money moved");
});

// Buttons inside the account and loan lists (one click listener for all of them)
// Enter key works on the clickable summary cards
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.matches('[role="button"][data-action]')) e.target.click();
});
document.addEventListener("click", async (e) => {
  const button = e.target.closest("[data-action]");
  if (!button) return;
  const id = button.dataset.id, action = button.dataset.action;
  const account = getAccount(id);

  if (action === "edit-balance") {
    const result = await askAmount(account.kind === "credit" ? "Set amount owed" : "Set balance", account.name, account.balance);
    if (result === null) return; // cancelled
    account.balance = result.amount;
  } else if (action === "delete-account") {
    if (!confirm("Delete " + account.name + "? Its past transactions stay in History.")) return;
    accounts = accounts.filter((a) => a.id !== id);
  } else if (action === "pay-card" || action === "deposit") {
    // Fill in the "Move money" form for you
    $("transfer-to").value = id;
    if (action === "deposit") $("transfer-from").value = "cash";
    $("transfer-amount").value = action === "pay-card" ? account.balance : "";
    $("transfer-card").open = true;
    $("transfer-card").scrollIntoView({ behavior: "smooth" });
    $("transfer-amount").focus();
    return;
  } else if (action === "pay-loan") {
    const loan = loans.find((l) => l.id === Number(id));
    const result = await askAmount("Record payment", loan.person + " · " + formatMoney(remaining(loan)) + " still open",
      remaining(loan), 0.01, remaining(loan), loan.kind === "lent" ? "Money received into" : "Paid from");
    if (result === null) return;
    const payAccount = getAccount(result.accountId);
    if (loan.kind !== "lent" && payAccount && payAccount.kind !== "credit" && payAccount.balance < result.amount) {
      showToast("Not enough money in " + payAccount.name); return;
    }
    // They pay me: money comes in. I pay them: money goes out.
    if (payAccount) moveMoney(payAccount, loan.kind === "lent" ? result.amount : -result.amount);
    loan.paid = round2(loan.paid + result.amount);
    loan.payments = loan.payments || [];
    loan.payments.push({ id: Date.now(), date: today(), amount: result.amount, accountId: result.accountId });
  } else if (action === "open-account" || action === "open-kind") {
    detailTarget = action === "open-account" ? { id: id } : { kind: id };
    render();
    showView("account-detail");
    return;
  } else if (action === "open-contact") {
    detailContact = id;
    render();
    showView("contact-detail");
    return;
  } else if (action === "add-for") {
    openLoanDialog(id);
    return;
  } else if (action === "settle-up") {
    await settleUp(id);
    return;
  } else if (action === "delete-contact") {
    if (loans.some((l) => l.contactId === id && remaining(l) > 0)) { showToast("Settle up with them first"); return; }
    if (!confirm("Delete this contact and their settled history?")) return;
    contacts = contacts.filter((c) => c.id !== id);
    loans = loans.filter((l) => l.contactId !== id);
  } else if (action === "delete-loan") {
    if (!confirm("Delete this loan?")) return;
    loans = loans.filter((l) => l.id !== Number(id));
  } else return;
  saveData();
  render();
  if (action === "delete-contact") { detailContact = null; showView("contacts"); }
});

// ---------- People, loans and settling up (Splitwise style) ----------
const owedBy = (id) => sum(loans.filter((l) => l.contactId === id && l.kind === "lent").map(remaining));
const iOweTo = (id) => sum(loans.filter((l) => l.contactId === id && l.kind !== "lent").map(remaining));
const initial = (name) => (String(name).trim()[0] || "?").toUpperCase();
const hasOpen = (id) => loans.some((l) => l.contactId === id && remaining(l) > 0);
const kindText = { "lent": "Paid by me", "borrowed": "They lent me cash", "paid-for-me": "Paid by a friend" };
let paySeq = 0;
const nextPayId = () => Date.now() + (paySeq++) / 1000;

// owed = what they owe me, owe = what I owe them, net > 0 means they owe me
function personBalance(id) {
  const owed = owedBy(id), owe = iOweTo(id);
  return { owed, owe, net: round2(owed - owe) };
}
function statusText(name, net) {
  if (net > 0.004) return name + " owes you " + formatMoney(net);
  if (net < -0.004) return "You owe " + name + " " + formatMoney(-net);
  return "All settled up";
}
function balanceCell(net) {
  if (Math.abs(net) < 0.005) return '<span class="bal muted"><small>settled up</small></span>';
  return `<span class="bal ${net > 0 ? "income" : "expense"}"><small>${net > 0 ? "owes you" : "you owe"}</small><strong>${formatMoney(Math.abs(net))}</strong></span>`;
}

// One tappable row for a person (used on the Contacts and Loans pages)
function personRow(c, showSettle) {
  const { net } = personBalance(c.id);
  const settle = showSettle && hasOpen(c.id) ? `<button class="mini-btn" data-action="settle-up" data-id="${c.id}">Settle up</button>` : "";
  return `<div class="person-row" role="button" tabindex="0" data-action="open-contact" data-id="${c.id}">
    <span class="avatar">${escapeHtml(initial(c.name))}</span>
    <span class="person-name">${escapeHtml(c.name)}</span>
    ${balanceCell(net)}${settle}<i data-lucide="chevron-right" class="go-inline"></i></div>`;
}

// ---------- Contacts ----------
$("contact-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("contact-name").value.trim();
  const error = $("contact-error");
  if (name === "") { error.textContent = "Enter the contact's name."; return; }
  if (contacts.some((c) => c.name.toLowerCase() === name.toLowerCase())) { error.textContent = name + " is already in your contacts."; return; }
  error.textContent = "";
  contacts.push({ id: "c" + Date.now(), name: name });
  saveData(); e.target.reset(); render(); showToast(name + " added to contacts");
});
$("contact-back").addEventListener("click", () => showView("contacts"));

function renderContacts() {
  $("contact-empty").style.display = contacts.length ? "none" : "block";
  $("contact-list").innerHTML = contacts.map((c) => personRow(c, false)).join("");
  lucide.createIcons();
}

// Everything between you and one person
function renderContactDetail() {
  if (!detailContact) return;
  const c = contacts.find((x) => x.id === detailContact);
  if (!c) { detailContact = null; return; }
  const mine = loans.filter((l) => l.contactId === c.id);
  const { owed, owe, net } = personBalance(c.id);

  $("cd-avatar").textContent = initial(c.name);
  $("cd-name").textContent = c.name;
  $("cd-status").textContent = statusText(c.name, net);
  $("cd-status").className = net > 0.004 ? "income" : net < -0.004 ? "expense" : "muted";
  $("cd-owed").textContent = formatMoney(owed);
  $("cd-owe").textContent = formatMoney(owe);
  $("cd-lent").textContent = formatMoney(sum(mine.filter((l) => l.kind === "lent").map((l) => l.total || l.amount)));
  $("cd-borrowed").textContent = formatMoney(sum(mine.filter((l) => l.kind !== "lent").map((l) => l.total || l.amount)));
  ["cd-add", "cd-settle", "cd-delete"].forEach((id) => { $(id).dataset.id = c.id; });
  $("cd-settle").hidden = !hasOpen(c.id);

  // Expenses and loans, newest first
  $("cd-loans").innerHTML = mine.length ? mine.slice().reverse().map((l) => {
    const left = remaining(l);
    const tone = l.kind === "lent" ? "income" : "expense";
    const percent = Math.min((l.paid / l.amount) * 100, 100);
    const split = l.split ? " · split equally from " + formatMoney(l.total) : "";
    const pay = left > 0 ? `<button class="mini-btn" data-action="pay-loan" data-id="${l.id}">Record payment</button>` : "";
    return `<div class="loan-item">
      <div class="top"><div><strong>${escapeHtml(l.note || kindText[l.kind])}</strong><p class="meta">${l.date} · ${kindText[l.kind]}${split}</p></div>
        <strong class="${left > 0 ? tone : "muted"}">${left > 0 ? formatMoney(left) + " left" : "Settled"}</strong></div>
      <div class="progress thin"><div class="bar" style="width:${percent}%"></div></div>
      <p class="meta">${formatMoney(l.paid)} paid back of ${formatMoney(l.amount)}</p>
      <div class="actions">${pay}<button class="delete-btn" data-action="delete-loan" data-id="${l.id}" aria-label="Delete this entry" title="Delete"><i data-lucide="trash-2"></i></button></div>
    </div>`;
  }).join("") : '<p class="empty">Nothing yet. Tap "Add expense" to start.</p>';

  // Every payment, newest first
  const pays = [];
  mine.forEach((l) => (l.payments || []).forEach((p) => pays.push({ p: p, l: l })));
  pays.sort((a, b) => b.p.date.localeCompare(a.p.date) || b.p.id - a.p.id);
  $("cd-payments").innerHTML = pays.length ? pays.map(({ p, l }) => {
    const theyPaid = l.kind === "lent";
    const where = p.offset ? "cancelled out" : p.accountId ? accountName(p.accountId) : "no account";
    return `<div class="activity-row"><span class="dot ${theyPaid ? "income" : "expense"}"></span>
      <div class="grow"><p>${theyPaid ? escapeHtml(c.name) + " paid you" : "You paid " + escapeHtml(c.name)}</p>
      <small>${p.date} · ${escapeHtml(l.note || kindText[l.kind])} · ${escapeHtml(where)}</small></div>
      <strong class="${theyPaid ? "income" : "expense"}">${formatMoney(p.amount)}</strong></div>`;
  }).join("") : '<p class="empty">No payments yet.</p>';
  lucide.createIcons();
}

// ---------- Loans page ----------
function activityItems() {
  const items = [];
  loans.forEach((l) => {
    const money = formatMoney(l.amount), who = l.person, what = l.note ? " for " + l.note : "";
    if (l.kind === "lent") items.push({ id: l.id, date: l.date, tone: "income", text: `You paid${what}. ${who} owes you ${money}.` });
    else if (l.kind === "paid-for-me") items.push({ id: l.id, date: l.date, tone: "expense", text: `${who} paid${what}. You owe ${money}.` });
    else items.push({ id: l.id, date: l.date, tone: "expense", text: `${who} lent you ${money}.` });
    (l.payments || []).forEach((p) => {
      const pm = formatMoney(p.amount);
      const text = p.offset ? `${who} and you cancelled out ${pm}.` : l.kind === "lent" ? `${who} paid you ${pm}.` : `You paid ${who} ${pm}.`;
      items.push({ id: p.id, date: p.date, tone: l.kind === "lent" ? "income" : "expense", text: text });
    });
  });
  return items.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 10);
}

function renderLoans() {
  const n = getNetWorth();
  const net = round2(n.owedToMe - n.iOwe);
  $("loan-headline").textContent = net > 0.004 ? "Overall, you are owed " + formatMoney(net)
    : net < -0.004 ? "Overall, you owe " + formatMoney(-net) : "You're all settled up";
  $("loan-sub").textContent = "People owe you " + formatMoney(n.owedToMe) + " · You owe people " + formatMoney(n.iOwe);

  const people = contacts.filter((c) => loans.some((l) => l.contactId === c.id))
    .sort((a, b) => Math.abs(personBalance(b.id).net) - Math.abs(personBalance(a.id).net));
  $("loan-empty").style.display = people.length ? "none" : "block";
  $("loan-people").innerHTML = people.map((c) => personRow(c, true)).join("");

  const items = activityItems();
  $("loan-activity").innerHTML = items.length ? items.map((i) =>
    `<div class="activity-row"><span class="dot ${i.tone}"></span><div class="grow"><p>${escapeHtml(i.text)}</p><small>${i.date}</small></div></div>`).join("")
    : '<p class="empty">Nothing yet.</p>';
  lucide.createIcons();
}

// ---------- Add expense or loan (pop-up) ----------
const loanDialog = $("loan-dialog");
let extraFor = null; // whose "also split with" list is on screen
// ids of the extra friends ticked in "Also split with"
function extraIds() { return [...document.querySelectorAll("#loan-extra input:checked")].map((i) => i.value); }
const loanKind = () => $("loan-form").elements["loan-kind"].value;
function loanPersonName() {
  const value = $("loan-person").value;
  if (value === "__new") return $("loan-new-name").value.trim();
  const c = contacts.find((x) => x.id === value);
  return c ? c.name : "";
}

// Works out the numbers for the form: what was paid, what is owed, and what part is my own expense
function loanNumbers() {
  const kind = loanKind();
  const amount = parseFloat($("loan-amount").value);
  const total = isNaN(amount) || amount <= 0 ? 0 : round2(amount);
  const split = kind !== "borrowed" && $("loan-split").checked;
  const extras = split ? extraIds().length : 0;   // friends added with "Also split with"
  const parts = split ? extras + 2 : 1;           // people sharing the bill, me included
  const share = split ? Math.floor(Math.round(total * 100) / parts) / 100 : total; // each friend's share, in whole cents
  const myExpense = kind === "paid-for-me" ? share : kind === "lent" && split ? round2(total - share * (parts - 1)) : 0;
  return { kind, total, split, share, myExpense, extras, parts };
}

// Show only the fields that matter, and say in plain words who owes what
function updateLoanForm() {
  const { kind, total, split, share, myExpense, extras, parts } = loanNumbers();
  const name = loanPersonName() || "They";
  $("loan-new-wrap").hidden = $("loan-person").value !== "__new";
  $("loan-person-text").textContent = kind === "paid-for-me" ? "Which friend paid?" : kind === "borrowed" ? "Who lent you cash?" : "Who shares it with you?";
  $("loan-split-wrap").hidden = kind === "borrowed";
  if ($("loan-person").value !== extraFor) {   // rebuild the friends list only when the main person changes
    extraFor = $("loan-person").value;
    $("loan-extra").innerHTML = contacts.filter((c) => c.id !== extraFor).map((c) => `<label class="check"><input type="checkbox" value="${c.id}"> ${escapeHtml(c.name)}</label>`).join("");
  }
  $("loan-extra-wrap").hidden = !split || contacts.length < 2;
  $("loan-account-wrap").hidden = kind === "paid-for-me";
  $("loan-account-text").textContent = kind === "borrowed" ? "Money received into (optional)" : "Paid from (optional)";
  $("loan-expense-wrap").hidden = myExpense <= 0;
  $("loan-expense-text").textContent = "Add my share (" + formatMoney(myExpense) + ") to my expenses";
  const half = split ? " (" + formatMoney(total) + " split " + parts + " ways)" : "";
  let text = "";
  if (total > 0) {
    if (kind === "lent") text = (extras ? (extras + 1) + " friends each owe you " : name + " owes you ") + formatMoney(share) + half;
    else if (kind === "paid-for-me") text = "You owe " + name + " " + formatMoney(share) + half;
    else text = "You owe " + name + " " + formatMoney(total);
  }
  if (split && total > 0) text += ". Group of " + parts + " (you included). Your own share: " + formatMoney(myExpense) + ".";
  $("loan-preview").textContent = text;
}
loanDialog.addEventListener("input", updateLoanForm);
loanDialog.addEventListener("change", updateLoanForm);

function openLoanDialog(contactId, kind) {
  $("loan-form").reset();
  $("loan-error").textContent = "";
  extraFor = null;
  fillAccountSelects();
  $("loan-person").value = contactId || (contacts.length ? "" : "__new");
  if (kind) { $("loan-form").elements["loan-kind"].value = kind; $("loan-split").checked = true; }  // quick start from the Add page
  updateLoanForm();
  loanDialog.showModal();
}
$("open-loan-dialog").addEventListener("click", () => openLoanDialog(""));
$("loan-cancel").addEventListener("click", () => loanDialog.close());

$("loan-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const error = $("loan-error");
  const { kind, total, split, share, myExpense, parts } = loanNumbers();
  const note = $("loan-note").value.trim();

  let contact = contacts.find((c) => c.id === $("loan-person").value);
  let newName = "";
  if ($("loan-person").value === "__new") {
    newName = $("loan-new-name").value.trim();
    if (newName === "") { error.textContent = "Type the person's name."; return; }
    contact = contacts.find((c) => c.name.toLowerCase() === newName.toLowerCase()); // already in contacts? use them
  } else if (!contact) { error.textContent = "Choose who this is with."; return; }
  if (total <= 0) { error.textContent = "Enter an amount greater than 0."; return; }

  // The full amount leaves your account when you pay, or arrives when someone lends you cash
  const account = kind === "paid-for-me" ? null : getAccount($("loan-account").value);
  if (kind === "lent" && account && account.kind !== "credit" && account.balance < total) {
    error.textContent = "Not enough money in " + account.name + "."; return;
  }
  error.textContent = "";

  if (!contact) { contact = { id: "c" + Date.now(), name: newName }; contacts.push(contact); }
  if (account) moveMoney(account, kind === "borrowed" ? total : -total);
  // Everyone in a split gets their own IOU. The account is linked to the first IOU only, so money leaves it once.
  const who = [contact].concat(kind === "lent" && split ? extraIds().map((id) => contacts.find((c) => c.id === id)).filter(Boolean) : []);
  who.forEach((c, i) => loans.push({ id: Date.now() + i, kind: kind, contactId: c.id, person: c.name,
    accountId: i === 0 && account ? account.id : "", payments: [], amount: share, total: i === 0 ? total : share, split: i === 0 && split,
    parts: parts, paid: 0, note: note, date: today() }));

  // Optionally count my own part as an expense (it does not touch any account again)
  if (myExpense > 0 && $("loan-expense").checked) {
    transactions.push({ id: Date.now() + 1, type: "expense", amount: myExpense, category: $("loan-category").value,
      description: (note || "Shared expense") + " (with " + contact.name + (who.length > 1 ? " +" + (who.length - 1) : "") + ")", date: today(), accountId: "", shared: true });
  }
  saveData();
  loanDialog.close();
  render();
  showToast(statusText(contact.name, personBalance(contact.id).net));
});

// ---------- Settle up ----------
// Pay off loans in one direction, oldest first ("lent" = they owe me, anything else = I owe them)
function applyPayments(contactId, direction, amount, accountId, offset) {
  let left = amount;
  loans.filter((l) => l.contactId === contactId && (direction === "lent" ? l.kind === "lent" : l.kind !== "lent") && remaining(l) > 0)
    .sort((a, b) => a.id - b.id)
    .forEach((l) => {
      const pay = Math.min(left, remaining(l));
      if (pay <= 0) return;
      l.paid = round2(l.paid + pay);
      l.payments = l.payments || [];
      const entry = { id: nextPayId(), date: today(), amount: round2(pay), accountId: accountId || "" };
      if (offset) entry.offset = true;
      l.payments.push(entry);
      left = round2(left - pay);
    });
}
// When you owe each other, the smaller side cancels out against the bigger side
function offsetAll(contactId) {
  const a = sum(loans.filter((l) => l.contactId === contactId && l.kind === "lent").map(remaining));
  const b = sum(loans.filter((l) => l.contactId === contactId && l.kind !== "lent").map(remaining));
  const x = round2(Math.min(a, b));
  if (x <= 0) return;
  applyPayments(contactId, "lent", x, "", true);
  applyPayments(contactId, "owe", x, "", true);
}

async function settleUp(contactId) {
  const c = contacts.find((x) => x.id === contactId);
  if (!c) return;
  const net = personBalance(contactId).net;
  if (Math.abs(net) < 0.005) {   // you owe each other the same amount
    if (!hasOpen(contactId)) { showToast("Already settled up"); return; }
    if (!confirm(c.name + " and you owe each other the same amount. Cancel them out?")) return;
    offsetAll(contactId);
    saveData(); render(); showToast("Settled up with " + c.name);
    return;
  }
  const theyPay = net > 0;
  const open = Math.abs(net);
  const result = await askAmount(theyPay ? c.name + " pays you" : "You pay " + c.name, "Open balance: " + formatMoney(open),
    open, 0.01, open, theyPay ? "Money received into" : "Paid from");
  if (result === null) return;
  const account = getAccount(result.accountId);
  if (!theyPay && account && account.kind !== "credit" && account.balance < result.amount) { showToast("Not enough money in " + account.name); return; }
  applyPayments(contactId, theyPay ? "lent" : "owe", result.amount, result.accountId);
  if (account) moveMoney(account, theyPay ? result.amount : -result.amount);
  const settled = result.amount >= open - 0.004;
  if (settled) offsetAll(contactId);
  saveData(); render();
  showToast(settled ? "Settled up with " + c.name : "Payment recorded");
}

// ---------- Amount pop-up (replaces the plain browser prompt) ----------
// Shows a dialog. Returns { amount, accountId } or null if cancelled.
// Pass accountLabel (like "Paid from") to also ask which account is used.
function askAmount(title, label, start, min = 0, max = Infinity, accountLabel = "") {
  return new Promise((resolve) => {
    const dialog = $("amount-dialog"), input = $("dialog-amount"), error = $("dialog-error");
    $("dialog-title").textContent = title;
    $("dialog-label").textContent = label;
    input.value = start;
    error.textContent = "";
    $("dialog-account-label").hidden = accountLabel === "";
    if (accountLabel) {
      $("dialog-account-text").textContent = accountLabel;
      $("dialog-account").innerHTML = accountOptions("", false) + '<option value="">Don\'t change any account</option>';
    }
    $("amount-form").onsubmit = (e) => {
      e.preventDefault();
      const value = parseFloat(input.value);
      if (isNaN(value) || value < min || value > max) {
        error.textContent = max === Infinity ? "Enter an amount of " + formatMoney(min) + " or more." : "Enter an amount between " + formatMoney(min) + " and " + formatMoney(max) + ".";
        return;
      }
      dialog.close();
      resolve({ amount: round2(value), accountId: accountLabel ? $("dialog-account").value : "" });
    };
    $("dialog-cancel").onclick = () => { dialog.close(); resolve(null); };
    dialog.oncancel = () => resolve(null); // Esc key
    dialog.showModal();
    input.select();
  });
}

// ---------- Account detail: every transaction of an account ----------
// Collect everything that moved money in or out of one account.
// moneyIn is positive when money came into the account, negative when it left.
function accountActivity(a) {
  const items = [];
  const add = (id, date, title, note, type, moneyIn) => items.push({ id, date, title, note, type, moneyIn, account: a.name });

  transactions.filter((t) => t.accountId === a.id).forEach((t) =>
    add(t.id, t.date, t.description, t.category, t.type === "income" ? "Income" : "Expense", t.type === "income" ? t.amount : -t.amount));

  transfers.forEach((t) => {
    // older transfers only saved the account names
    const isFrom = t.fromId ? t.fromId === a.id : t.from === a.name;
    const isTo = t.toId ? t.toId === a.id : t.to === a.name;
    if (isFrom) add(t.id, t.date, "Transfer to " + t.to, t.note, "Transfer", -t.amount);
    else if (isTo) add(t.id, t.date, "Transfer from " + t.from, t.note, "Transfer", t.amount);
  });

  loans.forEach((l) => {
    if (l.accountId === a.id) add(l.id, l.date, (l.kind === "lent" ? "Loan to " : "Borrowed from ") + l.person, l.note, "Loan", l.kind === "lent" ? -(l.total || l.amount) : (l.total || l.amount));
    (l.payments || []).filter((p) => p.accountId === a.id).forEach((p) =>
      add(p.id, p.date, (l.kind === "lent" ? "Payment received from " : "Payment to ") + l.person, l.note, "Loan payment", l.kind === "lent" ? p.amount : -p.amount));
  });
  goals.forEach((g) => (g.history || []).filter((h) => h.accountId === a.id).forEach((h) =>
    add(h.id, h.date, (h.amount > 0 ? "Saved to goal: " : "Taken from goal: ") + g.name, "", "Goal", -h.amount)));
  return items;
}

function renderAccountDetail() {
  if (!detailTarget) return;
  const single = detailTarget.id ? getAccount(detailTarget.id) : null;
  if (detailTarget.id && !single) { detailTarget = null; return; }
  const kind = single ? single.kind : detailTarget.kind;
  const list = single ? [single] : accounts.filter((a) => a.kind === kind);
  const groupNames = { cash: "cash", checking: "checking accounts", credit: "credit cards", savings: "savings accounts" };
  const items = list.flatMap(accountActivity).sort((x, y) => y.date.localeCompare(x.date) || y.id - x.id);

  $("detail-title").textContent = single ? single.name : "All " + groupNames[kind];
  $("detail-balance-label").textContent = kind === "credit" ? "Balance owed" : "Balance";
  $("detail-balance").textContent = formatMoney(sum(list.map((a) => a.balance)));
  $("detail-in-label").textContent = kind === "credit" ? "Payments & refunds" : "Money in";
  $("detail-out-label").textContent = kind === "credit" ? "Purchases & charges" : "Money out";
  $("detail-in").textContent = formatMoney(sum(items.filter((i) => i.moneyIn > 0).map((i) => i.moneyIn)));
  $("detail-out").textContent = formatMoney(-sum(items.filter((i) => i.moneyIn < 0).map((i) => i.moneyIn)));
  if (single && kind === "credit") {
    $("detail-extra-label").textContent = "Available credit";
    $("detail-extra").textContent = formatMoney(single.limit - single.balance);
  } else {
    $("detail-extra-label").textContent = "Transactions";
    $("detail-extra").textContent = items.length;
  }
  $("detail-empty").style.display = items.length ? "none" : "block";
  $("detail-body").innerHTML = items.map((i) =>
    `<tr><td data-label="Date">${i.date}</td><td data-label="Description">${escapeHtml(i.title)}<br><small>${escapeHtml(i.note || "")}</small></td><td data-label="Account">${escapeHtml(i.account)}</td>
      <td data-label="Type"><span class="badge">${i.type}</span></td>
      <td class="right ${i.moneyIn > 0 ? "income" : "expense"}" data-label="Amount">${i.moneyIn > 0 ? "+" : "−"}${formatMoney(Math.abs(i.moneyIn))}</td></tr>`).join("");
}
$("detail-back").addEventListener("click", () => showView("networth"));

// ============================================================
// Accounts, onboarding and cloud sync (Firebase)
// ============================================================
// Country list: the country decides the currency
const COUNTRIES = [
  ["United States", "USD"], ["Canada", "CAD"], ["United Kingdom", "GBP"], ["Germany", "EUR"], ["France", "EUR"], ["Spain", "EUR"], ["Italy", "EUR"],
  ["Netherlands", "EUR"], ["Ireland", "EUR"], ["India", "INR"], ["Pakistan", "PKR"], ["Bangladesh", "BDT"], ["Nepal", "NPR"], ["Sri Lanka", "LKR"],
  ["Nigeria", "NGN"], ["Ghana", "GHS"], ["Kenya", "KES"], ["South Africa", "ZAR"], ["Egypt", "EGP"], ["United Arab Emirates", "AED"],
  ["Saudi Arabia", "SAR"], ["Turkey", "TRY"], ["Japan", "JPY"], ["South Korea", "KRW"], ["China", "CNY"], ["Philippines", "PHP"],
  ["Indonesia", "IDR"], ["Malaysia", "MYR"], ["Singapore", "SGD"], ["Thailand", "THB"], ["Vietnam", "VND"], ["Australia", "AUD"],
  ["New Zealand", "NZD"], ["Brazil", "BRL"], ["Mexico", "MXN"], ["Argentina", "ARS"], ["Colombia", "COP"],
];
$("su-country").innerHTML = '<option value="">Select your country…</option>' + COUNTRIES.map(([name, code]) => `<option value="${name}">${name} (${code})</option>`).join("");

// Firebase is only used when firebase-config.js has real keys
const cloudConfig = window.FINTRACK_FIREBASE;
const cloudReady = !!(window.firebase && cloudConfig && cloudConfig.apiKey && !cloudConfig.apiKey.startsWith("PASTE"));
let auth = null, db = null, saveTimer = null, pendingProfile = null;
if (cloudReady) {
  firebase.initializeApp(cloudConfig);
  auth = firebase.auth();
  db = firebase.firestore();
}
// Firebase wants an email, so a username becomes a private pseudo-email.
// Firebase refuses duplicate emails, which is what keeps usernames unique.
const fakeEmail = (username) => username + "@fintrack.app";

// Friendly text for Firebase errors. "where" says which form the error came from.
function authMessage(error, where) {
  const c = error.code;
  if (c === "auth/email-already-in-use") return where === "signup" ? "An account with that email already exists. Log in instead, or use \"Forgot password?\"." : "That email is already used by another account.";
  if (c === "auth/invalid-email") return "That email address does not look right.";
  if (c === "auth/weak-password") return "Use a password with at least 6 characters.";
  if (c === "auth/network-request-failed") return "No connection. Check your internet and try again.";
  if (c === "auth/too-many-requests") return "Too many attempts. Please wait a moment and try again.";
  if (c === "auth/requires-recent-login") return "For safety, log out, log in again, then try once more.";
  if (["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password", "auth/invalid-login-credentials"].includes(c)) {
    return where === "reauth" ? "Your current password is not correct." : "Wrong username/email or password. If you added an email to your account, log in with that email.";
  }
  return "Something went wrong. Please try again.";
}
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validName = (v) => /^[\p{L}\p{N} _.'-]{2,30}$/u.test(v) && v.toLowerCase() !== "guest";

// Cloud save: wait 0.8s after the last change, then write one document per user
function scheduleCloudSave() { clearTimeout(saveTimer); saveTimer = setTimeout(cloudSaveNow, 800); }
let lastSeen = 0, unsubLive = null;   // newest cloud save this device has seen
function cloudSaveNow() {
  if (!cloudUser) return Promise.resolve();
  const stamp = Date.now();
  lastSeen = stamp;
  return db.collection("users").doc(cloudUser.uid).set({
    username: profile.username, country: profile.country, currency: profile.currency,
    data: JSON.stringify(getState()), updatedAt: stamp,
  }).catch(() => showToast("Could not sync. Check your connection."));
}

// Live sync: when another device saves, this one updates by itself (no refresh needed)
function startLiveSync() {
  if (!cloudUser || !db) return;
  if (unsubLive) unsubLive();
  unsubLive = db.collection("users").doc(cloudUser.uid).onSnapshot((snap) => {
    if (!snap.exists || snap.metadata.hasPendingWrites) return;
    const saved = snap.data();
    if (!saved.updatedAt || saved.updatedAt <= lastSeen) return;   // our own save, or nothing new
    lastSeen = saved.updatedAt;
    clearTimeout(saveTimer);                                       // drop any older unsent change
    loadState(JSON.parse(saved.data || "{}"));
    localStorage.setItem(storeKey, JSON.stringify(getState()));
    render();
    showToast("Updated from your other device.");
  }, () => {});
}
function stopLiveSync() { if (unsubLive) { unsubLive(); unsubLive = null; } }

// Show the username and currency in the sidebar
function applyProfile() {
  currentCurrency = profile.currency || "USD";
  const guest = profile.username === "Guest";
  const handle = /^[a-z0-9_]+$/.test(profile.username) ? "@" : "";
  $("profile-chip").textContent = guest ? "Guest mode (this device only)" : handle + profile.username + " · " + currentCurrency;
  $("account-btn").hidden = !cloudUser;
  $("logout-btn").querySelector("span").textContent = guest ? "Log in / Sign up" : "Log out";
  fillCategories();
}

// Older versions saved each list under its own key
function readLegacy() {
  const get = (key, fallback) => JSON.parse(localStorage.getItem("fintrack-" + key)) || fallback;
  return { transactions: get("transactions", []), budgets: get("budgets", {}), expenseNames: get("expense-names", []),
           accounts: get("accounts", [newCash()]), contacts: get("contacts", []), loans: get("loans", []), transfers: get("transfers", []) };
}

function openGuest() {
  localStorage.setItem("fintrack-mode", "guest");
  cloudUser = null;
  localUser = null;
  storeKey = "fintrack-state-guest";
  const saved = localStorage.getItem(storeKey);
  const state = saved ? JSON.parse(saved) : readLegacy();
  const hasData = !!saved || (state.transactions || []).length > 0 || Object.keys(state.budgets || {}).length > 0 ||
    (state.loans || []).length > 0 || (state.accounts || []).length > 1;
  loadState(state);
  profile = { username: "Guest", country: "United States", currency: "USD" };
  applyProfile();
  $("welcome").hidden = true;
  // A brand-new guest sees the same set-up steps as a new account: budget, bank, cash
  if (!hasData && !localStorage.getItem("fintrack-guest-setup")) { startOnboarding(); return; }
  render();
  showView("dashboard");
}

// Called by Firebase when someone is logged in (after login, sign-up, or a page refresh)
async function openAccount(user) {
  cloudUser = user;
  localUser = null;
  storeKey = "fintrack-state-" + user.uid;
  localStorage.setItem("fintrack-mode", "account");
  if (pendingProfile) {            // brand new account: save it, then run the set-up wizard
    profile = pendingProfile;
    pendingProfile = null;
    loadState({});
    applyProfile();
    await cloudSaveNow();
    startLiveSync();
    $("welcome").hidden = true;
    startOnboarding();
    return;
  }
  try {                            // existing account: pull the saved data from the cloud
    const snap = await db.collection("users").doc(user.uid).get();
    if (snap.exists) {
      const saved = snap.data();
      profile = { username: saved.username, country: saved.country, currency: saved.currency };
      loadState(JSON.parse(saved.data || "{}"));
      lastSeen = saved.updatedAt || 0;
    } else {
      throw new Error("no cloud data");
    }
  } catch (error) {                // offline: use the copy saved in this browser
    profile = { username: user.email.split("@")[0], country: "", currency: "USD" };
    loadState(JSON.parse(localStorage.getItem(storeKey) || "{}"));
    showToast("Could not reach the cloud. Showing the copy saved on this device.");
  }
  applyProfile();
  $("welcome").hidden = true;
  render();
  showView("dashboard");
  startLiveSync();
}

function showWelcome() {
  $("welcome").hidden = false;
  showWelcomePanel("choice");
  const note = cloudReady ? "" : "Accounts are saved on this device only.";
  $("cloud-note").textContent = note;
  $("signup-note").textContent = note;
  lucide.createIcons();
}
function startSession() {
  const mode = localStorage.getItem("fintrack-mode");
  if (auth) {
    auth.onAuthStateChanged((user) => {
      if (user) openAccount(user);
      else if (mode === "guest" || localStorage.getItem("fintrack-mode") === "guest") openGuest();
      else showWelcome();
    });
  } else if (mode === "guest") openGuest();
  else if (mode === "local" && localUsers()[localStorage.getItem("fintrack-local-user")]) openLocal(localStorage.getItem("fintrack-local-user"), false);
  else showWelcome();
}

// Welcome screen buttons: login / signup / guest / back
function showWelcomePanel(name) {
  ["choice", "login", "signup", "forgot"].forEach((p) => { $("welcome-" + p).hidden = p !== name; });
}
document.querySelectorAll("[data-welcome]").forEach((button) => {
  button.addEventListener("click", () => {
    const choice = button.dataset.welcome;
    if (choice === "guest") { openGuest(); return; }
    if (choice === "forgot") {   // carry over an email typed on the log in form
      const typed = $("li-username").value.trim();
      $("fp-email").value = typed.includes("@") ? typed : "";
      $("fp-error").textContent = ""; $("fp-ok").textContent = "";
    }
    showWelcomePanel(choice);
  });
});

$("welcome-signup").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("su-username").value.trim().replace(/\s+/g, " ");
  const email = $("su-email").value.trim().toLowerCase();
  const password = $("su-password").value;
  const country = COUNTRIES.find(([cname]) => cname === $("su-country").value);
  const error = $("su-error");
  if (!cloudReady) {   // device-only accounts keep the simple username rules
    const username = name.toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) { error.textContent = "Name must be 3–20 letters, numbers or underscores."; return; }
    if (password.length < 6) { error.textContent = "Use a password with at least 6 characters."; return; }
    if (!country) { error.textContent = "Choose your country."; return; }
    error.textContent = "";
    localSignup(username, password, country, error);
    return;
  }
  if (!validName(name)) { error.textContent = "Use 2–30 letters, numbers or spaces for your name (\"Guest\" is reserved)."; return; }
  if (!validEmail(email)) { error.textContent = "Enter a valid email address."; return; }
  if (password.length < 6) { error.textContent = "Use a password with at least 6 characters."; return; }
  if (!country) { error.textContent = "Choose your country."; return; }
  error.textContent = "";
  pendingProfile = { username: name, country: country[0], currency: country[1] };
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password); // openAccount() continues from here
    cred.user.sendEmailVerification().catch(() => {});                       // lets you confirm the address is right
  } catch (err) {
    pendingProfile = null;
    error.textContent = authMessage(err, "signup");
  }
});

// Log in with a username (older accounts) or an email
$("welcome-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = $("li-username").value.trim().toLowerCase();
  const error = $("li-error");
  if (id === "" || $("li-password").value === "") { error.textContent = "Enter your username or email, and your password."; return; }
  error.textContent = "";
  if (!cloudReady) { localLogin(id, $("li-password").value, error); return; }
  try {
    await auth.signInWithEmailAndPassword(id.includes("@") ? id : fakeEmail(id), $("li-password").value);
  } catch (err) {
    error.textContent = authMessage(err, "login");
  }
});

// Forgot password: Firebase emails a reset link to the address on the account
$("welcome-forgot").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("fp-email").value.trim().toLowerCase();
  const error = $("fp-error"), ok = $("fp-ok");
  error.textContent = ""; ok.textContent = "";
  if (!cloudReady) { error.textContent = "Reset links need an online account. Accounts saved only on this device cannot be reset."; return; }
  if (!email.includes("@")) {
    error.textContent = "Enter the email on your account. Older accounts made with only a username have no email, so a link cannot be sent. If you remember your password, log in and add an email under Account.";
    return;
  }
  if (!validEmail(email)) { error.textContent = "That email address does not look right."; return; }
  try {
    await auth.sendPasswordResetEmail(email);
  } catch (err) {
    if (err.code !== "auth/user-not-found") { error.textContent = authMessage(err, "forgot"); return; }
  }
  // Same message whether or not the email exists, so nobody can use this form to find out who has an account
  ok.textContent = "If an account uses " + email + ", a reset link is on its way. Check your inbox and spam folder.";
});

$("logout-btn").addEventListener("click", async () => {
  localStorage.removeItem("fintrack-mode");
  if (cloudUser) {
    await cloudSaveNow();
    stopLiveSync();
    cloudUser = null;
    await auth.signOut();
  }
  loadState({});
  $("welcome-login").reset();
  $("welcome-signup").reset();
  $("welcome-forgot").reset();
  $("fp-error").textContent = ""; $("fp-ok").textContent = "";
  showWelcome();
});

// ============================================================
// Account page: change name, email and password (data stays with the account)
// ============================================================
// Older accounts log in with a private pseudo-email (username@fintrack.app) until a real email is added
const isUsernameLogin = () => !!cloudUser && /@fintrack\.app$/i.test(cloudUser.email || "");

async function renderAccount() {
  if (!cloudUser) { showView("dashboard"); return; }
  try { await cloudUser.reload(); } catch (e) {}   // pick up a freshly confirmed email
  const legacy = isUsernameLogin();
  $("acct-name").value = profile.username;
  $("acct-email-now").innerHTML = legacy
    ? "You log in with the username <strong>" + escapeHtml(cloudUser.email.split("@")[0]) + "</strong>. Add an email so you can reset your password if you forget it."
    : "Your login email is <strong>" + escapeHtml(cloudUser.email) + "</strong> " + (cloudUser.emailVerified ? "(confirmed)." : "(not confirmed yet, check your inbox).");
  $("acct-email-label").textContent = legacy ? "Your email" : "New email";
  $("acct-email-btn").textContent = legacy ? "Add email" : "Change email";
  $("acct-resend").hidden = legacy || cloudUser.emailVerified;
  ["acct-name-msg", "acct-email-msg", "acct-pw-msg"].forEach((id) => { $(id).textContent = ""; });
  ["acct-email", "acct-email-pw", "acct-pw-old", "acct-pw-new", "acct-pw-new2"].forEach((id) => { $(id).value = ""; });
}
$("account-btn").addEventListener("click", () => showView("account-page"));

// Firebase asks for the current password before sensitive changes
async function reauth(password) {
  await cloudUser.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(cloudUser.email, password));
}

$("acct-name-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("acct-name").value.trim().replace(/\s+/g, " ");
  if (!validName(name)) { $("acct-name-msg").textContent = "Use 2–30 letters, numbers or spaces. \"Guest\" is reserved."; return; }
  $("acct-name-msg").textContent = "";
  profile.username = name;
  applyProfile();
  renderGreeting();
  cloudSaveNow();
  showToast("Name saved.");
});

$("acct-email-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("acct-email").value.trim().toLowerCase(), password = $("acct-email-pw").value, msg = $("acct-email-msg");
  if (!validEmail(email)) { msg.textContent = "Enter a valid email address."; return; }
  if (email === (cloudUser.email || "").toLowerCase()) { msg.textContent = "That is already your login email."; return; }
  if (!password) { msg.textContent = "Enter your current password to confirm."; return; }
  msg.textContent = "";
  try { await reauth(password); } catch (err) { msg.textContent = authMessage(err, "reauth"); return; }
  try {
    await cloudUser.verifyBeforeUpdateEmail(email);
  } catch (err) { msg.textContent = authMessage(err, "email"); return; }
  $("acct-email-now").textContent = "We sent a confirmation link to " + email + ". Open it, then log in with that email and your password. Until then you can keep using your current login. Check spam if you do not see it.";
  $("acct-email").value = ""; $("acct-email-pw").value = "";
  showToast("Confirmation link sent.");
});

$("acct-resend").addEventListener("click", async () => {
  try { await cloudUser.sendEmailVerification(); showToast("Verification link sent."); }
  catch (err) { $("acct-email-msg").textContent = authMessage(err, "email"); }
});

$("acct-pw-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const old = $("acct-pw-old").value, n1 = $("acct-pw-new").value, n2 = $("acct-pw-new2").value, msg = $("acct-pw-msg");
  if (!old) { msg.textContent = "Enter your current password."; return; }
  if (n1.length < 6) { msg.textContent = "Use a new password with at least 6 characters."; return; }
  if (n1 !== n2) { msg.textContent = "The two new passwords do not match."; return; }
  if (n1 === old) { msg.textContent = "Choose a password different from the current one."; return; }
  msg.textContent = "";
  try { await reauth(old); } catch (err) { msg.textContent = authMessage(err, "reauth"); return; }
  try { await cloudUser.updatePassword(n1); } catch (err) { msg.textContent = authMessage(err, "password"); return; }
  ["acct-pw-old", "acct-pw-new", "acct-pw-new2"].forEach((id) => { $(id).value = ""; });
  showToast("Password updated.");
});

// Reminder on Home for older accounts that still have no email
function updateNudge() {
  const key = cloudUser ? "fintrack-nudge-" + cloudUser.uid : "";
  const snoozed = key && Date.now() - Number(localStorage.getItem(key) || 0) < 3 * 86400000;
  $("email-nudge").hidden = !(isUsernameLogin() && !snoozed);
}
$("nudge-go").addEventListener("click", () => showView("account-page"));
$("nudge-later").addEventListener("click", () => {
  if (cloudUser) localStorage.setItem("fintrack-nudge-" + cloudUser.uid, String(Date.now()));
  updateNudge();
});

// ============================================================
// Greeting with the time in your country
// ============================================================
const COUNTRY_ZONES = {
  "United States": ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix", "America/Anchorage", "Pacific/Honolulu", "America/Detroit", "America/Indiana/Indianapolis", "America/Kentucky/Louisville", "America/Boise", "America/Juneau"],
  "Canada": ["America/Toronto", "America/Vancouver", "America/Edmonton", "America/Winnipeg", "America/Halifax", "America/St_Johns", "America/Regina"],
  "United Kingdom": ["Europe/London"], "Germany": ["Europe/Berlin"], "France": ["Europe/Paris"], "Spain": ["Europe/Madrid", "Atlantic/Canary"],
  "Italy": ["Europe/Rome"], "Netherlands": ["Europe/Amsterdam"], "Ireland": ["Europe/Dublin"], "India": ["Asia/Kolkata"], "Pakistan": ["Asia/Karachi"],
  "Bangladesh": ["Asia/Dhaka"], "Nepal": ["Asia/Kathmandu"], "Sri Lanka": ["Asia/Colombo"], "Nigeria": ["Africa/Lagos"], "Ghana": ["Africa/Accra"],
  "Kenya": ["Africa/Nairobi"], "South Africa": ["Africa/Johannesburg"], "Egypt": ["Africa/Cairo"], "United Arab Emirates": ["Asia/Dubai"],
  "Saudi Arabia": ["Asia/Riyadh"], "Turkey": ["Europe/Istanbul"], "Japan": ["Asia/Tokyo"], "South Korea": ["Asia/Seoul"], "China": ["Asia/Shanghai"],
  "Philippines": ["Asia/Manila"], "Indonesia": ["Asia/Jakarta", "Asia/Pontianak", "Asia/Makassar", "Asia/Jayapura"], "Malaysia": ["Asia/Kuala_Lumpur"],
  "Singapore": ["Asia/Singapore"], "Thailand": ["Asia/Bangkok"], "Vietnam": ["Asia/Ho_Chi_Minh"],
  "Australia": ["Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Perth", "Australia/Adelaide", "Australia/Darwin", "Australia/Hobart"],
  "New Zealand": ["Pacific/Auckland"],
  "Brazil": ["America/Sao_Paulo", "America/Manaus", "America/Fortaleza", "America/Bahia", "America/Recife", "America/Belem", "America/Cuiaba"],
  "Mexico": ["America/Mexico_City", "America/Tijuana", "America/Monterrey", "America/Cancun", "America/Chihuahua", "America/Mazatlan", "America/Hermosillo"],
  "Argentina": ["America/Argentina/Buenos_Aires"], "Colombia": ["America/Bogota"],
};
// A country with one time zone uses it. A country with several uses this device's zone if it is one of them.
function timeZoneFor() {
  const device = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const list = profile && profile.username !== "Guest" ? COUNTRY_ZONES[profile.country] : null;
  if (!list) return device;
  return list.includes(device) ? device : list[0];
}
let greetIcon = "";
function renderGreeting() {
  if (!profile || !$("greeting-text")) return;
  const zone = timeZoneFor(), now = new Date();
  const fmt = (opts) => {
    try { return new Intl.DateTimeFormat("en-US", { ...opts, timeZone: zone }).format(now); }
    catch (e) { return new Intl.DateTimeFormat("en-US", opts).format(now); }
  };
  const hour = Number(fmt({ hour: "numeric", hourCycle: "h23" })) % 24;
  let word = "Good evening", icon = hour >= 21 || hour < 5 ? "moon" : "sunset";
  if (hour >= 5 && hour < 12) { word = "Good morning"; icon = "sunrise"; }
  else if (hour >= 12 && hour < 17) { word = "Good afternoon"; icon = "sun"; }
  const guest = profile.username === "Guest";
  const name = guest ? "" : ", " + profile.username.charAt(0).toUpperCase() + profile.username.slice(1);
  $("greeting-text").textContent = word + name;
  $("greeting-meta").textContent = fmt({ weekday: "short", month: "short", day: "numeric" }) + " · " + fmt({ hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  if (icon !== greetIcon) {
    greetIcon = icon;
    $("greeting-icon").innerHTML = '<i data-lucide="' + icon + '"></i>';
    lucide.createIcons();
  }
}
setInterval(renderGreeting, 30000);

// ============================================================
// Simple accounts saved on this device (no Firebase needed)
// ============================================================
const localUsers = () => JSON.parse(localStorage.getItem("fintrack-local-users")) || {};

// Store a scrambled version of the password, never the password itself
async function hashPassword(password, salt) {
  const bytes = new TextEncoder().encode(salt + password);
  if (window.crypto && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return btoa(salt + password); // weaker fallback if the browser blocks crypto
}

async function localSignup(username, password, country, error) {
  const users = localUsers();
  if (users[username]) { error.textContent = "That username already exists on this device. Choose another or log in."; return; }
  const salt = Math.random().toString(36).slice(2);
  users[username] = { country: country[0], currency: country[1], salt: salt, hash: await hashPassword(password, salt) };
  localStorage.setItem("fintrack-local-users", JSON.stringify(users));
  openLocal(username, true);
}

async function localLogin(username, password, error) {
  const user = localUsers()[username];
  if (!user || (await hashPassword(password, user.salt)) !== user.hash) { error.textContent = "Wrong username or password."; return; }
  openLocal(username, false);
}

// Open an account saved on this device. New accounts start the set-up steps.
function openLocal(username, isNew) {
  const user = localUsers()[username];
  localStorage.setItem("fintrack-mode", "local");
  localStorage.setItem("fintrack-local-user", username);
  cloudUser = null;
  localUser = username;
  storeKey = "fintrack-state-local-" + username;
  profile = { username: username, country: user.country, currency: user.currency };
  loadState(isNew ? {} : JSON.parse(localStorage.getItem(storeKey) || "{}"));
  applyProfile();
  $("welcome").hidden = true;
  if (isNew) { startOnboarding(); return; }
  render();
  showView("dashboard");
}

// ---------- Set-up wizard: budget -> banking -> cash ----------
let obStep = 1;
function startOnboarding() {
  obStep = 1;
  selectedMonth = today().slice(0, 7);
  $("ob-guest-note").hidden = profile.username !== "Guest";
  showObStep();
  $("onboarding").hidden = false;
}
// Close the wizard (finished or skipped) and go to Home
function finishOnboarding(message) {
  if (profile.username === "Guest") localStorage.setItem("fintrack-guest-setup", "done");
  saveData();
  $("onboarding").hidden = true;
  render();
  showView("dashboard");
  showToast(message);
}
$("ob-skip").addEventListener("click", () => finishOnboarding("Set-up skipped. You can add everything later."));
function showObStep() {
  [1, 2, 3].forEach((n) => { $("ob-" + n).hidden = n !== obStep; });
  $("ob-step-label").textContent = "Step " + obStep + " of 3";
  $("ob-bar").style.width = (obStep / 3) * 100 + "%";
  $("ob-back").style.visibility = obStep === 1 ? "hidden" : "visible";
  $("ob-next").textContent = obStep === 3 ? "Finish" : "Next";
  $("ob-error").textContent = "";
  $("ob-budget-list").innerHTML = Object.entries(getPlan()).map(([name, amount]) => `<li><span>${escapeHtml(name)}</span><strong>${formatMoney(amount)}</strong></li>`).join("");
  $("ob-bank-list").innerHTML = accounts.filter((a) => a.kind !== "cash")
    .map((a) => `<li><span>${escapeHtml(a.name)} <small>${a.kind === "credit" ? "credit card, owed" : "checking"}</small></span><strong>${formatMoney(a.balance)}</strong></li>`).join("");
}

$("ob-budget-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("ob-budget-name").value.trim();
  const amount = parseFloat($("ob-budget-amount").value);
  if (name === "" || isNaN(amount) || amount <= 0) { $("ob-error").textContent = "Enter an expense name and an amount above 0."; return; }
  if (!expenseNames.includes(name)) expenseNames.push(name);
  budgets[selectedMonth] = Object.assign(budgets[selectedMonth] || {}, { [name]: round2(amount) });
  saveData(); e.target.reset(); showObStep();
});
$("ob-bank-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("ob-bank-name").value.trim();
  const balance = parseFloat($("ob-bank-balance").value || "0");
  if (name === "" || isNaN(balance) || balance < 0) { $("ob-error").textContent = "Enter an account name and a balance of 0 or more."; return; }
  accounts.push({ id: "a" + Date.now(), kind: "checking", name: name, balance: round2(balance) });
  saveData(); e.target.reset(); showObStep();
});
$("ob-card-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("ob-card-name").value.trim();
  const limit = parseFloat($("ob-card-limit").value);
  const owed = parseFloat($("ob-card-owed").value || "0");
  if (name === "" || isNaN(limit) || limit <= 0 || isNaN(owed) || owed < 0) { $("ob-error").textContent = "Enter a card name, a limit above 0, and the balance owed."; return; }
  accounts.push({ id: "a" + Date.now(), kind: "credit", name: name, limit: round2(limit), balance: round2(owed) });
  saveData(); e.target.reset(); showObStep();
});

$("ob-back").addEventListener("click", () => { obStep--; showObStep(); });
$("ob-next").addEventListener("click", () => {
  const error = $("ob-error");
  if (obStep === 1 && Object.keys(getPlan()).length === 0) { error.textContent = "Add at least one planned expense to continue."; return; }
  if (obStep === 2 && !accounts.some((a) => a.kind === "checking")) { error.textContent = "Add at least one checking account to continue."; return; }
  if (obStep === 3) {
    const cash = parseFloat($("ob-cash").value);
    if (isNaN(cash) || cash < 0) { error.textContent = "Enter how much cash you have (0 if none)."; return; }
    getAccount("cash").balance = round2(cash);
    finishOnboarding(profile.username === "Guest" ? "You're all set!" : "You're all set, " + profile.username + "!");
    return;
  }
  obStep++;
  showObStep();
});

// ============================================================
// Monthly report (everything is worked out from transaction dates)
// ============================================================
const monthKey = (offset) => {   // the month `offset` months away from the selected one
  const [y, m] = selectedMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
};
const transferKind = (id, name) => { const a = id ? getAccount(id) : accounts.find((x) => x.name === name); return a ? a.kind : ""; };

// Income, personal expenses and savings moves for one month
function monthTotals(month) {
  const tx = transactions.filter((t) => t.date.startsWith(month));
  const byCategory = {};
  tx.filter((t) => t.type === "expense").forEach((t) => { byCategory[t.category] = round2((byCategory[t.category] || 0) + t.amount); });
  let saved = 0, withdrawn = 0;
  transfers.filter((t) => t.date.startsWith(month)).forEach((t) => {   // moving money into or out of savings
    const from = transferKind(t.fromId, t.from), to = transferKind(t.toId, t.to);
    if (to === "savings" && from !== "savings") saved += t.amount;
    if (from === "savings" && to !== "savings") withdrawn += t.amount;
  });
  return { income: round2(sum(tx.filter((t) => t.type === "income").map((t) => t.amount))), expenses: round2(sum(Object.values(byCategory))),
    byCategory: byCategory, saved: round2(saved), withdrawn: round2(withdrawn), net: round2(saved - withdrawn) };
}

// Balance at the end of a month = today's balance minus everything that happened after that month
const balanceChange = (a, i) => (a.kind === "credit" ? -i.moneyIn : i.moneyIn);
function closingBalance(a, month) {
  return round2(a.balance - sum(accountActivity(a).filter((i) => i.date > month + "-99").map((i) => balanceChange(a, i))));
}
function openingBalance(a, month) {
  return round2(closingBalance(a, month) - sum(accountActivity(a).filter((i) => i.date.startsWith(month)).map((i) => balanceChange(a, i))));
}

let repCat = null, repBar = null, repLine = null;
function renderReport() {
  const month = selectedMonth, r = monthTotals(month), prev = monthTotals(monthKey(-1));
  const plan = getPlan(), planned = round2(sum(Object.values(plan))), nw = getNetWorth();
  const groupShare = round2(sum(transactions.filter((t) => t.shared && t.date.startsWith(month)).map((t) => t.amount)));
  $("rep-title").textContent = "Report · " + monthName(month);

  // Insights in plain words
  const cats = Object.entries(r.byCategory).sort((a, b) => b[1] - a[1]);
  const notes = [];
  if (cats.length) notes.push(`Highest spending: ${cats[0][0]} (${formatMoney(cats[0][1])}, ${Math.round((cats[0][1] / r.expenses) * 100)}% of your expenses).`);
  const diff = round2(r.net - prev.net);
  notes.push(diff > 0 ? `You saved ${formatMoney(diff)} more than last month.` : diff < 0 ? `You saved ${formatMoney(-diff)} less than last month.` : "You saved the same as last month.");
  if (r.income > 0) notes.push(`You spent ${Math.round((r.expenses / r.income) * 100)}% of your income.`);
  if (planned > 0) notes.push(r.expenses <= planned ? `You stayed within budget with ${formatMoney(planned - r.expenses)} to spare.` : `You went over budget by ${formatMoney(r.expenses - planned)}.`);
  const keepPlan = savingsPlan[month];
  if (keepPlan) notes.push(`Savings kept: ${formatMoney(keepPlan.cash)} in cash and ${formatMoney(keepPlan.bank)} in the bank.`);
  $("rep-insights").innerHTML = notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("");

  const card = (label, value, tone) => `<div class="card"><span class="label">${label}</span><strong class="${tone || ""}">${formatMoney(value)}</strong></div>`;
  $("rep-cards").innerHTML = card("Income", r.income, "income") + card("Personal expenses", r.expenses, "expense")
    + card("Added to savings", r.saved) + card("Taken from savings", r.withdrawn) + card("Net savings", r.net, r.net < 0 ? "expense" : "income")
    + card("My share of group expenses", groupShare) + card("Friends owe me (open)", nw.owedToMe, "income") + card("I owe friends (open)", nw.iOwe, "expense");

  // Budget vs actual and balances
  const names = [...new Set([...Object.keys(plan), ...Object.keys(r.byCategory)])];
  $("rep-cats").innerHTML = names.map((n) => { const s = r.byCategory[n] || 0, p = plan[n] || 0;
    return `<tr><td>${escapeHtml(n)}</td><td class="right">${formatMoney(s)}</td><td class="right">${p ? formatMoney(p) : "—"}</td><td class="right ${p && s > p ? "expense" : ""}">${p ? formatMoney(round2(p - s)) : "—"}</td></tr>`; }).join("")
    || '<tr><td colspan="4" class="empty">No spending or plan yet.</td></tr>';
  $("rep-accts").innerHTML = accounts.map((a) => `<tr><td>${escapeHtml(a.name)}${a.kind === "credit" ? " (owed)" : ""}</td><td class="right">${formatMoney(openingBalance(a, month))}</td><td class="right">${formatMoney(closingBalance(a, month))}</td></tr>`).join("");

  // Charts
  const css = getComputedStyle(document.documentElement), color = (v) => css.getPropertyValue(v).trim();
  Chart.defaults.color = color("--muted");
  const months = [-5, -4, -3, -2, -1, 0].map(monthKey);
  const labels = months.map((m) => new Date(m + "-01T00:00").toLocaleString("en-US", { month: "short" }));
  $("rep-cat-empty").style.display = cats.length ? "none" : "block";
  $("rep-cat").parentElement.style.display = cats.length ? "block" : "none";
  [repCat, repBar, repLine].forEach((c) => c && c.destroy());
  repCat = new Chart($("rep-cat"), { type: "doughnut", data: { labels: cats.map((c) => c[0]), datasets: [{ data: cats.map((c) => c[1]), borderWidth: 0,
    backgroundColor: ["#0f6b5c", "#e8a33d", "#d9503f", "#4a7fd1", "#8e5bb5", "#3cc4a6", "#c9708a", "#7c8a82", "#b5a642", "#2f9fd0", "#a0522d"] }] },
    options: { maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "bottom" } } } });
  const totals = months.map(monthTotals);
  repBar = new Chart($("rep-bar"), { type: "bar", data: { labels: labels, datasets: [
    { label: "Income", data: totals.map((t) => t.income), backgroundColor: color("--income"), borderRadius: 6 },
    { label: "Expenses", data: totals.map((t) => t.expenses), backgroundColor: color("--expense"), borderRadius: 6 }] },
    options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: color("--border") } }, x: { grid: { display: false } } }, plugins: { legend: { position: "bottom" } } } });
  const savingsAccounts = accounts.filter((a) => a.kind === "savings");
  repLine = new Chart($("rep-line"), { type: "line", data: { labels: labels, datasets: [{ label: "Savings balance", borderColor: color("--accent"), tension: 0.3,
    data: months.map((m) => round2(sum(savingsAccounts.map((a) => closingBalance(a, m))))) }] },
    options: { maintainAspectRatio: false, scales: { y: { grid: { color: color("--border") } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } } });
}

// CSV: the month's summary, then every transaction of that month
function downloadCsv() {
  const r = monthTotals(selectedMonth), nw = getNetWorth();
  const safe = (v) => { let s = String(v); if (isNaN(Number(s)) && /^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  const rows = [["FinTrack report", monthName(selectedMonth)], ["Income", r.income], ["Personal expenses", r.expenses], ["Added to savings", r.saved],
    ["Taken from savings", r.withdrawn], ["Net savings", r.net], ["Friends owe me (open)", nw.owedToMe], ["I owe friends (open)", nw.iOwe], []];
  Object.entries(r.byCategory).forEach(([name, amount]) => rows.push(["Category", name, amount]));
  rows.push([], ["Date", "Type", "Category", "Description", "Account", "Amount"]);
  getMonthTransactions().sort((a, b) => a.date.localeCompare(b.date)).forEach((t) => rows.push([t.date, t.type, t.category, t.description, accountName(t.accountId), t.amount]));
  const blob = new Blob(["\ufeff" + rows.map((row) => row.map(safe).join(",")).join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "fintrack-" + selectedMonth + ".csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
$("report-csv").addEventListener("click", downloadCsv);
// PDF: the browser's print window has a "Save as PDF" choice, and the print styles show only the report
$("report-pdf").addEventListener("click", () => {
  const oldTitle = document.title;
  document.title = "FinTrack report " + selectedMonth;
  window.print();
  document.title = oldTitle;
});
["input", "change"].forEach((evt) => ["hist-search", "hist-account", "hist-all"].forEach((id) => $(id).addEventListener(evt, renderTable)));

// ---------- Savings: where this month's leftover is kept ----------
$("save-card").addEventListener("click", () => {
  const t = monthTotals(selectedMonth), saved = Math.max(round2(t.income - t.expenses), 0), keep = savingsPlan[selectedMonth] || {};
  $("save-sub").textContent = monthName(selectedMonth) + ": income " + formatMoney(t.income) + " minus expenses " + formatMoney(t.expenses) + " = " + formatMoney(saved) + " saved.";
  $("save-cash").value = keep.cash === undefined ? "" : keep.cash;
  $("save-bank").value = keep.bank === undefined ? "" : keep.bank;
  $("save-error").textContent = "";
  $("save-dialog").showModal();
});
$("save-card").addEventListener("keydown", (e) => { if (e.key === "Enter") $("save-card").click(); });
$("save-cancel").addEventListener("click", () => $("save-dialog").close());
$("save-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const t = monthTotals(selectedMonth), saved = Math.max(round2(t.income - t.expenses), 0);
  const cash = parseFloat($("save-cash").value || "0"), bank = parseFloat($("save-bank").value || "0");
  if (isNaN(cash) || isNaN(bank) || cash < 0 || bank < 0) { $("save-error").textContent = "Enter amounts of 0 or more."; return; }
  if (round2(cash + bank) > saved + 0.004) { $("save-error").textContent = "You only saved " + formatMoney(saved) + " this month."; return; }
  savingsPlan[selectedMonth] = { cash: round2(cash), bank: round2(bank) };
  saveData();
  $("save-dialog").close();
  render();
  showToast("Savings plan saved");
});
// Quick start buttons on the Add page: "Paid by me" / "Paid by a friend"
document.querySelectorAll("[data-share]").forEach((button) => {
  button.addEventListener("click", () => openLoanDialog("", button.dataset.share));
});

// ---------- 11. Start the app ----------
fillCategories();
$("date").value = today();
applyTheme(localStorage.getItem("fintrack-theme") || "light");
lucide.createIcons();
startSession();

// ---------- Installable app (PWA) ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
