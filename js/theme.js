/* Shared theme engine for sub-pages. Uses the same storage key as the home page,
   so light/dark mode and accent colour carry over between pages. */
(function () {
  var root = document.documentElement, KEY = "kns-theme";
  var st = { mode: "auto", accent: "#0078ff" };
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  try {
    var s = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (/^(light|dark|auto)$/.test(s.mode)) st.mode = s.mode;
    if (/^#[0-9a-f]{6}$/i.test(s.accent)) st.accent = s.accent;
  } catch (e) {}
  function rgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function lum(c) {
    var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function resolved() { return st.mode === "auto" ? (mq.matches ? "dark" : "light") : st.mode; }
  function apply() {
    var c = rgb(st.accent), theme = resolved();
    root.setAttribute("data-bs-theme", theme);
    root.style.setProperty("--accent", st.accent);
    root.style.setProperty("--accent-rgb", c.join(" "));
    root.style.setProperty("--on-accent", lum(c) > 0.3 ? "#10131a" : "#ffffff");
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", theme === "dark" ? "#0b0e14" : "#f7f8fb");
  }
  function sync() {
    var b = document.getElementById("themeToggle");
    if (!b) return;
    var d = resolved() === "dark";
    b.querySelector("i").className = "bi " + (d ? "bi-sun-fill" : "bi-moon-stars-fill");
    b.setAttribute("aria-label", d ? "Switch to light theme" : "Switch to dark theme");
  }
  apply();
  if (mq.addEventListener) mq.addEventListener("change", function () { if (st.mode === "auto") { apply(); sync(); } });
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.getElementById("themeToggle");
    if (b) b.addEventListener("click", function () {
      st.mode = resolved() === "dark" ? "light" : "dark";
      apply();
      try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
      sync();
    });
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
    sync();
  });
})();
