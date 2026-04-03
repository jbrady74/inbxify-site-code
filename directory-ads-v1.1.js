/* directory-ads-v1.1.js
 * Mobile ad injection for Directory page
 * Reads from #ibx-sidebar-ads-data JSON embed
 * Inserts single ads between directory cards at ≤999px
 *
 * Sequence: Lead Ad (SBA-1) after card 3, then every 5 cards
 * Lead Ad appears once. SBA-2 through SBA-6 cycle when exhausted.
 * Label: "Local Partners"
 *
 * v1.1 — April 3, 2026 — switched from setTimeout to MutationObserver
 */
(function () {
  "use strict";

  if (window.innerWidth > 999) return;

  var LEAD_AFTER = 3;
  var INTERVAL = 5;
  var injected = false;

  function getAds() {
    var jsonEl = document.getElementById("ibx-sidebar-ads-data");
    if (!jsonEl) return [];
    try {
      var ads = JSON.parse(jsonEl.textContent).ads;
      return (ads || []).filter(function (a) {
        return a && a.img && a.img.trim() !== "";
      });
    } catch (e) {
      return [];
    }
  }

  function getGrid() {
    return document.querySelector(".jetboost-list-wrapper-lyem .w-dyn-items") ||
           document.querySelector(".collection-list-25.w-dyn-items") ||
           document.querySelector(".content-75 .w-dyn-items");
  }

  function buildAd(ad) {
    var div = document.createElement("div");
    div.className = "ibx-dir-ad";
    div.innerHTML =
      '<a href="' + (ad.url || "#") + '" target="_blank" rel="noopener">' +
      '<img src="' + ad.img + '" alt="Local Partner" loading="lazy">' +
      "</a>" +
      '<div class="ibx-dir-ad-label">Local Partners</div>';
    return div;
  }

  function inject() {
    if (injected) return;

    var ads = getAds();
    if (!ads.length) return;

    var grid = getGrid();
    if (!grid) return;

    var cards = grid.querySelectorAll(":scope > .w-dyn-item");
    if (cards.length < LEAD_AFTER) return;

    injected = true;

    var sidebar = document.querySelector(".sidebar-25");
    if (sidebar) sidebar.style.display = "none";

    var leadAd = ads[0];
    var pool = ads.slice(1);

    cards[LEAD_AFTER - 1].after(buildAd(leadAd));

    if (!pool.length) return;

    var poolIdx = 0;
    var cardCount = 0;
    var children = grid.children;

    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.classList.contains("ibx-dir-ad")) continue;
      cardCount++;
      if (cardCount <= LEAD_AFTER) continue;
      if ((cardCount - LEAD_AFTER) % INTERVAL === 0) {
        child.after(buildAd(pool[poolIdx % pool.length]));
        poolIdx++;
        children = grid.children;
      }
    }

    console.log("[DirAds] Injected ads — " + ads.length + " valid, " + cards.length + " cards");
  }

  function waitForCards() {
    var grid = getGrid();

    if (grid && grid.querySelectorAll(":scope > .w-dyn-item").length >= LEAD_AFTER) {
      inject();
      return;
    }

    var target = grid || document.querySelector(".content-75") || document.body;
    var obs = new MutationObserver(function () {
      var g = getGrid();
      if (g && g.querySelectorAll(":scope > .w-dyn-item").length >= LEAD_AFTER) {
        obs.disconnect();
        inject();
      }
    });
    obs.observe(target, { childList: true, subtree: true });

    setTimeout(function () { obs.disconnect(); }, 10000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForCards);
  } else {
    waitForCards();
  }
})();
