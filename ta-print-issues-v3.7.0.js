/* ta-print-issues-v3.7.0.js
   ════════════════════════════════════════════════════════════════
   INBXIFY T-A — Print Issue Allocator
   Companions: ta-print-issues-v3.2.0.css (unchanged)
               ta-print-parse-v1.2.0.css  (upload modal + review-
                                           drafts strip; unchanged)
               ta-print-review-v1.4.0.js  (the review surface)
               ix-refresh-helper-v1.1.0.js (page bus + write ledger;
                                           load BEFORE this file)
               ix-info-v1.0.1.js          (the ⓘ badge; optional)
               ix-lightbox-v1.1.0.js      (page zoom, in the review)

   ── v3.7.0 · THE ISSUE LIST REDRAWS ITSELF (29 Sept) ──
   The issue list was read from the hidden SLATE rows Webflow
   rendered at page load, so after the review's Finish (or a board
   save) it could only be right after a full page reload. Now it
   follows the tab-wide rule from ix-refresh-helper v1.1.0: A
   CONFIRMED WRITE OUTRANKS ANY READ THAT HAS NOT CAUGHT UP WITH IT.
     · harvest() reads the page, then lays the ledger over it: a
       row's confirmed disposition and plans replace the page's, a
       deleted row is not counted, and rows the page does not have
       yet (just written by the review) are counted from the ledger,
       under their own issue. Nothing here settles the ledger: the
       board reads every field and does that; this file only reads.
     · It listens on the page bus. 'slate:written' (review Finish,
       board save or delete) re-reads and redraws. 'print-review:
       finished' drops that draft from "Reviews in progress" at once,
       then re-asks the Worker. It answers 'slate:listening?', which
       is what lets the review's Finish stop reloading the page.
     · ⓘ: the header carries IxInfo.badge() (standing rule, 29 Sept).

   ── v3.6.0 · THE MODAL ENDS AT EXTRACT · THE REVIEW IS A SURFACE ──
   Ruled 27 Sept: the review opens in place of the issue board
   inside the Print Issues tab; the upload modal only uploads and
   reads. Step A of the build plan.

     · The modal keeps steps 1–2: choose the PDF, read every page,
       stitch, extract events and listings. When extraction is done
       it hands the whole run to IXPrintReview.open() and closes.
       The review step, its tables, the page viewer and the 103B
       write path have MOVED to ta-print-review-v1.0.0.js.
     · The PDF is STORED at upload: the raw file goes to Uploadcare
       while the pages are being read, and the cover goes while the
       stitch runs, so a resumed review can render its pages and the
       write path no longer uploads anything. Both URLs travel in
       the handoff. A failed store costs later page viewing, never
       the review itself: the live pdf.js document is handed over
       too, and the console says what failed.
     · "Continue without this page": the failed-pages step gains a
       third choice. The pages that read are kept, the failed ones
       are skipped, and the stitch runs on what exists (the Worker
       already drops the gaps). Whatever was printed on a skipped
       page can be added in the review with "Add an item".
     · REVIEWS IN PROGRESS. The issue list asks the Worker for this
       title's saved drafts (GET /drafts?title=) and shows each one
       in a strip above the calendar: name, source, pages checked,
       when it was saved, and a Resume button that opens the review
       exactly as it was left. Uploading a PDF that already has a
       draft is stopped with the same choice: resume it, or discard
       the draft and read again. Never both.
     · HANDOFF CONTRACT (to IXPrintReview.open): { key, issueName,
       source, pages, taId, pdfUrl, coverUrl, folio, phases, items,
       pdf }. folio maps pdfPage → printedPageNumber from the page
       reads. Items keep the v3.5.2 shape; if a stitch item carries
       maybeContinues { reasons: [..] } (Worker v1.3.0, meaning "may
       continue the item before it"), it becomes continues
       { prevId, why } on the row — the review shows the join offer
       only where that evidence exists.
     · If ta-print-review is not on the page, the run stops with a
       message instead of pretending: there is no review step here
       to fall back to.
     · Deferred from Step A: the ix-progress "Check Make" wording on
       Worker calls — that fix needs the ix-progress source.

   ── v3.5.2 · SEE THE ACTUAL PAGES ──
   Asked 27 Sept: a way to look at the printed page while reviewing.
   The in-modal page viewer this added has moved to the review
   surface (v3.6.0), where the pages live now.

   ── v3.5.1 · EVERY AD KEPT · LISTINGS IN ADS · HOUSE ADS ──
   Rulings (Jeff, 27 Sept), before v3.5.0 was deployed. Needs
   ix-print-parse v1.1.1. v3.5.0 was never deployed: discard it.
     · Listings shown in an ad are read as RE items (any status), the
       ad's agent as the suggested Agent. Ads with only statistics
       give none. Homes sold long ago are still read; untick later.
     · Every print ad is kept; the publisher's own ads are house ads.
       (Their sections render in the review surface since v3.6.0.)
     · Ads are NOT written to SLATE in this version (103B v1.3,
       build step B, adds them).

   ── v3.5.0 · EVENTS AND LISTINGS, ITEM BY ITEM (Allocator step 1) ──
   Spec: Allocator-RE-Events-Spec v1.10, build step 1 (Parser).
   Needs ix-print-parse v1.1.0 (/extract, new stitch types).
     · Two row types: Events page and RE page — ONE row per page.
     · After the stitch, /extract reads the items on those pages and
       the event announced by any flagged article or ad.
     · Listing Phase is matched against the LIVE options from the
       ix-asset-list Worker (TA_CONFIG.assetListUrl). No word list
       lives here.
     · A failed page read for items does not stop the run.
     · Nothing is created or updated for events or listings yet
       (steps 3–4). SLATE gained the Events page / RE page type
       options on 27 Sept, but 103B v1.2 maps type through fixed
       ids and does not know them, so those rows are still written
       as "other" — by the review surface now. 103B v1.3 ends that.

   HARDCODED (provisional, logged):
     · HC-P-AL-1 — "Sold" is the phase that hides price by default.
       Platform rule (ruled 26 Sept). Lives in the review surface
       since v3.6.0; nothing here reads it.
     · HC-TPI-PDFJS — the pdf.js 3.11.174 cdnjs URL. Platform
       library pin; TA_CONFIG.pdfjsUrl overrides it (here and in
       ta-print-review).

   ── v3.4.1 · A PARSED ISSUE IS NEVER HIDDEN ──
   An issue with rows is work in hand, whatever its date: isFuture()
   returns false as soon as a slot has an issue attached. Hiding
   still applies to genuinely empty future months. The year shown
   opens on the newest year that has a parsed issue.

   ── v3.4.0 · CUSTOMER, NOT ADVERTORIAL · RANGE SELECT · NO SCROLL JUMP ──
   Every editorial piece is an Article; what makes one paid is its
   Customer (SLATE `suggested-customer`, read back by 103B v1.2).
   Shift-click ranges, Cmd/Ctrl toggles. Redraws restore scroll.

   ── v3.3.x · UPLOAD IS LIVE ──
   v3.3.0 introduced the three-step modal and the write order (cover
   first, then row 1 alone, checked — TOAST-TRUTH — then the rest).
   v3.3.1 kept the chosen file on screen; v3.3.2 removed the doubled
   filename; v3.3.3 let a failed page keep the run alive with Retry;
   v3.3.4 gave the long stitch a clock and a moving stripe.
   DUPLICATES: a PDF whose filename already has SLATE rows is
   refused before reading, with the row count. Future slots can
   upload. Off-calendar Upload PDF in the header.

   CONFIG. Upload renders disabled, naming what is missing, unless
   TA_CONFIG carries printParseWorker, makeSlateWriter,
   uploadcarePublicKey and taItemId. No tenant value lives here.

   Mounts in the `PrintIssue` pane, ABOVE the Print Issue Slate Plan.

   ── v3.2.3 · THE SURFACE NAME IS A VARIABLE ──
   SURFACE holds the name once; the header, the fallback and the
   breadcrumb read it.

   ── v3.2.2 · HEADER RENAMED · "Print Issue Allocator" ──
   The naming hierarchy:
       01 Print Issues          the object   (rail group, ta-chrome)
          Allocator             the tool     (Designer tab label)
          Print Issue Allocator the surface  (this header)
   `data-w-tab` is still "PrintIssue" and must stay that way —
   ta-chrome's RAIL_GROUPS keys on it. Do not tidy it to match a
   label.

   ── v3.2.0 · IT WEARS THE CANONICAL HEADER ──
   IxHeader.render / IxHeader.refreshBtn / IxTabs.l1. Hard
   dependency: ix-header and ix-refresh-helper load BEFORE this
   file; if either is missing the header degrades, never throws.

   ── v3.1.0 · MATCH ON SOURCE, NOT ON A NAME TYPED SIXTEEN TIMES ──
   A plan entry may carry a source (the PDF filename). Matched on
   source first, then name, then nothing. Unmatched issues show
   under "Not on the calendar" and are never dropped.

   ── v3.0.x · THE PLAN IS THE SCHEDULE ──
   print-issue-plan-json on TITLES-ADMIN, bound as data-issue-plan.
   Real publishing systems store a schedule, they do not compute
   one. The attribute is found wherever it is bound, but never the
   wrong title's: data-id must match this title when several render.

   ── FAIL-SAFE ──
   No pane, no frequency, an unmatched name: returns false or falls
   back and changes nothing. Never throws.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var VERSION = '3.7.0';

  /* v3.2.3 — the surface name, once. Read by headHtml() for both
     the canonical header and its fallback, and by the breadcrumb
     back-button. NOT tenant data: this is the name of the tool,
     the same on every title. The per-title name is the SUBTITLE,
     which ix-header resolves on its own from the live TITLE. */
  var SURFACE = 'Print Issue Allocator';
  var TAG = '[print-issues v' + VERSION + ']';

  /* v3.3.0 — the upload gate is uploadGate(), in PARSE below. It is
     derived from config, not a constant. */

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  var S = {
    parsed: [],        /* issues found in the DOM */
    orphans: [],       /* parsed but matching no planned issue */
    plan: [],          /* the schedule, as stored */
    planned: false,    /* false when no plan is set — say so, do not fake one */
    drafts: [],        /* v3.6.0 — saved reviews from the Worker */
    year: null,
    show: 'past',      /* 'past' | 'next' | 'all' */
    picked: null,
    root: null,
    boardHost: null
  };

  // ══════════════════════════════════════════════════════════
  // CONFIG
  // ══════════════════════════════════════════════════════════

  function cfg() { return window.TA_CONFIG || {}; }

  /* THE PLAN IS THE SCHEDULE. Read, never computed.

     [{ "name": "September 2026", "y": 2026, "m": 9 }]

     `m` is 1-based, because a human writing this by hand in Webflow
     will write 9 for September. Only `name` is required — y/m are
     for sorting and for knowing what is in the past, and an entry
     without them still renders, just at the end of its year. */
  /* This title's TITLES-ADMIN id. .ta-item is the element that
     already anchors tenancy for every other surface on the page. */
  function titleAdminId() {
    var el = document.querySelector('.ta-item');
    if (!el) return '';
    return (el.getAttribute('data-title-id') ||
            el.getAttribute('title-admin-id') ||
            el.getAttribute('data-title-admin-id') || '').trim();
  }

  /* Find the plan wherever it is bound, but never take the wrong
     title's. A Collection List filtered by PUBLISHER renders one
     element per title, so "the first one" is a tenancy breach that
     looks like data. */
  function planSource() {
    var all = document.querySelectorAll('[data-issue-plan]');
    if (!all.length) return null;

    var mine = titleAdminId();
    if (mine) {
      for (var i = 0; i < all.length; i++) {
        var id = (all[i].getAttribute('data-id') ||
                  all[i].getAttribute('data-title-id') || '').trim();
        if (id && id === mine) return all[i];
      }
    }

    /* One candidate and no id to match on is unambiguous. */
    if (all.length === 1) return all[0];

    console.error(TAG, all.length + ' elements carry data-issue-plan and none ' +
                       'matches this title (' + (mine || 'no id found') + '). ' +
                       'Refusing to guess \u2014 bind data-id alongside it.');
    return null;
  }

  function readPlan() {
    var el = planSource();
    var raw = (el && el.getAttribute('data-issue-plan')) || cfg().printIssuePlan || '';
    raw = String(raw).trim();

    if (!raw) {
      console.warn(TAG, 'no data-issue-plan found on any element \u2014 no schedule ' +
                        'to show. Bind print-issue-plan-json to data-issue-plan.');
      return { plan: [], ok: false };
    }

    var arr;
    try { arr = JSON.parse(raw); }
    catch (e) {
      /* A malformed plan is louder than a missing one: something was
         set and it is wrong, which is worse than nothing being set. */
      console.error(TAG, 'print-issue-plan-json will not parse \u2014 ' +
                         'no schedule shown.', e.message);
      return { plan: [], ok: false, bad: true };
    }
    if (!arr || !arr.length) return { plan: [], ok: false };

    var out = [];
    arr.forEach(function (e, i) {
      if (!e || !e.name) {
        console.warn(TAG, 'plan entry ' + i + ' has no name \u2014 skipped.');
        return;
      }
      var y = parseInt(e.y, 10);
      var m = parseInt(e.m, 10);
      out.push({
        k:      (y || 0) + '-' + (m || 0) + '-' + e.name,
        label:  String(e.name),
        y:      y || null,
        m:      (m >= 1 && m <= 12) ? m - 1 : null,   /* to 0-based internally */
        sub:    e.sub ? String(e.sub) : '',
        /* The reliable key. Optional, because an entry is written
           before its PDF exists and cannot know the filename yet. */
        source: e.source ? String(e.source).trim() : ''
      });
    });
    return { plan: out, ok: out.length > 0 };
  }

  // ══════════════════════════════════════════════════════════
  // READ
  // ══════════════════════════════════════════════════════════

  function attr(el, n) { return (el.getAttribute(n) || '').trim(); }

  /* Tolerant on the three attributes added Sep 5 only. A name bound
     slightly differently still renders, and the console says which
     alias answered — a blank page teaches nothing. The two
     pre-existing attributes are read strictly, because the board
     already depends on those exact names. */
  function attrAny(el, names) {
    for (var i = 0; i < names.length; i++) {
      var v = attr(el, names[i]);
      if (v) return { v: v, k: names[i] };
    }
    return { v: '', k: null };
  }
  var A_NAME  = ['data-issue-name', 'data-print-issue-name'];
  var A_PAGES = ['data-issue-pages', 'data-print-issue-pages'];
  var A_ON    = ['data-parsed-on', 'data-parsed'];

  /* v3.7.0 — the ledger (ix-refresh-helper v1.1.0), read only. */
  function ledger() {
    var X = window.IxRefresh;
    return (X && X.pending && X.pendingAll) ? X : null;
  }

  function harvest() {
    var rows = document.querySelectorAll('.slate-item');
    var by = {}, order = [], seen = {};
    var X = ledger(), onPage = {};

    Array.prototype.forEach.call(rows, function (el) {
      if (!attr(el, 'data-name')) return;          /* an unbound row is not a row */

      /* v3.7.0 — a confirmed write outranks the page */
      var sid = attr(el, 'data-slate-id');
      if (sid) onPage[sid] = 1;
      var pend = (X && sid) ? X.pending('slate', sid) : null;
      if (pend && pend._deleted) return;

      var src = attr(el, 'data-source');
      var key = src || '\u2014 no source \u2014';

      if (!by[key]) {
        var nm = attrAny(el, A_NAME), pg = attrAny(el, A_PAGES), on = attrAny(el, A_ON);
        [['name', nm], ['pages', pg], ['parsed', on]].forEach(function (p) {
          if (p[1].k && !seen[p[0]]) seen[p[0]] = p[1].k;
        });
        by[key] = {
          source: src, name: nm.v, named: !!nm.v,
          pages: parseInt(pg.v, 10) || 0,
          parsed: on.v,
          cover: attr(el, 'data-cover-url'),
          items: 0, alloc: 0, park: 0, del: 0, und: 0
        };
        order.push(key);
      }

      var I = by[key];
      I.items++;
      if (!I.cover) I.cover = attr(el, 'data-cover-url');

      var d = attr(el, 'data-disposition').toLowerCase();
      var hasPlan = el.querySelectorAll('.slate-plan').length > 0;
      if (pend && pend['disposition'] != null) d = String(pend['disposition']).toLowerCase();
      if (pend && pend['publication-plans']) hasPlan = pend['publication-plans'].length > 0;
      tally(I, d, hasPlan);
    });

    /* v3.7.0 — rows confirmed on this page that the page does not list
       yet (a review just finished). Counted under their own issue. */
    if (X) {
      var mine = taId();
      X.pendingAll('slate').forEach(function (e) {
        var f = e.fields || {};
        if (onPage[e.id] || f._deleted) return;
        if (!f['name'] && !f['print-title']) return;   /* a partial record is not a row */
        if (mine && f['title-admin'] && f['title-admin'] !== mine) return;
        var src = String(f['source'] || '');
        var key = src || '\u2014 no source \u2014';
        if (!by[key]) {
          var nm = String(f['print-issue-name'] || '');
          by[key] = {
            source: src, name: nm, named: !!nm,
            pages: parseInt(f['print-issue-pages'], 10) || 0,
            parsed: String(f['parsed-on'] || ''),
            cover: String(f['cover-url'] || ''),
            items: 0, alloc: 0, park: 0, del: 0, und: 0
          };
          order.push(key);
        }
        var I = by[key];
        I.items++;
        if (!I.cover && f['cover-url']) I.cover = String(f['cover-url']);
        tally(I, String(f['disposition'] || 'undecided').toLowerCase(),
              (f['publication-plans'] || []).length > 0);
      });
    }

    var found = Object.keys(seen).map(function (k) { return k + '=' + seen[k]; });
    if (found.length) console.log(TAG, 'issue attributes read:', found.join(' '));
    return order.map(function (k) { return by[k]; });
  }

  function tally(I, d, hasPlan) {
    if (d === 'not-for-newsletter') I.del++;
    else if (d === 'held')          I.park++;
    else if (hasPlan)               I.alloc++;
    else                            I.und++;
  }

  // ══════════════════════════════════════════════════════════
  // SLOTS
  // ══════════════════════════════════════════════════════════

  /* Slots ARE the plan, filtered to the year. No arithmetic — an
     entry exists or it does not. */
  function slotsFor(year) {
    return S.plan.filter(function (e) { return e.y === year; });
  }

  /* Every year the plan mentions, newest first. A year with no
     entries has no tab, because there is nothing to show in it. */
  function planYears() {
    var seen = {}, out = [];
    S.plan.forEach(function (e) { if (e.y && !seen[e.y]) { seen[e.y] = 1; out.push(e.y); } });
    out.sort(function (a, b) { return b - a; });
    return out;
  }

  function norm(s) { return String(s || '').toLowerCase().replace(/[\s.,]/g, ''); }

  /* Never on parsed-on: an issue READ in August can be the September
     issue, and dating it by when it was read would file it wrong.

     SOURCE FIRST. It is the PDF filename — one value per parse, on
     every row, never hand-typed, and already what harvest() groups
     on. Name is the fallback for a slot whose PDF does not exist
     yet, and it is display-only once a source is present.

     Two passes, not one: every source match is taken BEFORE any name
     match is considered. Otherwise a slot earlier in the year could
     claim an issue by a loose name match and leave the slot that
     names its source exactly with nothing. */
  function attach(slots) {
    var used = {};
    slots.forEach(function (s) { s.issue = null; });

    slots.forEach(function (s) {
      if (!s.source) return;
      for (var i = 0; i < S.parsed.length; i++) {
        if (used[i]) continue;
        if (norm(S.parsed[i].source) === norm(s.source)) {
          s.issue = S.parsed[i]; used[i] = 1; return;
        }
      }
    });

    slots.forEach(function (s) {
      if (s.issue) return;
      for (var i = 0; i < S.parsed.length; i++) {
        var I = S.parsed[i];
        if (used[i] || !I.named) continue;
        if (norm(I.name) === norm(s.label)) { s.issue = I; used[i] = 1; return; }
      }
    });

    /* Anything unmatched is shown, not dropped. A rename or a typo
       must never make an issue disappear. */
    S.orphans = S.parsed.filter(function (_, i) { return !used[i]; });
    return slots;
  }

  /* An entry with no month cannot be placed in time, so it is never
     treated as future — it shows rather than hides.
     v3.4.1 — nor is an issue that has been parsed. Rows on the slot
     mean work in hand, and work in hand is never hidden. */
  function isFuture(s) {
    if (s.issue) return false;
    if (s.y == null || s.m == null) return false;
    var n = new Date();
    return s.y > n.getFullYear() || (s.y === n.getFullYear() && s.m > n.getMonth());
  }

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c];
    });
  }
  function pct(n, t) { return t ? (n / t * 100).toFixed(1) + '%' : '0%'; }

  function fmtDate(raw) {
    var d = new Date(raw);
    if (isNaN(d.getTime())) return raw || '';
    /* Webflow stores UTC. Without an explicit zone this renders a day
       early for anyone west of it — the same offset that hits the
       masthead and the splash. */
    try {
      return d.toLocaleDateString('en-US',
        { month: 'short', day: 'numeric', timeZone: cfg().titleTimezone || 'America/New_York' });
    } catch (e) { return raw; }
  }

  /* v3.6.0 — a saved-draft time, date and clock. */
  function fmtWhen(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var h = d.getHours(), ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
    return fmtDate(iso) + ', ' + h + ':' + ('0' + d.getMinutes()).slice(-2) + ' ' + ap;
  }

  function progHtml(I) {
    return '<span class="tpi-prog">' +
      '<span class="tpi-n ' + (I.und ? 'tpi-n--open' : 'tpi-n--mute') + '">' +
        '<b>' + I.und + '</b><span>UNDECIDED</span></span>' +
      '<span class="tpi-n ' + (I.alloc ? 'tpi-n--done' : 'tpi-n--mute') + '">' +
        '<b>' + I.alloc + '</b><span>ALLOCATED</span></span>' +
      '<span class="tpi-bar">' +
        '<i class="tpi-b--al" style="width:' + pct(I.alloc, I.items) + '"></i>' +
        '<i class="tpi-b--pk" style="width:' + pct(I.park,  I.items) + '"></i>' +
        '<i class="tpi-b--dl" style="width:' + pct(I.del,   I.items) + '"></i>' +
        '<i class="tpi-b--un" style="width:' + pct(I.und,   I.items) + '"></i>' +
      '</span></span>';
  }

  function filledHtml(I, label) {
    var done = I.und === 0;
    return '<button type="button" class="tpi-sl tpi-sl--parsed" data-tpi-open="' +
             esc(I.source) + '">' +
      '<span class="tpi-cv">' +
        (I.cover ? '<img src="' + esc(I.cover) + '" alt="">' : 'COVER') + '</span>' +
      '<span class="tpi-mid">' +
        '<span class="tpi-mn">' + esc(I.named ? I.name : (label || I.source)) + '</span>' +
        '<span class="tpi-meta">' + esc(I.source) +
          (I.pages ? ' \u00b7 ' + I.pages + 'pp' : '') +
          ' \u00b7 ' + I.items + ' item' + (I.items === 1 ? '' : 's') +
          (I.parsed ? ' \u00b7 parsed ' + esc(fmtDate(I.parsed)) : '') +
        '</span>' +
      '</span>' +
      progHtml(I) +
      '<span class="tpi-st ' + (done ? 'tpi-st--done' : 'tpi-st--open') + '">' +
        (done ? 'Complete' : 'Open') + '</span>' +
      '<span class="tpi-chev">\u203A</span>' +
    '</button>';
  }

  function emptyHtml(s) {
    var fut = isFuture(s);
    var why = uploadWhy();
    var off = !!why;
    return '<div class="tpi-sl tpi-sl--empty' + (fut ? ' tpi-sl--future' : '') + '">' +
      '<span class="tpi-cv">\u2014</span>' +
      '<span class="tpi-mid">' +
        '<span class="tpi-mn">' + esc(s.label) +
          (s.sub ? ' <span class="tpi-meta">' + esc(s.sub) + '</span>' : '') + '</span>' +
        '<span class="tpi-meta">' + (fut ? 'not published yet'
          : s.source ? esc(s.source) + ' \u2014 not parsed yet'
          : 'no PDF uploaded') + '</span>' +
      '</span>' +
      '<span class="tpi-st tpi-st--none">' + (fut ? 'Upcoming' : 'Empty') + '</span>' +
      '<span class="tpi-act"><button type="button" class="ix-btn ix-btn--primary tpi-up"' +
        (off ? ' disabled title="' + esc(why) + '"' : '') +
        ' data-tpi-up="' + esc(s.k) + '">Upload PDF</button></span>' +
    '</div>';
  }

  /* v3.6.0 — saved reviews, above the calendar. One place, one
     behavior: every draft for this title appears here, whether or
     not a slot or a parsed issue matches it. */
  function draftsStripHtml() {
    if (!S.drafts.length) return '';
    var hasReview = !!(window.IXPrintReview && window.IXPrintReview.resume);
    return '<div class="tpi-dr">' +
      '<span class="tpi-dr-h">Reviews in progress</span>' +
      S.drafts.map(function (d) {
        return '<div class="tpi-dr-row">' +
          '<span class="tpi-dr-mn">' + esc(d.issueName || d.source || 'Untitled review') + '</span>' +
          '<span class="tpi-dr-meta">' + esc(d.source || '') +
            (d.pages ? ' \u00b7 ' + d.pages + ' pages' : '') +
            ' \u00b7 ' + (d.checked || 0) + ' checked' +
            (d.savedAt ? ' \u00b7 saved ' + esc(fmtWhen(d.savedAt)) : '') + '</span>' +
          '<span class="tpi-dr-act">' +
            (hasReview
              ? '<button type="button" class="ix-btn ix-btn--primary ix-btn--gold" data-tpi-resume="' +
                  esc(d.key) + '">Resume review</button>'
              : '<span class="tpi-dr-why">ta-print-review is not loaded on this page</span>') +
          '</span>' +
        '</div>';
      }).join('') +
      '</div>';
  }

  /* v3.3.0 — upload for an issue the schedule does not list. */
  function upHeadBtn() {
    var why = uploadWhy();
    return '<button type="button" class="ix-btn ix-btn--secondary tpi-up-h" data-tpi-up=""' +
      (why ? ' disabled title="' + esc(why) + '"' : '') + '>Upload PDF</button>';
  }

  function hasHeader() { return !!(window.IxHeader && window.IxHeader.render); }

  /* v3.7.0 — the ⓘ (standing rule, 29 Sept). Absent ix-info: nothing. */
  function infoBadge() {
    if (!(window.IxInfo && window.IxInfo.badge)) return '';
    return window.IxInfo.badge({
      file: 'ta-print-issues-v' + VERSION + '.js',
      version: VERSION,
      title: SURFACE,
      blurb: 'One row per planned print issue for this title. Upload PDF reads the issue ' +
             'page by page and opens the Issue Review; saved reviews wait under Reviews in ' +
             'progress. Once an issue is added, its row shows how many items are undecided ' +
             'and allocated, and opens the Slate Plan board. The list redraws itself after ' +
             'the review or the board saves, so nothing needs a reload.',
      scenarios: [
        { name: '103B \u00b7 SLATE Writer', note: 'used by the review and the board to write SLATE rows' }
      ],
      companions: 'ta-print-issues-v3.2.0.css \u00b7 ix-print-parse Worker (page reads, drafts) \u00b7 ix-refresh-helper v1.1.0'
    });
  }

  function headHtml(right, extra) {
    if (!hasHeader()) {
      return '<div class="tpi-head"><h2 class="tpi-h2">' + esc(SURFACE) + '</h2>' +
             (extra || '') + '<span class="tpi-sp"></span>' + (right || '') + upHeadBtn() + infoBadge() + '</div>';
    }
    return window.IxHeader.render({
      icon:  '\uD83D\uDCF0',            /* newspaper — the print issue itself */
      title: SURFACE,
      actions: [
        extra || '',
        right  || '',
        upHeadBtn(),
        window.IxHeader.refreshBtn({ attr: 'data-tpi-refresh' }),
        infoBadge()
      ]
    });
  }

  /* IxRefresh owns disable + spinner + restore, so no surface
     re-implements a loading state. */
  function wireRefresh() {
    var btn = S.root && S.root.querySelector('[data-tpi-refresh]');
    if (!btn) return;
    if (window.IxRefresh && window.IxRefresh.wire) {
      window.IxRefresh.wire(btn, function () {
        var read = readPlan();
        S.plan = read.plan; S.planned = read.ok;
        S.parsed = harvest();
        fetchDrafts();
        render();
      });
    } else {
      btn.addEventListener('click', function () { S.parsed = harvest(); fetchDrafts(); render(); });
    }
  }

  function render() {
    if (!S.root) return;
    if (S.picked) { showBoard(); return; }

    if (!S.planned) { renderNoPlan(); return; }

    var slots = attach(slotsFor(S.year)).slice().reverse();   /* newest first */
    var future = slots.filter(isFuture);

    /* Upcoming slots are hidden by default: a row that can only ever
       say "not yet" is not worth a row. */
    var shown = S.show === 'all'  ? slots
              : S.show === 'next' ? slots.filter(function (s, i) {
                  return !isFuture(s) || i === future.length - 1; })
              : slots.filter(function (s) { return !isFuture(s); });

    var have = 0, past = 0;
    slots.forEach(function (s) { if (s.issue) have++; if (!isFuture(s)) past++; });

    var nHidden = slots.length - shown.length;
    var reveal = !future.length ? '' :
        (S.show === 'past'
          ? '<button type="button" class="ix-btn ix-btn--ghost tpi-rv" data-tpi-show="next">Show next issue</button>'
        : S.show === 'next'
          ? '<button type="button" class="ix-btn ix-btn--ghost tpi-rv" data-tpi-show="all">Show all ' +
            future.length + ' upcoming</button>' +
            '<button type="button" class="ix-btn ix-btn--ghost tpi-rv" data-tpi-show="past">Hide upcoming</button>'
          : '<button type="button" class="ix-btn ix-btn--ghost tpi-rv" data-tpi-show="past">Hide ' +
            future.length + ' upcoming</button>') +
        (nHidden ? '<span class="tpi-hid">' + nHidden + ' hidden</span>' : '');

    var years = planYears();

    S.root.innerHTML =
      headHtml(
        '<span class="tpi-sub">' + have + ' of ' + past + ' published issue' +
          (past === 1 ? '' : 's') + ' parsed</span>' +
        '<span class="tpi-reveal">' + reveal + '</span>',
        '<span class="tpi-freq">' + slots.length + ' issue' +
          (slots.length === 1 ? '' : 's') + ' planned for <b>' + S.year + '</b></span>'
      ) +

      /* Year tabs are CHANNEL tabs — the same row Asset Library and
         Newsletters use — not a third kind invented here. */
      (years.length > 1 && window.IxTabs
        ? window.IxTabs.l1(years.map(function (y) {
            return { key: String(y), label: String(y) };
          }), String(S.year), 'data-tpi-yr')
        : years.length > 1
          ? '<div class="tpi-yr">' + years.map(function (y) {
              return '<button type="button" class="tpi-yb' + (y === S.year ? ' tpi-yb--on' : '') +
                     '" data-tpi-yr="' + y + '">' + y + '</button>';
            }).join('') + '</div>'
          : '') +

      /* v3.6.0 — saved reviews first: they are work in hand. */
      draftsStripHtml() +

      '<div class="tpi-list">' +
        shown.map(function (s) {
          return s.issue ? filledHtml(s.issue, s.label) : emptyHtml(s);
        }).join('') +
      '</div>' +

      /* Named but matching no slot. Shown rather than dropped — a
         rename must never make an issue disappear. */
      (S.orphans.length
        ? '<div class="tpi-orph"><span class="tpi-orph-h">Not on the calendar</span>' +
          '<span class="tpi-orph-w">No planned issue in ' + S.year + ' names this ' +
            'source or matches this name. Add <code>\"source\"</code> to the plan entry ' +
            '\u2014 it is the reliable key, because the filename is written once per ' +
            'parse and the name is repeated on every row.</span>' +
          S.orphans.map(function (I) { return filledHtml(I); }).join('') + '</div>'
        : '');

    wireRefresh();
    if (S.boardHost) S.boardHost.hidden = true;
  }

  /* A missing schedule is a stated absence, not an empty page. It
     names the field and shows the shape the value takes, because the
     next thing the operator does is go and write one. */
  function renderNoPlan() {
    S.root.innerHTML =
      headHtml('', '') +
      draftsStripHtml() +
      '<div class="tpi-noplan">' +
        '<b>No publishing schedule set for this title.</b>' +
        '<span>Print issues are a schedule, not a frequency \u2014 five a year, a skipped ' +
          'August and a Christmas double issue are all normal. So the schedule is stored ' +
          'rather than calculated.</span>' +
        '<span>Set <code>print-issue-plan-json</code> on TITLES-ADMIN and bind it as ' +
          '<code>data-issue-plan</code> on any element \u2014 <code>ta-title-src</code> ' +
          'is the natural one. If several titles render, bind <code>data-id</code> ' +
          'beside it so the right plan is picked.</span>' +
        '<pre>[\n' +
        '  { "name": "January 2026",  "y": 2026, "m": 1 },\n' +
        '  { "name": "February 2026", "y": 2026, "m": 2 }\n' +
        ']</pre>' +
      '</div>';
    wireRefresh();
    if (S.boardHost) S.boardHost.hidden = true;
  }

  function showBoard() {
    var I = null;
    for (var i = 0; i < S.parsed.length; i++)
      if (S.parsed[i].source === S.picked) I = S.parsed[i];
    if (!I) { S.picked = null; render(); return; }

    S.root.innerHTML =
      '<div class="tpi-crumb">' +
        '<button type="button" class="tpi-back" data-tpi-back="1">\u2039 ' + esc(SURFACE) + '</button>' +
        '<span class="tpi-crumb-n">' + esc(I.named ? I.name : I.source) + '</span>' +
        '<span class="tpi-crumb-m">' + esc(I.source) +
          (I.pages ? ' \u00b7 ' + I.pages + 'pp' : '') +
          ' \u00b7 ' + I.items + ' items</span>' +
      '</div>';

    if (S.boardHost) S.boardHost.hidden = false;
  }

  // ══════════════════════════════════════════════════════════
  // SELECTION — published, not passed
  // ══════════════════════════════════════════════════════════

  function publish(source) {
    window.IX_PRINT_ISSUE = source || null;
    try {
      document.dispatchEvent(new CustomEvent('ix:print-issue-change',
        { detail: { source: source || null } }));
    } catch (e) {
      var ev = document.createEvent('Event');
      ev.initEvent('ix:print-issue-change', true, true);
      document.dispatchEvent(ev);
    }
  }

  // ══════════════════════════════════════════════════════════
  // DRAFTS  (v3.6.0)
  // Saved reviews live in the ix-print-parse Worker's KV. This file
  // only LISTS them; the review surface owns their content.
  // ══════════════════════════════════════════════════════════

  function fetchDrafts() {
    var base = workerBase(), tid = taId();
    if (!base || !/^[0-9a-f]{24}$/.test(tid)) { S.drafts = []; return Promise.resolve(); }
    return fetch(base + '/drafts?title=' + encodeURIComponent(tid))
      .then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (j) {
        var next = (j && j.ok === true && j.drafts) ? j.drafts : [];
        next.sort(function (a, b) { return String(b.savedAt || '').localeCompare(String(a.savedAt || '')); });
        var changed = JSON.stringify(next) !== JSON.stringify(S.drafts);
        S.drafts = next;
        if (changed && !S.picked) render();
      })
      .catch(function (e) {
        console.warn(TAG, 'could not list saved reviews: ' + (e.message || e));
      });
  }

  /* Same rule the review uses: 24-hex title id, colon, then the
     source with anything outside [A-Za-z0-9:_.-] as a dash. */
  function draftKeyFor(source) {
    var tail = String(source || 'issue').replace(/[^A-Za-z0-9:_.\-]+/g, '-').slice(0, 170);
    return taId() + ':' + (tail || 'issue');
  }
  function draftFor(source) {
    var key = draftKeyFor(source);
    for (var i = 0; i < S.drafts.length; i++) if (S.drafts[i].key === key) return S.drafts[i];
    return null;
  }
  function deleteDraft(key) {
    return fetch(workerBase() + '/draft?key=' + encodeURIComponent(key), { method: 'DELETE' })
      .then(function (r) { return r.json().catch(function () { return null; }); });
  }

  // ══════════════════════════════════════════════════════════
  // PARSE  (v3.3.0)
  // PDF → page images → ix-print-parse → hand off to the review
  // ══════════════════════════════════════════════════════════

  /* HC-TPI-PDFJS · the pdf.js build is a platform library pin, not
     tenant data. Override per deployment with TA_CONFIG.pdfjsUrl.
     3.x is the last line with a UMD build (window.pdfjsLib); 4.x is
     ES-module only and cannot be loaded with a plain script tag. */
  var PDFJS_DEFAULT   = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  var RENDER_WIDTH    = 1400;   /* px sent to the reader per page */
  var JPEG_QUALITY    = 0.85;
  var READ_CONCURRENCY = 4;     /* pages read at once */
  var READ_RETRIES    = 1;      /* one retry per page before the run fails */
  var STITCH_TIMEOUT_MS = 5 * 60 * 1000;
  var STITCH_LINES = [
    'Matching continued pages to the article they belong to',
    'Separating editorial from advertising',
    'Reading titles, sections and bylines',
    'Counting the photos in each item',
    'Putting the items in page order'
  ];

  /* v3.4.0 — Article | Other. Paid is the Customer, not a type.
     v3.5.0 — plus Events page and RE page (one row per listings page).
     v3.6.0 — used only to validate the stitch's `type`; the chips
     that edited it live in the review surface now. */
  var TYPE_OPTS = [
    { v: 'article',     l: 'Article' },
    { v: 'other',       l: 'Other' },
    { v: 'events-page', l: 'Events' },
    { v: 're-page',     l: 'RE' }
  ];

  /* v3.5.1 — the two ad kinds. */
  var AD_TYPE_OPTS = [
    { v: 'print-ad', l: 'Print ad' },
    { v: 'house-ad', l: 'House' }
  ];

  /* v3.5.0 — item extraction */
  var EXTRACT_CONCURRENCY = 3;
  var EXTRACT_RETRIES     = 1;
  var EXTRACT_TIMEOUT_MS  = 4 * 60 * 1000;

  function taId() { return String(cfg().taItemId || titleAdminId() || '').trim(); }

  /* Everything the flow needs, named. An empty list means ready.
     makeSlateWriter stays in the gate although the WRITE happens in
     the review now: an upload whose review cannot create rows is a
     dead end better refused at the door. */
  function uploadGate() {
    var c = cfg(), miss = [];
    if (!c.printParseWorker)    miss.push('TA_CONFIG.printParseWorker');
    if (!c.makeSlateWriter)     miss.push('TA_CONFIG.makeSlateWriter');
    if (!c.uploadcarePublicKey) miss.push('TA_CONFIG.uploadcarePublicKey');
    if (!taId())                miss.push('TA_CONFIG.taItemId');
    if (!(window.IXPrintReview && window.IXPrintReview.open))
                                miss.push('ta-print-review-v1.0.0.js on this page');
    return miss;
  }
  function uploadWhy() {
    var m = uploadGate();
    return m.length ? 'Upload needs ' + m.join(', ') + '.' : '';
  }

  function slugify(s) {
    return String(s || '').toLowerCase()
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  /* ── pdf.js, loaded once, only when someone uploads ── */
  var pdfjsP = null;
  function loadPdfjs() {
    if (window.pdfjsLib && window.pdfjsLib.getDocument) return Promise.resolve(window.pdfjsLib);
    if (pdfjsP) return pdfjsP;
    var src = cfg().pdfjsUrl || PDFJS_DEFAULT;
    pdfjsP = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = function () {
        var L = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
        if (!L || !L.getDocument) { pdfjsP = null; rej(new Error('pdf.js loaded but exposed nothing')); return; }
        L.GlobalWorkerOptions.workerSrc = src.replace(/pdf(\.min)?\.js$/, 'pdf.worker$1.js');
        window.pdfjsLib = L;
        res(L);
      };
      s.onerror = function () { pdfjsP = null; rej(new Error('pdf.js failed to load from ' + src)); };
      document.head.appendChild(s);
    });
    return pdfjsP;
  }

  /* One page to a base64 JPEG. White fill first: a transparent page
     encodes black in JPEG. The canvas is released straight after. */
  function renderPage(pdf, n) {
    return pdf.getPage(n).then(function (page) {
      var v1 = page.getViewport({ scale: 1 });
      var vp = page.getViewport({ scale: RENDER_WIDTH / v1.width });
      var cv = document.createElement('canvas');
      cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
      var ctx = cv.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
      return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
        var b64 = cv.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
        page.cleanup(); cv.width = 0; cv.height = 0;
        return b64;
      });
    });
  }

  function workerBase() { return String(cfg().printParseWorker || '').replace(/\/+$/, ''); }

  function postWorker(path, body, signal) {
    return fetch(workerBase() + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: signal
    }).then(function (r) {
      return r.json().catch(function () { throw new Error(path + ' returned HTTP ' + r.status + ' with no JSON'); });
    }).then(function (j) {
      if (!j || j.ok !== true) throw new Error((j && j.reason) || (path + ' failed'));
      return j;
    });
  }

  function readOnePage(run, pdf, n, tries) {
    if (run.cancelled) return Promise.reject(new Error('cancelled'));
    return renderPage(pdf, n).then(function (b64) {
      if (n === 1) run.coverB64 = b64;
      return postWorker('/read-page', {
        pdfPage: n, mediaType: 'image/jpeg', image: b64, titleName: cfg().titleName || ''
      });
    }).then(function (j) { return j.read; }, function (e) {
      if (run.cancelled || tries <= 0) throw e;
      return readOnePage(run, pdf, n, tries - 1);
    });
  }

  /* v3.3.3 — UNUSED, kept: readPages() replaced it because this pool
     stops on the first failure. Retained rather than deleted.
     Fixed-width pool. Stops launching on the first failure and
     rejects with it — a manifest missing a page is not a manifest. */
  function pool(n, limit, fn) {
    return new Promise(function (res, rej) {
      var next = 1, active = 0, done = 0, out = new Array(n), dead = false;
      function launch() {
        while (!dead && active < limit && next <= n) {
          (function (i) {
            active++;
            fn(i).then(function (v) {
              out[i - 1] = v; active--; done++;
              if (done === n) res(out); else launch();
            }, function (e) { dead = true; rej(e); });
          })(next++);
        }
      }
      if (!n) res(out); else launch();
    });
  }

  // ══════════════════════════════════════════════════════════
  // UPLOADCARE  (v3.6.0 — both stores happen DURING the run)
  // ══════════════════════════════════════════════════════════

  function b64ToBlob(b64) {
    var bin = atob(b64), n = bin.length, u = new Uint8Array(n);
    for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u], { type: 'image/jpeg' });
  }

  function ucUpload(fileOrBlob, name) {
    var c = cfg(), fd = new FormData();
    fd.append('UPLOADCARE_PUB_KEY', c.uploadcarePublicKey);
    fd.append('UPLOADCARE_STORE', '1');
    fd.append('file', fileOrBlob, name);
    return fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: fd })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.file) throw new Error('Uploadcare returned no file id');
        var base = String(c.uploadcareBase || 'https://ucarecdn.com').replace(/\/$/, '');
        return base + '/' + j.file + '/';
      });
  }

  /* The raw PDF, started as soon as the file opens. Runs while the
     pages are being read; the handoff waits on it. */
  function startPdfStore(run) {
    run.pdfUrlP = ucUpload(run.file, run.source)
      .catch(function (e) {
        console.warn(TAG, 'the PDF could not be stored (' + (e.message || e) +
                          '). The review works now; a RESUMED review will not show pages.');
        return '';
      });
  }

  /* The cover, started once the reads are done (page 1's JPEG is in
     hand by then). Runs while the stitch runs. */
  function startCoverStore(run) {
    if (!run.coverB64) { run.coverUrlP = Promise.resolve(''); return; }
    run.coverUrlP = ucUpload(b64ToBlob(run.coverB64),
                             'COVER___' + run.source.replace(/\.pdf$/i, '') + '.jpg')
      .catch(function (e) {
        console.warn(TAG, 'the cover could not be stored: ' + (e.message || e));
        return '';
      });
  }

  /* ── State for one upload. Reset on every open. ── */
  var P = {};

  function openParse(slotKey) {
    var gate = uploadGate();
    if (gate.length) { alert(uploadWhy()); return; }
    var slot = null;
    for (var i = 0; i < S.plan.length; i++) if (S.plan[i].k === slotKey) slot = S.plan[i];
    P = {
      phase: 'pick', cancelled: false, handoff: false,
      file: null, source: '', pages: 0, done: 0,
      issueName: slot ? slot.label : '', issueNameOrig: slot ? slot.label : '',
      expectSource: slot ? slot.source : '',
      coverB64: '',
      items: [], error: '', dupe: 0, draftHit: null, skipped: []
    };
    mountPz();
    renderPz();
  }

  /* The run object is captured by every async step, so a closed or
     reopened modal can never be written to by the run before it.
     v3.6.0 — a run that handed its PDF to the review must not
     destroy it on the way out. */
  function closePz() {
    P.cancelled = true;
    if (!P.handoff) destroyPdf(P);
    var ov = document.querySelector('.tpi-pz-ov');
    if (ov) ov.parentNode.removeChild(ov);
  }

  function live(run) { return !run.cancelled && P === run; }

  function destroyPdf(run) {
    if (run.pdf) { try { run.pdf.destroy(); } catch (e) {} run.pdf = null; }
  }

  function startRead() {
    var run = P;
    if (!run.file) return;
    var dupes = S.parsed.filter(function (I) { return norm(I.source) === norm(run.file.name); });
    if (dupes.length) { run.dupe = dupes[0].items; renderPz(); return; }
    /* v3.6.0 — a saved review of this PDF wins over a fresh read. */
    var hit = draftFor(run.file.name);
    if (hit && !run.draftIgnored) { run.draftHit = hit; renderPz(); return; }
    if (!String(run.issueName).trim()) { run.error = 'Give the issue a name first.'; renderPz(); return; }

    run.source = run.file.name; run.error = ''; run.reads = []; run.fails = {}; run.skipped = [];
    run.phase = 'reading'; run.done = 0;
    startPdfStore(run);
    renderPz();

    loadPdfjs().then(function (L) {
      return run.file.arrayBuffer().then(function (buf) { return L.getDocument({ data: buf }).promise; });
    }).then(function (doc) {
      if (!live(run)) { try { doc.destroy(); } catch (x) {} return; }
      run.pdf = doc; run.pages = doc.numPages;
      var all = []; for (var n = 1; n <= run.pages; n++) all.push(n);
      readPages(run, all);
    }).catch(function (e) {
      if (!live(run)) return;
      run.phase = 'error'; run.error = String(e.message || e); renderPz();
    });
  }

  /* Reads the listed pages. Never rejects: a page that fails after
     its retry is recorded in run.fails and the rest carry on. */
  function readPages(run, list) {
    run.phase = 'reading';
    run.done = run.pages - list.length - run.skipped.length;
    renderPz();
    var i = 0;
    function worker() {
      if (!live(run) || i >= list.length) return Promise.resolve();
      var n = list[i++];
      return readOnePage(run, run.pdf, n, READ_RETRIES).then(function (r) {
        run.reads[n - 1] = r; delete run.fails[n]; run.done++;
        if (live(run)) progPz();
      }, function (e) {
        run.fails[n] = String(e.message || e).replace(/^page \d+:\s*/i, '');
      }).then(worker);
    }
    var lanes = [];
    for (var k = 0; k < Math.min(READ_CONCURRENCY, list.length); k++) lanes.push(worker());
    Promise.all(lanes).then(function () {
      if (!live(run)) return;
      if (Object.keys(run.fails).length) { run.phase = 'readfail'; renderPz(); return; }
      startCoverStore(run);
      stitchNow(run);
    });
  }

  function retryFailed() {
    var run = P;
    var list = Object.keys(run.fails).map(Number).sort(function (a, b) { return a - b; });
    if (list.length && run.pdf) readPages(run, list);
  }

  /* v3.6.0 — ruled 27 Sept: pages that keep failing can be skipped.
     The stitch runs on the reads that exist (the Worker drops the
     gaps), and anything printed on a skipped page can be added in
     the review with "Add an item". */
  function skipFailed() {
    var run = P;
    var list = Object.keys(run.fails).map(Number).sort(function (a, b) { return a - b; });
    if (!list.length) return;
    run.skipped = run.skipped.concat(list);
    run.fails = {};
    if (!run.reads.filter(Boolean).length) {
      run.phase = 'error';
      run.error = 'Every page failed to read, so there is nothing to continue with.';
      renderPz(); return;
    }
    startCoverStore(run);
    stitchNow(run);
  }

  /* v3.3.4 — clock and rotating line while the stitch runs. */
  function stopTick(run) { if (run.tick) { clearInterval(run.tick); run.tick = null; } }
  function startTick(run) {
    stopTick(run);
    run.t0 = Date.now();
    run.tick = setInterval(function () {
      if (!live(run) || (run.phase !== 'stitching' && run.phase !== 'extracting')) { stopTick(run); return; }
      var m = pzEl(); if (!m) return;
      var sec = Math.floor((Date.now() - run.t0) / 1000);
      var clk = m.querySelector('[data-pz-clock]');
      if (clk) clk.textContent = Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2);
      if (run.phase === 'extracting') return;   /* v3.5.0 — its line is set per job */
      var ln = m.querySelector('[data-pz-line]');
      if (ln) ln.textContent = STITCH_LINES[Math.floor(sec / 8) % STITCH_LINES.length] + '\u2026';
    }, 1000);
  }

  function stitchNow(run) {
    run.phase = 'stitching'; run.error = ''; renderPz();
    startTick(run);
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, STITCH_TIMEOUT_MS);
    postWorker('/stitch', { reads: run.reads, titleName: cfg().titleName || '' },
               ctl ? ctl.signal : undefined).then(function (j) {
      clearTimeout(timer); stopTick(run);
      if (!live(run)) return;
      var stem = slugify(run.source.replace(/\.pdf$/i, '')).slice(0, 24);
      var seen = {};
      run.items = j.items.map(function (it) {
        var base = (stem + '-' + slugify(it.name)).slice(0, 80).replace(/-+$/, '');
        var slug = base, k = 2;
        while (seen[slug]) slug = base + '-' + (k++);
        seen[slug] = 1;
        var t = it.type === 'advertorial' ? 'article' : it.type;
        var v = { name: it.name || '', section: it.section || '', byline: it.byline || '',
                  customer: it.customer || '',
                  /* v3.5.1 — ad types are valid too (their own sections) */
                  type: TYPE_OPTS.concat(AD_TYPE_OPTS).some(function (o) { return o.v === t; }) ? t : 'other' };
        var ev = (it.event === 'article' || it.event === 'ad') ? it.event : 'none';
        return {
          orig: v, cur: { name: v.name, section: v.section, byline: v.byline,
                          customer: v.customer, type: v.type },
          include: true, page: it.page, span: it.pagesSpanned || String(it.page),
          images: it.imageCount || 0, conf: it.confidence || 'high', note: it.note || '',
          slug: slug,
          /* v3.5.0 */
          pdfPage: Number(it.pdfPage) || 0,
          pdfPages: (it.pdfPages && it.pdfPages.length ? it.pdfPages : [it.pdfPage]).map(Number).filter(Boolean),
          event: ev, itemCount: Number(it.itemCount) || 0,
          alsoEvent: ev === 'article',        /* spec: article ticked, ad unticked */
          found: null, open: true,
          /* v3.5.1 */
          listings: it.listings === 'ad' ? 'ad' : 'none',
          adSize: it.adSize || '',
          /* v3.6.0 — join evidence (Worker v1.3.0: maybeContinues
             means "may continue the item before this one"). */
          _mc: it.maybeContinues && it.maybeContinues.reasons ? it.maybeContinues : null
        };
      });
      /* Resolve the evidence now that every item has its slug. */
      run.items.forEach(function (it, i) {
        if (it._mc && i > 0) {
          it.continues = { prevId: run.items[i - 1].slug,
                           why: (it._mc.reasons || []).join('; ') };
        }
        delete it._mc;
      });
      /* v3.5.0 — the PDF stays open: extraction and its retries need it. */
      extractAll(run);
    }, function (e) {
      clearTimeout(timer); stopTick(run);
      if (!live(run)) return;
      run.phase = 'stitchfail';
      run.error = (e && e.name === 'AbortError')
        ? 'No answer after ' + (STITCH_TIMEOUT_MS / 60000) + ' minutes, so the request was stopped.'
        : String(e.message || e);
      renderPz();
    });
  }

  // ══════════════════════════════════════════════════════════
  // v3.5.0 — EXTRACT: the items on listings pages, and the events
  // announced by articles and ads. Read-only: nothing is written.
  // ══════════════════════════════════════════════════════════

  function issueYear(run) {
    var m = String(run.issueName || '').match(/\b(19|20)\d\d\b/) ||
            String(run.source || '').match(/\b(19|20)\d\d\b/) ||
            String(run.source || '').match(/(?:^|[^0-9])(2\d)(?:[^0-9]|$)/);
    if (!m) return new Date().getFullYear();
    var y = m[0].replace(/[^0-9]/g, '');
    return y.length === 2 ? 2000 + Number(y) : Number(y);
  }

  /* Live Listing Phase labels, from the ix-asset-list Worker's
     `options` map. Never a word list in code (spec v1.8). */
  function loadPhases(run) {
    var base = String(cfg().assetListUrl || '').replace(/\/+$/, '');
    if (!base) return Promise.resolve({ labels: [], why: 'TA_CONFIG.assetListUrl is not set on this page' });
    return fetch(base + '/list?type=realestate&title=' + encodeURIComponent(taId()))
      .then(function (r) { return r.json().catch(function () { return null; }).then(function (j) {
        if (!r.ok || !j || j.error) throw new Error((j && j.error) || ('HTTP ' + r.status));
        return j;
      }); })
      .then(function (j) {
        var m = (j.options && j.options['listing-phase']) || null;
        if (!m) return { labels: [], why: 'the asset list returned no listing-phase options' };
        return { labels: Object.keys(m).map(function (k) { return String(m[k]); }), why: '' };
      })
      .catch(function (e) { return { labels: [], why: String(e.message || e) }; });
  }

  /* v3.5.1 — a row can need more than one kind of read (an ad can
     announce an event AND show homes). Each found item is tagged
     _k 'event' or 're'. */
  function jobsFor(it) {
    var t = it.orig.type;
    if (t === 'events-page') return it.pdfPages.map(function (n) { return { kind: 'events', pdfPage: n }; });
    if (t === 're-page')     return it.pdfPages.map(function (n) { return { kind: 're', pdfPage: n }; });
    var jobs = [];
    if (it.event !== 'none' && it.pdfPage) {
      jobs.push({ kind: 'event-in-block', pdfPage: it.pdfPage, blockName: it.orig.name, blockKind: it.event });
    }
    if (it.listings === 'ad' && it.pdfPage) {
      jobs.push({ kind: 're-in-block', pdfPage: it.pdfPage, blockName: it.orig.name });
    }
    return jobs;
  }
  function jobIsRe(job) { return job.kind === 're' || job.kind === 're-in-block'; }

  function extractOne(run, job, tries) {
    if (!live(run)) return Promise.reject(new Error('cancelled'));
    return renderPage(run.pdf, job.pdfPage).then(function (b64) {
      var ctl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); }, EXTRACT_TIMEOUT_MS);
      var body = {
        kind: job.kind, pdfPage: job.pdfPage, mediaType: 'image/jpeg', image: b64,
        titleName: cfg().titleName || '', issueName: String(run.issueName || '').trim(),
        issueYear: issueYear(run)
      };
      if (job.kind === 'event-in-block') { body.blockName = job.blockName; body.blockKind = job.blockKind; }
      if (job.kind === 're-in-block') body.blockName = job.blockName;
      if (jobIsRe(job)) body.phases = (run.phases && run.phases.labels) || [];
      return postWorker('/extract', body, ctl ? ctl.signal : undefined)
        .then(function (j) { clearTimeout(timer); return j; },
              function (e) {
                clearTimeout(timer);
                if (e && e.name === 'AbortError') throw new Error('no answer after ' + (EXTRACT_TIMEOUT_MS / 60000) + ' minutes');
                throw e;
              });
    }).catch(function (e) {
      if (!live(run) || tries <= 0) throw e;
      return extractOne(run, job, tries - 1);
    });
  }

  /* Runs one row's jobs and stores the result on it. Never rejects. */
  function extractRow(run, it) {
    var jobs = jobsFor(it);
    it.found = { items: [], errors: [], defaults: null, busy: true };
    return jobs.reduce(function (chain, job) {
      return chain.then(function () {
        if (!live(run)) return;
        run.xNow = { name: it.orig.name, pdfPage: job.pdfPage };
        updateXLine(run);
        return extractOne(run, job, EXTRACT_RETRIES).then(function (j) {
          (j.items || []).forEach(function (x) {
            x.pdfPage = job.pdfPage; x._k = jobIsRe(job) ? 're' : 'event';
            it.found.items.push(x);
          });
          if (j.pageDefaults && !it.found.defaults) it.found.defaults = j.pageDefaults;
        }, function (e) {
          it.found.errors.push({ pdfPage: job.pdfPage, why: String(e.message || e) });
        });
      });
    }, Promise.resolve()).then(function () {
      it.found.busy = false;
      run.xDone++;
      updateXLine(run);
    });
  }

  function extractAll(run) {
    var rows = run.items.filter(function (it) { return jobsFor(it).length; });
    run.phase = 'extracting'; run.xDone = 0; run.xTotal = rows.length; run.xNow = null;
    run.phases = null;
    if (!rows.length) { finish(run); return; }
    renderPz();
    startTick(run);
    var needPhases = rows.some(function (it) { return jobsFor(it).some(jobIsRe); });
    (needPhases ? loadPhases(run) : Promise.resolve({ labels: [], why: '' })).then(function (ph) {
      run.phases = ph;
      var i = 0;
      function lane() {
        if (!live(run) || i >= rows.length) return Promise.resolve();
        return extractRow(run, rows[i++]).then(lane);
      }
      var lanes = [];
      for (var k = 0; k < Math.min(EXTRACT_CONCURRENCY, rows.length); k++) lanes.push(lane());
      return Promise.all(lanes);
    }).then(function () {
      stopTick(run);
      if (!live(run)) return;
      finish(run);
    });
  }

  function updateXLine(run) {
    var m = pzEl(); if (!m || run.phase !== 'extracting') return;
    var ln = m.querySelector('[data-pz-xline]');
    if (ln) ln.textContent = run.xNow
      ? 'Reading the items in \u201c' + run.xNow.name + '\u201d (PDF page ' + run.xNow.pdfPage + ')\u2026'
      : 'Starting\u2026';
    var ct = m.querySelector('[data-pz-xcount]');
    if (ct) ct.textContent = run.xDone + ' of ' + run.xTotal + ' done';
  }

  // ══════════════════════════════════════════════════════════
  // v3.6.0 — HAND OFF. The stores settle, then the review opens
  // with everything the run learned, PDF included, and the modal
  // closes. Nothing is written to SLATE here any more.
  // ══════════════════════════════════════════════════════════

  function finish(run) {
    if (!run.phases) run.phases = { labels: [], why: '' };
    run.phase = 'finish'; renderPz();
    Promise.all([
      run.pdfUrlP  || Promise.resolve(''),
      run.coverUrlP || Promise.resolve('')
    ]).then(function (urls) {
      if (!live(run)) return;
      handOff(run, urls[0], urls[1]);
    });
  }

  function handOff(run, pdfUrl, coverUrl) {
    if (!(window.IXPrintReview && window.IXPrintReview.open)) {
      run.phase = 'error';
      run.error = 'ta-print-review-v1.0.0.js is not on this page, so the review cannot open. ' +
                  'Nothing was written; add the script and read the PDF again.';
      renderPz(); return;
    }
    var folio = {};
    (run.reads || []).forEach(function (r, i) {
      if (r && r.printedPageNumber != null) folio[i + 1] = r.printedPageNumber;
    });
    var ok = window.IXPrintReview.open({
      key: draftKeyFor(run.source),
      issueName: String(run.issueName).trim(),
      source: run.source,
      pages: run.pages,
      taId: taId(),
      pdfUrl: pdfUrl || '',
      coverUrl: coverUrl || '',
      folio: folio,
      phases: run.phases,
      items: run.items,
      pdf: run.pdf
    });
    if (ok === false) {
      run.phase = 'error';
      run.error = 'The review surface refused to open (see the console). Nothing was written.';
      renderPz(); return;
    }
    run.handoff = true;         /* the review owns the PDF now */
    closePz();
    setTimeout(fetchDrafts, 2500);   /* the review's first save lands about now */
    console.log(TAG, 'handed ' + run.items.length + ' rows to the review \u00b7 pdf ' +
                (pdfUrl ? 'stored' : 'NOT stored') + ' \u00b7 cover ' + (coverUrl ? 'stored' : 'NOT stored'));
  }

  /* Back to step 1 with the file and name kept. */
  function startOver() {
    var run = P;
    destroyPdf(run);
    run.phase = 'pick'; run.error = ''; run.reads = []; run.fails = {}; run.skipped = [];
    run.items = []; run.done = 0; run.coverB64 = ''; run.draftHit = null; run.draftIgnored = false;
    renderPz();
  }

  // ── Modal ──────────────────────────────────────────────────

  function mountPz() {
    var old = document.querySelector('.tpi-pz-ov');
    if (old) old.parentNode.removeChild(old);
    var ov = document.createElement('div');
    ov.className = 'ix-overlay tpi-pz-ov';
    ov.innerHTML = '<div class="ix-modal tpi-pz-modal" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', onPzClick);
    ov.addEventListener('input', onPzInput);
    ov.addEventListener('change', onPzChange);
  }

  function pzEl() { return document.querySelector('.tpi-pz-modal'); }

  function progPz() {
    var m = pzEl(); if (!m) return;
    if (P.phase !== 'reading') return;   /* the clock owns the other labels */
    var tot = P.pages;
    var bar = m.querySelector('.tpi-pz-bar i');
    var txt = m.querySelector('.tpi-pz-prog-t');
    if (bar) bar.style.width = tot ? (P.done / tot * 100).toFixed(1) + '%' : '0%';
    if (txt) txt.textContent = 'Read ' + P.done + ' of ' + (tot || '\u2026') + ' pages';
  }

  function renderPz() {
    var m = pzEl(); if (!m) return;
    var title = 'Upload print issue', sub = '', body = '', foot = '';
    var cancel = '<button type="button" class="ix-revert" data-pz-cancel="1">Cancel</button>';

    if (P.phase === 'pick') {
      sub = 'Step 1 of 2 \u00b7 choose the PDF';
      body =
        '<label class="tpi-pz-lab">Issue name</label>' +
        '<span class="tpi-pz-f"><input class="ix-picker-input" data-pz-issue="1" value="' +
          esc(P.issueName) + '" placeholder="e.g. October 2026"></span>' +
        '<label class="tpi-pz-lab">Print PDF</label>' +
        '<input type="file" accept="application/pdf,.pdf" data-pz-file="1" class="tpi-pz-file">' +
        (P.file ? '<p class="tpi-pz-hint" data-pz-kept="1">Using <b>' + esc(P.file.name) +
          '</b>. Choose again to change it.</p>' : '') +
        (P.expectSource ? '<p class="tpi-pz-hint">The schedule expects <b>' + esc(P.expectSource) + '</b>.</p>' : '') +
        (P.dupe ? '<div class="ix-modal-banner tpi-pz-warn">This PDF already has ' + P.dupe +
          ' rows. Delete them in the Allocator before reading it again.</div>' : '') +
        (P.draftHit ? '<div class="ix-modal-banner tpi-pz-warn">A review of this PDF is in progress' +
          (P.draftHit.savedAt ? ' (saved ' + esc(fmtWhen(P.draftHit.savedAt)) + ', ' +
            (P.draftHit.checked || 0) + ' pages checked)' : '') +
          '. Reading it again would start over.' +
          '<span class="tpi-pz-dr-btns">' +
            '<button type="button" class="ix-btn ix-btn--primary ix-btn--gold" data-pz-resume="1">Resume that review</button>' +
            '<button type="button" class="ix-revert" data-pz-discard="1">Discard it and read again</button>' +
          '</span></div>' : '') +
        (P.error ? '<div class="ix-modal-banner tpi-pz-warn">' + esc(P.error) + '</div>' : '');
      foot = cancel + '<button type="button" class="ix-btn ix-btn--primary" data-pz-read="1"' +
        (P.file && !P.dupe && !P.draftHit ? '' : ' disabled') + '>Read the PDF</button>';
    }
    else if (P.phase === 'stitching') {
      sub = 'Step 2 of 2 \u00b7 putting the items together';
      var el0 = P.t0 ? Math.floor((Date.now() - P.t0) / 1000) : 0;
      body = '<div class="tpi-pz-prog"><span class="tpi-pz-bar tpi-pz-bar--busy"><i></i></span>' +
        '<span class="tpi-pz-prog-t" data-pz-clock="1">' + Math.floor(el0 / 60) + ':' +
          ('0' + (el0 % 60)).slice(-2) + '</span></div>' +
        '<p class="tpi-pz-hint"><b>' + P.reads.filter(Boolean).length + ' of ' + P.pages +
          ' pages read' + (P.skipped.length ? ' (' + P.skipped.length + ' skipped)' : '') + '.</b> ' +
          '<span data-pz-line="1">' + STITCH_LINES[0] + '\u2026</span></p>' +
        '<p class="tpi-pz-hint">This is one long step, usually one to three minutes. ' +
          'It stops on its own after ' + (STITCH_TIMEOUT_MS / 60000) + ' minutes.</p>';
      foot = cancel;
    }
    else if (P.phase === 'extracting') {
      sub = 'Step 2 of 2 \u00b7 reading events and listings';
      var el1 = P.t0 ? Math.floor((Date.now() - P.t0) / 1000) : 0;
      body = '<div class="tpi-pz-prog"><span class="tpi-pz-bar tpi-pz-bar--busy"><i></i></span>' +
        '<span class="tpi-pz-prog-t" data-pz-clock="1">' + Math.floor(el1 / 60) + ':' +
          ('0' + (el1 % 60)).slice(-2) + '</span></div>' +
        '<p class="tpi-pz-hint"><b>Items put together.</b> <span data-pz-xline="1">' +
          (P.phases === null ? 'Reading the Listing Phase options\u2026' : 'Starting\u2026') + '</span></p>' +
        '<p class="tpi-pz-hint"><span data-pz-xcount="1">' + (P.xDone || 0) + ' of ' + (P.xTotal || 0) +
          ' done</span>. Each listings page and each event in an article or ad is read again, closely. ' +
          'Usually under a minute each.</p>';
      foot = cancel;
    }
    else if (P.phase === 'reading') {
      sub = 'Step 2 of 2 \u00b7 reading';
      body = '<div class="tpi-pz-prog"><span class="tpi-pz-bar"><i></i></span>' +
        '<span class="tpi-pz-prog-t"></span></div>' +
        '<p class="tpi-pz-hint">Each page is read as an image. This takes a few minutes for a full issue. ' +
        'The PDF itself is stored at the same time, so a half-finished review can show its pages later.</p>';
      foot = cancel;
    }
    else if (P.phase === 'finish') {
      sub = 'Opening the review';
      body = '<div class="tpi-pz-prog"><span class="tpi-pz-bar tpi-pz-bar--busy"><i></i></span>' +
        '<span class="tpi-pz-prog-t">Storing the PDF and cover\u2026</span></div>' +
        '<p class="tpi-pz-hint">Everything is read. The stored copies let a half-finished review ' +
          'show its pages later; the review opens the moment they land.</p>';
      foot = cancel;
    }
    else if (P.phase === 'readfail') {
      var failed = Object.keys(P.fails).map(Number).sort(function (a, b) { return a - b; });
      sub = 'Some pages could not be read';
      body = '<p><b>' + (P.pages - failed.length - P.skipped.length) + ' of ' + P.pages + ' pages read.</b> ' +
        'These failed after one retry:</p>' +
        '<ul class="tpi-pz-fails">' + failed.map(function (n) {
          return '<li>Page ' + n + ': ' + esc(P.fails[n]) + '</li>';
        }).join('') + '</ul>' +
        '<p class="tpi-pz-hint">The pages that worked are kept. Retry reads only the failed pages. ' +
          'Continue skips them \u2014 anything printed there can be added in the review.</p>';
      foot = cancel +
        '<button type="button" class="ix-btn ix-btn--ghost" data-pz-over="1">Start over</button>' +
        '<button type="button" class="ix-btn ix-btn--secondary" data-pz-skip="1">Continue without ' +
          (failed.length === 1 ? 'this page' : 'these ' + failed.length + ' pages') + '</button>' +
        '<button type="button" class="ix-btn ix-btn--primary" data-pz-retry="1">Retry ' +
          failed.length + ' page' + (failed.length === 1 ? '' : 's') + '</button>';
    }
    else if (P.phase === 'stitchfail') {
      sub = 'Could not put the items together';
      body = '<div class="ix-modal-banner tpi-pz-warn">' + esc(P.error) + '</div>' +
        '<p class="tpi-pz-hint">All page reads are kept. Try again repeats only this step.</p>';
      foot = cancel +
        '<button type="button" class="ix-btn ix-btn--secondary" data-pz-over="1">Start over</button>' +
        '<button type="button" class="ix-btn ix-btn--primary" data-pz-restitch="1">Try again</button>';
    }
    else if (P.phase === 'error') {
      sub = 'Stopped';
      body = '<div class="ix-modal-banner tpi-pz-warn">' + esc(P.error) + '</div>' +
        '<p class="tpi-pz-hint">Nothing was written to SLATE.</p>';
      foot = '<button type="button" class="ix-revert" data-pz-close="1">Close</button>' +
        '<button type="button" class="ix-btn ix-btn--secondary" data-pz-over="1">Start over</button>';
    }

    /* v3.4.0 — keep the modal body where the operator left it. */
    var oldBody = m.querySelector('.ix-modal-body');
    var keepTop = oldBody && P.phase === P._lastPhase ? oldBody.scrollTop : 0;
    P._lastPhase = P.phase;

    m.innerHTML =
      '<div class="ix-modal-bar"></div>' +
      '<div class="ix-modal-head"><div class="ix-modal-title-block">' +
        '<h3 class="ix-modal-title">' + esc(title) + '</h3>' +
        '<div class="ix-modal-sub">' + esc(sub) + '</div>' +
      '</div></div>' +
      '<div class="ix-modal-body">' + body + '</div>' +
      (foot ? '<div class="ix-modal-footer"><span class="tpi-sp"></span>' +
        '<span class="ix-modal-footer-right">' + foot + '</span></div>' : '');
    var newBody = m.querySelector('.ix-modal-body');
    if (newBody && keepTop) newBody.scrollTop = keepTop;
    progPz();
  }

  function onPzInput(e) {
    var t = e.target;
    if (t.hasAttribute('data-pz-issue')) {
      P.issueName = t.value; P.error = '';
    }
  }

  function onPzChange(e) {
    var t = e.target;
    /* v3.3.1 — no renderPz() here. A redraw replaces the input and
       the browser shows it empty. Update the dependents in place. */
    if (t.hasAttribute('data-pz-file')) {
      P.file = (t.files && t.files[0]) || null; P.dupe = 0; P.error = '';
      P.draftHit = null; P.draftIgnored = false;
      var m = pzEl();
      var rb = m && m.querySelector('[data-pz-read]');
      if (rb) rb.disabled = !P.file;
      var kept = m && m.querySelector('[data-pz-kept]');
      if (kept) kept.parentNode.removeChild(kept);
      var warn = m && m.querySelector('.tpi-pz-warn');
      if (warn) warn.parentNode.removeChild(warn);
      return;
    }
  }

  function onPzClick(e) {
    var t = e.target.closest && e.target.closest(
      '[data-pz-cancel],[data-pz-close],[data-pz-read],[data-pz-retry],[data-pz-over],[data-pz-restitch],' +
      '[data-pz-skip],[data-pz-resume],[data-pz-discard]');
    if (!t) return;
    e.preventDefault();
    if (t.hasAttribute('data-pz-cancel') || t.hasAttribute('data-pz-close')) { closePz(); return; }
    if (t.hasAttribute('data-pz-read'))   { startRead(); return; }
    if (t.hasAttribute('data-pz-retry'))  { retryFailed(); return; }
    if (t.hasAttribute('data-pz-skip'))   { skipFailed(); return; }
    if (t.hasAttribute('data-pz-over'))   { startOver(); return; }
    if (t.hasAttribute('data-pz-restitch')) { stitchNow(P); return; }
    /* v3.6.0 — the draft-hit choices */
    if (t.hasAttribute('data-pz-resume')) {
      var key = P.draftHit && P.draftHit.key;
      closePz();
      if (key && window.IXPrintReview) window.IXPrintReview.resume(key);
      return;
    }
    if (t.hasAttribute('data-pz-discard')) {
      var run = P, hit = run.draftHit;
      if (!hit) return;
      deleteDraft(hit.key).then(function () {
        if (!live(run)) return;
        S.drafts = S.drafts.filter(function (d) { return d.key !== hit.key; });
        run.draftHit = null; run.draftIgnored = true;
        startRead();
      });
      return;
    }
  }

  // ══════════════════════════════════════════════════════════
  // MOUNT
  // ══════════════════════════════════════════════════════════

  function pane() {
    return document.querySelector('div.w-tab-pane[data-w-tab="PrintIssue"]') ||
           document.querySelector('div.tab-pane-printissue');
  }

  function mount() {
    var p = pane();
    if (!p) return false;
    if (p.dataset.tpiMounted) return true;

    /* NOT `p` — mount() already binds that to the pane, and shadowing
       it here silently replaced the DOM node with a plan object. */
    var read = readPlan();
    S.plan    = read.plan;
    S.planned = read.ok;
    S.parsed = harvest();

    /* Land on the year the operator is most likely to want: the
       current one if the plan covers it, otherwise the latest it
       does cover. */
    var ys = planYears(), now = new Date().getFullYear();
    /* v3.4.1 — open on the newest year that holds a parsed issue,
       so the issue just read is on screen without a click. */
    var py = 0;
    S.parsed.forEach(function (I) {
      var m = String(I.name || '').match(/(20\d\d)/);
      var y = m ? parseInt(m[1], 10) : 0;
      if (y > py) py = y;
    });
    S.year = (py && ys.indexOf(py) > -1) ? py
           : (ys.indexOf(now) > -1 ? now : (ys[0] || now));

    /* Two children, one visible at a time. The board finds
       [data-ix-board] first in its own findHost chain, so creating it
       here is the whole handoff — no import either way. */
    S.root = document.createElement('div');
    S.root.className = 'tpi-root';

    S.boardHost = document.createElement('div');
    S.boardHost.setAttribute('data-ix-board', '');
    S.boardHost.hidden = true;

    p.insertBefore(S.boardHost, p.firstChild);
    p.insertBefore(S.root, p.firstChild);

    p.addEventListener('click', function (e) {
      var t = e.target.closest &&
              e.target.closest('[data-tpi-open],[data-tpi-back],[data-tpi-yr],[data-tpi-show],[data-tpi-up],[data-tpi-resume]');
      if (!t) return;
      e.preventDefault();
      if (t.hasAttribute('data-tpi-up')) { if (!t.disabled) openParse(t.getAttribute('data-tpi-up')); return; }
      /* v3.6.0 — resume a saved review */
      if (t.hasAttribute('data-tpi-resume')) {
        if (window.IXPrintReview && window.IXPrintReview.resume) {
          window.IXPrintReview.resume(t.getAttribute('data-tpi-resume'));
        }
        return;
      }
      if (t.hasAttribute('data-tpi-back')) { S.picked = null; publish(null); render(); return; }
      if (t.hasAttribute('data-tpi-yr'))   { S.year = parseInt(t.getAttribute('data-tpi-yr'), 10);
                                             S.show = 'past'; render(); return; }
      if (t.hasAttribute('data-tpi-show')) { S.show = t.getAttribute('data-tpi-show');
                                             render(); return; }
      S.picked = t.getAttribute('data-tpi-open');
      publish(S.picked);
      render();
    });

    p.dataset.tpiMounted = '1';
    listen();
    render();
    fetchDrafts();   /* v3.6.0 — async; re-renders when the list lands */
    console.log(TAG, 'mounted \u00b7 ' + S.plan.length + ' planned issue(s) across ' +
                planYears().length + ' year(s) \u00b7 ' +
                S.parsed.length + ' parsed from ' +
                document.querySelectorAll('.slate-item').length + ' slate rows' +
                (S.orphans.length ? ' \u00b7 ' + S.orphans.length + ' off-calendar' : ''));
    return true;
  }

  /* v3.7.0 — the page bus. Redraw from what was written; never reload. */
  function listen() {
    var X = window.IxRefresh;
    if (!(X && X.on)) {
      console.warn(TAG, 'ix-refresh-helper v1.1.0 is not loaded before this file \u2014 ' +
                        'the list will not redraw after the review or the board saves.');
      return;
    }
    X.on('slate:listening?', function () {});
    X.on('slate:written', function () {
      S.parsed = harvest();
      if (S.picked) showBoard(); else render();
    });
    X.on('print-review:finished', function (d) {
      var key = d && d.key;
      if (key) S.drafts = S.drafts.filter(function (x) { return x.key !== key; });
      if (!S.picked) render();
      fetchDrafts();
    });
  }

  /* The pane and its rows are Webflow-rendered, so they may not be
     there on DOMContentLoaded. Same retry shape the board uses; gives
     up rather than spinning. */
  function boot() {
    if (mount()) return;
    var tries = 0;
    var iv = setInterval(function () {
      if (mount() || ++tries > 30) {
        clearInterval(iv);
        if (tries > 30) console.warn(TAG, 'gave up \u2014 no PrintIssue pane found.');
      }
    }, 200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.IXPrintIssues = {
    version: VERSION,
    refresh: function () { S.parsed = harvest(); fetchDrafts(); render(); },
    issues:  function () { return S.parsed.slice(); },
    plan:    function () { return S.plan.slice(); },
    drafts:  function () { return S.drafts.slice(); }
  };
})();
