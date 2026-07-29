/* ============================================================
   ta-performance-v0.2.0.js
   INBXIFY — Performance tab (T-A) — SHELL
   First version. Renders the panel scaffold (header + sub-nav +
   two header-only tables) and wires the By advertiser /
   By newsletter sub-nav. No data fetch yet. No period row.

   PLATFORM FIT (matches how other T-A tabs are built):
     • The tab itself is a Webflow-native tab: add a
       .w-tab-link[role="tab"] + .w-tab-pane[role="tabpanel"]
       with data-w-tab="Performance" in the Designer, alongside
       the other T-A tabs. That gives the identical tab chrome —
       this module does NOT draw a tab strip or page header.
     • Inside that pane, add <div id="ta-perf-mount"></div>.
       This script injects the panel into it (same #…-mount
       pattern as std-transcriber-mount etc.).
     • Sub-nav uses the shared .ix-channels / .ix-channel classes,
       not a bespoke toggle.

   Pairs with ta-performance-v0.1.0.css.
   Authored 2026-07-28 — first cut of the Performance module.
   ============================================================ */
(function () {
  'use strict';

  var MOUNT_ID = 'ta-perf-mount';

  // Panel markup. No period row (deliberate). No dummy rows.
  // Sub-nav reuses .ix-channels / .ix-channel (title-admin §4).
  var PANEL_HTML = [
    '<div class="ta-perf" id="ta-perf">',
    '  <!--IXHDR-->',
    '  <!--IXTABS-->',
    '  <div class="ta-perf__subview active" data-perf-subview="adv">',
    '    <div class="ta-perf__card">',
    '      <table>',
    '        <thead><tr>',
    '          <th>Advertiser</th>',
    '          <th>Slot</th>',
    '          <th class="num">Runs</th>',
    '          <th class="num">Saw it</th>',
    '          <th class="num">Read it</th>',
    '          <th class="num">Acted</th>',
    '          <th class="num">Last ran</th>',
    '        </tr></thead>',
    '        <tbody data-perf-rows="adv"></tbody>',
    '      </table>',
    '    </div>',
    '  </div>',
    '  <div class="ta-perf__subview" data-perf-subview="nl">',
    '    <div class="ta-perf__card">',
    '      <table>',
    '        <thead><tr>',
    '          <th>Newsletter</th>',
    '          <th class="num">Delivered</th>',
    '          <th class="num">Opens</th>',
    '          <th class="num">Open rate</th>',
    '          <th class="num">Advertisers</th>',
    '          <th class="num">Clicks</th>',
    '        </tr></thead>',
    '        <tbody data-perf-rows="nl"></tbody>',
    '      </table>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('');

  function wireChannels(root) {
    var channels = root.querySelectorAll('[data-perf-channel]');
    var subviews = root.querySelectorAll('[data-perf-subview]');

    function show(which) {
      channels.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-perf-channel') === which);
      });
      subviews.forEach(function (v) {
        v.classList.toggle('active', v.getAttribute('data-perf-subview') === which);
      });
    }

    channels.forEach(function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-perf-channel')); });
    });
  }

  function init() {
    var root = document.getElementById('ta-perf');
    if (!root) {
      var mount = document.getElementById(MOUNT_ID);
      if (!mount) { return; }          // Performance pane not on this page
      // v0.2.0: header + channel row come from the shared component
      //   (ix-header-v1.0.1.js) instead of bespoke .ta-perf__head /
      //   .ix-channels markup, so Performance matches every other tab.
      mount.innerHTML = PANEL_HTML
        .replace('<!--IXHDR-->', (window.IxHeader && IxHeader.render)
          ? IxHeader.render({ icon: '\uD83D\uDCC8', title: 'Performance' })
          : '<div class="ix-hdr"><div class="ix-hdr-left"><div class="ix-hdr-icon">\uD83D\uDCC8</div><div><h3>Performance</h3></div></div><div class="ix-hdr-right"></div></div>')
        .replace('<!--IXTABS-->', (window.IxTabs && IxTabs.l1)
          ? IxTabs.l1([{ key: 'adv', label: 'By advertiser' },
                       { key: 'nl',  label: 'By newsletter' }], 'adv', 'data-perf-channel')
          : '<div class="ix-tabs-l1">' +
            '<button class="ix-btn ix-btn--tab is-active" data-active="true" data-perf-channel="adv">By advertiser</button>' +
            '<button class="ix-btn ix-btn--tab" data-perf-channel="nl">By newsletter</button></div>');
      root = document.getElementById('ta-perf');
    }
    if (!root || root.dataset.perfInit === '1') { return; }
    root.dataset.perfInit = '1';
    wireChannels(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* End of ta-performance-v0.1.0.js */
