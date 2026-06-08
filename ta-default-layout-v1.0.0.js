/* ============================================================================
   ta-default-layout-v1.0.0.js
   INBXIFY · T-A Studio · Default Layout tab  (Workstream K-2)

   WHAT THIS IS
   ------------
   Per-title Default Layout authoring surface. Operator builds the block order
   that every NEW issue's Picker starts from. Stored as a single JSON blob on
   TITLES-ADMIN.default-layout-json (K-1, CLOSED 2026-06-07). Read on mount,
   written on Save via the Default Layout Save scenario (one-field write,
   keyed by titleAdminId).

   PORTED FROM: inbxify-ta-default-layout-mockup-v0_8.html (design locked).
   The mockup's CSS/markup carry over verbatim (namespaced .tdl-). The mockup's
   STUBBED interactions (toast-only drag, fake state) are replaced with a real
   state model + real drag-reorder + real read/write here.

   PRODUCTION RECONCILIATIONS (locks confirmed 2026-06-08) — enforced in CODE:
     • K11  Title Masthead is newsletter chrome, NOT a block. Removed from the
            palette and the stack. If a legacy JSON carries a masthead block it
            renders greyed + locked and is STRIPPED from the saved payload.
     • K9   Photo Essay is an Article FLAG (photoEssay:true on an Article block),
            NOT a block type. No PE palette item. Surfaced as a toggle on each
            Article block. Persisted in the JSON as the block's photoEssay key.
     • K10  Local Weather is a Default Layout SWITCH, NOT a block. No LW palette
            item. Lives in the switches panel; persisted under JSON.switches.
     • Splash Ad is not in the NL block flow (code-only enforcement). Never
            offered in the palette; stripped from any inbound JSON.

   THE LOOSE EIGHT (the only block types the palette offers):
     Greeting · Article · Lead Banner Ad · Banner Ad · The Find · LBP ·
     Real Estate Section · Events Section
   (Loose→strict resolution happens at PROMOTE, not here. This file stores
   loose type LABELS as strings; it never touches strict block-type hashes.)

   JSON SHAPE (locked):
     {
       "version": 1,
       "blocks": [ { "type":"Greeting", "position":1 },
                   { "type":"Article", "position":2, "photoEssay":false }, ... ],
       "switches": { "localWeather": true }
     }

   PLATFORM INTEGRATION (matches ta-studio / ta-page-body conventions):
     • Mounts into  #std-default-layout-mount  (Studio panel mount div).
     • Listens for  'std:panel:defaultLayout'  CustomEvent to (re)mount.
     • Reads title context from window.TA_CONFIG.taItemId (titleAdminId) and
       TA_CONFIG.titleSlug / titleId for display.
     • Reads the stored blob from a hidden CMS element:
         [data-tdl-json] (text content = the default-layout-json field), OR
         window.TA_CONFIG.defaultLayoutJson if the head exposes it there.
     • Save POSTs to window.TA_CONFIG.makeDefaultLayout (Default Layout Save
       scenario). STUBBED until that URL exists — see STUB_SAVE below.

   NAMESPACE: window.TADefaultLayout  ·  CSS prefix .tdl-  ·  scoped to
   [data-tdl-root]. No globals leak; no collision with IPP / Studio.

   HARDCODE DECISIONS: none. Loose-type roster is a named constant (design
   vocabulary, not data). Strict hashes are NOT referenced here.
   ============================================================================ */
(function () {
  'use strict';

  /* ───────────────────────── config / constants ───────────────────────── */

  // Default Layout Save scenario. Wire when the Make scenario is built; until
  // then Save is STUBBED (logs payload + toast, writes nothing). Flip by
  // setting window.TA_CONFIG.makeDefaultLayout and STUB_SAVE=false.
  var STUB_SAVE = true;
  function saveRoute() {
    return (window.TA_CONFIG && window.TA_CONFIG.makeDefaultLayout) || null;
  }

  // The loose EIGHT — the only authorable block types. Order = palette order.
  // icon: short code shown in the palette chip. gold: banner-ad family styling.
  var PALETTE = [
    { type: 'Greeting',            icon: 'G',   gold: false },
    { type: 'Article',             icon: 'A',   gold: false },
    { type: 'Lead Banner Ad',      icon: 'LBA', gold: true  },
    { type: 'Banner Ad',           icon: 'BA',  gold: true  },
    { type: 'The Find',            icon: 'TXA', gold: false },
    { type: 'LBP',                 icon: 'LBP', gold: false },
    { type: 'Real Estate Section', icon: 'RE',  gold: false },
    { type: 'Events Section',      icon: 'EV',  gold: false }
  ];
  var VALID_TYPES = PALETTE.map(function (p) { return p.type; });

  // Types that may carry the photo-essay FLAG (K9). Only Article in the loose roster.
  var PHOTO_ESSAY_TYPES = { 'Article': true };

  // Types explicitly NOT allowed in the Default Layout (stripped on load + never
  // offered): Title Masthead (K11), Splash Ad (code-only), Photo Essay block
  // (K9 — it's a flag), Local Weather block (K10 — it's a switch).
  var STRIP_TYPES = {
    'Title Masthead': true, 'Splash Ad': true, 'Splash': true,
    'Photo Essay': true, 'Local Weather': true
  };

  // Switches panel definition (K10). Add future switches as JSON keys — no
  // schema migration (the blob is free-form under "switches").
  var SWITCHES = [
    { key: 'localWeather', label: 'Local Weather',
      sub: 'Show the weather strip in this title\u2019s issues' }
  ];

  var SCHEMA_VERSION = 1;

  /* ───────────────────────────── state ───────────────────────────── */

  var S = {
    mounted: false,
    root: null,
    blocks: [],        // [{type, photoEssay?}] in render order (position is implicit)
    switches: {},      // { localWeather: bool, ... }
    original: null,    // JSON string snapshot for dirty-compare + revert
    dirty: false,
    saving: false,
    legacyMasthead: false // true if inbound JSON carried a masthead we stripped
  };

  var $  = function (s, r) { return (r || S.root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || S.root).querySelectorAll(s)); };

  /* ───────────────────────── read stored JSON ───────────────────────── */

  // Returns the raw stored blob string, or '' if none on the page.
  function readStoredRaw() {
    if (window.TA_CONFIG && typeof window.TA_CONFIG.defaultLayoutJson === 'string') {
      return window.TA_CONFIG.defaultLayoutJson;
    }
    var el = document.querySelector('[data-tdl-json]');
    if (el) return (el.textContent || el.getAttribute('data-tdl-json') || '').trim();
    return '';
  }

  function titleAdminId() {
    return (window.TA_CONFIG && (window.TA_CONFIG.taItemId || window.TA_CONFIG.titleAdminId)) || '';
  }
  function titleSlug()  { return (window.TA_CONFIG && window.TA_CONFIG.titleSlug) || ''; }
  function titleName()  { return (window.TA_CONFIG && (window.TA_CONFIG.titleName || window.TA_CONFIG.titleSlug)) || 'This title'; }

  // Parse + sanitize the stored blob into S.blocks / S.switches.
  // Enforces all reconciliations on the INBOUND side so a stale/legacy JSON
  // can never reintroduce a masthead/splash/PE-block/LW-block.
  function hydrateFromStored() {
    S.blocks = [];
    S.switches = {};
    S.legacyMasthead = false;

    var raw = readStoredRaw();
    var parsed = null;
    if (raw) {
      try { parsed = JSON.parse(raw); }
      catch (e) { console.warn('[tdl] stored default-layout-json failed to parse; starting empty', e); parsed = null; }
    }

    if (parsed && Array.isArray(parsed.blocks)) {
      // sort by position if present, else keep array order
      var arr = parsed.blocks.slice().sort(function (a, b) {
        var pa = (typeof a.position === 'number') ? a.position : 1e9;
        var pb = (typeof b.position === 'number') ? b.position : 1e9;
        return pa - pb;
      });
      arr.forEach(function (b) {
        var t = (b && b.type || '').trim();
        if (!t) return;
        if (STRIP_TYPES[t]) {                 // K9/K10/K11 + splash enforcement
          if (t === 'Title Masthead') S.legacyMasthead = true;
          return;
        }
        if (VALID_TYPES.indexOf(t) < 0) {     // unknown loose type → drop, warn
          console.warn('[tdl] dropping unknown block type from stored JSON:', t);
          return;
        }
        var blk = { type: t };
        if (PHOTO_ESSAY_TYPES[t]) blk.photoEssay = !!b.photoEssay;
        S.blocks.push(blk);
      });
    }

    if (parsed && parsed.switches && typeof parsed.switches === 'object') {
      SWITCHES.forEach(function (sw) {
        S.switches[sw.key] = !!parsed.switches[sw.key];
      });
    } else {
      SWITCHES.forEach(function (sw) { S.switches[sw.key] = false; });
    }

    // snapshot for dirty-compare / revert (canonical serialized form)
    S.original = serialize();
    S.dirty = false;
  }

  /* ───────────────────────── serialize (Save shape) ───────────────────────── */

  // Produces the locked JSON shape. position is recomputed 1..N from order.
  // Masthead/splash/etc. can never appear — they're not in S.blocks.
  function serialize() {
    var blocks = S.blocks.map(function (b, i) {
      var o = { type: b.type, position: i + 1 };
      if (PHOTO_ESSAY_TYPES[b.type]) o.photoEssay = !!b.photoEssay;
      return o;
    });
    var switches = {};
    SWITCHES.forEach(function (sw) { switches[sw.key] = !!S.switches[sw.key]; });
    return JSON.stringify({ version: SCHEMA_VERSION, blocks: blocks, switches: switches });
  }

  /* ───────────────────────── dirty tracking ───────────────────────── */

  function recomputeDirty() {
    S.dirty = (serialize() !== S.original);
    reflectDirty();
  }
  function reflectDirty() {
    if (!S.root) return;
    var note = $('.tdl-dirty-note');
    var save = $('.tdl-btn.tdl-save');
    var cancel = $('.tdl-btn.tdl-cancel');
    if (note) note.hidden = !S.dirty;
    if (save) save.disabled = !S.dirty || S.saving;
    if (cancel) cancel.disabled = !S.dirty || S.saving;
  }

  /* ───────────────────────── label rules (ported) ───────────────────────── */
  // Article: always "- N" from 1. Banner Ad: "- N" from 2 (LBA is conceptually
  // #1 in the banner sequence). Others: bare if singleton, "- N" if repeated.
  function computeLabel(index) {
    var type = S.blocks[index].type;
    var total = S.blocks.filter(function (b) { return b.type === type; }).length;
    var instance = S.blocks.slice(0, index + 1).filter(function (b) { return b.type === type; }).length;
    if (type === 'Article')   return type + ' - ' + instance;
    if (type === 'Banner Ad') return type + ' - ' + (instance + 1);
    if (total === 1) return type;
    return type + ' - ' + instance;
  }

  /* ───────────────────────── render ───────────────────────── */

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function render() {
    if (!S.root) return;
    var paletteRows = PALETTE.map(function (p) {
      return '<div class="tdl-pl-item" draggable="true" data-add="' + esc(p.type) + '">' +
               '<div class="tdl-pl-ico' + (p.gold ? ' tdl-gold' : '') + '">' + esc(p.icon) + '</div>' +
               '<div class="tdl-pl-label">' + esc(p.type) + '</div>' +
             '</div>';
    }).join('');

    var switchRows = SWITCHES.map(function (sw) {
      var on = !!S.switches[sw.key];
      return '<div class="tdl-sw-row">' +
               '<div><div class="tdl-sw-label">' + esc(sw.label) + '</div>' +
                    '<div class="tdl-sw-sub">' + esc(sw.sub) + '</div></div>' +
               '<button class="tdl-toggle" type="button" data-switch="' + esc(sw.key) + '" ' +
                       'role="switch" aria-checked="' + (on ? 'true' : 'false') + '"></button>' +
             '</div>';
    }).join('');

    S.root.innerHTML =
      '<div class="tdl-toasts" data-tdl-toasts></div>' +
      '<div class="tdl-grid">' +

        // Col 1 — rail + switches
        '<aside class="tdl-rail">' +
          '<div class="tdl-tr-card">' +
            '<h4>Template</h4>' +
            '<div class="tdl-tr-name">' + esc(titleName()) + ' Default</div>' +
            '<div class="tdl-tr-sub">' + esc(titleSlug() || '\u2014') + '</div>' +
            '<div class="tdl-tr-meta">' +
              '<div class="tdl-tr-row"><span class="tdl-tr-lbl">Blocks</span><span class="tdl-tr-val" data-tdl-blockcount>' + S.blocks.length + '</span></div>' +
              '<div class="tdl-tr-row"><span class="tdl-tr-lbl">Schema</span><span class="tdl-tr-val">v' + SCHEMA_VERSION + '</span></div>' +
            '</div>' +
            '<div class="tdl-tr-status"><span class="tdl-dot"></span><span class="tdl-status-lbl">Editing</span></div>' +
          '</div>' +
          '<div class="tdl-switches">' +
            '<h4 style="margin:0 0 10px;font:700 10px var(--tdl-font-body);letter-spacing:.08em;text-transform:uppercase;color:var(--tdl-text-mid);text-align:center">Default Switches</h4>' +
            switchRows +
          '</div>' +
        '</aside>' +

        // Col 2 — palette
        '<aside class="tdl-palette">' +
          '<div class="tdl-pl-card">' +
            '<h4>Add Block</h4>' +
            '<div class="tdl-pl-list" data-tdl-palette>' + paletteRows + '</div>' +
            '<div class="tdl-pl-hint">Click or drag to add \u00b7 lands at end \u00b7 drag to reorder</div>' +
          '</div>' +
        '</aside>' +

        // Col 3 — stack
        '<div class="tdl-stack-wrap">' +
          '<div class="tdl-page-h">' +
            '<h1>Default Layout</h1>' +
            '<p>This template <b>drives what every new issue\u2019s Picker shows by default</b>. Each PubPlan starts here and can diverge per issue without affecting this template or future issues.</p>' +
            '<span class="tdl-applies">\u2605 Applies to: ' + esc(titleSlug() || titleName()) + '</span>' +
          '</div>' +
          (S.legacyMasthead
            ? '<div class="tdl-scope-note">A legacy <b>Title Masthead</b> block was found in the saved layout and removed \u2014 the masthead is now newsletter chrome, not a block. Save to clear it permanently.</div>'
            : '') +
          '<div class="tdl-ls-head">\u2191 Top of newsletter</div>' +
          '<div class="tdl-stack" data-tdl-stack></div>' +
          '<button class="tdl-add-blk" data-tdl-addfirst' + (S.blocks.length ? ' style="display:none"' : '') + '>' +
            '<span class="tdl-circ">+</span><span>Add your first block</span></button>' +
          '<div class="tdl-ls-head" style="margin-top:14px">\u2193 Bottom of newsletter</div>' +
        '</div>' +
      '</div>' +

      // footer
      '<div class="tdl-footer-bar">' +
        '<button class="tdl-reset" type="button">Reset to system default</button>' +
        '<span class="tdl-sp"></span>' +
        '<span class="tdl-dirty-note" hidden>Unsaved template changes</span>' +
        '<button class="tdl-btn tdl-cancel" type="button" disabled>Cancel</button>' +
        '<button class="tdl-btn tdl-save" type="button" disabled>Save template</button>' +
      '</div>';

    renderStack();
    wireChrome();
    reflectDirty();
  }

  function renderStack() {
    var stack = $('[data-tdl-stack]');
    if (!stack) return;
    var parts = [];
    S.blocks.forEach(function (blk, i) {
      if (i > 0) parts.push('<div class="tdl-drop" data-drop="' + i + '"></div>');
      var label = esc(computeLabel(i));
      var isArticle = PHOTO_ESSAY_TYPES[blk.type];
      parts.push(
        '<div class="tdl-blk" draggable="true" data-idx="' + i + '">' +
          '<div class="tdl-handle" aria-hidden="true">\u22ee\u22ee</div>' +
          '<div class="tdl-blk-head">' +
            '<span class="tdl-pos">' + (i + 1) + '</span>' +
            '<span class="tdl-type">' + label + '</span>' +
            '<span class="tdl-sp"></span>' +
            '<button class="tdl-act" title="Duplicate" data-act="dup">\u2398</button>' +
            '<button class="tdl-act" title="Remove from template" data-act="del">\u2715</button>' +
          '</div>' +
          (isArticle
            ? '<div class="tdl-flag">' +
                '<span class="tdl-flag-lbl">Photo Essay</span>' +
                '<span class="tdl-flag-sub">multi-photo on-site render</span>' +
                '<span class="tdl-sp"></span>' +
                '<button class="tdl-toggle" type="button" data-pe="' + i + '" role="switch" aria-checked="' + (blk.photoEssay ? 'true' : 'false') + '"></button>' +
              '</div>'
            : '') +
        '</div>'
      );
    });
    if (!S.blocks.length) {
      stack.innerHTML = '<div class="tdl-empty">No blocks yet. Click a block type in the palette to start building this title\u2019s default layout.</div>';
    } else {
      stack.innerHTML = parts.join('');
    }
    wireStack();
    var count = $('[data-tdl-blockcount]');
    if (count) count.textContent = S.blocks.length;
    var addFirst = $('[data-tdl-addfirst]');
    if (addFirst) addFirst.style.display = S.blocks.length ? 'none' : '';
  }

  /* ───────────────────────── wiring ───────────────────────── */

  function wireChrome() {
    // palette: click to append
    $$('[data-tdl-palette] .tdl-pl-item').forEach(function (it) {
      it.addEventListener('click', function () {
        addBlock(it.getAttribute('data-add'));
      });
    });
    // palette: drag to insert
    $$('[data-tdl-palette] .tdl-pl-item').forEach(function (it) {
      it.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/tdl-add', it.getAttribute('data-add'));
        e.dataTransfer.effectAllowed = 'copy';
        it.classList.add('tdl-dragging');
      });
      it.addEventListener('dragend', function () { it.classList.remove('tdl-dragging'); clearDropHints(); });
    });

    // switches
    $$('[data-switch]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var k = btn.getAttribute('data-switch');
        S.switches[k] = !S.switches[k];
        btn.setAttribute('aria-checked', S.switches[k] ? 'true' : 'false');
        btn.classList.toggle('tdl-dirty', serialize() !== S.original);
        recomputeDirty();
        toast((S.switches[k] ? 'Enabled' : 'Disabled') + ' <b>' + esc(switchLabel(k)) + '</b>.');
      });
    });

    // add-first CTA
    var addFirst = $('[data-tdl-addfirst]');
    if (addFirst) addFirst.addEventListener('click', function () {
      if (PALETTE[0]) addBlock(PALETTE[0].type);
    });

    // footer
    var save = $('.tdl-btn.tdl-save');   if (save)   save.addEventListener('click', doSave);
    var cancel = $('.tdl-btn.tdl-cancel'); if (cancel) cancel.addEventListener('click', doCancel);
    var reset = $('.tdl-reset');         if (reset)  reset.addEventListener('click', doReset);
  }

  function switchLabel(k) {
    var s = SWITCHES.filter(function (x) { return x.key === k; })[0];
    return s ? s.label : k;
  }

  function wireStack() {
    // block actions
    $$('[data-tdl-stack] .tdl-act').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var blk = b.closest('.tdl-blk');
        var idx = parseInt(blk.getAttribute('data-idx'), 10);
        if (isNaN(idx)) return;
        var act = b.getAttribute('data-act');
        if (act === 'dup') {
          var copy = { type: S.blocks[idx].type };
          if (PHOTO_ESSAY_TYPES[copy.type]) copy.photoEssay = !!S.blocks[idx].photoEssay;
          S.blocks.splice(idx + 1, 0, copy);
          renderStack(); recomputeDirty();
          toast('Duplicated <b>' + esc(S.blocks[idx].type) + '</b>.');
        } else if (act === 'del') {
          var t = S.blocks[idx].type;
          S.blocks.splice(idx, 1);
          renderStack(); recomputeDirty();
          toast('Removed <b>' + esc(t) + '</b>.');
        }
      });
    });

    // photo-essay flag toggles (K9)
    $$('[data-tdl-stack] [data-pe]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-pe'), 10);
        if (isNaN(i) || !S.blocks[i]) return;
        S.blocks[i].photoEssay = !S.blocks[i].photoEssay;
        btn.setAttribute('aria-checked', S.blocks[i].photoEssay ? 'true' : 'false');
        btn.classList.toggle('tdl-dirty', serialize() !== S.original);
        recomputeDirty();
      });
    });

    // drag-reorder of existing blocks
    $$('[data-tdl-stack] .tdl-blk').forEach(function (card) {
      card.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/tdl-move', card.getAttribute('data-idx'));
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('tdl-dragging');
      });
      card.addEventListener('dragend', function () { card.classList.remove('tdl-dragging'); clearDropHints(); });
    });

    // drop zones + the stack itself (drop-at-end)
    var stack = $('[data-tdl-stack]');
    $$('[data-tdl-stack] .tdl-drop').forEach(function (dz) {
      dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.classList.add('tdl-over'); });
      dz.addEventListener('dragleave', function () { dz.classList.remove('tdl-over'); });
      dz.addEventListener('drop', function (e) { e.preventDefault(); dz.classList.remove('tdl-over'); handleDrop(e, parseInt(dz.getAttribute('data-drop'), 10)); });
    });
    if (stack) {
      stack.addEventListener('dragover', function (e) { e.preventDefault(); });
      stack.addEventListener('drop', function (e) {
        // drop on empty space → append at end
        if (e.target === stack) { e.preventDefault(); handleDrop(e, S.blocks.length); }
      });
    }
  }

  function clearDropHints() { $$('.tdl-drop.tdl-over').forEach(function (d) { d.classList.remove('tdl-over'); }); }

  function handleDrop(e, insertAt) {
    var addType = e.dataTransfer.getData('text/tdl-add');
    var moveIdx = e.dataTransfer.getData('text/tdl-move');
    if (addType) {
      if (VALID_TYPES.indexOf(addType) < 0) return;
      var nb = { type: addType };
      if (PHOTO_ESSAY_TYPES[addType]) nb.photoEssay = false;
      S.blocks.splice(insertAt, 0, nb);
      renderStack(); recomputeDirty();
      toast('Added <b>' + esc(addType) + '</b>.');
    } else if (moveIdx !== '') {
      var from = parseInt(moveIdx, 10);
      if (isNaN(from)) return;
      var to = insertAt;
      if (to > from) to -= 1;           // account for the removed slot
      if (to === from) return;
      var moved = S.blocks.splice(from, 1)[0];
      S.blocks.splice(to, 0, moved);
      renderStack(); recomputeDirty();
    }
  }

  function addBlock(type) {
    if (VALID_TYPES.indexOf(type) < 0) return;
    var nb = { type: type };
    if (PHOTO_ESSAY_TYPES[type]) nb.photoEssay = false;
    S.blocks.push(nb);
    renderStack(); recomputeDirty();
    toast('Added <b>' + esc(type) + '</b> to template.');
  }

  /* ───────────────────────── save / cancel / reset ───────────────────────── */

  function doCancel() {
    if (!S.dirty) return;
    if (!window.confirm('Discard unsaved template changes?')) return;
    hydrateFromStored();   // revert to last-saved snapshot
    render();
    toast('Reverted to last saved template.');
  }

  function doReset() {
    if (!window.confirm('Reset to a blank layout? Your current template will be replaced (Save to apply).')) return;
    S.blocks = [];
    SWITCHES.forEach(function (sw) { S.switches[sw.key] = false; });
    render();
    recomputeDirty();
    toast('Reset to blank. <b>Save</b> to apply.');
  }

  function doSave() {
    if (!S.dirty || S.saving) return;
    var payloadJson = serialize();
    var taId = titleAdminId();
    if (!taId) { toast('No titleAdminId on the page \u2014 cannot save.', true); return; }

    setSaving(true);

    // ── STUB ─────────────────────────────────────────────────────────────
    if (STUB_SAVE || !saveRoute()) {
      console.log('[tdl] STUB save \u2014 would POST to Default Layout Save scenario:', {
        titleAdminId: taId,
        defaultLayoutJson: payloadJson
      });
      setTimeout(function () {
        setSaving(false);
        S.original = payloadJson;     // treat as saved so dirty clears
        recomputeDirty();
        clearSwitchDirtyMarks();
        toast('Template saved (stub). <b>Future issues</b> of ' + esc(titleSlug() || titleName()) + ' will use this layout.');
      }, 500);
      return;
    }

    // ── REAL WRITE ───────────────────────────────────────────────────────
    // no-cors POST with URLSearchParams (platform write convention). The
    // Default Layout Save scenario does a single-field update to
    // TITLES-ADMIN.default-layout-json keyed by titleAdminId.
    var body = new URLSearchParams();
    body.set('titleAdminId', taId);
    body.set('defaultLayoutJson', payloadJson);
    fetch(saveRoute(), { method: 'POST', mode: 'no-cors', body: body })
      .then(function () {
        setSaving(false);
        S.original = payloadJson;
        recomputeDirty();
        clearSwitchDirtyMarks();
        toast('Template saved. <b>Future issues</b> of ' + esc(titleSlug() || titleName()) + ' will use this layout.');
      })
      .catch(function (err) {
        console.error('[tdl] save failed', err);
        setSaving(false);
        toast('Save failed \u2014 please retry.', true);
      });
  }

  function setSaving(on) {
    S.saving = on;
    var save = $('.tdl-btn.tdl-save');
    if (!save) return;
    if (on) {
      save.classList.add('tdl-saving');
      save.disabled = true;
      save.innerHTML = '<span class="tdl-spin"></span>Saving\u2026';
    } else {
      save.classList.remove('tdl-saving');
      save.innerHTML = 'Save template';
    }
    reflectDirty();
  }
  function clearSwitchDirtyMarks() { $$('.tdl-toggle.tdl-dirty').forEach(function (t) { t.classList.remove('tdl-dirty'); }); }

  /* ───────────────────────── toast ───────────────────────── */

  function toast(msg, isErr) {
    var host = $('[data-tdl-toasts]');
    if (!host) return;
    var t = document.createElement('div');
    t.className = 'tdl-toast' + (isErr ? ' tdl-err' : '');
    t.innerHTML = msg;
    host.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .3s'; t.style.opacity = '0';
      setTimeout(function () { t.remove(); }, 320);
    }, 2800);
  }

  /* ───────────────────────── mount ───────────────────────── */

  function findMount() {
    return document.getElementById('std-default-layout-mount') ||
           document.querySelector('[data-tdl-mount]');
  }

  function mount() {
    var host = findMount();
    if (!host) { console.warn('[tdl] no mount (#std-default-layout-mount) found'); return; }
    if (!host.hasAttribute('data-tdl-root')) host.setAttribute('data-tdl-root', '');
    S.root = host;
    hydrateFromStored();
    render();
    S.mounted = true;
    console.log('[tdl] Default Layout tab mounted \u00b7 v1.0.0 \u00b7 blocks:', S.blocks.length,
                '\u00b7 titleAdminId:', titleAdminId() || '(none)',
                '\u00b7 save:', (STUB_SAVE || !saveRoute()) ? 'STUB' : 'LIVE');
  }

  // Mount when the Studio panel event fires, and once on load if the mount is
  // already present (direct navigation / tab already active).
  window.addEventListener('std:panel:defaultLayout', function () {
    if (!S.mounted || S.root !== findMount()) mount(); else render();
  });

  function boot() {
    if (findMount()) mount();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ───────────────────────── public API ───────────────────────── */
  window.TADefaultLayout = {
    mount: mount,
    get state() { return { blocks: S.blocks.slice(), switches: Object.assign({}, S.switches), dirty: S.dirty }; },
    serialize: serialize,
    version: '1.0.0'
  };
})();
