/* ipp-revenue-v1.5.3.js */
/* ============================================================
   ipp-revenue-v1.3.js — Revenue view for the IPP · REVENUE LIGHT
   Companion stylesheet: ipp-revenue-v1.3.css
   Needs on the page: ipp-shell v1.11+ (IPP.board, the Revenue view),
   ix-tokens, ix-buttons, ix-form-controls (ix-revert), ix-info,
   ix-success-toast, ix-progress.
   Needs the Data Worker ix-issue-data v1.0.27+ (/plan-board answers
   adPool, adFields and splash) and Scenario 124 v2.18+ (op splash).

   v1.1 (IPP Build S7, 9 Oct 2026) — THE SPLASH TILE
     Finishes the 7 Oct ruling: Revenue picks the Splash ad as well as
     every banner.
       · The first tile is Splash, the same fixed size as a banner tile.
         Its picture is the portrait splash shape, shown whole.
       · Choose it (blue ring) and the shelf shows only ads that have a
         splash picture: the title's house splash, then customers.
       · Pick a customer's ad: it waits in gold like a banner pick.
         "Use house splash" puts this issue back on the title's house
         splash. Cancel reverts either one.
       · Where it is written: the three NEWSLETTER fields the splash page
         reads today (D228's interim bridge, HC-084): the ad's splash
         picture, its redirect link, and its customer's name (the ad's
         own name when it has no customer). House splash clears all
         three. Field names come from the board (splash.fields).
       · Saved through Scenario 124 op splash: { id: NEWSLETTER id,
         body, fImage }. The write is staged; the NEWSLETTER is not
         published here (206 publishes it on Compile, and the Data
         Worker reads staged). Green only when the picture read back
         matches. Then the page asks the Worker's /splash with fresh=1,
         so the splash page shows the change at once.
       · No NEWSLETTER for the plan, or the splash data missing: the
         tile says so and cannot be chosen. More than one NEWSLETTER:
         one Splash tile each, named with the issue.
       · Clone does not copy the splash (it is on the NEWSLETTER, not a
         slot), so a cloned issue starts on the house splash.

   v1.5.3 (IPP Build S7, 10 Oct 2026) — A SALMON DOT WHEN A TAB NEEDS YOU
     Ruled 10 Oct: no green, no Ready. A tab shows a small salmon dot only
     when something on it needs attention: an ad copied by Clone waiting
     for approval, a failed save, a section whose blocks disagree on the
     sponsor, or Splash failing to load. Nothing shows in the normal case.
     Unsaved edits get no dot; the save bar already lists them across all
     three tabs. The dot carries a title ("Needs attention") for hover and
     screen readers. CSS: one rule, .ipp-rv-dot, in ipp-revenue-v1.5.3.css.

   v1.5.2 (IPP Build S7, 10 Oct 2026) — THE READY MARKS ARE GONE
     Ruled 10 Oct: with an empty slot a resting state (house ad), a
     "Revenue ready" that is green on an all-empty issue says nothing.
     Removed: the "Revenue ready / not ready" pill by the title, and the
     Ready / Unsaved / Not ready mark on each tab. The tabs read Banners ·
     Splash · Sponsors with nothing after them. readiness() and the
     ipp:revenue-ready event stay (they cost nothing and a later Publish
     interlock may want them), but nothing in this view paints from them.
     Pairs ipp-revenue-v1.5.1.css unchanged (the .ipp-rv-ready / .ipp-rv-mark
     rules are simply unused now). Nothing else changed.

   v1.5.1 (IPP Build S7, 10 Oct 2026) — THE SHELF IS PINNED RIGHT, FULL HEIGHT
     Standing rule (Jeff): the shelf is always pinned to the right edge
     and runs the full height of the working area. v1.0–v1.5 sat it
     beside the last tile column, so a gap opened on its right (the
     empty right rail copied from Layout) and it stopped short of the
     bottom.
     · The Revenue canvas no longer scrolls as a whole. Head and tabs
       stay put; below them the slots scroll on their own and the shelf
       stands at the right edge, top to bottom, its list scrolling inside.
     · The empty right rail is hidden on the Revenue view.
     · The tiles stay fixed size and fill from the left; the column count
       is whatever fits beside the shelf.
     · The shelf stays pinned down to one tile column beside it (it used
       to drop under the tiles below about 1400 px wide, which on a
       laptop meant always). Only narrower than one column does it go
       under.
     · Slot scroll position is kept across redraws, as the shelf's was.
     Pairs ipp-revenue-v1.5.1.css. Nothing else changed.

   v1.5 (IPP Build S7, 9 Oct 2026) — SECTION SPONSORS, THIS ISSUE ONLY
     Jeff, 9 Oct: every PubPlan assignment is for that issue. A sponsor
     set here is fixed for this issue; the franchise's standing sponsor
     is a different product, set elsewhere.
     · What it writes: asset-ad-sponsor (a CUSTOMERS reference, named by
       the plan data as adFields.sponsor) on every block of the section
       in this issue. That is the field 206 v1.44 already renders:
       sponsor name, and the sponsor's active banner (Data Worker
       v1.0.28 now looks sponsors up too), else the customer's default
       paid ad. So a sponsor is a customer, not an ad.
     · Which sections: the ones this issue's blocks sit in, as /plan-board
       answers slot.section (the article's section, else the design-json
       cascade, same as 206). One card per section, in issue order,
       fixed 260 x 300.
     · States: no sponsor is a resting state, not a fault. Not ready:
       a cloned sponsor waiting for approval, blocks of one section that
       disagree on their sponsor, a failed save.
     · Cap: IX_CONFIG.sponsorsMax via the plan data (HC-P-RV1-10). No
       cap when it is not set. No number is typed here.
     · Save writes each block through Scenario 124's fill/clear routes
       and reads each back (TOAST-TRUTH). No Make change.

   v1.4 (IPP Build S7, 9 Oct 2026) — ADD AND DELETE BANNER SLOTS
     Jeff, 9 Oct: banner count is variable (8 one week, 14 the next);
     the default layout seeds the usual set and the way you clear a slot
     is to delete it. The Lead is first; the rest are an unordered set
     with no hand-managed positions.
     · "+ Add a banner" tile at the end of the grid. It makes a gold New
       slot, chosen, so the next ad picked lands in it. Cancel drops it.
       What it makes comes from IX_CONFIG.addTypes.ad (HC-P-RV1-8): no
       block type, design or option id is typed here. Without that key
       there is no Add tile and the Banners band says so.
     · "Delete slot" on every saved slot. Gold, "Will be deleted on
       Save", Cancel puts it back. Deleting a cloned slot answers its
       approval. Deleting the Lead makes the next banner the Lead.
     · Save runs create → fill → clear → splash → delete through
       Scenario 124's existing routes, each read back (TOAST-TRUTH).
       A new slot's position is one past the last ad (HC-P-RV1-9),
       named and keyed like the Picker's (HC-P-IPP3-6).

   v1.3.1 (IPP Build S7, 9 Oct 2026) — EMPTY IS NOT A PROBLEM
     Jeff, 9 Oct: banner count is variable; an empty slot is a resting
     state, not a fault, and a slot is cleared by deleting it (as in the
     Picker). So an empty banner slot no longer makes Banners Not ready.
     Only a clone ad awaiting approval or a failed save does. The Lead is
     still first; the rest are an unordered set. (Adding and deleting
     banner slots from Revenue is a separate, agreed next step.)

   v1.3 (IPP Build S7, 9 Oct 2026) — TABS, AND THE TAB SAYS WHAT NEEDS YOU
     Jeff, 9 Oct: the banners are the work (12 to 14 an issue); Splash
     and sponsors are close to once-and-done, and will be filled for him
     once the applications feed them. So they must not sit above the
     banners and make him scroll. This replaces v1.2's one-scroll page.
       · Three tabs: Banners (opens first), Splash, Sponsors. The Lead
         banner stays inside Banners as the large card from v1.2.
       · Each tab carries its own state, so the header shows where the
         work is without opening anything:
             salmon  Not ready   something needs you: an empty banner
                                 slot, an ad copied by Clone and not yet
                                 approved, a save that failed, or no
                                 splash data for the issue
             gold    Unsaved     changes are waiting for Save
             green   Ready       nothing to do
         The tab says only that; the detail is on the tiles inside.
         Splash on the title's house splash is Ready.
       · Removed: the line under the title, the counts row, and the
         salmon "came over from the issue this one was cloned from" bar.
         The Banners tab's Not ready replaces all three.
       · Saving stays independent: Save sends whatever is waiting, on any
         tab, whether or not another tab still needs you.
       · Revenue as a whole is ready only when Banners and Splash are both
         Ready. The title row shows it, and the page tells others:
         IPPRevenue.readiness() answers { ready, banners, splash,
         sponsors }, and the event ipp:revenue-ready fires whenever that
         changes. Publish will read it later to decide whether its button
         is live (Jeff: the interlocks go in at the end, on Publish).
         Nothing here blocks anything yet.
       · Sponsors: the tab is in place and says it is not built. It does
         not count toward ready. Its build waits on two answers (this
         issue only, or the section's standing sponsor; and what a
         sponsor shows).

   v1.2 (IPP Build S7, 9 Oct 2026) — THE HERO ROW
     Jeff, 9 Oct: Splash gets ceremony; Lead gets ceremony too, a notch
     less; banners 2..N stay as they are. One scroll, no tabs.
       · A hero row sits above the banner grid: the Splash card (or one
         per NEWSLETTER) on the left, then the Lead banner card. Both are
         fixed size and taller than a banner tile: Splash 260 x 430 with
         a large portrait picture, Lead 534 x 430 with a wide banner
         picture (two banner columns plus the gap, so it lines up with
         the grid below).
       · Ceremony is in the card's header band, not its border, so the
         border colours keep meaning what they meant (blue chosen, gold
         waiting for Save, salmon needs approval, green saved, red
         failed). Splash: deep teal band. Lead: soft teal band.
       · Below the hero row, a "Banners" label, then Banner 2..N in the
         same fixed 260 x 236 tiles as before.
       · Too narrow for Splash and Lead side by side (under 808 px for
         one Splash): both stack at 534 wide, Splash on a wide dark bed,
         so no hole opens beside the Splash card. Under 534 px: Splash
         260 x 430, Lead 260 x 300.
       · Nothing about picking, the shelf, saving, Cancel or the save bar
         changes. Rotation (several ads per banner slot) and section
         sponsors are separate, later work.

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
       · Banner rotation (Jeff, 9 Oct: next build after the hero row;
         email takes the frozen first pick, the web spins on every
         refresh, no repeats within a slot).
       · Section sponsors (up to four). Needs a scoping note first.

   HARDCODED (provisional ids; the doc chat allocates)
     HC-P-RV1-1  Slot names "Lead banner" / "Banner N": the lead is the
                 lowest-position ad slot. Platform rule from the 7 Oct
                 ruling, not tenant data.
     HC-P-RV1-2  BATCH_URL_CEILING 1800 and BATCH_CHUNK 15, the same
                 values as the Picker (HC-P-IPP3-5).
     HC-P-RV1-3  English copy. Same class as HC-P-PROG-2. (v1.2 adds
                 the hero descriptions and the "Banners" label.)
     HC-P-RV1-5  (v1.1) What a paid splash writes: picture = the ad's
                 splash link, go = its redirect, name = its customer
                 (else the ad name). Closes with D228 / HC-084, when a
                 paid splash becomes an OBLIGATION.
     HC-P-RV1-6  (v1.2) Hero card sizes: Splash 260 x 430 (534 x 430
                 when stacked), Lead 534 x 430 (260 x 300 when narrow). Layout constants in this
                 file and the CSS, not tenant data. (v1.3: Splash
                 has its own tab, so the stacked case no longer occurs.)
     HC-P-RV1-7  (v1.3) What "ready" means: Banners ready = no ad
                 waiting for Clone approval, no failed
                 save, nothing unsaved. Splash ready = splash data read
                 and nothing unsaved or failed; house splash and
                 masthead-only both count. Sponsors do not count until
                 they are built. Platform rule, not tenant data; Publish
                 will gate on it.
   ============================================================ */
(function () {
  'use strict';

  var VERSION = '1.5.3';
  var FILE = 'ipp-revenue-v1.5.3.js';
  var BATCH_URL_CEILING = 1800, BATCH_CHUNK = 15;   // HC-P-RV1-2
  var HOUSE = '__house', NONE = '__none';

  var R = {
    pending: {},      // slotId -> { kind:'pick', adId } | { kind:'remove' } | { kind:'approve' }
    sp: {},           // v1.1 NEWSLETTER id -> { kind:'pick', adId } | { kind:'house' }
    spFails: {},      // v1.1 NEWSLETTER id -> why
    fails: {},        // slotId -> why
    armed: null,      // slotId
    customer: null,   // shelf group key
    query: '',
    saving: false,
    armedOnce: false,
    tab: 'banners',   // v1.3 banners | splash | sponsors
    lastReady: null,  // v1.3 last readiness sent
    adds: [],         // v1.4 [{ key, position, saved }] new banner slots
    seq: 0,           // v1.4
    spon: {},         // v1.5 sectionId -> { kind:'set', custId } | { kind:'clear' } | { kind:'approve' }
    sponFails: {},    // v1.5 sectionId -> why
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
      .sort(function (a, c) { return (Number(a.position) || 0) - (Number(c.position) || 0); })
      .concat(R.adds.map(newSlot));                       // v1.4 new slots last
  }
  // ── v1.4 add and delete ──────────────────────────────────────
  var NEWK = 'new-';
  function isNew(k) { return typeof k === 'string' && k.indexOf(NEWK) === 0; }
  var NEWS = {};
  function newSlot(a) {
    var o = NEWS[a.key] || (NEWS[a.key] = { id: a.key, assetType: 'ad', isNew: true, asset: null, needsAck: false });
    o.position = a.position; return o;
  }
  function addOf(k) { for (var i = 0; i < R.adds.length; i++) if (R.adds[i].key === k) return R.adds[i]; return null; }
  function addType() { var b = board(); return (b && b.addTypes && b.addTypes.ad) || null; }   // HC-P-RV1-8
  function isDel(k) { var p = R.pending[k]; return !!(p && p.kind === 'delete'); }
  function newPosition() {                                   // HC-P-RV1-9
    var b = board(), used = {}, last = 0, maxAll = 0;
    ((b && b.slots) || []).forEach(function (s) {
      var n = Number(s.position) || 0; used[n] = 1; if (n > maxAll) maxAll = n;
      if (s.assetType === 'ad' && n > last) last = n; });
    ((b && b.loose) || []).forEach(function (l) { used[Number(l.position) || 0] = 1; });
    R.adds.forEach(function (a) { used[a.position] = 1; if (a.position > last) last = a.position; });
    var p = Math.floor(last || maxAll) + 1;
    while (used[p]) p++;
    return p;
  }
  function addBanner() {
    if (locked() || R.saving || !addType()) return;
    R.seq++;
    var k = NEWK + Date.now().toString(36) + '-' + R.seq;
    R.adds.push({ key: k, position: newPosition() });
    R.armed = k;
    render();
  }
  // ── v1.5 section sponsors ────────────────────────────────────
  var SEC = 'sec:';
  function isSec(k) { return typeof k === 'string' && k.indexOf(SEC) === 0; }
  function sponField() { var F = fields(); return (F && F.sponsor) || null; }
  function sponsorsMax() { var b = board(); return (b && Number(b.sponsorsMax) > 0) ? Number(b.sponsorsMax) : null; }
  function sections() {
    var b = board(), by = {}, order = [];
    ((b && b.slots) || []).slice().sort(function (x, y) { return (Number(x.position) || 0) - (Number(y.position) || 0); })
      .forEach(function (s) {
        if (s.assetType === 'ad' || !s.section || !s.section.id) return;
        var id = s.section.id;
        if (!by[id]) { by[id] = { id: id, name: s.section.name || 'Section', slots: [] }; order.push(id); }
        by[id].slots.push(s);
      });
    return order.map(function (id) {
      var x = by[id], cur = {}, names = {};
      x.slots.forEach(function (s) { var k = s.sponsor && s.sponsor.id ? s.sponsor.id : ''; cur[k] = (cur[k] || 0) + 1; if (k) names[k] = s.sponsor.name || 'a customer'; });
      var ks = Object.keys(cur);
      x.mixed = ks.length > 1;
      x.current = ks.length === 1 && ks[0] ? ks[0] : null;
      x.counts = cur; x.names = names;
      x.ack = x.slots.some(function (s) { return s.needsAck && s.sponsor && s.sponsor.id; });
      return x;
    });
  }
  function secById(id) { var l = sections(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function sponAfter(x) {
    var p = R.spon[x.id];
    if (p && p.kind === 'set') return { cust: p.custId, ack: false, mixed: false };
    if (p && p.kind === 'clear') return { cust: null, ack: false, mixed: false };
    return { cust: x.current, ack: x.ack && !(p && p.kind === 'approve'), mixed: x.mixed };
  }
  function custName(id) {
    var p = pool(); for (var i = 0; i < p.length; i++) if (p[i].customerId === id) return p[i].customer || 'Customer';
    var l = sections(); for (var j = 0; j < l.length; j++) if (l[j].names[id]) return l[j].names[id];
    return 'Customer';
  }
  function custPic(id) {
    var p = pool(); for (var i = 0; i < p.length; i++) if (p[i].customerId === id && p[i].banner) return p[i].banner;
    return '';
  }
  function sponCustomers() {
    var seen = {}, out = [];
    pool().forEach(function (a) { if (!a.house && a.customerId && !seen[a.customerId]) { seen[a.customerId] = 1; out.push({ id: a.customerId, name: a.customer || 'Customer' }); } });
    return out.sort(function (x, y) { return x.name.localeCompare(y.name); });
  }
  function sponsoredCount(exceptId) {
    return sections().filter(function (x) { return x.id !== exceptId && sponAfter(x).cust; }).length;
  }
  function sponWhere(custId, exceptId) {
    return sections().filter(function (x) { return x.id !== exceptId && sponAfter(x).cust === custId; }).map(function (x) { return x.name; });
  }
  function sponWaiting() { return Object.keys(R.spon).filter(function (k) { return !R.spon[k].saved; }); }
  function sponsorsState() {
    var l = sections(); if (!l.length) return 'ready';
    var needs = l.some(function (x) { var a = sponAfter(x); return a.ack || a.mixed || R.sponFails[x.id]; });
    if (needs) return 'needs';
    return sponWaiting().length ? 'unsaved' : 'ready';
  }
  function placeSponsor(custId) {
    if (locked() || R.saving || !isSec(R.armed)) return;
    var x = secById(R.armed.slice(SEC.length)); if (!x) return;
    var cap = sponsorsMax();
    if (cap && !sponAfter(x).cust && sponsoredCount(x.id) >= cap) { toast('This issue takes at most ' + cap + ' section sponsor' + (cap === 1 ? '' : 's') + '. Remove one first.', 'err'); return; }
    delete R.sponFails[x.id];
    if (x.current === custId && !x.mixed && !x.ack) delete R.spon[x.id];
    else R.spon[x.id] = { kind: 'set', custId: custId };
    render();
  }
  function sponTile(x) {
    var p = R.spon[x.id], a = sponAfter(x), lk = locked(), key = SEC + x.id;
    var cls = ['ipp-rv-tile', 'is-sponsor'];
    if (R.armed === key) cls.push('is-armed');
    if (p && !p.saved) cls.push('is-pending');
    if (p && p.saved) cls.push('is-saved');
    if (a.ack || a.mixed) cls.push('is-ack');
    if (!a.cust) cls.push('is-empty');
    if (R.sponFails[x.id]) cls.push('is-fail');
    var pic = a.cust ? custPic(a.cust) : '';
    var n = x.slots.length;
    var note;
    if (R.sponFails[x.id]) note = '<span class="bad">Not saved: ' + esc(R.sponFails[x.id]) + '</span>';
    else if (p && p.saved) note = '<span class="ok">Saved</span>';
    else if (p && p.kind === 'set') {
      var dup = sponWhere(p.custId, x.id);
      note = '<span class="gold">' + (dup.length ? 'New sponsor, also on ' + esc(dup.join(', ')) : 'New sponsor, waiting for Save') + '</span>';
    }
    else if (p && p.kind === 'clear') note = '<span class="gold">Sponsor removed on Save</span>';
    else if (p && p.kind === 'approve') note = '<span class="gold">Approved, waiting for Save</span>';
    else if (a.mixed) note = '<span class="ack">Blocks disagree: ' + esc(Object.keys(x.counts).map(function (k) {
        return (k ? x.names[k] : 'none') + ' on ' + x.counts[k]; }).join(', ')) + '. Pick one to set them all.</span>';
    else if (a.ack) note = '<span class="ack">Copied by Clone. Needs approval.</span>';
    else if (a.cust) note = '<span class="dim">Sponsors this section in this issue</span>';
    else note = R.armed === key && !lk ? '<span class="dim">Pick a sponsor on the shelf</span>' : '<span class="dim">No sponsor</span>';
    var acts = '';
    if (!lk && !R.saving) {
      var pp = p && p.saved ? null : p;
      if (a.ack && !pp) acts += '<button type="button" class="ix-btn ix-btn--secondary ipp-rv-approve" data-rv-sponapprove="' + esc(x.id) + '">Approve</button>';
      if ((a.cust || a.mixed) && !(pp && pp.kind === 'clear')) acts += '<button type="button" class="ix-revert" data-rv-sponclear="' + esc(x.id) + '">Remove sponsor</button>';
      if (pp) acts += '<button type="button" class="ix-revert ipp-rv-cancel" data-rv-sponcancel="' + esc(x.id) + '">Cancel</button>';
    }
    return '<div class="' + cls.join(' ') + '" data-rv-sec="' + esc(x.id) + '"' + (lk ? '' : ' tabindex="0" role="button"') + ' title="' + esc(x.name) + '">' +
      tileHead(x.name, n + ' block' + (n === 1 ? '' : 's') + ' in this issue', R.armed === key) +
      '<div class="ipp-rv-thumb">' + (pic ? '<img src="' + esc(pic) + '" alt="" loading="lazy">'
        : '<span>' + (a.cust ? 'No banner picture' : 'No sponsor') + '</span>') + '</div>' +
      '<div class="ipp-rv-who">' + esc(a.cust ? custName(a.cust) : '\u00a0') + '</div>' +
      '<div class="ipp-rv-what">' + esc(a.cust ? 'Section sponsor' : '\u00a0') + '</div>' +
      '<div class="ipp-rv-note">' + note + '</div>' +
      '<div class="ipp-rv-acts">' + acts + '</div></div>';
  }
  function sponShelfList() {
    var cs = sponCustomers();
    if (!cs.length) return '<div class="ipp-rv-empty">No customer has an ad for this title yet, so there is no one to offer as a sponsor.</div>';
    var q = R.query.trim().toLowerCase();
    if (q) cs = cs.filter(function (c) { return c.name.toLowerCase().indexOf(q) >= 0; });
    if (!cs.length) return '<div class="ipp-rv-empty">Nothing matches \u201c' + esc(R.query) + '\u201d.</div>';
    var armedId = isSec(R.armed) ? R.armed.slice(SEC.length) : null;
    return cs.map(function (c) {
      var pic = custPic(c.id), w = sponWhere(c.id, armedId);
      return '<button type="button" class="ipp-rv-ad ipp-rv-spcust" data-rv-spon="' + esc(c.id) + '"' + (armedId ? '' : ' disabled') + '>' +
        '<span class="ipp-rv-ad-pic">' + (pic ? '<img src="' + esc(pic) + '" alt="" loading="lazy">' : '<span>No banner picture</span>') + '</span>' +
        '<span class="ipp-rv-ad-text"><span class="n">' + esc(c.name) + '</span><span class="m">Customer</span>' +
        (w.length ? '<em>Sponsoring ' + esc(w.join(', ')) + '</em>' : '') + '</span></button>';
    }).join('');
  }
  function sponBody() {
    var l = sections();
    if (!sponField()) return '<div class="ipp-rv-msg is-err">The plan data does not name the sponsor field (adFields.sponsor). The Data Worker must be v1.0.28 or later.</div>';
    if (!l.length) return '<div class="ipp-rv-soon"><p class="ipp-rv-soon-title">No block in this issue has a section yet.</p>' +
      '<p>A block\u2019s section comes from its article, or from the title\u2019s design settings. Sponsors attach to sections.</p></div>';
    var cap = sponsorsMax(), live = sections().filter(function (x) { return sponAfter(x).cust; }).length;
    return '<div class="ipp-rv-body"><section class="ipp-rv-slots"><div class="ipp-rv-band"><span>Section sponsors</span><b>' + live + (cap ? ' of ' + cap : '') + '</b>' +
      '<span class="ipp-rv-band-note">This issue only</span></div>' +
      '<div class="ipp-rv-grid is-sponsors">' + l.map(sponTile).join('') + '</div></section>' + shelf() + '</div>';
  }

  function dropAdd(k) {
    R.adds = R.adds.filter(function (a) { return a.key !== k; });
    delete NEWS[k]; delete R.pending[k]; delete R.fails[k];
    if (R.armed === k) R.armed = nextEmpty(null);
  }
  function slotById(id) { var l = adSlots(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function slotName(s) {                                   // HC-P-RV1-1
    var l = adSlots(), i = l.indexOf(s);
    return i === 0 ? 'Lead banner' : 'Banner ' + (i + 1);
  }

  // ── v1.1 splash access ───────────────────────────────────────
  var SP = 'sp:';
  function spBoard() { var b = board(); return (b && b.splash) || null; }
  function spList() { var s = spBoard(); return s && Array.isArray(s.newsletters) ? s.newsletters : []; }
  function isSp(k) { return typeof k === 'string' && k.indexOf(SP) === 0; }
  function spById(id) { var l = spList(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function spOfKey(k) { return isSp(k) ? spById(k.slice(SP.length)) : null; }
  function spName(n) { return spList().length > 1 ? 'Splash \u00b7 ' + (n.name || 'issue') : 'Splash'; }
  function houseSp() { var s = spBoard(); return (s && s.house) || null; }
  function adBySplash(img) {
    if (!img) return null;
    var p = pool(); for (var i = 0; i < p.length; i++) if (p[i].splash === img && !p[i].house) return p[i];
    return null;
  }
  // What a Splash tile will show after Save.
  function spAfter(n) {
    var p = R.sp[n.id], h = houseSp();
    if (p && p.kind === 'pick') { var a = adById(p.adId); return { mode: 'paid', ad: a, image: a ? a.splash : null, name: a ? (a.customer || a.name) : '' }; }
    if (p && p.kind === 'house') return h ? { mode: 'house', ad: null, image: h.image, name: h.name } : { mode: 'none' };
    var c = n.current || {};
    if (n.source === 'paid') return { mode: 'paid', ad: adBySplash(c.image), image: c.image, name: c.name || '' };
    return h ? { mode: 'house', ad: null, image: h.image, name: h.name } : { mode: 'none' };
  }
  function spWaiting() { return spList().map(function (n) { return n.id; }).filter(function (id) { return R.sp[id] && !R.sp[id].saved; }); }
  function mode() { return isSp(R.armed) ? 'splash' : 'banner'; }
  function picOf(a, m) { return m === 'splash' ? a.splash : a.banner; }
  // The shelf for the Splash tile: ads with a splash picture, and of
  // the house ads only the one the splash page would use.
  function poolFor(m) {
    if (m !== 'splash') return pool();
    var h = houseSp();
    return pool().filter(function (a) { return !!a.splash && (!a.house || (h && h.id === a.id)); });
  }

  // What the slot will hold after Save.
  function after(s) {
    var p = R.pending[s.id];
    if (p && p.kind === 'pick') return { adId: p.adId, ack: false };
    if (p && p.kind === 'remove') return { adId: null, ack: false };
    if (p && p.kind === 'delete') return { adId: s.asset && s.asset.id ? s.asset.id : null, ack: false, del: true };   // v1.4
    var id = s.asset && s.asset.id ? s.asset.id : null;
    return { adId: id, ack: !!s.needsAck && !(p && p.kind === 'approve') };
  }
  function isEmptyAfter(s) { return !after(s).adId; }
  function whereAd(adId, exceptSlot) {
    var out = [];
    adSlots().forEach(function (s) { if (s.id !== exceptSlot && !isDel(s.id) && after(s).adId === adId) out.push(slotName(s)); });
    spList().forEach(function (n) {                          // v1.1
      if (SP + n.id === exceptSlot) return;
      var x = spAfter(n);
      if (x.mode === 'paid' && x.ad && x.ad.id === adId) out.push(spName(n));
      if (x.mode === 'house' && houseSp() && houseSp().id === adId) out.push(spName(n));
    });
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
             'Splash is the first tile. Choose it and the shelf shows only ads with a splash picture. ' +
             '\u201cUse house splash\u201d puts the issue back on the title\u2019s own splash.\n\n' +
             'The order of the slots is set on Layout. Sold space (OBLIGATIONS) comes later.',
      scenarios: [{ name: '124 \u00b7 PubPlan Block Writer', note: 'fill and clear for banners; splash (v2.18) for the Splash' }],
      companions: 'ipp-revenue-v1.1.css \u00b7 ix-issue-data v1.0.27 /plan-board adPool, splash'
    });
  }

  // ── shelf groups ─────────────────────────────────────────────
  function groupKey(a) { return a.house ? HOUSE : (a.customerId || NONE); }
  function groups() {
    var order = [], by = {};
    poolFor(mode()).forEach(function (a) {
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
    c.classList.add('ipp-rv-host');                   // v1.5.1: the canvas holds still; slots and shelf scroll
    var oldSlots = c.querySelector('.ipp-rv-slots'), keepSlots = oldSlots ? oldSlots.scrollTop : 0;
    var keep = c.scrollTop;
    var shelfList = c.querySelector('.ipp-rv-shelf-list'), keepShelf = shelfList ? shelfList.scrollTop : 0;
    var b = board();
    var head = function (pill) {
      return '<div class="ipp-rv-head"><p class="ipp-rv-kicker">Ads for this issue</p>' +
        '<div class="ipp-rv-titlerow"><h2 class="ipp-rv-title">Revenue</h2>' + info() + (pill || '') + '</div></div>';
    };
    if (!b) {
      var err = window.IPP && IPP.board ? IPP.board.error() : '';
      c.innerHTML = '<div class="ipp-rv">' + head() + '<div class="ipp-rv-msg' + (err ? ' is-err' : '') + '">' +
        esc(err ? 'Can\u2019t read this plan: ' + err : 'Reading this plan\u2026') + '</div></div>';
      return;
    }
    if (!fields()) {
      c.innerHTML = '<div class="ipp-rv">' + head() + '<div class="ipp-rv-msg is-err">The plan data has no ad fields ' +
        '(adFields). The Data Worker must be v1.0.25 or later.</div></div>';
      return;
    }
    var slots = adSlots();
    prune(slots);
    if (!R.armedOnce && !locked()) { R.armedOnce = true; R.armed = nextEmpty(null); }
    if (R.armed && !(isSp(R.armed) ? spOfKey(R.armed) : isSec(R.armed) ? secById(R.armed.slice(SEC.length)) : slotById(R.armed))) R.armed = null;
    Object.keys(R.spon).forEach(function (k) { if (!secById(k)) { delete R.spon[k]; delete R.sponFails[k]; } });   // v1.5
    var sps = spList();
    var rd = readiness();

    var notes = locked() ? '<div class="ipp-rv-msg">This plan is locked. Its ads are shown, and nothing can change.</div>' : '';
    var body;
    if (R.tab === 'splash') {
      var spTiles = spBoard() ? (sps.length ? sps.map(spTile).join('') : spBlank()) : spBlank();   // v1.1
      body = '<div class="ipp-rv-body"><section class="ipp-rv-slots"><div class="ipp-rv-hero is-splashes">' + spTiles + '</div></section>' + shelf() + '</div>';
    } else if (R.tab === 'sponsors') {
      body = sponBody();                                       // v1.5
    } else {
      // v1.2 Lead card, then Banner 2..N
      var rest = slots.slice(1), at = addType(), canAdd = !!at && !locked();
      var addT = canAdd ? '<button type="button" class="ipp-rv-addtile" data-rv-add="1"' + (R.saving ? ' disabled' : '') + '>' +
        '<span class="ipp-rv-add-circle">+</span><span class="ipp-rv-add-lbl">Add a banner</span></button>' : '';
      var noAdd = !at && !locked() ? '<span class="ipp-rv-band-note">Adding banners needs IX_CONFIG.addTypes.ad</span>' : '';
      var grid = (slots.length ? '<div class="ipp-rv-hero">' + tile(slots[0], true) + '</div>' : '') +
        ((rest.length || addT || noAdd) ? '<div class="ipp-rv-band"><span>Banners</span><b>' + rest.length + '</b>' + noAdd + '</div>' +
          '<div class="ipp-rv-grid">' + rest.map(function (s) { return tile(s, false); }).join('') + addT + '</div>' : '') +
        (slots.length || addT ? '' : '<div class="ipp-rv-msg">This plan has no banner slots.</div>');
      body = '<div class="ipp-rv-body"><section class="ipp-rv-slots">' + grid + '</section>' + shelf() + '</div>';
    }

    c.innerHTML = '<div class="ipp-rv">' + head() + notes + tabs(rd) + body + savebar() + '</div>';
    c.scrollTop = keep;
    var ns = c.querySelector('.ipp-rv-slots'); if (ns) ns.scrollTop = keepSlots;   // v1.5.1
    var nl = c.querySelector('.ipp-rv-shelf-list'); if (nl) nl.scrollTop = keepShelf;
    var si = c.querySelector('.ipp-rv-search'); if (si) si.value = R.query;
    fit();
    announce(rd);
  }

  // ── v1.3 tabs and readiness ──────────────────────────────────
  // Each tab is 'needs' (salmon, Not ready), 'unsaved' (gold) or 'ready'
  // (green). HC-P-RV1-7 says what counts.
  var TABS = [
    { key: 'banners', label: 'Banners' },
    { key: 'splash', label: 'Splash' },
    { key: 'sponsors', label: 'Sponsors' }];
  function bannersState() {
    var l = adSlots(); if (!l.length) return 'ready';
    // v1.3.1 an empty banner slot is NOT a problem: banner count is
    // variable (8 one week, 14 the next), an empty slot runs a house ad,
    // and the way you clear a slot is to delete it (on Layout). Only a
    // clone ad awaiting approval or a failed save is Not ready.
    var needs = l.some(function (s) { return after(s).ack || R.fails[s.id]; });
    if (needs) return 'needs';
    return waiting().length ? 'unsaved' : 'ready';
  }
  function splashState() {
    var s = spBoard(), l = spList();
    if (!s || s.error || !l.length) return 'needs';
    if (Object.keys(R.spFails).length) return 'needs';
    return spWaiting().length ? 'unsaved' : 'ready';
  }
  function readiness() {
    var bs = bannersState(), ss = splashState(), ps = sponsorsState();   // v1.5 sponsors count
    return { ready: bs === 'ready' && ss === 'ready' && ps === 'ready', banners: bs, splash: ss, sponsors: ps };
  }
  var MARK = { needs: 'Not ready', unsaved: 'Unsaved', ready: 'Ready' };
  function mark(st) {
    if (!MARK[st]) return '<span class="ipp-rv-mark is-soon">Not built</span>';
    return '<span class="ipp-rv-mark is-' + st + '">' + (st === 'ready' ? '\u2713 ' : '') + MARK[st] + '</span>';
  }
  function tabs(rd) {
    return '<div class="ipp-rv-tabs" role="tablist">' + TABS.map(function (t) {
      var on = R.tab === t.key;
      return '<button type="button" class="ix-tab-pill ipp-rv-tab' + (on ? ' is-active' : '') + '" role="tab" aria-selected="' + on + '"' +
        ' data-rv-tab="' + t.key + '"><span class="ipp-rv-tab-name">' + t.label + '</span>' + (rd[t.key] === 'needs' ? '<span class="ipp-rv-dot" title="Needs attention" aria-label="Needs attention"></span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function readyPill(rd) {
    return '<span class="ipp-rv-ready ' + (rd.ready ? 'is-ready' : 'is-not') + '">' +
      (rd.ready ? '\u2713 Revenue ready' : 'Revenue not ready') + '</span>';
  }
  function announce(rd) {
    var k = JSON.stringify(rd);
    if (k === R.lastReady) return;
    R.lastReady = k;
    document.dispatchEvent(new CustomEvent('ipp:revenue-ready', { detail: rd }));
  }
  function openTab(key) {
    if (R.tab === key) return;
    R.tab = key; R.customer = null; R.query = '';
    if (!locked()) {
      if (key === 'splash') { var l = spList(); R.armed = (isSp(R.armed) && spOfKey(R.armed)) ? R.armed : (l.length ? SP + l[0].id : null); }
      else if (key === 'banners') { if (!R.armed || isSp(R.armed)) R.armed = nextEmpty(null); }
      else if (key === 'sponsors') {                            // v1.5
        var ls = sections(), f = ls.filter(function (x) { return !sponAfter(x).cust; })[0] || ls[0];
        R.armed = f ? SEC + f.id : null;
      }
      else R.armed = null;
    }
    render();
  }

  // The slots column is exactly as wide as the tiles it holds, so the
  // shelf sits right beside them and no gap opens between the two.
  // Tiles keep their fixed size; only the number per row changes.
  var TILE_W = 260, TILE_GAP = 14, SHELF_W = 360, BODY_GAP = 24;
  var LEAD_W = 534;                                   // HC-P-RV1-6 two banner columns + gap
  function fit() {
    var c = canvas(); if (!c) return;
    var body = c.querySelector('.ipp-rv-body'), sec = c.querySelector('.ipp-rv-slots'), grid = c.querySelector('.ipp-rv-grid');
    if (!body || !sec) return;
    var w = body.clientWidth; if (!w) return;
    var stacked = w < TILE_W + BODY_GAP + SHELF_W + 12;   // v1.5.1: stack only when one tile column can't fit beside the shelf
    body.classList.toggle('is-stacked', stacked);
    var avail = stacked ? w : w - SHELF_W - BODY_GAP - 12;   // v1.5.1: 12 = the slots column's scrollbar room
    var step = TILE_W + TILE_GAP;
    var nFit = Math.max(1, Math.floor((avail + TILE_GAP) / step));
    var width;
    if (R.tab === 'sponsors') {                                 // v1.5 sponsor cards only
      var sgrid = c.querySelector('.ipp-rv-grid'), nS = Math.max(1, sections().length);
      var nn = Math.min(nFit, nS);
      if (sgrid) sgrid.style.gridTemplateColumns = 'repeat(' + nn + ', ' + TILE_W + 'px)';
      sec.style.width = '';   // v1.5.1: the slots column fills; the shelf is pinned right
      return;
    }
    if (R.tab === 'splash') {                                   // v1.3 Splash cards only
      var spN = Math.max(1, spList().length);
      width = Math.min(nFit, spN) * step - TILE_GAP;
      sec.style.width = '';
      return;
    }
    var slots = adSlots(), gridN = Math.max(0, slots.length - 1) + (addType() && !locked() ? 1 : 0);   // v1.4 Add tile
    var leadW = slots.length ? LEAD_W : 0;
    width = Math.max(Math.min(nFit, Math.max(gridN, 1)) * step - TILE_GAP, Math.min(nFit * step - TILE_GAP, leadW));
    var n = Math.max(1, Math.min(Math.floor((width + TILE_GAP) / step), Math.max(gridN, 1)));
    if (grid) grid.style.gridTemplateColumns = 'repeat(' + n + ', ' + TILE_W + 'px)';
    sec.style.width = '';
    var hero = c.querySelector('.ipp-rv-hero');
    if (hero) hero.classList.toggle('is-narrow', (stacked ? avail : width) < LEAD_W);   // Lead 260 wide
  }

  function tile(s, hero) {
    var p = R.pending[s.id], a = after(s), lk = locked();
    var shownAd = a.adId ? (adById(a.adId) || (s.asset && s.asset.id === a.adId ? s.asset : null)) : null;
    var pic = shownAd ? (shownAd.banner || shownAd.thumb || '') : '';
    var who = shownAd ? (shownAd.customer || (shownAd.house ? 'House ad' : '')) : '';
    var what = shownAd ? (shownAd.name || '') : '';
    var cls = ['ipp-rv-tile'];
    if (hero) cls.push('is-hero', 'is-lead');            // v1.2
    if (R.armed === s.id) cls.push('is-armed');
    if (p && !p.saved) cls.push('is-pending');
    if (p && p.saved) cls.push('is-saved');
    if (a.ack) cls.push('is-ack');
    if (!a.adId) cls.push('is-empty');
    if (R.fails[s.id]) cls.push('is-fail');
    if (p && p.kind === 'remove') cls.push('is-removing');
    if (s.isNew) cls.push('is-new', 'is-pending');                       // v1.4
    if (a.del) cls.push('is-deleting');

    var note = '', acts = '';
    if (R.fails[s.id]) note = '<span class="bad">Not saved: ' + esc(R.fails[s.id]) + '</span>';
    else if (p && p.saved || (s.isNew && (addOf(s.id) || {}).saved)) note = '<span class="ok">Saved</span>';
    else if (a.del) note = '<span class="gold">Will be deleted on Save</span>';                    // v1.4
    else if (s.isNew && !(p && p.kind === 'pick')) note = '<span class="gold">New slot, waiting for Save</span>';
    else if (s.isNew) note = '<span class="gold">New slot and ad, waiting for Save</span>';
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
      if (s.isNew) {                                                      // v1.4
        if (!(addOf(s.id) || {}).saved) acts += '<button type="button" class="ix-revert ipp-rv-cancel" data-rv-cancel="' + esc(s.id) + '">Cancel</button>';
      } else {
        if (a.ack && !p) acts += '<button type="button" class="ix-btn ix-btn--secondary ipp-rv-approve" data-rv-approve="' + esc(s.id) + '">Approve</button>';
        if (a.adId && !(p && (p.kind === 'remove' || p.kind === 'delete'))) acts += '<button type="button" class="ix-revert" data-rv-remove="' + esc(s.id) + '">Remove</button>';
        if (!(p && p.kind === 'delete')) acts += '<button type="button" class="ix-revert ipp-rv-del" data-rv-del="' + esc(s.id) + '">Delete slot</button>';
        if (p) acts += '<button type="button" class="ix-revert ipp-rv-cancel" data-rv-cancel="' + esc(s.id) + '">Cancel</button>';
      }
    }
    return '<div class="' + cls.join(' ') + '" data-rv-slot="' + esc(s.id) + '"' + (lk ? '' : ' tabindex="0" role="button"') +
      ' title="' + esc(slotName(s) + (what ? ': ' + what : '')) + '">' +
      tileHead(slotName(s) + (s.isNew ? ' \u00b7 New' : ''), hero ? 'First banner in the issue' : '', R.armed === s.id) +
      '<div class="ipp-rv-thumb">' + (pic ? '<img src="' + esc(pic) + '" alt="" loading="lazy">'
        : '<span>' + (a.adId ? 'No banner picture' : 'Empty slot') + '</span>') + '</div>' +
      '<div class="ipp-rv-who">' + esc(who || '\u00a0') + '</div>' +
      '<div class="ipp-rv-what">' + esc(what || '\u00a0') + '</div>' +
      '<div class="ipp-rv-note">' + note + '</div>' +
      '<div class="ipp-rv-acts">' + acts + '</div></div>';
  }

  // v1.2 tile header: a hero card adds a one-line description.
  function tileHead(name, desc, chosen) {
    return '<div class="ipp-rv-tile-head"><span class="ipp-rv-headtext"><span class="ipp-rv-slotname">' + esc(name) + '</span>' +
      (desc ? '<span class="ipp-rv-desc">' + esc(desc) + '</span>' : '') + '</span>' +
      (chosen ? '<span class="ipp-rv-chosen">Chosen</span>' : '') + '</div>';
  }

  // ── v1.1 the Splash tile ─────────────────────────────────────
  function spWord(x) { return x.mode === 'paid' ? (x.name || 'paid') : x.mode === 'house' ? 'house' : 'none'; }
  function spBlank() {
    var s = spBoard();
    var why = !s ? 'Needs Data Worker v1.0.27' : s.error ? 'Can\u2019t read: ' + s.error : 'No NEWSLETTER for this plan yet';
    return '<div class="ipp-rv-tile is-hero is-splash is-empty is-blank" title="' + esc(why) + '">' +
      tileHead('Splash', 'The issue\u2019s opening ad', false) +
      '<div class="ipp-rv-thumb"><span>No splash</span></div>' +
      '<div class="ipp-rv-who">\u00a0</div><div class="ipp-rv-what">\u00a0</div>' +
      '<div class="ipp-rv-note"><span class="' + (s && s.error ? 'bad' : 'dim') + '">' + esc(why) + '</span></div>' +
      '<div class="ipp-rv-acts"></div></div>';
  }
  function spTile(n) {
    var key = SP + n.id, p = R.sp[n.id], x = spAfter(n), lk = locked(), h = houseSp();
    var cls = ['ipp-rv-tile', 'is-hero', 'is-splash'];
    if (R.armed === key) cls.push('is-armed');
    if (p && !p.saved) cls.push('is-pending');
    if (p && p.saved) cls.push('is-saved');
    if (x.mode === 'none') cls.push('is-empty');
    if (R.spFails[n.id]) cls.push('is-fail');
    var who = x.mode === 'paid' ? (x.ad ? (x.ad.customer || x.name) : (x.name || 'Paid splash'))
      : x.mode === 'house' ? 'House splash' : '';
    var what = x.mode === 'paid' ? (x.ad ? x.ad.name : 'Not an ad in ADS') : x.mode === 'house' ? x.name : '';
    var note;
    if (R.spFails[n.id]) note = '<span class="bad">Not saved: ' + esc(R.spFails[n.id]) + '</span>';
    else if (p && p.saved) note = '<span class="ok">Saved</span>';
    else if (p && p.kind === 'pick') note = '<span class="gold">New splash' + (x.ad && !x.ad.redirect ? ' (no link)' : '') + ', waiting for Save</span>';
    else if (p && p.kind === 'house') note = '<span class="gold">House splash on Save</span>';
    else if (x.mode === 'paid') note = '<span class="dim">Paid splash for this issue</span>';
    else if (x.mode === 'house') note = '<span class="dim">The title\u2019s house splash</span>';
    else note = R.armed === key && !lk ? '<span class="dim">Pick a splash ad on the shelf</span>' : '<span class="dim">Masthead only</span>';
    var acts = '';
    if (!lk && !R.saving) {
      if (p && p.saved) p = null;
      if (!p && n.source === 'paid' && h) acts += '<button type="button" class="ix-revert" data-rv-sphouse="' + esc(n.id) + '">Use house splash</button>';
      if (p) acts += '<button type="button" class="ix-revert ipp-rv-cancel" data-rv-spcancel="' + esc(n.id) + '">Cancel</button>';
    }
    return '<div class="' + cls.join(' ') + '" data-rv-slot="' + esc(key) + '"' + (lk ? '' : ' tabindex="0" role="button"') +
      ' title="' + esc(spName(n) + (what ? ': ' + what : '')) + '">' +
      tileHead(spName(n), 'The issue\u2019s opening ad', R.armed === key) +
      '<div class="ipp-rv-thumb">' + (x.image ? '<img src="' + esc(x.image) + '" alt="" loading="lazy">' : '<span>No splash picture</span>') + '</div>' +
      '<div class="ipp-rv-who">' + esc(who || '\u00a0') + '</div>' +
      '<div class="ipp-rv-what">' + esc(what || '\u00a0') + '</div>' +
      '<div class="ipp-rv-note">' + note + '</div>' +
      '<div class="ipp-rv-acts">' + acts + '</div></div>';
  }

  function shelf() {
    var lk = locked(), armed = R.armed ? (isSp(R.armed) ? spOfKey(R.armed) : isSec(R.armed) ? secById(R.armed.slice(SEC.length)) : slotById(R.armed)) : null;
    var top = lk ? 'Locked: nothing can be placed.'
      : armed ? 'Placing into <b>' + esc(isSp(R.armed) ? spName(armed) : isSec(R.armed) ? armed.name : slotName(armed)) + '</b>'
      : (R.tab === 'splash' ? 'Click the Splash card, then an ad.' : R.tab === 'sponsors' ? 'Click a section, then a sponsor.' : 'Click a banner slot, then an ad.');
    if (R.tab === 'sponsors') {                                 // v1.5 a sponsor is a customer
      return '<aside class="ipp-rv-shelf"><div class="ipp-rv-shelf-head"><span class="ipp-rv-shelf-title">Sponsors</span>' +
        '<span class="ipp-rv-shelf-target">' + top + '</span></div>' +
        '<input type="search" class="ipp-rv-search" placeholder="Find a customer" aria-label="Find a customer">' +
        '<div class="ipp-rv-shelf-list">' + sponShelfList() + '</div></aside>';
    }
    return '<aside class="ipp-rv-shelf"><div class="ipp-rv-shelf-head"><span class="ipp-rv-shelf-title">Ad shelf</span>' +
      '<span class="ipp-rv-shelf-target">' + top + '</span></div>' +
      '<input type="search" class="ipp-rv-search" placeholder="Find a customer or an ad" aria-label="Find a customer or an ad">' +
      '<div class="ipp-rv-shelf-list">' + shelfList() + '</div></aside>';
  }

  function shelfList() {
    var gs = groups();
    if (!pool().length) return '<div class="ipp-rv-empty">No ads in ADS name this title yet.</div>';
    if (mode() === 'splash' && !poolFor('splash').length) return '<div class="ipp-rv-empty">No ad for this title has a splash picture yet.</div>';
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
    var m = mode(), pic = picOf(a, m), miss = m === 'splash' ? 'No splash picture' : 'No banner picture';
    var lk = locked(), where = whereAd(a.id, null), can = !lk && !!pic && !!R.armed && !R.saving;
    var why = !pic ? miss : (!R.armed && !lk ? 'Choose a slot first' : '');
    return '<button type="button" class="ipp-rv-ad' + (m === 'splash' ? ' is-splash' : '') + (can ? '' : ' is-off') + '" data-rv-ad="' + esc(a.id) + '"' +
      (can ? '' : ' aria-disabled="true"') + ' title="' + esc(a.name) + '">' +
      '<span class="ipp-rv-ad-pic">' + (pic ? '<img src="' + esc(pic) + '" alt="" loading="lazy">' : '<span>' + miss + '</span>') + '</span>' +
      '<span class="ipp-rv-ad-text">' +
        (showWho ? '<span class="w">' + esc(a.customer || (a.house ? 'House ad' : 'No customer set')) + '</span>' : '') +
        '<span class="n">' + esc(a.name) + '</span>' +
        '<span class="m">' + esc([a.status, a.house ? (a.houseKind ? 'House \u00b7 ' + a.houseKind : 'House') : a.type].filter(Boolean).join(' \u00b7 ')) +
        (where.length ? '<em>In ' + esc(where.join(', ')) + '</em>' : '') +
        (why && !pic ? '<em class="off">' + esc(why) + '</em>' : '') + '</span>' +
      '</span></button>';
  }

  function savebar() {
    var keys = waiting(), spk = spWaiting(), sok = sponWaiting();
    if (!keys.length && !spk.length && !sok.length && !R.saving) return '';
    var spParts = spk.map(function (id) {                      // v1.1
      var n = spById(id), p = R.sp[id], a = p.kind === 'pick' ? adById(p.adId) : null;
      return spName(n) + ': ' + (p.kind === 'pick' ? (a ? a.name : 'new ad') : 'house splash');
    });
    var parts = keys.map(function (k) {
      var s = slotById(k), p = R.pending[k]; if (!s) return '';
      var a = p && p.kind === 'pick' ? adById(p.adId) : null;
      if (s.isNew) return slotName(s) + ': new slot' + (a ? ', ' + a.name : '');                 // v1.4
      return slotName(s) + ': ' + (p.kind === 'pick' ? (a ? a.name : 'new ad') : p.kind === 'remove' ? 'empty' : p.kind === 'delete' ? 'delete slot' : 'approve');
    }).filter(Boolean);
    var soParts = sok.map(function (id) {                     // v1.5
      var x = secById(id), p = R.spon[id]; if (!x) return '';
      return x.name + ': ' + (p.kind === 'set' ? custName(p.custId) : p.kind === 'clear' ? 'no sponsor' : 'approve sponsor');
    }).filter(Boolean);
    parts = spParts.concat(parts, soParts);
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
    var ks = Object.keys(R.pending).filter(function (k) { return !R.pending[k].saved && !isNew(k); });
    R.adds.forEach(function (a) { if (!a.saved) ks.push(a.key); });   // v1.4 a new slot is a change with or without an ad
    return ks
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
    // v1.1 splash: drop picks for NEWSLETTERs gone, and picks that are no change
    var nls = {}; spList().forEach(function (n) { nls[n.id] = n; });
    Object.keys(R.sp).forEach(function (id) {
      var n = nls[id], p = R.sp[id];
      if (!n) { delete R.sp[id]; delete R.spFails[id]; return; }
      if (p.saved) return;
      var a = p.kind === 'pick' ? adById(p.adId) : null;
      if (p.kind === 'pick' && n.source === 'paid' && a && (n.current || {}).image === a.splash) delete R.sp[id];
      if (p.kind === 'house' && n.source !== 'paid') delete R.sp[id];
    });
    Object.keys(R.spFails).forEach(function (id) { if (!nls[id]) delete R.spFails[id]; });
  }
  function nextEmpty(fromId) {
    var l = adSlots(), start = 0;
    if (fromId) { for (var i = 0; i < l.length; i++) if (l[i].id === fromId) { start = i + 1; break; } }
    for (var j = 0; j < l.length; j++) {
      var s = l[(start + j) % l.length];
      if (s.id !== fromId && !isDel(s.id) && isEmptyAfter(s)) return s.id;
    }
    return null;
  }
  function place(adId) {
    if (locked() || R.saving || !R.armed) return;
    if (isSp(R.armed)) { placeSplash(adId); return; }      // v1.1
    var a = adById(adId); if (!a || !a.banner) return;
    var s = slotById(R.armed); if (!s || isDel(s.id)) return;
    delete R.fails[s.id];
    if (s.asset && s.asset.id === adId && !s.needsAck) delete R.pending[s.id];
    else R.pending[s.id] = { kind: 'pick', adId: adId };
    R.armed = nextEmpty(s.id);
    render();
  }

  // v1.1 — a splash pick. The title's house splash means "clear".
  function placeSplash(adId) {
    var n = spOfKey(R.armed), a = adById(adId); if (!n || !a || !a.splash) return;
    var h = houseSp();
    delete R.spFails[n.id];
    if (a.house) {
      if (!h || h.id !== a.id) return;
      if (n.source === 'paid') R.sp[n.id] = { kind: 'house' }; else delete R.sp[n.id];
    } else if (n.source === 'paid' && (n.current || {}).image === a.splash) delete R.sp[n.id];
    else R.sp[n.id] = { kind: 'pick', adId: adId };
    render();                                   // v1.3 the Splash card stays chosen
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
      return items.map(function (it, i) { var res = resultFor(results, i);
        return { slotId: it.slotId, why: it.check ? it.check(res) : verdict(res, it.want), res: res }; });
    }, function (e) {
      var why = (e && e.message) || 'the request failed';
      return items.map(function (it) { return { slotId: it.slotId, why: why }; });
    });
  }

  function save() {
    if (R.saving) return;
    var keys = waiting(), spk = spWaiting(), sok = sponWaiting(); if (!keys.length && !spk.length && !sok.length) return;
    if (locked()) { toast('Can\u2019t save: this plan is locked. Nothing was sent.', 'err'); return; }
    var url = blockWriter();
    if (!url) { toast('Can\u2019t save: this page has no PP_WEBHOOKS.blockWriter address (Scenario 124). Nothing was sent.', 'err'); return; }
    var F = fields(), b0 = board();
    if (keys.length && (!F || !F.ad || !F.approval)) { toast('Can\u2019t save: the plan data does not name the ad fields (Data Worker v1.0.25). Nothing was sent.', 'err'); return; }
    var SF = (spBoard() || {}).fields;
    if (spk.length && (!SF || !SF.image || !SF.go || !SF.name)) { toast('Can\u2019t save: the plan data does not name the splash fields (Data Worker v1.0.27). Nothing was sent.', 'err'); return; }
    // v1.1 — one splash write per NEWSLETTER, built here so Make types no field name.
    var spItems = spk.map(function (id) {
      var p = R.sp[id], a = p.kind === 'pick' ? adById(p.adId) : null, fd = {};
      fd[SF.image] = a ? a.splash : null;
      fd[SF.go] = a ? (a.redirect || null) : null;
      fd[SF.name] = a ? (a.customer || a.name || null) : null;      // HC-P-RV1-5
      return { slotId: SP + id, op: { id: id, fImage: SF.image, body: JSON.stringify({ fieldData: fd }) }, want: a ? a.splash : '' };
    });

    var fills = [], clears = [], creates = [], dels = [], names = {}, preFail = {};
    // v1.4 new slots, from what the plan data says an Add makes (HC-P-RV1-8)
    var at = addType(), wi = (b0 && b0.writeIds) || { assetType: {}, blockType: {} }, plan = (b0 && b0.plan) || {};
    keys.forEach(function (k) {
      var s = slotById(k), p = R.pending[k]; if (!s) return;
      names[k] = slotName(s);
      if (s.isNew) {
        var ath = (wi.assetType || {}).ad, bth = at && at.blockType ? (wi.blockType || {})[at.blockType] : '';
        if (!at) { preFail[k] = 'the plan data names no Add type for banners (IX_CONFIG.addTypes.ad)'; return; }
        if (!ath) { preFail[k] = 'no option id for asset type \u201cad\u201d (plan data writeIds)'; return; }
        if (at.blockType && !bth) { preFail[k] = 'no option id for block type \u201c' + at.blockType + '\u201d'; return; }
        var pos = s.position, sk = 'slot-' + pos, pk = p && p.kind === 'pick';
        creates.push({ slotId: k, want: pk ? p.adId : sk, op: {                       // HC-P-IPP3-6 naming
          pubplanId: plan.id, blockName: (plan.name || 'Plan') + '-b' + pos, slotKey: sk, position: pos,
          planningNote: '', showAsSponsored: false, blockTypeHash: bth, assetTypeHash: ath,
          assetField: pk ? F.ad : 'slot-key', assetId: pk ? p.adId : sk, designId: at.designId || '' } });
        return;
      }
      if (p.kind === 'delete') {
        dels.push({ slotId: k, op: { id: k }, check: function (res) {
          if (!res) return 'no result came back';
          return res.deleted === true ? '' : (res.err || 'the row was not deleted'); } });
        return;
      }
      if (p.kind === 'pick') fills.push({ slotId: k, op: { id: k, assetField: F.ad, assetId: p.adId }, want: p.adId });
      if (p.kind === 'remove') clears.push({ slotId: k, op: { id: k, assetField: F.ad }, want: '' });
      if (s.needsAck) clears.push({ slotId: k, op: { id: k, assetField: F.approval }, want: '' });
    });
    spk.forEach(function (id) { var n = spById(id); names[SP + id] = n ? spName(n) : 'Splash'; });
    // v1.5 sponsors: one write per block of the section
    var SPF = sponField();
    if (sok.length && (!SPF || !F || !F.approval)) { toast('Can\u2019t save: the plan data does not name the sponsor field (Data Worker v1.0.28). Nothing was sent.', 'err'); return; }
    sok.forEach(function (id) {
      var x = secById(id), p = R.spon[id], k = SEC + id; if (!x) return;
      names[k] = x.name + ' sponsor';
      x.slots.forEach(function (s) {
        var cur = s.sponsor && s.sponsor.id ? s.sponsor.id : '';
        if (p.kind === 'set' && cur !== p.custId) fills.push({ slotId: k, op: { id: s.id, assetField: SPF, assetId: p.custId }, want: p.custId });
        if (p.kind === 'clear' && cur) clears.push({ slotId: k, op: { id: s.id, assetField: SPF }, want: '' });
        if (s.needsAck && s.sponsor && s.sponsor.id) clears.push({ slotId: k, op: { id: s.id, assetField: F.approval }, want: '' });
      });
    });
    R.saving = true; R.fails = {}; R.spFails = {}; R.sponFails = {}; render();

    var failed = {}, notes = [];
    Object.keys(preFail).forEach(function (k) { failed[k] = preFail[k]; });
    stage(url, 'create', creates).then(function (r0) {          // v1.4
      r0.forEach(function (x) { if (x.why) failed[x.slotId] = x.why; });
      return stage(url, 'fill', fills);
    }).then(function (r1) {
      r1.forEach(function (x) { if (x.why) failed[x.slotId] = x.why; });
      // do not clear approval on a slot whose new ad did not land
      var cl = clears.filter(function (c) { return !failed[c.slotId]; });
      return stage(url, 'clear', cl);
    }).then(function (r2) {
      r2.forEach(function (x) { if (x.why && !failed[x.slotId]) failed[x.slotId] = x.why; });
      return stage(url, 'splash', spItems);                    // v1.1
    }).then(function (r3) {
      r3.forEach(function (x) { if (x.why) failed[x.slotId] = x.why; });
      return stage(url, 'delete', dels);                       // v1.4 last
    }).then(function (r4) {
      r4.forEach(function (x) {
        if (x.why) failed[x.slotId] = x.why;
        else if (x.res && x.res.liveRemoved === false) notes.push(names[x.slotId] + ': the published copy was not removed');
      });
    }, function (e) {
      keys.forEach(function (k) { if (!failed[k]) failed[k] = (e && e.message) || 'the request failed'; });
      spk.forEach(function (id) { if (!failed[SP + id]) failed[SP + id] = (e && e.message) || 'the request failed'; });
      sok.forEach(function (id) { if (!failed[SEC + id]) failed[SEC + id] = (e && e.message) || 'the request failed'; });
    }).then(function () {
      var okN = 0;
      keys.forEach(function (k) {
        if (failed[k]) { R.fails[k] = failed[k]; return; }
        okN++;
        if (isNew(k)) { var ad = addOf(k); if (ad) ad.saved = true; if (R.pending[k]) R.pending[k].saved = true; }
        else R.pending[k].saved = true;
      });
      sok.forEach(function (id) {                                // v1.5
        if (failed[SEC + id]) R.sponFails[id] = failed[SEC + id];
        else if (R.spon[id]) { R.spon[id].saved = true; okN++; }
      });
      spk.forEach(function (id) {
        if (failed[SP + id]) R.spFails[id] = failed[SP + id];
        else { R.sp[id].saved = true; okN++; refreshSplash(id); }
      });
      R.saving = false;
      var badN = Object.keys(failed).length;
      if (!badN) toast('Saved ' + okN + ' ad change' + (okN === 1 ? '' : 's') + '.' + (notes.length ? ' ' + notes.join('; ') + '.' : ''), notes.length ? 'info' : 'ok');
      else toast(badN + ' ad change' + (badN === 1 ? '' : 's') + ' not saved: ' +
        Object.keys(failed).map(function (k) { return names[k] + ' (' + failed[k] + ')'; }).join('; ') +
        (okN ? '. ' + okN + ' saved.' : '.'), 'err');
      render();
      if (window.IPP && IPP.board) IPP.board.load({ fresh: true }).catch(function () { render(); });
    });
  }

  // v1.1 — refill the Worker's splash cache, so the splash page shows the
  // change now rather than after the cache time. Best effort: the save
  // already read back; a failure here only delays the splash page.
  function refreshSplash(id) {
    var n = spById(id); if (!n || !n.resolver) return;
    fetch(n.resolver + (n.resolver.indexOf('?') < 0 ? '?' : '&') + 'fresh=1', { method: 'GET', credentials: 'omit' })
      .catch(function () { console.warn('[IPP] Revenue: splash cache refresh failed for ' + id); });
  }

  // ── events (one delegated set on the canvas) ─────────────────
  function wire(c) {
    c.addEventListener('click', function (e) {
      var t = e.target;
      var el;
      if ((el = t.closest('[data-rv-tab]'))) { openTab(el.getAttribute('data-rv-tab')); return; }
      if ((el = t.closest('[data-rv-save]'))) { save(); return; }
      if ((el = t.closest('[data-rv-cancel-all]'))) {
        waiting().forEach(function (k) { if (isNew(k)) dropAdd(k); else delete R.pending[k]; }); R.fails = {};
        spWaiting().forEach(function (id) { delete R.sp[id]; }); R.spFails = {};
        sponWaiting().forEach(function (id) { delete R.spon[id]; }); R.sponFails = {};   // v1.5
        render(); return;
      }
      if (R.saving) return;
      if ((el = t.closest('[data-rv-cancel]'))) { var k = el.getAttribute('data-rv-cancel');
        if (isNew(k)) dropAdd(k); else { delete R.pending[k]; delete R.fails[k]; } render(); return; }
      if ((el = t.closest('[data-rv-add]'))) { addBanner(); return; }
      // v1.5 sponsors
      if ((el = t.closest('[data-rv-sponcancel]'))) { var sk2 = el.getAttribute('data-rv-sponcancel'); delete R.spon[sk2]; delete R.sponFails[sk2]; render(); return; }
      if ((el = t.closest('[data-rv-sponclear]'))) { if (!locked()) { var ck = el.getAttribute('data-rv-sponclear'); R.spon[ck] = { kind: 'clear' }; delete R.sponFails[ck]; render(); } return; }
      if ((el = t.closest('[data-rv-sponapprove]'))) { if (!locked()) { R.spon[el.getAttribute('data-rv-sponapprove')] = { kind: 'approve' }; render(); } return; }
      if ((el = t.closest('[data-rv-spon]'))) { placeSponsor(el.getAttribute('data-rv-spon')); return; }
      if ((el = t.closest('[data-rv-sec]'))) { if (!locked()) { R.armed = SEC + el.getAttribute('data-rv-sec'); render(); } return; }                                        // v1.4
      if ((el = t.closest('[data-rv-del]'))) { if (!locked()) { var dk = el.getAttribute('data-rv-del');      // v1.4
        R.pending[dk] = { kind: 'delete' }; delete R.fails[dk]; if (R.armed === dk) R.armed = nextEmpty(dk); render(); } return; }
      if ((el = t.closest('[data-rv-spcancel]'))) { var sc = el.getAttribute('data-rv-spcancel'); delete R.sp[sc]; delete R.spFails[sc]; render(); return; }
      if ((el = t.closest('[data-rv-sphouse]'))) { if (!locked()) { R.sp[el.getAttribute('data-rv-sphouse')] = { kind: 'house' }; render(); } return; }
      if ((el = t.closest('[data-rv-approve]'))) { if (!locked()) { R.pending[el.getAttribute('data-rv-approve')] = { kind: 'approve' }; render(); } return; }
      if ((el = t.closest('[data-rv-remove]'))) {
        if (!locked()) { var rk = el.getAttribute('data-rv-remove'), rs = slotById(rk);
          if (rs && rs.isNew) delete R.pending[rk];                                   // v1.4 just the pick
          else if (rs && rs.asset && rs.asset.id) R.pending[rk] = { kind: 'remove' }; else delete R.pending[rk];
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
      var el = e.target.closest && e.target.closest('[data-rv-slot],[data-rv-sec]');
      if (el && e.target === el && !locked() && !R.saving) { e.preventDefault();
        R.armed = el.hasAttribute('data-rv-sec') ? SEC + el.getAttribute('data-rv-sec') : el.getAttribute('data-rv-slot'); render(); }
    });
    c.addEventListener('input', function (e) {
      if (!e.target.classList.contains('ipp-rv-search')) return;
      R.query = e.target.value || '';
      var l = c.querySelector('.ipp-rv-shelf-list'); if (l) { l.innerHTML = R.tab === 'sponsors' ? sponShelfList() : shelfList(); l.scrollTop = 0; }
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
    if (e && e.detail && e.detail.ok) {
      Object.keys(R.pending).forEach(function (k) { if (R.pending[k].saved) delete R.pending[k]; });
      Object.keys(R.sp).forEach(function (k) { if (R.sp[k].saved) delete R.sp[k]; });
      R.adds.filter(function (a) { return a.saved; }).forEach(function (a) { dropAdd(a.key); });   // v1.4
      Object.keys(R.spon).forEach(function (k) { if (R.spon[k].saved) delete R.spon[k]; });    // v1.5
    }
    if (canvas() && canvas().getAttribute('data-revenue-mounted') === '1') render();
  });
  document.addEventListener('ipp:view', function (e) {
    if (!e || !e.detail || e.detail.view !== 'revenue') return;
    if (!mount()) return;
    render();
  });
  document.addEventListener('ipp:ready', mount);
  if (window.IPP && canvas()) mount();
  window.IPPRevenue = { version: VERSION, render: render, state: R, readiness: readiness, openTab: openTab, addBanner: addBanner };
})();
