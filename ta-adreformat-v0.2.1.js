/* ============================================================
   ta-adreformat-v0.2.1.js
   INBXIFY TA Studio — Ad Reformatter (Generator tab tool)

   CANVAS-FIRST REWRITE. Supersedes the v1.0.x line.

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

  var VERSION = '0.2.1';
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
        'border:1px solid #e2ddcd;border-radius:8px;overflow:hidden;background:#fff !important;font-size:0;}',
      // the canvas itself: scales to wrapper width, keeps aspect; CANNOT collapse
      '.ix-arf-canvas{display:block;width:100%;height:auto;background:#fff !important;}',
      '.ix-arf-ov{position:absolute;inset:0;pointer-events:none;}',
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
        'font-size:12px;color:#6b6f63;border-radius:0 6px 6px 0;line-height:1.5;}'
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

  // ── Staged: draw source to a sized canvas (cannot collapse) ──
  function renderStaged() {
    var root = document.getElementById('ix-arf-root'); if (!root) return;
    root.innerHTML =
      '<div class="ix-arf-stage">' +
        '<div class="ix-arf-srcwrap" id="ix-arf-srcwrap">' +
          '<canvas class="ix-arf-canvas" id="ix-arf-canvas"></canvas>' +
          '<div class="ix-arf-ov" id="ix-arf-ov"></div>' +
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
    drawSourceToCanvas();
    document.getElementById('ix-arf-extract').addEventListener('click', extract);
    document.getElementById('ix-arf-reset').addEventListener('click', renderIntake);
  }

  // Draw the in-memory source image onto the preview canvas at its native
  // pixel size. CSS scales the canvas down to wrapper width (width:100%;
  // height:auto), preserving aspect — but the canvas's intrinsic size is
  // the image's real pixels, so it can never collapse to zero height the
  // way the old <img> did in the flex wrapper.
  function drawSourceToCanvas() {
    var cv = document.getElementById('ix-arf-canvas');
    if (!cv || !S.img) return;
    var w = S.img.naturalWidth || S.img.width;
    var h = S.img.naturalHeight || S.img.height;
    cv.width = w;
    cv.height = h;
    // A <canvas> with width:100% does NOT inherit proportional height from
    // its intrinsic pixels the way an <img> does — height:auto can resolve
    // to 0 in a flex/line-height:0 wrapper, which is why the preview was
    // blank while the crop (which works off the same canvas) proved the
    // pixels are present. Set an explicit aspect-ratio from the real source
    // dimensions so width:100% has a height to compute against. v0.2.1.
    if (w > 0 && h > 0) {
      cv.style.aspectRatio = w + ' / ' + h;
      cv.style.height = 'auto';
    }
    var ctx = cv.getContext('2d');
    ctx.drawImage(S.img, 0, 0);
    S.previewCanvas = cv;
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
    drawBoxes(p);
    var bin = document.getElementById('ix-arf-bin'); if (!bin) return;
    var html = '<div class="ix-arf-bizname">' + esc(p.business_name || '(no business name detected)') + '</div>';

    var colors = p.brand_colors || [];
    if (colors.length) {
      html += '<div class="ix-arf-lbl">Brand colors</div><div>';
      colors.forEach(function (c) { html += '<span class="ix-arf-sw" style="background:' + esc(c) + '"></span>'; });
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
  }

  function drawBoxes(p) {
    var ov = document.getElementById('ix-arf-ov'); if (!ov) return;
    ov.innerHTML = '';
    (p.images || []).forEach(function (im) {
      var b = im.bbox || [0, 0, 0, 0];
      var d = document.createElement('div'); d.className = 'ix-arf-box';
      d.style.left = (b[0] * 100) + '%'; d.style.top = (b[1] * 100) + '%';
      d.style.width = (b[2] * 100) + '%'; d.style.height = (b[3] * 100) + '%';
      d.innerHTML = '<span class="t">' + esc(im.label || im.kind || 'img') + '</span>';
      ov.appendChild(d);
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
