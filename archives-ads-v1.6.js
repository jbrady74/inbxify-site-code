/* archives-ads-v1.6.js
 * Mobile/tablet ad injection for Archives page
 * v1.6 — May 2, 2026
 *
 * Changes from v1.3:
 *   - Ad size updated to 700px wide / auto height (banner format)
 *   - Single centered ad per injection point (removed pair layout)
 *   - "LOCAL PARTNER" label
 *
 * Data source : #ibx-sidebar-ads-data JSON embed { ads: [{img, url}, ...] }
 * Injection   : after every 3rd archive tile
 * Breakpoint  : ≤999px only
 * List target : .collection-list-120 (tiles are direct children, no .w-dyn-items wrapper)
 *
 * DEPLOY:
 *   1. Upload to GitHub jbrady74/inbxify-site-code
 *   2. Replace archives-ads-v1.3.js reference in Archives page head with v1.4
 */

(function () {
  'use strict';

  var BREAKPOINT = 1080;
  var EVERY_N = 3;
  var LABEL_TEXT = 'LOCAL PARTNER';

  if (window.innerWidth > BREAKPOINT) return;

  function getAds() {
    var el = document.getElementById('ibx-sidebar-ads-data');
    if (!el) return [];
    try {
      var data = JSON.parse(el.textContent);
      var raw = (data && Array.isArray(data.ads)) ? data.ads : [];
      return raw.filter(function (ad) {
        return ad && ad.img && ad.img.trim() !== '';
      });
    } catch (e) {
      return [];
    }
  }

  function buildAdBlock(ad) {
    var wrap = document.createElement('div');
    wrap.className = 'ibx-arch-ad';
    wrap.innerHTML =
      '<div class="ibx-arch-ad-label">' + LABEL_TEXT + '</div>' +
      '<a href="' + (ad.url || '#') + '" target="_blank" rel="noopener sponsored">' +
        '<img src="' + ad.img + '" alt="Local Partner" loading="lazy">' +
      '</a>';
    return wrap;
  }

  function inject() {
    var ads = getAds();
    if (!ads.length) return;

    // Archives tiles sit directly in .collection-list-120 (no .w-dyn-items wrapper)
    var list = document.querySelector('.collection-list-120');
    if (!list) return;

    var tiles = Array.prototype.slice.call(list.children).filter(function (el) {
      return !el.classList.contains('ibx-arch-ad');
    });

    if (!tiles.length) return;

    var adIndex = 0;
    var insertions = [];

    tiles.forEach(function (tile, i) {
      var tileNum = i + 1;
      if (tileNum % EVERY_N === 0 && ads[adIndex % ads.length]) {
        insertions.push({ after: tile, ad: ads[adIndex % ads.length] });
        adIndex++;
      }
    });

    insertions.reverse().forEach(function (ins) {
      var block = buildAdBlock(ins.ad);
      ins.after.parentNode &&
        ins.after.parentNode.insertBefore(block, ins.after.nextSibling);
    });
  }

  function waitAndInject() {
    var list = document.querySelector('.collection-list-120');
    if (list && list.children.length > 0) {
      inject();
      return;
    }

    var observer = new MutationObserver(function (mutations, obs) {
      var l = document.querySelector('.collection-list-120');
      if (l && l.children.length > 0) {
        obs.disconnect();
        setTimeout(inject, 200);
      }
    });
    var target = document.querySelector('.w-dyn-list') || document.body;
    observer.observe(target, { childList: true, subtree: true });
    setTimeout(function () { observer.disconnect(); inject(); }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(waitAndInject, 400); });
  } else {
    setTimeout(waitAndInject, 400);
  }

}());
