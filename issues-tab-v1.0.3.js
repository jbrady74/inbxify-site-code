// ============================================================
// issues-tab-v1.0.3.js
//
// Issues tab on the T-A page — REPLACES pubplan-overview-v1.0.12.js
// as part of MNA Workstream A-4.
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
// DOM CONTRACT (v1.0.2 — pubplan-source list):
//
//   .pubplan-item                                — Collection Item wrapper · CLASS on each row
//     [data-pubplan-url]                         — PubPlan template SLUG
//     [data-planning-status]                     — "In Progress" | "Locked"
//     [data-newsletter-url]                      — Newsletter SLUG  · OPTIONAL · Locked-only nav
//     [data-item-id]                             — Self-this-item-id · informational, not read
//     .pubplan-id      (text)                    — issue ID (e.g. "WLN-111")
//     .pubplan-name    (text)                    — issue name
//     .pubplan-date    (text)                    — publication date
//     .pubplan-slot-wrapper                      — legacy slot data, ignored
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
//     Webflow Newsletter template page path. Same notes as HC-015.
//     Live path confirmed v1.0.3.
//
// COMPANION CSS:  issues-tab-v1.0.1.css
// COMPANION DOC:  MNA Workstream Master v1.2 §03 A-4 + §07 Δ-7
//
// ============================================================

(function () {
  'use strict';

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

  function gatherIssues() {
    var items = document.querySelectorAll('.pubplan-item');
    var issues = [];
    var seen = {};

    items.forEach(function (item) {
      var idEl = item.querySelector('.pubplan-id');
      var pid = idEl ? idEl.textContent.trim() : '';
      if (!pid || seen[pid]) return;
      seen[pid] = true;

      var nameEl = item.querySelector('.pubplan-name');
      var dateEl = item.querySelector('.pubplan-date');

      var pubplanUrl    = resolveUrl(item.getAttribute('data-pubplan-url')    || '', PUBPLAN_PATH_PREFIX);
      var newsletterUrl = resolveUrl(item.getAttribute('data-newsletter-url') || '', NEWSLETTER_PATH_PREFIX);

      var status = (item.getAttribute('data-planning-status') || '').trim();

      issues.push({
        id:            pid,
        name:          nameEl ? nameEl.textContent.trim() : '',
        date:          dateEl ? dateEl.textContent.trim() : '',
        pubplanUrl:    pubplanUrl,
        newsletterUrl: newsletterUrl,
        status:        status,
        sortKey: (function () {
          var iso = item.getAttribute('data-publication-date') || '';
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

    return '<div class="cm-hdr">' +
      '<div class="cm-hdr-left">' +
        '<div class="cm-hdr-icon">📋</div>' +
        '<div><h3>Issues</h3><div class="cm-hdr-sub">' + esc(titleName) + '</div></div>' +
      '</div>' +
    '</div>';
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

    // ↗ glyph for new-tab cards — inline-styled so the CSS file
    // doesn't need to know about it.
    var extGlyph = isExternal
      ? '<span aria-label="opens in new tab" title="Opens in new tab" ' +
        'style="font-family:\'DM Mono\',monospace;font-size:10px;line-height:1;' +
        'color:#8a8a7a;opacity:0.6;margin-left:2px;transition:opacity 0.15s, color 0.15s;">↗</span>'
      : '';

    // Pill + ↗ as a single flex unit on the right side of the meta row
    var pillCluster =
      '<span style="display:inline-flex;align-items:center;gap:4px;">' +
        renderStatusPill(issue.status) +
        extGlyph +
      '</span>';

    return '' +
      '<a class="it-card it-card--' + variant + '"' + hrefAttr + '>' +
        '<div class="it-card-id">' + esc(issue.id) + '</div>' +
        (issue.name ? '<div class="it-card-name">' + esc(issue.name) + '</div>' : '') +
        '<div class="it-card-meta">' +
          (issue.date ? '<span class="it-card-date">' + esc(issue.date) + '</span>' : '<span class="it-card-date it-card-date--empty">—</span>') +
          pillCluster +
        '</div>' +
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
      if (!pubplanItemPresent) {
        console.warn(
          '[Issues] gatherIssues returned 0 issues — no .pubplan-item ' +
          'elements found in the DOM. Designer binding likely missing.'
        );
      } else {
        console.warn(
          '[Issues] gatherIssues returned 0 issues — .pubplan-item ' +
          'elements present but produced no rows (check .pubplan-id text).'
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

    var html = renderHeader() +
      '<div class="it-overview" id="it-overview-root">' +
        renderZone('Active',  split.active,  'active',  /*showEmpty=*/true) +
        renderZone('Archive', split.archive, 'archive', /*showEmpty=*/false) +
      '</div>';

    mountSibling.insertAdjacentHTML('beforebegin', html);

    console.log('[Issues] Rendered — Active: ' + split.active.length + ', Archive: ' + split.archive.length);
  }

  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

})();
