/* archives-ads-v1.1.js
 * Mobile/tablet ad injection for Archives page
 * v1.1 — April 4, 2026
 *
 * Reads from #ibx-sidebar-ads-data JSON embed
 * Injects .ibx-arch-ad containers between archive tiles
 * Lead ad after tile 3, then every 5 tiles
 * MutationObserver waits for CMS tiles to render
 */

(function () {
  'use strict';

  var LEAD_POSITION = 3;
  var INTERVAL = 5;
  var LABEL_TEXT = 'LOCAL PARTNER';
  var LIST_SELECTOR = '.collection-list-120 .w-dyn-items';
  var TILE_SELECTOR = '.w-dyn-item';
  var AD_CLASS = 'ibx-arch-ad';

  var THEMES = ['forest', 'slate', 'burgundy', 'navy', 'terracotta',
                'plum', 'copper', 'teal', 'sage', 'charcoal'];

  function getAds() {
    var el = document.getElementById('ibx-sidebar-ads-data');
    if (!el) return [];
    try {
      var data = JSON.parse(el.textContent);
      var ads = (data && data.ads) ? data.ads : [];
      return ads.filter(function (a) {
        return a.img && a.img.trim() !== '' && a.url && a.url.trim() !== '';
      });
    } catch (e) {
      console.warn('[INBXIFY Archives Ads] JSON parse error:', e);
      return [];
    }
  }

  function buildAdNode(ad, themeIndex) {
    var container = document.createElement('div');
    container.className = AD_CLASS;
    container.setAttribute('data-theme', THEMES[themeIndex % THEMES.length]);

    var label = document.createElement('div');
    label.className = AD_CLASS + '-label';
    label.textContent = LABEL_TEXT;
    container.appendChild(label);

    var link = document.createElement('a');
    link.href = ad.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    container.appendChild(link);

    var img = document.createElement('img');
    img.src = ad.img;
    img.alt = 'Local Partner';
    img.loading = 'lazy';
    link.appendChild(img);

    return container;
  }

  function injectAds() {
    var list = document.querySelector(LIST_SELECTOR);
    if (!list) return false;

    var tiles = list.querySelectorAll(':scope > ' + TILE_SELECTOR);
    if (tiles.length < LEAD_POSITION) return false;

    var ads = getAds();
    if (ads.length === 0) return false;

    var existing = list.querySelectorAll('.' + AD_CLASS);
    for (var i = 0; i < existing.length; i++) {
      existing[i].remove();
    }

    tiles = list.querySelectorAll(':scope > ' + TILE_SELECTOR);

    var adIndex = 0;
    var themeIndex = 0;
    var insertions = [];

    insertions.push({
      after: tiles[LEAD_POSITION - 1],
      ad: ads[adIndex % ads.length]
    });
    adIndex++;

    var nextPos = LEAD_POSITION + INTERVAL;
    while (nextPos <= tiles.length) {
      insertions.push({
        after: tiles[nextPos - 1],
        ad: ads[adIndex % ads.length]
      });
      adIndex++;
      nextPos += INTERVAL;
    }

    for (var j = insertions.length - 1; j >= 0; j--) {
      var ins = insertions[j];
      var node = buildAdNode(ins.ad, themeIndex);
      themeIndex++;
      ins.after.parentNode.insertBefore(node, ins.after.nextSibling);
    }

    console.log('[INBXIFY Archives Ads] Injected', insertions.length, 'ads from', ads.length, 'available');
    return true;
  }

  function init() {
    if (injectAds()) return;

    var target = document.querySelector(LIST_SELECTOR) ||
                 document.querySelector('.collection-list-120');

    if (!target) {
      var bodyObs = new MutationObserver(function (mutations, obs) {
        var found = document.querySelector(LIST_SELECTOR);
        if (found) {
          obs.disconnect();
          watchForTiles(found);
        }
      });
      bodyObs.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { bodyObs.disconnect(); }, 10000);
      return;
    }

    watchForTiles(target);
  }

  function watchForTiles(listEl) {
    var tiles = listEl.querySelectorAll(TILE_SELECTOR);
    if (tiles.length >= LEAD_POSITION) {
      injectAds();
      return;
    }

    var obs = new MutationObserver(function (mutations, observer) {
      var t = listEl.querySelectorAll(TILE_SELECTOR);
      if (t.length >= LEAD_POSITION) {
        observer.disconnect();
        injectAds();
      }
    });

    obs.observe(listEl, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
