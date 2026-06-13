/* ============================================================
   ta-components-tab-v1.0.12.js
   INBXIFY TA Studio — Components tab
   ============================================================

   v1.0.12 — Remove row-click selection + Details as popup modal + close button fix

   1. ATTACH PANEL LAYOUT FIXED
      Panel now renders as .cmp-attach-panel (was incorrectly wrapped
      in .cmp-inline-edit--attach which added dashed border and indent).
      Correct flow per approved mockup:
        label "ATTACH TO…"
        → type pills (Article / Ad / Event / RE Listing)
        → picker appears inline once type is selected
        → Attach button activates once asset is selected
        → Cancel is a gold text link (not ghost button)

   2. WEBFLOW NATIVE CIRCLE SUPPRESSED
      The stray blue/white circle appearing left of each row was
      Webflow's native .w-checkbox binding on the CMS collection list.
      CSS rule added in v1.0.16 companion: .media-wrapper .w-checkbox,
      [data-item] .w-checkbox { display:none !important }

   CSS companion: ta-studio-components-v1.0.16.css

   Webflow head deploy:
     SWAP: ta-components-tab-v1.0.10.js      → ta-components-tab-v1.0.11.js
     SWAP: ta-studio-components-v1.0.15.css  → ta-studio-components-v1.0.16.css

   ── Full version history ──

   v1.0.10 — Secondary button readability + drawer 20% width
     · .cmp-btn bg #ffffff → #f4f1ea (never white on cream page)
     · Drawer width min(440px,92vw) → 20vw, min-width 260px
     · Corporate blue #5b7fff standing rule for selection indicators

   v1.0.9 — Filter icon+popover + list-row layout
     · Filter controls moved from always-visible column into popover
       triggered by filter icon to the right of search input
     · Active-filter count badge on icon
     · Card grid replaced with full-width list rows:
       [ 80×56 thumb ] [ name + meta ] [ Attach ▾ · Status… · Details… ]
     · Attach panel expands as full-width row below triggering row

   v1.0.8 — Primary attach actions
     · Card actions redesigned: [ Attach ▾ ] [ Status… ] [ Details… ]
     · Attach panel: type pills → inline asset picker → Scenario K Route A
     · Customer assign moved to drawer only
     · saveToMediaLibrary() shared helper exposed on public API

   v1.0.7 — (prior version, see that file for history)

   ── Hardcoding entries ──
   HC-CMP-001: SCENARIO_K_URL hardcoded → move to TA_CONFIG.makeAttach
   HC-CMP-002: MEDIA collection ID hardcoded → move to TA_CONFIG.mediaCollId
   HC-CMP-003: Per-type asset collection IDs → move to TA_CONFIG.wfColl*
   ============================================================ */

(function () {
  'use strict';

  var FILE_VERSION = '1.0.12';
  var DEBUG = false;

  // ── HC-CMP-001: Scenario K URL ──
  // Source of truth: platform-data-reference §14a hook id 2718974
  // Move to TA_CONFIG.makeAttach when that key is added.
  var SCENARIO_K_URL = 'https://hook.us1.make.com/b1w6sq7c3dzs8504rnl03ihokg1jsa1t';

  // ── HC-CMP-002: MEDIA collection ID ──
  var MEDIA_COLL_ID = '69990992411206c574331aed';

  // ── HC-CMP-003: Per-type asset collection IDs ──
  // Source: platform-data-reference §6
  var ASSET_COLLS = {
    article: '64e905038caaa2edd76842b5',
    ad:      '68929c45dc27b1bb31fb4404',
    event:   '68f7e5e0f07acb4581519ab4',
    re:      '68d452672ad6cfb333cae5f9'
  };

  // Asset type display labels
  var ASSET_TYPE_LABELS = {
    article: 'Article',
    ad:      'Ad',
    event:   'Event',
    re:      'RE Listing'
  };

  // ── Filter defaults ──
  var DEFAULT_FILTERS = {
    search:         '',
    status:         'Available',
    customerId:     'All',
    sourceChannel:  'All',
    role:           'All',
    mediaType:      'All',
    dateRange:      'All',
    pdfProvenance:  'All',
    hasCustomer:    'All'
  };

  var STATUS_VALUES   = ['Available', 'Attached', 'Archived'];
  var TYPE_VALUES     = ['Image', 'Video', 'Audio', 'Text'];
  var SOURCE_VALUES   = ['Drive', 'Email', 'Form', 'Transcriber'];
  var PDF_PROV_VALUES = ['Converted', 'Transcribed'];
  var DATE_VALUES = [
    { id: 'today', label: 'Today' },
    { id: '7d',    label: 'Last 7 days' },
    { id: '30d',   label: 'Last 30 days' },
    { id: '90d',   label: 'Last 90 days' }
  ];
  var CMP_PREVIEW_CHARS = 180;

  // ════════════════════════════════════════════════════════════
  // 1. STATE
  // ════════════════════════════════════════════════════════════

  var S = {
    mounted:        false,
    rootEl:         null,
    items:          [],
    customers:      [],
    assetCache:     {},   // { article: [], ad: [], event: [], re: [] }
    filters:        cloneObj(DEFAULT_FILTERS),
    selection:      Object.create(null),
    selectionMode:  false,
    drawerOpenId:   null,
    inlineEdit:     null,
    // inlineEdit shape for attach:
    // { mediaId, field:'attach', assetType, assetId, assetName, saving, error }
    bulkEdit:       null,
    filterOpen:     false   // filter popover open/closed
  };

  function cloneObj(o) {
    var out = {};
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = o[k];
    return out;
  }
  function selectionCount() {
    var n = 0;
    for (var k in S.selection) if (S.selection[k]) n++;
    return n;
  }
  function selectionIds() {
    var out = [];
    for (var k in S.selection) if (S.selection[k]) out.push(k);
    return out;
  }
  function clearSelection() {
    S.selection = Object.create(null);
    S.selectionMode = false;
    S.bulkEdit = null;
  }

  // ════════════════════════════════════════════════════════════
  // 2. DOM READERS
  // ════════════════════════════════════════════════════════════

  function readMediaItems() {
    var wraps = document.querySelectorAll('.media-wrapper[data-item]');
    var items = [];
    Array.prototype.forEach.call(wraps, function (el) {
      var d = el.dataset || {};
      var htmlEl = el.querySelector('.cm-media-html');
      var htmlInner = htmlEl ? htmlEl.innerHTML : '';
      var htmlText  = htmlEl ? (htmlEl.innerText || htmlEl.textContent || '') : '';
      var createdStr = (d.htmlCreated || '').trim();
      var createdMs = createdStr ? (new Date(createdStr).getTime() || 0) : 0;
      items.push({
        mediaId:          (d.mediaId || '').trim(),
        name:             (d.mediaName || '').trim(),
        mediaType:        (d.mediaType || '').trim(),
        role:             (d.componentRole || '').trim(),
        status:           (d.status || '').trim(),
        articleId:        (d.articleId || '').trim(),
        customerId:       (d.customerId || '').trim(),
        productId:        (d.productId || '').trim(),
        imageUrl:         (d.imageUrl || '').trim(),
        slug:             (d.slug || '').trim(),
        sourceChannel:    (d.sourceChannel || '').trim(),
        pdfProvenance:    (d.pdfProvenance || '').trim(),
        originalFilename: (d.originalFilename || '').trim(),
        mimeType:         (d.mimeType || '').trim(),
        size:             (d.size || '').trim(),
        createdStr:       createdStr,
        createdMs:        createdMs,
        htmlContent:      htmlInner,
        htmlPreview:      truncate(htmlText, CMP_PREVIEW_CHARS)
      });
    });
    items.sort(function (a, b) { return b.createdMs - a.createdMs; });
    return items;
  }

  function readCustomers() {
    var seen = Object.create(null);
    var out = [];
    var els = document.querySelectorAll('.customers-wrapper[data-item]');
    Array.prototype.forEach.call(els, function (el) {
      var id = (el.dataset.customerId || '').trim();
      if (!id || seen[id]) return;
      seen[id] = true;
      out.push({ id: id, name: (el.dataset.customerName || id).trim() });
    });
    out.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return out;
  }

  // Read assets of a given type from hidden DOM collections
  // Returns array of { id, name }
  function readAssets(assetType) {
    if (S.assetCache[assetType]) return S.assetCache[assetType];
    var selector, idKey, nameKey;
    if (assetType === 'article') {
      selector = '.articles-wrapper[data-item]';
      idKey = 'articleId'; nameKey = 'articleName';
    } else if (assetType === 'ad') {
      selector = '.ads-wrapper[data-item]';
      idKey = 'adId'; nameKey = 'adName';
    } else if (assetType === 'event') {
      selector = '[data-events-wrapper][data-item]';
      idKey = 'eventId'; nameKey = 'eventName';
    } else if (assetType === 're') {
      selector = '[data-re-wrapper][data-item]';
      idKey = 'reId'; nameKey = 'reName';
    } else {
      return [];
    }
    var out = [];
    var els = document.querySelectorAll(selector);
    Array.prototype.forEach.call(els, function (el) {
      var id = (el.dataset[idKey] || el.dataset.itemId || '').trim();
      var name = (el.dataset[nameKey] || el.dataset.name || id).trim();
      if (id) out.push({ id: id, name: name });
    });
    out.sort(function (a, b) { return a.name.localeCompare(b.name); });
    S.assetCache[assetType] = out;
    return out;
  }

  // ════════════════════════════════════════════════════════════
  // 3. HELPERS
  // ════════════════════════════════════════════════════════════

  function cfg() { return window.TA_CONFIG || {}; }
  function customerNameById(id) {
    if (!id) return '';
    for (var i = 0; i < S.customers.length; i++) {
      if (S.customers[i].id === id) return S.customers[i].name;
    }
    return id;
  }
  function findItem(mediaId) {
    for (var i = 0; i < S.items.length; i++) {
      if (S.items[i].mediaId === mediaId) return S.items[i];
    }
    return null;
  }

  function bulkCreateArticle() {
    var ids = selectionIds();
    if (!ids.length) { toast('Select at least one component first.'); return; }
    if (!window.InbxASF || typeof window.InbxASF.open !== 'function') {
      toast('ASF not loaded — cannot create.');
      return;
    }
    try {
      window.InbxASF.open({ mode: 'create', assetType: 'article', prefilledMediaIds: ids });
    } catch (err) {
      toast('Could not open ASF — see console.');
    }
  }

  // ════════════════════════════════════════════════════════════
  // 4. SHELL
  // ════════════════════════════════════════════════════════════

  function renderShell(root) {
    root.innerHTML =
      '<div class="cmp-root">' +
        '<div class="cmp-header">' +
          '<div class="cmp-header-left">' +
            '<div class="cmp-title">Components</div>' +
            '<div class="cmp-subtitle">Manage every MEDIA row for this Title</div>' +
          '</div>' +
          '<div class="cmp-header-right">' +
            '<span class="cmp-count" id="cmp-count">0</span>' +
          '</div>' +
        '</div>' +
        '<div class="cmp-searchrow" id="cmp-searchrow"></div>' +
        '<div class="cmp-bulkbar" id="cmp-bulkbar" hidden></div>' +
        '<div class="cmp-grid-wrap">' +
          '<div class="cmp-list" id="cmp-grid"></div>' +
        '</div>' +
        '<div class="cmp-detail-host" id="cmp-detail-host"></div>' +
      '</div>';
    bindShellEvents(root);
  }

  function bindShellEvents(root) {
    root.addEventListener('click', function (e) {
      var t = e.target;

      // Reset filters
      if (t.closest && t.closest('[data-cmp-action="reset-filters"]')) {
        S.filters = cloneObj(DEFAULT_FILTERS);
        renderSearchRow(); renderGrid();
        return;
      }

      // Filter icon toggle
      if (t.closest && t.closest('[data-cmp-action="toggle-filter"]')) {
        S.filterOpen = !S.filterOpen;
        renderSearchRow();
        return;
      }

      // Close filter popover on outside click
      var popover = document.getElementById('cmp-filter-popover');
      if (popover && S.filterOpen) {
        var btn = document.getElementById('cmp-filter-btn');
        if (!popover.contains(t) && !(btn && btn.contains(t))) {
          S.filterOpen = false;
          renderSearchRow();
          return;
        }
      }

      // Clear search
      if (t.closest && t.closest('[data-cmp-action="clear-search"]')) {
        S.filters.search = '';
        renderSearchRow(); renderGrid(); return;
      }

      // Card actions
      var card = t.closest && t.closest('[data-cmp-card]');
      // v1.0.11: attach panel is a sibling of the row, not a child.
      // Catch clicks inside .cmp-row-panel and resolve the mediaId from data-cmp-panel.
      if (!card) {
        var panel = t.closest && t.closest('[data-cmp-panel]');
        if (panel) card = { getAttribute: function() { return panel.getAttribute('data-cmp-panel'); } };
      }
      if (card) {
        var cardId = card.getAttribute('data-cmp-card') || card.getAttribute('data-cmp-panel');

        // Expand preview (lightbox)
        if (t.closest('[data-cmp-card-action="expand-preview"]')) {
          e.stopPropagation();
          var it = S.items && S.items.find ? S.items.find(function (x) { return x.mediaId === cardId; }) : null;
          if (!it || !it.imageUrl) return;
          if (typeof window.InbxLightbox !== 'undefined' && typeof window.InbxLightbox.open === 'function') {
            window.InbxLightbox.open(it.imageUrl, { caption: it.name });
          }
          return;
        }

        // Drawer
        if (t.closest('[data-cmp-card-action="open-drawer"]')) {
          openDrawer(cardId); return;
        }

        // ── NEW: Attach disclosure ──
        if (t.closest('[data-cmp-card-action="open-attach"]')) {
          beginAttach(cardId); return;
        }

        // ── NEW: Asset type selection inside attach panel ──
        var typeBtn = t.closest && t.closest('[data-cmp-attach-type]');
        if (typeBtn && S.inlineEdit && S.inlineEdit.mediaId === cardId && S.inlineEdit.field === 'attach') {
          selectAttachType(typeBtn.getAttribute('data-cmp-attach-type'));
          return;
        }

        // Status quick-edit (unchanged)
        if (t.closest('[data-cmp-card-action="quick-edit-status"]')) {
          beginInlineEdit(cardId, 'status'); return;
        }

        // Save inline edit
        if (t.closest('[data-cmp-card-action="save-edit"]')) {
          if (S.inlineEdit && S.inlineEdit.field === 'attach') {
            saveAttach(); return;
          }
          // status save — stub (Sub-session C legacy)
          cancelInlineEdit();
          toast('Save not wired yet.');
          return;
        }

        // Cancel inline edit
        if (t.closest('[data-cmp-card-action="cancel-edit"]')) {
          cancelInlineEdit(); return;
        }

        // Guard: don't toggle selection when clicking inside inline-edit or attach panel
        if (t.closest('.cmp-inline-edit') || t.closest('.cmp-attach-panel')) return;

        // Row clicks do nothing — selection only via bulk bar "All" button.
        return;
      }

      // Bulk toolbar
      if (t.closest('[data-cmp-bulk="create-article"]')) { bulkCreateArticle(); return; }
      if (t.closest('[data-cmp-bulk="select-all"]'))     { bulkSelectAll(); return; }
      if (t.closest('[data-cmp-bulk="clear-selection"]')) {
        clearSelection(); renderGrid(); renderBulkBar(); return;
      }
      if (t.closest('[data-cmp-bulk="cancel-bulk-edit"]')) {
        S.bulkEdit = null; renderBulkBar(); return;
      }
      var bulkAction = t.closest && t.closest('[data-cmp-bulk-action]');
      if (bulkAction) { beginBulkEdit(bulkAction.getAttribute('data-cmp-bulk-action')); return; }
      if (t.closest('[data-cmp-bulk-apply]')) { toast('Bulk apply not wired yet.'); return; }

      // Drawer close
      if (t.closest('[data-cmp-drawer-action="close"]')) { closeDrawer(); return; }
      if (t.classList && t.classList.contains('cmp-detail-backdrop')) { closeDrawer(); return; }
    });

    root.addEventListener('change', function (e) {
      var t = e.target;

      // Filter selects (inside popover)
      if (t.matches && t.matches('[data-cmp-filter]')) {
        S.filters[t.getAttribute('data-cmp-filter')] = t.value;
        renderSearchRow(); renderGrid(); return;
      }

      // ── Attach asset picker select ──
      if (t.matches && t.matches('[data-cmp-attach-picker]')) {
        if (S.inlineEdit && S.inlineEdit.field === 'attach') {
          var selectedOpt = t.options[t.selectedIndex];
          S.inlineEdit.assetId   = t.value;
          S.inlineEdit.assetName = selectedOpt ? (selectedOpt.text || t.value) : t.value;
          renderGrid();
        }
        return;
      }

      // Inline-edit selects (status)
      if (t.matches && t.matches('[data-cmp-edit-field]')) {
        if (S.inlineEdit) { S.inlineEdit.draftValue = t.value; renderGrid(); }
        return;
      }

      // Bulk-edit selects
      if (t.matches && t.matches('[data-cmp-bulk-field]')) {
        if (S.bulkEdit) { S.bulkEdit.draft = t.value; renderBulkBar(); }
        return;
      }
    });

    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.matches && t.matches('[data-cmp-search]')) {
        S.filters.search = t.value; renderGrid(); return;
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  // 5. SEARCH ROW + FILTER POPOVER
  // ════════════════════════════════════════════════════════════

  function activeFilterCount() {
    var n = 0; var f = S.filters; var d = DEFAULT_FILTERS;
    for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k) && f[k] !== d[k]) n++;
    return n;
  }

  function renderSearchRow() {
    var host = document.getElementById('cmp-searchrow');
    if (!host) return;
    var count = activeFilterCount();
    var badge = count > 0
      ? '<span class="cmp-filter-badge">' + count + '</span>'
      : '';
    var filterActive = count > 0 ? ' cmp-filter-btn--active' : '';
    var popoverHtml = S.filterOpen ? renderFilterPopover() : '';

    host.innerHTML =
      '<div class="cmp-search-row">' +
        '<div class="cmp-search">' +
          '<svg class="cmp-search-icon" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="6.5" cy="6.5" r="4.5"></circle><line x1="10" y1="10" x2="14" y2="14"></line></svg>' +
          '<input type="text" class="cmp-search-input" data-cmp-search ' +
            'placeholder="Search by name\u2026" value="' + escAttr(S.filters.search || '') + '" />' +
          (S.filters.search ? '<button type="button" class="cmp-search-clear" data-cmp-action="clear-search">\u00d7</button>' : '') +
        '</div>' +
        '<div class="cmp-filter-wrap">' +
          '<button type="button" id="cmp-filter-btn" class="cmp-filter-btn' + filterActive + '" ' +
            'data-cmp-action="toggle-filter" aria-label="Filters" title="Filters">' +
            '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
              '<line x1="2" y1="4" x2="14" y2="4"></line>' +
              '<line x1="4" y1="8" x2="12" y2="8"></line>' +
              '<line x1="6" y1="12" x2="10" y2="12"></line>' +
            '</svg>' +
            badge +
          '</button>' +
          popoverHtml +
        '</div>' +
      '</div>';
  }

  function renderFilterPopover() {
    var f = S.filters;
    var anyActive = activeFilterCount() > 0;
    return (
      '<div class="cmp-filter-popover" id="cmp-filter-popover">' +
        '<div class="cmp-filter-popover-head">' +
          '<span class="cmp-filter-popover-title">Filters</span>' +
          (anyActive ? '<button type="button" class="cmp-filter-reset-link" data-cmp-action="reset-filters">Reset all</button>' : '') +
        '</div>' +
        '<div class="cmp-filter-popover-body">' +
          filterSelect('status',       'Status',    selectOpts({ all: 'All', items: STATUS_VALUES }, f.status),        f.status,        DEFAULT_FILTERS.status) +
          filterSelect('customerId',   'Customer',  customerOpts(f.customerId),                                         f.customerId,    DEFAULT_FILTERS.customerId) +
          filterSelect('sourceChannel','Source',    selectOpts({ all: 'All', items: SOURCE_VALUES }, f.sourceChannel),  f.sourceChannel, DEFAULT_FILTERS.sourceChannel) +
          filterSelect('role',         'Role',      selectOpts({ all: 'All', items: roleValues() }, f.role),            f.role,          DEFAULT_FILTERS.role) +
          filterSelect('mediaType',    'Type',      selectOpts({ all: 'All', items: TYPE_VALUES }, f.mediaType),        f.mediaType,     DEFAULT_FILTERS.mediaType) +
          filterSelect('dateRange',    'Date',      dateOpts(f.dateRange),                                              f.dateRange,     DEFAULT_FILTERS.dateRange) +
          filterSelect('pdfProvenance','PDF',       pdfOpts(f.pdfProvenance),                                           f.pdfProvenance, DEFAULT_FILTERS.pdfProvenance) +
          filterSelect('hasCustomer',  'Has Cust',
            '<option value="All"'  + sel(f.hasCustomer, 'All')  + '>All</option>' +
            '<option value="has"'  + sel(f.hasCustomer, 'has')  + '>Has</option>' +
            '<option value="none"' + sel(f.hasCustomer, 'none') + '>None</option>',
            f.hasCustomer, DEFAULT_FILTERS.hasCustomer) +
        '</div>' +
      '</div>'
    );
  }

  // ════════════════════════════════════════════════════════════
  // 6. FILTER HELPERS (shared by popover)
  // ════════════════════════════════════════════════════════════

  function filterSelect(key, label, optionsHtml, current, dflt) {
    var dirty = (current !== dflt);
    var cls = 'cmp-fc' + (dirty ? ' has-pending' : '');
    return (
      '<label class="' + cls + '">' +
        '<span class="cmp-fc-lbl">' + label + '</span>' +
        '<select class="cmp-fc-select" data-cmp-filter="' + key + '">' + optionsHtml + '</select>' +
      '</label>'
    );
  }
  function selectOpts(spec, current) {
    var html = '<option value="All"' + sel(current, 'All') + '>' + (spec.all || 'All') + '</option>';
    for (var i = 0; i < spec.items.length; i++) {
      var v = spec.items[i];
      html += '<option value="' + escAttr(v) + '"' + sel(current, v) + '>' + escHtml(v) + '</option>';
    }
    return html;
  }
  function customerOpts(current) {
    var html = '<option value="All"' + sel(current, 'All') + '>All</option>';
    html += '<option value="__none__"' + sel(current, '__none__') + '>\u2014 No customer</option>';
    for (var i = 0; i < S.customers.length; i++) {
      var c = S.customers[i];
      html += '<option value="' + escAttr(c.id) + '"' + sel(current, c.id) + '>' + escHtml(c.name || c.id) + '</option>';
    }
    return html;
  }
  function dateOpts(current) {
    var html = '<option value="All"' + sel(current, 'All') + '>All</option>';
    for (var i = 0; i < DATE_VALUES.length; i++) {
      var v = DATE_VALUES[i];
      html += '<option value="' + escAttr(v.id) + '"' + sel(current, v.id) + '>' + escHtml(v.label) + '</option>';
    }
    return html;
  }
  function pdfOpts(current) {
    var html = '<option value="All"' + sel(current, 'All') + '>All</option>';
    for (var i = 0; i < PDF_PROV_VALUES.length; i++) {
      var v = PDF_PROV_VALUES[i];
      html += '<option value="' + escAttr(v) + '"' + sel(current, v) + '>' + escHtml(v) + '</option>';
    }
    html += '<option value="NonPDF"' + sel(current, 'NonPDF') + '>Not from PDF</option>';
    return html;
  }
  function roleValues() {
    var seen = Object.create(null); var out = [];
    for (var i = 0; i < S.items.length; i++) {
      var r = S.items[i].role;
      if (r && !seen[r]) { seen[r] = true; out.push(r); }
    }
    out.sort(); return out;
  }
  function filtersAreDefault() {
    var f = S.filters; var d = DEFAULT_FILTERS;
    for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k) && f[k] !== d[k]) return false;
    return true;
  }

  // ════════════════════════════════════════════════════════════
  // 7. GRID + CARDS
  // ════════════════════════════════════════════════════════════

  function renderGrid() {
    var host = document.getElementById('cmp-grid');
    if (!host) return;
    var filtered = applyFilters(S.items);
    setCount(filtered.length);
    if (filtered.length === 0) { host.innerHTML = renderEmptyState(); return; }
    var html = '';
    for (var i = 0; i < filtered.length; i++) html += renderCard(filtered[i]);
    host.innerHTML = html;
  }

  function renderEmptyState() {
    if (S.items.length === 0) {
      return '<div class="cmp-empty"><div class="cmp-empty-icon">\u29BE</div><div class="cmp-empty-title">No components yet</div><div class="cmp-empty-sub">When MEDIA rows are created via Drive, Email, Form, or the Transcriber, they\u2019ll appear here.</div></div>';
    }
    return '<div class="cmp-empty"><div class="cmp-empty-icon">\u26B2</div><div class="cmp-empty-title">No matches</div><div class="cmp-empty-sub">Try removing a filter or clearing the search.</div><button type="button" class="cmp-empty-action" data-cmp-action="reset-filters">Reset filters</button></div>';
  }

  function renderCard(it) {
    var selected = !!S.selection[it.mediaId];
    var editing  = !!(S.inlineEdit && S.inlineEdit.mediaId === it.mediaId);
    var classes = ['cmp-row'];
    if (selected) classes.push('cmp-row--selected');
    if (editing)  classes.push('cmp-row--editing');

    // Thumbnail — fixed 80×56
    var thumb;
    if (it.imageUrl) {
      thumb =
        '<div class="cmp-row-thumb ix-expand-icon-host">' +
          '<img class="cmp-row-thumb-img" src="' + escAttr(it.imageUrl) + '" alt="" loading="lazy" />' +
          '<button type="button" class="ix-expand-icon" data-cmp-card-action="expand-preview" aria-label="Preview">' +
            '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
              '<circle cx="7" cy="7" r="4.5"></circle><line x1="10.5" y1="10.5" x2="14" y2="14"></line>' +
            '</svg>' +
          '</button>' +
        '</div>';
    } else {
      thumb = '<div class="cmp-row-thumb cmp-row-thumb--empty"><span>' + escHtml((it.mediaType || 'TXT').slice(0,3).toUpperCase()) + '</span></div>';
    }

    var statusDot = '<span class="cmp-dot cmp-dot--' + statusModifier(it.status) + '"></span>';
    var metaParts = [it.status || '\u2014'];
    if (it.role) metaParts.push(it.role);
    if (it.sourceChannel) metaParts.push(it.sourceChannel);

    var mainRow =
      '<article class="' + classes.join(' ') + '" data-cmp-card="' + escAttr(it.mediaId) + '">' +
        thumb +
        '<div class="cmp-row-body">' +
          '<div class="cmp-row-name" title="' + escAttr(it.name) + '">' + escHtml(it.name || '(unnamed)') + '</div>' +
          '<div class="cmp-row-meta">' +
            statusDot +
            '<span>' + metaParts.map(escHtml).join(' \u00B7 ') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="cmp-row-actions">' +
          (editing ? '' : renderCardActions(it)) +
        '</div>' +
      '</article>';

    // Attach panel expands below the row as a full-width sibling
    var panelRow = '';
    if (editing) {
      panelRow =
        '<div class="cmp-row-panel" data-cmp-panel="' + escAttr(it.mediaId) + '">' +
          renderInlineEditPanel(it) +
        '</div>';
    }

    return mainRow + panelRow;
  }

  // ── v1.0.8: New primary action row ──
  // Attach ▾ is the primary CTA. Status… and Details… are secondary.
  // Customer assign moved to drawer only.
  function renderCardActions(it) {
    return (
      '<div class="cmp-card-actions">' +
        '<button type="button" class="ix-btn ix-btn--primary cmp-card-action cmp-attach-trigger" ' +
          'data-cmp-card-action="open-attach">' +
          'Attach \u25BE' +
        '</button>' +
        '<button type="button" class="ix-btn ix-btn--secondary cmp-card-action" ' +
          'data-cmp-card-action="quick-edit-status">Status\u2026</button>' +
        '<button type="button" class="ix-btn ix-btn--secondary cmp-card-action" ' +
          'data-cmp-card-action="open-drawer">Details\u2026</button>' +
      '</div>'
    );
  }

  // ── Inline edit panel — handles 'attach' and 'status' fields ──
  function renderInlineEditPanel(it) {
    var e = S.inlineEdit;
    if (!e) return '';

    if (e.field === 'attach') {
      return renderAttachPanel(it, e);
    }

    // Status inline edit (unchanged from v1.0.7)
    var draft = e.draftValue;
    var snap  = e.snapshot;
    var dirty = (draft !== snap);
    var sopts = '';
    for (var j = 0; j < STATUS_VALUES.length; j++) {
      var sv = STATUS_VALUES[j];
      sopts += '<option value="' + escAttr(sv) + '"' + sel(draft, sv) + '>' + escHtml(sv) + '</option>';
    }
    return (
      '<div class="cmp-inline-edit">' +
        '<label class="cmp-inline-field' + (dirty ? ' has-pending' : '') + '">' +
          '<span class="cmp-inline-field-lbl">Status</span>' +
          '<select class="cmp-inline-field-select" data-cmp-edit-field="status">' + sopts + '</select>' +
        '</label>' +
        '<div class="cmp-inline-actions">' +
          '<button type="button" class="ix-btn ix-btn--primary"' + (dirty ? '' : ' disabled') +
            ' data-cmp-card-action="save-edit">Save</button>' +
          '<button type="button" class="ix-btn ix-btn--ghost" data-cmp-card-action="cancel-edit">Cancel</button>' +
        '</div>' +
      '</div>'
    );
  }

  // ── Attach inline panel (v1.0.8) ──
  function renderAttachPanel(it, e) {
    var typeSelected = !!e.assetType;
    var assetSelected = typeSelected && !!e.assetId;
    var saving = !!e.saving;
    var errorMsg = e.error || '';

    // Type selection row
    var typeRow = '<div class="cmp-attach-type-row">';
    var types = ['article', 'ad', 'event', 're'];
    for (var i = 0; i < types.length; i++) {
      var tp = types[i];
      var isActive = (e.assetType === tp);
      typeRow += '<button type="button" class="cmp-attach-type-btn' + (isActive ? ' cmp-attach-type-btn--active' : '') +
        '" data-cmp-attach-type="' + tp + '">' + escHtml(ASSET_TYPE_LABELS[tp]) + '</button>';
    }
    typeRow += '</div>';

    // Asset picker (shown once type is chosen)
    var pickerRow = '';
    if (typeSelected) {
      var assets = readAssets(e.assetType);
      var pickerOpts = '<option value="">— Select ' + escHtml(ASSET_TYPE_LABELS[e.assetType]) + '…</option>';
      for (var j = 0; j < assets.length; j++) {
        var a = assets[j];
        pickerOpts += '<option value="' + escAttr(a.id) + '"' + (e.assetId === a.id ? ' selected' : '') + '>' + escHtml(a.name) + '</option>';
      }
      if (assets.length === 0) {
        pickerOpts = '<option value="" disabled>No ' + escHtml(ASSET_TYPE_LABELS[e.assetType]) + ' records found</option>';
      }
      var pickerDirty = assetSelected;
      pickerRow = (
        '<div class="cmp-attach-picker-wrap' + (pickerDirty ? ' has-pending' : '') + '">' +
          '<label class="cmp-attach-picker-label">Attach to ' + escHtml(ASSET_TYPE_LABELS[e.assetType]) + '</label>' +
          '<select class="cmp-fc-select cmp-attach-picker-select' + (pickerDirty ? ' cmp-picker--active' : '') + '" data-cmp-attach-picker>' +
            pickerOpts +
          '</select>' +
        '</div>'
      );
    }

    // Error bar
    var errorBar = errorMsg
      ? '<div class="cmp-attach-error">\u26A0 ' + escHtml(errorMsg) + '</div>'
      : '';

    // Action row
    var canSave = assetSelected && !saving;
    var actionRow = (
      '<div class="cmp-inline-actions">' +
        '<button type="button" class="ix-btn ix-btn--primary"' + (canSave ? '' : ' disabled') +
          ' data-cmp-card-action="save-edit">' + (saving ? 'Attaching\u2026' : 'Attach') + '</button>' +
        '<button type="button" class="cmp-attach-cancel" data-cmp-card-action="cancel-edit"' +
          (saving ? ' disabled' : '') + '>Cancel</button>' +
      '</div>'
    );

    return (
      '<div class="cmp-attach-panel">' +
        '<div class="cmp-attach-panel-label">Attach to…</div>' +
        typeRow +
        pickerRow +
        errorBar +
        actionRow +
      '</div>'
    );
  }

  // ════════════════════════════════════════════════════════════
  // 8. INLINE EDIT STATE
  // ════════════════════════════════════════════════════════════

  function beginInlineEdit(mediaId, field) {
    var it = findItem(mediaId);
    if (!it) return;
    var val = field === 'customerId' ? it.customerId : it.status;
    S.inlineEdit = { mediaId: mediaId, field: field, draftValue: val, snapshot: val };
    renderGrid();
  }

  function beginAttach(mediaId) {
    S.inlineEdit = {
      mediaId: mediaId,
      field: 'attach',
      assetType: null,
      assetId: null,
      assetName: null,
      saving: false,
      error: null
    };
    renderGrid();
  }

  function selectAttachType(assetType) {
    if (!S.inlineEdit || S.inlineEdit.field !== 'attach') return;
    // Switching type clears prior selection
    S.inlineEdit.assetType  = assetType;
    S.inlineEdit.assetId    = null;
    S.inlineEdit.assetName  = null;
    S.inlineEdit.error      = null;
    renderGrid();
  }

  function cancelInlineEdit() {
    S.inlineEdit = null;
    renderGrid();
  }

  // ── Scenario K Route A (attach) ──
  function saveAttach() {
    var e = S.inlineEdit;
    if (!e || e.field !== 'attach' || !e.assetId || !e.assetType) return;
    if (e.saving) return;

    var c = cfg();
    var mediaId    = e.mediaId;
    var assetType  = e.assetType;
    var assetId    = e.assetId;
    var assetCollId = ASSET_COLLS[assetType];

    if (!assetCollId) {
      e.error = 'Unknown asset type: ' + assetType;
      renderGrid(); return;
    }

    // Build payload per platform-data-reference §14b
    var payload = {
      mode:                 'attach',
      assetType:            assetType,
      assetId:              assetId,
      assetCollId:          assetCollId,
      mediaIds:             [mediaId],
      mediaCollId:          MEDIA_COLL_ID,
      tenantId:             c.taItemId  || '',
      titleSlug:            c.titleSlug || '',
      mediaStatusAttached:  (c.optionIds && c.optionIds.mediaStatus && c.optionIds.mediaStatus.attached) || '',
      forceReplace:         false
    };

    e.saving = true;
    e.error  = null;
    renderGrid();

    var url = (c.makeAttach) || SCENARIO_K_URL; // TA_CONFIG.makeAttach when available
    fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    .then(function (res) {
      return res.text().then(function (txt) {
        // Guard: Make may return plain-text "Accepted" or 410 under load
        if (!res.ok) throw new Error('Scenario K HTTP ' + res.status);
        var j;
        try { j = JSON.parse(txt); } catch (err) { throw new Error('Scenario K non-JSON response'); }
        if (!j || j.ok !== true) throw new Error(j && j.error ? j.error : 'Scenario K returned ok≠true');
        return j;
      });
    })
    .then(function () {
      // Success
      S.inlineEdit = null;
      // Optimistically update item status in memory
      var item = findItem(mediaId);
      if (item) item.status = 'Attached';
      toast('\u2705 Attached to ' + ASSET_TYPE_LABELS[assetType]);
      renderGrid();
      // Refresh Components grid to pick up any DOM changes on next activation
      if (typeof window.dispatchEvent === 'function') {
        try { window.dispatchEvent(new CustomEvent('std:panel:components')); } catch (ex) { /* noop */ }
      }
    })
    .catch(function (err) {
      if (DEBUG) console.error('[InbxComponentsTab] saveAttach error:', err);
      if (S.inlineEdit) {
        S.inlineEdit.saving = false;
        S.inlineEdit.error  = err.message || 'Attach failed — try again';
      }
      renderGrid();
    });
  }

  // ════════════════════════════════════════════════════════════
  // 9. SELECTION + BULK
  // ════════════════════════════════════════════════════════════

  function toggleSelection(mediaId) {
    if (!mediaId) return;
    if (S.inlineEdit) { cancelInlineEdit(); return; }
    S.selection[mediaId] = !S.selection[mediaId];
    if (!S.selection[mediaId]) delete S.selection[mediaId];
    S.selectionMode = selectionCount() > 0;
    renderGrid(); renderBulkBar();
  }

  function bulkSelectAll() {
    var filtered = applyFilters(S.items);
    for (var i = 0; i < filtered.length; i++) S.selection[filtered[i].mediaId] = true;
    S.selectionMode = selectionCount() > 0;
    renderGrid(); renderBulkBar();
  }

  function beginBulkEdit(action) {
    S.bulkEdit = { action: action, draft: '', conflictMode: 'skip' };
    renderBulkBar();
  }

  function renderBulkBar() {
    var host = document.getElementById('cmp-bulkbar');
    if (!host) return;
    var n = selectionCount();
    if (n === 0) { host.hidden = true; host.innerHTML = ''; return; }
    host.hidden = false;
    host.classList.add('cmp-bulkbar--visible');

    if (!S.bulkEdit) {
      host.innerHTML =
        '<div class="cmp-bulkbar-inner">' +
          '<span class="cmp-bulkbar-count">' + n + ' selected</span>' +
          '<div class="cmp-bulk-actions">' +
            '<button type="button" class="ix-btn ix-btn--primary ix-btn--gold" data-cmp-bulk="create-article">Create Article</button>' +
            '<button type="button" class="ix-btn ix-btn--secondary" data-cmp-bulk-action="assign-customer">Assign Customer</button>' +
            '<button type="button" class="ix-btn ix-btn--secondary" data-cmp-bulk-action="clear-customer">Clear Customer</button>' +
            '<button type="button" class="ix-btn ix-btn--ghost" data-cmp-bulk="select-all">All</button>' +
            '<button type="button" class="ix-btn ix-btn--ghost" data-cmp-bulk="clear-selection">Clear</button>' +
          '</div>' +
        '</div>';
      return;
    }

    var be = S.bulkEdit;
    var fieldHtml = '';
    if (be.action === 'assign-customer') {
      var opts = '<option value="">— No customer —</option>';
      for (var i = 0; i < S.customers.length; i++) {
        var c = S.customers[i];
        opts += '<option value="' + escAttr(c.id) + '"' + (be.draft === c.id ? ' selected' : '') + '>' + escHtml(c.name || c.id) + '</option>';
      }
      var dirty = !!be.draft;
      fieldHtml =
        '<div class="cmp-bulk-field' + (dirty ? ' has-pending' : '') + '">' +
          '<span class="cmp-bulk-field-lbl">Assign to Customer</span>' +
          '<select class="cmp-bulk-field-select" data-cmp-bulk-field>' + opts + '</select>' +
        '</div>';
    } else if (be.action === 'clear-customer') {
      fieldHtml = '<span class="cmp-bulk-confirm-text">Remove customer from ' + n + ' item' + (n !== 1 ? 's' : '') + '?</span>';
    }

    host.innerHTML =
      '<div class="cmp-bulkbar-inner">' +
        '<span class="cmp-bulkbar-count">' + n + ' selected</span>' +
        '<div class="cmp-bulk-edit">' +
          fieldHtml +
          '<div class="cmp-bulk-actions">' +
            '<button type="button" class="ix-btn ix-btn--primary ix-btn--gold" data-cmp-bulk-apply>Apply</button>' +
            '<button type="button" class="ix-btn ix-btn--ghost" data-cmp-bulk="cancel-bulk-edit">Cancel</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ════════════════════════════════════════════════════════════
  // 10. FILTERS
  // ════════════════════════════════════════════════════════════

  function applyFilters(items) {
    var f = S.filters;
    var now = Date.now();
    return items.filter(function (it) {
      if (f.search) {
        var q = f.search.toLowerCase();
        if ((it.name || '').toLowerCase().indexOf(q) === -1) return false;
      }
      if (f.status !== 'All' && it.status !== f.status) return false;
      if (f.customerId === '__none__') { if (it.customerId) return false; }
      else if (f.customerId !== 'All' && it.customerId !== f.customerId) return false;
      if (f.sourceChannel !== 'All' && it.sourceChannel !== f.sourceChannel) return false;
      if (f.role !== 'All' && it.role !== f.role) return false;
      if (f.mediaType !== 'All' && it.mediaType !== f.mediaType) return false;
      if (f.pdfProvenance !== 'All') {
        if (f.pdfProvenance === 'NonPDF') { if (it.pdfProvenance) return false; }
        else if (it.pdfProvenance !== f.pdfProvenance) return false;
      }
      if (f.hasCustomer !== 'All') {
        if (f.hasCustomer === 'has'  && !it.customerId) return false;
        if (f.hasCustomer === 'none' &&  it.customerId) return false;
      }
      if (f.dateRange !== 'All' && it.createdMs) {
        var cutoff = { today: 86400000, '7d': 604800000, '30d': 2592000000, '90d': 7776000000 };
        if (now - it.createdMs > (cutoff[f.dateRange] || Infinity)) return false;
      }
      return true;
    });
  }

  // ════════════════════════════════════════════════════════════
  // 11. DRAWER
  // ════════════════════════════════════════════════════════════

  function openDrawer(mediaId) { if (!mediaId) return; S.drawerOpenId = mediaId; renderDrawer(); }
  function closeDrawer() { S.drawerOpenId = null; renderDrawer(); }

  function renderDrawer() {
    var host = document.getElementById('cmp-detail-host');
    if (!host) return;
    if (!S.drawerOpenId) {
      host.innerHTML = ''; host.classList.remove('cmp-detail-host--open'); return;
    }
    var it = findItem(S.drawerOpenId);
    if (!it) { host.innerHTML = ''; return; }

    host.classList.add('cmp-detail-host--open');
    // v1.0.12: Modal popup instead of slide-in drawer.
    // Backdrop covers full viewport; modal is centered, max 520px wide.
    host.innerHTML =
      '<div class="cmp-detail-backdrop" data-cmp-drawer-action="close"></div>' +
      '<div class="cmp-detail-modal" role="dialog" aria-modal="true" aria-label="Component details">' +
        '<header class="cmp-detail-head">' +
          '<div class="cmp-detail-title">' + escHtml(it.name || '(unnamed)') + '</div>' +
          '<button type="button" class="cmp-detail-close-btn" ' +
            'data-cmp-drawer-action="close" aria-label="Close">\u00d7</button>' +
        '</header>' +
        '<div class="cmp-detail-body">' +
          (it.imageUrl ? '<img class="cmp-detail-thumb" src="' + escAttr(it.imageUrl) + '" alt="" />' : '') +
          '<dl class="cmp-detail-dl">' +
            kv('Status',          it.status) +
            kv('Component Role',  it.role) +
            kv('Media Type',      it.mediaType) +
            kv('Customer',        customerNameById(it.customerId) || '\u2014') +
            kv('Source',          it.sourceChannel) +
            kv('PDF Provenance',  it.pdfProvenance) +
            kv('Article ID',      it.articleId || '\u2014') +
            kv('Original file',   it.originalFilename) +
            kv('MIME',            it.mimeType) +
            kv('Size',            it.size) +
            kv('Created',         it.createdStr) +
            kv('Media ID',        it.mediaId) +
          '</dl>' +
          '<div class="cmp-detail-customer-edit">' +
            '<div class="cmp-detail-section-label">Customer Assignment</div>' +
            renderDrawerCustomerEdit(it) +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderDrawerCustomerEdit(it) {
    var currentName = customerNameById(it.customerId);
    var opts = '<option value="">— No customer —</option>';
    for (var i = 0; i < S.customers.length; i++) {
      var c = S.customers[i];
      opts += '<option value="' + escAttr(c.id) + '"' + (it.customerId === c.id ? ' selected' : '') + '>' + escHtml(c.name || c.id) + '</option>';
    }
    return (
      '<label class="cmp-detail-field-label">Customer</label>' +
      '<select class="cmp-fc-select" style="width:100%;margin-bottom:8px" disabled title="Customer save wires in Sub-session C">' + opts + '</select>' +
      '<div style="font-size:11px;color:#8a8a7a">Save wires in Sub-session C.</div>'
    );
  }

  function kv(label, val) {
    return '<dt class="cmp-detail-key">' + escHtml(label) + '</dt><dd class="cmp-detail-val">' + escHtml(val || '\u2014') + '</dd>';
  }

  // ════════════════════════════════════════════════════════════
  // 12. UTILITIES
  // ════════════════════════════════════════════════════════════

  function sel(current, val) { return current === val ? ' selected' : ''; }
  function statusModifier(s) {
    if (s === 'Available') return 'available';
    if (s === 'Attached')  return 'attached';
    if (s === 'Archived')  return 'archived';
    return 'unknown';
  }
  function setCount(n) { var c = document.getElementById('cmp-count'); if (c) c.textContent = String(n); }

  function escHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function escAttr(s) { return escHtml(s); }
  function truncate(s, n) {
    if (!s) return ''; s = String(s).replace(/\s+/g,' ').trim();
    if (s.length <= n) return s;
    return s.slice(0,n).replace(/\s+\S*$/,'') + '\u2026';
  }

  function toast(msg) {
    var node = document.createElement('div');
    node.className = 'cmp-toast';
    node.textContent = msg;
    document.body.appendChild(node);
    setTimeout(function () { node.classList.add('cmp-toast--visible'); }, 10);
    setTimeout(function () {
      node.classList.remove('cmp-toast--visible');
      setTimeout(function () { node.parentNode && node.parentNode.removeChild(node); }, 300);
    }, 2500);
  }

  // ════════════════════════════════════════════════════════════
  // 13. PUBLIC API + BOOTSTRAP
  // ════════════════════════════════════════════════════════════

  function mount(rootEl) {
    if (!rootEl) return;
    S.rootEl = rootEl;
    if (!S.mounted) { renderShell(rootEl); S.mounted = true; }
    refresh();
  }

  function refresh() {
    if (!S.rootEl || !S.mounted) return;
    S.items     = readMediaItems();
    S.customers = readCustomers();
    S.assetCache = {};
    renderSearchRow();
    renderBulkBar();
    renderGrid();
    renderDrawer();
  }

  function getState() {
    return {
      version:       FILE_VERSION,
      itemCount:     S.items.length,
      customerCount: S.customers.length,
      filters:       cloneObj(S.filters),
      selection:     selectionIds(),
      drawerOpenId:  S.drawerOpenId,
      inlineEdit:    S.inlineEdit ? {
        mediaId:   S.inlineEdit.mediaId,
        field:     S.inlineEdit.field,
        assetType: S.inlineEdit.assetType || null,
        assetId:   S.inlineEdit.assetId || null
      } : null,
      bulkEdit: S.bulkEdit ? cloneObj(S.bulkEdit) : null
    };
  }

  window.addEventListener('std:panel:components', function () {
    var host = document.querySelector('[data-std-panel-body="components"] #cmp-root, [data-std-panel-body="components"] .cmp-root, [data-std-panel-body="components"]');
    if (!host) { if (DEBUG) console.warn('[InbxComponentsTab] no panel container found'); return; }
    mount(host);
  });

  window.InbxComponentsTab = {
    mount:    mount,
    refresh:  refresh,
    getState: getState,
    version:  FILE_VERSION
  };

  if (DEBUG) console.log('[InbxComponentsTab] v' + FILE_VERSION + ' ready');
})();
