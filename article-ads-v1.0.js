/* article-ads-v1.0.js
 * Mobile/tablet inline ad injection for Article pages
 * v1.0 — May 2, 2026
 *
 * Data source : #sidebar-ads-data JSON embed { ads: [{img, url}, ...] }
 * Target      : .article-body-rte paragraphs (inside .article-body-div)
 * Photo essay : detected via .photo-essay-flag presence in DOM
 * Breakpoint  : ≤999px only
 * Ad size     : 700px wide, auto height, centered
 *
 * Article types handled:
 *   photo-essay  → append 1 ad block after the RTE, no inline injection
 *   short (<6p)  → inject after para 2, append remaining after RTE
 *   normal (6+p) → inject after paras 2, 5, 9 (up to 3 inline)
 *
 * DEPLOY:
 *   1. Upload to GitHub jbrady74/inbxify-site-code
 *   2. Add to Article page BODY (before </body>):
 *      <script src="https://cdn.jsdelivr.net/gh/jbrady74/inbxify-site-code@main/article-ads-v1.0.js"></script>
 *   3. DELETE block 5 (old mobile ad injection JS) from Article page body code
 *   4. DELETE mobile-ad-section / mobile-ad-pair / mobile-ad CSS block from Article page code
 *   5. Keep #sidebar-ads-data embed untouched
 */

(function () {
  'use strict';

  var BREAKPOINT = 999;
  var LABEL_TEXT = 'LOCAL PARTNER';
  var AD_MAX = 6;

  // ── Only run on mobile/tablet ──────────────────────────────────────────────
  if (window.innerWidth > BREAKPOINT) return;

  // ── Read ad data ───────────────────────────────────────────────────────────
  function getAds() {
    var el = document.getElementById('sidebar-ads-data');
    if (!el) return [];
    try {
      var data = JSON.parse(el.textContent);
      var raw = (data && Array.isArray(data.ads)) ? data.ads : [];
      return raw.filter(function (ad) {
        return ad && ad.img && ad.img.trim() !== '';
      }).slice(0, AD_MAX);
    } catch (e) {
      return [];
    }
  }

  // ── Build a single ad block ────────────────────────────────────────────────
  function buildAdBlock(ad) {
    var wrap = document.createElement('div');
    wrap.className = 'ibx-art-ad';
    wrap.innerHTML =
      '<div class="ibx-art-ad-label">' + LABEL_TEXT + '</div>' +
      '<a href="' + (ad.url || '#') + '" target="_blank" rel="noopener sponsored">' +
        '<img src="' + ad.img + '" alt="Local Partner" loading="lazy">' +
      '</a>';
    return wrap;
  }

  // ── Detect photo essay ─────────────────────────────────────────────────────
  function isPhotoEssay() {
    return !!document.querySelector('.photo-essay-flag');
  }

  // ── Get paragraphs from RTE, skip H2 collisions ───────────────────────────
  // Returns array of <p> elements that are direct/near children of the RTE
  function getParagraphs(rte) {
    return Array.prototype.slice.call(rte.querySelectorAll('p')).filter(function (p) {
      // Skip if next sibling is an H2 (inject after H2 instead — handled at insert time)
      return p.closest('.article-body-rte') === rte;
    });
  }

  // ── Insert ad after a given element, H2-collision-aware ───────────────────
  function insertAfter(adBlock, refEl) {
    var next = refEl.nextElementSibling;
    // If next element is a heading, insert after the heading instead
    if (next && /^H[1-3]$/.test(next.tagName)) {
      refEl = next;
    }
    var parent = refEl.parentNode;
    if (!parent) return;
    var afterNext = refEl.nextSibling;
    if (afterNext) {
      parent.insertBefore(adBlock, afterNext);
    } else {
      parent.appendChild(adBlock);
    }
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  function init() {
    var ads = getAds();
    if (!ads.length) return;

    // Photo essay: just append one ad after the RTE wrapper
    if (isPhotoEssay()) {
      var rteWrap = document.querySelector('.article-body-div') ||
                    document.querySelector('.article-body-rte');
      if (!rteWrap) return;
      var adBlock = buildAdBlock(ads[0]);
      rteWrap.parentNode && rteWrap.parentNode.insertBefore(adBlock, rteWrap.nextSibling);
      return;
    }

    // Normal article
    var rte = document.querySelector('.article-body-rte');
    if (!rte) return;

    var paragraphs = getParagraphs(rte);
    var pCount = paragraphs.length;
    var adIndex = 0;

    if (pCount < 6) {
      // Short article: inject 1 ad after para 2 (if it exists), append rest after RTE
      if (pCount >= 2 && ads[adIndex]) {
        insertAfter(buildAdBlock(ads[adIndex]), paragraphs[1]);
        adIndex++;
      }
      // Append remaining ads (up to 2 more) after the RTE div
      var insertTarget = rte.parentNode && rte.parentNode.classList.contains('article-body-div')
        ? rte.parentNode : rte;
      while (adIndex < Math.min(3, ads.length)) {
        insertTarget.parentNode &&
          insertTarget.parentNode.insertBefore(buildAdBlock(ads[adIndex]), insertTarget.nextSibling);
        // Walk insertTarget forward so each appended ad is after the previous
        insertTarget = insertTarget.nextSibling || insertTarget;
        adIndex++;
      }
    } else {
      // Normal article: inject after paragraphs 2, 5, 9 (0-indexed: 1, 4, 8)
      var positions = [1, 4, 8];
      positions.forEach(function (pos) {
        if (paragraphs[pos] && ads[adIndex]) {
          insertAfter(buildAdBlock(ads[adIndex]), paragraphs[pos]);
          adIndex++;
        }
      });
    }
  }

  // ── Wait for Webflow CMS render ────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(init, 400);
    });
  } else {
    setTimeout(init, 400);
  }

}());
