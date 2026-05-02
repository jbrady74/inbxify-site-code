/* article-ads-v1.2.js
 * Mobile/tablet inline ad injection for Article pages
 * v1.2 — May 2, 2026
 *
 * Changes from v1.0:
 *   - Breakpoint 999px → 991px
 *   - Replaced fragile setTimeout with waitForElement (MutationObserver)
 *   - Hooks into Webflow.push() for ajax navigation reliability
 *   - Guard against double-injection on re-run
 *
 * Data source : #sidebar-ads-data JSON embed { ads: [{img, url}, ...] }
 * Target      : .article-body-rte paragraphs (inside .article-body-div)
 * Photo essay : detected via .photo-essay-flag presence in DOM
 * Breakpoint  : ≤991px only
 */

(function () {
  'use strict';

  var BREAKPOINT = 991;
  var LABEL_TEXT = 'LOCAL PARTNER';
  var AD_MAX = 6;
  var INJECTED_FLAG = 'data-ibx-ads-injected';

  if (window.innerWidth > BREAKPOINT) return;

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

  function isPhotoEssay() {
    return !!document.querySelector('.photo-essay-flag');
  }

  function getParagraphs(rte) {
    return Array.prototype.slice.call(rte.querySelectorAll('p')).filter(function (p) {
      return p.closest('.article-body-rte') === rte;
    });
  }

  function insertAfter(adBlock, refEl) {
    var next = refEl.nextElementSibling;
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

  function init() {
    // Guard against double injection
    var rte = document.querySelector('.article-body-rte');
    if (!rte) return;
    if (rte.getAttribute(INJECTED_FLAG)) return;
    rte.setAttribute(INJECTED_FLAG, '1');

    var ads = getAds();
    if (!ads.length) return;

    // Photo essay: append 1 ad after the RTE wrapper
    if (isPhotoEssay()) {
      var rteWrap = document.querySelector('.article-body-div') || rte;
      var adBlock = buildAdBlock(ads[0]);
      rteWrap.parentNode && rteWrap.parentNode.insertBefore(adBlock, rteWrap.nextSibling);
      return;
    }

    var paragraphs = getParagraphs(rte);
    var pCount = paragraphs.length;
    var adIndex = 0;

    if (pCount < 6) {
      // Short article: inject after para 2, append rest after RTE
      if (pCount >= 2 && ads[adIndex]) {
        insertAfter(buildAdBlock(ads[adIndex]), paragraphs[1]);
        adIndex++;
      }
      var insertTarget = rte.parentNode && rte.parentNode.classList.contains('article-body-div')
        ? rte.parentNode : rte;
      while (adIndex < Math.min(3, ads.length)) {
        var next = insertTarget.nextSibling;
        insertTarget.parentNode && insertTarget.parentNode.insertBefore(buildAdBlock(ads[adIndex]), next || null);
        adIndex++;
      }
    } else {
      // Normal: inject after paras 2, 5, 9
      var positions = [1, 4, 8];
      positions.forEach(function (pos) {
        if (paragraphs[pos] && ads[adIndex]) {
          insertAfter(buildAdBlock(ads[adIndex]), paragraphs[pos]);
          adIndex++;
        }
      });
    }
  }

  // Wait for .article-body-rte to exist in DOM
  function waitForElement(selector, callback) {
    var el = document.querySelector(selector);
    if (el) { callback(); return; }

    var observer = new MutationObserver(function (mutations, obs) {
      if (document.querySelector(selector)) {
        obs.disconnect();
        callback();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Safety timeout — disconnect after 5s regardless
    setTimeout(function () { observer.disconnect(); }, 5000);
  }

  function run() {
    waitForElement('.article-body-rte', init);
  }

  // Standard load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // Webflow ajax navigation
  if (window.Webflow) {
    window.Webflow.push(function () { run(); });
  }

}());
