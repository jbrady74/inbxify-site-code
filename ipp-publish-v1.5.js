/* ipp-publish-v1.5.js */
/* ============================================================
   ipp-publish-v1.5.js — Publish view for the IPP · COMPILE CONTROL
   Companion stylesheet: ipp-publish-v1.2.css (unchanged)
   Needs on the page: ix-tokens, ix-buttons, ix-success-toast
   (CSS + JS), ix-progress (CSS + JS), ix-info (CSS + JS).

   v1.5 (IPP Build S7, 9 Oct 2026) — UNAPPROVED ADS WARN
     Ruling (Jeff, 9 Oct 2026): an ad copied by Clone and not yet
     approved WARNS at Compile; it does not block.
     The pre-check (Data Worker v1.0.26+) returns unapproved:
     [{ position, id, name }]. When the list has entries the box goes
     amber and says how many, names each ad with its position, and
     offers "Approve on Revenue", which opens the Revenue tab. The
     Compile button stays on.
     An older Worker (no unapproved key) shows nothing extra.

   v1.4 (Compile Control S1, 4 Oct 2026) — CHECKED BEFORE THE CLICK
     Priority Work rows 53 and 55. When the view opens, and again after
     every compile, the page asks the Data Worker (v1.0.8+):
       GET PP_WEBHOOKS.issueCheck ?contextNlId &parentId
     It costs no Make credits. A "Before you compile" box shows:
       · Would 206 stop? The same data checks 206's first step runs
         (D207). If yes: the reason in red, and the button is off until
         a "Check again" passes, so no credits go on a run that stops.
       · Last compile size against the 95 KB line (amber when over),
         or "Not compiled yet".
       · Records with edits not yet published. The Data Worker reads
         drafts (readMode staged), so the compile INCLUDES them, but
         their own web pages do not show them until published. A record
         never published means the email links to a page that does not
         exist yet.
       · The build's own notes, folded away.
     If the check itself cannot run (network, 403, config), the box says
     so in amber and the button stays on: the check never blocks on its
     own failure. The check is advice; 206 still makes its own stops.
     A missing PP_WEBHOOKS.issueCheck shows "Pre-check not set up" and
     the button stays on.

   v1.3 (Compile Control S1, 4 Oct 2026) — "COMPILE AGAIN" AFTER GREEN
     Ruled by Jeff: the button stays after a compile, never hidden,
     because a fix after compiling needs a fresh compile.
       · After green: label "Compile again", secondary style
         (ix-btn--secondary), so "Compiled" is the strongest thing on
         the card and a second fire (about 182 Make credits) is a
         deliberate act.
       · After red or amber: back to "Compile issue", primary,
         because compiling again is the next step.
     Nothing else changed.

   v1.2 (Compile Control S1, 4 Oct 2026) — THE RIGHT NEWSLETTER
     v1.1 took the first element on the page with data-nl-id. On the
     PubPlan page that was the hidden newsletter-source list, which
     held all 32 of the title's newsletters, so WLN-999's Publish view
     showed WLN-121B. Nothing was compiled.
     Now the newsletter comes ONLY from .newsletter-source, which the
     page filters to "Publication Plan = Current Publication Plan".
     One plan has one newsletter (ruled 4 Oct), so exactly one must
     be found:
       0  → blocked: "No newsletter points at this plan."
       2+ → blocked, naming them. Never a guess.
     A list that lost its filter shows 32 and blocks, so it cannot
     compile the wrong issue.

   v1.1 (Compile Control S1, 4 Oct 2026) — THE BUTTON ANSWERS
     v1.0 opened 206's webhook in a new tab. The operator had to
     read the page that came back, or Make's history, to know what
     happened. Now the button calls 206 itself and shows the answer
     on this view, in plain words:
       · Compiled: blocks built, email size against the 95 KB line,
         and buttons to view the email and the web page.
       · Stopped: which stage stopped and exactly why, in red.
       · No clear answer: amber, and a line saying to check the
         issue before compiling again.
     Compiling never sends anything to readers.

   HOW IT TALKS TO 206 (v1.44+)
     GET PP_WEBHOOKS.compile ?contextNlId &parentId &respond=json
     206 answers JSON on every outcome:
       200 { ok:true, nlId, issue, blocks, blocksInPlan, emailSizeKb,
             emailBytes, emailLimit, written, issueUrl, emailHtmlB64 }
       422 { ok:false, stage:'data', message }
       422 { ok:false, stage:'render', email, emailHttp, web, webHttp }
             (email / web hold the render Worker's own answer:
              { error, problems[] } or { error, missing[] })
       502 { ok:false, stage:'save' | 'publish', message }

   TOAST-TRUTH
     Green only when BOTH hold:
       1. 206 echoes nlId equal to the id sent (IxToast.verify, with
          values read from 206's module 214, after the write).
       2. `written` (214's last-updated time) is no older than this
          click, allowing CLOCK_SLACK_MS for clock differences.
     Anything else is amber (unverified) or red (stopped).
     A bare "Accepted", an HTML page, or a timeout is amber.

   PROGRESS
     ix-progress shows its card for the call ("PubPlan · Compile",
     v1.0.2 reads PP_WEBHOOKS). The button also says "Compiling…"
     and a line under it says what is happening.

   EDITING RULES
     This view edits no fields, so there are no gold borders and no
     Cancel link. A running compile cannot be stopped from the page:
     206 finishes in under 10 seconds.

   WHAT IT READS (nothing typed in this file)
     Pre-check       window.PP_WEBHOOKS.issueCheck (v1.4)
     Newsletter id   .newsletter-source [data-nl-id]  (exactly one)
     Issue label     [data-issue-name] on that same element
     PubPlan id      IPP.tenant().pubplanId, else [data-pubplan-id]
     Webhook         window.PP_WEBHOOKS.compile
     95 KB line      emailLimit in 206's answer (render Worker's
                     X-IX-Email-Limit), never typed here

   HARDCODED (provisional ids; the doc chat allocates)
     HC-P-CC1-5  TIMEOUT_MS 150000. The wait before amber. 206 runs
                 in under 10 s; this covers a slow fresh data read.
     HC-P-CC1-6  CLOCK_SLACK_MS 300000 (5 min) for the freshness
                 check between the browser clock and Webflow's.
     HC-P-CC1-7  English copy (stage names, lines). Same class as
                 HC-P-PROG-2.
   ============================================================ */
(function () {
  'use strict';

  var VERSION = '1.5';
  var FILE = 'ipp-publish-v1.5.js';
  var MOUNTED = 'data-publish-mounted';
  var TIMEOUT_MS = 150000;
  var CLOCK_SLACK_MS = 300000;

  var STAGE = {
    data:    'Stopped while reading the issue\u2019s data',
    render:  'Stopped while building the email and web page',
    save:    'Stopped while saving the issue',
    publish: 'Saved, but not published'
  };

  var state = { running: false, last: null, emailUrl: '', checking: false, stopped: false };

  // ── page values ──────────────────────────────────────────────
  // v1.2 — this plan's newsletter(s), from the filtered list only.
  function newsletters() {
    var seen = {}, out = [];
    var els = document.querySelectorAll('.newsletter-source [data-nl-id]');
    Array.prototype.forEach.call(els, function (el) {
      var id = (el.getAttribute('data-nl-id') || '').trim();
      if (!id || seen[id]) return;
      seen[id] = 1;
      out.push({ id: id, name: (el.getAttribute('data-issue-name') || '').trim() });
    });
    return out;
  }
  function planId() {
    var t = (window.IPP && IPP.tenant) ? IPP.tenant() : {};
    if (t.pubplanId) return t.pubplanId;
    var el = document.querySelector('.pubplan-slot-wrapper[data-pubplan-id]');
    return (el && el.getAttribute('data-pubplan-id')) || '';
  }
  function ids() {
    var n = newsletters();
    var one = n.length === 1 ? n[0] : null;
    return {
      nlId:      one ? one.id : '',
      issue:     one ? one.name : '',
      pubplanId: planId(),
      found:     n
    };
  }
  function hook() { return (window.PP_WEBHOOKS || {}).compile || ''; }
  function checkUrl() { return (window.PP_WEBHOOKS || {}).issueCheck || ''; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function kb(bytes) { return (Math.round(bytes / 102.4) / 10).toFixed(1); }

  function blockers() {
    var i = ids(), out = [];
    if (!hook())       out.push('The compile webhook is not set on this page (PP_WEBHOOKS.compile).');
    if (!i.found.length) {
      out.push('No newsletter points at this plan. Set the plan on its NEWSLETTER item, or check that the page has the newsletter-source list.');
    } else if (i.found.length > 1) {
      out.push(i.found.length + ' newsletters point at this plan (' +
        i.found.slice(0, 4).map(function (x) { return x.name || x.id; }).join(', ') +
        (i.found.length > 4 ? ', \u2026' : '') +
        '). A plan has one newsletter. Check the newsletter-source list\u2019s filter on this page, ' +
        'or fix the extra NEWSLETTER item.');
    }
    if (!i.pubplanId)  out.push('The publication plan id is missing from the page.');
    if (!window.IxToast || typeof IxToast.submit !== 'function')
                       out.push('ix-success-toast is not loaded on this page.');
    return out;
  }

  // ── frame (rendered once; only the result area changes) ──────
  function infoBadge() {
    if (!window.IxInfo || typeof IxInfo.badge !== 'function') return '';
    return IxInfo.badge({
      file: FILE, version: VERSION, title: 'Compile this issue',
      blurb: 'Builds the email and the web page from the blocks in this plan, ' +
             'saves both to the issue, and publishes the issue\u2019s web page. ' +
             'Nothing is sent to readers.\n\n' +
             'Before you click, a free check reads the same data 206 will read: whether the run ' +
             'would stop, the last compile\u2019s size, and any record not yet published.\n\n' +
             'Green means 206 confirmed the save. Red names the stage that stopped ' +
             'and why. Amber means there was no clear answer: check the issue before ' +
             'compiling again.',
      scenarios: [{ name: '206 \u00b7 Modular newsletter compiler', note: 'v1.44+, answers this view in JSON' }],
      companions: 'ipp-publish-v1.2.css \u00b7 ix-success-toast \u00b7 ix-progress v1.0.2 \u00b7 ix-issue-data v1.0.8 /issue-check'
    });
  }

  function frame() {
    var i = ids();
    var b = blockers();
    var head =
      '<div class="ipp-pub-head">' +
        '<p class="ipp-pub-kicker">Final step</p>' +
        '<div class="ipp-pub-titlerow">' +
          '<h2 class="ipp-pub-title">Compile this issue</h2>' + infoBadge() +
        '</div>' +
        '<p class="ipp-pub-sub">Builds the email and the web page from the blocks in this plan ' +
        'and saves them to the issue. Nothing is sent to readers.</p>' +
      '</div>';

    if (b.length) {
      return head +
        '<div class="ipp-pub-card ipp-pub-blocked">' +
          '<p class="ipp-pub-blocked-head">Cannot compile yet</p>' +
          '<ul class="ipp-pub-list">' +
            b.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') +
          '</ul>' +
        '</div>';
    }

    return head +
      '<div class="ipp-pub-card">' +
        '<dl class="ipp-pub-facts">' +
          '<dt>Issue</dt><dd>' + esc(i.issue || i.nlId) + '</dd>' +
          '<dt>Newsletter</dt><dd class="mono">' + esc(i.nlId) + '</dd>' +
          '<dt>Plan</dt><dd class="mono">' + esc(i.pubplanId) + '</dd>' +
        '</dl>' +
        '<div class="ipp-pub-check" data-publish-check></div>' +
        '<div class="ipp-pub-actions">' +
          '<button type="button" class="ix-btn ix-btn--primary ix-btn--lg" data-publish-go>Compile issue</button>' +
          '<span class="ipp-pub-status" data-publish-status></span>' +
        '</div>' +
        '<div class="ipp-pub-result" data-publish-result hidden></div>' +
      '</div>';
  }

  // ── reading 206's answer ────────────────────────────────────
  function parse(raw) {
    if (!raw) return null;
    try { var o = JSON.parse(raw); return (o && typeof o === 'object') ? o : null; }
    catch (e) { return null; }
  }

  // The render Worker's own answer for one surface, as plain lines.
  function surfaceLines(obj, http, label) {
    if (obj && obj.missing && obj.missing.length) {
      return ['These required values are empty: ' + obj.missing.join(', ') + '.'];
    }
    if (obj && obj.problems && obj.problems.length) return obj.problems.slice();
    if (obj && obj.error) return [String(obj.error)];
    if (http && http !== 200) return ['The ' + label + ' render did not answer (HTTP ' + http + ').'];
    return [];
  }

  function stopLines(o) {
    if (o.stage !== 'render') return [o.message || 'No reason was given.'];
    var em = surfaceLines(o.email, o.emailHttp, 'email');
    var wb = surfaceLines(o.web, o.webHttp, 'web');
    var out = [];
    em.forEach(function (l) { out.push(wb.indexOf(l) !== -1 ? l : 'Email: ' + l); });
    wb.forEach(function (l) { if (em.indexOf(l) === -1) out.push('Web: ' + l); });
    return out.length ? out : ['The render stopped without a reason.'];
  }

  function b64ToText(b64) {
    var bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (var k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
    return new TextDecoder('utf-8').decode(bytes);
  }

  // ── result rendering ─────────────────────────────────────────
  function sizeMeter(o) {
    var bytes = Number(o.emailBytes), limit = Number(o.emailLimit);
    if (!bytes || !limit) return '';
    var over = bytes > limit;
    var pct = Math.min(100, Math.round(bytes / limit * 100));
    return '<div class="ipp-pub-meter' + (over ? ' is-over' : '') + '">' +
             '<div class="ipp-pub-meter-bar"><span style="width:' + pct + '%"></span></div>' +
             '<div class="ipp-pub-meter-label">Email ' + esc(o.emailSizeKb != null ? o.emailSizeKb : kb(bytes)) +
               ' of ' + esc(Math.round(limit / 1024)) + ' KB</div>' +
           '</div>';
  }

  function showResult(kind, html) {
    var box = document.querySelector('[data-publish-result]');
    if (!box) return;
    box.className = 'ipp-pub-result is-' + kind;
    box.innerHTML = html;
    box.hidden = false;
  }

  function renderOk(o) {
    var lines = [];
    var limit = Number(o.emailLimit), bytes = Number(o.emailBytes);
    if (limit && bytes > limit) {
      lines.push('The email is over ' + Math.round(limit / 1024) + ' KB. Gmail clips at about 102 KB, ' +
                 'so readers may see "View entire message". Trim a block before sending.');
    }
    var left = Number(o.blocksInPlan) - Number(o.blocks);
    if (left > 0) {
      lines.push(left + ' of ' + o.blocksInPlan + ' blocks in this plan were left out. ' +
                 'Their design does not match their type, or they have nothing in them.');
    }
    var when = o.written ? new Date(o.written) : null;
    showResult('ok',
      '<p class="ipp-pub-result-head">Compiled \u00b7 ' + esc(o.blocks) + ' blocks' +
        (o.emailSizeKb != null && limit ? ' \u00b7 ' + esc(o.emailSizeKb) + ' of ' + Math.round(limit / 1024) + ' KB' : '') +
      '</p>' +
      '<p class="ipp-pub-result-sub">Email and web page saved to ' + esc(o.issue || o.nlId) +
        (when && !isNaN(when) ? ' at ' + esc(when.toLocaleTimeString()) : '') + '.</p>' +
      sizeMeter(o) +
      (lines.length
        ? '<ul class="ipp-pub-warn">' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>'
        : '') +
      '<div class="ipp-pub-result-actions">' +
        (state.emailUrl ? '<button type="button" class="ix-btn ix-btn--secondary" data-publish-view-email>View email</button>' : '') +
        (o.issueUrl ? '<a class="ix-btn ix-btn--secondary" href="' + esc(o.issueUrl) + '" target="_blank" rel="noopener">View web page</a>' : '') +
      '</div>');
  }

  function renderStop(o, httpStatus) {
    var lines = stopLines(o);
    showResult('stop',
      '<p class="ipp-pub-result-head">' + esc(STAGE[o.stage] || 'Stopped') + '</p>' +
      '<ul class="ipp-pub-problems">' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
      '<p class="ipp-pub-result-sub">' +
        (o.stage === 'publish'
          ? 'The email and web page were saved. Publish the NEWSLETTER item in Webflow, or compile again.'
          : 'Nothing was saved. Fix what is named above, then compile again.') +
        (httpStatus ? ' <span class="mono">HTTP ' + esc(httpStatus) + '</span>' : '') +
      '</p>');
    return lines;
  }

  function renderUnclear(reason) {
    showResult('unclear',
      '<p class="ipp-pub-result-head">No clear answer from 206</p>' +
      '<p class="ipp-pub-result-sub">' + esc(reason) + '. The issue may or may not have been compiled. ' +
      'Open the web page or check Make before compiling again.</p>');
  }

  // v1.3 — the button's look after a result.
  function setButton(btn, compiled) {
    if (!btn) return;
    btn.classList.toggle('ix-btn--primary', !compiled);
    btn.classList.toggle('ix-btn--secondary', compiled);
    btn.textContent = compiled ? 'Compile again' : 'Compile issue';
  }

  function setStatus(text) {
    var s = document.querySelector('[data-publish-status]');
    if (s) s.textContent = text || '';
  }

  // ── pre-check (v1.4) ─────────────────────────────────────────
  function checkBox() { return document.querySelector('[data-publish-check]'); }
  function goBtn() { return document.querySelector('[data-publish-go]'); }

  function setGoEnabled(on) {
    var b = goBtn();
    if (b && !state.running) b.disabled = !on;
  }

  var STATE_WORDS = {
    draft:    'is not published yet. The email will link to a page that does not exist yet.',
    archived: 'is archived, but this issue still uses it.',
    edited:   'has edits not yet published. The email will show them; its web page will not until it is published.'
  };

  function renderCheck(html, kind) {
    var box = checkBox();
    if (!box) return;
    box.className = 'ipp-pub-check' + (kind ? ' is-' + kind : '');
    box.innerHTML = '<p class="ipp-pub-check-head">Before you compile</p>' + html +
      '<button type="button" class="ipp-pub-recheck" data-publish-recheck>Check again</button>';
  }

  function runCheck() {
    var i = ids();
    if (blockers().length || state.checking) return;
    if (!checkUrl()) {
      renderCheck('<p class="ipp-pub-check-line">Pre-check not set up on this page (PP_WEBHOOKS.issueCheck).</p>', 'muted');
      setGoEnabled(true);
      return;
    }
    state.checking = true;
    renderCheck('<p class="ipp-pub-check-line">Checking this issue\u2019s data\u2026</p>', 'muted');
    var url = checkUrl() + (checkUrl().indexOf('?') === -1 ? '?' : '&') +
      'contextNlId=' + encodeURIComponent(i.nlId) + '&parentId=' + encodeURIComponent(i.pubplanId);
    fetch(url, { method: 'GET', credentials: 'omit' })
      .then(function (res) {
        return res.text().then(function (t) { return { status: res.status, body: parse(t) }; });
      })
      .then(function (r) { state.checking = false; showCheck(r); })
      .catch(function (e) {
        state.checking = false;
        showCheck({ status: 0, body: null, error: String(e && e.message || e) });
      });
  }

  function showCheck(r) {
    var o = r.body;
    if (!o || o.ok !== true) {
      var why = String((o && o.error) || r.error || ('HTTP ' + r.status)).replace(/\s*$/, '');
      if (!/[.!?]$/.test(why)) why += '.';
      state.stopped = false;
      renderCheck('<p class="ipp-pub-check-line">The pre-check could not run: ' + esc(why) +
        ' You can still compile; 206 makes its own checks.</p>', 'unclear');
      setGoEnabled(true);
      return;
    }
    var parts = [], kind = 'ok';

    if (o.wouldStop) {
      state.stopped = true;
      kind = 'stop';
      parts.push('<p class="ipp-pub-check-stop">206 would stop: ' + esc(o.wouldStop.message) + '</p>' +
        '<p class="ipp-pub-check-line">Fix this, then click Check again. Compile is off until it passes, ' +
        'so no Make credits are spent on a run that stops.</p>');
    } else {
      state.stopped = false;
      parts.push('<p class="ipp-pub-check-good">The data is complete. 206 should not stop on missing records.</p>');
    }

    var lc = o.lastCompile || {};
    if (lc.sizeKb == null) {
      parts.push('<p class="ipp-pub-check-line">Not compiled yet.</p>');
    } else if (lc.over) {
      if (kind === 'ok') kind = 'warn';
      parts.push('<p class="ipp-pub-check-warnline">Last compile was ' + esc(lc.sizeKb) + ' KB, over the ' +
        esc(lc.limitKb) + ' KB line. Gmail clips at about 102 KB. Trim a block before compiling again.</p>');
    } else {
      parts.push('<p class="ipp-pub-check-line">Last compile: ' + esc(lc.sizeKb) + ' KB' +
        (lc.limitKb ? ' of ' + esc(lc.limitKb) + ' KB' : '') + '.</p>');
    }

    if (o.unpublished && o.unpublished.length) {
      if (kind === 'ok') kind = 'warn';
      parts.push('<p class="ipp-pub-check-warnline">' + o.unpublished.length +
        (o.unpublished.length === 1 ? ' record is' : ' records are') + ' not published:</p>' +
        '<ul class="ipp-pub-check-list">' + o.unpublished.map(function (u) {
          return '<li>' + esc(u.kind) + ' \u201c' + esc(u.name) + '\u201d' +
            (u.positions && u.positions.length ? ' (position ' + esc(u.positions.join(', ')) + ')' : '') +
            ' ' + esc(STATE_WORDS[u.state] || ('is ' + u.state + '.')) + '</li>';
        }).join('') + '</ul>');
    } else if (o.unpublished) {
      parts.push('<p class="ipp-pub-check-line">Every record this issue uses is published.</p>');
    } else if (o.unpublishedError) {
      parts.push('<p class="ipp-pub-check-line">' + esc(o.unpublishedError) + '</p>');
    }

    // v1.5 — cloned ads nobody has approved. Warns; never blocks.
    if (o.unapproved && o.unapproved.length) {
      if (kind === 'ok') kind = 'warn';
      var n = o.unapproved.length;
      parts.push('<p class="ipp-pub-check-warnline">' + n +
        (n === 1 ? ' ad copied by Clone is' : ' ads copied by Clone are') + ' not approved yet:</p>' +
        '<ul class="ipp-pub-check-list">' + o.unapproved.map(function (u) {
          return '<li>Ad \u201c' + esc(u.name) + '\u201d' +
            (u.position != null ? ' (position ' + esc(u.position) + ')' : '') + '</li>';
        }).join('') + '</ul>' +
        '<p class="ipp-pub-check-line">You can still compile; ' + (n === 1 ? 'it goes' : 'they go') +
        ' out as copied. <button type="button" class="ipp-pub-recheck" data-publish-revenue>' +
        'Approve on Revenue</button></p>');
    }

    if (o.notes && o.notes.length) {
      parts.push('<details class="ipp-pub-check-notes"><summary>' + o.notes.length +
        (o.notes.length === 1 ? ' note' : ' notes') + ' from the data read</summary><ul>' +
        o.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></details>');
    }

    renderCheck(parts.join(''), kind);
    setGoEnabled(!state.stopped);
  }

  // ── compile ──────────────────────────────────────────────────
  function compile(btn) {
    if (state.running || state.stopped) return;
    var i = ids();
    if (blockers().length) return;
    state.running = true;
    var clickAt = Date.now();
    var key = 'ipp-publish:compile:' + i.nlId;
    if (state.emailUrl) { try { URL.revokeObjectURL(state.emailUrl); } catch (e) {} state.emailUrl = ''; }
    var box = document.querySelector('[data-publish-result]');
    if (box) box.hidden = true;
    setStatus('Building the email and web page. Usually under 10 seconds.');

    IxToast.submit({
      url: hook(),
      method: 'GET',
      body: { contextNlId: i.nlId, parentId: i.pubplanId, respond: 'json' },
      sent: { nlId: i.nlId },
      button: btn,
      busyLabel: 'Compiling\u2026',
      silent: true,
      timeoutMs: TIMEOUT_MS,
      key: key
    }).then(function (r) {
      state.running = false;
      setStatus('');
      setTimeout(runCheck, 0);   // v1.4: refresh the pre-check after every result
      var o = parse(r.raw);

      // Stopped: 206 answered with a reason.
      if (o && o.ok === false) {
        var lines = renderStop(o, r.httpStatus);
        setButton(btn, false);
        IxToast.show(STAGE[o.stage] || 'Compile stopped', 'err', { key: key, detail: lines[0] });
        return;
      }

      // Answered ok: prove it before saying so.
      if (r.status === 'ok' && o && o.ok === true) {
        var written = Date.parse(o.written || '');
        if (isNaN(written) || written < clickAt - CLOCK_SLACK_MS) {
          renderUnclear('206 answered, but the save time it sent is older than this click');
          setButton(btn, false);
          IxToast.show('Compile not confirmed', 'unverified', { key: key,
            detail: 'The save time is older than this click. Check the issue before relying on it.' });
          return;
        }
        if (o.emailHtmlB64) {
          try {
            state.emailUrl = URL.createObjectURL(new Blob([b64ToText(o.emailHtmlB64)], { type: 'text/html' }));
          } catch (e) { state.emailUrl = ''; }
        }
        renderOk(o);
        setButton(btn, true);
        IxToast.show('Compiled ' + (o.issue || i.issue || ''), 'ok', { key: key });
        return;
      }

      // Anything else: no proof either way.
      var why = r.status === 'failed'
        ? 'The request failed' + (r.httpStatus ? ' (HTTP ' + r.httpStatus + ')' : '')
        : /timed out/.test(r.reason || '')
          ? 'No answer came back within ' + Math.round(TIMEOUT_MS / 1000) + ' seconds'
          : '206 answered, but not in a form this page can read';
      renderUnclear(why);
      setButton(btn, false);
      IxToast.show('Compile not confirmed', 'unverified', { key: key,
        detail: 'Check the issue before compiling again.' });
    });
  }

  // ── mount ────────────────────────────────────────────────────
  function canvas() { return document.querySelector('.ipp-view[data-view="publish"] .ipp-canvas'); }

  function mount() {
    var c = canvas();
    if (!c) return false;
    if (c.getAttribute(MOUNTED) === '1') return true;
    c.innerHTML = frame();
    c.setAttribute(MOUNTED, '1');
    runCheck();
    c.addEventListener('click', function (e) {
      var go = e.target.closest && e.target.closest('[data-publish-go]');
      if (go) { e.preventDefault(); compile(go); return; }
      var rc = e.target.closest && e.target.closest('[data-publish-recheck]');
      if (rc) { e.preventDefault(); runCheck(); return; }
      // v1.5 — open the Revenue tab through the shell's own switcher.
      var rv = e.target.closest && e.target.closest('[data-publish-revenue]');
      if (rv) {
        e.preventDefault();
        var tab = document.querySelector('.ipp-switcher button[data-view="revenue"]');
        if (tab) tab.click();
        else IxToast.show('The Revenue tab is not on this page', 'err', { detail: 'Load ipp-revenue and ipp-shell v1.9 or later.' });
        return;
      }
      var ve = e.target.closest && e.target.closest('[data-publish-view-email]');
      if (ve && state.emailUrl) { e.preventDefault(); window.open(state.emailUrl, '_blank', 'noopener'); }
    });
    return true;
  }

  // Ids can arrive late: redraw the frame when the view is shown,
  // but never while a compile is running or over a result on screen.
  document.addEventListener('ipp:view', function (e) {
    if (!e.detail || e.detail.view !== 'publish') return;
    var c = canvas();
    if (!c) return;
    if (c.getAttribute(MOUNTED) !== '1') { mount(); return; }
    if (state.running) return;
    var box = document.querySelector('[data-publish-result]');
    if (box && !box.hidden) return;
    c.innerHTML = frame();
    runCheck();
  });
  document.addEventListener('ipp:ready', mount);
  if (document.querySelector('[data-ipp-root]')) mount();

  window.IppPublish = { version: VERSION };
})();
