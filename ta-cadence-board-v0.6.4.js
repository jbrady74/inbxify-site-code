/* ════════════════════════════════════════════════════════════════
   ta-cadence-board-v0.6.4.js
   INBXIFY T-A — Cadence Board · SKELETON
   Companion: ta-cadence-board-v0.6.4.css (matched pair — load both)

   ── v0.6.4 — CONTROLS COLLAPSE TO ICONS ──
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

  var VERSION = '0.6.4';
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
    typeFilter: 'article', // v0.6.4 — Articles are most of the work
    open:      { components: '', assets: '' },   // '' | 'q' | 'filter' | 'sort'
    status:    'available',        // D-CVS-6: available | inuse | all
    picked:    {},                 // component id -> true
    shutGroups:{},                 // arrival key -> true
    openBundles:{},                // bundle id -> true (peek, not select)
    showLocked: false,             // In Progress only, until asked
    lockUnknown: false,            // true when no plan published a status

    mode:      'both',   // 'produce' | 'both' | 'assemble'
    armed:     null,     // { id, type, name } awaiting a target plan
    placing:   false,
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

  /* ═══════════════════════════════════════════
     COMPONENTS — D-CVS-6 readers
     Hashes and field names taken from ta-canvas v0.1.1 and the data
     reference, not re-derived. Config wins; the constants are the
     documented platform fallbacks (§10).
     ═══════════════════════════════════════════ */

  var MEDIA_TYPE_HASH = {
    image: 'be8534c8e7579ff07ffbd6032f3a4bf7',
    video: '37581cd40911a2cc7b5f2913e3aeba71',
    audio: '97bef53fbe76af04c395e1d9e0419de1',
    text:  '5332c884efac157407557cf3efd387b7'
  };
  var MEDIA_STATUS_HASH = {
    available: 'ba841056d10f582cf1fc3b852381ef70',
    attached:  '33d44ad5cec9780f6aacd259c4a44fbc',
    archived:  '57a4f54ecb4035d3c5b706222e82dee5'
  };

  function optId(group, key, fallback) {
    var c = cfg() || {};
    var m = (c.optionIds && c.optionIds[group]) || {};
    return m[key] || fallback;
  }

  function mediaTypeOf(fd) {
    var raw = (fd && fd['media-type']) || '';
    if (raw === optId('mediaType', 'text',  MEDIA_TYPE_HASH.text))  return 'text';
    if (raw === optId('mediaType', 'image', MEDIA_TYPE_HASH.image)) return 'image';
    if (raw === optId('mediaType', 'video', MEDIA_TYPE_HASH.video)) return 'video';
    if (raw === optId('mediaType', 'audio', MEDIA_TYPE_HASH.audio)) return 'audio';
    return 'other';
  }
  var TYPE_LABEL = { text: 'TXT', image: 'IMG', video: 'VID', audio: 'AUD', other: 'FILE' };
  /* Sort weight. Bundles are hoisted separately; this orders loose rows. */
  var TYPE_ORDER = { text: 1, image: 2, video: 3, audio: 4, other: 5 };

  function isAttached(fd) {
    return (fd && fd.status) === optId('mediaStatus', 'attached', MEDIA_STATUS_HASH.attached);
  }
  function isArchived(fd) {
    return (fd && fd.status) === optId('mediaStatus', 'archived', MEDIA_STATUS_HASH.archived);
  }

  /* Provenance is a badge, not a category. A component whose filename
     carries the generator's signature, or that arrived from a tool
     rather than a Drive drop, is marked AI — the operator should never
     have to remember which images a machine made. */
  function provenanceOf(m) {
    var fd = m.fieldData || {};
    var src = String(fd['source'] || fd['origin'] || '').toLowerCase();
    if (src.indexOf('ai') !== -1 || src.indexOf('flux') !== -1 ||
        src.indexOf('generat') !== -1 || src.indexOf('transcri') !== -1) return 'AI';
    var n = String(fd.name || fd.slug || '').toLowerCase();
    if (n.indexOf('flux-') === 0 || n.indexOf('generated-') === 0 ||
        n.indexOf('transcribed-') === 0) return 'AI';
    return 'DRIVE';
  }

  /* Human size. A row that says "2.4 MB" tells the operator something
     the grid never could — whether an image is print-usable. */
  function sizeOf(fd) {
    var b = parseInt(fd['file-size'] || fd['size'] || 0, 10);
    if (!b) return '';
    if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
    if (b >= 1024)    return Math.round(b / 1024) + ' KB';
    return b + ' B';
  }

  function dimsOf(fd) {
    var w = parseInt(fd['width']  || fd['pixel-width']  || 0, 10);
    var h = parseInt(fd['height'] || fd['pixel-height'] || 0, 10);
    if (!w || !h) return null;
    return { w: w, h: h, low: (w < 1400) };   /* 1400 = the platform working width */
  }

  /* The meta line. Everything the tile grid could not say. */
  /* v0.6.4 — the meta line is gone. Size, dimensions and word counts
     answered questions nobody asks while scanning a lane, and in a
     30%-wide column they cost a second line on every row.
     TWO EXCEPTIONS survive, both because they are defects rather
     than statistics: a low-res image is unusable, and an attached
     component is not free to take. */
  function metaOf(m) {
    var fd = m.fieldData || {}, out = [];
    if (mediaTypeOf(fd) === 'image') {
      var d = dimsOf(fd);
      if (d && d.low) out.push('<span class="ixcb-lo">low-res \u00b7 ' + d.w + '\u00d7' + d.h + '</span>');
    }
    if (isAttached(fd)) out.push('in use');
    return out.join(' \u00b7 ');
  }

  /* Arrival key — the day it landed, in the title's zone. Webflow
     stores UTC; a 00:30 UTC arrival belongs to the previous day for
     an Eastern operator, and grouping it wrong puts a component in
     a day the operator never worked. */
  function arrivalKey(m) {
    var iso = itemDate(m);
    if (!iso) return { k: 'unknown', label: 'No date', sort: 0 };
    var d = new Date(iso);
    if (isNaN(d.getTime())) return { k: 'unknown', label: 'No date', sort: 0 };
    var tz = titleTz(), key, label;
    try {
      key = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
      label = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }).format(d);
    } catch (e) { key = iso.slice(0, 10); label = key; }
    return { k: key, label: label, sort: d.getTime() };
  }

  /* Returns arrival groups, newest first. Each group holds gold
     bundle rows followed by loose rows in D-CVS-6 order. */
  function components() {
    var d = S.data;
    if (!d) return [];
    var a = Array.isArray(d.media)      ? d.media      : [];
    var b = Array.isArray(d.mediaExtra) ? d.mediaExtra : [];
    var list = filterMediaByTenant(a.concat(b), S.tenantId);

    /* Archived never appears — D-CVS-5's spirit: the lane shows work,
       not history. */
    list = list.filter(function (m) { return !isArchived(m.fieldData || {}); });

    if (S.status === 'available') list = list.filter(function (m) { return !isAttached(m.fieldData || {}); });
    else if (S.status === 'inuse') list = list.filter(function (m) { return  isAttached(m.fieldData || {}); });

    var q = S.q.components;
    if (q) list = list.filter(function (m) {
      var fd = m.fieldData || m;
      return matches((displayName(m) + ' ' + (fd.slug || '') + ' ' + dateTokens(m)).toLowerCase(), q);
    });

    var groups = {}, order = [];
    list.forEach(function (m) {
      var a2 = arrivalKey(m);
      if (!groups[a2.k]) { groups[a2.k] = { key: a2.k, label: a2.label, sort: a2.sort, bundles: {}, bOrder: [], loose: [] }; order.push(a2.k); }
      var g = groups[a2.k];
      if (a2.sort > g.sort) g.sort = a2.sort;
      var fd = m.fieldData || {};
      var bid = fd['bundle-id'];
      if (bid) {
        if (!g.bundles[bid]) { g.bundles[bid] = { id: bid, label: fd['bundle-label'] || bid, items: [] }; g.bOrder.push(bid); }
        g.bundles[bid].items.push(m);
      } else {
        g.loose.push(m);
      }
    });

    /* D-CVS-6 sort inside a group: TXT → IMG → VID → AUD, newest
       first within a type, Attached sinking to the bottom. */
    function sortRows(arr) {
      return arr.sort(function (x, y) {
        var fx = x.fieldData || {}, fy = y.fieldData || {};
        var ax = isAttached(fx) ? 1 : 0, ay = isAttached(fy) ? 1 : 0;
        if (ax !== ay) return ax - ay;
        var tx = TYPE_ORDER[mediaTypeOf(fx)] || 9, ty = TYPE_ORDER[mediaTypeOf(fy)] || 9;
        if (tx !== ty) return tx - ty;
        return dateMs(y) - dateMs(x);
      });
    }

    return order.map(function (k) {
      var g = groups[k];
      g.bundleList = g.bOrder.map(function (id) {
        g.bundles[id].items = sortRows(g.bundles[id].items);
        return g.bundles[id];
      });
      g.loose = sortRows(g.loose);
      g.count = g.loose.length + g.bundleList.reduce(function (n, x) { return n + x.items.length; }, 0);
      return g;
    }).sort(function (x, y) { return y.sort - x.sort; });
  }

  function componentCount() {
    return components().reduce(function (n, g) { return n + g.count; }, 0);
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

  /* Planning Status is an OPTION field. Depending on how Webflow
     renders the binding, the attribute carries either the option
     label or its 32-character id. Handle both, and never assume. */
  var LOCK_LABELS = /^(locked|archived|archive|closed|sent)$/i;

  function planningOptId(key) {
    var c = cfg() || {};
    var m = (c.optionIds && c.optionIds.planningStatus) || {};
    return m[key] || null;
  }

  function isLockedStatus(raw) {
    var v = String(raw || '').trim();
    if (!v) return false;
    if (LOCK_LABELS.test(v)) return true;                       /* label */
    var lockedId = planningOptId('locked');
    if (lockedId && v === lockedId) return true;                /* configured id */
    var progressId = planningOptId('inProgress') || planningOptId('in_progress');
    if (progressId && /^[a-f0-9]{16,}$/i.test(v)) return v !== progressId;  /* the other id */
    /* Learned: exactly two ids in play and we know which one is NOT
       locked from the label seen elsewhere in the same harvest. */
    if (/^[a-f0-9]{16,}$/i.test(v) && harvestPlans._openId) return v !== harvestPlans._openId;
    return false;
  }

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
      /* Lock state. v0.6.0 read one selector and, when it found
         nothing, silently treated every plan as unlocked — so the
         rule "you cannot place into a locked issue" quietly stopped
         existing. Four sources, in order of authority. */
      var status = '';
      var sw = item.querySelector('[data-planning-status]');
      if (sw) status = (sw.getAttribute('data-planning-status') || '').trim();
      if (!status && item.getAttribute('data-planning-status'))
        status = (item.getAttribute('data-planning-status') || '').trim();
      if (!status) {
        var se = item.querySelector('.pubplan-status, .planning-status, [data-status]');
        if (se) status = (se.getAttribute('data-status') || se.textContent || '').trim();
      }
      /* No text-content sniff: a plan named "…Unlocked" or notes
         mentioning the word would have poisoned it. */

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
        status:   status,
        locked:   isLockedStatus(status),
        name:     nameEl ? nameEl.textContent.trim() : pid,
        sub:      dateEl ? dateEl.textContent.trim() : '',
        printUrl: printUrl,
        slots:    slots
      });
    });
    /* If not one plan yielded a status, the DOM contract has drifted
       and the lock rule is inert. That must be audible, not silent —
       the previous version shipped exactly this failure and every
       locked issue rendered a Place button. */
    /* One line, once, naming exactly what the DOM handed us. Two
       releases were spent guessing at this. */
    if (!harvestPlans._logged) {
      harvestPlans._logged = true;
      var seenVals = {};
      plans.forEach(function (p) { if (p.status) seenVals[p.status] = (seenVals[p.status] || 0) + 1; });
      console.log(TAG, 'planning-status values seen:', seenVals);
    }
    var anyStatus = plans.some(function (p) { return !!p.status; });
    if (plans.length && !anyStatus) {
      if (!harvestPlans._warned) {
        harvestPlans._warned = true;
        console.warn(TAG, 'No planning-status found on any .pubplan-item — lock protection is INERT. ' +
                          'Bind data-planning-status on the PubPlan collection item or its slot wrapper.');
      }
      S.lockUnknown = true;
    } else {
      S.lockUnknown = false;
    }
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

/* D-CB-21 — manual. Each mode is a declarative column arrangement,
     not a diff applied to whatever came before, so switching between
     them is predictable however the operator got here. */
  var MODES = [
    { v: 'produce',  l: 'Produce',  t: 'Create assets. Issues collapses.',
      cols: { components: false, assets: false, issues: true  } },
    { v: 'both',     l: 'Both',     t: 'All three columns',
      cols: { components: false, assets: false, issues: false } },
    { v: 'assemble', l: 'Assemble', t: 'Assemble the issue. Create side collapses.',
      cols: { components: true,  assets: true,  issues: false } }
  ];

  function modeDef(v) {
    for (var i = 0; i < MODES.length; i++) if (MODES[i].v === v) return MODES[i];
    return MODES[1];
  }

  function setMode(v) {
    var m = modeDef(v);
    S.mode = m.v;
    S.collapsed = { components: m.cols.components, assets: m.cols.assets, issues: m.cols.issues };
    persist(); renderAll();
  }

  /* A hand-collapsed column no longer matches any named mode. Say so
     rather than leaving a segment lit that does not describe the
     screen — a control that lies about state is worse than none. */
  function syncMode() {
    for (var i = 0; i < MODES.length; i++) {
      var c = MODES[i].cols;
      if (c.components === S.collapsed.components &&
          c.assets     === S.collapsed.assets &&
          c.issues     === S.collapsed.issues) { S.mode = MODES[i].v; return; }
    }
    S.mode = '';
  }

  function toggleCollapse(id) {
    if (!S.collapsed.hasOwnProperty(id)) return;
    S.collapsed[id] = !S.collapsed[id];
    syncMode();
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
  /* One dropdown pattern, two lanes. It names its current value in a
     fifth of the width a chip row needs, and it does not spend that
     width advertising the states the operator is not in. */
  var LANE_DROPS = {
    components: { get: function () { return S.status; },
      opts: [ { v:'available', l:'Available' }, { v:'inuse', l:'In use' }, { v:'all', l:'All' } ] },
    assets: { get: function () { return S.typeFilter || 'all'; },
      opts: [ { v:'article', l:'Articles' }, { v:'ad', l:'Ads' }, { v:'event', l:'Events' },
              { v:'re', l:'RE Listings' }, { v:'all', l:'All types' } ] }
  };

  function dropLabel(laneId) {
    var d = LANE_DROPS[laneId], cur = d.get();
    for (var i = 0; i < d.opts.length; i++) if (d.opts[i].v === cur) return d.opts[i].l;
    return d.opts[0].l;
  }

  function dropBtn(laneId) {
    return '<button type="button" class="ixcb-drop" data-ixcb="drop" data-lane="' + laneId + '">' +
             esc(dropLabel(laneId)) + '<span class="ixcb-drop-c">\u25be</span></button>';
  }

  function openDrop(anchor, laneId) {
    var old = document.querySelector('.ixcb-menu');
    if (old) { old.remove(); return; }
    var d = LANE_DROPS[laneId], cur = d.get();
    var m = document.createElement('div');
    m.className = 'ixcb-menu';
    m.innerHTML = d.opts.map(function (o) {
      return '<button type="button" class="' + (o.v === cur ? 'ixcb-menu-on' : '') + '" ' +
        'data-ixcb="dropset" data-lane="' + laneId + '" data-v="' + o.v + '">' + esc(o.l) + '</button>';
    }).join('');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect();
    m.style.top  = (r.bottom + 6 + window.scrollY) + 'px';
    m.style.left = (r.left + window.scrollX) + 'px';
  }


  function colHead(col, countText) {
    var hasCtrls = (col.id === 'components' || col.id === 'assets');
    return '<div class="ixcb-colhead">' +
             '<div class="ixcb-colhead-l">' +
               '<span class="ix-section-title">' + esc(col.label) + '</span>' +
               (countText ? '<span class="ix-count">' + esc(countText) + '</span>' : '') +
             '</div>' +
             '<div class="ixcb-colhead-r">' +
               (LANE_DROPS[col.id] ? dropBtn(col.id) : '') +
               /* D-CVS-7 — the creators menu lives in the lane title row. */
               (col.id === 'components'
                 ? '<button type="button" class="ixcb-new" data-ixcb="new">+ New</button>' : '') +
               (hasCtrls ? laneIcons(col.id) : '') +
               '<button type="button" class="ixcb-collapse" data-ixcb="collapse" data-col="' + col.id + '" ' +
                 'title="Collapse ' + esc(col.label) + '">\u2039</button>' +
             '</div>' +
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
    return '<button type="button" class="ix-btn ix-btn--ghost ix-btn--icon ixcb-ic' +
             (on ? ' is-active' : '') + (act ? ' ixcb-inforce' : '') +
             '" data-ixcb="panel" data-lane="' + laneId +
             '" data-v="' + which + '" aria-expanded="' + on + '" ' +
             'title="' + esc(label) + '" aria-label="' + esc(label) + '">' +
             ICONS[which] + '</button>';
  }

  function laneIcons(laneId) {
    return iconBtn(laneId, 'q', 'Search') +
           /* Type moved to the row-1 dropdown; two controls for one thing
              is worse than either alone. */
           iconBtn(laneId, 'sort', 'Sort');
  }

  function chipRow(laneId, which) {
    var out = '';
    if (which === 'sort') {
      for (var i = 0; i < SORT_OPTS.length; i++) {
        var o = SORT_OPTS[i];
        out += '<button type="button" class="ix-btn ix-btn--pill' +
               (S.sort[laneId] === o.v ? ' is-active' : '') + '" ' +
               'data-ixcb="sort" data-lane="' + laneId + '" data-v="' + o.v + '">' +
               esc(o.l) + '</button>';
      }
    } else {
      out += '<button type="button" class="ix-btn ix-btn--pill' + (!S.typeFilter ? ' is-active' : '') +
             '" data-ixcb="type" data-v="">All</button>';
      for (var j = 0; j < ASSET_KEYS.length; j++) {
        var k = ASSET_KEYS[j];
        out += '<button type="button" class="ix-btn ix-btn--pill' +
               (S.typeFilter === k.type ? ' is-active' : '') +
               '" data-ixcb="type" data-v="' + k.type + '">' + esc(k.label) + '</button>';
      }
    }
    return '<div class="ix-chip-group ixcb-chips">' + out + '</div>';
  }

  /* A filter that hides items must be legible WHILE it is hiding
     them. v0.3.0 relied on a 4px dot on an icon, which is fine as a
     reminder and useless as an explanation — an empty lane reads as
     broken long before anyone inspects an icon. */
  function inForceHtml(laneId) {
    var bits = [];
    var q = (S.q[laneId] || '').trim();
    if (q) bits.push('matches for \u201c' + esc(q) + '\u201d');
    /* Type is named in the row-1 dropdown now; repeating it here
       was a banner that never went away. */
    if (!bits.length) return '';
    return '<div class="ixcb-inforce-bar">' +
             '<span>Showing ' + bits.join(' \u00b7 ') + '</span>' +
             '<button type="button" class="ix-revert" data-ixcb="clearall" data-lane="' +
               laneId + '">Clear</button>' +
           '</div>';
  }

  function controlsHtml(laneId) {
    var which = S.open[laneId];
    /* Panel shut but something still filtering — say so in words. */
    if (!which) return inForceHtml(laneId);

    var body;
    if (which === 'q') {
      var q = S.q[laneId] || '';
      var ph = (laneId === 'assets')
        ? 'Name, customer, or month'
        : 'Filename or month';
      body = '<div class="ix-picker ixcb-search">' +
               '<input type="text" class="ix-picker-input' +
                 (q ? ' ix-picker-input--changed' : '') + '" ' +
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

  function compRow(m, inBundle) {
    var fd = m.fieldData || {};
    var id = m.id || fd.id || '';
    var k  = mediaTypeOf(fd);
    var att = isAttached(fd);
    var on = !!S.picked[id];
    var prov = provenanceOf(m);
    var meta = metaOf(m);
    return '<div class="ixcb-r' + (on ? ' ixcb-r-sel' : '') + (att ? ' ixcb-r-att' : '') +
             (inBundle ? ' ixcb-r-kid' : '') + '" data-ixcb="pick" data-id="' + esc(id) + '"' +
             ' tabindex="0" role="button">' +
             '<span class="ixcb-t ixcb-t--' + k + '">' + TYPE_LABEL[k] + '</span>' +
             '<span class="ixcb-n"><span class="ixcb-n-t">' + esc(displayName(m)) + '</span>' +
               (meta ? '<span class="ixcb-n-m">' + meta + '</span>' : '') + '</span>' +
             '<span class="ixcb-prov' + (prov === 'AI' ? ' ixcb-prov-ai' : '') + '">' + prov + '</span>' +
           '</div>';
  }

  /* A bundle is a SELECTION construct (D-CVS-6). Tapping the row
     selects every Available member at once; the caret peeks inside
     without selecting anything, so the operator can drop a member
     before committing. */
  function bundleRow(bun) {
    var openB = !!S.openBundles[bun.id];
    var live = bun.items.filter(function (m) { return !isAttached(m.fieldData || {}); });
    var allOn = live.length > 0 && live.every(function (m) { return S.picked[m.id || '']; });
    var counts = {};
    bun.items.forEach(function (m) {
      var L = TYPE_LABEL[mediaTypeOf(m.fieldData || {})];
      counts[L] = (counts[L] || 0) + 1;
    });

    var out =
      '<div class="ixcb-r ixcb-r-fold' + (allOn ? ' ixcb-r-sel' : '') + (openB ? ' ixcb-open' : '') +
        '" data-ixcb="pickbundle" data-id="' + esc(bun.id) + '" tabindex="0" role="button">' +
        '<button type="button" class="ixcb-exp" data-ixcb="peek" data-id="' + esc(bun.id) +
          '" title="Peek inside" aria-expanded="' + openB + '">\u203a</button>' +
        '<span class="ixcb-t ixcb-t--fold">BDL</span>' +
        '<span class="ixcb-n"><span class="ixcb-n-t">' + esc(bun.label) + '</span>' +
          '</span>' +
        '<span class="ixcb-bcount">' + bun.items.length + '</span>' +
      '</div>';
    if (openB) {
      out += '<div class="ixcb-kids">';
      for (var i = 0; i < bun.items.length; i++) out += compRow(bun.items[i], true);
      out += '</div>';
    }
    return out;
  }

  /* D-CVS-6: status is the ONLY filter on this lane, and it defaults
     to Available. No media-type pills — the coloured tiles carry
     type, and a pill row that repeats them is noise. */
  var STATUSES = [
    { v: 'available', l: 'Available' },
    { v: 'inuse',     l: 'In use' },
    { v: 'all',       l: 'All' }
  ];
  function statusChips() {
    var out = '';
    for (var i = 0; i < STATUSES.length; i++) {
      var o = STATUSES[i];
      out += '<button type="button" class="ix-btn ix-btn--pill' +
             (S.status === o.v ? ' is-active' : '') + '" ' +
             'data-ixcb="status" data-v="' + o.v + '">' + o.l + '</button>';
    }
    return '<div class="ixcb-ctrls ixcb-statusrow"><div class="ix-chip-group ixcb-chips">' + out + '</div></div>';
  }

  function componentsBody() {
    if (S.loading) return '<div class="ixcb-loading"><span class="ixcb-spin"></span>Loading components…</div>';
    var groups = components();
    if (!groups.length) {
      return emptyHtml(S.q.components
        ? 'Nothing matches \u201c' + S.q.components + '\u201d.'
        : (S.status === 'available'
            ? 'Nothing available. Try In use or All.'
            : 'No components yet. Conditioned files land here.'));
    }
    var out = '';
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      /* Newest open, older shut — the grouping IS the filter, so the
         default arrangement does the work with nothing to set. */
      var shut = S.shutGroups.hasOwnProperty(g.key) ? S.shutGroups[g.key] : (i > 1);
      out +=
        '<div class="ixcb-g' + (shut ? ' ixcb-shut' : '') + '">' +
          '<button type="button" class="ixcb-g-h" data-ixcb="group" data-id="' + esc(g.key) + '">' +
            '<span class="ixcb-g-c">\u25be</span>' +
            '<span class="ixcb-g-d">' + esc(g.label) + '</span>' +
            '<span class="ixcb-g-n">' + g.count + '</span>' +
          '</button>' +
          '<div class="ixcb-g-b">';
      for (var b = 0; b < g.bundleList.length; b++) out += bundleRow(g.bundleList[b]);
      for (var L = 0; L < g.loose.length; L++)    out += compRow(g.loose[L], false);
      out += '</div></div>';
    }
    return out;
  }

  /* The tray. Selecting components is only useful if it leads
     somewhere, and where it leads is an asset. */
  function trayHtml() {
    var ids = Object.keys(S.picked).filter(function (k) { return S.picked[k]; });
    if (!ids.length) return '';
    return '<div class="ixcb-tray">' +
             '<span class="ixcb-tray-n">' + ids.length +
               (ids.length === 1 ? ' selected' : ' selected') + '</span>' +
             '<button type="button" class="ix-revert ixcb-tray-x" data-ixcb="unpick">Clear</button>' +
             '<button type="button" class="ixcb-tray-go" data-ixcb="create">Create asset \u2192</button>' +
           '</div>';
  }

  /* ── Reader-facing views (v0.6.4) ──
     An article has a page a reader can visit. An ad, an event and a
     listing do not — they only ever appear inside a newsletter, which
     is precisely why the operator cannot check them without help. */

  function articleUrl(rec) {
    var fd = rec.fieldData || {};
    var c = cfg() || {};
    if (fd['article-url']) return fd['article-url'];
    var base = c.articleBaseUrl || '';
    if (!base) return '';        /* no guessed URL pattern — see below */
    return base.replace(/\/+$/, '') + '/' + (fd.slug || '');
  }

  function firstImage(rec) {
    var fd = rec.fieldData || {};
    return fd['image-url'] || fd['main-image-url'] || fd['ad-image'] ||
           (fd['main-image'] && fd['main-image'].url) || '';
  }

  /* Ads are a picture, so the lightbox IS the reader view. Events and
     listings are a card, so the reader view has to be assembled from
     their fields — the same ones the render reads. */
  function previewAsset(rec, type) {
    var fd = rec.fieldData || {};
    var img = firstImage(rec);

    if (type === 'ad') {
      if (!img) { note('That ad has no creative attached yet.'); return; }
      if (window.InbxLightbox) { window.InbxLightbox.open(img, { caption: displayName(rec) }); return; }
      window.open(img, '_blank', 'noopener');
      return;
    }

    var rows = [];
    function add(label, val) { if (val) rows.push([label, String(val)]); }
    if (type === 'event') {
      add('When',  fd['event-date-text'] || fd['event-date'] || fd['date'] || '');
      add('Where', fd['venue-name'] || fd['venue'] || fd['location'] || '');
      add('Address', fd['venue-address'] || fd['address'] || '');
      add('Cost',  fd['cost'] || fd['price'] || '');
    } else {
      add('Address', fd['address'] || fd['street-address'] || '');
      add('Price',   fd['price'] || fd['list-price'] || '');
      add('Beds',    fd['beds'] || fd['bedrooms'] || '');
      add('Baths',   fd['baths'] || fd['bathrooms'] || '');
      add('Agent',   fd['agent-name'] || fd['agent'] || '');
    }
    var body = String(fd['event-description'] || fd['description'] || fd['summary'] || '');

    var ov = document.createElement('div');
    ov.className = 'ixcb-ov';
    ov.innerHTML =
      '<div class="ixcb-ov-card ix-keep-bg">' +
        '<div class="ixcb-ov-h ix-on-dark">' +
          '<span class="ixcb-ov-t">' + esc(displayName(rec)) + '</span>' +
          '<button type="button" class="ixcb-ov-x" aria-label="Close">\u00d7</button>' +
        '</div>' +
        (img ? '<img class="ixcb-ov-img" src="' + esc(img) + '" alt="">' : '') +
        '<div class="ixcb-ov-b">' +
          (rows.length
            ? '<dl class="ixcb-ov-dl">' + rows.map(function (r) {
                return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>'
            : '') +
          (body ? '<div class="ixcb-ov-p">' + body + '</div>' : '') +
          (!rows.length && !body && !img
            ? '<div class="ixcb-ov-none">This record has no reader-facing content yet.</div>' : '') +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); document.removeEventListener('keydown', esckey); }
    function esckey(e) { if (e.key === 'Escape') close(); }
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('.ixcb-ov-x')) close();
    });
    document.addEventListener('keydown', esckey);
  }

  /* Where an asset already lives. The Assets lane exists to answer
     "what still needs an issue", and until now it could not. */
  function placementOf(rec) {
    var fd = rec.fieldData || {};
    var pp = fd['publication-plan-name'] || fd['pubplan-name'] || fd['publication-plan'] || '';
    var nl = fd['newsletter-name'] || fd['newsletter'] || '';
    /* A reference field arrives as a bare id when it is not resolved.
       An id tells the operator nothing, so it counts as unplaced
       rather than being printed as noise. */
    if (/^[a-f0-9]{24,}$/i.test(String(pp))) pp = '';
    if (/^[a-f0-9]{24,}$/i.test(String(nl))) nl = '';
    var bits = [];
    if (pp) bits.push(String(pp));
    if (nl && nl !== pp) bits.push(String(nl));
    return bits.join(' \u00b7 ');
  }

  /* Events invite one specific mistake — placing one that has already
     happened. The date is therefore the meta line, and a past date is
     called out rather than merely printed. */
  function eventWhen(rec) {
    var fd = rec.fieldData || {};
    var raw = fd['event-date'] || fd['start-date'] || fd['date'] || fd['event-date-text'] || '';
    if (!raw) return '';
    var d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    var txt;
    try {
      txt = new Intl.DateTimeFormat('en-US',
        { timeZone: titleTz(), month: 'short', day: 'numeric', year: 'numeric' }).format(d);
    } catch (e) { txt = String(raw).slice(0, 10); }
    var past = d.getTime() < Date.now() - 86400000;
    return past ? '<span class="ixcb-lo">' + esc(txt) + ' \u00b7 past</span>' : esc(txt);
  }

  function assetMeta(a) {
    if (a.type === 'event') return eventWhen(a.rec);
    if (a.type === 'article') {
      var p = placementOf(a.rec);
      return p ? esc(p) : '<span class="ixcb-unpl">unplaced</span>';
    }
    return '';
  }

  function assetsBody() {
    if (S.loading) return '<div class="ixcb-loading"><span class="ixcb-spin"></span>Loading assets…</div>';
    var list = assets();
    if (!list.length) {
      return emptyHtml((S.q.assets || S.typeFilter)
        ? 'Nothing matches the current search or filter.'
        : 'No assets yet. Components become assets here.');
    }
    var armedId = S.armed ? S.armed.id : '';
    var out = '<div class="ixcb-rows">';
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      var f = a.rec.fieldData || a.rec;
      var name = f.name || f['article-title'] || f.title || 'Untitled';
      out +=
        '<div class="ixcb-row' + (armedId === (a.rec.id || '') ? ' ixcb-row-armed' : '') +
          '" data-ixcb="arm" data-id="' + esc(a.rec.id || '') +
          '" data-type="' + esc(a.type) + '" data-name="' + esc(name) +
          '" tabindex="0" role="button" title="Place in an issue">' +
          '<span class="ixcb-kind ixcb-kind--' + a.type + '">' + esc(a.kind) + '</span>' +
          (function () {
            var mt = assetMeta(a);
            return '<span class="ixcb-n"><span class="ixcb-row-n">' + esc(name) + '</span>' +
                   (mt ? '<span class="ixcb-n-m">' + mt + '</span>' : '') + '</span>';
          })() +
          /* Editing is secondary here. It stays reachable — and always
             reachable by keyboard — but it is no longer what a stray
             click on the row does. */
          (function () {
            /* Article → its live page. Everything else → a reader
               preview, because it has no page to visit. */
            if (a.type === 'article') {
              var u = articleUrl(a.rec);
              return u
                ? '<a class="ix-revert ixcb-edit" href="' + esc(u) + '" target="_blank" rel="noopener" ' +
                    'data-ixcb="noop" title="Open the article in a new tab">Open \u2197</a>'
                : '';
            }
            return '<button type="button" class="ix-revert ixcb-edit" data-ixcb="preview" ' +
                     'data-id="' + esc(a.rec.id || '') + '" data-type="' + esc(a.type) + '" ' +
                     'title="See it as a reader would">View</button>';
          })() +
          '<button type="button" class="ix-revert ixcb-edit" data-ixcb="open-asset" ' +
            'data-id="' + esc(a.rec.id || '') + '" data-type="' + esc(a.type) + '" ' +
            'title="Open in the editor">Edit</button>' +
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

    var live = plans.filter(function (p) { return !p.locked; });
    var lockedN = plans.length - live.length;
    var shown = S.showLocked ? plans : live;

    var out = '';
    if (S.armed) {
      out += '<div class="ixcb-arm-bar">' +
               '<span class="ix-needs-you">PLACING</span>' +
               '<span class="ixcb-arm-n">' + esc(S.armed.name) + '</span>' +
               '<span class="ixcb-arm-h">\u2192 Pick an issue below</span>' +
               '<button type="button" class="ix-revert" data-ixcb="disarm">Cancel</button>' +
             '</div>';
    }
    /* 21 finished plans between the operator and the 3 they are
       working on is 21 things to scroll past. In Progress by default;
       the rest is one click away and counted so nothing is hidden
       silently. */
    if (S.lockUnknown) {
      out += '<div class="ixcb-empty ixcb-diag" style="margin-bottom:10px"><b>Lock state unknown.</b>' +
             'No planning-status is published on the PubPlan collection, so the board cannot tell ' +
             'which issues are locked. Placement is still allowed \u2014 check the issue before you place.</div>';
    }
    if (lockedN) {
      out += '<div class="ixcb-lockbar">' +
               '<span>' + live.length + ' in progress \u00b7 ' + lockedN + ' locked</span>' +
               '<button type="button" class="ix-revert" data-ixcb="showlocked">' +
                 (S.showLocked ? 'Hide locked' : 'Show locked') + '</button>' +
             '</div>';
    }
    out += '<div class="ixcb-plans' + (S.armed ? ' ixcb-targeting' : '') + '">';
    for (var i = 0; i < shown.length; i++) {
      var p = shown[i];
      var placed = filledCount(p);

      out +=
        '<article class="ixcb-plan ix-spine' +
          (p.locked ? ' ixcb-locked' : (i === 0 ? ' ix-spine--now' : '')) +
          '" data-id="' + esc(p.id) + '">' +
          '<header class="ixcb-plan-hd ix-on-dark">' +
            '<div class="ixcb-plan-id">' +
              '<span class="ixcb-plan-n">' + esc(p.name) + '</span>' +
              (p.locked ? '<span class="ixcb-lockchip">LOCKED</span>'
                        : (i === 0 ? '<span class="ix-needs-you">NEXT</span>' : '')) +
            '</div>' +
            (p.sub ? '<div class="ixcb-plan-s">' + esc(p.sub) + '</div>' : '') +
          '</header>' +
          '<div class="ixcb-plan-b">' +
            '<div class="ixcb-plan-m">' +
              /* The control that actually fires placement. Present only
                 while something is armed — a Place button with nothing
                 to place would be a permanent dead affordance. */
              (S.armed && !p.locked
                ? '<button type="button" class="ix-btn ix-btn--primary ixcb-place"' +
                    (S.placing ? ' disabled' : '') +
                    ' data-ixcb="place" data-id="' + esc(p.id) + '">' +
                    (S.placing ? 'Placing\u2026' : 'Place here') + '</button>'
                : '') +
              /* No denominator. An MNA issue is as long as it is. */
              '<span class="ixcb-fill"><b>' + placed + '</b> ' +
                (placed === 1 ? 'item placed' : 'items placed') + '</span>' +
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
    if (col.id === 'components') return '<div class="ixcb-lane">' + componentsBody() + '</div>';
    if (col.id === 'assets')     return controlsHtml('assets')     + '<div class="ixcb-lane">' + assetsBody() + '</div>';
    return issuesBody();
  }

  function colCount(col) {
    if (col.id === 'components') return S.data ? String(componentCount()) : '';
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

  /* The mockup's segmented control. One track, three segments, the
     live one filled — so the operator reads the whole set of choices
     at once instead of a single button whose label changes. */
  function modeSwitcher() {
    var out = '';
    for (var i = 0; i < MODES.length; i++) {
      var m = MODES[i], on = (S.mode === m.v);
      out += '<button type="button" class="ixcb-seg' + (on ? ' ixcb-seg-on' : '') + '" ' +
               'data-ixcb="mode" data-v="' + m.v + '" ' +
               'aria-pressed="' + on + '" title="' + esc(m.t) + '">' + esc(m.l) + '</button>';
    }
    return '<div class="ixcb-segs" role="group" aria-label="Board mode">' + out + '</div>';
  }

  function appBar() {
    return '<div class="ixcb-appbar ix-on-dark">' +
             '<span class="ixcb-brand">Cadence Board</span>' +
             '<span class="ixcb-tenant">' + esc(tenantLabel()) + '</span>' +

             '<div class="ixcb-appbar-sp"></div>' +
             (S.error ? '<span class="ixcb-err' +
                (S.errorTone === 'ok' ? ' ixcb-err-ok' : '') + '">' + esc(S.error) + '</span>' : '') +
             (S.shared
               ? '<button type="button" class="ix-btn ix-btn--ghost ixcb-onbar" data-ixcb="to-legacy" ' +
                   'title="Return to the Studio panels">\u2039 Studio</button>'
               : '') +
             '<button type="button" class="ix-btn ix-btn--ghost ixcb-onbar" data-ixcb="refresh"' +
               (S.loading ? ' disabled' : '') + '>' +
               (S.loading ? '<span class="ixcb-spin"></span>Loading' : '\u21bb Refresh') +
             '</button>' +
             modeSwitcher() +
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
               : colHead(col, colCount(col)) +
                 '<div class="ixcb-colbody">' + colBody(col) + '</div>' +
                 /* Footer, not a child of the scrolling body — see the
                    v0.6.4 note. */
                 '') +
        '</section>';
    }
    S.root.innerHTML =
      appBar() +
      '<div class="ixcb-cols' + (S.mode === 'assemble' ? ' ixcb-focused' : '') + '">' + cols + '</div>' +
      trayHtml();
  }

  /* ═══════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════ */

  /* ASF speaks 'realestate'; the board labels the lane 'RE'. Map at
     the boundary rather than renaming the lane — publicOpen() coerces
     an unknown assetType to 'article' WITHOUT failing, so a bad value
     here would silently open the wrong editor on the right record. */
  var ASF_TYPE = { article: 'article', ad: 'ad', event: 'event', re: 'realestate' };

  function note(msg, tone) {
    S.error = msg;
    S.errorTone = tone || 'bad';
    renderAll();
    clearTimeout(note._t);
    note._t = setTimeout(function () {
      if (S.error === msg) { S.error = null; S.errorTone = null; renderAll(); }
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

  /* ═══════════════════════════════════════════
     PLACEMENT — the two-post flow from content-library v1.0.61.
     Keys copied verbatim; do not re-derive them.
     ═══════════════════════════════════════════ */

  var ASSET_TYPE_PARAM = { article: 'article', ad: 'ad', event: 'event', re: 'realestate' };
  var UNPLACED_BASE = 900;   /* HC-CL-UNPLACED sentinel — same as content-library */

  function armAsset(id, type, name) {
    if (!id) { note('That record has no id and cannot be placed.'); return; }
    S.armed = { id: id, type: type, name: name };
    /* Placing needs the Issues column visible. Produce hides it, so
       arming implies a mode change rather than a dead-end. */
    if (S.mode === 'produce') setMode('both'); else renderAll();
  }

  function disarm() { S.armed = null; S.placing = false; renderAll(); }

  function placeArmed(pubplanId) {
    var a = S.armed;
    if (!a || S.placing) return;
    var c = cfg() || {};
    var url124 = c.makeBlockWriter;
    if (!url124) {
      /* content-library v1.0.62 burned this in: a missing webhook used
         to console.error and return, which read to the operator as
         "clicked Save, nothing happened". Say it out loud instead. */
      note('Cannot place — TA_CONFIG.makeBlockWriter is not configured.');
      return;
    }
    var plan = null;
    for (var i = 0; i < S.plans.length; i++) if (S.plans[i].id === pubplanId) plan = S.plans[i];
    /* Hiding the button is a courtesy; refusing the write is the rule.
       A stale render, a keyboard path or a console call must all hit
       the same wall. */
    if (plan && plan.locked) {
      note('\u201c' + plan.name + '\u201d is locked. Unlock it in Pub Plans first.');
      return;
    }

    S.placing = true; renderAll();

    var p = new URLSearchParams();
    p.set('op', 'save');
    p.set('pubplanId', pubplanId);
    p.set('newsletterId', '');                       // empty at PubPlan level
    p.set('assetType', ASSET_TYPE_PARAM[a.type] || 'article');
    p.set('assetId', a.id);
    p.set('blockType', '');                          // K2/K7 — untyped until Promote
    p.set('blockTypeHash', '');
    p.set('titleAdminId', tenantId() || '');
    p.set('stage', 'planning');
    p.set('position', String(UNPLACED_BASE));
    p.set('source', 'cadence-board');

    /* (b) stamp the article's own refs. Fired alongside, logged,
       non-blocking — NL-BLOCKS is the placement of record. */
    (function stampAsset() {
      var au = c.makeAssetWriter || c.makeCreateAsset;
      if (!au) { console.warn(TAG, 'makeAssetWriter missing — article ref not stamped'); return; }
      var ap = new URLSearchParams();
      ap.set('op', 'edit');
      ap.set('itemId', a.id);
      ap.set('pubplanId', pubplanId);
      ap.set('pubplanName', plan ? plan.name : '');
      ap.set('taItemId', tenantId() || '');
      ap.set('source', 'cadence-board');
      fetch(au + '?' + ap.toString())
        .then(function (r) { if (!r.ok) console.warn(TAG, '104 edit non-ok'); })
        .catch(function () { fetch(au + '?' + ap.toString(), { mode: 'no-cors' }).catch(function (e) {
          console.error(TAG, '104 edit failed', e); }); });
    })();

    var name = a.name, planName = plan ? plan.name : pubplanId;
    fetch(url124 + '?' + p.toString())
      .then(function (r) {
        if (!r.ok) throw new Error('Scenario 124 returned ' + r.status);
        return r.text();
      })
      .then(function () {
        S.placing = false; S.armed = null;
        note('Placed \u201c' + name + '\u201d in ' + planName + '.', 'ok');
        fetchData('placed');
      })
      .catch(function (err) {
        console.error(TAG, 'place failed:', err);
        S.placing = false;
        note('Could not place \u201c' + name + '\u201d. Nothing was written.');
        renderAll();
      });
  }

  /* D-CVS-7 — plain language, context-launched, so nobody leaves the
     board to make a component. Each entry hands off to the tool that
     already owns that job. */
  var CREATORS = [
    { l: 'Transcribe Text',       ev: 'std:panel:transcriber' },
    { l: 'Generate an Image',     ev: 'std:panel:generate' },
    { l: 'Reformat an Ad',        ev: 'std:panel:generator' },
    { l: 'Upscale a Small Image', ev: 'std:panel:converter', tool: 'upscale' }
  ];

  function openCreators(anchor) {
    var old = document.querySelector('.ixcb-menu');
    if (old) { old.remove(); return; }
    var m = document.createElement('div');
    m.className = 'ixcb-menu';
    m.innerHTML = CREATORS.map(function (c, i) {
      return '<button type="button" data-ixcb="creator" data-i="' + i + '">' + esc(c.l) + '</button>';
    }).join('');
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect();
    m.style.top  = (r.bottom + 6 + window.scrollY) + 'px';
    m.style.left = (r.left + window.scrollX) + 'px';
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
    if (act === 'mode') { setMode(t.getAttribute('data-v')); return; }
    if (act === 'refresh') { S.plans = harvestPlans(); fetchData('manual'); return; }

    if (act === 'new')     { openCreators(t); return; }
    if (act === 'creator') {
      var c = CREATORS[parseInt(t.getAttribute('data-i'), 10)];
      var mm = document.querySelector('.ixcb-menu'); if (mm) mm.remove();
      if (!c) return;
      /* The tools live in Studio and self-mount on their own events.
         Switching views is honest about that rather than pretending
         the tool runs here — until each tool grows an overlay mount,
         this is the truthful handoff. */
      try { window.dispatchEvent(new CustomEvent(c.ev, { detail: { initialTool: c.tool || null } })); }
      catch (err) {}
      setView('legacy');
      return;
    }
    if (act === 'drop')    { openDrop(t, t.getAttribute('data-lane')); return; }
    if (act === 'dropset') {
      var dl = t.getAttribute('data-lane'), dv = t.getAttribute('data-v');
      var mx = document.querySelector('.ixcb-menu'); if (mx) mx.remove();
      if (dl === 'components') S.status = dv;
      else S.typeFilter = (dv === 'all') ? '' : dv;
      persist(); renderAll(); return;
    }
    if (act === 'noop')       { return; }   /* plain link, let it through */
    if (act === 'showlocked') { S.showLocked = !S.showLocked; persist(); renderAll(); return; }
    if (act === 'preview') {
      e.stopPropagation();
      var pid2 = t.getAttribute('data-id'), pty = t.getAttribute('data-type');
      var found = null;
      assets().forEach(function (a) { if ((a.rec.id || '') === pid2) found = a; });
      if (found) previewAsset(found.rec, pty);
      return;
    }
    if (act === 'status') { S.status = t.getAttribute('data-v'); persist(); renderAll(); return; }
    if (act === 'group') {
      var gk = t.getAttribute('data-id');
      var groups = components(), idx = -1;
      for (var i = 0; i < groups.length; i++) if (groups[i].key === gk) idx = i;
      var cur = S.shutGroups.hasOwnProperty(gk) ? S.shutGroups[gk] : (idx > 1);
      S.shutGroups[gk] = !cur;
      renderAll(); return;
    }
    if (act === 'peek') {
      e.stopPropagation();   /* peek must not also select the bundle */
      var bid = t.getAttribute('data-id');
      S.openBundles[bid] = !S.openBundles[bid];
      renderAll(); return;
    }
    if (act === 'pick') {
      var pid = t.getAttribute('data-id');
      if (S.picked[pid]) delete S.picked[pid]; else S.picked[pid] = true;
      renderAll(); return;
    }
    if (act === 'pickbundle') {
      /* One tap takes every AVAILABLE member. Attached rows are left
         alone — they already belong to something. */
      var bid2 = t.getAttribute('data-id'), grps = components(), bun = null;
      for (var g2 = 0; g2 < grps.length; g2++)
        for (var b2 = 0; b2 < grps[g2].bundleList.length; b2++)
          if (grps[g2].bundleList[b2].id === bid2) bun = grps[g2].bundleList[b2];
      if (!bun) return;
      var live = bun.items.filter(function (m) { return !isAttached(m.fieldData || {}); });
      var allOn = live.length > 0 && live.every(function (m) { return S.picked[m.id || '']; });
      live.forEach(function (m) {
        if (allOn) delete S.picked[m.id]; else S.picked[m.id] = true;
      });
      renderAll(); return;
    }
    if (act === 'unpick') { S.picked = {}; renderAll(); return; }
    if (act === 'create') {
      var sel = Object.keys(S.picked).filter(function (k) { return S.picked[k]; });
      if (!sel.length) return;
      if (!window.InbxASF || typeof window.InbxASF.open !== 'function') {
        note('The asset editor is not loaded on this page.'); return;
      }
      /* D-CVS-2 again: ASF owns creation. The board resolves the
         selection into the shape ta-intake-manager v3.0.1 established
         and hands off — it does not create anything itself. */
      var picked = [], all = components();
      all.forEach(function (g) {
        g.loose.forEach(function (m) { if (S.picked[m.id]) picked.push(m); });
        g.bundleList.forEach(function (b) { b.items.forEach(function (m) { if (S.picked[m.id]) picked.push(m); }); });
      });
      var prefilledMedia = picked.map(function (m) {
        var fd = m.fieldData || {};
        return { id: m.id, mediaType: mediaTypeOf(fd),
                 imageUrl: fd['image-url'] || '', htmlContent: fd['html-content'] || '' };
      });
      try {
        window.InbxASF.open({
          mode: 'create', assetType: 'article',
          prefilledMediaIds: sel, prefilledMedia: prefilledMedia,
          tenantId: S.tenantId
        });
        S.picked = {};
        renderAll();
        watchAsfClose();
      } catch (err) {
        console.error(TAG, 'ASF create threw:', err);
        note('Could not open the editor.');
      }
      return;
    }
    if (act === 'arm') {
      armAsset(t.getAttribute('data-id'), t.getAttribute('data-type'), t.getAttribute('data-name'));
      return;
    }
    if (act === 'place')  { placeArmed(t.getAttribute('data-id')); return; }
    if (act === 'disarm') { disarm(); return; }
    if (act === 'open-asset') {
      e.stopPropagation();   /* the Edit link sits inside an armable row */
      openAsset(t.getAttribute('data-id'), t.getAttribute('data-type'));
      return;
    }
    /* Retained only as a stable entry point; the tile grid that
       emitted it is gone. */
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
        var box = S.root.querySelector('.ixcb-col--' + pl + ' .ix-picker-input');
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
    if (act === 'clearall') {
      var cl = t.getAttribute('data-lane');
      S.q[cl] = '';
      if (cl === 'assets') S.typeFilter = '';
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
    if (!el.classList || !el.classList.contains('ix-picker-input')) return;
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
        mode:       S.mode,
        collapsed:  S.collapsed,
        sort:       S.sort,
        open:       S.open
        /* q and typeFilter are deliberately NOT persisted — see the
           v0.6.4 note. A question asked last session must not silently
           filter this one. */
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
    if (o.open)       S.open       = o.open;
    /* Discard anything v0.1.3–v0.3.0 wrote for the transient pair.
       Reading o.q / o.typeFilter here is what left a stale query
       filtering a lane across sessions. */
    S.q          = { components: '', assets: '' };
    S.typeFilter = 'article';
    S.showLocked = !!o.showLocked;

    /* v0.1.3–v0.3.3 stored a boolean `focus`. Read it so an operator
       who left the board collapsed comes back to the equivalent mode
       rather than a reset board. */
    S.mode = o.mode || (o.focus ? 'assemble' : 'both');
    if (!o.collapsed) { var md = modeDef(S.mode); S.collapsed = {
      components: md.cols.components, assets: md.cols.assets, issues: md.cols.issues }; }
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
    if (boardOn) { try { fitHeight(); } catch (e) {} }
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

  /* The board does not begin at the top of the viewport — the site
     nav, the title block and the tab strip sit above it. A vh height
     therefore overshoots by exactly that offset and pushes the
     board's own footer below the fold. Measure instead. */
  function fitHeight() {
    if (!S.root || S.view !== 'board') return;
    var top = S.root.getBoundingClientRect().top;
    var h = Math.max(460, Math.round(window.innerHeight - top - 16));
    S.root.style.height = h + 'px';
    S.root.style.minHeight = h + 'px';
    S.root.style.maxHeight = h + 'px';
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
    /* ix-surface-scope brings the wildcard defence from ix-tokens.
       Do not replace this with a local reset. */
    root.className = 'ixcb-root ix-surface-scope';
    root.setAttribute('data-ixcb-root', VERSION);
    root.style.display = 'none';
    S.host.appendChild(root);
    S.root = root;
    S.mounted = true;

    document.addEventListener('click', onClick);
    document.addEventListener('click', onSwitchClick);
    document.addEventListener('input', onSearchInput);
    /* Resize only. Recomputing on scroll would resize the board under
       the operator while they are reading it. */
    window.addEventListener('resize', fitHeight);
    /* Rows are role=button, so Enter and Space must work. */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && S.armed) { disarm(); return; }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var r = e.target.closest && e.target.closest('[data-ixcb="arm"],[data-ixcb="open-asset"]');
      if (!r || !S.root || !S.root.contains(r)) return;
      e.preventDefault();
      if (r.getAttribute('data-ixcb') === 'open-asset') {
        openAsset(r.getAttribute('data-id'), r.getAttribute('data-type'));
      } else {
        armAsset(r.getAttribute('data-id'), r.getAttribute('data-type'), r.getAttribute('data-name'));
      }
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
    fitHeight();

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
    setMode:  setMode,
    collapse: toggleCollapse,
    _state:   S
  };
  console.log(TAG, 'loaded');
})();
