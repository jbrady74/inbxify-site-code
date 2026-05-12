// ============================================================
// ta-chrome-v1.0.1.js
// INBXIFY Title-Admin Page Chrome Enhancer
//
// v1.0.1 changes (May 12, 2026):
//   - Reduced tab icon font-size from 16px to 14px (-2px) so
//     more tabs fit on one line without horizontal scrolling
//     in the outer T-A tab strip.
//
//   - Added Studio tab to the icon map with a red dot (●). The
//     dot is a text-style character (U+25CF), so unlike most
//     emoji it respects CSS color. We set color directly on the
//     span via inline style so the red lives even if the page
//     theme changes color tokens later.
//
//   - Updated the rest of the icon set with more semantically
//     appropriate choices (calendar for planning, books for
//     library, mail for newsletter, etc.) — see TAB_ICONS map
//     below for the full mapping.
//
//   - Reduced icon right-margin from 8px to 6px to claw back
//     another 2px per tab.
//
// Behavior preserved from v1.0.0:
//   - Injects emoji icons before each tab label
//   - Capitalizes first letter of each tab label word
//   - Extracts title first letter into the blue circle
//   - Centers the tab strip
//
// v1.0.0 (original): injection mechanism, data-icon-done flag,
//   ta-title-circle injection, init pattern.
//
// Enhances Webflow-native elements that CSS alone can't fix.
// Load in Webflow T-A page Body code, after DS CSS.
// ============================================================

(function () {
  'use strict';

  function init() {
    injectTabIcons();
    fixTitleCircle();
  }

  // ── Tab icon map (keyed by data-w-tab value) ──
  // v1.0.1: Studio added with red dot. Other icons updated for
  // semantic clarity. To override an icon, just edit the value;
  // to set a per-tab color (red dot for Studio etc.), add an
  // entry to TAB_ICON_COLORS below.
  var TAB_ICONS = {
    'PubPlan':           '📅',  // planning = calendar
    'Studio':            '●',   // red dot, text-style char (CSS color-able)
    'Uploads Processor': '⚙️',   // processing = gear
    'Content Maker':     '🖊️',   // pen (more refined than pencil)
    'ContentLibrary':    '📚',   // library = books
    'Newsletters':       '✉️',   // newsletter = mail
    'CLIENTS':           '🏢',   // business clients
    'Sponsorships':      '💰',   // money/deals
    'Obligations':       '✅',   // tasks/checklist
    'Print Magazine':    '📖'    // print = open book
  };

  // ── Per-icon CSS color override (text-style chars only) ──
  // Most emoji render with their built-in colors and ignore CSS
  // color. Text-style characters (●, ▶, ★, etc.) respect color.
  // Only entries here get a `color` style applied.
  var TAB_ICON_COLORS = {
    'Studio': '#D14A3D'  // brand-aligned red — matches inbxify red tone
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
        // v1.0.1: 16px → 14px, 8px margin → 6px margin
        var color = TAB_ICON_COLORS[key];
        var style = 'margin-right:6px;font-size:14px;vertical-align:middle;';
        if (color) style += 'color:' + color + ';font-weight:bold;';
        iconSpan.style.cssText = style;
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
