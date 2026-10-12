/* ipp-layout-v1.0.2.js */
/* ============================================================
   ipp-layout-v1.0.2.js — Layout view for the IPP
   Companion stylesheet: ipp-layout-v1.0.1.css

   v1.0.2 (IPP Build S12, 11 Oct 2026) — ONE SAVE, AND ONLY ON LAYOUT
     Live on WLN-998B (v1.0.1): Layout's tray showed its own "Save 2
     changes" and, at the far right, a second, dormant Save. That was the
     Picker's Save. The Picker puts its Save into the first tray it finds
     with the class ipp-savebar; once Layout's tray carried that class,
     the Picker found it and moved in. Also, leaving Layout for Publish
     brought the shared tray back on Publish, where the shell hides it.
     1 · Layout's tray no longer carries the class ipp-savebar. It is
         .ipp-ly-bar, styled by ipp-layout-v1.0.1.css, so no other module
         can find it or write into it.
     2 · While Layout is open every ipp-savebar is hidden. Leaving Layout
         hands each one back as it was: the shell decides for the trays it
         looks after (shown on Picker, hidden on Revenue and Publish).

   v1.0.1 (IPP Build S12, 11 Oct 2026) — THE TRAY IS LAYOUT'S OWN
     Live on WLN-998B: a move turned the block gold, but the bottom tray
     still said "No unsaved changes" and Save stayed off. The page has
     one shared tray outside the views, and it carries the Picker's Save.
     v1.0.0 drew Layout's tray inside the Layout view, under the shared
     one, so the Picker's tray was the one on screen.
     Now Layout keeps its own tray (.ipp-savebar.ipp-ly-bar) in its view
     and, while Layout is open, hides every other tray. Leaving Layout
     shows them again. One save concept per screen, as ruled.
     Nothing else changed.

   v1.0.0 (IPP Build S12, 11 Oct 2026) — FIRST BUILD
     Built from the canvas "PubPlan Layout tab · S12 mockup", proposal B
     (accepted 11 Oct): a compact stack of the issue's blocks, with type
     and design set in a side panel.
     1 · THE STACK. Every block of the plan below the loose rows, top of
         the email first: position, type, what is in it, its design.
         Drag a block by its handle to move it; its content and design
         move with it. The handle also takes Arrow Up / Arrow Down.
         The Greeting stays first. A banner spot never goes above the
         Lead banner (the first ad block), and the Lead does not move.
     2 · THE PANEL. Click a block. Article blocks pick their type from
         /plan-board layout.articleTypes (IX_CONFIG, e.g. FA, TS, LBP).
         Every block picks its design from designChoices[<type>]: only
         the designs made for that type (the title's own first). A type
         change clears the design unless the type has exactly one.
     3 · BEFORE PUBLISH. Lists every block with no type, no design, or a
         design not made for its type. The Layout tab on the rail shows
         fit / total and a salmon dot while anything is open. Publish's
         "Designs fit" tile reads the same facts.
     4 · EDITING STATE. A changed block has the gold border and a small
         Cancel (puts its type, design and place back). The shared tray
         holds "Save N changes" and Cancel all. Nothing is written
         before Save.
     5 · SAVE, through Scenario 124 v2.20 (PP_WEBHOOKS.blockWriter):
           reorder  { id, position }        position read back
           layout   { id, blockTypeJson, endGroup, blockTextJson }
                    block-type read back. end-group and block-text are
                    sent as they are, because 124 rewrites all three.
           fill     { id, assetField: blockFields.design, assetId }
                    design read back.
         Positions: a moved block takes a number between its new
         neighbours (one decimal place, the field's precision), so one
         move is one write. When there is no room, the blocks are
         renumbered 1, 2, 3 ... and only those whose number changes are
         written. Positions stay below loosePositionFrom.
         Then the plan is read fresh (TOAST-TRUTH): a change counts as
         saved only when the fresh read shows it. Anything that did not
         land stays gold with "Not saved: <why>".
     6 · EDITIONS (ruled 11 Oct). Save also applies the change to every
         open edition of the same issue (/plan-board editions, Data
         Worker v1.0.36): the order, types and designs of articles and
         sections. Banner spots belong to each edition and are never
         copied. Blocks are matched by slot-key. A locked edition is
         left alone and named. The other edition's shared blocks take
         the new order among the places they already hold, so its own
         banner spots stay where they are.
     7 · A locked plan shows the stack read-only.
   HARDCODING (provisional ids, for the doc-maintenance chat)
     HC-P-S12-3  'GR' is the Greeting's block label (same as the
                 Picker); the Lead banner is the first block whose asset
                 type is 'ad' (same rule as Revenue).
     HC-P-S12-4  Page copy: panel, tray, Before Publish lines.
     HC-P-S12-5  Edition rule: asset type 'ad' blocks are never copied
                 to other editions; everything else is matched by
                 slot-key.
   Needs on the page: ipp-shell v1.15+, ix-tokens, ix-buttons,
   ix-form-controls v1.1.0, ix-info, ix-success-toast. Data Worker
   ix-issue-data v1.0.36 with IX_CONFIG.layout.articleTypes. Writes:
   Scenario 124 v2.20 (PP_WEBHOOKS.blockWriter).
   ============================================================ */
(function () {
  'use strict';
  var VERSION = '1.0.2', FILE = 'ipp-layout-v1.0.2.js';
  var GR = 'GR';                       // HC-P-S12-3
  var AD = 'ad';                       // HC-P-S12-3 / HC-P-S12-5
  var BATCH_URL_CEILING = 7000, BATCH_CHUNK = 20;

  // ── state ─────────────────────────────────────────────────
  var BOARD = null, LOCKED = false, ERR = '';
  var ROWS = {};          // id -> slot (from the board)
  var ORIG = null;        // { order:[ids], type:{id:label}, design:{id:designId}, pos:{id:number} }
  var CUR = null;         // { order:[ids], type:{}, design:{} }
  var SEL = '';           // selected block id
  var FAILS = {};         // id -> why (last save)
  var SAVING = false;
  var NOTE = '';          // line under the stack after a save
  var DRAG = null;
  var TOUCHED = {};        // blocks you moved by hand (tie-break for which block counts as moved)

  // ── small helpers ─────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function plural(n, w) { return n + ' ' + (n === 1 ? w[0] : w[1]); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function view() { return document.querySelector('.ipp-view[data-view="layout"]'); }
  function canvas() { var v = view(); return v && v.querySelector('.ipp-canvas'); }
  function blockWriter() { return String((window.PP_WEBHOOKS || {}).blockWriter || ''); }
  function toast(msg, kind, detail) {
    if (window.IxToast && typeof IxToast.show === 'function') IxToast.show(msg, kind, detail ? { detail: detail, key: 'ipp-layout' } : { key: 'ipp-layout' });
    else if (window.IPP && IPP.toast) IPP.toast(msg + (detail ? ' ' + detail : ''), kind === 'err');
  }
  function looseFrom() { var n = Number(BOARD && BOARD.loosePositionFrom); return n > 0 ? n : 900; }
  function choices(label) { return (BOARD && BOARD.designChoices && BOARD.designChoices[label]) || []; }
  function articleTypes() { return (BOARD && BOARD.layout && BOARD.layout.articleTypes) || []; }
  function typeHash(label) { return (BOARD && BOARD.writeIds && BOARD.writeIds.blockType && BOARD.writeIds.blockType[label]) || ''; }
  function designField() { return (BOARD && BOARD.blockFields && BOARD.blockFields.design) || ''; }
  function designName(id, slot) {
    if (!id) return '';
    var all = (BOARD && BOARD.designChoices) || {};
    for (var k in all) if (own(all, k)) for (var i = 0; i < all[k].length; i++) if (all[k][i].id === id) return all[k][i].name;
    if (slot && slot.design === id && slot.designInfo && slot.designInfo.name) return slot.designInfo.name;
    return 'a design not offered here';
  }

  // ── what kind of block ────────────────────────────────────
  function isGreeting(s) { return s && s.blockType === GR; }
  function leadId() {
    if (!CUR) return '';
    for (var i = 0; i < CUR.order.length; i++) { var s = ROWS[CUR.order[i]]; if (s && s.assetType === AD) return s.id; }
    return '';
  }
  function origLeadId() {
    if (!ORIG) return '';
    for (var i = 0; i < ORIG.order.length; i++) { var s = ROWS[ORIG.order[i]]; if (s && s.assetType === AD) return s.id; }
    return '';
  }
  function pinned(id) { var s = ROWS[id]; return !s || isGreeting(s) || id === origLeadId(); }
  function isArticle(s) { return s && s.assetType === 'article'; }
  function rowTitle(s) {
    if (isGreeting(s)) return 'Greeting';
    if (s.assetType === AD) return s.id === origLeadId() ? 'Lead banner' : 'Banner spot';
    if (s.asset && s.asset.name) return s.asset.name;
    if (s.list || s.listCount != null) return (s.section && s.section.name) || s.blockType || 'List';
    return (s.section && s.section.name) ? s.section.name + ' (empty)' : 'Empty block';
  }
  function rowSub(s) {
    if (isGreeting(s)) return (s.greeting && s.greeting.title) ? s.greeting.title : 'Written on the Picker';
    if (s.assetType === AD) return (s.asset && s.asset.name) ? s.asset.name : 'No ad yet';
    if (s.listCount != null) return plural(s.listCount, ['item', 'items']);
    if (isArticle(s)) return CUR.type[s.id] ? 'Article' : 'Article \u00b7 no type yet';
    return '';
  }

  // ── fit checks ────────────────────────────────────────────
  function fitOf(id) {
    var t = CUR.type[id], d = CUR.design[id];
    if (!t) return { ok: false, why: 'no-type' };
    if (!d) return { ok: false, why: 'no-design' };
    var list = choices(t);
    for (var i = 0; i < list.length; i++) if (list[i].id === d) return { ok: true };
    return { ok: false, why: 'mismatch' };
  }
  function problems() {
    var out = [];
    CUR.order.forEach(function (id, i) {
      var s = ROWS[id], f = fitOf(id), t = CUR.type[id];
      if (f.ok) return;
      var line = f.why === 'no-type' ? (isArticle(s) ? 'article has no type yet. Pick one.' : 'block has no type.')
               : f.why === 'no-design' ? (choices(t).length ? 'pick a ' + t + ' design.' : 'no design is made for ' + t + ' blocks for this title.')
               : '\u201c' + designName(CUR.design[id], s) + '\u201d is not made for ' + t + '.';
      out.push({ id: id, pos: i + 1, text: line });
    });
    return out;
  }

  // ── changes ───────────────────────────────────────────────
  // A block counts as moved when it left the longest run of blocks still in
  // their old order: drag one block and only that block is gold, not its
  // neighbours. The same set decides which positions Save writes.
  var KEEP = { key: '', set: {} };
  function keepSet() {
    var k = CUR.order.join() + '|' + ORIG.order.join() + '|' + Object.keys(TOUCHED).join();
    if (KEEP.key !== k) KEEP = { key: k, set: lisKeep(CUR.order, ORIG.pos, TOUCHED) };
    return KEEP.set;
  }
  function moved(id) { return orderChanged() && !keepSet()[id]; }
  function typeChanged(id) { return (CUR.type[id] || '') !== (ORIG.type[id] || ''); }
  function designChanged(id) { return (CUR.design[id] || '') !== (ORIG.design[id] || ''); }
  function changed(id) { return typeChanged(id) || designChanged(id) || moved(id); }
  function changedIds() { return CUR ? CUR.order.filter(changed) : []; }
  function orderChanged() { return CUR && ORIG && CUR.order.join() !== ORIG.order.join(); }

  // ── from the board ────────────────────────────────────────
  function snapshot(b) {
    var slots = ((b && b.slots) || []).slice().sort(function (x, y) { return (Number(x.position) || 0) - (Number(y.position) || 0); });
    var o = { order: [], type: {}, design: {}, pos: {} };
    ROWS = {};
    slots.forEach(function (s) {
      ROWS[s.id] = s; o.order.push(s.id);
      o.type[s.id] = s.blockType || ''; o.design[s.id] = s.design || ''; o.pos[s.id] = Number(s.position) || 0;
    });
    return o;
  }
  function onBoard(e) {
    var d = (e && e.detail) || {};
    if (!d.ok) { ERR = d.error || 'The plan could not be read.'; paint(); return; }
    ERR = '';
    var keep = CUR && changedIds().length && !SAVING;
    var pendCur = keep ? JSON.parse(JSON.stringify(CUR)) : null;
    BOARD = d.data; LOCKED = !!(BOARD && BOARD.plan && BOARD.plan.locked);
    ORIG = snapshot(BOARD);
    if (pendCur && !LOCKED) {
      // keep edits waiting for Save across a refresh another tab caused
      var ids = pendCur.order.filter(function (id) { return own(ROWS, id); });
      ORIG.order.forEach(function (id, i) { if (ids.indexOf(id) < 0) ids.splice(Math.min(i, ids.length), 0, id); });
      CUR = { order: ids, type: {}, design: {} };
      ids.forEach(function (id) {
        CUR.type[id] = own(pendCur.type, id) ? pendCur.type[id] : ORIG.type[id];
        CUR.design[id] = own(pendCur.design, id) ? pendCur.design[id] : ORIG.design[id];
      });
    } else {
      CUR = { order: ORIG.order.slice(), type: Object.assign({}, ORIG.type), design: Object.assign({}, ORIG.design) };
    }
    if (SEL && !own(ROWS, SEL)) SEL = '';
    paint();
  }

  // ── edits ─────────────────────────────────────────────────
  function canMoveTo(id, to) {
    if (pinned(id)) return false;
    var o = CUR.order.filter(function (x) { return x !== id; });
    if (to < 0 || to > o.length) return false;
    // nothing above the Greeting
    var lastGr = -1; o.forEach(function (x, i) { if (isGreeting(ROWS[x])) lastGr = i; });
    if (to <= lastGr) return false;
    // a banner spot never above the Lead
    var s = ROWS[id], lead = origLeadId();
    if (s.assetType === AD && lead && to <= o.indexOf(lead)) return false;
    return true;
  }
  function moveTo(id, to) {
    if (LOCKED || SAVING || !canMoveTo(id, to)) return false;
    var o = CUR.order.filter(function (x) { return x !== id; });
    o.splice(to, 0, id); CUR.order = o; TOUCHED[id] = 1; delete FAILS[id]; NOTE = '';
    paint(); return true;
  }
  function setType(id, label) {
    if (LOCKED || SAVING) return;
    CUR.type[id] = label;
    if (label === ORIG.type[id]) CUR.design[id] = ORIG.design[id];
    else { var c = choices(label); CUR.design[id] = c.length === 1 ? c[0].id : ''; }
    delete FAILS[id]; NOTE = ''; paint();
  }
  function setDesign(id, did) { if (LOCKED || SAVING) return; CUR.design[id] = did; delete FAILS[id]; NOTE = ''; paint(); }
  function cancelRow(id) {
    var o = CUR.order.filter(function (x) { return x !== id; });
    o.splice(Math.min(ORIG.order.indexOf(id), o.length), 0, id);
    CUR.order = o; CUR.type[id] = ORIG.type[id]; CUR.design[id] = ORIG.design[id]; delete FAILS[id]; delete TOUCHED[id];
    paint();
  }
  function cancelAll() {
    if (SAVING) return;
    CUR = { order: ORIG.order.slice(), type: Object.assign({}, ORIG.type), design: Object.assign({}, ORIG.design) };
    FAILS = {}; TOUCHED = {}; NOTE = ''; paint();
  }

  // ── positions: fewest writes, one decimal place ───────────
  function lisKeep(order, pos, touched) {
    // longest strictly increasing run of original positions, kept as they
    // are. On a tie, the blocks you did not move are the ones kept, so the
    // block you dragged is the one that turns gold and gets written.
    var n = order.length, len = [], prev = [], w = function (id) { return 1 + (touched && touched[id] ? 0 : 0.001); };
    for (var i = 0; i < n; i++) {
      len[i] = w(order[i]); prev[i] = -1;
      for (var j = 0; j < i; j++) if (pos[order[j]] < pos[order[i]] && len[j] + w(order[i]) > len[i]) { len[i] = len[j] + w(order[i]); prev[i] = j; }
    }
    var best = -1; for (var k = 0; k < n; k++) if (best < 0 || len[k] > len[best]) best = k;
    var keep = {}; for (var x = best; x >= 0; x = prev[x]) keep[order[x]] = 1;
    return keep;
  }
  function newPositions(order, pos, ceiling, touched) {
    var keep = lisKeep(order, pos, touched), out = {}, ok = true, i = 0;
    while (i < order.length) {
      if (keep[order[i]]) { out[order[i]] = pos[order[i]]; i++; continue; }
      var j = i; while (j < order.length && !keep[order[j]]) j++;
      var lo = i > 0 ? out[order[i - 1]] : 0, hi = j < order.length ? pos[order[j]] : null, k = j - i;
      for (var m = 1; m <= k; m++) {
        var v = hi == null ? r1(Math.floor(lo) + m) : r1(lo + (hi - lo) * m / (k + 1));
        out[order[i + m - 1]] = v;
      }
      for (var c = i; c < j; c++) {
        var prevV = c > 0 ? out[order[c - 1]] : 0, nextV = c + 1 < order.length ? (c + 1 < j ? out[order[c + 1]] : (hi == null ? ceiling : hi)) : ceiling;
        if (!(out[order[c]] > prevV) || !(out[order[c]] < nextV) || out[order[c]] >= ceiling) ok = false;
      }
      i = j;
    }
    if (!ok) { out = {}; order.forEach(function (id, n) { out[id] = n + 1; }); }
    return out;
  }

  // ── editions ──────────────────────────────────────────────
  function editions() { return (BOARD && BOARD.editions) || []; }
  function sharedRow(r) { return r && r.assetType !== AD && !!r.slotKey; }
  function editionPlan() {
    // what Save does to the other editions of this issue
    var out = { ops: { reorder: [], layout: [], fill: [] }, open: [], locked: [], missing: [] };
    var mine = CUR.order.map(function (id) { return ROWS[id]; }).filter(sharedRow);
    var mineOrig = ORIG.order.map(function (id) { return ROWS[id]; }).filter(sharedRow);
    var relOrderChanged = mine.map(function (s) { return s.id; }).join() !== mineOrig.map(function (s) { return s.id; }).join();
    editions().forEach(function (ed) {
      if (ed.locked) { out.locked.push(ed.name); return; }
      var byKey = {}, dup = {};
      (ed.rows || []).forEach(function (r) { if (!sharedRow(r)) return; if (byKey[r.slotKey]) dup[r.slotKey] = 1; byKey[r.slotKey] = r; });
      var pairs = [];
      mine.forEach(function (s) { if (byKey[s.slotKey] && !dup[s.slotKey]) pairs.push([s, byKey[s.slotKey]]); });
      var touched = false;
      if (relOrderChanged && pairs.length) {
        var places = pairs.map(function (p) { return p[1].position; }).sort(function (a, b) { return a - b; });
        pairs.forEach(function (p, i) {
          if (p[1].position !== places[i]) { out.ops.reorder.push({ op: { id: p[1].id, position: places[i] }, ed: ed.name, of: p[0].id }); touched = true; }
        });
      }
      pairs.forEach(function (p) {
        var s = p[0], r = p[1];
        if (typeChanged(s.id) && (CUR.type[s.id] || '') !== (r.blockType || '')) {
          out.ops.layout.push({ op: { id: r.id, blockTypeJson: JSON.stringify(typeHash(CUR.type[s.id])), endGroup: !!r.endGroup, blockTextJson: JSON.stringify(r.blockText || '') }, ed: ed.name, of: s.id, want: typeHash(CUR.type[s.id]) });
          touched = true;
        }
        if ((typeChanged(s.id) || designChanged(s.id)) && CUR.design[s.id] && CUR.design[s.id] !== (r.design || '')) {
          out.ops.fill.push({ op: { id: r.id, assetField: designField(), assetId: CUR.design[s.id] }, ed: ed.name, of: s.id, want: CUR.design[s.id] });
          touched = true;
        }
      });
      var changedShared = changedIds().filter(function (id) { return sharedRow(ROWS[id]); });
      changedShared.forEach(function (id) { if (!byKey[ROWS[id].slotKey]) out.missing.push(ed.name + ': ' + rowTitle(ROWS[id])); });
      if (touched || changedShared.length) out.open.push(ed.name);
    });
    return out;
  }

  // ── Scenario 124 batch contract (same as the Picker) ──────
  function batchUrl(url, op, batchId, ops) {
    return url + (url.indexOf('?') < 0 ? '?' : '&') + 'op=' + encodeURIComponent(op) +
      '&batchId=' + encodeURIComponent(batchId) + '&batch=' + encodeURIComponent(JSON.stringify({ ops: ops }));
  }
  function sendBatch(url, op, ops) {
    var batchId = 'ipl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    var chunks = [];
    if (batchUrl(url, op, batchId, ops).length <= BATCH_URL_CEILING) chunks = [ops];
    else for (var i = 0; i < ops.length; i += BATCH_CHUNK) chunks.push(ops.slice(i, i + BATCH_CHUNK));
    var results = [], base = 0;
    return chunks.reduce(function (chain, chunk, ci) {
      return chain.then(function () {
        return fetch(batchUrl(url, op, batchId + (ci ? '-' + ci : ''), chunk), { method: 'GET', credentials: 'omit' })
          .then(function (r) {
            return r.text().then(function (t) {
              if (!r.ok) throw new Error('Scenario 124 answered HTTP ' + r.status + ' to ' + op + '.');
              var body; try { body = JSON.parse(t); } catch (e) { throw new Error('Scenario 124 sent a reply that is not JSON (' + op + ').'); }
              ((body && body.results) || []).forEach(function (row) { row.__idx = base + (Number(row.i) - 1); results.push(row); });
              base += chunk.length;
            });
          });
      });
    }, Promise.resolve()).then(function () { return results; });
  }
  function resultFor(results, i) { for (var n = 0; n < results.length; n++) if (results[n].__idx === i) return results[n]; return null; }
  function stage(op, items, check) {
    if (!items.length) return Promise.resolve([]);
    return sendBatch(blockWriter(), op, items.map(function (it) { return it.op; })).then(function (results) {
      return items.map(function (it, i) {
        var res = resultFor(results, i), why = '';
        if (!res) why = 'no result came back';
        else if (res.ok !== true || !res.id) why = res.err || 'Webflow refused the write';
        else why = check(it, res.fieldData || {});
        return { item: it, why: why };
      });
    }, function (e) {
      var why = (e && e.message) || 'the request failed';
      return items.map(function (it) { return { item: it, why: why }; });
    });
  }

  // ── save ──────────────────────────────────────────────────
  function save() {
    if (SAVING || LOCKED || !CUR) return;
    var ids = changedIds(); if (!ids.length) return;
    if (!blockWriter()) { toast('Can\u2019t save', 'err', 'This page has no PP_WEBHOOKS.blockWriter address (Scenario 124). Nothing was sent.'); return; }
    var need = ids.filter(function (id) { return typeChanged(id) && !CUR.design[id]; });
    if (need.length) {
      need.forEach(function (id) { FAILS[id] = 'pick a design for the new type first'; });
      paint(); toast('Pick a design first', 'err', plural(need.length, ['block has', 'blocks have']) + ' a new type and no design yet. Nothing was sent.'); return;
    }
    if (ids.some(function (id) { return typeChanged(id) && !typeHash(CUR.type[id]); })) { toast('Can\u2019t save', 'err', 'The plan data has no option id for a chosen type (IX_CONFIG.blockTypes). Nothing was sent.'); return; }
    if (ids.some(function (id) { return designChanged(id); }) && !designField()) { toast('Can\u2019t save', 'err', 'The plan data does not name the design field (blockFields.design, Data Worker v1.0.34+). Nothing was sent.'); return; }

    // this plan
    var newPos = orderChanged() ? newPositions(CUR.order, ORIG.pos, looseFrom(), TOUCHED) : {};
    var reorder = [], layout = [], fill = [];
    Object.keys(newPos).forEach(function (id) { if (newPos[id] !== ORIG.pos[id]) reorder.push({ op: { id: id, position: newPos[id] }, of: id }); });
    ids.forEach(function (id) {
      var s = ROWS[id];
      if (typeChanged(id)) layout.push({ op: { id: id, blockTypeJson: JSON.stringify(typeHash(CUR.type[id])), endGroup: !!s.endGroup, blockTextJson: JSON.stringify(s.blockText || '') }, of: id, want: typeHash(CUR.type[id]) });
      if (designChanged(id) || (typeChanged(id) && CUR.design[id] !== ORIG.design[id])) fill.push({ op: { id: id, assetField: designField(), assetId: CUR.design[id] }, of: id, want: CUR.design[id] });
    });
    // the other editions
    var ed = editionPlan();
    reorder = reorder.concat(ed.ops.reorder); layout = layout.concat(ed.ops.layout); fill = fill.concat(ed.ops.fill);

    SAVING = true; FAILS = {}; NOTE = ''; paint();
    var bad = [];
    var note = function (rs) { rs.forEach(function (r) { if (r.why) { bad.push(r); if (!r.item.ed) FAILS[r.item.of] = r.why; } }); };
    stage('reorder', reorder, function (it, fd) { return Number(fd.position) === Number(it.op.position) ? '' : 'did not store the position'; })
      .then(function (rs) { note(rs); return stage('layout', layout, function (it, fd) { return String(fd['block-type'] || '') === String(it.want) ? '' : 'did not store the type'; }); })
      .then(function (rs) { note(rs); return stage('fill', fill, function (it, fd) { return String(fd.asset || '') === String(it.want) ? '' : 'did not store the design'; }); })
      .then(function (rs) {
        note(rs);
        var want = { order: CUR.order.slice(), type: Object.assign({}, CUR.type), design: Object.assign({}, CUR.design) };
        return IPP.board.load({ fresh: true }).then(function () { return want; }, function () { return want; });
      })
      .then(function (want) {
        SAVING = false;
        // TOAST-TRUTH: what the fresh read shows decides
        var lost = [];
        if (CUR && ORIG) {
          want.order.forEach(function (id) {
            if (!own(ROWS, id)) return;
            var t = (want.type[id] || '') === (ORIG.type[id] || ''), d = (want.design[id] || '') === (ORIG.design[id] || '');
            if (!t) { CUR.type[id] = want.type[id]; FAILS[id] = FAILS[id] || 'the fresh read shows the old type'; lost.push(id); }
            if (!d) { CUR.design[id] = want.design[id]; FAILS[id] = FAILS[id] || 'the fresh read shows the old design'; lost.push(id); }
          });
          var readOrder = ORIG.order.join(), wantOrder = want.order.filter(function (id) { return own(ROWS, id); });
          if (wantOrder.join() !== readOrder) {
            ORIG.order.forEach(function (id) { if (wantOrder.indexOf(id) < 0) wantOrder.push(id); });
            CUR.order = wantOrder;
            wantOrder.forEach(function (id) { if (moved(id) && !FAILS[id]) { FAILS[id] = 'the fresh read shows the old order'; lost.push(id); } });
          }
        }
        var edBad = bad.filter(function (r) { return r.item.ed; });
        // a write whose reply looked wrong but whose change the fresh read shows is saved
        Object.keys(FAILS).forEach(function (id) { if (!own(ROWS, id) || !changed(id)) delete FAILS[id]; });
        if (!Object.keys(FAILS).length && !edBad.length) {
          TOUCHED = {};
          var also = ed.open.length ? ' Also applied to ' + ed.open.join(', ') + '.' : '';
          NOTE = 'Saved.' + also + (ed.locked.length ? ' ' + ed.locked.join(', ') + (ed.locked.length === 1 ? ' is' : ' are') + ' locked and was not changed.' : '') +
                 (ed.missing.length ? ' Not in the other edition: ' + ed.missing.join('; ') + '.' : '');
          toast('Layout saved', 'ok', also.trim() || undefined);
        } else {
          NOTE = 'Not everything saved. Gold blocks still wait.' + (edBad.length ? ' ' + plural(edBad.length, ['change', 'changes']) + ' to other editions did not land: ' + edBad.map(function (r) { return r.item.ed + ' (' + r.why + ')'; }).join('; ') + '.' : '');
          toast('Layout not fully saved', 'err', NOTE);
        }
        paint();
      });
  }

  // ── paint ─────────────────────────────────────────────────
  function info() {
    if (!window.IxInfo || typeof IxInfo.badge !== 'function') return '';
    return IxInfo.badge({
      file: FILE, version: VERSION, title: 'Layout \u00b7 order, types and designs',
      blurb: 'The issue top to bottom, the way the email runs. Drag a block by its handle to move it; ' +
             'its content and design move with it. The Greeting stays first and no banner spot goes above the Lead.\n\n' +
             'Click a block to set its type (articles) and its design. Only the designs made for that type are offered.\n\n' +
             'Changes wait with a gold border until you Save. Save also applies the order, types and designs of articles ' +
             'and sections to the other open editions of this issue. Banner spots belong to each edition.',
      scenarios: [{ name: '124 \u00b7 PubPlan Block Writer', note: 'reorder (positions), layout (block type), fill (design)' }],
      companions: 'ipp-layout-v1.0.1.css \u00b7 ix-issue-data v1.0.36 /plan-board editions, layout, designChoices'
    });
  }
  function rowHtml(id, i) {
    var s = ROWS[id], t = CUR.type[id], f = fitOf(id), ch = changed(id), pin = pinned(id) || LOCKED;
    var cls = 'ipp-ly-row' + (ch ? ' ipp-dirty' : '') + (SEL === id ? ' is-sel' : '') + (pin ? ' is-pinned' : '') + (FAILS[id] ? ' is-failed' : '');
    var handle = pin
      ? '<span class="ipp-ly-h ipp-ly-lock" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>'
      : '<button type="button" class="ipp-ly-h" data-ly-handle="' + id + '" aria-label="Move ' + esc(rowTitle(s)) + ' (drag, or Arrow Up and Arrow Down)"><svg width="12" height="16" viewBox="0 0 14 18" fill="currentColor" aria-hidden="true"><circle cx="4" cy="3" r="1.6"/><circle cx="10" cy="3" r="1.6"/><circle cx="4" cy="9" r="1.6"/><circle cx="10" cy="9" r="1.6"/><circle cx="4" cy="15" r="1.6"/><circle cx="10" cy="15" r="1.6"/></svg></button>';
    var design = f.why === 'no-type' ? '' : (CUR.design[id] ? designName(CUR.design[id], s) : 'No design');
    return '<div class="' + cls + '" data-ly-row="' + id + '">' + handle +
      '<span class="ipp-ly-pos">' + (i + 1) + '</span>' +
      '<span class="ipp-ly-type' + (t ? '' : ' is-none') + (typeChanged(id) ? ' is-changed' : '') + '">' + esc(t || 'Type?') + '</span>' +
      '<button type="button" class="ipp-ly-main" data-ly-sel="' + id + '"><span class="ipp-ly-t">' + esc(rowTitle(s)) + '</span>' +
        '<span class="ipp-ly-s">' + esc(FAILS[id] ? 'Not saved: ' + FAILS[id] : rowSub(s)) + '</span></button>' +
      '<span class="ipp-ly-d' + (f.ok ? '' : ' is-bad') + (designChanged(id) ? ' is-changed' : '') + '" title="' + esc(design) + '">' + esc(design) + '</span>' +
      '<span class="ipp-ly-x">' + (ch && !SAVING ? '<button type="button" class="ix-revert" data-ly-cancel="' + id + '">Cancel</button>' : '') + '</span>' +
      '</div>';
  }
  function panelHtml() {
    if (!SEL || !own(ROWS, SEL)) {
      return '<div class="ipp-ly-card ipp-ly-panel is-empty"><div class="ipp-ly-k">Block</div>' +
        '<p>Click a block to set its ' + (articleTypes().length ? 'type and ' : '') + 'design.</p></div>';
    }
    var id = SEL, s = ROWS[id], i = CUR.order.indexOf(id), t = CUR.type[id];
    var h = '<div class="ipp-ly-card ipp-ly-panel' + (changed(id) ? ' ipp-dirty' : '') + '">' +
      '<div class="ipp-ly-ph"><span class="ipp-ly-k">Pos ' + (i + 1) + ' \u00b7 ' + esc(isArticle(s) ? 'Article' : (s.blockType || 'Block')) + '</span>' +
      (changed(id) && !SAVING ? '<button type="button" class="ix-revert" data-ly-cancel="' + id + '">Cancel</button>' : '') + '</div>' +
      '<div class="ipp-ly-pt">' + esc(rowTitle(s)) + '</div>';
    var off = LOCKED || SAVING ? ' disabled' : '';
    if (isArticle(s)) {
      var types = articleTypes();
      h += '<div class="ipp-ly-lab">Type</div>';
      if (!types.length) h += '<p class="ipp-ly-msg">Types can\u2019t be changed here yet: the Data Worker has no IX_CONFIG.layout.articleTypes.</p>';
      else h += '<div class="ipp-ly-grid ipp-ly-grid--types">' + types.map(function (l) {
        var c = 'ix-chip ipp-ly-chip' + (t === l ? (typeChanged(id) ? ' ix-chip--changed' : ' ipp-ly-cur') : '');
        return '<button type="button" class="' + c + '" data-ly-type="' + esc(l) + '" aria-pressed="' + (t === l) + '"' + off + '>' + esc(l) + '</button>';
      }).join('') + '</div>';
    } else {
      h += '<div class="ipp-ly-lab">Type</div><div class="ipp-ly-ro">' + esc(t || 'No type') + '</div>';
    }
    h += '<div class="ipp-ly-lab">Design' + (t ? ' \u00b7 only ' + esc(t) + ' designs' : '') + '</div>';
    if (!t) h += '<p class="ipp-ly-msg">Pick a type first.</p>';
    else {
      var list = choices(t), cur = CUR.design[id], fits = fitOf(id).ok;
      if (cur && !fits) h += '<p class="ipp-ly-msg is-bad">Now: \u201c' + esc(designName(cur, s)) + '\u201d, which is not made for ' + esc(t) + '.</p>';
      if (!list.length) h += '<p class="ipp-ly-msg is-bad">No live design is made for ' + esc(t) + ' blocks for this title.</p>';
      else h += '<div class="ipp-ly-grid ipp-ly-grid--designs">' + list.map(function (dz) {
        var c = 'ix-chip ipp-ly-dchip' + (cur === dz.id ? (designChanged(id) ? ' ix-chip--changed' : ' ipp-ly-cur') : '');
        return '<button type="button" class="' + c + '" data-ly-design="' + dz.id + '" aria-pressed="' + (cur === dz.id) + '" title="' + esc(dz.name) + '"' + off + '>' +
          '<span class="ipp-ly-dn">' + esc(dz.name) + '</span><span class="ipp-ly-dm">' + (dz.mine ? 'This title' : 'All titles') + '</span></button>';
      }).join('') + '</div>';
    }
    return h + '</div>';
  }
  function checkHtml(pr) {
    if (!pr.length) return '<div class="ipp-ly-card ipp-ly-check is-ok"><div class="ipp-ly-k">Before Publish</div><p>Every block has a design made for its type.</p></div>';
    return '<div class="ipp-ly-card ipp-ly-check"><div class="ipp-ly-k">Before Publish \u00b7 ' + plural(pr.length, ['block', 'blocks']) + ' to fix</div><ul>' +
      pr.map(function (p) { return '<li><button type="button" data-ly-sel="' + p.id + '"><b>Pos ' + p.pos + '</b> \u00b7 ' + esc(p.text) + '</button></li>'; }).join('') + '</ul></div>';
  }
  function paintTab(pr) {
    var total = CUR ? CUR.order.length : 0, fit = total - pr.length;
    document.querySelectorAll('.ipp-switcher button[data-view="layout"]').forEach(function (b) {
      if (!b.querySelector('.ipp-ly-tabname')) b.innerHTML = '<span class="ipp-ly-tabname">' + esc(b.textContent.trim() || 'Layout') + '</span><span class="ipp-ly-tabn"></span><span class="ipp-ly-tabdot" hidden></span>';
      b.classList.add('ipp-ly-tab');
      b.querySelector('.ipp-ly-tabn').textContent = total ? fit + '/' + total : '';
      b.querySelector('.ipp-ly-tabdot').hidden = !pr.length;
      b.setAttribute('aria-label', 'Layout' + (total ? ', ' + fit + ' of ' + total + ' designs fit' : '') + (pr.length ? ', needs attention' : ''));
    });
  }
  function savebar() {
    var v = view(); if (!v) return null;
    var bar = v.querySelector('.ipp-ly-bar');
    if (!bar) { bar = document.createElement('div'); bar.className = 'ipp-ly-bar'; bar.innerHTML = '<span class="dot"></span><span class="stat"></span>'; v.appendChild(bar); }
    var box = bar.querySelector('.ipp-ly-actions');
    if (!box) {
      box = document.createElement('span'); box.className = 'ipp-ly-actions';
      box.innerHTML = '<span class="ipp-ly-ed"></span><button type="button" class="ix-revert" data-ly-cancel-all hidden>Cancel all</button>' +
        '<button type="button" class="ix-btn ix-btn--primary" data-ly-save disabled>Save</button>';
      bar.appendChild(box);
      box.addEventListener('click', function (e) {
        if (e.target.closest('[data-ly-cancel-all]')) cancelAll();
        else if (e.target.closest('[data-ly-save]')) save();
      });
    }
    return bar;
  }
  function paintSavebar() {
    var bar = savebar(); if (!bar) return;
    var n = CUR ? changedIds().length : 0;
    var stat = bar.querySelector('.stat');
    if (stat) stat.textContent = SAVING ? 'Saving\u2026' : (LOCKED ? 'This plan is locked. Layout is read-only.' : (n ? plural(n, ['block', 'blocks']) + ' changed, not saved' : 'No unsaved changes'));
    bar.classList.toggle('ipp-dirty', n > 0); bar.classList.toggle('saving', SAVING);
    var edLine = '';
    if (n && !SAVING && CUR) {
      var ep = editionPlan();
      if (ep.open.length) edLine = 'Save also applies it to ' + ep.open.join(', ') + '.';
      if (ep.locked.length) edLine += (edLine ? ' ' : '') + ep.locked.join(', ') + (ep.locked.length === 1 ? ' is' : ' are') + ' locked.';
    }
    var el = bar.querySelector('.ipp-ly-ed'); if (el) el.textContent = edLine;
    var sv = bar.querySelector('[data-ly-save]'), ca = bar.querySelector('[data-ly-cancel-all]');
    if (sv) { sv.disabled = !n || SAVING || LOCKED; sv.textContent = SAVING ? 'Saving\u2026' : (n ? 'Save ' + plural(n, ['change', 'changes']) : 'Save'); }
    if (ca) ca.hidden = !n || SAVING;
  }
  function paint() {
    var c = canvas(); if (!c) return;
    if (!c.querySelector('.ipp-ly')) {
      c.innerHTML = '<div class="ipp-ly"><div class="ipp-ly-head"><h2 class="ipp-ly-h2">Layout</h2><span class="ipp-ly-hint"></span><span class="ipp-ly-info"></span></div>' +
        '<div class="ipp-ly-msgline" hidden></div><div class="ipp-ly-body"><div class="ipp-ly-stack" role="list"></div><div class="ipp-ly-side"></div></div></div>';
      wire(c);
    }
    var root = c.querySelector('.ipp-ly');
    root.querySelector('.ipp-ly-info').innerHTML = info();
    root.querySelector('.ipp-ly-hint').textContent = LOCKED ? 'This plan is locked. Unlock it in Pub Plans to change its layout.' : 'Top of the email first. Drag a block by its handle; click a block to set its type and design.';
    var msg = root.querySelector('.ipp-ly-msgline');
    var text = ERR ? 'The plan could not be read: ' + ERR : NOTE;
    msg.hidden = !text; msg.textContent = text; msg.classList.toggle('is-bad', !!ERR || /^Not /.test(NOTE));
    var stack = root.querySelector('.ipp-ly-stack'), keep = stack.scrollTop;
    if (!CUR) { stack.innerHTML = '<p class="ipp-ly-wait">' + (ERR ? '' : 'Reading the plan\u2026') + '</p>'; root.querySelector('.ipp-ly-side').innerHTML = ''; paintSavebar(); return; }
    stack.innerHTML = CUR.order.map(rowHtml).join('') || '<p class="ipp-ly-wait">This plan has no blocks yet. Add them on the Picker.</p>';
    stack.scrollTop = keep;
    var pr = problems();
    root.querySelector('.ipp-ly-side').innerHTML = panelHtml() + checkHtml(pr);
    paintTab(pr); paintSavebar();
  }

  // v1.0.1 — while Layout is open, its tray is the only one on screen.
  function otherTrays(hide) {
    var root = window.IPP && IPP.root ? IPP.root() : null;
    Array.prototype.slice.call(document.querySelectorAll('.ipp-savebar')).forEach(function (b) {
      if (hide) {
        if (!b.hasAttribute('data-ly-hid')) b.setAttribute('data-ly-hid', b.style.display || '');
        b.style.setProperty('display', 'none', 'important');
        return;
      }
      if (!b.hasAttribute('data-ly-hid')) return;
      var was = b.getAttribute('data-ly-hid'); b.removeAttribute('data-ly-hid');
      // inside the IPP the shell has just set it for the new view; outside, put it back
      if (root && root.contains(b)) { if (b.style.getPropertyPriority('display') === 'important') b.style.removeProperty('display'); }
      else b.style.display = was;
    });
  }

  // ── events ────────────────────────────────────────────────
  function wire(c) {
    c.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-ly-cancel]'))) { e.preventDefault(); cancelRow(b.getAttribute('data-ly-cancel')); return; }
      if ((b = e.target.closest('[data-ly-type]'))) { if (SEL) setType(SEL, b.getAttribute('data-ly-type')); return; }
      if ((b = e.target.closest('[data-ly-design]'))) { if (SEL) setDesign(SEL, b.getAttribute('data-ly-design')); return; }
      if ((b = e.target.closest('[data-ly-sel]'))) { SEL = b.getAttribute('data-ly-sel'); paint(); return; }
    });
    c.addEventListener('keydown', function (e) {
      var h = e.target.closest && e.target.closest('[data-ly-handle]'); if (!h) return;
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      var id = h.getAttribute('data-ly-handle'), i = CUR.order.indexOf(id);
      if (moveTo(id, i + (e.key === 'ArrowUp' ? -1 : 1))) {
        var nh = c.querySelector('[data-ly-handle="' + id + '"]'); if (nh) nh.focus({ preventScroll: true });
      }
    });
    c.addEventListener('pointerdown', function (e) {
      var h = e.target.closest && e.target.closest('[data-ly-handle]'); if (!h || LOCKED || SAVING || e.button !== 0) return;
      var id = h.getAttribute('data-ly-handle'), row = h.closest('.ipp-ly-row'), stack = c.querySelector('.ipp-ly-stack');
      e.preventDefault();
      var line = document.createElement('div'); line.className = 'ipp-ly-drop'; stack.appendChild(line);
      row.classList.add('is-dragging');
      DRAG = { id: id, to: -1, line: line, stack: stack, row: row };
      try { h.setPointerCapture(e.pointerId); } catch (x) {}
      dragMove(e);
    });
    c.addEventListener('pointermove', function (e) { if (DRAG) dragMove(e); });
    c.addEventListener('pointerup', function () { if (DRAG) dragEnd(true); });
    c.addEventListener('pointercancel', function () { if (DRAG) dragEnd(false); });
  }
  function dragMove(e) {
    var d = DRAG, rows = Array.prototype.slice.call(d.stack.querySelectorAll('.ipp-ly-row')).filter(function (r) { return r !== d.row; });
    var to = rows.length;
    for (var i = 0; i < rows.length; i++) { var rc = rows[i].getBoundingClientRect(); if (e.clientY < rc.top + rc.height / 2) { to = i; break; } }
    // auto-scroll near the edges
    var sr = d.stack.getBoundingClientRect();
    if (e.clientY < sr.top + 30) d.stack.scrollTop -= 12; else if (e.clientY > sr.bottom - 30) d.stack.scrollTop += 12;
    var ok = canMoveTo(d.id, to);
    d.to = ok ? to : -1;
    if (!ok) { d.line.style.display = 'none'; return; }
    var ref = rows[to] || rows[rows.length - 1], rr = ref.getBoundingClientRect(), y = (rows[to] ? rr.top - 4 : rr.bottom + 2) - sr.top + d.stack.scrollTop;
    d.line.style.display = ''; d.line.style.top = y + 'px';
  }
  function dragEnd(drop) {
    var d = DRAG; DRAG = null;
    if (d.line.parentNode) d.line.parentNode.removeChild(d.line);
    d.row.classList.remove('is-dragging');
    if (drop && d.to >= 0) moveTo(d.id, d.to);
  }

  // ── boot ──────────────────────────────────────────────────
  var MOUNTED = false;
  function mount() {
    if (MOUNTED || !view() || !canvas() || !window.IPP) return;
    MOUNTED = true;
    paint();
    document.addEventListener('ipp:board', onBoard);
    if (!IPP.board || typeof IPP.board.load !== 'function') { ERR = 'This page loads an older IPP shell. Layout needs ipp-shell-v1.6.js or later.'; paint(); }
    else if (IPP.board.data()) onBoard({ detail: { ok: true, data: IPP.board.data() } });
    else IPP.board.load().catch(function () { /* shown by onBoard */ });
    window.addEventListener('beforeunload', function (e) { if (CUR && changedIds().length) { e.preventDefault(); e.returnValue = ''; return ''; } });
    if (!blockWriter()) console.warn('[ipp-layout] PP_WEBHOOKS.blockWriter is not set; Save will refuse and say so.');
    console.info('[ipp-layout] mounted (v' + VERSION + ' \u00b7 writes through 124 reorder, layout, fill)');
  }
  document.addEventListener('ipp:ready', mount);
  document.addEventListener('ipp:view', function (e) {
    var on = !!(e.detail && e.detail.view === 'layout');
    if (on) { mount(); paint(); }
    otherTrays(on);
  });
  if (document.querySelector('[data-ipp-root]')) mount();

  window.IPP = window.IPP || {};
  window.IPP.layout = { version: VERSION, save: save, cancelAll: cancelAll, mount: mount,
    pending: function () { return CUR ? changedIds() : []; }, problems: function () { return CUR ? problems() : []; },
    _positions: newPositions };
})();
