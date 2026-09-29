/* ta-print-review-v1.5.1.js
   ════════════════════════════════════════════════════════════════
   INBXIFY T-A — PRINT ISSUE INTAKE REVIEW (its own surface)
   Companions: ta-print-review-v1.3.6.css   (this surface's layout; unchanged)
               ix-refresh-helper-v1.1.0.js  (page bus + write ledger; NEW)
               ix-info-v1.0.1.js            (the ⓘ badge; optional)
               ix-lightbox-v1.1.0.js        (page zoom; optional)
               ix-print-parse v1.2.0        (Worker: /draft, /extract)
               Scenario 103B v1.3.1         (SLATE writer)
   Load AFTER ix-tokens, ix-buttons, ix-form-controls, ix-refresh-helper
   and (if used) ix-info and ix-lightbox. Independent of ta-print-issues
   at load time; wired to it by ta-print-issues v3.6.0.

   ── v1.5.1 · A STOPPED SEND CONTINUES WHERE IT STOPPED (defect fix) ──
   Live 29 Sept: Send stopped on row 3 with rows 1 to 3 already
   written, and a second Send would have written them again, because
   the review did not remember what it had sent.
     · The draft records every row 103B created (sent: row id → ALLOCATIONS
       id) the moment it is confirmed, and saves at once.
     · Send only sends rows not yet sent. The commit bar and the
       button say so: "Send 14 more items to the Allocator · 3 already
       sent". A review with everything sent offers Finish.
     · A sent row's card says "Sent to the Allocator". Later edits to
       it here are not re-sent: edit it in the Allocator.
   Rows sent before v1.5.1 are not recorded; they are cleared once, by
   hand, in the Allocator.

   ── v1.5.0 · WHICH PLANNED ISSUE IS THIS? (ruled 29 Sept) ──
   A review started from the header Upload got a typed name
   ("AUGUST 1") that matched no planned issue, and nothing let the
   operator fix it. The name is written onto every row at Send and
   into every composed name, so it must be right before Send.
     · PLANNED ISSUE PICKER under the title: this title's planned
       issues (from ta-print-issues v3.9.0, IXPrintIssues.planOptions)
       plus "Not on the calendar…", which reveals a name field. Issues
       that already have a PDF or another review are listed but
       disabled, with the reason.
     · Editing rules (UX-002/003/004): the choice persists, carries
       the gold changed border while it differs from what the review
       started with, and a small Cancel link reverts it. It saves in
       the draft like every other edit.
     · Send is stopped, with the reason, while no issue is named.
     · Closing the review announces 'print-review:closed' on the page
       bus, so Print Issues moves the review into the right row at
       once.
   DRAFT FORMAT: gains issueNameOrig. Older drafts read their
   issueName as the original.

   ── v1.4.1 · NAMES THAT SHOW THE FAMILY (ruled 29 Sept) ──
   The Print Issues tab holds three surfaces, and each now says which
   one it is and that they belong together:
       Print Issues                     the list of issues
       Print Issue · Intake Review      THIS surface
       Print Issue · Allocator          Park, Assign, Not for NL
   "Board" is retired from all UI copy.
     · Header: a small PRINT ISSUE · INTAKE REVIEW eyebrow above the
       issue name. The issue name stays the title, first and flush
       left; "‹ Print Issues" stays small above the header.
     · Copy: items go to the ALLOCATOR. The button reads "Send N
       items to the Allocator"; the overlay, the done modal and the
       stopped modal say the same.
     · ⓘ title and blurb use the new names. The SLATE collection is
       called ALLOCATIONS in the CMS now; code names (SLATE fields,
       .slate-item, the 'slate' ledger topic, 103B's webhook) are
       contracts and do not change.
   Nothing else changes from v1.4.0.

   ── v1.4.0 · STEP B-0 · FINISH NO LONGER RELOADS THE PAGE ──
   Ruled 29 Sept. Six changes, one purpose each:
     · FINISH HANDS OFF, IT DOES NOT RELOAD. Every row 103B confirms
       is recorded in the ix-refresh ledger the moment it passes its
       check, and on Finish the review announces them on the page bus
       ('slate:written', 'print-review:finished'), closes, and gives
       the Print Issues tab back. The Allocator and the board redraw
       from what was written, not from a page that cannot have
       changed. HONEST FALLBACK: if nothing on the page is listening
       yet (emit returns 0, or ix-refresh-helper v1.1.0 is not loaded),
       Finish reloads, as v1.3.8 did, and says so in the done modal.
       The fallback retires by itself once ta-print-issues listens.
     · TYPE IS SENT AS THE LABEL. slateType() is deleted. 103B v1.3.1
       looks every label up in the SLATE schema, so Events page, RE
       page, Print ad and House ad are stored as themselves.
     · ADS GO TO THE BOARD. Print ad and House ad rows are written
       like any other row, with ad-size. They land in the board's
       "Front of book & other" group until board B-1 adds the ad
       sections. Events and listings still wait for step C.
     · EVERY ROW KNOWS ITS PAGE IN THE PDF. print-pdf-url (the stored
       PDF, one per issue) and pdf-page (the PDF page, not the
       printed folio) ride on every row, so the board's "View the
       magazine" can light and jump to the right page.
     · also-create-event is true when the row carries a ticked event
       and is not itself an events page.
     · NAMES SAY WHAT A ROW IS (ruled 29 Sept):
         {print issue} · p{page} · {type} · {section} › {title}
       section left out when empty or the same as the title. The
       printed title alone goes to the new SLATE field print-title,
       which the board reads for its Title column (board v0.6.51;
       until then the board shows the long name).
   TOAST-TRUTH: verifyRow() now also checks typeOk, print-pdf-url,
   pdf-page, ad-size and also-create-event against 103B v1.3.1's echo.
   ⓘ: the header carries IxInfo.badge() (standing rule, 29 Sept).

   ── v1.3.8 · THE LOOK DOT IS SALMON (ruled 29 Sept) ──
   Red, not gold: "needs a look" is the platform's needs-you-now
   accent, --ix-salmon, same family as the commit bar. The dot goes
   salmon (inline, cascade-proof) and the thumb's LOOK label goes
   salmon-ink (css v1.3.6). Gold stays on the next-look BUTTON,
   where gold means action.

   ── v1.3.7 · THE CHECKED WASH GOES INLINE (the ACTUAL P.1 fix) ──
   Console proved the image was there all along: the checked
   treatment's translucent green wash (.tpr-th-done, a full-cover
   overlay) was forced OPAQUE WHITE by the page's !important
   background wildcards — image under a tint became a white card.
   Same villain as the commit bar, third victim (the LOOK gold dot
   was the second — those "white dots"). Both treatments now carry
   their colors inline with !important, which no stylesheet can
   override. v1.3.6's serialized renders stay: correct regardless.

   ── v1.3.6 · ONE RENDER PER PAGE AT A TIME (the real P.1 fix) ──
   v1.3.5's retry assumed the racing render FAILS. It doesn't: the
   big view and the thumbnail share one pdf.js page object, and
   when one side's page.cleanup() lands mid-flight of the other's
   render, that render completes "successfully" as a white
   rectangle — cached as a valid JPEG, nothing to retry. So
   renderAt() now serializes per page number: a second render of
   the same page waits for the first to finish. The race cannot
   happen; cleanup() is safe again; the v1.3.5 retry stays as the
   belt to this suspender.

   ── v1.3.5 · A THUMBNAIL NEVER GIVES UP (defect fix, 28 Sept) ──
   Diagnosed live: on open, the big view and the thumbnail rail
   both render PAGE 1 at the same instant, and pdf.js refuses two
   simultaneous render tasks on one page — the thumbnail's throw
   was swallowed and the page stayed blank forever (seen twice,
   always P.1). fillThumb() now retries with backoff, up to three
   times, and an empty result is never cached. The page column's
   own error reporting still covers a PDF that truly cannot render.

   ── v1.3.4 · "FINISH" (ruled 28 Sept) ──
   The done modal's primary button says Finish — done-ness is the
   meaning, the reload is plumbing, and the hint line still says
   the reload happens. Same action underneath.

   ── v1.3.3 · SOFT SALMON (ruled 28 Sept, after the full pipeline
   ran end to end) ──
   The bar's band is the --ix-salmon-soft tint layered over cream —
   layered, because the bar is fixed and a bare 14% tint would let
   the page ghost through it. Teal text, a solid salmon accent line
   on top, see-them in salmon-ink. Everything else from v1.3.2
   (body-level, inline-important) is unchanged.
   KNOWN DEFECT (logged, not yet fixed): a page thumbnail can come
   up blank while its page renders fine (seen on P.1 after resume);
   fix is retry-and-never-cache-empty in the thumb renderer.

   ── v1.3.2 · THE COMMIT BAR LEAVES THE WRAPPER · SALMON ──
   v1.3.1's armor lost anyway: the page carries !important rules of
   its own inside .publisher-wrapper, and that is an arms race.
   The winning pattern is already proven on this page — ix-progress
   and the write overlay render clean because they live on <body>,
   OUTSIDE the wrapper the wildcards target. So:
     · The bar is a body-level element (#tpr-commit), created by
       rCommit(), removed by close(). It carries its own click
       listener, since it no longer lives under the root.
     · Its critical geometry and color are INLINE with
       style.setProperty(..., 'important'), which no stylesheet
       — !important or not — can override.
     · SALMON (ruled 28 Sept): the band is --ix-salmon, the
       platform's "needs you now" accent, differentiating it from
       the teal nav. Text and see-them in teal (4.16:1 — above the
       gold-button precedent), the Add button teal-on-salmon.

   ── v1.3.1 · THE COMMIT BAR IS FIXED AND CASCADE-PROOF ──
   First live look at v1.3.0: the page's own CSS overrode the
   bar's teal (white text on white — the promise line vanished),
   and position:sticky broke because a Webflow ancestor clips or
   scrolls. Known hazard class. So:
     · The bar is position:fixed to the viewport bottom, and
       placeCommit() pins its left edge and width to the review
       root's own box, so it never covers the nav rail. Re-pinned
       on resize; the root reserves its height so no card hides
       behind it.
     · Its colors carry !important, the same armor the other
       surfaces wear against the page background wildcards.

   ── v1.3.0 · ROLE-BASED PLACEMENT (Option D, ruled 28 Sept) ──
   Each element lives where its consequence lives:
     · TITLE FIRST, FLUSH LEFT, ALWAYS. "‹ Back to issues" sits
       small ABOVE the header, in the beige, never in the header's
       pole position. STANDING RULE (Jeff, 28 Sept): the thing the
       operator came to work on leads; navigation never does.
     · HEADER = identity only: title \u00b7 filename \u00b7 pages,
       draft-save state quietly at the right.
     · TOOLBAR on the content's edge: Pages|List (touching the
       content it switches), the reading progress and flags, the
       Show pills in List view, and "Next page that needs a look".
     · COMMIT BAR, sticky at the END of the path: a teal band with
       "N items go to the board — see them" and the gold Add
       button. The last act of the workflow no longer sits first.
       Same button, same soft gate, same overlay — just in the
       place a commit belongs.

   ── v1.2.1 · CUSTOMER SUGGESTS FROM THE CMS (ruled 28 Sept) ──
   The surface is the ISSUE REVIEW (IRP) — Jeff's name, 28 Sept.
   Every Customer input (the card field, the List cell, the bulk
   bar's Set customer) now suggests from the title's own CUSTOMERS:
   the hidden .customers-wrapper[data-item="true"] Webflow list the
   Asset Library and Client Manager already read. No Worker, no new
   endpoint, tenant-scoped by Webflow itself. Typing filters; click
   or \u2191\u2193 + Enter picks; Esc closes; FREE TEXT STILL COUNTS,
   because suggested-customer is a text field and a customer who is
   not in the CMS yet is a legitimate answer. Picking fires the
   normal input path, so the gold changed border and the draft
   autosave behave exactly as if the name had been typed.

   ── v1.2.0 · THE FIRST LIVE PASS (ruled 28 Sept) ──
     · Surface name: pending Jeff's ruling (Issue Review proposed).
     · OPENS AT THE TOP. open() and resume() scroll the window to
       the top: a surface that replaces the board must not inherit
       the board's scroll position.
     · HEADER STACKS LEFT: "‹ Back to issues" on its own line above
       the title; the filename · pages · save line under the title;
       all left-justified in their column.
     · PAGE 1 FIRST, ALWAYS. Fresh open and resume both land on
       page 1 with the thumbnail rail at the top. Predictability
       beats cleverness: "Next page that needs a look" and the
       checked ticks carry the where-to-go job. (Resume still keeps
       every edit, check and the Pages/List view — just not the
       page position.)
     · ACTIVE CARD IS MARKED. Clicking into or focusing a found-on-
       page card gives it the gold ring, and the current page's
       thumbnail wears the same ring, so the card and its page read
       as a pair. Highlighting the item's REGION on the thumbnail
       needs bounding boxes the stitch does not return; noted for a
       later Worker version, not faked here.
     · Segmented Pages|List radius fixed in the CSS: the active
       fill now matches the track.

   ── v1.1.0 · ONE HEADER, ONE PROMISE, ONE PROGRESS ──
   Ruled 28 Sept, after the first live run:
     · The four scattered status lines collapse to three, each with
       one job. Line 1 says WHERE YOU ARE: back link, issue name,
       filename · pages, and the draft-save state. The decorative
       "› this title › Review" crumb is deleted. Line 2 says WHAT
       WILL HAPPEN, as one visual group with the button: "N items go
       to the board — 6 articles · 8 events pages · see them", where
       "see them" opens the List view filtered to those items. The
       events/ads footnote stays under it, quiet. Line 3 is YOUR
       READING PROGRESS — the bar, "Checked N of M pages" and the
       flagged count — and it moves down beside "Next page that
       needs a look", where checking actually happens. The census
       line it replaces is deleted: line 2 already carries the half
       that goes to the board and the footnote carries the rest.
     · THE BUTTON SAYS WHERE THINGS GO: "Add N items to the board",
       not "Create N rows". N is the kept (included, non-ad) items —
       Exclude moves the number, checking never does. The write
       overlay speaks the same language throughout.
     · SOFT GATE (ruling C): pressing Add with unchecked pages asks
       first — "You've checked X of M pages — add N items to the
       board anyway?" — and "Add them anyway" proceeds. All pages
       checked skips the question. Checking gates nothing else: it
       is the operator's read-through, not a lock.

   ── v1.0.0 · THE REVIEW IS ITS OWN SURFACE ──
   Ruled 27 Sept: the review leaves the upload modal and opens in
   place of the issue board inside the Print Issues tab, with
   "‹ Back to issues" at the top. The modal only uploads and reads.
   Design of record: the accepted review mockup (27 Sept), expressed
   in ix primitives.

   WHAT THIS SURFACE DOES
     · PAGES view: page thumbnails (rendered lazily from the PDF),
       the page itself (‹ › or arrow keys, click to zoom in the
       ix-lightbox), and a card for everything found on that page.
     · Checked pages are unmistakable: green wash and a tick on the
       thumbnail, a green banner on the page. "Mark page N checked"
       moves to the next unchecked page; checking is undoable.
     · No filter pills in Pages view. One button: "Next page that
       needs a look" — a page with a low-confidence row or a flagged
       item, not yet checked.
     · LIST view: every row in one table, Show: All · Articles · Ads,
       selection with Shift-click (range) and Cmd/Ctrl-click, and a
       bulk bar: Join into one article · Exclude · Set type ·
       Set customer.
     · EDITING follows the standing rules: every edited field keeps
       its value, takes the --changed gold border, and shows a small
       undo link that restores the parse's reading. A structural
       change (type, join, exclude, added row) turns the whole card
       border gold with its own cancel link.
     · JOIN is offered on a card only where the parser saw evidence
       (row.continues, from Worker v1.3.0's stitch), with the reasons
       shown. Until that Worker ships, rows carry no evidence and the
       manual join in the List view covers it.
     · Each found event or listing has a tick and a WILL column:
       New event / New listing when ticked, Skip when not. Update
       joins WILL at build step C, when the duplicate check lands.
     · "Something missing? Add an item on this page" adds an
       editable row.
     · DRAFTS: every change autosaves to the ix-print-parse Worker
       (/draft, Cloudflare KV) after a short pause, and again when
       the tab is hidden or the review closes. The header shows
       "Draft saved 2:14 pm". A resumed review looks exactly as it
       was left, pending borders included. If a newer copy was saved
       elsewhere, a banner offers to load it or keep this one;
       nothing is overwritten silently.
     · CREATE writes the rows through Scenario 103B v1.3.1: cover-url
       from the handoff, first row alone and checked (TOAST-TRUTH),
       then the rest one by one, visible progress throughout. Articles,
       other, events pages, RE pages, print ads and house ads all go.
       On success the draft is deleted and Finish hands the rows to
       the page (v1.4.0). Individual events and listings are NOT
       written yet — they wait for step C — and the button says only
       what it does: "Add N items to the board".

   DEVIATIONS FROM THE MOCKUP (deliberate)
     · "Create the article ›" is omitted: it is build step D, and a
       control that looks ready and does nothing is worse than one
       that is absent. Its photo line goes with it.
     · The items sub-line says the ticks are kept for a later build
       step, because this version's Create does not write them.

   API — ta-print-issues v3.6.0 calls:
     IXPrintReview.open({
       key,                 draft key; built here if absent
       issueName, source, pages, taId,
       pdfUrl,              stored PDF (Uploadcare), for resume
       coverUrl,            stored cover, written to SLATE rows
       folio,               { pdfPage: printedPageNumber }
       phases,              { labels: [..], why: '' }  (ix-asset-list)
       items,               run.items in the v3.5.2 shape
       pdf                  live pdf.js document proxy (optional)
     })
     IXPrintReview.resume(key)   → Promise<boolean>
     IXPrintReview.close()
     IXPrintReview.isOpen()

   DRAFT FORMAT v1 (owned by this file; the Worker stores it whole
   and reads only issueName, source, pages, checkedPages for the
   /drafts listing):
     { v:1, issueName, source, pages, taId, pdfUrl, coverUrl,
       folio, phases, view, page, show,
       checkedPages:[..], merged:{absorbedId:absorberId},
       rows:[..] }

   CONFIG (TA_CONFIG; no tenant value lives in this file):
     printParseWorker   the ix-print-parse Worker base URL
     makeSlateWriter    Scenario 103B webhook (Create)
     taItemId           this title's TITLES-ADMIN id
     titleName          shown in the breadcrumb and sent to /extract
     pdfjsUrl           optional pdf.js override

   HARDCODED (logged):
     · HC-TPI-PDFJS — the pdf.js 3.11.174 cdnjs URL. Platform
       library pin, shared with ta-print-issues; the same
       TA_CONFIG.pdfjsUrl overrides both.
     · HC-P-AL-1 — "Sold" is the phase that hides price by default.
       Platform rule (26 Sept). Here it only labels the review.
     · Name composition (v1.4.0) uses the separators " · " and
       " › ". Display grammar, not tenant data.

   FAIL-SAFE. No pane, no config, no PDF: the surface renders what
   it can and says what it cannot. A missing lightbox costs zoom,
   not the review. A failed draft save is shown, never silent.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var VERSION = '1.5.1';
  var TAG = '[print-review v' + VERSION + ']';

  var PDFJS_DEFAULT = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  var JPEG_QUALITY  = 0.85;
  var THUMB_W       = 176;    /* 88px slot, 2x for sharpness */
  var BIG_W         = 1040;   /* page column, 2x */
  var ZOOM_W        = 1400;   /* lightbox, matches the parser's read */
  var BIG_CACHE_MAX  = 8;
  var ZOOM_CACHE_MAX = 12;
  var SAVE_DEBOUNCE_MS   = 1200;
  var EXTRACT_TIMEOUT_MS = 4 * 60 * 1000;
  var EXTRACT_RETRIES    = 1;

  /* HC-P-AL-1 — platform rule: these phase labels hide price by
     default. Display code never decides from the phase; this only
     labels the review ("price hidden (Sold)"). */
  var HIDE_PRICE_PHASES = ['sold'];

  var TYPE_OPTS = [
    { v: 'article',     l: 'Article' },
    { v: 'other',       l: 'Other' },
    { v: 'events-page', l: 'Events page' },
    { v: 're-page',     l: 'RE page' }
  ];
  var AD_TYPE_OPTS = [
    { v: 'print-ad', l: 'Print ad' },
    { v: 'house-ad', l: 'House ad' }
  ];
  var TYPE_LABEL = { 'article': 'Article', 'other': 'Other', 'events-page': 'Events page',
                     're-page': 'RE page', 'print-ad': 'Print ad', 'house-ad': 'House ad' };
  var AD_SIZE_LABEL = { full: 'Full page', half: 'Half', third: 'Third', quarter: 'Quarter',
                        eighth: 'Eighth', strip: 'Strip' };

  // ══════════════════════════════════════════════════════════
  // CONFIG + SMALL HELPERS
  // ══════════════════════════════════════════════════════════

  function cfg() { return window.TA_CONFIG || {}; }

  function titleAdminId() {
    var el = document.querySelector('.ta-item');
    if (!el) return '';
    return (el.getAttribute('data-title-id') ||
            el.getAttribute('title-admin-id') ||
            el.getAttribute('data-title-admin-id') || '').trim();
  }
  function taId() { return String(cfg().taItemId || titleAdminId() || '').trim(); }

  function workerBase() { return String(cfg().printParseWorker || '').replace(/\/+$/, ''); }
  function slateWriter() { return String(cfg().makeSlateWriter || '').trim(); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function slugify(s) {
    return String(s || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function yes(v) { return v === true || v === 'true'; }

  /* The Worker's key rule: 24-hex title id, colon, then up to 175
     chars of [A-Za-z0-9:_.-]. Everything else becomes a dash. */
  function draftKeyFor(tid, source) {
    var tail = String(source || 'issue').replace(/[^A-Za-z0-9:_.\-]+/g, '-').slice(0, 170);
    return tid + ':' + (tail || 'issue');
  }

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
      if (ps.length) {
        var sameMonth = ps.every(function (p) { return p.mo === ps[0].mo; });
        dates = ps[0].dow + ' ' + MON[ps[0].mo] + ' ' + ps.map(function (p, i) {
          return (i && !sameMonth ? MON[p.mo] + ' ' : '') + p.d;
        }).join(', ');
      }
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
    var n = Number(v); return v === '' || v == null || isNaN(n) ? '' : '$' + n.toLocaleString('en-US');
  }
  function fmtClock(iso) {
    var d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) return '';
    var h = d.getHours(), ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
    return h + ':' + ('0' + d.getMinutes()).slice(-2) + ' ' + ap;
  }
  function issueYear() {
    var m = String(R.issueName || '').match(/\b(19|20)\d\d\b/) ||
            String(R.source || '').match(/\b(19|20)\d\d\b/);
    return m ? Number(m[0]) : new Date().getFullYear();
  }
  function printedFolio(n) {
    var f = R.folio && R.folio[n];
    return f != null && f !== '' ? f : n;
  }

  // ══════════════════════════════════════════════════════════
  // STATE. One review at a time.
  // ══════════════════════════════════════════════════════════

  var R = { active: false };

  function freshState() {
    R = {
      active: false, root: R.root || null, pane: R.pane || null,
      key: '', rev: 0, savedAt: '', saving: false, saveWhy: '',
      dirty: false, saveTimer: null, conflict: null,
      issueName: '', issueNameOrig: '', issueOff: false, source: '', pages: 0, taId: '',
      pdfUrl: '', coverUrl: '', folio: {}, phases: { labels: [], why: '' },
      view: 'pages', page: 1, show: 'all',
      checked: {}, merged: {}, rows: [], sent: {},
      sel: {}, anchor: null, menu: null,
      pdf: null, pdfP: null, pdfWhy: '',
      thumbCache: {}, bigCache: { order: [], map: {} }, zoomCache: { order: [], map: {} },
      io: null, hid: [], W: null
    };
  }
  freshState();

  /* A run item in the v3.5.2 shape becomes a review row. Everything
     the operator can change lives in cur; orig is the parse's
     reading and what every undo restores. */
  function rowFromItem(it, i) {
    var pg = (it.pdfPages && it.pdfPages.length ? it.pdfPages : [it.pdfPage]).map(Number).filter(Boolean);
    if (!pg.length && it.page) pg = [Number(it.page) || 0];
    var orig = it.orig || { name: it.name || '', section: it.section || '', byline: it.byline || '',
                            customer: it.customer || '', type: it.type || 'other' };
    var cur = it.cur ? { name: it.cur.name, section: it.cur.section, byline: it.cur.byline,
                         customer: it.cur.customer, type: it.cur.type }
                     : { name: orig.name, section: orig.section, byline: orig.byline,
                         customer: orig.customer, type: orig.type };
    var found = null;
    if (it.found) {
      found = { items: [], errors: (it.found.errors || []).slice(), defaults: it.found.defaults || null };
      (it.found.items || []).forEach(function (x0) {
        var x = {}; for (var k in x0) if (Object.prototype.hasOwnProperty.call(x0, k)) x[k] = x0[k];
        if (typeof x.on !== 'boolean') {
          /* An event announced by an ad is promotion, not community
             news: unticked by default (spec 3A). Everything else,
             listings in ads included, starts ticked. */
          x.on = !(x._k === 'event' && it.event === 'ad');
        }
        found.items.push(x);
      });
    }
    return {
      id: String(it.slug || it.id || ('r' + i)),
      pg: pg, page: Number(it.page) || pg[0] || 0,
      orig: orig, cur: cur,
      images: Number(it.images != null ? it.images : it.imageCount) || 0,
      conf: it.conf || it.confidence || 'high', note: it.note || '',
      event: it.event || 'none', listings: it.listings || 'none',
      adSize: it.adSize || '', slug: it.slug || '',
      itemCount: Number(it.itemCount) || 0,
      found: found,
      continues: it.continues && it.continues.prevId
        ? { prevId: String(it.continues.prevId), why: String(it.continues.why || '') } : null,
      excluded: it.excluded === true || it.include === false,
      addedBy: it.addedBy || ''
    };
  }

  function stateFromHandoff(h) {
    freshState();
    R.issueName = String(h.issueName || '').trim();
    R.issueNameOrig = R.issueName;
    R.source    = String(h.source || '').trim();
    R.pages     = Number(h.pages) || 0;
    R.taId      = String(h.taId || taId());
    R.pdfUrl    = String(h.pdfUrl || '');
    R.coverUrl  = String(h.coverUrl || '');
    R.folio     = h.folio || {};
    R.phases    = h.phases || { labels: [], why: '' };
    R.key       = String(h.key || draftKeyFor(R.taId, R.source));
    R.rows      = (h.items || []).map(rowFromItem);
    R.page      = 1;   /* v1.2.0 ruling: page 1 first, always */
    if (h.pdf) R.pdf = h.pdf;
  }

  function stateFromDraft(key, d, rev, savedAt) {
    freshState();
    R.key = key; R.rev = rev || 0; R.savedAt = savedAt || '';
    R.issueName = d.issueName || ''; R.source = d.source || '';
    R.issueNameOrig = d.issueNameOrig != null ? d.issueNameOrig : R.issueName;
    R.pages = Number(d.pages) || 0; R.taId = d.taId || taId();
    R.pdfUrl = d.pdfUrl || ''; R.coverUrl = d.coverUrl || '';
    R.folio = d.folio || {}; R.phases = d.phases || { labels: [], why: '' };
    R.view = d.view === 'list' ? 'list' : 'pages';
    R.page = 1;        /* v1.2.0 ruling: resume keeps edits and view, not position */
    R.show = d.show || 'all';
    (d.checkedPages || []).forEach(function (p) { R.checked[p] = true; });
    R.merged = d.merged || {};
    R.sent = d.sent || {};               /* v1.5.1 */
    R.rows = (d.rows || []).map(rowFromItem);
  }

  function draftBody() {
    return {
      v: 1,
      issueName: R.issueName, issueNameOrig: R.issueNameOrig,
      source: R.source, pages: R.pages, taId: R.taId,
      pdfUrl: R.pdfUrl, coverUrl: R.coverUrl,
      folio: R.folio, phases: R.phases,
      view: R.view, page: R.page, show: R.show,
      checkedPages: Object.keys(R.checked).map(Number).filter(function (p) { return R.checked[p]; }).sort(function (a, b) { return a - b; }),
      merged: R.merged,
      sent: R.sent,
      rows: R.rows
    };
  }

  // ══════════════════════════════════════════════════════════
  // DERIVED. effRows() applies joins; nothing mutates a row for a
  // join, so cancel is a delete in R.merged.
  // ══════════════════════════════════════════════════════════

  function isAdType(t) { return t === 'print-ad' || t === 'house-ad'; }
  function isAdRow(r) { return isAdType(r.cur.type); }
  function rowById(id) {
    for (var i = 0; i < R.rows.length; i++) if (R.rows[i].id === id) return R.rows[i];
    return null;
  }

  function effRows() {
    var out = [];
    R.rows.forEach(function (r) {
      if (R.merged[r.id]) return;                 /* absorbed into another row */
      var pg = r.pg.slice(), img = r.images, from = '';
      Object.keys(R.merged).forEach(function (mid) {
        if (R.merged[mid] !== r.id) return;
        var m = rowById(mid); if (!m) return;
        pg = pg.concat(m.pg); img += m.images; from = mid;
      });
      pg = pg.filter(function (v, i, a) { return v && a.indexOf(v) === i; })
             .sort(function (a, b) { return a - b; });
      out.push({ r: r, pg: pg, img: img, joinedFrom: from,
                 span: pg.length > 1 ? pg[0] + '\u2013' + pg[pg.length - 1] : String(pg[0] || '\u2013') });
    });
    out.sort(function (a, b) {
      return (a.pg[0] || 0) - (b.pg[0] || 0) || (isAdRow(a.r) ? 1 : 0) - (isAdRow(b.r) ? 1 : 0);
    });
    return out;
  }

  function lookRow(r) {
    if (r.excluded) return false;
    if (r.conf && r.conf !== 'high') return true;
    return !!(r.found && r.found.items.some(function (x) { return x.check; }));
  }
  function lookPages() {
    var eff = effRows(), out = [];
    for (var p = 1; p <= R.pages; p++) {
      if (R.checked[p]) continue;
      var hit = eff.some(function (e) { return e.pg[0] === p && lookRow(e.r); });
      if (hit) out.push(p);
    }
    return out;
  }
  function firstUnchecked() {
    for (var p = 1; p <= R.pages; p++) if (!R.checked[p]) return p;
    return 0;
  }
  function nextUnchecked(from) {
    for (var p = from + 1; p <= R.pages; p++) if (!R.checked[p]) return p;
    for (var q = 1; q <= from; q++) if (!R.checked[q]) return q;
    return 0;
  }
  function checkedCount() {
    var n = 0; for (var p = 1; p <= R.pages; p++) if (R.checked[p]) n++;
    return n;
  }

  function structChanged(e) {
    var r = e.r;
    return r.excluded || !!e.joinedFrom || r.addedBy === 'user' || r.cur.type !== r.orig.type;
  }
  function fieldChanged(r, f) { return r.cur[f] !== r.orig[f]; }

  /* v1.4.0 — ads are writable (103B v1.3.1 knows print-ad and
     house-ad). Only excluded and nameless rows stay behind. */
  function writableEff() {
    return effRows().filter(function (e) {
      return !e.r.excluded && String(e.r.cur.name || '').trim() && !R.sent[e.r.id];
    });
  }
  /* v1.5.1 — rows already created in ALLOCATIONS by this review */
  function sentCount() { return Object.keys(R.sent || {}).length; }
  /* v1.4.0 — only what still waits for step C: individual events
     and listings. Ads now go to the board with everything else. */
  function itemTallies() {
    var ev = 0, re = 0;
    effRows().forEach(function (e) {
      if (e.r.excluded) return;
      (e.r.found ? e.r.found.items : []).forEach(function (x) {
        if (!x.on) return;
        if (x._k === 're') re++; else ev++;
      });
    });
    return { ev: ev, re: re };
  }

  // ══════════════════════════════════════════════════════════
  // pdf.js — same platform pin as ta-print-issues (HC-TPI-PDFJS);
  // TA_CONFIG.pdfjsUrl overrides both. Loaded only when needed.
  // ══════════════════════════════════════════════════════════

  var pdfjsP = null;
  function loadPdfjs() {
    if (window.pdfjsLib && window.pdfjsLib.getDocument) return Promise.resolve(window.pdfjsLib);
    if (pdfjsP) return pdfjsP;
    var src = cfg().pdfjsUrl || PDFJS_DEFAULT;
    pdfjsP = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () {
        var L = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
        if (!L || !L.getDocument) { pdfjsP = null; rej(new Error('pdf.js loaded but exposed nothing')); return; }
        if (L.GlobalWorkerOptions) L.GlobalWorkerOptions.workerSrc = src.replace(/pdf\.min\.js$/, 'pdf.worker.min.js');
        window.pdfjsLib = L;
        res(L);
      };
      s.onerror = function () { pdfjsP = null; rej(new Error('pdf.js failed to load from ' + src)); };
      document.head.appendChild(s);
    });
    return pdfjsP;
  }

  /* One promise per open. A missing PDF is a stated condition, not
     an error loop: pdfWhy says so and the Pages view shows it. */
  function ensurePdf() {
    if (R.pdf) return Promise.resolve(R.pdf);
    if (R.pdfP) return R.pdfP;
    if (!R.pdfUrl) {
      R.pdfWhy = 'The PDF for this issue is not stored, so pages cannot be shown. Everything is still in the List view.';
      return Promise.reject(new Error(R.pdfWhy));
    }
    var mine = R;
    R.pdfP = fetch(R.pdfUrl)
      .then(function (r) {
        if (!r.ok) throw new Error('the stored PDF returned HTTP ' + r.status);
        return r.arrayBuffer();
      })
      .then(function (buf) { return loadPdfjs().then(function (L) { return L.getDocument({ data: buf }).promise; }); })
      .then(function (doc) {
        if (R !== mine || !R.active) { try { doc.destroy(); } catch (x) {} throw new Error('closed'); }
        R.pdf = doc;
        if (!R.pages) R.pages = doc.numPages;
        return doc;
      })
      .catch(function (e) {
        if (R === mine) { R.pdfWhy = String(e.message || e); R.pdfP = null; }
        throw e;
      });
    return R.pdfP;
  }

  var pageQ = {};   /* v1.3.6 — per-page render queues */
  function renderAt(n, w) {
    var run = function () { return renderNow(n, w); };
    var prev = pageQ[n] || Promise.resolve();
    var p = prev.then(run, run);
    pageQ[n] = p.catch(function () {});   /* settled chain, never poisons */
    return p;
  }
  function renderNow(n, w) {
    return ensurePdf().then(function (pdf) {
      return pdf.getPage(n).then(function (page) {
        var v1 = page.getViewport({ scale: 1 });
        var vp = page.getViewport({ scale: w / v1.width });
        var cv = document.createElement('canvas');
        cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
        return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
          var url = cv.toDataURL('image/jpeg', JPEG_QUALITY);
          page.cleanup(); cv.width = 0; cv.height = 0;
          return url;
        });
      });
    });
  }

  function cached(cache, max, n, w) {
    if (cache.map[n]) return cache.map[n];
    var p = renderAt(n, w);
    p.catch(function () { delete cache.map[n]; });
    cache.map[n] = p; cache.order.push(n);
    while (cache.order.length > max) delete cache.map[cache.order.shift()];
    return p;
  }

  function zoomPages(start) {
    if (!(window.InbxLightbox && window.InbxLightbox.openPages)) return;
    window.InbxLightbox.openPages({
      count: R.pages,
      start: start || R.page || 1,
      getSrc: function (n) { return cached(R.zoomCache, ZOOM_CACHE_MAX, n, ZOOM_W); },
      caption: function (n) {
        var f = printedFolio(n);
        return (R.issueName ? R.issueName + ' \u00b7 ' : '') + 'PDF page ' + n + ' of ' + R.pages +
          (String(f) !== String(n) ? ' \u00b7 printed page ' + f : '');
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // DRAFTS — /draft on the ix-print-parse Worker. Debounced saves;
  // a 409 is a conflict banner, never a silent overwrite.
  // ══════════════════════════════════════════════════════════

  function markDirty() {
    R.dirty = true;
    if (R.saveTimer) clearTimeout(R.saveTimer);
    R.saveTimer = setTimeout(function () { saveDraft(false); }, SAVE_DEBOUNCE_MS);
    uSave('dirty');
  }

  function saveDraft(flush) {
    if (!R.active || !R.dirty || R.saving || R.conflict) return Promise.resolve();
    var base = workerBase();
    if (!base) { R.saveWhy = 'TA_CONFIG.printParseWorker is not set'; uSave('fail'); return Promise.resolve(); }
    R.saving = true; R.dirty = false; uSave('saving');
    var mine = R;
    return fetch(base + '/draft', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      keepalive: !!flush,
      body: JSON.stringify({ key: R.key, rev: R.rev, draft: draftBody() })
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) { return { s: r.status, j: j }; });
    }).then(function (x) {
      if (R !== mine || !R.active) return;
      R.saving = false;
      if (x.s === 409 && x.j) {
        R.conflict = { rev: Number(x.j.rev) || 0, draft: x.j.draft || null };
        uConflict(); uSave('fail'); R.saveWhy = 'a newer copy exists'; return;
      }
      if (!x.j || x.j.ok !== true) {
        R.dirty = true; R.saveWhy = (x.j && x.j.reason) || ('HTTP ' + x.s);
        uSave('fail'); return;
      }
      R.rev = Number(x.j.rev) || R.rev + 1;
      R.savedAt = x.j.savedAt || new Date().toISOString();
      R.saveWhy = '';
      uSave('saved');
      if (R.dirty) markDirty();   /* edits landed while saving */
    }).catch(function (e) {
      if (R !== mine || !R.active) return;
      R.saving = false; R.dirty = true; R.saveWhy = String(e.message || e);
      uSave('fail');
    });
  }

  function flushSave() {
    if (R.saveTimer) { clearTimeout(R.saveTimer); R.saveTimer = null; }
    return saveDraft(true);
  }

  function deleteDraft() {
    var base = workerBase();
    if (!base || !R.key) return Promise.resolve();
    return fetch(base + '/draft?key=' + encodeURIComponent(R.key), { method: 'DELETE' })
      .then(function (r) { return r.json().catch(function () { return null; }); })
      .catch(function () { return null; });
  }

  function loadDraft(key) {
    var base = workerBase();
    if (!base) return Promise.reject(new Error('TA_CONFIG.printParseWorker is not set'));
    return fetch(base + '/draft?key=' + encodeURIComponent(key))
      .then(function (r) { return r.json().catch(function () { throw new Error('/draft returned no JSON'); }); })
      .then(function (j) {
        if (!j || j.ok !== true) throw new Error((j && j.reason) || '/draft failed');
        return j;   /* { draft, rev, savedAt } */
      });
  }

  // ══════════════════════════════════════════════════════════
  // /extract — Try again for one row, from the review. Same call
  // shape as ta-print-issues v3.5.2.
  // ══════════════════════════════════════════════════════════

  function jobsFor(r) {
    var t = r.orig.type;
    if (t === 'events-page') return r.pg.map(function (n) { return { kind: 'events', pdfPage: n }; });
    if (t === 're-page')     return r.pg.map(function (n) { return { kind: 're', pdfPage: n }; });
    var jobs = [];
    if (r.event !== 'none' && r.pg[0]) {
      jobs.push({ kind: 'event-in-block', pdfPage: r.pg[0], blockName: r.orig.name, blockKind: r.event });
    }
    if (r.listings === 'ad' && r.pg[0]) {
      jobs.push({ kind: 're-in-block', pdfPage: r.pg[0], blockName: r.orig.name });
    }
    return jobs;
  }
  function jobIsRe(job) { return job.kind === 're' || job.kind === 're-in-block'; }

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

  function extractOne(job, tries) {
    return renderAt(job.pdfPage, ZOOM_W).then(function (dataUrl) {
      var b64 = dataUrl.split(',')[1];
      var ctl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); }, EXTRACT_TIMEOUT_MS);
      var body = {
        kind: job.kind, pdfPage: job.pdfPage, mediaType: 'image/jpeg', image: b64,
        titleName: cfg().titleName || '', issueName: R.issueName, issueYear: issueYear()
      };
      if (job.kind === 'event-in-block') { body.blockName = job.blockName; body.blockKind = job.blockKind; }
      if (job.kind === 're-in-block') body.blockName = job.blockName;
      if (jobIsRe(job)) body.phases = (R.phases && R.phases.labels) || [];
      return postWorker('/extract', body, ctl ? ctl.signal : undefined)
        .then(function (j) { clearTimeout(timer); return j; },
              function (e) {
                clearTimeout(timer);
                if (e && e.name === 'AbortError') throw new Error('no answer after ' + (EXTRACT_TIMEOUT_MS / 60000) + ' minutes');
                throw e;
              });
    }).catch(function (e) {
      if (tries <= 0) throw e;
      return extractOne(job, tries - 1);
    });
  }

  function retryRow(id) {
    var r = rowById(id);
    if (!r || (r.found && r.found.busy)) return;
    var wasAd = r.event === 'ad';
    r.found = { items: [], errors: [], defaults: null, busy: true };
    rCards(); rList();
    var jobs = jobsFor(r), mine = R;
    jobs.reduce(function (chain, job) {
      return chain.then(function () {
        if (R !== mine || !R.active) return;
        return extractOne(job, EXTRACT_RETRIES).then(function (j) {
          (j.items || []).forEach(function (x) {
            x.pdfPage = job.pdfPage; x._k = jobIsRe(job) ? 're' : 'event';
            x.on = !(x._k === 'event' && wasAd);
            r.found.items.push(x);
          });
          if (j.pageDefaults && !r.found.defaults) r.found.defaults = j.pageDefaults;
        }, function (e) {
          r.found.errors.push({ pdfPage: job.pdfPage, why: String(e.message || e) });
        });
      });
    }, Promise.resolve()).then(function () {
      if (R !== mine || !R.active) return;
      r.found.busy = false;
      markDirty();
      rCards(); rList(); rHead(); rSub();
    });
  }

  // ══════════════════════════════════════════════════════════
  // RENDERING. A fixed skeleton, regions re-rendered on their own,
  // scroll positions kept — a click never sends a pane to the top.
  // ══════════════════════════════════════════════════════════

  function el(sel) { return R.root ? R.root.querySelector(sel) : null; }

  function skeleton() {
    R.root.innerHTML =
      '<div class="tpr-backrow">' +
        '<button type="button" class="ix-revert" data-tr-back>\u2039 Print Issues</button>' +
      '</div>' +
      '<div class="tpr-head" data-tr-head></div>' +
      '<div class="tpr-conflict" data-tr-conflict hidden></div>' +
      '<div class="tpr-sub" data-tr-sub></div>' +
      '<div class="tpr-body" data-tr-pages>' +
        '<div class="tpr-thumbs scroll"><div class="tpr-thumbs-grid" data-tr-thumbs></div></div>' +
        '<div class="tpr-page scroll" data-tr-page></div>' +
        '<div class="tpr-cards scroll" data-tr-cards></div>' +
      '</div>' +
      '<div class="tpr-body tpr-list" data-tr-list hidden></div>';
  }

  function rAll() {
    rHead(); uConflict(); rSub(); rView();
    rThumbs(); rPage(); rCards(); rList();
  }

  function rView() {
    var pv = el('[data-tr-pages]'), lv = el('[data-tr-list]');
    if (pv) pv.hidden = R.view !== 'pages';
    if (lv) lv.hidden = R.view !== 'list';
  }

  function rHead() {
    var h = el('[data-tr-head]'); if (!h) return;
    /* v1.3.0 — identity only. Title first, flush left, ALWAYS
       (standing rule): Back sits above the header, never here. */
    h.innerHTML =
      /* v1.4.1 — the eyebrow names the surface and its family; the
         issue name stays the title. Color inline-important: this
         renders inside .publisher-wrapper (cascade law). */
      '<div style="display:flex;flex-direction:column;gap:2px;min-width:0">' +
        '<span class="tpr-eyebrow" style="font-size:11px;font-weight:700;letter-spacing:.12em;' +
          'text-transform:uppercase;line-height:1.2;color:var(--ix-gold-ink, #8A6E2E) !important">' +
          'Print Issue \u00b7 Intake Review</span>' +
        '<h1 class="tpr-title">' + esc(R.issueName || 'Which issue is this?') + '</h1>' +
        issuePickerHtml() +
      '</div>' +
      '<div class="tpr-meta">' + esc(R.source) + ' \u00b7 ' + R.pages + ' pages</div>' +
      '<span class="tpr-head-sp"></span>' +
      '<span class="tpr-meta"><span data-tr-save></span></span>' +
      infoBadge();
    uSave();
    rCommit();
  }

  // ── v1.5.0 · Planned issue picker ─────────────────────────
  function planOpts() {
    var P = window.IXPrintIssues;
    if (!(P && P.planOptions)) return null;
    try { return P.planOptions(R.key) || []; } catch (e) { return null; }
  }
  function normName(s) { return String(s || '').toLowerCase().replace(/[\s.,]/g, ''); }
  function issueChanged() { return String(R.issueName || '') !== String(R.issueNameOrig || ''); }
  function issueIsPlanned(opts) {
    var n = normName(R.issueName);
    return !!n && (opts || []).some(function (o) { return normName(o.label) === n; });
  }

  /* Changed state carries its gold inline-important: this renders
     inside .publisher-wrapper (cascade law). */
  var CHANGED_STYLE = 'border:2px solid var(--ix-gold, #C4A35A) !important;' +
                      'box-shadow:0 0 0 3px var(--ix-gold-glow, rgba(196,163,90,.12)) !important';

  function issuePickerHtml() {
    var opts = planOpts();
    var ch = issueChanged();
    var st = ch ? ' style="' + CHANGED_STYLE + '"' : '';
    var cls = 'ix-picker-input' + (ch ? ' ix-picker-input--changed' : '');
    var cancel = '<button type="button" class="ix-revert" data-tr-issue-cancel' + (ch ? '' : ' hidden') + '>Cancel</button>';
    var row = '<span class="tpr-issuepick" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px">' +
      '<span class="tpr-meta">Planned issue</span>';
    if (!opts) {
      /* No list on the page: the name field alone, same rules. */
      return row + '<input class="' + cls + '" data-tr-issuename value="' + esc(R.issueName) + '"' +
        ' placeholder="Issue name" style="min-width:220px' + (ch ? ';' + CHANGED_STYLE : '') + '">' + cancel + '</span>';
    }
    var off = R.issueOff || (!!R.issueName && !issueIsPlanned(opts));
    var sel = '<select class="' + cls + '" data-tr-issue' + st + '>' +
      (!R.issueName && !off ? '<option value="" selected>Choose the planned issue\u2026</option>' : '') +
      opts.map(function (o) {
        var on = !off && normName(o.label) === normName(R.issueName);
        return '<option value="' + esc(o.label) + '"' + (on ? ' selected' : '') +
          (o.taken && !on ? ' disabled' : '') + '>' + esc(o.label) +
          (o.taken && !on ? ' \u00b7 ' + esc(o.why || 'taken') : '') + '</option>';
      }).join('') +
      '<option value="__off"' + (off ? ' selected' : '') + '>Not on the calendar\u2026</option>' +
      '</select>';
    var name = off
      ? '<input class="' + cls + '" data-tr-issuename value="' + esc(R.issueName) + '"' +
          ' placeholder="Issue name" style="min-width:200px' + (ch ? ';' + CHANGED_STYLE : '') + '">'
      : '';
    return row + sel + name + cancel + '</span>';
  }

  /* In-place update while typing: never re-render the field. */
  function uIssue() {
    var ch = issueChanged();
    var h = el('.tpr-title'); if (h) h.textContent = R.issueName || 'Which issue is this?';
    Array.prototype.forEach.call(R.root.querySelectorAll('[data-tr-issue],[data-tr-issuename]'), function (f) {
      f.classList.toggle('ix-picker-input--changed', ch);
      if (ch) {
        f.style.setProperty('border', '2px solid var(--ix-gold, #C4A35A)', 'important');
        f.style.setProperty('box-shadow', '0 0 0 3px var(--ix-gold-glow, rgba(196,163,90,.12))', 'important');
      } else { f.style.removeProperty('border'); f.style.removeProperty('box-shadow'); }
    });
    var c = el('[data-tr-issue-cancel]'); if (c) c.hidden = !ch;
  }

  function onIssueChange(ev) {
    var t = ev.target;
    if (!t || !t.hasAttribute || !t.hasAttribute('data-tr-issue')) return;
    if (t.value === '__off') {
      R.issueOff = true;
      if (issueIsPlanned(planOpts())) R.issueName = '';
    } else {
      R.issueOff = false;
      R.issueName = t.value;
    }
    markDirty(); rHead();
    var nf = el('[data-tr-issuename]'); if (nf && R.issueOff) nf.focus();
  }

  /* v1.4.0 — the ⓘ (standing rule, 29 Sept). Absent ix-info, the
     header simply has no badge; nothing else depends on it. */
  function infoBadge() {
    if (!(window.IxInfo && window.IxInfo.badge)) return '';
    return '<span style="margin-left:12px;display:inline-flex;align-items:center">' +
      window.IxInfo.badge({
        file: 'ta-print-review-v' + VERSION + '.js',
        version: VERSION,
        title: 'Print Issue \u00b7 Intake Review',
        blurb: 'The print PDF has been read page by page. Check each page against what was found, ' +
               'fix anything the read got wrong, and add what it missed. Every change saves as a ' +
               'draft, so you can leave and resume. "Send to the Allocator" writes one row per ' +
               'item to ALLOCATIONS, checks each against what Webflow stored, and hands the rows ' +
               'to the Print Issue Allocator without reloading the page.',
        scenarios: [
          { name: '103B \u00b7 Allocations Writer', note: 'creates one ALLOCATIONS row per item and reports what was stored' }
        ],
        companions: 'ta-print-review-v1.3.6.css \u00b7 ix-print-parse Worker (/draft, /extract) \u00b7 ix-refresh-helper v1.1.0'
      }) + '</span>';
  }

  /* v1.3.1 — the fixed bar is pinned to the review root's box so
     it spans the review, not the nav rail. */
  function placeCommit() {
    var c = document.getElementById('tpr-commit');
    if (!c || !R.root || !R.active) return;
    var r = R.root.getBoundingClientRect();
    c.style.setProperty('left', Math.round(r.left) + 'px', 'important');
    c.style.setProperty('width', Math.round(r.width) + 'px', 'important');
  }
  function removeCommit() {
    var c = document.getElementById('tpr-commit');
    if (c) c.parentNode.removeChild(c);
  }

  /* v1.3.0 — the commit bar: the last act of the workflow, at the
     end of the path, always visible. */
  function rCommit() {
    if (!R.active) { removeCommit(); return; }
    var c = document.getElementById('tpr-commit');
    if (!c) {
      c = document.createElement('div');
      c.id = 'tpr-commit';
      c.className = 'tpr-commit';
      /* Inline !important: unbeatable by any stylesheet. */
      [['position', 'fixed'], ['bottom', '0'], ['z-index', '9000'],
       ['box-sizing', 'border-box'], ['display', 'flex'],
       ['align-items', 'center'], ['gap', '14px'],
       ['padding', '12px 24px'],
       /* soft: the tint LAYERED over cream stays opaque under a
          fixed bar; a bare 14% tint would ghost the page through */
       ['background', 'linear-gradient(var(--ix-salmon-soft, rgba(236,114,89,.14)), var(--ix-salmon-soft, rgba(236,114,89,.14))), var(--ix-cream, #FAF9F5)'],
       ['color', 'var(--ix-teal, #1A3A3A)'],
       ['border-top', '2px solid var(--ix-salmon, #EC7259)'],
       ['box-shadow', '0 -8px 24px rgba(20, 48, 47, .18)']
      ].forEach(function (kv) { c.style.setProperty(kv[0], kv[1], 'important'); });
      c.addEventListener('click', onClick);
      document.body.appendChild(c);
    }
    var rows = writableEff(), wn = rows.length;
    var t = itemTallies();
    var pend = [];
    if (t.ev) pend.push(t.ev + ' event' + (t.ev === 1 ? '' : 's'));
    if (t.re) pend.push(t.re + ' listing' + (t.re === 1 ? '' : 's'));
    var by = {};
    rows.forEach(function (e) { by[e.r.cur.type] = (by[e.r.cur.type] || 0) + 1; });
    var going = [];
    if (by['article'])     going.push(by['article'] + ' article' + (by['article'] === 1 ? '' : 's'));
    if (by['other'])       going.push(by['other'] + ' other');
    if (by['events-page']) going.push(by['events-page'] + ' events page' + (by['events-page'] === 1 ? '' : 's'));
    if (by['re-page'])     going.push(by['re-page'] + ' RE page' + (by['re-page'] === 1 ? '' : 's'));
    if (by['print-ad'])    going.push(by['print-ad'] + ' print ad' + (by['print-ad'] === 1 ? '' : 's'));
    if (by['house-ad'])    going.push(by['house-ad'] + ' house ad' + (by['house-ad'] === 1 ? '' : 's'));
    var sn = sentCount();
    var more = sn ? ' more' : '';
    c.innerHTML =
      '<span class="tpr-cta-line">' +
        (wn
          ? '<b>' + wn + more + ' item' + (wn === 1 ? '' : 's') + ' go' + (wn === 1 ? 'es' : '') + ' to the Allocator</b>' +
            (sn ? ' \u00b7 ' + sn + ' already sent' : '') +
            (going.length ? ' \u2014 ' + esc(going.join(' \u00b7 ')) : '') +
            ' \u00b7 <button type="button" class="tpr-seethem" data-tr-seethem>see them</button>'
          : (sn ? '<b>Everything is in the Allocator</b> \u2014 ' + sn + ' item' + (sn === 1 ? '' : 's') + ' sent'
                : '<b>Nothing goes to the Allocator</b> \u2014 every item is excluded')) +
      '</span>' +
      '<span class="tpr-head-cta-sub">' +
        (pend.length ? esc(pend.join(' \u00b7 ')) + ' follow in a later build step' : 'individual events and listings follow in a later build step') +
      '</span>' +
      '<span class="tpr-commit-sp"></span>' +
      (wn || !sn
        ? '<button type="button" class="ix-btn ix-btn--primary ix-btn--gold" data-tr-create' + (wn ? '' : ' disabled') + '>' +
            'Send ' + wn + more + ' item' + (wn === 1 ? '' : 's') + ' to the Allocator</button>'
        : '<button type="button" class="ix-btn ix-btn--primary ix-btn--gold" data-tr-finishall>Finish</button>');
    placeCommit();
  }

  function uSave(state) {
    var s = el('[data-tr-save]'); if (!s) return;
    if (state === 'saving' || R.saving) { s.textContent = 'saving\u2026'; s.style.color = ''; return; }
    if (R.conflict) { s.textContent = 'draft not saved \u2014 a newer copy exists'; s.style.color = 'var(--ix-salmon-ink, #C0432B)'; return; }
    if (state === 'fail' || R.saveWhy) { s.textContent = 'draft not saved (' + R.saveWhy + ')'; s.style.color = 'var(--ix-salmon-ink, #C0432B)'; return; }
    if (R.dirty) { s.textContent = 'unsaved changes\u2026'; s.style.color = ''; return; }
    s.style.color = '';
    s.textContent = R.savedAt ? 'draft saved ' + fmtClock(R.savedAt) : 'not saved yet';
  }

  function uConflict() {
    var c = el('[data-tr-conflict]'); if (!c) return;
    if (!R.conflict) { c.hidden = true; c.innerHTML = ''; return; }
    c.hidden = false;
    c.innerHTML =
      '<span>A newer copy of this review was saved somewhere else' +
      (R.conflict.draft && R.conflict.draft.checkedPages ? ' (' + R.conflict.draft.checkedPages.length + ' pages checked there)' : '') +
      '. Nothing here is overwritten until you choose.</span>' +
      '<button type="button" class="ix-btn ix-btn--secondary" data-tr-conf="load">Load the newer copy</button>' +
      '<button type="button" class="ix-revert" data-tr-conf="mine">Keep this one</button>';
  }

  function rSub() {
    var s = el('[data-tr-sub]'); if (!s) return;
    var lp = lookPages();
    var target = lp.filter(function (p) { return p > R.page; })[0] || lp[0] || 0;
    var show = '';
    if (R.view === 'list') {
      show = '<span class="tpr-show">Show ' +
        [['all', 'All'], ['articles', 'Articles'], ['ads', 'Ads']].map(function (op) {
          return '<button type="button" class="ix-btn ix-btn--pill" data-active="' + (R.show === op[0]) + '" data-tr-show="' + op[0] + '">' + op[1] + '</button>';
        }).join('') + '</span>';
    }
    var done = checkedCount(), look = lp.length;
    s.innerHTML =
      '<span class="tpr-seg">' +
        '<button type="button" class="ix-btn ix-btn--pill" data-active="' + (R.view === 'pages') + '" data-tr-view="pages">Pages</button>' +
        '<button type="button" class="ix-btn ix-btn--pill" data-active="' + (R.view === 'list') + '" data-tr-view="list">List</button>' +
      '</span>' +
      '<span class="tpr-progress">' +
        '<span class="tpr-progress-bar"><i style="width:' + (R.pages ? Math.round(done / R.pages * 100) : 0) + '%"></i></span>' +
        '<span class="tpr-progress-t">Checked ' + done + ' of ' + R.pages + ' pages</span>' +
        (look ? '<span class="tpr-progress-look">\u00b7 ' + look + ' flagged for a look</span>' : '') +
      '</span>' +
      '<span class="tpr-sub-sp"></span>' + show +
      (target
        ? '<button type="button" class="ix-btn ix-btn--primary ix-btn--gold" data-tr-nextlook="' + target + '">' +
            'Next page that needs a look \u203a p.' + target + '</button>'
        : '<button type="button" class="ix-btn ix-btn--secondary" disabled>Nothing left that needs a look</button>');
  }

  // ── Pages view · thumbnails ───────────────────────────────

  function rThumbs() {
    var g = el('[data-tr-thumbs]'); if (!g) return;
    var host = g.parentNode, keep = host.scrollTop;
    var lp = {}; lookPages().forEach(function (p) { lp[p] = true; });
    var html = '';
    for (var p = 1; p <= R.pages; p++) {
      var done = !!R.checked[p], look = !!lp[p], cur = p === R.page;
      html +=
        '<button type="button" class="tpr-th' + (cur ? ' tpr-th--cur' : '') + '" data-tr-go="' + p + '" aria-label="Page ' + p + '">' +
          '<span class="tpr-th-img" data-tr-thn="' + p + '" style="aspect-ratio:10/13">' +
            (R.thumbCache[p] ? '<img src="' + R.thumbCache[p] + '" alt="">' : '') +
            (done ? '<span class="tpr-th-done" style="background:rgba(31,122,92,.3) !important">' +
                      '<i style="background:#1F7A5C !important;color:#FFFFFF !important">\u2713</i></span>' : '') +
            (look && !done ? '<span class="tpr-th-look" style="background:#EC7259 !important"></span>' : '') +
          '</span>' +
          '<span class="tpr-th-lab"><span>P.' + p + '</span>' +
            '<span class="tpr-th-mark ' + (done ? 'tpr-th-mark--done' : 'tpr-th-mark--look') + '">' +
              (done ? 'CHECKED' : (look ? 'LOOK' : '')) + '</span></span>' +
        '</button>';
    }
    g.innerHTML = html;
    host.scrollTop = keep;
    var cur = g.querySelector('.tpr-th--cur');
    if (cur) { try { cur.scrollIntoView({ block: 'nearest' }); } catch (x) {} }
    watchThumbs(g);
  }

  function watchThumbs(grid) {
    if (R.io) { R.io.disconnect(); R.io = null; }
    if (!('IntersectionObserver' in window)) {   /* render the first rows, best effort */
      Array.prototype.slice.call(grid.querySelectorAll('[data-tr-thn]'), 0, 12).forEach(fillThumb);
      return;
    }
    R.io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        R.io.unobserve(en.target);
        fillThumb(en.target);
      });
    }, { root: grid.parentNode, rootMargin: '200px' });
    Array.prototype.forEach.call(grid.querySelectorAll('[data-tr-thn]'), function (elx) {
      if (!elx.querySelector('img')) R.io.observe(elx);
    });
  }

  function fillThumb(slot, tries) {
    var n = +slot.getAttribute('data-tr-thn');
    if (!n || R.thumbCache[n]) return;
    var mine = R;
    renderAt(n, THUMB_W).then(function (url) {
      if (R !== mine || !R.active) return;
      R.thumbCache[n] = url;
      var live = el('[data-tr-thn="' + n + '"]');
      if (live && !live.querySelector('img')) {
        var img = document.createElement('img');
        img.src = url; img.alt = '';
        live.insertBefore(img, live.firstChild);
      }
    }).catch(function () {
      /* v1.3.5 — usually the page-1 race with the big view:
         pdf.js allows one render task per page at a time. Retry
         with backoff; never cache emptiness. After three tries
         the page column's own reporting covers real PDF trouble. */
      if (R !== mine || !R.active) return;
      var t = (tries || 0) + 1;
      if (t <= 3) setTimeout(function () { fillThumb(slot, t); }, 600 * t);
    });
  }

  // ── Pages view · the page ─────────────────────────────────

  function rPage() {
    var c = el('[data-tr-page]'); if (!c) return;
    var n = R.page, f = printedFolio(n);
    var checked = !!R.checked[n];
    var body;
    if (R.pdfWhy && !R.pdf) {
      body = '<div class="tpr-page-empty">' + esc(R.pdfWhy) + '</div>';
    } else {
      body = '<button type="button" class="tpr-page-img" data-tr-zoom="' + n + '" title="Zoom this page">' +
               '<span data-tr-big style="display:block;aspect-ratio:10/13"></span>' +
             '</button>';
    }
    c.innerHTML =
      '<div class="tpr-page-nav">' +
        '<button type="button" class="ix-btn ix-btn--secondary ix-btn--icon-lg" data-tr-prev aria-label="Previous page"' + (n <= 1 ? ' disabled' : '') + '>\u2039</button>' +
        '<span class="tpr-page-n">PDF page ' + n + ' of ' + R.pages +
          (String(f) !== String(n) ? ' \u00b7 printed ' + esc(String(f)) : '') + '</span>' +
        '<button type="button" class="ix-btn ix-btn--secondary ix-btn--icon-lg" data-tr-next aria-label="Next page"' + (n >= R.pages ? ' disabled' : '') + '>\u203a</button>' +
      '</div>' +
      (checked ? '<div class="tpr-page-checked">\u2713 Page ' + n + ' checked</div>' : '') +
      body +
      '<span class="tpr-page-hint">\u2039 \u203a or arrow keys flip pages \u00b7 click the page to zoom</span>';
    if (!R.pdfWhy || R.pdf) {
      var slot = c.querySelector('[data-tr-big]'), mine = R, want = n;
      cached(R.bigCache, BIG_CACHE_MAX, n, BIG_W).then(function (url) {
        if (R !== mine || !R.active || R.page !== want) return;
        var live = el('[data-tr-big]');
        if (live) { live.style.aspectRatio = ''; live.innerHTML = '<img src="' + url + '" alt="PDF page ' + want + '">'; }
      }).catch(function () {
        if (R !== mine || !R.active) return;
        rPage();   /* pdfWhy is set now; show the message */
      });
      void slot;
    }
  }

  // ── Cards (Pages view) and item tables (both views) ───────

  function checkBadge(x) {
    return x.check ? '<span class="tpr-flag" title="' + esc(x.checkReason || x.check || 'Check this item') + '">Check</span>' : '';
  }

  function itemRow(rid, idx, x, withWill) {
    var will;
    if (!x.on) will = 'Skip';
    else will = x._k === 're' ? 'New listing' : 'New event';
    var main, mid, right;
    if (x._k === 're') {
      main = esc(x.address || '') + (x.city ? ', ' + esc(x.city) : '');
      mid = esc(x.statusPrinted || '\u2014') + ' \u2192 ' +
            (x.phase ? '<b>' + esc(x.phase) + '</b>' : '<span class="tpr-it-dim">no phase</span>') +
            (x.phaseNote ? ' <span class="tpr-it-dim">note: ' + esc(x.phaseNote) + '</span>' : '');
      right = hidesPrice(x.phase)
        ? '<span class="tpr-it-dim">price hidden (' + esc(x.phase) + ')</span>'
        : (money(x.price) || '<span class="tpr-it-dim">no price printed</span>');
    } else {
      main = esc(x.title || '');
      mid = esc(whenText(x));
      var venue = [x.venueName, x.room].filter(Boolean).join(', ');
      right = venue ? esc(venue) + (x.venueFromDefault ? ' <span class="tpr-it-dim">(page default)</span>' : '')
                    : '<span class="tpr-it-dim">\u2014</span>';
    }
    return '<label class="tpr-it' + (x.on ? '' : ' tpr-it--off') + '" title="' + esc(x.rawText || '') + '">' +
      '<input type="checkbox" data-tr-it="' + esc(rid) + ':' + idx + '"' + (x.on ? ' checked' : '') + '>' +
      '<span class="tpr-it-main">' + main + '</span>' +
      '<span class="tpr-it-mid">' + mid + '</span>' +
      '<span class="tpr-it-right">' + right + '</span>' +
      (withWill ? '<span class="tpr-it-will ' + (x.on ? 'tpr-it-will--on' : 'tpr-it-will--off') + '" data-tr-will>' + will + '</span>' : '') +
      checkBadge(x) +
      '</label>';
  }

  function itemsBlock(e, withWill) {
    var r = e.r, f = r.found;
    if (!f) return '';
    var parts = [];
    if (f.busy) {
      parts.push('<div class="tpr-items"><div class="tpr-items-head">Reading the items\u2026</div></div>');
      return parts.join('');
    }
    var evs = [], res = [];
    f.items.forEach(function (x, i) { (x._k === 're' ? res : evs).push({ x: x, i: i }); });
    var nRe = res.length, nEv = evs.length;
    if (f.items.length) {
      var head = (nRe ? nRe + ' listing' + (nRe === 1 ? '' : 's') : '') +
                 (nRe && nEv ? ' \u00b7 ' : '') +
                 (nEv ? nEv + ' event' + (nEv === 1 ? '' : 's') : '');
      var chk = f.items.filter(function (x) { return x.check; }).length;
      var mism = (r.itemCount && r.itemCount !== f.items.length)
        ? ' <span>(page read counted ' + r.itemCount + ')</span>' : '';
      var will = withWill ? '<span class="tpr-it-will" style="font-weight:400">WILL</span>' : '';
      var cols = '<span style="width:16px;flex:none"></span>' + (nRe
        ? '<span class="tpr-it-main">ADDRESS</span><span class="tpr-it-mid">PRINTED \u2192 PHASE</span><span class="tpr-it-right">PRICE</span>'
        : '<span class="tpr-it-main">EVENT</span><span class="tpr-it-mid">WHEN</span><span class="tpr-it-right">VENUE</span>') + will;
      parts.push('<div class="tpr-items">' +
        '<div class="tpr-items-head">' + head +
          (chk ? '<span>\u00b7 ' + chk + ' to check</span>' : '') + mism +
          '<span>\u00b7 ticks are kept with the review; created in a later build step</span></div>' +
        '<div class="tpr-items-cols">' + cols + '</div>' +
        res.concat(evs).map(function (o) { return itemRow(r.id, o.i, o.x, withWill); }).join('') +
        '</div>');
    }
    if (nRe && R.phases && R.phases.why) {
      parts.push('<div class="tpr-x-err">Listing Phase options could not be read (' + esc(R.phases.why) +
        '), so printed statuses are kept as phase notes.</div>');
    }
    if (f.defaults && (f.defaults.venueName || f.defaults.street)) {
      parts.push('<div class="tpr-x-dim">Page default venue: ' +
        esc([f.defaults.venueName, f.defaults.street, f.defaults.city].filter(Boolean).join(', ')) + '</div>');
    }
    if (f.errors && f.errors.length) {
      parts.push('<div class="tpr-x-err">Could not read the items on PDF page ' +
        f.errors.map(function (er) { return er.pdfPage + ' (' + esc(er.why) + ')'; }).join('; ') + '. ' +
        (R.pdf || R.pdfUrl
          ? '<button type="button" class="ix-revert" data-tr-xretry="' + esc(r.id) + '">Try again</button>'
          : '<span class="tpr-x-dim">The PDF is not stored, so it cannot be read again here.</span>') +
        '</div>');
    }
    if (!f.items.length && !f.errors.length && (r.event !== 'none' || r.listings === 'ad')) {
      parts.push('<div class="tpr-x-dim">The page read flagged ' +
        (r.listings === 'ad' ? 'homes' : 'an event') + ' here, but a closer read found none.</div>');
    }
    return parts.join('');
  }

  function structNote(e) {
    var r = e.r;
    if (r.excluded) return { note: 'Excluded', undo: true };
    if (e.joinedFrom) {
      var m = rowById(e.joinedFrom);
      return { note: 'Joined with p.' + (m && m.pg[0] ? m.pg[0] : '?'), undo: true };
    }
    if (r.addedBy === 'user') return { note: 'Added by you', undo: true };
    if (r.cur.type !== r.orig.type) return { note: 'Type changed', undo: true };
    return null;
  }

  function fieldHtml(r, f, label, pgField) {
    var ch = fieldChanged(r, f);
    return '<label class="tpr-lab">' + esc(label) +
      '<span class="tpr-f' + (pgField ? ' tpr-f--pg' : '') + '">' +
        '<input class="ix-picker-input' + (ch ? ' ix-picker-input--changed' : '') + '"' +
          ' data-tr-f="' + esc(r.id) + ':' + f + '" value="' + esc(r.cur[f]) + '"' +
          (r.excluded ? ' disabled' : '') + '>' +
        '<button type="button" class="ix-revert" data-tr-rv="' + esc(r.id) + ':' + f + '"' + (ch ? '' : ' hidden') + '>undo</button>' +
      '</span></label>';
  }

  function cardHtml(e) {
    var r = e.r, ad = isAdRow(r);
    var isCont = e.pg[0] !== R.page;
    var note = structNote(e);
    var flag = (!r.excluded && r.conf && r.conf !== 'high')
      ? '<span class="tpr-flag" title="' + esc(r.note || 'Judgement call') + '">' + esc(r.conf) + '</span>' : '';
    /* v1.5.1 — a sent row says so; edits here are not re-sent */
    if (R.sent && R.sent[r.id]) {
      flag += '<span class="tpr-flag" style="background:var(--ix-teal-soft, rgba(26,58,58,.10)) !important;' +
              'color:var(--ix-teal, #1A3A3A) !important" title="Created in ALLOCATIONS. Edit it in the Allocator; ' +
              'changes here are not sent again.">Sent to the Allocator</span>';
    }
    var opts = ad ? AD_TYPE_OPTS : TYPE_OPTS;
    var chips = opts.map(function (o) {
      var on = r.cur.type === o.v, ch = on && r.cur.type !== r.orig.type;
      return '<button type="button" class="ix-chip' + (ch ? ' ix-chip--changed' : '') + '"' +
        (on ? ' data-active="true" aria-pressed="true"' : '') +
        ' data-tr-type="' + esc(r.id) + ':' + o.v + '"' + (r.excluded ? ' disabled' : '') + '>' + o.l + '</button>';
    }).join('');
    var prev = r.continues ? rowById(r.continues.prevId) : null;
    var joinable = prev && !R.merged[r.id] && !r.excluded && !prev.excluded && !R.merged[prev.id];
    var addedRow = r.addedBy === 'user';
    return '<div class="tpr-card' + (structChanged(e) ? ' tpr-card--changed' : '') + (r.excluded ? ' tpr-card--off' : '') + (r.id === R.activeId ? ' tpr-card--active' : '') + '" data-tr-card="' + esc(r.id) + '">' +
      '<div class="tpr-card-top">' +
        '<span class="tpr-kind">' + esc((addedRow ? 'ADDED \u00b7 ' : '') + (TYPE_LABEL[r.cur.type] || r.cur.type)) +
          (isCont ? ' (continued)' : '') + ' \u00b7 P.' + esc(e.span) + '</span>' +
        flag +
        (note ? '<span class="tpr-note">' + esc(note.note) + '</span>' +
                '<button type="button" class="ix-revert" data-tr-note="' + esc(r.id) + '">cancel</button>' : '') +
        '<span class="tpr-card-sp"></span>' +
        (!r.excluded ? '<button type="button" class="ix-revert" data-tr-ex="' + esc(r.id) + '">Exclude</button>' : '') +
      '</div>' +
      fieldHtml(r, 'name', ad ? 'Advertiser' : 'Title') +
      (ad ? '' :
        '<div class="tpr-grid3">' +
          fieldHtml(r, 'section', 'Print section') +
          fieldHtml(r, 'byline', 'Byline') +
          fieldHtml(r, 'customer', 'Customer') +
        '</div>') +
      (ad && r.cur.type === 'print-ad' ? fieldHtml(r, 'customer', 'Customer') : '') +
      '<div class="tpr-chips">' + chips +
        (r.adSize ? '<span class="tpr-adsize">' + esc(AD_SIZE_LABEL[r.adSize] || r.adSize) + '</span>' : '') +
      '</div>' +
      (joinable
        ? '<div class="tpr-join"><span class="tpr-join-t">' +
            '<span class="tpr-join-q">Does this continue \u201c' + esc(prev.cur.name || prev.orig.name) + '\u201d from p.' + prev.pg[0] + '?</span>' +
            '<span class="tpr-join-why">Why we ask: ' + esc(r.continues.why || 'the parser saw evidence they connect') + '</span></span>' +
            '<button type="button" class="ix-btn ix-btn--secondary" data-tr-join="' + esc(r.id) + '">Yes, join to p.' + prev.pg[0] + '</button>' +
          '</div>'
        : '') +
      itemsBlock(e, true) +
      '</div>';
  }

  function rCards() {
    var c = el('[data-tr-cards]'); if (!c) return;
    var keep = c.scrollTop;
    var here = effRows().filter(function (e) { return e.pg.indexOf(R.page) > -1; });
    var checked = !!R.checked[R.page];
    var html = '';
    if (checked) {
      html += '<div class="tpr-cards-banner"><i>\u2713</i>Checked. Changes are still allowed and keep the check.</div>';
    }
    html += '<div class="tpr-cards-head">' +
      '<h2 class="tpr-cards-h2">Found on page ' + R.page + '</h2>' +
      '<span class="tpr-cards-sum">' + (here.length ? here.length + ' item' + (here.length === 1 ? '' : 's') : '') + '</span>' +
      '</div>';
    if (!here.length) {
      html += '<div class="tpr-none">Nothing was found on this page. If something is here, add it below.</div>';
    }
    html += here.map(cardHtml).join('');
    html += '<button type="button" class="ix-revert tpr-add" data-tr-add="page">Something missing? Add an item on this page</button>';
    html += '<div class="tpr-checkrow">' +
      (checked
        ? '<button type="button" class="ix-btn tpr-checkbtn--on" data-tr-check>\u2713 Page ' + R.page + ' checked \u00b7 undo</button>'
        : '<button type="button" class="ix-btn ix-btn--primary ix-btn--teal" data-tr-check>Mark page ' + R.page + ' checked</button>') +
      '<span class="tpr-checkrow-hint">Checking a page moves you to the next page not yet checked.</span>' +
      '</div>';
    c.innerHTML = html;
    c.scrollTop = keep;
  }

  // ── List view ─────────────────────────────────────────────

  function shownEff() {
    return effRows().filter(function (e) {
      if (R.show === 'articles') return !isAdRow(e.r);
      if (R.show === 'ads') return isAdRow(e.r);
      return true;
    });
  }

  function listRowHtml(e, open) {
    var r = e.r, ad = isAdRow(r);
    var sel = !!R.sel[r.id];
    var flag = '';
    if (r.excluded) flag = 'excluded';
    else if (r.conf && r.conf !== 'high') flag = r.conf;
    else if (r.found && r.found.items.some(function (x) { return x.check; })) flag = 'check';
    var items = r.found ? r.found.items : [];
    var nRe = items.filter(function (x) { return x._k === 're'; }).length;
    var itemsLabel = items.length
      ? (open ? 'hide ' : '') + items.length + (nRe ? (nRe === 1 && items.length === 1 ? ' listing' : ' listings') : (items.length === 1 ? ' event' : ' events'))
      : '';
    var added = r.addedBy === 'user';
    var titleCell, sectionCell, bylineCell, customerCell, pgCell;
    if (added) {
      pgCell = '<span class="tpr-f tpr-f--pg"><input class="ix-picker-input" type="number" min="1" max="' + R.pages + '"' +
               ' data-tr-pgi="' + esc(r.id) + '" value="' + (r.pg[0] || '') + '" aria-label="Page"></span>';
      titleCell = '<span class="tpr-f"><input class="ix-picker-input' + (fieldChanged(r, 'name') ? ' ix-picker-input--changed' : '') + '"' +
        ' data-tr-f="' + esc(r.id) + ':name" value="' + esc(r.cur.name) + '" placeholder="Title"></span>';
      sectionCell = '<span class="tpr-f"><input class="ix-picker-input" data-tr-f="' + esc(r.id) + ':section" value="' + esc(r.cur.section) + '"></span>';
      bylineCell = '<span class="tpr-f"><input class="ix-picker-input" data-tr-f="' + esc(r.id) + ':byline" value="' + esc(r.cur.byline) + '"></span>';
      customerCell = '<span class="tpr-f"><input class="ix-picker-input" data-tr-f="' + esc(r.id) + ':customer" value="' + esc(r.cur.customer) + '"></span>';
    } else {
      pgCell = '<button type="button" class="tpr-pg" data-tr-go="' + (e.pg[0] || 1) + '" title="Open this page">' + esc(e.span) + '</button>';
      titleCell = '<b>' + esc(r.cur.name || '\u2014') + '</b>' +
        (itemsLabel ? '<button type="button" class="ix-revert" data-tr-open="' + esc(r.id) + '">' + esc(itemsLabel) + '</button>' : '');
      sectionCell = '<span class="tpr-lr-cell">' + esc(r.cur.section) + '</span>';
      bylineCell = '<span class="tpr-lr-cell">' + esc(r.cur.byline) + '</span>';
      customerCell = '<span class="tpr-lr-cell">' + esc(r.cur.customer) + '</span>';
    }
    return '<div class="tpr-lr' + (sel ? ' tpr-lr--sel' : '') + (structChanged(e) ? ' tpr-lr--changed' : '') + (r.excluded ? ' tpr-lr--off' : '') + '" data-tr-lr="' + esc(r.id) + '">' +
      '<div class="tpr-list-grid tpr-lr-grid">' +
        '<input type="checkbox" data-tr-sel="' + esc(r.id) + '"' + (sel ? ' checked' : '') + ' aria-label="Select row">' +
        pgCell +
        '<div class="tpr-lr-title">' + titleCell + '</div>' +
        sectionCell + bylineCell + customerCell +
        '<span class="tpr-lr-img">' + (ad ? '' : e.img) + '</span>' +
        '<span class="tpr-lr-type">' + esc(TYPE_LABEL[r.cur.type] || r.cur.type) +
          (r.adSize ? ' \u00b7 ' + esc(AD_SIZE_LABEL[r.adSize] || r.adSize) : '') + '</span>' +
        '<span>' + (flag ? '<span class="tpr-flag" title="' + esc(r.note || '') + '">' + esc(flag) + '</span>' : '') + '</span>' +
      '</div>' +
      (open && items.length ? '<div class="tpr-lr-items">' + itemsBlock(e, false) + '</div>' : '') +
      '</div>';
  }

  function rList() {
    var c = el('[data-tr-list]'); if (!c) return;
    var scroller = c.querySelector('.tpr-list-scroll');
    var keep = scroller ? scroller.scrollTop : 0;
    var shown = shownEff();
    c.innerHTML =
      '<div class="tpr-bulk" data-tr-bulk hidden></div>' +
      '<div class="tpr-list-scroll scroll">' +
        '<div class="tpr-list-grid tpr-list-headrow">' +
          '<span></span><span>PG</span><span>TITLE</span><span>PRINT SECTION</span><span>BYLINE</span>' +
          '<span>CUSTOMER</span><span>IMG</span><span>TYPE</span><span>FLAG</span>' +
        '</div>' +
        shown.map(function (e) { return listRowHtml(e, !!R.open && !!R.open[e.r.id]); }).join('') +
        '<button type="button" class="ix-revert tpr-add" data-tr-add="list" style="margin-top:14px">Something missing? Add a row</button>' +
      '</div>';
    var s2 = c.querySelector('.tpr-list-scroll');
    if (s2) s2.scrollTop = keep;
    uBulk();
  }

  function selIds() { return Object.keys(R.sel).filter(function (k) { return R.sel[k]; }); }

  function bulkJoinable() {
    var ids = selIds();
    if (ids.length !== 2) return null;
    var eff = effRows().filter(function (e) { return ids.indexOf(e.r.id) > -1; });
    if (eff.length !== 2) return null;
    eff.sort(function (a, b) { return (a.pg[0] || 0) - (b.pg[0] || 0); });
    var a = eff[0], b = eff[1];
    if (isAdRow(a.r) || isAdRow(b.r) || a.r.excluded || b.r.excluded) return null;
    if (b.pg[0] !== a.pg[a.pg.length - 1] + 1) return null;
    return { into: a.r.id, absorbed: b.r.id };
  }

  function uBulk() {
    var b = el('[data-tr-bulk]'); if (!b) return;
    var ids = selIds();
    if (!ids.length) { b.hidden = true; b.innerHTML = ''; R.menu = null; return; }
    var join = bulkJoinable();
    var selRows = ids.map(rowById).filter(Boolean);
    var allAds = selRows.every(isAdRow), allContent = selRows.every(function (r) { return !isAdRow(r); });
    var menu = '';
    if (R.menu === 'type') {
      var mOpts = allAds ? AD_TYPE_OPTS : (allContent ? TYPE_OPTS : []);
      menu = '<div class="tpr-menu" data-tr-menu style="left:0">' +
        (mOpts.length
          ? mOpts.map(function (o) { return '<button type="button" data-tr-settype="' + o.v + '">' + o.l + '</button>'; }).join('')
          : '<span class="tpr-x-dim" style="padding:7px 10px">Select only articles or only ads to set a type.</span>') +
        '</div>';
    } else if (R.menu === 'customer') {
      menu = '<div class="tpr-menu" data-tr-menu style="left:0">' +
        '<div class="tpr-menu-row">' +
          '<input class="ix-picker-input" data-tr-setcust-val placeholder="Customer name">' +
          '<button type="button" class="ix-btn ix-btn--primary" data-tr-setcust>Apply</button>' +
        '</div></div>';
    }
    b.hidden = false;
    b.innerHTML =
      '<b>' + ids.length + ' selected</b>' +
      '<button type="button" class="tpr-bulk-btn' + (join ? ' tpr-bulk-btn--go' : '') + '" data-tr-bulkjoin' + (join ? '' : ' disabled') + '>Join into one article</button>' +
      '<button type="button" class="tpr-bulk-btn" data-tr-bulkex>Exclude</button>' +
      '<span style="position:relative">' +
        '<button type="button" class="tpr-bulk-btn" data-tr-menu-t="type">Set type \u25be</button>' +
        (R.menu === 'type' ? menu : '') + '</span>' +
      '<span style="position:relative">' +
        '<button type="button" class="tpr-bulk-btn" data-tr-menu-t="customer">Set customer \u25be</button>' +
        (R.menu === 'customer' ? menu : '') + '</span>' +
      '<span class="tpr-bulk-hint">' + (join ? 'Joins the second row into the first' : 'Join needs two articles on following pages') + '</span>' +
      '<button type="button" class="ix-revert" data-tr-bulkclear>Clear</button>';
    var inp = b.querySelector('[data-tr-setcust-val]');
    if (inp) inp.focus();
  }

  // ══════════════════════════════════════════════════════════
  // IN-PLACE UPDATES — an edit never redraws a whole pane, so the
  // view stays where the operator left it.
  // ══════════════════════════════════════════════════════════

  function refreshCounts() { rHead(); rSub(); }

  function onInput(ev) {
    if (isCustInput(ev.target) && R.sugFor === ev.target) fillSug(ev.target);
    var t = ev.target;
    if (t.hasAttribute('data-tr-issuename')) {         /* v1.5.0 */
      R.issueName = t.value; R.issueOff = true;
      uIssue(); markDirty();
      return;
    }
    if (t.hasAttribute('data-tr-f')) {
      var a = t.getAttribute('data-tr-f').split(':');
      var r = rowById(a[0]); if (!r) return;
      r.cur[a[1]] = t.value;
      var ch = fieldChanged(r, a[1]);
      t.classList.toggle('ix-picker-input--changed', ch);
      var rv = t.parentNode.querySelector('[data-tr-rv]'); if (rv) rv.hidden = !ch;
      markDirty();
      if (a[1] === 'name') refreshCounts();
      return;
    }
    if (t.hasAttribute('data-tr-pgi')) {
      var r2 = rowById(t.getAttribute('data-tr-pgi')); if (!r2) return;
      var n = parseInt(t.value, 10);
      r2.pg = n >= 1 ? [n] : []; r2.page = n >= 1 ? n : 0;
      markDirty();
    }
  }

  function toggleItem(rid, idx, on) {
    var r = rowById(rid); if (!r || !r.found || !r.found.items[idx]) return;
    r.found.items[idx].on = on;
    markDirty();
    /* both views may hold this item row */
    Array.prototype.forEach.call(R.root.querySelectorAll('[data-tr-it="' + rid + ':' + idx + '"]'), function (cb) {
      cb.checked = on;
      var lab = cb.closest('.tpr-it');
      if (lab) lab.classList.toggle('tpr-it--off', !on);
      var will = lab && lab.querySelector('[data-tr-will]');
      if (will) {
        will.textContent = on ? (r.found.items[idx]._k === 're' ? 'New listing' : 'New event') : 'Skip';
        will.classList.toggle('tpr-it-will--on', on);
        will.classList.toggle('tpr-it-will--off', !on);
      }
    });
    refreshCounts();
  }

  function setSel(id, on) {
    if (on) R.sel[id] = true; else delete R.sel[id];
    var lr = el('[data-tr-lr="' + id + '"]');
    if (lr) {
      lr.classList.toggle('tpr-lr--sel', on);
      var cb = lr.querySelector('[data-tr-sel]'); if (cb) cb.checked = on;
    }
  }

  function onSelClick(ev, t) {
    var id = t.getAttribute('data-tr-sel'), on = t.checked;
    var order = shownEff().map(function (e) { return e.r.id; });
    var here = order.indexOf(id);
    if (ev.shiftKey && R.anchor != null && R.anchor !== id) {
      var a0 = order.indexOf(R.anchor);
      if (a0 > -1 && here > -1) {
        var lo = Math.min(a0, here), hi = Math.max(a0, here);
        for (var i = lo; i <= hi; i++) setSel(order[i], on);
      } else setSel(id, on);
    } else {
      setSel(id, on);
    }
    if (!(ev.metaKey || ev.ctrlKey)) R.anchor = id;
    uBulk();
  }

  // ── Structural actions ────────────────────────────────────

  function excludeRow(id, on) {
    var r = rowById(id); if (!r) return;
    r.excluded = on;
    markDirty(); rCards(); rList(); refreshCounts(); rThumbs();
  }

  function cancelStruct(id) {
    var r = rowById(id); if (!r) return;
    if (r.excluded) { r.excluded = false; }
    else {
      var absorbed = '';
      Object.keys(R.merged).forEach(function (mid) { if (R.merged[mid] === id) absorbed = mid; });
      if (absorbed) { delete R.merged[absorbed]; }
      else if (r.addedBy === 'user') {
        R.rows = R.rows.filter(function (x) { return x.id !== id; });
        delete R.sel[id];
      }
      else if (r.cur.type !== r.orig.type) { r.cur.type = r.orig.type; }
    }
    markDirty(); rCards(); rList(); refreshCounts(); rThumbs();
  }

  function joinRows(absorbedId, intoId) {
    R.merged[absorbedId] = intoId;
    delete R.sel[absorbedId]; delete R.sel[intoId];
    markDirty(); rCards(); rList(); refreshCounts(); rThumbs();
  }

  var addSeq = 0;
  function addRow(page) {
    var id = 'u' + (++addSeq) + '-' + Date.now().toString(36);
    R.rows.push({
      id: id, pg: page ? [page] : [], page: page || 0,
      orig: { name: '', section: '', byline: '', customer: '', type: 'article' },
      cur:  { name: '', section: '', byline: '', customer: '', type: 'article' },
      images: 0, conf: 'high', note: '', event: 'none', listings: 'none',
      adSize: '', slug: '', itemCount: 0, found: null, continues: null,
      excluded: false, addedBy: 'user'
    });
    markDirty(); rCards(); rList(); refreshCounts();
    var inp = R.root.querySelector('[data-tr-f="' + id + ':name"]');
    if (inp) inp.focus();
  }

  // ══════════════════════════════════════════════════════════
  // CLICK / KEY WIRING
  // ══════════════════════════════════════════════════════════

  function onClick(ev) {
    var raw = ev.target;

    /* checkboxes first: modifiers matter and checked has flipped */
    if (raw.hasAttribute && raw.hasAttribute('data-tr-it')) {
      var ia = raw.getAttribute('data-tr-it').split(':');
      toggleItem(ia[0], +ia[1], raw.checked);
      return;
    }
    if (raw.hasAttribute && raw.hasAttribute('data-tr-sel')) { onSelClick(ev, raw); return; }

    var t = raw.closest && raw.closest(
      '[data-tr-finishall],[data-tr-issue-cancel],[data-tr-back],[data-tr-view],[data-tr-create],[data-tr-conf],[data-tr-show],[data-tr-nextlook],[data-tr-seethem],' +
      '[data-tr-go],[data-tr-prev],[data-tr-next],[data-tr-zoom],[data-tr-check],' +
      '[data-tr-rv],[data-tr-type],[data-tr-note],[data-tr-ex],[data-tr-join],[data-tr-xretry],[data-tr-add],' +
      '[data-tr-open],[data-tr-bulkjoin],[data-tr-bulkex],[data-tr-bulkclear],[data-tr-menu-t],[data-tr-settype],[data-tr-setcust]');
    if (!t) {
      if (R.menu && !(raw.closest && raw.closest('[data-tr-menu]'))) { R.menu = null; uBulk(); }
      return;
    }
    ev.preventDefault();

    if (t.hasAttribute('data-tr-finishall')) {           /* v1.5.1 */
      R.W = { phase: 'writing', done: 0, total: 0, log: [], error: '' };
      deleteDraft().then(function () { R.W.phase = 'done'; rWrite(); });
      return;
    }
    if (t.hasAttribute('data-tr-issue-cancel')) {       /* v1.5.0 */
      R.issueName = R.issueNameOrig; R.issueOff = false;
      markDirty(); rHead(); return;
    }
    if (t.hasAttribute('data-tr-back'))   { close(); return; }
    if (t.hasAttribute('data-tr-view'))   { R.view = t.getAttribute('data-tr-view'); markDirty(); rHead(); rSub(); rView(); return; }
    if (t.hasAttribute('data-tr-show'))   { R.show = t.getAttribute('data-tr-show'); R.sel = {}; R.anchor = null; markDirty(); rSub(); rList(); return; }
    if (t.hasAttribute('data-tr-create')) { startCreate(); return; }
    /* v1.1.0 — "see them": the List view, filtered to what the
       button counts (articles filter = everything that is not an
       ad; excluded rows show struck through, honestly). */
    if (t.hasAttribute('data-tr-seethem')) {
      R.view = 'list'; R.show = 'articles';
      rHead(); rSub(); rView(); rList();
      return;
    }
    if (t.hasAttribute('data-tr-conf'))   { onConflictChoice(t.getAttribute('data-tr-conf')); return; }
    if (t.hasAttribute('data-tr-nextlook')) {
      R.page = +t.getAttribute('data-tr-nextlook') || R.page;
      R.view = 'pages'; rHead(); rSub(); rView(); rThumbs(); rPage(); rCards(); markDirty(); return;
    }
    if (t.hasAttribute('data-tr-go')) {
      R.page = +t.getAttribute('data-tr-go') || 1;
      R.view = 'pages'; rHead(); rSub(); rView(); rThumbs(); rPage(); rCards(); markDirty(); return;
    }
    if (t.hasAttribute('data-tr-prev')) { if (R.page > 1) { R.page--; rThumbs(); rPage(); rCards(); rSub(); markDirty(); } return; }
    if (t.hasAttribute('data-tr-next')) { if (R.page < R.pages) { R.page++; rThumbs(); rPage(); rCards(); rSub(); markDirty(); } return; }
    if (t.hasAttribute('data-tr-zoom')) { zoomPages(+t.getAttribute('data-tr-zoom') || R.page); return; }

    if (t.hasAttribute('data-tr-check')) {
      if (R.checked[R.page]) delete R.checked[R.page];
      else {
        R.checked[R.page] = true;
        var nx = nextUnchecked(R.page);
        if (nx) R.page = nx;
      }
      markDirty(); rHead(); rSub(); rThumbs(); rPage(); rCards();
      return;
    }

    if (t.hasAttribute('data-tr-rv')) {
      var ra = t.getAttribute('data-tr-rv').split(':');
      var rr = rowById(ra[0]); if (!rr) return;
      rr.cur[ra[1]] = rr.orig[ra[1]];
      var inp = R.root.querySelector('[data-tr-f="' + ra[0] + ':' + ra[1] + '"]');
      if (inp) { inp.value = rr.cur[ra[1]]; inp.classList.remove('ix-picker-input--changed'); }
      t.hidden = true;
      markDirty(); if (ra[1] === 'name') { refreshCounts(); rList(); }
      return;
    }
    if (t.hasAttribute('data-tr-type')) {
      var ta = t.getAttribute('data-tr-type').split(':');
      var tr = rowById(ta[0]); if (!tr) return;
      tr.cur.type = ta[1];
      markDirty(); rCards(); rList(); refreshCounts();
      return;
    }
    if (t.hasAttribute('data-tr-note')) { cancelStruct(t.getAttribute('data-tr-note')); return; }
    if (t.hasAttribute('data-tr-ex'))   { excludeRow(t.getAttribute('data-tr-ex'), true); return; }
    if (t.hasAttribute('data-tr-join')) {
      var jr = rowById(t.getAttribute('data-tr-join'));
      if (jr && jr.continues) joinRows(jr.id, jr.continues.prevId);
      return;
    }
    if (t.hasAttribute('data-tr-xretry')) { retryRow(t.getAttribute('data-tr-xretry')); return; }
    if (t.hasAttribute('data-tr-add')) {
      addRow(t.getAttribute('data-tr-add') === 'page' ? R.page : 0); return;
    }
    if (t.hasAttribute('data-tr-open')) {
      R.open = R.open || {};
      var oid = t.getAttribute('data-tr-open');
      R.open[oid] = !R.open[oid];
      rList(); return;
    }
    if (t.hasAttribute('data-tr-bulkjoin')) {
      var j = bulkJoinable(); if (j) joinRows(j.absorbed, j.into);
      return;
    }
    if (t.hasAttribute('data-tr-bulkex')) {
      selIds().forEach(function (id) { var r0 = rowById(id); if (r0) r0.excluded = true; });
      R.sel = {}; markDirty(); rCards(); rList(); refreshCounts(); rThumbs();
      return;
    }
    if (t.hasAttribute('data-tr-bulkclear')) { R.sel = {}; R.anchor = null; rList(); return; }
    if (t.hasAttribute('data-tr-menu-t')) {
      var m = t.getAttribute('data-tr-menu-t');
      R.menu = R.menu === m ? null : m;
      uBulk(); return;
    }
    if (t.hasAttribute('data-tr-settype')) {
      var nt = t.getAttribute('data-tr-settype');
      selIds().forEach(function (id) { var r1 = rowById(id); if (r1) r1.cur.type = nt; });
      R.menu = null; markDirty(); rList(); rCards(); refreshCounts();
      return;
    }
    if (t.hasAttribute('data-tr-setcust')) {
      var vEl = R.root.querySelector('[data-tr-setcust-val]');
      var v = vEl ? vEl.value : '';
      selIds().forEach(function (id) { var r3 = rowById(id); if (r3) r3.cur.customer = v; });
      R.menu = null; markDirty(); rList(); rCards();
      return;
    }
  }

  function onConflictChoice(which) {
    if (!R.conflict) return;
    if (which === 'load' && R.conflict.draft) {
      var key = R.key, rev = R.conflict.rev;
      var keepRoot = R.root, keepPane = R.pane, keepHid = R.hid;
      stateFromDraft(key, R.conflict.draft, rev, new Date().toISOString());
      R.root = keepRoot; R.pane = keepPane; R.hid = keepHid;
      R.active = true;
      rAll(); ensurePdfAndPaint();
    } else {
      /* Keep this one: adopt their rev so the next save wins, then save. */
      R.rev = R.conflict.rev;
      R.conflict = null; R.dirty = true;
      uConflict(); saveDraft(false);
    }
  }

  function onKey(ev) {
    if (!R.active || R.view !== 'pages') return;
    var t = ev.target;
    if (t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (ev.key === 'ArrowLeft' && R.page > 1) { R.page--; rThumbs(); rPage(); rCards(); rSub(); markDirty(); ev.preventDefault(); }
    else if (ev.key === 'ArrowRight' && R.page < R.pages) { R.page++; rThumbs(); rPage(); rCards(); rSub(); markDirty(); ev.preventDefault(); }
  }

  function onHide() {
    if (document.visibilityState === 'hidden' && R.active && R.dirty) flushSave();
  }

  // ══════════════════════════════════════════════════════════
  // CREATE — the write path from ta-print-issues v3.5.2, moved
  // here. 103B v1.2, one op per call, first row alone and checked.
  // ══════════════════════════════════════════════════════════

  /* v1.4.0 — slateType() is gone: 103B v1.3.1 looks every type
     label up in the SLATE schema, so the label is sent as it is. */

  /* v1.4.0 — the name says what a row is (ruled 29 Sept):
       {print issue} · p{page} · {type} · {section} › {title}
     Section is left out when empty or the same as the title. The
     printed title alone is stored in print-title. */
  function composeName(r, page, issueName) {
    var title = String(r.cur.name || '').trim();
    var sec = String(r.cur.section || '').trim();
    var what = sec && sec.toLowerCase() !== title.toLowerCase() ? sec + ' \u203a ' + title : title;
    var parts = [];
    if (issueName) parts.push(issueName);
    if (page) parts.push('p' + page);
    parts.push(TYPE_LABEL[r.cur.type] || r.cur.type || 'Other');
    parts.push(what);
    var n = parts.join(' \u00b7 ');
    return n.length > 250 ? n.slice(0, 249) + '\u2026' : n;
  }

  /* v1.4.0 — the row carries an event to create from it: a ticked
     event item, on a row that is not itself an events page. */
  function alsoEvent(r) {
    if (r.cur.type === 'events-page') return false;
    return !!(r.found && r.found.items.some(function (x) { return x._k !== 're' && x.on; }));
  }

  function makeSlug(name, seen) {
    var stem = slugify(R.source.replace(/\.pdf$/i, '')).slice(0, 24);
    var base = (stem + '-' + slugify(name)).slice(0, 80).replace(/-+$/, '') || (stem + '-row');
    var slug = base, k = 2;
    while (seen[slug]) slug = base + '-' + (k++);
    seen[slug] = 1;
    return slug;
  }

  function fieldDataOf(e, ctx, seen) {
    var r = e.r;
    var page = Number(r.page) || Number(e.pg[0]) || 0;
    var fd = {
      'name': composeName(r, page, ctx.issueName),
      'print-title': r.cur.name.trim(),
      'slug': r.slug || makeSlug(r.cur.name, seen),
      'source': ctx.source,
      'page': page,
      'pdf-page': Number(e.pg[0]) || 0,
      'also-create-event': alsoEvent(r),
      'section': r.cur.section.trim(),
      'byline': r.cur.byline.trim(),
      'suggested-customer': r.cur.customer.trim(),
      'image-count': Number(e.img) || 0,
      'title-admin': ctx.taId,
      'print-issue-name': ctx.issueName,
      'print-issue-pages': ctx.pages,
      'parsed-on': ctx.parsedOn
    };
    if (seen[fd.slug] !== 1) seen[fd.slug] = 1;
    if (ctx.coverUrl) fd['cover-url'] = ctx.coverUrl;
    if (ctx.pdfUrl) fd['print-pdf-url'] = ctx.pdfUrl;
    if (isAdRow(r) && r.adSize) fd['ad-size'] = r.adSize;
    return fd;
  }

  function sendCreate(op) {
    var url = slateWriter();
    var batchId = 'tpr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
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
    /* v1.4.0 — 103B v1.3.1's echo */
    if (!yes(row.typeOk))                           why.push('type "' + (row.typeRequested || '') + '" not stored (found "' + (row.type || '') + '")');
    if (fd['print-pdf-url'] && !yes(row.hasPdfUrl)) why.push('print-pdf-url not stored');
    if (Number(row.pdfPage) !== Number(fd['pdf-page'])) why.push('pdf-page not stored');
    if (fd['ad-size'] && !yes(row.hasAdSize))       why.push('ad-size not stored');
    if (yes(row.alsoCreateEvent) !== fd['also-create-event']) why.push('also-create-event not stored');
    return why;
  }

  /* v1.4.0 — the ledger record for a confirmed row: CMS slugs, Option
     fields as their LABEL (ix-refresh LEDGER CONVENTION). New rows
     start undecided with no plans, which is what 103B's create sets. */
  function ledgerFields(fd, row, type) {
    var f = {};
    for (var k in fd) if (Object.prototype.hasOwnProperty.call(fd, k)) f[k] = fd[k];
    f['type'] = row.type || type;
    f['disposition'] = 'undecided';
    f['publication-plans'] = [];
    f['self-slate-item-id'] = row.id;
    return f;
  }

  function wOverlay() { return document.querySelector('.tpr-write-ov'); }
  function removeWOverlay() {
    var o = wOverlay(); if (o) o.parentNode.removeChild(o);
  }
  function rWrite() {
    var W = R.W; if (!W) { removeWOverlay(); return; }
    var o = wOverlay();
    if (!o) {
      o = document.createElement('div');
      o.className = 'ix-overlay tpr-write-ov';
      o.innerHTML = '<div class="ix-modal tpr-write-modal" role="dialog" aria-modal="true"></div>';
      document.body.appendChild(o);
      o.addEventListener('click', function (ev) {
        var t = ev.target.closest && ev.target.closest('[data-tr-w]');
        if (!t) return;
        ev.preventDefault();
        var act = t.getAttribute('data-tr-w');
        if (act === 'finish') { finish(); return; }
        if (act === 'back')   { R.W = null; removeWOverlay(); return; }
        if (act === 'close')  { R.W = null; removeWOverlay(); close(); return; }
        if (act === 'go')     { R.W = null; removeWOverlay(); startCreate(true); return; }
      });
    }
    var m = o.querySelector('.ix-modal');
    var sub, body, foot;
    if (W.phase === 'confirm') {
      var ck = checkedCount();
      sub = 'Before it goes to the Allocator';
      body = '<p>You\u2019ve checked <b>' + ck + ' of ' + R.pages + ' page' + (R.pages === 1 ? '' : 's') +
          '</b> \u2014 send <b>' + W.total + ' item' + (W.total === 1 ? '' : 's') + '</b> to the Allocator anyway?</p>' +
        '<p class="tpr-write-hint">Checking is your read-through of each page; nothing requires it. ' +
          'Everything can still be edited in the Allocator afterwards.</p>';
      foot = '<button type="button" class="ix-revert" data-tr-w="back">Go back</button>' +
             '<button type="button" class="ix-btn ix-btn--primary" data-tr-w="go">Send them anyway</button>';
    } else if (W.phase === 'writing') {
      sub = 'Sending to the Allocator';
      body = '<div class="tpr-prog"><span class="tpr-bar"><i style="width:' +
          (W.total ? (W.done / W.total * 100).toFixed(1) : 0) + '%"></i></span>' +
          '<span class="tpr-prog-t">Sending item ' + Math.min(W.done + 1, W.total) + ' of ' + W.total + '</span></div>' +
        '<p class="tpr-write-hint">The first item goes alone and is checked before the rest follow.</p>';
      foot = '';
    } else if (W.phase === 'done') {
      sub = 'Done';
      var dn = W.log.length || sentCount();
      body = '<p><b>' + dn + ' item' + (dn === 1 ? '' : 's') + ' in the Allocator</b> for ' + esc(R.issueName) +
          ', each checked against what Webflow stored. The review draft is deleted.</p>' +
        '<p class="tpr-write-hint">' + (listening()
          ? 'Finish takes you back to Print Issues, with these items already in place.'
          : 'Finish reloads the page to show them: nothing on this page is listening for new rows yet.') +
          ' Individual events and listings from this review follow in a later build step.</p>';
      foot = '<button type="button" class="ix-btn ix-btn--primary" data-tr-w="finish">Finish</button>';
    } else {
      sub = 'Stopped';
      var written = (W.log || []).filter(function (l) { return l.id; });
      body = '<div class="ix-modal-banner tpr-write-warn">' + esc(W.error) + '</div>' +
        (written.length
          ? '<p class="tpr-write-hint">These items are already in the Allocator and may need deleting: ' +
              written.map(function (l) { return esc(l.name) + ' (' + esc(l.id) + ')'; }).join('; ') + '.</p>'
          : '<p class="tpr-write-hint">Nothing was sent to the Allocator. The draft is kept.</p>');
      foot = '<button type="button" class="ix-btn ix-btn--secondary" data-tr-w="back">Back to review</button>';
    }
    m.innerHTML =
      '<div class="ix-modal-bar"></div>' +
      '<div class="ix-modal-head"><div class="ix-modal-title-block">' +
        '<h3 class="ix-modal-title">Send to the Allocator</h3>' +
        '<div class="ix-modal-sub">' + esc(sub) + '</div>' +
      '</div></div>' +
      '<div class="ix-modal-body">' + body + '</div>' +
      (foot ? '<div class="ix-modal-footer"><span style="flex:1 1 auto"></span>' +
        '<span class="ix-modal-footer-right" style="display:flex;align-items:center;gap:14px">' + foot + '</span></div>' : '');
  }

  function startCreate(force) {
    if (R.W && R.W.phase === 'writing') return;
    /* v1.5.0 — the issue name goes onto every row: no name, no Send. */
    if (!String(R.issueName || '').trim()) {
      R.W = { phase: 'error', log: [], error: 'Choose which planned issue this is, under the title at the ' +
              'top of the page, before sending. Nothing was sent.' };
      rWrite(); return;
    }
    if (!slateWriter()) { alert('TA_CONFIG.makeSlateWriter is not set on this page.'); return; }
    var rows = writableEff();
    if (!rows.length) return;
    /* v1.1.0 — soft gate (ruling C): unchecked pages ask first.
       Checking is the operator's read-through, never a lock. */
    if (!force && checkedCount() < R.pages) {
      R.W = { phase: 'confirm', total: rows.length };
      rWrite(); return;
    }
    flushSave();
    R.W = { phase: 'writing', done: 0, total: rows.length, log: [], error: '' };
    rWrite();
    var ctx = {
      source: R.source, taId: R.taId, issueName: String(R.issueName).trim(),
      pages: R.pages, parsedOn: new Date().toISOString(), coverUrl: R.coverUrl,
      pdfUrl: R.pdfUrl
    };
    var seen = {};
    R.rows.forEach(function (r) { if (r.slug) seen[r.slug] = 1; });
    var mine = R;
    rows.reduce(function (chain, e, i) {
      return chain.then(function () {
        var fd = fieldDataOf(e, ctx, seen);
        return sendCreate({ fieldDataJson: JSON.stringify(fd), type: e.r.cur.type, name: fd.name })
          .then(function (row) {
            if (R !== mine) return;
            var why = verifyRow(row, fd);
            var lf = row.id ? ledgerFields(fd, row, e.r.cur.type) : null;
            /* A row that exists is recorded even if its check failed:
               it IS on the board, and the board must show it. */
            if (lf && window.IxRefresh && window.IxRefresh.confirm) window.IxRefresh.confirm('slate', row.id, lf);
            /* v1.5.1 — remember it, and save now: a stop after this
               row must not send it again. */
            if (row.id) { R.sent[e.r.id] = row.id; markDirty(); flushSave(); }
            R.W.log.push({ name: fd.name, id: row.id || '', why: why, fields: lf });
            R.W.done++; rWrite();
            if (why.length) {
              throw new Error((i === 0 ? 'The first row failed its check, so nothing else was written. '
                                       : 'Row ' + (i + 1) + ' failed its check, so the rest were not written. ') +
                              '\u201c' + fd.name + '\u201d: ' + why.join(', ') + '.');
            }
          });
      });
    }, Promise.resolve()).then(function () {
      if (R !== mine) return;
      return deleteDraft().then(function () {
        R.W.phase = 'done'; rWrite();
      });
    }).catch(function (e) {
      if (R !== mine) return;
      R.W.phase = 'error'; R.W.error = String(e.message || e); rWrite();
      /* Rows that exist are announced now, so the board shows them
         even if the operator goes back and closes without Finish. */
      announceWritten();
    });
  }

  // ══════════════════════════════════════════════════════════
  // v1.4.0 · HAND-OFF. No reload unless nothing is listening.
  // ══════════════════════════════════════════════════════════

  function bus() { return window.IxRefresh && window.IxRefresh.emit ? window.IxRefresh : null; }

  /* Is anything on the page going to redraw from our rows? Checked by
     a dry question on the bus, so the done modal can say what Finish
     will do before the operator presses it. */
  function listening() {
    var b = bus(); if (!b) return false;
    return b.emit('slate:listening?', {}) > 0;
  }

  function writtenRows() {
    return ((R.W && R.W.log) || []).filter(function (l) { return l.id && l.fields; })
      .map(function (l) { return { id: l.id, fields: l.fields }; });
  }

  function announceWritten() {
    var b = bus(); if (!b) return 0;
    var rows = writtenRows();
    if (!rows.length || (R.W && R.W.announced)) return rows.length ? 1 : 0;
    var n = b.emit('slate:written', {
      taId: R.taId, source: R.source, issueName: String(R.issueName).trim(), rows: rows
    });
    if (R.W) R.W.announced = n > 0;
    return n;
  }

  function finish() {
    /* v1.5.1 — a Finish with nothing new to announce (everything was
       sent earlier) still needs no reload when a reader is present. */
    var heard = announceWritten() || (listening() ? 1 : 0);
    var b = bus();
    if (b) {
      b.emit('print-review:finished', {
        taId: R.taId, key: R.key, source: R.source,
        issueName: String(R.issueName).trim(), count: writtenRows().length
      });
    }
    if (!heard) {
      /* Honest fallback: nobody redraws from our rows, so a reload is
         the only way the operator sees them. Retires once
         ta-print-issues listens on 'slate:written'. */
      console.warn(TAG, 'no listener on slate:written; reloading to show the new rows.');
      location.reload();
      return;
    }
    R.W = null; removeWOverlay();
    close();
  }

  // ══════════════════════════════════════════════════════════
  // MOUNT · OPEN · RESUME · CLOSE
  // ══════════════════════════════════════════════════════════

  function pane() {
    return document.querySelector('div.w-tab-pane[data-w-tab="PrintIssue"]') ||
           document.querySelector('div.tab-pane-printissue');
  }

  function mount() {
    var p = pane();
    if (!p) return false;
    if (R.root && R.root.parentNode === p) { R.pane = p; return true; }
    var root = document.createElement('div');
    root.className = 'tpr-root';
    root.hidden = true;
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', onIssueChange);   /* v1.5.0 */
    /* v1.2.0 — the card being worked on wears the gold ring; the
       current page's thumbnail wears the same one (CSS pairs them). */
    root.addEventListener('focusin', markActive);
    root.addEventListener('click', markActive);
    /* v1.2.1 — customer suggestions */
    root.addEventListener('focusin', function (e) { if (isCustInput(e.target)) openSug(e.target); });
    root.addEventListener('focusout', function (e) {
      if (isCustInput(e.target)) setTimeout(function () {
        if (document.activeElement !== R.sugFor) closeSug();
      }, 120);
    });
    root.addEventListener('keydown', function (e) {
      if (isCustInput(e.target) && sugKey(e)) e.stopPropagation();
    }, true);
    window.addEventListener('scroll', closeSug, true);
    window.addEventListener('resize', closeSug);
    window.addEventListener('resize', placeCommit);
    p.insertBefore(root, p.firstChild);
    R.root = root; R.pane = p;
    return true;
  }

  function hideSiblings() {
    R.hid = [];
    Array.prototype.forEach.call(R.pane.children, function (ch) {
      if (ch === R.root) return;
      R.hid.push([ch, ch.hidden]);
      ch.hidden = true;
    });
  }
  function showSiblings() {
    (R.hid || []).forEach(function (pair) { pair[0].hidden = pair[1]; });
    R.hid = [];
  }

  function ensurePdfAndPaint() {
    ensurePdf().then(function () {
      if (!R.active) return;
      rPage(); rThumbs();
    }).catch(function () {
      if (!R.active) return;
      rPage();
      if (R.view === 'pages' && !R.pdf && !R.pdfUrl) {
        /* nothing to show as pages — start the operator in the list */
        R.view = 'list'; rHead(); rView(); rList();
      }
    });
  }

  function show() {
    R.active = true;
    hideSiblings();
    R.root.hidden = false;
    skeleton();
    rAll();
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onHide);
    ensurePdfAndPaint();
    try { R.root.scrollIntoView({ block: 'start' }); } catch (x) {}
  }

  /* v1.2.0 — a surface that replaces the board must not inherit
     the board's scroll position. */
  function toTop() {
    try { window.scrollTo(0, 0); } catch (e) {}
    if (R.pane && R.pane.scrollIntoView) {
      try { R.pane.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); } catch (e) {}
    }
  }

  // ── v1.2.1 · Customer suggestions from the CMS ─────────────
  //    Same read the Asset Library and Client Manager use.
  function readCustomers() {
    var out = [], seen = {};
    var items = document.querySelectorAll('.customers-wrapper[data-item="true"]');
    Array.prototype.forEach.call(items, function (el) {
      var name = ((el.dataset && el.dataset.name) || el.getAttribute('data-name') || '').trim();
      if (!name || seen[name.toLowerCase()]) return;
      seen[name.toLowerCase()] = 1;
      out.push(name);
    });
    return out.sort(function (a, b) { return a.localeCompare(b); });
  }

  function isCustInput(t) {
    if (!t || t.tagName !== 'INPUT') return false;
    var f = t.getAttribute('data-tr-f');
    return (f && /:customer$/.test(f)) || t.hasAttribute('data-tr-setcust-val');
  }

  var SUG_MAX = 12;
  function sugEl() { return document.querySelector('.tpr-sug'); }
  function closeSug() {
    var el = sugEl(); if (el) el.parentNode.removeChild(el);
    R.sugFor = null;
  }
  function openSug(input) {
    if (!R.customers) R.customers = readCustomers();
    if (!R.customers.length) return;
    R.sugFor = input;
    fillSug(input);
  }
  function fillSug(input) {
    var q = String(input.value || '').trim().toLowerCase();
    var hits = R.customers.filter(function (n) {
      return !q || n.toLowerCase().indexOf(q) !== -1;
    }).slice(0, SUG_MAX);
    if (!hits.length) { closeSug(); R.sugFor = input; return; }
    var el = sugEl();
    if (!el) {
      el = document.createElement('div');
      el.className = 'tpr-sug';
      el.setAttribute('role', 'listbox');
      /* mousedown, not click: it must win against the input's blur */
      el.addEventListener('mousedown', function (ev) {
        var o = ev.target.closest && ev.target.closest('[data-tr-sug]');
        if (!o) return;
        ev.preventDefault();
        pickSug(o.getAttribute('data-tr-sug'));
      });
      document.body.appendChild(el);
    }
    el.innerHTML = hits.map(function (n, i) {
      return '<button type="button" class="tpr-sug-o' + (i === 0 ? ' tpr-sug-o--cur' : '') +
             '" data-tr-sug="' + esc(n) + '">' + esc(n) + '</button>';
    }).join('');
    var r = input.getBoundingClientRect();
    el.style.left = r.left + 'px';
    el.style.top = (r.bottom + 2) + 'px';
    el.style.minWidth = r.width + 'px';
  }
  function pickSug(name) {
    var input = R.sugFor; if (!input) return;
    input.value = name;
    closeSug();
    /* the normal input path: gold border, dirty, autosave */
    var ev;
    try { ev = new Event('input', { bubbles: true }); }
    catch (e) { ev = document.createEvent('Event'); ev.initEvent('input', true, true); }
    input.dispatchEvent(ev);
    input.focus();
  }
  function sugKey(e) {
    var el = sugEl(); if (!el || !R.sugFor) return false;
    var opts = el.querySelectorAll('[data-tr-sug]');
    var cur = el.querySelector('.tpr-sug-o--cur');
    var i = Array.prototype.indexOf.call(opts, cur);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      var n = e.key === 'ArrowDown' ? Math.min(i + 1, opts.length - 1) : Math.max(i - 1, 0);
      if (cur) cur.classList.remove('tpr-sug-o--cur');
      opts[n].classList.add('tpr-sug-o--cur');
      opts[n].scrollIntoView({ block: 'nearest' });
      return true;
    }
    if (e.key === 'Enter' && cur) { e.preventDefault(); pickSug(cur.getAttribute('data-tr-sug')); return true; }
    if (e.key === 'Escape') { closeSug(); return true; }
    return false;
  }

  function markActive(e) {
    var card = e.target && e.target.closest && e.target.closest('[data-tr-card]');
    if (!card) return;
    var id = card.getAttribute('data-tr-card');
    if (id === R.activeId) return;
    R.activeId = id;
    var all = R.root ? R.root.querySelectorAll('.tpr-card--active') : [];
    Array.prototype.forEach.call(all, function (c) { c.classList.remove('tpr-card--active'); });
    card.classList.add('tpr-card--active');
  }

  function open(handoff) {
    if (!mount()) { console.error(TAG, 'no PrintIssue pane found; cannot open.'); return false; }
    if (R.active) close();
    var keepRoot = R.root, keepPane = R.pane;
    stateFromHandoff(handoff || {});
    R.root = keepRoot; R.pane = keepPane;
    show();
    toTop();
    R.customers = null;   /* v1.2.1 — reread the CMS list per open */
    R.dirty = true;              /* first save records the handoff */
    saveDraft(false);
    console.log(TAG, 'open \u00b7 ' + R.rows.length + ' rows \u00b7 ' + R.pages + ' pages \u00b7 key ' + R.key);
    return true;
  }

  function resume(key) {
    if (!mount()) { console.error(TAG, 'no PrintIssue pane found; cannot resume.'); return Promise.resolve(false); }
    return loadDraft(key).then(function (j) {
      if (!j.draft) { console.warn(TAG, 'no saved review under ' + key); return false; }
      if (R.active) close();
      var keepRoot = R.root, keepPane = R.pane;
      stateFromDraft(key, j.draft, j.rev, j.savedAt);
      R.root = keepRoot; R.pane = keepPane;
      show();
      toTop();
      R.customers = null;
      console.log(TAG, 'resumed \u00b7 ' + R.rows.length + ' rows \u00b7 rev ' + R.rev);
      return true;
    }).catch(function (e) {
      console.error(TAG, 'resume failed: ' + (e.message || e));
      return false;
    });
  }

  function close() {
    if (!R.active) return;
    flushSave();
    /* v1.5.0 — Print Issues moves the review into the right row now,
       without waiting for the Worker's list to catch up. */
    if (window.IxRefresh && window.IxRefresh.emit) {
      window.IxRefresh.emit('print-review:closed', { key: R.key, issueName: String(R.issueName || '').trim(),
        checked: checkedCount(), pages: R.pages, source: R.source, savedAt: R.savedAt });
    }
    R.active = false;
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onHide);
    if (R.io) { R.io.disconnect(); R.io = null; }
    removeWOverlay(); R.W = null;
    closeSug();
    removeCommit();
    if (R.pdf) { try { R.pdf.destroy(); } catch (x) {} R.pdf = null; R.pdfP = null; }
    R.thumbCache = {}; R.bigCache = { order: [], map: {} }; R.zoomCache = { order: [], map: {} };
    if (R.root) { R.root.hidden = true; R.root.innerHTML = ''; }
    showSiblings();
  }

  /* The pane is Webflow-rendered; retry like the other tab modules,
     then give up quietly — open() and resume() try again anyway. */
  function boot() {
    if (mount()) return;
    var tries = 0;
    var iv = setInterval(function () {
      if (mount() || ++tries > 30) clearInterval(iv);
    }, 200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.IXPrintReview = {
    version: VERSION,
    /* v1.4.0 — for the console: what this review wrote, as announced */
    written: function () { return writtenRows(); },
    open: open,
    resume: resume,
    close: close,
    isOpen: function () { return !!R.active; }
  };
})();
