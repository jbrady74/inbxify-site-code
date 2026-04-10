// ============================================================
// content-library-v1.0.5.js
// INBXIFY Content Library — T-A Page Tab
// Mounts into #content-library-mount on ContentLibrary tab
// Config from window.TA_CONFIG
//
// v1.0.2: Fix selector + fix attribute names.
//         Wrapper class IS the data-item element (no descendant space).
//         Articles use articleId, articleTitle, articleCustomerName,
//         articleCategoryCode, etc. Separate readers per collection
//         instead of generic readCmsItem.
// v1.0.1: Renamed file (Jeff)
// v1.0.0: Initial build
//   - Main tabs: Articles / Ads
//   - Sub-tabs by MNLS section (FA, TS, BA, SA, TF)
//   - Product Library dropdown filter
//   - Dual status filters: Content (Draft/Live) + Assignment
//     (Assigned/Available)
//   - Sort: Title A-Z, Customer A-Z, Newest First
//   - PubPlan + Slot assignment per item with gold dirty borders
//   - Cancel link reverts to original state
//   - Reads from hidden DOM collection lists:
//       .articles-wrapper, .ad-source, .customers-wrapper,
//       .products-wrapper, [data-events-wrapper], [data-re-wrapper]
//   - Reads pubplans from .pubplan-slot-wrapper elements
//   - Uses shared .cm-hdr classes from ta-page-head-v1.4.css
//
// HARDCODE DECISIONS: None.
//   Collection type read from data-content-type (Product Library CMS).
//   Section abbreviation read from data-abbr (Product Library CMS).
//   Section color read from computed backgroundColor (Dynamic Style Setting).
//   CONTENT_TYPE_MAP maps CMS option labels to collection keys —
//   if new Content Type options are added in CMS, add them to the map.
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var mount = document.getElementById('content-library-mount');
  if (!mount) return;

  // ── Config ──
  var CFG = {
    get titleSlug()  { return (window.TA_CONFIG && window.TA_CONFIG.titleSlug) || (document.querySelector('[data-ta-slug]') || {}).dataset && document.querySelector('[data-ta-slug]').dataset.taSlug || ''; },
    get taItemId()   { return (window.TA_CONFIG && window.TA_CONFIG.taItemId)  || (document.querySelector('#title-admin-id') || {}).dataset && document.querySelector('#title-admin-id').dataset.ta || ''; },
    get titleName()  { return (window.TA_CONFIG && window.TA_CONFIG.titleName) || (document.querySelector('[data-title-name]') || {}).dataset && document.querySelector('[data-title-name]').dataset.titleName || ''; },
  };

  // ── Style injection ──
  var style = document.createElement('style');
  style.textContent = [
    '.cl-mtabs{display:flex;border-bottom:1.5px solid #e8e4d8;margin-bottom:0}',
    '.cl-mtab{font-family:"DM Mono",monospace;font-size:11px;letter-spacing:.05em;text-transform:uppercase;padding:9px 18px;border:none;background:transparent;color:#8a8a7a;cursor:pointer;position:relative;font-weight:500;transition:color .12s}',
    '.cl-mtab:hover{color:#1a3a3a}',
    '.cl-mtab.on{color:#1a3a3a;font-weight:700}',
    '.cl-mtab.on::after{content:"";position:absolute;bottom:-1.5px;left:0;right:0;height:2.5px;background:#1a3a3a;border-radius:2px 2px 0 0}',
    '.cl-mtab .tc{font-size:9px;background:#e8e4d8;color:#8a8a7a;padding:1px 5px;border-radius:8px;margin-left:4px;font-weight:400}',
    '.cl-mtab.on .tc{background:#1a3a3a;color:#f0edd8}',

    '.cl-toolbar{display:flex;align-items:center;gap:6px;padding:9px 0;border-bottom:1px solid #e8e4d8;margin-bottom:0;flex-wrap:wrap}',
    '.cl-toolbar-label{font-family:"DM Mono",monospace;font-size:9px;color:#a0a090;letter-spacing:.06em;text-transform:uppercase;margin-right:2px}',
    '.cl-pill{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:3px 9px;border-radius:3px;border:1.5px solid #e8e4d8;background:transparent;color:#5a6a5a;cursor:pointer;transition:all .12s}',
    '.cl-pill:hover{border-color:#c4a35a}',
    '.cl-pill.on{background:#1a3a3a;color:#fff;border-color:transparent}',
    '.cl-pill .pc{font-size:8px;opacity:.7;margin-left:2px}',
    '.cl-sep{width:1px;height:18px;background:#e8e4d8;margin:0 4px}',

    '.cl-status-row{display:flex;align-items:center;gap:6px;padding:8px 0;margin-bottom:8px;flex-wrap:wrap}',
    '.cl-sp{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.04em;padding:3px 8px;border-radius:2px;border:1px solid #e8e4d8;background:#fff;color:#a0a090;cursor:pointer;transition:all .12s}',
    '.cl-sp:hover{border-color:#c4a35a}',
    '.cl-sp.on-all{background:#1a3a3a;color:#fff;border-color:transparent}',
    '.cl-sp.on-draft{background:#fff8e1;color:#e8a030;border-color:#e8a030}',
    '.cl-sp.on-live{background:#e8f5e9;color:#27ae60;border-color:#27ae60}',
    '.cl-sp.on-asgn{background:#e8f0fe;color:#1a5276;border-color:#1a5276}',
    '.cl-sp.on-unasgn{background:#fdf3e0;color:#b8860b;border-color:#b8860b}',

    '.cl-sort{font-family:"DM Mono",monospace;font-size:9px;color:#8a8a7a;background:transparent;border:1px solid #e8e4d8;border-radius:2px;padding:3px 20px 3px 6px;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'5\'%3E%3Cpath d=\'M1 1l3 3 3-3\' fill=\'none\' stroke=\'%238a8a7a\' stroke-width=\'1.2\' stroke-linecap=\'round\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 5px center;outline:none}',
    '.cl-sort:focus{border-color:#1a3a3a}',

    '.cl-list{display:flex;flex-direction:column;gap:2px}',
    '.cl-row{background:#fff;border:1.5px solid #e8e4d8;border-radius:4px;transition:all .12s;overflow:hidden}',
    '.cl-row:hover{border-color:#c4a35a}',
    '.cl-row.editing{border-color:#c4a35a;background:#fdfcf8;box-shadow:0 2px 10px rgba(26,58,58,.06)}',
    '.cl-row-main{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;padding:7px 10px;cursor:pointer;gap:8px}',
    '.cl-row-info{min-width:0}',
    '.cl-row-name{font-size:12px;font-weight:600;color:#1a3a3a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.cl-row-meta{font-size:9px;font-family:"DM Mono",monospace;color:#a0a090;display:flex;gap:7px;margin-top:2px;align-items:center;flex-wrap:wrap}',
    '.cl-row-meta .m-cust{color:#1a3a3a}',
    '.cl-row-meta .m-mnls{font-weight:500}',
    '.cl-row-right{display:flex;align-items:center;gap:5px;flex-shrink:0}',
    '.cl-bdg{font-size:8px;font-family:"DM Mono",monospace;padding:2px 6px;border-radius:2px;text-transform:uppercase;letter-spacing:.06em}',
    '.cl-bdg-draft{background:#fff8e1;color:#e8a030}',
    '.cl-bdg-live{background:#e8f5e9;color:#27ae60}',
    '.cl-bdg-asgn{background:#e8f0fe;color:#1a5276}',
    '.cl-bdg-unasgn{background:#fdf3e0;color:#b8860b}',
    '.cl-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}',
    '.cl-slot-tag{display:inline-flex;align-items:center;gap:3px;font-size:9px;font-family:"DM Mono",monospace;padding:1px 5px;border-radius:2px;background:#f0ede4;color:#1a3a3a;font-weight:500}',

    '.cl-expand{padding:0 10px 10px;border-top:1px dashed #e8e4d8}',
    '.cl-expand-hdr{display:flex;align-items:center;justify-content:space-between;padding:7px 0 5px}',
    '.cl-expand-title{font-size:11px;font-weight:700;color:#1a3a3a}',
    '.cl-cancel{font-size:10px;font-family:"DM Mono",monospace;color:#c0392b;cursor:pointer;background:none;border:none;padding:0}',
    '.cl-cancel:hover{opacity:.7}',
    '.cl-form-row{display:flex;gap:10px;margin-bottom:7px;flex-wrap:wrap}',
    '.cl-ff{flex:1;min-width:130px}',
    '.cl-fl{display:block;font-size:9px;font-family:"DM Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;margin-bottom:3px}',
    '.cl-sel{width:100%;font-family:"DM Sans",sans-serif;font-size:11px;color:#1a3a3a;background:#faf9f5;border:1.5px solid #ddd9c8;border-radius:3px;padding:5px 22px 5px 7px;outline:none;transition:border-color .12s,box-shadow .12s;appearance:none;-webkit-appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'5\'%3E%3Cpath d=\'M1 1l3 3 3-3\' fill=\'none\' stroke=\'%238a8a7a\' stroke-width=\'1.2\' stroke-linecap=\'round\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 6px center}',
    '.cl-sel:focus{border-color:#1a3a3a;box-shadow:0 0 0 2px rgba(26,58,58,.08)}',
    '.cl-sel.changed{border-color:#c4a35a;box-shadow:0 0 0 2px rgba(196,163,90,.15)}',
    '.cl-sel:disabled{opacity:.5;cursor:not-allowed}',

    '.cl-assets{margin-top:5px;padding-top:5px;border-top:1px dotted #e8e4d8}',
    '.cl-assets-label{font-size:9px;font-family:"DM Mono",monospace;color:#a0a090;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}',
    '.cl-asset-row{display:flex;align-items:center;gap:5px;padding:3px 5px;background:#faf9f5;border:1px solid #e8e4d8;border-radius:3px;margin-bottom:2px;font-size:10px}',
    '.cl-asset-icon{font-size:13px;flex-shrink:0}',
    '.cl-asset-name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}',
    '.cl-asset-type{font-family:"DM Mono",monospace;font-size:8px;color:#a0a090;text-transform:uppercase;letter-spacing:.04em;padding:1px 4px;background:#fff;border:1px solid #e8e4d8;border-radius:2px}',

    '.cl-submit-row{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:6px;padding-top:6px;border-top:1px solid #f0ede4}',
    '.cl-save-btn{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:5px 14px;border-radius:3px;border:none;background:#c4a35a;color:#fff;cursor:pointer;transition:all .12s}',
    '.cl-save-btn:hover{background:#b8860b}',
    '.cl-save-btn:disabled{opacity:.4;cursor:not-allowed}',
    '.cl-save-info{font-size:9px;font-family:"DM Mono",monospace;color:#a0a090}',
    '.cl-empty{text-align:center;padding:28px 16px;color:#8a8a7a;font-family:"DM Mono",monospace;font-size:11px}',
    '.cl-files-ct{font-size:9px;font-family:"DM Mono",monospace;color:#a0a090}',
  ].join('\n');
  document.head.appendChild(style);

  // ══════════════════════════════════════════════
  // DOM DATA READERS
  // ══════════════════════════════════════════════

  // ── Read MNLS sections from products-wrapper ──
  // All data comes from DOM attributes — no string derivation.
  //   data-group        = MNLS Name (full label, e.g. "Feature Article")
  //   data-abbr  = Abbreviation from Product Library (FA, TS, BA, etc.)
  //   data-content-type = Collection category from Product Library
  //                       ("Article", "Ad", "Event", "Real Estate Listing")
  //   background-color  = Section color from Dynamic Style Settings
  //                       (Header Color bound to BG Color on products-wrapper)
  function readMnlsSections() {
    var sections = {};
    var items = document.querySelectorAll('.products-wrapper[data-item="true"]');
    items.forEach(function (el) {
      var group = (el.dataset.group || '').trim();
      var abbr = (el.dataset.abbr || '').trim().toUpperCase();
      var contentType = (el.dataset.contentType || '').trim();
      if (!group || !abbr) return;
      if (sections[abbr]) return; // one entry per abbreviation

      // Read color from computed background-color (Dynamic Style Setting)
      var rawColor = getComputedStyle(el).backgroundColor || '';
      var color = rgbToHex(rawColor) || '#5a6a5a';

      // Map Content Type label to collection key
      var collection = contentTypeToCollection(contentType);

      sections[abbr] = {
        id: abbr,
        label: group,
        abbr: abbr,
        color: color,
        collection: collection,
      };
    });
    return sections;
  }

  // Convert rgb(r,g,b) string to #hex
  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '';
    var match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return rgb; // already hex or unknown format
    var r = parseInt(match[1], 10);
    var g = parseInt(match[2], 10);
    var b = parseInt(match[3], 10);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Map CMS Content Type option label → collection key
  // Reads the exact label strings from Product Library "Content Type" option field.
  // If new option values are added in CMS, add them here.
  var CONTENT_TYPE_MAP = {
    'Article': 'articles',
    'Ad': 'ads',
    'Event': 'events',
    'Real Estate Listing': 're',
  };
  function contentTypeToCollection(label) {
    return CONTENT_TYPE_MAP[label] || 'ads';
  }

  // ── Read Products from products-wrapper ──
  function readProducts() {
    var out = [];
    var items = document.querySelectorAll('.products-wrapper[data-item="true"]');
    items.forEach(function (el) {
      var id = (el.dataset.id || '').trim();
      var name = (el.dataset.name || '').trim();
      var group = (el.dataset.group || '').trim();
      var abbr = (el.dataset.abbr || '').trim().toUpperCase();
      var contentType = (el.dataset.contentType || '').trim();
      var reqCust = !!el.querySelector('[data-customer-required="true"]');
      if (!id || !name) return;
      out.push({
        id: id,
        name: name,
        group: group,
        mnlsId: abbr,  // matches MNLS_SECTIONS key
        contentType: contentType,
        collection: contentTypeToCollection(contentType),
        reqCust: reqCust,
      });
    });
    return out;
  }

  // ── Read Customers from customers-wrapper ──
  function readCustomers() {
    var out = [];
    var items = document.querySelectorAll('.customers-wrapper[data-item="true"]');
    items.forEach(function (el) {
      var id = (el.dataset.id || '').trim();
      var name = (el.dataset.name || '').trim();
      if (!id || !name) return;
      out.push({ id: id, name: name });
    });
    return out.sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  // ── Read Articles from articles-wrapper ──
  // DOM attributes: articleId, articleTitle, articleCustomerName,
  //   articleCustomerId, articleCategoryCode, articleCategory,
  //   categoryId, label, type, item
  function readArticles() {
    var out = [];
    var items = document.querySelectorAll('.articles-wrapper[data-item="true"]');
    items.forEach(function (el) {
      var d = el.dataset;
      var id = (d.articleId || d.id || '').trim();
      var name = (d.articleTitle || d.name || d.label || '').trim();
      if (!id && !name) return;
      out.push({
        id: id,
        name: name,
        collection: 'articles',
        status: (d.status || d.articleStatus || 'draft').trim().toLowerCase(),
        customerId: (d.articleCustomerId || d.customerId || '').trim() || null,
        customerName: (d.articleCustomerName || d.customerName || '').trim() || null,
        productId: (d.productId || '').trim() || null,
        productName: (d.type || d.productName || '').trim() || null,
        mnlsGroup: (d.articleCategory || d.group || '').trim(),
        mnlsAbbr: (d.articleCategoryCode || d.abbr || '').trim().toUpperCase() || '',
        newsletterId: (d.newsletterId || '').trim() || null,
        pubplanId: (d.pubplanId || '').trim() || null,
        pubplanName: (d.pubplanName || '').trim() || null,
        slot: (d.slot || '').trim() || null,
        created: (d.created || d.articleCreated || '').trim() || null,
        assetCount: parseInt(d.assetCount || '0', 10),
      });
    });
    return out;
  }

  // ── Read Ads from ads-wrapper ──
  // DOM attributes may use ad- prefix (adId, adTitle, etc.)
  // or generic names — read both with fallbacks
  function readAds() {
    var out = [];
    var items = document.querySelectorAll('.ad-source[data-item="true"]');
    items.forEach(function (el) {
      var d = el.dataset;
      var id = (d.adId || d.id || '').trim();
      var name = (d.adTitle || d.adName || d.name || d.label || '').trim();
      if (!id && !name) return;
      out.push({
        id: id,
        name: name,
        collection: 'ads',
        status: (d.status || d.adStatus || 'draft').trim().toLowerCase(),
        customerId: (d.adCustomerId || d.customerId || '').trim() || null,
        customerName: (d.adCustomerName || d.customerName || '').trim() || null,
        productId: (d.productId || '').trim() || null,
        productName: (d.type || d.productName || '').trim() || null,
        mnlsGroup: (d.adCategory || d.group || '').trim(),
        mnlsAbbr: (d.adCategoryCode || d.abbr || '').trim().toUpperCase() || '',
        pubplanId: (d.pubplanId || '').trim() || null,
        pubplanName: (d.pubplanName || '').trim() || null,
        slot: (d.slot || '').trim() || null,
        created: (d.created || d.adCreated || '').trim() || null,
        assetCount: parseInt(d.assetCount || '0', 10),
      });
    });
    return out;
  }

  // ── Read PubPlans from pubplan-slot-wrapper elements ──
  function readPubplans() {
    var seen = {};
    var out = [];
    var items = document.querySelectorAll('.pubplan-slot-wrapper[data-pubplan-id]');
    items.forEach(function (el) {
      var id = (el.dataset.pubplanId || '').trim();
      var name = (el.dataset.pubplanName || el.dataset.issueLabel || '').trim();
      if (!id || seen[id]) return;
      seen[id] = true;
      out.push({ id: id, name: name || 'Issue ' + id.slice(-3) });
    });
    return out;
  }

  // ── Read slots for a given MNLS from pubplan HTML ──
  function readSlotsForMnls(mnlsAbbr) {
    // Derive slot prefix from abbreviation (FA, TS, BA, SA, TF)
    var prefix = mnlsAbbr.toUpperCase();
    var slots = [];
    var items = document.querySelectorAll('.pubplan-slot-wrapper[data-slot-label]');
    items.forEach(function (el) {
      var label = (el.dataset.slotLabel || '').trim();
      if (label.indexOf(prefix + '-') === 0 && slots.indexOf(label) === -1) {
        slots.push(label);
      }
    });
    // Sort numerically
    slots.sort(function (a, b) {
      var numA = parseInt(a.split('-')[1], 10) || 0;
      var numB = parseInt(b.split('-')[1], 10) || 0;
      return numA - numB;
    });
    return slots;
  }

  // ══════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════

  var MNLS_SECTIONS = {};  // populated on init
  var PRODUCTS = [];
  var CUSTOMERS = [];
  var ALL_ITEMS = [];      // combined articles + ads
  var PUBPLANS = [];

  var S = {
    mainTab: 'articles',   // articles | ads
    subTab: 'all',         // all | FA | TS | etc.
    contentStatus: 'live', // all | draft | live
    assignStatus: 'available', // all | assigned | available
    sortBy: 'name',        // name | customer | date
    editingId: null,
    edit: {},              // { pubplan: '', slot: '' }
  };

  // ══════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════

  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function mnlsForTab(tab) {
    var out = [];
    var targetCollection = tab === 'articles' ? 'articles' : 'ads';
    Object.keys(MNLS_SECTIONS).forEach(function (key) {
      var m = MNLS_SECTIONS[key];
      if (m.collection === targetCollection) out.push(m);
    });
    return out;
  }

  // Find MNLS section for a given item by looking up its product's mnlsId
  function findMnlsForItem(item) {
    // If item has a direct abbr, use it
    if (item.mnlsAbbr && MNLS_SECTIONS[item.mnlsAbbr]) return MNLS_SECTIONS[item.mnlsAbbr];
    // Otherwise look up via product
    if (item.productId) {
      var prod = PRODUCTS.find(function (p) { return p.id === item.productId; });
      if (prod && MNLS_SECTIONS[prod.mnlsId]) return MNLS_SECTIONS[prod.mnlsId];
    }
    // Fallback: match by group name
    return Object.values(MNLS_SECTIONS).find(function (m) { return m.label === item.mnlsGroup; }) || null;
  }

  function itemsForTab(tab) {
    var targetCollection = tab === 'articles' ? 'articles' : 'ads';
    return ALL_ITEMS.filter(function (i) { return i.collection === targetCollection; });
  }

  function getFiltered() {
    var items = itemsForTab(S.mainTab);

    // Sub-tab filter by MNLS abbreviation
    if (S.subTab !== 'all') {
      items = items.filter(function (i) {
        var m = findMnlsForItem(i);
        return m && m.id === S.subTab;
      });
    }

    // Content status
    if (S.contentStatus !== 'all') {
      items = items.filter(function (i) { return i.status === S.contentStatus; });
    }

    // Assignment status
    // Articles: assigned = has newsletterId (used in a newsletter)
    // Ads: assigned = has pubplanId and slot
    if (S.assignStatus === 'assigned') {
      items = items.filter(function (i) {
        return i.collection === 'articles' ? !!i.newsletterId : (i.pubplanId && i.slot);
      });
    } else if (S.assignStatus === 'available') {
      items = items.filter(function (i) {
        return i.collection === 'articles' ? !i.newsletterId : (!i.pubplanId || !i.slot);
      });
    }

    // Sort
    items.sort(function (a, b) {
      if (S.sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (S.sortBy === 'customer') {
        var ca = a.customerName || '\uffff';
        var cb = b.customerName || '\uffff';
        return ca.localeCompare(cb);
      }
      if (S.sortBy === 'date') {
        return (b.created || '').localeCompare(a.created || '');
      }
      return 0;
    });

    return items;
  }

  function getAssignedSlots(pubplanId, mnlsAbbr, excludeId) {
    return ALL_ITEMS.filter(function (i) {
      return i.pubplanId === pubplanId && i.slot && i.slot.indexOf(mnlsAbbr + '-') === 0 && i.id !== excludeId;
    }).map(function (i) { return i.slot; });
  }

  // ══════════════════════════════════════════════
  // ACTIONS
  // ══════════════════════════════════════════════

  function setMain(tab) { S.mainTab = tab; S.subTab = 'all'; S.editingId = null; render(); }
  function setSub(val) { S.subTab = val; S.editingId = null; render(); }
  function setCS(val) { S.contentStatus = val; render(); }
  function setAS(val) { S.assignStatus = val; render(); }
  function setSort(val) { S.sortBy = val; render(); }

  function startEdit(id) {
    var item = ALL_ITEMS.find(function (i) { return i.id === id; });
    if (!item) return;
    S.editingId = id;
    S.edit = { pubplan: item.pubplanId || '', slot: item.slot || '' };
    render();
  }

  function cancelEdit() {
    S.editingId = null;
    S.edit = {};
    render();
  }

  function saveEdit() {
    var item = ALL_ITEMS.find(function (i) { return i.id === S.editingId; });
    if (!item) return;

    var ppChanged = S.edit.pubplan !== (item.pubplanId || '');
    var slotChanged = S.edit.slot !== (item.slot || '');

    if (!ppChanged && !slotChanged) { cancelEdit(); return; }

    // Log payload (webhook wiring goes here)
    console.log('[CONTENT-LIBRARY] Save:', {
      itemId: item.id,
      itemName: item.name,
      collection: item.collection,
      pubplanId: S.edit.pubplan || null,
      slot: S.edit.slot || null,
      previousPubplan: item.pubplanId,
      previousSlot: item.slot,
    });

    // Update local state
    item.pubplanId = S.edit.pubplan || null;
    item.slot = S.edit.slot || null;

    // Find pubplan name
    if (item.pubplanId) {
      var pp = PUBPLANS.find(function (p) { return p.id === item.pubplanId; });
      item.pubplanName = pp ? pp.name : null;
    } else {
      item.pubplanName = null;
    }

    S.editingId = null;
    S.edit = {};
    render();
  }

  function setEditField(key, val) {
    S.edit[key] = val;
    if (key === 'pubplan') S.edit.slot = '';
    render();
  }

  // Expose to onclick handlers
  window._clSetMain = setMain;
  window._clSetSub = setSub;
  window._clSetCS = setCS;
  window._clSetAS = setAS;
  window._clSetSort = setSort;
  window._clStartEdit = startEdit;
  window._clCancelEdit = cancelEdit;
  window._clSaveEdit = saveEdit;
  window._clSetEd = setEditField;

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  function render() {
    var items = getFiltered();
    var allMnls = mnlsForTab(S.mainTab);
    var artCt = itemsForTab('articles').length;
    var adCt = itemsForTab('ads').length;
    var titleName = CFG.titleName || 'Content Library';

    var h = '';

    // ── Header (shared .cm-hdr from ta-page-head) ──
    h += '<div class="cm-hdr"><div class="cm-hdr-left">';
    h += '<div class="cm-hdr-icon">\uD83D\uDCDA</div>';
    h += '<div><h3>Content Library</h3><div class="cm-hdr-sub">' + esc(titleName) + '</div></div>';
    h += '</div><span class="cm-badge">v1.0.0</span></div>';

    // ── Main tabs ──
    h += '<div class="cl-mtabs">';
    h += '<button class="cl-mtab ' + (S.mainTab === 'articles' ? 'on' : '') + '" onclick="_clSetMain(\'articles\')">Articles<span class="tc">' + artCt + '</span></button>';
    h += '<button class="cl-mtab ' + (S.mainTab === 'ads' ? 'on' : '') + '" onclick="_clSetMain(\'ads\')">Ads<span class="tc">' + adCt + '</span></button>';
    h += '</div>';

    // ── Sub-tabs (MNLS sections) + Product dropdown ──
    h += '<div class="cl-toolbar"><span class="cl-toolbar-label">Section:</span>';
    var tabItems = itemsForTab(S.mainTab);
    h += '<button class="cl-pill ' + (S.subTab === 'all' ? 'on' : '') + '" onclick="_clSetSub(\'all\')">All<span class="pc">' + tabItems.length + '</span></button>';
    allMnls.forEach(function (m) {
      var ct = tabItems.filter(function (i) {
        var im = findMnlsForItem(i);
        return im && im.id === m.id;
      }).length;
      h += '<button class="cl-pill ' + (S.subTab === m.id ? 'on' : '') + '" onclick="_clSetSub(\'' + m.id + '\')">' + esc(m.abbr) + '<span class="pc">' + ct + '</span></button>';
    });

    // Product dropdown
    var relProds = PRODUCTS.filter(function (p) { return allMnls.some(function (m) { return m.id === p.mnlsId; }); });
    if (relProds.length) {
      h += '<span class="cl-sep"></span><span class="cl-toolbar-label">Product:</span>';
      h += '<select class="cl-sort" style="min-width:120px" onchange="_clSetSub(this.value)">';
      h += '<option value="all">All products</option>';
      allMnls.forEach(function (m) {
        var prods = relProds.filter(function (p) { return p.mnlsId === m.id; });
        if (prods.length) {
          h += '<optgroup label="' + esc(m.label) + '">';
          prods.forEach(function (p) { h += '<option value="' + m.id + '">' + esc(p.name) + '</option>'; });
          h += '</optgroup>';
        }
      });
      h += '</select>';
    }
    h += '</div>';

    // ── Status row: Content + Assignment + Sort ──
    h += '<div class="cl-status-row">';
    h += '<span class="cl-toolbar-label">Content:</span>';
    h += '<button class="cl-sp ' + (S.contentStatus === 'all' ? 'on-all' : '') + '" onclick="_clSetCS(\'all\')">All</button>';
    h += '<button class="cl-sp ' + (S.contentStatus === 'draft' ? 'on-draft' : '') + '" onclick="_clSetCS(\'draft\')">Draft</button>';
    h += '<button class="cl-sp ' + (S.contentStatus === 'live' ? 'on-live' : '') + '" onclick="_clSetCS(\'live\')">Live</button>';
    h += '<span class="cl-sep"></span>';
    h += '<span class="cl-toolbar-label">Assignment:</span>';
    h += '<button class="cl-sp ' + (S.assignStatus === 'all' ? 'on-all' : '') + '" onclick="_clSetAS(\'all\')">All</button>';
    h += '<button class="cl-sp ' + (S.assignStatus === 'assigned' ? 'on-asgn' : '') + '" onclick="_clSetAS(\'assigned\')">Assigned</button>';
    h += '<button class="cl-sp ' + (S.assignStatus === 'available' ? 'on-unasgn' : '') + '" onclick="_clSetAS(\'available\')">Available</button>';
    h += '<span style="flex:1"></span>';
    h += '<span class="cl-toolbar-label">Sort:</span>';
    h += '<select class="cl-sort" onchange="_clSetSort(this.value)">';
    h += '<option value="name"' + (S.sortBy === 'name' ? ' selected' : '') + '>Title A\u2013Z</option>';
    h += '<option value="customer"' + (S.sortBy === 'customer' ? ' selected' : '') + '>Customer A\u2013Z</option>';
    h += '<option value="date"' + (S.sortBy === 'date' ? ' selected' : '') + '>Newest first</option>';
    h += '</select>';
    h += '</div>';

    // ── Item list ──
    if (!items.length) {
      h += '<div class="cl-empty">No items match these filters</div>';
    } else {
      h += '<div class="cl-list">';
      items.forEach(function (item) {
        var mnls = findMnlsForItem(item);
        var isEd = S.editingId === item.id;
        var isAssigned = item.collection === 'articles' ? !!item.newsletterId : (item.pubplanId && item.slot);

        h += '<div class="cl-row ' + (isEd ? 'editing' : '') + '">';
        h += '<div class="cl-row-main" onclick="' + (isEd ? '' : '_clStartEdit(\'' + item.id + '\')') + '">';

        // Info column
        h += '<div class="cl-row-info"><div class="cl-row-name">' + esc(item.name) + '</div>';
        h += '<div class="cl-row-meta">';
        if (mnls) {
          h += '<span class="cl-dot" style="background:' + mnls.color + '"></span>';
          h += '<span class="m-mnls" style="color:' + mnls.color + '">' + esc(mnls.abbr) + '</span>';
        }
        if (item.productName) h += '<span>' + esc(item.productName) + '</span>';
        if (item.customerName) h += '<span class="m-cust">' + esc(item.customerName) + '</span>';
        if (item.slot) h += '<span class="cl-slot-tag">' + esc(item.slot) + '</span>';
        if (item.pubplanName) h += '<span style="color:#a0a090">' + esc(item.pubplanName) + '</span>';
        h += '</div></div>';

        // Right column (badges)
        h += '<div class="cl-row-right">';
        if (item.assetCount > 0) h += '<span class="cl-files-ct">' + item.assetCount + ' file' + (item.assetCount > 1 ? 's' : '') + '</span>';
        h += '<span class="cl-bdg ' + (item.status === 'live' ? 'cl-bdg-live' : 'cl-bdg-draft') + '">' + esc(item.status) + '</span>';
        h += '<span class="cl-bdg ' + (isAssigned ? 'cl-bdg-asgn' : 'cl-bdg-unasgn') + '">' + (isAssigned ? 'assigned' : 'available') + '</span>';
        h += '</div></div>';

        // ── Expand panel (PubPlan assignment) ──
        if (isEd) {
          var es = S.edit;
          var ppCh = es.pubplan !== (item.pubplanId || '');
          var slCh = es.slot !== (item.slot || '');
          var anyCh = ppCh || slCh;

          // Get MNLS abbreviation for slot lookup
          var mnlsAbbr = mnls ? mnls.abbr : '';
          var allSlots = mnlsAbbr ? readSlotsForMnls(mnlsAbbr) : [];
          var usedSlots = es.pubplan ? getAssignedSlots(es.pubplan, mnlsAbbr, item.id) : [];
          var availSlots = allSlots.filter(function (s) { return usedSlots.indexOf(s) === -1; });

          h += '<div class="cl-expand">';
          h += '<div class="cl-expand-hdr"><span class="cl-expand-title">PubPlan Assignment</span><button class="cl-cancel" onclick="_clCancelEdit()">\u2715 cancel</button></div>';

          h += '<div class="cl-form-row">';
          // PubPlan dropdown
          h += '<div class="cl-ff"><label class="cl-fl">PubPlan (Issue)</label>';
          h += '<select class="cl-sel ' + (ppCh ? 'changed' : '') + '" onchange="_clSetEd(\'pubplan\',this.value)">';
          h += '<option value="">Available</option>';
          PUBPLANS.forEach(function (pp) {
            h += '<option value="' + esc(pp.id) + '"' + (es.pubplan === pp.id ? ' selected' : '') + '>' + esc(pp.name) + '</option>';
          });
          h += '</select></div>';

          // Slot dropdown
          h += '<div class="cl-ff"><label class="cl-fl">Slot</label>';
          h += '<select class="cl-sel ' + (slCh ? 'changed' : '') + '"' + (es.pubplan ? '' : ' disabled') + ' onchange="_clSetEd(\'slot\',this.value)">';
          h += '<option value="">Select slot\u2026</option>';
          if (es.pubplan) {
            availSlots.forEach(function (s) {
              h += '<option value="' + esc(s) + '"' + (es.slot === s ? ' selected' : '') + '>' + s + '</option>';
            });
            // Keep current slot visible if already assigned
            if (es.slot && availSlots.indexOf(es.slot) === -1) {
              h += '<option value="' + esc(es.slot) + '" selected>' + es.slot + ' (current)</option>';
            }
          }
          h += '</select></div>';
          h += '</div>';

          // Submit row
          h += '<div class="cl-submit-row">';
          if (anyCh) h += '<span class="cl-save-info">Unsaved changes</span>';
          h += '<button class="cl-save-btn"' + (anyCh ? '' : ' disabled') + ' onclick="_clSaveEdit()">Save</button>';
          h += '</div>';
          h += '</div>';
        }

        h += '</div>';
      });
      h += '</div>';
    }

    mount.innerHTML = h;
  }

  // ══════════════════════════════════════════════
  // INIT
  // ══════════════════════════════════════════════

  function init() {
    // Read DOM data
    MNLS_SECTIONS = readMnlsSections();
    PRODUCTS = readProducts();
    CUSTOMERS = readCustomers();
    PUBPLANS = readPubplans();

    var articles = readArticles();
    var ads = readAds();
    ALL_ITEMS = articles.concat(ads);

    // Deferred resolution: set mnlsAbbr and collection from product data
    ALL_ITEMS.forEach(function (item) {
      if (item.productId) {
        var prod = PRODUCTS.find(function (p) { return p.id === item.productId; });
        if (prod) {
          if (!item.mnlsAbbr) item.mnlsAbbr = prod.mnlsId;
          if (!item.mnlsGroup) item.mnlsGroup = prod.group;
          // Override fallback collection with product's CMS-driven collection
          item.collection = prod.collection;
        }
      }
    });

    console.log('[CONTENT-LIBRARY] Init:', {
      mnlsSections: Object.keys(MNLS_SECTIONS).length,
      products: PRODUCTS.length,
      customers: CUSTOMERS.length,
      articles: articles.length,
      ads: ads.length,
      pubplans: PUBPLANS.length,
    });

    render();
  }

  // Wait for Memberstack auth gate (same pattern as Content Processor)
  var attempts = 0;
  var maxAttempts = 20;
  function waitForData() {
    attempts++;
    var hasArticles = document.querySelectorAll('.articles-wrapper[data-item="true"]').length > 0;
    var hasAds = document.querySelectorAll('.ad-source[data-item="true"]').length > 0;

    if (hasArticles || hasAds || attempts >= maxAttempts) {
      init();
    } else {
      setTimeout(waitForData, 250);
    }
  }

  waitForData();
});
