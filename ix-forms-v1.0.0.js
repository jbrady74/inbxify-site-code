/* ix-forms-v1.0.0.js
   ════════════════════════════════════════════════════════════════
   INBXIFY ix series · ONE FORM for every surface (Publisher Portal S14, 24 Nov 2026)

   v1.0.0 — FIRST BUILD. Ruling (Jeff, 24 Nov, S13 ruling 1): a shared form module on top of ix-form-controls. Its first
   user is the Portal sale form (ps-obligations v1.0.7); every other form adopts it as it next ships (the ASF included,
   which changes its labels over then). It never restyles a control: selects and inputs are ix-picker-input, the small
   links are ix-revert, the buttons are ix-btn. Companion: ix-forms-v1.0.0.css.

   WHAT IT GIVES
   · THE GRID. A form is rows. Every row is its own grid of fixed, equal columns (4 by default), so every row starts at
     the left edge and a field's box fills its cell. A field spans 1, 2 or the full row. Class names are its own
     (ix-form-*), so the site's .grid / .f rules cannot reach them (the S13 sale form fault).
   · THE LABEL. Sentence case, bold, the body face (the Portal style). A required field shows a red star. When the field
     holds a change, the small "cancel" link sits at the right end of its label and puts that one field back
     (S14 answer 7: kept, under the standing cancel-link rule).
   · THE SAVE BAR. Left: what is being edited, "N fields changed", what is still needed, and any refusal. Right: Reset,
     Cancel, Save, fixed sizes, never moving. Reset puts back the opening snapshot and keeps the form open (greyed while
     0 fields changed); Cancel closes; Save saves (S13 ruling 2).
   · CHANGE TRACKING. IxForm.track(snapshot) keeps the opening snapshot and the current values. dirty(k) is true when a
     value differs from the snapshot; the field gets the gold edge (ix-picker-input--changed) and is counted.

   API
     var t = IxForm.track({ customer: '', product: '', … });  // the opening snapshot (deep-copied)
     t.cur, t.orig                     the current values and the snapshot
     t.set(k, v)  t.revert(k)  t.reset()  t.dirty(k)  t.changed(keys) → [k]  t.count(keys)
     IxForm.row([field, field, …], { cols: 4 })          one row (fields are the html of IxForm.field)
     IxForm.field({ key, label, html, span: 1 | 2 | 'full', req, hint, warn, changed, cancel: 'cancel', tip })
     IxForm.select({ key, options: [[v, l]] | [v], value, placeholder, changed, disabled, attrs, label })
     IxForm.input({ key, type, value, changed, attrs, label, min, step })
     IxForm.value(text, attrs)          a read-only value in a box the height of a control
     IxForm.bar({ what, changed, need, err, canSave, saving, saveLabel, resetLabel, cancelLabel })
     IxForm.wrap(innerHtml, { label })  the form root (class ix-form ix-own)
   Events are the page's own: the bar's buttons carry data-ixf-reset, data-ixf-cancel, data-ixf-save, and a field's
   cancel link carries data-ixf-revert="<key>".

   HARDCODING (provisional): HC-P-PP14-3 the defaults: 4 columns, the words Reset, Cancel, Save, cancel, and
   "{n} field(s) changed".
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.IxForm) return;
  var VERSION = '1.0.0';
  var W = { reset: 'Reset', cancel: 'Cancel', save: 'Save', saving: 'Saving…', fieldCancel: 'cancel', changed: '{n} field{s} changed' };   // HC-P-PP14-3
  var COLS = 4;                                                                                                                     // HC-P-PP14-3

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function copy(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

  // ── change tracking ──
  function track(snapshot) {
    var t = {
      orig: copy(snapshot || {}),
      cur: copy(snapshot || {}),
      set: function (k, v) { t.cur[k] = v; return t; },
      dirty: function (k) { return !same(t.cur[k], t.orig[k]); },
      revert: function (k) { t.cur[k] = copy(t.orig[k]); return t; },
      reset: function () { t.cur = copy(t.orig); return t; },
      changed: function (keys) { return (keys || Object.keys(t.cur)).filter(t.dirty); },
      count: function (keys) { return t.changed(keys).length; }
    };
    return t;
  }

  // ── drawing ──
  function spanCls(span) { return span === 'full' ? ' ix-form-sfull' : span === 2 ? ' ix-form-s2' : span === 3 ? ' ix-form-s3' : ''; }
  function field(f) {
    f = f || {};
    var cancel = f.changed && f.key && f.cancel !== false
      ? '<button type="button" class="ix-revert ix-form-rv" data-ixf-revert="' + esc(f.key) + '">' + esc(f.cancel || W.fieldCancel) + '</button>' : '';
    var lab = '<span class="ix-form-lab">' + (f.tip || esc(f.label || '')) + (f.req ? '<span class="ix-form-req" aria-hidden="true">*</span>' : '') + cancel + '</span>';
    return '<div class="ix-form-f' + spanCls(f.span) + (f.changed ? ' ix-form-chg' : '') + '"' + (f.key ? ' data-ixf-field="' + esc(f.key) + '"' : '') + '>' + lab +
      '<div class="ix-form-ctl">' + (f.html || '') + '</div>' +
      (f.hint ? '<span class="ix-form-hint">' + f.hint + '</span>' : '') +
      (f.warn ? '<span class="ix-form-warn">' + f.warn + '</span>' : '') + '</div>';
  }
  function row(fields, o) {
    o = o || {};
    var cols = o.cols || COLS;
    return '<div class="ix-form-row"' + (cols !== COLS ? ' style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))"' : '') + '>' + (fields || []).filter(Boolean).join('') + '</div>';
  }
  function select(s) {
    s = s || {};
    var opts = (s.options || []).map(function (x) {
      var v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x;
      return '<option value="' + esc(v) + '"' + (String(v) === String(s.value == null ? '' : s.value) ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('');
    return '<span class="ix-form-sel"><select class="ix-picker-input' + (s.changed ? ' ix-picker-input--changed' : '') + '"' +
      (s.key ? ' data-k="' + esc(s.key) + '"' : '') + (s.label ? ' aria-label="' + esc(s.label) + '"' : '') + (s.attrs ? ' ' + s.attrs : '') + (s.disabled ? ' disabled' : '') + '>' +
      (s.placeholder != null ? '<option value="">' + esc(s.placeholder) + '</option>' : '') + opts + '</select></span>';
  }
  function input(s) {
    s = s || {};
    return '<input class="ix-picker-input' + (s.changed ? ' ix-picker-input--changed' : '') + '" type="' + esc(s.type || 'text') + '"' +
      (s.key ? ' data-k="' + esc(s.key) + '"' : '') + (s.label ? ' aria-label="' + esc(s.label) + '"' : '') +
      (s.min != null ? ' min="' + esc(s.min) + '"' : '') + (s.step != null ? ' step="' + esc(s.step) + '"' : '') +
      ' value="' + esc(s.value == null ? '' : s.value) + '"' + (s.attrs ? ' ' + s.attrs : '') + (s.disabled ? ' disabled' : '') + '>';
  }
  function value(text, attrs) { return '<div class="ix-form-val"' + (attrs ? ' ' + attrs : '') + '>' + esc(text) + '</div>'; }
  function changedWords(n) { return W.changed.replace('{n}', n).replace('{s}', n === 1 ? '' : 's'); }
  function bar(b) {
    b = b || {};
    var n = b.changed || 0;
    return '<div class="ix-form-bar"><div class="ix-form-what">' +
        (b.what ? '<b>' + esc(b.what) + '</b>' : '') + '<span class="ix-form-count">' + esc(changedWords(n)) + '</span>' +
        (b.need ? '<span class="ix-form-need">' + esc(b.need) + '</span>' : '') +
        (b.err ? '<span class="ix-form-err" role="alert">' + esc(b.err) + '</span>' : '') + '</div>' +
      '<button type="button" class="ix-revert ix-form-reset" data-ixf-reset="1"' + (n && !b.saving ? '' : ' disabled') + '>' + esc(b.resetLabel || W.reset) + '</button>' +
      '<button type="button" class="ix-revert ix-form-cancel" data-ixf-cancel="1"' + (b.saving ? ' disabled' : '') + '>' + esc(b.cancelLabel || W.cancel) + '</button>' +
      '<button type="button" class="ix-btn ix-btn--primary ix-form-save" data-ixf-save="1"' + (b.canSave && !b.saving ? '' : ' disabled') + '>' + esc(b.saving ? W.saving : (b.saveLabel || W.save)) + '</button></div>';
  }
  function wrap(inner, o) { o = o || {}; return '<div class="ix-form ix-own"' + (o.label ? ' role="group" aria-label="' + esc(o.label) + '"' : '') + '>' + inner + '</div>'; }

  window.IxForm = { version: VERSION, track: track, row: row, field: field, select: select, input: input, value: value, bar: bar, wrap: wrap,
    changedWords: changedWords, esc: esc, words: W };
  try { console.log('[IxForm] v' + VERSION + ' loaded'); } catch (e) {}
})();
