// ps-review-v1.0.0.js
// ============================================================
// INBXIFY · the advertiser review page (www.inbxify.com/review?t=<token>)
//
// v1.0.0 (10 Nov 2026, Publisher Portal S8 · Ads Tab Build) — FIRST BUILD,
//   from advertiser review page mockup v0.2 (accepted 9 Nov).
//
// WHAT IT IS
//   The page a publisher's "Ask the advertiser" link opens. No login: the
//   token in the link is the key, and ix-sales answers only while the link
//   is live (14 days). The advertiser sees the publisher's logo, one card
//   per ad (the real picture), and answers each one: Looks good, or Ask
//   for changes. Changes are said out loud first (the microphone), typed
//   as a fallback, with photos or files attached. "Here is what we heard"
//   shows the transcript's two notes (You like / Change), both editable.
//   Every answered card gets the gold border and its own Cancel (the
//   standing editing rule); the send bar carries the name and Send. The
//   publisher's OK still decides everything: the answer is input.
//   Expired link: a plain page with a button that opens the advertiser's
//   own email program addressed to the publisher's Business Email.
//
// DATA (ix-sales v1.3.1, origin + token)
//   GET  /review/<token>              the publisher, title, customer, items
//   POST /review/<token>/transcribe   the recording → { said, like, change }
//   POST /review/<token>/file         multipart file → { url, name }
//   POST /review/<token>/answer       { name, items[] }
//
// THE PAGE (Webflow static page /review, no Memberstack)
//   <div id="ps-review" data-sales-url="https://ix-sales…workers.dev"
//        data-inbxify-logo="<inbxify wordmark url>"></div>
//   plus this file and ps-review-v1.0.0.css. Fonts: Newsreader, Sen,
//   Josefin Sans (the portal's).
//
// HARDCODING (provisional ids, for the tracker)
//   HC-P-PP8-9   W: every word on the page.
//   HC-P-PP8-10  recording: audio/webm (audio/mp4 on Safari), 4 minutes
//                at most (REC_MAX_MS); files 20 MB at most (ix-sales caps too).
// ============================================================
(function () {
  'use strict';
  var VERSION = '1.0.0', FILE = 'ps-review-v' + VERSION + '.js';
  var REC_MAX_MS = 4 * 60 * 1000;                                        // HC-P-PP8-10
  var W = {                                                              // HC-P-PP8-9
    powered: 'Powered by',
    loading: 'Opening your ads\u2026',
    h1: 'Your ads for {title}',
    lede: '{person} at {company} would like your OK on {n}. Approve each one, or tell {first} what to change.',
    one: '1 ad', many: '{n} ads',
    ledeSmall: 'This link is only for you. It works until {until}.',
    where: { banner: 'In the newsletter email and on the website', sidebar: 'Beside the stories on the website', splash: 'On the page readers land on from the email', text: 'In the newsletter email' },
    approve: 'Looks good, approve it', change: 'Ask for changes',
    approved: 'You approved this {shape}.', asking: 'You are asking for changes.',
    stApproved: 'Approved', stChanges: 'Changes',
    cancel: 'Cancel',
    tell: 'Tell {first} what to change', tellSub: 'Talk it through, the way you would on the phone. Say what you like too.',
    tap: 'Tap to start talking', listening: 'Listening, {t}. Tap to finish.', working: 'Writing down what you said\u2026',
    typeInstead: 'Type instead', talkInstead: 'Talk instead', addFiles: 'Add photos or files', again: 'Say it again',
    typeLabel: 'What to change, and what you like', done: 'Done',
    heard: 'Here is what we heard', heardSub: 'Fix anything we got wrong. This is what {first} will see.',
    like: 'You like', changeL: 'Change', verbatim: 'What you said, word for word',
    noHear: 'We could not hear anything. Try again, or type instead.',
    noMic: 'Your browser cannot record here. Type instead.',
    micDenied: 'The microphone was not allowed. Type instead, or allow it in your browser settings.',
    fileAdded: 'Added. It goes to {first} with your answer.', fileFail: 'That file did not upload: {msg}', fileBig: 'That file is too big (20 MB at most).',
    remove: 'Remove {name}',
    barReady: '{parts}', barNone: 'Nothing ready to send', parts: { ok: '{n} approved', chg: '{n} with changes' },
    barWorking: 'Finish the change you are describing first.',
    barLeft: '{n} still without an answer. You can send now and {first} will see that.', barLeft1: '1 ad still without an answer. You can send now and {first} will see that.',
    yourName: 'Your name', send: 'Send to {first}', sending: 'Sending\u2026',
    thanks: 'Thanks{name}. {first} has your answers.',
    thanksLine: { approve: '{shape}: approved', change: '{shape}: changes asked for', none: '{shape}: no answer' },
    thanksNote: '{first} gives the final OK before anything runs. Nothing changes until that happens. You can close this page.',
    alreadyH: 'You already answered', already: 'This link was answered by {who}. If something changed, ask {first} for a new link.',
    expiredH: 'This link has expired', expired: 'Links to review ads work for {days} days. Ask {person} at {company} for a new one.',
    emailBtn: 'Email {first} for a new link', emailUnder: 'Opens your email with a short note to {email}. Change it before you send if you like.',
    emailSubj: 'New link to review our ads for {title}', emailBody: 'Hi {first},\n\nThe link to review the {customer} ads has expired. Could you send me a new one?\n\nThanks',
    noEmail: '{company} has no contact email set up yet, so ask them the way you usually reach them.',
    badH: 'This link is not one we made', bad: 'Check the link in your email and try again, or ask the publisher who sent it for a new one.',
    failH: 'Something went wrong', fail: 'The page could not load your ads: {msg}',
    sendFail: 'Your answers did not send: {msg}',
    needName: 'Add your name to send.'
  };
  var MIC = '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';

  var root, cfg, token, D = null, A = {}, who = '', page = 'open', rec = null, toastT = null, sendErr = '', sending = false;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function fill(t, o) { return String(t).replace(/\{(\w+)\}/g, function (_, k) { return o[k] == null ? '' : o[k]; }); }
  function day(v) { if (!v) return ''; var d = new Date(v); return isNaN(d) ? String(v).slice(0, 10) : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }); }
  function first() { return (D && D.publisher && (D.publisher.person || '').split(' ')[0]) || (D && D.publisher && D.publisher.company) || 'the publisher'; }
  function toast(t) { clearTimeout(toastT); var w = root.querySelector('#ps-rv-toast'); if (!w) return; w.innerHTML = '<div class="ps-rv-toast" role="status">' + esc(t) + '</div>'; toastT = setTimeout(function () { w.innerHTML = ''; }, 2600); }

  // ── calls ───────────────────────────────────────────────────
  async function api(path, o) {
    o = o || {};
    var init = { method: o.method || 'GET', headers: {} };
    if (o.json !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(o.json); }
    else if (o.body !== undefined) { init.body = o.body; if (o.type) init.headers['Content-Type'] = o.type; }
    if (o.headers) Object.keys(o.headers).forEach(function (k) { init.headers[k] = o.headers[k]; });
    var res, j = null;
    try { res = await fetch(cfg.salesUrl + path, init); } catch (e) { return { status: 0, ok: false, json: { error: 'No answer from the server. Check your connection and try again.' } }; }
    try { j = await res.json(); } catch (e) { j = { error: 'The server sent an answer that could not be read (HTTP ' + res.status + ').' }; }
    return { status: res.status, ok: res.ok && !!(j && j.ok), json: j || {} };
  }

  // ── drawing ─────────────────────────────────────────────────
  function art(it) {
    var p = it.picture || '';
    if (/^https?:\/\//.test(p)) return '<img class="ps-rv-img s-' + esc(it.shape) + '" src="' + esc(p) + '" alt="' + esc(it.label + ': ' + it.name) + '">';
    return '<div class="ps-rv-textad"><b>' + esc(it.name) + '</b><div>' + esc(p) + '</div></div>';
  }
  function files(it, a) { return a.files.length ? '<div class="ps-rv-files">' + a.files.map(function (f, i) { return '<span class="ps-rv-chip"><span class="th"></span>' + esc(f.name) + '<button type="button" data-rmf="' + esc(it.key) + '|' + i + '" aria-label="' + esc(fill(W.remove, { name: f.name })) + '">\u00d7</button></span>'; }).join('') + '</div>' : ''; }
  function panel(it) {
    var a = A[it.key], f = first(), k = esc(it.key);
    if (a.step === 'mic' || a.step === 'rec' || a.step === 'work') {
      var lab = a.step === 'rec' ? fill(W.listening, { t: a.t || '0:00' }) : a.step === 'work' ? W.working : W.tap;
      return '<div class="ps-rv-panel"><h3>' + esc(fill(W.tell, { first: f })) + '</h3><p>' + esc(W.tellSub) + '</p>' +
        '<button type="button" class="ps-rv-mic' + (a.step === 'rec' ? ' on' : '') + '" data-mic="' + k + '" aria-label="' + (a.step === 'rec' ? 'Stop recording' : 'Start recording') + '"' + (a.step === 'work' ? ' disabled' : '') + '>' + MIC + '</button>' +
        '<p class="ps-rv-miclab" id="lab-' + k + '">' + esc(lab) + '</p>' + (a.err ? '<p class="ps-rv-err">' + esc(a.err) + '</p>' : '') +
        '<div class="ps-rv-alt"><button type="button" class="ps-rv-link" data-type="' + k + '">' + esc(W.typeInstead) + '</button><button type="button" class="ps-rv-link" data-file="' + k + '">' + esc(W.addFiles) + '</button></div>' + files(it, a) +
        '<div class="ps-rv-pacts"><button type="button" class="ps-rv-cancel" data-undo="' + k + '">' + esc(W.cancel) + '</button></div></div>';
    }
    if (a.step === 'type') return '<div class="ps-rv-panel"><h3>' + esc(fill(W.tell, { first: f })) + '</h3>' +
      '<label class="ps-rv-f" for="t-' + k + '">' + esc(W.typeLabel) + '</label><textarea id="t-' + k + '" data-txt="' + k + '" class="' + (a.typed ? 'chg' : '') + '">' + esc(a.typed || '') + '</textarea>' +
      '<div class="ps-rv-alt left"><button type="button" class="ps-rv-link" data-file="' + k + '">' + esc(W.addFiles) + '</button><button type="button" class="ps-rv-link" data-back="' + k + '">' + esc(W.talkInstead) + '</button></div>' + files(it, a) +
      '<div class="ps-rv-pacts"><button type="button" class="ps-rv-cancel" data-undo="' + k + '">' + esc(W.cancel) + '</button><button type="button" class="ps-rv-btn" data-done="' + k + '"' + (a.typed && a.typed.trim() ? '' : ' disabled') + '>' + esc(W.done) + '</button></div></div>';
    return '<div class="ps-rv-panel"><h3>' + esc(W.heard) + '</h3><p>' + esc(fill(W.heardSub, { first: f })) + '</p>' +
      '<dl class="ps-rv-heard"><dt><label for="l-' + k + '">' + esc(W.like) + '</label></dt><dd><textarea id="l-' + k + '" data-like="' + k + '">' + esc(a.like) + '</textarea></dd>' +
      '<dt><label for="c-' + k + '">' + esc(W.changeL) + '</label></dt><dd><textarea id="c-' + k + '" data-change="' + k + '">' + esc(a.change) + '</textarea></dd></dl>' +
      (a.said ? '<details><summary>' + esc(W.verbatim) + '</summary><div class="ps-rv-verb">' + esc(a.said) + '</div></details>' : '') +
      '<div class="ps-rv-alt left"><button type="button" class="ps-rv-link" data-file="' + k + '">' + esc(W.addFiles) + '</button><button type="button" class="ps-rv-link" data-back="' + k + '">' + esc(W.again) + '</button></div>' + files(it, a) +
      '<div class="ps-rv-pacts"><button type="button" class="ps-rv-cancel" data-undo="' + k + '">' + esc(W.cancel) + '</button></div></div>';
  }
  function card(it) {
    var a = A[it.key], k = esc(it.key), low = it.label.toLowerCase(), ans;
    if (!a) ans = '<div class="ps-rv-answer"><button type="button" class="ps-rv-btn" data-ok="' + k + '">' + esc(W.approve) + '</button><button type="button" class="ps-rv-btn ghost" data-chg="' + k + '">' + esc(W.change) + '</button></div>';
    else if (a.kind === 'ok') ans = '<div class="ps-rv-picked"><span><b>' + esc(fill(W.approved, { shape: low })) + '</b></span><button type="button" class="ps-rv-cancel" data-undo="' + k + '">' + esc(W.cancel) + '</button></div>';
    else ans = '<div class="ps-rv-picked"><span><b>' + esc(W.asking) + '</b></span></div>' + panel(it);
    var st = !a ? '' : a.kind === 'ok' ? '<span class="ps-rv-state s-ok">' + esc(W.stApproved) + '</span>' : '<span class="ps-rv-state s-chg">' + esc(W.stChanges) + '</span>';
    return '<section class="ps-rv-ad' + (a ? ' chg' : '') + '" aria-labelledby="h-' + k + '"><div class="ps-rv-adhead"><h2 id="h-' + k + '">' + esc(it.label) + '</h2><span class="where">' + esc(W.where[it.shape] || '') + '</span>' + st + '</div>' +
      '<div class="ps-rv-stage">' + art(it) + '</div>' + ans + '</section>';
  }
  function ready(a) { return a.kind === 'ok' || (a.step === 'heard' && ((a.change || '').trim() || (a.like || '').trim())); }
  function header() {
    var p = (D && D.publisher) || {};
    return '<header class="ps-rv-head"><div class="ps-rv-brand"><div class="ps-rv-plate">' + (p.logo ? '<img src="' + esc(p.logo) + '" alt="' + esc(p.company || '') + '">' : '<span class="ps-rv-coname">' + esc(p.company || '') + '</span>') + '</div><div class="ps-rv-hair"></div>' +
      '<div class="ps-rv-powered">' + esc(W.powered) + (cfg.inbxifyLogo ? ' <img src="' + esc(cfg.inbxifyLogo) + '" alt="inbxify">' : ' inbxify') + '</div></div></header>';
  }
  function endCard(h, body, cls) { return '<div class="ps-rv-end' + (cls ? ' ' + cls : '') + '"><h2>' + esc(h) + '</h2>' + body + '</div>'; }
  function render() {
    var h = header() + '<main class="ps-rv-main" id="ps-rv-main">', f = first(), p = (D && D.publisher) || {};
    if (page === 'loading') h += '<p class="ps-rv-loading">' + esc(W.loading) + '</p>';
    else if (page === 'bad') h += endCard(W.badH, '<p>' + esc(W.bad) + '</p>', 'gone');
    else if (page === 'fail') h += endCard(W.failH, '<p>' + esc(fill(W.fail, { msg: sendErr })) + '</p>', 'gone');
    else if (page === 'expired') {
      var mail = p.email ? 'mailto:' + encodeURIComponent(p.email) + '?subject=' + encodeURIComponent(fill(W.emailSubj, { title: D.title || p.company })) + '&body=' + encodeURIComponent(fill(W.emailBody, { first: f, customer: D.customer || 'our' })) : '';
      h += endCard(W.expiredH, '<p>' + esc(fill(W.expired, { days: D.linkDays || 14, person: p.person || p.company, company: p.company })) + '</p>' +
        (mail ? '<p style="margin-top:16px"><a class="ps-rv-btn" href="' + mail + '">' + esc(fill(W.emailBtn, { first: f })) + '</a></p><p class="ps-rv-quiet">' + esc(fill(W.emailUnder, { email: p.email })) + '</p>' : '<p class="ps-rv-quiet">' + esc(fill(W.noEmail, { company: p.company })) + '</p>'), 'gone');
    } else if (page === 'already') h += endCard(W.alreadyH, '<p>' + esc(fill(W.already, { who: D.answeredBy || 'someone', first: f })) + '</p>');
    else if (page === 'done') {
      var lines = D.items.map(function (it) { var a = A[it.key]; return '<li>' + esc(fill(W.thanksLine[a ? (a.kind === 'ok' ? 'approve' : 'change') : 'none'], { shape: it.label })) + '</li>'; }).join('');
      h += endCard(fill(W.thanks, { name: who ? ', ' + who.split(' ')[0] : '', first: f }), '<ul>' + lines + '</ul><p style="margin-top:12px">' + esc(fill(W.thanksNote, { first: f })) + '</p>');
    } else {
      h += '<h1>' + esc(fill(W.h1, { title: D.title || p.company })) + '</h1><p class="ps-rv-lede">' + esc(fill(W.lede, { person: p.person || p.company, company: p.company, n: D.items.length === 1 ? W.one : fill(W.many, { n: D.items.length }), first: f })) +
        '<small>' + esc(fill(W.ledeSmall, { until: day(D.until) })) + '</small></p>' + D.items.map(card).join('') + renderBar();
    }
    h += '</main><div id="ps-rv-toast"></div>';
    var y = window.scrollY; root.innerHTML = h; window.scrollTo(0, y);
  }
  function renderBar() {
    var keys = Object.keys(A); if (!keys.length) return '<div id="ps-rv-bar"></div>';
    var rd = keys.filter(function (k) { return ready(A[k]); }), working = keys.length - rd.length, left = D.items.length - keys.length, f = first();
    var okN = rd.filter(function (k) { return A[k].kind === 'ok'; }).length, chN = rd.length - okN, parts = [];
    if (okN) parts.push(fill(W.parts.ok, { n: okN })); if (chN) parts.push(fill(W.parts.chg, { n: chN }));
    var note = working ? W.barWorking : left === 1 ? fill(W.barLeft1, { first: f }) : left ? fill(W.barLeft, { n: left, first: f }) : '';
    var can = rd.length && !working && who.trim() && !sending;
    return '<div id="ps-rv-bar"><div class="ps-rv-sendbar" role="region" aria-label="Send your answers"><div class="what"><b>' + esc(parts.join(', ') || W.barNone) + '</b>' + esc(note) + (sendErr ? '<div class="ps-rv-err">' + esc(sendErr) + '</div>' : '') + '</div>' +
      '<div class="name"><label for="ps-rv-who">' + esc(W.yourName) + '</label><input type="text" id="ps-rv-who" autocomplete="name" value="' + esc(who) + '" class="' + (who ? 'chg' : '') + '"></div>' +
      '<div class="acts"><button type="button" class="ps-rv-cancel" id="ps-rv-cancelall">' + esc(W.cancel) + '</button><button type="button" class="ps-rv-btn" id="ps-rv-send"' + (can ? '' : ' disabled') + '>' + esc(sending ? W.sending : fill(W.send, { first: f })) + '</button></div></div></div>';
  }
  function repaintBar() { var b = root.querySelector('#ps-rv-bar'); if (b) b.outerHTML = renderBar(); }
  function item(key) { return D.items.find(function (it) { return it.key === key; }); }

  // ── recording ───────────────────────────────────────────────
  function stopRec() { if (!rec) return; try { if (rec.mr && rec.mr.state !== 'inactive') rec.mr.stop(); } catch (e) {} clearInterval(rec.tick); clearTimeout(rec.cap); if (rec.stream) rec.stream.getTracks().forEach(function (t) { t.stop(); }); rec = null; }
  async function startRec(key) {
    var a = A[key]; if (!a) return;
    if (!navigator.mediaDevices || !window.MediaRecorder) { a.err = W.noMic; a.step = 'type'; render(); return; }
    var stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { a.err = W.micDenied; render(); return; }
    var type = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
    var mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined), chunks = [], t0 = Date.now();
    mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = function () { var blob = new Blob(chunks, { type: mr.mimeType || type || 'audio/webm' }); stream.getTracks().forEach(function (t) { t.stop(); }); transcribe(key, blob); };
    rec = { key: key, mr: mr, stream: stream, tick: null, cap: null };
    a.step = 'rec'; a.err = ''; a.t = '0:00'; render();
    rec.tick = setInterval(function () { var s = Math.round((Date.now() - t0) / 1000); a.t = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); var l = root.querySelector('#lab-' + CSS.escape(key)); if (l) l.textContent = fill(W.listening, { t: a.t }); }, 1000);
    rec.cap = setTimeout(function () { finishRec(); }, REC_MAX_MS);
    mr.start();
  }
  function finishRec() { if (!rec) return; var a = A[rec.key]; if (a) { a.step = 'work'; render(); } var r = rec; rec = null; clearInterval(r.tick); clearTimeout(r.cap); try { r.mr.stop(); } catch (e) { if (a) { a.step = 'mic'; render(); } } }
  async function transcribe(key, blob) {
    var a = A[key], it = item(key); if (!a) return;
    var r = await api('/review/' + token + '/transcribe', { method: 'POST', body: blob, type: blob.type || 'audio/webm', headers: { 'X-Ad-Label': (it && it.label) || 'ad' } });
    if (!r.ok) { a.step = 'mic'; a.err = (r.json && r.json.error) || ('HTTP ' + r.status); render(); return; }
    if (!r.json.said) { a.step = 'mic'; a.err = r.json.note || W.noHear; render(); return; }
    a.said = r.json.said; a.like = r.json.like || ''; a.change = r.json.change || ''; a.step = 'heard'; a.err = ''; render();
  }
  function pickFile(key) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,.pdf,.doc,.docx,.ai,.eps,.svg,.zip';
    inp.onchange = async function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      if (f.size > 20 * 1024 * 1024) { toast(W.fileBig); return; }
      var fd = new FormData(); fd.append('file', f, f.name);
      var r = await api('/review/' + token + '/file', { method: 'POST', body: fd });
      var a = A[key]; if (!a) return;
      if (!r.ok) { toast(fill(W.fileFail, { msg: (r.json && r.json.error) || ('HTTP ' + r.status) })); return; }
      a.files.push({ name: r.json.name || f.name, url: r.json.url }); render(); toast(fill(W.fileAdded, { first: first() }));
    };
    inp.click();
  }
  async function send() {
    var keys = Object.keys(A).filter(function (k) { return ready(A[k]); }); if (!keys.length || !who.trim()) return;
    sending = true; sendErr = ''; repaintBar();
    var items = keys.map(function (k) { var a = A[k], it = item(k); return { adId: it.adId, shape: it.shape, answer: a.kind === 'ok' ? 'approve' : 'change', like: a.like || '', change: a.change || '', said: a.said || '', files: a.files || [] }; });
    var r = await api('/review/' + token + '/answer', { method: 'POST', json: { name: who.trim(), items: items } });
    sending = false;
    if (!r.ok) { sendErr = fill(W.sendFail, { msg: (r.json && r.json.error) || ('HTTP ' + r.status) }); repaintBar(); return; }
    page = 'done'; render(); window.scrollTo(0, 0);
  }

  // ── wiring ──────────────────────────────────────────────────
  function wire() {
    root.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return; var d = t.dataset;
      if (d.ok) { A[d.ok] = { kind: 'ok' }; render(); return; }
      if (d.chg) { A[d.chg] = { kind: 'chg', step: 'mic', like: '', change: '', said: '', typed: '', files: [], err: '' }; render(); return; }
      if (d.undo) { if (rec && rec.key === d.undo) stopRec(); delete A[d.undo]; render(); return; }
      if (d.type) { if (rec && rec.key === d.type) stopRec(); A[d.type].step = 'type'; A[d.type].err = ''; render(); return; }
      if (d.back) { A[d.back].step = 'mic'; A[d.back].err = ''; render(); return; }
      if (d.file) { pickFile(d.file); return; }
      if (d.rmf) { var p = d.rmf.split('|'); A[p[0]].files.splice(+p[1], 1); render(); return; }
      if (d.done) { var a = A[d.done]; a.change = a.typed; a.said = ''; a.step = 'heard'; render(); return; }
      if (d.mic) { var m = A[d.mic]; if (m.step === 'rec') finishRec(); else startRec(d.mic); return; }
      if (t.id === 'ps-rv-cancelall') { stopRec(); A = {}; who = ''; render(); return; }
      if (t.id === 'ps-rv-send') { send(); return; }
    });
    root.addEventListener('input', function (e) {
      var t = e.target, d = t.dataset || {};
      if (t.id === 'ps-rv-who') { who = t.value; t.classList.toggle('chg', !!who); var s = root.querySelector('#ps-rv-send'); if (s) { var rd = Object.keys(A).filter(function (k) { return ready(A[k]); }), working = Object.keys(A).length - rd.length; s.disabled = !(rd.length && !working && who.trim()); } return; }
      if (d.txt) { var a = A[d.txt]; a.typed = t.value; t.classList.toggle('chg', !!t.value); var b = root.querySelector('[data-done="' + CSS.escape(d.txt) + '"]'); if (b) b.disabled = !t.value.trim(); return; }
      if (d.like) { A[d.like].like = t.value; repaintBar(); return; }
      if (d.change) { A[d.change].change = t.value; repaintBar(); return; }
    });
  }

  // ── boot ────────────────────────────────────────────────────
  async function boot() {
    root = document.getElementById('ps-review'); if (!root) return;
    root.classList.add('ps-rv');
    cfg = { salesUrl: (root.dataset.salesUrl || '').replace(/\/+$/, ''), inbxifyLogo: (root.dataset.inbxifyLogo || '').trim() };
    token = (new URLSearchParams(location.search).get('t') || '').trim();
    wire();
    if (!cfg.salesUrl) { page = 'fail'; sendErr = 'data-sales-url is missing on the page.'; D = { publisher: {}, items: [] }; render(); return; }
    if (!/^[0-9a-f]{32}$/.test(token)) { page = 'bad'; D = { publisher: {}, items: [] }; render(); return; }
    page = 'loading'; D = { publisher: {}, items: [] }; render();
    var r = await api('/review/' + token);
    if (r.status === 404) { page = 'bad'; render(); return; }
    if (!r.ok) { page = 'fail'; sendErr = (r.json && r.json.error) || ('HTTP ' + r.status); render(); return; }
    D = r.json; D.items = (D.items || []).map(function (it) { it.key = it.adId + '|' + it.shape; return it; });
    page = D.expired ? 'expired' : D.answered ? 'already' : 'open';
    document.title = D.expired ? W.expiredH : fill(W.h1, { title: D.title || (D.publisher && D.publisher.company) || '' });
    render();
  }
  window.PsReview = { version: VERSION, file: FILE };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
