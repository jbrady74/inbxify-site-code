// ============================================================
// pubplan-overview-v1.0.12.js
//
// Compact PubPlan overview on the T-A page.
// Reads from collection-list-110 .pubplan-slot-wrapper DOM.
// Header reuses .cm-hdr classes from ta-page-head-v1.4.css.
// All tiles fixed 58px for cross-column alignment.
// FA/TS: article title main, product library name small.
// TF: customer name, category label above. LBP: 1 tile + 4 empty.
// EV: event name lookup. RE: address lookup.
// MULTI-TENANT: No hardcoded values.
//
// ──────────────────────────────────────────────────────────
// v1.0.12 (Add PubPlan modal — GET payload + dynamic abbreviation):
//
//   Two fixes from v1.0.11 based on first-flight test:
//
//   (1) POST JSON → GET query string.
//       v1.0.11 sent JSON via POST. Make's Custom Webhook arrived
//       it as a single 'value' blob containing the whole body
//       string, useless for downstream module bindings unless the
//       webhook's data structure was manually defined first.
//       This matches the documented Make.com pattern: POST JSON
//       requires manual data structure setup + JSON pass-through
//       set to No, while GET query params parse automatically
//       into individual fields.
//       v1.0.12 switches to GET with URLSearchParams. Each field
//       arrives as its own bundle item (taId, publisherId, etc.)
//       with no Make-side configuration needed.
//
//   (2) Abbreviation from TITLE-ADMIN, not parsed from issue IDs.
//       v1.0.11 parsed the abbreviation from the most recent
//       existing issue ID (e.g. "WLN-110" → "WLN"). This worked
//       but failed on brand-new T-As with zero issues, and felt
//       brittle for multi-tenant.
//       v1.0.12 reads the abbreviation from a wrapper attribute
//       data-ta-short, bound in Webflow Designer to the TITLES-
//       ADMIN "3-Digit T-A Abbreviation" field. Single source of
//       truth in CMS. No regex, no fallback path needed.
//       Suggested issue number is still parsed from existing
//       issues (most recent + 1); on a fresh T-A with no issues
//       it defaults to 1.
//
//   HC-011 from v1.0.11 RETIRED (no more issue-ID regex parse).
//
// ──────────────────────────────────────────────────────────
// v1.0.11 (Add PubPlan modal — keep flow on T-A page):
//
//   The +Add a PubPlan link previously navigated to a static
//   /workspaces/build-a-pub-plan page. Replaced with an inline
//   modal that asks two questions and POSTs to Make:
//
//     1. Issue number (e.g. 111)  →  combined with the
//        abbreviation auto-parsed from existing issues to
//        produce the full issue name (e.g. "WLN-111").
//     2. Publication date  →  native <input type="date">
//        (Webflow stores this as ISO YYYY-MM-DD; no custom
//        format conversion needed.)
//
//   Auto-fill logic for the abbreviation + suggested number:
//     - Read all existing issue IDs from .pubplan-id elements.
//     - Most recent issue's prefix (e.g. "WLN") becomes the
//       fixed prefix, displayed left of the number input.
//     - Most recent issue's number + 1 becomes the suggested
//       number (user can override).
//     - Edge case: zero existing issues → fallback to an
//       editable abbreviation field. Captured as HC-011.
//
//   Multi-tenant: reads taId, publisherId, titleSlug, taShort
//   (auto-parsed) from DOM. No hardcoded publisher values.
//
//   Webhook: POST to MAKE_ADD_PUBPLAN_URL with JSON payload:
//     { taId, publisherId, titleSlug, issueName, issueNumber,
//       abbreviation, publicationDate }
//
//   On success: toast + 1s delay + window.location.reload()
//   so the new tile appears in the overview. (Webflow CMS
//   create + page republish via Make takes ~5–10s; we reload
//   anyway and the new issue may not appear on the first
//   reload — user reloads again if needed. Future polish:
//   poll Webflow for the new item before reloading.)
//
//   On failure: red banner inside modal, modal stays open,
//   user can retry. Cancel link reverts.
//
// HARDCODED DECISIONS:
//   - HC-011: Abbreviation auto-parse assumes existing issues
//     follow the "ABBR-NNN" pattern (matched by /^([A-Z0-9]+)-(\d+)$/i).
//     If a publisher uses a non-standard format (e.g. "WLN.110"
//     or "WLN/110"), the parse fails and the modal falls back
//     to manual entry. Acceptable — covers all current and
//     planned T-As.
//   - HC-012: Modal copy ("Add a PubPlan", "Issue Number",
//     "Publication Date", "Create →", "Cancel") hardcoded
//     English strings. i18n out of scope for current platform.
//
// ============================================================

(function () {
  'use strict';

  // ── Configuration ──
  // Make webhook for creating a new PubPlan. Receives JSON body.
  // Replace with TA_CONFIG.makeAddPubplan if/when centralized.
  var MAKE_ADD_PUBPLAN_URL = 'https://hook.us1.make.com/kd93s32l4pdgihmh1a5x1wpwi39hpvhu';

  // ── Section config — display order, slot prefix, "filled" logic ──
  var SECTIONS = [
    { code: 'fa', label: 'Feature Articles', slotPrefix: 'fa-', catPrefix: 'fa-cat-', count: 4, colorClass: 'sn-fa', hdrClass: 'sh-fa', filledKey: 'articleId' },
    { code: 'ts', label: 'Themed Spotlights', slotPrefix: 'ts-', catPrefix: 'ts-cat-', count: 4, colorClass: 'sn-ts', hdrClass: 'sh-ts', filledKey: 'articleId' },
    { code: 'ba', label: 'Banner Ads',        slotPrefix: 'ba-', catPrefix: null,        count: 12, colorClass: 'sn-ba', hdrClass: 'sh-ba', filledKey: 'customerId' },
    { code: 'tf', label: 'The Find',          slotPrefix: 'tf-', catPrefix: 'tf-cat',    count: 5,  colorClass: 'sn-tf', hdrClass: 'sh-tf', filledKey: 'customerId' },
    { code: 'ev', label: 'Events',            slotPrefix: 'ev-', catPrefix: null,         count: 4,  colorClass: 'sn-ev', hdrClass: 'sh-ev', filledKey: 'eventId' },
    { code: 're', label: 'Real Estate',       slotPrefix: 're-', catPrefix: null,         count: 6,  colorClass: 'sn-re', hdrClass: 'sh-re', filledKey: 'customerId' },
    { code: 'sb', label: 'Sidebar Ads',       slotPrefix: 'sb-', catPrefix: null,         count: 4,  colorClass: 'sn-sb', hdrClass: 'sh-sb', filledKey: 'customerId' }
  ];

  // ── Gather all pubplan items from collection-list-110 ──
  function gatherIssues() {
    var items = document.querySelectorAll('.pubplan-item');
    var issues = [];
    var seen = {};

    items.forEach(function (item) {
      var idEl = item.querySelector('.pubplan-id');
      var pid = idEl ? idEl.textContent.trim() : '';
      if (!pid || seen[pid]) return;
      seen[pid] = true;

      var nameEl = item.querySelector('.q-header');
      var dateEl = item.querySelector('.q-header-mini');
      var linkEl = item.querySelector('.pubplan-detail-link');

      var issueName = nameEl ? nameEl.textContent.trim() : '';
      var issueDate = dateEl ? dateEl.textContent.trim() : '';
      var detailHref = linkEl ? linkEl.getAttribute('href') || '' : '';

      // Gather all slot wrappers for this pubplan
      var wrappers = item.querySelectorAll('.pubplan-slot-wrapper');
      var slots = {};

      wrappers.forEach(function (w) {
        var sc = w.dataset.slotCode || '';
        if (!sc) return;
        slots[sc] = {
          slotCode: sc,
          sectionCode: w.dataset.sectionCode || '',
          catId: w.dataset.catId || '',
          catLabel: w.dataset.catLabel || '',
          articleId: w.dataset.articleId || '',
          articleTitle: w.dataset.articleTitle || '',
          customerId: w.dataset.customerId || '',
          customerName: w.dataset.customerName || '',
          adTitle: w.dataset.adTitle || '',
          eventId: w.dataset.eventId || '',
          sponsorId: w.dataset.sponsorId || '',
          sponsorName: w.dataset.sponsorName || ''
        };
      });

      issues.push({
        id: pid,
        name: issueName,
        date: issueDate,
        href: detailHref,
        slots: slots
      });
    });

    return issues;
  }

  // ── Look up event name from .events-wrapper library ──
  function lookupEventName(eventId) {
    if (!eventId) return '';
    var el = document.querySelector('.events-wrapper[data-event-id="' + eventId + '"]');
    return el ? (el.dataset.label || el.dataset.eventName || '') : '';
  }

  // ── Look up RE address from .re-wrapper library ──
  function lookupReAddress(reId) {
    if (!reId) return '';
    var el = document.querySelector('.re-wrapper[data-re-id="' + reId + '"]');
    return el ? (el.dataset.label || '') : '';
  }

  // ── Get display name for a slot ──
  function getSlotDisplayName(sec, slotData, catData) {
    if (!slotData && !catData) return '';
    if (sec.code === 'fa' || sec.code === 'ts') {
      // Article title is the main display name
      return (slotData && slotData.articleTitle) || '';
    }
    if (sec.code === 'tf') {
      return (slotData && slotData.customerName) || '';
    }
    if (sec.code === 'ba' || sec.code === 'sb') {
      return (slotData && slotData.customerName) || '';
    }
    if (sec.code === 'ev') {
      // Cross-reference events-wrapper for the event name
      return (slotData && slotData.eventId) ? lookupEventName(slotData.eventId) : '';
    }
    if (sec.code === 're') {
      // Cross-reference re-wrapper for the address
      // RE slots may store the RE item ID in customerId or a dedicated field
      // Also check if there's a direct customer name
      if (slotData && slotData.customerId) {
        return lookupReAddress(slotData.customerId) || slotData.customerName || '';
      }
      return '';
    }
    return '';
  }

  // ── Get detail line for a slot ──
  function getSlotDetail(sec, slotData, catData) {
    if (!slotData && !catData) return '';
    if (sec.code === 'fa' || sec.code === 'ts') {
      // Category (product library name) as small detail line
      return (catData && catData.catLabel) || '';
    }
    if (sec.code === 'ba' || sec.code === 'sb') {
      return (slotData && slotData.adTitle) || '';
    }
    if (sec.code === 'tf') {
      return (slotData && slotData.adTitle) || '';
    }
    return '';
  }

  // ── Check if a content slot is "filled" ──
  function isSlotFilled(sec, slotData) {
    if (!slotData) return false;
    var key = sec.filledKey;
    if (key === 'articleId') return !!slotData.articleId;
    if (key === 'customerId') return !!slotData.customerId;
    if (key === 'eventId') return !!slotData.eventId;
    return false;
  }

  // ── Build status dots for FA/TS (placeholder — no picker data on T-A page) ──
  // On the T-A overview we show simple filled/empty per slot, not per-field dots
  function buildDotHtml(filled) {
    return filled
      ? '<div class="pp-dots"><span class="pp-dot d-ok"></span></div>'
      : '<div class="pp-dots"><span class="pp-dot d-na"></span></div>';
  }

  // ── Detect TF mode for an issue (lbp vs txa) ──
  function detectTfMode(issue) {
    var catSlot = issue.slots['tf-cat'];
    if (!catSlot || !catSlot.catId) return { mode: 'none', catLabel: '' };
    // Check the product library DOM for the section code
    var prodEl = document.querySelector('.products-wrapper[data-id="' + catSlot.catId + '"]');
    if (prodEl && prodEl.dataset.sectionCode === 'lbp') {
      return { mode: 'lbp', catLabel: catSlot.catLabel || '' };
    }
    return { mode: 'txa', catLabel: catSlot.catLabel || '' };
  }

  // ── Render one slot tile ──
  function renderSlotTile(sec, i, contentData, catData, tfMode) {
    var filled = isSlotFilled(sec, contentData);
    var hasSomething = false;
    var mainName = '';
    var detailLine = '';

    if (sec.code === 'fa' || sec.code === 'ts') {
      // Main: article title. Detail: product library (category) name.
      mainName = (contentData && contentData.articleTitle) || '';
      detailLine = (catData && catData.catLabel) || '';
      // If no article but category exists, show category as main
      if (!mainName && detailLine) { mainName = detailLine; detailLine = ''; }
      hasSomething = !!(catData && catData.catId);
    } else if (sec.code === 'tf') {
      // Main: customer name
      mainName = (contentData && contentData.customerName) || '';
      hasSomething = !!mainName;
    } else if (sec.code === 'ba' || sec.code === 'sb') {
      mainName = (contentData && contentData.customerName) || '';
      detailLine = (contentData && contentData.adTitle) || '';
      hasSomething = !!mainName;
    } else if (sec.code === 'ev') {
      mainName = (contentData && contentData.eventId) ? lookupEventName(contentData.eventId) : '';
      hasSomething = !!(contentData && contentData.eventId);
    } else if (sec.code === 're') {
      if (contentData && contentData.customerId) {
        mainName = lookupReAddress(contentData.customerId) || contentData.customerName || '';
      }
      hasSomething = !!(contentData && contentData.customerId);
    }

    var isEmpty = !hasSomething && !filled;
    var slotCls = 'pp-slot' + (isEmpty ? ' empty' : '') + (detailLine ? ' has-detail' : '');
    var numCls = 'pp-slot-num ' + (!isEmpty ? sec.colorClass : 'sn-empty');
    var slotLabel = (sec.code === 'tf' && tfMode && tfMode.mode === 'lbp') ? 'LBP' : String(i);

    var h = '<div class="' + slotCls + '">';
    h += '<div class="pp-slot-top">';
    h += '<span class="' + numCls + '">' + slotLabel + '</span>';
    h += '<span class="pp-slot-cat' + (!mainName ? ' empty-cat' : '') + '">' + (mainName ? esc(mainName) : '—') + '</span>';
    h += buildDotHtml(filled);
    h += '</div>';
    if (detailLine) {
      h += '<div class="pp-slot-detail">' + esc(detailLine) + '</div>';
    }
    h += '</div>';
    return h;
  }

  // ── Render one issue column ──
  function renderIssueColumn(issue, isFirst) {
    var h = '<div class="pp-col">';

    // Issue header
    h += '<div class="pp-issue-hdr">';
    h += '<div class="pp-issue-name">' + esc(issue.name) + '</div>';
    h += '<div class="pp-issue-date">' + esc(issue.date) + '</div>';
    if (issue.href) {
      h += '<a class="pp-issue-link" href="' + issue.href + '">open →</a>';
    }
    h += '</div>';

    // Sections
    SECTIONS.forEach(function (sec) {
      // TF: detect LBP vs TXA mode
      var tfMode = null;
      if (sec.code === 'tf') {
        tfMode = detectTfMode(issue);
      }

      h += '<div class="pp-section-hdr ' + sec.hdrClass + '"><span class="pp-sh-bar"></span>' + sec.label + '</div>';

      // TF: show category name above tiles when set, or placeholder for alignment
      if (sec.code === 'tf') {
        if (tfMode.mode !== 'none') {
          h += '<div class="pp-tf-cat-label">' + esc(tfMode.catLabel) + '</div>';
        } else {
          h += '<div class="pp-tf-cat-placeholder"></div>';
        }
      }

      // TF with no category — show 5 empty tiles (not a big block)
      if (sec.code === 'tf' && tfMode.mode === 'none') {
        for (var e = 1; e <= 5; e++) {
          h += '<div class="pp-slot empty"><div class="pp-slot-top"><span class="pp-slot-num sn-empty">' + e + '</span><span class="pp-slot-cat empty-cat">—</span>' + buildDotHtml(false) + '</div></div>';
        }
        h += '<div class="pp-section-gap"></div>';
        return;
      }

      var renderCount = sec.count;
      if (sec.code === 'tf' && tfMode.mode === 'lbp') renderCount = 1;

      for (var i = 1; i <= renderCount; i++) {
        var slotCode = sec.slotPrefix + i;
        var catCode = sec.catPrefix ? (sec.catPrefix.endsWith('-') ? sec.catPrefix + i : sec.catPrefix) : null;
        var catData = catCode ? issue.slots[catCode] : null;
        var contentData = issue.slots[slotCode] || null;

        h += renderSlotTile(sec, i, contentData, catData, tfMode);
      }

      // LBP mode: pad with empty tiles to match 5-slot height
      if (sec.code === 'tf' && tfMode.mode === 'lbp') {
        for (var p = 2; p <= 5; p++) {
          h += '<div class="pp-slot empty"><div class="pp-slot-top"><span class="pp-slot-num sn-empty">' + p + '</span><span class="pp-slot-cat empty-cat">—</span>' + buildDotHtml(false) + '</div></div>';
        }
      }

      h += '<div class="pp-section-gap"></div>';
    });

    h += '</div>';
    return h;
  }

  function esc(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Build header — reuses .cm-hdr classes from Content Processor ──
  function renderHeader() {
    var nameEl = document.querySelector('.pubplan-slot-wrapper[data-titleadmin-name]');
    var titleName = nameEl ? nameEl.dataset.titleadminName || '' : '';

    return '<div class="cm-hdr">' +
      '<div class="cm-hdr-left">' +
        '<div class="cm-hdr-icon">📋</div>' +
        '<div><h3>Publication Planner</h3><div class="cm-hdr-sub">' + esc(titleName) + '</div></div>' +
      '</div>' +
      '<button type="button" class="pp-add-btn" data-pp-add-btn>+ Add a PubPlan</button>' +
    '</div>';
  }

  // ════════════════════════════════════════════════════════════
  // ADD PUBPLAN MODAL (v1.0.11)
  // ════════════════════════════════════════════════════════════

  // Read multi-tenant context from DOM. Returns null if missing
  // critical IDs (taId, publisherId), in which case the modal
  // refuses to open and logs an error.
  //
  // v1.0.12: also reads data-ta-short (the 3-digit T-A
  // abbreviation, e.g. "WLN", "DHF") from the wrapper. This is
  // the single source of truth for the issue prefix — bound
  // in Webflow Designer to the TITLES-ADMIN "3-Digit T-A
  // Abbreviation" field. If missing, we fall back to parsing
  // from existing issue IDs; if no existing issues, we let
  // the user enter it manually.
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

  // Parse the suggested next issue number from existing issue IDs.
  // Returns the next number (max + 1) when at least one issue parses,
  // or null if there are no existing issues (brand-new T-A).
  //
  // v1.0.12: simplified — abbreviation no longer parsed here. The
  // abbreviation comes from data-ta-short on the ta-item wrapper.
  function parseNextIssueNumber() {
    var idEls = document.querySelectorAll('.pubplan-id');
    if (!idEls.length) return null;

    var pattern = /^([A-Za-z0-9]+)-(\d+)$/;
    var maxNum = 0;
    var anyMatched = false;

    Array.prototype.forEach.call(idEls, function (el) {
      var raw = (el.textContent || '').trim();
      var m = raw.match(pattern);
      if (!m) return;
      anyMatched = true;
      var num = parseInt(m[2], 10);
      if (num > maxNum) maxNum = num;
    });

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
            '<input type="number" id="ppm-number" class="ppm-input ppm-number-input" ' +
              'data-pp-add-number value="' + defaultNumber + '" min="1" step="1" autocomplete="off">' +
          '</div>' +
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
          '<input type="number" id="ppm-number" class="ppm-input" ' +
            'data-pp-add-number value="' + defaultNumber + '" min="1" step="1" autocomplete="off">' +
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
    if (numberInput) numberInput.addEventListener('input', updatePreview);
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
    var numberInput = backdrop.querySelector('[data-pp-add-number]');
    var abbrInput   = backdrop.querySelector('[data-pp-add-abbr]');
    var dateInput   = backdrop.querySelector('[data-pp-add-date]');

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
    var issueNumberRaw = numberInput ? (numberInput.value || '').trim() : '';
    var issueNumber = parseInt(issueNumberRaw, 10);
    var publicationDate = dateInput ? (dateInput.value || '').trim() : '';

    // Validation
    if (!abbreviation) {
      showError('Abbreviation is required.');
      if (abbrInput) abbrInput.focus();
      return;
    }
    if (!/^[A-Z0-9]{1,8}$/.test(abbreviation)) {
      showError('Abbreviation must be 1–8 letters or digits.');
      if (abbrInput) abbrInput.focus();
      return;
    }
    if (!issueNumberRaw || isNaN(issueNumber) || issueNumber < 1) {
      showError('Issue number must be a positive whole number.');
      if (numberInput) numberInput.focus();
      return;
    }
    if (!publicationDate) {
      showError('Publication date is required.');
      if (dateInput) dateInput.focus();
      return;
    }

    var issueName = abbreviation + '-' + issueNumber;

    // Build query string. Make's Custom Webhook will parse each
    // param into a separate bundle item — no data structure setup
    // needed on the Make side.
    var params = new URLSearchParams({
      taId:            context.taId,
      publisherId:     context.publisherId,
      titleSlug:       context.titleSlug,
      issueName:       issueName,
      issueNumber:     String(issueNumber),
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

    fetch(url, { method: 'GET' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function () {
        showSuccessAndReload(issueName);
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

  // ── Click delegation for the +Add a PubPlan button ──
  // Delegated because renderHeader() rebuilds the button on every
  // render(), so a direct binding would go stale.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-pp-add-btn]');
    if (!btn) return;
    e.preventDefault();
    openAddPubplanModal();
  });

  // ── Main render ──
  function render() {
    var issues = gatherIssues();
    if (!issues.length) {
      console.warn('[PubPlan Overview] No pubplan items found in collection-list-110.');
      // v1.0.11: still render the header so the +Add a PubPlan button
      // is reachable on a brand-new T-A with zero issues. Without this,
      // a publisher onboarding would have no way to create their first
      // pubplan.
      var planZoneEmpty = document.querySelector('.pub-plan-zone');
      var mountTargetEmpty = planZoneEmpty || document.querySelector('.pub-plan-scroll-area');
      if (mountTargetEmpty) {
        mountTargetEmpty.insertAdjacentHTML('beforebegin',
          renderHeader() +
          '<div class="pp-overview pp-overview-empty">' +
            '<div class="pp-empty-state">No PubPlans yet. Click <strong>+ Add a PubPlan</strong> to create your first one.</div>' +
          '</div>'
        );
        if (planZoneEmpty) planZoneEmpty.style.display = 'none';
      }
      return;
    }

    // Find mount point — replace the scroll area content
    var scrollArea = document.querySelector('.pub-plan-scroll-area');
    if (!scrollArea) {
      console.warn('[PubPlan Overview] .pub-plan-scroll-area not found.');
      return;
    }

    // Hide the old column structure
    var oldWrapper = scrollArea.querySelector('.pubplan-collection-wrapper');
    if (oldWrapper) oldWrapper.style.display = 'none';

    // Hide the old first column (section labels)
    var firstCol = document.querySelector('.pub-plan-first-column');
    if (firstCol) firstCol.style.display = 'none';

    // Hide the modal
    var modal = document.getElementById('pubplan-modal');
    if (modal) modal.style.display = 'none';

    // Hide the entire pub-plan-zone flex container and rebuild clean
    var planZone = document.querySelector('.pub-plan-zone');
    if (planZone) planZone.style.display = 'none';

    // Inject header + overview as siblings, before the hidden zone
    var mountParent = planZone ? planZone.parentElement : scrollArea.parentElement;

    // Build overview HTML
    var columnsHtml = issues.map(function (issue, idx) {
      return renderIssueColumn(issue, idx === 0);
    }).join('');

    var fullHtml = renderHeader() +
      '<div class="pp-overview" id="pp-overview-root">' +
        '<div class="pp-columns">' + columnsHtml + '</div>' +
      '</div>';

    if (planZone) {
      planZone.insertAdjacentHTML('beforebegin', fullHtml);
    } else {
      scrollArea.insertAdjacentHTML('beforebegin', fullHtml);
    }

    console.log('[PubPlan Overview] Rendered ' + issues.length + ' issues.');
  }

  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

})();
