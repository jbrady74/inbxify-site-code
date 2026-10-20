/* ix-ai-v1.1.0.js */
/* ============================================================
   ix-ai-v1.1.0.js — the shared AI writing modal (the "ix-ai" module)
   Companion stylesheet: ix-ai-v1.1.0.css
   First user: the Greeting tab in the IPP (ipp-greeting v1.0.0).

   v1.1.0 (20 Oct 2026, 106 Gap Interview S4): one prompt per field.
     - spec.fields[].prompt (optional): that field's own instructions
       (count, tones, length, rules). The Prompt pane shows the shared
       prompt (the issue facts and the house rules) at full size, and
       beside it one editable block per field. A field's Regenerate
       sends the shared prompt plus that field's block; the full spread
       sends all of them. Reset restores every block.
     - The two panes are no longer side by side: Spread and Prompt
       switch by the header tabs at every width (ix-ai css v1.1.0).
     - open() resolves { values, prompt, fieldPrompts }.
     - HC-AI-5: when a field has no prompt, the module writes the part
       line it always wrote (count, tones, max) and nothing else.
   v1.0.0 kept below.
   Next users: subject and preview lines (Send Setup), ASF teaser/summary.

   What it is (20 Oct 2026, 106 Gap Interview S3)
   One modal that turns "AI Generate fills the box" into "AI offers a
   spread, you choose, refine one field at a time, and see the prompt":
     - one Generate returns a spread per field (3 titles in three
       deliberate tones, 3 short greetings, 2 paragraphs, per the S7
       Greeting AI mockup v0.1 rulings);
     - each field has its own Regenerate with a "say what to change"
       note; other fields are untouched;
     - picking a candidate drops it into that field's edit box; the
       box is always editable; counts follow the box;
     - the prompt is shown at full size and is editable; Amend rewrites
       it from a plain-English note (a cheap model call, no spread) and
       highlights the changed words (ta-image-gen v1.0.9's critique
       loop, D-CB-10/11/12, moved to text); Reset returns the house
       prompt;
     - a session history lists each call;
     - Save is the only write, and it is the caller's: the modal
       resolves with the chosen values and the caller saves them the
       way it always did. Cancel resolves null.

   API
     IxAI.open(spec) -> Promise<{ values: {key: string}, prompt: string } | null>
     spec = {
       title:   'Write the greeting',
       context: 'Wyckoff Living Now · Oct 18 issue · 6 articles, 1 event',
       fields: [ { key, label, max, count: 3, tones: ['Warm','Playful','Straight'], cols: 3, rows: 1, value: 'current text', prompt: 'this field\'s own rules (optional, v1.1.0)' } ],
       prompt:  'the house prompt text (the issue facts are in it already)',
       ask:     function (promptText) -> Promise<string>   // the caller's model call, returns the text answer
       model:   'label shown in the Prompt pane' (optional)
     }
   The answer contract the module asks for is JSON:
     { "<key>": ["option", "option", ...], ... }   (one array per field asked)
   and for Amend:
     the rewritten prompt as plain text.

   HC rows: HC-AI-1 candidate counts and tones come from the caller's
   spec (no module default beyond 1 candidate); HC-AI-2 the amend
   instruction text lives here; HC-AI-3 the modal is one instance at a
   time (a second open() while one is up rejects).
   ============================================================ */
(function () {
  'use strict';
  var VERSION = '1.1.0', FILE = 'ix-ai-v1.1.0.js';
  if (window.IxAI && window.IxAI.VERSION) { try { console.warn('[ix-ai] ' + window.IxAI.VERSION + ' already loaded; ' + FILE + ' skipped'); } catch (e) {} return; }

  var S = null;   // the open session: { spec, el, cands, chosen, edit, prompt, prior, note, busy, hist, resolve }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function q(sel, root) { return (root || (S && S.el) || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || (S && S.el) || document).querySelectorAll(sel)); }
  function fld(k) { return S.spec.fields.filter(function (f) { return f.key === k; })[0]; }
  function when() { return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
  function fold(v) { return String(v == null ? '' : v).trim().replace(/\s*[\r\n]+\s*/g, ' '); }

  // cut to fit: at the last sentence end under the limit when that keeps most of it, else the last word
  function trim(v, max) {
    v = fold(v); if (!max || v.length <= max) return v;
    var cut = v.slice(0, max), m = cut.match(/^[\s\S]*[.!?](?=\s|$)/);
    if (m && m[0].length > max * 0.6) return m[0].trim();
    var sp = cut.lastIndexOf(' '); return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:\u2014-]+$/, '').trim();
  }

  // words in b that are not in a, as a Set of lowercase tokens (for the changed-words highlight)
  function added(a, b) {
    var seen = {}; String(a || '').toLowerCase().split(/\s+/).forEach(function (w) { seen[w.replace(/[^\w']/g, '')] = 1; });
    var out = {}; String(b || '').toLowerCase().split(/\s+/).forEach(function (w) { var t = w.replace(/[^\w']/g, ''); if (t && !seen[t]) out[t] = 1; });
    return out;
  }
  function promptHtml(text, hl) {
    if (!hl) return esc(text);
    return esc(text).split(/(\s+)/).map(function (w) { var t = w.toLowerCase().replace(/[^\w']/g, ''); return t && hl[t] ? '<mark>' + w + '</mark>' : w; }).join('');
  }

  // ── model calls (through spec.ask) ──
  function parseJson(text) {
    var m = String(text || '').replace(/```json|```/g, '').match(/\{[\s\S]*\}/);
    try { return m ? JSON.parse(m[0]) : null; } catch (e) { return null; }
  }
  function askSpread(keys, note) {
    var lines = keys.map(function (k) { var f = fld(k), fp = fold(S.fprompt[k]); return '- ' + k + ': ' + (f.count || 1) + ' option' + ((f.count || 1) > 1 ? 's' : '') + (f.tones && f.tones.length ? ', each a different tone, in this order: ' + f.tones.join(', ') : '') + (f.max ? ', each at most ' + f.max + ' characters' : '') + '.' + (fp ? ' ' + fp : ''); });   // v1.1.0: the field's own prompt rides on its part line (HC-AI-5)
    var p = S.prompt + '\n\nReturn these parts only:\n' + lines.join('\n') +
      (note ? '\n\nThe editor asks: ' + note + '\n' : '') +
      '\nAnswer with only a JSON object, no other text, one array per part: {' + keys.map(function (k) { return '"' + k + '": ["...", "..."]'; }).join(', ') + '}';
    return S.spec.ask(p).then(function (text) {
      var o = parseJson(text); if (!o) throw new Error('the answer was not the JSON asked for');
      var out = {};
      keys.forEach(function (k) {
        var f = fld(k), arr = Array.isArray(o[k]) ? o[k] : (typeof o[k] === 'string' ? [o[k]] : []);
        arr = arr.map(function (v) { return trim(v, f.max); }).filter(Boolean);
        if (!arr.length) throw new Error('no ' + (f.label || k).toLowerCase() + ' came back');
        out[k] = arr.slice(0, f.count || 1);
      });
      return out;
    });
  }
  function askAmend(prompt, note) {                                        // HC-AI-2
    var p = 'Below is a prompt an editor uses to have you write newsletter text. Rewrite the prompt to carry out this request from the editor, changing as little as possible and keeping every fact and rule that the request does not touch:\n\n' + note +
      '\n\nAnswer with the rewritten prompt only, no commentary, no code fence.\n\n---- PROMPT ----\n' + prompt;
    return S.spec.ask(p).then(function (text) { var t = String(text || '').replace(/```[a-z]*\n?|```/g, '').trim(); if (!t) throw new Error('the amended prompt came back empty'); return t; });
  }

  // ── state ──
  function pick(k, i) { var v = S.cands[k][i]; S.chosen[k] = i; S.edit[k] = v; paint(); var box = q('[data-ixai-edit="' + k + '"]'); if (box) box.value = v; }
  function log(text) { S.hist.push({ at: when(), text: text }); }
  function setBusy(b, what) { S.busy = b ? (what || 'Working\u2026') : ''; paint(); }
  function fail(e) { S.err = (e && e.message) || String(e); setBusy(false); }

  function generate(keys, note) {
    if (S.busy) return;
    S.err = '';
    setBusy(true, keys.length === S.spec.fields.length ? 'Writing the spread\u2026' : 'Rewriting ' + fld(keys[0]).label.toLowerCase() + '\u2026');
    askSpread(keys, note).then(function (out) {
      keys.forEach(function (k) { S.cands[k] = out[k]; S.chosen[k] = -1; });
      log(keys.length === S.spec.fields.length ? 'Spread written' + (note ? ': \u201c' + note + '\u201d' : '') : fld(keys[0]).label + ' again' + (note ? ': \u201c' + note + '\u201d' : ''));
      // first spread: pre-pick the first option of any field with no text yet
      keys.forEach(function (k) { if (!fold(S.edit[k])) { S.chosen[k] = 0; S.edit[k] = S.cands[k][0]; } });
      S.busy = ''; paint(true);
    }).catch(fail);
  }
  function amend() {
    if (S.busy) return;
    var pEl = q('[data-ixai-prompt]'), nEl = q('[data-ixai-amend-note]');
    if (pEl) S.prompt = pEl.value;
    var note = nEl ? nEl.value.trim() : '';
    if (!note) { S.err = 'Say what you want changed in the prompt first.'; paint(); return; }
    var before = S.prompt; S.err = '';
    setBusy(true, 'Amending the prompt\u2026');
    askAmend(before, note).then(function (p) {
      S.prior = before; S.prompt = p; S.hl = added(before, p); S.note = '';
      log('Prompt amended: \u201c' + note + '\u201d');
      S.busy = ''; paint(true);
    }).catch(fail);
  }
  function resetPrompt() { S.prior = ''; S.hl = null; S.prompt = S.spec.prompt; S.spec.fields.forEach(function (f) { S.fprompt[f.key] = f.prompt || ''; }); log('Prompt reset to the house prompt'); paint(true); }   // v1.1.0: field prompts too

  function values() { var o = {}; S.spec.fields.forEach(function (f) { var el = q('[data-ixai-edit="' + f.key + '"]'); o[f.key] = fold(el ? el.value : S.edit[f.key]); }); return o; }
  function done(ok) {
    if (!S) return;
    var out = ok ? { values: values(), prompt: S.prompt, fieldPrompts: Object.assign({}, S.fprompt) } : null;   // v1.1.0
    var r = S.resolve, el = S.el; S = null;
    el.classList.remove('is-open');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 180);
    document.documentElement.classList.remove('ixai-lock');
    r(out);
  }

  // ── markup ──
  function html() {
    var sp = S.spec;
    var fields = sp.fields.map(function (f) {
      return '<section class="ixai-f" data-ixai-f="' + esc(f.key) + '">' +
        '<div class="ixai-eb"><span>' + esc(f.label) + '</span><span class="ixai-cnt" data-ixai-cnt="' + esc(f.key) + '"></span></div>' +
        '<div class="ixai-cands" data-ixai-cands="' + esc(f.key) + '" style="--ixai-cols:' + (f.cols || f.count || 1) + '"></div>' +
        '<textarea class="ixai-edit" data-ixai-edit="' + esc(f.key) + '" rows="' + (f.rows || 2) + '"' + (f.max ? ' maxlength="' + f.max + '"' : '') + ' placeholder="Pick an option above, or write your own"></textarea>' +
        '<div class="ixai-redo"><input type="text" class="ixai-in" data-ixai-note="' + esc(f.key) + '" placeholder="Say what to change, then regenerate ' + esc(f.label.toLowerCase()) + '"><button type="button" class="ix-btn ix-btn--secondary ixai-sm" data-ixai-regen="' + esc(f.key) + '">\u21bb ' + esc(f.short || f.label) + '</button></div>' +
        '</section>';
    }).join('');
    return '<div class="ixai-dlg" role="dialog" aria-modal="true" aria-label="' + esc(sp.title) + '">' +
      '<header class="ixai-head"><h2 class="ixai-h">' + esc(sp.title) + '</h2><p class="ixai-ctx">' + esc(sp.context || '') + '</p><div class="ixai-sp"></div>' +
        '<div class="ixai-seg" role="tablist"><button type="button" class="is-on" data-ixai-tab="cands" role="tab">Spread</button><button type="button" data-ixai-tab="prompt" role="tab">Prompt</button></div>' +
        '<button type="button" class="ixai-x" data-ixai-cancel aria-label="Cancel">\u00d7</button></header>' +
      '<p class="ixai-busy" data-ixai-busy hidden></p><p class="ixai-err" data-ixai-err hidden></p>' +
      '<div class="ixai-body">' +
        '<div class="ixai-left" data-ixai-pane="cands">' + fields +
          '<p class="ixai-note">Picking an option puts it in the box; the box is yours to edit. Counts follow the box.</p></div>' +
        '<div class="ixai-right" data-ixai-pane="prompt">' +
          '<div class="ixai-pcol">' +
            '<div class="ixai-eb ixai-eb--big"><span>Shared prompt</span><span class="ixai-cnt">' + esc(sp.model || '') + '</span><small>The issue facts and the house rules. Every call reads this first.</small></div>' +
            '<textarea class="ixai-prompt" data-ixai-prompt spellcheck="false"></textarea>' +
            '<div class="ixai-prompt-hl" data-ixai-prompt-hl hidden></div>' +
            '<div class="ixai-redo"><input type="text" class="ixai-in" data-ixai-amend-note placeholder="Tell it how to change the prompt, not the words"><button type="button" class="ix-btn ix-btn--secondary ixai-sm" data-ixai-amend>Amend</button></div>' +
            '<p class="ixai-note">Amend rewrites the shared prompt from your note and marks what changed; it writes no text. Edit any prompt directly if you prefer. <a href="#" data-ixai-reset>Reset every prompt to the house version</a>.</p>' +
          '</div>' +
          '<div class="ixai-fcol">' +
            '<div class="ixai-eb ixai-eb--big"><span>One prompt per field</span><small>Each field\u2019s own rules. Regenerate for a field reads the shared prompt plus this.</small></div>' +
            sp.fields.map(function (f) { return '<div class="ixai-fp"><b>' + esc(f.label) + '</b><textarea class="ixai-fprompt" data-ixai-fprompt="' + esc(f.key) + '" rows="4" spellcheck="false"></textarea></div>'; }).join('') +   // v1.1.0
            '<div class="ixai-eb ixai-eb--hist"><span>This session</span></div><div class="ixai-hist" data-ixai-hist></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<footer class="ixai-foot"><button type="button" class="ix-btn ix-btn--secondary" data-ixai-all>\u2728 Write the spread again</button><span class="ixai-msg">Nothing is saved until you click Use. Cancel leaves things as they were.</span><div class="ixai-sp"></div>' +
        '<button type="button" class="ix-revert" data-ixai-cancel>Cancel</button><button type="button" class="ix-btn ix-btn--primary" data-ixai-use>Use this greeting</button></footer>' +
      '</div>';
  }

  function paint(values) {
    if (!S) return;
    S.spec.fields.forEach(function (f) {
      var k = f.key, c = q('[data-ixai-cands="' + k + '"]');
      if (c) c.innerHTML = (S.cands[k] || []).map(function (v, i) {
        var tone = f.tones && f.tones[i] ? f.tones[i] : (S.cands[k].length > 1 ? 'Option ' + (i + 1) : '');
        return '<button type="button" class="ixai-cand' + (S.chosen[k] === i ? ' is-on' : '') + '" data-ixai-pick="' + esc(k) + '" data-ixai-i="' + i + '"><span class="ixai-tone">' + esc(tone) + '<em>' + v.length + (f.max ? ' / ' + f.max : '') + '</em></span>' + esc(v) + '</button>';
      }).join('') || '<p class="ixai-empty">No options yet.</p>';
      var e = q('[data-ixai-edit="' + k + '"]');
      if (e) { if (values) e.value = S.edit[k] || ''; e.classList.toggle('is-set', !!fold(e.value)); var n = q('[data-ixai-cnt="' + k + '"]'); if (n) n.textContent = (f.max ? e.value.length + ' / ' + f.max : e.value.length + ' chars'); }
      var rb = q('[data-ixai-regen="' + k + '"]'); if (rb) rb.disabled = !!S.busy;
    });
    var p = q('[data-ixai-prompt]'), hl = q('[data-ixai-prompt-hl]');
    if (p && values) p.value = S.prompt;
    if (values) S.spec.fields.forEach(function (f) { var fe = q('[data-ixai-fprompt="' + f.key + '"]'); if (fe) fe.value = S.fprompt[f.key] || ''; });   // v1.1.0
    if (hl) { hl.hidden = !S.hl; if (S.hl) hl.innerHTML = promptHtml(S.prompt, S.hl); }
    if (p) p.hidden = !!S.hl;                                      // after an Amend the marked copy shows; clicking it reopens the editor
    var h = q('[data-ixai-hist]'); if (h) h.innerHTML = S.hist.map(function (r) { return '<div class="ixai-row"><span>' + esc(r.at) + '</span>' + esc(r.text) + '</div>'; }).join('') || '<div class="ixai-row ixai-row--none">Nothing yet.</div>';
    var b = q('[data-ixai-busy]'); if (b) { b.hidden = !S.busy; b.textContent = S.busy; }
    var er = q('[data-ixai-err]'); if (er) { er.hidden = !S.err; er.textContent = S.err; }
    ['[data-ixai-all]', '[data-ixai-amend]', '[data-ixai-use]'].forEach(function (s) { var el = q(s); if (el) el.disabled = !!S.busy; });
    var use = q('[data-ixai-use]'); if (use && !S.busy) use.disabled = !S.spec.fields.every(function (f) { var e = q('[data-ixai-edit="' + f.key + '"]'); return e && fold(e.value); });
    S.el.classList.toggle('is-busy', !!S.busy);
  }

  function wire() {
    S.el.addEventListener('click', function (e) {
      var t = e.target, el;
      if ((el = t.closest('[data-ixai-pick]'))) { pick(el.getAttribute('data-ixai-pick'), Number(el.getAttribute('data-ixai-i'))); return; }
      if ((el = t.closest('[data-ixai-regen]'))) { var k = el.getAttribute('data-ixai-regen'), n = q('[data-ixai-note="' + k + '"]'); generate([k], n ? n.value.trim() : ''); return; }
      if ((el = t.closest('[data-ixai-all]'))) { generate(S.spec.fields.map(function (f) { return f.key; }), ''); return; }
      if ((el = t.closest('[data-ixai-amend]'))) { amend(); return; }
      if ((el = t.closest('[data-ixai-reset]'))) { e.preventDefault(); resetPrompt(); return; }
      if ((el = t.closest('[data-ixai-prompt-hl]'))) { S.hl = null; paint(); var p = q('[data-ixai-prompt]'); if (p) p.focus(); return; }
      if ((el = t.closest('[data-ixai-tab]'))) { var tab = el.getAttribute('data-ixai-tab'); qa('[data-ixai-tab]').forEach(function (b) { b.classList.toggle('is-on', b === el); }); S.el.setAttribute('data-ixai-show', tab); return; }
      if ((el = t.closest('[data-ixai-use]'))) { if (!S.busy) done(true); return; }
      if ((el = t.closest('[data-ixai-cancel]'))) { if (!S.busy || window.confirm('A call is still running. Cancel anyway?')) done(false); return; }
      if (t === S.el) { /* backdrop click does nothing: a stray click must not lose a spread */ }
    });
    S.el.addEventListener('input', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-ixai-edit')) { var k = t.getAttribute('data-ixai-edit'); S.edit[k] = t.value; if (S.chosen[k] >= 0 && t.value !== S.cands[k][S.chosen[k]]) S.chosen[k] = -1; paint(); }
      else if (t.hasAttribute('data-ixai-prompt')) { S.prompt = t.value; }
      else if (t.hasAttribute('data-ixai-fprompt')) { S.fprompt[t.getAttribute('data-ixai-fprompt')] = t.value; }   // v1.1.0
    });
    S.el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); if (!S.busy) done(false); }
      if (e.key === 'Enter' && e.target.hasAttribute && e.target.hasAttribute('data-ixai-note')) { e.preventDefault(); var k = e.target.getAttribute('data-ixai-note'); generate([k], e.target.value.trim()); }
      if (e.key === 'Enter' && e.target.hasAttribute && e.target.hasAttribute('data-ixai-amend-note')) { e.preventDefault(); amend(); }
      if (e.key === 'Enter' && e.target.hasAttribute && e.target.hasAttribute('data-ixai-edit') && e.target.getAttribute('rows') === '1') e.preventDefault();
    });
  }

  function open(spec) {
    if (S) return Promise.reject(new Error('ix-ai is already open'));         // HC-AI-3
    if (!spec || !spec.fields || !spec.fields.length || typeof spec.ask !== 'function') return Promise.reject(new Error('ix-ai: spec needs fields[] and ask()'));
    return new Promise(function (resolve) {
      var el = document.createElement('div'); el.className = 'ixai-ov'; el.setAttribute('data-ixai-show', 'cands');
      S = { spec: spec, el: el, cands: {}, chosen: {}, edit: {}, fprompt: {}, prompt: spec.prompt || '', prior: '', hl: null, note: '', busy: '', err: '', hist: [], resolve: resolve };
      spec.fields.forEach(function (f) { S.cands[f.key] = []; S.chosen[f.key] = -1; S.edit[f.key] = fold(f.value || ''); S.fprompt[f.key] = f.prompt || ''; });   // fprompt v1.1.0
      el.innerHTML = html();
      document.body.appendChild(el);
      document.documentElement.classList.add('ixai-lock');
      wire(); paint(true);
      requestAnimationFrame(function () { el.classList.add('is-open'); });
      if (spec.autoGenerate !== false) generate(spec.fields.map(function (f) { return f.key; }), '');
    });
  }

  window.IxAI = { VERSION: VERSION, FILE: FILE, open: open, trim: trim, isOpen: function () { return !!S; } };
  try { console.log('[ix-ai] ' + FILE + ' ready'); } catch (e) {}
})();
