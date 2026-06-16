/* ============================================================
   ta-converter-v1.0.5.js
   INBXIFY File Converter — Standalone module

   v1.0.5 (Upscale preview render + transparent-bg toggle):
     The v1.0.4 upscale result showed only text stats — no image.
     Now both the staged source and the upscaled result render in
     preview panes with a checkered backing (default), plus a
     Checker / Dark / Light background toggle. Transparent PNGs
     (e.g. white-on-transparent logos) are visible against the
     checker instead of vanishing into the white workspace.
     Self-contained <style> injected once (no companion CSS file).
     HC-UPS series unchanged.

     Webflow head deploy:
       SWAP: ta-converter-v1.0.4.js → ta-converter-v1.0.5.js

   ─────────────────────────────────────────────────────────────
   v1.0.4 (NEW — Upscale tool + Save to Media Library):
     Adds a third tool "Upscale Image" using the existing
     upscaleinbxifycom Cloudflare Worker (WaveSpeed Real-ESRGAN
     v3). Unlike Reduce/SVG (pure browser-canvas), Upscale is an
     async server call: read file → base64 → POST to Worker →
     Worker uploads source to Uploadcare, runs Real-ESRGAN, polls,
     re-uploads result to Uploadcare → returns finished Uploadcare
     URL. ~13s typical.

     Success state offers TWO outputs (the documented ask):
       • Download to computer — fetch the upscaled URL, browser
         download (parity with Reduce/SVG).
       • Save to Media Library — POST the Uploadcare URL to
         Scenario B (createMediaFromBrowserUpload action, same
         contract ASF uses) → creates an Available MEDIA row →
         dispatches std:panel:components so the Components tab
         refreshes. Component Role left empty at create (assigned
         later via ASF/Assembler), per the empty-at-create rule.

     Hardcoding (HC-UPS series — shared with the Worker spec):
       HC-UPS-001 — Worker endpoint hardcoded here:
                    https://upscaleinbxifycom.jeff-2cd.workers.dev/
                    Move to TA_CONFIG.upscaleWorker when that key
                    is added to the page config. Code already
                    prefers TA_CONFIG.upscaleWorker if present.
       HC-UPS-002 — default scale = 2 (caller intent; v3 applies
                    its own default).
       HC-UPS-004 — max input = 10 MB base64 (matches Worker cap;
                    rejected client-side before the POST).
       HC-UPS-011 — Save to Media Library uses Scenario B action
                    'createMediaFromBrowserUpload' via
                    TA_CONFIG.makeConditioner — same route ASF and
                    the RTE already use. No new Make work.

     No CSS changes (reuses .cm-conv-* + ix-btn chrome; the two
     output buttons reuse existing button classes). No CMS schema
     changes. No new Make scenario. No new Worker.

     Webflow head deploy:
       SWAP: ta-converter-v1.0.3.js → ta-converter-v1.0.4.js

   ─────────────────────────────────────────────────────────────
   v1.0.3 (SVG to JPEG conversion tool):
     INBXIFY File Converter — Standalone module

   v1.0.3 (NEW — SVG to JPEG conversion tool):
     Adds a second conversion tool "Convert SVG to JPEG"
     alongside the existing "Reduce JPEG to Under 4MB" tool.

     Behavior:
       - Two .cm-conv-tool cards in the tools row. Click to
         switch the active tool. Switching while a file is
         staged resets state (different MIME, different flow).
       - Default active tool = Reduce (first card; preserves
         v1.0.2 first-mount behavior).
       - Drop zone accept= attribute and hint text update
         based on the active tool.
       - SVG path: rasterize SVG into <canvas>, fill background
         opaque white, resize to 1400px on longest side, export
         as JPEG at 92% quality. Browser-canvas only — no Make
         hop, no Worker, no CloudConvert. Output is a downloadable
         JPEG (same shape as the Reduce success state).
       - Tainted canvas (SVG references external <image href>
         that fails CORS) → caught and rendered as an inline
         error in the .cm-conv-result slot with operator guidance.

     Hardcoding decisions logged (HC-CONV series):
       HC-CONV-001 — SVG output max dimension = 1400px longest
                     side. Matches Scenario B Route 2's existing
                     CloudConvert config and Reduce's max width
                     so converted assets from both paths look
                     identical at use-time.
       HC-CONV-002 — SVG transparent-background fill = #FFFFFF
                     fully opaque. JPEG has no alpha channel;
                     pure white is the most universally
                     compatible destination color (white email
                     bodies, white print backgrounds, etc).
                     Off-white or near-transparent fills become
                     visible the moment the asset lands on a
                     true-white background. If a softer feel is
                     ever needed against cream UI, that's a
                     CSS/presentation decision, not an encoding
                     decision.
       HC-CONV-003 — SVG→JPEG output quality = 0.92. Matches
                     Reduce's starting quality. Single-shot
                     export — no iterative compression needed
                     since rasterized logos/badges produce small
                     JPEGs well under any size target.
       HC-CONV-004 — Output filename pattern = {name}-converted.jpg
                     Mirrors Reduce's "-reduced" suffix. Prevents
                     source/output confusion when both files
                     sit in the operator's Downloads folder.

     Architecture (May 17, 2026):
       Pure browser-side conversion. SVG file → FileReader →
       <img> → <canvas> (with white fill) → toBlob('image/jpeg').
       No server call. Scenario B Route 2 (SVG via CloudConvert,
       Drive-intake path) is NOT touched by this work and
       remains the conditioning path for SVGs that arrive via
       publisher Drive folders. TD-172 (Route 2 end-to-end
       validation) is a separate task and is NOT a dependency
       of this feature shipping.

     Why browser-canvas instead of routing through Scenario B:
       Operator-side Converter actions are one-off tools, not
       pipeline events. Browser-canvas handles ~99% of real
       SVGs (publisher logos, badges, vector graphics with
       embedded styles) with zero ops cost and instant turnaround.
       The 1% case (SVG references external CORS-blocked images)
       fails cleanly with a clear operator action: flatten the
       SVG in the source editor, or route via Drive intake.
       Per platform §10.8 (Direct-browser pattern) — Workers and
       Make scenarios exist only where server-side capability
       (secrets, heavy lifting) is genuinely required. Canvas
       rasterization needs neither.

     UI rule conformance (per platform rules May 2026):
       - Cancel revert: existing "✕ Clear" button (cm-conv-reset)
         serves the cancel role for staged-file state. Reuses
         v1.0.2 pattern.
       - Dropdown gold-border dirty-state rule: N/A — no select
         controls in this surface.
       - Persistent selection across edits: N/A — single-action
         tool, no multi-step edit state.

     No CSS changes (reuses entire .cm-conv-* + ix-btn chrome).
     No Make scenario changes.
     No CMS schema changes.
     No Worker.

     Webflow head deploy:
       SWAP: ta-converter-v1.0.2.js → ta-converter-v1.0.3.js
       (no other file changes — title-admin-page-design stays
        at v1.4.13, ix-buttons stays at v1.0.4)

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

   v1.0.1 (S13 Step 3 polish — button system migration):
     Additive class migration to canonical ix-btn ix-btn--*
     system for Reduce / Clear / Download buttons. Legacy
     .cm-conv-go classes stay on the markup for additive-
     migration safety. Pairs with title-admin-page-design
     v1.4.12 (Bug 2 thumb aspect-ratio fix).

   v1.0.0 (S13 Step 3 — Converter migration into Studio Tab 5):
     Lifted from uploads-processor-v1.0.9 §renderConverter (80
     lines, fully self-contained — no dependencies on UP state).
     Public API: window.InbxConverter.{version,mount}.
     Self-activation on window 'std:panel:converter' CustomEvent.
   ============================================================ */

(function () {
  'use strict';

  const VERSION = '1.0.5';

  // HC-UPS-001 — upscale Worker endpoint. Prefer TA_CONFIG.upscaleWorker
  // when present; fall back to the hardcoded production URL.
  const UPSCALE_WORKER_URL =
    (window.TA_CONFIG && window.TA_CONFIG.upscaleWorker) ||
    'https://upscaleinbxifycom.jeff-2cd.workers.dev/';
  const UPSCALE_MAX_BYTES = 10 * 1024 * 1024;  // HC-UPS-004
  const UPSCALE_DEFAULT_SCALE = 2;             // HC-UPS-002

  // Local HTML escape helper. Duplicated from UP for self-contained
  // module — 3 lines, no downside to copying.
  const esc = s => (s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');

  // ── v1.0.5: preview styles (injected once) ──
  function injectUpscaleStyles() {
    if (document.getElementById('cm-upscale-styles')) return;
    const st = document.createElement('style');
    st.id = 'cm-upscale-styles';
    st.textContent = [
      '.cm-ups-panes{display:flex;gap:14px;align-items:stretch;margin:4px 0 14px;}',
      '.cm-ups-col{flex:1;min-width:0;}',
      '.cm-ups-arrow{display:flex;align-items:center;font-size:18px;color:#5b7fff;}',
      '.cm-ups-lbl{font-family:\'DM Mono\',ui-monospace,monospace;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:#8a8a7a;margin-bottom:5px;}',
      '.cm-ups-lbl.is-out{color:#5b7fff;font-weight:600;}',
      '.cm-ups-pane{position:relative;width:100%;height:140px;border-radius:6px;overflow:hidden;border:1px solid #d4cfbf;}',
      '.cm-ups-pane.is-out{border:1.5px solid #5b7fff;}',
      '.cm-ups-pane .cm-ups-bg{position:absolute;inset:0;background-color:#f4f1ea;background-image:linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0;}',
      '.cm-ups-pane.bg-dark .cm-ups-bg{background-image:none;background-color:#1a3a3a;}',
      '.cm-ups-pane.bg-light .cm-ups-bg{background-image:none;background-color:#ffffff;}',
      '.cm-ups-pane img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:8px;box-sizing:border-box;}',
      '.cm-ups-bgtoggle{display:flex;align-items:center;gap:8px;margin-bottom:14px;}',
      '.cm-ups-bgtoggle .lbl{font-family:\'DM Mono\',ui-monospace,monospace;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:#8a8a7a;}',
      '.cm-ups-bgbtn{font-size:11px;padding:4px 10px;border-radius:12px;border:1px solid #d4cfbf;background:#fff;color:#1a3a3a;cursor:pointer;}',
      '.cm-ups-bgbtn.active{border:2px solid #5b7fff;background:#EEF2FF;color:#5b7fff;font-weight:600;padding:3px 9px;}'
    ].join('');
    document.head.appendChild(st);
  }

  // Wire the Checker/Dark/Light toggle for whatever .cm-ups-pane nodes exist.
  function wireBgToggle(scope) {
    const root = scope || document;
    const btns = root.querySelectorAll('.cm-ups-bgbtn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-bg');
        root.querySelectorAll('.cm-ups-pane').forEach(p => {
          p.classList.remove('bg-dark','bg-light');
          if (mode === 'dark') p.classList.add('bg-dark');
          if (mode === 'light') p.classList.add('bg-light');
        });
        btns.forEach(b => b.classList.toggle('active', b === btn));
      });
    });
  }


  // ──────────────────────────────────────────────────────────
  // Tool registry. Each entry describes one conversion tool:
  // its card content, drop-zone affordances, and the file types
  // it accepts. Add new tools here in the future (HEIC→JPEG,
  // PDF page extract, etc) without touching the renderer.
  // ──────────────────────────────────────────────────────────
  const TOOLS = {
    reduce: {
      icon: '\u{1F5BC}\uFE0F',
      label: 'Reduce JPEG to Under 4MB',
      desc: 'Resize to 1400px wide + compress',
      accept: 'image/jpeg,image/jpg',
      hint: 'Drop a JPEG here or click to browse',
      hintAccept: 'Accepts .jpg / .jpeg files',
      validate: f => f.type === 'image/jpeg' || f.type === 'image/jpg'
    },
    svg: {
      icon: '\u{1F58C}\uFE0F',
      label: 'Convert SVG to JPEG',
      desc: 'Rasterize to 1400px JPEG, white bg',
      accept: 'image/svg+xml,.svg',
      hint: 'Drop an SVG here or click to browse',
      hintAccept: 'Accepts .svg files',
      validate: f => f.type === 'image/svg+xml' || /\.svg$/i.test(f.name)
    },
    upscale: {
      icon: '\u2728',
      label: 'Upscale Image',
      desc: 'AI super-resolution (Real-ESRGAN) 2\u00D7',
      accept: 'image/jpeg,image/jpg,image/png,image/webp',
      hint: 'Drop an image here or click to browse',
      hintAccept: 'Accepts .jpg / .png / .webp \u2014 max 10 MB',
      validate: f => /^image\/(jpeg|jpg|png|webp)$/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name)
    }
  };

  // ──────────────────────────────────────────────────────────
  // Renderer
  // Closure-scoped state per mount: activeTool + convFile.
  // Tool switching and Clear both re-call renderConverter() with
  // the dataset.mounted guard cleared — the new closure gets fresh
  // state, but the activeTool argument is threaded through so
  // selection persists across resets.
  // ──────────────────────────────────────────────────────────
  function renderConverter(targetEl, initialTool) {
    const el = targetEl || document.getElementById('cm-converter-panel');
    if (!el) return;
    if (el.dataset.mounted === 'true') return;
    el.dataset.mounted = 'true';
    injectUpscaleStyles();

    let activeTool = (initialTool && TOOLS[initialTool]) ? initialTool : 'reduce';
    let convFile = null;

    el.innerHTML = buildShell(activeTool);
    wireToolCards();
    wireDropZone();

    // ── Shell builder ──
    function buildShell(toolId) {
      const t = TOOLS[toolId];
      return `<div class="cm-conv">
        <div class="cm-conv-title">File Converter</div>
        <div class="cm-conv-sub">Select a conversion tool</div>
        <div class="cm-conv-tools">
          ${renderToolCard('reduce', toolId === 'reduce')}
          ${renderToolCard('svg', toolId === 'svg')}
          ${renderToolCard('upscale', toolId === 'upscale')}
        </div>
        <div class="cm-conv-workspace" id="cm-conv-ws">
          <div class="cm-conv-drop" id="cm-conv-drop"><div class="cm-conv-drop-icon">${t.icon}</div><div class="cm-conv-drop-text">${esc(t.hint)}</div><div class="cm-conv-drop-hint">${esc(t.hintAccept)}</div></div>
          <input type="file" id="cm-conv-file" accept="${t.accept}" style="display:none">
        </div>
      </div>`;
    }

    function renderToolCard(toolId, isActive) {
      const t = TOOLS[toolId];
      return `<div class="cm-conv-tool${isActive ? ' active' : ''}" data-tool="${toolId}"><span class="cm-conv-tool-icon">${t.icon}</span><div><div class="cm-conv-tool-label">${esc(t.label)}</div><div class="cm-conv-tool-desc">${esc(t.desc)}</div></div></div>`;
    }

    // ── Tool card click → switch active tool ──
    // Switching always resets staged state. Different MIME, different
    // flow — carrying a JPEG over to the SVG tool would only confuse.
    function wireToolCards() {
      el.querySelectorAll('.cm-conv-tool[data-tool]').forEach(card => {
        card.addEventListener('click', () => {
          const newTool = card.dataset.tool;
          if (newTool === activeTool) return;
          convFile = null;
          el.dataset.mounted = '';
          renderConverter(el, newTool);
        });
      });
    }

    // ── Drop zone wiring (drag + click-to-browse) ──
    function wireDropZone() {
      const dropZone = document.getElementById('cm-conv-drop');
      const fileInput = document.getElementById('cm-conv-file');
      dropZone.addEventListener('click', () => fileInput.click());
      dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const f = e.dataTransfer.files[0];
        if (f && TOOLS[activeTool].validate(f)) loadFile(f);
      });
      fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) loadFile(fileInput.files[0]);
        fileInput.value = '';
      });
    }

    // ── Loader dispatcher ──
    function loadFile(file) {
      convFile = file;
      if (activeTool === 'svg') loadFileSvg(file);
      else if (activeTool === 'upscale') loadFileUpscale(file);
      else loadFileReduce(file);
    }

    // ──────────────────────────────────────────────────────────
    // Reduce path (unchanged from v1.0.2 — verbatim)
    // ──────────────────────────────────────────────────────────
    function loadFileReduce(file) {
      const ws = document.getElementById('cm-conv-ws');
      const sizeMB = (file.size / 1e6).toFixed(2);
      const isOver = file.size > 4e6;
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          ws.innerHTML = `<div class="cm-conv-preview"><img src="${ev.target.result}" class="cm-conv-thumb" alt="Preview"><div class="cm-conv-info"><div class="cm-conv-info-row"><span class="cm-conv-info-label">Filename</span><span class="cm-conv-info-val">${esc(file.name)}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Original Size</span><span class="cm-conv-info-val ${isOver ? 'bad' : 'ok'}">${sizeMB} MB${isOver ? ' \u2014 over 4MB' : ' \u2014 under 4MB'}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Dimensions</span><span class="cm-conv-info-val">${img.width} \u00D7 ${img.height}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Target</span><span class="cm-conv-info-val">Under 4MB, max 1400px wide</span></div><div class="cm-conv-actions"><button class="cm-conv-go ix-btn ix-btn--primary" id="cm-conv-go">${isOver ? 'Reduce Now' : 'Reduce Anyway'}</button><button class="cm-conv-go ix-btn ix-btn--danger ix-btn--ghost" id="cm-conv-reset">\u2715 Clear</button><span class="cm-conv-status" id="cm-conv-status"></span></div><div class="cm-conv-progress" id="cm-conv-progress" style="display:none"><div class="cm-conv-progress-bar" id="cm-conv-bar" style="width:0%"></div></div><div id="cm-conv-result"></div></div></div>`;
          document.getElementById('cm-conv-go').addEventListener('click', () => processReduce(img, file.name));
          document.getElementById('cm-conv-reset').addEventListener('click', () => resetTool());
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }

    function processReduce(img, filename) {
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

    // ──────────────────────────────────────────────────────────
    // SVG path (NEW in v1.0.3)
    // ──────────────────────────────────────────────────────────
    function loadFileSvg(file) {
      const ws = document.getElementById('cm-conv-ws');
      const sizeKB = (file.size / 1024).toFixed(1);
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          // SVGs without explicit width/height attrs report 0×0 in
          // some browsers, fall back to "unknown" label and let the
          // rasterizer use its MAX-square fallback at process time.
          const dimLabel = (img.naturalWidth && img.naturalHeight)
            ? `${img.naturalWidth} \u00D7 ${img.naturalHeight}`
            : 'unspecified (will rasterize to 1400 \u00D7 1400)';
          ws.innerHTML = `<div class="cm-conv-preview"><img src="${ev.target.result}" class="cm-conv-thumb" alt="Preview"><div class="cm-conv-info"><div class="cm-conv-info-row"><span class="cm-conv-info-label">Filename</span><span class="cm-conv-info-val">${esc(file.name)}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Original Size</span><span class="cm-conv-info-val ok">${sizeKB} KB</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Native Dimensions</span><span class="cm-conv-info-val">${dimLabel}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Target</span><span class="cm-conv-info-val">JPEG, 1400px longest side, 92%, white bg</span></div><div class="cm-conv-actions"><button class="cm-conv-go ix-btn ix-btn--primary" id="cm-conv-go">Convert to JPEG</button><button class="cm-conv-go ix-btn ix-btn--danger ix-btn--ghost" id="cm-conv-reset">\u2715 Clear</button><span class="cm-conv-status" id="cm-conv-status"></span></div><div class="cm-conv-progress" id="cm-conv-progress" style="display:none"><div class="cm-conv-progress-bar" id="cm-conv-bar" style="width:0%"></div></div><div id="cm-conv-result"></div></div></div>`;
          document.getElementById('cm-conv-go').addEventListener('click', () => processSvg(img, file.name));
          document.getElementById('cm-conv-reset').addEventListener('click', () => resetTool());
        };
        img.onerror = () => {
          ws.innerHTML = `<div class="cm-conv-preview"><div class="cm-conv-info" style="flex:1"><div class="cm-conv-result" style="background:#fdf4f4;border:1px solid #e8c4c4;margin-top:0"><div class="cm-conv-result-title" style="color:#a02020">\u26A0 Could not load SVG</div><div style="font-size:11px;color:#5a3030;line-height:1.5;margin-top:6px">The file may be malformed or not a valid SVG. Try opening it in your editor to confirm it renders correctly, then re-drop.</div><div class="cm-conv-actions" style="margin-top:10px"><button class="ix-btn ix-btn--danger ix-btn--ghost" id="cm-conv-reset">\u2715 Clear</button></div></div></div></div>`;
          document.getElementById('cm-conv-reset').addEventListener('click', () => resetTool());
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }

    function processSvg(img, filename) {
      const statusEl = document.getElementById('cm-conv-status'),
            progEl   = document.getElementById('cm-conv-progress'),
            barEl    = document.getElementById('cm-conv-bar'),
            goBtn    = document.getElementById('cm-conv-go'),
            resultEl = document.getElementById('cm-conv-result');
      goBtn.disabled = true;
      progEl.style.display = '';
      statusEl.textContent = 'Rasterizing\u2026';
      barEl.style.width = '30%';

      // HC-CONV-001: scale to MAX on longest side. Upscales tiny
      // logos so the rasterized JPEG is usable at common sizes;
      // downscales huge SVGs. If the SVG reports no native dims
      // (some authoring tools omit width/height in favor of viewBox
      // only), fall back to a MAX×MAX square — it will render at
      // whatever the viewBox aspect dictates, just at higher density.
      const MAX = 1400;
      let nativeW = img.naturalWidth || img.width || 0;
      let nativeH = img.naturalHeight || img.height || 0;
      let w, h;
      if (!nativeW || !nativeH) {
        w = MAX; h = MAX;
      } else {
        const scale = MAX / Math.max(nativeW, nativeH);
        w = Math.max(1, Math.round(nativeW * scale));
        h = Math.max(1, Math.round(nativeH * scale));
      }

      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      // HC-CONV-002: opaque white background fill. JPEG has no alpha
      // channel, so any transparency in the SVG would otherwise composite
      // against the canvas default (transparent black). Pure white is
      // safest because the asset's downstream destination is unknown.
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);

      try {
        ctx.drawImage(img, 0, 0, w, h);
      } catch (e) {
        statusEl.textContent = '';
        progEl.style.display = 'none';
        resultEl.innerHTML = svgErrorHtml('Rasterization failed.', 'The browser refused to draw this SVG to canvas. The most common cause is the SVG referencing external images from a different origin.');
        document.getElementById('cm-conv-reset').addEventListener('click', () => resetTool());
        return;
      }

      barEl.style.width = '70%';

      // HC-CONV-003: 0.92 JPEG quality, single-shot.
      canvas.toBlob(b => {
        if (!b) {
          // Tainted-canvas case. Canvas was drawable but export
          // throws because cross-origin data made it opaque to
          // readback. Browser-level error — no way around it from
          // here. Operator action: flatten/embed external images
          // in the source SVG, or route via Drive intake (which
          // hits Scenario B Route 2 / CloudConvert server-side).
          statusEl.textContent = '';
          progEl.style.display = 'none';
          resultEl.innerHTML = svgErrorHtml(
            'Conversion failed \u2014 tainted canvas.',
            'This SVG references external images that the browser can\'t read back from canvas (CORS-blocked). Open the SVG in your editor, embed the referenced images, and re-drop. If this is a publisher logo, the source file needs the images baked in. Alternatively, route the file through Drive intake \u2014 server-side conversion handles this case.'
          );
          document.getElementById('cm-conv-reset').addEventListener('click', () => resetTool());
          goBtn.disabled = false;
          return;
        }

        barEl.style.width = '100%';
        const newSizeKB = (b.size / 1024).toFixed(1);
        statusEl.textContent = '';

        // HC-CONV-004: filename pattern = {name}-converted.jpg
        const baseName = filename.replace(/\.svg$/i, '');
        const newName = `${baseName}-converted.jpg`;

        resultEl.innerHTML = `<div class="cm-conv-result"><div class="cm-conv-result-title">\u2705 Conversion Complete</div><div class="cm-conv-info-row"><span class="cm-conv-info-label">New Size</span><span class="cm-conv-info-val ok">${newSizeKB} KB</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">New Dimensions</span><span class="cm-conv-info-val">${w} \u00D7 ${h}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Quality</span><span class="cm-conv-info-val">92%</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Format</span><span class="cm-conv-info-val">JPEG (white background)</span></div><div class="cm-conv-actions" style="margin-top:10px"><button class="cm-conv-go download ix-btn ix-btn--primary ix-btn--gold" id="cm-conv-download">\u2B07 Download ${esc(newName)}</button><button class="cm-conv-save-comp ix-btn ix-btn--secondary" id="cm-conv-save-comp" disabled title="Coming in Phase 4 \u2014 save converted image as a reusable component (Step 4b)">\u25A3 Save as Component</button></div></div>`;
        document.getElementById('cm-conv-download').addEventListener('click', () => {
          const url = URL.createObjectURL(b);
          const a = document.createElement('a');
          a.href = url; a.download = newName; a.click();
          URL.revokeObjectURL(url);
        });
      }, 'image/jpeg', 0.92);
    }

    // SVG error block — inline-styled because there's no existing
    // error-result CSS pattern. Kept ad-hoc and local to this surface.
    function svgErrorHtml(title, body) {
      return `<div class="cm-conv-result" style="background:#fdf4f4;border:1px solid #e8c4c4"><div class="cm-conv-result-title" style="color:#a02020">\u26A0 ${esc(title)}</div><div style="font-size:11px;color:#5a3030;line-height:1.5;margin-top:6px">${esc(body)}</div><div class="cm-conv-actions" style="margin-top:10px"><button class="ix-btn ix-btn--danger ix-btn--ghost" id="cm-conv-reset">\u2715 Clear</button></div></div>`;
    }

    // ──────────────────────────────────────────────────────────
    // Upscale path (NEW in v1.0.4) — async Worker call
    // ──────────────────────────────────────────────────────────
    function loadFileUpscale(file) {
      const ws = document.getElementById('cm-conv-ws');
      const sizeMB = (file.size / 1e6).toFixed(2);
      const tooBig = file.size > UPSCALE_MAX_BYTES;
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const overWarn = tooBig
            ? `<div class="cm-conv-info-row"><span class="cm-conv-info-label">Limit</span><span class="cm-conv-info-val bad">Over 10 MB \u2014 reduce first</span></div>`
            : '';
          ws.innerHTML = `<div class="cm-conv-preview"><div style="flex:1"><div class="cm-ups-bgtoggle"><span class="lbl">Preview bg:</span><button class="cm-ups-bgbtn active" data-bg="checker">Checker</button><button class="cm-ups-bgbtn" data-bg="dark">Dark</button><button class="cm-ups-bgbtn" data-bg="light">Light</button></div><div class="cm-ups-col" style="max-width:280px;margin-bottom:14px"><div class="cm-ups-lbl">Source</div><div class="cm-ups-pane"><div class="cm-ups-bg"></div><img src="${ev.target.result}" alt="Source preview"></div></div><div class="cm-conv-info"><div class="cm-conv-info-row"><span class="cm-conv-info-label">Filename</span><span class="cm-conv-info-val">${esc(file.name)}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Original Size</span><span class="cm-conv-info-val ${tooBig ? 'bad' : 'ok'}">${sizeMB} MB</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Dimensions</span><span class="cm-conv-info-val">${img.width} \u00D7 ${img.height}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Target</span><span class="cm-conv-info-val">Real-ESRGAN ${UPSCALE_DEFAULT_SCALE}\u00D7 super-resolution</span></div>${overWarn}<div class="cm-conv-actions"><button class="cm-conv-go ix-btn ix-btn--primary" id="cm-conv-go"${tooBig ? ' disabled title="File exceeds 10 MB \u2014 use Reduce first"' : ''}>Upscale ${UPSCALE_DEFAULT_SCALE}\u00D7</button><button class="cm-conv-go ix-btn ix-btn--danger ix-btn--ghost" id="cm-conv-reset">\u2715 Clear</button><span class="cm-conv-status" id="cm-conv-status"></span></div><div class="cm-conv-progress" id="cm-conv-progress" style="display:none"><div class="cm-conv-progress-bar" id="cm-conv-bar" style="width:0%"></div></div><div id="cm-conv-result"></div></div></div></div>`;
          wireBgToggle(ws);
          const goBtn = document.getElementById('cm-conv-go');
          if (!tooBig) goBtn.addEventListener('click', () => processUpscale(ev.target.result, file));
          document.getElementById('cm-conv-reset').addEventListener('click', () => resetTool());
        };
        img.onerror = () => {
          ws.innerHTML = `<div class="cm-conv-preview"><div class="cm-conv-info" style="flex:1">${convErrorHtml('Could not load image', 'The file may be corrupt or an unsupported format. Try a JPEG, PNG, or WebP.')}</div></div>`;
          document.getElementById('cm-conv-reset').addEventListener('click', () => resetTool());
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }

    function processUpscale(dataUrl, file) {
      const statusEl = document.getElementById('cm-conv-status'),
            progEl   = document.getElementById('cm-conv-progress'),
            barEl    = document.getElementById('cm-conv-bar'),
            goBtn    = document.getElementById('cm-conv-go'),
            resultEl = document.getElementById('cm-conv-result');
      goBtn.disabled = true;
      progEl.style.display = '';
      statusEl.textContent = 'Upscaling\u2026 (~13s)';
      barEl.style.width = '20%';

      // Indeterminate creep while the Worker submits + polls.
      let creep = 20;
      const creepTimer = setInterval(() => {
        creep = Math.min(creep + 6, 85);
        barEl.style.width = creep + '%';
      }, 1200);

      const payload = {
        source:       { type: 'base64', data: dataUrl },
        scale:        UPSCALE_DEFAULT_SCALE,
        face_restore: false,
        context:      { source_surface: 'converter-upscale' }
      };

      fetch(UPSCALE_WORKER_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      })
        .then(r => r.json().then(j => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          clearInterval(creepTimer);
          if (!ok || !j || j.ok !== true) {
            const msg = (j && j.error && j.error.message) ? j.error.message : 'Upscale failed \u2014 try again.';
            statusEl.textContent = '';
            progEl.style.display = 'none';
            resultEl.innerHTML = convErrorHtml('Upscale failed', msg);
            document.getElementById('cm-conv-reset').addEventListener('click', () => resetTool());
            goBtn.disabled = false;
            return;
          }
          barEl.style.width = '100%';
          statusEl.textContent = '';
          const up = j.upscaled || {};
          const outUrl = up.url;
          const outUuid = up.uploadcare_uuid || '';
          const newSizeKB = up.size_bytes ? (up.size_bytes / 1024).toFixed(0) + ' KB' : '\u2014';
          const baseName = (file.name || 'image').replace(/\.(jpe?g|png|webp)$/i, '');
          const newName = baseName + '-upscaled.jpg';

          resultEl.innerHTML = `<div class="cm-conv-result"><div class="cm-conv-result-title">\u2705 Upscaled ${UPSCALE_DEFAULT_SCALE}\u00D7</div><div class="cm-ups-bgtoggle" style="margin-top:10px"><span class="lbl">Preview bg:</span><button class="cm-ups-bgbtn active" data-bg="checker">Checker</button><button class="cm-ups-bgbtn" data-bg="dark">Dark</button><button class="cm-ups-bgbtn" data-bg="light">Light</button></div><div class="cm-ups-panes"><div class="cm-ups-col"><div class="cm-ups-lbl">Original</div><div class="cm-ups-pane"><div class="cm-ups-bg"></div><img src="${dataUrl}" alt="Original"></div></div><div class="cm-ups-arrow">\u2192</div><div class="cm-ups-col"><div class="cm-ups-lbl is-out">Upscaled ${UPSCALE_DEFAULT_SCALE}\u00D7</div><div class="cm-ups-pane is-out"><div class="cm-ups-bg"></div><img src="${outUrl}" alt="Upscaled"></div></div></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">New Size</span><span class="cm-conv-info-val ok">${newSizeKB}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Vendor</span><span class="cm-conv-info-val">Real-ESRGAN (WaveSpeed)</span></div><div class="cm-conv-actions" style="margin-top:12px"><button class="ix-btn ix-btn--secondary" id="cm-conv-download">\u2B07 Download to computer</button><button class="ix-btn ix-btn--primary" id="cm-conv-save-media">\u25A3 Save to Media Library</button><button class="ix-btn ix-btn--danger ix-btn--ghost" id="cm-conv-reset">\u2715 Clear</button><span class="cm-conv-status" id="cm-conv-save-status"></span></div></div>`;
          wireBgToggle(resultEl);

          // Download — fetch the upscaled image and trigger a browser save.
          document.getElementById('cm-conv-download').addEventListener('click', () => {
            const dl = document.getElementById('cm-conv-download');
            dl.disabled = true;
            const orig = dl.textContent;
            dl.textContent = 'Downloading\u2026';
            fetch(outUrl)
              .then(r => r.blob())
              .then(b => {
                const u = URL.createObjectURL(b);
                const a = document.createElement('a');
                a.href = u; a.download = newName; a.click();
                URL.revokeObjectURL(u);
                dl.textContent = orig; dl.disabled = false;
              })
              .catch(() => { dl.textContent = orig; dl.disabled = false; });
          });

          // Save to Media Library — Scenario B createMediaFromBrowserUpload.
          document.getElementById('cm-conv-save-media').addEventListener('click', () => {
            saveToMediaLibrary({
              uploadcareUuid: outUuid,
              uploadcareUrl:  outUrl,
              fileName:       newName,
              mimeType:       'image/jpeg',
              btnId:          'cm-conv-save-media',
              statusId:       'cm-conv-save-status'
            });
          });

          document.getElementById('cm-conv-reset').addEventListener('click', () => resetTool());
        })
        .catch(err => {
          clearInterval(creepTimer);
          statusEl.textContent = '';
          progEl.style.display = 'none';
          resultEl.innerHTML = convErrorHtml('Upscale request failed', (err && err.message) ? err.message : 'Network error contacting the upscale service.');
          document.getElementById('cm-conv-reset').addEventListener('click', () => resetTool());
          goBtn.disabled = false;
        });
    }

    // ── Shared: Save to Media Library (Scenario B) ──
    // HC-UPS-011 — same action + URL contract ASF/RTE use.
    // Creates an Available MEDIA row from a hosted Uploadcare URL.
    // Component Role empty at create (assigned later in ASF/Assembler).
    function saveToMediaLibrary(opts) {
      const cfg = window.TA_CONFIG || {};
      const url = cfg.makeConditioner;
      const btn = document.getElementById(opts.btnId);
      const statusEl = document.getElementById(opts.statusId);
      if (!url) {
        if (statusEl) statusEl.textContent = 'makeConditioner URL missing in TA_CONFIG.';
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = 'Saving\u2026'; }
      if (statusEl) statusEl.textContent = '';

      const payload = {
        action:           'createMediaFromBrowserUpload',
        uploadcareUuid:   opts.uploadcareUuid,
        uploadcareUrl:    opts.uploadcareUrl,
        originalFilename: opts.fileName,
        mimeType:         opts.mimeType || 'image/jpeg',
        titleSlug:        cfg.titleSlug || '',
        taItemId:         cfg.taItemId  || '',
        componentRole:    '',          // empty at create
        autoAttach:       false,       // Converter output is loose, not article-bound
        sourceChannel:    'converter',
        source:           'ta-converter-v' + VERSION
      };

      fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      })
        .then(r => r.text().then(t => ({ ok: r.ok, t })))
        .then(({ ok, t }) => {
          let confirmed = false;
          try { const j = JSON.parse(t); if (j && j.ok === true) confirmed = true; } catch (e) {}
          if (!ok || !confirmed) throw new Error('Scenario B did not confirm the MEDIA create.');
          if (btn) { btn.textContent = '\u2705 Saved to Media Library'; }
          if (statusEl) statusEl.textContent = 'Visible in the Components tab.';
          // Refresh Components so the new row appears.
          try { window.dispatchEvent(new CustomEvent('std:panel:components')); } catch (e) {}
        })
        .catch(err => {
          if (btn) { btn.disabled = false; btn.textContent = '\u25A3 Save to Media Library'; }
          if (statusEl) statusEl.textContent = (err && err.message) ? err.message : 'Save failed \u2014 try again.';
        });
    }

    // Generic inline error block (shared by upscale; mirrors svgErrorHtml).
    function convErrorHtml(title, body) {
      return `<div class="cm-conv-result" style="background:#fdf4f4;border:1px solid #e8c4c4"><div class="cm-conv-result-title" style="color:#a02020">\u26A0 ${esc(title)}</div><div style="font-size:11px;color:#5a3030;line-height:1.5;margin-top:6px">${esc(body)}</div><div class="cm-conv-actions" style="margin-top:10px"><button class="ix-btn ix-btn--danger ix-btn--ghost" id="cm-conv-reset">\u2715 Clear</button></div></div>`;
    }

    // ── Reset (cancel) ──
    // Preserves the active tool across reset — operator stays on the
    // tool they picked, only the staged file gets cleared.
    function resetTool() {
      convFile = null;
      el.dataset.mounted = '';
      renderConverter(el, activeTool);
    }
  }

  // ──────────────────────────────────────────────────────────
  // Public API + self-activation (unchanged from v1.0.2)
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

  window.addEventListener('std:panel:converter', function () {
    window.InbxConverter.mount('#std-converter-mount');
  });

  console.log('\u21BB InbxConverter v' + VERSION + ' loaded (Upscale before/after preview + checker/dark/light bg toggle)');
})();
