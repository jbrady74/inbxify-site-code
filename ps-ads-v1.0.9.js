// ps-ads-v1.0.9.js
// ============================================================
// INBXIFY · Publisher Portal · the Ads tab
//
// v1.0.9 (10 Nov 2026, Publisher Portal S9, Test 1, Jeff) — AN OPEN REQUEST IS A SMALL PURPLE SQUARE.
//   · Table: an open request no longer adds the word "inbxify". It shows as a small purple square, smaller than the
//     green dot, on the same line right after the cell's last mark: after the green dot when that is all there is,
//     after the owner word (You / Advertiser / inbxify) when there is one. A shape with nothing else (not sold, no ad)
//     shows the square alone instead of the dash. Its hover tip says "New ad requested". Requests still count under
//     the "With inbxify" pill and filter, since inbxify owns them.
//   · The request box's line under the title is the customer's name only ("· for all your titles" removed).
//   CSS v1.0.9 (the square, the mark line).
// v1.0.8 (10 Nov 2026, Publisher Portal S9 · Request a new ad, mockup v0.13 accepted) — REQUEST NEW ADS.
//   · The open customer row's tab line gains "Request new ads" at its right end (it acts on the customer, not one shape).
//   · It opens one box: four equal tick tiles with the shape name only, "Tick all four", Wanted by (optional), a note
//     (required, with the agreed placeholder) and files (optional, uploaded as they are added). Filled fields are gold.
//     "Send request" sends at once (it is one complete act in one box, so it does not wait for the save bar); Cancel
//     closes it with nothing sent. A progress line runs while it sends. No limit: a shape that already has an open
//     request can be requested again; each ticked shape becomes its own request (ix-sales v1.3.5 POST /ads/request).
//   · Each requested Current card gets a pale blue band at its foot: "New banner requested Nov 10 / Wanted by Dec 1 ·
//     with inbxify / Asked by <contact> · Withdraw" ("2 new banners requested, the latest Nov 10" when there are more).
//     The other three cards keep an equal blank space, so the four stay the same height. Withdraw asks once on the card,
//     then withdraws the latest open request of that shape (POST /ads/request/<id>/withdraw).
//   · Table: a shape with an open request is inbxify's move, so its cell shows "inbxify"; when the shape has a live ad,
//     every owner word now sits under the green dot (the mockup's rule, applied to all owner words, not only inbxify).
//   · ?customer=<id> in the address opens that customer's row on load (client-manager v1.4.14 "Open in Publisher Portal").
//   · Fixes from S8: the empty Current card's class is renamed from `empty` to `noad` (ps-shell's page styles own
//     .empty and centred it); the card head keeps the shape name and its pill on one line on narrow cards (the pill's
//     words shorten instead of wrapping under the title). CSS v1.0.8.
//   HARDCODING: HC-P-PP8-7 W grows by W.req (the box, the band, the withdraw words). Needs ix-sales v1.3.5.
// v1.0.7 (10 Nov 2026, Publisher Portal S8, live test, Jeff) — The four Current cards are built identically whether live or
//   empty: same head row (name left, pill right), the same version line (blank but present when empty), the same full-width
//   stage of the same height, the same meta row. Every live card carries the running line: "Running since <date>" when the
//   run log has it, else "Running since before the portal kept dates", then "Approved by <contact>, <date>" when a record
//   exists. Pictures fill the stage: the banner by width, the sidebar and splash by height. CSS v1.0.7.
// v1.0.6 (10 Nov 2026, Publisher Portal S8, live test, Jeff) — THE CURRENT TAB IS ALWAYS ONE ROW OF FOUR EQUAL CARDS:
//   Banner · Sidebar · Splash · Text ad, same height and width, every shape named in the same bold serif whether or not it
//   is sold; the picture sits in a fixed-height stage scaled to fit. The approver line names the publisher's contact
//   (ctx.publisher.contact from ps-shell, else the company), never the login that pressed Save. CSS v1.0.6.
// v1.0.5 (10 Nov 2026, Publisher Portal S8, live test) — THE THREE COLUMNS BECOME THREE FULL-WIDTH TABS (Jeff: an empty
//   Pending column between Current and Other looked wrong). Tabs: Current versions · Pending versions (count, red when
//   something needs the publisher) · Other versions. The tab opens on Pending when anything is pending, else Current.
//   Fixes: "undefined" before "Approved by" (the v1.0.4 words edit missed); dates given as YYYY-MM-DD read as local days
//   (run log dates showed a day early); approver by name via ps-shell v1.0.4 ctx.who.name. CSS v1.0.5.
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
//   CSS: ps-ads-v1.0.7.css. Needs ps-shell v1.0.3+ (ctx.api, ctx.info,
//   ctx.placeholder), ix-sales v1.3.1, ix-info, ix-success-toast.
// ============================================================
(function () {
  'use strict';
  var VERSION = '1.0.9', FILE = 'ps-ads-v' + VERSION + '.js';
  var SH = ['banner', 'sidebar', 'splash', 'text'];                        // HC-P-PP8-8
  var SHN = { banner: 'Banner', sidebar: 'Sidebar', splash: 'Splash', text: 'Text ad' };
  var W = {                                                              // HC-P-PP8-7
    title: 'Ads',
    search: 'Find a customer',
    pills: { you: 'Needs you', adv: 'With advertiser', ix: 'With inbxify' },
    pillOn: 'Show every customer again', pillOff: 'Show only these',
    own: { you: 'You', adv: 'Advertiser', ix: 'inbxify' },
    tip: { you: 'Your move: approve, hold, send back or ask the advertiser', adv: 'Waiting on the advertiser',
           ix: 'inbxify\u2019s move: making or fixing this ad', ok: 'Approved and running', dash: 'Not sold', req: 'New ad requested' },   // v1.0.9: req
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
      currentBy: 'Approved by {by}, {on}.', runningSince: 'Running since {on}.', runningUnknown: 'Running since before the portal kept dates.',
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
    tabNone: { current: 'Nothing is running for {name} yet.' }, notSoldShort: 'Not sold', noRunShort: 'Nothing running yet',
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
    api: { ads: 'Reading your ads', decide: 'Saving {what}', ask: 'Making the link for {name}', request: 'Sending the request to inbxify', file: 'Uploading {name}', withdraw: 'Withdrawing the {shape} request' },
    req: {                                                               // v1.0.8 · HC-P-PP8-7
      button: 'Request new ads', head: 'Request new ads', sub: '{name}',   // v1.0.9: no titles phrase
      which: 'Which ads', tickAll: 'Tick all four', when: 'Wanted by', optional: 'optional', note: 'Note for inbxify',
      notePh: 'What should the new ad say or show? An offer, an event, a season, new photos, or changes to the current ad. Add files below if the advertiser sent any.',
      noteNeed: 'A note is needed: say what the new ads should say or show.', files: 'Files', addFiles: 'Add photos or files', remove: 'Remove', uploading: 'uploading\u2026',
      fileFail: '{name} did not upload: {msg}', tooBig: '{name} is over 20 MB.',
      whatNone: 'Tick at least one ad and write a note.', whatNote: 'Write a note to send the request.', whatFiles: 'Wait for the files to finish uploading.',
      what: 'Sends a request for a new {list} to inbxify{when}.', whatWhen: ', wanted by {on}', and: ' and ',
      send: 'Send request', sending: 'Sending the request to inbxify\u2026', cancel: 'Cancel',
      sent: 'Request sent to inbxify: new {list} for {name}.', fail: 'The request was not sent: {msg}',
      one: 'New {shape} requested {on}', many: '{n} new {shapes} requested, the latest {on}',
      wanted: 'Wanted by {on}', withIx: 'with inbxify', withIxCap: 'With inbxify', asked: 'Asked by {who}', withdraw: 'Withdraw',
      confirm: 'Withdraw the {shape} request?', keep: 'Keep it', withdrawn: 'The {shape} request for {name} was withdrawn.', wdFail: 'The request was not withdrawn: {msg}',
      plural: { banner: 'banners', sidebar: 'sidebars', splash: 'splashes', text: 'text ads' }
    }
  };
  var PLUS = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>';   // v1.0.8
  var CHEV = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  var ctx, el, S;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function fill(t, o) { return String(t).replace(/\{(\w+)\}/g, function (_, k) { return o[k] == null ? '' : o[k]; }); }
  function day(v) { if (!v) return ''; var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v)); var d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v); if (isNaN(d)) return String(v).slice(0, 10); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }   // v1.0.5: a bare date is a local day
  function who(s) { if (!s) return 'inbxify'; var me = ctx.who || {}; if (me.email && String(s).toLowerCase() === String(me.email).toLowerCase() && me.name && me.name !== me.email) return me.name; return s; }
  function approver() { var p = ctx.publisher || {}; return p.contact || p.name || 'the publisher'; }   // v1.0.6: decisions belong to the publisher; the login stays in the review row
  function toast(msg, v, key) { if (window.IxToast) window.IxToast.show(msg, v, { key: 'ps-ads:' + key }); else console.log('[ps-ads]', msg); }

  // ── data shape helpers ──────────────────────────────────────
  function cust(id) { return S.customers.find(function (c) { return c.id === id; }); }
  function vOf(c, sh) { return c.shapes[sh].versions; }
  function curOf(c, sh) { var id = c.shapes[sh].current; return vOf(c, sh).find(function (v) { return v.id === id; }) || null; }
  function findV(id) { for (var i = 0; i < S.customers.length; i++) { var c = S.customers[i]; for (var j = 0; j < SH.length; j++) { var v = vOf(c, SH[j]).find(function (x) { return x.id === id; }); if (v) return { v: v, c: c, sh: SH[j] }; } } return null; }
  function vOwn(v) { return ({ needs: 'you', answered: 'you', adv: 'adv', back: 'ix' })[v.state] || null; }
  function owners(c, sh, forCell) {   // v1.0.9: forCell leaves an open request out (the table shows it as a purple square)
    var vs = vOf(c, sh), o = [];
    var has = function (st) { return vs.some(function (v) { return v.state === st; }); };
    if (has('needs') || has('answered')) o.push('you');
    if (has('back') || (!forCell && reqsOf(c, sh).length) || (!curOf(c, sh) && c.shapes[sh].sold && !has('needs') && !has('answered') && !has('adv'))) o.push('ix');   // v1.0.8: an open request is inbxify's move
    if (has('adv')) o.push('adv');
    if (o.length) return o;
    return [curOf(c, sh) ? 'ok' : 'dash'];
  }
  function cellState(c, sh) { return owners(c, sh)[0]; }
  function reqsOf(c, sh) { return (c.shapes[sh] && c.shapes[sh].requests) || []; }                       // v1.0.8
  function anyReq(c) { return SH.some(function (sh) { return reqsOf(c, sh).length; }); }
  function cellMarks(c, sh) { var os = owners(c, sh, true); return (curOf(c, sh) && os[0] !== 'ok') ? ['ok'].concat(os) : os; }   // v1.0.8: owner words sit under the green dot when the shape is live
  var REQSQ = '<i class="ps-ad-reqsq" aria-hidden="true"></i>';   // v1.0.9
  function cellHTML(os, hasReq) {   // v1.0.9: the purple square sits on the line of the last mark, after it; alone when there is only a dash
    if (hasReq && os.length === 1 && os[0] === 'dash') return '<span class="ps-ad-ml">' + REQSQ + '</span>';
    return os.map(function (o, i) { return '<span class="ps-ad-ml">' + mark(o) + (hasReq && i === os.length - 1 ? REQSQ : '') + '</span>'; }).join('');
  }
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
      case 'current': return [v.ranFrom ? fill(W.meta.runningSince, { on: day(v.ranFrom) }) : W.meta.runningUnknown, d.at ? fill(W.meta.currentBy, { by: esc(approver()), on: day(d.at) }) : ''].filter(Boolean).join(' ');
      case 'needs': return W.meta.needs + (v.createdOn ? ' ' + fill(W.meta.needsMade, { on: day(v.createdOn) }) : '');
      case 'answered': return fill(W.meta.answered, { who: esc(L.answeredBy || 'The advertiser'), on: day(L.answeredAt), answer: L.answer === 'approve' ? W.meta.ansOk : W.meta.ansChange,
        more: L.answer === 'change' ? ' <q>' + esc([L.like && ('Likes: ' + L.like), L.change && ('Change: ' + L.change)].filter(Boolean).join(' ')) + '</q>' : '' });
      case 'adv': return W.meta.adv;   // v1.0.4: the link box above carries the dates
      case 'back': var b = v.sentBack || {}; return fill(W.meta.back, { by: esc(who(b.by)), on: day(b.at), note: b.note ? '<q>' + esc(b.note) + '</q>' : '' });
      case 'ready': return fill(W.meta.ready, { by: d.at ? fill(W.meta.readyBy, { by: esc(approver()), on: day(d.at) }) : '' });
      case 'earlier': return (v.ranFrom && v.ranTo ? fill(W.meta.earlier, { from: day(v.ranFrom), to: day(v.ranTo) }) : v.ranTo ? fill(W.meta.earlierTo, { to: day(v.ranTo) }) : W.meta.earlierUnknown) + (v.archived ? W.meta.archived : '');
    }
    return '';
  }
  function stagedWhat(g, v) { return g.act === 'make' && v.state === 'earlier' ? W.act.makeAgain : W.act[g.act]; }

  // ── drawing ─────────────────────────────────────────────────
  function info() {
    return ctx.info({ file: FILE, version: VERSION, title: W.title,
      blurb: 'Every customer\u2019s ads by shape, whose move each one is, and the versions behind it. Choices are staged (gold) until Save. Reads: ix-sales GET /ads?publisher= (versions from ix-issue-data /customer-ads, sold shapes from sales records, links and decisions from PUBLISHER REVIEWS). Saves: ix-sales POST /ads/<id>/decide (Scenario G for approvals, 114 for current ads, each echo checked; every decision logged in PUBLISHER REVIEWS) and POST /ads/ask (one PUBLISHER REVIEWS row per link; the email opens in your own mail program). Request new ads: POST /ads/request (one PUBLISHER REVIEWS row per shape, Action Request new ad, sent at once), files through POST /ads/request/file (Uploadcare), Withdraw through POST /ads/request/<id>/withdraw; Ad Maker closes a request when it saves the job. Run dates come from ADS Run Log, written by 114 through ix-sales /run-log.',
      scenarios: ['G', '114'], companions: 'ps-ads-v1.0.9.css \u00b7 ps-shell v' + (window.PsShell ? window.PsShell.version : '?') + ' \u00b7 ix-sales v1.3.5 \u00b7 ix-issue-data v1.0.172' });
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
        var os = cellMarks(c, sh), st = os[0], hr = reqsOf(c, sh).length > 0;
        var tip = os.filter(function (o) { return !(hr && o === 'dash'); }).map(function (o) { return W.tip[o]; }).concat(hr ? [W.tip.req] : []).join('; ');
        h += '<div class="c">' + (open ? '' : (st === 'dash' && !hr ? mark(st) : '<button type="button" class="ps-ad-cbtn" data-cell="' + esc(c.id) + '|' + sh + '" title="' + esc(SHN[sh] + ': ' + tip) + '" aria-label="' + esc(SHN[sh] + ': ' + tip) + '"><span class="stk">' + cellHTML(os, hr) + '</span></button>')) + '</div>';   // v1.0.9
      });
      h += '<div class="chv">' + CHEV + '</div></div>';
      if (open) h += renderOpen(c);
    });
    return h + '</div>';
  }
  function badge(o) {
    if (o === 'ok') return '<span class="ps-ad-badge b-ok" title="' + esc(W.badge.ok) + '">' + mark('ok') + '<span class="bl">' + esc(W.badge.ok) + '</span></span>';   // v1.0.8: the words shorten, never wrap
    if (o === 'you' || o === 'adv' || o === 'ix') return '<span class="ps-ad-badge b-' + o + '" title="' + esc(W.badge[o]) + '"><span class="bl">' + esc(W.badge[o]) + '</span></span>';
    return '<span class="ps-ad-badge b-plain" title="' + esc(W.badge[o] || o) + '"><span class="bl">' + esc(W.badge[o] || o) + '</span></span>';
  }
  function vBadge(v) { return v.state === 'current' ? badge('ok') : vOwn(v) ? badge(vOwn(v)) : badge(v.state === 'ready' ? 'ready' : 'earlier'); }
  function vCard(c, sh, v, opts) {   // v1.0.4 · one version card; the actions live on the card
    opts = opts || {};
    var shp = SHN[sh], low = shp.toLowerCase(), g = S.staged[v.id], w = 'w-' + (sh === 'text' ? 'banner' : sh), L = v.link || {};
    var h = '<div class="ps-ad-shp' + (g ? ' gold' : '') + (opts.four ? ' four' : '') + (opts.four && S.flash[c.id + '|' + sh] ? ' flash' : '') + '" id="' + (opts.four ? 'shp-' + esc(c.id) + '-' + sh : 'v-' + esc(v.id)) + '"><div class="shead"><span class="sl">' + esc(shp) + '</span><span class="sp"></span>' + (v.state === 'current' ? badge('ok') : opts.badge !== false ? vBadge(v) : '') + '</div>' + (opts.four ? '<div class="vt">' + esc(v.name) + '</div>' : '<div class="vt">' + esc(v.name) + '</div>');
    h += (opts.four ? '<div class="ps-ad-stage s-' + sh + '">' : '') + '<div class="ps-ad-frame' + (g ? ' chg' : '') + ' ' + (sh === 'text' ? '' : w) + '">' + art(v, sh) + '</div>' + (opts.four ? '</div>' : '');
    var meta = metaFor(v, c); if (meta || opts.four) h += '<div class="ps-ad-meta">' + (meta || '&nbsp;') + '</div>';
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
    if (opts.four && anyReq(c)) h += reqBand(c, sh);   // v1.0.8
    return h + '</div>';
  }
  function plainDay(v) { return v ? day(v) : ''; }
  function reqBand(c, sh) {   // v1.0.8 · the pale blue band at the foot of a requested Current card; blank (same space) on the others
    var list = reqsOf(c, sh), R = W.req;
    if (!list.length) return '<div class="ps-ad-req blank" aria-hidden="true"></div>';
    var latest = list[list.length - 1], low = SHN[sh].toLowerCase(), key = c.id + '|' + sh;
    if (S.wd && S.wd.key === key) {
      return '<div class="ps-ad-req"><div class="cf">' + esc(fill(R.confirm, { shape: low })) + ' <button type="button" class="ix-btn ix-btn--danger ps-ad-sm" data-wdgo="' + esc(key) + '"' + (S.wd.busy ? ' disabled' : '') + '>' + esc(R.withdraw) + '</button><button type="button" class="ps-ad-cancel" data-wdkeep="1">' + esc(R.keep) + '</button></div></div>';
    }
    var head = list.length > 1 ? fill(R.many, { n: list.length, shapes: R.plural[sh] || (low + 's'), on: plainDay(latest.askedAt) }) : fill(R.one, { shape: low, on: plainDay(latest.askedAt) });
    var wants = list.map(function (r) { return r.wantedBy; }).filter(Boolean).sort();
    var line2 = wants.length ? fill(R.wanted, { on: plainDay(wants[0]) }) + ' \u00b7 ' + R.withIx : R.withIxCap;
    return '<div class="ps-ad-req"><b>' + esc(head) + '</b><span class="ln">' + esc(line2) + '</span><span class="ln">' + esc(fill(R.asked, { who: approver() })) + ' \u00b7 <button type="button" class="ps-ad-link" data-wdask="' + esc(key) + '">' + esc(R.withdraw) + '</button></span></div>';
  }
  function renderShape(c, sh) {   // v1.0.6 · the Current tab: one equal card per shape, always four
    var vs = vOf(c, sh), cur = curOf(c, sh), sold = c.shapes[sh].sold, shp = SHN[sh], low = shp.toLowerCase();
    var empty = function (line) { return '<div class="ps-ad-shp four noad' + (S.flash[c.id + '|' + sh] ? ' flash' : '') + '" id="shp-' + esc(c.id) + '-' + sh + '"><div class="shead"><span class="sl">' + esc(shp) + '</span><span class="sp"></span></div><div class="vt">&nbsp;</div><div class="ps-ad-stage"><span class="ps-ad-holder">' + esc(line) + '</span></div><div class="ps-ad-meta">&nbsp;</div>' + (anyReq(c) ? reqBand(c, sh) : '') + '</div>'; };   // v1.0.8: class noad (was empty), the request band
    if (!sold && !vs.length) return empty(W.notSoldShort);
    if (!cur) return empty(W.noRunShort);
    return vCard(c, sh, cur, { four: true });
  }
  function perShape(list) {   // v1.0.1: "Banner 1 · Sidebar 2" instead of one total
    var n = {}; list.forEach(function (x) { n[x.sh] = (n[x.sh] || 0) + 1; });
    return SH.filter(function (sh) { return n[sh]; }).map(function (sh) { return esc(SHN[sh]) + ' ' + n[sh]; }).join(' \u00b7 ');
  }
  function renderCols(c) {   // v1.0.5 · three full-width tabs: Current · Pending · Other
    var all = []; SH.forEach(function (sh) { vOf(c, sh).forEach(function (v) { all.push({ v: v, sh: sh }); }); });
    var pend = all.filter(function (x) { return ['needs', 'answered', 'adv', 'back'].indexOf(x.v.state) > -1; });
    var hot = pend.some(function (x) { return x.v.state === 'needs' || x.v.state === 'answered'; });
    var ready = all.filter(function (x) { return x.v.state === 'ready'; }), old = all.filter(function (x) { return x.v.state === 'earlier'; });
    var tab = S.tab[c.id] || (pend.length ? 'process' : 'current');
    var th = '<div class="ps-ad-tabs" role="tablist">' + [['current', W.rail.current, ''], ['process', W.rail.process, pend.length ? perShape(pend) : ''], ['other', W.rail.other, (ready.length + old.length) ? perShape(ready.concat(old)) : '']].map(function (t) {
      return '<button type="button" role="tab" class="ps-ad-tab' + (tab === t[0] ? ' on' : '') + (t[0] === 'process' && hot ? ' hot' : '') + '" aria-selected="' + (tab === t[0]) + '" data-tab="' + esc(c.id) + '|' + t[0] + '">' + esc(t[1]) + (t[2] ? ' <span class="cnt">' + t[2] + '</span>' : '') + '</button>'; }).join('') + '<span class="sp"></span><button type="button" class="ix-btn ix-btn--secondary ps-ad-reqbtn" data-reqopen="' + esc(c.id) + '">' + PLUS + esc(W.req.button) + '</button></div>';   // v1.0.8
    var body;
    if (tab === 'current') body = '<div class="ps-ad-four">' + SH.map(function (sh) { return renderShape(c, sh); }).join('') + '</div>';
    else if (tab === 'process') {
      var links = {}; pend.forEach(function (x) { var L = x.v.link; if (L && x.v.state === 'adv' && !links[L.reviewId]) links[L.reviewId] = L; });
      var lh = Object.keys(links).map(function (k) { var L = links[k];
        return '<div class="ps-ad-linkbox"><b>' + esc(fill(W.linkOut, { until: day(L.until) })) + '</b>' + (L.url ? ' \u00b7 <button type="button" class="ps-ad-link" data-copy="' + esc(L.url) + '">' + esc(W.copyLink) + '</button>' : '') + '<span class="s">' + esc(L.openedAt ? fill(W.linkOpened, { on: day(L.openedAt) }) : W.linkNotOpened) + '</span></div>'; }).join('');
      body = lh + (pend.length ? '<div class="ps-ad-grid">' + pend.map(function (x) { return vCard(c, x.sh, x.v); }).join('') + '</div>' : '<div class="ps-ad-quiet">' + esc(W.colNone.process) + '</div>');
    } else {
      body = '<div class="ps-ad-sub">' + esc(W.rail.ready) + (ready.length ? ' <span>\u00b7 ' + perShape(ready) + '</span>' : '') + '</div>' + (ready.length ? '<div class="ps-ad-grid">' + ready.map(function (x) { return vCard(c, x.sh, x.v, { badge: false }); }).join('') + '</div>' : '<div class="ps-ad-quiet">' + esc(W.colNone.ready) + '</div>') +
        '<div class="ps-ad-sub">' + esc(W.rail.archived) + (old.length ? ' <span>\u00b7 ' + perShape(old) + '</span>' : '') + '</div>' + (old.length ? '<div class="ps-ad-grid">' + old.map(function (x) { return vCard(c, x.sh, x.v, { badge: false }); }).join('') + '</div>' : '<div class="ps-ad-quiet">' + esc(W.colNone.archived) + '</div>');
    }
    return th + '<div class="ps-ad-tabbody" role="tabpanel">' + body + '</div>';
  }
  function renderOpen(c) {
    var probs = (c.problems || []).length && ctx.who.staff ? '<div class="ps-ad-probs">' + c.problems.map(esc).join('<br>') + '</div>' : '';
    return '<div class="ps-ad-ex">' + probs + renderCols(c) + '</div>';
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
    h += renderMail() + '<div id="ps-ad-savewrap">' + renderSave() + '</div>' + renderReq() + '</div>';   // v1.0.8: the request box
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
    if (S.deep && S.customers.some(function (c) { return c.id === S.deep; })) {   // v1.0.8: ?customer=<id> opens that row once
      S.open = S.deep; S.tab[S.deep] = 'current'; var dc = S.deep; S.deep = null;
      requestAnimationFrame(function () { var n = el.querySelector('[data-c="' + dc + '"]'); if (n) n.scrollIntoView({ block: 'start' }); });
    }
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

  // ── v1.0.8 · request new ads ────────────────────────────────
  function reqPicked() { var R = S.req; return SH.filter(function (sh) { return R.picks[sh]; }); }
  function listWords(arr) { return arr.length > 1 ? arr.slice(0, -1).join(', ') + W.req.and + arr[arr.length - 1] : (arr[0] || ''); }
  function reqWhat() {
    var R = S.req, n = reqPicked();
    if (!n.length) return W.req.whatNone;
    if (!R.note.trim()) return W.req.whatNote;
    if (R.files.some(function (f) { return f.busy; })) return W.req.whatFiles;
    return fill(W.req.what, { list: listWords(n.map(function (sh) { return SHN[sh].toLowerCase(); })), when: R.when ? fill(W.req.whatWhen, { on: day(R.when) }) : '' });
  }
  function reqReady() { var R = S.req; return reqPicked().length && R.note.trim() && !R.files.some(function (f) { return f.busy; }) && !R.sending; }
  function todayYmd() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function renderReq() {
    var R = S.req; if (!R) return '';
    var c = cust(R.cid); if (!c) return '';
    var Q = W.req;
    var tiles = SH.map(function (sh) { var on = !!R.picks[sh];
      return '<button type="button" class="ps-ad-pick' + (on ? ' on' : '') + '" data-pick="' + sh + '" aria-pressed="' + on + '"' + (R.sending ? ' disabled' : '') + '><span class="box" aria-hidden="true"></span>' + esc(SHN[sh]) + '</button>'; }).join('');
    var files = R.files.map(function (f, i) { return '<span class="ps-ad-fchip">' + esc(f.name) + (f.busy ? ' <em>' + esc(Q.uploading) + '</em>' : '') + (R.sending ? '' : ' <button type="button" class="ps-ad-cancel" data-rmfile="' + i + '">' + esc(Q.remove) + '</button>') + '</span>'; }).join('');
    return '<div class="ps-ad-ov" role="dialog" aria-modal="true" aria-labelledby="ps-ad-reqh"><div class="ps-ad-modal">' +
      '<div class="mh"><h2 id="ps-ad-reqh">' + esc(Q.head) + '</h2><p>' + esc(fill(Q.sub, { name: c.name })) + '</p></div>' +
      '<div class="mb">' +
        '<div class="fld"><div class="fl">' + esc(Q.which) + '<span class="sp"></span><button type="button" class="ps-ad-link" data-tickall="1">' + esc(Q.tickAll) + '</button></div><div class="ps-ad-picks">' + tiles + '</div></div>' +
        '<div class="fld"><label class="fl" for="ps-ad-reqwhen">' + esc(Q.when) + ' <span class="opt">' + esc(Q.optional) + '</span></label><input type="date" id="ps-ad-reqwhen" class="ps-ad-in' + (R.when ? ' chg' : '') + '" min="' + todayYmd() + '" value="' + esc(R.when) + '"' + (R.sending ? ' disabled' : '') + '></div>' +
        '<div class="fld"><label class="fl" for="ps-ad-reqnote">' + esc(Q.note) + '</label><textarea id="ps-ad-reqnote" class="ps-ad-in ps-ad-reqnote' + (R.note.trim() ? ' chg' : '') + '" placeholder="' + esc(Q.notePh) + '"' + (R.sending ? ' disabled' : '') + '>' + esc(R.note) + '</textarea><div class="ps-ad-need" id="ps-ad-reqneed">' + (reqPicked().length && !R.note.trim() ? esc(Q.noteNeed) : '') + '</div></div>' +
        '<div class="fld"><div class="fl">' + esc(Q.files) + ' <span class="opt">' + esc(Q.optional) + '</span></div><div class="ps-ad-files">' + files + (R.sending ? '' : '<button type="button" class="ps-ad-addf" data-addfile="1">' + esc(Q.addFiles) + '</button>') + '</div><input type="file" id="ps-ad-reqfile" multiple hidden></div>' +
      '</div>' +
      '<div class="mf"><div class="what" id="ps-ad-reqwhat">' + (R.sending ? esc(Q.sending) + '<div class="ps-ad-prog"><i></i></div>' : R.err ? '<span class="ps-ad-need">' + esc(R.err) + '</span>' : esc(reqWhat())) + '</div>' +
        (R.sending ? '' : '<button type="button" class="ps-ad-cancel" data-reqcancel="1">' + esc(Q.cancel) + '</button>') +
        '<button type="button" class="ix-btn ix-btn--primary" id="ps-ad-reqsend"' + (reqReady() ? '' : ' disabled') + '>' + esc(Q.send) + '</button></div>' +
    '</div></div>';
  }
  function reqFoot() {   // typing must not redraw the box (focus stays where it is)
    var R = S.req; if (!R) return;
    var w = el.querySelector('#ps-ad-reqwhat'), b = el.querySelector('#ps-ad-reqsend'), nd = el.querySelector('#ps-ad-reqneed'), nt = el.querySelector('#ps-ad-reqnote'), wh = el.querySelector('#ps-ad-reqwhen');
    if (w && !R.sending) w.textContent = R.err || reqWhat();
    if (b) b.disabled = !reqReady();
    if (nd) nd.textContent = reqPicked().length && !R.note.trim() ? W.req.noteNeed : '';
    if (nt) nt.classList.toggle('chg', !!R.note.trim());
    if (wh) wh.classList.toggle('chg', !!R.when);
  }
  function openReq(cid) { S.req = { cid: cid, picks: {}, when: '', note: '', files: [], sending: false, err: '' }; S.wd = null; render(); requestAnimationFrame(function () { var t = el.querySelector('.ps-ad-pick'); if (t) t.focus(); }); }
  function closeReq() { S.req = null; render(); }
  function addFiles(list) {
    var R = S.req; if (!R) return;
    Array.prototype.forEach.call(list || [], function (file) {
      if (file.size > 20 * 1024 * 1024) { toast(fill(W.req.tooBig, { name: file.name }), 'error', 'file'); return; }
      var f = { name: file.name, busy: true, url: '' }; R.files.push(f); render();
      var rd = new FileReader();
      rd.onload = function () {
        ctx.api('/ads/request/file', { method: 'POST', body: { publisher: ctx.publisher.id, name: file.name, type: file.type || '', data: String(rd.result || '') }, label: fill(W.api.file, { name: file.name }) }).then(function (r) {
          if (!S.req || S.req !== R) return;
          if (r.ok && r.json.url) { f.busy = false; f.url = r.json.url; }
          else { R.files.splice(R.files.indexOf(f), 1); toast(fill(W.req.fileFail, { name: file.name, msg: (r.json && r.json.error) || ('HTTP ' + r.status) }), 'error', 'file'); }
          render();
        });
      };
      rd.onerror = function () { R.files.splice(R.files.indexOf(f), 1); toast(fill(W.req.fileFail, { name: file.name, msg: 'the browser could not read it' }), 'error', 'file'); render(); };
      rd.readAsDataURL(file);
    });
  }
  async function sendReq() {
    var R = S.req; if (!R || !reqReady()) return;
    var c = cust(R.cid), picks = reqPicked();
    R.sending = true; R.err = ''; render();
    var r = await ctx.api('/ads/request', { method: 'POST', label: W.api.request,
      body: { publisher: ctx.publisher.id, customer: R.cid, shapes: picks, wantedBy: R.when || '', note: R.note.trim(), files: R.files.filter(function (f) { return f.url; }).map(function (f) { return { name: f.name, url: f.url }; }) } });
    if (!r.ok) { R.sending = false; R.err = fill(W.req.fail, { msg: (r.json && r.json.error) || ('HTTP ' + r.status) }); render(); return; }
    S.req = null; S.flash = {}; picks.forEach(function (sh) { S.flash[R.cid + '|' + sh] = 1; });
    S.tab[R.cid] = 'current';
    await load(); render();
    setTimeout(function () { S.flash = {}; }, 1600);
    toast(fill(W.req.sent, { list: listWords(picks.map(function (sh) { return SHN[sh].toLowerCase(); })), name: c ? c.name : '' }), 'ok', 'req');
    if ((r.json.unconfirmed || []).length) toast(fill(W.unconfirmed, { list: r.json.unconfirmed.join(', ') }), 'unverified', 'requnconf');
  }
  async function withdraw(key) {
    var p = key.split('|'), c = cust(p[0]); if (!c) return;
    var list = reqsOf(c, p[1]), latest = list[list.length - 1]; if (!latest) { S.wd = null; render(); return; }
    S.wd = { key: key, busy: true }; render();
    var r = await ctx.api('/ads/request/' + encodeURIComponent(latest.id) + '/withdraw', { method: 'POST', body: { publisher: ctx.publisher.id }, label: fill(W.api.withdraw, { shape: SHN[p[1]].toLowerCase() }) });
    S.wd = null;
    if (!r.ok) { render(); toast(fill(W.req.wdFail, { msg: (r.json && r.json.error) || ('HTTP ' + r.status) }), 'error', 'wd'); return; }
    await load(); render();
    toast(fill(W.req.withdrawn, { shape: SHN[p[1]].toLowerCase(), name: c.name }), 'ok', 'wd');
  }

  // ── wiring ──────────────────────────────────────────────────
  function wire() {
    el.addEventListener('click', function (e) {
      var t = e.target.closest('button,[data-c]'); if (!t || !el.contains(t)) return;
      var d = t.dataset;
      // v1.0.8 · request box and withdraw
      if (d.reqopen) { openReq(d.reqopen); return; }
      if (d.reqcancel) { closeReq(); return; }
      if (t.id === 'ps-ad-reqsend') { sendReq(); return; }
      if (d.pick && S.req) { if (S.req.picks[d.pick]) delete S.req.picks[d.pick]; else S.req.picks[d.pick] = 1; render(); return; }
      if (d.tickall && S.req) { SH.forEach(function (sh) { S.req.picks[sh] = 1; }); render(); return; }
      if (d.addfile) { var fi = el.querySelector('#ps-ad-reqfile'); if (fi) fi.click(); return; }
      if (d.rmfile !== undefined && S.req) { S.req.files.splice(+d.rmfile, 1); render(); return; }
      if (d.wdask) { S.wd = { key: d.wdask }; render(); return; }
      if (d.wdkeep) { S.wd = null; render(); return; }
      if (d.wdgo) { withdraw(d.wdgo); return; }
      if (d.f) { S.filter = S.filter === d.f ? null : d.f; render(); return; }
      if (d.mailclose !== undefined) { S.mail.splice(+d.mailclose, 1); render(); return; }
      if (d.mailcopy !== undefined) { var mm = S.mail[+d.mailcopy], txt = (mm.subject || '') + '\n\n' + (mm.body || ''); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast(W.mail.copied, 'ok', 'copy'); }, function () { toast(W.copyFail.replace('{url}', ''), 'error', 'copy'); }); return; }
      if (d.tab) { var tt = d.tab.split('|'); S.tab[tt[0]] = tt[1]; render(); return; }
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
    el.addEventListener('change', function (e) {   // v1.0.8: files picked in the request box
      if (e.target.id === 'ps-ad-reqfile') { addFiles(e.target.files); e.target.value = ''; }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.req && !S.req.sending) closeReq(); });   // v1.0.8
    el.addEventListener('keydown', function (e) {
      var t = e.target;
      if ((e.key === 'Enter' || e.key === ' ') && t.dataset && t.dataset.c && t.classList.contains('r')) { e.preventDefault(); t.click(); }
    });
    el.addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === 'ps-ad-reqnote' && S.req) { S.req.note = t.value; S.req.err = ''; reqFoot(); return; }   // v1.0.8
      if (t.id === 'ps-ad-reqwhen' && S.req) { S.req.when = t.value; reqFoot(); return; }
      if (t.id === 'ps-ad-q') { S.q = t.value; var tbl = el.querySelector('.ps-ad-tbl'); if (tbl) tbl.outerHTML = renderTable(); return; }
      if (t.dataset && t.dataset.note) { var g = S.staged[t.dataset.note]; if (!g) return; g.note = t.value; t.classList.toggle('chg', !!t.value);
        var need = t.parentNode.querySelector('.ps-ad-need'); if (need && t.value) need.remove(); else if (!need && !t.value) t.insertAdjacentHTML('afterend', '<div class="ps-ad-need">' + esc(W.noteNeed) + '</div>');
        var sw = el.querySelector('#ps-ad-savewrap'); if (sw) sw.innerHTML = renderSave(); }
    });
  }

  // ── mount ───────────────────────────────────────────────────
  function mount(node, c) {
    ctx = c; el = node;
    var deep = ''; try { deep = new URLSearchParams(location.search).get('customer') || ''; } catch (e) {}   // v1.0.8
    S = { customers: [], loaded: false, loadErr: '', filter: null, q: '', open: null, view: {}, staged: {}, saving: null, mail: [], tab: {}, linkDays: 14, staleMonths: 6,
          req: null, wd: null, flash: {}, deep: /^[0-9a-f]{24}$/.test(deep) ? deep : null };
    wire(); render();
    load().then(render);
  }
  function reg() { window.PsShell.register({ key: 'ads', mount: mount }); }
  if (window.PsShell) reg(); else document.addEventListener('DOMContentLoaded', reg);
})();
