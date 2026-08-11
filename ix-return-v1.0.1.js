// ============================================================
// ix-return-v1.0.1.js
//
// UNIVERSAL RETURN RULE — shared helper.
//
// THE RULE: after a write that forces a page reload, the operator
// must land back on the surface they fired the write from. Never
// the page default.
//
// ──────────────────────────────────────────────────────────
// v1.0.1 — FIXES the tab restore not taking (race + verification)
//
//   v1.0.0 restored on DOMContentLoaded. That is TOO EARLY on a
//   Webflow page: the Tabs component binds its click handlers when
//   Webflow's own ready queue runs, which is after DOMContentLoaded.
//   So the synthetic .click() landed on an element nobody was
//   listening to, did nothing, and then v1.0.0 stripped the hash —
//   destroying the evidence and leaving the operator on tab 1 with
//   no clue why.
//
//   Three changes:
//     1. Restore runs inside Webflow.push() when Webflow is present,
//        which queues until the components are initialised. Falls
//        back to window 'load', then to DOMContentLoaded.
//     2. VERIFY the click took. After clicking, check the link
//        actually gained .w--current. If not, retry on an interval
//        (200ms, up to ~4s) — covers slow IX init and lazily-built
//        tab panes.
//     3. The hash is only stripped once every wanted tab is
//        confirmed current. A failed restore now leaves the hash in
//        place and logs why, so it is debuggable instead of silent.
//
//   Also new: IxReturn.debug = true in console for verbose tracing.
//
// ──────────────────────────────────────────────────────────
// HOW IT WORKS
//   Before reload, capture every currently-active Webflow tab
//   (.w-tab-link.w--current) by data-w-tab and stash the list in the
//   URL hash. After reload, replay those clicks in DOM order, verify,
//   then strip the hash.
//
//   Hash rather than sessionStorage: survives a hard reload, visible
//   while debugging, and degrades to a no-op if the tab set changed.
//
//   Nested tabsets work because DOM order puts parents before
//   children, so parents restore first and children exist by the
//   time we reach them.
//
// USAGE
//   IxReturn.reload();                  // reload, come back here
//   IxReturn.reload({ delay: 1000 });   // let a toast breathe first
//
// WHEN NOT TO USE
//   If the write did NOT change what the page renders, don't reload
//   at all — re-render from the response. This helper makes reloads
//   survivable, not free.
//
//   Modals are deliberately NOT reopened. The submit succeeded; the
//   modal has nothing left to say. Restore the tab underneath.
//
// MULTI-TENANT: reads nothing tenant-specific. No hardcoding.
// ============================================================

(function () {
  'use strict';

  var HASH_KEY = 'ix-tabs';
  var SEP = '|';
  var RETRY_MS = 200;
  var MAX_TRIES = 20;          // ~4s of patience before giving up

  var API = (window.IxReturn = window.IxReturn || {});
  API.debug = API.debug || false;

  function log() {
    if (!API.debug) return;
    console.log.apply(console, ['[IxReturn]'].concat([].slice.call(arguments)));
  }

  function currentTabs() {
    var out = [];
    Array.prototype.forEach.call(
      document.querySelectorAll('.w-tab-link.w--current'),
      function (el) {
        var v = el.getAttribute('data-w-tab');
        if (v) out.push(v);
      }
    );
    return out;
  }

  function readHash() {
    var m = (window.location.hash || '')
      .match(new RegExp('[#&]' + HASH_KEY + '=([^&]*)'));
    if (!m) return [];
    try {
      return decodeURIComponent(m[1]).split(SEP).filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function stripHash() {
    try {
      window.history.replaceState(
        null, '', window.location.pathname + window.location.search
      );
    } catch (e) {}
  }

  function linkFor(tabValue) {
    return document.querySelector(
      '.w-tab-link[data-w-tab="' + tabValue.replace(/"/g, '\\"') + '"]'
    );
  }

  // Returns true when every wanted tab is confirmed current.
  function attempt(wanted) {
    var allDone = true;
    wanted.forEach(function (v) {
      var link = linkFor(v);
      if (!link) { log('no link for', v, '- skipping'); return; }
      if (link.classList.contains('w--current')) return;
      log('clicking', v);
      link.click();
      // Re-read: Webflow flips the class synchronously once its
      // handler is bound. If it did not flip, the widget is not
      // ready yet and we will come back next tick.
      if (!link.classList.contains('w--current')) allDone = false;
    });
    return allDone;
  }

  function restore() {
    var wanted = readHash();
    if (!wanted.length) return;
    log('restoring', wanted);

    var tries = 0;
    (function tick() {
      tries++;
      if (attempt(wanted)) {
        log('restored in', tries, 'attempt(s)');
        stripHash();
        return;
      }
      if (tries >= MAX_TRIES) {
        console.warn('[IxReturn] could not restore tabs after ' + tries +
          ' attempts; leaving hash in place for inspection.', wanted);
        return;
      }
      setTimeout(tick, RETRY_MS);
    })();
  }

  API.reload = function (opts) {
    opts = opts || {};
    var tabs = currentTabs();
    var base = window.location.pathname + window.location.search;
    var target = tabs.length
      ? base + '#' + HASH_KEY + '=' + encodeURIComponent(tabs.join(SEP))
      : base;
    log('reloading, marking', tabs);
    setTimeout(function () {
      window.location.href = target;
      window.location.reload();
    }, opts.delay || 0);
  };

  API.markReturn = function () {
    var tabs = currentTabs();
    if (!tabs.length) return;
    try {
      window.location.hash =
        HASH_KEY + '=' + encodeURIComponent(tabs.join(SEP));
    } catch (e) {}
  };

  // ── Boot ──
  // Webflow.push queues until Webflow's components (including Tabs)
  // are initialised — that is the only moment a synthetic click on a
  // .w-tab-link will actually do anything. Everything else is a
  // fallback for pages where Webflow's runtime is absent or slow.
  function boot() {
    if (window.Webflow && typeof window.Webflow.push === 'function') {
      log('booting via Webflow.push');
      window.Webflow.push(restore);
      return;
    }
    log('Webflow.push unavailable - booting on load/ready');
    restore();
  }

  if (document.readyState === 'complete') {
    boot();
  } else {
    window.addEventListener('load', boot);
    // Belt and braces: if 'load' is delayed by a slow image, try at
    // DOM-ready too. The retry loop makes a premature call harmless.
    document.addEventListener('DOMContentLoaded', boot);
  }
})();
