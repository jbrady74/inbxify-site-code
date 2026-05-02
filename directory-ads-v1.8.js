/* directory-ads-v1.8.js
 * Mobile/tablet ad injection for Directory page
 * v1.8 — May 2, 2026
 *
 * Changes from v1.5:
 *   - Ad size updated to 700px wide / auto height (banner format)
 *   - Single centered ad per injection point (removed pair layout)
 *   - "LOCAL PARTNER" label
 *
 * Data source : #ibx-sidebar-ads-data JSON embed { ads: [{img, url}, ...] }
 * Injection   : after every 5th directory card
 * Breakpoint  : ≤999px only
 *
 * DEPLOY:
 *   1. Upload to GitHub jbrady74/inbxify-site-code
 *   2. Replace directory-ads-v1.5.js reference in Directory page head with v1.6
 */

(function () {
  'use strict';

  var BREAKPOINT = 1080;
  var EVERY_N = 5;
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
    wrap.className = 'ibx-dir-ad';
    wrap.innerHTML =
      '<div class="ibx-dir-ad-label">' + LABEL_TEXT + '</div>' +
      '<a href="' + (ad.url || '#') + '" target="_blank" rel="noopener sponsored">' +
        '<img src="' + ad.img + '" alt="Local Partner" loading="lazy">' +
      '</a>';
    return wrap;
  }

  function inject() {
    var ads = getAds();
    if (!ads.length) return;

    // Cards live in jetboost list or collection-list-25 directly
    var list = document.querySelector('[data-jetboost-list-id]') ||
               document.querySelector('.collection-list-25');
    if (!list) return;

    var cards = Array.prototype.slice.call(list.children).filter(function (el) {
      return !el.classList.contains('ibx-dir-ad');
    });

    if (!cards.length) return;

    var adIndex = 0;
    var insertions = [];

    cards.forEach(function (card, i) {
      var cardNum = i + 1;
      if (cardNum % EVERY_N === 0 && ads[adIndex % ads.length]) {
        insertions.push({ after: card, ad: ads[adIndex % ads.length] });
        adIndex++;
      }
    });

    // Insert in reverse so indices don't shift
    insertions.reverse().forEach(function (ins) {
      var block = buildAdBlock(ins.ad);
      ins.after.parentNode &&
        ins.after.parentNode.insertBefore(block, ins.after.nextSibling);
    });
  }

  function waitAndInject() {
    var list = document.querySelector('[data-jetboost-list-id]') ||
               document.querySelector('.collection-list-25');

    if (list && list.children.length > 0) {
      inject();
      return;
    }

    // MutationObserver fallback for Jetboost-rendered content
    var target = document.querySelector('.collection-list-25') ||
                 document.querySelector('.w-dyn-list');
    if (!target) { setTimeout(inject, 800); return; }

    var observer = new MutationObserver(function (mutations, obs) {
      var l = document.querySelector('[data-jetboost-list-id]') ||
              document.querySelector('.collection-list-25');
      if (l && l.children.length > 0) {
        obs.disconnect();
        setTimeout(inject, 200);
      }
    });
    observer.observe(target, { childList: true, subtree: true });
    setTimeout(function () { observer.disconnect(); inject(); }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(waitAndInject, 400); });
  } else {
    setTimeout(waitAndInject, 400);
  }

}());
