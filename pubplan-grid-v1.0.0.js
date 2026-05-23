/* ============================================================
   pubplan-grid-v1.0.0.js
   INBXIFY — MNA Workstream C: multi-edition PubPlan grid

   WHAT THIS IS
     The block editor on the PUBLICATION PLAN template page. One issue
     (the PubPlan) holds N editions (NEWSLETTER records). Editions SHARE
     a slot skeleton (one row = one block-type at one position, across
     every edition) and DIFFER only in per-cell asset assignment.
       row    = a shared slot (block-type + position)
       column = an edition (a NEWSLETTER)
       cell   = that edition's asset for that slot (may be empty)
     Supersedes pubplan-sequencer (single-column = the N=1 case here).

   EDIT MODEL
     - Structural ops fan across ALL editions at once:
         drag a row  -> new position written to every edition's row for that slot
         + Block      -> a new row created in every edition (shared slot-key)
         retype       -> block-type changed in every edition's row
         delete slot  -> the row removed from every edition
     - Per-cell ops touch ONE edition's row:
         assign/swap asset, toggle show-as-sponsored
     - + Edition -> create a NEWSLETTER + clone the skeleton (the Cloner).

   SLOT ALIGNMENT
     Rows are grouped across editions by `slot-key` (NEW NL-BLOCKS field,
     shared by all of a slot's per-edition rows). Falls back to position
     grouping if slot-key is absent (legacy rows) — see buildModel().

   WRITE PATH (v1.0.0 — STUBBED)
     Save assembles the fanned payload and logs it. It does NOT POST yet:
     the PubPlan Block Writer blueprint must be revised for the multi-
     edition shape (per-ITEM newsletterId, not top-level; + slot-key on
     create). Payload shape Save will send once live:
       { op:'reorder', items:[{id, position}] }              // fanned
       { op:'save',    items:[{id|null, newsletterId, slotKey,
                               blockType, blockTypeHash, position,
                               planningNote, showAsSponsored,
                               assetType, assetId}] }
       { op:'delete',  items:[{id}] }                        // fanned
       { op:'cloneEdition', name, fromEditionId, slots:[...] } // Cloner
     Flip STUB_WRITES=false after the blueprint revision.

   ┌─ WEBFLOW WIRING (PUBLICATION PLAN template page) ──────────────┐
   │ Mount + nested Collection Lists:                                │
   │  <div data-pp-grid-root data-uses-legacy="false"               │
   │       data-pubplan-id="{PUBLICATION PLAN id}"                  │
   │       data-issue-code="{issue-number}"                         │
   │       data-issue-title="{title name}">                        │
   │   <!-- editions: NEWSLETTERS where Publication Plan = current --│
   │   <div data-editions-wrapper style="display:none">             │
   │     <div data-edition data-edition-id="{newsletter id}"        │
   │          data-edition-name="{edition label}"                  │
   │          data-edition-sub="{recipients/segment}">             │
   │       <!-- nested: NL-BLOCKS where Newsletter = this edition,  │
   │            sorted by position -->                              │
   │       <div data-nlblocks-wrapper>                             │
   │         <div data-nlb data-nlb-id="{self-nlb-item-id}"        │
   │              data-nlb-slot-key="{slot-key}"                   │
   │              data-nlb-position="{position}"                   │
   │              data-nlb-type="{block-type NAME}"               │
   │              data-nlb-asset="{asset label or empty}"         │
   │              data-nlb-asset-id="{asset id or empty}"         │
   │              data-nlb-company="{customer/sponsor or empty}"  │
   │              data-nlb-sponsored="{true|false}"              │
   │              data-nlb-banner-size="{235|340 or empty}"></div>│
   │       </div>                                                  │
   │     </div>                                                    │
   │   </div>                                                       │
   │  </div>                                                        │
   │ Block-type roster (label+hash): <div data-blocktype-list ...>  │
   │ NEW NL-BLOCKS field: `slot-key` (text). Plus `planning-note`.  │
   └────────────────────────────────────────────────────────────────┘

   NAMESPACE window.InbxPubPlanGrid · CSS prefix .ppg-
   Authored 2026-05-23 · MNA Workstream C (multi-edition grid)
   ============================================================ */

(function () {
  'use strict';

  var VERSION = '1.0.0';
  var STUB_WRITES = true;                 // blueprint needs multi-edition revision first
  var PP_WEBHOOK_FALLBACK = 'https://hook.us1.make.com/dt6lciasnzewg8u5j8yvgl5hjb6gf95e';
  var LOG = '[pp-grid v' + VERSION + ']';

  var FALLBACK_TYPES = [
    'Greeting (GR)', 'Feature Article (FA)', 'Top Stories (TS)', 'Banner Ad (BA)',
    'Splash Block (SB)', 'Text Article (TXA)', 'RE Listing (RE)', 'Event (EV)',
    'Business List (BL)', 'Divider', 'Spacer'
  ];

  // ---- self-load CSS (version-matched, ASF hardening pattern) ----
  function selfLoadCSS() {
    try {
      var me = document.currentScript ||
        (function () { var s = document.getElementsByTagName('script'); return s[s.length - 1]; })();
      if (!me || !me.src) return;
      var cssUrl = me.src.replace(/\.js(\?.*)?$/, '.css$1');
      var has = Array.prototype.some.call(document.styleSheets, function (ss) {
        return ss.href && ss.href.indexOf('pubplan-grid-v' + VERSION) !== -1;
      });
      if (has) return;
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = cssUrl;
      document.head.appendChild(l);
    } catch (e) { console.warn(LOG, 'CSS self-load skipped:', e); }
  }

  function ppWebhookUrl() {
    var c = (window.TA_CONFIG && window.TA_CONFIG.ppWebhooks) || {};
    return c.base || c.blockSave || PP_WEBHOOK_FALLBACK;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function fmt(n) { return (n === Math.floor(n)) ? n.toFixed(1) : String(n); }

  // ---- data adapter: nested editions -> blocks ----
  function readEditions(root) {
    var wrap = root.querySelector('[data-editions-wrapper]');
    if (!wrap) return null;
    var eds = [];
    Array.prototype.forEach.call(wrap.querySelectorAll('[data-edition]'), function (el) {
      var blocks = [];
      Array.prototype.forEach.call(el.querySelectorAll('[data-nlb]'), function (b) {
        var pos = parseFloat(b.getAttribute('data-nlb-position'));
        blocks.push({
          id: b.getAttribute('data-nlb-id') || null,
          slotKey: b.getAttribute('data-nlb-slot-key') || '',
          pos: isNaN(pos) ? 0 : pos,
          type: b.getAttribute('data-nlb-type') || '',
          asset: b.getAttribute('data-nlb-asset') || null,
          assetId: b.getAttribute('data-nlb-asset-id') || null,
          company: b.getAttribute('data-nlb-company') || '',
          sponsored: b.getAttribute('data-nlb-sponsored') === 'true',
          bannerSize: b.getAttribute('data-nlb-banner-size') || '235'
        });
      });
      eds.push({
        id: el.getAttribute('data-edition-id'),
        name: el.getAttribute('data-edition-name') || 'Edition',
        sub: el.getAttribute('data-edition-sub') || '',
        blocks: blocks
      });
    });
    return eds;
  }

  function readTypeRoster(root) {
    var list = root.querySelector('[data-blocktype-list]') || document.querySelector('[data-blocktype-list]');
    if (list) {
      var items = Array.prototype.slice.call(list.querySelectorAll('[data-bt-label]'));
      if (items.length) return items.map(function (el) {
        return { label: el.getAttribute('data-bt-label'), hash: el.getAttribute('data-bt-hash') || '' };
      });
    }
    console.warn(LOG, 'no [data-blocktype-list] — using FALLBACK_TYPES (hashes blank).');
    return FALLBACK_TYPES.map(function (l) { return { label: l, hash: '' }; });
  }

  // ---- demo fallback (the approved mockup seed) ----
  function demoEditions() {
    function blk(sk, pos, type, asset, co, sp, bs) {
      return { id: sk + '_demo', slotKey: sk, pos: pos, type: type, asset: asset, assetId: null, company: co || '', sponsored: !!sp, bannerSize: bs || '235' };
    }
    return [
      { id: 'e1', name: 'Wyckoff', sub: '~6,000', blocks: [
        blk('sk1', 1, 'Greeting (GR)', 'Welcome — Issue 113', ''), blk('sk2', 2, 'Feature Article (FA)', 'River Park Reopens', 'Staff'),
        blk('sk3', 3, 'Feature Article (FA)', 'Meet the Ambrose Family', 'Sponsored', true), blk('sk4', 4, 'Banner Ad (BA)', null, 'Valley Dental', true, '235'),
        blk('sk5', 5, 'Top Stories (TS)', '3 stories selected', ''), blk('sk6', 6, 'Event (EV)', 'Fall Street Fair', 'Chamber')
      ] },
      { id: 'e2', name: 'Franklin Lakes', sub: '~3,200', blocks: [
        blk('sk1', 1, 'Greeting (GR)', 'Welcome — Issue 113', ''), blk('sk2', 2, 'Feature Article (FA)', 'New FL School Budget', 'Staff'),
        blk('sk3', 3, 'Feature Article (FA)', null, ''), blk('sk4', 4, 'Banner Ad (BA)', null, 'Franklin Lakes Realty', true, '235'),
        blk('sk5', 5, 'Top Stories (TS)', '3 stories selected', ''), blk('sk6', 6, 'Event (EV)', 'FL Farmers Market', '')
      ] },
      { id: 'e3', name: 'Oakland', sub: '~2,800', blocks: [
        blk('sk1', 1, 'Greeting (GR)', 'Welcome — Issue 113', ''), blk('sk2', 2, 'Feature Article (FA)', 'Oakland Trail Update', 'Staff'),
        blk('sk3', 3, 'Feature Article (FA)', 'Local Hero: Coach Diaz', 'Staff'), blk('sk4', 4, 'Banner Ad (BA)', null, 'Oakland Auto Group', true, '340'),
        blk('sk5', 5, 'Top Stories (TS)', '2 stories selected', ''), blk('sk6', 6, 'Event (EV)', null, '')
      ] }
    ];
  }

  // ---- the grid ----
  function Grid(root) {
    this.root = root;
    this.pubplanId = root.getAttribute('data-pubplan-id') || '';
    this.titleAdminId = (window.TA_CONFIG && window.TA_CONFIG.taItemId) || root.getAttribute('data-title-admin-id') || '';
    this.issueCode = root.getAttribute('data-issue-code') || '—';
    this.issueTitle = root.getAttribute('data-issue-title') || '';
    this.types = readTypeRoster(root);
    var eds = readEditions(root);
    this.demo = !eds;
    this.editions = (eds && eds.length) ? eds : demoEditions();
    this.newSlot = 0; this.newEd = 0; this.dragKey = null;
    this.buildModel();
    this.snapshot();
  }

  // group per-edition blocks into shared slots (by slot-key, else position)
  Grid.prototype.buildModel = function () {
    var self = this, byKey = {};
    this.editions.forEach(function (e) {
      e.cells = {};
      e.blocks.forEach(function (b) {
        var k = b.slotKey || ('pos:' + b.pos);
        if (!byKey[k]) byKey[k] = { key: k, pos: b.pos, type: b.type };
        b.slotKey = k;
        e.cells[k] = b;
      });
    });
    var hashByLabel = {}; this.types.forEach(function (t) { hashByLabel[t.label] = t.hash; });
    this.hashFor = function (label) { return hashByLabel[label] || ''; };
    this.slots = Object.keys(byKey).map(function (k) { return byKey[k]; })
      .sort(function (a, b) { return a.pos - b.pos; });
  };

  Grid.prototype.snapshot = function () {
    this._snap = JSON.stringify({
      slots: this.slots.map(function (s) { return { key: s.key, pos: s.pos, type: s.type }; }),
      cells: this.editions.map(function (e) {
        return { id: e.id, c: Object.keys(e.cells).map(function (k) {
          var b = e.cells[k]; return { k: k, a: b.asset, ai: b.assetId, co: b.company, sp: b.sponsored };
        }) };
      })
    });
    this.dirtyOps = { reorders: {}, retypes: {}, newSlots: {}, cells: [], cloneEditions: [] };
  };

  Grid.prototype.cellOf = function (ed, slotKey) { return ed.cells[slotKey] || null; };

  Grid.prototype.anyDirty = function () {
    var d = this.dirtyOps;
    return Object.keys(d.reorders).length || Object.keys(d.retypes).length ||
      Object.keys(d.newSlots).length || d.cells.length || d.cloneEditions.length;
  };

  Grid.prototype.mount = function () {
    var demoNote = this.demo
      ? '<div class="ppg-demo">Demo data — no <code>[data-editions-wrapper]</code> on the page. Wire the nested NEWSLETTERS \u2192 NL-BLOCKS lists (see file header) to read live editions.</div>'
      : '';
    this.root.innerHTML = demoNote +
      '<div class="ppg-issue"><span class="ppg-code">' + esc(this.issueCode) + '</span>' +
      '<span class="ppg-ttl">' + esc(this.issueTitle) + '</span>' +
      '<div class="ppg-meta">' +
        '<span><b data-ppg-edn>0</b>editions</span><span><b data-ppg-sln>0</b>blocks</span>' +
      '</div></div>' +
      '<div class="ppg-legend">' +
        '<span class="ppg-k"><span class="ppg-sw" style="background:var(--ix-cream-warm);border:1px solid var(--ix-border)"></span> shared structure (drag a row \u2192 all editions)</span>' +
        '<span class="ppg-k"><span class="ppg-sw" style="background:#fff;border:1px solid var(--ix-border)"></span> per-edition asset</span>' +
        '<span class="ppg-k"><span class="ppg-sw" style="background:var(--ix-gold-glow);border:1px solid var(--ix-gold)"></span> sponsored</span>' +
      '</div>' +
      '<div class="ppg-scroll"><div class="ppg-grid" data-ppg-grid></div></div>' +
      '<div class="ppg-addblock" data-ppg-addblock>+ Block (adds a slot to every edition)</div>' +
      '<div class="ppg-bar"><span class="ppg-status" data-ppg-status>No changes</span>' +
        '<button class="ppg-btn ppg-btn-ghost" data-ppg-discard disabled>Discard</button>' +
        '<button class="ppg-btn ppg-btn-primary" data-ppg-save disabled>Save issue</button></div>' +
      '<pre class="ppg-payload" data-ppg-payload></pre>';
    this.el = {
      grid: this.root.querySelector('[data-ppg-grid]'),
      edn: this.root.querySelector('[data-ppg-edn]'),
      sln: this.root.querySelector('[data-ppg-sln]'),
      status: this.root.querySelector('[data-ppg-status]'),
      discard: this.root.querySelector('[data-ppg-save]') && this.root.querySelector('[data-ppg-discard]'),
      save: this.root.querySelector('[data-ppg-save]'),
      payload: this.root.querySelector('[data-ppg-payload]')
    };
    var self = this;
    this.root.querySelector('[data-ppg-addblock]').addEventListener('click', function () { self.addBlock(); });
    this.el.discard.addEventListener('click', function () { self.discard(); });
    this.el.save.addEventListener('click', function () { self.save(); });
    this.render();
  };

  Grid.prototype.render = function () {
    var self = this;
    this.el.edn.textContent = this.editions.length;
    this.el.sln.textContent = this.slots.length;
    this.el.grid.innerHTML = '';

    // header row
    var h = document.createElement('div'); h.className = 'ppg-row ppg-hrow';
    var corner = document.createElement('div'); corner.className = 'ppg-corner'; corner.textContent = 'Blocks';
    h.appendChild(corner);
    this.editions.forEach(function (e) {
      var eh = document.createElement('div'); eh.className = 'ppg-ehead';
      eh.innerHTML = '<div style="flex:1;min-width:0"><div class="ppg-ename">' + esc(e.name) + '</div>' +
        '<div class="ppg-esub">' + esc(e.sub) + '</div></div><span class="ppg-kebab" title="rename \u00b7 clone \u00b7 remove">\u22ef</span>';
      h.appendChild(eh);
    });
    var ac = document.createElement('div'); ac.className = 'ppg-addcol';
    ac.innerHTML = '<button title="Add edition (clone skeleton)">+</button>';
    ac.querySelector('button').addEventListener('click', function () { self.addEdition(); });
    h.appendChild(ac);
    this.el.grid.appendChild(h);

    // slot rows
    this.slots.forEach(function (s) {
      var rowDirty = !!self.dirtyOps.reorders[s.key] || !!self.dirtyOps.retypes[s.key] || !!self.dirtyOps.newSlots[s.key];
      var r = document.createElement('div'); r.className = 'ppg-row' + (rowDirty ? ' ppg-changed' : '');
      r.setAttribute('draggable', 'true'); r.dataset.key = s.key;
      var opts = self.types.map(function (t) {
        return '<option ' + (t.label === s.type ? 'selected' : '') + '>' + esc(t.label) + '</option>';
      }).join('');
      var rail = document.createElement('div'); rail.className = 'ppg-rail';
      rail.innerHTML = '<span class="ppg-handle" title="Drag to reorder \u2014 affects all editions">\u2807</span>' +
        '<span class="ppg-pos">' + fmt(s.pos) + '</span>' +
        '<select class="ppg-type' + (self.dirtyOps.retypes[s.key] ? ' ppg-changed-field' : '') + '" data-key="' + s.key + '">' + opts + '</select>';
      r.appendChild(rail);
      self.editions.forEach(function (e) {
        var cell = document.createElement('div'); cell.className = 'ppg-cell';
        var b = self.cellOf(e, s.key);
        cell.innerHTML = self.tileHTML(s, b, e.id);
        cell.querySelector('.ppg-tile').addEventListener('click', function () { self.cycleCell(e.id, s.key); });
        r.appendChild(cell);
      });
      var sp = document.createElement('div'); sp.className = 'ppg-addcol ppg-spacer'; r.appendChild(sp);
      self.el.grid.appendChild(r);
    });

    this.bindDrag();
    this.bindRetype();
    this.updateBar();
  };

  Grid.prototype.tileHTML = function (slot, b, edId) {
    if (!b) return '<div class="ppg-tile ppg-empty">+ assign</div>';
    var sp = b.sponsored ? ' ppg-sponsored' : '';
    var changed = this.cellChanged(edId, slot.key) ? ' ppg-changed-field' : '';
    if (slot.type.indexOf('Banner') > -1) {
      var size = b.bannerSize || '235';
      return '<div class="ppg-tile ppg-banner' + sp + changed + '">' +
        '<div class="ppg-banner-img" style="aspect-ratio:700/' + size + '">' + esc(b.company || 'Banner') +
        '<span class="ppg-bsize">700\u00d7' + size + '</span></div>' +
        '<div class="ppg-info"><div class="ppg-nm">' + esc(b.company || b.asset || '') + '</div></div></div>';
    }
    var ico = slot.type.indexOf('Event') > -1 ? '\ud83d\udcc5' : slot.type.indexOf('Greeting') > -1 ? '\ud83d\udc4b' : '\ud83d\uddde';
    return '<div class="ppg-tile' + sp + changed + '">' + (b.sponsored ? '<span class="ppg-crown">\u265b</span>' : '') +
      '<div class="ppg-thumb">' + ico + '</div>' +
      '<div class="ppg-info"><div class="ppg-nm">' + esc(b.asset || '(unassigned)') + '</div>' +
      (b.company ? '<div class="ppg-co">' + esc(b.company) + '</div>' : '') + '</div></div>';
  };

  Grid.prototype.cellChanged = function (edId, slotKey) {
    return this.dirtyOps.cells.some(function (c) { return c.edId === edId && c.slotKey === slotKey; });
  };

  // ---- interactions ----
  Grid.prototype.bindRetype = function () {
    var self = this;
    Array.prototype.forEach.call(this.el.grid.querySelectorAll('.ppg-type'), function (sel) {
      sel.addEventListener('change', function () {
        var key = sel.getAttribute('data-key');
        var slot = self.slots.filter(function (s) { return s.key === key; })[0];
        slot.type = sel.value;
        self.editions.forEach(function (e) { if (e.cells[key]) e.cells[key].type = sel.value; });
        self.dirtyOps.retypes[key] = sel.value;     // fans to all editions on save
        self.render();
      });
    });
  };

  Grid.prototype.cycleCell = function (edId, slotKey) {
    var e = this.editions.filter(function (x) { return x.id === edId; })[0];
    var b = e.cells[slotKey];
    if (!b) {                                        // empty -> placeholder assign
      var slot = this.slots.filter(function (s) { return s.key === slotKey; })[0];
      b = { id: null, slotKey: slotKey, pos: slot.pos, type: slot.type, asset: 'Selected asset', assetId: null, company: '\u2014', sponsored: false, bannerSize: '235' };
      e.cells[slotKey] = b; e.blocks.push(b);
    } else if (!b.sponsored) { b.sponsored = true; if (!b.company || b.company === '\u2014') b.company = 'Sponsor Co.'; }
    else { b.asset = null; b.company = ''; b.sponsored = false; }   // clear
    this.markCell(edId, slotKey);
    this.render();
  };

  Grid.prototype.markCell = function (edId, slotKey) {
    if (!this.cellChanged(edId, slotKey)) this.dirtyOps.cells.push({ edId: edId, slotKey: slotKey });
  };

  Grid.prototype.addBlock = function () {
    this.newSlot++;
    var key = 'newslot_' + this.newSlot;
    var maxPos = this.slots.reduce(function (m, s) { return Math.max(m, s.pos); }, 0);
    var type = (this.types[1] && this.types[1].label) || (this.types[0] && this.types[0].label) || 'Feature Article (FA)';
    this.slots.push({ key: key, pos: maxPos + 1.0, type: type });
    var self = this;
    this.editions.forEach(function (e) {
      var b = { id: null, slotKey: key, pos: maxPos + 1.0, type: type, asset: null, assetId: null, company: '', sponsored: false, bannerSize: '235' };
      e.cells[key] = b; e.blocks.push(b);
    });
    this.dirtyOps.newSlots[key] = true;              // creates a row in every edition on save
    this.slots.sort(function (a, b) { return a.pos - b.pos; });
    this.render();
  };

  Grid.prototype.addEdition = function () {
    this.newEd++;
    var id = 'newed_' + this.newEd;
    var fromId = this.editions[0] && this.editions[0].id;
    var ed = { id: id, name: 'Edition ' + (this.editions.length + 1), sub: '\u2014', blocks: [], cells: {} };
    var self = this;
    this.slots.forEach(function (s) {            // clone skeleton (empty cells)
      var b = { id: null, slotKey: s.key, pos: s.pos, type: s.type, asset: null, assetId: null, company: '', sponsored: false, bannerSize: '235' };
      ed.cells[s.key] = b; ed.blocks.push(b);
    });
    this.editions.push(ed);
    this.dirtyOps.cloneEditions.push({ tmpId: id, name: ed.name, fromEditionId: fromId });
    this.render();
  };

  Grid.prototype.bindDrag = function () {
    var self = this, rows = this.el.grid.querySelectorAll('.ppg-row[draggable]');
    Array.prototype.forEach.call(rows, function (r) {
      r.addEventListener('dragstart', function () { self.dragKey = r.dataset.key; r.classList.add('ppg-dragging'); });
      r.addEventListener('dragend', function () {
        self.dragKey = null;
        Array.prototype.forEach.call(rows, function (x) { x.classList.remove('ppg-dragging', 'ppg-drop'); });
      });
      r.addEventListener('dragover', function (e) {
        e.preventDefault();
        Array.prototype.forEach.call(rows, function (x) { x.classList.remove('ppg-drop'); });
        if (r.dataset.key !== self.dragKey) r.classList.add('ppg-drop');
      });
      r.addEventListener('drop', function (e) {
        e.preventDefault();
        var over = r.dataset.key; if (!self.dragKey || over === self.dragKey) return;
        var ordered = self.slots.slice();
        var moved = self.slots.filter(function (s) { return s.key === self.dragKey; })[0];
        var rect = r.getBoundingClientRect(); var above = e.clientY < rect.top + rect.height / 2;
        var seq = ordered.filter(function (s) { return s.key !== self.dragKey; });
        var at = seq.findIndex(function (s) { return s.key === over; }); if (!above) at++;
        var before = seq[at - 1], after = seq[at], np;
        if (!before) np = after.pos - 1; else if (!after) np = before.pos + 1; else np = (before.pos + after.pos) / 2;
        np = Math.round(np * 1000) / 1000;
        moved.pos = np;
        self.editions.forEach(function (ed) { if (ed.cells[moved.key]) ed.cells[moved.key].pos = np; });
        self.dirtyOps.reorders[moved.key] = np;      // one position, fanned to every edition's row
        self.slots.sort(function (a, b) { return a.pos - b.pos; });
        self.render();
      });
    });
  };

  Grid.prototype.updateBar = function () {
    var d = this.dirtyOps;
    var fanWrites = (Object.keys(d.reorders).length + Object.keys(d.retypes).length + Object.keys(d.newSlots).length) * this.editions.length;
    var n = fanWrites + d.cells.length;
    if (!this.anyDirty()) {
      this.el.status.textContent = 'No changes';
      this.el.save.disabled = true; this.el.discard.disabled = true; this.el.save.textContent = 'Save issue';
    } else {
      var ed = d.cloneEditions.length ? ' + ' + d.cloneEditions.length + ' new edition' + (d.cloneEditions.length > 1 ? 's' : '') : '';
      this.el.status.innerHTML = '<b>' + n + '</b> row write' + (n !== 1 ? 's' : '') + ' across ' + this.editions.length + ' editions' + ed;
      this.el.save.disabled = false; this.el.discard.disabled = false; this.el.save.textContent = 'Save issue';
    }
  };

  // ---- payload + save ----
  Grid.prototype.buildPayload = function () {
    var self = this, reorders = [], saves = [], deletes = [], clones = this.dirtyOps.cloneEditions.slice();

    Object.keys(this.dirtyOps.reorders).forEach(function (key) {
      var pos = self.dirtyOps.reorders[key];
      self.editions.forEach(function (e) { var b = e.cells[key]; if (b && b.id) reorders.push({ id: b.id, position: pos }); });
    });
    function pushSave(b, e) {
      saves.push({
        id: b.id || null, newsletterId: e.id, slotKey: b.slotKey,
        blockType: b.type, blockTypeHash: self.hashFor(b.type),
        position: b.pos, planningNote: b.note || '',
        showAsSponsored: !!b.sponsored, assetType: b.assetType || null, assetId: b.assetId || null
      });
    }
    // new slots -> a save (create) per edition
    Object.keys(this.dirtyOps.newSlots).forEach(function (key) {
      self.editions.forEach(function (e) { var b = e.cells[key]; if (b) pushSave(b, e); });
    });
    // retypes -> a save (existing) per edition row
    Object.keys(this.dirtyOps.retypes).forEach(function (key) {
      self.editions.forEach(function (e) { var b = e.cells[key]; if (b && b.id) pushSave(b, e); });
    });
    // per-cell asset/sponsor edits (one edition)
    this.dirtyOps.cells.forEach(function (c) {
      var e = self.editions.filter(function (x) { return x.id === c.edId; })[0];
      var b = e && e.cells[c.slotKey];
      if (b && !self.dirtyOps.newSlots[c.slotKey]) pushSave(b, e);  // new-slot cells already covered
    });
    return { reorders: reorders, saves: saves, deletes: deletes, cloneEditions: clones };
  };

  Grid.prototype.save = function () {
    var self = this, p = this.buildPayload(), url = ppWebhookUrl();
    var btn = this.el.save, label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Saving\u2026';

    if (STUB_WRITES) {
      this.el.payload.style.display = 'block';
      this.el.payload.innerHTML =
        '<div class="ppg-payload-head">STUBBED \u2014 would POST to ' + url + ' (blueprint needs multi-edition revision)</div>' +
        '<span class="ppg-pk">op:reorder</span> ' + JSON.stringify(p.reorders, null, 1) + '\n\n' +
        '<span class="ppg-pk">op:save</span> ' + JSON.stringify(p.saves, null, 1) + '\n\n' +
        '<span class="ppg-pk">op:cloneEdition</span> ' + JSON.stringify(p.cloneEditions, null, 1);
      console.info(LOG, 'STUB payload:', p);
      btn.textContent = 'Logged \u2713'; this.toast(true, 'Stubbed (logged payload)');
      setTimeout(function () { self.buildModel(); self.snapshot(); self.render(); }, 800);
      return;
    }

    var posts = [];
    if (p.cloneEditions.length) p.cloneEditions.forEach(function (c) { posts.push(self.post(url, 'cloneEdition', null, c)); });
    if (p.reorders.length) posts.push(self.post(url, 'reorder', p.reorders));
    if (p.saves.length) posts.push(self.post(url, 'save', p.saves));
    if (p.deletes.length) posts.push(self.post(url, 'delete', p.deletes));
    if (!posts.length) { btn.disabled = false; btn.textContent = label; return; }
    Promise.all(posts).then(function () {
      btn.textContent = 'Saved \u2713'; self.toast(true, 'Saved \u2014 refreshing\u2026');
      setTimeout(function () { window.location.reload(); }, 900);
    }).catch(function (err) {
      console.error(LOG, 'save failed:', err); btn.textContent = 'Save failed';
      self.toast(false, 'Save failed \u2014 see console');
      setTimeout(function () { btn.disabled = false; btn.textContent = label; }, 1400);
    });
  };

  Grid.prototype.post = function (url, op, items, extra) {
    var body = { op: op, titleAdminId: this.titleAdminId, pubplanId: this.pubplanId };
    if (items) body.items = items;
    if (extra) Object.keys(extra).forEach(function (k) { body[k] = extra[k]; });
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r; });
  };

  Grid.prototype.discard = function () {
    this.editions = this.demo ? demoEditions() : readEditions(this.root);
    this.el.payload.style.display = 'none';
    this.buildModel(); this.snapshot(); this.render();
  };

  Grid.prototype.toast = function (ok, msg) {
    var t = document.createElement('div'); t.className = 'ppg-toast ' + (ok ? 'ppg-toast-ok' : 'ppg-toast-err');
    t.textContent = msg; document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('ppg-show'); });
    setTimeout(function () { t.classList.remove('ppg-show'); setTimeout(function () { t.remove(); }, 250); }, 2200);
  };

  // ---- diagnostic + mount ----
  function diagnose(root) {
    var w = root.querySelector('[data-editions-wrapper]');
    var eds = w ? w.querySelectorAll('[data-edition]').length : 0;
    var rows = w ? w.querySelectorAll('[data-nlb]').length : 0;
    console.group(LOG + ' first-load diagnostic');
    console.info('mount root        :', !!root);
    console.info('uses-legacy       :', root.getAttribute('data-uses-legacy'));
    console.info('editions wrapper  :', w ? 'found' : 'MISSING (will demo)');
    console.info('editions          :', eds);
    console.info('NL-BLOCKS rows    :', rows);
    console.info('block-type roster :', (root.querySelector('[data-blocktype-list]') || document.querySelector('[data-blocktype-list]')) ? 'found' : 'MISSING (FALLBACK_TYPES)');
    console.info('write mode        :', STUB_WRITES ? 'STUBBED (logs payload)' : 'LIVE');
    console.groupEnd();
  }

  function init() {
    selfLoadCSS();
    var root = document.querySelector('[data-pp-grid-root]');
    if (!root) { console.info(LOG, 'no [data-pp-grid-root] on this page — not mounting.'); return; }
    diagnose(root);
    if (root.getAttribute('data-uses-legacy') === 'true') {
      console.info(LOG, 'uses-legacy=true \u2192 legacy picker UI owns this issue; grid stands down.');
      return;
    }
    var g = new Grid(root); g.mount();
    window.InbxPubPlanGrid = { version: VERSION, instance: g,
      reload: function () { g.editions = readEditions(root) || demoEditions(); g.buildModel(); g.snapshot(); g.render(); } };
    console.info(LOG, 'mounted', g.demo ? '(demo data)' : '(live editions)', '\u00b7', g.editions.length, 'editions \u00d7', g.slots.length, 'slots');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
