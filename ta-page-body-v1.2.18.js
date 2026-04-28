/* ============================================================
   ta-page-body-v1.2.18.js
   INBXIFY Title-Admin Page — Body Scripts
   Sections:
     1–4: Existing code (PubPlan Modal, URL Tab Controller,
          Hash Tab Activator, Customer Manager Button)
     5:   Screenshot Transcriber — multi-image tray + compression

   v1.2.18 (S13 Step 2 — Transcriber migration into Studio Tab 4):
     PHASE 4 / S13.

     Two functional changes + a TD-165 layout pre-prep.

     1. Dual-mount lookup (parallel-run safe).
        SECTION 5's mount lookup now prefers Studio's
        #std-transcriber-mount and falls back to UP's legacy
        #screenshot-transcriber-mount during the S13→S15 parallel
        run window. The first mount that exists wins; the chosen
        element receives the Transcriber HTML via mount.innerHTML
        as before.
        After UP decommission (S15), the legacy mount goes away
        and the Studio-hosted mount is the sole home for the
        Transcriber. Single source, no behavior split.

     2. Studio panel-event listener (std:panel:transcriber).
        When the user clicks Studio Tab 4 (Transcriber),
        ta-studio-v1.2.10+ dispatches a `std:panel:transcriber`
        CustomEvent on window. SECTION 5 listens for this and
        scrolls the mount into view + focuses the appropriate
        Step 1 affordance. Mount itself is already in the DOM
        (we boot-mount on DOMContentLoaded into whichever
        container exists), so the listener is purely for
        activation polish — no re-render, no re-init, no state
        loss when the user tabs away and back.

     3. TD-165 — "ready to save" affordance freed from Save Draft.
        The .sct-sub-bar review footer is restructured. Today,
        #sct-ready-msg sits inline next to the Save Draft button
        and shows either "✓ ready to save" or a comma-separated
        issues list ("title required · teaser required · body
        over 20,000 char limit") that mashes against the button.
        v1.2.18 splits these into two states:
          - Valid form: the inline #sct-ready-msg shows nothing
            (the gold Save Draft button color + enabled state is
            sufficient signal). The new banner row stays hidden.
          - Invalid form: the new banner row #sct-issues-banner
            renders ABOVE the .sct-sub-bar with a clear bulleted
            list of unmet requirements, gold left-border, cream
            fill. Save Draft button stays disabled.
        sctValidate() now drives both surfaces. Mechanically:
          - New <div id="sct-issues-banner" class="sct-issues
            sct-hidden"> sits above .sct-sub-bar inside
            .sct-results-body.
          - sctValidate() builds the issues array as today, then
            either populates the banner + reveals it (issues
            present) or hides it (form valid).
          - #sct-ready-msg retained for backwards compat but
            cleared (no longer the source of truth for issue
            display).

     4. TD-165 minimal stacked-div spacing pass (Q-K option a).
        Pure CSS work in title-admin-page-design-v1.4.10.css —
        no JS changes. This file delivers only the markup hook
        needed (#sct-issues-banner). Visual changes ship together
        with this file.

     No CMS schema changes. No Scenario changes. No RTE changes.
     ta-rte stays at v1.1.4. ta-studio stays at v1.2.10.

     Webflow head deploy:
       SWAP: ta-page-body-v1.2.17.js → ta-page-body-v1.2.18.js
       SWAP: title-admin-page-design-v1.4.9.css → v1.4.10.css

   v1.2.17 (S11.5b Wave 3 — TD-160 button system migration):
     Additive class migration for all Transcriber button emits.
     Every button now carries BOTH legacy class AND ix-btn ix-btn--*
     classes. The ix-buttons-v1.0.x.css module wins via specificity +
     !important + dual background-color/background-image armor.

     Migrated emits (11 sites):
       - sct-browse-btn × 2     → ix-btn ix-btn--secondary
       - sct-mode-opt (active)  → ix-btn ix-btn--pill
       - sct-mode-opt--disabled → ix-btn ix-btn--pill (native [disabled])
       - sct-cancel × 2 (start over, discard & retranscribe)
                                → ix-btn ix-btn--danger ix-btn--ghost (soft danger)
       - sct-tx-btn (Transcribe) → ix-btn ix-btn--primary ix-btn--lg
       - sct-save-btn (Save Draft) → ix-btn ix-btn--primary ix-btn--teal
       - sct-reset-btn × 2 (Transcribe Another, Close)
                                → ix-btn ix-btn--secondary
       - sct-lb-close (lightbox ✕)
                                → ix-btn ix-btn--ghost ix-btn--icon

     SCAFFOLDING REMOVED:
       The sct-btn-style-guard <style> tag injection at Transcriber
       boot (added in v1.2.15, expanded in v1.2.16) is GONE. It
       defined !important armor for sct-tx-btn, sct-save-btn, and
       sct-mode-opt--disabled. Now redundant — the ix-buttons module
       provides the same armor for the canonical variants on these
       same buttons via the new ix-btn ix-btn--* classes.

     Webflow head deploy:
       SWAP: ta-page-body-v1.2.16.js → ta-page-body-v1.2.17.js
       SWAP: ix-buttons-v1.0.0.css → ix-buttons-v1.0.1.css
         (v1.0.1 adds .active as activation pattern synonym for pills)

     The error message about InbxRTE not loaded was updated to
     reference v1.1.4 (Wave 2 ship) instead of v1.1.3.

   v1.2.16 (S11 — UX cleanup before Phase 3 close):
            "Add to Existing" mode hidden pending Phase 4 redesign.
            Replaced in the markup with a disabled "Save as Component"
            placeholder — visible but non-functional. Forget-me-not
            for TD-161 (Phase 4 / S13 implementation).
            The placeholder signals architectural intent without
            offering a half-working flow. Original "Add to Existing"
            markup retained as a comment for reference; will be
            deleted in TD-163 post-Phase 4 cleanup.
            Card subtitle updated from "New article or add to existing"
            to "Create a new article" to match the surface.
            Disabled state styling added to sct-btn-style-guard:
            opacity 0.45, transparent background, gray text,
            cursor: not-allowed. Same defensive !important pattern
            as the other Transcriber button rules.
            S.mode is locked to 'new' since no other mode is
            reachable; the existing-mode infrastructure (sct-ex-body,
            sct-replace-row, sctFilterArts, etc.) stays in place
            because sctUpdateUI's gates correctly hide it when
            S.mode !== 'existing' — no JS changes needed beyond the
            markup swap.

   v1.2.15 (S11 — Transcribe button fix moved to boot):
            v1.2.14's Transcribe button CSS patch was injected
            inside sctRteEnsure(), which only fires AFTER
            transcription completes. The Transcribe button is
            needed BEFORE transcription (it's what STARTS it),
            so the fix never applied — button stayed transparent.
            Fix moved to Transcriber boot where it lands the
            moment ta-page-body initializes.
            Also added .sct-save-btn defensive rules in the same
            boot-time style block, since it has the same
            vulnerability (no !important on background, will hit
            the same chrome cascade bug on the Save Draft button
            during review). Both buttons now armored from boot.
            New <style id="sct-btn-style-guard"> tag at boot,
            distinct from the existing sct-rte-style-guard which
            still scopes RTE-mount-related rules.

   v1.2.14 (S11 — post-test fixes; v1.2.13 skipped):
            Two issues surfaced during S11 testing of v1.2.12 before
            it shipped. Both fixed here. Same Phase 3 Part C scope —
            this is a re-ship of the v1.2.12 deliverable, not new
            functionality.

            Fix #1 — Body load timing race in sctPopulate.
            Original v1.2.12 called:
                sctRteEnsure().then(rte => rte.setContent(r.body))
            The polling loop in sctRteEnsure resolved as soon as
            inst.trixEditor existed, but Trix was still mid-reconcile
            from customizeToolbar() (called synchronously after the
            trixEditor assignment inside trix-initialize). loadHTML
            invoked during that window silently no-op'd, leaving the
            body editor empty even though teaser/short summary
            populated correctly.
            Fix: on first mount, pass r.body as initialHTML to
            InbxRTE.init(). Trix processes initialHTML synchronously
            inside its own trix-initialize handler — same microtask
            flush as editor creation, so the load lands. Subsequent
            populates (retranscribe → discard → retranscribe) use
            setContent because the editor is already stable.

            Fix #2 — Transcribe button (.sct-tx-btn) background lost
            to Webflow chrome cascade.
            Same root cause as .cmp-btn--primary (fixed in
            ta-studio-components v1.0.7) and .rte-img-upload-btn
            (fixed in ta-rte v1.1.3): a Webflow chrome update
            (~3 days before S11) shipped a stricter button reset
            that drops background on <button> elements without
            !important. .sct-tx-btn lives in
            title-admin-page-design-v1.4.6.css with
            background: linear-gradient(...) and no !important —
            same vulnerability.
            Fix: defensive !important rules injected from JS at
            mount time, scoped to button.sct-tx-btn. TD-159 logged
            for systemic audit + comprehensive design-CSS fix in
            future v1.4.7 bump.

   v1.2.12 (S11 — Phase 3 Part C — Transcriber RTE consolidation):
            REPLACES the legacy contenteditable + custom toolbar
            body editor with embedded InbxRTE (v1.1.3+).

            What changed in the body editor surface:
              - The hand-rolled .sct-toolbar markup (8 buttons +
                separators) and the #sct-f-body contenteditable
                <div> are GONE. Replaced by a single mount point
                <div id="sct-rte-mount"></div> that InbxRTE
                renders Trix into on Transcriber open.
              - InbxRTE is mounted with disableImages:true and
                hideFooter:true (new flags in RTE v1.1.3). The
                Transcriber is a text-only intake tool — body
                images are added separately via Studio. The
                Transcriber's own "Save Draft" button stays
                authoritative because it ships title + teaser +
                short summary alongside body to Scenario E.
              - sctFmt / sctFmtBlock / sctInsertLink (toolbar
                handlers) are deleted — Trix handles formatting
                via its own toolbar.
              - sctMarkRte deleted — Trix change events drive
                validation directly through the InbxRTE instance.
              - sctWordCount repointed to read from the RTE
                instance's getCleanHTML() output, with text
                extracted via temp DOM stripping. We keep our
                own #sct-word-count display rather than relying
                on the RTE's internal counter so visual layout
                doesn't shift.
              - sctApplyResults / sctValidate / sctDoSave /
                sctCancelResults / sctCancelAll repointed at the
                RTE instance via window._sctRteInstance.
              - sctValidate now enforces a 20,000-character cap
                on body content (warn at 18,000 — soft, hard
                block save at 20,000+). Mirrors the teaser/
                short-summary pattern. Char-count for body is
                sourced from the RTE's plain-text length, not
                HTML length.

            What did NOT change:
              - Scenario E save flow is unchanged. sctDoSave
                still fires the same URLSearchParams GET to
                CFG.makeUrl with the same payload keys. The
                v1.2.11 minifier still runs on body HTML
                (Webflow CMS <li> whitespace bug fix).
              - The screenshot tray, paste-card paste handler,
                Claude transcription pipeline, mode/replaceMode
                state, all unchanged.
              - All other sections (PubPlan modal, URL tabs,
                hash tabs, Customer Manager button) untouched.

            Embedded mode style: a one-rule <style> tag is
            injected at mount time to scope-hide any RTE
            internal save row (defense-in-depth — RTE v1.1.3's
            hideFooter:true should suppress markup, but the
            CSS guard defangs older RTE versions if cached).

            Phase 3 closes when this ships. After v1.2.12:
              - One editor component (InbxRTE) used by Studio
                fullscreen + Transcriber embedded.
              - One canonical body storage path (Article.post-
                body, dual-written to MEDIA.html-content for
                Studio Mode 1).
              - Transcriber-uploaded source images remain
                ephemeral (never become MEDIA rows). Body
                images are out of scope for Transcriber.

            Dead CSS in title-admin-page-design-v1.4.6.css for
            .sct-rte / #sct-f-body / .sct-toolbar / .sct-tb-btn
            is intentionally NOT removed in this release —
            scheduled for a follow-on CSS cleanup pass to avoid
            coupling layout reflow risk to a JS-only deploy.

   v1.2.11: Minify body HTML before sending to Make/Webflow.
            Webflow CMS API strips <li> content when HTML contains
            newlines between tags (known Webflow bug). Fix: collapse
            whitespace between tags so <ul>/<ol>/<li> survive.
   v1.2.10: Fixed pre-existing bug where the Replace/Append radio's
            inline onchange handler referenced the block-scoped `S`
            object, which isn't visible to inline HTML handlers
            (they run in global scope). Click handler now routes
            through window.sctSetReplaceMode() instead. This bug
            was latent because Append path never worked end-to-end
            in Make until Scenario E was extended to three routes —
            Append radio clicks had been silently no-op'd and
            S.replaceMode stayed locked at 'replace'.
   v1.2.9: RESTORED article search in Transcriber "Add to Existing"
           mode. Previous version had sctFilterArts() stubbed with
           "Article search requires CMS connection — use New Article
           for now" — but the articles array from the hidden DOM
           collection was already loaded and ready to use at line
           149. Search now filters the loaded array, renders
           clickable match rows, and wires selection back into
           state. No Make call or new infrastructure needed — the
           data was always there, the function was just unplugged.
   v1.2.8: paste card subtitle updated — "(accepts images only)"
   v1.2: stronger prompt — teaser targets 350–400 chars,
         summary targets 120–150 chars
         auto-sectionalize — Claude inserts H2s if none present
         generated H2s marked with class="sct-generated" (red)
         lean RTE toolbar — Bold, Italic, H2, Link,
         UL, OL, Indent, Outdent  [retired in v1.2.12 — Trix toolbar replaces]
   v1.1: image compression (canvas/JPEG, max 1800px, 85% quality)
         multi-image tray (additive pastes, numbered, removable,
         reorderable, all sent to Claude in one API call)
   ============================================================ */

// ============================================================
// SECTION 1: PUBPLAN MODAL — V4.0
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 PubPlan Modal V4.0 Loaded");

  const modalWrapper = document.querySelector("#pubplan-modal");
  if (!modalWrapper) { console.error("❌ #pubplan-modal missing"); return; }

  const modalPanel = modalWrapper.querySelector(".pubplan-modal-panel");
  if (!modalPanel) { console.error("❌ .pubplan-modal-panel missing"); return; }

  const modalHeaderTitle     = modalPanel.querySelector(".modal-header-title");
  const modalHeaderSubtitle  = modalPanel.querySelector(".modal-header-subtitle");
  const modalCatGroupDisplay = modalPanel.querySelector(".modal-cat-group-display");
  const modalCatLabelDisplay = modalPanel.querySelector(".modal-cat-label-display");
  const modalSlotNumberValue = modalPanel.querySelector(".modal-slot-number-value");
  const modalCustomerDisplay = modalPanel.querySelector(".modal-customer");
  const modalArticleDisplay  = modalPanel.querySelector(".modal-content-label");
  const changeCustomerLink   = modalPanel.querySelector(".change-customer");
  const changeContentLink    = modalPanel.querySelector(".change-content");
  const sectionCategory      = modalPanel.querySelector(".modal-section-category");
  const sectionCustomer      = modalPanel.querySelector(".modal-section-customer");
  const sectionArticle       = modalPanel.querySelector(".modal-section-article");
  const formBlock            = modalPanel.querySelector(".form-block-359");
  const msgNoCat             = modalPanel.querySelector(".message-no-category");
  const selectCategory       = modalPanel.querySelector("#select-category");
  const selectCustomer       = modalPanel.querySelector("#select-customer");
  const selectArticle        = modalPanel.querySelector("#select-article");
  const hfCategoryID         = modalPanel.querySelector("#hidden-category-id");
  const hfCategoryLabel      = modalPanel.querySelector("#hidden-category-label");
  const hfCategoryGroup      = modalPanel.querySelector("#hidden-category-group");
  const hfCustomerID         = modalPanel.querySelector("#hidden-customer-id");
  const hfCustomerName       = modalPanel.querySelector("#hidden-customer-name");
  const hfCustomerPaidAdUrl  = modalPanel.querySelector("#hidden-customer-paid-ad-url");
  const hfArticleID          = modalPanel.querySelector("#hidden-article-id");
  const hfArticleTitle       = modalPanel.querySelector("#hidden-article-title");
  const hfSlotCode           = modalPanel.querySelector("#hidden-slot-code");
  const hfSlotLabel          = modalPanel.querySelector("#hidden-slot-label");
  const hfPubPlanID          = modalPanel.querySelector("#hidden-pubplan-id");
  const hfPubPlanName        = modalPanel.querySelector("#hidden-pubplan-name");
  const hfTitleAdminID       = modalPanel.querySelector("#hidden-titleadmin-id");
  const hfTitleAdminName     = modalPanel.querySelector("#hidden-titleadmin-name");
  const hfBaPickerId         = modalPanel.querySelector("#hidden-ba-picker-id");
  const closeBtn             = modalWrapper.querySelector(".close-x-out");
  const form                 = modalPanel.querySelector("form");
  const submitBtn            = modalPanel.querySelector("button[type='submit'], input[type='submit']");
  const EMPTY_LABEL          = "<not assigned>";

  function setSubmitLoading(isLoading) {
    if (!submitBtn) return;
    let overlay = submitBtn.parentElement.querySelector(".submit-overlay");
    if (isLoading) {
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "submit-overlay";
        overlay.style.cssText = "position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;font-size:14px;color:#666;border-radius:inherit;pointer-events:auto;cursor:not-allowed;";
        overlay.textContent = "Verifying...";
        submitBtn.parentElement.style.position = "relative";
        submitBtn.parentElement.appendChild(overlay);
      }
      overlay.style.display = "flex";
    } else {
      if (overlay) overlay.style.display = "none";
    }
  }

  let turnstileChecker = null;
  function triggerTurnstileLoading() {
    setSubmitLoading(true);
    if (turnstileChecker) clearInterval(turnstileChecker);
    let elapsed = 0;
    turnstileChecker = setInterval(() => {
      elapsed += 200;
      const tf = document.querySelector('input[name="cf-turnstile-response"]');
      if (tf && tf.value) { clearInterval(turnstileChecker); turnstileChecker = null; setSubmitLoading(false); return; }
      if (elapsed >= 8000) { clearInterval(turnstileChecker); turnstileChecker = null; setSubmitLoading(false); }
    }, 200);
  }

  const SINGLE_PRODUCT_SECTIONS = { "ba":"Banner Ads","sb":"Sidebar Ads","re":"Real Estate Listings","ev":"Events Calendar" };

  let currentSectionCode = "", currentSlotCode = "", currentCategoryId = "", currentCustomerId = "", currentCustomerRequired = true;
  let snapshot = null;

  function takeSnapshot() {
    snapshot = {
      categoryId: hfCategoryID?.value||"", categoryLabel: hfCategoryLabel?.value||"",
      categoryGroup: hfCategoryGroup?.value||"", customerId: hfCustomerID?.value||"",
      customerName: hfCustomerName?.value||"", customerPaidAdUrl: hfCustomerPaidAdUrl?.value||"",
      articleId: hfArticleID?.value||"", articleTitle: hfArticleTitle?.value||"",
      slotCode: hfSlotCode?.value||"", slotLabel: hfSlotLabel?.value||"",
      pubplanId: hfPubPlanID?.value||"", pubplanName: hfPubPlanName?.value||"",
      titleAdminId: hfTitleAdminID?.value||"", titleAdminName: hfTitleAdminName?.value||"",
      baPickerId: hfBaPickerId?.value||""
    };
  }

  function restoreSnapshot() {
    if (!snapshot) return;
    if (hfCategoryID)        hfCategoryID.value        = snapshot.categoryId;
    if (hfCategoryLabel)     hfCategoryLabel.value     = snapshot.categoryLabel;
    if (hfCategoryGroup)     hfCategoryGroup.value     = snapshot.categoryGroup;
    if (hfCustomerID)        hfCustomerID.value        = snapshot.customerId;
    if (hfCustomerName)      hfCustomerName.value      = snapshot.customerName;
    if (hfCustomerPaidAdUrl) hfCustomerPaidAdUrl.value = snapshot.customerPaidAdUrl;
    if (hfArticleID)         hfArticleID.value         = snapshot.articleId;
    if (hfArticleTitle)      hfArticleTitle.value      = snapshot.articleTitle;
    if (hfSlotCode)          hfSlotCode.value          = snapshot.slotCode;
    if (hfSlotLabel)         hfSlotLabel.value         = snapshot.slotLabel;
    if (hfPubPlanID)         hfPubPlanID.value         = snapshot.pubplanId;
    if (hfPubPlanName)       hfPubPlanName.value       = snapshot.pubplanName;
    if (hfTitleAdminID)      hfTitleAdminID.value      = snapshot.titleAdminId;
    if (hfTitleAdminName)    hfTitleAdminName.value    = snapshot.titleAdminName;
    if (hfBaPickerId)        hfBaPickerId.value        = snapshot.baPickerId;
  }

  const getData = (el, key) => el.getAttribute(`data-${key}`) || el.dataset[key] || "";

  const products = Array.from(document.querySelectorAll("[data-products-wrapper] [data-item]")).map(el => ({
    id: getData(el,"id"), name: getData(el,"name"), label: getData(el,"label"),
    group: getData(el,"group"), type: getData(el,"type"),
    customerRequired: !(el.querySelector('[data-customer-not-required="true"]') && getComputedStyle(el.querySelector('[data-customer-not-required="true"]')).display !== 'none')
  }));

  const customers = Array.from(document.querySelectorAll("[data-customers-wrapper] [data-item]")).map(el => ({
    id: getData(el,"id"), name: getData(el,"name"), paidAdUrl: getData(el,"paid-ad-url")
  }));

  const articles = Array.from(document.querySelectorAll("[data-articles-wrapper] [data-item]")).map(el => ({
    id: getData(el,"article-id")||getData(el,"id"), name: getData(el,"article-title")||getData(el,"name"),
    group: getData(el,"group"), type: getData(el,"type"),
    customerId: getData(el,"article-customer-id")||getData(el,"customer-id"), categoryId: getData(el,"category-id")
  }));

  const ads = Array.from(document.querySelectorAll("[data-ads-wrapper] [data-item]")).map(el => ({
    id: getData(el,"ad-id"), name: getData(el,"ad-title")||getData(el,"label"),
    group: getData(el,"group"), type: getData(el,"type"),
    customerId: getData(el,"ad-customer-id"), categoryId: getData(el,"category-id")
  }));

  const reItems = Array.from(document.querySelectorAll("[data-re-wrapper] [data-item]")).map(el => ({
    id: getData(el,"re-id")||getData(el,"id"), name: getData(el,"re-title")||getData(el,"name"),
    group: getData(el,"group")||"Real Estate",
    customerId: getData(el,"re-customer-id")||getData(el,"customer-id")||"", categoryId: getData(el,"category-id")
  }));

  const evItems = Array.from(document.querySelectorAll("[data-events-wrapper] [data-item]")).map(el => ({
    id: getData(el,"event-id")||getData(el,"id"), name: getData(el,"event-title")||getData(el,"name"),
    group: getData(el,"group")||"Events",
    customerId: getData(el,"event-customer-id")||getData(el,"customer-id")||"", categoryId: getData(el,"category-id")
  }));

  const resetSelect = (sel, placeholder) => {
    if (!sel) return;
    sel.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = ""; opt.textContent = placeholder;
    sel.appendChild(opt);
  };

  function populateCategorySelect(sectionName, currentCatId) {
    if (!selectCategory) return;
    resetSelect(selectCategory, "Select category");
    products.filter(p => !sectionName || p.group === sectionName).forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id; opt.textContent = p.label || p.name; opt.dataset.group = p.group || "";
      selectCategory.appendChild(opt);
    });
    if (currentCatId) selectCategory.value = currentCatId;
  }

  function populateCustomerSelect() {
    if (!selectCustomer) return;
    resetSelect(selectCustomer, "Select customer");
    customers.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id; opt.textContent = c.name;
      selectCustomer.appendChild(opt);
    });
    selectCustomer.value = "";
  }

  function populateContentSelect(sc, categoryId, customerId, currentContentId) {
    if (!selectArticle) return;
    resetSelect(selectArticle, "Select content");
    let items = sc==="fa"||sc==="ts" ? articles : sc==="tf"||sc==="ba"||sc==="sb" ? ads : sc==="re" ? reItems : sc==="ev" ? evItems : [];
    let assignedItem = currentContentId ? items.find(it => it.id === currentContentId) || null : null;
    const filtered = items.filter(it => {
      if (assignedItem && it.id === assignedItem.id) return true;
      if (categoryId && it.categoryId && it.categoryId !== categoryId) return false;
      if (currentCustomerRequired && customerId && it.customerId && it.customerId !== customerId) return false;
      return true;
    });
    filtered.forEach(it => {
      const opt = document.createElement("option");
      opt.value = it.id; opt.textContent = it.name || "(no name)";
      selectArticle.appendChild(opt);
    });
    if (currentContentId) selectArticle.value = currentContentId;
  }

  function applyVisibility() {
    const sc = currentSectionCode.toLowerCase();
    const isCatSlot = currentSlotCode.toLowerCase().includes("-cat");
    const hasCategory = !!(hfCategoryID && hfCategoryID.value);
    const hasCustomer = !!(hfCustomerID && hfCustomerID.value);
    const hasContent  = !!(hfArticleID && hfArticleID.value);

    if (sectionCategory) sectionCategory.style.display = "none";
    if (sectionCustomer) sectionCustomer.style.display = "none";
    if (sectionArticle)  sectionArticle.style.display  = "none";
    if (selectCategory)  selectCategory.style.display  = "none";
    if (selectCustomer)  selectCustomer.style.display  = "none";
    if (selectArticle)   selectArticle.style.display   = "none";
    if (changeCustomerLink) changeCustomerLink.style.display = "none";
    if (changeContentLink)  changeContentLink.style.display  = "none";
    if (msgNoCat)  msgNoCat.style.display  = "none";
    if (formBlock) formBlock.style.display = "block";

    if (isCatSlot && (sc==="fa"||sc==="ts"||sc==="tf")) {
      if (sectionCategory) sectionCategory.style.display = "flex";
      if (selectCategory)  selectCategory.style.display  = "flex";
      return;
    }

    if ((sc==="fa"||sc==="ts") && !isCatSlot) {
      if (!hasCategory) {
        if (sectionCategory) sectionCategory.style.display = "flex";
        if (formBlock) formBlock.style.display = "none";
        if (msgNoCat)  msgNoCat.style.display  = "flex";
        return;
      }
      if (currentCustomerRequired) {
        if (hasCustomer && hasContent) {
          if (sectionCustomer) sectionCustomer.style.display = "flex";
          if (sectionArticle)  sectionArticle.style.display  = "flex";
          if (changeCustomerLink) changeCustomerLink.style.display = "inline-block";
          if (changeContentLink)  changeContentLink.style.display  = "inline-block";
          if (formBlock) formBlock.style.display = "none";
        } else if (hasCustomer) {
          if (sectionCustomer) sectionCustomer.style.display = "flex";
          if (changeCustomerLink) changeCustomerLink.style.display = "inline-block";
          if (sectionArticle) sectionArticle.style.display = "flex";
          if (selectArticle)  selectArticle.style.display  = "flex";
        } else {
          if (sectionCustomer) sectionCustomer.style.display = "flex";
          if (selectCustomer)  selectCustomer.style.display  = "flex";
        }
      } else {
        if (hasContent) {
          if (sectionArticle) sectionArticle.style.display = "flex";
          if (changeContentLink) changeContentLink.style.display = "inline-block";
          if (formBlock) formBlock.style.display = "none";
        } else {
          if (sectionArticle) sectionArticle.style.display = "flex";
          if (selectArticle)  selectArticle.style.display  = "flex";
        }
      }
      return;
    }

    if (sc==="tf"||sc==="ba"||sc==="sb") {
      if (currentCustomerRequired) {
        if (hasCustomer && hasContent) {
          if (sectionCustomer) sectionCustomer.style.display = "flex";
          if (sectionArticle)  sectionArticle.style.display  = "flex";
          if (changeCustomerLink) changeCustomerLink.style.display = "inline-block";
          if (changeContentLink)  changeContentLink.style.display  = "inline-block";
          if (formBlock) formBlock.style.display = "none";
        } else if (hasCustomer) {
          if (sectionCustomer) sectionCustomer.style.display = "flex";
          if (changeCustomerLink) changeCustomerLink.style.display = "inline-block";
          if (sectionArticle) sectionArticle.style.display = "flex";
          if (selectArticle)  selectArticle.style.display  = "flex";
        } else {
          if (sectionCustomer) sectionCustomer.style.display = "flex";
          if (selectCustomer)  selectCustomer.style.display  = "flex";
        }
      } else {
        if (hasContent) {
          if (sectionArticle) sectionArticle.style.display = "flex";
          if (changeContentLink) changeContentLink.style.display = "inline-block";
          if (formBlock) formBlock.style.display = "none";
        } else {
          if (sectionArticle) sectionArticle.style.display = "flex";
          if (selectArticle)  selectArticle.style.display  = "flex";
        }
      }
      return;
    }

    if (sc==="re"||sc==="ev") {
      if (hasContent) {
        if (sectionArticle) sectionArticle.style.display = "flex";
        if (changeContentLink) changeContentLink.style.display = "inline-block";
        if (formBlock) formBlock.style.display = "none";
      } else {
        if (sectionArticle) sectionArticle.style.display = "flex";
        if (selectArticle)  selectArticle.style.display  = "flex";
      }
    }
  }

  document.querySelectorAll(".pubplan-slot-wrapper").forEach(slot => {
    slot.addEventListener("click", e => {
      const d = e.currentTarget;
      const slotCode     = d.getAttribute("data-slot-code")       || "";
      const sectionCode  = d.getAttribute("data-section-code")    || "";
      const sectionName  = d.getAttribute("data-section")         || "";
      const pubplanId    = d.getAttribute("data-pubplan-id")      || "";
      const pubplanName  = d.getAttribute("data-pubplan-name")    || "";
      const pubplanDate  = d.getAttribute("data-pubplan-date")    || "";
      const titleAdminId = d.getAttribute("data-titleadmin-id")   || "";
      const titleAdminName = d.getAttribute("data-titleadmin-name") || "";
      const presetCatId    = d.getAttribute("data-cat-id")        || "";
      const presetCatLabel = d.getAttribute("data-cat-label")     || "";
      const presetCustomerId   = d.getAttribute("data-customer-id")   || "";
      const presetCustomerName = d.getAttribute("data-customer-name") || "";
      const presetContentId = d.getAttribute("data-article-id")||d.getAttribute("data-ad-id")||d.getAttribute("data-re-id")||d.getAttribute("data-event-id")||"";
      const presetContentTitle = d.getAttribute("data-article-title")||d.getAttribute("data-ad-title")||d.getAttribute("data-re-title")||d.getAttribute("data-event-title")||"";

      currentSectionCode = sectionCode;
      currentSlotCode    = slotCode;
      currentCustomerId  = presetCustomerId;

      const sc        = sectionCode.toLowerCase();
      const isCatSlot = slotCode.toLowerCase().includes("-cat");
      const slotLabel = slotCode.toUpperCase().replace(/-CAT$/, "");
      let slotNum = "";
      if (slotCode && slotCode.includes("-")) { const p = slotCode.split("-"); const l = p[p.length-1]; if (!isNaN(parseInt(l,10))) slotNum = l; }

      let categoryId = presetCatId, categoryLabel = presetCatLabel, categoryGroup = sectionName;

      if (SINGLE_PRODUCT_SECTIONS[sc]) {
        const product = products.find(p => p.group === SINGLE_PRODUCT_SECTIONS[sc]);
        if (product) { categoryId = product.id; categoryLabel = product.label||product.name; categoryGroup = product.group; currentCustomerRequired = product.customerRequired; }
        else currentCustomerRequired = true;
      } else {
        if (categoryId) { const product = products.find(p => p.id === categoryId); currentCustomerRequired = product ? product.customerRequired : true; }
        else currentCustomerRequired = true;
      }

      currentCategoryId = categoryId;

      if (sc === "ba") {
        const baSlotNum = parseInt(slotCode.replace(/\D/g,""), 10);
        if (hfBaPickerId) hfBaPickerId.value = baSlotNum <= 6 ? "ba-picker-1" : "ba-picker-2";
      } else {
        if (hfBaPickerId) hfBaPickerId.value = "";
      }

      if (modalHeaderTitle)     modalHeaderTitle.textContent     = pubplanName || "";
      if (modalHeaderSubtitle)  modalHeaderSubtitle.textContent  = pubplanDate || "";
      if (modalCatGroupDisplay) modalCatGroupDisplay.textContent = sectionName || "—";
      if (modalCatLabelDisplay) modalCatLabelDisplay.textContent = categoryLabel || EMPTY_LABEL;
      if (modalSlotNumberValue) modalSlotNumberValue.textContent = slotNum || "—";
      if (modalCustomerDisplay) modalCustomerDisplay.textContent = presetCustomerName || EMPTY_LABEL;
      if (modalArticleDisplay) { let t = presetContentTitle||EMPTY_LABEL; if (t.length>25) t=t.substring(0,25)+"…"; modalArticleDisplay.textContent = t; }

      if (hfSlotCode)       hfSlotCode.value       = slotCode;
      if (hfSlotLabel)      hfSlotLabel.value      = slotLabel;
      if (hfPubPlanID)      hfPubPlanID.value      = pubplanId;
      if (hfPubPlanName)    hfPubPlanName.value    = pubplanName;
      if (hfTitleAdminID)   hfTitleAdminID.value   = titleAdminId;
      if (hfTitleAdminName) hfTitleAdminName.value = titleAdminName;
      if (hfCategoryID)     hfCategoryID.value     = categoryId;
      if (hfCategoryLabel)  hfCategoryLabel.value  = categoryLabel;
      if (hfCategoryGroup)  hfCategoryGroup.value  = categoryGroup;
      if (hfCustomerID)     hfCustomerID.value     = presetCustomerId;
      if (hfCustomerName)   hfCustomerName.value   = presetCustomerName;
      if (hfCustomerPaidAdUrl) { const c = customers.find(c => c.id===presetCustomerId); hfCustomerPaidAdUrl.value = c?.paidAdUrl||""; }
      if (hfArticleID)      hfArticleID.value      = presetContentId;
      if (hfArticleTitle)   hfArticleTitle.value   = presetContentTitle;

      takeSnapshot();

      if (isCatSlot && (sc==="fa"||sc==="ts"||sc==="tf")) populateCategorySelect(sectionName, categoryId);
      if (!isCatSlot && currentCustomerRequired && (sc==="fa"||sc==="ts"||sc==="tf"||sc==="ba"||sc==="sb")) {
        populateCustomerSelect();
        if (presetCustomerId) selectCustomer.value = presetCustomerId;
      }
      if (!isCatSlot) populateContentSelect(sc, currentCategoryId, currentCustomerRequired ? presetCustomerId : "", presetContentId);

      applyVisibility();
      modalWrapper.style.display = "flex";
      requestAnimationFrame(() => modalWrapper.classList.add("is-active"));
    });
  });

  if (selectCategory) selectCategory.addEventListener("change", () => {
    triggerTurnstileLoading();
    const opt = selectCategory.selectedOptions[0];
    const value = opt?.value||"";
    const prod = products.find(p => p.id===value);
    if (hfCategoryID)    hfCategoryID.value    = value;
    if (hfCategoryLabel) hfCategoryLabel.value = prod?.label||prod?.name||"";
    if (hfCategoryGroup) hfCategoryGroup.value = prod?.group||"";
    currentCustomerRequired = prod ? prod.customerRequired : true;
    currentCategoryId = value;
  });

  if (selectCustomer) selectCustomer.addEventListener("change", () => {
    triggerTurnstileLoading();
    const opt = selectCustomer.selectedOptions[0];
    const value = opt?.value||"", name = opt?.textContent||"";
    const customer = customers.find(c => c.id===value);
    if (hfCustomerID)        hfCustomerID.value        = value;
    if (hfCustomerName)      hfCustomerName.value      = name;
    if (hfCustomerPaidAdUrl) hfCustomerPaidAdUrl.value = customer?.paidAdUrl||"";
    currentCustomerId = value;
  });

  if (selectArticle) selectArticle.addEventListener("change", () => {
    triggerTurnstileLoading();
    const opt = selectArticle.selectedOptions[0];
    if (hfArticleID)    hfArticleID.value    = opt?.value||"";
    if (hfArticleTitle) hfArticleTitle.value = opt?.textContent||"";
  });

  if (changeCustomerLink) changeCustomerLink.addEventListener("click", e => {
    e.preventDefault();
    if (hfArticleID?.value && !confirm("Changing customer will clear the current content selection. Continue?")) return;
    if (hfCustomerID)        hfCustomerID.value        = "";
    if (hfCustomerName)      hfCustomerName.value      = "";
    if (hfCustomerPaidAdUrl) hfCustomerPaidAdUrl.value = "";
    if (hfArticleID)         hfArticleID.value         = "";
    if (hfArticleTitle)      hfArticleTitle.value      = "";
    currentCustomerId = "";
    populateCustomerSelect();
    resetSelect(selectArticle, "Select content");
    applyVisibility();
  });

  if (changeContentLink) changeContentLink.addEventListener("click", e => {
    e.preventDefault();
    if (hfArticleID)    hfArticleID.value    = "";
    if (hfArticleTitle) hfArticleTitle.value = "";
    populateContentSelect(currentSectionCode.toLowerCase(), currentCategoryId, currentCustomerRequired ? currentCustomerId : "", "");
    applyVisibility();
  });

  if (form) form.addEventListener("submit", () => {
    console.log("🚀 Form submitted", { slotCode: hfSlotCode?.value, baPickerId: hfBaPickerId?.value, category: hfCategoryID?.value, customer: hfCustomerID?.value, content: hfArticleID?.value });
  });

  function closeModal() {
    restoreSnapshot();
    if (turnstileChecker) { clearInterval(turnstileChecker); turnstileChecker = null; }
    setSubmitLoading(false);
    modalWrapper.classList.remove("is-active");
    setTimeout(() => { modalWrapper.style.display = "none"; }, 200);
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modalWrapper.addEventListener("click", e => { if (e.target === modalWrapper) closeModal(); });
});

// ============================================================
// SECTION 2: URL TAB & SCROLL CONTROLLER
// ============================================================
window.addEventListener('load', function() {
  setTimeout(function() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(window.location.search);
    if (hash) { const tabLink = document.querySelector('[data-w-tab="' + hash + '"]'); if (tabLink) tabLink.click(); }
    const scrollTarget = params.get('scrollto');
    if (scrollTarget) { setTimeout(function() { const el = document.getElementById(scrollTarget); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 100); }
  }, 100);
});

// ============================================================
// SECTION 3: HASH-BASED TAB ACTIVATOR
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash.replace("#", "");
  if (!hash) return;
  const tab = document.querySelector(`[data-tab="${hash}"]`);
  if (tab) tab.click();
});

// ============================================================
// SECTION 4: CUSTOMER MANAGER BUTTON — DYNAMIC URL
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  const publisherId = document.querySelector('[data-publisher-id]')?.dataset.publisherId;
  const btn = document.getElementById('customer-manager-btn');
  if (btn && publisherId) btn.href = '/customer-manager?publisher=' + publisherId;
});

document.addEventListener('DOMContentLoaded', function() {
  const params = new URLSearchParams(window.location.search);
  const scrollTarget = params.get('scrollto');
  if (scrollTarget) {
    setTimeout(function() {
      const target = document.getElementById(scrollTarget);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }, 400);
  }
});

document.addEventListener("DOMContentLoaded", function() {
  const addPubplanBtn = document.querySelector("[data-titleadmin-id]");
  if (!addPubplanBtn) return;
  addPubplanBtn.addEventListener("click", function(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("ta", this.dataset.titleadminId);
    params.set("name", this.dataset.titleadminName);
    params.set("short", this.dataset.titleadminShort);
    params.set("pub", this.dataset.publisherId);
    window.location.href = "/workspaces/build-a-pub-plan?" + params.toString();
  });
});


// ============================================================
// SECTION 5: SCREENSHOT TRANSCRIBER v1.1
// - Multi-image tray: additive pastes, numbered, removable
// - Canvas compression: max 1800px, JPEG 85% — stays under 5MB
// - All images sent to Claude in one API call (in tray order)
//
// Mount targets (v1.2.18 — dual-mount, parallel-run safe):
//   PRIMARY:  #std-transcriber-mount     (inside Studio Tab 4)
//   FALLBACK: #screenshot-transcriber-mount (legacy UP shell)
// First mount that exists wins. After UP decommission (S15),
// only the Studio-hosted mount remains.
//
// Config from window.TA_CONFIG (set in Webflow page head)
// ============================================================
document.addEventListener("DOMContentLoaded", function() {
  // v1.2.18: dual-mount lookup. Prefer Studio's Tab 4 mount,
  // fall back to UP's legacy shell mount during parallel run.
  const mount = document.getElementById('std-transcriber-mount')
             || document.getElementById('screenshot-transcriber-mount');
  if (!mount) return;

  // v1.2.18: track which mount we landed in so the panel-event
  // listener and any future cleanup can branch on host.
  const _mountHost = (mount.id === 'std-transcriber-mount') ? 'studio' : 'legacy';

  const CFG = {
    get proxyUrl()  { return window.TA_CONFIG?.anthropicProxy  || null; },
    get makeUrl()   { return window.TA_CONFIG?.makeTranscriber || ''; },
    get titleSlug() { return window.TA_CONFIG?.titleSlug || document.querySelector('[data-ta-slug]')?.dataset.taSlug || ''; },
    get taItemId()  { return window.TA_CONFIG?.taItemId  || document.querySelector('#title-admin-id')?.dataset.taId || ''; },
    get titleId()   { return window.TA_CONFIG?.titleId   || ''; },
  };

  // ── State ──
  // images: array of { id, base64, mime, dataUrl, label }
  let S = {
    images: [],
    mode: 'new', existingArticleId: null, existingArticleName: null,
    replaceMode: 'replace', resultsReady: false, processing: false,
    dragSrcIdx: null,
  };

  // ── Inject HTML ──
  mount.innerHTML = `
<div class="sct-root">
  <div class="sct-hdr">
    <div class="sct-hdr-left">
      <div class="sct-hdr-icon">📷</div>
      <div><h3>Screenshot Transcriber</h3><div class="sct-hdr-sub">Paste screenshots → Claude transcribes → Draft article created</div></div>
    </div>
    <span class="sct-badge">v1.2</span>
  </div>

  <div class="sct-steps">
    <span class="sct-step active" id="sct-s1"><span class="sct-step-dot"></span>1 Paste</span>
    <span class="sct-step-arr">→</span>
    <span class="sct-step" id="sct-s2"><span class="sct-step-dot"></span>2 Assign</span>
    <span class="sct-step-arr">→</span>
    <span class="sct-step" id="sct-s3"><span class="sct-step-dot"></span>3 Transcribe</span>
    <span class="sct-step-arr">→</span>
    <span class="sct-step" id="sct-s4"><span class="sct-step-dot"></span>4 Review</span>
    <span class="sct-step-arr">→</span>
    <span class="sct-step" id="sct-s5"><span class="sct-step-dot"></span>5 Success</span>
  </div>

  <!-- PASTE CARD -->
  <div class="sct-card" id="sct-paste-card">
    <div class="sct-card-bar"></div>
    <div class="sct-card-body">
      <div class="sct-card-title">Paste Screenshots</div>
      <div class="sct-card-sub" id="sct-paste-sub">Step 1 — Accepts images only · Cmd+V / Ctrl+V or Browse</div>

      <!-- Tray — shown once at least one image is added -->
      <div id="sct-tray" class="sct-hidden">
        <div class="sct-tray-grid" id="sct-tray-grid"></div>
        <div class="sct-tray-footer">
          <span class="sct-tray-hint">Drag to reorder · Click ✕ to remove</span>
          <button class="sct-browse-btn ix-btn ix-btn--secondary" onclick="document.getElementById('sct-file-input').click()">+ Add image</button>
        </div>
      </div>

      <!-- Drop zone — shown when tray is empty -->
      <div class="sct-paste-zone" id="sct-pz">
        <div class="sct-pz-icon">⌘V</div>
        <div class="sct-pz-label">Press Cmd+V / Ctrl+V anywhere to paste</div>
        <div class="sct-pz-hint">Mac: Cmd+Shift+4 · Windows: Snipping Tool · Images only · Paste again to add more pages</div>
        <div class="sct-pz-or">— or —</div>
        <button class="sct-browse-btn ix-btn ix-btn--secondary" onclick="document.getElementById('sct-file-input').click()">Browse image file</button>
      </div>

      <input type="file" id="sct-file-input" accept="image/*" style="display:none" onchange="sctHandleFile(this.files[0]);this.value=''">
    </div>
  </div>

  <!-- ASSIGN CARD -->
  <div class="sct-card sct-hidden" id="sct-assign-card">
    <div class="sct-card-bar"></div>
    <div class="sct-card-body">
      <div class="sct-card-title">Assign Article</div>
      <div class="sct-card-sub">Step 2 — Create a new article</div>
      <div class="sct-mode-toggle">
        <button class="sct-mode-opt active ix-btn ix-btn--pill" id="sct-mode-new" onclick="sctSetMode('new')">New Article</button>
        <!-- v1.2.16: "Add to Existing" hidden pending Phase 4 redesign.
             "Save as Component" placeholder is intentionally non-functional —
               the working implementation arrives with TD-161 in Phase 4 / S13.
               When implementing: this button will open InbxRTE for editing,
               require a meaningful title (TD-161 design — likely AI-suggested),
               and create a MEDIA row (Text / Article Body HTML / Available).
             Original "Add to Existing" markup preserved below for reference,
               commented out. Delete in TD-163 post-Phase 4 cleanup. -->
        <button class="sct-mode-opt sct-mode-opt--disabled ix-btn ix-btn--pill" id="sct-mode-comp"
                disabled
                title="Coming in Phase 4 — save transcribed text as a reusable component">Save as Component</button>
        <!-- <button class="sct-mode-opt" id="sct-mode-ex" onclick="sctSetMode('existing')">Add to Existing</button> -->
      </div>
      <div id="sct-new-body">
        <div class="sct-notice-box">A new draft article will be created in Webflow CMS. Review all fields before saving.</div>
      </div>
      <div id="sct-ex-body" class="sct-hidden">
        <label class="sct-fl">Find Existing Article</label>
        <input class="sct-finp" id="sct-art-search" type="text" placeholder="Search by title…" oninput="sctFilterArts(this.value)" style="margin-bottom:4px">
        <div class="sct-article-results sct-hidden" id="sct-art-results"></div>
        <div class="sct-replace-row sct-hidden" id="sct-replace-row">
          <span style="font-family:'DM Mono',monospace;font-size:10px;color:#8a8a7a;margin-right:4px">Body:</span>
          <label><input type="radio" name="sct-replace" value="replace" checked onchange="sctSetReplaceMode(this.value)"> Replace existing</label>
          <label><input type="radio" name="sct-replace" value="append" onchange="sctSetReplaceMode(this.value)"> Append to existing</label>
        </div>
      </div>
      <button class="sct-cancel ix-btn ix-btn--danger ix-btn--ghost" style="margin-top:8px" onclick="sctCancelAll()">✕ start over</button>
    </div>
  </div>

  <!-- TRANSCRIBE BUTTON -->
  <button class="sct-tx-btn sct-hidden ix-btn ix-btn--primary ix-btn--lg" id="sct-tx-btn" onclick="sctDoTranscribe()">
    <span>✦</span> Transcribe &amp; Generate Fields
  </button>

  <!-- PROCESSING -->
  <div class="sct-hidden" id="sct-proc-wrap">
    <div class="sct-proc-bar"></div>
    <div class="sct-proc-msg" id="sct-proc-msg">Sending to Claude…</div>
  </div>

  <!-- RESULTS -->
  <div class="sct-results sct-hidden" id="sct-results">
    <div class="sct-results-bar"></div>
    <div class="sct-results-body">
      <div class="sct-results-title">Review &amp; Edit Fields</div>
      <div class="sct-results-sub">Step 4 — All fields pre-populated · Edit anything before saving</div>

      <div class="sct-frow"><div class="sct-ff">
        <label class="sct-fl">Article Title <span class="req">*</span></label>
        <input class="sct-finp" id="sct-f-title" type="text" placeholder="Article headline…" oninput="sctMark(this);sctValidate()">
      </div></div>
      <div class="sct-frow"><div class="sct-ff">
        <label class="sct-fl">Sub-Title</label>
        <input class="sct-finp" id="sct-f-subtitle" type="text" placeholder="Sub-title…" oninput="sctMark(this)">
      </div></div>

      <hr class="sct-divider">

      <label class="sct-fl" style="margin-bottom:8px">Writers</label>
      <div class="sct-writers-grid">
        <div><label class="sct-fl">Writer Name</label><input class="sct-finp" id="sct-f-wname" type="text" placeholder="Name…" oninput="sctMark(this)"></div>
        <div><label class="sct-fl">Writer Title</label><input class="sct-finp" id="sct-f-wtitle" type="text" placeholder="Role…" oninput="sctMark(this)"></div>
        <div><label class="sct-fl">Co-Writer Name</label><input class="sct-finp" id="sct-f-cwname" type="text" placeholder="Optional…" oninput="sctMark(this)"></div>
        <div><label class="sct-fl">Co-Writer Title</label><input class="sct-finp" id="sct-f-cwtitle" type="text" placeholder="Optional…" oninput="sctMark(this)"></div>
      </div>

      <hr class="sct-divider">

      <div class="sct-frow"><div class="sct-ff">
        <label class="sct-fl">Article Teaser Summary <span class="req">*</span> <span style="color:#a0a090;font-weight:400">(target 350–400 chars)</span></label>
        <textarea class="sct-ftxt" id="sct-f-teaser" rows="3" placeholder="Newsletter teaser…" oninput="sctMark(this);sctCount('sct-f-teaser','sct-c-teaser',400,300);sctValidate()"></textarea>
        <div class="sct-char-counter" id="sct-c-teaser">0 / 400</div>
      </div></div>
      <div class="sct-frow"><div class="sct-ff">
        <label class="sct-fl">Short Article Summary <span class="req">*</span> <span style="color:#a0a090;font-weight:400">(target 120–150 chars)</span></label>
        <textarea class="sct-ftxt" id="sct-f-short" rows="2" placeholder="One-liner…" oninput="sctMark(this);sctCount('sct-f-short','sct-c-short',150,100);sctValidate()"></textarea>
        <div class="sct-char-counter" id="sct-c-short">0 / 150</div>
      </div></div>

      <hr class="sct-divider">

      <label class="sct-fl" style="margin-bottom:4px">Article Body <span class="req">*</span> <span style="color:#a0a090;font-weight:400">(text — editable, 20,000 char max)</span></label>
      <!-- v1.2.12 (S11 Part C): legacy contenteditable + custom toolbar replaced with InbxRTE mount point.
           InbxRTE.init() is called from sctRteMount() when the Transcriber opens. Renders embedded
           (not fullscreen), with disableImages:true and hideFooter:true. -->
      <div id="sct-rte-mount" class="sct-rte-mount"></div>
      <div class="sct-rte-meta"><span>Generated headers shown in <span style="color:#c0392b">red</span> — edit or accept</span><span id="sct-word-count"></span></div>

      <!-- v1.2.18 (TD-165): issues banner — replaces the inline
           comma-separated mash inside #sct-ready-msg. Hidden when
           form is valid; revealed with a bulleted list when
           sctValidate() finds problems. -->
      <div id="sct-issues-banner" class="sct-issues sct-hidden">
        <div class="sct-issues-hdr">Before you can save:</div>
        <ul class="sct-issues-list" id="sct-issues-list"></ul>
      </div>

      <div class="sct-sub-bar">
        <button class="sct-cancel ix-btn ix-btn--danger ix-btn--ghost" onclick="sctCancelResults()">✕ discard &amp; retranscribe</button>
        <div class="sct-sub-right">
          <span class="sct-sub-info" id="sct-ready-msg"></span>
          <button class="sct-save-btn ix-btn ix-btn--primary ix-btn--teal" id="sct-save-btn" onclick="sctDoSave()" disabled>Save Draft ✓</button>
        </div>
      </div>
    </div>
  </div>

  <!-- SUCCESS -->
  <div class="sct-card sct-hidden" id="sct-success">
    <div class="sct-card-body">
      <div class="sct-success">
        <div class="sct-success-icon">✅</div>
        <div class="sct-success-title">Draft Article Created</div>
        <div class="sct-success-sub" id="sct-success-sub">Saved to Webflow CMS as Draft.</div>
        <a class="sct-success-link" id="sct-success-link" href="#" target="_blank" style="display:none">Open in Webflow CMS ↗</a>
        <br>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:14px">
          <button class="sct-reset-btn ix-btn ix-btn--secondary" onclick="sctResetAll()">+ Transcribe Another Article</button>
          <button class="sct-reset-btn ix-btn ix-btn--secondary" onclick="sctClose()" style="border-color:#1a3a3a;color:#1a3a3a">✕ Close</button>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="sct-lightbox" id="sct-lb" onclick="sctCloseLb()">
  <div class="sct-lb-close ix-btn ix-btn--ghost ix-btn--icon" onclick="sctCloseLb()">✕</div>
  <img id="sct-lb-img" src="" alt="Full size">
</div>`;

  // ── Add tray CSS (appended to head) ──
  const trayStyle = document.createElement('style');
  trayStyle.textContent = `
.sct-tray-grid{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px}
.sct-tray-tile{position:relative;width:130px;flex-shrink:0;border:1.5px solid #e8e4d8;border-radius:4px;overflow:hidden;background:#faf9f5;cursor:grab;transition:all .15s}
.sct-tray-tile:active{cursor:grabbing}
.sct-tray-tile.drag-over-tile{border-color:#c4a35a;background:#fdfcf8;transform:scale(1.02)}
.sct-tray-tile img{width:100%;height:90px;object-fit:cover;display:block}
.sct-tray-tile-footer{display:flex;align-items:center;justify-content:space-between;padding:3px 6px;background:#fff}
.sct-tray-badge{font-family:'DM Mono',monospace;font-size:9px;color:#5a6a5a;letter-spacing:.04em}
.sct-tray-actions{display:flex;gap:4px}
.sct-tray-zoom,.sct-tray-remove{font-size:10px;background:none;border:none;cursor:pointer;padding:2px;line-height:1;color:#8a8a7a;transition:color .12s}
.sct-tray-zoom:hover{color:#1a3a3a}
.sct-tray-remove:hover{color:#c0392b}
.sct-tray-footer{display:flex;align-items:center;justify-content:space-between;margin-top:2px}
.sct-tray-hint{font-size:9px;font-family:'DM Mono',monospace;color:#a0a090;letter-spacing:.03em}

/* Step 3 sweep animation */
.sct-step.active.sct-sweeping {
  position: relative;
  overflow: hidden;
  background: #1a3a3a;
  color: #f0edd8;
  border-color: transparent;
}
.sct-step.active.sct-sweeping::after {
  content: '';
  position: absolute;
  top: 0; left: -100%; width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(244,161,39,0.5), transparent);
  animation: sct-sweep 1.4s ease-in-out infinite;
}
@keyframes sct-sweep {
  0%   { left: -60%; }
  100% { left: 120%; }
}

/* Processing message */
.sct-proc-msg { font-family:'DM Mono',monospace; font-size:10px; color:#5a6a5a; text-align:center; letter-spacing:.04em; padding:8px 0; }
  `;
  document.head.appendChild(trayStyle);

  // ── Paste listener ──
  document.addEventListener('paste', function(e) {
    const txTab = document.querySelector('[data-w-tab="Transcriber"]');
    if (txTab && !txTab.classList.contains('w--current')) return;
    const items = (e.clipboardData||window.clipboardData||{}).items||[];
    for (let i=0; i<items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        sctReadBlob(items[i].getAsFile(), items[i].type);
        return;
      }
    }
  });

  // ── Drag & drop onto paste zone ──
  const pz = document.getElementById('sct-pz');
  pz.addEventListener('dragover', e => { e.preventDefault(); pz.classList.add('drag-over'); });
  pz.addEventListener('dragleave', () => pz.classList.remove('drag-over'));
  pz.addEventListener('drop', e => { e.preventDefault(); pz.classList.remove('drag-over'); const f=e.dataTransfer.files[0]; if(f&&f.type.startsWith('image/')) sctHandleFile(f); });

  window.sctHandleFile = f => { if(f) sctReadBlob(f, f.type); };

  // ── Compress + add to tray ──
  function sctReadBlob(blob, mime) {
    const r = new FileReader();
    r.onload = ev => {
      const img = new Image();
      img.onload = () => {
        // Compress: max 1800px on longest side, JPEG 85%
        const MAX = 1800;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          const ratio = Math.min(MAX/w, MAX/h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64  = dataUrl.split(',')[1];
        const id = 'img-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
        S.images.push({ id, base64, mime:'image/jpeg', dataUrl });
        sctRenderTray();
        sctUpdateUI();
      };
      img.src = ev.target.result;
    };
    r.readAsDataURL(blob);
  }

  // ── Render tray ──
  function sctRenderTray() {
    const hasTray = S.images.length > 0;
    document.getElementById('sct-tray').classList.toggle('sct-hidden', !hasTray);
    document.getElementById('sct-pz').classList.toggle('sct-hidden', hasTray);

    const grid = document.getElementById('sct-tray-grid');
    grid.innerHTML = S.images.map((img, i) => `
      <div class="sct-tray-tile" id="sct-tile-${img.id}"
           draggable="true"
           ondragstart="sctDragStart(${i})"
           ondragover="sctDragOver(event,${i})"
           ondragleave="sctDragLeave(${i})"
           ondrop="sctDrop(event,${i})">
        <img src="${img.dataUrl}" alt="Page ${i+1}"
             onclick="sctOpenLbImg('${img.dataUrl}')">
        <div class="sct-tray-tile-footer">
          <span class="sct-tray-badge">Page ${i+1}</span>
          <div class="sct-tray-actions">
            <button class="sct-tray-zoom" onclick="sctOpenLbImg('${img.dataUrl}')" title="View full size">🔍</button>
            <button class="sct-tray-remove" onclick="sctRemoveImg('${img.id}')" title="Remove">✕</button>
          </div>
        </div>
      </div>
    `).join('');

    // Update sub label
    const n = S.images.length;
    document.getElementById('sct-paste-sub').textContent =
      n === 0 ? 'Step 1 — Press Cmd+V to add each page · Multiple pages supported'
      : n === 1 ? 'Step 1 — 1 page added · Cmd+V to add more'
      : `Step 1 — ${n} pages added · Cmd+V to add more`;
  }

  // ── Drag reorder ──
  window.sctDragStart = idx => { S.dragSrcIdx = idx; };
  window.sctDragOver  = (e, idx) => {
    e.preventDefault();
    document.querySelectorAll('.sct-tray-tile').forEach(t => t.classList.remove('drag-over-tile'));
    const tile = document.getElementById('sct-tile-' + S.images[idx]?.id);
    if (tile) tile.classList.add('drag-over-tile');
  };
  window.sctDragLeave = idx => {
    const tile = document.getElementById('sct-tile-' + S.images[idx]?.id);
    if (tile) tile.classList.remove('drag-over-tile');
  };
  window.sctDrop = (e, toIdx) => {
    e.preventDefault();
    document.querySelectorAll('.sct-tray-tile').forEach(t => t.classList.remove('drag-over-tile'));
    if (S.dragSrcIdx === null || S.dragSrcIdx === toIdx) return;
    const moved = S.images.splice(S.dragSrcIdx, 1)[0];
    S.images.splice(toIdx, 0, moved);
    S.dragSrcIdx = null;
    sctRenderTray();
  };

  window.sctRemoveImg = id => {
    S.images = S.images.filter(img => img.id !== id);
    sctRenderTray();
    sctUpdateUI();
  };

  // ── Lightbox ──
  window.sctOpenLbImg = dataUrl => {
    document.getElementById('sct-lb-img').src = dataUrl;
    document.getElementById('sct-lb').classList.add('open');
  };
  window.sctOpenLb  = () => {};
  window.sctCloseLb = () => document.getElementById('sct-lb').classList.remove('open');
  document.addEventListener('keydown', e => { if(e.key==='Escape') window.sctCloseLb(); });

  // ── Mode toggle ──
  window.sctSetMode = m => {
    S.mode = m; S.existingArticleId = null;
    document.getElementById('sct-mode-new').classList.toggle('active', m==='new');
    document.getElementById('sct-mode-ex').classList.toggle('active', m==='existing');
    document.getElementById('sct-new-body').classList.toggle('sct-hidden', m!=='new');
    document.getElementById('sct-ex-body').classList.toggle('sct-hidden', m!=='existing');
    document.getElementById('sct-replace-row').classList.add('sct-hidden');
    sctUpdateUI();
  };

  window.sctFilterArts = q => {
    S.existingArticleId = null;
    S.existingArticleName = null;
    document.getElementById('sct-replace-row').classList.add('sct-hidden');
    const res = document.getElementById('sct-art-results');
    res.classList.remove('sct-hidden');

    const query = (q || '').trim();
    if (query.length < 2) {
      res.innerHTML = '<div style="padding:8px 10px;font-size:11px;font-family:\'DM Mono\',monospace;color:#a0a090">Type at least 2 characters…</div>';
      sctUpdateUI();
      return;
    }

    // Read articles fresh from the hidden DOM collection every search.
    // Keeps this self-contained — no dependency on outer-scope `articles`
    // array (which lives in a separate IIFE).
    const getData = (el, k) => el.getAttribute('data-' + k) || '';
    const pool = Array.from(document.querySelectorAll('[data-articles-wrapper] [data-item]')).map(el => ({
      id:   getData(el, 'article-id') || getData(el, 'id'),
      name: getData(el, 'article-title') || getData(el, 'name'),
      group: getData(el, 'group') || '',
      type:  getData(el, 'type')  || ''
    })).filter(a => a.id && a.name);

    const qLower = query.toLowerCase();
    const matches = pool
      .filter(a => a.name.toLowerCase().includes(qLower))
      .slice(0, 8); // cap to 8 rows — avoid overwhelming the narrow tab

    if (matches.length === 0) {
      res.innerHTML = '<div style="padding:8px 10px;font-size:11px;font-family:\'DM Mono\',monospace;color:#a0a090">No matches — try a different term or use New Article</div>';
      sctUpdateUI();
      return;
    }

    // Render clickable rows. Escape only what can appear in attributes/text.
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    res.innerHTML = matches.map(a => {
      const meta = [a.group, a.type].filter(Boolean).join(' · ');
      return `<div class="sct-art-row" onclick="sctSelectArt('${esc(a.id)}', '${esc(a.name)}')" style="padding:8px 10px;cursor:pointer;border-bottom:1px solid #ececea;font-family:'DM Sans',sans-serif;font-size:12px">
        <div style="color:#1E2A3A;font-weight:500">${esc(a.name)}</div>
        ${meta ? `<div style="color:#8a8a7a;font-size:10px;font-family:'DM Mono',monospace;margin-top:2px">${esc(meta)}</div>` : ''}
      </div>`;
    }).join('');

    sctUpdateUI();
  };

  window.sctSelectArt = (id, name) => {
    S.existingArticleId = id;
    S.existingArticleName = name;
    // Fill the search input with selected title so user sees what's chosen
    const inp = document.getElementById('sct-art-search');
    if (inp) inp.value = name;
    // Hide the results list; reveal the Replace/Append row
    document.getElementById('sct-art-results').classList.add('sct-hidden');
    document.getElementById('sct-replace-row').classList.remove('sct-hidden');
    sctUpdateUI();
  };

  // v1.2.9 — Replace/Append radio handler.
  // Previously the radio's onchange attribute inlined `S.replaceMode=this.value`,
  // but `S` is block-scoped to the Transcriber IIFE and not visible to inline
  // handlers (which run in global scope), so the assignment silently failed and
  // S.replaceMode stayed at its default 'replace'. Expose on window to fix.
  window.sctSetReplaceMode = (value) => {
    S.replaceMode = value;
  };

  // ── UI state ──
  function sctUpdateUI() {
    const hasImg = S.images.length > 0;
    const assignReady = S.mode==='new' || !!S.existingArticleId;
    const inReview = S.resultsReady && !S.processing;

    // Hide paste + assign cards during review and success
    document.getElementById('sct-paste-card').classList.toggle('sct-hidden', inReview);
    document.getElementById('sct-assign-card').classList.toggle('sct-hidden', !hasImg || inReview);

    const canTx = hasImg && assignReady && !S.processing;
    document.getElementById('sct-tx-btn').classList.toggle('sct-hidden', !canTx || S.resultsReady);
    document.getElementById('sct-tx-btn').disabled = !canTx;

    // Update transcribe button label
    if (canTx && !S.resultsReady) {
      const n = S.images.length;
      document.getElementById('sct-tx-btn').innerHTML =
        `<span>✦</span> Transcribe ${n > 1 ? n+' Pages' : 'Screenshot'} &amp; Generate Fields`;
    }

    // Step states:
    // 1: green if has image, active if not
    // 2: green if assign ready, active if has image but not assigned, blank if no image
    // 3: green if results ready (transcription done), sweeping-active if processing, blank otherwise
    // 4: active if in review, blank otherwise
    // 5: only set by sctShowSuccess
    sctSetStep(1, hasImg ? 'done' : 'active');
    sctSetStep(2, !hasImg ? '' : assignReady ? 'done' : 'active');
    sctSetStep(3, S.processing ? 'active' : S.resultsReady ? 'done' : !assignReady ? '' : '');
    sctSetStep(4, inReview ? 'active' : '');
    sctSetStep(5, ''); // only set on actual save success
  }

  function sctSetStep(n, cls) {
    const el = document.getElementById('sct-s'+n);
    if (el) el.className = 'sct-step' + (cls ? ' '+cls : '');
  }

  // ── Transcribe ──
  window.sctDoTranscribe = async () => {
    S.processing = true;
    sctUpdateUI();
    // Add sweep animation to step 3
    const s3 = document.getElementById('sct-s3');
    if (s3) s3.classList.add('sct-sweeping');
    document.getElementById('sct-tx-btn').classList.add('sct-hidden');
    document.getElementById('sct-proc-wrap').classList.remove('sct-hidden');
    document.getElementById('sct-results').classList.add('sct-hidden');

    const n = S.images.length;
    const msgs = n > 1
      ? [`Sending ${n} pages to Claude…`, 'Reading article structure…', 'Generating summaries…', 'Formatting body…']
      : ['Sending to Claude…', 'Reading article structure…', 'Generating summaries…', 'Formatting body…'];
    let mi = 0;
    const msgEl = document.getElementById('sct-proc-msg');
    if (msgEl) msgEl.textContent = msgs[0];
    const ticker = setInterval(() => {
      mi++;
      if (mi < msgs.length && msgEl) msgEl.textContent = msgs[mi];
    }, 4000);

    try {
      const result = await sctCallClaude();
      clearInterval(ticker);
      S.processing = false; S.resultsReady = true;
      // Step 3 goes green (done), sweep removed
      const s3 = document.getElementById('sct-s3');
      if (s3) s3.classList.remove('sct-sweeping');
      document.getElementById('sct-proc-wrap').classList.add('sct-hidden');
      document.getElementById('sct-results').classList.remove('sct-hidden');
      sctPopulate(result);
      sctSetStep(4,'active');
    } catch(err) {
      clearInterval(ticker);
      S.processing = false;
      // Remove sweep from step 3 on error
      const s3err = document.getElementById('sct-s3');
      if (s3err) s3err.classList.remove('sct-sweeping');
      document.getElementById('sct-proc-wrap').classList.add('sct-hidden');
      sctUpdateUI();
      alert('Transcription error: ' + err.message);
    }
  };

  // ── Claude API call — all images in one message ──
  async function sctCallClaude() {
    if (!CFG.proxyUrl) throw new Error('Anthropic proxy URL not configured. Add anthropicProxy to window.TA_CONFIG in the page head.');

    const n = S.images.length;
    const pageNote = n > 1
      ? `This article spans ${n} pages, provided in order. Treat them as one continuous article.`
      : 'Transcribe this article screenshot.';

    const system = `You are an expert article transcriber and editor for a local community newsletter publishing platform.

Return your response using XML tags — one tag per field. Do not use JSON. Do not add any text outside the tags.

Use exactly these tags:
<title>Article headline</title>
<subtitle>Sub-title if visible, else leave empty</subtitle>
<writername>Primary writer name if visible, else leave empty</writername>
<writertitle>Primary writer title/role if visible, else leave empty</writertitle>
<cowritername>Co-writer name if visible, else leave empty</cowritername>
<cowritertitle>Co-writer title if visible, else leave empty</cowritertitle>
<teaser>Newsletter teaser here</teaser>
<shortsummary>Short summary here</shortsummary>
<body>Full article HTML here</body>

TEASER RULES:
- Target length: 350–400 characters. Write enough to fill this range.
- Minimum: 300 characters. If under 300, expand with a compelling detail.
- Maximum: 400 characters hard limit.
- Write a complete, engaging teaser — no truncation, no ellipsis.

SHORT SUMMARY RULES:
- Target length: 120–150 characters. Write to fill this range.
- Minimum: 100 characters. If under 100, add a key detail.
- Maximum: 150 characters hard limit.

BODY RULES:
- Transcribe all visible article text accurately and completely.
- SECTION HEADERS: If the article has visible section headers, use <h2 class="sct-transcribed">Header</h2>
- AUTO-SECTIONALIZE: If the article has NO visible section headers, divide into 2–5 logical sections and create descriptive H2 headers. Mark these as <h2 class="sct-generated">Header</h2>
- Use <p> for paragraphs. Use <ul><li> for bullets. Use <ol><li> for numbered lists.
- No inline styles. No wrapper divs. Start directly with content.
- Do not summarize or cut the body — preserve all substantive content.

If any field is not visible or not applicable, leave the tag empty. Never omit a tag.`;

    // Build content array: all images first, then instruction
    const content = [
      ...S.images.map(img => ({
        type: 'image',
        source: { type: 'base64', media_type: img.mime, data: img.base64 }
      })),
      { type: 'text', text: n > 1
        ? `This article spans ${n} pages in order. Treat as one continuous article. Transcribe it now.`
        : 'Transcribe this article screenshot.' }
    ];

    const res = await fetch(CFG.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 4000,
        system,
        messages: [{ role: 'user', content }]
      })
    });

    if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.error?.message||'API error '+res.status); }
    const data = await res.json();
    const raw = data.content?.find(b=>b.type==='text')?.text||'';

    // Parse XML tags — immune to apostrophes, quotes, em-dashes, HTML in body
    const extract = (tag) => {
      const m = raw.match(new RegExp('<' + tag + '>([\\s\\S]*?)<\\/' + tag + '>'));
      return m ? m[1].trim() : '';
    };

    return {
      title:        extract('title'),
      subtitle:     extract('subtitle'),
      writername:   extract('writername'),
      writertitle:  extract('writertitle'),
      cowritername: extract('cowritername'),
      cowritertitle:extract('cowritertitle'),
      teaser:       extract('teaser'),
      shortsummary: extract('shortsummary'),
      body:         extract('body'),
    };
  }

  // ── Populate results fields ──
  function sctPopulate(r) {
    const set = (id,v) => { const el=document.getElementById(id); if(!el) return; el.value=v||''; el.classList.toggle('has-val',!!(v||'').trim()); };
    set('sct-f-title',   r.title);
    set('sct-f-subtitle',r.subtitle);
    set('sct-f-wname',   r.writername);
    set('sct-f-wtitle',  r.writertitle);
    set('sct-f-cwname',  r.cowritername);
    set('sct-f-cwtitle', r.cowritertitle);
    set('sct-f-teaser',  r.teaser);
    set('sct-f-short',   r.shortsummary);
    // v1.2.12: body now lives in InbxRTE.
    //
    // v1.2.12 fix #1: First mount uses initialHTML (Trix loads it
    // synchronously inside trix-initialize, guaranteed to land).
    // Subsequent calls (e.g. retranscribe → sctPopulate again) use
    // setContent. The original implementation called setContent on
    // first mount too, which raced against Trix's reconciler from
    // customizeToolbar() and silently no-op'd, leaving body empty.
    if (window._sctRteInstance && window._sctRteInstance.trixEditor) {
      window._sctRteInstance.setContent(r.body || '');
    } else {
      sctRteEnsure(r.body || '').then(() => {
        // After init, ensure validation/word count reflect the loaded body.
        sctWordCount();
        sctValidate();
      });
    }
    sctCount('sct-f-teaser','sct-c-teaser',400,300);
    sctCount('sct-f-short','sct-c-short',150,100);
    sctWordCount();
    sctValidate();
  }

  // ── v1.2.12: InbxRTE bridge ──
  // The RTE is mounted lazily on first need (transcription complete →
  // sctPopulate, or any other code path that needs the editor live).
  // sctRteEnsure() returns a Promise<InbxRTE instance>. Resolves
  // immediately if already mounted; otherwise initializes InbxRTE
  // with the Transcriber's locked config (text-only, no footer) and
  // resolves once Trix has finished its async init.
  //
  // The instance is stashed on window._sctRteInstance so all the
  // sctXxx helpers below can share it without re-querying. Studio
  // uses the same window-stash pattern (window._studioRteInstance)
  // so the convention is consistent.
  function sctRteEnsure(initialHTML) {
    if (window._sctRteInstance && window._sctRteInstance.trixEditor) {
      return Promise.resolve(window._sctRteInstance);
    }
    if (!window.InbxRTE || typeof window.InbxRTE.init !== 'function') {
      console.error('[SCT v1.2.17] InbxRTE not loaded — make sure ta-rte-v1.1.4.js (or later) is in the page <head>');
      return Promise.reject(new Error('InbxRTE not loaded'));
    }
    // Inject scope-hide for any RTE save row (defense-in-depth: hideFooter:true
    // in v1.1.3+ already suppresses the markup, but if a stale RTE is cached
    // from before that flag existed, this CSS keeps the embedded mode clean).
    // (Transcribe button .sct-tx-btn fix is injected at Transcriber boot, not
    // here — it needs to apply BEFORE transcription, while sctRteEnsure runs
    // AFTER transcription completes.)
    if (!document.getElementById('sct-rte-style-guard')) {
      const style = document.createElement('style');
      style.id = 'sct-rte-style-guard';
      style.textContent = '#sct-rte-mount .rte-save-row, #sct-rte-mount .rte-picker-panel { display:none !important; }';
      document.head.appendChild(style);
    }
    const inst = window.InbxRTE.init({
      mountSelector:  '#sct-rte-mount',
      articleItemId:  S.existingArticleId || '',
      articleTitle:   document.getElementById('sct-f-title')?.value || '',
      initialHTML:    initialHTML || '',
      mode:           'review',
      fullscreen:     false,
      disableImages:  true,   // v1.1.3 flag — Transcriber is text-only intake
      hideFooter:     true,   // v1.1.3 flag — Transcriber owns its own Save button
    });
    window._sctRteInstance = inst;
    // Wait for Trix init to complete (RTE's trix-initialize handler resolves
    // editorEl + trixEditor). Poll briefly; init is fast in practice.
    return new Promise((resolve) => {
      const t0 = Date.now();
      const tick = () => {
        if (inst.trixEditor) {
          // Wire change events into Transcriber validation. We poll the
          // editor element directly because InbxRTE's trix-change handler
          // updates dirty state but the Transcriber needs validation +
          // word count too.
          if (inst.editorEl && !inst.editorEl._sctWired) {
            inst.editorEl.addEventListener('trix-change', () => {
              sctWordCount();
              sctValidate();
            });
            inst.editorEl._sctWired = true;
          }
          resolve(inst);
          return;
        }
        if (Date.now() - t0 > 5000) {
          console.warn('[SCT v1.2.17] RTE init timeout after 5s — resolving anyway');
          resolve(inst);
          return;
        }
        setTimeout(tick, 50);
      };
      tick();
    });
  }

  // Read the current body HTML out of the RTE instance. Returns ''
  // when the RTE isn't mounted yet (pre-transcription state).
  function sctRteGetHTML() {
    const inst = window._sctRteInstance;
    if (!inst || typeof inst.getCleanHTML !== 'function') return '';
    return inst.getCleanHTML() || '';
  }

  // Read the body as plain text (for word count + char-cap validation).
  // We strip tags via a temp DOM so entities decode correctly.
  function sctRteGetText() {
    const html = sctRteGetHTML();
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').trim();
  }

  // Clear the RTE body (called from sctCancelResults / sctCancelAll).
  function sctRteClear() {
    const inst = window._sctRteInstance;
    if (inst && typeof inst.setContent === 'function') {
      inst.setContent('');
    }
  }

  window.sctMark = el => { el.classList.toggle('has-val', !!el.value.trim()); sctValidate(); };
  // v1.2.12: sctMarkRte / sctFmt / sctFmtBlock / sctInsertLink REMOVED.
  // Trix handles formatting via its own toolbar; change tracking flows
  // through the trix-change listener wired in sctRteEnsure().

  window.sctCount = (fid, cid, max, min) => {
    const len = (document.getElementById(fid)?.value||'').length;
    const el  = document.getElementById(cid); if (!el) return;
    el.textContent = len + ' / ' + max;
    if (len > max)           el.className = 'sct-char-counter over';
    else if (min && len < min) el.className = 'sct-char-counter under';
    else if (len > max * .9) el.className = 'sct-char-counter warn';
    else                     el.className = 'sct-char-counter ok';
  };
  function sctWordCount() {
    // v1.2.12: read text from the RTE instance, not from a contenteditable.
    const t = sctRteGetText();
    const w = t ? t.split(/\s+/).filter(Boolean).length : 0;
    const el = document.getElementById('sct-word-count'); if(el) el.textContent = w + ' words';
  }
  function sctValidate() {
    const title  = document.getElementById('sct-f-title')?.value?.trim();
    const teaser = document.getElementById('sct-f-teaser')?.value?.trim();
    const tLen   = (document.getElementById('sct-f-teaser')?.value||'').length;
    const sLen   = (document.getElementById('sct-f-short')?.value||'').length;
    // v1.2.12: body validation reads from the RTE instance.
    //   - "has body" check uses HTML trim (so an empty Trix that contains
    //     only <br> or <div></div> still counts as empty).
    //   - char-cap check uses plain-text length (20,000 char hard cap;
    //     teaser/short use HTML/text indistinguishably because they're
    //     plain inputs, but for body the visible-text length is what
    //     matters to the editor and Webflow).
    const bodyHTML = sctRteGetHTML().trim();
    const bodyText = sctRteGetText();
    const bLen = bodyText.length;
    const BODY_MAX = 20000;
    const ok = !!title && !!teaser && !!bodyHTML && tLen<=400 && sLen<=150 && bLen<=BODY_MAX;
    const btn = document.getElementById('sct-save-btn');
    if (btn) btn.disabled = !ok;
    const issues=[];
    if(!title) issues.push('Article title is required');
    if(!teaser) issues.push('Teaser is required');
    if(tLen>400) issues.push('Teaser is over the 400-character limit');
    if(sLen>150) issues.push('Short summary is over the 150-character limit');
    if(!bodyHTML) issues.push('Article body is required');
    if(bLen>BODY_MAX) issues.push('Body is over the ' + BODY_MAX.toLocaleString() + '-character limit');
    // v1.2.18 (TD-165): issues banner is now the source of truth for
    // unmet-requirements display. The inline #sct-ready-msg is cleared
    // (kept in DOM for backwards compat with anything that still reads
    // it, but no longer load-bearing).
    const banner = document.getElementById('sct-issues-banner');
    const list   = document.getElementById('sct-issues-list');
    if (banner && list) {
      if (ok) {
        banner.classList.add('sct-hidden');
        list.innerHTML = '';
      } else {
        list.innerHTML = issues.map(function(i){
          return '<li>' + i + '</li>';
        }).join('');
        banner.classList.remove('sct-hidden');
      }
    }
    const rm = document.getElementById('sct-ready-msg');
    if (rm) rm.textContent = '';
    // Step 5 deliberately NOT set here — only highlights on actual save success
  }

  // ── Save ──
  window.sctDoSave = async () => {
    const btn = document.getElementById('sct-save-btn');
    btn.disabled=true; btn.textContent='Saving…';
    // v1.2.12: body HTML now comes from the RTE instance, not a contenteditable.
    // The minifier from v1.2.11 still runs because the Webflow CMS <li>
    // whitespace bug applies to whatever HTML we ship, regardless of source.
    const bodyHTML = sctRteGetHTML();
    const payload = {
      titleSlug:               CFG.titleSlug,
      taItemId:                CFG.taItemId,
      titleId:                 CFG.titleId,
      mode:                    S.mode,
      existingArticleId:       S.existingArticleId||'',
      replaceMode:             S.replaceMode,
      'article-title':         document.getElementById('sct-f-title').value,
      'sub-title':             document.getElementById('sct-f-subtitle').value,
      'writername':            document.getElementById('sct-f-wname').value,
      'writertitle':           document.getElementById('sct-f-wtitle').value,
      'co-writername':         document.getElementById('sct-f-cwname').value,
      'co-writertitle':        document.getElementById('sct-f-cwtitle').value,
      'article-summary':       document.getElementById('sct-f-teaser').value,
      'short-article-summary': document.getElementById('sct-f-short').value,
      'article-body-rte':      bodyHTML
                                 .replace(/>\s+</g, '><')
                                 .replace(/\n/g, '')
                                 .trim(),
    };
    try {
      const qs = new URLSearchParams();
      Object.entries(payload).forEach(([k,v]) => qs.append(k,v));
      await fetch(CFG.makeUrl+'?'+qs.toString(), { method:'GET', mode:'no-cors' });
      sctShowSuccess(payload['article-title']);
    } catch(err) {
      btn.disabled=false; btn.textContent='Save Draft ✓';
      alert('Save error: '+err.message);
    }
  };

  function sctShowSuccess(name) {
    // Hide everything except success panel
    ['sct-paste-card','sct-assign-card','sct-tx-btn','sct-proc-wrap','sct-results'].forEach(id => {
      const el = document.getElementById(id); if(el) el.classList.add('sct-hidden');
    });
    document.getElementById('sct-success').classList.remove('sct-hidden');
    const sub = document.getElementById('sct-success-sub');
    if (sub) sub.textContent = '"' + name + '" saved as Draft.';
    // All steps done, step 5 = SUCCESS highlighted
    [1,2,3,4].forEach(n => sctSetStep(n,'done'));
    sctSetStep(5,'active');
  }

  // ── Cancel / Reset ──
  window.sctCancelAll = () => {
    S.images = [];
    S = { ...S, mode:'new', existingArticleId:null, resultsReady:false, processing:false };
    sctRenderTray();
    ['sct-assign-card','sct-results','sct-proc-wrap','sct-success'].forEach(id => {
      const el=document.getElementById(id); if(el) el.classList.add('sct-hidden');
    });
    document.getElementById('sct-tx-btn').classList.add('sct-hidden');
    // v1.2.12: clear the RTE body if it has been mounted. The results card
    // may not be visible (so sctCancelResults wouldn't have run) but a prior
    // session's transcribed body could still be in the editor.
    sctRteClear();
    window.sctSetMode('new');
    sctUpdateUI();
  };

  window.sctCancelResults = () => {
    S.resultsReady = false;
    document.getElementById('sct-results').classList.add('sct-hidden');
    // Restore paste + assign cards
    document.getElementById('sct-paste-card').classList.remove('sct-hidden');
    document.getElementById('sct-assign-card').classList.remove('sct-hidden');
    ['sct-f-title','sct-f-subtitle','sct-f-wname','sct-f-wtitle','sct-f-cwname','sct-f-cwtitle','sct-f-teaser','sct-f-short'].forEach(id => {
      const el=document.getElementById(id); if(el){el.value='';el.classList.remove('has-val');}
    });
    // v1.2.12: clear the RTE body via the instance instead of innerHTML.
    sctRteClear();
    sctUpdateUI();
  };

  window.sctResetAll = () => {
    window.sctCancelAll();
    document.getElementById('sct-success').classList.add('sct-hidden');
    document.getElementById('sct-paste-card').classList.remove('sct-hidden');
    [1,2,3,4,5].forEach(n => sctSetStep(n, n===1?'active':''));
  };

  window.sctClose = () => {
    // Hide the entire transcriber root and reset state
    window.sctCancelAll();
    document.getElementById('sct-success').classList.add('sct-hidden');
    document.getElementById('sct-paste-card').classList.remove('sct-hidden');
    [1,2,3,4,5].forEach(n => sctSetStep(n, n===1?'active':''));
    // Optionally scroll back to top of T-A page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // v1.2.15/16 → v1.2.17 (S11.5b Wave 3 — TD-160 button system):
  // The sct-btn-style-guard <style> tag injection that lived here in
  // v1.2.15+ has been REMOVED. It defined defensive armor for
  // .sct-tx-btn, .sct-save-btn, and .sct-mode-opt--disabled with
  // !important rules to defeat the Webflow chrome cascade bug.
  //
  // All those buttons now emit additive ix-btn ix-btn--* classes
  // and their visual styling comes from ix-buttons-v1.0.x.css
  // (loaded in T-A page <head>), which has its own armor pattern
  // (specificity + !important + dual background-color + background-image).
  //
  // The legacy classes (.sct-tx-btn, .sct-save-btn, .sct-mode-opt--disabled)
  // remain on the markup for additive-migration safety; their
  // unscoped visual rules in title-admin-page-design-v1.4.6.css
  // are no longer load-bearing — the module wins. Both will be
  // stripped from the JS emits and the CSS file in S11.5c.

  window.SCT_STATE = S;
  sctRenderTray();
  sctUpdateUI();

  // v1.2.18 (S13 Step 2): listen for Studio's Tab 4 activation event.
  // ta-studio-v1.2.10+ dispatches this on window when the user clicks
  // the Transcriber tab. We don't re-init or re-render — the mount is
  // already populated. We just polish the activation: scroll the
  // Transcriber into view inside the Studio panel and (if no images
  // are queued yet) put the user back at Step 1.
  // Only attach when we landed in the Studio mount; in legacy UP the
  // event won't fire and the listener is a no-op.
  if (_mountHost === 'studio') {
    window.addEventListener('std:panel:transcriber', function() {
      try {
        mount.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) { /* older browsers — ignore */ }
    });
  }

  console.log('📷 Screenshot Transcriber v1.2.18 mounted (S13 Step 2 — dual-mount: ' + _mountHost + '; TD-165 issues banner active)');
});
