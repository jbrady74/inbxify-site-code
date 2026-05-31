/* ============================================================
   ta-asset-workbench-v0.2.0.js
   INBXIFY TA Studio — Asset Workbench (detail/management surface)
   Companion stylesheet: ta-asset-workbench-v0.2.0.css

   ────────────────────────────────────────────────────────────
   v0.2.0 — Renamed Asset Manager → Asset Workbench (window API
            InbxAssetWorkbench; class prefix awb-). Read-webhook
            hydration + real published-URL pattern
     • Hydration now fetches the full asset record (slug, refs, media
       with names + IDs) from a READ WEBHOOK (TA_CONFIG.makeAssetRead),
       so the Manager is self-sufficient: open with just an itemId from
       ANY caller (Content Library View, post-submit redirect, or
       standalone). Falls back to the InbxASF hydrator, then a stub,
       if the webhook isn't configured/returns nothing.
       async open(): renders a loading shell immediately, then re-renders
       when the read resolves.
     • Published URL pattern corrected to the REAL shape:
         {publisherBase}/articles-blog-posts/{slug}
       publisherBase read from TA_CONFIG.publisherBase. Honors an
       explicit asset.publishedUrl if the read webhook returns one.
     • Launch hooks (wire these in their host files):
         - Content Library: window._clOpenView(id) → InbxAssetWorkbench.open
         - ASF post-submit: on createAsset success, open with resp.itemId
       Both documented in the README block below; one-line wires.

   ════════════ prior ════════════
   v0.1.0 — SCAFFOLD (Article-first)
     The keystone detail surface the create loop was missing. Opens
     as an OVERLAY over the Content Library (mirrors the ASF mount
     pattern), for a single asset:
       • LEFT  — in-situ render: <iframe> of the asset's published /
                 preview URL (decision 1a). View-only.
       • RIGHT — parameters sidebar: title, refs, status, main image,
                 and a per-MEDIA list each showing a SUBTLE Name + ID
                 caption (the testing affordance Jeff asked for).
       • Default state VIEW-ONLY. An Edit button relaunches the
                 correct ASF variant in edit mode (decision 3: Article
                 first; reuses window.InbxASF.open({articleId,...}) —
                 no second editor is built).
       • HOST  — overlay (decision 2a), promotable to a Webflow page
                 later if it earns it.

     Public API (mirrors InbxASF conventions):
       window.InbxAssetWorkbench.open({ assetType, assetId })
       window.InbxAssetWorkbench.close()
       window.InbxAssetWorkbench.isOpen()
       window.InbxAssetWorkbench.version

     SCAFFOLD ASSUMPTIONS (marked @ASSUME — confirm with Jeff):
       • Published URL is built as
           {publisherBase}/{titleSlug}/article/{articleSlug}
         from TA_CONFIG + the article record. The exact published-URL
         shape is NOT yet confirmed; see buildPublishedUrl().
       • Asset hydration reuses the same CMS-on-page data ASF reads.
         A real data source (Scenario read webhook or InbxASF._internal
         .hydrateArticle) should replace hydrateAsset() in v0.2.
       • Only assetType 'article' is wired; ad/realestate/event fall
         through to a "not yet wired" notice (Article-first scaffold).

     Design system: Studio teal #1A3A3A / gold #C4A35A / cream #FAF9F5,
     DM Sans body, Fraunces display. No new aesthetic introduced.
   ============================================================ */
(function () {
  'use strict';

  var VERSION = '0.2.0';

  function log()  { try { console.log.apply(console, ['[AssetWB v' + VERSION + ']'].concat([].slice.call(arguments))); } catch (e) {} }
  function warn() { try { console.warn.apply(console, ['[AssetWB v' + VERSION + ']'].concat([].slice.call(arguments))); } catch (e) {} }

  var CFG = function () { return window.TA_CONFIG || {}; };

  // ── State ──
  var S = {
    open:      false,
    overlay:   null,
    assetType: 'article',
    assetId:   null,
    asset:     null,     // hydrated asset record
    media:     [],       // [{ mediaId, name, role, src }]
    loading:   false,
    lastEsc:   null
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Stylesheet self-load (mirrors ASF resilience) ──
  function ensureStylesLoaded() {
    var want = 'ta-asset-workbench-v' + VERSION.replace(/\./g, '.') + '.css';
    // derive from this script's own src so version always matches
    var me = document.currentScript;
    var href = null;
    if (me && me.src) {
      href = me.src.replace(/ta-asset-workbench-v[\d.]+\.js.*$/, want);
    }
    if (!href) return;
    var have = Array.prototype.some.call(
      document.querySelectorAll('link[rel="stylesheet"]'),
      function (l) { return l.href && l.href.indexOf(want) !== -1; }
    );
    if (have) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  // ── Published-URL builder — real pattern confirmed by Jeff:
  //    {publisherBase}/articles-blog-posts/{slug}
  //    e.g. https://www.inbxify.com/articles-blog-posts/article-page
  //    Honors asset.publishedUrl if the read webhook returns one. ──
  function buildPublishedUrl(asset) {
    var cfg = CFG();
    if (asset && asset.publishedUrl) return asset.publishedUrl;
    var base = (cfg.publisherBase || '').replace(/\/+$/, '');
    var slug = (asset && asset.slug) || '';
    if (!base || !slug) return '';
    var path = base + '/articles-blog-posts/' + slug;
    return path.indexOf('http') === 0 ? path : 'https://' + path;
  }

  // ── Hydration via READ WEBHOOK (TA_CONFIG.makeAssetRead) ──
  // Returns a Promise<{asset, media}>. Order of preference:
  //   1. read webhook (GET ?assetType=&assetId=) — canonical, self-sufficient
  //   2. InbxASF._internal.hydrateArticle (article only) — if webhook absent
  //   3. stub — so the shell still renders
  function hydrateAsset(assetType, assetId) {
    var cfg = CFG();
    var url = cfg.makeAssetRead;

    function normalizeMedia(arr) {
      return (arr || []).map(function (m) {
        return {
          mediaId: m.mediaId || m.id || '',
          name:    m.name || '',
          role:    m.role || m.componentRole || m['component-role'] || '',
          src:     m.src || m.imageUrl || m.image || ''
        };
      });
    }

    // 1. Read webhook (GET — Make parses query params reliably)
    if (url) {
      var q = url + (url.indexOf('?') === -1 ? '?' : '&') +
              'assetType=' + encodeURIComponent(assetType) +
              '&assetId=' + encodeURIComponent(assetId);
      return fetch(q, { method: 'GET' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          // Expected shape: { asset: {...}, media: [...] } OR a flat record
          var asset = data.asset || data;
          var media = normalizeMedia(data.media || asset.media || []);
          return { asset: asset, media: media };
        })
        .catch(function (e) {
          warn('read webhook failed, falling back', e);
          return hydrateFallback(assetType, assetId, normalizeMedia);
        });
    }
    // No webhook configured → fallback, wrapped as a resolved Promise
    return Promise.resolve(hydrateFallback(assetType, assetId, normalizeMedia));
  }

  function hydrateFallback(assetType, assetId, normalizeMedia) {
    if (assetType === 'article' &&
        window.InbxASF && window.InbxASF._internal &&
        typeof window.InbxASF._internal.hydrateArticle === 'function') {
      try {
        var a = window.InbxASF._internal.hydrateArticle(assetId);
        if (a) {
          var media = [];
          if (window.InbxASF._internal.hydrateMedia) {
            media = normalizeMedia(window.InbxASF._internal.hydrateMedia(assetId) || []);
          }
          return { asset: a, media: media };
        }
      } catch (e) { warn('hydrate via InbxASF failed', e); }
    }
    return {
      asset: { id: assetId, name: '(asset ' + assetId + ')', slug: '', publishedUrl: '' },
      media: []
    };
  }

  // ── Render ──
  function render() {
    if (!S.overlay) return;
    var panel = S.overlay.querySelector('#awb-panel');
    if (!panel) return;

    if (S.loading) {
      panel.innerHTML =
        '<div class="awb-shell">' +
          '<div class="awb-loading">' +
            '<div class="awb-spinner"></div>' +
            '<span>Loading asset…</span>' +
          '</div>' +
        '</div>';
      return;
    }

    var a   = S.asset || {};
    var url = buildPublishedUrl(a);

    panel.innerHTML =
      '<div class="awb-shell">' +
        renderHeader(a) +
        '<div class="awb-body">' +
          renderRenderPane(url) +
          renderSidebar(a) +
        '</div>' +
      '</div>';
  }

  function renderHeader(a) {
    return (
      '<div class="awb-header">' +
        '<div class="awb-header-l">' +
          '<span class="awb-eyebrow">' + esc(S.assetType.toUpperCase()) + ' · VIEW</span>' +
          '<h1 class="awb-title">' + esc(a.name || 'Untitled') + '</h1>' +
        '</div>' +
        '<div class="awb-header-r">' +
          '<button class="ix-btn ix-btn--ghost" data-awb-action="close">Close</button>' +
          '<button class="ix-btn ix-btn--primary" data-awb-action="edit">Edit</button>' +
        '</div>' +
      '</div>'
    );
  }

  function renderRenderPane(url) {
    if (!url) {
      return (
        '<div class="awb-render awb-render--empty">' +
          '<div class="awb-render-note">' +
            'No published URL available yet. Publish the asset to see it ' +
            'rendered in-situ here.' +
          '</div>' +
        '</div>'
      );
    }
    return (
      '<div class="awb-render">' +
        '<div class="awb-render-bar">' +
          '<span class="awb-render-dot"></span>' +
          '<span class="awb-render-url">' + esc(url) + '</span>' +
          '<a class="awb-render-open" href="' + esc(url) + '" target="_blank" rel="noopener">Open ↗</a>' +
        '</div>' +
        '<iframe class="awb-iframe" src="' + esc(url) + '" ' +
          'sandbox="allow-same-origin allow-scripts allow-popups" ' +
          'loading="lazy" title="Asset preview"></iframe>' +
      '</div>'
    );
  }

  function renderSidebar(a) {
    return (
      '<aside class="awb-sidebar">' +
        sbSection('Identity', [
          sbField('Name', a.name),
          sbField('Asset ID', S.assetId, true),
          sbField('Slug', a.slug),
          sbField('Status', a.publishStatus || a.status)
        ]) +
        sbSection('References', [
          sbField('Customer', a.customerName || a.customerId),
          sbField('Product', a.productName || a.productId),
          sbField('Newsletter', a.newsletterName || a.newsletterId),
          sbField('Title', a.titleName || a.titleSlug)
        ]) +
        renderMediaSection() +
      '</aside>'
    );
  }

  function sbSection(title, rowsHtml) {
    return (
      '<section class="awb-sb-section">' +
        '<h2 class="awb-sb-h">' + esc(title) + '</h2>' +
        '<div class="awb-sb-rows">' + rowsHtml.join('') + '</div>' +
      '</section>'
    );
  }

  function sbField(label, value, mono) {
    var v = (value == null || value === '') ? '—' : value;
    return (
      '<div class="awb-sb-row">' +
        '<span class="awb-sb-label">' + esc(label) + '</span>' +
        '<span class="awb-sb-value' + (mono ? ' mono' : '') + '">' + esc(v) + '</span>' +
      '</div>'
    );
  }

  // Per-MEDIA list — each shows the SUBTLE Name + ID caption (the
  // testing affordance). Main image first if present.
  function renderMediaSection() {
    var rows = (S.media || []).map(function (m) {
      var thumb = m.src
        ? '<img class="awb-media-thumb" src="' + esc(m.src) + '" alt="">'
        : '<div class="awb-media-thumb awb-media-thumb--none"></div>';
      return (
        '<div class="awb-media-item">' +
          thumb +
          '<div class="awb-media-meta">' +
            '<span class="awb-media-role">' + esc(m.role || 'Media') + '</span>' +
            // ── subtle Name + ID caption (testing) ──
            '<span class="awb-media-name">' + esc(m.name || '(unnamed)') + '</span>' +
            '<span class="awb-media-id mono">' + esc(m.mediaId || '—') + '</span>' +
          '</div>' +
        '</div>'
      );
    });
    if (!rows.length) {
      rows = ['<div class="awb-media-empty">No media attached.</div>'];
    }
    return (
      '<section class="awb-sb-section">' +
        '<h2 class="awb-sb-h">Media <span class="awb-sb-count">' + (S.media || []).length + '</span></h2>' +
        '<div class="awb-media-list">' + rows.join('') + '</div>' +
      '</section>'
    );
  }

  // ── Events ──
  function onClick(e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    var btn = t.closest ? t.closest('[data-awb-action]') : null;
    if (!btn) return;
    var action = btn.getAttribute('data-awb-action');
    if (action === 'close') { publicClose(); return; }
    if (action === 'edit')  { launchEdit();  return; }
  }

  // Edit → relaunch the correct ASF variant in edit mode (no 2nd editor).
  function launchEdit() {
    if (!window.InbxASF || typeof window.InbxASF.open !== 'function') {
      warn('Edit: window.InbxASF unavailable');
      return;
    }
    if (S.assetType !== 'article') {
      warn('Edit: only article edit is wired in v0.1.0');
      return;
    }
    var id = S.assetId;
    publicClose();
    // ASF edit mode hydrates from the article id (existing spine).
    window.InbxASF.open({ assetType: 'article', articleId: id });
  }

  // ── Mount / unmount (mirrors ASF) ──
  function mount() {
    ensureStylesLoaded();
    if (S.overlay && S.overlay.parentNode) {
      try { S.overlay.parentNode.removeChild(S.overlay); } catch (e) {}
    }
    Array.prototype.forEach.call(
      document.querySelectorAll('.ta-asset-workbench'),
      function (el) { try { el.remove(); } catch (e) {} }
    );

    S.overlay = document.createElement('div');
    S.overlay.className = 'ta-asset-workbench';
    S.overlay.innerHTML =
      '<div class="awb-overlay">' +
        '<div class="awb-panel" id="awb-panel"></div>' +
      '</div>';
    document.body.appendChild(S.overlay);
    document.body.classList.add('awb-open');

    S.overlay.addEventListener('click', onClick);

    S.lastEsc = function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        publicClose();
      }
    };
    document.addEventListener('keydown', S.lastEsc);
  }

  function unmount() {
    if (S.lastEsc) {
      document.removeEventListener('keydown', S.lastEsc);
      S.lastEsc = null;
    }
    if (S.overlay && S.overlay.parentNode) {
      try { S.overlay.parentNode.removeChild(S.overlay); } catch (e) {}
    }
    S.overlay = null;
    document.body.classList.remove('awb-open');
  }

  // ── Public API ──
  function publicOpen(params) {
    params = params || {};
    var assetType = params.assetType || 'article';
    var assetId   = params.assetId || params.articleId || params.itemId;
    if (!assetId) { warn('open(): assetId required'); return false; }

    if (S.open) publicClose();

    S.assetType = assetType;
    S.assetId   = assetId;
    S.asset     = null;
    S.media     = [];
    S.loading   = true;

    mount();
    render();            // loading shell
    S.open = true;
    log('open()', { assetType: assetType, assetId: assetId });

    hydrateAsset(assetType, assetId).then(function (h) {
      if (!S.open || S.assetId !== assetId) return;  // closed/changed mid-flight
      S.asset   = h.asset;
      S.media   = h.media;
      S.loading = false;
      render();
      log('hydrated', { media: S.media.length, slug: S.asset && S.asset.slug });
    });

    return true;
  }

  function publicClose() {
    if (!S.open) return;
    log('close()');
    unmount();
    S.open  = false;
    S.asset = null;
    S.media = [];
    S.assetId = null;
  }

  function publicIsOpen() { return !!S.open; }

  window.InbxAssetWorkbench = {
    open:    publicOpen,
    close:   publicClose,
    isOpen:  publicIsOpen,
    version: VERSION,
    _internal: { state: S, render: render, hydrateAsset: hydrateAsset, buildPublishedUrl: buildPublishedUrl }
  };

  ensureStylesLoaded();
  log('mounted · v' + VERSION + ' · Article-first scaffold · overlay over Content Library');
})();
