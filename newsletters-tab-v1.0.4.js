// newsletters-tab-v1.0.4.js
/* ============================================================
   INBXIFY — Newsletters Tab
   newsletters-tab-v1.0.4.js
   Mounts into: #newsletters-mount on the TITLES-ADMIN Template

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
   CSS: newsletters-tab-v1.0.2.css
   HARDCODING: HC-P-LS2-1 the status words map (STATUS_MAP below);
               NL_URL_PREFIX '/nl/' (the NEWSLETTERS Template path, site-wide).
   ============================================================ */

(function () {
  'use strict';

  var VERSION = '1.0.4';
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
      companions: 'newsletters-tab-v1.0.2.css · source: .newsletter-source (hidden list on the TITLES-ADMIN Template)'
    }) : '';
    var countChip = '<span class="nlb-count">' + count + '</span>';
    return (window.IxHeader && IxHeader.render)
      ? IxHeader.render({ icon: '✉️', title: 'Newsletters', actions: [info, countChip].filter(Boolean) })
      : '<div class="ix-hdr"><div class="ix-hdr-left"><div class="ix-hdr-icon">✉️</div>' +
        '<div><h3>Newsletters</h3></div></div><div class="ix-hdr-right">' + info + countChip + '</div></div>';
  }

  function row(nl) {
    var p = pillFor(nl.status);
    var href = nl.slug ? NL_URL_PREFIX + encodeURIComponent(nl.slug) : '';
    return '<tr class="nlb-row" data-nl-id="' + esc(nl.id) + '">' +
      '<td class="nlb-c-no">' + esc(nl.issueNo || '—') + '</td>' +
      '<td class="nlb-c-name" title="' + esc(nl.name) + '">' + esc(nl.name || nl.slug || '—') + '</td>' +
      '<td class="nlb-c-date">' + esc(nl.date || '—') + '</td>' +
      '<td class="nlb-c-status"><span class="nlb-pill ' + p.cls + '">' + esc(p.label) + '</span></td>' +
      '<td class="nlb-c-sends">' + esc(sendsText(nl.sends)) + '</td>' +
      '<td class="nlb-c-open">' + (href
        ? '<a class="nlb-open" href="' + esc(href) + '" target="_blank" rel="noopener">Open ↗</a>'
        : '<span class="nlb-open nlb-open--none">No page</span>') + '</td>' +
    '</tr>';
  }

  function render() {
    var mount = document.querySelector(MOUNT_SEL);
    if (!mount) return;
    var list = readNewsletters();

    var root = mount.querySelector('.nlb-root');
    if (!root) { root = document.createElement('div'); root.className = 'nlb-root'; mount.appendChild(root); }

    if (!list.length) {
      root.innerHTML = header(0) + '<div class="nlb-empty">No newsletters yet for this title.</div>';
      return;
    }

    var html = header(list.length) +
      '<div class="nlb-scroll"><table class="nlb-table">' +
        '<colgroup><col class="nlb-w-no"><col class="nlb-w-name"><col class="nlb-w-date">' +
        '<col class="nlb-w-status"><col class="nlb-w-sends"><col class="nlb-w-open"></colgroup>' +
        '<thead><tr>' +
          '<th class="nlb-c-no">No.</th><th class="nlb-c-name">Newsletter</th><th class="nlb-c-date">Date</th>' +
          '<th class="nlb-c-status">Status</th><th class="nlb-c-sends">Sends</th><th class="nlb-c-open"></th>' +
        '</tr></thead><tbody>';
    for (var i = 0; i < list.length; i++) html += row(list[i]);
    html += '</tbody></table></div>';
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
