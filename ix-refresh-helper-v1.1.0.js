/* ix-refresh-helper-v1.1.0.js
   ════════════════════════════════════════════════════════════════
   INBXIFY ix series — REFRESH: button helper · page bus · write ledger

   Load in the page BODY custom code, BEFORE every T-A module that
   uses it (ta-print-review, ta-print-issues, ta-cadence-board, ...).
   No CSS. No config. No tenant value lives in this file.

   ── v1.1.0 · THE TAB REFRESHES ITSELF (Jeff, 29 Sept) ──
   The problem this solves, proven live on 29 Sept: a write lands in
   the CMS (103B confirms it, Webflow's editor shows it), but the
   page's own data is Webflow-rendered at load and does not change,
   and a re-fetch of that page can still serve the old copy. Every
   module that re-reads after its own write therefore throws its
   own write away (the board's Park tick vanished; Finish had to
   reload the whole page to show new rows).

   The rule this file enforces: A CONFIRMED WRITE OUTRANKS ANY READ
   THAT HAS NOT CAUGHT UP WITH IT. Two small parts:

   1. THE BUS — modules on one page tell each other what changed,
      without knowing about each other.
        IxRefresh.on(topic, fn)      → returns an off() function
        IxRefresh.emit(topic, data)  → returns how many listeners ran
      A writer that gets 0 back knows nobody is listening yet and can
      fall back honestly (e.g. a page reload) instead of leaving a
      stale screen.

   2. THE LEDGER — every write a server has CONFIRMED is recorded,
      field by field, until a read shows the same values.
        IxRefresh.confirm(coll, id, fields)
            record confirmed values (merges with earlier ones)
        IxRefresh.settle(coll, id, readFields) → fields still pending
            call on every read of that record: keys the read now
            agrees with are dropped; what is returned is what the
            read has NOT caught up with, and should be shown instead
        IxRefresh.pending(coll, id)   → pending fields or null
        IxRefresh.pendingAll(coll)    → [{ id, fields, at }]
            includes records the read does not have at all (new
            rows) — a reader adds those itself
        IxRefresh.forget(coll, id)    → drop a record (e.g. deleted)
      Entries expire after LEDGER_TTL_MS: by then the read source has
      long caught up, and a stale ledger must never outrank a later
      edit made somewhere else. A page reload empties the ledger,
      which is correct: a reload serves what the CMS holds.

   LEDGER CONVENTION: field keys are CMS slugs; Option fields are
   stored as their LABEL (what a Webflow binding prints, e.g.
   disposition "held", type "article"), never the option id, so a
   reader can compare against what it harvested from the page.

   TOPICS IN USE (a reader subscribes to what it shows):
     'slate:written'   { taId, source, issueName, rows:[{ id, fields }] }
                       rows created or changed in SLATE
     'slate:listening?'  {}   a writer asking whether anything will
                       redraw from 'slate:written'. A reader that
                       subscribes to 'slate:written' also subscribes
                       here with a no-op, so emit() counts it.
     'print-review:finished'  { taId, key, source, issueName, count }
                       a review finished; its draft is deleted

   ── v1.0.0 ──
   IxRefresh.wire(btn, fetchFn): spinner + disable around a manual
   refresh button. Unchanged.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var X = window.IxRefresh = window.IxRefresh || {};
  if (X.version && X.version >= '1.1.0') return;

  var LEDGER_TTL_MS = 30 * 60 * 1000;
  var TAG = '[ix-refresh v1.1.0]';

  // ── v1.0.0 · button helper (unchanged) ────────────────────
  X.wire = function (btn, fetchFn) {
    if (!btn || btn.__ixRefreshWired) return;
    btn.__ixRefreshWired = true;
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.classList.add('is-spinning');
      Promise.resolve()
        .then(fetchFn)
        .catch(function (err) { console.error('[IxRefresh]', err); })
        .then(function () {
          btn.disabled = false;
          btn.classList.remove('is-spinning');
        });
    });
  };

  // ── 1 · the bus ───────────────────────────────────────────
  var subs = {};

  X.on = function (topic, fn) {
    if (!topic || typeof fn !== 'function') return function () {};
    (subs[topic] = subs[topic] || []).push(fn);
    return function off() {
      var a = subs[topic] || [];
      var i = a.indexOf(fn);
      if (i > -1) a.splice(i, 1);
    };
  };

  X.emit = function (topic, data) {
    var a = (subs[topic] || []).slice();
    var ran = 0;
    for (var i = 0; i < a.length; i++) {
      try { a[i](data); ran++; }
      catch (e) { console.error(TAG, 'listener on "' + topic + '" threw:', e); }
    }
    return ran;
  };

  // ── 2 · the ledger ────────────────────────────────────────
  var L = {};   /* coll → id → { fields, at } */

  function same(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return (a == null ? '' : String(a)) === (b == null ? '' : String(b));
    if (typeof a === 'object' || typeof b === 'object') {
      try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; }
    }
    return String(a) === String(b);
  }

  function live(coll, id) {
    var c = L[coll]; if (!c) return null;
    var e = c[id]; if (!e) return null;
    if (Date.now() - e.at > LEDGER_TTL_MS) { delete c[id]; return null; }
    return e;
  }

  X.confirm = function (coll, id, fields) {
    if (!coll || !id || !fields) return;
    var c = L[coll] = L[coll] || {};
    var e = live(coll, id) || { fields: {}, at: 0 };
    for (var k in fields) {
      if (Object.prototype.hasOwnProperty.call(fields, k)) e.fields[k] = fields[k];
    }
    e.at = Date.now();
    c[id] = e;
  };

  X.settle = function (coll, id, readFields) {
    var e = live(coll, id);
    if (!e) return null;
    readFields = readFields || {};
    var left = {}, n = 0;
    for (var k in e.fields) {
      if (!Object.prototype.hasOwnProperty.call(e.fields, k)) continue;
      if (Object.prototype.hasOwnProperty.call(readFields, k) && same(readFields[k], e.fields[k])) continue;
      left[k] = e.fields[k]; n++;
    }
    if (!n) { delete L[coll][id]; return null; }
    e.fields = left;
    return left;
  };

  X.pending = function (coll, id) {
    var e = live(coll, id);
    return e ? e.fields : null;
  };

  X.pendingAll = function (coll) {
    var c = L[coll]; if (!c) return [];
    var out = [];
    Object.keys(c).forEach(function (id) {
      var e = live(coll, id);
      if (e) out.push({ id: id, fields: e.fields, at: e.at });
    });
    return out;
  };

  X.forget = function (coll, id) {
    if (L[coll]) delete L[coll][id];
  };

  X.version = '1.1.0';
})();
