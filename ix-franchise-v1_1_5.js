/* ix-franchise-v1_1_5.js
   v1.1.5 (6 Nov 2026, SS-Fork A · Mechanics S5) THE HERO SPANS THE CARD
          (Site-Ads-Placement-Rules-v0_5, rule 5, franchise pages). "Presented
          by", the sponsor's top slot, the standfirst, the tool row and the
          newest story (the hero) now go in the shell's span slot
          (IXShell.span, ix-shell v1.0.19): the full width of the card under
          the plate, even when the rail shows, so the rail starts under the
          hero beside the one-per-line stories. The stories stay in the paper.
          Sort, year and search redraw the hero in place. The hero is still
          handed to ix-site-ads as the first list item, so on phone it counts
          as story one for the every-third-row banner. When the shell has no
          span slot (older shell) everything stays in the paper as v1.1.4.
          The Lead's banner no longer uses this page's top slot (ix-site-ads
          v1.0.6 puts it in the shell's lead slot): .ixf-topad is the
          sponsor's only. Pairs with ix-franchise-v1_1_4.css.
   v1.1.4 (4 Nov 2026, S9c) ONE STORY PER LINE (Jeff, 4 Nov): the grid is
          gone. Under the hero every story is a row of its own at every
          width: a smaller, lighter version of the hero (picture, issue
          line, headline, dek) given full room, so readers scroll. A list ad
          goes after every franchiseListEvery-th story, the hero counted
          (title placement setting, WLN: 3; ix-site-ads v1.0.3). The page no
          longer redraws when the rail comes or goes. Pairs with
          ix-franchise-v1_1_3.css.
   v1.1.3 (4 Nov 2026, S9c) the version below, renamed: v1.1.2 was committed
          with the S9b slot and never loaded by any template.
   v1.1.2 (S9b 3 Nov / S9c 4 Nov 2026, Code-Built Site · Site Ads) THE TOP
   BANNER, as on the article page (Jeff, 4 Nov):
     Presented by  when the franchise has a sponsor (site.franchise.sponsor),
            "Presented by <sponsor>" opens the page, right under the band,
            in the article page's look (11px caps, the name at 13px).
     Top    an empty slot (.ixf-topad) under it, filled by ix-site-ads: the
            sponsor's banner at every width, else the Lead's banner at
            1080px and wider, nothing on phone and tablet. The sponsor is
            left out of the rail and the list.
     Gone   the slot after the first row, its ladder (a rotating banner,
            else the house ad) and the sponsor panel in the rail.
     Cards  three across beside the rail (Jeff, 4 Nov): while ix-site-ads
            shows the rail (html.ixsa-rail-on) the grid is three across;
            four with no rail; three from 768 to 1023; one on phones. The
            page redraws when the rail comes or goes ("ixsa:rail").
     List   one approved banner after every listEvery-th card (WLN: 6).
     Without ix-site-ads on the page the sponsor's banner goes in the top
     slot plainly. Pairs with ix-franchise-v1_1_2.css.
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
     Sponsor   v1.1.2: "Presented by" and the top banner (see above).
     Empty     "No <franchise> stories yet." / "No stories match."
   Every word is in WORDS (HC-P-CB-32); every size in the CSS (HC-P-CB-10);
   TOOLS_MIN is HC-P-CB-36.
*/
(function () {
  'use strict';
  var VERSION = '1.1.5';
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

  function card(m) {                                                             // v1.1.4: a story row
    var c = link('ixf-row', m.url);
    c.appendChild(picture(m.image, '', 'ixf-row-img'));
    var t = el('div', 'ixf-row-t'); c.appendChild(t);
    var line = issueLine(m.no, m.date);
    if (line) t.appendChild(el('div', 'ixf-row-m', line));
    t.appendChild(el('h3', 'ixf-row-h', m.name));
    if (m.dek) t.appendChild(el('p', 'ixf-row-d', m.dek));
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
  function presentedLine(sp) {                                                   // v1.1.2
    var row = el('div', 'ixf-presented');
    row.appendChild(el('span', 'ixf-presented-l', WORDS.presented));
    var n = link('ixf-presented-n', sp.link, sp.name);
    if (n.tagName === 'A') { n.target = '_blank'; n.rel = 'noopener sponsored'; }
    row.appendChild(n);
    return row;
  }

  IXShell.page('franchise', function (paper, site) {
    var f = site.franchise || {};
    var items = (f.articles || []).slice();
    var total = Number(f.count) || items.length;
    var state = { newest: true, year: '', q: '' };
    var box = el('div', 'ixf');
    var span = IXShell.span || null;                                            // v1.1.5: the full-card-width slot under the plate
    var head = el('div', 'ixf ixf-head');                                       // v1.1.5: what spans the card (span slot, else the paper)
    var sp = (f.sponsor && f.sponsor.name) ? f.sponsor : null;                  // v1.1.2: the top banner, as on articles
    if (sp) head.appendChild(presentedLine(sp));
    var topad = el('div', 'ixf-topad'); topad.hidden = true; head.appendChild(topad);
    if (f.description && !doc.querySelector('#ix-root .ixs-band--mascot')) head.appendChild(el('p', 'ixf-stand', f.description));   // v1.1.1: the mascot band carries it

    /* tools */
    var years = [];
    items.forEach(function (m) { if (m.year && years.indexOf(m.year) < 0) years.push(m.year); });
    years.sort().reverse();
    var tools = null, sortBtn, chips = {}, searchIn;
    if (total > TOOLS_MIN) {
      tools = el('div', 'ixf-tools'); head.appendChild(tools);
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

    var heroHost = el('div', 'ixf-herohost'); head.appendChild(heroHost);     // v1.1.5: the hero, redrawn in place
    if (span) { span.textContent = ''; span.appendChild(head); span.hidden = false; } else box.appendChild(head);
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
      body.textContent = ''; heroHost.textContent = ''; heroHost.hidden = true;
      Object.keys(chips).forEach(function (y) { chips[y].classList.toggle('ixf-t-on', y === state.year); });
      if (!items.length) { body.appendChild(el('p', 'ixf-empty', WORDS.empty(f.name))); adAnchors([]); return; }
      var list = shown();
      if (!list.length) { body.appendChild(el('p', 'ixf-empty', WORDS.noMatch)); adAnchors([]); return; }
      var h = hero(list[0], state.newest ? WORDS.newest : WORDS.oldest);        // v1.1.5: the hero spans the card
      heroHost.appendChild(h); heroHost.hidden = false;
      var rows = el('div', 'ixf-list'); body.appendChild(rows);                  // v1.1.4: one story per line
      list.slice(1).forEach(function (m) { rows.appendChild(card(m)); });
      if (!tools) body.appendChild(el('div', 'ixf-count', WORDS.count(total)));
      adAnchors([h].concat(Array.prototype.slice.call(rows.children)));         // the hero counts as story one
    }
    function adAnchors(cards) {                                                 // v1.1.2
      if (!window.IXSiteAds) {                                                  // no ix-site-ads: the sponsor's banner, plainly
        if (sp && safeHref(sp.ad) && !topad.firstChild) {
          var wrap = safeHref(sp.link) ? link('ixf-topad-a', sp.link, null) : el('div', 'ixf-topad-a');
          if (wrap.tagName === 'A') { wrap.target = '_blank'; wrap.rel = 'noopener sponsored'; }
          var i = el('img', 'ixf-topad-img'); i.src = sp.ad; i.alt = sp.name || ''; wrap.appendChild(i);
          topad.appendChild(wrap); topad.hidden = false;
        }
        return;
      }
      window.IXSiteAds.anchors({ top: topad, sponsor: sp, list: { host: body, items: cards },
        franchise: { slug: f.slug || '', name: f.name || '', bandColor: f.bandColor || '' } });
    }
    draw();
    paper.appendChild(box);
  });
})();
