/* inbxify-page-layout-v1.0.js
 * Shared ad relocation logic for Articles, Directory, Archives
 * Loaded via jsDelivr on all three page types
 * v1.0 — April 2, 2026
 *
 * REQUIRES: sidebar ad data available in DOM
 *   - Articles: #sidebar-ads-data JSON embed (already built)
 *   - Directory/Archives: .sidebar-ads-wrap .sidebar-ad elements
 *
 * PAGE DETECTION: uses data-ibx-page attribute on <body>
 *   - data-ibx-page="article"
 *   - data-ibx-page="directory"
 *   - data-ibx-page="archives"
 *   Set this in Webflow page settings or via body class.
 *   Fallback: sniffs URL path segments.
 */

(function () {
  "use strict";

  // Only run on tablet/mobile
  if (window.innerWidth > 991) return;

  // ── Detect page type ──
  function getPageType() {
    var body = document.body;
    var attr = body.getAttribute("data-ibx-page");
    if (attr) return attr.toLowerCase();

    // Fallback: sniff URL
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf("/articles/") !== -1 || path.indexOf("/article/") !== -1) return "article";
    if (path.indexOf("/directory") !== -1) return "directory";
    if (path.indexOf("/archive") !== -1 || path.indexOf("/newsletter") !== -1) return "archives";

    return "";
  }

  // ── Read ad data from sidebar ──
  // Returns array of {img, url} objects
  function getAdData() {
    var ads = [];

    // Method 1: JSON embed (Articles use this)
    var jsonEl = document.getElementById("sidebar-ads-data");
    if (jsonEl) {
      try {
        var parsed = JSON.parse(jsonEl.textContent);
        if (parsed.ads && parsed.ads.length) return parsed.ads;
      } catch (e) { /* fall through */ }
    }

    // Method 2: DOM scrape from sidebar (Directory/Archives)
    var items = document.querySelectorAll(".sidebar-ads-wrap .sidebar-ad");
    if (!items.length) {
      // Try link blocks inside single sidebar-ad
      items = document.querySelectorAll(".sidebar-ads-wrap a");
    }

    items.forEach(function (el) {
      var link = el.tagName === "A" ? el : el.querySelector("a");
      var img = el.querySelector("img");
      if (img && img.src) {
        ads.push({
          img: img.src,
          url: link ? link.href : "#"
        });
      }
    });

    return ads;
  }

  // ── Build an ad section (pair of ads) ──
  function createAdSection(ad1, ad2) {
    var has1 = ad1 && ad1.img && ad1.img.trim() !== "";
    var has2 = ad2 && ad2.img && ad2.img.trim() !== "";
    if (!has1 && !has2) return null;

    var section = document.createElement("div");
    section.className = "ibx-ad-section";

    var html = '<div class="ibx-ad-label">Advertisement</div><div class="ibx-ad-pair">';
    if (has1) {
      html += '<div class="ibx-ad-slot"><a href="' + (ad1.url || "#") + '" target="_blank" rel="noopener">';
      html += '<img src="' + ad1.img + '" alt="Advertisement" loading="lazy"></a></div>';
    }
    if (has2) {
      html += '<div class="ibx-ad-slot"><a href="' + (ad2.url || "#") + '" target="_blank" rel="noopener">';
      html += '<img src="' + ad2.img + '" alt="Advertisement" loading="lazy"></a></div>';
    }
    html += "</div>";
    section.innerHTML = html;
    return section;
  }

  // ── Build all ad sections from ad array ──
  function buildAdSections(ads) {
    var sections = [];
    for (var i = 0; i < ads.length; i += 2) {
      var sec = createAdSection(ads[i], ads[i + 1] || null);
      if (sec) sections.push(sec);
    }
    return sections;
  }

  // ──────────────────────────────────────
  //  ARTICLE: inject inline in RTE
  //  (preserves existing logic from article page)
  // ──────────────────────────────────────
  function handleArticle(ads) {
    var THRESHOLD = 8;
    var POSITIONS = [4, 8];

    var rte = document.querySelector(".article-body-rte");
    if (!rte) return;

    var paragraphs = rte.querySelectorAll("p");
    var total = paragraphs.length;
    if (total === 0) return;

    var sections = buildAdSections(ads);
    if (!sections.length) return;

    // Section 1: always after paragraph 1
    if (sections[0] && paragraphs[0]) {
      paragraphs[0].after(sections[0]);
    }

    if (total >= THRESHOLD) {
      // Long article: inject sections 2 & 3 at paragraph positions
      for (var s = 1; s < sections.length && s <= POSITIONS.length; s++) {
        var pos = POSITIONS[s - 1];
        if (pos < total) {
          var target = paragraphs[pos];
          // Avoid H2 collision: if next sibling is H2, insert after the H2
          var next = target.nextElementSibling;
          if (next && next.tagName === "H2") {
            next.after(sections[s]);
          } else {
            target.after(sections[s]);
          }
        }
      }
    } else {
      // Short article: append remaining sections after content
      for (var j = 1; j < sections.length; j++) {
        rte.appendChild(sections[j]);
      }
    }
  }

  // ──────────────────────────────────────
  //  DIRECTORY: insert between card rows
  // ──────────────────────────────────────
  function handleDirectory(ads) {
    // Target the card grid collection list items
    var grid = document.querySelector(".jetboost-list-wrapper-lyem .w-dyn-items") ||
               document.querySelector(".collection-list-25.w-dyn-items") ||
               document.querySelector(".content-75 .w-dyn-items");
    if (!grid) return;

    var cards = grid.querySelectorAll(".w-dyn-item");
    if (cards.length < 4) return;

    var sections = buildAdSections(ads);
    if (!sections.length) return;

    // Determine cards-per-row based on viewport
    // Mobile: 1-2 cards per row, tablet: 2-3
    var cardsPerRow = window.innerWidth <= 479 ? 1 : 2;
    var insertEvery = cardsPerRow * 3; // Every 3 rows

    var inserted = 0;
    for (var i = insertEvery; i < cards.length && inserted < sections.length; i += insertEvery + 1) {
      cards[i].before(sections[inserted]);
      inserted++;
      // Recalculate because we inserted an element
      cards = grid.querySelectorAll(".w-dyn-item");
    }

    // Remaining sections go at the end
    for (var r = inserted; r < sections.length; r++) {
      grid.appendChild(sections[r]);
    }
  }

  // ──────────────────────────────────────
  //  ARCHIVES: insert between tiles
  // ──────────────────────────────────────
  function handleArchives(ads) {
    // Target the archive tile collection list
    var list = document.querySelector(".content-75 .w-dyn-items") ||
               document.querySelector(".content-75 .collection-list-wrapper .w-dyn-items");
    if (!list) return;

    var tiles = list.querySelectorAll(".w-dyn-item");
    if (tiles.length < 2) return;

    var sections = buildAdSections(ads);
    if (!sections.length) return;

    // Insert after every 2nd tile
    var inserted = 0;
    for (var i = 1; i < tiles.length && inserted < sections.length; i += 3) {
      tiles[i].after(sections[inserted]);
      inserted++;
      // Recalculate
      tiles = list.querySelectorAll(".w-dyn-item");
    }
  }

  // ── Main ──
  function init() {
    var pageType = getPageType();
    if (!pageType) return;

    var ads = getAdData();
    if (!ads.length) return;

    switch (pageType) {
      case "article":
        handleArticle(ads);
        break;
      case "directory":
        handleDirectory(ads);
        break;
      case "archives":
        handleArchives(ads);
        break;
    }
  }

  // Delay to let Webflow CMS render
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(init, 500);
    });
  } else {
    setTimeout(init, 500);
  }
})();
