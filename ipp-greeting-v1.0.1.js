/* ipp-greeting-v1.0.1.js */
/* ============================================================
   ipp-greeting-v1.0.1.js — the Greeting tab of the IPP
   Companion stylesheet: ipp-greeting-v1.0.1.css
   v1.0.1 (20 Oct 2026, Jeff's first run on 901A):
     1. The tick's read-back checks Scenario 124's answer under its own
        key, flag, as the Picker does (the write had succeeded; the
        v1.0.0 check read the field slug and said "did not store").
        The message clears on the next board read.
     2. Cross-tab check: the tick refuses while Layout or the Picker has
        unsaved changes ("Save or cancel them first").
     3. The stale wording says what is true: the block row was saved
        after the greeting (a Layout move or a design change counts; the
        greeting names the lead story and the order).
     4. The page has its own head classes (the Compile ones did not take
        inside the Layout clone), no duplicate kicker, Undo is a button,
        the modal context formats the date.
     5. The card is a reading card: the title, the short greeting and the
        paragraph shown in full, labelled with where each prints; Edit
        swaps the same three blocks for the boxes in place. Nothing is
        truncated on a page this size.
   v1.0.0 kept below.
   Needs: ipp-shell v1.21 (the 'greeting' view and IPP.dot), ix-ai v1.1.0
   (the spread modal, one prompt per field), ix-issue-data v1.0.67
   (slots[].greetingDone, blockFields.greetingDone, /greeting-context),
   Scenario 124 (op flag, as the Picker's list-done), Scenario 122
   (op block-save, blockType gr, as before), PP_WEBHOOKS.anthropicProxy.

   What it is (20 Oct 2026, 106 Gap Interview S4; mockup v0.4 accepted)
   The greeting left the Compile page (ipp-publish v2.33). This tab, below
   Layout, holds everything about it:
     1. The done card. One tick, "The newsletter is done." It is NL-BLOCKS
        greeting-done on the GR row, written through Scenario 124's flag op.
        The PATCH moves the GR row's updatedAt, which is the "done at" time;
        no date field. "Write the greeting" and "Type it by hand" wait for
        the tick, so the greeting is written on purpose, from a finished
        issue. Undo clears the flag.
     2. The stale rule (ipp-publish v2.26, unchanged): an article, event or
        listing block saved after the GR row makes the greeting stale. On
        screen the tick shows cleared ("Content changed since you marked it
        done") and the band turns salmon. The tick itself is off while
        stale: its own PATCH would move the stamp and make the old greeting
        look current without anyone reading it. Instead "Keep this
        greeting" or "Write it again" is the reaffirmation; either one
        stamps the row, the stale count returns to zero, and the tick is
        back on by itself because the flag never changed.
     3. The band and the boxes, moved from ipp-publish v2.30-v2.32 as they
        were: band = action, boxes under it only while editing, Save is the
        only write (Scenario 122 block-save, read back from the plan,
        TOAST-TRUTH).
     4. AI writes from the issue digest: GET /greeting-context answers the
        articles (title, sub-title, summary, body to 1,500 characters), the
        events (name, when, venue, description) and The Find (title, text),
        in page order; no real estate, no display ads. The shared prompt the
        model reads is that digest plus the house rules; each field has its
        own prompt block (ix-ai v1.1.0). The operator sees and can change
        all of it on the modal's Prompt tab for the session.
     5. The rail dot (IPP.dot('greeting', …)): green when the greeting is
        written, done and not stale; salmon otherwise; grey with no GR block.

   HARDCODING (tracker rows)
     HC-P-GR1-1  GR_KEYS/GR_LABEL/GR_REQ/GR_MAX 50/600/140 (from ipp-publish, HC-P-S10-7)
     HC-P-GR1-2  GR_MODEL 'claude-sonnet-4-6' (HC-P-PUB26-2)
     HC-P-GR1-3  GR_STALE_TYPES article/event/re (HC-P-PUB26-3)
     HC-P-GR1-4  GR_TONES Warm/Playful/Straight; GR_COUNT 3/3/2 (HC-P-PUB30-1; Jeff: two paragraphs)
     HC-P-GR1-5  HOUSE_RULES and FIELD_PROMPT text live here (per-title versions on TITLES-ADMIN later)
     HC-P-GR1-6  the done card and band wording
     HC-P-GR1-7  the Worker route name /greeting-context, from PP_WEBHOOKS.planBoard's origin
   ============================================================ */
(function () {
  'use strict';
  var VERSION = '1.0.1', FILE = 'ipp-greeting-v1.0.1.js', VIEW = 'greeting', MOUNTED = 'data-greeting-mounted';

  // ── constants ───────────────────────────────────────────────
  var GR = 'GR';                                                            // the Greeting block type (HC-P-S16-1 class)
  var GR_KEYS = ['title', 'paragraph', 'supershort'];                      // HC-P-GR1-1
  var GR_LABEL = { title: 'Title', paragraph: 'Paragraph (web page)', supershort: 'Short greeting (email)' };
  var GR_REQ = ['title', 'paragraph', 'supershort'];
  var GR_MAX = { title: 50, paragraph: 600, supershort: 140 };
  var GR_MIN = { paragraph: 550 };                                          // a target in the prompt only, never a gate
  var GR_WORD = { title: 'a title', paragraph: 'a paragraph', supershort: 'a short greeting' };
  var GR_MODEL = 'claude-sonnet-4-6';                                       // HC-P-GR1-2
  var GR_STALE_TYPES = ['article', 'event', 're'];                          // HC-P-GR1-3
  var GR_TONES = ['Warm', 'Playful', 'Straight'], GR_COUNT = { title: 3, supershort: 3, paragraph: 2 };   // HC-P-GR1-4
  var GR_TRIES = 4, GR_GAP_MS = 2500;                                       // the read-back wait (HC-P-IPP3-3)
  var HOUSE_RULES = [                                                       // HC-P-GR1-5
    'Written in the publisher\u2019s voice: warm, neighbourly, plain English, speaking to local readers. Always positive.',
    'Point readers to what is inside. Mention several of the items above, not one; spread the attention across them. Use only the facts given; do not invent names, dates, places or numbers.',
    'The Find, when listed, is a paid listing: you may mention its topic, never sell it.',
    'No emoji, no hashtags, no exclamation marks.'
  ];
  var FIELD_PROMPT = {                                                      // HC-P-GR1-5
    title: 'A heading over the greeting; it prints in the masthead. Sentence case, no colon.',
    supershort: 'One sentence; it prints in the email under the masthead. Name one or two things inside.',
    paragraph: 'Aim for about ' + GR_MIN.paragraph + ' characters. Name the lead article and one event. End with \u201cEnjoy.\u201d'
  };

  // ── helpers (the IPP conventions) ───────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function hooks() { return window.PP_WEBHOOKS || {}; }
  function workerBase() { var pb = hooks().planBoard || ''; return pb.replace(/\/plan-board.*$/, ''); }   // HC-P-GR1-7
  function boardData() { return (window.IPP && IPP.board && typeof IPP.board.data === 'function') ? IPP.board.data() : null; }
  function reload() { return (window.IPP && IPP.board && IPP.board.load) ? IPP.board.load({ fresh: true }) : Promise.resolve(null); }
  function planLocked() { var b = boardData(); return !!(b && b.plan && b.plan.locked); }
  function grSlot() { var b = boardData(); return ((b && b.slots) || []).filter(function (s) { return s.blockLabel === GR || s.blockType === GR; })[0] || null; }
  function doneField() { var b = boardData(); return (b && b.blockFields && b.blockFields.greetingDone) || ''; }
  function canvas() { return document.querySelector('.ipp-view[data-view="' + VIEW + '"] .ipp-canvas'); }
  function box() { var c = canvas(); return c ? c.querySelector('[data-gr-box]') : null; }
  function field(k) { var b = box(); return b ? b.querySelector('[data-gr-field="' + k + '"]') : null; }
  function niceDate(v) { var d = new Date(String(v || '').length === 10 ? v + 'T12:00:00' : v); return isNaN(d) ? String(v || '') : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }   // v1.0.1
  function when(iso) { var d = new Date(iso || ''); return isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function toast(t, kind, detail) { if (window.IxToast && IxToast.show) IxToast.show(t, kind, detail ? { detail: detail } : undefined); else console.warn('[ipp-greeting] ' + t + (detail ? ' \u00b7 ' + detail : '')); }

  // ── state ───────────────────────────────────────────────────
  var G = { draft: {}, saving: false, aiBusy: false, aiBefore: null, missing: {}, msg: '', msgKind: '', open: false, doneBusy: false, doneMsg: '' };

  function saved() { var g = (grSlot() || {}).greeting || {}; var o = {}; GR_KEYS.forEach(function (k) { o[k] = String(g[k] || ''); }); return o; }
  function val(k) { return Object.prototype.hasOwnProperty.call(G.draft, k) ? G.draft[k] : saved()[k]; }
  function dirty() { return Object.keys(G.draft); }
  function isEmpty() { var s = saved(); return GR_REQ.some(function (k) { return !String(s[k] || '').trim(); }); }

  // { known, n, at }: known = the Worker answers updatedAt; n = content blocks saved after the GR row
  function stale() {
    var gs = grSlot(), b = boardData(), out = { known: false, n: 0, at: gs ? gs.updatedAt || '' : '', names: [] };
    if (!gs || !gs.updatedAt) return out;
    var g = Date.parse(gs.updatedAt); if (isNaN(g)) return out;
    out.known = true;
    ((b && b.slots) || []).forEach(function (s) {
      if (s === gs || GR_STALE_TYPES.indexOf(s.assetType) < 0) return;
      if (!((s.asset && !s.asset.missing) || Number(s.listCount) > 0)) return;
      var t = Date.parse(s.updatedAt || ''); if (!isNaN(t) && t > g + 1000) { out.n++; out.names.push((s.asset && s.asset.name) || s.blockLabel || ('block ' + s.position)); }
    });
    return out;
  }
  // the three facts every paint reads
  function facts() {
    var gs = grSlot(), st = stale(), flag = gs ? gs.greetingDone : null;
    var empty = isEmpty(), isStale = !!st.n && !empty;
    return { gs: gs, st: st, flag: flag, empty: empty, stale: isStale, done: flag === true && !isStale, noField: !!gs && flag === null, locked: planLocked() };
  }

  // ── the done tick (Scenario 124 op flag, as the Picker's list-done) ──
  function flag124(on) {
    var gs = grSlot(), url = String(hooks().blockWriter || ''), fld = doneField();
    if (!gs) return Promise.reject(new Error('this plan has no Greeting block'));
    if (!url) return Promise.reject(new Error('this page has no PP_WEBHOOKS.blockWriter address (Scenario 124)'));
    if (!fld) return Promise.reject(new Error('the plan data does not name the done field (blockFields.greetingDone, Data Worker v1.0.67; NL-BLOCKS greeting-done)'));
    var batchId = 'grd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    var ops = [{ id: gs.id, field: fld, on: !!on }];
    var u = url + (url.indexOf('?') < 0 ? '?' : '&') + 'op=flag&batchId=' + encodeURIComponent(batchId) + '&batch=' + encodeURIComponent(JSON.stringify({ ops: ops }));
    return fetch(u, { method: 'GET', credentials: 'omit' }).then(function (r) {
      return r.text().then(function (t) {
        if (!r.ok) throw new Error('Scenario 124 answered HTTP ' + r.status + ' to op flag');
        var b; try { b = JSON.parse(t); } catch (x) { throw new Error('Scenario 124 sent a reply that is not JSON (op flag)'); }
        var res = (b && b.results && b.results[0]) || null;
        if (!res || res.ok !== true || !res.id) throw new Error((res && res.err) || 'Webflow refused the write');
        var fd = res.fieldData || {}, got = Object.prototype.hasOwnProperty.call(fd, 'flag') ? fd.flag : fd[fld];   // v1.0.1: 124 answers under 'flag' (the Picker's check)
        if (String(got) !== String(!!on)) throw new Error('Webflow did not store the tick');
      });
    }).then(reload);
  }
  // v1.0.1: unsaved work on Layout or the Picker means the newsletter is not done
  function unsavedElsewhere() {
    var L = window.IPP && IPP.layout, P = window.IPP && IPP.picker, out = [];
    try { if (L && L.pending && L.pending().length) out.push('Layout has unsaved changes.'); } catch (e) {}
    try { if (P && P.pending) { var p = P.pending(), c = (p.adds || []).length + Object.keys(p.fills || {}).length + Object.keys(p.clears || {}).length + Object.keys(p.removes || {}).length + Object.keys(p.links || {}).length + Object.keys(p.holds || {}).length; if (c) out.push('The Editorial Picker has unsaved changes.'); } } catch (e) {}
    return out.join(' ');
  }
  function tick(on) {
    var f = facts();
    if (G.doneBusy || G.saving || G.aiBusy) return;
    if (f.locked) { toast('This plan is locked', 'info', 'The greeting cannot change.'); return; }
    var elsewhere = unsavedElsewhere(); if (elsewhere && on) { G.doneMsg = elsewhere + ' Save or cancel them first.'; paint(); return; }   // v1.0.1
    if (f.stale && on) { G.doneMsg = 'Keep the greeting or write it again below; that marks the newsletter done again.'; paint(); return; }
    G.doneBusy = true; G.doneMsg = on ? 'Marking it done\u2026' : 'Undoing\u2026'; paint();
    flag124(on).then(function () {
      G.doneBusy = false; G.doneMsg = '';
      toast(on ? 'Newsletter marked done' : 'Done tick removed', 'ok', on ? 'The greeting can be written now.' : 'Write the greeting when the newsletter is done.');
      paint(true);
    }).catch(function (e) {
      G.doneBusy = false; G.doneMsg = 'The tick did not save: ' + ((e && e.message) || e) + '.';
      paint();
    });
  }

  // ── the issue digest and the prompt ────────────────────────
  function fetchContext() {
    var b = boardData(), planId = b && b.plan && b.plan.id, base = workerBase();
    if (!planId) return Promise.reject(new Error('the plan has not been read yet'));
    if (!base) return Promise.reject(new Error('this page has no PP_WEBHOOKS.planBoard address, so the issue digest cannot be read'));
    return fetch(base + '/greeting-context?planId=' + encodeURIComponent(planId), { method: 'GET', credentials: 'omit' }).then(function (r) {
      return r.text().then(function (t) {
        var o = null; try { o = JSON.parse(t); } catch (e) {}
        if (!r.ok || !o || o.ok !== true) throw new Error((o && o.error) || ('the Data Worker answered HTTP ' + r.status + ' to /greeting-context (v1.0.67 needed)'));
        return o;
      });
    });
  }
  function digestText(ctx) {
    var out = [];
    out.push('Articles in this issue, in page order:');
    if (!ctx.articles.length) out.push('- none');
    ctx.articles.forEach(function (a, i) {
      out.push('');
      out.push((i + 1) + '. ' + (a.title || 'Untitled') + (a.subTitle ? ' \u2014 ' + a.subTitle : '') + (a.section ? ' [' + a.section + ']' : ''));
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
  function sharedPrompt(ctx) {
    var b = boardData(), plan = (b && b.plan) || {};
    return 'Write the greeting that opens this issue of a local community newsletter.\n\n' +
      'Newsletter: ' + (ctx.plan.titleName || plan.titleName || 'the newsletter') + '\n' +
      ((ctx.plan.date || plan.date) ? 'Issue date: ' + niceDate(ctx.plan.date || plan.date) + '\n' : '') +
      '\n' + digestText(ctx) +
      '\n\nRules:\n' + HOUSE_RULES.map(function (r) { return '- ' + r; }).join('\n') + '\n';
  }
  function ask(prompt) {
    return fetch(String(hooks().anthropicProxy || ''), { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: GR_MODEL, max_tokens: 1200, messages: [{ role: 'user', content: prompt }] }) })
      .then(function (r) { return r.text().then(function (t) {
        var b = null; try { b = JSON.parse(t); } catch (e) {}
        if (!r.ok) throw new Error((b && b.error && (b.error.message || b.error)) || ('the AI service answered HTTP ' + r.status));
        return ((b && b.content) || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('');
      }); });
  }
  function gate(f) {                                                        // '' when the modal may open
    if (f.locked) return 'This plan is locked.';
    if (!f.gs) return 'This plan has no Greeting block.';
    if (!hooks().anthropicProxy) return 'AI writing is not set up on this page (PP_WEBHOOKS.anthropicProxy).';
    if (!f.done && !f.stale && !f.noField) return 'Mark the newsletter done first.';
    return '';
  }
  function generate() {
    var f = facts();
    if (G.aiBusy || G.saving || G.doneBusy) return;
    var g = gate(f); if (g) { toast('Not ready to write', 'info', g); return; }
    if (!window.IxAI || !IxAI.open) { toast('The AI modal is not on this page', 'err', 'ix-ai-v1.1.0.js is missing from the body.'); return; }
    G.aiBusy = true; G.msg = 'Reading the issue\u2026'; G.msgKind = ''; paint();
    fetchContext().then(function (ctx) {
      if (!ctx.articles.length && !ctx.events.length) throw new Error('the issue has no articles or events yet; the greeting is written from them');
      var cur = {}; GR_KEYS.forEach(function (k) { cur[k] = val(k); });
      G.msg = ''; paint();
      return IxAI.open({
        title: 'Write the greeting',
        context: [ctx.plan.titleName, ctx.plan.date ? niceDate(ctx.plan.date) + ' issue' : '', plural(ctx.articles.length, 'article') + ', ' + plural(ctx.events.length, 'event') + (ctx.finds.length ? ', The Find' : '')].filter(Boolean).join(' \u00b7 '),
        model: GR_MODEL,
        prompt: sharedPrompt(ctx),
        ask: ask,
        fields: [
          { key: 'title',      label: 'Title',                  short: 'Titles',    max: GR_MAX.title,      count: GR_COUNT.title,      tones: GR_TONES, cols: 3, rows: 1, value: cur.title,      prompt: FIELD_PROMPT.title },
          { key: 'supershort', label: 'Short greeting (email)', short: 'Short',     max: GR_MAX.supershort, count: GR_COUNT.supershort, tones: GR_TONES, cols: 3, rows: 2, value: cur.supershort, prompt: FIELD_PROMPT.supershort },
          { key: 'paragraph',  label: 'Paragraph (web page)',   short: 'Paragraph', max: GR_MAX.paragraph,  count: GR_COUNT.paragraph,  tones: ['Warm', 'Straight'], cols: 2, rows: 5, value: cur.paragraph, prompt: FIELD_PROMPT.paragraph }
        ]
      });
    }).then(function (out) {
      G.aiBusy = false;
      if (!out) { paint(); return; }
      var before = {}; GR_KEYS.forEach(function (k) { before[k] = val(k); });
      G.aiBefore = before;
      GR_KEYS.forEach(function (k) { set(k, out.values[k]); });
      G.open = true; G.msg = 'Read it once more, then Save. Undo puts back what was there.'; G.msgKind = 'ok';
      paint(true);
      var fe = field('title'); if (fe) fe.focus({ preventScroll: true });
    }).catch(function (e) { G.aiBusy = false; G.msg = 'The greeting could not be written: ' + ((e && e.message) || e) + '.'; G.msgKind = 'err'; paint(); });
  }

  // ── the boxes ───────────────────────────────────────────────
  function set(k, v) { v = String(v == null ? '' : v); if (v === saved()[k]) delete G.draft[k]; else G.draft[k] = v; delete G.missing[k]; }
  function input(el) {
    var k = el.getAttribute('data-gr-field');
    if (/[\r\n]/.test(el.value)) { var at = el.selectionStart; el.value = el.value.replace(/\r\n|[\r\n]/g, ' '); try { el.setSelectionRange(at, at); } catch (e) {} }
    set(k, el.value); G.msg = ''; paint();
  }
  function undo() { if (!G.aiBefore) return; var b = G.aiBefore; G.aiBefore = null; GR_KEYS.forEach(function (k) { set(k, b[k]); }); G.msg = ''; paint(true); }
  function revert() { G.draft = {}; G.missing = {}; G.aiBefore = null; G.msg = ''; G.open = false; paint(true); }
  function openBoxes() {
    var f = facts(); if (f.locked) return;
    if (f.empty && !f.done && !f.noField) { toast('Not ready to write', 'info', 'Mark the newsletter done first.'); return; }
    G.open = true; paint(true);
    var k = GR_KEYS.filter(function (x) { return !String(val(x) || '').trim(); })[0] || 'title'; var fe = field(k); if (fe) fe.focus({ preventScroll: true });
  }

  // keep = true re-saves the saved words so the GR row is stamped after
  // the content; the stale rule clears and the done tick is back.
  function save(keep) {
    if (G.saving || G.aiBusy || G.doneBusy) return;
    var f = facts(), t = (window.IPP && IPP.tenant) ? IPP.tenant() : {};
    if (f.locked) { toast('This plan is locked', 'info', 'The greeting cannot change.'); return; }
    if (!f.gs) { toast('Can\u2019t save the greeting', 'err', 'This plan has no Greeting block.'); return; }
    if (!hooks().ipp || !t.pubplanId) { toast('Can\u2019t save the greeting', 'err', 'This page has no PP_WEBHOOKS.ipp address (Scenario 122).'); return; }
    if (!keep && !dirty().length) return;
    var sent = {}; GR_KEYS.forEach(function (k) { sent[k] = keep ? saved()[k] : val(k); });
    G.missing = {};
    var miss = GR_REQ.filter(function (k) { return !String(sent[k] || '').trim(); });
    if (miss.length) {
      miss.forEach(function (k) { G.missing[k] = true; });
      G.msg = 'The greeting needs ' + miss.map(function (k) { return GR_WORD[k]; }).join(miss.length === 2 ? ' and ' : ', ').replace(/, ([^,]*)$/, ' and $1') + ' before it can save.'; G.msgKind = 'err';
      paint(); var fe = field(miss[0]); if (fe) fe.focus(); return;
    }
    var gs = f.gs;
    G.saving = true; G.msg = keep ? 'Keeping the greeting, then reading it back\u2026' : 'Saving, then reading it back\u2026'; G.msgKind = ''; paint();
    IPP.post('ipp', { op: 'block-save', blockType: 'gr', stage: 'planning', pubplanId: t.pubplanId, titleAdminId: t.titleAdminId,
      position: gs.position, nlbId: gs.id, grTitle: sent.title, grParagraph: sent.paragraph, grSupershort: sent.supershort })
      .then(function () {
        var tries = 0, at0 = gs.updatedAt || '';
        var check = function () {
          tries++;
          return new Promise(function (r) { setTimeout(r, GR_GAP_MS); }).then(reload).then(function () {
            var now = grSlot(), g = (now && now.greeting) || {};
            var same = GR_KEYS.every(function (k) { return String(g[k] || '') === sent[k]; });
            var stamped = !at0 || !now || !now.updatedAt || now.updatedAt !== at0;
            if (same && stamped) return true;
            if (tries < GR_TRIES) return check();
            return false;
          });
        };
        return check();
      })
      .then(function (ok) {
        G.saving = false;
        if (ok) { G.draft = {}; G.aiBefore = null; G.msg = ''; G.open = false; toast(keep ? 'Greeting kept' : 'Greeting saved', 'ok', keep ? 'Stamped against the issue as it stands.' : 'Read back from the plan.'); paint(true); }
        else { G.msg = 'The greeting was sent, but the plan does not show it yet. Your words are kept here. Check again in a minute.'; G.msgKind = 'unverified'; paint(); }
      })
      .catch(function (e) { G.saving = false; G.msg = 'The greeting did not send: ' + ((e && e.message) || e) + '. Your words are kept here.'; G.msgKind = 'err'; paint(); });
  }

  // ── markup ──────────────────────────────────────────────────
  function html() {
    var fld = function (k, ctl, cls) {
      var where = { title: 'prints in the masthead', supershort: 'prints in the email', paragraph: 'prints on the web page' }[k];   // v1.0.1
      return '<div class="ipp-gr-f ' + (cls || '') + '"><label class="ipp-gr-l" for="ipp_gr_' + k + '">' + GR_LABEL[k].replace(/ \(.*\)$/, '') + ' <span class="ipp-gr-where">' + where + '</span><em class="ipp-gr-req">required</em><span class="ipp-gr-n" data-gr-count="' + k + '"></span></label>' + ctl + '</div>';
    };
    return '<div class="ipp-gr-page" data-gr-page>' +
      '<div class="ipp-gr-head"><h2 class="ipp-gr-title">Greeting</h2><p class="ipp-gr-lede">Written once, when the newsletter is done. Three parts: the title prints in the masthead, the short greeting in the email, the paragraph on the web page.</p></div>' +
      // the done card (HC-P-GR1-6)
      '<section class="ipp-gr-done" data-gr-done>' +
        '<button type="button" class="ipp-gr-tick" data-gr-tick role="checkbox" aria-checked="false" aria-label="The newsletter is done"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg></button>' +
        '<div class="ipp-gr-dt"><h3 class="ipp-gr-dh" data-gr-done-h></h3><p class="ipp-gr-dp" data-gr-done-p></p><p class="ipp-gr-dm" data-gr-done-m hidden></p></div>' +
        '<div class="ipp-gr-stamp" data-gr-done-stamp></div>' +
      '</section>' +
      // the band and the boxes (ipp-publish v2.30 as they were)
      '<section class="ipp-gr" data-gr-box>' +
        '<div class="ipp-gr-band">' +
          '<div class="ipp-gr-bt"><span class="ipp-gr-h">Greeting</span><span class="ipp-gr-sub" data-gr-stamp></span></div>' +
          '<div class="ipp-gr-acts">' +
            '<button type="button" class="ix-btn ix-btn--primary ipp-gr-ai" data-gr-ai><span class="ipp-gr-spark" aria-hidden="true">\u2728</span><span data-gr-ai-label>Write the greeting</span></button>' +
            '<button type="button" class="ix-btn ix-btn--secondary" data-gr-edit hidden>Edit</button>' +
            '<button type="button" class="ix-btn ix-btn--secondary ipp-gr-keep" data-gr-keep hidden>Keep this greeting</button>' +
            '<button type="button" class="ix-revert" data-gr-type hidden>Type it by hand</button>' +
          '</div></div>' +
        '<p class="ipp-gr-gate" data-gr-gate hidden></p>' +
        '<div class="ipp-gr-body" data-gr-body>' +
          '<p class="ipp-gr-msg" data-gr-msg hidden></p>' +
          '<div class="ipp-gr-row">' +
            fld('title', '<p class="ipp-gr-read is-title" data-gr-read="title"></p><input type="text" class="ix-picker-input ipp-gr-in" id="ipp_gr_title" data-gr-field="title" maxlength="' + GR_MAX.title + '" placeholder="The heading over the greeting; it prints in the masthead" hidden>', 'is-title') +
            fld('supershort', '<p class="ipp-gr-read is-ss" data-gr-read="supershort"></p><textarea class="ix-picker-input ipp-gr-in" id="ipp_gr_supershort" data-gr-field="supershort" maxlength="' + GR_MAX.supershort + '" rows="2" placeholder="One line; it prints in the email" hidden></textarea>', 'is-ss') +
            fld('paragraph', '<p class="ipp-gr-read is-para" data-gr-read="paragraph"></p><textarea class="ix-picker-input ipp-gr-in" id="ipp_gr_paragraph" data-gr-field="paragraph" maxlength="' + GR_MAX.paragraph + '" rows="6" placeholder="The greeting readers see on the web page" hidden></textarea>', 'is-para') +
          '</div>' +
          '<div class="ipp-gr-foot" data-gr-editfoot hidden>' +
            '<button type="button" class="ix-revert" data-gr-undo hidden>Undo AI</button>' +
            '<span class="ipp-gr-sp"></span>' +
            '<button type="button" class="ix-revert" data-gr-cancel>Cancel</button>' +
            '<button type="button" class="ix-btn ix-btn--primary ipp-gr-save" data-gr-save disabled>Save</button>' +
          '</div></div>' +
      '</section>' +
      '<p class="ipp-gr-foot-note" data-gr-note hidden></p>' +
    '</div>';
  }

  // ── paint ───────────────────────────────────────────────────
  function paint(values) {
    var c = canvas(), b = box(); if (!c || !b) return;
    var f = facts(), d = dirty(), sv = saved(), open = G.open || !!d.length;
    var at = when(f.st.at);
    // the done card
    var dc = c.querySelector('[data-gr-done]'), tk = c.querySelector('[data-gr-tick]');
    dc.className = 'ipp-gr-done' + (f.done ? ' is-done' : '') + (f.stale ? ' is-stale' : '') + (G.doneBusy ? ' is-busy' : '');
    tk.setAttribute('aria-checked', f.done ? 'true' : 'false');
    tk.disabled = !f.gs || f.locked || G.doneBusy || G.saving || G.aiBusy || f.noField || f.stale;
    tk.title = f.stale ? 'Keep the greeting or write it again below; that marks the newsletter done again.' : f.noField ? 'The plan data has no done field yet.' : f.done ? 'Undo marks the newsletter not done' : 'Tick when editorial and revenue picks are final and the layout is set';
    var h = c.querySelector('[data-gr-done-h]'), p = c.querySelector('[data-gr-done-p]'), m = c.querySelector('[data-gr-done-m]'), stamp = c.querySelector('[data-gr-done-stamp]');
    if (!f.gs) { h.textContent = 'This plan has no Greeting block.'; p.textContent = 'Add the Greeting block on the Picker, then come back.'; stamp.innerHTML = ''; }
    else if (f.noField) { h.textContent = 'The plan data has no done field.'; p.textContent = 'NL-BLOCKS needs a Switch field, greeting-done, and the Data Worker needs v1.0.67. Until then the greeting can be written without the tick.'; stamp.innerHTML = ''; }
    else if (f.stale) { h.textContent = 'The issue was saved after you marked it done.'; p.textContent = plural(f.st.n, 'block row', 'block rows') + ' saved after the greeting (a moved block or a changed design counts)' + (f.st.names.length ? ' (' + f.st.names.slice(0, 3).join(', ') + (f.st.names.length > 3 ? ', \u2026' : '') + ')' : '') + '. Keep the greeting if it still fits, or write it again; either one marks the newsletter done again.'; stamp.innerHTML = at ? 'Was done ' + esc(at) : ''; }
    else if (f.done) { h.textContent = 'The newsletter is done.'; p.textContent = 'Editorial and revenue picks are final and the layout is set. The greeting can be written. If a block changes afterwards, this tick clears and the greeting is marked stale.'; stamp.innerHTML = (at ? 'Done ' + esc(at) : 'Done') + (f.locked ? '' : ' <button type="button" class="ix-revert ipp-gr-undo-done" data-gr-untick>Undo</button>'); }
    else { h.textContent = 'The newsletter is done.'; p.textContent = 'Tick this when editorial and revenue picks are final and the layout is set. It opens the greeting. If a block changes afterwards, the tick clears and the greeting is marked stale.'; stamp.innerHTML = ''; }
    m.hidden = !G.doneMsg; m.textContent = G.doneMsg || '';
    // the band
    GR_KEYS.forEach(function (k) {
      var fe = field(k); if (!fe) return;
      var rd = b.querySelector('[data-gr-read="' + k + '"]');                                                         // v1.0.1: the reading block
      if (rd) { var txt = String(sv[k] || ''); rd.textContent = txt || 'Not written yet.'; rd.classList.toggle('is-none', !txt); rd.hidden = open; }
      fe.hidden = !open;
      if (values) fe.value = val(k);
      fe.readOnly = f.locked || G.saving;
      var on = Object.prototype.hasOwnProperty.call(G.draft, k);
      fe.classList.toggle('ix-picker-input--changed', on); fe.classList.toggle('ipp-dirty', on);
      fe.classList.toggle('is-missing', !!G.missing[k]);
      var n = b.querySelector('[data-gr-count="' + k + '"]'); if (n) { var len = String(fe.value || '').length; n.textContent = len + ' / ' + GR_MAX[k]; n.classList.toggle('is-at', len >= GR_MAX[k]); }
    });
    var sub = b.querySelector('[data-gr-stamp]');
    if (sub) sub.textContent = !f.gs ? 'This plan has no Greeting block.'
      : f.empty ? 'Not written'
      : f.stale ? plural(f.st.n, 'block') + ' saved since the greeting was' + (at ? ', ' + at : '') + '.'
      : 'Saved' + (at ? ' ' + at : '') + (f.st.known ? ' \u00b7 fits the issue' : '');
    var locked = !f.done && !f.stale && !f.noField && !!f.gs;                // the band waits for the tick
    var g = gate(f);
    var ai = b.querySelector('[data-gr-ai]'), aiL = b.querySelector('[data-gr-ai-label]');
    if (ai) { ai.hidden = f.locked; ai.disabled = !!g || G.aiBusy || G.saving || G.doneBusy; ai.title = g || 'Offers a spread of titles, short greetings and paragraphs written from the issue'; ai.className = 'ix-btn ' + (f.empty || f.stale ? 'ix-btn--primary' : 'ix-btn--secondary') + ' ipp-gr-ai'; }
    if (aiL) aiL.textContent = G.aiBusy ? 'Writing\u2026' : f.empty ? 'Write the greeting' : 'Write it again';
    var ed = b.querySelector('[data-gr-edit]'); if (ed) ed.hidden = f.empty || f.stale || open || f.locked;
    var ty = b.querySelector('[data-gr-type]'); if (ty) { ty.hidden = open || f.locked || (!f.empty && !f.stale); ty.disabled = locked; ty.textContent = f.empty ? 'Type it by hand' : 'Edit by hand'; }
    var keep = b.querySelector('[data-gr-keep]'); if (keep) { keep.hidden = !f.stale || open || f.locked; keep.disabled = G.saving; }
    var gt = b.querySelector('[data-gr-gate]'); if (gt) { gt.hidden = !locked || open; gt.textContent = 'Opens when the newsletter is marked done above.'; }
    var body = b.querySelector('[data-gr-body]'); if (body) body.hidden = !f.gs;
    var ef = b.querySelector('[data-gr-editfoot]'); if (ef) ef.hidden = !open;   // v1.0.1
    var un = b.querySelector('[data-gr-undo]'); if (un) un.hidden = !G.aiBefore || f.locked || G.saving;
    var cancel = b.querySelector('[data-gr-cancel]'); if (cancel) cancel.hidden = f.locked || G.saving;
    var sb = b.querySelector('[data-gr-save]'); if (sb) { sb.disabled = !d.length || f.locked || G.saving || !f.gs; sb.textContent = G.saving ? 'Saving\u2026' : 'Save'; }
    var msg = b.querySelector('[data-gr-msg]');
    if (msg) { msg.hidden = !G.msg; msg.textContent = G.msg || ''; msg.className = 'ipp-gr-msg' + (G.msgKind ? ' is-' + G.msgKind : ''); }
    b.classList.toggle('is-locked', f.locked); b.classList.toggle('is-waiting', locked); b.classList.toggle('is-stale', f.stale); b.classList.toggle('is-dirty', !!d.length); b.classList.toggle('is-open', open); b.classList.toggle('is-empty', f.empty);
    var note = c.querySelector('[data-gr-note]'); if (note) { note.hidden = !f.locked; note.textContent = f.locked ? 'This plan is locked; the greeting is read-only.' : ''; }
    // the rail dot
    if (window.IPP && IPP.dot) IPP.dot(VIEW, !f.gs ? '' : (f.done && !f.empty && !f.stale) ? 'ok' : 'bad');
  }

  // ── mount and events ────────────────────────────────────────
  function mount() {
    var c = canvas(); if (!c || c.getAttribute(MOUNTED) === '1') return;
    c.innerHTML = html(); c.setAttribute(MOUNTED, '1');
    c.addEventListener('click', function (e) {
      var t = e.target, el;
      if ((el = t.closest('[data-gr-tick]'))) { e.preventDefault(); tick(facts().done ? false : true); return; }
      if ((el = t.closest('[data-gr-untick]'))) { e.preventDefault(); tick(false); return; }
      if ((el = t.closest('[data-gr-ai]'))) { e.preventDefault(); generate(); return; }
      if ((el = t.closest('[data-gr-undo]'))) { e.preventDefault(); undo(); return; }
      if ((el = t.closest('[data-gr-keep]'))) { e.preventDefault(); save(true); return; }
      if ((el = t.closest('[data-gr-cancel]'))) { e.preventDefault(); revert(); return; }
      if ((el = t.closest('[data-gr-save]'))) { e.preventDefault(); save(false); return; }
      if ((el = t.closest('[data-gr-edit]')) || (el = t.closest('[data-gr-type]'))) { e.preventDefault(); openBoxes(); return; }
    });
    c.addEventListener('input', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-gr-field')) input(e.target); });
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.hasAttribute && e.target.hasAttribute('data-gr-field')) e.preventDefault(); });   // one line; a line break breaks the render
    paint(true);
  }
  function redraw() {
    var c = canvas(); if (!c || c.getAttribute(MOUNTED) !== '1') return;
    var a = document.activeElement, typing = a && a.hasAttribute && a.hasAttribute('data-gr-field');
    paint(!dirty().length && !typing);
  }
  document.addEventListener('ipp:ready', mount);
  document.addEventListener('ipp:view', function (e) { if (e.detail && e.detail.view === VIEW) { mount(); redraw(); } });
  document.addEventListener('ipp:board', function () { if (G.saving || G.doneBusy) return; G.doneMsg = ''; mount(); redraw(); });   // v1.0.1: a fresh read clears the tick message
  if (document.querySelector('[data-ipp-root]')) mount();

  window.IppGreeting = { version: VERSION, file: FILE, facts: facts, stale: stale };
  try { console.log('[ipp-greeting] ' + FILE + ' ready'); } catch (e) {}
})();
