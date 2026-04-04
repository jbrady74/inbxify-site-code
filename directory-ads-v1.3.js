/* ============================================
   INBXIFY DIRECTORY PAGE — Mobile Ad Injection
   File: directory-ads-v1.3.js
   GitHub: jbrady74/inbxify-site-code
   jsDelivr: https://cdn.jsdelivr.net/gh/jbrady74/inbxify-site-code@latest/directory-ads-v1.3.js

   Last updated: 2026-04-04

   CHANGES FROM v1.2:
   - Label text: "LOCAL PARTNERS" → "LOCAL PARTNER" (singular)

   HARDCODING: None — reads ad data from #ibx-sidebar-ads-data JSON embed
   ============================================ */
(function () {
  'use strict';

  var DATA_ID = 'ibx-sidebar-ads-data';
  var CARD_SEL = '.directory-card';
  var WRAPPER_SEL = '.jetboost-list-wrapper-lyem .w-dyn-items, [class*="jetboost-list-wrapper"] .w-dyn-items';
  var LEAD_POS = 3;
  var INTERVAL = 5;

  function parseAds() {
    var el = document.getElementById(DATA_ID);
    if (!el) return [];
    try {
      var data = JSON.parse(el.textContent);
      if (!Array.isArray(data)) return [];
      return data.filter(function (a) { return a && a.imageUrl && a.clickUrl; });
    } catch (e) { return []; }
  }

  function createAdEl(ad) {
    var div = document.createElement('div');
    div.className = 'ibx-dir-ad';
    div.innerHTML =
      '<div class="ibx-dir-ad-label">LOCAL PARTNER</div>' +
      '<a href="' + ad.clickUrl + '" target="_blank" rel="noopener noreferrer">' +
      '<img src="' + ad.imageUrl + '" alt="' + (ad.altText || ad.name || 'Local Partner') + '" loading="lazy">' +
      '</a>';
    return div;
  }

  function inject() {
    var ads = parseAds();
    if (!ads.length) return;

    var wrapper = document.querySelector(WRAPPER_SEL);
    if (!wrapper) return;

    var cards = wrapper.querySelectorAll(':scope > .w-dyn-item');
    if (cards.length < LEAD_POS) return;

    if (wrapper.querySelector('.ibx-dir-ad')) return;

    var leadAd = ads[0];
    var pool = ads.slice();
    var poolIdx = 1 % pool.length;

    var positions = [LEAD_POS];
    var pos = LEAD_POS + INTERVAL;
    while (pos < cards.length) {
      positions.push(pos);
      pos += INTERVAL;
    }

    var inserted = 0;
    positions.forEach(function (p) {
      var card = cards[p];
      if (!card) return;
      var ad = inserted === 0 ? leadAd : pool[poolIdx];
      poolIdx = (poolIdx + 1) % pool.length;
      var adEl = createAdEl(ad);
      card.parentNode.insertBefore(adEl, card.nextSibling);
      inserted++;
    });

    console.log('[DirAds] Injected ads —', inserted, 'valid,', cards.length, 'cards');
  }

  function waitAndInject() {
    var wrapper = document.querySelector(WRAPPER_SEL);
    if (!wrapper) return;
    var cards = wrapper.querySelectorAll(CARD_SEL);
    if (cards.length > 0) { inject(); return; }
    var obs = new MutationObserver(function () {
      var c = wrapper.querySelectorAll(CARD_SEL);
      if (c.length > 0) { obs.disconnect(); inject(); }
    });
    obs.observe(wrapper, { childList: true, subtree: true });
  }

  waitAndInject();
})();
