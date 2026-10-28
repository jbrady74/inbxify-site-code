/* ix-article-v1_0_2.js
   INBXIFY · Article page on the site shell. Pairs with ix-article-v1_0_2.css.
   Needs ix-shell-v1_0_2.js (loaded before this file) and ix-issue-data
   v1.0.104+ (/site?article= with the byline).

   v1.0.2 (28 Oct 2026, Code-Built Site S4) Byline and video, built for
          every case, not just today's articles (Jeff).
            BYLINE  from the Worker (ARTICLES writername, writertitle,
                    co-writername, co-writertitle): one writer centred
                    with their title under the name; two writers side by
                    side in two equal fixed columns split by an Accent
                    rule (stacked on phones). An Expert Contributor gets
                    the business logo and name under the writers, with
                    "Expert Contributor" above the name; any other
                    associated business shows the logo and name only.
                    If the Worker has no byline, the bound writer name
                    from the page is shown, as in v1.0.1.
            PHOTO CREDIT  "Photos by <photographer>" under the main image
                    when the article's show-photo-credits is on.
            VIDEO   The template's bound video block (data-video) is read,
                    not shown as Webflow draws it: when Webflow shows it
                    and its player holds an address, the main image
                    becomes the poster with a play button (a 16:9 poster
                    in Main when there is no image). Play opens the player
                    in the same place, 16:9; "Close video" puts the poster
                    back. YouTube and Vimeo addresses of any common form
                    become their embed players (YouTube without cookies);
                    an .mp4, .webm or .mov file plays in the browser's own
                    player; any other address is embedded as given.

   v1.0.1 (28 Oct 2026, Code-Built Site S4) Rewritten for the shell. The
          shell draws nav, plate (issue line, Back to the issue), footer and
          modals, and hosts the server text on the paper before the Worker
          answers. This script lays the server text out to the Page frame
          review v0.7 rulings and adds what the Worker found:
            T2 A  Themed Spotlight: the franchise banner joined under the
                  plate at full column width, then "Presented by" when the
                  block that carried the article was sponsored. No banner
                  art: a band in Main with the franchise name.
            T1 B  Feature Article: a small badge with the franchise name
                  above the headline, in the title's Main colour.
            A3 A  Headline in Main.
                  Byline ("Written by" + the writer), short Accent rule,
                  main image, share buttons, body.
            T3 A  Sponsor banner ad at the end of the article, under
                  "<franchise> is presented by".
            T4 A  Franchise articles end with three recent from the same
                  franchise in this title, plus "See more <franchise>".
          Share: native share on phones that offer it; otherwise email,
          text message and copy link. Sends a GA "share" event only when
          the site's own gtag is on the page (no measurement id typed here).
   v1.0.0 (27 Oct 2026) Site Chrome version; never installed.

   THE PAGE (Before </body>, before this script)
     <div id="ix-page" hidden data-kind="article" data-content="#ix-article-text"
          data-headline=".." data-byline=".." data-image=".." data-body=".."></div>
     The four selectors name the bound Webflow elements inside the server
     text Div. They live in the page code, not here (HC-P-CB-15). Each
     element loses its Webflow classes once moved, so only this file's
     styles apply. Anything else left in the Div is kept, after the body.

   IF SOMETHING IS MISSING
     The words stay where the shell put them. Every missing piece is named
     in the browser console ([ix-article]); nothing is made up.

   HARDCODING
     HC-P-CB-16 the words on the page (WORDS below).
     (Three recent articles: HC-P-AR2-2, in the Worker.)
*/
(function () {
  'use strict';

  var WORDS = {                                                             // HC-P-CB-16
    by: 'Written by',
    share: 'Share',
    shareNative: 'Share this article',
    shareEmail: 'Share by email',
    shareText: 'Share by text message',
    shareCopy: 'Copy link',
    copied: 'Link copied',
    mailBody: function (title, url, pub) { return 'I thought you might like this:\n\n' + title + '\n\n' + url + (pub ? '\n\n\u2014 Shared from ' + pub : ''); },
    textBody: function (title, url, pub) { return title + ' ' + url + (pub ? ' (via ' + pub + ')' : ''); },
    presented: 'Presented by',
    isPresented: function (fr) { return fr ? fr + ' is presented by' : 'Presented by'; },
    more: function (fr) { return 'More ' + fr; },
    seeMore: function (fr) { return 'See more ' + fr; },
    no: 'No.',
    expert: 'Expert Contributor',
    photosBy: 'Photos by',
    play: 'Play video',
    closeVideo: 'Close video'
  };

  var doc = document;
  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function safeHref(u) { u = String(u || '').trim(); return /^(https?:|\/)/i.test(u) ? u : ''; }
  function link(cls, href, text) { var h = safeHref(href); var a = el(h ? 'a' : 'span', cls, text); if (h) a.href = h; return a; }
  function warn(m) { try { console.warn('[ix-article] ' + m); } catch (e) {} }
  function svg(inner) {
    var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = inner; return s;
  }
  function picture(src, alt, cls) {
    var s = safeHref(src);
    if (!s) return el('div', cls + ' ixr-noimg');
    var i = el('img', cls); i.src = s; i.alt = alt || ''; i.loading = 'lazy'; i.decoding = 'async';
    return i;
  }
  function issueLine(no, date) {
    return (no ? WORDS.no + ' ' + no : '') + (no && date ? ' \u00b7 ' : '') + (date || '');
  }
  function textOf(n) { return n ? String(n.textContent || '').replace(/\s+/g, ' ').trim() : ''; }

  /* The bound elements, by the selectors the page code gives. */
  function pick(box) {
    var page = doc.getElementById('ix-page');
    var get = function (a) { return ((page && page.getAttribute(a)) || '').trim(); };
    var out = {};
    [['headline', 'data-headline'], ['byline', 'data-byline'], ['image', 'data-image'], ['body', 'data-body'], ['video', 'data-video']].forEach(function (p) {
      var sel = get(p[1]), n = null;
      if (!sel) { warn('#ix-page has no ' + p[1] + '.'); return; }
      try { n = box.querySelector(sel); } catch (e) { warn(p[1] + ' "' + sel + '" is not a valid selector.'); return; }
      if (!n) warn('Nothing in the article text matches ' + p[1] + ' "' + sel + '".');
      out[p[0]] = n;
    });
    return out;
  }

  /* Share (ported from the old share bar; gtag only when the site has it) */
  function track(method) {
    if (typeof window.gtag === 'function') {
      try { window.gtag('event', 'share', { method: method, content_type: 'article', item_id: location.href }); } catch (e) {}
    }
  }
  function shareRow(title, pub) {
    var row = el('div', 'ixr-share');
    row.appendChild(el('span', 'ixr-share-l', WORDS.share));
    var url = location.href.split('#')[0];
    function b(label, icon, fn) {
      var x = el('button', 'ixr-sb'); x.type = 'button'; x.setAttribute('aria-label', label); x.title = label;
      x.appendChild(svg(icon)); x.addEventListener('click', function () { fn(x); }); row.appendChild(x); return x;
    }
    var phone = window.matchMedia && window.matchMedia('(max-width: 991px)').matches;
    if (navigator.share && phone) {
      b(WORDS.shareNative, '<path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>', function () {
        navigator.share({ title: title, text: title + (pub ? ' \u2014 via ' + pub : ''), url: url })
          .then(function () { track('native'); }).catch(function () {});
      });
      return row;
    }
    b(WORDS.shareEmail, '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', function () {
      location.href = 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(WORDS.mailBody(title, url, pub));
      track('email');
    });
    b(WORDS.shareText, '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', function () {
      location.href = 'sms:?&body=' + encodeURIComponent(WORDS.textBody(title, url, pub));
      track('sms');
    });
    var tip = el('span', 'ixr-tip', WORDS.copied); tip.setAttribute('role', 'status');
    var cp = b(WORDS.shareCopy, '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>', function (x) {
      var done = function () { x.classList.add('ixr-ok'); tip.classList.add('ixr-show');
        setTimeout(function () { x.classList.remove('ixr-ok'); tip.classList.remove('ixr-show'); }, 2000); track('copy'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { fallback(); done(); });
      else { fallback(); done(); }
      function fallback() {
        var ta = el('textarea'); ta.value = url; ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        doc.body.appendChild(ta); ta.select(); try { doc.execCommand('copy'); } catch (e) {} doc.body.removeChild(ta);
      }
    });
    cp.appendChild(tip);
    return row;
  }

  /* v1.0.2 · byline from the Worker */
  function bylineBlock(bl) {
    var ws = (bl && bl.writers) || [];
    var biz = bl && bl.business;
    if (!ws.length && !biz) return null;
    var wrap = el('div', 'ixr-by');
    if (ws.length) {
      wrap.appendChild(el('div', 'ixr-by-l', WORDS.by));
      var row = el('div', 'ixr-writers' + (ws.length > 1 ? ' ixr-writers--two' : ''));
      ws.slice(0, 2).forEach(function (w) {
        var c = el('div', 'ixr-writer');
        c.appendChild(el('div', 'ixr-by-n', w.name));
        if (w.title) c.appendChild(el('div', 'ixr-by-t', w.title));
        row.appendChild(c);
      });
      wrap.appendChild(row);
    }
    if (biz) {
      var b = el('div', 'ixr-biz' + (bl.expert ? ' ixr-biz--ec' : ''));
      if (safeHref(biz.logo)) { var lg = el('img', 'ixr-biz-logo'); lg.src = biz.logo; lg.alt = ''; lg.loading = 'lazy'; b.appendChild(lg); }
      var t = el('div', 'ixr-biz-t');
      if (bl.expert) t.appendChild(el('div', 'ixr-biz-ec', WORDS.expert));
      t.appendChild(el('div', 'ixr-biz-n', biz.name));
      b.appendChild(t);
      wrap.appendChild(b);
    }
    return wrap;
  }

  /* v1.0.2 · video */
  function videoSource(raw) {
    var u = String(raw || '').trim();
    if (!/^https?:\/\//i.test(u)) return null;
    var m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([\w-]{6,})/i);
    if (m) return { kind: 'frame', src: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0&playsinline=1' };
    m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (m) return { kind: 'frame', src: 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1' };
    if (/\.(mp4|webm|mov)(\?|#|$)/i.test(u)) return { kind: 'file', src: u };
    return { kind: 'frame', src: u + (u.indexOf('?') < 0 ? '?' : '&') + 'autoplay=1' };
  }
  function readVideo(node, hidden) {
    if (!node || hidden) return null;   // Webflow hides the block when the article has no video
    var f = node.querySelector('iframe, video, [data-src]');
    var raw = f ? (f.getAttribute('data-src') || f.getAttribute('src') || '') : '';
    return videoSource(raw);
  }
  function mediaBlock(im, vid, credit, alt) {
    var fig = el('figure', 'ixr-fig');
    if (!vid) {
      if (im) fig.appendChild(im);
    } else {
      var stage = el('div', 'ixr-stage');
      var poster = el('button', 'ixr-poster' + (im ? '' : ' ixr-poster--plain'));
      poster.type = 'button'; poster.setAttribute('aria-label', WORDS.play + (alt ? ': ' + alt : ''));
      if (im) poster.appendChild(im);
      var pb = el('span', 'ixr-play'); pb.setAttribute('aria-hidden', 'true');
      pb.appendChild(svg('<path d="M9 6.5v11l9-5.5z"/>'));
      poster.appendChild(pb);
      stage.appendChild(poster);
      var close = el('button', 'ixr-vclose', WORDS.closeVideo); close.type = 'button'; close.hidden = true;
      var player = null;
      poster.addEventListener('click', function () {
        player = el('div', 'ixr-player');
        if (vid.kind === 'file') {
          var v = el('video'); v.src = vid.src; v.controls = true; v.autoplay = true; v.setAttribute('playsinline', '');
          player.appendChild(v);
        } else {
          var fr = el('iframe'); fr.src = vid.src; fr.title = alt || WORDS.play; fr.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
          fr.setAttribute('allowfullscreen', ''); fr.setAttribute('frameborder', '0'); player.appendChild(fr);
        }
        poster.hidden = true; stage.appendChild(player); close.hidden = false;
        try { close.focus({ preventScroll: true }); } catch (e) {}
      });
      close.addEventListener('click', function () {
        if (player && player.parentNode) player.parentNode.removeChild(player);
        player = null; poster.hidden = false; close.hidden = true;
        try { poster.focus({ preventScroll: true }); } catch (e) {}
      });
      fig.appendChild(stage);
      fig.appendChild(close);
    }
    if (credit) fig.appendChild(el('figcaption', 'ixr-credit', WORDS.photosBy + ' ' + credit));
    return fig.firstChild ? fig : null;
  }

  function sponsorLine(sp) {
    var row = el('div', 'ixr-presented');
    row.appendChild(el('span', 'ixr-presented-l', WORDS.presented));
    var n = link('ixr-presented-n', sp.link, sp.name);
    if (n.tagName === 'A') { n.target = '_blank'; n.rel = 'noopener sponsored'; }
    row.appendChild(n);
    return row;
  }
  function tsBanner(fr) {
    var box = link('ixr-ts', fr.url);
    if (safeHref(fr.art)) {
      var i = el('img', 'ixr-ts-img'); i.src = fr.art; i.alt = fr.name; i.decoding = 'async';
      box.appendChild(i);
    } else {
      box.classList.add('ixr-ts--words');
      box.appendChild(el('span', 'ixr-ts-name', fr.name));
    }
    return box;
  }
  function sponsorEnd(sp, fr) {
    if (!safeHref(sp.ad)) return null;
    var card = el('aside', 'ixr-sponsor');
    card.appendChild(el('div', 'ixr-sponsor-l', WORDS.isPresented(fr && fr.name)));
    var a = link('ixr-sponsor-a', sp.link);
    if (a.tagName === 'A') { a.target = '_blank'; a.rel = 'noopener sponsored'; }
    a.appendChild(picture(sp.ad, sp.name, 'ixr-sponsor-img'));
    card.appendChild(a);
    return card;
  }
  function moreBlock(fr, items) {
    if (!items.length && !safeHref(fr.url)) return null;
    var sec = el('section', 'ixr-more');
    sec.appendChild(el('h2', 'ixr-more-h', WORDS.more(fr.name)));
    if (items.length) {
      var grid = el('div', 'ixr-more-grid');
      items.forEach(function (m) {
        var c = link('ixr-card', m.url);
        c.appendChild(picture(m.image, '', 'ixr-card-img'));
        var line = issueLine(m.no, m.date);
        if (line) c.appendChild(el('div', 'ixr-card-m', line));
        c.appendChild(el('h3', 'ixr-card-h', m.name));
        grid.appendChild(c);
      });
      sec.appendChild(grid);
    }
    if (safeHref(fr.url)) sec.appendChild(link('ixr-seemore', fr.url, WORDS.seeMore(fr.name)));
    return sec;
  }

  function lay(paper, site) {
    var box = paper.querySelector('.ixs-host');
    if (!box) throw new Error('the shell did not host the article text');
    var a = (site && site.article) || {};
    var fr = a.franchise && a.franchise.name ? a.franchise : null;
    var sp = a.sponsor && (a.sponsor.name || a.sponsor.ad) ? a.sponsor : null;
    var pub = (site && site.title && site.title.name) || '';
    var n = pick(box);

    // Take the bound elements out, then whatever else Jeff left in the Div.
    var parts = {};
    ['headline', 'byline', 'image', 'body', 'video'].forEach(function (k) {
      var x = n[k];
      if (x && x.parentNode) {
        parts[k + 'Empty'] = x.classList.contains('w-dyn-bind-empty');
        parts[k + 'Hidden'] = x.classList.contains('w-condition-invisible') || !!x.closest('.w-condition-invisible');
        x.parentNode.removeChild(x); x.removeAttribute('class'); parts[k] = x;
      }
    });
    var rest = [];
    Array.prototype.slice.call(box.children).forEach(function (c) {
      if (textOf(c) || c.querySelector('img,iframe,video')) rest.push(c);
      box.removeChild(c);
    });
    box.textContent = '';
    box.classList.add('ixr');

    if (fr && fr.format === 'TS') {
      var top = el('div', 'ixr-top');
      top.appendChild(tsBanner(fr));
      if (sp && sp.name) top.appendChild(sponsorLine(sp));
      box.appendChild(top);
    }

    var art = el('article', 'ixr-art');
    if (fr && fr.format === 'FA') art.appendChild(link('ixr-badge', fr.url, fr.name));
    if (sp && sp.name && !(fr && fr.format === 'TS')) art.appendChild(sponsorLine(sp));

    var h = parts.headline;
    if (h) { h.classList.add('ixr-h'); art.appendChild(h); }
    var bl = a.byline || null;
    var by = parts.byline;
    var drawn = bylineBlock(bl);
    if (drawn) art.appendChild(drawn);                  // v1.0.2: the Worker's byline
    else if (by && textOf(by) && !parts.bylineEmpty) {  // the bound writer name, as before
      var bw = el('div', 'ixr-by');
      bw.appendChild(el('div', 'ixr-by-l', WORDS.by));
      by.classList.add('ixr-by-n');
      bw.appendChild(by);
      art.appendChild(bw);
    }
    var rule = el('div', 'ixr-rule'); rule.setAttribute('aria-hidden', 'true'); art.appendChild(rule);
    var im = parts.image;
    if (!(im && im.tagName === 'IMG' && safeHref(im.currentSrc || im.src) && !parts.imageEmpty)) im = null;
    if (im) { im.classList.add('ixr-img'); im.removeAttribute('sizes'); }
    var vid = readVideo(parts.video, parts.videoHidden);   // v1.0.2
    if (parts.video && !parts.videoHidden && !vid) warn('The video block is showing but its player has no usable address.');
    var media = mediaBlock(im, vid, (bl && bl.photoCredit) || '', textOf(h));
    if (media) art.appendChild(media);
    art.appendChild(shareRow(textOf(h) || doc.title, pub));
    if (parts.body) { parts.body.classList.add('ixr-body'); art.appendChild(parts.body); }
    rest.forEach(function (c) { art.appendChild(c); });

    var tail = el('div', 'ixr-tail');
    var ad = sp ? sponsorEnd(sp, fr) : null;
    if (ad) tail.appendChild(ad);
    if (fr && (fr.format === 'TS' || fr.format === 'FA')) { var mo = moreBlock(fr, a.more || []); if (mo) tail.appendChild(mo); }
    if (tail.firstChild) art.appendChild(tail);
    box.appendChild(art);
  }

  function register() {
    window.IXShell.page('article', function (paper, site) { lay(paper, site); return true; });
  }
  if (window.IXShell) register();
  else if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () {
    if (window.IXShell) register(); else warn('The site shell (ix-shell) is not on the page.');
  });
  else warn('The site shell (ix-shell) is not on the page.');
})();
