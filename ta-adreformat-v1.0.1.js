/* ============================================================
   ta-adreformat-v1.0.1.js
   INBXIFY TA Studio — Ad Reformatter (Generator tab tool)

   v1.0.1 — version bump (filename + VERSION constant) for a fresh
     deploy slot over the installed v1.0.0. No functional change to
     mount, intake, or extraction.

   PIECES 1 + 2 of the Reformatter build:
     1. MOUNT — self-mounts into the Generator panel using the
        established Converter pattern. Listens for the
        `std:panel:generator` CustomEvent (dispatched by
        ta-studio v1.4.4 on tab activation) AND attempts an
        immediate mount on load, so it works whether it loads
        before or after the first tab click. Mount target:
        #std-generator-mount, with a fallback to the panel body
        [data-std-panel-body="generator"] if the id isn't present
        (belt-and-suspenders — this is what prevented the empty
        tab). Idempotent: never double-mounts.

     2. INTAKE + EXTRACT — drop / browse / paste an ad image,
        POST it (base64) to the ix-adreformat Worker
        (CFG.adReformatWorker), and render what came back: the
        source with bounding boxes drawn over detected image
        regions, the business name, brand-color swatches, image
        part chips, and text chips with role labels. This is the
        engine made visible — the go/no-go surface that proves
        the extraction on a real ad inside Studio.

   NOT in this version (Pieces 3 + 4, next session):
     - Arranging parts / compositing to 700×235 + 480×400
     - SVG / PNG export
     - Save banner to ADS "Banner Ad Link - GET" field
   The render here is deliberately read-only: extract and show.

   Worker contract (confirmed against ix-adreformat-worker-v1.0.0):
     REQUEST  (POST): { image: { media_type, data(base64,no prefix) } }
     RESPONSE (200):  { ok:true, parts:{ business_name,
                        texts:[{role,value,verify?}],
                        images:[{label,kind,bbox:[x,y,w,h] 0..1}],
                        brand_colors:[hex] },
                        diagnostics:{ raw_text_count, deduped_text_count,
                        image_count, model } }
     ERROR:           { ok:false, error, detail? }
     The Worker dedupes text, flags fine-print roles with verify:true,
     and clamps bboxes to [0,1]. Origin allow-list: inbxify.com /
     www.inbxify.com / *.webflow.io — the tool MUST run from one of
     these origins or the Worker rejects CORS.

   Visual language mirrors the Converter (cm-conv-*) so the tool
   feels native: teal #1A3A3A, gold #C4A35A, cream surfaces,
   ix-btn buttons, DM Mono labels.

   Public API: window.InbxAdReformat.mount(selector?)
   Webflow head: load AFTER ta-studio-v1.4.4.js.
   ============================================================ */
(function () {
  'use strict';

  var VERSION = '1.0.1';
  function CFG() { return window.TA_CONFIG || {}; }
  function log() {
    var a = Array.prototype.slice.call(arguments);
    a.unshift('[AdReformat v' + VERSION + ']');
    try { console.log.apply(console, a); } catch (e) {}
  }
  function warn() {
    var a = Array.prototype.slice.call(arguments);
    a.unshift('[AdReformat v' + VERSION + ']');
    try { console.warn.apply(console, a); } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── State ──
  var S = {
    mounted: false,
    el: null,         // mount container
    file: null,       // staged File
    dataUrl: '',      // source preview data URL
    busy: false,
    result: null      // last extraction result
  };

  // Role-ID → human label (ads), from TA_CONFIG.optionIds.componentRole.
  // The Worker returns semantic role strings ('logo','headline',...) not
  // option-IDs, so this is only used if/when a part carries a raw id.
  function roleLabel(role) {
    if (!role) return '';
    var map = (CFG().optionIds && CFG().optionIds.componentRole) || {};
    var inv = {};
    Object.keys(map).forEach(function (k) { inv[map[k]] = k; });
    var key = inv[role] || role;
    var nice = {
      bannerAd: 'Banner Ad', sidebarAd: 'Sidebar Ad', splashAd: 'Splash Ad',
      logo: 'Logo', customerLogo: 'Customer Logo', mainImage: 'Main Image',
      headline: 'Headline', tagline: 'Tagline', offer: 'Offer',
      promo_code: 'Promo Code', phone: 'Phone', web: 'Website',
      address: 'Address', other: 'Other'
    };
    return nice[key] || String(key).replace(/_/g, ' ');
  }

  // ── Styles (self-contained; cream surfaces survive the T-A
  //    publisher-wrapper universal white reset via !important) ──
  function injectStyles() {
    if (document.getElementById('ix-adreformat-styles')) return;
    var css = [
      '.ix-arf{font-family:"DM Sans",system-ui,sans-serif;color:#1A3A3A;}',
      '.ix-arf-intro{font-size:13px;color:#6b6f63;margin:0 0 14px;line-height:1.5;}',
      '.ix-arf-drop{border:2px dashed #c9c3b2;border-radius:10px;background:#FAF9F5 !important;',
        'padding:40px 20px;text-align:center;cursor:pointer;transition:border-color .12s,background .12s;}',
      '.ix-arf-drop:hover,.ix-arf-drop.drag{border-color:#5B7FFF;background:#EEF2FF !important;}',
      '.ix-arf-drop-icon{font-size:30px;}',
      '.ix-arf-drop-hint{font-size:14px;font-weight:600;margin-top:8px;}',
      '.ix-arf-drop-sub{font-size:11px;color:#8a8a7a;margin-top:4px;font-family:"DM Mono",monospace;}',
      '.ix-arf-stage{display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;}',
      '.ix-arf-srcwrap{position:relative;flex:1 1 360px;min-width:280px;border:1px solid #e2ddcd;',
        'border-radius:8px;overflow:hidden;background:#fff !important;}',
      '.ix-arf-src{display:block;width:100%;height:auto;}',
      '.ix-arf-ov{position:absolute;inset:0;pointer-events:none;}',
      '.ix-arf-box{position:absolute;border:2px solid #5B7FFF;background:rgba(91,127,255,.10);border-radius:2px;}',
      '.ix-arf-box .t{position:absolute;top:-18px;left:-2px;background:#5B7FFF;color:#fff;font-size:9px;',
        'font-family:"DM Mono",monospace;padding:1px 5px;border-radius:3px;white-space:nowrap;}',
      '.ix-arf-bin{flex:1 1 280px;min-width:260px;}',
      '.ix-arf-bizname{font-size:15px;font-weight:700;color:#1A3A3A;margin-bottom:10px;}',
      '.ix-arf-lbl{font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;',
        'font-family:"DM Mono",monospace;margin:14px 0 6px;}',
      '.ix-arf-sw{display:inline-block;width:22px;height:22px;border-radius:4px;margin-right:5px;',
        'border:1px solid rgba(0,0,0,.12);vertical-align:middle;}',
      '.ix-arf-swhex{font-size:10px;color:#8a8a7a;font-family:"DM Mono",monospace;margin-left:4px;}',
      '.ix-arf-chips{display:flex;flex-wrap:wrap;gap:6px;}',
      '.ix-arf-chip{display:inline-flex;align-items:center;gap:6px;background:#FAF9F5 !important;',
        'border:1px solid #e2ddcd;border-radius:14px;padding:4px 10px;font-size:12px;max-width:100%;}',
      '.ix-arf-chip .r{font-size:9px;font-family:"DM Mono",monospace;color:#fff;background:#C4A35A;',
        'padding:1px 6px;border-radius:8px;text-transform:uppercase;letter-spacing:.04em;}',
      '.ix-arf-chip .v{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px;}',
      '.ix-arf-actions{display:flex;gap:10px;align-items:center;margin-top:16px;flex-wrap:wrap;}',
      '.ix-arf-status{font-size:12px;font-family:"DM Mono",monospace;}',
      '.ix-arf-status.ok{color:#2e7d52;}',
      '.ix-arf-status.err{color:#b23b3b;}',
      '.ix-arf-status.work{color:#5B7FFF;}',
      '.ix-arf-spin{display:inline-block;width:13px;height:13px;border:2px solid #c9c3b2;',
        'border-top-color:#5B7FFF;border-radius:50%;animation:ixarfspin .7s linear infinite;vertical-align:-2px;margin-right:6px;}',
      '@keyframes ixarfspin{to{transform:rotate(360deg)}}',
      '.ix-arf-soon{margin-top:18px;padding:10px 12px;border-left:3px solid #C4A35A;background:#FDFCF8 !important;',
        'font-size:12px;color:#6b6f63;border-radius:0 6px 6px 0;line-height:1.5;}'
    ].join('');
    var st = document.createElement('style');
    st.id = 'ix-adreformat-styles';
    st.textContent = css;
    document.head.appendChild(st);
  }

  // ── Mount ──
  function findContainer(selector) {
    if (selector) { var s = document.querySelector(selector); if (s) return s; }
    return document.querySelector('#std-generator-mount') ||
           document.querySelector('[data-std-panel-body="generator"]') ||
           null;
  }

  function mount(selector) {
    var c = findContainer(selector);
    if (!c) { warn('mount: no Generator container yet'); return false; }
    // If we already mounted into this exact node, do nothing.
    if (S.mounted && S.el && document.body.contains(S.el) && S.el.parentNode === c) return true;
    injectStyles();

    // Replace any placeholder content inside the panel body, but only the
    // tool region — don't nuke a heading if the panel renders one.
    var host = c;
    // If the container is the panel body, prefer an inner mount div.
    if (c.matches && c.matches('[data-std-panel-body="generator"]')) {
      var inner = c.querySelector('#std-generator-mount');
      if (!inner) {
        inner = document.createElement('div');
        inner.id = 'std-generator-mount';
        // Drop any placeholder ("Coming later") text that lived here.
        var ph = c.querySelector('.std-placeholder');
        if (ph) ph.style.display = 'none';
        c.appendChild(inner);
      }
      host = inner;
    }

    host.innerHTML = shell();
    S.el = host;
    S.mounted = true;
    wire();
    renderIntake();
    log('mounted into', host.id || host.className || 'generator panel');
    return true;
  }

  function shell() {
    return '<div class="ix-arf"><div id="ix-arf-root"></div></div>';
  }

  // ── Intake view ──
  function renderIntake() {
    var root = document.getElementById('ix-arf-root');
    if (!root) return;
    root.innerHTML =
      '<p class="ix-arf-intro">Drop an existing ad and the Reformatter reads it apart — ' +
      'business name, brand colors, logo and image regions, and the headline / offer / ' +
      'contact text — so you can rebuild it at the sizes a newsletter needs.</p>' +
      '<div class="ix-arf-drop" id="ix-arf-drop" tabindex="0" role="button" ' +
        'aria-label="Add an ad image">' +
        '<div class="ix-arf-drop-icon">\u2728</div>' +
        '<div class="ix-arf-drop-hint">Drop an ad, click to browse, or paste (\u2318V / Ctrl+V)</div>' +
        '<div class="ix-arf-drop-sub">JPG / PNG / WEBP \u2014 the whole ad, as-is</div>' +
        '<input type="file" id="ix-arf-file" accept="image/png,image/jpeg,image/jpg,image/webp" hidden>' +
      '</div>' +
      '<div class="ix-arf-soon">Next: arrange the extracted parts and composite a 700\u00d7235 banner ' +
      'and 480\u00d7400 sidebar, then export. This version proves the read.</div>';
    wireDrop();
  }

  function validate(f) {
    return f && (/^image\/(jpeg|jpg|png|webp)$/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name || ''));
  }

  function wire() { /* root-level listeners attached per-view */ }

  function wireDrop() {
    var drop = document.getElementById('ix-arf-drop');
    var file = document.getElementById('ix-arf-file');
    if (!drop || !file) return;

    drop.addEventListener('click', function () { file.click(); });
    drop.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); }
    });
    file.addEventListener('change', function () {
      if (file.files[0]) loadFile(file.files[0]);
      file.value = '';
    });
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('drag'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('drag'); });
    });
    drop.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) loadFile(f);
    });
    wirePaste();
  }

  // Paste intake — only while the tool is mounted & visible, and not while
  // typing in a field. Mirrors the Converter's paste pattern.
  function wirePaste() {
    if (S._pasteWired) {
      document.removeEventListener('paste', S._pasteWired);
      S._pasteWired = null;
    }
    var handler = function (e) {
      if (!S.el || !document.body.contains(S.el)) {
        document.removeEventListener('paste', handler); S._pasteWired = null; return;
      }
      if (!document.getElementById('ix-arf-drop')) return; // not on intake view
      var ae = document.activeElement;
      if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName)) return;
      var items = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf('image/') === 0) {
          var blob = items[i].getAsFile();
          if (!blob) continue;
          e.preventDefault();
          var ext = blob.type === 'image/jpeg' ? 'jpg' : (blob.type === 'image/webp' ? 'webp' : 'png');
          var named = new File([blob], 'pasted-ad-' + Date.now() + '.' + ext, { type: blob.type });
          loadFile(named);
          return;
        }
      }
    };
    S._pasteWired = handler;
    document.addEventListener('paste', handler);
  }

  function loadFile(f) {
    if (!validate(f)) { flashDropError('That file type won\u2019t work \u2014 use JPG, PNG, or WEBP.'); return; }
    S.file = f;
    var reader = new FileReader();
    reader.onload = function () {
      S.dataUrl = reader.result;
      renderStaged();
    };
    reader.onerror = function () { flashDropError('Couldn\u2019t read that file. Try another.'); };
    reader.readAsDataURL(f);
  }

  function flashDropError(msg) {
    var sub = document.querySelector('#ix-arf-drop .ix-arf-drop-sub');
    if (sub) { sub.textContent = msg; sub.style.color = '#b23b3b'; }
  }

  // ── Staged view (source + Extract button) ──
  function renderStaged() {
    var root = document.getElementById('ix-arf-root');
    if (!root) return;
    root.innerHTML =
      '<div class="ix-arf-stage">' +
        '<div class="ix-arf-srcwrap">' +
          '<img class="ix-arf-src" id="ix-arf-srcimg" src="' + esc(S.dataUrl) + '" alt="Source ad">' +
          '<div class="ix-arf-ov" id="ix-arf-ov"></div>' +
        '</div>' +
        '<div class="ix-arf-bin" id="ix-arf-bin">' +
          '<p class="ix-arf-intro">Ready to read this ad. Extraction calls the vision engine ' +
          'and draws what it finds back over the image.</p>' +
        '</div>' +
      '</div>' +
      '<div class="ix-arf-actions">' +
        '<button class="ix-btn ix-btn--primary" id="ix-arf-extract">Extract parts</button>' +
        '<button class="ix-btn ix-btn--ghost" id="ix-arf-reset">Use a different ad</button>' +
        '<span class="ix-arf-status" id="ix-arf-status"></span>' +
      '</div>';
    document.getElementById('ix-arf-extract').addEventListener('click', extract);
    document.getElementById('ix-arf-reset').addEventListener('click', function () {
      S.file = null; S.dataUrl = ''; S.result = null; renderIntake();
    });
  }

  function setStatus(kind, msg, spin) {
    var s = document.getElementById('ix-arf-status');
    if (!s) return;
    s.className = 'ix-arf-status ' + (kind || '');
    s.innerHTML = (spin ? '<span class="ix-arf-spin"></span>' : '') + esc(msg || '');
  }

  // ── Extract: POST base64 to ix-adreformat worker ──
  function extract() {
    if (S.busy) return;
    var worker = CFG().adReformatWorker;
    if (!worker) { setStatus('err', 'No adReformatWorker configured.'); return; }
    var btn = document.getElementById('ix-arf-extract');
    S.busy = true;
    if (btn) { btn.disabled = true; }
    setStatus('work', 'Reading the ad\u2026', true);

    var base64 = (S.dataUrl.indexOf(',') !== -1) ? S.dataUrl.split(',')[1] : S.dataUrl;
    var mime = (S.file && S.file.type) || 'image/png';
    // Worker contract: { image: { media_type, data(base64, no prefix) } }
    if (mime === 'image/jpg') mime = 'image/jpeg';

    fetch(worker, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: { media_type: mime, data: base64 } })
    })
      .then(function (r) {
        return r.text().then(function (t) {
          var data;
          try { data = JSON.parse(t); }
          catch (e) { throw new Error('Worker returned non-JSON: ' + t.slice(0, 120)); }
          // Worker contract: { ok:true, parts:{...} } | { ok:false, error }
          if (!r.ok || data.ok === false) {
            throw new Error(data.error || ('Worker HTTP ' + r.status) +
              (data.detail ? ' \u2014 ' + String(data.detail).slice(0, 120) : ''));
          }
          return data;
        });
      })
      .then(function (data) {
        var p = data.parts || {};
        S.result = p;
        S.diagnostics = data.diagnostics || null;
        renderExtract(p);
        var nImg = (p.images || []).length, nTxt = (p.texts || []).length;
        var dd = data.diagnostics;
        var dedupeNote = (dd && dd.raw_text_count > dd.deduped_text_count)
          ? ' (' + (dd.raw_text_count - dd.deduped_text_count) + ' duplicate text part' +
            ((dd.raw_text_count - dd.deduped_text_count) === 1 ? '' : 's') + ' merged)'
          : '';
        setStatus('ok', 'Read ' + nImg + ' image region' + (nImg === 1 ? '' : 's') +
          ' and ' + nTxt + ' text part' + (nTxt === 1 ? '' : 's') + dedupeNote + '.');
      })
      .catch(function (err) {
        warn('extract failed', err);
        setStatus('err', err.message || 'Extraction failed.');
      })
      .finally(function () {
        S.busy = false;
        if (btn) { btn.disabled = false; }
      });
  }

  // ── Render extracted parts ──
  function renderExtract(p) {
    drawBoxes(p);
    var bin = document.getElementById('ix-arf-bin');
    if (!bin) return;
    var html = '';
    html += '<div class="ix-arf-bizname">' + esc(p.business_name || '(no business name detected)') + '</div>';

    var colors = p.brand_colors || [];
    if (colors.length) {
      html += '<div class="ix-arf-lbl">Brand colors</div><div>';
      colors.forEach(function (c) {
        html += '<span class="ix-arf-sw" style="background:' + esc(c) + '"></span>';
      });
      html += '<span class="ix-arf-swhex">' + esc(colors.join('  ')) + '</span></div>';
    }

    var imgs = p.images || [];
    html += '<div class="ix-arf-lbl">Image regions (' + imgs.length + ')</div>';
    html += '<div class="ix-arf-chips">';
    if (!imgs.length) html += '<span class="ix-arf-chip"><span class="v">none detected</span></span>';
    imgs.forEach(function (im) {
      html += '<span class="ix-arf-chip"><span class="r">' + esc(roleLabel(im.kind || im.label) || 'img') + '</span>' +
              '<span class="v">' + esc(im.label || im.kind || '') + '</span></span>';
    });
    html += '</div>';

    var txts = p.texts || [];
    html += '<div class="ix-arf-lbl">Text (' + txts.length + ')</div>';
    html += '<div class="ix-arf-chips">';
    if (!txts.length) html += '<span class="ix-arf-chip"><span class="v">none detected</span></span>';
    txts.forEach(function (t) {
      var vcue = t.verify ? '<span class="r" style="background:#b8860b" title="Small text \u2014 confirm OCR">verify</span>' : '';
      html += '<span class="ix-arf-chip"><span class="r">' + esc(roleLabel(t.role) || 'text') + '</span>' + vcue +
              '<span class="v" title="' + esc(t.value) + '">' + esc(t.value || '') + '</span></span>';
    });
    html += '</div>';

    bin.innerHTML = html;
  }

  function drawBoxes(p) {
    var ov = document.getElementById('ix-arf-ov');
    var img = document.getElementById('ix-arf-srcimg');
    if (!ov || !img) return;
    function draw() {
      ov.innerHTML = '';
      (p.images || []).forEach(function (im) {
        var b = im.bbox || [0, 0, 0, 0];
        var d = document.createElement('div');
        d.className = 'ix-arf-box';
        d.style.left = (b[0] * 100) + '%';
        d.style.top = (b[1] * 100) + '%';
        d.style.width = (b[2] * 100) + '%';
        d.style.height = (b[3] * 100) + '%';
        d.innerHTML = '<span class="t">' + esc(im.label || im.kind || 'img') + '</span>';
        ov.appendChild(d);
      });
    }
    if (img.complete) draw(); else img.onload = draw;
  }

  // ── Wire to Studio tab activation (Converter pattern) ──
  window.addEventListener('std:panel:generator', function () {
    // small delay lets ta-studio paint the panel body first
    setTimeout(function () { mount(); }, 0);
  });

  // Also try an immediate mount in case the panel is already present
  // (e.g. tool loaded after the Generator tab was opened).
  function tryInitialMount() {
    if (findContainer()) mount();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInitialMount);
  } else {
    tryInitialMount();
  }

  // Public API
  window.InbxAdReformat = {
    mount: mount,
    version: VERSION,
    _state: S
  };

  log('loaded \u2014 listening for std:panel:generator (Generator tab)');
})();
