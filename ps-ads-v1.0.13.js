// ps-ads-v1.0.13.js
// ============================================================
// INBXIFY · Publisher Portal · the Ads tab
//
// v1.0.13 (18 Nov 2026, Ad Maker Build S1) — THE TAB NOW MOUNTS ix-ads-board (side 'publisher').
//   Nothing the publisher sees changes. Everything v1.0.12 drew and saved (the two boards, the client list, the
//   open row's tabs, staging and Save, Ask, Request new ads, Withdraw) moved into ix-ads-board-v1.0.1.js so the
//   T-A Ads tab can show the same board from inbxify's side. This file is the Portal's adapter: it hands the
//   shared board ps-shell's ctx (api, publisher, who, info, placeholder) and the ?customer= deep link.
//   Stylesheet: ix-ads-board-v1.0.1.css replaces ps-ads-v1.0.12.css on the /publishers page (same rules, same
//   class names). Needs ix-ads-board v1.0.0 loaded before this file. ps-shell v1.0.3+ as before.
// v1.0.12 (10 Nov 2026) and earlier — see ix-ads-board-v1.0.1.js, which carries the history forward.
// ============================================================
(function () {
  'use strict';
  var VERSION = '1.0.13', FILE = 'ps-ads-v' + VERSION + '.js';
  function mount(node, ctx) {
    if (!window.IxAdsBoard) { node.innerHTML = '<div class="ps-err" role="alert">The ads board did not load (ix-ads-board). Reload the page.</div>'; return; }
    var deep = ''; try { deep = new URLSearchParams(location.search).get('customer') || ''; } catch (e) {}
    window.IxAdsBoard.mount(node, {
      side: 'publisher', api: ctx.api, publisher: ctx.publisher, who: ctx.who, placeholder: ctx.placeholder, deepCustomer: deep,
      info: function (p) { p.companions = FILE + ' · ' + (p.companions || '') + ' · ps-shell v' + (window.PsShell ? window.PsShell.version : '?'); return ctx.info(p); }
    });
  }
  function reg() { window.PsShell.register({ key: 'ads', mount: mount }); }
  if (window.PsShell) reg(); else document.addEventListener('DOMContentLoaded', reg);
})();
