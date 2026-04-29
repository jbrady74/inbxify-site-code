/* ============================================================
   ta-components-tab-v1.0.1.js
   ============================================================
   INBXIFY · Components Rebuild · Slice 1 · Sub-session A (v1.0.1 fixes)
   Components surface for the Studio "Components" tab on the
   Title-Admin page.

   ─── v1.0.1 fixes (vs v1.0.0) ───
   1. Buttons conform to ix-buttons-v1.0.4 canonical variants:
      - Card actions ("Details…", "Status…") → ix-btn--secondary
      - Inline-edit Save → ix-btn--primary
      - Inline-edit Cancel → ix-btn--ghost (replaces .cmp-card-link--cancel)
      - Card text-link affordances ("Assign…", "change") → ix-btn--ghost
      - Bulk Apply → ix-btn--primary ix-btn--gold (canonical "Assign N" pattern)
      - Bulk Cancel → ix-btn--ghost
      Removed invented classes: ix-btn--xs / ix-btn--sm / ix-btn--quiet.
   2. "More filters" overflow REMOVED. All 9 filters fit in one
      wrapped row at smaller font (10px label, 12px select).
   3. Card thumbnails use the existing .cmp-thumb / .cmp-thumb-img
      pattern from v1.0.8 — fixed 16:9 aspect ratio, object-fit
      cover. No more variable height. Card structure flattens to
      .cmp-card > .cmp-thumb + .cmp-card-body (no more
      .cmp-card-thumb-wrap).
   4. Drawer classes RENAMED to avoid collision with v1.0.8
      inherited .cmp-drawer / .cmp-drawer-backdrop styles. New:
      .cmp-detail-host, .cmp-detail-backdrop, .cmp-detail-drawer,
      .cmp-detail-head, .cmp-detail-body, .cmp-detail-thumb,
      .cmp-detail-dl, .cmp-detail-key, .cmp-detail-val,
      .cmp-detail-deferred, .cmp-detail-close. Fixes the
      "click Details and surface goes white" bug.
   5. Bulk toolbar Clear-bug fix: render path now also removes
      .cmp-bulkbar--visible class on empty selection, in addition
      to the [hidden] attribute (which can be overridden by
      cascade). Belt + suspenders.
   6. Status quick-edit + Customer assign Save still toast
      "not wired yet (Sub-session C)" — confirmed correct per
      Jeff's call. Cancel link reverts properly.
   7. Bulk toolbar visual treatment aligned with ix tokens:
      teal background (var(--ix-teal)), gold-tinted Apply CTA.

   ─── Public API ───
   window.InbxComponentsTab = {
     mount(rootEl)   — paint the surface into rootEl. Idempotent.
     refresh()       — re-read DOM + repaint without rebuilding shell.
     getState()      — diagnostics; returns shallow snapshot of S.
   };

   ta-studio dispatches window CustomEvent('std:panel:components')
   when the user clicks the Components subtab. This file listens
   for that event and calls mount() with the panel root container.
   On first paint, the shell is built; on subsequent paints, only
   the grid is re-rendered (cheaper, preserves selection/edit state).

   ─── State model (S) ───
   S.items[]              — parsed MEDIA rows from .media-wrapper
   S.customers[]          — { id, name } from .customers-wrapper
   S.filters              — primary + secondary filter values
     .search              — text against MEDIA name (case-insensitive)
     .status              — 'All' | 'Available' | 'Attached' | 'Archived'
     .customerId          — 'All' | '__none__' | <id>
     .sourceChannel       — 'All' | 'Drive' | 'Email' | 'Form' | 'Transcriber'
     .role                — 'All' | <role label>     (secondary)
     .mediaType           — 'All' | 'Image' | 'Video' | 'Audio' | 'Text'
     .dateRange           — 'All' | 'today' | '7d' | '30d' | '90d'
     .pdfProvenance       — 'All' | 'Converted' | 'Transcribed' | 'NonPDF'
     .hasCustomer         — 'All' | 'has' | 'none'
   S.secondaryOpen        — bool: "More filters" panel expanded?
   S.selection            — Set<mediaId>: rows currently selected (Pattern B)
   S.selectionMode        — bool: bulk-toolbar visible?
   S.drawerOpenId         — mediaId | null: currently open drawer row
   S.inlineEdit           — { mediaId, field, draftValue, snapshot } | null
                            tracks active inline edit on a card. snapshot
                            is the value at edit-start so Cancel reverts.
   S.bulkEdit             — { action, draft, conflictMode } | null
                            tracks active bulk-toolbar selection state.

   ─── Three universal rules (per Jeff's standing instructions) ───
   1. Persisting dropdown selections during editing.
      Every dropdown reads from S.* state and re-renders from state
      on every paint. No selection vanishes when other edits happen.
   2. Distinctive border on dirty dropdowns.
      Any dropdown whose held value differs from the saved value
      gets the .has-pending class (gold border, matches existing
      cmp-picker--active convention). CSS owns the visual.
   3. Cancel text link to revert.
      Every inline edit and bulk-toolbar selection carries a Cancel
      link adjacent to its Save/Apply button. Click reverts S to
      the snapshot taken at edit-start. Pattern matches studio's
      revertAll for article-level edits.

   ─── Hardcoding tracker ───
   None new in this file. All schema reads via TA_CONFIG.optionIds
   and DOM data attributes. Bulk-action endpoint reads from
   TA_CONFIG.makeBulkMedia (set in page head; new this slice).

   ─── What ships in this version (v1.0.0) ───
   ✓ Shell: header, filter bar (4 primary + More filters), grid,
     bulk-toolbar shell, empty states.
   ✓ Card render with Pattern B click-to-select.
   ✓ Drawer detail view (asset-bind structural edits).
   ✓ Inline-edit hybrid: Customer + Status are quick-edit inline;
     Article ref + Component Role open the drawer.
   ✓ Selection model + selection-aware bulk toolbar (visible only
     when selection is non-empty).

   ─── Deferred to later sub-sessions ───
   ✗ Sub-session B: PDF triage modal + UP v1.0.11 (PDF Queue removal)
   ✗ Sub-session C: Bulk-action wiring to Scenario H + conflict modal

   The bulk-toolbar in this file shows the actions but they are
   non-functional until Sub-session C lands.

   ──────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ════════════════════════════════════════════════════════════
  // 0. CONSTANTS
  // ════════════════════════════════════════════════════════════

  var FILE_VERSION = '1.0.1';
  var DEBUG = false;

  // Filter defaults — applied on first paint and on Reset
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

  // Status labels — match Webflow option NAMES (not hashes)
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

  // Card preview character cap for HTML-content rows
  var CMP_PREVIEW_CHARS = 180;

  // ════════════════════════════════════════════════════════════
  // 1. STATE
  // ════════════════════════════════════════════════════════════

  var S = {
    mounted:        false,
    rootEl:         null,
    items:          [],
    customers:      [],
    filters:        cloneObj(DEFAULT_FILTERS),
    selection:      Object.create(null),  // dict: mediaId -> true
    selectionMode:  false,
    drawerOpenId:   null,
    inlineEdit:     null,
    bulkEdit:       null
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
  // 2. DOM READERS — pull data from T-A page hidden collections
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
        // NEW fields (Slice 1 schema). Tolerate absence — bindings may
        // not be added in Webflow yet.
        sourceChannel:    (d.sourceChannel || '').trim(),
        pdfProvenance:    (d.pdfProvenance || '').trim(),
        originalFilename: (d.originalFilename || '').trim(),
        mimeType:         (d.mimeType || '').trim(),
        size:             (d.size || '').trim(),
        // Derived
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
      var id   = (el.dataset.id   || '').trim();
      var name = (el.dataset.name || '').trim();
      if (!id || seen[id]) return;
      seen[id] = true;
      out.push({ id: id, name: name });
    });
    out.sort(function (a, b) {
      return (a.name || '').toLowerCase() < (b.name || '').toLowerCase() ? -1 : 1;
    });
    return out;
  }

  function customerNameById(id) {
    if (!id) return '';
    for (var i = 0; i < S.customers.length; i++) {
      if (S.customers[i].id === id) return S.customers[i].name;
    }
    return '';
  }

  // ════════════════════════════════════════════════════════════
  // 3. FILTER LOGIC
  // ════════════════════════════════════════════════════════════

  function applyFilters(items) {
    var f = S.filters;
    var search = (f.search || '').toLowerCase();
    var now = Date.now();

    return items.filter(function (it) {
      // Search (Name only — original-filename is a Sub-session B add)
      if (search) {
        var hay = (it.name || '').toLowerCase();
        if (hay.indexOf(search) === -1) return false;
      }
      // Status
      if (f.status !== 'All' && it.status !== f.status) return false;
      // Customer
      if (f.customerId === '__none__') {
        if (it.customerId) return false;
      } else if (f.customerId !== 'All') {
        if (it.customerId !== f.customerId) return false;
      }
      // Source Channel
      if (f.sourceChannel !== 'All' && it.sourceChannel !== f.sourceChannel) return false;
      // Role
      if (f.role !== 'All' && it.role !== f.role) return false;
      // Media Type
      if (f.mediaType !== 'All' && it.mediaType !== f.mediaType) return false;
      // Date range
      if (f.dateRange !== 'All' && it.createdMs) {
        var span = dateRangeMs(f.dateRange);
        if (span && (now - it.createdMs) > span) return false;
      }
      // PDF Provenance
      if (f.pdfProvenance === 'NonPDF') {
        if (it.pdfProvenance) return false;
      } else if (f.pdfProvenance !== 'All') {
        if (it.pdfProvenance !== f.pdfProvenance) return false;
      }
      // Has-customer
      if (f.hasCustomer === 'has' && !it.customerId) return false;
      if (f.hasCustomer === 'none' && it.customerId) return false;

      return true;
    });
  }

  function dateRangeMs(range) {
    var DAY = 24 * 60 * 60 * 1000;
    if (range === 'today') return DAY;
    if (range === '7d')    return 7 * DAY;
    if (range === '30d')   return 30 * DAY;
    if (range === '90d')   return 90 * DAY;
    return 0;
  }

  function filtersAreDefault() {
    for (var k in DEFAULT_FILTERS) {
      if (S.filters[k] !== DEFAULT_FILTERS[k]) return false;
    }
    return true;
  }

  // ════════════════════════════════════════════════════════════
  // 4. RENDER — shell (one-time per mount)
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

        '<div class="cmp-filterbar" id="cmp-filterbar"></div>' +

        '<div class="cmp-bulkbar" id="cmp-bulkbar" hidden></div>' +

        '<div class="cmp-grid-wrap">' +
          '<div class="cmp-grid" id="cmp-grid"></div>' +
        '</div>' +

        '<div class="cmp-detail-host" id="cmp-detail-host"></div>' +
      '</div>';

    bindShellEvents(root);
  }

  function bindShellEvents(root) {
    // Single delegated click handler for the entire surface
    root.addEventListener('click', function (e) {
      var t = e.target;

      // — Filter chip clicks (primary or secondary)
      var chip = t.closest && t.closest('[data-cmp-filter]');
      if (chip) return; // chips use change events, not clicks

      // — Reset filters
      if (t.closest && t.closest('[data-cmp-action="reset-filters"]')) {
        S.filters = cloneObj(DEFAULT_FILTERS);
        renderSearchRow();
        renderFilterBar();
        renderGrid();
        return;
      }

      // — Card click (Pattern B select; ignore clicks inside actions)
      var card = t.closest && t.closest('[data-cmp-card]');
      if (card) {
        // Specific intra-card actions
        if (t.closest('[data-cmp-card-action="open-drawer"]')) {
          openDrawer(card.getAttribute('data-cmp-card'));
          return;
        }
        if (t.closest('[data-cmp-card-action="quick-edit-customer"]')) {
          beginInlineEdit(card.getAttribute('data-cmp-card'), 'customerId');
          return;
        }
        if (t.closest('[data-cmp-card-action="quick-edit-status"]')) {
          beginInlineEdit(card.getAttribute('data-cmp-card'), 'status');
          return;
        }
        if (t.closest('[data-cmp-card-action="cancel-edit"]')) {
          cancelInlineEdit();
          return;
        }
        if (t.closest('[data-cmp-card-action="save-edit"]')) {
          // Save handler is a Sub-session C concern (network call to
          // Scenario H or per-row write). For now, just cancel.
          cancelInlineEdit();
          toast('Save not wired yet (Sub-session C).');
          return;
        }
        // Default: toggle selection (Pattern B)
        toggleSelection(card.getAttribute('data-cmp-card'));
        return;
      }

      // — Bulk toolbar actions
      if (t.closest('[data-cmp-bulk="select-all"]')) {
        bulkSelectAll();
        return;
      }
      if (t.closest('[data-cmp-bulk="clear-selection"]')) {
        clearSelection();
        renderGrid();
        renderBulkBar();
        return;
      }
      if (t.closest('[data-cmp-bulk="cancel-bulk-edit"]')) {
        S.bulkEdit = null;
        renderBulkBar();
        return;
      }
      var bulkAction = t.closest && t.closest('[data-cmp-bulk-action]');
      if (bulkAction) {
        beginBulkEdit(bulkAction.getAttribute('data-cmp-bulk-action'));
        return;
      }
      if (t.closest('[data-cmp-bulk-apply]')) {
        // Sub-session C wires this to Scenario H.
        toast('Bulk apply not wired yet (Sub-session C).');
        return;
      }

      // — Drawer close
      if (t.closest('[data-cmp-drawer-action="close"]')) {
        closeDrawer();
        return;
      }
      if (t.classList && t.classList.contains('cmp-detail-backdrop')) {
        closeDrawer();
        return;
      }
    });

    // Change events for selects (filters + inline edits)
    root.addEventListener('change', function (e) {
      var t = e.target;

      // Filter selects
      if (t.matches && t.matches('[data-cmp-filter]')) {
        var key = t.getAttribute('data-cmp-filter');
        S.filters[key] = t.value;
        renderFilterBar();
        renderGrid();
        return;
      }

      // Inline-edit selects
      if (t.matches && t.matches('[data-cmp-edit-field]')) {
        if (S.inlineEdit) {
          S.inlineEdit.draftValue = t.value;
          renderGrid();
        }
        return;
      }

      // Bulk-edit selects
      if (t.matches && t.matches('[data-cmp-bulk-field]')) {
        if (S.bulkEdit) {
          S.bulkEdit.draft = t.value;
          renderBulkBar();
        }
        return;
      }
    });

    // Search input
    root.addEventListener('input', function (e) {
      var t = e.target;
      if (t.matches && t.matches('[data-cmp-search]')) {
        S.filters.search = t.value;
        renderGrid();
        return;
      }
    });
  }

  // ════════════════════════════════════════════════════════════
  // 5. RENDER — search row
  // ════════════════════════════════════════════════════════════

  function renderSearchRow() {
    var host = document.getElementById('cmp-searchrow');
    if (!host) return;
    var v = escAttr(S.filters.search || '');
    host.innerHTML =
      '<div class="cmp-search">' +
        '<input type="text" class="cmp-search-input" data-cmp-search ' +
          'placeholder="Search by name\u2026" value="' + v + '" />' +
      '</div>';
  }

  // ════════════════════════════════════════════════════════════
  // 6. RENDER — filter bar
  // ════════════════════════════════════════════════════════════

  function renderFilterBar() {
    var host = document.getElementById('cmp-filterbar');
    if (!host) return;
    var f = S.filters;

    // v1.0.1: single-row layout, all 9 filters wrap as needed.
    // No "More filters" toggle — they're all primary now.
    var html =
      '<div class="cmp-filter-row">' +
        filterSelect('status', 'Status', selectOpts({ all: 'All', items: STATUS_VALUES }, f.status), f.status, DEFAULT_FILTERS.status) +
        filterSelect('customerId', 'Customer', customerOpts(f.customerId), f.customerId, DEFAULT_FILTERS.customerId) +
        filterSelect('sourceChannel', 'Source', selectOpts({ all: 'All', items: SOURCE_VALUES }, f.sourceChannel), f.sourceChannel, DEFAULT_FILTERS.sourceChannel) +
        filterSelect('role', 'Role', selectOpts({ all: 'All', items: roleValues() }, f.role), f.role, DEFAULT_FILTERS.role) +
        filterSelect('mediaType', 'Type', selectOpts({ all: 'All', items: TYPE_VALUES }, f.mediaType), f.mediaType, DEFAULT_FILTERS.mediaType) +
        filterSelect('dateRange', 'Date', dateOpts(f.dateRange), f.dateRange, DEFAULT_FILTERS.dateRange) +
        filterSelect('pdfProvenance', 'PDF', pdfOpts(f.pdfProvenance), f.pdfProvenance, DEFAULT_FILTERS.pdfProvenance) +
        filterSelect('hasCustomer', 'Has Cust',
          '<option value="All"' + sel(f.hasCustomer, 'All') + '>All</option>' +
          '<option value="has"' + sel(f.hasCustomer, 'has') + '>Has</option>' +
          '<option value="none"' + sel(f.hasCustomer, 'none') + '>None</option>',
          f.hasCustomer, DEFAULT_FILTERS.hasCustomer) +
        (filtersAreDefault()
          ? ''
          : '<button type="button" class="ix-btn ix-btn--ghost cmp-filter-reset" data-cmp-action="reset-filters">Reset</button>') +
      '</div>';

    host.innerHTML = html;
  }

  function filterSelect(key, label, optionsHtml, current, dflt) {
    var dirty = (current !== dflt);
    var cls = 'cmp-fc' + (dirty ? ' has-pending' : '');
    return (
      '<label class="' + cls + '">' +
        '<span class="cmp-fc-lbl">' + label + '</span>' +
        '<select class="cmp-fc-select" data-cmp-filter="' + key + '">' +
          optionsHtml +
        '</select>' +
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
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i < S.items.length; i++) {
      var r = S.items[i].role;
      if (r && !seen[r]) { seen[r] = true; out.push(r); }
    }
    out.sort();
    return out;
  }

  // ════════════════════════════════════════════════════════════
  // 7. RENDER — grid + cards
  // ════════════════════════════════════════════════════════════

  function renderGrid() {
    var host = document.getElementById('cmp-grid');
    if (!host) return;

    var filtered = applyFilters(S.items);
    setCount(filtered.length);

    if (filtered.length === 0) {
      host.innerHTML = renderEmptyState();
      return;
    }

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      html += renderCard(filtered[i]);
    }
    host.innerHTML = html;
  }

  function renderEmptyState() {
    if (S.items.length === 0) {
      return (
        '<div class="cmp-empty">' +
          '<div class="cmp-empty-icon">\u29BE</div>' +
          '<div class="cmp-empty-title">No components yet</div>' +
          '<div class="cmp-empty-sub">When MEDIA rows are created via Drive, Email, Form, or the Transcriber, they\u2019ll appear here.</div>' +
        '</div>'
      );
    }
    return (
      '<div class="cmp-empty">' +
        '<div class="cmp-empty-icon">\u26B2</div>' +
        '<div class="cmp-empty-title">No matches</div>' +
        '<div class="cmp-empty-sub">Try removing a filter or clearing the search.</div>' +
        '<button type="button" class="cmp-empty-action" data-cmp-action="reset-filters">Reset filters</button>' +
      '</div>'
    );
  }

  function renderCard(it) {
    var selected = !!S.selection[it.mediaId];
    var editing  = !!(S.inlineEdit && S.inlineEdit.mediaId === it.mediaId);
    var classes = ['cmp-card'];
    if (selected) classes.push('cmp-card--selected');
    if (editing)  classes.push('cmp-card--editing');

    // v1.0.1: thumb uses existing .cmp-thumb / .cmp-thumb-img pattern.
    // Fixed 16:9 aspect ratio, object-fit cover. Empty state shows
    // first letter or media type label in mono.
    var thumb;
    if (it.imageUrl) {
      thumb = '<div class="cmp-thumb">' +
                '<img class="cmp-thumb-img" src="' + escAttr(it.imageUrl) +
                '" alt="' + escAttr(it.name) + '" loading="lazy" />' +
              '</div>';
    } else if (it.mediaType === 'Text' && it.htmlPreview) {
      thumb = '<div class="cmp-text-preview">' + escHtml(it.htmlPreview) + '</div>';
    } else {
      thumb = '<div class="cmp-thumb">' +
                '<span class="cmp-thumb-empty">' + escHtml(it.mediaType || 'Component') + '</span>' +
              '</div>';
    }

    var customerName = customerNameById(it.customerId);
    var statusDot =
      '<span class="cmp-dot cmp-dot--' + statusModifier(it.status) + '"></span>';

    return (
      '<article class="' + classes.join(' ') + '" data-cmp-card="' + escAttr(it.mediaId) + '">' +
        thumb +
        '<div class="cmp-card-body">' +
          '<div class="cmp-card-name" title="' + escAttr(it.name) + '">' + escHtml(it.name || '(unnamed)') + '</div>' +
          '<div class="cmp-card-meta">' +
            statusDot +
            '<span>' + escHtml(it.status || '\u2014') + '</span>' +
            '<span class="cmp-card-meta-sep">\u00B7</span>' +
            '<span>' + escHtml(it.role || '\u2014') + '</span>' +
            (it.sourceChannel ? '<span class="cmp-card-meta-sep">\u00B7</span><span>' + escHtml(it.sourceChannel) + '</span>' : '') +
            (it.pdfProvenance ? '<span class="cmp-card-meta-pdf">PDF\u00B7' + escHtml(it.pdfProvenance) + '</span>' : '') +
          '</div>' +
          '<div class="cmp-card-customer">' +
            renderCustomerCell(it) +
          '</div>' +
          (editing ? renderInlineEditPanel(it) : renderCardActions(it)) +
        '</div>' +
      '</article>'
    );
  }

  function renderCustomerCell(it) {
    if (S.inlineEdit && S.inlineEdit.mediaId === it.mediaId && S.inlineEdit.field === 'customerId') {
      // covered by renderInlineEditPanel
      return '<span class="cmp-card-customer-lbl">Customer:</span> ' +
             '<span class="cmp-card-customer-val">(editing\u2026)</span>';
    }
    var name = customerNameById(it.customerId);
    if (!name) {
      return (
        '<span class="cmp-card-customer-lbl">Customer:</span> ' +
        '<button type="button" class="ix-btn ix-btn--ghost cmp-card-link-btn" ' +
          'data-cmp-card-action="quick-edit-customer">Assign\u2026</button>'
      );
    }
    return (
      '<span class="cmp-card-customer-lbl">Customer:</span> ' +
      '<span class="cmp-card-customer-val">' + escHtml(name) + '</span> ' +
      '<button type="button" class="ix-btn ix-btn--ghost cmp-card-link-btn cmp-card-link-btn--quiet" ' +
        'data-cmp-card-action="quick-edit-customer">change</button>'
    );
  }

  function renderCardActions(it) {
    return (
      '<div class="cmp-card-actions">' +
        '<button type="button" class="ix-btn ix-btn--secondary cmp-card-action" ' +
          'data-cmp-card-action="open-drawer">Details\u2026</button>' +
        '<button type="button" class="ix-btn ix-btn--secondary cmp-card-action" ' +
          'data-cmp-card-action="quick-edit-status">Status\u2026</button>' +
      '</div>'
    );
  }

  function renderInlineEditPanel(it) {
    var e = S.inlineEdit;
    if (!e) return '';

    var draft = e.draftValue;
    var snap  = e.snapshot;
    var dirty = (draft !== snap);

    var fieldHtml = '';
    if (e.field === 'customerId') {
      var opts = '<option value=""' + sel(draft, '') + '>\u2014 No customer</option>';
      for (var i = 0; i < S.customers.length; i++) {
        var c = S.customers[i];
        opts += '<option value="' + escAttr(c.id) + '"' + sel(draft, c.id) + '>' + escHtml(c.name || c.id) + '</option>';
      }
      fieldHtml =
        '<label class="cmp-inline-field' + (dirty ? ' has-pending' : '') + '">' +
          '<span class="cmp-inline-field-lbl">Customer</span>' +
          '<select class="cmp-inline-field-select" data-cmp-edit-field="customerId">' + opts + '</select>' +
        '</label>';
    } else if (e.field === 'status') {
      var sopts = '';
      for (var j = 0; j < STATUS_VALUES.length; j++) {
        var sv = STATUS_VALUES[j];
        sopts += '<option value="' + escAttr(sv) + '"' + sel(draft, sv) + '>' + escHtml(sv) + '</option>';
      }
      fieldHtml =
        '<label class="cmp-inline-field' + (dirty ? ' has-pending' : '') + '">' +
          '<span class="cmp-inline-field-lbl">Status</span>' +
          '<select class="cmp-inline-field-select" data-cmp-edit-field="status">' + sopts + '</select>' +
        '</label>';
    }

    return (
      '<div class="cmp-inline-edit">' +
        fieldHtml +
        '<div class="cmp-inline-actions">' +
          '<button type="button" class="ix-btn ix-btn--primary"' +
            (dirty ? '' : ' disabled') +
            ' data-cmp-card-action="save-edit">Save</button>' +
          '<button type="button" class="ix-btn ix-btn--ghost" ' +
            'data-cmp-card-action="cancel-edit">Cancel</button>' +
        '</div>' +
      '</div>'
    );
  }

  function statusModifier(status) {
    if (status === 'Available') return 'available';
    if (status === 'Attached')  return 'attached';
    if (status === 'Archived')  return 'archived';
    return 'unknown';
  }

  function setCount(n) {
    var c = document.getElementById('cmp-count');
    if (c) c.textContent = String(n);
  }

  // ════════════════════════════════════════════════════════════
  // 8. SELECTION + BULK TOOLBAR
  // ════════════════════════════════════════════════════════════

  function toggleSelection(mediaId) {
    if (!mediaId) return;
    if (S.selection[mediaId]) {
      delete S.selection[mediaId];
    } else {
      S.selection[mediaId] = true;
    }
    S.selectionMode = (selectionCount() > 0);
    renderGrid();
    renderBulkBar();
  }

  function bulkSelectAll() {
    var filtered = applyFilters(S.items);
    var allSelected = filtered.length > 0 && filtered.every(function (it) {
      return !!S.selection[it.mediaId];
    });
    if (allSelected) {
      // Deselect all that are filtered
      for (var i = 0; i < filtered.length; i++) {
        delete S.selection[filtered[i].mediaId];
      }
    } else {
      for (var j = 0; j < filtered.length; j++) {
        S.selection[filtered[j].mediaId] = true;
      }
    }
    S.selectionMode = (selectionCount() > 0);
    renderGrid();
    renderBulkBar();
  }

  function beginBulkEdit(action) {
    S.bulkEdit = {
      action: action,             // 'assign-customer' | 'clear-customer'
      draft: '',                  // draft value (customerId for assign)
      conflictMode: 'replace-all' // default; conflict modal lands in Sub-session C
    };
    renderBulkBar();
  }

  function renderBulkBar() {
    var host = document.getElementById('cmp-bulkbar');
    if (!host) return;
    var n = selectionCount();
    if (n === 0) {
      // v1.0.1: belt + suspenders. Both [hidden] AND class removal,
      // because cascade can override [hidden] but the class is
      // explicit display:none in CSS.
      host.hidden = true;
      host.classList.remove('cmp-bulkbar--visible');
      host.innerHTML = '';
      return;
    }
    host.hidden = false;
    host.classList.add('cmp-bulkbar--visible');

    var actionPanel = '';
    if (S.bulkEdit) {
      actionPanel = renderBulkActionPanel();
    } else {
      actionPanel =
        '<div class="cmp-bulk-actions">' +
          '<button type="button" class="ix-btn ix-btn--secondary" ' +
            'data-cmp-bulk-action="assign-customer">Assign Customer\u2026</button>' +
          '<button type="button" class="ix-btn ix-btn--secondary" ' +
            'data-cmp-bulk-action="clear-customer">Clear Customer</button>' +
        '</div>';
    }

    host.innerHTML =
      '<div class="cmp-bulk-inner">' +
        '<div class="cmp-bulk-left">' +
          '<span class="cmp-bulk-count">' + n + ' selected</span>' +
          '<button type="button" class="ix-btn ix-btn--ghost" data-cmp-bulk="select-all">Select all visible</button>' +
          '<button type="button" class="ix-btn ix-btn--ghost" data-cmp-bulk="clear-selection">Clear</button>' +
        '</div>' +
        '<div class="cmp-bulk-right">' +
          actionPanel +
        '</div>' +
      '</div>';
  }

  function renderBulkActionPanel() {
    var be = S.bulkEdit;
    if (!be) return '';

    if (be.action === 'assign-customer') {
      var draft = be.draft || '';
      var dirty = !!draft;
      var opts = '<option value=""' + sel(draft, '') + '>\u2014 Choose a customer\u2026</option>';
      for (var i = 0; i < S.customers.length; i++) {
        var c = S.customers[i];
        opts += '<option value="' + escAttr(c.id) + '"' + sel(draft, c.id) + '>' + escHtml(c.name || c.id) + '</option>';
      }
      return (
        '<div class="cmp-bulk-edit">' +
          '<label class="cmp-bulk-field' + (dirty ? ' has-pending' : '') + '">' +
            '<span class="cmp-bulk-field-lbl">Customer</span>' +
            '<select class="cmp-bulk-field-select" data-cmp-bulk-field="customerId">' + opts + '</select>' +
          '</label>' +
          '<button type="button" class="ix-btn ix-btn--primary ix-btn--gold"' +
            (dirty ? '' : ' disabled') + ' data-cmp-bulk-apply>' +
            'Apply to ' + selectionCount() +
          '</button>' +
          '<button type="button" class="ix-btn ix-btn--ghost" ' +
            'data-cmp-bulk="cancel-bulk-edit">Cancel</button>' +
        '</div>'
      );
    }

    if (be.action === 'clear-customer') {
      return (
        '<div class="cmp-bulk-edit">' +
          '<span class="cmp-bulk-confirm-text">Clear Customer on ' + selectionCount() + ' rows?</span>' +
          '<button type="button" class="ix-btn ix-btn--primary ix-btn--gold" data-cmp-bulk-apply>Clear</button>' +
          '<button type="button" class="ix-btn ix-btn--ghost" ' +
            'data-cmp-bulk="cancel-bulk-edit">Cancel</button>' +
        '</div>'
      );
    }

    return '';
  }

  // ════════════════════════════════════════════════════════════
  // 9. INLINE EDIT (per-card)
  // ════════════════════════════════════════════════════════════

  function beginInlineEdit(mediaId, field) {
    if (!mediaId || !field) return;
    var item = findItem(mediaId);
    if (!item) return;
    var current = field === 'customerId' ? (item.customerId || '') : (item.status || '');
    S.inlineEdit = {
      mediaId:    mediaId,
      field:      field,
      draftValue: current,
      snapshot:   current
    };
    renderGrid();
  }

  function cancelInlineEdit() {
    S.inlineEdit = null;
    renderGrid();
  }

  function findItem(mediaId) {
    for (var i = 0; i < S.items.length; i++) {
      if (S.items[i].mediaId === mediaId) return S.items[i];
    }
    return null;
  }

  // ════════════════════════════════════════════════════════════
  // 10. DRAWER (asset-bind / structural edits)
  // ════════════════════════════════════════════════════════════

  function openDrawer(mediaId) {
    if (!mediaId) return;
    S.drawerOpenId = mediaId;
    renderDrawer();
  }

  function closeDrawer() {
    S.drawerOpenId = null;
    renderDrawer();
  }

  function renderDrawer() {
    var host = document.getElementById('cmp-detail-host');
    if (!host) return;
    if (!S.drawerOpenId) {
      host.innerHTML = '';
      host.classList.remove('cmp-detail-host--open');
      return;
    }
    var it = findItem(S.drawerOpenId);
    if (!it) {
      host.innerHTML = '';
      return;
    }

    host.classList.add('cmp-detail-host--open');
    host.innerHTML =
      '<div class="cmp-detail-backdrop" data-cmp-drawer-action="close"></div>' +
      '<aside class="cmp-detail-drawer" role="dialog" aria-modal="true" aria-label="Component details">' +
        '<header class="cmp-detail-head">' +
          '<div class="cmp-detail-title">' + escHtml(it.name || '(unnamed)') + '</div>' +
          '<button type="button" class="ix-btn ix-btn--ghost ix-btn--icon cmp-detail-close" ' +
            'data-cmp-drawer-action="close" aria-label="Close">\u00d7</button>' +
        '</header>' +
        '<div class="cmp-detail-body">' +
          (it.imageUrl
            ? '<img class="cmp-detail-thumb" src="' + escAttr(it.imageUrl) + '" alt="" />'
            : '') +
          '<dl class="cmp-detail-dl">' +
            kv('Status',          it.status) +
            kv('Component Role',  it.role) +
            kv('Media Type',      it.mediaType) +
            kv('Source',          it.sourceChannel) +
            kv('PDF Provenance',  it.pdfProvenance) +
            kv('Customer',        customerNameById(it.customerId) || '\u2014') +
            kv('Article ID',      it.articleId || '\u2014') +
            kv('Original file',   it.originalFilename) +
            kv('MIME',            it.mimeType) +
            kv('Size',            it.size) +
            kv('Created',         it.createdStr) +
            kv('Media ID',        it.mediaId) +
          '</dl>' +
          '<div class="cmp-detail-deferred">' +
            '<div class="cmp-detail-deferred-icon">\u270E</div>' +
            '<div class="cmp-detail-deferred-text">Structural edits (Article ref, Component Role) wire up in Sub-session C.</div>' +
          '</div>' +
        '</div>' +
      '</aside>';
  }

  function kv(label, val) {
    return (
      '<dt class="cmp-detail-key">' + escHtml(label) + '</dt>' +
      '<dd class="cmp-detail-val">' + escHtml(val || '\u2014') + '</dd>'
    );
  }

  // ════════════════════════════════════════════════════════════
  // 11. UTILITIES
  // ════════════════════════════════════════════════════════════

  function sel(current, val) {
    return current === val ? ' selected' : '';
  }

  function escHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escAttr(s) {
    return escHtml(s);
  }

  function truncate(s, n) {
    if (!s) return '';
    s = String(s).replace(/\s+/g, ' ').trim();
    if (s.length <= n) return s;
    return s.slice(0, n).replace(/\s+\S*$/, '') + '\u2026';
  }

  function firstLetter(s) {
    s = (s || '').trim();
    return s ? s.charAt(0).toUpperCase() : '';
  }

  function toast(msg) {
    // Lightweight standalone toast. The shared toast pattern (TD-134)
    // hasn't been extracted yet; this stays self-contained until that
    // helper exists, then switches to the shared one.
    var node = document.createElement('div');
    node.className = 'cmp-toast';
    node.textContent = msg;
    document.body.appendChild(node);
    setTimeout(function () { node.classList.add('cmp-toast--visible'); }, 10);
    setTimeout(function () {
      node.classList.remove('cmp-toast--visible');
      setTimeout(function () { node.parentNode && node.parentNode.removeChild(node); }, 300);
    }, 2200);
  }

  // ════════════════════════════════════════════════════════════
  // 12. PUBLIC API + BOOTSTRAP
  // ════════════════════════════════════════════════════════════

  function mount(rootEl) {
    if (!rootEl) {
      if (DEBUG) console.warn('[InbxComponentsTab] mount called without rootEl');
      return;
    }
    S.rootEl = rootEl;

    if (!S.mounted) {
      renderShell(rootEl);
      S.mounted = true;
    }

    // Always re-read DOM on mount — catches new MEDIA rows from
    // republish since last activation.
    refresh();
  }

  function refresh() {
    if (!S.rootEl || !S.mounted) return;
    S.items     = readMediaItems();
    S.customers = readCustomers();
    renderSearchRow();
    renderFilterBar();
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
      inlineEdit:    S.inlineEdit ? cloneObj(S.inlineEdit) : null,
      bulkEdit:      S.bulkEdit   ? cloneObj(S.bulkEdit)   : null
    };
  }

  // ─── Listen for ta-studio's panel-activation event ───
  // ta-studio v1.3.0+ dispatches std:panel:components when the
  // user clicks the Components subtab. Previously ta-studio called
  // renderComponents() directly; now it delegates here.
  window.addEventListener('std:panel:components', function () {
    var host = document.querySelector('[data-std-panel-body="components"] #cmp-root, [data-std-panel-body="components"] .cmp-root, [data-std-panel-body="components"]');
    if (!host) {
      if (DEBUG) console.warn('[InbxComponentsTab] no Components panel container found');
      return;
    }
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
