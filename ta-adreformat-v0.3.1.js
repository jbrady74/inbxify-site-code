/* ============================================================
   ta-adreformat-v0.3.1.js
   INBXIFY TA Studio — Ad Reformatter (Generator tab tool)

   CANVAS-FIRST REWRITE. Supersedes the v1.0.x line.

   v0.3.1 — editor refinements (1 of the feedback set):
     • Border on the image: image layers now object-fit:fill and are
       sized to the crop's natural aspect, so the selection border
       sits on the image edge with no contain-padding.
     • Per-layer background: selecting a layer shows a background bar
       — transparent (default), brand-color swatches, or a custom
       color picker. Applies to image and text layers.
     Still pending (next versions): v0.3.2 crop-frame (scale/pan image
     inside a fixed clip frame, hide overflow); v0.3.3 editable source
     bboxes → re-crop (fixes clipped logo); v0.3.4 per-text font picker
     + original-text-as-image option. Export + save after those.

   v0.3.0 — BANNER EDITOR (drag + resize core). "Build banner \u2192"
     opens a 700×235 editor below the extract results. Cropped image
     parts + the first text parts are placed onto the banner (rough
     auto-place: photo left, logo/others right, text stacked) as
     absolutely-positioned layers. Drag the body to move, drag the
     corner handle to resize; click to select. Background uses the
     first brand color. Image layers use <img> (object-fit:contain),
     which gets proper proportional sizing — unlike the bare preview
     canvas that fought the page CSS (now solved via iframe + this
     img-layer model). NOT yet: snapping/guides, text editing/restyle,
     z-order controls, sidebar, export, save. This is the interaction
     slice to feel out before building those.

   v0.2.3 — ISOLATED IFRAME preview. The canvas-in-page approach was
     defeated by the T-A page's global CSS three times: the canvas
     measured visible / on-top / opaque / sized, yet rendered white,
     and its aspect-ratio was overridden (rect 558×372 where the
     bitmap demanded ~558×139 — proof an unseen page rule won). The
     cropped-part thumbnails always rendered because they aren't
     subject to that cascade the same way. Fix: render the source
     preview inside a same-origin <iframe> with its own document, so
     publisher-wrapper resets and unknown !important rules can't reach
     it. Source + bounding boxes are drawn into the iframe's own
     canvas/DOM. Crops and the parts bin are unchanged (they already
     worked). Brand-swatch !important fix retained from v0.2.2.

   v0.2.2 — FIX (proven, not guessed). Console reads established:
     canvas height = 139.5px (NOT collapsed), intrinsic 4096×1024,
     top-left pixel = rgba(155,124,129,255) — i.e. the canvas was
     correctly sized AND fully painted with the real ad. The image
     was being VISUALLY COVERED, not unpainted. Cause: the wrapper's
     own white background + overflow:hidden + font-size:0 created a
     stacking context where the static canvas painted beneath the
     wrapper background. Fix: canvas position:relative z-index:1 +
     transparent background so its own pixels show; overlay z-index:2
     transparent; removed overflow:hidden / font-size:0 from wrapper.
     ALSO: brand-color swatches were blank because the T-A
     publisher-wrapper universal `* { background: white !important }`
     reset overrode the inline swatch color — now forced with
     `!important` on the inline background.

   v0.2.1 — FIX: preview canvas was still rendering at ~0 height.
     A <canvas> with width:100% does not derive proportional height
     from its intrinsic pixels the way an <img> does — height:auto
     resolved to 0 in the flex wrapper. (The cropped-part thumbnail
     rendered fine, proving the source pixels were on the canvas all
     along — it was purely the big preview's display height.) Fix:
     set an explicit aspect-ratio on the canvas from the real source
     dimensions, and drop line-height:0 on the wrapper.

   Why the rewrite: in v1.0.x the source ad was shown via an
   <img src="data:..."> in a flex layout. Console proved the image
   loaded (naturalWidth 4096) and the src was set — it was simply
   collapsing to zero height in the flex wrapper, so the preview
   was blank while the bounding boxes (absolute overlay) still drew.
   Rather than patch the layout, the tool is rebuilt on <canvas>,
   which has explicit pixel dimensions and cannot collapse — and
   which is exactly the substrate Pieces 3+4 (crop + composite)
   require anyway. One architecture, preview through export.

   PIPELINE (deterministic, no DOM-src fragility):
     intake (drop/browse/paste)
       → decode into an in-memory Image (S.img)
       → draw to a sized preview <canvas> (S.previewCanvas)
       → extract via ix-adreformat Worker
       → draw bbox overlays as positioned divs over the canvas
       → crop each image region via ctx.drawImage into a part canvas
         (S.parts[]) — the reusable building blocks
     [Pieces 3+4, next: arrange parts → composite 700×235 + 480×400
      canvas → export PNG (toBlob) / SVG → save to ADS record]

   Worker contract (confirmed against ix-adreformat-worker-v1.0.0):
     REQUEST  (POST): { image: { media_type, data(base64,no prefix) } }
     RESPONSE (200):  { ok:true, parts:{ business_name,
                        texts:[{role,value,verify?}],
                        images:[{label,kind,bbox:[x,y,w,h] 0..1}],
                        brand_colors:[hex] }, diagnostics:{...} }
     ERROR:           { ok:false, error, detail? }
     Origin allow-list: inbxify.com / www.inbxify.com / *.webflow.io.

   Mount: Converter pattern — listens for std:panel:generator
   (ta-studio v1.4.4), self-mounts into #std-generator-mount with
   a panel-body fallback; idempotent.

   Public API: window.InbxAdReformat.mount(selector?)
   Head: load AFTER ta-studio-v1.4.4.js.
   ============================================================ */
(function () {
  'use strict';

  var VERSION = '0.3.1';
  function CFG() { return window.TA_CONFIG || {}; }
  function log() { try { console.log.apply(console, ['[AdReformat v' + VERSION + ']'].concat([].slice.call(arguments))); } catch (e) {} }
  function warn() { try { console.warn.apply(console, ['[AdReformat v' + VERSION + ']'].concat([].slice.call(arguments))); } catch (e) {} }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── State ──
  var S = {
    mounted: false,
    el: null,
    file: null,
    img: null,           // in-memory HTMLImageElement of the source
    previewCanvas: null, // visible source canvas
    busy: false,
    result: null,        // worker parts
    diagnostics: null,
    parts: [],           // [{ label, kind, bbox, canvas }] cropped regions
    layers: [],          // editor layer model
    selected: -1,
    _pasteHandler: null
  };

  // Role-ID → label (only if a raw option-id ever appears; the Worker
  // returns semantic strings).
  function roleLabel(role) {
    if (!role) return '';
    var map = (CFG().optionIds && CFG().optionIds.componentRole) || {};
    var inv = {}; Object.keys(map).forEach(function (k) { inv[map[k]] = k; });
    var key = inv[role] || role;
    var nice = {
      bannerAd: 'Banner Ad', sidebarAd: 'Sidebar Ad', splashAd: 'Splash Ad',
      logo: 'Logo', customerLogo: 'Customer Logo', mainImage: 'Main Image',
      headline: 'Headline', tagline: 'Tagline', offer: 'Offer', services: 'Services',
      promo_code: 'Promo Code', phone: 'Phone', web: 'Website', address: 'Address',
      license: 'License', person: 'Person', mascot: 'Mascot', photo: 'Photo',
      graphic: 'Graphic', qr: 'QR Code', coupon: 'Coupon', badge: 'Badge', other: 'Other'
    };
    return nice[key] || String(key).replace(/_/g, ' ');
  }

  // ── Styles ──
  function injectStyles() {
    if (document.getElementById('ix-arf-styles')) return;
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
      // canvas wrapper: position context for box overlays; explicit block sizing
      '.ix-arf-srcwrap{position:relative;flex:1 1 380px;min-width:280px;max-width:560px;',
        'border:1px solid #e2ddcd;border-radius:8px;background:#fff !important;}',
      // the canvas itself: scales to wrapper width, keeps aspect; CANNOT collapse
      '.ix-arf-canvas{display:block;width:100%;height:auto;position:relative;z-index:1;background:transparent !important;}',
      '.ix-arf-ov{position:absolute;inset:0;z-index:2;pointer-events:none;background:transparent !important;}',
      '.ix-arf-box{position:absolute;border:2px solid #5B7FFF;background:rgba(91,127,255,.10);border-radius:2px;}',
      '.ix-arf-box .t{position:absolute;top:-17px;left:-2px;background:#5B7FFF;color:#fff;font-size:9px;',
        'font-family:"DM Mono",monospace;padding:1px 5px;border-radius:3px;white-space:nowrap;line-height:1.4;}',
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
      '.ix-arf-chip .r.v{background:#b8860b;}',
      '.ix-arf-chip .val{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:260px;}',
      // cropped part thumbnails
      '.ix-arf-parts{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;}',
      '.ix-arf-part{border:1px solid #e2ddcd;border-radius:6px;padding:6px;background:#fff !important;',
        'text-align:center;width:96px;}',
      '.ix-arf-part canvas{display:block;max-width:100%;height:auto;margin:0 auto 4px;background:#fff !important;}',
      '.ix-arf-part .pl{font-size:9px;font-family:"DM Mono",monospace;color:#8a8a7a;text-transform:uppercase;}',
      '.ix-arf-actions{display:flex;gap:10px;align-items:center;margin-top:16px;flex-wrap:wrap;}',
      '.ix-arf-status{font-size:12px;font-family:"DM Mono",monospace;}',
      '.ix-arf-status.ok{color:#2e7d52;} .ix-arf-status.err{color:#b23b3b;} .ix-arf-status.work{color:#5B7FFF;}',
      '.ix-arf-spin{display:inline-block;width:13px;height:13px;border:2px solid #c9c3b2;',
        'border-top-color:#5B7FFF;border-radius:50%;animation:ixarfspin .7s linear infinite;vertical-align:-2px;margin-right:6px;}',
      '@keyframes ixarfspin{to{transform:rotate(360deg)}}',
      '.ix-arf-soon{margin-top:18px;padding:10px 12px;border-left:3px solid #C4A35A;background:#FDFCF8 !important;',
        'font-size:12px;color:#6b6f63;border-radius:0 6px 6px 0;line-height:1.5;}',
      // banner editor
      '.ix-arf-edstage-wrap{max-width:700px;}',
      '.ix-arf-edstage{position:relative;width:100%;aspect-ratio:700/235;border:1px solid #c9c3b2;',
        'border-radius:4px;overflow:hidden;}',
      '.ix-arf-layer{position:absolute;box-sizing:border-box;cursor:grab;border:1px solid transparent;}',
      '.ix-arf-layer.sel{border:1.5px dashed #5B7FFF;}',
      '.ix-arf-layer:active{cursor:grabbing;}',
      '.ix-arf-handle{position:absolute;right:-6px;bottom:-6px;width:12px;height:12px;background:#5B7FFF;',
        'border:2px solid #fff;border-radius:2px;cursor:nwse-resize;display:none;}',
      '.ix-arf-layer.sel .ix-arf-handle{display:block;}',
      '.ix-arf-edhint{font-size:11px;color:#8a8a7a;margin-top:8px;line-height:1.5;max-width:700px;}',
      '.ix-arf-ltbar{display:flex;align-items:center;gap:6px;margin-top:10px;flex-wrap:wrap;max-width:700px;}',
      '.ix-arf-ltlbl{font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;font-family:"DM Mono",monospace;margin-right:4px;}',
      '.ix-arf-bgsw{width:22px;height:22px;border-radius:4px;border:1px solid rgba(0,0,0,.15);cursor:pointer;padding:0;}',
      '.ix-arf-bgsw.sel{outline:2px solid #5B7FFF;outline-offset:1px;}',
      '.ix-arf-ltcustom{display:inline-flex;align-items:center;}',
      '.ix-arf-ltcustom input{width:26px;height:26px;border:1px solid #c9c3b2;border-radius:4px;cursor:pointer;background:none;padding:0;}'
    ].join('');
    var st = document.createElement('style'); st.id = 'ix-arf-styles'; st.textContent = css;
    document.head.appendChild(st);
  }

  // ── Mount (Converter pattern) ──
  function findContainer(sel) {
    if (sel) { var s = document.querySelector(sel); if (s) return s; }
    return document.querySelector('#std-generator-mount') ||
           document.querySelector('[data-std-panel-body="generator"]') || null;
  }
  function mount(sel) {
    var c = findContainer(sel);
    if (!c) { warn('mount: no Generator container yet'); return false; }
    injectStyles();
    var host = c;
    if (c.matches && c.matches('[data-std-panel-body="generator"]')) {
      var inner = c.querySelector('#std-generator-mount');
      if (!inner) {
        inner = document.createElement('div'); inner.id = 'std-generator-mount';
        var ph = c.querySelector('.std-placeholder'); if (ph) ph.style.display = 'none';
        c.appendChild(inner);
      }
      host = inner;
    }
    if (S.mounted && S.el === host && document.body.contains(host) && host.querySelector('#ix-arf-root')) return true;
    host.innerHTML = '<div class="ix-arf"><div id="ix-arf-root"></div></div>';
    S.el = host; S.mounted = true;
    renderIntake();
    log('mounted into', host.id || 'generator panel');
    return true;
  }

  // ── Intake ──
  function renderIntake() {
    resetState();
    var root = document.getElementById('ix-arf-root'); if (!root) return;
    root.innerHTML =
      '<p class="ix-arf-intro">Drop an existing ad and the Reformatter reads it apart — ' +
      'business name, brand colors, logo and image regions, and the headline / offer / contact text — ' +
      'then crops each region so you can rebuild the ad at newsletter sizes.</p>' +
      '<div class="ix-arf-drop" id="ix-arf-drop" tabindex="0" role="button" aria-label="Add an ad image">' +
        '<div class="ix-arf-drop-icon">\u2728</div>' +
        '<div class="ix-arf-drop-hint">Drop an ad, click to browse, or paste (\u2318V / Ctrl+V)</div>' +
        '<div class="ix-arf-drop-sub">JPG / PNG / WEBP \u2014 the whole ad, as-is</div>' +
        '<input type="file" id="ix-arf-file" accept="image/png,image/jpeg,image/jpg,image/webp" hidden>' +
      '</div>' +
      '<div class="ix-arf-soon">Next build: arrange the cropped parts, composite a 700\u00d7235 banner and ' +
      '480\u00d7400 sidebar, then export and save to the ad record.</div>';
    wireDrop();
  }
  function resetState() {
    S.file = null; S.img = null; S.previewCanvas = null;
    S.result = null; S.diagnostics = null; S.parts = [];
  }
  function validate(f) {
    return f && (/^image\/(jpeg|jpg|png|webp)$/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name || ''));
  }

  function wireDrop() {
    var drop = document.getElementById('ix-arf-drop');
    var file = document.getElementById('ix-arf-file');
    if (!drop || !file) return;
    drop.addEventListener('click', function () { file.click(); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
    file.addEventListener('change', function () { if (file.files[0]) loadFile(file.files[0]); file.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('drag'); }); });
    drop.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) loadFile(f); });
    wirePaste();
  }
  function wirePaste() {
    if (S._pasteHandler) { document.removeEventListener('paste', S._pasteHandler); S._pasteHandler = null; }
    var handler = function (e) {
      if (!S.el || !document.body.contains(S.el)) { document.removeEventListener('paste', handler); S._pasteHandler = null; return; }
      if (!document.getElementById('ix-arf-drop')) return;
      var ae = document.activeElement; if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName)) return;
      var items = (e.clipboardData && e.clipboardData.items) || [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf('image/') === 0) {
          var blob = items[i].getAsFile(); if (!blob) continue;
          e.preventDefault();
          var ext = blob.type === 'image/jpeg' ? 'jpg' : (blob.type === 'image/webp' ? 'webp' : 'png');
          loadFile(new File([blob], 'pasted-ad-' + Date.now() + '.' + ext, { type: blob.type }));
          return;
        }
      }
    };
    S._pasteHandler = handler; document.addEventListener('paste', handler);
  }

  // ── Load → decode into in-memory Image (NOT a DOM <img> in flow) ──
  function loadFile(f) {
    if (!validate(f)) { flashErr('That file type won\u2019t work \u2014 use JPG, PNG, or WEBP.'); return; }
    S.file = f;
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () { S.img = img; renderStaged(); };
      img.onerror = function () { flashErr('Couldn\u2019t decode that image. Try another.'); };
      img.src = reader.result; // in-memory; never attached to the flow layout
    };
    reader.onerror = function () { flashErr('Couldn\u2019t read that file. Try another.'); };
    reader.readAsDataURL(f);
  }
  function flashErr(msg) {
    var sub = document.querySelector('#ix-arf-drop .ix-arf-drop-sub');
    if (sub) { sub.textContent = msg; sub.style.color = '#b23b3b'; }
  }

  // ── Staged: render preview inside an ISOLATED IFRAME ──
  // Every prior approach (img, canvas) was defeated by the T-A page's
  // global CSS — the canvas measured visible/onTop/opaque yet showed
  // white, and its aspect-ratio was overridden (rect 558×372 where the
  // bitmap demanded 558×139). Rather than keep losing a fight against an
  // unseen cascade, the preview now lives in a same-origin iframe with
  // its OWN document. The page's publisher-wrapper resets and unknown
  // !important rules cannot reach inside it. We draw the source (and the
  // boxes) into the iframe's own canvas. v0.2.3.
  function renderStaged() {
    var root = document.getElementById('ix-arf-root'); if (!root) return;
    root.innerHTML =
      '<div class="ix-arf-stage">' +
        '<div class="ix-arf-srcwrap" id="ix-arf-srcwrap">' +
          '<iframe id="ix-arf-frame" title="Ad preview" ' +
            'style="display:block;width:100%;border:0;background:#fff;"></iframe>' +
        '</div>' +
        '<div class="ix-arf-bin" id="ix-arf-bin">' +
          '<p class="ix-arf-intro">Source loaded. Extraction reads the ad apart and crops each ' +
          'detected region into a reusable part.</p>' +
        '</div>' +
      '</div>' +
      '<div class="ix-arf-actions">' +
        '<button class="ix-btn ix-btn--primary" id="ix-arf-extract">Extract parts</button>' +
        '<button class="ix-btn ix-btn--ghost" id="ix-arf-reset">Use a different ad</button>' +
        '<span class="ix-arf-status" id="ix-arf-status"></span>' +
      '</div>';
    paintFrame([]);   // initial paint, no boxes yet
    document.getElementById('ix-arf-extract').addEventListener('click', extract);
    document.getElementById('ix-arf-reset').addEventListener('click', renderIntake);
  }

  // Build the iframe's document from scratch and draw the source + boxes
  // into a canvas inside it. boxes = array of {bbox:[x,y,w,h], label}.
  function paintFrame(boxes) {
    var frame = document.getElementById('ix-arf-frame');
    if (!frame || !S.img) return;
    var w = S.img.naturalWidth || S.img.width;
    var h = S.img.naturalHeight || S.img.height;

    var doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
    if (!doc) { setTimeout(function () { paintFrame(boxes); }, 30); return; }

    // Size the iframe element to the source aspect at the wrapper's width.
    // Read the wrapper width and set the iframe height to match aspect, so
    // there is no flex-stretch and no external CSS in play.
    var wrap = document.getElementById('ix-arf-srcwrap');
    var dispW = (wrap && wrap.clientWidth) ? wrap.clientWidth : 540;
    var dispH = Math.round(dispW * (h / w));
    frame.style.height = dispH + 'px';

    // Boxes as absolutely-positioned divs in the iframe doc (percentages).
    var boxHtml = (boxes || []).map(function (b) {
      var bb = b.bbox || [0, 0, 0, 0];
      return '<div class="bx" style="left:' + (bb[0] * 100) + '%;top:' + (bb[1] * 100) +
             '%;width:' + (bb[2] * 100) + '%;height:' + (bb[3] * 100) + '%">' +
             '<span>' + esc(b.label || '') + '</span></div>';
    }).join('');

    doc.open();
    doc.write(
      '<!doctype html><html><head><meta charset="utf-8"><style>' +
      'html,body{margin:0;padding:0;background:#fff;}' +
      '.stage{position:relative;width:100%;line-height:0;}' +
      'canvas{display:block;width:100%;height:auto;}' +
      '.bx{position:absolute;border:2px solid #5B7FFF;background:rgba(91,127,255,.10);box-sizing:border-box;}' +
      '.bx span{position:absolute;top:-16px;left:-2px;background:#5B7FFF;color:#fff;font:9px/1.4 monospace;padding:1px 5px;border-radius:3px;white-space:nowrap;}' +
      '</style></head><body><div class="stage">' +
      '<canvas id="c"></canvas>' + boxHtml +
      '</div></body></html>'
    );
    doc.close();

    // Draw the source into the iframe's canvas. Same-origin → no taint.
    var cv = doc.getElementById('c');
    if (cv) {
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(S.img, 0, 0);
      S.previewCanvas = cv;
    }
  }

  function setStatus(kind, msg, spin) {
    var s = document.getElementById('ix-arf-status'); if (!s) return;
    s.className = 'ix-arf-status ' + (kind || '');
    s.innerHTML = (spin ? '<span class="ix-arf-spin"></span>' : '') + esc(msg || '');
  }

  // ── Extract ──
  function extract() {
    if (S.busy) return;
    var worker = CFG().adReformatWorker;
    if (!worker) { setStatus('err', 'No adReformatWorker configured.'); return; }
    var btn = document.getElementById('ix-arf-extract');
    S.busy = true; if (btn) btn.disabled = true;
    setStatus('work', 'Reading the ad\u2026', true);

    var dataUrl = (S.file && S.previewCanvas) ? null : null;
    // Use the canvas to produce clean base64 (also normalizes odd source
    // encodings). Fall back to the original file bytes if toDataURL fails.
    var b64, mime;
    try {
      var out = S.previewCanvas.toDataURL('image/jpeg', 0.92);
      b64 = out.split(',')[1]; mime = 'image/jpeg';
    } catch (e) {
      warn('canvas toDataURL failed, using file reader fallback', e);
    }

    var go = function (base64, mediaType) {
      fetch(worker, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: { media_type: mediaType, data: base64 } })
      })
        .then(function (r) {
          return r.text().then(function (t) {
            var data; try { data = JSON.parse(t); } catch (e) { throw new Error('Worker returned non-JSON: ' + t.slice(0, 120)); }
            if (!r.ok || data.ok === false) {
              throw new Error((data.error || ('Worker HTTP ' + r.status)) + (data.detail ? ' \u2014 ' + String(data.detail).slice(0, 120) : ''));
            }
            return data;
          });
        })
        .then(function (data) {
          S.result = data.parts || {}; S.diagnostics = data.diagnostics || null;
          cropParts(S.result);
          renderExtract(S.result);
          var nImg = (S.result.images || []).length, nTxt = (S.result.texts || []).length;
          var dd = data.diagnostics;
          var merged = (dd && dd.raw_text_count > dd.deduped_text_count)
            ? ' (' + (dd.raw_text_count - dd.deduped_text_count) + ' duplicate merged)' : '';
          setStatus('ok', 'Read ' + nImg + ' region' + (nImg === 1 ? '' : 's') + ', ' + nTxt + ' text part' + (nTxt === 1 ? '' : 's') + merged + '. Cropped ' + S.parts.length + '.');
        })
        .catch(function (err) { warn('extract failed', err); setStatus('err', err.message || 'Extraction failed.'); })
        .finally(function () { S.busy = false; if (btn) btn.disabled = false; });
    };

    if (b64) { go(b64, mime); }
    else {
      // fallback: re-read the original file
      var reader = new FileReader();
      reader.onload = function () { var o = reader.result; go(o.split(',')[1], S.file.type === 'image/jpg' ? 'image/jpeg' : (S.file.type || 'image/png')); };
      reader.onerror = function () { S.busy = false; if (btn) btn.disabled = false; setStatus('err', 'Could not encode image.'); };
      reader.readAsDataURL(S.file);
    }
  }

  // ── Crop each image region from the source canvas into a part canvas ──
  // This is the Pieces-3+4 foundation: every detected region becomes a
  // standalone canvas we can later draw into the 700×235 / 480×400 comps.
  function cropParts(p) {
    S.parts = [];
    if (!S.img) return;
    var W = S.img.naturalWidth || S.img.width;
    var H = S.img.naturalHeight || S.img.height;
    (p.images || []).forEach(function (im) {
      var b = im.bbox || [0, 0, 0, 0];
      var sx = Math.round(b[0] * W), sy = Math.round(b[1] * H);
      var sw = Math.round(b[2] * W), sh = Math.round(b[3] * H);
      if (sw < 2 || sh < 2) return;
      var c = document.createElement('canvas');
      c.width = sw; c.height = sh;
      try { c.getContext('2d').drawImage(S.img, sx, sy, sw, sh, 0, 0, sw, sh); }
      catch (e) { warn('crop failed for', im.label, e); return; }
      S.parts.push({ label: im.label || im.kind || 'part', kind: im.kind || 'other', bbox: b, canvas: c });
    });
  }

  // ── Render extracted parts + overlays + cropped thumbnails ──
  function renderExtract(p) {
    paintFrame(p.images || []);   // repaint iframe preview with boxes
    var bin = document.getElementById('ix-arf-bin'); if (!bin) return;
    var html = '<div class="ix-arf-bizname">' + esc(p.business_name || '(no business name detected)') + '</div>';

    var colors = p.brand_colors || [];
    if (colors.length) {
      html += '<div class="ix-arf-lbl">Brand colors</div><div>';
      colors.forEach(function (c) { html += '<span class="ix-arf-sw" style="background:' + esc(c) + ' !important"></span>'; });
      html += '<span class="ix-arf-swhex">' + esc(colors.join('  ')) + '</span></div>';
    }

    var imgs = p.images || [];
    html += '<div class="ix-arf-lbl">Cropped parts (' + S.parts.length + ' of ' + imgs.length + ')</div>';
    html += '<div class="ix-arf-parts" id="ix-arf-parts"></div>';

    var txts = p.texts || [];
    html += '<div class="ix-arf-lbl">Text (' + txts.length + ')</div><div class="ix-arf-chips">';
    if (!txts.length) html += '<span class="ix-arf-chip"><span class="val">none detected</span></span>';
    txts.forEach(function (t) {
      var v = t.verify ? '<span class="r v" title="Small text \u2014 confirm">verify</span>' : '';
      html += '<span class="ix-arf-chip"><span class="r">' + esc(roleLabel(t.role) || 'text') + '</span>' + v +
              '<span class="val" title="' + esc(t.value) + '">' + esc(t.value || '') + '</span></span>';
    });
    html += '</div>';
    bin.innerHTML = html;

    // Attach the cropped part canvases (live nodes, not markup).
    var holder = document.getElementById('ix-arf-parts');
    if (holder) {
      if (!S.parts.length) holder.innerHTML = '<span class="ix-arf-chip"><span class="val">no image regions cropped</span></span>';
      S.parts.forEach(function (part) {
        var wrap = document.createElement('div'); wrap.className = 'ix-arf-part';
        // display copy scaled down; keep the full-res canvas in S.parts
        part.canvas.style.maxWidth = '84px';
        wrap.appendChild(part.canvas);
        var lbl = document.createElement('div'); lbl.className = 'pl'; lbl.textContent = roleLabel(part.kind) || part.label;
        wrap.appendChild(lbl);
        holder.appendChild(wrap);
      });
    }

    // Build-banner entry: opens the drag/resize editor below.
    var actions = document.querySelector('.ix-arf-actions');
    if (actions && !document.getElementById('ix-arf-build')) {
      var b = document.createElement('button');
      b.className = 'ix-btn ix-btn--secondary'; b.id = 'ix-arf-build';
      b.textContent = 'Build banner \u2192';
      b.addEventListener('click', openEditor);
      actions.insertBefore(b, actions.querySelector('#ix-arf-reset'));
    }
  }

  // ════════════════════════════════════════════════════════════
  //  BANNER EDITOR (v0.3.0) — drag + resize core, 700×235.
  //  Layers are DOM nodes (img/text) absolutely positioned over a
  //  banner-sized stage INSIDE THE IFRAME (clean CSS). Drag to move,
  //  corner handle to resize. Export/snap/save come later.
  // ════════════════════════════════════════════════════════════
  var BANNER_W = 700, BANNER_H = 235;

  // Build the layer model from extracted parts (rough auto-place).
  function buildLayers() {
    var layers = [];
    var imgParts = S.parts.slice();
    var photo = null, rest = [];
    imgParts.forEach(function (p) { if (!photo && /photo|family|hero|image/.test((p.kind || '') + (p.label || ''))) photo = p; else rest.push(p); });
    if (!photo && imgParts.length) { photo = imgParts[0]; rest = imgParts.slice(1); }

    if (photo) {
      // Left ~58% width; height follows the crop's natural aspect so the
      // image fills its box edge-to-edge (border == image, no padding).
      var pw0 = photo.canvas.width, ph0 = photo.canvas.height;
      var w0 = Math.round(BANNER_W * 0.58);
      var h0 = Math.min(BANNER_H, Math.round(w0 * (ph0 / pw0)));
      layers.push({ type: 'img', canvas: photo.canvas, label: photo.label,
        x: 0, y: 0, w: w0, h: h0, bg: 'transparent' });
    }
    var rx = Math.round(BANNER_W * 0.60), ry = 12;
    rest.forEach(function (p) {
      var pw = p.canvas.width, ph = p.canvas.height;
      var scale = Math.min(120 / pw, 80 / ph, 1);
      layers.push({ type: 'img', canvas: p.canvas, label: p.label,
        x: rx, y: ry, w: Math.round(pw * scale), h: Math.round(ph * scale), bg: 'transparent' });
      ry += Math.round(ph * scale) + 8;
    });

    var ty = Math.max(ry, 90);
    (S.result.texts || []).slice(0, 5).forEach(function (t) {
      layers.push({ type: 'text', value: t.value, role: t.role,
        x: rx, y: ty, w: BANNER_W - rx - 14, h: 24,
        size: t.role === 'headline' ? 18 : 13,
        color: (S.result.brand_colors && S.result.brand_colors[1]) || '#1A3A3A',
        weight: (t.role === 'headline' || t.role === 'offer') ? 700 : 400,
        bg: 'transparent' });
      ty += 26;
    });
    return layers;
  }

  function openEditor() {
    S.layers = buildLayers();
    S.selected = -1;
    var bin = document.getElementById('ix-arf-bin'); // reuse area below isn't ideal; place under stage
    var root = document.getElementById('ix-arf-root');
    var existing = document.getElementById('ix-arf-editor');
    if (existing) existing.remove();
    var ed = document.createElement('div');
    ed.id = 'ix-arf-editor';
    ed.innerHTML =
      '<div class="ix-arf-lbl" style="margin-top:20px">Banner editor \u2014 700\u00d7235 (drag to move, corner to resize)</div>' +
      '<div class="ix-arf-edstage-wrap"><div class="ix-arf-edstage" id="ix-arf-edstage"></div></div>' +
      '<div class="ix-arf-edhint">Click a part to select. Drag the body to move, drag the corner to resize. ' +
      'Background uses the first brand color.</div>';
    root.appendChild(ed);
    renderEditor();
  }

  function renderEditor() {
    var stage = document.getElementById('ix-arf-edstage');
    if (!stage) return;
    var bg = (S.result.brand_colors && S.result.brand_colors[0]) || '#ffffff';
    stage.style.setProperty('background', bg, 'important');
    stage.innerHTML = '';
    S.layers.forEach(function (L, i) {
      var node = document.createElement('div');
      node.className = 'ix-arf-layer' + (i === S.selected ? ' sel' : '');
      node.style.left = (L.x / BANNER_W * 100) + '%';
      node.style.top = (L.y / BANNER_H * 100) + '%';
      node.style.width = (L.w / BANNER_W * 100) + '%';
      node.style.height = (L.h / BANNER_H * 100) + '%';
      node.style.setProperty('background', L.bg || 'transparent', 'important');
      node.dataset.i = i;
      if (L.type === 'img') {
        var im = document.createElement('img');
        im.src = L.canvas.toDataURL('image/png');
        // fill (not contain): the image occupies the whole layer box so the
        // selection border sits on the image edge with no padding. v0.3.1.
        im.style.cssText = 'width:100%;height:100%;object-fit:fill;pointer-events:none;display:block;';
        node.appendChild(im);
      } else {
        var sp = document.createElement('div');
        sp.textContent = L.value;
        sp.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;overflow:hidden;padding:0 2px;' +
          'box-sizing:border-box;font:' + L.weight + ' ' + L.size + 'px/1.1 "DM Sans",sans-serif;color:' + L.color + ';pointer-events:none;';
        node.appendChild(sp);
      }
      var handle = document.createElement('div');
      handle.className = 'ix-arf-handle';
      node.appendChild(handle);
      stage.appendChild(node);
      wireLayer(node, i, handle);
    });
    renderLayerToolbar();
  }

  // Floating background control for the selected layer.
  function renderLayerToolbar() {
    var ed = document.getElementById('ix-arf-editor'); if (!ed) return;
    var old = document.getElementById('ix-arf-ltbar'); if (old) old.remove();
    if (S.selected < 0 || !S.layers[S.selected]) return;
    var L = S.layers[S.selected];
    var bar = document.createElement('div');
    bar.id = 'ix-arf-ltbar'; bar.className = 'ix-arf-ltbar';
    var swatches = ['transparent'].concat((S.result.brand_colors || []).slice(0, 4));
    var sw = swatches.map(function (c) {
      var isT = c === 'transparent';
      var sel = (L.bg || 'transparent') === c ? ' sel' : '';
      var style = isT ? 'background:#fff;background-image:linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,#fff 25%,#fff 75%,#ccc 75%);background-size:8px 8px;background-position:0 0,4px 4px;'
                     : 'background:' + esc(c) + ';';
      return '<button class="ix-arf-bgsw' + sel + '" data-c="' + esc(c) + '" title="' + (isT ? 'Transparent' : esc(c)) + '" style="' + style + '"></button>';
    }).join('');
    bar.innerHTML = '<span class="ix-arf-ltlbl">Layer background</span>' + sw +
      '<label class="ix-arf-ltcustom" title="Custom color"><input type="color" id="ix-arf-bgcustom" value="' +
      (/^#/.test(L.bg || '') ? esc(L.bg) : '#ffffff') + '"></label>';
    ed.appendChild(bar);
    bar.querySelectorAll('.ix-arf-bgsw').forEach(function (b) {
      b.addEventListener('click', function () { S.layers[S.selected].bg = b.dataset.c; renderEditor(); });
    });
    var cust = document.getElementById('ix-arf-bgcustom');
    if (cust) cust.addEventListener('input', function () { S.layers[S.selected].bg = cust.value; renderEditor(); });
  }

  function wireLayer(node, i, handle) {
    var stage = node.parentNode;
    function rect() { return stage.getBoundingClientRect(); }

    node.addEventListener('pointerdown', function (e) {
      if (e.target === handle) return;
      e.preventDefault();
      S.selected = i; renderEditor();
      var n = document.querySelector('.ix-arf-layer[data-i="' + i + '"]');
      var sr = rect(); var L = S.layers[i];
      var startX = e.clientX, startY = e.clientY, ox = L.x, oy = L.y;
      function mv(ev) {
        var dx = (ev.clientX - startX) / sr.width * BANNER_W;
        var dy = (ev.clientY - startY) / sr.height * BANNER_H;
        L.x = Math.max(0, Math.min(BANNER_W - L.w, Math.round(ox + dx)));
        L.y = Math.max(0, Math.min(BANNER_H - L.h, Math.round(oy + dy)));
        n.style.left = (L.x / BANNER_W * 100) + '%';
        n.style.top = (L.y / BANNER_H * 100) + '%';
      }
      function up() { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });

    handle.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      S.selected = i; renderEditor();
      var n = document.querySelector('.ix-arf-layer[data-i="' + i + '"]');
      var sr = rect(); var L = S.layers[i];
      var startX = e.clientX, startY = e.clientY, ow = L.w, oh = L.h;
      var hd = n.querySelector('.ix-arf-handle');
      function mv(ev) {
        var dx = (ev.clientX - startX) / sr.width * BANNER_W;
        var dy = (ev.clientY - startY) / sr.height * BANNER_H;
        L.w = Math.max(16, Math.min(BANNER_W - L.x, Math.round(ow + dx)));
        L.h = Math.max(12, Math.min(BANNER_H - L.y, Math.round(oh + dy)));
        n.style.width = (L.w / BANNER_W * 100) + '%';
        n.style.height = (L.h / BANNER_H * 100) + '%';
      }
      function up() { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
  }

  // ── Studio wiring ──
  window.addEventListener('std:panel:generator', function () { setTimeout(function () { mount(); }, 0); });
  function tryInitialMount() { if (findContainer()) mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryInitialMount);
  else tryInitialMount();

  window.InbxAdReformat = { mount: mount, version: VERSION, _state: S };
  log('loaded (canvas-first) \u2014 listening for std:panel:generator');
})();
