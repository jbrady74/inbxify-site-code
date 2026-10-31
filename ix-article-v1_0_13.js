/* ix-article-v1_0_13.js
   INBXIFY · Article page on the site shell. Pairs with ix-article-v1_0_10.css.

   v1.0.13 (30 Oct 2026, Franchise Bands S2) THE ACCENT MARK (Jeff, 30 Oct:
          "build", as drawn in "Article squares with real WLN articles").
          An article with no band (a Feature Article franchise with no
          mascot, General today, or no franchise at all) shows a short line
          in the title's Accent centred above the headline, in place of the
          franchise name pill. The newsletter shows the same mark at the top
          of the story tile (newsletter templates of 30 Oct). A sponsored
          one keeps its sponsor line under the mark. Nothing else changed.

   v1.0.12 (30 Oct 2026, Article franchise bands) Jeff's rulings of 30 Oct.
          FEATURE ARTICLE BAND  a Feature Article franchise that has a
                  mascot (PRODUCT LIBRARY franchise-mascot) shows its
                  franchise the same way a Themed Spotlight does: the band
                  tile above the article, mascot badge beside the wordmark,
                  on its Band Colour, one link to the franchise page. A
                  sponsored one carries its sponsor line under the band,
                  as Themed Spotlight does. A Feature Article franchise
                  with no mascot (General today) keeps the name pill.
                  Sizes (the Even balance, words 90% of the badge) are in
                  the CSS, shared by both formats.
          PAID  no "Sponsored" pill on an externally written paid
                  article. The buyer's ad after the byline stays.

   v1.0.11 (29 Oct 2026, Image Fields S1) The lead photo comes from the Data
          Worker. Jeff ruled (29 Oct) that each article keeps one clean Main
          URL and sizes are made where the picture is shown. The Worker
          (v1.0.123+) sends image { src, alt }: the Main link at card size
          (whole photo, 1400 wide) and its alt text from the MEDIA row. That
          picture is now the lead photo and the video poster. The ARTICLES
          Template's own picture (bound to native MAIN Image, which is being
          deleted) is used only when the Worker sends no image. Loads
          eagerly: it is the first picture a reader sees. CSS unchanged.

   v1.0.10 (29 Oct 2026, Code-Built Site S6g) Every article body on a white
          tile (.ixr-tile); the franchise band as an inset tile. Pairs with
          ix-article-v1_0_8.css.

   v1.0.9 (29 Oct 2026, Code-Built Site S6g) The franchise band on a Themed
            Spotlight article takes the franchise page's treatment 3: when
            the Worker (v1.0.116+) carries franchise.mascot, the band is the
            mascot in a round badge, the wordmark (or the name in the display
            face) beside it, on franchise.bandColor; text light on a dark
            colour. No mascot: the full art as before. No art: the name on
            Main. The band is still one link to the franchise page.

   v1.0.8 (28 Oct 2026, Code-Built Site S6) The byline is a choice (Jeff).
            TITLES    byline.showTitles false hides ", Title" after both
                    writers (ARTICLES hide-writer-titles, set on the form).
            BUSINESS  drawn under the writers only when byline.showBusiness
                    is true (ARTICLES show-business-in-byline, or an Expert
                    Contributor; the Worker decides, v1.0.113+). With an
                    older Worker that has no showBusiness, v1.0.7's rule
                    (Expert Contributor only) is kept.

   v1.0.7 (28 Oct 2026, Code-Built Site S6) The byline is the writer's.
            BUSINESS  the associated Customer is drawn under the writers
                    only when they are an Expert Contributor (the business
                    wrote it). A sponsor is not the writer's affiliation:
                    on a paid article the sponsor is already shown by the
                    "Sponsored" tag and the "Sponsored by <name>" ad after
                    the byline, and a staff writer with a Customer attached
                    gets no company line at all. Amends S4 R2 (the Worker
                    still sends byline.business; the page decides).

   v1.0.6 (28 Oct 2026, Code-Built Site S4) Staging review, Jeff.
            PHOTO ESSAY  the article body comes first, as a short intro,
                    then the photos, then Share.
            LIGHTBOX  the photo as large as the screen allows, with its
                    caption directly beneath it; arrows, counter and
                    thumbnails below that. Fixes v1.0.5, where a large
                    photo was squeezed to a thumbnail: its size now comes
                    from the screen (CSS), not from the flex box around it.

   v1.0.5 (28 Oct 2026, Code-Built Site S4) Photo essay treatments and the
          lightbox. Jeff: a photo essay can be drawn in one of a few
          treatments, chosen per article on the Article form; Polaroid
          (the look of the old template's article-photo-essay-head-v1_0
          and article-page-body-PE) is the first.
            GALLERY   one markup for every treatment: each photo a card
                      (figure, image, caption) in a column, class
                      ixr-gallery--<treatment>. The treatment is only a
                      stylesheet: Polaroid's white card, deep caption chin,
                      tilts and every-third-full-width sizes are all CSS
                      (ix-article-v1_0_4.css), so a new treatment is new
                      styles plus one name in TREATMENTS below.
            TREATMENT article.treatment from the Worker (v1.0.106+). A name
                      this file does not know is drawn as the default
                      (Polaroid) and named in the console.
            REVEAL    cards fade up as they scroll into view (shared; each
                      treatment decides how it looks; off when the reader
                      asks for reduced motion).
            LIGHTBOX  shared by every treatment. Tap or Enter on a card
                      opens it: the photo, previous and next, "3 of 12",
                      the caption, thumbnail strip; arrow keys, Escape,
                      swipe on phones; focus goes back to the card on
                      close. Colours and fonts are the title's.
          Needs ix-issue-data v1.0.106+ for the treatment (without it,
          every photo essay is drawn as Polaroid).

   v1.0.4 (28 Oct 2026, Code-Built Site S4) Format, paid, subtitle, byline.
          Jeff's rulings, 28 Oct 2026. Every show/hide decision comes from
          the Worker (ix-issue-data v1.0.105+), never from a Webflow switch.
            FORMAT  article.format from the Worker: 'standard' shows the
                    main image; 'video' shows the poster and player (the
                    address is still read from the bound video block);
                    'photo-essay' shows the gallery (MEDIA photos in their
                    saved order, each with its caption) in place of the
                    main image. When the Worker has no format (formatFrom
                    'none'), v1.0.3's behaviour is kept.
            PAID    article.paid set: a "Sponsored" label above the
                    headline, and the buyer's ad right after the byline
                    under "Sponsored by <customer>". Everything else (the
                    franchise sponsor's ad, later the S7 ads) comes after.
            SUBTITLE  the bound Sub-Title (data-subtitle) under the headline.
            BYLINE  "Name, Title" on one line per writer; the company on its
                    own line beneath in the UI font. Expert Contributor
                    (follows the customer) adds the label and the logo; any
                    other company shows its name only.
          Needs the page line in articles-template-before-body-CB7.html
          (adds data-subtitle).

   v1.0.3 (28 Oct 2026, Code-Built Site S4) The two article bodies.
          The ARTICLES template carries two body elements, both with the
          class article-body-rte, one shown by conditional visibility:
            · the Code Embed bound to post-body-html (Path B, what Studio
              writes today, with exact figures, sizes and alignment);
            · the Rich Text bound to post-body (legacy articles).
          For every role (headline, writer, image, body, video) this file
          now takes the element Webflow is SHOWING among those that match,
          and drops the hidden ones, so a hidden body never doubles up.
          When the body is the Code Embed, Webflow has written the HTML as
          escaped text; it is turned back into HTML here (the job body.js
          section 18 did on the old page; skipped if already done).
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
    sponsored: 'Sponsored',
    openPhoto: function (i, n) { return 'Open photo ' + i + ' of ' + n; },
    photoOf: function (i, n) { return i + ' of ' + n; },
    photo: function (i) { return 'Photo ' + i; },
    prev: 'Previous photo',
    next: 'Next photo',
    close: 'Close',
    gallery: 'Photo gallery',
    sponsoredBy: function (n) { return n ? 'Sponsored by ' + n : 'Sponsored'; },
    photosBy: 'Photos by',
    play: 'Play video',
    closeVideo: 'Close video'
  };

  /* v1.0.5 · The photo essay treatments this file can draw (each is a
     stylesheet section in ix-article-v1_0_4.css). The first is the
     default. HC-P-CB-20. */
  var TREATMENTS = ['polaroid'];

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
    [['headline', 'data-headline'], ['subtitle', 'data-subtitle'], ['byline', 'data-byline'], ['image', 'data-image'], ['body', 'data-body'], ['video', 'data-video']].forEach(function (p) {
      var sel = get(p[1]), n = null, all = [];
      if (!sel) { if (p[0] !== 'subtitle') warn('#ix-page has no ' + p[1] + '.'); return; }
      try { all = Array.prototype.slice.call(box.querySelectorAll(sel)); } catch (e) { warn(p[1] + ' "' + sel + '" is not a valid selector.'); return; }
      // v1.0.3: the one Webflow shows; the others are removed so they never show twice.
      var hiddenAll = function (x) { return x.classList.contains('w-condition-invisible') || !!x.closest('.w-condition-invisible'); };
      n = all.filter(function (x) { return !hiddenAll(x); })[0] || all[0] || null;
      all.forEach(function (x) { if (x !== n && x.parentNode) x.parentNode.removeChild(x); });
      if (!n && p[0] !== 'subtitle' && p[0] !== 'video') warn('Nothing in the article text matches ' + p[1] + ' "' + sel + '".');   // v1.0.4: no subtitle or video is normal
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

  /* v1.0.3 · Path B: Webflow writes a Plain Text field inside a Code Embed
     as escaped text; read it back as HTML. Done once (data-html-unescaped,
     the same mark body.js section 18 set). */
  function unescapeEmbed(x) {
    if (!x.classList.contains('w-embed') || x.getAttribute('data-html-unescaped') === 'true') return;
    if (x.children.length) return;   // already real HTML
    var html = x.textContent || '';
    if (/<[a-z!\/]/i.test(html)) { x.innerHTML = html; x.setAttribute('data-html-unescaped', 'true'); }
  }

  /* v1.0.4 · byline: "Name, Title" per writer; the company beneath */
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
        var line = el('div', 'ixr-by-n', w.name);
        if (w.title && bl.showTitles !== false) { line.appendChild(doc.createTextNode(', ')); line.appendChild(el('span', 'ixr-by-t', w.title)); }   // v1.0.8: a choice
        c.appendChild(line);
        row.appendChild(c);
      });
      wrap.appendChild(row);
    }
    var showBiz = ('showBusiness' in bl) ? bl.showBusiness === true : !!bl.expert;   // v1.0.8: the form's choice; older Worker: EC only
    if (biz && biz.name && showBiz) {
      var b = el('div', 'ixr-biz' + (bl.expert ? ' ixr-biz--ec' : ''));
      if (bl.expert && safeHref(biz.logo)) { var lg = el('img', 'ixr-biz-logo'); lg.src = biz.logo; lg.alt = ''; lg.loading = 'lazy'; b.appendChild(lg); }
      var t = el('div', 'ixr-biz-t');
      if (bl.expert) t.appendChild(el('div', 'ixr-biz-ec', WORDS.expert));
      t.appendChild(el('div', 'ixr-biz-n', biz.name));
      b.appendChild(t);
      wrap.appendChild(b);
    }
    return wrap;
  }

  /* v1.0.4 · the buyer's ad on a paid article */
  function buyerAd(pd) {
    if (!pd || !safeHref(pd.ad)) return null;
    var card = el('aside', 'ixr-buyer');
    card.appendChild(el('div', 'ixr-sponsor-l', WORDS.sponsoredBy(pd.name)));
    var a = link('ixr-sponsor-a', pd.link);
    if (a.tagName === 'A') { a.target = '_blank'; a.rel = 'noopener sponsored'; }
    a.appendChild(picture(pd.ad, pd.name, 'ixr-sponsor-img'));
    card.appendChild(a);
    return card;
  }

  /* v1.0.5 · photo essay: one gallery, a treatment by name, a shared lightbox */
  function galleryBlock(items, credit, treatment) {
    items = (items || []).filter(function (it) { return safeHref(it.src); });
    if (!items.length) return null;
    var t = String(treatment || '').toLowerCase();
    if (TREATMENTS.indexOf(t) < 0) {
      if (t) warn('No treatment called "' + t + '" on this page; drawing ' + TREATMENTS[0] + '.');
      t = TREATMENTS[0];
    }
    var g = el('div', 'ixr-gallery ixr-gallery--' + t);
    g.setAttribute('role', 'group'); g.setAttribute('aria-label', WORDS.gallery);
    var cards = [];
    items.forEach(function (it, i) {
      var item = el('div', 'ixr-gitem');
      var f = el('figure', 'ixr-gcard');
      f.tabIndex = 0; f.setAttribute('role', 'button');
      f.setAttribute('aria-label', WORDS.openPhoto(i + 1, items.length) + (it.caption ? ': ' + it.caption : ''));
      var im = picture(it.src, it.alt || it.caption || '', 'ixr-gimg');
      if (i === 0) im.loading = 'eager';
      f.appendChild(im);
      f.appendChild(el('figcaption', 'ixr-gcap', it.caption || ''));
      f.addEventListener('click', function () { openLightbox(items, i, f); });
      f.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(items, i, f); }
      });
      item.appendChild(f);
      g.appendChild(item);
      cards.push(item);
    });
    if (credit) g.appendChild(el('div', 'ixr-credit', WORDS.photosBy + ' ' + credit));
    reveal(cards);
    return g;
  }

  function reveal(nodes) {
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || !('IntersectionObserver' in window)) { nodes.forEach(function (n) { n.classList.add('ixr-in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('ixr-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  var LB = null;
  function buildLightbox() {
    var root = doc.getElementById('ix-root') || doc.body;
    var box = el('div', 'ixr-lb');
    box.hidden = true;
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', WORDS.gallery);
    var close = el('button', 'ixr-lb-x'); close.type = 'button'; close.setAttribute('aria-label', WORDS.close);
    close.appendChild(svg('<path d="M6 6l12 12M18 6L6 18"/>'));
    var stage = el('div', 'ixr-lb-stage');
    var fig = el('figure', 'ixr-lb-fig');
    var img = el('img', 'ixr-lb-img'); img.alt = '';
    var cap = el('figcaption', 'ixr-lb-cap');                 // v1.0.6: right under the photo
    fig.appendChild(img); fig.appendChild(cap);
    stage.appendChild(fig);
    var bar = el('div', 'ixr-lb-bar');
    var ctl = el('div', 'ixr-lb-ctl');
    var prev = el('button', 'ixr-lb-nav'); prev.type = 'button'; prev.setAttribute('aria-label', WORDS.prev);
    prev.appendChild(svg('<path d="M15 5l-7 7 7 7"/>'));
    var count = el('div', 'ixr-lb-count'); count.setAttribute('aria-live', 'polite');
    var next = el('button', 'ixr-lb-nav'); next.type = 'button'; next.setAttribute('aria-label', WORDS.next);
    next.appendChild(svg('<path d="M9 5l7 7-7 7"/>'));
    ctl.appendChild(prev); ctl.appendChild(count); ctl.appendChild(next);
    var pills = el('div', 'ixr-lb-pills');
    bar.appendChild(ctl); bar.appendChild(pills);
    box.appendChild(close); box.appendChild(stage); box.appendChild(bar);
    root.appendChild(box);
    LB = { box: box, img: img, count: count, cap: cap, pills: pills, prev: prev, next: next, close: close,
           items: [], i: 0, from: null, overflow: '' };
    close.addEventListener('click', closeLightbox);
    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    box.addEventListener('click', function (e) { if (e.target === box || e.target === stage || e.target === fig) closeLightbox(); });
    doc.addEventListener('keydown', function (e) {
      if (LB.box.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'Tab') {   // keep focus inside the box
        var f = Array.prototype.slice.call(box.querySelectorAll('button:not([hidden])'));
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    var x0 = null;
    stage.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (x0 == null) return; var d = x0 - e.changedTouches[0].clientX; x0 = null;
      if (Math.abs(d) > 50) step(d > 0 ? 1 : -1);
    }, { passive: true });
  }
  function openLightbox(items, i, from) {
    if (!LB) buildLightbox();
    LB.items = items; LB.from = from;
    LB.pills.textContent = '';
    items.forEach(function (it, k) {
      var b = el('button', 'ixr-lb-pill'); b.type = 'button'; b.setAttribute('aria-label', WORDS.photo(k + 1));
      var t = el('img'); t.src = it.src; t.alt = ''; t.loading = 'lazy'; b.appendChild(t);
      b.addEventListener('click', function () { show(k); });
      LB.pills.appendChild(b);
    });
    var one = items.length < 2;
    LB.prev.hidden = one; LB.next.hidden = one; LB.pills.hidden = one;
    LB.overflow = doc.documentElement.style.overflow;
    doc.documentElement.style.overflow = 'hidden';
    LB.box.hidden = false;
    show(i);
    try { LB.close.focus({ preventScroll: true }); } catch (e) {}
  }
  function show(k) {
    var n = LB.items.length; if (!n) return;
    LB.i = (k + n) % n;
    var it = LB.items[LB.i];
    LB.img.src = it.src; LB.img.alt = it.alt || it.caption || WORDS.photo(LB.i + 1);
    LB.count.textContent = WORDS.photoOf(LB.i + 1, n);
    LB.cap.textContent = it.caption || '';
    Array.prototype.forEach.call(LB.pills.children, function (p, j) {
      p.classList.toggle('ixr-lb-on', j === LB.i);
      if (j === LB.i) p.setAttribute('aria-current', 'true'); else p.removeAttribute('aria-current');
    });
    var on = LB.pills.children[LB.i];
    if (on && on.scrollIntoView) try { on.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {}
  }
  function step(d) { show(LB.i + d); }
  function closeLightbox() {
    if (!LB || LB.box.hidden) return;
    LB.box.hidden = true; LB.img.removeAttribute('src');
    doc.documentElement.style.overflow = LB.overflow;
    if (LB.from) try { LB.from.focus({ preventScroll: true }); } catch (e) {}
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
    if (safeHref(fr.mascot)) {                                       // v1.0.9: treatment 3, compact
      box.classList.add('ixr-ts--mascot');
      var c = String(fr.bandColor || '').trim();
      if (/^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\)|[a-z]{3,20})$/i.test(c)) {
        box.style.setProperty('--ixr-ts-bg', c);
        var h = c.charAt(0) === '#' ? c.slice(1) : '';
        if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join('');
        var dark = h.length >= 6 && (parseInt(h.substr(0, 2), 16) * 299 + parseInt(h.substr(2, 2), 16) * 587 + parseInt(h.substr(4, 2), 16) * 114) / 1000 < 128;
        box.classList.add(dark ? 'ixr-ts--dark' : 'ixr-ts--light');   // no colour at all: the band is Main, the name white
      }
      var m = el('img', 'ixr-ts-mascot'); m.src = fr.mascot; m.alt = ''; m.decoding = 'async';
      box.appendChild(m);
      if (safeHref(fr.wordmark)) {
        var w = el('img', 'ixr-ts-wordmark'); w.src = fr.wordmark; w.alt = fr.name; w.decoding = 'async';
        box.appendChild(w);
      } else {
        box.appendChild(el('span', 'ixr-ts-name ixr-ts-name--mascot', fr.name));
      }
      return box;
    }
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
    ['headline', 'subtitle', 'byline', 'image', 'body', 'video'].forEach(function (k) {
      var x = n[k];
      if (x && x.parentNode) {
        if (k === 'body') unescapeEmbed(x);           // v1.0.3: Path B body
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

    var banded = !!(fr && (fr.format === 'TS' || (fr.format === 'FA' && safeHref(fr.mascot))));   // v1.0.12
    if (banded) {
      var top = el('div', 'ixr-top');
      top.appendChild(tsBanner(fr));
      if (sp && sp.name) top.appendChild(sponsorLine(sp));
      box.appendChild(top);
    }

    var pd = a.paid || null;                                  // v1.0.4
    var known = a.formatFrom && a.formatFrom !== 'none';      // v1.0.4
    var fmt = known ? a.format : '';
    (a.warnings || []).forEach(function (w) { warn('Worker: ' + w); });

    var art = el('article', 'ixr-art');
    if (!banded) {                                            // v1.0.13: the Accent mark replaces the name pill
      var mk = el('div', 'ixr-amark'); mk.setAttribute('aria-hidden', 'true');
      art.appendChild(mk);
    }
    if (sp && sp.name && !banded) art.appendChild(sponsorLine(sp));

    var h = parts.headline;
    if (h) { h.classList.add('ixr-h'); art.appendChild(h); }
    var sub = parts.subtitle;                                 // v1.0.4
    if (sub && textOf(sub) && !parts.subtitleEmpty && !parts.subtitleHidden) { sub.classList.add('ixr-sub'); art.appendChild(sub); }
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
    var buy = buyerAd(pd);                                    // R5: the buyer's ad right after the byline
    if (buy) art.appendChild(buy);
    var rule = el('div', 'ixr-rule'); rule.setAttribute('aria-hidden', 'true'); art.appendChild(rule);
    var im = parts.image;
    if (!(im && im.tagName === 'IMG' && safeHref(im.currentSrc || im.src) && !parts.imageEmpty)) im = null;
    if (im) { im.classList.add('ixr-img'); im.removeAttribute('sizes'); }
    var wimg = a.image || null;                               // v1.0.11: the Worker's sized lead photo
    if (wimg && safeHref(wimg.src)) {
      var lead = picture(wimg.src, wimg.alt || (im && im.getAttribute('alt')) || '', 'ixr-img');
      lead.loading = 'eager';
      im = lead;
    }
    var credit = (bl && bl.photoCredit) || '';
    var vid = null, media = null;
    if (!known) {                                             // no format from the Worker: v1.0.3 behaviour
      vid = readVideo(parts.video, parts.videoHidden);
      if (parts.video && !parts.videoHidden && !vid) warn('The video block is showing but its player has no usable address.');
    } else if (fmt === 'video') {
      vid = readVideo(parts.video, false);
      if (!vid) warn('This is a Video article but the video block has no usable address.');
    }
    if (fmt === 'photo-essay') {
      media = galleryBlock(a.gallery || [], credit, a.treatment);
      if (!media) { warn('This is a Photo Essay with no gallery photos; showing the main image.'); media = mediaBlock(im, null, credit, textOf(h)); }
    } else media = mediaBlock(im, vid, credit, textOf(h));
    if (parts.body) parts.body.classList.add('ixr-body');
    if (fmt === 'photo-essay' && parts.body) {               // v1.0.6: the body is the essay's intro
      parts.body.classList.add('ixr-body--intro');
      art.appendChild(parts.body);
      if (media) art.appendChild(media);
      art.appendChild(shareRow(textOf(h) || doc.title, pub));
    } else {
      if (media) art.appendChild(media);
      art.appendChild(shareRow(textOf(h) || doc.title, pub));
      if (parts.body) art.appendChild(parts.body);
    }
    rest.forEach(function (c) { art.appendChild(c); });

    var tail = el('div', 'ixr-tail');
    var ad = sp ? sponsorEnd(sp, fr) : null;
    if (ad) tail.appendChild(ad);
    if (fr && (fr.format === 'TS' || fr.format === 'FA')) { var mo = moreBlock(fr, a.more || []); if (mo) tail.appendChild(mo); }
    if (tail.firstChild) art.appendChild(tail);
    var tile = el('div', 'ixr-tile'); tile.appendChild(art); box.appendChild(tile);   // v1.0.10: every article on a white tile (Jeff, 29 Oct)
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
