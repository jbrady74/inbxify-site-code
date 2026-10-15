/* ============================================================================
   ta-default-layout-v1.0.17.js
   INBXIFY · T-A Studio · Default Layout tab  (Workstream K-2)

   v1.0.17 — IPP Build S17 · Catalog S3 (15 Oct 2026). THE PALETTE READS THE
            CATALOG. Rulings 15 Oct: keys, not names; Lead Banner Ad and LBP
            leave the palette; every catalog entry that makes blocks is
            offered; the masthead reads the title's name.
            1 · The palette is the Data Worker's /catalog answer (ix-issue-data
                v1.0.54): one item per entry with blocks, in catalog order.
                Name: the title's SECTIONS name, else the catalog name. Gold
                when side is revenue. One-per-issue from perIssue. The icon
                is the entry's add label, else the first two letters of its
                name. Nothing typed here: PALETTE, VALID_TYPES, SINGLETON_TYPES,
                STRIP_TYPES and SWITCHES are gone.
            2 · default-layout-json version 2: { version: 2, blocks: [ { key,
                position } ] }. A version-1 blob (type names) is read through
                the catalog's defaultLayout names on load, the tab says so and
                asks for one Save, and the next Save writes version 2. Names
                the catalog does not know are dropped and listed on the page.
            3 · Scenario 126 v2.6 no longer reads this JSON itself; it asks
                /catalog for the rows. So a type the catalog adds appears here
                and in new plans with no code.
            4 · HC-TDL-MAST retired: the masthead band says the title's name
                (from /catalog, else TA_CONFIG). The sample header's title
                reads the same. Band colour: --tdl-brand when the title sets
                one, else the platform's deep green (cosmetic default).
            5 · The row label is the name, with " - N" when the kind repeats.
                The old "Banner Ad - N counts from 2" rule assumed a separate
                Lead Banner Ad; the lead is now whatever banner is first.
            6 · The URL of /catalog: TA_CONFIG.catalogUrl when the head sets
                it, else TA_CONFIG.planList with /plans replaced by /catalog
                (same Worker). No head change needed.
            7 · Version strings corrected (the mount log and the API still
                said 1.0.15).
            Pairs with ta-default-layout-v1.0.15.css unchanged. Needs
            ix-issue-data v1.0.54 (/catalog); on an older Worker the tab shows
            "Could not read the block catalog" and offers no palette.

   v1.0.15 — K9 REVERSED: Photo Essay flag/switch REMOVED entirely (markup, handler,
            data keys, PHOTO_ESSAY_TYPES constant). Workstream I infers multi-photo
            from photo count downstream. JSON no longer carries photoEssay.
   v1.0.14 — Header title now TRULY centered (equal-thirds flex: No. left-justified,
            Title centered, Date right-justified). Pairs w/ CSS v1.0.14 (sticky
            side columns + cream newsletter border).
   v1.0.13 — fixed Header corrections: gold = #f4a127 (the title's header gold),
            HORIZONTAL row (No. | Title | Date), child divs forced transparent
            !important (page rule was painting white boxes), tooltip line removed.
   v1.0.12 — fixed gold Header at slot #1 (initial; restyled in v1.0.13).
   v1.0.11 — masthead background + color now carry !important inline. The div
            was rendering at correct size/position (confirmed via DOM) but a
            page-level !important rule in one of the ~14 loaded stylesheets was
            suppressing its background/text. Inline !important wins the tie.
   v1.0.10 — masthead styles moved INLINE onto the div (JS/CSS version drift kept
            the .tdl-fixed-mast CSS rule off the page → div invisible). Now self-
            contained: renders regardless of which CSS version the head links.
            Same spec: "Wyckoff Living Now", 65% width, 80px, #142e2e, white
            Fraunces, top corners 5px. HARDCODED (HC-TDL-MAST).
   v1.0.9 — fixed HARDCODED masthead band (HC-TDL-MAST) at top of center column:
            "Wyckoff Living Now", 65% width, 80px, #142e2e, white Fraunces, top
            corners rounded 5px. CMS color/logo binding never resolved on the
            page; this is a hardcoded stopgap (make per-title later). The old
            CMS banner removed. titleColor still drives tile accent if present.
   v1.0.8 — branded section banner replaces the logo masthead (logo Link field
            wouldn't bind cleanly). A primary-color band (TA_CONFIG.titleColor)
            carries the title name + "Newsletter Layout" label — signals the
            workspace. Color still drives --tdl-brand for tile accents. Logo
            accessor retained but unused.
   v1.0.7 — per-title branding (logo masthead + brand color). Superseded banner.
   v1.0.6 — Local Weather is now a SELECTABLE SINGLETON BLOCK (reverses K10
            "weather = switch"). Added to palette (icon WX), removed from the
            Default Switches panel (now empty → hidden). At most one allowed:
            palette item disables while present, add/drop/dup all guarded.
            Legacy switches.localWeather:true migrates to a Local Weather block
            on load. NOTE: strip POSITION in the rendered newsletter still needs
            a Scenario 106 rebuild (WEATHER-AS-BLOCK spec) — this is the UI half.
   v1.0.5 — save confirmation is now a centered modal (Option C): platform
            ix-overlay/ix-modal rendered into <body>, with a Refresh-now button
            and a 6s auto-dismiss countdown. Add/remove/etc. still use the small
            .studio-toast. Refresh reloads to pull the persisted layout from CMS.
   v1.0.4 — toasts now use the platform .studio-toast standard, rendered into
            <body> (the old toast was trapped inside [data-tdl-root] and hidden).
            Fixed bottom-right, blue-deep + white, .visible toggle.
   v1.0.3 — layout + drag overhaul (columns reordered, Issues-style header,
            card-based drag-reorder).
   v1.0.2 — Save LIVE (PP_WEBHOOKS.dl / TA_CONFIG.makeDefaultLayout).
   v1.0.1 — native Webflow tab self-mount (no Studio sub-strip).
   v1.0.0 — initial build.

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

   WHAT IS NOT A BLOCK HERE (v1.0.17): the Title Masthead (newsletter chrome,
   K11) and Splash (catalog entry with blocks false). Neither is in the catalog
   as a block, so neither reaches the palette; a stored entry naming one is
   dropped on load and listed on the page.

   THE PALETTE (v1.0.17): the Data Worker's catalog. See the v1.0.17 note.
   JSON SHAPE (v1.0.17, version 2):
     { "version": 2, "blocks": [ { "key":"greeting", "position":1 },
                                 { "key":"articles", "position":2 }, ... ] }
     Keys are IX_CONFIG.catalog keys. Version 1 blobs ({type:"Greeting"})
     are read through the catalog and rewritten on the next Save.

   PLATFORM INTEGRATION (matches ta-page-body native-tab conventions):
     • Mounts into  #default-layout-mount  inside the title's Webflow tab pane.
     • Self-mounts when its native Webflow tab (data-w-tab="Default Layout")
       becomes .w--current — NO Studio sub-tab strip exists; these are
       top-level Webflow tabs. TAB_NAME constant must match the data-w-tab
       value set in Webflow.
     • Reads title context from window.TA_CONFIG.taItemId (titleAdminId) and
       TA_CONFIG.titleSlug / titleId for display.
     • Reads the stored blob from a hidden CMS element:
         [data-tdl-json] (text content = the default-layout-json field), OR
         window.TA_CONFIG.defaultLayoutJson if the head exposes it there.
     • Save POSTs to window.TA_CONFIG.makeDefaultLayout (Default Layout Save
       scenario). STUBBED until that URL exists — see STUB_SAVE below.

   NAMESPACE: window.TADefaultLayout  ·  CSS prefix .tdl-  ·  scoped to
   [data-tdl-root]. No globals leak; no collision with IPP / Studio.
   HARDCODE DECISIONS (v1.0.17): the band and header colours (#142e2e default
   when the title sets no --tdl-brand, #f4a127 header) and the sample header
   copy ("No. 000", a date) are cosmetic. No tenant name, no block list.
   ============================================================================ */
(function () {
  'use strict';

  /* ───────────────────────── config / constants ───────────────────────── */

  // Default Layout Save scenario (LIVE as of v1.0.2). Route resolves from
  // window.PP_WEBHOOKS.dl (preferred) or window.TA_CONFIG.makeDefaultLayout.
  // Scenario does a single-field update to TITLES-ADMIN.default-layout-json
  // keyed by titleAdminId. Set STUB_SAVE=true to force the no-write stub.
  var STUB_SAVE = false;
  function saveRoute() {
    return (window.PP_WEBHOOKS && window.PP_WEBHOOKS.dl) ||
           (window.TA_CONFIG && window.TA_CONFIG.makeDefaultLayout) || null;
  }
  // v1.0.17 — the Data Worker's /catalog. Same Worker as planList.
  function catalogRoute() {
    var c = window.TA_CONFIG || {};
    if (c.catalogUrl) return c.catalogUrl;
    var p = String(c.planList || '');
    return /\/plans(\?.*)?$/.test(p) ? p.replace(/\/plans(\?.*)?$/, '/catalog') : null;
  }

  var SCHEMA_VERSION = 2;   // v1.0.17: keys

  /* ───────────────────────────── state ───────────────────────────── */

  var S = {
    mounted: false,
    root: null,
    catalog: null,     // v1.0.17: /catalog answer (catalog, title) or null
    catalogError: '',  // why the catalog could not be read
    palette: [],       // [{ key, name, icon, gold, one, names }] in catalog order
    byKey: {},         // key -> palette item
    blocks: [],        // [{key}] in render order (position is implicit)
    dropped: [],       // stored entries the catalog could not place: [{position, value}]
    storedForm: 'none',// 'keys' | 'names' | 'none' — how the saved blob was written
    original: null,    // JSON string snapshot for dirty-compare + revert
    dirty: false,
    saving: false
  };

  var $  = function (s, r) { return (r || S.root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || S.root).querySelectorAll(s)); };

  /* ───────────────────────── read stored JSON ───────────────────────── */

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
  // v1.0.17 — the title's own name: /catalog first, then the head, then the slug.
  function titleName()  {
    var fromWorker = S.catalog && S.catalog.title && S.catalog.title.name;
    return fromWorker || (window.TA_CONFIG && (window.TA_CONFIG.titleName || window.TA_CONFIG.titleSlug)) || 'This title';
  }
  function titleColor()   {
    var c = (window.TA_CONFIG && window.TA_CONFIG.titleColor) || '';
    c = c.trim();
    if (!c) return '';
    if (c[0] !== '#') c = '#' + c;
    return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : '';
  }

  /* ───────────────────────── the catalog (v1.0.17) ───────────────────────── */

  function loadCatalog() {
    var url = catalogRoute(), taId = titleAdminId();
    S.catalog = null; S.catalogError = ''; S.palette = []; S.byKey = {};
    function fail(why) { S.catalogError = why; console.warn('[tdl] catalog:', why); return false; }
    if (!url) return Promise.resolve(fail('No catalog URL (TA_CONFIG.planList or catalogUrl).'));
    if (!taId) return Promise.resolve(fail('No titleAdminId on the page.'));
    return fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 'taId=' + encodeURIComponent(taId))
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (x) {
        var j = x.body || {};
        if (!j.ok) return fail(j.error || ('The Worker answered ' + x.status + '.'));
        if (!Array.isArray(j.catalog)) return fail('IX_CONFIG.catalog is not set on the Data Worker.');
        S.catalog = j;
        S.palette = j.catalog.filter(function (e) { return e.blocks !== false; }).map(function (e) {
          var name = e.sectionName || e.name || e.key;
          return { key: e.key, name: name, icon: e.add || name.slice(0, 2).toUpperCase(),
                   gold: e.side === 'revenue', one: e.perIssue === 'one',
                   names: (e.defaultLayout || []).map(function (n) { return String(n).toLowerCase(); }) };
        });
        S.palette.forEach(function (p) { S.byKey[p.key] = p; });
        ((j.meta && j.meta.warnings) || []).forEach(function (w) { console.warn('[tdl] Worker:', w); });
        return true;
      })
      .catch(function (e) { return fail((e && e.message) || 'The request failed.'); });
  }

  // The palette item a stored entry means: its key, else a version-1 name
  // through the catalog's defaultLayout names. null when the catalog has none.
  function itemFor(value) {
    var v = String(value || '').trim();
    if (!v) return null;
    if (S.byKey[v]) return S.byKey[v];
    var lower = v.toLowerCase();
    for (var i = 0; i < S.palette.length; i++) if (S.palette[i].names.indexOf(lower) >= 0) return S.palette[i];
    return null;
  }

  // Parse + sanitize the stored blob into S.blocks through the catalog.
  function hydrateFromStored() {
    S.blocks = []; S.dropped = []; S.storedForm = 'none';
    var raw = readStoredRaw();
    var parsed = null;
    if (raw) {
      try { parsed = JSON.parse(raw); }
      catch (e) { console.warn('[tdl] stored default-layout-json failed to parse; starting empty', e); parsed = null; }
    }
    if (parsed && Array.isArray(parsed.blocks)) {
      S.storedForm = Number(parsed.version) >= 2 ? 'keys' : 'names';
      var arr = parsed.blocks.slice().sort(function (a, b) {
        var pa = (a && typeof a.position === 'number') ? a.position : 1e9;
        var pb = (b && typeof b.position === 'number') ? b.position : 1e9;
        return pa - pb;
      });
      arr.forEach(function (b, i) {
        var value = String((b && (b.key || b.type)) || '').trim();
        var it = itemFor(value);
        var pos = (b && typeof b.position === 'number') ? b.position : i + 1;
        if (!it) { if (value) S.dropped.push({ position: pos, value: value }); return; }
        if (it.one && blockExists(it.key)) { S.dropped.push({ position: pos, value: value + ' (second ' + it.name + ')' }); return; }
        S.blocks.push({ key: it.key });
      });
    }
    // snapshot for dirty-compare / revert. A names blob is already different
    // from what Save would write, so the page asks for one Save.
    S.original = S.storedForm === 'names' ? '' : serialize();
    S.dirty = false;
  }

  /* ───────────────────────── serialize (Save shape) ───────────────────────── */

  function serialize() {
    var blocks = S.blocks.map(function (b, i) { return { key: b.key, position: i + 1 }; });
    return JSON.stringify({ version: SCHEMA_VERSION, blocks: blocks });
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
    if (save) save.disabled = !S.dirty || S.saving || !S.catalog;
    if (cancel) cancel.disabled = !S.dirty || S.saving;
  }

  /* ───────────────────────── label rule ───────────────────────── */
  // The name; " - N" when the kind appears more than once (v1.0.17).
  function computeLabel(index) {
    var key = S.blocks[index].key, it = S.byKey[key] || { name: key };
    var total = S.blocks.filter(function (b) { return b.key === key; }).length;
    if (total === 1) return it.name;
    var instance = S.blocks.slice(0, index + 1).filter(function (b) { return b.key === key; }).length;
    return it.name + ' - ' + instance;
  }

  /* ───────────────────────── render ───────────────────────── */

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function blockExists(key) { return S.blocks.some(function (b) { return b.key === key; }); }

  function render() {
    if (!S.root) return;
    var paletteRows = S.palette.map(function (p) {
      var disabled = p.one && blockExists(p.key);
      return '<div class="tdl-pl-item' + (disabled ? ' tdl-pl-item--disabled' : '') + '"' +
               (disabled ? '' : ' draggable="true"') +
               ' data-add="' + esc(p.key) + '"' +
               (disabled ? ' aria-disabled="true" title="Already in layout \u2014 only one allowed"' : '') + '>' +
               '<div class="tdl-pl-ico' + (p.gold ? ' tdl-gold' : '') + '">' + esc(p.icon) + '</div>' +
               '<div class="tdl-pl-label">' + esc(p.name) + '</div>' +
             '</div>';
    }).join('');
    if (!S.catalog) {
      paletteRows = '<div class="tdl-pl-hint">Could not read the block catalog' + (S.catalogError ? ': ' + esc(S.catalogError) : '.') + '</div>';
    }

    var brand = titleColor();
    if (brand) S.root.style.setProperty('--tdl-brand', brand);
    else S.root.style.removeProperty('--tdl-brand');

    var notes = '';
    if (S.storedForm === 'names') notes += '<div class="tdl-scope-note">This layout was saved in the older form (block names). It has been read through the catalog. <b>Save</b> once to store it the new way.</div>';
    if (S.dropped.length) notes += '<div class="tdl-scope-note">Left out of the saved layout (the catalog has no such block): ' +
      S.dropped.map(function (d) { return 'position ' + d.position + ' \u201c' + esc(d.value) + '\u201d'; }).join(', ') + '. Save to clear them.</div>';

    S.root.innerHTML =
      ((window.IxHeader && IxHeader.render)
        ? IxHeader.render({ icon: '\uD83D\uDCD0', title: 'Default Newsletter Layout' })
        : '<div class="ix-hdr"><div class="ix-hdr-left">' +
          '<div class="ix-hdr-icon">\uD83D\uDCD0</div>' +
          '<div><h3>Default Newsletter Layout</h3>' +
          '<div class="ix-hdr-sub">' + esc(titleName() || '') + '</div></div>' +
          '</div><div class="ix-hdr-right"></div></div>'
      ) +

      '<div class="tdl-grid">' +

        // Col 1 (LEFT) — Add Block palette, from the catalog
        '<aside class="tdl-palette">' +
          '<div class="tdl-pl-card">' +
            '<h4>Add Block</h4>' +
            '<div class="tdl-pl-list" data-tdl-palette>' + paletteRows + '</div>' +
            '<div class="tdl-pl-hint">Click or drag to add \u00b7 lands at end \u00b7 drag to reorder</div>' +
          '</div>' +
        '</aside>' +

        // Col 2 (CENTER) — block stack
        '<div class="tdl-stack-wrap">' +
          '<div class="tdl-stack-intro">' +
            '<p>This template <b>drives what every new issue\u2019s Picker shows by default</b>. Each PubPlan starts here and can diverge per issue without affecting this template or future issues.</p>' +
            '<span class="tdl-applies">\u2605 Applies to: ' + esc(titleSlug() || titleName()) + '</span>' +
          '</div>' +
          notes +
          // Masthead band: the title's name (v1.0.17; was typed "Wyckoff Living
          // Now", HC-TDL-MAST, retired). Inline styles stay: a page rule with
          // !important hid the band when they lived in CSS (v1.0.11).
          '<div class="tdl-fixed-mast" style="width:65%;height:80px;margin:0 auto 12px;background:var(--tdl-brand, #142e2e) !important;color:#fff !important;border-radius:5px 5px 0 0;display:flex;align-items:center;justify-content:center;font-family:\'Fraunces\',Georgia,serif;font-weight:600;font-size:26px;letter-spacing:-.01em;">' + esc(titleName()) + '</div>' +
          // Fixed sample header (always slot #1, chrome, not a block): No. | Title | Date.
          '<div class="tdl-fixed-hdr" style="width:65%;margin:-12px auto 14px;padding:16px 26px;background:#f4a127 !important;color:#1A1A1A !important;border-radius:0 0 5px 5px;display:flex;flex-direction:row;align-items:center;gap:18px;font-family:\'Fraunces\',Georgia,serif;">' +
            '<div style="background:transparent !important;flex:1;text-align:left;font-weight:700;font-size:14px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;">No. 000</div>' +
            '<div style="background:transparent !important;flex:1;text-align:center;font-weight:600;font-size:22px;line-height:1.1;white-space:nowrap;">' + esc(titleName()) + '</div>' +
            '<div style="background:transparent !important;flex:1;text-align:right;font-size:14px;white-space:nowrap;">January 1, 2005</div>' +
          '</div>' +
          '<div class="tdl-ls-head">\u2191 Top of newsletter</div>' +
          '<div class="tdl-stack" data-tdl-stack></div>' +
          '<button class="tdl-add-blk" data-tdl-addfirst' + ((S.blocks.length || !S.palette.length) ? ' style="display:none"' : '') + '>' +
            '<span class="tdl-circ">+</span><span>Add your first block</span></button>' +
          '<div class="tdl-ls-head" style="margin-top:14px">\u2193 Bottom of newsletter</div>' +
        '</div>' +

        // Col 3 (RIGHT) — Template context
        '<aside class="tdl-rail">' +
          '<div class="tdl-tr-card">' +
            '<h4>Template</h4>' +
            '<div class="tdl-tr-name">' + esc(titleName()) + ' Default</div>' +
            '<div class="tdl-tr-sub">' + esc(titleSlug() || '\u2014') + '</div>' +
            '<div class="tdl-tr-meta">' +
              '<div class="tdl-tr-row"><span class="tdl-tr-lbl">Blocks</span><span class="tdl-tr-val" data-tdl-blockcount>' + S.blocks.length + '</span></div>' +
              '<div class="tdl-tr-row"><span class="tdl-tr-lbl">Block kinds</span><span class="tdl-tr-val">' + S.palette.length + '</span></div>' +
              '<div class="tdl-tr-row"><span class="tdl-tr-lbl">Schema</span><span class="tdl-tr-val">v' + SCHEMA_VERSION + '</span></div>' +
            '</div>' +
            '<div class="tdl-tr-status"><span class="tdl-dot"></span><span class="tdl-status-lbl">Editing</span></div>' +
          '</div>' +
        '</aside>' +
      '</div>' +

      // footer
      '<div class="tdl-footer-bar">' +
        '<button class="tdl-reset" type="button">Reset to blank</button>' +
        '<span class="tdl-sp"></span>' +
        '<span class="tdl-dirty-note" hidden>Unsaved template changes</span>' +
        '<button class="tdl-btn tdl-cancel" type="button" disabled>Cancel</button>' +
        '<button class="tdl-btn tdl-save" type="button" disabled>Save template</button>' +
      '</div>';

    renderStack();
    wireChrome();
    recomputeDirty();
  }

  function renderStack() {
    var stack = $('[data-tdl-stack]');
    if (!stack) return;
    var parts = [];
    S.blocks.forEach(function (blk, i) {
      var label = esc(computeLabel(i));
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
    if (addFirst) addFirst.style.display = (S.blocks.length || !S.palette.length) ? 'none' : '';
  }

  /* ───────────────────────── wiring ───────────────────────── */

  function wireChrome() {
    $$('[data-tdl-palette] .tdl-pl-item').forEach(function (it) {
      it.addEventListener('click', function () { addBlock(it.getAttribute('data-add')); });
      it.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/tdl-add', it.getAttribute('data-add'));
        e.dataTransfer.effectAllowed = 'copy';
        it.classList.add('tdl-dragging');
      });
      it.addEventListener('dragend', function () { it.classList.remove('tdl-dragging'); clearDropHints(); });
    });

    var addFirst = $('[data-tdl-addfirst]');
    if (addFirst) addFirst.addEventListener('click', function () {
      if (S.palette[0]) addBlock(S.palette[0].key);
    });

    var save = $('.tdl-btn.tdl-save');   if (save)   save.addEventListener('click', doSave);
    var cancel = $('.tdl-btn.tdl-cancel'); if (cancel) cancel.addEventListener('click', doCancel);
    var reset = $('.tdl-reset');         if (reset)  reset.addEventListener('click', doReset);
  }

  function wireStack() {
    $$('[data-tdl-stack] .tdl-act').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var blk = b.closest('.tdl-blk');
        var idx = parseInt(blk.getAttribute('data-idx'), 10);
        if (isNaN(idx)) return;
        var act = b.getAttribute('data-act');
        var key = S.blocks[idx].key, it = S.byKey[key] || { name: key };
        if (act === 'dup') {
          if (singletonBlocked(key)) return;
          S.blocks.splice(idx + 1, 0, { key: key });
          renderStack(); recomputeDirty();
          toast('Duplicated <b>' + esc(it.name) + '</b>.');
        } else if (act === 'del') {
          S.blocks.splice(idx, 1);
          if (it.one) render(); else renderStack();   // a one-per-issue kind re-enables its palette item
          recomputeDirty();
          toast('Removed <b>' + esc(it.name) + '</b>.');
        }
      });
    });

    // ── drag-reorder: each card is both draggable AND a drop target. Dropping
    //    onto a card inserts before or after it depending on whether the cursor
    //    is in the top or bottom half. Palette items can also drop onto cards
    //    (insert) or the stack (append). This card-to-card model has forgiving
    //    hit areas — the v1.0.2 thin between-block strips were nearly unhittable.
    var stack = $('[data-tdl-stack]');

    $$('[data-tdl-stack] .tdl-blk').forEach(function (card) {
      card.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/tdl-move', card.getAttribute('data-idx'));
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('tdl-dragging');
      });
      card.addEventListener('dragend', function () {
        card.classList.remove('tdl-dragging');
        clearDropHints();
      });
      card.addEventListener('dragover', function (e) {
        e.preventDefault();
        var r = card.getBoundingClientRect();
        var after = (e.clientY - r.top) > r.height / 2;
        clearDropHints();
        card.classList.add(after ? 'tdl-drop-after' : 'tdl-drop-before');
      });
      card.addEventListener('dragleave', function () {
        card.classList.remove('tdl-drop-before', 'tdl-drop-after');
      });
      card.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var r = card.getBoundingClientRect();
        var after = (e.clientY - r.top) > r.height / 2;
        var targetIdx = parseInt(card.getAttribute('data-idx'), 10);
        var insertAt = after ? targetIdx + 1 : targetIdx;
        clearDropHints();
        handleDrop(e, insertAt);
      });
    });

    // stack background → append at end (covers drop below the last card or on
    // the empty state)
    if (stack) {
      stack.addEventListener('dragover', function (e) { e.preventDefault(); });
      stack.addEventListener('drop', function (e) {
        if (e.target === stack || e.target.classList.contains('tdl-empty')) {
          e.preventDefault();
          clearDropHints();
          handleDrop(e, S.blocks.length);
        }
      });
    }
  }

  function clearDropHints() {
    $$('.tdl-blk.tdl-drop-before, .tdl-blk.tdl-drop-after').forEach(function (c) {
      c.classList.remove('tdl-drop-before', 'tdl-drop-after');
    });
  }

  // Reject a second instance of a one-per-issue kind. True when blocked.
  function singletonBlocked(key) {
    var it = S.byKey[key];
    if (it && it.one && blockExists(key)) {
      toast('<b>' + esc(it.name) + '</b> can only be added once.', true);
      return true;
    }
    return false;
  }

  function handleDrop(e, insertAt) {
    var addKey = e.dataTransfer.getData('text/tdl-add');
    var moveIdx = e.dataTransfer.getData('text/tdl-move');
    if (addKey) {
      var it = S.byKey[addKey];
      if (!it) return;
      if (singletonBlocked(addKey)) return;
      S.blocks.splice(insertAt, 0, { key: addKey });
      if (it.one) render(); else renderStack();
      recomputeDirty();
      toast('Added <b>' + esc(it.name) + '</b>.');
    } else if (moveIdx !== '') {
      var from = parseInt(moveIdx, 10);
      if (isNaN(from)) return;
      var to = insertAt;
      if (to > from) to -= 1;
      if (to === from) return;
      var moved = S.blocks.splice(from, 1)[0];
      S.blocks.splice(to, 0, moved);
      renderStack(); recomputeDirty();
    }
  }

  function addBlock(key) {
    var it = S.byKey[key];
    if (!it) return;
    if (singletonBlocked(key)) return;
    S.blocks.push({ key: key });
    if (it.one) render(); else renderStack();
    recomputeDirty();
    toast('Added <b>' + esc(it.name) + '</b> to template.');
  }

  /* ───────────────────────── save / cancel / reset ───────────────────────── */

  function doCancel() {
    if (!S.dirty) return;
    if (!window.confirm('Discard unsaved template changes?')) return;
    hydrateFromStored();
    render();
    toast('Reverted to last saved template.');
  }

  function doReset() {
    if (!window.confirm('Reset to a blank layout? Your current template will be replaced (Save to apply).')) return;
    S.blocks = [];
    render();
    recomputeDirty();
    toast('Reset to blank. <b>Save</b> to apply.');
  }

  function doSave() {
    if (!S.dirty || S.saving || !S.catalog) return;
    var payloadJson = serialize();
    var taId = titleAdminId();
    if (!taId) { toast('No titleAdminId on the page \u2014 cannot save.', true); return; }

    setSaving(true);

    if (STUB_SAVE || !saveRoute()) {
      console.log('[tdl] STUB save \u2014 would POST to Default Layout Save scenario:', { titleAdminId: taId, defaultLayoutJson: payloadJson });
      setTimeout(function () {
        setSaving(false);
        afterSave(payloadJson);
        toast('Template saved (stub).');
        saveModal();
      }, 500);
      return;
    }

    // no-cors POST with URLSearchParams (platform write convention).
    var body = new URLSearchParams();
    body.set('titleAdminId', taId);
    body.set('defaultLayoutJson', payloadJson);
    fetch(saveRoute(), { method: 'POST', mode: 'no-cors', body: body })
      .then(function () {
        setSaving(false);
        afterSave(payloadJson);
        saveModal();
      })
      .catch(function (err) {
        console.error('[tdl] save failed', err);
        setSaving(false);
        toast('Save failed \u2014 please retry.', true);
      });
  }
  // v1.0.17 — after a Save the stored form is keys and nothing is dropped.
  function afterSave(payloadJson) {
    S.original = payloadJson;
    S.storedForm = 'keys';
    S.dropped = [];
    recomputeDirty();
    $$('.tdl-scope-note').forEach(function (n) { n.remove(); });
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

  /* ───────────────────────── toast ───────────────────────── */

  // Uses the platform's canonical toast standard (.studio-toast from
  // title-admin-page-design): a fixed bottom-right pill rendered into <body>
  // (NOT inside [data-tdl-root] — that's why the old scoped toast was hidden),
  // blue-deep bg + white text, .visible toggles the slide-up/fade. Error
  // variant uses .studio-toast--err.
  function toast(msg, isErr) {
    var t = document.createElement('div');
    t.className = 'studio-toast tdl-toast' + (isErr ? ' studio-toast--err' : '');
    t.innerHTML = msg;
    document.body.appendChild(t);
    // force reflow so the transition runs, then add .visible
    void t.offsetWidth;
    t.classList.add('visible');
    setTimeout(function () {
      t.classList.remove('visible');
      setTimeout(function () { t.remove(); }, 320);
    }, 2600);
  }

  // Centered save-confirmation modal (Option C). Renders into <body> using the
  // platform ix-overlay / ix-modal classes (rendering to body avoids the
  // stacking-context trap that hides scoped overlays). Auto-dismisses after
  // AUTO_MS, or immediately on Refresh / close / overlay click. Refresh reloads
  // the page so the operator sees the persisted layout pulled fresh from CMS.
  function saveModal() {
    var AUTO_MS = 6000;
    var who = esc(titleSlug() || titleName());

    var overlay = document.createElement('div');
    overlay.className = 'ix-overlay tdl-save-overlay';
    overlay.innerHTML =
      '<div class="ix-modal tdl-save-modal" role="dialog" aria-modal="true">' +
        '<div class="ix-modal-bar"></div>' +
        '<div class="ix-modal-head">' +
          '<div class="ix-modal-title-block">' +
            '<div class="ix-modal-title">Template saved</div>' +
            '<div class="ix-modal-sub">Future issues of ' + who + ' will use this layout.</div>' +
          '</div>' +
          '<button class="ix-btn ix-btn--ghost ix-btn--icon" data-tdl-modal-close type="button">\u00d7</button>' +
        '</div>' +
        '<div class="ix-modal-body">' +
          '<p class="tdl-save-modal-text">Your default layout has been written. Refresh to load the saved template fresh from the CMS, or this will close on its own.</p>' +
          '<div class="tdl-save-modal-bar"><span class="tdl-save-modal-fill"></span></div>' +
        '</div>' +
        '<div class="ix-modal-footer">' +
          '<button class="ix-btn ix-btn--ghost" data-tdl-modal-close type="button">Dismiss</button>' +
          '<div class="ix-modal-footer-right">' +
            '<button class="ix-btn ix-btn--primary tdl-save-modal-refresh" data-tdl-modal-refresh type="button">Refresh now</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    void overlay.offsetWidth;
    overlay.classList.add('tdl-save-overlay--visible');

    // kick off the countdown fill animation
    var fill = overlay.querySelector('.tdl-save-modal-fill');
    if (fill) { fill.style.transition = 'width ' + AUTO_MS + 'ms linear'; void fill.offsetWidth; fill.style.width = '0%'; }

    var timer = setTimeout(close, AUTO_MS);
    function close() {
      clearTimeout(timer);
      overlay.classList.remove('tdl-save-overlay--visible');
      setTimeout(function () { overlay.remove(); }, 280);
    }
    function refresh() { clearTimeout(timer); window.location.reload(); }

    overlay.querySelectorAll('[data-tdl-modal-close]').forEach(function (b) {
      b.addEventListener('click', close);
    });
    var rb = overlay.querySelector('[data-tdl-modal-refresh]');
    if (rb) rb.addEventListener('click', refresh);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  }


  /* ───────────────────────── mount ───────────────────────── */

  // The mount div lives inside this title's native Webflow tab pane. No Studio
  // sub-tab strip exists on the T-A page — these are top-level Webflow tabs
  // (.w-tab-link[role="tab"] / .w-tab-pane), same as Transcriber et al. So the
  // tab self-mounts when its pane becomes current, rather than listening for a
  // Studio CustomEvent. TAB_NAME must match the tab's data-w-tab value in
  // Webflow (set it there, then confirm here).
  var TAB_NAME = 'Default Layout';

  function findMount() {
    return document.getElementById('default-layout-mount') ||
           document.querySelector('[data-tdl-mount]');
  }

  // Is our tab the currently-active Webflow tab? If there's no tab link with
  // our name (e.g. the mount lives on a plain page, not in a tab set), treat
  // "present mount" as active so it still renders.
  function tabIsActive() {
    var link = document.querySelector('.w-tab-link[data-w-tab="' + TAB_NAME + '"]') ||
               document.querySelector('[data-w-tab="' + TAB_NAME + '"]');
    if (!link) return true;            // no tab chrome → render if mounted
    return link.classList.contains('w--current');
  }

  function mount() {
    var host = findMount();
    if (!host) { console.warn('[tdl] no mount (#default-layout-mount) found'); return; }
    if (!host.hasAttribute('data-tdl-root')) host.setAttribute('data-tdl-root', '');
    S.root = host;
    S.mounted = true;
    host.innerHTML = '<div class="tdl-pl-hint" style="padding:24px">Reading the block catalog\u2026</div>';
    // v1.0.17 — the catalog first: the stored blob is read through it.
    loadCatalog().then(function () {
      hydrateFromStored();
      render();
      console.log('[tdl] Default Layout tab mounted \u00b7 v1.0.17 \u00b7 kinds:', S.palette.length,
                  '\u00b7 blocks:', S.blocks.length, '\u00b7 stored:', S.storedForm,
                  '\u00b7 titleAdminId:', titleAdminId() || '(none)',
                  '\u00b7 save:', (STUB_SAVE || !saveRoute()) ? 'STUB' : 'LIVE');
    });
  }

  function maybeMount() {
    if (!findMount()) return;          // tab/markup not on this page
    if (!tabIsActive()) return;        // wait until our tab is current
    if (!S.mounted || S.root !== findMount()) mount();
  }

  // 1) Native Webflow tab clicks: delegated, fires after Webflow swaps
  //    .w--current. Match the platform's own [data-w-tab] convention.
  document.addEventListener('click', function (e) {
    var link = e.target.closest('.w-tab-link[role="tab"], [data-w-tab]');
    if (!link) return;
    // let Webflow finish its w--current swap, then check if we're now active
    setTimeout(maybeMount, 60);
  }, true);

  // 2) Initial load (covers Default Layout being the default/landed tab, or a
  //    hash-deeplink that pre-activates it).
  function boot() { maybeMount(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 80); });
  } else {
    setTimeout(boot, 80);
  }


  /* ───────────────────────── public API ───────────────────────── */
  window.TADefaultLayout = {
    mount: mount,
    reload: function () { return loadCatalog().then(function () { hydrateFromStored(); render(); }); },
    get state() { return { blocks: S.blocks.slice(), dirty: S.dirty, stored: S.storedForm, dropped: S.dropped.slice() }; },
    serialize: serialize,
    version: '1.0.17'
  };
})();
