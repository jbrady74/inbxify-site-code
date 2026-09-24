/* ta-asf-article-v1.0.0.js */
/* ============================================================
   ta-asf-article-v1.0.0.js
   INBXIFY TA Studio — the Article form of the ASF (create and edit)

   SPEC: inbxify-asf-mockup-v0_10.html (build spec, 24 Sept 2026).
   If this file and the mockup disagree, this file is wrong.

   WHAT THIS FILE IS
     ta-asf (v1.11.0+) owns the overlay, the save routes, hydration,
     uploads, the library modal, the pickers, the new-customer path
     and AI assist. When the asset type is Article it hands the panel
     to this module, which draws the reordered three-column form and
     runs everything the mockup added:
       · Facts / Words / Images columns, dense, coloured group heads
       · readiness as ticks in the top bar
       · one tray holding every image of this article; Main and OG
         are set ONLY with the buttons on each Images card
       · captions and alt text edited on the card, saved to MEDIA
       · Images collapses to a rail, and reopens by itself whenever
         a photo becomes unused
       · one Save for everything; gold border + "cancel" on every
         changed field; top-bar Cancel reverts all

   THE CONTRACT WITH ta-asf
     window.InbxASFArticle = { connect, render, handle, save,
                               hasPending, onSaveState, onClose,
                               addGeneratedImage, version }
     ta-asf calls connect(bridge) once, then render(panel) every time
     it would have repainted the Article form. render() builds the
     form once per open (and once per saved baseline) and after that
     only PATCHES it, so the body editor, focus, scroll and the More
     panel survive every repaint.
     ta-asf offers every overlay event to handle(type, e) first. A
     true return means this module handled it.

   STATE
     All article values live on the ta-asf state object (S.article,
     S.dirtyFields). This module writes both the same way ta-asf's
     own setters do, so createAsset / updateAsset read exactly what
     is on screen. Dirty entries are always { from, to } (v1.5.38).
     Caption and alt edits are held here until Save, then written to
     MEDIA through Scenario G's updateMediaText route.

   CSS: ta-asf-article-v1.0.1.css + ix-form-controls-v1.1.0.css.
   Root markup: <div class="asf2 ix-dense ix-surface-scope">.
   Class names are the mockup's. No inline styles.

   MULTI-TENANT: every option list comes from the page or TA_CONFIG.
   Hardcoded values are listed in HC below with provisional ids.
   ============================================================ */
(function () {
  'use strict';

  var VERSION = '1.0.0';

  /* ── HC · provisional hardcoding entries (doc-maintenance chat
        assigns real numbers). Each is a platform constant, never a
        publisher or title value. ─────────────────────────────── */
  var HC = {
    // HC-P-FMB1-1 · print-match confidence below which a card says
    // "check". Platform constant until Jeff rules it per title.
    printMatchCheckBelow: 75,
    // HC-P-AAB1-1 · Paid switch on. ARTICLES paid-article is live
    // (24 Sept). Set false to hide the obligation flow in one place.
    paidLive: true,
    // HC-P-AAB1-2 · Uploadcare preview used for card and slot photos.
    thumbTransform: '-/preview/640x640/-/format/auto/-/quality/smart/',
    // HC-P-AAB1-3 · target lengths carried unchanged from v1.10.0
    // (renderMainTeaser / renderMainShortSummary). Maximums come from
    // ta-asf CFG.limits; these are the lower edge of the green band.
    teaserMin: 350,
    shortSummaryMin: 120
  };

  var B = null;          // bridge from ta-asf
  var S = null;          // ta-asf state (B.state)

  /* ── Field definitions. Order = order on screen (mockup v0.10). ──
     key = the ta-asf state key. Nothing here is tenant data. */
  var FACT_GROUPS = [
    { n: '1', title: 'Placement', fields: [
      { key: 'printIssueSource', label: 'Print source', kind: 'text' },
      { key: 'sectionId', label: 'Section', kind: 'select', opts: 'section' },
      { key: 'customerId', label: 'Customer', kind: 'select', opts: 'customer' },
      // Paid is the question that matters (ruled 24 Sept). Paid + Customer
      // leads to an OBLIGATION: connect an open one or create one.
      { pair: [
        { key: 'isPaid', label: 'Paid', kind: 'switch', text: 'Paid article' },
        { key: '_type', label: 'Type', kind: 'select', opts: 'articleType' } ] },
      { key: 'obligationId', label: 'Obligation', kind: 'select', opts: 'obligation' }
    ]},
    { n: '2', title: 'People', fields: [
      { pair: [
        { key: 'writerName', label: 'Writer', kind: 'text' },
        { key: 'writerTitle', label: 'Title', kind: 'text' } ] },
      { pair: [
        { key: 'cowriterName', label: 'Co-writer', kind: 'text' },
        { key: 'cowriterTitle', label: 'Title', kind: 'text' } ] },
      { pair: [
        { key: 'photographer', label: 'Photographer', kind: 'text' },
        { key: 'showPhotoCredits', label: 'Credits', kind: 'switch', text: 'Show' } ] }
    ]}
  ];
  var MORE = [
    { pair: [
      { key: 'ctaButton', label: 'CTA button label', kind: 'text' },
      { key: 'ctaUrl', label: 'CTA URL', kind: 'text' } ] },
    { key: 'ctaText', label: 'CTA text', kind: 'textarea' },
    { key: 'slug', label: 'Slug', kind: 'text' },
    { key: 'bannerStatement', label: 'Banner', kind: 'text' },
    // Unused today; kept reachable, not in the way (ruled 24 Sept).
    { key: 'revenueType', label: 'Revenue type', kind: 'select', opts: 'revenue' },
    { pair: [
      { key: 'videoUrl', label: 'Video URL', kind: 'text' },
      { key: 'audioUrl', label: 'Audio URL', kind: 'text' } ] }
  ];
  var WORDS = [
    { key: 'name', label: 'Headline', kind: 'text', req: true, cls: 'asf2-headline' },
    { key: 'subtitle', label: 'Subtitle', kind: 'text' },
    { pair: [
      { key: 'teaser', label: 'Teaser', kind: 'textarea' },
      { key: 'shortSummary', label: 'Short summary', kind: 'textarea' } ] }
  ];

  // Every article key this form edits and therefore owns the dirty
  // entry for. Image keys are owned through the roles model below.
  var FIELD_KEYS = [
    'name', 'subtitle', 'teaser', 'shortSummary',
    'printIssueSource', 'sectionId', 'customerId', 'isPaid', 'revenueType',
    'writerName', 'writerTitle', 'cowriterName', 'cowriterTitle',
    'photographer', 'showPhotoCredits',
    'ctaButton', 'ctaUrl', 'ctaText', 'slug', 'bannerStatement',
    'videoUrl', 'audioUrl', 'photoEssay', 'videoArticle', 'galleryMediaIds'
  ];
  var BOOL_KEYS = { isPaid: 1, showPhotoCredits: 1, photoEssay: 1, videoArticle: 1 };
  var IMAGE_KEYS = ['mainImageSrc', 'mainImageMediaId', 'ogImageSrc', 'ogImageMediaId', 'mainImageAlt'];
  var NAME_KEYS = { sectionId: 'sectionName', customerId: 'customerName' };

  // Plain words for the pending list and the AI strip.
  var LABELS = {
    name: 'headline', subtitle: 'subtitle', teaser: 'teaser', shortSummary: 'summary',
    printIssueSource: 'print source', sectionId: 'section', customerId: 'customer', revenueType: 'revenue type',
    writerName: 'writer', writerTitle: 'writer title', cowriterName: 'co-writer',
    cowriterTitle: 'co-writer title', photographer: 'photographer', showPhotoCredits: 'credits',
    ctaButton: 'CTA label', ctaUrl: 'CTA URL', ctaText: 'CTA text', slug: 'slug',
    bannerStatement: 'banner', videoUrl: 'video URL', audioUrl: 'audio URL',
    galleryMediaIds: 'gallery', bodyHtml: 'body'
  };

  var AI_BADGE = '<span class="ix-ai-badge ix-ai-badge--sm" role="img" aria-label="Filled by AI \u2014 review before publishing" title="Filled by AI \u2014 review before publishing">' +
    '<svg class="ix-ai-badge__glyph" viewBox="0 0 16 16" aria-hidden="true">' +
    '<path class="ix-ai-star ix-ai-star--lg" d="M6 1.6 L7.05 4.95 L10.4 6 L7.05 7.05 L6 10.4 L4.95 7.05 L1.6 6 L4.95 4.95 Z"/>' +
    '<path class="ix-ai-star ix-ai-star--md" d="M12.1 7.2 L12.75 9.25 L14.8 9.9 L12.75 10.55 L12.1 12.6 L11.45 10.55 L9.4 9.9 L11.45 9.25 Z"/>' +
    '<path class="ix-ai-star ix-ai-star--sm" d="M4.3 11.2 L4.75 12.6 L6.15 13.05 L4.75 13.5 L4.3 14.9 L3.85 13.5 L2.45 13.05 L3.85 12.6 Z"/></svg></span>';
  var THINK = '<svg class="asf2-ai-think" viewBox="0 0 50 24" width="40" height="19" aria-hidden="true">' +
    '<circle class="d1" cx="28" cy="12" r="2.3"/><circle class="d2" cx="36" cy="12" r="2.3"/><circle class="d3" cx="44" cy="12" r="2.3"/>' +
    '<path class="s1" d="M9 4 L10.3 8.7 L15 10 L10.3 11.3 L9 16 L7.7 11.3 L3 10 L7.7 8.7 Z"/></svg>';

  /* ── Per-open module state. Reset whenever ta-asf opens a new form
        (S.openSeq changes). ────────────────────────────────────── */
  var M = null;
  function freshM(seq) {
    return {
      seq: seq,
      token: null,
      base: {},            // article values the form opened with (or last saved)
      baseType: 'standard',
      baseRoles: { main: '', og: null },
      roles: { main: '', og: null },     // og null = OG follows Main
      imgBase: {},         // mediaId -> { caption, alt } as opened / last saved
      imgText: {},         // mediaId -> { caption, alt } current
      aiImages: {},        // mediaId -> true for generated images
      traySeeded: false,
      trayPref: null,      // null = automatic; true / false = operator's choice
      lastUnused: null,
      moreOpen: false,
      popOpen: false,
      savedRange: null,
      trixTouched: false,
      trixBaseline: null,  // editor HTML of the opening body, once Trix has it
      lastBodyFromTrix: null,
      inlineSig: '',
      savingMedia: false,
      cssChecked: false,
      // OBLIGATION link (the OBLIGATION holds the reference to the article)
      obl: { base: '', cur: '', list: [], loadedFor: null, loading: false, err: '', baseKnown: false },
      modalOpen: false
    };
  }

  /* ════════════════════════════════════════════════════════════
     SMALL HELPERS
     ════════════════════════════════════════════════════════════ */
  function esc(s) { return B.esc(s); }
  function A() { return S.article || (S.article = {}); }
  function clone(v) { return (v && typeof v === 'object') ? JSON.parse(JSON.stringify(v)) : v; }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function eqVal(k, a, b) {
    if (k === 'galleryMediaIds') return JSON.stringify(a || []) === JSON.stringify(b || []);
    if (BOOL_KEYS[k]) return !!a === !!b;
    return B.fieldsEqual(a, b);
  }
  function rootEl() { return S.overlay ? S.overlay.querySelector('.asf2') : null; }
  function q(sel) { var r = rootEl(); return r ? r.querySelector(sel) : null; }
  function qa(sel) { var r = rootEl(); return r ? Array.prototype.slice.call(r.querySelectorAll(sel)) : []; }
  function scroller() { return S.overlay ? S.overlay.querySelector('.asf-overlay') : null; }
  function trixEl() { return q('trix-editor.asf2-rte'); }
  function isPhotoEssay() { return S.articleType === 'photo-essay'; }

  /* ════════════════════════════════════════════════════════════
     MEDIA LOOKUP — the tray only ever shows this article's images.
     A record is resolved from the page's MEDIA rows (plus this
     session's uploads), then from the edit hydrate, then from the
     article's own main / OG URL.
     ════════════════════════════════════════════════════════════ */
  var IDX = null;   // per-patch memo; cleared on every patch and event
  function mediaIndex() {
    if (IDX) return IDX;
    var map = {};
    // Several rows can carry one id (the hydrated row and the synthetic
    // Main / OG row ta-asf keeps for readiness). Merge; never blank a value.
    (S.media || []).forEach(function (m) {
      var id = m.mediaId || m.id;
      if (!id) return;
      var prev = map[id] || {};
      map[id] = {
        id: id,
        fn: prev.fn || m.originalFilename || m.name || '',
        url: prev.url || m.imageUrl || m.src || '',
        caption: prev.caption || m.caption || '',
        alt: prev.alt || m.altText || '',
        role: prev.role || (m.role && m.role !== 'main-image' && m.role !== 'og-image' ? m.role : ''),
        printMatch: prev.printMatch || m.printMatch || null,
        captionFromPrint: !!(prev.captionFromPrint || m.captionFromPrint)
      };
    });
    B.hydrateAllMedia().forEach(function (m) {
      if (!m.mediaId) return;
      var prev = map[m.mediaId] || {};
      map[m.mediaId] = {
        id: m.mediaId,
        fn: m.originalFilename || m.name || prev.fn || '',
        url: m.imageUrl || prev.url || '',
        caption: (m.caption != null && m.caption !== '') ? m.caption : (prev.caption || ''),
        alt: (m.altText != null && m.altText !== '') ? m.altText : (prev.alt || ''),
        role: m.role || prev.role || '',
        printMatch: m.printMatch || prev.printMatch || null,
        captionFromPrint: !!(m.captionFromPrint || prev.captionFromPrint)
      };
    });
    var a = A(), b = M.base;
    [[b.mainImageMediaId, b.mainImageSrc], [b.ogImageMediaId, b.ogImageSrc],
     [a.mainImageMediaId, a.mainImageSrc], [a.ogImageMediaId, a.ogImageSrc]].forEach(function (p) {
      if (p[0] && !map[p[0]] && p[1]) map[p[0]] = { id: p[0], fn: '', url: p[1], caption: '', alt: '', role: '' };
    });
    IDX = map;
    return map;
  }

  function thumbUrl(url) {
    if (!url) return '';
    return B.applyUploadcareTransform(url, HC.thumbTransform);
  }

  // Print match is read, never invented. Nothing sets printMatch until
  // the visual matcher ships; until then no line is shown (ruled 24 Sept).
  function printMatchOf(rec) {
    var p = rec && rec.printMatch;
    if (!p || p.page == null || p.conf == null) return null;
    return { page: p.page, conf: +p.conf };
  }

  // Inline images, in body order, read back out of the body.
  function inlineOrder() {
    var html = A().bodyHtml || '';
    var ids = [];
    try {
      var tmp = document.createElement('div');
      tmp.innerHTML = html;
      var imgs = tmp.querySelectorAll('img[data-media-id]');
      for (var i = 0; i < imgs.length; i++) {
        var id = (imgs[i].getAttribute('data-media-id') || '').trim();
        if (id) ids.push(id);
      }
    } catch (e) {}
    if (!ids.length) ids = B.extractInlineMediaIds(html);   // serialized-attachment fallback
    return ids;
  }

  function trayIds() {
    var idx = mediaIndex();
    return (S.bundleImageIds || []).filter(function (id) { return idx[id] && idx[id].url; });
  }

  function ensureImgText(id, rec) {
    if (own(M.imgBase, id)) return;
    var alt = rec.alt || '';
    if (!alt && id === M.baseRoles.main) alt = M.base.mainImageAlt || '';
    M.imgBase[id] = { caption: rec.caption || '', alt: alt };
    M.imgText[id] = { caption: rec.caption || '', alt: alt };
  }
  function imgChanged(id, f) {
    var a = M.imgText[id], b = M.imgBase[id];
    if (!a || !b) return false;
    return String(a[f] || '') !== String(b[f] || '');
  }

  /* ════════════════════════════════════════════════════════════
     BASELINE — what Cancel returns to and what gold is measured
     against. Taken when the form is built for an open, and again
     after every confirmed save (ta-asf bumps S.baseSeq).
     ════════════════════════════════════════════════════════════ */
  function takeBaseline() {
    var a = A();
    var base = {};
    FIELD_KEYS.concat(IMAGE_KEYS).concat(['bodyHtml', 'sectionName', 'customerName'])
      .forEach(function (k) { base[k] = clone(own(a, k) ? a[k] : (BOOL_KEYS[k] ? false : (k === 'galleryMediaIds' ? [] : ''))); });
    M.base = base;
    M.baseType = S.articleType || 'standard';
    M.baseRoles = normRoles(base.mainImageMediaId, base.ogImageMediaId);
    M.roles = clone(M.baseRoles);
    M.trixBaseline = null;
    M.lastBodyFromTrix = null;
    // Dirty entries for keys this form owns are rebuilt from the new
    // baseline; anything a prefill or AI pass wrote stays as a value.
    reconcileAll();
  }
  function normRoles(main, og) {
    main = main || '';
    og = og || '';
    return { main: main, og: (!og || og === main) ? null : og };
  }

  // Seed the tray for this open: bundle images, every image the article
  // already carries, Main, OG, inline and gallery. Order kept, no dups.
  function seedTray() {
    if (M.traySeeded) return;
    M.traySeeded = true;
    var ids = (S.bundleImageIds || []).slice();
    function add(id) { if (id && ids.indexOf(id) === -1) ids.push(id); }
    var idx = mediaIndex();
    (S.media || []).forEach(function (m) {
      var id = m.mediaId || m.id;
      if (id && idx[id] && idx[id].url) add(id);
    });
    add(M.base.mainImageMediaId);
    add(M.base.ogImageMediaId);
    inlineOrder().forEach(add);
    (M.base.galleryMediaIds || []).forEach(add);
    S.bundleImageIds = ids;
  }

  /* ════════════════════════════════════════════════════════════
     DIRTY MODEL
     ════════════════════════════════════════════════════════════ */
  function setDirty(k, from, to) {
    if (!S.dirtyFields) S.dirtyFields = {};
    if (eqVal(k, from, to)) delete S.dirtyFields[k];
    else S.dirtyFields[k] = { from: clone(from), to: clone(to) };
  }
  function reconcileKey(k) { setDirty(k, M.base[k], A()[k]); }
  function reconcileAll() {
    FIELD_KEYS.forEach(reconcileKey);
    reconcileBody();
    if (isPhotoEssay()) M.roles.main = A().mainImageMediaId || '';
    applyRoles();
    B.deriveDirtySections();
  }
  function reconcileBody() {
    var cur = A().bodyHtml || '';
    var base = M.base.bodyHtml || '';
    var same = (cur === base) || (M.trixBaseline != null && cur === M.trixBaseline);
    if (same) {
      if (S.dirtyFields) delete S.dirtyFields.bodyHtml;
    } else {
      setDirty('bodyHtml', base, cur);
    }
  }
  function bodyChanged() { return !!(S.dirtyFields && S.dirtyFields.bodyHtml); }

  function rolesEqual(a, b) { return (a.main || '') === (b.main || '') && (a.og || null) === (b.og || null); }
  function mainChanged() { return (M.roles.main || '') !== (M.baseRoles.main || ''); }
  function ogChanged() { return (M.roles.og || null) !== (M.baseRoles.og || null); }
  function effOg() { return M.roles.og || M.roles.main || ''; }

  // Write the roles model onto the article fields ta-asf saves.
  function applyRoles() {
    var a = A(), b = M.base;
    var idx = null;
    function urlOf(id) {
      if (!id) return '';
      if (!idx) idx = mediaIndex();
      var r = idx[id];
      return r && r.url ? B.stripUcTransforms(r.url) : '';
    }
    if (!isPhotoEssay()) {
      if (!mainChanged()) {
        a.mainImageMediaId = b.mainImageMediaId;
        a.mainImageSrc = b.mainImageSrc;
      } else {
        a.mainImageMediaId = M.roles.main;
        a.mainImageSrc = urlOf(M.roles.main);
      }
    }
    if (rolesEqual(M.roles, M.baseRoles) && !isPhotoEssay()) {
      a.ogImageMediaId = b.ogImageMediaId;
      a.ogImageSrc = b.ogImageSrc;
    } else if (!ogChanged() && (a.mainImageMediaId || '') === (b.mainImageMediaId || '')) {
      a.ogImageMediaId = b.ogImageMediaId;
      a.ogImageSrc = b.ogImageSrc;
    } else {
      var og = effOg();
      a.ogImageMediaId = og;
      a.ogImageSrc = og ? (urlOf(og) || (og === a.mainImageMediaId ? a.mainImageSrc : '')) : '';
    }
    // Main alt on the ARTICLE mirrors the Main card's alt, but only once
    // the operator has moved Main or edited that alt. Otherwise the saved
    // article alt stands untouched.
    var mid = a.mainImageMediaId || '';
    if (mainChanged() || (mid && imgChanged(mid, 'alt'))) {
      a.mainImageAlt = (mid && M.imgText[mid]) ? (M.imgText[mid].alt || '') : '';
    } else {
      a.mainImageAlt = b.mainImageAlt;
    }
    IMAGE_KEYS.forEach(function (k) { setDirty(k, b[k], a[k]); });
    // computeRTP and findMediaByRole read synthetic role rows.
    var media = (S.media || []).filter(function (m) { return m.role !== 'main-image' && m.role !== 'og-image'; });
    if (a.mainImageMediaId || a.mainImageSrc) media.push({ mediaId: a.mainImageMediaId, imageUrl: a.mainImageSrc, role: 'main-image' });
    if (a.ogImageMediaId || a.ogImageSrc) media.push({ mediaId: a.ogImageMediaId, imageUrl: a.ogImageSrc, role: 'og-image' });
    S.media = media;
  }

  function tickChanged(id) {
    return !!(S.rtpManualState || {})[id] !== !!(S.originalManual || {})[id];
  }

  // Everything Save would write, as plain names.
  function changeList() {
    var out = [];
    var d = S.dirtyFields || {};
    FIELD_KEYS.forEach(function (k) {
      if (!own(d, k)) return;
      if (k === 'photoEssay' || k === 'videoArticle') return;
      out.push(LABELS[k] || k);
    });
    if (own(d, 'photoEssay') || own(d, 'videoArticle')) out.push('type');
    if (bodyChanged()) out.push('body');
    if (!isPhotoEssay() && mainChanged()) out.push('main image');
    if (ogChanged()) out.push('OG image');
    var idx = mediaIndex();
    Object.keys(M.imgText).forEach(function (id) {
      var fn = (idx[id] && idx[id].fn) || id;
      if (imgChanged(id, 'caption')) out.push(fn + ' caption');
      if (imgChanged(id, 'alt')) out.push(fn + ' alt');
    });
    if (M.obl.cur !== M.obl.base) out.push('obligation');
    if (tickChanged('sponsor-ok')) out.push('sponsor OK');
    if (tickChanged('edit-pass')) out.push('edit pass');
    return out;
  }
  function mediaTextItems() {
    var items = [];
    Object.keys(M.imgText).forEach(function (id) {
      var c = imgChanged(id, 'caption'), l = imgChanged(id, 'alt');
      if (!c && !l) return;
      var it = { mediaId: id, setCaption: c, setAltText: l };
      if (c) it.caption = M.imgText[id].caption || '';
      if (l) it.altText = M.imgText[id].alt || '';
      items.push(it);
    });
    return items;
  }
  function articleHasChanges() {
    var d = S.dirtyFields || {};
    for (var k in d) if (own(d, k)) return true;
    return tickChanged('sponsor-ok') || tickChanged('edit-pass');
  }

  /* ════════════════════════════════════════════════════════════
     OPTIONS — from the page, never from constants
     ════════════════════════════════════════════════════════════ */
  function optionsFor(kind) {
    var a = A();
    var list, cur, curName;
    if (kind === 'articleType') {
      return (B.cfg.articleTypes || []).map(function (t) {
        return { value: t.id, label: t.label.replace(/\s+Article$/i, '') + (t.soon ? ' (soon)' : ''), disabled: !!t.soon };
      });
    }
    if (kind === 'revenue') {
      var ids = ((B.cfg.tenant.cfg() || {}).optionIds || {}).revenueType || {};
      var rev = a.revenueType || '';
      var ro = [{ value: '', label: '\u2014 none \u2014' }];
      if (ids.paidArticle) ro.push({ value: ids.paidArticle, label: 'Paid Article' });
      if (ids.paidAd)      ro.push({ value: ids.paidAd,      label: 'Paid Ad' });
      if (ids.sponsorable) ro.push({ value: ids.sponsorable, label: 'Sponsorable' });
      if (rev && !ro.some(function (o) { return o.value === rev; })) ro.push({ value: rev, label: rev + '  (not a revenue type)' });
      return ro;
    }
    if (kind === 'section') { list = B.readSections(); cur = a.sectionId; curName = a.sectionName; }
    else if (kind === 'customer') { list = B.readCustomers(); cur = a.customerId; curName = a.customerName; }
    else return [];
    var opts = [{ value: '', label: '\u2014 none \u2014' }];
    var found = false;
    list.forEach(function (it) {
      if (it.id === cur) found = true;
      opts.push({ value: it.id, label: it.name });
    });
    if (cur && !found) opts.push({ value: cur, label: curName || cur });
    if (kind === 'customer') opts.push({ value: '__new__', label: '+ New customer\u2026' });
    return opts;
  }
  function optionsHTML(kind) {
    return optionsFor(kind).map(function (o) {
      return '<option value="' + esc(o.value) + '"' + (o.disabled ? ' disabled' : '') + '>' + esc(o.label) + '</option>';
    }).join('');
  }

  /* ════════════════════════════════════════════════════════════
     MARKUP — mirrors mockup v0.10 exactly
     ════════════════════════════════════════════════════════════ */
  function fieldHTML(d) {
    if (d.pair) return '<div class="asf2-pair">' + d.pair.map(fieldHTML).join('') + '</div>';
    var lab = '<div class="ix-field-label"><span>' + esc(d.label) +
      (d.req ? ' <span class="ix-field-req">*</span>' : '') +
      '<span data-a2-ai="' + d.key + '"></span></span>' +
      (counterSpec(d.key) ? '<span class="asf2-count" data-a2-count="' + d.key + '"></span>' : '') +
      (d.kind === 'readonly' ? '' : '<button type="button" class="ix-revert" data-a2-revert="' + d.key + '" hidden>cancel</button>') +
      '</div>';
    var ctl;
    if (d.kind === 'readonly') {
      ctl = '<div class="asf2-readonly" data-a2-ro="' + d.key + '"></div>';
    } else if (d.kind === 'select') {
      ctl = '<select class="ix-picker-input" data-a2-f="' + d.key + '" data-a2-opts="' + d.opts + '">' + (d.opts === 'obligation' ? '' : optionsHTML(d.opts)) + '</select>';
    } else if (d.kind === 'switch') {
      ctl = '<label class="ix-switch" data-a2-sw="' + d.key + '"><input type="checkbox" data-a2-f="' + d.key + '"><span class="ix-switch-track"></span><span>' + esc(d.text) + '</span></label>';
    } else if (d.kind === 'textarea') {
      ctl = '<textarea class="ix-picker-input" rows="2" data-a2-f="' + d.key + '"></textarea>';
    } else {
      var cs = counterSpec(d.key);
      ctl = '<input type="text" class="ix-picker-input' + (d.cls ? ' ' + d.cls : '') + '" data-a2-f="' + d.key + '"' +
        (cs && cs.hard ? ' maxlength="' + cs.max + '"' : '') + '>';
    }
    return '<div class="ix-field">' + lab + ctl + '</div>';
  }
  // v1.10.0 counters: subtitle and banner are hard caps (maxlength);
  // teaser and short summary show a target band.
  function counterSpec(k) {
    var L = B.cfg.limits || {};
    if (k === 'subtitle' && L.subtitle) return { max: L.subtitle, hard: true };
    if (k === 'bannerStatement' && L.bannerStatement) return { max: L.bannerStatement, hard: true };
    if (k === 'teaser' && L.teaser) return { max: L.teaser, min: HC.teaserMin };
    if (k === 'shortSummary' && L.shortSummary) return { max: L.shortSummary, min: HC.shortSummaryMin };
    return null;
  }
  function paintCounter(k, v) {
    var c = q('[data-a2-count="' + k + '"]'), sp = counterSpec(k);
    if (!c || !sp) return;
    var n = String(v || '').length;
    c.textContent = n + ' / ' + (sp.min ? sp.min + '\u2013' + sp.max : sp.max);
    c.className = 'asf2-count' + (n > sp.max ? ' over' : sp.min ? (n >= sp.min ? ' inrange' : ' under') : (n >= sp.max * 0.85 ? ' near' : ''));
  }
  function groupHTML(g) {
    return '<div class="asf2-group"><div class="asf2-group-head"><span class="n">' + g.n + '</span>' + esc(g.title) + '</div>' +
      g.fields.map(fieldHTML).join('') + '</div>';
  }
  function countFields(list) {
    var n = 0;
    list.forEach(function (d) { n += d.pair ? d.pair.length : 1; });
    return n;
  }
  function crumbHTML() {
    var cfg = (B.cfg.tenant && B.cfg.tenant.cfg && B.cfg.tenant.cfg()) || {};
    var t = (cfg.titleSlug || '').toUpperCase() || A().titleName || '';
    return (t ? esc(t) + ' \u00B7 ' : '') + 'Articles \u00B7 <b>' + (S.mode === 'create' ? 'New' : 'Edit') + '</b>';
  }

  function rootHTML() {
    return '<div class="asf2 ix-dense ix-surface-scope" data-a2-root="' + M.seq + '">' +
      '<div class="asf2-bar">' +
        '<span class="asf2-crumb">' + crumbHTML() + '</span>' +
        '<div class="asf2-ticks" data-a2-ticks></div>' +
        '<div class="asf2-bar-right">' +
          '<span class="asf2-dirtycount" data-a2-dirtycount></span>' +
          '<button type="button" class="ix-revert" data-a2-act="cancel-all">Cancel</button>' +
          '<button type="button" class="ix-btn ix-btn--primary" data-a2-act="save">Save</button>' +
        '</div>' +
      '</div>' +
      '<div class="asf2-grid">' +
        '<section class="asf2-col asf2-col--facts" aria-label="Placement and people">' +
          FACT_GROUPS.map(groupHTML).join('') +
          '<details class="asf2-more"' + (M.moreOpen ? ' open' : '') + '><summary>More \u00B7 ' + countFields(MORE) + ' fields</summary>' +
            '<div class="asf2-more-body">' + MORE.map(fieldHTML).join('') + '</div></details>' +
        '</section>' +
        '<section class="asf2-col asf2-col--words" aria-label="Words and body">' +
          '<div data-a2-srcshots>' + (B.renderSourceScreenshots() || '') + '</div>' +
          '<div class="asf2-ai" data-a2-ai-strip></div>' +
          '<div class="asf2-group"><div class="asf2-group-head"><span class="n">3</span>Words</div>' + WORDS.map(fieldHTML).join('') + '</div>' +
          '<div class="asf2-group"><div class="asf2-group-head"><span class="n">4</span>Main, OG &amp; body' +
            '<button type="button" class="ix-revert" data-a2-revert="bodyHtml" hidden>cancel body</button>' +
            '<span class="asf2-srclinks" data-a2-srclinks></span></div>' +
            '<div class="asf2-lead" data-a2-lead></div>' +
            '<div data-a2-gallery></div>' +
            '<div class="asf2-body" data-a2-body>' + bodyInnerHTML() + '</div>' +
          '</div>' +
        '</section>' +
        '<section class="asf2-col asf2-col--tray" aria-label="Article images" data-a2-traycol></section>' +
      '</div>' +
    '</div>';
  }

  function loadingHTML(msg) {
    return '<div class="asf2 ix-dense ix-surface-scope" data-a2-root="' + M.seq + '">' +
      '<div class="asf2-bar"><span class="asf2-crumb">' + crumbHTML() + '</span></div>' +
      '<p class="asf2-note asf2-loading">' + esc(msg) + '</p></div>';
  }

  function bodyInnerHTML() {
    var tb = 'a2-trix-toolbar-' + M.seq, inp = 'a2-trix-input-' + M.seq;
    var bar = '<trix-toolbar id="' + tb + '" class="asf2-rtebar">' +
      '<button type="button" class="asf2-rtebtn" data-trix-attribute="bold" data-trix-key="b" title="Bold"><b>B</b></button>' +
      '<button type="button" class="asf2-rtebtn" data-trix-attribute="italic" data-trix-key="i" title="Italic"><i>I</i></button>' +
      '<button type="button" class="asf2-rtebtn" data-trix-attribute="heading2" title="Section header">H2</button>' +
      '<button type="button" class="asf2-rtebtn" data-trix-attribute="quote" title="Quote">\u201C \u201D</button>' +
      '<button type="button" class="asf2-rtebtn" data-trix-attribute="href" data-trix-action="link" data-trix-key="k" title="Link">\uD83D\uDD17</button>' +
      '<button type="button" class="asf2-rtebtn asf2-rtebtn--img" data-a2-act="imgpop" aria-haspopup="true" aria-expanded="false">\uD83D\uDDBC Image</button>' +
      '<span class="asf2-rtehint">click a paragraph to set where it goes</span>' +
      '<div class="asf2-pop" data-a2-pop hidden></div>' +
      '<div class="trix-dialogs" data-trix-dialogs>' +
        '<div class="trix-dialog trix-dialog--link" data-trix-dialog="href" data-trix-dialog-attribute="href">' +
          '<div class="trix-dialog__link-fields">' +
            '<input type="url" name="href" class="trix-input trix-input--dialog" placeholder="Enter a URL\u2026" aria-label="URL" data-trix-input required>' +
            '<div class="trix-button-group">' +
              '<input type="button" class="trix-button trix-button--dialog" value="Link" data-trix-method="setAttribute">' +
              '<input type="button" class="trix-button trix-button--dialog" value="Unlink" data-trix-method="removeAttribute">' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</trix-toolbar>';
    if (!B.isTrixAvailable()) {
      B.ensureTrixLoaded();
      return bar + '<div class="asf2-rte" data-a2-trix-wait>Loading the body editor\u2026</div>';
    }
    B.registerTrixHeadings();
    return bar +
      '<input type="hidden" id="' + inp + '" value="' + esc(A().bodyHtml || '') + '">' +
      '<trix-editor input="' + inp + '" toolbar="' + tb + '" class="asf2-rte"></trix-editor>';
  }

  /* ════════════════════════════════════════════════════════════
     BUILD / PATCH
     ════════════════════════════════════════════════════════════ */
  function tokenNow() {
    return [S.openSeq || 0, S.baseSeq || 0, S.hydrated ? 1 : 0, S.hydrateFailed ? 1 : 0, S.mode].join(':');
  }

  function render(panel) {
    if (!B) return;
    if (!M || M.seq !== S.openSeq) M = freshM(S.openSeq);
    var tok = tokenNow();
    var root = panel.querySelector('.asf2[data-a2-root="' + M.seq + '"]');
    if (!root || M.token !== tok) build(panel, tok);
    else patch(panel);
  }

  function build(panel, tok) {
    var prevBase = M.token && M.token.split(':')[1];
    var d = q('details.asf2-more');
    if (d) M.moreOpen = d.open;
    M.token = tok;
    M.popOpen = false;

    if (!S.hydrated || S.hydrateFailed) {
      panel.innerHTML = '<div data-a2-cx>' + B.renderContextBar() + '</div>' +
        loadingHTML(S.hydrateFailed ? 'Could not load this article. Close and open it again.' : 'Loading the article\u2026');
      return;
    }
    // A new baseline after a confirmed save: what was saved is now the
    // opening state for captions and alt too.
    if (prevBase && prevBase !== String(S.baseSeq || 0)) M.imgBase = clone(M.imgText);

    takeBaseline();
    seedTray();
    panel.innerHTML = '<div data-a2-cx>' + B.renderContextBar() + '</div>' + rootHTML();
    var root = rootEl();
    root.addEventListener('mousedown', onMouseDown);
    bindTrix();
    patch(panel);
    checkCss();
    if (A().isPaid && A().customerId) loadObligations();
  }

  function patch(panel) {
    var sc = scroller(), top = sc ? sc.scrollTop : 0;
    IDX = null;
    var cx = panel.querySelector('[data-a2-cx]');
    if (cx) {
      var cxh = B.renderContextBar();
      if (cx.innerHTML !== cxh) cx.innerHTML = cxh;
    }
    if (!S.hydrated || S.hydrateFailed) return;
    if (!trixEl() && B.isTrixAvailable()) {
      var box = q('[data-a2-body]');
      if (box) { box.innerHTML = bodyInnerHTML(); bindTrix(); }
    }
    reconcileAll();
    syncBodyFromState();
    syncFields();
    renderAi();
    renderGallery();
    renderLeadAndTray();
    renderTicks();
    renderBar();
    if (M.popOpen) renderPop();
    if (sc) sc.scrollTop = top;
  }

  function checkCss() {
    if (M.cssChecked) return;
    M.cssChecked = true;
    var g = q('.asf2-grid');
    if (g && window.getComputedStyle(g).display !== 'grid') {
      B.warn('ta-asf-article CSS is not on the page \u2014 the Article form will not lay out');
      B.toast('Article form styles are missing \u2014 add ta-asf-article-v1.0.1.css and ix-form-controls-v1.1.0.css to the page head', 'error');
    }
  }

  function syncFields() {
    var a = A();
    qa('[data-a2-f]').forEach(function (el) {
      var k = el.getAttribute('data-a2-f');
      var ch, v;
      if (k === '_type') {
        v = S.articleType || 'standard';
        ch = v !== M.baseType;
        if (el.value !== v) el.value = v;
        el.classList.toggle('ix-picker-input--changed', ch);
      } else if (k === 'obligationId') {
        syncObligationSelect(el);
        ch = M.obl.cur !== M.obl.base;
        el.classList.toggle('ix-picker-input--changed', ch);
      } else if (el.type === 'checkbox') {
        el.checked = !!a[k];
        ch = own(S.dirtyFields || {}, k);
        var sw = el.closest('.ix-switch');
        if (sw) sw.classList.toggle('ix-switch--changed', ch);
        if (k === 'isPaid') {
          el.disabled = !HC.paidLive;
          if (sw) sw.title = HC.paidLive ? '' : 'Paid articles arrive with OBLIGATIONS \u2014 not in the CMS yet';
        }
      } else {
        v = a[k] == null ? '' : String(a[k]);
        ch = own(S.dirtyFields || {}, k);
        if (el.tagName === 'SELECT') {
          var kind = el.getAttribute('data-a2-opts');
          var forCust = kind === 'obligation' && el.getAttribute('data-a2-for') !== (a.customerId || '');
          if (forCust || !Array.prototype.some.call(el.options, function (o) { return o.value === v; })) {
            el.innerHTML = optionsHTML(kind);
            if (kind === 'obligation') el.setAttribute('data-a2-for', a.customerId || '');
          }
          if (el.value !== v) el.value = v;
        } else if (document.activeElement !== el && el.value !== v) {
          el.value = v;
        }
        el.classList.toggle('ix-picker-input--changed', ch);
        paintCounter(k, el.value);
        if (k === 'slug') el.readOnly = true;   // v1.10.0: slug is never edited here
      }
      var rv = q('[data-a2-revert="' + k + '"]');
      if (rv) rv.hidden = !ch;
    });
    qa('[data-a2-ai]').forEach(function (sp) {
      var k = sp.getAttribute('data-a2-ai');
      var on = !!(S.aiFilled && S.aiFilled[k]);
      var tf = !on && !!(S.textFilled && S.textFilled[k]);
      var h = on ? ' ' + AI_BADGE : tf ? ' <span class="asf2-tcap-src" title="Read from the uploaded document text">from text</span>' : '';
      if (sp.innerHTML !== h) sp.innerHTML = h;
    });
    var sl = q('[data-a2-srclinks]');
    if (sl) {
      var lh = (S.sourceBodyOriginal ? '<button type="button" class="ix-revert" data-asf-action="' + (S.rawTextOpen ? 'close-raw-text' : 'see-raw-text') + '">' + (S.rawTextOpen ? 'close raw text' : 'raw text') + '</button>' : '') +
               (S.sourceMetadata ? '<button type="button" class="ix-revert" data-asf-action="' + (S.sourceMetaOpen ? 'close-source-meta' : 'see-source-meta') + '">' + (S.sourceMetaOpen ? 'close source metadata' : 'source metadata') + '</button>' : '');
      if (sl.innerHTML !== lh) sl.innerHTML = lh;
    }
    var bch = bodyChanged();
    var box = q('[data-a2-body]');
    if (box) box.classList.toggle('is-changed', bch);
    var rb = q('[data-a2-revert="bodyHtml"]');
    if (rb) rb.hidden = !bch;
  }

  /* ── AI assist strip ── */
  function renderAi() {
    var bar = q('[data-a2-ai-strip]');
    if (!bar) return;
    var st = B.aiAssistState(), h;
    var hasBody = !!B.stripTags(A().bodyHtml || '');
    var eligible = B.aiAssistEligible();
    if (!eligible) {
      h = '<span class="asf2-ai-spark">\u2728</span><span class="asf2-ai-txt"><b>AI assist</b> is not loaded on this page (ta-generate)</span>' +
          '<button type="button" class="asf2-ai-btn asf2-ai-btn--go" disabled>Generate from body</button>';
    } else if (st.busy) {
      h = '<span class="asf2-ai-spark">\u2728</span><span class="asf2-ai-txt"><b>Generating\u2026</b> title, writers, photographer, teaser, summary and section headers from the body</span>' + THINK;
    } else if (st.error) {
      h = '<span class="asf2-ai-spark">\u2728</span><span class="asf2-ai-txt"><b>Generation failed.</b> ' + esc(st.error) + '</span>' +
          '<button type="button" class="asf2-ai-btn asf2-ai-btn--go" data-asf-action="ai-regen">Try again</button>';
    } else if (st.done) {
      h = '<span class="asf2-ai-spark">\u2728</span><span class="asf2-ai-txt"><b>Filled from body.</b> ' + esc(aiSummary(st)) + ' Existing text untouched.</span>' +
          (st.bodyUndo != null ? '<button type="button" class="asf2-ai-btn" data-asf-action="ai-undo">Undo headers</button>' : '') +
          '<button type="button" class="asf2-ai-btn" data-asf-action="ai-regen">\u21BB Regenerate</button>';
    } else {
      h = '<span class="asf2-ai-spark">\u2728</span><span class="asf2-ai-txt"><b>AI assist</b> fills empty fields and adds section headers from the body</span>' +
          '<button type="button" class="asf2-ai-btn asf2-ai-btn--go" data-asf-action="ai-gen"' + (hasBody ? '' : ' disabled') + '>Generate from body</button>';
    }
    if (bar.innerHTML !== h) bar.innerHTML = h;
    bar.classList.toggle('is-busy', !!st.busy);
  }
  function aiSummary(st) {
    var f = [];
    Object.keys(S.aiFilled || {}).forEach(function (k) {
      if (!S.aiFilled[k] || k === 'bodyHtml' || k === 'showPhotoCredits') return;
      f.push(LABELS[k] || k);
    });
    var filled = f.length ? 'Filled ' + (f.length > 1 ? f.slice(0, -1).join(', ') + ' and ' + f[f.length - 1] : f[0]) + '.' : 'Filled no empty fields.';
    var hdr;
    if (st.hdrAuthor) hdr = 'Kept the author\u2019s own section headers.';
    else if (st.hdrIn === 0) hdr = 'No section headers added.';
    else if (st.hdrIn === 1) hdr = 'Added 1 section header.';
    else if (st.hdrIn > 1) hdr = 'Added ' + st.hdrIn + ' section headers.';
    else hdr = 'Section headers checked.';
    return filled + ' ' + hdr;
  }

  /* ── Photo essay: the gallery order strip (v1.10.0 control) ── */
  function renderGallery() {
    var host = q('[data-a2-gallery]');
    if (!host) return;
    var html = isPhotoEssay() ? B.renderSideS8Gallery() : '';
    if (host.innerHTML !== html) host.innerHTML = html;
  }

  /* ── Ticks ── */
  function placedCount() {
    var inl = inlineOrder(), ids = trayIds(), n = 0;
    var gal = isPhotoEssay() ? (A().galleryMediaIds || []) : [];
    var og = effOg();
    ids.forEach(function (id) {
      if (id === M.roles.main || id === og || inl.indexOf(id) > -1 || gal.indexOf(id) > -1) n++;
    });
    return { total: ids.length, placed: n, unused: ids.length - n };
  }
  function renderTicks() {
    var host = q('[data-a2-ticks]');
    if (!host) return;
    var a = A();
    var mid = a.mainImageMediaId || '';
    var alt = mid && M.imgText[mid] ? M.imgText[mid].alt : a.mainImageAlt;
    var t = [
      ['Title', !!String(a.name || '').trim()],
      ['Main image', !!(mid || a.mainImageSrc)],
      ['Main alt', !!String(alt || '').trim()],
      ['OG image', !!(effOg() || a.ogImageSrc || a.mainImageSrc)],
      ['CTA', !!(String(a.ctaButton || '').trim() && String(a.ctaUrl || '').trim())]
    ];
    var pc = placedCount();
    var html = t.map(function (x) {
      return '<span class="asf2-tick' + (x[1] ? ' ok' : '') + '">' + (x[1] ? '\u2713 ' : '\u2717 ') + x[0] + '</span>';
    }).join('');
    html += '<span class="asf2-tick' + (pc.unused === 0 ? ' ok' : '') + '">' +
      (pc.unused === 0 ? '\u2713 all photos placed' : '\u2691 ' + pc.unused + ' unplaced') + '</span>';
    html += manualTick('sponsor-ok', 'Sponsor OK') + manualTick('edit-pass', 'Edit pass');
    if (host.innerHTML !== html) host.innerHTML = html;
  }
  function manualTick(id, label) {
    var on = !!(S.rtpManualState || {})[id];
    return '<button type="button" class="asf2-tick' + (on ? ' ok' : '') + (tickChanged(id) ? ' is-changed' : '') +
      '" data-a2-tick="' + id + '" aria-pressed="' + on + '">' + (on ? '\u2713 ' : '\u2610 ') + label + '</button>';
  }

  /* ── Top bar ── */
  function renderBar() {
    var list = changeList(), n = list.length;
    var save = q('[data-a2-act="save"]');
    var cancel = q('[data-a2-act="cancel-all"]');
    var cnt = q('[data-a2-dirtycount]');
    var busy = !!(S.saving || M.savingMedia);
    if (save) {
      save.textContent = busy ? 'Saving\u2026' : (n ? 'Save \u00B7 ' + n : 'Save');
      save.disabled = busy || (!n && S.mode !== 'create');
    }
    if (cancel) cancel.disabled = busy || !n;
    if (cnt) { cnt.textContent = n ? n + ' pending' : ''; cnt.title = list.join(', '); }
  }

  /* ── Main / OG previews and the Images column ── */
  function trayShut() {
    var pc = placedCount();
    var u = pc.unused;
    // Ruled 24 Sept: Images reopens whenever a photo becomes unused,
    // even if the operator had collapsed it.
    if (M.lastUnused !== null && u > M.lastUnused) M.trayPref = null;
    M.lastUnused = u;
    if (M.trayPref !== null) return !M.trayPref;
    return pc.unused === 0 && !!(M.roles.main || A().mainImageSrc);
  }

  function imgFill(url) {
    return url ? '<img class="asf2-imgfill" src="' + esc(thumbUrl(url)) + '" alt="" loading="lazy">' : '';
  }

  function slotHTML(label, rec, fallbackUrl, sub, changed, revKey) {
    var url = (rec && rec.url) || fallbackUrl || '';
    var fn = (rec && rec.fn) || '';
    return '<div class="asf2-roleslot' + (changed ? ' is-changed' : '') + (url ? '' : ' is-empty') + '">' +
      '<div class="asf2-roleslot-pic">' + (url ? imgFill(url) : 'No ' + label.toLowerCase() + ' image yet') + '</div>' +
      '<div class="asf2-roleslot-cap"><b>' + label + '</b><span class="asf2-rs-fn">' + (url ? (fn ? esc(fn) + ' \u00B7 ' : '') + esc(sub) : esc(sub)) + '</span>' +
      '<span class="asf2-rs-act">' +
        (changed ? '<button type="button" class="ix-revert" data-a2-revert="' + revKey + '">cancel</button>' : '') +
        '<button type="button" class="ix-revert" data-a2-tray="open">' + (url ? 'change' : 'pick') + '</button>' +
      '</span></div></div>';
  }

  function ratioOf(transform) {
    var m = /(\d+)x(\d+)/.exec(transform || '');
    if (!m) return '';
    var w = +m[1], h = +m[2];
    function g(x, y) { return y ? g(y, x % y) : x; }
    var d = g(w, h);
    return (w / d) + ':' + (h / d);
  }

  function renderLeadAndTray() {
    var lead = q('[data-a2-lead]'), tray = q('[data-a2-traycol]');
    if (!lead || !tray) return;
    var idx = mediaIndex(), a = A();
    var ids = trayIds();
    ids.forEach(function (id) { ensureImgText(id, idx[id]); });

    var mainRec = idx[a.mainImageMediaId] || null;
    var ogId = isPhotoEssay() ? (a.ogImageMediaId || a.mainImageMediaId) : effOg();
    var ogRec = idx[ogId] || null;
    var mainSub = (a.mainImageMediaId || a.mainImageSrc)
      ? (isPhotoEssay() ? 'hero \u00B7 follows the gallery' : ratioOf((B.cfg.transforms || {}).main) || 'set')
      : 'required';
    var ogSub = M.roles.og ? 'set' : 'follows main';
    var leadHTML = slotHTML('Main', mainRec, a.mainImageSrc, mainSub, !isPhotoEssay() && mainChanged(), '_main') +
                   slotHTML('OG', ogRec, ogId === a.mainImageMediaId ? a.mainImageSrc : a.ogImageSrc, ogSub, ogChanged(), '_og');
    if (lead.innerHTML !== leadHTML) lead.innerHTML = leadHTML;

    var panelHtml = (S.inlinePicker && S.inlinePicker.open) ? B.renderInlinePicker()
      : (S.rawTextOpen && S.sourceBodyOriginal) ? B.renderRawSourcePanel()
      : (S.sourceMetaOpen && S.sourceMetadata) ? B.renderSourceMetaPanel()
      : null;
    if (panelHtml !== null) {
      var grid0 = q('.asf2-grid');
      if (grid0) grid0.classList.remove('is-tray-shut');
      var ph = panelHtml;
      if (tray.innerHTML !== ph) tray.innerHTML = ph;
      return;
    }
    var shut = trayShut();
    var grid = q('.asf2-grid');
    if (grid) grid.classList.toggle('is-tray-shut', shut);
    var pc = placedCount();
    var html;
    if (shut) {
      html = '<button type="button" class="asf2-tray-rail" data-a2-tray="open" title="Open Images" aria-expanded="false"><span class="n">5</span><span class="v">Images \u25B8</span><span class="ok">' + pc.total + ' \u00B7 all placed</span></button>';
    } else {
      html = trayOpenHTML(ids, idx, pc);
    }
    if (tray.innerHTML === html) return;
    // Keep the operator's place when a repaint lands mid-typing.
    var ae = document.activeElement, keep = null;
    if (ae && tray.contains(ae) && ae.hasAttribute('data-a2-img-f')) {
      keep = { k: ae.getAttribute('data-a2-img-f'), s: ae.selectionStart, e: ae.selectionEnd };
    }
    tray.innerHTML = html;
    if (keep) {
      var el = tray.querySelector('[data-a2-img-f="' + keep.k + '"]');
      if (el) { el.focus(); try { el.setSelectionRange(keep.s, keep.e); } catch (e) {} }
    }
  }

  function trayOpenHTML(ids, idx, pc) {
    var inl = inlineOrder(), gal = isPhotoEssay() ? (A().galleryMediaIds || []) : [];
    var og = effOg();
    var html = '<div class="asf2-group"><div class="asf2-group-head"><span class="n">5</span>Images<button type="button" class="asf2-tray-toggle" data-a2-tray="shut" aria-expanded="true">collapse</button></div>' +
      '<div class="asf2-tray-head"><span class="asf2-tray-title">This article</span><span class="asf2-tray-sum">' + pc.total + ' \u00B7 ' + pc.placed + ' placed' +
      (pc.unused ? ' \u00B7 <span class="bad">' + pc.unused + ' unused</span>' : '') + '</span></div>' +
      '<div class="asf2-tlist">';
    ids.forEach(function (id) {
      var rec = idx[id], tx = M.imgText[id];
      var isMain = id === (A().mainImageMediaId || ''), isOg = id === og;
      var galPos = gal.indexOf(id);
      var stat = '';
      inl.forEach(function (x, j) { if (x === id) stat += '<span class="asf2-tag asf2-tag--inline">In body ' + (j + 1) + '</span>'; });
      var unused = !isMain && !isOg && inl.indexOf(id) < 0 && galPos < 0;
      if (unused) stat += '<span class="asf2-tag asf2-tag--unused">Unused</span>';
      var follows = !M.roles.og && isMain;
      var capCh = imgChanged(id, 'caption'), altCh = imgChanged(id, 'alt');
      var pm = printMatchOf(rec), low = pm && pm.conf < HC.printMatchCheckBelow;
      var match = pm ? '<div class="asf2-tmatch' + (low ? ' low' : '') + '" title="How closely this file matches the photo printed on that page">Print p.' + esc(pm.page) + ' \u00B7 ' + pm.conf + '% match' + (low ? ' \u00B7 check' : '') + '</div>' : '';
      var firstBtn = '<button type="button" class="asf2-tbtn" data-a2-role="main" data-a2-img="' + esc(id) + '" aria-pressed="' + isMain + '"' +
        (isPhotoEssay() ? ' disabled title="The hero follows the gallery"' : '') + '>Main</button>';
      html += '<div class="asf2-tcard' + (unused ? ' is-unused' : '') + '">' +
        '<div class="asf2-tfn">' + esc(rec.fn || id) + (M.aiImages[id] ? ' ' + AI_BADGE : '') + '</div>' +
        '<div class="asf2-tthumb">' + imgFill(rec.url) + '</div>' +
        '<div class="asf2-trow">' + firstBtn +
          '<button type="button" class="asf2-tbtn' + (follows ? ' is-follow' : '') + '" data-a2-role="og" data-a2-img="' + esc(id) + '" aria-pressed="' + (M.roles.og === id) + '"' +
            (follows ? ' title="OG follows Main until you pick a different OG"' : '') + '>' + (follows ? 'OG \u00B7 follows' : 'OG') + '</button>' +
          '<span class="asf2-tstat">' + stat + '</span></div>' +
        '<div class="ix-field"><div class="ix-field-label"><span>Caption</span>' +
          (rec.captionFromPrint && !capCh ? '<span class="asf2-tcap-src">from print</span>' : '') +
          '<button type="button" class="ix-revert" data-a2-revimg="' + esc(id) + ':caption"' + (capCh ? '' : ' hidden') + '>cancel</button></div>' +
          '<input type="text" class="ix-picker-input' + (capCh ? ' ix-picker-input--changed' : '') + '" data-a2-img-f="' + esc(id) + ':caption" value="' + esc(tx.caption) + '" placeholder="only if printed"></div>' +
        '<div class="ix-field"><div class="ix-field-label"><span>Alt' + (isMain ? ' <span class="ix-field-req">*</span>' : '') + '</span>' +
          '<button type="button" class="ix-revert" data-a2-revimg="' + esc(id) + ':alt"' + (altCh ? '' : ' hidden') + '>cancel</button></div>' +
          '<input type="text" class="ix-picker-input' + (altCh ? ' ix-picker-input--changed' : '') + '" data-a2-img-f="' + esc(id) + ':alt" value="' + esc(tx.alt) + '" placeholder="describe the photo"></div>' +
        match + '</div>';
    });
    var up = S.upload || {};
    html += '</div><div class="asf2-tray-foot">' +
      '<button type="button" class="ix-btn ix-btn--secondary" data-asf-action="lib-open">+ Add from library</button>' +
      '<button type="button" class="ix-btn ix-btn--secondary" data-asf-action="generate-main">\u2728 Generate image</button>' +
      '<button type="button" class="ix-btn ix-btn--ghost" data-asf-action="upload-rail"' + (up.busy ? ' disabled' : '') + '>' + (up.busy ? 'Uploading\u2026' : 'Upload') + '</button>' +
      (up.busy ? '<button type="button" class="ix-revert" data-asf-action="upload-cancel">cancel</button>' : '') +
      '<button type="button" class="ix-btn ix-btn--ghost" disabled title="Print pages arrive with the visual matcher">Print pages</button></div>' +
      '<p class="asf2-note">Only this article\u2019s images. Captions and alt text save to each MEDIA record. Unused photos are flagged, never blocked.</p></div>';
    return html;
  }

  /* ── Body image popover: this article's images only ── */
  function renderPop() {
    var pop = q('[data-a2-pop]');
    if (!pop) return;
    var idx = mediaIndex(), inl = inlineOrder(), ids = trayIds();
    pop.innerHTML = '<div class="asf2-pop-head">This article\u2019s images<span>goes where the cursor is</span></div>' +
      (ids.length ? '<div class="asf2-pop-grid">' + ids.map(function (id) {
        var rec = idx[id], j = inl.indexOf(id);
        return '<button type="button" class="asf2-pop-item" data-a2-insert="' + esc(id) + '"><div>' + imgFill(rec.url) + '</div><span>' +
          (j > -1 ? 'in body ' + (j + 1) + ' \u00B7 ' : '') + esc(rec.fn || id) + '</span></button>';
      }).join('') + '</div>' : '') +
      '<div class="asf2-pop-foot"><span class="ix-chip-group">' + sizeChips() + '</span></div>' +
      '<div class="asf2-pop-foot"><span class="ix-chip-group">' + alignChips() + '</span></div>' +
      '<div class="asf2-pop-foot">Not here? <button type="button" class="ix-revert" data-asf-action="lib-open">Add from library</button></div>';
  }
  function sizeChips() {
    var cur = (S.inlinePicker && S.inlinePicker.imgSize) || 'large';
    return Object.keys(B.cfg.imgSizePct || {}).map(function (k) {
      return '<button type="button" class="ix-chip" data-a2-size="' + k + '" aria-pressed="' + (k === cur) + '">' + k + '</button>';
    }).join('');
  }
  function alignChips() {
    var size = (S.inlinePicker && S.inlinePicker.imgSize) || 'large';
    var cur = (S.inlinePicker && S.inlinePicker.imgAlign) || 'center';
    return Object.keys(B.cfg.imgAlignCss || {}).map(function (k) {
      return '<button type="button" class="ix-chip" data-a2-align="' + k + '" aria-pressed="' + (k === cur) + '"' + (size === 'full' ? ' disabled' : '') + '>' + k + '</button>';
    }).join('');
  }
  function setPop(open) {
    M.popOpen = !!open;
    var pop = q('[data-a2-pop]'), btn = q('[data-a2-act="imgpop"]');
    if (open) renderPop();
    if (pop) pop.hidden = !open;
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  /* ════════════════════════════════════════════════════════════
     BODY EDITOR (inline Trix; popout retired for Articles, 24 Sept)
     ════════════════════════════════════════════════════════════ */
  function bindTrix() {
    var t = trixEl();
    if (!t || t._a2Bound) return;
    t._a2Bound = true;
    t.addEventListener('trix-initialize', function () {
      if ((A().bodyHtml || '') === (M.base.bodyHtml || '')) M.trixBaseline = t.innerHTML;
      M.lastBodyFromTrix = A().bodyHtml || '';
    });
    t.addEventListener('trix-change', onTrixChange);
    t.addEventListener('trix-focus', function () { M.trixTouched = true; });
    // The editor's own file drop would bypass MEDIA entirely.
    t.addEventListener('trix-file-accept', function (e) { e.preventDefault(); B.toast('Add photos through Images \u2014 Upload or Add from library', 'info'); });
  }

  function onTrixChange(e) {
    var html = e.target.innerHTML || '';
    var a = A();
    a.bodyHtml = (M.trixBaseline != null && html === M.trixBaseline) ? (M.base.bodyHtml || '') : html;
    M.lastBodyFromTrix = a.bodyHtml;
    reconcileBody();
    B.deriveDirtySections();
    syncFields();
    renderBar();
    renderAi();
    var sig = inlineOrder().join('|');
    if (sig !== M.inlineSig) {
      M.inlineSig = sig;
      renderLeadAndTray();
      renderTicks();
      if (M.popOpen) renderPop();
    }
  }

  // AI, Undo headers and cancel change the body from outside the editor.
  function syncBodyFromState() {
    var t = trixEl();
    if (!t || !t.editor) return;
    var want = A().bodyHtml || '';
    if (M.lastBodyFromTrix === null || want === M.lastBodyFromTrix) return;
    M.lastBodyFromTrix = want;
    try { t.editor.loadHTML(want); } catch (err) { B.warn('body reload failed', err); }
  }

  function onMouseDown(e) {
    var b = e.target.closest && e.target.closest('[data-a2-act="imgpop"]');
    if (!b) return;
    e.preventDefault();          // keep the editor's selection alive
    var t = trixEl();
    if (t && t.editor) {
      try {
        var len = t.editor.getDocument().getLength();
        M.savedRange = M.trixTouched ? t.editor.getSelectedRange() : [Math.max(0, len - 1), Math.max(0, len - 1)];
      } catch (err) { M.savedRange = null; }
    }
  }

  function insertInline(id) {
    var rec = mediaIndex()[id];
    if (!rec || !rec.url) { B.toast('That image has no file to place', 'error'); return; }
    if (!S.inlinePicker) S.inlinePicker = {};
    S.inlinePicker.savedRange = M.savedRange;
    var ok = B.insertImageIntoBody({ imageUrl: rec.url, name: rec.fn, originalFilename: rec.fn, mediaId: id, role: rec.role || '' });
    setPop(false);
    if (ok) B.toast('Placed in the body', 'success');
  }

  /* ════════════════════════════════════════════════════════════
     EDITS
     ════════════════════════════════════════════════════════════ */
  function setField(k, v) {
    var a = A();
    if (k === '_type') { B.handleTypeChange(v); syncFields(); return; }   // renders when accepted
    if (k === 'customerId' && v === '__new__') {
      var sel = q('[data-a2-f="customerId"]');
      if (sel) sel.value = a.customerId || '';
      B.pickerOpenRef('customer');                                  // near matches, then + New customer
      return;
    }
    if (k === 'obligationId') { setObligation(v); return; }
    if (BOOL_KEYS[k]) v = !!v;
    if (k === 'isPaid' && !v && M.obl.base && M.obl.cur === M.obl.base) {
      var box = q('[data-a2-f="isPaid"]');
      if (box) box.checked = true;               // nothing changes until the warning is answered
      openPaidOffWarning();
      return;
    }
    a[k] = v;
    if (k === 'isPaid') {
      M.obl.cur = v ? M.obl.base : '';
      if (v) loadObligations();
    }
    if (k === 'customerId') {
      M.obl.cur = (v && v === M.base.customerId && a.isPaid) ? M.obl.base : '';
      if (a.isPaid) loadObligations();
    }
    if (NAME_KEYS[k]) {
      var hit = optionsFor(k === 'sectionId' ? 'section' : 'customer')
        .filter(function (o) { return o.value === v; })[0];
      a[NAME_KEYS[k]] = v ? (hit ? hit.label : '') : '';
    }
    if (S.aiFilled && S.aiFilled[k]) delete S.aiFilled[k];
    reconcileKey(k);
    B.deriveDirtySections();
    syncFields();
    renderTicks();
    renderBar();
  }

  function revertKey(k) {
    var a = A();
    if (k === '_type') {
      if ((S.articleType || 'standard') !== M.baseType) B.handleTypeChange(M.baseType);
      a.photoEssay = M.base.photoEssay; a.videoArticle = M.base.videoArticle;
      reconcileKey('photoEssay'); reconcileKey('videoArticle');
      B.render();
      return;
    }
    if (k === 'bodyHtml') {
      a.bodyHtml = M.base.bodyHtml || '';
      var st = B.aiAssistState(); st.bodyUndo = null;
      B.render();
      return;
    }
    if (k === '_main') { M.roles.main = M.baseRoles.main; if (M.roles.og === M.roles.main) M.roles.og = null; B.render(); return; }
    if (k === '_og') { M.roles.og = M.baseRoles.og; B.render(); return; }
    if (k === 'obligationId') { M.obl.cur = M.obl.base; syncFields(); renderBar(); return; }
    if (k === 'isPaid' || k === 'customerId') { M.obl.cur = M.obl.base; }
    a[k] = clone(M.base[k]);
    if (NAME_KEYS[k]) a[NAME_KEYS[k]] = M.base[NAME_KEYS[k]] || '';
    if (S.aiFilled) delete S.aiFilled[k];
    if (S.textFilled) delete S.textFilled[k];
    reconcileKey(k);
    B.deriveDirtySections();
    syncFields();
    renderTicks();
    renderBar();
    if (k === 'galleryMediaIds') B.render();
  }

  function cancelAll() {
    var a = A();
    FIELD_KEYS.forEach(function (k) { a[k] = clone(M.base[k]); });
    ['sectionName', 'customerName'].forEach(function (k) { a[k] = M.base[k] || ''; });
    M.obl.cur = M.obl.base;
    S.articleType = M.baseType;
    a.bodyHtml = M.base.bodyHtml || '';
    M.roles = clone(M.baseRoles);
    M.imgText = clone(M.imgBase);
    S.rtpManualState = clone(S.originalManual || {});
    S.aiFilled = {};
    var st = B.aiAssistState(); st.done = false; st.error = ''; st.bodyUndo = null;
    M.trayPref = null;
    B.render();
    B.toast(S.mode === 'create' ? 'Back to how this form opened' : 'Reverted to the saved version', 'info');
  }

  function clickRole(role, id) {
    if (role === 'main') {
      if (isPhotoEssay()) return;
      M.roles.main = (M.roles.main === id) ? '' : id;
      if (M.roles.og === M.roles.main) M.roles.og = null;
    } else {
      M.roles.og = (M.roles.og === id) ? null : (id === M.roles.main ? null : id);
    }
    B.render();
  }

  function setImgText(key, v) {
    var p = key.split(':'), id = p[0], f = p[1];
    if (!M.imgText[id]) return;
    M.imgText[id][f] = v;
    var ch = imgChanged(id, f);
    var el = q('[data-a2-img-f="' + key + '"]');
    if (el) el.classList.toggle('ix-picker-input--changed', ch);
    var rv = q('[data-a2-revimg="' + key + '"]');
    if (rv) rv.hidden = !ch;
    if (f === 'alt') applyRoles();
    renderTicks();
    renderBar();
  }
  function revertImgText(key) {
    var p = key.split(':'), id = p[0], f = p[1];
    if (!M.imgText[id] || !M.imgBase[id]) return;
    M.imgText[id][f] = M.imgBase[id][f];
    var el = q('[data-a2-img-f="' + key + '"]');
    if (el) el.value = M.imgText[id][f];
    setImgText(key, M.imgText[id][f]);
  }

  function toggleTick(id) {
    if (!S.rtpManualState) S.rtpManualState = {};
    S.rtpManualState[id] = !S.rtpManualState[id];
    renderTicks();
    renderBar();
  }

  function openTray(open) {
    M.trayPref = !!open;
    renderLeadAndTray();
    if (open && window.innerWidth <= 1180) {
      var tc = q('[data-a2-traycol]');
      if (tc && tc.scrollIntoView) tc.scrollIntoView({ block: 'nearest' });
    }
  }

  /* ════════════════════════════════════════════════════════════
     OBLIGATION — Paid + Customer (ruled 24 Sept)
     The OBLIGATION holds the reference to the article. Scenario G
     lists this customer's Open Article obligations (Title-Admin empty
     or this title) plus the one already linked to this article.
     Connect / create / unhook are pending until Save.
     ════════════════════════════════════════════════════════════ */
  function oblIds() {
    var oi = (B.cfg.tenant.cfg() || {}).optionIds || {};
    return { status: oi.obligationStatus || {}, type: oi.obligationType || {} };
  }
  function oblConfigMissing() {
    var o = oblIds(), miss = [];
    if (!o.type.article) miss.push('TA_CONFIG.optionIds.obligationType.article');
    ['open', 'assigned'].forEach(function (k) { if (!o.status[k]) miss.push('TA_CONFIG.optionIds.obligationStatus.' + k); });
    if (!B.cfg.tenant.makeStudio()) miss.push('TA_CONFIG.makeStudio');
    return miss;
  }
  function statusWord(hash) {
    var st = oblIds().status;
    for (var k in st) if (own(st, k) && st[k] === hash) return k;
    return '';
  }

  function loadObligations() {
    var a = A(), cust = a.customerId || '';
    if (!HC.paidLive || !a.isPaid || !cust) { syncFields(); renderBar(); return; }
    if (M.obl.loadedFor === cust || M.obl.loading) return;
    var miss = oblConfigMissing();
    if (miss.length) { M.obl.err = 'missing ' + miss.join(', '); M.obl.loadedFor = cust; syncFields(); return; }
    var o = oblIds();
    M.obl.loading = true; M.obl.err = '';
    syncFields();
    var seq = M.seq;
    postG({
      action: 'listObligations',
      customerId: cust,
      titleAdminId: B.cfg.tenant.taItemId(),
      articleItemId: a.id || '',
      obligationType: o.type.article,
      statusOpen: o.status.open,
      statusAssigned: o.status.assigned
    }).then(function (j) {
      if (!M || M.seq !== seq) return;
      M.obl.loading = false;
      M.obl.loadedFor = cust;
      if (!j || j.ok !== true || !Array.isArray(j.items)) {
        M.obl.list = [];
        M.obl.err = (j && j.error) || 'Scenario G did not return a list';
      } else {
        M.obl.list = j.items.filter(function (x) { return x && x.id; });
        var aid = A().id || '';
        if (!M.obl.baseKnown && aid && cust === (M.base.customerId || '')) {
          var linked = M.obl.list.filter(function (x) { return x.articleId === aid; })[0];
          M.obl.base = linked ? linked.id : '';
          if (M.obl.cur === '' && A().isPaid) M.obl.cur = M.obl.base;
          M.obl.baseKnown = true;
        }
      }
      syncFields(); renderBar();
    }).catch(function (err) {
      if (!M || M.seq !== seq) return;
      M.obl.loading = false; M.obl.loadedFor = cust; M.obl.list = [];
      M.obl.err = err && err.message ? err.message : 'request failed';
      syncFields();
    });
  }

  function syncObligationSelect(el) {
    var a = A();
    var dis = !HC.paidLive || !a.isPaid || !a.customerId || M.obl.loading || !!M.obl.err;
    var opts;
    if (!HC.paidLive || !a.isPaid) opts = [['', '\u2014 not a paid article \u2014']];
    else if (!a.customerId) opts = [['', 'Pick a customer first']];
    else if (M.obl.loading) opts = [['', 'Looking up obligations\u2026']];
    else if (M.obl.err) opts = [['', 'Could not load obligations \u2014 ' + M.obl.err]];
    else {
      opts = [['', '\u2014 none \u2014']];
      M.obl.list.forEach(function (x) {
        var w = statusWord(x.status);
        opts.push([x.id, (x.name || x.id) + (w && w !== 'open' ? ' (' + w + ')' : '')]);
      });
      opts.push(['__new__', '+ New obligation']);
    }
    var html = opts.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('');
    if (el.innerHTML !== html) el.innerHTML = html;
    var v = dis ? '' : M.obl.cur;
    if (el.value !== v) el.value = v;
    el.disabled = dis;
    el.title = M.obl.err ? M.obl.err : '';
  }

  function setObligation(v) {
    M.obl.cur = v || '';
    syncFields();
    renderBar();
  }

  function oblName(id) {
    var x = M.obl.list.filter(function (o) { return o.id === id; })[0];
    return x ? (x.name || id) : id;
  }

  /* Paid off while linked: warn first (ruled 24 Sept). */
  function openPaidOffWarning() {
    closeModal();
    var host = document.createElement('div');
    host.className = 'ix-overlay';
    host.setAttribute('data-a2-modal', '1');
    host.innerHTML =
      '<div class="ix-modal" role="dialog" aria-modal="true" aria-labelledby="a2-paidoff-t">' +
        '<div class="ix-modal-bar"></div>' +
        '<div class="ix-modal-head"><div class="ix-modal-title-block">' +
          '<h2 class="ix-modal-title" id="a2-paidoff-t">Turn Paid off?</h2>' +
          '<div class="ix-modal-sub">this article is linked to an obligation</div>' +
        '</div></div>' +
        '<div class="ix-modal-body"><p>This article fulfils <b>' + esc(oblName(M.obl.base)) + '</b>. ' +
          'If you turn Paid off, Save will unhook the article and set that obligation back to Open, ' +
          'so it can be used by another article. Nothing changes until you press Save.</p></div>' +
        '<div class="ix-modal-footer"><span class="ix-modal-footer-right">' +
          '<button type="button" class="ix-btn ix-btn--ghost" data-a2m="keep">Keep paid</button>' +
          '<button type="button" class="ix-btn ix-btn--primary" data-a2m="off">Turn off</button>' +
        '</span></div>' +
      '</div>';
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a2m]');
      if (!b && e.target !== host) return;
      var off = b && b.getAttribute('data-a2m') === 'off';
      closeModal();
      if (off) {
        A().isPaid = false;
        M.obl.cur = '';
        reconcileKey('isPaid');
        B.deriveDirtySections();
        syncFields(); renderTicks(); renderBar();
      }
    });
    (S.overlay || document.body).appendChild(host);
    M.modalOpen = true;
    var f = host.querySelector('[data-a2m="keep"]');
    if (f) f.focus();
  }
  function closeModal() {
    if (!S || !S.overlay) return;
    Array.prototype.forEach.call(S.overlay.querySelectorAll('[data-a2-modal]'), function (n) { n.remove(); });
    if (M) M.modalOpen = false;
  }

  function postG(payload) {
    var url = B.cfg.tenant.makeStudio();
    payload.titleSlug = B.cfg.tenant.titleSlug();
    payload.taItemId = B.cfg.tenant.taItemId();
    payload.asfVersion = B.version;
    payload.moduleVersion = VERSION;
    B.log(payload.action + ' \u2192 Scenario G', payload);
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) {
        return r.text().then(function (t) {
          var j = null;
          try { j = JSON.parse(t); } catch (e) {}
          if (!r.ok) throw new Error('HTTP ' + r.status + ((j && j.error) ? ' \u00B7 ' + j.error : ''));
          if (!j) throw new Error('Scenario G returned no JSON for ' + payload.action);
          return j;
        });
      });
  }

  /* Run the pending obligation change for articleId. Resolves
     { ok, note } and never throws. TOAST-TRUTH: each step must come
     back with the record as written. */
  function runObligation(articleId) {
    var base = M.obl.base, cur = M.obl.cur;
    if (cur === base) return Promise.resolve({ ok: true, note: '' });
    var o = oblIds(), a = A();
    var steps = [];
    if (base) steps.push(function () {
      return postG({ action: 'unlinkObligation', obligationId: base, articleItemId: articleId, statusOpen: o.status.open })
        .then(function (j) {
          var w = j && j.obligation;
          if (j.ok !== true || !w || w.id !== base || (w.articleId || '') !== '' || w.status !== o.status.open)
            throw new Error('unhook of ' + oblName(base) + ' not confirmed');
          return 'unhooked ' + oblName(base) + ' (back to Open)';
        });
    });
    if (cur === '__new__') steps.push(function () {
      var name = (a.customerName || 'Customer') + ' \u2014 Article \u2014 ' + (a.name || 'Untitled');
      return postG({
        action: 'createObligation', name: name, customerId: a.customerId,
        titleAdminId: B.cfg.tenant.taItemId(), articleItemId: articleId,
        obligationType: o.type.article, statusAssigned: o.status.assigned
      }).then(function (j) {
        var w = j && j.obligation;
        if (j.ok !== true || !w || !w.id || w.articleId !== articleId || w.status !== o.status.assigned)
          throw new Error('new obligation not confirmed');
        M.obl.list.push({ id: w.id, name: w.name || name, status: w.status, articleId: articleId });
        M.obl.cur = w.id;
        return 'created obligation ' + (w.name || name);
      });
    });
    else if (cur) steps.push(function () {
      return postG({
        action: 'linkObligation', obligationId: cur, articleItemId: articleId,
        titleAdminId: B.cfg.tenant.taItemId(), statusAssigned: o.status.assigned
      }).then(function (j) {
        var w = j && j.obligation;
        if (j.ok !== true || !w || w.id !== cur || w.articleId !== articleId || w.status !== o.status.assigned)
          throw new Error('link to ' + oblName(cur) + ' not confirmed');
        return 'linked to ' + oblName(cur);
      });
    });
    var notes = [];
    return steps.reduce(function (p, fn) {
      return p.then(function () { return fn().then(function (n) { notes.push(n); }); });
    }, Promise.resolve()).then(function () {
      M.obl.base = M.obl.cur;
      return { ok: true, note: notes.join('; ') };
    }).catch(function (err) {
      B.warn('obligation step failed', err);
      return { ok: false, note: notes.join('; '), error: err && err.message ? err.message : 'failed' };
    });
  }

  /* ════════════════════════════════════════════════════════════
     EVENTS — ta-asf offers every overlay event here first
     ════════════════════════════════════════════════════════════ */
  function handle(type, e) {
    if (!B || !S || !M) return false;
    IDX = null;
    var t = e.target;
    if (type === 'keydown') {
      var key = e.key || '';
      if ((e.metaKey || e.ctrlKey) && (key === 's' || key === 'S')) {
        if (S.lib && S.lib.open) return false;
        e.preventDefault();
        save();
        return true;
      }
      if (key === 'Escape' && M.modalOpen) {
        e.preventDefault(); e.stopPropagation();
        closeModal();
        return true;
      }
      if (key === 'Escape' && M.popOpen) {
        e.preventDefault(); e.stopPropagation();
        setPop(false);
        return true;
      }
      return false;
    }
    if (!t || !t.closest || !t.closest('.asf2')) {
      if (type === 'click' && M.popOpen) setPop(false);
      return false;
    }

    if (type === 'click') {
      var el = t.closest('[data-a2-act],[data-a2-revert],[data-a2-revimg],[data-a2-role],[data-a2-tray],[data-a2-tick],[data-a2-insert],[data-a2-size],[data-a2-align]');
      if (M.popOpen && !t.closest('[data-a2-pop]') && !(el && el.getAttribute('data-a2-act') === 'imgpop')) setPop(false);
      if (!el || el.disabled) return false;
      var act = el.getAttribute('data-a2-act');
      if (act === 'save') { save(); return true; }
      if (act === 'cancel-all') { cancelAll(); return true; }
      if (act === 'imgpop') { setPop(!M.popOpen); return true; }
      if (el.hasAttribute('data-a2-revert')) { revertKey(el.getAttribute('data-a2-revert')); return true; }
      if (el.hasAttribute('data-a2-revimg')) { revertImgText(el.getAttribute('data-a2-revimg')); return true; }
      if (el.hasAttribute('data-a2-role')) { clickRole(el.getAttribute('data-a2-role'), el.getAttribute('data-a2-img')); return true; }
      if (el.hasAttribute('data-a2-tray')) { openTray(el.getAttribute('data-a2-tray') === 'open'); return true; }
      if (el.hasAttribute('data-a2-tick')) { toggleTick(el.getAttribute('data-a2-tick')); return true; }
      if (el.hasAttribute('data-a2-insert')) { insertInline(el.getAttribute('data-a2-insert')); return true; }
      if (el.hasAttribute('data-a2-size') || el.hasAttribute('data-a2-align')) {
        if (!S.inlinePicker) S.inlinePicker = {};
        if (el.hasAttribute('data-a2-size')) {
          S.inlinePicker.imgSize = el.getAttribute('data-a2-size');
          if (S.inlinePicker.imgSize === 'full') S.inlinePicker.imgAlign = 'center';
        } else {
          S.inlinePicker.imgAlign = el.getAttribute('data-a2-align');
        }
        renderPop();
        return true;
      }
      return false;
    }

    if (type === 'input') {
      if (t.hasAttribute('data-a2-img-f')) { setImgText(t.getAttribute('data-a2-img-f'), t.value); return true; }
      if (t.hasAttribute('data-a2-f') && t.tagName !== 'SELECT' && t.type !== 'checkbox') {
        setField(t.getAttribute('data-a2-f'), t.value);
        return true;
      }
      return !!t.closest('trix-editor');
    }

    if (type === 'change') {
      if (t.hasAttribute('data-a2-f')) {
        setField(t.getAttribute('data-a2-f'), t.type === 'checkbox' ? t.checked : t.value);
        return true;
      }
      return !!t.hasAttribute('data-a2-img-f');
    }

    if (type === 'focusout') {
      var f = t.getAttribute && t.getAttribute('data-a2-f');
      if (f && B.urlFields[f] && !t.readOnly) {
        var norm = B.normalizeUrl(t.value);
        if (norm !== t.value) { t.value = norm; setField(f, norm); }
        return true;
      }
      return !!f || !!(t.hasAttribute && t.hasAttribute('data-a2-img-f'));
    }
    return false;
  }

  /* ════════════════════════════════════════════════════════════
     SAVE — one Save for everything (ruled 24 Sept, C1 rule: a
     multi-field record written through a Make scenario).
       1. captions / alt  → Scenario G updateMediaText (MEDIA)
       2. the article     → ta-asf commitSaveDraft (updateAsset or
                            createAsset), which verifies and toasts
     Step 2 does not run if step 1 is not confirmed.
     ════════════════════════════════════════════════════════════ */
  function save() {
    if (!B || S.saving || M.savingMedia) return;
    if (!S.hydrated) return;
    var items = mediaTextItems();
    var art = articleHasChanges();
    var oblChange = M.obl.cur !== M.obl.base;
    if (!items.length && !art && !oblChange && S.mode !== 'create') { B.toast('Nothing to save', 'info'); return; }
    if (S.mode === 'create' && !String(A().name || '').trim()) {
      B.toast('Headline is required to create an article', 'error');
      var h = q('[data-a2-f="name"]'); if (h) h.focus();
      return;
    }
    if (oblChange && M.obl.cur && oblConfigMissing().length) {
      B.toast('NOT SAVED: obligation settings missing \u2014 ' + oblConfigMissing().join(', '), 'error');
      return;
    }
    var notes = [];
    var step1 = items.length ? saveMediaText(items) : Promise.resolve({ ok: true, count: 0 });
    step1.then(function (res) {
      if (!res.ok) return;
      if (res.count) notes.push(res.count + ' caption/alt change' + (res.count === 1 ? '' : 's') + ' confirmed on MEDIA');

      if (S.mode === 'create') {
        // The article must exist before an obligation can point at it.
        if (oblChange) {
          S.afterCreate = function (newId) {
            return runObligation(newId).then(function (r) {
              if (r.ok) return { ok: true, note: r.note };
              return { ok: false, note: r.note, error: 'obligation NOT saved \u2014 ' + r.error + '. The article was created; press Save to try the obligation again.' };
            });
          };
        }
        saveArticle(notes.join('; '));
        return;
      }

      var step2 = oblChange ? (M.savingMedia = true, renderBar(), runObligation(A().id)) : Promise.resolve({ ok: true, note: '' });
      step2.then(function (r) {
        M.savingMedia = false;
        if (!r.ok) {
          B.toast('NOT SAVED: ' + r.error + (notes.concat(r.note ? [r.note] : []).length ? ' (' + notes.concat(r.note ? [r.note] : []).join('; ') + ' \u2014 those did save.)' : '') + ' The article was not saved.', 'error');
          syncFields(); renderBar();
          return;
        }
        if (r.note) notes.push(r.note);
        if (art) { saveArticle(notes.join('; ')); return; }
        B.toast('Saved \u2014 ' + notes.join('; '), 'success');
        try { window.dispatchEvent(new CustomEvent('inbx:asset-saved', { detail: { assetType: 'article', itemId: A().id } })); } catch (e) {}
        setTimeout(B.publicClose, 350);
      });
    });
  }

  function saveArticle(note) {
    S.saveExtraNote = note || '';
    B.commitSaveDraft();
    renderBar();
  }

  function saveMediaText(items) {
    var url = B.cfg.tenant.makeStudio();
    if (!url) {
      B.toast('NOT SAVED: captions and alt \u2014 Scenario G (makeStudio) is not configured', 'error');
      return Promise.resolve({ ok: false });
    }
    var payload = {
      action: 'updateMediaText',
      assetType: 'article',
      titleSlug: B.cfg.tenant.titleSlug(),
      taItemId: B.cfg.tenant.taItemId(),
      articleItemId: A().id || '',
      asfVersion: B.version,
      moduleVersion: VERSION,
      items: items
    };
    B.log('updateMediaText payload \u2192 Scenario G', payload);
    M.savingMedia = true;
    renderBar();
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.text().then(function (t) { return { ok: r.ok, status: r.status, txt: t }; }); })
      .then(function (r) {
        var j = null;
        try { j = JSON.parse(r.txt); } catch (e) {}
        if (!r.ok) throw new Error('HTTP ' + r.status);
        if (!j || j.ok !== true) throw new Error((j && j.error) || 'Scenario G did not confirm updateMediaText \u2014 see console');
        var v = verifyMediaText(items, j.items);
        M.savingMedia = false;
        if (!v.ok) {
          B.warn('updateMediaText NOT CONFIRMED', v.failed);
          var idx = mediaIndex();
          B.toast('NOT SAVED: ' + v.failed.slice(0, 4).map(function (f) {
            return ((idx[f.mediaId] && idx[f.mediaId].fn) || f.mediaId) + ' ' + f.field;
          }).join(', ') + (v.failed.length > 4 ? ' +' + (v.failed.length - 4) + ' more' : '') +
            ' \u2014 not in the record Scenario G returned. The article was not saved either. See console.', 'error');
          renderBar();
          return { ok: false };
        }
        items.forEach(function (it) {
          if (!M.imgBase[it.mediaId]) return;
          if (it.setCaption) M.imgBase[it.mediaId].caption = it.caption;
          if (it.setAltText) M.imgBase[it.mediaId].alt = it.altText;
        });
        renderLeadAndTray();
        renderBar();
        return { ok: true, count: v.confirmed };
      })
      .catch(function (err) {
        M.savingMedia = false;
        B.warn('updateMediaText failed', err);
        B.toast('NOT SAVED: captions and alt \u2014 ' + (err && err.message ? err.message : 'unknown error') + '. The article was not saved either.', 'error');
        renderBar();
        return { ok: false };
      });
  }

  // TOAST-TRUTH: success needs the echoed MEDIA record to hold what we sent.
  function verifyMediaText(items, echoed) {
    var out = { ok: false, confirmed: 0, failed: [] };
    var byId = {};
    (Array.isArray(echoed) ? echoed : []).forEach(function (e) { if (e && e.mediaId) byId[e.mediaId] = e; });
    items.forEach(function (it) {
      var e = byId[it.mediaId];
      if (!e) {
        if (it.setCaption) out.failed.push({ mediaId: it.mediaId, field: 'caption', why: 'absent' });
        if (it.setAltText) out.failed.push({ mediaId: it.mediaId, field: 'alt', why: 'absent' });
        return;
      }
      function same(a, b) { return String(a == null ? '' : a).trim() === String(b == null ? '' : b).trim(); }
      if (it.setCaption) { if (same(e.caption, it.caption)) out.confirmed++; else out.failed.push({ mediaId: it.mediaId, field: 'caption', why: 'mismatch', got: e.caption }); }
      if (it.setAltText) { if (same(e.altText, it.altText)) out.confirmed++; else out.failed.push({ mediaId: it.mediaId, field: 'alt', why: 'mismatch', got: e.altText }); }
    });
    out.ok = out.failed.length === 0;
    return out;
  }

  /* ════════════════════════════════════════════════════════════
     HOOKS ta-asf calls
     ════════════════════════════════════════════════════════════ */
  function connect(bridge) {
    B = bridge;
    S = bridge.state;
  }
  function hasPending() { return !!(M && S && S.hydrated && changeList().length); }
  function onSaveState() { if (M) renderBar(); }
  function onClose() { M = null; }

  // ta-image-gen hands its result to setMainImageFromMedia. On the
  // Article form that result joins the tray instead (ruled 24 Sept):
  // AI badge, unused until the operator places it.
  function addGeneratedImage(media) {
    if (!media || !media.mediaId) return false;
    B.registerSessionMedia({ mediaId: media.mediaId, name: media.name || '', imageUrl: media.imageUrl || '', originalFilename: media.name || '' });
    if (M) M.aiImages[media.mediaId] = true;
    B.render();
    setTimeout(function () { B.toast('Generated image added to Images \u2014 unused until you place it', 'success'); }, 60);
    return true;
  }

  window.InbxASFArticle = {
    version: VERSION,
    connect: connect,
    render: render,
    handle: handle,
    save: save,
    hasPending: hasPending,
    onSaveState: onSaveState,
    onClose: onClose,
    addGeneratedImage: addGeneratedImage,
    // Read-only, for console checks and tests. Never write through it.
    _debug: function () { return M; }
  };

  // ta-asf may already be open (script order on the page). Repaint.
  try {
    if (window.InbxASF && window.InbxASF.isOpen && window.InbxASF.isOpen() &&
        window.InbxASF._internal && window.InbxASF._internal.render) {
      window.InbxASF._internal.render();
    }
  } catch (e) {}
})();
