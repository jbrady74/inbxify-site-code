/* ============================================================
   ix-lightbox-v1.0.4.js
   INBXIFY — Shared image lightbox primitive
   ──────────────────────────────────────────────────────────

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
  if (window.InbxLightbox) return; // singleton — safe to re-include

  var VERSION = '1.0.4';
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
      '.ix-expand-icon svg { display: block; }'
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
    document.body.style.overflow = '';
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  // Inject styles immediately (script runs in <head> before body parses;
  // document.head is available, document.body may not be yet — fine, we
  // only need head for style injection here).
  injectStyles();

  // Public API
  window.InbxLightbox = {
    version: VERSION,
    open: open,
    close: close
  };

  console.log('\u29BE InbxLightbox v' + VERSION + ' loaded \u2014 window.InbxLightbox.open(url, {caption}) available');
})();
