/* ════════════════════════════════════════════════════════════════
   ta-canvas-v0.1.0.js
   INBXIFY T-A Studio — Production Canvas (8th panel) · W0
   Companion: ta-canvas-v0.1.0.css (matched pair — load both)

   Scope (Canvas-Transition-Scoping v0.4, Wave W0):
     • Self-registers as the 8th Studio panel (D-CVS-1) — injects
       its own tab button + panel div into the ta-studio v1.4.8
       strip. ta-studio's delegated click → setPanel('canvas')
       handles active-class toggling; ta-studio dispatches NO
       std:panel:canvas event (its if-chain predates us), so this
       file listens for its own tab clicks (§03 caveat).
     • PubPlan bar (D-CVS-9): plan title + caret menu of harvested
       plans in send order, defaulting to next-to-go (= first
       harvested), send-date sub, NEXT badge on first menu item.
     • Stage 01 Components — LIVE. Scenario I feed (D-CVS-5),
       flat lane (D-CVS-6): bundle FOLDER tiles first, then loose
       TXT→IMG→VID→AUD, newest-first per kind, Attached sinking to
       each group's bottom. Chips All / Available / In-Use
       (default Available) + manual ↻. Folder click selects all
       Available members; chevron expands. Hover-intent /click
       preview (image = real Uploadcare, text = html-content with
       <script> stripped, video/audio = labeled placeholder).
       "+ New component" menu = W0 stubs toasting the W4 contract
       (D-CVS-7).
     • BundleBar (D-CVS-8): selection count + four type buttons →
       InbxASF.open({mode:'create', assetType, prefilledMediaIds,
       resolved}). NO client-side status flip — truth returns via
       inbx:asset-saved → refetch.
     • Stage 02 Assets — LIVE read-only. Four arrays from the same
       Scenario I response, tenant-filtered; type chips; Open =
       guarded ASF edit attempt (articles only; others display-only
       in W0).
     • Stage 03 PubPlans — LIVE read-only. Slots harvested from the
       T-A page's .pubplan-item / .pubplan-slot-wrapper hidden
       collection (same source as pubplan-overview). Assign buttons
       render disabled ("lands W1").
     • Stage 04 Newsletters — placeholder lane (W2 ledger + lineup
       scenarios).

   Data layer:
     • ONE Scenario I POST per activation — never per render (Make
       410s under overlapping load). Manual ↻ in Stage-1 pills row.
     • Refetch on inbx:asset-saved, debounced ~800ms; if the panel
       is inactive, mark stale and refetch on next activation.
     • NO background polling (intake-manager v1.1.0 precedent).
     • Hard-fail toast if TA_CONFIG absent — no webhook fallback
       URL is hardcoded in this file.

   Ported contracts (verbatim semantics from live files):
     • mergeMedia / groupByBundle (fieldData['bundle-id'/'bundle-
       label']) / findLoose / readMediaStatus / mediaTypeOf /
       filterByTenant / assetBelongsToTenant — ta-intake-manager
       v3.0.1 (the live ta-bundles descendant).
     • Scenario I response: { ok, tenant.titleAdminId, media[],
       mediaExtra[], articles[], ads[], events[], reListings[],
       titles[] } — raw Webflow items ({id, createdOn, fieldData}).
     • Plan harvest: .pubplan-item → .pubplan-id (text) /
       .q-header (name) / .q-header-mini (date) /
       .pubplan-slot-wrapper[data-*] — pubplan-overview v1.0.12.
     • window.InbxASF.open / isOpen + inbx:asset-saved on window
       — ta-asf v1.5.18.

   ─── Hardcoding inventory (Tracker v2.5 queue) ───
   HC-CVS-002 · MEDIA_TYPE_HASH fallback — tenant-independent
     Webflow option ids for MEDIA.media-type (mirrors HC-INTK-3);
     TA_CONFIG.optionIds.mediaType wins when present.
   HC-CVS-003 · Stage-2 asset accent colors — cosmetic per-type
     hex map (not tenant/publisher data).
   HC-CVS-004 · tile roster colors — lives in the CSS pair
     (single source; JS only assigns data-t keys).

   ─── Page load order on T-A page ───
     1. ta-studio-v1.4.8.js        (renders the Studio strip)
     2. ta-asf-v1.5.18.js          (window.InbxASF + asset-saved)
     3. ta-canvas-v0.1.0.js        (this file — AFTER both above)
     4. ta-canvas-v0.1.0.css       (matched pair)

   Desktop-only surface. Studio is operator-only (Jeff).
   ════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var FILE_VERSION = '0.1.0';
  var DEBUG        = false;
  var TAG          = '[ta-canvas v' + FILE_VERSION + ']';

  function log() {
    if (!DEBUG) return;
    try { console.log.apply(console, [TAG].concat([].slice.call(arguments))); } catch (e) {}
  }

  // ═══════════════════════════════════════════
  // CONFIG
  // ═══════════════════════════════════════════

  function _cfg() {
    return (typeof window !== 'undefined' && window.TA_CONFIG) ? window.TA_CONFIG : null;
  }

  // Scenario I URL — TA_CONFIG.makeBundles ONLY. No hardcoded
  // fallback in this file (hard-fail toast instead; the intake
  // manager still carries the legacy HC fallback if needed).
  function scenarioIUrl() {
    var cfg = _cfg();
    return (cfg && typeof cfg.makeBundles === 'string' && cfg.makeBundles) ? cfg.makeBundles : null;
  }

  // HC-CVS-002 — media-type option-id fallback (tenant-independent
  // Webflow option ids, confirmed from the live Scenario I payload;
  // mirrors ta-intake-manager HC-INTK-3). TA_CONFIG wins.
  var MEDIA_TYPE_HASH = {
    image: 'be8534c8e7579ff07ffbd6032f3a4bf7',
    text:  '5332c884efac157407557cf3efd387b7',
    video: '37581cd40911a2cc7b5f2913e3aeba71'
  };

  // HC-CVS-003 — Stage-2 asset accent colors (cosmetic only).
  var ASSET_ACCENT = {
    article: '#3d6b9e',
    ad:      '#c2410c',
    event:   '#7a5ae0',
    re:      '#1f7a6d'
  };

  var TYPE_TO_ASSETS_KEY = { article: 'articles', ad: 'ads', event: 'events', re: 'reListings' };
  var TYPE_LABELS        = { article: 'Article',  ad: 'Ad',  event: 'Event',  re: 'RE Listing' };
  // BundleBar / Create-flow asset types (ta-asf rejects bare 're').
  var ASF_TYPE           = { article: 'article', ad: 'ad', event: 'event', re: 'realestate' };

  var KIND_ORDER = ['text', 'image', 'video', 'audio', 'other'];
  var KIND_META  = {
    text:  { t: 'text',  lbl: 'TXT'  },
    image: { t: 'image', lbl: 'IMG'  },
    video: { t: 'video', lbl: 'VID'  },
    audio: { t: 'audio', lbl: 'AUD'  },
    other: { t: 'text',  lbl: 'FILE' }
  };

  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════

  var S = {
    injected:     false,   // tab + panel divs in the strip
    mounted:      false,   // .ixcv-root shell built
    active:       false,   // canvas panel currently shown
    loading:      false,
    error:        null,
    data:         null,    // raw Scenario I response
    tenantId:     null,
    stale:        true,    // fetch (again) on next activation
    lastFetchAt:  0,

    selectedIds:  {},      // mediaItemId → true
    openFolders:  {},      // bundleId → true
    s1Filter:     'available',   // 'all' | 'available' | 'attached'
    s2Filter:     'all',         // 'all' | article | ad | event | re

    plans:        [],      // harvested pubplans (send order = DOM order)
    planId:       null,    // selected plan (pid), default = first

    preview:      null,    // { mediaId } when open
    hoverTimer:   null,
    savedTimer:   null     // inbx:asset-saved debounce
  };

  // ═══════════════════════════════════════════
  // UTIL
  // ═══════════════════════════════════════════

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Strip <script> blocks + inline on* handlers from text-MEDIA html
  // before innerHTML preview.
  function sanitizeHtml(html) {
    var s = String(html || '');
    s = s.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
    s = s.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    s = s.replace(/javascript:/gi, '');
    return s;
  }

  function toastEl() {
    var rack = document.querySelector('.ixcv-toastrack');
    if (!rack) {
      rack = document.createElement('div');
      rack.className = 'ixcv-toastrack';
      document.body.appendChild(rack);
    }
    return rack;
  }

  function toast(msg, kind) {
    var rack = toastEl();
    var t = document.createElement('div');
    t.className = 'ixcv-toast';
    if (kind) t.setAttribute('data-kind', kind);
    t.textContent = msg;
    rack.appendChild(t);
    setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, kind === 'fail' ? 5200 : 3400);
  }

  // ═══════════════════════════════════════════
  // DATA READERS — ported from ta-intake-manager v3.0.1
  // ═══════════════════════════════════════════

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

  function _mediaStatusHash(which) {
    var cfg = _cfg() || {};
    var ids = (cfg.optionIds && cfg.optionIds.mediaStatus) || {};
    return ids[which] || null;
  }

  // 'available' | 'attached' | 'archived' | 'other'
  function readMediaStatus(mediaItem) {
    var fd = (mediaItem && mediaItem.fieldData) || {};
    var raw = fd.status;
    if (raw == null || raw === '') return 'other';
    var availHash = _mediaStatusHash('available');
    var attHash   = _mediaStatusHash('attached');
    var archHash  = _mediaStatusHash('archived');
    if (availHash && raw === availHash) return 'available';
    if (attHash   && raw === attHash)   return 'attached';
    if (archHash  && raw === archHash)  return 'archived';
    var s = String(raw).trim().toLowerCase();
    if (s === 'available') return 'available';
    if (s === 'attached')  return 'attached';
    if (s === 'archived')  return 'archived';
    return 'other';
  }

  // 'text' | 'image' | 'video' | 'audio' | 'other'
  function mediaTypeOf(fd) {
    var raw = (fd && fd['media-type']) || '';
    var cfg = _cfg() || {};
    var map = (cfg.optionIds && cfg.optionIds.mediaType) || {};
    var H = {
      image: map.image || MEDIA_TYPE_HASH.image,
      text:  map.text  || MEDIA_TYPE_HASH.text,
      video: map.video || MEDIA_TYPE_HASH.video,
      audio: map.audio || null
    };
    if (raw === H.text)  return 'text';
    if (raw === H.image) return 'image';
    if (raw === H.video) return 'video';
    if (H.audio && raw === H.audio) return 'audio';
    var s = String(raw).toLowerCase();
    if (s.indexOf('text')  !== -1) return 'text';
    if (s.indexOf('image') !== -1) return 'image';
    if (s.indexOf('video') !== -1) return 'video';
    if (s.indexOf('audio') !== -1) return 'audio';
    return 'other';
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

  function assetBelongsToTenant(rec, type, tenantId) {
    if (!tenantId) return true;
    var fd = rec && rec.fieldData;
    if (!fd) return false;
    if (type === 'article') return fd['associated-title'] === tenantId;
    var titles = fd['titles'];
    return Array.isArray(titles) && titles.indexOf(tenantId) !== -1;
  }

  function assetDisplayName(rec) {
    if (!rec) return '';
    var fd = rec.fieldData || {};
    return fd.name || fd.slug || rec.id;
  }

  function createdStamp(rec) {
    var d = rec && (rec.createdOn || rec.lastUpdated);
    var t = d ? Date.parse(d) : NaN;
    return isNaN(t) ? 0 : t;
  }

  // D-CVS-6 sort: kind order TXT→IMG→VID→AUD, newest-first within
  // kind, Attached sinking to its kind-group's bottom.
  function sortComponents(items) {
    return items.slice().sort(function (a, b) {
      var ka = KIND_ORDER.indexOf(mediaTypeOf(a.fieldData));
      var kb = KIND_ORDER.indexOf(mediaTypeOf(b.fieldData));
      if (ka !== kb) return ka - kb;
      var sa = readMediaStatus(a) === 'attached' ? 1 : 0;
      var sb = readMediaStatus(b) === 'attached' ? 1 : 0;
      if (sa !== sb) return sa - sb;
      return createdStamp(b) - createdStamp(a);
    });
  }

  function statusVisible(mediaItem) {
    var st = readMediaStatus(mediaItem);
    if (st === 'archived' || st === 'other') return false; // hidden from all chips (intake precedent)
    if (S.s1Filter === 'all') return true;
    return st === S.s1Filter;
  }

  function myMedia() {
    if (!S.data) return [];
    return filterByTenant(mergeMedia(S.data), S.tenantId);
  }

  function mediaById(id) {
    var all = myMedia();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  function assetsForType(type) {
    if (!S.data) return [];
    var arr = S.data[TYPE_TO_ASSETS_KEY[type]];
    if (!Array.isArray(arr)) return [];
    var tid = S.tenantId;
    return arr.filter(function (rec) { return assetBelongsToTenant(rec, type, tid); });
  }

  // ═══════════════════════════════════════════
  // PLAN HARVEST — .pubplan-item hidden collection (T-A page)
  // Same source as pubplan-overview v1.0.12. DOM order = send order;
  // next-to-go = first harvested (D-CVS-9).
  // ═══════════════════════════════════════════

  function harvestPlans() {
    var items = document.querySelectorAll('.pubplan-item');
    var plans = [];
    var seen  = {};
    Array.prototype.forEach.call(items, function (item) {
      var idEl = item.querySelector('.pubplan-id');
      var pid = idEl ? idEl.textContent.trim() : '';
      if (!pid || seen[pid]) return;
      seen[pid] = true;
      var nameEl = item.querySelector('.q-header');
      var dateEl = item.querySelector('.q-header-mini');
      var slots = [];
      var wraps = item.querySelectorAll('.pubplan-slot-wrapper');
      Array.prototype.forEach.call(wraps, function (w) {
        var d = w.dataset;
        var sc = d.slotCode || '';
        if (!sc || sc.indexOf('-cat') !== -1) return; // content slots only
        slots.push({
          slotCode:     sc,
          sectionCode:  d.sectionCode  || '',
          articleTitle: d.articleTitle || '',
          articleId:    d.articleId    || '',
          customerName: d.customerName || '',
          customerId:   d.customerId   || '',
          adTitle:      d.adTitle      || '',
          eventId:      d.eventId      || '',
          sponsorName:  d.sponsorName  || ''
        });
      });
      plans.push({
        pid:  pid,
        name: nameEl ? nameEl.textContent.trim() : pid,
        date: dateEl ? dateEl.textContent.trim() : '',
        slots: slots
      });
    });
    return plans;
  }

  function selectedPlan() {
    for (var i = 0; i < S.plans.length; i++) {
      if (S.plans[i].pid === S.planId) return S.plans[i];
    }
    return S.plans[0] || null;
  }

  function slotFilledLabel(sl) {
    return sl.articleTitle || sl.customerName || sl.adTitle || sl.sponsorName ||
           (sl.eventId ? 'Event assigned' : '');
  }

  // ═══════════════════════════════════════════
  // FETCH — one Scenario I POST per activation, never per render
  // ═══════════════════════════════════════════

  function fetchData(reason) {
    if (S.loading) return;
    var cfg = _cfg();
    if (!cfg || !cfg.titleSlug) {
      S.error = 'TA_CONFIG.titleSlug missing — cannot identify tenant';
      toast(S.error, 'fail');
      renderAll();
      return;
    }
    var url = scenarioIUrl();
    if (!url) {
      S.error = 'TA_CONFIG.makeBundles missing — Canvas cannot load the Components feed';
      toast(S.error, 'fail');
      renderAll();
      return;
    }
    S.loading = true;
    S.error   = null;
    renderAll();
    log('fetch', reason || '');

    fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ titleSlug: cfg.titleSlug })
    })
    .then(function (res) {
      if (!res.ok) throw new Error('Scenario I returned ' + res.status);
      return res.json();
    })
    .then(function (data) {
      if (!data || data.ok !== true) throw new Error('Scenario I response missing ok=true');
      S.data        = data;
      S.tenantId    = (data.tenant && data.tenant.titleAdminId) || null;
      S.lastFetchAt = Date.now();
      S.loading     = false;
      S.error       = null;
      S.stale       = false;
      pruneStaleSelections();
      renderAll();
    })
    .catch(function (err) {
      console.error(TAG, 'fetch error:', err);
      S.loading = false;
      S.error   = err.message || 'Network error';
      toast('Components feed failed — ' + S.error, 'fail');
      renderAll();
    });
  }

  function pruneStaleSelections() {
    var present = {};
    myMedia().forEach(function (m) { present[m.id] = true; });
    Object.keys(S.selectedIds).forEach(function (id) {
      if (!present[id] || readMediaStatus(mediaById(id)) !== 'available') {
        delete S.selectedIds[id];
      }
    });
  }

  // inbx:asset-saved → debounce ~800ms → refetch (or stale-mark)
  window.addEventListener('inbx:asset-saved', function () {
    if (S.savedTimer) clearTimeout(S.savedTimer);
    S.savedTimer = setTimeout(function () {
      S.savedTimer = null;
      if (S.active) { fetchData('inbx:asset-saved'); }
      else          { S.stale = true; }
    }, 800);
  });

  // ═══════════════════════════════════════════
  // SELF-REGISTRATION — 8th panel injection (D-CVS-1, §03 caveat)
  // ═══════════════════════════════════════════

  function tryInject() {
    if (S.injected) return true;
    var strip = document.querySelector('.std-tabs-wrap') ||
                (document.querySelector('[data-std-panel="components"]') || {}).parentElement;
    var anyPanel = document.querySelector('[data-std-panel-body="components"]');
    if (!strip || !anyPanel) return false;

    // Tab button — before the Create tab (margin-left:auto keeps
    // the left group intact); fall back to append.
    if (!strip.querySelector('[data-std-panel="canvas"]')) {
      var btn = document.createElement('button');
      btn.className = 'ix-btn ix-btn--tab';
      btn.setAttribute('data-std-panel', 'canvas');
      btn.textContent = 'Canvas';
      var createTab = strip.querySelector('[data-std-create="toggle"]');
      var tabRow = createTab ? createTab.parentElement : (anyPanelTabRow(strip));
      if (createTab && createTab.parentElement) {
        createTab.parentElement.insertBefore(btn, createTab);
      } else if (tabRow) {
        tabRow.appendChild(btn);
      } else {
        strip.appendChild(btn);
      }
    }

    // Panel div — sibling of the existing panels.
    if (!document.querySelector('[data-std-panel-body="canvas"]')) {
      var panel = document.createElement('div');
      panel.className = 'std-panel';
      panel.setAttribute('data-std-panel-body', 'canvas');
      var inner = document.createElement('div');
      inner.id = 'std-canvas-mount';
      panel.appendChild(inner);
      anyPanel.parentElement.appendChild(panel);
    }

    S.injected = true;
    log('injected tab + panel');
    return true;
  }

  function anyPanelTabRow(strip) {
    var anyTab = strip.querySelector('[data-std-panel]');
    return anyTab ? anyTab.parentElement : null;
  }

  // ta-studio dispatches no std:panel:canvas — own the activation:
  // delegated click on our tab (ta-studio's own delegated handler
  // does the class toggling via setPanel).
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-std-panel="canvas"]');
    if (!btn) return;
    setTimeout(onActivate, 0); // after ta-studio's setPanel runs
  });

  function onActivate() {
    S.active = true;
    mountShell();
    S.plans = harvestPlans();
    if (!S.planId && S.plans.length) S.planId = S.plans[0].pid;
    if (S.stale || !S.data) fetchData('activation');
    else renderAll();
  }

  // Deactivation tracking — any other tab click.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-std-panel]');
    if (!btn) return;
    if (btn.getAttribute('data-std-panel') !== 'canvas') S.active = false;
  });

  // Injection poll — Studio strip renders lazily; retry until found.
  var injectTries = 0;
  var injectTimer = setInterval(function () {
    injectTries++;
    if (tryInject() || injectTries > 120) {  // ~60s @ 500ms
      clearInterval(injectTimer);
      if (!S.injected) log('Studio strip never appeared — Canvas not injected');
    }
  }, 500);

  // ═══════════════════════════════════════════
  // SHELL
  // ═══════════════════════════════════════════

  function mountShell() {
    if (S.mounted) return;
    var host = document.getElementById('std-canvas-mount');
    if (!host) return;
    host.innerHTML =
      '<div class="ixcv-root">' +
        '<div class="ixcv-planbar" data-cvs-planbar></div>' +
        '<div class="ixcv-lanes">' +
          laneShell('01', 'Components', 'cmp') +
          laneShell('02', 'Assets', 'ast') +
          laneShell('03', 'PubPlans', 'pln') +
          laneShell('04', 'Newsletters', 'nls') +
        '</div>' +
      '</div>';
    wireShell(host);
    S.mounted = true;
  }

  function laneShell(num, title, key) {
    return '' +
      '<section class="ixcv-lane" data-cvs-lane="' + key + '">' +
        '<div class="ixcv-lane-head">' +
          '<div><div class="ixcv-kick">' + num + '</div><h2>' + title + '</h2></div>' +
          (key === 'cmp'
            ? '<button type="button" class="ixcv-chip" data-cvs-newmenu-btn>+ New component</button>'
            : '') +
        '</div>' +
        '<div class="ixcv-sub" data-cvs-sub="' + key + '"></div>' +
        '<div class="ixcv-body" data-cvs-body="' + key + '"></div>' +
      '</section>';
  }

  function wireShell(host) {
    var root = host.querySelector('.ixcv-root');

    root.addEventListener('click', function (e) {
      // ── Plan bar: title toggle + item pick ──
      var pbTitle = e.target.closest('[data-cvs-plan-toggle]');
      if (pbTitle) {
        var menu = root.querySelector('.ixcv-pb-menu');
        if (menu) menu.setAttribute('data-open', menu.getAttribute('data-open') === 'true' ? 'false' : 'true');
        return;
      }
      var pbItem = e.target.closest('[data-cvs-plan-pick]');
      if (pbItem) {
        S.planId = pbItem.getAttribute('data-cvs-plan-pick');
        renderPlanBar(); renderStage3();
        return;
      }

      // ── + New component menu ──
      var nmBtn = e.target.closest('[data-cvs-newmenu-btn]');
      if (nmBtn) { toggleNewMenu(nmBtn); return; }
      var nmItem = e.target.closest('[data-cvs-new]');
      if (nmItem) {
        closeNewMenu();
        // D-CVS-7 W0 stubs — toast the W4 contract.
        var which = nmItem.getAttribute('data-cvs-new');
        var msg = which === 'transcribe' ? 'Transcribe Text launches here in W4 — use the Transcriber tab for now'
                : which === 'imagegen'   ? 'Generate an Image launches here in W4 — use the Generate tab for now'
                :                          'Reformat an Ad launches here in W4 — use the Ad Reformat tab for now';
        toast(msg, 'warn');
        return;
      }

      // ── Stage 1 chips ──
      var chip1 = e.target.closest('[data-cvs-s1chip]');
      if (chip1) { S.s1Filter = chip1.getAttribute('data-cvs-s1chip'); renderStage1(); return; }

      // ── Refresh ──
      if (e.target.closest('[data-cvs-refresh]')) { fetchData('manual'); return; }

      // ── Retry (error state) ──
      if (e.target.closest('[data-cvs-retry]')) { fetchData('retry'); return; }

      // ── Folder: chevron expand vs head select-all ──
      var fx = e.target.closest('.ixcv-fx');
      if (fx) {
        var fEl = fx.closest('.ixcv-folder');
        var bid = fEl && fEl.getAttribute('data-cvs-folder');
        if (bid) { S.openFolders[bid] = !S.openFolders[bid]; renderStage1(); }
        return;
      }
      var fhead = e.target.closest('.ixcv-fhead');
      if (fhead && !e.target.closest('.ixcv-tile')) {
        var fEl2 = fhead.closest('.ixcv-folder');
        var bid2 = fEl2 && fEl2.getAttribute('data-cvs-folder');
        if (bid2) toggleFolderSelect(bid2);
        return;
      }

      // ── Preview via tile click ──
      var tile = e.target.closest('.ixcv-tile[data-cvs-preview]');
      if (tile) { openPreview(tile.getAttribute('data-cvs-preview')); return; }

      // ── Card select ──
      var card = e.target.closest('.ixcv-card[data-cvs-media]');
      if (card) {
        if (card.getAttribute('data-attached') === 'true') return;
        toggleSelect(card.getAttribute('data-cvs-media'));
        return;
      }

      // ── Stage 2 chips ──
      var chip2 = e.target.closest('[data-cvs-s2chip]');
      if (chip2) { S.s2Filter = chip2.getAttribute('data-cvs-s2chip'); renderStage2(); return; }

      // ── Stage 2 Open (articles) ──
      var openBtn = e.target.closest('[data-cvs-open-article]');
      if (openBtn) { openArticleEdit(openBtn.getAttribute('data-cvs-open-article')); return; }
    });

    // Preview hover-intent (180ms) on component tiles.
    root.addEventListener('mouseover', function (e) {
      var tile = e.target.closest && e.target.closest('.ixcv-tile[data-cvs-preview]');
      if (!tile) return;
      clearTimeout(S.hoverTimer);
      var id = tile.getAttribute('data-cvs-preview');
      S.hoverTimer = setTimeout(function () { openPreview(id); }, 180);
    });
    root.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest('.ixcv-tile[data-cvs-preview]')) {
        clearTimeout(S.hoverTimer);
      }
    });
  }

  // Outside-click + Esc — menus and preview.
  document.addEventListener('click', function (e) {
    var menu = document.querySelector('.ixcv-root .ixcv-pb-menu[data-open="true"]');
    if (menu && !e.target.closest('.ixcv-planbar')) menu.setAttribute('data-open', 'false');
    if (!e.target.closest('[data-cvs-newmenu-btn]') && !e.target.closest('[data-cvs-newmenu]')) closeNewMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closePreview();
    closeNewMenu();
    var menu = document.querySelector('.ixcv-root .ixcv-pb-menu[data-open="true"]');
    if (menu) menu.setAttribute('data-open', 'false');
  });

  // ═══════════════════════════════════════════
  // + NEW COMPONENT MENU (W0 stubs — D-CVS-7)
  // ═══════════════════════════════════════════

  function toggleNewMenu(btn) {
    var existing = document.querySelector('[data-cvs-newmenu]');
    if (existing) { closeNewMenu(); return; }
    var m = document.createElement('div');
    m.className = 'ixcv-pb-menu';
    m.setAttribute('data-cvs-newmenu', '');
    m.setAttribute('data-open', 'true');
    m.innerHTML =
      '<button type="button" class="ixcv-pb-item" data-cvs-new="transcribe"><span class="nm">Transcribe Text</span></button>' +
      '<button type="button" class="ixcv-pb-item" data-cvs-new="imagegen"><span class="nm">Generate an Image</span></button>' +
      '<button type="button" class="ixcv-pb-item" data-cvs-new="reformat"><span class="nm">Reformat an Ad</span></button>';
    var r = btn.getBoundingClientRect();
    m.style.position = 'fixed';
    m.style.left = 'auto';
    m.style.right = (window.innerWidth - r.right) + 'px';
    m.style.top = (r.bottom + 4) + 'px';
    m.style.zIndex = '9080';
    var root = document.querySelector('.ixcv-root');
    (root || document.body).appendChild(m);
  }

  function closeNewMenu() {
    var m = document.querySelector('[data-cvs-newmenu]');
    if (m && m.parentNode) m.parentNode.removeChild(m);
  }

  // ═══════════════════════════════════════════
  // SELECTION + BUNDLEBAR (D-CVS-8)
  // ═══════════════════════════════════════════

  function toggleSelect(id) {
    if (S.selectedIds[id]) delete S.selectedIds[id];
    else S.selectedIds[id] = true;
    renderStage1();
    renderBundleBar();
  }

  function toggleFolderSelect(bundleId) {
    var members = myMedia().filter(function (m) {
      return (m.fieldData || {})['bundle-id'] === bundleId &&
             readMediaStatus(m) === 'available';
    });
    if (!members.length) { toast('No available components in this bundle', 'warn'); return; }
    var allSelected = members.every(function (m) { return !!S.selectedIds[m.id]; });
    members.forEach(function (m) {
      if (allSelected) delete S.selectedIds[m.id];
      else S.selectedIds[m.id] = true;
    });
    renderStage1();
    renderBundleBar();
  }

  function selectionCount() { return Object.keys(S.selectedIds).length; }

  function renderBundleBar() {
    var bar = document.querySelector('.ixcv-bundlebar');
    var n = selectionCount();
    if (!n) { if (bar && bar.parentNode) bar.parentNode.removeChild(bar); return; }
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'ixcv-bundlebar';
      document.body.appendChild(bar);
      bar.addEventListener('click', function (e) {
        var tBtn = e.target.closest('[data-cvs-bb-type]');
        if (tBtn) { launchCreate(tBtn.getAttribute('data-cvs-bb-type'), tBtn); return; }
        if (e.target.closest('[data-cvs-bb-clear]')) {
          S.selectedIds = {};
          renderStage1();
          renderBundleBar();
        }
      });
    }
    bar.innerHTML =
      '<span class="cnt">' + n + ' selected</span>' +
      '<span class="lbl">create as</span>' +
      Object.keys(TYPE_LABELS).map(function (t) {
        return '<button type="button" class="ixcv-bb-type" data-cvs-bb-type="' + t + '">' +
               esc(TYPE_LABELS[t]) + '</button>';
      }).join('') +
      '<button type="button" class="ixcv-bb-clear" data-cvs-bb-clear>Clear</button>';
  }

  function launchCreate(type, btn) {
    if (!window.InbxASF || typeof window.InbxASF.open !== 'function') {
      toast('ASF not loaded on this page — cannot create', 'fail');
      return;
    }
    var ids = Object.keys(S.selectedIds);
    if (!ids.length) return;

    // Immediate click feedback (async-action invariant).
    var buttons = document.querySelectorAll('.ixcv-bb-type');
    Array.prototype.forEach.call(buttons, function (b) { b.disabled = true; });
    if (btn) btn.innerHTML = '<span class="ixcv-spin"></span> Opening\u2026';

    // Build `resolved` from the fetched items so ta-asf skips its
    // DOM-scrape resolver (Bundles-cascade contract, ta-asf v1.2.3+).
    var resolved = ids.map(function (id) {
      var m  = mediaById(id) || {};
      var fd = m.fieldData || {};
      return {
        id:          id,
        mediaType:   mediaTypeOf(fd),
        imageUrl:    fd['image-url'] || '',
        htmlContent: fd['html-content'] || ''
      };
    });

    try {
      window.InbxASF.open({
        mode:              'create',
        assetType:         ASF_TYPE[type] || 'article',
        prefilledMediaIds: ids,
        resolved:          resolved
      });
      // No client-side status flip — truth returns via
      // inbx:asset-saved → refetch. Clear the working selection.
      S.selectedIds = {};
      renderStage1();
      renderBundleBar();
    } catch (err) {
      console.error(TAG, 'InbxASF.open failed:', err);
      toast('Could not open the asset form — see console', 'fail');
      renderBundleBar(); // restore buttons
    }
  }

  // ═══════════════════════════════════════════
  // PREVIEW PANEL
  // ═══════════════════════════════════════════

  function openPreview(mediaId) {
    var m = mediaById(mediaId);
    if (!m) return;
    var fd   = m.fieldData || {};
    var kind = mediaTypeOf(fd);
    var name = fd.name || fd.slug || m.id;

    closePreview();
    var p = document.createElement('div');
    p.className = 'ixcv-preview';
    p.setAttribute('data-cvs-preview-panel', '');

    // x-aligned to the Stage 2 lane rect, spanning Stages 2–3.
    var lane2 = document.querySelector('[data-cvs-lane="ast"]');
    var lane3 = document.querySelector('[data-cvs-lane="pln"]');
    if (lane2) {
      var r2 = lane2.getBoundingClientRect();
      var r3 = lane3 ? lane3.getBoundingClientRect() : r2;
      p.style.left   = Math.round(r2.left) + 'px';
      p.style.top    = Math.round(r2.top) + 'px';
      p.style.width  = Math.round(r3.right - r2.left) + 'px';
      p.style.height = Math.round(r2.height) + 'px';
    } else {
      p.style.right = '20px'; p.style.top = '80px';
      p.style.width = '520px'; p.style.height = '70vh';
    }

    var bodyHtml;
    if (kind === 'image' && fd['image-url']) {
      bodyHtml = '<img src="' + esc(fd['image-url']) + '" alt="">';
    } else if (kind === 'text' && fd['html-content']) {
      bodyHtml = '<div class="ptext">' + sanitizeHtml(fd['html-content']) + '</div>';
    } else if (kind === 'video' || kind === 'audio') {
      bodyHtml = '<div class="ptext" style="align-self:center;color:#8b8471;font-style:italic;text-align:center">' +
                 (kind === 'video' ? 'Video' : 'Audio') + ' preview lands in a later wave.<br>' + esc(name) + '</div>';
    } else {
      bodyHtml = '<div class="ptext" style="align-self:center;color:#8b8471;font-style:italic">No preview available for this component.</div>';
    }

    p.innerHTML =
      '<div class="ph">' +
        '<div class="pn">' + esc(name) + '</div>' +
        '<div class="ps">' + esc(KIND_META[kind].lbl) + ' · ' + esc(readMediaStatus(m)) + '</div>' +
        '<button type="button" class="px" data-cvs-preview-close aria-label="Close">\u00d7</button>' +
      '</div>' +
      '<div class="pb">' + bodyHtml + '</div>' +
      '<div class="pfoot">Esc or \u00d7 to close</div>';
    document.body.appendChild(p);
    p.addEventListener('click', function (e) {
      if (e.target.closest('[data-cvs-preview-close]')) closePreview();
    });
    S.preview = { mediaId: mediaId };
  }

  function closePreview() {
    var p = document.querySelector('[data-cvs-preview-panel]');
    if (p && p.parentNode) p.parentNode.removeChild(p);
    S.preview = null;
  }

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  function renderAll() {
    if (!S.mounted) return;
    renderPlanBar();
    renderStage1();
    renderStage2();
    renderStage3();
    renderStage4();
    renderBundleBar();
  }

  function renderPlanBar() {
    var bar = document.querySelector('[data-cvs-planbar]');
    if (!bar) return;
    var plan = selectedPlan();
    if (!plan) {
      bar.innerHTML =
        '<span class="ixcv-pb-kick">PubPlan</span>' +
        '<span class="ixcv-pb-sub">No publication plans found on this page</span>';
      return;
    }
    bar.innerHTML =
      '<span class="ixcv-pb-kick">PubPlan</span>' +
      '<button type="button" class="ixcv-pb-title" data-cvs-plan-toggle>' +
        esc(plan.name || plan.pid) +
        '<span class="ixcv-pb-caret">\u25be</span>' +
      '</button>' +
      '<span class="ixcv-pb-sub">' + esc(plan.date || '') + '</span>' +
      '<div class="ixcv-pb-menu" data-open="false">' +
        S.plans.map(function (pl, i) {
          return '<button type="button" class="ixcv-pb-item" data-cvs-plan-pick="' + esc(pl.pid) + '">' +
                 '<span class="nm">' + esc(pl.name || pl.pid) + '</span>' +
                 '<span class="ixcv-pb-sub">' + esc(pl.date || '') + '</span>' +
                 (i === 0 ? '<span class="ixcv-pb-next">Next to go</span>' : '') +
                 '</button>';
        }).join('') +
      '</div>';
  }

  // ── Stage 1 · Components ──
  function renderStage1() {
    var sub  = document.querySelector('[data-cvs-sub="cmp"]');
    var body = document.querySelector('[data-cvs-body="cmp"]');
    if (!sub || !body) return;

    sub.innerHTML =
      s1Chip('all', 'All') + s1Chip('available', 'Available') + s1Chip('attached', 'In-Use') +
      '<button type="button" class="ixcv-chip ixcv-refresh" data-cvs-refresh title="Refresh the Components feed">\u21bb</button>';

    if (S.loading) {
      body.innerHTML = '<div class="ixcv-loading"><span class="ixcv-spin"></span> Loading components\u2026</div>';
      return;
    }
    if (S.error) {
      body.innerHTML =
        '<div class="ixcv-empty">' + esc(S.error) + '<br><br>' +
        '<button type="button" class="ixcv-chip" data-cvs-retry>Retry</button></div>';
      return;
    }
    if (!S.data) { body.innerHTML = '<div class="ixcv-empty">Open the Canvas to load components.</div>'; return; }

    var all     = myMedia();
    var folders = groupByBundle(all);
    var loose   = sortComponents(findLoose(all)).filter(statusVisible);

    var html = '';
    folders.forEach(function (g) {
      var visible = sortComponents(g.items).filter(statusVisible);
      if (!visible.length) return;
      var avail = g.items.filter(function (m) { return readMediaStatus(m) === 'available'; });
      var selAvail = avail.filter(function (m) { return S.selectedIds[m.id]; });
      var selState = avail.length && selAvail.length === avail.length ? 'all'
                   : selAvail.length ? 'some' : '';
      var open = !!S.openFolders[g.id];
      html +=
        '<div class="ixcv-folder" data-cvs-folder="' + esc(g.id) + '"' +
          (selState ? ' data-sel="' + selState + '"' : '') +
          (open ? ' data-open="true"' : '') + '>' +
          '<div class="ixcv-fhead">' +
            '<span class="ixcv-fcheck">' + (selState === 'all' ? '\u2713' : '') + '</span>' +
            '<span class="ixcv-tile" data-t="fld">\u25a3</span>' +
            '<div class="ixcv-meta">' +
              '<div class="ixcv-fname">' + esc(g.label) + '</div>' +
              '<div class="ixcv-fsub">' + g.items.length + ' component' + (g.items.length === 1 ? '' : 's') +
                ' \u00b7 ' + avail.length + ' available</div>' +
            '</div>' +
            '<button type="button" class="ixcv-fx" title="Expand">\u203a</button>' +
          '</div>' +
          '<div class="ixcv-fmembers">' + visible.map(cardHtml).join('') + '</div>' +
        '</div>';
    });
    html += loose.map(cardHtml).join('');

    body.innerHTML = html || '<div class="ixcv-empty">No components match this filter.</div>';
  }

  function s1Chip(val, label) {
    return '<button type="button" class="ixcv-chip" data-cvs-s1chip="' + val + '"' +
           (S.s1Filter === val ? ' data-active="true"' : '') + '>' + label + '</button>';
  }

  function cardHtml(m) {
    var fd     = m.fieldData || {};
    var kind   = mediaTypeOf(fd);
    var meta   = KIND_META[kind];
    var status = readMediaStatus(m);
    var sel    = !!S.selectedIds[m.id];
    var attached = status === 'attached';
    var statusKey = status === 'available' ? 'available' : status === 'attached' ? 'attached' : 'other';
    return '' +
      '<div class="ixcv-card" data-cvs-media="' + esc(m.id) + '"' +
        (sel ? ' data-sel="true"' : '') +
        (attached ? ' data-attached="true"' : '') + '>' +
        '<span class="ixcv-check">' + (sel ? '\u2713' : '') + '</span>' +
        '<span class="ixcv-tile" data-t="' + meta.t + '" data-cvs-preview="' + esc(m.id) + '">' + meta.lbl + '</span>' +
        '<div class="ixcv-meta">' +
          '<div class="ixcv-name">' + esc(fd.name || fd.slug || m.id) + '</div>' +
          '<div class="ixcv-mline">' + esc(fd['bundle-label'] || '') + '</div>' +
        '</div>' +
        '<span class="ixcv-status" data-s="' + statusKey + '">' +
          (statusKey === 'attached' ? 'In use' : esc(statusKey)) + '</span>' +
      '</div>';
  }

  // ── Stage 2 · Assets ──
  function renderStage2() {
    var sub  = document.querySelector('[data-cvs-sub="ast"]');
    var body = document.querySelector('[data-cvs-body="ast"]');
    if (!sub || !body) return;

    sub.innerHTML =
      s2Chip('all', 'All') +
      Object.keys(TYPE_LABELS).map(function (t) { return s2Chip(t, TYPE_LABELS[t] + 's'); }).join('');

    if (S.loading) { body.innerHTML = '<div class="ixcv-loading"><span class="ixcv-spin"></span> Loading\u2026</div>'; return; }
    if (!S.data)   { body.innerHTML = '<div class="ixcv-empty">\u2014</div>'; return; }

    var types = S.s2Filter === 'all' ? Object.keys(TYPE_LABELS) : [S.s2Filter];
    var cards = [];
    types.forEach(function (t) {
      assetsForType(t).forEach(function (rec) { cards.push({ type: t, rec: rec }); });
    });
    cards.sort(function (a, b) { return createdStamp(b.rec) - createdStamp(a.rec); });

    body.innerHTML = cards.length
      ? cards.map(function (c) {
          var canOpen = c.type === 'article';
          return '' +
            '<div class="ixcv-acard" style="--tc:' + ASSET_ACCENT[c.type] + '">' +
              '<div class="ixcv-abadge">' + esc(TYPE_LABELS[c.type]) + '</div>' +
              '<div class="ixcv-atitle">' + esc(assetDisplayName(c.rec)) + '</div>' +
              '<div class="ixcv-afoot">' +
                (canOpen
                  ? '<button type="button" class="ixcv-chip" data-cvs-open-article="' + esc(c.rec.id) + '">Open</button>'
                  : '<span class="ixcv-mline">View \u0026 edit lands W1</span>') +
              '</div>' +
            '</div>';
        }).join('')
      : '<div class="ixcv-empty">No assets for this filter.</div>';
  }

  function s2Chip(val, label) {
    return '<button type="button" class="ixcv-chip" data-cvs-s2chip="' + val + '"' +
           (S.s2Filter === val ? ' data-active="true"' : '') + '>' + label + '</button>';
  }

  // Guarded ASF edit attempt (W0: articles only).
  function openArticleEdit(articleId) {
    if (!window.InbxASF || typeof window.InbxASF.open !== 'function') {
      toast('ASF not loaded — edit wiring lands W1; use the Library', 'warn');
      return;
    }
    try {
      window.InbxASF.open({ mode: 'edit', articleId: articleId });
      setTimeout(function () {
        if (window.InbxASF.isOpen && !window.InbxASF.isOpen()) {
          toast('Edit wiring lands W1 — use the Library for now', 'warn');
        }
      }, 400);
    } catch (err) {
      console.error(TAG, 'edit open failed:', err);
      toast('Edit wiring lands W1 — use the Library for now', 'warn');
    }
  }

  // ── Stage 3 · PubPlans ──
  function renderStage3() {
    var sub  = document.querySelector('[data-cvs-sub="pln"]');
    var body = document.querySelector('[data-cvs-body="pln"]');
    if (!sub || !body) return;
    sub.innerHTML = ''; // height-locked placeholder row (D-CVS-9 rhythm)

    var plan = selectedPlan();
    if (!plan) { body.innerHTML = '<div class="ixcv-empty">No plan selected.</div>'; return; }

    var slots = plan.slots || [];
    body.innerHTML = slots.length
      ? slots.map(function (sl) {
          var filled = slotFilledLabel(sl);
          return '' +
            '<div class="ixcv-slot">' +
              '<span class="k">' + esc(sl.slotCode) + '</span>' +
              '<span class="v"' + (filled ? '' : ' style="color:#8b8471;font-style:italic"') + '>' +
                esc(filled || 'Open') + '</span>' +
              (filled
                ? ''
                : '<button type="button" class="ixcv-chip" disabled ' +
                  'title="Assignment lands W1" style="opacity:.5;cursor:not-allowed">Assign</button>') +
            '</div>';
        }).join('')
      : '<div class="ixcv-empty">No slots harvested for ' + esc(plan.name || plan.pid) + '.</div>';
  }

  // ── Stage 4 · Newsletters (placeholder) ──
  function renderStage4() {
    var sub  = document.querySelector('[data-cvs-sub="nls"]');
    var body = document.querySelector('[data-cvs-body="nls"]');
    if (!sub || !body) return;
    sub.innerHTML = ''; // height-locked placeholder row
    body.innerHTML = '<div class="ixcv-empty">Distribution \u2014 lands with the W2 ledger + lineup scenarios.</div>';
  }

  // ═══════════════════════════════════════════
  // BOOT
  // ═══════════════════════════════════════════

  log('loaded \u2014 injecting Canvas as 8th Studio panel (polling for the strip)');

})();
