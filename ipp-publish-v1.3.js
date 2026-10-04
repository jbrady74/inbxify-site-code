/* ipp-publish-v1.3.js */
/* ============================================================
   ipp-publish-v1.3.js — Publish view for the IPP · COMPILE CONTROL
   Companion stylesheet: ipp-publish-v1.1.css (unchanged)
   Needs on the page: ix-tokens, ix-buttons, ix-success-toast
   (CSS + JS), ix-progress (CSS + JS), ix-info (CSS + JS).

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

  var VERSION = '1.3';
  var FILE = 'ipp-publish-v1.3.js';
  var MOUNTED = 'data-publish-mounted';
  var TIMEOUT_MS = 150000;
  var CLOCK_SLACK_MS = 300000;

  var STAGE = {
    data:    'Stopped while reading the issue\u2019s data',
    render:  'Stopped while building the email and web page',
    save:    'Stopped while saving the issue',
    publish: 'Saved, but not published'
  };

  var state = { running: false, last: null, emailUrl: '' };

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
             'Green means 206 confirmed the save. Red names the stage that stopped ' +
             'and why. Amber means there was no clear answer: check the issue before ' +
             'compiling again.',
      scenarios: [{ name: '206 \u00b7 Modular newsletter compiler', note: 'v1.44+, answers this view in JSON' }],
      companions: 'ipp-publish-v1.1.css \u00b7 ix-success-toast \u00b7 ix-progress v1.0.2'
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

  // ── compile ──────────────────────────────────────────────────
  function compile(btn) {
    if (state.running) return;
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
    c.addEventListener('click', function (e) {
      var go = e.target.closest && e.target.closest('[data-publish-go]');
      if (go) { e.preventDefault(); compile(go); return; }
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
  });
  document.addEventListener('ipp:ready', mount);
  if (document.querySelector('[data-ipp-root]')) mount();

  window.IppPublish = { version: VERSION };
})();
