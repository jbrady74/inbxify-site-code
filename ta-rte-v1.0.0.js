/* ============================================================
   ta-rte-v1.0.0.js
   INBXIFY — Shared Rich Text Editor Component
   Trix-based RTE with MEDIA image picker + Uploadcare insertion
   Mounts into any container via InbxRTE.init(config)
   ============================================================ */

(function () {
  'use strict';

  const VERSION = '1.0.0';
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
    mediaWrapperSelector: '.media-wrapper',
    uploadcareSubdomain: null,        // e.g. 'yoursubdomain' — read from TA_CONFIG
    webhookUrl: null,                  // Make webhook for saving
    articleItemId: null,               // Webflow Article Item ID — {Self} Item ID
    articleTitle: '',                   // Display name for context
    initialHTML: '',                    // Pre-fill body content
    mode: 'edit',                      // 'edit' | 'review' (review = Transcriber output)
    onSave: null,                      // callback(html, articleItemId)
    onCancel: null,                    // callback()
    imageWidths: [
      { label: 'Full width (600px)', value: 600 },
      { label: 'Half width (300px)', value: 300 },
      { label: 'Thumbnail (150px)', value: 150 },
    ],
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

  /* ── Read MEDIA items from hidden collection list ── */
  function readMediaItems(selector) {
    const wrapper = document.querySelector(selector);
    if (!wrapper) {
      console.warn('[RTE] MEDIA wrapper not found:', selector);
      return [];
    }
    const items = wrapper.querySelectorAll('.w-dyn-item');
    const media = [];
    items.forEach(el => {
      const id = (el.querySelector('[data-item-id]') || el).getAttribute('data-item-id') || '';
      const name = (el.querySelector('[data-name]') || el).getAttribute('data-name') || '';
      const uuid = (el.querySelector('[data-uc-uuid]') || el).getAttribute('data-uc-uuid') || '';
      const mediaType = (el.querySelector('[data-media-type]') || el).getAttribute('data-media-type') || '';
      const sortOrder = (el.querySelector('[data-sort-order]') || el).getAttribute('data-sort-order') || '';
      const articleRef = (el.querySelector('[data-article-ref]') || el).getAttribute('data-article-ref') || '';
      const status = (el.querySelector('[data-pipeline-status]') || el).getAttribute('data-pipeline-status') || '';
      const groupId = (el.querySelector('[data-group-id]') || el).getAttribute('data-group-id') || '';
      const groupName = (el.querySelector('[data-group-name]') || el).getAttribute('data-group-name') || '';
      if (id) {
        media.push({ id, name, uuid, mediaType, sortOrder, articleRef, status, groupId, groupName, el });
      }
    });
    return media;
  }

  /* ── Build Uploadcare CDN URL with transforms ── */
  function buildUcUrl(uuid, width, subdomain) {
    const sub = subdomain || (window.TA_CONFIG && window.TA_CONFIG.uploadcareSubdomain) || '';
    if (!uuid || !sub) return '';
    return `https://${sub}.ucarecd.net/${uuid}/-/resize/${width}x/-/format/auto/-/quality/smart/`;
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
      this.selectedWidth = this.cfg.imageWidths[0].value;
      this.mediaItems = [];
      this.originalHTML = this.cfg.initialHTML;
      this.dirty = false;
    }

    async init() {
      this.mount = document.querySelector(this.cfg.mountSelector);
      if (!this.mount) {
        console.error('[RTE] Mount element not found:', this.cfg.mountSelector);
        return;
      }

      // Load Trix
      await loadCSS(TRIX_CSS);
      await loadScript(TRIX_JS);

      // Read MEDIA items from DOM
      this.mediaItems = readMediaItems(this.cfg.mediaWrapperSelector);

      // Build UI
      this.render();

      console.log(`[RTE] ta-rte v${VERSION} initialized | ${this.mediaItems.length} MEDIA items loaded`);
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
            ${this.cfg.articleTitle ? `<span class="rte-article-badge">${esc(this.cfg.articleTitle)}</span>` : ''}
            <span class="rte-version">v${VERSION}</span>
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

        // Bind save/cancel
        this.mount.querySelector(`#${this.id}-cancel`).addEventListener('click', () => this.handleCancel());
        this.mount.querySelector(`#${this.id}-save`).addEventListener('click', () => this.handleSave());

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

      // Filter to image-type MEDIA items
      const images = this.mediaItems.filter(m =>
        m.mediaType.toLowerCase() === 'image' && m.uuid
      );

      // Separate: linked to this article vs unlinked
      const linked = images.filter(m => m.articleRef === this.cfg.articleItemId);
      const available = images.filter(m => !m.articleRef || m.articleRef === this.cfg.articleItemId);

      const renderItem = (m) => {
        const isSelected = m.id === this.selectedMediaId;
        const sub = this.cfg.uploadcareSubdomain || (window.TA_CONFIG && window.TA_CONFIG.uploadcareSubdomain) || '';
        const thumbUrl = sub && m.uuid ? `https://${sub}.ucarecd.net/${m.uuid}/-/resize/200x/-/format/auto/-/quality/smart/` : '';
        return `
          <div class="rte-picker-item ${isSelected ? 'selected' : ''}" data-media-id="${esc(m.id)}">
            <div class="rte-picker-thumb" ${thumbUrl ? `style="background-image:url('${thumbUrl}');background-size:cover;background-position:center;"` : ''}>
              ${thumbUrl ? '' : esc(m.name)}
            </div>
            <div class="rte-picker-info">
              <div class="rte-picker-name">${esc(m.name)}</div>
              <div class="rte-picker-meta">
                ${m.id.substring(0, 8)}\u2026
                <span class="rte-picker-status rte-picker-status-${m.status === 'Assigned' ? 'assigned' : 'ready'}">${esc(m.status || 'ready')}</span>
              </div>
            </div>
          </div>
        `;
      };

      const widthOptions = this.cfg.imageWidths.map(w =>
        `<option value="${w.value}" ${w.value === this.selectedWidth ? 'selected' : ''}>${w.label}</option>`
      ).join('');

      panel.innerHTML = `
        <div class="rte-picker-header">
          <span class="rte-picker-title">Insert image from MEDIA library</span>
          <span class="rte-picker-count">${images.length} image${images.length !== 1 ? 's' : ''}</span>
          <button class="rte-picker-close" id="${this.id}-picker-close">close</button>
        </div>
        ${images.length === 0 ? `
          <div class="rte-picker-empty">No MEDIA images available. Condition and assign images through the Content Processor first.</div>
        ` : `
          <div class="rte-picker-grid">${available.map(renderItem).join('')}</div>
          <div class="rte-picker-actions">
            <div class="rte-picker-size-wrap">
              <label class="rte-picker-size-label">Width:</label>
              <select class="rte-picker-size-select" id="${this.id}-width-sel">${widthOptions}</select>
            </div>
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

      const widthSel = panel.querySelector(`#${this.id}-width-sel`);
      if (widthSel) {
        widthSel.addEventListener('change', (e) => {
          this.selectedWidth = parseInt(e.target.value, 10);
        });
      }

      const insertBtn = panel.querySelector(`#${this.id}-insert-btn`);
      if (insertBtn) {
        insertBtn.addEventListener('click', () => this.insertImage());
      }
    }

    /* ── Insert image at cursor ── */
    insertImage() {
      if (!this.selectedMediaId || !this.trixEditor) return;

      const media = this.mediaItems.find(m => m.id === this.selectedMediaId);
      if (!media || !media.uuid) return;

      const caption = (this.mount.querySelector(`#${this.id}-caption`) || {}).value || '';
      const url = buildUcUrl(media.uuid, this.selectedWidth, this.cfg.uploadcareSubdomain);

      if (!url) {
        console.error('[RTE] Cannot build Uploadcare URL — missing subdomain or UUID');
        return;
      }

      // Build <figure> HTML for Trix content attachment
      const figureHTML = `<figure class="rte-inserted-image">
        <img src="${url}" alt="${esc(caption || media.name)}" width="${this.selectedWidth}">
        ${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}
      </figure>`;

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

      console.log(`[RTE] Inserted image: ${media.name} (${this.selectedWidth}px) | MEDIA ID: ${media.id}`);
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
        .rte-article-badge { margin-left:auto; font-size:10px; font-family:'DM Mono',monospace; color:#854F0B; background:rgba(196,163,90,0.12); padding:2px 8px; border-radius:3px; }
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
        .rte-picker-item { border:1px solid ${BORDER}; border-radius:6px; overflow:hidden; cursor:pointer; transition:border-color 0.15s; }
        .rte-picker-item:hover { border-color:${GOLD}; }
        .rte-picker-item.selected { border-color:${GOLD}; border-width:2px; }
        .rte-picker-thumb { width:100%; height:80px; background:${CREAM}; display:flex; align-items:center; justify-content:center; font-size:9px; font-family:'DM Mono',monospace; color:${TEXT_TINY}; overflow:hidden; }
        .rte-picker-info { padding:4px 6px; }
        .rte-picker-name { font-size:10px; font-weight:600; color:${TEXT_DARK}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .rte-picker-meta { font-size:8px; font-family:'DM Mono',monospace; color:${TEXT_TINY}; display:flex; align-items:center; gap:4px; }
        .rte-picker-status { font-size:7px; font-family:'DM Mono',monospace; padding:1px 4px; border-radius:2px; text-transform:uppercase; }
        .rte-picker-status-ready { background:rgba(15,157,88,0.1); color:#0F9D58; }
        .rte-picker-status-assigned { background:rgba(196,163,90,0.15); color:#854F0B; }

        /* Picker actions */
        .rte-picker-actions { display:flex; align-items:center; gap:8px; padding:8px 12px; border-top:0.5px solid ${BORDER}; background:${CREAM}; flex-wrap:wrap; }
        .rte-picker-size-wrap { display:flex; align-items:center; gap:4px; }
        .rte-picker-caption-wrap { display:flex; align-items:center; gap:4px; flex:1; min-width:180px; }
        .rte-picker-size-label { font-size:9px; font-family:'DM Mono',monospace; color:${TEXT_LIGHT}; }
        .rte-picker-size-select { font-size:9px; font-family:'DM Mono',monospace; border:1px solid ${BORDER}; border-radius:3px; padding:3px 6px; background:white; color:${TEXT_DARK}; }
        .rte-picker-caption-input { font-size:10px; font-family:'DM Sans',system-ui,sans-serif; border:1px solid ${BORDER}; border-radius:3px; padding:3px 8px; flex:1; color:${TEXT_DARK}; outline:none; }
        .rte-picker-caption-input:focus { border-color:${TEAL}; }
        .rte-picker-spacer { flex:1; }
        .rte-picker-insert-btn { font-size:10px; font-family:'DM Mono',monospace; padding:5px 14px; border-radius:4px; background:${TEAL}; color:${CREAM}; border:none; cursor:pointer; white-space:nowrap; }
        .rte-picker-insert-btn:hover { opacity:0.9; }
        .rte-picker-insert-btn:disabled { opacity:0.4; cursor:not-allowed; }
      `;
      document.head.appendChild(style);
    }

    /* ── Destroy ── */
    destroy() {
      if (this.mount) this.mount.innerHTML = '';
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
    InbxRTE: InbxRTE,
  };

  console.log(`[RTE] ta-rte v${VERSION} loaded`);
})();
