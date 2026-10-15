/* ============================================================================
   ta-default-layout-v1.0.21.js
   INBXIFY · T-A Studio · Default Layout tab  (Workstream K-2)

   v1.0.21 — IPP Build S18 · Default Layout, fix list (15 Oct 2026). A PAIR
            HOLDS ONLY WHAT THE RENDER KEEPS. The render Worker closes a
            group by itself at the first block that is not a story, ad,
            spacer or divider (newsletter-render v1.10.0 web, v1.12.0
            email), so the tab now says the same thing the issue will:
            1 · A kind whose catalog entry says groupable: true (ix-issue-data
                v1.0.57) may sit between an opener and its end. Any other
                kind is refused there: a drop or a palette-add that would
                land it inside a pair bounces with a note, and the end row
                cannot be moved below it. An opener is never groupable.
            2 · On load, a stored group that runs across such a row is closed
                right before it (the render would have done the same), the
                page lists it, and the stray end mark later is cleared.
            3 · The palette marks groupable kinds ("in run").
            Supersedes v1.0.20 (never deployed). CSS v1.0.17 unchanged.
            Needs ix-issue-data v1.0.57; on v1.0.56 nothing is groupable,
            so no row may sit inside a pair until the Worker moves.

   v1.0.20 — IPP Build S18 · Default Layout, the deployed-test fix list
            (15 Oct 2026, superseded undeployed by v1.0.21). A GROUP IS A PAIR, NOT A TICK.
            1 · A kind whose catalog entry says opener: true (ix-issue-data
                v1.0.56; Around Town today) is added as a PAIR: the opener row
                and its end row ("<name> · end"), one under the other. Rows
                dragged between them are the group: the pair and its rows sit
                in a frame, the rows between indented. The opener carries the
                design pick; the end row carries nothing. Deleting either row
                removes both (the rows between stay, un-indented). Dragging
                the opener moves the whole group; dragging the end row moves
                only the boundary and never above its opener. Dup on an
                opener adds an empty pair with the same pick. The "Ends group"
                switch is gone. The label is the kind's name, no " - N".
            2 · Storage is unchanged (JSON version 2; Worker, 126 v2.8, 124
                v2.24 as delivered): the end row is a tab object only. At Save
                the last stored block before an end row gets end: true, which
                for an empty pair is the opener itself. On load an opener
                takes the rows up to the first end: true as its group; an
                opener with no end before the list ends closes at the end;
                end: true outside a group (a v1.0.19 tick) is cleared and
                listed on the page.
            3 · The raw default-layout-json element ([data-tdl-json]) is
                hidden on mount (CSS v1.0.17 hides it too).
            4 · The position pill has one width for one and two digits, so
                rows 10+ line up.
            5 · The palette, the newsletter column and the rail each scroll
                on their own inside the viewport (platform rule for every T-A
                page): the grid takes the room under its top edge and above
                the footer bar; each column is its own scroll box. A
                re-render keeps the column's scroll position (UX-020).
            6 · Dragging near the top or bottom edge of the newsletter column
                scrolls it (and the page when the column itself cannot).
            7 · Save confirms itself. The write is still a no-cors POST
                (nothing readable comes back), so after it the tab asks the
                Worker for the layout fresh from the CMS (/catalog?fresh=1,
                a few tries over a few seconds) and compares every row (key,
                effective design, end) with what it sent. A match: platform
                success toast "Template saved" and the gold states clear. No
                match: amber "Save not confirmed", nothing clears, Save stays
                on. The v1.0.5 modal with its countdown and Refresh button is
                gone. Needs IxToast (ix-success-toast); without it the old
                studio-toast carries the same two outcomes.
            Pairs with ta-default-layout-v1.0.17.css. Needs ix-issue-data
            v1.0.56 for opener; on v1.0.55 no kind opens a group and every
            row is a plain row (no end control at all).

   v1.0.19 — IPP Build S18 (15 Oct 2026). A row carries a design pick and an
            end-of-run tick ({ key, position, design, end }, JSON version 2,
            both optional). Design cell per row (dropdown when the entry may
            use more than one design and has no born one, text for one,
            "from the count" for count-based sets); "Ends group" switch; row
            Cancel; gold pending states; needs-a-design block on Save;
            newsletter column 65% → 82%. Superseded in part by v1.0.20.
   v1.0.18 — IPP Build S17 (15 Oct 2026). Sample header centre reads
            "Greeting Title".
   v1.0.17 — IPP Build S17 · Catalog S3 (15 Oct 2026). The palette reads the
            catalog (ix-issue-data v1.0.54 /catalog); JSON version 2 stores
            catalog keys; version-1 names are read through the catalog and
            rewritten on the next Save; HC-TDL-MAST retired (the masthead
            says the title's name); the catalog URL derives from planList.
   v1.0.15 — K9 reversed: Photo Essay flag removed.
   v1.0.14 — Header title true-centred. v1.0.13 — fixed gold header.
   v1.0.9–12 — masthead band (inline !important styles; HC-TDL-MAST).
   v1.0.6 — Local Weather a selectable singleton block (K10 reversed).
   v1.0.5 — save confirmation modal (Option C). Retired in v1.0.20.
   v1.0.4 — platform .studio-toast. v1.0.3 — layout + drag overhaul.
   v1.0.2 — Save LIVE. v1.0.1 — native Webflow tab self-mount. v1.0.0 — initial.

   WHAT THIS IS
   ------------
   Per-title Default Layout authoring surface. The operator builds the block
   order every NEW issue's Picker starts from. Stored as one JSON blob on
   TITLES-ADMIN.default-layout-json (K-1). Read through the Data Worker's
   /catalog on mount, written on Save via the Default Layout Save scenario
   (one-field write keyed by titleAdminId), then read back to confirm.

   JSON SHAPE (version 2):
     { "version": 2, "blocks": [ { "key":"greeting", "position":1 },
                                 { "key":"around-town", "position":2,
                                   "design":"<DESIGNS id>" },
                                 { "key":"articles", "position":3, "end":true },
                                 ... ] }
     Keys are IX_CONFIG.catalog keys. design and end are optional (absent =
     born design, no end). Version-1 blobs ({type:"Greeting"}) are read
     through the catalog and rewritten on the next Save.

   PLATFORM INTEGRATION (ta-page-body native-tab conventions):
     • Mounts into #default-layout-mount inside the title's Webflow tab pane;
       self-mounts when its tab (data-w-tab="Default Layout") is current.
     • Reads title context from window.TA_CONFIG.taItemId (titleAdminId).
     • Reads the stored blob from [data-tdl-json] or TA_CONFIG.defaultLayoutJson.
     • Save POSTs to window.PP_WEBHOOKS.dl / TA_CONFIG.makeDefaultLayout.

   NAMESPACE: window.TADefaultLayout · CSS prefix .tdl- · scoped to [data-tdl-root].
   HARDCODE DECISIONS (v1.0.21): band and header colours (#142e2e default when
   the title sets no --tdl-brand, #f4a127 header) and the sample header copy
   ("No. 000", "Greeting Title", a date) are cosmetic. Control copy ("Default",
   "Pick a design", "Cancel", "· end", "Template saved", "Save not confirmed")
   is UI copy (provisional HC-P-S18-1, extended). Which kinds open a group and
   which may sit inside one are config (catalog opener / groupable), not code. No tenant name, block list or
   design list.
   ============================================================================ */
(function () {
  'use strict';

  /* ───────────────────────── config / constants ───────────────────────── */

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

  var SCHEMA_VERSION = 2;
  var CONFIRM_TRIES = 4, CONFIRM_WAIT_MS = 1500;   // v1.0.20 — read-back after Save
  var FOOTER_H = 66, EDGE_PX = 56, EDGE_STEP = 14; // v1.0.20 — viewport grid, drag auto-scroll

  /* ───────────────────────────── state ───────────────────────────── */

  var S = {
    mounted: false,
    root: null,
    catalog: null,
    catalogError: '',
    palette: [],       // [{ key, name, icon, gold, one, opener, names, born, designs, byCount }]
    byKey: {},
    blocks: [],        // rows in order: { key, design, o:{design}, pair }  (a stored block)
                       //              or { key, close:true, pair }           (an end row, tab-only)
    needDesign: [],    // 1-based stored positions that must pick a design before Save
    dropped: [],       // stored entries the catalog could not place: [{position, value}]
    storedForm: 'none',
    original: null,
    dirty: false,
    saving: false,
    nextPair: 1,
    drag: null         // { kind:'move'|'add', y } while a drag is in flight (auto-scroll)
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
  // v1.0.20 — the raw JSON element is data, not page.
  function hideStoredRaw() {
    var el = document.querySelector('[data-tdl-json]');
    if (el) { el.hidden = true; el.style.display = 'none'; el.setAttribute('aria-hidden', 'true'); }
  }

  function titleAdminId() {
    return (window.TA_CONFIG && (window.TA_CONFIG.taItemId || window.TA_CONFIG.titleAdminId)) || '';
  }
  function titleSlug()  { return (window.TA_CONFIG && window.TA_CONFIG.titleSlug) || ''; }
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

  /* ───────────────────────── the catalog ───────────────────────── */

  function paletteOf(j) {
    return j.catalog.filter(function (e) { return e.blocks !== false; }).map(function (e) {
      var name = e.sectionName || e.name || e.key;
      return { key: e.key, name: name, icon: e.add || name.slice(0, 2).toUpperCase(),
               gold: e.side === 'revenue', one: e.perIssue === 'one',
               opener: e.opener === true,                                                   // v1.0.20
               groupable: e.groupable === true && e.opener !== true,                         // v1.0.21
               names: (e.defaultLayout || []).map(function (n) { return String(n).toLowerCase(); }),
               born: (e.design && e.design.id) ? { id: e.design.id, name: e.design.name || '' } : null,
               designs: (Array.isArray(e.designs) ? e.designs : []).map(function (d) { return { id: d.id, name: d.name || d.id, itemCount: d.itemCount || null }; }),
               byCount: Array.isArray(e.designs) && e.designs.length > 1 && e.designs.every(function (d) { return d.itemCount; }) };
    });
  }

  function fetchCatalog(fresh) {
    var url = catalogRoute(), taId = titleAdminId();
    if (!url) return Promise.reject(new Error('No catalog URL (TA_CONFIG.planList or catalogUrl).'));
    if (!taId) return Promise.reject(new Error('No titleAdminId on the page.'));
    var q = url + (url.indexOf('?') < 0 ? '?' : '&') + 'taId=' + encodeURIComponent(taId) + (fresh ? '&fresh=1' : '');
    return fetch(q).then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (x) {
        var j = x.body || {};
        if (!j.ok) throw new Error(j.error || ('The Worker answered ' + x.status + '.'));
        if (!Array.isArray(j.catalog)) throw new Error('IX_CONFIG.catalog is not set on the Data Worker.');
        return j;
      });
  }

  function loadCatalog() {
    S.catalog = null; S.catalogError = ''; S.palette = []; S.byKey = {};
    return fetchCatalog(false).then(function (j) {
      S.catalog = j;
      S.palette = paletteOf(j);
      S.palette.forEach(function (p) { S.byKey[p.key] = p; });
      ((j.meta && j.meta.warnings) || []).forEach(function (w) { console.warn('[tdl] Worker:', w); });
      return true;
    }).catch(function (e) {
      S.catalogError = (e && e.message) || 'The request failed.';
      console.warn('[tdl] catalog:', S.catalogError);
      return false;
    });
  }

  function itemFor(value) {
    var v = String(value || '').trim();
    if (!v) return null;
    if (S.byKey[v]) return S.byKey[v];
    var lower = v.toLowerCase();
    for (var i = 0; i < S.palette.length; i++) if (S.palette[i].names.indexOf(lower) >= 0) return S.palette[i];
    return null;
  }

  /* ───────────────────────── rows and pairs (v1.0.20) ───────────────────────── */

  function newRow(key, design) {
    design = design || '';
    return { key: key, design: design, o: { design: design }, pair: 0 };
  }
  function newPair(key, design) {
    var id = S.nextPair++;
    var a = newRow(key, design); a.pair = id;
    return [a, { key: key, close: true, pair: id }];
  }
  function isOpener(b) { return !!(b && !b.close && b.pair); }
  function isClose(b)  { return !!(b && b.close); }
  function closeIndexOf(i) {
    var b = S.blocks[i];
    if (!isOpener(b)) return -1;
    for (var k = i + 1; k < S.blocks.length; k++) if (isClose(S.blocks[k]) && S.blocks[k].pair === b.pair) return k;
    return -1;
  }
  function openerIndexOf(i) {
    var b = S.blocks[i];
    if (!isClose(b)) return -1;
    for (var k = i - 1; k >= 0; k--) if (isOpener(S.blocks[k]) && S.blocks[k].pair === b.pair) return k;
    return -1;
  }
  // Stored position of row i (close rows have none): count of stored rows up to i.
  function storedPos(i) {
    var n = 0;
    for (var k = 0; k <= i; k++) if (!isClose(S.blocks[k])) n++;
    return n;
  }
  function designOffered(it, id) {
    return !!(it && it.designs.some(function (d) { return d.id === id; }));
  }
  function designOf(b) {
    var it = S.byKey[b.key];
    return b.design || (it && it.born ? it.born.id : '');
  }
  function rowPending(b) { return !isClose(b) && b.design !== b.o.design; }
  function recomputeNeedDesign() {
    S.needDesign = [];
    S.blocks.forEach(function (b, i) {
      if (isClose(b)) return;
      var it = S.byKey[b.key];
      if (it && it.designs.length > 1 && !it.byCount && !it.born && !b.design) S.needDesign.push(storedPos(i));
    });
  }
  function blockExists(key) { return S.blocks.some(function (b) { return b.key === key && !b.close; }); }
  // v1.0.21 — how many pairs are open just before index i.
  function depthAt(i) {
    var d = 0;
    for (var k = 0; k < i && k < S.blocks.length; k++) { if (isOpener(S.blocks[k])) d++; else if (isClose(S.blocks[k])) d--; }
    return d;
  }
  function groupable(key) { var it = S.byKey[key]; return !!(it && it.groupable); }
  // A kind that may not sit inside a pair, landing at i, is refused.
  function refusedInside(key, i) {
    if (groupable(key)) return false;
    var it = S.byKey[key];
    if (it && it.opener) return false;                 // a pair may nest
    if (depthAt(i) <= 0) return false;
    toast('<b>' + esc(it ? it.name : key) + '</b> cannot sit inside a group; the newsletter closes the group before it.', true);
    return true;
  }

  /* ───────────────────────── hydrate ───────────────────────── */

  function hydrateFromStored() {
    S.blocks = []; S.dropped = []; S.storedForm = 'none'; S.nextPair = 1;
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
      var open = [];   // pair ids of groups still open, innermost last
      arr.forEach(function (b, i) {
        var value = String((b && (b.key || b.type)) || '').trim();
        var it = itemFor(value);
        var pos = (b && typeof b.position === 'number') ? b.position : i + 1;
        if (!it) { if (value) S.dropped.push({ position: pos, value: value }); return; }
        if (it.one && blockExists(it.key)) { S.dropped.push({ position: pos, value: value + ' (second ' + it.name + ')' }); return; }
        var design = String((b && b.design) || '').trim();
        if (design && !designOffered(it, design)) {
          S.dropped.push({ position: pos, value: value + ' (its saved design is no longer offered; pick one)' });
          design = '';
        }
        if (design && it.born && design === it.born.id) design = '';
        var end = !!(b && b.end === true);
        if (it.opener) {
          var p = newPair(it.key, design);
          S.blocks.push(p[0]);
          if (end) S.blocks.push(p[1]);        // an opener that also ends: an empty pair
          else open.push({ id: p[0].pair, close: p[1] });
          return;
        }
        if (open.length && !it.groupable) {              // v1.0.21 — the render would close here
          S.dropped.push({ position: pos, value: value + ' (cannot sit in a group; the group was closed before it)' });
          while (open.length) S.blocks.push(open.pop().close);
        }
        S.blocks.push(newRow(it.key, design));
        if (end) {
          if (open.length) S.blocks.push(open.pop().close);
          else S.dropped.push({ position: pos, value: value + ' (an end mark outside any group; cleared)' });
        }
      });
      // an opener with no end before the list ends closes at the end
      while (open.length) S.blocks.push(open.pop().close);
    }
    S.original = S.storedForm === 'names' ? '' : serialize();
    S.dirty = false;
  }

  /* ───────────────────────── serialize ───────────────────────── */

  // Stored blocks only; an end row marks the last stored block before it.
  function serialize() {
    var blocks = [];
    S.blocks.forEach(function (b) {
      if (isClose(b)) { if (blocks.length) blocks[blocks.length - 1].end = true; return; }
      var row = { key: b.key, position: blocks.length + 1 };
      if (b.design) row.design = b.design;
      blocks.push(row);
    });
    return JSON.stringify({ version: SCHEMA_VERSION, blocks: blocks });
  }
  // What the Worker should answer for the same rows (the read-back check).
  function expectedRows() {
    var rows = [];
    S.blocks.forEach(function (b) {
      if (isClose(b)) { if (rows.length) rows[rows.length - 1].end = true; return; }
      rows.push({ key: b.key, designId: designOf(b), end: false });
    });
    return rows;
  }

  /* ───────────────────────── dirty tracking ───────────────────────── */

  function recomputeDirty() {
    S.dirty = (serialize() !== S.original);
    recomputeNeedDesign();
    reflectDirty();
  }
  function reflectDirty() {
    if (!S.root) return;
    var note = $('.tdl-dirty-note');
    var need = $('.tdl-need-note');
    var save = $('.tdl-btn.tdl-save');
    var cancel = $('.tdl-btn.tdl-cancel');
    var blocked = S.needDesign.length > 0;
    if (note) note.hidden = !S.dirty || blocked;
    if (need) {
      need.hidden = !blocked;
      need.textContent = blocked ? (S.needDesign.length === 1
        ? 'Row ' + S.needDesign[0] + ' needs a design'
        : S.needDesign.length + ' rows need a design (' + S.needDesign.join(', ') + ')') : '';
    }
    if (save) save.disabled = !S.dirty || S.saving || !S.catalog || blocked;
    if (cancel) cancel.disabled = !S.dirty || S.saving;
  }

  /* ───────────────────────── label rule ───────────────────────── */
  // The name; " - N" when a plain kind repeats. An opener is just its name;
  // its end row is "<name> · end".
  function computeLabel(index) {
    var b = S.blocks[index], key = b.key, it = S.byKey[key] || { name: key };
    if (isClose(b)) return it.name + ' \u00b7 end';
    if (isOpener(b)) return it.name;
    var same = S.blocks.filter(function (x) { return x.key === key && !x.close; });
    if (same.length === 1) return it.name;
    var instance = S.blocks.slice(0, index + 1).filter(function (x) { return x.key === key && !x.close; }).length;
    return it.name + ' - ' + instance;
  }

  /* ───────────────────────── render ───────────────────────── */

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function render() {
    if (!S.root) return;
    var keepScroll = scrollTops();
    var paletteRows = S.palette.map(function (p) {
      var disabled = p.one && blockExists(p.key);
      return '<div class="tdl-pl-item' + (disabled ? ' tdl-pl-item--disabled' : '') + '"' +
               (disabled ? '' : ' draggable="true"') +
               ' data-add="' + esc(p.key) + '"' +
               (disabled ? ' aria-disabled="true" title="Already in layout \u2014 only one allowed"' : '') +
               (p.opener ? ' title="Adds a group: an opener and its end"' : '') + '>' +
               '<div class="tdl-pl-ico' + (p.gold ? ' tdl-gold' : '') + '">' + esc(p.icon) + '</div>' +
               '<div class="tdl-pl-label">' + esc(p.name) + (p.opener ? ' <span class="tdl-pl-pair">pair</span>' : p.groupable ? ' <span class="tdl-pl-pair" title="May sit inside a pair">in run</span>' : '') + '</div>' +
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
    if (S.dropped.length) notes += '<div class="tdl-scope-note">Left out of the saved layout: ' +
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

      '<div class="tdl-grid" data-tdl-grid>' +

        '<aside class="tdl-palette" data-tdl-col>' +
          '<div class="tdl-pl-card">' +
            '<h4>Add Block</h4>' +
            '<div class="tdl-pl-list" data-tdl-palette>' + paletteRows + '</div>' +
            '<div class="tdl-pl-hint">Click or drag to add \u00b7 lands at end \u00b7 drag to reorder \u00b7 drag rows between a pair to group them</div>' +
          '</div>' +
        '</aside>' +

        '<div class="tdl-stack-wrap" data-tdl-col data-tdl-scroll>' +
          '<div class="tdl-stack-intro">' +
            '<p>This template <b>drives what every new issue\u2019s Picker shows by default</b>. Each PubPlan starts here and can diverge per issue without affecting this template or future issues.</p>' +
            '<span class="tdl-applies">\u2605 Applies to: ' + esc(titleSlug() || titleName()) + '</span>' +
          '</div>' +
          notes +
          '<div class="tdl-fixed-mast" style="width:82%;height:80px;margin:0 auto 12px;background:var(--tdl-brand, #142e2e) !important;color:#fff !important;border-radius:5px 5px 0 0;display:flex;align-items:center;justify-content:center;font-family:\'Fraunces\',Georgia,serif;font-weight:600;font-size:26px;letter-spacing:-.01em;">' + esc(titleName()) + '</div>' +
          '<div class="tdl-fixed-hdr" style="width:82%;margin:-12px auto 14px;padding:16px 26px;background:#f4a127 !important;color:#1A1A1A !important;border-radius:0 0 5px 5px;display:flex;flex-direction:row;align-items:center;gap:18px;font-family:\'Fraunces\',Georgia,serif;">' +
            '<div style="background:transparent !important;flex:1;text-align:left;font-weight:700;font-size:14px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;">No. 000</div>' +
            '<div style="background:transparent !important;flex:1;text-align:center;font-style:italic;font-weight:500;font-size:22px;line-height:1.1;white-space:nowrap;">Greeting Title</div>' +
            '<div style="background:transparent !important;flex:1;text-align:right;font-size:14px;white-space:nowrap;">January 1, 2005</div>' +
          '</div>' +
          '<div class="tdl-ls-head">\u2191 Top of newsletter</div>' +
          '<div class="tdl-stack" data-tdl-stack></div>' +
          '<button class="tdl-add-blk" data-tdl-addfirst' + ((S.blocks.length || !S.palette.length) ? ' style="display:none"' : '') + '>' +
            '<span class="tdl-circ">+</span><span>Add your first block</span></button>' +
          '<div class="tdl-ls-head" style="margin-top:14px">\u2193 Bottom of newsletter</div>' +
        '</div>' +

        '<aside class="tdl-rail" data-tdl-col>' +
          '<div class="tdl-tr-card">' +
            '<h4>Template</h4>' +
            '<div class="tdl-tr-name">' + esc(titleName()) + ' Default</div>' +
            '<div class="tdl-tr-sub">' + esc(titleSlug() || '\u2014') + '</div>' +
            '<div class="tdl-tr-meta">' +
              '<div class="tdl-tr-row"><span class="tdl-tr-lbl">Blocks</span><span class="tdl-tr-val" data-tdl-blockcount>' + storedCount() + '</span></div>' +
              '<div class="tdl-tr-row"><span class="tdl-tr-lbl">Block kinds</span><span class="tdl-tr-val">' + S.palette.length + '</span></div>' +
              '<div class="tdl-tr-row"><span class="tdl-tr-lbl">Schema</span><span class="tdl-tr-val">v' + SCHEMA_VERSION + '</span></div>' +
            '</div>' +
            '<div class="tdl-tr-status"><span class="tdl-dot"></span><span class="tdl-status-lbl">Editing</span></div>' +
          '</div>' +
        '</aside>' +
      '</div>' +

      '<div class="tdl-footer-bar">' +
        '<button class="tdl-reset" type="button">Reset to blank</button>' +
        '<span class="tdl-sp"></span>' +
        '<span class="tdl-need-note" hidden></span>' +
        '<span class="tdl-dirty-note" hidden>Unsaved template changes</span>' +
        '<button class="tdl-btn tdl-cancel" type="button" disabled>Cancel</button>' +
        '<button class="tdl-btn tdl-save" type="button" disabled>Save template</button>' +
      '</div>';

    renderStack();
    wireChrome();
    recomputeDirty();
    fitGrid();
    restoreScrollTops(keepScroll);
  }

  function storedCount() { return S.blocks.filter(function (b) { return !b.close; }).length; }

  // v1.0.20 — UX-020: a re-render keeps each column where it was.
  function scrollTops() {
    if (!S.root) return null;
    return $$('[data-tdl-col]').map(function (c) { return c.scrollTop; });
  }
  function restoreScrollTops(tops) {
    if (!tops) return;
    $$('[data-tdl-col]').forEach(function (c, i) { if (typeof tops[i] === 'number') c.scrollTop = tops[i]; });
  }
  // v1.0.20 — the grid takes the viewport under its top edge, above the footer.
  function fitGrid() {
    var grid = S.root && $('[data-tdl-grid]');
    if (!grid) return;
    var top = grid.getBoundingClientRect().top + (window.pageYOffset || 0);
    var h = window.innerHeight - (top - (window.pageYOffset || 0)) - FOOTER_H - 12;
    if (h < 320) { grid.style.removeProperty('height'); S.root.classList.remove('tdl-viewport'); return; }
    grid.style.height = h + 'px';
    S.root.classList.add('tdl-viewport');
  }
  window.addEventListener('resize', function () { if (S.mounted) fitGrid(); });

  // v1.0.20 — one card. A close row is the pair's end: no design, no Cancel, no Dup.
  function cardHtml(i) {
    var blk = S.blocks[i], label = esc(computeLabel(i));
    if (isClose(blk)) {
      return '<div class="tdl-blk tdl-blk--end ix-dense" draggable="true" data-idx="' + i + '">' +
          '<div class="tdl-handle" aria-hidden="true">\u22ee\u22ee</div>' +
          '<div class="tdl-blk-head">' +
            '<span class="tdl-pos tdl-pos--end" title="The group ends here">\u2514</span>' +
            '<span class="tdl-type">' + label + '</span>' +
            '<span class="tdl-design"></span>' +
            '<span class="tdl-sp"></span>' +
            '<span class="tdl-row-cancel"></span>' +
            '<span class="tdl-act tdl-act--blank"></span>' +
            '<button class="tdl-act" title="Remove this group (its rows stay)" data-act="del">\u2715</button>' +
          '</div>' +
        '</div>';
    }
    var pending = rowPending(blk);
    return '<div class="tdl-blk ix-dense' + (pending ? ' tdl-blk--pending' : '') + (isOpener(blk) ? ' tdl-blk--opener' : '') + '" draggable="true" data-idx="' + i + '">' +
        '<div class="tdl-handle" aria-hidden="true">\u22ee\u22ee</div>' +
        '<div class="tdl-blk-head">' +
          '<span class="tdl-pos">' + storedPos(i) + '</span>' +
          '<span class="tdl-type">' + label + '</span>' +
          '<span class="tdl-design">' + designCell(blk) + '</span>' +
          '<span class="tdl-sp"></span>' +
          '<span class="tdl-row-cancel"><button class="ix-revert" type="button" data-act="rowcancel"' + (pending ? '' : ' hidden') + '>Cancel</button></span>' +
          '<button class="tdl-act" title="' + (isOpener(blk) ? 'Add another group like this one' : 'Duplicate') + '" data-act="dup">\u2398</button>' +
          '<button class="tdl-act" title="' + (isOpener(blk) ? 'Remove this group (its rows stay)' : 'Remove from template') + '" data-act="del">\u2715</button>' +
        '</div>' +
      '</div>';
  }

  // v1.0.20 — the stack as a tree: a pair and the rows between it sit in a
  // frame; frames nest. data-idx on every card stays the flat index.
  function renderStack() {
    var stack = $('[data-tdl-stack]');
    if (!stack) return;
    var html = '', i = 0, n = S.blocks.length;
    // walk(stopPair) renders rows until the close of stopPair; the close card
    // itself is returned apart so it sits at the frame's foot, level with the
    // opener, not inside the indented rows.
    function walk(stopPair) {
      var out = '', foot = '';
      while (i < n) {
        var b = S.blocks[i];
        if (isClose(b)) {
          if (b.pair === stopPair) { foot = cardHtml(i); i++; break; }
          out += cardHtml(i); i++;            // a close with no opener before it: plain
          continue;
        }
        if (isOpener(b)) {
          var head = cardHtml(i); i++;
          var r = walk(b.pair);
          out += '<div class="tdl-group">' + head + '<div class="tdl-group-in">' + r.inner + '</div>' + r.foot + '</div>';
          continue;
        }
        out += cardHtml(i); i++;
      }
      return { inner: out, foot: foot };
    }
    html = walk(0).inner;
    if (!n) {
      stack.innerHTML = '<div class="tdl-empty">No blocks yet. Click a block type in the palette to start building this title\u2019s default layout.</div>';
    } else {
      stack.innerHTML = html;
    }
    wireStack();
    var count = $('[data-tdl-blockcount]');
    if (count) count.textContent = storedCount();
    var addFirst = $('[data-tdl-addfirst]');
    if (addFirst) addFirst.style.display = (S.blocks.length || !S.palette.length) ? 'none' : '';
  }

  function designCell(blk) {
    var it = S.byKey[blk.key];
    if (!it) return '';
    var changed = blk.design !== blk.o.design;
    if (it.byCount) return '<span class="tdl-design-txt" title="Picked from how many items the block holds">from the count</span>';
    if (it.designs.length > 1 && !it.born) {
      var opts = '<option value=""' + (!blk.design ? ' selected' : '') + ' disabled>Pick a design\u2026</option>';
      it.designs.forEach(function (d) {
        opts += '<option value="' + esc(d.id) + '"' + (blk.design === d.id ? ' selected' : '') + '>' + esc(d.name) + '</option>';
      });
      return '<select class="ix-picker-input tdl-design-sel' + (changed ? ' ix-picker-input--changed' : '') +
             (!blk.design ? ' tdl-design-sel--empty' : '') + '" data-design title="Design this block is born with">' + opts + '</select>';
    }
    var one = it.born || (it.designs.length === 1 ? it.designs[0] : null);
    return one ? '<span class="tdl-design-txt" title="The design this block is born with">' + esc(one.name) + '</span>' : '';
  }

  /* ───────────────────────── wiring ───────────────────────── */

  function wireChrome() {
    $$('[data-tdl-palette] .tdl-pl-item').forEach(function (it) {
      it.addEventListener('click', function () { addBlock(it.getAttribute('data-add')); });
      it.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/tdl-add', it.getAttribute('data-add'));
        e.dataTransfer.effectAllowed = 'copy';
        it.classList.add('tdl-dragging');
        dragBegin();
      });
      it.addEventListener('dragend', function () { it.classList.remove('tdl-dragging'); clearDropHints(); dragEnd(); });
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
    $$('[data-tdl-stack] [data-design]').forEach(function (sel) {
      sel.addEventListener('mousedown', function (e) { e.stopPropagation(); });
      sel.addEventListener('change', function () {
        var blk = sel.closest('.tdl-blk'); var idx = parseInt(blk.getAttribute('data-idx'), 10);
        if (isNaN(idx)) return;
        S.blocks[idx].design = sel.value || '';
        renderStack(); recomputeDirty();
      });
    });
    $$('[data-tdl-stack] .tdl-design, [data-tdl-stack] .tdl-row-cancel').forEach(function (c) {
      c.addEventListener('dragstart', function (e) { e.preventDefault(); e.stopPropagation(); });
    });

    $$('[data-tdl-stack] .tdl-act, [data-tdl-stack] [data-act="rowcancel"]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var blk = b.closest('.tdl-blk');
        var idx = parseInt(blk.getAttribute('data-idx'), 10);
        if (isNaN(idx)) return;
        var act = b.getAttribute('data-act');
        var row = S.blocks[idx], key = row.key, it = S.byKey[key] || { name: key };
        if (act === 'rowcancel') {
          row.design = row.o.design;
          renderStack(); recomputeDirty();
        } else if (act === 'dup') {
          if (singletonBlocked(key)) return;
          if (isOpener(row)) {
            var at = closeIndexOf(idx); at = at < 0 ? idx + 1 : at + 1;
            var p = newPair(key, row.design);
            S.blocks.splice(at, 0, p[0], p[1]);
          } else {
            S.blocks.splice(idx + 1, 0, newRow(key, row.design));
          }
          renderStack(); recomputeDirty();
          toast('Duplicated <b>' + esc(it.name) + '</b>.');
        } else if (act === 'del') {
          removePairOrRow(idx);
          if (it.one) render(); else renderStack();
          recomputeDirty();
          toast('Removed <b>' + esc(it.name) + '</b>.');
        }
      });
    });

    var stack = $('[data-tdl-stack]');

    $$('[data-tdl-stack] .tdl-blk').forEach(function (card) {
      card.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/tdl-move', card.getAttribute('data-idx'));
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('tdl-dragging');
        var idx = parseInt(card.getAttribute('data-idx'), 10), end = closeIndexOf(idx);
        if (end > idx) for (var k = idx + 1; k <= end; k++) {   // the whole group travels
          var c = $('[data-tdl-stack] .tdl-blk[data-idx="' + k + '"]'); if (c) c.classList.add('tdl-dragging');
        }
        dragBegin();
      });
      card.addEventListener('dragend', function () {
        $$('[data-tdl-stack] .tdl-blk.tdl-dragging').forEach(function (c) { c.classList.remove('tdl-dragging'); });
        clearDropHints();
        dragEnd();
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

    if (stack) {
      stack.addEventListener('dragover', function (e) { e.preventDefault(); });
      stack.addEventListener('drop', function (e) {
        if (e.target === stack || e.target.classList.contains('tdl-empty') || e.target.classList.contains('tdl-group-in')) {
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

  // v1.0.20 — drag auto-scroll: near the top or bottom edge of the newsletter
  // column the column scrolls; when it has no room of its own, the page does.
  function dragBegin() {
    S.drag = { y: -1 };
    document.addEventListener('dragover', onDragMove, true);
    requestAnimationFrame(autoScroll);
  }
  function dragEnd() {
    S.drag = null;
    document.removeEventListener('dragover', onDragMove, true);
  }
  function onDragMove(e) { if (S.drag) S.drag.y = e.clientY; }
  function autoScroll() {
    if (!S.drag) return;
    var col = S.root && $('[data-tdl-scroll]');
    var y = S.drag.y;
    if (col && y >= 0) {
      var r = col.getBoundingClientRect();
      var canScroll = col.scrollHeight > col.clientHeight + 2;
      var dy = 0;
      if (y < r.top + EDGE_PX && y > r.top - EDGE_PX) dy = -EDGE_STEP;
      else if (y > r.bottom - EDGE_PX && y < r.bottom + EDGE_PX) dy = EDGE_STEP;
      if (dy) {
        if (canScroll) col.scrollTop += dy;
        else window.scrollBy(0, dy);
      } else if (y < EDGE_PX) window.scrollBy(0, -EDGE_STEP);
      else if (y > window.innerHeight - EDGE_PX) window.scrollBy(0, EDGE_STEP);
    }
    requestAnimationFrame(autoScroll);
  }

  function singletonBlocked(key) {
    var it = S.byKey[key];
    if (it && it.one && blockExists(key)) {
      toast('<b>' + esc(it.name) + '</b> can only be added once.', true);
      return true;
    }
    return false;
  }

  // Remove row i; an opener or end row takes its partner with it.
  function removePairOrRow(i) {
    var b = S.blocks[i], j = -1;
    if (isOpener(b)) j = closeIndexOf(i);
    else if (isClose(b)) j = openerIndexOf(i);
    var idxs = [i]; if (j >= 0) idxs.push(j);
    idxs.sort(function (a, c) { return c - a; }).forEach(function (k) { S.blocks.splice(k, 1); });
  }

  // Insert new rows for a kind at insertAt (a pair for an opener kind).
  function rowsFor(key) {
    var it = S.byKey[key];
    return it && it.opener ? newPair(key, '') : [newRow(key, '')];
  }

  function handleDrop(e, insertAt) {
    var addKey = e.dataTransfer.getData('text/tdl-add');
    var moveIdx = e.dataTransfer.getData('text/tdl-move');
    if (addKey) {
      var it = S.byKey[addKey];
      if (!it) return;
      if (singletonBlocked(addKey)) return;
      if (refusedInside(addKey, insertAt)) return;      // v1.0.21
      var rows = rowsFor(addKey);
      Array.prototype.splice.apply(S.blocks, [insertAt, 0].concat(rows));
      if (it.one) render(); else renderStack();
      recomputeDirty();
      toast('Added <b>' + esc(it.name) + '</b>' + (it.opener ? ' (a pair)' : '') + '.');
    } else if (moveIdx !== '') {
      var from = parseInt(moveIdx, 10);
      if (isNaN(from)) return;
      var b = S.blocks[from];
      // a group moves whole: opener through its end
      var last = isOpener(b) ? closeIndexOf(from) : -1;
      if (last < 0) last = from;
      if (insertAt > from && insertAt <= last + 1) return;        // dropped onto itself
      if (isClose(b)) {                                             // the end never goes above its opener
        var op = openerIndexOf(from);
        if (op >= 0 && insertAt <= op) { toast('The end of a group stays below its opener.', true); return; }
        // v1.0.21 — moving the end down would take rows into the group: each must be groupable
        for (var k = from + 1; k < insertAt; k++) {
          var r = S.blocks[k];
          if (!isClose(r) && !isOpener(r) && !groupable(r.key) && depthAt(k) === depthAt(from)) {
            toast('<b>' + esc((S.byKey[r.key] || { name: r.key }).name) + '</b> cannot sit inside a group; the newsletter closes the group before it.', true); return;
          }
        }
      } else if (last === from) {                                   // a plain row landing inside a pair
        if (refusedInside(b.key, insertAt)) return;
      }
      var moved = S.blocks.splice(from, last - from + 1);
      var to = insertAt > from ? insertAt - moved.length : insertAt;
      Array.prototype.splice.apply(S.blocks, [to, 0].concat(moved));
      renderStack(); recomputeDirty();
    }
  }

  function addBlock(key) {
    var it = S.byKey[key];
    if (!it) return;
    if (singletonBlocked(key)) return;
    Array.prototype.push.apply(S.blocks, rowsFor(key));
    if (it.one) render(); else renderStack();
    recomputeDirty();
    toast('Added <b>' + esc(it.name) + '</b>' + (it.opener ? ' as a pair' : '') + ' to template.');
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
    if (!S.dirty || S.saving || !S.catalog || S.needDesign.length) return;
    var payloadJson = serialize();
    var expected = expectedRows();
    var taId = titleAdminId();
    if (!taId) { notify('No titleAdminId on the page \u2014 cannot save.', 'err'); return; }

    setSaving(true);

    if (STUB_SAVE || !saveRoute()) {
      console.log('[tdl] STUB save \u2014 would POST to Default Layout Save scenario:', { titleAdminId: taId, defaultLayoutJson: payloadJson });
      setTimeout(function () { setSaving(false); afterSave(payloadJson); notify('Template saved (stub).', 'info'); }, 500);
      return;
    }

    var body = new URLSearchParams();
    body.set('titleAdminId', taId);
    body.set('defaultLayoutJson', payloadJson);
    var busy = notify('Saving\u2026', 'busy');
    fetch(saveRoute(), { method: 'POST', mode: 'no-cors', body: body })
      .then(function () { return confirmSaved(expected, CONFIRM_TRIES); })
      .then(function (ok) {
        if (busy && busy.close) busy.close();
        setSaving(false);
        if (ok) {
          afterSave(payloadJson);
          notify('Template saved', 'ok', { detail: 'Future issues of ' + (titleSlug() || titleName()) + ' start from this layout.' });
        } else {
          notify('Save not confirmed', 'unverified', { detail: 'The CMS does not yet show this layout. Your edits are kept; Save again, or reload to check.' });
        }
      })
      .catch(function (err) {
        console.error('[tdl] save failed', err);
        if (busy && busy.close) busy.close();
        setSaving(false);
        notify('Save failed \u2014 please retry.', 'err');
      });
  }

  // v1.0.20 — read the layout back fresh from the CMS and compare every row.
  function confirmSaved(expected, tries) {
    function once() {
      return fetchCatalog(true).then(function (j) {
        var rows = (j.layout && Array.isArray(j.layout.rows)) ? j.layout.rows : [];
        if (rows.length !== expected.length) return false;
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i], x = expected[i];
          if (String(r.key || '') !== x.key) return false;
          if (String(r.designId || '') !== String(x.designId || '')) return false;
          if (!!r.endGroup !== !!x.end) return false;
        }
        return true;
      }).catch(function () { return false; });
    }
    function attempt(left) {
      return new Promise(function (res) { setTimeout(res, CONFIRM_WAIT_MS); })
        .then(once)
        .then(function (ok) { return (ok || left <= 1) ? ok : attempt(left - 1); });
    }
    return attempt(tries);
  }

  function afterSave(payloadJson) {
    S.original = payloadJson;
    S.storedForm = 'keys';
    S.dropped = [];
    S.blocks.forEach(function (b) { if (!b.close) b.o = { design: b.design }; });
    renderStack();
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

  /* ───────────────────────── notices ───────────────────────── */

  // Small in-tab notices (added, removed, duplicated): the platform studio-toast.
  function toast(msg, isErr) {
    var t = document.createElement('div');
    t.className = 'studio-toast tdl-toast' + (isErr ? ' studio-toast--err' : '');
    t.innerHTML = msg;
    document.body.appendChild(t);
    void t.offsetWidth;
    t.classList.add('visible');
    setTimeout(function () {
      t.classList.remove('visible');
      setTimeout(function () { t.remove(); }, 320);
    }, 2600);
  }
  // v1.0.20 — outcomes of a write: the platform success toast (IxToast), which
  // keeps ok, unverified and failed apart. Falls back to studio-toast.
  function notify(msg, variant, opts) {
    if (window.IxToast && typeof IxToast.show === 'function') return IxToast.show(msg, variant, opts || {});
    if (variant === 'busy') return { close: function () {} };
    var text = esc(msg) + (opts && opts.detail ? ' \u2014 ' + esc(opts.detail) : '');
    toast(text, variant === 'err' || variant === 'unverified');
    return { close: function () {} };
  }

  /* ───────────────────────── mount ───────────────────────── */

  var TAB_NAME = 'Default Layout';

  function findMount() {
    return document.getElementById('default-layout-mount') ||
           document.querySelector('[data-tdl-mount]');
  }
  function tabIsActive() {
    var link = document.querySelector('.w-tab-link[data-w-tab="' + TAB_NAME + '"]') ||
               document.querySelector('[data-w-tab="' + TAB_NAME + '"]');
    if (!link) return true;
    return link.classList.contains('w--current');
  }

  function mount() {
    var host = findMount();
    if (!host) { console.warn('[tdl] no mount (#default-layout-mount) found'); return; }
    if (!host.hasAttribute('data-tdl-root')) host.setAttribute('data-tdl-root', '');
    S.root = host;
    S.mounted = true;
    hideStoredRaw();
    host.innerHTML = '<div class="tdl-pl-hint" style="padding:24px">Reading the block catalog\u2026</div>';
    loadCatalog().then(function () {
      hydrateFromStored();
      render();
      console.log('[tdl] Default Layout tab mounted \u00b7 v1.0.20 \u00b7 kinds:', S.palette.length,
                  '\u00b7 blocks:', storedCount(), '\u00b7 stored:', S.storedForm,
                  '\u00b7 titleAdminId:', titleAdminId() || '(none)',
                  '\u00b7 save:', (STUB_SAVE || !saveRoute()) ? 'STUB' : 'LIVE');
    });
  }

  function maybeMount() {
    if (!findMount()) return;
    if (!tabIsActive()) return;
    if (!S.mounted || S.root !== findMount()) mount();
    else fitGrid();
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('.w-tab-link[role="tab"], [data-w-tab]');
    if (!link) return;
    setTimeout(maybeMount, 60);
  }, true);

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
    get state() {
      return { rows: S.blocks.map(function (b) { return b.close ? { key: b.key, close: true, pair: b.pair } : { key: b.key, design: b.design, pair: b.pair || 0 }; }),
               dirty: S.dirty, stored: S.storedForm, dropped: S.dropped.slice(), needDesign: S.needDesign.slice() };
    },
    serialize: serialize,
    version: '1.0.21'
  };
})();
