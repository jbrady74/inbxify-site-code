/*
   ta-intake-manager-v1.0.js
   ─────────────────────────────────────────────────────────────
   Studio · Intake tab manager (B1: full single-owner replacement
   for ta-bundles-v1.2.1.js on the Intake panel).

   OWNS the entire Intake panel:
     • Scenario I read  (bundle/loose-file list)            — hook 2718766
     • Nested subtab navigation:
         L1: Bundles | Loose files
         L2 (Bundles): Awaiting assignment | Partially assigned
                       | Fully assigned | Archived
         L2 (Loose):   Awaiting use | Used | Archived
     • Bundle status is DERIVED. "Archived counts as resolved":
         an item is resolved if it has an asset ref OR status=archived.
         → archiving a stuck orphan rolls its bundle to Fully assigned.
     • Multi-select (per-item + per-bundle-header select-all),
       gold dirty-border on selected rows, Cancel text-link.
     • Bulk ARCHIVE / RESTORE via Scenario K (mode: archive/restore)
         — writes MEDIA.status; Restore → Available.
     • Attach / Create cascade DELEGATED to the same endpoints the
       old ta-bundles used: Scenario K (mode: attach) +
       window.InbxASF.open({mode:'create',...}). Re-implemented here
       so this file is the single owner of #intk-root.

   DEPLOY:
     • REMOVE ta-bundles-v1.2.1.js from the T-A head — this file
       replaces it for the Intake panel. (If ta-bundles also serves
       another surface, keep it; but on Intake this is the owner.)
     • Add: ta-intake-manager-v1.0.js (new filename — clean cache).
     • CSS: reuses ta-bundles-v1.2.1.css class hooks where possible
       and ships its own intk-* rules inline-free via
       ta-intake-manager-v1.0.css (pair).

   CONFIG (window.TA_CONFIG):
     • titleSlug                          (tenant identity — required)
     • scenarioI / makeBundlesRead        (reader URL; fallback below)
     • makeAttachFiles                    (Scenario K URL — attach + archive)
     • optionIds.mediaStatus.{available,attached,archived}  (hashes)

   NO-HARDCODE: status hashes read from TA_CONFIG.optionIds. Webhook
   URLs read from TA_CONFIG with documented fallbacks (HC entries).
   ─────────────────────────────────────────────────────────────
*/
(function () {
  'use strict';

  var FILE_VERSION = '1.0.0';
  var DEBUG = !!(window.TA_CONFIG && window.TA_CONFIG.debug);

  /* ── HC · documented fallbacks (override via TA_CONFIG) ──
     HC-INTK-1 · SCENARIO_I_FALLBACK  — Bundles_Read webhook (hook 2718766)
     HC-INTK-2 · SCENARIO_K_FALLBACK  — Create Asset / Attach + Archive (hook 2718974) */
  var SCENARIO_I_FALLBACK = 'https://hook.us1.make.com/54uf7gqiv5d42tlfw5ck3c8dbc6yrsg1';
  var SCENARIO_K_FALLBACK = 'https://hook.us1.make.com/b1w6sq7c3dzs8504rnl03ihokg1jsa1t';

  function _cfg() {
    return (typeof window !== 'undefined' && window.TA_CONFIG) ? window.TA_CONFIG : {};
  }
  function _scenarioIUrl() {
    var c = _cfg();
    return c.scenarioI || c.makeBundlesRead || SCENARIO_I_FALLBACK;
  }
  function _scenarioKUrl() {
    var c = _cfg();
    return c.makeAttachFiles || SCENARIO_K_FALLBACK;
  }
  function _mediaStatusHash(which) {
    var c = _cfg();
    var ids = (c.optionIds && c.optionIds.mediaStatus) || {};
    return ids[which] || null;
  }

  /* ── State ── */
  var S = {
    loading:   false,
    error:     null,
    data:      null,
    tenantId:  null,
    lastFetchAt: 0,
    mounted:   false,
    l1:        'bundles',         // 'bundles' | 'loose'
    l2:        'pending',         // see L2_DEFS
    expanded:  {},                // bundleId → bool (collapse within subtab)
    selected:  {},                // mediaId → true
    busy:      false              // bulk action in flight
  };

  var L2_DEFS = {
    bundles: [
      ['pending',        'Awaiting assignment'],
      ['partial',        'Partially assigned'],
      ['fully_assigned', 'Fully assigned'],
      ['archived',       'Archived']
    ],
    loose: [
      ['available', 'Awaiting use'],
      ['used',      'Used'],
      ['archived',  'Archived']
    ]
  };

  /* ── Small DOM/string helpers ── */
  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escAttr(s) { return escHtml(s); }
  function cssEscape(s) {
    return String(s).replace(/["\\\]\[#.:>+~*^$|()'\s]/g, '\\$&');
  }

  /* ── Data shaping (ported from ta-bundles, identical contract) ── */
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
    var groups = {}, order = [];
    items.forEach(function (m) {
      var fd = m.fieldData || {};
      var bid = fd['bundle-id'];
      if (!bid) return;
      if (!groups[bid]) { groups[bid] = { id: bid, label: fd['bundle-label'] || bid, items: [] }; order.push(bid); }
      groups[bid].items.push(m);
    });
    return order.map(function (id) { return groups[id]; });
  }
  function findLoose(items) {
    return items.filter(function (m) { return !(m.fieldData || {})['bundle-id']; });
  }
  function buildAssetLookup(data) {
    function indexBy(arr) {
      var idx = {};
      if (Array.isArray(arr)) arr.forEach(function (r) { if (r && r.id) idx[r.id] = r; });
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

  /* ── Status reader (hash-first, string fallback) ── */
  function readMediaStatus(mediaItem) {
    var fd = (mediaItem && mediaItem.fieldData) || {};
    var raw = fd.status;
    if (raw == null || raw === '') return 'other';
    var av = _mediaStatusHash('available'), at = _mediaStatusHash('attached'), ar = _mediaStatusHash('archived');
    if (av && raw === av) return 'available';
    if (at && raw === at) return 'attached';
    if (ar && raw === ar) return 'archived';
    var s = String(raw).trim().toLowerCase();
    if (s === 'available') return 'available';
    if (s === 'attached')  return 'attached';
    if (s === 'archived')  return 'archived';
    return 'other';
  }

  /* ── Asset-ref detection (ported) ── */
  function getMediaAssetRefs(mediaItem, lookup) {
    var fd = mediaItem.fieldData || {}, refs = [], seen = {};
    function push(type, id, registry) {
      if (!id) return;
      var key = type + ':' + id;
      if (seen[key]) return;
      seen[key] = true;
      refs.push({ type: type, id: id, name: assetDisplayName(registry[id]) || id });
    }
    if (fd.article) push('article', fd.article, lookup.articles);
    Object.keys(lookup.articles).forEach(function (aid) {
      var mi = lookup.articles[aid].fieldData && lookup.articles[aid].fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) push('article', aid, lookup.articles);
    });
    if (Array.isArray(fd.ads)) fd.ads.forEach(function (id) { push('ad', id, lookup.ads); });
    Object.keys(lookup.ads).forEach(function (aid) {
      var mi = lookup.ads[aid].fieldData && lookup.ads[aid].fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) push('ad', aid, lookup.ads);
    });
    if (Array.isArray(fd.events)) fd.events.forEach(function (id) { push('event', id, lookup.events); });
    Object.keys(lookup.events).forEach(function (eid) {
      var mi = lookup.events[eid].fieldData && lookup.events[eid].fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) push('event', eid, lookup.events);
    });
    var re = fd['re-listing'];
    if (Array.isArray(re)) re.forEach(function (id) { push('re', id, lookup.reListings); });
    else if (typeof re === 'string' && re) push('re', re, lookup.reListings);
    Object.keys(lookup.reListings).forEach(function (rid) {
      var mi = lookup.reListings[rid].fieldData && lookup.reListings[rid].fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) push('re', rid, lookup.reListings);
    });
    return refs;
  }

  /* ── Resolution + bundle status (THE rule: ref OR attached OR archived = resolved) ──
     An item counts as resolved if ANY of:
       • its status is 'attached' (used the normal way), OR
       • its status is 'archived' (swept — counts as resolved per design), OR
       • an asset references it (belt-and-suspenders for ref/status drift).
     The status checks matter because a ref lookup can miss when the
     referencing asset isn't in the Scenario I response (pagination,
     cross-collection). Status is the durable signal; refs confirm. */
  function isItemResolved(item, lookup) {
    var st = readMediaStatus(item);
    if (st === 'attached' || st === 'archived') return true;
    return getMediaAssetRefs(item, lookup).length > 0;
  }
  function computeBundleStatus(bundle, lookup) {
    var items = bundle.items || [];
    if (!items.length) return 'pending';
    // A bundle is 'archived' only when EVERY item is archived (whole-bundle sweep).
    var allArchived = items.every(function (i) { return readMediaStatus(i) === 'archived'; });
    if (allArchived) return 'archived';
    var resolved = 0;
    items.forEach(function (i) { if (isItemResolved(i, lookup)) resolved++; });
    if (resolved === 0) return 'pending';
    if (resolved === items.length) return 'fully_assigned';
    return 'partial';
  }
  function looseBucket(item, lookup) {
    var st = readMediaStatus(item);
    if (st === 'archived') return 'archived';
    if (st === 'attached' || getMediaAssetRefs(item, lookup).length > 0) return 'used';
    return 'available';
  }

  /* ── Counts per L2 bucket ── */
  function bundleCounts(bundles, lookup) {
    var c = { pending: 0, partial: 0, fully_assigned: 0, archived: 0 };
    bundles.forEach(function (b) { c[computeBundleStatus(b, lookup)]++; });
    return c;
  }
  function looseCounts(loose, lookup) {
    var c = { available: 0, used: 0, archived: 0 };
    loose.forEach(function (f) { c[looseBucket(f, lookup)]++; });
    return c;
  }

  /* ── Selection ── */
  function isSel(id) { return S.selected[id] === true; }
  function selIds() { return Object.keys(S.selected).filter(function (k) { return S.selected[k]; }); }
  function clearSel() { S.selected = {}; }
  function toggleSel(id) { if (S.selected[id]) delete S.selected[id]; else S.selected[id] = true; }

  /* ── Fetch (Scenario I) ── */
  function fetchAndRender(force) {
    if (S.loading) return;
    var cfg = _cfg();
    if (!cfg.titleSlug) {
      S.error = 'TA_CONFIG.titleSlug missing — cannot identify tenant';
      render(); return;
    }
    if (S.data && !force) { render(); return; }
    S.loading = true; S.error = null; render();

    fetch(_scenarioIUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titleSlug: cfg.titleSlug })
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Scenario I returned HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      if (!data || data.ok !== true) throw new Error('Scenario I response missing ok=true');
      S.data = data;
      S.tenantId = (data.tenant && data.tenant.titleAdminId) || null;
      S.lastFetchAt = Date.now();
      S.loading = false;
      // Prune selections that no longer exist after a refresh.
      var present = {};
      filterByTenant(mergeMedia(data), S.tenantId).forEach(function (m) { present[m.id] = true; });
      Object.keys(S.selected).forEach(function (id) { if (!present[id]) delete S.selected[id]; });
      render();
    })
    .catch(function (err) {
      if (DEBUG) console.error('[Intake v' + FILE_VERSION + '] fetch error:', err);
      S.loading = false;
      S.error = err.message || 'Network error';
      render();
    });
  }

  /* ── Bulk archive / restore (Scenario K) ── */
  function bulkStatusWrite(mode) {
    var ids = selIds();
    if (!ids.length || S.busy) return;
    S.busy = true; renderBar();

    var cfg = _cfg();
    var payload = {
      mode: mode,                       // 'archive' | 'restore'
      mediaIds: ids,
      titleSlug: cfg.titleSlug,
      mediaCollId: cfg.mediaCollId || (cfg.collections && cfg.collections.media) || ''
    };

    fetch(_scenarioKUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Scenario K returned HTTP ' + res.status);
      return res.text().then(function (t) {
        if (!t) return { ok: true };
        try { return JSON.parse(t); } catch (e) { return { ok: true, _raw: t }; }
      });
    })
    .then(function (data) {
      if (data && data.ok === false) throw new Error(data.error || 'Scenario K reported failure');
      toast((mode === 'restore' ? 'Restored ' : 'Archived ') + ids.length +
            ' item' + (ids.length === 1 ? '' : 's') +
            (mode === 'restore' ? ' — back to Awaiting.' : '.'), 'success');
      clearSel();
      S.busy = false;
      // Refresh from source so derived statuses recompute against new MEDIA.status.
      fetchAndRender(true);
    })
    .catch(function (err) {
      if (DEBUG) console.error('[Intake v' + FILE_VERSION + '] bulk ' + mode + ' error:', err);
      S.busy = false;
      toast('Failed: ' + (err.message || 'network error'), 'error');
      renderBar();
    });
  }

  /* ── Attach / Create delegation (same endpoints as legacy ta-bundles) ── */
  function attachSelectedTo(assetType, assetId, assetName) {
    var ids = selIds();
    if (!ids.length || S.busy) return;
    S.busy = true; renderBar();
    var cfg = _cfg();
    var payload = {
      mode: 'attach',
      assetType: assetType,
      assetId: assetId,
      mediaIds: ids,
      titleSlug: cfg.titleSlug,
      assetCollId: cfg.assetCollIds ? cfg.assetCollIds[assetType] : '',
      mediaCollId: cfg.mediaCollId || (cfg.collections && cfg.collections.media) || ''
    };
    fetch(_scenarioKUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Scenario K returned HTTP ' + res.status);
      return res.text();
    })
    .then(function () {
      toast('Attached ' + ids.length + ' file' + (ids.length === 1 ? '' : 's') +
            ' to "' + (assetName || 'asset') + '".', 'success');
      clearSel(); S.busy = false; fetchAndRender(true);
    })
    .catch(function (err) {
      if (DEBUG) console.error('[Intake v' + FILE_VERSION + '] attach error:', err);
      S.busy = false; toast('Attach failed: ' + (err.message || 'network'), 'error'); renderBar();
    });
  }
  function createAssetFrom(assetType) {
    var ids = selIds();
    if (!window.InbxASF || typeof window.InbxASF.open !== 'function') {
      toast('Asset builder not available — load ta-asf before ta-intake-manager.', 'error');
      return;
    }
    window.InbxASF.open({ mode: 'create', assetType: assetType, prefilledMediaIds: ids });
  }

  /* ── Toast ── */
  function toast(msg, kind) {
    var el = document.getElementById('intk-toast');
    if (!el) return;
    el.className = 'intk-toast intk-toast--' + (kind || 'info');
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.style.display = 'none'; }, 2800);
  }

  /* ── Render ── */
  function host() { return document.getElementById('intk-root'); }

  function render() {
    var h = host();
    if (!h) return;
    if (S.loading && !S.data) { h.innerHTML = '<div class="intk-state intk-state--loading">Loading intake…</div>'; return; }
    if (S.error && !S.data)   { h.innerHTML = '<div class="intk-state intk-state--error">' + escHtml(S.error) + '</div>'; return; }
    if (!S.data)              { h.innerHTML = '<div class="intk-state">No data yet.</div>'; return; }

    var media   = filterByTenant(mergeMedia(S.data), S.tenantId);
    var bundles = groupByBundle(media);
    var loose   = findLoose(media);
    var lookup  = buildAssetLookup(S.data);

    // Ensure L2 is valid for current L1
    var validL2 = L2_DEFS[S.l1].map(function (d) { return d[0]; });
    if (validL2.indexOf(S.l2) === -1) S.l2 = validL2[0];

    h.innerHTML =
      '<div class="intk-wrap">' +
        renderL1() +
        renderL2(bundles, loose, lookup) +
        '<div class="intk-list">' +
          (S.l1 === 'bundles' ? renderBundles(bundles, lookup) : renderLoose(loose, lookup)) +
        '</div>' +
        '<div class="intk-toast" id="intk-toast" style="display:none"></div>' +
        '<div id="intk-bar"></div>' +
      '</div>';

    renderBar();
    wire();
  }

  function renderL1() {
    return '<div class="intk-l1">' +
      '<button class="intk-l1-tab' + (S.l1 === 'bundles' ? ' is-active' : '') + '" data-l1="bundles">Bundles</button>' +
      '<button class="intk-l1-tab' + (S.l1 === 'loose' ? ' is-active' : '') + '" data-l1="loose">Loose files</button>' +
      '<button class="intk-refresh ix-btn ix-btn--ghost ix-btn--icon' + (S.loading ? ' is-spinning' : '') + '"' +
        (S.loading ? ' disabled' : '') + ' data-intk-refresh title="Refresh intake" aria-label="Refresh intake">↻</button>' +
    '</div>';
  }

  function renderL2(bundles, loose, lookup) {
    var counts = (S.l1 === 'bundles') ? bundleCounts(bundles, lookup) : looseCounts(loose, lookup);
    var h = '<div class="intk-l2">';
    L2_DEFS[S.l1].forEach(function (d) {
      var key = d[0], label = d[1], n = counts[key] || 0;
      h += '<button class="intk-chip' + (S.l2 === key ? ' is-active' : '') + '" data-l2="' + key + '">' +
             escHtml(label) + '<span class="intk-chip-ct">' + n + '</span>' +
           '</button>';
    });
    return h + '</div>';
  }

  function statusPill(status) {
    var map = {
      pending:        ['pending', 'Awaiting assignment'],
      partial:        ['partial', 'Partially assigned'],
      fully_assigned: ['full',    'Fully assigned'],
      archived:       ['arch',    'Archived'],
      available:      ['pending', 'Awaiting use'],
      used:           ['full',    'Used']
    };
    var m = map[status] || ['pending', status];
    return '<span class="intk-pill intk-pill--' + m[0] + '">' + escHtml(m[1]) + '</span>';
  }

  function checkbox(checked, attr, val) {
    return '<span class="intk-cb' + (checked ? ' is-checked' : '') + '" ' + attr + '="' + escAttr(val) + '"' +
           ' role="checkbox" aria-checked="' + (checked ? 'true' : 'false') + '" tabindex="0">' +
           (checked ? '✓' : '') + '</span>';
  }

  function renderBundles(bundles, lookup) {
    var shown = bundles.filter(function (b) { return computeBundleStatus(b, lookup) === S.l2; });
    if (!shown.length) return emptyBucket();
    return shown.map(function (b) { return renderBundleCard(b, lookup); }).join('');
  }

  function renderBundleCard(bundle, lookup) {
    var status   = computeBundleStatus(bundle, lookup);
    var expanded = !!S.expanded[bundle.id];
    var caret    = expanded ? '▾' : '▸';
    // Selection allowed unless the whole bundle is already fully assigned or archived.
    var selectable = (status === 'pending' || status === 'partial');
    var allSel = selectable && bundle.items.length > 0 &&
                 bundle.items.every(function (i) { return isSel(i.id); });

    var head =
      '<div class="intk-bhead" data-intk-toggle="' + escAttr(bundle.id) + '">' +
        (selectable
          ? checkbox(allSel, 'data-intk-ball', bundle.id)
          : '<span class="intk-cb-spacer"></span>') +
        '<span class="intk-caret">' + caret + '</span>' +
        '<span class="intk-bname">' + escHtml(bundle.label) + '</span>' +
        '<span class="intk-bcount">' + bundle.items.length + ' ' + (bundle.items.length === 1 ? 'file' : 'files') + '</span>' +
        statusPill(status) +
      '</div>';

    var body = '';
    if (expanded) {
      body = '<div class="intk-bbody">' +
        bundle.items.map(function (i) { return renderItemRow(i, lookup, selectable); }).join('') +
      '</div>';
    }
    return '<div class="intk-bundle intk-bundle--' + status + (expanded ? ' is-expanded' : '') + '"' +
           ' data-intk-bundle="' + escAttr(bundle.id) + '">' + head + body + '</div>';
  }

  function renderItemRow(item, lookup, selectable) {
    var on   = isSel(item.id);
    var refs = getMediaAssetRefs(item, lookup);
    var st   = readMediaStatus(item);
    var fd   = item.fieldData || {};
    var fn   = fd.name || fd['file-name'] || fd.slug || item.id;

    var meta;
    if (st === 'archived')      meta = '<span class="intk-tag intk-tag--arch">archived</span>';
    else if (refs.length)       meta = '<span class="intk-tag">→ ' + escHtml(refs[0].name) + (refs.length > 1 ? ' +' + (refs.length - 1) : '') + '</span>';
    else                        meta = '<span class="intk-tag intk-tag--orphan">unassigned</span>';

    return '<div class="intk-row' + (on ? ' is-selected' : '') + '">' +
      (selectable ? checkbox(on, 'data-intk-item', item.id) : '<span class="intk-cb-spacer"></span>') +
      '<span class="intk-meta"><span class="intk-fn">' + escHtml(fn) + '</span>' +
        '<span class="intk-id">' + escHtml(item.id) + '</span></span>' +
      meta +
    '</div>';
  }

  function renderLoose(loose, lookup) {
    var shown = loose.filter(function (f) { return looseBucket(f, lookup) === S.l2; });
    if (!shown.length) return emptyBucket();
    return shown.map(function (f) {
      var on = isSel(f.id);
      var bucket = looseBucket(f, lookup);
      var fd = f.fieldData || {};
      var fn = fd.name || fd['file-name'] || fd.slug || f.id;
      // Used items can still be selected (to archive); everything selectable except none-special.
      return '<div class="intk-loose-card"><div class="intk-row' + (on ? ' is-selected' : '') + '">' +
        checkbox(on, 'data-intk-item', f.id) +
        '<span class="intk-meta"><span class="intk-fn">' + escHtml(fn) + '</span>' +
          '<span class="intk-id">' + escHtml(f.id) + '</span></span>' +
        statusPill(bucket) +
      '</div></div>';
    }).join('');
  }

  function emptyBucket() {
    return '<div class="intk-empty">Nothing here — this bucket is clear.</div>';
  }

  /* ── Action bar (archive / restore / attach / create) ── */
  function renderBar() {
    var bar = document.getElementById('intk-bar');
    if (!bar) return;
    var ids = selIds();
    if (!ids.length) { bar.innerHTML = ''; document.body.classList.remove('intk-has-sel'); return; }
    document.body.classList.add('intk-has-sel');

    var inArchived = (S.l2 === 'archived');
    var busy = S.busy;

    var actions;
    if (inArchived) {
      actions = '<button class="intk-act intk-act--restore" data-intk-restore' + (busy ? ' disabled' : '') + '>' +
                (busy ? 'Restoring…' : 'Restore ' + ids.length) + '</button>';
    } else {
      // Archive is always available off-archived buckets. Attach/Create
      // are offered for awaiting items (the legacy cascade entry points).
      actions =
        '<button class="intk-act intk-act--attach" data-intk-attach' + (busy ? ' disabled' : '') + '>Attach…</button>' +
        '<button class="intk-act intk-act--create" data-intk-create' + (busy ? ' disabled' : '') + '>Create asset…</button>' +
        '<button class="intk-act intk-act--archive" data-intk-archive' + (busy ? ' disabled' : '') + '>' +
        (busy ? 'Archiving…' : 'Archive ' + ids.length) + '</button>';
    }

    bar.innerHTML =
      '<div class="intk-bar">' +
        '<span class="intk-bar-count">' + ids.length + ' selected</span>' +
        '<button class="intk-bar-cancel" data-intk-cancel>Cancel</button>' +
        actions +
      '</div>';
  }

  /* ── Wiring (delegated; re-bound each render) ── */
  function wire() {
    var h = host();
    if (!h || h._intkWired) return;
    h._intkWired = true;

    h.addEventListener('click', function (e) {
      var t = e.target;
      var l1 = t.closest('[data-l1]');
      var l2 = t.closest('[data-l2]');
      var toggle = t.closest('[data-intk-toggle]');
      var item = t.closest('[data-intk-item]');
      var ball = t.closest('[data-intk-ball]');
      var refresh = t.closest('[data-intk-refresh]');

      if (refresh) { fetchAndRender(true); return; }
      if (l1) { S.l1 = l1.getAttribute('data-l1'); S.l2 = L2_DEFS[S.l1][0][0]; clearSel(); render(); return; }
      if (l2) { S.l2 = l2.getAttribute('data-l2'); clearSel(); render(); return; }
      if (item) { toggleSel(item.getAttribute('data-intk-item')); render(); return; }
      if (ball) {
        var bid = ball.getAttribute('data-intk-ball');
        var bundle = currentBundles().filter(function (b) { return b.id === bid; })[0];
        if (bundle) {
          var all = bundle.items.every(function (i) { return isSel(i.id); });
          bundle.items.forEach(function (i) { if (all) delete S.selected[i.id]; else S.selected[i.id] = true; });
        }
        render(); return;
      }
      if (toggle) {
        var id = toggle.getAttribute('data-intk-toggle');
        S.expanded[id] = !S.expanded[id];
        render(); return;
      }
    });

    // Bar lives outside #intk-root list but inside wrap — delegate on document for the bar.
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('[data-intk-cancel]'))  { clearSel(); render(); }
      else if (t.closest('[data-intk-archive]')) bulkStatusWrite('archive');
      else if (t.closest('[data-intk-restore]')) bulkStatusWrite('restore');
      else if (t.closest('[data-intk-attach]'))  openAttachPicker();
      else if (t.closest('[data-intk-create]'))  openCreatePicker();
    });
  }

  function currentBundles() {
    var media = filterByTenant(mergeMedia(S.data), S.tenantId);
    return groupByBundle(media);
  }

  /* ── Attach/Create entry points — minimal picker delegating to InbxASF ──
     For attach, we hand off to the asset builder's existing picker UI if
     present; otherwise prompt for an asset type and let InbxASF resolve.
     (Kept thin: the heavy cascade UI is owned by ta-asf/InbxASF.) */
  function openAttachPicker() {
    if (window.InbxASF && typeof window.InbxASF.openAttach === 'function') {
      window.InbxASF.openAttach({ prefilledMediaIds: selIds(), onDone: function () { clearSel(); fetchAndRender(true); } });
    } else {
      toast('Attach picker requires the asset builder (InbxASF).', 'error');
    }
  }
  function openCreatePicker() {
    // Defer asset-type choice to InbxASF's create flow.
    createAssetFrom(null);
  }

  /* ── Mount ── */
  function mount() {
    var panel = document.querySelector('[data-std-panel-body="input"]');
    if (!panel) return false;
    if (!panel.querySelector('#intk-root')) {
      var root = document.createElement('div');
      root.id = 'intk-root';
      root.className = 'intk-root';
      panel.appendChild(root);
    }
    if (!S.mounted) {
      S.mounted = true;
      // Lazy fetch on first activation (panel becomes visible).
      fetchAndRender(false);
    }
    return true;
  }

  function watchForPanel() {
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      if (mount()) { clearInterval(timer); return; }
      if (tries > 40) { clearInterval(timer); if (DEBUG) console.warn('[Intake] panel not found'); }
    }, 250);
  }

  function boot() {
    watchForPanel();
    // Re-mount + lazy fetch when the Intake tab is activated.
    document.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-std-panel="input"]');
      if (tab) { setTimeout(function () { if (mount() && !S.data && !S.loading) fetchAndRender(false); }, 60); }
    });
    if (DEBUG) console.log('[Intake] v' + FILE_VERSION + ' ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Expose a tiny surface for debugging / external refresh.
  window.InbxIntake = {
    version: FILE_VERSION,
    refresh: function () { fetchAndRender(true); },
    _state: function () { return S; }
  };
})();
