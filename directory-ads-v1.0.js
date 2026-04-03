/* directory-ads-v1.0.js
 * Mobile ad injection for Directory page
 * Reads from #ibx-sidebar-ads-data JSON embed
 * Inserts single ads between directory cards at ≤999px
 *
 * Sequence: Lead Ad (SBA-1) after card 3, then every 5 cards
 * Lead Ad appears once. SBA-2 through SBA-6 cycle when exhausted.
 * Label: "Local Partners"
 *
 * v1.0 — April 3, 2026
 */
(function () {
  "use strict";

  /* Only run at ≤999px */
  if (window.innerWidth > 999) return;

  var LEAD_AFTER = 3;
  var INTERVAL = 5;

  function init() {
    /* Read ad data from JSON embed */
    var jsonEl = document.getElementById("ibx-sidebar-ads-data");
    if (!jsonEl) return;

    var ads;
    try {
      ads = JSON.parse(jsonEl.textContent).ads;
    } catch (e) {
      return;
    }
    if (!ads || !ads.length) return;

    /* Filter out empty entries */
    ads = ads.filter(function (a) {
      return a && a.img && a.img.trim() !== "";
    });
    if (!ads.length) return;

    /* Separate Lead Ad (index 0) from rotation pool */
    var leadAd = ads[0];
    var pool = ads.slice(1);

    /* After scraping, fully hide the sidebar */
    var sidebar = document.querySelector(".sidebar-25");
    if (sidebar) sidebar.style.display = "none";

    /* Find the card grid */
    var grid =
      document.querySelector(".jetboost-list-wrapper-lyem .w-dyn-items") ||
      document.querySelector(".collection-list-25.w-dyn-items") ||
      document.querySelector(".content-75 .w-dyn-items");
    if (!grid) return;

    var cards = grid.querySelectorAll(":scope > .w-dyn-item");
    if (cards.length < LEAD_AFTER) return;

    /* Build a single ad element */
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

    /* Insert Lead Ad after card 3 */
    cards[LEAD_AFTER - 1].after(buildAd(leadAd));

    /* Insert rotating ads every 5 cards after the lead */
    if (!pool.length) return;

    var poolIdx = 0;

    /* Re-query cards since we inserted one */
    cards = grid.querySelectorAll(":scope > .w-dyn-item");

    /* Next insertion point: LEAD_AFTER + INTERVAL cards from start
       But we need to count only .w-dyn-item, skipping our injected ads */
    var cardCount = 0;
    var children = grid.children;

    for (var i = 0; i < children.length; i++) {
      var child = children[i];

      /* Skip our injected ads */
      if (child.classList.contains("ibx-dir-ad")) continue;

      cardCount++;

      /* First real insertion starts at LEAD_AFTER + INTERVAL */
      if (cardCount <= LEAD_AFTER) continue;

      if ((cardCount - LEAD_AFTER) % INTERVAL === 0) {
        var ad = pool[poolIdx % pool.length];
        child.after(buildAd(ad));
        poolIdx++;

        /* Re-read children since DOM changed */
        children = grid.children;
      }
    }
  }

  /* Delay to let Webflow CMS + Jetboost render */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(init, 800);
    });
  } else {
    setTimeout(init, 800);
  }
})();
