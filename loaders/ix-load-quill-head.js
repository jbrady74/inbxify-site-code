// loaders/ix-load-quill-head.js
// STUB (tools/build-loaders.mjs v1.1.0). Never edited and never changes: the real list is ix-load-quill-head.list.js.
// On main it reads the list from GitHub Pages (no CDN purge needed); if Pages does not answer, from jsDelivr.
// On a preview branch it reads that branch's list on jsDelivr.
(function () {
  var L = window.IxLoad, id = "quill:head", st = L && L.slots[id];
  if (!st || st.ran || st.chain) return;
  var n = "ix-load-quill-head.list.js", t = Math.floor(Date.now() / 60000);
  var cdn = st.base + 'loaders/' + n + '?t=' + (L.preview ? Date.now() : t);
  var urls = L.preview ? [cdn] : ["https://jbrady74.github.io/inbxify-site-code/" + n + '?t=' + t, cdn];
  st.chain = urls; st.via = null;
  var write = !st.late && document.readyState === 'loading';
  if (!L.check.ixHold) {           // each loader tag resets IxLoad.check, so wrap it again every time
    L.__chk = L.check;
    L.check = function (w, u) { var x = L.slots[w]; if (x && x.chain && !x.chainDone) return; L.__chk(w, u); };
    L.check.ixHold = true;
  }
  function done(ok, u) { st.chainDone = true; if (ok) L.__chk(id, u); else L.fail(id, u); }
  var key = '__' + id.replace(':', '_');
  L[key + '_next'] = next;
  L[key + '_ok'] = function (u) { st.via = u; };
  L[key + '_end'] = function () { st.chainDone = true; };
  function next(i) {
    var u = urls[i];
    if (!u) { done(false, urls[urls.length - 1]); return; }
    if (i > 0) console.warn('[ix-load] ' + id + ': list not at ' + urls[i - 1] + '; trying ' + u);
    if (write) {
      document.write('<script src="' + u.replace(/"/g, '&quot;') + '" onload="IxLoad.' + key + '_ok(this.src)" onerror="IxLoad.' + key +
        '_next(' + (i + 1) + ')"></' + 'script>' + (i === 0 ? '<script>IxLoad.' + key + '_end()</' + 'script>' : ''));
    } else {
      var el = document.createElement('script');
      el.src = u; el.async = false;
      el.onload = function () { st.via = u; done(true, u); };
      el.onerror = function () { next(i + 1); };
      (document.head || document.documentElement).appendChild(el);
    }
  }
  next(0);
})();
