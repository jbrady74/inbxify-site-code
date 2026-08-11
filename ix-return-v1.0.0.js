// ============================================================
// ix-return-v1.0.0.js
//
// UNIVERSAL RETURN RULE — shared helper.
//
// THE RULE: after a write that forces a page reload, the operator
// must land back on the surface they fired the write from. Never
// the page default.
//
// The problem this solves: window.location.reload() on the T-A page
// re-runs Webflow's tab widget, which always resets to the FIRST
// tab. So an operator who cloned a PubPlan from the Issues tab got
// dumped on the Studio default tab and had to navigate back every
// single time.
//
// HOW IT WORKS
//   Before reload, capture every currently-active Webflow tab on the
//   page (.w-tab-link.w--current) by its data-w-tab value and stash
//   the list in the URL hash. After reload, replay those clicks in
//   DOM order, then strip the hash so it doesn't linger in the
//   address bar or get bookmarked.
//
//   Hash is used rather than sessionStorage deliberately: it survives
//   a hard reload, it's inspectable when debugging, and it degrades
//   to a no-op if the tab set changed between page loads.
//
//   Nested tabsets work because DOM order puts parent tabs before
//   their children, so parents are restored first and the children
//   exist by the time we reach them.
//
// USAGE
//   IxReturn.reload();                  // reload, come back here
//   IxReturn.reload({ delay: 1000 });   // let a toast breathe first
//
// WHEN NOT TO USE
//   If the write did NOT change what the page renders, don't reload
//   at all — re-render from the response instead. A reload is a last
//   resort, not the default. This helper makes reloads survivable,
//   it doesn't make them free.
//
//   Modals are deliberately NOT restored. Reopening the modal an
//   operator just successfully submitted is disorienting — the work
//   is done and the modal has nothing left to say. Restore the tab
//   underneath it, not the overlay.
//
// MULTI-TENANT: reads nothing tenant-specific. No hardcoding.
// ============================================================

(function () {
  'use strict';

  var HASH_KEY = 'ix-tabs';
  var SEP = '|';

  function currentTabs() {
    var els = document.querySelectorAll('.w-tab-link.w--current');
    var out = [];
    Array.prototype.forEach.call(els, function (el) {
      var v = el.getAttribute('data-w-tab');
      if (v) out.push(v);
    });
    return out;
  }

  function readHash() {
    var h = window.location.hash || '';
    var m = h.match(new RegExp('[#&]' + HASH_KEY + '=([^&]*)'));
    if (!m) return [];
    try {
      return decodeURIComponent(m[1]).split(SEP).filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function stripHash() {
    // replaceState so the cleanup doesn't add a history entry —
    // otherwise Back lands the operator on the same page with a
    // stale hash and it looks like nothing happened.
    try {
      var clean = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', clean);
    } catch (e) {
      // Older browsers / file:// — harmless, the hash just stays.
    }
  }

  function restore() {
    var wanted = readHash();
    if (!wanted.length) return;

    wanted.forEach(function (tabValue) {
      var link = document.querySelector(
        '.w-tab-link[data-w-tab="' + tabValue.replace(/"/g, '\\"') + '"]'
      );
      if (!link) return;                        // tab set changed — skip
      if (link.classList.contains('w--current')) return;  // already there
      link.click();
    });

    stripHash();
  }

  window.IxReturn = window.IxReturn || {};

  // Reload the page and come back to the same tab(s).
  //   opts.delay — ms to wait before reloading (default 0). Use when
  //                a success toast needs a beat to be read.
  window.IxReturn.reload = function (opts) {
    opts = opts || {};
    var tabs = currentTabs();
    var base = window.location.pathname + window.location.search;
    var target = tabs.length
      ? base + '#' + HASH_KEY + '=' + encodeURIComponent(tabs.join(SEP))
      : base;

    setTimeout(function () {
      // Assigning href then reload() so the hash is in place BEFORE
      // the reload fires. location.reload() alone keeps the old hash.
      window.location.href = target;
      window.location.reload();
    }, opts.delay || 0);
  };

  // Exposed for surfaces that need to reload via their own path but
  // still want the return marker written first.
  window.IxReturn.markReturn = function () {
    var tabs = currentTabs();
    if (!tabs.length) return;
    try {
      window.location.hash = HASH_KEY + '=' + encodeURIComponent(tabs.join(SEP));
    } catch (e) {}
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restore);
  } else {
    restore();
  }
})();
