/* ipp-revenue-v1.0.js */
/* ============================================================
   ipp-revenue-v1.0.js — Revenue view for the IPP · REVENUE LIGHT
   Companion stylesheet: ipp-revenue-v1.0.css
   Needs on the page: ipp-shell v1.11+ (IPP.board, the Revenue view),
   ix-tokens, ix-buttons, ix-form-controls (ix-revert), ix-info,
   ix-success-toast, ix-progress.
   Needs the Data Worker ix-issue-data v1.0.25+ (/plan-board answers
   adPool and adFields).

   v1.0 (IPP Build S7, 9 Oct 2026) — FIRST BUILD, "REVENUE LIGHT"
     Ruled 9 Oct: the light version first, with no OBLIGATIONS. Ruled
     7 Oct: Revenue is the picker for every banner ad including the Lead
     Banner; see every Customer, click one, see their ads, pick, it
     slots in; order is set on Layout, not here; House ads are always
     available.

     WHAT IT SHOWS
       · Every banner slot of this plan (a slot whose asset type is
         "ad"), in position order. The first is the Lead banner, the
         rest Banner 2, Banner 3 … Each is one fixed-size tile.
       · The ad shelf: House ads first, then every customer with an ad
         for this title, then ads with no customer. Click a customer to
         see their ads. A search box finds a customer or an ad by name.
       · A salmon tile is an ad that came over on a clone and is waiting
         for you (needs-approval = yes). It says so and offers Approve.

     HOW PICKING WORKS
       · One slot is "chosen" at a time (blue ring). On open, the first
         empty slot is chosen. Click any tile to choose it instead.
       · Click an ad on the shelf: it goes into the chosen slot as a
         pending change (gold border), and the next empty slot is
         chosen, so a run of empty slots fills in a row.
       · Remove empties a slot. Approve keeps a cloned ad.
       · Every pending tile has its own small Cancel link. The save bar
         names every waiting change and has Cancel all and Save.
       · Pending picks survive moving around the tab, searching, and a
         board reload. They are dropped only by Cancel, a successful
         save, or the slot leaving the plan.
       · An ad with no banner picture shows, but cannot be placed.
       · An ad already in another slot says where. Placing it twice is
         allowed; the tile notes it.
       · A locked plan shows everything and changes nothing.

     HOW IT SAVES (Scenario 124, no Make change)
       fill   { id, assetField: adFields.ad, assetId }   new ad
       clear  { id, assetField: adFields.ad }            Remove
       clear  { id, assetField: adFields.approval }      Approve, and
              any new pick or Remove on a slot waiting for approval
       Field names come from the board (adFields), never typed here.
       A slot counts as saved only when every write for it read back
       what was sent (TOAST-TRUTH). Failed slots keep their pending
       change and say why. Then the board is read again, fresh.

     NOT IN THIS VERSION
       · OBLIGATIONS (what was sold). Comes after the light version.
       · The Splash ad. It lives on the NEWSLETTER item, which no
         scenario the page can call writes yet.
       · Banner rotation on the web page. That is render work.

   HARDCODED (provisional ids; the doc chat allocates)
     HC-P-RV1-1  Slot names "Lead banner" / "Banner N": the lead is the
                 lowest-position ad slot. Platform rule from the 7 Oct
                 ruling, not tenant data.
     HC-P-RV1-2  BATCH_URL_CEILING 1800 and BATCH_CHUNK 15, the same
                 values as the Picker (HC-P-IPP3-5).
     HC-P-RV1-3  English copy. Same class as HC-P-PROG-2.
   ============================================================ */
(function () {
  'use strict';

  var VERSION = '1.0';
  var FILE = 'ipp-revenue-v1.0.js';
  var BATCH_URL_CEILING = 1800, BATCH_CHUNK = 15;   // HC-P-RV1-2
  var HOUSE = '__house', NONE = '__none';

  var R = {
    pending: {},      // slotId -> { kind:'pick', adId } | { kind:'remove' } | { kind:'approve' }
    fails: {},        // slotId -> why
    armed: null,      // slotId
    customer: null,   // shelf group key
    query: '',
    saving: false,
    armedOnce: false,
    root: null
  };

  // ── board access ─────────────────────────────────────────────
  function board() { return (window.IPP && IPP.board && IPP.board.data()) || null; }
  function locked() { var b = board(); return !!(b && b.plan && b.plan.locked); }
  function fields() { var b = board(); return (b && b.adFields) || null; }
  function pool() { var b = board(); return (b && Array.isArray(b.adPool)) ? b.adPool : []; }
  function adById(id) { var p = pool(); for (var i = 0; i < p.length; i++) if (p[i].id === id) return p[i]; return null; }
  function adSlots() {
    var b = board(); if (!b || !Array.isArray(b.slots)) return [];
    return b.slots.filter(function (s) { return s.assetType === 'ad'; })
      .sort(function (a, c) { return (Number(a.position) || 0) - (Number(c.position) || 0); });
  }
  function slotById(id) { var l = adSlots(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function slotName(s) {                                   // HC-P-RV1-1
    var l = adSlots(), i = l.indexOf(s);
    return i === 0 ? 'Lead banner' : 'Banner ' + (i + 1);
  }

  // What the slot will hold after Save.
  function after(s) {
    var p = R.pending[s.id];
    if (p && p.kind === 'pick') return { adId: p.adId, ack: false };
    if (p && p.kind === 'remove') return { adId: null, ack: false };
    var id = s.asset && s.asset.id ? s.asset.id : null;
    return { adId: id, ack: !!s.needsAck && !(p && p.kind === 'approve') };
  }
  function isEmptyAfter(s) { return !after(s).adId; }
  function whereAd(adId, exceptSlot) {
    var out = [];
    adSlots().forEach(function (s) { if (s.id !== exceptSlot && after(s).adId === adId) out.push(slotName(s)); });
    return out;
  }

  // ── small helpers ────────────────────────────────────────────
  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function toast(msg, kind) {
    if (window.IxToast && typeof IxToast.show === 'function') IxToast.show(msg, kind, { key: 'ipp-revenue' });
    else if (window.IPP && IPP.toast) IPP.toast(msg, kind === 'err');
  }
  function canvas() { return document.querySelector('.ipp-view[data-view="revenue"] .ipp-canvas'); }
  function info() {
    if (!window.IxInfo || typeof IxInfo.badge !== 'function') return '';
    return IxInfo.badge({
      file: FILE, version: VERSION, title: 'Revenue · banner ads',
      blurb: 'Pick the banner ad for every banner slot in this issue, including the Lead banner.\n\n' +
             'Choose a slot (blue ring), then click an ad on the shelf. The change waits, with a gold ' +
             'border, until you Save. Each waiting tile has its own Cancel.\n\n' +
             'A salmon tile is an ad copied over by Clone. It waits for you: Approve keeps it, or pick ' +
             'another ad.\n\n' +
             'The order of the slots is set on Layout. Sold space (OBLIGATIONS) and the Splash ad come later.',
      scenarios: [{ name: '124 \u00b7 PubPlan Block Writer', note: 'fill and clear, no change needed' }],
      companions: 'ipp-revenue-v1.0.css \u00b7 ix-issue-data v1.0.25 /plan-board adPool'
    });
  }

  // ── shelf groups ─────────────────────────────────────────────
  function groupKey(a) { return a.house ? HOUSE : (a.customerId || NONE); }
  function groups() {
    var order = [], by = {};
    pool().forEach(function (a) {
      var k = groupKey(a);
      if (!by[k]) {
        by[k] = { key: k, ads: [],
          name: k === HOUSE ? 'House ads' : (k === NONE ? 'No customer set' : (a.customer || 'Customer not found')) };
        order.push(k);
      }
      by[k].ads.push(a);
    });
    var house = order.filter(function (k) { return k === HOUSE; });
    var none = order.filter(function (k) { return k === NONE; });
    var rest = order.filter(function (k) { return k !== HOUSE && k !== NONE; });
    return house.concat(rest, none).map(function (k) { return by[k]; });
  }

  // ── render ───────────────────────────────────────────────────
  function render() {
    var c = canvas(); if (!c) return;
    var keep = c.scrollTop;
    var shelfList = c.querySelector('.ipp-rv-shelf-list'), keepShelf = shelfList ? shelfList.scrollTop : 0;
    var b = board();
    var head =
      '<div class="ipp-rv-head"><p class="ipp-rv-kicker">Ads for this issue</p>' +
      '<div class="ipp-rv-titlerow"><h2 class="ipp-rv-title">Revenue</h2>' + info() + '</div>' +
      '<p class="ipp-rv-sub">Pick the banner ad for each slot. Slot order is set on Layout.</p></div>';
    if (!b) {
      var err = window.IPP && IPP.board ? IPP.board.error() : '';
      c.innerHTML = '<div class="ipp-rv">' + head + '<div class="ipp-rv-msg' + (err ? ' is-err' : '') + '">' +
        esc(err ? 'Can\u2019t read this plan: ' + err : 'Reading this plan\u2026') + '</div></div>';
      return;
    }
    if (!fields()) {
      c.innerHTML = '<div class="ipp-rv">' + head + '<div class="ipp-rv-msg is-err">The plan data has no ad fields ' +
        '(adFields). The Data Worker must be v1.0.25 or later.</div></div>';
      return;
    }
    var slots = adSlots();
    prune(slots);
    if (!R.armedOnce && !locked()) { R.armedOnce = true; R.armed = nextEmpty(null); }
    if (R.armed && !slotById(R.armed)) R.armed = null;

    var ackN = slots.filter(function (s) { return after(s).ack; }).length;
    var filled = slots.filter(function (s) { return !isEmptyAfter(s); }).length;
    var summary = '<div class="ipp-rv-summary">' +
      '<span><b>' + slots.length + '</b> banner slot' + (slots.length === 1 ? '' : 's') + '</span>' +
      '<span><b>' + filled + '</b> filled</span>' +
      '<span><b>' + (slots.length - filled) + '</b> empty</span>' +
      (ackN ? '<span class="is-ack"><b>' + ackN + '</b> waiting for approval</span>' : '') + '</div>';
    var notes = '';
    if (locked()) notes += '<div class="ipp-rv-msg">This plan is locked. Its ads are shown, and nothing can change.</div>';
    if (ackN) notes += '<div class="ipp-rv-ackbar">' + ackN + ' ad' + (ackN === 1 ? '' : 's') +
      ' came over from the issue this one was cloned from. Approve each one to run it again, or pick another ad.</div>';
    var grid = slots.length
      ? '<div class="ipp-rv-grid">' + slots.map(tile).join('') + '</div>'
      : '<div class="ipp-rv-msg">This plan has no banner slots. Slots are added on the Default Layout or Layout.</div>';

    c.innerHTML = '<div class="ipp-rv">' + head + summary + notes +
      '<div class="ipp-rv-body"><section class="ipp-rv-slots">' + grid + '</section>' + shelf() + '</div>' +
      savebar() + '</div>';
    c.scrollTop = keep;
    var nl = c.querySelector('.ipp-rv-shelf-list'); if (nl) nl.scrollTop = keepShelf;
    var si = c.querySelector('.ipp-rv-search'); if (si) si.value = R.query;
    fit();
  }

  // The slots column is exactly as wide as the tiles it holds, so the
  // shelf sits right beside them and no gap opens between the two.
  // Tiles keep their fixed size; only the number per row changes.
  var TILE_W = 260, TILE_GAP = 14, SHELF_W = 360, BODY_GAP = 24;
  function fit() {
    var c = canvas(); if (!c) return;
    var body = c.querySelector('.ipp-rv-body'), sec = c.querySelector('.ipp-rv-slots'), grid = c.querySelector('.ipp-rv-grid');
    if (!body || !sec) return;
    var w = body.clientWidth; if (!w) return;
    var stacked = w < TILE_W + BODY_GAP + SHELF_W + TILE_W;   // too narrow for even one column beside the shelf
    body.classList.toggle('is-stacked', stacked);
    var avail = stacked ? w : w - SHELF_W - BODY_GAP;
    var n = Math.max(1, Math.floor((avail + TILE_GAP) / (TILE_W + TILE_GAP)));
    var count = adSlots().length;
    if (count && n > count) n = count;
    if (grid) grid.style.gridTemplateColumns = 'repeat(' + n + ', ' + TILE_W + 'px)';
    sec.style.width = stacked ? '' : (n * (TILE_W + TILE_GAP) - TILE_GAP) + 'px';
  }

  function tile(s) {
    var p = R.pending[s.id], a = after(s), lk = locked();
    var shownAd = a.adId ? (adById(a.adId) || (s.asset && s.asset.id === a.adId ? s.asset : null)) : null;
    var pic = shownAd ? (shownAd.banner || shownAd.thumb || '') : '';
    var who = shownAd ? (shownAd.customer || (shownAd.house ? 'House ad' : '')) : '';
    var what = shownAd ? (shownAd.name || '') : '';
    var cls = ['ipp-rv-tile'];
    if (R.armed === s.id) cls.push('is-armed');
    if (p && !p.saved) cls.push('is-pending');
    if (p && p.saved) cls.push('is-saved');
    if (a.ack) cls.push('is-ack');
    if (!a.adId) cls.push('is-empty');
    if (R.fails[s.id]) cls.push('is-fail');
    if (p && p.kind === 'remove') cls.push('is-removing');

    var note = '', acts = '';
    if (R.fails[s.id]) note = '<span class="bad">Not saved: ' + esc(R.fails[s.id]) + '</span>';
    else if (p && p.saved) note = '<span class="ok">Saved</span>';
    else if (p && p.kind === 'pick') note = '<span class="gold">New ad, waiting for Save</span>';
    else if (p && p.kind === 'remove') note = '<span class="gold">Will be emptied on Save</span>';
    else if (p && p.kind === 'approve') note = '<span class="gold">Approved, waiting for Save</span>';
    else if (a.ack) note = '<span class="ack">Copied by Clone. Needs approval.</span>';
    else if (s.asset && s.asset.missing) note = '<span class="bad">This ad is no longer in ADS.</span>';
    else if (!a.adId) note = R.armed === s.id && !lk ? '<span class="dim">Pick an ad on the shelf</span>' : '';
    else {
      var dup = whereAd(a.adId, s.id);
      note = dup.length ? '<span class="gold">Also in ' + esc(dup.join(', ')) + '</span>' : '<span class="dim">In this issue</span>';
    }
    if (p && !p.saved && !lk) {
      var dup2 = (p.kind === 'pick') ? whereAd(p.adId, s.id) : [];
      if (dup2.length && !R.fails[s.id]) note = '<span class="gold">New ad, also in ' + esc(dup2.join(', ')) + '</span>';
    }

    if (!lk && !R.saving) {
      if (p && p.saved) p = null;
      if (a.ack && !p) acts += '<button type="button" class="ix-btn ix-btn--secondary ipp-rv-approve" data-rv-approve="' + esc(s.id) + '">Approve</button>';
      if (a.adId && !(p && p.kind === 'remove')) acts += '<button type="button" class="ix-revert" data-rv-remove="' + esc(s.id) + '">Remove</button>';
      if (p) acts += '<button type="button" class="ix-revert ipp-rv-cancel" data-rv-cancel="' + esc(s.id) + '">Cancel</button>';
    }
    return '<div class="' + cls.join(' ') + '" data-rv-slot="' + esc(s.id) + '"' + (lk ? '' : ' tabindex="0" role="button"') +
      ' title="' + esc(slotName(s) + (what ? ': ' + what : '')) + '">' +
      '<div class="ipp-rv-tile-head"><span class="ipp-rv-slotname">' + esc(slotName(s)) + '</span>' +
      (R.armed === s.id ? '<span class="ipp-rv-chosen">Chosen</span>' : '') + '</div>' +
      '<div class="ipp-rv-thumb">' + (pic ? '<img src="' + esc(pic) + '" alt="" loading="lazy">'
        : '<span>' + (a.adId ? 'No banner picture' : 'Empty slot') + '</span>') + '</div>' +
      '<div class="ipp-rv-who">' + esc(who || '\u00a0') + '</div>' +
      '<div class="ipp-rv-what">' + esc(what || '\u00a0') + '</div>' +
      '<div class="ipp-rv-note">' + note + '</div>' +
      '<div class="ipp-rv-acts">' + acts + '</div></div>';
  }

  function shelf() {
    var lk = locked(), armed = R.armed ? slotById(R.armed) : null;
    var top = lk ? 'Locked: nothing can be placed.'
      : armed ? 'Placing into <b>' + esc(slotName(armed)) + '</b>'
      : 'Click a banner slot, then an ad.';
    return '<aside class="ipp-rv-shelf"><div class="ipp-rv-shelf-head"><span class="ipp-rv-shelf-title">Ad shelf</span>' +
      '<span class="ipp-rv-shelf-target">' + top + '</span></div>' +
      '<input type="search" class="ipp-rv-search" placeholder="Find a customer or an ad" aria-label="Find a customer or an ad">' +
      '<div class="ipp-rv-shelf-list">' + shelfList() + '</div></aside>';
  }

  function shelfList() {
    var gs = groups();
    if (!pool().length) return '<div class="ipp-rv-empty">No ads in ADS name this title yet.</div>';
    var q = R.query.trim().toLowerCase();
    if (q) {
      var hits = [];
      gs.forEach(function (g) {
        var gm = g.name.toLowerCase().indexOf(q) >= 0;
        g.ads.forEach(function (a) { if (gm || String(a.name).toLowerCase().indexOf(q) >= 0) hits.push(a); });
      });
      return hits.length ? hits.map(function (a) { return adCard(a, true); }).join('')
        : '<div class="ipp-rv-empty">Nothing matches \u201c' + esc(R.query) + '\u201d.</div>';
    }
    var g = R.customer ? gs.filter(function (x) { return x.key === R.customer; })[0] : null;
    if (g) {
      return '<button type="button" class="ix-revert ipp-rv-back" data-rv-back="1">\u2190 All customers</button>' +
        '<div class="ipp-rv-group-name">' + esc(g.name) + '</div>' + g.ads.map(function (a) { return adCard(a, false); }).join('');
    }
    return gs.map(function (x) {
      var used = x.ads.filter(function (a) { return whereAd(a.id, null).length; }).length;
      return '<button type="button" class="ipp-rv-cust' + (x.key === HOUSE ? ' is-house' : '') + '" data-rv-cust="' + esc(x.key) + '">' +
        '<span class="n">' + esc(x.name) + '</span>' +
        (used ? '<span class="u">' + used + ' in issue</span>' : '') +
        '<span class="c">' + x.ads.length + '</span></button>';
    }).join('');
  }

  function adCard(a, showWho) {
    var lk = locked(), where = whereAd(a.id, null), can = !lk && !!a.banner && !!R.armed && !R.saving;
    var why = !a.banner ? 'No banner picture' : (!R.armed && !lk ? 'Choose a slot first' : '');
    return '<button type="button" class="ipp-rv-ad' + (can ? '' : ' is-off') + '" data-rv-ad="' + esc(a.id) + '"' +
      (can ? '' : ' aria-disabled="true"') + ' title="' + esc(a.name) + '">' +
      '<span class="ipp-rv-ad-pic">' + (a.banner ? '<img src="' + esc(a.banner) + '" alt="" loading="lazy">' : '<span>No banner picture</span>') + '</span>' +
      '<span class="ipp-rv-ad-text">' +
        (showWho ? '<span class="w">' + esc(a.customer || (a.house ? 'House ad' : 'No customer set')) + '</span>' : '') +
        '<span class="n">' + esc(a.name) + '</span>' +
        '<span class="m">' + esc([a.status, a.house ? (a.houseKind ? 'House \u00b7 ' + a.houseKind : 'House') : a.type].filter(Boolean).join(' \u00b7 ')) +
        (where.length ? '<em>In ' + esc(where.join(', ')) + '</em>' : '') +
        (why && !a.banner ? '<em class="off">' + esc(why) + '</em>' : '') + '</span>' +
      '</span></button>';
  }

  function savebar() {
    var keys = waiting();
    if (!keys.length && !R.saving) return '';
    var parts = keys.map(function (k) {
      var s = slotById(k), p = R.pending[k]; if (!s) return '';
      var a = p.kind === 'pick' ? adById(p.adId) : null;
      return slotName(s) + ': ' + (p.kind === 'pick' ? (a ? a.name : 'new ad') : p.kind === 'remove' ? 'empty' : 'approve');
    }).filter(Boolean);
    var label = R.saving ? 'Saving ' + parts.length + ' change' + (parts.length === 1 ? '' : 's') + '\u2026'
      : parts.length + ' change' + (parts.length === 1 ? '' : 's') + ' waiting';
    return '<div class="ipp-rv-savebar' + (R.saving ? ' is-saving' : '') + '"><div class="ipp-rv-save-text">' +
      '<b>' + esc(label) + '</b><span>' + esc(parts.join(' \u00b7 ')) + '</span></div>' +
      (R.saving ? '' : '<button type="button" class="ix-revert" data-rv-cancel-all="1">Cancel all</button>') +
      '<button type="button" class="ix-btn ix-btn--primary" data-rv-save="1"' + (R.saving ? ' disabled' : '') + '>' +
      (R.saving ? 'Saving\u2026' : 'Save') + '</button></div>';
  }

  // ── state changes ────────────────────────────────────────────
  // Saved changes stay on the tile, marked Saved, until the board is
  // read again, so a tile never flips back to its old ad in between.
  function waiting() {
    var order = {}; adSlots().forEach(function (s, i) { order[s.id] = i; });
    return Object.keys(R.pending).filter(function (k) { return !R.pending[k].saved; })
      .sort(function (x, y) { return (order[x] == null ? 999 : order[x]) - (order[y] == null ? 999 : order[y]); });
  }
  function prune(slots) {
    var ids = {}; slots.forEach(function (s) { ids[s.id] = 1; });
    Object.keys(R.pending).forEach(function (k) { if (!ids[k]) delete R.pending[k]; });
    Object.keys(R.fails).forEach(function (k) { if (!ids[k]) delete R.fails[k]; });
    // a pick that matches what the slot already holds is no change
    slots.forEach(function (s) {
      var p = R.pending[s.id];
      if (p && p.kind === 'pick' && s.asset && s.asset.id === p.adId && !s.needsAck) delete R.pending[s.id];
      if (p && p.kind === 'approve' && !s.needsAck) delete R.pending[s.id];
      if (p && p.kind === 'remove' && !(s.asset && s.asset.id)) delete R.pending[s.id];
    });
  }
  function nextEmpty(fromId) {
    var l = adSlots(), start = 0;
    if (fromId) { for (var i = 0; i < l.length; i++) if (l[i].id === fromId) { start = i + 1; break; } }
    for (var j = 0; j < l.length; j++) {
      var s = l[(start + j) % l.length];
      if (s.id !== fromId && isEmptyAfter(s)) return s.id;
    }
    return null;
  }
  function place(adId) {
    if (locked() || R.saving || !R.armed) return;
    var a = adById(adId); if (!a || !a.banner) return;
    var s = slotById(R.armed); if (!s) return;
    delete R.fails[s.id];
    if (s.asset && s.asset.id === adId && !s.needsAck) delete R.pending[s.id];
    else R.pending[s.id] = { kind: 'pick', adId: adId };
    R.armed = nextEmpty(s.id);
    render();
  }

  // ── saving through Scenario 124 ──────────────────────────────
  function blockWriter() { return String((window.PP_WEBHOOKS || {}).blockWriter || ''); }
  function batchUrl(url, op, batchId, ops) {
    return url + (url.indexOf('?') < 0 ? '?' : '&') + 'op=' + encodeURIComponent(op) +
      '&batchId=' + encodeURIComponent(batchId) + '&batch=' + encodeURIComponent(JSON.stringify({ ops: ops }));
  }
  function chunkOps(url, op, batchId, ops) {
    if (batchUrl(url, op, batchId, ops).length <= BATCH_URL_CEILING) return [ops];
    var out = []; for (var i = 0; i < ops.length; i += BATCH_CHUNK) out.push(ops.slice(i, i + BATCH_CHUNK));
    return out;
  }
  function sendBatch(url, op, ops) {
    var batchId = 'rev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    var chunks = chunkOps(url, op, batchId, ops), results = [], base = 0;
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
  function verdict(res, want) {
    if (!res) return 'no result came back';
    if (res.ok !== true || !res.id) return res.err || 'Webflow refused the write';
    var got = (res.fieldData || {}).asset;
    if (String(got == null ? '' : got) !== String(want == null ? '' : want)) return 'the slot did not keep the change';
    return '';
  }
  // items: [{ slotId, op:{...}, want }] -> Promise<[{ slotId, why }]>
  function stage(url, op, items) {
    if (!items.length) return Promise.resolve([]);
    return sendBatch(url, op, items.map(function (it) { return it.op; })).then(function (results) {
      return items.map(function (it, i) { return { slotId: it.slotId, why: verdict(resultFor(results, i), it.want) }; });
    }, function (e) {
      var why = (e && e.message) || 'the request failed';
      return items.map(function (it) { return { slotId: it.slotId, why: why }; });
    });
  }

  function save() {
    if (R.saving) return;
    var keys = waiting(); if (!keys.length) return;
    if (locked()) { toast('Can\u2019t save: this plan is locked. Nothing was sent.', 'err'); return; }
    var url = blockWriter();
    if (!url) { toast('Can\u2019t save: this page has no PP_WEBHOOKS.blockWriter address (Scenario 124). Nothing was sent.', 'err'); return; }
    var F = fields();
    if (!F || !F.ad || !F.approval) { toast('Can\u2019t save: the plan data does not name the ad fields (Data Worker v1.0.25). Nothing was sent.', 'err'); return; }

    var fills = [], clears = [], names = {};
    keys.forEach(function (k) {
      var s = slotById(k), p = R.pending[k]; if (!s) return;
      names[k] = slotName(s);
      if (p.kind === 'pick') fills.push({ slotId: k, op: { id: k, assetField: F.ad, assetId: p.adId }, want: p.adId });
      if (p.kind === 'remove') clears.push({ slotId: k, op: { id: k, assetField: F.ad }, want: '' });
      if (s.needsAck) clears.push({ slotId: k, op: { id: k, assetField: F.approval }, want: '' });
    });
    R.saving = true; R.fails = {}; render();

    var failed = {};
    stage(url, 'fill', fills).then(function (r1) {
      r1.forEach(function (x) { if (x.why) failed[x.slotId] = x.why; });
      // do not clear approval on a slot whose new ad did not land
      var cl = clears.filter(function (c) { return !failed[c.slotId]; });
      return stage(url, 'clear', cl);
    }).then(function (r2) {
      r2.forEach(function (x) { if (x.why && !failed[x.slotId]) failed[x.slotId] = x.why; });
    }, function (e) {
      keys.forEach(function (k) { if (!failed[k]) failed[k] = (e && e.message) || 'the request failed'; });
    }).then(function () {
      var okN = 0;
      keys.forEach(function (k) { if (failed[k]) R.fails[k] = failed[k]; else { R.pending[k].saved = true; okN++; } });
      R.saving = false;
      var badN = Object.keys(failed).length;
      if (!badN) toast('Saved ' + okN + ' banner change' + (okN === 1 ? '' : 's') + '.', 'ok');
      else toast(badN + ' banner change' + (badN === 1 ? '' : 's') + ' not saved: ' +
        Object.keys(failed).map(function (k) { return names[k] + ' (' + failed[k] + ')'; }).join('; ') +
        (okN ? '. ' + okN + ' saved.' : '.'), 'err');
      render();
      if (window.IPP && IPP.board) IPP.board.load({ fresh: true }).catch(function () { render(); });
    });
  }

  // ── events (one delegated set on the canvas) ─────────────────
  function wire(c) {
    c.addEventListener('click', function (e) {
      var t = e.target;
      var el;
      if ((el = t.closest('[data-rv-save]'))) { save(); return; }
      if ((el = t.closest('[data-rv-cancel-all]'))) { waiting().forEach(function (k) { delete R.pending[k]; }); R.fails = {}; render(); return; }
      if (R.saving) return;
      if ((el = t.closest('[data-rv-cancel]'))) { var k = el.getAttribute('data-rv-cancel'); delete R.pending[k]; delete R.fails[k]; render(); return; }
      if ((el = t.closest('[data-rv-approve]'))) { if (!locked()) { R.pending[el.getAttribute('data-rv-approve')] = { kind: 'approve' }; render(); } return; }
      if ((el = t.closest('[data-rv-remove]'))) {
        if (!locked()) { var rk = el.getAttribute('data-rv-remove'), rs = slotById(rk);
          if (rs && rs.asset && rs.asset.id) R.pending[rk] = { kind: 'remove' }; else delete R.pending[rk];
          render(); }
        return;
      }
      if ((el = t.closest('[data-rv-back]'))) { R.customer = null; render(); return; }
      if ((el = t.closest('[data-rv-cust]'))) { R.customer = el.getAttribute('data-rv-cust'); render(); return; }
      if ((el = t.closest('[data-rv-ad]'))) { place(el.getAttribute('data-rv-ad')); return; }
      if ((el = t.closest('[data-rv-slot]'))) { if (!locked()) { R.armed = el.getAttribute('data-rv-slot'); render(); } return; }
    });
    c.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var el = e.target.closest && e.target.closest('[data-rv-slot]');
      if (el && e.target === el && !locked() && !R.saving) { e.preventDefault(); R.armed = el.getAttribute('data-rv-slot'); render(); }
    });
    c.addEventListener('input', function (e) {
      if (!e.target.classList.contains('ipp-rv-search')) return;
      R.query = e.target.value || '';
      var l = c.querySelector('.ipp-rv-shelf-list'); if (l) { l.innerHTML = shelfList(); l.scrollTop = 0; }
    });
  }

  // ── mount ────────────────────────────────────────────────────
  function mount() {
    var c = canvas(); if (!c) return false;
    if (c.getAttribute('data-revenue-mounted') === '1') return true;
    c.setAttribute('data-revenue-mounted', '1');
    wire(c);
    render();
    if (window.ResizeObserver) new ResizeObserver(function () { fit(); }).observe(c);
    else window.addEventListener('resize', fit);
    if (window.IPP && IPP.board && !IPP.board.data()) IPP.board.load().catch(function () { render(); });
    console.info('[IPP] Revenue v' + VERSION + ' mounted');
    return true;
  }
  document.addEventListener('ipp:board', function (e) {
    if (e && e.detail && e.detail.ok) Object.keys(R.pending).forEach(function (k) { if (R.pending[k].saved) delete R.pending[k]; });
    if (canvas() && canvas().getAttribute('data-revenue-mounted') === '1') render();
  });
  document.addEventListener('ipp:view', function (e) {
    if (!e || !e.detail || e.detail.view !== 'revenue') return;
    if (!mount()) return;
    render();
  });
  document.addEventListener('ipp:ready', mount);
  if (window.IPP && canvas()) mount();
  window.IPPRevenue = { version: VERSION, render: render, state: R };
})();
