// quill-performance-v1.1.0.js
// ============================================================
// quill-performance-v1.1.0.js
// INBXIFY — Quill · Performance tab (Raw counts, Editions, Site, Sources)
//
// v1.1.0 (17 Nov 2026, Performance Report S5) — THE EDITIONS AND SITE SCREENS (mockup v0.6, Jeff's rulings of 17 Nov).
//   SUB-TABS are now Raw counts, Editions, Site, Sources, Reports (ruling 8). Reports is grey (S6). The grey Ads, Email
//   and GA4 check tabs are gone.
//   · EDITIONS. One edition (WLN-123A), chosen from a searchable list of every edition (newest first; the first one that
//     holds numbers opens). Its series sits beside it as pills, with "Series roll-up" (every number is the editions'
//     numbers added; nothing is typed there).
//       Columns   the sources that hold data for the edition, worked out by ix-perf, never ticked: Our count, then each
//                 typed or uploaded source, then Total.
//       Top       Sends, Opens, Clicks across the sources.
//       Links     every link of the compiled email, grouped as the IPP pickers group them (Editorial, Revenue, Other
//                 links), with a subtotal per group. Jeff, 17 Nov: the Clicks and Views headings sit under each dark
//                 band, bold, and repeat under Revenue.
//       Views     Our count's are counted on the site. An email source's are its opens x the block's share on the one
//                 curve (100% first block, 18% last). Shown as plain numbers; the ⓘ beside Views opens the curve, the
//                 share per block, and what our own open picture counted per sender.
//       Typing    A typed column stands at the right while fewer than four sources are in use ("Name the source": a
//                 provider from the list, or any name typed); with four, "Add a source" brings it. Every other source's
//                 column has Edit (its numbers become boxes) and Upload report (a provider's .csv or .xlsx fills the
//                 boxes for checking). Changed boxes wear the gold border. Save and Cancel are in the save bar, bottom
//                 right; each column in edit has its own small cancel. Enter moves down a column. Nothing is written
//                 until Save (ix-perf POST /typed); a typed number is then the number used everywhere.
//       No data   A source column with no numbers shows dashes, and "No data" once, small and red, under its name.
//       Opens     A source's own opens are used. Until they are in, our open picture's count for that sender fills the
//                 cell (its tip says so); afterwards ours shows only in the ⓘ (Jeff, 17 Nov).
//       "Link rows add up to" compares each column's link clicks with its Clicks number, in red when they differ.
//   · UPLOAD REPORT reads the file in the browser. It finds Delivered, Opens, Clicks and PO Number by their labels (the
//     number beside or under the label) and one row per link (an address, then its clicks). Links are matched to the
//     edition's lines by address without utm codes (so a trailing slash or www does not split a link) and by spot. Rows
//     that match no line are kept and listed under Other links after Save. A PO Number that is not this edition's
//     NEWSLETTERS id is said in red. .xlsx is unpacked in the browser (DecompressionStream); no library.
//   · SITE. Pages tied to no edition, our count only. Period 7, 28 or 90 days. Refresh, no polling. Editorial: per kind
//     of page, pages opened, readers and clicks; a row opens to its addresses (chevron at the right). Revenue: per
//     advertiser and placement, views and clicks. A title chooser appears when more than one title has rows.
//   · RAW COUNTS gains the event Email open (surface Email); an open's row opens to its sender.
//   · READS AND WRITES. ix-perf v1.2.0: GET /editions, /edition, /site; POST /typed. With an older ix-perf the two new
//     screens say it is not deployed yet; Raw counts and Sources work as before.
//   Companion CSS: quill-performance-v1.1.0.css.
//   HARDCODING (provisional, S5 delta): HC-P-PR5-8 the words (W5) and the four-source rule (MAXCOLS); HC-P-PR5-7 the
//     report labels a sheet is searched for (REP_LABELS). The curve, the groups and the provider names come from ix-perf.
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

  var VERSION = '1.1.0', FILE = 'quill-performance-v1.1.0.js';
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
    detail: { page: 'Page', visit: 'Visit', dest: 'Goes to', label: 'Link words', sender: 'Sent by' },
    srcNote: 'Each input, when it last delivered, and whether that is on time. “Healthy when” is the rule the status follows.',
    status: { healthy: 'Healthy', late: 'Late', down: 'Down', failing: 'Failing', never: 'Nothing yet', no_rule: 'No rule set', not_connected: 'Not connected' },
    ruleHours: 'a row in the last {h} hours', ruleNone: 'no rule set (PERF_SOURCES)', noProblem: 'None'
  };
  var SUB = [                                                               // ruling 8 (17 Nov): Raw counts, Editions, Site, Sources, Reports
    { key: 'raw', name: 'Raw counts', built: true },
    { key: 'ed', name: 'Editions', built: true },
    { key: 'site', name: 'Site', built: true },
    { key: 'src', name: 'Sources', built: true },
    { key: 'rep', name: 'Reports', step: 'S6', blurb: 'Advertiser reports, and one overall report per title, built from an edition\u2019s numbers and the site\u2019s.' }
  ];
  var W5 = {                                                                // HC-P-PR5-8
    pick: 'Choose an edition', roll: 'Series roll-up', addSrc: 'Add a source', nameSrc: 'Name the source', typedIn: 'Typed in', edit: 'Edit',
    upload: 'Upload report', cancelLc: 'cancel', noData: 'No data', link: 'Link', addUp: 'Link rows add up to',
    noLinks: 'No links are known for this edition yet.', nameFirst: 'Name the source to save', notSaved: 'Not saved: ',
    leave: 'You have changes that are not saved. Leave them?', noNumbers: 'no numbers yet', searchOrType: 'Search, or type a new name\u2026',
    oursTip: 'Counted by our open picture. This source\u2019s own number is not in yet.', viTip: 'How views are worked out',
    foot: 'Our count views are counted on the website. Views for the email sources come from one curve applied to that source\u2019s opens: click the {i}. A sponsor and its story sit in the same block, so they get the same share.',
    footRoll: 'Every number is the editions\u2019 numbers added together. Numbers are typed on each edition, not here.',
    curveTitle: 'How views are worked out',
    curveText: 'An email cannot report what a reader scrolled past, so email views are opens \u00d7 a share. The share depends only on how far down the email the block sits: {t} at the first block, {b} at the last, a straight line between. One rule for every email, however many blocks it has. This edition has {n} blocks. Every link in a block gets that block\u2019s share. It cannot be changed here.',
    curveLinks: 'The issue\u2019s block list could not be matched, so the blocks counted are the ones that carry links.',
    curveRoll: 'Each edition\u2019s views were worked out on its own: opens \u00d7 a share that runs from {t}% at the first block to {b}% at the last. The roll-up adds them.',
    oursTitle: 'Our open picture counted', oursUnnamed: 'no sender named', oursNone: 'nothing for this edition yet.',
    upNothing: 'no sends, opens, clicks or link rows were found in this file.',
    upWrongPo: 'its PO Number is {po}, and this edition is {id}. Check it is the right report.',
    upRead: '{n} link rows read. Check the gold boxes, then Save.',
    upLoose: '{n} of them ({c} clicks) match no link in the compiled email; they will be listed under Other links after Save.',
    upFailed: 'could not be read: ', oldWorker: 'ix-perf v1.2.0 is not deployed yet{v}. This screen needs it.',
    siteSub: 'pages tied to no edition \u00b7 Our count only', sitePages: 'Site pages readers open outside an issue',
    siteAds: 'Ads and listings on those pages. Views are counted: half on screen for half a second',
    siteNone: 'No pages outside an issue were opened in this period.', siteNoAds: 'No ads were shown on those pages in this period.', noTitle: '(no title)',
    siteFoot: 'Everything here is counted by our own collector. Nothing is worked out. Pages opened from an issue\u2019s links are on the Editions screen, under that edition\u2019s Our count. An advertiser report adds both: its edition numbers and its site numbers. Refresh reads the latest counts.'
  };
  var SRC = [
    { key: 'site', name: 'Site pages', brings: 'Page views, ads on screen, clicks', step: 'Live' },
    { key: 'localtap', name: 'localtap.link', brings: 'Clicks through our short link', step: 'Build step 3', rule: 'a click within 24 h of a send' },
    { key: 'opens', name: 'Email opens', brings: 'Loads of our open picture', step: 'Build step 3', rule: 'opens within 2 h of a send' },
    { key: 'mailchimp', name: 'Mailchimp', brings: 'Sends, opens and clicks per campaign', step: 'Build step 4', rule: 'report read within 24 h of a send' },
    { key: 'ga4', name: 'GA4', brings: 'GA4’s daily numbers, for the check', step: 'Build step 6', rule: 'yesterday’s row by 10 AM' },
    { key: 'nexstar', name: 'Nexstar history', brings: 'The 27 past sends from Nexstar', step: 'Build step 7', rule: 'loaded once (no new sends)' },
    { key: 'stirista', name: 'Stirista', brings: 'Sends and clicks per link, emailed', step: 'Build step 8', rule: 'a report within 3 days of a send' }
  ];
  var EV = { page_view: 'Page view', ad_on_page: 'Ad on page', ad_seen: 'Ad seen', click: 'Click', email_open: 'Email open' };   // email_open v1.1.0
  var EVC = { page_view: 'pv', ad_on_page: 'ad', ad_seen: 'seen', click: 'ck', email_open: 'eo' };
  var COLS = [
    { k: 'day', name: 'Day' }, { k: 'publisher', name: 'Publisher' }, { k: 'title', name: 'Title' }, { k: 'issue', name: 'Issue' },
    { k: 'surface', name: 'Surface' }, { k: 'event', name: 'Event' }, { k: 'spot', name: 'Spot' }, { k: 'advertiser', name: 'Advertiser' },
    { k: 'linktype', name: 'Link type' }
  ];
  var SURF = { issue: 'Issue', article: 'Article', archives: 'Archives', directory: 'Directory', franchise: 'Franchise', home: 'Home', other: 'Other', email: 'Email' };

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
          (t.built ? '' : ' title="' + esc(t.step) + '. ' + esc(W.notBuilt) + '"') + '>' + esc(t.name) + '</button>';
      }).join('') + '</div>' +
      '<div class="qpf-status" id="qpf-status"></div>' +
      '<section class="qpf-view" data-view="raw">' + rawShell() + '</section>' +
      '<section class="qpf-view" data-view="ed" hidden>' + edShell() + '</section>' +
      '<section class="qpf-view" data-view="site" hidden>' + siteShell() + '</section>' +
      '<section class="qpf-view" data-view="src" hidden>' + srcShell() + '</section>' +
      SUB.filter(function (t) { return !t.built; }).map(function (t) {
        return '<section class="qpf-view" data-view="' + t.key + '" hidden><div class="ps-unbuilt"><p>' + esc(t.blurb) +
          '</p><p class="qpf-nb">' + esc(t.step) + '. ' + esc(W.notBuilt) + '</p></div></section>';
      }).join('');
    wire(); wireEd(); wireSite();
    showSub('raw');
    loadSources();
    loadRaw(true);
  }

  function infoBadge() {
    if (!window.IxInfo || !window.IxInfo.badge) return '';
    return window.IxInfo.badge({
      file: FILE, version: VERSION, title: 'Quill · Performance',
      blurb: 'Raw counts: every event the collector stored (page views, ads on page, ads seen, clicks, email opens), counted and filtered, ' +
        'merged by the columns you choose. Editions: one edition\u2019s sends, opens and clicks per source, and every link of its compiled email ' +
        'with clicks and views per source; other sources are typed in or uploaded there and saved with Save. Site: pages tied to no edition, ' +
        'our count only. Sources: each input, when it last delivered, and whether that is on time. Numbers are read from ix-perf with your staff login.',
      scenarios: [
        { name: 'ix-perf GET /raw', note: 'counts, events, filter values and names (names from the ix-content CMS copy)' },
        { name: 'ix-perf GET /editions, GET /edition', note: 'the editions; one edition\u2019s sources, links, clicks, views and the views curve' },
        { name: 'ix-perf POST /typed', note: 'typed and uploaded source numbers (the only write)' },
        { name: 'ix-perf GET /site', note: 'pages tied to no edition, and the ads on them' },
        { name: 'ix-perf GET /sources', note: 'each source\u2019s last delivery and health' },
        { name: 'ix-members /whoami', note: 'ix-perf checks the login is staff' } ],
      heading: 'Pathways',
      companions: 'quill-performance-v1.1.0.css · quill-home v2.0.2 · ps-shell-v1.0.2.css · ix-info v1.0.2'
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
    $('qpf-status').addEventListener('click', function (e) {
      if (!e.target.closest('[data-refresh]')) return;
      loadSources();
      if (S.sub === 'ed') { if (E.id && !pendCount()) loadEdition(); } else if (S.sub === 'site') loadSite(); else loadRaw(true);
    });
    $('qpf-sbody').addEventListener('click', function (e) {
      if (!e.target.closest('tr.qpf-r[data-src="site"]')) return;
      S.srcOpen = !S.srcOpen; paintSources();
    });
  }
  function closePops() {
    if (!S.el) return;
    ['qpf-rowspop', 'qpf-datepop', 'qpf-fpop', 'qed-pop', 'qst-pop'].forEach(function (id) { var p = $(id); if (p) p.hidden = true; });
    S.fpick = null; S.chooser = null;
  }
  function showSub(k) {
    S.sub = k; closePops();
    S.el.querySelectorAll('[data-sub]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-sub') === k); });
    S.el.querySelectorAll('[data-view]').forEach(function (v) { v.hidden = v.getAttribute('data-view') !== k; });
    if (k === 'ed') enterEd(); else if (k === 'site' && !T.data && !T.loading) loadSite();     // v1.1.0
    paintSave();
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
  function call(path, body) {                                              // v1.1.0: a body makes it a POST
    return Promise.resolve(S.api && S.api.token ? S.api.token() : null).then(function (tok) {
      if (!tok) throw new Error(W.noLogin);
      return fetch(CFG.perfUrl + path, body ? { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
        : { headers: { Authorization: 'Bearer ' + tok }, cache: 'no-store' });
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
    if (r.label) bits.push([r.event === 'email_open' ? W.detail.sender : W.detail.label, r.label]);
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


  // ══════════════════════════════════════════════════════════
  // v1.1.0 — EDITIONS
  // ══════════════════════════════════════════════════════════
  var E = { list: null, listErr: '', id: '', roll: false, data: null, err: '', loading: false, seq: 0,
    editing: {}, pend: {}, add: null, adding: false, upload: {}, notes: [], saving: false, saveErr: '' };
  var ADD = '+';                                  // the not-yet-named column's key
  var MAXCOLS = 4;                                // sources the frame shows before "Add a source" (question 6)

  function edShell() {
    return '<div class="qed-head"><button type="button" class="qed-h2" id="qed-pick" aria-haspopup="listbox"></button>' +
        '<span class="qed-sub" id="qed-sub"></span></div>' +
      '<div class="qed-series" id="qed-series"></div>' +
      '<div class="qpf-pop qpf-fpop" id="qed-pop" hidden></div>' +
      '<div id="qed-msgs"></div>' +
      '<div class="qpf-tbl qed-wrap"><table class="qed-t" id="qed-t"></table>' +
        '<div class="qpf-load qed-load" id="qed-load" hidden><span class="qpf-bar"></span>' + esc(W.reading) + '</div></div>' +
      '<div class="qed-foot" id="qed-foot"></div>' +
      '<input type="file" id="qed-file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>' +
      '<div class="qed-save" id="qed-save" hidden><span id="qed-savemsg"></span><a href="#" id="qed-cancel">' + esc(W.cancel) + '</a>' +
        '<button type="button" id="qed-savebtn">Save</button></div>' +
      '<div class="qed-modal" id="qed-modal" hidden><div class="qed-modalb"><a href="#" class="qed-x" id="qed-x">Close</a><div id="qed-modalc"></div></div></div>';
  }
  function wireEd() {
    $('qed-pick').addEventListener('click', function (e) { e.stopPropagation(); pickEdition(); });
    $('qed-pop').addEventListener('click', function (e) { e.stopPropagation(); });
    $('qed-series').addEventListener('click', function (e) {
      var b = e.target.closest('[data-ed]'), r = e.target.closest('[data-roll]'), a = e.target.closest('[data-addsrc]');
      if (b) { openEdition(b.getAttribute('data-ed'), false); return; }
      if (r) { openEdition(E.id, true); return; }
      if (a) { e.preventDefault(); E.adding = true; paintEd(); }
    });
    var t = $('qed-t');
    t.addEventListener('click', function (e) {
      var x;
      if ((x = e.target.closest('[data-vi]'))) { e.preventDefault(); openCurve(); return; }
      if ((x = e.target.closest('[data-edit]'))) { e.preventDefault(); E.editing[x.getAttribute('data-edit')] = true; paintEd(); return; }
      if ((x = e.target.closest('[data-revert]'))) { e.preventDefault(); revertCol(x.getAttribute('data-revert')); return; }
      if ((x = e.target.closest('[data-upload]'))) { e.preventDefault(); E.upFor = x.getAttribute('data-upload'); $('qed-file').value = ''; $('qed-file').click(); return; }
      if ((x = e.target.closest('[data-name]'))) { e.preventDefault(); e.stopPropagation(); nameSource(x); return; }
    });
    t.addEventListener('change', function (e) {
      var i = e.target.closest('input[data-src]'); if (!i) return;
      setPend(i.getAttribute('data-src'), i.getAttribute('data-top'), i.getAttribute('data-line'), i.value);
      setTimeout(function () {                                             // after the browser has moved focus (Tab, a click, Enter)
        var a = document.activeElement, f = a && a.matches && a.matches('#qed-t input[data-src]') ? [a.getAttribute('data-src'), a.getAttribute('data-top'), a.getAttribute('data-line')] : null;
        paintEd(f);
      }, 0);
    });
    t.addEventListener('keydown', function (e) {                           // Enter moves down the column, like a sheet
      if (e.key !== 'Enter') return;
      var i = e.target.closest('input[data-src]'); if (!i) return;
      e.preventDefault();
      var all = [].slice.call(t.querySelectorAll('input[data-src="' + cssq(i.getAttribute('data-src')) + '"]')), n = all.indexOf(i);
      i.blur(); var nx = $('qed-t').querySelectorAll('input[data-src="' + cssq(i.getAttribute('data-src')) + '"]')[n + 1]; if (nx) { nx.focus(); nx.select(); }
    });
    $('qed-file').addEventListener('change', function () { var f = this.files && this.files[0]; if (f) readReport(f); });
    $('qed-cancel').addEventListener('click', function (e) { e.preventDefault(); cancelEd(); });
    $('qed-savebtn').addEventListener('click', saveEd);
    $('qed-x').addEventListener('click', function (e) { e.preventDefault(); $('qed-modal').hidden = true; });
    $('qed-modal').addEventListener('click', function (e) { if (e.target === this) this.hidden = true; });
    window.addEventListener('beforeunload', function (e) { if (pendCount()) { e.preventDefault(); e.returnValue = ''; } });
  }
  function cssq(s) { return String(s).replace(/["\\]/g, '\\$&'); }

  // ── reads ────────────────────────────────────────────────
  // An older ix-perf has no /editions, /edition or /site. Its "no such route" answer carries no CORS header, so the browser
  // only says the fetch failed; the version /sources answered tells the two apart.
  function needsWorker(msg) {
    var v = S.sources && S.sources.version ? String(S.sources.version).split('.').map(Number) : null;
    var old = v && (v[0] < 1 || (v[0] === 1 && v[1] < 2));
    return old || /No such route/i.test(msg || '') ? W5.oldWorker.replace('{v}', v ? ' (it answers v' + S.sources.version + ')' : '') : msg;
  }
  function enterEd() {
    if (E.list || E.listBusy) { if (E.list && !E.data && !E.loading && E.id) loadEdition(); return; }
    E.listBusy = true; paintEd();
    call('/editions').then(function (j) {
      E.list = j.editions || []; E.listErr = ''; E.listWarn = j.warnings || [];
      if (!E.id) { var d = E.list.filter(function (x) { return x.data; })[0] || E.list[0]; E.id = d ? d.id : ''; }
    }).catch(function (e) { E.list = null; E.listErr = needsWorker((e && e.message) || String(e)); console.error('[Quill Performance] /editions:', e); })
      .then(function () { E.listBusy = false; if (E.id) loadEdition(); else paintEd(); });
  }
  function openEdition(id, roll) {
    if (!id) return;
    if (pendCount() && !window.confirm(W5.leave)) return;
    E.id = id; E.roll = !!roll; resetEdits(); loadEdition();
  }
  function resetEdits() { E.editing = {}; E.pend = {}; E.add = null; E.adding = false; E.upload = {}; E.notes = []; E.saveErr = ''; }
  function loadEdition() {
    var my = ++E.seq; E.loading = true; paintEd();
    call('/edition?n=' + encodeURIComponent(E.id) + (E.roll ? '&roll=1' : '')).then(function (j) {
      if (my !== E.seq) return; E.data = j; E.err = ''; if (!j.rollup) E.roll = false;
    }).catch(function (e) {
      if (my !== E.seq) return; E.data = null; E.err = needsWorker((e && e.message) || String(e)); console.error('[Quill Performance] /edition:', e);
    }).then(function () { if (my !== E.seq) return; E.loading = false; S.readAt = Date.now(); paintEd(); paintStatus(); });
  }

  // ── values: what is saved, what is waiting, what shows ────
  function srcOf(k) { return ((E.data && E.data.sources) || []).filter(function (s) { return s.key === k; })[0] || null; }
  function savedTop(k, f) {
    var d = E.data; if (!d || k === ADD) return null;
    var s = srcOf(k);
    if (f === 'opens' && s && s.opensFrom === 'ours') return null;        // ours stands in; nothing is saved for the source
    var v = d.top[f][k]; return v == null ? null : v;
  }
  function shownTop(k, f) {
    var p = E.pend[k] && E.pend[k].top;
    if (p && f in p) return p[f];
    var d = E.data; if (!d || k === ADD) return null;
    var v = d.top[f][k]; return v == null ? null : v;
  }
  function savedLine(k, L) { var v = L.clicks[k]; return v == null || k === ADD ? null : v; }
  function shownLine(k, L) { var p = E.pend[k] && E.pend[k].lines; if (p && L.key in p) return p[L.key]; return savedLine(k, L); }
  function viewsOf(k, L, noViews) {
    if (noViews) return null;
    if (k === 'own' || E.data.rollup) { var v = L.views[k]; return v == null ? null : v; }
    if (L.share == null) return null;
    var o = shownTop(k, 'opens'); return o == null ? null : Math.round(o * L.share / 100);
  }
  function setPend(k, top, line, raw) {
    var txt = String(raw == null ? '' : raw).replace(/[,\s]/g, ''), v = txt === '' ? null : Number(txt);
    if (v != null && (!isFinite(v) || v < 0 || Math.round(v) !== v)) v = undefined;      // not a whole number: put the box back
    var P = E.pend[k] = E.pend[k] || { top: {}, lines: {} };
    if (top) { if (v === undefined || v === savedTop(k, top)) delete P.top[top]; else P.top[top] = v; }
    else {
      var L = lineByKey(line), sv = L ? savedLine(k, L) : null;
      if (v === undefined || v === sv) delete P.lines[line]; else P.lines[line] = v;
    }
    if (!Object.keys(P.top).length && !Object.keys(P.lines).length) delete E.pend[k];
  }
  function allLines() { var a = []; ((E.data && E.data.groups) || []).forEach(function (G) { G.subs.forEach(function (s) { s.lines.forEach(function (L) { a.push(L); }); }); }); return a; }
  function lineByKey(k) { return allLines().filter(function (L) { return L.key === k; })[0] || null; }
  function pendCount() { var n = 0; Object.keys(E.pend).forEach(function (k) { n += Object.keys(E.pend[k].top).length + Object.keys(E.pend[k].lines).length; }); return n; }
  function revertCol(k) { delete E.pend[k]; delete E.editing[k]; delete E.upload[k]; if (k === ADD || (E.add && E.add.key === k)) { E.add = null; E.adding = false; } E.notes = E.notes.filter(function (n) { return n.src !== k; }); paintEd(); }
  function cancelEd() { resetEdits(); paintEd(); }
  function cols() {                                                        // the columns on screen, in order
    var d = E.data, list = d.sources.map(function (s) { return { key: s.key, name: s.name, sub: s.sub, own: s.kind === 'own', src: s }; });
    if (d.rollup) return list;
    if (E.add && !srcOf(E.add.key)) list.push({ key: E.add.key, name: E.add.label, sub: '', fresh: true });
    else if (!E.add && (d.sources.length < MAXCOLS || E.adding)) list.push({ key: ADD, name: '', sub: '', fresh: true, unnamed: true });
    return list;
  }
  function isEditing(c) { return !c.own && !E.data.rollup && (c.fresh || !!E.editing[c.key]); }

  // ── paint ────────────────────────────────────────────────
  function paintEd(keepFocus) {
    var el = $('qed-t'); if (!el) return;
    var d = E.data, ed = d && d.edition;
    var cur = (E.list || []).filter(function (x) { return x.id === E.id; })[0] || null;
    $('qed-pick').textContent = ed ? (d.rollup ? ed.series : ed.code) : cur ? cur.code : W5.pick;
    $('qed-pick').disabled = !E.list;
    $('qed-load').hidden = !(E.loading || E.listBusy);
    $('qed-sub').innerHTML = ed ? [ed.publisher ? esc(ed.publisher) : '', ed.title ? '<b>' + esc(ed.title) + '</b>' : '',
      !d.rollup && ed.sentDay ? 'sent ' + esc(dLong(ed.sentDay)) : ''].filter(Boolean).join(' \u00b7 ') : '';
    var sib = (ed && ed.siblings) || [], sh = '';
    if (ed && ed.series) {
      sh = '<span class="lbl">' + esc(ed.series) + ' series</span>' + sib.map(function (s) {
        return '<button type="button" class="qed-pill' + (!d.rollup && s.id === ed.id ? ' on' : '') + '" data-ed="' + esc(s.id) + '">' + esc(s.code) + '</button>'; }).join('') +
        (sib.length > 1 ? '<button type="button" class="qed-pill' + (d.rollup ? ' on' : '') + '" data-roll="1">' + esc(W5.roll) + '</button>' : '');
    }
    if (d && !d.rollup && d.sources.length >= MAXCOLS && !E.adding && !E.add) sh += '<span class="sp"></span><a href="#" class="qed-link" data-addsrc="1">' + esc(W5.addSrc) + '</a>';
    $('qed-series').innerHTML = sh;
    var msgs = [];
    if (E.listErr) msgs.push(['err', W.failed + E.listErr]);
    if (E.err) msgs.push(['err', W.failed + E.err]);
    if (E.saveErr) msgs.push(['err', E.saveErr]);
    ((d && d.warnings) || []).concat(E.listWarn || []).forEach(function (w) { msgs.push(['warn', w]); });
    E.notes.forEach(function (n) { msgs.push([n.bad ? 'err' : 'warn', n.text]); });
    $('qed-msgs').innerHTML = msgs.map(function (m) { return '<div class="qed-msg ' + m[0] + '">' + esc(m[1]) + '</div>'; }).join('');
    if (!d) { el.innerHTML = ''; $('qed-foot').textContent = ''; paintSave(); return; }

    var C = cols(), NC = 1 + C.length * 2 + 2, h = '';
    C.forEach(function (c) { c.nodata = !c.own && !isEditing(c) && !hasNumbers(c.key); });   // question 5: dashes, and "No data" once
    h += '<colgroup><col class="a">' + C.map(function () { return '<col class="h"><col class="h">'; }).join('') + '<col class="h"><col class="h"></colgroup>';
    // row 1 · the sources
    h += '<tr class="g1"><th></th>' + C.map(function (c) {
      var ed2 = isEditing(c), acts = '', sub = c.sub ? esc(c.sub) : '';
      if (c.unnamed) return '<th colspan="2" class="pl typed"><button type="button" class="qed-name" data-name="' + ADD + '">' + esc(W5.nameSrc) + '</button><span class="ps">' + esc(W5.typedIn) + '</span><span class="acts">' +
        (E.adding ? '<a href="#" data-revert="' + ADD + '">' + esc(W5.cancelLc) + '</a>' : '') + '</span></th>';
      if (!c.own && !d.rollup) {
        acts = ed2 ? '<a href="#" data-upload="' + esc(c.key) + '">' + esc(W5.upload) + '</a><a href="#" data-revert="' + esc(c.key) + '">' + esc(W5.cancelLc) + '</a>'
          : '<a href="#" data-edit="' + esc(c.key) + '">' + esc(W5.edit) + '</a><a href="#" data-upload="' + esc(c.key) + '">' + esc(W5.upload) + '</a>';
        if (c.nodata || (c.fresh && !c.unnamed && !hasNumbers(c.key))) sub = '<span class="nodata">' + esc(W5.noData) + '</span>';
        else if (c.fresh) sub = esc(W5.typedIn);
      }
      var fileTip = c.src && c.src.file ? ' title="' + esc(c.src.file) + '"' : '';
      return '<th colspan="2" class="pl' + (ed2 ? ' typed' : '') + '"><span class="pn"' + fileTip + '>' + esc(c.name) + '</span><span class="ps">' + (sub || '&nbsp;') + '</span><span class="acts">' + acts + '</span></th>';
    }).join('') + '<th colspan="2" class="pl tot"><span class="pn">Total</span><span class="ps">All sources</span><span class="acts"></span></th></tr>';
    // rows 2 to 4 · sends, opens, clicks
    [['sends', 'Sends', 'Delivered'], ['opens', 'Opens', ''], ['clicks', 'Clicks', 'All links']].forEach(function (r, i) {
      var t = 0, any = false;
      h += '<tr class="top3' + (i === 2 ? ' last' : '') + '"><td>' + r[1] + (r[2] ? ' <span class="k2">\u00b7 ' + r[2] + '</span>' : '') + '</td>' + C.map(function (c) {
        var v = shownTop(c.key, r[0]); if (v != null) { t += v; any = true; }
        if (isEditing(c) && !(c.own)) return '<td colspan="2" class="pl soc typed">' + box(c.key, r[0], null, v, savedTop(c.key, r[0]), 'big') + '</td>';
        var tip = r[0] === 'opens' && c.src && c.src.opensFrom === 'ours' ? ' title="' + esc(W5.oursTip) + '"' : '';
        return '<td colspan="2" class="pl soc' + (v == null ? ' z' : '') + '"' + tip + '>' + (v == null ? '\u2013' : fmt(v)) + '</td>';
      }).join('') + '<td colspan="2" class="pl tot soc">' + (any ? fmt(t) : '\u2013') + '</td></tr>';
    });
    // the links, group by group; Clicks and Views sit under each dark band (Jeff, 17 Nov)
    var grand = {};
    d.groups.forEach(function (G) {
      h += '<tr class="grp"><td colspan="' + NC + '">' + esc(G.name) + '<span>' + esc(G.note) + '</span></td></tr>';
      h += '<tr class="g2"><th>' + esc(W5.link) + '</th>' + C.map(function (c) {
        return '<th class="pl' + (isEditing(c) ? ' typed' : '') + '">Clicks</th><th class="' + (isEditing(c) ? 'typed' : '') + '">' + (G.noViews ? '' : 'Views' + (c.own ? '' : '<a href="#" class="qed-vi" data-vi="1" title="' + esc(W5.viTip) + '">i</a>')) + '</th>'; }).join('') +
        '<th class="pl tot">Clicks</th><th class="tot">' + (G.noViews ? '' : 'Views') + '</th></tr>';
      var gs = { c: {}, v: {}, tc: 0, tv: 0, anyc: false, anyv: false };
      G.subs.forEach(function (sb) {
        if (sb.name) h += '<tr class="sec"><td colspan="' + NC + '">' + esc(sb.name) + '</td></tr>';
        sb.lines.forEach(function (L) {
          var rc = 0, rv = 0, anyc = false, anyv = false;
          h += '<tr><td title="' + esc(L.label + (L.url ? ' \u00b7 ' + L.url : '')) + '"><span class="sp2">' + esc(L.spot || '\u2013') + '</span><span class="ct-l">' + esc(L.label) + (L.who ? '<span class="who">\u00b7 ' + esc(L.who) + '</span>' : '') + '</span></td>';
          C.forEach(function (c) {
            var v = shownLine(c.key, L);
            if (v != null) { gs.c[c.key] = (gs.c[c.key] || 0) + v; grand[c.key] = (grand[c.key] || 0) + v; rc += v; anyc = true; }
            h += isEditing(c) ? '<td class="pl typed">' + box(c.key, null, L.key, v, savedLine(c.key, L), '') + '</td>' : num(v, 'pl', !c.nodata);
            var vw = viewsOf(c.key, L, G.noViews);
            if (vw != null) { gs.v[c.key] = (gs.v[c.key] || 0) + vw; rv += vw; anyv = true; }
            h += num(vw, isEditing(c) ? 'typed' : '', G.noViews || !c.nodata);
          });
          gs.tc += rc; gs.tv += rv; if (anyc) gs.anyc = true; if (anyv) gs.anyv = true;
          h += num(anyc ? rc : null, 'pl tot', true) + num(anyv ? rv : null, 'tot', true) + '</tr>';
        });
      });
      h += '<tr class="sub"><td>' + esc(G.name) + ' total</td>' + C.map(function (c) { var t = isEditing(c) ? ' typed' : ''; return num(gs.c[c.key], 'pl' + t, !c.nodata) + num(G.noViews ? null : gs.v[c.key], t, G.noViews || !c.nodata); }).join('') +
        num(gs.anyc ? gs.tc : null, 'pl tot', true) + num(gs.anyv ? gs.tv : null, 'tot', true) + '</tr>';
    });
    if (d.groups.length) h += '<tr class="sum"><td>' + esc(W5.addUp) + '</td>' + C.map(function (c) {
      var s = grand[c.key], tt = shownTop(c.key, 'clicks'), bad = tt != null && s != null && tt !== s;
      return '<td class="pl' + (s == null ? ' z' : '') + (bad ? ' bad' : '') + '" colspan="2">' + (s == null ? (c.nodata ? '\u2013' : '') : fmt(s) + (bad ? ' \u2260 ' + fmt(tt) : '')) + '</td>'; }).join('') +
      '<td class="pl tot" colspan="2"></td></tr>';
    else h += '<tr class="qed-none"><td colspan="' + NC + '">' + esc(W5.noLinks) + '</td></tr>';
    var foc = keepFocus && keepFocus.length === 3 ? keepFocus : null;
    var sx = el.parentNode.scrollLeft;
    el.innerHTML = h; el.parentNode.scrollLeft = sx;
    el.style.minWidth = (300 + (C.length + 1) * 184) + 'px';
    $('qed-foot').innerHTML = d.rollup ? esc(W5.footRoll) : W5.foot.replace('{i}', '<span class="qed-vi st">i</span>');
    paintSave();
    if (foc) {
      var q = 'input[data-src="' + cssq(foc[0]) + '"]' + (foc[1] ? '[data-top="' + foc[1] + '"]' : '[data-line="' + cssq(foc[2]) + '"]'), again = el.querySelector(q);
      if (again && again.focus) { again.focus({ preventScroll: true }); if (again.select) again.select(); }
    }
  }
  function hasNumbers(k) {
    var d = E.data, any = ['sends', 'opens', 'clicks'].some(function (f) { return shownTop(k, f) != null; });
    return any || allLines().some(function (L) { return shownLine(k, L) != null; });
  }
  function num(v, cls, blank) { return '<td class="' + (cls || '') + (v == null ? ' z' : '') + '">' + (v == null ? (blank ? '' : '\u2013') : fmt(v)) + '</td>'; }
  function box(k, top, line, v, saved, size) {
    var ch = (v == null ? null : v) !== (saved == null ? null : saved);
    return '<input type="text" inputmode="numeric" class="qed-n' + (size ? ' ' + size : '') + (ch ? ' ch' : '') + '" data-src="' + esc(k) + '"' +
      (top ? ' data-top="' + top + '"' : ' data-line="' + esc(line) + '"') + ' value="' + (v == null ? '' : v) + '" aria-label="' + esc((top || 'clicks') + ', ' + k) + '">';
  }
  function paintSave() {
    var n = pendCount(), bar = $('qed-save'); if (!bar) return;
    bar.hidden = !n || S.sub !== 'ed';
    var unnamed = !!E.pend[ADD];
    $('qed-savemsg').textContent = unnamed ? W5.nameFirst : n + (n === 1 ? ' change' : ' changes') + ' not saved';
    $('qed-savebtn').disabled = unnamed || E.saving;
    $('qed-savebtn').textContent = E.saving ? 'Saving\u2026' : 'Save';
  }

  // ── choosing: an edition, a source's name ─────────────────
  // One searchable list for every chooser on these two screens. items: [{ v, t, sub }]. free: typing a new value is allowed.
  function chooser(pop, btn, host, items, cur, onPick, free) {
    if (S.chooser === btn && !pop.hidden) { closePops(); return; }
    closePops(); S.chooser = btn;
    pop.innerHTML = '<input type="text" class="qpf-fsearch" placeholder="' + esc(free ? W5.searchOrType : W.search) + '" aria-label="Search"><div class="qpf-flist" role="listbox"></div>';
    var hb = host.getBoundingClientRect(), bb = btn.getBoundingClientRect();
    pop.style.left = Math.max(0, bb.left - hb.left) + 'px'; pop.style.top = (bb.bottom - hb.top + 2) + 'px'; pop.style.minWidth = Math.max(260, bb.width) + 'px';
    pop.hidden = false;
    var input = pop.querySelector('input'), list = pop.querySelector('.qpf-flist'), shown = [], act = 0;
    function paint() {
      var q = input.value.trim(), ql = q.toLowerCase();
      shown = items.filter(function (it) { return !ql || (it.t + ' ' + (it.sub || '')).toLowerCase().indexOf(ql) >= 0; });
      if (free && q && !items.some(function (it) { return it.t.toLowerCase() === ql; })) shown.push({ v: null, t: 'Use \u201c' + q + '\u201d', typed: q });
      act = Math.max(0, Math.min(act, shown.length - 1));
      list.innerHTML = shown.length ? shown.map(function (it, i) {
        return '<div class="qpf-fopt' + (i === act ? ' act' : '') + (it.v != null && it.v === cur ? ' on' : '') + '" role="option" data-i="' + i + '"><span class="t">' + esc(it.t) + '</span>' +
          (it.sub ? '<span class="s">' + esc(it.sub) + '</span>' : '') + '</div>'; }).join('') : '<div class="qpf-fnone">' + esc(W.noMatch) + '</div>';
      var a = list.querySelector('.act'); if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' });
    }
    function pick(it) { if (!it) return; closePops(); onPick(it); }
    input.addEventListener('input', function () { act = 0; paint(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); act = Math.min(shown.length - 1, act + 1); paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); act = Math.max(0, act - 1); paint(); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(shown[act]); }
      else if (e.key === 'Escape') { e.preventDefault(); closePops(); btn.focus(); }
    });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); });
    list.addEventListener('click', function (e) { var o = e.target.closest('[data-i]'); if (o) pick(shown[+o.getAttribute('data-i')]); });
    paint(); input.focus({ preventScroll: true });
  }
  function pickEdition() {
    if (!E.list) return;
    var items = E.list.map(function (x) { return { v: x.id, t: x.code, sub: [x.title, x.data ? '' : W5.noNumbers].filter(Boolean).join(' \u00b7 ') }; });
    chooser($('qed-pop'), $('qed-pick'), S.el.querySelector('[data-view="ed"]'), items, E.id, function (it) { openEdition(it.v, false); }, false);
  }
  function slug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40); }
  function nameSource(btn) {
    var P = (E.data && E.data.providers) || {}, used = {};
    E.data.sources.forEach(function (s) { used[s.key] = 1; });
    var items = Object.keys(P).filter(function (k) { return !used[k]; }).map(function (k) { return { v: k, t: P[k] }; });
    chooser($('qed-pop'), btn, S.el.querySelector('[data-view="ed"]'), items, null, function (it) {
      var key = it.v || slug(it.typed), label = it.v ? P[it.v] : String(it.typed).trim().slice(0, 40);
      if (!key || key.length < 2 || key === 'own') return;
      var have = srcOf(key);
      if (E.pend[ADD]) { E.pend[key] = E.pend[ADD]; delete E.pend[ADD]; }
      if (have) { E.editing[key] = true; E.add = null; } else E.add = { key: key, label: label };
      E.adding = false; paintEd();
    }, true);
  }

  // ── save ─────────────────────────────────────────────────
  function saveEd() {
    if (E.saving || E.pend[ADD] || !pendCount()) return;
    var d = E.data, body = { n: d.edition.id, sources: Object.keys(E.pend).map(function (k) {
      var P = E.pend[k], s = srcOf(k), up = E.upload[k];
      return { source: k, label: s ? s.name : (E.add && E.add.key === k ? E.add.label : k), origin: up ? 'upload' : 'typed', file: up ? up.file : '',
        top: P.top, lines: Object.keys(P.lines).map(function (l) { return { line: l, clicks: P.lines[l] }; }) };
    }) };
    E.saving = true; E.saveErr = ''; paintSave();
    call('/typed', body).then(function () { resetEdits(); loadEdition(); if (E.list) E.list.forEach(function (x) { if (x.id === E.id) x.data = true; }); })
      .catch(function (e) { E.saveErr = W5.notSaved + ((e && e.message) || e); console.error('[Quill Performance] /typed:', e); })
      .then(function () { E.saving = false; paintEd(); });
  }

  // ── the curve (the ⓘ on Views) ────────────────────────────
  function openCurve() {
    var d = E.data, c = d.curve, h = '<h3>' + esc(W5.curveTitle) + '</h3>';
    if (d.rollup) h += '<p>' + esc(W5.curveRoll.replace('{t}', c.top).replace('{b}', c.bottom)) + '</p>';
    else {
      var n = c.positions.length, sh = function (i) { return n <= 1 ? c.top : Math.round((c.top - (c.top - c.bottom) * i / (n - 1)) * 10) / 10; };
      h += '<p>' + W5.curveText.replace('{t}', '<b>' + c.top + '%</b>').replace('{b}', '<b>' + c.bottom + '%</b>').replace('{n}', n) + (c.from === 'links' ? ' ' + esc(W5.curveLinks) : '') + '</p>';
      if (n > 1) {
        var Wd = 700, H = 190, L = 44, R = 14, T = 12, B = 28, x = function (i) { return L + (Wd - L - R) * i / (n - 1); }, y = function (s) { return T + (H - T - B) * (100 - s) / 100; };
        var g = '<svg viewBox="0 0 ' + Wd + ' ' + H + '" width="' + Wd + '" height="' + H + '" role="img" aria-label="The views curve">';
        [0, 25, 50, 75, 100].forEach(function (v) { g += '<line x1="' + L + '" x2="' + (Wd - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#ECE6DA"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="#5A5E66">' + v + '%</text>'; });
        var pts = []; for (var i = 0; i < n; i++) pts.push(x(i) + ',' + y(sh(i)));
        g += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#22252B" stroke-width="2"/>';
        for (i = 0; i < n; i++) g += '<circle cx="' + x(i) + '" cy="' + y(sh(i)) + '" r="3.5" fill="#C4A35A"/>';
        g += '<text x="' + L + '" y="' + (H - 6) + '" font-size="11" fill="#5A5E66">Top of the email</text><text x="' + (Wd - R) + '" y="' + (H - 6) + '" text-anchor="end" font-size="11" fill="#5A5E66">Bottom of the email</text></svg>';
        h += g;
      }
      var by = {}; allLines().forEach(function (Ln) { if (Ln.pos != null && Ln.spot) (by[Ln.pos] = by[Ln.pos] || []).push(Ln.spot); });
      h += '<div class="qed-cl">' + c.positions.map(function (p, i) {
        var s = (by[p] || []).filter(function (v, j, a) { return a.indexOf(v) === j; }).join(', ');
        return '<div><span>' + p + (s ? ' \u00b7 ' + esc(s) : '') + '</span><b>' + sh(i) + '%</b></div>'; }).join('') + '</div>';
    }
    var o = d.ours || { bySender: {}, unnamed: 0 }, bits = Object.keys(o.bySender).map(function (k) { return esc((d.providers[k] || k)) + ' <b>' + fmt(o.bySender[k]) + '</b>'; });
    if (o.unnamed) bits.push(esc(W5.oursUnnamed) + ' <b>' + fmt(o.unnamed) + '</b>');
    h += '<p class="qed-ours"><span class="k">' + esc(W5.oursTitle) + '</span> ' + (bits.length ? bits.join(' \u00b7 ') : esc(W5.oursNone)) + '</p>';
    $('qed-modalc').innerHTML = h; $('qed-modal').hidden = false;
  }

  // ── a provider's report as a file (.csv or .xlsx) ─────────
  function urlKey(u) {                                                     // the same rule as ix-perf's urlKey
    var raw = String(u || '').trim();
    try {
      var x = new URL(raw); if (!/^https?:$/.test(x.protocol)) return raw.toLowerCase().slice(0, 400);
      var q = []; x.searchParams.forEach(function (v, k) { if (!/^utm_/i.test(k)) q.push(k + '=' + v); }); q.sort();
      return (x.host.toLowerCase().replace(/^www\./, '') + x.pathname.replace(/\/+$/, '') + (q.length ? '?' + q.join('&') : '')).slice(0, 400);
    } catch (e) { return raw.toLowerCase().slice(0, 400); }
  }
  function readReport(file) {
    var k = E.upFor; if (!k || !E.data) return;
    var isX = /\.xlsx$/i.test(file.name);
    file.arrayBuffer().then(function (buf) { return isX ? xlsxRows(buf) : csvRows(new TextDecoder('utf-8').decode(buf)); }).then(function (rows) {
      var rep = reportOf(rows), d = E.data;
      E.notes = E.notes.filter(function (n) { return n.src !== k; });
      var note = function (text, bad) { E.notes.push({ src: k, text: file.name + ': ' + text, bad: !!bad }); };
      if (rep.sends == null && rep.opens == null && rep.clicks == null && !rep.links.length) { note(W5.upNothing, true); paintEd(); return; }
      if (rep.po && rep.po !== d.edition.id) note(W5.upWrongPo.replace('{po}', rep.po).replace('{id}', d.edition.id), true);
      E.editing[k] = true; E.upload[k] = { file: file.name };
      ['sends', 'opens', 'clicks'].forEach(function (f) { if (rep[f] != null) setPend(k, f, null, rep[f]); });
      var by = {}; allLines().forEach(function (L) { if (L.url) (by[urlKey(L.url)] = by[urlKey(L.url)] || []).push(L); });
      var sums = {}, loose = 0, looseClicks = 0;
      rep.links.forEach(function (r) {
        var slot = ''; try { slot = new URL(r.url).searchParams.get('utm_content') || ''; } catch (e) {}
        var c = by[urlKey(r.url)] || [], hit = c.filter(function (L) { return L.spot === slot; })[0] || (c.length === 1 ? c[0] : null);
        var key = hit ? hit.key : ((/^[A-Z]{2,4}-b\d{1,3}$/.test(slot) ? slot : '') + ' ' + urlKey(r.url)).slice(0, 480);
        if (!hit) { loose++; looseClicks += r.clicks; }
        sums[key] = (sums[key] || 0) + r.clicks;
      });
      var P = E.pend[k] = E.pend[k] || { top: {}, lines: {} };
      Object.keys(sums).forEach(function (key) { var L = lineByKey(key); if (L) setPend(k, null, key, sums[key]); else { P = E.pend[k] = E.pend[k] || { top: {}, lines: {} }; P.lines[key] = sums[key]; } });
      note(W5.upRead.replace('{n}', rep.links.length) + (loose ? ' ' + W5.upLoose.replace('{n}', loose).replace('{c}', fmt(looseClicks)) : ''), false);
      paintEd();
    }).catch(function (e) { E.notes.push({ src: k, text: file.name + ': ' + W5.upFailed + ((e && e.message) || e), bad: true }); paintEd(); });
  }
  // What a provider's sheet says, wherever it puts it: a label with its number beside or under it, and one row per link.
  var REP_LABELS = { sends: ['delivered', 'totaldelivered', 'emailsdelivered', 'sends', 'sent', 'successfuldeliveries'], opens: ['opens', 'totalopens', 'opened'],   // HC-P-PR5-7
    clicks: ['clicks', 'totalclicks', 'clicked'], po: ['ponumber', 'po', 'purchaseorder'] };
  function reportOf(rows) {
    var out = { sends: null, opens: null, clicks: null, po: '', links: [] };
    var norm = function (s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z%#]/g, ''); };
    var n0 = function (s) { var t = String(s == null ? '' : s).trim(); if (!/^[\d,]+(\.0+)?$/.test(t)) return null; var v = Number(t.replace(/,/g, '')); return isFinite(v) ? Math.round(v) : null; };
    rows.forEach(function (r, ri) {
      var urlAt = -1; r.forEach(function (c, ci) { if (urlAt < 0 && /^https?:\/\//i.test(String(c || '').trim())) urlAt = ci; });
      if (urlAt >= 0) {
        var ck = null; for (var i = urlAt + 1; i < r.length && ck == null; i++) ck = n0(r[i]);
        if (ck != null) out.links.push({ url: String(r[urlAt]).trim(), clicks: ck });
        return;
      }
      r.forEach(function (c, ci) {
        var key = norm(c); if (!key) return;
        Object.keys(REP_LABELS).forEach(function (f) {
          if (REP_LABELS[f].indexOf(key) < 0 || (f === 'po' ? out.po : out[f] != null)) return;
          var beside = r[ci + 1], under = (rows[ri + 1] || [])[ci];
          if (f === 'po') { var p = String(beside || '').trim() || String(under || '').trim(); if (/^[A-Za-z0-9_-]{6,64}$/.test(p)) out.po = p; return; }
          var v = n0(beside); if (v == null) v = n0(under);
          if (v != null) out[f] = v;
        });
      });
    });
    return out;
  }
  function csvRows(text) {
    var rows = [], row = [], cell = '', q = false, i, ch;
    text = text.replace(/^\uFEFF/, '');
    for (i = 0; i < text.length; i++) {
      ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',' || ch === '\t' && text.indexOf(',') < 0) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }
  // An .xlsx is a zip of XML. The browser unpacks it (DecompressionStream); the first sheet is read.
  function xlsxRows(buf) {
    var dv = new DataView(buf), u8 = new Uint8Array(buf), eo = -1, i;
    for (i = u8.length - 22; i >= 0 && i > u8.length - 70000; i--) if (dv.getUint32(i, true) === 0x06054b50) { eo = i; break; }
    if (eo < 0) throw new Error('not an .xlsx file');
    var n = dv.getUint16(eo + 10, true), p = dv.getUint32(eo + 16, true), files = {}, dec = new TextDecoder('utf-8');
    for (i = 0; i < n && dv.getUint32(p, true) === 0x02014b50; i++) {
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      files[dec.decode(u8.subarray(p + 46, p + 46 + nl))] = { method: method, csize: csize, lo: lo };
      p += 46 + nl + xl + cl;
    }
    var get = function (name) {
      var f = files[name]; if (!f) return Promise.resolve('');
      var start = f.lo + 30 + dv.getUint16(f.lo + 26, true) + dv.getUint16(f.lo + 28, true), data = u8.subarray(start, start + f.csize);
      if (f.method === 0) return Promise.resolve(dec.decode(data));
      if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('this browser cannot open .xlsx; save the sheet as .csv'));
      return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    };
    var sheet = Object.keys(files).filter(function (k) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(k); }).sort(function (a, b) { return parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10); })[0];
    if (!sheet) throw new Error('no sheet in this file');
    return Promise.all([get('xl/sharedStrings.xml'), get(sheet)]).then(function (x) {
      var P = new DOMParser(), strings = [];
      if (x[0]) [].forEach.call(P.parseFromString(x[0], 'application/xml').getElementsByTagName('si'), function (si) {
        strings.push([].map.call(si.getElementsByTagName('t'), function (t) { return t.textContent; }).join('')); });
      var rows = [];
      [].forEach.call(P.parseFromString(x[1], 'application/xml').getElementsByTagName('row'), function (r) {
        var row = [];
        [].forEach.call(r.getElementsByTagName('c'), function (c) {
          var ref = c.getAttribute('r') || '', col = 0, m = ref.match(/^[A-Z]+/);
          if (m) { for (var j = 0; j < m[0].length; j++) col = col * 26 + (m[0].charCodeAt(j) - 64); col -= 1; } else col = row.length;
          var t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0], is = c.getElementsByTagName('is')[0];
          var val = t === 's' ? (strings[+((v && v.textContent) || 0)] || '') : t === 'inlineStr' ? (is ? is.textContent : '') : (v ? v.textContent : '');
          row[col] = val;
        });
        for (var j2 = 0; j2 < row.length; j2++) if (row[j2] == null) row[j2] = '';
        rows.push(row);
      });
      return rows;
    });
  }

  // ══════════════════════════════════════════════════════════
  // v1.1.0 — SITE
  // ══════════════════════════════════════════════════════════
  var T = { days: 7, title: null, data: null, err: '', loading: false, seq: 0, open: {} };
  function siteShell() {
    return '<div class="qed-head"><h2 class="qst-h2">Site</h2><span class="qed-sub" id="qst-sub"></span></div>' +
      '<div class="qed-series qst-bar"><span class="lbl">Period</span>' + [7, 28, 90].map(function (dd) { return '<button type="button" class="qed-pill wide" data-days="' + dd + '">Last ' + dd + ' days</button>'; }).join('') +
        '<span class="sp"></span><button type="button" class="qpf-btn" id="qst-refresh">' + esc(W.refresh) + '</button></div>' +
      '<div class="qpf-pop qpf-fpop" id="qst-pop" hidden></div><div id="qst-msgs"></div>' +
      '<div class="qpf-tbl qst-wrap"><table class="qst-t" id="qst-pages"></table><div class="qpf-load qed-load" id="qst-load" hidden><span class="qpf-bar"></span>' + esc(W.reading) + '</div></div>' +
      '<div class="qpf-tbl qst-wrap"><table class="qst-t" id="qst-ads"></table></div>' +
      '<div class="qed-foot">' + esc(W5.siteFoot) + '</div>';
  }
  function wireSite() {
    var v = S.el.querySelector('[data-view="site"]');
    v.addEventListener('click', function (e) {
      var b = e.target.closest('[data-days]'), tb = e.target.closest('#qst-title'), row = e.target.closest('tr[data-kind]');
      if (b) { T.days = +b.getAttribute('data-days'); T.open = {}; loadSite(); return; }
      if (e.target.closest('#qst-refresh')) { loadSite(); return; }
      if (tb) { e.stopPropagation(); chooser($('qst-pop'), tb, v, (T.data.titles || []).map(function (t) { return { v: t.slug, t: t.name, sub: t.slug !== t.name ? t.slug : '' }; }), T.data.title,
        function (it) { T.title = it.v; T.open = {}; loadSite(); }, false); return; }
      if (row) { var k = row.getAttribute('data-kind'); T.open[k] = !T.open[k]; paintSite(); }
    });
    $('qst-pop').addEventListener('click', function (e) { e.stopPropagation(); });
  }
  function loadSite() {
    var my = ++T.seq; T.loading = true; paintSite();
    call('/site?days=' + T.days + (T.title != null ? '&title=' + encodeURIComponent(T.title) : '')).then(function (j) { if (my !== T.seq) return; T.data = j; T.err = ''; })
      .catch(function (e) { if (my !== T.seq) return; T.data = null; T.err = needsWorker((e && e.message) || String(e)); console.error('[Quill Performance] /site:', e); })
      .then(function () { if (my !== T.seq) return; T.loading = false; S.readAt = Date.now(); paintSite(); paintStatus(); });
  }
  function paintSite() {
    var v = S.el.querySelector('[data-view="site"]'); if (!v) return;
    v.querySelectorAll('[data-days]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-days') === T.days); });
    $('qst-load').hidden = !T.loading;
    var d = T.data;
    $('qst-msgs').innerHTML = (T.err ? '<div class="qed-msg err">' + esc(W.failed + T.err) + '</div>' : '') + ((d && d.warnings) || []).map(function (w) { return '<div class="qed-msg warn">' + esc(w) + '</div>'; }).join('');
    if (!d) { $('qst-pages').innerHTML = ''; $('qst-ads').innerHTML = ''; $('qst-sub').textContent = ''; return; }
    var cur = (d.titles || []).filter(function (t) { return t.slug === d.title; })[0];
    $('qst-sub').innerHTML = (d.titles.length > 1 ? '<button type="button" class="qpf-sel qst-title" id="qst-title">' + esc(cur ? cur.name : d.title || W5.noTitle) + '</button>' : '<b>' + esc(cur ? cur.name : W5.noTitle) + '</b>') +
      ' \u00b7 ' + esc(W5.siteSub);
    var cg = '<colgroup><col class="a"><col class="n"><col class="n"><col class="n"><col class="chev"></colgroup>';
    var tp = 0, tc = 0, h = cg + '<tr class="grp"><td colspan="5">Editorial<span>' + esc(W5.sitePages) + '</span></td></tr>' +
      '<tr class="g2"><th>Page</th><th>Pages opened</th><th>Readers</th><th>Clicks</th><th></th></tr>';
    d.pages.forEach(function (p) {
      tp += p.opened; tc += p.clicks;
      h += '<tr class="qpf-r' + (T.open[p.kind] ? ' op' : '') + '" data-kind="' + esc(p.kind) + '"><td>' + esc(p.name) + '</td><td>' + fmt(p.opened) + '</td><td>' + fmt(p.readers) + '</td><td>' + fmt(p.clicks) + '</td><td class="chev"><i></i></td></tr>';
      if (T.open[p.kind]) h += p.paths.map(function (x) { return '<tr class="pth"><td title="' + esc(x.path) + '">' + esc(x.path || '\u2013') + '</td><td>' + fmt(x.opened) + '</td><td>' + fmt(x.readers) + '</td><td>' + fmt(x.clicks) + '</td><td></td></tr>'; }).join('');
    });
    if (!d.pages.length) h += '<tr class="qed-none"><td colspan="5">' + esc(W5.siteNone) + '</td></tr>';
    else h += '<tr class="sub"><td>Editorial total</td><td>' + fmt(tp) + '</td><td>' + fmt(d.readers) + '</td><td>' + fmt(tc) + '</td><td></td></tr>';
    $('qst-pages').innerHTML = h;
    var tv = 0, ac = 0;
    h = cg + '<tr class="grp"><td colspan="5">Revenue<span>' + esc(W5.siteAds) + '</span></td></tr><tr class="g2"><th>Advertiser</th><th class="l">Placement</th><th>Views</th><th>Clicks</th><th></th></tr>';
    d.ads.forEach(function (a) { tv += a.views; ac += a.clicks; h += '<tr><td title="' + esc(a.name) + '">' + esc(a.name) + '</td><td class="l">' + esc(a.placement) + '</td><td>' + fmt(a.views) + '</td><td>' + fmt(a.clicks) + '</td><td></td></tr>'; });
    if (!d.ads.length) h += '<tr class="qed-none"><td colspan="5">' + esc(W5.siteNoAds) + '</td></tr>';
    else h += '<tr class="sub"><td>Revenue total</td><td></td><td>' + fmt(tv) + '</td><td>' + fmt(ac) + '</td><td></td></tr>';
    $('qst-ads').innerHTML = h;
  }
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function dLong(d) { var p = String(d).split('-'), t = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); return DOW[t.getUTCDay()] + ' ' + (+p[2]) + ' ' + MON[+p[1] - 1] + ' ' + p[0]; }

  // ── helpers ──────────────────────────────────────────────
  function fmt(n) { return n == null ? '' : Number(n).toLocaleString('en-US'); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
})();
