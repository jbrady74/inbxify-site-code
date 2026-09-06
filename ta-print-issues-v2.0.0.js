/* ta-print-issues-v2.0.0.js
   ════════════════════════════════════════════════════════════════
   INBXIFY T-A — Print Issues
   Companion: ta-print-issues-v2.0.0.css
   Mounts in the `PrintIssue` pane, ABOVE the Print Issue Slate Plan.

   ── WHAT CHANGED FROM v1.0.0, AND WHY IT IS A MAJOR ──
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
   `annual-print-publishing-freq` on TITLES-ADMIN, read from
   data-print-freq on .ta-item. A dropdown and not a number, because
   "Monthly" is what a publisher says and 12 is what it means. This
   file knows nothing about any particular title: change the field
   and the calendar reshapes.

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

  var VERSION = '2.0.0';
  var TAG = '[print-issues v' + VERSION + ']';

  /* Both gated on work outside this file. See the header. */
  var UPLOAD_READY = false;
  var UPLOAD_WHY   = 'Uploading needs the parse scenario and a place to ' +
                     'record an issue before its rows exist. Neither is built.';

  /* HC — the earliest year the calendar walks back to. Platform-level,
     not tenant: no publisher predates the platform. Overridable via
     TA_CONFIG.printFirstYear if one ever does. */
  var FIRST_YEAR_DEFAULT = 2026;

  /* annual-print-publishing-freq. The label is the contract; `per` is
     what it means. Unknown values fall back to Monthly and say so. */
  var FREQS = {
    'weekly':      { per: 52, label: '52 a year' },
    'fortnightly': { per: 26, label: '26 a year' },
    'biweekly':    { per: 26, label: '26 a year' },
    'monthly':     { per: 12, label: '12 a year' },
    'bi-monthly':  { per: 6,  label: '6 a year'  },
    'bimonthly':   { per: 6,  label: '6 a year'  },
    'quarterly':   { per: 4,  label: '4 a year'  }
  };

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  var S = {
    parsed: [],        /* issues found in the DOM */
    orphans: [],       /* parsed but matching no slot */
    freq: 'Monthly',
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

  function firstYear() {
    var v = parseInt(cfg().printFirstYear, 10);
    return (v && v > 1900) ? v : FIRST_YEAR_DEFAULT;
  }

  function readFreq() {
    var el = document.querySelector('.ta-item');
    var raw = (el && el.getAttribute('data-print-freq')) || cfg().printFreq || '';
    raw = String(raw).trim();
    var key = raw.toLowerCase().replace(/[\s_]/g, '-');
    if (FREQS[key]) return { label: raw, key: key };
    if (raw) console.warn(TAG, 'unrecognised publishing frequency "' + raw +
                               '" \u2014 falling back to Monthly.');
    else     console.warn(TAG, 'no data-print-freq on .ta-item \u2014 ' +
                               'falling back to Monthly. Add ' +
                               'annual-print-publishing-freq to TITLES-ADMIN.');
    return { label: 'Monthly', key: 'monthly', assumed: true };
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

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function slotsFor(year) {
    var per = FREQS[S.freq.key].per, out = [];

    if (per === 12) {
      for (var m = 0; m < 12; m++)
        out.push({ k: year + '-' + pad2(m + 1), label: MONTHS[m] + ' ' + year, y: year, m: m });

    } else if (per === 6) {
      for (var i = 0; i < 6; i++) { var mm = i * 2;
        out.push({ k: year + '-' + pad2(mm + 1),
                   label: MONTHS[mm].slice(0,3) + '/' + MONTHS[mm+1].slice(0,3) + ' ' + year,
                   y: year, m: mm }); }

    } else if (per === 4) {
      for (var q = 0; q < 4; q++) { var qm = q * 3;
        out.push({ k: year + '-' + pad2(qm + 1), label: 'Q' + (q + 1) + ' ' + year,
                   y: year, m: qm }); }

    } else {
      /* Weekly and fortnightly are dated, not named — "week 34" is
         what a weekly publisher says. */
      var step = per === 52 ? 7 : 14;
      var base = Date.UTC(year, 0, 1);
      for (var w = 0; w < per; w++) {
        var dt = new Date(base + w * step * 86400000);
        out.push({ k: year + '-w' + pad2(w + 1), label: 'Week ' + (w + 1),
                   sub: MONTHS[dt.getUTCMonth()].slice(0,3) + ' ' + dt.getUTCDate(),
                   y: year, m: dt.getUTCMonth() });
      }
    }
    return out;
  }

  function norm(s) { return String(s || '').toLowerCase().replace(/[\s.,]/g, ''); }

  /* Match on NAME, never on parsed-on. An issue read in August can be
     the September issue; dating it by when it was read would file it
     in the wrong slot. */
  function attach(slots) {
    var used = {};
    slots.forEach(function (s) {
      s.issue = null;
      for (var i = 0; i < S.parsed.length; i++) {
        var I = S.parsed[i];
        if (used[i] || !I.named) continue;
        if (norm(I.name) === norm(s.label)) { s.issue = I; used[i] = 1; break; }
      }
    });
    /* Anything unmatched is shown, not dropped. A rename or a typo
       must never make an issue disappear. */
    S.orphans = S.parsed.filter(function (_, i) { return !used[i]; });
    return slots;
  }

  function isFuture(s) {
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
        '<span class="tpi-meta">' + (fut ? 'not published yet' : 'no PDF uploaded') + '</span>' +
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

    var years = [];
    for (var y = new Date().getFullYear(); y >= firstYear(); y--) years.push(y);

    S.root.innerHTML =
      '<div class="tpi-head">' +
        '<h2 class="tpi-h2">Print Issues</h2>' +
        '<span class="tpi-freq">Publishes <b>' + esc(S.freq.label) + '</b> \u00b7 ' +
          FREQS[S.freq.key].label +
          (S.freq.assumed ? ' <em>assumed</em>' : '') + '</span>' +
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
          '<span class="tpi-orph-w">The name does not match any ' +
            esc(S.freq.label.toLowerCase()) + ' slot in ' + S.year + '.</span>' +
          S.orphans.map(function (I) { return filledHtml(I); }).join('') + '</div>'
        : '');

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

    S.freq   = readFreq();
    S.parsed = harvest();
    S.year   = new Date().getFullYear();

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
    console.log(TAG, 'mounted \u00b7 ' + S.freq.label + ' \u00b7 ' +
                S.parsed.length + ' parsed issue(s) from ' +
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
    freq:    function () { return S.freq; }
  };
})();
