/* ix-franchise-v1_1_1.js
   v1.1.1 (29 Oct 2026): treatment 3. When the shell drew the mascot band
   (.ixs-band--mascot) the standfirst is already in the band, so the page
   leaves it out. Needs ix-shell-v1_0_11.js. Otherwise as v1.1.0.
   INBXIFY · Franchise page on the site shell (one page per PRODUCT LIBRARY
   franchise, the landing for every "See more <franchise>" link).
   Pairs with ix-franchise-v1_1_0.css. Needs ix-shell-v1_0_10.js (loaded
   before this file; it draws the art band) and ix-issue-data v1.0.114+
   (description, dek, year on /site?franchise=). Older Workers still work:
   no standfirst, no deks, no year chips.
   Code-Built Site S6, 28 Oct 2026. Jeff: mockup D v0.3.

   THE PAGE (mockup D, 28 Oct 2026)
     Band      drawn by the shell: the franchise art in the Accent band's
               slot when the franchise has art, else the Accent band with
               the franchise name (ix-shell v1.0.10).
     Standfirst site.franchise.description, one paragraph in the display
               face, centred. Left out when empty.
     Tools     one quiet row, only when the franchise has more than
               TOOLS_MIN stories: the count, Newest/Oldest first, year chips
               (the years of the listed stories, then All), and a search
               box that filters the stories on the page as the reader
               types (headline and dek; nothing goes back to the Worker).
               The Worker lists FRANCHISE_MAX stories at most, so the tools
               work on what is on the page; the count says the full number.
     Hero      the first story of the current order and filter: the
               picture, "Newest" (or "Oldest" when the order is flipped),
               "No. 123 · October 1, 2026", the headline, the dek; a dark
               box in the title's Main colour.
     Cards     the rest, four across on desktop: picture, headline in the
               display face, then the issue line. One across on phones as a
               list: thumbnail left, headline, dek, issue line.
     Sponsor   after the first row of cards: "Presented by <n>" and the
               sponsor's banner ad, linked. Only when the Worker names one.
               No sidebars on a sponsored franchise page (S7 reads
               site.franchise.sponsor).
     Empty     "No <franchise> stories yet." / "No stories match."
   Every word is in WORDS (HC-P-CB-32); every size in the CSS (HC-P-CB-10);
   TOOLS_MIN is HC-P-CB-36.
*/
(function () {
  'use strict';
  if (!window.IXShell) { console.warn('[ix-franchise] ix-shell is not loaded.'); return; }
  var WORDS = {                                                                  // HC-P-CB-32
    no: 'No.',
    presented: 'Presented by',
    newest: 'Newest', oldest: 'Oldest',
    sortNew: 'Newest first', sortOld: 'Oldest first',
    all: 'All',
    search: function (name) { return 'Search ' + (name || 'stories'); },
    empty: function (name) { return 'No ' + (name || 'stories') + (name ? ' stories' : '') + ' yet.'; },
    noMatch: 'No stories match.',
    count: function (n) { return n === 1 ? '1 story' : n + ' stories'; }
  };
  var TOOLS_MIN = 9;                                                             // HC-P-CB-36: tools above this many stories
  var PHONE = 767;                                                               // matches the CSS (HC-P-CB-26)
  var PER_ROW = 4;                                                               // desktop cards per row (the sponsor follows the first row)
  var doc = document;
  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function link(cls, href, text) { var a = el(tag(href), cls, text); if (a.tagName === 'A') a.href = href; return a; }
  function tag(href) { return safeHref(href) ? 'a' : 'div'; }
  function safeHref(u) { u = String(u || '').trim(); return /^(https?:|\/)/i.test(u) ? u : ''; }
  function svg(path, vb) {
    var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', vb || '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = path; return s;
  }
  function picture(src, alt, cls) {
    var s = safeHref(src);
    if (!s) return el('div', cls + ' ixf-noimg');
    var i = el('img', cls); i.src = s; i.alt = alt || ''; i.loading = 'lazy'; i.decoding = 'async';
    return i;
  }
  function issueLine(no, date) { return (no ? WORDS.no + ' ' + no : '') + (no && date ? ' \u00b7 ' : '') + (date || ''); }
  function isPhone() { return window.innerWidth <= PHONE; }

  function card(m) {
    var c = link('ixf-card', m.url);
    c.appendChild(picture(m.image, '', 'ixf-card-img'));
    var t = el('div', 'ixf-card-t'); c.appendChild(t);
    t.appendChild(el('h3', 'ixf-card-h', m.name));
    if (m.dek) t.appendChild(el('p', 'ixf-card-d', m.dek));
    var line = issueLine(m.no, m.date);
    if (line) t.appendChild(el('div', 'ixf-card-m', line));
    return c;
  }
  function hero(m, kick) {
    var h = link('ixf-hero', m.url);
    h.appendChild(picture(m.image, '', 'ixf-hero-img'));
    var t = el('div', 'ixf-hero-t'); h.appendChild(t);
    t.appendChild(el('div', 'ixf-kick', kick));
    var line = issueLine(m.no, m.date);
    if (line) t.appendChild(el('div', 'ixf-hero-m', line));
    t.appendChild(el('h2', 'ixf-hero-h', m.name));
    if (m.dek) t.appendChild(el('p', 'ixf-hero-d', m.dek));
    return h;
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
    var items = (f.articles || []).slice();
    var total = Number(f.count) || items.length;
    var state = { newest: true, year: '', q: '' };
    var box = el('div', 'ixf');
    if (f.description && !doc.querySelector('#ix-root .ixs-band--mascot')) box.appendChild(el('p', 'ixf-stand', f.description));   // v1.1.1: the mascot band carries it

    /* tools */
    var years = [];
    items.forEach(function (m) { if (m.year && years.indexOf(m.year) < 0) years.push(m.year); });
    years.sort().reverse();
    var tools = null, sortBtn, chips = {}, searchIn;
    if (total > TOOLS_MIN) {
      tools = el('div', 'ixf-tools'); box.appendChild(tools);
      tools.appendChild(el('span', 'ixf-t-count', WORDS.count(total)));
      tools.appendChild(el('span', 'ixf-t-sep'));
      sortBtn = el('button', 'ixf-t-sort'); sortBtn.type = 'button';
      sortBtn.appendChild(el('span', null, WORDS.sortNew));
      sortBtn.appendChild(svg('<path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/>', '0 0 10 10'));
      sortBtn.addEventListener('click', function () { state.newest = !state.newest; sortBtn.firstChild.textContent = state.newest ? WORDS.sortNew : WORDS.sortOld; draw(); });
      tools.appendChild(sortBtn);
      if (years.length > 1) {
        tools.appendChild(el('span', 'ixf-t-sep'));
        var yr = el('div', 'ixf-t-years'); tools.appendChild(yr);
        years.concat(['']).forEach(function (y) {
          var b = el('button', 'ixf-t-year', y || WORDS.all); b.type = 'button';
          b.addEventListener('click', function () { state.year = y; draw(); });
          chips[y] = b; yr.appendChild(b);
        });
      }
      var lab = el('label', 'ixf-t-search');
      lab.appendChild(svg('<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2"/>'));
      searchIn = el('input'); searchIn.type = 'search'; searchIn.placeholder = WORDS.search(f.name); searchIn.setAttribute('aria-label', WORDS.search(f.name));
      searchIn.addEventListener('input', function () { state.q = searchIn.value.trim().toLowerCase(); draw(); });
      lab.appendChild(searchIn); tools.appendChild(lab);
    }

    var body = el('div', 'ixf-body'); box.appendChild(body);
    function shown() {
      var list = items.filter(function (m) {
        if (state.year && m.year !== state.year) return false;
        if (state.q && ((m.name || '') + ' ' + (m.dek || '')).toLowerCase().indexOf(state.q) < 0) return false;
        return true;
      });
      if (!state.newest) list.reverse();   // the Worker lists newest first
      return list;
    }
    function draw() {
      body.textContent = '';
      Object.keys(chips).forEach(function (y) { chips[y].classList.toggle('ixf-t-on', y === state.year); });
      if (!items.length) { body.appendChild(el('p', 'ixf-empty', WORDS.empty(f.name))); return; }
      var list = shown();
      if (!list.length) { body.appendChild(el('p', 'ixf-empty', WORDS.noMatch)); return; }
      body.appendChild(hero(list[0], state.newest ? WORDS.newest : WORDS.oldest));
      var rest = list.slice(1), perRow = isPhone() ? 1 : PER_ROW;
      var first = rest.slice(0, perRow), more = rest.slice(perRow);
      if (first.length) { var g1 = el('div', 'ixf-grid'); first.forEach(function (m) { g1.appendChild(card(m)); }); body.appendChild(g1); }
      if (f.sponsor) body.appendChild(sponsorBox(f.sponsor));
      if (more.length) { var g2 = el('div', 'ixf-grid'); more.forEach(function (m) { g2.appendChild(card(m)); }); body.appendChild(g2); }
      if (!tools) body.appendChild(el('div', 'ixf-count', WORDS.count(total)));
    }
    draw();
    var last = isPhone(), timer = null;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { var now = isPhone(); if (now !== last) { last = now; draw(); } }, 150);
    });
    paper.appendChild(box);
  });
})();
