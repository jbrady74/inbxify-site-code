/* ============================================================
   ta-asf-v1.0.0.js
   INBXIFY TA Studio — ASF (Asset Submission Form) · Article variant
   Fullscreen overlay route invoked via window.InbxASF.open({ articleId, ... })

   Companion stylesheet: ta-asf-v1.0.0.css
   Reference spec:       v0.3 ASF mockup (locked)
   Studio dependency:    ta-studio v1.3.6+  (exposes window.InbxStudioBodyEditor
                         with `returnPanel` support, required for Path 2 RTE)
   RTE dependency:       ta-rte v1.1.4+    (provides InbxRTE.openFullscreen,
                         which Studio's openBodyEditor delegates to)

   ────────────────────────────────────────────────────────────
   v1.0.0 · Chunk B (this delivery)
   ────────────────────────────────────────────────────────────
     • IIFE shell + VERSION constant
     • CFG (limits, stubs, segments, RTP items, endpoint placeholders)
     • State S
     • Helpers: esc, qs, qsa, cssBg, log, warn
     • CMS hydration via .articles-wrapper[data-article-id]
       (matches Studio's readArticles() shape 1:1 + 3 new flag sentinels
        for HC-12 / HC-13 / HC-14)
     • MEDIA hydration via .media-wrapper[data-item]
       (matches ta-components-tab's readMediaItems() shape, filtered to
        the current articleId)
     • RTP computation (T1 Auto / T2 N/A-able / T3 Manual) + summary
     • Overlay mount/unmount — matches InbxRTE.openFullscreen pattern
       (document.body.appendChild + Esc handler + body.asf-open lock)
     • Full render tree:
         - Topbar (breadcrumb + mode pill + close)
         - Title bar (1fr / 320px / 280px : title | Readiness | Assignment)
         - RTP panel (T1/T2/T3 rows + image pip strip)
         - Row 01 — Newsletter Assignment (TD-176 stub dropdown)
         - Row 02 — Article Type segmented + 5 meta sections A–E
           (Identity, Positioning, Narrative, People, CMS References)
         - Row 03 — Media (two-zone grid + OG preview block)
         - Row 04 — Body (Path 2 read-only canvas + Edit body button)
         - Sticky footer (Cancel | Save draft | Publish & slot…)
     • window.InbxASF public API: open / close / isOpen / version
     • bindAll() — safety-net bindings only (close, cancel, Path 2 RTE)

   Behavior NOT in this chunk (intentionally deferred — Chunk C):
     • Field input/select/switch/segment change handlers
     • Per-section edit-mode toggle + Revert-changes (cancel link) flow
     • Dirty-state tracking → gold-border render passes
     • Newsletter dropdown commit → tile state update
     • RTP T2/T3 checkbox writes back to S.rtpNAState / S.rtpManualState
     • Save-draft flow (HC-15 endpoint wiring)
     • Publish & slot… flow (HC-15 + commit-to-newsletter)
     • Attach-from-MEDIA / Upload / Generate flows
     • Tech drawer expand/collapse
     • Newsletter list webhook fetch (HC-16 — TD-176)
     • Toast surface (.asf-toast) wired

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
  var VERSION = '1.0.0';

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
      title:           120,
      subtitle:        160,
      bannerStatement: 100,
      teaser:          280,
      shortSummary:    320,
      mainImageAlt:    140,
      ctaButton:        32,
      ctaText:         120
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
    rteReturnPanel: 'asf'
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
    rtpNAState:       {},     // { rtpId: true } — T2 N/A overrides (Chunk C)
    rtpManualState:   {},     // { rtpId: true } — T3 manual confirmations
    editingSection:   null,   // 'identity' | 'positioning' | ... | null
    dirtyFields:      {},     // { fieldName: originalValue } for Revert
    dirtySections:    {},     // { sectionId: true } for row-level "dirty" hint
    newsletterChoice: null,   // { id, label, issueNo, date } when tentative
    bodyEditOpen:     false,  // true while InbxRTE is mounted on top
    saving:           false,
    lastEscHandler:   null
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
    var closeBtn = qs(S.overlay, '.asf-tb-close');
    if (closeBtn) closeBtn.addEventListener('click', attemptClose);

    var fCancel = qs(S.overlay, '.asf-f-cancel');
    if (fCancel) fCancel.addEventListener('click', attemptClose);

    var editBodyBtn = qs(S.overlay, '.asf-edit-body-btn');
    if (editBodyBtn) editBodyBtn.addEventListener('click', launchBodyEditor);

    // TODO Chunk C: every other interactive element. Search this file
    // for data-asf-action / data-asf-field / data-asf-switch /
    // data-asf-type / data-asf-rtp-na / data-asf-rtp-manual to find
    // the full set.
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
      alert('Body editor is not available. Ensure the Studio script is loaded (v1.3.6 or newer).');
      return;
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
    var a = S.article || {};
    return '' +
      '<div class="asf-topbar">' +
        '<div class="asf-topbar-left">' +
          '<div class="asf-tb-mark">ASF</div>' +
          '<div class="asf-tb-crumb">' +
            '<a data-asf-action="nav-studio">Studio</a>' +
            '<span class="sep">/</span>' +
            '<a data-asf-action="nav-assembler">Assembler</a>' +
            '<span class="sep">/</span>' +
            '<span class="here">' + esc(a.name || 'Untitled article') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="asf-topbar-right">' +
          '<div class="asf-mode-toggle">' +
            'Mode <span class="asf-mode-pill">EDIT</span>' +
          '</div>' +
          '<button class="asf-tb-close" type="button" aria-label="Close ASF">Close</button>' +
        '</div>' +
      '</div>';
  }

  // ───────────────────────────────────────────────────────────────
  //  RENDER · Title bar (1fr / 320px / 280px)
  // ───────────────────────────────────────────────────────────────
  function renderTitleBar(rtp) {
    var a = S.article || {};
    var ready = rtp.ready;
    var subtitle = a.customerName
      ? 'Sponsor: <a>' + esc(a.customerName) + '</a>'
      : 'Editorial · no sponsor';

    return '' +
      '<div class="asf-title-bar">' +
        '<div class="asf-title-left">' +
          '<div class="asf-eyebrow">' +
            '<span class="asf-type">Article</span> · Submission Form' +
          '</div>' +
          '<h1 class="asf-h1">' + esc(a.name || 'Untitled article') + '</h1>' +
          '<div class="asf-bundle-ref">' + subtitle + '</div>' +
        '</div>' +
        renderReadinessTile(rtp, ready) +
        renderAssignmentTile() +
      '</div>';
  }

  function renderReadinessTile(rtp, ready) {
    var tileClass   = ready ? 'ready' : 'not-ready';
    var badgeClass  = ready ? 'is-ready' : 'not-ready';
    var statusClass = ready ? 'ok' : 'warn';
    var statusText  = ready ? 'Ready to publish' : 'Not yet ready';
    var icon        = ready ? '✓' : '!';
    var toggleLabel = S.rtpExpanded ? '▾ Hide checklist' : '▸ Show checklist';

    return '' +
      '<div class="asf-tile ' + tileClass + '" data-asf-tile="readiness">' +
        '<div class="asf-tile-label">Readiness</div>' +
        '<div class="asf-readiness-row">' +
          '<div class="asf-readiness-badge ' + badgeClass + '">' +
            '<span class="asf-readiness-badge-icon">' + icon + '</span>' +
          '</div>' +
          '<div class="asf-readiness-text">' +
            '<div class="asf-readiness-status ' + statusClass + '">' + esc(statusText) + '</div>' +
            '<div class="asf-readiness-count">' +
              '<strong>' + rtp.passedCount + '</strong> of ' + rtp.totalCount + ' checks passed' +
            '</div>' +
            '<button type="button" class="asf-readiness-expand" data-asf-action="toggle-rtp">' +
              esc(toggleLabel) +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderAssignmentTile() {
    var a = S.article || {};
    var committed = !!a.newsletterId;
    var tentative = !committed && S.newsletterChoice && S.newsletterChoice.id && S.newsletterChoice.id !== '__none__';

    var tileClass = 'assignment' + (committed || tentative ? '' : ' unassigned');
    var titleAbbr = (a.mnlsName || '').substring(0, 3).toUpperCase() || '—';
    var issueNo   = parseIssueNo(a.newsletterName) || (tentative ? S.newsletterChoice.issueNo : '');
    var dateStr   = a.newsletterDate || (tentative ? S.newsletterChoice.date : '');
    var slotText  = committed ? 'Committed' : (tentative ? 'Tentative' : 'Unassigned');
    var slotClass = committed ? '' : (tentative ? '' : ' unassigned');

    var issueHtml = issueNo
      ? '<div class="asf-assignment-issue-no">#' + esc(issueNo) + '</div>'
      : '<div class="asf-assignment-issue-no" style="font-size:18px;color:var(--text-light);">—</div>';

    return '' +
      '<div class="asf-tile ' + tileClass + '" data-asf-tile="assignment">' +
        '<div class="asf-tile-label">Newsletter</div>' +
        '<div class="asf-assignment-main">' +
          '<div class="asf-assignment-title-abbr">' + esc(titleAbbr) + '</div>' +
          issueHtml +
          (dateStr ? '<div class="asf-assignment-date">' + esc(dateStr) + '</div>' : '') +
          '<div class="asf-assignment-slot' + slotClass + '">' + esc(slotText) + '</div>' +
        '</div>' +
      '</div>';
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
    var dropdownOptions = CFG.newsletterStub.map(function (n) {
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
      headRight = '<span class="asf-meta-section-hint">CMS-locked refs · cannot be edited here</span>';
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
        renderTextarea({ label: 'Teaser', req: true, value: a.teaser, field: 'teaser', limit: lim.teaser }) +
        renderTextarea({ label: 'Short Summary', value: a.shortSummary, field: 'shortSummary', limit: lim.shortSummary, long: true }) +
      '</div>' +
      '<div class="asf-fgrid-spacer"></div>' +
      '<div class="asf-fgrid asf-fgrid-3">' +
        renderField({ label: 'CTA Button Text', value: a.ctaButton, field: 'ctaButton', limit: lim.ctaButton }) +
        renderField({ label: 'CTA Text', value: a.ctaText, field: 'ctaText', limit: lim.ctaText }) +
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
    return '' +
      '<div class="asf-fgrid asf-fgrid-3">' +
        renderLockedRef('Title (T-A)',  a.mnlsName       || '—') +
        renderLockedRef('Newsletter',   a.newsletterName || '—') +
        renderLockedRef('Customer',     a.customerName   || '—') +
      '</div>' +
      '<div class="asf-fgrid-spacer"></div>' +
      '<div class="asf-fgrid asf-fgrid-3">' +
        renderLockedRef('Category',     a.productName    || '—') +
        renderLockedRef('Article ID',   a.id             || '—') +
        renderLockedRef('Body Status',  a.bodyStatus     || 'Draft') +
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
            limit: lim.mainImageAlt, req: true
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
            '<button type="button" class="asf-edit-body-btn">' +
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
    return '' +
      '<div class="asf-tech-drawer">' +
        '<div class="asf-tech-drawer-head" data-asf-action="toggle-tech-drawer">' +
          '<span class="asf-tech-drawer-title">Technical · raw HTML inspector</span>' +
          '<button type="button" class="asf-tech-drawer-toggle">▸ Show</button>' +
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
          '<button type="button" class="asf-f-cancel">Cancel</button>' +
          '<button type="button" class="' + saveBtnCls + '" data-asf-action="save-draft">Save draft</button>' +
          '<button type="button" class="asf-f-btn asf-f-btn-primary"' +
            ' data-asf-action="publish"' + publishDisabled + '>' +
            'Publish &amp; slot…' +
          '</button>' +
        '</div>' +
      '</div>';
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

    log('open()', {
      articleId:  articleId,
      name:       S.article.name,
      mediaCount: S.media.length
    });

    mount();
    render();
    S.open = true;
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

    // Internal — Chunk C wiring grabs from here. Read-only contract:
    // do NOT mutate S or CFG from outside the IIFE; use the public API
    // or wait for Chunk C's setter helpers.
    _internal: {
      state:           S,
      cfg:             CFG,
      render:          render,
      computeRTP:      computeRTP,
      rtpReadyState:   rtpReadyState,
      hydrateArticle:  hydrateArticle,
      hydrateMedia:    hydrateMedia,
      launchBodyEditor: launchBodyEditor
    }
  };

  log('mounted · v' + VERSION + ' · Chunk B (hydration + render only; behavior bindings ship in Chunk C)');
})();
