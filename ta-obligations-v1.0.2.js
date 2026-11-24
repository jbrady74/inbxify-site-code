/* ta-obligations-v1.0.2.js
   ════════════════════════════════════════════════════════════════
   INBXIFY · TA Studio · the Obligations tab: a way into the Publisher Portal

   v1.0.2 (24 Nov 2026, Publisher Portal S14) — THE TAB BECOMES A LINK. Ruling (Jeff, 24 Nov, S13 ruling 5): the Publisher Portal is
     the one full view of obligations and the only place a sale is made or changed, so TA Studio keeps no table of its own. One
     table, not two. S14 answers 8a and 2a: clicking the Obligations tab on the rail opens the Portal in the same browser tab,
     filtered to this newsletter (?title=<TITLES-ADMIN id>#obligations), with ?back=<this page> so the Portal shows
     "← Back to TA Studio" above its title (ps-shell v1.0.6).
     · The click is the only thing that leaves the page. Loading TA Studio never jumps to the Portal, even when the Obligations
       pane is the one open (it is first on the rail): the pane then shows one line and an "Open in Publisher Portal" button.
     · v1.0.1's table, tiles and ix-sales reads are gone; TA Studio no longer asks ix-sales anything on this tab.
   WHERE IT DRAWS: the Webflow tab pane named Obligations (data-w-tab, case ignored), into a mount it adds (#ta-ob-mount).
   NEEDS: ix-header v1.1.0 (titleRow), ix-info v1.0.2, TA_CONFIG.taItemId, the publisher slug on the page (data-publisher-slug, the
   chain ta-chrome reads), ps-shell v1.0.6 on the Portal. Companion: ta-obligations-v1.0.1.css.
   HARDCODING (provisional): HC-P-TOB1-1 the tab name 'Obligations'; HC-P-TOB1-2 the words (W); HC-P-TOB1-3 the Portal route
   /publisher/{slug} (TA_CONFIG.publisherRoute, as ta-chrome); HC-P-PP14-4 the query names title and back.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.TaObligations) return;
  var VERSION = '1.0.2', FILE = 'ta-obligations-v' + VERSION + '.js';
  var TAB = 'obligations';                                                  // HC-P-TOB1-1
  var MOUNT_ID = 'ta-ob-mount';
  var W = {                                                                 // HC-P-TOB1-2
    title: 'Obligations', status: 'Sales and their sends live in the Publisher Portal.',
    line: 'Every sale for this newsletter is in the Publisher Portal’s Obligations tab, where sales are made and changed. It opens filtered to this newsletter, with a link back here.',
    open: 'Open in Publisher Portal', noSlug: 'This page has no publisher slug (data-publisher-slug on the TITLES-ADMIN Template), so the Portal link cannot be built.'
  };
  function CFG() { return window.TA_CONFIG || {}; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function publisherSlug() {                                                // the same chain ta-chrome reads
    var hosts = [document.querySelector('#title-admin-id'), document.querySelector('.ta-item'), document.querySelector('[data-publisher-slug]')];
    for (var i = 0; i < hosts.length; i++) {
      var h = hosts[i]; if (!h) continue;
      var v = String(h.getAttribute('data-publisher-slug') || h.getAttribute('data-publisherslug') || h.getAttribute('data-pub-slug') || '').trim();
      if (v && !/^[0-9a-f]{24}$/.test(v)) return v;
    }
    return '';
  }
  function backHere() { return location.pathname + location.search; }     // TA Studio opens on its first tab when you come back
  function portalHref() {                                                   // HC-P-TOB1-3, HC-P-PP14-4
    var slug = publisherSlug(); if (!slug) return '';
    var ta = String(CFG().taItemId || '').trim();
    var q = [];
    if (/^[0-9a-f]{24}$/.test(ta)) q.push('title=' + encodeURIComponent(ta));
    q.push('back=' + encodeURIComponent(backHere()));
    return String(CFG().publisherRoute || '/publisher/{slug}').replace('{slug}', encodeURIComponent(slug)) + '?' + q.join('&') + '#obligations';
  }
  function paneEl() {
    var ps = document.querySelectorAll('.w-tab-pane[data-w-tab]');
    for (var i = 0; i < ps.length; i++) if (String(ps[i].getAttribute('data-w-tab')).trim().toLowerCase() === TAB) return ps[i];
    return null;
  }
  function linkEls() {
    return Array.prototype.filter.call(document.querySelectorAll('.w-tab-link[data-w-tab]'), function (l) { return String(l.getAttribute('data-w-tab')).trim().toLowerCase() === TAB; });
  }
  function info() {
    return { file: FILE, version: VERSION, title: W.title,
      blurb: 'Clicking Obligations on the rail opens the Publisher Portal in this browser tab, on its Obligations tab, filtered to this newsletter. The Portal shows a link back to TA Studio. Sales are made and changed only in the Portal.',
      scenarios: [], companions: 'ta-obligations-v1.0.1.css · ix-header v1.1.0 · pathways: the Publisher Portal (ps-obligations v1.0.7, ps-shell v1.0.6) ?title=<TITLES-ADMIN id>&back=<this page>#obligations' };
  }
  function draw() {
    var p = paneEl(); if (!p) return;
    var m = document.getElementById(MOUNT_ID);
    if (!m) { m = document.createElement('div'); m.id = MOUNT_ID; m.className = 'ix-own ta-ob'; p.appendChild(m); }
    var href = portalHref();
    var head = window.IxHeader && typeof IxHeader.titleRow === 'function'
      ? IxHeader.titleRow({ title: W.title, info: info(), status: W.status, actions: [] })
      : '<div class="ta-ob-head"><h2>' + esc(W.title) + '</h2><span>' + esc(W.status) + '</span></div>';
    m.innerHTML = head + '<div class="ta-ob-card"><p>' + esc(W.line) + '</p>' +
      (href ? '<a class="ix-btn ix-btn--primary ta-ob-open" href="' + esc(href) + '">' + esc(W.open) + '</a>' : '<p class="ta-ob-bad">' + esc(W.noSlug) + '</p>') + '</div>';
  }
  function go(e) {                                                          // the rail click: straight to the Portal
    var href = portalHref();
    if (!href) { draw(); return; }
    if (e) { e.preventDefault(); e.stopPropagation(); }
    location.href = href;
  }
  function wire() {
    linkEls().forEach(function (l) { l.addEventListener('click', go, true); });
    draw();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  window.TaObligations = { version: VERSION, href: portalHref, open: go };
})();
