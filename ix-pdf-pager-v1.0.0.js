/* ix-pdf-pager-v1.0.0.js
   ════════════════════════════════════════════════════════════════
   INBXIFY ix series — PDF PAGE VIEWER (shared)

   Load in the page BODY custom code AFTER ix-lightbox-v1.1.0.js and
   BEFORE any module that calls it. No CSS: the modal is ix-lightbox's
   paged mode, which already owns the overlay, ‹ › and arrow keys,
   Home / End, Fit width / Fit page, the spinner, Try again, and ESC.
   This file adds only the PDF half: loading pdf.js, opening a stored
   PDF once, and rendering its pages to images on demand.

   ── v1.0.0 · STEP B-3 (29 Sept) ──
   Extracted from ta-print-review's page viewer so any surface can show
   a stored print PDF where its record lives, in-page, instead of a new
   tab. First consumer: the Print Issue · Allocator (v0.7.1), where any
   row opens its page. The Intake Review keeps its own viewer for now
   (it drives the cards and the thumbnail rail); it can move onto this
   module when it next changes.

   Carried from ta-print-review v1.3.5 / v1.3.6 (the P.1 blank-page
   lessons): renders of the same page are SERIALIZED, because pdf.js
   shares one page object and a cleanup() landing mid-render returns a
   white page as a "success"; a failed or empty render is never cached.

   API
     IxPdfPager.open({
       url:   'https://…/issue.pdf',   // required: the stored PDF
       page:  8,                       // 1-based page to open on (default 1)
       title: 'September 2026 - T',    // optional: caption prefix
       pages: 16,                      // optional: page count if known. Given,
                                       // the viewer opens AT ONCE and its
                                       // spinner shows while the PDF loads
                                       // (visible progress, standing rule)
       folio: { 8: 6 }                 // optional: pdf page → printed page
     }) → Promise<boolean>
     IxPdfPager.render(url, page, widthPx) → Promise<data: URL>
         one page as a JPEG, for thumbnails or crops (PA-0)
     IxPdfPager.close()

   HARDCODED (logged, shared): HC-TPI-PDFJS — pdf.js 3.11.174 from
   cdnjs, the same pin ta-print-issues and ta-print-review use;
   TA_CONFIG.pdfjsUrl overrides all three. No tenant value lives here.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.IxPdfPager) return;

  var VERSION = '1.0.0';
  var TAG = '[ix-pdf-pager v' + VERSION + ']';
  var PDFJS_DEFAULT = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  var VIEW_W = 1400;          /* matches the parser's read and the review's zoom */
  var JPEG_Q = 0.85;
  var DOC_MAX = 2;            /* stored PDFs kept open at once */
  var PAGE_CACHE_MAX = 16;    /* rendered pages kept per document */

  function cfg() { return window.TA_CONFIG || {}; }

  // ── pdf.js, loaded once ────────────────────────────────────
  var libP = null;
  function loadLib() {
    if (window.pdfjsLib && window.pdfjsLib.getDocument) return Promise.resolve(window.pdfjsLib);
    if (libP) return libP;
    var src = cfg().pdfjsUrl || PDFJS_DEFAULT;
    libP = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () {
        var L = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
        if (!L || !L.getDocument) { libP = null; rej(new Error('pdf.js loaded but exposed nothing')); return; }
        if (L.GlobalWorkerOptions) L.GlobalWorkerOptions.workerSrc = src.replace(/pdf\.min\.js$/, 'pdf.worker.min.js');
        window.pdfjsLib = L;
        res(L);
      };
      s.onerror = function () { libP = null; rej(new Error('pdf.js failed to load from ' + src)); };
      document.head.appendChild(s);
    });
    return libP;
  }

  // ── Documents, one per stored PDF ──────────────────────────
  var docs = {};      /* url → { p: Promise<doc>, pages: {n: Promise<dataUrl>}, order: [], q: {} } */
  var docOrder = [];

  function entry(url) {
    if (docs[url]) return docs[url];
    var e = { pages: {}, order: [], q: {} };
    e.p = fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('the stored PDF returned HTTP ' + r.status);
        return r.arrayBuffer();
      })
      .then(function (buf) { return loadLib().then(function (L) { return L.getDocument({ data: buf }).promise; }); });
    e.p.catch(function () { if (docs[url] === e) { delete docs[url]; docOrder = docOrder.filter(function (u) { return u !== url; }); } });
    docs[url] = e;
    docOrder.push(url);
    while (docOrder.length > DOC_MAX) {
      var old = docOrder.shift();
      var oe = docs[old]; delete docs[old];
      if (oe) oe.p.then(function (d) { try { d.destroy(); } catch (x) {} }, function () {});
    }
    return e;
  }

  function renderNow(e, n, w) {
    return e.p.then(function (doc) {
      if (n < 1 || n > doc.numPages) throw new Error('page ' + n + ' is outside this PDF (1\u2013' + doc.numPages + ')');
      return doc.getPage(n).then(function (page) {
        var v1 = page.getViewport({ scale: 1 });
        var vp = page.getViewport({ scale: w / v1.width });
        var cv = document.createElement('canvas');
        cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
        return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
          var out = cv.toDataURL('image/jpeg', JPEG_Q);
          try { page.cleanup(); } catch (x) {}
          cv.width = 0; cv.height = 0;
          if (!out || out.length < 1000) throw new Error('the page rendered empty');
          return out;
        });
      });
    });
  }

  /* One render per page at a time (the ta-print-review v1.3.6 rule). */
  function renderQueued(e, n, w) {
    var key = n + '@' + w;
    var run = function () { return renderNow(e, n, w); };
    var prev = e.q[n] || Promise.resolve();
    var p = prev.then(run, run);
    e.q[n] = p.catch(function () {});
    return p;
  }

  function render(url, n, w) {
    if (!url) return Promise.reject(new Error('no stored PDF for this issue'));
    var e = entry(url);
    w = w || VIEW_W;
    var key = n + '@' + w;
    if (e.pages[key]) return e.pages[key];
    var p = renderQueued(e, n, w);
    p.catch(function () { delete e.pages[key]; });   /* never cache a failure */
    e.pages[key] = p; e.order.push(key);
    while (e.order.length > PAGE_CACHE_MAX) delete e.pages[e.order.shift()];
    return p;
  }

  // ── The modal, through ix-lightbox's paged mode ────────────
  function open(o) {
    o = o || {};
    var LB = window.InbxLightbox;
    if (!(LB && LB.openPages)) {
      console.warn(TAG, 'ix-lightbox v1.1.0+ is not on the page; opening the PDF in a new tab instead.');
      if (o.url) window.open(o.url + '#page=' + (o.page || 1), '_blank', 'noopener');
      return Promise.resolve(false);
    }
    if (!o.url) return Promise.resolve(false);
    var e = entry(o.url);
    var caption = function (count) {
      return function (n) {
        var f = o.folio && o.folio[n];
        return (o.title ? o.title + ' \u00b7 ' : '') + 'PDF page ' + n + ' of ' + count +
               (f != null && String(f) !== String(n) ? ' \u00b7 printed page ' + f : '');
      };
    };
    /* Page count known: open now, let the spinner cover the download. */
    if (Number(o.pages) > 0) {
      var cnt = Number(o.pages);
      LB.openPages({
        count: cnt,
        start: Math.max(1, Math.min(cnt, Number(o.page) || 1)),
        getSrc: function (n) { return render(o.url, n, VIEW_W); },
        caption: caption(cnt)
      });
      return e.p.then(function () { return true; }, function () { return false; });
    }
    return e.p.then(function (doc) {
      var count = doc.numPages;
      var start = Math.max(1, Math.min(count, Number(o.page) || 1));
      LB.openPages({
        count: count,
        start: start,
        getSrc: function (n) { return render(o.url, n, VIEW_W); },
        caption: caption(count)
      });
      return true;
    }, function (err) {
      /* The lightbox shows a failed page with its reason; a failed
         document gets the same honesty through a one-page viewer. */
      LB.openPages({
        count: 1, start: 1,
        getSrc: function () { return Promise.reject(err); },
        caption: function () { return (o.title ? o.title + ' \u00b7 ' : '') + 'the stored PDF could not be opened'; }
      });
      console.error(TAG, 'could not open ' + o.url + ': ' + (err && err.message || err));
      return false;
    });
  }

  function close() {
    if (window.InbxLightbox && window.InbxLightbox.close) window.InbxLightbox.close();
  }

  window.IxPdfPager = { version: VERSION, open: open, render: render, close: close };
})();
