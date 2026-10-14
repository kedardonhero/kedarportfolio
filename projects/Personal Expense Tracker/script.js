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
let storeKey = "fintrack-state-guest"; // where this profile is saved in the browser
let currentCurrency = "USD";
let localUser = null;   // username of the account saved on this device (null otherwise)
let cloudUser = null;   // signed-in Firebase user (null in guest mode)
let profile = null;     // { username, country, currency }
let currentFilter = "all";
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
  return { transactions, budgets, expenseNames, accounts, contacts, loans, transfers };
}
function loadState(state) {
  transactions = state.transactions || [];
  budgets = state.budgets || {};
  expenseNames = state.expenseNames || [];
  accounts = state.accounts && state.accounts.length ? state.accounts : [newCash()];
  contacts = state.contacts || [];
  loans = state.loans || [];
  transfers = state.transfers || [];
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
const MONTH_VIEWS = ["dashboard", "history", "budget"]; // pages that depend on the selected month
function showView(name) {
  const parent = { "account-detail": "networth", "contact-detail": "contacts" }[name] || name;
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === name));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === parent));
  document.querySelector(".month-bar").hidden = !MONTH_VIEWS.includes(name);
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
$("prev-month").addEventListener("click", () => changeMonth(-1));
$("next-month").addEventListener("click", () => changeMonth(1));
$("this-month").addEventListener("click", () => { selectedMonth = today().slice(0, 7); render(); });

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

  transactions.push({
    id: Date.now(),
    type: form.elements["type"].value,
    amount: Math.round(amount * 100) / 100,
    category: $("category").value,
    description: description,
    date: date,
    accountId: $("account").value,
  });
  applyEffect(transactions[transactions.length - 1], 1); // update the account balance
  saveData();

  selectedMonth = date.slice(0, 7); // show the month this transaction belongs to
  form.reset();
  fillCategories();
  $("date").value = today();
  render();
  showView("dashboard");            // go back to the home page automatically
  showToast("Transaction saved");
});

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
  $("balance").textContent = formatMoney(balance);
  $("balance").className = balance < 0 ? "expense" : "";
  $("budget-card").textContent = planned > 0 ? formatMoney(planned) : "Not set";
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
  const shown = getMonthTransactions()
    .filter((t) => currentFilter === "all" || t.type === currentFilter)
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
      <td class="actions"><button class="delete-btn" aria-label="Delete transaction"><i data-lucide="trash-2"></i></button></td>`;
    row.querySelector(".desc").textContent = t.description; // textContent keeps typed text safe
    row.querySelector(".delete-btn").addEventListener("click", () => deleteTransaction(t.id));
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
  $("month-label").textContent = monthName(selectedMonth);
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
  return { money, debt, owedToMe, iOwe, total: money - debt + owedToMe - iOwe };
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
  $("nw-note").textContent = `Includes loans: people owe you ${formatMoney(n.owedToMe)}, you owe ${formatMoney(n.iOwe)}`;

  const list = (kind) => accounts.filter((a) => a.kind === kind).map(accountRow).join("") || '<p class="empty">None yet.</p>';
  $("cash-list").innerHTML = list("cash");
  $("checking-list").innerHTML = list("checking");
  $("credit-list").innerHTML = list("credit");
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
const kindText = { "lent": "I paid", "borrowed": "They lent me cash", "paid-for-me": "They paid for me" };
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
  const share = split ? round2(total / 2) : total;                     // the amount that gets owed
  const myExpense = kind === "paid-for-me" ? share : kind === "lent" && split ? round2(total - share) : 0;
  return { kind, total, split, share, myExpense };
}

// Show only the fields that matter, and say in plain words who owes what
function updateLoanForm() {
  const { kind, total, split, share, myExpense } = loanNumbers();
  const name = loanPersonName() || "They";
  $("loan-new-wrap").hidden = $("loan-person").value !== "__new";
  $("loan-split-wrap").hidden = kind === "borrowed";
  $("loan-account-wrap").hidden = kind === "paid-for-me";
  $("loan-account-text").textContent = kind === "borrowed" ? "Money received into (optional)" : "Paid from (optional)";
  $("loan-expense-wrap").hidden = myExpense <= 0;
  $("loan-expense-text").textContent = "Add my share (" + formatMoney(myExpense) + ") to my expenses";
  const half = split ? " (half of " + formatMoney(total) + ")" : "";
  let text = "";
  if (total > 0) {
    if (kind === "lent") text = name + " owes you " + formatMoney(share) + half;
    else if (kind === "paid-for-me") text = "You owe " + name + " " + formatMoney(share) + half;
    else text = "You owe " + name + " " + formatMoney(total);
  }
  $("loan-preview").textContent = text;
}
loanDialog.addEventListener("input", updateLoanForm);
loanDialog.addEventListener("change", updateLoanForm);

function openLoanDialog(contactId) {
  $("loan-form").reset();
  $("loan-error").textContent = "";
  fillAccountSelects();
  $("loan-person").value = contactId || (contacts.length ? "" : "__new");
  updateLoanForm();
  loanDialog.showModal();
}
$("open-loan-dialog").addEventListener("click", () => openLoanDialog(""));
$("loan-cancel").addEventListener("click", () => loanDialog.close());

$("loan-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const error = $("loan-error");
  const { kind, total, split, share, myExpense } = loanNumbers();
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
  loans.push({ id: Date.now(), kind: kind, contactId: contact.id, person: contact.name,
    accountId: account ? account.id : "", payments: [], amount: share, total: total, split: split,
    paid: 0, note: note, date: today() });

  // Optionally count my own part as an expense (it does not touch any account again)
  if (myExpense > 0 && $("loan-expense").checked) {
    transactions.push({ id: Date.now() + 1, type: "expense", amount: myExpense, category: $("loan-category").value,
      description: (note || "Shared expense") + " (with " + contact.name + ")", date: today(), accountId: "" });
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
  return items;
}

function renderAccountDetail() {
  if (!detailTarget) return;
  const single = detailTarget.id ? getAccount(detailTarget.id) : null;
  if (detailTarget.id && !single) { detailTarget = null; return; }
  const kind = single ? single.kind : detailTarget.kind;
  const list = single ? [single] : accounts.filter((a) => a.kind === kind);
  const groupNames = { cash: "cash", checking: "checking accounts", credit: "credit cards" };
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

function authMessage(error) {
  if (error.code === "auth/email-already-in-use") return "That username is already taken. Try another one.";
  if (error.code === "auth/weak-password") return "Use a password with at least 6 characters.";
  if (error.code === "auth/network-request-failed") return "No connection. Check your internet and try again.";
  if (error.code === "auth/too-many-requests") return "Too many attempts. Please wait a moment.";
  if (["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password", "auth/invalid-login-credentials"].includes(error.code)) return "Wrong username or password.";
  return "Something went wrong. Please try again.";
}

// Cloud save: wait 0.8s after the last change, then write one document per user
function scheduleCloudSave() { clearTimeout(saveTimer); saveTimer = setTimeout(cloudSaveNow, 800); }
function cloudSaveNow() {
  if (!cloudUser) return Promise.resolve();
  return db.collection("users").doc(cloudUser.uid).set({
    username: profile.username, country: profile.country, currency: profile.currency,
    data: JSON.stringify(getState()), updatedAt: Date.now(),
  }).catch(() => showToast("Could not sync. Check your connection."));
}

// Show the username and currency in the sidebar
function applyProfile() {
  currentCurrency = profile.currency || "USD";
  const guest = profile.username === "Guest";
  $("profile-chip").textContent = guest ? "Guest mode (this device only)" : "@" + profile.username + " · " + currentCurrency;
  $("transfer-btn").hidden = !localUser;
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
}

function showWelcome() {
  $("welcome").hidden = false;
  showWelcomePanel("choice");
  const note = cloudReady ? "" : "Accounts are saved on this device. Use \"Move to another device\" in the menu to open your data on another phone or computer.";
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
  ["choice", "login", "signup", "restore"].forEach((p) => { $("welcome-" + p).hidden = p !== name; });
}
document.querySelectorAll("[data-welcome]").forEach((button) => {
  button.addEventListener("click", () => {
    const choice = button.dataset.welcome;
    if (choice === "guest") { openGuest(); return; }
    showWelcomePanel(choice);
  });
});

$("welcome-signup").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = $("su-username").value.trim().toLowerCase();
  const password = $("su-password").value;
  const country = COUNTRIES.find(([name]) => name === $("su-country").value);
  const error = $("su-error");
  if (!/^[a-z0-9_]{3,20}$/.test(username)) { error.textContent = "Username must be 3–20 letters, numbers or underscores."; return; }
  if (password.length < 6) { error.textContent = "Use a password with at least 6 characters."; return; }
  if (!country) { error.textContent = "Choose your country."; return; }
  error.textContent = "";
  if (!cloudReady) { localSignup(username, password, country, error); return; }
  pendingProfile = { username: username, country: country[0], currency: country[1] };
  try {
    await auth.createUserWithEmailAndPassword(fakeEmail(username), password); // openAccount() continues from here
  } catch (err) {
    pendingProfile = null;
    error.textContent = authMessage(err);
  }
});

$("welcome-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = $("li-username").value.trim().toLowerCase();
  const error = $("li-error");
  if (username === "" || $("li-password").value === "") { error.textContent = "Enter your username and password."; return; }
  error.textContent = "";
  if (!cloudReady) { localLogin(username, $("li-password").value, error); return; }
  try {
    await auth.signInWithEmailAndPassword(fakeEmail(username), $("li-password").value);
  } catch (err) {
    error.textContent = authMessage(err);
  }
});

$("logout-btn").addEventListener("click", async () => {
  localStorage.removeItem("fintrack-mode");
  if (cloudUser) {
    await cloudSaveNow();
    cloudUser = null;
    await auth.signOut();
  }
  loadState({});
  $("welcome-login").reset();
  $("welcome-signup").reset();
  showWelcome();
});

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

// ---------- Move data to another device with a transfer code ----------
// The code is the account and all its data turned into one block of text
function makeTransferCode() {
  const json = JSON.stringify({ v: 1, username: localUser, user: localUsers()[localUser], state: getState() });
  return btoa(unescape(encodeURIComponent(json)));
}
$("transfer-btn").addEventListener("click", () => {
  $("transfer-code").value = makeTransferCode();
  $("transfer-dialog").showModal();
});
$("transfer-close").addEventListener("click", () => $("transfer-dialog").close());
$("transfer-copy").addEventListener("click", async () => {
  $("transfer-code").select();
  try { await navigator.clipboard.writeText($("transfer-code").value); }
  catch (error) { document.execCommand("copy"); }
  showToast("Code copied");
});

$("welcome-restore").addEventListener("submit", (e) => {
  e.preventDefault();
  const error = $("rs-error");
  let data = null;
  try { data = JSON.parse(decodeURIComponent(escape(atob($("rs-code").value.trim())))); } catch (err) { data = null; }
  if (!data || data.v !== 1 || !/^[a-z0-9_]{3,20}$/.test(data.username) || !data.user || !data.state) {
    error.textContent = "That code doesn't look right. Copy the whole code again.";
    return;
  }
  const users = localUsers();
  if (users[data.username] && !confirm("An account named " + data.username + " already exists on this device. Replace it with this data?")) return;
  users[data.username] = data.user;
  localStorage.setItem("fintrack-local-users", JSON.stringify(users));
  localStorage.setItem("fintrack-state-local-" + data.username, JSON.stringify(data.state));
  error.textContent = "";
  e.target.reset();
  openLocal(data.username, false);
  showToast("Data restored. Welcome back, " + data.username + "!");
});

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

// ---------- 11. Start the app ----------
fillCategories();
$("date").value = today();
applyTheme(localStorage.getItem("fintrack-theme") || "light");
lucide.createIcons();
startSession();
