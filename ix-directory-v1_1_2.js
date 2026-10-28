/* ix-directory-v1_1_2.js
   v1.1.2 (28 Oct 2026): a set search or filter fills its phone icon solid Accent (CSS only; the dot is retired).
   INBXIFY · Directory page on the site shell. Pairs with ix-directory-v1_1_2.css.
   Needs ix-shell-v1_0_7.js (loaded before this file) and ix-issue-data v1.0.107+
   (GET /directory). Code-Built Site S5, 28 Oct 2026.

   v1.1.1 (28 Oct 2026) Phone: a smaller footprint, the same as Archives
     v1.1.1. The search box and the two pills leave the page on phones; the
     count line carries Clear and two round icon buttons (search, filter)
     that open the shell's sheet (IXShell.modal) with the box or the pills
     and a Done button. An Accent dot on the icon shows a set search or
     filter. The "Filter by category" text button is retired. Desktop unchanged.

   WHAT IT REPLACES
     JetBoost, directory-body-v5.6.js, the Webflow card list, the Webflow
     profile modal and the hidden category lists. Every listing comes from
     the Worker's /directory answer (CUSTOMERS on this title), so the old
     100-item cap on the category list is gone (data reference 18I).

   THE PAGE (Archives + Directory review v0.2: FM-1 A, DR-1 A; Page frame
   review: phone search plus "Filter by category")
     Filters    search box; Category and Type dropdowns as pills. A dropdown
                with a choice made keeps showing it and gets a 2px Accent
                border, so a set filter shows at a glance. "Clear" (a small
                text link) appears whenever anything is set and puts the page
                back as it opened. Type lists the types inside the chosen
                category, or every type when no category is chosen.
                Phones: the search box, then a "Filter by category" text
                button that opens the two dropdowns.
     Count      "40 businesses", or "6 of 40 businesses" when filtered.
     Cards      white, one per row: logo (or initials) on the left;
                Category › Type in small capitals (each one filters the page);
                the name in the title's display face; the description (two
                lines); then a footer line under a rule: phone, place, social
                icons, Website, Directions, View. Phones: the logo band on
                top. Expert Contributors carry the label.
     Profile    View, or the name, opens the business in a window: logo,
                category, name, Visit website / Call / Directions / Email,
                About, Services, Contact (phone, email, address), Connect
                (socials). Escape, the X or a click outside closes it; focus
                goes back to the card. Each business has its own link:
                /find/<directory>#<business slug> opens it straight away.
     Ads        until the site-wide ads build (S7), the page keeps today's
                phone and tablet behaviour: when the page code names the
                Webflow ad data (data-ads on #ix-page), an ad sits after every
                5th card below 1080px, labelled "Local partner".
     More       60 cards, then "Show more businesses".

   HARDCODING (provisional)
     HC-P-CB-23 the words (WORDS), the social network names and icons
                (SOCIAL), 60 cards a page (PAGE_SIZE), an ad after every 5th
                card (AD_EVERY).
     The Webflow ad data's id is page code (data-ads), not typed here.
*/
(function () {
  'use strict';
  if (!window.IXShell) { try { console.warn('[ix-directory] ix-shell is not loaded; load it before this file.'); } catch (e) {} return; }

  var VERSION = '1.1.0';
  var PAGE_SIZE = 60;                                                            // HC-P-CB-23
  var AD_EVERY = 5;                                                              // HC-P-CB-23
  var WORDS = {                                                                  // HC-P-CB-23
    search: 'Search the directory',
    searchTitle: 'Search', filterTitle: 'Filter', done: 'Done', openSearch: 'Search', openFilter: 'Filter by category',   // v1.1.1
    searchLabel: 'Search the directory by name, service or town',
    clearSearch: 'Clear the search box',
    category: 'Category', allCategories: 'All categories',
    type: 'Type', allTypes: 'All types',
    clear: 'Clear',
    filter: 'Filter by category', filterOn: function (n) { return 'Filter by category \u00b7 ' + n; },
    count: function (shown, all) {
      var w = function (n) { return n + (n === 1 ? ' business' : ' businesses'); };
      return shown === all ? w(all) : shown + ' of ' + w(all);
    },
    none: 'No businesses match.', noneAll: 'No businesses are listed yet.', clearAll: 'Clear and show them all',
    more: 'Show more businesses',
    website: 'Website', directions: 'Directions', view: 'View',
    visit: 'Visit website', call: 'Call', email: 'Email',
    about: 'About', services: 'Services', contact: 'Contact', connect: 'Connect',
    phone: 'Phone', emailL: 'Email', address: 'Address',
    expert: 'Expert Contributor', partner: 'Local partner',
    close: 'Close', listed: function (t) { return 'Listed in the ' + (t || 'local') + ' business directory'; },
    filterBy: function (n) { return 'Show only ' + n; },
    viewOf: function (n) { return 'View ' + n; }
  };
  var SOCIAL = [                                                                 // HC-P-CB-23
    ['facebook', 'Facebook', '<path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8Z" fill="currentColor"/>'],
    ['instagram', 'Instagram', '<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/>'],
    ['x', 'X', '<path d="M4 4h4.6l4 5.6L17.4 4H20l-6.2 7.3L20.5 20h-4.6l-4.4-6-5.2 6H4l6.4-7.4Z" fill="currentColor"/>'],
    ['linkedin', 'LinkedIn', '<rect x="4" y="9" width="3.6" height="11" fill="currentColor"/><circle cx="5.8" cy="5.6" r="2.1" fill="currentColor"/><path d="M10 9h3.4v1.6c.6-1 1.9-1.9 3.8-1.9 3 0 3.8 2 3.8 4.8V20h-3.6v-5.8c0-1.4-.3-2.6-1.8-2.6s-2 1.1-2 2.6V20H10Z" fill="currentColor"/>'],
    ['youtube', 'YouTube', '<rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="currentColor"/><path d="M10 9.2v5.6l5-2.8Z" fill="#fff"/>'],
    ['pinterest', 'Pinterest', '<path d="M12 3a9 9 0 0 0-3.3 17.4c-.1-.8-.1-2 .1-2.8l1.1-4.6s-.3-.6-.3-1.4c0-1.3.8-2.3 1.7-2.3.8 0 1.2.6 1.2 1.3 0 .8-.5 2-.8 3.1-.2.9.5 1.7 1.4 1.7 1.7 0 3-1.8 3-4.4 0-2.3-1.6-3.9-4-3.9-2.7 0-4.3 2-4.3 4.2 0 .8.3 1.7.7 2.2l.1.4-.3 1c0 .2-.2.3-.4.2-1.2-.6-2-2.4-2-3.8 0-3.1 2.3-6 6.5-6 3.4 0 6.1 2.4 6.1 5.7 0 3.4-2.1 6.1-5.1 6.1-1 0-2-.5-2.3-1.1l-.6 2.4c-.2.9-.8 2-1.2 2.6A9 9 0 1 0 12 3Z" fill="currentColor"/>'],
    ['houzz', 'Houzz', '<path d="M6 3h4v5l8 2.4V21h-5v-6h-3v6H6Z" fill="currentColor"/>']
  ];
  var ICON = {
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="2"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    mail: '<rect x="2.5" y="5" width="19" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="m3 6.5 9 6.5 9-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    web: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    route: '<path d="M12 2 3.5 21 12 17l8.5 4Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    go: '<path d="M5 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    search: '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    x: '<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z" fill="currentColor"/>'
  };

  var doc = document;
  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function svg(path, cls) {
    var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    if (cls) s.setAttribute('class', cls);
    s.innerHTML = path; return s;
  }
  function safe(u) { u = String(u || '').trim(); return /^(https?:|mailto:|tel:)/i.test(u) ? u : ''; }
  function web(u) { u = String(u || '').trim(); if (!u) return ''; if (!/^https?:/i.test(u) && /^[\w-]+(\.[\w-]+)+/.test(u)) u = 'https://' + u; return safe(u); }
  function ext(a) { a.target = '_blank'; a.rel = 'noopener'; return a; }
  function link(cls, href, text) { var a = el('a', cls, text); a.href = href; return a; }
  function warn(m) { try { console.warn('[ix-directory] ' + m); } catch (e) {} }
  /* v1.1.1 · phone sheets: an icon button that lifts `node` into the shell's sheet and puts it back on close. */
  function sheetButton(icon, label, title, node, home, onOpen) {
    var b = el('button', 'ixd-ib'); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label;
    b.appendChild(svg(icon)); b.appendChild(el('span', 'ixd-dot'));
    b.addEventListener('click', function () {
      if (!window.IXShell || !window.IXShell.modal) return;
      var m = window.IXShell.modal(title);
      m.body.classList.add('ixd-sheet');
      m.body.appendChild(node);
      var done = el('button', 'ixd-done', WORDS.done); done.type = 'button'; done.addEventListener('click', m.close);
      m.body.appendChild(done);
      m.onClose(function () { home.appendChild(node); });
      if (onOpen) onOpen();
    });
    return b;
  }
  /* Category names: drop a leading marker (emoji, bullet) and stray spaces. */
  function clean(s) { return String(s || '').replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s+/g, ' ').trim(); }
  function fold(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function initialsOf(l) {
    var i = String(l.initials || '').trim();
    if (i) return i.slice(0, 3).toUpperCase();
    return String(l.name || '').split(/\s+/).filter(function (w) { return /^[A-Za-z0-9]/.test(w); })
      .slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  }
  function telOf(p) { var d = String(p || '').replace(/[^\d+]/g, ''); return d.length >= 7 ? 'tel:' + d : ''; }

  function logoBox(l, cls) {
    var box = el('div', cls);
    var initials = function () { box.textContent = ''; box.appendChild(el('span', 'ixd-ini', initialsOf(l))); box.classList.add('is-ini'); };
    var src = safe(l.logo);
    if (src) {
      var img = el('img'); img.src = src; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      img.addEventListener('error', initials);
      box.appendChild(img);
    } else initials();
    return box;
  }
  function socialRow(l, cls) {
    var row = el('span', cls), s = l.socials || {};
    SOCIAL.forEach(function (n) {
      var h = web(s[n[0]]);
      if (!h || /^https?:\/\/(www\.)?[a-z]+\.com\/?$/i.test(h)) return;   // a bare home page is not a profile
      var a = ext(link('ixd-soc', h, null)); a.setAttribute('aria-label', n[1] + ': ' + l.name);
      a.appendChild(svg(n[2])); row.appendChild(a);
    });
    return row.childNodes.length ? row : null;
  }

  IXShell.page('directory', function (paper, site) {
    var t = (site && site.title) || {};
    var key = t.slug || t.adminSlug || '';
    if (!key) return Promise.reject(new Error('The /site answer has no title slug.'));
    return fetch(IXShell.worker + '/directory?title=' + encodeURIComponent(key))
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'HTTP ' + r.status }; }); })
      .then(function (d) {
        if (!d || d.ok === false || !Array.isArray(d.listings)) throw new Error((d && d.error) || 'No listings in the answer.');
        (d.warnings || []).forEach(warn);
        build(paper, d.listings, t);
      });
  });

  function build(paper, raw, title) {
    var list = raw.map(function (l) {
      var o = Object.assign({}, l);
      o.category = clean(l.category); o.subcategory = clean(l.subcategory);
      o.services = (l.services || []).map(function (s) { return String(s || '').trim(); }).filter(Boolean);
      o.hay = fold([o.name, o.category, o.subcategory, o.tagline, o.services.join(' '), o.place, o.address].join(' '));
      return o;
    });
    // Categories and types from the listings themselves (no cap).
    var cats = {};
    list.forEach(function (l) {
      if (!l.category) return;
      var c = cats[l.category] || (cats[l.category] = { name: l.category, n: 0, subs: {} });
      c.n++;
      if (l.subcategory) c.subs[l.subcategory] = (c.subs[l.subcategory] || 0) + 1;
    });
    var catNames = Object.keys(cats).sort(function (a, b) { return a.localeCompare(b); });
    var state = { q: '', cat: '', sub: '', shown: PAGE_SIZE };
    var ads = readAds();

    var wrap = el('div', 'ixd');
    // ── filters ──
    var bar = el('div', 'ixd-bar');
    var sbox = el('label', 'ixd-search');
    sbox.appendChild(svg(ICON.search, 'ixd-sico'));
    var q = el('input'); q.type = 'search'; q.placeholder = WORDS.search; q.setAttribute('aria-label', WORDS.searchLabel);
    q.autocomplete = 'off'; q.spellcheck = false;
    var qx = el('button', 'ixd-qx'); qx.type = 'button'; qx.hidden = true; qx.setAttribute('aria-label', WORDS.clearSearch); qx.appendChild(svg(ICON.x));
    sbox.appendChild(q); sbox.appendChild(qx);
    var ftog = el('button', 'ixd-ftog', WORDS.filter); ftog.type = 'button'; ftog.setAttribute('aria-expanded', 'false');
    var fwrap = el('div', 'ixd-filters'); fwrap.id = 'ixd-filters'; ftog.setAttribute('aria-controls', fwrap.id);
    var catSel = selectPill(WORDS.category), subSel = selectPill(WORDS.type);
    fwrap.appendChild(catSel.box); fwrap.appendChild(subSel.box);
    var shome = el('div', 'ixd-shome'), fhome = el('div', 'ixd-fhome');   // v1.1.1: where the box and pills live on the page
    shome.appendChild(sbox); fhome.appendChild(fwrap);
    bar.appendChild(shome); bar.appendChild(ftog); bar.appendChild(fhome);
    var line = el('div', 'ixd-line');
    var count = el('div', 'ixd-count'); count.setAttribute('aria-live', 'polite');
    var clr = el('button', 'ixd-clear', WORDS.clear); clr.type = 'button'; clr.hidden = true;
    var icons = el('div', 'ixd-icons');   // v1.1.1: phone only
    var sbtn = sheetButton(ICON.search, WORDS.openSearch, WORDS.searchTitle, sbox, shome, function () { q.focus(); });
    var fbtn = sheetButton(ICON.filter, WORDS.openFilter, WORDS.filterTitle, fwrap, fhome);
    icons.appendChild(sbtn); icons.appendChild(fbtn);
    line.appendChild(count); line.appendChild(clr); line.appendChild(icons);
    var grid = el('div', 'ixd-list');
    var more = el('button', 'ixd-more', WORDS.more); more.type = 'button'; more.hidden = true;
    wrap.appendChild(bar); wrap.appendChild(line); wrap.appendChild(grid); wrap.appendChild(more);
    paper.appendChild(wrap);
    var modal = buildModal(title);

    function selectPill(label) {
      var box = el('label', 'ixd-pill');
      box.appendChild(el('span', 'ixd-pl', label));
      var pv = el('span', 'ixd-pv');
      var s = el('select'); s.setAttribute('aria-label', label);
      box.appendChild(pv); box.appendChild(s);
      return { box: box, sel: s, pv: pv };
    }
    function fillCats() {
      var s = catSel.sel; s.textContent = '';
      var o = el('option', null, WORDS.allCategories); o.value = ''; s.appendChild(o);
      catNames.forEach(function (n) { var x = el('option', null, n + ' (' + cats[n].n + ')'); x.value = n; s.appendChild(x); });
      s.value = state.cat;
    }
    function fillSubs() {
      var s = subSel.sel, subs = {};
      (state.cat ? [state.cat] : catNames).forEach(function (c) {
        Object.keys(cats[c].subs).forEach(function (k) { subs[k] = (subs[k] || 0) + cats[c].subs[k]; });
      });
      if (state.sub && !subs[state.sub]) state.sub = '';
      s.textContent = '';
      var o = el('option', null, WORDS.allTypes); o.value = ''; s.appendChild(o);
      Object.keys(subs).sort(function (a, b) { return a.localeCompare(b); })
        .forEach(function (n) { var x = el('option', null, n + ' (' + subs[n] + ')'); x.value = n; s.appendChild(x); });
      s.value = state.sub;
      subSel.box.hidden = Object.keys(subs).length === 0;
    }
    function marks() {
      catSel.pv.textContent = state.cat || WORDS.allCategories;   // the pill keeps showing the choice
      subSel.pv.textContent = state.sub || WORDS.allTypes;
      catSel.box.classList.toggle('is-set', !!state.cat);   // a choice made: Accent border
      subSel.box.classList.toggle('is-set', !!state.sub);
      var n = (state.cat ? 1 : 0) + (state.sub ? 1 : 0);
      ftog.textContent = n ? WORDS.filterOn(n) : WORDS.filter;
      ftog.classList.toggle('is-set', n > 0);
      qx.hidden = !state.q;
      clr.hidden = !(state.q || state.cat || state.sub);
      sbtn.classList.toggle('is-set', !!state.q);   // v1.1.1: Accent dot on the phone icons
      fbtn.classList.toggle('is-set', n > 0);
    }
    function matches() {
      var words = fold(state.q).split(' ').filter(Boolean);
      return list.filter(function (l) {
        if (state.cat && l.category !== state.cat) return false;
        if (state.sub && l.subcategory !== state.sub) return false;
        for (var i = 0; i < words.length; i++) if (l.hay.indexOf(words[i]) < 0) return false;
        return true;
      });
    }
    function draw() {
      marks();
      var hits = matches();
      count.textContent = WORDS.count(hits.length, list.length);
      grid.textContent = '';
      if (!hits.length) {
        var e = el('div', 'ixd-empty');
        e.appendChild(el('p', null, list.length ? WORDS.none : WORDS.noneAll));
        if (list.length) { var b = el('button', 'ixd-clear', WORDS.clearAll); b.type = 'button'; b.addEventListener('click', reset); e.appendChild(b); }
        grid.appendChild(e); more.hidden = true; return;
      }
      hits.slice(0, state.shown).forEach(function (l, i) {
        grid.appendChild(card(l));
        if (ads.length && (i + 1) % AD_EVERY === 0 && i + 1 < Math.min(hits.length, state.shown)) grid.appendChild(adTile(ads[((i + 1) / AD_EVERY - 1) % ads.length]));
      });
      more.hidden = hits.length <= state.shown;
    }
    function reset() { state.q = ''; state.cat = ''; state.sub = ''; state.shown = PAGE_SIZE; q.value = ''; fillCats(); fillSubs(); draw(); }
    function setCat(c, s) {
      state.cat = c || ''; state.sub = s || ''; state.shown = PAGE_SIZE;
      catSel.sel.value = state.cat; fillSubs(); draw();
      wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function card(l) {
      var c = el('article', 'ixd-card');
      c.appendChild(logoBox(l, 'ixd-logo'));
      var b = el('div', 'ixd-cb');
      if (l.category || l.subcategory) {
        var cl = el('div', 'ixd-cat');
        if (l.category) { var cb = el('button', 'ixd-catb', l.category); cb.type = 'button'; cb.setAttribute('aria-label', WORDS.filterBy(l.category)); cb.addEventListener('click', function () { setCat(l.category); }); cl.appendChild(cb); }
        if (l.category && l.subcategory) { var ch = el('span', 'ixd-chev', '\u203a'); ch.setAttribute('aria-hidden', 'true'); cl.appendChild(ch); }
        if (l.subcategory) { var sb = el('button', 'ixd-catb', l.subcategory); sb.type = 'button'; sb.setAttribute('aria-label', WORDS.filterBy(l.subcategory)); sb.addEventListener('click', function () { setCat(l.category, l.subcategory); }); cl.appendChild(sb); }
        b.appendChild(cl);
      }
      var h = el('h3', 'ixd-name');
      var nb = el('button', 'ixd-nameb', l.name); nb.type = 'button';
      nb.addEventListener('click', function () { modal.open(l, nb); });
      h.appendChild(nb); b.appendChild(h);
      if (l.expert) { var x = el('span', 'ixd-expert'); x.appendChild(svg(ICON.star)); x.appendChild(doc.createTextNode(WORDS.expert)); b.appendChild(x); }
      if (l.tagline) b.appendChild(el('p', 'ixd-desc', l.tagline));
      var f = el('div', 'ixd-foot');
      var tel = telOf(l.phone);
      if (l.phone) { var p = tel ? link('ixd-phone', tel, String(l.phone).trim()) : el('span', 'ixd-phone', String(l.phone).trim()); f.appendChild(p); }
      var where = l.place || l.address;   // the town; the street address when no town field is filled
      if (where) { var pl = el('span', 'ixd-place'); pl.appendChild(svg(ICON.pin)); pl.appendChild(doc.createTextNode(where)); f.appendChild(pl); }
      var acts = el('div', 'ixd-acts');
      var soc = socialRow(l, 'ixd-socs'); if (soc) acts.appendChild(soc);
      var w = web(l.website);
      if (w) { var wa = ext(link('ixd-act', w, WORDS.website)); wa.setAttribute('aria-label', WORDS.website + ': ' + l.name); acts.appendChild(wa); }
      if (safe(l.directions)) { var da = ext(link('ixd-act', l.directions, WORDS.directions)); da.setAttribute('aria-label', WORDS.directions + ': ' + l.name); acts.appendChild(da); }
      var v = el('button', 'ixd-view'); v.type = 'button'; v.setAttribute('aria-label', WORDS.viewOf(l.name));
      v.appendChild(el('span', null, WORDS.view)); v.appendChild(svg(ICON.go));
      v.addEventListener('click', function () { modal.open(l, v); });
      acts.appendChild(v);
      f.appendChild(acts);
      b.appendChild(f);
      c.appendChild(b);
      return c;
    }

    // ── events ──
    var tm;
    q.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { state.q = q.value.trim(); state.shown = PAGE_SIZE; draw(); }, 120); });
    q.addEventListener('keydown', function (e) { if (e.key === 'Escape' && q.value) { e.preventDefault(); q.value = ''; state.q = ''; draw(); } });
    qx.addEventListener('click', function () { q.value = ''; state.q = ''; draw(); q.focus(); });
    catSel.sel.addEventListener('change', function () { state.cat = catSel.sel.value; state.shown = PAGE_SIZE; fillSubs(); draw(); });
    subSel.sel.addEventListener('change', function () { state.sub = subSel.sel.value; state.shown = PAGE_SIZE; draw(); });
    clr.addEventListener('click', function () { reset(); q.focus(); });
    more.addEventListener('click', function () { state.shown += PAGE_SIZE; draw(); });
    ftog.addEventListener('click', function () {
      var on = !wrap.classList.contains('ixd-fopen');
      wrap.classList.toggle('ixd-fopen', on); ftog.setAttribute('aria-expanded', on ? 'true' : 'false');
    });

    fillCats(); fillSubs(); draw();

    // A business's own link: #<slug> opens it.
    function fromHash() {
      var h = decodeURIComponent(location.hash.replace(/^#/, '')).toLowerCase();
      if (!h) return;
      var l = list.filter(function (x) { return String(x.slug || '').toLowerCase() === h; })[0];
      if (l) modal.open(l, null);
    }
    fromHash();
    window.addEventListener('hashchange', function () { if (!location.hash) modal.close(true); else fromHash(); });
  }

  function readAds() {
    var page = doc.getElementById('ix-page');
    var sel = page && page.getAttribute('data-ads');
    if (!sel) return [];
    var node; try { node = doc.querySelector(sel); } catch (e) { warn('data-ads is not a valid selector.'); return []; }
    if (!node) { warn('data-ads names "' + sel + '" but nothing on the page has it.'); return []; }
    try {
      var d = JSON.parse(node.textContent);
      return ((d && d.ads) || []).filter(function (a) { return a && safe(a.img); });
    } catch (e) { warn('The ad data is not valid JSON.'); return []; }
  }
  function adTile(a) {
    var t = el('aside', 'ixd-ad');
    t.appendChild(el('div', 'ixd-adl', WORDS.partner));
    var img = el('img'); img.src = a.img; img.alt = a.alt || ''; img.loading = 'lazy';
    var h = web(a.url);
    if (h) { var l = link('ixd-adk', h, null); l.target = '_blank'; l.rel = 'sponsored noopener'; l.appendChild(img); t.appendChild(l); }
    else t.appendChild(img);
    return t;
  }

  // ── the profile window ──
  function buildModal(title) {
    var scrim = el('div', 'ixd-scrim'); scrim.hidden = true;
    var box = el('div', 'ixd-modal'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'ixd-m-name');
    scrim.appendChild(box);
    (doc.getElementById('ix-root') || doc.body).appendChild(scrim);
    var back = null, openSlug = '';
    function close(fromHash) {
      if (scrim.hidden) return;
      scrim.hidden = true; doc.documentElement.classList.remove('ixs-lock');
      if (!fromHash && openSlug && location.hash) history.replaceState(null, '', location.pathname + location.search);
      openSlug = '';
      if (back && back.focus) back.focus();
    }
    scrim.addEventListener('click', function (e) { if (e.target === scrim) close(); });
    doc.addEventListener('keydown', function (e) {
      if (scrim.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') {   // keep focus inside the window
        var f = box.querySelectorAll('a[href], button:not([disabled])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    function section(head) { var s = el('section', 'ixd-ms'); s.appendChild(el('h3', 'ixd-mh', head)); return s; }
    function open(l, from) {
      back = from; box.textContent = '';
      var x = el('button', 'ixd-mx'); x.type = 'button'; x.setAttribute('aria-label', WORDS.close); x.appendChild(svg(ICON.x));
      x.addEventListener('click', function () { close(); });
      var top = el('div', 'ixd-mtop');
      top.appendChild(logoBox(l, 'ixd-mlogo'));
      var tw = el('div', 'ixd-mtw');
      if (l.category || l.subcategory) tw.appendChild(el('div', 'ixd-mcat', [l.category, l.subcategory].filter(Boolean).join(' \u203a ')));
      var nm = el('h2', 'ixd-mname', l.name); nm.id = 'ixd-m-name'; tw.appendChild(nm);
      if (l.expert) { var xp = el('span', 'ixd-expert'); xp.appendChild(svg(ICON.star)); xp.appendChild(doc.createTextNode(WORDS.expert)); tw.appendChild(xp); }
      top.appendChild(tw);
      box.appendChild(x); box.appendChild(top);
      var body = el('div', 'ixd-mb');
      var acts = el('div', 'ixd-macts');
      var w = web(l.website), tel = telOf(l.phone), mail = /@/.test(l.email || '') ? 'mailto:' + String(l.email).trim() : '';
      function act(href, text, icon, primary, outside) {
        var a = link('ixd-mact' + (primary ? ' is-primary' : ''), href, null);
        if (outside) ext(a);
        a.appendChild(svg(icon)); a.appendChild(el('span', null, text)); acts.appendChild(a);
      }
      if (w) act(w, WORDS.visit, ICON.web, true, true);
      if (tel) act(tel, WORDS.call, ICON.phone, !w, false);
      if (safe(l.directions)) act(l.directions, WORDS.directions, ICON.route, false, true);
      if (mail) act(mail, WORDS.email, ICON.mail, false, false);
      if (acts.childNodes.length) body.appendChild(acts);
      if (l.tagline) { var ab = section(WORDS.about); ab.appendChild(el('p', 'ixd-mp', l.tagline)); body.appendChild(ab); }
      if (l.services && l.services.length) {
        var sv = section(WORDS.services), ul = el('ul', 'ixd-svcs');
        l.services.forEach(function (s) { ul.appendChild(el('li', null, s)); });
        sv.appendChild(ul); body.appendChild(sv);
      }
      var rows = [];
      if (l.phone) rows.push([ICON.phone, WORDS.phone, String(l.phone).trim(), tel]);
      if (mail) rows.push([ICON.mail, WORDS.emailL, String(l.email).trim(), mail]);
      if (l.address || l.place) rows.push([ICON.pin, WORDS.address, l.address || l.place, safe(l.directions)]);
      if (rows.length) {
        var ct = section(WORDS.contact), g = el('div', 'ixd-cgrid');
        rows.forEach(function (r) {
          var it = el('div', 'ixd-ci');
          var ic = el('span', 'ixd-cic'); ic.appendChild(svg(r[0])); it.appendChild(ic);
          var tx = el('div'); tx.appendChild(el('div', 'ixd-cl', r[1]));
          var v = r[3] ? link('ixd-cv', r[3], r[2]) : el('div', 'ixd-cv', r[2]);
          if (r[3] && /^https?:/.test(r[3])) ext(v);
          tx.appendChild(v); it.appendChild(tx); g.appendChild(it);
        });
        ct.appendChild(g); body.appendChild(ct);
      }
      var soc = socialRow(l, 'ixd-msocs');
      if (soc) { var cn = section(WORDS.connect); cn.appendChild(soc); body.appendChild(cn); }
      box.appendChild(body);
      box.appendChild(el('div', 'ixd-mfoot', WORDS.listed(title && title.name)));
      scrim.hidden = false; doc.documentElement.classList.add('ixs-lock');
      box.scrollTop = 0;
      openSlug = l.slug || '';
      if (openSlug && decodeURIComponent(location.hash.replace(/^#/, '')).toLowerCase() !== openSlug.toLowerCase()) {
        history.replaceState(null, '', location.pathname + location.search + '#' + encodeURIComponent(openSlug));
      }
      x.focus();
    }
    return { open: open, close: close };
  }

  try { console.info('[ix-directory] v' + VERSION); } catch (e) {}
})();
