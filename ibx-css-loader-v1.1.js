/* ibx-css-loader-v1.1.js — loads shared CSS + injects hamburger menu */
(function() {
  if (document.getElementById('ibx-site-css')) return;

  /* ── 1. Load CSS ── */
  var url = 'https://cdn.jsdelivr.net/gh/jbrady74/inbxify-site-code@main/public-site/ibx-site-v1.4.css.html';
  fetch(url)
    .then(function(r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function(html) {
      var wrapper = document.createElement('div');
      wrapper.id = 'ibx-site-css';
      wrapper.innerHTML = html;
      document.head.appendChild(wrapper);
    })
    .catch(function(err) { console.error('[IBX] CSS load error:', err); });

  /* ── 2. Inject hamburger button + mobile nav ── */
  document.addEventListener('DOMContentLoaded', function() {
    var navInner = document.querySelector('.ibx-nav-inner');
    if (!navInner) return;

    // Don't inject twice
    if (navInner.querySelector('.ibx-hamburger')) return;

    // Create hamburger button
    var btn = document.createElement('button');
    btn.className = 'ibx-hamburger';
    btn.setAttribute('aria-label', 'Menu');
    btn.innerHTML = '<span></span><span></span><span></span>';
    navInner.appendChild(btn);

    // Create overlay
    var overlay = document.createElement('div');
    overlay.className = 'ibx-mob-overlay';
    document.body.appendChild(overlay);

    // Toggle
    function toggle() {
      document.body.classList.toggle('ibx-nav-open');
    }
    function close() {
      document.body.classList.remove('ibx-nav-open');
    }

    btn.addEventListener('click', function(e) { e.stopPropagation(); toggle(); });
    overlay.addEventListener('click', close);

    // Close on nav link click
    var links = document.querySelectorAll('.ibx-nav-links a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', close);
    }

    // Close on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') close();
    });
  });
})();
