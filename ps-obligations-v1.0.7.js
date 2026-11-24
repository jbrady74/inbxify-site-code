// ps-obligations-v1.0.7.js
// ============================================================
// INBXIFY · Publisher Portal · the Obligations tab
//
// v1.0.7 (24 Nov 2026, Publisher Portal S14) — SECTIONS, TWO FILTERS, THE SALE FORM ON ix-forms, DEEP LINKS.
//   Rulings (Jeff, 24 Nov, S13 rulings 1 to 5; S14 answers 2 to 7):
//   · THE TABLE IS ix-table v1.1.0, in four sections, top to bottom: Needs you, Running now, Starting later, Ended (Ended
//     starts collapsed). Each header shows its count and a chevron at the far right; an empty section is not drawn. Which
//     section a sale sits in is ix-sales' answer (GET /sales section, v1.3.16); this page works out nothing. A sale from an
//     older ix-sales with no section goes in Running now.
//   · The Status column goes, and so do the filter pills (All, Active, Needs you, Comp, Ended). Comp stays as the Type tag.
//     Two filters, in ix-table's filter row: Customer, and Magazines when the publisher has two or more magazines (a sale on
//     three magazines passes each one's filter). With one magazine there is nothing to choose, so there is no filter.
//   · DEEP LINKS (the ps-ads pattern, ?customer=…#ads): ?title=<TITLES-ADMIN id>#obligations opens the tab filtered to that
//     magazine; ?sale=<sales record id or name>#obligations opens that sale, its section opened, scrolled to it.
//   · THE SALE FORM IS ix-forms v1.0.0: four equal columns, every row from the left edge, Portal labels.
//       Row 1  Customer · Product · Type · Magazine (two or more magazines: the fourth cell stays empty and the tick list is
//              the full-width row under it, then the Where cards and Sends per town)
//       Row 2  Franchise · On the website (a franchise sponsor only)
//       Row 3  When · Start month · Edition sends · Week
//              Window: When · Start month · Window ends · Edition sends, and Week starts row 4
//              Specific months: When · Edition sends (the count), then the month grid as a full-width row
//     The save bar: what is being edited and "N fields changed" on the left; Reset, Cancel, Save on the right. Reset puts
//     back the saved sale when editing, or empties a new one, and keeps the form open; greyed while 0 fields changed.
//     Cancel closes. Each changed field keeps its small "cancel" at the right end of its label.
//   Needs ix-sales v1.3.16, ix-table v1.1.0 (+ CSS), ix-forms v1.0.0 (+ CSS) and ix-tokens-portal-look v1.0.1 on the page.
//   CSS ps-obligations-v1.0.5.css (the old table, filter pills and form grid rules removed).
//   HARDCODING: HC-P-PP14-4 the query names title and sale; HC-P-PP14-5 the table's column weights.
//
// v1.0.6 (23 Nov 2026, Publisher Portal S11 · Build 2) — ON THE WEBSITE, FOR A FRANCHISE SPONSOR.
//   Jeff ruled 23 Nov: a sponsor sale is counted in sends like any other sale, and how long the sponsor shows on
//   the website is a separate choice on the sale. The form shows "On the website" under Franchise when the
//   product is a franchise sponsor: Whole run (the default, the sponsor shows on the franchise's pages for the
//   whole run) or Weeks in an issue (only while an issue carries the sponsor). It is sent as onWebsite on
//   POST /sales and PATCH /sales/<id>. Needs ix-sales v1.3.14 and the SALES RECORDS Option field on-the-website.
//   An edited pick gets the gold border and is named in the edit window like every other field.
//   CSS unchanged: ps-obligations-v1.0.3.css.
//   HARDCODING: HC-P-PP11-4 the two choice words (they must match the SALES RECORDS option labels).
//
// v1.0.5 (4 Nov 2026, Publisher Portal S4) — A MISSED SEND STAYS OWED
//   AFTER A SALE ENDS (Jeff ruled 4 Nov: 1b). Live test 6: cancelling
//   SR-0002 cancelled its January make good, so the missed December send
//   is owed again. That is correct: Remaining counts it, the board shows
//   red, and its tile keeps Make good. Two changes follow from the rule:
//   · Needs you now includes an Ended record that still owes a missed
//     send. Due and behind pace still count only on Active records.
//   · The cancel box says how many missed sends will still be owed after
//     the record ends, and that Make good stays available on it.
//   CSS unchanged: ps-obligations-v1.0.3.css.
//
// v1.0.4 (4 Nov 2026, Publisher Portal S4) — A CANCEL ON EVERY MONTH.
//   Live test 4: an extra send added by mistake (Aug '27 W3, W4) could
//   only be undone with the whole Months cancel. Now each month whose
//   sends differ from what the record had gets a gold border and its own
//   small "cancel" link, which puts back just that month (its tick, its
//   weeks and its extra sends). Unchanged ticked months keep the blue
//   border, so gold shows at a glance exactly which months Save will
//   change. Standing rule: a small cancel wherever an edit starts.
//   CSS v1.0.3.
//
// v1.0.3 (4 Nov 2026, Publisher Portal S4) — OPEN RECORD FIX. On the live
//   page an opened row (SR-0002) collapsed into a few spaced letters and
//   "Cancel remaining sends" wrapped onto three lines over the next row.
//   The site has its own rules for the generic class names this tab used
//   (open, sub, red, on, r), the same hazard as on T-A. Every state class
//   is now namespaced: ps-ob-row, ps-ob-open, ps-ob-sub, ps-ob-red,
//   ps-ob-on. The two record buttons never wrap. CSS v1.0.2.
//
// v1.0.2 (4 Nov 2026, Publisher Portal S4) — while the first read is out,
//   grey placeholder rows hold the table's place (ctx.placeholder from
//   ps-shell v1.0.1) instead of the "Loading obligations…" line. Progress
//   itself is the shell's loading bar. CSS stays ps-obligations-v1.0.1.css.
//   Needs ps-shell-v1.0.1.js; on v1.0.0 it falls back to the old line.
//
// v1.0.1 (4 Nov 2026, Publisher Portal S4) — RUNS ON A RECORD WITH NO LIVE
//   SENDS. ix-sales answers runTo null when every send is cancelled (an
//   ended record). Runs read "05/01/26 to" with nothing after. Now the
//   start month closes the run too: "05/01/26 to 05/31/26". CSS v1.0.1.
//
// v1.0.0 (4 Nov 2026, Publisher Portal S4) — FIRST BUILD, from portal
//   mockup v0.18 and Sales-Records-Obligations-Scoping v0.7 (§5A, §9, §10).
//
// WHAT IT SHOWS
//   One table of the publisher's sales records. Filters All, Active,
//   Needs you, Comp, Ended, plus a customer select. Columns per §10. A
//   record opens to three layers: the green board (one circle per send
//   sold), the Obligations box (every send, month order, no truncation)
//   and By magazine (records on two or more magazines only). Footer:
//   Edit sales record, Cancel remaining sends. A missed send with no live
//   make good offers Make good in a month from this month on.
//
// THE FORM (new and edit, inline at the top; table and filters hide)
//   Customer, Product (Franchise when the product is a sponsor band),
//   Type, Titles (two or more magazines only), Where cards (two or more
//   ticked), sends per magazine (Split), When (frequency), Start month,
//   Window ends, Edition sends, Week. Specific months is a calendar grid:
//   ticking a month shows week chips (Any, 1, 2, 3, 4); + adds another
//   send in that month; Monthly, Every other month and Quarterly fill the
//   grid. The page writes months like ["2027-05 W1","2027-05 W3","2027-06"].
//   One title ticked: no Where question (ix-sales stores Single).
//
// WHAT THE PAGE DOES NOT DO
//   It computes no rule. Qty, Remaining, the board counts, Behind pace,
//   each send's state, make-good links and No creative all come from
//   ix-sales (GET /sales and GET /obligations). Choices (frequencies,
//   weeks, types), products, customers, franchises and titles come from
//   ix-sales too. Refusals (400, 403, 405, 409) show ix-sales' own words.
//
// EDITING RULES (standing)
//   · A pick stays shown while other fields are edited; every field with
//     a pending change wears the ix gold, so it is clear what Save writes.
//   · Each changed field gets a small "cancel" link (ix-revert) that puts
//     it back; the form's Cancel at the bottom puts everything back.
//   · A state ix-sales would refuse is refused at the click: a second
//     magazine cannot be ticked for a franchise sponsor; the customer and
//     product are locked while a send is placed in an edition.
//   · Progress on every call (ix-progress, named with ixLabel); the Save
//     button shows Saving… Re-drawing keeps the window where it was.
//   · TOAST-TRUTH: ix-sales checks every field Webflow echoed and answers
//     the ones that did not in `unconfirmed`. Success is shown only when
//     that list is empty AND the re-read lists the record; otherwise the
//     toast names what was not confirmed and the form stays open.
//
// HARDCODING (provisional ids, for the tracker)
//   HC-P-PP4-4  W and TIPS: the tab's words and help text (copy).
//   HC-P-PP4-5  GRID_MONTHS 24: how far ahead the month grid and the start
//               month list reach. MG_MONTHS 12 for the make-good picker.
//   HC-P-PP4-6  FILL: the three grid shortcuts and their month counts
//               (Monthly 12, Every other month 6, Quarterly 4), the same
//               run lengths ix-sales uses (HC-S-5).
//   HC-P-PP4-7  By magazine collapses at 5 or more magazines (HC-P-SR-11).
//   HC-P-PP4-8  The labels this page branches on: frequency 'Specific
//               months' and 'Window', placement 'Single' / 'Mirrored' /
//               'Split' / 'Pool', slot shape 'sponsor band', week 'Any
//               week'. They are the option labels ix-sales answers.
// ============================================================
(function () {
  'use strict';
  var VERSION = '1.0.7';
  var WEBS = ['Whole run', 'Weeks in an issue'];                      // v1.0.6 · HC-P-PP11-4
  var FILE = 'ps-obligations-v' + VERSION + '.js';
  var GRID_MONTHS = 24, MG_MONTHS = 12;                                // HC-P-PP4-5
  var COLLAPSE_AT = 5;                                                 // HC-P-PP4-7
  var FILL = [['Monthly', 1, 12], ['Every other month', 2, 6], ['Quarterly', 3, 4]];   // HC-P-PP4-6
  var L = { specific: 'Specific months', window: 'Window', once: 'One time',            // HC-P-PP4-8
            single: 'Single', mirrored: 'Mirrored', split: 'Split', pool: 'Pool', sponsor: 'sponsor band', any: 'Any week' };
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var W = {                                                            // HC-P-PP4-4
    title: 'Obligations', add: '+ Sales record',
    loading: 'Loading obligations…', none: 'No sales records yet. Use + Sales record to add the first.',
    noMatch: 'No sales records match these filters.', noIxTable: 'ix-table v1.1.0 is not on this page, so the sales cannot be listed.',
    noIxForm: 'ix-forms v1.0.0 is not on this page, so the form cannot open.',
    note: 'One tile per send sold. A send is one newsletter edition. A one-time sale is a record with one tile.',
    newH: 'New sales record', newHint: 'One sales record per product. Saving makes its obligations.',
    editH: 'Editing {name}', editHint: 'This sale is live. Saving replaces its open sends; sends that are placed, ran or missed keep their place.',
    save: 'Save and make obligations', saveEdit: 'Save', saving: 'Saving…', cancel: 'Cancel', fieldCancel: 'cancel',
    needs: 'Still needs {list}',
    loadFail: 'The obligations could not be loaded: {msg}', listsFail: 'The form could not load its lists: {msg}',
    lockCust: 'A send is placed in an edition, so the customer and product cannot change. Unplace it in the Revenue Picker, or cancel this record and start a new one.',
    sponsorOne: 'A franchise sponsor runs on one magazine.',
    noFranchise: 'No franchise runs on this magazine yet.',
    webRun: 'Shown on the franchise\u2019s pages for the whole run.',
    webIssue: 'Shown on the site only in weeks an issue carries the sponsor.',
    whereQ: 'How should the sends be shared across these {k} towns?',
    where: [['Mirrored', 'Every ticked town gets every send'], ['Split', 'You say how many go to each town'], ['Pool', 'Any of the ticked towns']],
    fillFrom: 'Fill from', gridHint: 'Tick a month for a send. Pick a week if it matters; + adds another send in that month.',
    ackEditH: 'Save changes to {name}?', ackCancelH: 'Cancel the remaining sends on {name}?', mgH: 'Make good for {name}',
    ackBox: 'I have checked the changes.', ackCancelBox: 'I understand.', keep: 'Keep the sale', cancelSends: 'Cancel remaining sends',
    saveChanges: 'Save changes', addMg: 'Add replacement', mgMonth: 'Month for the replacement',
    savedNew: '{name} saved. {n} send{s} made.', savedEdit: '{name} saved.', cancelled: '{name} ended. {n} send{s} cancelled.',
    mgDone: 'Make good {name} added for {month}.',
    unconfirmed: '{name}: Webflow did not confirm {fields}. Check the record before relying on it.',
    notListed: '{name} was saved but does not show in the list yet. Reload the page in a minute.'
  };
  var TIPS = {                                                         // HC-P-PP4-4
    'Qty': 'Edition sends sold on this record. One send is one newsletter edition.',
    'Remaining': 'Sends not yet run, including a missed send that has no make good yet.',
    'Board': 'Every send on the record. Green ran, striped green planned, salmon due now, red missed, grey still to come.',
    'Week': 'Leave as Any unless the customer needs a particular week of the month.',
    'Type': 'Paid, or Comp for a free placement. Comp still needs a customer.',
    'Edition sends': 'One send is one newsletter edition going to its readers. A 12-send sale runs in 12 editions.',
    'Placement': 'How the sends are shared across your magazines.',
    'Runs': 'From the first day of the first month to the last day of the last month. Sends are booked by month.'
  };

  var ctx, el, S;

  // ── small helpers ───────────────────────────────────────────
  function esc(s) { return ctx.esc(s); }
  function fill(t, o) { return String(t).replace(/\{(\w+)\}/g, function (_, k) { return o[k] == null ? '' : o[k]; }); }
  function plural(n) { return n === 1 ? '' : 's'; }
  function nowYm() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function addM(ym, n) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1 + n; return (y + Math.floor(m / 12)) + '-' + String(((m % 12) + 12) % 12 + 1).padStart(2, '0'); }
  function monS(ym) { return ym ? MON[+ym.slice(5, 7) - 1] + ' \u2019' + ym.slice(2, 4) : ''; }
  function monL(ym) { return ym ? MON[+ym.slice(5, 7) - 1] + ' ' + ym.slice(0, 4) : ''; }
  function mmddyy(ym, end) {
    if (!/^\d{4}-\d{2}/.test(ym || '')) return '';
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7), d = end ? new Date(y, m, 0).getDate() : 1;
    return String(m).padStart(2, '0') + '/' + String(d).padStart(2, '0') + '/' + String(y).slice(-2);
  }
  function entMonth(e) { return String(e).slice(0, 7); }
  function entWeek(e) { var m = / W([1-4])$/.exec(String(e)); return m ? m[1] : ''; }
  function sortEnt(a) { return a.slice().sort(); }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function tip(w, right) { return TIPS[w] ? ctx.tip(w, TIPS[w], right) : esc(w); }
  function multiPub() { return S.titles.length > 1; }
  function titleName(id) { var t = S.titles.find(function (x) { return x.id === id; }); return t ? t.name : ''; }
  function obsOf(id) { return S.obs.filter(function (o) { return o.salesId === id; }); }
  function sale(id) { return S.sales.find(function (r) { return r.id === id; }); }
  function saleByRef(x) { return S.sales.find(function (r) { return r.id === x || String(r.name).toLowerCase() === String(x).toLowerCase(); }); }
  function chev(open, cls) { return '<svg class="' + (cls || '') + (open ? ' up' : '') + '" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'; }
  function sel(attrs, opts, val, ph, changed, disabled) {
    return '<span class="ps-sel"><select class="ix-picker-input' + (changed ? ' ix-picker-input--changed' : '') + '" ' + attrs + (disabled ? ' disabled' : '') + '>' +
      (ph != null ? '<option value="">' + esc(ph) + '</option>' : '') +
      opts.map(function (o) { var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o;
        return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') +
      '</select></span>';
  }

  // ── data ────────────────────────────────────────────────────
  async function load(keepOpen) {
    var p = encodeURIComponent(ctx.publisher.id);
    var rs = await Promise.all([
      ctx.api('/sales?publisher=' + p, { label: 'Loading sales records' }),
      ctx.api('/obligations?publisher=' + p, { label: 'Loading obligations' }),
      S.titles.length ? Promise.resolve(null) : ctx.api('/titles?publisher=' + p, { label: 'Loading magazines' })
    ]);
    var bad = rs.find(function (r) { return r && !r.ok; });
    if (bad) { S.loadErr = (bad.json && bad.json.error) || ('HTTP ' + bad.status); S.loaded = true; return false; }
    S.sales = rs[0].json.sales || [];
    if (Array.isArray(rs[0].json.sections) && rs[0].json.sections.length) S.sections = rs[0].json.sections;   // v1.0.7
    S.obs = rs[1].json.obligations || [];
    if (rs[2]) S.titles = rs[2].json.titles || [];
    S.loadErr = '';
    S.loaded = true;
    if (!keepOpen) S.open = null;
    return true;
  }
  async function loadLists() {
    if (S.lists) return true;
    var p = encodeURIComponent(ctx.publisher.id);
    var rs = await Promise.all([
      ctx.api('/products?publisher=' + p, { label: 'Loading products' }),
      ctx.api('/customers?publisher=' + p, { label: 'Loading customers' }),
      ctx.api('/franchises?publisher=' + p, { label: 'Loading franchises' }),
      ctx.api('/options', { label: 'Loading form choices' })
    ]);
    var bad = rs.find(function (r) { return !r.ok; });
    if (bad) { S.listsErr = (bad.json && bad.json.error) || ('HTTP ' + bad.status); return false; }
    S.lists = { products: rs[0].json.products || [], customers: rs[1].json.customers || [], franchises: rs[2].json.franchises || [],
      frequencies: rs[3].json.frequencies || [], weeks: rs[3].json.weeks || [], types: rs[3].json.types || [] };
    S.listsErr = '';
    return true;
  }

  // ── rows (v1.0.7: ix-table v1.1.0 in ix-sales' sections) ──
  var SECTIONS_FALLBACK = [{ key: 'needs', label: 'Needs you' }, { key: 'running', label: 'Running now' }, { key: 'later', label: 'Starting later' }, { key: 'ended', label: 'Ended' }];
  function productLabel(r) { return r.franchise ? r.franchise + ' sponsor' : (r.product || ''); }
  function weekLabel(r) {
    if (r.frequency === L.specific && (r.months || []).some(function (e) { return entWeek(e); })) return 'Per send';
    return !r.week || r.week === L.any ? 'Any' : r.week.replace('Week ', 'W');
  }
  function miniBoard(r) {
    var b = r.board || {}, k = ['ran', 'planned', 'due', 'missed', 'toCome'];
    var seg = k.filter(function (x) { return b[x]; }).map(function (x) { return '<i class="mb mb-' + x + '" style="flex:' + b[x] + '"></i>'; }).join('');
    return '<span class="mbar" title="' + (b.ran || 0) + ' ran, ' + (b.planned || 0) + ' planned, ' + (b.due || 0) + ' due now, ' + (b.missed || 0) + ' missed, ' + (b.toCome || 0) + ' to come">' + seg + '</span>';
  }
  function magNames(r) { return (r.titles || []).map(function (t) { return t.name || titleName(t.id); }).filter(Boolean); }
  function columns() {                                                   // HC-P-PP14-5 the weights
    var m = multiPub();
    var c = [
      { key: 'name', label: 'ID', w: 84, type: 'id' },
      { key: 'customer', label: 'Customer', w: m ? 200 : 210, type: 'strong', filter: true, sortable: true, text: function (r) { return r.customer || ''; } },
      { key: 'product', label: 'Product', w: m ? 140 : 190, type: 'html', text: productLabel, title: productLabel,
        html: function (r) { var nc = obsOf(r.id).some(function (o) { return o.noCreative; }); return esc(productLabel(r)) + (nc ? '<span class="flag">No creative</span>' : ''); } },
      { key: 'type', label: 'Type', w: 84, type: 'html', text: function (r) { return r.type || ''; }, html: function (r) { return r.type === 'Comp' ? IxTable.pill('comp', 'Comp') : esc(r.type || ''); } }
    ];
    if (m) c.push(
      { key: 'mags', label: 'Magazines', w: 160, type: 'text', filter: true, values: magNames,
        text: function (r) { var n = magNames(r); return n.length === 1 ? n[0] : n.length + ' magazines'; }, title: function (r) { return magNames(r).join(', '); } },
      { key: 'placement', label: 'Placement', w: 80, type: 'text', text: function (r) { return r.placement === L.mirrored ? 'Each town' : (r.placement || ''); } });
    c.push(
      { key: 'runs', label: 'Runs', w: m ? 156 : 140, type: 'date', text: function (r) { return mmddyy(r.runFrom || r.startMonth) + ' to ' + mmddyy(r.runTo || r.runFrom || r.startMonth, true); }, sortValue: function (r) { return String(r.runFrom || r.startMonth || ''); }, sortable: true },
      { key: 'frequency', label: 'Frequency', w: m ? 96 : 116, type: 'text', text: function (r) { return r.frequency || ''; } },
      { key: 'qty', label: 'Qty', w: 44, type: 'number', text: function (r) { return String(r.qty || 0); } },
      { key: 'remaining', label: 'Remaining', w: m ? 86 : 100, type: 'html', align: 'right', text: function (r) { return String(r.remaining || 0); },
        html: function (r) { return (r.remaining || 0) + (r.missedOwed ? ' <span class="due">(' + r.missedOwed + ' missed)</span>' : ''); } });
    if (!m) c.push({ key: 'week', label: 'Week', w: 70, type: 'text', text: weekLabel });
    c.push({ key: 'board', label: 'Board', w: m ? 104 : 130, type: 'html', html: miniBoard, title: function () { return ''; } });
    c.forEach(function (x) { if (TIPS[x.label]) x.tip = TIPS[x.label]; });
    return c;
  }
  function sectionOf(r) { return r.section || 'running'; }
  // the table draws into its own mount; its filters, open row and sections are kept when the page draws again
  function drawTable() {
    var mt = el.querySelector('#ps-ob-table'); if (!mt) return;
    if (!window.IxTable || typeof IxTable.create !== 'function') { mt.innerHTML = '<div class="ps-err" role="alert">' + esc(W.noIxTable) + '</div>'; return; }
    var st = S.tState || {};
    var secs = (S.sections || SECTIONS_FALLBACK).map(function (x) { return { key: x.key, label: x.label, collapsed: x.key === 'ended' }; });   // Ended starts collapsed
    S.table = IxTable.create(mt, {
      id: 'ps-obligations', noun: ['sales record', 'sales records'], zebra: false, minWidth: 1080,
      columns: columns(), rows: S.sales, rowId: function (r) { return r.id; },
      sections: secs, section: sectionOf, sort: { key: 'customer', dir: 'asc' },
      state: { filters: st.filters || {}, open: S.open ? [S.open] : [], collapsed: st.collapsed },
      expand: function (r) { return '<div class="ps-ob">' + panel(r) + '</div>'; },
      onOpen: function (rid, now) { S.open = now ? rid : null; },
      words: { empty: W.none, noMatch: W.noMatch }
    });
    S.tState = S.table.state();
  }
  // v1.0.7 deep links: ?title=<TITLES-ADMIN id> filters the magazine; ?sale=<id or name> opens the sale (HC-P-PP14-4)
  function applyDeepLink() {
    if (S.deepDone || !S.table) return;
    S.deepDone = true;
    var q; try { q = new URLSearchParams(location.search); } catch (e) { return; }
    var t = q.get('title'), sl = q.get('sale');
    if (t && multiPub()) { var nm = titleName(t); if (nm) S.table.setFilter('mags', nm); }
    if (sl) { var r = saleByRef(sl); if (r) { S.open = r.id; S.table.reveal(r.id); } }
    S.tState = S.table.state();
  }

  // ── an open record ──────────────────────────────────────────
  function tile(o, showWhere) {
    var cls, l2, act = '', mg = o.makeGoodOf ? '<i class="mgtag">Make good</i>' : '';
    if (o.status === 'Missed') {
      if (o.madeGoodBy) { cls = 'madegood'; l2 = 'Missed, made good'; }
      else { cls = 'missed'; l2 = 'Missed'; act = '<button type="button" class="ps-link" data-mg="' + o.id + '">Make good</button>'; }
    } else if (o.status === 'Cancelled') { cls = 'cancelled'; l2 = 'Cancelled'; }
    else if (o.state === 'ran') { cls = 'ran'; l2 = 'Ran' + (o.edition ? ' \u00b7 ' + esc(o.edition) : ''); }
    else if (o.state === 'planned') { cls = 'planned'; l2 = 'Planned' + (o.edition ? ' \u00b7 ' + esc(o.edition) : ''); }
    else if (o.state === 'due') { cls = 'due'; l2 = o.dueBy ? 'Due by ' + esc(o.dueBy) : (o.dueMonth < nowYm() ? 'Overdue' : 'Due now'); }
    else { cls = 'toCome'; l2 = 'To come' + (o.week && o.week !== L.any ? ' \u00b7 ' + esc(o.week) : ''); }
    var where = showWhere ? (o.title ? '<em class="wh">' + esc(o.title) + '</em>' : '<em class="wh none">Any magazine</em>') : '';
    return '<div class="otile t-' + cls + '" title="' + esc(o.name) + '"><b>' + monS(o.dueMonth) + '</b>' + mg + '<span>' + l2 + '</span>' + act + where + '</div>';
  }
  function panel(r) {
    var obs = obsOf(r.id), multiT = (r.titles || []).length > 1;
    var slots = obs.filter(function (o) { return !o.makeGoodOf && o.status !== 'Cancelled'; });
    var order = { ran: 0, planned: 1, missed: 2, due: 3, toCome: 4 };
    var sts = slots.map(function (o) { return o.state; }).sort(function (a, b) { return (order[a] == null ? 9 : order[a]) - (order[b] == null ? 9 : order[b]); });
    var n = function (k) { return sts.filter(function (s) { return s === k; }).length; };
    var nm = { ran: 'Ran', planned: 'Planned in an edition', due: 'Due now, not placed', missed: 'Missed', toCome: 'Still to come' };
    var dots = sts.map(function (s) { return '<i class="gd g-' + s + '" title="' + (nm[s] || s) + '"></i>'; }).join('');
    var sum = '<b>' + n('ran') + ' of ' + sts.length + ' ran</b>' + (n('planned') ? ' \u00b7 ' + n('planned') + ' planned' : '') +
      (n('due') ? ' \u00b7 <span class="due">' + n('due') + ' due now</span>' : '') + (n('missed') ? ' \u00b7 <span class="due">' + n('missed') + ' missed</span>' : '') +
      (sts.length && n('ran') === sts.length ? ' \u00b7 <span class="allg">Green board</span>' : '');
    if (r.pace && r.pace.behind) sum += ' \u00b7 <span class="due">Behind pace: ' + r.pace.placed + ' placed, about ' + r.pace.expected + ' expected by now</span>';
    var gone = obs.filter(function (o) { return o.status === 'Cancelled'; }).length;   // edits and cancels leave these; counted, not tiled
    var all = obs.filter(function (o) { return o.status !== 'Cancelled'; }).sort(function (a, b) { return a.dueMonth.localeCompare(b.dueMonth) || (a.makeGoodOf ? 1 : 0) - (b.makeGoodOf ? 1 : 0) || a.name.localeCompare(b.name); });
    var box = '<div class="mbox"><div class="mhead"><b>Obligations</b><span>' + slots.length + ' bought' +
      (multiT && r.placement === L.pool ? ' \u00b7 any of ' + r.titles.length + ' magazines' : '') + (gone ? ' \u00b7 ' + gone + ' cancelled' : '') + '</span></div><div class="tiles">' +
      (all.length ? all.map(function (o) { return tile(o, multiT); }).join('') : '<span class="hint">No live sends.</span>') + '</div></div>';
    var mags = '';
    if (multiT) {
      var many = r.titles.length >= COLLAPSE_AT;
      mags = '<div class="mlabel">By magazine</div><div class="mboxes">' + r.titles.map(function (t) {
        var ts = obs.filter(function (o) { return o.titleId === t.id && o.status !== 'Cancelled'; }).sort(function (a, b) { return a.dueMonth.localeCompare(b.dueMonth); });
        var placed = ts.filter(function (o) { return o.status === 'Assigned' || o.status === 'Fulfilled'; }).length;
        var ran = ts.filter(function (o) { return o.status === 'Fulfilled'; }).length;
        var missed = ts.filter(function (o) { return o.status === 'Missed' && !o.madeGoodBy; }).length;
        var head = (r.placement === L.split && r.splitCounts ? (r.splitCounts[t.id] || 0) + ' sold here \u00b7 ' : '') + placed + ' placed \u00b7 ' + ran + ' ran' +
          (missed ? ' \u00b7 <span class="due">' + missed + ' missed</span>' : '');
        var key = r.id + '|' + t.id, open = !many || (key in S.magOpen ? S.magOpen[key] : missed > 0);
        return '<div class="mbox' + (many ? ' coll' : '') + '"><div class="mhead"' + (many ? ' data-mt="' + esc(key) + '" role="button" tabindex="0" aria-expanded="' + open + '"' : '') + '><b>' + esc(t.name) + '</b><span>' + head + (many ? chev(open, 'mchev') : '') + '</span></div>' +
          (open ? '<div class="tiles">' + (ts.length ? ts.map(function (o) { return tile(o, false); }).join('') : '<span class="hint">Nothing placed here yet</span>') + '</div>' : '') + '</div>';
      }).join('') + '</div>';
    }
    var acts = r.status === 'Active'
      ? '<button type="button" class="ps-link" data-edit="' + r.id + '">Edit sales record</button><button type="button" class="ps-link ps-ob-red" data-cxl="' + r.id + '">Cancel remaining sends</button>'
      : '<span class="hint">Ended. Sends that ran or were missed stay on the record.</span>';
    return '<div class="bpanel"><div class="gboard"><div class="gdots">' + dots + '</div><div class="gsum">' + sum + '</div></div>' + box + mags + '<div class="bacts">' + acts + '</div></div>';
  }

  // ── the form ────────────────────────────────────────────────
  function blank() {
    return { customer: '', product: '', franchise: '', type: (S.lists.types[0] || 'Paid'), titles: multiPub() ? [] : S.titles.map(function (t) { return t.id; }),
      placement: '', split: {}, frequency: S.lists.frequencies.indexOf('Monthly') >= 0 ? 'Monthly' : (S.lists.frequencies[0] || ''),
      startMonth: '', windowEnd: '', sends: '12', week: L.any, months: [], web: WEBS[0] };
  }
  function fromRow(r) {
    return { customer: r.customerId || '', product: r.productId || '', franchise: r.franchiseId || '', type: r.type || 'Paid',
      titles: (r.titles || []).map(function (t) { return t.id; }), placement: r.placement === L.single ? '' : (r.placement || ''),
      split: Object.assign({}, r.splitCounts || {}), frequency: r.frequency || '', startMonth: r.startMonth || '',
      windowEnd: r.windowEnd ? String(r.windowEnd).slice(0, 10) : '', sends: String(r.sendsBought || ''), week: r.week || L.any, months: sortEnt(r.months || []), web: r.onWebsite || WEBS[0] };
  }
  function F() { return S.form; }
  function shapeOf(pid) { var p = (S.lists.products || []).find(function (x) { return x.id === pid; }); return p ? p.shape : null; }
  function isSponsor() { return shapeOf(F().cur.product) === L.sponsor; }
  function isSpecific() { return F().cur.frequency === L.specific; }
  function placementOut() { var c = F().cur; return c.titles.length === 1 ? L.single : c.placement; }
  function splitSum() { var c = F().cur; return c.titles.reduce(function (a, t) { return a + (+c.split[t] || 0); }, 0); }
  function sendsDerived() {
    var p = placementOut();
    if (p === L.split) return splitSum();
    if (isSpecific() && (p === L.single || p === L.mirrored)) return F().cur.months.length;
    return null;
  }
  function visible() {
    var c = F().cur, k = ['customer', 'product', 'type', 'frequency'];
    if (isSponsor()) k.push('franchise', 'web');
    if (multiPub()) k.push('titles');
    if (multiPub() && c.titles.length > 1) k.push('placement');
    if (placementOut() === L.split) k.push('split');
    if (isSpecific()) k.push('months'); else { k.push('startMonth', 'week'); }
    if (c.frequency === L.window) k.push('windowEnd');
    if (sendsDerived() == null) k.push('sends');
    return k;
  }
  function dirty(k) { return !same(F().cur[k], F().orig[k]); }
  function changedKeys() { return visible().filter(dirty); }
  function missing() {
    var c = F().cur, n = [];
    if (!c.customer) n.push('a customer');
    if (!c.product) n.push('a product');
    if (isSponsor() && !c.franchise) n.push('a franchise');
    if (!c.titles.length) n.push('a magazine');
    if (isSponsor() && c.titles.length > 1) n.push('one magazine only');
    if (c.titles.length > 1 && !c.placement) n.push('how the sends are shared');
    if (placementOut() === L.split && c.titles.some(function (t) { return !(+c.split[t] > 0); })) n.push('sends for each town');
    if (isSpecific()) { if (!c.months.length) n.push('at least one month'); }
    else if (!c.startMonth) n.push('a start month');
    if (c.frequency === L.window && !/^\d{4}-\d{2}-\d{2}$/.test(c.windowEnd)) n.push('the window end');
    if (sendsDerived() == null && !(+c.sends >= 1 && Number.isInteger(+c.sends))) n.push('edition sends');
    return n;
  }
  // v1.0.7 the form on ix-forms: four equal columns, rows from the left edge
  function fld(k, label, html, o) {
    o = o || {};
    return IxForm.field({ key: k, label: label, tip: o.tip, html: html, req: o.req, span: o.span, hint: o.hint, warn: o.warn, changed: k ? dirty(k) : false, cancel: W.fieldCancel });
  }
  function selK(k, opts, ph, label, disabled) { return IxForm.select({ key: k, options: opts, value: F().cur[k], placeholder: ph, changed: dirty(k), disabled: disabled, label: label }); }
  function startMonths() {
    var a = [], s = addM(nowYm(), -1), cur = F().orig.startMonth;
    for (var i = 0; i < GRID_MONTHS + 1; i++) a.push(addM(s, i));
    if (cur && a.indexOf(cur) < 0) a.unshift(cur);
    return a.map(function (x) { return [x, monL(x)]; });
  }
  function form() {
    var f = F(), c = f.cur, Lz = S.lists, m = multiPub();
    var head = f.mode === 'new' ? W.newH : fill(W.editH, { name: f.name });
    var custOpts = Lz.customers.map(function (x) { return [x.id, x.name]; });
    if (c.customer && !custOpts.some(function (x) { return x[0] === c.customer; })) custOpts.unshift([c.customer, f.custName || c.customer]);
    var prodOpts = Lz.products.map(function (x) { return [x.id, x.name]; });
    var shape = shapeOf(c.product), rows = '';
    // row 1: Customer · Product · Type · Magazine
    rows += IxForm.row([
      fld('customer', 'Customer', selK('customer', custOpts, 'Select', 'Customer', f.lock), { req: true }),
      fld('product', 'Product', selK('product', prodOpts, 'Select', 'Product', f.lock), { req: true, hint: shape ? 'Slot shape: ' + esc(shape) : '' }),
      fld('type', '', selK('type', Lz.types, null, 'Type'), { tip: tip('Type') }),
      m ? '' : fld('', 'Magazine', IxForm.value((S.titles[0] || {}).name || ''))
    ]);
    if (f.lock) rows += '<div class="ix-form-row"><div class="ix-form-f ix-form-sfull"><span class="ix-form-warn">' + esc(W.lockCust) + '</span></div></div>';
    if (m) {
      var tl = S.titles.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
      rows += IxForm.row([fld('titles', 'Magazines', '<div class="tlist' + (dirty('titles') ? ' ps-chg' : '') + '">' +
        tl.map(function (t) { return '<label><input type="checkbox" data-title="' + t.id + '"' + (c.titles.indexOf(t.id) >= 0 ? ' checked' : '') + '> ' + esc(t.name) + '</label>'; }).join('') + '</div>',
        { req: true, span: 'full', hint: c.titles.length + ' ticked' + (isSponsor() && !f.titleWarn ? '. ' + esc(W.sponsorOne) : ''), warn: f.titleWarn ? esc(f.titleWarn) : '' })]);
    }
    if (m && c.titles.length > 1) {
      var k = c.titles.length, n = +c.sends || 0;
      var sub = { Mirrored: n ? n + ' in each town, ' + (n * k) + ' sends in all' : 'The same sends in all ' + k + ' towns',
                  Split: 'Set the count for each town below', Pool: n ? n + ' sends in all, placed wherever there is room' : 'One total, placed wherever there is room' };
      rows += IxForm.row([fld('placement', fill(W.whereQ, { k: k }), '<div class="pcards' + (dirty('placement') ? ' ps-chg' : '') + '" role="radiogroup">' +
        W.where.map(function (w) { var on = c.placement === w[0]; return '<label class="pcard' + (on ? ' ps-ob-on' : '') + '"><input type="radio" name="ps-where" data-where="' + w[0] + '"' + (on ? ' checked' : '') + '><span><b>' + esc(w[1]) + '</b><em>' + esc(sub[w[0]]) + '</em></span></label>'; }).join('') + '</div>',
        { req: true, span: 'full' })]);
    }
    if (placementOut() === L.split) {
      rows += IxForm.row([fld('split', 'Sends per town', '<div class="splitbox' + (dirty('split') ? ' ps-chg' : '') + '">' +
        c.titles.map(function (t) { return '<div class="splitrow"><span>' + esc(titleName(t)) + '</span><input class="ix-picker-input" type="number" min="0" step="1" data-split="' + t + '" value="' + esc(c.split[t] == null ? '' : c.split[t]) + '"></div>'; }).join('') + '</div>',
        { req: true, span: 'full', hint: '<span id="ps-splitsum">Edition sends total ' + splitSum() + '</span>' })]);
    }
    // row 2: Franchise · On the website (a franchise sponsor only)
    if (isSponsor()) {
      var t0 = c.titles[0];
      var fr = Lz.franchises.filter(function (x) { return !t0 || x.titleIds.indexOf(t0) >= 0; }).map(function (x) { return [x.id, x.name]; });
      rows += IxForm.row([
        fld('franchise', 'Franchise', selK('franchise', fr, 'Select', 'Franchise'), { req: true, warn: fr.length ? '' : esc(W.noFranchise) }),
        fld('web', 'On the website', selK('web', WEBS, null, 'On the website'), { hint: esc(c.web === WEBS[1] ? W.webIssue : W.webRun) })   // v1.0.6
      ]);
    }
    // row 3: When · Start month · Edition sends · Week (Window: Window ends before Edition sends, Week on row 4)
    var der = sendsDerived();
    var sendsF = fld('sends', '', der != null ? IxForm.value(String(der), 'id="ps-sendsval"')
      : IxForm.input({ key: 'sends', type: 'number', min: 1, step: 1, value: c.sends, changed: dirty('sends'), label: 'Edition sends' }), { req: true, tip: tip('Edition sends') });
    var whenF = fld('frequency', 'When', selK('frequency', Lz.frequencies, null, 'When'));
    if (isSpecific()) {
      rows += IxForm.row([whenF, sendsF]);
      rows += IxForm.row([fld('months', 'Months', monthGrid(), { req: true, span: 'full' })]);
    } else {
      var startF = fld('startMonth', c.frequency === L.once ? 'Month' : 'Start month', selK('startMonth', startMonths(), 'Select', 'Start month'), { req: true });
      var weekF = fld('week', '', selK('week', Lz.weeks, null, 'Week'), { tip: tip('Week') });
      if (c.frequency === L.window) {
        rows += IxForm.row([whenF, startF, fld('windowEnd', 'Window ends', IxForm.input({ key: 'windowEnd', type: 'date', value: c.windowEnd, changed: dirty('windowEnd'), label: 'Window ends' }), { req: true }), sendsF]);
        rows += IxForm.row([weekF]);
      } else rows += IxForm.row([whenF, startF, sendsF, weekF]);
    }
    return '<section class="ps-ob-form" aria-label="' + esc(head) + '"><div class="formhead"><h2>' + esc(head) + '</h2><span class="hint">' + esc(f.mode === 'new' ? W.newHint : W.editHint) + '</span></div>' +
      IxForm.wrap(rows + barHtml(), { label: head }) + '</section>';
  }
  function barHtml() {
    var f = F(), n = missing(), ch = changedKeys().length;
    return IxForm.bar({ what: f.mode === 'new' ? W.newH : fill(W.editH, { name: f.name }), changed: ch,
      need: n.length ? fill(W.needs, { list: n.join(', ') }) : '', err: f.err, canSave: !n.length && (f.mode === 'new' || ch > 0) && !f.busy,
      saving: !!f.busy, saveLabel: f.mode === 'new' ? W.save : W.saveEdit, resetLabel: 'Reset', cancelLabel: W.cancel });
  }
  function monthGrid() {
    var c = F().cur, first = nowYm(), earliest = c.months.length ? entMonth(c.months[0]) : first;
    var from = earliest < first ? earliest : first, last = addM(first, GRID_MONTHS - 1);
    var y0 = +from.slice(0, 4), y1 = +last.slice(0, 4), rows = '';
    for (var y = y0; y <= y1; y++) {
      rows += '<div class="myear"><div class="yr">' + y + '</div>';
      for (var mo = 1; mo <= 12; mo++) {
        var ym = y + '-' + String(mo).padStart(2, '0');
        var ents = c.months.filter(function (e) { return entMonth(e) === ym; });
        var inRange = ym >= from && ym <= last && (ym >= first || ents.length);
        if (!inRange) { rows += '<div class="mcell off"><span class="mtick">' + MON[mo - 1] + '</span></div>'; continue; }
        var on = ents.length > 0;
        var was = (F().orig.months || []).filter(function (e) { return entMonth(e) === ym; });
        var chg = !same(sortEnt(ents.slice()), sortEnt(was.slice()));
        rows += '<div class="mcell' + (on ? ' ps-ob-on' : '') + (chg ? ' ps-ob-mchg' : '') + '"><div class="mhead"><label class="mtick"><input type="checkbox" data-mon="' + ym + '"' + (on ? ' checked' : '') + '> ' + MON[mo - 1] + '</label>' +
          (chg ? '<button type="button" class="ix-revert mrev" data-mrev="' + ym + '" aria-label="Put ' + MON[mo - 1] + ' back as it was">cancel</button>' : '') + '</div>';
        ents.forEach(function (e, i) {
          var w = entWeek(e);
          rows += '<div class="ment">' + ['', '1', '2', '3', '4'].map(function (x) {
            return '<button type="button" class="wk' + (x ? '' : ' any') + '" aria-pressed="' + (w === x) + '" data-wk="' + ym + '|' + i + '|' + x + '" aria-label="' + (x ? 'Week ' + x : 'Any week') + '">' + (x || 'Any') + '</button>'; }).join('') +
            (i > 0 ? '<button type="button" class="mx" data-mx="' + ym + '|' + i + '" aria-label="Remove this send">\u00d7</button>' : '') + '</div>';
        });
        if (on && ents.length < 4) rows += '<button type="button" class="madd" data-madd="' + ym + '">+ send</button>';
        rows += '</div>';
      }
      rows += '</div>';
    }
    var fillFrom = S.form.fillFrom || first, opts = [];
    for (var i = 0; i < GRID_MONTHS; i++) opts.push([addM(first, i), monL(addM(first, i))]);
    var tools = '<div class="mtools"><span class="hint">' + esc(W.fillFrom) + '</span>' + sel('data-fillfrom aria-label="Fill from"', opts, fillFrom, null, false) +
      FILL.map(function (x) { return '<button type="button" class="ix-btn ix-btn--pill" data-fill="' + x[1] + '|' + x[2] + '">' + esc(x[0]) + '</button>'; }).join('') +
      '<span class="hint">' + esc(W.gridHint) + '</span></div>';
    var summ = c.months.length ? c.months.length + ' send' + plural(c.months.length) + ': ' + c.months.map(function (e) { return monS(entMonth(e)) + (entWeek(e) ? ' W' + entWeek(e) : ''); }).join(', ') : 'No months ticked';
    return tools + '<div class="mgrid' + (dirty('months') ? ' ps-chg' : '') + '">' + rows + '</div><div class="msum">' + esc(summ) + '</div>';
  }
  function setMonths(list) { F().cur.months = sortEnt(list); }
  function editEntries(ym, fn) {
    var c = F().cur, others = c.months.filter(function (e) { return entMonth(e) !== ym; });
    var mine = c.months.filter(function (e) { return entMonth(e) === ym; });
    setMonths(others.concat(fn(mine)));
  }
  function body() {
    var c = F().cur, p = placementOut(), b = {
      publisher: ctx.publisher.id, customer: c.customer, product: c.product, franchise: isSponsor() ? c.franchise : '',
      titles: c.titles.slice(), placement: p, type: c.type, frequency: c.frequency, week: isSpecific() ? L.any : c.week };
    if (isSponsor()) b.onWebsite = c.web || WEBS[0];                  // v1.0.6
    if (isSpecific()) b.months = c.months.slice(); else b.startMonth = c.startMonth;
    if (c.frequency === L.window) b.windowEnd = c.windowEnd;
    if (p === L.split) { b.splitCounts = {}; c.titles.forEach(function (t) { b.splitCounts[t] = +c.split[t] || 0; }); b.sends = splitSum(); }
    else if (isSpecific() && (p === L.single || p === L.mirrored)) { if (F().mode === 'new') b.sends = c.months.length; }
    else b.sends = +c.sends;
    return b;
  }

  // ── modals (ix-modals) ──────────────────────────────────────
  function modalHtml() {
    var md = S.modal;
    if (!md) return '';
    return '<div class="ix-overlay" role="dialog" aria-modal="true" aria-labelledby="ps-mh"><div class="ix-modal ps-ob-modal"><div class="ix-modal-bar"></div>' +
      '<div class="ix-modal-head"><div class="ix-modal-title-block"><div class="ix-modal-title" id="ps-mh">' + esc(md.title) + '</div></div></div>' +
      '<div class="ix-modal-body">' + md.body + (md.err ? '<div class="ps-err" role="alert">' + esc(md.err) + '</div>' : '') + '</div>' +
      '<div class="ix-modal-footer"><button type="button" class="ix-revert" id="ps-mcancel">' + esc(md.cancel || W.cancel) + '</button><div class="ix-modal-footer-right">' +
      '<button type="button" class="ix-btn ' + (md.danger ? 'ix-btn--danger' : 'ix-btn--primary') + '" id="ps-mok"' + (md.ready && !md.busy ? '' : ' disabled') + '>' + esc(md.busy ? W.saving : md.ok) + '</button></div></div></div></div>';
  }
  function askEdit() {
    var f = F(), obs = obsOf(f.id);
    var openN = obs.filter(function (o) { return o.status === 'Open' && !o.makeGoodOf; }).length;
    var kept = obs.filter(function (o) { return !o.makeGoodOf && ['Assigned', 'Fulfilled', 'Missed'].indexOf(o.status) >= 0; }).length;
    var mgs = obs.filter(function (o) { return o.makeGoodOf && o.status !== 'Cancelled'; }).length;
    var names = { customer: 'customer', product: 'product', franchise: 'franchise', type: 'type', titles: 'magazines', placement: 'how sends are shared',
      split: 'sends per town', frequency: 'when', startMonth: 'start month', windowEnd: 'window end', sends: 'edition sends', week: 'week', months: 'months', web: 'on the website' };
    S.modal = { kind: 'edit', title: fill(W.ackEditH, { name: f.name }), ok: W.saveChanges, ready: false,
      body: '<p>This sale is live. Saving does the following:</p><ul><li>' + openN + ' open send' + plural(openN) + ' become' + (openN === 1 ? 's' : '') + ' Cancelled, and a fresh set is made from the new terms.</li>' +
        (kept ? '<li>' + kept + ' send' + plural(kept) + ' that ' + (kept === 1 ? 'is' : 'are') + ' placed, ran or missed keep' + (kept === 1 ? 's' : '') + ' ' + (kept === 1 ? 'its' : 'their') + ' place.</li>' : '') +
        (mgs ? '<li>' + mgs + ' make good' + plural(mgs) + ' stay as they are.</li>' : '') + '</ul>' +
        '<p>Double-check what you changed: <b>' + esc(changedKeys().map(function (k) { return names[k] || k; }).join(', ')) + '</b>.</p>' +
        '<label class="ack"><input type="checkbox" id="ps-ack"> ' + esc(W.ackBox) + '</label>',
      run: doSave };
    render();
  }
  function askCancel(id) {
    var r = sale(id), obs = obsOf(id);
    var n = obs.filter(function (o) { return o.status === 'Open' || o.status === 'Assigned'; }).length;
    var asg = obs.filter(function (o) { return o.status === 'Assigned'; }).length;
    var owed = obs.filter(function (o) { return o.status === 'Missed' && !obs.some(function (m) { return m.makeGoodOf === o.id && m.status === 'Fulfilled'; }); }).length;
    S.modal = { kind: 'cancel', title: fill(W.ackCancelH, { name: r.name }), ok: W.cancelSends, cancel: W.keep, danger: true, ready: false,
      body: '<ul><li>' + n + ' open or placed send' + plural(n) + ' become' + (n === 1 ? 's' : '') + ' Cancelled' + (asg ? ', including ' + asg + ' already placed in an edition (the Revenue Picker will show ' + (asg === 1 ? 'that slot' : 'those slots') + ' as empty)' : '') + '.</li>' +
        '<li>Sends that ran or were missed stay on the record.</li>' +
        (owed ? '<li>' + owed + ' missed send' + plural(owed) + (owed === 1 ? ' is' : ' are') + ' still owed to the customer after the record ends. Make good stays available on ' + (owed === 1 ? 'it' : 'them') + ', and the record shows under Needs you until ' + (owed === 1 ? 'it is' : 'they are') + ' made good.</li>' : '') + '<li>The sales record moves to Ended. This cannot be undone; a new sale is a new record.</li></ul>' +
        '<label class="ack"><input type="checkbox" id="ps-ack"> ' + esc(W.ackCancelBox) + '</label>',
      run: function () { return doCancel(id); } };
    render();
  }
  function askMakeGood(oid) {
    var o = S.obs.find(function (x) { return x.id === oid; }), r = sale(o.salesId) || {}, opts = [];
    for (var i = 0; i < MG_MONTHS; i++) opts.push([addM(nowYm(), i), monL(addM(nowYm(), i))]);
    S.modal = { kind: 'mg', title: fill(W.mgH, { name: o.name }), ok: W.addMg, ready: false,
      body: '<p>' + esc(o.customer || '') + ', ' + esc(productLabel(r)) + ', missed ' + esc(monL(o.dueMonth)) + '. The miss stays on the record. A replacement send is added in the month you pick.</p>' +
        '<span class="lab">' + esc(W.mgMonth) + '</span>' + sel('id="ps-mgmonth" aria-label="' + esc(W.mgMonth) + '"', opts, '', 'Select', false),
      run: function () { return doMakeGood(o); } };
    render();
  }

  // ── writes ──────────────────────────────────────────────────
  function failText(r) { return (r.json && r.json.error) || ('The request failed (HTTP ' + r.status + ').'); }
  async function doSave() {
    var f = F(), b = body(), r;
    f.busy = true; f.err = ''; if (S.modal) S.modal.busy = true; render();
    if (f.mode === 'new') r = await ctx.api('/sales', { method: 'POST', body: b, label: 'Saving the sales record' });
    else { delete b.publisher; r = await ctx.api('/sales/' + f.id, { method: 'PATCH', body: b, label: 'Saving ' + f.name }); }
    f.busy = false;
    if (!r.ok) { if (S.modal) { S.modal.busy = false; S.modal.err = failText(r); } else f.err = failText(r); render(); return; }
    var id = r.json.id, name = r.json.name || f.name, made = (r.json.obligations || []).length;
    var unc = (r.json.unconfirmed || []).slice();
    (r.json.obligations || []).forEach(function (o) { (o.unconfirmed || []).forEach(function (x) { unc.push(o.name + ' ' + x); }); });
    S.modal = null;
    await load(true);
    var listed = !!sale(id);
    S.form = null; S.open = id; S.tState = null;   // v1.0.7 back to the table, filters cleared, the saved sale open
    render();
    if (!listed) toast(fill(W.notListed, { name: name }), 'unverified', 'save:' + id);
    else if (unc.length) toast(fill(W.unconfirmed, { name: name, fields: uniq(unc).join(', ') }), 'unverified', 'save:' + id);
    else toast(f.mode === 'new' ? fill(W.savedNew, { name: name, n: made, s: plural(made) }) : fill(W.savedEdit, { name: name }), 'ok', 'save:' + id);
  }
  async function doCancel(id) {
    var r0 = sale(id), r = await ctx.api('/sales/' + id + '/cancel', { method: 'POST', body: {}, label: 'Cancelling ' + r0.name });
    if (!r.ok) { S.modal.busy = false; S.modal.err = failText(r); render(); return; }
    S.modal = null;
    await load(true);
    render();
    var now = sale(id), n = r.json.cancelled || 0;
    if (r.json.unconfirmed && r.json.unconfirmed.length) toast(fill(W.unconfirmed, { name: r0.name, fields: r.json.unconfirmed.join(', ') }), 'unverified', 'cxl:' + id);
    else if (!now || now.status !== 'Ended') toast(fill(W.notListed, { name: r0.name }), 'unverified', 'cxl:' + id);
    else toast(fill(W.cancelled, { name: r0.name, n: n, s: plural(n) }), 'ok', 'cxl:' + id);
  }
  async function doMakeGood(o) {
    var month = S.modal.month;
    var r = await ctx.api('/obligations/' + o.id + '/make-good', { method: 'POST', body: { dueMonth: month }, label: 'Adding a make good' });
    if (!r.ok) { S.modal.busy = false; S.modal.err = failText(r); render(); return; }
    S.modal = null;
    await load(true);
    render();
    var made = S.obs.find(function (x) { return x.id === r.json.id; });
    if (r.json.unconfirmed && r.json.unconfirmed.length) toast(fill(W.unconfirmed, { name: r.json.name, fields: r.json.unconfirmed.join(', ') }), 'unverified', 'mg:' + o.id);
    else if (!made) toast(fill(W.notListed, { name: r.json.name }), 'unverified', 'mg:' + o.id);
    else toast(fill(W.mgDone, { name: r.json.name, month: monL(month) }), 'ok', 'mg:' + o.id);
  }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function toast(msg, v, key) { if (window.IxToast) window.IxToast.show(msg, v, { key: 'ps-ob:' + key }); }

  // ── render and wiring ───────────────────────────────────────
  function info() {
    return ctx.info({ file: FILE, version: VERSION, title: W.title,
      blurb: 'Sales records and the obligations they make, for this publisher, in four sections: Needs you, Running now, Starting later, Ended (ix-sales decides the section). Filters: Customer, and Magazines when there are two or more. Links: ?title=<TITLES-ADMIN id> filters a magazine, ?sale=<id> opens a sale. A send is one newsletter edition. Saving a record makes its sends; editing a live one replaces its open sends; cancelling ends it. Board, Qty, Remaining, Behind pace and each send\'s state come from ix-sales. Pathways: ix-sales /sales, /obligations, /titles, /products, /customers, /franchises, /options, POST /sales, PATCH /sales/<id>, /sales/<id>/cancel, /obligations/<id>/make-good; ix-members /whoami (shell).',
      scenarios: [], companions: 'ps-obligations-v1.0.5.css · ps-shell v' + window.PsShell.version + ' · ix-sales v1.3.16 (sections) · ix-table v1.1.0 · ix-forms v1.0.0 · ix-form-controls v1.2.0' });
  }
  function render() {
    var y = window.scrollY, act = document.activeElement, focusKey = act && act.getAttribute ? (act.getAttribute('data-k') || act.id || '') : '';
    var h = '<div class="ps-ob"><div class="ps-titlerow"><h1>' + esc(W.title) + '</h1>' + info() + '<div class="sp"></div>' +
      '<button type="button" class="ix-btn ix-btn--primary add" id="ps-add"' + (S.form || !S.loaded || S.loadErr ? ' disabled' : '') + '>' + esc(W.add) + '</button></div>';
    if (!S.loaded) h += ctx.placeholder ? '<div class="ps-ob-box"><table><tbody>' + ctx.placeholder(4, 9) + '</tbody></table></div>'
      : '<div class="ps-loading">' + esc(W.loading) + '</div>';
    else if (S.loadErr) h += '<div class="ps-err" role="alert">' + esc(fill(W.loadFail, { msg: S.loadErr })) + '</div>';
    else if (S.form) h += window.IxForm ? form() : '<div class="ps-err" role="alert">' + esc(W.noIxForm) + '</div>';
    else h += '<div id="ps-ob-table"></div><p class="ps-ob-note">' + esc(W.note) + '</p>';   // v1.0.7 ix-table draws here
    h += '</div>' + modalHtml();
    if (S.table) { try { S.tState = S.table.state(); } catch (e) {} S.table.destroy(); S.table = null; }   // the table is drawn again below, where it was
    el.innerHTML = h;
    if (S.loaded && !S.loadErr && !S.form) { drawTable(); applyDeepLink(); }
    wire();
    if (focusKey) { var back = el.querySelector('[data-k="' + focusKey + '"]') || el.querySelector('#' + focusKey.replace(/[^\w-]/g, '')); if (back && back.focus) back.focus({ preventScroll: true }); }
    window.scrollTo(0, y);
  }
  function on(sel2, ev, fn) { el.querySelectorAll(sel2).forEach(function (n) { n.addEventListener(ev, fn); }); }
  function wire() {
    var add = el.querySelector('#ps-add');
    if (add) add.addEventListener('click', openNew);
    if (S.form) wireForm();
    if (S.modal) wireModal();
  }
  function wireForm() {
    var c = F().cur;
    on('select[data-k]', 'change', function (e) {
      var k = e.currentTarget.getAttribute('data-k'); c[k] = e.currentTarget.value;
      if (k === 'product' && !isSponsor()) c.franchise = '';
      if (k === 'frequency' && c.frequency === L.once && !dirty('sends')) c.sends = '1';   // a one-time sale is one send unless changed
      if (k === 'product' && isSponsor() && c.franchise && !S.lists.franchises.some(function (x) { return x.id === c.franchise; })) c.franchise = '';
      F().err = ''; render();
    });
    on('input[data-k]', 'input', function (e) {                         // typing: no re-draw, so focus stays
      var n = e.currentTarget, k = n.getAttribute('data-k'); c[k] = n.value; F().err = '';
      n.classList.toggle('ix-picker-input--changed', dirty(k));
      refreshSaveBar(); refreshLabel(k);
    });
    on('[data-ixf-revert]', 'click', function (e) {
      var k = e.currentTarget.getAttribute('data-ixf-revert'); F().t.revert(k); F().titleWarn = ''; render();
    });
    on('input[data-title]', 'change', function (e) {
      var t = e.currentTarget.getAttribute('data-title'), ticked = e.currentTarget.checked;
      if (ticked && isSponsor() && c.titles.length >= 1) {                 // refused at the click (ix-sales would refuse it at save)
        e.currentTarget.checked = false; F().titleWarn = W.sponsorOne; render(); return;
      }
      F().titleWarn = '';
      c.titles = ticked ? c.titles.concat([t]) : c.titles.filter(function (x) { return x !== t; });
      c.titles = S.titles.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (x) { return x.id; }).filter(function (id) { return c.titles.indexOf(id) >= 0; });
      Object.keys(c.split).forEach(function (k) { if (c.titles.indexOf(k) < 0) delete c.split[k]; });
      render();
    });
    on('input[data-where]', 'change', function (e) { c.placement = e.currentTarget.getAttribute('data-where'); render(); });
    on('input[data-split]', 'input', function (e) {
      var n = e.currentTarget; c.split = Object.assign({}, c.split); c.split[n.getAttribute('data-split')] = n.value;
      var box = n.closest('.splitbox'); if (box) box.classList.toggle('ps-chg', dirty('split'));
      var s = el.querySelector('#ps-splitsum'); if (s) s.textContent = 'Edition sends total ' + splitSum();
      var v = el.querySelector('#ps-sendsval'); if (v) v.textContent = String(splitSum());
      refreshSaveBar(); refreshLabel('split');
    });
    on('input[data-mon]', 'change', function (e) {
      var ym = e.currentTarget.getAttribute('data-mon'), tick = e.currentTarget.checked;
      editEntries(ym, function () { return tick ? [ym] : []; }); render();
    });
    on('[data-wk]', 'click', function (e) {
      var p = e.currentTarget.getAttribute('data-wk').split('|'), ym = p[0], i = +p[1], w = p[2];
      editEntries(ym, function (mine) { mine[i] = ym + (w ? ' W' + w : ''); return mine; }); render();
    });
    on('[data-mx]', 'click', function (e) {
      var p = e.currentTarget.getAttribute('data-mx').split('|'), ym = p[0], i = +p[1];
      editEntries(ym, function (mine) { mine.splice(i, 1); return mine; }); render();
    });
    on('[data-mrev]', 'click', function (e) {
      var ym = e.currentTarget.getAttribute('data-mrev');
      var was = (F().orig.months || []).filter(function (x) { return entMonth(x) === ym; });
      editEntries(ym, function () { return was.slice(); }); render();
    });
    on('[data-madd]', 'click', function (e) { var ym = e.currentTarget.getAttribute('data-madd'); editEntries(ym, function (mine) { return mine.concat([ym]); }); render(); });
    var ff = el.querySelector('select[data-fillfrom]'); if (ff) ff.addEventListener('change', function () { F().fillFrom = ff.value; render(); });
    on('[data-fill]', 'click', function (e) {
      var p = e.currentTarget.getAttribute('data-fill').split('|'), step = +p[0], n = +p[1], from = F().fillFrom || nowYm(), a = [];
      for (var i = 0; i < n; i++) a.push(addM(from, i * step));
      setMonths(a); render();
    });
    wireBar();
  }
  function wireBar() {                                                 // v1.0.7 Reset · Cancel · Save (ix-forms)
    var r = el.querySelector('[data-ixf-reset]'), x = el.querySelector('[data-ixf-cancel]'), s2 = el.querySelector('[data-ixf-save]');
    if (r) r.addEventListener('click', function () { if (r.disabled) return; F().t.reset(); F().err = ''; F().titleWarn = ''; F().fillFrom = null; render(); });   // keeps the form open
    if (x) x.addEventListener('click', function () { S.form = null; render(); });
    if (s2) s2.addEventListener('click', function () { if (s2.disabled) return; if (F().mode === 'edit') askEdit(); else doSave(); });
  }
  function refreshSaveBar() {                                          // update the bottom bar without a full re-draw (typing keeps focus)
    var bar = el.querySelector('.ix-form-bar'); if (!bar) return;
    var tmp = document.createElement('div'); tmp.innerHTML = barHtml();
    bar.parentNode.replaceChild(tmp.firstChild, bar);
    wireBar();
  }
  function refreshLabel(k) {                                           // show or hide the field's cancel link in place
    var f = el.querySelector('[data-ixf-field="' + k + '"]'); var labEl = f && f.querySelector('.ix-form-lab'); if (!labEl) return;
    var has = labEl.querySelector('[data-ixf-revert]');
    f.classList.toggle('ix-form-chg', dirty(k));
    if (dirty(k) && !has) { var b = document.createElement('button'); b.type = 'button'; b.className = 'ix-revert ix-form-rv'; b.setAttribute('data-ixf-revert', k); b.textContent = W.fieldCancel;
      b.addEventListener('click', function () { F().t.revert(k); render(); }); labEl.appendChild(b); }
    if (!dirty(k) && has) has.remove();
  }
  function wireModal() {
    var md = S.modal, ok = el.querySelector('#ps-mok');
    var ack = el.querySelector('#ps-ack'); if (ack) ack.addEventListener('change', function () { md.ready = ack.checked; ok.disabled = !md.ready || md.busy; });
    var mg = el.querySelector('#ps-mgmonth'); if (mg) mg.addEventListener('change', function () { md.month = mg.value; md.ready = !!mg.value; ok.disabled = !md.ready || md.busy; mg.classList.toggle('ix-picker-input--changed', !!mg.value); });
    if (ack && md.ready) ack.checked = true;
    if (mg && md.month) mg.value = md.month;
    el.querySelector('#ps-mcancel').addEventListener('click', function () { S.modal = null; render(); });
    ok.addEventListener('click', function () { if (!md.ready || md.busy) return; md.busy = true; md.err = ''; render(); md.run(); });
  }
  async function ensureLists() {
    if (S.lists) return true;
    var b = el.querySelector('#ps-add'); if (b) { b.disabled = true; b.textContent = 'Loading…'; }
    var ok = await loadLists();
    if (!ok) { render(); toast(fill(W.listsFail, { msg: S.listsErr }), 'err', 'lists'); }
    return ok;
  }
  // v1.0.7 a form keeps its values in an ix-forms tracker: cur and orig read through it, so Reset and cancel are one call
  function makeForm(f, snapshot) {
    f.t = IxForm.track(snapshot);
    Object.defineProperty(f, 'cur', { get: function () { return f.t.cur; }, enumerable: true });
    Object.defineProperty(f, 'orig', { get: function () { return f.t.orig; }, enumerable: true });
    return f;
  }
  async function openNew() {
    if (!window.IxForm) { toast(W.noIxForm, 'err', 'form'); return; }
    if (!(await ensureLists())) return;
    S.form = makeForm({ mode: 'new', err: '', titleWarn: '' }, blank());   // v1.0.7 Reset empties a new one
    S.modal = null; render();
  }
  async function openEdit(id) {
    if (!window.IxForm) { toast(W.noIxForm, 'err', 'form'); return; }
    if (!(await ensureLists())) return;
    var r = sale(id);
    var lock = obsOf(id).some(function (o) { return o.status === 'Assigned'; });
    S.form = makeForm({ mode: 'edit', id: id, name: r.name, custName: r.customer, lock: lock, err: '', titleWarn: '' }, fromRow(r));   // Reset puts back the saved sale
    S.modal = null; render();
  }

  // ── mount ───────────────────────────────────────────────────
  // v1.0.7 the opened row's buttons are drawn by ix-table, so their clicks are caught once, on the tab
  function onPanelClick(e) {
    var t = e.target, b;
    if ((b = t.closest('[data-mt]'))) { e.preventDefault(); var k = b.getAttribute('data-mt'); S.magOpen[k] = b.getAttribute('aria-expanded') !== 'true'; if (S.table) S.table.redraw(); return; }
    if ((b = t.closest('[data-mg]'))) { e.preventDefault(); askMakeGood(b.getAttribute('data-mg')); return; }
    if ((b = t.closest('[data-edit]'))) { e.preventDefault(); openEdit(b.getAttribute('data-edit')); return; }
    if ((b = t.closest('[data-cxl]'))) { e.preventDefault(); askCancel(b.getAttribute('data-cxl')); return; }
  }
  function mount(node, c) {
    ctx = c; el = node;
    if (S && S.table) { try { S.table.destroy(); } catch (e) {} }
    S = { sales: [], obs: [], titles: [], sections: null, loaded: false, loadErr: '', open: null, magOpen: {}, form: null, modal: null, lists: null, listsErr: '', table: null, tState: null, deepDone: false };
    if (!el.__psObWired) { el.addEventListener('click', onPanelClick); el.__psObWired = true; }
    render();
    load(false).then(render);
  }
  function reg() { window.PsShell.register({ key: 'obligations', mount: mount }); }
  if (window.PsShell) reg(); else document.addEventListener('DOMContentLoaded', reg);
})();
