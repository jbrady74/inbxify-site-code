// quill-performance-v1.0.1.js
// ============================================================
// quill-performance-v1.0.1.js
// INBXIFY — Quill · Performance tab (Raw counts and Sources)
//
// v1.0.1 (17 Nov 2026, Performance Report S3 · Test 1) — FILTERS YOU CAN SEARCH.
//   Jeff (17 Nov, Test 1): "drop-downs need internal search". Each column filter is now a picker: the button shows the
//   current choice (gold border when set); a click opens a list with a search box on top, already focused. Typing
//   narrows the list on the name and on the id or slug behind it. Arrow keys move, Enter picks, Escape closes. All and
//   (blank) stay at the top. Names sort A to Z (days newest first). The list is as wide as its longest name, at least
//   the column's width. Also: the status line's Refresh link wore the site's link style (large serif); it is now
//   pinned to the Portal's 12 px sans. Companion CSS: quill-performance-v1.0.1.css. HARDCODING: HC-P-PR3-7 gains the
//   search placeholder and "No match" words.
//
// v1.0.0 (16 Nov 2026, Performance Report S3 · build step 2) — FIRST BUILD.
//   Mockup quill-performance-mockup-v0_1, Jeff 16 Nov: D1-D5 and D7-D12 accepted, D6 rejected (no "Ad seen at"
//   switch); Raw counts keeps Readers and drops Avg time.
//   · THE TAB. Registers into quill-home v2.0.2 (window.QuillShell / window.QUILL_TABS) as the Performance tab, so it
//     draws the first time the tab is opened. Portal look (ps-shell), ⓘ badge on the title row (ix-info).
//   · SUB-TABS (D11). Raw counts, Site, Ads, Email, GA4 check, Sources. Site, Ads, Email and GA4 check are grey and show
//     their purpose and "Not built yet" (build steps 5, 5, 4 and 6). Fixed-width tabs, so the row never changes shape.
//   · STATUS LINE (D10) under the sub-tabs on every sub-tab: each connected source with its last delivery, the count
//     not connected yet, and when the page last read, with Refresh.
//   · RAW COUNTS (D3-D5, D7, D8). One filter per column, under its name (D4); filters with a value wear the gold
//     editing border, and Clear filters puts them all back. Dates: 7 days (default), 28, 90, or Dates… (from and to).
//     Rows: merge by any of the nine columns (default Day, Title, Event), or One row per event (31 days at most).
//     Columns not merged read "all"; a blank value reads "–". Merged rows show Count and Readers. Every row has the
//     chevron at its right: a merged row opens to its first 5 events, with "Show these as rows"; an event row opens to
//     its page, visit, destination and link words. On event rows, Count holds the event's seconds (engaged time for a
//     page view, longest time on screen for an ad) and Readers holds the reader code. 12 rows a page.
//     Export CSV writes every row the table holds (filters and merging), not just the page on screen.
//   · SOURCES (D9). All seven inputs. Site is live; the rest read "Not connected" with their build step. Healthy when
//     comes from the Worker's rule (PERF_SOURCES hours) for connected sources. Site's chevron opens rows per day.
//   · READS. ix-perf v1.1.0 GET /raw and GET /sources, with the Memberstack login token (staff only, checked by
//     ix-perf through ix-members). Names come back with the rows (D2). A failed read says so on the surface.
//   Companion CSS: quill-performance-v1.0.0.css (with ps-shell-v1.0.2.css, ix-tokens-v1.0.4.css, ix-info-v1.0.0.css).
//   Needs quill-home v2.0.2 on the page, loaded before or after this file.
//   HARDCODING (provisional): HC-P-PR3-6 perfUrl default (QUILL_CONFIG.perfUrl overrides); HC-P-PR3-7 the words (W,
//   SUB, SRC, EV): sub-tab names, source names and descriptions, build steps, rule words; HC-P-PR3-8 page size 12,
//   expand size 5, date presets 7/28/90, event-mode 31 days, zone America/New_York (QUILL_CONFIG.perfTz overrides).
// ============================================================
(function () {
  'use strict';

  var VERSION = '1.0.1', FILE = 'quill-performance-v1.0.1.js';
  var QC = window.QUILL_CONFIG || {};
  var CFG = {
    perfUrl: String(QC.perfUrl || 'https://ix-perf.jeff-2cd.workers.dev').replace(/\/+$/, ''),   // HC-P-PR3-6
    tz: QC.perfTz || 'America/New_York',                                                         // HC-P-PR3-8
    pageSize: 12, expandSize: 5, presets: [7, 28, 90], eventDays: 31                             // HC-P-PR3-8
  };

  // ── words (HC-P-PR3-7) ───────────────────────────────────
  var W = {
    title: 'Performance', notBuilt: 'Not built yet.', reading: 'Reading ix-perf…',
    rows: 'Rows', grouped: 'Merged by ', eventRows: 'One row per event', mergeAll: 'Everything in one row',
    mergeBy: 'Merge rows by', mergeHint: 'Columns you do not merge by read “all”.',
    dates: 'Dates…', from: 'From', to: 'To', apply: 'Apply', cancel: 'Cancel',
    search: 'Search\u2026', noMatch: 'No match',
    clear: 'Clear filters', csv: 'Export CSV', csvBusy: 'Exporting…', all: 'all', blank: '(blank)', any: 'All',
    none: 'No events match these dates and filters.', more: '{n} more · Show these {t} as rows',
    tooLong: 'Opening a row shows events from at most 31 days. Merge by Day, or narrow the dates.',
    noLogin: 'Your Quill login could not be read. Refresh the page and log in again.',
    failed: 'Could not read ix-perf: ', read: 'Read ', refresh: 'Refresh',
    notConn: '{n} other sources not connected yet', notConn1: '1 other source not connected yet',
    seconds: 'Seconds', reader: 'Reader', time: 'Time',
    detail: { page: 'Page', visit: 'Visit', dest: 'Goes to', label: 'Link words' },
    srcNote: 'Each input, when it last delivered, and whether that is on time. “Healthy when” is the rule the status follows.',
    status: { healthy: 'Healthy', late: 'Late', down: 'Down', failing: 'Failing', never: 'Nothing yet', no_rule: 'No rule set', not_connected: 'Not connected' },
    ruleHours: 'a row in the last {h} hours', ruleNone: 'no rule set (PERF_SOURCES)', noProblem: 'None'
  };
  var SUB = [
    { key: 'raw', name: 'Raw counts', built: true },
    { key: 'site', name: 'Site', step: 5, blurb: 'Visits, pages per visit, time on site, new and returning readers, and return visits over 28 days, by title, issue and kind of page.' },
    { key: 'ads', name: 'Ads', step: 5, blurb: 'Per advertiser and per ad: times on page, times seen, seen rate, time on screen, clicks and click rate, joining site and email on the advertiser id.' },
    { key: 'email', name: 'Email', step: 4, blurb: 'Per issue, provider and campaign: sent, delivered, opens (Apple automatic opens apart), clicks (scanner clicks apart), and our own open count beside the provider’s.' },
    { key: 'ga4', name: 'GA4 check', step: 6, blurb: 'Our numbers and GA4’s for the same days, side by side, to judge the collector before GA4 is turned off.' },
    { key: 'src', name: 'Sources', built: true }
  ];
  var SRC = [
    { key: 'site', name: 'Site pages', brings: 'Page views, ads on screen, clicks', step: 'Live' },
    { key: 'localtap', name: 'localtap.link', brings: 'Clicks through our short link', step: 'Build step 3', rule: 'a click within 24 h of a send' },
    { key: 'opens', name: 'Email opens', brings: 'Loads of our open picture', step: 'Build step 3', rule: 'opens within 2 h of a send' },
    { key: 'mailchimp', name: 'Mailchimp', brings: 'Sends, opens and clicks per campaign', step: 'Build step 4', rule: 'report read within 24 h of a send' },
    { key: 'ga4', name: 'GA4', brings: 'GA4’s daily numbers, for the check', step: 'Build step 6', rule: 'yesterday’s row by 10 AM' },
    { key: 'nexstar', name: 'Nexstar history', brings: 'The 27 past sends from Nexstar', step: 'Build step 7', rule: 'loaded once (no new sends)' },
    { key: 'stirista', name: 'Stirista', brings: 'Sends and clicks per link, emailed', step: 'Build step 8', rule: 'a report within 3 days of a send' }
  ];
  var EV = { page_view: 'Page view', ad_on_page: 'Ad on page', ad_seen: 'Ad seen', click: 'Click' };
  var EVC = { page_view: 'pv', ad_on_page: 'ad', ad_seen: 'seen', click: 'ck' };
  var COLS = [
    { k: 'day', name: 'Day' }, { k: 'publisher', name: 'Publisher' }, { k: 'title', name: 'Title' }, { k: 'issue', name: 'Issue' },
    { k: 'surface', name: 'Surface' }, { k: 'event', name: 'Event' }, { k: 'spot', name: 'Spot' }, { k: 'advertiser', name: 'Advertiser' },
    { k: 'linktype', name: 'Link type' }
  ];
  var SURF = { issue: 'Issue', article: 'Article', archives: 'Archives', directory: 'Directory', franchise: 'Franchise', home: 'Home', other: 'Other' };

  // ── state ────────────────────────────────────────────────
  var S = {
    api: null, el: null, sub: 'raw',
    preset: 7, from: '', to: '', group: ['day', 'title', 'event'], eventMode: false, filters: {}, page: 1,
    data: null, options: null, names: { publisher: {}, title: {}, advertiser: {} }, err: '', loading: false, seq: 0,
    open: {}, sources: null, srcErr: '', readAt: 0, srcOpen: false, csvBusy: false
  };

  // ── register into quill-home v2.0.2 ──────────────────────
  var reg = { key: 'performance', draw: draw };
  if (window.QuillShell && window.QuillShell.register) window.QuillShell.register(reg.key, reg.draw);
  else (window.QUILL_TABS = window.QUILL_TABS || []).push(reg);

  function draw(panel, api) {
    S.api = api; S.el = panel;
    setPreset(7);
    panel.classList.add('qpf');
    panel.innerHTML =
      '<div class="ps-titlerow"><h1>' + esc(W.title) + '</h1>' + infoBadge() + '<span class="sp"></span></div>' +
      '<div class="qpf-tabs" role="tablist">' + SUB.map(function (t) {
        return '<button type="button" class="qpf-tab' + (t.built ? '' : ' unb') + '" data-sub="' + t.key + '"' +
          (t.built ? '' : ' title="Build step ' + t.step + '. ' + esc(W.notBuilt) + '"') + '>' + esc(t.name) + '</button>';
      }).join('') + '</div>' +
      '<div class="qpf-status" id="qpf-status"></div>' +
      '<section class="qpf-view" data-view="raw">' + rawShell() + '</section>' +
      '<section class="qpf-view" data-view="src" hidden>' + srcShell() + '</section>' +
      SUB.filter(function (t) { return !t.built; }).map(function (t) {
        return '<section class="qpf-view" data-view="' + t.key + '" hidden><div class="ps-unbuilt"><p>' + esc(t.blurb) +
          '</p><p class="qpf-nb">Build step ' + t.step + '. ' + esc(W.notBuilt) + '</p></div></section>';
      }).join('');
    wire();
    showSub('raw');
    loadSources();
    loadRaw(true);
  }

  function infoBadge() {
    if (!window.IxInfo || !window.IxInfo.badge) return '';
    return window.IxInfo.badge({
      file: FILE, version: VERSION, title: 'Quill · Performance',
      blurb: 'Raw counts: every event the collector stored (page views, ads on page, ads seen, clicks), counted and filtered, ' +
        'merged by the columns you choose. Readers are different reader codes. Sources: each input, when it last delivered, and ' +
        'whether that is on time. Numbers are read from ix-perf with your staff login; nothing here writes.',
      scenarios: [
        { name: 'ix-perf GET /raw', note: 'counts, events, filter values and names (names from the ix-content CMS copy)' },
        { name: 'ix-perf GET /sources', note: 'each source’s last delivery and health' },
        { name: 'ix-members /whoami', note: 'ix-perf checks the login is staff' } ],
      heading: 'Pathways',
      companions: 'quill-performance-v1.0.1.css · quill-home v2.0.2 · ps-shell-v1.0.2.css · ix-info v1.0.2'
    });
  }

  // ── shells ───────────────────────────────────────────────
  function rawShell() {
    return '<div class="qpf-tool">' +
        CFG.presets.map(function (d) { return '<button type="button" class="qpf-pill" data-preset="' + d + '">' + d + ' days</button>'; }).join('') +
        '<button type="button" class="qpf-pill" data-preset="custom" id="qpf-dates">' + esc(W.dates) + '</button>' +
        '<span class="qpf-gap"></span><span class="qpf-lab">' + esc(W.rows) + '</span>' +
        '<button type="button" class="qpf-sel qpf-rowsbtn" id="qpf-rowsbtn"></button>' +
        '<span class="sp"></span><span class="qpf-lab" id="qpf-sum"></span>' +
        '<button type="button" class="qpf-btn ghost" id="qpf-clear">' + esc(W.clear) + '</button>' +
        '<button type="button" class="qpf-btn" id="qpf-csv">' + esc(W.csv) + '</button>' +
      '</div>' +
      '<div class="qpf-pop" id="qpf-rowspop" hidden></div>' +
      '<div class="qpf-pop qpf-datepop" id="qpf-datepop" hidden></div>' +
      '<div class="qpf-pop qpf-fpop" id="qpf-fpop" hidden></div>' +
      '<div class="qpf-tbl"><table class="qpf-t">' + colgroup() +
        '<thead><tr class="qpf-h">' + COLS.map(function (c) { return '<th>' + esc(c.name) + '</th>'; }).join('') +
          '<th class="n" id="qpf-hn">Count</th><th class="n" id="qpf-hr">Readers</th><th class="chev"></th></tr>' +
          '<tr class="qpf-f" id="qpf-frow"></tr></thead>' +
        '<tbody id="qpf-body"></tbody></table>' +
        '<div class="qpf-load" id="qpf-load" hidden><span class="qpf-bar"></span>' + esc(W.reading) + '</div>' +
        '<div class="qpf-foot" id="qpf-foot"></div></div>';
  }
  function colgroup() {
    return '<colgroup><col style="width:136px"><col style="width:200px"><col style="width:150px"><col style="width:96px">' +
      '<col style="width:92px"><col style="width:108px"><col style="width:90px"><col style="width:190px"><col style="width:90px">' +
      '<col style="width:90px"><col style="width:96px"><col style="width:36px"></colgroup>';
  }
  function srcShell() {
    return '<div class="qpf-note">' + esc(W.srcNote) + '</div>' +
      '<div class="qpf-tbl"><table class="qpf-t qpf-src"><colgroup><col style="width:180px"><col style="width:280px"><col style="width:140px">' +
      '<col style="width:190px"><col style="width:100px"><col style="width:270px"><col style="width:190px"><col style="width:36px"></colgroup>' +
      '<thead><tr class="qpf-h"><th>Source</th><th>What it brings</th><th>Status</th><th>Last delivered</th><th class="n">Rows 24 h</th>' +
      '<th>Healthy when</th><th>Last problem</th><th class="chev"></th></tr></thead><tbody id="qpf-sbody"></tbody></table></div>';
  }

  // ── wiring ───────────────────────────────────────────────
  function $(id) { return S.el.querySelector('#' + id); }
  function wire() {
    S.el.querySelectorAll('[data-sub]').forEach(function (b) {
      b.addEventListener('click', function () { showSub(b.getAttribute('data-sub')); });
    });
    S.el.querySelectorAll('[data-preset]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        var v = b.getAttribute('data-preset');
        if (v === 'custom') { e.stopPropagation(); openDates(); return; }
        setPreset(+v); S.page = 1; S.open = {}; loadRaw(true);
      });
    });
    $('qpf-rowsbtn').addEventListener('click', function (e) { e.stopPropagation(); openRows(); });
    $('qpf-clear').addEventListener('click', function () { S.filters = {}; S.page = 1; S.open = {}; loadRaw(false); });
    $('qpf-csv').addEventListener('click', exportCsv);
    ['qpf-rowspop', 'qpf-datepop', 'qpf-fpop'].forEach(function (id) { $(id).addEventListener('click', function (e) { e.stopPropagation(); }); });
    document.addEventListener('click', closePops);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePops(); });
    $('qpf-body').addEventListener('click', onBodyClick);
    $('qpf-foot').addEventListener('click', function (e) {
      var b = e.target.closest('[data-page]'); if (!b || b.disabled) return;
      S.page = +b.getAttribute('data-page'); S.open = {}; loadRaw(false);
    });
    $('qpf-frow').addEventListener('click', function (e) {                // v1.0.1: searchable pickers
      var b = e.target.closest('button[data-f]'); if (!b) return;
      e.stopPropagation(); openPicker(b);
    });
    $('qpf-status').addEventListener('click', function (e) { if (e.target.closest('[data-refresh]')) { loadSources(); loadRaw(true); } });
    $('qpf-sbody').addEventListener('click', function (e) {
      if (!e.target.closest('tr.qpf-r[data-src="site"]')) return;
      S.srcOpen = !S.srcOpen; paintSources();
    });
  }
  function closePops() { if (!S.el) return; $('qpf-rowspop').hidden = true; $('qpf-datepop').hidden = true; $('qpf-fpop').hidden = true; S.fpick = null; }
  function showSub(k) {
    S.sub = k; closePops();
    S.el.querySelectorAll('[data-sub]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-sub') === k); });
    S.el.querySelectorAll('[data-view]').forEach(function (v) { v.hidden = v.getAttribute('data-view') !== k; });
  }

  // ── dates ────────────────────────────────────────────────
  function todayStr() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: CFG.tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function addDays(d, n) { var t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
  function spanDays(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000) + 1; }
  function setPreset(n) { S.preset = n; S.to = todayStr(); S.from = addDays(S.to, -(n - 1)); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function dShort(d) { if (!d) return ''; var p = d.split('-'); return MON[+p[1] - 1] + ' ' + (+p[2]); }
  function tShort(ms) {
    try { return new Intl.DateTimeFormat('en-US', { timeZone: CFG.tz, hour: 'numeric', minute: '2-digit' }).format(new Date(ms)); }
    catch (e) { return ''; }
  }
  function ago(ms) {
    var m = Math.max(0, Math.round((Date.now() - ms) / 60000));
    if (m < 1) return 'just now'; if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60); if (h < 48) return h + ' h ago';
    return Math.round(h / 24) + ' days ago';
  }

  function openDates() {
    var p = $('qpf-datepop'); $('qpf-rowspop').hidden = true;
    p.innerHTML = '<label>' + esc(W.from) + '<input type="date" id="qpf-from" value="' + esc(S.from) + '"></label>' +
      '<label>' + esc(W.to) + '<input type="date" id="qpf-to" value="' + esc(S.to) + '"></label>' +
      '<div class="qpf-poprow"><button type="button" class="qpf-btn" id="qpf-dapply">' + esc(W.apply) + '</button>' +
      '<a href="#" class="qpf-cancel" id="qpf-dcancel">' + esc(W.cancel) + '</a></div>';
    p.style.left = $('qpf-dates').offsetLeft + 'px';
    p.hidden = false;
    $('qpf-dapply').addEventListener('click', function () {
      var f = $('qpf-from').value, t = $('qpf-to').value;
      if (!f || !t) return;
      if (f > t) { var x = f; f = t; t = x; }
      S.preset = 'custom'; S.from = f; S.to = t; S.page = 1; S.open = {}; p.hidden = true; loadRaw(true);
    });
    $('qpf-dcancel').addEventListener('click', function (e) { e.preventDefault(); p.hidden = true; });
  }

  // ── rows (merging) ───────────────────────────────────────
  function rowsLabel() {
    if (S.eventMode) return W.eventRows;
    if (!S.group.length) return W.mergeAll;
    return W.grouped + COLS.filter(function (c) { return S.group.indexOf(c.k) >= 0; }).map(function (c) { return c.name; }).join(', ');
  }
  function openRows() {
    var p = $('qpf-rowspop'); $('qpf-datepop').hidden = true;
    if (!p.hidden) { p.hidden = true; return; }
    p.innerHTML = '<h5>' + esc(W.mergeBy) + '</h5>' + COLS.map(function (c) {
        return '<label><input type="checkbox" data-g="' + c.k + '"' + (!S.eventMode && S.group.indexOf(c.k) >= 0 ? ' checked' : '') +
          (S.eventMode ? ' disabled' : '') + '> ' + esc(c.name) + '</label>';
      }).join('') +
      '<label class="qpf-evrow"><input type="checkbox" id="qpf-evmode"' + (S.eventMode ? ' checked' : '') + '> ' + esc(W.eventRows) + '</label>' +
      '<div class="qpf-hint">' + esc(W.mergeHint) + '</div>';
    p.style.left = $('qpf-rowsbtn').offsetLeft + 'px';
    p.hidden = false;
    p.querySelectorAll('[data-g]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var k = cb.getAttribute('data-g');
        S.group = COLS.map(function (c) { return c.k; }).filter(function (x) { return x === k ? cb.checked : S.group.indexOf(x) >= 0; });
        S.page = 1; S.open = {}; loadRaw(false);
      });
    });
    $('qpf-evmode').addEventListener('change', function () {
      S.eventMode = this.checked; S.page = 1; S.open = {};
      p.querySelectorAll('[data-g]').forEach(function (cb) { cb.disabled = S.eventMode; cb.checked = !S.eventMode && S.group.indexOf(cb.getAttribute('data-g')) >= 0; });
      loadRaw(false);
    });
  }

  // ── reads ────────────────────────────────────────────────
  function call(path) {
    return Promise.resolve(S.api && S.api.token ? S.api.token() : null).then(function (tok) {
      if (!tok) throw new Error(W.noLogin);
      return fetch(CFG.perfUrl + path, { headers: { Authorization: 'Bearer ' + tok }, cache: 'no-store' });
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) {
        if (!j) throw new Error('ix-perf HTTP ' + r.status);
        if (!r.ok || !j.ok) throw new Error(j.error || ('ix-perf HTTP ' + r.status));
        return j;
      });
    });
  }
  function query(o) {
    o = o || {};
    var q = ['from=' + S.from, 'to=' + S.to];
    var ev = o.eventMode != null ? o.eventMode : S.eventMode;
    q.push('group=' + (ev ? 'none' : encodeURIComponent((o.group || S.group).join(','))));
    var f = o.filters || S.filters;
    Object.keys(f).forEach(function (k) { q.push('f.' + k + '=' + encodeURIComponent(f[k])); });
    if (o.all) q.push('all=1'); else { q.push('page=' + (o.page || S.page)); q.push('size=' + (o.size || CFG.pageSize)); }
    if (o.options) q.push('options=1');
    if (o.from) q[0] = 'from=' + o.from;
    if (o.to) q[1] = 'to=' + o.to;
    return '/raw?' + q.join('&');
  }
  function loadRaw(withOptions) {
    var my = ++S.seq;
    S.loading = true; paintRawChrome();
    call(query({ options: withOptions })).then(function (j) {
      if (my !== S.seq) return;
      S.data = j; S.err = '';
      if (j.options) S.options = j.options;
      mergeNames(j.names);
    }).catch(function (e) {
      if (my !== S.seq) return;
      S.data = null; S.err = (e && e.message) || String(e);
      console.error('[Quill Performance] /raw:', e);
    }).then(function () {
      if (my !== S.seq) return;
      S.loading = false; S.readAt = Date.now(); paintRaw(); paintStatus();
    });
  }
  function loadSources() {
    call('/sources').then(function (j) { S.sources = j; S.srcErr = ''; })
      .catch(function (e) { S.sources = null; S.srcErr = (e && e.message) || String(e); console.error('[Quill Performance] /sources:', e); })
      .then(function () { S.readAt = Date.now(); paintStatus(); paintSources(); });
  }
  function mergeNames(n) {
    if (!n) return;
    ['publisher', 'title', 'advertiser'].forEach(function (k) { var m = n[k] || {}; Object.keys(m).forEach(function (x) { S.names[k][x] = m[x]; }); });
  }

  // ── paint: status line ───────────────────────────────────
  var DOT = { healthy: 'ok', late: 'warn', never: 'warn', no_rule: 'warn', down: 'bad', failing: 'bad', not_connected: 'off' };
  function paintStatus() {
    var el = $('qpf-status'); if (!el) return;
    var parts = [];
    if (S.srcErr) parts.push('<span class="qpf-err"><span class="qpf-dot bad"></span>' + esc(W.failed + S.srcErr) + '</span>');
    else if (S.sources) {
      var conn = S.sources.sources.filter(function (s) { return s.connected; });
      conn.forEach(function (s) {
        var w = srcWords(s.source);
        var t = s.lastOkAt ? 'last row ' + ago(s.lastOkAt) : W.status[s.status];
        if (s.source === 'site') t += ' · ' + fmt(s.rows24) + ' rows in 24 h';
        if (s.status !== 'healthy') t += ' · ' + W.status[s.status];
        parts.push('<span><span class="qpf-dot ' + DOT[s.status] + '"></span><b>' + esc(w.name) + '</b> ' + esc(t) + '</span>');
      });
      var off = SRC.filter(function (w) { return !conn.some(function (s) { return s.source === w.key; }); }).length;
      if (off) parts.push('<span><span class="qpf-dot off"></span>' + esc(off === 1 ? W.notConn1 : W.notConn.replace('{n}', off)) + '</span>');
    } else parts.push('<span>' + esc(W.reading) + '</span>');
    el.innerHTML = parts.join('') + '<span class="sp"></span>' +
      (S.readAt ? '<span>' + esc(W.read + tShort(S.readAt)) + ' · <a href="#" data-refresh onclick="return false">' + esc(W.refresh) + '</a></span>' : '');
  }

  // ── paint: raw counts ────────────────────────────────────
  function paintRawChrome() {
    S.el.querySelectorAll('[data-preset]').forEach(function (b) { b.classList.toggle('on', String(S.preset) === b.getAttribute('data-preset')); });
    var dp = $('qpf-dates');
    dp.textContent = S.preset === 'custom' ? dShort(S.from) + ' – ' + dShort(S.to) : W.dates;
    dp.title = S.preset === 'custom' ? S.from + ' to ' + S.to : '';
    var rb = $('qpf-rowsbtn'); rb.textContent = rowsLabel(); rb.title = rowsLabel();
    $('qpf-clear').disabled = !Object.keys(S.filters).length;
    $('qpf-csv').disabled = S.loading || S.csvBusy || !S.data || !S.data.total.rows;
    $('qpf-csv').textContent = S.csvBusy ? W.csvBusy : W.csv;
    $('qpf-hn').textContent = S.eventMode ? W.seconds : 'Count';
    $('qpf-hr').textContent = S.eventMode ? W.reader : 'Readers';
    $('qpf-load').hidden = !S.loading;
    paintFilters();
  }
  // v1.0.1 — each filter is a button that opens a searchable list.
  function filterVals(k) {
    var vals = ((S.options || {})[k] || []).slice(), cur = S.filters[k];
    if (cur != null && vals.indexOf(cur) < 0) vals.unshift(cur);
    var blank = vals.indexOf('') >= 0;
    vals = vals.filter(function (v) { return v !== ''; });
    if (k !== 'day' && k !== 'event') vals.sort(function (a, b) { return label(k, a).toLowerCase().localeCompare(label(k, b).toLowerCase()); });
    return { vals: vals, blank: blank };
  }
  function paintFilters() {
    $('qpf-frow').innerHTML = COLS.map(function (c) {
      var cur = S.filters[c.k], txt = cur == null ? W.any : cur === '' ? W.blank : label(c.k, cur);
      return '<td><button type="button" data-f="' + c.k + '" class="qpf-fbtn' + (cur != null ? ' set' : '') + '" title="' + esc(txt) +
        '" aria-label="Filter ' + esc(c.name) + '" aria-haspopup="listbox">' + esc(txt) + '</button></td>';
    }).join('') + '<td></td><td></td><td></td>';
  }
  function openPicker(btn) {
    var k = btn.getAttribute('data-f'), p = $('qpf-fpop');
    if (S.fpick === k && !p.hidden) { closePops(); return; }
    closePops(); S.fpick = k;
    var fv = filterVals(k), items = [{ v: null, t: W.any }];
    if (fv.blank) items.push({ v: '', t: W.blank });
    fv.vals.forEach(function (v) { var t = label(k, v); items.push({ v: v, t: t, sub: t !== v && k !== 'day' && k !== 'event' && k !== 'surface' ? v : '' }); });
    p.innerHTML = '<input type="text" class="qpf-fsearch" placeholder="' + esc(W.search) + '" aria-label="Search">' +
      '<div class="qpf-flist" role="listbox"></div>';
    var host = S.el.querySelector('[data-view="raw"]'), hb = host.getBoundingClientRect(), bb = btn.getBoundingClientRect();
    p.style.left = (bb.left - hb.left) + 'px'; p.style.top = (bb.bottom - hb.top + 2) + 'px';
    p.style.minWidth = Math.max(240, bb.width) + 'px';
    p.hidden = false;
    var input = p.querySelector('input'), list = p.querySelector('.qpf-flist'), shown = [], act = 0;
    function paint() {
      var q = input.value.trim().toLowerCase();
      shown = items.filter(function (it, i) { return !q || i === 0 || (it.t + ' ' + (it.sub || '')).toLowerCase().indexOf(q) >= 0; });
      if (q && shown.length > 1) shown = shown.slice(1);                    // typing hides "All" unless nothing matches
      act = Math.min(act, shown.length - 1);
      var cur = S.filters[k];
      list.innerHTML = shown.length ? shown.map(function (it, i) {
        var on = it.v === null ? cur == null : cur === it.v;
        return '<div class="qpf-fopt' + (i === act ? ' act' : '') + (on ? ' on' : '') + '" role="option" data-i="' + i + '" title="' + esc(it.t + (it.sub ? ' \u00b7 ' + it.sub : '')) + '">' +
          '<span class="t">' + esc(it.t) + '</span>' + (it.sub ? '<span class="s">' + esc(it.sub) + '</span>' : '') + '</div>';
      }).join('') + (q && shown.length === 1 && shown[0].v === null ? '<div class="qpf-fnone">' + esc(W.noMatch) + '</div>' : '') : '<div class="qpf-fnone">' + esc(W.noMatch) + '</div>';
      var a = list.querySelector('.act'); if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' });
    }
    function pick(it) {
      if (!it) return;
      if (it.v === null) delete S.filters[k]; else S.filters[k] = it.v;
      closePops(); S.page = 1; S.open = {}; loadRaw(false);
    }
    input.addEventListener('input', function () { act = 0; paint(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); act = Math.min(shown.length - 1, act + 1); paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); act = Math.max(0, act - 1); paint(); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(shown[act]); }
      else if (e.key === 'Escape') { e.preventDefault(); closePops(); btn.focus(); }
    });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });   // keep focus in the search box
    list.addEventListener('click', function (e) { var o = e.target.closest('[data-i]'); if (o) pick(shown[+o.getAttribute('data-i')]); });
    paint(); input.focus({ preventScroll: true });
  }
  function label(k, v) {
    if (k === 'day') return dShort(v);
    if (k === 'event') return EV[v] || v;
    if (k === 'surface') return SURF[v] || v;
    if (k === 'publisher' || k === 'title' || k === 'advertiser') return S.names[k][v] || v;
    return v;
  }
  function paintRaw() {
    paintRawChrome();
    var body = $('qpf-body'), foot = $('qpf-foot'), sum = $('qpf-sum');
    if (S.err) {
      body.innerHTML = '<tr class="qpf-msg"><td colspan="12" class="qpf-err">' + esc(W.failed + S.err) + '</td></tr>';
      foot.innerHTML = ''; sum.textContent = ''; return;
    }
    var d = S.data; if (!d) return;
    sum.textContent = fmt(d.total.rows) + ' rows · ' + fmt(d.total.events) + ' events';
    var warn = (d.warnings || []).map(function (w) { return '<tr class="qpf-msg"><td colspan="12" class="qpf-warn">' + esc(w) + '</td></tr>'; }).join('');
    if (!d.rows.length) { body.innerHTML = warn + '<tr class="qpf-msg"><td colspan="12">' + esc(W.none) + '</td></tr>'; }
    else body.innerHTML = warn + d.rows.map(function (r, i) {
      var id = 'r' + i;
      return S.eventMode ? eventRow(r, id, false) + (S.open[id] ? detailRow(r) : '') : mergedRow(r, id) + (S.open[id] ? S.open[id].html : '');
    }).join('');
    var pages = Math.max(1, Math.ceil(d.total.rows / CFG.pageSize)), p = S.page;
    var a = Math.min(d.total.rows, (p - 1) * CFG.pageSize + 1), b = Math.min(d.total.rows, p * CFG.pageSize);
    foot.innerHTML = '<span>' + (d.total.rows ? 'Rows ' + fmt(a) + '–' + fmt(b) + ' of ' + fmt(d.total.rows) : '') + '</span><span class="sp"></span>' + pager(p, pages);
  }
  function pager(p, n) {
    if (n <= 1) return '';
    var list = [], i;
    var set = [1, n, p - 1, p, p + 1].filter(function (x) { return x >= 1 && x <= n; });
    for (i = 1; i <= n; i++) if (set.indexOf(i) >= 0) list.push(i);
    var h = '<button type="button" class="qpf-pg" data-page="' + (p - 1) + '"' + (p <= 1 ? ' disabled' : '') + '>‹</button>', last = 0;
    list.forEach(function (x) {
      if (x - last > 1) h += '<span class="qpf-pg gap">…</span>';
      h += '<button type="button" class="qpf-pg' + (x === p ? ' on' : '') + '" data-page="' + x + '">' + x + '</button>'; last = x;
    });
    return h + '<button type="button" class="qpf-pg" data-page="' + (p + 1) + '"' + (p >= n ? ' disabled' : '') + '>›</button>';
  }

  function cell(k, v, merged) {
    if (!merged) return '<td class="all">' + esc(W.all) + '</td>';
    if (v === '' || v == null) return '<td class="m">–</td>';
    if (k === 'event') return '<td><span class="qpf-ev ' + (EVC[v] || '') + '">' + esc(EV[v] || v) + '</span></td>';
    if (k === 'linktype') return '<td><span class="qpf-lt">' + esc(v) + '</span></td>';
    if (k === 'publisher') {
      var n = S.names.publisher[v];
      return '<td title="' + esc(v) + '">' + (n ? esc(n) + '<span class="qpf-slug">' + esc(v) + '</span>' : esc(v)) + '</td>';
    }
    if (k === 'title' || k === 'advertiser') return '<td title="' + esc(v) + '">' + esc(S.names[k][v] || v) + '</td>';
    return '<td>' + esc(label(k, v)) + '</td>';
  }
  function mergedRow(r, id) {
    return '<tr class="qpf-r' + (S.open[id] ? ' op' : '') + '" data-row="' + id + '">' +
      COLS.map(function (c) { return cell(c.k, r[c.k], S.group.indexOf(c.k) >= 0); }).join('') +
      '<td class="n">' + fmt(r.n) + '</td><td class="n">' + fmt(r.readers) + '</td><td class="chev"><i></i></td></tr>';
  }
  function secs(ms) { return ms == null ? '<span class="m">–</span>' : (Math.round(ms / 100) / 10).toFixed(1) + ' s'; }
  function eventRow(r, id, sub) {
    var whenTxt = sub ? tShort(r.at) : dShort(r.day) + ' \u00b7 ' + tShort(r.at);
    return '<tr class="qpf-r' + (sub ? ' qpf-sub' : '') + (S.open[id] ? ' op' : '') + '" data-ev="' + id + '">' +
      '<td title="' + esc(r.day + ' ' + tShort(r.at)) + '">' + esc(whenTxt) + '</td>' +
      COLS.slice(1).map(function (c) { return cell(c.k, r[c.k], true); }).join('') +
      '<td class="n">' + secs(r.ms) + '</td><td class="n mono" title="' + esc(r.reader) + '">' + esc(shortCode(r.reader)) + '</td>' +
      '<td class="chev"><i></i></td></tr>';
  }
  function detailRow(r) {
    var bits = [];
    if (r.path) bits.push([W.detail.page, r.path]);
    if (r.visit) bits.push([W.detail.visit, shortCode(r.visit)]);
    if (r.dest) bits.push([W.detail.dest, r.dest]);
    if (r.label) bits.push([W.detail.label, r.label]);
    return '<tr class="qpf-det"><td colspan="12">' + (bits.length ? bits.map(function (b) {
      return '<span class="k">' + esc(b[0]) + '</span> <span class="v" title="' + esc(b[1]) + '">' + esc(b[1]) + '</span>';
    }).join('<span class="dv">·</span>') : '<span class="k">–</span>') + '</td></tr>';
  }
  function shortCode(s) { s = String(s || ''); return s.length > 8 ? s.slice(0, 6) + '…' : s || '–'; }

  // ── opening rows ─────────────────────────────────────────
  var EVROWS = {};   // id -> event row data, for event rows and sub-rows
  function onBodyClick(e) {
    var more = e.target.closest('[data-more]');
    if (more) { e.preventDefault(); showAsRows(more.getAttribute('data-more')); return; }
    var tr = e.target.closest('tr.qpf-r'); if (!tr) return;
    if (tr.hasAttribute('data-ev')) {                             // an event row (event mode or a sub-row)
      var id = tr.getAttribute('data-ev');
      var r = S.eventMode && !tr.classList.contains('qpf-sub') ? S.data.rows[+id.slice(1)] : EVROWS[id];
      if (!r) return;
      var nx = tr.nextElementSibling;
      if (tr.classList.contains('op')) { tr.classList.remove('op'); if (nx && nx.classList.contains('qpf-det')) nx.remove(); delete S.open[id]; }
      else { tr.classList.add('op'); tr.insertAdjacentHTML('afterend', detailRow(r)); S.open[id] = true; }
      return;
    }
    var rid = tr.getAttribute('data-row'); if (!rid) return;
    if (S.open[rid]) { delete S.open[rid]; paintRaw(); return; }
    openMerged(rid);
  }
  function rowFilters(r) {
    var f = {}; Object.keys(S.filters).forEach(function (k) { f[k] = S.filters[k]; });
    S.group.forEach(function (k) { f[k] = r[k] == null ? '' : r[k]; });
    return f;
  }
  function openMerged(rid) {
    var r = S.data.rows[+rid.slice(1)]; if (!r) return;
    var f = rowFilters(r), from = S.from, to = S.to;
    if (S.group.indexOf('day') >= 0) { from = r.day; to = r.day; }
    if (spanDays(from, to) > CFG.eventDays) {
      S.open[rid] = { html: '<tr class="qpf-msg"><td colspan="12" class="qpf-warn">' + esc(W.tooLong) + '</td></tr>' }; paintRaw(); return;
    }
    S.open[rid] = { html: '<tr class="qpf-msg"><td colspan="12"><span class="qpf-bar"></span>' + esc(W.reading) + '</td></tr>' }; paintRaw();
    var my = S.seq;
    call(query({ eventMode: true, filters: f, from: from, to: to, page: 1, size: CFG.expandSize })).then(function (j) {
      if (my !== S.seq || !S.open[rid]) return;
      mergeNames(j.names);
      var h = '<tr class="qpf-subh"><td>' + esc(W.time) + '</td><td colspan="8"></td><td class="n">' + esc(W.seconds) + '</td><td class="n">' + esc(W.reader) + '</td><td></td></tr>';
      j.rows.forEach(function (x, i) { var id = rid + 's' + i; EVROWS[id] = x; h += eventRow(x, id, true); });
      var rest = j.total.rows - j.rows.length;
      if (rest > 0) {
        S.open[rid].more = { filters: f, from: from, to: to };
        h += '<tr class="qpf-msg qpf-more"><td colspan="12"><a href="#" data-more="' + rid + '">' +
          esc(W.more.replace('{n}', fmt(rest)).replace('{t}', fmt(j.total.rows))) + '</a></td></tr>';
      }
      S.open[rid].html = h; paintRaw();
    }).catch(function (e) {
      if (!S.open[rid]) return;
      S.open[rid].html = '<tr class="qpf-msg"><td colspan="12" class="qpf-err">' + esc(W.failed + ((e && e.message) || e)) + '</td></tr>'; paintRaw();
    });
  }
  function showAsRows(rid) {
    var o = S.open[rid] && S.open[rid].more; if (!o) return;
    S.filters = o.filters; S.eventMode = true; S.page = 1; S.open = {};
    if (o.from !== S.from || o.to !== S.to) { S.preset = 'custom'; S.from = o.from; S.to = o.to; }
    loadRaw(true);
  }

  // ── Export CSV (D8) ──────────────────────────────────────
  function exportCsv() {
    if (S.csvBusy || !S.data) return;
    S.csvBusy = true; paintRawChrome();
    call(query({ all: true })).then(function (j) {
      mergeNames(j.names);
      var head, lines;
      if (S.eventMode) {
        head = ['Date', 'Time', 'Publisher', 'Publisher slug', 'Title', 'Title slug', 'Issue', 'Surface', 'Event', 'Spot', 'Advertiser',
          'Advertiser id', 'Link type', 'Seconds', 'Reader', 'Visit', 'Page', 'Goes to', 'Link words'];
        lines = j.rows.map(function (r) {
          return [r.day, tShort(r.at), S.names.publisher[r.publisher] || '', r.publisher, S.names.title[r.title] || '', r.title, r.issue,
            SURF[r.surface] || r.surface, EV[r.event] || r.event, r.spot, S.names.advertiser[r.advertiser] || '', r.advertiser, r.linktype,
            r.ms == null ? '' : (r.ms / 1000).toFixed(1), r.reader, r.visit, r.path, r.dest, r.label];
        });
      } else {
        head = ['Day', 'Publisher', 'Publisher slug', 'Title', 'Title slug', 'Issue', 'Surface', 'Event', 'Spot', 'Advertiser', 'Advertiser id',
          'Link type', 'Count', 'Readers'];
        lines = j.rows.map(function (r) {
          var g = function (k) { return S.group.indexOf(k) >= 0; }, A = W.all;
          return [g('day') ? r.day : A,
            g('publisher') ? (S.names.publisher[r.publisher] || '') : A, g('publisher') ? r.publisher : A,
            g('title') ? (S.names.title[r.title] || '') : A, g('title') ? r.title : A,
            g('issue') ? r.issue : A, g('surface') ? (SURF[r.surface] || r.surface) : A, g('event') ? (EV[r.event] || r.event) : A,
            g('spot') ? r.spot : A, g('advertiser') ? (S.names.advertiser[r.advertiser] || '') : A, g('advertiser') ? r.advertiser : A,
            g('linktype') ? r.linktype : A, r.n, r.readers];
        });
      }
      var csv = [head].concat(lines).map(function (row) { return row.map(csvCell).join(','); }).join('\r\n');
      var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'inbxify-raw-counts_' + S.from + '_' + S.to + '.csv';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      if (j.warnings && j.warnings.length) window.alert(j.warnings.join('\n'));
    }).catch(function (e) {
      window.alert(W.failed + ((e && e.message) || e));
    }).then(function () { S.csvBusy = false; paintRawChrome(); });
  }
  function csvCell(v) { v = v == null ? '' : String(v); return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }

  // ── paint: sources ───────────────────────────────────────
  function srcWords(k) { return SRC.filter(function (w) { return w.key === k; })[0] || { key: k, name: k, brings: '', step: '' }; }
  function paintSources() {
    var body = $('qpf-sbody'); if (!body) return;
    if (S.srcErr) { body.innerHTML = '<tr class="qpf-msg"><td colspan="8" class="qpf-err">' + esc(W.failed + S.srcErr) + '</td></tr>'; return; }
    if (!S.sources) { body.innerHTML = '<tr class="qpf-msg"><td colspan="8"><span class="qpf-bar"></span>' + esc(W.reading) + '</td></tr>'; return; }
    var byKey = {}; S.sources.sources.forEach(function (s) { byKey[s.source] = s; });
    var keys = SRC.map(function (w) { return w.key; });
    S.sources.sources.forEach(function (s) { if (keys.indexOf(s.source) < 0) keys.push(s.source); });   // a source the words do not know yet
    body.innerHTML = keys.map(function (k) {
      var w = srcWords(k), s = byKey[k] || { source: k, connected: false, status: 'not_connected' };
      var st = s.status, conn = s.connected;
      var rule = conn ? (s.hours ? W.ruleHours.replace('{h}', s.hours) : W.ruleNone) : (w.rule || '');
      var last = conn ? (s.lastOkAt ? ago(s.lastOkAt) + ' · ' + tShort(s.lastOkAt) : W.status.never) : (w.step || '');
      var prob = s.lastError ? (s.lastErrorAt ? ago(s.lastErrorAt) + ': ' : '') + s.lastError : W.noProblem;
      var expandable = k === 'site' && s.days;
      var h = '<tr class="qpf-r' + (expandable && S.srcOpen ? ' op' : '') + (expandable ? '' : ' flat') + '" data-src="' + esc(k) + '">' +
        '<td class="b">' + esc(w.name) + '</td><td class="m" title="' + esc(w.brings) + '">' + esc(w.brings) + '</td>' +
        '<td><span class="qpf-st ' + DOT[st] + '">' + (DOT[st] === 'off' ? '' : '● ') + esc(W.status[st] || st) + '</span></td>' +
        '<td class="' + (conn ? '' : 'm') + '">' + esc(last) + '</td>' +
        '<td class="n">' + (k === 'site' && conn ? fmt(s.rows24) : '<span class="m">–</span>') + '</td>' +
        '<td class="m" title="' + esc(rule) + '">' + esc(rule) + '</td>' +
        '<td class="' + (s.lastError ? 'qpf-err' : 'm') + '" title="' + esc(prob) + '">' + esc(prob) + '</td>' +
        '<td class="chev">' + (expandable ? '<i></i>' : '') + '</td></tr>';
      if (expandable && S.srcOpen) h += s.days.map(function (d) {
        return '<tr class="qpf-sub"><td>' + esc(dShort(d.day)) + '</td><td colspan="7">' + fmt(d.page_views) + ' page views · ' +
          fmt(d.ad_views) + ' ads on page · ' + fmt(d.clicks) + ' clicks</td></tr>';
      }).join('');
      return h;
    }).join('') + (S.sources.warnings || []).map(function (x) { return '<tr class="qpf-msg"><td colspan="8" class="qpf-warn">' + esc(x) + '</td></tr>'; }).join('');
  }

  // ── helpers ──────────────────────────────────────────────
  function fmt(n) { return n == null ? '' : Number(n).toLocaleString('en-US'); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
})();
