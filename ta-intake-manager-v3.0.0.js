/* ============================================================
   ta-intake-manager-v3.0.0.js
   ============================================================
   Studio · Intake tab — bundle/loose-file management.

   ── v3.0.0 — row thumbnails, TEXT tiles, hover-magnify, polish ──
   Built on v2.1.0. This release makes the Intake rows visual and
   fixes the thumbnail/text detection that the live Scenario I
   payload revealed:
     • Row thumbnails: image MEDIA renders an Uploadcare thumbnail
       (downsized to 96x; any existing /-/ transform on image-url
       is stripped first). renderRowThumb() replaces the bare mime
       icon in renderFileRow.
     • TEXT placeholder tile for text MEDIA. FIX: media-type is a
       Webflow option HASH, not the word "text" — the prior check
       (indexOf('text')) never matched, so text rows fell through
       to a document icon. mediaTypeOf() now matches the confirmed
       hashes (HC-INTK-3) with a label fallback.
     • Hover-to-magnify: image thumbs scale up in place on hover
       (zoom-in affordance) so detail is visible without leaving
       the row.
     • Activity dot is now SOLID gold (the faint ring was hard to
       see). The dot logic itself was already correct — it shows
       when a tab's Awaiting bucket has content.
     • Refresh button enlarged (28px → 38px, gold border) so it
       reads as a real, tappable control.
   HC-INTK-3: MEDIA.media-type option hashes hardcoded (image/text/
   video) from the live payload; TA_CONFIG.optionIds.mediaType wins
   if present. Tracked per the no-hardcode rule.
   Carries forward v2.1.0: loose-first order + default, activity
   dots, auto-refresh after ASF create.

   ── v2.1.0 (prior) ──
     • L1 order swapped to Loose files first; loose is default tab
     • Gold activity dots on L1 tabs when Awaiting bucket has items
     • Auto-refresh after ASF create closes (polls InbxASF.isOpen)

   LINEAGE: this IS ta-bundles (the proven working file). Renamed
   to match the Intake tab. v2.0.0 = ta-bundles-v1.2.1 (the last
   known-good build) + surgical additions:
     • L1 tabs: Bundles | Loose files
     • L2 status subtabs (Awaiting/Partial/Fully/Archived;
       Awaiting use/Used/Archived)
     • "Archived counts as resolved" bundle rollup
     • Bulk Archive / Restore via Scenario K (mode:archive|restore)
   UNCHANGED from v1.2.1: action bar, selection, dirty-state, and
   the full Attach/Create cascade (Scenario K mode:attach +
   window.InbxASF.open create path).

   The earlier ta-intake-manager-v1.0.x files were a from-scratch
   rewrite that introduced regressions; they are SUPERSEDED by
   this build on the proven baseline. Remove them from head.

   Exposes window.InbxIntake (alias: window.InbxBundles).
   Pairs with ta-intake-manager-v3.0.0.css.
   ============================================================

   ── prior history (ta-bundles lineage) ──
   ta-bundles-v1.2.1.js
   ============================================================
   INBXIFY · Bundles Workspace · Cut 3 patch · TD-182 retest-blocker UI fix

   v1.2.1 changelog (UI patch on v1.2.0):
   - .bdl-row now displays Webflow Item ID under filename (mono,
     small, muted). Needed so operators can match MEDIA between
     the Bundles list and Webflow Designer when verifying attach
     results (TD-182 retest workflow).
   - Removed truncation on three selectors per "show whole
     element by default" rule (Jeff, 2026-05-21):
       .bdl-card-label   (bundle header label)
       .bdl-row-filename (MEDIA filename)
       .bdl-row-target   (attached-asset name, was capped 220px)
     All three now wrap to multiple lines if needed. The cascade
     and bundles workspace have plenty of horizontal space; no
     reason to ellipsis-clip primary content.
   - Row layout: filename + Item ID stacked vertically inside a
     new .bdl-row-meta container; row uses align-items: flex-start
     so wrapped content aligns at top.

   No logic changes. No payload changes. CSS pair: ta-bundles-v1.2.1.css.

   ─── v1.2.0 changelog (TD-183 build on v1.1.7) ───
   1. PAYLOAD EXTENSIONS — doAttachSave payload gains two fields
      (spec §11.1):
        + mediaStatusAttached  (from TA_CONFIG.optionIds.mediaStatus.attached)
        + forceReplace         (default false; flipped to true
                                on retry from the ALREADY_LINKED
                                confirmation modal)
      Both sourced from TA_CONFIG — no new hardcoding. The
      mediaStatusAttached client-send makes Scenario K Module
      #50's derivation safety net redundant in the common path.

   2. ALREADY_LINKED_ELSEWHERE CONFIRMATION MODAL — client-side
      preflight for SRF asset collision (spec §11.2 · article
      attach only). Before submitting an article attach, check
      each selected MEDIA's fieldData.article against the new
      target. If any are already attached to a DIFFERENT article,
      surface an aggregated modal listing all collisions with
      existing-article-name lookup from S.data.articles. On
      confirm, resubmit the payload with forceReplace=true. On
      cancel, the modal closes, cascade stays open, selections
      stay intact (per §10.11 cancel-reverts rule).

      Aggregated single-modal pattern (Jeff decision Q2 2026-05-19).
      Per-collision skip checkbox in modal for partial control.

      MRF asset types (ad / event / re) skip this preflight —
      MRF can hold multiple back-references, so no collision.

   3. STATUS FILTER CHIPS — strip rendered inside each expanded
      bundle card body + above the loose tray (spec §11.3).
      Default Available. Filters MEDIA rows by fieldData.status
      against TA_CONFIG.optionIds.mediaStatus.{available,attached}
      hashes. Active chip: blue border + light blue bg + blue
      count badge. Inactive: neutral. Counts pull from grouped
      data already in S.data — no extra fetch.

      Per-card filter state in S.bundleFilters[bundleId] + a
      separate S.looseFilter for the loose tray. Default on
      first view: 'available'. State persists for the panel
      lifetime; reset on data refetch.

      Empty-state copy when the filter returns zero rows
      directs the operator to the other chip.

   4. TEXT-TYPE RE-ATTACH GUARD — file rows with media-type=text
      AND status=attached are rendered with .is-disabled (opacity
      + cursor + checkbox disabled) and an inline amber 'Body —
      locked' guard pill (spec §11.4). toggleFileSelection
      refuses the toggle as defense-in-depth in case the disabled
      attribute is bypassed.

      Scope is Attached-only (Jeff decision Q1 2026-05-19) —
      Available text-type MEDIA (orphan body that lost its
      article) remains selectable so the operator can re-attach
      it to a new article.

   5. REFETCH AFTER SAVE — already shipped in v1.1.5. After
      doAttachSave success, fetchAndRender runs so the attached
      files repaint with their new asset refs without manual
      refresh. No change in v1.2.0; called out here for spec §11
      completeness.

   ─── Hardcoding inventory ───
   No new HC entries. mediaStatusAttached + status filter +
   guard pull from TA_CONFIG.optionIds.mediaStatus.{available,
   attached} — documented platform constants per
   platform-data-reference §7c. If TA_CONFIG.optionIds.mediaStatus
   is missing at runtime, v1.2.0 logs a console warning and falls
   back to filtering by string label ('Available' / 'Attached')
   matched against fieldData.status's display value. Field hash
   IDs are the source of truth; string fallback is for safety
   during the TA_CONFIG cutover.

   ─── CSS pairing ───
   Paired with ta-bundles-v1.2.0.css (full replacement of
   v1.1.7.css; remove the old <link> from the head). New
   selectors:
     .bdl-filter-strip        · chip strip container
     .bdl-filter-label        · "Show" label
     .bdl-filter-chip         · individual chip (Available / Attached)
     .bdl-filter-chip-count   · count badge inside chip
     .bdl-filter-clear        · Reset link (right side)
     .bdl-filter-empty        · empty-state row when filter returns zero
     .bdl-row.is-disabled     · disabled file row (text guard)
     .bdl-row-guard           · inline amber "Body — locked" pill
     .bdl-replace-modal-bg    · modal overlay
     .bdl-replace-modal       · modal container
     .bdl-replace-modal-*     · header / body / target / loading / error / foot

   ─── Page load order on T-A page ───
     1. ta-studio-v1.4.0.js              (creates Inputs panel)
     2. ta-asf-v1.0.16.js                (provides window.InbxASF for create mode)
     3. ta-bundles-v1.2.0.js             (this file)
     4. ta-bundles-v1.2.0.css            (paired — full replacement
                                          of v1.1.7.css)
     5. ix-form-controls-v1.0.0.css      (chips/picker/revert)
     6. ix-buttons-v1.0.4.css            (action bar buttons)

   ─── v1.1.7 changelog (polish patch on v1.1.6) ───
   No functional JS changes. The cstep-num spans were already
   rendered in the DOM but rendering invisibly because v1.1.6's
   .bdl-cstep-head used `align-items: baseline`, which collapses
   inline-flex circle children to near-zero cross-axis height
   in some browsers. v1.1.7.css switches to align-items: center
   + bumps the circle to 24px with !important on visual props
   so it shows up unambiguously. JS bumped to v1.1.7 so the
   paired file versions stay in sync per Jeff's convention.

   ─── v1.1.6 changelog (bug-fix on v1.1.5) ───
   1. SCENARIO K VALIDATION FIX. v1.1.5's attach payload was
      missing two fields that the Scenario K TENANT-VALIDATION
      module (id=4 in the blueprint) compares against the
      tenant config datastore — both must equal true for the
      AttachMode filter to fire:
        validAssetColl = (assetCollId == switch(assetType;
                            "article"; wfCollArticles;
                            "ad";      wfCollAds;
                            "event";   wfCollEvents;
                            "re";      wfCollRealEstate))
        validMediaColl = (mediaCollId == wfCollMedia)
      v1.1.6 reads TA_CONFIG.wfColl.{articles, ads, events,
      realEstate, media} and adds assetCollId + mediaCollId to
      the payload. New helper getAssetCollId() picks the right
      one by asset type.
      HC-NEW-3: wfColl IDs are platform-wide (single Webflow
      site). Pin updates only on Webflow-site migration.
   2. 2-COLUMN CASCADE LAYOUT. The body now uses CSS grid with
      Step 1 (Asset Type) on the left and Step 2 (Picker or
      Create info) on the right. Both selectors visible at
      once. Cascade panel min-height: 480px so the picker
      dropdown has real room. Picker list max-height bumped
      280px → 360px.
   3. NAMING IN CREATE MODE — deferred. Pending the Design A
      vs Design B conversation about whether Scenario K should
      have a create route or all naming happens in ASF.

   ─── v1.1.5 changelog (Cut 2 final ship) ───
   1. SAVE BUTTON WIRED. The v1.1.0 console.log stub is gone.
      Two routes:
        • Attach mode → POST to Scenario K (TA_CONFIG.makeAttachFiles):
            { mode:'attach', assetType, assetId, mediaIds[], tenantId, titleSlug }
          On success: toast/flash green status, close cascade, clear
          selections, refetch bundles list (so the just-attached files
          show their new asset refs instead of "Awaiting Create").
          On failure: red error status, Save re-enabled for retry.
        • Create mode → window.InbxASF.open({mode:'create', assetType,
            prefilledMediaIds[]}) — defensive (warns + flashes status
          if InbxASF isn't loaded). After successful open, cascade
          closes + selections clear (ASF takes over).
   2. New per-save UI state on the footer:
        • "Saving…" while in-flight (Save button disabled, spinner-ish)
        • "✓ Attached N files to <name>. Refreshing…" on attach success
        • "Failed: <error>" in red on failure
        • "Opening Asset Form…" while ASF launches (create mode)
   3. Red top border CARRIES from action bar to cascade panel
      (.bdl-cascade) — visual continuity when transitioning from
      action bar to either attach or create cascade.
   4. Aborts cleanly if config is missing: if TA_CONFIG.makeAttachFiles
      is empty/missing, save fails fast with a clear error rather than
      using a hardcoded fallback (which could write to a wrong tenant).
      No new hardcoding entries vs. v1.1.4.

   Cut 2 is feature-complete after v1.1.5 verifies in production.
   Post-v1.1.5 batch: roadmap doc updates (Studio-Master-Roadmap,
   INBXIFY-Platform-Roadmap, platform-data-reference, scenario-K-design).

   ─── v1.1.4 changelog (polish patch on v1.1.3) ───
   Three action-bar adjustments per Jeff:
   1. Width now mirrors the .dashboard div (not #bdl-root).
      syncCascadeAnchorToContainer() prefers .dashboard; falls
      back to #bdl-root with a console warning if .dashboard
      is not found in the DOM (in case the selector is wrong).
   2. 4px red top border on .bdl-action-bar (CSS).
   3. 60px top + 60px bottom padding on .bdl-action-bar (CSS).
   Plus: #bdl-root.has-selection padding-bottom bumped from
   110px to 200px to accommodate the now-much-taller bar.

   ─── v1.1.3 changelog (polish patch on v1.1.2) ───
   Action bar geometry rebuilt:
   • Width now MIRRORS #bdl-root's bounding rect (the file list
     container) instead of spanning the full viewport. Computed
     at render time and on window resize via the new helper
     syncCascadeAnchorToContainer(). Action bar / cascade panel
     stay aligned with the file list above them.
   • Pinned to bottom: 0 (flush with viewport edge — no 16px gap).
   • Internal padding bumped to 20px top / 20px bottom on the
     action bar. Cascade footer bottom padding also bumped to
     20px for visual parity when expanded.
   • Border-radius collapsed to top corners only (10px 10px 0 0).
     border-bottom removed. box-shadow flipped from below-element
     to above-element (since the bar's bottom is the viewport edge).

   Cut 2 plan post-v1.1.3:
   • v1.1.4 — save wiring to Scenario K + window.InbxASF.open()
     for create path. Final Cut 2 ship.

   ─── v1.1.2 (Cut 2 ship 2 — tenant filter) ───
   1. Asset picker now filters to the current tenant's assets
      only. Cross-tenant assets in the Scenario I response are
      excluded from the dropdown list.
   2. SCHEMA CORRECTION (vs. transfer doc):
      The transfer doc described tenant filtering as "two-hop
      traversal: asset → title(s) → check title-admin". The
      actual schema (confirmed 2026-05-18) is ONE-HOP — every
      asset type has a direct TITLE-ADMIN reference:
        • Articles:           fieldData['associated-title']  (SRF → TITLE-ADMIN, single ID string)
                              fieldData['title']             (SRF → TITLE, single ID string — NOT used for tenant filtering)
        • Ads:                fieldData['titles']            (MRF → TITLE-ADMIN, array of IDs)
        • Events:             fieldData['titles']            (MRF → TITLE-ADMIN, array of IDs)
        • RE Listings:        fieldData['titles']            (MRF → TITLE-ADMIN, array of IDs)
      Filter logic accordingly: Articles use string equality,
      the other three use Array.includes(S.tenantId).
      No TITLES collection lookup required — Scenario I does
      not need to be extended.
   3. CSS-only: removed the max-width: 1100px cap on
      #bdl-cascade-anchor that v1.1.1 added unnecessarily. The
      action bar now extends to the full available width
      (left:24px / right:24px from the viewport).

   v1.1.3 (next, final Cut 2 ship) = save wiring to Scenario K
   + window.InbxASF.open() for the create path.

   ─── v1.1.1 (polish patch on v1.1.0) ───
   Two bugs found during v1.1.0 production verification:
   1. Selected rows did NOT visibly tint blue. Investigation:
      the .is-selected class IS applied correctly by the
      surgical row updater (console probe confirmed), but the
      .bdl-row.is-selected background rule is being overridden
      by a higher-specificity (or !important) rule from another
      stylesheet in the cascade. CSS-only fix: !important +
      bumped tint opacity + crisp blue left-edge indicator so
      selection is visible regardless of what overrides exist.
   2. Action bar was position:sticky, which bottoms out at the
      Inputs panel edge, not at the viewport bottom. Operator
      had to scroll to see it. CSS-only fix: position:fixed +
      conditional has-selection padding on #bdl-root so the
      last file row isn't hidden under the action bar.

   JS change in v1.1.1: ONE line in renderCascadeAnchor() — toggles
   the `has-selection` class on #bdl-root so v1.1.1.css can apply
   conditional bottom padding only when an action bar is visible.
   All other behavior is identical to v1.1.0.

   v1.1.2 (next ship) = tenant filter + asset picker per Cut 2 plan.
   v1.1.3 (final)     = save wiring.

   ─── v1.1.0 (Cut 2 ship 1 — Option B action bar) ───
   1. File checkboxes on bundle rows AND loose rows. Multi-select
      across both. State tracked in S.selectedIds (Set).
   2. Bottom action bar appears when ≥1 file is checked. Sticks
      to the bottom of the Inputs panel via position:sticky.
      Two primary buttons:
        • Attach to existing  → opens cascade in 'attach' mode
        • Create new          → opens cascade in 'create' mode
      Plus a Clear link to clear all selections.
      Group-as-Bundle is OUT of this ship (deferred — no write
      actions in v1.1.0 beyond the cascade shell).
   3. Inline 2-step cascade (NOT a modal). Option B layout
      decision 2026-05-18: mode is pre-set from the action bar,
      so the cascade runs:
        Step 1  Asset Type (Article / Ad / Event / RE Listing)
        Step 2  Picker (attach mode) OR Info pane (create mode)
      Cascade header has a "Switch to X" affordance to flip the
      mode in place. Switching keeps Step 1 (type stays relevant
      for both flows), wipes Step 2 (asset choice is irrelevant
      in create mode).
   4. Banner removed entirely. Replaced with a single refresh
      icon button inline-right with the FIRST section label
      (Bundles section if present, else Loose Files). Bundle
      count, loose count, and freshness time are gone — the
      operator scans the surface for what they need.
   5. Drop 30s staleness auto-refetch on visibilitychange.
      Refetch only on:
        • First panel activation (data not yet loaded)
        • Operator clicks the refresh icon
      Manual refresh only.
   6. Save button stubbed: console.log of the would-be Scenario K
      payload, plus a transient banner. No fetch to Scenario K
      yet. Save wiring lands in v1.1.2.
   7. Uses ix-form-controls-v1.0.0 primitives:
        • ix-chip + ix-chip--changed   (Step 1 Asset Type)
        • ix-picker + ix-picker-input + ix-picker-input--changed
          + ix-picker-list + ix-picker-option (Step 2 attach)
        • ix-revert                    (per-step Change + footer
          Cancel + cascade header mode-switch)
      Plus ix-buttons:
        • ix-btn--secondary            (Attach to existing)
        • ix-btn--primary              (Create new)
        • ix-btn--primary + --gold     (cascade Save)
        • ix-btn--ghost + --icon       (refresh icon)
   8. Tenant filtering of bundle list unchanged from v1.0.1
      (filter by title-admin === TA_CONFIG.titleAdminId via
      buildAssetLookup → renders only tenant MEDIA).
      Picker asset filtering NOT implemented in v1.1.0 — picker
      shows ALL assets from Scenario I response. Two-hop tenant
      traversal for picker lands in v1.1.1.

   ─── Hardcoding inventory ───
   HC-NEW · SCENARIO_I_FALLBACK — Scenario I webhook URL
     fallback (WLN-pinned). Carried forward from v1.0.0/v1.0.1.
     Removed when TA_CONFIG.makeBundles ships in the Webflow
     template. No new tenant-specific hardcoding introduced
     in v1.1.0.

   ─── Page load order on T-A page ───
     1. ta-studio-v1.4.0.js              (creates Inputs panel)
     2. ta-asf-v1.0.16.js                (provides window.InbxASF for create mode)
     3. ta-bundles-v1.1.7.js             (this file)
     4. ta-bundles-v1.1.7.css            (paired — full replacement
                                          of v1.1.6.css; remove the
                                          old <link>)
     5. ix-form-controls-v1.0.0.css      (chips/picker/revert)
     6. ix-buttons-v1.0.4.css            (action bar buttons)

   ──────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var FILE_VERSION = '3.0.0';
  var DEBUG        = false;

  // ─── Scenario I config (unchanged from v1.0.1) ───
  var SCENARIO_I_FALLBACK = 'https://hook.us1.make.com/fkqas4u7bptpo7a3up1knqur8i9xtfwj';

  function _cfg() {
    return (typeof window !== 'undefined' && window.TA_CONFIG) ? window.TA_CONFIG : {};
  }

  function _scenarioIUrl() {
    var cfg = _cfg();
    if (cfg.makeBundles && typeof cfg.makeBundles === 'string') return cfg.makeBundles;
    if (DEBUG) console.warn('[InbxBundles] TA_CONFIG.makeBundles missing — using hardcoded fallback (HC-NEW)');
    return SCENARIO_I_FALLBACK;
  }

  // ─── Constants (multi-tenant safe — universal labels/slugs) ───
  // Asset type chip val → Scenario I response key
  var TYPE_TO_ASSETS_KEY = {
    article: 'articles',
    ad:      'ads',
    event:   'events',
    re:      'reListings'
  };
  // Asset type chip val → human-readable label
  var TYPE_LABELS = {
    article: 'Article',
    ad:      'Ad',
    event:   'Event',
    re:      'RE Listing'
  };

  // ─── State ───
  var S = {
    loading:       false,
    error:         null,
    data:          null,
    tenantId:      null,
    lastFetchAt:   0,
    expanded:      {},
    mounted:       false,
    // ── New in v1.1.0 ──
    selectedIds:   {},    // medaItemId → true (Set-like; using object for IE compat)
    cascade:       null,  // null when collapsed
                          // when open: { mode, type, assetId, assetName }
                          //   mode:      'attach' | 'create'
                          //   type:      'article' | 'ad' | 'event' | 're' | null
                          //   assetId:   string | null   (attach only)
                          //   assetName: string | null   (attach only — display text)
    // ── New in v1.2.0 (TD-183) ──
    bundleFilters: {},    // bundleId → 'available' | 'attached'; default 'available' when undefined
    looseFilter:   'available',  // single value for the loose tray
    // ── New in v1.3.0 (subtabs + archive) ──
    l1:            'loose',       // 'bundles' | 'loose'  — top-level tab (loose-first per v2.1.0)
    l2Bundles:     'pending',     // 'pending'|'partial'|'fully_assigned'|'archived'
    l2Loose:       'available',   // 'available'|'used'|'archived'
    replaceModal:  null   // null when no modal. When open:
                          //   { collisions: [{ mediaId, mediaFilename,
                          //                    existingAssetId, existingAssetName,
                          //                    skip: false }],
                          //     originalPayload: <Scenario K payload object>,
                          //     submitting: false,
                          //     error: null }
  };

  // ─── v1.2.0 · TD-183 status filter constants (with TA_CONFIG fallback) ───

  // Resolve the MEDIA.status hash for 'Available' / 'Attached'. Source of
  // truth: TA_CONFIG.optionIds.mediaStatus.{available,attached} (documented
  // in platform-data-reference §7c). If TA_CONFIG is missing the option
  // map at runtime, fall back to string-label matching against the field's
  // displayed value ('Available' / 'Attached').
  function _mediaStatusHash(which) {
    var cfg = _cfg();
    var ids = (cfg.optionIds && cfg.optionIds.mediaStatus) || {};
    return ids[which] || null;
  }

  // Read the status value from a MEDIA item, normalized to one of:
  //   'available' | 'attached' | 'other'
  // 'other' covers archived + anything we don't recognize so filter logic
  // can route those somewhere predictable (currently: hidden from both
  // chips). Matching: prefer hash equality (multi-tenant safe), fall back
  // to case-insensitive string equality on the literal value.
  function readMediaStatus(mediaItem) {
    var fd = (mediaItem && mediaItem.fieldData) || {};
    var raw = fd.status;
    if (raw == null || raw === '') return 'other';

    var availHash = _mediaStatusHash('available');
    var attHash   = _mediaStatusHash('attached');
    var archHash  = _mediaStatusHash('archived');
    if (availHash && raw === availHash) return 'available';
    if (attHash   && raw === attHash)   return 'attached';
    if (archHash  && raw === archHash)  return 'archived';

    // String fallback (case-insensitive)
    var s = String(raw).trim().toLowerCase();
    if (s === 'available') return 'available';
    if (s === 'attached')  return 'attached';
    if (s === 'archived')  return 'archived';
    return 'other';
  }

  // True when a MEDIA item is a text-type body MEDIA that's already
  // attached — these are the §11.4 re-attach guard targets. Detection:
  //   media-type === 'text' (case-insensitive label OR documented hash)
  //   AND status === 'attached'
  // We don't have the text media-type hash in TA_CONFIG today; string
  // match on the label is the canonical path. If the hash lands later in
  // TA_CONFIG.optionIds.mediaType.text, this function can prefer it.
  function isTextTypeAttachedGuard(mediaItem) {
    if (readMediaStatus(mediaItem) !== 'attached') return false;
    var fd = (mediaItem && mediaItem.fieldData) || {};
    var rawType = fd['media-type'];
    if (rawType == null) return false;
    var cfg = _cfg();
    var textHash = ((cfg.optionIds && cfg.optionIds.mediaType) || {}).text;
    if (textHash && rawType === textHash) return true;
    var s = String(rawType).trim().toLowerCase();
    return s === 'text';
  }

  // Group a media list by status for chip counts.
  function countByStatus(items) {
    var c = { available: 0, attached: 0, other: 0 };
    if (!items) return c;
    for (var i = 0; i < items.length; i++) {
      c[readMediaStatus(items[i])]++;
    }
    return c;
  }

  // Apply a status filter to a media list. Filter values: 'available' |
  // 'attached'. 'other' items are excluded from both views (archived etc.).
  function filterMediaByStatus(items, filter) {
    if (!items) return [];
    if (filter !== 'available' && filter !== 'attached') filter = 'available';
    return items.filter(function (m) { return readMediaStatus(m) === filter; });
  }

  // Get the active filter for a given scope.
  //   scope is 'bundle:<bundleId>' or 'loose'.
  function getFilterFor(scope) {
    if (scope === 'loose') return S.looseFilter || 'available';
    if (scope && scope.indexOf('bundle:') === 0) {
      var id = scope.slice(7);
      return S.bundleFilters[id] || 'available';
    }
    return 'available';
  }

  // Set the active filter for a given scope, then re-render.
  function setFilterFor(scope, value) {
    if (value !== 'available' && value !== 'attached') return;
    if (scope === 'loose') {
      if (S.looseFilter === value) return;
      S.looseFilter = value;
    } else if (scope && scope.indexOf('bundle:') === 0) {
      var id = scope.slice(7);
      if ((S.bundleFilters[id] || 'available') === value) return;
      S.bundleFilters[id] = value;
    }
    render();
  }

  // Reset a scope's filter to the default ('available').
  function resetFilterFor(scope) {
    if (scope === 'loose') {
      if (S.looseFilter === 'available') return;
      S.looseFilter = 'available';
    } else if (scope && scope.indexOf('bundle:') === 0) {
      var id = scope.slice(7);
      if (!(id in S.bundleFilters) || S.bundleFilters[id] === 'available') return;
      delete S.bundleFilters[id];
    }
    render();
  }

  // ─── Lifecycle ───

  function init() {
    installMount();
    watchPanelActivation();
    // v1.1.3: keep cascade anchor aligned to #bdl-root on viewport resize
    window.addEventListener('resize', syncCascadeAnchorToContainer);
    // v1.0.1 had watchVisibility() with 30s staleness refetch — removed in v1.1.0.
    if (window.console && console.log) console.log('[Intake] v' + FILE_VERSION + ' loaded (ta-intake-manager) — row thumbnails + TEXT tiles, bigger refresh, stronger dot; loose-first, activity dots, auto-refresh; subtabs + archive/restore + attach/create cascade');
  }

  function installMount() {
    var panel = document.querySelector('[data-std-panel-body="input"]');
    if (!panel) {
      if (!S._installAttempts) S._installAttempts = 0;
      S._installAttempts++;
      if (S._installAttempts < 40) {
        setTimeout(installMount, 250);
      } else {
        console.warn('[InbxBundles] Studio Inputs panel not found after 10s — cannot mount');
      }
      return;
    }
    if (panel.querySelector('#bdl-root')) {
      S.mounted = true;
      return;
    }
    var root = document.createElement('div');
    root.id = 'bdl-root';
    panel.appendChild(root);
    S.mounted = true;

    if (panel.classList.contains('active')) {
      fetchAndRender();
    }
  }

  function watchPanelActivation() {
    var panel = document.querySelector('[data-std-panel-body="input"]');
    if (!panel) {
      setTimeout(watchPanelActivation, 300);
      return;
    }
    var wasActive = panel.classList.contains('active');
    var obs = new MutationObserver(function () {
      var isActive = panel.classList.contains('active');
      if (isActive && !wasActive) onPanelActivated();
      wasActive = isActive;
    });
    obs.observe(panel, { attributes: true, attributeFilter: ['class'] });
  }

  function onPanelActivated() {
    if (!S.mounted) installMount();
    // v1.0.1 had staleness check (>30s → refetch). Removed in v1.1.0 —
    // refetch only on first activation (no data yet) or explicit click.
    if (!S.data) {
      fetchAndRender();
    } else {
      render();
    }
  }

  // ─── Fetch (unchanged from v1.0.1) ───

  function fetchAndRender() {
    if (S.loading) return;
    var cfg = _cfg();
    var titleSlug = cfg.titleSlug;
    if (!titleSlug) {
      S.error   = 'TA_CONFIG.titleSlug missing — cannot identify tenant';
      S.loading = false;
      render();
      return;
    }
    S.loading = true;
    S.error   = null;
    render();

    fetch(_scenarioIUrl(), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ titleSlug: titleSlug })
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Scenario I returned ' + res.status);
      return res.json();
    })
    .then(function (data) {
      if (!data || data.ok !== true) {
        throw new Error('Scenario I response missing ok=true');
      }
      S.data        = data;
      S.tenantId    = (data.tenant && data.tenant.titleAdminId) || null;
      S.lastFetchAt = Date.now();
      S.loading     = false;
      S.error       = null;
      // Stale selections after a refresh: prune IDs no longer present in data.
      // This keeps the cascade from referring to MEDIA that vanished server-side.
      pruneStaleSelections();
      // v1.2.0 · TD-183.2: any open replace modal references collision data
      // computed against the previous data snapshot. Close it on refresh so
      // the operator doesn't act on stale collision info.
      if (S.replaceModal) {
        S.replaceModal = null;
        renderReplaceModalAnchor();
      }
      render();
    })
    .catch(function (err) {
      console.error('[InbxBundles] fetch error:', err);
      S.loading = false;
      S.error   = err.message || 'Network error';
      render();
    });
  }

  // ─── Data processing (unchanged from v1.0.1) ───

  function mergeMedia(data) {
    var a = (data && Array.isArray(data.media))      ? data.media      : [];
    var b = (data && Array.isArray(data.mediaExtra)) ? data.mediaExtra : [];
    return a.concat(b);
  }

  function filterByTenant(items, tenantId) {
    if (!tenantId) return items;
    return items.filter(function (item) {
      var fd = item && item.fieldData;
      return fd && fd['title-admin'] === tenantId;
    });
  }

  function groupByBundle(items) {
    var groups = {};
    var order  = [];
    items.forEach(function (m) {
      var fd = m.fieldData || {};
      var bid = fd['bundle-id'];
      if (!bid) return;
      if (!groups[bid]) {
        groups[bid] = { id: bid, label: fd['bundle-label'] || bid, items: [] };
        order.push(bid);
      }
      groups[bid].items.push(m);
    });
    return order.map(function (id) { return groups[id]; });
  }

  function findLoose(items) {
    return items.filter(function (m) {
      var fd = m.fieldData || {};
      return !fd['bundle-id'];
    });
  }

  function buildAssetLookup(data) {
    function indexBy(arr) {
      var idx = {};
      if (!Array.isArray(arr)) return idx;
      arr.forEach(function (rec) { if (rec && rec.id) idx[rec.id] = rec; });
      return idx;
    }
    return {
      articles:   indexBy(data.articles),
      ads:        indexBy(data.ads),
      events:     indexBy(data.events),
      reListings: indexBy(data.reListings)
    };
  }

  function assetDisplayName(rec) {
    if (!rec) return null;
    var fd = rec.fieldData || {};
    return fd.name || fd.slug || rec.id;
  }

  // For picker meta line — best-effort, non-fatal if missing.
  function assetMetaLine(rec) {
    if (!rec) return '';
    var fd = rec.fieldData || {};
    return fd['issue-label'] || fd['publish-date'] || fd.slug || '';
  }

  function getMediaAssetRefs(mediaItem, lookup) {
    var fd = mediaItem.fieldData || {};
    var refs = [];
    var seen = {};

    function push(type, id, registry) {
      if (!id) return;
      var key = type + ':' + id;
      if (seen[key]) return;
      seen[key] = true;
      var rec = registry[id];
      refs.push({ type: type, id: id, name: assetDisplayName(rec) || id });
    }

    if (fd.article) push('article', fd.article, lookup.articles);
    Object.keys(lookup.articles).forEach(function (aid) {
      var art = lookup.articles[aid];
      var mi = art.fieldData && art.fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) push('article', aid, lookup.articles);
    });

    if (Array.isArray(fd.ads)) {
      fd.ads.forEach(function (id) { push('ad', id, lookup.ads); });
    }
    Object.keys(lookup.ads).forEach(function (aid) {
      var ad = lookup.ads[aid];
      var mi = ad.fieldData && ad.fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) push('ad', aid, lookup.ads);
    });

    if (Array.isArray(fd.events)) {
      fd.events.forEach(function (id) { push('event', id, lookup.events); });
    }
    Object.keys(lookup.events).forEach(function (eid) {
      var ev = lookup.events[eid];
      var mi = ev.fieldData && ev.fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) push('event', eid, lookup.events);
    });

    var reField = fd['re-listing'];
    if (Array.isArray(reField)) {
      reField.forEach(function (id) { push('re', id, lookup.reListings); });
    } else if (typeof reField === 'string' && reField) {
      push('re', reField, lookup.reListings);
    }
    Object.keys(lookup.reListings).forEach(function (rid) {
      var re = lookup.reListings[rid];
      var mi = re.fieldData && re.fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) push('re', rid, lookup.reListings);
    });

    return refs;
  }

  function computeBundleStatus(items, lookup) {
    if (!items || !items.length) return 'pending';
    // v1.3.0: whole-bundle archived → its own bucket.
    var allArchived = true;
    for (var k = 0; k < items.length; k++) {
      if (readMediaStatus(items[k]) !== 'archived') { allArchived = false; break; }
    }
    if (allArchived) return 'archived';
    // v1.3.0 · "archived counts as resolved": an item is resolved if it has
    // an asset ref OR its status is attached OR archived. (attached/archived
    // are durable signals; ref-lookup can miss across pagination.)
    var assignedCount = 0;
    for (var i = 0; i < items.length; i++) {
      var st = readMediaStatus(items[i]);
      if (st === 'attached' || st === 'archived' || getMediaAssetRefs(items[i], lookup).length > 0) {
        assignedCount++;
      }
    }
    if (assignedCount === 0)            return 'pending';
    if (assignedCount === items.length) return 'fully_assigned';
    return 'partial';
  }

  // v1.3.0 · Loose-file bucket for the Loose subtabs.
  function looseBucketOf(item, lookup) {
    var st = readMediaStatus(item);
    if (st === 'archived') return 'archived';
    if (st === 'attached' || getMediaAssetRefs(item, lookup).length > 0) return 'used';
    return 'available';
  }
  function countBundlesByStatus(bundles, lookup) {
    var c = { pending: 0, partial: 0, fully_assigned: 0, archived: 0 };
    bundles.forEach(function (b) { c[computeBundleStatus(b.items, lookup)]++; });
    return c;
  }
  function countLooseByBucket(loose, lookup) {
    var c = { available: 0, used: 0, archived: 0 };
    loose.forEach(function (f) { c[looseBucketOf(f, lookup)]++; });
    return c;
  }

  // ─── Selection helpers (v1.1.0) ───

  function isFileSelected(mediaId) {
    return S.selectedIds[mediaId] === true;
  }

  function selectedCount() {
    return Object.keys(S.selectedIds).length;
  }

  function selectedIdsArray() {
    return Object.keys(S.selectedIds);
  }

  function toggleFileSelection(mediaId) {
    // v1.2.0 · TD-183.4: defense-in-depth guard against text-type re-attach.
    // The disabled checkbox attribute is the primary block, but if anything
    // routes through this function (programmatic, dev console, etc.) the
    // guard still applies.
    var media = _findMediaById(mediaId);
    if (media && isTextTypeAttachedGuard(media)) {
      if (DEBUG) console.warn('[InbxBundles v' + FILE_VERSION + '] toggle blocked: text-type already attached', mediaId);
      return;
    }

    if (S.selectedIds[mediaId]) {
      delete S.selectedIds[mediaId];
    } else {
      S.selectedIds[mediaId] = true;
    }
    // If we just dropped to 0, also close the cascade.
    if (selectedCount() === 0 && S.cascade) {
      S.cascade = null;
    }
    renderCascadeAnchor();
    // Also need to update the row's is-selected class. Cheapest is a
    // surgical row update; doing a full render works but feels heavy.
    var row = document.querySelector('[data-bdl-row-mid="' + cssEscape(mediaId) + '"]');
    if (row) row.classList.toggle('is-selected', isFileSelected(mediaId));
  }

  // v1.2.0: tiny helper for guard lookup. Scans the current S.data — cheap
  // because we already merge media on every render.
  function _findMediaById(mediaId) {
    if (!S.data) return null;
    var all = mergeMedia(S.data);
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === mediaId) return all[i];
    }
    return null;
  }

  function clearAllSelections() {
    S.selectedIds = {};
    S.cascade = null;
    render();
  }

  function pruneStaleSelections() {
    if (selectedCount() === 0) return;
    var allMedia = mergeMedia(S.data);
    var present = {};
    allMedia.forEach(function (m) { present[m.id] = true; });
    Object.keys(S.selectedIds).forEach(function (id) {
      if (!present[id]) delete S.selectedIds[id];
    });
    if (selectedCount() === 0 && S.cascade) S.cascade = null;
  }

  // ─── Cascade controllers (v1.1.0) ───

  function openCascade(mode) {
    if (selectedCount() === 0) return;
    S.cascade = { mode: mode, type: null, assetId: null, assetName: null };
    renderCascadeAnchor();
  }

  function closeCascade() {
    // Cancel = collapse cascade, keep selections (operator can retry).
    S.cascade = null;
    renderCascadeAnchor();
  }

  function switchCascadeMode(newMode) {
    if (!S.cascade) return;
    if (S.cascade.mode === newMode) return;
    S.cascade.mode = newMode;
    // Switching modes wipes the asset choice (irrelevant in create mode).
    // Step 1 (type) persists — same asset type works for both flows.
    S.cascade.assetId = null;
    S.cascade.assetName = null;
    renderCascadeAnchor();
  }

  function selectStep1Type(type) {
    if (!S.cascade) return;
    if (!TYPE_TO_ASSETS_KEY[type]) return;
    // Changing type wipes Step 2 (existing pick is irrelevant for the new type).
    if (S.cascade.type !== type) {
      S.cascade.assetId = null;
      S.cascade.assetName = null;
    }
    S.cascade.type = type;
    renderCascadeAnchor();
  }

  function selectStep2Asset(assetId, assetName) {
    if (!S.cascade) return;
    S.cascade.assetId = assetId;
    S.cascade.assetName = assetName;
    renderCascadeAnchor();
  }

  function revertCascadeStep(n) {
    if (!S.cascade) return;
    if (n === 1) {
      S.cascade.type = null;
      S.cascade.assetId = null;
      S.cascade.assetName = null;
    } else if (n === 2) {
      S.cascade.assetId = null;
      S.cascade.assetName = null;
    }
    renderCascadeAnchor();
  }

  // v1.1.5: Real save wiring. Routes by mode:
  //   attach → POST to Scenario K (TA_CONFIG.makeAttachFiles)
  //   create → defer to window.InbxASF.open(...)
  function saveCascade() {
    if (!S.cascade) return;
    if (S.cascade.saving) return;        // re-entrancy guard
    var c = S.cascade;
    if (c.mode === 'attach') {
      doAttachSave(c);
    } else {
      doCreateOpen(c);
    }
  }

  // v1.1.6: pick the Webflow collection ID for the given asset type from
  // TA_CONFIG.wfColl. Scenario K's TENANT-VALIDATION compares this against
  // the tenant config datastore's wfColl* fields; if they don't match,
  // the AttachMode filter blocks the request.
  function getAssetCollId(type, wfColl) {
    if (!wfColl) return null;
    switch (type) {
      case 'article': return wfColl.articles;
      case 'ad':      return wfColl.ads;
      case 'event':   return wfColl.events;
      case 're':      return wfColl.realEstate;
      default:        return null;
    }
  }

  function doAttachSave(c, forceReplace) {
    var cfg = _cfg();
    var url = cfg.makeAttachFiles;
    if (!url || typeof url !== 'string') {
      flashCascadeStatus(
        'Configuration error: TA_CONFIG.makeAttachFiles is missing. Cannot save.',
        'error'
      );
      return;
    }
    if (!c.type || !c.assetId) {
      flashCascadeStatus('Pick an asset before saving.', 'error');
      return;
    }
    var mediaIds = selectedIdsArray();
    if (!mediaIds.length) {
      flashCascadeStatus('No files selected.', 'error');
      return;
    }

    // v1.1.6: required by Scenario K TENANT-VALIDATION (id=4 in blueprint).
    // Both must be present and must match the tenant config datastore.
    var wfColl      = cfg.wfColl || {};
    var assetCollId = getAssetCollId(c.type, wfColl);
    var mediaCollId = wfColl.media;
    if (!assetCollId || !mediaCollId) {
      flashCascadeStatus(
        'Configuration error: TA_CONFIG.wfColl is missing or incomplete (need articles, ads, events, realEstate, media). Cannot save.',
        'error'
      );
      return;
    }

    // v1.2.0 · TD-183.1: payload extensions
    var mediaStatusAttachedHash = _mediaStatusHash('attached');
    if (!mediaStatusAttachedHash) {
      // Not fatal — Scenario K Module #50 has a derive-fields safety net
      // that handles this constant when the client doesn't send it. Log
      // a warning so the config gap is visible during the TA_CONFIG cutover.
      if (DEBUG) console.warn('[InbxBundles v' + FILE_VERSION + '] TA_CONFIG.optionIds.mediaStatus.attached missing; relying on Scenario K module #50 derivation');
    }
    var force = forceReplace === true;

    var payload = {
      mode:                'attach',
      assetType:           c.type,
      assetId:             c.assetId,
      assetCollId:         assetCollId,
      mediaIds:            mediaIds,
      mediaCollId:         mediaCollId,
      tenantId:            S.tenantId,
      titleSlug:           cfg.titleSlug || null,
      // v1.2.0 · TD-183.1 additions ──────────────────────────────
      mediaStatusAttached: mediaStatusAttachedHash,   // may be null on cutover
      forceReplace:        force
    };

    // v1.2.0 · TD-183.2: SRF preflight collision check for article attach.
    // For 'article' assetType (SRF on MEDIA.article), check whether any
    // selected MEDIA already has a different article set. If so, surface
    // the aggregated ALREADY_LINKED_ELSEWHERE modal — submit is deferred
    // until the operator confirms (modal calls doAttachSave with
    // forceReplace=true). MRF asset types (ad/event/re) skip the check
    // since MRF can hold multiple back-references; no collision possible.
    if (c.type === 'article' && !force) {
      var collisions = detectArticleCollisions(mediaIds, c.assetId);
      if (collisions.length > 0) {
        openReplaceModal(collisions, payload);
        return;
      }
    }

    setCascadeSaving(true);
    flashCascadeStatus('Saving\u2026', 'saving');

    fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Scenario K returned HTTP ' + res.status);
      // Defensive: response body might be JSON or plain text.
      return res.text().then(function (txt) {
        if (!txt) return { ok: true };
        try { return JSON.parse(txt); }
        catch (e) { return { ok: true, _raw: txt }; }
      });
    })
    .then(function (data) {
      // Treat as success unless explicit ok=false
      if (data && data.ok === false) {
        throw new Error(data.error || data.message || 'Scenario K reported failure');
      }
      var assetName = c.assetName || 'asset';
      var n = mediaIds.length;
      flashCascadeStatus(
        '\u2713 Attached ' + n + ' file' + (n === 1 ? '' : 's') +
          ' to \u201C' + assetName + '\u201D. Refreshing\u2026',
        'success'
      );
      // Brief pause so the operator sees the confirmation, then close + refresh.
      setTimeout(function () {
        S.cascade = null;
        S.selectedIds = {};
        renderCascadeAnchor();
        fetchAndRender();
      }, 900);
    })
    .catch(function (err) {
      console.error('[InbxBundles v' + FILE_VERSION + '] save error:', err);
      setCascadeSaving(false);
      flashCascadeStatus('Failed: ' + (err.message || 'network error'), 'error');
    });
  }

  // v1.2.0 · TD-183.2 · Inspect selected MEDIA against the new article
  // target. Returns an array of collision objects:
  //   [{ mediaId, mediaFilename, existingAssetId, existingAssetName }, ...]
  // Empty array = no collisions (proceed with normal attach).
  function detectArticleCollisions(mediaIds, newAssetId) {
    var collisions = [];
    if (!S.data || !mediaIds || !mediaIds.length) return collisions;

    var all = mergeMedia(S.data);
    var byId = {};
    for (var i = 0; i < all.length; i++) byId[all[i].id] = all[i];

    var lookup = buildAssetLookup(S.data);

    for (var j = 0; j < mediaIds.length; j++) {
      var mid = mediaIds[j];
      var m = byId[mid];
      if (!m) continue;
      var fd = m.fieldData || {};
      var existingArticleId = fd.article;
      // No existing reference, or same target → no collision.
      if (!existingArticleId) continue;
      if (existingArticleId === newAssetId) continue;

      // Look up existing article's display name from the asset cache.
      var existingName = null;
      if (lookup && lookup.articles && lookup.articles[existingArticleId]) {
        existingName = assetDisplayName(lookup.articles[existingArticleId]);
      }

      collisions.push({
        mediaId:          mid,
        mediaFilename:    (fd['original-filename'] || fd.name || mid),
        existingAssetId:  existingArticleId,
        existingAssetName: existingName,   // null if not in current Scenario I response
        skip:             false
      });
    }
    return collisions;
  }

  // v1.2.0 · TD-183.2 · Modal open / close / confirm.
  function openReplaceModal(collisions, originalPayload) {
    S.replaceModal = {
      collisions:      collisions,
      originalPayload: originalPayload,
      submitting:      false,
      error:           null
    };
    renderReplaceModalAnchor();
  }

  function closeReplaceModal() {
    S.replaceModal = null;
    renderReplaceModalAnchor();
  }

  function toggleReplaceCollisionSkip(mediaId) {
    if (!S.replaceModal) return;
    var col = S.replaceModal.collisions;
    for (var i = 0; i < col.length; i++) {
      if (col[i].mediaId === mediaId) {
        col[i].skip = !col[i].skip;
        break;
      }
    }
    renderReplaceModalAnchor();
  }

  function confirmReplaceModal() {
    if (!S.replaceModal) return;
    if (S.replaceModal.submitting) return;
    var m = S.replaceModal;

    // Build the effective mediaIds list — skip any operator-flagged collisions.
    var skipSet = {};
    m.collisions.forEach(function (col) {
      if (col.skip) skipSet[col.mediaId] = true;
    });
    var origIds = m.originalPayload.mediaIds || [];
    var effectiveIds = origIds.filter(function (id) { return !skipSet[id]; });

    if (!effectiveIds.length) {
      // Operator chose to skip everything. Nothing to do — close modal
      // and return to picker with selections intact.
      closeReplaceModal();
      flashCascadeStatus(
        'All collisions skipped \u2014 nothing to attach. Adjust selection or pick a different asset.',
        'error'
      );
      return;
    }

    // Rebuild the cascade context for the retry. We need to send via
    // doAttachSave so the success path runs uniformly. Temporarily
    // patch S.selectedIds to match effectiveIds, then restore on
    // resolve.
    var prevSelected = S.selectedIds;
    var nextSelected = {};
    effectiveIds.forEach(function (id) { nextSelected[id] = true; });
    S.selectedIds = nextSelected;

    // Close the modal before the network call kicks off — operator sees
    // the cascade footer "Saving..." state, not a stuck modal.
    S.replaceModal = null;
    renderReplaceModalAnchor();

    // Recover the cascade pointer (modal was opened while cascade was
    // open; that hasn't changed).
    if (!S.cascade) {
      // Defensive: cascade went away mid-flight. Restore + bail.
      S.selectedIds = prevSelected;
      flashCascadeStatus(
        'Lost cascade state \u2014 please reopen Attach and try again.',
        'error'
      );
      return;
    }

    doAttachSave(S.cascade, /* forceReplace */ true);

    // Note: we don't restore prevSelected on success — the success path
    // clears selections (S.selectedIds = {}) as part of close + refetch.
    // On failure the new selection set (effectiveIds) is what the
    // operator sees, which is the right state to retry from.
  }

  function renderReplaceModalAnchor() {
    var anchor = document.getElementById('bdl-replace-modal-anchor');
    if (!anchor) {
      // Create the anchor lazily — appended to body so it floats above
      // all bundles content + cascade.
      anchor = document.createElement('div');
      anchor.id = 'bdl-replace-modal-anchor';
      document.body.appendChild(anchor);
    }
    if (!S.replaceModal) {
      anchor.innerHTML = '';
      return;
    }
    anchor.innerHTML = renderReplaceModal(S.replaceModal);
  }

  function renderReplaceModal(m) {
    var n = m.collisions.length;
    var titleText = (n === 1)
      ? 'Already linked to another article'
      : n + ' files already linked to other articles';
    var leadText = (n === 1)
      ? '<strong>' + escHtml(m.collisions[0].mediaFilename) +
        '</strong> is already attached to a different article. Replacing will detach it from there and attach it here.'
      : '<strong>' + n + ' of the selected files</strong> are already attached to other articles. Replacing will detach them from those articles and attach them here. You can <em>skip</em> any you want to leave alone.';

    var skipCount = 0;
    var rowsHtml = m.collisions.map(function (col) {
      if (col.skip) skipCount++;
      var nameBlock = col.existingAssetName
        ? '<div class="bdl-replace-target-text">' +
            '<strong>' + escHtml(col.mediaFilename) + '</strong>' +
            '<span class="bdl-replace-target-arrow"> &rarr; currently linked to </span>' +
            '<strong>\u201C' + escHtml(col.existingAssetName) + '\u201D</strong>' +
          '</div>' +
          '<div class="bdl-replace-target-meta">article \u00b7 ' + escHtml(col.existingAssetId) + '</div>'
        : '<div class="bdl-replace-target-text">' +
            '<strong>' + escHtml(col.mediaFilename) + '</strong>' +
            '<span class="bdl-replace-target-arrow"> &rarr; currently linked to </span>' +
            '<strong>article \u00b7 ' + escHtml(col.existingAssetId) + '</strong>' +
          '</div>' +
          '<div class="bdl-replace-target-meta">name lookup unavailable</div>';

      var rowCls = 'bdl-replace-target-card' + (col.skip ? ' is-skipped' : '');
      return (
        '<label class="' + rowCls + '">' +
          (n > 1
            ? '<input type="checkbox" class="bdl-replace-skip-check"' +
                ' data-bdl-replace-skip="' + escAttr(col.mediaId) + '"' +
                (col.skip ? ' checked' : '') + '>'
            : '') +
          '<span class="bdl-replace-target-icon">\ud83d\udcc4</span>' +
          '<div class="bdl-replace-target-body">' +
            nameBlock +
          '</div>' +
        '</label>'
      );
    }).join('');

    var hasAnyLookupFailure = m.collisions.some(function (col) { return !col.existingAssetName; });
    var errorBlock = hasAnyLookupFailure
      ? '<div class="bdl-replace-error">' +
          '\u26a0 <strong>One or more article names could not be looked up.</strong> The article exists ' +
          'but isn\u2019t in the current bundles snapshot \u2014 possibly out of the current title scope ' +
          'or beyond pagination. Replace will still work.' +
        '</div>'
      : '';

    var effectiveCount = n - skipCount;
    var confirmLabel = (effectiveCount === 0)
      ? 'Replace \u2014 0 selected'
      : (effectiveCount === 1
          ? 'Replace \u2014 attach 1 here'
          : 'Replace \u2014 attach ' + effectiveCount + ' here');
    var confirmDisabled = (effectiveCount === 0);
    var multiHint = (n > 1)
      ? '<div class="bdl-replace-multi-hint">' +
          'Uncheck any file you want to leave alone. Currently: ' +
          '<strong>' + effectiveCount + '</strong> will be re-attached, ' +
          '<strong>' + skipCount + '</strong> will be skipped.' +
        '</div>'
      : '';

    return (
      '<div class="bdl-replace-modal-bg" data-bdl-replace-modal-bg>' +
        '<div class="bdl-replace-modal" role="dialog" aria-modal="true" aria-labelledby="bdl-replace-title">' +
          '<div class="bdl-replace-modal-head">' +
            '<h3 id="bdl-replace-title" class="bdl-replace-modal-title">' +
              escHtml(titleText) +
            '</h3>' +
          '</div>' +
          '<div class="bdl-replace-modal-body">' +
            '<p class="bdl-replace-lead">' + leadText + '</p>' +
            multiHint +
            '<div class="bdl-replace-target-list">' + rowsHtml + '</div>' +
            errorBlock +
          '</div>' +
          '<div class="bdl-replace-modal-foot">' +
            '<button class="bdl-replace-cancel ix-revert" data-bdl-replace-cancel>' +
              'Cancel \u00b7 keep current attachment' + (n === 1 ? '' : 's') +
            '</button>' +
            '<button class="bdl-replace-confirm"' +
              ' data-bdl-replace-confirm' +
              (confirmDisabled ? ' disabled' : '') + '>' +
              escHtml(confirmLabel) +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function doCreateOpen(c) {
    if (!c.type) {
      flashCascadeStatus('Pick an Asset Type before continuing.', 'error');
      return;
    }
    var mediaIds = selectedIdsArray();
    if (!mediaIds.length) {
      flashCascadeStatus('No files selected.', 'error');
      return;
    }
    if (!window.InbxASF || typeof window.InbxASF.open !== 'function') {
      console.warn('[InbxBundles v' + FILE_VERSION + '] window.InbxASF.open not available; load ta-asf before ta-bundles');
      flashCascadeStatus(
        'Asset Form is not loaded on this page. Refresh and try again.',
        'error'
      );
      return;
    }
    setCascadeSaving(true);
    flashCascadeStatus('Opening Asset Form\u2026', 'saving');
    try {
      window.InbxASF.open({
        mode:              'create',
        assetType:         c.type,
        prefilledMediaIds: mediaIds,
        tenantId:          S.tenantId
      });
      // ASF takes over from here. Close cascade + clear selections so the
      // bundles surface is clean when the operator returns.
      setTimeout(function () {
        S.cascade = null;
        S.selectedIds = {};
        renderCascadeAnchor();
      }, 400);
      // v2.1.0: auto-refresh on ASF close. ASF creates the asset in its
      // overlay; when it closes (operator saved or backed out), refetch so
      // any now-attached images visibly leave the Awaiting bucket. Polls
      // InbxASF.isOpen(); gives up after ~5 min to avoid a zombie timer.
      if (typeof window.InbxASF.isOpen === 'function') {
        var waited = 0;
        var poll = setInterval(function () {
          waited += 600;
          var stillOpen = false;
          try { stillOpen = window.InbxASF.isOpen(); } catch (e) { stillOpen = false; }
          if (!stillOpen) {
            clearInterval(poll);
            fetchAndRender();   // refetch → consumed images drop out of Awaiting
          } else if (waited > 300000) {
            clearInterval(poll);
          }
        }, 600);
      }
    } catch (err) {
      console.error('[InbxBundles v' + FILE_VERSION + '] InbxASF.open threw:', err);
      setCascadeSaving(false);
      flashCascadeStatus('Could not open Asset Form: ' + (err.message || 'unknown error'), 'error');
    }
  }

  function setCascadeSaving(saving) {
    if (S.cascade) S.cascade.saving = saving;
    var btn = document.querySelector('[data-bdl-cascade-save]');
    if (btn) {
      btn.disabled = saving;
      btn.classList.toggle('is-saving', saving);
    }
  }

  // Mood-coded status flash on the cascade footer. Modes:
  //   'saving' — italic dim
  //   'success' — green
  //   'error' — red
  //   default — neutral (original color)
  function flashCascadeStatus(text, mood) {
    var el = document.querySelector('[data-bdl-cascade-status]');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('is-saving', 'is-success', 'is-error', 'is-stub-confirmed');
    if (mood === 'saving')  el.classList.add('is-saving');
    if (mood === 'success') el.classList.add('is-success');
    if (mood === 'error')   el.classList.add('is-error');
  }

  // ─── Picker helpers (v1.1.0) ───

  // v1.1.2: One-hop tenant filter on assets.
  //
  // Articles use SRF associated-title (string ID) directly to TITLE-ADMIN.
  // Ads/Events/RE Listings use MRF titles (array of TITLE-ADMIN IDs).
  // For Articles: rec.fieldData['associated-title'] === S.tenantId
  // For others:   rec.fieldData['titles'] includes S.tenantId
  //
  // If S.tenantId is null (no tenant context yet), return all assets
  // unfiltered as a defensive fallback.
  function assetBelongsToTenant(rec, type, tenantId) {
    if (!tenantId) return true;
    var fd = rec && rec.fieldData;
    if (!fd) return false;
    if (type === 'article') {
      return fd['associated-title'] === tenantId;
    }
    // ad / event / re
    var titles = fd['titles'];
    return Array.isArray(titles) && titles.indexOf(tenantId) !== -1;
  }

  function getAssetsForType(type) {
    if (!S.data) return [];
    var key = TYPE_TO_ASSETS_KEY[type];
    if (!key) return [];
    var arr = S.data[key];
    if (!Array.isArray(arr)) return [];
    var tid = S.tenantId;
    return arr
      .filter(function (rec) { return assetBelongsToTenant(rec, type, tid); })
      .map(function (rec) {
        return {
          id:   rec.id,
          name: assetDisplayName(rec),
          meta: assetMetaLine(rec)
        };
      });
  }

  function filterAssets(assets, query) {
    if (!query) return assets;
    var q = String(query).toLowerCase();
    return assets.filter(function (a) {
      return (a.name || '').toLowerCase().indexOf(q) !== -1;
    });
  }

  // Surgical update — called on every keystroke in the picker input.
  // Avoids re-rendering the whole cascade (which would lose input focus).
  function renderPickerListSurgically(query) {
    if (!S.cascade || S.cascade.mode !== 'attach' || !S.cascade.type) return;
    var listEl = document.querySelector('[data-bdl-picker-list]');
    if (!listEl) return;
    var assets = filterAssets(getAssetsForType(S.cascade.type), query);
    if (!assets.length) {
      listEl.innerHTML =
        '<div class="bdl-picker-empty">No matches for "' + escHtml(query || '') + '"</div>';
    } else {
      listEl.innerHTML = assets.map(renderPickerOption).join('');
    }
    listEl.hidden = false;
  }

  function renderPickerOption(asset) {
    var meta = asset.meta
      ? '<span class="ix-picker-option-meta">' + escHtml(asset.meta) + '</span>'
      : '';
    return (
      '<button class="ix-picker-option"' +
        ' data-bdl-pick-asset' +
        ' data-asset-id="'   + escAttr(asset.id)   + '"' +
        ' data-asset-name="' + escAttr(asset.name || '') + '">' +
        escHtml(asset.name || asset.id) +
        meta +
      '</button>'
    );
  }

  // ─── Rendering ───

  function render() {
    var host = document.getElementById('bdl-root');
    if (!host) return;

    if (S.loading && !S.data) { host.innerHTML = renderLoading(); return; }
    if (S.error && !S.data)   { host.innerHTML = renderError(S.error); return; }
    if (!S.data)              { host.innerHTML = renderEmpty();      return; }

    var allMedia = mergeMedia(S.data);
    var myMedia  = filterByTenant(allMedia, S.tenantId);
    var bundles  = groupByBundle(myMedia);
    var loose    = findLoose(myMedia);
    var lookup   = buildAssetLookup(S.data);

    // ── v1.3.0: L1 tabs (Bundles | Loose files) + refresh ──
    var looseAwaiting = loose.filter(function (f) { return looseBucketOf(f, lookup) === 'available'; }).length;
    var bundleAwaiting = bundles.filter(function (b) { return computeBundleStatus(b.items, lookup) === 'pending'; }).length;
    function dot(n) { return n > 0 ? '<span class="bdl-l1-dot" title="' + n + ' awaiting"></span>' : ''; }
    var l1Html =
      '<div class="bdl-l1">' +
        '<button class="bdl-l1-tab' + (S.l1 === 'loose'   ? ' is-active' : '') + '" data-bdl-l1="loose">Loose files' + dot(looseAwaiting) + '</button>' +
        '<button class="bdl-l1-tab' + (S.l1 === 'bundles' ? ' is-active' : '') + '" data-bdl-l1="bundles">Bundles' + dot(bundleAwaiting) + '</button>' +
        '<button class="bdl-refresh-icon ix-btn ix-btn--ghost ix-btn--icon' + (S.loading ? ' is-spinning' : '') + '"' +
          ' data-bdl-refresh' + (S.loading ? ' disabled' : '') + ' title="Refresh" aria-label="Refresh">↻</button>' +
      '</div>';

    var body;
    if (S.l1 === 'bundles') {
      var bCounts = countBundlesByStatus(bundles, lookup);
      var bDefs = [['pending','Awaiting assignment'],['partial','Partially assigned'],['fully_assigned','Fully assigned'],['archived','Archived']];
      var l2Html = '<div class="bdl-l2">' + bDefs.map(function (d) {
        return '<button class="bdl-chip' + (S.l2Bundles === d[0] ? ' is-active' : '') + '" data-bdl-l2b="' + d[0] + '">' +
          escHtml(d[1]) + '<span class="bdl-chip-ct">' + (bCounts[d[0]] || 0) + '</span></button>';
      }).join('') + '</div>';
      var shown = bundles.filter(function (b) { return computeBundleStatus(b.items, lookup) === S.l2Bundles; });
      var cards = shown.length
        ? shown.map(function (b) { return renderBundleCard(b, lookup); }).join('')
        : '<div class="bdl-empty-section">Nothing in this bucket.</div>';
      body = l2Html + '<div class="bdl-bundles">' + cards + '</div>';
    } else {
      var lCounts = countLooseByBucket(loose, lookup);
      var lDefs = [['available','Awaiting use'],['used','Used'],['archived','Archived']];
      var l2HtmlL = '<div class="bdl-l2">' + lDefs.map(function (d) {
        return '<button class="bdl-chip' + (S.l2Loose === d[0] ? ' is-active' : '') + '" data-bdl-l2l="' + d[0] + '">' +
          escHtml(d[1]) + '<span class="bdl-chip-ct">' + (lCounts[d[0]] || 0) + '</span></button>';
      }).join('') + '</div>';
      var shownL = loose.filter(function (f) { return looseBucketOf(f, lookup) === S.l2Loose; });
      var rows = shownL.length
        ? shownL.map(function (m) { return renderFileRow(m, lookup); }).join('')
        : '<div class="bdl-empty-section">Nothing in this bucket.</div>';
      body = l2HtmlL + '<div class="bdl-loose-rows">' + rows + '</div>';
    }

    host.innerHTML =
      '<div class="bdl-root-wrap">' +
        l1Html +
        body +
        '<div id="bdl-cascade-anchor"></div>' +
      '</div>';

    renderCascadeAnchor();
  }

  function renderSectionLabelRow(label, withRefresh) {
    var refreshBtn = withRefresh
      ? ('<button class="bdl-refresh-icon ix-btn ix-btn--ghost ix-btn--icon' +
           (S.loading ? ' is-spinning' : '') + '"' +
         ' data-bdl-refresh' +
         (S.loading ? ' disabled' : '') +
         ' title="Refresh bundles"' +
         ' aria-label="Refresh bundles">↻</button>')
      : '';
    return (
      '<div class="bdl-section-label-row">' +
        '<span class="bdl-section-label">' + escHtml(label) + '</span>' +
        refreshBtn +
      '</div>'
    );
  }

  function renderBundleCard(bundle, lookup) {
    var status      = computeBundleStatus(bundle.items, lookup);
    var statusLabel = (status === 'pending') ? 'Awaiting assignment'
                    : (status === 'partial') ? 'Partially assigned'
                    : (status === 'archived') ? 'Archived'
                    : 'Fully assigned';
    var isExpanded  = !!S.expanded[bundle.id];
    var caret       = isExpanded ? '▾' : '▸';

    // v1.3.0: in-card status filter chips removed (the L2 subtabs filter by
    // status now). Expanded card shows all its items directly.
    var bodyHtml = '';
    if (isExpanded) {
      var rowsHtml = bundle.items.map(function (m) { return renderFileRow(m, lookup); }).join('');
      bodyHtml = '<div class="bdl-card-body">' + rowsHtml + '</div>';
    }

    return (
      '<div class="bdl-card bdl-card--status-' + status + (isExpanded ? ' is-expanded' : '') + '"' +
        ' data-bdl-bundle-id="' + escAttr(bundle.id) + '">' +
        '<div class="bdl-card-header" data-bdl-toggle="' + escAttr(bundle.id) + '">' +
          '<span class="bdl-caret">' + caret + '</span>' +
          '<span class="bdl-card-label">' + escHtml(bundle.label) + '</span>' +
          '<span class="bdl-card-count">' + bundle.items.length + ' ' +
            (bundle.items.length === 1 ? 'file' : 'files') +
          '</span>' +
          '<span class="bdl-pill bdl-pill--' + status + '">' + escHtml(statusLabel) + '</span>' +
        '</div>' +
        bodyHtml +
      '</div>'
    );
  }

  // v1.2.0 · TD-183.3 · The status filter chip strip. Renders inside an
  // expanded bundle card body OR above the loose tray. Scope is either
  // 'bundle:<id>' or 'loose'.
  function renderFilterStrip(scope, counts, activeFilter) {
    var availClasses = 'bdl-filter-chip' + (activeFilter === 'available' ? ' is-active' : '');
    var attClasses   = 'bdl-filter-chip' + (activeFilter === 'attached'  ? ' is-active' : '');
    var isDefault    = (activeFilter === 'available');
    var resetAttrs   = isDefault
      ? ' disabled'
      : ' data-bdl-filter-reset="' + escAttr(scope) + '"';
    return (
      '<div class="bdl-filter-strip">' +
        '<span class="bdl-filter-label">Show</span>' +
        '<button class="' + availClasses + '"' +
          ' data-bdl-filter-set="' + escAttr(scope) + '"' +
          ' data-bdl-filter-value="available">' +
          'Available <span class="bdl-filter-chip-count">' + counts.available + '</span>' +
        '</button>' +
        '<button class="' + attClasses + '"' +
          ' data-bdl-filter-set="' + escAttr(scope) + '"' +
          ' data-bdl-filter-value="attached">' +
          'Attached <span class="bdl-filter-chip-count">' + counts.attached + '</span>' +
        '</button>' +
        '<button class="bdl-filter-clear"' + resetAttrs + '>Reset</button>' +
      '</div>'
    );
  }

  // v1.2.0 · TD-183.3 · Empty-state row when the active filter returns
  // zero MEDIA. Directs the operator to the other chip if it has items.
  function renderFilterEmpty(activeFilter, counts) {
    var other = (activeFilter === 'available') ? 'attached' : 'available';
    var otherLabel = (other === 'available') ? 'Available' : 'Attached';
    var otherCount = counts[other];
    var msg;
    if (otherCount > 0) {
      msg = 'No <strong>' + escHtml(activeFilter === 'available' ? 'Available' : 'Attached') +
            '</strong> files here. Click <strong>' + escHtml(otherLabel) + '</strong> above to see the ' +
            '<strong>' + otherCount + ' ' + escHtml(otherLabel.toLowerCase()) + ' file' +
            (otherCount === 1 ? '' : 's') + '</strong>.';
    } else {
      msg = 'No files match this filter.';
    }
    return '<div class="bdl-filter-empty">' + msg + '</div>';
  }

  function renderFileRow(mediaItem, lookup) {
    var fd       = mediaItem.fieldData || {};
    var filename = fd['original-filename'] || fd.name || mediaItem.id;
    var mime     = fd['mime-type'] || '';
    var size     = fd.size;
    var refs     = getMediaAssetRefs(mediaItem, lookup);
    var selected = isFileSelected(mediaItem.id);

    // v2.2.0: thumbnail. Image MEDIA → small Uploadcare thumb; text MEDIA →
    // a "TEXT" placeholder tile; anything else → generic mime icon.
    var thumbHtml = renderRowThumb(mediaItem, mime);

    // v1.2.0 · TD-183.4 · text-type re-attach guard. Only triggers for
    // text-type MEDIA in 'attached' status. Available text-type stays
    // selectable per Jeff decision Q1 — orphan body recovery is a
    // legitimate workflow.
    var guarded = isTextTypeAttachedGuard(mediaItem);

    var sizeHtml = (size != null)
      ? '<span class="bdl-row-size">' + escHtml(formatBytes(size)) + '</span>'
      : '';

    var refsHtml;
    if (refs.length === 0) {
      refsHtml = '<span class="bdl-pill bdl-pill--awaiting">Awaiting Create</span>';
    } else if (refs.length === 1) {
      refsHtml = '<span class="bdl-row-target">→ ' + escHtml(refs[0].name) + '</span>';
    } else {
      var first  = refs[0];
      var titles = refs.map(function (r) { return r.name; }).join('\n');
      refsHtml = '<span class="bdl-row-target" title="' + escAttr(titles) + '">' +
        '→ ' + escHtml(first.name) +
        ' <span class="bdl-row-target-more">+' + (refs.length - 1) + ' more</span>' +
      '</span>';
    }

    var guardHtml = guarded
      ? '<span class="bdl-row-guard" title="Article body \u2014 cannot be attached to a second article">' +
          '\ud83d\udcdd Body \u2014 locked' +
        '</span>'
      : '';

    var rowCls = 'bdl-row' +
                 (selected ? ' is-selected' : '') +
                 (guarded ? ' is-disabled' : '');
    var rowTitle = guarded ? ' title="Article body \u2014 cannot be attached to a second article"' : '';

    return (
      '<div class="' + rowCls + '"' + rowTitle +
           ' data-bdl-row-mid="' + escAttr(mediaItem.id) + '">' +
        '<input type="checkbox" class="bdl-row-check"' +
          ' data-bdl-check-mid="' + escAttr(mediaItem.id) + '"' +
          (selected ? ' checked' : '') +
          (guarded ? ' disabled' : '') +
          ' aria-label="Select ' + escAttr(filename) + '">' +
        '<span class="bdl-row-mime" title="' + escAttr(mime) + '">' + thumbHtml + '</span>' +
        // v1.2.1: filename + Item ID stacked in a meta block. ID shown raw
        // (Webflow item IDs are 24-char hex; copy-paste-friendly for
        // cross-checking against Designer).
        '<span class="bdl-row-meta">' +
          '<span class="bdl-row-filename">' + escHtml(filename) + '</span>' +
          '<span class="bdl-row-id" title="Webflow item ID — copy for Designer lookup">' + escHtml(mediaItem.id) + '</span>' +
        '</span>' +
        sizeHtml +
        refsHtml +
        guardHtml +
      '</div>'
    );
  }

  function renderLooseTray(loose, lookup) {
    // v1.2.0 · TD-183.3: same filter chip strip pattern applied to loose tray.
    var scope        = 'loose';
    var filter       = getFilterFor(scope);
    var counts       = countByStatus(loose);
    var filtered     = filterMediaByStatus(loose, filter);
    var stripHtml    = renderFilterStrip(scope, counts, filter);
    var rowsOrEmpty  = (filtered.length > 0)
      ? filtered.map(function (m) { return renderFileRow(m, lookup); }).join('')
      : renderFilterEmpty(filter, counts);
    return '<div class="bdl-loose">' + stripHtml + rowsOrEmpty + '</div>';
  }

  function renderLoading() {
    return '<div class="bdl-root-wrap"><div class="bdl-state bdl-state--loading">Loading bundles…</div></div>';
  }

  function renderError(msg) {
    return '<div class="bdl-root-wrap">' +
      '<div class="bdl-state bdl-state--error">' +
        '<div class="bdl-state-title">Could not load bundles</div>' +
        '<div class="bdl-state-msg">' + escHtml(msg) + '</div>' +
        '<button class="ix-btn ix-btn--ghost" data-bdl-refresh>Retry</button>' +
      '</div>' +
    '</div>';
  }

  function renderEmpty() {
    return '<div class="bdl-root-wrap">' +
      '<div class="bdl-state bdl-state--empty">' +
        '<div class="bdl-state-title">No data yet</div>' +
        '<div class="bdl-state-msg">Bundles load when you switch to this tab.</div>' +
      '</div>' +
    '</div>';
  }

  // ─── Cascade-anchor rendering (action bar + panel) ───

  function renderCascadeAnchor() {
    var anchor = document.getElementById('bdl-cascade-anchor');
    var root   = document.getElementById('bdl-root');
    if (!anchor) return;
    if (selectedCount() === 0) {
      anchor.innerHTML = '';
      anchor.classList.remove('is-active');
      // v1.1.1: drop has-selection on root so its bottom padding collapses
      if (root) root.classList.remove('has-selection');
      // v1.1.3: clear inline width/left so an empty anchor doesn't carry stale dims
      anchor.style.left = '';
      anchor.style.width = '';
      return;
    }
    anchor.classList.add('is-active');
    // v1.1.1: add has-selection on root so v1.1.1.css adds bottom padding
    // for the fixed-position action bar (last row stays scrollable above it)
    if (root) root.classList.add('has-selection');
    if (!S.cascade) {
      anchor.innerHTML = renderActionBar();
    } else {
      anchor.innerHTML = renderCascadePanel();
    }
    // v1.1.3: align action bar / cascade panel width to #bdl-root container
    syncCascadeAnchorToContainer();
  }

  // v1.1.4: Target the .dashboard div (the outer page container) so the
  // action bar / cascade panel width matches it. Falls back to #bdl-root if
  // .dashboard isn't found, logging a one-time warning so the wrong selector
  // is caught immediately.
  function syncCascadeAnchorToContainer() {
    var anchor = document.getElementById('bdl-cascade-anchor');
    if (!anchor) return;
    var container = document.querySelector('.dashboard');
    if (!container) {
      if (!S._dashboardWarned) {
        S._dashboardWarned = true;
        console.warn('[InbxBundles v' + FILE_VERSION + '] .dashboard selector not found in DOM — falling back to #bdl-root. Confirm the correct selector with Jeff.');
      }
      container = document.getElementById('bdl-root');
    }
    if (!container) return;
    var rect = container.getBoundingClientRect();
    // Defensive: don't apply zero dims if container is currently hidden
    if (rect.width === 0) return;
    anchor.style.left  = rect.left + 'px';
    anchor.style.width = rect.width + 'px';
  }

  function renderActionBar() {
    var n = selectedCount();
    // v1.3.0: in the Archived bucket, the primary action is Restore.
    // Elsewhere: Attach / Create / Archive.
    var inArchived = (S.l1 === 'bundles' && S.l2Bundles === 'archived') ||
                     (S.l1 === 'loose'   && S.l2Loose   === 'archived');
    var actions;
    if (inArchived) {
      actions =
        '<button class="ix-btn ix-btn--primary ix-btn--gold" data-bdl-restore>' +
          'Restore ' + n +
        '</button>';
    } else {
      actions =
        '<button class="ix-btn ix-btn--secondary" data-bdl-open-cascade="attach">Attach to existing</button>' +
        '<button class="ix-btn ix-btn--secondary" data-bdl-open-cascade="create">Create new</button>' +
        '<button class="ix-btn ix-btn--primary ix-btn--gold" data-bdl-archive>Archive ' + n + '</button>';
    }
    return (
      '<div class="bdl-action-bar">' +
        '<div class="bdl-action-bar-count">' +
          '<strong>' + n + '</strong> file' + (n === 1 ? '' : 's') + ' selected' +
        '</div>' +
        '<button class="ix-revert" data-bdl-clear-selection>Clear</button>' +
        '<div class="bdl-action-bar-spacer"></div>' +
        actions +
      '</div>'
    );
  }

  // v1.3.0 · Bulk archive / restore via Scenario K (mode:archive|restore).
  function doStatusWrite(mode) {
    var cfg = _cfg();
    var url = cfg.makeAttachFiles;
    var mediaIds = selectedIdsArray();
    if (!url) { flashActionStatus('Config error: makeAttachFiles missing.', 'error'); return; }
    if (!mediaIds.length) return;
    var wfColl = cfg.wfColl || {};
    var payload = {
      mode: mode, mediaIds: mediaIds,
      titleSlug: cfg.titleSlug || null, tenantId: S.tenantId,
      mediaCollId: wfColl.media
    };
    setActionBarBusy(true, mode === 'restore' ? 'Restoring…' : 'Archiving…');
    fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Scenario K HTTP ' + res.status);
      return res.text().then(function (t) { if (!t) return { ok: true }; try { return JSON.parse(t); } catch (e) { return { ok: true }; } });
    })
    .then(function (data) {
      if (data && data.ok === false) throw new Error(data.error || 'Scenario K reported failure');
      S.selectedIds = {};
      S.cascade = null;
      renderCascadeAnchor();
      fetchAndRender();
    })
    .catch(function (err) {
      console.error('[InbxBundles v' + FILE_VERSION + '] ' + mode + ' error:', err);
      setActionBarBusy(false);
      flashActionStatus('Failed: ' + (err.message || 'network error'), 'error');
    });
  }
  function setActionBarBusy(busy, label) {
    var bar = document.querySelector('.bdl-action-bar');
    if (!bar) return;
    var btns = bar.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) btns[i].disabled = busy;
    if (busy && label) {
      var primary = bar.querySelector('[data-bdl-archive], [data-bdl-restore]');
      if (primary) primary.textContent = label;
    }
  }
  function flashActionStatus(msg, mood) {
    var bar = document.querySelector('.bdl-action-bar');
    if (!bar) return;
    var el = bar.querySelector('.bdl-action-bar-status');
    if (!el) {
      el = document.createElement('span');
      el.className = 'bdl-action-bar-status';
      bar.appendChild(el);
    }
    el.textContent = msg;
    el.setAttribute('data-mood', mood || 'info');
  }

  function renderCascadePanel() {
    var c = S.cascade;
    return (
      '<div class="bdl-cascade bdl-cascade--' + c.mode + '">' +
        renderCascadeHeader(c) +
        '<div class="bdl-cascade-body">' +
          renderCascadeStep1(c) +
          renderCascadeStep2(c) +
        '</div>' +
        renderCascadeFooter(c) +
      '</div>'
    );
  }

  function renderCascadeHeader(c) {
    var modeLabel  = c.mode === 'attach' ? '📎 Attach mode' : '✨ Create mode';
    var switchTo   = c.mode === 'attach' ? 'create' : 'attach';
    var switchText = c.mode === 'attach' ? 'Switch to Create new' : 'Switch to Attach';
    var n = selectedCount();
    var summary    = '<strong>' + n + '</strong> file' + (n === 1 ? '' : 's') +
                     ' → ' + (c.mode === 'attach' ? 'existing asset' : 'new asset');
    return (
      '<div class="bdl-cascade-header">' +
        '<span class="bdl-cascade-mode-tag bdl-cascade-mode-tag--' + c.mode + '">' +
          modeLabel +
        '</span>' +
        '<span class="bdl-cascade-count">' + summary + '</span>' +
        '<button class="ix-revert" data-bdl-switch-mode="' + switchTo + '">' +
          escHtml(switchText) +
        '</button>' +
      '</div>'
    );
  }

  function renderCascadeStep1(c) {
    var typeOptions = ['article', 'ad', 'event', 're'];
    var isSet       = !!c.type;
    var isActive    = !isSet;

    var chipsHtml = typeOptions.map(function (t) {
      var cls = 'ix-chip' + (c.type === t ? ' ix-chip--changed' : '');
      return '<button class="' + cls + '" data-bdl-step1-type="' + t + '">' +
        escHtml(TYPE_LABELS[t]) + '</button>';
    }).join('');

    var revertBtn = isSet
      ? '<button class="ix-revert" data-bdl-revert="1">Change</button>'
      : '';

    var stepCls = 'bdl-cstep' +
      (isActive ? ' is-active' : '') +
      (isSet ? ' is-set' : '');

    return (
      '<div class="' + stepCls + '">' +
        '<div class="bdl-cstep-head">' +
          '<span class="bdl-cstep-num">1</span>' +
          '<span class="bdl-cstep-label">Asset Type</span>' +
          revertBtn +
        '</div>' +
        '<div class="ix-chip-group">' + chipsHtml + '</div>' +
      '</div>'
    );
  }

  function renderCascadeStep2(c) {
    if (!c.type) {
      // Inactive — Step 1 not yet set.
      return (
        '<div class="bdl-cstep bdl-cstep--inactive">' +
          '<div class="bdl-cstep-head">' +
            '<span class="bdl-cstep-num bdl-cstep-num--pending">2</span>' +
            '<span class="bdl-cstep-label bdl-cstep-label--muted">' +
              (c.mode === 'attach' ? 'Pick the existing asset' : 'Confirm — opens the Asset Form') +
            '</span>' +
          '</div>' +
        '</div>'
      );
    }
    return c.mode === 'attach' ? renderCascadeStep2Attach(c) : renderCascadeStep2Create(c);
  }

  function renderCascadeStep2Attach(c) {
    var typeLabel = TYPE_LABELS[c.type] || c.type;
    var inputCls  = 'ix-picker-input' + (c.assetId ? ' ix-picker-input--changed' : '');
    var revertBtn = c.assetId
      ? '<button class="ix-revert" data-bdl-revert="2">Change</button>'
      : '';
    return (
      '<div class="bdl-cstep is-active' + (c.assetId ? ' is-set' : '') + '">' +
        '<div class="bdl-cstep-head">' +
          '<span class="bdl-cstep-num">2</span>' +
          '<span class="bdl-cstep-label">Pick the existing ' + escHtml(typeLabel) + '</span>' +
          revertBtn +
        '</div>' +
        '<div class="ix-picker" data-bdl-picker>' +
          '<input type="text" class="' + inputCls + '"' +
            ' value="' + escAttr(c.assetName || '') + '"' +
            ' placeholder="Search ' + escAttr(typeLabel.toLowerCase()) + 's by name…"' +
            ' autocomplete="off"' +
            ' data-bdl-picker-input>' +
          '<div class="ix-picker-list" hidden data-bdl-picker-list></div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderCascadeStep2Create(c) {
    var typeLabel = TYPE_LABELS[c.type] || c.type;
    var n = selectedCount();
    return (
      '<div class="bdl-cstep is-active is-set">' +
        '<div class="bdl-cstep-head">' +
          '<span class="bdl-cstep-num">2</span>' +
          '<span class="bdl-cstep-label">Confirm — opens the Asset Form</span>' +
        '</div>' +
        '<div class="bdl-create-info">' +
          'On <strong>Save</strong>, you\u2019ll be taken to the ' +
          '<strong>Asset Submission Form</strong> with the ' + n + ' selected ' +
          'file' + (n === 1 ? '' : 's') + ' pre-attached. Fill in name, summary, ' +
          'and other fields there \u2014 the form handles publishing.' +
        '</div>' +
      '</div>'
    );
  }

  function renderCascadeFooter(c) {
    var n = selectedCount();
    var saveDisabled, saveLabel, statusText;
    if (c.mode === 'attach') {
      saveDisabled = !(c.type && c.assetId);
      saveLabel    = 'Save';
      statusText   = saveDisabled
        ? (c.type
            ? 'Pick an existing ' + (TYPE_LABELS[c.type] || c.type) + ' to enable Save'
            : 'Choose an Asset Type, then pick an existing asset')
        : 'Ready \u2014 will attach ' + n + ' file' + (n === 1 ? '' : 's') +
          ' to \u201C' + escHtml(c.assetName || '?') + '\u201D';
    } else {
      saveDisabled = !c.type;
      saveLabel    = 'Continue to Asset Form \u2192';
      statusText   = saveDisabled
        ? 'Choose an Asset Type to continue'
        : 'Ready \u2014 will open ' + (TYPE_LABELS[c.type] || c.type) + ' submission form';
    }
    return (
      '<div class="bdl-cascade-footer">' +
        '<div class="bdl-cascade-footer-left">' +
          '<button class="ix-revert" data-bdl-cascade-cancel>Cancel</button>' +
          '<span class="bdl-cascade-status" data-bdl-cascade-status>' +
            statusText +
          '</span>' +
        '</div>' +
        '<button class="ix-btn ix-btn--primary ix-btn--gold"' +
          ' data-bdl-cascade-save' +
          (saveDisabled ? ' disabled' : '') + '>' +
          saveLabel +
        '</button>' +
      '</div>'
    );
  }

  // ─── Click + input delegation ───

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    // v1.2.0 · TD-183.3 · Status filter chip set / reset.
    var filterSet = t.closest('[data-bdl-filter-set]');
    if (filterSet) {
      e.preventDefault();
      e.stopPropagation();   // don't bubble into bundle-header toggle
      var scope = filterSet.getAttribute('data-bdl-filter-set');
      var value = filterSet.getAttribute('data-bdl-filter-value');
      setFilterFor(scope, value);
      return;
    }
    var filterReset = t.closest('[data-bdl-filter-reset]');
    if (filterReset) {
      e.preventDefault();
      e.stopPropagation();
      resetFilterFor(filterReset.getAttribute('data-bdl-filter-reset'));
      return;
    }

    // v1.2.0 · TD-183.2 · Replace modal: skip-toggle / cancel / confirm /
    // overlay backdrop. Overlay backdrop check is allow-listed — clicking
    // INSIDE the modal shouldn't dismiss.
    if (t.closest('[data-bdl-replace-skip]')) {
      // checkbox inside the modal — let the native checkbox toggle, then
      // sync state.
      var cb = t.closest('[data-bdl-replace-skip]');
      var mid = cb.getAttribute('data-bdl-replace-skip');
      // The label wrapper triggers click on the input; defer to next tick
      // so the input's `checked` reflects the new state before we read.
      setTimeout(function () { toggleReplaceCollisionSkip(mid); }, 0);
      e.stopPropagation();
      return;
    }
    if (t.closest('[data-bdl-replace-cancel]')) {
      e.preventDefault();
      closeReplaceModal();
      return;
    }
    if (t.closest('[data-bdl-replace-confirm]')) {
      e.preventDefault();
      confirmReplaceModal();
      return;
    }
    if (t.matches && t.matches('[data-bdl-replace-modal-bg]')) {
      // Clicked on the dim overlay outside the modal — treat as cancel.
      e.preventDefault();
      closeReplaceModal();
      return;
    }

    // ── v1.3.0: L1 tabs / L2 chips / archive / restore ──
    var l1btn = t.closest('[data-bdl-l1]');
    if (l1btn) {
      e.preventDefault();
      S.l1 = l1btn.getAttribute('data-bdl-l1');
      S.selectedIds = {}; S.cascade = null;
      render();
      return;
    }
    var l2b = t.closest('[data-bdl-l2b]');
    if (l2b) {
      e.preventDefault();
      S.l2Bundles = l2b.getAttribute('data-bdl-l2b');
      S.selectedIds = {}; S.cascade = null;
      render();
      return;
    }
    var l2l = t.closest('[data-bdl-l2l]');
    if (l2l) {
      e.preventDefault();
      S.l2Loose = l2l.getAttribute('data-bdl-l2l');
      S.selectedIds = {}; S.cascade = null;
      render();
      return;
    }
    if (t.closest('[data-bdl-archive]')) {
      e.preventDefault();
      doStatusWrite('archive');
      return;
    }
    if (t.closest('[data-bdl-restore]')) {
      e.preventDefault();
      doStatusWrite('restore');
      return;
    }

    // ── Refresh button (banner removed, lives inline with first section label
    //    and on error states) ──
    if (t.closest('[data-bdl-refresh]')) {
      e.preventDefault();
      e.stopPropagation();
      fetchAndRender();
      return;
    }

    // ── File checkbox ──
    // We intercept the click BEFORE the native checked state flips so we can
    // unify the state via toggleFileSelection. The checkbox's own
    // `checked` attribute is updated by toggleFileSelection's surgical refresh.
    var check = t.closest('[data-bdl-check-mid]');
    if (check) {
      e.stopPropagation();   // don't bubble up to bundle-header toggle
      var mid = check.getAttribute('data-bdl-check-mid');
      // Defer to next tick so the browser's own checkbox-toggle isn't fought
      setTimeout(function () { toggleFileSelection(mid); }, 0);
      return;
    }

    // ── Action bar: Clear ──
    if (t.closest('[data-bdl-clear-selection]')) {
      e.preventDefault();
      clearAllSelections();
      return;
    }

    // ── Action bar: open cascade (attach OR create) ──
    var openBtn = t.closest('[data-bdl-open-cascade]');
    if (openBtn) {
      e.preventDefault();
      var mode = openBtn.getAttribute('data-bdl-open-cascade');
      openCascade(mode);
      return;
    }

    // ── Cascade: switch mode (header link) ──
    var switchBtn = t.closest('[data-bdl-switch-mode]');
    if (switchBtn) {
      e.preventDefault();
      switchCascadeMode(switchBtn.getAttribute('data-bdl-switch-mode'));
      return;
    }

    // ── Cascade Step 1: pick type ──
    var typeBtn = t.closest('[data-bdl-step1-type]');
    if (typeBtn) {
      e.preventDefault();
      selectStep1Type(typeBtn.getAttribute('data-bdl-step1-type'));
      return;
    }

    // ── Cascade Step 2 (attach): pick an asset from the picker list ──
    var pickBtn = t.closest('[data-bdl-pick-asset]');
    if (pickBtn) {
      e.preventDefault();
      var assetId   = pickBtn.getAttribute('data-asset-id');
      var assetName = pickBtn.getAttribute('data-asset-name');
      selectStep2Asset(assetId, assetName);
      return;
    }

    // ── Cascade per-step Change link ──
    var revertBtn = t.closest('[data-bdl-revert]');
    if (revertBtn) {
      e.preventDefault();
      var step = parseInt(revertBtn.getAttribute('data-bdl-revert'), 10);
      revertCascadeStep(step);
      return;
    }

    // ── Cascade footer Cancel ──
    if (t.closest('[data-bdl-cascade-cancel]')) {
      e.preventDefault();
      closeCascade();
      return;
    }

    // ── Cascade footer Save (v1.1.5: real wiring — Scenario K or InbxASF) ──
    if (t.closest('[data-bdl-cascade-save]')) {
      e.preventDefault();
      saveCascade();
      return;
    }

    // ── Click outside picker → hide list ──
    // (Only when cascade is open AND attach mode AND list is visible.)
    if (S.cascade && S.cascade.mode === 'attach') {
      var inPicker = t.closest('[data-bdl-picker]');
      if (!inPicker) {
        var list = document.querySelector('[data-bdl-picker-list]');
        if (list && !list.hidden) list.hidden = true;
      }
    }

    // ── Bundle header toggle (existing) — must come AFTER the checkbox guard
    //    so a click on the checkbox doesn't also toggle the bundle. ──
    var header = t.closest('[data-bdl-toggle]');
    if (header) {
      e.preventDefault();
      var id = header.getAttribute('data-bdl-toggle');
      S.expanded[id] = !S.expanded[id];
      render();
      return;
    }
  });

  // ── Picker input — focus + input events (delegated) ──
  document.addEventListener('focusin', function (e) {
    if (!e.target || !e.target.matches) return;
    if (e.target.matches('[data-bdl-picker-input]')) {
      renderPickerListSurgically(e.target.value);
    }
  });

  document.addEventListener('input', function (e) {
    if (!e.target || !e.target.matches) return;
    if (e.target.matches('[data-bdl-picker-input]')) {
      renderPickerListSurgically(e.target.value);
    }
  });

  // v1.2.0 · TD-183.2 · Escape key closes the replace modal (matches the
  // ix-modals convention; cascade Cancel link reverts to original state
  // per §10.11).
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && S.replaceModal) {
      e.preventDefault();
      closeReplaceModal();
    }
  });

  // ─── Helpers ───

  function escHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escAttr(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  // Minimal CSS.escape polyfill — used only for our own Webflow IDs which
  // are alphanumeric. If standard CSS.escape exists, prefer it.
  function cssEscape(s) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(s);
    }
    return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function formatBytes(n) {
    if (!n && n !== 0) return '';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
    return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  function mimeIcon(mime) {
    if (!mime) return '📄';
    if (mime.indexOf('image/') === 0) return '🖼';
    if (mime.indexOf('video/') === 0) return '🎞';
    if (mime.indexOf('audio/') === 0) return '🎵';
    if (mime.indexOf('application/pdf') === 0) return '📕';
    if (mime.indexOf('text/html') === 0) return '🌐';
    if (mime.indexOf('text/')  === 0) return '📝';
    if (mime.indexOf('application/vnd.openxmlformats') === 0) return '📘';
    if (mime.indexOf('application/msword') === 0) return '📘';
    return '📄';
  }

  // v2.2.0 — row thumbnail. Image MEDIA renders a small Uploadcare thumb;
  // text MEDIA renders a "TEXT" placeholder tile; everything else falls back
  // to the mime emoji. Reads the image URL from fieldData (image-url is the
  // canonical Uploadcare field on MEDIA rows).
  // v2.2.0 — media-type hashes confirmed from the live Scenario I payload.
  // HC-INTK-3: hardcoded Webflow option hashes for MEDIA.media-type. These
  // are tenant-independent Webflow option ids; if TA_CONFIG.optionIds.mediaType
  // is provided, it wins. Tracked for the no-hardcode rule.
  var MEDIA_TYPE_HASH = {
    image: 'be8534c8e7579ff07ffbd6032f3a4bf7',
    text:  '5332c884efac157407557cf3efd387b7',
    video: '37581cd40911a2cc7b5f2913e3aeba71'
  };
  function mediaTypeOf(fd) {
    var raw = (fd && fd['media-type']) || '';
    var cfg = _cfg();
    var map = (cfg.optionIds && cfg.optionIds.mediaType) || {};
    var H = {
      image: map.image || MEDIA_TYPE_HASH.image,
      text:  map.text  || MEDIA_TYPE_HASH.text,
      video: map.video || MEDIA_TYPE_HASH.video
    };
    if (raw === H.text)  return 'text';
    if (raw === H.image) return 'image';
    if (raw === H.video) return 'video';
    var s = String(raw).toLowerCase();
    if (s.indexOf('text')  !== -1) return 'text';
    if (s.indexOf('image') !== -1) return 'image';
    if (s.indexOf('video') !== -1) return 'video';
    return 'other';
  }

  function renderRowThumb(mediaItem, mime) {
    var fd = mediaItem.fieldData || {};
    var imgUrl = fd['image-url'] || fd.imageUrl || fd.image || '';
    var type = mediaTypeOf(fd);

    // Text MEDIA → "TEXT" tile (checked FIRST: text rows have no image-url,
    // but a defensive order keeps the intent clear).
    if (type === 'text') {
      return '<span class="bdl-thumb bdl-thumb--text">TEXT</span>';
    }
    // Image (or anything carrying an image-url) → Uploadcare thumbnail.
    if (imgUrl) {
      // The Scenario I image-url already carries a 1400x transform. Swap it
      // down to a light row thumb; if no transform present, append one.
      var thumb = imgUrl;
      if (imgUrl.indexOf('ucarecd') !== -1) {
        var base = imgUrl.replace(/\/-\/.*$/, '/');   // strip any existing /-/ transforms
        thumb = base + '-/resize/96x/-/format/auto/-/quality/lighter/';
      }
      return '<span class="bdl-thumb bdl-thumb--img" style="background-image:url(\'' + escAttr(thumb) + '\')"></span>';
    }
    return '<span class="bdl-thumb bdl-thumb--icon">' + mimeIcon(mime) + '</span>';
  }


  // ─── Boot ───

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Public API ───
  window.InbxIntake = {
    mount:     installMount,
    refresh:   fetchAndRender,
    clear:     clearAllSelections,
    getState:  function () {
      var myMedia = (S.data && S.tenantId) ? filterByTenant(mergeMedia(S.data), S.tenantId) : [];
      return {
        version:       FILE_VERSION,
        loading:       S.loading,
        error:         S.error,
        tenantId:      S.tenantId,
        lastFetchAt:   S.lastFetchAt,
        bundleCount:   S.data ? groupByBundle(myMedia).length : 0,
        looseCount:    S.data ? findLoose(myMedia).length : 0,
        selectedCount: selectedCount(),
        selectedIds:   selectedIdsArray(),
        cascade:       S.cascade ? {
          mode:      S.cascade.mode,
          type:      S.cascade.type,
          assetId:   S.cascade.assetId,
          assetName: S.cascade.assetName
        } : null
      };
    },
    version:   FILE_VERSION
  };
  // Backward-compat alias: nothing references InbxBundles today, but keep it
  // pointed at the same object so any console habit or future ref still works.
  window.InbxBundles = window.InbxIntake;

})();
