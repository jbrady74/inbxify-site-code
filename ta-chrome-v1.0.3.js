// ============================================================
// ta-chrome-v1.0.3.js
// INBXIFY Title-Admin Page Chrome Enhancer
//
// v1.0.3 changes (Aug 25, 2026):
//   Pairs with title-admin-page-design v1.4.24 (dark tab rail)
//   and ix-tokens v1.0.3.
//
//   1. KEY LOOKUP IS NOW NORMALISED. TAB_ICONS was matched against
//      the literal data-w-tab value, and those values are case- and
//      space-inconsistent by history ('PubPlan', 'CLIENTS',
//      'ContentLibrary'). Any tab whose key drifted from the map
//      silently rendered with NO icon. Lookup now falls back to a
//      lowercased, space-stripped comparison, so 'Default Layout',
//      'DefaultLayout' and 'default layout' all resolve. Exact
//      matches still win first — nothing existing changes.
//
//   2. 'Default Layout' ADDED (📐). It was the one top-level tab
//      with no entry at all. In the horizontal strip that cost it
//      an icon; in the v1.4.24 rail it also broke ALIGNMENT, since
//      the rail indents labels using the icon's fixed 18px box and
//      a tab with no icon has no box. It read as a section heading
//      rather than a tab.
//
//   3. EVERY TAB NOW GETS A BOX. If a key still resolves to no
//      icon, an EMPTY spacer span is injected instead of nothing,
//      so one unmapped tab can never again knock a rail label out
//      of the column. Failure mode goes from "visibly broken
//      layout" to "one missing glyph".
//
//   4. STUDIO DOT RECOLOURED for the dark rail. #D14A3D measured
//      2.78:1 on --ix-rail and 2.04:1 on the active bed — the
//      attention marker was the least visible thing on the rail.
//      Now --ix-rail-alert #F08A73 (5.02:1 / 3.68:1). Read from
//      the CSS variable with the hex as fallback, so the token
//      stays the source of truth.
//
// v1.0.2 changes (Jul 28, 2026):
//   - Added 'Performance' to TAB_ICONS (📈, up-trend line chart)
//     for the new top-level Performance tab. Key matches the
//     Webflow data-w-tab value "Performance". No other changes.
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
    'Print Magazine':    '📖',   // print = open book
    'Performance':       '📈',   // performance = up-trend line chart
    'Default Layout':    '📐'    // v1.0.3 — was the one tab with no entry
  };

  // ── Normalised fallback index (v1.0.3) ──
  // data-w-tab values are case- and space-inconsistent by history.
  // Exact match wins; this catches the drift instead of silently
  // rendering a bare label.
  var TAB_ICONS_NORM = (function () {
    var m = {};
    Object.keys(TAB_ICONS).forEach(function (k) {
      m[k.toLowerCase().replace(/[\s_-]/g, '')] = TAB_ICONS[k];
    });
    return m;
  })();

  function iconFor(key) {
    if (TAB_ICONS[key]) return TAB_ICONS[key];
    return TAB_ICONS_NORM[String(key).toLowerCase().replace(/[\s_-]/g, '')] || '';
  }

  // ── Per-icon CSS color override (text-style chars only) ──
  // Most emoji render with their built-in colors and ignore CSS
  // color. Text-style characters (●, ▶, ★, etc.) respect color.
  // Only entries here get a `color` style applied.
  // v1.0.3: on the dark rail the old #D14A3D measured 2.78:1. Reads
  // --ix-rail-alert first so the token owns the value.
  var TAB_ICON_COLORS = {
    'Studio': 'var(--ix-rail-alert, #F08A73)'
  };

  // ── Proper capitalization ──
  function titleCase(str) {
    return str.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function injectTabIcons() {
    var tabs = document.querySelectorAll('.pl-link-tabs.w-tab-link');
    tabs.forEach(function (tab) {
      var key = tab.getAttribute('data-w-tab') || '';
      var icon = iconFor(key);
      var label = tab.querySelector('.pl-label-sm');
      if (!label) return;

      // Capitalize
      var text = label.textContent.trim();
      label.textContent = titleCase(text);

      // Inject icon before text.
      // v1.0.3: runs even when icon is '' so the fixed-width box the
      // rail indents against always exists. See changelog note 3.
      if (!label.dataset.iconDone) {
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
