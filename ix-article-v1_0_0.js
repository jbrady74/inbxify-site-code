/* ix-article-v1_0_0.js
   INBXIFY · Article page, built in code (Page Frame, 27 Oct 2026).
   Pairs with ix-article-v1_0_0.css. Needs ix-issue-data v1.0.95+ and
   Site Chrome v1.2.1+ (the article plate).

   WHAT IT DOES
     On the Articles template it asks the data Worker about this article
     (GET /article?slug=<the page's last path part>) and then:
       1 · ISSUE LINE. Points the plate's issue line, logo and "Back to the
           issue" at the newest edition the article ran in, and rewrites
           the words to "No. 123 • October 15, 2026" (that edition's own
           date). Ruled 27 Oct: an article in 123A/B/C links back to 123C.
       2 · FRANCHISE. A Feature Article franchise gets a small name badge
           above the headline (T1 B). A Themed Spotlight franchise gets its
           banner at the top of the article (T2 A); with no banner art, a
           band with the franchise name in the title colours.
       3 · SPONSOR. When the block that carried the article was sponsored:
           a "Presented by" line under the TS banner (or above the
           headline for other articles), and the sponsor's banner ad at
           the end of the article (T3 A).
       4 · MORE. A franchise article ends with three recent articles from
           the same franchise in this title, plus "See more <franchise>"
           linking to the franchise page (T4 A).
     If the Worker fails, the page stays exactly as Webflow draws it.

   RETIRES the Articles template's old sponsor script (the one with the
   nine-slug map: pet-corner, travel-corner, book-corner ...). Delete that
   script from the template once this one is in.

   HARDCODING
     HC-P-AR2-3 the Worker address below.
     HC-P-AR2-4 the words: "No.", "Presented by", "is presented by",
                "More from", "See more". Move to the labels map with the
                Site Chrome words (HC-P-PF1-3).

   LOAD (Articles template, Page settings, Before </body>)
     <script src="https://cdn.jsdelivr.net/gh/jbrady74/inbxify-site-code@main/ix-article-v1_0_0.js" defer></script>
*/
(function () {
  'use strict';

  var ENDPOINT = 'https://ix-issue-data.jeff-2cd.workers.dev/article';   // HC-P-AR2-3
  var WORDS = {                                                          // HC-P-AR2-4
    no: 'No.',
    presented: 'Presented by',
    isPresented: 'is presented by',
    moreFrom: 'More from',
    seeMore: 'See more'
  };

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
  function linkOrSpan(href, cls, text) {
    var h = safeHref(href);
    var e = el(h ? 'a' : 'span', cls, text);
    if (h) e.href = h;
    return e;
  }
  function picture(src, alt, cls) {
    var s = safeHref(src);
    if (!s) return el('div', cls + ' ixr-noimg');
    var i = el('img', cls);
    i.src = s; i.alt = alt || ''; i.loading = 'lazy'; i.decoding = 'async';
    return i;
  }
  function issueLine(no, date) {
    return (no ? WORDS.no + ' ' + no : '') + (no && date ? ' \u2022 ' : '') + (date || '');
  }

  /* 1 · The plate's issue line. Site Chrome may still be drawing it, so
     try for a moment before falling back to Webflow's own back link. */
  function pointPlate(latest, tries) {
    var plate = document.querySelector('.ixc-plate-box.is-art');
    var url = safeHref(latest.url);
    if (!plate) {
      if (tries > 0) { setTimeout(function () { pointPlate(latest, tries - 1); }, 150); return; }
      var back = document.querySelector('.inner-wrapper.article .link-block-5588');
      if (back && url) back.setAttribute('href', url);
      return;
    }
    var iss = plate.querySelector('.ixc-iss');
    if (iss) { iss.textContent = issueLine(latest.no, latest.date); if (url) iss.setAttribute('href', url); }
    var bk = plate.querySelector('.ixc-back');
    if (bk && url) bk.setAttribute('href', url);
    var logo = plate.querySelector('a.ixc-logo');
    if (logo && url) logo.setAttribute('href', url);
  }

  function sponsorLine(sp) {
    var row = el('div', 'ixr-presented');
    row.appendChild(el('span', 'ixr-presented-l', WORDS.presented));
    row.appendChild(linkOrSpan(sp.link, 'ixr-presented-n', sp.name));
    return row;
  }

  function tsBanner(fr) {
    var box = linkOrSpan(fr.url, 'ixr-ts');
    var art = safeHref(fr.art);
    if (art) {
      var i = el('img', 'ixr-ts-img'); i.src = art; i.alt = fr.name; i.decoding = 'async';
      box.appendChild(i);
    } else {
      box.classList.add('is-words');
      box.appendChild(el('span', 'ixr-ts-name', fr.name));
    }
    return box;
  }

  function sponsorEnd(sp, fr) {
    if (!safeHref(sp.ad)) return null;
    var card = el('aside', 'ixr-sponsor');
    card.appendChild(el('div', 'ixr-sponsor-l', (fr && fr.name ? fr.name + ' ' + WORDS.isPresented : WORDS.presented) + (sp.name ? ' ' + sp.name : '')));
    var a = linkOrSpan(sp.link, 'ixr-sponsor-a');
    if (a.tagName === 'A') { a.target = '_blank'; a.rel = 'noopener sponsored'; }
    a.appendChild(picture(sp.ad, sp.name, 'ixr-sponsor-img'));
    card.appendChild(a);
    return card;
  }

  function moreBlock(fr, items) {
    if (!items.length && !safeHref(fr.url)) return null;
    var sec = el('section', 'ixr-more');
    sec.appendChild(el('h2', 'ixr-more-h', WORDS.moreFrom + ' ' + fr.name));
    if (items.length) {
      var grid = el('div', 'ixr-more-grid');
      items.forEach(function (m) {
        var c = linkOrSpan(m.url, 'ixr-card');
        c.appendChild(picture(m.image, '', 'ixr-card-img'));
        var b = el('div', 'ixr-card-bd');
        b.appendChild(el('h3', 'ixr-card-h', m.name));
        var line = issueLine(m.no, m.date);
        if (line) b.appendChild(el('div', 'ixr-card-m', line));
        c.appendChild(b);
        grid.appendChild(c);
      });
      sec.appendChild(grid);
    }
    if (safeHref(fr.url)) sec.appendChild(linkOrSpan(fr.url, 'ixr-seemore', WORDS.seeMore + ' ' + fr.name));
    return sec;
  }

  /* The TS banner joins the plate: straight after it, at the column's full
     width. Site Chrome may still be drawing the plate, so wait a moment. */
  function placeTop(wrap, top, titleBox, tries) {
    var plate = wrap.querySelector(':scope > .ixc-plate-box.is-art');
    if (!plate && tries > 0) { setTimeout(function () { placeTop(wrap, top, titleBox, tries - 1); }, 150); return; }
    if (plate) wrap.insertBefore(top, plate.nextSibling);
    else titleBox.parentNode.insertBefore(top, titleBox);
  }

  function apply(d) {
    var wrap = document.querySelector('.inner-wrapper.article');
    var titleBox = wrap.querySelector('.al-title');
    var h1 = wrap.querySelector('.ts-article-title');
    var body = wrap.querySelector('.article-body-div');
    var fr = d.franchise && d.franchise.name ? d.franchise : null;
    var sp = d.sponsor || null;

    if (d.latest) pointPlate(d.latest, 20);

    // 2 · franchise, with the sponsor line beside it
    if (fr && fr.format === 'TS' && titleBox) {
      var top = el('div', 'ixr-top');
      top.appendChild(tsBanner(fr));
      if (sp && sp.name) top.appendChild(sponsorLine(sp));
      placeTop(wrap, top, titleBox, 20);
    } else {
      if (fr && fr.format === 'FA' && h1) h1.parentNode.insertBefore(linkOrSpan(fr.url, 'ixr-badge', fr.name), h1);
      if (sp && sp.name && h1) h1.parentNode.insertBefore(sponsorLine(sp), h1);
    }

    // 3 · sponsor ad, 4 · more
    var after = body || titleBox;
    if (!after) return;
    var tail = el('div', 'ixr-tail');
    var ad = sp ? sponsorEnd(sp, fr) : null;
    if (ad) tail.appendChild(ad);
    if (fr && (fr.format === 'TS' || fr.format === 'FA')) {
      var more = moreBlock(fr, d.more || []);
      if (more) tail.appendChild(more);
    }
    if (tail.firstChild) after.parentNode.insertBefore(tail, after.nextSibling);
    document.documentElement.classList.add('ixr-on');
  }

  ready(function () {
    if (!document.querySelector('.inner-wrapper.article')) return;
    var slug = (location.pathname.split('/').filter(Boolean).pop() || '').toLowerCase();
    if (!slug) return;
    fetch(ENDPOINT + '?slug=' + encodeURIComponent(slug), { credentials: 'omit' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) throw new Error((j && j.error) || 'no answer');
        apply(j);
      })
      .catch(function (e) {
        console.warn('[ix-article] The article details did not load (' + (e && e.message) + '); the page stays as Webflow draws it.');
      });
  });
})();
