/* ============================================================
   ix-header-v1.0.2.js
   INBXIFY — Canonical T-A panel header + tab rows

   ONE code path for the three header rows on every T-A tab.
   Before this file, each tab hand-wrote its own header markup as
   a template string, so a header change meant editing 9+ files.
   Now each tab emits one call and this file owns the markup.

   ── ROW MODEL ──
     Row 1  IxHeader.render()  icon + title + subtitle + actions
     Row 2  IxTabs.l1()        channel tabs (was .std-subtabs)
                               + optional right-pinned slot (v1.0.2)
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
   ix-header-v1.0.4.css. Load BEFORE the tab modules that call
   these functions; load the CSS after title-admin-page-design.

   ── v1.0.2 — IxTabs.l1() GAINS A TRAILING SLOT ──
   l2() has taken a `trailing` argument since v1.0.0 and pins it
   right via .ix-tabs-l2-end. l1() did not, so a surface needing a
   control beside its tabs had to hand-write the strip. Five did,
   five differently, and Asset Library's went as far as disabling
   this file's own row-2 rule to make room. l1() now takes the same
   fourth argument and emits .ix-tabs-l1-end, adding
   .ix-tabs-l1--slotted so no existing strip shifts when this ships.

     h += IxTabs.l1(tabs, 'articles', 'data-cl-tab',
                    filterBtnHtml + searchHtml);

   Omit `trailing` and the output is byte-identical to v1.0.1.
   REQUIRES ix-header-v1.0.4.css for the slot rules.
   ============================================================ */

(function () {
  'use strict';

  var VERSION = '1.0.2';

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
  // trailing: optional html pinned right (search, filter toggle).
  //   Present  -> strip takes .ix-tabs-l1--slotted and the html is
  //               wrapped in .ix-tabs-l1-end.
  //   Absent   -> output is identical to v1.0.1. Nothing opts in by
  //               accident, so no shipped strip moves.
  function renderL1(tabs, activeKey, attr, trailing) {
    attr = attr || 'data-ix-l1';
    var out = '<div class="ix-tabs-l1' +
              (trailing ? ' ix-tabs-l1--slotted' : '') + '">';
    (tabs || []).forEach(function (t) {
      var on = (t.key === activeKey);
      out += '<button class="ix-btn ix-btn--tab' + (on ? ' is-active' : '') + '"' +
             ' ' + attr + '="' + esc(t.key) + '"' +
             (on ? ' data-active="true"' : '') + '>' +
             esc(t.label) +
             (t.dot ? '<span class="ix-tab-dot"></span>' : '') +
             '</button>';
    });
    if (trailing) out += '<div class="ix-tabs-l1-end">' + trailing + '</div>';
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

  // ── CANONICAL SEARCH CONTROL ──                      v1.0.2
  // The one search input for every list surface. Do not hand-roll
  // another — Asset Library's had a 10px radius against an 8px
  // token, a #e3dfd2 border against #DDD9C8, and a :focus rule that
  // deleted the border outright, leaving no keyboard focus ring.
  //   opts.placeholder  placeholder text
  //   opts.value        current query
  //   opts.oninput      inline handler string
  //   opts.attr         extra attributes, e.g. 'id="cl-search"'
  // Requires ix-form-controls-v1.0.1.css.
  function searchBox(opts) {
    opts = opts || {};
    var ico = '<svg class="ix-search-ico" viewBox="0 0 24 24" fill="none"' +
      ' stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
      ' aria-hidden="true"><circle cx="11" cy="11" r="7"></circle>' +
      '<path d="M20 20l-3.5-3.5"></path></svg>';
    return '<div class="ix-search">' + ico +
      '<input type="text" class="ix-search-input"' +
      (opts.attr ? ' ' + opts.attr : '') +
      ' placeholder="' + esc(opts.placeholder || 'Search\u2026') + '"' +
      ' value="' + esc(opts.value || '') + '"' +
      (opts.oninput ? ' oninput="' + opts.oninput + '"' : '') +
      ' aria-label="' + esc(opts.placeholder || 'Search') + '">' +
      '</div>';
  }

  window.IxHeader = {
    version:   VERSION,
    render:     renderHeader,
    refreshBtn: refreshBtn,
    searchBox:  searchBox,
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
      ' loaded \u2014 IxHeader.render(), IxHeader.refreshBtn(), ' +
      'IxHeader.searchBox(), IxTabs.l1(tabs, active, attr, trailing), ' +
      'IxTabs.l2() available');
  } catch (e) {}
})();
