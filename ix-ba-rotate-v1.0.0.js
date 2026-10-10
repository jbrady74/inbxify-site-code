/* ix-ba-rotate-v1.0.0.js */
/* ============================================================
   ix-ba-rotate-v1.0.0.js — banner rotation on the published web page
   Load on the NEWSLETTER web page (Webflow collection template, before
   </body>), after the issue HTML is on the page. No CSS needed.

   v1.0.0 (IPP Build S7, 10 Oct 2026) — RULED BY JEFF
     · Rotation = the banners swap places each time the web page loads.
     · The Lead banner (the first ad in the issue) never moves.
     · The spots stay where Layout put them; only the ads swap between
       them. A spot keeps its own label ("Featured local partners" or
       the block's text); the ad (picture + link) is what moves.
     · The same ad in two slots means two placements bought: it shows
       twice, in different spots. Nothing is de-duplicated.
     · Email is untouched: it goes out in the order saved at send. This
       file only ever runs on the web page.
     · House ads (.nlw-ha) stay in their spots. They are a different
       shape from a banner, so swapping one into a banner spot would
       change the layout.
     · Nothing is written anywhere. Each load is a fresh shuffle.

   HOW IT FINDS THINGS (from the live templates)
     Banner spot  .nlw-ba  (templates/ix/web-ba-banner-v3.html)
                  its ad is the <a> inside it (link + picture)
     House ad     .nlw-ha  (templates/ix/web-ha-*-v6.html)
     Lead         the first .nlw-ba or .nlw-ha in page order inside
                  .ix-nl. If that is a banner it is held in place.
     HC-P-ROT-1   "Lead = first ad in page order". Platform rule
                  (Revenue v1.3: Lead stays first), not tenant data.

   SWITCHES
     window.IX_BA_ROTATE = false   before this file: rotation off
     ?norotate=1 in the URL        shows the saved order (for checking)
     Each rotated spot gets data-ix-rot-from="<saved spot number>",
     so you can see in the page source where an ad came from.
   ============================================================ */
(function () {
  'use strict';
  var VERSION = '1.0.0';

  function off() {
    if (window.IX_BA_ROTATE === false) return true;
    try { return /[?&]norotate=1\b/.test(location.search); } catch (e) { return false; }
  }

  // Fisher–Yates, with a guarantee that at least two spots change when
  // there are two or more ads to move (a "rotation" that lands on the
  // saved order looks like it did nothing).
  function shuffle(list) {
    var a = list.slice(), n = a.length, i, j, t;
    for (var tries = 0; tries < 5; tries++) {
      for (i = n - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
      for (i = 0; i < n; i++) if (a[i] !== list[i]) return a;
    }
    return a;
  }

  function rotate(root) {
    root = root || document;
    var nls = root.querySelectorAll('.ix-nl');
    var scopes = nls.length ? Array.prototype.slice.call(nls) : [root];
    var moved = 0;
    scopes.forEach(function (nl) {
      if (nl.getAttribute('data-ix-rotated') === '1') return;
      nl.setAttribute('data-ix-rotated', '1');
      var ads = Array.prototype.slice.call(nl.querySelectorAll('.nlw-ba, .nlw-ha'));
      if (!ads.length) return;
      var lead = ads[0];
      var spots = ads.filter(function (el) {
        return el !== lead && el.classList.contains('nlw-ba') && el.querySelector(':scope > a');
      });
      if (spots.length < 2) return;
      var pieces = spots.map(function (el, i) { var a = el.querySelector(':scope > a'); a.setAttribute('data-ix-rot-saved', String(i + 1)); return a; });
      var order = shuffle(pieces);
      // Take every ad out first, then put each in its new spot.
      pieces.forEach(function (a) { a.parentNode.removeChild(a); });
      spots.forEach(function (el, i) {
        el.appendChild(order[i]);
        el.setAttribute('data-ix-rot-from', order[i].getAttribute('data-ix-rot-saved'));
        if (order[i] !== pieces[i]) moved++;
      });
    });
    return moved;
  }

  function run() {
    if (off()) { window.IxBaRotate.last = 0; return; }
    try { window.IxBaRotate.last = rotate(document); }
    catch (e) { if (window.console) console.warn('[ix-ba-rotate] skipped:', e && e.message); }
  }

  window.IxBaRotate = { version: VERSION, rotate: rotate, last: null };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
