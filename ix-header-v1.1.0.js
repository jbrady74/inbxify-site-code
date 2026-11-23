/* ============================================================
   ix-header-v1.1.0.js

   ── v1.1.0 (22 Nov 2026, TA Reskin S1 · the title row) ──
   THREE SHARED PIECES, from the S1 title row and save blur boards. Nothing that exists changes: render(),
   refreshBtn(), searchBox() and IxTabs give the same output as v1.0.2, so no module moves until it adopts.

   1. IxHeader.titleRow(opts)  the one title row every T-A tab and IPP tab opens with. Left to right: the title
      (Newsreader 40), the ⓘ badge, then pushed right: status or count, actions, Refresh last. A 20px slot above
      the title holds the small way-back link on a screen inside a tab; the slot is always there, so titles sit
      at the same height on every tab.
        h += IxHeader.titleRow({
          title:   'Clients',
          back:    { label: 'Print Issues', attr: 'data-pi-back' },      // or href; omit on a rail tab
          info:    { file: 'client-manager-v1.5.0.js', version: '1.5.0', blurb: '…', scenarios: [ … ],
                     companions: 'ix-table-v1.0.0' },                       // ix-info payload; draws the ⓘ
          status:  '212 clients',                                         // text, escaped
          statusHtml: '<span class="ix-pill …">…</span>',                  // or html, as given
          warn:    { label: '2 to fix', attr: 'data-x-warn' },            // the status that opens warnings (IPP)
          actions: ['<button class="ix-btn …">Add client</button>'],      // html strings, as given
          refresh: 'clients'                                              // a key, or false for no Refresh
        });
        IxHeader.onRefresh('clients', function () { return reload(); });  // return a promise
      The ⓘ opens ix-info's popover (ix-info v1.0.2's delegated listener reads data-ix-info), so the payload is
      the one IxInfo.badge takes. The badge itself is drawn here: an 18px outlined circle, no version chip.

   2. REFRESH, ONE CONTROL. Fixed width (136px). A click runs the function registered for its key, inside
      IxProgress.track (ix-progress draws a card if it runs past 1.5 s), and while it runs the same button shows a
      spinner, "Refreshing…" and the seconds. When it settles, IxRefresh.emit('tab:refreshed', { key }) tells the
      page (ix-refresh-helper's bus). A key with no function registered does nothing and says so in the console.
      Clicks are delegated from document, so a module that redraws its HTML keeps its Refresh working.
        IxHeader.refreshControl(key)   the button alone, for a surface that draws its own row (IPP until S2)

   3. IxSave.blur(work, opts)  THE SAVE BLUR (ruling 1, 18 Nov). From the Save click until every write is done the
      page blurs; progress cards (ix-progress), toasts and the save bar stay sharp. `work` is a promise or a
      function returning one; the blur lifts when it settles, success or failure. Several saves at once keep the
      page blurred until the last one ends. opts.keep: element(s) to keep sharp (the tab's save bar); each gets
      .ix-save-sharp for the length of the save. Returns the promise, so a caller chains on it as before.
        IxSave.blur(saveAll(), { keep: bar }).then(…)
      The blur is a fixed layer with backdrop-filter under ix-progress (100000), toasts (100001) and modals
      (99999); a kept element is lifted above it. It also stops clicks reaching the page while writes run.
      Each module adopts it in its own reskin session.
   Companion: ix-header-v1.1.0.css (§T the title row, §S the save blur). Needs ix-info v1.0.2 for the popover,
   ix-progress v1.0.4 and ix-refresh-helper v1.1.0 (both optional: without them Refresh still works).
   ============================================================ */

/* ============================================================
   ix-header-v1.0.2.js (history)
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

  var VERSION = '1.1.0';

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


  // ══════════════════════════════════════════════════════════
  // v1.1.0 · THE SHARED TITLE ROW
  // ══════════════════════════════════════════════════════════
  var REFRESH_ICON = '<svg class="ix-tr-ico" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M12 7a5 5 0 1 1-1.6-3.7"></path><path d="M12 2v3H9"></path></svg>';
  var CARET = '<svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<path d="M3 5l4 4 4-4"></path></svg>';

  function infoBadge(info) {
    if (!info) return '';
    var payload = esc(JSON.stringify({
      file: info.file || '', version: info.version || '', title: info.title || '',
      blurb: info.blurb || '', scenarios: info.scenarios || [], companions: info.companions || '',
      heading: info.heading || ''
    }));
    return '<button type="button" class="ix-tr-info" data-ix-info="' + payload + '" ' +
      'aria-label="About this tab" title="About this tab">i</button>';
  }

  function backLink(b) {
    if (!b) return '';
    var label = '\u2039 ' + esc(b.label || 'Back');
    if (b.href) return '<a class="ix-tr-backlink" href="' + esc(b.href) + '"' + (b.attr ? ' ' + b.attr : '') + '>' + label + '</a>';
    return '<button type="button" class="ix-tr-backlink"' + (b.attr ? ' ' + b.attr : '') +
      (b.onclick ? ' onclick="' + b.onclick + '"' : '') + '>' + label + '</button>';
  }

  function refreshControl(key) {
    return '<button type="button" class="ix-tr-refresh" data-ix-tr-refresh="' + esc(key) + '" aria-label="Refresh">' +
      REFRESH_ICON + '<span class="ix-tr-rl">Refresh</span></button>';
  }

  // opts: { title, back, info, status, statusHtml, warn, link, actions, refresh, id }
  function titleRow(opts) {
    opts = opts || {};
    var acts = opts.actions || [];
    if (typeof acts === 'string') acts = [acts];
    var right = '';
    if (opts.statusHtml) right += '<span class="ix-tr-status">' + opts.statusHtml + '</span>';
    else if (opts.status) right += '<span class="ix-tr-status">' + esc(opts.status) + '</span>';
    if (opts.warn) right += '<button type="button" class="ix-tr-warn"' + (opts.warn.attr ? ' ' + opts.warn.attr : '') + '>' +
      esc(opts.warn.label || '') + CARET + '</button>';
    if (opts.link) right += '<button type="button" class="ix-tr-link"' + (opts.link.attr ? ' ' + opts.link.attr : '') + '>' +
      esc(opts.link.label || '') + '</button>';
    right += acts.join('');
    if (opts.refresh !== false && opts.refresh != null) right += refreshControl(opts.refresh);
    return '<div class="ix-tr-wrap ix-own"' + (opts.id ? ' id="' + esc(opts.id) + '"' : '') + '>' +
        '<div class="ix-tr-back">' + backLink(opts.back) + '</div>' +
        '<div class="ix-tr">' +
          '<h1 class="ix-tr-title">' + esc(opts.title || '') + '</h1>' +
          infoBadge(opts.info) +
          '<div class="ix-tr-sp"></div>' +
          right +
        '</div>' +
      '</div>';
  }

  // ── Refresh: one function per key, clicks delegated ──
  var refreshers = {};
  function onRefresh(key, fn) {
    if (!key || typeof fn !== 'function') return function () {};
    refreshers[key] = fn;
    return function off() { if (refreshers[key] === fn) delete refreshers[key]; };
  }

  function setBusy(btn, on, t0) {
    if (on) {
      btn.disabled = true;
      btn.classList.add('is-busy');
      btn.setAttribute('aria-busy', 'true');
      btn.innerHTML = '<span class="ix-tr-spin" aria-hidden="true"></span><span class="ix-tr-rl">Refreshing\u2026 0s</span>';
      btn.__ixTimer = setInterval(function () {
        var l = btn.querySelector('.ix-tr-rl');
        if (l) l.textContent = 'Refreshing\u2026 ' + Math.floor((Date.now() - t0) / 1000) + 's';
      }, 250);
    } else {
      clearInterval(btn.__ixTimer);
      btn.disabled = false;
      btn.classList.remove('is-busy');
      btn.removeAttribute('aria-busy');
      btn.innerHTML = REFRESH_ICON + '<span class="ix-tr-rl">Refresh</span>';
    }
  }

  function runRefresh(btn) {
    var key = btn.getAttribute('data-ix-tr-refresh');
    var fn = refreshers[key];
    if (!fn) { console.warn('[IxHeader] no refresh registered for "' + key + '"'); return; }
    if (btn.disabled) return;
    var t0 = Date.now();
    setBusy(btn, true, t0);
    var p;
    try { p = Promise.resolve(fn()); } catch (e) { p = Promise.reject(e); }
    if (window.IxProgress && typeof window.IxProgress.track === 'function') {
      var tr = btn.closest('.ix-tr');
      var t = tr && tr.querySelector('.ix-tr-title');
      window.IxProgress.track('Refresh' + (t && t.textContent ? ' \u00b7 ' + t.textContent : ''), p);
    }
    p.catch(function (e) { console.error('[IxHeader] refresh "' + key + '" failed', e); })
     .then(function () {
       // the button may have been redrawn while it ran; reset whichever copy is on the page
       var live = document.querySelectorAll('[data-ix-tr-refresh="' + key + '"]');
       if (btn.isConnected) setBusy(btn, false);
       Array.prototype.forEach.call(live, function (b) { if (b !== btn && b.classList.contains('is-busy')) setBusy(b, false); });
       if (window.IxRefresh && typeof window.IxRefresh.emit === 'function') window.IxRefresh.emit('tab:refreshed', { key: key, ms: Date.now() - t0 });
     });
  }

  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-ix-tr-refresh]');
    if (!b) return;
    e.preventDefault();
    runRefresh(b);
  });

  // ══════════════════════════════════════════════════════════
  // v1.1.0 · THE SAVE BLUR
  // ══════════════════════════════════════════════════════════
  var saving = 0, kept = [];
  function layer() {
    var l = document.getElementById('ix-save-blur');
    if (!l) {
      l = document.createElement('div');
      l.id = 'ix-save-blur';
      l.className = 'ix-save-blur';
      l.setAttribute('aria-hidden', 'true');
      document.body.appendChild(l);
    }
    return l;
  }
  function blur(work, opts) {
    opts = opts || {};
    var p;
    try { p = Promise.resolve(typeof work === 'function' ? work() : work); } catch (e) { p = Promise.reject(e); }
    var keep = opts.keep ? (opts.keep.length !== undefined && !opts.keep.nodeType ? Array.prototype.slice.call(opts.keep) : [opts.keep]) : [];
    keep.forEach(function (k) { if (k && k.classList) { k.classList.add('ix-save-sharp'); kept.push(k); } });
    saving++;
    layer();
    document.body.classList.add('ix-saving');
    document.body.setAttribute('aria-busy', 'true');
    function done() {
      saving = Math.max(0, saving - 1);
      if (saving) return;
      document.body.classList.remove('ix-saving');
      document.body.removeAttribute('aria-busy');
      kept.forEach(function (k) { k.classList.remove('ix-save-sharp'); });
      kept = [];
    }
    p.then(done, done);
    return p;
  }

  window.IxHeader = {
    version:   VERSION,
    render:     renderHeader,
    refreshBtn: refreshBtn,
    searchBox:  searchBox,
    titleName: titleName,
    esc:       esc,
    titleRow:  titleRow,              // v1.1.0
    refreshControl: refreshControl,   // v1.1.0
    onRefresh: onRefresh              // v1.1.0
  };
  window.IxSave = { version: VERSION, blur: blur, active: function () { return saving > 0; } };   // v1.1.0
  window.IxTabs = {
    version: VERSION,
    l1:      renderL1,
    l2:      renderL2
  };

  try {
    console.log('[IxHeader] v' + VERSION +
      ' loaded \u2014 IxHeader.render(), IxHeader.refreshBtn(), ' +
      'IxHeader.searchBox(), IxHeader.titleRow(), IxHeader.onRefresh(), IxSave.blur(), ' +
      'IxTabs.l1(tabs, active, attr, trailing), IxTabs.l2() available');
  } catch (e) {}
})();
