/* ix-archives-v1_0_4.js
   INBXIFY · Archives page on the site shell. Pairs with ix-archives-v1_0_4.css.
   Needs ix-shell-v1_0_0.js (loaded before this file) and ix-issue-data
   v1.0.100+.

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
     HC-P-AR1-4 the words on the page (WORDS below).
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
    noArticles: 'No articles are online yet.'
  };
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
    b.appendChild(el('div', 'ixa-fr', (it.lead && it.lead.franchise) || ''));
    if (it.lead) {
      var h3 = el('h3', 'ixa-lead');
      h3.appendChild(link('ixa-hl', it.lead.url, it.lead.name));
      b.appendChild(h3);
    }
    var more = it.more || [];
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

  /* A list that shows `size` items, then a Show more button. */
  function paged(host, items, size, make, moreWords, emptyWords, cls) {
    if (!items.length) { host.appendChild(el('p', 'ixa-empty', emptyWords)); return; }
    var list = el('div', cls);
    host.appendChild(list);
    var shown = 0;
    var btn = el('button', 'ixa-moreb', moreWords);
    btn.type = 'button';
    function more() {
      var next = items.slice(shown, shown + size);
      next.forEach(function (it) { list.appendChild(make(it)); });
      shown += next.length;
      btn.hidden = shown >= items.length;
    }
    btn.addEventListener('click', more);
    more();
    host.appendChild(btn);
  }

  /* ── Switcher ── */
  function build(root, data) {
    var tabs = WORDS.tabs;
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

    paged(panes.newsletters, data.issues || [], PAGE.issues, issueCard, WORDS.moreIssues, WORDS.noIssues, 'ixa-issues');
    paged(panes.articles, data.articles || [], PAGE.articles, articleCard, WORDS.moreArticles, WORDS.noArticles, 'ixa-arts');

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
