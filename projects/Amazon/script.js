const products = [
  { id: 1, name: "Deals in PCs", cat: "pc", price: 649.99, img: "box1.jpg" },
  { id: 2, name: "Home décor under $50", cat: "home", price: 39.99, img: "box2.jpg" },
  { id: 3, name: "Toys under $25", cat: "toys", price: 19.99, img: "box3.jpg" },
  { id: 4, name: "Activity trackers and smartwatches", cat: "wearables", price: 129.0, img: "box4.jpg" },
  { id: 5, name: "Player's paradise starts here", cat: "gaming", price: 59.99, img: "box5.jpg" },
  { id: 6, name: "A whole new way to work", cat: "office", price: 89.5, img: "box6.jpg" },
  { id: 7, name: "Laptops for every need", cat: "pc", price: 799.0, img: "box7.jpg" },
  { id: 8, name: "Upgrade your office furniture", cat: "office", price: 249.0, img: "box8.jpg" },
];
const slides = [
  { t: "Shop deals in Electronics", cat: "pc" },
  { t: "Gaming gear for every player", cat: "gaming" },
  { t: "Make your workspace yours", cat: "office" },
];

const $ = (s) => document.querySelector(s);
const money = (n) => "$" + n.toFixed(2);
let cart = JSON.parse(localStorage.getItem("cart") || "{}");
let category = "all", query = "", slide = 0;

/* PRODUCTS + SEARCH */
function renderProducts() {
  const q = query.trim().toLowerCase();
  const list = products.filter(
    (p) => (category === "all" || p.cat === category) && p.name.toLowerCase().includes(q)
  );
  $("#shop").innerHTML = list.map((p) => `
    <article class="box"><div class="box-content">
      <h2>${p.name}</h2>
      <div class="box-img" style="background-image:url('${p.img}')"></div>
      <p class="price">${money(p.price)}</p>
      <div class="box-actions">
        <a href="#shop" class="see-more" data-cat="${p.cat}">See more</a>
        <button class="add-btn" data-add="${p.id}">Add to Cart</button>
      </div></div></article>`).join("");
  $("#noResults").hidden = list.length > 0;
}
$("#searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  query = $("#searchInput").value;
  category = $("#searchCategory").value;
  renderProducts();
  $("#shop").scrollIntoView();
});
$("#searchCategory").addEventListener("change", (e) => { category = e.target.value; renderProducts(); });

function setCategory(cat) {
  category = cat; query = ""; $("#searchInput").value = ""; $("#searchCategory").value = cat;
  renderProducts();
}
document.addEventListener("click", (e) => {
  const c = e.target.closest("[data-cat]");
  if (c) { setCategory(c.dataset.cat); closeAll(); }
  const a = e.target.closest("[data-add]");
  if (a) addToCart(+a.dataset.add);
});

/* CART */
function saveCart() { localStorage.setItem("cart", JSON.stringify(cart)); renderCart(); }
function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1; saveCart();
  toast(products.find((p) => p.id === id).name + " added to cart");
}
function renderCart() {
  const ids = Object.keys(cart);
  const count = ids.reduce((s, id) => s + cart[id], 0);
  const total = ids.reduce((s, id) => s + cart[id] * products.find((p) => p.id == id).price, 0);
  $("#cartCount").textContent = count;
  $("#cartTotal").textContent = money(total);
  $("#cartItems").innerHTML = ids.length ? ids.map((id) => {
    const p = products.find((x) => x.id == id);
    return `<div class="cart-row"><div class="cart-thumb" style="background-image:url('${p.img}')"></div>
      <div class="cart-info"><div>${p.name}</div><strong>${money(p.price)}</strong><br>
      <span class="qty"><button data-dec="${id}" aria-label="Decrease">−</button><span>${cart[id]}</span><button data-inc="${id}" aria-label="Increase">+</button></span></div>
      <button data-del="${id}" aria-label="Remove"><i class="fa-solid fa-trash"></i></button></div>`;
  }).join("") : '<p class="cart-empty">Your cart is empty. Add something from the deals.</p>';
}
$("#cartItems").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  const { inc, dec, del } = b.dataset;
  if (inc) cart[inc]++;
  if (dec && --cart[dec] <= 0) delete cart[dec];
  if (del) delete cart[del];
  saveCart();
});
$("#clearCart").addEventListener("click", () => { cart = {}; saveCart(); });
$("#checkoutBtn").addEventListener("click", () => {
  if (!Object.keys(cart).length) return toast("Your cart is empty");
  cart = {}; saveCart(); closeAll(); toast("Order placed! (demo only)");
});

/* PANELS */
const overlay = $("#overlay");
function openEl(el) { closeAll(); el.classList.add("open"); el.setAttribute("aria-hidden", "false"); if (el.id !== "signinModal") overlay.classList.add("show"); }
function closeAll() {
  document.querySelectorAll(".open").forEach((el) => { el.classList.remove("open"); el.setAttribute("aria-hidden", "true"); });
  overlay.classList.remove("show");
}
$("#menuBtn").onclick = $("#panelAll").onclick = () => openEl($("#sidebar"));
$("#cartBtn").onclick = () => openEl($("#cartDrawer"));
$("#signinBtn").onclick = () => { openEl($("#signinModal")); $("#nameInput").focus(); };
overlay.onclick = closeAll;
document.querySelectorAll("[data-close]").forEach((b) => (b.onclick = closeAll));
$("#signinModal").addEventListener("click", (e) => { if (e.target.id === "signinModal") closeAll(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });

/* SIGN IN */
function showUser(n) { $("#userName").textContent = n || "sign in"; }
$("#signinForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const n = $("#nameInput").value.trim();
  localStorage.setItem("user", n); showUser(n); closeAll(); toast("Welcome, " + n + "!");
});
$("#deliverTo").onclick = () => {
  const c = prompt("Deliver to which country?", $("#deliverTo").textContent);
  if (c && c.trim()) $("#deliverTo").textContent = c.trim();
};

/* HERO SLIDER */
function showSlide(i) {
  slide = (i + slides.length) % slides.length;
  $("#heroText").innerHTML = `<h1>${slides[slide].t}</h1><a href="#shop" data-cat="${slides[slide].cat}">Shop now</a>`;
}
$("#heroPrev").onclick = () => showSlide(slide - 1);
$("#heroNext").onclick = () => showSlide(slide + 1);
setInterval(() => showSlide(slide + 1), 6000);

/* MISC */
let t;
function toast(msg) {
  const el = $("#toast"); el.textContent = msg; el.classList.add("show");
  clearTimeout(t); t = setTimeout(() => el.classList.remove("show"), 2200);
}
$("#backTop").addEventListener("click", (e) => { e.preventDefault(); scrollTo({ top: 0 }); });

showUser(localStorage.getItem("user"));
renderProducts(); renderCart(); showSlide(0);
