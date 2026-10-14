const $ = (s) => document.querySelector(s);
const exprEl = $("#expr");
const resEl = $("#result");
const keysEl = $(".keys");
const histEl = $("#history");
const histList = $("#h-list");
const histBtn = $("#hist-toggle");
const toastEl = $("#toast");

const OPS = "+-*/";
let expr = "";          // internal form uses ASCII operators: + - * /
let justEval = false;   // true right after "="
let errMsg = "";
let history = [];

// ---------- storage (safe if blocked) ----------
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

// ---------- safe expression parser (no eval) ----------
function calc(src) {
  const t = src.match(/\d*\.?\d+|\d+\.|[-+*/()%]/g) || [];
  if (t.join("") !== src) throw new Error("bad");
  let i = 0;
  const peek = () => t[i];
  const next = () => t[i++];

  function add() {
    let v = mul();
    while (peek() === "+" || peek() === "-") {
      const o = next();
      const r = mul();
      v = o === "+" ? v + r : v - r;
    }
    return v;
  }
  function mul() {
    let v = unary();
    while (peek() === "*" || peek() === "/") {
      const o = next();
      const r = unary();
      v = o === "*" ? v * r : v / r;
    }
    return v;
  }
  function unary() {
    if (peek() === "-") { next(); return -unary(); }
    if (peek() === "+") { next(); return unary(); }
    return percent();
  }
  function percent() {
    let v = primary();
    while (peek() === "%") { next(); v /= 100; }
    return v;
  }
  function primary() {
    const x = next();
    if (x === "(") {
      const v = add();
      if (next() !== ")") throw new Error("bad");
      return v;
    }
    if (x !== undefined && /^[\d.]/.test(x)) return parseFloat(x);
    throw new Error("bad");
  }

  const v = add();
  if (i < t.length) throw new Error("bad");
  return v;
}

// drop trailing operators / open brackets and close any open brackets
function clean(s) {
  let prev;
  do { prev = s; s = s.replace(/[+\-*/.(]$/, ""); } while (s !== prev);
  const open = (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length;
  return s + ")".repeat(Math.max(0, open));
}

// ---------- formatting ----------
const glyph = (s) => s.replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−");

function raw(v) {
  v = parseFloat(v.toPrecision(12));
  return String(Object.is(v, -0) ? 0 : v);
}

function group(str) {
  const m = str.match(/^(-?)(\d*)(\.?\d*)$/);
  if (!m) return str;
  return m[1] + m[2].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + m[3];
}

function fit() {
  resEl.style.fontSize = "";
  let size = parseFloat(getComputedStyle(resEl).fontSize);
  while (resEl.scrollWidth > resEl.clientWidth && size > 18) {
    size -= 2;
    resEl.style.fontSize = size + "px";
  }
}

// ---------- rendering ----------
function render() {
  exprEl.textContent = glyph(expr);
  exprEl.scrollLeft = exprEl.scrollWidth;
  resEl.classList.toggle("err", Boolean(errMsg));

  if (errMsg) {
    resEl.textContent = errMsg;
  } else if (expr === "") {
    resEl.textContent = "0";
  } else if (justEval || /^-?\d*\.?\d*$/.test(expr)) {
    resEl.textContent = group(expr);
  } else {
    try {
      const v = calc(clean(expr));
      if (isFinite(v)) resEl.textContent = group(raw(v));
    } catch { /* keep last valid preview */ }
  }
  fit();
}

// ---------- input ----------
function press(k) {
  if (errMsg) { errMsg = ""; expr = ""; justEval = false; }

  if (k === "AC") { expr = ""; justEval = false; return render(); }
  if (k === "DEL") {
    expr = justEval ? "" : expr.slice(0, -1);
    justEval = false;
    return render();
  }
  if (k === "=") return equals();

  if (justEval && (/\d/.test(k) || k === ".")) expr = ""; // start a new number
  justEval = false;

  const last = expr.slice(-1);
  const prev = expr.slice(-2, -1);

  if (/\d/.test(k)) {
    if (last === ")" || last === "%") expr += "*";
    expr += k;
  } else if (k === ".") {
    const cur = expr.match(/[\d.]*$/)[0];
    if (cur.includes(".")) return;
    if (last === ")" || last === "%") expr += "*";
    expr += cur === "" ? "0." : ".";
  } else if (OPS.includes(k)) {
    if (expr === "" || last === "(") {
      if (k === "-") expr += k;
    } else if (OPS.includes(last)) {
      const atStart = expr.length === 1 || prev === "(";
      if (atStart && (k === "*" || k === "/")) return;
      expr = expr.slice(0, -1) + k;
    } else {
      expr += k;
    }
  } else if (k === "(") {
    if (/[\d)%]/.test(last)) expr += "*";
    expr += "(";
  } else if (k === ")") {
    const open = (expr.match(/\(/g) || []).length - (expr.match(/\)/g) || []).length;
    if (open > 0 && /[\d)%]/.test(last)) expr += ")";
  } else if (k === "%") {
    if (/[\d)%]/.test(last)) expr += "%";
  }
  render();
}

function equals() {
  if (expr === "" || justEval) return;
  try {
    const v = calc(clean(expr));
    if (!isFinite(v)) throw new Error("div");
    const r = raw(v);
    addHistory(expr, r);
    expr = r;
    justEval = true;
  } catch (e) {
    errMsg = e.message === "div" ? "Can't divide by zero" : "Invalid expression";
  }
  render();
}

// ---------- history ----------
function addHistory(e, r) {
  history.unshift({ e, r });
  history = history.slice(0, 30);
  store.set("calc-history", JSON.stringify(history));
  drawHistory();
}

function drawHistory() {
  histList.innerHTML = "";
  if (!history.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No calculations yet";
    histList.appendChild(li);
    return;
  }
  history.forEach((h) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    const s = document.createElement("small");
    const r = document.createElement("b");
    s.textContent = glyph(h.e) + " =";
    r.textContent = group(h.r);
    b.append(s, r);
    b.addEventListener("click", () => {
      expr = h.r;
      justEval = true;
      errMsg = "";
      toggleHistory(false);
      render();
    });
    li.appendChild(b);
    histList.appendChild(li);
  });
}

function toggleHistory(show) {
  histEl.hidden = !show;
  histBtn.setAttribute("aria-expanded", show);
}

// ---------- events ----------
keysEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".key");
  if (!btn) return;
  press(btn.dataset.k);
  if (e.detail) btn.blur(); // mouse/touch: let the keyboard keep working
});

histBtn.addEventListener("click", () => toggleHistory(histEl.hidden));
$("#h-clear").addEventListener("click", () => {
  history = [];
  store.set("calc-history", "[]");
  drawHistory();
});

function toast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 1400);
}

$("#copy").addEventListener("click", async () => {
  const text = resEl.textContent.replace(/,/g, "");
  if (errMsg) return;
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied " + text);
  } catch {
    toast("Copy not available here");
  }
});

function setTheme(t) {
  document.documentElement.dataset.theme = t;
  store.set("calc-theme", t);
}
$("#theme").addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
});

const keyMap = { x: "*", X: "*", Enter: "=", Backspace: "DEL", Escape: "AC", Delete: "AC", ",": "." };
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Enter" && e.target.closest("button")) return; // let a focused button act
  const k = keyMap[e.key] || e.key;
  if (!/^([\d.+\-*/()%=]|DEL|AC)$/.test(k)) return;
  e.preventDefault();
  if (!histEl.hidden) toggleHistory(false);
  press(k);
  const btn = document.querySelector(`.key[data-k="${CSS.escape(k)}"]`);
  if (btn) {
    btn.classList.add("press");
    setTimeout(() => btn.classList.remove("press"), 110);
  }
});

// ---------- init ----------
(function init() {
  const saved = store.get("calc-theme");
  const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(saved || (dark ? "dark" : "light"));
  try { history = JSON.parse(store.get("calc-history") || "[]"); } catch { history = []; }
  drawHistory();
  render();
})();
