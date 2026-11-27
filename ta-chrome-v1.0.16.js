// ta-chrome-v1.0.16.js
// ============================================================
// ta-chrome-v1.0.16.js
// v1.0.16 (27 Nov 2026, TA Reskin S4e): the group draws its own rows and clicks Webflow's hidden links; v1.0.15 moved
//   Webflow's links into the group, which broke Webflow's tabs (the checks showed it). v1.0.15 never went live.
// v1.0.15 (27 Nov 2026, TA Reskin S4e · CONTENT LIBRARY ON THE RAIL). Jeff, 27 Nov, canvas "One look" page S4e, yes to all:
//   the Asset Library is renamed Content Library (a Designer label; Jeff did it) and stays one rail tab; Ads moves inside it.
//   1. The rail draws Content Library as a group: hovering it (or keyboard focus) opens it downward with Ads, Articles, Events
//      and Real Estate indented under it. On any of the four the group stays open, Content Library is bold and its chevron
//      points up; the open one has the bed and the coral bar.
//   2. Ads is still its own Designer tab and nothing about the Ads pane changes. Webflow's links for Ads and ContentLibrary stay
//      where the Designer put them, hidden; the group is drawn as its own rows (moving Webflow's links breaks its tabs).
//      Articles, Events and Real Estate open the Content Library pane and switch the library to that type (window._clSetMain).
//   3. Clicking "Content Library" itself opens Ads, the first of the four (ruling 6).
//   4. The address: a type is #lib-<type> (articles, events, realestate), so Refresh and Back return to it; Ads stays #Ads.
//   5. The group stands aside when the Designer has separate Articles, Events or RealEstate tabs (the old plan), and when the
//      page has no ContentLibrary tab.
//   HC-P-RESKIN-9: the group's members and their order (Ads, Articles, Events, Real Estate) and its type keys are platform
//   constants here (CL_KIDS). Companion CSS: ta-chrome-v1.0.16.css. Pairs with content-library-v1.0.96.js. Everything else is v1.0.14.
// ============================================================
// (v1.0.14 header follows)
// ta-chrome-v1.0.14.js
// INBXIFY Title-Admin Page Chrome Enhancer
//
// v1.0.14 changes (24 Nov 2026, Jeff: "the T-A address should follow the tab he is on"):
//   THE ADDRESS FOLLOWS THE RAIL TAB. Before, ta-page-body read the word after # once, on load, and the address
//   never changed again (he was on Ads while it still said #PubPlan).
//   1. A PERSON'S CLICK ON A RAIL TAB sets the address to #<tab name> (the tab's data-w-tab, e.g. #Ads, #PubPlan,
//      #Default%20Layout). It REPLACES the current history entry (history.replaceState), so Back gains no step per
//      tab and nothing reloads. The ?query (e.g. ?ixbranch=, ?admaker=open) stays in front of the #. The entry's
//      own state is kept, so Ad Maker's Back steps (pushState { amStep }, ta-admaker v4.11.5 and later) still work.
//   2. ONLY A PERSON'S CLICK WRITES (event.isTrusted). A script that opens a tab (.click()) never touches the
//      address, so modules that keep their own state after the # are left alone: Clients (#client=…&tab=…),
//      the Asset Library (#lib-…, #content-library), ix-return (#ix-tabs=…). Clicking the tab that is already
//      open writes nothing either, so a Clients page at #client=… survives a click on Clients.
//   3. ON LOAD, the tab the address names opens, as ta-page-body v1.2.31 already does for an exact name, and now
//      also for an encoded name (#Default%20Layout), any letter case (#pubplan) and a Designer alias (#Allocator,
//      TAB_ALIASES). An address with "=" in it is a module's own state and is left to that module.
//   4. BACK AND FORWARD: when the address names a different rail tab than the open one, that tab opens. Ad Maker's
//      steps share one address, so they do not trigger it.
//   Hidden tabs are never written or opened. Links from Quill use ?admaker=open (a query), the IPP's Close returns
//   to #PubPlan: both unchanged. Everything else is v1.0.13.
//
// v1.0.13 changes (22 Nov 2026, TA Reskin S1 · the shell):
//   THE PORTAL LOOK: ONE FLAT RAIL IN THE DESIGNER'S ORDER, AND THE NEW HEADER. Pairs with ix-header-v1.0.9.css,
//   title-admin-page-design-v1.4.42.css and ix-tokens-portal-look-v1.0.0.css.
//   1. THE RAIL FOLLOWS THE DESIGNER (addendum ruling 5). Jeff owns the rail's order and labels in the Webflow
//      Designer. This file no longer moves a tab link: no RAIL_GROUPS, no group labels, no numbers, no "Other".
//      It only hides the tabs on HIDDEN_TABS (Create, Uploads Processor, Sponsorships, Print Magazine), and the
//      Asset Library tab ('ContentLibrary') once one of its replacements (Articles, Events, RealEstate) exists
//      (RETIRED_WHEN, HC-P-RESKIN-8). A hidden tab gets .ta-tab-hidden; its link and pane stay in the page, so
//      a link to it still works and nothing that finds a pane by name breaks. Obligations is on the rail.
//      (HC-P-RESKIN-5, changed: the hidden list is the only rail list kept here.)
//   2. NO ICONS. The empty .ta-tab-icon box (v1.0.3) is no longer injected; the Portal rail has no icon column.
//      Labels are still title-cased.
//   3. THE HEADER (S1 shell board). Three cells on a grid:
//        left    the Quill control (staff only, as before: shown by body.ix-operator) and "TA Studio" in capitals
//        centre  the title name (the MOVED h6.title-label, Newsreader 32) with the title switcher's caret beside
//                it, a hairline, and the publisher name under it as the link to the publisher page
//        right   the inbxify logo (MOVED, still an <img>) and the account avatar: the MOVED .sign-in-div with the
//                signed-in member's initial in it (first name if Memberstack has one, else the email's first
//                letter; the email on hover). Nothing else about the account control changes.
//      The title's own letter circle (.ix-topbar-avatar) is gone; the header's avatar is the person's.
//      The band is no longer pinned (position: fixed): it scrolls with the page, as the Portal's does.
//   4. TAB_ALIASES (v1.0.12) unchanged and still runs first, at script load. Tab names are the contract.
//   Everything else carried from v1.0.12: the operator gate, the publisher link and slug chain, the switcher,
//   the record-id guard, the old-banner fallback (fixTitleCircle) when the header cannot be built.
//
// v1.0.12 changes (22 Nov 2026, TA Reskin S1):
//   A TAB RENAMED IN THE DESIGNER NO LONGER BREAKS THE PAGE. On 18 Nov the Print Issues tab's name in the
//   Designer's Tabs settings became 'Allocator'. Four scripts find that pane by the name 'PrintIssue'
//   (ta-print-issues, ta-print-review, ta-cadence-board, this file). Finding none, the Allocator board fell back
//   to drawing inside the Studio pane, so Studio showed the Allocator, and the Issues tab sat blank under Other.
//   · TAB_ALIASES maps a Designer name to the name the code knows ('Allocator' -> 'PrintIssue'). At load, before
//     any later script looks for its pane, the link and the pane carrying the alias get the known name. It runs
//     only when no tab already has the known name. Webflow's own tab switching reads the name at click time,
//     from link and pane alike, so both change together. (HC-P-RESKIN-9)
//   · This file must stay ahead of ta-print-issues and ta-cadence-board in manifests/ta.json.
//   v1.0.11 was never on main; its one change ships here.
//
// v1.0.11 changes (18 Nov 2026, TA Reskin S1; not shipped on its own, carried in v1.0.12):
//   THE ASSET LIBRARY TAB HIDES ONLY WHEN ITS REPLACEMENTS EXIST. v1.0.10 retired 'ContentLibrary' outright, but
//   the typed library tabs ('Articles', 'Events', 'RealEstate') are not in the Designer yet (only 'Ads' is), so
//   the rail lost its only way to Articles, Events and Real Estate. 'ContentLibrary' is now retired only when at
//   least one of those three tabs is on the page; until then it shows in group 02 Content, after Studio.
//   Nothing else changed. Tab names (data-w-tab) are still the contract every module finds its pane by:
//   the Print Issues tab must be named 'PrintIssue' in the Designer's Tabs settings, whatever its label says.
//
// v1.0.10 changes (18 Nov 2026, Ad Maker Build S1):
//   Rail group 02 Content becomes Studio · Articles · Ads · Events · Real Estate (Jeff, T-A Rail Mockup v0.1,
//   approved 8 Nov). 'Create' leaves the rail (each library tab has its own New button; Studio keeps its own
//   Create strip tab) and 'ContentLibrary' is replaced by the four typed tabs. The data-w-tab keys are
//   'Articles', 'Ads', 'Events', 'RealEstate' (the Designer label of the last is "Real Estate"). Icons added for
//   the four. 'ContentLibrary' and 'Create' keep their icon entries so a page that still has those tabs renders.
//
// v1.0.9 changes (Sep 7, 2026):
//   GROUP 01 IS "Print Issues", NOT "Allocate". The tab beneath
//   it is now named Allocator, so a group called Allocate read as
//   a restatement of its only child. The group names the OBJECT
//   being worked on; the tab names the TOOL that works on it —
//   the same relation 02 Content / Studio already had.
//
//   Label only. data-w-tab is untouched and still reads
//   "PrintIssue", which is what the rail keys on: renaming the
//   Designer tab to Allocator did NOT rewrite the attribute
//   (confirmed live, Sep 7). Nothing about the grouping moves.
//
// v1.0.8 changes (Sep 6, 2026):
//   ALLOCATE IS 01, CONTENT IS 02. Print Issue is where the week
//   starts — an issue is allocated before anything is made from
//   it — so the pipeline now opens on Allocate. Reordering
//   RAIL_GROUPS is the entire change; the rail renders in array
//   order and the numbers are read off it, so nothing else moves.
//
//   NOT_BUILT IS EMPTY. The five dimmed SOON tabs were meant to
//   show the shape of the finished system. In use they read as
//   broken rather than forthcoming, so every tab now renders live.
//
//   CONSEQUENCE, STATED PLAINLY: Create, Awaiting, Mailchimp,
//   Nexstar and Flights have Designer panes but no surface behind
//   them. Clicking one now lands on an empty pane with no
//   explanation, where before it was visibly not-yet. That is the
//   trade. The object is kept rather than deleted so restoring
//   the treatment for any single tab is one word, and the
//   .ta-tab-soon branch below is left intact for the same reason.
//
//   Pairs with title-admin-page-design v1.4.40 (§37c), which
//   replaces the gold section pills with the hairline rule.
//
// v1.0.7 changes (Sep 5, 2026):
//   ICONS OFF. Eighteen emoji plus seven numbered group labels is
//   two systems doing one job. The icons were there to chunk a
//   flat list visually; the groups now do that properly, so the
//   emoji became decoration competing with the 01/02 markers.
//
//   SHOW_TAB_ICONS = false turns them off. injectTabIcons still
//   runs and still injects an EMPTY .ta-tab-icon span, because
//   the rail indents against that fixed-width box — removing the
//   span would shift every label left by 20px. Flip the flag back
//   to true and the emoji return with no other change.
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

  var VERSION = '1.0.16';

  // v1.0.12 — Designer tab name -> the name every module finds its
  // pane by. Runs now, at script load, not in init(): the scripts
  // listed after this one look for their panes as soon as they run.
  var TAB_ALIASES = { 'Allocator': 'PrintIssue' };   // HC-P-RESKIN-9
  (function normaliseTabNames() {
    try {
      Object.keys(TAB_ALIASES).forEach(function (from) {
        var to = TAB_ALIASES[from];
        if (document.querySelector('.w-tab-pane[data-w-tab="' + to + '"]')) return;
        var els = document.querySelectorAll('.w-tab-link[data-w-tab="' + from + '"], .w-tab-pane[data-w-tab="' + from + '"]');
        for (var i = 0; i < els.length; i++) els[i].setAttribute('data-w-tab', to);
        if (els.length) console.info('[ta-chrome] tab "' + from + '" is known to the code as "' + to + '"; renamed on the page (' + els.length + ' elements).');
      });
    } catch (e) { console.error('[ta-chrome] tab name pass failed', e); }
  })();

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
    titleCaseTabs();
    flatRail();
    clGroup();             // v1.0.15
    // Only paint the old banner's circle if the topbar did NOT
    // take over. If it did, the banner tile is hidden and the
    // work would be discarded.
    if (!pinned) fixTitleCircle();
    if (pinned) gateOperator();
    addressFollowsTab();   // v1.0.14
  }

  // ══════════════════════════════════════════════════════════
  // THE ADDRESS FOLLOWS THE TAB  (v1.0.14)
  // ══════════════════════════════════════════════════════════
  function railLinks() {
    return Array.prototype.slice.call(document.querySelectorAll('.dashboard-tabs.w-tabs .w-tab-menu .w-tab-link[data-w-tab]'));
  }
  // The rail tab the address names, or null. "#client=…" and the like belong to modules.
  function tabInAddress() {
    var raw = (location.hash || '').replace(/^#/, '');
    if (!raw || raw.indexOf('=') > -1) return null;
    var name;
    try { name = decodeURIComponent(raw); } catch (e) { name = raw; }
    if (TAB_ALIASES[name]) name = TAB_ALIASES[name];
    var want = name.toLowerCase();
    var hit = null;
    railLinks().forEach(function (a) {
      if (!hit && String(a.getAttribute('data-w-tab')).toLowerCase() === want) hit = a;
    });
    return hit && !hit.classList.contains('ta-tab-hidden') ? hit : null;
  }
  function openFromAddress() {
    var a = tabInAddress();
    if (a && !a.classList.contains('w--current')) a.click();   // a script click: writes nothing
  }
  function addressFollowsTab() {
    var menu = document.querySelector('.dashboard-tabs.w-tabs .w-tab-menu');
    if (!menu || menu.dataset.addrOn) return;
    menu.dataset.addrOn = '1';
    menu.addEventListener('click', function (e) {
      if (!e.isTrusted) return;
      var a = e.target && e.target.closest && e.target.closest('.w-tab-link[data-w-tab]');
      if (!a || a.classList.contains('ta-tab-hidden') || a.classList.contains('w--current')) return;
      var want = '#' + encodeURIComponent(a.getAttribute('data-w-tab'));
      if (location.hash === want) return;
      try { history.replaceState(history.state, '', location.pathname + location.search + want); } catch (err) {}
    }, true);
    window.addEventListener('popstate', openFromAddress);
    window.addEventListener('hashchange', openFromAddress);
    if (document.readyState === 'complete') setTimeout(openFromAddress, 150);
    else window.addEventListener('load', function () { setTimeout(openFromAddress, 150); });
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
          paintAccount(res, email);   // v1.0.13 — the avatar shows the member's initial
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

  // v1.0.13 — the account avatar: the member's first-name initial if Memberstack has one, else the email's
  // first letter. The full email is the hover text. Display only; the account control is otherwise untouched.
  function paintAccount(res, email) {
    var dot = document.querySelector('.ix-topbar .sign-in-div .div-block-20048144');
    if (!dot) return;
    var d = res && res.data ? res.data : res;
    var cf = (d && d.customFields) || {};
    var first = cf['first-name'] || cf.firstName || cf['first_name'] || cf.name || '';
    var last = cf['last-name'] || cf.lastName || cf['last_name'] || '';
    var ini = (firstLetter(first) + firstLetter(last)) || firstLetter(email);
    dot.textContent = ini;
    dot.classList.add('ix-topbar-initials');
    if (email) dot.parentNode.setAttribute('title', email);
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
  // v1.0.13 — the Portal header: three grid cells (left, centre, right). Nodes are MOVED, never copied.
  function buildTopbar() {
    var nav = document.querySelector('section.publ-navmenu');
    var container = nav && nav.querySelector('.navmenu-container');
    var titleEl = document.querySelector('h6.title-label');

    if (!nav || !container || !titleEl) return false;
    if (container.querySelector('.ix-topbar')) return true;   // idempotent

    var pubName = titleEl.textContent.trim();
    if (!pubName) return false;

    var parentName = publisherName();
    var bar = el('div', 'ix-topbar');

    // ── left: the Quill control (staff only) and the surface label ──
    var left = el('div', 'ix-topbar-l');
    left.appendChild(buildBackControl());          // hidden until gateOperator() says otherwise
    var place = el('span', 'ix-topbar-place');
    place.textContent = 'TA Studio';
    left.appendChild(place);

    // ── centre: title name + switcher, hairline, publisher link ──
    var centre = el('div', 'ix-topbar-c');
    titleEl.classList.add('ix-topbar-pub');
    titleEl.setAttribute('title', pubName);
    var titleRow = el('div', 'ix-topbar-titlerow');
    titleRow.appendChild(titleEl);
    var switcher = buildTitleSwitch();
    if (switcher) titleRow.appendChild(switcher);
    centre.appendChild(titleRow);
    var hair = el('div', 'ix-topbar-hair');
    hair.setAttribute('aria-hidden', 'true');
    centre.appendChild(hair);
    if (parentName) {
      var href = route(CFG.publisherRoute, publisherSlug());
      var parentLine = el(href ? 'a' : 'span', 'ix-topbar-parent');
      if (href) {
        parentLine.setAttribute('href', href);
        parentLine.setAttribute('title', 'Open ' + parentName);
      }
      parentLine.textContent = parentName;
      centre.appendChild(parentLine);
    }

    // ── right: logo and account ──
    var right = el('div', 'ix-topbar-r');
    var logo = document.querySelector('.inbxify-logo');
    var account = document.querySelector('.sign-in-div');
    if (logo) {
      if (!logo.getAttribute('alt')) logo.setAttribute('alt', 'inbxify');
      right.appendChild(logo);
    }
    if (account) {
      account.classList.add('ix-topbar-account');
      right.appendChild(account);
    }

    bar.appendChild(left);
    bar.appendChild(centre);
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
    a.setAttribute('aria-label', 'All titles, in Quill');
    a.setAttribute('title', 'All titles, in Quill');
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

  // ── Proper capitalization ──
  function titleCase(str) {
    return str.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  // v1.0.13 — labels are title-cased as before; the icon box is gone.
  function titleCaseTabs() {
    document.querySelectorAll('.pl-link-tabs.w-tab-link .pl-label-sm').forEach(function (label) {
      if (label.dataset.caseDone) return;
      label.dataset.caseDone = '1';
      label.textContent = titleCase(label.textContent.trim());
    });
  }

  // ══════════════════════════════════════════════════════════
  // THE RAIL  (v1.0.13 · one flat list in the Designer's order)
  // ══════════════════════════════════════════════════════════
  // Jeff orders and names the tabs in the Designer; this file only hides. Keys are data-w-tab values (after
  // TAB_ALIASES), platform-level and the same for every title. (HC-P-RESKIN-5)
  var HIDDEN_TABS = { 'Create': 1, 'Uploads Processor': 1, 'Sponsorships': 1, 'Print Magazine': 1, 'ContentLibrary': 1 };

  // A tab hidden in favour of others is hidden only once one of its replacements is on the page. (HC-P-RESKIN-8)
  var RETIRED_WHEN = { 'ContentLibrary': ['Articles', 'Events', 'RealEstate'] };
  function isHidden(k, byKey) {
    if (!HIDDEN_TABS[k]) return false;
    var needs = RETIRED_WHEN[k];
    if (!needs) return true;
    return needs.some(function (n) { return !!byKey[n]; });
  }

  function flatRail() {
    var container = document.querySelector('.dashboard-tabs.w-tabs .vertical-tabs.w-tab-menu') ||
                    document.querySelector('.dashboard-tabs.w-tabs .w-tab-menu') ||
                    document.querySelector('.vertical-tabs.w-tab-menu');
    if (!container) return false;
    var tabs = container.querySelectorAll('.pl-link-tabs.w-tab-link');
    if (!tabs || tabs.length < 2) return false;
    if (container.dataset.railFlat) return true;

    var byKey = {};
    Array.prototype.forEach.call(tabs, function (t) { byKey[t.getAttribute('data-w-tab') || ''] = t; });
    var hidden = [];
    Array.prototype.forEach.call(tabs, function (t) {
      var k = t.getAttribute('data-w-tab') || '';
      if (isHidden(k, byKey)) { t.classList.add('ta-tab-hidden'); t.setAttribute('aria-hidden', 'true'); t.setAttribute('tabindex', '-1'); hidden.push(k); }
    });
    container.setAttribute('aria-label', 'TA Studio');

    // If Webflow opened a hidden tab (its default tab is one the rail no longer shows), open the first shown one.
    var cur = container.querySelector('.w-tab-link.w--current');
    if (cur && cur.classList.contains('ta-tab-hidden')) {
      var first = container.querySelector('.w-tab-link:not(.ta-tab-hidden)');
      if (first) first.click();
    }

    container.dataset.railFlat = '1';
    document.body.classList.add('ta-rail-flat');
    if (hidden.length) console.info('[ta-chrome] rail: hidden ' + hidden.join(', '));
    return true;
  }


  // ══════════════════════════════════════════════════════════
  // CONTENT LIBRARY GROUP  (v1.0.15)
  // ══════════════════════════════════════════════════════════
  var CL_PARENT = 'ContentLibrary';
  var CL_KIDS = [                                                       // HC-P-RESKIN-9
    { key: 'ads',        tab: 'Ads' },
    { key: 'articles',   label: 'Articles' },
    { key: 'events',     label: 'Events' },
    { key: 'realestate', label: 'Real Estate' }
  ];
  var CLG = null;   // { wrap, par, kids, realCL, realAds, type }

  function clSetType(type, tries) {
    tries = tries || 0;
    if (typeof window._clSetMain === 'function') { window._clSetMain(type); return; }
    if (tries < 40) setTimeout(function () { clSetType(type, tries + 1); }, 150);   // the library loads after auth
  }
  function clGo(link, hash) {
    if (link) link.click();                                                   // Webflow opens the pane
    try { history.replaceState(history.state, '', location.pathname + location.search + '#' + hash); } catch (e) {}
    clPaint();
  }
  function clOpen(type) {
    if (!CLG) return;
    CLG.type = type;
    clGo(CLG.realCL, 'lib-' + type);
    clSetType(type);
  }
  function clPaint() {
    if (!CLG) return;
    var clOn = CLG.realCL.classList.contains('w--current');
    var adsOn = !!(CLG.realAds && CLG.realAds.classList.contains('w--current'));
    CLG.wrap.classList.toggle('is-here', clOn || adsOn);
    CLG.par.setAttribute('aria-expanded', (clOn || adsOn) ? 'true' : 'false');
    CL_KIDS.forEach(function (k) {
      var el = CLG.kids[k.key]; if (!el) return;
      var on = k.tab ? adsOn : (clOn && (CLG.type || 'articles') === k.key);
      el.classList.toggle('is-on', on);
      if (on) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
    });
  }
  function clRow(cls, label, onClick) {
    var el = document.createElement('a'); el.href = '#'; el.className = cls; el.setAttribute('role', 'tab');
    var l = document.createElement('span'); l.className = 'ta-clg-label'; l.textContent = label; el.appendChild(l);
    el.addEventListener('click', function (e) { e.preventDefault(); onClick(); });
    return el;
  }
  function labelOf(link, fallback) { var l = link && link.querySelector('.pl-label-sm'); return (l && l.textContent.trim()) || fallback; }
  // Webflow's own tab links stay where the Designer put them (moving them breaks Webflow's tabs); they are hidden, and
  // the group is drawn as its own rows in the Content Library tab's place. A row's click clicks the hidden Webflow link.
  function clGroup() {
    var container = document.querySelector('.dashboard-tabs.w-tabs .w-tab-menu');
    if (!container || container.dataset.clGroup) return;
    var byKey = {};
    Array.prototype.forEach.call(container.querySelectorAll('.w-tab-link[data-w-tab]'), function (t) { byKey[t.getAttribute('data-w-tab')] = t; });
    var realCL = byKey[CL_PARENT], realAds = byKey.Ads;
    if (!realCL || byKey.Articles || byKey.Events || byKey.RealEstate) return;
    container.dataset.clGroup = '1';
    [realCL, realAds].forEach(function (t) { if (t) { t.classList.add('ta-tab-hidden'); t.setAttribute('aria-hidden', 'true'); t.setAttribute('tabindex', '-1'); } });

    var wrap = document.createElement('div'); wrap.className = 'ta-clg';
    var par = clRow('ta-clg-par', labelOf(realCL, 'Content Library'), function () { if (realAds) clGo(realAds, 'Ads'); else clOpen('articles'); });
    par.setAttribute('aria-haspopup', 'true');
    var chev = document.createElement('span'); chev.className = 'ta-clg-chev'; chev.setAttribute('aria-hidden', 'true'); par.appendChild(chev);
    var sub = document.createElement('div'); sub.className = 'ta-clg-sub'; sub.setAttribute('role', 'group');
    var kids = {};
    CL_KIDS.forEach(function (k) {
      if (k.tab && !realAds) return;
      var el = k.tab ? clRow('ta-clg-kid', labelOf(realAds, 'Ads'), function () { clGo(realAds, 'Ads'); })
                     : clRow('ta-clg-kid', k.label, function () { clOpen(k.key); });
      el.setAttribute('data-cl-kid', k.key); sub.appendChild(el); kids[k.key] = el;
    });
    wrap.appendChild(par); wrap.appendChild(sub);
    realCL.parentNode.insertBefore(wrap, realCL);
    CLG = { wrap: wrap, par: par, kids: kids, realCL: realCL, realAds: realAds, type: null };
    document.body.classList.add('ta-clg-on');
    window.TaRail = window.TaRail || {}; window.TaRail.clGroup = true;

    document.addEventListener('cl:type', function (e) { if (e.detail && e.detail.type) { CLG.type = e.detail.type; clPaint(); } });
    new MutationObserver(clPaint).observe(container, { subtree: true, attributes: true, attributeFilter: ['class'] });
    var m = /^#lib-(articles|events|realestate)$/.exec(location.hash || '');
    if (m) setTimeout(function () { clOpen(m[1]); }, 0);
    clPaint();
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
