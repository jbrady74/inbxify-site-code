/* ============================================================
   ta-adreformat-v1.0.0.js
   ============================================================
   INBXIFY · Studio · Generator tab · Ad Reformatter tool

   PIECE 1 of build — MOUNTING SHELL ONLY.
   Proves the tool mounts into the Generator tab and renders its
   chrome (tool chooser card + 4-step rail + Intake dropzone).
   NO extract / compose / export / save logic yet — those are
   Pieces 2-4. This file is intentionally inert past the UI shell
   so we can confirm mounting before wiring behavior.

   ── WHAT THIS IS ──
   The Ad Reformatter rebuilds an existing print ad into web ad
   creatives (700x235 banner now; 480x400 sidebar later). It is a
   GENERATION tool, so it lives in the Generator tab — not the
   Converter (which is deterministic file prep).

   ── MOUNTING (mirrors the proven Converter pattern) ──
   • Self-activates on window 'std:panel:generator' CustomEvent.
   • Mounts into #std-generator-mount (ta-studio must render that
     mount point in the Generator panel — see paired ta-studio edit;
     the panel was a permanent .std-placeholder before this tool).
   • Tool-chooser host: the Generator panel shows tool CARDS (like
     the Converter's reduce/svg/upscale chooser). Ad Reformatter is
     the first card; future Generator tools add entries to TOOLS.

   ── PUBLIC API ──
     window.InbxAdReformat.{ version, mount(selector) }

   ── BACKEND (wired in later pieces, listed for reference) ──
     extract  → ix-adreformat Worker (Claude vision; deployed, proven)
                TA_CONFIG.adReformatWorker
                  || 'https://ix-adreformat.jeff-2cd.workers.dev'
     save     → Scenario B, sourceChannel=converter, {ok:true} contract
                banner Uploadcare URL → ADS "Banner Ad Link - GET"
   ============================================================ */
(function () {
  'use strict';

  var VERSION = '1.0.0';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ── Tool registry. Mirrors the Converter's TOOLS shape so the
  //    Generator chooser behaves identically. Future Generator tools
  //    (e.g. the placeholder's "derive teaser/summary" tool) add an
  //    entry here without touching the renderer. ──
  var TOOLS = {
    adreformat: {
      icon: '\u{1F9F0}', // toolbox
      label: 'Ad Reformatter',
      desc: 'Rebuild a print ad into web ad creatives',
      accept: 'image/jpeg,image/jpg,image/png,image/webp',
      hint: 'Drop a print ad here or click to browse',
      hintAccept: 'Accepts .jpg / .png / .webp',
      validate: function (f) {
        return /^image\/(jpeg|jpg|png|webp)$/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name);
      }
    }
    // future: derive: { ... }  ("Generate fields from body text")
  };

  var STEPS = [
    { n: 1, label: 'Intake' },
    { n: 2, label: 'Extract' },
    { n: 3, label: 'Arrange' },
    { n: 4, label: 'Generate & Save' }
  ];

  // Inject styles once.
  function injectStyles() {
    if (document.getElementById('ar-styles')) return;
    var css = [
      '#std-generator-mount .ar-wrap{font-family:var(--ix-font-body,"DM Sans",system-ui,sans-serif);color:#1a3a3a}',
      '.ar-tools{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-bottom:22px}',
      '.ar-tool{border:1px solid #d4cfbf;border-radius:12px;padding:16px;background:#FAF9F5;cursor:pointer;display:flex;gap:12px;align-items:flex-start;transition:border-color .12s}',
      '.ar-tool.active{border:2px solid #5b7fff;background:#EEF2FF;padding:15px}',
      '.ar-tool-icon{font-size:22px;line-height:1}',
      '.ar-tool-label{font-size:14px;font-weight:600;color:#1a3a3a;margin-bottom:2px}',
      '.ar-tool-desc{font-size:12px;color:#3a4a3a}',
      '.ar-steps{display:flex;border:1px solid #d4cfbf;border-radius:10px;overflow:hidden;margin-bottom:20px}',
      '.ar-step{flex:1;padding:11px 12px;font-size:12px;text-align:center;color:#8a8a7a;background:#f4f1ea;border-right:1px solid #d4cfbf}',
      '.ar-step:last-child{border-right:none}',
      '.ar-step.on{background:#fff;color:#1a3a3a;font-weight:600;box-shadow:inset 0 -2px 0 #5b7fff}',
      '.ar-step .n{display:inline-flex;width:18px;height:18px;border-radius:50%;background:#d4cfbf;color:#fff;align-items:center;justify-content:center;font-size:10px;margin-right:6px;vertical-align:middle}',
      '.ar-step.on .n{background:#5b7fff}',
      '.ar-panel{border:1px solid #d4cfbf;border-radius:12px;padding:20px;background:#fff;margin-bottom:18px}',
      '.ar-panel h3{margin:0 0 4px;font-size:14px;color:#1a3a3a}',
      '.ar-panel .lead{color:#8a8a7a;font-size:12.5px;margin:0 0 14px}',
      '.ar-drop{border:2px dashed #d4cfbf;border-radius:10px;padding:30px;text-align:center;color:#8a8a7a;background:#FAF9F5;cursor:pointer}',
      '.ar-drop.drag{border-color:#5b7fff;background:#EEF2FF}',
      '.ar-drop .big{font-size:28px;margin-bottom:6px}',
      '.ar-drop .note{font-size:11px;margin-top:6px}',
      '.ar-shellnote{font-size:11px;color:#8a8a7a;font-family:var(--ix-font-mono,"DM Mono",monospace);margin-top:8px}'
    ].join('');
    var style = document.createElement('style');
    style.id = 'ar-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function toolCard(toolId, activeTool) {
    var t = TOOLS[toolId];
    var on = toolId === activeTool ? ' active' : '';
    return '<div class="ar-tool' + on + '" data-ar-tool="' + toolId + '">' +
      '<span class="ar-tool-icon">' + t.icon + '</span>' +
      '<div><div class="ar-tool-label">' + esc(t.label) + '</div>' +
      '<div class="ar-tool-desc">' + esc(t.desc) + '</div></div></div>';
  }

  function stepRail(activeStep) {
    return '<div class="ar-steps">' + STEPS.map(function (s) {
      var on = s.n === activeStep ? ' on' : '';
      return '<div class="ar-step' + on + '"><span class="n">' + s.n + '</span>' + esc(s.label) + '</div>';
    }).join('') + '</div>';
  }

  function render(target) {
    injectStyles();
    var activeTool = 'adreformat';
    var t = TOOLS[activeTool];

    target.innerHTML =
      '<div class="ar-wrap">' +
        '<div class="ar-tools">' +
          Object.keys(TOOLS).map(function (id) { return toolCard(id, activeTool); }).join('') +
        '</div>' +
        stepRail(1) +
        '<div class="ar-panel">' +
          '<h3>1 &middot; Intake</h3>' +
          '<p class="lead">Paste or upload the existing ad &mdash; a full-page print ad, flyer, or any size. The new web creatives are built from this source.</p>' +
          '<div class="ar-drop" id="ar-drop">' +
            '<div class="big">\u{1F4E5}</div>' +
            '<div>' + esc(t.hint) + '</div>' +
            '<div class="note">' + esc(t.hintAccept) + ' &middot; up to 10&nbsp;MB</div>' +
          '</div>' +
          '<div class="ar-shellnote">Ad Reformatter v' + VERSION + ' &middot; shell mounted &middot; extract/compose/save wired in later pieces</div>' +
        '</div>' +
      '</div>';

    // Minimal interactivity for the shell: drag affordance only (no
    // file handling yet — that's Piece 2).
    var drop = target.querySelector('#ar-drop');
    if (drop) {
      drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('drag'); });
      drop.addEventListener('dragleave', function () { drop.classList.remove('drag'); });
      drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('drag'); });
    }
  }

  window.InbxAdReformat = {
    version: VERSION,
    mount: function (selector) {
      var target = (typeof selector === 'string') ? document.querySelector(selector) : selector;
      if (!target) return false;
      render(target);
      return true;
    }
  };

  window.addEventListener('std:panel:generator', function () {
    window.InbxAdReformat.mount('#std-generator-mount');
  });

  console.log('\u{1F9F0} InbxAdReformat v' + VERSION + ' loaded (Generator tab \u2014 shell only; extract/compose/save in later pieces)');
})();
