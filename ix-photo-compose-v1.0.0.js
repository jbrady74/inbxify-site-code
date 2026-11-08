/* ix-photo-compose-v1.0.0.js */
/* ============================================================
   ix-photo-compose-v1.0.0.js
   INBXIFY · ix component series · INSET PHOTOS AND MOVABLE CROPS

   v1.0.0 (8 Nov 2026, Inset Photo S2 · Build) — NEW.
   SPEC: Inset-Photo-and-Crops-Scoping-v0_4.md and the accepted mockup
   inbxify-inset-photo-mockup-v0_2.html (C1 to C8). If this file and
   the mockup disagree, this file is wrong.

   WHAT IT DOES
     Two screens, opened by a surface (today: ta-asf-article v1.0.11):
       · Adjust Crops: one focus point, then drag any single crop. The
         shapes come from the Data Worker (ix-issue-data v1.0.166,
         GET /media?taId=&photo=1), never typed here.
       · New Inset Photo: a base photo with a circular second photo on
         top. Drag the circle, resize from its handle, frame the face in
         the small circle (drag + zoom), pick the ring (any colour, three
         suggestions worked out from the photos, or No ring). AI writes
         the alt text. Save builds the picture at the base photo's full
         size, uploads it to Uploadcare and has Scenario B
         (createMediaFromBrowserUpload, sourceChannel "composer") make
         the MEDIA row with its image-recipe, alt text and caption.
     Code taken from ta-admaker v2.8.0 so the Ad Maker can move onto
     this module instead of keeping its own copy: the crossOrigin image
     loader, the circle cut, canvas to file, the Uploadcare upload, and
     the Scenario B MEDIA row call.

   API
     IxPhotoCompose.facts({ ids, usage, articleId, fresh }) -> Promise
       The Worker's photo answer: { shapes, inset, items, usage, upload }.
     IxPhotoCompose.openCrops({ photo, recipe, crumb, sub, shapes,
       otherShareArticles, onUse(cropsOrNull), onCancel })
     IxPhotoCompose.openComposer({ base, choices, recipe, caption,
       crumb, headline, facts, mode, onSaved(result), onCancel })
     IxPhotoCompose.alignFor(recipe, key, shapes) -> 'Xp,Yp' or ''
     IxPhotoCompose.recipeOf(raw) -> object or null

   RECIPE (MEDIA image-recipe, PlainText JSON, scope §6)
     { v:1, crops:{ focus:{x,y}?, shapes:{key:{x,y}}, px:{w,h} },
       composite:{ sources:{base,inset}, circle:{cx,cy,d},
                   insetCrop:{x,y,zoom}, ring:{width,color|null},
                   output:{w,h} } }
     Positions are fractions of the photo. A shape's {x,y} is the crop
     window's place in the room it can move (0 = left or top edge,
     1 = right or bottom edge), Uploadcare's own meaning. px is the
     photo's size, so the Data Worker can centre a shape on the focus.
     focus is stored only when the editor set one: a crop with neither
     its own place nor a focus stays on Uploadcare's face finder.

   TOAST-TRUTH: Save reports success only when Scenario B echoes the
   MEDIA row it wrote and its alt text and recipe match what was sent.

   HARDCODING (provisional ids; the doc-maintenance chat numbers them):
     HC-P-INS-1  circle diameter limits, share of base width (HC.circle)
     HC-P-INS-2  output format and quality (HC.out)
     HC-P-INS-3  largest output side in pixels (HC.outMax)
     HC-P-INS-4  ring suggestion kinds, minimum contrast, neutrals (HC.ring)
     HC-P-INS-5  the alt-text instruction, model and length (HC.alt)
     HC-P-INS-7  working preview size for the screens (HC.workMax)
   Ring width and the circle's starting size are title values
   (TITLES-ADMIN design-json photo.insetRingWidth / insetCircleStart),
   read through the Worker and refused at Save when missing.

   Companions: ix-photo-compose-v1.0.0.css, ix-tokens, ix-buttons,
   ix-form-controls (ix-revert), ix-info, ix-progress, ix-ai-badge.
   ============================================================ */
(function () {
  'use strict';
  if (window.IxPhotoCompose) return;

  var VERSION = '1.0.0';
  var FILE = 'ix-photo-compose-v1.0.0.js';

  var HC = {
    circle: { min: 0.12, max: 0.45 },                                   // HC-P-INS-1
    out: { type: 'image/jpeg', quality: 0.92, ext: 'jpg' },            // HC-P-INS-2
    outMax: 4000,                                                       // HC-P-INS-3
    ring: { minContrast: 3, light: [250, 248, 242], dark: [30, 42, 58] }, // HC-P-INS-4
    alt: {                                                              // HC-P-INS-5
      model: 'claude-opus-4-5', maxTokens: 300, maxChars: 250, picMax: 1024,
      system: [
        'You write alt text for one photo on a local newsletter website.',
        'The photo is a composite: a main photo with a smaller round photo set into it.',
        'Describe both parts in one plain sentence, main scene first, then the round inset.',
        'Name people only if their name is given to you. Never guess a name.',
        'Do not start with "Image of" or "Photo of". No quotation marks. No hashtags.',
        'At most 250 characters. Answer with the alt text only.'
      ].join('\n')
    },
    workMax: 1600                                                       // HC-P-INS-7
  };

  /* ════════════════════════════════════════════════════════════
     CONFIG AND SMALL HELPERS
     ════════════════════════════════════════════════════════════ */
  function cfg() { return window.TA_CONFIG || {}; }
  function workerBase() {
    var c = cfg();
    return String(c.planBoard || c.planList || '').replace(/\/(plan-board|plans)(\?.*)?$/, '').replace(/\/$/, '');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function $(root, sel) { return root.querySelector(sel); }

  var UC_HOST = /(^|\.)(ucarecd\.net|ucarecdn\.com)$/i;
  var UC_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function ucBase(url) {
    var m = /^https?:\/\/([^\/?#]+)\/([^\/?#]+)/i.exec(String(url || '').trim());
    if (!m || !UC_HOST.test(m[1]) || !UC_ID.test(m[2])) return '';
    return 'https://' + m[1].toLowerCase() + '/' + m[2].toLowerCase() + '/';
  }
  // The photo as the screens draw it (light), and at full size for the build.
  function workUrl(url) { var b = ucBase(url); return b ? b + '-/preview/' + HC.workMax + 'x' + HC.workMax + '/-/format/jpeg/-/quality/smart/' : url; }
  function fullUrl(url) { var b = ucBase(url); return b ? b + '-/preview/' + HC.outMax + 'x' + HC.outMax + '/-/format/jpeg/-/quality/best/' : url; }

  // ta-admaker v2.8.0 loader: crossOrigin so the canvas can be exported.
  var IMG_CACHE = {};
  function loadImg(url) {
    if (!url) return Promise.resolve(null);
    if (IMG_CACHE[url]) return Promise.resolve(IMG_CACHE[url]);
    return new Promise(function (ok) {
      var i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = function () { IMG_CACHE[url] = i; ok(i); };
      i.onerror = function () { ok(null); };
      i.src = url;
    });
  }
  function canExport(img) {
    try { var c = mk(2, 2); c.getContext('2d').drawImage(img, 0, 0, 2, 2); c.getContext('2d').getImageData(0, 0, 1, 1); return true; }
    catch (e) { return false; }
  }

  function recipeOf(raw) {
    if (!raw) return null;
    if (typeof raw === 'object') return raw;
    try { var o = JSON.parse(String(raw)); return (o && typeof o === 'object') ? o : null; } catch (e) { return null; }
  }

  /* ════════════════════════════════════════════════════════════
     THE WORKER'S PHOTO ANSWER (ix-issue-data v1.0.166)
     ════════════════════════════════════════════════════════════ */
  function facts(o) {
    o = o || {};
    var base = workerBase(), ta = cfg().taItemId || '';
    if (!base) return Promise.reject(new Error('TA_CONFIG.planBoard is missing, so the Data Worker cannot be reached.'));
    if (!ta) return Promise.reject(new Error('TA_CONFIG.taItemId is missing.'));
    var u = base + '/media?taId=' + encodeURIComponent(ta) + '&photo=1' +
      (o.ids && o.ids.length ? '&ids=' + o.ids.join(',') : '') +
      (o.usage && o.usage.length ? '&usage=' + o.usage.join(',') + '&articleId=' + encodeURIComponent(o.articleId || '') : '') +
      (o.fresh ? '&fresh=1' : '');
    return fetch(u, { method: 'GET', ixLabel: o.label || 'Photo facts' }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) {
        if (!r.ok || !j || j.ok !== true) throw new Error((j && j.error) || ('The Data Worker answered HTTP ' + r.status));
        return j;
      });
    });
  }

  /* ════════════════════════════════════════════════════════════
     CROP WINDOWS (the same sums the Data Worker does)
     ════════════════════════════════════════════════════════════ */
  function win(shape, W, H, crops) {
    if (shape.whole) return { x: 0, y: 0, w: W, h: H };
    var a = shape.w / shape.h, w, h;
    if (W / H > a) { h = H; w = H * a; } else { w = W; h = W / a; }
    var own = crops.shapes && crops.shapes[shape.key], x, y;
    if (own) { x = own.x * (W - w); y = own.y * (H - h); }
    else {
      var f = crops.focus || { x: 0.5, y: 0.5 };
      x = clamp(f.x * W - w / 2, 0, W - w); y = clamp(f.y * H - h / 2, 0, H - h);
    }
    return { x: x, y: y, w: w, h: h };
  }
  // 'Xp,Yp' for Uploadcare, or '' when the recipe leaves the shape automatic.
  function alignFor(recipe, key, shapes) {
    var r = recipeOf(recipe), c = r && r.crops;
    if (!c) return '';
    var sh = (shapes || []).filter(function (s) { return s.key === key && !s.whole; })[0];
    if (!sh) return '';
    var x, y, own = c.shapes && c.shapes[key];
    if (own && own.x != null) { x = clamp(+own.x, 0, 1); y = clamp(+own.y, 0, 1); }
    else if (c.focus && c.px && c.px.w > 0 && c.px.h > 0) {
      var W = +c.px.w, H = +c.px.h, wn = win(sh, W, H, { focus: c.focus, shapes: {} });
      x = (W - wn.w) > 0 ? wn.x / (W - wn.w) : 0.5;
      y = (H - wn.h) > 0 ? wn.y / (H - wn.h) : 0.5;
    } else return '';
    return Math.round(x * 100) + 'p,' + Math.round(y * 100) + 'p';
  }

  /* ════════════════════════════════════════════════════════════
     COLOUR: ring suggestions (mockup v0.2 §3)
     ════════════════════════════════════════════════════════════ */
  function lum(r, g, b) { function f(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); } return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
  function ratio(a, b) { var l1 = lum(a[0], a[1], a[2]), l2 = lum(b[0], b[1], b[2]); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2; if (mx !== mn) { var d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
  function hsl2rgb(h, s, l) { h = ((h % 360) + 360) % 360 / 360; function f(p, q, t) { if (t < 0) t++; if (t > 1) t--; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; } if (!s) return [l * 255, l * 255, l * 255].map(Math.round); var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)].map(function (v) { return Math.round(v * 255); }); }
  function hex(c) { return '#' + c.map(function (v) { return ('0' + clamp(Math.round(v), 0, 255).toString(16)).slice(-2); }).join('').toUpperCase(); }
  function unhex(s) { var m = /^#?([0-9a-f]{6})$/i.exec(String(s || '').trim()); if (!m) return null; var n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  // Painter's wheel: purple's opposite is gold, not chartreuse.
  var RGB2RYB = [[0, 0], [60, 120], [120, 180], [180, 210], [240, 240], [300, 300], [360, 360]];
  function mapHue(h, tab, from, to) { h = ((h % 360) + 360) % 360; for (var i = 0; i < tab.length - 1; i++) { var a = tab[i], b = tab[i + 1]; if (h >= a[from] && h <= b[from]) { var t = (h - a[from]) / ((b[from] - a[from]) || 1); return a[to] + t * (b[to] - a[to]); } } return h; }
  function complement(h) { return mapHue(mapHue(h, RGB2RYB, 0, 1) + 180, RGB2RYB, 1, 0); }
  function ringPixels(cv, cx, cy, r0, r1) {
    var g = cv.getContext('2d'), x0 = Math.max(0, Math.floor(cx - r1)), y0 = Math.max(0, Math.floor(cy - r1));
    var w = Math.min(cv.width - x0, Math.ceil(r1 * 2)), h = Math.min(cv.height - y0, Math.ceil(r1 * 2));
    if (w < 1 || h < 1) return [];
    var d = g.getImageData(x0, y0, w, h).data, out = [];
    for (var y = 0; y < h; y += 3) for (var x = 0; x < w; x += 3) {
      var dd = Math.sqrt(Math.pow(x0 + x - cx, 2) + Math.pow(y0 + y - cy, 2));
      if (dd >= r0 && dd <= r1) { var i = (y * w + x) * 4; out.push([d[i], d[i + 1], d[i + 2]]); }
    }
    return out;
  }
  function avgOf(px) { if (!px.length) return [128, 128, 128]; var s = [0, 0, 0]; px.forEach(function (p) { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; }); return s.map(function (v) { return v / px.length; }); }
  function hueOf(px) { var bins = new Array(24).fill(0); px.forEach(function (p) { var hs = rgb2hsl(p[0], p[1], p[2]); if (hs[1] < 0.15) return; bins[Math.floor(hs[0] / 15) % 24] += hs[1]; }); var b = 0; for (var k = 1; k < 24; k++) if (bins[k] > bins[b]) b = k; return b * 15 + 7.5; }
  function dominant(cv) {
    var d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, bins = new Array(24).fill(0), acc = [];
    for (var i = 0; i < 24; i++) acc.push([0, 0]);
    for (var p = 0; p < d.length; p += 4 * 37) { var hs = rgb2hsl(d[p], d[p + 1], d[p + 2]); if (hs[1] < 0.25 || hs[2] < 0.15 || hs[2] > 0.85) continue; var b = Math.floor(hs[0] / 15) % 24, wt = hs[1]; bins[b] += wt; acc[b][0] += hs[1] * wt; acc[b][1] += hs[2] * wt; }
    var best = 0; for (var k = 1; k < 24; k++) if (bins[k] > bins[best]) best = k;
    var W = bins[best] || 1;
    return [best * 15 + 7.5, acc[best][0] / W || 0.5, acc[best][1] / W || 0.5];
  }
  function fitContrast(h, s, l, bg, min) { var c = hsl2rgb(h, s, l); if (ratio(c, bg) >= min) return c; var up = lum(bg[0], bg[1], bg[2]) < 0.25; for (var k = 0; k < 40; k++) { l = clamp(l + (up ? 0.02 : -0.02), 0, 1); c = hsl2rgb(h, s, l); if (ratio(c, bg) >= min) break; } return c; }
  function suggest(bg, insetCv, aroundHue) {
    var M = HC.ring.minContrast, out = [], dm = dominant(insetCv);
    out.push({ k: 'match', label: 'Match', c: fitContrast(dm[0], clamp(dm[1], 0.45, 0.8), clamp(dm[2], 0.35, 0.6), bg, M) });
    out.push({ k: 'contrast', label: 'Contrast', c: fitContrast(complement(aroundHue), 0.72, 0.58, bg, M) });
    out.push({ k: 'neutral', label: 'Neutral', c: ratio(HC.ring.light, bg) >= ratio(HC.ring.dark, bg) ? HC.ring.light : HC.ring.dark });
    out.forEach(function (o) { o.r = ratio(o.c, bg); });
    return out;
  }

  /* ════════════════════════════════════════════════════════════
     DRAWING THE COMPOSITE (any size: the same fractions)
     ════════════════════════════════════════════════════════════ */
  function insetDraw(I, r, ip) {
    var s = (2 * r / Math.min(I.width, I.height)) * ip.zoom, iw = I.width * s, ih = I.height * s;
    return { s: s, iw: iw, ih: ih };
  }
  function drawComposite(target, baseImg, insetImg, st, ringW) {
    var W = target.width, H = target.height, g = target.getContext('2d');
    g.clearRect(0, 0, W, H);
    g.drawImage(baseImg, 0, 0, W, H);
    if (!insetImg) return;
    var ci = st.circle, r = ci.d * W / 2, cx = ci.cx * W, cy = ci.cy * H, k = insetDraw(insetImg, r, st.ip);
    var ox = clamp(cx - st.ip.x * k.iw, cx + r - k.iw, cx - r), oy = clamp(cy - st.ip.y * k.ih, cy + r - k.ih, cy - r);
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip(); g.drawImage(insetImg, ox, oy, k.iw, k.ih); g.restore();
    var col = ringColor(st);
    if (col && ringW > 0) { var lw = ringW * W; g.lineWidth = lw; g.strokeStyle = col; g.beginPath(); g.arc(cx, cy, r - lw / 2, 0, Math.PI * 2); g.stroke(); }
  }
  function ringColor(st) {
    if (st.ring.none) return null;
    if (st.ring.pick === 'custom') return st.ring.color;
    var s = (st.sug || []).filter(function (o) { return o.k === st.ring.pick; })[0];
    return s ? hex(s.c) : (st.ring.color || null);
  }
  // ta-admaker v2.8.0 cropToEllipse, kept for the Ad Maker's move here.
  function cropToEllipse(img, box) {
    var W0 = img.naturalWidth || img.width, H0 = img.naturalHeight || img.height, b = box || { x: 0, y: 0, w: 1, h: 1 };
    var cv = mk(W0 * b.w, H0 * b.h); cv.getContext('2d').drawImage(img, Math.round(W0 * b.x), Math.round(H0 * b.y), cv.width, cv.height, 0, 0, cv.width, cv.height);
    var o = mk(cv.width, cv.height), g = o.getContext('2d');
    g.save(); g.beginPath(); g.ellipse(o.width / 2, o.height / 2, o.width / 2, o.height / 2, 0, 0, Math.PI * 2); g.clip(); g.drawImage(cv, 0, 0); g.restore();
    return o;
  }

  /* ════════════════════════════════════════════════════════════
     UPLOAD AND THE MEDIA ROW (from ta-admaker v2.8.0)
     ════════════════════════════════════════════════════════════ */
  function toBlob(cv, type, quality) {
    return new Promise(function (ok, bad) {
      try { cv.toBlob(function (b) { b ? ok(b) : bad(new Error('The picture could not be exported.')); }, type || 'image/png', quality); }
      catch (e) { bad(new Error('This photo is held where the browser may not export it (often Webflow\u2019s own copy). Upload the photo again, then try.')); }
    });
  }
  function upload(blob, name, up) {
    var pub = cfg().uploadcarePublicKey || (up && up.publicKey);
    var host = cfg().uploadcareBase || (up && up.base);
    if (!pub) return Promise.reject(new Error('No Uploadcare public key: set TA_CONFIG.uploadcarePublicKey or IX_CONFIG.uploadcare.publicKey.'));
    if (!host) return Promise.reject(new Error('No Uploadcare CDN address: set TA_CONFIG.uploadcareBase or IX_CONFIG.uploadcare.base.'));
    var fd = new FormData(); fd.append('UPLOADCARE_PUB_KEY', pub); fd.append('UPLOADCARE_STORE', '1'); fd.append('file', blob, name);
    return fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: fd, ixLabel: 'Uploadcare' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.file) throw new Error('Uploadcare returned no file id.');
        return { uuid: j.file, cdnUrl: String(host).replace(/\/$/, '') + '/' + j.file + '/' };
      });
  }
  function same(a, b) { return String(a == null ? '' : a).trim() === String(b == null ? '' : b).trim(); }
  function sameJson(a, b) { var x = recipeOf(a), y = recipeOf(b); return !!x && !!y && JSON.stringify(x) === JSON.stringify(y); }
  function mediaRow(up, o) {
    var c = cfg();
    if (!c.makeConditioner) return Promise.reject(new Error('TA_CONFIG.makeConditioner (Scenario B) is missing.'));
    var payload = {
      action: 'createMediaFromBrowserUpload', uploadcareUuid: up.uuid, uploadcareUrl: up.cdnUrl,
      originalFilename: o.name, mimeType: HC.out.type, titleSlug: c.titleSlug || '', taItemId: c.taItemId || '',
      componentRole: '', customerId: '', customerName: '', autoAttach: false, sourceChannel: 'composer',
      source: 'ix-photo-compose-v' + VERSION, articleItemId: o.articleId || '',
      imageRecipe: o.recipeRaw, altText: o.alt, caption: o.caption || ''
    };
    return fetch(c.makeConditioner, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), ixLabel: 'New inset photo' })
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {} return { r: r, j: j }; }); })
      .then(function (x) {
        var j = x.j;
        if (!x.r.ok || !j || j.ok !== true || !(j.mediaId || j.mediaItemId)) throw new Error('Scenario B did not confirm the MEDIA row.');
        var md = j.media || null;
        if (!md) throw new Error('Scenario B made the row but did not send it back, so the alt text and recipe cannot be confirmed. Import the Scenario B blueprint from this build.');
        if (!same(md['alt-text'], o.alt)) throw new Error('Scenario B wrote different alt text than was sent.');
        if (!sameJson(md['image-recipe'], o.recipeRaw)) throw new Error('Scenario B did not write the image-recipe. Check that MEDIA has the image-recipe field.');
        return { mediaId: j.mediaId || j.mediaItemId, media: md };
      });
  }

  /* ════════════════════════════════════════════════════════════
     AI ALT TEXT (TA_CONFIG.anthropicProxy, the ASF's own route)
     ════════════════════════════════════════════════════════════ */
  function altText(pic, headline, sourceAlts) {
    var proxy = cfg().anthropicProxy;
    if (!proxy) return Promise.reject(new Error('This page has no TA_CONFIG.anthropicProxy, so AI could not write the alt text.'));
    var k = Math.min(1, HC.alt.picMax / Math.max(pic.width, pic.height)), small = mk(pic.width * k, pic.height * k);
    small.getContext('2d').drawImage(pic, 0, 0, small.width, small.height);
    var data;
    try { data = small.toDataURL('image/jpeg', 0.85).split(',')[1]; }
    catch (e) { return Promise.reject(new Error('The picture could not be read for the AI (the photo is held where the browser may not export it).')); }
    var text = 'Article headline: ' + (headline || '(none)') + '\n' +
      'Alt text of the main photo: ' + (sourceAlts.base || '(none)') + '\n' +
      'Alt text of the round inset photo: ' + (sourceAlts.inset || '(none)');
    return fetch(proxy, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ixLabel: 'Alt text',
      body: JSON.stringify({ model: HC.alt.model, max_tokens: HC.alt.maxTokens, system: HC.alt.system,
        messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: data } }, { type: 'text', text: text }] }] })
    }).then(function (r) {
      return r.text().then(function (t) {
        var j; try { j = JSON.parse(t); } catch (e) { throw new Error('the AI proxy did not answer in JSON (HTTP ' + r.status + ')'); }
        if (!r.ok) throw new Error((j && j.error && (j.error.message || j.error)) || ('HTTP ' + r.status));
        var out = (j.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join(' ').replace(/\s+/g, ' ').replace(/^["']|["']$/g, '').trim();
        if (!out) throw new Error('the AI answered with no text');
        return out.slice(0, HC.alt.maxChars);
      });
    });
  }

  /* ════════════════════════════════════════════════════════════
     THE MODAL SHELL (mockup .modal, header, ⓘ, footer)
     ════════════════════════════════════════════════════════════ */
  function infoHTML(title, blurb, scenarios) {
    if (window.IxInfo && typeof window.IxInfo.badge === 'function') {
      return '<span class="ixpc-info">' + window.IxInfo.badge({ file: FILE, version: VERSION, title: title, blurb: blurb, scenarios: scenarios,
        companions: 'ix-photo-compose-v1.0.0.css \u00B7 ix-tokens \u00B7 ix-buttons \u00B7 ix-form-controls \u00B7 ix-info \u00B7 ix-progress' }) + '</span>';
    }
    return '<span class="ixpc-info"><button type="button" class="ixpc-info-btn" data-ixpc-info aria-label="About this screen">i</button>' +
      '<span class="ixpc-info-pop" hidden><b>' + FILE + '</b><br>' + esc(blurb) + '<br>' +
      scenarios.map(function (s) { return '<b>' + esc(s.name) + '</b> \u00B7 ' + esc(s.note); }).join('<br>') + '</span></span>';
  }
  function shell(o) {
    var ov = document.createElement('div');
    ov.className = 'ix-overlay ixpc-overlay';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', o.title);
    ov.innerHTML = '<div class="ixpc-modal">' +
      '<div class="ixpc-mh"><div><div class="ixpc-crumb">' + esc(o.crumb || '') + '</div><h2>' + esc(o.title) + '</h2></div>' +
        '<p class="ixpc-sub">' + esc(o.sub || '') + '</p>' + infoHTML(o.title, o.blurb, o.scenarios) + '</div>' +
      o.body +
      '<div class="ixpc-mf">' + o.footLeft + '<div class="ixpc-right">' + o.footRight + '</div></div>' +
      '<div class="ixpc-prog" data-ixpc-prog hidden><div class="ixpc-pcard"><h4 data-ixpc-prog-h></h4><div data-ixpc-steps></div></div></div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      var ib = e.target.closest('[data-ixpc-info]');
      if (ib) { var p = ib.nextElementSibling; if (p) p.hidden = !p.hidden; }
    });
    return ov;
  }
  // The mockup's step card. ix-progress also shows its own card for every
  // Make and Worker request; this one names the four steps of one Save.
  function Steps(ov, title, list) {
    var box = $(ov, '[data-ixpc-prog]'), host = $(ov, '[data-ixpc-steps]');
    $(ov, '[data-ixpc-prog-h]').textContent = title;
    host.innerHTML = list.map(function (s) { return '<div class="ixpc-pstep"><i></i><span>' + esc(s[0]) + '</span><small>' + esc(s[1] || '') + '</small></div>'; }).join('');
    box.hidden = false;
    var els = host.querySelectorAll('.ixpc-pstep');
    return {
      run: function (i) { els[i].className = 'ixpc-pstep run'; },
      done: function (i, note) { els[i].className = 'ixpc-pstep done'; if (note) els[i].querySelector('small').textContent = note; },
      fail: function (i) { els[i].className = 'ixpc-pstep bad'; },
      close: function () { box.hidden = true; }
    };
  }

  /* ════════════════════════════════════════════════════════════
     STAGE: photo, circle, handle, focus point, shading (mockup §5)
     ════════════════════════════════════════════════════════════ */
  function Stage(wrap, cv, src, crops, shapes, opts) {
    var self = this;
    self.hover = null; self.sc = 1;
    self.fit = function () {
      var S = src(); if (!S) return;
      var bw = wrap.clientWidth - 16, bh = wrap.clientHeight - 16, sc = Math.min(bw / S.width, bh / S.height);
      if (!(sc > 0)) return;
      cv.width = Math.round(S.width * sc); cv.height = Math.round(S.height * sc); self.sc = sc; self.draw();
    };
    self.draw = function () {
      var S = src(); if (!S) return;
      var g = cv.getContext('2d'), K = self.sc, W = S.width, H = S.height;
      g.clearRect(0, 0, cv.width, cv.height); g.drawImage(S, 0, 0, cv.width, cv.height);
      if (opts.keep()) {
        var ix = 0, iy = 0, ax = W, ay = H;
        shapes().forEach(function (sh) { if (sh.whole) return; var w = win(sh, W, H, crops()); ix = Math.max(ix, w.x); iy = Math.max(iy, w.y); ax = Math.min(ax, w.x + w.w); ay = Math.min(ay, w.y + w.h); });
        g.save(); g.fillStyle = 'rgba(20,20,30,.45)'; g.beginPath(); g.rect(0, 0, cv.width, cv.height); g.rect(ix * K, iy * K, Math.max(0, ax - ix) * K, Math.max(0, ay - iy) * K); g.fill('evenodd'); g.restore();
      }
      if (self.hover) { var hw = win(self.hover, W, H, crops()); g.save(); g.strokeStyle = '#E8C172'; g.lineWidth = 2; g.setLineDash([6, 4]); g.strokeRect(hw.x * K + 1, hw.y * K + 1, hw.w * K - 2, hw.h * K - 2); g.restore(); }
      var c = opts.circle && opts.circle();
      if (c) {
        var kn = self.knob();
        g.save(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.5; g.setLineDash([5, 4]); g.beginPath(); g.arc(c.cx * W * K, c.cy * H * K, c.d * W * K / 2 + 5, 0, 7); g.stroke();
        g.setLineDash([]); g.fillStyle = '#fff'; g.strokeStyle = '#1A3A3A'; g.lineWidth = 2; g.beginPath(); g.arc(kn.x, kn.y, 7, 0, 7); g.fill(); g.stroke(); g.restore();
      }
      var cr = crops();
      if (cr.focus) {
        var fx = cr.focus.x * W * K, fy = cr.focus.y * H * K;
        g.save(); g.strokeStyle = cr.focusSet ? '#C4A35A' : 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(fx, fy, 9, 0, 7);
        g.moveTo(fx - 15, fy); g.lineTo(fx - 4, fy); g.moveTo(fx + 4, fy); g.lineTo(fx + 15, fy); g.moveTo(fx, fy - 15); g.lineTo(fx, fy - 4); g.moveTo(fx, fy + 4); g.lineTo(fx, fy + 15); g.stroke(); g.restore();
      }
    };
    self.knob = function () { var c = opts.circle(), S = src(), K = self.sc, r = c.d * S.width * K / 2, a = Math.PI / 4; return { x: c.cx * S.width * K + r * Math.cos(a), y: c.cy * S.height * K + r * Math.sin(a) }; };
    var drag = null;
    function pt(e) { var b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; }
    cv.addEventListener('pointerdown', function (e) {
      var S = src(); if (!S) return;
      var p = pt(e), W = S.width, H = S.height, K = self.sc, f = crops().focus;
      drag = null;
      if (opts.circle && opts.circle()) {
        var kn = self.knob(), c = opts.circle();
        if (Math.hypot(p.x - kn.x, p.y - kn.y) < 12) drag = { t: 'size' };
        else if (Math.hypot(p.x - c.cx * W * K, p.y - c.cy * H * K) < c.d * W * K / 2) drag = { t: 'move', dx: p.x - c.cx * W * K, dy: p.y - c.cy * H * K };
      }
      if (!drag && f && Math.hypot(p.x - f.x * W * K, p.y - f.y * H * K) < 14) drag = { t: 'focus' };
      if (!drag) { drag = { t: 'focus' }; opts.setFocus(clamp(p.x / (W * K), 0, 1), clamp(p.y / (H * K), 0, 1)); }
      cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', function (e) {
      var S = src(); if (!S) return;
      var p = pt(e), W = S.width, H = S.height, K = self.sc;
      if (!drag) {
        var cur = 'crosshair';
        if (opts.circle && opts.circle()) { var kn = self.knob(), c = opts.circle(); if (Math.hypot(p.x - kn.x, p.y - kn.y) < 12) cur = 'nwse-resize'; else if (Math.hypot(p.x - c.cx * W * K, p.y - c.cy * H * K) < c.d * W * K / 2) cur = 'move'; }
        cv.style.cursor = cur; return;
      }
      if (drag.t === 'focus') opts.setFocus(clamp(p.x / (W * K), 0, 1), clamp(p.y / (H * K), 0, 1));
      else if (drag.t === 'move') opts.moveCircle((p.x - drag.dx) / (W * K), (p.y - drag.dy) / (H * K));
      else if (drag.t === 'size') { var c2 = opts.circle(); opts.sizeCircle(2 * Math.hypot(p.x - c2.cx * W * K, p.y - c2.cy * H * K) / (W * K)); }
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) { cv.addEventListener(ev, function () { if (drag && opts.dragEnd) opts.dragEnd(drag.t); drag = null; }); });
  }

  /* ════════════════════════════════════════════════════════════
     CROP PANEL: focus point, then one crop at a time (mockup §6)
     ════════════════════════════════════════════════════════════ */
  function CropPanel(host, src, crops, shapes, onChange, stage) {
    var self = this, EL = {};
    host.innerHTML = '<div class="ixpc-gh">Crops<span class="ixpc-focusline" data-fl></span><button type="button" class="ix-revert" data-allc>Cancel moved crops</button></div>' +
      '<div class="ixpc-crops" data-grid></div>' +
      '<div class="ixpc-note">Each crop as the site, newsletter and social share will build it. Drag inside a crop to line it up. The shapes are the Data Worker\u2019s list.</div>';
    var grid = $(host, '[data-grid]');
    shapes.forEach(function (sh) {
      var d = document.createElement('div');
      d.className = 'ixpc-crop' + (sh.whole ? ' whole' : '');
      d.innerHTML = '<div class="ixpc-cl">' + esc(sh.label) + '</div><div class="ixpc-box"><canvas></canvas></div><div class="ixpc-cs"></div>';
      grid.appendChild(d); EL[sh.key] = d;
      var cv = $(d, 'canvas'), drag = null;
      cv.addEventListener('pointerenter', function () { if (!sh.whole) { stage.hover = sh; stage.draw(); } });
      cv.addEventListener('pointerleave', function () { if (!drag) { stage.hover = null; stage.draw(); } });
      if (!sh.whole) {
        cv.addEventListener('pointerdown', function (e) { var S = src(); if (!S) return; drag = { x: e.clientX, y: e.clientY, w: win(sh, S.width, S.height, crops()) }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; });
        cv.addEventListener('pointermove', function (e) {
          if (!drag) return;
          var S = src(), W = S.width, H = S.height, w = drag.w, sc = cv.width / w.w;
          var nx = clamp(w.x - (e.clientX - drag.x) / sc, 0, W - w.w), ny = clamp(w.y - (e.clientY - drag.y) / sc, 0, H - w.h);
          if (!crops().shapes) crops().shapes = {};
          crops().shapes[sh.key] = { x: W - w.w > 0 ? +(nx / (W - w.w)).toFixed(4) : 0.5, y: H - w.h > 0 ? +(ny / (H - w.h)).toFixed(4) : 0.5 };
          onChange();
        });
        ['pointerup', 'pointercancel'].forEach(function (ev) { cv.addEventListener(ev, function () { drag = null; cv.style.cursor = 'grab'; }); });
      }
      $(d, '.ixpc-cs').addEventListener('click', function (e) {
        if (e.target.closest('[data-undo]')) { e.preventDefault(); delete crops().shapes[sh.key]; onChange(); }
      });
    });
    $(host, '[data-allc]').addEventListener('click', function (e) { e.preventDefault(); crops().shapes = {}; onChange(); });
    self.draw = function () {
      var S = src(); if (!S) return;
      var W = S.width, H = S.height, cr = crops(), anyMoved = false;
      shapes.forEach(function (sh) {
        var el = EL[sh.key], w = win(sh, W, H, cr), cv = $(el, 'canvas'), sc = Math.min(156 / w.w, 96 / w.h);
        cv.width = Math.max(1, Math.round(w.w * sc)); cv.height = Math.max(1, Math.round(w.h * sc));
        cv.getContext('2d').drawImage(S, w.x, w.y, w.w, w.h, 0, 0, cv.width, cv.height);
        var moved = !!(cr.shapes && cr.shapes[sh.key]); anyMoved = anyMoved || moved;
        el.classList.toggle('moved', moved);
        $(el, '.ixpc-cs').innerHTML = sh.whole ? 'Nothing to move'
          : moved ? 'Moved by you <button type="button" class="ix-revert" data-undo>cancel</button>'
          : (cr.focusSet ? 'Follows the focus point' : 'Automatic (face finder)');
      });
      $(host, '[data-allc]').style.visibility = anyMoved ? 'visible' : 'hidden';
      var f = cr.focus;
      $(host, '[data-fl]').textContent = !cr.focusSet ? 'Automatic crop. Click the photo to set a focus point.'
        : 'Focus point ' + Math.round(f.x * 100) + '% across, ' + Math.round(f.y * 100) + '% down. Crops you have not moved centre on it.';
    };
  }

  // Panel state <-> stored crops.
  function cropsState(stored) {
    var c = stored && typeof stored === 'object' ? stored : null;
    return { focus: c && c.focus ? { x: +c.focus.x, y: +c.focus.y } : { x: 0.5, y: 0.5 }, focusSet: !!(c && c.focus),
             shapes: c && c.shapes ? clone(c.shapes) : {} };
  }
  function cropsStored(st, px) {
    var hasShapes = st.shapes && Object.keys(st.shapes).length;
    if (!st.focusSet && !hasShapes) return null;
    var o = { shapes: hasShapes ? clone(st.shapes) : {}, px: { w: Math.round(px.w), h: Math.round(px.h) } };
    if (st.focusSet) o.focus = { x: +st.focus.x.toFixed(4), y: +st.focus.y.toFixed(4) };
    return o;
  }
  function cropsKey(c) { return JSON.stringify(c ? { f: c.focus || null, s: c.shapes || {} } : null); }

  function lockScroll(on) { document.documentElement.classList.toggle('ixpc-locked', !!on); }

  /* ════════════════════════════════════════════════════════════
     ADJUST CROPS (mockup stage 3)
     ════════════════════════════════════════════════════════════ */
  function openCrops(o) {
    o = o || {};
    var shapes = (o.shapes || []).slice();
    if (!shapes.length) { if (o.onCancel) o.onCancel(new Error('The Data Worker sent no crop shapes.')); return; }
    var startStored = (recipeOf(o.recipe) || {}).crops || null;
    var st = cropsState(startStored), img = null, px = null;
    var others = (o.otherShareArticles || []).filter(Boolean);
    var ov = shell({
      title: 'Adjust Crops', crumb: o.crumb, sub: o.sub,
      blurb: 'Positions save to this photo\u2019s MEDIA row (image-recipe) through Scenario G when the article form is saved. The Data Worker then builds each crop at that position instead of the automatic face finder. The photo itself is never cropped or changed.',
      scenarios: [{ name: 'Worker \u2014 ix-issue-data', note: '/media?photo=1: the crop shapes and this photo\u2019s recipe' },
                  { name: 'Scenario G \u2014 updateMediaText', note: 'writes image-recipe on the article form\u2019s Save' }],
      body: '<div class="ixpc-abody"><div class="ixpc-ccol">' +
        '<div class="ixpc-stagebar"><span>Click the photo to set the focus point. Every crop centres on it.</span><label><input type="checkbox" data-keep checked> Shade what a crop cuts</label></div>' +
        '<div class="ixpc-stagewrap" data-wrap><canvas data-cv></canvas><div class="ixpc-hint" data-hint>Loading the photo\u2026</div></div>' +
        '<div class="ixpc-cropstrip" data-crops></div></div></div>',
      footLeft: '<button type="button" class="ix-revert" data-auto>Back to automatic crop</button><span class="ixpc-why" data-why></span>',
      footRight: '<button type="button" class="ix-revert" data-cancel>Cancel</button><button type="button" class="ix-btn ix-btn--primary" data-use disabled>Use these crops</button>'
    });
    lockScroll(true);
    var stage, panel;
    function changed() { return cropsKey(cropsStored(st, px || { w: 1, h: 1 })) !== cropsKey(startStored); }
    function update() {
      if (!img) return;
      stage.draw(); panel.draw();
      var why = $(ov, '[data-why]');
      why.className = 'ixpc-why ixpc-why--info';
      why.textContent = (changed() && others.length)
        ? 'These articles use this photo as their share image and keep the old framing until each is saved: ' + others.join(', ') + '.' : '';
      $(ov, '[data-use]').disabled = !changed();
      $(ov, '[data-auto]').style.visibility = (st.focusSet || Object.keys(st.shapes).length) ? 'visible' : 'hidden';
    }
    function close() { lockScroll(false); window.removeEventListener('resize', onResize); document.removeEventListener('keydown', onKey, true); ov.remove(); }
    function onResize() { if (stage) stage.fit(); }
    function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); if (o.onCancel) o.onCancel(); } }
    window.addEventListener('resize', onResize); document.addEventListener('keydown', onKey, true);
    $(ov, '[data-cancel]').onclick = function () { close(); if (o.onCancel) o.onCancel(); };
    $(ov, '[data-auto]').onclick = function () { st = cropsState(null); update(); };
    $(ov, '[data-keep]').onchange = function () { if (stage) stage.draw(); };
    $(ov, '[data-use]').onclick = function () { var out = cropsStored(st, px); close(); if (o.onUse) o.onUse(out); };
    loadImg(workUrl(o.photo && o.photo.url)).then(function (i) {
      if (!document.body.contains(ov)) return;
      if (!i) { $(ov, '[data-hint]').textContent = 'The photo did not load from Uploadcare.'; return; }
      img = i;
      var nat = (o.photo && o.photo.w && o.photo.h) ? { w: +o.photo.w, h: +o.photo.h } : null;
      // Fractions do not depend on size; px records the photo's true size when MEDIA has it.
      px = nat || (startStored && startStored.px) || { w: i.naturalWidth, h: i.naturalHeight };
      $(ov, '[data-hint]').hidden = true;
      stage = new Stage($(ov, '[data-wrap]'), $(ov, '[data-cv]'), function () { return img; }, function () { return st; }, function () { return shapes; },
        { keep: function () { return $(ov, '[data-keep]').checked; }, setFocus: function (x, y) { st.focus = { x: x, y: y }; st.focusSet = true; update(); } });
      panel = new CropPanel($(ov, '[data-crops]'), function () { return img; }, function () { return st; }, shapes, update, stage);
      requestAnimationFrame(function () { stage.fit(); update(); });
    });
  }

  /* ════════════════════════════════════════════════════════════
     NEW INSET PHOTO (mockup stage 2)
     ════════════════════════════════════════════════════════════ */
  function openComposer(o) {
    o = o || {};
    var F = o.facts || {}, shapes = (F.shapes || []).slice(), inset = F.inset || {}, up = F.upload || {};
    var rc = (recipeOf(o.recipe) || {}).composite || null;
    var choices = (o.choices || []).filter(function (c) { return c && c.id && c.url && c.id !== (o.base && o.base.id); });
    var ringW = inset.ringWidth || 0;
    var C = {
      insetId: rc ? rc.sources.inset : null,
      circle: rc ? clone(rc.circle) : { cx: 0.78, cy: 0.3, d: clamp(inset.circleStart || 0.28, HC.circle.min, HC.circle.max) },
      ip: rc && rc.insetCrop ? clone(rc.insetCrop) : { x: 0.5, y: 0.45, zoom: 1.2 },
      ring: rc ? (rc.ring && rc.ring.color ? { pick: 'custom', color: rc.ring.color, none: false } : { pick: 'contrast', color: null, none: true }) : { pick: 'contrast', color: null, none: false },
      crops: cropsState(((recipeOf(o.recipe) || {}).crops) || null),
      alt: o.mode === 'edit' ? (o.alt || '') : '', altAI: false, altBusy: false, altErr: '',
      caption: o.caption || '', sug: [], saving: false
    };
    var BASE = null, IMGS = {}, WORK = null, SMALL = null;
    var titleWord = o.mode === 'edit' ? 'Edit Inset Photo' : 'New Inset Photo';
    var ov = shell({
      title: titleWord, crumb: o.crumb, sub: 'Base: ' + ((o.base && o.base.name) || ''),
      blurb: 'Builds the picture in the browser at the base photo\u2019s full size, uploads it to Uploadcare, then Scenario B (createMediaFromBrowserUpload) makes the MEDIA row with its image-recipe. Crop shapes come from the Data Worker (ix-issue-data), never typed here. The two photos it uses are not changed.',
      scenarios: [{ name: 'Worker \u2014 ix-issue-data', note: '/media?photo=1: crop shapes, ring width and circle size (TITLES-ADMIN design-json)' },
                  { name: 'Scenario B \u2014 Route 4', note: 'createMediaFromBrowserUpload, sourceChannel composer: the new MEDIA row' },
                  { name: 'Uploadcare', note: 'stores the flattened picture' },
                  { name: 'AI proxy (TA_CONFIG.anthropicProxy)', note: 'writes the alt text from the finished picture' }],
      body: '<div class="ixpc-cbody">' +
        '<div class="ixpc-ccol ixpc-side">' +
          '<div class="ixpc-gh">Inset photo</div><p class="ixpc-gsub">From this article\u2019s tray only.</p>' +
          '<div class="ixpc-thumbs" data-thumbs></div>' +
          '<div class="ixpc-frame-row"><div class="ixpc-minicirc" data-mini title="Drag to move the photo inside the circle"><canvas width="192" height="192"></canvas></div>' +
            '<div class="ixpc-zoom"><span>Drag the circle to frame the face. Zoom:</span><input type="range" data-zoom min="1" max="2.5" step="0.01"></div></div>' +
          '<div class="ixpc-gh">Ring</div>' +
          '<div class="ixpc-swatches" data-sw></div>' +
          '<div class="ixpc-ringrow" data-ringrow><input type="color" data-color aria-label="Any ring colour"><input class="ixpc-hex" data-hex aria-label="Ring colour code"><label><input type="checkbox" data-none> No ring</label></div>' +
          '<div class="ixpc-note">Suggestions come from these two photos and update as the circle moves. Width is the title\u2019s setting.</div>' +
          '<div class="ixpc-field"><div class="ixpc-lrow"><label>Alt text <em>required</em></label><span class="ixpc-aib" data-aib hidden>' +
            '<span class="ix-ai-badge ix-ai-badge--sm" aria-hidden="true"><svg class="ix-ai-badge__glyph" viewBox="0 0 16 16"><path class="ix-ai-star ix-ai-star--lg" d="M6 1.6 L7.05 4.95 L10.4 6 L7.05 7.05 L6 10.4 L4.95 7.05 L1.6 6 L4.95 4.95 Z"/><path class="ix-ai-star ix-ai-star--md" d="M12.1 7.2 L12.75 9.25 L14.8 9.9 L12.75 10.55 L12.1 12.6 L11.45 10.55 L9.4 9.9 L11.45 9.25 Z"/><path class="ix-ai-star ix-ai-star--sm" d="M4.3 11.2 L4.75 12.6 L6.15 13.05 L4.75 13.5 L4.3 14.9 L3.85 13.5 L2.45 13.05 L3.85 12.6 Z"/></svg></span>AI written</span>' +
            '<button type="button" class="ix-revert" data-again hidden>Write again</button></div>' +
            '<textarea data-alt class="ixpc-alt" placeholder="Written by AI once the inset photo is picked"></textarea></div>' +
          '<div class="ixpc-field"><label>Caption <em>optional</em></label><textarea data-cap></textarea></div>' +
        '</div>' +
        '<div class="ixpc-ccol">' +
          '<div class="ixpc-stagebar"><span>Drag the circle. Drag its handle to resize. Click the photo to set the focus point.</span><label><input type="checkbox" data-keep checked> Shade what a crop cuts</label></div>' +
          '<div class="ixpc-stagewrap" data-wrap><canvas data-cv></canvas><div class="ixpc-hint" data-hint>Loading the photos\u2026</div></div>' +
          '<div class="ixpc-cropstrip" data-crops></div>' +
        '</div></div>',
      footLeft: '<span class="ixpc-why" data-why></span>',
      footRight: '<button type="button" class="ix-revert" data-cancel>Cancel</button><button type="button" class="ix-btn ix-btn--primary" data-save disabled>Save inset photo</button>'
    });
    lockScroll(true);
    $(ov, '[data-alt]').value = C.alt;
    $(ov, '[data-cap]').value = C.caption;
    $(ov, '[data-zoom]').value = C.ip.zoom;
    $(ov, '[data-none]').checked = !!C.ring.none;
    var stage = null, panel = null;

    function insetImg() { return C.insetId ? IMGS[C.insetId] : null; }
    function insetChoice() { return choices.filter(function (x) { return x.id === C.insetId; })[0] || null; }
    function rebuildWork() {
      if (!BASE) return;
      if (!WORK) { var k = Math.min(1, HC.workMax / Math.max(BASE.naturalWidth, BASE.naturalHeight)); WORK = mk(BASE.naturalWidth * k, BASE.naturalHeight * k); }
      drawComposite(WORK, BASE, insetImg(), C, ringW);
    }
    function insetCircleCanvas() {
      var o2 = mk(192, 192), I = insetImg(); if (!I) return o2;
      var r = 96, k = insetDraw(I, r, C.ip);
      var ox = clamp(r - C.ip.x * k.iw, 2 * r - k.iw, 0), oy = clamp(r - C.ip.y * k.ih, 2 * r - k.ih, 0);
      o2.getContext('2d').drawImage(I, ox, oy, k.iw, k.ih); return o2;
    }
    function refreshSuggestions() {
      C.sug = [];
      if (!C.insetId || !BASE) return;
      try {
        if (!SMALL) { SMALL = mk(WORK.width, WORK.height); SMALL.getContext('2d').drawImage(BASE, 0, 0, SMALL.width, SMALL.height); }
        var W = SMALL.width, H = SMALL.height, ci = C.circle, r = ci.d * W / 2, rw = Math.max(ringW, 0.006) * W;
        var bg = avgOf(ringPixels(SMALL, ci.cx * W, ci.cy * H, r, r + rw * 3));
        var hue = hueOf(ringPixels(SMALL, ci.cx * W, ci.cy * H, r, r + rw * 6));
        C.sug = suggest(bg, insetCircleCanvas(), hue);
      } catch (e) { C.sug = []; C.sugErr = 'Suggestions need both photos to load from Uploadcare.'; }
    }
    function drawThumbs() {
      var h = $(ov, '[data-thumbs]'), html = '';
      html += '<button type="button" class="ixpc-th" disabled title="This is the base photo"><img alt="" src="' + esc(thumb(o.base.url)) + '"><span class="ixpc-tl">Base</span></button>';
      choices.forEach(function (c) {
        html += '<button type="button" class="ixpc-th" data-pick="' + esc(c.id) + '" aria-pressed="' + (c.id === C.insetId) + '" title="' + esc(c.name || '') + '"><img alt="" src="' + esc(thumb(c.url)) + '"></button>';
      });
      if (!choices.length) html += '<p class="ixpc-gsub" style="grid-column:1/-1">This article has no other photo. Add one to the tray first.</p>';
      h.innerHTML = html;
    }
    function thumb(url) { var b = ucBase(url); return b ? b + '-/preview/160x160/-/format/auto/' : url; }
    function drawSwatches() {
      var h = $(ov, '[data-sw]');
      h.innerHTML = '';
      if (!C.insetId) { h.innerHTML = '<div class="ixpc-note" style="grid-column:1/-1">Suggestions appear once the inset photo is picked.</div>'; }
      else if (!C.sug.length) { h.innerHTML = '<div class="ixpc-note" style="grid-column:1/-1">' + esc(C.sugErr || 'No suggestions.') + '</div>'; }
      C.sug.forEach(function (s) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'ixpc-sw';
        b.setAttribute('aria-pressed', (!C.ring.none && C.ring.pick === s.k) ? 'true' : 'false');
        b.innerHTML = '<i style="background:' + hex(s.c) + '"></i><span>' + s.label + '</span><small>' + s.r.toFixed(1) + ':1 on the photo</small>';
        b.onclick = function () { C.ring.pick = s.k; C.ring.none = false; $(ov, '[data-none]').checked = false; update(); };
        h.appendChild(b);
      });
      var col = ringColor(C) || '#FFFFFF';
      $(ov, '[data-color]').value = col.toLowerCase();
      if (document.activeElement !== $(ov, '[data-hex]')) $(ov, '[data-hex]').value = C.ring.none ? '' : col;
      $(ov, '[data-ringrow]').classList.toggle('changed', C.ring.pick === 'custom' && !C.ring.none);
    }
    function whyNot() {
      if (inset.missing && inset.missing.length) return 'Missing title setting: ' + inset.missing.join(', ') + '. Add it, then try again.';
      if (up.missing && up.missing.length && !(cfg().uploadcarePublicKey && cfg().uploadcareBase)) return 'Missing upload setting: ' + up.missing.join(', ') + '.';
      if (!BASE) return 'Loading the base photo.';
      if (!C.insetId) return 'Pick the inset photo first.';
      if (!insetImg()) return 'Loading the inset photo.';
      if (C.altBusy) return 'Writing the alt text.';
      if (!C.alt.trim()) return C.altErr ? 'AI could not write the alt text (' + C.altErr + '). Write it, then Save.' : 'Alt text is needed before Save.';
      return '';
    }
    function update() {
      rebuildWork();
      if (stage) stage.draw();
      if (panel) panel.draw();
      var mini = $(ov, '[data-mini] canvas'); mini.getContext('2d').clearRect(0, 0, 192, 192);
      if (insetImg()) mini.getContext('2d').drawImage(insetCircleCanvas(), 0, 0);
      drawSwatches();
      $(ov, '[data-hint]').hidden = !!(BASE && C.insetId);
      if (BASE && !C.insetId) { $(ov, '[data-hint]').hidden = false; $(ov, '[data-hint]').textContent = 'Pick the inset photo on the left'; }
      var ta = $(ov, '[data-alt]');
      ta.disabled = C.altBusy; ta.classList.toggle('busy', C.altBusy);
      if (C.altBusy) ta.value = 'Writing the alt text from both photos\u2026'; else if (ta.value !== C.alt) ta.value = C.alt;
      ta.classList.toggle('need', !C.alt.trim() && !C.altBusy);
      $(ov, '[data-aib]').hidden = !(C.altAI && !C.altBusy);
      $(ov, '[data-again]').hidden = !(C.insetId && !C.altBusy);
      Array.prototype.forEach.call(ov.querySelectorAll('[data-pick]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-pick') === C.insetId ? 'true' : 'false'); });
      var why = whyNot(), w = $(ov, '[data-why]');
      w.textContent = why; w.className = 'ixpc-why';
      $(ov, '[data-save]').disabled = !!why || C.saving;
    }
    function writeAlt() {
      if (!C.insetId || !insetImg()) return;
      C.altBusy = true; C.altAI = false; C.altErr = ''; update();
      var full = mk(WORK.width, WORK.height); drawComposite(full, BASE, insetImg(), C, ringW);
      var ch = insetChoice() || {};
      altText(full, o.headline || '', { base: (o.base && o.base.alt) || '', inset: ch.alt || '' })
        .then(function (t) { C.altBusy = false; C.alt = t; C.altAI = true; update(); })
        .catch(function (e) { C.altBusy = false; C.altErr = (e && e.message) || String(e); update(); });
    }
    function pick(id) {
      if (C.saving) return;
      C.insetId = id;
      C.ip = { x: 0.5, y: 0.45, zoom: 1.2 }; $(ov, '[data-zoom]').value = 1.2;
      var ch = insetChoice();
      update();
      loadImg(workUrl(ch.url)).then(function (i) {
        if (!document.body.contains(ov) || C.insetId !== id) return;
        if (!i) { C.insetId = null; $(ov, '[data-why]').textContent = 'That photo did not load from Uploadcare.'; return; }
        IMGS[id] = i; refreshSuggestions(); update(); writeAlt();
      });
    }

    function close() { lockScroll(false); window.removeEventListener('resize', onResize); document.removeEventListener('keydown', onKey, true); ov.remove(); }
    function onResize() { if (stage) stage.fit(); }
    function onKey(e) { if (e.key === 'Escape' && !C.saving) { e.preventDefault(); e.stopPropagation(); close(); if (o.onCancel) o.onCancel(); } }
    window.addEventListener('resize', onResize); document.addEventListener('keydown', onKey, true);

    // Cancel: nothing is kept; the article form stays as it was before this opened.
    $(ov, '[data-cancel]').onclick = function () { if (C.saving) return; close(); if (o.onCancel) o.onCancel(); };
    $(ov, '[data-keep]').onchange = function () { if (stage) stage.draw(); };
    $(ov, '[data-zoom]').oninput = function () { C.ip.zoom = +this.value; update(); };
    $(ov, '[data-color]').oninput = function () { C.ring.pick = 'custom'; C.ring.color = this.value.toUpperCase(); C.ring.none = false; $(ov, '[data-none]').checked = false; update(); };
    $(ov, '[data-hex]').onchange = function () { var c = unhex(this.value); if (c) { C.ring.pick = 'custom'; C.ring.color = hex(c); C.ring.none = false; $(ov, '[data-none]').checked = false; } update(); };
    $(ov, '[data-none]').onchange = function () { C.ring.none = this.checked; update(); };
    $(ov, '[data-alt]').oninput = function () { C.alt = this.value; C.altAI = false; update(); };
    $(ov, '[data-cap]').oninput = function () { C.caption = this.value; };
    $(ov, '[data-again]').onclick = function () { writeAlt(); };
    $(ov, '[data-thumbs]').addEventListener('click', function (e) { var b = e.target.closest('[data-pick]'); if (b) pick(b.getAttribute('data-pick')); });
    var mini = $(ov, '[data-mini]'), md = null;
    mini.addEventListener('pointerdown', function (e) { if (!insetImg()) return; md = { x: e.clientX, y: e.clientY, ix: C.ip.x, iy: C.ip.y }; mini.setPointerCapture(e.pointerId); mini.style.cursor = 'grabbing'; });
    mini.addEventListener('pointermove', function (e) {
      if (!md) return;
      var I = insetImg(), s = (96 / Math.min(I.width, I.height)) * C.ip.zoom;
      C.ip.x = clamp(md.ix - (e.clientX - md.x) / (I.width * s), 0, 1); C.ip.y = clamp(md.iy - (e.clientY - md.y) / (I.height * s), 0, 1); update();
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) { mini.addEventListener(ev, function () { if (md) refreshSuggestions(); md = null; mini.style.cursor = 'grab'; update(); }); });

    $(ov, '[data-save]').onclick = function () {
      if (whyNot() || C.saving) return;
      C.saving = true; update();
      var steps = Steps(ov, 'Saving the inset photo', [['Building the picture at full size', ''], ['Uploading to Uploadcare', ''], ['Making the MEDIA row', 'Scenario B'], ['Setting it as Main', 'article form']]);
      var ch = insetChoice(), out = null, recipe = null, recipeRaw = '', name = '';
      steps.run(0);
      Promise.all([loadImg(fullUrl(o.base.url)), loadImg(fullUrl(ch.url))]).then(function (two) {
        var Bf = two[0], If = two[1];
        if (!Bf || !If) throw new Error('A photo did not load at full size from Uploadcare.');
        var k = Math.min(1, HC.outMax / Math.max(Bf.naturalWidth, Bf.naturalHeight));
        out = mk(Bf.naturalWidth * k, Bf.naturalHeight * k);
        drawComposite(out, Bf, If, C, ringW);
        recipe = { v: 1, composite: {
          sources: { base: o.base.id, inset: C.insetId },
          circle: { cx: +C.circle.cx.toFixed(4), cy: +C.circle.cy.toFixed(4), d: +C.circle.d.toFixed(4) },
          insetCrop: { x: +C.ip.x.toFixed(4), y: +C.ip.y.toFixed(4), zoom: +(+C.ip.zoom).toFixed(3) },
          ring: { width: ringW, color: ringColor(C) },
          output: { w: out.width, h: out.height } } };
        var cr = cropsStored(C.crops, { w: out.width, h: out.height });
        if (cr) recipe.crops = cr;
        recipeRaw = JSON.stringify(recipe);
        name = String((o.base.name || 'photo').replace(/\.[a-z0-9]+$/i, '').replace(/^IMG___/, '')).replace(/[^A-Za-z0-9._-]+/g, '-') + '-inset-' + (o.nextNumber || 1) + '.' + HC.out.ext;
        steps.done(0, out.width + ' \u00D7 ' + out.height);
        steps.run(1);
        return toBlob(out, HC.out.type, HC.out.quality);
      }).then(function (blob) {
        return upload(blob, name, up);
      }).then(function (u) {
        steps.done(1); steps.run(2);
        return mediaRow(u, { name: name, articleId: o.articleId, recipeRaw: recipeRaw, alt: C.alt.trim(), caption: C.caption.trim(), w: out.width, h: out.height })
          .then(function (m) { return { u: u, m: m }; });
      }).then(function (x) {
        steps.done(2); steps.run(3);
        var res = { mediaId: x.m.mediaId, url: x.u.cdnUrl, name: name, recipe: recipe, recipeRaw: recipeRaw,
                    alt: C.alt.trim(), caption: C.caption.trim(), w: out.width, h: out.height, media: x.m.media };
        setTimeout(function () { steps.done(3); setTimeout(function () { close(); if (o.onSaved) o.onSaved(res); }, 350); }, 250);
      }).catch(function (e) {
        C.saving = false;
        steps.close();
        update();
        var w = $(ov, '[data-why]'); w.className = 'ixpc-why'; w.textContent = 'NOT SAVED: ' + ((e && e.message) || String(e));
      });
    };

    // Load the base, and the inset when rebuilding.
    loadImg(workUrl(o.base && o.base.url)).then(function (i) {
      if (!document.body.contains(ov)) return;
      if (!i) { $(ov, '[data-hint]').textContent = 'The base photo did not load from Uploadcare.'; return; }
      if (!canExport(i)) { $(ov, '[data-hint]').textContent = 'This photo is held where the browser may not export it (often Webflow\u2019s own copy). Upload the photo again, then make the inset photo.'; return; }
      BASE = i;
      rebuildWork();
      drawThumbs();
      stage = new Stage($(ov, '[data-wrap]'), $(ov, '[data-cv]'), function () { return WORK; }, function () { return C.crops; }, function () { return shapes; }, {
        keep: function () { return $(ov, '[data-keep]').checked; },
        circle: function () { return C.insetId ? C.circle : null; },
        setFocus: function (x, y) { C.crops.focus = { x: x, y: y }; C.crops.focusSet = true; update(); },
        moveCircle: function (x, y) { var W = WORK.width, H = WORK.height, r = C.circle.d * W / 2; C.circle.cx = clamp(x, r / W, 1 - r / W); C.circle.cy = clamp(y, r / H, 1 - r / H); update(); },
        sizeCircle: function (d) { var W = WORK.width, H = WORK.height; d = clamp(d, HC.circle.min, HC.circle.max); var r = d * W / 2; C.circle.d = d; C.circle.cx = clamp(C.circle.cx, r / W, 1 - r / W); C.circle.cy = clamp(C.circle.cy, r / H, 1 - r / H); update(); },
        dragEnd: function (t) { if (t === 'move' || t === 'size') { refreshSuggestions(); update(); } }
      });
      panel = new CropPanel($(ov, '[data-crops]'), function () { return WORK; }, function () { return C.crops; }, shapes, update, stage);
      requestAnimationFrame(function () { stage.fit(); update(); });
      if (C.insetId) {
        var ch = insetChoice();
        if (!ch) { C.insetId = null; update(); $(ov, '[data-why]').textContent = 'The inset photo this was built from is gone, so it cannot be rebuilt as it was. Pick another inset photo.'; return; }
        loadImg(workUrl(ch.url)).then(function (j) { if (!j) return; IMGS[C.insetId] = j; refreshSuggestions(); update(); });
      }
    });
    update();
  }

  window.IxPhotoCompose = {
    version: VERSION,
    facts: facts,
    openCrops: openCrops,
    openComposer: openComposer,
    alignFor: alignFor,
    recipeOf: recipeOf,
    // Shared with the Ad Maker's move onto this module.
    loadImg: loadImg, cropToEllipse: cropToEllipse, toBlob: toBlob, upload: upload,
    _hc: HC
  };
})();
