/* ix-ai-v1.4.1.js */
/* ============================================================
   ix-ai-v1.4.1.js — the shared AI writing modal (the "ix-ai" module)
   Companion stylesheet: ix-ai-v1.3.1.css (unchanged)
   v1.4.1 (12 Nov 2026, Jeff on WLN-124A Words: "look at the selection of step 1 - create a preview text that does not
   reference same topic"; the preview came back on the subject's items anyway):
     REGENERATE SEES THE OTHER PARTS AS THEY STAND IN THE WINDOW.
     - Until now a part's Regenerate sent the session prompt (built when the window opened, from SAVED words only), the
       part's own rules and the note. A subject picked or typed in the window was never sent, so "do not repeat the
       subject" asked the model to avoid text it could not see.
     - Now a Regenerate (any call that writes fewer parts than the window holds) adds the other parts as they stand:
       the New version box if it holds text, else the Current. The model is told not to name the same items or echo
       their wording (HC-AI-11 the words of that line).
     KEEP-APART PARTS ARE CHECKED BY CODE, NOT HOPED FOR.
     - spec.fields[].apart (optional): keys of parts this part must not share an item with (ipp-words: subject and
       preview, both ways). spec.shared(textA, textB) (optional, the caller's): the names of the items both texts
       mention. Without spec.shared nothing is checked.
     - Measure: an option that shares an item with a kept-apart part not being written in this call counts as a miss,
       like an option outside its range. Repair: it goes back in the same repair round with the shared item named and
       the issue facts in front of the model ("swap it for a different item"). Keep: an option in range that shares
       nothing wins; one that only fits the range comes next.
     - The mark is live: a shown option that shares an item with what is now in the other part's box reads
       "· repeats subject line: <item>" in the salmon count, and it follows the box as it changes.
     - A full spread writes the kept-apart parts together, so they are not checked against each other there; the marks
       still show once one of them is picked.
   v1.4.0 kept below. */
/* ------------------------------------------------------------
   v1.4.0 (26 Oct 2026, November Build, Jeff: "they routinely miss the
   count low or high and require much too much rework"):
     LENGTHS ARE MADE TO FIT BY CODE, NOT HOPED FOR.
     - Over-ask: each part asks for twice the options it shows (each tone
       twice, in order), so there is a choice before anything is judged.
     - Measure: code counts every option against the part's min and max.
     - Repair: options outside the range go back to the model in one call,
       each with its exact length and an instruction in plain numbers
       ("58 characters; must be 40 to 50: cut about 13"), keeping its
       meaning and tone. Up to two repair rounds (HC-AI-9).
     - Keep: per tone (or per option slot), the first option in range is
       shown. Only when nothing fits after the repairs does an out-of-range
       option appear, marked short or long as before.
     - No more hard cut: v1.3.1 chopped long options at the last space,
       which left half-sentences to fix by hand. Nothing is chopped now.
     - Each part line also gives the range in words (characters / 5.5,
       HC-AI-10), which the model tracks better than characters.
     - The "every option short" single retry (HC-AI-6) is retired; the
       repair rounds cover it, short and long alike.
   v1.3.1 (20 Oct 2026, 106 Gap Interview S4, Jeff: "I accidentally
   selected one of the choices in a box I didn't want to change"):
     - KEEP THE CURRENT ONE. Once a part's box holds a new version
       (picked or typed) its New version row shows a small text link,
       "Keep the current one", at the right of the count. It empties the
       box, unmarks the chosen option and takes the part out of the Use
       count, so that part is left alone when Use is pressed. The link
       is absent while the box is empty. Nothing else changes.
   v1.3.0 kept below.
   v1.3.0 (20 Oct 2026, Jeff's review of the six-part session):
     - Each part shows CURRENT at the top, read-only (spec.fields[].value
       is the current text, never put in the box). Under it the options,
       then the NEW VERSION box, which starts empty. Clicking an option
       fills the box; what is in the box when Use is pressed is what the
       caller gets, picked or typed.
     - An empty box means keep the current one. Use writes only the parts
       with a new version and says how many ("Use 2 new parts"); it is
       off until at least one part has a new version and every filled box
       is in range. open() resolves values with ONLY those keys (the
       caller leaves the others alone).
     - No option is pre-picked any more.
     - Each part is numbered "n of N"; cards carry a colour edge per
       group (the first three groups get three colours, HC-AI-8) and
       more air between them.
   v1.2.1 kept below.
   v1.2.1 (20 Oct 2026, Jeff's first Words session on 901A: "the answer
   was not the JSON asked for"):
     - spec.ask(prompt, kind) now gets a second argument, 'json' for a
       spread and 'text' for Amend, so the caller can steer the model
       (ipp-words v1.0.1 prefills the assistant turn with "{" on json
       calls, which makes the answer start as JSON).
     - parseJson() is forgiving: it strips code fences, takes the text
       from the first "{" to the last "}", and if that still fails it
       repairs the usual slips (a raw line break inside a string, a
       trailing comma) before giving up.
     - When the answer still cannot be read, the error shows its first
       160 characters and its length, so the cause is visible instead
       of guessed (HC-AI-7: the 160).
     - The spread request says "no counting shown, no commentary".
   First user: the Words tab in the IPP (ipp-words v1.0.0, the Greeting
   tab grown to six parts).

   v1.2.0 (20 Oct 2026, 106 Gap Interview S4): strict lengths, groups,
   the caller's Use label.
     - spec.fields[].min (optional): a floor as well as a ceiling. The
       count under the box reads "n / 81–99" and turns salmon outside
       the range; a candidate outside it carries a "short" or "long"
       mark; Use stays off until every box is in range (the caller's
       Save has the same gate, so what leaves the modal always fits).
       The part line tells the model "between min and max characters"
       and, when a field comes back with every option under its floor,
       the module asks for that field once more on its own with a note
       (HC-AI-6: one automatic retry per field per spread).
     - spec.fields[].group (optional): a heading written once above the
       first field of each group, in the field order given ("In the
       inbox", "At the top", "At the end"). The Prompt pane keeps one
       block per field.
     - spec.useLabel (optional): the Use button's words; default "Use
       these". spec.fields[].rows 1 still blocks Enter.
     - The answer contract and open() result are unchanged.
   v1.1.0 kept below.

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
       shared:  function (textA, textB) -> [item names both mention]   // optional, v1.4.1; fields[].apart: [keys]
     }
   The answer contract the module asks for is JSON:
     { "<key>": ["option", "option", ...], ... }   (one array per field asked)
   and for Amend:
     the rewritten prompt as plain text.

   HC rows: HC-AI-6 one automatic retry per field when every option is
   under min (v1.2.0); HC-AI-1 candidate counts and tones come from the caller's
   spec (no module default beyond 1 candidate); HC-AI-2 the amend
   instruction text lives here; HC-AI-3 the modal is one instance at a
   time (a second open() while one is up rejects).
   ============================================================ */
(function () {
  'use strict';
  var VERSION = '1.4.1', FILE = 'ix-ai-v1.4.1.js';
  if (window.IxAI && window.IxAI.VERSION) { try { console.warn('[ix-ai] ' + window.IxAI.VERSION + ' already loaded; ' + FILE + ' skipped'); } catch (e) {} return; }

  var S = null;   // the open session: { spec, el, cands, chosen, edit, prompt, prior, note, busy, hist, resolve }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function q(sel, root) { return (root || (S && S.el) || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || (S && S.el) || document).querySelectorAll(sel)); }
  function fld(k) { return S.spec.fields.filter(function (f) { return f.key === k; })[0]; }
  function when() { return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
  function fold(v) { return String(v == null ? '' : v).trim().replace(/\s*[\r\n]+\s*/g, ' '); }
  // v1.2.0: 'short' | 'long' | '' for a value against its field's min and max
  function fit(f, v) { var n = fold(v).length; if (f.min && n < f.min) return 'short'; if (f.max && n > f.max) return 'long'; return ''; }
  function limitTxt(f) { return f.min && f.max ? f.min + '\u2013' + f.max : f.max ? '' + f.max : ''; }

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
  function parseJson(text) {                                             // v1.2.1: forgiving
    var t = String(text || '').replace(/```[a-z]*\n?|```/g, '').trim();
    var a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b <= a) return null;
    var body = t.slice(a, b + 1);
    try { return JSON.parse(body); } catch (e) {}
    // repairs: raw line breaks inside strings become spaces; trailing commas go
    var fixed = '', inStr = false, escp = false;
    for (var i = 0; i < body.length; i++) {
      var ch = body.charAt(i);
      if (inStr) { if (escp) { escp = false; fixed += ch; continue; } if (ch === '\\') { escp = true; fixed += ch; continue; } if (ch === '"') inStr = false; if (ch === '\n' || ch === '\r') ch = ' '; fixed += ch; continue; }
      if (ch === '"') inStr = true;
      fixed += ch;
    }
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(fixed); } catch (e2) { return null; }
  }
  function tail(text) { var t = String(text || ''); return (t.length ? '\u201c' + t.slice(0, 160).replace(/\s+/g, ' ') + (t.length > 160 ? '\u2026' : '') + '\u201d (' + t.length + ' characters)' : 'an empty answer'); }   // HC-AI-7
  // v1.4.0: words beside characters (HC-AI-10)
  function wordsTxt(f) { var lo = f.min ? Math.max(1, Math.round(f.min / 5.5)) : 0, hi = Math.max(1, Math.round(f.max / 5.5)); return lo ? 'about ' + lo + ' to ' + hi + ' words' : 'at most about ' + hi + ' words'; }
  function rangeLine(f) { return f.min && f.max ? 'between ' + f.min + ' and ' + f.max + ' characters including spaces (' + wordsTxt(f) + ')' : f.max ? 'at most ' + f.max + ' characters including spaces (' + wordsTxt(f) + ')' : ''; }
  function slots(f) { var n = f.count || 1; return f.tones && f.tones.length ? f.tones.slice(0, n) : Array.apply(null, Array(n)).map(function () { return ''; }); }
  // v1.4.1: what a part holds right now in the window: the New version box, else the Current
  function nowVal(k) { var e = q('[data-ixai-edit="' + k + '"]'); var v = fold(e ? e.value : S.edit[k]); return v || fold((fld(k) || {}).value || ''); }
  // v1.4.1: the items this text shares with the kept-apart parts (skip: keys being written in this call)
  function clashOf(f, text, skip) {
    if (!f || !f.apart || !f.apart.length || typeof S.spec.shared !== 'function') return null;
    for (var i = 0; i < f.apart.length; i++) {
      var a = f.apart[i]; if (skip && skip.indexOf(a) >= 0) continue;
      var o = fld(a); if (!o) continue;
      var other = nowVal(a); if (!other) continue;
      var names = []; try { names = S.spec.shared(text, other) || []; } catch (e) { names = []; }
      if (names.length) return { key: a, label: o.label || a, names: names };
    }
    return null;
  }
  function okOpt(f, text, skip) { return !fit(f, text) && !clashOf(f, text, skip); }
  function othersBlock(keys) {                                            // HC-AI-11: the words of this line
    if (keys.length >= S.spec.fields.length) return '';
    var rows = S.spec.fields.filter(function (f) { return keys.indexOf(f.key) < 0; }).map(function (f) { var v = nowVal(f.key); return v ? '- ' + f.label + ': \u201c' + v + '\u201d' : ''; }).filter(Boolean);
    return rows.length ? '\n\nThe other parts as they stand now (the editor\u2019s choices). What you write must not name the same items as these, and must not echo their wording:\n' + rows.join('\n') + '\n' : '';
  }
  function askSpread(keys, note) {
    var lines = keys.map(function (k) {
      var f = fld(k), fp = fold(S.fprompt[k]), sl = slots(f), n = sl.length * 2;          // v1.4.0: twice the options shown
      return '- ' + k + ': ' + n + ' options' + (f.tones && f.tones.length ? ', two in each tone, in this order: ' + sl.map(function (t) { return t + ', ' + t; }).join(', ') : '') +
        (rangeLine(f) ? ', each ' + rangeLine(f) : '') + '.' + (fp ? ' ' + fp : '');
    });
    var p = S.prompt + othersBlock(keys) + '\n\nReturn these parts only:\n' + lines.join('\n') +
      (note ? '\n\nThe editor asks: ' + note + '\n' : '') +
      '\nAnswer with only a JSON object, no other text, no commentary, one array per part: {' + keys.map(function (k) { return '"' + k + '": ["...", "..."]'; }).join(', ') + '}';
    return S.spec.ask(p, 'json').then(function (text) {
      var o = parseJson(text); if (!o) throw new Error('the answer was not the JSON asked for: ' + tail(text));
      var out = {};
      keys.forEach(function (k) {
        var f = fld(k), arr = Array.isArray(o[k]) ? o[k] : (typeof o[k] === 'string' ? [o[k]] : []), per = f.tones && f.tones.length ? 2 : 0;
        arr = arr.map(function (v, i) { return { text: fold(v), slot: per ? Math.floor(i / 2) : -1 }; }).filter(function (c) { return !!c.text; });
        if (!arr.length) throw new Error('no ' + (f.label || k).toLowerCase() + ' came back');
        out[k] = arr;
      });
      return out;
    });
  }
  // v1.4.0: send every option outside its range back with its numbers (HC-AI-9: two rounds)
  function repair(keys, pool) {                                          // v1.4.1: clashes too
    var bad = [];
    keys.forEach(function (k) {
      var f = fld(k), okSlot = {}, okAny = pool[k].filter(function (c) { return okOpt(f, c.text, keys); }).length;
      pool[k].forEach(function (c) { if (okOpt(f, c.text, keys)) okSlot[c.slot] = 1; });
      pool[k].forEach(function (c, i) {
        if (okOpt(f, c.text, keys)) return;
        if (c.slot >= 0 ? okSlot[c.slot] : okAny >= slots(f).length) return;   // that slot already has one that fits
        bad.push({ k: k, i: i, c: c, f: f, cl: clashOf(f, c.text, keys) });
      });
    });
    if (!bad.length) return Promise.resolve(false);
    var anyCl = bad.some(function (x) { return !!x.cl; });
    var list = bad.map(function (x, j) {
      var n = x.c.text.length, f = x.f, ft = fit(f, x.c.text), rng = f.min ? f.min + ' to ' + f.max : 'at most ' + f.max;
      var need = ft === 'long' ? 'cut about ' + (n - f.max + 2) + ' characters' : ft === 'short' ? 'add about ' + (f.min - n + 2) + ' characters' : '';
      var cl = x.cl ? 'it names ' + x.cl.names.map(function (m) { return '\u201c' + m + '\u201d'; }).join(' and ') + ', which the ' + x.cl.label.toLowerCase() + ' (\u201c' + nowVal(x.cl.key) + '\u201d) already names: replace that with a different item from the issue' : '';
      return (j + 1) + '. [' + x.k + '] ' + JSON.stringify(x.c.text) + ' is ' + n + ' characters and must be ' + rng + '. ' + [cl, need].filter(Boolean).join('; ') + '.';
    }).join('\n');
    var p = (anyCl ? S.prompt + '\n\n----\n\n' : '') +
      'You are fixing newsletter text. Rewrite each line below as its note says, so it also lands inside its range, keeping its tone and changing as little as the note allows. Count characters including spaces. ' +
      (anyCl ? 'Use only facts from the issue above.' : 'Do not add facts.') + '\n\n' + list +
      '\n\nAnswer with only a JSON array of the rewritten lines, in the same order, no commentary: ["...", "..."]';
    return S.spec.ask(p, 'json').then(function (text) {
      var t = String(text || '').replace(/```[a-z]*\n?|```/g, '').trim(), a = t.indexOf('['), b = t.lastIndexOf(']'), arr = null;
      try { arr = JSON.parse(t.slice(a, b + 1)); } catch (e) { arr = null; }
      if (!Array.isArray(arr)) return false;
      bad.forEach(function (x, j) { var v = fold(arr[j]); if (v) pool[x.k][x.i] = { text: v, slot: x.c.slot }; });
      return true;
    }, function () { return false; });
  }
  // v1.4.0: per slot, the first option in range; else the nearest miss
  function choose(f, cands, skip) {                                      // v1.4.1: in range and apart first, then in range
    var sl = slots(f), used = {}, out = [];
    var dist = function (c) { var n = c.text.length; return f.min && n < f.min ? f.min - n : f.max && n > f.max ? n - f.max : 0; };
    sl.forEach(function (t, si) {
      var mine = cands.filter(function (c, i) { return !used[i] && (c.slot < 0 || c.slot === si); });
      var best = mine.filter(function (c) { return okOpt(f, c.text, skip); }), good = mine.filter(function (c) { return !fit(f, c.text); });
      var pickC = best[0] || good[0] || mine.slice().sort(function (a, b) { return dist(a) - dist(b); })[0];
      if (!pickC) { var rest = cands.filter(function (c, i) { return !used[i]; }); pickC = rest.filter(function (c) { return okOpt(f, c.text, skip); })[0] || rest.filter(function (c) { return !fit(f, c.text); })[0] || rest[0]; }
      if (pickC) { used[cands.indexOf(pickC)] = 1; out.push(pickC.text); }
    });
    return out.filter(Boolean);
  }
  function askAmend(prompt, note) {                                        // HC-AI-2
    var p = 'Below is a prompt an editor uses to have you write newsletter text. Rewrite the prompt to carry out this request from the editor, changing as little as possible and keeping every fact and rule that the request does not touch:\n\n' + note +
      '\n\nAnswer with the rewritten prompt only, no commentary, no code fence.\n\n---- PROMPT ----\n' + prompt;
    return S.spec.ask(p, 'text').then(function (text) { var t = String(text || '').replace(/```[a-z]*\n?|```/g, '').trim(); if (!t) throw new Error('the amended prompt came back empty'); return t; });   // v1.2.1: kind
  }

  // ── state ──
  function keep(k) { S.chosen[k] = -1; S.edit[k] = ''; var box = q('[data-ixai-edit="' + k + '"]'); if (box) box.value = ''; paint(); }   // v1.3.1: empty the box, the part is left alone
  function pick(k, i) { var v = S.cands[k][i]; S.chosen[k] = i; S.edit[k] = v; var box = q('[data-ixai-edit="' + k + '"]'); if (box) box.value = v; paint(); }   // v1.3.0: box first, so the Use count sees it
  function log(text) { S.hist.push({ at: when(), text: text }); }
  function setBusy(b, what) { S.busy = b ? (what || 'Working\u2026') : ''; paint(); }
  function fail(e) { S.err = (e && e.message) || String(e); setBusy(false); }

  function generate(keys, note) {
    if (S.busy) return;
    S.err = '';
    setBusy(true, keys.length === S.spec.fields.length ? 'Writing the spread\u2026' : 'Rewriting ' + fld(keys[0]).label.toLowerCase() + '\u2026');
    askSpread(keys, note).then(function (pool) {
      // v1.4.0: measure, then up to two repair rounds for anything outside its range (HC-AI-9)
      var round = function (n) {
        var miss = keys.some(function (k) { var f = fld(k), sl = slots(f); var good = pool[k].filter(function (c) { return okOpt(f, c.text, keys); });   // v1.4.1: apart too
          return f.tones && f.tones.length ? sl.some(function (t, si) { return !good.some(function (c) { return c.slot === si; }); }) : good.length < sl.length; });
        if (!miss || n >= 2) return pool;
        S.busy = n === 0 ? 'Fitting the options\u2026' : 'Fitting the options once more\u2026'; paint();
        return repair(keys, pool).then(function (ok) { return ok ? round(n + 1) : pool; });
      };
      return round(0);
    }).then(function (pool) {
      var out = {}; keys.forEach(function (k) { out[k] = choose(fld(k), pool[k], keys); });
      S.retrying = false;
      keys.forEach(function (k) { S.cands[k] = out[k]; S.chosen[k] = -1; });
      log(keys.length === S.spec.fields.length ? 'Spread written' + (note ? ': \u201c' + note + '\u201d' : '') : fld(keys[0]).label + ' again' + (note ? ': \u201c' + note + '\u201d' : ''));
      S.busy = ''; paint(true);
    }).catch(function (e) { S.retrying = false; fail(e); });
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

  function values() { var o = {}; S.spec.fields.forEach(function (f) { var el = q('[data-ixai-edit="' + f.key + '"]'); var v = fold(el ? el.value : S.edit[f.key]); if (v) o[f.key] = v; }); return o; }   // v1.3.0: only the parts with a new version
  function newCount() { return Object.keys(values()).length; }
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
    var lastGroup = null, gi = -1, N = sp.fields.length;
    var fields = sp.fields.map(function (f, i) {
      var gh = '';
      if (f.group && f.group !== lastGroup) { gi++; gh = '<h3 class="ixai-grp" data-ixai-gi="' + (gi % 3) + '">' + esc(f.group) + '</h3>'; }   // v1.2.0; colour index v1.3.0 (HC-AI-8)
      lastGroup = f.group || lastGroup;
      var cur = fold(f.value || '');
      return gh + '<section class="ixai-f" data-ixai-f="' + esc(f.key) + '" data-ixai-gi="' + (f.group ? gi % 3 : '') + '">' +
        '<div class="ixai-eb"><span class="ixai-no">' + (i + 1) + ' of ' + N + '</span><span>' + esc(f.label) + '</span>' + (limitTxt(f) ? '<span class="ixai-lim">' + esc(limitTxt(f)) + ' characters</span>' : '') + '</div>' +
        '<div class="ixai-cur"><span class="ixai-cur-k">Current</span><p class="ixai-cur-v' + (cur ? '' : ' is-none') + '">' + (cur ? esc(cur) : 'Not written yet') + '</p></div>' +   // v1.3.0
        '<div class="ixai-cands" data-ixai-cands="' + esc(f.key) + '" style="--ixai-cols:' + (f.cols || f.count || 1) + '"></div>' +
        '<div class="ixai-nv"><span class="ixai-nv-k">New version</span><span class="ixai-cnt" data-ixai-cnt="' + esc(f.key) + '"></span><button type="button" class="ix-revert ixai-keep" data-ixai-keep="' + esc(f.key) + '" hidden>Keep the current one</button></div>' +
        '<textarea class="ixai-edit" data-ixai-edit="' + esc(f.key) + '" rows="' + (f.rows || 2) + '"' + (f.max ? ' maxlength="' + f.max + '"' : '') + ' placeholder="Click an option above, or write your own. Leave empty to keep the current one."></textarea>' +
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
        '<button type="button" class="ix-revert" data-ixai-cancel>Cancel</button><button type="button" class="ix-btn ix-btn--primary" data-ixai-use>' + esc(sp.useLabel || 'Use') + '</button></footer>' +
      '</div>';
  }

  function paint(values) {
    if (!S) return;
    S.spec.fields.forEach(function (f) {
      var k = f.key, c = q('[data-ixai-cands="' + k + '"]');
      if (c) c.innerHTML = (S.cands[k] || []).map(function (v, i) {
        var tone = f.tones && f.tones[i] ? f.tones[i] : (S.cands[k].length > 1 ? 'Option ' + (i + 1) : '');
        var bad = fit(f, v), cl = clashOf(f, v, null);   // v1.2.0; v1.4.1: live repeat mark against the other part's box
        var mark = (bad ? ' \u00b7 ' + bad : '') + (cl ? ' \u00b7 repeats ' + cl.label.toLowerCase() + ': ' + cl.names.join(', ') : '');
        return '<button type="button" class="ixai-cand' + (S.chosen[k] === i ? ' is-on' : '') + (bad ? ' is-' + bad : '') + '" data-ixai-pick="' + esc(k) + '" data-ixai-i="' + i + '"' + (cl ? ' title="' + esc('Shares ' + cl.names.join(', ') + ' with the ' + cl.label.toLowerCase()) + '"' : '') + '><span class="ixai-tone">' + esc(tone) + '<em' + (bad || cl ? ' class="is-bad"' : '') + '>' + v.length + (limitTxt(f) ? ' / ' + limitTxt(f) : '') + mark + '</em></span>' + esc(v) + '</button>';
      }).join('') || '<p class="ixai-empty">No options yet.</p>';
      var e = q('[data-ixai-edit="' + k + '"]');
      if (e) { if (values) e.value = S.edit[k] || ''; e.classList.toggle('is-set', !!fold(e.value)); var n = q('[data-ixai-cnt="' + k + '"]'); if (n) { n.textContent = fold(e.value) ? (limitTxt(f) ? e.value.length + ' / ' + limitTxt(f) : e.value.length + ' chars') : 'empty: keeps the current one'; n.classList.toggle('is-bad', !!fold(e.value) && !!fit(f, e.value)); } }   // v1.2.0: salmon outside the range; v1.3.0: empty keeps
      var rb = q('[data-ixai-regen="' + k + '"]'); if (rb) rb.disabled = !!S.busy;
      var kp = q('[data-ixai-keep="' + k + '"]'); if (kp) kp.hidden = !e || !fold(e.value) || !!S.busy;   // v1.3.1
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
    var use = q('[data-ixai-use]');
    if (use) {   // v1.3.0: on when at least one part has a new version and every filled box is in range
      var nc = newCount(), allOk = S.spec.fields.every(function (f) { var e = q('[data-ixai-edit="' + f.key + '"]'); return !e || !fold(e.value) || !fit(f, e.value); });
      if (!S.busy) use.disabled = !nc || !allOk;
      use.textContent = nc ? (S.spec.useLabel || 'Use') + ' \u00b7 ' + nc + ' new ' + (nc === 1 ? 'part' : 'parts') : (S.spec.useLabel || 'Use');
    }
    S.el.classList.toggle('is-busy', !!S.busy);
  }

  function wire() {
    S.el.addEventListener('click', function (e) {
      var t = e.target, el;
      if ((el = t.closest('[data-ixai-keep]'))) { keep(el.getAttribute('data-ixai-keep')); return; }   // v1.3.1
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
    // v1.3.0: open() resolves { values } holding only the parts with a new version
    return new Promise(function (resolve) {
      var el = document.createElement('div'); el.className = 'ixai-ov'; el.setAttribute('data-ixai-show', 'cands');
      S = { spec: spec, el: el, cands: {}, chosen: {}, edit: {}, fprompt: {}, prompt: spec.prompt || '', prior: '', hl: null, note: '', busy: '', err: '', hist: [], resolve: resolve, retrying: false };   // retrying v1.2.0
      spec.fields.forEach(function (f) { S.cands[f.key] = []; S.chosen[f.key] = -1; S.edit[f.key] = ''; S.fprompt[f.key] = f.prompt || ''; });   // fprompt v1.1.0; v1.3.0: the box starts empty, f.value is shown as Current
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
