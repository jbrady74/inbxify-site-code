/**
 * ta-adgen-v0.1.0.js
 * INBXIFY — Ad GENERATOR (from scratch)
 *
 * Sibling to ta-adreformat. Where the Reformatter starts from an
 * existing ad, the Generator starts from a BLANK 700x235 canvas and
 * builds an ad up from a brand kit: drop a logo, read/pick brand
 * colors + fonts, add text/CTA elements, then compose + save via the
 * same MEDIA (Scenario B) + AD (Scenario 104) chain.
 *
 * Mounts into #std-adgen-mount when ta-studio (v1.4.8+) dispatches
 * std:panel:adgen (the new "Generate" tab).
 *
 * v0.1.0 — SHELL: mount + blank canvas + logo drop-zone (Uploadcare)
 *   + Add text + a starting toolbar. Compose/download/save reuse the
 *   proven patterns; deeper wiring (advertiser save, brand-kit persist
 *   to Customer record) follows once the shell is confirmed on-page.
 *
 * NOTE: this is intentionally lean — it does NOT yet duplicate the full
 * reformatter editor. It stands up the Generate surface so it's real
 * and mountable; feature parity is added deliberately, not all at once.
 */
(function () {
  'use strict';

  var VERSION = '0.1.0';
  var BANNER_W = 700, BANNER_H = 235;

  function CFG() { return window.TA_CONFIG || {}; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }

  var S = { mounted: false, el: null, layers: [], selected: -1, logo: null };

  // ── Styles (scoped ix-adg-*) ──
  var CSS = [
    '.ix-adg{font-family:"DM Sans",sans-serif;color:#1c2321;}',
    '.ix-adg-head{margin:4px 0 12px;}',
    '.ix-adg-title{font:700 20px/1.2 "Fraunces",serif;color:#1A3A3A;margin:0;}',
    '.ix-adg-sub{font:400 12px/1.4 "DM Sans",sans-serif;color:#6b6f63;margin:2px 0 0;}',
    '.ix-adg-bar{display:flex;gap:8px;align-items:center;margin:8px 0;flex-wrap:wrap;}',
    '.ix-adg-btn{font:600 12px/1 "DM Sans",sans-serif;padding:8px 12px;border:1px solid #c9c3b2;border-radius:6px;background:#fff !important;color:#1A3A3A;cursor:pointer;}',
    '.ix-adg-btn:hover{border-color:#5B7FFF;color:#5B7FFF;}',
    '.ix-adg-btn--primary{background:#5B7FFF !important;color:#fff;border-color:#5B7FFF;}',
    '.ix-adg-stage-wrap{max-width:700px;width:100%;}',
    '.ix-adg-stage{position:relative;width:100%;border:1px solid #c9c3b2;border-radius:4px;overflow:hidden;background-color:#ffffff;}',
    '.ix-adg-layer{position:absolute;box-sizing:border-box;cursor:grab;border:1px solid transparent;}',
    '.ix-adg-layer.sel{border:1.5px dashed #5B7FFF;}',
    '.ix-adg-handle{position:absolute;right:-6px;bottom:-6px;width:12px;height:12px;background-color:#5B7FFF !important;border:2px solid #fff;border-radius:2px;cursor:nwse-resize;display:none;}',
    '.ix-adg-layer.sel .ix-adg-handle{display:block;}',
    '.ix-adg-txt{background-color:transparent !important;}',
    '.ix-adg-drop{flex:0 0 220px;border:2px dashed #c9c3b2;border-radius:8px;background:#fff !important;display:flex;align-items:center;justify-content:center;min-height:64px;cursor:pointer;text-align:center;}',
    '.ix-adg-drop.over{border-color:#5B7FFF;background:#EEF2FF !important;}',
    '.ix-adg-drop-t{font:500 11px/1.3 "DM Sans",sans-serif;color:#6b6f63;padding:8px;}',
    '.ix-adg-hint{font:400 11px/1.4 "DM Sans",sans-serif;color:#9a9a8a;margin-top:8px;max-width:700px;}',
    '.ix-adg-note{border-left:3px solid #C4A35A;background:#FDFCF8;padding:8px 10px;margin:10px 0;border-radius:0 6px 6px 0;font:400 11px/1.5 "DM Sans",sans-serif;color:#6b6f63;max-width:700px;}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('ix-adg-styles')) return;
    var st = document.createElement('style'); st.id = 'ix-adg-styles'; st.textContent = CSS;
    document.head.appendChild(st);
  }

  function host() {
    return document.querySelector('#std-adgen-mount') ||
           document.querySelector('[data-std-panel-body="adgen"]');
  }

  function mount() {
    injectCSS();
    var h = host();
    if (!h) return false;
    if (S.mounted && S.el === h && document.body.contains(h) && h.querySelector('#ix-adg-root')) return true;
    h.innerHTML = '<div class="ix-adg"><div id="ix-adg-root"></div></div>';
    S.el = h; S.mounted = true;
    S.layers = []; S.selected = -1; S.logo = null;
    render();
    return true;
  }

  function render() {
    var root = document.getElementById('ix-adg-root'); if (!root) return;
    root.innerHTML =
      '<div class="ix-adg-head">' +
        '<h2 class="ix-adg-title">Generate an ad</h2>' +
        '<p class="ix-adg-sub">Build an advertiser ad from scratch \u2014 blank canvas, brand kit, add text and elements.</p>' +
      '</div>' +
      '<div class="ix-adg-bar">' +
        '<button class="ix-adg-btn" id="ix-adg-addtext">+ Add text</button>' +
        '<button class="ix-adg-btn" id="ix-adg-delete">\u2715 Delete</button>' +
        '<div class="ix-adg-drop" id="ix-adg-drop"><span class="ix-adg-drop-t">Drop logo \u00b7 or click<input type="file" id="ix-adg-logofile" accept="image/*" hidden></span></div>' +
      '</div>' +
      '<div class="ix-adg-stage-wrap"><div class="ix-adg-stage" id="ix-adg-stage" style="height:' + Math.round(700 * (BANNER_H / BANNER_W) / 700 * 700) + 'px"></div></div>' +
      '<div class="ix-adg-hint">Click an element to select \u00b7 drag to move \u00b7 corner to resize \u00b7 double-click text to edit.</div>' +
      '<div class="ix-adg-note"><b>Shell (v' + VERSION + ').</b> The Generate surface is live and mountable. Full parity with the Ad Reformat editor (brand-colour panel, font picker, colour popover, compose \u2192 Uploadcare \u2192 Scenario B \u2192 104 save) is wired in deliberately next, reusing the proven pieces. Advertiser save + brand-kit persist follow once this shell is confirmed on-page.</div>';
    sizeStage();
    wireBar();
    renderLayers();
  }

  function sizeStage() {
    var stage = document.getElementById('ix-adg-stage');
    var wrap = stage && stage.parentNode; if (!stage || !wrap) return;
    var w = wrap.clientWidth || 700;
    stage.style.height = Math.round(w * (BANNER_H / BANNER_W)) + 'px';
  }

  function wireBar() {
    var add = document.getElementById('ix-adg-addtext');
    if (add) add.addEventListener('click', addText);
    var del = document.getElementById('ix-adg-delete');
    if (del) del.addEventListener('click', function () {
      if (S.selected < 0) return; S.layers.splice(S.selected, 1); S.selected = -1; renderLayers();
    });
    var drop = document.getElementById('ix-adg-drop');
    var file = document.getElementById('ix-adg-logofile');
    if (drop && file) {
      drop.addEventListener('click', function () { file.click(); });
      file.addEventListener('change', function () { if (file.files[0]) handleLogo(file.files[0]); });
      ['dragover', 'dragenter'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
      drop.addEventListener('drop', function (e) {
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) handleLogo(f);
      });
    }
  }

  function addText() {
    var L = { type: 'text', value: 'New text', x: Math.round(BANNER_W * 0.3), y: Math.round(BANNER_H * 0.42),
      w: Math.round(BANNER_W * 0.4), h: 30, size: 18, color: '#1A3A3A', weight: 700, align: 'center' };
    S.layers.push(L); S.selected = S.layers.length - 1; renderLayers();
    setTimeout(function () {
      var n = document.querySelector('.ix-adg-layer[data-i="' + S.selected + '"]');
      var sp = n && n.querySelector('.ix-adg-txt'); if (n && sp) editText(S.selected, sp);
    }, 0);
  }

  function handleLogo(file) {
    if (!/^image\//.test(file.type)) return;
    var cfg = CFG(), pub = cfg.uploadcarePublicKey;
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      var w = Math.round(BANNER_W * 0.2), h = Math.round(w * (c.height / c.width));
      S.layers.push({ type: 'img', canvas: c, x: BANNER_W - w - 12, y: 12, w: w, h: h });
      S.selected = S.layers.length - 1; renderLayers();
    };
    var reader = new FileReader();
    reader.onload = function () { img.src = reader.result; };
    reader.readAsDataURL(file);
    // (Uploadcare upload for the conditioned URL is wired with the save
    // step in the next iteration; shell keeps the logo local for layout.)
  }

  function renderLayers() {
    var stage = document.getElementById('ix-adg-stage'); if (!stage) return;
    stage.innerHTML = '';
    S.layers.forEach(function (L, i) {
      var node = document.createElement('div');
      node.className = 'ix-adg-layer' + (i === S.selected ? ' sel' : '');
      node.style.left = (L.x / BANNER_W * 100) + '%';
      node.style.top = (L.y / BANNER_H * 100) + '%';
      node.style.width = (L.w / BANNER_W * 100) + '%';
      node.style.height = (L.h / BANNER_H * 100) + '%';
      node.dataset.i = i;
      if (L.type === 'img') {
        var im = document.createElement('img'); im.src = L.canvas.toDataURL('image/png');
        im.style.cssText = 'width:100%;height:100%;object-fit:contain;pointer-events:none;display:block;';
        node.appendChild(im);
      } else {
        var sp = document.createElement('div'); sp.className = 'ix-adg-txt'; sp.textContent = L.value;
        sp.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:' +
          (L.align === 'center' ? 'center' : (L.align === 'right' ? 'flex-end' : 'flex-start')) + ';' +
          'overflow:hidden;padding:0 2px;box-sizing:border-box;pointer-events:none;white-space:nowrap;' +
          'font:' + (L.weight || 400) + ' ' + (L.size || 13) + 'px/1.1 "DM Sans",sans-serif;color:' + (L.color || '#1A3A3A') + ';';
        sp.style.setProperty('background-color', 'transparent', 'important');
        node.appendChild(sp);
        node.addEventListener('dblclick', function (e) { e.preventDefault(); e.stopPropagation(); editText(i, sp); });
      }
      var handle = document.createElement('div'); handle.className = 'ix-adg-handle';
      handle.style.setProperty('background-color', '#5B7FFF', 'important');
      node.appendChild(handle);
      stage.appendChild(node);
      wireLayer(node, i, handle);
    });
  }

  function editText(i, sp) {
    S.selected = i;
    sp.setAttribute('contenteditable', 'true');
    sp.style.pointerEvents = 'auto'; sp.style.outline = '2px solid #5B7FFF';
    sp.focus();
    try { var r = document.createRange(); r.selectNodeContents(sp); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
    function commit() { S.layers[i].value = sp.textContent.replace(/\s+/g, ' ').trim(); sp.removeEventListener('blur', commit); sp.removeEventListener('keydown', onKey); renderLayers(); }
    function onKey(e) { if (e.key === 'Enter') { e.preventDefault(); sp.blur(); } else if (e.key === 'Escape') { sp.textContent = S.layers[i].value; sp.blur(); } }
    sp.addEventListener('blur', commit); sp.addEventListener('keydown', onKey);
  }

  function wireLayer(node, i, handle) {
    var stage = node.parentNode;
    function rect() { return stage.getBoundingClientRect(); }
    node.addEventListener('pointerdown', function (e) {
      if (e.target === handle) return;
      e.preventDefault(); S.selected = i; renderLayers();
      var n = document.querySelector('.ix-adg-layer[data-i="' + i + '"]');
      var sr = rect(); var L = S.layers[i];
      var sx = e.clientX, sy = e.clientY, ox = L.x, oy = L.y;
      function mv(ev) {
        L.x = Math.max(0, Math.min(BANNER_W - L.w, Math.round(ox + (ev.clientX - sx) / sr.width * BANNER_W)));
        L.y = Math.max(0, Math.min(BANNER_H - L.h, Math.round(oy + (ev.clientY - sy) / sr.height * BANNER_H)));
        n.style.left = (L.x / BANNER_W * 100) + '%'; n.style.top = (L.y / BANNER_H * 100) + '%';
      }
      function up() { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
    handle.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation(); S.selected = i; renderLayers();
      var n = document.querySelector('.ix-adg-layer[data-i="' + i + '"]');
      var sr = rect(); var L = S.layers[i];
      var sx = e.clientX, sy = e.clientY, ow = L.w, oh = L.h;
      function mv(ev) {
        L.w = Math.max(16, Math.min(BANNER_W - L.x, Math.round(ow + (ev.clientX - sx) / sr.width * BANNER_W)));
        L.h = Math.max(12, Math.min(BANNER_H - L.y, Math.round(oh + (ev.clientY - sy) / sr.height * BANNER_H)));
        n.style.width = (L.w / BANNER_W * 100) + '%'; n.style.height = (L.h / BANNER_H * 100) + '%';
      }
      function up() { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
  }

  // ── Studio wiring ──
  window.addEventListener('std:panel:adgen', function () { setTimeout(mount, 0); });
  window.addEventListener('resize', function () { if (S.mounted) sizeStage(); });
  // If the panel is already active on load, mount.
  if (document.querySelector('[data-std-panel-body="adgen"].active')) { setTimeout(mount, 0); }

  console.log('\u2728 [AdGen v' + VERSION + '] loaded \u2014 from-scratch ad generator; listening for std:panel:adgen');
})();
