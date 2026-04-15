(function() {
  var BASE = 'https://cdn.jsdelivr.net/gh/jbrady74/inbxify-site-code@main/public-site/';
  var CSS_VER = '1.2';
  var PAGE_VER = '1.0';

  var mount = document.getElementById('ibx-page');
  if (!mount) { console.error('[IBX] No #ibx-page mount found'); return; }

  var page = mount.getAttribute('data-page');
  if (!page) { console.error('[IBX] No data-page attribute on #ibx-page'); return; }

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
        var scripts = mount.querySelectorAll('script');
        scripts.forEach(function(s) {
          var ns = document.createElement('script');
          ns.textContent = s.textContent;
          s.parentNode.replaceChild(ns, s);
        });
      })
      .catch(function(err) {
        console.error('[IBX] Page load error:', err);
        mount.innerHTML = '<div style="padding:80px 32px;text-align:center;font-family:DM Sans,sans-serif;color:#8a8a7a;">Page loading error. Please refresh.</div>';
      });
  }
})();
