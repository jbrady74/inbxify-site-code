/* ════════════════════════════════════════════════════════════════
   ta-cadence-board-v0.2.1.js
   INBXIFY T-A — Cadence Board · SKELETON
   Companion: ta-cadence-board-v0.2.1.css (matched pair — load both)

   ── v0.2.1 — CONTROLS COLLAPSE TO ICONS ──
   v0.1.3 kept the search box and both chip rows permanently open,
   which cost roughly 70px of every lane before a single item showed.
   In a 26%-wide column that is a lot of the useful area spent on
   controls the operator is not currently using.

   Now: three thin icons — search, filter, sort — sit on the column
   title row itself, right-aligned beside the collapse chevron. No
   second row. Clicking one opens its panel beneath the header;
   clicking it again closes it. One panel at a time per lane, so the
   controls never stack up and re-eat the lane.

   THE RISK THIS CREATES, AND THE ANSWER: a hidden control that is
   still filtering makes a lane look broken — you search "sept",
   collapse the panel, come back later and see three items where
   there should be forty. So an icon whose control is IN FORCE turns
   gold and carries a dot. Sort only marks itself when it is off its
   default. Nothing filters invisibly.

   Search box is ~20% shorter, and the whole control strip is tuned
   for the narrow column rather than borrowed from a full-width form.

   ── v0.1.3 — TENANT ID, PERSISTED LAYOUT, SEARCH / SORT / FILTER ──

   1. TENANT ID — the multi-tenant invariant was not being enforced.
      v0.1.2 read the tenant from the webhook response
      (data.tenant.titleAdminId), copying ta-canvas. Scenario I does
      not echo that back here, so tenantId was null and BOTH tenant
      filters were no-ops. Nothing leaked, because Scenario I scopes
      by titleSlug server-side — but the client guard was decorative,
      which is worse than absent because it looks like protection.

      Now read from TA_CONFIG.taItemId, the canonical page-level id
      that content-library and client-manager both use. Better than
      the webhook in two ways: it exists BEFORE the fetch resolves, so
      the filter is live from first render, and it does not depend on
      a response shape that can change without notice. The webhook
      value stays as a fallback.

   2. PERSISTED LAYOUT — v0.1.2 persisted `view` and nothing else, so
      Focus and collapse evaporated on reload. Arbitrary: a surface
      that remembers which view you were in should remember how you
      had arranged it. All three now persist together.

   3. SEARCH — one box per lane, matching name, customer, and DATE.
      Typing "September" or "Sept" matches items created that month.

      THE TRAP: Webflow stores dates in UTC and the operator is US
      Eastern, so an item created 1 Sep 00:30 UTC was created 31 Aug
      20:30 Eastern. Month-name search would silently mis-file every
      item near a month boundary. Dates are therefore formatted with
      an explicit IANA zone, per-title, defaulting America/New_York —
      the standing UTC-offset rule, which applies to search exactly
      as it applies to mastheads.

   4. SORT + TYPE FILTER on both lanes. Newest / Oldest / A–Z, and on
      Assets a chip row for Article / Ad / Event / RE.

   NOT YET: the ta-canvas kind-ordering (TXT→IMG→VID→AUD) and the
   Available/In-Use status chips. Both are ports, not inventions, and
   belong in the pass where the Components lane gets its real
   behaviour rather than bolted on here.

   ── v0.1.2 — MOUNT TARGET FIX + unconditional load logging ──
   v0.1.1 resolved its host with querySelector('[data-w-tab="Studio"]').
   On this page that attribute is carried by TWELVE elements: an <a>
   tab LINK for each tab and a <div> tab PANE for each. Webflow emits
   every link before any pane, so the first match was always the link.
   The board mounted inside a tab button — a 30px anchor — and was
   invisible. Confirmed in the field:
     host: a#w-tabs-0-data-w-tab-0.pl-link-tabs...w--current
     legacyKept: Array(1)   ← the link's label span, not the panels

   FIX: resolve panes only. The pane carries BOTH .w-tab-pane and a
   per-tab class (.tab-pane-studio), so the selector is specific twice
   over, and a final guard rejects any host that is not a DIV carrying
   .w-tab-pane. Mounting into the wrong element must fail loudly rather
   than silently succeed in the wrong place.

   ALSO: load and mount now log UNCONDITIONALLY. v0.1.1 routed both
   through log(), which is gated on TA_CONFIG.debug, so a failed mount
   produced no console line at all and looked identical to a file that
   never loaded. Every other file in the stack announces itself on
   load; this one now does too.

   ── v0.1.1 — LEGACY/NEW SWITCH + real feed contract ──
   v0.1.0 called host.innerHTML = '' on whatever pane it found. On a
   page with no Cadence tab that pane is Studio, so loading the script
   destroyed all eight Studio panels for the session. Reversible by
   removing the script tag, but not a preview — working tools went
   away. That was wrong and this bump removes it.

   The pattern is the one issues-tab v1.0.17 already uses on the
   PubPlan tab: the legacy DOM is HIDDEN (display:none), never
   removed, and the new surface mounts as a SIBLING. Both trees stay
   in the document; a switch decides which is visible. Flipping back
   is instant and total — no reload, nothing to restore, no risk that
   a failed teardown leaves the operator with neither surface.

   ALSO IN THIS BUMP
   · Legacy/New switch in the app bar, persisted per browser, and a
     matching pill injected into the legacy view so the way back is
     visible from BOTH sides. A one-way door is not a switch.
   · Defaults to LEGACY. A skeleton must not seize the tab on first
     load just because its script tag went in.
   · Real Scenario I contract, read from ta-canvas v0.1.1 rather than
     guessed: media + mediaExtra merged; assets are articles / ads /
     events / reListings (v0.1.0 guessed "listings" — wrong key, the
     lane would have rendered permanently empty).
   · TENANT FILTER RESTORED. v0.1.0 dropped it, which could have
     shown another title's assets — a direct breach of the
     multi-tenant invariant. Media filter on fieldData['title-admin'];
     articles on 'associated-title'; ads/events/RE on the 'titles'
     array. Same predicates the Canvas uses.
   · Loud zero-result diagnosis on the Issues lane, mirroring
     issues-tab: name the missing DOM contract instead of rendering a
     silent empty column.

   Governed by Cadence-Board-Scoping v0.2. This file implements the
   structural decisions only; lane behaviour lands in later bumps.

   IN THIS BUMP
     · D-CB-1  Issue-agnostic left (Components, Assets), issue-scoped
               right (Issues). No board-level plan selector — the
               reversal of D-CVS-9 is structural, not cosmetic, so it
               is expressed here as the absence of a plan bar.
     · D-CB-2  Two operations on one surface. Create flows left, Plan
               sits right; the operator moves left-to-right without a
               mode switch.
     · D-CB-3  Collapse to 44px rails. Any column, any time.
     · D-CB-21 Focus state = MANUAL toggle. Planning Status carries
               only In Progress / Locked and Locked is already spoken
               for by the read-only view, so there is no third state
               to fire on. Focus collapses columns 1+2 and gives the
               width to Issues. Still fully editable — focus, not
               lockdown.
     · D-CB-5  print-edition-url surfaces as a per-issue link, new
               tab, hidden when absent.
     · Column 3 is "Issues", never "Print Issues" — that name died
       when a real print artifact arrived on the same surface.

   NOT IN THIS BUMP (deliberate)
     · + New tool menu (D-CB-25) — needs the eight actions wired.
     · Assign / attach, ASF hand-off, bundle bar.
     · Print intake + manifest (§05), locked-issue view (D-CB-14).
     Tiles render and columns behave; nothing writes yet.

   DATA
     · Components + Assets: Scenario I via TA_CONFIG.makeBundles —
       the same contract ta-canvas v0.1.1 proved. Not re-invented.
     · Issues: harvested from the T-A page's .pubplan-item hidden
       collection, same source as pubplan-overview v1.0.12.
     · No hardcoded tenant, title, publisher or URL anywhere. Missing
       config hard-fails with a visible message rather than guessing.

   MOUNT
     Mount-agnostic, because D-CB-24's Studio replacement is a Webflow
     Designer action this file must not depend on. Resolution order:
       1. [data-ix-board]        — explicit host, board owns it
       2. [data-w-tab="Cadence"] — real tab, board owns it
       3. [data-w-tab="Studio"]  — SHARED. Legacy hidden, not removed.
     In cases 1 and 2 the host is ours and the switch is hidden: there
     is no legacy surface to go back to. Only case 3 is a co-tenancy,
     and only there does the switch appear.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var VERSION = '0.2.1';
  var TAG = '[cadence-board v' + VERSION + ']';

  var RAIL_PX = 44;           // D-CB-3 — matches the mockup lock
  var COLS = [
    { id: 'components', label: 'Components', scope: 'free',  hint: 'Files that passed conditioning' },
    { id: 'assets',     label: 'Assets',     scope: 'free',  hint: 'Articles, ads, events, listings' },
    { id: 'issues',     label: 'Issues',     scope: 'issue', hint: 'Plans and editions' }
  ];

  function cfg() { return (typeof window !== 'undefined' && window.TA_CONFIG) ? window.TA_CONFIG : null; }
  function log() {
    var c = cfg();
    if (c && c.debug) { try { console.log.apply(console, [TAG].concat([].slice.call(arguments))); } catch (e) {} }
  }

  /* ── State ──
     collapsed is per-column and survives a Focus toggle, because an
     operator who deliberately shut Components before entering Focus
     should not find it reopened on the way out. focusPrev remembers
     what Focus itself changed so leaving restores only that. */
  var VIEW_KEY = 'ixcb.view';   // per-browser, per-operator. Studio is single-operator by design.

  var S = {
    mounted:   false,
    shared:    false,   // true only when co-tenant with the Studio pane
    view:      'legacy',
    host:      null,
    legacyKept: [],     // legacy children we hid — restored verbatim on switch back
    root:      null,
    loading:   false,
    error:     null,
    data:      null,
    tenantId:  null,
    plans:     [],
    collapsed: { components: false, assets: false, issues: false },
    q:         { components: '', assets: '' },
    sort:      { components: 'new', assets: 'new' },
    typeFilter: '',        // '' = all; otherwise an ASSET_KEYS type
    open:      { components: '', assets: '' },   // '' | 'q' | 'filter' | 'sort'

    focus:     false,
    focusPrev: null,
    lastFetchAt: 0
  };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ═══════════════════════════════════════════
     FEED — Scenario I (Components + Assets)
     Contract lifted verbatim from ta-canvas v0.1.1. No hardcoded
     fallback URL: a missing config is a visible failure, not a
     silent guess at someone else's endpoint.
     ═══════════════════════════════════════════ */

  /* The canonical page-level TITLE-ADMIN id. content-library and
     client-manager both read this; the board now agrees with them. */
  function tenantId() {
    var c = cfg();
    return (c && c.taItemId) || null;
  }

  /* Per-title IANA zone. Webflow dates are UTC and the operator is
     not, so every date rendered or searched needs an explicit zone or
     month-boundary items land in the wrong month. */
  function titleTz() {
    var c = cfg();
    return (c && (c.timeZone || c.timezone)) || 'America/New_York';
  }

  function scenarioIUrl() {
    var c = cfg();
    return (c && typeof c.makeBundles === 'string' && c.makeBundles) ? c.makeBundles : null;
  }

  function fetchData(reason) {
    if (S.loading) return;
    var c = cfg();
    if (!c || !c.titleSlug) {
      S.error = 'TA_CONFIG.titleSlug missing — cannot identify tenant.';
      renderAll(); return;
    }
    var url = scenarioIUrl();
    if (!url) {
      S.error = 'TA_CONFIG.makeBundles missing — the board cannot load Components or Assets.';
      renderAll(); return;
    }
    S.loading = true; S.error = null;
    renderAll();
    log('fetch', reason || '');

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titleSlug: c.titleSlug })
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Scenario I returned ' + res.status);
      return res.json();
    })
    .then(function (data) {
      if (!data || data.ok !== true) throw new Error('Scenario I response missing ok=true');
      S.data = data;
      /* Config first — see header note 1. The webhook value is only a
         fallback now, not the source of truth. */
      S.tenantId = tenantId() || (data.tenant && data.tenant.titleAdminId) || null;
      S.loading = false; S.error = null;
      S.lastFetchAt = Date.now();
      renderAll();
    })
    .catch(function (err) {
      console.error(TAG, 'fetch error:', err);
      S.loading = false;
      S.error = (err && err.message) || 'Could not load the feed.';
      renderAll();
    });
  }

  /* Components = MEDIA only (D-CVS-5, carried forward). Anything that
     has not passed Scenario B is in no collection and must not appear
     here — the lane is not a file browser.

     media + mediaExtra are merged because Scenario I splits them; the
     Canvas and the Intake Manager both do this and a lane that read
     only `media` would silently under-report. */
  /* ── Date handling ──
     Webflow item dates live at the item level (createdOn / lastPublished),
     not inside fieldData. Both are checked, plus a couple of field-level
     fallbacks for records that carry their own date. */
  function itemDate(rec) {
    if (!rec) return '';
    var fd = rec.fieldData || {};
    return rec.createdOn || rec.lastPublished || rec.lastUpdated ||
           fd['created-on'] || fd['publish-date'] || fd['date'] || '';
  }

  function dateMs(rec) {
    var t = Date.parse(itemDate(rec));
    return isNaN(t) ? 0 : t;
  }

  /* Searchable date text, zoned. "september 2026 sep 09/14/2026" — so
     "September", "Sept", "sep", "2026" and "09/14" all match the same
     item, and an item created just after midnight UTC on the 1st is
     filed under the month the operator actually experienced. */
  var _dtCache = {};
  function dateTokens(rec) {
    var iso = itemDate(rec);
    if (!iso) return '';
    if (_dtCache[iso] !== undefined) return _dtCache[iso];
    var d = new Date(iso);
    if (isNaN(d.getTime())) { _dtCache[iso] = ''; return ''; }
    var tz = titleTz(), out = '';
    try {
      var long  = new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'long',  year: 'numeric' }).format(d);
      var short = new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'short' }).format(d);
      var num   = new Intl.DateTimeFormat('en-US', { timeZone: tz, month: '2-digit', day: '2-digit', year: 'numeric' }).format(d);
      /* "Sep" is what Intl gives; "sept" is what a person types. Both. */
      out = (long + ' ' + short + ' ' + short + 't ' + num).toLowerCase();
    } catch (e) {
      out = String(iso).toLowerCase();
    }
    _dtCache[iso] = out;
    return out;
  }

  function displayName(rec) {
    var fd = (rec && rec.fieldData) || rec || {};
    return fd.name || fd['article-title'] || fd.title || fd.slug || (rec && rec.id) || 'Untitled';
  }

  function customerName(rec) {
    var fd = (rec && rec.fieldData) || {};
    return fd['customer-name'] || fd['business-name'] || fd['advertiser'] || '';
  }

  /* One haystack per item, built once per render pass. Matching is
     AND across whitespace-separated terms, so "sept ad" narrows
     rather than widens — which is what a person expects from a
     second word. */
  function matches(hay, q) {
    var terms = String(q || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return true;
    for (var i = 0; i < terms.length; i++) {
      if (hay.indexOf(terms[i]) === -1) return false;
    }
    return true;
  }

  function sortRecs(list, mode, nameOf, recOf) {
    var arr = list.slice();
    arr.sort(function (a, b) {
      var ra = recOf(a), rb = recOf(b);
      if (mode === 'az')  return nameOf(a).toLowerCase().localeCompare(nameOf(b).toLowerCase());
      if (mode === 'old') return dateMs(ra) - dateMs(rb);
      return dateMs(rb) - dateMs(ra);   // 'new'
    });
    return arr;
  }

  function components() {
    var d = S.data;
    if (!d) return [];
    var a = Array.isArray(d.media)      ? d.media      : [];
    var b = Array.isArray(d.mediaExtra) ? d.mediaExtra : [];
    var list = filterMediaByTenant(a.concat(b), S.tenantId);
    var q = S.q.components;
    if (q) {
      list = list.filter(function (m) {
        var fd = m.fieldData || m;
        var hay = (displayName(m) + ' ' + (fd.slug || '') + ' ' + dateTokens(m)).toLowerCase();
        return matches(hay, q);
      });
    }
    return sortRecs(list, S.sort.components, displayName, function (r) { return r; });
  }

  /* MULTI-TENANT INVARIANT. v0.1.0 shipped without these two
     predicates, which meant an untenanted Scenario I payload would
     have rendered another title's records. Both are lifted verbatim
     from ta-canvas v0.1.1 rather than re-derived. */
  function filterMediaByTenant(items, tenantId) {
    if (!tenantId) return items;
    return items.filter(function (it) {
      var fd = it && it.fieldData;
      return fd && fd['title-admin'] === tenantId;
    });
  }

  function assetBelongsToTenant(rec, type, tenantId) {
    if (!tenantId) return true;
    var fd = rec && rec.fieldData;
    if (!fd) return false;
    if (type === 'article') return fd['associated-title'] === tenantId;
    var titles = fd['titles'];
    return Array.isArray(titles) && titles.indexOf(tenantId) !== -1;
  }

  /* Keys are Scenario I's, read from the live contract. Note
     'reListings' — v0.1.0 guessed 'listings' and that lane would have
     been permanently empty with no error to explain why. */
  var ASSET_KEYS = [
    { key: 'articles',   type: 'article', label: 'Article' },
    { key: 'ads',        type: 'ad',      label: 'Ad' },
    { key: 'events',     type: 'event',   label: 'Event' },
    { key: 'reListings', type: 're',      label: 'RE Listing' }
  ];

  function assets() {
    var d = S.data;
    if (!d) return [];
    var out = [];
    for (var i = 0; i < ASSET_KEYS.length; i++) {
      var k = ASSET_KEYS[i];
      var arr = d[k.key];
      if (!Array.isArray(arr)) continue;
      for (var j = 0; j < arr.length; j++) {
        if (!assetBelongsToTenant(arr[j], k.type, S.tenantId)) continue;
        if (S.typeFilter && S.typeFilter !== k.type) continue;
        out.push({ rec: arr[j], kind: k.label, type: k.type });
      }
    }
    var q = S.q.assets;
    if (q) {
      out = out.filter(function (a) {
        var hay = (displayName(a.rec) + ' ' + customerName(a.rec) + ' ' +
                   a.kind + ' ' + dateTokens(a.rec)).toLowerCase();
        return matches(hay, q);
      });
    }
    return sortRecs(out, S.sort.assets,
                    function (a) { return displayName(a.rec); },
                    function (a) { return a.rec; });
  }

  /* ═══════════════════════════════════════════
     ISSUES — harvested from the T-A hidden collection
     DOM order is send order, same as pubplan-overview. This lane is
     the ONLY issue-scoped surface on the board (D-CB-1).
     ═══════════════════════════════════════════ */

  function harvestPlans() {
    var items = document.querySelectorAll('.pubplan-item');
    var plans = [], seen = {};
    Array.prototype.forEach.call(items, function (item) {
      var idEl = item.querySelector('.pubplan-id');
      var pid = idEl ? idEl.textContent.trim() : '';
      if (!pid || seen[pid]) return;
      seen[pid] = true;

      var nameEl = item.querySelector('.q-header');
      var dateEl = item.querySelector('.q-header-mini');

      /* D-CB-5 — the print edition link. Read from a data attribute if
         the Designer binding is in place, otherwise absent. Never
         constructed from a pattern: flipbook slugs are not reliably
         predictable and a broken derivation costs more than a paste. */
      var printUrl = (item.dataset && item.dataset.printEditionUrl) || '';
      if (!printUrl) {
        var pe = item.querySelector('[data-print-edition-url]');
        if (pe) printUrl = pe.getAttribute('data-print-edition-url') || '';
      }

      var slots = [];
      Array.prototype.forEach.call(item.querySelectorAll('.pubplan-slot-wrapper'), function (w) {
        var d = w.dataset || {};
        var sc = d.slotCode || '';
        if (!sc || sc.indexOf('-cat') !== -1) return;   // content slots only
        slots.push({
          slotCode:     sc,
          sectionCode:  d.sectionCode  || '',
          articleTitle: d.articleTitle || '',
          articleId:    d.articleId    || '',
          customerName: d.customerName || '',
          adTitle:      d.adTitle      || '',
          eventId:      d.eventId      || ''
        });
      });

      plans.push({
        id:       pid,
        name:     nameEl ? nameEl.textContent.trim() : pid,
        sub:      dateEl ? dateEl.textContent.trim() : '',
        printUrl: printUrl,
        slots:    slots
      });
    });
    return plans;
  }

  function filledCount(plan) {
    var n = 0;
    for (var i = 0; i < plan.slots.length; i++) {
      var s = plan.slots[i];
      if (s.articleId || s.adTitle || s.customerName || s.eventId) n++;
    }
    return n;
  }

  /* ═══════════════════════════════════════════
     LAYOUT — collapse + focus
     ═══════════════════════════════════════════ */

  function toggleCollapse(id) {
    if (!S.collapsed.hasOwnProperty(id)) return;
    S.collapsed[id] = !S.collapsed[id];
    /* Leaving a column shut by hand while Focus is on is legitimate;
       it just means Focus has nothing left to restore for that column. */
    if (S.focus && S.focusPrev) S.focusPrev[id] = S.collapsed[id];
    persist(); renderAll();
  }

  /* D-CB-21 — manual, and it remembers precisely what it changed so
     that leaving Focus does not reopen a column the operator had
     already chosen to shut. */
  function toggleFocus() {
    if (!S.focus) {
      S.focusPrev = {
        components: S.collapsed.components,
        assets:     S.collapsed.assets,
        issues:     S.collapsed.issues
      };
      S.collapsed.components = true;
      S.collapsed.assets     = true;
      S.collapsed.issues     = false;
      S.focus = true;
    } else {
      if (S.focusPrev) {
        S.collapsed.components = S.focusPrev.components;
        S.collapsed.assets     = S.focusPrev.assets;
        S.collapsed.issues     = S.focusPrev.issues;
      }
      S.focusPrev = null;
      S.focus = false;
    }
    persist(); renderAll();
  }

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  function railHtml(col) {
    return '<div class="ixcb-rail" data-ixcb="expand" data-col="' + col.id + '" ' +
             'title="' + esc(col.label) + ' — click to open">' +
             '<span class="ixcb-rail-lbl">' + esc(col.label) + '</span>' +
             '<span class="ixcb-rail-caret">\u203a</span>' +
           '</div>';
  }

  /* Title, count, control icons and the collapse chevron all share ONE
     row. The icons earn their place here rather than in a strip of
     their own — a second row would cost the lane the vertical space
     this bump exists to give back. */
  function colHead(col, countText) {
    var hasCtrls = (col.id === 'components' || col.id === 'assets');
    return '<div class="ixcb-colhead">' +
             '<div class="ixcb-colhead-l">' +
               '<span class="ixcb-coltitle">' + esc(col.label) + '</span>' +
               (countText ? '<span class="ixcb-count">' + esc(countText) + '</span>' : '') +
             '</div>' +
             '<div class="ixcb-colhead-r">' +
               (hasCtrls ? laneIcons(col.id) : '') +
               '<button type="button" class="ixcb-collapse" data-ixcb="collapse" data-col="' + col.id + '" ' +
                 'title="Collapse ' + esc(col.label) + '">\u2039</button>' +
             '</div>' +
             '<div class="ixcb-colhint">' + esc(col.hint) + '</div>' +
           '</div>';
  }

  function emptyHtml(msg) {
    return '<div class="ixcb-empty">' + esc(msg) + '</div>';
  }

  /* ── Lane controls ──
     Collapsed to icons on the title row; one panel open at a time.
     The search input remains UNCONTROLLED — its value is read on
     input and only its own lane body redraws, because a full render
     would replace the element being typed into and eat the caret
     mid-word. Same rule ta-image-gen follows for the prompt box. */

  var SORT_OPTS = [
    { v: 'new', l: 'Newest' },
    { v: 'old', l: 'Oldest' },
    { v: 'az',  l: 'A\u2013Z' }
  ];
  var SORT_DEFAULT = 'new';

  /* Stroke icons at 13px. Drawn rather than glyphed so weight stays
     consistent with the column chrome instead of inheriting whatever
     the system emoji font decides. */
  var ICONS = {
    q:      '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.4"/><path d="M10.3 10.3 14 14"/></svg>',
    filter: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M4.5 8h7M6.5 12h3"/></svg>',
    sort:   '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.5v11M4.5 13.5 2 11M11.5 13.5v-11M11.5 2.5 14 5"/></svg>'
  };

  /* Is this control currently changing what the lane shows? Sort only
     counts when it is off default — otherwise every lane would sit
     permanently gold and the signal would mean nothing. */
  function ctrlActive(laneId, which) {
    if (which === 'q')      return !!(S.q[laneId] || '').trim();
    if (which === 'filter') return laneId === 'assets' && !!S.typeFilter;
    if (which === 'sort')   return S.sort[laneId] !== SORT_DEFAULT;
    return false;
  }

  function iconBtn(laneId, which, label) {
    var on  = S.open[laneId] === which;
    var act = ctrlActive(laneId, which);
    return '<button type="button" class="ixcb-ic' + (on ? ' ixcb-opened' : '') +
             (act ? ' ixcb-inforce' : '') + '" data-ixcb="panel" data-lane="' + laneId +
             '" data-v="' + which + '" aria-expanded="' + on + '" ' +
             'title="' + esc(label) + '" aria-label="' + esc(label) + '">' +
             ICONS[which] + '</button>';
  }

  function laneIcons(laneId) {
    return iconBtn(laneId, 'q', 'Search') +
           (laneId === 'assets' ? iconBtn(laneId, 'filter', 'Filter by type') : '') +
           iconBtn(laneId, 'sort', 'Sort');
  }

  function chipRow(laneId, which) {
    var out = '';
    if (which === 'sort') {
      for (var i = 0; i < SORT_OPTS.length; i++) {
        var o = SORT_OPTS[i];
        out += '<button type="button" class="ixcb-chip' +
               (S.sort[laneId] === o.v ? ' ixcb-on' : '') + '" ' +
               'data-ixcb="sort" data-lane="' + laneId + '" data-v="' + o.v + '">' +
               esc(o.l) + '</button>';
      }
    } else {
      out += '<button type="button" class="ixcb-chip' + (!S.typeFilter ? ' ixcb-on' : '') +
             '" data-ixcb="type" data-v="">All</button>';
      for (var j = 0; j < ASSET_KEYS.length; j++) {
        var k = ASSET_KEYS[j];
        out += '<button type="button" class="ixcb-chip' +
               (S.typeFilter === k.type ? ' ixcb-on' : '') +
               '" data-ixcb="type" data-v="' + k.type + '">' + esc(k.label) + '</button>';
      }
    }
    return '<div class="ixcb-chips">' + out + '</div>';
  }

  function controlsHtml(laneId) {
    var which = S.open[laneId];
    if (!which) return '';

    var body;
    if (which === 'q') {
      var q = S.q[laneId] || '';
      var ph = (laneId === 'assets')
        ? 'Name, customer, or month'
        : 'Filename or month';
      body = '<div class="ixcb-search">' +
               '<input type="text" class="ixcb-q' + (q ? ' ixcb-has' : '') + '" ' +
                 'data-lane="' + laneId + '" placeholder="' + esc(ph) + '" ' +
                 'value="' + esc(q) + '" aria-label="Search ' + laneId + '">' +
               (q ? '<button type="button" class="ixcb-qx" data-ixcb="clearq" data-lane="' +
                    laneId + '" title="Clear search">\u00d7</button>' : '') +
             '</div>';
    } else {
      body = chipRow(laneId, which);
    }
    return '<div class="ixcb-ctrls">' + body + '</div>';
  }

  function componentsBody() {
    if (S.loading) return '<div class="ixcb-loading"><span class="ixcb-spin"></span>Loading components…</div>';
    var list = components();
    if (!list.length) {
      return emptyHtml(S.q.components
        ? 'Nothing matches “' + S.q.components + '”. Clear the search to see everything.'
        : 'No components yet. Conditioned files land here.');
    }
    var out = '<div class="ixcb-tiles">';
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      var f = m.fieldData || m;
      var name = f.name || f.filename || f.slug || 'Untitled';
      var url  = f['image-url'] || f['media-url'] || f.url || '';
      out +=
        '<div class="ixcb-tile" data-ixcb="open-component" data-id="' + esc(m.id || f.id || '') + '">' +
          (url ? '<div class="ixcb-thumb"><img src="' + esc(url) + '" alt="" loading="lazy"></div>'
               : '<div class="ixcb-thumb ixcb-nothumb"></div>') +
          '<div class="ixcb-tile-b"><span class="ixcb-tile-n">' + esc(name) + '</span></div>' +
        '</div>';
    }
    return out + '</div>';
  }

  function assetsBody() {
    if (S.loading) return '<div class="ixcb-loading"><span class="ixcb-spin"></span>Loading assets…</div>';
    var list = assets();
    if (!list.length) {
      return emptyHtml((S.q.assets || S.typeFilter)
        ? 'Nothing matches the current search or filter.'
        : 'No assets yet. Components become assets here.');
    }
    var out = '<div class="ixcb-rows">';
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      var f = a.rec.fieldData || a.rec;
      var name = f.name || f['article-title'] || f.title || 'Untitled';
      out +=
        '<div class="ixcb-row" data-ixcb="open-asset" data-id="' + esc(a.rec.id || '') +
          '" data-type="' + esc(a.type) + '" tabindex="0" role="button">' +
          '<span class="ixcb-kind ixcb-kind--' + a.kind.toLowerCase() + '">' + esc(a.kind) + '</span>' +
          '<span class="ixcb-row-n">' + esc(name) + '</span>' +
        '</div>';
    }
    return out + '</div>';
  }

  function issuesBody() {
    var plans = S.plans;
    if (!plans.length) {
      var hasItem = !!document.querySelector('.pubplan-item');
      var hasSlot = !!document.querySelector('.pubplan-item .pubplan-slot-wrapper');
      var why = !hasItem
        ? 'No .pubplan-item elements on this page — the hidden PUBLICATION PLAN collection is missing or renamed.'
        : (!hasSlot
            ? '.pubplan-item found, but no .pubplan-slot-wrapper inside it — the slot binding has drifted.'
            : 'Plan items found but none carried a .pubplan-id.');
      return '<div class="ixcb-empty ixcb-diag"><b>Issues lane found nothing.</b>' + esc(why) + '</div>';
    }

    var out = '<div class="ixcb-plans">';
    for (var i = 0; i < plans.length; i++) {
      var p = plans[i];
      var filled = filledCount(p), total = p.slots.length;
      var pct = total ? Math.round(filled / total * 100) : 0;
      /* Spine colour carries fill state, not decoration: salmon while
         a plan is essentially empty and wants work, gold once it is
         under way, teal when it is effectively done. The operator can
         read the column's workload down the left edge without
         parsing a single number. */
      var tone = (pct >= 90) ? 'done' : (pct >= 15 ? 'wip' : 'open');

      out +=
        '<article class="ixcb-plan ixcb-tone-' + tone + '" data-id="' + esc(p.id) + '">' +
          '<header class="ixcb-plan-hd">' +
            '<div class="ixcb-plan-id">' +
              '<span class="ixcb-plan-n">' + esc(p.name) + '</span>' +
              (i === 0 ? '<span class="ixcb-next">NEXT</span>' : '') +
            '</div>' +
            (p.sub ? '<div class="ixcb-plan-s">' + esc(p.sub) + '</div>' : '') +
          '</header>' +
          '<div class="ixcb-plan-b">' +
            '<div class="ixcb-fillbar"><i style="width:' + pct + '%"></i></div>' +
            '<div class="ixcb-plan-m">' +
              '<span class="ixcb-fill"><b>' + filled + '</b>\u2009/\u2009' + total + ' slots</span>' +
              (p.printUrl
                ? '<a class="ixcb-print" href="' + esc(p.printUrl) + '" target="_blank" rel="noopener">Print edition \u2197</a>'
                : '') +
            '</div>' +
          '</div>' +
        '</article>';
    }
    return out + '</div>';
  }

  function colBody(col) {
    if (col.id === 'components') return controlsHtml('components') + '<div class="ixcb-lane">' + componentsBody() + '</div>';
    if (col.id === 'assets')     return controlsHtml('assets')     + '<div class="ixcb-lane">' + assetsBody() + '</div>';
    return issuesBody();
  }

  function colCount(col) {
    if (col.id === 'components') return S.data ? String(components().length) : '';
    if (col.id === 'assets')     return S.data ? String(assets().length) : '';
    return String(S.plans.length);
  }

  function tenantLabel() {
    var c = cfg() || {};
    var name = c.titleName || c.title || '';
    var slug = c.titleSlug || '';
    if (!name && slug) name = slug.replace(/-/g, ' ');
    return name ? name.toUpperCase() : '';
  }

  function appBar() {
    return '<div class="ixcb-appbar">' +
             '<span class="ixcb-brand">Cadence Board</span>' +
             '<span class="ixcb-tenant">' + esc(tenantLabel()) + '</span>' +
             '<span class="ixcb-scopes">' +
               '<span class="ixcb-scope">Create</span>' +
               '<span class="ixcb-scope-arrow">\u2192</span>' +
               '<span class="ixcb-scope">Plan</span>' +
             '</span>' +
             '<div class="ixcb-appbar-sp"></div>' +
             (S.error ? '<span class="ixcb-err">' + esc(S.error) + '</span>' : '') +
             (S.shared
               ? '<button type="button" class="ixcb-swap" data-ixcb="to-legacy" ' +
                   'title="Return to the Studio panels">\u2039 Studio</button>'
               : '') +
             '<button type="button" class="ixcb-ghost" data-ixcb="refresh"' +
               (S.loading ? ' disabled' : '') + '>' +
               (S.loading ? '<span class="ixcb-spin"></span>Loading' : '\u21bb Refresh') +
             '</button>' +
             '<button type="button" class="ixcb-focus' + (S.focus ? ' ixcb-on' : '') + '" ' +
               'data-ixcb="focus" title="Collapse Create and give the width to Issues">' +
               (S.focus ? 'Leave focus' : 'Focus') +
             '</button>' +
             '<span class="ixcb-ver">v' + VERSION + '</span>' +
           '</div>';
  }

  function renderAll() {
    if (!S.root) return;
    var cols = '';
    for (var i = 0; i < COLS.length; i++) {
      var col = COLS[i];
      var isC = S.collapsed[col.id];
      cols +=
        '<section class="ixcb-col ixcb-col--' + col.id + (isC ? ' ixcb-shut' : '') +
          (col.scope === 'issue' ? ' ixcb-scoped' : '') + '" data-col="' + col.id + '">' +
          (isC ? railHtml(col)
               : colHead(col, colCount(col)) + '<div class="ixcb-colbody">' + colBody(col) + '</div>') +
        '</section>';
    }
    S.root.innerHTML =
      appBar() +
      '<div class="ixcb-cols' + (S.focus ? ' ixcb-focused' : '') + '">' + cols + '</div>';
  }

  /* ═══════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════ */

  /* ASF speaks 'realestate'; the board labels the lane 'RE'. Map at
     the boundary rather than renaming the lane — publicOpen() coerces
     an unknown assetType to 'article' WITHOUT failing, so a bad value
     here would silently open the wrong editor on the right record. */
  var ASF_TYPE = { article: 'article', ad: 'ad', event: 'event', re: 'realestate' };

  function note(msg) {
    S.error = msg;
    renderAll();
    clearTimeout(note._t);
    note._t = setTimeout(function () {
      if (S.error === msg) { S.error = null; renderAll(); }
    }, 4200);
  }

  function openAsset(id, type) {
    if (!window.InbxASF || typeof window.InbxASF.open !== 'function') {
      note('The asset editor is not loaded on this page.');
      return;
    }
    /* ASF refuses an empty id loudly (v1.5.11, the blank-form bug).
       Check first so the operator learns WHICH record is malformed
       rather than reading a generic editor toast. */
    if (!id || !String(id).trim()) {
      note('That record has no id — it cannot be opened. Refresh, and tell Jeff if it persists.');
      return;
    }
    var asfType = ASF_TYPE[type] || 'article';
    var params  = { mode: 'edit', assetType: asfType, tenantId: S.tenantId };
    /* Articles are keyed differently from every other type. */
    if (asfType === 'article') params.articleId = id;
    else                      params.assetId   = id;

    var ok = false;
    try { ok = window.InbxASF.open(params); } catch (err) {
      console.error(TAG, 'ASF open threw:', err);
      note('Could not open the editor.');
      return;
    }
    if (ok === false) { note('The editor declined to open that record.'); return; }

    console.log(TAG, 'opened in ASF:', asfType, id);
    watchAsfClose();
  }

  /* Refetch when the overlay closes, so an asset edited in ASF is
     current in the lane the operator returns to. Pattern from
     ta-intake-manager v2.1.0; capped so a stuck overlay cannot leave
     a timer running forever. */
  function watchAsfClose() {
    if (typeof window.InbxASF.isOpen !== 'function') return;
    clearInterval(watchAsfClose._iv);
    var waited = 0;
    watchAsfClose._iv = setInterval(function () {
      waited += 600;
      if (!window.InbxASF.isOpen()) {
        clearInterval(watchAsfClose._iv);
        if (S.view === 'board') fetchData('asf-closed');
        return;
      }
      if (waited > 300000) clearInterval(watchAsfClose._iv);   // 5 min
    }, 600);
  }

  function onClick(e) {
    var t = e.target.closest && e.target.closest('[data-ixcb]');
    if (!t) return;
    var act = t.getAttribute('data-ixcb');
    if (act === 'to-board' || act === 'to-legacy') return;   // onSwitchClick owns these
    if (!S.root || !S.root.contains(t)) return;
    if (act === 'collapse' || act === 'expand') {
      toggleCollapse(t.getAttribute('data-col'));
      return;
    }
    if (act === 'focus')   { toggleFocus(); return; }
    if (act === 'refresh') { S.plans = harvestPlans(); fetchData('manual'); return; }

    if (act === 'open-asset') {
      openAsset(t.getAttribute('data-id'), t.getAttribute('data-type'));
      return;
    }
    if (act === 'open-component') {
      /* A MEDIA row is not an asset and has no ASF edit surface.
         Saying so beats doing nothing, which reads as a broken click. */
      note('Components open when the component lane gets its behaviour. Use Assets to edit a record.');
      return;
    }
    if (act === 'panel') {
      var pl = t.getAttribute('data-lane'), pv = t.getAttribute('data-v');
      /* Toggle: the same icon closes what it opened. One panel per
         lane, so opening another replaces rather than stacks. */
      S.open[pl] = (S.open[pl] === pv) ? '' : pv;
      persist();
      renderAll();
      if (S.open[pl] === 'q' && S.root) {
        var box = S.root.querySelector('.ixcb-col--' + pl + ' .ixcb-q');
        if (box) { try { box.focus(); box.setSelectionRange(box.value.length, box.value.length); } catch (e) {} }
      }
      return;
    }
    if (act === 'sort') {
      var lane = t.getAttribute('data-lane');
      S.sort[lane] = t.getAttribute('data-v');
      persist(); renderAll(); return;
    }
    if (act === 'type') {
      S.typeFilter = t.getAttribute('data-v') || '';
      persist(); renderAll(); return;
    }
    if (act === 'clearq') {
      var l = t.getAttribute('data-lane');
      S.q[l] = '';
      persist(); renderAll(); return;
    }
  }

  /* Search input. Debounced so a fast typist does not re-filter on
     every character, and scoped to one lane so focus survives. */
  var _qTimer = null;
  function onSearchInput(e) {
    var el = e.target;
    if (!el.classList || !el.classList.contains('ixcb-q')) return;
    if (!S.root || !S.root.contains(el)) return;
    var lane = el.getAttribute('data-lane');
    S.q[lane] = el.value;
    clearTimeout(_qTimer);
    _qTimer = setTimeout(function () { renderLane(lane); persist(); }, 130);
  }

  /* Switch clicks are handled separately: the legacy pill lives
     OUTSIDE .ixcb-root, so the containment guard in onClick would
     reject it. */
  function onSwitchClick(e) {
    var t = e.target.closest && e.target.closest('[data-ixcb="to-board"],[data-ixcb="to-legacy"]');
    if (!t) return;
    setView(t.getAttribute('data-ixcb') === 'to-board' ? 'board' : 'legacy');
  }

  /* ═══════════════════════════════════════════
     MOUNT — see the header note on mount-agnosticism
     ═══════════════════════════════════════════ */

  /* Resolve the tab PANE, never the tab link.

     This page emits 12 elements carrying [data-w-tab] — one <a> link
     and one <div> pane per tab — and every link precedes every pane in
     document order. A bare attribute selector therefore always returns
     a link. Both extra hooks are used: .w-tab-pane marks it as a pane,
     and the pane also carries a per-tab class such as .tab-pane-studio. */
  function pane(tabName, paneClass) {
    var el = document.querySelector('div.w-tab-pane[data-w-tab="' + tabName + '"]');
    if (el) return el;
    if (paneClass) {
      el = document.querySelector('div.' + paneClass);
      if (el) return el;
    }
    return null;
  }

  function findHost() {
    var el = document.querySelector('[data-ix-board]');
    if (el) return { el: el, shared: false };

    el = pane('Cadence', 'tab-pane-cadence');
    if (el) return { el: el, shared: false };

    /* D-CB-24 — the board replaces Studio. Until the Designer swap
       happens the two share the pane, and sharing means HIDING the
       legacy children, never removing them. */
    el = pane('Studio', 'tab-pane-studio');
    if (el) return { el: el, shared: true };

    return null;
  }

  /* A host that is not a pane is a bug, not a fallback. v0.1.1 mounted
     into an <a> and reported success; silence like that costs more to
     diagnose than a refusal does. */
  function hostIsSane(el) {
    if (!el) return false;
    if (el.hasAttribute('data-ix-board')) return true;
    if (el.tagName !== 'DIV') return false;
    return el.classList.contains('w-tab-pane');
  }

  /* One record for the whole arrangement. v0.1.2 persisted `view`
     alone, which meant the board remembered WHICH surface you were on
     but not how you had set it up — an arbitrary half-measure. */
  function persist() {
    try {
      window.localStorage.setItem(VIEW_KEY, JSON.stringify({
        view:       S.view,
        focus:      S.focus,
        focusPrev:  S.focusPrev,
        collapsed:  S.collapsed,
        sort:       S.sort,
        typeFilter: S.typeFilter,
        open:       S.open,
        q:          S.q
      }));
    } catch (e) {}
  }

  function restore() {
    var raw = null;
    try { raw = window.localStorage.getItem(VIEW_KEY); } catch (e) { return 'legacy'; }
    if (!raw) return 'legacy';
    /* v0.1.2 stored the bare string "board"/"legacy". Read it rather
       than discarding the operator's choice on upgrade. */
    if (raw === 'board' || raw === 'legacy') return raw;
    var o;
    try { o = JSON.parse(raw); } catch (e) { return 'legacy'; }
    if (!o || typeof o !== 'object') return 'legacy';
    if (o.collapsed)  S.collapsed  = o.collapsed;
    if (o.sort)       S.sort       = o.sort;
    if (o.q)          S.q          = o.q;
    if (o.open)       S.open       = o.open;
    if (o.focusPrev)  S.focusPrev  = o.focusPrev;
    S.focus      = !!o.focus;
    S.typeFilter = o.typeFilter || '';
    return (o.view === 'board') ? 'board' : 'legacy';
  }

  /* The way back must be visible from the legacy side too, or the
     switch is a one-way door and the operator's only recovery is to
     know about localStorage. Injected once, above the legacy tools. */
  function ensureLegacyPill() {
    if (!S.shared || !S.host) return;
    if (S.host.querySelector('[data-ixcb="to-board"]')) return;
    var pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'ixcb-legacy-pill';
    pill.setAttribute('data-ixcb', 'to-board');
    pill.innerHTML = 'Try the Cadence Board \u203a';
    S.host.insertBefore(pill, S.host.firstChild);
  }

  function applyView() {
    if (!S.host) return;
    var boardOn = (S.view === 'board');

    if (S.shared) {
      /* Hide, never remove. issues-tab v1.0.17 established this on the
         PubPlan tab: both trees stay in the document and visibility is
         the only thing that changes, so the flip back cannot fail
         halfway and leave the operator with neither surface. */
      for (var i = 0; i < S.legacyKept.length; i++) {
        var n = S.legacyKept[i];
        if (n && n.style) n.style.display = boardOn ? 'none' : '';
      }
      var pill = S.host.querySelector('[data-ixcb="to-board"]');
      if (pill) pill.style.display = boardOn ? 'none' : '';
    }
    if (S.root) S.root.style.display = boardOn ? '' : 'none';

    /* Only pay for the feed when the board is actually being looked
       at. A hidden surface has no business calling Scenario I. */
    if (boardOn && !S.data && !S.loading) {
      S.plans = harvestPlans();
      fetchData('view-on');
    } else if (boardOn) {
      renderAll();
    }
  }

  function setView(v) {
    S.view = (v === 'board') ? 'board' : 'legacy';
    persist();
    applyView();
  }

  function mount() {
    if (S.mounted) return true;
    var found = findHost();
    if (!found) return false;

    if (!hostIsSane(found.el)) {
      console.warn(TAG, 'refusing to mount — resolved host is not a tab pane:',
                   found.el.tagName, found.el.className);
      return false;
    }

    S.host   = found.el;
    S.shared = found.shared;

    if (S.shared) {
      /* Snapshot the legacy children ONCE, before anything of ours is
         appended, so the restore set can never include our own root. */
      S.legacyKept = Array.prototype.slice.call(S.host.children);
      ensureLegacyPill();
    }

    var root = document.createElement('div');
    root.className = 'ixcb-root';
    root.setAttribute('data-ixcb-root', VERSION);
    root.style.display = 'none';
    S.host.appendChild(root);
    S.root = root;
    S.mounted = true;

    document.addEventListener('click', onClick);
    document.addEventListener('click', onSwitchClick);
    document.addEventListener('input', onSearchInput);
    /* Rows are role=button, so Enter and Space must work. */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var r = e.target.closest && e.target.closest('[data-ixcb="open-asset"]');
      if (!r || !S.root || !S.root.contains(r)) return;
      e.preventDefault();
      openAsset(r.getAttribute('data-id'), r.getAttribute('data-type'));
    });
    window.addEventListener('inbx:asset-saved', function () {
      if (S.view === 'board') fetchData('asset-saved');
    });

    /* On a dedicated host there is no legacy surface to defer to, so
       the board is simply on. */
    S.view = S.shared ? restore() : (restore(), 'board');
    S.plans = harvestPlans();
    renderAll();
    applyView();

    /* Unconditional — a mount is the one event worth a console line
       whether or not debug is on. */
    console.log(TAG, 'mounted into', S.host.tagName + '.' + (S.host.className || '').split(' ')[0],
                S.shared ? '· shared with Studio' : '· dedicated host',
                '· view=' + S.view, '· legacy children hidden:', S.legacyKept.length);
    return true;
  }

  /* The hidden collections and the tab panes are Webflow-rendered, so
     they may not exist at first script execution. Poll briefly rather
     than racing — and give up rather than spinning forever. */
  function boot() {
    if (mount()) return;
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (mount()) { clearInterval(iv); return; }
      if (tries > 40) {
        clearInterval(iv);
        console.warn(TAG, 'gave up after 6s — no [data-ix-board], no Cadence pane, no Studio pane found.');
      }
    }, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.InbxCadenceBoard = {
    version:  VERSION,
    setView:  setView,
    refresh:  function () { S.plans = harvestPlans(); fetchData('api'); },
    focus:    toggleFocus,
    collapse: toggleCollapse,
    _state:   S
  };
  console.log(TAG, 'loaded');
})();
