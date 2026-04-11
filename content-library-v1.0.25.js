// ============================================================
// content-library-v1.0.25.js
// INBXIFY Content Library — T-A Page Tab
// Mounts into #content-library-mount on ContentLibrary tab
// Config from window.TA_CONFIG
//
// v1.0.21: Split buttons: "Assign" (gold, available articles only) +
//          "View" (opens detail modal). Modal shows title, status,
//          section, customer, assignment, revenue type, elements.
//          PubPlan dropdown: shows In Progress OR future date.
//          Button column widened to 110px for two buttons.
// v1.0.20: Assignment column 350px. Slot pill moved inline with
//          issue/date (WLN-109 | April 12 | FA-1). MNLS name on
//          second line. All assignment text uniform DM Mono 10px.
// v1.0.19: Default filters: Content=All, Assignment=Available.
//          Assignment header on one line.
//          Customer font: DM Mono 11px. MNLS name: DM Mono 10px.
//          Grid columns: 1fr 1fr 200px 60px (title/customer 50/50).
// v1.0.17-18: Column ratio adjustments, purge/deploy iterations.
// v1.0.16: New table-style layout — fixed columns for vertical scanning.
//          Lifecycle flows left to right: dot+title, customer, assignment, edit.
//          Status dot (green=live, yellow=draft) replaces status badge.
//          Assignment column stacks newsletter+date, MNLS name, slot pill.
//          Edit/View button in rightmost column.
//          Column headers with grid alignment.
// v1.0.15: Article status reads from data-article-status hash.
//          HC-CL-004 added for status hashes.
// v1.0.14: data-mnls-id reverted, productId reads from data-category-id.
//          mnlsName reads from data-mnls-name. hidden-category-group
//          sends mnlsName directly.
//         Cross-references articleId in slot wrappers to build
//         assignment map at init. Assigned badge shows issue name.
//         PubPlan dropdown filtered to Planning Status = "In Progress"
//         (reads data-planning-status from slot wrappers).
//         Falls back to showing all if attribute not yet bound.
// v1.0.8: Uppercase slot labels (fa-1→FA-1) in webhook payload.
//         Added hidden-product-id to payload.
// v1.0.7: Webhook payload uppercase + product ID (superseded by v1.0.8)
// v1.0.6: Webhook integration — fires TA_CONFIG.pubplanWebhooks[section]
//         with hidden-* URLSearchParams payload (GET, no-cors).
//         Reads slot occupancy from DOM (articleId on slot wrappers).
//         Slot dropdown shows open/taken/current status.
//         PubPlan dropdown shows issue name + date, sorted newest first.
//         Assign button replaces Save button.
// v1.0.5: Articles assignment checks data-newsletter-id (NEWSLETTER ref).
//         Renamed "Unassigned" → "Available" everywhere.
//         Default view: Live + Available.
// v1.0.4: Ad wrapper selector fix (.ad-source not .ads-wrapper).
// v1.0.3: Version bump (Jeff)
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
//       .products-wrapper
//   - Reads pubplans from .pubplan-slot-wrapper elements
//   - Uses shared .cm-hdr classes from ta-page-head-v1.4.css
//
// HARDCODE DECISIONS:
//   HC-CL-003: Planning Status Option hashes from Webflow:
//     In Progress = cbad0e93deea996b0769d71d808d59c5
//     Locked      = e13edebeb1ba9d07a0f7f000786e0586
//   HC-CL-004: Article Status Option hashes from Webflow:
//     Draft = 0d3cc821244f5a9417a0ed9d2feab959
//     Live  = c3dca0db4fa5e97cb71335bd0f28c667
//   All other data read from DOM — no derivation.
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
    '.cl-mtabs{display:flex;gap:0;margin-bottom:0;border-bottom:2px solid #e8e4d8;align-items:flex-end}',
    '.cl-mtab{font-family:"DM Sans",system-ui,sans-serif;font-size:12px;font-weight:600;padding:10px 18px 8px;border:none;background:transparent;color:#8a8a7a;cursor:pointer;transition:all .15s;border-bottom:3px solid transparent;margin-bottom:-2px}',
    '.cl-mtab:hover{color:#1a3a3a}',
    '.cl-mtab.on{color:#1a3a3a;border-bottom-color:#c4a35a;background:#fdfcf8}',
    '.cl-mtab .tc{font-size:9px;background:#e8e4d8;color:#8a8a7a;padding:1px 5px;border-radius:8px;margin-left:4px;font-weight:400}',
    '.cl-mtab.on .tc{background:#1a3a3a;color:#f0edd8}',

    '.cl-toolbar{display:flex;align-items:center;gap:4px;padding:10px 0;margin-bottom:14px;flex-wrap:wrap}',
    '.cl-toolbar-label{font-family:"DM Mono",monospace;font-size:9px;color:#a0a090;letter-spacing:.06em;text-transform:uppercase;margin-right:2px}',
    '.cl-pill{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:4px 12px;border-radius:4px;border:1.5px solid #e8e4d8;background:#fff;color:#5a6a5a;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:5px}',
    '.cl-pill:hover{border-color:#1a3a3a;color:#1a3a3a}',
    '.cl-pill.on{background:#1a3a3a;color:#fff;border-color:#1a3a3a}',
    '.cl-pill .pc{font-size:9px;opacity:.7}',
    '.cl-sep{width:1px;height:18px;background:#e8e4d8;margin:0 6px}',
    '.cl-sort{font-family:"DM Mono",monospace;font-size:10px;color:#5a6a5a;background:#fff;border:1.5px solid #e8e4d8;border-radius:4px;padding:4px 20px 4px 8px;cursor:pointer;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'5\'%3E%3Cpath d=\'M1 1l3 3 3-3\' fill=\'none\' stroke=\'%238a8a7a\' stroke-width=\'1.2\' stroke-linecap=\'round\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 6px center;outline:none;transition:all .15s}',
    '.cl-sort:hover{border-color:#1a3a3a;color:#1a3a3a}',
    '.cl-sort:focus{border-color:#1a3a3a}',

    '.cl-thead{display:grid;grid-template-columns:1fr 1fr 350px 110px;gap:0;border-bottom:2px solid #1a3a3a;padding:6px 0;align-items:end}',
    '.cl-th{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;padding:0 10px}',
    '.cl-th-sub{font-size:8px;color:#a0a090;letter-spacing:.03em;text-transform:none;margin-left:4px}',

    '.cl-list{display:flex;flex-direction:column;gap:3px;margin-top:4px}',
    '.cl-card{background:#fff;border:1.5px solid #e8e4d8;border-radius:4px;transition:border-color .12s;overflow:hidden}',
    '.cl-card:hover{border-color:#c4a35a}',
    '.cl-card.editing{border-color:#c4a35a;background:#fdfcf8;box-shadow:0 2px 10px rgba(26,58,58,.06)}',
    '.cl-card-main{display:grid;grid-template-columns:1fr 1fr 350px 110px;gap:0;align-items:center;padding:11px 0;cursor:pointer}',
    '.cl-cell{padding:0 10px;min-width:0;overflow:hidden}',
    '.cl-title-cell{display:flex;align-items:center;gap:8px;padding:0 10px;min-width:0}',
    '.cl-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}',
    '.cl-dot-live{background:#27ae60}',
    '.cl-dot-draft{background:#e8a030}',
    '.cl-title{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}',
    '.cl-cust{font-family:"DM Mono",monospace;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.cl-cust-name{color:#1a3a3a}',
    '.cl-cust-none{color:#c4c0b0}',
    '.cl-assign{font-size:11px;line-height:1.5}',
    '.cl-assign-issue{font-family:"DM Mono",monospace;font-size:10px;color:#1a3a3a;font-weight:500}',
    '.cl-assign-mnls{font-family:"DM Mono",monospace;font-size:10px;color:#5a6a5a}',
    '.cl-assign-slot{font-family:"DM Mono",monospace;font-size:10px;color:#1a3a3a;font-weight:500}',
    '.cl-assign-avail{font-family:"DM Mono",monospace;font-size:10px;color:#c4a35a}',
    '.cl-btn{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.04em;padding:4px 8px;border-radius:3px;border:1px solid #e8e4d8;background:transparent;color:#1a3a3a;cursor:pointer;white-space:nowrap;transition:all .12s}',
    '.cl-btn:hover{border-color:#1a3a3a;background:#1a3a3a;color:#f0edd8}',

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

    '.cl-submit-row{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:6px;padding-top:6px;border-top:1px solid #f0ede4}',
    '.cl-save-btn{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:5px 14px;border-radius:3px;border:none;background:#c4a35a;color:#fff;cursor:pointer;transition:all .12s}',
    '.cl-save-btn:hover{background:#b8860b}',
    '.cl-save-btn:disabled{opacity:.4;cursor:not-allowed}',
    '.cl-save-info{font-size:9px;font-family:"DM Mono",monospace;color:#a0a090}',
    '.cl-empty{text-align:center;padding:28px 16px;color:#8a8a7a;font-family:"DM Mono",monospace;font-size:11px}',
    '.cl-btn-assign{background:#c4a35a;color:#fff;border-color:#c4a35a}',
    '.cl-btn-assign:hover{background:#b8860b;border-color:#b8860b;color:#fff}',
    '.cl-modal-overlay{position:fixed;inset:0;background:rgba(26,58,58,0.7);z-index:10000;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}',
    '.cl-modal{background:#fff;border-radius:8px;width:520px;max-width:95vw;max-height:80vh;overflow-y:auto;font-family:"DM Sans",sans-serif;color:#1a3a3a;box-shadow:0 20px 60px rgba(0,0,0,0.3)}',
    '.cl-modal-bar{height:4px;background:linear-gradient(90deg,#1a3a3a,#c4a35a);border-radius:8px 8px 0 0}',
    '.cl-modal-body{padding:16px 18px}',
    '.cl-modal-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}',
    '.cl-modal-title{font-size:15px;font-weight:700}',
    '.cl-modal-meta{font-family:"DM Mono",monospace;font-size:10px;color:#8a8a7a;display:flex;gap:8px;align-items:center;margin-top:2px}',
    '.cl-modal-close{width:28px;height:28px;border-radius:50%;border:1.5px solid #e8e4d8;background:#fff;cursor:pointer;font-size:14px;color:#8a8a7a;transition:all .15s;flex-shrink:0;display:flex;align-items:center;justify-content:center}',
    '.cl-modal-close:hover{border-color:#c0392b;color:#c0392b}',
    '.cl-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:12px;padding:10px 0;border-top:1px solid #e8e4d8;border-bottom:1px solid #e8e4d8;margin-bottom:12px}',
    '.cl-modal-label{font-family:"DM Mono",monospace;font-size:9px;color:#8a8a7a;letter-spacing:.06em;text-transform:uppercase;margin-bottom:2px}',
    '.cl-modal-val{font-weight:500}',
    '.cl-modal-section{font-family:"DM Mono",monospace;font-size:9px;color:#8a8a7a;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}',
    '.cl-modal-elem{display:flex;align-items:center;gap:8px;padding:7px 10px;background:#faf9f5;border:1px solid #e8e4d8;border-radius:4px;margin-bottom:4px}',
    '.cl-modal-elem-icon{width:36px;height:36px;background:#e8e4d8;border-radius:3px;display:flex;align-items:center;justify-content:center;font-family:"DM Mono",monospace;font-size:11px;flex-shrink:0;color:#5a6a5a}',
    '.cl-modal-elem-name{font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}',
    '.cl-modal-elem-type{font-family:"DM Mono",monospace;font-size:9px;color:#8a8a7a}',
    '.cl-modal-footer{display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid #e8e4d8}',
  ].join('\n');
  document.head.appendChild(style);

  // ══════════════════════════════════════════════
  // DOM DATA READERS
  // ══════════════════════════════════════════════

  // ── Article Status hash → label mapping ──
  // HC-CL-004: Webflow Option field hashes for "Item Availability Status"
  var ARTICLE_STATUS_MAP = {
    '0d3cc821244f5a9417a0ed9d2feab959': 'draft',
    'c3dca0db4fa5e97cb71335bd0f28c667': 'live',
  };
  function mapArticleStatus(hash) {
    return ARTICLE_STATUS_MAP[hash] || hash.toLowerCase() || 'draft';
  }

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
        status: mapArticleStatus((d.articleStatus || '').trim()),
        customerId: (d.articleCustomerId || d.customerId || '').trim() || null,
        customerName: (d.articleCustomerName || d.customerName || '').trim() || null,
        productId: (d.categoryId || '').trim() || null,  // Product Library Item ID (from data-category-id)
        categoryId: (d.categoryId || '').trim() || null,
        mnlsId: (d.mnlsId || '').trim() || null,         // MNLS Item ID (from data-mnls-id)
        mnlsName: (d.mnlsName || '').trim() || null,     // MNLS label e.g. "Feature Article" (from data-mnls-name)
        productName: (d.type || d.productName || '').trim() || null,
        mnlsGroup: (d.mnlsName || d.articleCategory || d.group || '').trim(),  // prefer mnlsName
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
  // Only includes PubPlans with planningStatus = "In Progress"
  function readPubplans() {
    var seen = {};
    var out = [];
    var items = document.querySelectorAll('.pubplan-slot-wrapper[data-pubplan-id]');
    items.forEach(function (el) {
      var id = (el.dataset.pubplanId || '').trim();
      var name = (el.dataset.pubplanName || '').trim();
      var date = (el.dataset.pubplanDate || '').trim();
      var status = (el.dataset.planningStatus || '').trim();
      if (!id || seen[id]) return;
      seen[id] = true;
      out.push({
        id: id,
        name: name || 'Issue ' + id.slice(-3),
        date: date,
        label: name + (date ? ' \u2014 ' + date : ''),
        planningStatus: status,
      });
    });
    // Sort newest first by name (WLN-110 > WLN-109)
    out.sort(function (a, b) { return b.name.localeCompare(a.name); });
    return out;
  }

  // ── Build article→slot assignment lookup from DOM ──
  // Scans all slot wrappers for articleId, returns map: articleId → {pubplanName, slotCode}
  function buildAssignmentMap() {
    var map = {};
    var items = document.querySelectorAll('.pubplan-slot-wrapper[data-pubplan-id]');
    items.forEach(function (el) {
      var d = el.dataset;
      var articleId = (d.articleId || '').trim();
      if (!articleId) return;
      var code = (d.slotCode || '').trim();
      // Skip category slots
      if (code.indexOf('cat') !== -1) return;
      map[articleId] = {
        pubplanId: (d.pubplanId || '').trim(),
        pubplanName: (d.pubplanName || '').trim(),
        pubplanDate: (d.pubplanDate || '').trim(),
        slotCode: code.toUpperCase(),
      };
    });
    return map;
  }

  // ── Read content slots for a given section + pubplan from DOM ──
  // Returns array of {code, articleId, articleTitle, catId, catLabel, customerId, customerName}
  // Excludes category slots (those containing "cat")
  function readContentSlots(sectionCode, pubplanId) {
    var sc = sectionCode.toLowerCase();
    var slots = [];
    var items = document.querySelectorAll('.pubplan-slot-wrapper[data-pubplan-id="' + pubplanId + '"]');
    items.forEach(function (el) {
      var d = el.dataset;
      if ((d.sectionCode || '').toLowerCase() !== sc) return;
      var code = (d.slotCode || '').toLowerCase();
      // Skip category slots
      if (code.indexOf('cat') !== -1) return;
      slots.push({
        code: code,
        label: code.toUpperCase().replace('-', '-'), // fa-1 → FA-1 display
        articleId: (d.articleId || '').trim() || null,
        articleTitle: (d.articleTitle || '').trim() || null,
        catId: (d.catId || '').trim() || null,
        catLabel: (d.catLabel || '').trim() || null,
        customerId: (d.customerId || '').trim() || null,
        customerName: (d.customerName || '').trim() || null,
        sectionId: (d.sectionId || '').trim() || null,
        titleadminId: (d.titleadminId || '').trim() || null,
      });
    });
    // Sort numerically
    slots.sort(function (a, b) {
      var numA = parseInt(a.code.split('-')[1], 10) || 0;
      var numB = parseInt(b.code.split('-')[1], 10) || 0;
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
  var ASSIGNMENT_MAP = {}; // articleId → {pubplanName, slotCode, pubplanId}

  var S = {
    mainTab: 'articles',   // articles | ads
    subTab: 'all',         // all | FA | TS | etc.
    contentStatus: 'all',  // all | draft | live
    assignStatus: 'available', // all | assigned | available
    sortBy: 'name',        // name | customer | date
    editingId: null,       // PubPlan assignment expand panel
    edit: {},              // { pubplan: '', slot: '' }
    viewingId: null,       // Article detail modal
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

  // getAssignedSlots removed — replaced by readContentSlots() which reads
  // slot occupancy directly from the DOM (articleId on each slot wrapper)

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

    // Look up webhook URL by section code from TA_CONFIG.pubplanWebhooks
    var mnlsForWebhook = findMnlsForItem(item);
    var sectionCode = mnlsForWebhook ? mnlsForWebhook.abbr.toLowerCase() : '';
    var webhooks = (window.TA_CONFIG && window.TA_CONFIG.pubplanWebhooks) || {};
    var webhookUrl = webhooks[sectionCode] || '';
    if (!webhookUrl) {
      console.error('[CONTENT-LIBRARY] No webhook for section "' + sectionCode + '" in TA_CONFIG.pubplanWebhooks');
      return;
    }

    // Read slot wrapper data for the selected slot
    var slotData = null;
    if (S.edit.pubplan && S.edit.slot) {
      var mnls = findMnlsForItem(item);
      var sc = mnls ? mnls.abbr.toLowerCase() : '';
      var contentSlots = sc ? readContentSlots(sc, S.edit.pubplan) : [];
      slotData = contentSlots.find(function (s) { return s.code === S.edit.slot; });
    }

    // Build payload — same hidden-* field names as PubPlan tile UI
    var slotLabel = (S.edit.slot || '').toUpperCase();
    var sectionCodeVal = slotData ? slotData.code.split('-')[0].toUpperCase() : sectionCode.toUpperCase();
    var params = new URLSearchParams();
    params.set('hidden-pubplan-id', S.edit.pubplan || '');
    params.set('hidden-slot-label', slotLabel);
    params.set('hidden-titleadmin-id', (slotData && slotData.titleadminId) || CFG.taItemId || '');
    params.set('hidden-section-code', sectionCodeVal);
    params.set('hidden-article-id', item.id || '');
    params.set('hidden-article-name', item.name || '');
    params.set('hidden-product-id', item.categoryId || '');
    params.set('hidden-category-id', item.categoryId || (slotData && slotData.catId) || '');
    params.set('hidden-category-name', (item.productName || (slotData && slotData.catLabel) || ''));
    var mnlsSection = findMnlsForItem(item);
    params.set('hidden-category-group', item.mnlsName || (mnlsSection ? mnlsSection.label : '') || '');
    params.set('hidden-customer-id', item.customerId || '');
    params.set('hidden-customer-name', item.customerName || '');
    params.set('hidden-source', 'content-library');

    console.log('[CONTENT-LIBRARY] Submitting:', Object.fromEntries(params));

    // Show saving state
    S.edit.saving = true;
    render();

    // Fire webhook
    fetch(webhookUrl + '?' + params.toString())
      .then(function (resp) {
        if (resp.ok) {
          console.log('[CONTENT-LIBRARY] \u2705 Assigned', item.name, '\u2192', slotLabel);
          // Reload page — CMS is the source of truth, not local state
          window.location.reload();
        } else {
          console.error('[CONTENT-LIBRARY] \u274C Webhook failed:', resp.status, resp.statusText);
          S.edit.saving = false;
          S.edit.error = 'Failed (' + resp.status + ')';
          render();
        }
      })
      .catch(function (err) {
        // CORS error or network failure — fall back to no-cors retry
        console.warn('[CONTENT-LIBRARY] CORS blocked, retrying no-cors:', err.message);
        fetch(webhookUrl + '?' + params.toString(), { mode: 'no-cors' })
          .then(function () {
            console.log('[CONTENT-LIBRARY] \u2705 Sent (no-cors) for', item.name, '\u2192', slotLabel);
            // Reload page — CMS is the source of truth
            window.location.reload();
          })
          .catch(function (err2) {
            console.error('[CONTENT-LIBRARY] \u274C Webhook error:', err2);
            S.edit.saving = false;
            S.edit.error = 'Network error';
            render();
          });
      });
  }

  function setEditField(key, val) {
    S.edit[key] = val;
    if (key === 'pubplan') S.edit.slot = '';
    render();
  }

  function openView(id) {
    S.viewingId = id;
    render();
  }

  function closeView() {
    S.viewingId = null;
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
  window._clOpenView = openView;
  window._clCloseView = closeView;

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
    h += '<div><h3>Content Library</h3></div>';
    h += '</div><span class="cm-badge">v1.0.21</span></div>';

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

    // Content + Assignment + Sort — same row
    h += '<span class="cl-sep"></span><span class="cl-toolbar-label">Content:</span>';
    h += '<button class="cl-pill ' + (S.contentStatus === 'all' ? 'on' : '') + '" onclick="_clSetCS(\'all\')">All</button>';
    h += '<button class="cl-pill ' + (S.contentStatus === 'draft' ? 'on' : '') + '" onclick="_clSetCS(\'draft\')">Draft</button>';
    h += '<button class="cl-pill ' + (S.contentStatus === 'live' ? 'on' : '') + '" onclick="_clSetCS(\'live\')">Live</button>';
    h += '<span class="cl-sep"></span><span class="cl-toolbar-label">Assignment:</span>';
    h += '<button class="cl-pill ' + (S.assignStatus === 'all' ? 'on' : '') + '" onclick="_clSetAS(\'all\')">All</button>';
    h += '<button class="cl-pill ' + (S.assignStatus === 'assigned' ? 'on' : '') + '" onclick="_clSetAS(\'assigned\')">Assigned</button>';
    h += '<button class="cl-pill ' + (S.assignStatus === 'available' ? 'on' : '') + '" onclick="_clSetAS(\'available\')">Available</button>';
    h += '<span style="flex:1"></span><span class="cl-toolbar-label">Sort:</span>';
    h += '<select class="cl-sort" onchange="_clSetSort(this.value)">';
    h += '<option value="name"' + (S.sortBy === 'name' ? ' selected' : '') + '>Title A\u2013Z</option>';
    h += '<option value="customer"' + (S.sortBy === 'customer' ? ' selected' : '') + '>Customer A\u2013Z</option>';
    h += '<option value="date"' + (S.sortBy === 'date' ? ' selected' : '') + '>Newest first</option>';
    h += '</select>';
    h += '</div>';

    // ── Column headers ──
    h += '<div class="cl-thead">';
    h += '<div class="cl-th" style="padding-left:28px">Title</div>';
    h += '<div class="cl-th">Customer</div>';
    h += '<div class="cl-th">Assignment <span class="cl-th-sub">Newsletter / Section / Slot</span></div>';
    h += '<div class="cl-th"></div>';
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
        var dotClass = item.status === 'live' ? 'cl-dot-live' : 'cl-dot-draft';

        h += '<div class="cl-card ' + (isEd ? 'editing' : '') + '">';
        h += '<div class="cl-card-main" onclick="' + (isEd ? '' : '_clStartEdit(\'' + item.id + '\')') + '">';

        // Col 1: Dot + Title
        h += '<div class="cl-title-cell"><span class="cl-dot ' + dotClass + '"></span><span class="cl-title">' + esc(item.name) + '</span></div>';

        // Col 2: Customer
        h += '<div class="cl-cell">';
        if (item.customerName) {
          h += '<span class="cl-cust cl-cust-name">' + esc(item.customerName) + '</span>';
        } else {
          h += '<span class="cl-cust cl-cust-none">-</span>';
        }
        h += '</div>';

        // Col 3: Assignment
        h += '<div class="cl-cell cl-assign">';
        if (item.pubplanName && item.slot) {
          var assignPp = PUBPLANS.find(function (p) { return p.id === item.pubplanId; });
          var assignDate = assignPp ? assignPp.date : '';
          h += '<div class="cl-assign-issue">' + esc(item.pubplanName) + (assignDate ? ' &nbsp;|&nbsp; ' + esc(assignDate) : '') + ' &nbsp;|&nbsp; <span class="cl-assign-slot">' + esc(item.slot) + '</span></div>';
          var mnlsLabel = item.mnlsName || (mnls ? mnls.label : '');
          if (mnlsLabel) h += '<div class="cl-assign-mnls">' + esc(mnlsLabel) + '</div>';
        } else {
          h += '<span class="cl-assign-avail">available</span>';
        }
        h += '</div>';

        // Col 4: Action buttons
        h += '<div class="cl-cell" style="display:flex;gap:4px">';
        if (item.collection === 'articles' && !isAssigned) {
          h += '<button class="cl-btn cl-btn-assign" onclick="event.stopPropagation();_clStartEdit(\'' + item.id + '\')">Assign</button>';
        }
        h += '<button class="cl-btn" onclick="event.stopPropagation();_clOpenView(\'' + item.id + '\')">View</button>';
        h += '</div>';

        h += '</div>'; // end cl-card-main

        // ── Expand panel (PubPlan assignment) — articles only, available only ──
        if (isEd) {
          var es = S.edit;
          var ppCh = es.pubplan !== (item.pubplanId || '');
          var slCh = es.slot !== (item.slot || '');
          var anyCh = ppCh || slCh;

          // Get content slots for selected PubPlan + section
          var mnlsAbbr = mnls ? mnls.abbr : '';
          var sectionCode = mnlsAbbr.toLowerCase();
          var contentSlots = (es.pubplan && sectionCode) ? readContentSlots(sectionCode, es.pubplan) : [];

          h += '<div class="cl-expand">';
          h += '<div class="cl-expand-hdr"><span class="cl-expand-title">PubPlan Assignment</span><button class="cl-cancel" onclick="_clCancelEdit()">\u2715 cancel</button></div>';

          h += '<div class="cl-form-row">';
          // PubPlan dropdown — show if In Progress OR future date
          h += '<div class="cl-ff"><label class="cl-fl">PubPlan (Issue)</label>';
          h += '<select class="cl-sel ' + (ppCh ? 'changed' : '') + '" onchange="_clSetEd(\'pubplan\',this.value)">';
          h += '<option value="">Select issue\u2026</option>';
          var today = new Date().toISOString().slice(0, 10);
          PUBPLANS.forEach(function (pp) {
            // Show if: In Progress hash, OR no status attribute, OR future date
            var isInProgress = !pp.planningStatus || pp.planningStatus === 'cbad0e93deea996b0769d71d808d59c5';
            var isFutureDate = pp.date && new Date(pp.date) >= new Date(today);
            if (!isInProgress && !isFutureDate) return;
            h += '<option value="' + esc(pp.id) + '"' + (es.pubplan === pp.id ? ' selected' : '') + '>' + esc(pp.label) + '</option>';
          });
          h += '</select></div>';

          // Slot dropdown — shows open/taken status
          h += '<div class="cl-ff"><label class="cl-fl">Slot</label>';
          h += '<select class="cl-sel ' + (slCh ? 'changed' : '') + '"' + (es.pubplan ? '' : ' disabled') + ' onchange="_clSetEd(\'slot\',this.value)">';
          h += '<option value="">Select slot\u2026</option>';
          if (es.pubplan && contentSlots.length) {
            contentSlots.forEach(function (slot) {
              var isOpen = !slot.articleId;
              var isSelf = slot.articleId === item.id;
              var display = slot.code;
              if (isSelf) {
                display += ' (current)';
              } else if (!isOpen) {
                display += ' \u2014 ' + (slot.articleTitle || 'taken');
              }
              var selectable = isOpen || isSelf;
              h += '<option value="' + esc(slot.code) + '"' +
                (es.slot === slot.code ? ' selected' : '') +
                (!selectable ? ' disabled style="color:#a0a090"' : '') +
                '>' + esc(display) + '</option>';
            });
          }
          h += '</select></div>';
          h += '</div>';

          // Submit row
          h += '<div class="cl-submit-row">';
          if (es.saving) {
            h += '<span class="cl-save-info" style="color:#1a3a3a;font-weight:500">Assigning\u2026</span>';
            h += '<button class="cl-save-btn" disabled>Assigning\u2026</button>';
          } else if (es.error) {
            h += '<span class="cl-save-info" style="color:#c0392b">' + esc(es.error) + ' \u2014 try again</span>';
            h += '<button class="cl-save-btn"' + (anyCh && es.pubplan && es.slot ? '' : ' disabled') + ' onclick="_clSaveEdit()">Retry</button>';
          } else {
            if (anyCh) h += '<span class="cl-save-info">Unsaved changes</span>';
            h += '<button class="cl-save-btn"' + (anyCh && es.pubplan && es.slot ? '' : ' disabled') + ' onclick="_clSaveEdit()">Assign</button>';
          }
          h += '</div>';
          h += '</div>';
        }

        h += '</div>';
      });
      h += '</div>';
    }

    mount.innerHTML = h;

    // ── View Modal — rendered outside mount to escape stacking context ──
    var existingModal = document.getElementById('cl-modal-root');
    if (existingModal) existingModal.remove();

    if (S.viewingId) {
      var vItem = ALL_ITEMS.find(function (i) { return i.id === S.viewingId; });
      if (vItem) {
        var vMnls = findMnlsForItem(vItem);
        var vAssigned = vItem.collection === 'articles' ? !!vItem.newsletterId : (vItem.pubplanId && vItem.slot);
        var vDotClass = vItem.status === 'live' ? 'cl-dot-live' : 'cl-dot-draft';

        var mh = '<div id="cl-modal-root" class="cl-modal-overlay" onclick="_clCloseView()">';
        mh += '<div class="cl-modal" onclick="event.stopPropagation()">';
        mh += '<div class="cl-modal-bar"></div>';
        mh += '<div class="cl-modal-body">';

        mh += '<div class="cl-modal-hdr"><div>';
        mh += '<div class="cl-modal-title">' + esc(vItem.name) + '</div>';
        mh += '<div class="cl-modal-meta">';
        mh += '<span style="display:inline-flex;align-items:center;gap:4px"><span class="cl-dot ' + vDotClass + '"></span> ' + esc(vItem.status) + '</span>';
        if (vMnls) mh += '<span>' + esc(vMnls.abbr) + '</span>';
        if (vItem.productName) mh += '<span>' + esc(vItem.productName) + '</span>';
        mh += '</div></div>';
        mh += '<button class="cl-modal-close" onclick="_clCloseView()">×</button>';
        mh += '</div>';

        mh += '<div class="cl-modal-grid">';
        mh += '<div><div class="cl-modal-label">Customer</div><div class="cl-modal-val">' + (vItem.customerName ? esc(vItem.customerName) : '<span style="color:#c4c0b0">-</span>') + '</div></div>';
        mh += '<div><div class="cl-modal-label">Assignment</div><div style="font-family:\'DM Mono\',monospace;font-size:10px;font-weight:500">';
        if (vItem.pubplanName && vItem.slot) {
          mh += esc(vItem.pubplanName) + ' | ' + esc(vItem.slot);
        } else {
          mh += '<span style="color:#c4a35a">available</span>';
        }
        mh += '</div></div>';
        mh += '<div><div class="cl-modal-label">Section</div><div class="cl-modal-val">' + (vItem.mnlsName || (vMnls ? esc(vMnls.label) : '-')) + '</div></div>';
        mh += '<div><div class="cl-modal-label">Revenue type</div><div style="font-family:\'DM Mono\',monospace;font-size:10px">' + (vItem.productName ? esc(vItem.productName) : '-') + '</div></div>';
        mh += '</div>';

        mh += '<div class="cl-modal-section">Elements</div>';
        if (vItem.assetCount > 0) {
          mh += '<div style="font-family:\'DM Mono\',monospace;font-size:10px;color:#8a8a7a;margin-bottom:8px">' + vItem.assetCount + ' file' + (vItem.assetCount > 1 ? 's' : '') + ' attached</div>';
        } else {
          mh += '<div style="font-family:\'DM Mono\',monospace;font-size:10px;color:#a0a090;margin-bottom:8px">No elements attached</div>';
        }

        mh += '<div class="cl-modal-footer">';
        mh += '<button class="cl-modal-close" onclick="_clCloseView()">×</button>';
        mh += '<div style="display:flex;gap:8px;align-items:center">';
        if (vItem.assetCount > 0) mh += '<span style="font-family:\'DM Mono\',monospace;font-size:9px;color:#a0a090">' + vItem.assetCount + ' element' + (vItem.assetCount > 1 ? 's' : '') + '</span>';
        mh += '</div></div>';

        mh += '</div></div></div>';

        var modalDiv = document.createElement('div');
        modalDiv.innerHTML = mh;
        document.body.appendChild(modalDiv.firstChild);
      }
    }
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
    ASSIGNMENT_MAP = buildAssignmentMap();

    var articles = readArticles();
    var ads = readAds();
    ALL_ITEMS = articles.concat(ads);

    // Deferred resolution: set mnlsAbbr and collection from product data
    // Also enrich articles with PubPlan assignment from slot wrappers
    ALL_ITEMS.forEach(function (item) {
      if (item.productId) {
        var prod = PRODUCTS.find(function (p) { return p.id === item.productId; });
        if (prod) {
          if (!item.mnlsAbbr) item.mnlsAbbr = prod.mnlsId;
          if (!item.mnlsGroup) item.mnlsGroup = prod.group;
          item.collection = prod.collection;
        }
      }
      // Enrich with assignment data from slot wrappers
      var assign = ASSIGNMENT_MAP[item.id];
      if (assign) {
        item.pubplanId = assign.pubplanId;
        item.pubplanName = assign.pubplanName;
        item.slot = assign.slotCode;
      }
    });

    console.log('[CONTENT-LIBRARY] Init:', {
      mnlsSections: Object.keys(MNLS_SECTIONS).length,
      products: PRODUCTS.length,
      customers: CUSTOMERS.length,
      articles: articles.length,
      ads: ads.length,
      pubplans: PUBPLANS.length,
      assignedArticles: Object.keys(ASSIGNMENT_MAP).length,
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
