// ============================================================
// FinTrack — Personal Expense Tracker (vanilla JavaScript)
// ============================================================

// ---------- 1. App data (loaded from localStorage) ----------
let transactions = JSON.parse(localStorage.getItem("fintrack-transactions")) || [];
let monthlyBudget = Number(localStorage.getItem("fintrack-budget")) || 0;
let currentFilter = "all";
let categoryChart = null;
let monthlyChart = null;

// ---------- 2. Page elements we need to use ----------
const $ = (id) => document.getElementById(id);
const form = $("transaction-form");

// ---------- 3. Helper functions ----------

// Turn a number into money text like "$1,234.50"
function formatMoney(amount) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// Save everything to the browser so it survives a refresh
function saveData() {
  localStorage.setItem("fintrack-transactions", JSON.stringify(transactions));
  localStorage.setItem("fintrack-budget", String(monthlyBudget));
}

// Show a small message in the corner for 2.5 seconds
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// Today's date as YYYY-MM-DD (used as the default in the form)
function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- 4. Sidebar navigation ----------
document.querySelectorAll(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    button.classList.add("active");
    $(button.dataset.view).classList.add("active");
  });
});

// ---------- 5. Adding a transaction ----------
form.addEventListener("submit", (event) => {
  event.preventDefault(); // stop the page from reloading

  const amount = parseFloat($("amount").value);
  const description = $("description").value.trim();
  const date = $("date").value;
  const type = form.elements["type"].value;
  const errorBox = $("form-error");

  // Validation: make sure the inputs make sense
  if (isNaN(amount) || amount <= 0) {
    errorBox.textContent = "Enter an amount greater than 0.";
    return;
  }
  if (description === "") {
    errorBox.textContent = "Enter a short description.";
    return;
  }
  if (date === "") {
    errorBox.textContent = "Choose a date.";
    return;
  }
  errorBox.textContent = "";

  transactions.push({
    id: Date.now(), // a unique number for each transaction
    type: type,
    amount: Math.round(amount * 100) / 100,
    category: $("category").value,
    description: description,
    date: date,
  });

  saveData();
  render();
  form.reset();
  $("date").value = today();
  showToast("Transaction saved");
});

// ---------- 6. Deleting a transaction ----------
function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;
  transactions = transactions.filter((t) => t.id !== id);
  saveData();
  render();
  showToast("Transaction deleted");
}

// ---------- 7. Filter buttons (All / Income / Expenses) ----------
document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderTable();
  });
});

// ---------- 8. Budget ----------
$("save-budget").addEventListener("click", () => {
  const value = parseFloat($("budget-input").value);
  if (isNaN(value) || value <= 0) {
    $("budget-error").textContent = "Enter a budget greater than 0.";
    return;
  }
  $("budget-error").textContent = "";
  monthlyBudget = value;
  saveData();
  render();
  showToast("Budget saved");
});

// Add up expenses that happened in the current month
function getSpentThisMonth() {
  const thisMonth = today().slice(0, 7); // "2026-10"
  return transactions
    .filter((t) => t.type === "expense" && t.date.startsWith(thisMonth))
    .reduce((sum, t) => sum + t.amount, 0);
}

// ---------- 9. Clear all data ----------
$("clear-all").addEventListener("click", () => {
  if (!confirm("This will delete ALL transactions and your budget. Continue?")) return;
  transactions = [];
  monthlyBudget = 0;
  $("budget-input").value = "";
  localStorage.removeItem("fintrack-transactions");
  localStorage.removeItem("fintrack-budget");
  render();
  showToast("All data cleared");
});

// ---------- 10. Dark / light mode ----------
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("fintrack-theme", theme);
  $("theme-toggle").querySelector("span").textContent = theme === "dark" ? "Light mode" : "Dark mode";
  $("theme-toggle").querySelector("i, svg").outerHTML = `<i data-lucide="${theme === "dark" ? "sun" : "moon"}"></i>`;
  lucide.createIcons();
  // Chart text colour depends on the theme, so redraw the charts
  if (categoryChart) renderCharts();
}
$("theme-toggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

// ---------- 11. Drawing the page ----------

// Dashboard summary cards
function renderSummary() {
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  $("total-income").textContent = formatMoney(income);
  $("total-expenses").textContent = formatMoney(expenses);
  $("balance").textContent = formatMoney(balance);
  $("balance").className = balance < 0 ? "expense" : "";
  $("budget-card").textContent = monthlyBudget > 0 ? formatMoney(monthlyBudget) : "Not set";
}

// Transaction history table
function renderTable() {
  const body = $("transaction-body");
  body.innerHTML = "";

  // Filter, then show newest first
  const shown = transactions
    .filter((t) => currentFilter === "all" || t.type === currentFilter)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  $("history-empty").style.display = shown.length === 0 ? "block" : "none";

  shown.forEach((t) => {
    const row = document.createElement("tr");
    const sign = t.type === "income" ? "+" : "−";
    // textContent is used for the description so typed text can't inject HTML
    row.innerHTML = `
      <td>${t.date}</td>
      <td class="desc"></td>
      <td>${t.category}</td>
      <td><span class="badge ${t.type}">${t.type}</span></td>
      <td class="right ${t.type}">${sign}${formatMoney(t.amount)}</td>
      <td><button class="delete-btn" aria-label="Delete transaction"><i data-lucide="trash-2"></i></button></td>`;
    row.querySelector(".desc").textContent = t.description;
    row.querySelector(".delete-btn").addEventListener("click", () => deleteTransaction(t.id));
    body.appendChild(row);
  });
  lucide.createIcons();
}

// Budget progress bar and warning
function renderBudget() {
  const spent = getSpentThisMonth();
  $("spent").textContent = formatMoney(spent);

  const bar = $("progress-bar");
  const message = $("budget-message");

  if (monthlyBudget <= 0) {
    $("remaining").textContent = "—";
    bar.style.width = "0%";
    bar.classList.remove("over");
    message.className = "budget-message";
    message.textContent = "Set a budget to start tracking.";
    return;
  }

  const remaining = monthlyBudget - spent;
  const percent = Math.min((spent / monthlyBudget) * 100, 100);
  $("remaining").textContent = formatMoney(remaining);
  bar.style.width = percent + "%";

  if (spent > monthlyBudget) {
    bar.classList.add("over");
    message.className = "budget-message over";
    message.textContent = `Warning: you are ${formatMoney(spent - monthlyBudget)} over budget this month.`;
  } else {
    bar.classList.remove("over");
    message.className = "budget-message";
    message.textContent = `You have used ${Math.round(percent)}% of your budget.`;
  }
}

// Both charts (they are destroyed and rebuilt so they always match the data)
function renderCharts() {
  const textColor = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim();
  const gridColor = getComputedStyle(document.documentElement).getPropertyValue("--border").trim();
  const incomeColor = getComputedStyle(document.documentElement).getPropertyValue("--income").trim();
  const expenseColor = getComputedStyle(document.documentElement).getPropertyValue("--expense").trim();
  Chart.defaults.color = textColor;
  Chart.defaults.font.family = "Manrope, sans-serif";

  // --- Doughnut: expenses by category ---
  const totalsByCategory = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      totalsByCategory[t.category] = (totalsByCategory[t.category] || 0) + t.amount;
    });

  const hasExpenses = Object.keys(totalsByCategory).length > 0;
  $("category-empty").style.display = hasExpenses ? "none" : "block";
  $("category-chart").parentElement.style.display = hasExpenses ? "block" : "none";

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart($("category-chart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(totalsByCategory),
      datasets: [{
        data: Object.values(totalsByCategory),
        backgroundColor: ["#0f6b5c", "#e8a33d", "#d9503f", "#4a7fd1", "#8e5bb5", "#3cc4a6", "#c9708a", "#7c8a82", "#b5a642"],
        borderWidth: 0,
      }],
    },
    options: { maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "bottom" } } },
  });

  // --- Bar chart: income vs expenses for the last 6 months ---
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  }
  const sumFor = (month, type) =>
    transactions
      .filter((t) => t.type === type && t.date.startsWith(month))
      .reduce((sum, t) => sum + t.amount, 0);

  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart($("monthly-chart"), {
    type: "bar",
    data: {
      labels: months.map((m) => new Date(m + "-01T00:00").toLocaleString("en-US", { month: "short" })),
      datasets: [
        { label: "Income", data: months.map((m) => sumFor(m, "income")), backgroundColor: incomeColor, borderRadius: 6 },
        { label: "Expenses", data: months.map((m) => sumFor(m, "expense")), backgroundColor: expenseColor, borderRadius: 6 },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, grid: { color: gridColor } }, x: { grid: { display: false } } },
      plugins: { legend: { position: "bottom" } },
    },
  });
}

// Redraw everything — called whenever data changes
function render() {
  renderSummary();
  renderTable();
  renderBudget();
  renderCharts();
}

// ---------- 12. Start the app ----------
$("date").value = today();
if (monthlyBudget > 0) $("budget-input").value = monthlyBudget;
applyTheme(localStorage.getItem("fintrack-theme") || "light");
render();
lucide.createIcons();
