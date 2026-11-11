/* ix-print-photo-v1.0.1.js */
/* ============================================================
   ix-print-photo-v1.0.1.js
   INBXIFY · ix component series · A PHOTO FROM THE PRINT PAGE
   Stylesheet unchanged: ix-print-photo-v1.0.0.css.

   v1.0.1 (11 Nov 2026, Grab from print + the spread) — TWO ADDITIONS.
     · IxPrintPhoto.stitch(urls) -> Promise<dataURL>: draws two (or more)
       pages side by side as one picture, every page scaled to the height
       of the first. Both hosts use it for "Show the spread", so a photo
       that crosses the gutter can be boxed in one go (Jeff, 11 Nov).
     · s.startSelect(): puts a session straight into select mode, for a
       button that opens the page ready to box (the Edit Article form's
       Grab from print).
     Nothing else changes.

   v1.0.0 (11 Nov 2026, Print Photo on Edit Article) — NEW.
   SPEC: Print-Photo-Edit-Article-Scoping-v0_1.md, decisions 1 to 5
   all YES (Jeff, 11 Nov).

   WHAT IT DOES
     Moved out of ta-create-from-print v1.2.6, where it could only be
     used inside Create from print. Now any surface that shows a
     printed page can use it. Today: Create from print (v1.2.7) and
     the Edit Article print panel (ta-asf v1.12.7).
       · SELECT: drag a box around a photo on the printed page. The
         crop is cut from the host's crop source, which may be a sharper
         drawing of the same page than the one on screen.
       · FIND THE SOURCE: the crop goes to Uploadcare and Google Lens
         opens with it already searched.
       · SAVE THE CROP: downloads it.
       · GENERATE A SIMILAR ONE: its own window. Claude looks at the
         crop and writes one long prompt that recreates the same scene;
         people are made generic, text and logos left out. The prompt
         is editable. Generate runs the fluxgen Worker at the crop's
         shape. "Use this photo" has Scenario L make an Available MEDIA
         row (provenance ai-flux-2-pro, the prompt, "similar to print")
         and hands the row to the host.
     The code, the prompt and the window are the ones Create from print
     shipped (v1.2.0 to v1.2.4), with one change below.

   CHANGED FROM CREATE FROM PRINT v1.2.6
     · The prompt now asks for each person's BUILD (slender, average,
       heavyset), with arms and hands that match their age and build.
       Jeff's September complaint: an older woman with heavy, muscular
       arms on a petite frame. Decision 5, 11 Nov.
     · Styles live in ix-print-photo-v1.0.0.css, prefixed ixpp-, not
       injected from JS. If that file is missing, the panel says so.
     · The Generate window carries the system-wide ⓘ badge.

   API
     var s = IxPrintPhoto.session({
       onChange:    function () {},       // the host draws again
       cropSource:  function (img) {},    // -> Promise<url|dataURL> or a
                                          //    url; the same page as img,
                                          //    any size
       context:     function () {},       // -> { title, issueName, page }
       sourceTag:   'ta-asf-v1.12.7',     // goes in the MEDIA provenance
       onUsed:      function (media) {}   // after Scenario L confirms:
                                          //    { mediaId, name, imageUrl,
                                          //      originalFilename, uuid,
                                          //      width, height, prompt }
     });
     s.mode                  'idle' | 'select' | 'cutting' | 'have'
     s.selectButton(o)       HTML; '' unless idle. o: { label, primary }
     s.pageClass()           ' ixpp-page--select' while selecting: put it
                             on the element that wraps the page image
     s.imgAttrs()            attributes for the page <img> while selecting
     s.panelHtml(o)          HTML under the page. o: { fileName, usedNote }
     s.handleClick(e)        true when the click was this module's
     s.handleMouseDown(e)    true when it started a box
     s.reset()               back to idle, window closed
     s.destroy()             same, for when the host closes
   The host owns its own draw. This module never writes the host's DOM
   except the Generate window, which it appends to <body>.

   TOAST-TRUTH: "Use this photo" reports success only when Scenario L
   answers ok:true with a mediaId.

   HARDCODING (provisional ids; the doc-maintenance chat numbers them)
     Moved here from Create from print, ids kept:
       HC-P-CFP-20  Flux long edge 1440, aspect clamp 1:2 to 2:1, grid
                    16; minimum box 40 px (HC.flux, HC.minBox)
       HC-P-CFP-21  Google Lens URL (HC.lens)
       HC-P-CFP-22  prompt length 150 to 230 words; max_tokens 1400
                    (HC.prompt)
     New:
       HC-P-PP-2    this module's own copy of the vision model
                    'claude-sonnet-4-6' (HC.model). Create from print
                    keeps HC-P-CFP-16 for its picture pass.

   Companions: ix-print-photo-v1.0.0.css, ix-tokens, ix-buttons,
   ix-form-controls (ix-revert), ix-info. Pathways: TA_CONFIG.
   anthropicProxy (inbxify-anthropic-proxy), TA_CONFIG.fluxGen (fluxgen
   Worker), TA_CONFIG.makeGenerateMedia (Scenario L),
   TA_CONFIG.uploadcarePublicKey (Find the source).
   ============================================================ */
(function () {
  'use strict';
  if (window.IxPrintPhoto) return;

  var VERSION = '1.0.1';
  var FILE = 'ix-print-photo-v1.0.1.js';
  var CSS_FILE = 'ix-print-photo-v1.0.0.css';
  var TAG = '[ix-print-photo v' + VERSION + ']';

  var HC = {
    model: 'claude-sonnet-4-6',                                  // HC-P-PP-2
    flux: { edge: 1440, minAspect: 0.5, maxAspect: 2, grid: 16 }, // HC-P-CFP-20
    minBox: 40,                                                   // HC-P-CFP-20
    lens: 'https://lens.google.com/uploadbyurl?url=',             // HC-P-CFP-21
    prompt: { maxTokens: 1400 }                                   // HC-P-CFP-22
  };

  var PROMPT_SYSTEM = [                                           // HC-P-CFP-22
    'You write image-generation prompts for Flux 2 Pro for a local community lifestyle magazine.',
    'You are shown a photo cut from the printed magazine, usually licensed stock the publisher cannot supply.',
    'Write ONE prompt that RECREATES THE SAME SCENE as closely as possible. The image model fills every gap you leave',
    'with a guess, and its guesses are wrong, so leave no gaps. Study the photo carefully before writing.',
    'Describe, explicitly and in this order:',
    '1. The camera: where it stands (inside or outside, which room), its height, which way it looks, the framing.',
    '2. The space: the room and its architecture, the floor, walls, stairs, furniture, and exactly what is visible',
    '   through every open door and window (for example the front yard, snow, trees, the street). If a door is open to',
    '   the outdoors, say so plainly and say what is outside.',
    '3. Every person, one at a time: position in the frame (left, centre, right; foreground, middle, background),',
    '   whether they are indoors or outdoors or on the threshold, which way they face and whether their back is to the',
    '   camera, apparent age, apparent skin tone, hair, BUILD (slender, average or heavyset) with arms and hands that',
    '   match their age and build (an older slender woman has slim arms, never muscular ones), and EVERY item of',
    '   clothing including coats, scarves and hats (say "no coat" if they wear none).',
    '4. The action and the relationships: who is arriving and who is greeting them, who is hugging whom, who hands',
    '   what to whom, who is moving which way. State the direction of every movement so it cannot be reversed.',
    '5. Props and decorations and where they sit in the frame; what is in focus and what is soft.',
    '6. The light: its source and direction, its warmth, the time of day; the season; the colours; the mood.',
    'Only these change: people are described generically (never a named or famous person), and any text, logos,',
    'brands or watermarks are left out.',
    'Photographic: say editorial photograph, and name a focal length and aperture that suit the framing.',
    'Never write golden hour, cinematic, moody, bokeh, dreamy, 8k, stunning, highly detailed.',
    '150-230 words, one paragraph of plain sentences. Precision beats style.',
    'Respond with ONLY JSON: {"sees":"one sentence: what the photo shows","prompt":"..."}'
  ].join('\n');

  /* ── small helpers ──────────────────────────────────────── */
  function cfg() { return window.TA_CONFIG || {}; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var PIC_TYPES = { 'image/jpeg': 1, 'image/png': 1, 'image/gif': 1, 'image/webp': 1 };
  function dataUrlToPart(u) {
    var m = /^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i.exec(u || '');
    if (!m) return null;
    var t = m[1].toLowerCase(); if (t === 'image/jpg') t = 'image/jpeg';
    return PIC_TYPES[t] ? { type: 'image', source: { type: 'base64', media_type: t, data: m[2] } } : null;
  }
  function fluxSize(w, h) {
    var f = HC.flux;
    var a = Math.max(f.minAspect, Math.min(f.maxAspect, (w || 1) / (h || 1)));
    var W = a >= 1 ? f.edge : f.edge * a, H = a >= 1 ? f.edge / a : f.edge;
    return { w: Math.round(W / f.grid) * f.grid, h: Math.round(H / f.grid) * f.grid };
  }
  function toast(msg, tone) {
    try {
      if (window.IxToast && typeof window.IxToast.show === 'function') { window.IxToast.show(msg, tone || 'info'); return; }
    } catch (e) {}
    if (tone === 'err') console.warn(TAG, msg); else console.log(TAG, msg);
  }

  /* The stylesheet sets --ixpp-loaded on .ixpp-probe. Checked once. */
  var cssState = null;
  function cssLoaded() {
    if (cssState !== null) return cssState;
    try {
      var p = document.createElement('div'); p.className = 'ixpp-probe'; p.style.display = 'none';
      document.body.appendChild(p);
      cssState = String(getComputedStyle(p).getPropertyValue('--ixpp-loaded') || '').trim() === '1';
      document.body.removeChild(p);
    } catch (e) { cssState = false; }
    if (!cssState) console.warn(TAG, CSS_FILE + ' is not on this page; the photo tools will look broken.');
    return cssState;
  }
  function cssNote() {
    return cssLoaded() ? '' : '<div class="ixpp-err" style="color:#b3261e">' + esc(CSS_FILE) + ' is missing from this page head.</div>';
  }

  function infoBadge() {
    if (!window.IxInfo || typeof window.IxInfo.badge !== 'function') return '';
    return '<span class="ixpp-info">' + window.IxInfo.badge({
      file: FILE, version: VERSION, title: 'Generate a similar photo',
      blurb: 'Claude looks at the photo you boxed on the printed page and writes one long prompt that recreates the same ' +
             'scene: the camera, the space, every person with their age, build and clothing, the action and the light. People ' +
             'are made generic and any text or logos are left out. Edit the prompt freely.\n\n' +
             'Generate image makes the photo with Flux at the same shape as your box. Use this photo makes it an Available ' +
             'MEDIA row with the prompt recorded, and hands it to the form you came from. The print photo itself is never ' +
             'sent to Flux, only the words.',
      scenarios: [
        { name: 'Scenario L \u00b7 Generated media', note: 'Use this photo makes an Available MEDIA row (TA_CONFIG.makeGenerateMedia)' }],
      companions: CSS_FILE + ' \u00b7 ix-tokens \u00b7 ix-buttons \u00b7 ix-form-controls \u00b7 ix-info \u00b7 pathways: ' +
                  'inbxify-anthropic-proxy (the prompt), fluxgen Worker (the photo), Uploadcare + Google Lens (Find the source) \u00b7 ' +
                  'used by ta-create-from-print v1.2.7+ and ta-asf v1.12.7+ (Edit Article print panel)'
    }) + '</span>';
  }

  /* ════════════════════════════════════════════════════════════
     SESSION — one per host surface while it is open
     ════════════════════════════════════════════════════════════ */
  function session(opts) {
    opts = opts || {};
    var live = true;
    var s = {
      mode: 'idle', crop: '', w: 0, h: 0, err: '',
      finding: false, found: false, lensUrl: '', used: false,
      gen: null, gm: null
    };
    function changed() { if (live && typeof opts.onChange === 'function') { try { opts.onChange(); } catch (e) { console.warn(TAG, 'onChange failed', e); } } }
    function context() { try { return (typeof opts.context === 'function' ? opts.context() : opts.context) || {}; } catch (e) { return {}; } }

    s.selectButton = function (o) {
      o = o || {};
      if (s.mode !== 'idle') return '';
      return '<button type="button" class="ix-btn ' + (o.primary ? 'ix-btn--primary' : 'ix-btn--ghost') + ' ixpp-selbtn" data-ixpp-sel>' +
        esc(o.label || 'Select a photo on the page') + '</button>';
    };
    s.pageClass = function () { return s.mode === 'select' ? ' ixpp-page--select' : ''; };
    s.imgAttrs = function () { return s.mode === 'select' ? ' data-ixpp-img draggable="false"' : ''; };

    s.panelHtml = function (o) {
      o = o || {};
      if (s.mode === 'idle') return '';
      if (s.mode === 'select') {
        return '<div class="ixpp-panel">' + cssNote() + '<b>Drag a box around the photo on the page.</b> ' +
          '<button type="button" class="ix-revert" data-ixpp-x>Cancel</button>' +
          (s.err ? '<div class="ixpp-err">' + esc(s.err) + '</div>' : '') + '</div>';
      }
      if (s.mode === 'cutting') {
        return '<div class="ixpp-panel"><span class="ixpp-dots" aria-hidden="true"><i></i><i></i><i></i></span> Cutting the photo from the page\u2026</div>';
      }
      var h = '<div class="ixpp-panel">' + cssNote() + '<b>Photo from print</b> \u00b7 ' +
        '<button type="button" class="ix-revert" data-ixpp-sel>Select again</button> \u00b7 ' +
        '<button type="button" class="ix-revert" data-ixpp-x>Cancel</button>' +
        '<img class="ixpp-crop" src="' + s.crop + '" alt="The photo selected on the print page">' +
        '<div class="ixpp-row">' +
          '<button type="button" class="ix-btn ix-btn--ghost" data-ixpp-find' + (s.finding ? ' disabled' : '') + '>Find the source</button>' +
          '<button type="button" class="ix-btn ix-btn--primary" data-ixpp-gen>Generate a similar one</button>' +
          '<a class="ix-revert" href="' + s.crop + '" download="' + esc(o.fileName || 'print-photo.jpg') + '">Save the crop</a>' +
        '</div>';
      if (s.finding) h += '<div class="ixpp-hint">Sending the photo to Google Lens\u2026</div>';
      else if (s.found) h += '<div class="ixpp-hint">Google Lens opened in a new tab with this photo. Exact matches link to where it can be licensed.</div>';
      if (s.used) h += '<div class="ixpp-hint">' + esc(o.usedNote || 'The generated photo was added.') + '</div>';
      return h + '</div>';
    };

    // v1.0.1 — select mode, from the host's own button.
    s.startSelect = function () {
      closeGm(); s.mode = 'select'; s.crop = ''; s.gen = null; s.found = false; s.lensUrl = ''; s.used = false; s.err = ''; changed();
    };

    s.handleClick = function (e) {
      var t = e && e.target; if (!t || !t.closest) return false;
      if (t.closest('[data-ixpp-sel]')) { s.startSelect(); return true; }
      if (t.closest('[data-ixpp-x]')) { s.reset(); return true; }
      if (t.closest('[data-ixpp-find]')) { find(); return true; }
      if (t.closest('[data-ixpp-gen]')) { openGm(); return true; }
      if (s.mode === 'select' && t.closest('[data-ixpp-img]')) return true;   // a click, not a drag: swallow it
      return false;
    };

    /* Drag a box on the page image. */
    s.handleMouseDown = function (e) {
      var img = e && e.target && e.target.closest && e.target.closest('[data-ixpp-img]');
      if (!img || s.mode !== 'select') return false;
      e.preventDefault();
      var host = img.parentNode, hr = host.getBoundingClientRect();
      var box = document.createElement('div'); box.className = 'ixpp-box'; host.appendChild(box);
      var x0 = e.clientX, y0 = e.clientY;
      function place(x1, y1) {
        var ir = img.getBoundingClientRect();
        var l = Math.max(ir.left, Math.min(x0, x1)), tp = Math.max(ir.top, Math.min(y0, y1));
        var r = Math.min(ir.right, Math.max(x0, x1)), b = Math.min(ir.bottom, Math.max(y0, y1));
        box.style.left = (l - hr.left) + 'px'; box.style.top = (tp - hr.top) + 'px';
        box.style.width = Math.max(0, r - l) + 'px'; box.style.height = Math.max(0, b - tp) + 'px';
        return { l: l - ir.left, t: tp - ir.top, w: Math.max(0, r - l), h: Math.max(0, b - tp), iw: ir.width, ih: ir.height };
      }
      var last = place(x0, y0);
      function mv(ev) { last = place(ev.clientX, ev.clientY); }
      function up() {
        document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up);
        if (last.w < HC.minBox || last.h < HC.minBox) { if (box.parentNode) box.parentNode.removeChild(box); return; }
        cut(img, last);
      }
      document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
      return true;
    };

    /* Cut the box from the crop source, by fractions of the page. */
    function cut(img, r) {
      var fr = { l: r.l / r.iw, t: r.t / r.ih, w: r.w / r.iw, h: r.h / r.ih };
      s.mode = 'cutting'; s.err = ''; changed();
      var src;
      try { src = typeof opts.cropSource === 'function' ? opts.cropSource(img) : img.src; } catch (e) { src = Promise.reject(e); }
      Promise.resolve(src).then(function (url) {
        if (!url) url = img.src;
        return new Promise(function (res, rej) {
          var im = new Image();
          if (!/^data:/i.test(url)) im.crossOrigin = 'anonymous';
          im.onload = function () { res(im); };
          im.onerror = function () { rej(new Error('the page image could not be loaded')); };
          im.src = url;
        });
      }).then(function (im) {
        if (!live) return;
        var W = im.naturalWidth, H = im.naturalHeight;
        var cw = Math.max(1, Math.round(fr.w * W)), ch = Math.max(1, Math.round(fr.h * H));
        var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
        cv.getContext('2d').drawImage(im, Math.round(fr.l * W), Math.round(fr.t * H), cw, ch, 0, 0, cw, ch);
        s.crop = cv.toDataURL('image/jpeg', 0.92); s.w = cw; s.h = ch;
        s.mode = 'have'; s.found = false; s.lensUrl = ''; s.gen = null; s.used = false;
        changed();
      }).catch(function (e) {
        if (!live) return;
        s.mode = 'select'; s.err = 'Could not cut the photo: ' + ((e && e.message) || e) + '. Draw the box again.';
        changed();
      });
    }

    /* ── Find the source (Google Lens) ───────────────────── */
    function find() {
      if (!s.crop) return;
      var c = cfg(), key = c.uploadcarePublicKey || c.uploadcareKey;
      if (!key) { toast('TA_CONFIG.uploadcarePublicKey is missing, so the photo cannot be searched. Use Save the crop and upload it to Google Lens.', 'err'); return; }
      var win = window.open('about:blank', '_blank');   // open now, inside the click, so it is not blocked
      if (win) { try { win.document.write('<p style="font:16px sans-serif;padding:24px">Uploading the photo for Google Lens\u2026</p>'); } catch (e) {} }
      s.finding = true; changed();
      var go = s.lensUrl ? Promise.resolve(s.lensUrl) :
        fetch(s.crop).then(function (r) { return r.blob(); }).then(function (blob) {
          var fd = new FormData();
          fd.append('UPLOADCARE_PUB_KEY', key); fd.append('UPLOADCARE_STORE', '1');
          fd.append('file', blob, 'print-photo.jpg');
          return fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: fd });
        }).then(function (r) { if (!r.ok) throw new Error('Uploadcare HTTP ' + r.status); return r.json(); })
          .then(function (d) {
            if (!d || !d.file) throw new Error('Uploadcare returned no file');
            var base = (c.uploadcareBase || 'https://ucarecdn.com').replace(/\/$/, '');
            return (s.lensUrl = base + '/' + d.file + '/print-photo.jpg');
          });
      go.then(function (u) {
        s.finding = false; s.found = true; changed();
        var to = HC.lens + encodeURIComponent(u);
        if (win && !win.closed) win.location.href = to; else window.open(to, '_blank');
      }).catch(function (e) {
        s.finding = false; changed();
        if (win && !win.closed) win.close();
        toast('Could not send the photo to Google Lens: ' + ((e && e.message) || e) + '. Use Save the crop instead.', 'err');
      });
    }

    /* ── the Generate window ─────────────────────────────── */
    function openGm() {
      if (!s.crop) return;
      if (!s.gen || s.gen.used) s.gen = { phase: 'drafting', prompt: '', sees: '', err: '' };
      if (!s.gm) {
        var o = document.createElement('div'); o.className = 'ixpp-gm';
        o.addEventListener('click', gmClick);
        o.addEventListener('input', function (e) { if (e.target.hasAttribute('data-ixpp-prompt') && s.gen) { s.gen.prompt = e.target.value; gmFit(); } });
        o.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); closeGm(); } });
        window.addEventListener('resize', gmFit);
        document.body.appendChild(o); s.gm = o;
      }
      gmDraw();
      if (s.gen.phase === 'drafting') draft();
    }
    function closeGm() {
      if (s.gm) { if (s.gm.parentNode) s.gm.parentNode.removeChild(s.gm); s.gm = null; window.removeEventListener('resize', gmFit); }
    }
    function gmDraw() {
      if (!s.gm) return;
      var gen = s.gen || {}, busy = gen.phase === 'drafting' || gen.phase === 'generating' || gen.phase === 'saving';
      var right;
      if (gen.phase === 'generating') right = '<div class="ixpp-wait"><div class="ixpp-dots"><i></i><i></i><i></i></div>Flux is painting your photo\u2026 about 20 seconds</div>';
      else if (gen.url) right = '<img class="ixpp-res" src="' + esc(gen.url) + '" alt="Generated photo">';
      else if (gen.phase === 'drafting') right = '<div class="ixpp-wait"><div class="ixpp-dots"><i></i><i></i><i></i></div>Looking at the print photo and writing the prompt\u2026</div>';
      else right = '<div class="ixpp-sees ixpp-sees--empty">The generated photo appears here.</div>';
      s.gm.innerHTML =
        '<div class="ixpp-gm-box" role="dialog" aria-modal="true" aria-label="Generate a similar photo">' +
          '<div class="ixpp-gm-head"><h3>Generate a similar photo</h3>' + infoBadge() +
            '<button type="button" class="ix-revert" data-ixpp-close>Close</button></div>' +
          '<div class="ixpp-gm-body">' +
            '<div class="ixpp-col"><div class="ixpp-eb">From the print</div><div class="ixpp-frame"><img src="' + s.crop + '" alt="Photo from the print page"></div>' +
              (gen.sees ? '<div class="ixpp-eb">What Claude sees</div><div class="ixpp-sees">' + esc(gen.sees) + '</div>' : '') +
              (gen.phase === 'drafting' ? '' : '<div class="ixpp-eb">Prompt \u00b7 edit freely</div><textarea data-ixpp-prompt' + (busy ? ' disabled' : '') + '>' + esc(gen.prompt || '') + '</textarea>') +
            '</div>' +
            '<div class="ixpp-col"><div class="ixpp-eb">Generated</div><div class="ixpp-frame">' + right + '</div></div>' +
          '</div>' +
          '<div class="ixpp-gm-foot">' +
            (gen.err ? '<span class="ixpp-err">' + esc(gen.err) + '</span>' : '') +
            '<span class="ixpp-sp"></span>' +
            '<button type="button" class="ix-btn ' + (gen.url ? 'ix-btn--ghost' : 'ix-btn--primary') + '" data-ixpp-flux' + (busy || !(gen.prompt || '').trim() ? ' disabled' : '') + '>' + (gen.url ? 'Generate again' : 'Generate image') + '</button>' +
            (gen.url ? '<button type="button" class="ix-btn ix-btn--primary" data-ixpp-use' + (busy ? ' disabled' : '') + '>' + (gen.phase === 'saving' ? 'Adding\u2026' : 'Use this photo') + '</button>' : '') +
          '</div>' +
        '</div>';
      gmFit();
    }
    // The prompt box is as tall as its text; no inner scrolling.
    function gmFit() {
      if (!s.gm) return;
      var ta = s.gm.querySelector('[data-ixpp-prompt]'); if (!ta) return;
      ta.style.height = 'auto';
      ta.style.height = (ta.scrollHeight + 4) + 'px';
    }
    function gmClick(e) {
      var t = e.target;
      if (t === e.currentTarget || t.closest('[data-ixpp-close]')) { closeGm(); changed(); return; }
      if (t.closest('[data-ixpp-flux]')) { flux(); return; }
      if (t.closest('[data-ixpp-use]')) { use(); return; }
    }

    function draft() {
      var gen = s.gen, ctx = context(), proxy = cfg().anthropicProxy;
      if (!proxy) { s.gen = { phase: 'edit', prompt: '', sees: '', err: 'TA_CONFIG.anthropicProxy is not set, so a prompt cannot be written. Type one.' }; gmDraw(); return; }
      var part = dataUrlToPart(s.crop);
      if (!part) { s.gen = { phase: 'edit', prompt: '', sees: '', err: 'The selected photo could not be read. Select it again.' }; gmDraw(); return; }
      var content = [{ type: 'text', text: 'The photo from print (article: "' + (ctx.title || '') + '"). Describe and recreate THIS photo; the headline is context only:' }, part];
      fetch(proxy, { method: 'POST', headers: { 'Content-Type': 'application/json' }, ixLabel: 'Write the photo prompt',
        body: JSON.stringify({ model: HC.model, max_tokens: HC.prompt.maxTokens, system: PROMPT_SYSTEM, messages: [{ role: 'user', content: content }] }) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error((j && j.error && (j.error.message || j.error)) || ('HTTP ' + r.status)); return j; }); })
        .then(function (j) {
          if (!live || s.gen !== gen) return;
          var raw = ((j && j.content) || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
          var m = raw.match(/\{[\s\S]*\}/), p = null; if (m) { try { p = JSON.parse(m[0]); } catch (e) {} }
          s.gen = { phase: 'edit', prompt: (p && p.prompt) || '', sees: (p && p.sees) || '', err: (p && p.prompt) ? '' : 'The prompt did not come back. Type one in the box.' };
          gmDraw();
        })
        .catch(function (e) { if (!live || s.gen !== gen) return; s.gen = { phase: 'edit', prompt: '', sees: '', err: 'Could not write a prompt: ' + ((e && e.message) || e) + '.' }; gmDraw(); });
    }

    function flux() {
      var gen = s.gen; if (!gen) return;
      var ta = s.gm && s.gm.querySelector('[data-ixpp-prompt]'); if (ta) gen.prompt = ta.value;
      var url = cfg().fluxGen;
      if (!url) { gen.err = 'TA_CONFIG.fluxGen is not set, so the image cannot be generated.'; gmDraw(); return; }
      if (!(gen.prompt || '').trim()) return;
      var sz = fluxSize(s.w, s.h);
      gen.phase = 'generating'; gen.err = ''; gen.used = false; gmDraw();
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, ixLabel: 'Generate the photo',
        body: JSON.stringify({ prompt: gen.prompt, width: sz.w, height: sz.h }) })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j || !j.url) throw new Error((j && j.error) || ('HTTP ' + r.status)); return j; }); })
        .then(function (j) { if (!live || s.gen !== gen) return; gen.phase = 'edit'; gen.url = j.url; gen.uuid = j.uuid; gen.w = j.width || sz.w; gen.h = j.height || sz.h; gmDraw(); })
        .catch(function (e) { if (!live || s.gen !== gen) return; gen.phase = 'edit'; gen.err = 'Generation failed: ' + ((e && e.message) || e); gmDraw(); });
    }

    function use() {
      var gen = s.gen, c = cfg(), ctx = context(); if (!gen || !gen.url) return;
      if (!c.makeGenerateMedia) { gen.err = 'TA_CONFIG.makeGenerateMedia (Scenario L) is not set, so the photo cannot be added.'; gmDraw(); return; }
      gen.phase = 'saving'; gen.err = ''; gmDraw();
      var payload = { action: 'createGeneratedMedia', uploadcareUuid: gen.uuid, uploadcareUrl: gen.url,
        originalFilename: 'flux-print-' + String(gen.uuid || '').slice(0, 8) + '.jpg', mimeType: 'image/jpeg',
        width: gen.w, height: gen.h, titleSlug: c.titleSlug, taItemId: c.taItemId,
        imageSource: 'ai-flux-2-pro', generationPrompt: gen.prompt,
        source: (opts.sourceTag || FILE) + ' similar to print ' + (ctx.issueName || '') + ' p.' + (ctx.page || '') };
      fetch(c.makeGenerateMedia, { method: 'POST', headers: { 'Content-Type': 'application/json' }, ixLabel: 'Add the generated photo',
        body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error('Scenario L HTTP ' + r.status); return r.text(); })
        .then(function (t) {
          var p = null; try { p = JSON.parse(t); } catch (e) {}
          if (!p || p.ok !== true || !p.mediaId) throw new Error('Scenario L did not confirm the new photo');
          if (!live || s.gen !== gen) return;
          var media = { mediaId: p.mediaId, name: p.name || payload.originalFilename, imageUrl: p.imageUrl || gen.url,
                        originalFilename: payload.originalFilename, uuid: gen.uuid, width: gen.w, height: gen.h, prompt: gen.prompt };
          gen.phase = 'edit'; gen.used = true; s.used = true;
          closeGm();
          try { if (typeof opts.onUsed === 'function') opts.onUsed(media); } catch (e) { console.warn(TAG, 'onUsed failed', e); }
          changed();
        })
        .catch(function (e) { if (!live || s.gen !== gen) return; gen.phase = 'edit'; gen.err = 'Could not add the photo: ' + ((e && e.message) || e); gmDraw(); });
    }

    s.reset = function () {
      closeGm();
      s.mode = 'idle'; s.crop = ''; s.w = 0; s.h = 0; s.err = '';
      s.finding = false; s.found = false; s.lensUrl = ''; s.used = false; s.gen = null;
      changed();
    };
    s.destroy = function () { closeGm(); live = false; };
    cssLoaded();
    return s;
  }

  /* v1.0.1 — pages side by side as one picture (the spread). Every page
     is scaled to the first page's height. Data URLs only need no CORS. */
  function loadImg(url) {
    return new Promise(function (res, rej) {
      var im = new Image();
      if (!/^data:/i.test(url)) im.crossOrigin = 'anonymous';
      im.onload = function () { res(im); };
      im.onerror = function () { rej(new Error('a page image could not be loaded')); };
      im.src = url;
    });
  }
  function stitch(urls) {
    urls = (urls || []).filter(Boolean);
    if (!urls.length) return Promise.reject(new Error('no pages to join'));
    if (urls.length === 1) return Promise.resolve(urls[0]);
    return Promise.all(urls.map(loadImg)).then(function (ims) {
      var H = ims[0].naturalHeight || 1;
      var ws = ims.map(function (im) { return Math.round((im.naturalWidth || 1) * H / (im.naturalHeight || 1)); });
      var cv = document.createElement('canvas');
      cv.width = ws.reduce(function (a, b) { return a + b; }, 0); cv.height = H;
      var ctx = cv.getContext('2d'), x = 0;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
      ims.forEach(function (im, i) { ctx.drawImage(im, x, 0, ws[i], H); x += ws[i]; });
      return cv.toDataURL('image/jpeg', 0.92);
    });
  }

  window.IxPrintPhoto = { version: VERSION, file: FILE, session: session, stitch: stitch };
  console.log(TAG, 'loaded');
})();
