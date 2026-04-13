// ============================================================
// ta-chrome-v1.0.0.js
// INBXIFY Title-Admin Page Chrome Enhancer
//
// Enhances Webflow-native elements that CSS alone can't fix:
// - Injects emoji icons before each tab label
// - Capitalizes first letter of each tab label word
// - Extracts title first letter into the blue circle
// - Centers the tab strip
//
// Load in Webflow T-A page Body code, after DS CSS.
// ============================================================

(function () {
  'use strict';

  function init() {
    injectTabIcons();
    fixTitleCircle();
  }

  // ── Tab icon map (keyed by data-w-tab value) ──
  var TAB_ICONS = {
    'PubPlan':        '📋',
    'Uploads Processor': '📂',
    'Content Maker':  '✏️',
    'ContentLibrary': '📦',
    'Newsletters':    '📰',
    'CLIENTS':        '👥',
    'Sponsorships':   '🤝',
    'Obligations':    '📝',
    'Print Magazine': '🖨️'
  };

  // ── Proper capitalization ──
  function titleCase(str) {
    return str.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function injectTabIcons() {
    var tabs = document.querySelectorAll('.pl-link-tabs.w-tab-link');
    tabs.forEach(function (tab) {
      var key = tab.getAttribute('data-w-tab') || '';
      var icon = TAB_ICONS[key] || '';
      var label = tab.querySelector('.pl-label-sm');
      if (!label) return;

      // Capitalize
      var text = label.textContent.trim();
      label.textContent = titleCase(text);

      // Inject icon before text
      if (icon && !label.dataset.iconDone) {
        label.dataset.iconDone = '1';
        var iconSpan = document.createElement('span');
        iconSpan.className = 'ta-tab-icon';
        iconSpan.textContent = icon;
        iconSpan.style.cssText = 'margin-right:8px;font-size:16px;vertical-align:middle;';
        label.insertBefore(iconSpan, label.firstChild);
      }
    });
  }

  function fixTitleCircle() {
    // Find the title text
    var titleEl = document.querySelector('h6.title-label');
    if (!titleEl) return;

    var titleText = titleEl.textContent.trim();
    var firstLetter = titleText.charAt(0).toUpperCase();

    // The blue circle is created by CSS ::before on .title-admin-name-left
    // We can't put text in a ::before content from JS easily,
    // so we inject an actual element and hide the ::before
    var nameLeft = document.querySelector('.title-admin-name-left');
    if (!nameLeft || nameLeft.dataset.circleDone) return;
    nameLeft.dataset.circleDone = '1';

    var circle = document.createElement('div');
    circle.className = 'ta-title-circle';
    circle.textContent = firstLetter;
    nameLeft.insertBefore(circle, nameLeft.firstChild);
  }

  // ── Run ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
