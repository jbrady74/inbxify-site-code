/* ix-info-v1.0.1.js
   ════════════════════════════════════════════════════════════════
   INBXIFY ix series — SURFACE INFO BADGE + POPOVER
   Companion: ix-info-v1_0_0.css (non-critical styling only; the
   popover's critical geometry and colors are inline-!important,
   because it can be summoned from inside .publisher-wrapper where
   the page's background wildcards mug anything cascade-dependent).

   STANDING RULE (Jeff, 29 Sept): a bare version chip serves the
   developer; the operator deserves an ⓘ. Every T-A module replaces
   its version chip with IxInfo.badge(...), whose popover names the
   deployed file and version, explains in a few sentences how the
   surface works, and lists the Make scenarios it talks to. Adopted
   first by the cadence board (v0.6.50); the rest of T-A follows as
   each module next ships.

   v1.0.1 — the badge's own colors go inline-!important: first live
   render proved the popover survives the page wildcards (its card
   was already inline-armored) while the badge's gold ⓘ circle was
   stripped. Same armor, applied to the chip.

   API — a module renders the badge into its own markup:

     IxInfo.badge({
       file:      'ta-cadence-board-v0.6.50.js',
       version:   '0.6.50',                  // chip text: v0.6.50
       title:     'Print Issue Slate Plan',
       blurb:     'One or two short paragraphs, plain language.',
       scenarios: [ { name: 'I · Bundles read', note: 'loads …' } ],
       companions: 'ta-cadence-board-v0.6.33.css · ix-tokens v1.0.4'
     })

   returns an HTML string: a chip-sized button. This file wires ONE
   delegated click listener on document; clicking any badge opens
   the popover for the payload serialized on the button. No module
   wiring beyond rendering the string. Popover closes on outside
   click, Esc, scroll or resize. One popover at a time.
*/
(function () {
  'use strict';
  if (window.IxInfo) return;

  var POP_ID = 'ix-info-pop';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function badge(o) {
    o = o || {};
    var payload = esc(JSON.stringify({
      file: o.file || '', version: o.version || '', title: o.title || '',
      blurb: o.blurb || '', scenarios: o.scenarios || [],
      companions: o.companions || ''
    }));
    return '<button type="button" class="ix-info-badge" data-ix-info="' + payload + '" ' +
             'style="background:transparent !important;color:inherit !important" ' +
             'aria-label="About this surface" title="About this surface">' +
             '<i class="ix-info-i" style="background:#C4A35A !important;color:#1A3A3A !important">i</i>' +
             (o.version ? '<span class="ix-info-v">v' + esc(o.version) + '</span>' : '') +
           '</button>';
  }

  function removePop() {
    var p = document.getElementById(POP_ID);
    if (p) p.parentNode.removeChild(p);
  }

  function openPop(btn, data) {
    removePop();
    var pop = document.createElement('div');
    pop.id = POP_ID;
    pop.className = 'ix-info-pop';
    /* Critical styles inline-!important: this popover must survive
       the page wildcards no matter which wrapper summoned it. */
    [['position', 'fixed'], ['z-index', '99990'], ['width', '340px'],
     ['max-width', 'calc(100vw - 24px)'], ['box-sizing', 'border-box'],
     ['background', '#FFFFFF'], ['color', '#1E2A3A'],
     ['border', '1px solid #E4E0D4'], ['border-radius', '10px'],
     ['box-shadow', '0 12px 32px rgba(20,48,47,.22)'],
     ['padding', '14px 16px'], ['text-align', 'left']
    ].forEach(function (kv) { pop.style.setProperty(kv[0], kv[1], 'important'); });

    var scen = '';
    if (data.scenarios && data.scenarios.length) {
      scen = '<div class="ix-info-h">Make scenarios</div>';
      for (var i = 0; i < data.scenarios.length; i++) {
        var s = data.scenarios[i] || {};
        scen += '<div class="ix-info-s"><b>' + esc(s.name || '') + '</b>' +
                (s.note ? ' — ' + esc(s.note) : '') + '</div>';
      }
    }
    pop.innerHTML =
      (data.title ? '<div class="ix-info-t">' + esc(data.title) + '</div>' : '') +
      (data.file
        ? '<div class="ix-info-f">' + esc(data.file) +
          (data.companions ? ' · ' + esc(data.companions) : '') + '</div>'
        : '') +
      (data.blurb ? '<div class="ix-info-b">' + esc(data.blurb) + '</div>' : '') +
      scen;

    document.body.appendChild(pop);

    /* Below the badge, right-aligned to it, clamped to the viewport. */
    var r = btn.getBoundingClientRect();
    var w = pop.offsetWidth, h = pop.offsetHeight;
    var left = Math.max(12, Math.min(r.right - w, window.innerWidth - w - 12));
    var top = r.bottom + 8;
    if (top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - 8);
    pop.style.setProperty('left', Math.round(left) + 'px', 'important');
    pop.style.setProperty('top', Math.round(top) + 'px', 'important');
  }

  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('[data-ix-info]');
    if (b) {
      e.preventDefault(); e.stopPropagation();
      var open = document.getElementById(POP_ID);
      if (open) { removePop(); return; }        /* toggle */
      var data = {};
      try { data = JSON.parse(b.getAttribute('data-ix-info') || '{}'); } catch (_) {}
      openPop(b, data);
      return;
    }
    if (document.getElementById(POP_ID) &&
        !(e.target && e.target.closest && e.target.closest('#' + POP_ID))) {
      removePop();
    }
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') removePop();
  });
  window.addEventListener('scroll', removePop, true);
  window.addEventListener('resize', removePop);

  window.IxInfo = { badge: badge, close: removePop, version: '1.0.1' };
})();
