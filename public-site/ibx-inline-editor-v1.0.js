// ============================================================
// ibx-inline-editor-v1.0.js
// INBXIFY Inline Content Editor
//
// Single-file in-place editor for the INBXIFY public website.
// When an admin (@healthiestmedia.com via Memberstack) is
// logged in, pencil icons appear on every element with a
// data-field-id attribute. Clicking the pencil opens an inline
// input seeded with the current text. Save POSTs to Scenario
// 702 (Make.com). Cancel restores the original text.
//
// Architecture:
//   - Static HTML in Webflow embeds IS the content (no hydration)
//   - Google Sheet is the audit trail for edits
//   - Scenario 702 writes edits to the Sheet
//   - Admin manually reconciles embed HTML on their schedule
//
// Dependencies: Memberstack JS SDK (already on page)
// Config: window.IBX_EDITOR_CONFIG (optional overrides)
//
// v1.0.0 — April 15, 2026
// ============================================================

(function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────
  const DEFAULTS = {
    webhookUrl: 'https://hook.us1.make.com/cxg4hkkzm9zl6k8hk86sum18dkhny87q',
    adminDomain: '@healthiestmedia.com',
    fieldSelector: '[data-field-id]',
  };

  function cfg(key) {
    return (window.IBX_EDITOR_CONFIG && window.IBX_EDITOR_CONFIG[key]) || DEFAULTS[key];
  }

  // ── Inject styles (once) ────────────────────────────────
  function injectStyles() {
    if (document.getElementById('ibx-editor-css')) return;
    const style = document.createElement('style');
    style.id = 'ibx-editor-css';
    style.textContent = `
/* ── Pencil button ── */
.ibx-pencil{position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;
  background:#1a3a3a;border:1.5px solid #c4a35a;color:#c4a35a;font-size:11px;line-height:1;
  cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;
  transition:opacity .15s,transform .15s;transform:scale(.85);z-index:100;padding:0;
  box-shadow:0 2px 6px rgba(26,58,58,.25)}
.ibx-pencil:hover{background:#244a4a;transform:scale(1)}
.ibx-pencil svg{width:11px;height:11px;fill:none;stroke:#c4a35a;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}

/* Show pencil on hover of the editable element's wrapper */
.ibx-editable{position:relative}
.ibx-editable:hover .ibx-pencil{opacity:1;transform:scale(1)}

/* Subtle outline on hover so admin knows what's editable */
.ibx-editable:hover{outline:1px dashed rgba(196,163,90,.4);outline-offset:3px;border-radius:2px}

/* ── Edit state ── */
.ibx-editing{outline:2px solid #c4a35a!important;outline-offset:3px;border-radius:2px}
.ibx-editing .ibx-pencil{display:none}

/* ── Inline toolbar ── */
.ibx-toolbar{position:absolute;left:0;bottom:-34px;display:flex;align-items:center;gap:6px;z-index:101;
  font-family:'DM Sans',system-ui,sans-serif;white-space:nowrap}
.ibx-toolbar-save{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.04em;
  text-transform:uppercase;padding:4px 14px;border-radius:3px;border:none;
  background:#1a3a3a;color:#f0edd8;cursor:pointer;transition:background .15s;font-weight:600}
.ibx-toolbar-save:hover{background:#244a4a}
.ibx-toolbar-save:disabled{opacity:.4;cursor:not-allowed}
.ibx-toolbar-cancel{font-family:'DM Mono',monospace;font-size:10px;color:#c0392b;
  background:none;border:none;cursor:pointer;text-decoration:underline;padding:0}
.ibx-toolbar-cancel:hover{opacity:.65}
.ibx-toolbar-status{font-family:'DM Mono',monospace;font-size:9px;color:#8a8a7a}

/* ── Input field ── */
.ibx-input{font-family:inherit;font-size:inherit;font-weight:inherit;line-height:inherit;
  letter-spacing:inherit;text-transform:inherit;color:inherit;
  width:100%;background:rgba(250,249,245,.95);border:1.5px solid #c4a35a;
  border-radius:3px;padding:4px 6px;outline:none;box-sizing:border-box;
  box-shadow:0 0 0 3px rgba(196,163,90,.12);transition:border-color .15s}
.ibx-input:focus{border-color:#1a3a3a;box-shadow:0 0 0 3px rgba(26,58,58,.1)}
textarea.ibx-input{resize:vertical;min-height:60px}

/* ── Image edit: URL input overlays bottom of image ── */
.ibx-img-edit-wrap{position:absolute;left:0;right:0;bottom:0;padding:8px;background:rgba(26,58,58,.85);
  border-radius:0 0 inherit inherit;z-index:101}
.ibx-img-input{font-family:'DM Mono',monospace;font-size:11px;color:#f0edd8;
  width:100%;background:rgba(255,255,255,.1);border:1.5px solid #c4a35a;
  border-radius:3px;padding:5px 8px;outline:none;box-sizing:border-box;
  box-shadow:0 0 0 3px rgba(196,163,90,.12);transition:border-color .15s}
.ibx-img-input:focus{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.15)}
.ibx-img-input::placeholder{color:rgba(240,237,216,.4)}
.ibx-img-toolbar{display:flex;align-items:center;gap:8px;margin-top:6px}
.ibx-img-toolbar .ibx-toolbar-save{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.04em;
  text-transform:uppercase;padding:4px 14px;border-radius:3px;border:none;
  background:#c4a35a;color:#1a3a3a;cursor:pointer;font-weight:600;transition:background .15s}
.ibx-img-toolbar .ibx-toolbar-save:hover{background:#f4a127}
.ibx-img-toolbar .ibx-toolbar-save:disabled{opacity:.4;cursor:not-allowed}
.ibx-img-toolbar .ibx-toolbar-cancel{font-family:'DM Mono',monospace;font-size:10px;color:rgba(240,237,216,.7);
  background:none;border:none;cursor:pointer;text-decoration:underline;padding:0}
.ibx-img-toolbar .ibx-toolbar-cancel:hover{opacity:.65}
.ibx-img-toolbar .ibx-toolbar-status{font-family:'DM Mono',monospace;font-size:9px;color:rgba(240,237,216,.5)}

/* ── Flash feedback ── */
@keyframes ibx-flash-ok{0%{background-color:rgba(39,174,96,.15)}100%{background-color:transparent}}
@keyframes ibx-flash-err{0%{background-color:rgba(192,57,43,.15)}100%{background-color:transparent}}
.ibx-flash-ok{animation:ibx-flash-ok .8s ease-out}
.ibx-flash-err{animation:ibx-flash-err .8s ease-out}

/* ── Bottom bar ── */
.ibx-bar{position:fixed;bottom:0;left:0;right:0;height:32px;background:#1a3a3a;color:#c4a35a;
  display:flex;align-items:center;justify-content:center;gap:8px;z-index:9999;
  font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.04em;
  box-shadow:0 -2px 10px rgba(26,58,58,.2);transition:transform .25s}
.ibx-bar-icon{font-size:12px}
.ibx-bar-text{opacity:.8}
.ibx-bar.hidden{transform:translateY(100%)}
`;
    document.head.appendChild(style);
  }

  // ── Memberstack auth check ──────────────────────────────
  async function isAdmin() {
    // Wait for Memberstack to be available (up to 5 seconds)
    let attempts = 0;
    while (!window.$memberstackDom && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    if (!window.$memberstackDom) return false;

    try {
      const member = await window.$memberstackDom.getCurrentMember();
      if (!member || !member.data) return false;
      const email = (member.data.auth && member.data.auth.email) || member.data.email || '';
      return email.toLowerCase().endsWith(cfg('adminDomain'));
    } catch (e) {
      console.warn('[IBX Editor] Memberstack check failed:', e);
      return false;
    }
  }

  // ── SVG pencil icon ─────────────────────────────────────
  function pencilSVG() {
    return '<svg viewBox="0 0 16 16"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z"/></svg>';
  }

  // ── Determine if element needs textarea vs input ────────
  function needsTextarea(el) {
    const text = el.textContent || '';
    if (text.length > 120) return true;
    if (text.includes('\n')) return true;
    const tag = el.tagName.toLowerCase();
    if (['p', 'li', 'blockquote', 'figcaption'].includes(tag)) return true;
    if (el.querySelector('br')) return true;
    return false;
  }

  // ── Get current page ID from pathname ───────────────────
  function getPageId() {
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    return path || 'home';
  }

  // ── Activate editor on all data-field-id elements ───────
  function activate() {
    const elements = document.querySelectorAll(cfg('fieldSelector'));
    if (!elements.length) {
      console.warn('[IBX Editor] No elements with data-field-id found');
      return;
    }

    elements.forEach(function (el) {
      // Skip if already wired
      if (el.dataset.ibxReady) return;
      el.dataset.ibxReady = 'true';

      // Wrap for positioning — IMG is void, so position on parent
      const isImg = el.tagName.toLowerCase() === 'img';
      if (isImg) {
        el.parentNode.classList.add('ibx-editable');
      } else {
        el.classList.add('ibx-editable');
      }

      // Create pencil button
      const pencil = document.createElement('button');
      pencil.className = 'ibx-pencil';
      pencil.innerHTML = pencilSVG();
      pencil.title = 'Edit this content';
      pencil.type = 'button';
      if (isImg) {
        el.parentNode.appendChild(pencil);
      } else {
        el.appendChild(pencil);
      }

      // State
      let originalText = '';
      let isEditing = false;
      let inputEl = null;
      let toolbarEl = null;

      pencil.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (isEditing) return;
        if (isImg) startImgEdit(); else startEdit();
      });

      // ── Image edit: URL input overlays bottom of image ──
      function startImgEdit() {
        isEditing = true;
        var originalSrc = el.getAttribute('src') || '';
        el.classList.add('ibx-editing');

        // Build overlay wrap
        var wrap = document.createElement('div');
        wrap.className = 'ibx-img-edit-wrap';

        var urlInput = document.createElement('input');
        urlInput.className = 'ibx-img-input';
        urlInput.type = 'text';
        urlInput.value = originalSrc;
        urlInput.placeholder = 'Paste Uploadcare URL…';

        var toolbar = document.createElement('div');
        toolbar.className = 'ibx-img-toolbar';

        var saveBtn = document.createElement('button');
        saveBtn.className = 'ibx-toolbar-save';
        saveBtn.textContent = 'Save';
        saveBtn.type = 'button';

        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'ibx-toolbar-cancel';
        cancelBtn.textContent = '✕ cancel';
        cancelBtn.type = 'button';

        var statusSpan = document.createElement('span');
        statusSpan.className = 'ibx-toolbar-status';

        toolbar.appendChild(saveBtn);
        toolbar.appendChild(cancelBtn);
        toolbar.appendChild(statusSpan);
        wrap.appendChild(urlInput);
        wrap.appendChild(toolbar);

        // Append overlay to the image's parent (which has position:relative via ibx-editable)
        el.parentNode.appendChild(wrap);
        urlInput.focus();
        urlInput.select();

        function cancelImg() {
          if (!isEditing) return;
          isEditing = false;
          el.setAttribute('src', originalSrc);
          wrap.remove();
          el.classList.remove('ibx-editing');
        }

        cancelBtn.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); cancelImg(); });

        urlInput.addEventListener('keydown', function (ev) {
          if (ev.key === 'Escape') { ev.preventDefault(); cancelImg(); }
          if (ev.key === 'Enter') { ev.preventDefault(); saveImg(); }
        });

        // Live preview: update src as URL changes
        urlInput.addEventListener('input', function () {
          var v = urlInput.value.trim();
          if (v && v !== originalSrc) el.setAttribute('src', v);
        });

        async function saveImg() {
          var newSrc = urlInput.value.trim();
          if (!newSrc || newSrc === originalSrc) { cancelImg(); return; }

          saveBtn.disabled = true;
          statusSpan.textContent = 'Saving…';

          var fieldId = el.getAttribute('data-field-id');
          var pageId = getPageId();

          try {
            var res = await fetch(cfg('webhookUrl'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fieldId: fieldId, value: newSrc, page: pageId, timestamp: new Date().toISOString() }),
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);

            isEditing = false;
            el.setAttribute('src', newSrc);
            wrap.remove();
            el.classList.remove('ibx-editing');
            el.classList.add('ibx-flash-ok');
            setTimeout(function () { el.classList.remove('ibx-flash-ok'); }, 800);
            console.log('[IBX Editor] Saved image:', fieldId, '→', newSrc.substring(0, 60) + (newSrc.length > 60 ? '…' : ''));
          } catch (err) {
            console.error('[IBX Editor] Image save failed:', err);
            saveBtn.disabled = false;
            statusSpan.textContent = 'Save failed — try again';
            el.classList.add('ibx-flash-err');
            setTimeout(function () { el.classList.remove('ibx-flash-err'); }, 800);
          }
        }

        saveBtn.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); saveImg(); });
      }

      function startEdit() {
        isEditing = true;

        // Stash original content — this is the cancel state
        originalText = el.textContent.trim();

        el.classList.add('ibx-editing');

        // Determine input type
        const useTextarea = needsTextarea(el);

        // Create input, seeded with current content
        inputEl = document.createElement(useTextarea ? 'textarea' : 'input');
        inputEl.className = 'ibx-input';
        if (!useTextarea) inputEl.type = 'text';
        inputEl.value = originalText;

        // Match approximate dimensions
        const rect = el.getBoundingClientRect();
        if (useTextarea) {
          inputEl.style.minHeight = Math.max(60, rect.height + 10) + 'px';
        }

        // Hide original content, show input
        // Store all child nodes so we can restore them on cancel
        const originalNodes = [];
        while (el.firstChild) {
          if (el.firstChild === pencil) {
            el.removeChild(pencil);
            continue;
          }
          originalNodes.push(el.removeChild(el.firstChild));
        }
        el.appendChild(inputEl);

        // Build toolbar: save + cancel
        toolbarEl = document.createElement('div');
        toolbarEl.className = 'ibx-toolbar';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'ibx-toolbar-save';
        saveBtn.textContent = 'Save';
        saveBtn.type = 'button';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'ibx-toolbar-cancel';
        cancelBtn.textContent = '✕ cancel';
        cancelBtn.type = 'button';

        const statusSpan = document.createElement('span');
        statusSpan.className = 'ibx-toolbar-status';

        toolbarEl.appendChild(saveBtn);
        toolbarEl.appendChild(cancelBtn);
        toolbarEl.appendChild(statusSpan);
        el.appendChild(toolbarEl);

        // Focus the input
        inputEl.focus();
        if (!useTextarea) inputEl.select();

        // ── Cancel: restore original ──
        function cancel() {
          if (!isEditing) return;
          isEditing = false;

          // Remove input + toolbar
          if (inputEl && inputEl.parentNode) inputEl.remove();
          if (toolbarEl && toolbarEl.parentNode) toolbarEl.remove();

          // Restore original child nodes
          originalNodes.forEach(function (node) { el.appendChild(node); });

          // Re-add pencil
          el.appendChild(pencil);
          el.classList.remove('ibx-editing');

          inputEl = null;
          toolbarEl = null;
        }

        cancelBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          cancel();
        });

        // Escape key cancels
        inputEl.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
          // Enter saves (for single-line inputs only)
          if (e.key === 'Enter' && !useTextarea) {
            e.preventDefault();
            save();
          }
        });

        // ── Save: POST to 702, update DOM ──
        async function save() {
          const newValue = inputEl.value.trim();

          // No change — just cancel
          if (newValue === originalText) {
            cancel();
            return;
          }

          // Disable while saving
          saveBtn.disabled = true;
          statusSpan.textContent = 'Saving…';

          const fieldId = el.getAttribute('data-field-id');
          const pageId = getPageId();

          try {
            const res = await fetch(cfg('webhookUrl'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fieldId: fieldId,
                value: newValue,
                page: pageId,
                timestamp: new Date().toISOString(),
              }),
            });

            if (!res.ok) throw new Error('HTTP ' + res.status);

            // Success — update DOM with new text
            isEditing = false;
            if (inputEl && inputEl.parentNode) inputEl.remove();
            if (toolbarEl && toolbarEl.parentNode) toolbarEl.remove();

            el.textContent = newValue;
            el.appendChild(pencil);
            el.classList.remove('ibx-editing');

            // Green flash
            el.classList.add('ibx-flash-ok');
            setTimeout(function () { el.classList.remove('ibx-flash-ok'); }, 800);

            console.log('[IBX Editor] Saved:', fieldId, '→', newValue.substring(0, 50) + (newValue.length > 50 ? '…' : ''));
            inputEl = null;
            toolbarEl = null;

          } catch (err) {
            console.error('[IBX Editor] Save failed:', err);
            saveBtn.disabled = false;
            statusSpan.textContent = 'Save failed — try again';

            // Red flash on toolbar
            el.classList.add('ibx-flash-err');
            setTimeout(function () { el.classList.remove('ibx-flash-err'); }, 800);
          }
        }

        saveBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          save();
        });
      }
    });

    // Bottom bar
    showBar(elements.length);

    console.log('[IBX Editor] Activated on', elements.length, 'elements');
  }

  // ── Admin bottom bar ────────────────────────────────────
  function showBar(count) {
    if (document.getElementById('ibx-admin-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'ibx-admin-bar';
    bar.className = 'ibx-bar';
    bar.innerHTML = '<span class="ibx-bar-icon">✏️</span><span class="ibx-bar-text">Edit Mode — ' + count + ' editable field' + (count !== 1 ? 's' : '') + ' on this page</span>';
    document.body.appendChild(bar);
  }

  // ── Init ────────────────────────────────────────────────
  async function init() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      await new Promise(function (r) { document.addEventListener('DOMContentLoaded', r); });
    }

    const admin = await isAdmin();
    if (!admin) return;

    injectStyles();
    activate();
  }

  init();
})();
