/* ta-obligations-v1.0.0.js
   ════════════════════════════════════════════════════════════════
   INBXIFY · TA Studio · the Obligations tab (read-only)

   v1.0.0 (23 Nov 2026, Publisher Portal S12 · Build 2) — FIRST BUILD, from the accepted canvas "Obligations in the Revenue tab ·
   Build 2 mockup v0.1" (frame 4, TA Studio Obligations tab, Portal look) and ruling 12 of 23 Nov (S11).
     · The title's sales records in one ix-table (v1.0.0): Customer, Product, Runs, Remaining ("7 of 12"), Status, chevron.
       Filters on Customer and Status (ix-table's own filter row). Read-only: "Open in Publisher Portal ↗" for every edit.
     · An opened row shows the record's sends as tiles, one per send, month order: Ran · <issue>, Planned · <issue>, Due now,
       not placed (coral edge), Missed, Missed and made good, To come. Its card links to the Portal for Edit and Make good.
     · A franchise sponsor's Remaining is red, with its end month, when the sends left are at or under ix-sales renewSends
       (ruling 9, the same threshold the IPP's Sponsors pill uses).
     · The title row is IxHeader.titleRow: "Obligations", the ⓘ, "Sales for this newsletter. Read-only here.", the Portal link,
       Refresh last (TA Reskin S1). Portal-look tokens only.
   WHERE IT DRAWS: the Webflow tab pane named Obligations (data-w-tab, case ignored), into a mount it adds (#ta-ob-mount). The
   pane is first on the rail (Jeff set the order in the Designer). It reads when the tab is first shown.
   READS (ix-sales, the page's Memberstack login, TA_CONFIG.salesUrl as client-manager and Ad Maker):
     GET /sales?publisher=<id>                 the records; those that name this title are listed
     GET /revenue?title=<TITLES-ADMIN id>       renewSends, the red threshold (absent: 2, as ix-sales)
     GET /obligations?publisher=<id>&sales=<id> a record's sends, when its row is first opened
   It computes no rule: Qty, Remaining, the board counts, each send's state come from ix-sales, as on the Portal.
   NEEDS: ix-table v1.0.0 (+ CSS), ix-header v1.1.0 (titleRow, onRefresh), ix-info v1.0.2, ix-sales v1.3.14, TA_CONFIG
   salesUrl, taItemId and the publisher (TA_CONFIG.publisherId, else #title-admin-id data-pub). Companion: ta-obligations-v1.0.0.css.
   HARDCODING (provisional): HC-P-TOB1-1 the tab name 'Obligations' the pane is found by; HC-P-TOB1-2 the words (W); HC-P-TOB1-3
   the Portal link /publisher/{slug}#obligations (TA_CONFIG.publisherRoute, as ta-chrome); HC-P-TOB1-4 the renewal default 2
   when ix-sales does not answer it (the same default as ix-sales HC-P-PP11-2).
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.TaObligations) return;
  var VERSION = '1.0.0', FILE = 'ta-obligations-v' + VERSION + '.js';
  var TAB = 'obligations';                                                  // HC-P-TOB1-1
  var MOUNT_ID = 'ta-ob-mount';
  var RENEW_DEFAULT = 2;                                                    // HC-P-TOB1-4
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var W = {                                                                 // HC-P-TOB1-2
    title: 'Obligations', status: 'Sales for this newsletter. Read-only here.', portal: 'Open in Publisher Portal ↗',
    cardLink: 'Edit or make good in the Publisher Portal ↗', reading: 'Reading sales…', readingSends: 'Reading the sends…',
    none: 'No sales record names this newsletter yet. Sales are entered in the Publisher Portal.',
    noMatch: 'No sales records match these filters.', noSends: 'No live sends on this record.',
    noUrl: 'TA_CONFIG.salesUrl is not set, so the sales cannot be read.', noPub: 'This page names no publisher (TA_CONFIG.publisherId or #title-admin-id data-pub), so the sales cannot be read.',
    noTitle: 'TA_CONFIG.taItemId is not set, so this newsletter’s sales cannot be picked out.', noLogin: 'No Memberstack login on this page, so ix-sales cannot be asked.',
    failed: 'The sales could not be read: {msg}', sendsFailed: 'The sends could not be read: {msg}'
  };
  var S = { mounted: false, loaded: false, loading: false, err: '', rows: [], renew: RENEW_DEFAULT, obs: {}, obErr: {}, obBusy: {}, table: null, seq: 0 };

  function CFG() { return window.TA_CONFIG || {}; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fill(t, o) { return String(t).replace(/\{(\w+)\}/g, function (_, k) { return o[k] == null ? '' : o[k]; }); }
  function salesUrl() { return String(CFG().salesUrl || '').replace(/\/+$/, ''); }
  function titleId() { return String(CFG().taItemId || '').trim(); }
  function publisherId() {
    var c = String(CFG().publisherId || '').trim(); if (/^[0-9a-f]{24}$/.test(c)) return c;
    var el = document.querySelector('#title-admin-id[data-pub]'), v = el ? String(el.getAttribute('data-pub') || '').trim() : '';
    return /^[0-9a-f]{24}$/.test(v) ? v : '';
  }
  function publisherSlug() {                                                // the same chain ta-chrome reads
    var hosts = [document.querySelector('#title-admin-id'), document.querySelector('.ta-item'), document.querySelector('[data-publisher-slug]')];
    for (var i = 0; i < hosts.length; i++) {
      var h = hosts[i]; if (!h) continue;
      var v = String(h.getAttribute('data-publisher-slug') || h.getAttribute('data-publisherslug') || h.getAttribute('data-pub-slug') || '').trim();
      if (v && !/^[0-9a-f]{24}$/.test(v)) return v;
    }
    return '';
  }
  function portalHref() {                                                   // HC-P-TOB1-3
    var slug = publisherSlug(); if (!slug) return '';
    return String(CFG().publisherRoute || '/publisher/{slug}').replace('{slug}', encodeURIComponent(slug)) + '#obligations';
  }
  function mmddyy(ym, end) {
    var m = /^(\d{4})-(\d{2})/.exec(String(ym || '')); if (!m) return '';
    var y = +m[1], mo = +m[2], d = end ? new Date(y, mo, 0).getDate() : 1;
    return String(mo).padStart(2, '0') + '/' + String(d).padStart(2, '0') + '/' + String(y).slice(-2);
  }
  function monS(ym) { var m = /^(\d{4})-(\d{2})/.exec(String(ym || '')); return m ? MON[+m[2] - 1] + ' ’' + m[1].slice(2) : ''; }

  // ── the pane ──
  function paneEl() {
    var ps = document.querySelectorAll('.w-tab-pane[data-w-tab]');
    for (var i = 0; i < ps.length; i++) if (String(ps[i].getAttribute('data-w-tab')).trim().toLowerCase() === TAB) return ps[i];
    return null;
  }
  function linkEls() {
    return Array.prototype.filter.call(document.querySelectorAll('.w-tab-link[data-w-tab]'), function (l) { return String(l.getAttribute('data-w-tab')).trim().toLowerCase() === TAB; });
  }
  function mountEl() {
    var m = document.getElementById(MOUNT_ID); if (m) return m;
    var p = paneEl(); if (!p) return null;
    m = document.createElement('div'); m.id = MOUNT_ID; m.className = 'ix-own ta-ob';
    p.appendChild(m);
    return m;
  }

  // ── ix-sales ──
  function memberToken() {
    return new Promise(function (res) {
      var n = 0;
      (function wait() {
        var ms = window.$memberstackDom;
        if (ms && ms.getMemberCookie) { Promise.resolve(ms.getMemberCookie()).then(function (t) { res(t || ''); }, function () { res(''); }); return; }
        if (++n > 40) { res(''); return; }
        setTimeout(wait, 150);
      })();
    });
  }
  function api(path, label) {
    return memberToken().then(function (tok) {
      if (!tok) throw new Error(W.noLogin);
      return fetch(salesUrl() + path, { headers: { Authorization: 'Bearer ' + tok }, cache: 'no-store', credentials: 'omit', ixLabel: label });
    }).then(function (r) {
      return r.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) { j = null; } if (!j || j.ok !== true) throw new Error((j && j.error) || ('ix-sales answered HTTP ' + r.status)); return j; });
    });
  }
  function load() {
    if (!salesUrl()) { S.err = W.noUrl; S.loaded = true; draw(); return Promise.resolve(); }
    var pub = publisherId(), ta = titleId();
    if (!pub) { S.err = W.noPub; S.loaded = true; draw(); return Promise.resolve(); }
    if (!ta) { S.err = W.noTitle; S.loaded = true; draw(); return Promise.resolve(); }
    var seq = ++S.seq; S.loading = true; S.err = '';
    if (S.table) S.table.loading(true);
    return Promise.all([
      api('/sales?publisher=' + encodeURIComponent(pub), 'Reading sales'),
      api('/revenue?title=' + encodeURIComponent(ta), 'Reading the renewal line').catch(function () { return null; })
    ]).then(function (r) {
      if (seq !== S.seq) return;
      var mine = (r[0].sales || []).filter(function (x) { return (x.titles || []).some(function (t) { return t.id === ta; }); });
      S.rows = mine; S.renew = r[1] && Number.isInteger(r[1].renewSends) ? r[1].renewSends : RENEW_DEFAULT;
      S.obs = {}; S.obErr = {}; S.obBusy = {};
    }).catch(function (e) {
      if (seq !== S.seq) return;
      S.err = fill(W.failed, { msg: (e && e.message) || e }); S.rows = [];
    }).then(function () {
      if (seq !== S.seq) return;
      S.loading = false; S.loaded = true; draw();
    });
  }
  function loadSends(r) {
    if (S.obBusy[r.id] || S.obs[r.id]) return;
    S.obBusy[r.id] = true;
    api('/obligations?publisher=' + encodeURIComponent(publisherId()) + '&sales=' + encodeURIComponent(r.id), 'Reading the sends of ' + r.name).then(function (j) {
      S.obs[r.id] = j.obligations || []; delete S.obErr[r.id];
    }, function (e) { S.obErr[r.id] = fill(W.sendsFailed, { msg: (e && e.message) || e }); }).then(function () {
      delete S.obBusy[r.id];
      if (S.table) S.table.setRows(viewRows());
    });
  }

  // ── what a row says (every count from ix-sales) ──
  function needsYou(r) { var b = r.board || {}; return (b.missed || 0) > 0 || (r.status === 'Active' && ((b.due || 0) > 0 || !!(r.pace && r.pace.behind))); }
  function endsSoon(r) { return !!r.franchiseId && r.status === 'Active' && (r.remaining || 0) <= S.renew; }
  function viewRows() {
    return S.rows.map(function (r) {
      var st = needsYou(r) ? 'Needs you' : r.status === 'Ended' ? 'Ended' : 'Active';
      return { id: r.id, r: r, customer: r.customer || 'Customer',
        product: r.franchise ? 'Franchise Sponsor · ' + r.franchise : (r.product || ''),
        runs: mmddyy(r.runFrom || r.startMonth) + ' – ' + mmddyy(r.runTo || r.runFrom || r.startMonth, true), runKey: String(r.runFrom || r.startMonth || ''),
        status: st, soon: endsSoon(r) };
    });
  }
  function remainingHtml(v) {
    var r = v.r, t = (r.remaining || 0) + ' of ' + (r.qty || 0);
    if (r.missedOwed) t += ' (' + r.missedOwed + ' missed)';
    if (v.soon) t += ' · ends ' + (monS(r.runTo) || 'soon');
    return '<span class="ta-ob-rem' + (v.soon ? ' is-soon' : '') + '" title="' + esc(t) + '">' + esc(t) + '</span>';
  }
  function tile(o) {
    var cls, w;
    if (o.status === 'Missed') { if (o.madeGoodBy) { cls = 'madegood'; w = 'Missed, made good'; } else { cls = 'missed'; w = 'Missed'; } }
    else if (o.state === 'ran') { cls = 'ran'; w = 'Ran' + (o.edition ? ' · ' + o.edition : ''); }
    else if (o.state === 'planned') { cls = 'planned'; w = 'Planned' + (o.edition ? ' · ' + o.edition : ''); }
    else if (o.state === 'due') { cls = 'due'; w = o.dueBy ? 'Due by ' + o.dueBy : 'Due now, not placed'; }
    else { cls = 'tocome'; w = 'To come'; }
    return '<div class="ta-ob-tile is-' + cls + '" title="' + esc(o.name + ': ' + w) + '"><b>' + esc(monS(o.dueMonth)) + (o.makeGoodOf ? ' · make good' : '') + '</b><span>' + esc(w) + '</span></div>';
  }
  function expand(v) {
    var r = v.r, b = r.board || {}, n = (b.ran || 0) + (b.planned || 0) + (b.due || 0) + (b.missed || 0) + (b.toCome || 0);
    var sub = [(b.ran || 0) + ' of ' + n + ' ran', b.planned ? b.planned + ' planned' : '', b.due ? b.due + ' due now' : '', b.missed ? b.missed + ' missed' : '', b.toCome ? b.toCome + ' to come' : ''].filter(Boolean).join(' · ');
    var href = portalHref();
    var obs = S.obs[r.id], body;
    if (S.obErr[r.id]) body = '<p class="ta-ob-msg is-bad">' + esc(S.obErr[r.id]) + '</p>';
    else if (!obs) { loadSends(r); body = '<p class="ta-ob-msg">' + esc(W.readingSends) + '</p>'; }
    else {
      var live = obs.filter(function (o) { return o.status !== 'Cancelled'; }).sort(function (a, c) { return String(a.dueMonth).localeCompare(String(c.dueMonth)) || String(a.name).localeCompare(String(c.name)); });
      body = live.length ? '<div class="ta-ob-tiles">' + live.map(tile).join('') + '</div>' : '<p class="ta-ob-msg">' + esc(W.noSends) + '</p>';
    }
    return IxTable.panel({ title: r.name, sub: sub, action: href ? '<a class="ta-ob-link" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(W.cardLink) + '</a>' : '', body: body });
  }

  // ── drawing ──
  function info() {
    return { file: FILE, version: VERSION, title: W.title,
      blurb: 'The sales records that name this newsletter, read-only. A send is one newsletter edition. Remaining counts the sends not yet run, a missed send with no make good included. ' +
        'A franchise sponsor turns red when its sends left are at or under the renewal line. Open a row to see every send. Edits, cancels and make goods are made in the Publisher Portal.',
      scenarios: [], companions: 'ta-obligations-v1.0.0.css · ix-table v1.0.0 · ix-header v1.1.0 · pathways: ix-sales v1.3.14 GET /sales, /revenue (renewSends), /obligations' };
  }
  function head() {
    var href = portalHref();
    var act = href ? '<a class="ix-btn ix-btn--secondary ta-ob-portal" href="' + esc(href) + '" target="_blank" rel="noopener">' + esc(W.portal) + '</a>' : '';
    if (window.IxHeader && typeof IxHeader.titleRow === 'function') return IxHeader.titleRow({ title: W.title, info: info(), status: W.status, actions: act ? [act] : [], refresh: 'ta-obligations' });
    return '<div class="ta-ob-head"><h2>' + esc(W.title) + '</h2><span>' + esc(W.status) + '</span>' + act + '</div>';
  }
  function draw() {
    var el = mountEl(); if (!el) return;
    if (!el.querySelector('.ta-ob-body')) {
      el.innerHTML = head() + '<div class="ta-ob-note" hidden></div><div class="ta-ob-body"></div>';
      if (window.IxHeader && typeof IxHeader.onRefresh === 'function' && !S.refreshOn) { S.refreshOn = true; IxHeader.onRefresh('ta-obligations', function () { return load(); }); }
    }
    var note = el.querySelector('.ta-ob-note'), body = el.querySelector('.ta-ob-body');
    note.hidden = !S.err; note.textContent = S.err || '';
    if (!window.IxTable) { body.innerHTML = '<p class="ta-ob-msg is-bad">ix-table is not on this page (ix-table-v1.0.0.js), so the sales cannot be listed.</p>'; return; }
    if (!S.table) {
      S.table = IxTable.create(body, {
        id: 'ta-obligations', noun: ['sales record', 'sales records'], zebra: false, pageSize: 25,
        sort: { key: 'customer', dir: 'asc' },
        columns: [
          { key: 'customer', label: 'Customer', w: 160, type: 'strong', filter: true, sortable: true },
          { key: 'product', label: 'Product', w: 160, type: 'text' },
          { key: 'runs', label: 'Runs', w: 85, type: 'text', value: function (v) { return v.runKey; }, sortable: true },
          { key: 'remaining', label: 'Remaining', w: 80, type: 'html', html: remainingHtml, text: function (v) { return (v.r.remaining || 0) + ' of ' + (v.r.qty || 0); } },
          { key: 'status', label: 'Status', w: 52, type: 'pill', filter: true, pill: function (v) { return { name: v.status === 'Needs you' ? 'fail' : v.status === 'Ended' ? 'ended' : 'active', text: v.status }; }, value: function (v) { return v.status; } }
        ],
        rows: [], expand: expand,
        words: { empty: S.err ? S.err : W.none, noMatch: W.noMatch }
      });
    }
    if (!S.loaded || S.loading) S.table.loading(true);
    else S.table.setRows(viewRows());
  }

  // ── mount: when the tab is shown ──
  function open() {
    if (!mountEl()) return;
    if (!S.mounted) { S.mounted = true; draw(); load(); return; }
    draw();
  }
  function wire() {
    linkEls().forEach(function (l) { l.addEventListener('click', function () { setTimeout(open, 0); }); });
    var p = paneEl(); if (p && p.classList.contains('w--tab-active')) open();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  window.TaObligations = { version: VERSION, open: open, refresh: load, _state: function () { return S; } };
})();
