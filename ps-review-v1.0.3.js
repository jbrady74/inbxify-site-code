// ps-review-v1.0.3.js
// ============================================================
// INBXIFY · the advertiser review page (www.inbxify.com/review?t=<token>)
//
// v1.0.3 (18 Nov 2026, Ad Maker Build S3) — THE PUBLISHER'S APPROVAL, BY EMAIL LINK.
//   The same page now also opens an inbxify "Send for approval" link (ix-sales v1.3.9 answers kind:"approval").
//   Rulings (Jeff, 18 Nov): approval is by email for now, the link opens with no login, and offers Approve and make
//   current, Approve and hold, or Send back with a note; the same ix-sales path as a Portal decision.
//   · One card per ad: the picture, what is running now for that shape (when there is one), then the three choices
//     top to bottom. Send back opens a note box (required). A chosen card gets the gold border and its own Cancel.
//   · Choices stage until Send (the fixed panel on the right): the card says so. Send posts
//     /review/<token>/decide; each choice is written through Scenario G and 114 and logged.
//   · After Send: a short centred page that says what was done. A link that was already used says what was decided.
//   · An expired approval link offers an email to the inbxify person who sent it.
//   The advertiser page (kind "advertiser") is unchanged. CSS v1.0.3.
//   HARDCODING: HC-P-PP8-9 gains W.ap (the approval page's words).
// v1.0.2 (10 Nov 2026, Publisher Portal S8, live test step 9, Jeff's rethink) — ONE MESSAGE, ONE BOX.
//   Ask for changes → the mic (or Type instead) → the transcript opens in a large pop-up, editable, with photos
//   or files under it → Done. That text is the whole message to the publisher: no "what we heard" beside "what
//   to change", no step 3, no summary. The card folds to "Changes noted" with Edit and Cancel. The mic gives a
//   short tone on start and on stop (Jeff, from the test). Approve now says it goes with Send. Thanks page is
//   centred and short. Sends change = the text, like = '' (ix-sales /answer unchanged). CSS v1.0.2.
//   Pair with ix-sales v1.3.4 (transcribe answers the transcript only, no summary: the slow part is gone).
// v1.0.1 (10 Nov 2026, Publisher Portal S8, live test step 9) — TO MOCKUP v0.3 (accepted 10 Nov).
//   The page is two columns: the ads on the left, the send panel fixed on the right (each ad's state, name, Send).
//   Header is one line plus the link note, the publisher named once. "Ask for changes" opens three numbered steps
//   across the card: 1 Say it or type it → Here's what we heard (fixed, word for word); 2 Any changes you want to
//   make (editable, pre-filled with the summary); 3 Anything else, optional (what you like or don't, photos or files).
//   "Done with this <shape>" folds the card to one line with Edit and Cancel. Dropped: "Fix anything we got wrong",
//   the collapsed verbatim block, the four look-alike links. CSS v1.0.1.
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
//   POST /review/<token>/decide       { items:[{adId, shape, action, note}] }   (v1.0.3, an approval link)
//
// THE PAGE (Webflow static page /review, no Memberstack)
//   <div id="ps-review" data-sales-url="https://ix-sales…workers.dev"
//        data-inbxify-logo="<inbxify wordmark url>"></div>
//   plus this file and ps-review-v1.0.3.css. Fonts: Newsreader, Sen,
//   Josefin Sans (the portal's).
//
// HARDCODING (provisional ids, for the tracker)
//   HC-P-PP8-9   W: every word on the page.
//   HC-P-PP8-10  recording: audio/webm (audio/mp4 on Safari), 4 minutes
//                at most (REC_MAX_MS); files 20 MB at most (ix-sales caps too).
// ============================================================
(function () {
  'use strict';
  var VERSION = '1.0.3', FILE = 'ps-review-v' + VERSION + '.js';
  var REC_MAX_MS = 4 * 60 * 1000;
  var BOX = null;                                                        // v1.0.2: which ad's message box is open                                        // HC-P-PP8-10
  var W = {                                                              // HC-P-PP8-9
    powered: 'Powered by',
    loading: 'Opening your ads\u2026',
    h1: 'Your ads for {title}',
    lede: '{person} would like your OK on {n}. Approve each one, or tell us what to change.',
    one: '1 ad', many: '{n} ads',
    ledeSmall: 'This link is only for you \u00b7 works until {until}.',
    where: { banner: 'In the newsletter email and on the website', sidebar: 'Beside the stories on the website', splash: 'On the page readers land on from the email', text: 'In the newsletter email' },
    approve: 'Looks good, approve it', change: 'Ask for changes',
    approved: 'You approved this {shape}. It goes to {first} when you click Send.', asking: 'You are asking for changes.',
    stApproved: 'Approved', stChanges: 'Changes',
    cancel: 'Cancel',
    tell: 'Tell {first} what to change', tellSub: 'Talk it through, the way you would on the phone. Say what you like too.',
    tap: 'Tap to start talking', listening: 'Listening, {t}. Tap to finish.', working: 'Writing down what you said\u2026',
    typeInstead: 'Type instead', talkInstead: 'Talk instead', addFiles: 'Add photos or files', again: 'Say it again',
    typeLabel: 'What to change, and what you like', done: 'Done with this {shape}',
    s1: 'Say it, or type it', s1sub: 'Talk it through the way you would on the phone. We write it down for you.', s1type: 'Tell {first} what to change, in your own words.',
    s1heard: 'Here\u2019s what we heard', s1heardSub: 'Word for word. Nothing to do here.',
    s2: 'Any changes you want to make', s2sub: 'This is what {first} will act on. Edit it if we got anything wrong.', s2wait: 'Fills in once we have heard you.',
    s3: 'Anything else', s3opt: 'optional', s3sub: 'What you like or don\u2019t like, and photos or files to go with it.', s3ph: 'What you like, or don\u2019t',
    typePh: 'For example: use the new photo and make the hours bigger',
    folded: 'Changes noted.', edit: 'Edit',
    boxH: 'Here\u2019s what we heard', boxHtyped: 'Tell {first} what to change', boxSub: 'Edit anything you like. This is the message {first} gets.', boxSubTyped: 'In your own words. This is the message {first} gets.',
    boxDone: 'Done',
    panelH: 'Your answers', notYet: 'Not answered yet', describing: 'Describing changes\u2026', namePh: 'So {first} knows who answered',
    hintWorking: 'Finish the change you are describing, then click Done on that ad.', hintStart: 'Approve an ad, or ask for changes, to get started.',
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
    thanks: 'We have your answers{name}.',
    thanksLine: { approve: '{shape}: approved', change: '{shape}: changes asked for', none: '{shape}: no answer' },
    thanksNote: '{first} will be in touch. You can close this page.',
    alreadyH: 'You already answered', already: 'This link was answered by {who}. If something changed, ask {first} for a new link.',
    expiredH: 'This link has expired', expired: 'Links to review ads work for {days} days. Ask {person} at {company} for a new one.',
    emailBtn: 'Email {first} for a new link', emailUnder: 'Opens your email with a short note to {email}. Change it before you send if you like.',
    emailSubj: 'New link to review our ads for {title}', emailBody: 'Hi {first},\n\nThe link to review the {customer} ads has expired. Could you send me a new one?\n\nThanks',
    noEmail: '{company} has no contact email set up yet, so ask them the way you usually reach them.',
    badH: 'This link is not one we made', bad: 'Check the link in your email and try again, or ask the publisher who sent it for a new one.',
    failH: 'Something went wrong', fail: 'The page could not load your ads: {msg}',
    sendFail: 'Your answers did not send: {msg}',
    needName: 'Add your name to send.',
    // v1.0.3 · the publisher's approval page (an inbxify "Send for approval" link)
    ap: {
      h1: 'Ready for your OK: {customer}', loading: 'Opening the ad\u2026',
      lede: 'Choose what to do with {n}. Nothing changes until you click Send.', one: 'this ad', many: 'each of these {n} ads',
      ledeSmall: 'This link is only for you \u00b7 works until {until}.',
      running: 'Running now', nothingRunning: 'No {shape} is running for {customer} now.',
      opts: {
        'approve-current': ['Approve it and run it', 'It becomes the {shape} that runs for {customer}.', 'It replaces the {shape} running now.'],
        'approve-hold': ['Approve it and hold it', 'It is ready to run later. Nothing changes for readers now.', 'The {shape} running now keeps running.'],
        'send-back': ['Send it back with a note', 'Say what to change. inbxify fixes it and sends it again.', '']
      },
      noteLabel: 'What should change?', notePh: 'For example: use the new phone number and make the hours bigger',
      staged: 'Goes to inbxify when you click Send.', cancel: 'Cancel',
      st: { 'approve-current': 'Approve and run', 'approve-hold': 'Approve and hold', 'send-back': 'Send back', none: 'Not chosen yet', needNote: 'Needs a note' },
      panelH: 'Your decision', send: 'Send', sending: 'Sending\u2026',
      hintStart: 'Choose what to do with the ad to get started.', hintNote: 'Add a note to the ad you are sending back.',
      left: 'You can send now and decide the rest later with the same link.',
      doneH: 'Thank you{name}.', doneNote: 'inbxify has your decision. You can close this page.',
      doneLine: { 'approve-current': '{shape}: approved, and it is the one that runs now', 'approve-hold': '{shape}: approved and held', 'send-back': '{shape}: sent back with your note' },
      failLine: '{shape}: not saved. {msg}', sendFail: 'Your decision did not send: {msg}',
      usedH: 'This link has been used', used: 'Here is what was decided{on}.', usedMore: 'If something changed, reply to the email this link came in.',
      expiredH: 'This link has expired', expired: 'Approval links work for {days} days. Ask inbxify for a new one.',
      emailBtn: 'Email inbxify for a new link', emailSubj: 'New approval link for {customer}', emailBody: 'Hi,\n\nThe approval link for the {customer} ad has expired. Could you send me a new one?\n\nThanks'
    }
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
    var a = A[it.key], f = first(), k = esc(it.key), low = it.label.toLowerCase();
    var errLine = a.err ? '<p class="ps-rv-err">' + esc(a.err) + '</p>' : '';
    if (a.folded) {
      var sum = (a.change || '').trim();
      return '<div class="ps-rv-panel"><div class="ps-rv-folded"><b>' + esc(W.folded) + '</b><span>' + esc(sum.length > 110 ? sum.slice(0, 110) + '\u2026' : sum) + (a.files.length ? ' \u00b7 ' + a.files.length + (a.files.length === 1 ? ' file' : ' files') : '') + '</span>' +
        '<button type="button" class="ps-rv-link" data-edit="' + k + '">' + esc(W.edit) + '</button><button type="button" class="ps-rv-cancel" data-undo="' + k + '">' + esc(W.cancel) + '</button></div></div>';
    }
    var lab = a.step === 'rec' ? fill(W.listening, { t: a.t || '0:00' }) : a.step === 'work' ? W.working : W.tap;
    return '<div class="ps-rv-panel ps-rv-micpanel"><h3>' + esc(fill(W.tell, { first: f })) + '</h3><p>' + esc(W.tellSub) + '</p>' +
      '<button type="button" class="ps-rv-mic' + (a.step === 'rec' ? ' on' : '') + '" data-mic="' + k + '" aria-label="' + (a.step === 'rec' ? 'Stop recording' : 'Start recording') + '"' + (a.step === 'work' ? ' disabled' : '') + '>' + MIC + '</button>' +
      '<p class="ps-rv-miclab" id="lab-' + k + '">' + esc(lab) + '</p>' + errLine +
      '<div class="ps-rv-links center"><button type="button" class="ps-rv-link" data-type="' + k + '">' + esc(W.typeInstead) + '</button><button type="button" class="ps-rv-cancel" data-undo="' + k + '">' + esc(W.cancel) + '</button></div></div>';
  }
  function box() {   // v1.0.2 · the one message box, a pop-up over the page
    if (!BOX) return '';
    var it = item(BOX), a = A[BOX], f = first(), k = esc(BOX), typed = !a.said;
    return '<div class="ps-rv-dim" data-boxdim="1"><div class="ps-rv-box" role="dialog" aria-modal="true" aria-labelledby="ps-rv-boxh">' +
      '<h3 id="ps-rv-boxh">' + esc(typed ? fill(W.boxHtyped, { first: f }) : W.boxH) + ' <span class="shape">\u00b7 ' + esc(it.label) + '</span></h3><p>' + esc(fill(typed ? W.boxSubTyped : W.boxSub, { first: f })) + '</p>' +
      '<textarea id="ps-rv-boxt" data-change="' + k + '"' + (typed ? ' placeholder="' + esc(W.typePh) + '"' : '') + '>' + esc(a.change || '') + '</textarea>' +
      '<div class="ps-rv-links"><button type="button" class="ps-rv-link" data-file="' + k + '">' + esc(W.addFiles) + '</button>' + (a.said ? '<button type="button" class="ps-rv-link" data-back="' + k + '">' + esc(W.again) + '</button>' : '<button type="button" class="ps-rv-link" data-back="' + k + '">' + esc(W.talkInstead) + '</button>') + '</div>' + files(it, a) +
      '<div class="ps-rv-pacts"><button type="button" class="ps-rv-cancel" data-undo="' + k + '">' + esc(W.cancel) + '</button><button type="button" class="ps-rv-btn" data-done="' + k + '"' + ((a.change || '').trim() ? '' : ' disabled') + '>' + esc(W.boxDone) + '</button></div></div></div>';
  }
  function card(it) {
    var a = A[it.key], k = esc(it.key), low = it.label.toLowerCase(), ans;
    if (!a) ans = '<div class="ps-rv-answer"><button type="button" class="ps-rv-btn" data-ok="' + k + '">' + esc(W.approve) + '</button><button type="button" class="ps-rv-btn ghost" data-chg="' + k + '">' + esc(W.change) + '</button></div>';
    else if (a.kind === 'ok') ans = '<div class="ps-rv-picked"><span><b>' + esc(fill(W.approved, { shape: low, first: first() })) + '</b></span><button type="button" class="ps-rv-cancel" data-undo="' + k + '">' + esc(W.cancel) + '</button></div>';
    else ans = panel(it);
    var st = !a ? '' : a.kind === 'ok' ? '<span class="ps-rv-state s-ok">' + esc(W.stApproved) + '</span>' : '<span class="ps-rv-state s-chg">' + esc(W.stChanges) + '</span>';
    return '<section class="ps-rv-ad' + (a ? ' chg' : '') + '" aria-labelledby="h-' + k + '"><div class="ps-rv-adhead"><h2 id="h-' + k + '">' + esc(it.label) + '</h2><span class="where">' + esc(W.where[it.shape] || '') + '</span>' + st + '</div>' +
      '<div class="ps-rv-stage">' + art(it) + '</div>' + ans + '</section>';
  }
  function ready(a) { return a.kind === 'ok' || !!a.folded; }
  function header() {
    var p = (D && D.publisher) || {};
    return '<header class="ps-rv-head"><div class="ps-rv-brand"><div class="ps-rv-plate">' + (p.logo ? '<img src="' + esc(p.logo) + '" alt="' + esc(p.company || '') + '">' : '<span class="ps-rv-coname">' + esc(p.company || '') + '</span>') + '</div><div class="ps-rv-hair"></div>' +
      '<div class="ps-rv-powered">' + esc(W.powered) + (cfg.inbxifyLogo ? ' <img src="' + esc(cfg.inbxifyLogo) + '" alt="inbxify">' : ' inbxify') + '</div></div></header>';
  }
  function endCard(h, body, cls) { return '<div class="ps-rv-end' + (cls ? ' ' + cls : '') + '"><h2>' + esc(h) + '</h2>' + body + '</div>'; }
  function render() {
    var h = header() + '<main class="ps-rv-main" id="ps-rv-main">', f = first(), p = (D && D.publisher) || {};
    if (page === 'ap-open' || page === 'ap-done' || page === 'ap-used' || page === 'ap-expired') h += apMain();   // v1.0.3
    else if (page === 'loading') h += '<p class="ps-rv-loading">' + esc(W.loading) + '</p>';
    else if (page === 'bad') h += endCard(W.badH, '<p>' + esc(W.bad) + '</p>', 'gone');
    else if (page === 'fail') h += endCard(W.failH, '<p>' + esc(fill(W.fail, { msg: sendErr })) + '</p>', 'gone');
    else if (page === 'expired') {
      var mail = p.email ? 'mailto:' + encodeURIComponent(p.email) + '?subject=' + encodeURIComponent(fill(W.emailSubj, { title: D.title || p.company })) + '&body=' + encodeURIComponent(fill(W.emailBody, { first: f, customer: D.customer || 'our' })) : '';
      h += endCard(W.expiredH, '<p>' + esc(fill(W.expired, { days: D.linkDays || 14, person: p.person || p.company, company: p.company })) + '</p>' +
        (mail ? '<p style="margin-top:16px"><a class="ps-rv-btn" href="' + mail + '">' + esc(fill(W.emailBtn, { first: f })) + '</a></p><p class="ps-rv-quiet">' + esc(fill(W.emailUnder, { email: p.email })) + '</p>' : '<p class="ps-rv-quiet">' + esc(fill(W.noEmail, { company: p.company })) + '</p>'), 'gone');
    } else if (page === 'already') h += endCard(W.alreadyH, '<p>' + esc(fill(W.already, { who: D.answeredBy || 'someone', first: f })) + '</p>');
    else if (page === 'done') {
      h += endCard(fill(W.thanks, { name: who ? ', ' + who.split(' ')[0] : '', first: f }), '<p>' + esc(fill(W.thanksNote, { first: f })) + '</p>', 'thanks');
    } else {
      h += '<div class="ps-rv-col"><h1>' + esc(fill(W.h1, { title: D.title || p.company })) + '</h1><p class="ps-rv-lede">' + esc(fill(W.lede, { person: p.person || p.company, company: p.company, n: D.items.length === 1 ? W.one : fill(W.many, { n: D.items.length }), first: f })) +
        ' <small>' + esc(fill(W.ledeSmall, { until: day(D.until) })) + '</small></p>' + D.items.map(card).join('') + '</div><aside class="ps-rv-aside">' + renderBar() + '</aside>';
    }
    h += '</main>' + box() + '<div id="ps-rv-toast"></div>';
    var y = window.scrollY; root.innerHTML = h; window.scrollTo(0, y);
    if (BOX) { var ta = root.querySelector('#ps-rv-boxt'); if (ta && document.activeElement !== ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } }
  }
  function renderBar() {
    var keys = Object.keys(A), f = first();
    var rd = keys.filter(function (k) { return ready(A[k]); }), working = keys.length - rd.length;
    var rows = D.items.map(function (it) { var a = A[it.key]; var st = !a ? W.notYet : a.kind === 'ok' ? W.stApproved : ready(a) ? W.stChanges : W.describing;
      return '<li><span>' + esc(it.label) + '</span><span>' + esc(st) + '</span></li>'; }).join('');
    var hint = working ? W.hintWorking : rd.length ? '' : W.hintStart;
    var can = rd.length && !working && who.trim() && !sending;
    return '<div id="ps-rv-bar"><div class="ps-rv-sidepanel" role="region" aria-label="' + esc(W.panelH) + '"><h3>' + esc(W.panelH) + '</h3><ul>' + rows + '</ul>' + (sendErr ? '<div class="ps-rv-err">' + esc(sendErr) + '</div>' : '') +
      '<div class="name"><label for="ps-rv-who">' + esc(W.yourName) + '</label><input type="text" id="ps-rv-who" autocomplete="name" value="' + esc(who) + '" class="' + (who ? 'chg' : '') + '" placeholder="' + esc(fill(W.namePh, { first: f })) + '"></div>' +
      '<div class="acts"><button type="button" class="ps-rv-cancel" id="ps-rv-cancelall"' + (keys.length ? '' : ' style="visibility:hidden"') + '>' + esc(W.cancel) + '</button><button type="button" class="ps-rv-btn" id="ps-rv-send"' + (can ? '' : ' disabled') + '>' + esc(sending ? W.sending : fill(W.send, { first: f })) + '</button></div>' +
      (hint ? '<p class="hint">' + esc(hint) + '</p>' : '') + '</div></div>';
  }
  function repaintBar() { var b = root.querySelector('#ps-rv-bar'); if (b) b.outerHTML = renderBar(); }
  function item(key) { return D.items.find(function (it) { return it.key === key; }); }

  // ── v1.0.3 · the publisher's approval page ──────────────────
  var AP = {}, apSending = false, apResult = null;                       // key → { act, note }
  function apFirst() { return ((D && D.publisher && D.publisher.person) || '').split(' ')[0]; }
  function apReady(a) { return !!a && !!a.act && (a.act !== 'send-back' || !!(a.note || '').trim()); }
  function apCard(it) {
    var a = AP[it.key], k = esc(it.key), low = it.label.toLowerCase(), P = W.ap, done = !!it.decision;
    var st = done ? '<span class="ps-rv-state s-ok">' + esc(P.st[it.decision] || '') + '</span>' : a && a.act ? '<span class="ps-rv-state ' + (apReady(a) ? 's-ok' : 's-chg') + '">' + esc(apReady(a) ? P.st[a.act] : P.st.needNote) + '</span>' : '';
    var cur = it.current && /^https?:\/\//.test(it.current.picture || '') ? '<div class="ps-rv-now"><span>' + esc(P.running) + '</span><img class="s-' + esc(it.shape) + '" src="' + esc(it.current.picture) + '" alt="' + esc(P.running + ': ' + (it.current.name || '')) + '"></div>'
      : '<p class="ps-rv-quiet ps-rv-nonow">' + esc(fill(P.nothingRunning, { shape: low, customer: D.customer || '' })) + '</p>';
    var body;
    if (done) body = '<p class="ps-rv-quiet">' + esc(fill(P.doneLine[it.decision] || '', { shape: it.label })) + (it.note ? ' · ' + esc(it.note) : '') + '</p>';
    else body = '<div class="ps-rv-opts" role="radiogroup" aria-labelledby="h-' + k + '">' + ['approve-current', 'approve-hold', 'send-back'].map(function (act) {
        var o = P.opts[act], on = a && a.act === act, sub = fill(it.current && o[2] ? o[2] : o[1], { shape: low, customer: D.customer || '' });
        return '<button type="button" class="ps-rv-opt' + (on ? ' on' : '') + '" role="radio" aria-checked="' + (on ? 'true' : 'false') + '" data-apact="' + k + '" data-v="' + act + '"><i aria-hidden="true"></i><span><b>' + esc(o[0]) + '</b><small>' + esc(sub) + '</small></span></button>' +
          (on && act === 'send-back' ? '<div class="ps-rv-note"><label class="ps-rv-f" for="n-' + k + '">' + esc(P.noteLabel) + '</label><textarea id="n-' + k + '" data-apnote="' + k + '" placeholder="' + esc(P.notePh) + '" class="' + ((a.note || '').trim() ? 'chg' : '') + '">' + esc(a.note || '') + '</textarea></div>' : '');
      }).join('') + '</div>' + (a && a.act ? '<div class="ps-rv-picked ps-rv-staged"><span>' + esc(P.staged) + '</span><button type="button" class="ps-rv-cancel" data-apundo="' + k + '">' + esc(P.cancel) + '</button></div>' : '');
    return '<section class="ps-rv-ad' + (a && a.act ? ' chg' : '') + '" aria-labelledby="h-' + k + '"><div class="ps-rv-adhead"><h2 id="h-' + k + '">' + esc(it.label) + '</h2><span class="where">' + esc(W.where[it.shape] || '') + '</span>' + st + '</div>' +
      '<div class="ps-rv-stage">' + art(it) + '</div>' + cur + body + '</section>';
  }
  function apBar() {
    var P = W.ap, open = D.items.filter(function (it) { return !it.decision; });
    var picked = open.filter(function (it) { return AP[it.key] && AP[it.key].act; }), rdy = picked.filter(function (it) { return apReady(AP[it.key]); });
    var rows = D.items.map(function (it) { var a = AP[it.key]; var st = it.decision ? P.st[it.decision] : !a || !a.act ? P.st.none : apReady(a) ? P.st[a.act] : P.st.needNote;
      return '<li><span>' + esc(it.label) + '</span><span>' + esc(st || '') + '</span></li>'; }).join('');
    var can = rdy.length && rdy.length === picked.length && !apSending;
    var hint = !picked.length ? P.hintStart : rdy.length !== picked.length ? P.hintNote : picked.length < open.length ? P.left : '';
    return '<div id="ps-rv-bar"><div class="ps-rv-sidepanel" role="region" aria-label="' + esc(P.panelH) + '"><h3>' + esc(P.panelH) + '</h3><ul>' + rows + '</ul>' + (sendErr ? '<div class="ps-rv-err">' + esc(sendErr) + '</div>' : '') +
      '<div class="acts"><button type="button" class="ps-rv-cancel" id="ps-rv-apcancel"' + (picked.length ? '' : ' style="visibility:hidden"') + '>' + esc(P.cancel) + '</button><button type="button" class="ps-rv-btn" id="ps-rv-apsend"' + (can ? '' : ' disabled') + '>' + esc(apSending ? P.sending : P.send) + '</button></div>' +
      (hint ? '<p class="hint">' + esc(hint) + '</p>' : '') + '</div></div>';
  }
  function apRepaintBar() { var b = root.querySelector('#ps-rv-bar'); if (b) b.outerHTML = apBar(); }
  function apList(items, map) { return '<ul class="ps-rv-donelist">' + items.map(function (it) { return '<li>' + esc(fill(map[it.decision || it.action] || '', { shape: it.label || '' })) + (it.note ? '<br><span class="ps-rv-quiet">' + esc(it.note) + '</span>' : '') + '</li>'; }).join('') + '</ul>'; }
  function apMain() {
    var P = W.ap, p = (D && D.publisher) || {}, f = apFirst();
    if (page === 'ap-expired') {
      var to = D.sentBy || '', mail = to ? 'mailto:' + encodeURIComponent(to) + '?subject=' + encodeURIComponent(fill(P.emailSubj, { customer: D.customer || p.company || '' })) + '&body=' + encodeURIComponent(fill(P.emailBody, { customer: D.customer || 'our' })) : '';
      return endCard(P.expiredH, '<p>' + esc(fill(P.expired, { days: D.linkDays || 14 })) + '</p>' + (mail ? '<p style="margin-top:16px"><a class="ps-rv-btn" href="' + mail + '">' + esc(P.emailBtn) + '</a></p>' : ''), 'gone');
    }
    if (page === 'ap-used') return endCard(P.usedH, '<p>' + esc(fill(P.used, { on: D.decidedAt ? ' on ' + day(D.decidedAt) : '' })) + '</p>' + apList(D.items.filter(function (it) { return it.decision; }), P.doneLine) + '<p class="ps-rv-quiet" style="margin-top:12px!important">' + esc(P.usedMore) + '</p>');
    if (page === 'ap-done') {
      var okItems = (apResult.decided || []).map(function (z) { var it = item(z.adId + '|' + z.shape) || {}; return { label: it.label || z.shape, decision: z.action }; });
      var bad = (apResult.failed || []).map(function (z) { var it = item(z.adId + '|' + z.shape) || {}; return '<li class="bad">' + esc(fill(P.failLine, { shape: it.label || z.shape, msg: z.error || '' })) + '</li>'; }).join('');
      return endCard(fill(P.doneH, { name: f ? ', ' + f : '' }), apList(okItems, P.doneLine) + (bad ? '<ul class="ps-rv-donelist">' + bad + '</ul>' : '') + '<p style="margin-top:12px!important">' + esc(P.doneNote) + '</p>', 'thanks');
    }
    return '<div class="ps-rv-col"><h1>' + esc(fill(P.h1, { customer: D.customer || p.company || '' })) + '</h1><p class="ps-rv-lede">' + esc(fill(P.lede, { n: D.items.length === 1 ? P.one : fill(P.many, { n: D.items.length }) })) +
      ' <small>' + esc(fill(P.ledeSmall, { until: day(D.until) })) + '</small></p>' + D.items.map(apCard).join('') + '</div><aside class="ps-rv-aside">' + apBar() + '</aside>';
  }
  async function apSend() {
    var todo = D.items.filter(function (it) { return !it.decision && apReady(AP[it.key]); }); if (!todo.length || apSending) return;
    apSending = true; sendErr = ''; apRepaintBar();
    var r = await api('/review/' + token + '/decide', { method: 'POST', json: { items: todo.map(function (it) { var a = AP[it.key]; return { adId: it.adId, shape: it.shape, action: a.act, note: a.act === 'send-back' ? (a.note || '').trim() : '' }; }) } });
    apSending = false;
    if (!r.ok) { sendErr = fill(W.ap.sendFail, { msg: (r.json && r.json.error) || ('HTTP ' + r.status) }); apRepaintBar(); return; }
    apResult = r.json; page = 'ap-done'; render(); window.scrollTo(0, 0);
  }
  function apClick(t) {
    var d = t.dataset;
    if (d.apact) { var cur = AP[d.apact] || {}; AP[d.apact] = { act: d.v, note: cur.note || '' }; render(); if (d.v === 'send-back') { var ta = root.querySelector('[data-apnote="' + CSS.escape(d.apact) + '"]'); if (ta) ta.focus(); } return true; }
    if (d.apundo) { delete AP[d.apundo]; render(); return true; }
    if (t.id === 'ps-rv-apcancel') { AP = {}; sendErr = ''; render(); return true; }
    if (t.id === 'ps-rv-apsend') { apSend(); return true; }
    return false;
  }

  // ── recording ───────────────────────────────────────────────
  function tone(up) {   // v1.0.2 · a short tone on start (rising) and stop (falling); silent if the browser has no AudioContext
    try { var C = window.AudioContext || window.webkitAudioContext; if (!C) return; var ac = tone.ac || (tone.ac = new C()); var o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(up ? 660 : 520, ac.currentTime); o.frequency.linearRampToValueAtTime(up ? 880 : 390, ac.currentTime + 0.12);
      g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.12, ac.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.16);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.17); } catch (e) {}
  }
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
    tone(true); mr.start();
  }
  function finishRec() { if (!rec) return; tone(false); var a = A[rec.key]; if (a) { a.step = 'work'; render(); } var r = rec; rec = null; clearInterval(r.tick); clearTimeout(r.cap); try { r.mr.stop(); } catch (e) { if (a) { a.step = 'mic'; render(); } } }
  async function transcribe(key, blob) {
    var a = A[key], it = item(key); if (!a) return;
    var r = await api('/review/' + token + '/transcribe', { method: 'POST', body: blob, type: blob.type || 'audio/webm', headers: { 'X-Ad-Label': (it && it.label) || 'ad' } });
    if (!r.ok) { a.step = 'mic'; a.err = (r.json && r.json.error) || ('HTTP ' + r.status); render(); return; }
    if (!r.json.said) { a.step = 'mic'; a.err = r.json.note || W.noHear; render(); return; }
    a.said = r.json.said; a.like = ''; a.change = r.json.said; a.step = 'heard'; a.err = ''; BOX = key; render();
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
      if (apClick(t)) return;   // v1.0.3
      if (d.ok) { A[d.ok] = { kind: 'ok' }; render(); return; }
      if (d.chg) { A[d.chg] = { kind: 'chg', step: 'mic', like: '', change: '', said: '', typed: '', files: [], err: '' }; render(); return; }
      if (d.undo) { if (rec && rec.key === d.undo) stopRec(); delete A[d.undo]; if (BOX === d.undo) BOX = null; render(); return; }
      if (d.type) { if (rec && rec.key === d.type) stopRec(); A[d.type].step = 'type'; A[d.type].err = ''; A[d.type].said = ''; BOX = d.type; render(); return; }
      if (d.back) { A[d.back].step = 'mic'; A[d.back].err = ''; A[d.back].said = ''; A[d.back].change = ''; BOX = null; render(); return; }
      if (d.file) { pickFile(d.file); return; }
      if (d.rmf) { var p = d.rmf.split('|'); A[p[0]].files.splice(+p[1], 1); render(); return; }
      if (d.done) { var a = A[d.done]; if (!(a.change || '').trim()) return; a.step = 'heard'; a.folded = true; BOX = null; render(); return; }
      if (d.edit) { A[d.edit].folded = false; BOX = d.edit; render(); return; }
      if (d.mic) { var m = A[d.mic]; if (m.step === 'rec') finishRec(); else startRec(d.mic); return; }
      if (t.id === 'ps-rv-cancelall') { stopRec(); A = {}; who = ''; render(); return; }
      if (t.id === 'ps-rv-send') { send(); return; }
    });
    root.addEventListener('input', function (e) {
      var t = e.target, d = t.dataset || {};
      if (d.apnote) { var an = AP[d.apnote]; if (an) { an.note = t.value; t.classList.toggle('chg', !!t.value.trim()); apRepaintBar(); var sec = t.closest('.ps-rv-ad'), stt = sec && sec.querySelector('.ps-rv-state'); if (stt) { stt.textContent = apReady(an) ? W.ap.st[an.act] : W.ap.st.needNote; stt.className = 'ps-rv-state ' + (apReady(an) ? 's-ok' : 's-chg'); } } return; }   // v1.0.3
      if (t.id === 'ps-rv-who') { who = t.value; t.classList.toggle('chg', !!who); var s = root.querySelector('#ps-rv-send'); if (s) { var rd = Object.keys(A).filter(function (k) { return ready(A[k]); }), working = Object.keys(A).length - rd.length; s.disabled = !(rd.length && !working && who.trim()); } return; }
      if (d.txt) { var a = A[d.txt]; a.typed = t.value; t.classList.toggle('chg', !!t.value); var b = root.querySelector('[data-done="' + CSS.escape(d.txt) + '"]'); if (b) b.disabled = !t.value.trim(); return; }
      if (d.like) { A[d.like].like = t.value; repaintBar(); return; }
      if (d.change) { A[d.change].change = t.value; var bb = root.querySelector('[data-done="' + CSS.escape(d.change) + '"]'); if (bb) bb.disabled = !t.value.trim(); return; }
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
    if (D.kind === 'approval') { page = D.expired ? 'ap-expired' : D.decided ? 'ap-used' : 'ap-open'; document.title = D.expired ? W.ap.expiredH : fill(W.ap.h1, { customer: D.customer || '' }); render(); return; }   // v1.0.3
    page = D.expired ? 'expired' : D.answered ? 'already' : 'open';
    document.title = D.expired ? W.expiredH : fill(W.h1, { title: D.title || (D.publisher && D.publisher.company) || '' });
    render();
  }
  window.PsReview = { version: VERSION, file: FILE };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
