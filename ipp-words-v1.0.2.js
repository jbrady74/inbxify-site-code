/* ipp-words-v1.0.2.js */
/* ============================================================
   ipp-words-v1.0.2.js — the Words tab of the IPP
   Companion stylesheet: ipp-words-v1.0.2.css
   v1.0.2 (20 Oct 2026, Jeff's second run on 901A):
     1. The proxy's model refuses an assistant prefill ("This model does
        not support assistant message prefill"), so ask() sends the user
        turn only; ix-ai v1.2.1's forgiving parser and quoted error stay.
     2. The tab shows the same red Compile shows (Jeff: the tab and the
        board must agree). When a part is missing or outside its range,
        the band turns salmon and names it ("Written 5 of 6 · closing
        missing"; "preview is 101 characters, needs 40 to 90"), and the
        card holding the gap carries the salmon edge and head. The rail
        dot was already salmon; now the page is too.
   v1.0.1 kept below.
   v1.0.1 (20 Oct 2026, Jeff's first session on 901A):
     1. The inbox ranges follow the mail clients, not the old prompt:
        subject 20 to 50 (Litmus best practice 50; Gmail mobile shows
        35 to 40), preview 40 to 90 (iPhone shows about 90; Gmail
        shares the line with the subject). Title stays under 50: the
        web issue bar on a phone holds about 26 characters a line, two
        lines. ipp-publish v2.36 checks the same ranges on Send Setup
        and Compile (HC-P-WD1-1 updated).
     2. The model answer was not readable ("the answer was not the JSON
        asked for"): ask(prompt, kind) now prefills the assistant turn
        with "{" on json calls (ix-ai v1.2.1 passes the kind) and allows
        4,000 output tokens; the subject prompt says the first 35
        characters carry the hook.
     3. niceDate reads a Webflow date at UTC midnight as the calendar
        day (the modal said "Oct 17" for the Oct 18 issue).
   v1.0.0 kept below.
   Succeeds ipp-greeting v1.0.1 (retired). Mockup: ipp-words-tab-mockup
   v0.1 (20 Oct 2026, 106 Gap Interview S4), Jeff: grouping, keep the
   inbox strip, strict lengths, build.

   What it is
   The Greeting tab grown to the six parts a reader meets, written
   together once the newsletter is done, so each pulls the reader to a
   different part of the issue (Jeff's Greetings and Closings process):
     In the inbox   subject line, preview text        NEWSLETTER (124 nlmeta)
     At the top     title, short greeting, paragraph  GR row (122 block-save gr)
     At the end     closing                           NEWSLETTER (124 nlmeta)
   Three cards, grouped by where the words print, each with its own
   Edit, Cancel and Save; a changed box carries the gold border; counts
   show only while editing and go salmon outside the range; Save stays
   off until every box in that card is in range. The inbox card shows a
   mail-client strip (sender, subject, preview) that follows the boxes.

   The done tick (as v1.0.1): NL-BLOCKS greeting-done on the GR row,
   through Scenario 124's flag op. The tick opens the words. Undo clears it.

   The stale rule is a content rule now (Jeff, 20 Oct 2026). The Data
   Worker v1.0.68 stores nothing itself: when the words are saved or
   kept, this tab sends grBasis, the Worker's description of the issue as
   it stands (ordered articles with a content hash, events, The Find),
   with the 122 block-save; the Worker answers, on every board read,
   whether today's issue differs from that stored basis and how
   (greeting.basis.changes: moved 6 → 3, body edited, event added, Find
   changed). Display ads, real estate and block designs never count.
   While stale the tick is off; "Keep these words" re-stamps the basis
   and "Write them again" opens the session with the changes in the
   prompt. With no stored basis (nothing written yet) nothing is stale.

   One session writes all six (ix-ai v1.2.0, six fields in three
   groups) so the vary rule can hold across the set: no two parts lead
   with the same item. The rules, from Jeff's prompt and ruling 5:
     1 the paragraph opens with something from the middle of the page
       (positions 4 to 6), so the reader has a reason to scroll;
     2 the feature (position 1) is always mentioned, never first;
     3 community news items come next in priority;
     4 spread the items across subject, preview, paragraph, title and
       short greeting; vary the concepts; never two parts on one item;
     5 always positive, publisher's voice, a light seasonal note tied to
       the issue date, no weather claims the facts do not give;
     6 strict lengths, checked in code here and in the modal.
   After a session the band shows which item each part leads with
   (session-only, nothing stored).

   Needs: ipp-shell v1.23 (the 'words' view, IPP.dot), ix-ai v1.2.0,
   ix-issue-data v1.0.68 (greeting.basis on the GR slot, blockFields.
   greetingBasis, /greeting-context with basis), Scenario 124 (op flag
   and op nlmeta), Scenario 122 block-save gr with grBasis mapped to
   NL-BLOCKS greeting-basis, PP_WEBHOOKS.anthropicProxy.

   HARDCODING (tracker rows)
     HC-P-WD1-1  KEYS, GROUPS, RANGE: subject 1–59, preview 81–99, title
                 1–49, short greeting 1–139, paragraph 550–600, closing
                 1–105 (Jeff's prompt: "strictly under 60", "over 80 and
                 under 100", "between 550-600"; closing example = max)
     HC-P-WD1-2  WD_MODEL 'claude-sonnet-4-6' (HC-P-GR1-2)
     HC-P-WD1-3  WD_COUNT 2/2/3/3/2/2 and WD_TONES (title and short
                 greeting: Warm/Playful/Straight; paragraph: Warm/Straight)
     HC-P-WD1-4  HOUSE_RULES and FIELD_PROMPT text live here (per-title
                 versions on TITLES-ADMIN later)
     HC-P-WD1-5  the done card, band and card wording
     HC-P-WD1-6  the Worker route /greeting-context, from PP_WEBHOOKS.planBoard's origin
     HC-P-WD1-7  the mid-page window: positions 4 to 6, else the last
                 half of the articles (MID_FROM = 4)
     HC-P-WD1-8  the NEWSLETTER values come from board.publish
                 (subject, preview, closing) by their Worker keys
   ============================================================ */
(function () {
  'use strict';
  var VERSION = '1.0.2', FILE = 'ipp-words-v1.0.2.js', VIEW = 'words', MOUNTED = 'data-words-mounted';

  // ── constants ───────────────────────────────────────────────
  var GR = 'GR';                                                            // the Greeting block type (HC-P-S16-1 class)
  var KEYS = ['subject', 'preview', 'title', 'supershort', 'paragraph', 'closing'];                         // HC-P-WD1-1
  var GROUPS = { inbox: ['subject', 'preview'], top: ['title', 'supershort', 'paragraph'], end: ['closing'] };
  var GROUP_ORDER = ['inbox', 'top', 'end'];
  var GROUP_WORD = { inbox: 'In the inbox', top: 'At the top', end: 'At the end' };
  var GROUP_WHAT = { inbox: 'before anyone opens it', top: 'the masthead and the greeting block', end: 'the last line before the footer' };
  var GROUP_RULE = { inbox: 'Subject 20 to 50 characters, preview 40 to 90. Save stays off until both fit.', top: 'Title under 50, short greeting under 140, paragraph 550 to 600.', end: 'One or two sentences tied to the date, up to 105 characters.' };
  var GR_KEYS = GROUPS.top, NL_KEYS = ['subject', 'preview', 'closing'];
  var RANGE = { subject: [20, 50], preview: [40, 90], title: [1, 49], supershort: [1, 139], paragraph: [550, 600], closing: [1, 105] };   // HC-P-WD1-1; inbox ranges v1.0.1
  var LABEL = { subject: 'Subject line', preview: 'Preview text', title: 'Title', supershort: 'Short greeting', paragraph: 'Paragraph', closing: 'Closing' };
  var WHERE = { subject: 'the inbox', preview: 'under the subject', title: 'prints in the masthead', supershort: 'prints in the email', paragraph: 'prints on the web page', closing: 'NEWSLETTER \u00b7 Closing Note' };
  var WORD = { subject: 'a subject line', preview: 'preview text', title: 'a title', supershort: 'a short greeting', paragraph: 'a paragraph', closing: 'a closing' };
  var WD_MODEL = 'claude-sonnet-4-6';                                       // HC-P-WD1-2
  var WD_COUNT = { subject: 2, preview: 2, title: 3, supershort: 3, paragraph: 2, closing: 2 };            // HC-P-WD1-3
  var WD_TONES = { title: ['Warm', 'Playful', 'Straight'], supershort: ['Warm', 'Playful', 'Straight'], paragraph: ['Warm', 'Straight'] };
  var MID_FROM = 4;                                                         // HC-P-WD1-7
  var TRIES = 4, GAP_MS = 2500;                                             // the read-back wait (HC-P-IPP3-3)
  var HOUSE_RULES = [                                                       // HC-P-WD1-4
    'Written in the publisher\u2019s voice: warm, neighbourly, plain English, speaking to local readers. Always positive. Use only the facts given; never invent names, dates, places, numbers or weather.',
    'The six parts work as a set and the reader meets them in this order: subject line, preview text, title, short greeting, paragraph, closing. Their job is to pull the reader into the issue. Spread the items across them: no two parts open with the same item, and together they should name as many different items as they naturally can.',
    'Articles are numbered in page order. Position 1 is the feature the reader sees first anyway; it is always mentioned, but never as the first thing said in any part. Favor the articles in the middle of the page (positions ' + MID_FROM + ' to 6 when there are that many) for the openings, so the reader has a reason to scroll. Community news items come next in priority. Events get one mention somewhere in the set.',
    'A light seasonal note tied to the issue date is welcome where it fits; make no claim about the weather that the facts do not give.',
    'The Find, when listed, is a paid listing: you may mention its topic, never sell it.',
    'No emoji, no hashtags, no exclamation marks in the paragraph or the closing; one exclamation mark is allowed in the closing only if it is natural.',
    'Lengths are checked by code and rejected outside the range. Count characters.'
  ];
  var FIELD_PROMPT = {                                                      // HC-P-WD1-4
    subject: 'What the inbox shows as the subject. Name two or three items, not one; the first 35 characters carry the hook, because phones cut it there. At least one option names the community (from the newsletter name). Each option leads with a different item.',
    preview: 'The grey line after the subject in the inbox. Catchy, gets attention, names items the subject did not lead with; never repeats the subject. Each option leads with a different item.',
    title: 'A heading over the greeting; it prints in the masthead. Sentence case, no colon, no item the subject led with.',
    supershort: 'One sentence under the masthead in the email. Name one or two items the subject and preview did not lead with.',
    paragraph: 'The greeting on the web page. Open with an item from the middle of the page (positions ' + MID_FROM + ' to 6), then the feature, then community news and one event, as the facts allow. Name the writers only when given. End with \u201cEnjoy.\u201d',
    closing: 'The last line before the footer: a variation on \u201cThat\u2019s all for this week\u201d plus one sentence tied to the season or the date. Nothing about any article.'
  };

  // ── helpers (the IPP conventions) ───────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function fold(v) { return String(v == null ? '' : v).replace(/\s*[\r\n]+\s*/g, ' ').replace(/[ \t]+/g, ' ').trim(); }
  function hooks() { return window.PP_WEBHOOKS || {}; }
  function workerBase() { var pb = hooks().planBoard || ''; return pb.replace(/\/plan-board.*$/, ''); }   // HC-P-WD1-6
  function boardData() { return (window.IPP && IPP.board && typeof IPP.board.data === 'function') ? IPP.board.data() : null; }
  function reload() { return (window.IPP && IPP.board && IPP.board.load) ? IPP.board.load({ fresh: true }) : Promise.resolve(null); }
  function planLocked() { var b = boardData(); return !!(b && b.plan && b.plan.locked); }
  function grSlot() { var b = boardData(); return ((b && b.slots) || []).filter(function (s) { return s.blockLabel === GR || s.blockType === GR; })[0] || null; }
  function doneField() { var b = boardData(); return (b && b.blockFields && b.blockFields.greetingDone) || ''; }
  function basisField() { var b = boardData(); return (b && b.blockFields && b.blockFields.greetingBasis) || ''; }
  function nlId() { var seen = {}, out = []; Array.prototype.forEach.call(document.querySelectorAll('.newsletter-source [data-nl-id]'), function (el) { var id = (el.getAttribute('data-nl-id') || '').trim(); if (id && !seen[id]) { seen[id] = 1; out.push(id); } }); return out.length === 1 ? out[0] : ''; }
  function pubBoard() { var b = boardData(); return b && b.publish ? b.publish : null; }
  function pubRow() { var p = pubBoard(), nl = nlId(); if (!p || !nl) return null; for (var i = 0; i < (p.newsletters || []).length; i++) if (p.newsletters[i].id === nl) return p.newsletters[i]; return null; }   // HC-P-WD1-8
  function nlFieldSlug(k) { var p = pubBoard(); return p && p.fields ? (p.fields[k] || '') : ''; }
  function nlFieldMissing(k) { var p = pubBoard(); return !!(p && p.types && p.types[k] === null); }
  function canvas() { return document.querySelector('.ipp-view[data-view="' + VIEW + '"] .ipp-canvas'); }
  function page() { var c = canvas(); return c ? c.querySelector('[data-wd-page]') : null; }
  function card(g) { var p = page(); return p ? p.querySelector('[data-wd-card="' + g + '"]') : null; }
  function field(k) { var p = page(); return p ? p.querySelector('[data-wd-field="' + k + '"]') : null; }
  function groupOf(k) { for (var g in GROUPS) if (GROUPS[g].indexOf(k) >= 0) return g; return ''; }
  function niceDate(v) { var sv = String(v || ''), m = sv.match(/^(\d{4}-\d\d-\d\d)(?:T00:00:00(?:\.000)?Z)?$/); var d = new Date(m ? m[1] + 'T12:00:00' : sv); return isNaN(d) ? sv : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }   // v1.0.1: a Webflow date at UTC midnight is a calendar day
  function when(iso) { var d = new Date(iso || ''); return isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function toast(t, kind, detail) { if (window.IxToast && IxToast.show) IxToast.show(t, kind, detail ? { detail: detail } : undefined); else console.warn('[ipp-words] ' + t + (detail ? ' \u00b7 ' + detail : '')); }
  function inRange(k, v) { var n = fold(v).length, r = RANGE[k]; return n >= r[0] && n <= r[1]; }
  function rangeTxt(k) { var r = RANGE[k]; return r[0] > 1 ? r[0] + '\u2013' + r[1] : '' + r[1]; }

  // ── state ───────────────────────────────────────────────────
  var W = { draft: {}, open: {}, saving: '', aiBusy: false, aiBefore: null, missing: {}, msg: {}, msgKind: {}, doneBusy: false, doneMsg: '', ctx: null, leads: null };

  function saved() {
    var g = (grSlot() || {}).greeting || {}, r = pubRow(), v = (r && r.values) || {}, o = {};
    GR_KEYS.forEach(function (k) { o[k] = fold(g[k]); });
    NL_KEYS.forEach(function (k) { o[k] = fold(v[k]); });
    return o;
  }
  function val(k) { return Object.prototype.hasOwnProperty.call(W.draft, k) ? W.draft[k] : saved()[k]; }
  function dirty(g) { return Object.keys(W.draft).filter(function (k) { return !g || groupOf(k) === g; }); }
  function isOpen(g) { return !!W.open[g] || dirty(g).length > 0; }
  function writtenKeys() { var s = saved(); return KEYS.filter(function (k) { return !!s[k]; }); }

  // the facts every paint reads
  function facts() {
    var gs = grSlot(), flag = gs ? gs.greetingDone : null, basis = (gs && gs.greeting && gs.greeting.basis) || null;
    var written = writtenKeys(), empty = written.length === 0;
    var isStale = !!(basis && basis.stale) && !empty;
    var sv = saved(), problems = [];                                      // v1.0.2: what Compile would call red
    KEYS.forEach(function (k) { var v = sv[k]; if (!v) problems.push({ key: k, text: LABEL[k].toLowerCase() + ' missing' }); else if (!inRange(k, v)) problems.push({ key: k, text: LABEL[k].toLowerCase() + ' is ' + v.length + ' characters, needs ' + rangeTxt(k).replace('\u2013', ' to ') }); });
    return { gs: gs, flag: flag, basis: basis, written: written, empty: empty, stale: isStale, changes: (basis && basis.changes) || [], problems: problems,
      done: flag === true && !isStale, noField: !!gs && flag === null, noBasis: !!gs && !(basis && basis.hasField), locked: planLocked(), nl: !!pubRow() };
  }

  // ── the done tick (Scenario 124 op flag, as the Picker's list-done) ──
  function flag124(on) {
    var gs = grSlot(), url = String(hooks().blockWriter || ''), fld = doneField();
    if (!gs) return Promise.reject(new Error('this plan has no Greeting block'));
    if (!url) return Promise.reject(new Error('this page has no PP_WEBHOOKS.blockWriter address (Scenario 124)'));
    if (!fld) return Promise.reject(new Error('the plan data does not name the done field (blockFields.greetingDone; NL-BLOCKS greeting-done)'));
    var batchId = 'wdd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    var ops = [{ id: gs.id, field: fld, on: !!on }];
    var u = url + (url.indexOf('?') < 0 ? '?' : '&') + 'op=flag&batchId=' + encodeURIComponent(batchId) + '&batch=' + encodeURIComponent(JSON.stringify({ ops: ops }));
    return fetch(u, { method: 'GET', credentials: 'omit' }).then(function (r) {
      return r.text().then(function (t) {
        if (!r.ok) throw new Error('Scenario 124 answered HTTP ' + r.status + ' to op flag');
        var b; try { b = JSON.parse(t); } catch (x) { throw new Error('Scenario 124 sent a reply that is not JSON (op flag)'); }
        var res = (b && b.results && b.results[0]) || null;
        if (!res || res.ok !== true || !res.id) throw new Error((res && res.err) || 'Webflow refused the write');
        var fd = res.fieldData || {}, got = Object.prototype.hasOwnProperty.call(fd, 'flag') ? fd.flag : fd[fld];
        if (String(got) !== String(!!on)) throw new Error('Webflow did not store the tick');
      });
    }).then(reload);
  }
  function unsavedElsewhere() {
    var L = window.IPP && IPP.layout, P = window.IPP && IPP.picker, out = [];
    try { if (L && L.pending && L.pending().length) out.push('Layout has unsaved changes.'); } catch (e) {}
    try { if (P && P.pending) { var p = P.pending(), c = (p.adds || []).length + Object.keys(p.fills || {}).length + Object.keys(p.clears || {}).length + Object.keys(p.removes || {}).length + Object.keys(p.links || {}).length + Object.keys(p.holds || {}).length; if (c) out.push('The Editorial Picker has unsaved changes.'); } } catch (e) {}
    return out.join(' ');
  }
  function tick(on) {
    var f = facts();
    if (W.doneBusy || W.saving || W.aiBusy) return;
    if (f.locked) { toast('This plan is locked', 'info', 'The words cannot change.'); return; }
    var elsewhere = unsavedElsewhere(); if (elsewhere && on) { W.doneMsg = elsewhere + ' Save or cancel them first.'; paint(); return; }
    if (f.stale && on) { W.doneMsg = 'Keep the words or write them again; that marks the newsletter done again.'; paint(); return; }
    W.doneBusy = true; W.doneMsg = on ? 'Marking it done\u2026' : 'Undoing\u2026'; paint();
    flag124(on).then(function () {
      W.doneBusy = false; W.doneMsg = '';
      toast(on ? 'Newsletter marked done' : 'Done tick removed', 'ok', on ? 'The words can be written now.' : 'Write the words when the newsletter is done.');
      paint(true);
    }).catch(function (e) { W.doneBusy = false; W.doneMsg = 'The tick did not save: ' + ((e && e.message) || e) + '.'; paint(); });
  }

  // ── the issue digest and the prompt ────────────────────────
  function fetchContext() {
    var b = boardData(), planId = b && b.plan && b.plan.id, base = workerBase();
    if (!planId) return Promise.reject(new Error('the plan has not been read yet'));
    if (!base) return Promise.reject(new Error('this page has no PP_WEBHOOKS.planBoard address, so the issue digest cannot be read'));
    return fetch(base + '/greeting-context?planId=' + encodeURIComponent(planId), { method: 'GET', credentials: 'omit' }).then(function (r) {
      return r.text().then(function (t) {
        var o = null; try { o = JSON.parse(t); } catch (e) {}
        if (!r.ok || !o || o.ok !== true) throw new Error((o && o.error) || ('the Data Worker answered HTTP ' + r.status + ' to /greeting-context (v1.0.68 needed)'));
        return o;
      });
    });
  }
  function midWindow(n) { return n >= MID_FROM + 1 ? [MID_FROM, Math.min(6, n)] : [Math.max(2, Math.ceil(n / 2) + 1), n]; }   // HC-P-WD1-7: positions 4 to 6, else the back half
  function digestText(ctx) {
    var out = [], n = ctx.articles.length, mw = midWindow(n);
    out.push('Articles in this issue, in page order (position 1 is the feature; the middle of the page is ' + (n > 1 ? 'positions ' + mw[0] + ' to ' + mw[1] : 'position 1') + '):');
    if (!n) out.push('- none');
    ctx.articles.forEach(function (a, i) {
      out.push('');
      out.push((i + 1) + '. ' + (a.title || 'Untitled') + (a.subTitle ? ' \u2014 ' + a.subTitle : '') + (a.section ? ' [' + a.section + ']' : '') + (i === 0 ? ' (the feature)' : (i + 1 >= mw[0] && i + 1 <= mw[1]) ? ' (middle of the page)' : ''));
      if (a.writer) out.push('   By: ' + a.writer);
      if (a.banner) out.push('   Flag: ' + a.banner);
      if (a.summary) out.push('   Summary: ' + a.summary);
      if (a.body) out.push('   Story: ' + a.body.replace(/\n+/g, ' '));
    });
    out.push(''); out.push('Events in this issue:');
    if (!ctx.events.length) out.push('- none');
    ctx.events.forEach(function (e) {
      out.push('- ' + (e.name || 'Untitled') + [e.when, e.time, e.venue].filter(Boolean).map(function (x) { return ' (' + x + ')'; }).join('') + (e.description ? ': ' + e.description.replace(/\n+/g, ' ') : ''));
    });
    if (ctx.finds && ctx.finds.length) {
      out.push(''); out.push('The Find (a paid listing in this issue):');
      ctx.finds.forEach(function (f) { out.push('- ' + (f.title || 'Untitled') + (f.text ? ': ' + f.text.replace(/\n+/g, ' ') : '')); });
    }
    return out.join('\n');
  }
  function changesText(changes) {
    return (changes || []).map(function (c) {
      var w = c.what === 'find' ? 'The Find' : c.what;
      if (c.kind === 'moved') return c.name + ' moved from position ' + c.from + ' to ' + c.to;
      if (c.kind === 'added') return w + ' added: ' + c.name + (c.to ? ' (position ' + c.to + ')' : '');
      if (c.kind === 'removed') return w + ' removed: ' + c.name;
      return c.name + (c.what === 'find' ? ' (The Find)' : c.what === 'event' ? ' (event)' : '') + ' was edited';
    });
  }
  function sharedPrompt(ctx, f) {
    var b = boardData(), plan = (b && b.plan) || {}, name = ctx.plan.titleName || plan.titleName || 'the newsletter';
    var r = pubRow(), sendAt = r && r.values ? r.values.sendAt : '';
    var cur = saved(), have = KEYS.filter(function (k) { return cur[k]; });
    return 'Write the words that carry a reader into this issue of a local community newsletter: the subject line and preview text in the inbox, the title, short greeting and paragraph at the top, and the closing at the end.\n\n' +
      'Newsletter: ' + name + '\n' +
      ((ctx.plan.date || plan.date) ? 'Issue date: ' + niceDate(ctx.plan.date || plan.date) + '\n' : '') +
      (sendAt ? 'Email goes out: ' + niceDate(sendAt) + '\n' : '') +
      'Today: ' + niceDate(new Date().toISOString()) + '\n' +
      '\n' + digestText(ctx) +
      (f && f.stale && f.changes.length ? '\n\nSince the words were last written the issue changed: ' + changesText(f.changes).join('; ') + '. The new words must fit the issue as it stands now.' : '') +
      (have.length ? '\n\nThe current words, for reference (write new ones, do not repeat them): ' + have.map(function (k) { return LABEL[k] + ': \u201c' + cur[k] + '\u201d'; }).join(' ') : '') +
      '\n\nRules:\n' + HOUSE_RULES.map(function (r) { return '- ' + r; }).join('\n') + '\n';
  }
  function ask(prompt, kind) {                                            // v1.0.1: kind 'json' prefills "{" so the answer starts as JSON
    var json = kind === 'json', msgs = [{ role: 'user', content: prompt }];   // v1.0.2: no prefill (the proxy's model refuses it)
    return fetch(String(hooks().anthropicProxy || ''), { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: WD_MODEL, max_tokens: 4000, messages: msgs }) })
      .then(function (r) { return r.text().then(function (t) {
        var b = null; try { b = JSON.parse(t); } catch (e) {}
        if (!r.ok) throw new Error((b && b.error && (b.error.message || b.error)) || ('the AI service answered HTTP ' + r.status));
        var text = ((b && b.content) || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('');
        if (b && b.stop_reason === 'max_tokens') throw new Error('the answer ran past ' + 4000 + ' tokens and was cut off');
        return text;
      }); });
  }
  function gate(f) {                                                        // '' when the session may open
    if (f.locked) return 'This plan is locked.';
    if (!f.gs) return 'This plan has no Greeting block.';
    if (!f.nl) return 'This plan has no newsletter linked, so the subject, preview and closing have nowhere to save.';
    if (!hooks().anthropicProxy) return 'AI writing is not set up on this page (PP_WEBHOOKS.anthropicProxy).';
    if (!f.done && !f.stale && !f.noField) return 'Mark the newsletter done first.';
    return '';
  }
  function fieldSpec(k, cur) {
    var r = RANGE[k], group = groupOf(k);
    return { key: k, label: LABEL[k], short: LABEL[k].split(' ')[0], group: GROUP_WORD[group], min: r[0] > 1 ? r[0] : 0, max: r[1], count: WD_COUNT[k], tones: WD_TONES[k] || null,
      cols: WD_COUNT[k], rows: k === 'paragraph' ? 6 : (k === 'subject' || k === 'title') ? 1 : 2, value: cur[k], prompt: FIELD_PROMPT[k] };
  }
  function generate() {
    var f = facts();
    if (W.aiBusy || W.saving || W.doneBusy) return;
    var g = gate(f); if (g) { toast('Not ready to write', 'info', g); return; }
    if (!window.IxAI || !IxAI.open) { toast('The AI modal is not on this page', 'err', 'ix-ai-v1.2.1.js is missing from the body.'); return; }
    W.aiBusy = true; setMsg('', 'Reading the issue\u2026', ''); paint();
    fetchContext().then(function (ctx) {
      if (!ctx.articles.length && !ctx.events.length) throw new Error('the issue has no articles or events yet; the words are written from them');
      W.ctx = ctx;
      var cur = {}; KEYS.forEach(function (k) { cur[k] = val(k); });
      setMsg('', '', ''); paint();
      return IxAI.open({
        title: f.empty ? 'Write the words' : 'Write the words again',
        context: [ctx.plan.titleName, ctx.plan.date ? niceDate(ctx.plan.date) + ' issue' : '', plural(ctx.articles.length, 'article') + ', ' + plural(ctx.events.length, 'event') + (ctx.finds.length ? ', The Find' : '')].filter(Boolean).join(' \u00b7 '),
        model: WD_MODEL,
        prompt: sharedPrompt(ctx, f),
        ask: ask,
        useLabel: 'Use these words',
        fields: KEYS.map(function (k) { return fieldSpec(k, cur); })
      });
    }).then(function (out) {
      W.aiBusy = false;
      if (!out) { paint(); return; }
      var before = {}; KEYS.forEach(function (k) { before[k] = val(k); });
      W.aiBefore = before;
      KEYS.forEach(function (k) { set(k, out.values[k]); });
      GROUP_ORDER.forEach(function (gk) { W.open[gk] = true; });
      W.leads = leadsOf(out.values, W.ctx);
      setMsg('inbox', 'Read them once more, then Save each card. Undo puts back what was there.', 'ok');
      paint(true);
      var fe = field('subject'); if (fe) fe.focus({ preventScroll: true });
    }).catch(function (e) { W.aiBusy = false; setMsg('inbox', 'The words could not be written: ' + ((e && e.message) || e) + '.', 'err'); paint(); });
  }
  // which item each part leads with (the first named item in its text); session-only
  function leadsOf(values, ctx) {
    if (!ctx) return null;
    var items = [];
    (ctx.articles || []).forEach(function (a, i) { items.push({ name: a.title, pos: i + 1, kind: 'article' }); });
    (ctx.events || []).forEach(function (e) { items.push({ name: e.name, kind: 'event' }); });
    (ctx.finds || []).forEach(function (f) { items.push({ name: f.title, kind: 'find' }); });
    var keyOf = function (name) {
      var w = String(name || '').toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(function (x) { return x.length > 3 && ['with', 'from', 'that', 'this', 'your', 'their', 'meet', 'week', 'town', 'living', 'news'].indexOf(x) < 0; });
      return w.slice(0, 3);
    };
    var out = {};
    ['subject', 'preview', 'title', 'supershort', 'paragraph'].forEach(function (k) {
      var txt = String(values[k] || '').toLowerCase(), best = null;
      items.forEach(function (it) {
        var ks = keyOf(it.name); if (!ks.length) return;
        var at = -1; ks.forEach(function (x) { var i = txt.indexOf(x); if (i >= 0 && (at < 0 || i < at)) at = i; });
        if (at >= 0 && (!best || at < best.at)) best = { at: at, it: it };
      });
      if (best) out[k] = best.it;
    });
    return out;
  }

  // ── the boxes ───────────────────────────────────────────────
  function set(k, v) { v = fold(v); if (v === saved()[k]) delete W.draft[k]; else W.draft[k] = v; delete W.missing[k]; }
  function setMsg(g, text, kind) { if (!g) { GROUP_ORDER.forEach(function (x) { W.msg[x] = text; W.msgKind[x] = kind || ''; }); return; } W.msg[g] = text; W.msgKind[g] = kind || ''; }
  function input(el) {
    var k = el.getAttribute('data-wd-field');
    if (/[\r\n]/.test(el.value)) { var at = el.selectionStart; el.value = el.value.replace(/\r\n|[\r\n]/g, ' '); try { el.setSelectionRange(at, at); } catch (e) {} }
    var g = groupOf(k); set(k, el.value); if (val(k) !== saved()[k]) W.open[g] = true; setMsg(g, '', ''); paint();
  }
  function undo() { if (!W.aiBefore) return; var b = W.aiBefore; W.aiBefore = null; W.leads = null; KEYS.forEach(function (k) { set(k, b[k]); }); if (!dirty().length) W.open = {}; setMsg('', '', ''); paint(true); }
  function revert(g) { dirty(g).forEach(function (k) { delete W.draft[k]; delete W.missing[k]; }); W.open[g] = false; setMsg(g, '', ''); if (!dirty().length) W.aiBefore = null; paint(true); }
  function openCard(g) {
    var f = facts(); if (f.locked) return;
    if (!f.done && !f.stale && !f.noField) { toast('Not ready to write', 'info', 'Mark the newsletter done first.'); return; }
    W.open[g] = true; paint(true);
    var k = GROUPS[g].filter(function (x) { return !fold(val(x)); })[0] || GROUPS[g][0]; var fe = field(k); if (fe) fe.focus({ preventScroll: true });
  }
  function openAll() { var f = facts(); if (f.locked) return; if (!f.done && !f.stale && !f.noField) { toast('Not ready to write', 'info', 'Mark the newsletter done first.'); return; } GROUP_ORDER.forEach(function (g) { W.open[g] = true; }); paint(true); var fe = field('subject'); if (fe) fe.focus({ preventScroll: true }); }

  // ── saves ───────────────────────────────────────────────────
  // the GR row: Scenario 122 block-save gr, with the basis the Worker
  // computed on the freshest board read; read back words and basis
  function saveTop(sent, keep) {
    var t = (window.IPP && IPP.tenant) ? IPP.tenant() : {};
    if (!hooks().ipp || !t.pubplanId) return Promise.reject(new Error('this page has no PP_WEBHOOKS.ipp address (Scenario 122)'));
    return reload().then(function () {
      var gs = grSlot(); if (!gs) throw new Error('this plan has no Greeting block');
      var basis = (gs.greeting && gs.greeting.basis) || null, now = basis ? basis.now : '', at0 = gs.updatedAt || '';
      var body = { op: 'block-save', blockType: 'gr', stage: 'planning', pubplanId: t.pubplanId, titleAdminId: t.titleAdminId,
        position: gs.position, nlbId: gs.id, grTitle: sent.title, grParagraph: sent.paragraph, grSupershort: sent.supershort };
      if (basisField() && now) body.grBasis = now;
      return IPP.post('ipp', body).then(function () {
        var tries = 0;
        var check = function () {
          tries++;
          return new Promise(function (r) { setTimeout(r, GAP_MS); }).then(reload).then(function () {
            var g2 = grSlot(), g = (g2 && g2.greeting) || {}, b2 = g.basis || null;
            var same = GR_KEYS.every(function (k) { return fold(g[k]) === sent[k]; });
            var stamped = !at0 || !g2 || !g2.updatedAt || g2.updatedAt !== at0;
            var basisOk = !body.grBasis || !b2 || !b2.hasField || b2.stored === now;
            if (same && stamped && basisOk) return { ok: true, basis: basisOk };
            if (tries < TRIES) return check();
            return { ok: false, same: same, basisOk: basisOk, basisSent: !!body.grBasis };
          });
        };
        return check();
      });
    });
  }
  // NEWSLETTER: Scenario 124 op nlmeta, as Send Setup saves; read back the values
  function saveNl(keys, sent) {
    var url = String(hooks().blockWriter || ''), row = pubRow();
    if (!url) return Promise.reject(new Error('this page has no PP_WEBHOOKS.blockWriter address (Scenario 124)'));
    if (!row) return Promise.reject(new Error('the plan data has no newsletter for this plan'));
    var fd = {}, missing = keys.filter(function (k) { return !nlFieldSlug(k) || nlFieldMissing(k); });
    if (missing.length) return Promise.reject(new Error('NEWSLETTER has no field for ' + missing.map(function (k) { return LABEL[k].toLowerCase(); }).join(', ') + ' (the Worker names ' + missing.map(nlFieldSlug).join(', ') + ')'));
    keys.forEach(function (k) { fd[nlFieldSlug(k)] = sent[k]; });
    var batchId = 'wdn-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    var ops = [{ id: row.id, body: JSON.stringify({ fieldData: fd }) }];
    var u = url + (url.indexOf('?') < 0 ? '?' : '&') + 'op=nlmeta&batchId=' + encodeURIComponent(batchId) + '&batch=' + encodeURIComponent(JSON.stringify({ ops: ops }));
    return fetch(u, { method: 'GET', credentials: 'omit' }).then(function (r) {
      return r.text().then(function (t) {
        if (!r.ok) throw new Error('Scenario 124 answered HTTP ' + r.status + ' to op nlmeta');
        var b; try { b = JSON.parse(t); } catch (x) { throw new Error('Scenario 124 sent a reply that is not JSON (op nlmeta)'); }
        if (b && b.op && b.op !== 'nlmeta') throw new Error('Scenario 124 does not know op nlmeta yet');
        var res = (b && b.results && b.results[0]) || null;
        if (!res || res.ok !== true || !res.id) throw new Error((res && res.err) || 'Webflow refused the write');
      });
    }).then(function () {
      var tries = 0;
      var check = function () {
        tries++;
        return new Promise(function (r) { setTimeout(r, GAP_MS); }).then(reload).then(function () {
          var s = saved(), same = keys.every(function (k) { return s[k] === sent[k]; });
          if (same) return { ok: true };
          if (tries < TRIES) return check();
          return { ok: false };
        });
      };
      return check();
    });
  }
  // keep = true re-sends the saved GR words with today's basis, so the
  // stored basis matches the issue again and the done tick is back.
  function save(g, keep) {
    if (W.saving || W.aiBusy || W.doneBusy) return;
    var f = facts();
    if (f.locked) { toast('This plan is locked', 'info', 'The words cannot change.'); return; }
    if (!f.gs) { toast('Can\u2019t save', 'err', 'This plan has no Greeting block.'); return; }
    var keys = GROUPS[g], sent = {};
    keys.forEach(function (k) { sent[k] = keep ? saved()[k] : fold(val(k)); });
    if (!keep && !dirty(g).length) return;
    W.missing = {};
    var out = keys.filter(function (k) { return !inRange(k, sent[k]); });
    if (out.length && !keep) {
      out.forEach(function (k) { W.missing[k] = true; });
      setMsg(g, 'Not saved: ' + out.map(function (k) { return LABEL[k].toLowerCase() + ' needs ' + rangeTxt(k).replace('\u2013', ' to ') + ' characters' + (fold(sent[k]) ? ' (now ' + fold(sent[k]).length + ')' : ''); }).join('; ') + '.', 'err');
      paint(); var fe = field(out[0]); if (fe) fe.focus(); return;
    }
    W.saving = g; setMsg(g, keep ? 'Keeping the words, then reading them back\u2026' : 'Saving, then reading it back\u2026', ''); paint();
    var p = g === 'top' ? saveTop(sent, keep) : saveNl(keys, sent);
    p.then(function (res) {
      W.saving = '';
      if (res && res.ok) {
        keys.forEach(function (k) { delete W.draft[k]; });
        if (!dirty().length) W.aiBefore = null;
        W.open[g] = false; setMsg(g, '', '');
        toast(keep ? 'Words kept' : GROUP_WORD[g] + ' saved', 'ok', keep ? 'Stamped against the issue as it stands.' : 'Read back from the plan.');
        paint(true);
      } else if (res && res.same && res.basisSent && !res.basisOk) {
        setMsg(g, 'The words saved, but the plan does not show the basis stamp (Scenario 122 needs grBasis mapped to NL-BLOCKS greeting-basis). The stale check cannot clear until it does.', 'unverified'); paint();
      } else { setMsg(g, 'The words were sent, but the plan does not show them yet. Your words are kept here. Check again in a minute.', 'unverified'); paint(); }
    }).catch(function (e) { W.saving = ''; setMsg(g, 'The words did not send: ' + ((e && e.message) || e) + '. Your words are kept here.', 'err'); paint(); });
  }

  // ── markup ──────────────────────────────────────────────────
  function fieldHtml(k, cls) {
    var r = RANGE[k], multi = !(k === 'subject' || k === 'title');
    var ctl = multi
      ? '<textarea class="ix-picker-input ipp-wd-in" id="ipp_wd_' + k + '" data-wd-field="' + k + '" maxlength="' + r[1] + '" rows="' + (k === 'paragraph' ? 6 : 2) + '" placeholder="' + esc(placeholder(k)) + '" hidden></textarea>'
      : '<input type="text" class="ix-picker-input ipp-wd-in" id="ipp_wd_' + k + '" data-wd-field="' + k + '" maxlength="' + r[1] + '" placeholder="' + esc(placeholder(k)) + '" hidden>';
    return '<div class="ipp-wd-f ' + (cls || '') + '"><label class="ipp-wd-l" for="ipp_wd_' + k + '">' + esc(LABEL[k]) + ' <span class="ipp-wd-where">' + esc(WHERE[k]) + '</span><span class="ipp-wd-n" data-wd-count="' + k + '"></span></label>' +
      '<p class="ipp-wd-read is-' + k + '" data-wd-read="' + k + '"></p>' + ctl + '</div>';
  }
  function placeholder(k) {
    return { subject: 'What the inbox shows as the subject', preview: 'The grey line after the subject in the inbox', title: 'The heading over the greeting; it prints in the masthead', supershort: 'One line; it prints in the email', paragraph: 'The greeting readers see on the web page', closing: 'The last line before the footer' }[k];
  }
  function cardHtml(g) {
    var body = g === 'inbox'
      ? '<div class="ipp-wd-inbox" data-wd-inbox><div class="ipp-wd-av" data-wd-av></div><div class="ipp-wd-lines"><div class="ipp-wd-from"><span data-wd-from></span><small data-wd-when></small></div><div class="ipp-wd-sl" data-wd-ib="subject"></div><div class="ipp-wd-pv" data-wd-ib="preview"></div></div></div>' +
        '<div class="ipp-wd-row2">' + fieldHtml('subject') + fieldHtml('preview') + '</div>'
      : g === 'top'
      ? '<div class="ipp-wd-row2">' + fieldHtml('title') + fieldHtml('supershort') + fieldHtml('paragraph', 'is-wide') + '</div>'
      : '<div class="ipp-wd-row1">' + fieldHtml('closing') + '</div>';
    return '<section class="ipp-wd-card" data-wd-card="' + g + '">' +
      '<div class="ipp-wd-gh"><span class="ipp-wd-gw">' + esc(GROUP_WORD[g]) + '</span><span class="ipp-wd-gt">' + esc(GROUP_WHAT[g]) + '</span><span class="ipp-wd-sp"></span><span class="ipp-wd-gs" data-wd-state="' + g + '"></span><button type="button" class="ix-revert" data-wd-edit="' + g + '">Edit</button></div>' +
      '<div class="ipp-wd-gb">' +
        '<p class="ipp-wd-msg" data-wd-msg="' + g + '" hidden></p>' +
        body +
        '<div class="ipp-wd-foot" data-wd-foot="' + g + '" hidden>' +
          '<button type="button" class="ix-revert" data-wd-cancel="' + g + '">Cancel</button>' +
          '<span class="ipp-wd-sp"></span><p class="ipp-wd-rule">' + esc(GROUP_RULE[g]) + '</p>' +
          '<button type="button" class="ix-btn ix-btn--primary ipp-wd-save" data-wd-save="' + g + '" disabled>Save</button>' +
        '</div>' +
      '</div></section>';
  }
  function html() {
    return '<div class="ipp-wd-page" data-wd-page>' +
      '<div class="ipp-wd-head"><h2 class="ipp-wd-title">Words</h2><p class="ipp-wd-lede">The subject line, preview text, greeting and closing, written together once the newsletter is done, so they pull the reader to different parts of the issue.</p></div>' +
      // the done card (HC-P-WD1-5)
      '<section class="ipp-wd-done" data-wd-done>' +
        '<button type="button" class="ipp-wd-tick" data-wd-tick role="checkbox" aria-checked="false" aria-label="The newsletter is done"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg></button>' +
        '<div class="ipp-wd-dt"><h3 class="ipp-wd-dh" data-wd-done-h></h3><p class="ipp-wd-dp" data-wd-done-p></p><p class="ipp-wd-dm" data-wd-done-m hidden></p></div>' +
        '<div class="ipp-wd-stamp" data-wd-done-stamp></div>' +
        '<div class="ipp-wd-diff" data-wd-diff hidden><span class="ipp-wd-dk">Changed since</span><span class="ipp-wd-chips" data-wd-chips></span>' +
          '<div class="ipp-wd-dacts"><button type="button" class="ix-btn ix-btn--secondary ipp-wd-keep" data-wd-keep>Keep these words</button><button type="button" class="ix-btn ix-btn--primary ipp-wd-again" data-wd-again><span aria-hidden="true">\u2728</span> Write them again</button></div></div>' +
      '</section>' +
      // the band: one for the whole set
      '<section class="ipp-wd-band" data-wd-band>' +
        '<div class="ipp-wd-bt"><span class="ipp-wd-h">Words</span><span class="ipp-wd-sub" data-wd-sub></span></div>' +
        '<div class="ipp-wd-leads" data-wd-leads hidden></div>' +
        '<div class="ipp-wd-acts">' +
          '<button type="button" class="ix-revert" data-wd-undo hidden>Undo AI</button>' +
          '<button type="button" class="ix-btn ix-btn--primary ipp-wd-ai" data-wd-ai><span class="ipp-wd-spark" aria-hidden="true">\u2728</span><span data-wd-ai-label>Write the words</span></button>' +
          '<button type="button" class="ix-revert" data-wd-type>Type them by hand</button>' +
        '</div>' +
        '<p class="ipp-wd-gate" data-wd-gate hidden></p>' +
      '</section>' +
      GROUP_ORDER.map(cardHtml).join('') +
      '<p class="ipp-wd-foot-note" data-wd-note hidden></p>' +
    '</div>';
  }

  // ── paint ───────────────────────────────────────────────────
  function chip(c) {
    var w = c.what === 'find' ? 'The Find' : c.what === 'event' ? 'event' : '';
    var t = c.kind === 'moved' ? '<b>' + esc(c.name) + '</b> moved ' + c.from + ' \u2192 ' + c.to
      : c.kind === 'added' ? (w ? w + ' added: ' : 'added: ') + '<b>' + esc(c.name) + '</b>' + (c.to ? ' (position ' + c.to + ')' : '')
      : c.kind === 'removed' ? (w ? w + ' removed: ' : 'removed: ') + '<b>' + esc(c.name) + '</b>'
      : '<b>' + esc(c.name) + '</b>' + (w ? ' (' + w + ')' : '') + ' edited';
    return '<span class="ipp-wd-chg">' + t + '</span>';
  }
  function paint(values) {
    var c = canvas(), p = page(); if (!c || !p) return;
    var f = facts(), sv = saved(), at = when(f.gs ? f.gs.updatedAt : '');
    var busy = !!W.saving || W.aiBusy || W.doneBusy;
    var waiting = !f.done && !f.stale && !f.noField && !!f.gs;              // the band and the cards wait for the tick
    // the done card
    var dc = p.querySelector('[data-wd-done]'), tk = p.querySelector('[data-wd-tick]');
    dc.className = 'ipp-wd-done' + (f.done ? ' is-done' : '') + (f.stale ? ' is-stale' : '') + (W.doneBusy ? ' is-busy' : '');
    tk.setAttribute('aria-checked', f.done ? 'true' : 'false');
    tk.disabled = !f.gs || f.locked || busy || f.noField || f.stale;
    tk.title = f.stale ? 'Keep the words or write them again; that marks the newsletter done again.' : f.noField ? 'The plan data has no done field yet.' : f.done ? 'Undo marks the newsletter not done' : 'Tick when editorial and revenue picks are final and the layout is set';
    var h = p.querySelector('[data-wd-done-h]'), dp = p.querySelector('[data-wd-done-p]'), m = p.querySelector('[data-wd-done-m]'), stamp = p.querySelector('[data-wd-done-stamp]'), diff = p.querySelector('[data-wd-diff]');
    if (!f.gs) { h.textContent = 'This plan has no Greeting block.'; dp.textContent = 'Add the Greeting block on the Picker, then come back.'; stamp.innerHTML = ''; }
    else if (f.noField) { h.textContent = 'The plan data has no done field.'; dp.textContent = 'NL-BLOCKS needs a Switch field, greeting-done. Until then the words can be written without the tick.'; stamp.innerHTML = ''; }
    else if (f.stale) { h.textContent = 'The issue changed after you marked it done.'; dp.textContent = 'The words were written for an earlier version of the issue. Keep them if they still fit, or write them again; either one marks the newsletter done again.'; stamp.innerHTML = at ? 'Was done ' + esc(at) : ''; }
    else if (f.done) { h.textContent = 'The newsletter is done.'; dp.textContent = 'Editorial and revenue picks are final and the layout is set. The words can be written. If an article, its order, an event or The Find changes afterwards, this tick clears and the words are marked stale.' + (f.noBasis ? ' (NL-BLOCKS has no greeting-basis field yet, so that check is off.)' : ''); stamp.innerHTML = (at ? 'Done ' + esc(at) : 'Done') + (f.locked ? '' : ' <button type="button" class="ix-revert ipp-wd-undo-done" data-wd-untick>Undo</button>'); }
    else { h.textContent = 'The newsletter is done.'; dp.textContent = 'Tick this when editorial and revenue picks are final and the layout is set. It opens the words. If an article, its order, an event or The Find changes afterwards, the tick clears and the words are marked stale.'; stamp.innerHTML = ''; }
    m.hidden = !W.doneMsg; m.textContent = W.doneMsg || '';
    diff.hidden = !f.stale;
    if (f.stale) { p.querySelector('[data-wd-chips]').innerHTML = f.changes.slice(0, 6).map(chip).join('') + (f.changes.length > 6 ? '<span class="ipp-wd-chg">and ' + (f.changes.length - 6) + ' more</span>' : ''); }
    var keep = p.querySelector('[data-wd-keep]'), again = p.querySelector('[data-wd-again]');
    if (keep) { keep.disabled = busy || f.locked; keep.textContent = W.saving === 'top' && !dirty('top').length ? 'Keeping\u2026' : 'Keep these words'; }
    if (again) again.disabled = busy || f.locked || !!gate(f);
    // the band
    var sub = p.querySelector('[data-wd-sub]');
    if (sub) { sub.textContent = !f.gs ? 'This plan has no Greeting block.' : !f.nl ? 'No newsletter linked to this plan.' : f.empty ? 'Not written' : 'Written \u00b7 ' + f.written.length + ' of ' + KEYS.length + (f.stale ? ' \u00b7 older than the issue' : f.problems.length ? ' \u00b7 ' + f.problems.map(function (x) { return x.text; }).join('; ') : (!f.noBasis && f.written.length === KEYS.length && f.basis && f.basis.stored) ? ' \u00b7 fits the issue' : ''); sub.classList.toggle('is-bad', !f.empty && (f.stale || f.problems.length > 0)); }   // v1.0.2
    var g = gate(f);
    var ai = p.querySelector('[data-wd-ai]'), aiL = p.querySelector('[data-wd-ai-label]');
    if (ai) { ai.hidden = f.locked; ai.disabled = !!g || busy; ai.title = g || 'Offers a spread for all six parts, written from the issue'; ai.className = 'ix-btn ' + (f.empty || f.stale ? 'ix-btn--primary' : 'ix-btn--secondary') + ' ipp-wd-ai'; }
    if (aiL) aiL.textContent = W.aiBusy ? 'Writing\u2026' : f.empty ? 'Write the words' : 'Write them again';
    var ty = p.querySelector('[data-wd-type]'); if (ty) { ty.hidden = f.locked; ty.disabled = waiting || busy; ty.textContent = f.empty ? 'Type them by hand' : 'Edit by hand'; }
    var un = p.querySelector('[data-wd-undo]'); if (un) un.hidden = !W.aiBefore || f.locked || busy;
    var gt = p.querySelector('[data-wd-gate]'); if (gt) { gt.hidden = !waiting; gt.textContent = 'Opens when the newsletter is marked done above.'; }
    var leads = p.querySelector('[data-wd-leads]');
    if (leads) {
      var L = W.leads, items = [];
      if (L) ['subject', 'preview', 'title', 'supershort', 'paragraph'].forEach(function (k) { if (L[k]) items.push('<span>' + esc(k === 'paragraph' ? 'Paragraph opens with' : LABEL[k]) + ' <b>' + esc(L[k].name) + (L[k].pos ? ' (pos ' + L[k].pos + ')' : L[k].kind === 'event' ? ' (event)' : '') + '</b></span>'); });
      leads.hidden = !items.length || !dirty().length; leads.innerHTML = items.join('');
    }
    p.querySelector('[data-wd-band]').classList.toggle('is-waiting', waiting);
    p.querySelector('[data-wd-band]').classList.toggle('is-bad', !f.empty && !waiting && (f.stale || f.problems.length > 0));   // v1.0.2
    // the cards
    var fromEl = p.querySelector('[data-wd-from]'), avEl = p.querySelector('[data-wd-av]'), whenEl = p.querySelector('[data-wd-when]');
    var b = boardData(), tname = (b && b.plan && b.plan.titleName) || 'Newsletter', r = pubRow(), sendAt = r && r.values ? r.values.sendAt : '';
    if (fromEl) fromEl.textContent = tname;
    if (avEl) avEl.textContent = tname.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
    if (whenEl) { var sd = sendAt ? new Date(sendAt) : null; whenEl.textContent = sd && !isNaN(sd) ? sd.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : ''; }
    GROUP_ORDER.forEach(function (gk) {
      var cd = card(gk); if (!cd) return;
      var open = isOpen(gk), d = dirty(gk), bad = false, have = 0;
      GROUPS[gk].forEach(function (k) {
        var fe = field(k), rd = cd.querySelector('[data-wd-read="' + k + '"]'), txt = sv[k];
        if (txt) have++;
        if (rd) { rd.textContent = txt || 'Not written yet.'; rd.classList.toggle('is-none', !txt); rd.hidden = open; }
        if (!fe) return;
        fe.hidden = !open;
        if (values) fe.value = val(k);
        fe.readOnly = f.locked || !!W.saving;
        var on = Object.prototype.hasOwnProperty.call(W.draft, k), v = fold(fe.value), ok = inRange(k, v);
        if (v && !ok) bad = true; if (!v) bad = true;
        fe.classList.toggle('ix-picker-input--changed', on && ok); fe.classList.toggle('ipp-dirty', on);
        fe.classList.toggle('is-missing', !!W.missing[k] || (!!v && !ok));
        var n = cd.querySelector('[data-wd-count="' + k + '"]'); if (n) { n.textContent = v.length + ' / ' + rangeTxt(k); n.className = 'ipp-wd-n' + (v ? (ok ? ' is-ok' : ' is-bad') : ''); }
        if (gk === 'inbox') { var ib = cd.querySelector('[data-wd-ib="' + k + '"]'); if (ib) { ib.textContent = (open ? v : txt) || (k === 'subject' ? '(subject line)' : '(preview text)'); ib.classList.toggle('is-none', !(open ? v : txt)); } }
      });
      var st = cd.querySelector('[data-wd-state="' + gk + '"]'), gp = f.problems.filter(function (x) { return groupOf(x.key) === gk; });   // v1.0.2
      if (st) { var tot = GROUPS[gk].length; st.textContent = !gp.length ? 'Saved' : (f.empty ? (gk === 'inbox' ? 'Not set' : 'Not written') : gp.map(function (x) { return x.text; }).join('; ')); st.className = 'ipp-wd-gs' + (!gp.length ? ' is-ok' : f.empty ? '' : ' is-bad'); }
      var ed = cd.querySelector('[data-wd-edit="' + gk + '"]'); if (ed) { ed.hidden = open || f.locked; ed.disabled = waiting || busy; }
      var ft = cd.querySelector('[data-wd-foot="' + gk + '"]'); if (ft) ft.hidden = !open;
      var cancel = cd.querySelector('[data-wd-cancel="' + gk + '"]'); if (cancel) cancel.hidden = f.locked || W.saving === gk;
      var sb = cd.querySelector('[data-wd-save="' + gk + '"]'); if (sb) { sb.disabled = !d.length || bad || f.locked || busy || !f.gs || (gk !== 'top' && !f.nl); sb.textContent = W.saving === gk ? 'Saving\u2026' : 'Save'; }
      var msg = cd.querySelector('[data-wd-msg="' + gk + '"]'); if (msg) { msg.hidden = !W.msg[gk]; msg.textContent = W.msg[gk] || ''; msg.className = 'ipp-wd-msg' + (W.msgKind[gk] ? ' is-' + W.msgKind[gk] : ''); }
      cd.classList.toggle('is-locked', f.locked); cd.classList.toggle('is-waiting', waiting); cd.classList.toggle('is-dirty', !!d.length); cd.classList.toggle('is-open', open); cd.classList.toggle('is-stale', f.stale && gk === 'top'); cd.classList.toggle('is-bad', !f.empty && !waiting && gp.length > 0);   // v1.0.2
    });
    var note = p.querySelector('[data-wd-note]'); if (note) { note.hidden = !f.locked; note.textContent = f.locked ? 'This plan is locked; the words are read-only.' : ''; }
    // the rail dot
    if (window.IPP && IPP.dot) IPP.dot(VIEW, !f.gs ? '' : (f.done && f.written.length === KEYS.length && !f.stale) ? 'ok' : 'bad');
  }

  // ── mount and events ────────────────────────────────────────
  function mount() {
    var c = canvas(); if (!c || c.getAttribute(MOUNTED) === '1') return;
    c.innerHTML = html(); c.setAttribute(MOUNTED, '1');
    c.addEventListener('click', function (e) {
      var t = e.target, el;
      if ((el = t.closest('[data-wd-tick]'))) { e.preventDefault(); tick(facts().done ? false : true); return; }
      if ((el = t.closest('[data-wd-untick]'))) { e.preventDefault(); tick(false); return; }
      if ((el = t.closest('[data-wd-ai]')) || (el = t.closest('[data-wd-again]'))) { e.preventDefault(); generate(); return; }
      if ((el = t.closest('[data-wd-undo]'))) { e.preventDefault(); undo(); return; }
      if ((el = t.closest('[data-wd-keep]'))) { e.preventDefault(); save('top', true); return; }
      if ((el = t.closest('[data-wd-cancel]'))) { e.preventDefault(); revert(el.getAttribute('data-wd-cancel')); return; }
      if ((el = t.closest('[data-wd-save]'))) { e.preventDefault(); save(el.getAttribute('data-wd-save'), false); return; }
      if ((el = t.closest('[data-wd-edit]'))) { e.preventDefault(); openCard(el.getAttribute('data-wd-edit')); return; }
      if ((el = t.closest('[data-wd-type]'))) { e.preventDefault(); openAll(); return; }
    });
    c.addEventListener('input', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-wd-field')) input(e.target); });
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.hasAttribute && e.target.hasAttribute('data-wd-field')) e.preventDefault(); });   // one line; a line break breaks the render
    paint(true);
  }
  function redraw() {
    var c = canvas(); if (!c || c.getAttribute(MOUNTED) !== '1') return;
    var a = document.activeElement, typing = a && a.hasAttribute && a.hasAttribute('data-wd-field');
    paint(!dirty().length && !typing);
  }
  document.addEventListener('ipp:ready', mount);
  document.addEventListener('ipp:view', function (e) { if (e.detail && e.detail.view === VIEW) { mount(); redraw(); } });
  document.addEventListener('ipp:board', function () { if (W.saving || W.doneBusy) return; W.doneMsg = ''; mount(); redraw(); });
  if (document.querySelector('[data-ipp-root]')) mount();

  window.IppWords = { version: VERSION, file: FILE, facts: facts, pending: function () { return dirty(); } };
  try { console.log('[ipp-words] ' + FILE + ' ready'); } catch (e) {}
})();
