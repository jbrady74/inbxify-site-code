/* ============================================================
   ix-lightbox-v1.1.0.js
   INBXIFY — Shared image lightbox primitive
   ──────────────────────────────────────────────────────────

   v1.1.0 — PAGED MODE (page flip), for the Print Issue Allocator
   and any surface that shows the pages of a document.

     window.InbxLightbox.openPages({
       count:   40,                        // number of pages
       start:   8,                         // 1-based page to open on
       getSrc:  function (n) { return Promise<url or data: URL> },
       caption: function (n) { return 'PDF page 8 of 40' },  // optional
       onClose: function () {}             // optional
     })

     · ‹ › buttons, ← → keys, Home / End. ESC closes the viewer only
       (window capture phase + stopPropagation, as for images), so a
       modal underneath stays open.
     · A page loads on demand through getSrc; a spinner shows while it
       does. The next and previous pages are asked for in advance.
       Failures show the reason on the page, with Try again.
     · "Fit width" / "Fit page" toggle: fit width scrolls the page
       vertically inside the overlay so small print can be read.
     · Single-image open(url, {caption}) is unchanged.

   Singleton guard: a page that already loaded an OLDER copy (no
   openPages) is upgraded in place; a copy with openPages returns.

   Single-image preview overlay. Any surface that has a thumbnail
   can call InbxLightbox.open(url) to show a dim full-screen
   overlay with the image at full resolution + a caption.

   API:
     window.InbxLightbox.open(imageUrl, { caption })
     window.InbxLightbox.close()

   Behavior:
     - ESC / click outside image / click X all close
     - Only one lightbox open at a time (open() closes the prior one)
     - Z-index 10020 — higher than ABE (10000) and RTE picker (10010)
     - ESC handler uses window-level capture-phase so it fires BEFORE
       any document-level capture handlers (e.g. RTE picker's ESC).
       When lightbox is on top, ESC closes lightbox first; picker
       handler doesn't fire because we stopPropagation.
     - Body scroll locked while open; restored on close

   Also ships:
     .ix-expand-icon       — the small circular "magnify" button
                             that consumers place inside their thumbs
     .ix-expand-icon-host  — sets position:relative on the thumb
                             container so the icon can absolute-position

   Singleton guard at top — safe to load multiple times.

   Companion files:
     ta-rte-v1.1.21+        — RTE picker thumbs use this
     ta-components-tab-v1.0.6+ — Components tab card thumbs use this
   ============================================================ */

(function () {
  // v1.1.0 — an older copy without openPages is replaced.
  if (window.InbxLightbox && window.InbxLightbox.openPages) return;

  var VERSION = '1.1.0';
  var Z_INDEX = 10020;

  // ── Module-private state ──
  var overlay = null;
  var escHandler = null;

  function injectStyles() {
    if (document.getElementById('ix-lightbox-styles')) return;
    var style = document.createElement('style');
    style.id = 'ix-lightbox-styles';
    style.textContent = [
      // Overlay (fixed full-viewport, dim backdrop, click outside to close)
      '.ix-lightbox-overlay {',
      '  position: fixed; inset: 0;',
      '  background: rgba(0,0,0,0.85);',
      '  z-index: ' + Z_INDEX + ';',
      '  display: flex; flex-direction: column;',
      '  align-items: center; justify-content: center;',
      '  padding: 56px 24px 24px;',
      '  opacity: 0;',
      '  transition: opacity 0.15s ease;',
      '  cursor: zoom-out;',
      '  box-sizing: border-box;',
      '}',
      '.ix-lightbox-overlay.visible { opacity: 1; }',

      // Image wrap — clicks here do NOT close (cursor stays default)
      '.ix-lightbox-img-wrap {',
      '  display: flex; flex-direction: column; align-items: center;',
      '  max-width: 100%; max-height: 100%;',
      '  cursor: default;',
      '  gap: 12px;',
      '}',

      // The image itself
      '.ix-lightbox-img {',
      '  width: 75vw; max-width: 75vw; max-height: 80vh;',  /* v1.0.4: 75% viewport width */
      '  object-fit: contain;',
      '  display: block;',
      '  background: white;',
      '  border-radius: 4px;',
      '  box-shadow: 0 8px 32px rgba(0,0,0,0.4);',
      '}',

      // Caption — small mono text below the image
      '.ix-lightbox-caption {',
      "  font-family: 'DM Mono', monospace;",
      '  font-size: 12px;',
      '  color: rgba(255,255,255,0.85);',
      '  text-align: center;',
      '  max-width: 90vw;',
      '  word-break: break-all;',
      '  margin: 0;',
      '}',

      // Close button — top-right circle
      '.ix-lightbox-close {',
      '  position: absolute;',
      '  top: 16px; right: 16px;',
      '  width: 36px; height: 36px;',
      '  border-radius: 50%;',
      '  background: rgba(255,255,255,0.12);',
      '  border: 1px solid rgba(255,255,255,0.25);',
      '  color: white;',
      '  font-size: 20px; line-height: 1;',
      '  cursor: pointer;',
      '  display: flex; align-items: center; justify-content: center;',
      '  transition: background 0.12s, border-color 0.12s;',
      '  padding: 0;',
      '  font-family: inherit;',
      '}',
      '.ix-lightbox-close:hover {',
      '  background: rgba(255,255,255,0.25);',
      '  border-color: rgba(255,255,255,0.45);',
      '}',

      // ── Shared expand-icon for consumers (RTE picker, Components cards) ──
      // Host element gets relative positioning so the icon can absolute itself.
      '.ix-expand-icon-host { position: relative; }',

      // The expand icon button — corporate-blue circle, top-right corner.
      // v1.0.3: background + color forced via !important so the SVG
      // stroke (currentColor) stays white on any image and the page
      // cascade can't override it.
      '.ix-expand-icon {',
      '  position: absolute;',
      '  top: 4px; right: 4px;',
      '  width: 22px; height: 22px;',
      '  border-radius: 50%;',
      '  background: #5b7fff !important;',
      '  color: #ffffff !important;',
      '  border: none;',
      '  cursor: pointer;',
      '  display: flex; align-items: center; justify-content: center;',
      '  padding: 0;',
      '  line-height: 1;',
      '  z-index: 2;',
      '  transition: background 0.12s, transform 0.12s;',
      '}',
      '.ix-expand-icon:hover {',
      '  background: #4060dd !important;',
      '  transform: scale(1.08);',
      '}',
      '.ix-expand-icon svg { display: block; }',

      // ── v1.1.0 · paged mode ──
      '.ix-lightbox--paged { cursor: default; padding: 56px 72px 20px; }',
      '.ix-lightbox--paged .ix-lightbox-img-wrap { width: 100%; height: 100%; max-height: 100%; }',
      '.ix-lightbox-stage {',
      '  flex: 1 1 auto; width: 100%; min-height: 0;',
      '  display: flex; align-items: center; justify-content: center;',
      '  overflow: auto; position: relative;',
      '}',
      '.ix-lightbox--paged .ix-lightbox-img {',
      '  width: auto; max-width: 100%; max-height: 100%;',
      '}',
      '.ix-lightbox--fitw .ix-lightbox-stage { align-items: flex-start; }',
      '.ix-lightbox--fitw .ix-lightbox-img { width: 100%; max-width: 1100px; max-height: none; }',
      '.ix-lightbox-nav {',
      '  position: absolute; top: 50%; transform: translateY(-50%);',
      '  width: 44px; height: 44px; border-radius: 50%;',
      '  background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25);',
      '  color: #fff; font-size: 26px; line-height: 1; cursor: pointer; padding: 0;',
      '  display: flex; align-items: center; justify-content: center; font-family: inherit;',
      '}',
      '.ix-lightbox-nav:hover:not([disabled]) { background: rgba(255,255,255,0.25); }',
      '.ix-lightbox-nav[disabled] { opacity: 0.3; cursor: default; }',
      '.ix-lightbox-nav--prev { left: 14px; }',
      '.ix-lightbox-nav--next { right: 14px; }',
      '.ix-lightbox-bar {',
      '  display: flex; align-items: center; gap: 14px; justify-content: center;',
      '  flex: 0 0 auto; padding-top: 10px;',
      '}',
      '.ix-lightbox-fit {',
      '  background: none; border: 1px solid rgba(255,255,255,0.35); border-radius: 4px;',
      '  color: rgba(255,255,255,0.9); font: 12px/1 inherit; padding: 5px 10px; cursor: pointer;',
      '}',
      '.ix-lightbox-fit:hover { border-color: rgba(255,255,255,0.7); }',
      '.ix-lightbox-spin {',
      '  width: 34px; height: 34px; border-radius: 50%;',
      '  border: 3px solid rgba(255,255,255,0.2); border-top-color: #fff;',
      '  animation: ix-lightbox-spin 0.8s linear infinite;',
      '}',
      '@keyframes ix-lightbox-spin { to { transform: rotate(360deg); } }',
      '@media (prefers-reduced-motion: reduce) { .ix-lightbox-spin { animation-duration: 3s; } }',
      '.ix-lightbox-err { color: #fff; font-size: 13px; text-align: center; max-width: 420px; }',
      '.ix-lightbox-err button { margin-top: 10px; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function open(imageUrl, opts) {
    if (!imageUrl) {
      console.warn('[InbxLightbox] open() called without imageUrl');
      return;
    }
    opts = opts || {};

    // If already open, close first (preserves z-index sanity, drops handlers).
    if (overlay) close();

    overlay = document.createElement('div');
    overlay.className = 'ix-lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image preview');

    var captionHtml = opts.caption
      ? '<p class="ix-lightbox-caption">' + escapeHtml(opts.caption) + '</p>'
      : '';

    overlay.innerHTML =
      '<button type="button" class="ix-lightbox-close" aria-label="Close preview">\u00D7</button>' +
      '<div class="ix-lightbox-img-wrap">' +
        '<img class="ix-lightbox-img" src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(opts.caption || '') + '">' +
        captionHtml +
      '</div>';

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // ESC handler — registered on window for capture phase to fire
    // BEFORE document-level handlers (e.g. the RTE picker's ESC).
    // stopPropagation prevents the underlying picker from also closing.
    escHandler = function (e) {
      if (e.key === 'Escape' && overlay) {
        e.stopPropagation();
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', escHandler, true);

    // Click outside image-wrap = close
    overlay.addEventListener('click', function (e) {
      // Close X handles itself; image wrap stops propagation below
      if (e.target === overlay) close();
    });

    // Prevent clicks on the image wrap from bubbling to overlay
    var imgWrap = overlay.querySelector('.ix-lightbox-img-wrap');
    if (imgWrap) {
      imgWrap.addEventListener('click', function (e) { e.stopPropagation(); });
    }

    // Close X
    var closeBtn = overlay.querySelector('.ix-lightbox-close');
    if (closeBtn) closeBtn.addEventListener('click', close);

    // Fade in
    requestAnimationFrame(function () {
      if (overlay) overlay.classList.add('visible');
    });

    console.log('[InbxLightbox v' + VERSION + '] opened:', imageUrl);
  }

  function close() {
    if (!overlay) return;
    if (escHandler) {
      window.removeEventListener('keydown', escHandler, true);
      escHandler = null;
    }
    document.body.style.overflow = overlay._ixPrevOverflow != null ? overlay._ixPrevOverflow : '';
    var cb = overlay._ixOnClose;
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    if (cb) { try { cb(); } catch (e) { console.warn('[InbxLightbox] onClose failed', e); } }
  }

  // ── v1.1.0 · paged mode ─────────────────────────────────────
  function openPages(o) {
    o = o || {};
    var count = Math.max(1, parseInt(o.count, 10) || 1);
    if (typeof o.getSrc !== 'function') {
      console.warn('[InbxLightbox] openPages() needs getSrc(n)');
      return;
    }
    if (overlay) close();
    var page = Math.min(Math.max(1, parseInt(o.start, 10) || 1), count);
    var cache = {};           // n → Promise<src>
    var seq = 0;
    var fitWidth = false;

    overlay = document.createElement('div');
    overlay.className = 'ix-lightbox-overlay ix-lightbox--paged';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Page viewer');
    overlay.innerHTML =
      '<button type="button" class="ix-lightbox-close" aria-label="Close viewer">\u00D7</button>' +
      '<button type="button" class="ix-lightbox-nav ix-lightbox-nav--prev" aria-label="Previous page">\u2039</button>' +
      '<button type="button" class="ix-lightbox-nav ix-lightbox-nav--next" aria-label="Next page">\u203A</button>' +
      '<div class="ix-lightbox-img-wrap">' +
        '<div class="ix-lightbox-stage"></div>' +
        '<div class="ix-lightbox-bar">' +
          '<p class="ix-lightbox-caption"></p>' +
          '<button type="button" class="ix-lightbox-fit">Fit width</button>' +
        '</div>' +
      '</div>';
    overlay._ixPrevOverflow = document.body.style.overflow;   // a modal underneath may lock scroll too
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    var stage = overlay.querySelector('.ix-lightbox-stage');
    var cap   = overlay.querySelector('.ix-lightbox-caption');
    var prevB = overlay.querySelector('.ix-lightbox-nav--prev');
    var nextB = overlay.querySelector('.ix-lightbox-nav--next');
    var fitB  = overlay.querySelector('.ix-lightbox-fit');
    var onClose = typeof o.onClose === 'function' ? o.onClose : null;

    function src(n) {
      if (!cache[n]) {
        cache[n] = Promise.resolve().then(function () { return o.getSrc(n); });
        cache[n].catch(function () { delete cache[n]; });   // a failure can be retried
      }
      return cache[n];
    }
    function show(n) {
      page = n;
      var my = ++seq;
      prevB.disabled = page <= 1;
      nextB.disabled = page >= count;
      var c = '';
      try { c = o.caption ? String(o.caption(page) || '') : ''; } catch (e) {}
      cap.textContent = c || ('Page ' + page + ' of ' + count);
      stage.innerHTML = '<div class="ix-lightbox-spin" aria-label="Loading page"></div>';
      src(page).then(function (url) {
        if (!overlay || my !== seq) return;
        stage.innerHTML = '<img class="ix-lightbox-img" alt="' + escapeHtml(cap.textContent) + '" src="' + escapeHtml(url) + '">';
        stage.scrollTop = 0;
        if (page < count) src(page + 1);           // ask ahead
        if (page > 1) src(page - 1);
      }, function (err) {
        if (!overlay || my !== seq) return;
        stage.innerHTML = '<div class="ix-lightbox-err">This page could not be shown: ' +
          escapeHtml(err && err.message ? err.message : String(err)) +
          '<br><button type="button" class="ix-lightbox-fit" data-ix-retry="1">Try again</button></div>';
      });
    }

    escHandler = function (e) {
      if (!overlay) return;
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); return; }
      var k = e.key;
      if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Home' || k === 'End' ||
          k === 'PageUp' || k === 'PageDown') {
        e.stopPropagation(); e.preventDefault();
        if ((k === 'ArrowLeft' || k === 'PageUp') && page > 1) show(page - 1);
        else if ((k === 'ArrowRight' || k === 'PageDown') && page < count) show(page + 1);
        else if (k === 'Home' && page !== 1) show(1);
        else if (k === 'End' && page !== count) show(count);
      }
    };
    window.addEventListener('keydown', escHandler, true);

    overlay.addEventListener('click', function (e) {
      var t = e.target;
      if (t === overlay) { close(); return; }
      if (t === prevB && page > 1) { show(page - 1); return; }
      if (t === nextB && page < count) { show(page + 1); return; }
      if (t.classList && t.classList.contains('ix-lightbox-close')) { close(); return; }
      if (t.getAttribute && t.getAttribute('data-ix-retry')) { show(page); return; }
      if (t === fitB) {
        fitWidth = !fitWidth;
        overlay.classList.toggle('ix-lightbox--fitw', fitWidth);
        fitB.textContent = fitWidth ? 'Fit page' : 'Fit width';
      }
    });

    overlay._ixOnClose = onClose;
    show(page);
    requestAnimationFrame(function () { if (overlay) overlay.classList.add('visible'); });
    console.log('[InbxLightbox v' + VERSION + '] pages opened at', page, 'of', count);
  }

  // Inject styles immediately (script runs in <head> before body parses;
  // document.head is available, document.body may not be yet — fine, we
  // only need head for style injection here).
  injectStyles();

  // Public API
  window.InbxLightbox = {
    version: VERSION,
    open: open,
    openPages: openPages,   // v1.1.0
    close: close
  };

  console.log('\u29BE InbxLightbox v' + VERSION + ' loaded \u2014 window.InbxLightbox.open(url, {caption}) and .openPages({...}) available');
})();
