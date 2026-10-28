/* ix-franchise-v1_0_0.js
   INBXIFY · Franchise page on the site shell (one page per PRODUCT LIBRARY
   franchise, the landing for every "See more <franchise>" link).
   Pairs with ix-franchise-v1_0_0.css. Needs ix-shell-v1_0_9.js (loaded
   before this file) and ix-issue-data v1.0.112+ (/site?franchise=).
   Code-Built Site S6, 28 Oct 2026.

   THE PAGE (Page frame review, 28 Oct 2026: "plate then franchise banner,
   card grid of articles, sponsor banner ad after the first row")
     Plate     drawn by the shell: logo, then the Accent band with the
               franchise name and the title's name.
     Banner    the franchise art (SECTIONS section-art, else PRODUCT LIBRARY
               ulc-section-image-link), full width. Left out when empty.
     Cards     every published article of the franchise that ran in this
               title, newest first: picture, "No. 123 · October 1, 2026",
               the headline in the title's display face. Three across on
               desktop, one across on phones (the article page's More cards).
     Sponsor   after the first row of cards: "Presented by <name>" and the
               sponsor's banner ad, linked. Only when the Worker names one
               (the sponsor on the block that carried a franchise article in
               the newest sponsored edition). No sidebars on a sponsored
               franchise page (S7 reads site.franchise.sponsor).
     Empty     "No <franchise> stories yet."
   Every word is in WORDS (HC-P-CB-32); every size in the CSS (HC-P-CB-10).
*/
(function () {
  'use strict';
  if (!window.IXShell) { console.warn('[ix-franchise] ix-shell is not loaded.'); return; }
  var WORDS = {                                                                  // HC-P-CB-32
    no: 'No.',
    presented: 'Presented by',
    empty: function (name) { return 'No ' + (name || 'stories') + (name ? ' stories' : '') + ' yet.'; },
    count: function (n) { return n === 1 ? '1 story' : n + ' stories'; }
  };
  var PHONE = 767;                                                               // matches the CSS (HC-P-CB-26)
  var doc = document;
  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function link(cls, href, text) { var a = el('a', cls, text); a.href = href; return a; }
  function safeHref(u) { u = String(u || '').trim(); return /^(https?:|\/)/i.test(u) ? u : ''; }
  function picture(src, alt, cls) {
    var s = safeHref(src);
    if (!s) return el('div', cls + ' ixf-noimg');
    var i = el('img', cls); i.src = s; i.alt = alt || ''; i.loading = 'lazy'; i.decoding = 'async';
    return i;
  }
  function issueLine(no, date) { return (no ? WORDS.no + ' ' + no : '') + (no && date ? ' \u00b7 ' : '') + (date || ''); }

  function card(m) {
    var c = link('ixf-card', m.url);
    c.appendChild(picture(m.image, '', 'ixf-card-img'));
    var line = issueLine(m.no, m.date);
    if (line) c.appendChild(el('div', 'ixf-card-m', line));
    c.appendChild(el('h3', 'ixf-card-h', m.name));
    return c;
  }
  function sponsorBox(sp) {
    var s = el('aside', 'ixf-sponsor');
    s.setAttribute('aria-label', WORDS.presented + ' ' + (sp.name || ''));
    s.appendChild(el('div', 'ixf-sponsor-l', WORDS.presented + (sp.name ? ' ' + sp.name : '')));
    if (safeHref(sp.ad)) {
      var wrap = safeHref(sp.link) ? link('ixf-sponsor-a', sp.link, null) : el('div', 'ixf-sponsor-a');
      if (wrap.tagName === 'A') { wrap.target = '_blank'; wrap.rel = 'noopener sponsored'; }
      var i = el('img', 'ixf-sponsor-img'); i.src = sp.ad; i.alt = sp.name || ''; i.loading = 'lazy'; wrap.appendChild(i);
      s.appendChild(wrap);
    }
    return s;
  }

  IXShell.page('franchise', function (paper, site) {
    var f = site.franchise || {};
    var box = el('div', 'ixf');
    if (safeHref(f.art)) { var b = el('div', 'ixf-banner'); b.appendChild(picture(f.art, f.name || '', 'ixf-banner-img')); box.appendChild(b); }
    var items = f.articles || [];
    var body = el('div', 'ixf-body'); box.appendChild(body);
    function draw() {
      body.textContent = '';
      if (!items.length) { body.appendChild(el('p', 'ixf-empty', WORDS.empty(f.name))); return; }
      var perRow = window.innerWidth <= PHONE ? 1 : 3;
      var first = items.slice(0, perRow), rest = items.slice(perRow);
      var g1 = el('div', 'ixf-grid'); first.forEach(function (m) { g1.appendChild(card(m)); }); body.appendChild(g1);
      if (f.sponsor) body.appendChild(sponsorBox(f.sponsor));
      if (rest.length) { var g2 = el('div', 'ixf-grid'); rest.forEach(function (m) { g2.appendChild(card(m)); }); body.appendChild(g2); }
      var n = Number(f.count) || items.length;
      body.appendChild(el('div', 'ixf-count', WORDS.count(n)));
    }
    draw();
    var last = window.innerWidth <= PHONE, timer = null;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { var now = window.innerWidth <= PHONE; if (now !== last) { last = now; draw(); } }, 150);
    });
    paper.appendChild(box);
  });
})();
