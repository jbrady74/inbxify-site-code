/* ix-archives-v1_2_1.js
   v1.2.1 (4 Nov 2026, Jeff) THE PHOTO OPENS THE ISSUE. On a Past Issues row
          the lead photo now opens the newsletter, the same as the No. panel,
          the date and Read issue. Only the headlines open articles.
          CSS unchanged: pairs with the same ix-archives CSS as v1.2.0.
   v1.2.0 (4 Nov 2026, Code-Built Site S9d) ONE PER LINE (Jeff, 4 Nov,
          canvas "Past Issues and Articles · one per line", accepted).
          Pairs with ix-archives-v1_2_0.css.
     Past Issues  each issue is one row: a panel in the title's Main colour
                  holding the No. ring and the date (opens the issue); the
                  lead photo (opens the issue, v1.2.1); then the lead headline
                  and the issue's other stories as text only, each with its
                  section label when it has a franchise page (the label line
                  is kept, empty, when there is none, so every headline
                  starts at the same height). When the issue
                  has more than CARD_MORE other stories the foot says "and
                  more" (opens the issue), beside Read issue.
     Articles     one row each: photo left, then section label, headline,
                  No. and date.
     Ads          a list ad after every archivesListEvery rows (title
                  placement setting; WLN: 3), else listEvery. Unchanged code:
                  ix-site-ads v1.0.4 reads the setting.
     Print        the cover styles move from this file into the CSS.
   v1.1.9 (4 Nov 2026, Code-Built Site S9d) PRINT ISSUES, READY AND WAITING
          (Jeff, 4 Nov). Past issues holds two tabs, Newsletters (opens
          first) and Print issues, but only when the title has print issues
          to show; with none (WLN today) Past issues is the newsletter list
          with no tab bar. Print issues lists each magazine's cover, 4
          across (2 on phones), and a cover opens that issue's flipbook in
          a new tab. #print opens the tab directly.
     Data     /archives print[] = [{ name, date, cover, url }], newest first.
              No Worker sends it yet: it comes when the PRINT ISSUES
              collection is built (to-do, S9d closure). Missing or empty =
              no tab. An entry without a cover or a link is left out.
     Filters  the search box and Section pill do not apply to print covers,
              so they step aside on that tab; the count line stays.
     Fix      v1.1.8 hid the tab bar with the hidden attribute, which the
              CSS (.ixa-switch display:flex) overrides, so the bar never
              hid. Hiding is now done with style.display.
     The cover styles ride inline in this file (.ixa-print rules) until the
     one-story-per-line CSS ships, so no head box changes.
   v1.1.8 (4 Nov 2026, Code-Built Site S9d, Jeff: the nav reads "Current
          issue, Past issues, Articles"). The two tabs become two nav items
          on the same page (needs ix-shell v1.0.17).
     Tab bar  hidden when the title's nav already links this page's
              #articles view (IXShell.navItem), so the choice is made in one
              place. A title whose nav has no such link keeps the tab bar.
     Band     names the view in place of "Archives": the nav item's own
              label (no word typed here) and WORDS.sub for the line under it.
     Signal   every tab change, including the Other stories pill, fires
              "ixs:view" so the shell re-lights the nav item.
   v1.1.7 (4 Nov 2026, Code-Built Site S9c, Jeff by voice):
     Unlabeled  a section with no franchise page (today: General) is shown
                with no label on any card. Which sections have a page comes
                from /archives sections[] (Worker v1.0.146); nothing is typed.
     Pill       those sections are one choice, "Other stories" (WORDS.other).
                Choosing any section shows stories, not newsletters: a section
                with a page opens it; Other stories switches to the Articles
                tab and lists only stories with no franchise page.
     With an older Worker (no sections[]) the page behaves as v1.1.5.
   v1.1.6 (4 Nov 2026, Code-Built Site S9c, Jeff after the live test):
     Top      an empty slot (.ixsa-topslot) opens the page, above the search;
              ix-site-ads v1.0.2 fills it with the Lead's banner at 1080px
              and wider (nothing on phone) and keeps the Lead out of the list.
     Section  choosing a section that has its own franchise page opens that
              page instead of filtering. The pages come from the /archives
              answer's sections[] ({ name, url }, ix-issue-data v1.0.146+);
              a section without a page, or an older Worker, filters as before.
     Pairs with ix-archives-v1_1_4.css (unchanged) and ix-site-ads-v1_0_2.css
     (the slot's spacing).
   v1.1.5 (3 Nov 2026, Code-Built Site S9b · Site Ads): the site-wide ads.
     Ads come from ix-site-ads v1.0.0 (the title's current ad set from the
     Worker's /site-ads). Each time the list in view is drawn (tab switch,
     search, Section filter, Show more), this file hands ix-site-ads that
     list and its cards; it puts one approved banner after every
     listEvery-th card (WLN: 6), across the full row of the grid, at every
     width, plus the rail beside the paper at 1080px and wider. The
     Webflow block ibx-sidebar-ads-data on the ARCHIVES template is no
     longer read by anything (to delete). Without ix-site-ads on the page the
     lists draw with no ads. Pairs with ix-archives-v1_1_4.css (unchanged).
   v1.1.4 (29 Oct 2026, Code-Built Site S7): phone search and filter open in
     place. No sheet any more (it opened mid-screen with the page showing
     through, the keyboard pushed it, the Memberstack badge sat over it).
     Tapping the search icon opens the search box in a row right under the
     count line; the list filters as you type. Tapping the filter icon opens
     the Section pill in the same row. Tapping the same icon
     again closes the row; tapping the other icon swaps it. The open icon
     carries an Accent ring; a set search or filter still fills it solid.
     Desktop unchanged. Pairs with ix-archives-v1_1_4.css.
   v1.1.3 (28 Oct 2026): a copy of the /archives answer is kept in the
     reader's browser (localStorage, per title). A return visit draws from
     it at once and the Worker's answer replaces it only when it differs.
     Pairs with Worker v1.0.110, which never makes a reader wait for a
     rebuild. Images on cards were already lazy.
   v1.1.2 (28 Oct 2026): a set search or filter fills its phone icon solid Accent (CSS only; the dot is retired).
   INBXIFY · Archives page on the site shell. Pairs with ix-archives-v1_1_3.css.
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
  var VERSION = '1.2.1';
  var SITE = null;                                                             // v1.1.8: /site, for the band

  var WORDS = {                                                            // HC-P-AR1-4
    tabs: [['newsletters', 'Newsletters'], ['print', 'Print issues'], ['articles', 'Articles']],   // v1.1.9: print
    no: 'No.',
    andMore: 'and more',                                                 // v1.2.0 (Jeff: just "and more")
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
    other: 'Other stories',                                              // v1.1.7
    sub: { newsletters: 'Every issue of {name}', print: 'Every print issue of {name}', articles: 'Every story from {name}' },
    morePrint: 'Show more print issues',                                 // v1.1.9
    noPrint: 'No print issues are online yet.',
    countPrint: function (t) { return t + (t === 1 ? ' print issue' : ' print issues'); },
    openFlip: function (n) { return 'Open the ' + n + ' flipbook (new tab)'; },   // v1.1.8, HC-P-AR1-4
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
  function sheetButton(icon, label, title, node, home, onOpen) {   // v1.1.4: opens `node` in place, under the count line
    var b = el('button', 'ixa-ib'); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label;
    b.setAttribute('aria-expanded', 'false');
    b.appendChild(svg(icon)); b.appendChild(el('span', 'ixa-dot'));
    b.addEventListener('click', function () {
      var line = b.closest('.ixa-line'); if (!line) return;
      var row = line._xrow;
      if (!row) {
        row = el('div', 'ixa-xrow'); line.parentNode.insertBefore(row, line.nextSibling); line._xrow = row;
        var mq = window.matchMedia('(max-width: 767px)');
        var off = function () { if (!mq.matches) closeRow(row); };
        if (mq.addEventListener) mq.addEventListener('change', off); else if (mq.addListener) mq.addListener(off);
      }
      var same = row._node === node;
      closeRow(row);
      if (same) return;
      row.appendChild(node); row._node = node; row._home = home; row._btn = b;
      row.classList.add('is-open'); b.classList.add('is-open'); b.setAttribute('aria-expanded', 'true');
      if (onOpen) onOpen();
    });
    return b;
  }
  function closeRow(row) {                                                   // v1.1.4: put the open box or pills back where they live
    if (!row || !row._node) return;
    row._home.appendChild(row._node);
    row._btn.classList.remove('is-open'); row._btn.setAttribute('aria-expanded', 'false');
    row._node = null; row.classList.remove('is-open');
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
  var PAGE = { issues: 10, articles: 18, print: 12 };   // v1.1.9: print                                 // HC-P-AR1-5
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
  function issueCard(it) {                                                 // v1.2.0: one row per issue
    var card = el('div', 'ixa-issue');
    var issueHref = safeHref(it.url);
    var lead = it.lead, more = it.more || [];
    if (it.keep) {   // v1.1.0: a filter is on; show only the matching headlines, the first as the lead
      var kept = it.keep.slice(); lead = kept.shift() || null; more = kept;
    }

    // The panel: No. ring and the date, opening the issue.
    var id = link('ixa-issue-id', issueHref);
    id.setAttribute('aria-label', WORDS.openIssue(issueLine(it.no, it.date)));
    if (it.no) id.appendChild(ring(it.no));
    if (it.date) id.appendChild(el('div', 'ixa-issue-dt', it.date));
    card.appendChild(id);

    // The lead photo, opening the issue (v1.2.1; was the lead story).
    var ph = link('ixa-issue-ph', issueHref);
    ph.setAttribute('aria-hidden', 'true'); ph.tabIndex = -1;               // the headline is the same link
    ph.appendChild(img(it.image, '', 'ixa-issue-img'));
    card.appendChild(ph);

    // The lead headline and the other stories, text only.
    var b = el('div', 'ixa-issue-bd');
    b.appendChild(el('div', 'ixa-fr', shownLabel(lead && lead.franchise)));   // always there, so lead headlines start level row to row
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
        if (shownLabel(m.franchise)) row.appendChild(el('span', 'ixa-fr', shownLabel(m.franchise)));
        row.appendChild(el('span', 'ixa-mh', m.name));
        li.appendChild(row);
        ul.appendChild(li);
      });
      b.appendChild(ul);
    }
    var foot = el('div', 'ixa-issue-ft');
    foot.appendChild(link('ixa-x', more.length > CARD_MORE ? issueHref : '', more.length > CARD_MORE ? WORDS.andMore : ''));
    foot.appendChild(link('ixa-read', issueHref, WORDS.readIssue));
    b.appendChild(foot);
    card.appendChild(b);
    return card;
  }

  /* ── Print issues (v1.1.9): a cover per magazine, opening its flipbook ── */
  function printList(raw) {
    return (raw.print || []).filter(function (p) { return p && p.name && safeHref(p.cover) && safeHref(p.url); });
  }
  function printCard(it) {
    var a = el('a', 'ixa-pr');
    a.href = safeHref(it.url); a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('aria-label', WORDS.openFlip(it.name));
    a.appendChild(img(it.cover, it.name, 'ixa-pr-img'));
    a.appendChild(el('div', 'ixa-pr-n', it.name));
    if (it.date) a.appendChild(el('div', 'ixa-pr-d', it.date));
    return a;
  }
  /* ── Articles ── */
  function articleCard(it) {
    var a = el('a', 'ixa-art');
    var h = safeHref(it.url);
    if (h) a.href = h;
    a.appendChild(img(it.image, '', 'ixa-art-img'));
    var b = el('div', 'ixa-art-bd');
    b.appendChild(el('div', 'ixa-fr', shownLabel(it.franchise)));   // v1.1.7; v1.2.0 always there, so headlines start level
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
      if (!host.hidden && cls !== 'ixa-print') adAnchors(list);              // v1.1.5; v1.1.9 none among covers
    }
    btn.addEventListener('click', more);
    host.set = function (next, words) {
      items = next; shown = 0; list.textContent = '';
      empty.textContent = items.length ? '' : words; empty.hidden = !!items.length;
      more();
    };
    host.set(items, emptyWords);
  }

  /* v1.1.5 · hand the list in view to ix-site-ads */
  function adAnchors(list) {
    var items = Array.prototype.filter.call(list.children, function (n) { return !n.hasAttribute('data-ixsa'); });
    var an = { list: { host: list, items: items } };
    giveAds(an);
  }
  /* v1.1.6 · hand anchors to ix-site-ads, or keep them (merged) until it loads */
  function giveAds(an) {
    if (window.IXSiteAds && typeof window.IXSiteAds.anchors === 'function') window.IXSiteAds.anchors(an);
    else window.IXSiteAdsPending = Object.assign({}, window.IXSiteAdsPending || {}, an);
  }
  /* v1.1.6 · section name -> its franchise page, from /archives sections[] */
  var PAGES = null;                                                        // v1.1.7: label -> page, null with an older Worker
  var OTHER = '\u0000other';                                               // v1.1.7: the pill value for Other stories
  function shownLabel(fr) { return (PAGES && fr && !PAGES[fr]) ? '' : (fr || ''); }   // no page: unlabeled
  function pagesOf(raw) {
    var m = {};
    (raw.sections || []).forEach(function (s) {
      var u = s && safeHref(s.url);
      if (s && s.name && u) m[String(s.name).trim()] = u;
    });
    return m;
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
    if (sec === OTHER) { if (a.franchise && PAGES && PAGES[a.franchise]) return false; }
    else if (sec && a.franchise !== sec) return false;
    for (var i = 0; i < words.length; i++) if (a.hay.indexOf(words[i]) < 0) return false;
    return true;
  }
  function filterBar(root, sections, onChange, pages, onSection) {
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
    var hasOther = false;
    sections.forEach(function (n) {
      if (pages && !pages[n]) { hasOther = true; return; }                  // v1.1.7: no page -> Other stories
      var x = el('option', null, n); x.value = n; sel.appendChild(x); });
    if (pages && hasOther) { var ox = el('option', null, WORDS.other); ox.value = OTHER; sel.appendChild(ox); }
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
      pv.textContent = state.sec === OTHER ? WORDS.other : (state.sec || WORDS.allSections);        // the pill keeps showing the choice
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
    sel.addEventListener('change', function () {
      var u = pages && pages[sel.value];
      if (u) { sel.value = state.sec; location.href = u; return; }   // v1.1.6: a section with its own page opens it
      state.sec = sel.value;
      if (state.sec && onSection) onSection();                            // v1.1.7: a section shows stories
      change();
    });
    clr.addEventListener('click', function () { q.value = ''; sel.value = ''; state.q = ''; state.sec = ''; change(); });
    ftog.addEventListener('click', function () { var on = !root.classList.contains('ixa-fopen'); root.classList.toggle('ixa-fopen', on); ftog.setAttribute('aria-expanded', on ? 'true' : 'false'); });
    marks();
    return { state: state, count: count, bar: bar, clr: clr, icons: icons };   // v1.1.9: parts, to step aside on Print
  }

  /* ── Switcher ── */
  function build(root, raw) {
    var data = prep(raw);
    var S = window.IXShell || {};                                              // v1.1.8
    var prints = printList(raw);                                               // v1.1.9
    var navArts = !!(S.navItem && S.navItem('articles'));                      // v1.1.8: the nav carries Articles
    var tabs = WORDS.tabs.filter(function (t) {                                // v1.1.9: only the tabs this title has
      return t[0] === 'print' ? prints.length > 0 : true;
    });
    var topslot = el('div', 'ixsa-topslot'); topslot.hidden = true;   // v1.1.6
    root.appendChild(topslot);
    giveAds({ top: topslot });
    PAGES = (raw.sections && raw.sections.length) ? pagesOf(raw) : null;   // v1.1.7
    var fb = filterBar(root, data.sections, function () { apply(); }, PAGES, function () { if (current !== 'articles') show('articles', true); });
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
      var keys = tabs.map(function (t) { return t[0]; }).filter(function (k) { return !(navArts && k === 'articles'); });   // v1.1.9
      var i = keys.indexOf(current) + (e.key === 'ArrowRight' ? 1 : -1);
      i = (i + keys.length) % keys.length;
      show(keys[i], true);
      buttons[keys[i]].focus();
    });
    root.appendChild(bar);
    if (navArts) buttons.articles.style.display = 'none';                      // v1.1.9: Articles is in the nav
    function barShown(key) {                                                   // v1.1.9: two or more choices in view
      if (navArts && key === 'articles') return false;
      var n = tabs.filter(function (t) { return !(navArts && t[0] === 'articles'); }).length;
      return n > 1;
    }
    tabs.forEach(function (t) { root.appendChild(panes[t[0]]); });

    paged(panes.newsletters, data.issues, PAGE.issues, issueCard, WORDS.moreIssues, WORDS.noIssues, 'ixa-issues');
    paged(panes.articles, data.articles, PAGE.articles, articleCard, WORDS.moreArticles, WORDS.noArticles, 'ixa-arts');
    if (panes.print) paged(panes.print, prints, PAGE.print, printCard, WORDS.morePrint, WORDS.noPrint, 'ixa-print');   // v1.1.9

    function apply() {   // v1.1.0: the filter reaches both panes; the count line names the pane in view
      var st = fb.state, words = fold(st.q).split(' ').filter(Boolean), on = !!(words.length || st.sec);
      var issues = on ? data.issues.map(function (it) {
        var keep = it.all.filter(function (a) { return hit(a, words, st.sec); });
        return keep.length ? Object.assign({}, it, { keep: keep }) : null;
      }).filter(Boolean) : data.issues;
      var arts = on ? data.articles.filter(function (a) { return hit(a, words, st.sec); }) : data.articles;
      panes.newsletters.set(issues, data.issues.length ? WORDS.noneIssues : WORDS.noIssues);
      panes.articles.set(arts, data.articles.length ? WORDS.noneArticles : WORDS.noArticles);
      fb.count.textContent = current === 'print' ? WORDS.countPrint(prints.length)   // v1.1.9
        : current === 'articles'
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
      bar.style.display = barShown(key) ? '' : 'none';                         // v1.1.9
      var pr = key === 'print';                                                // v1.1.9: filters step aside on Print
      fb.bar.style.display = pr ? 'none' : '';
      fb.icons.style.display = pr ? 'none' : '';
      fb.clr.hidden = pr || !(fb.state.q || fb.state.sec);
      apply();
      if (push) {
        try { history.replaceState(null, '', location.pathname + location.search + (key === 'newsletters' ? '' : '#' + key)); } catch (e) {}
        try { document.dispatchEvent(new CustomEvent('ixs:view', { detail: { view: key } })); } catch (e) {}   // v1.1.8
      }
      band(key);                                                               // v1.1.8
    }
    function band(key) {                                                       // v1.1.8: the band names the view
      if (!S.plate || !S.navItem) return;
      var it = S.navItem(key === 'articles' ? 'articles' : '');                // v1.1.9: print sits under Past issues
      if (!it) return;
      var name = (SITE && SITE.title && SITE.title.name) || '';
      S.plate(it.label, String(WORDS.sub[key] || '').replace('{name}', name));
    }
    show((location.hash || '').replace('#', ''), false);
    window.addEventListener('hashchange', function () { show((location.hash || '').replace('#', ''), false); });
  }

  function register() {
    window.IXShell.page('archives', function (paper, site) {
      SITE = site;                                                             // v1.1.8
      var root = el('div', 'ixa');
      paper.appendChild(root);
      var key = (site && site.title && site.title.slug) || '';
      var store = 'ixa:' + key, cachedText = '';   // v1.1.3
      try { cachedText = localStorage.getItem(store) || ''; } catch (e) {}
      var drawn = false;
      if (cachedText) { try { build(root, JSON.parse(cachedText)); drawn = true; } catch (e) { root.textContent = ''; } }
      var p = fetch(window.IXShell.worker + '/archives?title=' + encodeURIComponent(key), { credentials: 'omit' })
        .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
        .then(function (res) {
          if (!res.body || !res.body.ok) throw new Error((res.body && res.body.error) || ('HTTP ' + res.status));
          var text = JSON.stringify(res.body);
          try { localStorage.setItem(store, text); } catch (e) {}
          if (!drawn || text !== cachedText) { root.textContent = ''; build(root, res.body); }
        });
      if (!drawn) return p;
      p.catch(function (e) { console.warn('[ix-archives] refresh failed: ' + (e && e.message)); });
      return Promise.resolve();   // the shell shows the cached draw now; the refresh lands in place
    });
  }
  if (window.IXShell) register();
  else console.warn('[ix-archives] ix-shell is not on this page; load ix-shell-v1_0_0.js before this file.');
})();
