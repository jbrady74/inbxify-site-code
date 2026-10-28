/* ix-archives-v1_1_2.js
   v1.1.2 (28 Oct 2026): a set search or filter fills its phone icon solid Accent (CSS only; the dot is retired).
   INBXIFY · Archives page on the site shell. Pairs with ix-archives-v1_1_2.css.
   Needs ix-shell-v1_0_7.js (loaded before this file) and ix-issue-data
   v1.0.100+.

   v1.1.1 (28 Oct 2026, Code-Built Site S5) Phone: a smaller footprint.
          The search box and the Section pill leave the page on phones; in
          their place one row holds the count line, Clear, and two round
          icon buttons (search, filter). Each opens the shell's sheet
          (IXShell.modal) holding the same box or pill, with a Done button.
          A set search or filter shows an Accent dot on its icon. Desktop
          unchanged.

   v1.1.0 (28 Oct 2026, Code-Built Site S5) Search and the Section filter.
          Above the switcher: a search box (words in issue headlines and
          article titles) and a Section dropdown pill (the franchise names
          found in the data), the same look and rules as the Directory's:
          the pill keeps showing the choice, a set pill gets the Accent
          border, Clear puts everything back. A count line says "n of N
          issues" or "... articles" for the tab in view. Newsletters tab: an
          issue stays when any of its headlines matches, and the card shows
          only the matching headlines. Articles tab: matching articles.
          Phone: the search box, then a "Filter by section" link that opens
          the pill. Date search is left for later.

   v1.0.4 (28 Oct 2026, Code-Built Site S2) The page is drawn on the shell.
          Nothing on the page comes from Webflow: the shell draws the nav,
          plate, footer and loader, and calls this script with the paper
          column and the /site answer. This script asks /archives for the
          title's issues and articles and draws the switcher and both panes.
          Print is left out: its covers came from a Webflow list that is no
          longer on the page (AR-4: no covers, no Print tab). The current
          issue's articles are left out by the Worker (v1.0.100).
   v1.0.3 (27 Oct 2026, Jeff) No two-hop to an article: each headline opens
          its own article; the photo, the date line and Read issue open the
          issue.
   v1.0.2  Archives + Directory review v0.2 rulings (AR-1 B to AR-5 A).
   v1.0.1  title slug from the page address.
   v1.0.0  first build.

   LINKING TO A TAB
     /archives/<title>#articles opens the Articles tab.

   HARDCODING
     HC-P-AR1-4 the words on the page (WORDS below), v1.1.0 adds the
                search and filter words.
     HC-P-AR1-5 page sizes: 10 issues and 18 articles before Show more.
     HC-P-AR1-6 three headlines under the lead on an issue card.
     (HC-P-AR1-3, the Worker address, is now the shell's: IXShell.worker,
     HC-P-CB-2.)
*/
(function () {
  'use strict';

  var WORDS = {                                                            // HC-P-AR1-4
    tabs: [['newsletters', 'Newsletters'], ['articles', 'Articles']],
    no: 'No.',
    moreInIssue: function (n) { return '+ ' + n + ' more in this issue'; },
    readIssue: 'Read issue \u2192',
    openIssue: function (line) { return 'Open issue ' + line; },
    moreIssues: 'Show more issues',
    moreArticles: 'Show more articles',
    noIssues: 'No issues are online yet.',
    noArticles: 'No articles are online yet.',
    search: 'Search the archive',
    searchLabel: 'Search issue headlines and article titles',
    clearSearch: 'Clear the search',
    section: 'Section',
    allSections: 'All sections',
    filter: 'Filter by section',
    filterOn: 'Filter by section (1)',
    clear: 'Clear',
    countIssues: function (n, t) { return n === t ? t + (t === 1 ? ' issue' : ' issues') : n + ' of ' + t + ' issues'; },
    countArticles: function (n, t) { return n === t ? t + (t === 1 ? ' article' : ' articles') : n + ' of ' + t + ' articles'; },
    noneIssues: 'No issues match. Try fewer words or clear the filter.',
    noneArticles: 'No articles match. Try fewer words or clear the filter.',
    searchTitle: 'Search',
    filterTitle: 'Filter',
    done: 'Done',
    openSearch: 'Search',
    openFilter: 'Filter by section'
  };
  var PHONE = 767;   // the same break as the page's CSS
  var ICON = {
    search: '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="m20 20-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    x: '<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
  };
  function isPhone() { return window.matchMedia('(max-width:' + PHONE + 'px)').matches; }
  /* v1.1.1 · phone sheets: an icon button that lifts `node` into the shell's sheet and puts it back on close. */
  function sheetButton(icon, label, title, node, home, onOpen) {
    var b = el('button', 'ixa-ib'); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label;
    b.appendChild(svg(icon)); b.appendChild(el('span', 'ixa-dot'));
    b.addEventListener('click', function () {
      if (!window.IXShell || !window.IXShell.modal) return;
      var m = window.IXShell.modal(title);
      m.body.classList.add('ixa-sheet');
      m.body.appendChild(node);
      var done = el('button', 'ixa-done', WORDS.done); done.type = 'button'; done.addEventListener('click', m.close);
      m.body.appendChild(done);
      m.onClose(function () { home.appendChild(node); });
      if (onOpen) onOpen();
    });
    return b;
  }
  function svg(path, cls) {
    var w = document.createElement('span');
    w.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + path + '</svg>';
    var g = w.firstChild; if (cls) g.setAttribute('class', cls);
    return g;
  }
  function fold(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  var PAGE = { issues: 10, articles: 18 };                                 // HC-P-AR1-5
  var CARD_MORE = 3;                                                       // HC-P-AR1-6

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function safeHref(u) {
    u = String(u || '').trim();
    return /^(https?:|\/)/i.test(u) ? u : '';
  }
  function img(src, alt, cls) {
    var s = safeHref(src);
    if (!s) return el('div', (cls || '') + ' ixa-noimg');
    var i = el('img', cls);
    i.src = s;
    i.alt = alt || '';
    i.loading = 'lazy';
    i.decoding = 'async';
    return i;
  }
  function issueLine(no, date) {
    return (no ? WORDS.no + ' ' + no : '') + (no && date ? ' \u2022 ' : '') + (date || '');
  }

  /* ── Newsletters: one card per issue (AR-1 B) ── */
  function ring(no) {
    var r = el('div', 'ixa-ring');
    r.setAttribute('aria-hidden', 'true');
    r.appendChild(el('b', null, WORDS.no));
    r.appendChild(el('strong', null, no));
    return r;
  }
  /* A link when there is an address, else plain text in the same box. */
  function link(cls, href, text) {
    var h = safeHref(href);
    var e = el(h ? 'a' : 'span', cls, text);
    if (h) e.href = h;
    return e;
  }
  function issueCard(it) {
    var card = el('div', 'ixa-issue');
    var issueHref = safeHref(it.url);
    var lead = it.lead, more = it.more || [];
    if (it.keep) {   // v1.1.0: a filter is on; show only the matching headlines, the first as the lead
      var kept = it.keep.slice(); lead = kept.shift() || null; more = kept;
    }

    // Photo, ring and date line: open the issue.
    var top = link('ixa-issue-top', issueHref);
    top.setAttribute('aria-label', WORDS.openIssue(issueLine(it.no, it.date)));
    var ph = el('div', 'ixa-issue-ph');
    ph.appendChild(img(it.image, '', 'ixa-issue-img'));
    if (it.no) ph.appendChild(ring(it.no));
    top.appendChild(ph);
    top.appendChild(el('div', 'ixa-issue-dt', it.date || ''));
    card.appendChild(top);

    // Headlines: each opens its own article (v1.0.3).
    var b = el('div', 'ixa-issue-bd');
    b.appendChild(el('div', 'ixa-fr', (lead && lead.franchise) || ''));
    if (lead) {
      var h3 = el('h3', 'ixa-lead');
      h3.appendChild(link('ixa-hl', lead.url, lead.name));
      b.appendChild(h3);
    }
    if (more.length) {
      var ul = el('ul', 'ixa-more');
      more.slice(0, CARD_MORE).forEach(function (m) {
        var li = el('li');
        var row = link('ixa-row', m.url);
        if (m.franchise) row.appendChild(el('span', 'ixa-fr', m.franchise));
        row.appendChild(el('span', 'ixa-mh', m.name));
        li.appendChild(row);
        ul.appendChild(li);
      });
      b.appendChild(ul);
    }
    var foot = el('div', 'ixa-issue-ft');
    foot.appendChild(link('ixa-x', more.length > CARD_MORE ? issueHref : '',
      more.length > CARD_MORE ? WORDS.moreInIssue(more.length - CARD_MORE) : ''));
    foot.appendChild(link('ixa-read', issueHref, WORDS.readIssue));
    b.appendChild(foot);
    card.appendChild(b);
    return card;
  }

  /* ── Articles ── */
  function articleCard(it) {
    var a = el('a', 'ixa-art');
    var h = safeHref(it.url);
    if (h) a.href = h;
    a.appendChild(img(it.image, '', 'ixa-art-img'));
    var b = el('div', 'ixa-art-bd');
    b.appendChild(el('div', 'ixa-fr', it.franchise || ''));
    b.appendChild(el('h3', 'ixa-art-h', it.name));
    if (it.no || it.date) {
      var m = el('div', 'ixa-art-m');
      if (it.no) m.appendChild(el('b', null, WORDS.no + ' ' + it.no));
      if (it.no && it.date) m.appendChild(document.createTextNode(' \u2022 '));
      if (it.date) m.appendChild(document.createTextNode(it.date));
      b.appendChild(m);
    }
    a.appendChild(b);
    return a;
  }

  /* A list that shows `size` items, then a Show more button. v1.1.0: host.set(items, emptyWords) redraws it. */
  function paged(host, items, size, make, moreWords, emptyWords, cls) {
    var list = el('div', cls), empty = el('p', 'ixa-empty', ''), shown = 0;
    var btn = el('button', 'ixa-moreb', moreWords);
    btn.type = 'button';
    host.appendChild(empty); host.appendChild(list); host.appendChild(btn);
    function more() {
      var next = items.slice(shown, shown + size);
      next.forEach(function (it) { list.appendChild(make(it)); });
      shown += next.length;
      btn.hidden = shown >= items.length;
    }
    btn.addEventListener('click', more);
    host.set = function (next, words) {
      items = next; shown = 0; list.textContent = '';
      empty.textContent = items.length ? '' : words; empty.hidden = !!items.length;
      more();
    };
    host.set(items, emptyWords);
  }

  /* ── Search and the Section filter (v1.1.0) ── */
  function hay(a) { return fold([a.name, a.franchise].join(' ')); }
  function prep(data) {
    var issues = (data.issues || []).map(function (it) {
      var all = (it.lead ? [it.lead] : []).concat(it.more || []);
      all.forEach(function (a) { a.hay = hay(a); });
      return Object.assign({}, it, { all: all });
    });
    var articles = (data.articles || []).map(function (a) { a.hay = hay(a); return a; });
    var secs = {};
    issues.forEach(function (it) { it.all.forEach(function (a) { if (a.franchise) secs[a.franchise] = 1; }); });
    articles.forEach(function (a) { if (a.franchise) secs[a.franchise] = 1; });
    return { issues: issues, articles: articles, sections: Object.keys(secs).sort(function (a, b) { return a.localeCompare(b); }) };
  }
  function hit(a, words, sec) {
    if (sec && a.franchise !== sec) return false;
    for (var i = 0; i < words.length; i++) if (a.hay.indexOf(words[i]) < 0) return false;
    return true;
  }
  function filterBar(root, sections, onChange) {
    var state = { q: '', sec: '' };
    var bar = el('div', 'ixa-bar');
    var sbox = el('label', 'ixa-search');
    sbox.appendChild(svg(ICON.search, 'ixa-sico'));
    var q = el('input'); q.type = 'search'; q.placeholder = WORDS.search; q.setAttribute('aria-label', WORDS.searchLabel);
    q.autocomplete = 'off'; q.spellcheck = false;
    var qx = el('button', 'ixa-qx'); qx.type = 'button'; qx.hidden = true; qx.setAttribute('aria-label', WORDS.clearSearch); qx.appendChild(svg(ICON.x));
    sbox.appendChild(q); sbox.appendChild(qx);
    var ftog = el('button', 'ixa-ftog', WORDS.filter); ftog.type = 'button'; ftog.setAttribute('aria-expanded', 'false');
    var fwrap = el('div', 'ixa-filters'); fwrap.id = 'ixa-filters'; ftog.setAttribute('aria-controls', fwrap.id);
    var pill = el('label', 'ixa-pill');
    pill.appendChild(el('span', 'ixa-pl', WORDS.section));
    var pv = el('span', 'ixa-pv', WORDS.allSections);
    var sel = el('select'); sel.setAttribute('aria-label', WORDS.section);
    var o = el('option', null, WORDS.allSections); o.value = ''; sel.appendChild(o);
    sections.forEach(function (n) { var x = el('option', null, n); x.value = n; sel.appendChild(x); });
    pill.appendChild(pv); pill.appendChild(sel);
    pill.hidden = !sections.length;
    fwrap.appendChild(pill);
    var shome = el('div', 'ixa-shome'), fhome = el('div', 'ixa-fhome');   // v1.1.1: where the box and pill live on the page
    shome.appendChild(sbox); fhome.appendChild(fwrap);
    bar.appendChild(shome); bar.appendChild(ftog); bar.appendChild(fhome);
    var line = el('div', 'ixa-line');
    var count = el('div', 'ixa-count'); count.setAttribute('aria-live', 'polite');
    var clr = el('button', 'ixa-clear', WORDS.clear); clr.type = 'button'; clr.hidden = true;
    var icons = el('div', 'ixa-icons');   // v1.1.1: phone only
    var sb = sheetButton(ICON.search, WORDS.openSearch, WORDS.searchTitle, sbox, shome, function () { q.focus(); });
    var fbn = sheetButton(ICON.filter, WORDS.openFilter, WORDS.filterTitle, fwrap, fhome);
    icons.appendChild(sb); icons.appendChild(fbn);
    line.appendChild(count); line.appendChild(clr); line.appendChild(icons);
    root.appendChild(bar); root.appendChild(line);
    function marks() {
      pv.textContent = state.sec || WORDS.allSections;        // the pill keeps showing the choice
      pill.classList.toggle('is-set', !!state.sec);           // a choice made: Accent border
      ftog.textContent = state.sec ? WORDS.filterOn : WORDS.filter;
      ftog.classList.toggle('is-set', !!state.sec);
      qx.hidden = !state.q;
      clr.hidden = !(state.q || state.sec);
      sb.classList.toggle('is-set', !!state.q);    // v1.1.1: Accent dot on the phone icons
      fbn.classList.toggle('is-set', !!state.sec);
    }
    function change() { marks(); onChange(state); }
    var t = null;
    q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { state.q = q.value; change(); }, 120); });
    qx.addEventListener('click', function () { q.value = ''; state.q = ''; change(); q.focus(); });
    sel.addEventListener('change', function () { state.sec = sel.value; change(); });
    clr.addEventListener('click', function () { q.value = ''; sel.value = ''; state.q = ''; state.sec = ''; change(); });
    ftog.addEventListener('click', function () { var on = !root.classList.contains('ixa-fopen'); root.classList.toggle('ixa-fopen', on); ftog.setAttribute('aria-expanded', on ? 'true' : 'false'); });
    marks();
    return { state: state, count: count };
  }

  /* ── Switcher ── */
  function build(root, raw) {
    var data = prep(raw);
    var tabs = WORDS.tabs;
    var fb = filterBar(root, data.sections, function () { apply(); });
    var bar = el('div', 'ixa-switch');
    bar.setAttribute('role', 'tablist');
    var panes = {}, buttons = {}, current = '';
    tabs.forEach(function (t) {
      var b = el('button', 'ixa-tab', t[1]);
      b.type = 'button';
      b.id = 'ixa-tab-' + t[0];
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', 'ixa-pane-' + t[0]);
      b.addEventListener('click', function () { show(t[0], true); });
      bar.appendChild(b);
      buttons[t[0]] = b;
      var p = el('div', 'ixa-pane');
      p.id = 'ixa-pane-' + t[0];
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', b.id);
      panes[t[0]] = p;
    });
    bar.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var keys = tabs.map(function (t) { return t[0]; });
      var i = keys.indexOf(current) + (e.key === 'ArrowRight' ? 1 : -1);
      i = (i + keys.length) % keys.length;
      show(keys[i], true);
      buttons[keys[i]].focus();
    });
    root.appendChild(bar);
    tabs.forEach(function (t) { root.appendChild(panes[t[0]]); });

    paged(panes.newsletters, data.issues, PAGE.issues, issueCard, WORDS.moreIssues, WORDS.noIssues, 'ixa-issues');
    paged(panes.articles, data.articles, PAGE.articles, articleCard, WORDS.moreArticles, WORDS.noArticles, 'ixa-arts');

    function apply() {   // v1.1.0: the filter reaches both panes; the count line names the pane in view
      var st = fb.state, words = fold(st.q).split(' ').filter(Boolean), on = !!(words.length || st.sec);
      var issues = on ? data.issues.map(function (it) {
        var keep = it.all.filter(function (a) { return hit(a, words, st.sec); });
        return keep.length ? Object.assign({}, it, { keep: keep }) : null;
      }).filter(Boolean) : data.issues;
      var arts = on ? data.articles.filter(function (a) { return hit(a, words, st.sec); }) : data.articles;
      panes.newsletters.set(issues, data.issues.length ? WORDS.noneIssues : WORDS.noIssues);
      panes.articles.set(arts, data.articles.length ? WORDS.noneArticles : WORDS.noArticles);
      fb.count.textContent = current === 'articles'
        ? WORDS.countArticles(arts.length, data.articles.length)
        : WORDS.countIssues(issues.length, data.issues.length);
    }

    function show(key, push) {
      if (!panes[key]) key = 'newsletters';
      current = key;
      Object.keys(panes).forEach(function (k) {
        var on = k === key;
        panes[k].hidden = !on;
        buttons[k].classList.toggle('is-on', on);
        buttons[k].setAttribute('aria-selected', on ? 'true' : 'false');
        buttons[k].tabIndex = on ? 0 : -1;
      });
      apply();
      if (push) {
        try { history.replaceState(null, '', location.pathname + location.search + (key === 'newsletters' ? '' : '#' + key)); } catch (e) {}
      }
    }
    show((location.hash || '').replace('#', ''), false);
    window.addEventListener('hashchange', function () { show((location.hash || '').replace('#', ''), false); });
  }

  function register() {
    window.IXShell.page('archives', function (paper, site) {
      var root = el('div', 'ixa');
      paper.appendChild(root);
      var key = (site && site.title && site.title.slug) || '';
      return fetch(window.IXShell.worker + '/archives?title=' + encodeURIComponent(key), { credentials: 'omit' })
        .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
        .then(function (res) {
          if (!res.body || !res.body.ok) throw new Error((res.body && res.body.error) || ('HTTP ' + res.status));
          build(root, res.body);
        });
    });
  }
  if (window.IXShell) register();
  else console.warn('[ix-archives] ix-shell is not on this page; load ix-shell-v1_0_0.js before this file.');
})();
