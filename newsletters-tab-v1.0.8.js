// newsletters-tab-v1.0.8.js
/* ============================================================
   INBXIFY — Newsletters Tab
   newsletters-tab-v1.0.8.js
   Mounts into: #newsletters-mount on the TITLES-ADMIN Template

   v1.0.8 (16 Nov 2026, Legacy Sunset S2): THE ROOT CARRIES ix-own.
     Why v1.0.6 and v1.0.7 still showed white blocks: the T-A card's
     wildcard (title-admin-page-design v1.4.41, `section.publisher-wrapper *`)
     paints every element white with !important, and it outranks the
     row-cell rules. The platform's way out is class `ix-own` on the
     surface root (standing rule since v1.4.41; issues-tab does the
     same). The root is now `nlb-root ix-own`, so the wildcard skips
     the whole table and the row colours show as written. The cell
     overrides from v1.0.7 are kept as a second guard. Nothing else
     changed.

   v1.0.7 (16 Nov 2026, Legacy Sunset S2): ZEBRA ACROSS THE WHOLE ROW.
     v1.0.6 live: the tint showed only as strips above and below the
     text, because a site rule paints each cell (and the empty status
     cell) white. Every cell in a row (and in the header) is now transparent
     (!important), so the row colour shows edge to edge. The row's
     padding moves into the cells, so there is no strip at all. Nothing
     else changed.

   v1.0.6 (16 Nov 2026, Legacy Sunset S2): ZEBRA YOU CAN SEE.
     Jeff, live check: the rows did not alternate. The odd-row tint
     (#fbfaf6) was too close to white to see, and a site rule could win.
     Every second row is now #f6f3ea, hover #efe9da, both !important so
     the page's styles cannot flatten them. Nothing else changed.

   v1.0.5 (16 Nov 2026, Legacy Sunset S2): THE T-A TABLE STANDARD.
     Jeff, first live look at v1.0.4: "format this to our standard". The
     v1.0.4 stylesheet never took hold on the page (plain table, serif links).
     The list now uses the Asset Library's table look (content-library):
     beige header row with a gold 2px rule, DM Mono caps labels, white rows
     with zebra and a hover tint, fixed-width DM Mono status pills, and Open
     as the shared ix-btn secondary button. Built from grid rows, not a
     <table>, and its CSS is injected by this file (style#nlb-style), as the
     Asset Library does, so no page rule or missing head line can undo it.
     The page grows with the list; no box scrolls inside the page (design
     rule, 12 Nov). newsletters-tab-v1.0.2.css is no longer needed.

   v1.0.4 (16 Nov 2026, Legacy Sunset S2): A BARE LIST.
     The picker collections are gone, and with them every value the
     old cards summarised (four FA and four TS titles, twelve banners,
     The Find, four events). Jeff ruled (16 Nov) that the tab becomes a
     simple list: one row per newsletter with the facts that matter
     and a link to the newsletter's own page.

     Row:  No. · Newsletter · Date · Status · Sends · Open
       - Latest first (by date, then by issue number).
       - Open opens /nl/<slug> in a new tab, so the T-A page stays put.
       - Fixed column widths; long names are cut with an ellipsis.
       - The ⓘ badge (standing rule) replaces nothing: the tab had none.

   DATA SOURCE (unchanged): the hidden list .newsletter-source on the
   page. Each item's div carries:
     data-nl-id, data-nl-slug, data-nl-issue-no, data-nl-date,
     data-nl-status, data-nl-name, data-nl-send-volume
   The FA / TS / BA / TXA / EV attributes are no longer read; they were
   removed from newsletter-wrapper in the Designer the same day.

   Nothing writes. No Make scenario, no Worker.
   CSS: injected by this file (style#nlb-style). No separate stylesheet.
   HARDCODING: HC-P-LS2-1 the status words map (STATUS_MAP below);
               NL_URL_PREFIX '/nl/' (the NEWSLETTERS Template path, site-wide).
   ============================================================ */

(function () {
  'use strict';

  var VERSION = '1.0.8';
  var MOUNT_SEL = '#newsletters-mount';
  var SOURCE_SEL = '.newsletter-source .w-dyn-items';
  var NL_URL_PREFIX = '/nl/';   // NEWSLETTERS Template path (site-level, not tenant-specific)

  /* ── Status words (HC-P-LS2-1) ── */
  var STATUS_MAP = {
    'draft':                   { label: 'Draft',      cls: 'nlb-pill--draft' },
    'building':                { label: 'Building',   cls: 'nlb-pill--building' },
    'in assembly':             { label: 'Building',   cls: 'nlb-pill--building' },
    'ready to publish':        { label: 'Ready',      cls: 'nlb-pill--ready' },
    'rtp':                     { label: 'Ready',      cls: 'nlb-pill--ready' },
    'publish next as current': { label: 'Goes live',  cls: 'nlb-pill--ready' },
    'live':                    { label: 'Live',       cls: 'nlb-pill--live' },
    'current':                 { label: 'Live',       cls: 'nlb-pill--live' },
    'sent':                    { label: 'Sent',       cls: 'nlb-pill--sent' },
    'published':               { label: 'Sent',       cls: 'nlb-pill--sent' }
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function attr(el, key) {
    var v = el.getAttribute(key);
    return (v && v.trim()) ? v.trim() : '';
  }

  function pillFor(status) {
    var key = (status || '').toLowerCase().trim();
    if (STATUS_MAP[key]) return STATUS_MAP[key];
    for (var k in STATUS_MAP) { if (key && key.indexOf(k) !== -1) return STATUS_MAP[k]; }
    return { label: status || '—', cls: 'nlb-pill--draft' };
  }

  function sendsText(v) {
    var n = parseInt(v, 10);
    if (!n) return '—';
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
  }

  /* ── Read the hidden list ── */
  function readNewsletters() {
    var box = document.querySelector(SOURCE_SEL);
    if (!box) return [];
    var items = box.querySelectorAll('.w-dyn-item');
    var out = [];
    for (var i = 0; i < items.length; i++) {
      var el = items[i].querySelector('div[data-nl-id]');
      if (!el) continue;
      var dateText = attr(el, 'data-nl-date');
      var t = Date.parse(dateText);
      out.push({
        id:      attr(el, 'data-nl-id'),
        slug:    attr(el, 'data-nl-slug'),
        issueNo: attr(el, 'data-nl-issue-no'),
        date:    dateText,
        time:    isNaN(t) ? 0 : t,
        status:  attr(el, 'data-nl-status'),
        name:    attr(el, 'data-nl-name'),
        sends:   attr(el, 'data-nl-send-volume')
      });
    }
    out.sort(function (a, b) {
      if (b.time !== a.time) return b.time - a.time;
      return (parseInt(b.issueNo, 10) || 0) - (parseInt(a.issueNo, 10) || 0);
    });
    return out;
  }

  /* ── Header (ix-header + the ⓘ badge) ── */
  function header(count) {
    var info = (window.IxInfo && typeof IxInfo.badge === 'function') ? IxInfo.badge({
      file: 'newsletters-tab-v' + VERSION + '.js', version: VERSION, title: 'Newsletters',
      blurb: 'Every newsletter of this title, latest first: its issue number, name, date, publishing status and send volume. ' +
             'Open shows the newsletter’s own page in a new tab.\n\n' +
             'The list reads the page’s hidden NEWSLETTERS list. It changes nothing.',
      scenarios: [],
      companions: 'styles inside this file · source: .newsletter-source (hidden list on the TITLES-ADMIN Template)'
    }) : '';
    var countChip = '<span class="nlb-count">' + count + '</span>';
    return (window.IxHeader && IxHeader.render)
      ? IxHeader.render({ icon: '✉️', title: 'Newsletters', actions: [info, countChip].filter(Boolean) })
      : '<div class="ix-hdr"><div class="ix-hdr-left"><div class="ix-hdr-icon">✉️</div>' +
        '<div><h3>Newsletters</h3></div></div><div class="ix-hdr-right">' + info + countChip + '</div></div>';
  }

  /* ── Styles (injected once; Asset Library table look) ── */
  var GRID = 'grid-template-columns:72px minmax(180px,1fr) 200px 132px 96px 112px';
  var CSS = [
    '.nlb-root{width:100%;padding:16px 0 32px}',
    '.nlb-count{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:24px;padding:0 9px;border-radius:12px;background:#f4f1ea;color:#1a3a3a;font-family:"DM Mono",monospace;font-size:11px;font-weight:600}',
    '.nlb-wrap{margin-top:14px;overflow-x:auto;overflow-y:visible}',
    '.nlb-head,.nlb-row{display:grid;' + GRID + ';min-width:792px;align-items:center}',
    '.nlb-head{background:#f4f1ea;border-bottom:2px solid #c4a35a;border-radius:7px 7px 0 0}',
    '.nlb-th{font-family:"DM Mono",monospace !important;font-size:10px !important;font-weight:600 !important;letter-spacing:.06em !important;text-transform:uppercase !important;color:#1a3a3a !important;padding:11px 12px;white-space:nowrap}',
    '.nlb-row{background:#fff !important;border-bottom:1px solid #efece1;padding:0 !important}',
    '.nlb-row > *{background:transparent !important;background-color:transparent !important;box-shadow:none !important;border:0 !important;padding-top:10px !important;padding-bottom:10px !important;margin:0 !important}',
    '.nlb-head > *{background:transparent !important;background-color:transparent !important}',
    '.nlb-row:nth-child(even){background:#f6f3ea !important}',
    '.nlb-row:hover{background:#efe9da !important}',
    '.nlb-td{padding:0 12px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:var(--ix-font-body,"DM Sans",sans-serif) !important;font-size:13.5px !important;line-height:1.3 !important;color:#1f2a2a !important}',
    '.nlb-td.nlb-no{font-family:"DM Mono",monospace !important;font-size:12px !important;color:#5a6a5a !important}',
    '.nlb-td.nlb-name{font-weight:600 !important;color:#1a3a3a !important}',
    '.nlb-td.nlb-date{color:#4f5a58 !important}',
    '.nlb-td.nlb-sends,.nlb-th.nlb-sends{text-align:right;font-variant-numeric:tabular-nums}',
    '.nlb-td.nlb-open,.nlb-th.nlb-open{text-align:right}',
    '.nlb-pill{display:inline-block;width:88px;text-align:center;font-family:"DM Mono",monospace !important;font-size:10px !important;font-weight:500;letter-spacing:.03em;padding:3px 0;border-radius:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.nlb-pill--draft{background:#eef0ee;color:#5a6a5a}',
    '.nlb-pill--building{background:#f3ecd8;color:#9a7b1e;border:1px solid #e0d3a8}',
    '.nlb-pill--ready{background:#e7eefb;color:#2b5d95}',
    '.nlb-pill--live{background:#1a3a3a;color:#fff}',
    '.nlb-pill--sent{background:#e2f1e9;color:#0f5c3f}',
    '.nlb-td .nlb-open-btn{display:inline-flex;align-items:center;justify-content:center;min-width:76px;height:28px;padding:0 12px !important;font-size:12px !important;line-height:1 !important;text-decoration:none !important;white-space:nowrap}',
    '.nlb-none{font-family:"DM Mono",monospace;font-size:10px;color:#8a8a7a}',
    '.nlb-empty{margin-top:14px;padding:28px;text-align:center;color:#8a8a7a;border:1.5px dashed #e8e4d8;border-radius:7px;font-family:var(--ix-font-body,"DM Sans",sans-serif)}'
  ].join('\n');
  function ensureStyle() {
    if (document.getElementById('nlb-style')) return;
    var s = document.createElement('style'); s.id = 'nlb-style'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function row(nl) {
    var p = pillFor(nl.status);
    var href = nl.slug ? NL_URL_PREFIX + encodeURIComponent(nl.slug) : '';
    return '<div class="nlb-row" data-nl-id="' + esc(nl.id) + '">' +
      '<div class="nlb-td nlb-no">' + esc(nl.issueNo || '—') + '</div>' +
      '<div class="nlb-td nlb-name" title="' + esc(nl.name) + '">' + esc(nl.name || nl.slug || '—') + '</div>' +
      '<div class="nlb-td nlb-date">' + esc(nl.date || '—') + '</div>' +
      '<div class="nlb-td nlb-status"><span class="nlb-pill ' + p.cls + '">' + esc(p.label) + '</span></div>' +
      '<div class="nlb-td nlb-sends">' + esc(sendsText(nl.sends)) + '</div>' +
      '<div class="nlb-td nlb-open">' + (href
        ? '<a class="ix-btn ix-btn--secondary nlb-open-btn" href="' + esc(href) + '" target="_blank" rel="noopener">Open ↗</a>'
        : '<span class="nlb-none">No page</span>') + '</div>' +
    '</div>';
  }

  function render() {
    var mount = document.querySelector(MOUNT_SEL);
    if (!mount) return;
    ensureStyle();
    var list = readNewsletters();

    var root = mount.querySelector('.nlb-root');
    if (!root) { root = document.createElement('div'); root.className = 'nlb-root ix-own'; /* v1.0.8 */ mount.appendChild(root); }

    if (!list.length) {
      root.innerHTML = header(0) + '<div class="nlb-empty">No newsletters yet for this title.</div>';
      return;
    }

    var html = header(list.length) + '<div class="nlb-wrap">' +
      '<div class="nlb-head">' +
        '<div class="nlb-th nlb-no">No.</div><div class="nlb-th nlb-name">Newsletter</div><div class="nlb-th nlb-date">Date</div>' +
        '<div class="nlb-th nlb-status">Status</div><div class="nlb-th nlb-sends">Sends</div><div class="nlb-th nlb-open"></div>' +
      '</div><div class="nlb-body">';
    for (var i = 0; i < list.length; i++) html += row(list[i]);
    html += '</div></div>';
    root.innerHTML = html;
  }

  function init() {
    // The CMS list is in the page HTML; a short wait lets Webflow finish its own scripts.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { setTimeout(render, 200); });
    } else {
      setTimeout(render, 200);
    }
  }

  window.NewslettersTab = { version: VERSION, render: render };
  console.log('[newsletters-tab] v' + VERSION + ' loaded (bare list)');
  init();
})();
