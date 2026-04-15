// ibx-page-loader-v1.0.js
// INBXIFY Public Site — Page Loader
// Fetches page HTML from jsDelivr CDN and injects into mount point
// Usage: <div id="ibx-page" data-page="home"></div>
//        <script src="...ibx-page-loader-v1.0.js?v=1.0"></script>
//
// The data-page attribute maps to: page-{value}-v1.0.html on GitHub
// CSS is loaded once from ibx-site-v1.0.css.html

(function() {
  var BASE = 'https://cdn.jsdelivr.net/gh/jbrady74/inbxify-site-code@main/public-site/';
  var CSS_VER = '1.0';
  var PAGE_VER = '1.0';

  var mount = document.getElementById('ibx-page');
  if (!mount) { console.error('[IBX] No #ibx-page mount found'); return; }

  var page = mount.getAttribute('data-page');
  if (!page) { console.error('[IBX] No data-page attribute on #ibx-page'); return; }

  // Load shared CSS if not already loaded
  if (!document.getElementById('ibx-site-css')) {
    var cssUrl = BASE + 'ibx-site-v' + CSS_VER + '.css.html';
    fetch(cssUrl)
      .then(function(r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function(html) {
        var wrapper = document.createElement('div');
        wrapper.id = 'ibx-site-css';
        wrapper.innerHTML = html;
        document.head.appendChild(wrapper);
        loadPage();
      })
      .catch(function(err) { console.error('[IBX] CSS load error:', err); loadPage(); });
  } else {
    loadPage();
  }

  function loadPage() {
    var pageUrl = BASE + 'page-' + page + '-v' + PAGE_VER + '.html';
    fetch(pageUrl)
      .then(function(r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function(html) {
        mount.innerHTML = html;
        console.log('[IBX] Page loaded: ' + page);
      })
      .catch(function(err) {
        console.error('[IBX] Page load error:', err);
        mount.innerHTML = '<div style="padding:80px 32px;text-align:center;font-family:DM Sans,sans-serif;color:#8a8a7a;">Page loading error. Please refresh.</div>';
      });
  }
})();
