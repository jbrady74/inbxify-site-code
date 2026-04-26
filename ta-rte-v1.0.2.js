/* ============================================================
   ta-rte-v1.0.2.js
   INBXIFY — Shared Rich Text Editor Component
   Trix-based RTE with MEDIA image picker + Uploadcare insertion
   Mounts into any container via InbxRTE.init(config)

   v1.0.2 changes (S9 Part A — picker fix + article-link affordance):
     - readMediaItems(): SELECTOR FIX
         was: querySelector('.media-wrapper').querySelectorAll('.w-dyn-item')
         now: querySelectorAll('.media-wrapper[data-item]')
         Reason: post-S6 MEDIA collection items are flat at document level —
         each .media-wrapper[data-item] IS the item, not a parent of items.
         Aligns with Studio's cmpReadItems() pattern in ta-studio-v1.2.6.js:2748.
     - articleSlug config option added (passed by Studio at openFullscreen call)
     - Article title in header is now a clickable link to the live Article page,
       opening in a new tab. Slug-based: https://{titleSlug}.inbxify.com/articles/{articleSlug}
       (or whatever publishedSiteOrigin resolves to). Falls back to a plain badge
       if articleSlug is not provided.
     - openFullscreen / init contracts UNCHANGED — Studio v1.2.6 keeps working
       without modification (just won't show the link until Studio passes articleSlug).

   v1.0.1 changes (S9 Part A — schema migration only):
     - readMediaItems(): rewritten for post-S6 MEDIA schema
         data-media-id / data-media-name / data-media-type /
         data-component-role / data-status / data-article-id / data-image-url
     - Picker filter: mediaType === 'Image' AND (articleId === current OR status === 'Available')
     - Status binding is option NAME not hash (HC-006 precedent)
     - T-A scope is server-side via Collection List filter — no JS scope filter
     - Insert flow: <img src> uses bare data-image-url (no JS-side transform)
                   data-media-id attribute on <img> = Webflow MEDIA Item ID
     - Removed: imageWidths config, width selector UI, buildUcUrl helper
     - Caption input retained
     - Fixed duplicate destroy() method (TD-137)

   Out of scope for v1.0.2 (deferred to A.3 / Part B):
     - Route 4 attach on body save reconciliation (A.3)
     - Inline upload mode (Part B)
     - Embedded mode adoption by Transcriber (Part C)
   ============================================================ */

(function () {
  'use strict';

  const VERSION = '1.0.2';
  const TRIX_CSS = 'https://unpkg.com/trix@2.0.10/dist/trix.css';
  const TRIX_JS = 'https://unpkg.com/trix@2.0.10/dist/trix.umd.min.js';

  /* ── Brand tokens ── */
  const TEAL = '#1a3a3a';
  const GOLD = '#c4a35a';
  const CREAM = '#faf9f5';
  const CREAM_ALT = '#f0edd8';
  const BORDER = '#e8e4d8';
  const TEXT_DARK = '#1a3a3a';
  const TEXT_MID = '#5a6a5a';
  const TEXT_LIGHT = '#8a8a7a';
  const TEXT_TINY = '#a0a090';

  /* ── Default config ── */
  const DEFAULTS = {
    mountSelector: '#ta-rte-mount',
    mediaWrapperSelector: '.media-wrapper',  // legacy — ignored in v1.0.2; readMediaItems uses canonical .media-wrapper[data-item] query
    uploadcareBase: null,             // e.g. 'https://uyluucdnr2.ucarecd.net' — read from TA_CONFIG (used for thumb display only in v1.0.1)
    webhookUrl: null,                  // Make webhook for saving (legacy fallback; Studio passes onSave)
    articleItemId: null,               // Webflow Article Item ID — {Self} Item ID
    articleTitle: '',                   // Display name for context
    articleViewUrl: '',                 // Optional full URL to view the live Article (badge becomes a link if provided)
    initialHTML: '',                    // Pre-fill body content
    mode: 'edit',                      // 'edit' | 'review' (review = Transcriber output)
    fullscreen: false,                 // true = render in fullscreen overlay appended to body
    onSave: null,                      // callback(html, articleItemId)
    onCancel: null,                    // callback()
    onClose: null,                     // callback() — fullscreen close (after cancel confirm if dirty)
  };

  /* ── Utility ── */
  function loadCSS(href) {
    if (document.querySelector(`link[href="${href}"]`)) return Promise.resolve();
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
    });
  }

  function loadScript(src) {
    if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
    if (window.Trix) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function generateId() { return 'rte-' + Math.random().toString(36).substr(2, 9); }

  /* ── Read MEDIA items from the page DOM ──
     Schema (post-S6, confirmed via Webflow Designer audit AND ta-studio-v1.2.6.js:2748):
       data-media-id        ← (Self) MEDIA Item ID  (Webflow Item ID — body-save reconciliation marker)
       data-media-name      ← Name
       data-media-type      ← Media Type            (option NAME, e.g. "Image" or "Text")
       data-component-role  ← Component Role        (option NAME, e.g. "Interior Image")
       data-status          ← Status                (option NAME: "Available" / "Attached" / "Archived")
       data-article-id      ← This Article's Item ID (single-ref ID, may be empty)
       data-image-url       ← Image URL             (full Uploadcare URL, conditioned by Scenario B)

     Structure: each MEDIA record renders as a flat .media-wrapper[data-item] element
     at document level (NOT nested inside a single parent collection-list wrapper).
     This matches Studio's cmpReadItems() pattern.

     Multi-tenant scope is enforced server-side by the Collection List's TITLE-ADMIN filter.
     The 'selector' parameter is retained for backward compatibility but ignored if it does
     not match the post-S6 pattern; the canonical query is .media-wrapper[data-item].
  ── */
  function readMediaItems(selector) {
    // Canonical post-S6 query: every MEDIA record renders as .media-wrapper[data-item]
    var wraps = document.querySelectorAll('.media-wrapper[data-item]');
    if (wraps.length === 0) {
      console.warn('[RTE] No .media-wrapper[data-item] elements found on page');
      return [];
    }
    const media = [];
    Array.prototype.forEach.call(wraps, function (el) {
      const id            = el.getAttribute('data-media-id')        || '';
      const name          = el.getAttribute('data-media-name')      || '';
      const mediaType     = el.getAttribute('data-media-type')      || '';
      const componentRole = el.getAttribute('data-component-role')  || '';
      const status        = el.getAttribute('data-status')          || '';
      const articleId     = el.getAttribute('data-article-id')      || '';
      const imageUrl      = el.getAttribute('data-image-url')       || '';
      if (id) {
        media.push({ id, name, mediaType, componentRole, status, articleId, imageUrl, el });
      }
    });
    return media;
  }

  /* ── Strip Trix wrapper attributes for clean Webflow HTML ── */
  function cleanHTMLForWebflow(html) {
    const div = document.createElement('div');
    div.innerHTML = html;

    // Trix wraps attachments in <figure data-trix-attachment="...">
    // We keep the <figure> but strip Trix-specific attributes
    div.querySelectorAll('figure').forEach(fig => {
      fig.removeAttribute('data-trix-attachment');
      fig.removeAttribute('data-trix-content-type');
      fig.removeAttribute('data-trix-attributes');
      fig.removeAttribute('class'); // Remove trix attachment classes
    });

    // Remove any data-trix-* attributes from all elements
    div.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('data-trix')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    // Remove empty <br> tags that Trix inserts as placeholders
    div.querySelectorAll('br[data-trix-serialize="false"]').forEach(br => br.remove());

    return div.innerHTML;
  }

  /* ── Count words + chars ── */
  function countContent(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || '';
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const images = (html.match(/<img /g) || []).length;
    return { chars, words, images };
  }

  /* ============================================================
     MAIN CLASS
     ============================================================ */
  class InbxRTE {
    constructor(config) {
      this.cfg = Object.assign({}, DEFAULTS, config);
      this.id = generateId();
      this.mount = null;
      this.editorEl = null;
      this.trixEditor = null;
      this.pickerOpen = false;
      this.selectedMediaId = null;
      this.mediaItems = [];
      this.originalHTML = this.cfg.initialHTML;
      this.dirty = false;
    }

    async init() {
      if (this.cfg.fullscreen) {
        // Create fullscreen overlay appended to body
        this._fsOverlay = document.createElement('div');
        this._fsOverlay.id = this.id + '-fs-overlay';
        this._fsOverlay.className = 'rte-fs-overlay';
        this._fsOverlay.innerHTML = `<div class="rte-fs-panel"><div class="rte-fs-mount" id="${this.id}-fs-mount"></div></div>`;
        document.body.appendChild(this._fsOverlay);
        this.mount = this._fsOverlay.querySelector(`#${this.id}-fs-mount`);

        // Close on overlay click (outside panel)
        this._fsOverlay.addEventListener('click', (e) => {
          if (e.target === this._fsOverlay) this.closeFullscreen();
        });

        // Escape key
        this._escHandler = (e) => { if (e.key === 'Escape') this.closeFullscreen(); };
        document.addEventListener('keydown', this._escHandler);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
      } else {
        this.mount = document.querySelector(this.cfg.mountSelector);
        if (!this.mount) {
          console.error('[RTE] Mount element not found:', this.cfg.mountSelector);
          return;
        }
      }

      // Load Trix
      await loadCSS(TRIX_CSS);
      await loadScript(TRIX_JS);

      // Read MEDIA items from DOM
      this.mediaItems = readMediaItems(this.cfg.mediaWrapperSelector);

      // Build UI
      this.render();

      console.log(`[RTE] ta-rte v${VERSION} initialized${this.cfg.fullscreen ? ' (fullscreen)' : ''} | ${this.mediaItems.length} MEDIA items loaded`);
    }

    render() {
      const inputId = this.id + '-input';

      this.mount.innerHTML = `
        <div class="rte-root" id="${this.id}">
          <div class="rte-header">
            <div class="rte-header-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="${GOLD}" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
              </svg>
            </div>
            <div class="rte-header-text">
              <div class="rte-header-title">Article body editor</div>
              <div class="rte-header-sub">${this.cfg.mode === 'review' ? 'Review transcription \u2014 edit before saving' : 'Edit body \u2014 insert images at cursor'}</div>
            </div>
            ${this.cfg.articleTitle ? (
              this.cfg.articleViewUrl
                ? `<a class="rte-article-badge rte-article-badge-link" href="${esc(this.cfg.articleViewUrl)}" target="_blank" rel="noopener" title="Open live article in new tab">
                     <span>${esc(this.cfg.articleTitle)}</span>
                     <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px;vertical-align:-1px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                   </a>`
                : `<span class="rte-article-badge">${esc(this.cfg.articleTitle)}</span>`
            ) : ''}
            <span class="rte-version">v${VERSION}</span>
            ${this.cfg.fullscreen ? `<button class="rte-close-btn" id="${this.id}-close-fs" title="Close editor">\u2715</button>` : ''}
          </div>

          <input type="hidden" id="${inputId}" value="">
          <trix-editor input="${inputId}" class="rte-trix-editor"></trix-editor>

          <div class="rte-status-bar" id="${this.id}-status">
            <span class="rte-char-count" id="${this.id}-counts">0 chars \u00B7 0 words</span>
            <span class="rte-char-count">Webflow RTE compatible</span>
          </div>

          <div class="rte-picker-panel" id="${this.id}-picker" style="display:none;"></div>

          <div class="rte-save-row">
            <button class="rte-btn rte-btn-cancel" id="${this.id}-cancel">cancel edits</button>
            <div class="rte-save-right">
              <span class="rte-dirty-indicator" id="${this.id}-dirty" style="display:none;">unsaved changes</span>
              <button class="rte-btn rte-btn-save" id="${this.id}-save">Save to CMS</button>
            </div>
          </div>
        </div>
      `;

      this.injectStyles();
      this.waitForTrixInit();
    }

    waitForTrixInit() {
      const el = this.mount.querySelector('trix-editor');
      if (!el) return;

      el.addEventListener('trix-initialize', () => {
        this.editorEl = el;
        this.trixEditor = el.editor;

        // Customize toolbar
        this.customizeToolbar();

        // Set initial content
        if (this.cfg.initialHTML) {
          this.trixEditor.loadHTML(this.cfg.initialHTML);
        }

        // Track changes
        el.addEventListener('trix-change', () => {
          this.dirty = true;
          this.updateCounts();
          this.updateDirtyState();
        });

        // Bind save/cancel/close
        this.mount.querySelector(`#${this.id}-cancel`).addEventListener('click', () => this.handleCancel());
        this.mount.querySelector(`#${this.id}-save`).addEventListener('click', () => this.handleSave());
        const closeBtn = this.mount.querySelector(`#${this.id}-close-fs`);
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeFullscreen());

        this.updateCounts();
      });
    }

    /* ── Toolbar customization ── */
    customizeToolbar() {
      const toolbar = this.mount.querySelector('trix-toolbar');
      if (!toolbar) return;

      // Remove strike button (not in Webflow RTE subset)
      const strike = toolbar.querySelector('.trix-button--icon-strike');
      if (strike) strike.remove();

      // Remove file tools group (we have our own image insertion)
      const fileTools = toolbar.querySelector('.trix-button-group--file-tools');
      if (fileTools) fileTools.remove();

      // Add H2 button
      const blockGroup = toolbar.querySelector('.trix-button-group--block-tools');
      if (blockGroup) {
        // Add H2 — Trix doesn't have heading2 by default, use config
        if (window.Trix && window.Trix.config) {
          window.Trix.config.blockAttributes.heading2 = {
            tagName: 'h2',
            terminal: true,
            breakOnReturn: true,
            group: false
          };
          window.Trix.config.blockAttributes.heading3 = {
            tagName: 'h3',
            terminal: true,
            breakOnReturn: true,
            group: false
          };
        }

        const h2Btn = document.createElement('button');
        h2Btn.type = 'button';
        h2Btn.className = 'trix-button rte-custom-btn';
        h2Btn.setAttribute('data-trix-attribute', 'heading2');
        h2Btn.title = 'Heading 2';
        h2Btn.textContent = 'H2';
        h2Btn.tabIndex = -1;

        const h3Btn = document.createElement('button');
        h3Btn.type = 'button';
        h3Btn.className = 'trix-button rte-custom-btn';
        h3Btn.setAttribute('data-trix-attribute', 'heading3');
        h3Btn.title = 'Heading 3';
        h3Btn.textContent = 'H3';
        h3Btn.tabIndex = -1;

        // Insert before the first button in block tools
        const firstBlock = blockGroup.firstChild;
        blockGroup.insertBefore(h3Btn, firstBlock);
        blockGroup.insertBefore(h2Btn, h3Btn);
      }

      // Add "Insert Image" button to text tools group
      const textGroup = toolbar.querySelector('.trix-button-group--text-tools');
      if (textGroup) {
        const sep = document.createElement('span');
        sep.className = 'rte-toolbar-sep';

        const imgBtn = document.createElement('button');
        imgBtn.type = 'button';
        imgBtn.className = 'trix-button rte-img-insert-btn';
        imgBtn.title = 'Insert image from MEDIA library';
        imgBtn.innerHTML = `
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
          </svg>
          <span>Image</span>
        `;
        imgBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.togglePicker();
        });

        textGroup.appendChild(sep);
        textGroup.appendChild(imgBtn);
      }

      // Disable default file attachment (drag+drop images)
      this.editorEl.addEventListener('trix-file-accept', (e) => {
        e.preventDefault(); // Block direct file drops — use MEDIA picker instead
      });
    }

    /* ── Image picker panel ── */
    togglePicker() {
      this.pickerOpen = !this.pickerOpen;
      const panel = this.mount.querySelector(`#${this.id}-picker`);
      if (this.pickerOpen) {
        this.renderPicker();
        panel.style.display = 'block';
      } else {
        panel.style.display = 'none';
      }
    }

    renderPicker() {
      const panel = this.mount.querySelector(`#${this.id}-picker`);

      // Filter to image-type MEDIA items with a usable URL.
      // Status binding is option NAME (HC-006 precedent); compare string literals.
      const images = this.mediaItems.filter(m =>
        m.mediaType === 'Image' && m.imageUrl
      );

      // Split: already linked to this Article vs Available pool.
      // Per the locked picker rule:
      //   show MEDIA where mediaType === 'Image' AND imageUrl present AND
      //     (articleId === currentArticleItemId OR status === 'Available')
      // Multi-tenant scope is server-side via the Collection List filter.
      const currentArticleId = this.cfg.articleItemId || '';
      const linked = images
        .filter(m => currentArticleId && m.articleId === currentArticleId)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      const available = images
        .filter(m => m.status === 'Available' && m.articleId !== currentArticleId)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      // Uploadcare base for thumbnail display only (NOT applied to inserted <img> URL).
      // We append a 200x transform here purely so the picker grid is fast — the inserted
      // image uses the bare data-image-url. If the bare URL already carries transforms
      // applied by Scenario B, the thumb transform is ignored by Uploadcare.
      const ucBase = (this.cfg.uploadcareBase || (window.TA_CONFIG && window.TA_CONFIG.uploadcareBase) || '').replace(/\/+$/, '');
      const buildThumb = (url) => {
        if (!url) return '';
        // If URL is already a CDN URL with operations, use it as-is for the thumb.
        // If it's a bare UUID-ended URL, append a 200x transform for grid display.
        if (/-\/resize\//.test(url) || /\/-\//.test(url)) return url;
        return url.replace(/\/+$/, '') + '/-/resize/200x/-/format/auto/-/quality/smart/';
      };

      const statusClass = (s) => {
        const k = (s || '').toLowerCase();
        if (k === 'available') return 'available';
        if (k === 'attached')  return 'attached';
        if (k === 'archived')  return 'archived';
        return 'unknown';
      };

      const renderItem = (m) => {
        const isSelected = m.id === this.selectedMediaId;
        const thumbUrl = buildThumb(m.imageUrl);
        return `
          <div class="rte-picker-item ${isSelected ? 'selected' : ''}" data-media-id="${esc(m.id)}">
            <div class="rte-picker-thumb" ${thumbUrl ? `style="background-image:url('${esc(thumbUrl)}');background-size:cover;background-position:center;"` : ''}>
              ${thumbUrl ? '' : esc(m.name)}
            </div>
            <div class="rte-picker-info">
              <div class="rte-picker-name" title="${esc(m.name)}">${esc(m.name)}</div>
              <div class="rte-picker-meta">
                <span class="rte-picker-role">${esc(m.componentRole || '')}</span>
                <span class="rte-picker-status rte-picker-status-${statusClass(m.status)}">${esc(m.status || '')}</span>
              </div>
            </div>
          </div>
        `;
      };

      const totalShown = linked.length + available.length;
      const linkedSection = linked.length ? `
        <div class="rte-picker-section-label">Already in this article (${linked.length})</div>
        <div class="rte-picker-grid">${linked.map(renderItem).join('')}</div>
      ` : '';
      const availableSection = available.length ? `
        <div class="rte-picker-section-label">Available to insert (${available.length})</div>
        <div class="rte-picker-grid">${available.map(renderItem).join('')}</div>
      ` : '';

      panel.innerHTML = `
        <div class="rte-picker-header">
          <span class="rte-picker-title">Insert image from MEDIA library</span>
          <span class="rte-picker-count">${totalShown} image${totalShown !== 1 ? 's' : ''}</span>
          <button class="rte-picker-close" id="${this.id}-picker-close">close</button>
        </div>
        ${totalShown === 0 ? `
          <div class="rte-picker-empty">No MEDIA images available for this article. Upload images via the Uploads Processor or drop them in the Publisher Upload Folder first.</div>
        ` : `
          ${linkedSection}
          ${availableSection}
          <div class="rte-picker-actions">
            <label class="rte-picker-caption-wrap">
              <span class="rte-picker-size-label">Caption:</span>
              <input type="text" class="rte-picker-caption-input" id="${this.id}-caption" placeholder="Image caption (optional)">
            </label>
            <div class="rte-picker-spacer"></div>
            <button class="rte-picker-insert-btn" id="${this.id}-insert-btn" ${this.selectedMediaId ? '' : 'disabled'}>Insert at cursor</button>
          </div>
        `}
      `;

      // Bind events
      panel.querySelector(`#${this.id}-picker-close`).addEventListener('click', () => this.togglePicker());

      panel.querySelectorAll('.rte-picker-item').forEach(item => {
        item.addEventListener('click', () => {
          this.selectedMediaId = item.getAttribute('data-media-id');
          this.renderPicker(); // Re-render to show selection
        });
      });

      const insertBtn = panel.querySelector(`#${this.id}-insert-btn`);
      if (insertBtn) {
        insertBtn.addEventListener('click', () => this.insertImage());
      }
    }

    /* ── Insert image at cursor ──
       Inserts a <figure><img data-media-id=... data-component-role=...></figure>
       at the current cursor position. The src is the bare data-image-url straight
       from the MEDIA row — NO JS-side transforms applied (per S9 decision #3:
       transforms are component-role-specific and applied downstream by Scenario B
       or component-role-specific render paths).

       The data-media-id attribute on the <img> is the Webflow MEDIA Item ID. This
       is the body-save reconciliation marker: at body save (Part A.3 / Part B), the
       saved HTML is scanned for these markers, diffed against MEDIA's current Article
       links, and Route 4 attaches fire for newly-referenced MEDIA rows.
    ── */
    insertImage() {
      if (!this.selectedMediaId || !this.trixEditor) return;

      const media = this.mediaItems.find(m => m.id === this.selectedMediaId);
      if (!media || !media.imageUrl) {
        console.error('[RTE] Selected MEDIA row has no imageUrl');
        return;
      }

      const captionEl = this.mount.querySelector(`#${this.id}-caption`);
      const caption = captionEl ? captionEl.value : '';

      // Bare URL — no JS-side transforms. Component-role-specific transforms are
      // applied downstream (e.g. Scenario B during conditioning, render paths, etc).
      const figureHTML = `<figure class="rte-inserted-image">`
        + `<img src="${esc(media.imageUrl)}" alt="${esc(caption || media.name)}" data-media-id="${esc(media.id)}" data-component-role="${esc(media.componentRole || '')}">`
        + (caption ? `<figcaption>${esc(caption)}</figcaption>` : '')
        + `</figure>`;

      // Insert as Trix content attachment (preserves HTML as-is)
      const attachment = new window.Trix.Attachment({ content: figureHTML });
      this.trixEditor.insertAttachment(attachment);

      // Mark dirty
      this.dirty = true;
      this.updateCounts();
      this.updateDirtyState();

      // Close picker
      this.selectedMediaId = null;
      this.togglePicker();

      console.log(`[RTE] Inserted image: ${media.name} | MEDIA ID: ${media.id} | Status: ${media.status} | Role: ${media.componentRole}`);
    }

    /* ── Status bar updates ── */
    updateCounts() {
      const html = this.getHTML();
      const { chars, words, images } = countContent(html);
      const countsEl = this.mount.querySelector(`#${this.id}-counts`);
      if (countsEl) {
        countsEl.textContent = `${chars.toLocaleString()} chars \u00B7 ${words.toLocaleString()} words${images > 0 ? ` \u00B7 ${images} image${images !== 1 ? 's' : ''} inserted` : ''}`;
      }
    }

    updateDirtyState() {
      const indicator = this.mount.querySelector(`#${this.id}-dirty`);
      if (indicator) {
        indicator.style.display = this.dirty ? 'inline' : 'none';
      }
    }

    /* ── Get clean HTML for Webflow ── */
    getHTML() {
      const input = this.mount.querySelector(`#${this.id}-input`);
      return input ? input.value : '';
    }

    getCleanHTML() {
      return cleanHTMLForWebflow(this.getHTML());
    }

    /* ── Save handler ── */
    handleSave() {
      const cleanHTML = this.getCleanHTML();

      if (this.cfg.onSave) {
        this.cfg.onSave(cleanHTML, this.cfg.articleItemId);
        this.dirty = false;
        this.updateDirtyState();
        return;
      }

      if (this.cfg.webhookUrl) {
        const payload = new URLSearchParams({
          articleItemId: this.cfg.articleItemId || '',
          articleBody: cleanHTML,
          action: 'updateBody',
        });

        fetch(this.cfg.webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: payload.toString(),
        }).then(() => {
          this.dirty = false;
          this.updateDirtyState();
          console.log('[RTE] Saved to CMS via webhook');
        }).catch(err => {
          console.error('[RTE] Save failed:', err);
        });
        return;
      }

      console.warn('[RTE] No onSave callback or webhookUrl configured');
    }

    /* ── Cancel handler ── */
    handleCancel() {
      if (this.cfg.fullscreen) {
        this.closeFullscreen();
        return;
      }

      if (this.dirty) {
        if (!confirm('You have unsaved changes. Discard them?')) return;
      }

      if (this.cfg.onCancel) {
        this.cfg.onCancel();
        return;
      }

      // Revert to original
      if (this.trixEditor && this.originalHTML) {
        this.trixEditor.loadHTML(this.originalHTML);
      }
      this.dirty = false;
      this.updateDirtyState();
      this.updateCounts();
    }

    /* ── Programmatic API ── */
    setContent(html) {
      if (this.trixEditor) {
        this.trixEditor.loadHTML(html);
        this.originalHTML = html;
        this.dirty = false;
        this.updateCounts();
        this.updateDirtyState();
      }
    }

    focus() {
      if (this.editorEl) this.editorEl.focus();
    }

    closeFullscreen() {
      if (!this.cfg.fullscreen) return;
      if (this.dirty) {
        if (!confirm('You have unsaved changes. Close anyway?')) return;
      }
      this.destroy();
      if (this.cfg.onClose) this.cfg.onClose();
    }

    /* ── Destroy ── */
    destroy() {
      if (this._escHandler) {
        document.removeEventListener('keydown', this._escHandler);
        this._escHandler = null;
      }
      if (this._fsOverlay) {
        this._fsOverlay.remove();
        this._fsOverlay = null;
        document.body.style.overflow = '';
      }
      if (this.mount && !this.cfg.fullscreen) {
        this.mount.innerHTML = '';
      }
      this.mount = null;
      this.editorEl = null;
      this.trixEditor = null;
    }

    /* ── Inject scoped styles ── */
    injectStyles() {
      if (document.getElementById('ta-rte-styles')) return;
      const style = document.createElement('style');
      style.id = 'ta-rte-styles';
      style.textContent = `
        /* ── RTE Root ── */
        .rte-root { font-family: 'DM Sans', system-ui, sans-serif; }

        /* ── Header ── */
        .rte-header { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .rte-header-icon { width:26px; height:26px; background:${TEAL}; border-radius:4px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .rte-header-title { font-size:14px; font-weight:600; color:${TEXT_DARK}; }
        .rte-header-sub { font-size:10px; font-family:'DM Mono',monospace; color:${TEXT_LIGHT}; letter-spacing:0.03em; }
        .rte-article-badge { margin-left:auto; font-size:10px; font-family:'DM Mono',monospace; color:#854F0B; background:rgba(196,163,90,0.12); padding:2px 8px; border-radius:3px; display:inline-flex; align-items:center; }
        .rte-article-badge-link { text-decoration:none; transition:background 0.15s, color 0.15s; cursor:pointer; }
        .rte-article-badge-link:hover { background:rgba(196,163,90,0.25); color:${TEAL}; text-decoration:none; }
        .rte-article-badge-link:focus { outline:2px solid ${GOLD}; outline-offset:1px; }
        .rte-version { font-size:9px; font-family:'DM Mono',monospace; background:${TEAL}; color:${GOLD}; padding:2px 6px; border-radius:3px; }

        /* ── Trix overrides ── */
        trix-toolbar { border:none !important; padding:0 !important; }
        trix-toolbar .trix-button-row { overflow:visible; }
        trix-toolbar .trix-button-group { border:1px solid ${BORDER} !important; border-radius:4px !important; margin-right:6px !important; overflow:hidden; }
        trix-toolbar .trix-button { border:none !important; background:${CREAM} !important; min-width:32px; height:30px; }
        trix-toolbar .trix-button:hover { background:${CREAM_ALT} !important; }
        trix-toolbar .trix-button.trix-active { background:${TEAL} !important; }
        trix-toolbar .trix-button.trix-active::before { filter:invert(1); }

        /* Custom toolbar buttons */
        .rte-custom-btn { font-family:'DM Mono',monospace !important; font-size:11px !important; font-weight:600 !important; color:${TEXT_MID} !important; letter-spacing:0.02em; }
        .rte-custom-btn.trix-active { color:white !important; }
        .rte-toolbar-sep { display:inline-block; width:1px; height:20px; background:${BORDER}; margin:0 4px; vertical-align:middle; }

        /* Image insert button */
        .rte-img-insert-btn { display:inline-flex !important; align-items:center !important; gap:4px !important; padding:0 10px !important; font-family:'DM Mono',monospace !important; font-size:10px !important; color:#854F0B !important; background:rgba(196,163,90,0.1) !important; border:1px solid ${GOLD} !important; border-radius:4px !important; margin-left:4px !important; height:30px !important; cursor:pointer !important; }
        .rte-img-insert-btn:hover { background:rgba(196,163,90,0.2) !important; }
        .rte-img-insert-btn span { pointer-events:none; }
        .rte-img-insert-btn svg { pointer-events:none; }

        /* ── Editor area ── */
        trix-editor.rte-trix-editor { border:1.5px solid ${BORDER} !important; border-radius:0 0 6px 6px !important; min-height:280px !important; padding:16px 20px !important; font-family:'DM Sans',system-ui,sans-serif !important; font-size:14px !important; line-height:1.7 !important; color:${TEXT_DARK} !important; background:white !important; }
        trix-editor.rte-trix-editor:focus { border-color:${TEAL} !important; outline:none !important; box-shadow:0 0 0 2px rgba(26,58,58,0.08) !important; }
        trix-editor.rte-trix-editor h1 { font-size:22px; font-weight:700; margin:16px 0 8px; }
        trix-editor.rte-trix-editor h2 { font-size:18px; font-weight:600; margin:14px 0 6px; }
        trix-editor.rte-trix-editor h3 { font-size:16px; font-weight:600; margin:12px 0 6px; }
        trix-editor.rte-trix-editor blockquote { border-left:3px solid ${GOLD}; padding-left:14px; margin:12px 0; color:${TEXT_MID}; font-style:italic; }
        trix-editor.rte-trix-editor figure { margin:16px 0; border-radius:6px; overflow:hidden; border:1px solid ${BORDER}; }
        trix-editor.rte-trix-editor figure img { display:block; max-width:100%; height:auto; }
        trix-editor.rte-trix-editor figcaption { padding:6px 10px; font-size:12px; color:${TEXT_MID}; font-style:italic; background:${CREAM}; }

        /* ── Status bar ── */
        .rte-status-bar { display:flex; align-items:center; justify-content:space-between; padding:5px 10px; border:1px solid ${BORDER}; border-top:none; border-radius:0 0 6px 6px; background:${CREAM}; }
        .rte-char-count { font-size:10px; font-family:'DM Mono',monospace; color:${TEXT_TINY}; }

        /* ── Save row ── */
        .rte-save-row { display:flex; align-items:center; justify-content:space-between; margin-top:10px; }
        .rte-save-right { display:flex; align-items:center; gap:10px; }
        .rte-dirty-indicator { font-size:9px; font-family:'DM Mono',monospace; color:${GOLD}; }
        .rte-btn { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.04em; padding:6px 14px; border-radius:4px; border:none; cursor:pointer; transition:all 0.15s; }
        .rte-btn-cancel { background:transparent; color:#c0392b; border:0.5px solid ${BORDER}; }
        .rte-btn-cancel:hover { background:rgba(192,57,43,0.06); }
        .rte-btn-save { background:${GOLD}; color:white; }
        .rte-btn-save:hover { opacity:0.9; }

        /* ── Picker panel ── */
        .rte-picker-panel { border:1.5px solid ${GOLD}; border-radius:6px; margin-top:10px; overflow:hidden; }
        .rte-picker-header { display:flex; align-items:center; gap:8px; padding:8px 12px; background:rgba(196,163,90,0.08); border-bottom:0.5px solid ${BORDER}; }
        .rte-picker-title { font-size:12px; font-weight:600; color:#854F0B; }
        .rte-picker-count { font-size:9px; font-family:'DM Mono',monospace; color:#854F0B; flex:1; }
        .rte-picker-close { font-size:10px; font-family:'DM Mono',monospace; color:#854F0B; background:none; border:none; cursor:pointer; }
        .rte-picker-close:hover { opacity:0.7; }
        .rte-picker-empty { padding:20px; text-align:center; font-size:12px; color:${TEXT_LIGHT}; }

        /* Picker grid */
        .rte-picker-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:6px; padding:10px; }
        .rte-picker-section-label { font-size:9px; font-family:'DM Mono',monospace; font-weight:600; color:${TEXT_LIGHT}; text-transform:uppercase; letter-spacing:0.06em; padding:8px 12px 0; }
        .rte-picker-section-label + .rte-picker-grid { padding-top:6px; }
        .rte-picker-item { border:1px solid ${BORDER}; border-radius:6px; overflow:hidden; cursor:pointer; transition:border-color 0.15s; background:white; }
        .rte-picker-item:hover { border-color:${GOLD}; }
        .rte-picker-item.selected { border-color:${GOLD}; border-width:2px; }
        .rte-picker-thumb { width:100%; height:80px; background:${CREAM}; display:flex; align-items:center; justify-content:center; font-size:9px; font-family:'DM Mono',monospace; color:${TEXT_TINY}; overflow:hidden; }
        .rte-picker-info { padding:4px 6px; }
        .rte-picker-name { font-size:10px; font-weight:600; color:${TEXT_DARK}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .rte-picker-meta { font-size:8px; font-family:'DM Mono',monospace; color:${TEXT_TINY}; display:flex; align-items:center; gap:4px; margin-top:2px; }
        .rte-picker-role { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }
        .rte-picker-status { font-size:7px; font-family:'DM Mono',monospace; padding:1px 4px; border-radius:2px; text-transform:uppercase; flex-shrink:0; }
        .rte-picker-status-available { background:rgba(15,157,88,0.1); color:#0F9D58; }
        .rte-picker-status-attached  { background:rgba(196,163,90,0.15); color:#854F0B; }
        .rte-picker-status-archived  { background:rgba(120,120,120,0.12); color:#6a6a6a; }
        .rte-picker-status-unknown   { background:rgba(120,120,120,0.08); color:${TEXT_LIGHT}; }

        /* Picker actions */
        .rte-picker-actions { display:flex; align-items:center; gap:8px; padding:8px 12px; border-top:0.5px solid ${BORDER}; background:${CREAM}; flex-wrap:wrap; }
        .rte-picker-caption-wrap { display:flex; align-items:center; gap:4px; flex:1; min-width:180px; }
        .rte-picker-size-label { font-size:9px; font-family:'DM Mono',monospace; color:${TEXT_LIGHT}; }
        .rte-picker-caption-input { font-size:10px; font-family:'DM Sans',system-ui,sans-serif; border:1px solid ${BORDER}; border-radius:3px; padding:3px 8px; flex:1; color:${TEXT_DARK}; outline:none; }
        .rte-picker-caption-input:focus { border-color:${TEAL}; }
        .rte-picker-spacer { flex:1; }
        .rte-picker-insert-btn { font-size:10px; font-family:'DM Mono',monospace; padding:5px 14px; border-radius:4px; background:${TEAL}; color:${CREAM}; border:none; cursor:pointer; white-space:nowrap; }
        .rte-picker-insert-btn:hover { opacity:0.9; }
        .rte-picker-insert-btn:disabled { opacity:0.4; cursor:not-allowed; }

        /* ── Fullscreen overlay ── */
        .rte-fs-overlay { position:fixed; inset:0; background:rgba(26,58,58,0.7); z-index:10000; display:flex; align-items:flex-start; justify-content:center; padding:24px; overflow-y:auto; }
        .rte-fs-panel { background:white; border-radius:8px; width:100%; max-width:960px; max-height:calc(100vh - 48px); display:flex; flex-direction:column; overflow:hidden; }
        .rte-fs-mount { padding:20px; overflow-y:auto; flex:1; }
        .rte-fs-mount .rte-root { max-width:none; }
        .rte-fs-mount trix-editor.rte-trix-editor { min-height:50vh !important; }
        .rte-fs-mount .rte-header { position:sticky; top:0; background:white; z-index:1; padding-bottom:10px; border-bottom:1px solid ${BORDER}; margin-bottom:12px; }
        .rte-fs-mount .rte-close-btn { width:28px; height:28px; border-radius:50%; border:1.5px solid ${BORDER}; background:white; cursor:pointer; font-size:14px; color:${TEXT_LIGHT}; display:flex; align-items:center; justify-content:center; transition:all 0.15s; flex-shrink:0; margin-left:8px; }
        .rte-fs-mount .rte-close-btn:hover { border-color:#c0392b; color:#c0392b; }
      `;
      document.head.appendChild(style);
    }
  }

  /* ── Public API ── */
  window.InbxRTE = {
    version: VERSION,
    init: function (config) {
      const instance = new InbxRTE(config);
      instance.init();
      return instance;
    },
    openFullscreen: function (config) {
      return this.init(Object.assign({}, config, { fullscreen: true }));
    },
    InbxRTE: InbxRTE,
  };

  console.log(`[RTE] ta-rte v${VERSION} loaded`);
})();
