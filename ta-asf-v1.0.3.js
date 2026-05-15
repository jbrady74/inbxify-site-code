/* ============================================================
   ta-asf-v1.0.3.js
   INBXIFY TA Studio — ASF (Asset Submission Form) · Article variant
   Fullscreen overlay route invoked via window.InbxASF.open({ articleId, ... })

   Companion stylesheet: ta-asf-v1.0.0.css
   Reference spec:       v0.3 ASF mockup (locked)
   Studio dependency:    ta-studio v1.3.6+  (exposes window.InbxStudioBodyEditor
                         with `returnPanel` support, required for Path 2 RTE)
   RTE dependency:       ta-rte v1.1.4+    (provides InbxRTE.openFullscreen,
                         which Studio's openBodyEditor delegates to)

   ────────────────────────────────────────────────────────────
   v1.0.3 — Character limits + label cleanup
     • CFG.limits values (confirmed by Jeff against Webflow CMS spec
       and Studio v1.3.7 contract):
         title:           60   (was 120 — fabricated)
         subtitle:        60   (was 160 — fabricated)
         bannerStatement: 30   (was 100 — fabricated)
         teaser:         400   (was 280 — corrected to match Studio)
         shortSummary:   150   (was 320 — corrected to match Studio)
     • Removed counters entirely on mainImageAlt / ctaButton /
       ctaText (matches Studio v1.3.7 which doesn't enforce limits
       on these either).
     • Renamed ASF field labels to match Webflow CMS display names
       exactly (single source of truth for editorial terminology):
         "Teaser"        → "Article Teaser Summary"
         "Short Summary" → "Short Article Summary"
       (Studio's labels are still the legacy "Teaser Summary" /
       "Short Summary" — those should be aligned separately when
       Studio is next touched.)

   v1.0.2 — Compact header redesign
     • Replaced two-row header (topbar with breadcrumb + tall title
       bar with two ~200px tiles) with a leaner two-row layout:
         Row 1: ASF badge + article title (24px serif, single line)
                + sponsor pill + "Editing · unsaved"/"No changes"
                dirty stamp + circular × close button.
         Row 2: two horizontal status bars (Readiness + Newsletter),
                each ~52px tall, click-to-toggle.
     • Total header height: ~280px → ~118px (saves ~162px, 58%).
     • Removed: fictional "Studio / Assembler / Article" breadcrumb,
       "ARTICLE · SUBMISSION FORM" eyebrow, MODE / EDIT toggle pill,
       large Readiness "!"/"✓" badge, vertical NEWSLETTER tile.
     • Added: passive dirty stamp (updates incrementally via
       refreshDirtyStamp on every field/switch/select change so the
       header reflects unsaved state without a full re-render).
     • Added action: `focus-newsletter` — clicking the Newsletter
       status bar smooth-scrolls to Row 01 and focuses the
       tentative-newsletter dropdown. Replaces the deleted tile click.
     • Companion CSS: ta-asf-v1.0.3.css (header rules rebuilt).

   v1.0.1 · CMS References tweaks (post-smoke-test)
   ────────────────────────────────────────────────────────────
     • Renamed "Title (T-A)" label → "Major NL Section" (was bound to
       mnlsName, which is the MNLS, not the T-A title — old label
       misled)
     • Renamed "Category" label → "Product Library" (was bound to
       productName, which IS the product library, not a category)
     • Visually unlocked 4 of 6 ref fields: Major NL Section, Newsletter,
       Customer, Product Library. Removed diamond prefix + lock icon;
       render now uses .asf-input.readonly for visual continuity with
       other readonly fields. Underlying values still display-only —
       the CMS-picker edit affordance ships in Chunk D (TD-178).
     • Article ID + Body Status stay locked (system fields).
     • Refs section head hint updated to reflect mixed lock state.

     TD-178 (Chunk D scope): CMS-picker for the 4 unlocked ref fields.
     Each needs a lookup against the appropriate CMS collection
     (MNLS, Newsletters, Customers, Product Libraries) filtered by
     the active T-A. UI pattern reuses the .cmp-card chrome already
     used by Studio's Assembler picker.

   v1.0.0 · Chunks B + C complete
   ────────────────────────────────────────────────────────────
     INFRASTRUCTURE (Chunk B)
     • IIFE shell + VERSION constant
     • CFG (limits, stubs, segments, RTP items, endpoint placeholders,
       sectionFields map, switchFields map, sessionStorage config)
     • State S (article, media, dirty maps, originals snapshot, etc.)
     • Helpers: esc, qs, qsa, cssBg, log, warn, parseIssueNo, mapStatus,
       hasDirty, toast, snapshotOriginals, fieldsEqual, deriveDirtySections,
       closestEl, isDisabled, findNewsletter, isPlaceholderEndpoint
     • CMS hydration via .articles-wrapper[data-article-id]
       (matches Studio's readArticles() shape 1:1 + sentinels HC-12/13/14)
     • MEDIA hydration via .media-wrapper[data-item]
       (matches ta-components-tab's readMediaItems(), filtered + sorted)
     • RTP computation (T1 Auto / T2 N/A-able / T3 Manual) + summary
     • Overlay mount/unmount — matches InbxRTE.openFullscreen pattern
     • Full render tree (Topbar, TitleBar, RTPPanel, Rows 01–04, Footer)
     • window.InbxASF public API: open / close / isOpen / version

     BEHAVIOR (Chunk C)
     • bindAll() — single delegated click + input + change + keydown
       listener on the overlay root, bound ONCE per mount via the
       listenersBound guard.
     • Action router (handleAction) covering:
         - Nav: nav-studio, nav-assembler (soft-close + toast for now)
         - RTP: toggle-rtp (expand/collapse)
         - Section: edit-section, cancel-section (with per-section revert)
         - Newsletter: cancel-newsletter
         - Body: edit-body / launch-body-editor (Path 2 RTE handoff)
         - Tech drawer: toggle-tech-drawer
         - Save: save-draft, publish (both go through HC-15)
         - Image flows: stubbed with toast → ship in Chunk D
     • Field input handlers:
         - Text/textarea: live dirty toggle + .dirty class + charcount update
         - Select (newsletter): full re-render with dirty bookkeeping
         - Switches (renderSwitch + bodyComplete button): in-place toggle
           with class sync; re-render for RTP-affecting switches
         - Article-type segments: switch + Coming Soon overlay
         - RTP T2 N/A checkboxes: live state update + mirror to article
         - RTP T3 Manual checkboxes: live state update
     • Per-section revert: cancel-section restores fields from
       S.originalValues (snapshotted at open-time) and clears the section
       from dirtyFields.
     • Newsletter revert: cancel-newsletter restores S.originalNewsletterChoice.
     • Save-draft flow:
         - Sparse payload (only dirty fields + RTP state changes)
         - POST to CFG.endpoints.saveAsf (HC-15)
         - Placeholder-guard: dev toast + console.log of payload when unset
         - On success: merge server response → re-snapshot → toast
         - On error: restore button state + error toast
     • Publish-and-slot flow:
         - Validates RTP required-pending == 0
         - Validates newsletterChoice is set
         - Same POST endpoint, distinguished by op="publish-and-slot"
         - On success: toast + auto-close after 1.2s
     • Newsletter list (TD-176 / HC-16):
         - Fired on overlay open; HC-16 placeholder → silent stub fallback
         - When resolved: GET ?titleId=... → { newsletters: [...] }
         - Result merged into S.newsletterList; Row 01 re-renders
     • sessionStorage restore (post-RTE-reload):
         - Edit body → writes asf:returnContext = { articleId, ts }
         - Scenario G → page reload → script re-init → tryRestore() reads
           the key (one-shot, < 90s old) and re-opens the same ASF.
         - Polls for .articles-wrapper readiness (up to 2s) before opening.
     • Toast surface: single-instance .asf-toast with info/success/error
       kinds, auto-dismiss (2.8s / 4.5s).
     • Cmd/Ctrl+S keyboard shortcut → save-draft (when dirty + not in RTE).

     IMAGE FLOWS — INTENTIONALLY DEFERRED (Chunk D)
     The buttons render and route to handleAction, but each image
     action currently toasts "Image flows ship in Chunk D".
     Reason: attach-from-MEDIA needs picker UI (no CSS yet); upload
     needs a Scenario B webhook URL (new HC entry); generate needs
     an Anthropic image-gen endpoint (not built). Splitting Chunk D
     out keeps Chunk C reviewable in one sitting.


   ────────────────────────────────────────────────────────────
   Hardcoded values tracked (HC-NNN)
   ────────────────────────────────────────────────────────────
     HC-12  CMS Switch field: sub-title-na  (declared in CSS, hydrated
            here via sentinel class .article-flag-sub-title-na on
            .articles-wrapper — requires Webflow Designer binding)
     HC-13  CMS Switch field: banner-statement-na (sentinel
            .article-flag-banner-statement-na)
     HC-14  CMS Switch field: body-complete (sentinel
            .article-flag-body-complete)
     HC-15  ASF save endpoint URL — placeholder string until Chunk C
            resolves the Scenario G route. Do NOT call from Chunk B.
     HC-16  Tentative Newsletter list endpoint — placeholder. Stub
            list rendered until TD-176 resolves the source decision
            (live webhook vs synthesized from PubPlan DOM).

   ────────────────────────────────────────────────────────────
   Webflow Designer prerequisites (multi-tenant, no extra hardcoding)
   ────────────────────────────────────────────────────────────
     On the existing .articles-wrapper hidden-collection element,
     three new Conditional Visibility flag divs are required so the
     ASF can read switch state (Webflow Switch fields cannot bind
     to data-attributes — same workaround the Studio uses for
     photo-credits / photo-essay / video-article flags):

       <div class="article-flag-sub-title-na">      (HC-12, when ON)
       <div class="article-flag-banner-statement-na"> (HC-13)
       <div class="article-flag-body-complete">     (HC-14)

     Absence of the div = switch OFF. Identical to Studio's existing
     readArticles() switch-sentinel pattern.
   ============================================================ */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  //  VERSION
  // ═══════════════════════════════════════════════════════════════
  var VERSION = '1.0.3';

  // ═══════════════════════════════════════════════════════════════
  //  CFG — limits, segments, RTP items, stubs, endpoint placeholders
  //
  //  Everything in here is data-driven so the render tree never has
  //  to hardcode a label or limit inline. Multi-tenant rule: nothing
  //  in this object is publisher-specific.
  // ═══════════════════════════════════════════════════════════════
  var CFG = {
    // Field character limits (mirrors v0.3 mockup spec)
    limits: {
      title:            60,  // confirmed v1.0.3
      subtitle:         60,  // confirmed v1.0.3
      bannerStatement:  30,  // confirmed v1.0.3
      teaser:          400,  // confirmed v1.0.3 (matches Studio v1.3.7 line 1653)
      shortSummary:    150   // confirmed v1.0.3 (matches Studio v1.3.7 line 1654)
      // mainImageAlt, ctaButton, ctaText — no counters per Jeff
      // (matches Studio v1.3.7 which doesn't enforce limits on these either)
    },

    // Article Type segmented control
    articleTypes: [
      { id: 'standard',    label: 'Standard Article', soon: false },
      { id: 'photo-essay', label: 'Photo Essay',      soon: true  },
      { id: 'video',       label: 'Video Article',    soon: true  }
    ],

    // Row 02 meta sections (A–E). Order matters — drives render order.
    metaSections: [
      { letter: 'A', id: 'identity',    title: 'Identity',        hint: 'title · subtitle · banner · slug' },
      { letter: 'B', id: 'positioning', title: 'Positioning',     hint: 'product type · revenue · print source' },
      { letter: 'C', id: 'narrative',   title: 'Narrative',       hint: 'teaser · short summary · CTA' },
      { letter: 'D', id: 'people',      title: 'People',          hint: 'writer · co-writer · photographer' },
      { letter: 'E', id: 'refs',        title: 'CMS References',  hint: 'CMS-locked · diamond-marked' }
    ],

    // RTP checklist (Readiness to Publish)
    //   t1 = Auto-checked, REQUIRED for publish
    //   t2 = Auto-checked, can be marked N/A (HC-12/13 use this)
    //   t3 = Manual confirmation by operator
    rtpItems: [
      { id: 'title',          label: 'Title set',                tier: 't1' },
      { id: 'main-image',     label: 'Main image attached',      tier: 't1' },
      { id: 'body-complete',  label: 'Body marked complete',     tier: 't1' },
      { id: 'main-image-alt', label: 'Main image alt text',      tier: 't1' },
      { id: 'og-image',       label: 'OG / social image present', tier: 't1' },
      { id: 'subtitle',       label: 'Subtitle set',             tier: 't2', naField: 'subTitleNA'        /* HC-12 */ },
      { id: 'banner',         label: 'Banner statement set',     tier: 't2', naField: 'bannerStatementNA' /* HC-13 */ },
      { id: 'cta',            label: 'CTA configured',           tier: 't2' },
      { id: 'sponsor-ok',     label: 'Sponsor approval received', tier: 't3' },
      { id: 'edit-pass',      label: 'Editorial review complete', tier: 't3' }
    ],

    // Newsletter Assignment states (display only — actual state derives
    // from S.article.newsletterId presence + S.newsletterChoice).
    assignmentStates: {
      unassigned: { label: 'Unassigned',  className: 'unassigned' },
      tentative:  { label: 'Tentative',   className: 'tentative'  },
      committed:  { label: 'Committed',   className: 'committed'  }
    },

    // TD-176 stub. Chunk C will replace this with a fetch from
    // CFG.endpoints.newsletterList (HC-16). The shape is the contract:
    // { id, label, issueNo, date }.
    newsletterStub: [
      { id: '__none__', label: '— Unassigned —',         issueNo: '',    date: ''      },
      { id: 'stub-106', label: 'Issue 106 · May 19',     issueNo: '106', date: 'May 19' },
      { id: 'stub-107', label: 'Issue 107 · May 26',     issueNo: '107', date: 'May 26' },
      { id: 'stub-108', label: 'Issue 108 · Jun 02',     issueNo: '108', date: 'Jun 02' }
    ],

    // Endpoint placeholders. Do NOT fetch these in Chunk B — they're
    // intentionally non-URLs so a stray call fails loud during dev.
    endpoints: {
      saveAsf:        '__HC15_PLACEHOLDER__', // HC-15
      newsletterList: '__HC16_PLACEHOLDER__'  // HC-16 (TD-176)
    },

    // Path 2 RTE handoff. Studio's openBodyEditor reads this and lands
    // the user back on the ASF after Save → reload → restore.
    rteReturnPanel: 'asf',

    // ── Chunk C: section → field map. Used by:
    //    • cancel-section to know which fields to revert
    //    • derived `dirtySections` so section heads can show a dot
    //    • the save payload, which is sliced by section for clarity
    //
    //  Read-only ref values live in their own section but are not in
    //  this map (refs can't be edited via ASF).
    //  Row-level fields (tentativeNewsletter, bodyComplete) live
    //  outside meta-sections; see `rowFields` below.
    sectionFields: {
      identity:    ['name', 'slug', 'subtitle', 'subTitleNA', 'bannerStatement', 'bannerStatementNA'],
      positioning: ['printIssueSource'],
      narrative:   ['teaser', 'shortSummary', 'ctaButton', 'ctaText', 'ctaUrl'],
      people:      ['writerName', 'writerTitle', 'cowriterName', 'cowriterTitle', 'photographer', 'showPhotoCredits'],
      refs:        []
    },

    // Row-level fields (sit outside the meta-sections grid).
    rowFields: {
      assignment: ['tentativeNewsletter'],
      body:       ['bodyComplete']
    },

    // Switch-style fields (boolean toggle, not text). Used by the
    // input handler to know not to compare string values.
    switchFields: {
      subTitleNA:         true,
      bannerStatementNA:  true,
      showPhotoCredits:   true,
      bodyComplete:       true,
      photoEssay:         true,
      videoArticle:       true
    },

    // sessionStorage key for post-RTE-reload restore.
    sessionStorageKey:    'asf:returnContext',
    sessionRestoreMaxAge: 90 * 1000   // 90s — guards against stale keys
  };

  // ═══════════════════════════════════════════════════════════════
  //  STATE — single source of truth for the overlay's lifecycle.
  //
  //  All mutations during Chunk C will go through small setters so
  //  re-render is deterministic; for Chunk B we mutate directly inside
  //  open() and the safety-net handlers.
  // ═══════════════════════════════════════════════════════════════
  var S = {
    open:             false,
    overlay:          null,   // root DOM node (.ta-asf)
    article:          null,   // hydrated article record (readArticles shape)
    media:            [],     // hydrated media items for this article
    articleType:      'standard',
    rtpExpanded:      true,
    rtpNAState:       {},     // { rtpId: true } — T2 N/A toggles (live state)
    rtpManualState:   {},     // { rtpId: true } — T3 manual confirmations
    editingSection:   null,   // 'identity' | 'positioning' | ... | null
    dirtyFields:      {},     // { fieldName: { from, to } } — Revert + save payload
    dirtySections:    {},     // { sectionId: true } — derived from dirtyFields
    newsletterChoice: null,   // { id, label, issueNo, date } when tentative
    bodyEditOpen:     false,  // true while InbxRTE is mounted on top
    saving:           false,
    lastEscHandler:   null,

    // ── Chunk C additions ──
    originalValues:   {},     // snapshot of article fields at open-time (revert source)
    originalNAState:  {},     // snapshot of NA state at open-time
    originalManual:   {},     // snapshot of manual-tier state at open-time
    originalNewsletterChoice: null,  // snapshot for newsletter revert
    techDrawerOpen:   false,
    newsletterList:   null,   // populated by fetchNewsletters (null = not yet fetched)
    toastEl:          null,
    toastTimer:       null,
    listenersBound:   false   // guard against double-binding on re-render
  };

  // ═══════════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════════
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function qs(root, sel) {
    return (root || document).querySelector(sel);
  }

  function qsa(root, sel) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  // Safe CSS background-image for use inside a style="" attribute.
  // The URL sits inside url('...') inside style="..." — a double-nested
  // string context that naive escaping (e.g. JSON.stringify) breaks
  // because outer attribute and inner CSS both use quote chars.
  // Solution: percent-encode the problem characters.
  function cssBg(url) {
    if (!url) return '';
    var safe = String(url)
      .replace(/&/g, '&amp;')
      .replace(/'/g, '%27')
      .replace(/"/g, '%22')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29');
    return "background-image:url('" + safe + "');";
  }

  function log() {
    if (!window.console || !console.log) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[ASF v' + VERSION + ']');
    console.log.apply(console, args);
  }

  function warn() {
    if (!window.console || !console.warn) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[ASF v' + VERSION + ']');
    console.warn.apply(console, args);
  }

  function parseIssueNo(s) {
    if (!s) return '';
    var m = String(s).match(/(\d+)/);
    return m ? m[1] : '';
  }

  function mapStatus(hash) {
    if (!hash) return 'draft';
    return String(hash).toLowerCase();
  }

  function hasDirty() {
    for (var k in S.dirtyFields) {
      if (Object.prototype.hasOwnProperty.call(S.dirtyFields, k)) return true;
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════════════
  //  HELPERS · Chunk C additions
  //
  //  Toast surface, originals snapshot, dirty derivation, small DOM
  //  utilities for delegated event handling. Kept separate from the
  //  Chunk B helper block above so the diff stays auditable.
  // ═══════════════════════════════════════════════════════════════

  // Single-instance toast. CSS classes from ta-asf-v1.0.0.css:
  //   .asf-toast (.show / .success / .error)
  function toast(msg, kind) {
    if (!S.overlay) return;
    kind = kind || 'info';

    // Reuse the existing toast node if present; otherwise create one.
    if (!S.toastEl || !S.toastEl.parentNode) {
      S.toastEl = document.createElement('div');
      S.toastEl.className = 'asf-toast';
      S.overlay.appendChild(S.toastEl);
    }
    // Reset kind classes
    S.toastEl.className = 'asf-toast' + (kind === 'success' ? ' success' : kind === 'error' ? ' error' : '');
    S.toastEl.textContent = String(msg);

    // Force reflow before adding .show so the transition runs even on
    // back-to-back toasts.
    /* eslint-disable no-unused-expressions */
    S.toastEl.offsetHeight;
    /* eslint-enable no-unused-expressions */
    S.toastEl.classList.add('show');

    if (S.toastTimer) clearTimeout(S.toastTimer);
    S.toastTimer = setTimeout(function () {
      if (S.toastEl) S.toastEl.classList.remove('show');
      S.toastTimer = null;
    }, kind === 'error' ? 4500 : 2800);
  }

  // Snapshot the editable subset of S.article into S.originalValues
  // so cancel-section / cancel-newsletter can revert without a re-hydrate.
  function snapshotOriginals() {
    var a = S.article || {};
    var snap = {};
    var allFields = [];
    var sf = CFG.sectionFields;
    for (var sec in sf) {
      if (!Object.prototype.hasOwnProperty.call(sf, sec)) continue;
      allFields = allFields.concat(sf[sec]);
    }
    allFields = allFields.concat(CFG.rowFields.assignment, CFG.rowFields.body);
    for (var i = 0; i < allFields.length; i++) {
      var k = allFields[i];
      snap[k] = (k in a) ? a[k] : null;
    }
    S.originalValues = snap;

    // RTP NA/Manual originals: NA is sourced from article flags (HC-12, HC-13);
    // for CTA there's no persisted source so we treat false as original.
    S.originalNAState = {
      subtitle: !!a.subTitleNA,
      banner:   !!a.bannerStatementNA,
      cta:      false
    };
    S.originalManual = {};   // manual tier (sponsor-ok, edit-pass) — always false at open
    S.originalNewsletterChoice = null;

    // Seed live rtpNAState from article flags so the RTP panel matches reality.
    S.rtpNAState = {
      subtitle: S.originalNAState.subtitle,
      banner:   S.originalNAState.banner,
      cta:      S.originalNAState.cta
    };
    S.rtpManualState = {};
  }

  // Loose equality that treats null/undefined/'' as equivalent, so an
  // untouched empty field doesn't get flagged dirty on focus-blur.
  function fieldsEqual(a, b) {
    if (a == null && (b === '' || b == null)) return true;
    if (b == null && (a === '' || a == null)) return true;
    if (typeof a === 'boolean' || typeof b === 'boolean') return !!a === !!b;
    return String(a) === String(b);
  }

  function deriveDirtySections() {
    var out = {};
    var sf = CFG.sectionFields;
    for (var sec in sf) {
      if (!Object.prototype.hasOwnProperty.call(sf, sec)) continue;
      var fields = sf[sec];
      for (var i = 0; i < fields.length; i++) {
        if (S.dirtyFields[fields[i]]) { out[sec] = true; break; }
      }
    }
    S.dirtySections = out;
  }

  // Minimal closest() polyfill wrapper; preferred over IIFE-internal
  // closures so each handler is testable.
  function closestEl(el, sel) {
    while (el && el.nodeType === 1) {
      if (el.matches && el.matches(sel)) return el;
      el = el.parentNode;
    }
    return null;
  }

  function isDisabled(el) {
    return !!(el && (el.disabled || el.getAttribute('aria-disabled') === 'true'));
  }

  // Lookup newsletter stub/list by id.
  function findNewsletter(id) {
    var list = S.newsletterList || CFG.newsletterStub;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  // True when an endpoint is still a placeholder (HC-15 / HC-16 unresolved).
  function isPlaceholderEndpoint(url) {
    return !url || /^__HC\d+_PLACEHOLDER__$/.test(String(url));
  }

  // ═══════════════════════════════════════════════════════════════
  //  CMS HYDRATION — Article
  //
  //  Reads the hidden .articles-wrapper[data-article-id=...] element
  //  rendered by Webflow's Collection List. Shape matches Studio's
  //  readArticles() output exactly (Studio v1.3.7 line 1528+), so
  //  downstream consumers (RTP, save payload, OG preview) can use
  //  identical keys. Three new flag sentinels added for HC-12/13/14.
  // ═══════════════════════════════════════════════════════════════
  function hydrateArticle(articleId) {
    if (!articleId) return null;
    var el = document.querySelector(
      '.articles-wrapper[data-article-id="' + articleId + '"]'
    );
    if (!el) {
      warn('hydrateArticle: no .articles-wrapper found for', articleId);
      return null;
    }
    var d = el.dataset || {};

    // Rich Text body — cannot bind to data-attribute in Webflow, so
    // we read innerHTML from the .article-body-source RTE element.
    var bodyEl = el.querySelector('.article-body-source');
    var bodyHtml = bodyEl ? bodyEl.innerHTML : '';

    // Switch sentinels — Webflow Switch fields can't bind to
    // data-attributes either, so we use Conditional Visibility:
    // presence of the flag div = ON.
    var showPhotoCredits  = !!el.querySelector('.article-flag-photo-credits');
    var photoEssay        = !!el.querySelector('.article-flag-photo-essay');
    var videoArticle      = !!el.querySelector('.article-flag-video-article');
    // ASF-new flags (Webflow Designer must add these):
    var subTitleNA        = !!el.querySelector('.article-flag-sub-title-na');        // HC-12
    var bannerStatementNA = !!el.querySelector('.article-flag-banner-statement-na'); // HC-13
    var bodyComplete      = !!el.querySelector('.article-flag-body-complete');       // HC-14

    return {
      // Identity
      id:               (d.articleId || '').trim(),
      name:             (d.articleTitle || '').trim(),
      slug:             (d.articleSlug || '').trim(),

      // Customer / category / mnls — locked CMS refs
      customerId:       (d.articleCustomerId || '').trim(),
      customerName:     (d.articleCustomerName || '').trim(),
      productId:        (d.categoryId || '').trim(),
      productName:      (d.articleCategory || d.label || '').trim(),
      revenueType:      (d.type || '').trim(),
      mnlsId:           (d.mnlsId || '').trim(),
      mnlsName:         (d.mnlsName || '').trim(),
      newsletterId:     (d.newsletterId || '').trim(),
      newsletterName:   (d.newsletterName || '').trim(),
      newsletterDate:   (d.newsletterDate || '').trim(),

      // Lifecycle
      status:           mapStatus((d.publishStatus || '').trim()),
      bodyStatus:       (d.bodyStatus || '').trim(),
      created:          (d.articleCreated || '').trim(),
      updated:          (d.articleUpdated || '').trim(),

      // Body content
      subtitle:         (d.articleSubtitle || '').trim(),
      bannerStatement:  (d.articleBannerStatement || '').trim(),
      teaser:           (d.articleTeaser || '').trim(),
      shortSummary:     (d.articleShortSummary || '').trim(),
      bodyHtml:         bodyHtml,
      printIssueSource: (d.articlePrintIssueSource || '').trim(),

      // Main image
      mainImageSrc:     (d.articleMainImageSrc || '').trim(),
      mainImageAlt:     (d.articleMainImageAlt || '').trim(),

      // CTA
      ctaButton:        (d.articleCtaButtonText || '').trim(),
      ctaText:          (d.articleCtaText || '').trim(),
      ctaUrl:           (d.articleCtaUrl || '').trim(),

      // Writers
      writerName:       (d.articleWriterName || '').trim(),
      writerTitle:      (d.articleWriterTitle || '').trim(),
      cowriterName:     (d.articleCowriterName || '').trim(),
      cowriterTitle:    (d.articleCowriterTitle || '').trim(),
      writerComposite:  (d.articleWriterComposite || '').trim(),
      cowriterComposite:(d.articleCowriterComposite || '').trim(),

      // Photo / video flags + extras
      showPhotoCredits: showPhotoCredits,
      photographer:     (d.articlePhotographer || '').trim(),
      photoEssay:       photoEssay,
      videoArticle:     videoArticle,
      videoUrl:         (d.articleVideoUrl || '').trim(),
      audioUrl:         (d.articleAudioUrl || '').trim(),

      // ASF-new flags (HC-12 / HC-13 / HC-14)
      subTitleNA:        subTitleNA,
      bannerStatementNA: bannerStatementNA,
      bodyComplete:      bodyComplete
    };
  }

  // ═══════════════════════════════════════════════════════════════
  //  CMS HYDRATION — Media items for this article
  //
  //  Reads every .media-wrapper[data-item] (same as
  //  ta-components-tab v1.0.6 readMediaItems() at line 337+) and
  //  filters to records whose data-article-id matches. Sorted
  //  newest-first by html-created.
  // ═══════════════════════════════════════════════════════════════
  function hydrateMedia(articleId) {
    var wraps = document.querySelectorAll('.media-wrapper[data-item]');
    var items = [];

    Array.prototype.forEach.call(wraps, function (el) {
      var d = el.dataset || {};
      var thisArticleId = (d.articleId || '').trim();
      if (!articleId || thisArticleId !== articleId) return;

      var htmlEl    = el.querySelector('.cm-media-html');
      var htmlInner = htmlEl ? htmlEl.innerHTML : '';
      var htmlText  = htmlEl ? (htmlEl.innerText || htmlEl.textContent || '') : '';
      var createdStr = (d.htmlCreated || '').trim();
      var createdMs  = createdStr ? (new Date(createdStr).getTime() || 0) : 0;

      items.push({
        mediaId:          (d.mediaId || '').trim(),
        name:             (d.mediaName || '').trim(),
        mediaType:        (d.mediaType || '').trim(),
        role:             (d.componentRole || '').trim(),
        status:           (d.status || '').trim(),
        articleId:        thisArticleId,
        customerId:       (d.customerId || '').trim(),
        productId:        (d.productId || '').trim(),
        imageUrl:         (d.imageUrl || '').trim(),
        slug:             (d.slug || '').trim(),
        sourceChannel:    (d.sourceChannel || '').trim(),
        pdfProvenance:    (d.pdfProvenance || '').trim(),
        originalFilename: (d.originalFilename || '').trim(),
        mimeType:         (d.mimeType || '').trim(),
        size:             (d.size || '').trim(),
        createdStr:       createdStr,
        createdMs:        createdMs,
        htmlContent:      htmlInner,
        htmlText:         htmlText
      });
    });

    items.sort(function (a, b) { return b.createdMs - a.createdMs; });
    return items;
  }

  // ═══════════════════════════════════════════════════════════════
  //  RTP COMPUTATION
  //
  //  Single source of truth for "is this article publishable?".
  //  Drives both the title-bar Readiness tile and the expandable
  //  checklist panel. Pure function over S — call any time.
  // ═══════════════════════════════════════════════════════════════
  function computeRTP() {
    var a = S.article || {};
    var hasMainImage = !!a.mainImageSrc || !!findMediaByRole('main-image');
    var hasOgImage   = !!findMediaByRole('og-image') || hasMainImage; // OG falls back to main

    return CFG.rtpItems.map(function (item) {
      var passed = false;
      var markedNA = false;
      var manualChecked = false;

      switch (item.id) {
        case 'title':          passed = !!a.name; break;
        case 'main-image':     passed = hasMainImage; break;
        case 'body-complete':  passed = !!a.bodyComplete; break;
        case 'main-image-alt': passed = !!a.mainImageAlt; break;
        case 'og-image':       passed = hasOgImage; break;

        case 'subtitle':
          markedNA = !!a.subTitleNA || !!S.rtpNAState[item.id];
          passed = markedNA || !!a.subtitle;
          break;
        case 'banner':
          markedNA = !!a.bannerStatementNA || !!S.rtpNAState[item.id];
          passed = markedNA || !!a.bannerStatement;
          break;
        case 'cta':
          markedNA = !!S.rtpNAState[item.id];
          passed = markedNA || !!(a.ctaButton && a.ctaUrl);
          break;

        case 'sponsor-ok':
        case 'edit-pass':
          manualChecked = !!S.rtpManualState[item.id];
          passed = manualChecked;
          break;
      }

      return {
        id:            item.id,
        label:         item.label,
        tier:          item.tier,
        naField:       item.naField || null,
        passed:        passed,
        markedNA:      markedNA,
        manualChecked: manualChecked
      };
    });
  }

  function findMediaByRole(role) {
    for (var i = 0; i < S.media.length; i++) {
      if (S.media[i].role === role) return S.media[i];
    }
    return null;
  }

  function rtpReadyState() {
    var rows = computeRTP();
    var required = rows.filter(function (r) { return r.tier === 't1'; });
    var pendingReq = required.filter(function (r) { return !r.passed; });
    var optional = rows.filter(function (r) { return r.tier !== 't1'; });
    return {
      ready:           pendingReq.length === 0,
      passedCount:     rows.filter(function (r) { return r.passed; }).length,
      totalCount:      rows.length,
      requiredPending: pendingReq.length,
      requiredTotal:   required.length,
      optionalPassed:  optional.filter(function (r) { return r.passed; }).length,
      optionalTotal:   optional.length,
      rows:            rows
    };
  }

  // ═══════════════════════════════════════════════════════════════
  //  OVERLAY MOUNT / UNMOUNT
  //
  //  Pattern lifted from InbxRTE.openFullscreen so the two overlays
  //  feel identical at the OS level: full-viewport mount as a child
  //  of <body>, body class to lock scroll, Esc to close (with dirty
  //  guard). Esc handler is captured so unmount can remove the same
  //  reference (no closures leaking).
  // ═══════════════════════════════════════════════════════════════
  function mount() {
    // Defensive: tear down any stale instance (e.g. dev hot-reload).
    if (S.overlay && S.overlay.parentNode) {
      try { S.overlay.parentNode.removeChild(S.overlay); } catch (e) {}
    }
    // Also remove any orphaned .ta-asf nodes from prior broken sessions.
    Array.prototype.forEach.call(
      document.querySelectorAll('.ta-asf'),
      function (el) { try { el.remove(); } catch (e) {} }
    );

    S.overlay = document.createElement('div');
    S.overlay.className = 'ta-asf';
    S.overlay.innerHTML =
      '<div class="asf-overlay">' +
        '<div class="asf-panel" id="asf-panel"></div>' +
      '</div>';
    document.body.appendChild(S.overlay);
    document.body.classList.add('asf-open');

    S.lastEscHandler = function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        // Don't intercept Esc while the RTE is layered on top — let
        // ta-rte's own Esc handler run first. ta-rte unsets the
        // overlay before its Esc returns, so the next Esc lands here.
        if (S.bodyEditOpen) return;
        e.preventDefault();
        attemptClose();
      }
    };
    document.addEventListener('keydown', S.lastEscHandler);
  }

  function unmount() {
    if (S.lastEscHandler) {
      document.removeEventListener('keydown', S.lastEscHandler);
      S.lastEscHandler = null;
    }
    if (S.overlay && S.overlay.parentNode) {
      try { S.overlay.parentNode.removeChild(S.overlay); } catch (e) {}
    }
    S.overlay = null;
    document.body.classList.remove('asf-open');
    document.body.style.overflow = '';
  }

  function attemptClose() {
    // Chunk C will replace the confirm() with a proper modal (using
    // ix-modals primitives) and a more granular dirty summary.
    if (hasDirty()) {
      if (!window.confirm('You have unsaved changes in the form. Discard and close?')) return;
    }
    publicClose();
  }

  // ═══════════════════════════════════════════════════════════════
  //  RENDER — top-level orchestrator
  //
  //  innerHTML replacement is intentional. The ASF is short-lived,
  //  state changes are coarse (segment switch, RTP toggle, save), and
  //  full re-renders are cheaper than diffing for this surface size.
  //  Chunk C may add fine-grained patch helpers if perf demands.
  // ═══════════════════════════════════════════════════════════════
  function render() {
    var panel = qs(S.overlay, '#asf-panel');
    if (!panel) return;

    var rtp = rtpReadyState();

    panel.innerHTML =
      renderTopbar() +
      renderTitleBar(rtp) +
      renderRTPPanel(rtp) +
      '<div class="asf-body">' +
        renderRow01() +
        renderRow02() +
        renderRow03() +
        renderRow04() +
      '</div>' +
      renderFooter(rtp);

    bindAll();
  }

  // ═══════════════════════════════════════════════════════════════
  //  bindAll() — SAFETY-NET ONLY in Chunk B.
  //
  //  Chunk C fills in the rest: field change handlers, switch
  //  toggles, segmented-control click, edit-section / cancel-section,
  //  RTP NA checkboxes, RTP manual checkboxes, attach/upload/generate,
  //  tech drawer, save-draft, publish, newsletter dropdown commit, etc.
  //
  //  Wired here (because the overlay is otherwise un-dismissable, and
  //  Jeff specified the Path 2 RTE contract in the prompt):
  //    • Topbar Close button             → attemptClose
  //    • Footer Cancel button            → attemptClose
  //    • Esc keydown                     → attemptClose (mount-level)
  //    • Path 2 "Edit body" button       → launchBodyEditor
  // ═══════════════════════════════════════════════════════════════
  function bindAll() {
    // Mount-level listeners (one-time per overlay instance). The render
    // tree is replaced on every render() call, but the overlay root is
    // stable, so we attach listeners ONCE via event delegation.
    if (S.listenersBound) return;
    var root = S.overlay;
    if (!root) return;

    // ── Delegated event router (handles every interactive element) ──
    root.addEventListener('click',  onDelegatedClick);
    root.addEventListener('input',  onDelegatedInput);
    root.addEventListener('change', onDelegatedChange);
    root.addEventListener('keydown', onDelegatedKeydown);

    S.listenersBound = true;
  }

  // ═══════════════════════════════════════════════════════════════
  //  Path 2 RTE handoff
  //
  //  Contract (locked in spec):
  //    window.InbxStudioBodyEditor({
  //      articleItemId, articleTitle, returnPanel: 'asf'
  //    })
  //
  //  Studio's openBodyEditor → InbxRTE.openFullscreen → on save:
  //  Scenario G (post-body + post-body-html dual-write) → page reload
  //  → Studio's restore reads returnPanel and re-launches the ASF.
  //  Chunk C will add the restore-on-mount path that reads sessionStorage
  //  and re-opens the ASF for the same articleId post-reload.
  // ═══════════════════════════════════════════════════════════════
  function launchBodyEditor() {
    if (!S.article || !S.article.id) {
      warn('launchBodyEditor: no article in state');
      return;
    }
    if (typeof window.InbxStudioBodyEditor !== 'function') {
      warn('launchBodyEditor: window.InbxStudioBodyEditor is missing — Studio v1.3.6+ required');
      toast('Body editor is unavailable — load Studio v1.3.6 or newer', 'error');
      return;
    }

    // RTE save → Scenario G → page reload. Any unsaved ASF edits would
    // be lost. Warn before handing off.
    if (hasDirty()) {
      var ok = window.confirm(
        'You have unsaved ASF changes that will be lost when the body editor reloads the page.\n\n' +
        'Save draft first, or click OK to discard them and continue to the body editor.'
      );
      if (!ok) return;
    }

    // Write restore context so ASF can re-open itself after the reload.
    try {
      sessionStorage.setItem(CFG.sessionStorageKey, JSON.stringify({
        articleId: S.article.id,
        ts:        Date.now()
      }));
    } catch (e) {
      warn('sessionStorage write failed (private mode?)', e);
    }

    S.bodyEditOpen = true;
    window.InbxStudioBodyEditor({
      articleItemId: S.article.id,
      articleTitle:  S.article.name,
      returnPanel:   CFG.rteReturnPanel  // 'asf'
    });
  }

  // ───────────────────────────────────────────────────────────────
  //  RENDER · Topbar
  // ───────────────────────────────────────────────────────────────
  function renderTopbar() {
    // v1.0.2 — new compact row 1: ASF badge + title + sponsor pill +
    // dirty stamp + close X. Replaces the old breadcrumb topbar +
    // separate title-bar layout. Function name kept for render()'s
    // call signature continuity; emitted DOM is brand new.
    var a = S.article || {};
    var hasSponsor = !!a.customerName;

    var sponsorHtml = hasSponsor
      ? '<span class="asf-hdr-sponsor-pill">' +
          '<span class="lbl">Sponsor</span>' +
          esc(a.customerName) +
        '</span>'
      : '<span class="asf-hdr-sponsor-pill editorial">' +
          '<span class="lbl">Editorial</span>' +
          'no sponsor' +
        '</span>';

    var dirty = hasDirty();
    var stampCls  = dirty ? 'on' : 'off';
    var stampText = dirty ? 'Editing · unsaved' : 'No changes';

    return '' +
      '<div class="asf-hdr-row1">' +
        '<div class="asf-hdr-left">' +
          '<div class="asf-hdr-mark">ASF</div>' +
          '<div class="asf-hdr-title">' + esc(a.name || 'Untitled article') + '</div>' +
          sponsorHtml +
        '</div>' +
        '<div class="asf-hdr-right">' +
          '<span class="asf-hdr-dirty-stamp ' + stampCls + '">' +
            '<span class="dot"></span>' + esc(stampText) +
          '</span>' +
          '<button class="asf-hdr-close" type="button"' +
            ' aria-label="Close ASF" data-asf-action="close-overlay">×</button>' +
        '</div>' +
      '</div>';
  }

  // ───────────────────────────────────────────────────────────────
  //  RENDER · Row 2 — status bars
  //  (function name preserved for render() call site; replaces the
  //   old 1fr/320px/280px tile grid)
  // ───────────────────────────────────────────────────────────────
  function renderTitleBar(rtp) {
    return '' +
      '<div class="asf-hdr-row2">' +
        renderReadinessTile(rtp) +
        renderAssignmentTile() +
      '</div>';
  }

  // Readiness status bar (replaces the old 200px tile).
  // The entire bar is the toggle for the RTP checklist drawer below.
  function renderReadinessTile(rtp) {
    var ready    = rtp.ready;
    var stateCls = ready ? 'ready' : '';
    var iconCls  = ready ? 'ok'    : 'warn';
    var icon     = ready ? '✓'     : '!';
    var statusTxt = ready ? 'Ready to publish' : 'Not yet ready';
    var statusCls = ready ? 'ok-text' : 'warn-text';
    var chevTxt  = S.rtpExpanded ? 'Hide checklist' : 'Show checklist';
    var caret    = S.rtpExpanded ? '▴' : '▾';

    return '' +
      '<button type="button" class="asf-status-bar readiness ' + stateCls + '"' +
        ' data-asf-action="toggle-rtp" data-asf-tile="readiness">' +
        '<span class="asf-sb-icon ' + iconCls + '">' + icon + '</span>' +
        '<span class="asf-sb-status ' + statusCls + '">' + esc(statusTxt) + '</span>' +
        '<span class="asf-sb-detail">' +
          '<strong>' + rtp.passedCount + '</strong> of ' +
          '<strong>' + rtp.totalCount  + '</strong> checks passed' +
        '</span>' +
        '<span class="asf-sb-chevron">' + esc(chevTxt) +
          ' <span class="caret">' + caret + '</span>' +
        '</span>' +
      '</button>';
  }

  // Newsletter status bar — 4 visual states: committed, tentative,
  // unassigned, and the default partial. Clicking the bar focuses
  // the dropdown in Row 01 (no inline picker yet — Chunk D ships
  // that as part of the CMS-ref editing feature, TD-178).
  function renderAssignmentTile() {
    var a = S.article || {};
    var committed = !!a.newsletterId;
    var tentative = !committed && S.newsletterChoice &&
                    S.newsletterChoice.id &&
                    S.newsletterChoice.id !== '__none__';

    var stateCls, iconCls, iconChar, issueNo, dateStr, pillCls, pillTxt, chevTxt;
    if (committed) {
      stateCls = 'committed';
      iconCls  = 'blue';
      iconChar = 'N';
      issueNo  = parseIssueNo(a.newsletterName);
      dateStr  = a.newsletterDate || '';
      pillCls  = 'committed';
      pillTxt  = 'Committed';
      chevTxt  = 'Re-slot';
    } else if (tentative) {
      stateCls = 'tentative';
      iconCls  = 'gold';
      iconChar = 'N';
      issueNo  = S.newsletterChoice.issueNo;
      dateStr  = S.newsletterChoice.date || '';
      pillCls  = 'tentative';
      pillTxt  = 'Tentative';
      chevTxt  = 'Change';
    } else {
      stateCls = 'unassigned';
      iconCls  = 'empty';
      iconChar = '—';
      issueNo  = '';
      dateStr  = '';
      pillCls  = 'unassigned';
      pillTxt  = 'Unassigned';
      chevTxt  = 'Pick newsletter';
    }

    var middleHtml;
    if (committed || tentative) {
      middleHtml =
        '<span class="asf-sb-issue-num">' +
          '<span class="hash">#</span>' + esc(issueNo) +
          (dateStr ? '<span class="date">' + esc(dateStr) + '</span>' : '') +
        '</span>' +
        '<span class="asf-sb-state-pill ' + pillCls + '">' + esc(pillTxt) + '</span>';
    } else {
      middleHtml =
        '<span class="asf-sb-status asf-sb-status--muted">Unassigned</span>' +
        '<span class="asf-sb-detail">Not yet slotted into a newsletter</span>';
    }

    return '' +
      '<button type="button" class="asf-status-bar newsletter ' + stateCls + '"' +
        ' data-asf-action="focus-newsletter" data-asf-tile="assignment">' +
        '<span class="asf-sb-icon ' + iconCls + '">' + esc(iconChar) + '</span>' +
        middleHtml +
        '<span class="asf-sb-chevron">' + esc(chevTxt) +
          ' <span class="caret">▾</span>' +
        '</span>' +
      '</button>';
  }

  // ───────────────────────────────────────────────────────────────
  //  RENDER · RTP Checklist Panel
  // ───────────────────────────────────────────────────────────────
  function renderRTPPanel(rtp) {
    if (!S.rtpExpanded) return '';

    var itemsHtml = rtp.rows.map(renderRTPItem).join('');
    var pipsHtml  = renderRTPImagePips();

    return '' +
      '<div class="asf-rtp">' +
        '<div class="asf-rtp-head">' +
          '<span class="asf-rtp-head-title">Readiness Checklist</span>' +
          '<span class="asf-rtp-head-count">' +
            '<strong>' + rtp.passedCount + '</strong> / ' + rtp.totalCount + ' · ' +
            '<strong>' + rtp.requiredPending + '</strong> required pending' +
          '</span>' +
          '<button type="button" class="close" data-asf-action="toggle-rtp">Hide ▴</button>' +
        '</div>' +
        '<div class="asf-rtp-list">' +
          itemsHtml +
          pipsHtml +
        '</div>' +
      '</div>';
  }

  function renderRTPItem(r) {
    var iconClass, iconChar;
    if (r.tier === 't3') {
      iconClass = 'manual';
      iconChar  = r.manualChecked ? '✓' : '?';
    } else if (r.passed) {
      iconClass = 'pass';
      iconChar  = '✓';
    } else {
      iconClass = 'fail';
      iconChar  = '!';
    }

    var labelClass = r.passed ? 'passed' : 'failed';
    var tierLabel  = r.tier.toUpperCase();

    var controlHtml = '';
    if (r.tier === 't2' && r.naField) {
      controlHtml = '' +
        '<label class="asf-rtp-na' + (r.markedNA ? ' checked' : '') + '">' +
          '<input type="checkbox" data-asf-rtp-na="' + esc(r.id) + '"' +
            (r.markedNA ? ' checked' : '') + '>' +
          'N/A' +
        '</label>';
    } else if (r.tier === 't3') {
      controlHtml = '' +
        '<label class="asf-rtp-na' + (r.manualChecked ? ' checked' : '') + '">' +
          '<input type="checkbox" data-asf-rtp-manual="' + esc(r.id) + '"' +
            (r.manualChecked ? ' checked' : '') + '>' +
          'Done' +
        '</label>';
    }

    return '' +
      '<div class="asf-rtp-item" data-asf-rtp-id="' + esc(r.id) + '">' +
        '<div class="asf-rtp-icon ' + iconClass + '">' + iconChar + '</div>' +
        '<div class="asf-rtp-label ' + labelClass + '">' + esc(r.label) + '</div>' +
        '<span class="asf-rtp-type ' + r.tier + '">' + tierLabel + '</span>' +
        controlHtml +
      '</div>';
  }

  function renderRTPImagePips() {
    var mainImg = findMediaByRole('main-image');
    var ogImg   = findMediaByRole('og-image');
    var inline  = S.media.filter(function (m) {
      return m.mediaType === 'image' &&
             m.role !== 'main-image' &&
             m.role !== 'og-image';
    });

    // Always show at least 3 inline slots so the strip doesn't look
    // anemic on empty articles.
    var pips = [];
    pips.push(renderPip('main', 'MAIN', !!(mainImg || S.article && S.article.mainImageSrc)));
    pips.push(renderPip('og',   'OG',   !!ogImg));

    var placedInline = 0;
    var slotCount = Math.max(inline.length, 3);
    for (var i = 0; i < slotCount; i++) {
      var m = inline[i];
      var present = !!m;
      if (present && (m.status === 'Placed' || /inline/i.test(m.role || ''))) placedInline++;
      pips.push(renderPip('inline', 'I' + (i + 1), present));
    }

    var summary = '' +
      '<strong>' + (mainImg || (S.article && S.article.mainImageSrc) ? 1 : 0) + '</strong> main · ' +
      '<strong>' + (ogImg ? 1 : 0) + '</strong> OG · ' +
      '<strong>' + placedInline + '</strong> inline placed';

    return '' +
      '<div class="asf-rtp-images">' +
        '<div class="asf-rtp-images-label">Image Status</div>' +
        '<div class="asf-rtp-images-strip">' + pips.join('') + '</div>' +
        '<div class="asf-rtp-images-summary">' + summary + '</div>' +
      '</div>';
  }

  function renderPip(roleClass, label, present) {
    var dotClass;
    if (label === 'MAIN' && !present)      dotClass = 'red';
    else if (present)                       dotClass = 'green';
    else                                    dotClass = 'empty';
    var pipExtra = roleClass === 'main' ? ' main' : '';
    return '' +
      '<div class="asf-rtp-image-pip' + pipExtra + '">' +
        '<div class="dot ' + dotClass + '"></div>' +
        '<div class="pip-label">' + esc(label) + '</div>' +
      '</div>';
  }

  // ───────────────────────────────────────────────────────────────
  //  RENDER · Row 01 — Newsletter Assignment
  // ───────────────────────────────────────────────────────────────
  function renderRow01() {
    var a = S.article || {};
    var committed = !!a.newsletterId;
    var tentative = !committed && S.newsletterChoice && S.newsletterChoice.id && S.newsletterChoice.id !== '__none__';

    var stateClass, stateLabel, detailHtml;
    if (committed) {
      stateClass = 'committed';
      stateLabel = 'Committed';
      detailHtml = 'Assigned to <strong>' + esc(a.newsletterName) + '</strong>' +
                   (a.newsletterDate ? ' · <strong>' + esc(a.newsletterDate) + '</strong>' : '');
    } else if (tentative) {
      stateClass = 'tentative';
      stateLabel = 'Tentative';
      detailHtml = 'Penciled to <strong>' + esc(S.newsletterChoice.label) + '</strong> · awaiting commit on Publish';
    } else {
      stateClass = 'unassigned';
      stateLabel = 'Unassigned';
      detailHtml = 'Not yet slotted into a newsletter';
    }

    var dropdownDirty = tentative ? ' dirty' : '';
    var nlList = S.newsletterList || CFG.newsletterStub;
    var dropdownOptions = nlList.map(function (n) {
      var selected = S.newsletterChoice && S.newsletterChoice.id === n.id ? ' selected' : '';
      return '<option value="' + esc(n.id) + '"' + selected + '>' + esc(n.label) + '</option>';
    }).join('');

    var slotValue = tentative ? S.newsletterChoice.issueNo : '';
    var dateValue = tentative ? S.newsletterChoice.date : '';

    var cancelLinkHtml = tentative
      ? '<button type="button" class="asf-section-cancel" data-asf-action="cancel-newsletter">Revert</button>'
      : '';

    return '' +
      '<section class="asf-row assignment-row">' +
        renderRowHeader('01', 'Newsletter Assignment', 'tentative slot · committed at publish', 'blue') +
        '<div class="asf-assignment-state-bar">' +
          '<span class="asf-state-pill ' + stateClass + '">' + esc(stateLabel) + '</span>' +
          '<span class="asf-state-detail">' + detailHtml + '</span>' +
          cancelLinkHtml +
        '</div>' +
        '<div class="asf-assignment-fields">' +
          '<div class="asf-field">' +
            '<label class="asf-field-label">' +
              'Tentative Newsletter <span class="hint">(TD-176 · stub list)</span>' +
            '</label>' +
            '<select class="asf-select' + dropdownDirty + '" data-asf-field="tentativeNewsletter">' +
              dropdownOptions +
            '</select>' +
          '</div>' +
          renderReadonlyInput('Issue Slot', slotValue || '—') +
          renderReadonlyInput('Send Date',  dateValue || '—') +
        '</div>' +
      '</section>';
  }

  function renderRowHeader(num, title, hint, numClass) {
    var rowNumCls = 'asf-row-num' + (numClass ? ' ' + numClass : '');
    return '' +
      '<div class="asf-row-header">' +
        '<div class="asf-row-header-left">' +
          '<span class="' + rowNumCls + '">' + esc(num) + '</span>' +
          '<span class="asf-row-title">' + esc(title) + '</span>' +
          '<span class="asf-row-hint">' + esc(hint) + '</span>' +
        '</div>' +
        '<div class="asf-row-header-right"></div>' +
      '</div>';
  }

  function renderReadonlyInput(label, value) {
    return '' +
      '<div class="asf-field">' +
        '<label class="asf-field-label">' + esc(label) + '</label>' +
        '<input type="text" class="asf-input readonly" value="' + esc(value) + '" readonly>' +
      '</div>';
  }

  // ───────────────────────────────────────────────────────────────
  //  RENDER · Row 02 — Article Type segmented + 5 meta sections A–E
  // ───────────────────────────────────────────────────────────────
  function renderRow02() {
    var segsHtml = CFG.articleTypes.map(function (t) {
      var activeCls = S.articleType === t.id ? ' active' : '';
      var soonTag = t.soon ? '<span class="soon-tag">Soon</span>' : '';
      var disabledAttr = t.soon ? ' disabled' : '';
      return '<button type="button" class="asf-at-seg' + activeCls + '"' +
        ' data-asf-type="' + esc(t.id) + '"' + disabledAttr + '>' +
        esc(t.label) + ' ' + soonTag +
      '</button>';
    }).join('');

    var currentType = CFG.articleTypes.filter(function (t) {
      return t.id === S.articleType;
    })[0];
    var currentLabel = currentType ? currentType.label : 'Standard Article';

    var sectionsHtml = CFG.metaSections.map(renderMetaSection).join('');
    var overlayHtml = S.articleType !== 'standard' ? renderComingSoonOverlay(S.articleType) : '';

    return '' +
      '<section class="asf-row">' +
        renderRowHeader('02', 'Article Meta', 'identity · positioning · narrative · people · refs') +
        '<div class="asf-article-type-block">' +
          '<span class="asf-at-label">Article Type</span>' +
          '<div class="asf-at-segments">' + segsHtml + '</div>' +
          '<span class="asf-at-current">Current: ' + esc(currentLabel) + '</span>' +
        '</div>' +
        '<div class="asf-meta-sections">' +
          sectionsHtml +
          overlayHtml +
        '</div>' +
      '</section>';
  }

  function renderMetaSection(sec) {
    var isRefs    = sec.id === 'refs';
    var isEditing = S.editingSection === sec.id;
    // Refs is always read-only (CMS-locked diamond fields). Every other
    // section is read-only by default and flips to edit on the row
    // edit link. The CSS .readonly modifier strips backgrounds,
    // borders, padding, and pointer-events on inputs.
    var sectionCls = 'asf-meta-section';
    if (isRefs)                  sectionCls += ' refs readonly';
    else if (!isEditing)         sectionCls += ' readonly';

    var headRight;
    if (isRefs) {
      headRight = '<span class="asf-meta-section-hint">edit picker for refs ships in Chunk D · 2 system fields stay locked</span>';
    } else if (isEditing) {
      headRight = '<button type="button" class="asf-section-cancel"' +
        ' data-asf-action="cancel-section" data-asf-section-id="' + esc(sec.id) + '">' +
        'Revert changes</button>';
    } else {
      headRight = '<button type="button" class="asf-row-edit-link"' +
        ' data-asf-action="edit-section" data-asf-section-id="' + esc(sec.id) + '">' +
        'Edit ' + esc(sec.title.toLowerCase()) + '</button>';
    }

    var inner = '';
    switch (sec.id) {
      case 'identity':    inner = renderSectionIdentity();    break;
      case 'positioning': inner = renderSectionPositioning(); break;
      case 'narrative':   inner = renderSectionNarrative();   break;
      case 'people':      inner = renderSectionPeople();      break;
      case 'refs':        inner = renderSectionRefs();        break;
    }

    return '' +
      '<div class="' + sectionCls + '" data-asf-section="' + esc(sec.id) + '">' +
        '<div class="asf-meta-section-head">' +
          '<div class="asf-meta-section-title">' +
            '<span class="letter">' + esc(sec.letter) + '</span>' +
            esc(sec.title) +
          '</div>' +
          headRight +
        '</div>' +
        inner +
      '</div>';
  }

  function renderSectionIdentity() {
    var a = S.article || {};
    var lim = CFG.limits;
    return '' +
      '<div class="asf-fgrid asf-fgrid-title">' +
        renderField({ label: 'Title', req: true, value: a.name, field: 'name', limit: lim.title }) +
        renderField({ label: 'Slug', value: a.slug, field: 'slug', placeholder: 'spring-home-improvement-guide' }) +
        renderField({ label: 'Status', value: a.status, field: 'status', readonly: true }) +
      '</div>' +
      '<div class="asf-fgrid-spacer"></div>' +
      '<div class="asf-fgrid asf-fgrid-2">' +
        renderField({ label: 'Subtitle', value: a.subtitle, field: 'subtitle', limit: lim.subtitle }) +
        renderSwitch({ label: 'Mark subtitle as N/A (HC-12)', field: 'subTitleNA', on: a.subTitleNA }) +
        renderField({ label: 'Banner Statement', value: a.bannerStatement, field: 'bannerStatement', limit: lim.bannerStatement }) +
        renderSwitch({ label: 'Mark banner as N/A (HC-13)', field: 'bannerStatementNA', on: a.bannerStatementNA }) +
      '</div>';
  }

  function renderSectionPositioning() {
    var a = S.article || {};
    return '' +
      '<div class="asf-fgrid asf-fgrid-3">' +
        renderField({ label: 'Product Type', value: a.productName, field: 'productName', readonly: true, hint: '(from CMS ref)' }) +
        renderField({ label: 'Revenue Type', value: a.revenueType, field: 'revenueType', readonly: true }) +
        renderField({ label: 'Print Issue Source', value: a.printIssueSource, field: 'printIssueSource' }) +
      '</div>';
  }

  function renderSectionNarrative() {
    var a = S.article || {};
    var lim = CFG.limits;
    return '' +
      '<div class="asf-fgrid asf-fgrid-2">' +
        renderTextarea({ label: 'Article Teaser Summary', req: true, value: a.teaser, field: 'teaser', limit: lim.teaser }) +
        renderTextarea({ label: 'Short Article Summary', value: a.shortSummary, field: 'shortSummary', limit: lim.shortSummary, long: true }) +
      '</div>' +
      '<div class="asf-fgrid-spacer"></div>' +
      '<div class="asf-fgrid asf-fgrid-3">' +
        renderField({ label: 'CTA Button Text', value: a.ctaButton, field: 'ctaButton' }) +
        renderField({ label: 'CTA Text', value: a.ctaText, field: 'ctaText' }) +
        renderField({ label: 'CTA URL', value: a.ctaUrl, field: 'ctaUrl', mono: true, placeholder: 'https://…' }) +
      '</div>';
  }

  function renderSectionPeople() {
    var a = S.article || {};
    return '' +
      '<div class="asf-fgrid asf-fgrid-2">' +
        renderField({ label: 'Writer Name', value: a.writerName, field: 'writerName' }) +
        renderField({ label: 'Writer Title', value: a.writerTitle, field: 'writerTitle' }) +
        renderField({ label: 'Co-writer Name', value: a.cowriterName, field: 'cowriterName' }) +
        renderField({ label: 'Co-writer Title', value: a.cowriterTitle, field: 'cowriterTitle' }) +
      '</div>' +
      '<div class="asf-fgrid-spacer"></div>' +
      '<div class="asf-fgrid asf-fgrid-2">' +
        renderField({ label: 'Photographer', value: a.photographer, field: 'photographer' }) +
        renderSwitch({ label: 'Show photo credits in article', field: 'showPhotoCredits', on: a.showPhotoCredits }) +
      '</div>';
  }

  function renderSectionRefs() {
    var a = S.article || {};
    // v1.0.1 — 4 of 6 fields visually unlocked (Major NL Section, Newsletter,
    // Customer, Product Library). Their actual CMS-picker edit affordance
    // ships in Chunk D (TD-178). Article ID + Body Status remain locked —
    // those are system fields that should never be editable from ASF.
    return '' +
      '<div class="asf-fgrid asf-fgrid-3">' +
        renderUnlockedRef('Major NL Section', a.mnlsName       || '—') +
        renderUnlockedRef('Newsletter',       a.newsletterName || '—') +
        renderUnlockedRef('Customer',         a.customerName   || '—') +
      '</div>' +
      '<div class="asf-fgrid-spacer"></div>' +
      '<div class="asf-fgrid asf-fgrid-3">' +
        renderUnlockedRef('Product Library',  a.productName    || '—') +
        renderLockedRef('Article ID',         a.id             || '—') +
        renderLockedRef('Body Status',        a.bodyStatus     || 'Draft') +
      '</div>';
  }

  // Display-only ref pill WITHOUT the diamond marker or lock icon. Renders
  // as the same .asf-input.readonly style used for non-editable text fields
  // elsewhere in the form — visual continuity. Once the CMS picker ships
  // in Chunk D (TD-178), this will become a clickable trigger.
  function renderUnlockedRef(label, value) {
    return '' +
      '<div class="asf-field">' +
        '<label class="asf-field-label">' + esc(label) + '</label>' +
        '<input type="text" class="asf-input readonly" value="' + esc(value) + '" readonly>' +
      '</div>';
  }

  function renderLockedRef(label, value) {
    return '' +
      '<div class="asf-field">' +
        '<label class="asf-field-label"><span class="diamond">◆</span> ' + esc(label) + '</label>' +
        '<div class="asf-ref-locked-pill">' +
          '<span class="diamond-marker">◆</span>' +
          esc(value) +
          '<span class="lock-icon">🔒</span>' +
        '</div>' +
      '</div>';
  }

  // Generic text input with optional limit, charcounter, mono, readonly,
  // placeholder, required marker, hint suffix.
  function renderField(o) {
    o = o || {};
    var v = o.value == null ? '' : String(o.value);
    var lim = o.limit || 0;
    var len = v.length;
    var over = lim && len > lim;
    var near = lim && len > Math.floor(lim * 0.85) && !over;

    var cls = 'asf-input';
    if (o.readonly)        cls += ' readonly';
    if (o.mono)            cls += ' url';
    if (over)              cls += ' over';
    // .dirty is added by Chunk C bindings on input; not rendered initially.

    var reqMark  = o.req  ? '<span class="req">*</span>'  : '';
    var hintMark = o.hint ? '<span class="hint">' + esc(o.hint) + '</span>' : '';
    var counter = lim
      ? '<span class="asf-charcount' +
          (over ? ' over' : (near ? ' near' : '')) +
        '">' + len + ' / ' + lim + '</span>'
      : '';

    return '' +
      '<div class="asf-field">' +
        '<label class="asf-field-label">' + esc(o.label) + ' ' + reqMark + ' ' + hintMark + '</label>' +
        '<input type="text" class="' + cls + '"' +
          ' data-asf-field="' + esc(o.field) + '"' +
          ' value="' + esc(v) + '"' +
          (o.readonly    ? ' readonly' : '') +
          (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') +
          (lim           ? ' maxlength="' + (lim * 2) + '"' : '') +
        '>' +
        counter +
      '</div>';
  }

  function renderTextarea(o) {
    o = o || {};
    var v = o.value == null ? '' : String(o.value);
    var lim = o.limit || 0;
    var len = v.length;
    var over = lim && len > lim;
    var near = lim && len > Math.floor(lim * 0.85) && !over;

    var cls = 'asf-textarea';
    if (o.long) cls += ' long';
    if (over)   cls += ' over';

    var reqMark = o.req ? '<span class="req">*</span>' : '';
    var counter = lim
      ? '<span class="asf-charcount' +
          (over ? ' over' : (near ? ' near' : '')) +
        '">' + len + ' / ' + lim + '</span>'
      : '';

    return '' +
      '<div class="asf-field">' +
        '<label class="asf-field-label">' + esc(o.label) + ' ' + reqMark + '</label>' +
        '<textarea class="' + cls + '" data-asf-field="' + esc(o.field) + '">' + esc(v) + '</textarea>' +
        counter +
      '</div>';
  }

  function renderSwitch(o) {
    var on = !!o.on;
    var rowCls = 'asf-switch-row' + (on ? ' on' : '');
    var swCls  = 'asf-switch'     + (on ? ' on' : '');
    return '' +
      '<div class="asf-field">' +
        '<label class="asf-field-label">&nbsp;</label>' +
        '<div class="' + rowCls + '" data-asf-switch="' + esc(o.field) + '">' +
          '<span class="asf-switch-label">' + esc(o.label) + '</span>' +
          '<div class="' + swCls + '"></div>' +
        '</div>' +
      '</div>';
  }

  function renderComingSoonOverlay(typeId) {
    var label = typeId === 'photo-essay' ? 'Photo Essay' : 'Video Article';
    var quarter = typeId === 'photo-essay' ? 'Q3 2026' : 'Q4 2026';
    var icon = typeId === 'photo-essay' ? '📸' : '🎬';
    return '' +
      '<div class="asf-coming-soon-overlay">' +
        '<div class="asf-coming-soon-icon">' + icon + '</div>' +
        '<div class="asf-coming-soon-title">' + esc(label) + ' — Coming Soon</div>' +
        '<div class="asf-coming-soon-body">' +
          'The Standard Article form is the only variant available in v' + VERSION + '. ' +
          esc(label) + ' adds dedicated media handling and lives on the platform roadmap.' +
        '</div>' +
        '<div class="asf-coming-soon-tag">Target: ' + esc(quarter) + '</div>' +
      '</div>';
  }

  // ───────────────────────────────────────────────────────────────
  //  RENDER · Row 03 — Media (two-zone + OG preview)
  // ───────────────────────────────────────────────────────────────
  function renderRow03() {
    var mainImg = findMediaByRole('main-image');
    var ogImg   = findMediaByRole('og-image');
    var inline  = S.media.filter(function (m) {
      return m.mediaType === 'image' &&
             m.role !== 'main-image' &&
             m.role !== 'og-image';
    });

    return '' +
      '<section class="asf-row">' +
        renderRowHeader('03', 'Media', 'main image · inline palette · OG preview') +
        '<div class="asf-media-zones">' +
          renderMainImageZone(mainImg) +
          '<div class="asf-media-zone-rule"></div>' +
          renderInlineImagesZone(inline) +
        '</div>' +
        renderOgBlock(ogImg) +
      '</section>';
  }

  function renderMainImageZone(mainImg) {
    var a = S.article || {};
    var lim = CFG.limits;

    var fallbackUrl = a.mainImageSrc || '';
    var displayUrl  = (mainImg && mainImg.imageUrl) || fallbackUrl;
    var displayName = (mainImg && (mainImg.name || mainImg.originalFilename)) || 'main image';
    var displayMime = (mainImg && mainImg.mimeType) || 'image/*';
    var displaySize = (mainImg && mainImg.size) || '—';

    var cardHtml;
    if (displayUrl) {
      cardHtml = '' +
        '<div class="asf-mi-card">' +
          '<div class="asf-mi-preview" style="' + cssBg(displayUrl) + '">' +
            '<span class="asf-mi-preview-label">Main Image</span>' +
            '<span class="asf-mi-preview-aspect">1180 × 600</span>' +
          '</div>' +
          '<div class="asf-mi-info">' +
            '<div class="asf-mi-name">' + esc(displayName) + '</div>' +
            '<div class="asf-mi-dims">' +
              esc(displayMime) + ' · ' + esc(displaySize) + ' · component-role:main-image' +
            '</div>' +
          '</div>' +
          '<div class="asf-mi-actions">' +
            '<button type="button" class="asf-mi-btn" data-asf-action="preview-main-image">Preview full</button>' +
            '<button type="button" class="asf-mi-btn" data-asf-action="replace-main-image">Replace</button>' +
            '<button type="button" class="asf-mi-btn primary" data-asf-action="set-og-from-main">Use as OG</button>' +
          '</div>' +
        '</div>';
    } else {
      cardHtml = '' +
        '<div class="asf-mi-card empty">' +
          '<div class="asf-mi-empty-icon">📷</div>' +
          '<div class="asf-mi-empty-prompt">' +
            'No main image yet. Attach one from the MEDIA library, upload, or generate.' +
          '</div>' +
        '</div>';
    }

    return '' +
      '<div class="asf-media-zone">' +
        '<div class="asf-zone-head">' +
          '<div class="asf-zone-title">Main Image ' +
            '<span class="badge-count">' + (displayUrl ? '1' : '0') + '</span>' +
          '</div>' +
          '<span class="asf-zone-sub">1180 × 600 · top of article</span>' +
        '</div>' +
        cardHtml +
        '<div class="asf-mi-meta-fields">' +
          renderField({
            label: 'Alt text', value: a.mainImageAlt, field: 'mainImageAlt',
            req: true
          }) +
        '</div>' +
        '<div class="asf-upload-options">' +
          '<button type="button" class="asf-upload-btn primary" data-asf-action="attach-main-from-media">📎 Attach from MEDIA</button>' +
          '<button type="button" class="asf-upload-btn" data-asf-action="upload-main">⬆ Upload</button>' +
          '<button type="button" class="asf-upload-btn" data-asf-action="generate-main">✨ Generate</button>' +
        '</div>' +
      '</div>';
  }

  function renderInlineImagesZone(inline) {
    var cardsHtml = inline.map(function (m) {
      var placed = m.status === 'Placed' || /inline/i.test(m.role || '');
      var stateCls   = placed ? 'placed' : 'unassigned';
      var stateLabel = placed ? 'Placed' : 'Unassigned';
      var bg = m.imageUrl ? ' style="' + cssBg(m.imageUrl) + '"' : '';
      var actionsHtml = placed
        ? '<button type="button" class="asf-ia-btn" data-asf-action="replace-inline" data-asf-media-id="' + esc(m.mediaId) + '">Replace</button>'
        : '<button type="button" class="asf-ia-btn gold" data-asf-action="insert-inline" data-asf-media-id="' + esc(m.mediaId) + '">Insert</button>';

      return '' +
        '<div class="asf-inline-card ' + stateCls + '" data-asf-media-id="' + esc(m.mediaId) + '">' +
          '<div class="asf-inline-thumb t-3-2"' + bg + '>' +
            '<span class="asf-inline-state ' + stateCls + '">' + esc(stateLabel) + '</span>' +
            '<span class="asf-inline-aspect">3:2</span>' +
          '</div>' +
          '<div class="asf-inline-info">' +
            '<div class="asf-inline-name">' + esc(m.name || m.originalFilename || 'inline image') + '</div>' +
            '<div class="asf-inline-meta">' +
              esc(m.mimeType || 'image') + ' · ' + esc(m.size || '—') +
              (placed ? '<br><span class="placed-where">in body</span>' : '') +
            '</div>' +
          '</div>' +
          '<div class="asf-inline-actions">' +
            '<button type="button" class="asf-ia-btn" data-asf-action="view-inline" data-asf-media-id="' + esc(m.mediaId) + '">View</button>' +
            actionsHtml +
          '</div>' +
        '</div>';
    }).join('');

    var attachMore = '' +
      '<div class="asf-attach-more" data-asf-action="attach-inline">' +
        '<div class="asf-attach-more-icon">+</div>' +
        '<div class="asf-attach-more-label">Attach inline image</div>' +
      '</div>';

    return '' +
      '<div class="asf-media-zone">' +
        '<div class="asf-zone-head">' +
          '<div class="asf-zone-title">Inline Images ' +
            '<span class="badge-count">' + inline.length + '</span>' +
          '</div>' +
          '<span class="asf-zone-sub">drag onto body in Path 2 editor</span>' +
        '</div>' +
        '<div class="asf-inline-strip">' +
          cardsHtml +
          attachMore +
        '</div>' +
      '</div>';
  }

  function renderOgBlock(ogImg) {
    var a = S.article || {};
    var ogUrl = (ogImg && ogImg.imageUrl) || a.mainImageSrc || '';
    var ogImgHtml = ogUrl
      ? '<div class="asf-og-card-img" style="' + cssBg(ogUrl) + '">' +
          '<span class="asf-og-card-img-label">OG · 1200×630</span>' +
        '</div>'
      : '<div class="asf-og-card-img">' +
          '<span class="asf-og-card-img-label">OG · 1200×630 · empty</span>' +
        '</div>';

    var titleText = a.name || 'Untitled article';
    var descText  = a.teaser || a.shortSummary || 'No teaser yet.';
    var siteText  = 'inbxify.com';
    var sourceText = ogImg ? 'dedicated OG image' : (a.mainImageSrc ? 'main image fallback' : 'none');

    return '' +
      '<div class="asf-og-block">' +
        '<div class="asf-og-head">' +
          '<span class="asf-og-title">Social / OG Preview</span>' +
          '<span class="asf-og-hint">Shared on Facebook, LinkedIn, Slack</span>' +
        '</div>' +
        '<div class="asf-og-card">' +
          ogImgHtml +
          '<div class="asf-og-card-text">' +
            '<div class="asf-og-card-site">' + esc(siteText) + '</div>' +
            '<div class="asf-og-card-title">' + esc(titleText) + '</div>' +
            '<div class="asf-og-card-desc">' + esc(descText) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="asf-og-fields">' +
          '<span>Source: <strong>' + esc(sourceText) + '</strong></span>' +
          '<span>Site: <strong>' + esc(siteText) + '</strong></span>' +
          '<span>Cache: <strong>auto</strong></span>' +
        '</div>' +
      '</div>';
  }

  // ───────────────────────────────────────────────────────────────
  //  RENDER · Row 04 — Body (Path 2: read-only canvas + Edit button)
  // ───────────────────────────────────────────────────────────────
  function renderRow04() {
    var a = S.article || {};
    var bodyHtml = a.bodyHtml || '';
    // Cheap "has content" test: strip whitespace and tags.
    var bodyText = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    var hasContent = bodyText.length > 0;

    var statusCls, statusText;
    if (a.bodyStatus === 'Edited') {
      statusCls = 'asf-body-status-pill has-content';
      statusText = 'Edited';
    } else if (hasContent) {
      statusCls = 'asf-body-status-pill has-content';
      statusText = 'Has content';
    } else {
      statusCls = 'asf-body-status-pill empty';
      statusText = 'Empty';
    }

    var completeOn = !!a.bodyComplete;
    var completeCls = 'asf-complete-toggle' + (completeOn ? ' checked' : '');
    var completeLabel = (completeOn ? '✓ ' : '○ ') + 'Body complete (HC-14)';
    var wordCount = bodyText ? bodyText.split(/\s+/).length : 0;

    var canvasInner = hasContent
      ? bodyHtml
      : '<div class="empty-state">No body content yet. Click <strong>Edit body</strong> to open the editor.</div>';

    return '' +
      '<section class="asf-row">' +
        renderRowHeader('04', 'Article Body', 'Path 2 · WYSIWYG editor opens in fullscreen') +
        '<div style="display:flex;align-items:center;gap:14px;padding:10px 18px;background:#fff;border-bottom:1px solid var(--tile-border);">' +
          '<span class="' + statusCls + '">' + esc(statusText) + '</span>' +
          '<span style="font-family:\'DM Mono\',monospace;font-size:10px;color:var(--text-mid);letter-spacing:0.04em;">' +
            '<strong style="color:var(--teal);">' + wordCount + '</strong> words' +
          '</span>' +
          '<button type="button" class="' + completeCls + '" data-asf-switch="bodyComplete">' +
            esc(completeLabel) +
          '</button>' +
          '<div style="margin-left:auto;">' +
            '<button type="button" class="asf-edit-body-btn" data-asf-action="edit-body">' +
              '✎ Edit body in fullscreen editor' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="asf-body-readonly-frame">' +
          '<div class="asf-body-readonly-meta">' +
            '<span>Read-only preview · click Edit body to modify</span>' +
            '<span>Lora 15px / 1.65 line-height · 780px column</span>' +
          '</div>' +
          '<div class="asf-body-canvas">' + canvasInner + '</div>' +
        '</div>' +
        renderTechDrawer() +
      '</section>';
  }

  function renderTechDrawer() {
    var a = S.article || {};
    // Bounded preview — full body can be huge; the drawer is for debug
    // not for editing.
    var raw = (a.bodyHtml || '').substring(0, 4000);
    var openCls = S.techDrawerOpen ? ' open' : '';
    var toggleLabel = S.techDrawerOpen ? '▾ Hide' : '▸ Show';
    return '' +
      '<div class="asf-tech-drawer' + openCls + '">' +
        '<div class="asf-tech-drawer-head" data-asf-action="toggle-tech-drawer">' +
          '<span class="asf-tech-drawer-title">Technical · raw HTML inspector</span>' +
          '<button type="button" class="asf-tech-drawer-toggle">' + toggleLabel + '</button>' +
        '</div>' +
        '<div class="asf-tech-drawer-body">' +
          '<textarea readonly>' + esc(raw) + '</textarea>' +
        '</div>' +
      '</div>';
  }

  // ───────────────────────────────────────────────────────────────
  //  RENDER · Sticky footer
  // ───────────────────────────────────────────────────────────────
  function renderFooter(rtp) {
    var canPublish = rtp.ready;
    var dirty = hasDirty();
    var stateText = dirty
      ? 'Unsaved changes'
      : (canPublish ? 'All checks passed' : (rtp.requiredPending + ' required check' + (rtp.requiredPending === 1 ? '' : 's') + ' pending'));
    var saveBtnCls = 'asf-f-btn asf-f-btn-secondary' + (dirty ? ' has-pending' : '');
    var publishDisabled = !canPublish ? ' disabled' : '';

    return '' +
      '<div class="asf-footer">' +
        '<div class="asf-footer-left">' +
          (dirty ? '<span class="asf-footer-state-dot"></span>' : '') +
          '<span>' + esc(stateText) + '</span>' +
        '</div>' +
        '<div class="asf-footer-actions">' +
          '<button type="button" class="asf-f-cancel" data-asf-action="close-overlay">Cancel</button>' +
          '<button type="button" class="' + saveBtnCls + '" data-asf-action="save-draft">Save draft</button>' +
          '<button type="button" class="asf-f-btn asf-f-btn-primary"' +
            ' data-asf-action="publish"' + publishDisabled + '>' +
            'Publish &amp; slot…' +
          '</button>' +
        '</div>' +
      '</div>';
  }

  // ═══════════════════════════════════════════════════════════════
  //  BEHAVIOR · Chunk C
  //
  //  Delegated event handlers, action router, dirty tracking, save
  //  & publish flows, newsletter fetch, sessionStorage restore.
  //
  //  All listeners are attached ONCE in bindAll() on the overlay root;
  //  these functions resolve targets via closestEl() and data-attrs.
  // ═══════════════════════════════════════════════════════════════

  // ── Delegated routers ─────────────────────────────────────────
  function onDelegatedClick(e) {
    if (!S.open) return;
    var t = e.target;

    // Action takes priority — it's the most specific intent.
    var actionEl = closestEl(t, '[data-asf-action]');
    if (actionEl && !isDisabled(actionEl)) {
      var action = actionEl.getAttribute('data-asf-action');
      handleAction(action, actionEl, e);
      return;
    }

    // Switches (toggle controls) — both renderSwitch divs and the
    // bodyComplete custom button. RTP N/A and Manual rows are <label>
    // wrappers around checkboxes — let the native click → change
    // event handle those so the checkbox state is reliable.
    if (closestEl(t, '.asf-rtp-na, .asf-rtp-manual-toggle')) return;

    var switchEl = closestEl(t, '[data-asf-switch]');
    if (switchEl && !isDisabled(switchEl)) {
      handleSwitch(switchEl.getAttribute('data-asf-switch'), switchEl, e);
      return;
    }

    // Article type segments
    var typeEl = closestEl(t, '[data-asf-type]');
    if (typeEl && !isDisabled(typeEl)) {
      handleTypeChange(typeEl.getAttribute('data-asf-type'));
      return;
    }
  }

  function onDelegatedInput(e) {
    if (!S.open) return;
    var t = e.target;
    if (!t || !t.hasAttribute) return;
    if (!t.hasAttribute('data-asf-field')) return;
    if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return;
    if (t.readOnly || t.hasAttribute('readonly')) return;
    handleFieldEdit(t.getAttribute('data-asf-field'), t);
  }

  function onDelegatedChange(e) {
    if (!S.open) return;
    var t = e.target;
    if (!t || !t.hasAttribute) return;

    // Newsletter select (and any future native selects)
    if (t.tagName === 'SELECT' && t.hasAttribute('data-asf-field')) {
      handleSelectChange(t.getAttribute('data-asf-field'), t);
      return;
    }

    // RTP N/A checkboxes (T2)
    if (t.tagName === 'INPUT' && t.hasAttribute('data-asf-rtp-na')) {
      handleRTPNAChange(t.getAttribute('data-asf-rtp-na'), !!t.checked);
      return;
    }

    // RTP manual checkboxes (T3)
    if (t.tagName === 'INPUT' && t.hasAttribute('data-asf-rtp-manual')) {
      handleRTPManualChange(t.getAttribute('data-asf-rtp-manual'), !!t.checked);
      return;
    }
  }

  function onDelegatedKeydown(e) {
    if (!S.open) return;
    // Cmd/Ctrl+S → save draft (only when at least one field is dirty
    // and we're not inside the RTE overlay).
    if (S.bodyEditOpen) return;
    var key = e.key || '';
    var isSaveCombo = (e.metaKey || e.ctrlKey) && (key === 's' || key === 'S');
    if (isSaveCombo) {
      e.preventDefault();
      if (hasDirty()) commitSaveDraft();
      else toast('Nothing to save', 'info');
    }
  }

  // ── Action router ─────────────────────────────────────────────
  function handleAction(action, el, e) {
    switch (action) {

      // Close overlay (topbar X, footer Cancel)
      case 'close-overlay':
        attemptClose();
        return;

      // (v1.0.2 — removed `nav-studio` and `nav-assembler` cases;
      //  the breadcrumb that emitted them is gone in the compact header.)

      // Readiness panel expand/collapse
      case 'toggle-rtp':
        S.rtpExpanded = !S.rtpExpanded;
        render();
        return;

      // Newsletter status bar click → scroll to Row 01 and focus the
      // tentative-newsletter dropdown. Until Chunk D ships the
      // inline picker, Row 01 is where assignment is managed.
      case 'focus-newsletter':
        var row01 = qs(S.overlay, '.assignment-row');
        if (row01) {
          try { row01.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
          catch (e) { row01.scrollIntoView(); }
          setTimeout(function () {
            var sel = qs(row01, 'select[data-asf-field="tentativeNewsletter"]');
            if (sel && sel.focus) sel.focus();
          }, 350);
        }
        return;

      // Per-section edit / cancel
      case 'edit-section':
        var secId = el.getAttribute('data-asf-section-id');
        if (!secId) return;
        S.editingSection = secId;
        render();
        // Focus the first editable input in that section so keyboard
        // users land where they expect.
        setTimeout(function () {
          var firstInput = qs(S.overlay,
            '[data-asf-section="' + secId + '"] input:not([readonly]):not([disabled]),' +
            ' [data-asf-section="' + secId + '"] textarea:not([readonly]):not([disabled])');
          if (firstInput && firstInput.focus) firstInput.focus();
        }, 0);
        return;

      case 'cancel-section':
        var cancelSec = el.getAttribute('data-asf-section-id');
        if (!cancelSec) return;
        revertSection(cancelSec);
        S.editingSection = null;
        render();
        return;

      // Newsletter revert (Row 01 — sits outside meta-sections)
      case 'cancel-newsletter':
        S.newsletterChoice = S.originalNewsletterChoice;
        // The newsletter field key in dirtyFields is 'tentativeNewsletter'
        delete S.dirtyFields.tentativeNewsletter;
        deriveDirtySections();
        render();
        return;

      // Tech drawer (Row 04 raw HTML inspector)
      case 'toggle-tech-drawer':
        S.techDrawerOpen = !S.techDrawerOpen;
        render();
        return;

      // Body editor (Path 2 RTE handoff)
      case 'edit-body':
      case 'launch-body-editor':
        launchBodyEditor();
        return;

      // Save & publish
      case 'save-draft':
        commitSaveDraft();
        return;
      case 'publish':
        commitPublishAndSlot();
        return;

      // Image flows — STUBBED in Chunk C. Each ships in Chunk D with
      // its own webhook contract (Scenario B for upload, Anthropic
      // proxy for generate, MEDIA picker UI for attach).
      case 'attach-main-from-media':
      case 'attach-inline':
      case 'insert-inline':
      case 'replace-inline':
      case 'view-inline':
      case 'replace-main-image':
      case 'upload-main':
      case 'generate-main':
      case 'preview-main-image':
      case 'set-og-from-main':
        toast('Image flows ship in Chunk D — wired but not yet functional', 'info');
        return;

      default:
        warn('Unhandled action:', action);
    }
  }

  // ── Field input (text/textarea) ───────────────────────────────
  function handleFieldEdit(fieldName, inputEl) {
    if (!fieldName || !inputEl) return;
    var current = inputEl.value;
    var original = S.originalValues[fieldName];

    if (fieldsEqual(current, original)) {
      delete S.dirtyFields[fieldName];
      inputEl.classList.remove('dirty');
    } else {
      S.dirtyFields[fieldName] = { from: original, to: current };
      inputEl.classList.add('dirty');
    }
    deriveDirtySections();
    refreshFooter();
    refreshSectionHeads();
    refreshDirtyStamp();

    // Live charcount update (count siblings within .asf-field).
    var field = closestEl(inputEl, '.asf-field');
    if (field) {
      var counter = qs(field, '.asf-charcount');
      if (counter) {
        var lim = parseInt(inputEl.getAttribute('maxlength'), 10);
        // maxlength was set to lim*2 in renderField so the user can
        // exceed; derive the original limit by halving.
        if (lim) lim = Math.floor(lim / 2);
        var len = current.length;
        if (lim) {
          counter.textContent = len + ' / ' + lim;
          counter.classList.remove('over', 'near');
          if (len > lim) counter.classList.add('over');
          else if (len > Math.floor(lim * 0.85)) counter.classList.add('near');
        }
      }
    }
  }

  // ── Select change (newsletter, future selects) ────────────────
  function handleSelectChange(fieldName, selectEl) {
    if (fieldName === 'tentativeNewsletter') {
      var id = selectEl.value;
      if (!id || id === '__none__') {
        S.newsletterChoice = null;
      } else {
        S.newsletterChoice = findNewsletter(id);
      }
      // Dirty when the user's choice differs from open-time original.
      var origId = S.originalNewsletterChoice ? S.originalNewsletterChoice.id : null;
      var newId  = S.newsletterChoice          ? S.newsletterChoice.id          : null;
      if (origId === newId) {
        delete S.dirtyFields.tentativeNewsletter;
      } else {
        S.dirtyFields.tentativeNewsletter = { from: origId, to: newId };
      }
      deriveDirtySections();
      render();
      return;
    }
    // Generic select handling: treat like a text field.
    handleFieldEdit(fieldName, selectEl);
  }

  // ── Switch / toggle handling ──────────────────────────────────
  //   Used by:
  //     • renderSwitch outputs (.asf-switch-row [data-asf-switch="..."])
  //     • bodyComplete custom button [data-asf-switch="bodyComplete"]
  //
  //   These are click-toggles; we flip the cached value, update the
  //   .on / .checked classes directly, and recompute dirty.
  function handleSwitch(fieldName, el, e) {
    if (!fieldName) return;
    if (e && e.preventDefault) e.preventDefault();

    // Current on-state derives from the class — fall back to original
    // article value if no class yet (first interaction).
    var wasOn;
    if (el.classList.contains('on') || el.classList.contains('checked')) {
      wasOn = true;
    } else if (el.classList.contains('off')) {
      wasOn = false;
    } else {
      wasOn = !!S.originalValues[fieldName];
      // Sync class to truth before we flip
      if (wasOn) el.classList.add('on');
    }
    var nowOn = !wasOn;

    // Apply class semantics. .asf-switch-row uses .on; the bodyComplete
    // button (.asf-complete-toggle) uses .checked. Toggle both keys to
    // cover both surfaces.
    if (nowOn) {
      el.classList.add('on');
      el.classList.add('checked');
    } else {
      el.classList.remove('on');
      el.classList.remove('checked');
    }
    // The inner switch knob (if present)
    var knob = qs(el, '.asf-switch');
    if (knob) {
      if (nowOn) knob.classList.add('on');
      else       knob.classList.remove('on');
    }
    // Update bodyComplete label content (it has icon + text baked in)
    if (fieldName === 'bodyComplete') {
      el.textContent = (nowOn ? '✓ ' : '○ ') + 'Body complete (HC-14)';
    }

    // Dirty bookkeeping
    var origOn = !!S.originalValues[fieldName];
    if (origOn === nowOn) {
      delete S.dirtyFields[fieldName];
      el.classList.remove('dirty');
    } else {
      S.dirtyFields[fieldName] = { from: origOn, to: nowOn };
      el.classList.add('dirty');
    }
    deriveDirtySections();

    // bodyComplete affects RTP (it's a T1 required item) — re-render
    // the RTP panel + footer + title bar. For simplicity, full render.
    // subTitleNA / bannerStatementNA also feed RTP via computeRTP.
    if (fieldName === 'bodyComplete' || fieldName === 'subTitleNA' || fieldName === 'bannerStatementNA') {
      // Mirror the new value back to S.article so computeRTP reflects it.
      S.article[fieldName] = nowOn;
      render();
    } else {
      refreshFooter();
      refreshSectionHeads();
      refreshDirtyStamp();
    }
  }

  // ── Article type segment ──────────────────────────────────────
  function handleTypeChange(typeId) {
    if (!typeId || typeId === S.articleType) return;
    var typeDef = null;
    for (var i = 0; i < CFG.articleTypes.length; i++) {
      if (CFG.articleTypes[i].id === typeId) { typeDef = CFG.articleTypes[i]; break; }
    }
    if (!typeDef) return;
    if (typeDef.soon) {
      toast('"' + typeDef.label + '" is coming soon', 'info');
      return;
    }
    S.articleType = typeId;
    render();
  }

  // ── RTP toggles ───────────────────────────────────────────────
  function handleRTPNAChange(itemId, checked) {
    S.rtpNAState[itemId] = !!checked;
    // For subtitle / banner the NA state is also persisted on the
    // article (HC-12 / HC-13). Mirror to S.article so subsequent
    // re-renders are consistent. Save persists this to CMS.
    if (itemId === 'subtitle') {
      S.article.subTitleNA = !!checked;
      // Also mark the renderSwitch field as dirty if state changed
      // from the original article value.
      syncSwitchDirty('subTitleNA', !!checked);
    } else if (itemId === 'banner') {
      S.article.bannerStatementNA = !!checked;
      syncSwitchDirty('bannerStatementNA', !!checked);
    }
    // CTA has no article-side persistence — pure session state.
    render();
  }

  function handleRTPManualChange(itemId, checked) {
    S.rtpManualState[itemId] = !!checked;
    render();
  }

  function syncSwitchDirty(fieldName, nowOn) {
    var origOn = !!S.originalValues[fieldName];
    if (origOn === nowOn) {
      delete S.dirtyFields[fieldName];
    } else {
      S.dirtyFields[fieldName] = { from: origOn, to: nowOn };
    }
    deriveDirtySections();
  }

  // ── Section revert ────────────────────────────────────────────
  function revertSection(sectionId) {
    var fields = CFG.sectionFields[sectionId];
    if (!fields) return;
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      S.article[f] = S.originalValues[f];
      delete S.dirtyFields[f];
    }
    // Special: NA flags within the identity section affect RTP state.
    if (sectionId === 'identity') {
      S.rtpNAState.subtitle = !!S.originalValues.subTitleNA;
      S.rtpNAState.banner   = !!S.originalValues.bannerStatementNA;
    }
    deriveDirtySections();
  }

  // ── Incremental refresh helpers (avoid full re-render where safe) ──
  function refreshFooter() {
    var footer = qs(S.overlay, '.asf-footer');
    if (!footer) return;
    var rtp = rtpReadyState();
    footer.outerHTML = renderFooter(rtp);
  }

  function refreshSectionHeads() {
    // Add/remove a 'has-dirty' marker on each section head label.
    // Cheap operation — no full re-render.
    var heads = qsa(S.overlay, '.asf-meta-section');
    for (var i = 0; i < heads.length; i++) {
      var sec = heads[i].getAttribute('data-asf-section');
      if (S.dirtySections[sec]) heads[i].classList.add('has-dirty');
      else                       heads[i].classList.remove('has-dirty');
    }
  }

  // v1.0.2 — update the topbar dirty stamp without re-rendering.
  // Called from any handler that mutates dirty state (text input,
  // switch toggle, select change, newsletter revert, save success).
  function refreshDirtyStamp() {
    var stamp = qs(S.overlay, '.asf-hdr-dirty-stamp');
    if (!stamp) return;
    if (hasDirty()) {
      stamp.classList.add('on');
      stamp.classList.remove('off');
      stamp.innerHTML = '<span class="dot"></span>Editing · unsaved';
    } else {
      stamp.classList.remove('on');
      stamp.classList.add('off');
      stamp.innerHTML = '<span class="dot"></span>No changes';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  SAVE & PUBLISH
  //
  //  Two paths share an endpoint (HC-15) distinguished by `op` in
  //  payload. Until HC-15 is set, both paths show a toast explaining
  //  what's missing and what would have been sent — useful for dev.
  // ═══════════════════════════════════════════════════════════════
  function buildSavePayload(op) {
    var p = {
      op:        op,
      articleId: S.article.id,
      titleId:   S.article.mnlsId || null,
      version:   VERSION,
      fields:    {},
      rtp:       {
        naState:     S.rtpNAState,
        manualState: S.rtpManualState
      },
      newsletterChoice: S.newsletterChoice,
      timestamp: new Date().toISOString()
    };
    // Only send fields the user actually changed (sparse payload).
    for (var k in S.dirtyFields) {
      if (!Object.prototype.hasOwnProperty.call(S.dirtyFields, k)) continue;
      p.fields[k] = S.dirtyFields[k].to;
    }
    return p;
  }

  function commitSaveDraft() {
    if (S.saving) return;
    if (!hasDirty() && !hasRTPChange()) {
      toast('No changes to save', 'info');
      return;
    }
    var payload = buildSavePayload('save-draft');
    log('save-draft payload', payload);

    if (isPlaceholderEndpoint(CFG.endpoints.saveAsf)) {
      // Dev mode: show what would be sent.
      toast('Save endpoint not configured (HC-15) — see console for payload', 'error');
      console.log('[ASF v' + VERSION + '] would POST save-draft →', payload);
      return;
    }

    S.saving = true;
    setSaveButtonState('saving');

    fetch(CFG.endpoints.saveAsf, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (body) {
        S.saving = false;
        // Server response should echo the persisted article so we can
        // refresh originals. Accepts both { article: {...} } and a
        // flat shape; tolerate either.
        var fresh = body && body.article ? body.article : body;
        if (fresh && typeof fresh === 'object') {
          // Apply server-confirmed values back to S.article
          for (var k in fresh) {
            if (Object.prototype.hasOwnProperty.call(fresh, k)) {
              S.article[k] = fresh[k];
            }
          }
        }
        S.dirtyFields   = {};
        S.dirtySections = {};
        snapshotOriginals();
        render();
        toast('Draft saved', 'success');
      })
      .catch(function (err) {
        S.saving = false;
        setSaveButtonState('idle');
        warn('save-draft failed', err);
        toast('Save failed — ' + (err && err.message ? err.message : 'unknown error'), 'error');
      });
  }

  function commitPublishAndSlot() {
    if (S.saving) return;
    var rtp = rtpReadyState();
    if (rtp.requiredPending > 0) {
      toast(rtp.requiredPending + ' required readiness item(s) still pending', 'error');
      return;
    }
    if (!S.newsletterChoice || !S.newsletterChoice.id || S.newsletterChoice.id === '__none__') {
      toast('Pick a tentative newsletter before publishing', 'error');
      return;
    }
    var payload = buildSavePayload('publish-and-slot');
    log('publish-and-slot payload', payload);

    if (isPlaceholderEndpoint(CFG.endpoints.saveAsf)) {
      toast('Publish endpoint not configured (HC-15) — see console for payload', 'error');
      console.log('[ASF v' + VERSION + '] would POST publish-and-slot →', payload);
      return;
    }

    S.saving = true;
    setSaveButtonState('publishing');

    fetch(CFG.endpoints.saveAsf, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function () {
        S.saving = false;
        toast('Slotted into ' + S.newsletterChoice.label, 'success');
        setTimeout(publicClose, 1200);
      })
      .catch(function (err) {
        S.saving = false;
        setSaveButtonState('idle');
        warn('publish failed', err);
        toast('Publish failed — ' + (err && err.message ? err.message : 'unknown error'), 'error');
      });
  }

  function hasRTPChange() {
    // True when user has toggled NA or manual state away from originals.
    var keys = ['subtitle', 'banner', 'cta'];
    for (var i = 0; i < keys.length; i++) {
      if (!!S.rtpNAState[keys[i]] !== !!S.originalNAState[keys[i]]) return true;
    }
    for (var k in S.rtpManualState) {
      if (S.rtpManualState[k]) return true;  // any manual confirmation is a change
    }
    return false;
  }

  function setSaveButtonState(state) {
    var btn = qs(S.overlay, '[data-asf-action="save-draft"]');
    var pub = qs(S.overlay, '[data-asf-action="publish"]');
    if (state === 'saving') {
      if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
      if (pub) pub.disabled = true;
    } else if (state === 'publishing') {
      if (pub) { pub.disabled = true; pub.textContent = 'Publishing…'; }
      if (btn) btn.disabled = true;
    } else {
      if (btn) { btn.disabled = false; btn.textContent = 'Save draft'; }
      if (pub) { pub.disabled = false; }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  NEWSLETTER LIST (TD-176 / HC-16)
  //
  //  Fires on overlay open. While HC-16 is a placeholder, we fall
  //  back to CFG.newsletterStub silently — the surface remains
  //  functional. When HC-16 is set, fetch returns { newsletters: [...] }
  //  and we swap CFG.newsletterStub → S.newsletterList for the dropdown.
  // ═══════════════════════════════════════════════════════════════
  function fetchNewsletters() {
    if (isPlaceholderEndpoint(CFG.endpoints.newsletterList)) {
      S.newsletterList = CFG.newsletterStub.slice();
      log('newsletter list: using stub (HC-16 unresolved)');
      return;
    }
    var titleId = S.article && S.article.mnlsId ? S.article.mnlsId : '';
    var url = CFG.endpoints.newsletterList + (titleId ? '?titleId=' + encodeURIComponent(titleId) : '');
    fetch(url, { method: 'GET' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (body) {
        var list = (body && body.newsletters) ? body.newsletters : (body || []);
        if (!list.length || list[0].id !== '__none__') {
          list.unshift({ id: '__none__', label: '— Unassigned —', issueNo: '', date: '' });
        }
        S.newsletterList = list;
        // Re-render Row 01 so the dropdown picks up the real list.
        if (S.open) render();
      })
      .catch(function (err) {
        warn('newsletter list fetch failed; falling back to stub', err);
        S.newsletterList = CFG.newsletterStub.slice();
      });
  }

  // ═══════════════════════════════════════════════════════════════
  //  sessionStorage RESTORE — post-RTE-reload
  //
  //  Flow: ASF → Edit body → writes sessionStorage → Studio launches
  //  InbxRTE → user saves → Scenario G runs → page reloads → this
  //  script re-initializes → restore() checks storage, finds a fresh
  //  context (< CFG.sessionRestoreMaxAge), and re-opens the ASF on
  //  the same article.
  // ═══════════════════════════════════════════════════════════════
  function tryRestore() {
    try {
      var raw = sessionStorage.getItem(CFG.sessionStorageKey);
      if (!raw) return;
      var ctx = JSON.parse(raw);
      // One-shot — always clear, so a stale key doesn't keep firing.
      sessionStorage.removeItem(CFG.sessionStorageKey);
      if (!ctx || !ctx.articleId) return;
      var age = Date.now() - (ctx.ts || 0);
      if (age > CFG.sessionRestoreMaxAge) {
        log('restore: context too old, skipping (age=' + age + 'ms)');
        return;
      }
      // Defer until the article wrapper is in the DOM. Webflow CMS
      // collections render server-side, so they're present at
      // DOMContentLoaded — but be defensive.
      var attempt = function (tries) {
        var wrap = document.querySelector('.articles-wrapper[data-article-id="' + ctx.articleId + '"]');
        if (wrap) {
          publicOpen({ articleId: ctx.articleId });
          // Inform the user this is a continuation.
          setTimeout(function () { toast('Body saved · returned to ASF', 'success'); }, 150);
          return;
        }
        if (tries < 20) setTimeout(function () { attempt(tries + 1); }, 100);
        else warn('restore: article wrapper never appeared for', ctx.articleId);
      };
      attempt(0);
    } catch (e) {
      warn('restore: sessionStorage read/parse failed', e);
    }
  }

  // Run restore on DOM-ready (or immediately if already ready).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryRestore);
  } else {
    setTimeout(tryRestore, 0);
  }

  // ═══════════════════════════════════════════════════════════════
  //  PUBLIC API — window.InbxASF
  //
  //  open({ articleId })       → mount + render (returns true on success)
  //  open({ articleItemId })   → same (alias for Studio-side caller parity)
  //  close()                   → unmount + reset state
  //  isOpen()                  → boolean
  //  version                   → '1.0.0'
  //
  //  _internal is exposed for Chunk C wiring + console debugging.
  //  Not part of the stable public contract; may change without notice.
  // ═══════════════════════════════════════════════════════════════
  function publicOpen(params) {
    params = params || {};
    var articleId = params.articleId || params.articleItemId;
    if (!articleId) {
      warn('open(): articleId is required');
      return false;
    }
    if (S.open) {
      warn('open(): already open; closing previous instance');
      publicClose();
    }

    // Reset transient state for this article
    S.article          = hydrateArticle(articleId);
    if (!S.article) {
      warn('open(): could not hydrate article', articleId);
      return false;
    }
    S.media            = hydrateMedia(articleId);
    S.articleType      = 'standard';
    S.rtpExpanded      = true;
    S.rtpNAState       = {};
    S.rtpManualState   = {};
    S.editingSection   = null;
    S.dirtyFields      = {};
    S.dirtySections    = {};
    S.newsletterChoice = null;
    S.bodyEditOpen     = false;
    S.saving           = false;
    S.techDrawerOpen   = false;
    S.listenersBound   = false;

    // Snapshot originals BEFORE first render (revert source + dirty compare).
    snapshotOriginals();

    log('open()', {
      articleId:  articleId,
      name:       S.article.name,
      mediaCount: S.media.length
    });

    mount();
    render();
    S.open = true;

    // Async: fetch real newsletter list from HC-16 (stub fallback baked in).
    fetchNewsletters();

    return true;
  }

  function publicClose() {
    if (!S.open) return;
    log('close()');
    unmount();
    S.open             = false;
    S.article          = null;
    S.media            = [];
    S.dirtyFields      = {};
    S.dirtySections    = {};
    S.editingSection   = null;
    S.newsletterChoice = null;
    S.bodyEditOpen     = false;
  }

  function publicIsOpen() { return !!S.open; }

  window.InbxASF = {
    open:    publicOpen,
    close:   publicClose,
    isOpen:  publicIsOpen,
    version: VERSION,

    // Internal — Chunk C wiring. Read-only contract: do NOT mutate
    // S or CFG from outside the IIFE; use the public API. Exposed
    // for console-debug and integration tests only.
    _internal: {
      state:                S,
      cfg:                  CFG,
      render:               render,
      computeRTP:           computeRTP,
      rtpReadyState:        rtpReadyState,
      hydrateArticle:       hydrateArticle,
      hydrateMedia:         hydrateMedia,
      launchBodyEditor:     launchBodyEditor,
      // Chunk C
      toast:                toast,
      commitSaveDraft:      commitSaveDraft,
      commitPublishAndSlot: commitPublishAndSlot,
      fetchNewsletters:     fetchNewsletters,
      snapshotOriginals:    snapshotOriginals,
      tryRestore:           tryRestore
    }
  };

  log('mounted · v' + VERSION + ' · Limits: title/subtitle=60, banner=30, teaser=400, shortSummary=150 (no counters on mainImageAlt, ctaButton, ctaText). Labels match Webflow CMS display names.');
})();
