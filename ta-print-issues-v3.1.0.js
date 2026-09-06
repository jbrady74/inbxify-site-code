/* ta-print-issues-v3.1.0.js
   ════════════════════════════════════════════════════════════════
   INBXIFY T-A — Print Issues
   Companion: ta-print-issues-v3.0.0.css  (unchanged)
   Mounts in the `PrintIssue` pane, ABOVE the Print Issue Slate Plan.

   ── v3.1.0 · MATCH ON SOURCE, NOT ON A NAME TYPED SIXTEEN TIMES ──
   v3.0.0 joined a parsed issue to its planned slot by NAME. The name
   lives on every SLATE row of that parse — sixteen copies of one
   fact — so the join was a spelling test with sixteen chances to
   fail. Blank on all sixteen and the issue vanished to the bottom of
   the page under "Not on the calendar", which is exactly what
   happened.

   `data-source` was always the better key. It is the PDF filename,
   written once by the import, identical on every row of a parse, and
   already what harvest() groups on. It cannot disagree with itself
   because nothing types it twice.

   So a plan entry may carry a source:

       { "name": "September 2026", "y": 2026, "m": 9,
         "source": "Wyckoff_Sept26.pdf" }

   Matched on source, the sixteen names can be blank and it still
   works. The name becomes what it should have been all along —
   display, not identity.

   NAME MATCHING SURVIVES as the fallback, because a plan entry is
   written BEFORE its PDF exists and cannot know the filename yet.
   Order: source if the entry has one, then name, then nothing.

   Anything still unmatched is shown under "Not on the calendar" and
   never dropped.

   ── v3.0.1 · IT LOOKS FOR THE ATTRIBUTE, NOT THE ELEMENT ──
   v3.0.0 read `data-issue-plan` off `.ta-item`. It was bound to
   `ta-title-src` instead — which is arguably the better home, since
   that element IS the TITLES-ADMIN collection item.

   Requiring one element was the mistake. v3.0.1 finds the attribute
   wherever it is bound.

   BUT NOT BLINDLY. `ta-title-src` sits in a Collection List filtered
   by PUBLISHER, so a multi-title publisher renders SEVERAL of them
   and the first is not necessarily this title. Taking whichever came
   first would show Berkeley Heights' schedule on the Watchung page —
   a tenancy breach that looks like data.

   So it resolves in order:
     1. the element whose data-id matches this title's TITLES-ADMIN id
     2. the only element carrying the attribute, if there is just one
     3. nothing, and it says why — never a guess

   The current title id comes from .ta-item (data-title-id /
   title-admin-id), which is the element that already anchors tenancy
   for every other surface on this page.

   ── WHAT CHANGED FROM v2.0.0, AND WHY IT IS A MAJOR ──
   v2 DERIVED the year from a publishing frequency. That was wrong,
   and it was wrong in a way no dropdown fixes: a publishing schedule
   is not a rate. Connections and Showcase publish five times a year
   on no even interval. A monthly publisher skips August. A Christmas
   double issue is one record covering two months.

   Real publishing systems do not compute a schedule, they STORE one.
   An issue is a record created ahead of time; a frequency is only a
   generator that stamps those records out for someone to then edit.

   So v3 reads a PLAN:

       print-issue-plan-json  on TITLES-ADMIN
       [{ "name": "September 2026", "y": 2026, "m": 9 }, ...]

   Same pattern as `default-layout-json` and `design-json` — real
   structure in a plain-text field, because the collection registry
   is 40/40 and a PRINT ISSUES collection is gated on Workstream J.
   When J frees a slot this promotes to a collection and the surface
   does not change, because it reads a shape rather than a source.

   WHAT THIS BUYS
     · five a year works, so does eleven, or a double issue
     · a skipped month is an entry that is not there
     · an issue can exist BEFORE its PDF does, which is what the
       upload flow needed all along
     · renaming is one string, not sixteen SLATE rows

   Frequency did not disappear, it stopped being the model. It
   becomes "generate 2027" — a button that writes twelve entries you
   then edit. Same convenience, correct architecture. Not built.

   ── WHAT CHANGED FROM v1.0.0 ──
   v1.0.0 listed the issues that HAD SLATE rows. It could never show
   what was MISSING, which is most of what this page is for when you
   are backfilling. v2.0.0 inverts it: the page is a calendar of
   EXPECTED issues derived from the title's publishing frequency,
   and a parsed issue is one slot in it that happens to be filled.

   Empty is the default state and it is the point. Twelve slots with
   one filled reads as eleven things to do, which is the honest
   shape of it.

   ── IT STILL INVENTS NOTHING ──
   A filled slot is the set of SLATE rows sharing a `data-source`.
   Its identity is four fields REPEATED on each of those rows:

       data-source        the PDF filename        (pre-existing)
       data-cover-url     cover image             (pre-existing)
       data-issue-name    "September 2026"        (added Sep 5)
       data-issue-pages   36                      (added Sep 5)
       data-parsed-on     when it was read        (added Sep 5)

   An EMPTY slot has no data behind it at all. It is derived, and it
   renders as visibly empty rather than as a plausible row.

   ── WHERE THE SLOTS COME FROM ──
   `print-issue-plan-json` on TITLES-ADMIN, bound as
   data-issue-plan on any element. An array of entries, each with a
   name and a year/month for sorting. This file knows nothing about
   any particular title: edit the field and the calendar reshapes.

   ── MATCHING A PARSED ISSUE TO ITS SLOT ──
   By `data-issue-name` against the slot label, case- and
   space-insensitive. NOT by parsed-on — an issue read in August can
   be the September issue, and dating it by when it was read would
   put it in the wrong slot. A parsed issue whose name matches no
   slot is NOT dropped; it appears under "Not on the calendar", so a
   rename or a typo never makes an issue disappear.

   ── UPLOAD IS DISABLED, AND SAYS WHY ──
   There is nowhere for an uploaded PDF to go. The parser does not
   exist, and there is no PRINT ISSUES collection to hold "October's
   PDF is uploading" — an issue cannot be recorded before its SLATE
   rows exist, and those are what the parse creates. Both gaps are
   real and neither is solvable from this file.

   So the button renders DISABLED with the reason on hover. A
   control that looks ready and does nothing is worse than one that
   says why it cannot. Flip UPLOAD_READY when both land.

   ── FAIL-SAFE ──
   No pane, no frequency, an unmatched name: returns false or falls
   back and changes nothing. Never throws.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var VERSION = '3.1.0';
  var TAG = '[print-issues v' + VERSION + ']';

  /* Both gated on work outside this file. See the header. */
  var UPLOAD_READY = false;
  var UPLOAD_WHY   = 'Uploading needs the parse scenario and a place to ' +
                     'record an issue before its rows exist. Neither is built.';

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  var S = {
    parsed: [],        /* issues found in the DOM */
    orphans: [],       /* parsed but matching no planned issue */
    plan: [],          /* the schedule, as stored */
    planned: false,    /* false when no plan is set — say so, do not fake one */
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

  function harvest() {
    var rows = document.querySelectorAll('.slate-item');
    var by = {}, order = [], seen = {};

    Array.prototype.forEach.call(rows, function (el) {
      if (!attr(el, 'data-name')) return;          /* an unbound row is not a row */

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
      if (d === 'not-for-newsletter') I.del++;
      else if (d === 'held')          I.park++;
      else if (hasPlan)               I.alloc++;
      else                            I.und++;
    });

    var found = Object.keys(seen).map(function (k) { return k + '=' + seen[k]; });
    if (found.length) console.log(TAG, 'issue attributes read:', found.join(' '));
    return order.map(function (k) { return by[k]; });
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
     treated as future — it shows rather than hides. */
  function isFuture(s) {
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
    var off = fut || !UPLOAD_READY;
    var why = fut ? 'This issue has not been published yet.' : UPLOAD_WHY;
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
      '<div class="tpi-head">' +
        '<h2 class="tpi-h2">Print Issues</h2>' +
        '<span class="tpi-freq">' + slots.length + ' issue' +
          (slots.length === 1 ? '' : 's') + ' planned for <b>' + S.year + '</b></span>' +
        '<span class="tpi-sp"></span>' +
        '<span class="tpi-sub">' + have + ' of ' + past + ' published issue' +
          (past === 1 ? '' : 's') + ' parsed</span>' +
        '<span class="tpi-reveal">' + reveal + '</span>' +
        (years.length > 1
          ? '<span class="tpi-yr">' + years.map(function (y) {
              return '<button type="button" class="tpi-yb' + (y === S.year ? ' tpi-yb--on' : '') +
                     '" data-tpi-yr="' + y + '">' + y + '</button>';
            }).join('') + '</span>'
          : '') +
      '</div>' +

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

    if (S.boardHost) S.boardHost.hidden = true;
  }

  /* A missing schedule is a stated absence, not an empty page. It
     names the field and shows the shape the value takes, because the
     next thing the operator does is go and write one. */
  function renderNoPlan() {
    S.root.innerHTML =
      '<div class="tpi-head"><h2 class="tpi-h2">Print Issues</h2></div>' +
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
    if (S.boardHost) S.boardHost.hidden = true;
  }

  function showBoard() {
    var I = null;
    for (var i = 0; i < S.parsed.length; i++)
      if (S.parsed[i].source === S.picked) I = S.parsed[i];
    if (!I) { S.picked = null; render(); return; }

    S.root.innerHTML =
      '<div class="tpi-crumb">' +
        '<button type="button" class="tpi-back" data-tpi-back="1">\u2039 Print Issues</button>' +
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
    S.year = ys.indexOf(now) > -1 ? now : (ys[0] || now);

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
              e.target.closest('[data-tpi-open],[data-tpi-back],[data-tpi-yr],[data-tpi-show]');
      if (!t) return;
      e.preventDefault();
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
    render();
    console.log(TAG, 'mounted \u00b7 ' + S.plan.length + ' planned issue(s) across ' +
                planYears().length + ' year(s) \u00b7 ' +
                S.parsed.length + ' parsed from ' +
                document.querySelectorAll('.slate-item').length + ' slate rows' +
                (S.orphans.length ? ' \u00b7 ' + S.orphans.length + ' off-calendar' : ''));
    return true;
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
    refresh: function () { S.parsed = harvest(); render(); },
    issues:  function () { return S.parsed.slice(); },
    plan:    function () { return S.plan.slice(); }
  };
})();
