/* ============================================================
   pubplan-sequencer-v1.0.1.js
   INBXIFY — MNA Workstream C-1: PubPlan block-list sequencer shell

   WHAT THIS IS
     The drag-and-drop block editor that replaces the legacy tile/slot
     grid on the PubPlan template page for newsletters where
     `uses-legacy` is OFF (the default for everything new post-MNA).
     This file is the C-1 shell PLUS the client-side halves of C-2
     (drag + decimal-position recompute) and C-3 (edit affordances:
     type, asset placeholder, sponsor toggle, planning note).

   WRITE PATH (v1.0.1 — LIVE)
     Save POSTs to the PubPlan Block Writer Make scenario — ONE
     op-routed webhook (op = "reorder" | "save" | "delete"). URL comes
     from TA_CONFIG.ppWebhooks.base (or .blockSave/.blockReorder), else
     the PP_WEBHOOK_FALLBACK constant. Each POST body:
       { op, titleAdminId, newsletterId, items: [...] }
     reorder items: { id, position }
     save items:    { id|null, blockType, blockTypeHash, position,
                      planningNote, showAsSponsored, assetType, assetId }
     (id null = create row → blueprint 'new' route; id present = 'existing'.)
     On success: banner toast \u2192 page reload (Webflow renders the
     NL-BLOCKS list at page load, so reload surfaces persisted state — TD-134).
     Set STUB_WRITES=true to return to payload-logging without posting.

   STILL DEFERRED (until the real picker lands)
     Asset-ref writing (asset-article/-ad/-event/-re/-customer + sponsor
     refs). The picker is a placeholder in C-1, so save sends block-type,
     position, planning-note, show-as-sponsored, newsletter, title-admin
     only. assetType/assetId ride along (null) for when the picker is real.

   LOCKED ARCHITECTURE (MNA Workstream Master v1.4)
     - Decimal positions (1.0, 2.0, 2.5, 3.0). A reorder writes ONE
       row per moved block — never a batch renumber. (Δ-1: avoids
       Webflow CMS rate limits.)
     - Gate field is `uses-legacy` (Δ-2 rename, was uses-modular-blocks).
       Sequencer mounts ONLY when uses-legacy is OFF. Legacy newsletters
       keep the existing picker/slot UI untouched.
     - Block-type roster is data-driven (loaded from the NL-BLOCKS
       block-type option list). New client types appear automatically.
     - Editing-state UX (standing rule): dirty fields get the gold
       --ix-changed-border; selections persist across edits; inline
       Revert link per dirty card. Save bar reports N dirty → N writes.

   ┌─ WEBFLOW WIRING CHECKLIST (what to render on the PubPlan page) ─┐
   │ 1. Mount point (add tenant + newsletter IDs for new-row writes): │
   │      <div data-pp-sequencer-root data-uses-legacy="false"        │
   │           data-title-admin-id="{TITLE-ADMIN id}"                 │
   │           data-newsletter-id="{NEWSLETTER id}"></div>            │
   │    Bind data-uses-legacy from PUBLICATION PLAN / NEWSLETTER.    │
   │    (Per platform convention, data-* live on the slot wrapper.)  │
   │ 2. Hidden NL-BLOCKS collection list (Current Newsletter):       │
   │      <div data-nlblocks-wrapper style="display:none">          │
   │        <div data-nlb-id="{ID}"                                  │
   │             data-nlb-position="{position}"                      │
   │             data-nlb-type="{block-type NAME}"                   │
   │             data-nlb-type-hash="{block-type HASH}"              │
   │             data-nlb-asset="{asset label or empty}"            │
   │             data-nlb-asset-id="{asset ID or empty}"            │
   │             data-nlb-note="{planning-note or empty}"           │
   │             data-nlb-sponsored="{true|false}"></div>           │
   │        ... one per NL-BLOCKS row ...                            │
   │      </div>                                                     │
   │    NOTE: Option fields bind ONE value per attribute. We need    │
   │    BOTH name (label) and hash, so two attributes (type +        │
   │    type-hash). Make Router filters match on HASH.               │
   │ 3. Hidden block-type roster (option list, label + hash):       │
   │      <div data-blocktype-list style="display:none">            │
   │        <div data-bt-label="Feature Article (FA)"               │
   │             data-bt-hash="{hash}"></div> ...                    │
   │      </div>                                                     │
   │    If absent, falls back to FALLBACK_TYPES (labels only;        │
   │    hashes blank — logged as a warning).                         │
   │ 4. NEW NL-BLOCKS field to persist notes: `planning-note`        │
   │    (plain text, ~60 char). Additive; not required for the       │
   │    read-only shell. Logged as a schema delta in the roadmap.    │
   └────────────────────────────────────────────────────────────────┘

   LOAD ORDER (Webflow <head>)
     1. webflow.css
     2. title-admin-page-design-v1.4.x.css   (design tokens — :root)
     3. ta-studio-components-v1.0.x.css
     4. ix-buttons-v1.0.4.css
     5. (this JS self-loads pubplan-sequencer-v1.0.0.css)
   The companion CSS references var(--ix-*) tokens; it does NOT
   redefine :root, so it must load after the design CSS. The
   self-loader derives the CSS URL from this script's own src and
   injects it if not already applied (ASF v1.2.2 hardening pattern) —
   a stale/missing <link> can no longer brick the surface.

   NAMESPACE  window.InbxPubPlanSequencer  ·  CSS prefix .pps-
   Authored 2026-05-22 · MNA Workstream C, chunk C-1 (early start)
   ============================================================ */

(function () {
  'use strict';

  var VERSION = '1.0.1';
  var STUB_WRITES = false;                // LIVE — posts to the PubPlan Block Writer webhook
  // Hardcoded fallback (overridable by TA_CONFIG.ppWebhooks.base) — same convention as
  // ta-bundles SCENARIO_I_FALLBACK. Platform-level endpoint, not per-tenant.
  var PP_WEBHOOK_FALLBACK = 'https://hook.us1.make.com/dt6lciasnzewg8u5j8yvgl5hjb6gf95e';
  var NOTE_MAX = 60;
  var LOG = '[pp-sequencer v' + VERSION + ']';

  var FALLBACK_TYPES = [
    'Feature Article (FA)', 'Top Stories (TS)', 'Banner Ad (BA)', 'Splash Block (SB)',
    'Text Article (TXA)', 'RE Listing (RE)', 'Event (EV)', 'Business List (BL)',
    'Greeting (GR)', 'Divider', 'Spacer'
  ];

  // ---- self-load companion CSS (ASF v1.2.2 hardening pattern) ----
  function selfLoadCSS() {
    try {
      var me = document.currentScript ||
        (function () { var s = document.getElementsByTagName('script'); return s[s.length - 1]; })();
      if (!me || !me.src) return;
      var cssUrl = me.src.replace(/\.js(\?.*)?$/, '.css$1');
      var already = Array.prototype.some.call(document.styleSheets, function (ss) {
        return ss.href && ss.href.indexOf('pubplan-sequencer-v' + VERSION) !== -1;
      });
      if (already) return;
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      document.head.appendChild(link);
      console.info(LOG, 'self-loaded CSS:', cssUrl);
    } catch (e) { console.warn(LOG, 'CSS self-load skipped:', e); }
  }

  // ---- config: ONE op-routed webhook (the imported blueprint); all ops POST here ----
  function ppWebhookUrl() {
    var c = (window.TA_CONFIG && window.TA_CONFIG.ppWebhooks) || {};
    return c.base || c.blockSave || c.blockReorder || PP_WEBHOOK_FALLBACK;
  }

  // ---- data adapter: read NL-BLOCKS from the hidden collection list ----
  function readBlocks(root) {
    var wrap = document.querySelector('[data-nlblocks-wrapper]');
    if (!wrap) return null;                 // signal: not wired yet → caller may demo
    var rows = Array.prototype.slice.call(wrap.querySelectorAll('[data-nlb-id]'));
    return rows.map(function (el) {
      var pos = parseFloat(el.getAttribute('data-nlb-position'));
      return {
        id: el.getAttribute('data-nlb-id'),
        pos: isNaN(pos) ? 0 : pos,
        type: el.getAttribute('data-nlb-type') || '',
        typeHash: el.getAttribute('data-nlb-type-hash') || '',
        asset: el.getAttribute('data-nlb-asset') || null,
        assetId: el.getAttribute('data-nlb-asset-id') || null,
        note: el.getAttribute('data-nlb-note') || '',
        sponsor: el.getAttribute('data-nlb-sponsored') === 'true'
      };
    });
  }

  function readTypeRoster() {
    var list = document.querySelector('[data-blocktype-list]');
    if (list) {
      var items = Array.prototype.slice.call(list.querySelectorAll('[data-bt-label]'));
      if (items.length) {
        return items.map(function (el) {
          return { label: el.getAttribute('data-bt-label'), hash: el.getAttribute('data-bt-hash') || '' };
        });
      }
    }
    console.warn(LOG, 'no [data-blocktype-list] found — using FALLBACK_TYPES (hashes blank). ' +
      'Make Router matches on HASH; wire the roster before enabling writes.');
    return FALLBACK_TYPES.map(function (l) { return { label: l, hash: '' }; });
  }

  function demoBlocks() {
    var seed = [
      ['nlb_01', 'Greeting (GR)', 'Welcome — Issue 113', '', 1.0, false],
      ['nlb_02', 'Feature Article (FA)', 'Meet the Ambrose Family', '', 2.0, false],
      ['nlb_03', 'Feature Article (FA)', null, 'Profile on the new river park reopening', 3.0, false],
      ['nlb_04', 'Banner Ad (BA)', 'Valley Dental — 700x200', '', 4.0, true],
      ['nlb_05', 'Top Stories (TS)', '3 stories selected', '', 5.0, false],
      ['nlb_06', 'Event (EV)', null, 'Fall street fair — confirm date w/ chamber', 6.0, false],
      ['nlb_07', 'Splash Block (SB)', 'Riverside Realty — splash', '', 7.0, true]
    ];
    return seed.map(function (s) {
      return { id: s[0], type: s[1], typeHash: '', asset: s[2], assetId: null, note: s[3], pos: s[4], sponsor: s[5] };
    });
  }

  // ---- the sequencer ----
  function Sequencer(root) {
    this.root = root;
    this.titleAdminId = root.getAttribute('data-title-admin-id') || '';
    this.newsletterId = root.getAttribute('data-newsletter-id') || '';
    this.types = readTypeRoster();
    var data = readBlocks(root);
    this.demo = !data;
    this.blocks = (data && data.length) ? data : demoBlocks();
    this.newCount = 0;
    this.dragId = null;
    this.snapshot();
  }

  Sequencer.prototype.snapshot = function () {
    this.blocks.forEach(function (b) {
      b.origPos = b.pos; b.origType = b.type; b.origAsset = b.asset;
      b.origNote = b.note; b.origSponsor = b.sponsor; delete b.isNew;
    });
  };

  Sequencer.prototype.dirty = function (b) {
    return b.pos !== b.origPos || b.type !== b.origType || b.asset !== b.origAsset ||
      b.note !== b.origNote || b.sponsor !== b.origSponsor || !!b.isNew;
  };

  Sequencer.prototype.fmt = function (n) {
    return (n === Math.floor(n)) ? n.toFixed(1) : String(n);
  };

  Sequencer.prototype.esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  Sequencer.prototype.mount = function () {
    var demoBanner = this.demo
      ? '<div class="pps-demo">Demo data — no <code>[data-nlblocks-wrapper]</code> found on the page. ' +
        'Wire the hidden collection list (see file header) to read live NL-BLOCKS.</div>'
      : '';
    this.root.innerHTML =
      demoBanner +
      '<div class="pps-list" data-pps-list></div>' +
      '<button class="pps-add" data-pps-add>+ Add block</button>' +
      '<div class="pps-bar">' +
        '<span class="pps-status" data-pps-status>No changes</span>' +
        '<button class="ix-btn ix-btn--ghost pps-cancel" data-pps-cancel disabled>Discard all</button>' +
        '<button class="ix-btn ix-btn--primary pps-save" data-pps-save disabled>Save</button>' +
      '</div>' +
      '<pre class="pps-payload" data-pps-payload></pre>';
    this.el = {
      list: this.root.querySelector('[data-pps-list]'),
      add: this.root.querySelector('[data-pps-add]'),
      status: this.root.querySelector('[data-pps-status]'),
      cancel: this.root.querySelector('[data-pps-cancel]'),
      save: this.root.querySelector('[data-pps-save]'),
      payload: this.root.querySelector('[data-pps-payload]')
    };
    this.bind();
    this.render();
  };

  Sequencer.prototype.render = function () {
    var self = this;
    var ordered = this.blocks.slice().sort(function (a, b) { return a.pos - b.pos; });
    this.el.list.innerHTML = '';
    ordered.forEach(function (b) {
      var dirty = self.dirty(b);
      var opts = self.types.map(function (t) {
        return '<option ' + (t.label === b.type ? 'selected' : '') + '>' + self.esc(t.label) + '</option>';
      }).join('');
      var posChanged = b.pos !== b.origPos;
      var writeNote = b.isNew ? 'new row' : (posChanged ? 'pos ' + self.fmt(b.origPos) + '\u2192' + self.fmt(b.pos) + ' \u00b7 1 row' : '1 row');
      var used = (b.note || '').length;
      var card = document.createElement('div');
      card.className = 'pps-card' + (dirty ? ' pps-changed' : '');
      card.setAttribute('draggable', 'true');
      card.dataset.id = b.id;
      card.innerHTML =
        '<div class="pps-handle" title="Drag to reorder">\u2807</div>' +
        '<div class="pps-pos">' + self.fmt(b.pos) + '</div>' +
        '<div class="pps-body">' +
          '<div class="pps-row">' +
            '<select class="pps-select' + (b.type !== b.origType ? ' pps-changed-field' : '') + '" data-act="type">' + opts + '</select>' +
            '<div class="pps-asset' + (b.asset ? ' pps-filled' : '') + (b.asset !== b.origAsset ? ' pps-changed-field' : '') + '" data-act="asset">' +
              (b.asset ? self.esc(b.asset) : '<span class="pps-ph">Pick asset\u2026</span>') +
            '</div>' +
            '<div class="pps-sponsor' + (b.sponsor ? ' pps-on' : '') + '" data-act="sponsor" title="Show as sponsored">' +
              '<span class="pps-switch"></span><span class="pps-lbl">Sponsored</span>' +
            '</div>' +
          '</div>' +
          '<div class="pps-note-wrap">' +
            '<span class="pps-note-ico">\uD83D\uDCDD</span>' +
            '<input class="pps-note' + (b.note !== b.origNote ? ' pps-changed-field' : '') + '" data-act="note" maxlength="' + NOTE_MAX + '" ' +
              'value="' + self.esc(b.note) + '" placeholder="Planning note \u2014 placehold a story (no asset needed)\u2026">' +
            '<span class="pps-count' + (used >= NOTE_MAX - 10 ? ' pps-warn' : '') + '">' + used + '/' + NOTE_MAX + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="pps-right">' +
          '<span class="pps-write">' + writeNote + '</span>' +
          '<button class="pps-revert" data-act="revert">Revert</button>' +
          '<span class="pps-kebab" data-act="kebab" title="More">\u22ef</span>' +
        '</div>';
      self.el.list.appendChild(card);
    });
    this.updateBar();
  };

  Sequencer.prototype.updateBar = function () {
    var dirty = this.blocks.filter(this.dirty, this);
    if (!dirty.length) {
      this.el.status.textContent = 'No changes';
      this.el.save.disabled = true; this.el.cancel.disabled = true; this.el.save.textContent = 'Save';
    } else {
      this.el.status.innerHTML = '<b>' + dirty.length + '</b> dirty block' + (dirty.length > 1 ? 's' : '') +
        ' \u2192 <b>' + dirty.length + '</b> row write' + (dirty.length > 1 ? 's' : '');
      this.el.save.disabled = false; this.el.cancel.disabled = false;
      this.el.save.textContent = 'Save ' + dirty.length + ' change' + (dirty.length > 1 ? 's' : '');
    }
  };

  Sequencer.prototype.find = function (id) {
    for (var i = 0; i < this.blocks.length; i++) if (this.blocks[i].id === id) return this.blocks[i];
    return null;
  };

  Sequencer.prototype.bind = function () {
    var self = this, list = this.el.list;

    // live note typing (preserve cursor — no full re-render)
    list.addEventListener('input', function (e) {
      if (e.target.getAttribute('data-act') !== 'note') return;
      var card = e.target.closest('.pps-card'); var b = self.find(card.dataset.id); if (!b) return;
      b.note = e.target.value;
      var used = b.note.length;
      var cnt = card.querySelector('.pps-count');
      cnt.textContent = used + '/' + NOTE_MAX;
      cnt.classList.toggle('pps-warn', used >= NOTE_MAX - 10);
      e.target.classList.toggle('pps-changed-field', b.note !== b.origNote);
      card.classList.toggle('pps-changed', self.dirty(b));
      self.updateBar();
    });

    list.addEventListener('click', function (e) {
      var card = e.target.closest('.pps-card'); if (!card) return;
      var b = self.find(card.dataset.id); if (!b) return;
      var actEl = e.target.closest('[data-act]'); var act = actEl && actEl.getAttribute('data-act');
      if (act === 'sponsor') { b.sponsor = !b.sponsor; self.render(); }
      else if (act === 'asset') { b.asset = b.asset ? b.asset : 'Selected asset \u2713'; self.render(); } // placeholder pick
      else if (act === 'revert') {
        b.pos = b.origPos; b.type = b.origType; b.asset = b.origAsset; b.note = b.origNote; b.sponsor = b.origSponsor;
        if (b.isNew) self.blocks = self.blocks.filter(function (x) { return x.id !== b.id; });
        self.render();
      }
    });

    list.addEventListener('change', function (e) {
      if (e.target.getAttribute('data-act') !== 'type') return;
      var card = e.target.closest('.pps-card'); var b = self.find(card.dataset.id); if (!b) return;
      b.type = e.target.value;
      var t = self.types.filter(function (x) { return x.label === b.type; })[0];
      b.typeHash = (t && t.hash) || '';
      self.render();
    });

    // drag-and-drop — decimal recompute, ONE row per move
    list.addEventListener('dragstart', function (e) {
      var c = e.target.closest('.pps-card'); if (!c) return;
      self.dragId = c.dataset.id; c.classList.add('pps-dragging');
    });
    list.addEventListener('dragend', function () {
      Array.prototype.forEach.call(list.querySelectorAll('.pps-card'), function (c) {
        c.classList.remove('pps-dragging', 'pps-drop');
      });
      self.dragId = null;
    });
    list.addEventListener('dragover', function (e) {
      e.preventDefault();
      var o = e.target.closest('.pps-card');
      Array.prototype.forEach.call(list.querySelectorAll('.pps-card'), function (c) { c.classList.remove('pps-drop'); });
      if (o && o.dataset.id !== self.dragId) o.classList.add('pps-drop');
    });
    list.addEventListener('drop', function (e) {
      e.preventDefault();
      var over = e.target.closest('.pps-card'); if (!over || !self.dragId) return;
      var moved = self.find(self.dragId);
      var ordered = self.blocks.slice().sort(function (a, b) { return a.pos - b.pos; });
      var rect = over.getBoundingClientRect();
      var dropAbove = e.clientY < rect.top + rect.height / 2;
      var seq = ordered.filter(function (b) { return b.id !== self.dragId; });
      var at = seq.findIndex(function (b) { return b.id === over.dataset.id; });
      if (!dropAbove) at += 1;
      var before = seq[at - 1], after = seq[at], newPos;
      if (!before) newPos = after.pos - 1.0;
      else if (!after) newPos = before.pos + 1.0;
      else newPos = (before.pos + after.pos) / 2;
      moved.pos = Math.round(newPos * 1000) / 1000;   // only this row changes
      self.render();
    });

    this.el.add.addEventListener('click', function () {
      self.newCount++;
      var maxPos = self.blocks.reduce(function (m, b) { return Math.max(m, b.pos); }, 0);
      self.blocks.push({
        id: 'nlb_new' + self.newCount, type: (self.types[0] && self.types[0].label) || 'Feature Article (FA)',
        typeHash: (self.types[0] && self.types[0].hash) || '', asset: null, assetId: null, note: '',
        pos: maxPos + 1.0, sponsor: false, isNew: true,
        origPos: null, origType: null, origAsset: null, origNote: null, origSponsor: null
      });
      self.render();
    });

    this.el.cancel.addEventListener('click', function () {
      self.blocks = self.blocks.filter(function (b) { return !b.isNew; });
      self.blocks.forEach(function (b) {
        b.pos = b.origPos; b.type = b.origType; b.asset = b.origAsset; b.note = b.origNote; b.sponsor = b.origSponsor;
      });
      self.el.payload.style.display = 'none';
      self.render();
    });

    this.el.save.addEventListener('click', function () { self.save(); });
  };

  Sequencer.prototype.fieldChanged = function (b) {
    return b.isNew || b.type !== b.origType || b.asset !== b.origAsset ||
      b.note !== b.origNote || b.sponsor !== b.origSponsor;
  };

  Sequencer.prototype.buildPayload = function () {
    var self = this;
    var dirty = this.blocks.filter(this.dirty, this);
    // Pure position moves → reorder op. Anything with a field change → save op
    // (the save body carries position too, so no row ever appears in BOTH batches —
    // avoids two executions racing on the same NL-BLOCKS row).
    var reorders = dirty.filter(function (b) {
      return !b.isNew && b.pos !== b.origPos && !self.fieldChanged(b);
    }).map(function (b) { return { id: b.id, position: b.pos }; });
    var saves = dirty.filter(function (b) { return self.fieldChanged(b); }).map(function (b) {
      return {
        id: b.isNew ? null : b.id,            // null → blueprint 'new' route (notexist); id → 'existing' (exist)
        blockType: b.type,                     // matches {{20.blockType}}
        blockTypeHash: b.typeHash || '',       // matches {{20.blockTypeHash}}
        assetType: b.assetType || null,        // asset-ref write deferred to the real picker
        assetId: b.assetId || null,
        planningNote: b.note || '',
        position: b.pos,
        showAsSponsored: !!b.sponsor
      };
    });
    return { reorders: reorders, saves: saves };
  };

  Sequencer.prototype.save = function () {
    var self = this;
    var p = this.buildPayload();
    var url = ppWebhookUrl();

    // immediate click feedback (dead-air clicks banned site-wide)
    var btn = this.el.save, label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Saving\u2026';

    if (STUB_WRITES) {
      this.el.payload.style.display = 'block';
      this.el.payload.innerHTML =
        '<div class="pps-payload-head">STUBBED \u2014 would POST to ' + url + '</div>' +
        '<span class="pps-k">op:reorder</span> ' + JSON.stringify(p.reorders, null, 2) + '\n\n' +
        '<span class="pps-k">op:save</span> ' + JSON.stringify(p.saves, null, 2);
      console.info(LOG, 'STUB payload:', p);
      btn.textContent = 'Logged \u2713'; self.toast(true, 'Stubbed (logged)');
      setTimeout(function () { self.snapshot(); self.render(); }, 700);
      return;
    }

    // LIVE — one op-routed webhook. reorder + save are separate ops (separate executions).
    var posts = [];
    if (p.reorders.length) posts.push(self.post(url, 'reorder', p.reorders));
    if (p.saves.length) posts.push(self.post(url, 'save', p.saves));
    if (!posts.length) { btn.disabled = false; btn.textContent = label; return; }

    Promise.all(posts)
      .then(function () {
        btn.textContent = 'Saved \u2713';
        self.toast(true, 'Saved \u2014 refreshing\u2026');
        // Webflow renders the NL-BLOCKS list at page load, so reload to surface persisted
        // state (created rows, new positions). Banner \u2192 reload (TD-134).
        setTimeout(function () { window.location.reload(); }, 900);
      })
      .catch(function (err) {
        console.error(LOG, 'save failed:', err);
        btn.textContent = 'Save failed'; self.toast(false, 'Save failed \u2014 see console');
        setTimeout(function () { btn.disabled = false; btn.textContent = label; }, 1400);
      });
  };

  Sequencer.prototype.post = function (url, op, items) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        op: op,
        titleAdminId: this.titleAdminId,
        newsletterId: this.newsletterId,
        items: items
      })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r; });
  };

  Sequencer.prototype.toast = function (ok, msg) {
    var t = document.createElement('div');
    t.className = 'pps-toast ' + (ok ? 'pps-toast-ok' : 'pps-toast-err');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('pps-toast-show'); });
    setTimeout(function () { t.classList.remove('pps-toast-show'); setTimeout(function () { t.remove(); }, 250); }, 2200);
  };

  // ---- first-load diagnostic (issues-tab lesson: surface DOM-contract drift) ----
  function diagnose(root) {
    var wrap = document.querySelector('[data-nlblocks-wrapper]');
    var rows = wrap ? wrap.querySelectorAll('[data-nlb-id]').length : 0;
    var roster = document.querySelector('[data-blocktype-list]');
    console.group(LOG + ' first-load diagnostic');
    console.info('mount root          :', !!root);
    console.info('uses-legacy attr    :', root ? root.getAttribute('data-uses-legacy') : '(no root)');
    console.info('NL-BLOCKS wrapper    :', wrap ? 'found' : 'MISSING (will demo)');
    console.info('NL-BLOCKS rows       :', rows);
    console.info('block-type roster    :', roster ? 'found' : 'MISSING (FALLBACK_TYPES, hashes blank)');
    console.info('write mode           :', STUB_WRITES ? 'STUBBED (logs payload)' : 'LIVE');
    console.groupEnd();
  }

  // ---- mount ----
  function init() {
    selfLoadCSS();
    var root = document.querySelector('[data-pp-sequencer-root]');
    if (!root) { console.info(LOG, 'no [data-pp-sequencer-root] on this page — not mounting.'); return; }
    diagnose(root);
    if (root.getAttribute('data-uses-legacy') === 'true') {
      console.info(LOG, 'uses-legacy=true \u2192 legacy picker UI owns this newsletter; sequencer stands down.');
      return;
    }
    var seq = new Sequencer(root);
    seq.mount();
    window.InbxPubPlanSequencer = {
      version: VERSION,
      instance: seq,
      reload: function () { seq.blocks = readBlocks(root) || demoBlocks(); seq.snapshot(); seq.render(); }
    };
    console.info(LOG, 'mounted', seq.demo ? '(demo data)' : '(live NL-BLOCKS)');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
