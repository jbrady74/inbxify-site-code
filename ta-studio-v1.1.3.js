// ============================================================
// ta-studio-v1.1.3.js
// INBXIFY TA Studio — Phase 2 Session 4 (post-smoke UX fixes)
// Editable Assembler (Articles) — LIVE save via Scenario G.
//
// Mounts into #studio-mount on the T-A page.
// Replaces the "Content Processor" + "Content Maker" tabs.
//
// ──────────────────────────────────────────────────────────
// v1.1.3 (Session 4 — post-smoke UX fixes):
//   - Save-bar visual reset: .saving and .has-error classes are
//     now explicitly removed on both success and error paths.
//     Fixes "frozen green border" after a successful save where
//     the bar showed Clean state correctly but still carried
//     leftover success styling.
//   - After a successful save, Studio flashes ✓ for ~1.2s then
//     auto-returns to the picker. Previously it left the user
//     on the article with no clear signal of completion.
//     (Retry-path errors do NOT auto-close — user stays on the
//     article to fix and retry.)
//   - New body-class toggle: when an article is open in the
//     Assembler, <body> gets class `studio-editing` and loses
//     it on close/cancel/back. CSS in the design system hides
//     `.publisher-wrapper` while this class is present, giving
//     the edit form the full page height. No DOM manipulation
//     of the header itself — class-driven per multi-tenancy.
//   - Requires title-admin-page-design CSS update with:
//       body.studio-editing .publisher-wrapper { display: none; }
//     (Design-system file, separate deploy.)
//   - Header badge, mount log updated to v1.1.3.
//
// ──────────────────────────────────────────────────────────
// v1.1.2 (Session 4 — wire Studio to Scenario G):
//   - triggerSave() now POSTs to window.TA_CONFIG.makeStudio
//     (Scenario G Route 2) instead of console.log stub.
//     Real round-trip, real error handling, real dirty-state
//     cleared only on success.
//   - Outbound payload translation for option fields:
//       * articleStatus LABEL ("Draft"/"Live") → publish-status
//         option hash via TA_CONFIG.optionIds.publishStatus
//       * revenueType   LABEL ("Paid Ad"/…)   → revenue-type
//         option hash via TA_CONFIG.optionIds.revenueType
//     Payload key name stays `articleStatus` because Scenario G
//     Route 2 already binds dirtyFields.articleStatus →
//     publish-status slug (see TD-110 for future rename).
//   - Body editor: replaced window.InbxEditBody() call with
//     Studio-owned openBodyEditor() which calls Scenario G
//     Route 1 (getArticleBody) + Route 3 (updateArticleBody)
//     directly via InbxRTE.openFullscreen. Scenario C / uploads-
//     processor's body flow no longer used by Studio.
//   - Body fetch: decodeURIComponent(data.body) on receipt per
//     the Route 1 encodeURL/decodeURIComponent contract
//     established in Session 3.
//   - Body save: always sends bodyStatus = optionIds.bodyStatus.
//     edited. Raw is set upstream by Scenario F (not yet built).
//   - On successful body save, Studio mirrors
//     data-body-status="Edited" onto the matching .articles-
//     wrapper DOM element so the picker reflects the new state
//     without a page reload.
//   - Defensive fetch wrapper: checks r.ok BEFORE r.json(). If
//     Make returns 500 (validation error) or non-JSON, surface
//     the error text inline in the save bar in red, keep Save
//     enabled so user can fix and retry, do NOT promote current
//     → loaded (dirty state persists).
//   - Phase 1 banner: removed "(read-only)" — editing is live.
//   - Header badge, mount log updated to v1.1.2.
//
// TD-110 (new): dirtyFields.articleStatus is a naming artifact.
//   The Webflow slug is publish-status; article-status is
//   deprecated. Future Studio version should rename the wire key
//   to dirtyFields.publishStatus, paired with Make Route 2
//   binding update. Low priority — the wire name is internal.
//
// ──────────────────────────────────────────────────────────
// v1.1.1 (Session 1 — post-smoke-test fixes):
//   - Header row: now uses SHARED .ix-hdr classes (matches
//     Uploads Processor + every other tab). Title changed
//     "TA Studio" → "Studio". Custom .std-hdr styles removed.
//   - Body editor button: availability check moved from
//     render-time to click-time. Button is always rendered
//     enabled; clicking checks window.InbxEditBody at that
//     moment. Fixes issue where button was inert if the
//     uploads-processor JS loaded after Studio mounted.
//
// v1.1.0 (Session 1 initial):
//   - File renamed: studio-v1.0.x.js → ta-studio-v1.1.x.js
//   - Every field in the three columns is now an input/
//     textarea/select/checkbox — EXCEPT:
//       * Article Body (Phase 5 — uses InbxRTE modal via
//         existing window.InbxEditBody)
//       * Interior Images (Phase 3+)
//       * Main Image URL + UUID (Phase 3+)
//       * body-status (written only by Scenario F)
//       * identifiers block (always readonly)
//   - Dirty-state tracking: each field captures its loaded
//     value; border turns gold when current !== loaded.
//   - Character counters: teaser 400, short summary 150.
//     Counter flips red when over budget.
//   - Save bar (sticky at bottom of open-assembler view):
//       * Cancel link  — reverts + closes back to picker
//       * Reset button — reverts to loaded values
//       * Save button  — label is "Save N changes"; hidden
//         when N=0. POST to Scenario F is STUBBED — payload
//         goes to console.log only. Fake success UI
//         simulates the round-trip so UX can be reviewed.
//   - beforeunload guard fires when dirty fields exist.
//   - Header row (icon + title + subtitle + v1.1.0 badge)
//     added above the back-row, matching the Uploads
//     Processor visual pattern.
//
//   OPTION FIELDS — current state (as of v1.1.0):
//     Webflow option fields bind to their LABEL (e.g. "Draft"
//     "Live"), not their option-ID hash. Session 2 (Scenario F
//     build) will determine whether:
//       (a) Make accepts labels directly, OR
//       (b) Studio translates label→hash via TA_CONFIG, OR
//       (c) Make translates label→hash at scenario start.
//     For v1.1.0 the payload carries the label string and is
//     flagged with TODO-SESSION-2 comments at the save site.
//
// ──────────────────────────────────────────────────────────
// v1.0.1: Webflow binding fixes
//   - Rich text (Article Body) read from innerHTML of element
//     with class `.article-body-source`.
//   - Switches read via presence of sentinel divs with
//     Conditional Visibility.
//   - Main image reads `data-article-main-image-src`.
// v1.0.0: Initial Phase 1.
// ============================================================

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.getElementById('studio-mount');
    if (!mount) return;

    // ── Config ──
    var CFG = {
      get titleSlug()       { return window.TA_CONFIG && window.TA_CONFIG.titleSlug  || ''; },
      get titleId()         { return window.TA_CONFIG && window.TA_CONFIG.titleId    || ''; },
      get taItemId()        { return window.TA_CONFIG && window.TA_CONFIG.taItemId   || ''; },
      get uploadcareBase()  { return window.TA_CONFIG && window.TA_CONFIG.uploadcareBase || 'https://uyluucdnr2.ucarecd.net'; },
      get makeAssembly()    { return window.TA_CONFIG && window.TA_CONFIG.makeAssembly || ''; },
      get makeStudio()      { return window.TA_CONFIG && window.TA_CONFIG.makeStudio    || ''; },
      get optionIds()       { return (window.TA_CONFIG && window.TA_CONFIG.optionIds) || {}; }
    };

    // ── State ──
    var S = {
      panel: 'assembler',     // input | components | assembler
      assetType: 'articles',  // articles | ads | events | re
      filter: {
        name: '',
        customerId: '',
        productId: '',
        mnlsId: '',
        sort: 'recent-edited',
        availabilityOnly: true
      },
      selectedAssetId: null,

      // Edit state (v1.1.0)
      edit: {
        loaded: {},      // snapshot { fieldKey: value } captured on asset open
        current: {},     // current values (mirrors DOM inputs)
        saving: false,   // true during fake save round-trip
        saveJustFinished: false   // briefly true to show ✓ success state
      }
    };

    // ── beforeunload guard (installed lazily; only fires when dirty) ──
    var _beforeunloadInstalled = false;
    function installBeforeUnload() {
      if (_beforeunloadInstalled) return;
      _beforeunloadInstalled = true;
      window.addEventListener('beforeunload', _beforeunloadHandler);
    }
    function _beforeunloadHandler(e) {
      if (countDirty() > 0 && !S.edit.saving) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    }

    // ── Shell markup ──
    mount.innerHTML =
      '<div class="std-root">' +
        '<div class="ix-hdr">' +
          '<div class="ix-hdr-left">' +
            '<div class="ix-hdr-icon">\u29BE</div>' +
            '<div>' +
              '<h3>Studio</h3>' +
              '<div class="ix-hdr-sub">Pick an Article \u2192 edit inline \u2192 save to Webflow</div>' +
            '</div>' +
          '</div>' +
          '<span class="ix-badge">v1.1.3</span>' +
        '</div>' +
        '<div class="std-subtabs">' +
          '<button class="std-subtab" data-std-panel="input">' +
            '<span class="std-subtab-icon">\u2B06</span>' +
            '<span>Input</span>' +
          '</button>' +
          '<button class="std-subtab" data-std-panel="components">' +
            '<span class="std-subtab-icon">\u25A3</span>' +
            '<span>Components</span>' +
          '</button>' +
          '<button class="std-subtab active" data-std-panel="assembler">' +
            '<span class="std-subtab-icon">\u29BE</span>' +
            '<span>Assembler</span>' +
          '</button>' +
        '</div>' +
        '<div class="std-panel" data-std-panel-body="input">' +
          '<div class="std-placeholder">' +
            '<div class="std-placeholder-icon">\u2B06</div>' +
            '<div class="std-placeholder-title">Input</div>' +
            '<div class="std-placeholder-sub">Phase 1: placeholder only. Upload (Google Drive) and Transcribe flows move here in Phase 2. Form Submission is being retired.</div>' +
          '</div>' +
        '</div>' +
        '<div class="std-panel" data-std-panel-body="components">' +
          '<div class="std-placeholder">' +
            '<div class="std-placeholder-icon">\u25A3</div>' +
            '<div class="std-placeholder-title">Components</div>' +
            '<div class="std-placeholder-sub">Phase 1: placeholder only. Ready-to-assign components queue arrives in Phase 3.</div>' +
          '</div>' +
        '</div>' +
        '<div class="std-panel active" data-std-panel-body="assembler">' +
          '<div class="asm-root" id="asm-root"></div>' +
        '</div>' +
      '</div>';

    // ── Sub-tab wiring ──
    mount.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-std-panel]');
      if (!btn) return;
      var panel = btn.getAttribute('data-std-panel');
      setPanel(panel);
    });

    function setPanel(name) {
      S.panel = name;
      Array.prototype.forEach.call(mount.querySelectorAll('[data-std-panel]'), function (el) {
        el.classList.toggle('active', el.getAttribute('data-std-panel') === name);
      });
      Array.prototype.forEach.call(mount.querySelectorAll('[data-std-panel-body]'), function (el) {
        el.classList.toggle('active', el.getAttribute('data-std-panel-body') === name);
      });
      if (name === 'assembler') {
        renderAssembler();
      } else {
        // v1.1.3: switching to Input/Components while an article is open
        // should still drop the hide-header class — the user is no
        // longer editing. renderAssembler() handles this when the panel
        // returns, but we need it now too.
        document.body.classList.remove('studio-editing');
      }
    }

    // ═══════════════════════════════════════════
    // DOM readers — pull data from T-A page hidden collections
    // ═══════════════════════════════════════════

    // Articles
    function readArticles() {
      var wraps = document.querySelectorAll('.articles-wrapper[data-item]');
      var out = [];
      Array.prototype.forEach.call(wraps, function (el) {
        var d = el.dataset;
        var id = (d.articleId || '').trim();
        if (!id) return;

        // ── Rich Text (cannot bind to data-attribute in Webflow) ──
        // Read the innerHTML of the element with class `.article-body-source`.
        // Class is applied directly to the Rich Text Block element.
        var bodyEl = el.querySelector('.article-body-source');
        var bodyHtml = bodyEl ? bodyEl.innerHTML : '';

        // ── Switches (cannot bind to data-attribute in Webflow) ──
        // Presence of the flag div = switch is ON.
        // (Webflow's Conditional Visibility removes the element from
        //  the DOM when the switch is false.)
        var showPhotoCredits = !!el.querySelector('.article-flag-photo-credits');
        var photoEssay       = !!el.querySelector('.article-flag-photo-essay');
        var videoArticle     = !!el.querySelector('.article-flag-video-article');

        out.push({
          id: id,
          name: (d.articleTitle || '').trim(),
          customerId: (d.articleCustomerId || '').trim(),
          customerName: (d.articleCustomerName || '').trim(),
          productId: (d.categoryId || '').trim(),
          productName: (d.articleCategory || d.label || '').trim(),
          revenueType: (d.type || '').trim(),
          mnlsId: (d.mnlsId || '').trim(),
          mnlsName: (d.mnlsName || '').trim(),
          newsletterId: (d.newsletterId || '').trim(),
          newsletterName: (d.newsletterName || '').trim(),
          newsletterDate: (d.newsletterDate || '').trim(),
          status: mapStatus((d.articleStatus || '').trim()),
          bodyStatus: (d.bodyStatus || '').trim(),
          created: (d.articleCreated || '').trim(),
          updated: (d.articleUpdated || '').trim(),

          // Body content
          subtitle: (d.articleSubtitle || '').trim(),
          bannerStatement: (d.articleBannerStatement || '').trim(),
          teaser: (d.articleTeaser || '').trim(),
          shortSummary: (d.articleShortSummary || '').trim(),
          bodyHtml: bodyHtml,  // full RTE HTML (script truncates for display)
          printIssueSource: (d.articlePrintIssueSource || '').trim(),

          // Main image — bare URL bound to 🟡 Main Image GET Link.
          // No transformation applied here; use URL as-is.
          mainImageSrc: (d.articleMainImageSrc || '').trim(),
          mainImageAlt: (d.articleMainImageAlt || '').trim(),

          // CTA
          ctaButton: (d.articleCtaButtonText || '').trim(),
          ctaText:   (d.articleCtaText       || '').trim(),
          ctaUrl:    (d.articleCtaUrl        || '').trim(),

          // Writers
          writerName:      (d.articleWriterName      || '').trim(),
          writerTitle:     (d.articleWriterTitle     || '').trim(),
          cowriterName:    (d.articleCowriterName    || '').trim(),
          cowriterTitle:   (d.articleCowriterTitle   || '').trim(),
          writerComposite: (d.articleWriterComposite || '').trim(),
          cowriterComposite: (d.articleCowriterComposite || '').trim(),

          // Media flags (sentinel div presence)
          showPhotoCredits: showPhotoCredits,
          photographer: (d.articlePhotographer || '').trim(),
          photoEssay: photoEssay,
          videoArticle: videoArticle,
          videoUrl: (d.articleVideoUrl || '').trim(),
          audioUrl: (d.articleAudioUrl || '').trim()
        });
      });
      return out;
    }

    function mapStatus(hash) {
      // v1.0.1 had a legacy ID-hash map here. In production, Webflow
      // binds `article-status` to the option's LABEL (e.g. "Draft"),
      // not its ID. So the fallback is what actually runs. Keep the
      // label lowercased so CSS class hooks (.draft, .live) work.
      if (!hash) return 'draft';
      return String(hash).toLowerCase();
    }

    function isOn() { return false; } // legacy; kept as no-op in case anything still references it

    // ═══════════════════════════════════════════
    // EDIT STATE ENGINE (v1.1.0)
    // ═══════════════════════════════════════════

    // Mapping from field key → how to extract its "loaded" value from
    // an article object. Used when an article is opened.
    var LOADERS = {
      articleTitle:     function (a) { return a.name; },
      subtitle:         function (a) { return a.subtitle; },
      teaser:           function (a) { return a.teaser; },
      shortSummary:     function (a) { return a.shortSummary; },
      bannerStatement:  function (a) { return a.bannerStatement; },
      ctaText:          function (a) { return a.ctaText; },
      ctaButtonText:    function (a) { return a.ctaButton; },
      ctaUrl:           function (a) { return a.ctaUrl; },
      writerName:       function (a) { return a.writerName; },
      writerTitle:      function (a) { return a.writerTitle; },
      cowriterName:     function (a) { return a.cowriterName; },
      cowriterTitle:    function (a) { return a.cowriterTitle; },
      mainImageAlt:     function (a) { return a.mainImageAlt; },
      photographer:     function (a) { return a.photographer; },
      videoUrl:         function (a) { return a.videoUrl; },
      audioUrl:         function (a) { return a.audioUrl; },
      customerId:       function (a) { return a.customerId; },
      productId:        function (a) { return a.productId; },
      mnlsId:           function (a) { return a.mnlsId; },
      revenueType:      function (a) { return a.revenueType; },
      articleStatus:    function (a) { return a.status; },
      showPhotoCredits: function (a) { return !!a.showPhotoCredits; },
      photoEssay:       function (a) { return !!a.photoEssay; },
      videoArticle:     function (a) { return !!a.videoArticle; }
    };

    // Character-limit fields (render counter in UI)
    var CHAR_LIMITS = {
      teaser:       400,
      shortSummary: 150
    };

    // Load an article's values into S.edit.loaded and S.edit.current.
    function loadEditSnapshot(a) {
      S.edit.loaded  = {};
      S.edit.current = {};
      Object.keys(LOADERS).forEach(function (k) {
        var v = LOADERS[k](a);
        // Normalize: treat null/undefined as '' for strings, false for bools
        if (typeof v === 'boolean') {
          S.edit.loaded[k]  = !!v;
          S.edit.current[k] = !!v;
        } else {
          S.edit.loaded[k]  = (v == null ? '' : String(v));
          S.edit.current[k] = (v == null ? '' : String(v));
        }
      });
      S.edit.saving = false;
      S.edit.saveJustFinished = false;
    }

    // Is the given field's current value different from its loaded value?
    function isDirty(key) {
      var cur = S.edit.current[key];
      var ldd = S.edit.loaded[key];
      if (typeof cur === 'boolean' || typeof ldd === 'boolean') {
        return !!cur !== !!ldd;
      }
      return String(cur || '').trim() !== String(ldd || '').trim();
    }

    function countDirty() {
      return Object.keys(S.edit.loaded).filter(isDirty).length;
    }

    function dirtyPayload() {
      var out = {};
      Object.keys(S.edit.loaded).forEach(function (k) {
        if (isDirty(k)) out[k] = S.edit.current[k];
      });
      return out;
    }

    // Called by each editable field on every input/change event.
    function onFieldChange(key, value) {
      S.edit.current[key] = value;
      // Update ONLY the parts of the DOM that need updating, not full re-render,
      // so the user's cursor doesn't jump.
      updateFieldDirtyVisual(key);
      updateCharCounter(key);
      updateSaveBar();
      installBeforeUnload();
    }

    function updateFieldDirtyVisual(key) {
      var el = document.querySelector('[data-asm-field-wrap="' + key + '"]');
      if (!el) return;
      el.classList.toggle('dirty', isDirty(key));
    }

    function updateCharCounter(key) {
      if (!CHAR_LIMITS[key]) return;
      var max = CHAR_LIMITS[key];
      var len = String(S.edit.current[key] || '').length;
      var el = document.querySelector('[data-asm-counter="' + key + '"]');
      if (!el) return;
      el.textContent = len + ' / ' + max;
      el.classList.toggle('over', len > max);
    }

    function updateSaveBar() {
      var n = countDirty();
      var bar = document.getElementById('asm-save-bar');
      if (!bar) return;
      var btn    = bar.querySelector('[data-asm-save]');
      var reset  = bar.querySelector('[data-asm-reset]');
      var info   = bar.querySelector('.asm-save-info');
      var cancel = bar.querySelector('[data-asm-cancel]');
      if (n === 0) {
        bar.classList.remove('has-changes');
        if (btn)   { btn.disabled = true; btn.textContent = 'No changes'; }
        if (reset) reset.disabled = true;
        if (info)  info.textContent = 'Clean \u2014 no pending changes';
        // Cancel is always enabled so user can close the asset
      } else {
        bar.classList.add('has-changes');
        if (btn)   { btn.disabled = false; btn.textContent = 'Save ' + n + ' change' + (n === 1 ? '' : 's'); }
        if (reset) reset.disabled = false;
        if (info)  info.textContent = n + ' field' + (n === 1 ? '' : 's') + ' ready to save';
      }
    }

    // Revert all current values to their loaded values and re-render open view.
    function revertAll() {
      Object.keys(S.edit.loaded).forEach(function (k) {
        S.edit.current[k] = S.edit.loaded[k];
      });
      renderAssembler();
    }

    // v1.1.2: Live save via Scenario G Route 2 (updateArticleFields).
    // Payload shape matches v1.1.1 stub. Option fields translated
    // label → hash via TA_CONFIG.optionIds before POST.
    // On success: promote current → loaded, clear dirty, flash ✓.
    // On failure: surface error inline in save bar, keep Save enabled
    // so user can retry, do NOT clear dirty state.
    function triggerSave() {
      if (countDirty() === 0) return;
      if (!CFG.makeStudio) {
        showSaveError('No makeStudio URL configured. Check window.TA_CONFIG in the T-A page head.');
        return;
      }

      S.edit.saving = true;
      updateSaveBarSavingState();
      clearSaveError();

      var payload = {
        action: 'updateArticleFields',
        titleSlug: CFG.titleSlug,
        articleItemId: S.selectedAssetId,
        taItemId: CFG.taItemId,
        dirtyFields: translateDirtyForPayload(dirtyPayload()),
        loadedAt: new Date().toISOString()
      };

      console.log('[TA-STUDIO v1.1.3] Save payload:', payload);

      fetch(CFG.makeStudio, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function (r) {
        if (!r.ok) {
          // Make returns non-JSON error bodies on scenario failure
          // (e.g. Webflow validation errors come back as 500 with
          // plain text "Scenario failed"). Read as text to avoid the
          // SyntaxError from r.json() on non-JSON.
          return r.text().then(function (txt) {
            throw new Error('HTTP ' + r.status + ': ' + (txt || r.statusText || 'Unknown error'));
          });
        }
        return r.json();
      })
      .then(function (data) {
        if (!data || data.status !== 'success') {
          throw new Error((data && data.error) || 'Webhook returned unsuccessful status');
        }
        // SUCCESS: promote current → loaded, clear dirty, flash ✓,
        // then auto-return to picker after a brief confirmation.
        S.edit.saving = false;
        S.edit.saveJustFinished = true;
        Object.keys(S.edit.loaded).forEach(function (k) {
          S.edit.loaded[k] = S.edit.current[k];
        });
        clearSaveBarTransientClasses();  // drop .saving, .has-error
        renderAssembler();
        setTimeout(function () {
          S.edit.saveJustFinished = false;
          // Auto-return to picker. selectedAssetId cleared here so the
          // picker view renders. Dirty is already clean so closeAsset's
          // confirm-discard prompt won't fire.
          S.selectedAssetId = null;
          renderAssembler();
        }, 1200);
      })
      .catch(function (err) {
        S.edit.saving = false;
        console.error('[TA-STUDIO] Save failed:', err);
        clearSaveBarTransientClasses();  // drop .saving so CSS is clean
        showSaveError(trimErrorText(err.message || String(err)));
        // Do NOT promote current → loaded — dirty state persists so
        // user can fix the issue and retry. Stay on the article.
        updateSaveBar();
      });
    }

    // v1.1.3: drop transient CSS classes from the save bar so the bar's
    // visual state matches its logical state (clean/has-changes/error).
    // Without this, .saving left over from updateSaveBarSavingState()
    // kept the bar green even when countDirty() returned 0.
    function clearSaveBarTransientClasses() {
      var bar = document.getElementById('asm-save-bar');
      if (!bar) return;
      bar.classList.remove('saving');
      bar.classList.remove('has-error');
    }

    // v1.1.2: Option-field label → hash translation.
    // Webflow option fields require the option-ID hash on write, but
    // the T-A hidden collection renders them as labels. Studio reads
    // labels from the DOM and must translate back to hashes before
    // POST. Scope: articleStatus, revenueType. (See TD-110 re: the
    // dirtyFields.articleStatus key name which maps to publish-status
    // slug server-side.)
    function translateDirtyForPayload(dirty) {
      var out = {};
      var oids = CFG.optionIds || {};
      Object.keys(dirty).forEach(function (k) {
        var v = dirty[k];
        if (k === 'articleStatus') {
          // Label "Draft" / "Live" → publishStatus hash
          var ps = oids.publishStatus || {};
          var key = String(v || '').toLowerCase();
          if (ps[key]) {
            out[k] = ps[key];
          } else {
            console.warn('[TA-STUDIO] No publishStatus hash for label:', v, '— sending label as-is');
            out[k] = v;
          }
        } else if (k === 'revenueType') {
          // Label "Paid Ad" / "Paid Article" / "Sponsorable" → revenueType hash
          var rt = oids.revenueType || {};
          var rtKey = labelToOptionKey(v);
          if (rtKey && rt[rtKey]) {
            out[k] = rt[rtKey];
          } else {
            console.warn('[TA-STUDIO] No revenueType hash for label:', v, '— sending label as-is');
            out[k] = v;
          }
        } else {
          out[k] = v;
        }
      });
      return out;
    }

    // "Paid Ad" → "paidAd", "Paid Article" → "paidArticle", "Sponsorable" → "sponsorable"
    function labelToOptionKey(label) {
      if (!label) return '';
      var parts = String(label).trim().split(/\s+/);
      if (!parts.length) return '';
      return parts.map(function (p, i) {
        p = p.toLowerCase();
        if (i === 0) return p;
        return p.charAt(0).toUpperCase() + p.slice(1);
      }).join('');
    }

    // Truncate long error messages for the inline save-bar display.
    function trimErrorText(msg) {
      msg = String(msg || '').replace(/\s+/g, ' ').trim();
      if (msg.length > 220) msg = msg.substring(0, 217) + '…';
      return msg;
    }

    function showSaveError(msg) {
      var bar = document.getElementById('asm-save-bar');
      if (!bar) return;
      var info = bar.querySelector('.asm-save-info');
      if (!info) return;
      bar.classList.add('has-error');
      info.innerHTML = '<span style="color:#c0392b;font-weight:600">Save failed:</span> <span style="color:#c0392b">' + esc(msg) + '</span>';
      var btn = bar.querySelector('[data-asm-save]');
      if (btn) { btn.disabled = false; btn.textContent = 'Retry save'; }
    }

    function clearSaveError() {
      var bar = document.getElementById('asm-save-bar');
      if (!bar) return;
      bar.classList.remove('has-error');
    }

    // ═══════════════════════════════════════════
    // BODY EDITOR (v1.1.2) — Studio-owned RTE flow
    // Uses Scenario G Route 1 + Route 3 directly. No dependency on
    // uploads-processor or makeAssembly.
    // ═══════════════════════════════════════════

    // Fetch the current post-body HTML for an article via Scenario G
    // Route 1. Body is URL-encoded over the wire (to survive nested
    // quotes and newlines in the JSON response) — decode on receipt
    // per the contract established Session 3.
    function fetchArticleBody(articleItemId) {
      if (!CFG.makeStudio) {
        console.error('[TA-STUDIO] No makeStudio URL configured');
        return Promise.resolve(null);
      }
      if (!articleItemId) {
        console.error('[TA-STUDIO] fetchArticleBody called without articleItemId');
        return Promise.resolve(null);
      }
      return fetch(CFG.makeStudio, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getArticleBody',
          titleSlug: CFG.titleSlug,
          articleItemId: articleItemId
        })
      })
      .then(function (r) {
        if (!r.ok) {
          return r.text().then(function (txt) {
            throw new Error('HTTP ' + r.status + ': ' + (txt || r.statusText || 'Unknown error'));
          });
        }
        return r.json();
      })
      .then(function (data) {
        if (!data || data.status !== 'ok') {
          throw new Error((data && data.error) || 'getArticleBody returned unsuccessful status');
        }
        // Body is URL-encoded — decode before returning.
        return decodeURIComponent(data.body || '');
      })
      .catch(function (err) {
        console.error('[TA-STUDIO] fetchArticleBody error:', err);
        return null;
      });
    }

    // Save edited body HTML via Scenario G Route 3. Always sends
    // bodyStatus = edited (Raw is set upstream by Scenario F).
    function saveArticleBody(articleItemId, editedHTML) {
      if (!CFG.makeStudio) {
        return Promise.reject(new Error('No makeStudio URL configured'));
      }
      var editedHash = ((CFG.optionIds || {}).bodyStatus || {}).edited || '';
      if (!editedHash) {
        return Promise.reject(new Error('No optionIds.bodyStatus.edited hash in TA_CONFIG'));
      }
      return fetch(CFG.makeStudio, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateArticleBody',
          titleSlug: CFG.titleSlug,
          articleItemId: articleItemId,
          articleBody: editedHTML,
          bodyStatus: editedHash
        })
      })
      .then(function (r) {
        if (!r.ok) {
          return r.text().then(function (txt) {
            throw new Error('HTTP ' + r.status + ': ' + (txt || r.statusText || 'Unknown error'));
          });
        }
        return r.json();
      })
      .then(function (data) {
        if (!data || data.status !== 'success') {
          throw new Error((data && data.error) || 'updateArticleBody returned unsuccessful status');
        }
        return data;
      });
    }

    // Open the fullscreen RTE body editor for an article. Fetches the
    // current body via Route 1, opens InbxRTE, wires onSave to Route 3.
    // On success: mirrors data-body-status="Edited" onto the picker's
    // hidden collection DOM so the UI reflects the new state.
    function openBodyEditor(articleItemId, articleTitle) {
      if (!window.InbxRTE || typeof window.InbxRTE.openFullscreen !== 'function') {
        console.error('[TA-STUDIO] window.InbxRTE not available. Is ta-rte-v1.0.0.js loaded on this page?');
        alert('Body editor is not loaded. Make sure ta-rte-v1.0.0.js is loaded on this page.');
        return;
      }
      if (!articleItemId) {
        console.error('[TA-STUDIO] openBodyEditor called without articleItemId');
        return;
      }

      fetchArticleBody(articleItemId).then(function (html) {
        if (html === null) {
          alert('Could not load the current article body. Check the console for details.');
          return;
        }
        window._studioRteInstance = window.InbxRTE.openFullscreen({
          articleItemId: articleItemId,
          articleTitle: articleTitle || '',
          initialHTML: html,
          mode: 'edit',
          onSave: function (editedHTML) {
            saveArticleBody(articleItemId, editedHTML)
              .then(function () {
                console.log('[TA-STUDIO] Body saved + body-status=Edited for', articleItemId);
                // Mirror the new body-status onto the hidden collection
                // DOM so the picker reflects it without a page reload.
                var el = document.querySelector('.articles-wrapper[data-article-id="' + articleItemId + '"]');
                if (el) el.setAttribute('data-body-status', 'Edited');
                window._studioRteInstance = null;
              })
              .catch(function (err) {
                console.error('[TA-STUDIO] Body save failed:', err);
                alert('Save failed: ' + trimErrorText(err.message || String(err)) +
                      '\n\nYour edits are still in the editor — you can try again.');
              });
          },
          onClose: function () {
            window._studioRteInstance = null;
          }
        });
      });
    }

    function updateSaveBarSavingState() {
      var bar = document.getElementById('asm-save-bar');
      if (!bar) return;
      bar.classList.add('saving');
      var btn = bar.querySelector('[data-asm-save]');
      if (btn) { btn.disabled = true; btn.textContent = 'Saving\u2026'; }
    }

    // Close the open asset — used by Cancel link and Back.
    // If dirty, confirm before closing.
    function closeAsset(force) {
      if (!force && countDirty() > 0) {
        if (!window.confirm('You have ' + countDirty() + ' unsaved change' + (countDirty() === 1 ? '' : 's') + '. Close and discard?')) {
          return;
        }
      }
      S.selectedAssetId = null;
      S.edit.loaded = {};
      S.edit.current = {};
      renderAssembler();
    }

    // Customers / Products / MNLS (for filter dropdowns)
    function readCustomers() {
      return dedupe(
        Array.prototype.map.call(
          document.querySelectorAll('.customers-wrapper[data-item]'),
          function (el) {
            return { id: (el.dataset.id || '').trim(), name: (el.dataset.name || '').trim() };
          }
        ).filter(function (c) { return c.id; })
      ).sort(byName);
    }
    function readProducts() {
      return dedupe(
        Array.prototype.map.call(
          document.querySelectorAll('.products-wrapper[data-item]'),
          function (el) {
            return { id: (el.dataset.id || '').trim(), name: (el.dataset.name || '').trim() };
          }
        ).filter(function (p) { return p.id; })
      ).sort(byName);
    }
    function readMnls() {
      // MNLS values come from Articles' data-mnls-id / data-mnls-name
      var seen = {};
      Array.prototype.forEach.call(
        document.querySelectorAll('.articles-wrapper[data-item]'),
        function (el) {
          var id = (el.dataset.mnlsId || '').trim();
          var name = (el.dataset.mnlsName || '').trim();
          if (id && !seen[id]) seen[id] = { id: id, name: name || id };
        }
      );
      return Object.keys(seen).map(function (k) { return seen[k]; }).sort(byName);
    }
    function dedupe(arr) {
      var seen = {};
      return arr.filter(function (x) {
        if (seen[x.id]) return false;
        seen[x.id] = true;
        return true;
      });
    }
    function byName(a, b) { return (a.name || '').localeCompare(b.name || ''); }

    // ═══════════════════════════════════════════
    // ASSEMBLER rendering
    // ═══════════════════════════════════════════

    function renderAssembler() {
      var root = document.getElementById('asm-root');
      if (!root) return;

      // v1.1.3: body-class toggle drives design-system CSS that hides
      // .publisher-wrapper while editing. Class is driven by state, not
      // by DOM events — so every entry/exit path (open, save-auto-close,
      // cancel, back, reset-then-close) is covered by this one update.
      if (S.selectedAssetId) {
        document.body.classList.add('studio-editing');
        renderOpenAssembler(root);
      } else {
        document.body.classList.remove('studio-editing');
        renderPicker(root);
      }
    }

    // ── Asset picker view ──
    function renderPicker(root) {
      var customers = readCustomers();
      var products = readProducts();
      var mnls = readMnls();

      var h = '';

      h += '<div class="asm-phase-notice"><strong>Phase 2.</strong> Pick an Article to edit inline. Changes save directly to Webflow. Component attachment arrives in Phase 3. Ads / Events / RE coming in Phase 6.</div>';

      h += '<div class="asm-picker-wrap">';

      // Header + type toggle
      h += '<div class="asm-picker-head">';
      h += '<div class="asm-picker-title">Pick an Asset</div>';
      h += '<div class="asm-picker-sub">Filter by type, customer, product, or section</div>';
      h += '<div class="asm-type-toggle">';
      h += typeOpt('articles', 'Articles');
      h += typeOpt('ads', 'Ads');
      h += typeOpt('events', 'Events');
      h += typeOpt('re', 'RE Listings');
      h += '</div>';
      h += '</div>';

      // Filters
      h += '<div class="asm-filters">';
      h += '<div class="asm-ff"><label class="asm-fl">Name</label>' +
           '<input class="asm-finp" id="asm-f-name" type="text" placeholder="Search\u2026" value="' + esc(S.filter.name) + '"></div>';
      h += '<div class="asm-ff"><label class="asm-fl">Customer</label>' +
           '<select class="asm-fsel" id="asm-f-customer">' +
             '<option value="">All customers</option>' +
             customers.map(function (c) {
               return '<option value="' + esc(c.id) + '"' + (c.id === S.filter.customerId ? ' selected' : '') + '>' + esc(c.name) + '</option>';
             }).join('') +
           '</select></div>';
      h += '<div class="asm-ff"><label class="asm-fl">Product Library</label>' +
           '<select class="asm-fsel" id="asm-f-product">' +
             '<option value="">All products</option>' +
             products.map(function (p) {
               return '<option value="' + esc(p.id) + '"' + (p.id === S.filter.productId ? ' selected' : '') + '>' + esc(p.name) + '</option>';
             }).join('') +
           '</select></div>';
      h += '<div class="asm-ff"><label class="asm-fl">MNLS</label>' +
           '<select class="asm-fsel" id="asm-f-mnls">' +
             '<option value="">All sections</option>' +
             mnls.map(function (m) {
               return '<option value="' + esc(m.id) + '"' + (m.id === S.filter.mnlsId ? ' selected' : '') + '>' + esc(m.name) + '</option>';
             }).join('') +
           '</select></div>';
      h += '<div class="asm-ff asm-sort-wrap"><label class="asm-fl">Sort</label>' +
           '<select class="asm-fsel" id="asm-f-sort">' +
             sortOpt('recent-edited', 'Recently edited') +
             sortOpt('recent-added', 'Recently added') +
             sortOpt('name', 'Name A-Z') +
           '</select></div>';
      h += '</div>';

      // Availability toggle
      h += '<div style="padding:6px 18px;border-bottom:1px solid var(--ix-border-soft);background:var(--ix-white);font-family:var(--ix-font-mono);font-size:10px;color:var(--ix-text-mid);display:flex;align-items:center;gap:10px">';
      h += '<label style="display:flex;align-items:center;gap:6px;cursor:pointer">';
      h += '<input type="checkbox" id="asm-f-avail"' + (S.filter.availabilityOnly ? ' checked' : '') + '>';
      h += '<span>Show available only <span style="color:var(--ix-text-tiny)">(not newsletter-attached + not Live)</span></span>';
      h += '</label>';
      h += '</div>';

      // Results list
      h += renderResultsList();

      h += '</div>';

      root.innerHTML = h;

      // Bind filter events
      bindFilterEvents(root);
    }

    function typeOpt(id, label) {
      var disabled = id !== 'articles';
      return '<button class="asm-type-opt' + (id === S.assetType ? ' active' : '') + '"' +
        (disabled ? ' disabled title="Phase 6"' : '') +
        ' data-asm-type="' + id + '">' +
        esc(label) + (disabled ? ' \u2014 soon' : '') +
        '</button>';
    }

    function sortOpt(val, label) {
      return '<option value="' + val + '"' + (val === S.filter.sort ? ' selected' : '') + '>' + esc(label) + '</option>';
    }

    function renderResultsList() {
      if (S.assetType !== 'articles') {
        return '<div class="asm-results-empty">' + S.assetType.toUpperCase() + ' support arrives in Phase 6.</div>';
      }

      var items = getFilteredArticles();
      var h = '<div class="asm-result-count">' + items.length + ' article' + (items.length === 1 ? '' : 's') + '</div>';

      if (!items.length) {
        h += '<div class="asm-results-empty">No articles match these filters.</div>';
        return '<div class="asm-results">' + h + '</div>';
      }

      h += '<div>';
      items.forEach(function (a) {
        var dotClass = a.newsletterId ? 'assigned' : (a.status === 'live' ? 'live' : 'draft');
        var metaBits = [];
        if (a.customerName) metaBits.push(esc(a.customerName));
        else metaBits.push('<span style="color:var(--ix-text-tiny)">No customer</span>');
        if (a.productName) metaBits.push(esc(a.productName));
        if (a.mnlsName) metaBits.push(esc(a.mnlsName));
        if (a.newsletterName) metaBits.push('\u2192 ' + esc(a.newsletterName));

        h += '<div class="asm-result" data-asm-open="' + esc(a.id) + '">';
        h += '<div class="asm-result-main">';
        h += '<div class="asm-result-name">' + (esc(a.name) || '<em>Untitled</em>') + '</div>';
        h += '<div class="asm-result-meta">';
        h += '<span class="asm-status-dot ' + dotClass + '"></span>';
        h += '<span>' + (a.newsletterId ? 'ASSIGNED' : a.status.toUpperCase()) + '</span>';
        metaBits.forEach(function (b, i) {
          h += '<span class="sep">\u00B7</span><span>' + b + '</span>';
        });
        h += '</div></div>';
        h += '<div></div>';
        h += '<div class="asm-result-chevron">\u203A</div>';
        h += '</div>';
      });
      h += '</div>';

      return '<div class="asm-results">' + h + '</div>';
    }

    function getFilteredArticles() {
      var items = readArticles();

      if (S.filter.availabilityOnly) {
        items = items.filter(function (a) {
          return !a.newsletterId && a.status !== 'live';
        });
      }

      var nameQ = S.filter.name.toLowerCase().trim();
      if (nameQ) items = items.filter(function (a) { return (a.name || '').toLowerCase().indexOf(nameQ) !== -1; });
      if (S.filter.customerId) items = items.filter(function (a) { return a.customerId === S.filter.customerId; });
      if (S.filter.productId)  items = items.filter(function (a) { return a.productId  === S.filter.productId; });
      if (S.filter.mnlsId)     items = items.filter(function (a) { return a.mnlsId     === S.filter.mnlsId; });

      items.sort(function (a, b) {
        if (S.filter.sort === 'name') return (a.name || '').localeCompare(b.name || '');
        if (S.filter.sort === 'recent-added') return cmpDesc(a.created, b.created);
        return cmpDesc(a.updated || a.created, b.updated || b.created); // recent-edited (default)
      });

      return items;
    }

    function cmpDesc(a, b) {
      a = a || ''; b = b || '';
      if (a === b) return 0;
      return a < b ? 1 : -1;
    }

    function bindFilterEvents(root) {
      // Type toggle
      Array.prototype.forEach.call(root.querySelectorAll('[data-asm-type]'), function (b) {
        b.addEventListener('click', function () {
          if (b.disabled) return;
          S.assetType = b.getAttribute('data-asm-type');
          renderAssembler();
        });
      });

      // Filters
      var byId = function (id) { return root.querySelector('#' + id); };
      var onName = byId('asm-f-name');
      if (onName) onName.addEventListener('input', function () { S.filter.name = onName.value; updateResults(); });
      var onCust = byId('asm-f-customer');
      if (onCust) onCust.addEventListener('change', function () { S.filter.customerId = onCust.value; updateResults(); });
      var onProd = byId('asm-f-product');
      if (onProd) onProd.addEventListener('change', function () { S.filter.productId = onProd.value; updateResults(); });
      var onMnls = byId('asm-f-mnls');
      if (onMnls) onMnls.addEventListener('change', function () { S.filter.mnlsId = onMnls.value; updateResults(); });
      var onSort = byId('asm-f-sort');
      if (onSort) onSort.addEventListener('change', function () { S.filter.sort = onSort.value; updateResults(); });
      var onAvail = byId('asm-f-avail');
      if (onAvail) onAvail.addEventListener('change', function () { S.filter.availabilityOnly = onAvail.checked; updateResults(); });

      // Result click
      root.addEventListener('click', function (e) {
        var row = e.target.closest('[data-asm-open]');
        if (!row) return;
        S.selectedAssetId = row.getAttribute('data-asm-open');
        renderAssembler();
      });
    }

    function updateResults() {
      var host = document.querySelector('#asm-root .asm-picker-wrap');
      if (!host) return;
      // Replace just the results container
      var existing = host.querySelector('.asm-results');
      var emptyNode = host.querySelector('.asm-results-empty'); // if no asm-results, this might be the fallback
      var replacement = document.createElement('div');
      replacement.innerHTML = renderResultsList();
      var newList = replacement.firstElementChild;
      if (existing) existing.parentNode.replaceChild(newList, existing);
      else if (emptyNode) emptyNode.parentNode.replaceChild(newList, emptyNode);
      else host.appendChild(newList);
    }

    // ── Open Assembler (single asset) ──
    function renderOpenAssembler(root) {
      var articles = readArticles();
      var a = articles.find(function (x) { return x.id === S.selectedAssetId; });

      if (!a) {
        root.innerHTML = '<div class="asm-results-empty">Article not found. It may have been removed, or its CMS data hasn\u2019t loaded yet.</div>' +
                        '<div style="text-align:center;margin-top:12px"><button class="asm-back-btn" id="asm-back">\u2190 Back to picker</button></div>';
        document.getElementById('asm-back').addEventListener('click', function () {
          closeAsset(true);
        });
        return;
      }

      // Snapshot loaded values ONCE on open (only if we haven't already
      // loaded this asset). On re-render after save, S.edit.loaded has
      // been promoted already and we don't want to re-snapshot.
      var hasSnapshot = Object.keys(S.edit.loaded).length > 0;
      if (!hasSnapshot) {
        loadEditSnapshot(a);
      }

      var dirtyCount = countDirty();
      var h = '';

      // Back row — phase label becomes "Editable view (Session 1)"
      h += '<div class="asm-back-row">';
      h += '<button class="asm-back-btn" data-asm-back-btn>\u2190 Back to picker</button>';
      h += '<div style="font-family:var(--ix-font-mono);font-size:10px;color:var(--ix-text-light);letter-spacing:0.04em;text-transform:uppercase">Editable view (v1.1.3) \u00B7 Live save via Scenario G</div>';
      h += '</div>';

      // Metadata strip (read-only display of current values)
      h += '<div class="asm-meta-strip">';
      h += '<div class="asm-meta-bar"></div>';
      h += '<div class="asm-meta-body">';
      var titleDisplay = S.edit.current.articleTitle || a.name || '<em>Untitled</em>';
      h += metaCell('Article', esc(titleDisplay), 'primary');
      h += metaCell('Customer', a.customerName || '', a.customerName ? '' : 'empty');
      h += metaCell('Product', a.productName || '', a.productName ? '' : 'empty');
      h += metaCell('MNLS', a.mnlsName || '', a.mnlsName ? '' : 'empty');
      // Status pill
      var statusNow = (S.edit.current.articleStatus || a.status || 'draft').toLowerCase();
      var pillClass = a.newsletterId ? 'assigned' : statusNow;
      var pillLabel = a.newsletterId ? 'Assigned' : (statusNow === 'live' ? 'Live' : 'Draft');
      h += '<div class="asm-meta-cell">';
      h += '<div class="asm-meta-label">Status</div>';
      h += '<div class="asm-status-pill ' + pillClass + '">' + pillLabel + '</div>';
      if (a.newsletterId && a.newsletterName) {
        h += '<div class="asm-meta-value" style="font-size:11px;color:var(--ix-text-light);margin-top:2px">' + esc(a.newsletterName) + (a.newsletterDate ? ' \u00B7 ' + esc(a.newsletterDate) : '') + '</div>';
      }
      h += '</div>';
      h += '</div>';
      h += '</div>';

      // Three columns
      h += '<div class="asm-columns">';
      h += renderCol1(a);
      h += renderCol2(a);
      h += renderCol3(a);
      h += '</div>';

      // Save bar (sticky at bottom)
      h += renderSaveBar(dirtyCount);

      root.innerHTML = h;

      // Wire events
      bindOpenAssemblerEvents(root, a);

      // Install unload guard lazily — only once any dirty field appears
      if (dirtyCount > 0) installBeforeUnload();
    }

    function renderSaveBar(dirtyCount) {
      var h = '';
      h += '<div class="asm-save-bar' + (dirtyCount > 0 ? ' has-changes' : '') + (S.edit.saveJustFinished ? ' just-saved' : '') + '" id="asm-save-bar">';
      h += '<a class="asm-cancel-link" data-asm-cancel href="javascript:void(0)">\u2715 cancel \u2014 close without saving</a>';
      h += '<div class="asm-save-right">';
      h += '<span class="asm-save-info">' + (dirtyCount > 0 ? (dirtyCount + ' field' + (dirtyCount === 1 ? '' : 's') + ' ready to save') : 'Clean \u2014 no pending changes') + '</span>';
      h += '<button class="asm-reset-btn" data-asm-reset' + (dirtyCount === 0 ? ' disabled' : '') + '>\u21BB Reset</button>';
      h += '<button class="asm-save-btn" data-asm-save' + (dirtyCount === 0 ? ' disabled' : '') + '>';
      h += (dirtyCount === 0 ? 'No changes' : 'Save ' + dirtyCount + ' change' + (dirtyCount === 1 ? '' : 's'));
      h += '</button>';
      h += '</div>';
      h += '</div>';
      return h;
    }

    function bindOpenAssemblerEvents(root, a) {
      // Back button
      var back = root.querySelector('[data-asm-back-btn]');
      if (back) back.addEventListener('click', function () { closeAsset(false); });

      // Save bar actions
      var cancel = root.querySelector('[data-asm-cancel]');
      if (cancel) cancel.addEventListener('click', function () { closeAsset(false); });
      var reset = root.querySelector('[data-asm-reset]');
      if (reset) reset.addEventListener('click', function () {
        if (countDirty() === 0) return;
        if (!window.confirm('Discard ' + countDirty() + ' pending change' + (countDirty() === 1 ? '' : 's') + ' and revert to loaded values?')) return;
        revertAll();
      });
      var save = root.querySelector('[data-asm-save]');
      if (save) save.addEventListener('click', function () { triggerSave(); });

      // v1.1.2: Article body launcher — Studio-owned body editor flow.
      // Calls Scenario G Route 1 (getArticleBody) to fetch current
      // post-body HTML, opens InbxRTE fullscreen, then on save calls
      // Scenario G Route 3 (updateArticleBody) with bodyStatus=edited.
      // No dependency on window.InbxEditBody or uploads-processor.
      var bodyBtn = root.querySelector('[data-asm-body-launch]');
      if (bodyBtn) {
        bodyBtn.addEventListener('click', function () {
          openBodyEditor(a.id, a.name);
        });
      }

      // Wire every editable field — delegate input & change to one handler
      root.addEventListener('input', function (e) {
        var el = e.target;
        var key = el.getAttribute && el.getAttribute('data-asm-field');
        if (!key) return;
        var val = (el.type === 'checkbox') ? el.checked : el.value;
        onFieldChange(key, val);
      });
      root.addEventListener('change', function (e) {
        var el = e.target;
        var key = el.getAttribute && el.getAttribute('data-asm-field');
        if (!key) return;
        var val = (el.type === 'checkbox') ? el.checked : el.value;
        onFieldChange(key, val);
      });
    }

    function metaCell(label, value, cls) {
      return '<div class="asm-meta-cell">' +
        '<div class="asm-meta-label">' + esc(label) + '</div>' +
        '<div class="asm-meta-value ' + (cls || '') + '">' + (value || '<span class="empty">\u2014</span>') + '</div>' +
        '</div>';
    }

    // Column 1 — Text
    function renderCol1(a) {
      var h = '';
      h += '<div class="asm-col">';
      h += '<div class="asm-col-head"><div class="asm-col-title">Text</div><div class="asm-col-count">1 of 3</div></div>';
      h += '<div class="asm-col-body">';

      h += editText('articleTitle',   'Title',           { required: true });
      h += editText('subtitle',       'Sub-Title');
      h += editText('bannerStatement','Banner Statement');
      h += editTextarea('teaser',       'Teaser Summary',  { limit: 400, rows: 3 });
      h += editTextarea('shortSummary', 'Short Summary',   { limit: 150, rows: 2 });

      // Revenue Type — select.
      // Values are the Webflow option LABELS. translateDirtyForPayload()
      // converts label → hash via TA_CONFIG.optionIds.revenueType on save.
      var rtOpts = [
        { v: '',             l: '\u2014 None \u2014' },
        { v: 'Paid Ad',      l: 'Paid Ad' },
        { v: 'Paid Article', l: 'Paid Article' },
        { v: 'Sponsorable',  l: 'Sponsorable' }
      ];
      h += editSelect('revenueType', 'Revenue Type', rtOpts);

      // Writers block — two pairs of inline fields
      h += '<div class="asm-sc asm-sc-group">';
      h += '<div class="asm-sc-label">Writer</div>';
      h += '<div class="asm-sc-row">';
      h += editInlineText('writerName',  'Name');
      h += editInlineText('writerTitle', 'Title / Role');
      h += '</div>';
      h += '</div>';

      h += '<div class="asm-sc asm-sc-group">';
      h += '<div class="asm-sc-label">Co-Writer</div>';
      h += '<div class="asm-sc-row">';
      h += editInlineText('cowriterName',  'Name');
      h += editInlineText('cowriterTitle', 'Title / Role');
      h += '</div>';
      h += '</div>';

      h += '</div></div>';
      return h;
    }

    // Column 2 — Media
    function renderCol2(a) {
      var h = '';
      h += '<div class="asm-col">';
      h += '<div class="asm-col-head"><div class="asm-col-title">Media</div><div class="asm-col-count">2 of 3</div></div>';
      h += '<div class="asm-col-body">';

      // Main image slot — readonly preview + editable alt text.
      // Image URL + UUID replacement is Phase 3+ (Uploadcare picker).
      h += '<div class="asm-img-slot">';
      h += '<div class="asm-img-slot-label">Main Image</div>';
      var imgUrl = buildMainImageUrl(a);
      if (imgUrl) {
        h += '<img class="asm-img-thumb" src="' + esc(imgUrl) + '" alt="' + esc(S.edit.current.mainImageAlt || a.mainImageAlt || '') + '">';
      } else {
        h += '<div class="asm-img-placeholder">No main image</div>';
      }
      // Editable alt text
      h += editInlineText('mainImageAlt', 'Alt Text');
      h += '</div>';

      // Interior images (deferred)
      h += '<div class="asm-img-slot">';
      h += '<div class="asm-img-slot-label">Interior Images</div>';
      h += '<div class="asm-gallery-empty">Interior-image gallery arrives in a later phase</div>';
      h += '</div>';

      // Photo credits — editable switch + conditional photographer field
      h += editSwitch('showPhotoCredits', 'Show Photo Credits');
      h += editText('photographer', 'Photographer');

      // Photo essay + video flags
      h += editSwitch('photoEssay', 'Photo Essay');
      h += editSwitch('videoArticle', 'Video Article');
      h += editText('videoUrl', 'Video URL', { type: 'url', placeholder: 'https://\u2026' });
      h += editText('audioUrl', 'Audio URL', { type: 'url', placeholder: 'https://\u2026' });

      h += '</div></div>';
      return h;
    }

    // Column 3 — Editorial / metadata / CTA
    function renderCol3(a) {
      var h = '';
      h += '<div class="asm-col">';
      h += '<div class="asm-col-head"><div class="asm-col-title">Editorial</div><div class="asm-col-count">3 of 3</div></div>';
      h += '<div class="asm-col-body">';

      // Body preview + launcher
      h += '<div class="asm-sc">';
      h += '<div class="asm-sc-label">Article Body';
      if (a.bodyStatus) h += ' <span style="color:var(--ix-text-tiny)">(status: ' + esc(a.bodyStatus) + ')</span>';
      h += '</div>';
      var plainBody = stripTagsAndTruncate(a.bodyHtml, 600);
      if (plainBody) {
        h += '<div class="asm-body-preview">' + esc(plainBody) + (plainBody.length >= 600 ? '\u2026' : '') + '</div>';
      } else {
        h += '<div class="asm-body-preview empty">No body content</div>';
      }
      // Always render button enabled; click handler checks for InbxRTE
      // availability at click time (it may load after Studio mounts).
      h += '<button class="asm-body-launch" data-asm-body-launch>\u270E Open body editor</button>';
      h += '</div>';

      // Customer / Product / MNLS pickers
      h += editSelect('customerId', 'Customer', [
        { v: '', l: '\u2014 None / Unsponsored \u2014' }
      ].concat(readCustomers().map(function (c) { return { v: c.id, l: c.name }; })));

      h += editSelect('productId', 'Product Library', [
        { v: '', l: '\u2014 None \u2014' }
      ].concat(readProducts().map(function (p) { return { v: p.id, l: p.name }; })));

      h += editSelect('mnlsId', 'Major NL Section', [
        { v: '', l: '\u2014 None \u2014' }
      ].concat(readMnls().map(function (m) { return { v: m.id, l: m.name }; })));

      // Article Status — option select. Values are labels; translated
      // to publishStatus hash on save via translateDirtyForPayload().
      h += editSelect('articleStatus', 'Article Status', [
        { v: 'Draft', l: 'Draft' },
        { v: 'Live',  l: 'Live' }
      ]);

      // CTA — three editable fields
      h += '<div class="asm-sc asm-sc-group">';
      h += '<div class="asm-sc-label">Call-to-Action</div>';
      h += editInlineText('ctaButtonText', 'Button Label');
      h += editInlineText('ctaText',       'Supporting Text');
      h += editInlineText('ctaUrl',        'Redirect URL', { type: 'url', placeholder: 'https://\u2026' });
      h += '</div>';

      // Readonly identifiers block
      h += '<div class="asm-sc asm-sc-readonly" style="opacity:0.7">';
      h += '<div class="asm-sc-label">Identifiers</div>';
      h += '<div class="asm-sc-value" style="font-family:var(--ix-font-mono);font-size:10px;line-height:1.6">';
      h += 'Article: <span style="color:var(--ix-blue-deep)">' + esc(a.id) + '</span>';
      if (a.printIssueSource) h += '<br>Print Issue: <span style="color:var(--ix-text-mid)">' + esc(a.printIssueSource) + '</span>';
      h += '</div></div>';

      h += '</div></div>';
      return h;
    }

    // ── Edit field builders ──
    // All fields wrap in a `.asm-sc` with `data-asm-field-wrap="<key>"`.
    // The input/select/textarea inside carries `data-asm-field="<key>"`
    // so the delegated handler in bindOpenAssemblerEvents picks it up.
    // The `.dirty` class is toggled on the wrap when current !== loaded.

    function editText(key, label, opts) {
      opts = opts || {};
      var val = S.edit.current[key] || '';
      var dirty = isDirty(key);
      var type = opts.type || 'text';
      var placeholder = opts.placeholder || '';
      var h = '';
      h += '<div class="asm-sc' + (dirty ? ' dirty' : '') + '" data-asm-field-wrap="' + esc(key) + '">';
      h += '<div class="asm-sc-label">' + esc(label) + (opts.required ? ' <span class="req">*</span>' : '') + '</div>';
      h += '<input class="asm-input" type="' + esc(type) + '"';
      h += ' data-asm-field="' + esc(key) + '"';
      h += ' value="' + esc(val) + '"';
      if (placeholder) h += ' placeholder="' + esc(placeholder) + '"';
      h += '>';
      h += '</div>';
      return h;
    }

    function editTextarea(key, label, opts) {
      opts = opts || {};
      var val = S.edit.current[key] || '';
      var dirty = isDirty(key);
      var limit = opts.limit || CHAR_LIMITS[key] || 0;
      var rows = opts.rows || 3;
      var len = String(val).length;
      var over = limit && len > limit;
      var h = '';
      h += '<div class="asm-sc' + (dirty ? ' dirty' : '') + '" data-asm-field-wrap="' + esc(key) + '">';
      h += '<div class="asm-sc-label">' + esc(label);
      if (limit) {
        h += ' <span class="asm-sc-counter' + (over ? ' over' : '') + '" data-asm-counter="' + esc(key) + '">' + len + ' / ' + limit + '</span>';
      }
      h += '</div>';
      h += '<textarea class="asm-textarea" rows="' + rows + '"';
      h += ' data-asm-field="' + esc(key) + '">';
      h += esc(val);
      h += '</textarea>';
      h += '</div>';
      return h;
    }

    function editSelect(key, label, options) {
      var val = S.edit.current[key] || '';
      var dirty = isDirty(key);
      // A select "has selection" = value is truthy. Use that for the
      // distinctive-border visual (per product UX rule). `.has-value`
      // class is independent of `.dirty` so users can see what's
      // selected at a glance even before editing.
      var hasVal = !!val;
      var h = '';
      h += '<div class="asm-sc' + (dirty ? ' dirty' : '') + (hasVal ? ' has-value' : '') + '" data-asm-field-wrap="' + esc(key) + '">';
      h += '<div class="asm-sc-label">' + esc(label) + '</div>';
      h += '<select class="asm-select" data-asm-field="' + esc(key) + '">';
      options.forEach(function (o) {
        h += '<option value="' + esc(o.v) + '"' + (String(o.v) === String(val) ? ' selected' : '') + '>' + esc(o.l) + '</option>';
      });
      h += '</select>';
      h += '</div>';
      return h;
    }

    function editSwitch(key, label) {
      var val = !!S.edit.current[key];
      var dirty = isDirty(key);
      var h = '';
      h += '<div class="asm-switch-row' + (dirty ? ' dirty' : '') + (val ? ' on' : '') + '" data-asm-field-wrap="' + esc(key) + '">';
      h += '<label class="asm-switch-label-group">';
      h += '<input type="checkbox" class="asm-switch-input" data-asm-field="' + esc(key) + '"' + (val ? ' checked' : '') + '>';
      h += '<span class="asm-switch-label">' + esc(label) + '</span>';
      h += '</label>';
      h += '<span class="asm-switch-state ' + (val ? 'on' : 'off') + '">' + (val ? 'on' : 'off') + '</span>';
      h += '</div>';
      return h;
    }

    // Inline field: two-per-row compact version of editText (for Writer blocks, CTA group)
    function editInlineText(key, label, opts) {
      opts = opts || {};
      var val = S.edit.current[key] || '';
      var dirty = isDirty(key);
      var type = opts.type || 'text';
      var placeholder = opts.placeholder || '';
      var h = '';
      h += '<div class="asm-inline-ff' + (dirty ? ' dirty' : '') + '" data-asm-field-wrap="' + esc(key) + '">';
      h += '<label class="asm-inline-label">' + esc(label) + '</label>';
      h += '<input class="asm-input asm-input-inline" type="' + esc(type) + '"';
      h += ' data-asm-field="' + esc(key) + '"';
      h += ' value="' + esc(val) + '"';
      if (placeholder) h += ' placeholder="' + esc(placeholder) + '"';
      h += '>';
      h += '</div>';
      return h;
    }

    // ── Legacy read-only scRow (kept for picker/fallback use, not open-asm) ──
    function scRow(label, value, opts) {
      opts = opts || {};
      var h = '<div class="asm-sc">';
      h += '<div class="asm-sc-label">' + esc(label) + '</div>';
      if (value) {
        h += '<div class="asm-sc-value' + (opts.multiline ? ' multiline' : '') + '">' + esc(value) + '</div>';
        if (opts.badge) h += '<div class="asm-sc-badge">' + opts.badge + '</div>';
      } else {
        h += '<div class="asm-sc-value empty">Not set</div>';
      }
      h += '</div>';
      return h;
    }

    function charCount(s, max) {
      var len = (s || '').length;
      var status = len > max ? ' (over)' : (len === 0 ? '' : '');
      return len + ' / ' + max + status;
    }

    function joinBits() {
      return Array.prototype.slice.call(arguments).filter(Boolean).join(', ');
    }

    function stripTagsAndTruncate(html, maxLen) {
      if (!html) return '';
      // Quick server-Webflow-safe tag strip
      var tmp = document.createElement('div');
      tmp.innerHTML = html;
      var txt = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
      if (txt.length > maxLen) txt = txt.substring(0, maxLen);
      return txt;
    }

    function esc(s) {
      if (s === null || s === undefined) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function buildMainImageUrl(a) {
      // Phase 1: use the URL as-is with no transformation.
      // The bound field 🟡 Main Image GET Link provides the bare URL.
      // Transformations (if ever needed) should be added via
      // TA_CONFIG.uploadcareTransforms and a named-transform argument.
      return a.mainImageSrc || '';
    }

    // ── Init ──
    renderAssembler();
    console.log('\u29BE Studio v1.1.3 mounted \u2014 Phase 2 Session 4 (live save via Scenario G, post-smoke UX fixes)');
  });

})();
