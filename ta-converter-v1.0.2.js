/* ============================================================
   ta-converter-v1.0.0.js → ta-converter-v1.0.1.js → v1.0.2.js
   INBXIFY File Converter — Standalone module

   v1.0.2 (S13 Step 3 polish — Save-as-Component placeholder):
     Adds a disabled "Save as Component" button to the success
     state, alongside the existing Download button. Same
     placeholder pattern as Transcriber's sct-mode-comp button
     (ta-page-body v1.2.16+):
       - native [disabled] attribute (browser dims, blocks click)
       - title="..." tooltip describing the future behavior
       - ix-btn ix-btn--secondary class for visual styling
       - placed in the success state's .cm-conv-actions row, to
         the right of the Download button

     Forget-me-not for Step 4b — Save-as-Component for Converter
     images. Working implementation arrives after Step 4 closes:
       - Reuses the Step 4 overlay shell (title field, Cancel
         revert, optimistic Studio render)
       - Adds a role picker (all 11 componentRole options per
         Q-V lock)
       - Manual title only — no AI suggest for images per Q-W
       - New Scenario B route createMediaImage that uploads the
         reduced blob to Uploadcare, then creates a MEDIA row
         with the image URL + role + status='available'
       - Title AI-suggest deferred — image-naming via vision is
         not the right place to spend tokens for this surface

     The placeholder button is intentionally non-functional. The
     conversion still produces a downloadable file; users still
     get the Download button as the primary success path. Save
     as Component is a forget-me-not for the team that we have
     a planned Phase 4 / Step 4b implementation.

     No CSS changes. No CMS schema changes. No Scenario changes.

     Webflow head deploy:
       SWAP: ta-converter-v1.0.1.js → ta-converter-v1.0.2.js
       (no other file changes — title-admin-page-design stays
        at v1.4.12, ix-buttons stays at v1.0.4)

   v1.0.1 (S13 Step 3 polish — button system migration):
     v1.0.0 emitted Converter buttons with the legacy
     .cm-conv-go class only. Same Webflow chrome cascade bug
     that bit .sct-tx-btn (Transcribe) and .cmp-btn--primary
     and .rte-img-upload-btn — Webflow's stricter button
     reset drops `background` on <button> elements without
     !important. Result on Wyckoff: Reduce Now / Reduce Anyway
     button rendered transparent and invisible (only the
     inline-styled Clear button was visible).

     Fix in v1.0.1: additive class migration to canonical
     ix-btn ix-btn--* system. Three button emits updated:

       .cm-conv-go (Reduce Now / Reduce Anyway)
         → ix-btn ix-btn--primary
         Primary CTA. Inline-style fallback removed.

       .cm-conv-go (✕ Clear)
         → ix-btn ix-btn--danger ix-btn--ghost  (soft danger)
         Inline `style="background:transparent;color:#c0392b;
         border:1px solid #e8e4d8"` REMOVED — soft-danger
         variant provides the same visual via the canonical
         module.

       .cm-conv-go.download (Download <filename>)
         → ix-btn ix-btn--primary ix-btn--gold
         Gold-tint primary, matches "Assign N files" pattern
         used in UP. Stronger affordance for the success-state
         download.

     Legacy classes (.cm-conv-go, .cm-conv-go.download) stay
     on the markup for additive-migration safety. Their
     unscoped visual rules in title-admin-page-design v1.4.12
     remain harmlessly — the ix-buttons module wins the
     cascade via its specificity + !important armor.

     v1.0.1 also pairs with title-admin-page-design v1.4.12,
     which fixes a Bug 2 in the Converter preview: portrait
     and landscape source images were rendering distorted in
     the .cm-conv-thumb element due to missing width/height
     auto + object-fit. CSS-side fix; no JS change for that.

     Webflow head deploy:
       SWAP: ta-converter-v1.0.0.js → ta-converter-v1.0.1.js
       SWAP: title-admin-page-design-v1.4.11.css → v1.4.12.css

   v1.0.0 (S13 Step 3 — Converter migration into Studio Tab 5):
     Lifted from uploads-processor-v1.0.9 §renderConverter (80
     lines, fully self-contained — no dependencies on UP state).
     Now lives in its own file so it can be maintained
     independently and survives the S15 UP decommission without
     relocation.

     Public API:
       window.InbxConverter.version        — '1.0.0'
       window.InbxConverter.mount(selector) — mount into a DOM
         element matching the selector. Idempotent: multiple
         calls with the same selector are no-ops after the first
         successful mount (uses dataset.mounted as a guard).

     Self-activation:
       Listens for window 'std:panel:converter' CustomEvent
       (dispatched by ta-studio-v1.2.10+ when Studio Tab 5 is
       activated). When fired, mounts into #std-converter-mount
       automatically. ta-studio doesn't need to know about
       InbxConverter — same self-mounting pattern as Transcriber
       (which mounts itself into #std-transcriber-mount via
       SECTION 5 in ta-page-body).

     CSS classes used (preserved from UP for visual parity):
       .cm-conv, .cm-conv-title, .cm-conv-sub, .cm-conv-tools,
       .cm-conv-tool, .cm-conv-tool-icon, .cm-conv-tool-label,
       .cm-conv-tool-desc, .cm-conv-workspace, .cm-conv-drop,
       .cm-conv-preview, .cm-conv-thumb, .cm-conv-info,
       .cm-conv-info-row, .cm-conv-info-label, .cm-conv-info-val,
       .cm-conv-actions, .cm-conv-go, .cm-conv-status,
       .cm-conv-progress, .cm-conv-progress-bar,
       .cm-conv-result, .cm-conv-result-title.
       Class rename to .cnv-* deferred to S15 / TD-163.

     Webflow head deploy:
       NEW: <script src=".../ta-converter-v1.0.0.js"></script>
       Load order: anywhere after ta-studio (which provides the
       std:panel:converter event source). Recommend adding right
       after ta-page-body in the <body> script list.

   Behavior preserved verbatim from UP v1.0.9:
     - Single conversion tool: "Reduce JPEG to Under 4MB"
     - Drag-drop OR click-to-browse to load a JPEG
     - Resize to 1400px wide (preserving aspect ratio)
     - Iterative quality compression: starts at 92%, drops 5%
       per iteration until file is ≤4MB or quality hits 40%
     - Filename appended with "-reduced" before extension
     - Browser-side download via URL.createObjectURL
     - All processing local; no Make.com or Anthropic call
   ============================================================ */

(function () {
  'use strict';

  const VERSION = '1.0.2';

  // Local HTML escape helper. Duplicated from UP for self-contained
  // module — 3 lines, no downside to copying.
  const esc = s => (s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');

  // ──────────────────────────────────────────────────────────
  // Renderer — lifted verbatim from uploads-processor-v1.0.9.
  // Behavior unchanged. Only the mount-target lookup is now
  // a parameter rather than hardcoded #cm-converter-panel.
  // ──────────────────────────────────────────────────────────
  function renderConverter(targetEl) {
    const el = targetEl || document.getElementById('cm-converter-panel');
    if (!el) return;
    if (el.dataset.mounted === 'true') return;
    el.dataset.mounted = 'true';

    el.innerHTML = `<div class="cm-conv">
      <div class="cm-conv-title">File Converter</div>
      <div class="cm-conv-sub">Select a conversion tool</div>
      <div class="cm-conv-tools">
        <div class="cm-conv-tool active"><span class="cm-conv-tool-icon">\u{1F5BC}\uFE0F</span><div><div class="cm-conv-tool-label">Reduce JPEG to Under 4MB</div><div class="cm-conv-tool-desc">Resize to 1400px wide + compress</div></div></div>
      </div>
      <div class="cm-conv-workspace" id="cm-conv-ws">
        <div class="cm-conv-drop" id="cm-conv-drop"><div class="cm-conv-drop-icon">\u{1F5BC}\uFE0F</div><div class="cm-conv-drop-text">Drop a JPEG here or click to browse</div><div class="cm-conv-drop-hint">Accepts .jpg / .jpeg files</div></div>
        <input type="file" id="cm-conv-file" accept="image/jpeg,image/jpg" style="display:none">
      </div>
    </div>`;

    const dropZone = document.getElementById('cm-conv-drop');
    const fileInput = document.getElementById('cm-conv-file');
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); const f = e.dataTransfer.files[0]; if (f && (f.type === 'image/jpeg' || f.type === 'image/jpg')) convLoadFile(f); });
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) convLoadFile(fileInput.files[0]); fileInput.value = ''; });

    let convFile = null;

    function convLoadFile(file) {
      convFile = file;
      const ws = document.getElementById('cm-conv-ws');
      const sizeMB = (file.size / 1e6).toFixed(2);
      const isOver = file.size > 4e6;
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          ws.innerHTML = `<div class="cm-conv-preview"><img src="${ev.target.result}" class="cm-conv-thumb" alt="Preview"><div class="cm-conv-info"><div class="cm-conv-info-row"><span class="cm-conv-info-label">Filename</span><span class="cm-conv-info-val">${esc(file.name)}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Original Size</span><span class="cm-conv-info-val ${isOver ? 'bad' : 'ok'}">${sizeMB} MB${isOver ? ' \u2014 over 4MB' : ' \u2014 under 4MB'}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Dimensions</span><span class="cm-conv-info-val">${img.width} \u00D7 ${img.height}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Target</span><span class="cm-conv-info-val">Under 4MB, max 1400px wide</span></div><div class="cm-conv-actions"><button class="cm-conv-go ix-btn ix-btn--primary" id="cm-conv-go">${isOver ? 'Reduce Now' : 'Reduce Anyway'}</button><button class="cm-conv-go ix-btn ix-btn--danger ix-btn--ghost" id="cm-conv-reset">\u2715 Clear</button><span class="cm-conv-status" id="cm-conv-status"></span></div><div class="cm-conv-progress" id="cm-conv-progress" style="display:none"><div class="cm-conv-progress-bar" id="cm-conv-bar" style="width:0%"></div></div><div id="cm-conv-result"></div></div></div>`;
          document.getElementById('cm-conv-go').addEventListener('click', () => convProcess(img, file.name));
          document.getElementById('cm-conv-reset').addEventListener('click', () => convReset());
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }

    function convProcess(img, filename) {
      const statusEl = document.getElementById('cm-conv-status'),
            progEl   = document.getElementById('cm-conv-progress'),
            barEl    = document.getElementById('cm-conv-bar'),
            goBtn    = document.getElementById('cm-conv-go'),
            resultEl = document.getElementById('cm-conv-result');
      goBtn.disabled = true;
      progEl.style.display = '';
      statusEl.textContent = 'Processing\u2026';
      const MAX_W = 1400;
      let w = img.width, h = img.height;
      if (w > MAX_W) { const ratio = MAX_W / w; w = MAX_W; h = Math.round(img.height * ratio); }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      barEl.style.width = '30%';
      let quality = 0.92;
      const TARGET = 4 * 1024 * 1024;
      function tryCompress() {
        statusEl.textContent = 'Compressing at ' + Math.round(quality * 100) + '% quality\u2026';
        barEl.style.width = (30 + (0.92 - quality) / 0.52 * 60) + '%';
        canvas.toBlob(b => {
          if (!b) { statusEl.textContent = 'Compression failed'; goBtn.disabled = false; return; }
          if (b.size <= TARGET || quality <= 0.40) {
            barEl.style.width = '100%';
            const newSizeMB = (b.size / 1e6).toFixed(2);
            const savings = convFile ? Math.round((1 - b.size / convFile.size) * 100) : 0;
            statusEl.textContent = '';
            const newName = filename.replace(/\.(jpe?g)$/i, '-reduced.$1');
            resultEl.innerHTML = `<div class="cm-conv-result"><div class="cm-conv-result-title">\u2705 Conversion Complete</div><div class="cm-conv-info-row"><span class="cm-conv-info-label">New Size</span><span class="cm-conv-info-val ok">${newSizeMB} MB</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">New Dimensions</span><span class="cm-conv-info-val">${w} \u00D7 ${h}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Quality</span><span class="cm-conv-info-val">${Math.round(quality * 100)}%</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Savings</span><span class="cm-conv-info-val ok">${savings}% smaller</span></div><div class="cm-conv-actions" style="margin-top:10px"><button class="cm-conv-go download ix-btn ix-btn--primary ix-btn--gold" id="cm-conv-download">\u2B07 Download ${esc(newName)}</button><button class="cm-conv-save-comp ix-btn ix-btn--secondary" id="cm-conv-save-comp" disabled title="Coming in Phase 4 \u2014 save reduced image as a reusable component (Step 4b)">\u25A3 Save as Component</button></div></div>`;
            document.getElementById('cm-conv-download').addEventListener('click', () => {
              const url = URL.createObjectURL(b);
              const a = document.createElement('a');
              a.href = url; a.download = newName; a.click();
              URL.revokeObjectURL(url);
            });
            return;
          }
          quality -= 0.05;
          setTimeout(tryCompress, 50);
        }, 'image/jpeg', quality);
      }
      setTimeout(tryCompress, 100);
    }

    function convReset() {
      convFile = null;
      // Clear the mounted flag so the next renderConverter()
      // call re-renders the empty drop-zone state into the same
      // target element.
      el.dataset.mounted = '';
      renderConverter(el);
    }
  }

  // ──────────────────────────────────────────────────────────
  // Public API + self-activation
  // ──────────────────────────────────────────────────────────
  window.InbxConverter = {
    version: VERSION,
    mount: function (selector) {
      const target = (typeof selector === 'string')
        ? document.querySelector(selector)
        : selector;
      if (!target) return false;
      renderConverter(target);
      return true;
    }
  };

  // Self-activation: listen for Studio Tab 5 activation.
  // ta-studio-v1.2.10+ dispatches std:panel:converter on window
  // when the user clicks Tab 5. We mount on the first activation
  // and the dataset.mounted guard makes subsequent activations
  // no-ops (until convReset clears the guard).
  window.addEventListener('std:panel:converter', function () {
    window.InbxConverter.mount('#std-converter-mount');
  });

  console.log('\u21BB InbxConverter v' + VERSION + ' loaded (S13 Step 3 polish — standalone module; ix-btn migration; Save-as-Component placeholder added; self-mounts on std:panel:converter)');
})();
