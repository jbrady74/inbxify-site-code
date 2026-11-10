// ps-ads-v1.0.4.js
// ============================================================
// INBXIFY · Publisher Portal · the Ads tab
//
// v1.0.4 (10 Nov 2026, Publisher Portal S8, live test, mockup v0.11 accepted) — THE OPEN ROW IS THREE COLUMNS.
//   Current versions (fixed, one card per shape, never replaced) · Pending versions (every version in play, each card
//   carrying its own actions; the approval link box at the top: "good until, Copy link", with "Not opened yet" /
//   "Opened <date>" under it) · Other versions (Approved, in inventory; Archived). The rail, the per-shape view
//   switch, the "back to current" link and the "N versions need you" line are gone. Words: approver shown by name
//   (member name, else the address); the live card says "Running since <date>" only when the run log has it, and
//   "Approved by <who>, <date>" only when a record exists. CSS v1.0.4.
// v1.0.3 (10 Nov 2026, Publisher Portal S8, live test step 7) — After Save the left column stays on the versions it
//   was showing (the view no longer resets to current), so an Ask does not look like a switch. CSS v1.0.3 (no change).
// v1.0.2 (10 Nov 2026, Publisher Portal S8, live test step 7) — After an Ask saves, the message is shown on the page
//   (subject, body, Open in my mail program, Copy) instead of a hidden mailto click the browser blocks. CSS v1.0.2.
// v1.0.1 (10 Nov 2026, Publisher Portal S8, live test) — Jeff's rulings on the open row: the left column is headed
//   "Current versions"; the rail's Current tile shows only while some shape is viewing a non-current version (it is the
//   way back); rail tile counts and the row's needs-you line count per shape ("Banner 1 · Sidebar 1"). CSS v1.0.1.
// v1.0.0 (10 Nov 2026, Publisher Portal S8 · Ads Tab Build) — FIRST BUILD,
//   from portal Ads mockup v0.10 and the S7 and S8 rulings.
//
// WHAT IT SHOWS
//   One table: every customer of the publisher, one column per shape
//   (Banner, Sidebar, Splash, Text ad). A cell says whose move it is
//   (You, Advertiser, inbxify), a green dot when the shape is live, a
//   dash when the shape is not sold. Filter pills: Needs you, With
//   advertiser, With inbxify, plus a name search. A row opens to four
//   shape cards (the version being looked at, its picture, a plain
//   sentence on its state, its choices) and a right rail of four tiles:
//   Current versions, In-process versions, Approved ready to run, Other
//   versions (the archive).
//
// STAGING AND SAVE (the standing editing rule)
//   Every choice is staged, never written on the click. A staged version
//   keeps a gold border wherever it shows (card frame, rail tile) with a
//   small Cancel link of its own; the save bar lists every staged change
//   and has Cancel (puts everything back) and Save. A send-back needs its
//   note before Save enables. Save sends one ix-sales call per staged
//   decision (POST /ads/<id>/decide) and one per customer for the ads
//   marked Ask the advertiser (POST /ads/ask), then opens the publisher's
//   own email program with the subject and message filled in and the To
//   line blank (S8 ruling: inbxify never knows the advertiser's address).
//   Staff see the save steps as they run; members see one line.
//
// DATA
//   One read: ix-sales GET /ads?publisher=<id> (v1.3.1), which merges
//   ix-issue-data's versions, the sold shapes and PUBLISHER REVIEWS. Every
//   version arrives with its state; this file only draws. States:
//   current, needs, answered (the advertiser answered; your OK decides),
//   adv (out with the advertiser), back (sent back to inbxify), ready
//   (approved, waiting), earlier (ran before, or archived; stale when the
//   last run is six months or more ago, or unknown).
//
// HARDCODING (provisional ids, for the tracker)
//   HC-P-PP8-7  W: every word on the tab, in one object.
//   HC-P-PP8-8  SH / SHN: the four shapes and their labels (the same set
//               ix-sales ADS_TAB.shapes carries; the tab trusts ix-sales's
//               shapes[] when it answers them).
//   The six-month rule and the 14-day link life come from ix-sales.
//   CSS: ps-ads-v1.0.4.css. Needs ps-shell v1.0.3+ (ctx.api, ctx.info,
//   ctx.placeholder), ix-sales v1.3.1, ix-info, ix-success-toast.
// ============================================================
(function () {
  'use strict';
  var VERSION = '1.0.4', FILE = 'ps-ads-v' + VERSION + '.js';
  var SH = ['banner', 'sidebar', 'splash', 'text'];                        // HC-P-PP8-8
  var SHN = { banner: 'Banner', sidebar: 'Sidebar', splash: 'Splash', text: 'Text ad' };
  var W = {                                                              // HC-P-PP8-7
    title: 'Ads',
    search: 'Find a customer',
    pills: { you: 'Needs you', adv: 'With advertiser', ix: 'With inbxify' },
    pillOn: 'Show every customer again', pillOff: 'Show only these',
    own: { you: 'You', adv: 'Advertiser', ix: 'inbxify' },
    tip: { you: 'Your move: approve, hold, send back or ask the advertiser', adv: 'Waiting on the advertiser',
           ix: 'inbxify\u2019s move: making or fixing this ad', ok: 'Approved and running', dash: 'Not sold' },
    cols: { customer: 'Customer' },
    emptyAll: 'No customers yet. A customer shows here once one of your titles, ads or sales records names it.',
    emptyQ: 'No customer matches that name.',
    emptyYou: 'Nothing needs you right now.', emptyAdv: 'Nothing is out with an advertiser.', emptyIx: 'Nothing is with inbxify.',
    badge: { you: 'Needs you', adv: 'With advertiser', ix: 'With inbxify', ok: 'This one is live', ready: 'Approved, ready to run', earlier: 'Earlier' },
    notSold: 'Not sold to {name}',
    backTo: 'Back to the current {shape}',
    noneYet: 'No {shape} yet. inbxify is making one.',
    noRun: 'No {shape} is running for {name} yet.',
    meta: {
      current: 'Live on the site now.', currentBy: ' Approved by {by}, {on}.',
      currentUnknown: ' Approved before the portal kept a record.',
      needs: 'New version, waiting for your OK.', needsMade: 'Made {on}.',
      answered: '{who} answered on {on}: {answer}{more} It runs once you approve it.',
      ansOk: 'approved it.', ansChange: 'asked for changes.',
      adv: 'With the advertiser. You can still decide now.',
      opened: 'opened {on}', notOpened: 'not opened yet',
      back: 'Sent back by {by}, {on}: {note} inbxify is making a new version.',
      ready: 'Approved and held{by}. Not running yet.', readyBy: ' by {by}, {on}',
      earlier: 'Ran {from} to {to}.', earlierTo: 'Ran until {to}.', earlierUnknown: 'Ran before the portal kept dates.',
      archived: ' Archived.',
      stale: 'Last ran {ago}. Prices, dates or the offer may have changed, so it comes back through Needs you for a fresh OK.',
      agoMonths: '{n} months ago', agoUnknown: 'at an unknown date'
    },
    act: { current: 'Approve and make current', hold: 'Approve and hold', ask: 'Ask the advertiser', back: 'Send back',
           make: 'Make current', makeAgain: 'Make current again', restore: 'Restore and hold', review: 'Restore for review' },
    onSave: 'On save: {what}',
    cancel: 'Cancel',
    askNote: 'Every ad you mark this way for {name} goes in one link, good for {days} days. Save opens your email with the link; you add the address.',
    noteLabel: 'What should change? inbxify sees this note.',
    notePh: 'For example: use the new logo, make the phone number bigger',
    noteNeed: 'Add a note before you save.',
    waiting: '{n} new version needs you', waitingN: '{n} new versions need you',
    rail: { current: 'Current versions', process: 'Pending versions', ready: 'Approved, in inventory', other: 'Other versions', archived: 'Archived' },
    colNone: { process: 'Nothing pending.', ready: 'None in inventory.', archived: 'None archived.' },
    railNone: 'Nothing is live for {name} yet.', railNoneProcess: 'Nothing in process.',
    railReady: 'Approved and waiting. Open one to make it current.', railOther: 'Ads that ran before, kept for reuse. Open one to bring it back.',
    none: 'None yet.',
    groups: { needs: 'Needs you', adv: 'With the advertiser', back: 'With inbxify, sent back' },
    linkOut: 'Approval link out: good until {until}', linkOpened: 'Opened {on}', linkNotOpened: 'Not opened yet', copyLink: 'Copy link', copied: 'Link copied.', copyFail: 'Could not copy. The link is: {url}',
    answeredBox: '{who} answered on {on}.',
    save: { n1: '1 change to save', n: '{n} changes to save', need: 'A send-back needs a note.', save: 'Save', saving: 'Saving your changes\u2026',
            steps: ['Checking your login', 'Saving the approvals', 'Pointing the site at the new ads', 'Making the advertiser links', 'Confirming each one was written'],
            line: '{name}, {shape}: {what}' },
    saved: '{n} saved.', savedOne: '1 change saved.', savedPart: '{ok} saved, {bad} not saved. {msg}',
    emailOpen: 'Your email is opening with the link for {name}. Add the address and send.',
    emailFail: 'Could not open your email. Copy this message to {name}: {subject} \u2014 {body}',
    unconfirmed: 'Saved, but Webflow did not confirm: {list}. Reload to check.',
    loadFail: 'The ads could not be read: {msg}',
    mail: { head: 'Your message to {name}', subject: 'Subject', open: 'Open in my mail program', copy: 'Copy subject and message', copied: 'Message copied.', close: 'Done', note: 'To is left blank: add the advertiser\u2019s address. The link in the message is also under In-process versions.' },
    api: { ads: 'Reading your ads', decide: 'Saving {what}', ask: 'Making the link for {name}' }
  };
  var CHEV = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  var ctx, el, S;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function fill(t, o) { return String(t).replace(/\{(\w+)\}/g, function (_, k) { return o[k] == null ? '' : o[k]; }); }
  function day(v) { if (!v) return ''; var d = new Date(v); if (isNaN(d)) return String(v).slice(0, 10); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  function who(s) { if (!s) return 'inbxify'; var me = ctx.who || {}; if (me.email && String(s).toLowerCase() === String(me.email).toLowerCase() && me.name) return me.name; return s; }   // v1.0.4: the signed-in member by name
  function toast(msg, v, key) { if (window.IxToast) window.IxToast.show(msg, v, { key: 'ps-ads:' + key }); else console.log('[ps-ads]', msg); }

  // ── data shape helpers ──────────────────────────────────────
  function cust(id) { return S.customers.find(function (c) { return c.id === id; }); }
  function vOf(c, sh) { return c.shapes[sh].versions; }
  function curOf(c, sh) { var id = c.shapes[sh].current; return vOf(c, sh).find(function (v) { return v.id === id; }) || null; }
  function findV(id) { for (var i = 0; i < S.customers.length; i++) { var c = S.customers[i]; for (var j = 0; j < SH.length; j++) { var v = vOf(c, SH[j]).find(function (x) { return x.id === id; }); if (v) return { v: v, c: c, sh: SH[j] }; } } return null; }
  function vOwn(v) { return ({ needs: 'you', answered: 'you', adv: 'adv', back: 'ix' })[v.state] || null; }
  function owners(c, sh) {
    var vs = vOf(c, sh), o = [];
    var has = function (st) { return vs.some(function (v) { return v.state === st; }); };
    if (has('needs') || has('answered')) o.push('you');
    if (has('back') || (!curOf(c, sh) && c.shapes[sh].sold && !has('needs') && !has('answered') && !has('adv'))) o.push('ix');
    if (has('adv')) o.push('adv');
    if (o.length) return o;
    return [curOf(c, sh) ? 'ok' : 'dash'];
  }
  function cellState(c, sh) { return owners(c, sh)[0]; }
  function mark(st) {
    if (st === 'dash') return '<i class="ps-ad-dash" aria-hidden="true"></i>';
    if (st === 'ok') return '<i class="ps-ad-dot" aria-hidden="true"></i>';
    return '<span class="ps-ad-own o-' + st + '">' + esc(W.own[st]) + '</span>';
  }
  function counts() {
    var n = { you: 0, adv: 0, ix: 0 };
    S.customers.forEach(function (c) { var s = []; SH.forEach(function (sh) { s = s.concat(owners(c, sh)); }); Object.keys(n).forEach(function (k) { if (s.indexOf(k) >= 0) n[k]++; }); });
    return n;
  }
  function rows() {
    var q = S.q.trim().toLowerCase();
    return S.customers.filter(function (c) {
      if (q && c.name.toLowerCase().indexOf(q) < 0) return false;
      if (!S.filter) return true;
      var s = []; SH.forEach(function (sh) { s = s.concat(owners(c, sh)); });
      return s.indexOf(S.filter) >= 0;
    });
  }
  function viewing(c, sh) {
    var id = S.view[c.id + '|' + sh], v = id && vOf(c, sh).find(function (x) { return x.id === id; });
    if (v) return v;
    var vs = vOf(c, sh), order = ['needs', 'answered', 'adv', 'back', 'ready'];
    if (curOf(c, sh)) return curOf(c, sh);
    for (var i = 0; i < order.length; i++) { var f = vs.find(function (x) { return x.state === order[i]; }); if (f) return f; }
    return vs[0] || null;
  }
  function art(v, sh, th) {
    var p = v.picture || '';
    if (/^https?:\/\//.test(p)) return '<img class="ps-ad-img' + (th ? ' th' : '') + '" src="' + esc(p) + '" alt="' + esc(SHN[sh] + ': ' + v.name) + '" loading="lazy">';
    return '<div class="ps-ad-textad' + (th ? ' th' : '') + '"><b>' + esc(v.name) + '</b><div>' + esc(p) + '</div></div>';
  }
  function agoWords(v) { return v.monthsAgo == null ? W.meta.agoUnknown : fill(W.meta.agoMonths, { n: v.monthsAgo }); }
  function metaFor(v, c) {
    var d = v.decided || {}, L = v.link || {};
    switch (v.state) {
      case 'current': return [v.ranFrom ? fill(W.meta.runningSince, { on: day(v.ranFrom) }) : '', d.at ? fill(W.meta.currentBy, { by: esc(who(d.by)), on: day(d.at) }) : ''].filter(Boolean).join(' ');
      case 'needs': return W.meta.needs + (v.createdOn ? ' ' + fill(W.meta.needsMade, { on: day(v.createdOn) }) : '');
      case 'answered': return fill(W.meta.answered, { who: esc(L.answeredBy || 'The advertiser'), on: day(L.answeredAt), answer: L.answer === 'approve' ? W.meta.ansOk : W.meta.ansChange,
        more: L.answer === 'change' ? ' <q>' + esc([L.like && ('Likes: ' + L.like), L.change && ('Change: ' + L.change)].filter(Boolean).join(' ')) + '</q>' : '' });
      case 'adv': return W.meta.adv;   // v1.0.4: the link box above carries the dates
      case 'back': var b = v.sentBack || {}; return fill(W.meta.back, { by: esc(who(b.by)), on: day(b.at), note: b.note ? '<q>' + esc(b.note) + '</q>' : '' });
      case 'ready': return fill(W.meta.ready, { by: d.at ? fill(W.meta.readyBy, { by: esc(who(d.by)), on: day(d.at) }) : '' });
      case 'earlier': return (v.ranFrom && v.ranTo ? fill(W.meta.earlier, { from: day(v.ranFrom), to: day(v.ranTo) }) : v.ranTo ? fill(W.meta.earlierTo, { to: day(v.ranTo) }) : W.meta.earlierUnknown) + (v.archived ? W.meta.archived : '');
    }
    return '';
  }
  function stagedWhat(g, v) { return g.act === 'make' && v.state === 'earlier' ? W.act.makeAgain : W.act[g.act]; }

  // ── drawing ─────────────────────────────────────────────────
  function info() {
    return ctx.info({ file: FILE, version: VERSION, title: W.title,
      blurb: 'Every customer\u2019s ads by shape, whose move each one is, and the versions behind it. Choices are staged (gold) until Save. Reads: ix-sales GET /ads?publisher= (versions from ix-issue-data /customer-ads, sold shapes from sales records, links and decisions from PUBLISHER REVIEWS). Saves: ix-sales POST /ads/<id>/decide (Scenario G for approvals, 114 for current ads, each echo checked; every decision logged in PUBLISHER REVIEWS) and POST /ads/ask (one PUBLISHER REVIEWS row per link; the email opens in your own mail program). Run dates come from ADS Run Log, written by 114 through ix-sales /run-log.',
      scenarios: ['G', '114'], companions: 'ps-ads-v1.0.4.css \u00b7 ps-shell v' + (window.PsShell ? window.PsShell.version : '?') + ' \u00b7 ix-sales v1.3.1 \u00b7 ix-issue-data v1.0.172' });
  }
  function renderFilters() {
    var n = counts();
    return '<div class="ps-ad-bar">' + ['you', 'adv', 'ix'].map(function (k) {
      var on = S.filter === k;
      return '<button type="button" class="ps-ad-pill p-' + k + '" aria-pressed="' + on + '" data-f="' + k + '" title="' + esc(on ? W.pillOn : W.pillOff) + '">' + esc(W.pills[k]) + ' <b>' + n[k] + '</b></button>';
    }).join('') + '<span class="sp"></span><input type="search" class="ps-ad-search" id="ps-ad-q" placeholder="' + esc(W.search) + '" aria-label="' + esc(W.search) + '" value="' + esc(S.q) + '"></div>';
  }
  function renderTable() {
    var rs = rows(), narrow = window.innerWidth < 760;
    var h = '<div class="ps-ad-tbl"><div class="ps-ad-tr th"><div>' + esc(W.cols.customer) + '</div>' + SH.map(function (s) { return '<div class="c" title="' + esc(SHN[s]) + '">' + esc(narrow ? SHN[s].replace(' ad', '') : SHN[s]) + '</div>'; }).join('') + '<div></div></div>';
    if (!rs.length) h += '<div class="ps-ad-empty">' + esc(!S.customers.length ? W.emptyAll : S.q.trim() ? W.emptyQ : S.filter === 'you' ? W.emptyYou : S.filter === 'adv' ? W.emptyAdv : W.emptyIx) + '</div>';
    rs.forEach(function (c) {
      var open = S.open === c.id;
      h += '<div class="ps-ad-tr r' + (open ? ' ps-ad-openrow' : '') + '" data-c="' + esc(c.id) + '" role="button" tabindex="0" aria-expanded="' + open + '"><div class="nm"><span class="cn">' + esc(c.name) + '</span></div>';
      SH.forEach(function (sh) {
        var os = owners(c, sh), st = os[0], tip = os.map(function (o) { return W.tip[o]; }).join('; ');
        h += '<div class="c">' + (open ? '' : (st === 'dash' ? mark(st) : '<button type="button" class="ps-ad-cbtn" data-cell="' + esc(c.id) + '|' + sh + '" title="' + esc(SHN[sh] + ': ' + tip) + '" aria-label="' + esc(SHN[sh] + ': ' + tip) + '"><span class="stk">' + os.map(mark).join('') + '</span></button>')) + '</div>';
      });
      h += '<div class="chv">' + CHEV + '</div></div>';
      if (open) h += renderOpen(c);
    });
    return h + '</div>';
  }
  function badge(o) {
    if (o === 'ok') return '<span class="ps-ad-badge b-ok">' + mark('ok') + esc(W.badge.ok) + '</span>';
    if (o === 'you' || o === 'adv' || o === 'ix') return '<span class="ps-ad-badge b-' + o + '">' + esc(W.badge[o]) + '</span>';
    return '<span class="ps-ad-badge b-plain">' + esc(W.badge[o] || o) + '</span>';
  }
  function vBadge(v) { return v.state === 'current' ? badge('ok') : vOwn(v) ? badge(vOwn(v)) : badge(v.state === 'ready' ? 'ready' : 'earlier'); }
  function vCard(c, sh, v, opts) {   // v1.0.4 · one version card; the actions live on the card
    opts = opts || {};
    var shp = SHN[sh], low = shp.toLowerCase(), g = S.staged[v.id], w = 'w-' + (sh === 'text' ? 'banner' : sh), L = v.link || {};
    var h = '<div class="ps-ad-shp' + (g ? ' gold' : '') + '" id="v-' + esc(v.id) + '"><div class="shead"><span class="sl">' + esc(shp) + '</span><span class="vt">' + esc(v.name) + '</span><span class="sp"></span>' + (v.state === 'current' ? badge('ok') : opts.badge !== false ? vBadge(v) : '') + '</div>';
    h += '<div class="ps-ad-frame' + (g ? ' chg' : '') + ' ' + (sh === 'text' ? '' : w) + '">' + art(v, sh) + '</div>';
    var meta = metaFor(v, c); if (meta) h += '<div class="ps-ad-meta">' + meta + '</div>';
    if (v.state === 'answered' && L.answer === 'change' && (L.change || L.like)) h += '<div class="ps-ad-ans"><b>' + esc(fill(W.answeredBox, { who: L.answeredBy || 'The advertiser', on: day(L.answeredAt) })) + '</b>' + esc(L.change || L.like) + (L.files && L.files.length ? ' <span class="ps-ad-quiet">\u00b7 ' + L.files.length + (L.files.length === 1 ? ' file' : ' files') + '</span>' : '') + '</div>';
    if (g) {
      h += '<div class="ps-ad-staged"><span class="tag">' + esc(fill(W.onSave, { what: stagedWhat(g, v) })) + '</span><button type="button" class="ps-ad-cancel" data-unstage="' + esc(v.id) + '">' + esc(W.cancel) + '</button></div>';
      if (g.act === 'ask') h += '<div class="ps-ad-quiet" style="margin-top:8px;max-width:60ch">' + esc(fill(W.askNote, { name: c.name, days: S.linkDays })) + '</div>';
      if (g.act === 'back') h += '<div style="margin-top:10px"><label class="ps-ad-quiet" for="note-' + esc(v.id) + '">' + esc(W.noteLabel) + '</label><br><textarea class="ps-ad-note' + (g.note ? ' chg' : '') + '" id="note-' + esc(v.id) + '" data-note="' + esc(v.id) + '" placeholder="' + esc(W.notePh) + '">' + esc(g.note || '') + '</textarea>' + (g.note ? '' : '<div class="ps-ad-need">' + esc(W.noteNeed) + '</div>') + '</div>';
    } else if (v.state === 'needs' || v.state === 'answered' || v.state === 'adv') {
      h += '<div class="ps-ad-acts"><button type="button" class="ix-btn ix-btn--primary" data-act="current|' + esc(v.id) + '">' + esc(W.act.current) + '</button><button type="button" class="ix-btn ix-btn--secondary" data-act="hold|' + esc(v.id) + '">' + esc(W.act.hold) + '</button>' +
        (v.state === 'needs' ? '<button type="button" class="ix-btn ix-btn--secondary" data-act="ask|' + esc(v.id) + '">' + esc(W.act.ask) + '</button>' : '') + '<button type="button" class="ps-ad-link" data-act="back|' + esc(v.id) + '">' + esc(W.act.back) + '</button></div>';
    } else if (v.state === 'ready') {
      h += '<div class="ps-ad-acts"><button type="button" class="ix-btn ix-btn--primary" data-act="make|' + esc(v.id) + '">' + esc(W.act.make) + '</button></div>';
    } else if (v.state === 'earlier') {
      if (v.stale) h += '<div class="ps-ad-stale">' + esc(fill(W.meta.stale, { ago: agoWords(v) })) + '</div><div class="ps-ad-acts"><button type="button" class="ix-btn ix-btn--primary" data-act="review|' + esc(v.id) + '">' + esc(W.act.review) + '</button></div>';
      else h += '<div class="ps-ad-acts"><button type="button" class="ix-btn ix-btn--primary" data-act="make|' + esc(v.id) + '">' + esc(W.act.makeAgain) + '</button><button type="button" class="ix-btn ix-btn--secondary" data-act="restore|' + esc(v.id) + '">' + esc(W.act.restore) + '</button></div>';
    }
    return h + '</div>';
  }
  function renderShape(c, sh) {   // v1.0.4 · the Current column: the live version, or a quiet line
    var vs = vOf(c, sh), cur = curOf(c, sh), sold = c.shapes[sh].sold, shp = SHN[sh], low = shp.toLowerCase();
    if (!sold && !vs.length) return '<div class="ps-ad-shp slim" id="shp-' + esc(c.id) + '-' + sh + '"><span class="sl">' + esc(shp) + '</span>' + mark('dash') + '<span>' + esc(fill(W.notSold, { name: c.name })) + '</span></div>';
    if (!cur) return '<div class="ps-ad-shp slim" id="shp-' + esc(c.id) + '-' + sh + '"><span class="sl">' + esc(shp) + '</span>' + mark('dash') + '<span>' + esc(fill(W.noRun, { shape: low, name: c.name })) + '</span></div>';
    return vCard(c, sh, cur);
  }
  function perShape(list) {   // v1.0.1: "Banner 1 · Sidebar 2" instead of one total
    var n = {}; list.forEach(function (x) { n[x.sh] = (n[x.sh] || 0) + 1; });
    return SH.filter(function (sh) { return n[sh]; }).map(function (sh) { return esc(SHN[sh]) + ' ' + n[sh]; }).join(' \u00b7 ');
  }
  function renderCols(c) {   // v1.0.4 · Pending versions · Other versions (Approved, in inventory / Archived)
    var all = []; SH.forEach(function (sh) { vOf(c, sh).forEach(function (v) { all.push({ v: v, sh: sh }); }); });
    var col = function (title, n, body) { return '<div class="ps-ad-col"><h3 class="ps-ad-stackh">' + esc(title) + (n ? ' <span class="cnt">' + n + '</span>' : '') + '</h3>' + body + '</div>'; };
    var pend = all.filter(function (x) { return ['needs', 'answered', 'adv', 'back'].indexOf(x.v.state) > -1; });
    var links = {}; pend.forEach(function (x) { var L = x.v.link; if (L && x.v.state === 'adv' && !links[L.reviewId]) links[L.reviewId] = L; });
    var lh = Object.keys(links).map(function (k) { var L = links[k];
      return '<div class="ps-ad-linkbox"><b>' + esc(fill(W.linkOut, { until: day(L.until) })) + '</b>' + (L.url ? ' \u00b7 <button type="button" class="ps-ad-link" data-copy="' + esc(L.url) + '">' + esc(W.copyLink) + '</button>' : '') + '<span class="s">' + esc(L.openedAt ? fill(W.linkOpened, { on: day(L.openedAt) }) : W.linkNotOpened) + '</span></div>'; }).join('');
    var ph = lh + (pend.length ? pend.map(function (x) { return vCard(c, x.sh, x.v); }).join('') : '<div class="ps-ad-quiet">' + esc(W.colNone.process) + '</div>');
    var ready = all.filter(function (x) { return x.v.state === 'ready'; }), old = all.filter(function (x) { return x.v.state === 'earlier'; });
    var oh = '<div class="ps-ad-sub">' + esc(W.rail.ready) + (ready.length ? ' <span>\u00b7 ' + perShape(ready) + '</span>' : '') + '</div>' + (ready.length ? ready.map(function (x) { return vCard(c, x.sh, x.v, { badge: false }); }).join('') : '<div class="ps-ad-quiet">' + esc(W.colNone.ready) + '</div>') +
      '<div class="ps-ad-sub">' + esc(W.rail.archived) + (old.length ? ' <span>\u00b7 ' + perShape(old) + '</span>' : '') + '</div>' + (old.length ? old.map(function (x) { return vCard(c, x.sh, x.v, { badge: false }); }).join('') : '<div class="ps-ad-quiet">' + esc(W.colNone.archived) + '</div>');
    return col(W.rail.process, perShape(pend), ph) + col(W.rail.other, '', oh);
  }
  function renderOpen(c) {
    var probs = (c.problems || []).length && ctx.who.staff ? '<div class="ps-ad-probs">' + c.problems.map(esc).join('<br>') + '</div>' : '';
    return '<div class="ps-ad-ex">' + probs + '<div class="ps-ad-col"><h3 class="ps-ad-stackh">' + esc(W.rail.current) + '</h3>' + SH.map(function (sh) { return renderShape(c, sh); }).join('') + '</div>' + renderCols(c) + '</div>';
  }
  function renderSave() {
    var ids = Object.keys(S.staged);
    if (!ids.length && !S.saving) return '';
    if (S.saving) {
      var st = S.saving;
      return '<div class="ps-ad-savebar" role="status"><div class="what">' + (ctx.who.staff ? '<b>' + esc(W.save.saving) + '</b><ul class="steps">' + W.save.steps.map(function (s, i) { return '<li class="' + (i < st.step ? 'done' : i === st.step ? 'on' : '') + '">' + (i < st.step ? '\u2713 ' : '') + esc(s) + '</li>'; }).join('') + '</ul>' : '<b>' + esc(W.save.saving) + '</b>') + '</div></div>';
    }
    var missing = ids.some(function (id) { return S.staged[id].act === 'back' && !S.staged[id].note; });
    var list = ids.map(function (id) { var f = findV(id); if (!f) return ''; return '<li>' + esc(fill(W.save.line, { name: f.c.name, shape: SHN[f.sh].toLowerCase(), what: stagedWhat(S.staged[id], f.v).toLowerCase() })) + '</li>'; }).join('');
    return '<div class="ps-ad-savebar"><div class="what"><b>' + esc(ids.length > 1 ? fill(W.save.n, { n: ids.length }) : W.save.n1) + '</b><ul>' + list + '</ul>' + (missing ? '<div class="ps-ad-need">' + esc(W.save.need) + '</div>' : '') + '</div><button type="button" class="ps-ad-cancel" id="ps-ad-cancelall">' + esc(W.cancel) + '</button><button type="button" class="ix-btn ix-btn--primary" id="ps-ad-saveall"' + (missing ? ' disabled' : '') + '>' + esc(W.save.save) + '</button></div>';
  }
  function render() {
    var y = window.scrollY, act = document.activeElement, keep = act && act.id === 'ps-ad-q' ? { s: act.selectionStart, e: act.selectionEnd } : null;
    var h = '<div class="ps-ad"><div class="ps-titlerow"><h1>' + esc(W.title) + '</h1>' + info() + '<div class="sp"></div></div>';
    if (!S.loaded) h += ctx.placeholder ? '<div class="ps-ad-tbl"><table style="width:100%"><tbody>' + ctx.placeholder(5, 6) + '</tbody></table></div>' : '';
    else if (S.loadErr) h += '<div class="ps-err" role="alert">' + esc(fill(W.loadFail, { msg: S.loadErr })) + '</div>';
    else h += renderFilters() + renderTable();
    h += renderMail() + '<div id="ps-ad-savewrap">' + renderSave() + '</div></div>';
    el.innerHTML = h;
    if (keep) { var q = el.querySelector('#ps-ad-q'); if (q) { q.focus(); try { q.setSelectionRange(keep.s, keep.e); } catch (e) {} } }
    window.scrollTo(0, y);
  }
  function flashTo(cid, sh, block) {
    requestAnimationFrame(function () { var n = document.getElementById('shp-' + cid + '-' + sh); if (n) { n.scrollIntoView({ behavior: 'smooth', block: block || 'center' }); n.classList.add('flash'); } });
  }

  // ── data ────────────────────────────────────────────────────
  async function load() {
    var r = await ctx.api('/ads?publisher=' + encodeURIComponent(ctx.publisher.id), { label: W.api.ads });
    if (!r.ok) { S.loaded = true; S.loadErr = (r.json && r.json.error) || ('HTTP ' + r.status); return; }
    S.customers = r.json.customers || []; S.linkDays = r.json.linkDays || 14; S.staleMonths = r.json.staleMonths || 6;
    if (Array.isArray(r.json.shapes) && r.json.shapes.length) { SH = r.json.shapes.map(function (s) { return s.key; }); r.json.shapes.forEach(function (s) { SHN[s.key] = s.label; }); }
    S.loaded = true; S.loadErr = '';
  }

  // ── save ────────────────────────────────────────────────────
  var ACT_API = { current: 'approve-current', hold: 'approve-hold', back: 'send-back', make: 'make-current', restore: 'restore-hold', review: 'restore-review' };
  async function save() {
    var ids = Object.keys(S.staged); if (!ids.length) return;
    S.saving = { step: 0 }; render();
    var ok = 0, bad = 0, msgs = [], unconf = [], mails = [];
    var byCust = {};
    ids.forEach(function (id) { var f = findV(id); if (!f) return; if (S.staged[id].act === 'ask') (byCust[f.c.id] = byCust[f.c.id] || []).push({ adId: id, shape: f.sh, name: f.c.name }); });
    S.saving.step = 1; render();
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i], g = S.staged[id], f = findV(id); if (!f || g.act === 'ask') continue;
      if (g.act === 'current' || g.act === 'make') { S.saving.step = Math.max(S.saving.step, 2); render(); }
      var r = await ctx.api('/ads/' + encodeURIComponent(id) + '/decide', { method: 'POST', body: { publisher: ctx.publisher.id, shape: f.sh, action: ACT_API[g.act], note: g.note || '' }, label: fill(W.api.decide, { what: f.c.name + ', ' + SHN[f.sh].toLowerCase() }) });
      if (r.ok) { ok++; (r.json.unconfirmed || []).forEach(function (u) { unconf.push(f.c.name + ' ' + u); }); }
      else { bad++; msgs.push(f.c.name + ', ' + SHN[f.sh].toLowerCase() + ': ' + ((r.json && r.json.error) || ('HTTP ' + r.status))); }
    }
    var custIds = Object.keys(byCust);
    if (custIds.length) { S.saving.step = 3; render(); }
    for (var k = 0; k < custIds.length; k++) {
      var items = byCust[custIds[k]], name = items[0].name;
      var ra = await ctx.api('/ads/ask', { method: 'POST', body: { publisher: ctx.publisher.id, items: items.map(function (it) { return { adId: it.adId, shape: it.shape }; }) }, label: fill(W.api.ask, { name: name }) });
      if (ra.ok) { ok += items.length; mails.push({ name: name, subject: ra.json.subject, body: ra.json.message }); (ra.json.unconfirmed || []).forEach(function (u) { unconf.push(name + ' ' + u); }); }
      else { bad += items.length; msgs.push(name + ', ' + W.act.ask.toLowerCase() + ': ' + ((ra.json && ra.json.error) || ('HTTP ' + ra.status))); }
    }
    S.saving.step = 4; render();
    S.staged = {};   // v1.0.3: S.view kept, the column stays where the publisher was looking
    await load();
    S.saving = null; render();
    if (bad) toast(fill(W.savedPart, { ok: ok, bad: bad, msg: msgs.join(' ') }), 'error', 'save');
    else toast(ok === 1 ? W.savedOne : fill(W.saved, { n: ok + ' changes' }), 'ok', 'save');
    if (unconf.length) toast(fill(W.unconfirmed, { list: unconf.join(', ') }), 'unverified', 'unconf');
    if (mails.length) { S.mail = mails; render(); }   // v1.0.1: the message is shown on the page; the mail link is a real click
  }
  function mailHref(m) { return 'mailto:?subject=' + encodeURIComponent(m.subject || '') + '&body=' + encodeURIComponent(m.body || ''); }
  function renderMail() {   // v1.0.1 · after an Ask: the message, ready to send or copy. Browsers block mailto after an async save, so the link is a real anchor the publisher clicks.
    if (!S.mail || !S.mail.length) return '';
    return '<div class="ps-ad-mailwrap">' + S.mail.map(function (m, i) {
      return '<div class="ps-ad-mail"><div class="mh"><b>' + esc(fill(W.mail.head, { name: m.name })) + '</b><button type="button" class="ps-ad-cancel" data-mailclose="' + i + '">' + esc(W.mail.close) + '</button></div>' +
        '<div class="ml"><span>' + esc(W.mail.subject) + '</span><input type="text" readonly value="' + esc(m.subject || '') + '"></div>' +
        '<textarea readonly rows="7">' + esc(m.body || '') + '</textarea>' +
        '<div class="ma"><a class="ix-btn ix-btn--primary" href="' + esc(mailHref(m)) + '">' + esc(W.mail.open) + '</a><button type="button" class="ix-btn ix-btn--secondary" data-mailcopy="' + i + '">' + esc(W.mail.copy) + '</button><span class="ps-ad-quiet">' + esc(W.mail.note) + '</span></div></div>';
    }).join('') + '</div>';
  }

  // ── wiring ──────────────────────────────────────────────────
  function wire() {
    el.addEventListener('click', function (e) {
      var t = e.target.closest('button,[data-c]'); if (!t || !el.contains(t)) return;
      var d = t.dataset;
      if (d.f) { S.filter = S.filter === d.f ? null : d.f; render(); return; }
      if (d.mailclose !== undefined) { S.mail.splice(+d.mailclose, 1); render(); return; }
      if (d.mailcopy !== undefined) { var mm = S.mail[+d.mailcopy], txt = (mm.subject || '') + '\n\n' + (mm.body || ''); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast(W.mail.copied, 'ok', 'copy'); }, function () { toast(W.copyFail.replace('{url}', ''), 'error', 'copy'); }); return; }
      if (d.copy) { var url = d.copy; (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast(W.copied, 'ok', 'copy'); }, function () { toast(fill(W.copyFail, { url: url }), 'error', 'copy'); }); return; }
      if (d.cell) { var p = d.cell.split('|'), c = cust(p[0]); if (!c) return; S.open = c.id;
        var w = ['needs', 'answered', 'back', 'adv'].map(function (st) { return vOf(c, p[1]).find(function (v) { return v.state === st; }); }).filter(Boolean)[0];
        if (w) S.view[c.id + '|' + p[1]] = w.id; render(); flashTo(c.id, p[1]); return; }
      if (d.act) { var a = d.act.split('|'), act = a[0], id = a[1], f0 = findV(id); if (!f0) return;
        if (act === 'current' || act === 'make') Object.keys(S.staged).forEach(function (k) { var x = findV(k); if (x && x.c.id === f0.c.id && x.sh === f0.sh && (S.staged[k].act === 'current' || S.staged[k].act === 'make')) delete S.staged[k]; });
        S.staged[id] = { act: act, note: '' }; render();
        if (act === 'back') requestAnimationFrame(function () { var n = document.getElementById('note-' + id); if (n) n.focus(); });
        return; }
      if (d.unstage) { delete S.staged[d.unstage]; render(); return; }
      if (t.id === 'ps-ad-saveall') { save(); return; }
      if (t.id === 'ps-ad-cancelall') { S.staged = {}; render(); return; }
      if (d.c && !e.target.closest('.ps-ad-ex')) { S.open = S.open === d.c ? null : d.c; render(); return; }
    });
    el.addEventListener('keydown', function (e) {
      var t = e.target;
      if ((e.key === 'Enter' || e.key === ' ') && t.dataset && t.dataset.c && t.classList.contains('r')) { e.preventDefault(); t.click(); }
    });
    el.addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === 'ps-ad-q') { S.q = t.value; var tbl = el.querySelector('.ps-ad-tbl'); if (tbl) tbl.outerHTML = renderTable(); return; }
      if (t.dataset && t.dataset.note) { var g = S.staged[t.dataset.note]; if (!g) return; g.note = t.value; t.classList.toggle('chg', !!t.value);
        var need = t.parentNode.querySelector('.ps-ad-need'); if (need && t.value) need.remove(); else if (!need && !t.value) t.insertAdjacentHTML('afterend', '<div class="ps-ad-need">' + esc(W.noteNeed) + '</div>');
        var sw = el.querySelector('#ps-ad-savewrap'); if (sw) sw.innerHTML = renderSave(); }
    });
  }

  // ── mount ───────────────────────────────────────────────────
  function mount(node, c) {
    ctx = c; el = node;
    S = { customers: [], loaded: false, loadErr: '', filter: null, q: '', open: null, view: {}, staged: {}, saving: null, mail: [], linkDays: 14, staleMonths: 6 };
    wire(); render();
    load().then(render);
  }
  function reg() { window.PsShell.register({ key: 'ads', mount: mount }); }
  if (window.PsShell) reg(); else document.addEventListener('DOMContentLoaded', reg);
})();
