// ============================================================
// pubplan-overview-v1.0.7.js
//
// v1.0.6: Fixed header placement — inserts before .pub-plan-zone,
//         hides entire zone (first-column + scroll-area flex pair).
//         Overview renders as clean sibling, not inside flex container.
//   - FA/TS: article title main, product library name small below
//     (fixed: detail line was clipped by fixed 44px tile height)
//   - TF: customer name as main, category label above tiles
//   - TF empty: renders 5 empty tiles (not a tall block) — alignment
//   - TF LBP: 1 filled tile + 4 empty tiles to maintain alignment
//   - EV: event name from .events-wrapper lookup
//   - RE: address from .re-wrapper lookup
//   - Scroll: fixed overflow on .pub-plan-scroll-area
//
// MULTI-TENANT: No hardcoded values. All data from DOM.
// ============================================================

(function () {
  'use strict';

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

      // TF: show category name above tiles when set
      if (sec.code === 'tf' && tfMode.mode !== 'none') {
        h += '<div class="pp-tf-cat-label">' + esc(tfMode.catLabel) + '</div>';
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

  // ── Build header — matches Content Processor style ──
  function renderHeader() {
    // Read title name from any slot wrapper
    var nameEl = document.querySelector('.pubplan-slot-wrapper[data-titleadmin-name]');
    var titleName = nameEl ? nameEl.dataset.titleadminName || '' : '';

    return '<div class="pp-hdr">' +
      '<div class="pp-hdr-left">' +
        '<div class="pp-hdr-icon">📋</div>' +
        '<div>' +
          '<div class="pp-hdr-title">Publication Planner</div>' +
          '<div class="pp-hdr-sub">' + esc(titleName) + '</div>' +
        '</div>' +
      '</div>' +
      '<a href="/workspaces/build-a-pub-plan" target="_blank" class="pp-hdr-btn">+ Add a PubPlan</a>' +
    '</div>';
  }

  // ── Main render ──
  function render() {
    var issues = gatherIssues();
    if (!issues.length) {
      console.warn('[PubPlan Overview] No pubplan items found in collection-list-110.');
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
