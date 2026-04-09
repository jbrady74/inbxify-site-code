// ============================================================
// pubplan-overview-v1.0.0.js
// Renders the compact PubPlan overview on the T-A page.
// Reads from Webflow collection-list-110 (.pubplan-slot-wrapper)
// and renders into the existing .pub-plan-scroll-area.
//
// REPLACES: the old column grid + pubplan-modal editing UI.
// Editing now lives on the detail page (/publication-plan/xxx)
// powered by pubplan-v5.0.26.js.
//
// MULTI-TENANT: No hardcoded values. All data from DOM.
// HARDCODE TRACKER: None — pure DOM read.
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

  // ── Get display name for a slot ──
  function getSlotDisplayName(sec, slotData) {
    if (!slotData) return '';
    if (sec.code === 'fa' || sec.code === 'ts') {
      return slotData.catLabel || '';
    }
    if (sec.code === 'ba' || sec.code === 'sb' || sec.code === 'tf' || sec.code === 're') {
      return slotData.customerName || '';
    }
    if (sec.code === 'ev') {
      // Event name not on T-A page wrapper — just show filled/empty
      return slotData.eventId ? 'Event assigned' : '';
    }
    return '';
  }

  // ── Get detail line for a slot ──
  function getSlotDetail(sec, slotData) {
    if (!slotData) return '';
    if (sec.code === 'fa' || sec.code === 'ts') {
      return slotData.articleTitle || '';
    }
    if (sec.code === 'ba' || sec.code === 'sb') {
      return slotData.adTitle || '';
    }
    if (sec.code === 'tf') {
      return slotData.adTitle || '';
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
      h += '<div class="pp-section-hdr ' + sec.hdrClass + '"><span class="pp-sh-bar"></span>' + sec.label + '</div>';

      for (var i = 1; i <= sec.count; i++) {
        var slotCode = sec.slotPrefix + i;
        var catCode = sec.catPrefix ? (sec.catPrefix.endsWith('-') ? sec.catPrefix + i : sec.catPrefix) : null;

        // Read category data from cat slot, content data from content slot
        var catData = catCode ? issue.slots[catCode] : null;
        var contentData = issue.slots[slotCode] || null;

        // Merge: display name from catData or contentData
        var displayName = '';
        if (catData && catData.catLabel) {
          displayName = catData.catLabel;
        } else if (contentData) {
          displayName = getSlotDisplayName(sec, contentData);
        }

        var detailLine = contentData ? getSlotDetail(sec, contentData) : '';
        var filled = isSlotFilled(sec, contentData);
        var hasCat = !!(catData && catData.catId) || !!(contentData && contentData.customerId) || !!(contentData && contentData.eventId);

        var slotCls = 'pp-slot' + (!hasCat && !filled ? ' empty' : '');
        var numCls = 'pp-slot-num ' + (hasCat || filled ? sec.colorClass : 'sn-empty');

        h += '<div class="' + slotCls + '">';
        h += '<div class="pp-slot-top">';
        h += '<span class="' + numCls + '">' + i + '</span>';
        h += '<span class="pp-slot-cat' + (!displayName ? ' empty-cat' : '') + '">' + (displayName ? esc(displayName) : '—') + '</span>';
        h += buildDotHtml(filled);
        h += '</div>';
        if (detailLine) {
          h += '<div class="pp-slot-detail">' + esc(detailLine) + '</div>';
        }
        h += '</div>';
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

  // ── Render legend ──
  function renderLegend() {
    return '<div class="pp-legend">' +
      '<span class="pp-legend-item"><span class="pp-dot d-ok" style="width:8px;height:8px"></span> Filled</span>' +
      '<span class="pp-legend-item"><span class="pp-dot d-na" style="width:8px;height:8px"></span> Empty</span>' +
      '<span style="margin-left:auto;font-size:8px;color:var(--text-tiny)">Click any issue header to open detail editor</span>' +
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

    // Build overview HTML
    var columnsHtml = issues.map(function (issue, idx) {
      return renderIssueColumn(issue, idx === 0);
    }).join('');

    var overviewHtml = '<div class="pp-overview" id="pp-overview-root">' +
      '<div class="pp-columns">' + columnsHtml + '</div>' +
      '</div>' + renderLegend();

    // Insert into scroll area
    scrollArea.insertAdjacentHTML('beforeend', overviewHtml);

    console.log('[PubPlan Overview] Rendered ' + issues.length + ' issues.');
  }

  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

})();
