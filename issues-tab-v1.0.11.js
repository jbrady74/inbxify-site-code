// ============================================================
// issues-tab-v1.0.11.js
//
// ──────────────────────────────────────────────────────────
// v1.0.11 — CLONE A PUBPLAN (legacy path)
//
//   New "Clone →" button on Active-zone cards, beside Promote to
//   Next. Duplicates an edition so the operator can swap banner
//   ads and re-render, without rebuilding the issue by hand.
//
//   SHARED vs CLONED (Jeff, 2026-08-11):
//     SHARED  — FA / TS / TXA / RE / EV picker records. The clone
//               points at the SAME 🅿️ records as the source. Same
//               editorial content, zero duplication. Editing one
//               changes both — that is the intent.
//     CLONED  — BA and BA+ picker records. Real duplicates,
//               pre-populated with the source's banner contents,
//               so the operator only touches the slots that
//               actually change between editions.
//
//   Fires Scenario 105 (Clone PUBPLAN). Payload mirrors the Add
//   flow's dual-write contract: issueNumber = numeric stem,
//   issueLabel = full alphanumeric label.
//
//   Suffix auto-advance: WLN-118A → suggests 118B, 118B → 118C.
//   A bare 118 suggests 118A. Operator can override.
//
//   LEGACY-ONLY. Superseded by the Cloner Workstream (Generator
//   tab) once MNA-B lands; retired with the picker model in
//   Workstream J.
//
//   Toast-truth applies — Scenario 105's Respond echoes the
//   written fieldData and we diff it before claiming success.
//
//   NOT AUTOMATED: Scenario 106 module 2's issue-no filter still
//   needs a hand edit before "run the HTML" (HC-017 unchanged).
//
// ──────────────────────────────────────────────────────────
//
// Issues tab on the T-A page — REPLACES pubplan-overview-v1.0.12.js
// as part of MNA Workstream A-4.
//
// ──────────────────────────────────────────────────────────
// v1.0.10 — Alphanumeric issue labels ("WLN-118B") · DUAL-WRITE
//
//   ROOT CAUSE of the "118B" rejection (finally pinned): the issue
//   field was still <input type="number">. A number input does not
//   reject the keystroke — it silently blanks its OWN .value the
//   instant the string stops being a valid number. So typing "118B"
//   left value === "" and the preview fell to "—". The submit path
//   in v1.0.7+ already passed the raw string through untouched;
//   the input element was the whole blocker.
//
//   THE REAL CONSTRAINT (why v1.0.6's free-text flip got reverted):
//   Webflow PUBLICATION PLAN `issue-number` is a **Number** field.
//   Free text alone pushes "118B" at a Number field and the write
//   fails or coerces. Retyping the field to Plain text would mean
//   delete + recreate in Designer, breaking every Make mapping that
//   points at it and killing numeric sort platform-wide.
//
//   RESOLUTION — DUAL-WRITE (approved 2026-08-11):
//     · issueLabel  = the full operator string  ("118B")
//                     → PUBLICATION PLAN `issue-number-display`
//                       (Plain text · already exists · was unused)
//     · issueNumber = the leading numeric stem  ("118")
//                     → PUBLICATION PLAN `issue-number` (Number)
//                       Numeric sort survives everywhere.
//     · issueName   = abbreviation + "-" + issueLabel  ("WLN-118B")
//                     → TITLE-WEEK (Plain text · Name field)
//   Requires Scenario 103 blueprint v1.1 (module 2 remap + module 44
//   issue-no resourced + module 32 echo). Client is backward-safe:
//   against the OLD blueprint it degrades to an unverified toast
//   rather than a false success.
//
//   CHANGES:
//     1. Both issue inputs → type="text" + inputmode="text".
//        min/step dropped (meaningless on text). CSS unchanged —
//        the spinner-suppression rules become inert no-ops.
//     2. Alpha suffix force-uppercased as typed (caret preserved),
//        matching the abbreviation field's existing behavior.
//     3. New `issueLabel` param on the webhook GET. `issueNumber`
//        now carries the stem only. Both sent every time.
//     4. Format guard (NOT a required-field guard — v1.0.7's
//        no-required-fields decision stands): a NON-BLANK issue
//        value must begin with a digit, so the numeric stem is
//        always derivable for the Number field. Blank still
//        submits, unchanged.
//     5. parseNextIssueNumber() FIXED — it read `.pubplan-id`,
//        which was RETIRED in v1.0.4 and is no longer bound in
//        Designer. It has therefore returned null on every render
//        since v1.0.4, silently killing the next-number suggestion.
//        Now reads `.pubplan-name` (TITLE-WEEK) and its regex
//        tolerates a suffix, so "WLN-118B" still yields 119.
//     6. TOAST-TRUTH compliance. Was: any 2xx → green "created".
//        Now: parse the JSON echo, diff the written fieldData
//        field-by-field against what was sent. Match → green.
//        Mismatch → red, no reload, values shown. No echo present
//        (old blueprint still imported) → amber "unverified".
//
//   KNOWN DOWNSTREAM (flagged, NOT fixed here — separate files):
//     · newsletters-tab-v1.0.3.js:138 sorts on parseInt(issueNo),
//       so 118 and 118B tie at 118.
//     · ta-performance-v0.6.9.js:157 parseInt's the issue for
//       bucketing — 118 and 118B can collapse into one bucket.
//     Both need a stem-then-suffix comparator. Separate bumps.
//
// ──────────────────────────────────────────────────────────
// v1.0.8 — "Promote to Next" button on In Progress (Active) cards
//
//   New feature. Fires Scenario 107 (Change Publishing Status: NL
//   Next-To-Go), which flips the linked NEWSLETTER record's
//   publishing-status to "Publish Next as Current" and republishes
//   it. This does NOT touch Planning Status / does NOT create a
//   NEWSLETTER record — it assumes one already exists and is linked
//   via the PubPlan's NEWSLETTER Item ID field.
//
//   - Button renders ONLY on Active-zone (In Progress) cards, and
//     ONLY when data-newsletter-id is present + non-empty on that
//     card's .pubplan-slot-wrapper. Missing binding = no button,
//     one console.warn for the whole render pass (not per-card —
//     avoids log spam on titles where the binding isn't live yet).
//   - Click is intercepted with preventDefault + stopPropagation
//     so it doesn't trigger the wrapping <a> card's navigation.
//   - Native confirm() gate before firing — this flips a live
//     publishing field with no undo affordance in this UI.
//   - Standing async-feedback contract: button disables + relabels
//     "Promoting…" during the fetch; success → green toast +
//     button relabels "Promoted ✓" (stays disabled, prevents
//     double-fire); failure → red toast + button re-enables so the
//     publisher can retry.
//   - Uses the same bare-constant-URL pattern already established
//     in this file for MAKE_ADD_PUBPLAN_URL (not TA_CONFIG — see
//     HC-017 below).
//
//   NEW DOM CONTRACT: [data-newsletter-id] on .pubplan-slot-wrapper
//   — REQUIRES a Designer binding (NEWSLETTER Item ID field on
//   PUBLICATION PLAN). Not present before v1.0.8; must be added in
//   Webflow Designer before this button will appear anywhere.
//
// ──────────────────────────────────────────────────────────
// v1.0.7 — Modal form: Issue Number reverted to number;
//          Edition + Name fields added; no required fields
//
//   - Issue Number is type="number" again (v1.0.6 free-text reverted).
//   - New Edition field (text, data-pp-add-edition).
//   - New Name field (text, data-pp-add-name).
//   - All required-field validation removed — modal submits
//     whatever is entered, blank or filled.
//   - Webhook now also sends: edition, name. issueNumber sent
//     as the numeric string. issueName = ABBR-number when an
//     abbreviation is present, else the bare number.
//   NOTE: edition + name are NOT yet bound in Make scenario 103
//   (Create PUBPLAN module maps only name/title-admin/issue-number/
//   planning-status/publication-date/t-a-3digit). They arrive as
//   bundle items but are ignored until mapped.
//
// ──────────────────────────────────────────────────────────
// v1.0.6 — Issue field is FREE TEXT (fixes "114B" rejection)
//
//   v1.0.5 as deployed still had <input type="number"> on the
//   issue field, so the browser rejected non-numeric input like
//   "114B" or "Holiday". v1.0.6 ships the intended change:
//     - both issue inputs are type="text"
//     - submit takes the raw trimmed value (no parseInt / isNaN)
//     - issueName = abbreviation + '-' + rawValue
//     - webhook issueNumber param carries the raw string
//   New filename per no-reuse rule (do NOT re-push v1.0.5).
//
// ──────────────────────────────────────────────────────────
// v1.0.5 — Add a PubPlan REINSTATED
//
//   v1.0.2 removed the Add-a-PubPlan modal + button. Jeff wants
//   it back. This restores, verbatim from pubplan-overview-v1.0.12:
//     - MAKE_ADD_PUBPLAN_URL constant
//     - + Add a PubPlan button in the header (data-pp-add-btn)
//     - full modal: readTaContext, parseNextIssueNumber,
//       renderModalHtml, openAddPubplanModal, closeAddPubplanModal,
//       handleAddPubplanSubmit, showSuccessAndReload
//     - delegated click handler on [data-pp-add-btn]
//   GET/URLSearchParams submit + data-ta-short auto-fill unchanged.
//   HC-012 (modal English copy) UN-RETIRED.
//   HC-011 stays retired (no issue-ID regex for abbreviation).
//
// ──────────────────────────────────────────────────────────
// v1.0.4 — DOM contract realignment to platform convention
//
//   Designer cleanup completed (Phases 1–3):
//     · pubplan-item stripped clean — no custom attributes
//     · pubplan-slot-wrapper now holds ALL data-* attributes
//       (data-item-id, data-pubplan-url, data-planning-status,
//       data-newsletter-url)
//     · pubplan-name rebound to TITLE-WEEK (yields "WLN-111")
//     · pubplan-date rebound to PUBLICATION DATE (formatted)
//     · pubplan-id retired (still in DOM, no longer read)
//
//   JS changes:
//     · gatherIssues reads data-* from .pubplan-slot-wrapper
//       (was .pubplan-item) — matches the convention used by
//       other hidden CMS collections on the platform.
//     · Card title sourced from .pubplan-name (TITLE-WEEK).
//       .pubplan-id no longer read — the hex Item ID lives on
//       data-item-id for any future tool that needs it.
//     · renderCard drops the small-mono .it-card-id eyebrow line
//       since we only have one identifier per issue; TITLE-WEEK
//       renders prominently in the .it-card-name slot instead.
//     · data-newsletter-url now bound to NEWSLETTER Link (full
//       URL), not a slug — resolveUrl pass-through handles it
//       unchanged. NEWSLETTER_PATH_PREFIX retained as fallback
//       safety only.
//
// ──────────────────────────────────────────────────────────
// v1.0.3 — Path prefixes corrected to live values
//
//   v1.0.2 shipped with placeholder prefixes /pubplan/ and
//   /newsletter/. v1.0.3 sets them to the actual Webflow template
//   paths:
//     PUBPLAN_PATH_PREFIX    = '/publication-plan/'
//     NEWSLETTER_PATH_PREFIX = '/nl/'
//
//   No other changes.
//
// ──────────────────────────────────────────────────────────
// v1.0.2 — Modal removed + URL-from-slug construction
//
//   Two changes from v1.0.1 (pre-deploy ship):
//
//   (1) Add PubPlan modal removed entirely. The modal flow is
//       no longer used. Stripped: renderModalHtml, openAddPubplanModal,
//       closeAddPubplanModal, handleAddPubplanSubmit, showSuccessAndReload,
//       readTaContext, parseNextIssueNumber, wireAddButton,
//       MAKE_ADD_PUBPLAN_URL constant, and the +Add a PubPlan button
//       in the header. HC-012 (modal English copy) RETIRED.
//
//   (2) URL construction from slug. data-pubplan-url and
//       data-newsletter-url are now bound to Webflow Slug fields,
//       not full URLs. resolveUrl() helper prepends a configurable
//       path prefix unless the value is already absolute or
//       path-rooted (starts with "/" or "http"). New constants
//       PUBPLAN_PATH_PREFIX and NEWSLETTER_PATH_PREFIX hold the
//       template paths — tracked as HC-015 and HC-016.
//
// ──────────────────────────────────────────────────────────
// PHILOSOPHY (A-4):
//
//   The vestigial "Publication Planning" tab is replaced by a
//   read-only Issues tab — a card list of every PubPlan owned
//   by this T-A, partitioned by Planning Status:
//
//     ACTIVE zone   — Planning Status = "In Progress" (or missing)
//                     · cards open PubPlan editing page in SAME tab
//     ARCHIVE zone  — Planning Status = "Locked"
//                     · cards open published Newsletter page in NEW tab
//                       (or fall back to PubPlan same-tab if no
//                       newsletter URL bound)
//
//   Card click navigates. No edit affordances anywhere on the
//   tab itself — editability lives inside the PubPlan template
//   page, controlled by the same Planning Status field per the
//   A-5 Δ-5 cascade decision (see MNA WM v1.2 §07).
//
// ──────────────────────────────────────────────────────────
// MULTI-TENANT:
//   All identifiers carry through Webflow CMS bindings on the
//   Collection Item wrapper. No publisher names baked in JS.
//
// ──────────────────────────────────────────────────────────
// DOM CONTRACT (v1.0.4 — pubplan-source list, slot-wrapper convention):
//
//   .pubplan-item                                — Collection Item wrapper · CLASS only
//     .pubplan-slot-wrapper                      — issue-level data home (per platform convention)
//       [data-item-id]                           — (Self) This PUBPLAN ID hex
//       [data-pubplan-url]                       — PubPlan template SLUG
//       [data-planning-status]                   — "In Progress" | "Locked"
//       [data-newsletter-url]                    — NEWSLETTER Link (full URL)  · OPTIONAL · Locked-only nav
//       [data-newsletter-id]                     — NEWSLETTER Item ID (hex)    · NEW v1.0.8 · OPTIONAL
//                                                   REQUIRES Designer binding. Powers "Promote to
//                                                   Next" button on Active cards. Button hides
//                                                   silently when absent — safe to ship before the
//                                                   binding lands.
//     .pubplan-name    (text)                    — TITLE-WEEK · card display title (e.g. "WLN-111")
//     .pubplan-date    (text)                    — PUBLICATION DATE · formatted text
//     .pubplan-id      (text)                    — retired · in DOM but not read
//
//   .pub-plan-scroll-area | .pub-plan-zone       — mount anchors (hidden)
//
// ──────────────────────────────────────────────────────────
// HARDCODED DECISIONS:
//   - HC-011 RETIRED in v1.0.12 (issue-ID regex parse, replaced by data-ta-short)
//   - HC-012 RETIRED in v1.0.2  (modal English copy — modal removed)
//   - HC-013: Issues tab zone labels ("Active" / "Archive") and
//     status pill copy ("In Progress" / "Locked") hardcoded English.
//     i18n out of scope for current platform.
//   - HC-014: Status-string matching is exact-equal, case-sensitive.
//     Planning Status option labels in Webflow ("In Progress" /
//     "Locked") must match the constants below. If labels change in
//     Designer without updating constants here, all issues fall into
//     the Active zone (conservative fallback). Logged for retirement
//     once option hash binding pattern extends to this surface.
//   - HC-015 (v1.0.2): PUBPLAN_PATH_PREFIX = "/publication-plan/".
//     Webflow PubPlan template page path. Single source of truth at
//     the constant below. Platform-level (not per-tenant) — no
//     multi-tenant violation. Live path confirmed v1.0.3.
//   - HC-016 (v1.0.2): NEWSLETTER_PATH_PREFIX = "/nl/".
//     Live Webflow Newsletter page path. As of v1.0.4 the
//     data-newsletter-url attribute is bound to PUBLICATION PLAN's
//     NEWSLETTER Link field (full URL) — so this prefix is fallback
//     only, applied if a future binding ever returns a bare slug.
//     resolveUrl() passes the full URL through unchanged.
//   - HC-017 (v1.0.8): MAKE_PROMOTE_NEXT_URL — Scenario 107 webhook
//     URL (hook id 2657755), hardcoded as a bare constant. Same
//     class as HC-015/016 and matches the existing MAKE_ADD_PUBPLAN_URL
//     pattern already in this file — platform-level (one URL for
//     all tenants), not a per-tenant violation. PLACEHOLDER VALUE
//     BELOW — swap in the real hook.us1.make.com URL before deploy.
//
// COMPANION CSS:  issues-tab-v1.0.1.css
// COMPANION DOC:  MNA Workstream Master v1.2 §03 A-4 + §07 Δ-7
//
// ============================================================

(function () {
  'use strict';

  // ── Add-a-PubPlan webhook (restored v1.0.5) ──
  // Make Custom Webhook — receives GET query params.
  // Scenario 105 · Clone PUBPLAN (legacy). Bare-constant pattern,
  // same as MAKE_ADD_PUBPLAN_URL (HC-017 note applies to both).
  var MAKE_CLONE_PUBPLAN_URL = 'REPLACE_WITH_SCENARIO_105_WEBHOOK_URL';

  var MAKE_ADD_PUBPLAN_URL = 'https://hook.us1.make.com/kd93s32l4pdgihmh1a5x1wpwi39hpvhu';

  // ── Promote-to-Next webhook (NEW v1.0.8 — HC-017) ──
  // Scenario 107 "Change Publishing Status: NL Next-To-Go" (hook id
  // 2657755). PLACEHOLDER — Jeff: replace with the real hook.us1.make.com
  // URL from the Make scenario's webhook module before this ships.
  var MAKE_PROMOTE_NEXT_URL = 'https://hook.us1.make.com/j8snz84j4psvvjuvrb4sh7947i7ojvh1';

  // ── Path constants (HC-015 / HC-016) ──
  // Live Webflow template paths confirmed v1.0.3.
  var PUBPLAN_PATH_PREFIX    = '/publication-plan/';
  var NEWSLETTER_PATH_PREFIX = '/nl/';

  // ── Planning Status constants (HC-013 / HC-014) ──
  var STATUS_IN_PROGRESS = 'In Progress';
  var STATUS_LOCKED      = 'Locked';

  // ═══════════════════════════════════════════════════════════════
  // URL RESOLUTION
  // ═══════════════════════════════════════════════════════════════

  // Resolve a Webflow CMS field value to a navigable URL.
  //   - Empty → returns ''
  //   - Absolute (http/https) → returns as-is
  //   - Path-rooted (starts with /) → returns as-is
  //   - Otherwise → treated as a slug, prefix is prepended
  function resolveUrl(value, prefix) {
    if (!value) return '';
    var v = String(value).trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    if (v.charAt(0) === '/') return v;
    // Slug — prepend prefix. Avoid double-slash if prefix already ends with /
    var sep = (prefix.slice(-1) === '/') ? '' : '/';
    return prefix + sep + v;
  }

  // ═══════════════════════════════════════════════════════════════
  // ISSUE GATHERING
  // ═══════════════════════════════════════════════════════════════
  //
  // v1.0.4 contract: data-* attributes live on .pubplan-slot-wrapper
  // (one per .pubplan-item). Title text comes from .pubplan-name
  // (bound to TITLE-WEEK, e.g. "WLN-111"). .pubplan-id is no longer
  // read — the (Self) Item ID hex lives on data-item-id if needed.
  function gatherIssues() {
    var items = document.querySelectorAll('.pubplan-item');
    var issues = [];
    var seen = {};

    items.forEach(function (item) {
      // Per-convention data home: the slot-wrapper inside the Collection Item.
      var slot = item.querySelector('.pubplan-slot-wrapper');
      if (!slot) return;

      var nameEl = item.querySelector('.pubplan-name');
      var dateEl = item.querySelector('.pubplan-date');

      // TITLE-WEEK ("WLN-111") becomes the card's prominent identifier.
      var title = nameEl ? nameEl.textContent.trim() : '';
      if (!title || seen[title]) return;
      seen[title] = true;

      var pubplanUrl    = resolveUrl(slot.getAttribute('data-pubplan-url')    || '', PUBPLAN_PATH_PREFIX);
      var newsletterUrl = resolveUrl(slot.getAttribute('data-newsletter-url') || '', NEWSLETTER_PATH_PREFIX);
      var status        = (slot.getAttribute('data-planning-status') || '').trim();
      var itemId        = (slot.getAttribute('data-item-id') || '').trim();
      var newsletterId  = (slot.getAttribute('data-newsletter-id') || '').trim(); // NEW v1.0.8

      issues.push({
        title:         title,         // "WLN-111" — prominent card display
        date:          dateEl ? dateEl.textContent.trim() : '',
        pubplanUrl:    pubplanUrl,
        newsletterUrl: newsletterUrl,
        status:        status,
        itemId:        itemId,        // hex CMS ID — held for future tools, not displayed
        newsletterId:  newsletterId,  // NEW v1.0.8 — powers Promote to Next button
        sortKey: (function () {
          var iso = slot.getAttribute('data-publication-date') || '';
          if (iso) return iso;
          var d = dateEl ? Date.parse(dateEl.textContent.trim()) : NaN;
          return isNaN(d) ? 0 : d;
        })()
      });
    });

    return issues;
  }

  // ═══════════════════════════════════════════════════════════════
  // PARTITIONING + SORTING
  // ═══════════════════════════════════════════════════════════════

  function partitionByStatus(issues) {
    var active = [];
    var archive = [];
    issues.forEach(function (iss) {
      if (iss.status === STATUS_LOCKED) {
        archive.push(iss);
      } else {
        active.push(iss);
      }
    });
    return { active: active, archive: archive };
  }

  function sortDescByDate(arr) {
    arr.sort(function (a, b) {
      var av = a.sortKey || 0;
      var bv = b.sortKey || 0;
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(bv).localeCompare(String(av));
      }
      return bv - av;
    });
    return arr;
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  // Reuses .cm-hdr classes from ta-page-head-v1.4.css.
  // If ta-page-head-v1.4.css is not loaded, the header renders
  // unstyled — same surface behaviour as pubplan-overview-v1.0.12.
  function renderHeader() {
    var nameEl = document.querySelector('.pubplan-slot-wrapper[data-titleadmin-name]');
    var titleName = nameEl ? nameEl.dataset.titleadminName || '' : '';

    // v1.0.9: header via the shared component (ix-header-v1.0.1.js).
    //   Was a hand-written .cm-hdr copy. Subtitle (live TITLE name) is
    //   handled inside IxHeader - the local lookup above is kept only
    //   for the no-component fallback.
    //   Label relabelled Issues -> Pub Plans to match the tab.
    var _ppAdd = '<button type="button" class="pp-add-btn" data-pp-add-btn>+ Add a PubPlan</button>';
    return (window.IxHeader && IxHeader.render)
      ? IxHeader.render({ icon: '\uD83D\uDCCB', title: 'Pub Plans', actions: [_ppAdd] })
      : '<div class="ix-hdr"><div class="ix-hdr-left">' +
        '<div class="ix-hdr-icon">\uD83D\uDCCB</div>' +
        '<div><h3>Pub Plans</h3><div class="ix-hdr-sub">' + esc(titleName) + '</div></div>' +
        '</div><div class="ix-hdr-right">' + _ppAdd + '</div></div>';
  }

  function renderStatusPill(status) {
    if (status === STATUS_LOCKED) {
      return '<span class="it-pill it-pill--locked">' + esc(STATUS_LOCKED) + '</span>';
    }
    return '<span class="it-pill it-pill--inprogress">' + esc(STATUS_IN_PROGRESS) + '</span>';
  }

  // One card. variant = "active" | "archive".
  //
  //   Active  → pubplanUrl,    same tab.
  //   Archive → newsletterUrl  if present (new tab + ↗ glyph),
  //             else pubplanUrl same tab.
  //   Neither URL → disabled state (data-no-detail flag).
  //
  // v1.0.4: card shows TITLE-WEEK ("WLN-111") in the prominent
  // .it-card-name slot. The small mono .it-card-id eyebrow slot
  // is no longer rendered — we only have one identifier per issue.
  function renderCard(issue, variant) {
    var url = '';
    var isExternal = false;
    if (variant === 'archive' && issue.newsletterUrl) {
      url = issue.newsletterUrl;
      isExternal = true;
    } else if (issue.pubplanUrl) {
      url = issue.pubplanUrl;
    }

    var hrefAttr;
    if (!url) {
      hrefAttr = ' href="javascript:void(0)" data-no-detail';
    } else if (isExternal) {
      hrefAttr = ' href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"';
    } else {
      hrefAttr = ' href="' + esc(url) + '"';
    }

    // ↗ glyph for new-tab cards — inline-styled.
    var extGlyph = isExternal
      ? '<span aria-label="opens in new tab" title="Opens in new tab" ' +
        'style="font-family:\'DM Mono\',monospace;font-size:10px;line-height:1;' +
        'color:#8a8a7a;opacity:0.6;margin-left:2px;transition:opacity 0.15s, color 0.15s;">↗</span>'
      : '';

    var pillCluster =
      '<span style="display:inline-flex;align-items:center;gap:4px;">' +
        renderStatusPill(issue.status) +
        extGlyph +
      '</span>';

    // NEW v1.0.8: Promote to Next button. Active cards only, and only
    // when a NEWSLETTER Item ID is bound. Card itself is an <a> — the
    // button's click handler stops propagation so it doesn't also
    // trigger card navigation.
    var promoteBtn = '';
    if (variant === 'active' && issue.newsletterId) {
      promoteBtn =
        '<button type="button" class="it-promote-btn" data-promote-newsletter-id="' +
          esc(issue.newsletterId) + '" data-promote-issue-name="' + esc(issue.title) + '">' +
          'Promote to Next →' +
        '</button>';
    }

    // NEW v1.0.11: Clone button. Active cards only, and only when
    // we have the PubPlan's hex item ID to clone FROM.
    var cloneBtn = '';
    if (variant === 'active' && issue.itemId) {
      cloneBtn =
        '<button type="button" class="it-clone-btn" data-clone-pubplan-id="' +
          esc(issue.itemId) + '" data-clone-issue-name="' + esc(issue.title) + '">' +
          'Clone →' +
        '</button>';
    }

    var actionRow = (promoteBtn || cloneBtn)
      ? '<span class="it-card-actions">' + promoteBtn + cloneBtn + '</span>'
      : '';

    return '' +
      '<a class="it-card it-card--' + variant + '"' + hrefAttr + '>' +
        '<div class="it-card-name">' + esc(issue.title) + '</div>' +
        '<div class="it-card-meta">' +
          (issue.date ? '<span class="it-card-date">' + esc(issue.date) + '</span>' : '<span class="it-card-date it-card-date--empty">—</span>') +
          pillCluster +
        '</div>' +
        actionRow +
      '</a>';
  }

  // Zone header + grid. Renders the zone even when empty if
  // showEmpty=true (Active shows "0 in progress"; Archive disappears
  // when empty rather than confusing fresh-publisher onboarding).
  function renderZone(label, issues, variant, showEmpty) {
    if (!issues.length && !showEmpty) return '';
    var cardsHtml = issues.length
      ? issues.map(function (iss) { return renderCard(iss, variant); }).join('')
      : '<div class="it-zone-empty">' +
          (variant === 'active'
            ? 'No issues currently in progress.'
            : 'No archived issues yet.') +
        '</div>';
    return '<section class="it-zone it-zone--' + variant + '">' +
      '<div class="it-zone-hdr">' +
        '<span class="it-zone-label">' + esc(label) + '</span>' +
        '<span class="it-zone-count">' + issues.length + '</span>' +
      '</div>' +
      '<div class="it-zone-grid it-zone-grid--' + variant + '">' + cardsHtml + '</div>' +
    '</section>';
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN
  // ═══════════════════════════════════════════════════════════════

  function render() {
    var issues = gatherIssues();

    var scrollArea = document.querySelector('.pub-plan-scroll-area');
    var planZone   = document.querySelector('.pub-plan-zone');

    // Hide legacy DOM regions (collection-list-110 column structure,
    // first-column section labels, legacy modal element).
    var oldWrapper = scrollArea ? scrollArea.querySelector('.pubplan-collection-wrapper') : null;
    if (oldWrapper) oldWrapper.style.display = 'none';
    var firstCol = document.querySelector('.pub-plan-first-column');
    if (firstCol) firstCol.style.display = 'none';
    var legacyModal = document.getElementById('pubplan-modal');
    if (legacyModal) legacyModal.style.display = 'none';
    if (planZone) planZone.style.display = 'none';

    var mountSibling = planZone || scrollArea;
    if (!mountSibling) {
      console.warn('[Issues] no mount point found (.pub-plan-zone or .pub-plan-scroll-area).');
      return;
    }

    if (!issues.length) {
      // Surface zero-result drift loudly — this used to be the silent
      // failure mode under pubplan-overview-v1.0.12 when its DOM contract
      // drifted out of sync with the Webflow Designer class names.
      var pubplanItemPresent = !!document.querySelector('.pubplan-item');
      var slotWrapperPresent = !!document.querySelector('.pubplan-item .pubplan-slot-wrapper');
      var nameBindingPresent = !!document.querySelector('.pubplan-item .pubplan-name');
      if (!pubplanItemPresent) {
        console.warn(
          '[Issues] gatherIssues returned 0 issues — no .pubplan-item ' +
          'elements found. Designer class binding likely missing.'
        );
      } else if (!slotWrapperPresent) {
        console.warn(
          '[Issues] gatherIssues returned 0 issues — .pubplan-item ' +
          'present but no .pubplan-slot-wrapper inside. Data attributes ' +
          'have no home; check Designer structure.'
        );
      } else if (!nameBindingPresent) {
        console.warn(
          '[Issues] gatherIssues returned 0 issues — .pubplan-name ' +
          'element missing. Check Designer text-element bindings.'
        );
      } else {
        console.warn(
          '[Issues] gatherIssues returned 0 issues — DOM structure looks ' +
          'right but .pubplan-name text content is empty across all rows. ' +
          'Check TITLE-WEEK binding on .pubplan-name.'
        );
      }

      mountSibling.insertAdjacentHTML('beforebegin',
        renderHeader() +
        '<div class="it-overview it-overview-empty">' +
          '<div class="it-empty-state">No PubPlans yet.</div>' +
        '</div>'
      );
      return;
    }

    var split = partitionByStatus(issues);
    sortDescByDate(split.active);
    sortDescByDate(split.archive);

    // NEW v1.0.8: one-time (per render) warning, not per-card, if the
    // Designer binding for data-newsletter-id isn't live yet. Promote
    // button just won't appear on affected cards — non-fatal.
    if (split.active.length && split.active.every(function (i) { return !i.newsletterId; })) {
      console.warn(
        '[Issues] No active issue has data-newsletter-id bound — Promote ' +
        'to Next button will not appear anywhere. Designer binding ' +
        '(.pubplan-slot-wrapper → NEWSLETTER Item ID) likely missing.'
      );
    }

    var html = renderHeader() +
      '<div class="it-overview" id="it-overview-root">' +
        renderZone('Active',  split.active,  'active',  /*showEmpty=*/true) +
        renderZone('Archive', split.archive, 'archive', /*showEmpty=*/false) +
      '</div>';

    mountSibling.insertAdjacentHTML('beforebegin', html);

    console.log('[Issues] Rendered — Active: ' + split.active.length + ', Archive: ' + split.archive.length);
  }


  // ════════════════════════════════════════════════════════════
  // ADD PUBPLAN MODAL (restored v1.0.5, from pubplan-overview-v1.0.12)
  // ════════════════════════════════════════════════════════════

  function readTaContext() {
    var item = document.querySelector('.ta-item')
            || document.querySelector('[data-ta]');
    if (!item) {
      console.error('[PubPlan Add] ta-item wrapper not found');
      return null;
    }
    var taId        = item.getAttribute('data-ta')       || '';
    var publisherId = item.getAttribute('data-pub')      || '';
    var titleSlug   = item.getAttribute('data-ta-slug')  || '';
    var taShort     = (item.getAttribute('data-ta-short') || '').trim().toUpperCase();

    if (!taId || !publisherId) {
      console.error('[PubPlan Add] missing required IDs', {
        taId: taId, publisherId: publisherId
      });
      return null;
    }
    return {
      taId: taId,
      publisherId: publisherId,
      titleSlug: titleSlug,
      taShort: taShort
    };
  }

  // Parse the suggested next issue number from existing issue names.
  // Returns the next number (max + 1) when at least one issue parses,
  // or null if there are no existing issues (brand-new T-A).
  //
  // v1.0.10 — TWO FIXES:
  //   (a) SOURCE. Read `.pubplan-name` (TITLE-WEEK, e.g. "WLN-118B"),
  //       not `.pubplan-id`. `.pubplan-id` was retired in the v1.0.4
  //       Designer cleanup — the element may still be in the DOM but
  //       nothing is bound to it, so this function has silently
  //       returned null on every render since. The modal has been
  //       falling back to "1" (or blank) the whole time.
  //   (b) SUFFIX TOLERANCE. Old pattern /^([A-Za-z0-9]+)-(\d+)$/
  //       anchors digits to end-of-string, so "WLN-118B" never
  //       matched. A title whose newest issue carried a suffix lost
  //       its suggestion entirely. New pattern captures the stem and
  //       ignores whatever trails it.
  //
  //   Abbreviation is still NOT parsed here — it comes from
  //   data-ta-short on the ta-item wrapper (HC-011 stays retired).
  function parseNextIssueNumber() {
    var nameEls = document.querySelectorAll('.pubplan-name');
    if (!nameEls.length) return null;

    // ABBR "-" <digits> <optional suffix>
    //   WLN-118    → stem 118
    //   WLN-118B   → stem 118
    //   WLN-118-B2 → stem 118
    var pattern = /^(.+)-(\d+)([A-Za-z0-9-]*)$/;
    var maxNum = 0;
    var anyMatched = false;

    Array.prototype.forEach.call(nameEls, function (el) {
      var raw = (el.textContent || '').trim();
      var m = raw.match(pattern);
      if (!m) return;
      anyMatched = true;
      var num = parseInt(m[2], 10);
      if (num > maxNum) maxNum = num;
    });

    if (!anyMatched) {
      console.warn('[PubPlan Add] no .pubplan-name matched ABBR-NNN[suffix] — next-number suggestion unavailable.');
    }
    return anyMatched ? (maxNum + 1) : null;
  }

  // Build modal HTML. Three layouts based on context:
  //   1. Auto-fill (taShort present + existing issues): prefix shown,
  //      number pre-filled to max+1.
  //   2. Auto-fill, fresh T-A (taShort present, zero issues): prefix
  //      shown, number defaults to 1.
  //   3. Manual abbreviation (no taShort, edge case): editable
  //      abbreviation field — only happens if Designer binding is
  //      missing. Logged to console as a deployment warning.
  function renderModalHtml(context, nextNumber) {
    var todayIso = (function () {
      var d = new Date();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return d.getFullYear() + '-' + m + '-' + day;
    })();

    var hasShort = !!context.taShort;
    var defaultNumber = nextNumber || 1;

    var issueRow;
    if (hasShort) {
      // Auto-fill mode (covers both existing-issues and fresh-T-A)
      issueRow =
        '<div class="ppm-field">' +
          '<label class="ppm-label" for="ppm-number">Issue Number</label>' +
          '<div class="ppm-issue-row">' +
            '<span class="ppm-prefix" data-pp-add-prefix>' + esc(context.taShort) + '-</span>' +
            // v1.0.10: type="text". A number input blanks its own value
            // on "118B" — that was the whole alphanumeric blocker.
            '<input type="text" id="ppm-number" class="ppm-input ppm-number-input" ' +
              'data-pp-add-number value="' + esc(String(defaultNumber)) + '" ' +
              'inputmode="text" autocomplete="off" spellcheck="false">' +
          '</div>' +
          '<div class="ppm-help">Suffixes allowed — e.g. 118B for a second edition of issue 118.</div>' +
          '<div class="ppm-preview" data-pp-add-preview>Preview: ' +
            esc(context.taShort) + '-' + defaultNumber +
          '</div>' +
        '</div>';
    } else {
      // Manual abbreviation mode (deployment fallback — data-ta-short
      // not bound in Designer). Logs a warning to surface the missing
      // CMS binding to the developer.
      console.warn('[PubPlan Add] data-ta-short missing on ta-item — Designer binding required for auto-fill.');
      issueRow =
        '<div class="ppm-field">' +
          '<label class="ppm-label" for="ppm-abbr">Abbreviation</label>' +
          '<input type="text" id="ppm-abbr" class="ppm-input" data-pp-add-abbr ' +
            'placeholder="e.g. WLN" maxlength="8" autocomplete="off">' +
          '<div class="ppm-help">3–4 letter prefix used for issue IDs</div>' +
        '</div>' +
        '<div class="ppm-field">' +
          '<label class="ppm-label" for="ppm-number">Issue Number</label>' +
          '<input type="text" id="ppm-number" class="ppm-input" ' +
            'data-pp-add-number value="' + esc(String(defaultNumber)) + '" ' +
            'inputmode="text" autocomplete="off" spellcheck="false">' +
          '<div class="ppm-help">Suffixes allowed — e.g. 118B for a second edition of issue 118.</div>' +
          '<div class="ppm-preview" data-pp-add-preview>Preview: —</div>' +
        '</div>';
    }

    return '' +
      '<div class="ppm-backdrop" data-pp-add-backdrop>' +
        '<div class="ppm-modal" role="dialog" aria-modal="true" aria-labelledby="ppm-title">' +
          '<div class="ppm-hdr">' +
            '<h3 id="ppm-title">Add a PubPlan</h3>' +
            '<button type="button" class="ppm-close" data-pp-add-cancel aria-label="Close">×</button>' +
          '</div>' +
          '<div class="ppm-body">' +
            '<div class="ppm-error" data-pp-add-error hidden></div>' +
            issueRow +
            '<div class="ppm-field">' +
              '<label class="ppm-label" for="ppm-edition">Edition</label>' +
              '<input type="text" id="ppm-edition" class="ppm-input" ' +
                'data-pp-add-edition placeholder="e.g. Holiday, Spring" autocomplete="off">' +
            '</div>' +
            '<div class="ppm-field">' +
              '<label class="ppm-label" for="ppm-name">Name</label>' +
              '<input type="text" id="ppm-name" class="ppm-input" ' +
                'data-pp-add-name autocomplete="off">' +
            '</div>' +
            '<div class="ppm-field">' +
              '<label class="ppm-label" for="ppm-date">Publication Date</label>' +
              '<input type="date" id="ppm-date" class="ppm-input" ' +
                'data-pp-add-date value="' + todayIso + '" autocomplete="off">' +
            '</div>' +
          '</div>' +
          '<div class="ppm-actions">' +
            '<a href="javascript:void(0)" class="ppm-cancel-link" data-pp-add-cancel>Cancel</a>' +
            '<button type="button" class="ppm-create-btn" data-pp-add-submit>Create →</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // Single open instance at a time. Tracks ESC handler ref for clean teardown.
  var _modalEscHandler = null;

  function openAddPubplanModal() {
    var context = readTaContext();
    if (!context) {
      window.alert('Cannot add a PubPlan: missing T-A context. Please reload the page.');
      return;
    }

    // Avoid duplicate modals
    var existing = document.querySelector('[data-pp-add-backdrop]');
    if (existing) return;

    var nextNumber = parseNextIssueNumber();
    var html = renderModalHtml(context, nextNumber);
    document.body.insertAdjacentHTML('beforeend', html);

    var backdrop = document.querySelector('[data-pp-add-backdrop]');
    if (!backdrop) return;

    // ESC to close
    _modalEscHandler = function (e) {
      if (e.key === 'Escape') closeAddPubplanModal();
    };
    document.addEventListener('keydown', _modalEscHandler);

    // Click backdrop (but not modal body) to close
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeAddPubplanModal();
    });

    // Cancel buttons (× and text link)
    Array.prototype.forEach.call(
      backdrop.querySelectorAll('[data-pp-add-cancel]'),
      function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          closeAddPubplanModal();
        });
      }
    );

    // Live preview update on number/abbr change
    var numberInput = backdrop.querySelector('[data-pp-add-number]');
    var abbrInput   = backdrop.querySelector('[data-pp-add-abbr]');
    var previewEl   = backdrop.querySelector('[data-pp-add-preview]');

    function updatePreview() {
      var abbr = '';
      if (context.taShort) {
        abbr = context.taShort;
      } else if (abbrInput) {
        abbr = (abbrInput.value || '').trim().toUpperCase();
      }
      var num = numberInput ? (numberInput.value || '').trim() : '';
      if (previewEl) {
        previewEl.textContent = (abbr && num) ? ('Preview: ' + abbr + '-' + num) : 'Preview: —';
      }
    }
    if (numberInput) {
      // v1.0.10: force-uppercase the alpha suffix as the operator types,
      // preserving caret position — same treatment the abbreviation
      // field has always had. Safe because the value is digit-led.
      numberInput.addEventListener('input', function () {
        var pos = numberInput.selectionStart;
        var up  = numberInput.value.toUpperCase();
        if (up !== numberInput.value) {
          numberInput.value = up;
          try { numberInput.setSelectionRange(pos, pos); } catch (e) {}
        }
        updatePreview();
      });
    }
    if (abbrInput) {
      abbrInput.addEventListener('input', function () {
        // Force uppercase as user types
        var pos = abbrInput.selectionStart;
        abbrInput.value = abbrInput.value.toUpperCase();
        try { abbrInput.setSelectionRange(pos, pos); } catch (e) {}
        updatePreview();
      });
    }

    // Submit button
    var submitBtn = backdrop.querySelector('[data-pp-add-submit]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        handleAddPubplanSubmit(context, backdrop);
      });
    }

    // Focus the most relevant input
    setTimeout(function () {
      var firstInput = abbrInput || numberInput;
      if (firstInput) {
        firstInput.focus();
        if (firstInput === numberInput) firstInput.select();
      }
    }, 50);
  }

  function closeAddPubplanModal() {
    var backdrop = document.querySelector('[data-pp-add-backdrop]');
    if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    if (_modalEscHandler) {
      document.removeEventListener('keydown', _modalEscHandler);
      _modalEscHandler = null;
    }
  }

  // Validate inputs, fire the webhook, handle success/failure.
  //
  // v1.0.12: switched from POST + JSON body to GET + URLSearchParams.
  // Make's Custom Webhook parses query params automatically into
  // separate bundle items, eliminating the need to manually define
  // the data structure or deal with JSON pass-through quirks.
  function handleAddPubplanSubmit(context, backdrop) {
    var errEl     = backdrop.querySelector('[data-pp-add-error]');
    var submitBtn = backdrop.querySelector('[data-pp-add-submit]');
    var cancelLnk = backdrop.querySelector('.ppm-cancel-link');
    var numberInput  = backdrop.querySelector('[data-pp-add-number]');
    var abbrInput    = backdrop.querySelector('[data-pp-add-abbr]');
    var editionInput = backdrop.querySelector('[data-pp-add-edition]');
    var nameInput    = backdrop.querySelector('[data-pp-add-name]');
    var dateInput    = backdrop.querySelector('[data-pp-add-date]');

    function showError(msg) {
      if (!errEl) return;
      errEl.textContent = msg;
      errEl.hidden = false;
    }
    function clearError() {
      if (!errEl) return;
      errEl.hidden = true;
      errEl.textContent = '';
    }
    clearError();

    // Abbreviation: prefer CMS-bound taShort, else manual entry.
    var abbreviation = context.taShort
      || ((abbrInput && abbrInput.value) || '').trim().toUpperCase();

    // v1.0.10 DUAL-WRITE SPLIT.
    //   issueLabel  — the full operator string, "118B". Text-safe.
    //   issueNumber — the leading numeric stem, "118". Number-field-safe.
    // Nothing is required (v1.0.7 decision stands) — blank submits.
    var issueLabel      = numberInput  ? (numberInput.value  || '').trim().toUpperCase() : '';
    var edition         = editionInput ? (editionInput.value || '').trim() : '';
    var name            = nameInput    ? (nameInput.value    || '').trim() : '';
    var publicationDate = dateInput    ? (dateInput.value    || '').trim() : '';

    var stemMatch   = issueLabel.match(/^(\d+)/);
    var issueNumber = stemMatch ? stemMatch[1] : '';

    // FORMAT guard, not a required-field guard. A blank issue value is
    // still allowed through. But a NON-BLANK value that doesn't lead
    // with a digit yields no stem, which would push an empty string at
    // Webflow's Number field and blow up the create. Catch it here with
    // a readable message instead of a 400 from Make.
    if (issueLabel && !stemMatch) {
      showError('Issue must start with a number (e.g. 118 or 118B). "' + issueLabel + '" has no numeric part.');
      if (numberInput) { numberInput.focus(); numberInput.select(); }
      return;
    }

    var issueName = abbreviation ? (abbreviation + '-' + issueLabel) : issueLabel;

    // Build query string. Make's Custom Webhook will parse each
    // param into a separate bundle item — no data structure setup
    // needed on the Make side.
    var params = new URLSearchParams({
      taId:            context.taId,
      publisherId:     context.publisherId,
      titleSlug:       context.titleSlug,
      issueName:       issueName,
      issueNumber:     issueNumber,   // stem  → issue-number (Number)
      issueLabel:      issueLabel,    // full  → issue-number-display (Text)
      edition:         edition,
      name:            name,
      abbreviation:    abbreviation,
      publicationDate: publicationDate
    });
    var url = MAKE_ADD_PUBPLAN_URL + '?' + params.toString();

    // Lock UI during the request
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating…';
    }
    if (cancelLnk) cancelLnk.style.pointerEvents = 'none';

    // v1.0.10 TOAST-TRUTH. A 2xx is necessary but not sufficient —
    // we diff the echoed fieldData against what we sent, field by
    // field, before we are allowed to say "created".
    var expected = {
      'name':                 issueName,
      'issue-number':         issueNumber,
      'issue-number-display': issueLabel
    };

    fetch(url, { method: 'GET' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (raw) {
        var payload = null;
        try { payload = JSON.parse(raw); } catch (e) { payload = null; }

        var echoed = payload && payload.fieldData;

        // No echo → Scenario 103 blueprint v1.1 not imported yet, or an
        // older response shape. We will NOT claim a verified success.
        if (!echoed) {
          console.warn('[PubPlan Add] no fieldData echo in webhook response — cannot verify the write.', raw);
          showUnverifiedAndReload(issueName);
          return;
        }

        var mismatches = [];
        Object.keys(expected).forEach(function (k) {
          var want = String(expected[k] == null ? '' : expected[k]).trim();
          var got  = String(echoed[k]  == null ? '' : echoed[k]).trim();
          // issue-number comes back from a Webflow Number field, so it
          // may arrive as 118 rather than "118" — String() both sides.
          if (want !== got) mismatches.push(k + ': sent "' + want + '", stored "' + got + '"');
        });

        if (mismatches.length) {
          console.error('[PubPlan Add] write verification FAILED', mismatches);
          showError('PubPlan was created but stored the wrong values — ' +
                    mismatches.join(' · ') + '. Check Scenario 103 mappings before retrying.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create →';
          }
          if (cancelLnk) cancelLnk.style.pointerEvents = '';
          return;
        }

        showSuccessAndReload(echoed.name || issueName);
      })
      .catch(function (err) {
        console.error('[PubPlan Add] webhook failed:', err);
        showError('Failed to create PubPlan: ' + (err.message || 'unknown error') + '. Please try again.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create →';
        }
        if (cancelLnk) cancelLnk.style.pointerEvents = '';
      });
  }

  // Persistent toast → 1s delay → reload. Mirrors the Studio
  // studioReloadAfterCMSWrite pattern (TD-134 candidate for
  // shared-helper extraction).
  function showSuccessAndReload(issueName) {
    closeAddPubplanModal();
    var toast = document.createElement('div');
    toast.className = 'ppm-success-banner';
    toast.innerHTML = '<span class="ppm-success-icon">✓</span> ' +
      esc(issueName) + ' created — refreshing…';
    document.body.appendChild(toast);
    setTimeout(function () {
      window.location.reload();
    }, 1000);
  }

  // v1.0.10: the request succeeded but the response carried no
  // fieldData echo, so we cannot confirm WHAT was written. Say that
  // plainly rather than showing a green check we haven't earned.
  // Expected only until Scenario 103 blueprint v1.1 is imported.
  function showUnverifiedAndReload(issueName) {
    closeAddPubplanModal();
    var toast = document.createElement('div');
    toast.className = 'ppm-success-banner ppm-success-banner--unverified';
    toast.innerHTML = '<span class="ppm-success-icon">?</span> ' +
      esc(issueName) + ' submitted — could not verify the write. Refreshing…';
    document.body.appendChild(toast);
    setTimeout(function () {
      window.location.reload();
    }, 1400);
  }

  // ── Click delegation for the +Add a PubPlan button ──
  // Delegated because renderHeader() rebuilds the button on every
  // render(), so a direct binding would go stale.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-pp-add-btn]');
    if (!btn) return;
    e.preventDefault();
    openAddPubplanModal();
  });

  // ════════════════════════════════════════════════════════════
  // CLONE A PUBPLAN (NEW v1.0.11) — legacy path
  // ════════════════════════════════════════════════════════════

  // Suggest the next edition suffix from a source title.
  //   WLN-118A → 118B      (advance the letter)
  //   WLN-118  → 118A      (first sibling edition)
  //   WLN-118Z → 118AA     (rare, but don't produce garbage)
  // Returns the LABEL only (no abbreviation prefix).
  function suggestCloneLabel(sourceTitle) {
    var m = String(sourceTitle || '').match(/^(?:.+-)?(\d+)([A-Za-z]*)$/);
    if (!m) return '';
    var stem   = m[1];
    var suffix = (m[2] || '').toUpperCase();
    if (!suffix) return stem + 'A';
    if (suffix.slice(-1) === 'Z') return stem + suffix + 'A';
    var last = suffix.slice(-1);
    return stem + suffix.slice(0, -1) + String.fromCharCode(last.charCodeAt(0) + 1);
  }

  function renderCloneModalHtml(context, sourceName, suggested, todayIso) {
    var prefixRow = context.taShort
      ? '<span class="ppm-prefix">' + esc(context.taShort) + '-</span>'
      : '';
    return '' +
      '<div class="ppm-backdrop" data-pp-clone-backdrop>' +
        '<div class="ppm-modal" role="dialog" aria-modal="true" aria-labelledby="ppc-title">' +
          '<div class="ppm-hdr">' +
            '<h3 id="ppc-title">Clone ' + esc(sourceName) + '</h3>' +
            '<button type="button" class="ppm-close" data-pp-clone-cancel aria-label="Close">&times;</button>' +
          '</div>' +
          '<div class="ppm-body">' +
            '<div class="ppm-error" data-pp-clone-error hidden></div>' +
            '<div class="ppm-clone-note">' +
              'Feature Articles, Themed Spotlights, The Find, Real Estate and Events ' +
              'stay <strong>shared</strong> with ' + esc(sourceName) + ' &mdash; editing them changes both. ' +
              'Banner Ads and BA 7&ndash;12 are <strong>copied</strong>, so you can change them independently.' +
            '</div>' +
            '<div class="ppm-field">' +
              '<label class="ppm-label" for="ppc-number">New Issue Number</label>' +
              '<div class="ppm-issue-row">' + prefixRow +
                '<input type="text" id="ppc-number" class="ppm-input ppm-number-input" ' +
                  'data-pp-clone-number value="' + esc(suggested) + '" ' +
                  'inputmode="text" autocomplete="off" spellcheck="false">' +
              '</div>' +
              '<div class="ppm-preview" data-pp-clone-preview>Preview: ' +
                esc(context.taShort ? context.taShort + '-' + suggested : suggested) +
              '</div>' +
            '</div>' +
            '<div class="ppm-field">' +
              '<label class="ppm-label" for="ppc-date">Publication Date</label>' +
              '<input type="date" id="ppc-date" class="ppm-input" ' +
                'data-pp-clone-date value="' + todayIso + '" autocomplete="off">' +
            '</div>' +
          '</div>' +
          '<div class="ppm-actions">' +
            '<a href="javascript:void(0)" class="ppm-cancel-link" data-pp-clone-cancel>Cancel</a>' +
            '<button type="button" class="ppm-create-btn" data-pp-clone-submit>Clone &rarr;</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  var _cloneEscHandler = null;

  function closeCloneModal() {
    var b = document.querySelector('[data-pp-clone-backdrop]');
    if (b && b.parentNode) b.parentNode.removeChild(b);
    if (_cloneEscHandler) {
      document.removeEventListener('keydown', _cloneEscHandler);
      _cloneEscHandler = null;
    }
  }

  function openCloneModal(sourceId, sourceName) {
    var context = readTaContext();
    if (!context) {
      window.alert('Cannot clone: missing T-A context. Please reload the page.');
      return;
    }
    if (document.querySelector('[data-pp-clone-backdrop]')) return;

    var todayIso = (function () {
      var d = new Date();
      return d.getFullYear() + '-' +
             String(d.getMonth() + 1).padStart(2, '0') + '-' +
             String(d.getDate()).padStart(2, '0');
    })();

    document.body.insertAdjacentHTML('beforeend',
      renderCloneModalHtml(context, sourceName, suggestCloneLabel(sourceName), todayIso));

    var backdrop = document.querySelector('[data-pp-clone-backdrop]');
    if (!backdrop) return;

    _cloneEscHandler = function (e) { if (e.key === 'Escape') closeCloneModal(); };
    document.addEventListener('keydown', _cloneEscHandler);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeCloneModal();
    });
    Array.prototype.forEach.call(
      backdrop.querySelectorAll('[data-pp-clone-cancel]'),
      function (el) {
        el.addEventListener('click', function (e) { e.preventDefault(); closeCloneModal(); });
      }
    );

    var numberInput = backdrop.querySelector('[data-pp-clone-number]');
    var previewEl   = backdrop.querySelector('[data-pp-clone-preview]');
    if (numberInput) {
      numberInput.addEventListener('input', function () {
        var pos = numberInput.selectionStart;
        var up  = numberInput.value.toUpperCase();
        if (up !== numberInput.value) {
          numberInput.value = up;
          try { numberInput.setSelectionRange(pos, pos); } catch (e) {}
        }
        var v = numberInput.value.trim();
        if (previewEl) {
          previewEl.textContent = v
            ? ('Preview: ' + (context.taShort ? context.taShort + '-' + v : v))
            : 'Preview: —';
        }
      });
    }

    var submitBtn = backdrop.querySelector('[data-pp-clone-submit]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        handleCloneSubmit(context, backdrop, sourceId);
      });
    }

    setTimeout(function () {
      if (numberInput) { numberInput.focus(); numberInput.select(); }
    }, 50);
  }

  function handleCloneSubmit(context, backdrop, sourceId) {
    var errEl       = backdrop.querySelector('[data-pp-clone-error]');
    var submitBtn   = backdrop.querySelector('[data-pp-clone-submit]');
    var cancelLnk   = backdrop.querySelector('.ppm-cancel-link');
    var numberInput = backdrop.querySelector('[data-pp-clone-number]');
    var dateInput   = backdrop.querySelector('[data-pp-clone-date]');

    function showError(msg) {
      if (!errEl) return;
      errEl.textContent = msg;
      errEl.hidden = false;
    }
    if (errEl) { errEl.hidden = true; errEl.textContent = ''; }

    var issueLabel      = numberInput ? (numberInput.value || '').trim().toUpperCase() : '';
    var publicationDate = dateInput   ? (dateInput.value   || '').trim() : '';
    var stemMatch       = issueLabel.match(/^(\d+)/);
    var issueNumber     = stemMatch ? stemMatch[1] : '';

    // Same dual-write format guard as the Add flow — the stem has to
    // exist because issue-number is a Webflow Number field. Unlike
    // Add, a clone MUST have a label: an unnamed clone is useless.
    if (!issueLabel) {
      showError('Give the clone an issue number.');
      if (numberInput) numberInput.focus();
      return;
    }
    if (!stemMatch) {
      showError('Issue must start with a number (e.g. 118B). "' + issueLabel + '" has no numeric part.');
      if (numberInput) { numberInput.focus(); numberInput.select(); }
      return;
    }
    if (!publicationDate) {
      showError('Publication date is required.');
      if (dateInput) dateInput.focus();
      return;
    }

    var abbreviation = context.taShort || '';
    var issueName    = abbreviation ? (abbreviation + '-' + issueLabel) : issueLabel;

    var params = new URLSearchParams({
      sourcePubplanId: sourceId,
      taId:            context.taId,
      issueName:       issueName,
      issueNumber:     issueNumber,   // stem → issue-number (Number)
      issueLabel:      issueLabel,    // full → issue-number-display (Text)
      publicationDate: publicationDate
    });

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Cloning…';
    }
    if (cancelLnk) cancelLnk.style.pointerEvents = 'none';

    // Toast-truth: 2xx is not enough. Diff the echo.
    var expected = {
      'name':                 issueName,
      'issue-number':         issueNumber,
      'issue-number-display': issueLabel
    };

    fetch(MAKE_CLONE_PUBPLAN_URL + '?' + params.toString(), { method: 'GET' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (raw) {
        var payload = null;
        try { payload = JSON.parse(raw); } catch (e) { payload = null; }
        var echoed = payload && payload.fieldData;

        if (!echoed) {
          console.warn('[PubPlan Clone] no fieldData echo — cannot verify the write.', raw);
          showUnverifiedAndReload(issueName);
          return;
        }

        var mismatches = [];
        Object.keys(expected).forEach(function (k) {
          var want = String(expected[k] == null ? '' : expected[k]).trim();
          var got  = String(echoed[k]  == null ? '' : echoed[k]).trim();
          if (want !== got) mismatches.push(k + ': sent "' + want + '", stored "' + got + '"');
        });

        // Belt and braces: the whole point of the clone is that BA and
        // BA+ are NEW records. If the echo hands back the source's IDs,
        // the pickers were shared instead of copied and editing banners
        // would corrupt the source edition. Fail loudly.
        if (echoed['banner-ads'] && String(echoed['banner-ads']).trim() === '') {
          mismatches.push('banner-ads: clone picker was not created');
        }

        if (mismatches.length) {
          console.error('[PubPlan Clone] write verification FAILED', mismatches);
          showError('Clone was created but stored the wrong values — ' +
                    mismatches.join(' · ') + '. Check Scenario 105 mappings.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Clone →';
          }
          if (cancelLnk) cancelLnk.style.pointerEvents = '';
          return;
        }

        closeCloneModal();
        showSuccessAndReload(echoed.name || issueName);
      })
      .catch(function (err) {
        console.error('[PubPlan Clone] webhook failed:', err);
        showError('Failed to clone: ' + (err.message || 'unknown error') + '. Please try again.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Clone →';
        }
        if (cancelLnk) cancelLnk.style.pointerEvents = '';
      });
  }

  // Delegated — cards are rebuilt on every render().
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.it-clone-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();   // card is an <a>; don't navigate
    openCloneModal(
      btn.getAttribute('data-clone-pubplan-id') || '',
      btn.getAttribute('data-clone-issue-name') || 'this issue'
    );
  });

  // ════════════════════════════════════════════════════════════
  // PROMOTE TO NEXT (NEW v1.0.8)
  // ════════════════════════════════════════════════════════════
  //
  // Fires Scenario 107. Payload: title-admin-id, title, newsletter
  // (the NEWSLETTER item's hex ID). Response is a 302 redirect to
  // the publication-plan page — irrelevant here since fetch() follows
  // redirects silently and we don't navigate; we only care whether
  // the request itself succeeded.

  // Small standalone toast — deliberately not reusing ppm-success-banner
  // (that one is coupled to the Add-PubPlan reload flow). ok=true renders
  // green/teal, ok=false renders red.
  function promoteToast(msg, ok) {
    var el = document.createElement('div');
    el.className = 'it-promote-toast ' + (ok ? 'it-promote-toast--ok' : 'it-promote-toast--err');
    el.innerHTML = (ok ? '<span class="it-promote-toast-icon">✓</span> ' : '<span class="it-promote-toast-icon">!</span> ') + esc(msg);
    document.body.appendChild(el);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, ok ? 4000 : 5000);
  }

  function promoteToNext(btn) {
    var newsletterId = btn.getAttribute('data-promote-newsletter-id') || '';
    var issueName     = btn.getAttribute('data-promote-issue-name') || 'this issue';

    if (!newsletterId) {
      console.error('[Promote] missing newsletterId on button — should not be reachable (button only renders when bound).');
      return;
    }

    var context = readTaContext();
    if (!context) {
      window.alert('Cannot promote: missing T-A context. Please reload the page.');
      return;
    }

    var confirmed = window.confirm(
      'Promote ' + issueName + ' to Next-to-Go?\n\n' +
      'This flips the linked newsletter\'s publishing status live. ' +
      'There is no undo button in this UI.'
    );
    if (!confirmed) return;

    var originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Promoting…';
    btn.classList.add('it-promote-btn--busy');

    var params = new URLSearchParams({
      'title-admin-id': context.taId,
      'title':          context.taShort || context.titleSlug || '',
      'newsletter':     newsletterId
    });
    var url = MAKE_PROMOTE_NEXT_URL + '?' + params.toString();

    fetch(url, { method: 'GET' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        btn.textContent = 'Promoted ✓';
        btn.classList.remove('it-promote-btn--busy');
        btn.classList.add('it-promote-btn--done');
        promoteToast(issueName + ' promoted to Next-to-Go.', true);
      })
      .catch(function (err) {
        console.error('[Promote] webhook failed:', err);
        btn.disabled = false;
        btn.textContent = originalLabel;
        btn.classList.remove('it-promote-btn--busy');
        promoteToast('Promote failed for ' + issueName + ' — please retry.', false);
      });
  }

  // Delegated — cards re-render on every render() pass.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.it-promote-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    promoteToNext(btn);
  });

  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

})();
