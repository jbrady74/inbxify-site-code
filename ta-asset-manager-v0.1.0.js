/* ============================================================
   ta-asset-manager-v0.1.0.js
   INBXIFY TA Studio — Asset Manager (detail/management surface)
   Companion stylesheet: ta-asset-manager-v0.1.0.css

   ────────────────────────────────────────────────────────────
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
       window.InbxAssetManager.open({ assetType, assetId })
       window.InbxAssetManager.close()
       window.InbxAssetManager.isOpen()
       window.InbxAssetManager.version

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

  var VERSION = '0.1.0';

  function log()  { try { console.log.apply(console, ['[AssetMgr v' + VERSION + ']'].concat([].slice.call(arguments))); } catch (e) {} }
  function warn() { try { console.warn.apply(console, ['[AssetMgr v' + VERSION + ']'].concat([].slice.call(arguments))); } catch (e) {} }

  var CFG = function () { return window.TA_CONFIG || {}; };

  // ── State ──
  var S = {
    open:      false,
    overlay:   null,
    assetType: 'article',
    assetId:   null,
    asset:     null,     // hydrated asset record
    media:     [],       // [{ mediaId, name, role, src }]
    lastEsc:   null
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Stylesheet self-load (mirrors ASF resilience) ──
  function ensureStylesLoaded() {
    var want = 'ta-asset-manager-v' + VERSION.replace(/\./g, '.') + '.css';
    // derive from this script's own src so version always matches
    var me = document.currentScript;
    var href = null;
    if (me && me.src) {
      href = me.src.replace(/ta-asset-manager-v[\d.]+\.js.*$/, want);
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

  // ── Published-URL builder (@ASSUME — confirm shape with Jeff) ──
  function buildPublishedUrl(asset) {
    var cfg = CFG();
    if (asset && asset.publishedUrl) return asset.publishedUrl; // honored if present
    var base = (cfg.publisherBase || '').replace(/\/+$/, '');
    var tslug = cfg.titleSlug || '';
    var aslug = (asset && asset.slug) || '';
    if (!aslug) return '';
    // @ASSUME path shape — adjust once confirmed
    var path = [base, tslug, 'article', aslug].filter(Boolean).join('/');
    return path ? (path.indexOf('http') === 0 ? path : 'https://' + path) : '';
  }

  // ── Hydration (@ASSUME — replace with real source in v0.2) ──
  function hydrateAsset(assetType, assetId) {
    // Preferred: reuse ASF's hydrator if exposed (Article only today).
    if (assetType === 'article' &&
        window.InbxASF && window.InbxASF._internal &&
        typeof window.InbxASF._internal.hydrateArticle === 'function') {
      try {
        var a = window.InbxASF._internal.hydrateArticle(assetId);
        if (a) {
          var media = [];
          if (window.InbxASF._internal.hydrateMedia) {
            var hm = window.InbxASF._internal.hydrateMedia(assetId) || [];
            media = hm.map(function (m) {
              return {
                mediaId: m.mediaId || m.id || '',
                name:    m.name || '',
                role:    m.role || m.componentRole || '',
                src:     m.src || m.imageUrl || ''
              };
            });
          }
          return { asset: a, media: media };
        }
      } catch (e) { warn('hydrate via InbxASF failed', e); }
    }
    // Fallback stub so the scaffold renders even without a data source.
    return {
      asset: { id: assetId, name: '(asset ' + assetId + ')', slug: '', publishedUrl: '' },
      media: []
    };
  }

  // ── Render ──
  function render() {
    if (!S.overlay) return;
    var panel = S.overlay.querySelector('#am-panel');
    if (!panel) return;

    var a   = S.asset || {};
    var url = buildPublishedUrl(a);

    panel.innerHTML =
      '<div class="am-shell">' +
        renderHeader(a) +
        '<div class="am-body">' +
          renderRenderPane(url) +
          renderSidebar(a) +
        '</div>' +
      '</div>';
  }

  function renderHeader(a) {
    return (
      '<div class="am-header">' +
        '<div class="am-header-l">' +
          '<span class="am-eyebrow">' + esc(S.assetType.toUpperCase()) + ' · VIEW</span>' +
          '<h1 class="am-title">' + esc(a.name || 'Untitled') + '</h1>' +
        '</div>' +
        '<div class="am-header-r">' +
          '<button class="ix-btn ix-btn--ghost" data-am-action="close">Close</button>' +
          '<button class="ix-btn ix-btn--primary" data-am-action="edit">Edit</button>' +
        '</div>' +
      '</div>'
    );
  }

  function renderRenderPane(url) {
    if (!url) {
      return (
        '<div class="am-render am-render--empty">' +
          '<div class="am-render-note">' +
            'No published URL available yet. Publish the asset to see it ' +
            'rendered in-situ here.' +
          '</div>' +
        '</div>'
      );
    }
    return (
      '<div class="am-render">' +
        '<div class="am-render-bar">' +
          '<span class="am-render-dot"></span>' +
          '<span class="am-render-url">' + esc(url) + '</span>' +
          '<a class="am-render-open" href="' + esc(url) + '" target="_blank" rel="noopener">Open ↗</a>' +
        '</div>' +
        '<iframe class="am-iframe" src="' + esc(url) + '" ' +
          'sandbox="allow-same-origin allow-scripts allow-popups" ' +
          'loading="lazy" title="Asset preview"></iframe>' +
      '</div>'
    );
  }

  function renderSidebar(a) {
    return (
      '<aside class="am-sidebar">' +
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
      '<section class="am-sb-section">' +
        '<h2 class="am-sb-h">' + esc(title) + '</h2>' +
        '<div class="am-sb-rows">' + rowsHtml.join('') + '</div>' +
      '</section>'
    );
  }

  function sbField(label, value, mono) {
    var v = (value == null || value === '') ? '—' : value;
    return (
      '<div class="am-sb-row">' +
        '<span class="am-sb-label">' + esc(label) + '</span>' +
        '<span class="am-sb-value' + (mono ? ' mono' : '') + '">' + esc(v) + '</span>' +
      '</div>'
    );
  }

  // Per-MEDIA list — each shows the SUBTLE Name + ID caption (the
  // testing affordance). Main image first if present.
  function renderMediaSection() {
    var rows = (S.media || []).map(function (m) {
      var thumb = m.src
        ? '<img class="am-media-thumb" src="' + esc(m.src) + '" alt="">'
        : '<div class="am-media-thumb am-media-thumb--none"></div>';
      return (
        '<div class="am-media-item">' +
          thumb +
          '<div class="am-media-meta">' +
            '<span class="am-media-role">' + esc(m.role || 'Media') + '</span>' +
            // ── subtle Name + ID caption (testing) ──
            '<span class="am-media-name">' + esc(m.name || '(unnamed)') + '</span>' +
            '<span class="am-media-id mono">' + esc(m.mediaId || '—') + '</span>' +
          '</div>' +
        '</div>'
      );
    });
    if (!rows.length) {
      rows = ['<div class="am-media-empty">No media attached.</div>'];
    }
    return (
      '<section class="am-sb-section">' +
        '<h2 class="am-sb-h">Media <span class="am-sb-count">' + (S.media || []).length + '</span></h2>' +
        '<div class="am-media-list">' + rows.join('') + '</div>' +
      '</section>'
    );
  }

  // ── Events ──
  function onClick(e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    var btn = t.closest ? t.closest('[data-am-action]') : null;
    if (!btn) return;
    var action = btn.getAttribute('data-am-action');
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
      document.querySelectorAll('.ta-asset-manager'),
      function (el) { try { el.remove(); } catch (e) {} }
    );

    S.overlay = document.createElement('div');
    S.overlay.className = 'ta-asset-manager';
    S.overlay.innerHTML =
      '<div class="am-overlay">' +
        '<div class="am-panel" id="am-panel"></div>' +
      '</div>';
    document.body.appendChild(S.overlay);
    document.body.classList.add('am-open');

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
    document.body.classList.remove('am-open');
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

    var h = hydrateAsset(assetType, assetId);
    S.asset = h.asset;
    S.media = h.media;

    mount();
    render();
    S.open = true;
    log('open()', { assetType: assetType, assetId: assetId, media: S.media.length });
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

  window.InbxAssetManager = {
    open:    publicOpen,
    close:   publicClose,
    isOpen:  publicIsOpen,
    version: VERSION,
    _internal: { state: S, render: render, hydrateAsset: hydrateAsset, buildPublishedUrl: buildPublishedUrl }
  };

  ensureStylesLoaded();
  log('mounted · v' + VERSION + ' · Article-first scaffold · overlay over Content Library');
})();
