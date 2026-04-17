/* ibx-css-loader-v1.7.js — render-blocking CSS + hamburger menu
 * v1.7: Points to ibx-site-v1.10.css (readability fixes + 1640px content cap)
 *       Hamburger injection unchanged from v1.1
 */
(function() {
  if (document.getElementById('ibx-site-css')) return;

  /* ── 1. Inject CSS as render-blocking <link> (not fetch) ── */
  var link = document.createElement('link');
  link.id = 'ibx-site-css';
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/gh/jbrady74/inbxify-site-code@main/public-site/ibx-site-v1.10.css';
  document.head.appendChild(link);

  /* ── 2. Preconnect for Google Fonts (speeds up font fetch) ── */
  var pc1 = document.createElement('link');
  pc1.rel = 'preconnect';
  pc1.href = 'https://fonts.googleapis.com';
  document.head.appendChild(pc1);
  var pc2 = document.createElement('link');
  pc2.rel = 'preconnect';
  pc2.href = 'https://fonts.gstatic.com';
  pc2.crossOrigin = 'anonymous';
  document.head.appendChild(pc2);

  /* ── 3. Inject hamburger button + mobile nav ── */
  document.addEventListener('DOMContentLoaded', function() {
    var navInner = document.querySelector('.ibx-nav-inner');
    if (!navInner) return;
    if (navInner.querySelector('.ibx-hamburger')) return;

    var btn = document.createElement('button');
    btn.className = 'ibx-hamburger';
    btn.setAttribute('aria-label', 'Menu');
    btn.innerHTML = '<span></span><span></span><span></span>';
    navInner.appendChild(btn);

    var overlay = document.createElement('div');
    overlay.className = 'ibx-mob-overlay';
    document.body.appendChild(overlay);

    function toggle() { document.body.classList.toggle('ibx-nav-open'); }
    function close() { document.body.classList.remove('ibx-nav-open'); }

    btn.addEventListener('click', function(e) { e.stopPropagation(); toggle(); });
    overlay.addEventListener('click', close);

    var links = document.querySelectorAll('.ibx-nav-links a');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', close);
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') close();
    });
  });
})();
