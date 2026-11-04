/* ix-site-ads-v1_0_1.js
   v1.0.1 (4 Nov 2026, S9c) franchise pages take the top-banner rule; the
          sponsor panel, the franchise slot and the house card are gone;
          the rail signal (html.ixsa-rail-on) for three-across cards.
          v1.0.0 was committed but never loaded by any template.
   INBXIFY · Site ads · one module for every code-built page.
   Code-Built Site S9b, 3 Nov 2026; top banner S9c, 4 Nov 2026. Needs ix-issue-data v1.0.145+ (GET /site-ads),
   ix-shell v1.0.15+ (the rail slot and the drawn hook) and the page scripts
   that name their anchors (ix-article v1.0.15 (S9c), ix-archives v1.1.5,
   ix-directory v1.1.5, ix-franchise v1.1.3). Pairs with ix-site-ads-v1_0_1.css.

   WHAT IT DOES
     The PubPlan chose the week's ads (the title's current issue). This file
     only arranges them on the page. It never selects, never blocks a
     competitor (ruling 1, S9): it shuffles what the Worker sends.

     Order     The Lead first, pinned. The rest shuffled (Fisher-Yates, as
               ix-ba-rotate v1.0.1), weighted by placements: an ad bought twice
               is twice as likely to land early. ?norotate=1 shows the saved
               order.
     No repeat The rotating ads a reader saw on the last page go to the back
               of the queue on this page (sessionStorage, per title). The
               Lead and a sponsor are exempt.
     Shapes    A rail or phone-inline spot takes a sidebar; a list spot takes
               a banner. An ad without the shape a spot needs is passed over
               and the next ad moves up. A banner is never scaled into a
               sidebar spot. Only approved shapes reach the page (the Worker
               sends a picture only when its ADS approval field reads
               Approved).
     Once      Every ad shows at most once on a page.
     Rows      A list ad never splits a row of a card grid: it goes after the
               last card of the row holding the listEvery-th card, and the
               count starts again after it.
     Sticky    A rail short enough to fit the window stays in view while the
               reader scrolls (the paper is usually much longer than the
               rail); a taller rail scrolls with the page.
     Widths    1080px and wider: the rail beside the paper. Narrower: phone
               inline spots after paragraphs (articles) and list spots.
               Crossing 1080 redraws in the same order (no new shuffle, no
               second display event).

   THE PAGE KINDS
     article    The top banner (S9c, Jeff's rulings of 3 and 4 Nov): one
                700x235 banner at the top of the article column, under the
                franchise band, at the card's width. Who holds it:
                  paid       the buyer (site.article.paid), at every width
                  sponsored  the sponsor (site.article.sponsor), at every width
                  nobody     the Lead's banner at 1080px and wider; on phone
                             and tablet no top banner at all
                Whoever holds the top banner is left out of the rail and the
                inline ads (any ad in the set from the same customer too). A
                holder with no approved banner leaves the top empty (the Lead
                never stands in over a buyer or a sponsor). The words
                ("Presented by ...") are ix-article's, not this file's.
                Rail: the Lead (unless it holds the top banner), then
                railRotating more, under the placement label. Phone: after
                paragraphs inlineAfter, at most inlineCap; the Lead first,
                never rotated, then rotating ads.
     archives,  Rail as an article. List: one banner every listEvery cards,
     directory  at every width.
     franchise  The same top-banner rule (Jeff, 4 Nov, S9c): the franchise
                sponsor's banner at the top of the column under the band, at
                every width (its picture from /site-ads, else
                site.franchise.sponsor); when unsponsored the Lead's banner at
                1080px and wider, nothing on phone. The sponsor is left out
                of the rail and the list. Rail and list spots as on
                Archives. The S9b sponsor panel, the slot after the first
                row and its ladder (rotating banner, else house ad) are gone.

   THE RAIL SIGNAL (S9c)
     While the rail shows, <html> carries the class ixsa-rail-on, and each
     change fires "ixsa:rail" on document with detail { on }. ix-franchise
     uses it to set its cards three across beside the rail (Jeff, 4 Nov).

   HOW A PAGE CALLS IT
     The shell (v1.0.15) fires "ixs:drawn" on document once the page script's
     promise settles, with detail { kind, site, paper, rail, title }. Before
     that, the page script hands its anchors over:
       IXSiteAds.anchors({
         paras:  [p, p, ...]            article body paragraphs, in order
         list:   { host, items: [...] } list cards, in order (ads go after
                                        every listEvery-th card, inside host)
         top:    element                article and franchise: the empty
                                        top-banner slot, filled here
         paid:   site.article.paid      article only
         sponsor: the sponsor           site.article.sponsor or site.franchise.sponsor
         franchise: { slug, name, bandColor }   franchise page only
       });

   GA4 (ruling 8, S9) · existing dimensions only
     ad_display  once per ad per page, when half the ad is on screen for half
                 a second (HC-P-CBS9b-3). ad_click on every click.
     Parameters: advertiser_id, advertiser, element_id, element_name,
     element_type (banner | sidebar), page_type, element_position
     (top, rail-1, inline-2, list-1), newsletter_id,
     newsletter_name. Sent through gtag when present, else dataLayer.

   NOTHING IS TYPED PER TITLE. Placement settings come from PUBLISHERS
   settings-json (title override on TITLES-ADMIN) through the Worker. No
   placement settings = no site ads (the Worker's problems[] says why, and
   the console repeats it).

   HARDCODING (provisional, for the S9b delta)
     HC-P-CBS9b-1  the 1080px break (WIDE), platform constant (Scoping v0.2 rule 11).
     HC-P-CBS9b-2  sessionStorage key ixsa-seen:<title>, one page of memory.
     HC-P-CBS9b-3  display rule 50% for 500 ms (VIS_RATIO, VIS_MS), platform constant.
     HC-P-CBS9b-4  retired in S9c (the house ad card left with the franchise slot).
     HC-P-CBS9b-5  shapes per spot: rail and phone inline = sidebar; list and
                   top = banner.
     HC-P-CBS9c-1  the top-banner holder order: buyer, then sponsor, then (at
                   1080px and wider only) the Lead.
     HC-P-CBS9b-8  the rail stays in view (sticky, 24px from the top) when it
                   fits the window with 48px to spare; a taller rail scrolls
                   with the page.
*/
(function () {
  'use strict';
  if (window.IXSiteAds) return;

  var VERSION = '1.0.1';
  var WIDE = 1080;                    // HC-P-CBS9b-1
  var VIS_RATIO = 0.5, VIS_MS = 500;  // HC-P-CBS9b-3
  var SEEN = 'ixsa-seen:';            // HC-P-CBS9b-2

  var doc = document;
  var state = { anchors: null, ctx: null, data: null, order: null, drawnWide: null, shown: {}, seenNow: [] };

  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function safeHref(u) { u = String(u || '').trim(); return /^(https?:|mailto:|tel:)/i.test(u) ? u : ''; }
  function warn(m) { try { console.warn('[ix-site-ads] ' + m); } catch (e) {} }
  function info(m) { try { console.info('[ix-site-ads] ' + m); } catch (e) {} }
  function isWide() { return window.matchMedia('(min-width:' + WIDE + 'px)').matches; }
  function noRotate() { try { return /[?&]norotate=1\b/.test(location.search); } catch (e) { return false; } }
  function worker() { return (window.IXShell && window.IXShell.worker) || 'https://ix-issue-data.jeff-2cd.workers.dev'; }

  /* ── the order ── */
  function shuffle(list) {
    var a = list.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function readSeen(title) { try { return JSON.parse(sessionStorage.getItem(SEEN + title) || '[]') || []; } catch (e) { return []; } }
  function writeSeen(title, ids) { try { sessionStorage.setItem(SEEN + title, JSON.stringify(ids)); } catch (e) {} }

  function buildOrder(d, title, excludeIds) {
    var ads = (d.ads || []).filter(function (a) { return excludeIds.indexOf(a.adId) < 0; });
    var lead = null, rest = [];
    ads.forEach(function (a) { if (a.adId === d.lead && !lead) lead = a; else rest.push(a); });
    if (noRotate()) return (lead ? [lead] : []).concat(rest);
    // Weighted: one ticket per placement, shuffle the tickets, keep each ad's first ticket.
    var tickets = [];
    rest.forEach(function (a) { var n = Math.max(1, parseInt(a.placements, 10) || 1); for (var i = 0; i < n; i++) tickets.push(a); });
    var seenIds = {}, order = [];
    shuffle(tickets).forEach(function (a) { if (!seenIds[a.adId]) { seenIds[a.adId] = 1; order.push(a); } });
    // No repeat: last page's rotating ads go to the back, in their new order.
    var last = readSeen(title);
    var fresh = order.filter(function (a) { return last.indexOf(a.adId) < 0; });
    var stale = order.filter(function (a) { return last.indexOf(a.adId) >= 0; });
    return (lead ? [lead] : []).concat(fresh, stale);
  }

  /* One queue per page draw: each spot takes the next unused ad with its shape. */
  function Queue(order) { this.order = order; this.used = {}; }
  Queue.prototype.take = function (shape) {
    for (var i = 0; i < this.order.length; i++) {
      var a = this.order[i];
      if (this.used[a.adId]) continue;
      if (!a[shape]) continue;            // move up: the next ad with this shape takes the spot
      this.used[a.adId] = 1;
      return a;
    }
    return null;
  };
  Queue.prototype.mark = function (id) { if (id) this.used[id] = 1; };

  /* ── GA4 ── */
  function params(ad, type, pos) {
    var c = state.ctx || {}, iss = (state.data && state.data.issue) || {};
    return {
      advertiser_id: ad.customerId || '', advertiser: ad.advertiser || '',
      element_id: (type === 'sidebar' && ad.sidebarAdId) ? ad.sidebarAdId : (ad.adId || ''),
      element_name: ad.adName || '', element_type: type,
      page_type: c.kind || '', element_position: pos,
      newsletter_id: iss.nlId || '', newsletter_name: iss.code || ''
    };
  }
  function send(name, p) {
    try {
      if (typeof window.gtag === 'function') { window.gtag('event', name, Object.assign({ transport_type: 'beacon' }, p)); return; }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: name }, p));
    } catch (e) {}
  }
  var io = null;
  function watch(node, ad, type, pos) {
    var key = (ad.adId || '') + ':' + type;
    node.addEventListener('click', function () { send('ad_click', params(ad, type, pos)); });
    if (state.shown[key]) return;                // once per ad per page, also across a redraw
    if (!('IntersectionObserver' in window)) return;
    if (!io) io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var n = en.target;
        if (en.isIntersecting && en.intersectionRatio >= VIS_RATIO) {
          if (!n._ixsaT) n._ixsaT = setTimeout(function () {
            n._ixsaT = null;
            if (state.shown[n._ixsaKey]) { io.unobserve(n); return; }
            state.shown[n._ixsaKey] = 1;
            send('ad_display', n._ixsaP);
            io.unobserve(n);
          }, VIS_MS);
        } else if (n._ixsaT) { clearTimeout(n._ixsaT); n._ixsaT = null; }
      });
    }, { threshold: [0, VIS_RATIO, 1] });
    node._ixsaKey = key; node._ixsaP = params(ad, type, pos);
    io.observe(node);
  }

  /* ── drawing ── */
  function picture(src, alt) { var i = el('img', 'ixsa-img'); i.src = src; i.alt = alt || ''; i.loading = 'lazy'; i.decoding = 'async'; return i; }
  function adLink(ad, src) {
    var h = safeHref(ad.link);
    var a = el(h ? 'a' : 'div', 'ixsa-a');
    if (h) { a.href = h; a.target = '_blank'; a.rel = 'noopener sponsored'; }
    a.appendChild(picture(src, ad.advertiser));
    return a;
  }
  function label(text) { return el('div', 'ixsa-label', text); }
  function spot(ad, type, pos, cls, withLabel) {
    var box = el('aside', 'ixsa-spot ixsa-spot--' + type + (cls ? ' ' + cls : ''));
    box.setAttribute('data-ixsa-pos', pos);
    if (withLabel && state.data.placement.label) box.appendChild(label(state.data.placement.label));
    var a = adLink(ad, ad[type]);
    box.appendChild(a);
    watch(a, ad, type, pos);
    return box;
  }
  /* The rail stays in view while the reader scrolls a long page, when it is
     short enough to fit the window with room above and below (HC-P-CBS9b-8). */
  function stick(inner, rail) {
    if (rail.hidden) return;
    var fit = function () { inner.classList.toggle('ixsa-rail--stick', inner.offsetHeight + 48 <= window.innerHeight); };
    fit();
    if (!rail._ixsaFit) { rail._ixsaFit = true; window.addEventListener('resize', function () { var x = rail.querySelector('.ixsa-rail-in'); if (x) x.classList.toggle('ixsa-rail--stick', x.offsetHeight + 48 <= window.innerHeight); }); }
  }

  /* the index of the last card on the row that holds items[i] (its own grid's columns) */
  function rowEnd(items, i) {
    var n = items[i], par = n.parentNode, cols = 1;
    try {
      var g = getComputedStyle(par);
      if (g.display.indexOf('grid') >= 0) cols = g.gridTemplateColumns.split(' ').filter(Boolean).length || 1;
    } catch (e) {}
    if (cols < 2) return i;
    var sib = Array.prototype.filter.call(par.children, function (k) { return !k.hasAttribute('data-ixsa'); });
    var pos = sib.indexOf(n), last = Math.min(sib.length - 1, Math.ceil((pos + 1) / cols) * cols - 1);
    var end = items.indexOf(sib[last]);
    return end < 0 ? i : end;
  }

  function clear() {
    Array.prototype.forEach.call(doc.querySelectorAll('[data-ixsa]'), function (n) { n.parentNode && n.parentNode.removeChild(n); });
    var rail = state.ctx && state.ctx.rail;
    if (rail) { rail.innerHTML = ''; rail.hidden = true; }
    var an = state.anchors || {};
    [an.top].forEach(function (x) { if (x) { x.innerHTML = ''; x.hidden = true; } });
  }
  function mark(n) { n.setAttribute('data-ixsa', ''); return n; }

  /* S9c · who holds the article's top banner: the buyer, else the sponsor.
     Both come from /site (site.article), approved shapes only. null when
     nobody pays. A holder with no approved banner is still the holder. */
  function holderOf(an, d) {
    var pd = an.paid, sp = an.sponsor;
    var fs = (an.franchise && d && d.sponsors) ? d.sponsors[an.franchise.slug] : null;   // franchise page: /site-ads knows its ad
    if (fs) sp = { name: (sp && sp.name) || fs.advertiser || fs.adName, ad: fs.banner || (sp && sp.ad), link: fs.link || (sp && sp.link),
      customerId: fs.customerId, adId: fs.adId };
    if (pd && (pd.name || pd.adId || pd.customerId)) {
      return { kind: 'paid', adId: pd.adId || '', adName: pd.name || '', customerId: pd.customerId || '',
        advertiser: pd.name || '', banner: safeHref(pd.banner) || safeHref(pd.ad), link: pd.link };
    }
    if (sp && (sp.name || sp.ad || sp.customerId)) {
      return { kind: 'sponsor', adId: sp.adId || '', adName: sp.name || '', customerId: sp.customerId || '',
        advertiser: sp.name || '', banner: safeHref(sp.ad), link: sp.link };
    }
    return null;
  }
  function topSpot(ad) {
    var box = el('aside', 'ixsa-spot ixsa-spot--banner ixsa-spot--top');
    box.setAttribute('data-ixsa-pos', 'top');
    var a = adLink(ad, ad.banner);
    box.appendChild(a);
    watch(a, ad, 'banner', 'top');
    return box;
  }

  /* S9c · tell the page whether the rail shows (html.ixsa-rail-on and the
     "ixsa:rail" event), so a card grid can go three across beside it */
  function railState(on) {
    if (state.railOn === on) return;
    state.railOn = on;
    doc.documentElement.classList.toggle('ixsa-rail-on', on);
    try { doc.dispatchEvent(new CustomEvent('ixsa:rail', { detail: { on: on } })); } catch (e) {}
  }

  function draw() {
    var d = state.data, c = state.ctx, an = state.anchors || {};
    if (!c) return;
    var wide = isWide();
    state.drawnWide = wide;
    clear();

    /* the article's top banner (S9c). The buyer or sponsor shows even when
       /site-ads did not answer: their pictures come with the article. */
    var hasTop = (c.kind === 'article' || c.kind === 'franchise');
    var holder = hasTop ? holderOf(an, d) : null;
    var leadTop = false;
    if (hasTop && an.top) {
      var topAd = null;
      if (holder) topAd = holder.banner ? holder : null;
      else if (wide && d && state.order) {
        for (var t = 0; t < state.order.length; t++) {
          if (state.order[t].adId === d.lead && state.order[t].banner) { topAd = state.order[t]; leadTop = true; }
        }
      }
      if (topAd) { an.top.appendChild(topSpot(topAd)); an.top.hidden = false; }
    }
    if (!d || !state.order) { railState(false); return; }

    var p = d.placement;
    var q = new Queue(state.order);
    var seenNow = [];
    var take = function (shape) { var a = q.take(shape); if (a && a.adId !== d.lead) seenNow.push(a.adId); return a; };

    if (holder) {                                                   // the holder never repeats: its ad, and its customer's
      q.mark(holder.adId);
      if (holder.customerId) state.order.forEach(function (a) { if (a.customerId && a.customerId === holder.customerId) q.mark(a.adId); });
    }
    if (leadTop) q.mark(d.lead);                                    // the Lead holds the top banner: out of the rail

    /* the rail (1080 and wider) */
    if (wide && c.rail) {
      var rail = c.rail, inner = el('div', 'ixsa-rail-in'), n = 0;
      if (p.label) rail.setAttribute('aria-label', p.label);
      var stack = el('div', 'ixsa-rail-stack');
      if (p.label) stack.appendChild(label(p.label));
      var leadInRail = false;
      for (var i = 0; i < state.order.length; i++) {
        var o = state.order[i];
        if (o.adId === d.lead && o.sidebar && !q.used[o.adId]) leadInRail = true;
      }
      var want = (leadInRail ? 1 : 0) + p.railRotating;
      for (var k = 0; k < want; k++) {
        var a = take('sidebar'); if (!a) break;
        n++; stack.appendChild(spot(a, 'sidebar', 'rail-' + n, '', false));
      }
      if (n) inner.appendChild(stack);
      if (inner.children.length) rail.appendChild(inner);
      rail.hidden = !rail.children.length;
      stick(inner, rail);
    }
    railState(!!(wide && c.rail && !c.rail.hidden));

    /* phone inline, articles: the Lead first (it leads the order and never
       rotates), then rotating ads; the top-banner holder is already left out */
    if (!wide && c.kind === 'article' && an.paras && an.paras.length) {
      var cap = p.inlineCap, made = 0;
      var after = p.inlineAfter.slice().sort(function (x, y) { return x - y; });
      for (var j = 0; j < after.length && made < cap; j++) {
        var para = an.paras[after[j] - 1];
        if (!para || !para.parentNode) break;               // a short article takes fewer ads
        var ad = take('sidebar');
        if (!ad) break;
        made++;
        para.parentNode.insertBefore(mark(spot(ad, 'sidebar', 'inline-' + made, 'ixsa-spot--inline', true)), para.nextSibling);
      }
    }

    /* list spots, every width. An ad never splits a row of a card grid: it
       goes after the last card of the row that holds the listEvery-th card. */
    if (an.list && an.list.items && an.list.items.length && c.kind !== 'article') {
      var every = p.listEvery, items = an.list.items.filter(function (n) { return n.parentNode; }), m = 0;
      var x = every;
      while (x < items.length) {
        var at = rowEnd(items, x - 1);
        if (at >= items.length - 1) break;                    // never after the last card
        var lb = take('banner'); if (!lb) break;
        m++;
        var host = items[at];
        host.parentNode.insertBefore(mark(spot(lb, 'banner', 'list-' + m, 'ixsa-spot--list', true)), host.nextSibling);
        x = at + 1 + every;
      }
    }

    if (!state.seenWritten) { writeSeen(c.title, seenNow); state.seenWritten = true; }
  }

  function start() {
    var c = state.ctx;
    if (!c || !c.title) { warn('No title on the page, so no site ads.'); draw(); return; }
    if (['article', 'archives', 'directory', 'franchise'].indexOf(c.kind) < 0) return;   // the issue page keeps ix-ba-rotate
    var watchWidth = function () { window.matchMedia('(min-width:' + WIDE + 'px)').addEventListener('change', function () { if (isWide() !== state.drawnWide) draw(); }); };
    draw();                                                    // S9c: the buyer's or sponsor's top banner needs no /site-ads
    var url = worker() + '/site-ads?title=' + encodeURIComponent(c.title);
    fetch(url, { credentials: 'omit' }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.ok) { warn('/site-ads did not answer: ' + ((d && d.error) || 'no answer')); watchWidth(); return; }
      (d.problems || []).forEach(function (pr) { warn(typeof pr === 'string' ? pr : JSON.stringify(pr)); });
      if (!d.placement) { warn('No placement settings for this title, so no site ads.'); watchWidth(); return; }
      state.data = d;
      state.order = buildOrder(d, c.title, []);
      draw();
      watchWidth();
      info('v' + VERSION + ' · ' + d.issue.code + ' · ' + state.order.length + ' ads in the set');
    }).catch(function (e) { warn('/site-ads failed: ' + (e && e.message)); watchWidth(); });
  }

  function onDrawn(detail) {
    if (state.ctx) return;
    state.ctx = { kind: detail.kind, site: detail.site, paper: detail.paper, rail: detail.rail || null,
      title: detail.title || (detail.site && detail.site.title && detail.site.title.slug) || '' };
    start();
  }

  window.IXSiteAds = {
    version: VERSION,
    anchors: function (a) { state.anchors = Object.assign({}, state.anchors || {}, a || {}); if (state.data) draw(); }
  };
  if (window.IXSiteAdsPending) { window.IXSiteAds.anchors(window.IXSiteAdsPending); window.IXSiteAdsPending = null; }   // a page script that ran first
  doc.addEventListener('ixs:drawn', function (e) { onDrawn(e.detail || {}); });
  if (window.IXShell && window.IXShell.drawn) onDrawn(window.IXShell.drawn);   // this file loaded after the page was drawn
})();
