/* ix-site-chrome-v1_2_2.js
   v1.2.2 = v1.2.1 with the section plate placed inside the painted column.
   The column is the first painted block among the label's following
   siblings, then its ancestors (Archives: .page-content; Directory: the
   hero section). The plate becomes that column's first child and cancels
   the column's own padding, so it is exactly as wide as the column and
   sits on its top edge.

   ix-site-chrome-v1_2_1.js
   v1.2.1 = v1.2.0 + the article plate, Session 2a (27 Oct 2026). Pairs
   with ix-site-chrome-v1_2_1.css. On a page with .inner-wrapper.article
   it builds the plate as the column's first child: the masthead's logo,
   an Accent dot rule, and one line with the masthead's issue words
   (linked to that issue) and "← Back to the issue" (linked from the page's
   own back link). Marks <html> with ixc-art and ixc-row; the phone row
   carries no page name on an article (M4). Words: BACK (HC-P-PF1-4).

   ix-site-chrome-v1_2_0.js
   v1.2.0 = v1.1.1 + the page frame, Session 1 (27 Oct 2026). Pairs with
   ix-site-chrome-v1_2_0.css. The footer code below is unchanged.
   1 · SECTION PLATE (S1). On a page with Webflow's .mh-page-label
       (Archives, Directory), builds .ixc-plate-box at the top of the
       paper column: the masthead's own logo image, an Accent dot rule,
       the page name (the label's words in title case), and a short line
       with the title's name from the data line. The paper column is the
       nearest ancestor of the label with a painted background; the plate
       is sized and placed to its edges and stays in step on resize.
       Marks <html> with ixc-plate only after the plate is in, so the
       stylesheet hides the old band, strip and label only then.
   2 · PHONE ROW (M1, M4). Marks <html> with ixc-row on plated pages and
       MNA issue pages, and sets --ixc-here to the visible current nav
       link's words. Article pages are left alone until Session 2.
   3 · ARCHIVES SWITCHER (M6). Sets the three tab labels to Newsletters,
       Print, Articles (by position, as Webflow orders them).
   4 · DISPLAY FONT. Loads the family named in --ix-t-display from Google
       Fonts, once.
   PLATFORM WORDS (HC-P-PF1-3, HC-P-PF1-4): the three switcher labels and
   the two short lines below (SUB). Move to the labels map with the rest.

   ix-site-chrome-v1_1_1.js
   v1.1.1 = v1.1.0 + the credit's separator and company name are wrapped
   (ixf-sep, ixf-co), so on phones the company can sit on its own line
   instead of breaking mid-name. Nothing else changed.

   INBXIFY · Site Chrome · the footer on every public page (D124, D125).

   WHAT IT DOES
     On a page that carries both Site Chrome lines (the colour line
     #ix-title-vars in the head, and the data line #ix-title-data before
     </body>), it draws one footer:
       brand    title logo + Footer Description          (TITLES)
       Read     the reading links from Webflow's navbar   (page)
       Connect  Subscribe, Contact, Advertise, Sign in    (site pop-ups)
       Follow   social links, only those that are filled  (TITLES)
       credit   "Doug Drohan, Publisher", company, phone, email
                (hidden publisher data + TITLES Publisher Company)
       legal    © year, company, Privacy, Terms
     Webflow's old footer (section.footer) is hidden by the stylesheet,
     only when the data line is present.

   DATA LINE (Page settings → Custom code → Before </body> tag)
     <div id="ix-title-data" hidden
       data-name="[TITLE: Name]"
       data-logo="[TITLE: Title Logo URL]"
       data-desc="[TITLE: Footer Description]"
       data-company="[TITLE: Publisher Company]"
       data-facebook="[TITLE: Facebook]"
       data-instagram="[TITLE: Instagram]"
       data-linkedin="[TITLE: LinkedIn]"
       data-youtube="[TITLE: YouTube]"></div>

   SAFETY
     Text is set with textContent, never as HTML. Links are kept only when
     they start with https:, http:, mailto:, tel: or /. Missing pieces are
     left out rather than shown empty.

   LOAD
     Site settings → Custom code → Footer code:
     <script src="https://cdn.jsdelivr.net/gh/jbrady74/inbxify-site-code@main/ix-site-chrome-v1_1_1.js" defer></script>
*/
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function safeHref(u) {
    u = (u || '').trim();
    return /^(https?:|mailto:|tel:|\/)/i.test(u) ? u : '';
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function link(text, href, cls) {
    var a = el('a', cls, text);
    var h = safeHref(href);
    if (h) a.setAttribute('href', h);
    return a;
  }

  /* Open a site pop-up. body.js exposes these functions; if one is not
     there yet, fall back to clicking the navbar's own link, which body.js
     already handles. */
  function openPopup(kind) {
    var fn = { subscribe: 'openSubscribePopup', contact: 'openContactModal', signin: 'openSigninModal' }[kind];
    if (fn && typeof window[fn] === 'function') { window[fn](); return true; }
    var nav = document.querySelector('.navbar-ibx [data-' + kind + '="true"]');
    if (nav) { nav.click(); return true; }
    return false;
  }

  function actionLink(text, kind, cls) {
    var a = el('a', cls, text);
    a.setAttribute('href', '#');
    a.setAttribute('role', 'button');
    a.addEventListener('click', function (e) {
      e.preventDefault();
      openPopup(kind === 'advertise' ? 'contact' : kind);
      if (kind === 'advertise') {
        /* Pre-select "Advertising" in the Contact form once it is open. */
        setTimeout(function () {
          var r = document.querySelector('#contactModalForm input[name="purpose"][value="Advertising"]');
          if (r) r.checked = true;
        }, 400);
      }
    });
    return a;
  }

  function isVisible(a) {
    if (!a) return false;
    if (a.classList.contains('hide')) return false;
    return getComputedStyle(a).display !== 'none';
  }

  ready(function () {
    if (!document.getElementById('ix-title-vars')) return;
    var data = document.getElementById('ix-title-data');
    if (!data) return;
    if (document.querySelector('footer.ixf')) return;

    var d = data.dataset;
    var pub = document.querySelector('.contact-publisher-data');
    var p = pub ? pub.dataset : {};
    var titleName = (d.name || p.title || '').trim();
    var company = (d.company || '').trim();

    var footer = el('footer', 'ixf');
    footer.setAttribute('role', 'contentinfo');
    var inner = el('div', 'ixf-in');

    /* Brand */
    var brand = el('div', 'ixf-brand');
    var current = document.querySelector('.navbar-ibx-list a.nav-link-25');
    var home = link('', current ? current.getAttribute('href') : '/', 'ixf-logo');
    var logo = safeHref(d.logo);
    if (logo) {
      var img = el('img');
      img.src = logo;
      img.alt = titleName;
      img.loading = 'lazy';
      home.appendChild(img);
    } else {
      home.appendChild(el('span', 'ixf-logo-text', titleName));
    }
    brand.appendChild(home);
    if ((d.desc || '').trim()) brand.appendChild(el('p', 'ixf-desc', d.desc.trim()));
    inner.appendChild(brand);

    /* Read: the navbar's reading links, as shown there */
    var read = el('nav', 'ixf-col');
    read.setAttribute('aria-label', 'Read');
    read.appendChild(el('p', 'ixf-h', 'Read'));
    document.querySelectorAll('.navbar-ibx-list a.nav-link-25').forEach(function (a) {
      if (!isVisible(a)) return;
      var t = a.textContent.trim().toLowerCase().replace(/^\w/, function (c) { return c.toUpperCase(); });
      read.appendChild(link(t, a.getAttribute('href')));
    });
    inner.appendChild(read);

    /* Connect */
    var conn = el('div', 'ixf-col');
    conn.appendChild(el('p', 'ixf-h', 'Connect'));
    conn.appendChild(actionLink('Subscribe free', 'subscribe', 'ixf-sub'));
    conn.appendChild(actionLink('Contact us', 'contact'));
    conn.appendChild(actionLink('Advertise with us', 'advertise'));
    var signin = document.querySelector('.navbar-ibx [data-signin="true"]');
    if (isVisible(signin)) conn.appendChild(actionLink('Sign in', 'signin'));
    inner.appendChild(conn);

    /* Follow: only filled links */
    var socials = [
      ['facebook', 'Facebook', 'f'], ['instagram', 'Instagram', 'ig'],
      ['linkedin', 'LinkedIn', 'in'], ['youtube', 'YouTube', 'yt']
    ].filter(function (s) { return safeHref(d[s[0]]); });
    if (socials.length) {
      var fol = el('div', 'ixf-col');
      fol.appendChild(el('p', 'ixf-h', 'Follow'));
      var row = el('div', 'ixf-soc');
      socials.forEach(function (s) {
        var a = link(s[2], d[s[0]]);
        a.setAttribute('aria-label', s[1]);
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        row.appendChild(a);
      });
      fol.appendChild(row);
      inner.appendChild(fol);
    } else {
      inner.classList.add('ixf-in--nofollow');
    }
    footer.appendChild(inner);

    /* Publisher credit */
    var who = (p.name || p.publisher || '').trim();
    if (who || company || p.phone || p.email) {
      var cred = el('div', 'ixf-pub');
      var lead = el('p', 'ixf-pub-who');
      if (who) lead.appendChild(el('b', null, who));
      if (who && company) lead.appendChild(el('span', 'ixf-sep', ' · '));
      if (company) lead.appendChild(el('span', 'ixf-co', company));
      cred.appendChild(lead);
      var reach = el('p', 'ixf-pub-reach');
      if (p.phone) reach.appendChild(link(p.phone, 'tel:' + p.phone.replace(/[^\d+]/g, '')));
      if (p.phone && p.email) reach.appendChild(document.createTextNode(' · '));
      if (p.email) reach.appendChild(link(p.email, 'mailto:' + p.email));
      if (reach.childNodes.length) cred.appendChild(reach);
      footer.appendChild(cred);
    }

    /* Legal */
    var base = el('div', 'ixf-base');
    base.appendChild(el('span', null, '© ' + new Date().getFullYear() + ' ' + (company || titleName) + '. All rights reserved.'));
    var legal = el('span', 'ixf-legal');
    legal.appendChild(link('Privacy', '/privacy'));
    legal.appendChild(link('Terms', '/terms'));
    base.appendChild(legal);
    footer.appendChild(base);

    /* Place it where Webflow's footer was, or at the end of the page. */
    var anchor = document.querySelector('section.footer') || document.querySelector('.contact-publisher-data');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(footer, anchor);
    else document.body.appendChild(footer);
  });
})();


/* ═══════════ v1.2.0 · page frame, Session 1 ═══════════════════════ */
(function () {
  'use strict';
  var ROOT = document.documentElement;
  var SUB = {
    archives: 'Every issue of {name}',
    directory: 'Local businesses · {name}'
  };
  var SWITCH = ['Newsletters', 'Print', 'Articles'];
  var BACK = '\u2190 Back to the issue';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  function titleCase(t) {
    return (t || '').trim().toLowerCase().replace(/(^|[\s\-\/])(\S)/g, function (m, a, b) { return a + b.toUpperCase(); });
  }
  function painted(el) {
    var c = getComputedStyle(el).backgroundColor;
    return c && c !== 'transparent' && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(c);
  }
  function cssVar(name) {
    return (getComputedStyle(ROOT).getPropertyValue(name) || '').trim().replace(/^["']|["']$/g, '');
  }

  function loadDisplayFont() {
    var fam = cssVar('--ix-t-display');
    if (!fam || document.getElementById('ixc-display-font')) return;
    var l = document.createElement('link');
    l.id = 'ixc-display-font';
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(fam).replace(/%20/g, '+') + ':wght@500;600;700&display=swap';
    document.head.appendChild(l);
  }

  function hereWords() {
    var links = document.querySelectorAll('.navbar-ibx-list a.nav-link-25.w--current');
    for (var i = 0; i < links.length; i++) {
      if (links[i].offsetParent !== null || !links[i].classList.contains('hide')) {
        if (!links[i].classList.contains('hide')) return links[i].textContent.trim();
      }
    }
    return '';
  }

  function buildPlate() {
    var label = document.querySelector('.mh-page-label');
    if (!label) return false;
    function visible(el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none'; }
    var col = null, sib = label.nextElementSibling;
    while (sib && !col) { if (visible(sib) && painted(sib)) col = sib; sib = sib.nextElementSibling; }
    if (!col) { var up = label.parentElement; while (up && up !== document.body && !painted(up)) up = up.parentElement; if (up && up !== document.body) col = up; }
    if (!col) col = label.parentElement;
    col.classList.add('ixc-col');

    var kind = document.body.getAttribute('data-page-type') ||
      (document.querySelector('.directory-hero') ? 'directory' : '');
    var dataEl = document.getElementById('ix-title-data');
    var name = dataEl ? (dataEl.getAttribute('data-name') || '') : '';
    var logoImg = document.querySelector('.title-page-masthead .mh-logo-img');
    var issueLink = document.querySelector('.title-page-masthead .issue-lb');

    var box = document.createElement('div');
    box.className = 'ixc-plate-box';
    var a = document.createElement(issueLink ? 'a' : 'span');
    a.className = 'ixc-logo';
    if (issueLink) a.href = issueLink.getAttribute('href');
    if (logoImg) {
      var img = document.createElement('img');
      img.src = logoImg.currentSrc || logoImg.src;
      img.alt = name;
      a.appendChild(img);
    }
    box.appendChild(a);
    var rule = document.createElement('div'); rule.className = 'ixc-rule'; rule.setAttribute('aria-hidden', 'true');
    box.appendChild(rule);
    var nm = document.createElement('h1'); nm.className = 'ixc-name';
    var lab = label.querySelector('.mh-label');
    nm.textContent = titleCase(lab ? lab.textContent : label.textContent);
    box.appendChild(nm);
    if (SUB[kind] && name) {
      var sb = document.createElement('div'); sb.className = 'ixc-sub';
      sb.textContent = SUB[kind].replace('{name}', name);
      box.appendChild(sb);
    }
    col.insertBefore(box, col.firstChild);

    function place() {
      var cs = getComputedStyle(col);
      box.style.marginTop = '-' + cs.paddingTop;
      box.style.marginLeft = '-' + cs.paddingLeft;
      box.style.marginRight = '-' + cs.paddingRight;
      box.style.marginBottom = cs.paddingTop;
      box.style.width = 'auto';
    }
    ROOT.classList.add('ixc-plate');
    place();
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    window.addEventListener('load', place);
    return kind;
  }

  function buildArticlePlate() {
    var wrap = document.querySelector('.inner-wrapper.article');
    if (!wrap) return false;
    var dataEl = document.getElementById('ix-title-data');
    var name = dataEl ? (dataEl.getAttribute('data-name') || '') : '';
    var logoImg = document.querySelector('.title-page-masthead .mh-logo-img');
    var issueA = document.querySelector('.title-page-masthead .issue-lb');
    var backA = wrap.querySelector('.link-block-5588') || issueA;

    var box = document.createElement('div');
    box.className = 'ixc-plate-box is-art';
    var a = document.createElement(issueA ? 'a' : 'span');
    a.className = 'ixc-logo';
    if (issueA) a.href = issueA.getAttribute('href');
    if (logoImg) {
      var img = document.createElement('img');
      img.src = logoImg.currentSrc || logoImg.src;
      img.alt = name;
      a.appendChild(img);
    }
    box.appendChild(a);
    var rule = document.createElement('div'); rule.className = 'ixc-rule'; rule.setAttribute('aria-hidden', 'true');
    box.appendChild(rule);
    if (issueA || backA) {
      var il = document.createElement('div'); il.className = 'ixc-il';
      if (issueA) {
        var parts = [];
        issueA.querySelectorAll('.txt').forEach(function (t) {
          if (!t.classList.contains('dot')) parts.push(t.textContent.trim());
        });
        var words = parts.length >= 3 ? parts[0] + ' ' + parts[1] + ' \u00b7 ' + parts.slice(2).join(' ') : issueA.textContent.replace(/\s+/g, ' ').trim();
        var iss = document.createElement('a'); iss.className = 'ixc-iss';
        iss.href = issueA.getAttribute('href'); iss.textContent = words;
        il.appendChild(iss);
      }
      if (backA) {
        var bk = document.createElement('a'); bk.className = 'ixc-back';
        bk.href = backA.getAttribute('href'); bk.textContent = BACK;
        il.appendChild(bk);
      }
      box.appendChild(il);
    }
    wrap.insertBefore(box, wrap.firstChild);
    ROOT.classList.add('ixc-art');
    return true;
  }

  function relabelSwitcher() {
    var tabs = document.querySelectorAll('.tabs-menu-127 a.eee .eeeeef');
    if (tabs.length !== SWITCH.length) return;
    tabs.forEach(function (t, i) { t.textContent = SWITCH[i]; });
  }

  ready(function () {
    if (!document.getElementById('ix-title-vars')) return;
    loadDisplayFont();
    var plated = buildPlate();
    var art = !plated && buildArticlePlate();
    var issue = document.querySelector('.ix-nl > .nlw-plate');
    if (plated || art || issue) {
      ROOT.classList.add('ixc-row');
      ROOT.style.setProperty('--ixc-here', JSON.stringify(art ? '' : hereWords()));
    }
    if (plated === 'archives') relabelSwitcher();
  });
})();
