/* ============================================================
   ta-asset-workbench-v0.4.3.js
   INBXIFY TA Studio — Asset Workbench (detail/management surface)
   Companion stylesheet: ta-asset-workbench-v0.4.2.css

   ────────────────────────────────────────────────────────────
   v0.4.3 — INITIATIVE: Asset View = faithful standalone render (article).
     Replaces the LEFT-pane iframe page-preview for ARTICLE with a
     standalone render of the asset itself — no page, no iframe, no
     chrome. Kills the 404 class for article View (it never loads a
     page URL again). renderRenderPane() now branches: assetType
     'article' → renderArticleStandalone() reading S.asset.fieldData;
     ad/event/RE keep the existing iframe pane until their own sessions.
     Render order: Title → Teaser Summary (post-summary) → Hero (MAIN
     Image) → Writer → Share bar → Body (article-body-rte, unescaped +
     injected). Body resolves resiliently across slugs (post-body /
     article-body-rte / body / article-body) and auto-unescapes if it
     arrives entity-escaped (as the page embed ships it).
     CSS: article typography BAKED into the companion stylesheet scoped
     under .awb-article-render (production parity). HARDCODING — see
     HC block in the CSS + Hardcoding-Tracker: this duplicates the live
     article template <head> typography (Spectral 20/1.9 body per SS1,
     Fraunces teal H2/H3, 33/50/75/100 image sizes). If the article
     template typography changes, this must change in lockstep, OR move
     both to a shared stylesheet the article page + View load by ref.
   v0.4.2 — Webhook robustness (matches ta-asf v1.5.7). The 120 read
     webhook intermittently returned 410 / plain-text ("Accepted" / "There
     is no scenario listening") when overlapping calls hit Make under load
     — rejected requests that never ran (history stays clean) but blanked
     the panel. FIX: fetchJsonWithRetry() retries once after ~1s on a
     non-OK / non-JSON response (real runs are instant-success, so the
     retry lands). Plus the post-save re-open (v0.4.1) now cancels any
     in-flight open for the same asset so it doesn't race itself.
   v0.4.1 — Post-save sidebar refresh. After an ASF edit-save, the
     Workbench sidebar showed stale data (e.g. a saved Product not
     appearing) until a manual page refresh — the panel never re-read.
     FIX: launchEdit() stashes the edit target; ASF fires inbx:asset-saved
     on save success (ta-asf v1.5.6); the Workbench listens and re-opens
     itself on that asset → re-hydrates from 120 → fresh sidebar, no
     manual refresh. Guarded to only re-open if the saved asset matches
     what was being edited.
   v0.4.0 — TD-211 · Edit now hands off in EDIT mode for ALL asset types.
     launchEdit() passes mode:'edit' (+ assetType + assetId); ASF v1.4.0
     hydrates ad/event/RE from the Workbench Read webhook instead of
     force-creating. Article unchanged. (Save-back for ad/event/RE is
     TD-216 — editing persists for article only until then.)
   v0.3.3 — LEFT-pane iframe now loads through the preview proxy
     (inbxify-preview-proxy) so the published page can be framed.
     Webflow serves CSP frame-ancestors 'self', which blocked the
     in-situ <iframe> (broken-doc, never rendered). NEW buildPreviewUrl()
     wraps the real published URL through TA_CONFIG.previewProxy; iframe
     src uses it. The URL bar text + "Open ↗" link still use the RAW
     buildPublishedUrl() (top-level nav, no framing issue). Proxy host
     in TA_CONFIG.previewProxy (config, not hardcoded — matches
     publisherBase/makeWorkbenchRead). Closes TD-215.
     v0.3.2 — normalizeMedia hardened: coerces single-object media to array,
     handles fieldData-as-string (bare URL); filters empty rows.
     v0.3.1 — tolerates Make aggregator fieldData shape;
     all-asset-type support (article/ad/event/realestate)
     • buildPublishedUrl now per-type (PAGE_PATHS): article →
       /articles-blog-posts, ad → /advertisements, event →
       /library-calendar-events, realestate → /real-estate-library.
     • Sidebar is type-aware: Identity always, then a per-type detail
       section (Advertisement / Event / Listing / References) +
       the media list with Name+ID captions.
     • Edit button relaunches ASF with the real assetType (ASF forces
       create for non-article until ASF edit-hydration ships; passes
       type+id so it works unchanged when that lands).

   ════════════ prior ════════════
   v0.2.0 — Renamed Asset Manager → Asset Workbench (window API
            InbxAssetWorkbench; class prefix awb-). Read-webhook
            hydration + real published-URL pattern
     • Hydration now fetches the full asset record (slug, refs, media
       with names + IDs) from a READ WEBHOOK (TA_CONFIG.makeWorkbenchRead),
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

  var VERSION = '0.4.3';

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

  // ── Published-URL builder — per-type page-path patterns (confirmed
  //    by Jeff). All are {publisherBase}/{pagePath}/{slug}.
  //      article     → /articles-blog-posts/{slug}
  //      ad          → /advertisements/{slug}
  //      event       → /library-calendar-events/{slug}
  //      realestate  → /real-estate-library/{slug}
  //    Honors asset.publishedUrl if the read webhook returns one. ──
  var PAGE_PATHS = {
    article:    'articles-blog-posts',
    ad:         'advertisements',
    event:      'library-calendar-events',
    realestate: 'real-estate-library'
  };
  function buildPublishedUrl(asset) {
    var cfg = CFG();
    if (asset && asset.publishedUrl) return asset.publishedUrl;
    var base = (cfg.publisherBase || '').replace(/\/+$/, '');
    var slug = (asset && asset.slug) || '';
    var seg  = PAGE_PATHS[S.assetType] || PAGE_PATHS.article;
    if (!base || !slug) return '';
    var path = base + '/' + seg + '/' + slug;
    return path.indexOf('http') === 0 ? path : 'https://' + path;
  }

  // ── Preview-URL wrapper — iframe src ONLY ──
  //    Webflow publishes pages with CSP `frame-ancestors 'self'`, which
  //    blocks the LEFT-pane <iframe> cross-origin. The preview proxy
  //    (inbxify-preview-proxy) fetches the page server-side, strips
  //    frame-ancestors, and injects <base href> so sub-resources resolve.
  //    The URL bar + "Open" link keep using the RAW buildPublishedUrl().
  function buildPreviewUrl(asset) {
    var real = buildPublishedUrl(asset);
    if (!real) return '';
    var proxy = (CFG().previewProxy ||
      'https://inbxify-preview-proxy.jeff-2cd.workers.dev').replace(/\/+$/, '');
    return proxy + '/?url=' + encodeURIComponent(real);
  }

  // ── Hydration via READ WEBHOOK (TA_CONFIG.makeWorkbenchRead) ──
  // Returns a Promise<{asset, media}>. Order of preference:
  //   1. read webhook (GET ?assetType=&assetId=) — canonical, self-sufficient
  //   2. InbxASF._internal.hydrateArticle (article only) — if webhook absent
  //   3. stub — so the shell still renders
  // v0.4.2: GET expecting JSON; retry once after ~1s on non-OK / non-JSON
  // (Make rejects overlapping webhook calls with 410 / plain text; a beat
  // later the slot frees and the retry succeeds).
  function fetchJsonWithRetry(url, retries, delayMs) {
    if (retries == null) retries = 1;
    if (delayMs == null) delayMs = 1000;
    return fetch(url, { method: 'GET' })
      .then(function (r) {
        return r.text().then(function (text) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          var t = (text || '').trim();
          if (!t || (t[0] !== '{' && t[0] !== '[')) throw new Error('non-JSON: ' + t.slice(0, 60));
          try { return JSON.parse(t); } catch (e) { throw new Error('parse fail'); }
        });
      })
      .catch(function (err) {
        if (retries > 0) {
          warn('WB fetchJsonWithRetry: ' + (err && err.message) + ' — retry in ' + delayMs + 'ms');
          return new Promise(function (res) { setTimeout(res, delayMs); })
            .then(function () { return fetchJsonWithRetry(url, retries - 1, delayMs); });
        }
        throw err;
      });
  }

  function hydrateAsset(assetType, assetId) {
    var cfg = CFG();
    var url = cfg.makeWorkbenchRead;

    function normalizeMedia(arr) {
      // Make can emit media as a single object (one item) instead of an
      // array, and fieldData as either the full object or just a URL string.
      // Coerce to array, tolerate all shapes.
      if (arr == null) return [];
      if (!Array.isArray(arr)) arr = [arr];   // single object → [object]
      return arr.map(function (m) {
        if (m == null) return { mediaId:'', name:'', role:'', src:'' };
        var fd = m.fieldData || m.fielddata || {};
        // fieldData arriving as a bare URL string → treat as src
        var fdIsString = (typeof fd === 'string');
        return {
          mediaId: m.mediaId || m.id || '',
          name:    m.name || (fdIsString ? '' : (fd.name || '')),
          role:    m.role || m.componentRole || m['component-role'] ||
                   (fdIsString ? '' : (fd['component-role'] || fd.componentRole || '')),
          src:     m.src || m.imageUrl || m.image ||
                   (fdIsString ? fd :
                     (fd['image-url'] || fd.imageUrl || fd.image || ''))
        };
      }).filter(function (x) { return x.mediaId || x.src || x.name; });
    }

    // 1. Read webhook (GET — Make parses query params reliably)
    if (url) {
      var q = url + (url.indexOf('?') === -1 ? '?' : '&') +
              'assetType=' + encodeURIComponent(assetType) +
              '&assetId=' + encodeURIComponent(assetId);
      return fetchJsonWithRetry(q, 1)
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
          renderRenderPane(url, buildPreviewUrl(a)) +
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

  // v0.4.3: article → faithful STANDALONE render (no page, no iframe).
  // ad/event/RE keep the iframe pane until their own View sessions land.
  function renderRenderPane(url, previewUrl) {
    if (S.assetType === 'article') {
      return renderArticleStandalone(S.asset || {});
    }
    // ── non-article: existing iframe page-preview (unchanged) ──
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
        '<iframe class="awb-iframe" src="' + esc(previewUrl) + '" ' +
          'sandbox="allow-same-origin allow-scripts allow-popups" ' +
          'loading="lazy" title="Asset preview"></iframe>' +
      '</div>'
    );
  }

  // ── v0.4.3 · Article standalone render ──────────────────────────
  // Faithful reproduction of the on-page article presentation, with NO
  // page chrome (no nav, masthead, sidebar ads, footer, modals). Reads
  // straight from the hydrated asset record (Scenario 120 fieldData) —
  // never scrapes or frames a page. Typography parity is provided by the
  // baked .awb-article-render CSS in the companion stylesheet.

  // Pull a field across the shapes the read can return: fieldData keyed
  // by Webflow slug (canonical), or already-flattened onto the asset.
  function fld(a, keys) {
    var fd = (a && (a.fieldData || a.fielddata)) || {};
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (fd[k] != null && fd[k] !== '') return fd[k];
      if (a[k]  != null && a[k]  !== '') return a[k];
    }
    return '';
  }

  // Body may arrive entity-escaped (the article page ships .article-body-rte
  // as an escaped string inside a w-embed) OR as raw HTML. Detect & unescape
  // ONCE so the real tags inject and the formatting shows.
  function unescapeIfNeeded(s) {
    s = String(s == null ? '' : s);
    if (!s) return '';
    // Heuristic: contains escaped tag entities but no live block tags.
    var looksEscaped = (s.indexOf('&lt;') !== -1 || s.indexOf('&gt;') !== -1) &&
                       !/<(h2|h3|div|p|figure|img|br)\b/i.test(s);
    if (!looksEscaped) return s;
    var ta = document.createElement('textarea');
    ta.innerHTML = s;
    return ta.value;
  }

  // MAIN Image: the read may hand back a media object, a URL string, or a
  // slug-keyed field. Resolve to a displayable src; fall back to the first
  // media row if no explicit hero field is present.
  function resolveHeroSrc(a) {
    var direct = fld(a, ['main-image', 'mainImage', 'main_image', 'hero', 'image']);
    if (direct && typeof direct === 'object') {
      direct = direct.url || direct.src || direct['image-url'] || '';
    }
    if (typeof direct === 'string' && direct) return direct;
    var first = (S.media || [])[0];
    return (first && first.src) || '';
  }

  function renderArticleStandalone(a) {
    var title   = fld(a, ['article-title', 'name', 'title']) || a.name || 'Untitled';
    var summary = fld(a, ['post-summary', 'article-teaser-summary', 'summary', 'excerpt']);
    var writer  = fld(a, ['written-by', 'writer', 'author', 'byline', 'writer-name']);
    var heroSrc = resolveHeroSrc(a);
    var heroAlt = fld(a, ['alt-text-for-main-image', 'main-image-alt', 'hero-alt']) || '';
    var bodyRaw = fld(a, ['post-body', 'article-body-rte', 'body', 'article-body']);
    var bodyHtml = unescapeIfNeeded(bodyRaw);

    var parts = [];

    // Title
    parts.push('<h1 class="awb-art-title">' + esc(title) + '</h1>');

    // Teaser Summary — ABOVE the hero, plain text, SS1 typography
    if (summary) {
      parts.push('<p class="awb-art-summary">' + esc(summary) + '</p>');
    }

    // Hero (MAIN Image)
    if (heroSrc) {
      parts.push(
        '<figure class="awb-art-hero">' +
          '<img src="' + esc(heroSrc) + '" alt="' + esc(heroAlt) + '" loading="lazy">' +
        '</figure>'
      );
    }

    // Writer
    if (writer) {
      parts.push(
        '<div class="awb-art-writer">' +
          '<span class="awb-art-writer-label">WRITTEN BY:</span> ' +
          '<span class="awb-art-writer-name">' + esc(writer) + '</span>' +
        '</div>'
      );
    }

    // Share bar — faithful to the on-page Option-A minimal circles. Static
    // (View is a render, not the live page) — labels/affordance only.
    parts.push(renderArticleShareBar());

    // Body — unescaped article RTE injected as real HTML. NOT esc()'d:
    // this is trusted operator-only content from our own CMS, rendered in
    // the operator-only Studio overlay. .article-body-rte class carries the
    // baked typography so it matches production.
    if (bodyHtml) {
      parts.push(
        '<div class="awb-art-body">' +
          '<div class="article-body-rte">' + bodyHtml + '</div>' +
        '</div>'
      );
    } else {
      parts.push('<div class="awb-art-body awb-art-body--empty">No body content.</div>');
    }

    return (
      '<div class="awb-render awb-render--standalone">' +
        '<div class="awb-art-scroll">' +
          '<article class="awb-article-render">' +
            parts.join('') +
          '</article>' +
        '</div>' +
      '</div>'
    );
  }

  // Static reproduction of the on-page Share bar (visual parity only).
  function renderArticleShareBar() {
    return (
      '<div class="awb-art-share" aria-hidden="true">' +
        '<span class="awb-art-share-label">Share</span>' +
        '<span class="awb-art-share-btn">' +
          '<svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>' +
        '</span>' +
        '<span class="awb-art-share-btn">' +
          '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' +
        '</span>' +
        '<span class="awb-art-share-btn">' +
          '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>' +
        '</span>' +
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
        renderTypeSection(a) +
        renderMediaSection() +
      '</aside>'
    );
  }

  // Per-type detail section — the fields that matter for each asset type.
  function renderTypeSection(a) {
    if (S.assetType === 'ad') {
      return sbSection('Advertisement', [
        sbField('Advertiser', a.advertiserName || a.customerName || a.associatedAdvertiser),
        sbField('Banner Link', a.bannerAdLink),
        sbField('Sidebar Link', a.sidebarAdLink),
        sbField('Splash Link', a.splashAdLink),
        sbField('Redirect', a.redirectLink)
      ]);
    }
    if (S.assetType === 'event') {
      return sbSection('Event', [
        sbField('Venue', a.eventVenue || a.venue),
        sbField('Address', a.eventVenueAddress || a.address),
        sbField('Date', a.eventDate || a.date),
        sbField('Redirect', a.eventRedirectLink || a.redirectLink)
      ]);
    }
    if (S.assetType === 'realestate') {
      return sbSection('Listing', [
        sbField('Address', a.propertyAddress || a.name),
        sbField('Price', a.price || a.listingPrice),
        sbField('Listing Status', a.listingStatus),
        sbField('Agent', a.listingAgentName || a.agentName),
        sbField('Listing Link', a.listingLink)
      ]);
    }
    // article (default)
    return sbSection('References', [
      sbField('Customer', a.customerName || a.customerId),
      sbField('Product', a.productName || a.productId),
      sbField('Newsletter', a.newsletterName || a.newsletterId),
      sbField('Title', a.titleName || a.titleSlug)
    ]);
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

  // Edit → relaunch the correct ASF variant in EDIT mode for this asset
  // type. v0.4.0 (TD-211): ASF v1.4.0 hydrates all 4 types — article via
  // DOM, ad/event/RE via the Workbench Read webhook. We pass mode:'edit'
  // explicitly plus assetType + both id keys (articleId for the article
  // path, assetId for the async path). Save-back for ad/event/RE is TD-216.
  function launchEdit() {
    if (!window.InbxASF || typeof window.InbxASF.open !== 'function') {
      warn('Edit: window.InbxASF unavailable');
      return;
    }
    var id   = S.assetId;
    var type = S.assetType || 'article';
    // v0.4.1: remember what we're editing so the inbx:asset-saved listener
    // can re-open + re-hydrate this asset after ASF saves.
    _lastEdit = { assetType: type, assetId: id };
    publicClose();
    window.InbxASF.open({ mode: 'edit', assetType: type, articleId: id, assetId: id });
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

  // v0.4.1: last asset handed to ASF for editing (set by launchEdit),
  // so the save-event listener knows what to re-open.
  var _lastEdit = null;

  // v0.4.1: when ASF reports a successful save, re-open the Workbench on
  // that asset so the sidebar reflects the saved values (re-reads 120).
  window.addEventListener('inbx:asset-saved', function (e) {
    var d = (e && e.detail) || {};
    var t = d.assetType, id = d.itemId;
    if (!id) return;
    // Only re-open if it matches what we last sent to edit (avoid hijacking
    // saves that originated elsewhere).
    if (_lastEdit && _lastEdit.assetId === id) {
      // small delay so ASF's own close (350ms) completes first
      setTimeout(function () { publicOpen({ assetType: t || _lastEdit.assetType, assetId: id }); }, 400);
      _lastEdit = null;
    }
  });

  window.InbxAssetWorkbench = {
    open:    publicOpen,
    close:   publicClose,
    isOpen:  publicIsOpen,
    version: VERSION,
    _internal: { state: S, render: render, hydrateAsset: hydrateAsset, buildPublishedUrl: buildPublishedUrl }
  };

  ensureStylesLoaded();
  log('mounted · v' + VERSION + ' · article standalone render · ad/event/RE iframe pane');
})();
