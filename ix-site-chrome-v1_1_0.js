/* ix-site-chrome-v1_1_0.js
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
     <script src="https://cdn.jsdelivr.net/gh/jbrady74/inbxify-site-code@main/ix-site-chrome-v1_1_0.js" defer></script>
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
      if (who && company) lead.appendChild(document.createTextNode(' · '));
      if (company) lead.appendChild(document.createTextNode(company));
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
