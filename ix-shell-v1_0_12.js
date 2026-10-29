/* ix-shell-v1_0_12.js
   v1.0.12 (29 Oct 2026, Code-Built Site S7): no raw page while loading.
     1 · Before the shell starts, Webflow's own markup is hidden by the CSS
         (ix-shell-v1_0_11.css: html without .ixs-on). The shell adds
         .ixs-on to <html> the moment it starts, so from then on the page
         behaves exactly as v1.0.11. If this script never runs, the CSS
         shows the page anyway after 6 seconds.
     2 · Article page: the server text is still moved into the paper at
         once (search engines and the fallback keep it), but it stays
         hidden under the loading bar (.ixs-paper--wait) until ix-article
         has laid it out. It is shown as soon as the layout finishes, when
         /site fails (the words then show as they are, as before), or after
         6 seconds whatever happens (HC-P-CBS7-1). This reverses the
         v1.0.2 "nothing is hidden" choice for the waiting moment only.
     3 · VERSION reads 1.0.12 (it had been left at 1.0.9).
     Pairs with ix-shell-v1_0_11.css.
   v1.0.11 (29 Oct 2026, Code-Built Site S6): franchise treatment 3, the
     mascot band. When the Worker (v1.0.115+) carries site.franchise.mascot,
     the band becomes .ixs-band--mascot: the mascot in a round badge that
     straddles the plate rule and the band, the wordmark (site.franchise.
     wordmark, else the franchise name in the display face) and the
     standfirst (site.franchise.description) to its right, left aligned;
     centred and stacked on phones. site.franchise.bandColor, when set,
     fills the band and the badge (the art's own colour); the text turns
     light on a dark colour. No mascot: the art band of v1.0.10. No art
     either: the Accent band. Pairs with ix-shell-v1_0_10.css.
   v1.0.10 (28 Oct 2026, Code-Built Site S6): the franchise art band.
     On a franchise page whose Worker answer carries site.franchise.art,
     the Accent band is replaced by the art (.ixs-band--art): the franchise
     art, scaled to the band's height, never cropped, on the title's paper
     colour, with the franchise name as a hidden h1 for readers and search
     engines. Franchises without art keep the Accent band exactly as v1.0.9
     drew it (plate, then the section's name, then paper: the frame rule
     holds everywhere). Before /site answers, a franchise page's band is
     empty rather than the literal "{franchise}". Pairs with
     ix-shell-v1_0_9.css (or v1_0_8: the art band then falls back to its
     own inline sizing). Jeff: mockup D, 28 Oct 2026.
   v1.0.9 (28 Oct 2026, Code-Built Site S6): the franchise page
     (data-kind="franchise"). The page line carries data-title = the
     PRODUCT LIBRARY slug (the page's own last path part when absent); the
     title comes from ?title=<TITLES or TITLES-ADMIN slug> on the address
     (the article page's "See more" link carries it), else the Worker's
     choice. The shell asks /site?franchise=<slug>&title=<key> (Worker
     v1.0.112+), paints the franchise name on the Accent band with the
     title's name under it, and hands site.franchise to the page script
     (ix-franchise). The remembered logo (v1.0.8) is keyed by that title.
     Pairs with ix-shell-v1_0_7.css (unchanged).
   v1.0.8 (28 Oct 2026, Code-Built Site S5): the title's logo and name are
     remembered in the browser on their own (localStorage ixs-logo:<title>)
     each time /site answers, on any page of the title. A page whose line
     carries no data-logo (Archives: the ARCHIVES field TITLE is plain text
     holding the TITLES id, so the CMS cannot bind the logo) draws the
     remembered logo at once when the reader has seen any page of the
     title before. A first-ever visit still waits for /site. Pairs with
     ix-shell-v1_0_7.css (unchanged).
   v1.0.7 (28 Oct 2026, Code-Built Site S5, Jeff's phone review):
     1 · The masthead logo shows at once. The page line may carry
         data-logo (the TITLES logo on Main, from the page's own CMS
         binding) and data-name; the plate draws them before /site answers,
         and /site's values replace them when they differ. No cache needed
         on a first visit.
     2 · The phone menu sits above everything the page hosts (nav z-index
         raised; the menu panel and dim get their own stacking).
     3 · A hosted page (the old issue layout) is clipped to the paper: it
         can no longer push past the card's edge.
   v1.0.6 (28 Oct 2026, Code-Built Site S5): the shell's modal is opened
     to page scripts: IXShell.modal(title, sub) returns { body, close,
     onClose(fn) }. Archives and the Directory use it on phones for the
     search and filter sheets. Nothing else changes.
   v1.0.5 (28 Oct 2026, Code-Built Site S5): click feedback on every shell
     link that leaves the page (nav, phone menu, footer, logo, Back links):
     the link gets a small drawn Accent ring after its words and the nav
     shows a thin Accent line travelling along its top until the next page
     paints. Nothing to load: the ring and the line are CSS. Cleared on
     pageshow (Back button / bfcache) and by an 8-second fail-safe.
   -- v1.0.4 notes --
   INBXIFY · Site shell · every public title page drawn in code.
   Pairs with ix-shell-v1_0_4.css. Needs ix-issue-data v1.0.108+ (design.fontHeader;
   older Workers still work, the band then uses the UI font).
   Code-Built Site S2, 28 Oct 2026. v1.0.1: S3. v1.0.2: S4. v1.0.3 and v1.0.4: S5, 28 Oct 2026.

   v1.0.4 · THE DIRECTORY PAGE (data-kind="directory")
     The band reads "Local Business Directory" over "Local businesses ·
     <title name>". The page script ix-directory draws the paper. Nothing
     else changes from v1.0.3.

   v1.0.3 · THE PLATE BAND (Idea C, Jeff 28 Oct 2026)
     The plate is two rows: the logo and Accent dot rule on Main, then an
     Accent band across the full width with the page name (capitals, the
     title's Page Header Font) and the short line under it, in Main.
     Page Header Font: TITLES "Page Header Font" (design.fontHeader); empty
     = the title's UI font. Loaded from Google Fonts with the other fonts.
     Article band: "Back to the issue" on the left, the issue's date on the
     right, same size and weight; no issue number (a reader from the email
     already knows the issue; the date tells a later visitor how old it is).
     Phones: two centred lines, the way back on top. No link when the issue
     has no address; the date alone, centred.
     Issue page: unchanged. The new web page has no shell plate (the
     issue's own nameplate, circle and watermark are the plate). The old
     layout gets the band with "No. 122" and the date.
     THE BACK ARROW: every Back link is drawn by one helper (backLink, also
     IXShell.back(href, text) for page scripts): a small drawn arrow,
     centred on the letters by flex, whatever the font. No typed arrow
     character anywhere (fonts draw it at different heights).

   v1.0.2 · THE ARTICLE PAGE (data-kind="article")
     The ARTICLES template keeps four bound Webflow elements inside one
     Div (the server text: headline, writer, main image, body), so search
     engines read the words. #ix-page names that Div in data-content.
     The shell moves it into the paper at once, before the Worker answers,
     so the reader sees the words straight away. The article page script
     (ix-article) then lays it out. If the Worker or the page script fails,
     the words stay on the paper; nothing is hidden.
     Plate (A1 A): logo, Accent dot rule, then one line: "No. 122 · October
     11, 2026" on the left, "Back to the issue" in Accent on the right
     (two centred lines on phones, M3 A). The issue is the article's newest
     edition (/site?article= article.latest). No issue line when there is
     none. Column 760 on paper (A2 A). No nav label on an article (M4 A).
     The title is found from the article: /site?article=<the page's slug>.

   v1.0.1 · THE ISSUE PAGE (data-kind="issue")
     The Issue template keeps its Webflow content: the new web page (the
     Embed bound to Web Render HTML) and the old layout, one of them shown
     by the NEWSLETTER uses-legacy switch (conditional visibility). The page
     code names three things, so no Webflow class is typed in this file:
       data-content  the element that holds both (moved into the paper)
       data-web      what marks the new web page inside it
       data-legacy   the old layout inside it
     The shell moves data-content into its paper at once (no waiting for
     the Worker) and looks at what Webflow left showing:
       new web page  no shell plate (the issue's own nameplate is the
                     plate), no paper card;
       old layout    the standard plate: logo, dot rule, "No. 122", date;
       neither       a plain message, and the reason in the console.
     The title is found from the issue: /site?issue=<the page's slug>.
     If the switch and what Webflow shows disagree, the console says so.
     A hosted page keeps its own styles (ix-shell-v1_0_2.css).

   WHAT IT DRAWS (into <div id="ix-root">, the only element on the page)
     Nav (N1 A)        one centred row; the current page in Accent.
     Phone nav (N2 A)  ☰ Menu on the left, the current page on the right;
                       the menu opens as a full-width panel under the bar,
                       page behind dimmed, tap outside closes.
     Plate             logo on Main, Accent dot rule, page name, short line.
     Paper             the page's own content, drawn by its page script.
     Footer (FT B)     logo + description; page links; the publisher with
                       photo, phone, email and "Advertise with us" (opens
                       Contact with Advertising chosen); © line, Powered by.
     Contact (C1, C2)  one column, publisher strip on top; Turnstile;
                       honest Sent and Didn't send states.
     Sign in (SI)      email + password through Memberstack; no title or
                       publisher name. After sign in Memberstack's own
                       redirect for the member is followed; with none, the
                       page reloads where it was. Signed in, the nav item
                       reads Log out.
     Loading (L1 A)    nav and plate at once, Accent progress bar and grey
                       lines on paper until the content arrives.

   THE PAGE (body custom code, before this script)
     <div id="ix-page" hidden data-kind="archives"></div>
     data-kind  archives | directory | home | issue | article
     data-title optional; the page's own last path part when absent.
     Home (data-kind="home") sends the reader on to the current issue.

   PAGE SCRIPTS
     IXShell.page(kind, function (paper, site) { ...; return promise; })
     The shell shows its loader until the promise settles; a rejected
     promise shows a plain message in the paper. IXShell.worker is the
     data Worker's address.

   EVERY VALUE COMES FROM /site (TITLES, TITLES-ADMIN, PUBLISHERS, the
   platform nav). Nothing is typed per title. Missing values are named in
   the browser console ([ix-shell]) and left out, never made up.
   A copy of the /site answer is kept in the browser (localStorage) so a
   return visit draws at once; it is refreshed on every visit. Home never
   uses the copy.

   HARDCODING (provisional, Code-Built Site S2)
     HC-P-CB-2  the Worker address (WORKER).
     HC-P-CB-3  the 991px phone break (PHONE, matches the CSS).
     HC-P-CB-9  the words on the shell (WORDS) and the page names (PAGES).
     HC-P-CB-12 Turnstile's script address; the Contact purposes (WORDS.purposes).
*/
(function () {
  'use strict';
  if (window.IXShell) return;

  var VERSION = '1.0.12';
  var REVEAL_MS = 6000;   // HC-P-CBS7-1 · v1.0.12: longest the article words stay hidden (matches the CSS 6s)
  var WORKER = 'https://ix-issue-data.jeff-2cd.workers.dev';                    // HC-P-CB-2
  var PHONE = 991;                                                               // HC-P-CB-3
  var TURNSTILE = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';   // HC-P-CB-12
  var STORE = 'ixs-site:';
  var LOGO = 'ixs-logo:';   // v1.0.8: the title's logo and name, keyed by title slug
  var WORDS = {                                                                  // HC-P-CB-9
    menu: 'Menu',
    closeMenu: 'Close menu',
    close: 'Close',
    logout: 'Log out',
    newsletter: 'The newsletter',
    publisher: 'Publisher',
    advertise: 'Advertise with us',
    rights: function (year, title, pub) { return '\u00a9 ' + year + ' ' + title + (pub ? ' \u00b7 ' + pub : ''); },
    powered: 'Powered by INBXIFY',
    poweredHref: 'https://inbxify.com',
    failed: 'This page could not load. Please refresh in a moment.',
    contact: {
      title: 'Get in touch', name: 'Name', email: 'Email', phone: 'Phone', company: 'Company',
      namePh: 'Your full name', emailPh: 'you@example.com', phonePh: '(201) 555-0123', companyPh: 'Optional',
      about: 'What can we help with?', comments: 'Comments', commentsPh: 'Tell us a little more',
      send: 'Send', sending: 'Sending', again: 'Try again',
      needName: 'Please give your name.', needEmail: 'Please give a working email address.', needMsg: 'Please write a message.',
      waitCheck: 'One moment: the bot check is still running. Press Send again in a few seconds.',
      sentH: 'Thanks, it\u2019s on its way.',
      sentP: function (who, email) { return (who || 'The publisher') + ' will reply to ' + email + ', usually within a day.'; },
      failH: 'That didn\u2019t send.',
      failP: 'Nothing reached us. What you typed is still here. Try again, or email ',
      checkH: 'Check the form.'
    },
    purposes: ['Advertising', 'Story idea', 'General question', 'Other'],        // HC-P-CB-12
    advertising: 'Advertising',
    signin: {
      title: 'Sign in', email: 'Email', password: 'Password', go: 'Sign in', going: 'Signing in',
      forgot: 'Forgot your password?', show: 'Show password', hide: 'Hide password',
      noMs: 'Sign in is not available right now. Please try again in a moment.',
      bad: 'That email and password did not match. Please try again.',
      failH: 'Sign in didn\u2019t work.'
    }
  };
  var PAGES = {                                                                  // HC-P-CB-9
    archives: { name: 'Archives', sub: 'Every issue of {name}', wait: 'Loading the archive' },
    directory: { name: 'Local Business Directory', sub: 'Local businesses \u00b7 {name}', wait: 'Loading the directory' },   // v1.0.4
    home: { name: 'Current issue', sub: '{name}', wait: 'Opening the current issue',
            none: 'The current issue is not online yet.' },
    issue: { name: 'No. {no}', sub: '{date}', wait: 'Opening the issue',
             none: 'This issue\u2019s web page is not ready yet.' },      // v1.0.1
    article: { name: '', date: '{date}', back: 'Back to the issue', wait: 'Opening the article',   // v1.0.12 wait   // v1.0.3: no issue number; arrow drawn
               none: 'This article could not be found on the page.' },    // v1.0.2
    franchise: { name: '{franchise}', sub: '{name}', wait: 'Loading the section' }   // v1.0.9
  };

  var doc = document, root, pageEl, kind, slug, site = null, pages = {}, ran = false;
  var titleKey = '';   // v1.0.9: ?title= on a franchise page
  var nodes = {};
  var hosted = '';   // v1.0.1 issue: 'web' | 'legacy' | 'none'; v1.0.2 article: 'article' | 'none'
  var siteFailed = false;
  var waitTimer = null;   // v1.0.12: article reveal fail-safe   // v1.0.2: /site did not answer (article pages still lay out their words)

  /* ── helpers ── */
  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function safeHref(u) { u = String(u || '').trim(); return /^(https?:|mailto:|tel:|\/)/i.test(u) ? u : ''; }
  function link(cls, href, text) { var h = safeHref(href); var a = el(h ? 'a' : 'span', cls, text); if (h) a.href = h; return a; }
  function btn(cls, text) { var b = el('button', cls, text); b.type = 'button'; return b; }
  function svg(path, vb) {
    var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', vb || '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = path; return s;
  }
  function issueOf() {   // v1.0.2: the issue page's issue, or an article's newest edition
    return (site && (site.issue || (site.article && site.article.latest))) || {};
  }
  function fill(t) {
    var i = issueOf();
    return String(t || '').replace('{name}', (site && site.title && site.title.name) || '')
      .replace('{franchise}', (site && site.franchise && site.franchise.name) || '')   // v1.0.9
      .replace('{no}', i.no || '').replace('{date}', i.date || '');
  }
  /* v1.0.3 · one Back link everywhere: drawn arrow, centred on the letters */
  var ARROW = '<path d="M17 7H2M7 1.5 1.5 7 7 12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  function backLink(href, text, cls) {
    var a = link('ixs-back' + (cls ? ' ' + cls : ''), href, null);
    a.appendChild(svg(ARROW, '0 0 18 14'));
    a.appendChild(el('span', null, text));
    return a;
  }
  function isPhone() { return window.matchMedia('(max-width:' + PHONE + 'px)').matches; }
  function warn(m) { try { console.warn('[ix-shell] ' + m); } catch (e) {} }
  function samePath(href) {
    var a = String(href || '').replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
    var b = location.pathname.replace(/\/+$/, '').toLowerCase();
    return !!a && a === b;
  }
  function lock(on) { doc.documentElement.classList.toggle('ixs-lock', !!on); }

  /* ── colours and fonts from /site ── */
  function applyDesign(d) {
    if (!d) return;
    var s = doc.documentElement.style;
    var map = { main: '--ix-t-main', accent: '--ix-t-accent', highlight: '--ix-t-highlight', paper: '--ix-t-paper',
                text: '--ix-t-text', accent2: '--ix-t-accent2', footer: '--ix-t-footer' };
    Object.keys(map).forEach(function (k) { if (d[k]) s.setProperty(map[k], d[k]); });
    var fam = function (f, fb) { return f ? "'" + f + "', " + fb : fb; };
    root.style.setProperty('--ixs-ui', fam(d.fontUi, "'Avenir Next', Avenir, 'Segoe UI', Arial, sans-serif"));
    root.style.setProperty('--ixs-display', fam(d.fontDisplay, "Georgia, 'Times New Roman', serif"));
    root.style.setProperty('--ixs-body', fam(d.fontBody, "Georgia, 'Times New Roman', serif"));
    root.style.setProperty('--ixs-head', fam(d.fontHeader || d.fontUi, "'Avenir Next', Avenir, 'Segoe UI', Arial, sans-serif"));   // v1.0.3: Page Header Font, else UI
    var list = [d.fontDisplay, d.fontBody, d.fontUi, d.fontHeader].filter(Boolean)
      .filter(function (f, i, a) { return a.indexOf(f) === i; })
      .map(function (f) { return f.replace(/ /g, '+') + ':400,500,600,700'; });
    if (list.length && !doc.getElementById('ixs-fonts')) {
      var l = el('link'); l.id = 'ixs-fonts'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css?family=' + list.join('|') + '&display=swap';
      doc.head.appendChild(l);
    }
  }

  /* ── nav ── */
  function drawNav() {
    var nav = nodes.nav;
    nav.textContent = '';
    nav.classList.remove('ixs-open');
    var row = el('nav', 'ixs-row'); row.setAttribute('aria-label', 'Main');
    var bar = el('div', 'ixs-bar');
    var mbtn = btn('ixs-mbtn');
    mbtn.setAttribute('aria-expanded', 'false');
    mbtn.appendChild(svg('<path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'));
    mbtn.appendChild(doc.createTextNode(WORDS.menu));
    var here = el('span', 'ixs-pc-name');
    bar.appendChild(mbtn); bar.appendChild(here);
    var menu = el('div', 'ixs-menu'); menu.id = 'ixs-menu'; mbtn.setAttribute('aria-controls', 'ixs-menu');
    var dim = el('div', 'ixs-dim'); dim.setAttribute('aria-hidden', 'true');
    nav.appendChild(row); nav.appendChild(bar); nav.appendChild(menu); nav.appendChild(dim);

    var items = (site && site.nav) || [];
    var hereLabel = '';
    items.forEach(function (it) {
      var isHere = it.href && samePath(it.href);
      if (isHere) hereLabel = it.label;
      [row, menu].forEach(function (host) {
        var cls = host === row ? 'ixs-it' : 'ixs-mi';
        var node;
        if (it.href) { node = link(cls, it.href, it.label); if (isHere) node.setAttribute('aria-current', 'page'); }
        else { node = btn(cls, it.label); node.setAttribute('data-ixs-action', it.action); }
        if (isHere) node.classList.add('ixs-here');
        host.appendChild(node);
      });
    });
    here.textContent = hereLabel || (site && PAGES[kind] ? fill(PAGES[kind].name) : '');

    signinState();
  }

  /* Nav events: attached once; the nav's contents are redrawn freely. */
  function menuOpen(on) {
    var nav = nodes.nav, b = nav.querySelector('.ixs-mbtn');
    nav.classList.toggle('ixs-open', !!on);
    if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false');
  }
  function wireNav() {
    var nav = nodes.nav;
    nav.addEventListener('click', function (e) {
      if (e.target.closest('.ixs-mbtn')) { menuOpen(!nav.classList.contains('ixs-open')); return; }
      if (e.target.closest('.ixs-dim')) { menuOpen(false); return; }
      var a = e.target.closest('[data-ixs-action]');
      if (a) { e.preventDefault(); menuOpen(false); act(a.getAttribute('data-ixs-action')); return; }
      if (e.target.closest('.ixs-menu a')) menuOpen(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !nav.classList.contains('ixs-open')) return;
      menuOpen(false);
      var b = nav.querySelector('.ixs-mbtn'); if (b) b.focus();
    });
    window.addEventListener('resize', function () { if (!isPhone()) menuOpen(false); });
  }

  /* ── click feedback (v1.0.5) ──
     Any shell link that leaves this page: nav row, phone menu, footer,
     logo, Back links. Skipped for modified clicks (new tab), other
     targets, mailto/tel, and links to the page we are already on. */
  var GO_MS = 8000;                                                              // HC-P-CB-25
  var goTimer = null, goLink = null;
  function going(a) {
    goDone();
    goLink = a;
    a.classList.add('ixs-going');
    var ring = el('span', 'ixs-ring'); ring.setAttribute('aria-hidden', 'true');
    a.appendChild(ring);
    nodes.nav.classList.add('ixs-nav--busy');
    var pn = nodes.nav.querySelector('.ixs-pc-name');
    if (pn && isPhone()) {   // phone: the bar names where we are going and carries the ring (the menu has closed)
      pn.setAttribute('data-was', pn.textContent); pn.textContent = a.textContent;
      var r2 = el('span', 'ixs-ring'); r2.setAttribute('aria-hidden', 'true'); pn.appendChild(r2);
    }
    goTimer = setTimeout(goDone, GO_MS);
  }
  function goDone() {
    if (goTimer) { clearTimeout(goTimer); goTimer = null; }
    if (goLink) {
      goLink.classList.remove('ixs-going');
      var r = goLink.querySelector('.ixs-ring'); if (r) r.remove();
      goLink = null;
    }
    nodes.nav.classList.remove('ixs-nav--busy');
    var pn = nodes.nav.querySelector('.ixs-pc-name');
    if (pn && pn.hasAttribute('data-was')) { pn.textContent = pn.getAttribute('data-was'); pn.removeAttribute('data-was'); }   // also drops its ring
  }
  function wireGoing() {
    root.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest('a[href]');
      if (!a || !root.contains(a)) return;
      if (!a.closest('.ixs-nav, .ixs-foot, .ixs-plate, .ixs-band, .ixs-back, .ixs-logo')) return;
      if (a.target && a.target !== '_self') return;
      var h = a.getAttribute('href') || '';
      if (/^(mailto:|tel:|#)/i.test(h) || samePath(h)) return;
      going(a);
    });
    window.addEventListener('pageshow', goDone);
    window.addEventListener('pagehide', goDone);
  }

  function act(action, opts) {
    if (action === 'contact') openContact(opts || {});
    else if (action === 'signin') openSignin();
    else if (action === 'logout') logout();
  }

  /* ── plate ── */
  function earlyTitle() {   // v1.0.7: what the page itself knows before /site answers
    var g = function (a) { return ((pageEl && pageEl.getAttribute(a)) || '').trim(); };
    var t = { logo: g('data-logo'), name: g('data-name') };
    if (!t.logo && !t.name && kind !== 'issue' && kind !== 'article') {   // v1.0.8: the remembered logo (Archives)
      var lk = kind === 'franchise' ? titleKey : slug;   // v1.0.9: a franchise page's title is on the address
      if (lk) { try { var r = JSON.parse(localStorage.getItem(LOGO + lk) || 'null'); if (r && r.logo) t = r; } catch (e) {} }
    }
    return t;
  }
  function rememberLogo(s) {   // v1.0.8: keep the title's logo for pages the CMS cannot bind it on
    var t = s && s.title; if (!t || !t.slug || !safeHref(t.logo)) return;
    try { localStorage.setItem(LOGO + String(t.slug).toLowerCase(), JSON.stringify({ logo: t.logo, name: t.name || '' })); } catch (e) {}
  }
  function logoNode(cls) {
    var t = (site && site.title) || earlyTitle();
    var href = site && site.current && site.current.url;
    var a = link(cls, href, null);
    if (safeHref(t.logo)) { var i = el('img'); i.src = t.logo; i.alt = t.name || ''; a.appendChild(i); }
    else if (t.name) a.appendChild(el('span', 'ixs-logo-t', t.name));
    return a;
  }
  function drawPlate() {
    var p = nodes.plate, def = PAGES[kind] || {};
    p.textContent = '';
    p.appendChild(logoNode('ixs-logo'));
    var r = el('div', 'ixs-rule'); r.setAttribute('aria-hidden', 'true'); p.appendChild(r);
    var band = el('div', 'ixs-band');   // v1.0.3: the Accent band (Idea C)
    p.appendChild(band);
    if (kind === 'article') { drawArticleBand(band, def); return; }
    if (kind === 'franchise' && site && site.franchise && safeHref(site.franchise.mascot)) { drawMascotBand(band, site.franchise); return; }   // v1.0.11
    if (kind === 'franchise' && site && site.franchise && safeHref(site.franchise.art)) { drawArtBand(band, site.franchise); return; }   // v1.0.10
    band.appendChild(el('h1', 'ixs-name', site ? fill(def.name) : (kind === 'issue' || kind === 'franchise' ? '' : def.name || '')));   // v1.0.10: no "{franchise}" before /site
    band.appendChild(el('div', 'ixs-sub', site ? fill(def.sub) : ''));
  }
  /* v1.0.10 · franchise art band: the art takes the Accent band's slot */
  function drawArtBand(band, f) {
    band.classList.add('ixs-band--art');
    bandColor(band, f);
    var i = el('img', 'ixs-art'); i.src = f.art; i.alt = f.name || ''; i.decoding = 'async';
    band.appendChild(i);
    band.appendChild(el('h1', 'ixs-name ixs-sr', f.name || ''));
  }
  /* v1.0.11 · treatment 3: badge, wordmark, standfirst */
  function drawMascotBand(band, f) {
    band.classList.add('ixs-band--art'); band.classList.add('ixs-band--mascot');
    bandColor(band, f);
    var m = el('img', 'ixs-mascot'); m.src = f.mascot; m.alt = ''; m.decoding = 'async';
    band.appendChild(m);
    var t = el('div', 'ixs-mascot-t'); band.appendChild(t);
    if (safeHref(f.wordmark)) {
      var w = el('img', 'ixs-wordmark'); w.src = f.wordmark; w.alt = f.name || ''; w.decoding = 'async';
      t.appendChild(w);
      t.appendChild(el('h1', 'ixs-name ixs-sr', f.name || ''));
    } else {
      t.appendChild(el('h1', 'ixs-name ixs-name--mascot', f.name || ''));
    }
    if (f.description) t.appendChild(el('p', 'ixs-stand', f.description));
  }
  /* the band takes the art's own colour when the franchise names one (HC-P-CB-38);
     a dark colour turns the band's text light */
  function bandColor(band, f) {
    var c = String(f.bandColor || '').trim();
    if (!/^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\)|[a-z]{3,20})$/i.test(c)) return;
    band.style.setProperty('--ixs-band-bg', c);
    var h = c.charAt(0) === '#' ? c.slice(1) : '';
    if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join('');
    if (h.length >= 6) {
      var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
      if ((r * 299 + g * 587 + b * 114) / 1000 < 128) band.classList.add('ixs-band--dark');
    }
  }

  /* v1.0.3 · article band: the way back on the left, the issue's date on the right */
  function drawArticleBand(band, def) {
    band.classList.add('ixs-band--split');
    var i = issueOf();
    if (!site) return;
    if (safeHref(i.url)) band.appendChild(backLink(i.url, def.back, 'ixs-bt'));
    else band.classList.add('ixs-band--one');
    if (i.date) band.appendChild(el('span', 'ixs-bt ixs-bdate', fill(def.date)));
  }

  /* ── loading ── */
  function drawWait() {
    var w = el('div', 'ixs-wait'); w.setAttribute('role', 'status');
    w.appendChild(el('span', 'ixs-wait-bar'));
    w.appendChild(el('span', 'ixs-wait-t', (PAGES[kind] && PAGES[kind].wait) || ''));
    [60, 44, 52].forEach(function (pc) { var s = el('div', 'ixs-sk'); s.style.width = pc + '%'; w.appendChild(s); });
    nodes.paper.textContent = '';
    nodes.paper.appendChild(w);
  }
  function message(text, linkHref, linkText) {
    nodes.paper.textContent = '';
    var m = el('p', 'ixs-msg', text);
    if (safeHref(linkHref) && linkText) { m.appendChild(doc.createTextNode(' ')); m.appendChild(link('', linkHref, linkText)); }
    nodes.paper.appendChild(m);
  }

  /* ── footer ── */
  function drawFooter() {
    var f = nodes.foot, t = site.title || {}, p = site.publisher || {};
    f.textContent = '';
    var g = el('div', 'ixs-fgrid');
    var c1 = el('div');
    c1.appendChild(logoNode('ixs-flogo'));
    if (t.description) c1.appendChild(el('p', 'ixs-about', t.description));
    var c2 = el('div');
    c2.appendChild(el('p', 'ixs-fh', WORDS.newsletter));
    var lk = el('div', 'ixs-flinks');
    (site.nav || []).forEach(function (it) {
      if (it.action === 'signin') return;
      if (it.href) lk.appendChild(link('', it.href, it.label));
      else { var b = btn('', it.label); b.setAttribute('data-ixs-action', it.action); lk.appendChild(b); }
    });
    c2.appendChild(lk);
    var c3 = el('div');
    c3.appendChild(el('p', 'ixs-fh', WORDS.publisher));
    var pc = el('div', 'ixs-pc');
    if (safeHref(p.photo)) { var av = el('img', 'ixs-av'); av.src = p.photo; av.alt = p.person || ''; av.loading = 'lazy'; pc.appendChild(av); }
    var who = el('div');
    if (p.person) who.appendChild(el('div', 'ixs-pn', p.person));
    var pr = el('div', 'ixs-pr');
    if (p.name) { pr.appendChild(doc.createTextNode(p.name)); pr.appendChild(el('br')); }
    if (p.phone) pr.appendChild(link('', 'tel:' + p.phone.replace(/[^\d+]/g, ''), p.phone));
    if (p.phone && p.email) pr.appendChild(doc.createTextNode(' \u00b7 '));
    if (p.email) pr.appendChild(link('', 'mailto:' + p.email, p.email));
    who.appendChild(pr); pc.appendChild(who); c3.appendChild(pc);
    var cta = btn('ixs-cta', WORDS.advertise); cta.setAttribute('data-ixs-adv', '1'); c3.appendChild(cta);
    g.appendChild(c1); g.appendChild(c2); g.appendChild(c3);
    f.appendChild(g);
    var base = el('div', 'ixs-base');
    base.appendChild(el('span', null, WORDS.rights(new Date().getFullYear(), t.name || '', p.name || '')));
    var pw = link('', WORDS.poweredHref, WORDS.powered); pw.target = '_blank'; pw.rel = 'noopener';
    base.appendChild(pw);
    f.appendChild(base);
    f.onclick = function (e) {
      if (e.target.closest('[data-ixs-adv]')) { openContact({ purpose: WORDS.advertising }); return; }
      var a = e.target.closest('[data-ixs-action]');
      if (a) { e.preventDefault(); act(a.getAttribute('data-ixs-action')); }
    };
  }

  /* ── modals ── */
  var openModalEl = null, lastFocus = null;
  function modal(titleText, subText) {
    closeModal();
    lastFocus = doc.activeElement;
    var scrim = el('div', 'ixs-scrim');
    var m = el('div', 'ixs-modal');
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
    var head = el('div', 'ixs-mh');
    var h = el('h2', 'ixs-mt', titleText); h.id = 'ixs-mt-' + Date.now(); m.setAttribute('aria-labelledby', h.id);
    head.appendChild(h);
    if (subText) head.appendChild(el('div', 'ixs-ms', subText));
    var x = btn('ixs-x', '\u00d7'); x.setAttribute('aria-label', WORDS.close);
    x.addEventListener('click', closeModal);
    head.appendChild(x);
    var body = el('div', 'ixs-mb');
    m.appendChild(head); m.appendChild(body); scrim.appendChild(m);
    scrim.addEventListener('mousedown', function (e) { if (e.target === scrim) closeModal(); });
    root.appendChild(scrim);
    openModalEl = scrim; lock(true);
    return body;
  }
  function closeModal() {
    if (!openModalEl) return;
    if (openModalEl._onClose) openModalEl._onClose();
    openModalEl.parentNode && openModalEl.parentNode.removeChild(openModalEl);
    openModalEl = null; lock(false);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  }
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && openModalEl) closeModal(); });

  function field(host, label, input, req) {
    var w = el('div', 'ixs-f');
    var l = el('label', 'ixs-fl', label + (req ? ' *' : ''));
    input.id = 'ixs-' + Math.random().toString(36).slice(2, 9); l.htmlFor = input.id;
    w.appendChild(l); w.appendChild(input);
    var err = el('span', 'ixs-ferr'); err.hidden = true; w.appendChild(err);
    input._err = err;
    host.appendChild(w);
    return input;
  }
  function input(type, ph, auto) { var i = el('input', 'ixs-in'); i.type = type; if (ph) i.placeholder = ph; if (auto) i.autocomplete = auto; return i; }
  function setErr(i, msg) { i.classList.toggle('ixs-err', !!msg); i._err.textContent = msg || ''; i._err.hidden = !msg; }
  function busy(b, on, word) {
    b.disabled = !!on; b.classList.toggle('ixs-busy', !!on);
    if (on) { b.textContent = word; var d = el('span', 'ixs-dots'); d.innerHTML = '<i></i><i></i><i></i>'; b.appendChild(d); }
  }

  /* Contact (C1 A, C2 A) */
  var tsLoad = null;
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (tsLoad) return tsLoad;
    tsLoad = new Promise(function (res, rej) {
      var s = el('script'); s.src = TURNSTILE; s.async = true;
      s.onload = function () { window.turnstile ? res(window.turnstile) : rej(new Error('Turnstile did not start')); };
      s.onerror = function () { tsLoad = null; rej(new Error('Turnstile did not load')); };
      doc.head.appendChild(s);
    });
    return tsLoad;
  }
  function pubStrip(host) {
    var p = (site && site.publisher) || {}, role = (site && site.design && site.design.signoffRole) || '';
    if (!p.person && !p.phone && !p.email) return;
    var s = el('div', 'ixs-strip');
    if (safeHref(p.photo)) { var av = el('img', 'ixs-av'); av.src = p.photo; av.alt = ''; s.appendChild(av); }
    var t = el('div');
    t.appendChild(el('b', null, (p.person || p.name || '') + (p.person && role ? ', ' + role : '')));
    t.appendChild(el('span', null, [p.phone, p.email].filter(Boolean).join(' \u00b7 ')));
    s.appendChild(t); host.appendChild(s);
  }
  function openContact(opts) {
    if (!site) return;
    var W = WORDS.contact, P = site.publisher || {};
    var body = modal(W.title, (site.title && site.title.name) || '');
    var opened = Date.now(), token = null, widget = null;
    pubStrip(body);
    var form = el('div');
    var note = el('div', 'ixs-note'); note.hidden = true; form.appendChild(note);
    var r1 = el('div', 'ixs-two'), r2 = el('div', 'ixs-two');
    var fName = field(r1, W.name, input('text', W.namePh, 'name'), true);
    var fEmail = field(r1, W.email, input('email', W.emailPh, 'email'), true);
    var fPhone = field(r2, W.phone, input('tel', W.phonePh, 'tel'));
    var fCo = field(r2, W.company, input('text', W.companyPh, 'organization'));
    form.appendChild(r1); form.appendChild(r2);
    form.appendChild(el('span', 'ixs-fl', W.about));
    var chips = el('div', 'ixs-chips'); chips.setAttribute('role', 'radiogroup'); chips.setAttribute('aria-label', W.about);
    var purpose = opts.purpose || '';
    WORDS.purposes.forEach(function (p) {
      var c = btn('ixs-chip', p); c.setAttribute('role', 'radio'); c.setAttribute('aria-checked', p === purpose ? 'true' : 'false');
      c.addEventListener('click', function () {
        purpose = purpose === p ? '' : p;
        Array.prototype.forEach.call(chips.children, function (x) { x.setAttribute('aria-checked', x.textContent === purpose ? 'true' : 'false'); });
      });
      chips.appendChild(c);
    });
    form.appendChild(chips);
    var ta = el('textarea', 'ixs-in'); ta.placeholder = W.commentsPh;
    var fMsg = field(form, W.comments, ta, true);
    var hp = input('text', '', 'off'); hp.tabIndex = -1; hp.name = 'website';
    var hpw = el('div', 'ixs-hp'); hpw.setAttribute('aria-hidden', 'true'); hpw.appendChild(hp); form.appendChild(hpw);
    var ts = el('div', 'ixs-ts'); form.appendChild(ts);
    var go = btn('ixs-go', W.send); form.appendChild(go);
    body.appendChild(form);
    setTimeout(function () { try { fName.focus({ preventScroll: true }); } catch (e) {} }, 30);

    var siteKey = site.form && site.form.siteKey;
    if (!siteKey) warn('No Turnstile site key in /site (TURNSTILE_SITE_KEY on the Worker). Contact cannot send.');
    else loadTurnstile().then(function (T) {
      if (!ts.isConnected) return;
      widget = T.render(ts, { sitekey: siteKey, appearance: 'interaction-only',
        callback: function (t) { token = t; }, 'expired-callback': function () { token = null; },
        'error-callback': function () { token = null; } });
    }).catch(function (e) { warn(e.message); });
    openModalEl._onClose = function () { if (widget != null && window.turnstile) { try { window.turnstile.remove(widget); } catch (e) {} } };

    function showNote(h, text, mail) {
      note.textContent = '';
      note.appendChild(el('b', null, h));
      var p = el('p', null, text);
      if (mail) { p.appendChild(link('', 'mailto:' + mail, mail)); p.appendChild(doc.createTextNode('.')); }
      note.appendChild(p); note.hidden = false;
    }
    go.addEventListener('click', function () {
      note.hidden = true;
      var name = fName.value.trim(), email = fEmail.value.trim(), msg = fMsg.value.trim();
      setErr(fName, name ? '' : W.needName);
      setErr(fEmail, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? '' : W.needEmail);
      setErr(fMsg, msg ? '' : W.needMsg);
      if (!name || fEmail.classList.contains('ixs-err') || !msg) return;
      if (!token) { showNote(W.checkH, W.waitCheck); return; }
      busy(go, true, W.sending);
      var payload = { kind: 'contact', title: (site.title && site.title.slug) || slug, name: name, email: email,
        phone: fPhone.value.trim(), company: fCo.value.trim(), purpose: purpose, message: msg,
        website: hp.value, elapsed: Date.now() - opened, token: token, page: location.href };
      fetch(WORKER + '/form', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload), credentials: 'omit' })
        .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'HTTP ' + r.status }; }); })
        .then(function (j) {
          if (j && j.ok && j.id) {
            body.textContent = '';
            var d = el('div', 'ixs-done'); d.setAttribute('role', 'status');
            d.appendChild(el('b', null, W.sentH));
            d.appendChild(el('p', null, W.sentP(j.to || P.person, email)));
            body.appendChild(d);
            return;
          }
          throw new Error((j && j.error) || 'No answer');
        })
        .catch(function (e) {
          warn('Contact did not send: ' + (e && e.message));
          busy(go, false); go.textContent = W.again;
          showNote(W.failH, W.failP, P.email || '');
          token = null;
          if (widget != null && window.turnstile) { try { window.turnstile.reset(widget); } catch (x) {} }
        });
    });
  }

  /* Sign in (SI A) through Memberstack */
  function ms() { return window.$memberstackDom || null; }
  function whenMs(cb) {
    var n = 0;
    (function poll() { if (ms()) return cb(ms()); if (++n > 50) return cb(null); setTimeout(poll, 100); })();
  }
  function signinState() {
    whenMs(function (M) {
      if (!M || !M.getCurrentMember) return;
      M.getCurrentMember().then(function (res) {
        if (!res || !res.data) return;
        root.querySelectorAll('[data-ixs-action="signin"]').forEach(function (b) {
          b.textContent = WORDS.logout; b.setAttribute('data-ixs-action', 'logout');
        });
      }).catch(function () {});
    });
  }
  function logout() {
    var M = ms(); if (!M) return;
    M.logout().then(function () { location.reload(); }).catch(function () { location.reload(); });
  }
  function openSignin() {
    var W = WORDS.signin;
    var body = modal(W.title, '');
    var note = el('div', 'ixs-note'); note.hidden = true; body.appendChild(note);
    var fE = field(body, W.email, input('email', 'you@example.com', 'email'));
    var pw = el('div', 'ixs-pw');
    var fP = input('password', '', 'current-password');
    pw.appendChild(fP);
    var eye = btn('ixs-eye'); eye.setAttribute('aria-label', W.show);
    var eyeOpen = '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/>';
    var eyeShut = eyeOpen + '<path d="M4 4l16 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
    eye.appendChild(svg(eyeOpen));
    eye.addEventListener('click', function () {
      var show = fP.type === 'password'; fP.type = show ? 'text' : 'password';
      eye.textContent = ''; eye.appendChild(svg(show ? eyeShut : eyeOpen));
      eye.setAttribute('aria-label', show ? W.hide : W.show);
    });
    pw.appendChild(eye);
    field(body, W.password, pw);
    fP.id = pw.id; pw.removeAttribute('id');
    var go = btn('ixs-go', W.go); body.appendChild(go);
    var fine = el('div', 'ixs-fine'); var fg = btn('', W.forgot); fine.appendChild(fg); body.appendChild(fine);
    setTimeout(function () { try { fE.focus({ preventScroll: true }); } catch (e) {} }, 30);
    function fail(text) { note.textContent = ''; note.appendChild(el('b', null, W.failH)); note.appendChild(el('p', null, text)); note.hidden = false; }
    fg.addEventListener('click', function () {
      var M = ms(); if (!M || !M.openModal) { fail(W.noMs); return; }
      closeModal(); M.openModal('FORGOT_PASSWORD');
    });
    function submit() {
      note.hidden = true;
      var M = ms(); if (!M || !M.loginMemberEmailPassword) { fail(W.noMs); return; }
      busy(go, true, W.going);
      M.loginMemberEmailPassword({ email: fE.value.trim(), password: fP.value })
        .then(function (res) {
          var d = (res && res.data) || {};
          var to = safeHref(d.redirect || (d.member && d.member.loginRedirect) || '');
          if (to && to !== '/' && !samePath(to)) location.href = to; else location.reload();
        })
        .catch(function (e) { busy(go, false); go.textContent = W.go; fail((e && e.message) || W.bad); });
    }
    go.addEventListener('click', submit);
    [fE, fP].forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); }); });
  }

  /* ── issue page: host the Webflow content (v1.0.1) ── */
  function shown(n) { return !!n && !n.closest('.w-condition-invisible'); }
  function hostIssue() {
    var get = function (a) { return ((pageEl && pageEl.getAttribute(a)) || '').trim(); };
    var sel = { content: get('data-content'), web: get('data-web'), legacy: get('data-legacy') };
    var missing = Object.keys(sel).filter(function (k) { return !sel[k]; });
    var box = null;
    if (missing.length) warn('#ix-page needs data-' + missing.join(', data-') + ' on the Issue page.');
    else { try { box = doc.querySelector(sel.content); } catch (e) { warn('data-content is not a valid selector.'); } }
    if (!box) {
      if (!missing.length) warn('Nothing on the page matches data-content "' + sel.content + '".');
      hosted = 'none';
    } else {
      var web = null, old = null;
      try { web = box.querySelector(sel.web); old = box.querySelector(sel.legacy); } catch (e) { warn('data-web or data-legacy is not a valid selector.'); }
      hosted = shown(web) ? 'web' : shown(old) ? 'legacy' : 'none';
    }
    var col = nodes.paper.parentNode;
    col.classList.toggle('ixs-col--bare', hosted === 'web');
    nodes.paper.textContent = '';
    if (hosted === 'none') {
      if (box) warn('Neither the new web page nor the old layout is showing for this issue.');
      message(PAGES.issue.none);
      return;
    }
    box.classList.add('ixs-host');
    nodes.paper.classList.add('ixs-paper--host');
    nodes.paper.appendChild(box);
  }
  /* v1.0.2 · article page: host the server text at once */
  function hostArticle() {
    var sel = ((pageEl && pageEl.getAttribute('data-content')) || '').trim();
    var box = null;
    if (!sel) warn('#ix-page needs data-content on the Article page.');
    else { try { box = doc.querySelector(sel); } catch (e) { warn('data-content is not a valid selector.'); } }
    nodes.paper.parentNode.classList.add('ixs-col--read');
    nodes.paper.textContent = '';
    if (!box) {
      if (sel) warn('Nothing on the page matches data-content "' + sel + '".');
      hosted = 'none';
      message(PAGES.article.none);
      return;
    }
    hosted = 'article';
    box.classList.add('ixs-host');
    nodes.paper.classList.add('ixs-paper--host', 'ixs-paper--article', 'ixs-paper--wait');   // v1.0.12
    var w = el('div', 'ixs-wait ixs-wait--article'); w.setAttribute('role', 'status');      // v1.0.12
    w.appendChild(el('span', 'ixs-wait-bar'));
    w.appendChild(el('span', 'ixs-wait-t', PAGES.article.wait));
    [60, 44, 52].forEach(function (pc) { var s = el('div', 'ixs-sk'); s.style.width = pc + '%'; w.appendChild(s); });
    nodes.paper.appendChild(w);
    nodes.paper.appendChild(box);
    waitTimer = setTimeout(function () { warn('The article took over ' + (REVEAL_MS / 1000) + 's to lay out; showing the words as they are.'); reveal(); }, REVEAL_MS);
  }
  /* v1.0.12 · show the article's words: layout done, /site failed, or the fail-safe */
  function reveal() {
    if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; }
    if (!nodes.paper) return;
    nodes.paper.classList.remove('ixs-paper--wait');
    var w = nodes.paper.querySelector(':scope > .ixs-wait--article');
    if (w) w.parentNode.removeChild(w);
  }
  function checkIssue() {
    var i = site && site.issue;
    if (!i || i.legacy == null || hosted === 'none') return;
    var want = i.legacy ? 'legacy' : 'web';
    if (want !== hosted) warn('NEWSLETTER uses-legacy is ' + (i.legacy ? 'on' : 'off') + ' but the page shows the ' +
      (hosted === 'web' ? 'new web page' : 'old layout') + '. Check the conditional visibility on the Issue template.');
  }

  /* ── /site ── */
  function storeKey() { return STORE + (kind === 'issue' || kind === 'article' ? kind + ':' : kind === 'franchise' ? 'franchise:' + titleKey + ':' : '') + slug; }   // v1.0.2; franchise v1.0.9
  function readStore() { try { var v = localStorage.getItem(storeKey()); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function writeStore(v) { try { localStorage.setItem(storeKey(), JSON.stringify(v)); } catch (e) {} }
  function fetchSite() {
    var q = (kind === 'issue' ? 'issue=' : kind === 'article' ? 'article=' : kind === 'franchise' ? 'franchise=' : 'title=') + encodeURIComponent(slug);   // v1.0.1, v1.0.2, v1.0.9
    if (kind === 'franchise' && titleKey) q += '&title=' + encodeURIComponent(titleKey);   // v1.0.9
    return fetch(WORKER + '/site?' + q, { credentials: 'omit' })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (res) {
        if (!res.body || !res.body.ok) throw new Error((res.body && res.body.error) || ('HTTP ' + res.status));
        (res.body.problems || []).forEach(warn);
        return res.body;
      });
  }
  function useSite(s) {
    site = s;
    rememberLogo(s);   // v1.0.8
    applyDesign(s.design);
    drawNav(); drawPlate(); drawFooter();
    if (kind === 'issue') checkIssue();   // v1.0.1
  }

  /* ── running the page ── */
  function runPage() {
    if (ran || (!site && !(kind === 'article' && siteFailed))) return;   // v1.0.2
    if (kind === 'issue') { ran = true; return; }   // v1.0.1: content hosted at start
    if (kind === 'article') {                      // v1.0.2: the page script lays out the hosted text
      if (hosted !== 'article' || !pages.article) return;
      ran = true;
      var pa;
      try { pa = Promise.resolve(pages.article(nodes.paper, site)); } catch (e) { pa = Promise.reject(e); }
      pa.then(reveal, function (e) { warn('The article layout did not finish (' + (e && e.message) + '). The words stay as they are.'); reveal(); });   // v1.0.12
      return;
    }
    if (kind === 'home') {
      ran = true;
      if (site.current && safeHref(site.current.url)) { location.replace(site.current.url); return; }
      var arch = (site.nav || []).filter(function (n) { return n.href && /archives/i.test(n.href); })[0];
      message(PAGES.home.none, arch && arch.href, arch && arch.label);
      return;
    }
    var fn = pages[kind];
    if (!fn) return;
    ran = true;
    var paper = el('div');
    var p;
    try { p = Promise.resolve(fn(paper, site)); } catch (e) { p = Promise.reject(e); }
    p.then(function () { nodes.paper.textContent = ''; nodes.paper.appendChild(paper); })
     .catch(function (e) { warn('The ' + kind + ' page did not load (' + (e && e.message) + ').'); message(WORDS.failed); });
  }

  function start() {
    doc.documentElement.classList.add('ixs-on');   // v1.0.12: the CSS stops hiding Webflow's markup
    root = doc.getElementById('ix-root');
    if (!root) { root = el('div'); root.id = 'ix-root'; doc.body.insertBefore(root, doc.body.firstChild); }
    pageEl = doc.getElementById('ix-page');
    kind = ((pageEl && pageEl.getAttribute('data-kind')) || '').trim().toLowerCase();
    slug = ((pageEl && pageEl.getAttribute('data-title')) || '').trim().toLowerCase() ||
      (location.pathname.split('/').filter(Boolean).pop() || '').toLowerCase();
    try { titleKey = (new URLSearchParams(location.search).get('title') || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, ''); } catch (e) { titleKey = ''; }   // v1.0.9
    if (!PAGES[kind]) { warn('Unknown or missing data-kind on #ix-page ("' + kind + '").'); }

    root.textContent = '';
    nodes.nav = el('header', 'ixs-nav');
    var main = el('main', 'ixs-main');
    var col = el('div', 'ixs-col');
    nodes.plate = el('div', 'ixs-plate');
    nodes.paper = el('div', 'ixs-paper');
    col.appendChild(nodes.plate); col.appendChild(nodes.paper); main.appendChild(col);
    nodes.foot = el('footer', 'ixs-foot'); nodes.foot.hidden = true;
    root.appendChild(nodes.nav); root.appendChild(main); root.appendChild(nodes.foot);
    wireNav();
    wireGoing();                                                               // v1.0.5
    drawPlate();
    if (kind === 'issue') hostIssue(); else if (kind === 'article') hostArticle(); else drawWait();   // v1.0.1, v1.0.2

    var cached = kind === 'home' ? null : readStore();
    if (cached) { useSite(cached); nodes.foot.hidden = false; runPage(); }
    else { drawNav(); }
    fetchSite().then(function (s) {
      writeStore(s);
      useSite(s); nodes.foot.hidden = false;
      runPage();
    }).catch(function (e) {
      warn('/site did not load (' + (e && e.message) + ').');
      if (!site && kind === 'article') { nodes.plate.hidden = true; siteFailed = true; runPage(); if (!ran) reveal(); return; }   // v1.0.12 reveal   // v1.0.2: the words stay, laid out
      if (!site) message(WORDS.failed);
    });
    window.addEventListener('load', function () {
      if (site && !ran && kind !== 'home' && kind !== 'issue' && kind !== 'article' && !pages[kind]) { warn('No page script registered for "' + kind + '".'); message(WORDS.failed); }
    });
  }

  window.IXShell = {
    version: VERSION,
    worker: WORKER,
    page: function (k, fn) { pages[String(k).toLowerCase()] = fn; runPage(); },
    open: function (action, opts) { act(action, opts); },
    back: function (href, text) { return backLink(href, text); },   // v1.0.3: the one Back link
    modal: function (titleText, subText) {                           // v1.0.6: the shell's modal for page scripts
      var body = modal(titleText, subText), scrim = openModalEl;
      return { body: body, close: function () { if (openModalEl === scrim) closeModal(); },
               onClose: function (fn) { scrim._onClose = fn; } };
    }
  };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();
})();
