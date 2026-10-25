/* ta-create-from-print-v1.2.3.js
   ════════════════════════════════════════════════════════════════
   ta-create-from-print-v1.2.3.js
   INBXIFY TA Studio · Create from print (P1 + P2)
   Companion CSS: ta-create-from-print-v1.1.0.css (unchanged)

   v1.2.3 (25 Oct) — GENERATE WINDOW SIZING; GENERATED PHOTO REACHES THE FORM.
     1. Both photos in the Generate window fill their frames at the same
        scale. They used to show at the crop's own pixel size, so a small
        crop came up as a postage stamp.
     2. The prompt box grows to fit the whole prompt, with no scrolling
        inside it; the print photo's frame gives up the room.
     3. "Use this photo" hands the new MEDIA row to the Asset Form
        (InbxASF.addMedia, ta-asf v1.11.13+), so it is in Add from library
        without a page reload. Build already passes it with its URL;
        ta-asf v1.11.13 now registers it, so it lands in the tray.

   v1.2.2 (25 Oct) — NO SCROLLING TO REACH WHAT MATTERS; READABLE TEXT.
     Jeff: the Missing photo button sat below the page, off screen, and
     the text files were squeezed into small squares.
     1. The whole print page fits its column (no scroll), and "Missing
        photo? Select it on the page" sits in the page bar at the top,
        always in view; gold and primary when print shows more photos
        than were found.
     2. Text files take the full width of the files column, at 15px, with
        up to ~900 characters shown. Photos keep their square tiles.
     3. The tick no longer covers the first letters of a text file.

   v1.2.1 (25 Oct) — FIRST REAL RUN OF v1.2.0, FOUR FIXES.
     1. GENERATE DREW A DIFFERENT SCENE. The prompt told Claude "do NOT
        copy it: change the arrangement, props and people", so a family
        greeting at a front door by a Christmas tree came back as a kitchen
        table. Jeff wants a SIMILAR photo. The prompt now recreates the same
        scene — subject, action, setting, props, season, light, framing —
        with only the people made generic and any text or logos removed.
        Claude also returns what it sees, shown above the prompt, so every
        prompt can be traced to the photo.
     2. GENERATE NOW HAS ITS OWN WINDOW. Large modal over the palette: the
        print crop on the left, what Claude sees + the editable prompt, and
        the result on the right, with a moving placeholder while Flux works
        and the image appearing in its place. Use this photo closes it and
        ticks the photo in the palette.
     3. FIND THE SOURCE DID NOTHING (Google opened and sat there; pasting
        into Google Images is not dependable). The crop is now uploaded to
        Uploadcare (TA_CONFIG.uploadcarePublicKey) and Google Lens opens
        with it already searched (lens.google.com/uploadbyurl).
     4. THE DOONERS GUESS STILL PICKED MILA. In a small pool "meet" was as
        rare as "dooners", and ties went to the first word, so the gate
        demanded "meet". Generic headline words (meet, new, best, guide,
        tips, ways, how, why…) now weigh nothing, and ties go to the
        longer word. window.InbxCreateFromPrint.debug() prints the ranking.
     HARDCODING (provisional)
       HC-P-CFP-21 GENERIC headline word list; Google Lens URL.

   v1.2.0 (24 Oct) — MISSING PHOTOS: FIND THE SOURCE OR GENERATE ONE.
     D-CB-16/17 (Cadence-Board-Scoping v0.2 §07): a photo in print with no
     counterpart in the upload — usually designer-sourced stock — goes to
     Buy or Generate, never back to the publisher.
       · "Missing photo? Select it on the page" under the print page.
         Drag a box around the photo; the crop is cut from the page image.
       · FIND THE SOURCE copies the crop to the clipboard and opens Google
         Images in a new tab; Cmd+V there runs a reverse image search,
         whose results name the agency page to license it from. "Save the
         crop" downloads it for TinEye or any other lookup. No API key.
       · GENERATE A SIMILAR ONE shows the crop to Claude (PIC_MODEL via
         TA_CONFIG.anthropicProxy), which writes a Flux prompt for a photo
         doing the same job — subject, setting, season, mood — in the house
         photographic style, explicitly NOT a copy of the stock image. The
         prompt is editable; Generate runs the fluxgen Worker
         (TA_CONFIG.fluxGen) at the crop's shape. "Use this photo" makes
         an Available MEDIA row through Scenario L (TA_CONFIG.
         makeGenerateMedia, action createGeneratedMedia, provenance
         ai-flux-2-pro + prompt + "similar to print"), then ticks it here,
         so Build hands it to the form like any Intake photo.
     Styles for this block are injected by this file (no CSS bump).
     HARDCODING (provisional)
       HC-P-CFP-20 Flux long edge 1440, aspect clamp 1:2..2:1, grid 16;
                   minimum crop 40 px; Google Images URL for the lookup.

   v1.1.5 (24 Oct) — v1.1.4 STILL GUESSED MILA. Why: the four Dooner
     photos were loose files ("Dooner cover photo", "Dooner dogs"…), each
     counted as its own bundle, so "dooner" looked common (5 bundles)
     and the rarity weighting worked against the right word.
       · Rarity is now counted over bundles that hold TEXT only — the
         stories competing for the headline — not over loose photos.
       · The guess must contain the headline's most distinctive word.
         A text bundle that misses it (Mila has no "Dooners") has its
         headline score halved, so a shared "Meet" can never win.
       · Photo-only bundles and loose photos can no longer be "My guess".
         Instead, any of them whose file name matches the headline
         (60%+ on the distinctive words) is ticked alongside the guess,
         reason "File name matches the headline"; the picture pass then
         confirms or questions them as before.
     HARDCODING (provisional)
       HC-P-CFP-19 gate penalty 0.5; photo file-name match 0.6.

   v1.1.4 (24 Oct) — THE GUESS GOES BY THE DISTINCTIVE WORDS.
     "Meet The Dooners" was matched to the "Meet Mila" bundle: every
     headline word counted the same, so "Meet" alone made Mila and the
     Dooners score 0.5 each, and Lynn Bruggemann writes both columns.
     Ruled by Jeff 24 Oct: match on the distinctive words, fuzzily;
     common words like "Meet" must not decide it.
       · Each headline word is weighted by how rare it is in this
         title's Intake pool (inverse document frequency over each
         bundle's label, file names and text openings, squared). A word in many
         bundles ("meet", "neighbors") weighs almost nothing; a word in
         one ("dooners", "mila") carries the match.
       · Fuzzy: a word matches another at 80%+ letter similarity after a
         trailing "s" is dropped, scored by that similarity, so
         Dooner / Dooners / Dooners' all match.
       · The v1.1.1 boilerplate words and the title's own name still
         count zero. Weights and the byline / photo terms are unchanged.
     HARDCODING (provisional)
       HC-P-CFP-18 FUZZY_MIN 0.8, IDF floor 0.05.

   v1.1.3 (24 Oct) — THE PALETTE NOW REALLY HIDES WHEN THE FORM OPENS.
     "Build the article" opened the Asset Form underneath the palette,
     so it looked as if nothing happened. The palette is an .ix-overlay,
     and ix-modals v1.0.3 gives .ix-overlay display:flex !important at
     z-index 99999; hide() set display:none without !important, so it
     lost and the palette stayed on top of the form (z-index 10000).
     hide() now sets display none with !important and show() removes it.
     Found on the first real run (WLN November 2026, Meet The Dooners).

   v1.1.2 (13 Oct) — "SET IT ON THE ARTICLE" FROM THE PICKER.
     Ruled by Jeff 13 Oct: the Section is set only on the Article form.
     The Picker (ipp-picker v1.34) shows an article with no Section as
     "No Section · Set it on the article". When the ASF is not on the
     PubPlan page, that link comes here:
       ?ipp_edit=<ARTICLES id>&ipp_ret=<plan page path>
     This file opens that article in the ASF (mode edit) and, when the
     form closes (saved or not), goes back to ipp_ret. The return is
     same-site only (safeReturn). Nothing else in this file changed.
     No new hardcoding.

   v1.1.1 (8 Oct) — three faults from the first live run ("Dear Wyckoff
     Living Readers", p.5):
     1. OPENED ON THE COVER. Rows from issues built the old way have no
        pdf-page, and the palette fell straight to page 1. It now falls
        back to the printed page, exactly as the Allocator's own page
        button does (pdfPage, else page, else 1) — for the view, the
        picture pass and the printSource handed to the ASF.
     2. PHOTO CHECK REFUSED: "media_type should be image/jpeg, png, gif
        or webp". Intake images can arrive as other types (image/jpg,
        heic, avif, an untyped blob). Every candidate is now redrawn to
        a JPEG no wider than PIC_IMG_W before it is sent, which also
        keeps the request small. One image that cannot be drawn is left
        out; it no longer sinks the whole check.
     3. WRONG BUNDLE ("CAFS_July 2026", "Headline close to print"). The
        Word exports all begin with the publication's own name, so a
        printed headline containing that name ("Dear Wyckoff Living
        Readers") looked close to every bundle. Words that open most
        bundles in the pool (in 3+ bundles and 40%+ of them), and the
        words of TA_CONFIG.titleName when set, are now ignored when
        comparing headlines. Data-driven; no title is named in code.
     HARDCODING (provisional)
       HC-P-CFP-17 PIC_IMG_W 1024 px, JPEG quality 0.85; boilerplate
                   threshold 3 bundles and 40% of bundles.

   v1.1.0 (8 Oct) — P2 · THE PICTURE PASS. After the text match proposes
     a bundle, the palette shows the print page and the candidate photos
     to Claude (TA_CONFIG.anthropicProxy, PIC_MODEL) and asks which of
     those photos actually appear in the printed article and which is the
     lead. It SHARPENS the text proposal, never overrides it:
       · a candidate image the model says is in print, and was not already
         proposed, is added and ticked, reason "appears in print";
       · the one it calls the lead is noted ("lead photo in print");
       · a proposed image the model says is NOT on the page keeps its tick
         (the operator decides) but its reason says "not seen on this page";
       · the "Print shows N, M found" line now counts what the model saw,
         so a real shortfall is honest.
     The pass runs once, on the pages the print item spans (its pdfPage,
     plus the next if the print item lists two). It is best-effort: no
     proxy, no pager, an error or a slow reply all leave the text proposal
     exactly as it was, with a small "couldn't check the photos" note. A
     tiny "Re-check photos" link reruns it. Nothing is sent to build until
     the operator clicks, as before.
     HARDCODING (provisional)
       HC-P-CFP-16 PIC_MODEL 'claude-sonnet-4-6' (the model ta-image-gen
                   uses for vision), PIC_W 1200 px page render, PIC_MAX 12
                   candidate images per call.

   v1.0.3 (8 Oct) — LINK EXISTING ARTICLES, A WHOLE ISSUE AT ONCE.
     Jeff, yes: the October 2026 issue was built the old way, so about
     15 print items have articles nothing points at. One Create at a time
     is too slow for that.
       InbxCreateFromPrint.linkMany({ rows, linkedIds, issueName, onDone })
         rows       [{ id, printTitle, page }]  print items with no article
         linkedIds  article ids already linked to some print item (left
                    out, so one article is never linked twice)
         onDone     ({ linked: [{ allocId, articleId }] }) after a save
     The panel reads this title's articles (the same check v1.0.2 does for
     one row), pairs each print item with its best article, strongest
     pairs first, each article used once. Pairs scoring STRONG_AT or
     better start ticked. Each row's dropdown offers its other candidates
     or "No match". Anything changed from the first guess turns gold;
     "Back to the matches" undoes it. Two rows naming the same article
     stop the save and say which. Save sends one 103B "link" batch (the
     route the Picker and Create use), checks every row's read-back
     (written value = the article), and closes only when all landed.
     Rows that failed stay ticked with their reason, for Try again.
     HARDCODING (provisional)
       HC-P-CFP-15 STRONG_AT 0.9 (start ticked), LM_CHOICES 5 per row,
                   batch URL ceiling 1800 (same as the Picker).

   v1.0.2 (8 Oct) — LOOK FOR THE ARTICLE BEFORE BUILDING ONE.
     LIVE (Jeff, October 2026 issue): Create on "Meet Frank And Carol
     Floriani" offered to build an article that already exists. The
     October articles were made the old way, before print items could
     point at them, so the row's Asset exists cell is empty even though
     the article is there.
     Ruling 6 Oct: a title match against an unlinked allocation offers
     to link it. Now the palette checks first:
       · It reads this title's articles from the asset-list Worker
         (TA_CONFIG.assetListUrl, /list?type=article, fresh) and scores
         each name against the printed headline, both ways round.
       · Matches (up to 3) show at the top of the files column: name,
         date, Draft if a draft, and "Link this one". Linking sends the
         same 103B link (and, from a Picker tile, the 124 fill) with the
         same read-back, then closes. No article is built.
       · "None of these, build a new one" puts the matches away.
       · No assetListUrl, or the list fails: the palette says the check
         did not run, and building still works.
     HARDCODING (provisional)
       HC-P-CFP-14 EXISTING_AT 0.6 match floor, EXISTING_MAX 3 shown;
                   'associated-title' as the ARTICLES title reference.

   v1.0.1 (8 Oct, P1.5) — the Asset Form gets the print page too. The
     palette passes open({ printSource }) so "Compare with print" is
     there from the first moment of a new article (ta-asf v1.11.8).
     Older ta-asf ignores the extra key. Nothing else changed.

   v1.0.0 (8 Oct) — first build.
   Scope: Create-From-Print-Scoping-v0_1.md (8 Oct 2026)

   WHAT IT DOES
     One Create action for a printed item that has no article yet.
     The print item is the answer key. Intake is the content. Nothing
     from print is poured into the article.

       1. Match    Propose the Intake files that belong to this item
                   (text match only in P1: title, byline, photo count).
       2. Confirm  The print page large on the left, the proposed files
                   large on the right, ticked. Untick, tick, and add
                   misses from "Show more from Intake".
       3. Build    Open the ASF seeded from the ticked files, exactly as
                   Intake's "make an article from these" does.
       4. Write    When the article is created: Scenario 103B links the
                   print item to it; from a Picker tile, Scenario 124
                   puts it in that tile. Read back from the Data Worker.
       5. Return   Back to where Create was clicked.

   ENTRY POINTS
     · Allocator row (same page):
         InbxCreateFromPrint.open({ allocation: {...}, origin:'allocator',
                                    onDone: fn })
     · Picker tile (plan page): the Picker sends the operator here with
         ?cfp_alloc=<allocation id>&cfp_plan=<plan id>&cfp_slot=<NL-BLOCKS id>
         &cfp_ret=<plan page path>
       This file reads those on load, reads the plan board for the
       allocation, and opens the palette. The params are removed from the
       address bar at once so a reload does not reopen it.

   NEEDS ON THE T-A PAGE
     TA_CONFIG.makeBundles      Scenario I (the Intake pool)
     TA_CONFIG.makeSlateWriter  Scenario 103B (the link)
     TA_CONFIG.makeBlockWriter  Scenario 124 (the tile fill, Picker only)
     TA_CONFIG.planBoard        Data Worker /plan-board, full URL. If
                                absent, derived from TA_CONFIG.planList
                                (/plans -> /plan-board), HC-P-CFP-6.
     TA_CONFIG.taItemId         the title, to keep the pool to its files
     ta-asf v1.11.7+            for afterCreate / onClosed / noWorkbench
     ix-pdf-pager v1.0.0+       to render the print page
     Data Worker v1.0.19+       for byline and image count on allocations

   HARDCODING (provisional ids; the doc chat allocates real numbers)
     HC-P-CFP-2  ALSO_POSSIBLE = 3 bundles ranked under the proposal
     HC-P-CFP-3  the pool is the title's waiting files (not attached,
                 not archived). Platform rule.
     HC-P-CFP-4  palette wording (module strings below)
     HC-P-CFP-5  PRINT_W = 1100 px render width for the print page
     HC-P-CFP-6  /plans -> /plan-board when TA_CONFIG.planBoard is unset
     HC-P-CFP-7  LINK_FIELD_FALLBACK 'asset-article', used only when no
                 plan board names linkFields.article (Allocator path)
     HC-P-CFP-8  match weights 0.6 title / 0.25 byline / 0.15 photos,
                 PROPOSE_AT 0.35
     HC-P-CFP-9  MEDIA option-id fallbacks, the same documented values
                 ta-cadence-board uses; TA_CONFIG.optionIds wins
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.InbxCreateFromPrint) return;

  var VERSION = '1.2.3';
  var FILE = 'ta-create-from-print-v1.2.3.js';
  var PIC_IMG_W = 1024, PIC_JPEG_Q = 0.85, BOILER_MIN = 3, BOILER_SHARE = 0.4;   // HC-P-CFP-17
  var PIC_MODEL = 'claude-sonnet-4-6', PIC_W = 1200, PIC_MAX = 12;   // HC-P-CFP-16
  var STRONG_AT = 0.9, LM_CHOICES = 5;   // HC-P-CFP-15
  var EXISTING_AT = 0.6, EXISTING_MAX = 3;   // HC-P-CFP-14
  var ART_TITLE_FIELD = 'associated-title';  // HC-P-CFP-14
  var TAG = '[cfp v' + VERSION + ']';

  var ALSO_POSSIBLE = 3;                    // HC-P-CFP-2
  var PRINT_W = 1100;                       // HC-P-CFP-5
  var LINK_FIELD_FALLBACK = 'asset-article';// HC-P-CFP-7
  var W_TITLE = 0.6, W_BYLINE = 0.25, W_PHOTOS = 0.15, PROPOSE_AT = 0.35;   // HC-P-CFP-8
  var BATCH_URL_CEILING = 1800;
  var RESULT_KEY = 'ix.cfp.result';         // read by ipp-picker v1.30 on return

  var MEDIA_TYPE_HASH = {                   // HC-P-CFP-9
    image: 'be8534c8e7579ff07ffbd6032f3a4bf7',
    video: '37581cd40911a2cc7b5f2913e3aeba71',
    audio: '97bef53fbe76af04c395e1d9e0419de1',
    text:  '5332c884efac157407557cf3efd387b7'
  };
  var MEDIA_STATUS_HASH = {
    attached: '33d44ad5cec9780f6aacd259c4a44fbc',
    archived: '57a4f54ecb4035d3c5b706222e82dee5'
  };
  var STOP = { the:1, a:1, an:1, and:1, of:1, to:1, in:1, for:1, on:1, at:1, with:1, by:1, is:1, are:1, our:1, your:1, from:1 };

  /* ── helpers ─────────────────────────────────────────────── */
  function cfg() { return window.TA_CONFIG || {}; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function optId(group, key, fallback) {
    var m = (cfg().optionIds && cfg().optionIds[group]) || {};
    return m[key] || fallback;
  }
  function kindOf(fd) {
    var raw = (fd && fd['media-type']) || '';
    if (raw === optId('mediaType', 'text', MEDIA_TYPE_HASH.text)) return 'text';
    if (raw === optId('mediaType', 'image', MEDIA_TYPE_HASH.image)) return 'image';
    if (raw === optId('mediaType', 'video', MEDIA_TYPE_HASH.video)) return 'video';
    if (raw === optId('mediaType', 'audio', MEDIA_TYPE_HASH.audio)) return 'audio';
    return 'other';
  }
  function isWaiting(fd) {
    var st = fd && fd.status;
    return st !== optId('mediaStatus', 'attached', MEDIA_STATUS_HASH.attached) &&
           st !== optId('mediaStatus', 'archived', MEDIA_STATUS_HASH.archived);
  }
  function plainText(html) {
    var d = document.createElement('div');
    d.innerHTML = String(html || '');
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function parseMeta(raw) {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try { var o = JSON.parse(raw); return (o && typeof o === 'object') ? o : {}; } catch (e) { return {}; }
  }
  // v1.2.1 — headline words that never identify a story.   HC-P-CFP-21
  var GENERIC = { meet:1, new:1, best:1, top:1, guide:1, tips:1, ways:1, how:1, why:1, what:1, when:1, where:1, who:1,
    all:1, about:1, more:1, get:1, make:1, can:1, will:1, you:1, my:1, we:1, us:1, this:1, that:1, it:1, its:1, i:1,
    do:1, dont:1, s:1, part:1, one:1, two:1, three:1, five:1, ten:1, things:1, need:1, know:1, look:1, inside:1 };
  function words(s) {
    return String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ')
      .trim().split(' ').filter(function (w) { return w && !STOP[w]; });
  }
  // Share of the printed title's words found in s. 1 = every word.
  function titleSim(printTitle, s) {
    var p = words(printTitle), q = words(s);
    if (!p.length || !q.length) return 0;
    if (p.join(' ') === q.join(' ')) return 1;
    var set = {}; q.forEach(function (w) { set[w] = 1; });
    var hit = p.filter(function (w) { return set[w]; }).length;
    return hit / p.length;
  }
  // v1.1.1 — the PDF page to open: the stored pdf-page, else the printed
  // page (issues built before pdf-page existed), else the cover. Same
  // order as the Allocator's own page button.
  function startPage(al) {
    al = al || {};
    return Number(al.pdfPage) || Number(String(al.page == null ? '' : al.page).split('-')[0]) || 1;
  }
  // v1.1.1 — headline similarity that ignores boilerplate words.
  // v1.1.4 — rarity-weighted, fuzzy headline match. S.idf holds each
  // word's weight for this pool (built in match()); words missing from
  // it are as rare as they come. Ignored words weigh nothing.
  var FUZZY_MIN = 0.8, IDF_FLOOR = 0.05;   // HC-P-CFP-18
  function stem(w) { return w.length > 3 ? w.replace(/'?s$/, '') : w; }
  function lev(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length, prev = [], cur, i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur = [i];
      for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  function wordSim(a, b) {
    a = stem(a); b = stem(b);
    if (a === b) return 1;
    if (a.length < 4 || b.length < 4) return 0;   // short words must match exactly
    var r = 1 - lev(a, b) / Math.max(a.length, b.length);
    return r >= FUZZY_MIN ? r : 0;
  }
  function idfOf(w) {
    if (GENERIC[w]) return 0;   // v1.2.1
    var t = S && S.idf;
    if (!t) return 1;
    var k = stem(w);
    return t.w[k] != null ? t.w[k] : t.max;
  }
  function titleSimX(printTitle, s, ignore) {
    ignore = ignore || {};
    var p = words(printTitle).filter(function (w) { return !ignore[w]; });
    var q = words(s).filter(function (w) { return !ignore[w]; });
    if (!p.length || !q.length) return 0;
    if (p.join(' ') === q.join(' ')) return 1;
    var tot = 0, got = 0;
    p.forEach(function (w) {
      var wt = idfOf(w), best = 0;
      q.forEach(function (x) { var m = wordSim(w, x); if (m > best) best = m; });
      tot += wt; got += wt * best;
    });
    if (!tot) {   // v1.2.1 — every word generic: fall back to plain share
      var hit = 0; p.forEach(function (w) { if (q.some(function (x) { return wordSim(w, x) > 0; })) hit++; });
      return hit / p.length;
    }
    return got / tot;
  }
  var GATE_PENALTY = 0.5, PHOTO_NAME_MIN = 0.6;   // HC-P-CFP-19
  function hasText(g) { return g.files.some(function (f) { return f.kind === 'text'; }); }
  // The headline's most distinctive word (highest weight), after ignores.
  function keyWord(printTitle, ignore) {
    var best = '', bw = -1;
    words(printTitle).forEach(function (w) {
      if (ignore && ignore[w]) return;
      var x = idfOf(w); if (x > bw || (x === bw && w.length > best.length)) { bw = x; best = w; }   // v1.2.1 ties → longer
    });
    return best;
  }
  function hasWord(heads, w) {
    if (!w) return true;
    return heads.some(function (h) { return words(h).some(function (x) { return wordSim(w, x) > 0; }); });
  }
  function groupHeads(g) {
    var heads = [g.label];
    g.files.forEach(function (f) {
      if (f.kind !== 'text') { heads.push(f.name); return; }
      if (f.meta.title) heads.push(f.meta.title);
      heads.push(f.text.slice(0, 140));
    });
    return heads;
  }
  function buildIdf(groups) {
    var df = {}, n = groups.length || 1;
    groups.forEach(function (g) {
      var seen = {};
      groupHeads(g).forEach(function (h) { words(h).forEach(function (w) { seen[stem(w)] = 1; }); });
      for (var k in seen) df[k] = (df[k] || 0) + 1;
    });
    var w = {}, max = Math.log(n + 1);
    // Squared, so a word in one bundle clearly outweighs one in a few.
    for (var k in df) { var v = Math.max(IDF_FLOOR, Math.log((n + 1) / (df[k] + 0.5))); w[k] = v * v; }
    return { w: w, max: Math.max(max * max, IDF_FLOOR) };
  }
  function boilerplate(groups) {
    var ig = {};
    var c = cfg();
    words(c.titleName || c.title || '').forEach(function (w) { ig[w] = 1; });
    if (groups.length >= BOILER_MIN) {
      var df = {};
      groups.forEach(function (g) {
        var seen = {};
        g.files.forEach(function (f) {
          if (f.kind !== 'text') return;
          words(f.text.slice(0, 140)).forEach(function (w) { seen[w] = 1; });
        });
        for (var w in seen) df[w] = (df[w] || 0) + 1;
      });
      for (var k in df) if (df[k] >= BOILER_MIN && df[k] / groups.length >= BOILER_SHARE) ig[k] = 1;
    }
    return ig;
  }
  function lastName(byline) {
    var w = words(byline);
    return w.length ? w[w.length - 1] : '';
  }
  function boardUrl() {
    var c = cfg();
    if (c.planBoard) return c.planBoard;
    if (c.planList) return String(c.planList).replace(/\/plans(\?.*)?$/, '/plan-board');   // HC-P-CFP-6
    return '';
  }
  function getJSON(url) {
    return fetch(url, { method: 'GET', credentials: 'omit' }).then(function (r) {
      return r.text().then(function (t) {
        var j; try { j = JSON.parse(t); } catch (e) { throw new Error('the reply was not JSON (HTTP ' + r.status + ')'); }
        if (!r.ok || (j && j.ok === false)) throw new Error((j && j.error) || ('HTTP ' + r.status));
        return j;
      });
    });
  }
  function readBoard(planId) {
    var base = boardUrl();
    if (!base) return Promise.reject(new Error('this page has no TA_CONFIG.planBoard (or planList) address for the Data Worker'));
    return getJSON(base + (base.indexOf('?') < 0 ? '?' : '&') + 'planId=' + encodeURIComponent(planId) + '&fresh=1');
  }
  function batchUrl(url, op, batchId, ops) {
    return url + (url.indexOf('?') < 0 ? '?' : '&') + 'op=' + encodeURIComponent(op) +
      '&batchId=' + encodeURIComponent(batchId) + '&batch=' + encodeURIComponent(JSON.stringify({ ops: ops }));
  }
  // One op per call here; the URL ceiling is checked for safety.
  function sendOne(url, op, oneOp, who) {
    var u = batchUrl(url, op, 'cfp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), [oneOp]);
    if (u.length > BATCH_URL_CEILING * 4) return Promise.reject(new Error(who + ': the request is too long'));
    return fetch(u, { method: 'GET', credentials: 'omit' }).then(function (r) {
      return r.text().then(function (t) {
        if (!r.ok) throw new Error(who + ' answered HTTP ' + r.status);
        var b; try { b = JSON.parse(t); } catch (e) { throw new Error(who + ' sent a reply that is not JSON'); }
        var rows = (b && b.results) || [];
        return rows[0] || null;
      });
    });
  }

  /* ── state ───────────────────────────────────────────────── */
  var S = null;
  function fresh(job) {
    return {
      job: job,                 // { allocation, planId, slotId, returnUrl, origin, onDone }
      board: job.board || null, // plan board, Picker path
      pool: { loading: true, error: '', files: [], groups: [] },
      ranked: [],               // [{ group, score, reasons }]
      proposal: {},             // id -> true, the guess
      picked: {},               // id -> true, what the operator has now
      reasons: {},              // id -> short reason
      found: 0,                 // proposed photos
      showMore: false, q: '',
      page: startPage(job.allocation),
      pageImg: {}, pageErr: '',
      pic: { state: 'idle', err: '', inPrint: {}, lead: '', note: {} },   // v1.1.0 picture pass
      anchor: null,
      write: null,              // last write-back result
      existing: { loading: true, err: '', items: [], dismissed: false },   // v1.0.2
      root: null
    };
  }

  /* ── 1 · the pool and the match ──────────────────────────── */
  function loadPool() {
    var url = cfg().makeBundles;
    if (!url) { S.pool = { loading: false, error: 'This page has no TA_CONFIG.makeBundles address (Scenario I), so Intake cannot be read.', files: [], groups: [] }; draw(); return; }
    if (!cfg().titleSlug) { S.pool = { loading: false, error: 'TA_CONFIG.titleSlug is missing, so Intake cannot be read.', files: [], groups: [] }; draw(); return; }
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titleSlug: cfg().titleSlug }) })
      .then(function (r) { if (!r.ok) throw new Error('Scenario I answered HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        if (!d || d.ok !== true) throw new Error('Scenario I did not answer ok');
        var tenant = cfg().taItemId || (d.tenant && d.tenant.titleAdminId) || '';
        var all = [].concat(Array.isArray(d.media) ? d.media : [], Array.isArray(d.mediaExtra) ? d.mediaExtra : []);
        var files = [];
        all.forEach(function (m) {
          var fd = (m && m.fieldData) || {};
          if (!m || !m.id) return;
          if (tenant && fd['title-admin'] !== tenant) return;   // this title's files only
          if (!isWaiting(fd)) return;                           // HC-P-CFP-3
          var meta = parseMeta(fd['source-metadata']);
          var html = fd['html-content'] || '';
          files.push({
            id: m.id, kind: kindOf(fd), name: fd.name || fd['original-filename'] || 'File',
            imageUrl: fd['image-url'] || (fd.image && fd.image.url) || '',
            html: html, text: kindOf(fd) === 'text' ? plainText(html).slice(0, 600) : '',
            meta: meta, metaRaw: fd['source-metadata'] || '',
            bundleId: fd['bundle-id'] || '', bundleLabel: fd['bundle-label'] || '',
            fd: fd
          });
        });
        S.pool = { loading: false, error: '', files: files, groups: groupFiles(files) };
        match();
        draw();
      })
      .catch(function (e) {
        S.pool = { loading: false, error: 'Could not read Intake: ' + ((e && e.message) || e) + '. Try again.', files: [], groups: [] };
        draw();
      });
  }
  // v1.0.2 — is there already an article for this print item?
  function refList(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(function (x) { return (x && x.id) || x; });
    return [(v && v.id) || v];
  }
  function loadExisting() {
    var base = cfg().assetListUrl, ta = cfg().taItemId;
    if (!base || !ta) { S.existing = { loading: false, err: 'The check for an existing article did not run (no TA_CONFIG.assetListUrl).', items: [], dismissed: false }; draw(); return; }
    var url = String(base).replace(/\/+$/, '') + '/list?type=article&title=' + encodeURIComponent(ta) + '&fresh=1';
    fetch(url, { method: 'GET' }).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = JSON.parse(t); } catch (e) {}
        if (!r.ok || !j || j.error) throw new Error((j && j.error) || ('HTTP ' + r.status));
        return j;
      });
    }).then(function (j) {
      if (!S) return;
      var pt = S.job.allocation.printTitle;
      var items = (j.items || []).filter(function (it) {
        return refList((it.fieldData || {})[ART_TITLE_FIELD]).indexOf(ta) >= 0 && !it.isArchived;
      }).map(function (it) {
        var name = String((it.fieldData || {}).name || '');
        var sc = (titleSim(pt, name) + titleSim(name, pt)) / 2;
        return { id: it.id, name: name, score: sc, isDraft: !!it.isDraft, at: it.createdOn || it.lastUpdated || '' };
      }).filter(function (x) { return x.name && x.score >= EXISTING_AT; })
        .sort(function (a, b) { return b.score - a.score; }).slice(0, EXISTING_MAX);
      S.existing = { loading: false, err: '', items: items, dismissed: false, truncated: !!j.truncated };
      draw();
    }).catch(function (e) {
      if (!S) return;
      S.existing = { loading: false, err: 'The check for an existing article failed (' + ((e && e.message) || e) + '). You can still build one.', items: [], dismissed: false };
      draw();
    });
  }
  function existingHtml() {
    var X = S.existing;
    if (!X || X.dismissed) return '';
    if (X.loading) return '<div class="cfp-exist cfp-exist--quiet"><span class="cfp-stars" aria-hidden="true"><i></i><i></i><i></i></span>Checking for an article that already exists\u2026</div>';
    if (X.err) return '<div class="cfp-exist cfp-exist--quiet">' + esc(X.err) + '</div>';
    if (!X.items.length) return '';
    var rows = X.items.map(function (it) {
      var d = it.at ? String(it.at).slice(0, 10) : '';
      return '<div class="cfp-exist-row"><span class="cfp-exist-name">' + esc(it.name) + '</span>' +
        '<span class="cfp-exist-meta">' + esc([d, it.isDraft ? 'Draft' : ''].filter(Boolean).join(' \u00b7 ')) + '</span>' +
        '<button type="button" class="ix-btn ix-btn--primary" data-cfp-link="' + esc(it.id) + '">Link this one</button></div>';
    }).join('');
    return '<div class="cfp-exist"><div class="cfp-exist-h">' +
      (X.items.length === 1 ? 'This article may already exist.' : 'One of these articles may already be this one.') +
      ' Link it instead of building a new one.</div>' + rows +
      '<button type="button" class="ix-revert" data-cfp-nolink>None of these, build a new one</button></div>';
  }
  function linkExisting(id) {
    var it = (S.existing.items || []).filter(function (x) { return x.id === id; })[0];
    if (!it || (S.write && S.write.busy)) return;
    S.write = { articleId: id, ok: null, mode: 'link', busy: true };
    draw();
    writeBack(id).then(function (r) {
      S.write.busy = false;
      if (r && r.ok) finish('Linked \u201c' + it.name + '\u201d to its print item' + (S.write.placed ? ' and placed it in its tile.' : '.'));
      else { draw(); toast(S.write.error, 'err'); }
    });
  }

  function groupFiles(files) {
    var by = {}, out = [];
    files.forEach(function (f) {
      var k = f.bundleId ? 'b:' + f.bundleId : 'f:' + f.id;
      if (!by[k]) { by[k] = { key: k, label: f.bundleId ? (f.bundleLabel || f.bundleId) : f.name, loose: !f.bundleId, files: [] }; out.push(by[k]); }
      by[k].files.push(f);
    });
    var order = { text: 1, image: 2, video: 3, audio: 4, other: 5 };
    out.forEach(function (g) { g.files.sort(function (a, b) { return (order[a.kind] || 9) - (order[b.kind] || 9); }); });
    return out;
  }
  function scoreGroup(g, al) {
    var heads = groupHeads(g);   // v1.1.4
    var t = 0; heads.forEach(function (h) { t = Math.max(t, titleSimX(al.printTitle, h, S.ignore)); });
    if (t < 0.99 && !hasWord(heads, S.key)) t *= GATE_PENALTY;   // v1.1.5
    var by = 0, ln = lastName(al.byline);
    if (ln) {
      g.files.forEach(function (f) {
        if (f.kind !== 'text') return;
        var hay = words((f.meta.byLine || '') + ' ' + f.text.slice(0, 400)).join(' ');
        if ((' ' + hay + ' ').indexOf(' ' + ln + ' ') >= 0) by = 1;
      });
    }
    var imgs = g.files.filter(function (f) { return f.kind === 'image'; }).length;
    var ph = 0, want = Number(al.imageCount) || 0;
    if (want && imgs) ph = 1 - Math.min(1, Math.abs(want - imgs) / Math.max(want, imgs));
    var score = W_TITLE * t + W_BYLINE * by + W_PHOTOS * ph;
    var reasons = [];
    if (t >= 0.99) reasons.push('Same headline as print');
    else if (t >= 0.5) reasons.push('Headline close to print');
    if (by) reasons.push('Byline matches (' + al.byline + ')');
    if (want && imgs) reasons.push(imgs + ' photo' + (imgs === 1 ? '' : 's') + ' here, print shows ' + want);
    return { group: g, score: score, title: t, byline: by, photos: imgs, reasons: reasons };
  }
  function match() {
    var al = S.job.allocation;
    S.ignore = boilerplate(S.pool.groups);   // v1.1.1
    S.idf = buildIdf(S.pool.groups.filter(hasText));   // v1.1.5 — stories only
    S.key = keyWord(al.printTitle, S.ignore);           // v1.1.5
    var scored = S.pool.groups.map(function (g) { return scoreGroup(g, al); });
    // v1.1.5 — only bundles with text can be the guess; photo-only ones follow.
    S.ranked = scored.filter(function (r) { return hasText(r.group); })
      .sort(function (a, b) { return b.score - a.score; })
      .concat(scored.filter(function (r) { return !hasText(r.group); }).sort(function (a, b) { return b.title - a.title; }));
    S.proposal = {}; S.reasons = {}; S.found = 0;
    var top = S.ranked[0];
    if (top && top.score >= PROPOSE_AT) {
      top.group.files.forEach(function (f) {
        S.proposal[f.id] = true;
        S.reasons[f.id] = f.kind === 'text'
          ? (top.reasons.filter(function (r) { return /headline|byline/i.test(r); }).join(' · ') || 'Text in the best-matching bundle')
          : 'In the bundle that matches print';
        if (f.kind === 'image') S.found++;
      });
    }
    // v1.1.5 — photos whose file name carries the headline's words.
    if (top && top.score >= PROPOSE_AT) {
      S.ranked.forEach(function (r) {
        if (hasText(r.group) || r.title < PHOTO_NAME_MIN || !hasWord(groupHeads(r.group), S.key)) return;
        r.group.files.forEach(function (f) {
          if (f.kind !== 'image' || S.proposal[f.id]) return;
          S.proposal[f.id] = true; S.reasons[f.id] = 'File name matches the headline'; S.found++;
        });
      });
    }
    S.picked = {}; for (var k in S.proposal) S.picked[k] = true;
    if (!top || top.score < PROPOSE_AT) S.showMore = true;
    runPicturePass();   // v1.1.0 — sharpen with the photos; best-effort
  }

  // v1.1.0 — how many of the printed photos we can account for. After the
  // picture pass this is what the model saw; before it, the proposed images.
  function picFound() {
    if (S.pic.state === 'done') {
      var n = 0; for (var k in S.pic.inPrint) if (S.pic.inPrint[k]) n++; return n;
    }
    var m = 0; for (var k2 in S.proposal) { var f = fileById(k2); if (f && f.kind === 'image') m++; }
    return m;
  }

  var PIC_TYPES = { 'image/jpeg': 1, 'image/png': 1, 'image/gif': 1, 'image/webp': 1 };
  function dataUrlToPart(u) {
    var m = /^data:(image\/[a-z0-9.+-]+);base64,(.*)$/i.exec(u || '');
    if (!m) return null;
    var t = m[1].toLowerCase(); if (t === 'image/jpg') t = 'image/jpeg';
    return PIC_TYPES[t] ? { type: 'image', source: { type: 'base64', media_type: t, data: m[2] } } : null;
  }

  // Best-effort picture pass. Candidates: every image in the proposed
  // bundle, plus any image in the next-best bundles, capped. It only ever
  // adds to, or annotates, the text proposal.
  function runPicturePass() {
    var al = S.job.allocation, proxy = cfg().anthropicProxy;
    var top = S.ranked[0];
    if (!top || top.score < PROPOSE_AT) { S.pic.state = 'idle'; return; }
    if (!proxy || !window.IxPdfPager || typeof window.IxPdfPager.render !== 'function' || !al.pdfUrl) {
      S.pic.state = 'skip'; S.pic.err = 'couldn\u2019t check the photos (no PDF viewer or proxy)'; return;
    }
    // Candidate images: proposed bundle first, then the next two ranked.
    var cands = [], seen = {};
    function addImgs(g) { g.files.forEach(function (f) { if (f.kind === 'image' && f.imageUrl && !seen[f.id] && cands.length < PIC_MAX) { seen[f.id] = 1; cands.push(f); } }); }
    addImgs(top.group);
    for (var i = 1; i < S.ranked.length && cands.length < PIC_MAX; i++) addImgs(S.ranked[i].group);
    if (!cands.length) { S.pic.state = 'skip'; return; }

    var pages = [startPage(al)];
    var mx = Number(al.issuePages) || 0;
    // A print item that lists two pages: include the next one.
    if (al.page && String(al.page).indexOf('-') >= 0 && (!mx || pages[0] < mx)) pages.push(pages[0] + 1);

    S.pic.state = 'busy'; S.pic.err = ''; draw();
    var seq = ++S.picSeq;
    Promise.all(pages.map(function (n) { return window.IxPdfPager.render(al.pdfUrl, n, PIC_W); }))
      .then(function (pageUrls) {
        return Promise.all(cands.map(function (f) { return fetchImagePart(f.imageUrl); })).then(function (candParts) {
          return { pageUrls: pageUrls, candParts: candParts };
        });
      })
      .then(function (bits) {
        if (seq !== S.picSeq || !S) return;
        var content = [];
        content.push({ type: 'text', text: 'PRINTED PAGE' + (bits.pageUrls.length > 1 ? 'S' : '') + ' of the article headlined "' + (al.printTitle || '') + '":' });
        bits.pageUrls.forEach(function (u) { var p = dataUrlToPart(u); if (p) content.push(p); });
        content.push({ type: 'text', text: 'CANDIDATE PHOTOS, numbered:' });
        bits.candParts.forEach(function (p, i) { if (p) { content.push({ type: 'text', text: 'Photo ' + (i + 1) + ':' }); content.push(p); } });
        content.push({ type: 'text', text:
          'For THIS article only (ignore other articles and ads on the page), say which candidate photos appear in the printed article, and which one is the lead (largest / at the top). ' +
          'Return ONLY JSON: {"inPrint":[numbers],"lead":number|null}. A photo counts as in print only if you can see it in this article on the page. If none, inPrint is [] and lead is null.' });
        var system = 'You compare candidate photos against a printed magazine page and report which appear in one named article. You answer only with the JSON asked for.';
        return fetch(proxy, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: PIC_MODEL, max_tokens: 400, system: system, messages: [{ role: 'user', content: content }] }) })
          .then(function (r) { return r.text().then(function (t) {
            var j; try { j = JSON.parse(t); } catch (e) { throw new Error('the proxy did not answer in JSON (HTTP ' + r.status + ')'); }
            if (!r.ok) throw new Error((j && j.error && (j.error.message || j.error)) || ('HTTP ' + r.status));
            return { j: j, cands: cands };
          }); });
      })
      .then(function (res) {
        if (seq !== S.picSeq || !S) return;
        var raw = ((res.j && res.j.content) || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
        var m = raw.match(/\{[\s\S]*\}/); var parsed = null;
        if (m) { try { parsed = JSON.parse(m[0]); } catch (e) { parsed = null; } }
        if (!parsed || !Array.isArray(parsed.inPrint)) throw new Error('the answer was not the JSON asked for');
        applyPicture(res.cands, parsed);
        S.pic.state = 'done'; draw();
      })
      .catch(function (e) {
        if (seq !== S.picSeq || !S) return;
        S.pic.state = 'skip'; S.pic.err = 'couldn\u2019t check the photos (' + ((e && e.message) || e) + ')'; draw();
      });
  }

  function applyPicture(cands, parsed) {
    S.pic.inPrint = {}; S.pic.lead = ''; S.pic.note = {};
    var inset = {};
    (parsed.inPrint || []).forEach(function (n) { var f = cands[Number(n) - 1]; if (f) { inset[f.id] = 1; S.pic.inPrint[f.id] = 1; } });
    var lead = Number(parsed.lead); var leadF = (lead >= 1) ? cands[lead - 1] : null;
    if (leadF) S.pic.lead = leadF.id;
    cands.forEach(function (f) {
      if (inset[f.id]) {
        if (!S.proposal[f.id]) { S.proposal[f.id] = true; S.picked[f.id] = true; }   // add a photo the text pass missed
        S.reasons[f.id] = (f.id === S.pic.lead) ? 'Lead photo in print' : 'Appears in print';
      } else if (S.proposal[f.id]) {
        S.pic.note[f.id] = 'not seen on this page';   // keep the tick; flag it
      }
    });
  }

  // v1.1.1 — every candidate is redrawn as a JPEG no wider than
  // PIC_IMG_W, whatever type it arrived as. If the browser cannot draw
  // it, the raw file is used only when its type is one Claude accepts.
  function blobToDataUrl(b) {
    return new Promise(function (res) {
      var fr = new FileReader();
      fr.onload = function () { res(String(fr.result)); };
      fr.onerror = function () { res(''); };
      fr.readAsDataURL(b);
    });
  }
  function redrawJpeg(b) {
    return new Promise(function (res) {
      var u, img = new Image(), done = false;
      function fin(v) { if (done) return; done = true; try { URL.revokeObjectURL(u); } catch (e) {} res(v); }
      try { u = URL.createObjectURL(b); } catch (e) { return res(''); }
      img.onload = function () {
        try {
          var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
          if (!w || !h) return fin('');
          var k = Math.min(1, PIC_IMG_W / w);
          var cv = document.createElement('canvas');
          cv.width = Math.round(w * k); cv.height = Math.round(h * k);
          var cx = cv.getContext && cv.getContext('2d');
          if (!cx) return fin('');
          cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
          cx.drawImage(img, 0, 0, cv.width, cv.height);
          fin(cv.toDataURL('image/jpeg', PIC_JPEG_Q));
        } catch (e) { fin(''); }
      };
      img.onerror = function () { fin(''); };
      setTimeout(function () { fin(''); }, 15000);
      img.src = u;
    });
  }
  function fetchImagePart(url) {
    return fetch(url, { mode: 'cors' }).then(function (r) {
      if (!r.ok) return null;
      return r.blob().then(function (b) {
        return redrawJpeg(b).then(function (j) {
          var part = dataUrlToPart(j);
          if (part) return part;
          return blobToDataUrl(b).then(dataUrlToPart);   // null if the type is not accepted
        });
      });
    }).catch(function () { return null; });
  }

  /* ── print page ──────────────────────────────────────────── */
  function loadPage(n) {
    var al = S.job.allocation;
    if (!al.pdfUrl) { S.pageErr = 'This print item has no stored PDF (print-pdf-url on ALLOCATIONS).'; draw(); return; }
    if (!window.IxPdfPager || typeof window.IxPdfPager.render !== 'function') {
      S.pageErr = 'The PDF viewer (ix-pdf-pager) is not loaded on this page.'; draw(); return;
    }
    if (S.pageImg[n]) { draw(); return; }
    S.pageErr = '';
    window.IxPdfPager.render(al.pdfUrl, n, PRINT_W).then(function (src) {
      if (!S) return;
      S.pageImg[n] = src; draw();
    }, function (e) {
      if (!S) return;
      S.pageErr = 'Could not draw page ' + n + ': ' + ((e && e.message) || e) + '.'; draw();
    });
  }

  /* ── drawing ─────────────────────────────────────────────── */
  function pickedCount() { var n = 0; for (var k in S.picked) if (S.picked[k]) n++; return n; }
  function changed() {
    var k;
    for (k in S.picked) if (!!S.picked[k] !== !!S.proposal[k]) return true;
    for (k in S.proposal) if (!!S.picked[k] !== !!S.proposal[k]) return true;
    return false;
  }
  function tileHtml(f, reason) {
    var on = !!S.picked[f.id], chg = on !== !!S.proposal[f.id];
    var pnote = (S.pic && S.pic.note && S.pic.note[f.id]) ? S.pic.note[f.id] : '';
    if (pnote) reason = (reason ? reason + ' \u00b7 ' : '') + pnote;
    var face;
    if (f.kind === 'image' && f.imageUrl) {
      face = '<img class="cfp-img" src="' + esc(f.imageUrl) + '" alt="" loading="lazy">' +
             '<button type="button" class="cfp-zoom" data-cfp-zoom="' + esc(f.id) + '" aria-label="Open full size" title="Open full size">\u2922</button>';
    } else if (f.kind === 'text') {
      var t = f.meta.title || '';
      face = '<div class="cfp-txt">' + (t ? '<b>' + esc(t) + '</b>' : '') + '<span>' + esc(f.text.slice(0, 900)) + (f.text.length > 900 ? '\u2026' : '') + '</span></div>';
    } else {
      face = '<div class="cfp-txt cfp-txt--other"><b>' + esc(f.kind.toUpperCase()) + '</b><span>' + esc(f.name) + '</span></div>';
    }
    return '<div class="cfp-tile' + (f.kind === 'image' && f.imageUrl ? '' : ' cfp-tile--text') + (on ? ' is-on' : '') + (chg ? ' cfp-tile--changed' : '') + '" data-cfp-tile="' + esc(f.id) + '" role="checkbox" aria-checked="' + on + '" tabindex="0">' +
      '<div class="cfp-face">' + face + '<span class="cfp-tick" aria-hidden="true">' + (on ? '\u2713' : '') + '</span></div>' +
      '<div class="cfp-cap"><span class="cfp-kind">' + esc(f.kind === 'text' ? 'TXT' : f.kind === 'image' ? 'IMG' : 'FILE') + '</span>' +
      '<span class="cfp-why" title="' + esc(reason || f.name) + '">' + esc(reason || f.name) + '</span></div>' +
    '</div>';
  }
  function proposalHtml() {
    var p = S.pool;
    if (p.loading) return '<div class="cfp-busy"><span class="cfp-stars" aria-hidden="true"><i></i><i></i><i></i></span>Matching Intake files to this article\u2026</div>';
    if (p.error) return '<div class="cfp-err">' + esc(p.error) + ' <button type="button" class="ix-revert" data-cfp-retry>Try again</button></div>';
    var al = S.job.allocation, top = S.ranked[0];
    var ids = Object.keys(S.proposal);
    if (!ids.length) {
      return '<div class="cfp-none">No waiting Intake files look like this article. Pick them under Show more from Intake.</div>';
    }
    var want = Number(al.imageCount) || 0;
    var pf = picFound();
    var picLine = S.pic.state === 'busy'
        ? '<div class="cfp-picbar"><span class="cfp-stars" aria-hidden="true"><i></i><i></i><i></i></span>Checking the photos against the print page\u2026</div>'
      : S.pic.state === 'skip'
        ? '<div class="cfp-picbar cfp-picbar--note">' + esc(S.pic.err || 'couldn\u2019t check the photos') + ' <button type="button" class="ix-revert" data-cfp-recheck>Re-check photos</button></div>'
      : S.pic.state === 'done'
        ? '<div class="cfp-picbar cfp-picbar--ok">Checked the photos against the print. <button type="button" class="ix-revert" data-cfp-recheck>Re-check</button></div>'
        : '';
    var head = '<div class="cfp-guess"><b>My guess:</b> ' + esc(top.group.loose ? 'one loose file' : 'bundle \u201c' + top.group.label + '\u201d') +
      (top.reasons.length ? ' \u00b7 ' + esc(top.reasons.join(' \u00b7 ')) : '') + '</div>' + picLine +
      (want && pf < want ? '<div class="cfp-short">Print shows ' + want + ' photo' + (want === 1 ? '' : 's') + '. ' + pf + ' found. Look under Show more from Intake for the rest.</div>' : '');
    var shownIds = {};
    var tileFiles = top.group.files.slice();
    tileFiles.forEach(function (f) { shownIds[f.id] = 1; });
    // v1.1.0 — photos the picture pass added from other bundles show here too
    S.pool.files.forEach(function (f) {
      if (f.kind === 'image' && S.proposal[f.id] && !shownIds[f.id]) { shownIds[f.id] = 1; tileFiles.push(f); }
    });
    var tiles = tileFiles.map(function (f) { return tileHtml(f, S.reasons[f.id]); }).join('');
    return head + '<div class="cfp-grid">' + tiles + '</div>';
  }
  function moreHtml() {
    if (!S.showMore || S.pool.loading || S.pool.error) return '';
    var q = S.q.trim().toLowerCase(), topKey = S.ranked[0] && S.proposal[(S.ranked[0].group.files[0] || {}).id] ? S.ranked[0].group.key : '';
    var rows = S.ranked.filter(function (r) { return r.group.key !== topKey; });
    if (q) rows = rows.filter(function (r) {
      var hay = (r.group.label + ' ' + r.group.files.map(function (f) { return f.name + ' ' + (f.meta.title || '') + ' ' + f.text.slice(0, 200); }).join(' ')).toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    var body = rows.length ? rows.map(function (r, i) {
      var tag = (!q && i < ALSO_POSSIBLE && r.score > 0) ? '<span class="cfp-also">Also possible</span>' : '';
      return '<div class="cfp-group"><div class="cfp-group-h">' + tag + '<span>' + esc(r.group.loose ? 'Loose file' : r.group.label) + '</span>' +
        '<span class="cfp-group-n">' + r.group.files.length + ' file' + (r.group.files.length === 1 ? '' : 's') + '</span></div>' +
        '<div class="cfp-grid">' + r.group.files.map(function (f) { return tileHtml(f, ''); }).join('') + '</div></div>';
    }).join('') : '<div class="cfp-none">' + (q ? 'No waiting file matches \u201c' + esc(S.q) + '\u201d.' : 'No other waiting files in Intake.') + '</div>';
    return '<div class="cfp-more"><div class="cfp-more-h"><span class="cfp-eyebrow">More from Intake</span>' +
      '<input type="search" class="cfp-q" data-cfp-q placeholder="Search Intake files" value="' + esc(S.q) + '"></div>' + body + '</div>';
  }
  function printHtml() {
    var al = S.job.allocation, n = S.page, max = Number(al.issuePages) || 0;
    var img = S.pageImg[n];
    return '<div class="cfp-pnav">' +
        '<button type="button" class="ix-btn ix-btn--ghost ix-btn--icon" data-cfp-page="-1"' + (n <= 1 ? ' disabled' : '') + ' aria-label="Previous page">\u2039</button>' +
        '<span class="cfp-pnum">PDF page ' + n + (max ? ' of ' + max : '') + (al.page ? ' \u00b7 printed p.' + esc(al.page) : '') + '</span>' +
        '<button type="button" class="ix-btn ix-btn--ghost ix-btn--icon" data-cfp-page="1"' + (max && n >= max ? ' disabled' : '') + ' aria-label="Next page">\u203a</button>' +
        '<button type="button" class="ix-revert cfp-full" data-cfp-full>Open full size</button>' +
        gapSelBtn() +
      '</div>' +
      '<div class="cfp-page' + (gap().mode === 'select' ? ' cfp-page--select' : '') + '">' +
        (S.pageErr ? '<div class="cfp-err">' + esc(S.pageErr) + '</div>'
         : img ? '<img src="' + img + '" alt="Print page ' + n + '"' + (gap().mode === 'select' ? ' data-cfp-gapimg draggable="false"' : ' data-cfp-full') + '>'
         : '<div class="cfp-busy"><span class="cfp-stars" aria-hidden="true"><i></i><i></i><i></i></span>Drawing page ' + n + '\u2026</div>') +
      '</div>' + gapHtml();
  }
  function draw() {
    if (!S || !S.root) return;
    var al = S.job.allocation, n = pickedCount();
    var meta = [al.issueName, al.page ? 'p.' + al.page : '', al.section, al.byline ? 'By ' + al.byline : '',
                al.imageCount ? al.imageCount + ' photo' + (al.imageCount === 1 ? '' : 's') + ' in print' : '']
               .filter(Boolean).join(' \u00b7 ');
    var keepQ = document.activeElement && document.activeElement.hasAttribute && document.activeElement.hasAttribute('data-cfp-q');
    var bodyEl = S.root.querySelector('.cfp-files'), scroll = bodyEl ? bodyEl.scrollTop : 0;
    S.root.innerHTML =
      '<div class="ix-modal ix-modal--wide cfp-modal" role="dialog" aria-modal="true" aria-label="Create from print">' +
        '<div class="cfp-head">' +
          '<div class="cfp-eyebrow">Create from print \u00b7 check the files</div>' +
          '<div class="cfp-title">' + esc(al.printTitle || 'Untitled print item') + '</div>' +
          '<div class="cfp-sub">' + esc(meta) + '</div>' +
        '</div>' +
        '<div class="cfp-body">' +
          '<section class="cfp-print"><div class="cfp-eyebrow">The print</div>' + printHtml() + '</section>' +
          '<section class="cfp-files">' + existingHtml() + '<div class="cfp-eyebrow">Files from Intake \u00b7 tick the ones that belong</div>' +
            proposalHtml() +
            (S.pool.loading || S.pool.error ? '' :
              '<button type="button" class="ix-revert cfp-more-btn" data-cfp-more>' + (S.showMore ? 'Hide the other Intake files' : 'Show more from Intake') + '</button>') +
            moreHtml() +
          '</section>' +
        '</div>' +
        '<div class="cfp-foot">' +
          '<span class="cfp-count">' + n + ' file' + (n === 1 ? '' : 's') + ' ticked' +
            (changed() ? ' \u00b7 <button type="button" class="ix-revert" data-cfp-reset>Back to my guess</button>' : '') + '</span>' +
          (S.write && S.write.busy ? '<span class="cfp-count">Linking\u2026</span>' : '') +
          (S.write && S.write.ok === false ? '<span class="cfp-wfail">' + esc(S.write.error) + ' <button type="button" class="ix-revert" data-cfp-rewrite>Try the link again</button></span>' : '') +
          '<span class="cfp-sp"></span>' +
          '<button type="button" class="ix-revert" data-cfp-cancel>Cancel</button>' +
          '<button type="button" class="ix-btn ix-btn--primary cfp-go" data-cfp-go' + (n ? '' : ' disabled') + '>' +
            (S.write && S.write.articleId && S.write.mode !== 'link' ? 'Article created' : 'Build the article from ' + n + ' file' + (n === 1 ? '' : 's')) + '</button>' +
        '</div>' +
      '</div>';
    var b2 = S.root.querySelector('.cfp-files'); if (b2) b2.scrollTop = scroll;
    if (keepQ) { var qi = S.root.querySelector('[data-cfp-q]'); if (qi) { qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); } }
    if (S.write && ((S.write.articleId && S.write.mode !== 'link') || S.write.busy)) { var go = S.root.querySelector('[data-cfp-go]'); if (go) go.disabled = true; }
  }

  /* ── v1.2.0 · missing photos: find the source or generate one ── */
  var FLUX_EDGE = 1440, GAP_MIN_PX = 40;                       // HC-P-CFP-20
  var LOOKUP_URL = 'https://images.google.com/';               // HC-P-CFP-20
  function gap() { if (!S.gap) S.gap = { mode: 'idle' }; return S.gap; }
  function gapCss() {
    if (document.getElementById('cfp-gap-css')) return;
    var st = document.createElement('style'); st.id = 'cfp-gap-css';
    st.textContent =
      '.cfp-page--select{position:relative;cursor:crosshair;}' +
      '.cfp-page--select img{user-select:none;-webkit-user-drag:none;outline:2px dashed #c9a227;}' +
      '.cfp-gapbox{position:absolute;border:2px solid #c9a227;background:rgba(201,162,39,.15);pointer-events:none;}' +
      '.cfp-gap{margin-top:12px;padding:12px;border:1px solid #e5dcc3;border-radius:8px;background:#fffdf6;font-size:13px;}' +
      '.cfp-gap-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px;}' +
      '.cfp-gap-crop{max-width:100%;max-height:220px;display:block;border-radius:4px;border:1px solid #ddd;}' +
      '.cfp-gap-hint{color:#6b6b6b;margin:6px 0 0;}' +
      '.cfp-gap textarea{width:100%;min-height:110px;margin-top:8px;font:inherit;padding:8px;border:2px solid #c9a227;border-radius:6px;box-sizing:border-box;}' +
      '.cfp-gap-res{max-width:100%;max-height:300px;display:block;margin-top:8px;border-radius:4px;}' +
      '.cfp-gap-err{color:#b3261e;margin-top:6px;}' +
      '.cfp-gap-sel{margin-top:8px;}' +
      /* v1.2.2 — the page fits its column; no scrolling */
      '.cfp-modal .cfp-print{overflow:hidden;}' +
      '.cfp-modal .cfp-pnav{flex-wrap:wrap;flex:0 0 auto;}' +
      '.cfp-modal .cfp-pnum{min-width:0;}' +
      '.cfp-modal .cfp-full{margin-left:auto;}' +
      '.cfp-modal .cfp-page{flex:1 1 0;min-height:0;display:flex;align-items:flex-start;justify-content:center;}' +
      '.cfp-modal .cfp-page img{width:auto;height:auto;max-width:100%;max-height:100%;object-fit:contain;}' +
      '.cfp-modal .cfp-gap{flex:0 0 auto;max-height:45%;overflow:auto;}' +
      '.cfp-modal .cfp-gap-crop{max-height:140px;}' +
      /* v1.2.2 — text files full width and readable */
      '.cfp-modal .cfp-tile--text{grid-column:1/-1;width:auto;}' +
      '.cfp-modal .cfp-tile--text .cfp-face{width:auto;height:auto;max-height:260px;overflow:hidden;}' +
      '.cfp-modal .cfp-tile--text .cfp-txt{height:auto;padding:12px 16px 14px 46px;font-size:15px;line-height:1.5;color:var(--ix-text-dark,#1A3A3A);}' +
      '.cfp-modal .cfp-tile--text .cfp-txt b{font-size:17px;margin-bottom:6px;}' +
      '.cfp-modal .cfp-tile--text .cfp-tick{top:12px;left:12px;}' +
      '.cfp-modal .cfp-why{font-size:12px;}' +
      '.cfp-gm{position:fixed;inset:0;z-index:100000;background:rgba(26,58,58,.6);display:flex;align-items:center;justify-content:center;padding:2vh 2vw;}' +
      '.cfp-gm-box{background:#fff;border-radius:12px;width:96vw;max-width:1500px;height:94vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.35);}' +
      '.cfp-gm-head{display:flex;align-items:center;gap:12px;padding:16px 22px;border-bottom:1px solid #eee;}' +
      '.cfp-gm-head h3{margin:0;font-size:20px;flex:1;}' +
      '.cfp-gm-body{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:22px;padding:20px 22px;min-height:0;}' +
      '.cfp-gm-col{display:flex;flex-direction:column;min-height:0;gap:10px;}' +
      '.cfp-gm-eb{font:600 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:#6b6b6b;}' +
      '.cfp-gm-frame{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:#f6f3ea;border-radius:8px;overflow:hidden;position:relative;}' +
      '.cfp-gm-frame img{width:100%;height:100%;object-fit:contain;display:block;}' +   /* v1.2.3 — fill the frame, small crops included */
      '.cfp-gm-sees{font-size:13px;color:#444;background:#f6f3ea;border-radius:6px;padding:8px 10px;}' +
      '.cfp-gm textarea{width:100%;min-height:96px;flex:0 0 auto;font:inherit;font-size:14px;line-height:1.5;padding:10px 12px;border:2px solid #c9a227;border-radius:6px;box-sizing:border-box;resize:none;overflow:hidden;}' +
      '.cfp-gm-col .cfp-gm-frame{min-height:160px;}.cfp-gm-col{overflow-y:auto;}' +
      '.cfp-gm-foot{display:flex;gap:10px;align-items:center;padding:14px 22px;border-top:1px solid #eee;}' +
      '.cfp-gm-sp{flex:1;}' +
      '.cfp-gm-err{color:#b3261e;font-size:13px;}' +
      '.cfp-gm-wait{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#1a3a3a;font-size:15px;' +
        'background:linear-gradient(110deg,#efe9d8 8%,#faf6ea 18%,#efe9d8 33%);background-size:200% 100%;animation:cfpShim 1.4s linear infinite;}' +
      '.cfp-gm-dots{display:flex;gap:8px;}.cfp-gm-dots i{width:10px;height:10px;border-radius:50%;background:#c9a227;animation:cfpDot 1.2s ease-in-out infinite;}' +
      '.cfp-gm-dots i:nth-child(2){animation-delay:.2s}.cfp-gm-dots i:nth-child(3){animation-delay:.4s}' +
      '.cfp-gm-res{animation:cfpIn .5s ease-out;}' +
      '@keyframes cfpShim{to{background-position:-200% 0}}@keyframes cfpDot{0%,100%{transform:scale(.6);opacity:.4}50%{transform:scale(1);opacity:1}}' +
      '@keyframes cfpIn{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:none}}';
    document.head.appendChild(st);
  }
  // v1.2.2 — always in view, in the page bar.
  function gapSelBtn() {
    var g = gap(), want = Number(S.job.allocation.imageCount) || 0;
    if (g.mode !== 'idle') return '';
    var short = want && picFound() < want;
    return '<button type="button" class="ix-btn ' + (short ? 'ix-btn--primary' : 'ix-btn--ghost') + ' cfp-gapbtn" data-cfp-gapsel>Missing photo? Select it on the page</button>';
  }
  function gapHtml() {
    var g = gap(), al = S.job.allocation, want = Number(al.imageCount) || 0;
    var short = want && picFound() < want;
    if (g.mode === 'idle') return '';   // v1.2.2 — the button lives in the page bar
    if (g.mode === 'select') {
      return '<div class="cfp-gap"><b>Drag a box around the missing photo on the page.</b> ' +
        '<button type="button" class="ix-revert" data-cfp-gapx>Cancel</button></div>';
    }
    var gen = g.gen || {};
    var h = '<div class="cfp-gap"><b>Missing photo</b> \u00b7 <button type="button" class="ix-revert" data-cfp-gapsel>Select again</button> \u00b7 ' +
      '<button type="button" class="ix-revert" data-cfp-gapx>Cancel</button>' +
      '<img class="cfp-gap-crop" src="' + g.crop + '" alt="The photo selected on the print page" style="margin-top:8px">' +
      '<div class="cfp-gap-row">' +
        '<button type="button" class="ix-btn ix-btn--ghost" data-cfp-gapfind' + (g.finding ? ' disabled' : '') + '>Find the source</button>' +
        '<button type="button" class="ix-btn ix-btn--primary" data-cfp-gapgen>Generate a similar one</button>' +
        '<a class="ix-revert" href="' + g.crop + '" download="print-photo-p' + S.page + '.jpg">Save the crop</a>' +
      '</div>';
    if (g.finding) h += '<div class="cfp-gap-hint">Sending the photo to Google Lens\u2026</div>';
    else if (g.found) h += '<div class="cfp-gap-hint">Google Lens opened in a new tab with this photo. Exact matches link to where it can be licensed.</div>';
    if (gen.used) h += '<div class="cfp-gap-hint">A generated photo was added and ticked.</div>';
    return h + '</div>';
  }
  // Drag a box on the page image; crop from the page's data URL.
  function gapDown(e) {
    var img = e.target.closest && e.target.closest('[data-cfp-gapimg]');
    if (!img || gap().mode !== 'select') return;
    e.preventDefault();
    var host = img.parentNode, hr = host.getBoundingClientRect();
    var box = document.createElement('div'); box.className = 'cfp-gapbox'; host.appendChild(box);
    var x0 = e.clientX, y0 = e.clientY;
    function place(x1, y1) {
      var ir = img.getBoundingClientRect();
      var l = Math.max(ir.left, Math.min(x0, x1)), t = Math.max(ir.top, Math.min(y0, y1));
      var r = Math.min(ir.right, Math.max(x0, x1)), b = Math.min(ir.bottom, Math.max(y0, y1));
      box.style.left = (l - hr.left) + 'px'; box.style.top = (t - hr.top) + 'px';
      box.style.width = Math.max(0, r - l) + 'px'; box.style.height = Math.max(0, b - t) + 'px';
      return { l: l - ir.left, t: t - ir.top, w: Math.max(0, r - l), h: Math.max(0, b - t), iw: ir.width, ih: ir.height };
    }
    var last = place(x0, y0);
    function mv(ev) { last = place(ev.clientX, ev.clientY); }
    function up() {
      document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up);
      if (last.w < GAP_MIN_PX || last.h < GAP_MIN_PX) { if (box.parentNode) box.parentNode.removeChild(box); return; }
      cropFrom(img, last);
    }
    document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up);
  }
  function cropFrom(img, r) {
    var sx = img.naturalWidth / r.iw, sy = img.naturalHeight / r.ih;
    var cw = Math.round(r.w * sx), ch = Math.round(r.h * sy);
    var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    var src = new Image();
    src.onload = function () {
      cv.getContext('2d').drawImage(src, Math.round(r.l * sx), Math.round(r.t * sy), cw, ch, 0, 0, cw, ch);
      var g = gap();
      g.mode = 'have'; g.crop = cv.toDataURL('image/jpeg', 0.92); g.w = cw; g.h = ch; g.found = false; g.gen = null;
      cv.toBlob(function (b) { g.png = b; }, 'image/png');
      draw();
    };
    src.src = img.src;
  }
  var LENS_URL = 'https://lens.google.com/uploadbyurl?url=';   // HC-P-CFP-21
  function gapFind() {
    var g = gap(); if (!g.crop) return;
    var c = cfg(), key = c.uploadcarePublicKey || c.uploadcareKey;
    if (!key) { toast('TA_CONFIG.uploadcarePublicKey is missing, so the photo cannot be searched. Use Save the crop and upload it to Google Lens.', 'err'); return; }
    var win = window.open('about:blank', '_blank');   // open now, inside the click, so it is not blocked
    if (win) { try { win.document.write('<p style="font:16px sans-serif;padding:24px">Uploading the photo for Google Lens\u2026</p>'); } catch (e) {} }
    g.finding = true; draw();
    var go = g.lensUrl ? Promise.resolve(g.lensUrl) :
      fetch(g.crop).then(function (r) { return r.blob(); }).then(function (blob) {
        var fd = new FormData();
        fd.append('UPLOADCARE_PUB_KEY', key); fd.append('UPLOADCARE_STORE', '1');
        fd.append('file', blob, 'print-photo-p' + S.page + '.jpg');
        return fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: fd });
      }).then(function (r) { if (!r.ok) throw new Error('Uploadcare HTTP ' + r.status); return r.json(); })
        .then(function (d) {
          if (!d || !d.file) throw new Error('Uploadcare returned no file');
          var base = (c.uploadcareBase || 'https://ucarecdn.com').replace(/\/$/, '');
          return (g.lensUrl = base + '/' + d.file + '/print-photo.jpg');
        });
    go.then(function (u) {
      g.finding = false; g.found = true; draw();
      var to = LENS_URL + encodeURIComponent(u);
      if (win && !win.closed) win.location.href = to; else window.open(to, '_blank');
    }).catch(function (e) {
      g.finding = false; draw();
      if (win && !win.closed) win.close();
      toast('Could not send the photo to Google Lens: ' + ((e && e.message) || e) + '. Use Save the crop instead.', 'err');
    });
  }
  /* v1.2.1 — the Generate window. Its own overlay above the palette. */
  function gmOpen() {
    var g = gap(); if (!g.crop) return;
    if (!g.gen || g.gen.used) g.gen = { phase: 'drafting', prompt: '', sees: '', err: '' };
    if (!g.gm) {
      var o = document.createElement('div'); o.className = 'cfp-gm';
      o.addEventListener('click', gmClick);
      o.addEventListener('input', function (e) { if (e.target.hasAttribute('data-gm-prompt') && g.gen) { g.gen.prompt = e.target.value; gmFit(); } });
      window.addEventListener('resize', gmFit);
      o.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); gmClose(); } });
      document.body.appendChild(o); g.gm = o;
    }
    gmDraw();
    if (g.gen.phase === 'drafting') gapDraft();
  }
  function gmClose() { var g = S && S.gap; if (g && g.gm) { if (g.gm.parentNode) g.gm.parentNode.removeChild(g.gm); g.gm = null; } if (S) draw(); }
  function gmDraw() {
    var g = S && S.gap; if (!g || !g.gm) return;
    var gen = g.gen || {}, busy = gen.phase === 'drafting' || gen.phase === 'generating' || gen.phase === 'saving';
    var right;
    if (gen.phase === 'generating') right = '<div class="cfp-gm-wait"><div class="cfp-gm-dots"><i></i><i></i><i></i></div>Flux is painting your photo\u2026 about 20 seconds</div>';
    else if (gen.url) right = '<img class="cfp-gm-res" src="' + esc(gen.url) + '" alt="Generated photo">';
    else if (gen.phase === 'drafting') right = '<div class="cfp-gm-wait"><div class="cfp-gm-dots"><i></i><i></i><i></i></div>Looking at the print photo and writing the prompt\u2026</div>';
    else right = '<div class="cfp-gm-sees" style="margin:auto">The generated photo appears here.</div>';
    g.gm.innerHTML =
      '<div class="cfp-gm-box" role="dialog" aria-modal="true" aria-label="Generate a similar photo">' +
        '<div class="cfp-gm-head"><h3>Generate a similar photo</h3><button type="button" class="ix-revert" data-gm-close>Close</button></div>' +
        '<div class="cfp-gm-body">' +
          '<div class="cfp-gm-col"><div class="cfp-gm-eb">From the print</div><div class="cfp-gm-frame"><img src="' + g.crop + '" alt="Photo from the print page"></div>' +
            (gen.sees ? '<div class="cfp-gm-eb">What Claude sees</div><div class="cfp-gm-sees">' + esc(gen.sees) + '</div>' : '') +
            (gen.phase === 'drafting' ? '' : '<div class="cfp-gm-eb">Prompt \u00b7 edit freely</div><textarea data-gm-prompt' + (busy ? ' disabled' : '') + '>' + esc(gen.prompt || '') + '</textarea>') +
          '</div>' +
          '<div class="cfp-gm-col"><div class="cfp-gm-eb">Generated</div><div class="cfp-gm-frame">' + right + '</div></div>' +
        '</div>' +
        '<div class="cfp-gm-foot">' +
          (gen.err ? '<span class="cfp-gm-err">' + esc(gen.err) + '</span>' : '') +
          '<span class="cfp-gm-sp"></span>' +
          '<button type="button" class="ix-revert" data-gm-redraft' + (busy ? ' disabled' : '') + '>Rewrite the prompt</button>' +
          '<button type="button" class="ix-btn ' + (gen.url ? 'ix-btn--ghost' : 'ix-btn--primary') + '" data-gm-flux' + (busy || !(gen.prompt || '').trim() ? ' disabled' : '') + '>' + (gen.url ? 'Generate again' : 'Generate image') + '</button>' +
          (gen.url ? '<button type="button" class="ix-btn ix-btn--primary" data-gm-use' + (busy ? ' disabled' : '') + '>' + (gen.phase === 'saving' ? 'Adding\u2026' : 'Use this photo') + '</button>' : '') +
        '</div>' +
      '</div>';
    gmFit();
  }
  // v1.2.3 — the prompt box is as tall as its text; no inner scrolling.
  function gmFit() {
    var g = S && S.gap; if (!g || !g.gm) return;
    var ta = g.gm.querySelector('[data-gm-prompt]'); if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = (ta.scrollHeight + 4) + 'px';
  }
  function gmClick(e) {
    var t = e.target;
    if (t === e.currentTarget || t.closest('[data-gm-close]')) { gmClose(); return; }
    if (t.closest('[data-gm-redraft]')) { gap().gen = { phase: 'drafting', prompt: '', sees: '', err: '' }; gmDraw(); gapDraft(); return; }
    if (t.closest('[data-gm-flux]')) { gapFlux(); return; }
    if (t.closest('[data-gm-use]')) { gapUse(); return; }
  }
  function gapDraft() {
    var g = gap(), al = S.job.allocation, proxy = cfg().anthropicProxy;
    if (!proxy) { g.gen = { phase: 'edit', prompt: '', sees: '', err: 'TA_CONFIG.anthropicProxy is not set, so a prompt cannot be written. Type one.' }; gmDraw(); return; }
    var part = dataUrlToPart(g.crop);
    if (!part) { g.gen = { phase: 'edit', prompt: '', sees: '', err: 'The selected photo could not be read. Select it again.' }; gmDraw(); return; }
    var system = [
      'You write image-generation prompts for Flux 2 Pro for a local community lifestyle magazine.',
      'You are shown a photo cut from the printed magazine, usually licensed stock the publisher cannot supply.',
      'Write ONE prompt that RECREATES THE SAME SCENE as closely as possible: the same subject and action, the same',
      'setting and room, the same key props and decorations, the same season, the same light, the same camera angle',
      'and framing, the same colours and mood. Describe what is actually in the photo, in order of importance.',
      'Only these change: people are described generically by role, age and clothing (never a named or famous person),',
      'and any text, logos, brands or watermarks are left out.',
      'Photographic: say editorial photograph, and name a focal length and aperture that suit the framing.',
      'Never write golden hour, cinematic, moody, bokeh, dreamy, 8k, stunning, highly detailed.',
      '60-90 words, one paragraph.',
      'Respond with ONLY JSON: {"sees":"one sentence: what the photo shows","prompt":"..."}'
    ].join('\n');
    var content = [{ type: 'text', text: 'The photo from print (article: "' + (al.printTitle || '') + '"). Describe and recreate THIS photo; the headline is context only:' }, part];
    fetch(proxy, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: PIC_MODEL, max_tokens: 600, system: system, messages: [{ role: 'user', content: content }] }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error((j && j.error && (j.error.message || j.error)) || ('HTTP ' + r.status)); return j; }); })
      .then(function (j) {
        if (!S || S.gap !== g) return;
        var raw = ((j && j.content) || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
        var m = raw.match(/\{[\s\S]*\}/), p = null; if (m) { try { p = JSON.parse(m[0]); } catch (e) {} }
        g.gen = { phase: 'edit', prompt: (p && p.prompt) || '', sees: (p && p.sees) || '', err: (p && p.prompt) ? '' : 'The prompt did not come back. Type one, or Rewrite the prompt.' };
        gmDraw();
      })
      .catch(function (e) { if (!S || S.gap !== g) return; g.gen = { phase: 'edit', prompt: '', sees: '', err: 'Could not write a prompt: ' + ((e && e.message) || e) + '.' }; gmDraw(); });
  }
  function fluxSize(w, h) {
    var a = Math.max(0.5, Math.min(2, (w || 1) / (h || 1)));
    var W = a >= 1 ? FLUX_EDGE : FLUX_EDGE * a, H = a >= 1 ? FLUX_EDGE / a : FLUX_EDGE;
    return { w: Math.round(W / 16) * 16, h: Math.round(H / 16) * 16 };
  }
  function gapFlux() {
    var g = gap(), gen = g.gen; if (!gen) return;
    var ta = g.gm && g.gm.querySelector('[data-gm-prompt]'); if (ta) gen.prompt = ta.value;
    var url = cfg().fluxGen;
    if (!url) { gen.err = 'TA_CONFIG.fluxGen is not set, so the image cannot be generated.'; gmDraw(); return; }
    if (!(gen.prompt || '').trim()) return;
    var sz = fluxSize(g.w, g.h);
    gen.phase = 'generating'; gen.err = ''; gen.used = false; gmDraw();
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: gen.prompt, width: sz.w, height: sz.h }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j || !j.url) throw new Error((j && j.error) || ('HTTP ' + r.status)); return j; }); })
      .then(function (j) { if (!S || S.gap !== g) return; gen.phase = 'edit'; gen.url = j.url; gen.uuid = j.uuid; gen.w = j.width || sz.w; gen.h = j.height || sz.h; gmDraw(); })
      .catch(function (e) { if (!S || S.gap !== g) return; gen.phase = 'edit'; gen.err = 'Generation failed: ' + ((e && e.message) || e); gmDraw(); });
  }
  function gapUse() {
    var g = gap(), gen = g.gen, c = cfg(); if (!gen || !gen.url) return;
    if (!c.makeGenerateMedia) { gen.err = 'TA_CONFIG.makeGenerateMedia (Scenario L) is not set, so the photo cannot be added.'; gmDraw(); return; }
    gen.phase = 'saving'; gen.err = ''; gmDraw();
    var al = S.job.allocation;
    var payload = { action: 'createGeneratedMedia', uploadcareUuid: gen.uuid, uploadcareUrl: gen.url,
      originalFilename: 'flux-print-' + String(gen.uuid || '').slice(0, 8) + '.jpg', mimeType: 'image/jpeg',
      width: gen.w, height: gen.h, titleSlug: c.titleSlug, taItemId: c.taItemId,
      imageSource: 'ai-flux-2-pro', generationPrompt: gen.prompt,
      source: 'create-from-print-v' + VERSION + ' similar to print ' + (al.issueName || '') + ' p.' + (al.page || '') };
    fetch(c.makeGenerateMedia, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error('Scenario L HTTP ' + r.status); return r.text(); })
      .then(function (t) {
        var p = null; try { p = JSON.parse(t); } catch (e) {}
        if (!p || p.ok !== true || !p.mediaId) throw new Error('Scenario L did not confirm the new photo');
        if (!S || S.gap !== g) return;
        var f = { id: p.mediaId, kind: 'image', name: p.name || payload.originalFilename, imageUrl: p.imageUrl || gen.url,
                  html: '', text: '', meta: {}, metaRaw: '', bundleId: '', bundleLabel: '', fd: {} };
        S.pool.files.push(f);
        // v1.2.3 — tell the Asset Form, so Add from library has it without a reload.
        try {
          if (window.InbxASF && typeof window.InbxASF.addMedia === 'function') {
            window.InbxASF.addMedia({ mediaId: f.id, name: f.name, imageUrl: f.imageUrl, originalFilename: payload.originalFilename,
                                      mimeType: 'image/jpeg', sourceChannel: 'ai-generated' });
          } else console.warn(TAG, 'ta-asf has no addMedia (needs v1.11.13+); the photo shows in Add from library after a reload');
        } catch (e) { console.warn(TAG, 'addMedia failed', e); }
        S.pool.groups.unshift({ key: 'gen:' + f.id, label: 'Generated', loose: true, files: [f] });
        S.proposal[f.id] = true; S.picked[f.id] = true; S.reasons[f.id] = 'Generated to stand in for the print photo';
        gen.phase = 'edit'; gen.used = true;
        gmClose();
        toast('Added the generated photo and ticked it.', 'success');
      })
      .catch(function (e) { if (!S || S.gap !== g) return; gen.phase = 'edit'; gen.err = 'Could not add the photo: ' + ((e && e.message) || e); gmDraw(); });
  }

  /* ── ticks (click, Shift-click range, Cmd/Ctrl-click) ───────── */
  function visibleIds() {
    return Array.prototype.map.call(S.root.querySelectorAll('[data-cfp-tile]'), function (el) { return el.getAttribute('data-cfp-tile'); });
  }
  function toggle(id, e) {
    var to = !S.picked[id];
    if (e && e.shiftKey && S.anchor && S.anchor !== id) {
      var ids = visibleIds(), a = ids.indexOf(S.anchor), b = ids.indexOf(id);
      if (a >= 0 && b >= 0) {
        to = !!S.picked[S.anchor];
        var lo = Math.min(a, b), hi = Math.max(a, b);
        for (var i = lo; i <= hi; i++) { if (to) S.picked[ids[i]] = true; else delete S.picked[ids[i]]; }
        draw(); return;
      }
    }
    if (to) S.picked[id] = true; else delete S.picked[id];
    S.anchor = id;
    draw();
  }
  function fileById(id) {
    var f = S.pool.files; for (var i = 0; i < f.length; i++) if (f[i].id === id) return f[i];
    return null;
  }

  /* ── 3 · build: open the ASF seeded from the ticked files ──── */
  function build() {
    var ids = Object.keys(S.picked).filter(function (k) { return S.picked[k]; });
    if (!ids.length) return;
    if (!window.InbxASF || typeof window.InbxASF.open !== 'function') { toast('The Asset Form is not loaded on this page. Refresh and try again.', 'err'); return; }
    var v = String(window.InbxASF.version || '').split('.').map(Number);
    var hooksOk = v[0] > 1 || (v[0] === 1 && (v[1] > 11 || (v[1] === 11 && (v[2] || 0) >= 7)));
    if (!hooksOk) { toast('The Asset Form here is v' + window.InbxASF.version + '. Create from print needs ta-asf v1.11.7 or later to link the article back.', 'err'); return; }
    var prefilledMedia = ids.map(function (id) {
      var f = fileById(id) || { id: id, kind: 'other', imageUrl: '', html: '', metaRaw: '' };
      return { id: f.id, mediaType: f.kind, imageUrl: f.imageUrl, htmlContent: f.html, sourceMetadata: f.metaRaw };
    });
    S.write = null;   // v1.0.2 — a failed link attempt does not carry over
    hide();
    var ok = false;
    try {
      ok = window.InbxASF.open({
        mode: 'create', assetType: 'article',
        prefilledMediaIds: ids, prefilledMedia: prefilledMedia,
        tenantId: cfg().taItemId || null,
        noWorkbench: true,
        printSource: {   // v1.0.1 — Compare with print in the form
          pdfUrl: S.job.allocation.pdfUrl, pdfPage: startPage(S.job.allocation), issuePages: S.job.allocation.issuePages,
          issueName: S.job.allocation.issueName, page: S.job.allocation.page, printTitle: S.job.allocation.printTitle
        },
        afterCreate: function (newId) { return writeBack(newId); },
        onClosed: function (info) { afterAsf(info); }
      });
    } catch (e) { ok = false; console.error(TAG, 'ASF open threw', e); }
    if (ok === false) { show(); toast('The Asset Form would not open. Nothing was created.', 'err'); }
  }

  /* ── 4 · write back ──────────────────────────────────────── */
  function writeBack(newId) {
    var job = S.job, al = job.allocation, c = cfg();
    var prev = S.write || {};
    S.write = { articleId: newId, ok: null, mode: (prev.articleId === newId && prev.mode) || 'build', busy: !!prev.busy };
    if (!c.makeSlateWriter) return Promise.resolve(fail('this page has no TA_CONFIG.makeSlateWriter (Scenario 103B), so the print item was not linked'));
    var linkField = (S.board && S.board.linkFields && S.board.linkFields.article) || LINK_FIELD_FALLBACK;
    return sendOne(c.makeSlateWriter, 'link', { id: al.id, field: linkField, assetId: newId }, 'Scenario 103B').then(function (res) {
      var why = '';
      if (!res) why = 'no result came back';
      else if (res.fieldOk !== true) why = '103B refused the field \u201c' + (res.field || linkField) + '\u201d';
      else if (res.ok !== true || !res.id) why = res.err || 'Webflow refused the write';
      else if (String(res.value || '') !== String(newId)) why = 'the print item does not hold the article after the write';
      if (why) return fail('the print item was not linked (' + why + ')');
      if (!job.slotId) { S.write.ok = true; return { ok: true, note: 'linked to its print item' }; }
      return fillTile(newId);
    }, function (e) { return fail('the print item was not linked (' + ((e && e.message) || 'the request failed') + ')'); });
  }
  function fillTile(newId) {
    var job = S.job, c = cfg();
    var field = S.board && S.board.accepts && S.board.accepts.article;
    if (!c.makeBlockWriter) return Promise.resolve(fail('linked, but this page has no TA_CONFIG.makeBlockWriter (Scenario 124), so the tile was not filled'));
    if (!field || field === 'list') return Promise.resolve(fail('linked, but the plan data does not say which tile field holds an article'));
    return sendOne(c.makeBlockWriter, 'fill', { id: job.slotId, assetField: field, assetId: newId }, 'Scenario 124').then(function (res) {
      var why = '';
      if (!res) why = 'no result came back';
      else if (res.ok !== true || !res.id) why = res.err || 'Webflow refused the write';
      else if (String((res.fieldData || {}).asset || '') !== String(newId)) why = 'the tile does not hold the article after the write';
      if (why) return fail('linked, but the tile was not filled (' + why + ')');
      // Read back from the Data Worker: green only from what it shows.
      return readBoard(job.planId).then(function (b) {
        S.board = b;
        var slot = (b.slots || []).filter(function (s) { return s.id === job.slotId; })[0];
        var alc = (b.allocations || []).filter(function (a) { return a.id === job.allocation.id; })[0];
        var inTile = slot && slot.asset && slot.asset.id === newId;
        var linked = alc && alc.asset && alc.asset.id === newId;
        if (!inTile || !linked) return fail('the writes were sent, but the plan read back does not show ' + (!linked ? 'the link' : 'the article in its tile') + ' yet. Refresh the plan to check');
        S.write.ok = true; S.write.placed = true;
        return { ok: true, note: 'linked to its print item and placed in its tile' };
      }, function (e) { return fail('the writes were sent, but the plan could not be read back (' + ((e && e.message) || e) + ')'); });
    }, function (e) { return fail('linked, but the tile was not filled (' + ((e && e.message) || 'the request failed') + ')'); });
  }
  function fail(msg) {
    S.write.ok = false;
    S.write.error = (S.write.mode === 'link' ? 'Not linked: ' : 'Article created, but ') + msg + '.';
    return { ok: false, error: msg };
  }

  /* ── 5 · return ──────────────────────────────────────────── */
  function afterAsf(info) {
    if (!S) return;
    if (!info || !info.created) { show(); return; }   // nothing created: back to the palette, ticks intact
    if (!S.write || S.write.ok !== true) {             // created, link not done: stay, offer retry
      if (!S.write || S.write.ok == null) S.write = { articleId: info.created, ok: false, error: 'Article created, but it is not linked to its print item yet.' };
      show(); return;
    }
    var msg = 'Created \u201c' + (info.name || 'Untitled') + '\u201d and ' + (S.write && S.write.placed ? 'placed it in its tile.' : 'linked it to its print item.');
    finish(msg);
  }
  function finish(msg) {
    var job = S.job, articleId = (S.write && S.write.articleId) || null;
    close();
    if (job.origin === 'picker' && job.returnUrl) {
      try { sessionStorage.setItem(RESULT_KEY, JSON.stringify({ at: Date.now(), msg: msg, allocId: job.allocation.id })); } catch (e) {}
      window.location.href = job.returnUrl;
      return;
    }
    if (typeof job.onDone === 'function') { try { job.onDone({ msg: msg, articleId: articleId }); } catch (e) {} }
  }
  function cancel() {
    var job = S.job;
    close();
    if (job.origin === 'picker' && job.returnUrl) { window.location.href = job.returnUrl; return; }
    if (typeof job.onDone === 'function') { try { job.onDone({ cancelled: true }); } catch (e) {} }
  }
  function retryLink() {
    var id = S.write && S.write.articleId; if (!id) return;
    toast('Linking the article again\u2026', 'info');
    writeBack(id).then(function (r) {
      if (r && r.ok) finish('Linked the article to its print item' + (S.write.placed ? ' and placed it in its tile.' : '.'));   // build or link
      else { draw(); toast(S.write.error, 'err'); }
    });
  }

  /* ── overlay ─────────────────────────────────────────────── */
  function toast(msg, tone) {
    if (window.IxToast && typeof window.IxToast.show === 'function') { try { window.IxToast.show(msg, tone || 'info'); return; } catch (e) {} }
    console.log(TAG, msg);
  }
  function mount() {
    var o = document.createElement('div');
    o.className = 'ix-overlay cfp-overlay';
    document.body.appendChild(o);
    S.root = o;
    o.addEventListener('click', onClick);
    o.addEventListener('keydown', onKey);
    o.addEventListener('mousedown', gapDown);   // v1.2.0
    gapCss();
    o.addEventListener('input', function (e) {
      if (e.target.hasAttribute('data-cfp-gapprompt')) { var gg = gap(); if (gg.gen) gg.gen.prompt = e.target.value; return; }   // v1.2.0 — no redraw while typing
      if (!e.target.hasAttribute('data-cfp-q')) return;
      S.q = e.target.value; draw();
    });
    document.body.classList.add('cfp-lock');
  }
  // v1.1.3 — !important, because .ix-overlay sets display:flex !important.
  function hide() { if (S && S.root) S.root.style.setProperty('display', 'none', 'important'); document.body.classList.remove('cfp-lock'); }
  function show() { if (S && S.root) { S.root.style.removeProperty('display'); document.body.classList.add('cfp-lock'); draw(); } }
  function close() {
    if (S && S.gap && S.gap.gm && S.gap.gm.parentNode) S.gap.gm.parentNode.removeChild(S.gap.gm);   // v1.2.1
    if (S && S.root && S.root.parentNode) S.root.parentNode.removeChild(S.root);
    document.body.classList.remove('cfp-lock');
    S = null;
  }
  function onKey(e) {
    var t = e.target.closest && e.target.closest('[data-cfp-tile]');
    if (t && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); toggle(t.getAttribute('data-cfp-tile'), e); return; }
    if (e.key === 'Escape') cancel();
  }
  function onClick(e) {
    var t = e.target;
    if (t.closest('[data-cfp-zoom]')) {
      e.stopPropagation();
      var f = fileById(t.closest('[data-cfp-zoom]').getAttribute('data-cfp-zoom'));
      if (f && window.InbxLightbox && window.InbxLightbox.open) window.InbxLightbox.open(f.imageUrl, { caption: f.name });
      return;
    }
    var tile = t.closest('[data-cfp-tile]');
    if (tile) { toggle(tile.getAttribute('data-cfp-tile'), e); return; }
    var pg = t.closest('[data-cfp-page]');
    if (pg) { S.page = Math.max(1, S.page + Number(pg.getAttribute('data-cfp-page'))); draw(); loadPage(S.page); return; }
    if (t.closest('[data-cfp-full]')) {
      var al = S.job.allocation;
      if (window.IxPdfPager && al.pdfUrl) window.IxPdfPager.open({ url: al.pdfUrl, page: S.page, pages: Number(al.issuePages) || undefined, title: al.issueName || '' });
      return;
    }
    // v1.2.0 — missing photos
    if (t.closest('[data-cfp-gapsel]')) { var g0 = gap(); g0.mode = 'select'; g0.crop = ''; g0.gen = null; g0.found = false; draw(); return; }
    if (t.closest('[data-cfp-gapx]')) { if (S.gap && S.gap.gm) gmClose(); S.gap = { mode: 'idle' }; draw(); return; }
    if (t.closest('[data-cfp-gapfind]')) { gapFind(); return; }
    if (t.closest('[data-cfp-gapgen]')) { gmOpen(); return; }
    var lk = t.closest('[data-cfp-link]');
    if (lk) { linkExisting(lk.getAttribute('data-cfp-link')); return; }
    if (t.closest('[data-cfp-nolink]')) { S.existing.dismissed = true; draw(); return; }
    if (t.closest('[data-cfp-recheck]')) { S.pic = { state:'idle', err:'', inPrint:{}, lead:'', note:{} }; runPicturePass(); return; }
    if (t.closest('[data-cfp-more]')) { S.showMore = !S.showMore; draw(); return; }
    if (t.closest('[data-cfp-reset]')) { S.picked = {}; for (var k in S.proposal) S.picked[k] = true; draw(); return; }
    if (t.closest('[data-cfp-retry]')) { S.pool.loading = true; draw(); loadPool(); return; }
    if (t.closest('[data-cfp-rewrite]')) { retryLink(); return; }
    if (t.closest('[data-cfp-cancel]')) { cancel(); return; }
    if (t.closest('[data-cfp-go]')) { build(); return; }
  }

  /* ── public open ─────────────────────────────────────────── */
  function open(job) {
    if (!job || !job.allocation || !job.allocation.id) { toast('Create from print needs a print item.', 'err'); return false; }
    if (job.allocation.type && job.allocation.type !== 'article') {
      toast('Create from print builds articles for now. This print item is \u201c' + job.allocation.type + '\u201d.', 'err');
      return false;
    }
    if (S) close();
    S = fresh(job);
    S.picSeq = 0;
    mount(); draw();
    loadExisting();   // v1.0.2
    loadPool();
    loadPage(S.page);
    return true;
  }

  /* ── Picker entry: read the address on load ──────────────── */
  function safeReturn(r) {
    r = String(r || '');
    return (r.charAt(0) === '/' && r.charAt(1) !== '/') ? r : '';   // same site only
  }
  // v1.1.2 — the Picker's "Set it on the article": open the form, then go back.
  function bootEdit(p) {
    var artId = p.get('ipp_edit'), ret = safeReturn(p.get('ipp_ret'));
    ['ipp_edit', 'ipp_ret'].forEach(function (k) { p.delete(k); });
    try {
      var qs = p.toString();
      history.replaceState(history.state, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
    } catch (e) {}
    var tries = 0;
    (function wait() {
      if (window.InbxASF && typeof window.InbxASF.open === 'function') {
        window.InbxASF.open({ mode: 'edit', assetType: 'article', assetId: artId, articleId: artId,
          onClosed: function () { if (ret) window.location.href = ret; } });
        return;
      }
      if (tries++ > 50) { toast('The article form did not load on this page, so the article could not be opened.', 'err'); return; }
      setTimeout(wait, 100);
    })();
  }
  function boot() {
    var p; try { p = new URLSearchParams(window.location.search); } catch (e) { return; }
    if (p.get('ipp_edit')) { bootEdit(p); return; }                 // v1.1.2
    var allocId = p.get('cfp_alloc'); if (!allocId) return;
    var planId = p.get('cfp_plan') || '', slotId = p.get('cfp_slot') || '', ret = safeReturn(p.get('cfp_ret'));
    ['cfp_alloc', 'cfp_plan', 'cfp_slot', 'cfp_ret'].forEach(function (k) { p.delete(k); });
    try {
      var qs = p.toString();
      history.replaceState(history.state, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
    } catch (e) {}
    var go = function () {
      if (!planId) { toast('Create from print was opened without a plan.', 'err'); return; }
      readBoard(planId).then(function (b) {
        var al = (b.allocations || []).filter(function (a) { return a.id === allocId; })[0];
        if (!al) { toast('That print item is no longer on the plan. Nothing was opened.', 'err'); if (ret) window.location.href = ret; return; }
        open({ allocation: al, planId: planId, slotId: slotId, returnUrl: ret, origin: 'picker', board: b });
      }, function (e) {
        toast('Can\u2019t reach the data worker. Try again. (' + ((e && e.message) || e) + ')', 'err');
      });
    };
    // TA_CONFIG and the ASF load in the page body; wait for both.
    var tries = 0;
    (function wait() {
      if ((window.TA_CONFIG && window.InbxASF) || tries++ > 50) { go(); return; }
      setTimeout(wait, 100);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  /* ── v1.0.3 · Link existing articles (a whole issue) ─────── */
  var L = null;
  function lmScoreLabel(sc) { return sc >= 0.99 ? 'Same title' : sc >= 0.8 ? 'Close' : 'Possible'; }
  function lmArticle(id) { var a = L.arts; for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function lmInit(arts) {
    var taken = {};
    (L.linkedIds || []).forEach(function (id) { taken[id] = 1; });
    L.arts = arts.filter(function (a) { return !taken[a.id]; });
    var pairs = [];
    L.rows.forEach(function (r) {
      r.cands = L.arts.map(function (a) {
        return { id: a.id, score: (titleSim(r.printTitle, a.name) + titleSim(a.name, r.printTitle)) / 2 };
      }).filter(function (c) { return c.score >= EXISTING_AT; })
        .sort(function (x, y) { return y.score - x.score; }).slice(0, LM_CHOICES);
      r.cands.forEach(function (c) { pairs.push({ r: r, c: c }); });
    });
    pairs.sort(function (x, y) { return y.c.score - x.c.score; });
    var usedRow = {}, usedArt = {};
    L.base = {};
    pairs.forEach(function (p) {
      if (usedRow[p.r.id] || usedArt[p.c.id]) return;
      usedRow[p.r.id] = 1; usedArt[p.c.id] = 1;
      L.base[p.r.id] = { art: p.c.id, on: p.c.score >= STRONG_AT };
    });
    L.rows.forEach(function (r) { if (!L.base[r.id]) L.base[r.id] = { art: '', on: false }; });
    L.cur = JSON.parse(JSON.stringify(L.base));
  }
  function lmScore(r, artId) { for (var i = 0; i < r.cands.length; i++) if (r.cands[i].id === artId) return r.cands[i].score; return 0; }
  function lmDupes() {
    var seen = {}, d = {};
    L.rows.forEach(function (r) {
      var c = L.cur[r.id]; if (!c.on || !c.art) return;
      if (seen[c.art]) { d[r.id] = seen[c.art]; d[seen[c.art].id] = r; } else seen[c.art] = r;
    });
    return d;
  }
  function lmToSend() { return L.rows.filter(function (r) { var c = L.cur[r.id]; return c.on && c.art; }); }
  function lmChanged(r) { var a = L.cur[r.id], b = L.base[r.id]; return a.on !== b.on || a.art !== b.art; }
  function lmDraw() {
    if (!L || !L.root) return;
    var body;
    if (L.loading) body = '<div class="cfp-busy"><span class="cfp-stars" aria-hidden="true"><i></i><i></i><i></i></span>Reading this title\u2019s articles and pairing them with the print\u2026</div>';
    else if (L.err) body = '<div class="cfp-err">' + esc(L.err) + '</div>';
    else {
      var dup = lmDupes();
      body = '<table class="cfp-lm-tbl"><thead><tr><th></th><th>Pg</th><th>Printed title</th><th>Existing article</th><th>Match</th></tr></thead><tbody>' +
        L.rows.map(function (r) {
          var c = L.cur[r.id], sc = c.art ? lmScore(r, c.art) : 0, fail = L.fails[r.id];
          var opts = '<option value=""' + (c.art ? '' : ' selected') + '>No match</option>' + r.cands.map(function (k) {
            var a = lmArticle(k.id) || {};
            var meta = [a.at ? String(a.at).slice(0, 10) : '', a.isDraft ? 'Draft' : ''].filter(Boolean).join(' \u00b7 ');
            return '<option value="' + esc(k.id) + '"' + (k.id === c.art ? ' selected' : '') + '>' + esc(a.name + (meta ? '  (' + meta + ')' : '')) + '</option>';
          }).join('');
          return '<tr class="' + (lmChanged(r) ? 'cfp-lm--changed' : '') + (fail ? ' cfp-lm--fail' : '') + '">' +
            '<td><input type="checkbox" data-lm-on="' + esc(r.id) + '"' + (c.on ? ' checked' : '') + (c.art ? '' : ' disabled') + ' aria-label="Link this row"></td>' +
            '<td class="cfp-lm-pg">' + esc(r.page == null ? '' : r.page) + '</td>' +
            '<td class="cfp-lm-pt">' + esc(r.printTitle) + '</td>' +
            '<td><select class="cfp-lm-sel' + (lmChanged(r) ? ' ix-picker-input--changed' : '') + '" data-lm-art="' + esc(r.id) + '"' + (r.cands.length ? '' : ' disabled') + '>' + opts + '</select>' +
              (dup[r.id] ? '<div class="cfp-lm-warn">Also chosen for p.' + esc(dup[r.id].page) + ' \u201c' + esc(dup[r.id].printTitle) + '\u201d</div>' : '') +
              (fail ? '<div class="cfp-lm-warn">Not linked: ' + esc(fail) + '</div>' : '') + '</td>' +
            '<td class="cfp-lm-sc">' + (c.art ? lmScoreLabel(sc) : (r.cands.length ? '' : 'Nothing close')) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }
    var n = L.loading || L.err ? 0 : lmToSend().length;
    var dupN = L.loading || L.err ? 0 : Object.keys(lmDupes()).length;
    var anyChg = !L.loading && !L.err && L.rows.some(lmChanged);
    L.root.innerHTML =
      '<div class="ix-modal ix-modal--wide cfp-modal cfp-lm" role="dialog" aria-modal="true" aria-label="Link existing articles">' +
        '<div class="cfp-head"><div class="cfp-eyebrow">Allocator \u00b7 link existing articles</div>' +
          '<div class="cfp-title">' + esc(L.issueName || 'This issue') + '</div>' +
          '<div class="cfp-sub">' + L.rows.length + ' print item' + (L.rows.length === 1 ? ' has' : 's have') +
            ' no article linked. Strong matches start ticked; check the rest.' + (L.truncated ? ' The article list came back incomplete, so some may be missing.' : '') + '</div></div>' +
        '<div class="cfp-lm-body">' + body + '</div>' +
        '<div class="cfp-foot">' +
          '<span class="cfp-count">' + (L.busy ? 'Linking\u2026' : n + ' to link') +
            (anyChg && !L.busy ? ' \u00b7 <button type="button" class="ix-revert" data-lm-reset>Back to the matches</button>' : '') + '</span>' +
          (dupN ? '<span class="cfp-wfail">One article is chosen for two print items. Pick one.</span>' : '') +
          '<span class="cfp-sp"></span>' +
          '<button type="button" class="ix-revert" data-lm-cancel>Cancel</button>' +
          '<button type="button" class="ix-btn ix-btn--primary cfp-go" data-lm-save' + (n && !dupN && !L.busy ? '' : ' disabled') + '>' +
            (Object.keys(L.fails).length ? 'Try again: link ' : 'Link ') + n + ' article' + (n === 1 ? '' : 's') + '</button>' +
        '</div></div>';
  }
  function lmClose() {
    if (L && L.root && L.root.parentNode) L.root.parentNode.removeChild(L.root);
    document.body.classList.remove('cfp-lock');
    L = null;
  }
  function lmSave() {
    var c = cfg(), rows = lmToSend();
    if (!rows.length || Object.keys(lmDupes()).length) return;
    if (!c.makeSlateWriter) { L.err = 'This page has no TA_CONFIG.makeSlateWriter (Scenario 103B), so nothing can be linked.'; lmDraw(); return; }
    var ops = rows.map(function (r) { return { id: r.id, field: L.linkField, assetId: L.cur[r.id].art }; });
    // Chunk by URL length, as the Picker does.
    var chunks = [], cur = [], batchId = 'cfp-lm-' + Date.now();
    ops.forEach(function (op) {
      var trial = cur.concat([op]);
      if (cur.length && batchUrl(c.makeSlateWriter, 'link', batchId, trial).length > BATCH_URL_CEILING) { chunks.push(cur); cur = [op]; }
      else cur = trial;
    });
    if (cur.length) chunks.push(cur);
    L.busy = true; L.fails = {}; lmDraw();
    var linked = [];
    var seq = Promise.resolve();
    chunks.forEach(function (ch) {
      seq = seq.then(function () {
        return fetch(batchUrl(c.makeSlateWriter, 'link', batchId, ch), { method: 'GET', credentials: 'omit' })
          .then(function (r) {
            return r.text().then(function (t) {
              if (!r.ok) throw new Error('Scenario 103B answered HTTP ' + r.status);
              var b; try { b = JSON.parse(t); } catch (e) { throw new Error('Scenario 103B sent a reply that is not JSON'); }
              return (b && b.results) || [];
            });
          })
          .then(function (res) {
            ch.forEach(function (op, k) {
              var x = null;
              for (var i = 0; i < res.length; i++) if (Number(res[i].i) === k + 1) x = res[i];
              var why = !x ? 'no result came back'
                : x.fieldOk !== true ? '103B refused the field \u201c' + (x.field || op.field) + '\u201d'
                : (x.ok !== true || !x.id) ? (x.err || 'Webflow refused the write')
                : String(x.value || '') !== String(op.assetId) ? 'the print item does not hold the article after the write' : '';
              if (why) L.fails[op.id] = why; else linked.push({ allocId: op.id, articleId: op.assetId });
            });
          }, function (e) {
            ch.forEach(function (op) { L.fails[op.id] = (e && e.message) || 'the request failed'; });
          });
      });
    });
    seq.then(function () {
      if (!L) return;
      L.busy = false;
      var done = L.onDone, nOk = linked.length, nBad = Object.keys(L.fails).length;
      if (linked.length) {
        // Linked rows leave the panel; failed ones stay ticked.
        var ok = {}; linked.forEach(function (x) { ok[x.allocId] = 1; });
        L.rows = L.rows.filter(function (r) { return !ok[r.id]; });
      }
      if (typeof done === 'function') { try { done({ linked: linked }); } catch (e) {} }
      if (!nBad) { lmClose(); toast('Linked ' + nOk + ' article' + (nOk === 1 ? '' : 's') + ' to ' + (nOk === 1 ? 'its print item.' : 'their print items.'), 'ok'); return; }
      lmDraw();
      toast((nOk ? nOk + ' linked, but ' : 'Nothing was linked. ') + nBad + ' failed. They are still ticked for Try again.', 'err');
    });
  }
  function lmClick(e) {
    var t = e.target;
    if (t.closest('[data-lm-cancel]')) { if (!L.busy) lmClose(); return; }
    if (t.closest('[data-lm-reset]')) { L.cur = JSON.parse(JSON.stringify(L.base)); lmDraw(); return; }
    if (t.closest('[data-lm-save]')) { lmSave(); return; }
  }
  function lmChange(e) {
    var t = e.target, id;
    if ((id = t.getAttribute('data-lm-on'))) { L.cur[id].on = !!t.checked; lmDraw(); return; }
    if ((id = t.getAttribute('data-lm-art'))) {
      L.cur[id].art = t.value; L.cur[id].on = !!t.value; lmDraw(); return;
    }
  }
  function linkMany(o) {
    o = o || {};
    var rows = (o.rows || []).filter(function (r) { return r && r.id; });
    if (!rows.length) { toast('Every print item already has an article linked.', 'info'); return false; }
    var base = cfg().assetListUrl, ta = cfg().taItemId;
    if (L) lmClose();
    L = { rows: rows.map(function (r) { return { id: r.id, printTitle: String(r.printTitle || ''), page: r.page }; }),
          linkedIds: o.linkedIds || [], issueName: o.issueName || '', onDone: o.onDone,
          linkField: o.linkField || LINK_FIELD_FALLBACK, loading: true, err: '', fails: {}, busy: false, arts: [] };
    var ov = document.createElement('div');
    ov.className = 'ix-overlay cfp-overlay';
    document.body.appendChild(ov); L.root = ov;
    document.body.classList.add('cfp-lock');
    ov.addEventListener('click', lmClick);
    ov.addEventListener('change', lmChange);
    ov.addEventListener('keydown', function (e) { if (e.key === 'Escape' && L && !L.busy) lmClose(); });
    lmDraw();
    if (!base || !ta) { L.loading = false; L.err = 'This page has no TA_CONFIG.assetListUrl, so the title\u2019s articles cannot be read.'; lmDraw(); return true; }
    fetch(String(base).replace(/\/+$/, '') + '/list?type=article&title=' + encodeURIComponent(ta) + '&fresh=1', { method: 'GET' })
      .then(function (r) {
        return r.text().then(function (t) {
          var j = null; try { j = JSON.parse(t); } catch (e) {}
          if (!r.ok || !j || j.error) throw new Error((j && j.error) || ('HTTP ' + r.status));
          return j;
        });
      })
      .then(function (j) {
        if (!L) return;
        var arts = (j.items || []).filter(function (it) {
          return refList((it.fieldData || {})[ART_TITLE_FIELD]).indexOf(ta) >= 0 && !it.isArchived;
        }).map(function (it) {
          return { id: it.id, name: String((it.fieldData || {}).name || ''), isDraft: !!it.isDraft, at: it.createdOn || it.lastUpdated || '' };
        }).filter(function (a) { return a.name; });
        L.truncated = !!j.truncated;
        lmInit(arts);
        L.loading = false; lmDraw();
      })
      .catch(function (e) {
        if (!L) return;
        L.loading = false; L.err = 'Could not read this title\u2019s articles: ' + ((e && e.message) || e) + '. Nothing was linked.'; lmDraw();
      });
    return true;
  }

  window.InbxCreateFromPrint = { open: open, linkMany: linkMany, version: VERSION, file: FILE,
    _internal: { titleSim: titleSim, scoreGroup: scoreGroup, groupFiles: groupFiles },
    // v1.2.1 — what the guess was based on, for the open palette.
    debug: function () {
      if (!S || !S.ranked) { console.log(TAG, 'no palette open'); return; }
      console.log(TAG, 'key word:', S.key);
      console.table(S.ranked.slice(0, 10).map(function (r) {
        return { bundle: r.group.label, text: hasText(r.group), score: +r.score.toFixed(2), headline: +r.title.toFixed(2), byline: r.byline, photos: r.photos };
      }));
    } };
})();
