// ta-chrome-v1.0.6.js
// ============================================================
// ta-chrome-v1.0.6.js
// INBXIFY Title-Admin Page Chrome Enhancer
//
// v1.0.6 changes (Sep 5, 2026):
//   THE RAIL IS GROUPED. Eighteen flat items were four different
//   kinds of thing, which is why the order never resolved. They
//   are sorted into five numbered pipeline stages plus two
//   unnumbered support groups, with a quiet label above each.
//   Pairs with §37 of title-admin-page-design v1.4.30.
//
//   1. THE RAIL IS NOT THE TOPBAR. section.publ-navmenu is the
//      fixed band buildTopbar() owns. The tab rail is
//      .dashboard-tabs.w-tabs > .vertical-tabs.w-tab-menu, which
//      §35 turns into a 208px dark column. That is what is
//      grouped.
//
//   2. RAIL_GROUPS is the whole configuration — data-w-tab values
//      in the order they should appear. A named tab is MOVED into
//      place; an unnamed one lands under "Other" at the end, so a
//      tab added in Designer tomorrow appears rather than
//      vanishing. Nothing is removed from the DOM.
//
//   3. NUMBERS MEAN SEQUENCE. 01-05 on the pipeline, a middot on
//      Commercial and Setup. A number implies a position in an
//      order and Clients does not have one.
//
//   4. WEBFLOW TAB PAIRING SURVIVES. Links pair with panes by
//      data-w-tab, not DOM order, so moving a link never detaches
//      it. No attribute on a link is touched.
//
//   5. NOT_BUILT marks the five tabs whose PAGE does not exist
//      yet. They render dimmed with a SOON marker so the rail
//      shows the shape of the finished system. Remove an entry
//      the day its surface ships — that is the whole maintenance
//      burden.
//
//   6. RETIRED tabs are marked, not deleted; §37 hides them, so
//      the decision is undoable without a JS bump.
//
//   7. FAIL-SAFE, same contract as buildTopbar. Missing container
//      or fewer than two tabs and it returns false, changing
//      nothing.
//
//   HC NOTE. RAIL_GROUPS names tabs by data-w-tab values, which
//   are platform-level and identical for every publisher — the
//   same basis TAB_ICONS has used since v1.0.1. No tenant value
//   appears in it.
//
// v1.0.5 changes (Sep 4, 2026):
//   Pairs with ix-header v1.0.3. Three additions to the ROW 0
//   topbar. All three are ADDITIVE and independently fail-safe:
//   any one missing its data source simply does not render, and
//   v1.0.4's bar is what remains.
//
//   1. BACK CONTROL to /quill-admin, left of the avatar. A grid
//      mark, not a chevron — this is a level change from one
//      title to the whole network, not browser history.
//
//      RENDERED HIDDEN, revealed only after Memberstack resolves
//      the signed-in member and the email domain matches
//      TA_CONFIG.operatorDomains. getCurrentMember() is async, so
//      building it visible would flash the control at a publisher
//      for one frame. Hidden-then-revealed cannot.
//
//      This is an AFFORDANCE, NOT A PERMISSION. The real control
//      is the Memberstack gate on /quill-admin, which bounces
//      anyone not on the INBXIFY Team plan. Never treat a hidden
//      element as access control.
//
//   2. PUBLISHER LINE becomes an anchor to the publisher page,
//      when data-publisher-slug is bound on #title-admin-id.
//      No slug, no anchor — it stays the v1.0.4 span. A missing
//      binding degrades to today's behaviour, never to a dead
//      link.
//
//   3. TITLE SWITCHER right of the publication name. Reads a
//      hidden TITLES-ADMIN Collection List (.ta-title-src)
//      filtered in the Designer to the current publisher.
//
//      WHY THE DESIGNER AND NOT A SCENARIO: that filter matches a
//      REFERENCE field. Webflow's v2 List Items API cannot filter
//      by reference server-side, which is why the Asset Library
//      has to page-then-filter client-side. The Designer can, so
//      this costs no network call and no scenario.
//
//      Hidden entirely when the publisher has one title. A caret
//      offering a single choice is noise.
//
//   NOTHING TENANT-SPECIFIC IS STORED HERE. Routes, the home URL
//   and the operator domain list all read TA_CONFIG with
//   defaults, same contract as every other surface.
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

  var VERSION = '1.0.6';

  // ══════════════════════════════════════════════════════════
  // CONFIG — TA_CONFIG wins, these are defaults. No tenant value
  // is stored in this file.
  // ══════════════════════════════════════════════════════════
  var TC = window.TA_CONFIG || {};
  var CFG = {
    quillHomeUrl:    TC.quillHomeUrl    || '/quill-admin',
    publisherRoute:  TC.publisherRoute  || '/publisher/{slug}',
    titleRoute:      TC.titleRoute      || '/title-admin/{slug}',
    // HC-TBD — operator domain list. Anyone whose signed-in email
    // ends in one of these sees the back control.
    operatorDomains: TC.operatorDomains || ['healthiestmedia.com']
  };

  function init() {
    var pinned = buildTopbar();
    injectTabIcons();
    groupRail();
    // Only paint the old banner's circle if the topbar did NOT
    // take over. If it did, the banner tile is hidden and the
    // work would be discarded.
    if (!pinned) fixTitleCircle();
    if (pinned) gateOperator();
  }

  // ══════════════════════════════════════════════════════════
  // OPERATOR GATE  (v1.0.5)
  // ══════════════════════════════════════════════════════════
  // Adds body.ix-operator, which is the ONLY thing that reveals
  // the back control. Never throws: no Memberstack, an error, or
  // an unrecognised member shape all leave the class off, which
  // hides the control. Failing closed is the correct direction.
  function gateOperator() {
    var ms = window.$memberstackDom;
    if (!ms || typeof ms.getCurrentMember !== 'function') return;
    try {
      Promise.resolve(ms.getCurrentMember())
        .then(function (res) {
          var email = memberEmail(res);
          if (email && isOperator(email)) {
            document.body.classList.add('ix-operator');
          }
        })
        .catch(function () { /* stays hidden */ });
    } catch (e) { /* stays hidden */ }
  }

  // Memberstack has shipped more than one member shape. Check the
  // documented path first, then the flatter one, rather than
  // assuming whichever version this site is on.
  function memberEmail(res) {
    var d = res && res.data ? res.data : res;
    if (!d) return '';
    if (d.auth && d.auth.email) return String(d.auth.email);
    if (d.email) return String(d.email);
    return '';
  }

  function isOperator(email) {
    var at = String(email).toLowerCase().lastIndexOf('@');
    if (at === -1) return false;
    var domain = email.toLowerCase().slice(at + 1);
    return CFG.operatorDomains.some(function (d) {
      return domain === String(d).toLowerCase();
    });
  }

  function route(pattern, slug) {
    if (!slug) return '';
    return pattern.replace('{slug}', encodeURIComponent(slug));
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

  // Publisher SLUG, bound as data-publisher-slug on the same
  // element the name comes from. Same candidate-chain shape as
  // PUB_NAME_ATTRS so a differently-named binding still resolves.
  var PUB_SLUG_ATTRS = [
    'data-publisher-slug',
    'data-publisherslug',
    'data-pub-slug'
  ];

  function publisherSlug() {
    var hosts = [
      document.querySelector('#title-admin-id'),
      document.querySelector('.ta-item'),
      document.querySelector('[data-publisher-slug]')
    ];
    for (var i = 0; i < hosts.length; i++) {
      var host = hosts[i];
      if (!host) continue;
      for (var j = 0; j < PUB_SLUG_ATTRS.length; j++) {
        var v = (host.getAttribute(PUB_SLUG_ATTRS[j]) || '').trim();
        // A record ID is not a slug. Same guard the name uses.
        if (v && !isRecordId(v)) return v;
      }
    }
    return '';
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

    // v1.0.5 addition 1 — hidden until gateOperator() says otherwise.
    client.appendChild(buildBackControl());

    var avatar = el('div', 'ix-topbar-avatar');
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = firstLetter(pubName);

    var names = el('div', 'ix-topbar-names');
    if (parentName) {
      // v1.0.5 addition 2 — anchor when a slug exists, span otherwise.
      var pubSlug = publisherSlug();
      var href = route(CFG.publisherRoute, pubSlug);
      var parentLine = el(href ? 'a' : 'span', 'ix-topbar-parent');
      if (href) {
        parentLine.setAttribute('href', href);
        parentLine.setAttribute('title', 'Open ' + parentName);
      }
      parentLine.textContent = parentName;
      names.appendChild(parentLine);
    }

    // MOVE, do not clone. The CMS binding travels with the node.
    titleEl.classList.add('ix-topbar-pub');
    titleEl.setAttribute('title', pubName);   // full name on hover if ellipsised

    // v1.0.5 addition 3 — the name and the switcher share a row so
    // the caret sits on the name's baseline, not under the parent line.
    var titleRow = el('div', 'ix-topbar-titlerow');
    titleRow.appendChild(titleEl);
    var switcher = buildTitleSwitch();
    if (switcher) titleRow.appendChild(switcher);
    names.appendChild(titleRow);

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

  // ══════════════════════════════════════════════════════════
  // ADDITION 1 — BACK CONTROL  (v1.0.5)
  // ══════════════════════════════════════════════════════════
  // A grid of four tiles, one per publisher. It reads as "up to
  // everything", where a chevron would read as "back one step" —
  // and this is not browser history.
  //
  // Always built, never visible without body.ix-operator.
  function buildBackControl() {
    var a = el('a', 'ix-topbar-back');
    a.setAttribute('href', CFG.quillHomeUrl);
    a.setAttribute('aria-label', 'All publishers');
    a.setAttribute('title', 'All publishers');
    a.innerHTML =
      '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
        '<rect x="1.5" y="1.5" width="5.4" height="5.4" rx="1.4"/>' +
        '<rect x="9.1" y="1.5" width="5.4" height="5.4" rx="1.4"/>' +
        '<rect x="1.5" y="9.1" width="5.4" height="5.4" rx="1.4"/>' +
        '<rect x="9.1" y="9.1" width="5.4" height="5.4" rx="1.4"/>' +
      '</svg>';
    return a;
  }

  // ══════════════════════════════════════════════════════════
  // ADDITION 3 — TITLE SWITCHER  (v1.0.5)
  // ══════════════════════════════════════════════════════════
  // Source is .ta-title-src, a hidden TITLES-ADMIN Collection
  // List filtered in the Designer to the current publisher.
  // Returns null when there is nothing worth offering.
  function buildTitleSwitch() {
    var rows = readTitleRows();
    if (rows.length < 2) return null;      // one choice is not a choice

    var currentId = currentTitleId();
    var currentSlug = currentTitleSlug();

    // Two-pass current detection. The id is the better key, but a
    // missing data-id binding on the source list would otherwise
    // leave NO row marked and the operator unable to tell which
    // title they are on. So: try ids, and if nothing matched, fall
    // back to the slug in the URL. Gating the fallback on
    // "no id present" instead of "no row matched" was the bug.
    var currentIdx = -1;
    if (currentId) {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].id && rows[i].id === currentId) { currentIdx = i; break; }
      }
    }
    if (currentIdx === -1 && currentSlug) {
      for (var k = 0; k < rows.length; k++) {
        if (rows[k].slug && rows[k].slug === currentSlug) { currentIdx = k; break; }
      }
    }

    var wrap = el('div', 'ix-topbar-switch');

    var btn = el('button', 'ix-topbar-caret');
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Switch title');
    btn.innerHTML =
      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M3 6 L8 11 L13 6"/></svg>';

    var menu = el('div', 'ix-topbar-menu');
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Titles');

    var parentName = publisherName();
    if (parentName) {
      var lbl = el('div', 'ix-topbar-menu-lbl');
      lbl.textContent = parentName;
      menu.appendChild(lbl);
    }

    rows.forEach(function (t, idx) {
      var href = route(CFG.titleRoute, t.slug);
      // No slug means no destination. Render it, flagged, rather
      // than silently dropping a title from the operator's list.
      var item = el(href ? 'a' : 'span', 'ix-topbar-menu-item');
      if (href) item.setAttribute('href', href);
      item.setAttribute('role', 'menuitem');

      var isCurrent = (idx === currentIdx);
      if (isCurrent) item.setAttribute('aria-current', 'page');

      if (t.code) {
        var code = el('span', 'code');
        code.textContent = t.code;
        item.appendChild(code);
      }
      var nm = el('span', 'nm');
      nm.textContent = t.name;
      item.appendChild(nm);

      if (isCurrent) {
        var tick = el('span', 'tick');
        tick.setAttribute('aria-hidden', 'true');
        tick.textContent = '\u2713';
        item.appendChild(tick);
      }
      menu.appendChild(item);
    });

    wrap.appendChild(btn);
    wrap.appendChild(menu);

    function close() {
      wrap.classList.remove('ix-switch-open');
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = wrap.classList.toggle('ix-switch-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && wrap.classList.contains('ix-switch-open')) {
        close();
        btn.focus();
      }
    });

    return wrap;
  }

  function readTitleRows() {
    var out = [];
    document.querySelectorAll('.ta-title-src').forEach(function (elm) {
      var d = elm.dataset;
      var name = (d.name || '').trim();
      if (!name) return;                    // unbound row
      out.push({
        id:   (d.id || '').trim(),
        name: name,
        slug: (d.slug || '').trim(),
        code: (d.code || '').trim()
      });
    });
    return out;
  }

  // The current T-A record id, same element client-manager reads.
  function currentTitleId() {
    var host = document.querySelector('#title-admin-id');
    var v = host ? (host.getAttribute('data-ta') || '').trim() : '';
    return isRecordId(v) ? v : '';
  }

  // Fallback when data-ta carries a name rather than an id: the
  // last path segment of the current URL is the title slug.
  function currentTitleSlug() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    return parts.length ? decodeURIComponent(parts[parts.length - 1]) : '';
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
    'Default Layout':    '📐',   // v1.0.3 — was the one tab with no entry
    // v1.0.6 — the six tabs added in Designer Sep 5.
    'Create':            '✚',   // text-style char, CSS color-able
    'PrintIssue':        '📰',  // the print issue itself
    'Awaiting':          '⏳',  // waiting for a home
    'Mailchimp':         '📨',  // outgoing
    'Nexstar':           '📡',  // broadcast
    'Flights':           '✈️'    // a buy running over a period
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
    'Studio': 'var(--ix-rail-alert, #F08A73)',
    'Create': 'var(--ix-gold, #C4A35A)'
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

  // ══════════════════════════════════════════════════════════
  // RAIL GROUPING  (v1.0.6)
  // ══════════════════════════════════════════════════════════

  // The order of work, top to bottom. `n` is the stage marker — a
  // number where sequence is real, a middot where it is not.
  var RAIL_GROUPS = [
    { n: '01', l: 'Content',    tabs: ['Studio', 'Create', 'ContentLibrary'] },
    { n: '02', l: 'Allocate',   tabs: ['PrintIssue'] },
    { n: '03', l: 'Plan',       tabs: ['PubPlan', 'Awaiting', 'Obligations', 'Sponsorships', 'Newsletters'] },
    { n: '04', l: 'Send',       tabs: ['Mailchimp', 'Nexstar'] },
    { n: '05', l: 'Measure',    tabs: ['Performance'] },
    { n: '\u00b7', l: 'Commercial', tabs: ['CLIENTS', 'Flights'] },
    { n: '\u00b7', l: 'Setup',      tabs: ['Default Layout', 'Print Magazine'] }
  ];

  // Tab exists, page does not. Dimmed with a SOON marker.
  var NOT_BUILT = {
    'Create': 1, 'Awaiting': 1, 'Mailchimp': 1, 'Nexstar': 1, 'Flights': 1
  };

  // Marked here, hidden by §37 — undoable without a JS bump.
  var RETIRED = { 'Uploads Processor': 1, 'Content Maker': 1 };
  var RETIRE_HIDDEN = true;

  // Present but on its way out.
  var DEPRECATED = { 'Print Magazine': 1 };

  function railHeader(g) {
    var d = document.createElement('div');
    d.className = 'ta-rg-h';
    d.setAttribute('data-ta-rg', '1');
    d.innerHTML = '<span class="ta-rg-n"></span><span class="ta-rg-l"></span>';
    d.firstChild.textContent = g.n;
    d.lastChild.textContent = g.l;
    return d;
  }

  function groupRail() {
    // NOT section.publ-navmenu — that is the topbar. §35 makes
    // .dashboard-tabs.w-tabs a flex row and .w-tab-menu its 208px
    // left column; that column is the rail.
    var container = document.querySelector('.dashboard-tabs.w-tabs .vertical-tabs.w-tab-menu') ||
                    document.querySelector('.dashboard-tabs.w-tabs .w-tab-menu') ||
                    document.querySelector('.vertical-tabs.w-tab-menu');
    if (!container) return false;

    var tabs = container.querySelectorAll('.pl-link-tabs.w-tab-link');
    if (!tabs || tabs.length < 2) return false;
    if (container.dataset.railGrouped) return true;

    var byKey = {}, all = [];
    Array.prototype.forEach.call(tabs, function (t) {
      var k = t.getAttribute('data-w-tab') || '';
      byKey[k] = t; all.push(t);
      if (RETIRE_HIDDEN && RETIRED[k]) t.classList.add('ta-tab-retired');
      if (DEPRECATED[k]) t.classList.add('ta-tab-dep');
      if (NOT_BUILT[k]) t.classList.add('ta-tab-soon');
    });

    var placed = {};
    RAIL_GROUPS.forEach(function (g) {
      var mine = g.tabs.filter(function (k) { return byKey[k]; });
      if (!mine.length) return;              /* an empty group is not a group */
      container.appendChild(railHeader(g));
      mine.forEach(function (k) {
        container.appendChild(byKey[k]);     /* appendChild MOVES, it does not copy */
        placed[k] = 1;
      });
    });

    // Anything the config did not name keeps a home at the end, so a
    // tab added tomorrow shows up rather than disappearing. Retired
    // tabs travel there too but get NO header — a label over nothing
    // visible is worse than no label.
    var left = all.filter(function (t) {
      return !placed[t.getAttribute('data-w-tab') || ''];
    });
    var visible = left.filter(function (t) {
      return !(RETIRE_HIDDEN && RETIRED[t.getAttribute('data-w-tab') || '']);
    });
    if (visible.length) container.appendChild(railHeader({ n: '\u00b7', l: 'Other' }));
    left.forEach(function (t) { container.appendChild(t); });

    container.dataset.railGrouped = '1';
    document.body.classList.add('ta-rail-grouped');
    return true;
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
