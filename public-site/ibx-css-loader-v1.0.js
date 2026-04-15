(function() {
  if (document.getElementById('ibx-site-css')) return;
  var url = 'https://cdn.jsdelivr.net/gh/jbrady74/inbxify-site-code@main/public-site/ibx-site-v1.3.css.html';
  fetch(url)
    .then(function(r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function(html) {
      var wrapper = document.createElement('div');
      wrapper.id = 'ibx-site-css';
      wrapper.innerHTML = html;
      document.head.appendChild(wrapper);
    })
    .catch(function(err) { console.error('[IBX] CSS load error:', err); });
})();
