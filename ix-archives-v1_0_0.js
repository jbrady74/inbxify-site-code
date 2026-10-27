/* ix-archives-v1_0_0.js
   INBXIFY · Archives page, built in code (Page Frame, 27 Oct 2026).
   Pairs with ix-archives-v1_0_0.css. Needs ix-issue-data v1.0.94+.

   WHAT IT DOES
     On the Archives template it asks the data Worker for this title's
     archive (GET /archives?title=<TITLES slug>) and draws, inside the
     page's paper column under Site Chrome's plate:
       one switcher   Newsletters | Print | Articles (M6)
       Newsletters    one card per issue, edition A only, reading
                      "No. 123 • October 1 – 15, 2026", the issue's
                      picture and its articles in issue order. The whole
                      card opens the issue.
       Print          the print covers Webflow already lists on the page
                      (.arcv-item), moved into this tab.
       Articles       every article the title has run, newest edition
                      first, each opening the article page.
     Webflow's old tabs and print strip are hidden only after the archive
     has loaded. If the data line has no slug, or the Worker fails, the
     old Webflow content is left exactly as it is and the reason goes to
     the browser console.

   LINKING TO A TAB
     /archives/<title>#print or #articles opens that tab; #newsletters is
     the default.

   DATA LINE (Archives template, Page settings, Before </body>)
     The existing #ix-title-data line gains one attribute:
       data-slug="[TITLE: Slug]"

   HARDCODING
     HC-P-AR1-3 the Worker address below (the platform's data Worker).
     HC-P-AR1-4 the words on the page: the three tab names, "In this
                issue", "Show more issues", "Show more articles", "No.",
                and the empty and loading lines. Move to the labels map
                with the Site Chrome words (HC-P-PF1-3).
     HC-P-AR1-5 page sizes: 10 issues and 18 articles before Show more.

   LOAD (Archives template, Page settings, Before </body>, after the
   data line)
     <script src="https://cdn.jsdelivr.net/gh/jbrady74/inbxify-site-code@main/ix-archives-v1_0_0.js" defer></script>
*/
(function () {
  'use strict';

  var ENDPOINT = 'https://ix-issue-data.jeff-2cd.workers.dev/archives';   // HC-P-AR1-3
  var WORDS = {                                                            // HC-P-AR1-4
    tabs: [['newsletters', 'Newsletters'], ['print', 'Print'], ['articles', 'Articles']],
    inIssue: 'In this issue',
    no: 'No.',
    moreIssues: 'Show more issues',
    moreArticles: 'Show more articles',
    loading: 'Loading the archive',
    noIssues: 'No issues are online yet.',
    noPrint: 'No print issues are online yet.',
    noArticles: 'No articles are online yet.'
  };
  var PAGE = { issues: 10, articles: 18 };                                 // HC-P-AR1-5

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
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

  /* ── Newsletters ── */
  function issueCard(it) {
    var a = el('a', 'ixa-issue');
    var h = safeHref(it.url);
    if (h) a.href = h;
    var left = el('div', 'ixa-issue-l');
    left.appendChild(el('div', 'ixa-issue-bar', issueLine(it.no, it.date)));
    left.appendChild(img(it.image, '', 'ixa-issue-img'));
    a.appendChild(left);

    var right = el('div', 'ixa-issue-r');
    right.appendChild(el('div', 'ixa-issue-hd', WORDS.inIssue));
    var body = el('div', 'ixa-issue-bd');
    if (it.lead) {
      if (it.lead.franchise) body.appendChild(el('div', 'ixa-fr ixa-fr-lead', it.lead.franchise));
      body.appendChild(el('h3', 'ixa-lead', it.lead.name));
    }
    if (it.more && it.more.length) {
      var ol = el('ol', 'ixa-more');
      it.more.forEach(function (m, i) {
        var li = el('li');
        li.appendChild(el('span', 'ixa-n', String(i + 2)));
        var t = el('span', 'ixa-mt');
        if (m.franchise) t.appendChild(el('span', 'ixa-fr', m.franchise));
        t.appendChild(el('span', 'ixa-mh', m.name));
        li.appendChild(t);
        ol.appendChild(li);
      });
      body.appendChild(ol);
    }
    right.appendChild(body);
    a.appendChild(right);
    return a;
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
    var line = issueLine(it.no, it.date);
    if (line) b.appendChild(el('div', 'ixa-art-m', line));
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

  /* ── Print: Webflow's own cover list, moved in ── */
  function printPane(host) {
    var items = Array.prototype.slice.call(document.querySelectorAll('.arcv-item'));
    if (!items.length) { host.appendChild(el('p', 'ixa-empty', WORDS.noPrint)); return; }
    var grid = el('div', 'ixa-print');
    items.forEach(function (item) {
      var src = item.querySelector('img');
      var cap = item.querySelector('h5, h4, h3, h6');
      var link = item.querySelector('a');
      var href = link ? safeHref(link.getAttribute('href')) : '';
      var c = el(href && href !== '#' ? 'a' : 'div', 'ixa-cover');
      if (href && href !== '#') c.href = href;
      c.appendChild(img(src ? (src.currentSrc || src.src) : '', cap ? cap.textContent.trim() : '', 'ixa-cover-img'));
      if (cap) c.appendChild(el('div', 'ixa-cover-cap', cap.textContent.trim()));
      grid.appendChild(c);
    });
    host.appendChild(grid);
  }

  /* ── Switcher ── */
  function build(root, data) {
    var bar = el('div', 'ixa-switch');
    bar.setAttribute('role', 'tablist');
    var panes = {}, buttons = {};
    WORDS.tabs.forEach(function (t) {
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
      var keys = WORDS.tabs.map(function (t) { return t[0]; });
      var i = keys.indexOf(current) + (e.key === 'ArrowRight' ? 1 : -1);
      i = (i + keys.length) % keys.length;
      show(keys[i], true);
      buttons[keys[i]].focus();
    });
    root.appendChild(bar);
    WORDS.tabs.forEach(function (t) { root.appendChild(panes[t[0]]); });

    paged(panes.newsletters, data.issues || [], PAGE.issues, issueCard, WORDS.moreIssues, WORDS.noIssues, 'ixa-issues');
    printPane(panes.print);
    paged(panes.articles, data.articles || [], PAGE.articles, articleCard, WORDS.moreArticles, WORDS.noArticles, 'ixa-arts');

    var current = '';
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

  ready(function () {
    if (document.body.getAttribute('data-page-type') !== 'archives') return;
    var host = document.querySelector('.page-content.archives .content-75') || document.getElementById('ix-archives');
    if (!host) { console.warn('[ix-archives] No .page-content.archives .content-75 on this page; Archives left as Webflow draws it.'); return; }
    var dataEl = document.getElementById('ix-title-data');
    var slug = dataEl ? (dataEl.getAttribute('data-slug') || '').trim() : '';
    if (!slug) { console.warn('[ix-archives] The #ix-title-data line has no data-slug; Archives left as Webflow draws it.'); return; }

    var root = el('div', 'ixa');
    var wait = el('div', 'ixa-wait');
    wait.setAttribute('role', 'status');
    wait.appendChild(el('span', 'ixa-wait-bar'));
    wait.appendChild(el('span', 'ixa-wait-t', WORDS.loading));
    root.appendChild(wait);
    host.appendChild(root);
    document.documentElement.classList.add('ixa-loading');

    fetch(ENDPOINT + '?title=' + encodeURIComponent(slug), { credentials: 'omit' })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (res) {
        if (!res.body || !res.body.ok) throw new Error((res.body && res.body.error) || ('HTTP ' + res.status));
        root.removeChild(wait);
        build(root, res.body);
        document.documentElement.classList.remove('ixa-loading');
        document.documentElement.classList.add('ixa-on');
      })
      .catch(function (e) {
        console.warn('[ix-archives] The archive did not load (' + (e && e.message) + '); Archives left as Webflow draws it.');
        if (root.parentNode) root.parentNode.removeChild(root);
        document.documentElement.classList.remove('ixa-loading');
      });
  });
})();
