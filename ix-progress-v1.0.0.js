// ix-progress-v1.0.0.js
// ============================================================
// ix-progress-v1.0.0.js
// INBXIFY · ix component series · PROGRESS FOR EVERY SUBMISSION
//
// WHAT IT DOES
//   Watches every request the page sends to Make or to a Cloudflare
//   Worker. Any request still running after 1.5 seconds gets a
//   progress card at the top of the screen: a paper plane in flight,
//   the action's name, a moving bar, a live seconds counter, and a
//   line that changes as the wait gets longer.
//
//   When the reply arrives the plane lands and the card says how
//   long it took, then fades. On an HTTP error or a dropped
//   connection it turns red and stays a few seconds longer.
//
//   No tab file changes. One script tag covers all ~90 requests
//   across the T-A page, including tabs that do not use IxToast.
//
// TOAST-TRUTH, READ THIS BEFORE "IMPROVING" IT
//   This card NEVER says a write succeeded. Make answers HTTP 200
//   the moment it accepts a payload, before anything is written.
//   So a 2xx reply lands as a neutral "Reply in 3.2s", never a
//   green check. Whether the write actually worked is the tab's
//   own verified message (IxToast), which appears as this card
//   fades. Red here only means the request itself failed.
//
//   No percentages. Make does not report how far along a run is,
//   so the bar shows motion and elapsed time, never a fake 60%.
//
// WHICH REQUESTS
//   · any URL whose host ends in make.com (hook.us1.make.com etc.)
//   · any URL whose host ends in workers.dev
//   · any URL that equals a value in TA_CONFIG (so a custom domain
//     added to TA_CONFIG later is covered automatically)
//   Everything else (fonts, CDN, Webflow's own calls) is ignored.
//   Requests that finish inside 1.5s never show a card.
//
// NAMES
//   The card title comes from the TA_CONFIG key that holds the URL:
//     makePromoteNext      → "Promote next"
//     pubplanWebhooks.fa   → "PubPlan · FA"
//     anthropicProxy       → "Anthropic proxy"
//   Override any of them in TA_CONFIG, no code change:
//     progressLabels: { makePromoteNext: 'Set as Next' }
//   Silence a request entirely (e.g. a background poll):
//     progressIgnore: ['makeListAssets']
//   A URL not in TA_CONFIG shows its first host label
//   ("ix-adreformat") so it is never a blank card.
//
// PUBLIC API (optional; nothing needs it)
//   IxProgress.track(label, promise)  show a card for any promise
//   IxProgress.version
//
// MULTI-TENANT: reads nothing tenant-specific. Labels come from the
// page's own TA_CONFIG.
//
// HARDCODED DECISIONS (provisional ids; the doc chat allocates):
//   HC-P-PROG-1  SHOW_AFTER_MS = 1500. Platform spinner rule, same
//                value as IxToast's SPINNER_DELAY_MS.
//   HC-P-PROG-2  English copy: the wait lines, "Reply in", "Failed".
//                i18n out of scope, same class as HC-013.
//   HC-P-PROG-3  Host suffixes make.com / workers.dev. Platform-level,
//                one value for every tenant.
//
// LOAD: in the page head, right after the TA_CONFIG script, so it
// wraps fetch before any tab script runs. Pairs with
// ix-progress-v1.0.0.css (load after ix-tokens).
// ============================================================

(function () {
  'use strict';

  if (window.IxProgress) return;                 // never wrap twice
  if (typeof window.fetch !== 'function') return;

  var SHOW_AFTER_MS  = 1500;
  var DONE_HOLD_MS   = 1600;
  var FAIL_HOLD_MS   = 5200;
  var MAX_VISIBLE    = 3;
  var HOST_SUFFIXES  = ['make.com', 'workers.dev'];

  // Lines that change as the wait gets longer. Honest about what is
  // happening, never about how far along it is.
  var WAIT_LINES = [
    [0,     'Sending it off'],
    [3000,  'Make is on it'],
    [8000,  'Webflow is thinking it over'],
    [15000, 'Still going. Big jobs take a minute'],
    [30000, 'Longer than usual. Hang tight'],
    [60000, 'Over a minute. Check Make if this keeps going']
  ];

  var realFetch = window.fetch.bind(window);
  var seq = 0;
  var live = {};           // id → job

  // ── config ──────────────────────────────────────────────────
  function cfg() { return window.TA_CONFIG || {}; }

  // URL (no query) → dotted TA_CONFIG key. Rebuilt each call so a
  // config edit is picked up without a reload. Cheap: ~60 keys.
  function keyForUrl(url) {
    var base = String(url).split('?')[0].replace(/\/+$/, '');
    var found = '';
    (function walk(obj, path, depth) {
      if (found || !obj || typeof obj !== 'object' || depth > 3) return;
      Object.keys(obj).forEach(function (k) {
        if (found) return;
        var v = obj[k];
        var p = path ? path + '.' + k : k;
        if (typeof v === 'string') {
          if (/^https?:\/\//.test(v) && v.split('?')[0].replace(/\/+$/, '') === base) found = p;
        } else if (v && typeof v === 'object' && !Array.isArray(v) && k !== 'optionIds' && k !== 'optionLabels') {
          walk(v, p, depth + 1);
        }
      });
    })(cfg(), '', 0);
    return found;
  }

  function humanize(key) {
    var parts = key.split('.');
    return parts.map(function (part, i) {
      if (i > 0 && part.length <= 3) return part.toUpperCase();          // fa → FA
      var s = part.replace(/^make(?=[A-Z])/, '')                          // makePromoteNext → PromoteNext
                  .replace(/Webhooks?$/, '')                             // pubplanWebhooks → pubplan
                  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
                  .replace(/[_-]+/g, ' ')
                  .trim().toLowerCase();
      s = s.replace(/\bpubplan\b/g, 'PubPlan').replace(/\bnl\b/g, 'NL').replace(/\bai\b/g, 'AI');
      return s.charAt(0).toUpperCase() + s.slice(1);
    }).join(' \u00b7 ');
  }

  function labelFor(url, key) {
    var labels = cfg().progressLabels || {};
    if (key && labels[key]) return String(labels[key]);
    if (key) return humanize(key);
    try { return new URL(url, location.href).hostname.split('.')[0]; } catch (e) { return 'Working'; }
  }

  function shouldTrack(url, key) {
    var ignore = cfg().progressIgnore || [];
    if (key && ignore.indexOf(key) !== -1) return false;
    if (key) return true;
    var host = '';
    try { host = new URL(url, location.href).hostname; } catch (e) { return false; }
    return HOST_SUFFIXES.some(function (s) { return host === s || host.slice(-s.length - 1) === '.' + s; });
  }

  // ── DOM ─────────────────────────────────────────────────────
  var PLANE =
    '<svg class="ixp-art" viewBox="0 0 64 40" aria-hidden="true">' +
      '<path class="ixp-trail" d="M4 30 C 16 30, 20 12, 34 16" fill="none"/>' +
      '<g class="ixp-plane">' +
        '<path class="ixp-wing" d="M30 14 L58 4 L42 26 Z"/>' +
        '<path class="ixp-fold" d="M42 26 L44 17 L58 4 Z"/>' +
        '<path class="ixp-body" d="M30 14 L44 17 L42 26 Z"/>' +
      '</g>' +
      '<g class="ixp-env">' +
        '<rect x="18" y="12" width="28" height="20" rx="3"/>' +
        '<path d="M19 13 L32 23 L45 13" fill="none"/>' +
      '</g>' +
    '</svg>';

  var XMARK =
    '<svg class="ixp-art" viewBox="0 0 64 40" aria-hidden="true">' +
      '<circle class="ixp-x-ring" cx="32" cy="20" r="14"/>' +
      '<path class="ixp-x" d="M26 14 L38 26 M38 14 L26 26"/>' +
    '</svg>';

  function rail() {
    var el = document.getElementById('ixp-rail');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ixp-rail';
      el.className = 'ixp-rail';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      (document.body || document.documentElement).appendChild(el);
    }
    return el;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function secs(ms) { return (ms / 1000).toFixed(ms < 10000 ? 1 : 0) + 's'; }

  function waitLine(ms) {
    var line = WAIT_LINES[0][1];
    for (var i = 0; i < WAIT_LINES.length; i++) if (ms >= WAIT_LINES[i][0]) line = WAIT_LINES[i][1];
    return line;
  }

  function show(job) {
    if (job.el || job.finished) return;
    var el = document.createElement('div');
    el.className = 'ixp-card';
    el.innerHTML =
      '<div class="ixp-art-wrap">' + PLANE + '</div>' +
      '<div class="ixp-text">' +
        '<div class="ixp-title">' + esc(job.label) + '</div>' +
        '<div class="ixp-line"><span class="ixp-msg"></span><span class="ixp-time"></span></div>' +
        '<div class="ixp-bar"><span></span></div>' +
      '</div>' +
      '<button type="button" class="ixp-close" aria-label="Hide">\u00d7</button>';
    el.querySelector('.ixp-close').addEventListener('click', function () { hide(job, true); });
    job.el = el;
    rail().appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-in'); });
    tick(job);
    job.timer = setInterval(function () { tick(job); }, 100);
    overflow();
  }

  function tick(job) {
    if (!job.el) return;
    var ms = Date.now() - job.start;
    job.el.querySelector('.ixp-time').textContent = secs(ms);
    var m = job.el.querySelector('.ixp-msg');
    var line = waitLine(ms);
    if (m.textContent !== line) m.textContent = line;
  }

  function finish(job, outcome, detail) {
    job.finished = true;
    clearTimeout(job.showTimer);
    if (!job.el) { delete live[job.id]; return; }       // fast request, never shown
    clearInterval(job.timer);
    var ms = Date.now() - job.start;
    var el = job.el;
    el.classList.add(outcome === 'fail' ? 'is-fail' : 'is-done');
    if (outcome === 'fail') el.querySelector('.ixp-art-wrap').innerHTML = XMARK;
    el.querySelector('.ixp-msg').textContent =
      outcome === 'fail' ? ('Failed' + (detail ? ' \u00b7 ' + detail : ''))
      : outcome === 'opaque' ? 'Sent. The reply can\u2019t be read here'
      : 'Reply in';
    el.querySelector('.ixp-time').textContent = secs(ms);
    setTimeout(function () { hide(job); }, outcome === 'fail' ? FAIL_HOLD_MS : DONE_HOLD_MS);
  }

  function hide(job, now) {
    var el = job.el;
    clearInterval(job.timer);
    delete live[job.id];
    if (!el) return;
    job.el = null;
    el.classList.add('is-out');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); overflow(); }, now ? 0 : 260);
  }

  // More than MAX_VISIBLE in flight: keep the newest few, show a count.
  function overflow() {
    var r = document.getElementById('ixp-rail');
    if (!r) return;
    var cards = r.querySelectorAll('.ixp-card:not(.is-out)');
    Array.prototype.forEach.call(cards, function (c, i) {
      c.classList.toggle('is-hidden', i < cards.length - MAX_VISIBLE);
    });
    var extra = Math.max(0, cards.length - MAX_VISIBLE);
    var more = r.querySelector('.ixp-more');
    if (!extra) { if (more) more.parentNode.removeChild(more); return; }
    if (!more) { more = document.createElement('div'); more.className = 'ixp-more'; r.insertBefore(more, r.firstChild); }
    more.textContent = '+' + extra + ' more working';
  }

  // ── tracking ────────────────────────────────────────────────
  function begin(label) {
    var job = { id: ++seq, label: label, start: Date.now(), el: null, finished: false };
    live[job.id] = job;
    job.showTimer = setTimeout(function () { show(job); }, SHOW_AFTER_MS);
    return job;
  }

  function track(label, promise) {
    var job = begin(label || 'Working');
    Promise.resolve(promise).then(
      function () { finish(job, 'done'); },
      function (e) { finish(job, 'fail', e && e.name === 'AbortError' ? 'timed out' : 'no connection'); }
    );
    return promise;
  }

  window.fetch = function (input, init) {
    var url = '';
    try { url = typeof input === 'string' ? input : (input && input.url) || String(input); } catch (e) {}
    var key = '';
    try { key = keyForUrl(url); } catch (e) {}
    var p = realFetch(input, init);
    try {
      if (!shouldTrack(url, key)) return p;
      var job = begin(labelFor(url, key));
      p.then(function (res) {
        if (res.type === 'opaque') finish(job, 'opaque');
        else if (res.ok) finish(job, 'done');
        else finish(job, 'fail', 'HTTP ' + res.status);
      }, function (e) {
        finish(job, 'fail', e && e.name === 'AbortError' ? 'timed out' : 'no connection');
      });
    } catch (e) {
      console.warn('[ix-progress] could not track request', e);   // never break the request itself
    }
    return p;
  };

  window.IxProgress = { version: '1.0.0', track: track };
})();
