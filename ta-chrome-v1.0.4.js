// ta-chrome-v1.0.4.js
// ============================================================
// ta-chrome-v1.0.4.js
// INBXIFY Title-Admin Page Chrome Enhancer
//
// v1.0.4 changes (Aug 26, 2026):
//   Pairs with ix-header v1.0.2 (§0 ROW 0). Collapses the two
//   stacked header rows — the nav band and the title banner —
//   into ONE pinned 72px bar.
//
//   1. buildTopbar() ADDED. It RELOCATES live nodes; it does not
//      re-author any tenant value:
//        • publication name = the live h6.title-label element,
//          MOVED (appendChild moves, it does not copy). One
//          source of truth, no drift, and fixTitleCircle()'s own
//          query still resolves afterwards.
//        • parent line = publisher name read from the bound
//          attribute on #title-admin-id, with a rendered-DOM
//          fallback. 24-hex values are rejected so a record ID
//          can never render as a name (same guard client-manager
//          v1.1.0 uses).
//        • avatar letter = first alphanumeric of the publication
//          name. Derived, never stored, never per-tenant CSS.
//        • the INBXIFY logo and the .sign-in-div account control
//          are MOVED into the right slot. The logo stays an
//          <img>. It is never replaced with a text wordmark.
//
//   2. FAIL-SAFE BY DESIGN. buildTopbar() returns false and
//      changes nothing if any required node is missing. Only on
//      success does it add `body.ix-topbar-on`, and EVERY §0 rule
//      in ix-header is gated on that class. No JS, or a moved
//      element, and the page renders exactly as v1.4.28 does.
//      fixTitleCircle() still runs in that case so the old banner
//      keeps its circle.
//
//   3. PINNING is position:fixed, not sticky. sticky is dead on
//      this page (TD-229 — overflow:hidden ancestor stack). The
//      bar height and the body's compensating padding both read
//      --ix-topbar-h so they cannot drift apart.
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

  var VERSION = '1.0.4';

  function init() {
    var pinned = buildTopbar();
    injectTabIcons();
    // Only paint the old banner's circle if the topbar did NOT
    // take over. If it did, the banner tile is hidden and the
    // work would be discarded.
    if (!pinned) fixTitleCircle();
  }

  // ══════════════════════════════════════════════════════════
  // ROW 0 — PINNED TOPBAR  (v1.0.4)
  // ══════════════════════════════════════════════════════════

  // A record ID must never render as a name. Same guard as
  // client-manager v1.1.0.
  function isRecordId(v) {
    return /^[0-9a-f]{24}$/i.test(String(v || '').trim());
  }

  // Publisher name is bound on #title-admin-id in Designer. The
  // attribute list is a CANDIDATE chain, not a guess-and-hope:
  // the first non-empty, non-ID value wins, and the rendered nav
  // label is the last resort. Nothing tenant-specific is stored
  // in this file.
  var PUB_NAME_ATTRS = [
    'data-publisher-name',
    'data-publishername',
    'data-pub-name',
    'data-publisher'
  ];

  function publisherName() {
    var hosts = [
      document.querySelector('#title-admin-id'),
      document.querySelector('.ta-item'),
      document.querySelector('[data-publisher-name]'),
      document.querySelector('[data-publisher-id]'),
      document.querySelector('.customers-wrapper[data-publisher-name]')
    ];

    for (var i = 0; i < hosts.length; i++) {
      var el = hosts[i];
      if (!el) continue;
      for (var j = 0; j < PUB_NAME_ATTRS.length; j++) {
        var v = (el.getAttribute(PUB_NAME_ATTRS[j]) || '').trim();
        if (v && !isRecordId(v)) return v;
      }
    }

    // Last resort: the label already rendered in the nav band.
    var t = document.querySelector('.sign-in-div .text-block-111499') ||
            document.querySelector('.sign-in-div');
    var txt = t ? t.textContent.trim() : '';
    return isRecordId(txt) ? '' : txt;
  }

  function firstLetter(s) {
    var m = String(s || '').match(/[A-Za-z0-9]/);
    return m ? m[0].toUpperCase() : '';
  }

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  // Returns true only if the bar was actually built. Any missing
  // node aborts cleanly and leaves the page as-is.
  function buildTopbar() {
    var nav = document.querySelector('section.publ-navmenu');
    var container = nav && nav.querySelector('.navmenu-container');
    var titleEl = document.querySelector('h6.title-label');

    if (!nav || !container || !titleEl) return false;
    if (container.querySelector('.ix-topbar')) return true;   // idempotent

    var pubName = titleEl.textContent.trim();
    if (!pubName) return false;

    var parentName = publisherName();

    // ── left group ──
    var bar = el('div', 'ix-topbar');
    var client = el('div', 'ix-topbar-client');

    var avatar = el('div', 'ix-topbar-avatar');
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = firstLetter(pubName);

    var names = el('div', 'ix-topbar-names');
    if (parentName) {
      var parentLine = el('span', 'ix-topbar-parent');
      parentLine.textContent = parentName;
      names.appendChild(parentLine);
    }

    // MOVE, do not clone. The CMS binding travels with the node.
    titleEl.classList.add('ix-topbar-pub');
    titleEl.setAttribute('title', pubName);   // full name on hover if ellipsised
    names.appendChild(titleEl);

    client.appendChild(avatar);
    client.appendChild(names);

    // ── right group ──
    var right = el('div', 'ix-topbar-right');
    var logo = document.querySelector('.inbxify-logo');
    var account = document.querySelector('.sign-in-div');

    if (logo) right.appendChild(logo);
    if (logo && account) {
      var divider = el('div', 'ix-topbar-divider');
      divider.setAttribute('aria-hidden', 'true');
      right.appendChild(divider);
    }
    if (account) {
      account.classList.add('ix-topbar-account');
      right.appendChild(account);
    }

    bar.appendChild(client);
    bar.appendChild(right);
    container.appendChild(bar);

    // The gate. Every §0 rule in ix-header hangs off this class.
    document.body.classList.add('ix-topbar-on');
    return true;
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
    var firstChar = titleText.charAt(0).toUpperCase();

    // The blue circle is created by CSS ::before on .title-admin-name-left
    // We can't put text in a ::before content from JS easily,
    // so we inject an actual element and hide the ::before
    var nameLeft = document.querySelector('.title-admin-name-left');
    if (!nameLeft || nameLeft.dataset.circleDone) return;
    nameLeft.dataset.circleDone = '1';

    var circle = document.createElement('div');
    circle.className = 'ta-title-circle';
    circle.textContent = firstChar;
    nameLeft.insertBefore(circle, nameLeft.firstChild);
  }

  // ── Run ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  try {
    console.log('[ta-chrome] v' + VERSION + ' loaded');
  } catch (e) {}
})();
