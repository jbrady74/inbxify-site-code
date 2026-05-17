/* ============================================================
   ta-bundles-v1.0.1.js
   ============================================================
   INBXIFY · Bundles Workspace · Cut 1 (read-only)

   ─── v1.0.1 (verification pass against live data) ───
   1. assetDisplayName() cascade simplified to `name || slug || id`.
      Confirmed from live API response 2026-05-17: all four asset
      collections (Articles, Ads, Events, RE Listings) carry a `name`
      slug with the human-readable display string. Removed dead
      fallbacks (`ad-name`, `event-title`, `property-address-street-city`
      — none exist) and a DANGEROUS fallback (`title` on Articles is a
      REFERENCE field that would have rendered a 24-hex Webflow item ID
      as the asset name if `name` were ever empty).
   2. Removed `ix-btn--sm` modifier (unverified class). Buttons now use
      `ix-btn ix-btn--ghost` only. Slightly larger refresh button is
      acceptable trade-off vs. shipping an unverified class.
   3. No behavior change beyond the above. State, mount, render, fetch
      all unchanged from v1.0.0.

   ──────────────────────────────────────────────────────────── */

/* ============================================================
   ta-bundles-v1.0.0.js (history)
   ============================================================
   INBXIFY · Bundles Workspace · Cut 1 (read-only)

   Surface: Studio Inputs tab (mounts below existing monitor panel).
   Backed by Scenario I (Bundles Read) — webhook in TA_CONFIG.makeBundles
   (fallback hardcoded; tracked in HC-NEW until TA_CONFIG ships the field).

   Cut 1 behavior (read-only):
     • Mounts a #bdl-root container into the Inputs panel body
     • Polls Scenario I on first activation + on visibilitychange (tab focus)
     • Filters MEDIA by tenant title-admin (client-side)
     • Groups MEDIA by bundle-id; loose tray for null bundle-id
     • Renders bundle cards (header + collapsed file list) — click to expand
     • Per-file asset-ref display: 0 refs → "Awaiting Create" pill; 1 ref →
       "→ {assetName}"; 2+ refs → "→ {firstName} +N more" with tooltip
     • Article SRF + Article media-items MRF dedupe — single article entry
     • Per-bundle status pill: pending / partial / fully_assigned
     • Banner at top: "N bundles · M loose files" (Cut 1 phrasing —
       "N new bundles arrived" detection lands when sessionStorage lastSeen
       is wired in Cut 2+)
     • No write actions wired (no Create Asset button work; no Group into
       bundle; no Hide; no Archive). All edit paths are Cut 2+ scope.

   Mount mechanism:
     ta-studio v1.4.0 dispatches std:panel:components / std:panel:transcriber /
     std:panel:converter as activation events, but Inputs is internal-only
     (renderInputsPanel() called directly). Until Studio v1.4.1 adds
     std:panel:input dispatch, we use a MutationObserver on the panel's
     class — when "active" appears, we fetch + render.

   Page load order on T-A page:
     1. ta-studio-v1.4.0.js  (creates the Inputs panel body slot)
     2. ta-bundles-v1.0.0.js (this file — appends #bdl-root + listens)
     3. ta-bundles-v1.0.0.css (paired)

   ──────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  var FILE_VERSION = '1.0.1';
  var DEBUG        = false;

  // ─── Config + fallback ───
  // Scenario I webhook URL. Primary source: window.TA_CONFIG.makeBundles.
  // Fallback: hardcoded WLN webhook (HC-NEW tracker entry — remove once
  // TA_CONFIG.makeBundles is populated by the Webflow template).
  var SCENARIO_I_FALLBACK = 'https://hook.us1.make.com/fkqas4u7bptpo7a3up1knqur8i9xtfwj';

  function _cfg() {
    return (typeof window !== 'undefined' && window.TA_CONFIG) ? window.TA_CONFIG : {};
  }

  function _scenarioIUrl() {
    var cfg = _cfg();
    if (cfg.makeBundles && typeof cfg.makeBundles === 'string') return cfg.makeBundles;
    if (DEBUG) console.warn('[InbxBundles] TA_CONFIG.makeBundles missing — using hardcoded WLN fallback (HC-NEW)');
    return SCENARIO_I_FALLBACK;
  }

  // ─── State ───
  var S = {
    loading:       false,
    error:         null,           // string or null
    data:          null,           // parsed Scenario I response
    tenantId:      null,           // resolved from response.tenant.titleAdminId
    lastFetchAt:   0,              // timestamp ms
    expanded:      {},             // bundleId → true if expanded
    mounted:       false           // has #bdl-root been placed
  };

  // ─── Lifecycle ───

  function init() {
    installMount();
    watchPanelActivation();
    watchVisibility();
    if (DEBUG) console.log('[InbxBundles] v' + FILE_VERSION + ' ready');
  }

  // Append #bdl-root inside the Inputs panel body (after the monitor).
  // Idempotent: no-op if already present.
  function installMount() {
    var panel = document.querySelector('[data-std-panel-body="input"]');
    if (!panel) {
      // Studio not mounted yet — retry shortly. Capped to avoid leak.
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

    // If the panel is already active at install time (rare, but possible
    // if Inputs is the default tab or restore lands there), trigger first
    // load now.
    if (panel.classList.contains('active')) {
      fetchAndRender();
    }
  }

  // MutationObserver: watch the Inputs panel for the "active" class
  // being added (Studio's setPanel toggles it). On each activation,
  // ensure data is fresh-ish; refetch if stale (>30s) or never loaded.
  var STALENESS_MS = 30 * 1000;

  function watchPanelActivation() {
    var panel = document.querySelector('[data-std-panel-body="input"]');
    if (!panel) {
      // Same retry pattern as installMount
      setTimeout(watchPanelActivation, 300);
      return;
    }
    var wasActive = panel.classList.contains('active');
    var obs = new MutationObserver(function () {
      var isActive = panel.classList.contains('active');
      if (isActive && !wasActive) {
        // Just transitioned to active
        onPanelActivated();
      }
      wasActive = isActive;
    });
    obs.observe(panel, { attributes: true, attributeFilter: ['class'] });
  }

  function onPanelActivated() {
    if (!S.mounted) installMount();
    if (!S.data || (Date.now() - S.lastFetchAt) > STALENESS_MS) {
      fetchAndRender();
    } else {
      // Data is fresh — just re-render in case the DOM was wiped
      render();
    }
  }

  // Tab/window focus → revalidate when Inputs is the visible panel.
  function watchVisibility() {
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible') return;
      var panel = document.querySelector('[data-std-panel-body="input"]');
      if (panel && panel.classList.contains('active')) {
        fetchAndRender();
      }
    });
  }

  // ─── Fetch ───

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
      render();
    })
    .catch(function (err) {
      console.error('[InbxBundles] fetch error:', err);
      S.loading = false;
      S.error   = err.message || 'Network error';
      render();
    });
  }

  // ─── Data processing ───

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
    var groups = {};   // bundleId → { id, label, items[] }
    var order  = [];   // preserve first-seen order
    items.forEach(function (m) {
      var fd = m.fieldData || {};
      var bid = fd['bundle-id'];
      if (!bid) return;
      if (!groups[bid]) {
        groups[bid] = {
          id:    bid,
          label: fd['bundle-label'] || bid,
          items: []
        };
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

  // Build { byType: { id → record } } lookup so a MEDIA item's back-refs
  // (article SRF, ads MRF, events MRF, re-listing MRF/SRF, customer SRF)
  // can be resolved to display names.
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

  // Pull display name from a Webflow asset record. Confirmed via live
  // API probe 2026-05-17: all four asset collections (Articles, Ads,
  // Events, RE Listings) use `name` for the human-readable display
  // string. NOTE: Articles' `title` slug is a REFERENCE field (points
  // to a TITLE record), NOT a text title — must not be used as a name
  // fallback. `slug` is last-resort textual fallback; rec.id as final.
  function assetDisplayName(rec) {
    if (!rec) return null;
    var fd = rec.fieldData || {};
    return fd.name || fd.slug || rec.id;
  }

  // Compute the de-duplicated list of asset refs for a single MEDIA item.
  // A MEDIA item can have:
  //   • article (SRF, single ID)
  //   • ads (MRF, ID array) — slug observed: "ads"
  //   • events (MRF, ID array) — slug observed: "events"
  //   • re-listing (MRF or SRF — slug observed: "re-listing", string)
  //   • customer (SRF, single ID) — informational, not displayed as ref
  //     for Cut 1 (Customers aren't in the Scenario I payload yet)
  //
  // Article appears twice when an Article's media-items MRF includes a
  // MEDIA whose article SRF points back to that same Article. Dedup by
  // (type + id).
  function getMediaAssetRefs(mediaItem, lookup) {
    var fd = mediaItem.fieldData || {};
    var refs = [];   // { type, id, name }
    var seen = {};   // type + ':' + id

    function push(type, id, registry) {
      if (!id) return;
      var key = type + ':' + id;
      if (seen[key]) return;
      seen[key] = true;
      var rec = registry[id];
      refs.push({
        type: type,
        id:   id,
        name: assetDisplayName(rec) || id
      });
    }

    // Article — SRF (Cut 1 includes this; mirror from Article's
    // media-items MRF would already include this same ID via the
    // forward ref, so dedup is sufficient).
    if (fd.article) push('article', fd.article, lookup.articles);

    // Articles via reverse traversal: if any Article in the lookup
    // has this MEDIA in its media-items MRF, count it as a ref. This
    // catches cases where the SRF wasn't set but the Article includes
    // this image in its body. Dedup via seen[] handles the SRF overlap.
    Object.keys(lookup.articles).forEach(function (aid) {
      var art = lookup.articles[aid];
      var mi = art.fieldData && art.fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) {
        push('article', aid, lookup.articles);
      }
    });

    // Ads — MEDIA's "ads" slug is plural MRF; values is array of IDs
    if (Array.isArray(fd.ads)) {
      fd.ads.forEach(function (id) { push('ad', id, lookup.ads); });
    }
    // Reverse: Ads with this MEDIA in their media-items MRF
    Object.keys(lookup.ads).forEach(function (aid) {
      var ad = lookup.ads[aid];
      var mi = ad.fieldData && ad.fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) {
        push('ad', aid, lookup.ads);
      }
    });

    // Events — MEDIA's "events" slug
    if (Array.isArray(fd.events)) {
      fd.events.forEach(function (id) { push('event', id, lookup.events); });
    }
    Object.keys(lookup.events).forEach(function (eid) {
      var ev = lookup.events[eid];
      var mi = ev.fieldData && ev.fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) {
        push('event', eid, lookup.events);
      }
    });

    // RE Listing — MEDIA's "re-listing" slug. Per schema v1.5 §2 this
    // is MRF (array) but live response observed single string in some
    // records; handle both shapes defensively.
    var reField = fd['re-listing'];
    if (Array.isArray(reField)) {
      reField.forEach(function (id) { push('re', id, lookup.reListings); });
    } else if (typeof reField === 'string' && reField) {
      push('re', reField, lookup.reListings);
    }
    Object.keys(lookup.reListings).forEach(function (rid) {
      var re = lookup.reListings[rid];
      var mi = re.fieldData && re.fieldData['media-items'];
      if (Array.isArray(mi) && mi.indexOf(mediaItem.id) !== -1) {
        push('re', rid, lookup.reListings);
      }
    });

    return refs;
  }

  // Bundle-level status from its MEDIA items' ref state.
  // Note: This is COUNT-based for Cut 1. Future versions can use
  // MEDIA.status enum (Available / Attached / Archived) directly
  // once back-fill is reliable.
  function computeBundleStatus(items, lookup) {
    if (!items || !items.length) return 'pending';
    var assignedCount = 0;
    for (var i = 0; i < items.length; i++) {
      var refs = getMediaAssetRefs(items[i], lookup);
      if (refs.length > 0) assignedCount++;
    }
    if (assignedCount === 0)              return 'pending';
    if (assignedCount === items.length)   return 'fully_assigned';
    return 'partial';
  }

  // ─── Rendering ───

  function render() {
    var host = document.getElementById('bdl-root');
    if (!host) return;

    if (S.loading && !S.data) {
      host.innerHTML = renderLoading();
      return;
    }
    if (S.error && !S.data) {
      host.innerHTML = renderError(S.error);
      return;
    }
    if (!S.data) {
      host.innerHTML = renderEmpty();
      return;
    }

    var allMedia    = mergeMedia(S.data);
    var myMedia     = filterByTenant(allMedia, S.tenantId);
    var bundles     = groupByBundle(myMedia);
    var loose       = findLoose(myMedia);
    var lookup      = buildAssetLookup(S.data);
    var bundleCount = bundles.length;
    var looseCount  = loose.length;

    var refreshingNote = S.loading
      ? '<span class="bdl-banner-refresh">refreshing…</span>'
      : '';
    var freshness = S.lastFetchAt
      ? '<span class="bdl-banner-time">' + escHtml(timeAgo(S.lastFetchAt)) + '</span>'
      : '';

    var bannerHtml =
      '<div class="bdl-banner">' +
        '<div class="bdl-banner-counts">' +
          '<strong>' + bundleCount + '</strong> ' +
            (bundleCount === 1 ? 'bundle' : 'bundles') +
          '<span class="bdl-banner-sep">·</span>' +
          '<strong>' + looseCount + '</strong> loose ' +
            (looseCount === 1 ? 'file' : 'files') +
        '</div>' +
        '<div class="bdl-banner-meta">' +
          freshness + refreshingNote +
          '<button class="ix-btn ix-btn--ghost bdl-refresh-btn" data-bdl-refresh ' +
            (S.loading ? 'disabled' : '') +
            ' title="Refetch bundles">↻</button>' +
        '</div>' +
      '</div>';

    var bundlesHtml = bundles.length
      ? bundles.map(function (b) { return renderBundleCard(b, lookup); }).join('')
      : '<div class="bdl-empty-section">No bundles yet. New bundles arrive when the publisher uploads to a sub-folder in Drive.</div>';

    var looseHtml = loose.length
      ? renderLooseTray(loose, lookup)
      : '';

    host.innerHTML =
      '<div class="bdl-root-wrap">' +
        bannerHtml +
        '<div class="bdl-section">' +
          '<div class="bdl-section-label">Bundles</div>' +
          '<div class="bdl-bundles">' + bundlesHtml + '</div>' +
        '</div>' +
        (loose.length ? (
          '<div class="bdl-section">' +
            '<div class="bdl-section-label">Loose Files</div>' +
            looseHtml +
          '</div>'
        ) : '') +
      '</div>';
  }

  function renderBundleCard(bundle, lookup) {
    var status      = computeBundleStatus(bundle.items, lookup);
    var statusLabel = (status === 'pending') ? 'Awaiting assignment'
                    : (status === 'partial') ? 'Partially assigned'
                    : 'Fully assigned';
    var isExpanded  = !!S.expanded[bundle.id];
    var caret       = isExpanded ? '▾' : '▸';

    var rowsHtml = isExpanded
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
        (isExpanded
          ? '<div class="bdl-card-body">' + rowsHtml + '</div>'
          : ''
        ) +
      '</div>'
    );
  }

  function renderFileRow(mediaItem, lookup) {
    var fd       = mediaItem.fieldData || {};
    var filename = fd['original-filename'] || fd.name || mediaItem.id;
    var mime     = fd['mime-type'] || '';
    var size     = fd.size;
    var refs     = getMediaAssetRefs(mediaItem, lookup);

    var sizeHtml = (size != null)
      ? '<span class="bdl-row-size">' + escHtml(formatBytes(size)) + '</span>'
      : '';

    var refsHtml;
    if (refs.length === 0) {
      refsHtml = '<span class="bdl-pill bdl-pill--awaiting">Awaiting Create</span>';
    } else if (refs.length === 1) {
      refsHtml = '<span class="bdl-row-target">→ ' + escHtml(refs[0].name) + '</span>';
    } else {
      var first = refs[0];
      var rest  = refs.slice(1).map(function (r) { return r.name; }).join('\n');
      refsHtml = '<span class="bdl-row-target" title="' + escAttr(refs.map(function(r){return r.name;}).join('\n')) + '">' +
        '→ ' + escHtml(first.name) +
        ' <span class="bdl-row-target-more">+' + (refs.length - 1) + ' more</span>' +
      '</span>';
    }

    return (
      '<div class="bdl-row">' +
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

  function timeAgo(ts) {
    if (!ts) return '';
    var diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 5)    return 'just now';
    if (diff < 60)   return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    return Math.floor(diff / 3600) + 'h ago';
  }

  // ─── Click delegation ───

  document.addEventListener('click', function (e) {
    var t = e.target;

    // Refresh button
    if (t.closest && t.closest('[data-bdl-refresh]')) {
      e.preventDefault();
      e.stopPropagation();
      fetchAndRender();
      return;
    }

    // Bundle header toggle
    var header = t.closest && t.closest('[data-bdl-toggle]');
    if (header) {
      e.preventDefault();
      var id = header.getAttribute('data-bdl-toggle');
      S.expanded[id] = !S.expanded[id];
      render();
      return;
    }
  });

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
    getState:  function () {
      return {
        version:     FILE_VERSION,
        loading:     S.loading,
        error:       S.error,
        tenantId:    S.tenantId,
        lastFetchAt: S.lastFetchAt,
        bundleCount: S.data ? groupByBundle(filterByTenant(mergeMedia(S.data), S.tenantId)).length : 0,
        looseCount:  S.data ? findLoose(filterByTenant(mergeMedia(S.data), S.tenantId)).length : 0
      };
    },
    version:   FILE_VERSION
  };

})();
