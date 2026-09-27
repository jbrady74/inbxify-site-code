/* ta-print-issues-v3.5.2.js
   ════════════════════════════════════════════════════════════════
   INBXIFY T-A — Print Issue Allocator
   Companions: ta-print-issues-v3.2.0.css (unchanged)
               ta-print-parse-v1.1.2.css  (the upload modal)
               ix-lightbox-v1.1.0.js      (page viewer; v3.5.2)

   ── v3.5.2 · SEE THE ACTUAL PAGES ──
   Asked 27 Sept: a way to look at the printed page while reviewing.
     · "View pages" in the review header opens the whole issue at
       page 1 in the ix-lightbox page viewer (‹ › or arrow keys,
       Fit width for small print, ESC back to the review).
     · A row's page number opens the viewer at that row's first page.
     · Every event and listing in a panel has a "p.N" link to its page.
     · Pages come from the PDF already open in the browser: nothing
       is uploaded. Rendered at the parser's width, 12 most recent
       held, so flipping back is instant.
     · Available while the PDF is open: through the review, until the
       rows are written or the modal closes. After that the viewer
       needs the stored PDF (build step 2).
     · Without ix-lightbox v1.1.0 on the page the page links do not
       show; the review works as before.
   v3.5.1 was never deployed: discard it.

   ── v3.5.1 · EVERY AD KEPT · LISTINGS IN ADS · HOUSE ADS ──
   Rulings (Jeff, 27 Sept), before v3.5.0 was deployed. Needs
   ix-print-parse v1.1.1. v3.5.0 was never deployed: discard it.

     · Listings shown in an ad are read as RE items (any status), the
       ad's agent as the suggested Agent. Ads with only statistics
       give none. Homes sold long ago are still read; untick later.
     · Every print ad is kept: a "Print ads" section under the rows,
       collapsed, one row per ad with advertiser, page, size and the
       suggested Customer. An ad that announces an event or shows
       homes carries them in its panel (event unticked by default).
     · The publisher's own ads are a third section, "Publisher's
       house ads". A chip moves an ad between the two sections; the
       move shows the changed border and undo.
     · Ads are NOT written to SLATE in this version. SLATE has no
       Print ad / House ad type yet (build step 2). Their ticks are
       kept on screen. The Create button counts article-table rows
       only, and says so.
     · Select-all and shift-click ranges work within one section.

   ── v3.5.0 · EVENTS AND LISTINGS, ITEM BY ITEM (Allocator step 1) ──
   Spec: Allocator-RE-Events-Spec v1.10, build step 1 (Parser).
   Needs ix-print-parse v1.1.0 (/extract, new stitch types).

   WHAT IS NEW
     · Two row types: Events page and RE page. A page that is mainly
       a calendar or a property listing is ONE row, as the spec says.
     · After the stitch, a new step reads the items on those pages
       (one /extract call per page), and the event announced by any
       article or ad the stitch flagged. Visible progress: moving
       stripe, clock, and which page is being read.
     · The review shows what was found under each row: every event
       (dates, times, venue, audience) and every listing (address,
       printed status → Listing Phase, price, beds, baths, sq ft,
       MLS). Anything unclear is marked Check with the reason; the
       printed text is on hover.
     · "Also create event" on article rows (ticked) and ad rows
       (unticked). The tick is kept for build step 3; this version
       writes nothing for it.
     · Listing Phase is matched against the LIVE options, read from
       the ix-asset-list Worker (TA_CONFIG.assetListUrl) and sent to
       the parser. No word list lives here. If the options cannot be
       read, listings keep their printed status as a phase note and
       the review says so.
     · A failed page read for items does not stop the run. The row
       says what failed and offers Try again. The PDF stays open until
       the rows are written or the modal closes, so retries work.

   WHAT IS NOT IN THIS VERSION (later build steps)
     · Nothing is created or updated for events or listings. No
       duplicate check yet (step 3), no 104 writes (step 4).
     · SLATE `type` has no Events page / RE page options yet (step 2).
       Until then those rows are WRITTEN AS "other", which is what
       such pages were before this version. slateType() is the one
       place that says so; step 2 deletes that mapping.

   HARDCODED (provisional, logged):
     · HC-P-AL-1 — "Sold" is the phase that hides price by default.
       Platform rule (ruled 26 Sept). Same rule as ta-asf v1.11.5.
       Here it only labels the review: "price not written".

   ── v3.4.1 · A PARSED ISSUE IS NEVER HIDDEN ──
   October was parsed and then vanished behind "Show next issue",
   because the hide rule only asked whether the issue's month had
   arrived. An issue with rows is work in hand, whatever its date:
   isFuture() now returns false as soon as a slot has an issue
   attached, so it lists normally, newest first.

   Hiding still applies to genuinely empty future months, which is
   what it was for.

   The year shown now opens on the newest year that has a parsed
   issue, then falls back to the current year as before.

   ── v3.4.0 · CUSTOMER, NOT ADVERTORIAL · RANGE SELECT · NO SCROLL JUMP ──
   TERMINOLOGY (Jeff, Sep 22). Every editorial piece is an Article.
   What makes one paid is its Customer. Type is now Article | Other,
   and a new Customer column holds the business the parse suggests,
   editable like the other fields. It is written to SLATE as
   `suggested-customer` (plain text) and read back by 103B v1.2
   (hasCustomer) whenever one was sent. Needs ix-print-parse v1.0.3.

   SELECTING ROWS. Shift-click a checkbox sets every row between it
   and the last one clicked to the same state. Cmd- or Ctrl-click
   toggles one row without moving that anchor. A header checkbox
   selects all or none.

   NO SCROLL JUMP. Ticking a row redrew the whole modal and sent the
   table back to the top. Ticks now update the row in place, and
   every other redraw restores the table's scroll position.

   ── v3.3.4 · THE LONG STEP SHOWS IT IS ALIVE ──
   Putting the items together is one model call over every page
   read, typically one to three minutes, and it showed a full,
   motionless bar. It looked frozen.
     · The bar becomes an indeterminate moving stripe.
     · A clock counts elapsed time.
     · A line rotates through what this step does. It describes
       the step, it does not claim progress it cannot measure.
     · STITCH_TIMEOUT_MS: after five minutes the request is aborted
       and the step offers Try again, with all page reads kept.
   Companion CSS moves to ta-print-parse-v1.0.1.css for the stripe.

   ── v3.3.3 · A FAILED PAGE NO LONGER ENDS THE RUN ──
   v3.3.0 stopped the whole read on the first page that failed and
   left only Close: every page already read was thrown away.

   Now every page is attempted. Pages that read are kept. If any
   fail, the modal lists them with the reason and offers:
     · Retry N pages  — re-reads only the failed pages
     · Start over     — back to step 1, file and name kept
     · Cancel         — abandon
   A failed stitch keeps all page reads and offers Try again. Any
   other stop offers Start over as well as Close. The PDF stays
   open until the review step or Cancel, so a retry does not
   re-load it.

   ── v3.3.2 · ONE FILENAME, NOT TWO ──
   With the redraw gone (v3.3.1), the browser's own picker shows the
   filename. The "Chosen:" line repeated it and is removed.

   ── v3.3.1 · THE CHOSEN FILE STAYS ON SCREEN ──
   Picking a PDF redrew the modal, and the redraw built a new, empty
   file input. The file was held in state but the screen said "No
   file chosen", so it looked as if nothing had attached. Choosing a
   file now updates the Read button and a filename line in place,
   with no redraw. The input keeps its file.

   ── v3.3.0 · UPLOAD IS LIVE ──
   A print PDF can now be read and turned into SLATE rows from this
   surface. Three steps in one ix-modal:

     1. Choose the PDF and name the issue.
     2. pdf.js renders each page to a JPEG in the browser; the
        ix-print-parse Worker reads each page, then stitches the
        reads into items.
     3. The operator checks the rows, edits or unticks any, and
        creates them. Scenario 103B (op=create) writes each row.

   WHY THE SECOND BLOCKER IS GONE. v3.2.x said an issue could not be
   recorded before its rows existed. It no longer needs to be: the
   whole read happens in the browser and nothing is written until
   the operator has checked it. The rows ARE the record.

   WRITE ORDER. Cover to Uploadcare first. Then row 1 alone, checked
   against what Webflow stored. Only if it passes do the rest go,
   one per call, each checked. The first failed check stops the run
   and lists any rows that exist, so a broken route costs one row,
   not seventeen.

   TOAST-TRUTH. 103B echoes back self-id, title-admin, page and
   whether source, issue name and cover were stored. Each is
   compared with what was sent. ok:true alone never passes a row.

   DUPLICATES. A PDF whose filename already has SLATE rows is refused
   before reading, with the row count.

   FUTURE SLOTS CAN UPLOAD. A print PDF arrives before its month.
   v3.2.x disabled Upload on any future slot, which would have
   blocked October on September 22. Future slots stay hidden by
   default; revealed, their Upload is live.

   OFF-CALENDAR. An Upload PDF button in the header opens the same
   flow with no slot, for an issue the schedule does not list.

   EDITING (UI standing rules). Every edited field keeps its value,
   takes the --changed border, and shows an undo link that restores
   the parse's reading. Cancel abandons the whole flow.

   CONFIG. Upload renders disabled, naming what is missing, unless
   TA_CONFIG carries printParseWorker, makeSlateWriter,
   uploadcarePublicKey and taItemId. No tenant value lives here.

   HARDCODED (logged): HC-TPI-PDFJS, the pdf.js 3.11.174 cdnjs URL.
   Platform library pin; TA_CONFIG.pdfjsUrl overrides it.

   Mounts in the `PrintIssue` pane, ABOVE the Print Issue Slate Plan.

   ── v3.2.3 · THE SURFACE NAME IS A VARIABLE ──
   v3.2.2 wrote "Print Issue Allocator" as a literal in three
   places and left a comment saying "keep them in step". A comment
   instructing the next person to synchronise three copies IS the
   defect — it is the same shape as the two revenue-type fields
   and the four "is this paid" signals.

   SURFACE now holds it once. The header, the no-ix-header
   fallback and the breadcrumb all read it. Renaming this surface
   again is one edit, and the three can no longer drift apart.

   ── v3.2.2 · HEADER RENAMED · "Print Issue Allocator" ──
   Three strings, one name: the IxHeader.render() title, the <h2>
   in the no-ix-header fallback — which IS the header when
   ix-header fails to load — and the breadcrumb back-button.

   The breadcrumb was left at "‹ Print Issues" in v3.2.1 on the
   reasoning that it names the LIST you return to, not the
   surface. Jeff overruled: match it. One name, one surface.

   The naming is a hierarchy now:
       01 Print Issues          the object   (rail group, ta-chrome)
          Allocator             the tool     (Designer tab label)
          Print Issue Allocator the surface  (this header)
   Same relation 02 Content / Studio already had.

   `data-w-tab` is still "PrintIssue" and must stay that way —
   ta-chrome's RAIL_GROUPS keys on it. Renaming the Designer tab
   to Allocator did NOT rewrite the attribute (confirmed live
   Sep 7). Do not tidy it to match a label.

   Label only: no logic, no markup, no CSS.
   Companion ta-print-issues-v3.2.0.css is UNCHANGED.

   ── v3.2.1 · WITHDRAWN ──
   Shipped with a v3.2.0 filename on line 1 and no changelog
   entry — only the VERSION constant was updated. The standing
   rule is filename on line 1, version on the constant, changelog
   above the previous; two of three were missed. Re-cut as v3.2.2
   under a NEW filename rather than corrected in place, because
   same-name-different-bytes is the jsDelivr caching trap.
   Discard the v3.2.1 build.

   ── v3.2.0 · IT WEARS THE CANONICAL HEADER ──
   This surface drew its own <h2> and its own head row. Every T-A
   tab that does that drifts — different icon treatment, different
   subtitle, a refresh that is a bordered square on one page and a
   text link on the next.

   `ix-header` already solves it and has since v1.0.0:

     IxHeader.render({ icon, title, subtitle, actions })
     IxHeader.refreshBtn({ attr })         the ONE refresh control
     IxTabs.l1 / l2                         the two tab rows

   The subtitle resolves to the live TITLE name inside ix-header, so
   nine tabs do not each solve it. refreshBtn emits the canonical
   button — size, border, spin state and aria identical everywhere —
   and ix-refresh-helper wires the spin.

   HARD DEPENDENCY: ix-header-v1.0.1.js and
   ix-refresh-helper-v1.0.0.js must load BEFORE this file. If either
   is missing the header degrades to a plain title rather than
   throwing: a missing dependency should cost polish, not the page.

   The year tabs move onto IxTabs.l1 so they match the channel tabs
   on Asset Library and Newsletters instead of being a third kind of
   tab invented here.

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

  var VERSION = '3.5.2';

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

  /* v3.3.0 — upload for an issue the schedule does not list. */
  function upHeadBtn() {
    var why = uploadWhy();
    return '<button type="button" class="ix-btn ix-btn--secondary tpi-up-h" data-tpi-up=""' +
      (why ? ' disabled title="' + esc(why) + '"' : '') + '>Upload PDF</button>';
  }

  function hasHeader() { return !!(window.IxHeader && window.IxHeader.render); }

  function headHtml(right, extra) {
    if (!hasHeader()) {
      return '<div class="tpi-head"><h2 class="tpi-h2">' + esc(SURFACE) + '</h2>' +
             (extra || '') + '<span class="tpi-sp"></span>' + (right || '') + upHeadBtn() + '</div>';
    }
    return window.IxHeader.render({
      icon:  '\uD83D\uDCF0',            /* newspaper — the print issue itself */
      title: SURFACE,
      actions: [
        extra || '',
        right  || '',
        upHeadBtn(),
        window.IxHeader.refreshBtn({ attr: 'data-tpi-refresh' })
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
        render();
      });
    } else {
      btn.addEventListener('click', function () { S.parsed = harvest(); render(); });
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
  // PARSE  (v3.3.0)
  // PDF → page images → ix-print-parse → review → 103B create
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
     v3.5.0 — plus Events page and RE page (one row per listings page). */
  var TYPE_OPTS = [
    { v: 'article',     l: 'Article' },
    { v: 'other',       l: 'Other' },
    { v: 'events-page', l: 'Events' },
    { v: 're-page',     l: 'RE' }
  ];

  /* v3.5.1 — the two ad sections. Not written to SLATE until step 2. */
  var AD_TYPE_OPTS = [
    { v: 'print-ad', l: 'Print ad' },
    { v: 'house-ad', l: 'House' }
  ];
  function isAdType(t) { return t === 'print-ad' || t === 'house-ad'; }
  function sectionOf(it) { return isAdType(it.cur.type) ? it.cur.type : 'main'; }
  function writable(it) { return it.include && it.cur.name.trim() && !isAdType(it.cur.type); }
  var AD_SIZE_LABEL = { full: 'Full page', half: 'Half', third: 'Third', quarter: 'Quarter',
                        eighth: 'Eighth', strip: 'Strip' };

  /* v3.5.0 — the SLATE `type` value a row is written with. SLATE has
     no Events page / RE page options until build step 2, so those
     rows go as "other", as they did before. Step 2 removes this. */
  function slateType(t) {
    return (t === 'events-page' || t === 're-page') ? 'other' : t;
  }

  /* v3.5.0 — item extraction */
  var EXTRACT_CONCURRENCY = 3;
  var EXTRACT_RETRIES     = 1;
  var EXTRACT_TIMEOUT_MS  = 4 * 60 * 1000;
  /* HC-P-AL-1 (platform rule, 26 Sept): phases that hide price. */
  var HIDE_PRICE_PHASES   = ['sold'];

  function taId() { return String(cfg().taItemId || titleAdminId() || '').trim(); }

  /* Everything the flow needs, named. An empty list means ready. */
  function uploadGate() {
    var c = cfg(), miss = [];
    if (!c.printParseWorker)    miss.push('TA_CONFIG.printParseWorker');
    if (!c.makeSlateWriter)     miss.push('TA_CONFIG.makeSlateWriter');
    if (!c.uploadcarePublicKey) miss.push('TA_CONFIG.uploadcarePublicKey');
    if (!taId())                miss.push('TA_CONFIG.taItemId');
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

  /* ── State for one upload. Reset on every open. ── */
  var P = {};

  function openParse(slotKey) {
    var gate = uploadGate();
    if (gate.length) { alert(uploadWhy()); return; }
    var slot = null;
    for (var i = 0; i < S.plan.length; i++) if (S.plan[i].k === slotKey) slot = S.plan[i];
    P = {
      phase: 'pick', cancelled: false,
      file: null, source: '', pages: 0, done: 0,
      issueName: slot ? slot.label : '', issueNameOrig: slot ? slot.label : '',
      expectSource: slot ? slot.source : '',
      coverB64: '', coverUrl: '',
      items: [], log: [], error: '', dupe: 0
    };
    mountPz();
    renderPz();
  }

  /* The run object is captured by every async step, so a closed or
     reopened modal can never be written to by the run before it. */
  function closePz() {
    P.cancelled = true;
    stopTick(P);
    destroyPdf(P);
    var ov = document.querySelector('.tpi-pz-ov');
    if (ov) ov.parentNode.removeChild(ov);
  }

  function live(run) { return !run.cancelled && P === run; }

  function destroyPdf(run) {
    if (run && run.pdf) { try { run.pdf.destroy(); } catch (x) {} run.pdf = null; }
  }

  function startRead() {
    var run = P;
    if (!run.file) return;
    var dupes = S.parsed.filter(function (I) { return norm(I.source) === norm(run.file.name); });
    if (dupes.length) { run.dupe = dupes[0].items; renderPz(); return; }
    if (!String(run.issueName).trim()) { run.error = 'Give the issue a name first.'; renderPz(); return; }

    run.source = run.file.name; run.error = ''; run.reads = []; run.fails = {};
    run.phase = 'reading'; run.done = 0;
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
    run.done = run.pages - list.length;
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
      stitchNow(run);
    });
  }

  function retryFailed() {
    var run = P;
    var list = Object.keys(run.fails).map(Number).sort(function (a, b) { return a - b; });
    if (list.length && run.pdf) readPages(run, list);
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
          adSize: it.adSize || ''
        };
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
    if (!rows.length) { run.phase = 'review'; renderPz(); return; }
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
      run.phase = 'review'; renderPz();
    });
  }

  /* Try again for one row, from the review. */
  function retryRow(i) {
    var run = P, it = run.items[i];
    if (!it || !run.pdf || (it.found && it.found.busy)) return;
    it.found = { items: [], errors: [], defaults: null, busy: true };
    renderPz();
    var p0 = (run.phases || !jobsFor(it).some(jobIsRe))
      ? Promise.resolve(run.phases) : loadPhases(run).then(function (ph) { run.phases = ph; });
    p0.then(function () { return extractRow(run, it); }).then(function () {
      if (live(run) && run.phase === 'review') renderPz();
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

  // ── v3.5.0 review: what was found ────────────────────────

  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function dParts(iso) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return null;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return { y: +m[1], mo: +m[2] - 1, d: +m[3], dow: DOW[d.getUTCDay()] };
  }
  function fmtTime(t) {
    var m = String(t || '').match(/^(\d{2}):(\d{2})$/); if (!m) return '';
    var h = +m[1], ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
    return h + (m[2] === '00' ? '' : ':' + m[2]) + ap;
  }
  function whenText(x) {
    var times = x.startTime ? fmtTime(x.startTime) + (x.endTime ? '\u2013' + fmtTime(x.endTime) : '') : '';
    var dates = '';
    if (x.dates && x.dates.length > 1) {
      var ps = x.dates.map(function (d) { return dParts(d.date); }).filter(Boolean);
      var sameMonth = ps.every(function (p) { return p.mo === ps[0].mo; });
      dates = ps[0].dow + ' ' + MON[ps[0].mo] + ' ' + ps.map(function (p, i) {
        return (i && !sameMonth ? MON[p.mo] + ' ' : '') + p.d;
      }).join(', ');
    } else {
      var a = dParts(x.startDate), b = dParts(x.endDate);
      if (a) dates = a.dow + ' ' + MON[a.mo] + ' ' + a.d;
      if (a && b && x.endDate !== x.startDate) {
        dates += '\u2013' + (b.mo === a.mo ? b.d : MON[b.mo] + ' ' + b.d);
      }
    }
    return [dates || 'No date', times].filter(Boolean).join(' \u00b7 ');
  }
  function hidesPrice(label) {
    return HIDE_PRICE_PHASES.indexOf(String(label || '').trim().toLowerCase()) !== -1;
  }
  function money(v) {
    var n = Number(v); return v === '' || isNaN(n) ? '' : '$' + n.toLocaleString('en-US');
  }
  function checkCell(x) {
    return x.check ? '<span class="tpi-pz-flag" title="' + esc(x.checkReason || 'Check this item') + '">Check</span>' : '';
  }

  function eventsTable(items) {
    return '<table class="tpi-pz-xt"><thead><tr>' +
      '<th>Event</th><th class="tpi-pz-x--when">When</th><th class="tpi-pz-x--venue">Venue</th>' +
      '<th class="tpi-pz-x--aud">Audience</th><th class="tpi-pz-x--chk"></th></tr></thead><tbody>' +
      items.map(function (x) {
        var venue = [x.venueName, x.room].filter(Boolean).join(', ') +
          (x.venueFromDefault ? ' <span class="tpi-pz-x-dim">(page default)</span>' : '');
        return '<tr title="' + esc(x.rawText || '') + '">' +
          '<td>' + esc(x.title) + ' ' + pageLink(x.pdfPage, 'p.' + (printedFolio(x.pdfPage) || x.pdfPage)) + '</td>' +
          '<td class="tpi-pz-x--when">' + esc(whenText(x)) + '</td>' +
          '<td class="tpi-pz-x--venue">' + (venue || '<span class="tpi-pz-x-dim">\u2014</span>') + '</td>' +
          '<td class="tpi-pz-x--aud">' + esc(x.audience || '') + '</td>' +
          '<td class="tpi-pz-x--chk">' + checkCell(x) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function reTable(items) {
    return '<table class="tpi-pz-xt"><thead><tr>' +
      '<th>Address</th><th class="tpi-pz-x--phase">Printed \u2192 Listing Phase</th>' +
      '<th class="tpi-pz-x--price">Price</th><th class="tpi-pz-x--facts">Beds \u00b7 Baths \u00b7 Sq ft</th>' +
      '<th class="tpi-pz-x--mls">MLS #</th><th class="tpi-pz-x--chk"></th></tr></thead><tbody>' +
      items.map(function (x) {
        var phase = esc(x.statusPrinted || '\u2014') + ' \u2192 ' +
          (x.phase ? '<b>' + esc(x.phase) + '</b>' : '<span class="tpi-pz-x-dim">none</span>') +
          (x.phaseNote ? ' <span class="tpi-pz-x-dim">note: ' + esc(x.phaseNote) + '</span>' : '');
        var price = hidesPrice(x.phase)
          ? '<span class="tpi-pz-x-dim">hidden (' + esc(x.phase) + ')' +
              (x.price ? ', ' + money(x.price) + ' printed, not written' : '') + '</span>'
          : (money(x.price) || '<span class="tpi-pz-x-dim">\u2014</span>');
        var facts = [x.bedrooms, x.bathrooms, x.sqFt].map(function (v) { return v || '\u2013'; }).join(' \u00b7 ');
        return '<tr title="' + esc(x.rawText || '') + '">' +
          '<td>' + esc(x.address) + (x.city ? ', ' + esc(x.city) : '') + ' ' +
            pageLink(x.pdfPage, 'p.' + (printedFolio(x.pdfPage) || x.pdfPage)) + '</td>' +
          '<td class="tpi-pz-x--phase">' + phase + '</td>' +
          '<td class="tpi-pz-x--price">' + price + '</td>' +
          '<td class="tpi-pz-x--facts">' + esc(facts) + '</td>' +
          '<td class="tpi-pz-x--mls">' + esc(x.mlsNumber || '') + '</td>' +
          '<td class="tpi-pz-x--chk">' + checkCell(x) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  /* The panel under a row: what extraction found, or why it did not.
     v3.5.1 — events and listings are shown separately (an ad can have
     both); colspan follows the table the row sits in. */
  function foundHtml(it, i, cols) {
    var f = it.found; if (!f) return '';
    var t = it.orig.type;
    var isPage = t === 'events-page' || t === 're-page';
    var evs = f.items.filter(function (x) { return x._k === 'event'; });
    var res = f.items.filter(function (x) { return x._k === 're'; });
    var chk = f.items.filter(function (x) { return x.check; }).length;
    var parts = [];

    if (f.busy) parts.push('<div class="tpi-pz-x-head"><span class="tpi-pz-x-busy"></span>Reading the items\u2026</div>');
    else if (isPage) {
      var n = f.items.length;
      var noun = t === 're-page' ? (n === 1 ? 'listing' : 'listings') : (n === 1 ? 'event' : 'events');
      parts.push('<div class="tpi-pz-x-head"><b>' + n + ' ' + noun + ' found</b>' +
        (chk ? ' \u00b7 ' + chk + ' to check' : '') +
        (it.itemCount && it.itemCount !== n ? ' <span class="tpi-pz-x-dim">(page read counted ' + it.itemCount + ')</span>' : '') +
        (n ? ' <button type="button" class="ix-revert" data-pz-xt="' + i + '">' + (it.open ? 'hide' : 'show') + '</button>' : '') +
        '</div>');
    } else {
      if (it.event !== 'none') {
        var dflt = it.event === 'article';
        var ch = it.alsoEvent !== dflt;
        parts.push('<div class="tpi-pz-x-head"><label class="tpi-pz-also' + (ch ? ' tpi-pz-also--changed' : '') + '">' +
          '<input type="checkbox" data-pz-also="' + i + '"' + (it.alsoEvent ? ' checked' : '') + '> ' +
          'Also create event</label>' +
          (ch ? ' <button type="button" class="ix-revert" data-pz-also-rv="' + i + '">undo</button>' : '') +
          ' <span class="tpi-pz-x-dim">' + (dflt ? 'from the article, ticked by default' : 'from an ad, unticked by default') + '</span></div>');
      }
      if (it.listings === 'ad') {
        parts.push('<div class="tpi-pz-x-head"><b>' + res.length + ' listing' + (res.length === 1 ? '' : 's') +
          ' in this ad</b>' + (res.filter(function (x) { return x.check; }).length ? ' \u00b7 ' +
          res.filter(function (x) { return x.check; }).length + ' to check' : '') +
          ' <span class="tpi-pz-x-dim">agent suggested from the ad</span></div>');
      }
    }
    if (res.length && P.phases && P.phases.why) {
      parts.push('<div class="tpi-pz-x-err">Listing Phase options could not be read (' + esc(P.phases.why) +
        '), so printed statuses are kept as phase notes.</div>');
    }
    if (f.defaults && (f.defaults.venueName || f.defaults.street)) {
      parts.push('<div class="tpi-pz-x-dim">Page default venue: ' +
        esc([f.defaults.venueName, f.defaults.street, f.defaults.city].filter(Boolean).join(', ')) + '</div>');
    }
    if (f.errors.length) {
      parts.push('<div class="tpi-pz-x-err">Could not read the items on PDF page ' +
        f.errors.map(function (e) { return e.pdfPage + ' (' + esc(e.why) + ')'; }).join('; ') +
        '. <button type="button" class="ix-revert" data-pz-xretry="' + i + '">Try again</button></div>');
    }
    if (!f.busy && (it.open || !isPage)) {
      if (evs.length) parts.push(eventsTable(evs));
      if (res.length) parts.push(reTable(res));
    }
    if (!isPage && !f.busy && !f.items.length && !f.errors.length) {
      parts.push('<div class="tpi-pz-x-dim">The page read flagged ' +
        (it.listings === 'ad' ? 'homes' : 'an event') + ' here, but a closer read found none.</div>');
    }
    return '<tr class="tpi-pz-sub' + (it.include ? '' : ' tpi-pz-off') + '" data-pz-sub="' + i + '"><td></td>' +
      '<td colspan="' + ((cols || 9) - 1) + '"><div class="tpi-pz-x">' + parts.join('') + '</div></td></tr>';
  }

  function foundSummary() {
    var ep = 0, ev = 0, rp = 0, re = 0, ea = 0, ed = 0, rd = 0, chk = 0, bad = 0, pa = 0, ha = 0;
    P.items.forEach(function (it) {
      var t = it.cur.type;
      if (t === 'print-ad') pa++;
      if (t === 'house-ad') ha++;
      if (!it.found) return;
      var evs = it.found.items.filter(function (x) { return x._k === 'event'; }).length;
      var res = it.found.items.filter(function (x) { return x._k === 're'; }).length;
      chk += it.found.items.filter(function (x) { return x.check; }).length;
      if (it.found.errors.length) bad++;
      if (it.orig.type === 'events-page') { ep++; ev += evs; }
      else if (it.orig.type === 're-page') { rp++; re += res; }
      else {
        if (it.event === 'article') ea += evs;
        if (it.event === 'ad') ed += evs;
        rd += res;
      }
    });
    var parts = [];
    if (ep) parts.push(ep + ' events page' + (ep === 1 ? '' : 's') + ' (' + ev + ' event' + (ev === 1 ? '' : 's') + ')');
    if (rp) parts.push(rp + ' RE page' + (rp === 1 ? '' : 's') + ' (' + re + ' listing' + (re === 1 ? '' : 's') + ')');
    if (rd) parts.push(rd + ' listing' + (rd === 1 ? '' : 's') + ' in ads');
    if (ea) parts.push(ea + ' event' + (ea === 1 ? '' : 's') + ' in articles');
    if (ed) parts.push(ed + ' event' + (ed === 1 ? '' : 's') + ' in ads');
    if (pa) parts.push(pa + ' print ad' + (pa === 1 ? '' : 's'));
    if (ha) parts.push(ha + ' house ad' + (ha === 1 ? '' : 's'));
    if (!parts.length && !bad) return '';
    return '<div class="ix-modal-banner tpi-pz-found">Found: ' + parts.join(' \u00b7 ') +
      (chk ? ' \u00b7 <b>' + chk + ' to check</b>' : '') +
      (bad ? ' \u00b7 <b>' + bad + ' row' + (bad === 1 ? '' : 's') + ' could not be read</b>' : '') +
      '. This version shows what was found. It does not create events, listings or ad records yet.</div>';
  }

  // ══════════════════════════════════════════════════════════
  // v3.5.2 — PAGE VIEWER (ix-lightbox v1.1.0 paged mode)
  // ══════════════════════════════════════════════════════════

  var VIEW_CACHE_MAX = 12;
  function canView() {
    return !!(P && P.pdf && window.InbxLightbox && window.InbxLightbox.openPages);
  }
  function printedFolio(n) {
    var r = P && P.reads && P.reads[n - 1];
    return r && r.printedPageNumber != null ? r.printedPageNumber : null;
  }
  function viewPages(start) {
    if (!canView()) return;
    var run = P;
    run.viewCache = run.viewCache || { order: [], map: {} };
    var vc = run.viewCache;
    window.InbxLightbox.openPages({
      count: run.pages,
      start: start || 1,
      getSrc: function (n) {
        if (vc.map[n]) return vc.map[n];
        if (!run.pdf) return Promise.reject(new Error('the PDF has been released; reopen it to view pages'));
        var pr = renderPage(run.pdf, n).then(function (b64) { return 'data:image/jpeg;base64,' + b64; });
        pr.catch(function () { delete vc.map[n]; });
        vc.map[n] = pr; vc.order.push(n);
        while (vc.order.length > VIEW_CACHE_MAX) delete vc.map[vc.order.shift()];
        return pr;
      },
      caption: function (n) {
        var f = printedFolio(n);
        return (run.issueName ? run.issueName + ' \u00b7 ' : '') + 'PDF page ' + n + ' of ' + run.pages +
          (f != null && String(f) !== String(n) ? ' \u00b7 printed page ' + f : '');
      }
    });
  }
  function pageLink(n, label) {
    if (!n || !canView()) return esc(label);
    return '<button type="button" class="tpi-pz-pg" data-pz-view="' + n + '" title="View this page">' +
      esc(label) + '</button>';
  }

  /* Back to step 1 with the file and name kept. */
  function startOver() {
    var run = P;
    destroyPdf(run);
    run.phase = 'pick'; run.error = ''; run.reads = []; run.fails = {};
    run.items = []; run.done = 0; run.coverB64 = '';
    renderPz();
  }

  /* ── Write: cover first, then row 1 alone, then the rest ── */

  function b64ToBlob(b64) {
    var bin = atob(b64), n = bin.length, u = new Uint8Array(n);
    for (var i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u], { type: 'image/jpeg' });
  }

  function uploadCover() {
    if (!P.coverB64) return Promise.resolve('');
    var c = cfg(), fd = new FormData();
    fd.append('UPLOADCARE_PUB_KEY', c.uploadcarePublicKey);
    fd.append('UPLOADCARE_STORE', '1');
    fd.append('file', b64ToBlob(P.coverB64),
              'COVER___' + P.source.replace(/\.pdf$/i, '') + '.jpg');
    return fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: fd })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.file) throw new Error('Uploadcare returned no file id for the cover');
        var base = String(c.uploadcareBase || 'https://ucarecdn.com').replace(/\/$/, '');
        return base + '/' + j.file + '/';
      });
  }

  function fieldDataOf(it, ctx) {
    var fd = {
      'name': it.cur.name.trim(),
      'slug': it.slug,
      'source': ctx.source,
      'page': Number(it.page),
      'section': it.cur.section.trim(),
      'byline': it.cur.byline.trim(),
      'suggested-customer': it.cur.customer.trim(),
      'image-count': Number(it.images) || 0,
      'title-admin': ctx.taId,
      'print-issue-name': ctx.issueName,
      'print-issue-pages': ctx.pages,
      'parsed-on': ctx.parsedOn
    };
    if (ctx.coverUrl) fd['cover-url'] = ctx.coverUrl;
    return fd;
  }

  /* One op per call, over the same GET contract 103B already serves.
     A create op carries a finished fieldData string, so one op is
     about a kilobyte of URL; batching would cross the URL ceiling. */
  function sendCreate(op) {
    var url = cfg().makeSlateWriter;
    var batchId = 'tpi-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    var u = url + (url.indexOf('?') > -1 ? '&' : '?') +
            'op=create&batchId=' + encodeURIComponent(batchId) +
            '&batch=' + encodeURIComponent(JSON.stringify({ ops: [op] }));
    return fetch(u).then(function (r) {
      if (!r.ok) throw new Error('103B returned HTTP ' + r.status);
      return r.text();
    }).then(function (t) {
      var b;
      try { b = JSON.parse(t); } catch (e) { throw new Error('103B reply is not JSON: ' + t.slice(0, 120)); }
      var row = b && b.results && b.results[0];
      if (!row) throw new Error('103B returned no result for this row');
      return row;
    });
  }

  function yes(v) { return v === true || v === 'true'; }

  /* TOAST-TRUTH. ok:true is necessary, not sufficient: every value
     that matters is read back from what Webflow stored. */
  function verifyRow(row, fd) {
    var why = [];
    if (!yes(row.ok) || !row.id)                    why.push('not created');
    if (row.id && row.selfId !== row.id)            why.push('self-slate-item-id not set');
    if (row.titleAdmin !== fd['title-admin'])       why.push('title-admin not stored');
    if (Number(row.page) !== Number(fd.page))       why.push('page not stored');
    if (!yes(row.hasSource))                        why.push('source not stored');
    if (!yes(row.hasIssueName))                     why.push('print-issue-name not stored');
    if (fd['cover-url'] && !yes(row.hasCover))      why.push('cover-url not stored');
    if (fd['suggested-customer'] && !yes(row.hasCustomer)) why.push('suggested-customer not stored');
    return why;
  }

  function startWrite() {
    var run = P;
    var rows = run.items.filter(writable);   /* v3.5.1 — ads wait for step 2 */
    if (!rows.length) return;
    P.phase = 'writing'; P.log = []; P.done = 0; P.total = rows.length; P.error = '';
    destroyPdf(run);   /* v3.5.0 — held open for extraction retries until now */
    renderPz();

    var ctx = {
      source: P.source, taId: taId(), issueName: String(P.issueName).trim(),
      pages: P.pages, parsedOn: new Date().toISOString(), coverUrl: ''
    };

    uploadCover().then(function (url) {
      ctx.coverUrl = url; P.coverUrl = url;
      return rows.reduce(function (chain, it, i) {
        return chain.then(function () {
          var fd = fieldDataOf(it, ctx);
          return sendCreate({ fieldDataJson: JSON.stringify(fd), type: slateType(it.cur.type), name: fd.name })
            .then(function (row) {
              var why = verifyRow(row, fd);
              P.log.push({ name: fd.name, id: row.id || '', why: why });
              P.done++; progPz();
              if (why.length) {
                throw new Error((i === 0 ? 'The first row failed its check, so nothing else was written. '
                                        : 'Row ' + (i + 1) + ' failed its check, so the rest were not written. ') +
                                '\u201c' + fd.name + '\u201d: ' + why.join(', ') + '.');
              }
            });
        });
      }, Promise.resolve());
    }).then(function () {
      P.phase = 'done'; renderPz();
    }).catch(function (e) {
      P.phase = 'error'; P.error = String(e.message || e); renderPz();
    });
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
    if (P.phase === 'stitching' || P.phase === 'extracting') return;   /* clock owns the label */
    var tot = P.phase === 'writing' ? P.total : P.pages;
    var bar = m.querySelector('.tpi-pz-bar i');
    var txt = m.querySelector('.tpi-pz-prog-t');
    if (bar) bar.style.width = tot ? (P.done / tot * 100).toFixed(1) + '%' : '0%';
    if (txt) txt.textContent = P.phase === 'writing'
      ? 'Writing row ' + Math.min(P.done + 1, tot) + ' of ' + tot
      : 'Read ' + P.done + ' of ' + (tot || '\u2026') + ' pages';
  }

  function changed(it, f) { return it.cur[f] !== it.orig[f]; }

  function cellInput(it, i, f) {
    var ch = changed(it, f);
    return '<td class="tpi-pz-c tpi-pz-c--' + f + '">' +
      '<span class="tpi-pz-f">' +
        '<input class="ix-picker-input' + (ch ? ' ix-picker-input--changed' : '') + '"' +
          ' data-pz-i="' + i + '" data-pz-f="' + f + '" value="' + esc(it.cur[f]) + '"' +
          (it.include ? '' : ' disabled') + '>' +
        '<button type="button" class="ix-revert" data-pz-rv="' + i + ':' + f + '"' +
          (ch ? '' : ' hidden') + '>undo</button>' +
      '</span></td>';
  }

  function cellType(it, i, opts) {
    var ch = changed(it, 'type');
    return '<td class="tpi-pz-c tpi-pz-c--type"><span class="tpi-pz-f">' +
      '<span class="ix-chip-group">' + (opts || TYPE_OPTS).map(function (o) {
        var on = it.cur.type === o.v;
        return '<button type="button" class="ix-chip' + (on && ch ? ' ix-chip--changed' : '') +
          (on ? ' tpi-pz-chip--on' : '') + '" data-pz-type="' + i + ':' + o.v + '"' +
          (it.include ? '' : ' disabled') + '>' + o.l + '</button>';
      }).join('') + '</span>' +
      '<button type="button" class="ix-revert" data-pz-rv="' + i + ':type"' +
        (ch ? '' : ' hidden') + '>undo</button>' +
    '</span></td>';
  }

  /* v3.5.1 — every ticked row in a section? */
  function allOn(sec) {
    var rows = P.items.filter(function (it) { return sectionOf(it) === sec; });
    return rows.length > 0 && rows.every(function (it) { return it.include; });
  }

  /* v3.5.1 — Print ads / Publisher's house ads: collapsed sections
     under the article table. Seven columns. */
  function adSectionHtml(sec, label) {
    var idx = [];
    P.items.forEach(function (it, i) { if (sectionOf(it) === sec) idx.push(i); });
    if (!idx.length) return '';
    P.adOpen = P.adOpen || {};
    var open = !!P.adOpen[sec];
    var on = idx.filter(function (i) { return P.items[i].include; }).length;
    var head = '<div class="tpi-pz-ads-head">' +
      '<button type="button" class="tpi-pz-ads-tog" data-pz-ads="' + sec + '" aria-expanded="' + open + '">' +
        (open ? '\u25be ' : '\u25b8 ') + esc(label) + ' (' + idx.length + ')</button>' +
      '<span class="tpi-pz-x-dim">' + on + ' ticked \u00b7 kept on screen; written once SLATE has this type</span>' +
      '</div>';
    if (!open) return '<div class="tpi-pz-ads">' + head + '</div>';
    return '<div class="tpi-pz-ads">' + head +
      '<div class="tpi-pz-tw"><table class="tpi-pz-t tpi-pz-t--ads">' +
        '<thead><tr>' +
          '<th class="tpi-pz-c--inc"><input type="checkbox" data-pz-all="' + sec + '" aria-label="Select all"' +
            (allOn(sec) ? ' checked' : '') + '></th>' +
          '<th class="tpi-pz-c--pg">Page</th><th>Advertiser</th>' +
          '<th class="tpi-pz-c--size">Size</th>' +
          '<th class="tpi-pz-c--customer">' + (sec === 'house-ad' ? '' : 'Customer') + '</th>' +
          '<th class="tpi-pz-c--adtype">Kind</th><th class="tpi-pz-c--conf">Check</th>' +
        '</tr></thead><tbody>' +
        idx.map(function (i) {
          var it = P.items[i];
          return '<tr data-pz-row="' + i + '" class="' + (it.include ? '' : 'tpi-pz-off') + '">' +
            '<td class="tpi-pz-c--inc"><input type="checkbox" data-pz-inc="' + i + '"' +
              (it.include ? ' checked' : '') + ' aria-label="Include"></td>' +
            '<td class="tpi-pz-c--pg">' + pageLink(it.pdfPage, it.span) + '</td>' +
            cellInput(it, i, 'name') +
            '<td class="tpi-pz-c--size">' + esc(AD_SIZE_LABEL[it.adSize] || '') + '</td>' +
            (sec === 'house-ad' ? '<td class="tpi-pz-c--customer"></td>' : cellInput(it, i, 'customer')) +
            cellType(it, i, AD_TYPE_OPTS).replace('tpi-pz-c--type', 'tpi-pz-c--adtype') +
            '<td class="tpi-pz-c--conf">' + (it.conf === 'high' ? '' :
              '<span class="tpi-pz-flag" title="' + esc(it.note || 'Judgement call') + '">' +
              esc(it.conf) + '</span>') + '</td>' +
          '</tr>' + foundHtml(it, i, 7);
        }).join('') +
      '</tbody></table></div></div>';
  }

  function reviewHtml() {
    var n = P.items.filter(function (it) { return it.include; }).length;
    var nameCh = P.issueName !== P.issueNameOrig;
    return '' +
      '<div class="tpi-pz-issue">' +
        (P.coverB64 ? '<img class="tpi-pz-cover" src="data:image/jpeg;base64,' + P.coverB64 + '" alt="">' : '') +
        '<div class="tpi-pz-issue-f">' +
          '<label class="tpi-pz-lab">Issue name</label>' +
          '<span class="tpi-pz-f">' +
            '<input class="ix-picker-input' + (nameCh ? ' ix-picker-input--changed' : '') +
              '" data-pz-issue="1" value="' + esc(P.issueName) + '">' +
            '<button type="button" class="ix-revert" data-pz-rv="issue"' + (nameCh ? '' : ' hidden') + '>undo</button>' +
          '</span>' +
          '<span class="tpi-pz-meta">' + esc(P.source) + ' \u00b7 ' + P.pages + ' pages \u00b7 ' +
            P.items.filter(function (it) { return sectionOf(it) === 'main'; }).length + ' rows \u00b7 ' +
            P.items.filter(function (it) { return sectionOf(it) !== 'main'; }).length + ' ads found</span>' +
          (canView() ? '<button type="button" class="ix-btn ix-btn--secondary tpi-pz-view" data-pz-view="1">View pages</button>' : '') +
        '</div>' +
      '</div>' +
      foundSummary() +
      '<div class="tpi-pz-tw"><table class="tpi-pz-t">' +
        '<thead><tr>' +
          '<th class="tpi-pz-c--inc"><input type="checkbox" data-pz-all="main" aria-label="Select all"' +
            (allOn('main') ? ' checked' : '') + '></th>' +
          '<th class="tpi-pz-c--pg">Page</th>' +
          '<th>Name</th><th class="tpi-pz-c--section">Section</th>' +
          '<th class="tpi-pz-c--byline">Byline</th><th class="tpi-pz-c--customer">Customer</th>' +
          '<th class="tpi-pz-c--img">Img</th>' +
          '<th class="tpi-pz-c--type">Type</th><th class="tpi-pz-c--conf">Check</th>' +
        '</tr></thead><tbody>' +
        P.items.map(function (it, i) {
          if (sectionOf(it) !== 'main') return '';
          return '<tr data-pz-row="' + i + '" class="' + (it.include ? '' : 'tpi-pz-off') + '">' +
            '<td class="tpi-pz-c--inc"><input type="checkbox" data-pz-inc="' + i + '"' +
              (it.include ? ' checked' : '') + ' aria-label="Include"></td>' +
            '<td class="tpi-pz-c--pg" title="Pages ' + esc(it.span) + '">' + pageLink(it.pdfPage, it.span) + '</td>' +
            cellInput(it, i, 'name') + cellInput(it, i, 'section') + cellInput(it, i, 'byline') +
            cellInput(it, i, 'customer') +
            '<td class="tpi-pz-c--img">' + it.images + '</td>' +
            cellType(it, i) +
            '<td class="tpi-pz-c--conf">' + (it.conf === 'high' ? '' :
              '<span class="tpi-pz-flag" title="' + esc(it.note || 'Judgement call') + '">' +
              esc(it.conf) + '</span>') + '</td>' +
          '</tr>' + foundHtml(it, i, 9);
        }).join('') +
      '</tbody></table></div>' +
      adSectionHtml('print-ad', 'Print ads') +
      adSectionHtml('house-ad', 'Publisher\u2019s house ads') +
      '<p class="tpi-pz-hint">Untick anything that should not become a row. Shift-click ticks or ' +
        'unticks a range within a section. Customer is the business the parse thinks a piece belongs ' +
        'to; it is a suggestion, confirmed later. Events page and RE page rows are written as Other ' +
        'until SLATE has those types. Print and house ads are not written yet (they need the SLATE ' +
        'types first). Nothing is written until you create the rows.</p>' +
      '<span class="tpi-pz-count" hidden>' + n + '</span>';
  }

  function renderPz() {
    var m = pzEl(); if (!m) return;
    var title = 'Upload print issue', sub = '', body = '', foot = '';
    var cancel = '<button type="button" class="ix-revert" data-pz-cancel="1">Cancel</button>';

    if (P.phase === 'pick') {
      sub = 'Step 1 of 3 \u00b7 choose the PDF';
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
        (P.error ? '<div class="ix-modal-banner tpi-pz-warn">' + esc(P.error) + '</div>' : '');
      foot = cancel + '<button type="button" class="ix-btn ix-btn--primary" data-pz-read="1"' +
        (P.file && !P.dupe ? '' : ' disabled') + '>Read the PDF</button>';
    }
    else if (P.phase === 'stitching') {
      sub = 'Step 2 of 3 \u00b7 putting the items together';
      var el0 = P.t0 ? Math.floor((Date.now() - P.t0) / 1000) : 0;
      body = '<div class="tpi-pz-prog"><span class="tpi-pz-bar tpi-pz-bar--busy"><i></i></span>' +
        '<span class="tpi-pz-prog-t" data-pz-clock="1">' + Math.floor(el0 / 60) + ':' +
          ('0' + (el0 % 60)).slice(-2) + '</span></div>' +
        '<p class="tpi-pz-hint"><b>All ' + P.pages + ' pages read.</b> <span data-pz-line="1">' +
          STITCH_LINES[0] + '\u2026</span></p>' +
        '<p class="tpi-pz-hint">This is one long step, usually one to three minutes. ' +
          'It stops on its own after ' + (STITCH_TIMEOUT_MS / 60000) + ' minutes.</p>';
      foot = cancel;
    }
    else if (P.phase === 'extracting') {
      sub = 'Step 2 of 3 \u00b7 reading events and listings';
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
      sub = 'Step 2 of 3 \u00b7 reading';
      body = '<div class="tpi-pz-prog"><span class="tpi-pz-bar"><i></i></span>' +
        '<span class="tpi-pz-prog-t"></span></div>' +
        (P.phase === 'stitching' ? '<p class="tpi-pz-hint">All pages read. Putting the items together.</p>'
          : '<p class="tpi-pz-hint">Each page is read as an image. This takes a few minutes for a full issue.</p>');
      foot = cancel;
    }
    else if (P.phase === 'review') {
      sub = 'Step 3 of 3 \u00b7 check the rows';
      body = reviewHtml();
      var n = P.items.filter(writable).length;
      foot = cancel + '<button type="button" class="ix-btn ix-btn--primary" data-pz-write="1"' +
        (n ? '' : ' disabled') + '>Create ' + n + ' row' + (n === 1 ? '' : 's') + '</button>';
    }
    else if (P.phase === 'readfail') {
      var failed = Object.keys(P.fails).map(Number).sort(function (a, b) { return a - b; });
      sub = 'Some pages could not be read';
      body = '<p><b>' + (P.pages - failed.length) + ' of ' + P.pages + ' pages read.</b> ' +
        'These failed after one retry:</p>' +
        '<ul class="tpi-pz-fails">' + failed.map(function (n) {
          return '<li>Page ' + n + ': ' + esc(P.fails[n]) + '</li>';
        }).join('') + '</ul>' +
        '<p class="tpi-pz-hint">The pages that worked are kept. Retry reads only the failed pages.</p>';
      foot = cancel +
        '<button type="button" class="ix-btn ix-btn--secondary" data-pz-over="1">Start over</button>' +
        '<button type="button" class="ix-btn ix-btn--primary" data-pz-retry="1">Retry ' +
          failed.length + ' page' + (failed.length === 1 ? '' : 's') + '</button>';
    }
    else if (P.phase === 'stitchfail') {
      sub = 'Could not put the items together';
      body = '<div class="ix-modal-banner tpi-pz-warn">' + esc(P.error) + '</div>' +
        '<p class="tpi-pz-hint">All ' + P.pages + ' page reads are kept. Try again repeats only this step.</p>';
      foot = cancel +
        '<button type="button" class="ix-btn ix-btn--secondary" data-pz-over="1">Start over</button>' +
        '<button type="button" class="ix-btn ix-btn--primary" data-pz-restitch="1">Try again</button>';
    }
    else if (P.phase === 'writing') {
      sub = 'Writing to SLATE';
      body = '<div class="tpi-pz-prog"><span class="tpi-pz-bar"><i></i></span>' +
        '<span class="tpi-pz-prog-t"></span></div>' +
        '<p class="tpi-pz-hint">The first row is written alone and checked before the rest go.</p>';
      foot = '';
    }
    else if (P.phase === 'done') {
      sub = 'Done';
      body = '<p><b>' + P.log.length + ' rows created</b> for ' + esc(P.issueName) +
        ', each checked against what Webflow stored.</p>' +
        '<p class="tpi-pz-hint">Reload the page to see the issue in the list.</p>';
      foot = '<button type="button" class="ix-revert" data-pz-close="1">Close</button>' +
        '<button type="button" class="ix-btn ix-btn--primary" data-pz-reload="1">Reload page</button>';
    }
    else if (P.phase === 'error') {
      sub = 'Stopped';
      var written = (P.log || []).filter(function (l) { return l.id; });
      body = '<div class="ix-modal-banner tpi-pz-warn">' + esc(P.error) + '</div>' +
        (written.length ? '<p class="tpi-pz-hint">These rows exist in SLATE and may need deleting ' +
          'in the Allocator: ' + written.map(function (l) { return esc(l.name) + ' (' + esc(l.id) + ')'; })
          .join('; ') + '.</p>' : '<p class="tpi-pz-hint">Nothing was written to SLATE.</p>');
      foot = '<button type="button" class="ix-revert" data-pz-close="1">Close</button>' +
        (P.items && P.items.length
          ? '<button type="button" class="ix-btn ix-btn--secondary" data-pz-back="1">Back to review</button>'
          : '<button type="button" class="ix-btn ix-btn--secondary" data-pz-over="1">Start over</button>');
    }

    /* v3.4.0 — keep the table where the operator left it. */
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
      if (P.phase === 'review') {
        var ch = P.issueName !== P.issueNameOrig;
        t.classList.toggle('ix-picker-input--changed', ch);
        var rv = t.parentNode.querySelector('[data-pz-rv]'); if (rv) rv.hidden = !ch;
      }
      return;
    }
    if (t.hasAttribute('data-pz-f')) {
      var it = P.items[+t.getAttribute('data-pz-i')], f = t.getAttribute('data-pz-f');
      it.cur[f] = t.value;
      var c = changed(it, f);
      t.classList.toggle('ix-picker-input--changed', c);
      var r = t.parentNode.querySelector('[data-pz-rv]'); if (r) r.hidden = !c;
      if (f === 'name') updateWriteBtn();
    }
  }

  function updateWriteBtn() {
    var b = pzEl() && pzEl().querySelector('[data-pz-write]'); if (!b) return;
    var n = P.items.filter(writable).length;
    b.disabled = !n; b.textContent = 'Create ' + n + ' row' + (n === 1 ? '' : 's');
  }

  function onPzChange(e) {
    var t = e.target;
    /* v3.3.1 — no renderPz() here. A redraw replaces the input and
       the browser shows it empty. Update the two dependents in place. */
    if (t.hasAttribute('data-pz-file')) {
      P.file = (t.files && t.files[0]) || null; P.dupe = 0; P.error = '';
      var m = pzEl();
      var rb = m && m.querySelector('[data-pz-read]');
      if (rb) rb.disabled = !P.file;
      var kept = m && m.querySelector('[data-pz-kept]');
      if (kept) kept.parentNode.removeChild(kept);
      var warn = m && m.querySelector('.tpi-pz-warn');
      if (warn) warn.parentNode.removeChild(warn);
      return;
    }
    /* v3.4.0 — ticks are handled on click (modifier keys) in
       onPzInc; nothing to do on change. */
  }

  /* v3.4.0 — one row's included state, applied in place. No redraw,
     so the table does not scroll. */
  function setInclude(i, on) {
    var it = P.items[i]; if (!it) return;
    it.include = on;
    var m = pzEl(); if (!m) return;
    var tr = m.querySelector('tr[data-pz-row="' + i + '"]'); if (!tr) return;
    tr.classList.toggle('tpi-pz-off', !on);
    var sub = m.querySelector('tr[data-pz-sub="' + i + '"]'); if (sub) sub.classList.toggle('tpi-pz-off', !on);
    var cb = tr.querySelector('[data-pz-inc]'); if (cb) cb.checked = on;
    Array.prototype.forEach.call(tr.querySelectorAll('input[data-pz-f], [data-pz-type]'),
      function (el) { el.disabled = !on; });
  }

  function syncAllBox() {
    var m = pzEl(); if (!m) return;
    Array.prototype.forEach.call(m.querySelectorAll('[data-pz-all]'), function (a) {
      a.checked = allOn(a.getAttribute('data-pz-all'));
    });
  }

  /* Plain click: toggle, anchor moves here. Shift: the range from the
     anchor to here takes this box's new state. Cmd/Ctrl: toggle this
     one only; the anchor stays. */
  function onPzInc(e) {
    var t = e.target;
    if (t.hasAttribute('data-pz-all')) {
      var sec = t.getAttribute('data-pz-all');
      for (var k = 0; k < P.items.length; k++) if (sectionOf(P.items[k]) === sec) setInclude(k, t.checked);
      P.anchor = null; updateWriteBtn(); refreshAdHeads(); return;
    }
    if (!t.hasAttribute('data-pz-inc')) return;
    var i = +t.getAttribute('data-pz-inc'), on = t.checked;
    var mySec = sectionOf(P.items[i]);
    if (e.shiftKey && P.anchor != null && P.anchor !== i && sectionOf(P.items[P.anchor]) === mySec) {
      var a = Math.min(P.anchor, i), b = Math.max(P.anchor, i);
      for (var j = a; j <= b; j++) if (sectionOf(P.items[j]) === mySec) setInclude(j, on);
    } else {
      setInclude(i, on);
    }
    if (!(e.metaKey || e.ctrlKey)) P.anchor = i;
    syncAllBox(); updateWriteBtn(); refreshAdHeads();
  }

  /* v3.5.1 — the "n ticked" count on the ad section heads, in place. */
  function refreshAdHeads() {
    var m = pzEl(); if (!m) return;
    Array.prototype.forEach.call(m.querySelectorAll('[data-pz-ads]'), function (b) {
      var sec = b.getAttribute('data-pz-ads');
      var on = P.items.filter(function (it) { return sectionOf(it) === sec && it.include; }).length;
      var d = b.parentNode.querySelector('.tpi-pz-x-dim');
      if (d) d.textContent = on + ' ticked \u00b7 kept on screen; written once SLATE has this type';
    });
  }

  function onPzClick(e) {
    if (e.target && (e.target.hasAttribute('data-pz-inc') || e.target.hasAttribute('data-pz-all'))) {
      onPzInc(e); return;
    }
    /* v3.5.0 — "Also create event" tick: in place, no redraw. */
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-pz-also')) {
      var ai = +e.target.getAttribute('data-pz-also'), ait = P.items[ai];
      ait.alsoEvent = e.target.checked;
      renderPz();
      return;
    }
    var t = e.target.closest && e.target.closest(
      '[data-pz-cancel],[data-pz-close],[data-pz-read],[data-pz-write],[data-pz-rv],' +
      '[data-pz-type],[data-pz-reload],[data-pz-back],[data-pz-retry],[data-pz-over],[data-pz-restitch],' +
      '[data-pz-xt],[data-pz-xretry],[data-pz-also-rv],[data-pz-ads],[data-pz-view]');
    if (!t) return;
    e.preventDefault();
    if (t.hasAttribute('data-pz-cancel') || t.hasAttribute('data-pz-close')) { closePz(); return; }
    if (t.hasAttribute('data-pz-read'))   { startRead(); return; }
    if (t.hasAttribute('data-pz-retry'))  { retryFailed(); return; }
    if (t.hasAttribute('data-pz-over'))   { startOver(); return; }
    if (t.hasAttribute('data-pz-restitch')) { stitchNow(P); return; }
    if (t.hasAttribute('data-pz-write'))  { startWrite(); return; }
    if (t.hasAttribute('data-pz-reload')) { location.reload(); return; }
    if (t.hasAttribute('data-pz-back'))   { P.phase = 'review'; P.error = ''; renderPz(); return; }
    if (t.hasAttribute('data-pz-xt')) {
      var xi = P.items[+t.getAttribute('data-pz-xt')]; xi.open = !xi.open; renderPz(); return;
    }
    if (t.hasAttribute('data-pz-xretry')) { retryRow(+t.getAttribute('data-pz-xretry')); return; }
    if (t.hasAttribute('data-pz-view')) { viewPages(+t.getAttribute('data-pz-view') || 1); return; }
    if (t.hasAttribute('data-pz-ads')) {
      P.adOpen = P.adOpen || {}; var s2 = t.getAttribute('data-pz-ads'); P.adOpen[s2] = !P.adOpen[s2];
      renderPz(); return;
    }
    if (t.hasAttribute('data-pz-also-rv')) {
      var ri = P.items[+t.getAttribute('data-pz-also-rv')]; ri.alsoEvent = ri.event === 'article'; renderPz(); return;
    }
    if (t.hasAttribute('data-pz-type')) {
      var a = t.getAttribute('data-pz-type').split(':');
      P.items[+a[0]].cur.type = a[1]; renderPz(); return;
    }
    if (t.hasAttribute('data-pz-rv')) {
      var k = t.getAttribute('data-pz-rv');
      if (k === 'issue') P.issueName = P.issueNameOrig;
      else { var b = k.split(':'); var it = P.items[+b[0]]; it.cur[b[1]] = it.orig[b[1]]; }
      renderPz();
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
              e.target.closest('[data-tpi-open],[data-tpi-back],[data-tpi-yr],[data-tpi-show],[data-tpi-up]');
      if (!t) return;
      e.preventDefault();
      if (t.hasAttribute('data-tpi-up')) { if (!t.disabled) openParse(t.getAttribute('data-tpi-up')); return; }
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
