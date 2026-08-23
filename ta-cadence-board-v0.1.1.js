/* ════════════════════════════════════════════════════════════════
   ta-cadence-board-v0.1.1.js
   INBXIFY T-A — Cadence Board · SKELETON
   Companion: ta-cadence-board-v0.1.1.css (matched pair — load both)

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

  var VERSION = '0.1.1';
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
      S.tenantId = (data.tenant && data.tenant.titleAdminId) || null;
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
  function components() {
    var d = S.data;
    if (!d) return [];
    var a = Array.isArray(d.media)      ? d.media      : [];
    var b = Array.isArray(d.mediaExtra) ? d.mediaExtra : [];
    return filterMediaByTenant(a.concat(b), S.tenantId);
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
        out.push({ rec: arr[j], kind: k.label, type: k.type });
      }
    }
    return out;
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
    renderAll();
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
    renderAll();
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

  function colHead(col, countText) {
    return '<div class="ixcb-colhead">' +
             '<div class="ixcb-colhead-l">' +
               '<span class="ixcb-coltitle">' + esc(col.label) + '</span>' +
               (countText ? '<span class="ixcb-count">' + esc(countText) + '</span>' : '') +
             '</div>' +
             '<button type="button" class="ixcb-collapse" data-ixcb="collapse" data-col="' + col.id + '" ' +
               'title="Collapse ' + esc(col.label) + '">\u2039</button>' +
             '<div class="ixcb-colhint">' + esc(col.hint) + '</div>' +
           '</div>';
  }

  function emptyHtml(msg) {
    return '<div class="ixcb-empty">' + esc(msg) + '</div>';
  }

  function componentsBody() {
    if (S.loading) return '<div class="ixcb-loading"><span class="ixcb-spin"></span>Loading components…</div>';
    var list = components();
    if (!list.length) return emptyHtml('No components yet. Conditioned files land here.');
    var out = '<div class="ixcb-tiles">';
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      var f = m.fieldData || m;
      var name = f.name || f.filename || f.slug || 'Untitled';
      var url  = f['image-url'] || f['media-url'] || f.url || '';
      out +=
        '<div class="ixcb-tile" data-id="' + esc(m.id || f.id || '') + '">' +
          (url ? '<div class="ixcb-thumb"><img src="' + esc(url) + '" alt="" loading="lazy"></div>'
               : '<div class="ixcb-thumb is-none"></div>') +
          '<div class="ixcb-tile-b"><span class="ixcb-tile-n">' + esc(name) + '</span></div>' +
        '</div>';
    }
    return out + '</div>';
  }

  function assetsBody() {
    if (S.loading) return '<div class="ixcb-loading"><span class="ixcb-spin"></span>Loading assets…</div>';
    var list = assets();
    if (!list.length) return emptyHtml('No assets yet. Components become assets here.');
    var out = '<div class="ixcb-rows">';
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      var f = a.rec.fieldData || a.rec;
      var name = f.name || f['article-title'] || f.title || 'Untitled';
      out +=
        '<div class="ixcb-row" data-id="' + esc(a.rec.id || '') + '">' +
          '<span class="ixcb-kind ixcb-kind--' + a.kind.toLowerCase() + '">' + esc(a.kind) + '</span>' +
          '<span class="ixcb-row-n">' + esc(name) + '</span>' +
        '</div>';
    }
    return out + '</div>';
  }

  function issuesBody() {
    var plans = S.plans;
    if (!plans.length) {
      /* Mirrors issues-tab v1.0.17: a zero-result Issues lane is
         almost always a DOM-contract drift after a Designer rename,
         and pubplan-overview v1.0.12 used to fail silently on exactly
         this. Name the missing selector instead of showing an empty
         column that reads like "no work to do". */
      var hasItem = !!document.querySelector('.pubplan-item');
      var hasSlot = !!document.querySelector('.pubplan-item .pubplan-slot-wrapper');
      var why = !hasItem
        ? 'No .pubplan-item elements on this page — the hidden PUBLICATION PLAN collection is missing or renamed.'
        : (!hasSlot
            ? '.pubplan-item found, but no .pubplan-slot-wrapper inside it — the slot binding has drifted.'
            : 'Plan items found but none carried a .pubplan-id.');
      return '<div class="ixcb-empty is-diag"><b>Issues lane found nothing.</b>' + esc(why) + '</div>';
    }
    var out = '<div class="ixcb-plans">';
    for (var i = 0; i < plans.length; i++) {
      var p = plans[i];
      var filled = filledCount(p), total = p.slots.length;
      out +=
        '<div class="ixcb-plan" data-id="' + esc(p.id) + '">' +
          '<div class="ixcb-plan-h">' +
            '<span class="ixcb-plan-n">' + esc(p.name) + '</span>' +
            (i === 0 ? '<span class="ixcb-next">NEXT</span>' : '') +
          '</div>' +
          (p.sub ? '<div class="ixcb-plan-s">' + esc(p.sub) + '</div>' : '') +
          '<div class="ixcb-plan-m">' +
            '<span class="ixcb-fill">' + filled + ' of ' + total + ' slots filled</span>' +
            /* D-CB-5 — hidden entirely when the field is empty, so
               titles that carry no print product show nothing. */
            (p.printUrl
              ? '<a class="ixcb-print" href="' + esc(p.printUrl) + '" target="_blank" rel="noopener">Print edition \u2197</a>'
              : '') +
          '</div>' +
        '</div>';
    }
    return out + '</div>';
  }

  function colBody(col) {
    if (col.id === 'components') return componentsBody();
    if (col.id === 'assets')     return assetsBody();
    return issuesBody();
  }

  function colCount(col) {
    if (col.id === 'components') return S.data ? String(components().length) : '';
    if (col.id === 'assets')     return S.data ? String(assets().length) : '';
    return String(S.plans.length);
  }

  function appBar() {
    var stale = S.lastFetchAt ? '' : '';
    return '<div class="ixcb-appbar">' +
             '<span class="ixcb-brand">Cadence</span>' +
             '<span class="ixcb-scopes">' +
               '<span class="ixcb-scope">Create</span>' +
               '<span class="ixcb-scope-arrow">\u2192</span>' +
               '<span class="ixcb-scope">Plan</span>' +
             '</span>' +
             '<div class="ixcb-appbar-sp"></div>' +
             (S.error ? '<span class="ixcb-err">' + esc(S.error) + '</span>' : '') +
             /* Only rendered in co-tenancy. On a dedicated host there
                is no legacy surface and the control would be a lie. */
             (S.shared
               ? '<button type="button" class="ixcb-swap" data-ixcb="to-legacy" ' +
                   'title="Return to the Studio panels">\u2039 Studio</button>'
               : '') +
             '<button type="button" class="ixcb-ghost" data-ixcb="refresh"' +
               (S.loading ? ' disabled' : '') + '>' +
               (S.loading ? '<span class="ixcb-spin"></span>Loading' : '\u21bb Refresh') +
             '</button>' +
             '<button type="button" class="ixcb-focus' + (S.focus ? ' is-on' : '') + '" ' +
               'data-ixcb="focus" title="Collapse Create and give the width to Issues">' +
               (S.focus ? 'Leave focus' : 'Focus') +
             '</button>' +
           '</div>' + stale;
  }

  function renderAll() {
    if (!S.root) return;
    var cols = '';
    for (var i = 0; i < COLS.length; i++) {
      var col = COLS[i];
      var isC = S.collapsed[col.id];
      cols +=
        '<section class="ixcb-col ixcb-col--' + col.id + (isC ? ' is-collapsed' : '') +
          (col.scope === 'issue' ? ' is-scoped' : '') + '" data-col="' + col.id + '">' +
          (isC ? railHtml(col)
               : colHead(col, colCount(col)) + '<div class="ixcb-colbody">' + colBody(col) + '</div>') +
        '</section>';
    }
    S.root.innerHTML =
      appBar() +
      '<div class="ixcb-cols' + (S.focus ? ' is-focus' : '') + '">' + cols + '</div>';
  }

  /* ═══════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════ */

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

  function findHost() {
    var el = document.querySelector('[data-ix-board]');
    if (el) return { el: el, shared: false };
    el = document.querySelector('[data-w-tab="Cadence"]');
    if (el) return { el: el, shared: false };
    /* D-CB-24 — the board replaces Studio. Until the Designer swap
       happens the two share the pane, and sharing means HIDING the
       legacy children, never removing them. */
    el = document.querySelector('[data-w-tab="Studio"]');
    if (el) return { el: el, shared: true };
    return null;
  }

  function readView() {
    /* Defaults to legacy. Dropping in a script tag must not seize the
       operator's working tab; opting in is an explicit act. */
    try {
      var v = window.localStorage.getItem(VIEW_KEY);
      return (v === 'board') ? 'board' : 'legacy';
    } catch (e) { return 'legacy'; }
  }

  function writeView(v) {
    try { window.localStorage.setItem(VIEW_KEY, v); } catch (e) {}
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
    writeView(S.view);
    applyView();
  }

  function mount() {
    if (S.mounted) return true;
    var found = findHost();
    if (!found) return false;

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
    window.addEventListener('inbx:asset-saved', function () {
      if (S.view === 'board') fetchData('asset-saved');
    });

    /* On a dedicated host there is no legacy surface to defer to, so
       the board is simply on. */
    S.view = S.shared ? readView() : 'board';
    S.plans = harvestPlans();
    renderAll();
    applyView();

    log('mounted', S.shared ? '(shared with Studio)' : '(dedicated host)', 'view=' + S.view);
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
      if (mount() || tries > 40) clearInterval(iv);
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
  log('ready');
})();
