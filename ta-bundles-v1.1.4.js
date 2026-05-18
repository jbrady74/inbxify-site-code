/* ============================================================
   ta-bundles-v1.1.4.js
   ============================================================
   INBXIFY · Bundles Workspace · Cut 2 ship 2.75 of 3
   (Action bar polish — match .dashboard width)

   ─── v1.1.4 changelog (polish patch on v1.1.3) ───
   Three action-bar adjustments per Jeff:
   1. Width now mirrors the .dashboard div (not #bdl-root).
      syncCascadeAnchorToContainer() prefers .dashboard; falls
      back to #bdl-root with a console warning if .dashboard
      is not found in the DOM (in case the selector is wrong).
   2. 4px red top border on .bdl-action-bar (CSS).
   3. 60px top + 60px bottom padding on .bdl-action-bar (CSS).
   Plus: #bdl-root.has-selection padding-bottom bumped from
   110px to 200px to accommodate the now-much-taller bar.

   ─── v1.1.3 changelog (polish patch on v1.1.2) ───
   Action bar geometry rebuilt:
   • Width now MIRRORS #bdl-root's bounding rect (the file list
     container) instead of spanning the full viewport. Computed
     at render time and on window resize via the new helper
     syncCascadeAnchorToContainer(). Action bar / cascade panel
     stay aligned with the file list above them.
   • Pinned to bottom: 0 (flush with viewport edge — no 16px gap).
   • Internal padding bumped to 20px top / 20px bottom on the
     action bar. Cascade footer bottom padding also bumped to
     20px for visual parity when expanded.
   • Border-radius collapsed to top corners only (10px 10px 0 0).
     border-bottom removed. box-shadow flipped from below-element
     to above-element (since the bar's bottom is the viewport edge).

   Cut 2 plan post-v1.1.3:
   • v1.1.4 — save wiring to Scenario K + window.InbxASF.open()
     for create path. Final Cut 2 ship.

   ─── v1.1.2 (Cut 2 ship 2 — tenant filter) ───
   1. Asset picker now filters to the current tenant's assets
      only. Cross-tenant assets in the Scenario I response are
      excluded from the dropdown list.
   2. SCHEMA CORRECTION (vs. transfer doc):
      The transfer doc described tenant filtering as "two-hop
      traversal: asset → title(s) → check title-admin". The
      actual schema (confirmed 2026-05-18) is ONE-HOP — every
      asset type has a direct TITLE-ADMIN reference:
        • Articles:           fieldData['associated-title']  (SRF → TITLE-ADMIN, single ID string)
                              fieldData['title']             (SRF → TITLE, single ID string — NOT used for tenant filtering)
        • Ads:                fieldData['titles']            (MRF → TITLE-ADMIN, array of IDs)
        • Events:             fieldData['titles']            (MRF → TITLE-ADMIN, array of IDs)
        • RE Listings:        fieldData['titles']            (MRF → TITLE-ADMIN, array of IDs)
      Filter logic accordingly: Articles use string equality,
      the other three use Array.includes(S.tenantId).
      No TITLES collection lookup required — Scenario I does
      not need to be extended.
   3. CSS-only: removed the max-width: 1100px cap on
      #bdl-cascade-anchor that v1.1.1 added unnecessarily. The
      action bar now extends to the full available width
      (left:24px / right:24px from the viewport).

   v1.1.3 (next, final Cut 2 ship) = save wiring to Scenario K
   + window.InbxASF.open() for the create path.

   ─── v1.1.1 (polish patch on v1.1.0) ───
   Two bugs found during v1.1.0 production verification:
   1. Selected rows did NOT visibly tint blue. Investigation:
      the .is-selected class IS applied correctly by the
      surgical row updater (console probe confirmed), but the
      .bdl-row.is-selected background rule is being overridden
      by a higher-specificity (or !important) rule from another
      stylesheet in the cascade. CSS-only fix: !important +
      bumped tint opacity + crisp blue left-edge indicator so
      selection is visible regardless of what overrides exist.
   2. Action bar was position:sticky, which bottoms out at the
      Inputs panel edge, not at the viewport bottom. Operator
      had to scroll to see it. CSS-only fix: position:fixed +
      conditional has-selection padding on #bdl-root so the
      last file row isn't hidden under the action bar.

   JS change in v1.1.1: ONE line in renderCascadeAnchor() — toggles
   the `has-selection` class on #bdl-root so v1.1.1.css can apply
   conditional bottom padding only when an action bar is visible.
   All other behavior is identical to v1.1.0.

   v1.1.2 (next ship) = tenant filter + asset picker per Cut 2 plan.
   v1.1.3 (final)     = save wiring.

   ─── v1.1.0 (Cut 2 ship 1 — Option B action bar) ───
   1. File checkboxes on bundle rows AND loose rows. Multi-select
      across both. State tracked in S.selectedIds (Set).
   2. Bottom action bar appears when ≥1 file is checked. Sticks
      to the bottom of the Inputs panel via position:sticky.
      Two primary buttons:
        • Attach to existing  → opens cascade in 'attach' mode
        • Create new          → opens cascade in 'create' mode
      Plus a Clear link to clear all selections.
      Group-as-Bundle is OUT of this ship (deferred — no write
      actions in v1.1.0 beyond the cascade shell).
   3. Inline 2-step cascade (NOT a modal). Option B layout
      decision 2026-05-18: mode is pre-set from the action bar,
      so the cascade runs:
        Step 1  Asset Type (Article / Ad / Event / RE Listing)
        Step 2  Picker (attach mode) OR Info pane (create mode)
      Cascade header has a "Switch to X" affordance to flip the
      mode in place. Switching keeps Step 1 (type stays relevant
      for both flows), wipes Step 2 (asset choice is irrelevant
      in create mode).
   4. Banner removed entirely. Replaced with a single refresh
      icon button inline-right with the FIRST section label
      (Bundles section if present, else Loose Files). Bundle
      count, loose count, and freshness time are gone — the
      operator scans the surface for what they need.
   5. Drop 30s staleness auto-refetch on visibilitychange.
      Refetch only on:
        • First panel activation (data not yet loaded)
        • Operator clicks the refresh icon
      Manual refresh only.
   6. Save button stubbed: console.log of the would-be Scenario K
      payload, plus a transient banner. No fetch to Scenario K
      yet. Save wiring lands in v1.1.2.
   7. Uses ix-form-controls-v1.0.0 primitives:
        • ix-chip + ix-chip--changed   (Step 1 Asset Type)
        • ix-picker + ix-picker-input + ix-picker-input--changed
          + ix-picker-list + ix-picker-option (Step 2 attach)
        • ix-revert                    (per-step Change + footer
          Cancel + cascade header mode-switch)
      Plus ix-buttons:
        • ix-btn--secondary            (Attach to existing)
        • ix-btn--primary              (Create new)
        • ix-btn--primary + --gold     (cascade Save)
        • ix-btn--ghost + --icon       (refresh icon)
   8. Tenant filtering of bundle list unchanged from v1.0.1
      (filter by title-admin === TA_CONFIG.titleAdminId via
      buildAssetLookup → renders only tenant MEDIA).
      Picker asset filtering NOT implemented in v1.1.0 — picker
      shows ALL assets from Scenario I response. Two-hop tenant
      traversal for picker lands in v1.1.1.

   ─── Hardcoding inventory ───
   HC-NEW · SCENARIO_I_FALLBACK — Scenario I webhook URL
     fallback (WLN-pinned). Carried forward from v1.0.0/v1.0.1.
     Removed when TA_CONFIG.makeBundles ships in the Webflow
     template. No new tenant-specific hardcoding introduced
     in v1.1.0.

   ─── Page load order on T-A page ───
     1. ta-studio-v1.4.0.js              (creates Inputs panel)
     2. ta-bundles-v1.1.4.js             (this file)
     3. ta-bundles-v1.1.4.css            (paired — full replacement
                                          of v1.1.3.css; remove the
                                          old <link>)
     4. ix-form-controls-v1.0.0.css      (chips/picker/revert)
     5. ix-buttons-v1.0.4.css            (action bar buttons)

   ──────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var FILE_VERSION = '1.1.4';
  var DEBUG        = false;

  // ─── Scenario I config (unchanged from v1.0.1) ───
  var SCENARIO_I_FALLBACK = 'https://hook.us1.make.com/fkqas4u7bptpo7a3up1knqur8i9xtfwj';

  function _cfg() {
    return (typeof window !== 'undefined' && window.TA_CONFIG) ? window.TA_CONFIG : {};
  }

  function _scenarioIUrl() {
    var cfg = _cfg();
    if (cfg.makeBundles && typeof cfg.makeBundles === 'string') return cfg.makeBundles;
    if (DEBUG) console.warn('[InbxBundles] TA_CONFIG.makeBundles missing — using hardcoded fallback (HC-NEW)');
    return SCENARIO_I_FALLBACK;
  }

  // ─── Constants (multi-tenant safe — universal labels/slugs) ───
  // Asset type chip val → Scenario I response key
  var TYPE_TO_ASSETS_KEY = {
    article: 'articles',
    ad:      'ads',
    event:   'events',
    re:      'reListings'
  };
  // Asset type chip val → human-readable label
  var TYPE_LABELS = {
    article: 'Article',
    ad:      'Ad',
    event:   'Event',
    re:      'RE Listing'
  };

  // ─── State ───
  var S = {
    loading:       false,
    error:         null,
    data:          null,
    tenantId:      null,
    lastFetchAt:   0,
    expanded:      {},
    mounted:       false,
    // ── New in v1.1.0 ──
    selectedIds:   {},    // medaItemId → true (Set-like; using object for IE compat)
    cascade:       null   // null when collapsed
                          // when open: { mode, type, assetId, assetName }
                          //   mode:      'attach' | 'create'
                          //   type:      'article' | 'ad' | 'event' | 're' | null
                          //   assetId:   string | null   (attach only)
                          //   assetName: string | null   (attach only — display text)
  };

  // ─── Lifecycle ───

  function init() {
    installMount();
    watchPanelActivation();
    // v1.1.3: keep cascade anchor aligned to #bdl-root on viewport resize
    window.addEventListener('resize', syncCascadeAnchorToContainer);
    // v1.0.1 had watchVisibility() with 30s staleness refetch — removed in v1.1.0.
    if (DEBUG) console.log('[InbxBundles] v' + FILE_VERSION + ' ready');
  }

  function installMount() {
    var panel = document.querySelector('[data-std-panel-body="input"]');
    if (!panel) {
      if (!S._installAttempts) S._installAttempts = 0;
      S._installAttempts++;
      if (S._installAttempts < 40) {
        setTimeout(installMount, 250);
      } else {
        console.warn('[InbxBundles] Studio Inputs panel not found after 10s — cannot mount');
      }
      return;
    }
    if (panel.querySelector('#bdl-root')) {
      S.mounted = true;
      return;
    }
    var root = document.createElement('div');
    root.id = 'bdl-root';
    panel.appendChild(root);
    S.mounted = true;

    if (panel.classList.contains('active')) {
      fetchAndRender();
    }
  }

  function watchPanelActivation() {
    var panel = document.querySelector('[data-std-panel-body="input"]');
    if (!panel) {
      setTimeout(watchPanelActivation, 300);
      return;
    }
    var wasActive = panel.classList.contains('active');
    var obs = new MutationObserver(function () {
      var isActive = panel.classList.contains('active');
      if (isActive && !wasActive) onPanelActivated();
      wasActive = isActive;
    });
    obs.observe(panel, { attributes: true, attributeFilter: ['class'] });
  }

  function onPanelActivated() {
    if (!S.mounted) installMount();
    // v1.0.1 had staleness check (>30s → refetch). Removed in v1.1.0 —
    // refetch only on first activation (no data yet) or explicit click.
    if (!S.data) {
      fetchAndRender();
    } else {
      render();
    }
  }

  // ─── Fetch (unchanged from v1.0.1) ───

  function fetchAndRender() {
    if (S.loading) return;
    var cfg = _cfg();
    var titleSlug = cfg.titleSlug;
    if (!titleSlug) {
      S.error   = 'TA_CONFIG.titleSlug missing — cannot identify tenant';
      S.loading = false;
      render();
      return;
    }
    S.loading = true;
    S.error   = null;
    render();

    fetch(_scenarioIUrl(), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ titleSlug: titleSlug })
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Scenario I returned ' + res.status);
      return res.json();
    })
    .then(function (data) {
      if (!data || data.ok !== true) {
        throw new Error('Scenario I response missing ok=true');
      }
      S.data        = data;
      S.tenantId    = (data.tenant && data.tenant.titleAdminId) || null;
      S.lastFetchAt = Date.now();
      S.loading     = false;
      S.error       = null;
      // Stale selections after a refresh: prune IDs no longer present in data.
      // This keeps the cascade from referring to MEDIA that vanished server-side.
      pruneStaleSelections();
      render();
    })
    .catch(function (err) {
      console.error('[InbxBundles] fetch error:', err);
      S.loading = false;
      S.error   = err.message || 'Network error';
      render();
    });
  }

  // ─── Data processing (unchanged from v1.0.1) ───

  function mergeMedia(data) {
    var a = (data && Array.isArray(data.media))      ? data.media      : [];
    var b = (data && Array.isArray(data.mediaExtra)) ? data.mediaExtra : [];
    return a.concat(b);
  }

  function filterByTenant(items, tenantId) {
    if (!tenantId) return items;
    return items.filter(function (item) {
      var fd = item && item.fieldData;
      return fd && fd['title-admin'] === tenantId;
    });
  }

  function groupByBundle(items) {
    var groups = {};
    var order  = [];
    items.forEach(function (m) {
      var fd = m.fieldData || {};
      var bid = fd['bundle-id'];
      if (!bid) return;
      if (!groups[bid]) {
        groups[bid] = { id: bid, label: fd['bundle-label'] || bid, items: [] };
        order.push(bid);
      }
      groups[bid].items.push(m);
    });
    return order.map(function (id) { return groups[id]; });
  }

  function findLoose(items) {
    return items.filter(function (m) {
      var fd = m.fieldData || {};
      return !fd['bundle-id'];
    });
  }

  function buildAssetLookup(data) {
    function indexBy(arr) {
      var idx = {};
      if (!Array.isArray(arr)) return idx;
      arr.forEach(function (rec) { if (rec && rec.id) idx[rec.id] = rec; });
      return idx;
    }
    return {
      articles:   indexBy(data.articles),
      ads:        indexBy(data.ads),
      events:     indexBy(data.events),
      reListings: indexBy(data.reListings)
    };
  }

  function assetDisplayName(rec) {
    if (!rec) return null;
    var fd = rec.fieldData || {};
    return fd.name || fd.slug || rec.id;
  }

  // For picker meta line — best-effort, non-fatal if missing.
  function assetMetaLine(rec) {
    if (!rec) return '';
    var fd = rec.fieldData || {};
    return fd['issue-label'] || fd['publish-date'] || fd.slug || '';
  }

  function getMediaAssetRefs(mediaItem, lookup) {
    var fd = mediaItem.fieldData || {};
    var refs = [];
    var seen = {};

    function push(type, id, registry) {
      if (!id) return;
      var key = type + ':' + id;
      if (seen[key]) return;
      seen[key] = true;
      var rec = registry[id];
      refs.push({ type: type, id: id, name: assetDisplayName(rec) || id });
    }

    if (fd.article) push('article', fd.article, lookup.articles);
    Object.keys(lookup.articles).forEach(function (aid) {
      var art = lookup.articles[aid];
      var mi = art.fieldData && art.fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) push('article', aid, lookup.articles);
    });

    if (Array.isArray(fd.ads)) {
      fd.ads.forEach(function (id) { push('ad', id, lookup.ads); });
    }
    Object.keys(lookup.ads).forEach(function (aid) {
      var ad = lookup.ads[aid];
      var mi = ad.fieldData && ad.fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) push('ad', aid, lookup.ads);
    });

    if (Array.isArray(fd.events)) {
      fd.events.forEach(function (id) { push('event', id, lookup.events); });
    }
    Object.keys(lookup.events).forEach(function (eid) {
      var ev = lookup.events[eid];
      var mi = ev.fieldData && ev.fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) push('event', eid, lookup.events);
    });

    var reField = fd['re-listing'];
    if (Array.isArray(reField)) {
      reField.forEach(function (id) { push('re', id, lookup.reListings); });
    } else if (typeof reField === 'string' && reField) {
      push('re', reField, lookup.reListings);
    }
    Object.keys(lookup.reListings).forEach(function (rid) {
      var re = lookup.reListings[rid];
      var mi = re.fieldData && re.fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) push('re', rid, lookup.reListings);
    });

    return refs;
  }

  function computeBundleStatus(items, lookup) {
    if (!items || !items.length) return 'pending';
    var assignedCount = 0;
    for (var i = 0; i < items.length; i++) {
      var refs = getMediaAssetRefs(items[i], lookup);
      if (refs.length > 0) assignedCount++;
    }
    if (assignedCount === 0)            return 'pending';
    if (assignedCount === items.length) return 'fully_assigned';
    return 'partial';
  }

  // ─── Selection helpers (v1.1.0) ───

  function isFileSelected(mediaId) {
    return S.selectedIds[mediaId] === true;
  }

  function selectedCount() {
    return Object.keys(S.selectedIds).length;
  }

  function selectedIdsArray() {
    return Object.keys(S.selectedIds);
  }

  function toggleFileSelection(mediaId) {
    if (S.selectedIds[mediaId]) {
      delete S.selectedIds[mediaId];
    } else {
      S.selectedIds[mediaId] = true;
    }
    // If we just dropped to 0, also close the cascade.
    if (selectedCount() === 0 && S.cascade) {
      S.cascade = null;
    }
    renderCascadeAnchor();
    // Also need to update the row's is-selected class. Cheapest is a
    // surgical row update; doing a full render works but feels heavy.
    var row = document.querySelector('[data-bdl-row-mid="' + cssEscape(mediaId) + '"]');
    if (row) row.classList.toggle('is-selected', isFileSelected(mediaId));
  }

  function clearAllSelections() {
    S.selectedIds = {};
    S.cascade = null;
    render();
  }

  function pruneStaleSelections() {
    if (selectedCount() === 0) return;
    var allMedia = mergeMedia(S.data);
    var present = {};
    allMedia.forEach(function (m) { present[m.id] = true; });
    Object.keys(S.selectedIds).forEach(function (id) {
      if (!present[id]) delete S.selectedIds[id];
    });
    if (selectedCount() === 0 && S.cascade) S.cascade = null;
  }

  // ─── Cascade controllers (v1.1.0) ───

  function openCascade(mode) {
    if (selectedCount() === 0) return;
    S.cascade = { mode: mode, type: null, assetId: null, assetName: null };
    renderCascadeAnchor();
  }

  function closeCascade() {
    // Cancel = collapse cascade, keep selections (operator can retry).
    S.cascade = null;
    renderCascadeAnchor();
  }

  function switchCascadeMode(newMode) {
    if (!S.cascade) return;
    if (S.cascade.mode === newMode) return;
    S.cascade.mode = newMode;
    // Switching modes wipes the asset choice (irrelevant in create mode).
    // Step 1 (type) persists — same asset type works for both flows.
    S.cascade.assetId = null;
    S.cascade.assetName = null;
    renderCascadeAnchor();
  }

  function selectStep1Type(type) {
    if (!S.cascade) return;
    if (!TYPE_TO_ASSETS_KEY[type]) return;
    // Changing type wipes Step 2 (existing pick is irrelevant for the new type).
    if (S.cascade.type !== type) {
      S.cascade.assetId = null;
      S.cascade.assetName = null;
    }
    S.cascade.type = type;
    renderCascadeAnchor();
  }

  function selectStep2Asset(assetId, assetName) {
    if (!S.cascade) return;
    S.cascade.assetId = assetId;
    S.cascade.assetName = assetName;
    renderCascadeAnchor();
  }

  function revertCascadeStep(n) {
    if (!S.cascade) return;
    if (n === 1) {
      S.cascade.type = null;
      S.cascade.assetId = null;
      S.cascade.assetName = null;
    } else if (n === 2) {
      S.cascade.assetId = null;
      S.cascade.assetName = null;
    }
    renderCascadeAnchor();
  }

  // STUB — Save wiring lands in v1.1.2. v1.1.0 just logs the payload.
  function saveCascadeStub() {
    if (!S.cascade) return;
    var c = S.cascade;
    var payload;
    if (c.mode === 'attach') {
      payload = {
        webhook:     '(future) Scenario K — mode=attach',
        mode:        'attach',
        assetType:   c.type,
        assetId:     c.assetId,
        mediaIds:    selectedIdsArray(),
        tenantId:    S.tenantId,
        titleSlug:   (_cfg().titleSlug || null)
      };
    } else {
      payload = {
        action:       '(future) window.InbxASF.open(...)',
        mode:         'create',
        assetType:    c.type,
        prefilledMediaIds: selectedIdsArray(),
        tenantId:     S.tenantId,
        titleSlug:    (_cfg().titleSlug || null)
      };
    }
    console.log('[InbxBundles v' + FILE_VERSION + '] (stub) save payload:', payload);
    // Brief visual confirmation. v1.1.2 will replace with a real toast +
    // ASF open / Scenario K call.
    var foot = document.querySelector('[data-bdl-cascade-status]');
    if (foot) {
      foot.textContent = 'Logged payload to console. Save wiring lands in v1.1.2.';
      foot.classList.add('is-stub-confirmed');
      setTimeout(function () { foot.classList.remove('is-stub-confirmed'); }, 2500);
    }
  }

  // ─── Picker helpers (v1.1.0) ───

  // v1.1.2: One-hop tenant filter on assets.
  //
  // Articles use SRF associated-title (string ID) directly to TITLE-ADMIN.
  // Ads/Events/RE Listings use MRF titles (array of TITLE-ADMIN IDs).
  // For Articles: rec.fieldData['associated-title'] === S.tenantId
  // For others:   rec.fieldData['titles'] includes S.tenantId
  //
  // If S.tenantId is null (no tenant context yet), return all assets
  // unfiltered as a defensive fallback.
  function assetBelongsToTenant(rec, type, tenantId) {
    if (!tenantId) return true;
    var fd = rec && rec.fieldData;
    if (!fd) return false;
    if (type === 'article') {
      return fd['associated-title'] === tenantId;
    }
    // ad / event / re
    var titles = fd['titles'];
    return Array.isArray(titles) && titles.indexOf(tenantId) !== -1;
  }

  function getAssetsForType(type) {
    if (!S.data) return [];
    var key = TYPE_TO_ASSETS_KEY[type];
    if (!key) return [];
    var arr = S.data[key];
    if (!Array.isArray(arr)) return [];
    var tid = S.tenantId;
    return arr
      .filter(function (rec) { return assetBelongsToTenant(rec, type, tid); })
      .map(function (rec) {
        return {
          id:   rec.id,
          name: assetDisplayName(rec),
          meta: assetMetaLine(rec)
        };
      });
  }

  function filterAssets(assets, query) {
    if (!query) return assets;
    var q = String(query).toLowerCase();
    return assets.filter(function (a) {
      return (a.name || '').toLowerCase().indexOf(q) !== -1;
    });
  }

  // Surgical update — called on every keystroke in the picker input.
  // Avoids re-rendering the whole cascade (which would lose input focus).
  function renderPickerListSurgically(query) {
    if (!S.cascade || S.cascade.mode !== 'attach' || !S.cascade.type) return;
    var listEl = document.querySelector('[data-bdl-picker-list]');
    if (!listEl) return;
    var assets = filterAssets(getAssetsForType(S.cascade.type), query);
    if (!assets.length) {
      listEl.innerHTML =
        '<div class="bdl-picker-empty">No matches for "' + escHtml(query || '') + '"</div>';
    } else {
      listEl.innerHTML = assets.map(renderPickerOption).join('');
    }
    listEl.hidden = false;
  }

  function renderPickerOption(asset) {
    var meta = asset.meta
      ? '<span class="ix-picker-option-meta">' + escHtml(asset.meta) + '</span>'
      : '';
    return (
      '<button class="ix-picker-option"' +
        ' data-bdl-pick-asset' +
        ' data-asset-id="'   + escAttr(asset.id)   + '"' +
        ' data-asset-name="' + escAttr(asset.name || '') + '">' +
        escHtml(asset.name || asset.id) +
        meta +
      '</button>'
    );
  }

  // ─── Rendering ───

  function render() {
    var host = document.getElementById('bdl-root');
    if (!host) return;

    if (S.loading && !S.data) { host.innerHTML = renderLoading(); return; }
    if (S.error && !S.data)   { host.innerHTML = renderError(S.error); return; }
    if (!S.data)              { host.innerHTML = renderEmpty();      return; }

    var allMedia = mergeMedia(S.data);
    var myMedia  = filterByTenant(allMedia, S.tenantId);
    var bundles  = groupByBundle(myMedia);
    var loose    = findLoose(myMedia);
    var lookup   = buildAssetLookup(S.data);

    var hasBundles = bundles.length > 0;
    var hasLoose   = loose.length > 0;

    var bundlesHtml = hasBundles
      ? bundles.map(function (b) { return renderBundleCard(b, lookup); }).join('')
      : '<div class="bdl-empty-section">No bundles yet. New bundles arrive when the publisher uploads to a sub-folder in Drive.</div>';

    var looseHtml = hasLoose
      ? renderLooseTray(loose, lookup)
      : '';

    var sections = [];
    if (hasBundles || !hasLoose) {
      // Always show the Bundles section header, even when empty, unless there
      // are no bundles AND there are loose files (in which case Loose becomes
      // the first/only section and gets the refresh icon).
      sections.push(
        '<div class="bdl-section">' +
          renderSectionLabelRow('Bundles', /* withRefresh */ true) +
          '<div class="bdl-bundles">' + bundlesHtml + '</div>' +
        '</div>'
      );
    }
    if (hasLoose) {
      // If Bundles section is hidden, Loose gets the refresh icon (first label).
      var looseGetsRefresh = !(hasBundles || !hasLoose);
      sections.push(
        '<div class="bdl-section">' +
          renderSectionLabelRow('Loose Files', looseGetsRefresh) +
          looseHtml +
        '</div>'
      );
    }

    host.innerHTML =
      '<div class="bdl-root-wrap">' +
        sections.join('') +
        '<div id="bdl-cascade-anchor"></div>' +
      '</div>';

    renderCascadeAnchor();
  }

  function renderSectionLabelRow(label, withRefresh) {
    var refreshBtn = withRefresh
      ? ('<button class="bdl-refresh-icon ix-btn ix-btn--ghost ix-btn--icon' +
           (S.loading ? ' is-spinning' : '') + '"' +
         ' data-bdl-refresh' +
         (S.loading ? ' disabled' : '') +
         ' title="Refresh bundles"' +
         ' aria-label="Refresh bundles">↻</button>')
      : '';
    return (
      '<div class="bdl-section-label-row">' +
        '<span class="bdl-section-label">' + escHtml(label) + '</span>' +
        refreshBtn +
      '</div>'
    );
  }

  function renderBundleCard(bundle, lookup) {
    var status      = computeBundleStatus(bundle.items, lookup);
    var statusLabel = (status === 'pending') ? 'Awaiting assignment'
                    : (status === 'partial') ? 'Partially assigned'
                    : 'Fully assigned';
    var isExpanded  = !!S.expanded[bundle.id];
    var caret       = isExpanded ? '▾' : '▸';
    var rowsHtml    = isExpanded
      ? bundle.items.map(function (m) { return renderFileRow(m, lookup); }).join('')
      : '';

    return (
      '<div class="bdl-card bdl-card--status-' + status + (isExpanded ? ' is-expanded' : '') + '"' +
        ' data-bdl-bundle-id="' + escAttr(bundle.id) + '">' +
        '<div class="bdl-card-header" data-bdl-toggle="' + escAttr(bundle.id) + '">' +
          '<span class="bdl-caret">' + caret + '</span>' +
          '<span class="bdl-card-label">' + escHtml(bundle.label) + '</span>' +
          '<span class="bdl-card-count">' + bundle.items.length + ' ' +
            (bundle.items.length === 1 ? 'file' : 'files') +
          '</span>' +
          '<span class="bdl-pill bdl-pill--' + status + '">' + escHtml(statusLabel) + '</span>' +
        '</div>' +
        (isExpanded ? '<div class="bdl-card-body">' + rowsHtml + '</div>' : '') +
      '</div>'
    );
  }

  function renderFileRow(mediaItem, lookup) {
    var fd       = mediaItem.fieldData || {};
    var filename = fd['original-filename'] || fd.name || mediaItem.id;
    var mime     = fd['mime-type'] || '';
    var size     = fd.size;
    var refs     = getMediaAssetRefs(mediaItem, lookup);
    var selected = isFileSelected(mediaItem.id);

    var sizeHtml = (size != null)
      ? '<span class="bdl-row-size">' + escHtml(formatBytes(size)) + '</span>'
      : '';

    var refsHtml;
    if (refs.length === 0) {
      refsHtml = '<span class="bdl-pill bdl-pill--awaiting">Awaiting Create</span>';
    } else if (refs.length === 1) {
      refsHtml = '<span class="bdl-row-target">→ ' + escHtml(refs[0].name) + '</span>';
    } else {
      var first  = refs[0];
      var titles = refs.map(function (r) { return r.name; }).join('\n');
      refsHtml = '<span class="bdl-row-target" title="' + escAttr(titles) + '">' +
        '→ ' + escHtml(first.name) +
        ' <span class="bdl-row-target-more">+' + (refs.length - 1) + ' more</span>' +
      '</span>';
    }

    return (
      '<div class="bdl-row' + (selected ? ' is-selected' : '') + '"' +
           ' data-bdl-row-mid="' + escAttr(mediaItem.id) + '">' +
        '<input type="checkbox" class="bdl-row-check"' +
          ' data-bdl-check-mid="' + escAttr(mediaItem.id) + '"' +
          (selected ? ' checked' : '') +
          ' aria-label="Select ' + escAttr(filename) + '">' +
        '<span class="bdl-row-mime" title="' + escAttr(mime) + '">' + mimeIcon(mime) + '</span>' +
        '<span class="bdl-row-filename" title="' + escAttr(filename) + '">' + escHtml(filename) + '</span>' +
        sizeHtml +
        refsHtml +
      '</div>'
    );
  }

  function renderLooseTray(loose, lookup) {
    return '<div class="bdl-loose">' +
      loose.map(function (m) { return renderFileRow(m, lookup); }).join('') +
    '</div>';
  }

  function renderLoading() {
    return '<div class="bdl-root-wrap"><div class="bdl-state bdl-state--loading">Loading bundles…</div></div>';
  }

  function renderError(msg) {
    return '<div class="bdl-root-wrap">' +
      '<div class="bdl-state bdl-state--error">' +
        '<div class="bdl-state-title">Could not load bundles</div>' +
        '<div class="bdl-state-msg">' + escHtml(msg) + '</div>' +
        '<button class="ix-btn ix-btn--ghost" data-bdl-refresh>Retry</button>' +
      '</div>' +
    '</div>';
  }

  function renderEmpty() {
    return '<div class="bdl-root-wrap">' +
      '<div class="bdl-state bdl-state--empty">' +
        '<div class="bdl-state-title">No data yet</div>' +
        '<div class="bdl-state-msg">Bundles load when you switch to this tab.</div>' +
      '</div>' +
    '</div>';
  }

  // ─── Cascade-anchor rendering (action bar + panel) ───

  function renderCascadeAnchor() {
    var anchor = document.getElementById('bdl-cascade-anchor');
    var root   = document.getElementById('bdl-root');
    if (!anchor) return;
    if (selectedCount() === 0) {
      anchor.innerHTML = '';
      anchor.classList.remove('is-active');
      // v1.1.1: drop has-selection on root so its bottom padding collapses
      if (root) root.classList.remove('has-selection');
      // v1.1.3: clear inline width/left so an empty anchor doesn't carry stale dims
      anchor.style.left = '';
      anchor.style.width = '';
      return;
    }
    anchor.classList.add('is-active');
    // v1.1.1: add has-selection on root so v1.1.1.css adds bottom padding
    // for the fixed-position action bar (last row stays scrollable above it)
    if (root) root.classList.add('has-selection');
    if (!S.cascade) {
      anchor.innerHTML = renderActionBar();
    } else {
      anchor.innerHTML = renderCascadePanel();
    }
    // v1.1.3: align action bar / cascade panel width to #bdl-root container
    syncCascadeAnchorToContainer();
  }

  // v1.1.4: Target the .dashboard div (the outer page container) so the
  // action bar / cascade panel width matches it. Falls back to #bdl-root if
  // .dashboard isn't found, logging a one-time warning so the wrong selector
  // is caught immediately.
  function syncCascadeAnchorToContainer() {
    var anchor = document.getElementById('bdl-cascade-anchor');
    if (!anchor) return;
    var container = document.querySelector('.dashboard');
    if (!container) {
      if (!S._dashboardWarned) {
        S._dashboardWarned = true;
        console.warn('[InbxBundles v' + FILE_VERSION + '] .dashboard selector not found in DOM — falling back to #bdl-root. Confirm the correct selector with Jeff.');
      }
      container = document.getElementById('bdl-root');
    }
    if (!container) return;
    var rect = container.getBoundingClientRect();
    // Defensive: don't apply zero dims if container is currently hidden
    if (rect.width === 0) return;
    anchor.style.left  = rect.left + 'px';
    anchor.style.width = rect.width + 'px';
  }

  function renderActionBar() {
    var n = selectedCount();
    return (
      '<div class="bdl-action-bar">' +
        '<div class="bdl-action-bar-count">' +
          '<strong>' + n + '</strong> file' + (n === 1 ? '' : 's') + ' selected' +
        '</div>' +
        '<button class="ix-revert" data-bdl-clear-selection>Clear</button>' +
        '<div class="bdl-action-bar-spacer"></div>' +
        '<button class="ix-btn ix-btn--secondary" data-bdl-open-cascade="attach">' +
          'Attach to existing' +
        '</button>' +
        '<button class="ix-btn ix-btn--primary" data-bdl-open-cascade="create">' +
          'Create new' +
        '</button>' +
      '</div>'
    );
  }

  function renderCascadePanel() {
    var c = S.cascade;
    return (
      '<div class="bdl-cascade bdl-cascade--' + c.mode + '">' +
        renderCascadeHeader(c) +
        '<div class="bdl-cascade-body">' +
          renderCascadeStep1(c) +
          renderCascadeStep2(c) +
        '</div>' +
        renderCascadeFooter(c) +
      '</div>'
    );
  }

  function renderCascadeHeader(c) {
    var modeLabel  = c.mode === 'attach' ? '📎 Attach mode' : '✨ Create mode';
    var switchTo   = c.mode === 'attach' ? 'create' : 'attach';
    var switchText = c.mode === 'attach' ? 'Switch to Create new' : 'Switch to Attach';
    var n = selectedCount();
    var summary    = '<strong>' + n + '</strong> file' + (n === 1 ? '' : 's') +
                     ' → ' + (c.mode === 'attach' ? 'existing asset' : 'new asset');
    return (
      '<div class="bdl-cascade-header">' +
        '<span class="bdl-cascade-mode-tag bdl-cascade-mode-tag--' + c.mode + '">' +
          modeLabel +
        '</span>' +
        '<span class="bdl-cascade-count">' + summary + '</span>' +
        '<button class="ix-revert" data-bdl-switch-mode="' + switchTo + '">' +
          escHtml(switchText) +
        '</button>' +
      '</div>'
    );
  }

  function renderCascadeStep1(c) {
    var typeOptions = ['article', 'ad', 'event', 're'];
    var isSet       = !!c.type;
    var isActive    = !isSet;

    var chipsHtml = typeOptions.map(function (t) {
      var cls = 'ix-chip' + (c.type === t ? ' ix-chip--changed' : '');
      return '<button class="' + cls + '" data-bdl-step1-type="' + t + '">' +
        escHtml(TYPE_LABELS[t]) + '</button>';
    }).join('');

    var revertBtn = isSet
      ? '<button class="ix-revert" data-bdl-revert="1">Change</button>'
      : '';

    var stepCls = 'bdl-cstep' +
      (isActive ? ' is-active' : '') +
      (isSet ? ' is-set' : '');

    return (
      '<div class="' + stepCls + '">' +
        '<div class="bdl-cstep-head">' +
          '<span class="bdl-cstep-num">1</span>' +
          '<span class="bdl-cstep-label">Asset Type</span>' +
          revertBtn +
        '</div>' +
        '<div class="ix-chip-group">' + chipsHtml + '</div>' +
      '</div>'
    );
  }

  function renderCascadeStep2(c) {
    if (!c.type) {
      // Inactive — Step 1 not yet set.
      return (
        '<div class="bdl-cstep bdl-cstep--inactive">' +
          '<div class="bdl-cstep-head">' +
            '<span class="bdl-cstep-num bdl-cstep-num--pending">2</span>' +
            '<span class="bdl-cstep-label bdl-cstep-label--muted">' +
              (c.mode === 'attach' ? 'Pick the existing asset' : 'Confirm — opens the Asset Form') +
            '</span>' +
          '</div>' +
        '</div>'
      );
    }
    return c.mode === 'attach' ? renderCascadeStep2Attach(c) : renderCascadeStep2Create(c);
  }

  function renderCascadeStep2Attach(c) {
    var typeLabel = TYPE_LABELS[c.type] || c.type;
    var inputCls  = 'ix-picker-input' + (c.assetId ? ' ix-picker-input--changed' : '');
    var revertBtn = c.assetId
      ? '<button class="ix-revert" data-bdl-revert="2">Change</button>'
      : '';
    return (
      '<div class="bdl-cstep is-active' + (c.assetId ? ' is-set' : '') + '">' +
        '<div class="bdl-cstep-head">' +
          '<span class="bdl-cstep-num">2</span>' +
          '<span class="bdl-cstep-label">Pick the existing ' + escHtml(typeLabel) + '</span>' +
          revertBtn +
        '</div>' +
        '<div class="ix-picker" data-bdl-picker>' +
          '<input type="text" class="' + inputCls + '"' +
            ' value="' + escAttr(c.assetName || '') + '"' +
            ' placeholder="Search ' + escAttr(typeLabel.toLowerCase()) + 's by name…"' +
            ' autocomplete="off"' +
            ' data-bdl-picker-input>' +
          '<div class="ix-picker-list" hidden data-bdl-picker-list></div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderCascadeStep2Create(c) {
    var typeLabel = TYPE_LABELS[c.type] || c.type;
    var n = selectedCount();
    return (
      '<div class="bdl-cstep is-active is-set">' +
        '<div class="bdl-cstep-head">' +
          '<span class="bdl-cstep-num">2</span>' +
          '<span class="bdl-cstep-label">Confirm — opens the Asset Form</span>' +
        '</div>' +
        '<div class="bdl-create-info">' +
          'On <strong>Save</strong>, you\u2019ll be taken to the ' +
          '<strong>Asset Submission Form</strong> with the ' + n + ' selected ' +
          'file' + (n === 1 ? '' : 's') + ' pre-attached. Fill in name, summary, ' +
          'and other fields there \u2014 the form handles publishing.' +
        '</div>' +
      '</div>'
    );
  }

  function renderCascadeFooter(c) {
    var n = selectedCount();
    var saveDisabled, saveLabel, statusText;
    if (c.mode === 'attach') {
      saveDisabled = !(c.type && c.assetId);
      saveLabel    = 'Save';
      statusText   = saveDisabled
        ? (c.type
            ? 'Pick an existing ' + (TYPE_LABELS[c.type] || c.type) + ' to enable Save'
            : 'Choose an Asset Type, then pick an existing asset')
        : 'Ready \u2014 will attach ' + n + ' file' + (n === 1 ? '' : 's') +
          ' to \u201C' + escHtml(c.assetName || '?') + '\u201D';
    } else {
      saveDisabled = !c.type;
      saveLabel    = 'Continue to Asset Form \u2192';
      statusText   = saveDisabled
        ? 'Choose an Asset Type to continue'
        : 'Ready \u2014 will open ' + (TYPE_LABELS[c.type] || c.type) + ' submission form';
    }
    return (
      '<div class="bdl-cascade-footer">' +
        '<div class="bdl-cascade-footer-left">' +
          '<button class="ix-revert" data-bdl-cascade-cancel>Cancel</button>' +
          '<span class="bdl-cascade-status" data-bdl-cascade-status>' +
            statusText +
          '</span>' +
        '</div>' +
        '<button class="ix-btn ix-btn--primary ix-btn--gold"' +
          ' data-bdl-cascade-save' +
          (saveDisabled ? ' disabled' : '') + '>' +
          saveLabel +
        '</button>' +
      '</div>'
    );
  }

  // ─── Click + input delegation ───

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    // ── Refresh button (banner removed, lives inline with first section label
    //    and on error states) ──
    if (t.closest('[data-bdl-refresh]')) {
      e.preventDefault();
      e.stopPropagation();
      fetchAndRender();
      return;
    }

    // ── File checkbox ──
    // We intercept the click BEFORE the native checked state flips so we can
    // unify the state via toggleFileSelection. The checkbox's own
    // `checked` attribute is updated by toggleFileSelection's surgical refresh.
    var check = t.closest('[data-bdl-check-mid]');
    if (check) {
      e.stopPropagation();   // don't bubble up to bundle-header toggle
      var mid = check.getAttribute('data-bdl-check-mid');
      // Defer to next tick so the browser's own checkbox-toggle isn't fought
      setTimeout(function () { toggleFileSelection(mid); }, 0);
      return;
    }

    // ── Action bar: Clear ──
    if (t.closest('[data-bdl-clear-selection]')) {
      e.preventDefault();
      clearAllSelections();
      return;
    }

    // ── Action bar: open cascade (attach OR create) ──
    var openBtn = t.closest('[data-bdl-open-cascade]');
    if (openBtn) {
      e.preventDefault();
      var mode = openBtn.getAttribute('data-bdl-open-cascade');
      openCascade(mode);
      return;
    }

    // ── Cascade: switch mode (header link) ──
    var switchBtn = t.closest('[data-bdl-switch-mode]');
    if (switchBtn) {
      e.preventDefault();
      switchCascadeMode(switchBtn.getAttribute('data-bdl-switch-mode'));
      return;
    }

    // ── Cascade Step 1: pick type ──
    var typeBtn = t.closest('[data-bdl-step1-type]');
    if (typeBtn) {
      e.preventDefault();
      selectStep1Type(typeBtn.getAttribute('data-bdl-step1-type'));
      return;
    }

    // ── Cascade Step 2 (attach): pick an asset from the picker list ──
    var pickBtn = t.closest('[data-bdl-pick-asset]');
    if (pickBtn) {
      e.preventDefault();
      var assetId   = pickBtn.getAttribute('data-asset-id');
      var assetName = pickBtn.getAttribute('data-asset-name');
      selectStep2Asset(assetId, assetName);
      return;
    }

    // ── Cascade per-step Change link ──
    var revertBtn = t.closest('[data-bdl-revert]');
    if (revertBtn) {
      e.preventDefault();
      var step = parseInt(revertBtn.getAttribute('data-bdl-revert'), 10);
      revertCascadeStep(step);
      return;
    }

    // ── Cascade footer Cancel ──
    if (t.closest('[data-bdl-cascade-cancel]')) {
      e.preventDefault();
      closeCascade();
      return;
    }

    // ── Cascade footer Save (stubbed in v1.1.0) ──
    if (t.closest('[data-bdl-cascade-save]')) {
      e.preventDefault();
      saveCascadeStub();
      return;
    }

    // ── Click outside picker → hide list ──
    // (Only when cascade is open AND attach mode AND list is visible.)
    if (S.cascade && S.cascade.mode === 'attach') {
      var inPicker = t.closest('[data-bdl-picker]');
      if (!inPicker) {
        var list = document.querySelector('[data-bdl-picker-list]');
        if (list && !list.hidden) list.hidden = true;
      }
    }

    // ── Bundle header toggle (existing) — must come AFTER the checkbox guard
    //    so a click on the checkbox doesn't also toggle the bundle. ──
    var header = t.closest('[data-bdl-toggle]');
    if (header) {
      e.preventDefault();
      var id = header.getAttribute('data-bdl-toggle');
      S.expanded[id] = !S.expanded[id];
      render();
      return;
    }
  });

  // ── Picker input — focus + input events (delegated) ──
  document.addEventListener('focusin', function (e) {
    if (!e.target || !e.target.matches) return;
    if (e.target.matches('[data-bdl-picker-input]')) {
      renderPickerListSurgically(e.target.value);
    }
  });

  document.addEventListener('input', function (e) {
    if (!e.target || !e.target.matches) return;
    if (e.target.matches('[data-bdl-picker-input]')) {
      renderPickerListSurgically(e.target.value);
    }
  });

  // ─── Helpers ───

  function escHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escAttr(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  // Minimal CSS.escape polyfill — used only for our own Webflow IDs which
  // are alphanumeric. If standard CSS.escape exists, prefer it.
  function cssEscape(s) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(s);
    }
    return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function formatBytes(n) {
    if (!n && n !== 0) return '';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
    return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  function mimeIcon(mime) {
    if (!mime) return '📄';
    if (mime.indexOf('image/') === 0) return '🖼';
    if (mime.indexOf('video/') === 0) return '🎞';
    if (mime.indexOf('audio/') === 0) return '🎵';
    if (mime.indexOf('application/pdf') === 0) return '📕';
    if (mime.indexOf('text/html') === 0) return '🌐';
    if (mime.indexOf('text/')  === 0) return '📝';
    if (mime.indexOf('application/vnd.openxmlformats') === 0) return '📘';
    if (mime.indexOf('application/msword') === 0) return '📘';
    return '📄';
  }

  // ─── Boot ───

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Public API ───
  window.InbxBundles = {
    mount:     installMount,
    refresh:   fetchAndRender,
    clear:     clearAllSelections,
    getState:  function () {
      var myMedia = (S.data && S.tenantId) ? filterByTenant(mergeMedia(S.data), S.tenantId) : [];
      return {
        version:       FILE_VERSION,
        loading:       S.loading,
        error:         S.error,
        tenantId:      S.tenantId,
        lastFetchAt:   S.lastFetchAt,
        bundleCount:   S.data ? groupByBundle(myMedia).length : 0,
        looseCount:    S.data ? findLoose(myMedia).length : 0,
        selectedCount: selectedCount(),
        selectedIds:   selectedIdsArray(),
        cascade:       S.cascade ? {
          mode:      S.cascade.mode,
          type:      S.cascade.type,
          assetId:   S.cascade.assetId,
          assetName: S.cascade.assetName
        } : null
      };
    },
    version:   FILE_VERSION
  };

})();
