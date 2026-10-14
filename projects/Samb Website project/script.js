(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Mobile menu
  var btn = $('.menu-btn'), menu = $('#menu');
  btn.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });
  $$('#menu a').forEach(function (a) {
    a.addEventListener('click', function () {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });

  // Highlight current section in nav
  var links = $$('#menu a');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        links.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id); });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  $$('main section[id]').forEach(function (s) { io.observe(s); });

  // Read more
  $$('.more').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = document.getElementById(b.dataset.target);
      var open = p.classList.toggle('open');
      b.textContent = open ? 'Show less' : 'Read more';
    });
  });

  // News / events tabs
  var tabs = $$('.tabs [role=tab]');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (o) {
        var on = o === t;
        o.setAttribute('aria-selected', on);
        document.getElementById(o.getAttribute('aria-controls')).hidden = !on;
      });
    });
  });

  // Program details
  var detail = $('#prog-detail'), progs = $$('.prog');
  progs.forEach(function (p) {
    p.addEventListener('click', function () {
      progs.forEach(function (o) { o.classList.toggle('on', o === p); });
      detail.textContent = p.dataset.name + ': ' + p.dataset.text;
    });
  });

  // Testimonial slider
  var slides = $$('.slide'), dots = $('#dots'), i = 0, timer;
  slides.forEach(function (_, n) {
    var d = document.createElement('button');
    d.setAttribute('aria-label', 'Show testimonial ' + (n + 1));
    d.addEventListener('click', function () { show(n); restart(); });
    dots.appendChild(d);
  });
  function show(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle('on', k === i); });
    $$('button', dots).forEach(function (d, k) { d.classList.toggle('on', k === i); });
  }
  function restart() {
    clearInterval(timer);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timer = setInterval(function () { show(i + 1); }, 7000);
    }
  }
  $('#prev').addEventListener('click', function () { show(i - 1); restart(); });
  $('#next').addEventListener('click', function () { show(i + 1); restart(); });
  show(0); restart();

  // Contact form: validate, then open the visitor's email app addressed to the school
  var form = $('#form'), err = $('#err');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements, name = f.name.value.trim(), email = f.email.value.trim(), msg = f.msg.value.trim();
    if (!name || !email || !msg) { err.textContent = 'Please fill in your name, email and message.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Enter a valid email address, like name@example.com.'; return; }
    err.textContent = '';
    var body = 'Name: ' + name + '\nEmail: ' + email + '\n\n' + msg;
    window.location.href = 'mailto:eyeamkedar@gmail.com?subject=' + encodeURIComponent('Website enquiry from ' + name) + '&body=' + encodeURIComponent(body);
  });

  // Back to top + footer year
  var top = $('#top');
  window.addEventListener('scroll', function () { top.hidden = window.scrollY < 600; }, { passive: true });
  top.addEventListener('click', function () { window.scrollTo({ top: 0 }); });
  $('#yr').textContent = new Date().getFullYear();
})();
