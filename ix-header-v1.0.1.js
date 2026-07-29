/* ============================================================
   ix-header-v1.0.1.js
   INBXIFY — Canonical T-A panel header + tab rows

   ONE code path for the three header rows on every T-A tab.
   Before this file, each tab hand-wrote its own header markup as
   a template string, so a header change meant editing 9+ files.
   Now each tab emits one call and this file owns the markup.

   ── ROW MODEL ──
     Row 1  IxHeader.render()  icon + title + subtitle + actions
     Row 2  IxTabs.l1()        channel tabs (was .std-subtabs)
     Row 3  IxTabs.l2()        pill sub-tabs (was .bdl-l1)

   ── USAGE ──
     h += IxHeader.render({
       icon:     '\uD83D\uDCDA',
       title:    'Asset Library',
       actions:  ['<button class="ix-btn ix-btn--ghost">Refresh</button>']
     });

     h += IxTabs.l1([
       { key:'articles', label:'Articles' },
       { key:'ads',      label:'Ads' }
     ], 'articles', 'data-cl-tab');

     h += IxTabs.l2([
       { key:'loose',   label:'Loose files', dot:true },
       { key:'bundles', label:'Bundles' }
     ], 'loose', 'data-bdl-l1');

   ── SUBTITLE ──
   If `subtitle` is omitted, the live TITLE name is used (e.g.
   "Wyckoff Living NOW"). That lookup lives HERE so it's solved
   once for all tabs instead of nine times. Pass an explicit
   string to override (e.g. Clients' "ADVERTISERS · CONTRIBUTORS
   · SPONSORS"). Pass '' for no subtitle line.

   Source is the already-Webflow-bound hidden node PubPlan reads.
   Code Embeds cannot resolve {{wf}} tokens themselves — do NOT
   replace this with a direct {{wf}} interpolation.

   ── COMPANION ──
   ix-header-v1.0.0.css. Load BEFORE the tab modules that call
   these functions; load the CSS after title-admin-page-design.
   ============================================================ */

(function () {
  'use strict';

  var VERSION = '1.0.1';

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Live TITLE name — one lookup for every tab ──
  function titleName() {
    var el = document.querySelector('.pubplan-slot-wrapper[data-titleadmin-name]');
    var n = el ? (el.dataset.titleadminName || '') : '';
    return n;
  }

  // ── ROW 1 ──
  // opts: { icon, title, subtitle, actions:[htmlString], id }
  function renderHeader(opts) {
    opts = opts || {};
    var sub = (opts.subtitle === undefined) ? titleName() : opts.subtitle;
    var acts = opts.actions || [];
    if (typeof acts === 'string') acts = [acts];

    return '<div class="ix-hdr"' + (opts.id ? ' id="' + esc(opts.id) + '"' : '') + '>' +
        '<div class="ix-hdr-left">' +
          (opts.icon ? '<div class="ix-hdr-icon">' + opts.icon + '</div>' : '') +
          '<div>' +
            '<h3>' + esc(opts.title || '') + '</h3>' +
            (sub ? '<div class="ix-hdr-sub">' + esc(sub) + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="ix-hdr-right">' + acts.join('') + '</div>' +
      '</div>';
  }

  // ── ROW 2 — channel tabs ──
  // tabs: [{ key, label, dot }] · attr: data-attribute carrying the key
  function renderL1(tabs, activeKey, attr) {
    attr = attr || 'data-ix-l1';
    var out = '<div class="ix-tabs-l1">';
    (tabs || []).forEach(function (t) {
      var on = (t.key === activeKey);
      out += '<button class="ix-btn ix-btn--tab' + (on ? ' is-active' : '') + '"' +
             ' ' + attr + '="' + esc(t.key) + '"' +
             (on ? ' data-active="true"' : '') + '>' +
             esc(t.label) +
             (t.dot ? '<span class="ix-tab-dot"></span>' : '') +
             '</button>';
    });
    return out + '</div>';
  }

  // ── ROW 3 — pill sub-tabs ──
  // trailing: optional html pinned right (e.g. a refresh button)
  function renderL2(tabs, activeKey, attr, trailing) {
    attr = attr || 'data-ix-l2';
    var out = '<div class="ix-tabs-l2">';
    (tabs || []).forEach(function (t) {
      var on = (t.key === activeKey);
      out += '<button class="ix-tab-pill' + (on ? ' is-active' : '') + '"' +
             ' ' + attr + '="' + esc(t.key) + '">' +
             esc(t.label) +
             (t.dot ? '<span class="ix-tab-dot"></span>' : '') +
             '</button>';
    });
    if (trailing) out += '<div class="ix-tabs-l2-end">' + trailing + '</div>';
    return out + '</div>';
  }

  // ── CANONICAL REFRESH CONTROL ──
  // The one refresh button for every data/file surface. Do not
  // hand-roll another ("↻ Refresh" text buttons, bare glyphs,
  // etc.) — call this so size, border, spin and a11y stay
  // identical everywhere.
  //   opts.onclick  inline handler string
  //   opts.attr     extra attributes, e.g. 'data-cl-refresh'
  //   opts.spinning renders in the loading state
  function refreshBtn(opts) {
    opts = opts || {};
    return '<button class="ix-btn ix-btn--ghost ix-btn--icon-lg ix-refresh-icon' +
      (opts.spinning ? ' is-spinning' : '') + '"' +
      (opts.attr ? ' ' + opts.attr : '') +
      (opts.onclick ? ' onclick="' + opts.onclick + '"' : '') +
      (opts.spinning ? ' disabled' : '') +
      ' title="Refresh" aria-label="Refresh">\u21BB</button>';
  }

  window.IxHeader = {
    version:   VERSION,
    render:     renderHeader,
    refreshBtn: refreshBtn,
    titleName: titleName,
    esc:       esc
  };
  window.IxTabs = {
    version: VERSION,
    l1:      renderL1,
    l2:      renderL2
  };

  try {
    console.log('[IxHeader] v' + VERSION +
      ' loaded — IxHeader.render(), IxHeader.refreshBtn(), IxTabs.l1(), IxTabs.l2() available');
  } catch (e) {}
})();
