// ============================================================
// FinTrack — Personal Expense Tracker (vanilla JavaScript)
// ============================================================

// ---------- 1. Data ----------
const INCOME_CATEGORIES = ["Salary", "Allowance", "Freelance", "Other"];

let transactions = JSON.parse(localStorage.getItem("fintrack-transactions")) || [];
// One spending plan per month, e.g. { "2026-10": { Rent: 800, Food: 250 } }
let budgets = JSON.parse(localStorage.getItem("fintrack-budgets")) || {};
// Expense names you created (they appear in the Add transaction list)
let expenseNames = JSON.parse(localStorage.getItem("fintrack-expense-names")) || [];
// Keep names from older plans too
Object.values(budgets).forEach((plan) => Object.keys(plan).forEach((n) => { if (!expenseNames.includes(n)) expenseNames.push(n); }));
let currentFilter = "all";
let categoryChart = null;
let monthlyChart = null;

const $ = (id) => document.getElementById(id);
const form = $("transaction-form");

// ---------- 2. Helper functions ----------
function formatMoney(amount) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function saveData() {
  localStorage.setItem("fintrack-transactions", JSON.stringify(transactions));
  localStorage.setItem("fintrack-budgets", JSON.stringify(budgets));
  localStorage.setItem("fintrack-expense-names", JSON.stringify(expenseNames));
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
function showView(name) {
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === name));
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
  window.scrollTo(0, 0);
}
document.querySelectorAll(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
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
  });
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
  localStorage.removeItem("fintrack-expense-names");
  localStorage.removeItem("fintrack-transactions");
  localStorage.removeItem("fintrack-budgets");
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
      <td>${t.date}</td>
      <td class="desc"></td>
      <td>${escapeHtml(t.category)}</td>
      <td><span class="badge ${t.type}">${t.type}</span></td>
      <td class="right ${t.type}">${sign}${formatMoney(t.amount)}</td>
      <td><button class="delete-btn" aria-label="Delete transaction"><i data-lucide="trash-2"></i></button></td>`;
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
  renderSummary();
  renderAlerts();
  renderTable();
  renderBudget();
  renderCharts();
}

// ---------- 11. Start the app ----------
fillCategories();
$("date").value = today();
applyTheme(localStorage.getItem("fintrack-theme") || "light");
render();
lucide.createIcons();
