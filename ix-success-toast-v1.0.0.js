// ============================================================
// ix-success-toast-v1.0.0.js
//
// TOAST-TRUTH — shared submit-and-verify helper.
//
// NAMING: the file is ix-success-toast, the global is IxToast, and
// the CSS classes are .ix-toast-*. Same shortening precedent as
// ix-refresh-helper -> IxRefresh. The filename says what the module
// governs; the global stays short because every consumer types it.
//
// THE RULE (both halves, neither optional):
//   1. Scenario side — every Webhook Response a toast depends on
//      must echo back the fields actually written, read from the
//      POST-UPDATE module, never a static { ok: true }.
//   2. Client side — diff the echoed values against what was sent,
//      field by field. Toast success ONLY on match. On mismatch,
//      toast failure and name the fields that did not persist.
//
//   ok:true is necessary but NOT sufficient. This module makes
//   that structural instead of aspirational.
//
// WHAT WENT WRONG BEFORE (the bug this module exists to end)
//   The Promote-to-Next button on the T-A Issues tab toasted
//   "Promoted ✓" on res.ok. Make returns HTTP 200 the instant it
//   RECEIVES a payload — when the scenario is off, when the run is
//   queued, and when the run dies at module 2. The response body
//   was never read. Meanwhile Scenario 107's Module 4 was sending
//   six toc-image-* fields that no longer existed in the NEWSLETTERS
//   schema, so Webflow 400'd every PATCH. The button had never once
//   worked, and the toast said it had, every time.
//
// THREE OUTCOMES, NOT TWO
//   ok           echo came back and every sent field matched.
//   unverified   request accepted, but the response could not prove
//                anything was written. AMBER. Not a success.
//   failed       HTTP error, or the echo holds different values.
//
//   Most legacy toasts collapsed 'unverified' into 'ok'. That single
//   collapse is the entire class of bug. Nothing in this module can
//   produce a green toast without a field-level match.
//
// ─────────────────────────────────────────────────────────────
// no-cors IS INCOMPATIBLE WITH THIS RULE — READ THIS
//
//   Several surfaces post to Make with { mode: 'no-cors' }. That
//   returns an OPAQUE response: status reads 0, the body is
//   unreadable by design. There is no echo, so there is nothing to
//   diff, so a green toast is impossible to justify. This module
//   detects res.type === 'opaque' and forces the AMBER unverified
//   state. It will not lie for you.
//
//   The fix is on the Make side, not here. In the scenario's Webhook
//   Response module add a custom header:
//
//     Access-Control-Allow-Origin: https://inbxify.com
//
//   (non-www — the Memberstack session lives on the apex domain).
//   Then drop mode:'no-cors' from the client and the body becomes
//   readable. Do this per scenario as each surface migrates; there
//   is no global switch.
//
// ─────────────────────────────────────────────────────────────
// USAGE — the normal path
//
//   IxToast.submit({
//     url:    MAKE_PROMOTE_URL,
//     button: btn,
//     busyLabel: 'Promoting…',
//     doneLabel: 'Promoted ✓',
//     body: {
//       newsletter:         nlId,
//       'publishing-status': nextToGoOptionId
//     },
//     sent: {                        // what we CLAIM to have written
//       'publishing-status': nextToGoOptionId
//     },
//     success: 'Promoted to Next'
//   }).then(function (r) {
//     if (r.status === 'ok') IxReturn.reload({ delay: 900 });
//   });
//
//   `sent` is REQUIRED and must be non-empty. Calling submit()
//   without it throws. That is deliberate: a submit with nothing to
//   verify is the exact shape of the bug above, and it should fail
//   at wiring time in front of a developer rather than silently in
//   front of an operator.
//
//   `body` is what goes on the wire. `sent` is the subset of it that
//   must come back. They are separate because payloads carry routing
//   values (ids, tokens, flags) that the scenario is not expected to
//   echo.
//
// USAGE — surfaces that already own their fetch
//
//   var v = IxToast.verify(sent, parsedResponseBody);
//   if (v.status === 'ok') { … }
//
//   verify() is pure. Adopt it first, migrate the fetch later.
//
// USAGE — client-only notices with no write behind them
//
//   IxToast.show('Copied to clipboard', 'info');
//
//   show() will emit any variant you ask for, including 'ok'. Do not
//   use 'ok' for anything that touched a server. If a write happened,
//   it goes through submit() or verify(). There is no third way.
//
// ─────────────────────────────────────────────────────────────
// EDIT-STATE CONTRACT (platform invariant)
//   On 'ok'        — the caller clears the gold --ix-changed-border
//                    dirty state on the fields that were saved.
//   On 'failed' or
//      'unverified' — the caller LEAVES the gold borders in place.
//                    The operator's edit is not lost and the cancel
//                    text link still reverts. Never clear dirty state
//                    on an unproven write.
//
//   r.matched and r.mismatched are returned per field so a partial
//   save clears only the fields that actually landed.
//
// DURATIONS
//   ok / info    auto-dismiss, 2.8s.
//   unverified /
//   failed       persist until dismissed. The operator has to go
//                look at something, and a message that vanishes in
//                three seconds does not survive being looked away
//                from. Both carry a close button.
//
// MULTI-TENANT: reads nothing tenant-specific. No publisher, title
// or collection value appears anywhere in this file. Callers pass
// their own URLs and option IDs.
//
// PAIRS WITH: ix-success-toast-v1.0.0.css (required — no inline styles here)
// PLAYS WITH: ix-return (reload after verified write), ix-modals
//             (toast rail sits one z-index above .ix-overlay),
//             ix-form-controls (the gold dirty border it preserves).
// ============================================================

(function () {
  'use strict';

  var RAIL_ID = 'ix-toast-rail';
  var AUTO_DISMISS_MS = 2800;
  var SPINNER_DELAY_MS = 1500;   // platform rule: spinner only past 1.5s
  var DEFAULT_TIMEOUT_MS = 30000;

  // Where an echo commonly hides in a Make/Webflow response body.
  // Ordered most-specific-last so the first candidate holding a sent
  // key wins; a scenario echoing at the root is the cleanest shape.
  var ECHO_CANDIDATES = [
    function (b) { return b; },
    function (b) { return b && b.fieldData; },
    function (b) { return b && b.data; },
    function (b) { return b && b.data && b.data.fieldData; },
    function (b) { return b && b.item; },
    function (b) { return b && b.item && b.fieldData; },
    function (b) { return b && b.item && b.item.fieldData; },
    function (b) { return b && b.fields; },
    function (b) { return b && b.result; }
  ];

  // ══════════════════════════════════════════════════════════
  //  Rail + card rendering
  // ══════════════════════════════════════════════════════════

  function rail() {
    var el = document.getElementById(RAIL_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = RAIL_ID;
      el.className = 'ix-toast-rail';
      // aria-live so a screen reader announces the outcome. polite,
      // not assertive — the operator is mid-task and an assertive
      // region interrupts whatever they are reading.
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'false');
      // body, not the tab pane: keeps the rail out of reach of
      // section.publisher-wrapper's background wildcard, and out of
      // any transformed ancestor that would trap position:fixed.
      document.body.appendChild(el);
    }
    return el;
  }

  var ICONS = {
    ok: '\u2713',
    err: '\u2715',
    unverified: '!',
    info: 'i',
    busy: '\u25CC'
  };

  function dismiss(card) {
    if (!card || card.__ixLeaving) return;
    card.__ixLeaving = true;
    if (card.__ixTimer) clearTimeout(card.__ixTimer);
    card.classList.add('is-leaving');
    setTimeout(function () {
      if (card.parentNode) card.parentNode.removeChild(card);
    }, 200);
  }

  // opts: { detail, fields, sticky, timeout }
  function render(msg, variant, opts) {
    opts = opts || {};
    variant = variant || 'info';

    var card = document.createElement('div');
    card.className = 'ix-toast ix-toast--' + variant;
    card.setAttribute('role', variant === 'err' ? 'alert' : 'status');

    var icon = document.createElement('span');
    icon.className = 'ix-toast-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = ICONS[variant] || ICONS.info;
    card.appendChild(icon);

    var body = document.createElement('div');
    body.className = 'ix-toast-body';

    var title = document.createElement('div');
    title.className = 'ix-toast-title';
    title.textContent = String(msg == null ? '' : msg);
    body.appendChild(title);

    if (opts.detail || (opts.fields && opts.fields.length)) {
      var det = document.createElement('div');
      det.className = 'ix-toast-detail';
      if (opts.detail) det.appendChild(document.createTextNode(String(opts.detail)));
      if (opts.fields && opts.fields.length) {
        if (opts.detail) det.appendChild(document.createTextNode(' '));
        var f = document.createElement('span');
        f.className = 'ix-toast-fields';
        f.textContent = opts.fields.join(', ');
        det.appendChild(f);
      }
      body.appendChild(det);
    }
    card.appendChild(body);

    var sticky = opts.sticky === true ||
                 (opts.sticky !== false && (variant === 'err' || variant === 'unverified'));

    if (variant !== 'busy') {
      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'ix-toast-close';
      close.setAttribute('aria-label', 'Dismiss');
      close.textContent = '\u00D7';
      close.addEventListener('click', function () { dismiss(card); });
      card.appendChild(close);
    }

    rail().appendChild(card);

    if (!sticky && variant !== 'busy') {
      card.__ixTimer = setTimeout(function () { dismiss(card); },
        opts.timeout || AUTO_DISMISS_MS);
    }

    return {
      el: card,
      close: function () { dismiss(card); }
    };
  }

  // ══════════════════════════════════════════════════════════
  //  Comparison
  // ══════════════════════════════════════════════════════════

  // Coerce to a comparable string.
  //
  //   · null / undefined            -> ''
  //   · booleans and their sentinel spellings -> '1' / '0'
  //     Make's ifempty() treats false as empty, so boolean fields
  //     travel as "1"/"0" sentinels on this platform. An echo may
  //     legitimately come back as true, "true" or "1" for the same
  //     value; all three must compare equal or every switch field
  //     would report a false mismatch.
  //   · everything else             -> trimmed string
  //
  // Comparison is case-insensitive. Webflow option IDs are lowercase
  // 32-char hex, but they get retyped by hand into Make mappers often
  // enough that a case difference is a transcription artefact, not a
  // real mismatch.
  function norm(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? '1' : '0';
    if (typeof v === 'object') {
      // A reference field can echo as { id: '…' } or as a bare id.
      if (v.id) return norm(v.id);
      if (v._id) return norm(v._id);
      if (v.value !== undefined) return norm(v.value);
      try { return JSON.stringify(v); } catch (e) { return String(v); }
    }
    var s = String(v).trim();
    var lower = s.toLowerCase();
    if (lower === 'true') return '1';
    if (lower === 'false') return '0';
    return lower;
  }

  function readPath(obj, path) {
    if (!path) return undefined;
    var parts = String(path).split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur === null || cur === undefined) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  // Find the object in the response that holds the echoed fields.
  function locateEcho(bodyObj, sentKeys, echoPath) {
    if (echoPath) {
      var explicit = readPath(bodyObj, echoPath);
      return (explicit && typeof explicit === 'object') ? explicit : null;
    }
    for (var i = 0; i < ECHO_CANDIDATES.length; i++) {
      var cand;
      try { cand = ECHO_CANDIDATES[i](bodyObj); } catch (e) { cand = null; }
      if (!cand || typeof cand !== 'object') continue;
      for (var k = 0; k < sentKeys.length; k++) {
        if (Object.prototype.hasOwnProperty.call(cand, sentKeys[k])) return cand;
      }
    }
    return null;
  }

  // PURE. Diff `sent` against a parsed response body.
  //
  // Returns:
  //   { status, echo, matched[], mismatched[{field,sent,got}],
  //     missing[], reason }
  //
  //   status 'ok'         every sent field present and equal
  //   status 'failed'     at least one field present but different
  //   status 'unverified' no echo, or fields absent from the echo
  //
  // Note the ordering: a mismatch outranks a missing field. If one
  // field came back wrong, the write is wrong, whatever else is
  // absent.
  function verify(sent, bodyObj, opts) {
    opts = opts || {};
    var keys = Object.keys(sent || {});
    var out = {
      status: 'unverified',
      echo: null,
      matched: [],
      mismatched: [],
      missing: keys.slice(),
      reason: ''
    };

    if (!keys.length) {
      out.reason = 'nothing was declared in `sent`, so nothing could be verified';
      return out;
    }
    if (!bodyObj || typeof bodyObj !== 'object') {
      out.reason = 'the response body was not JSON';
      return out;
    }

    var echo = locateEcho(bodyObj, keys, opts.echoPath);
    if (!echo) {
      // This is the { ok: true } case. Deliberately called out,
      // because it is the single most common shape of the bug.
      out.reason = (bodyObj.ok === true || bodyObj.ok === 'true')
        ? 'the response said ok:true but echoed none of the written fields'
        : 'the response did not echo any of the written fields';
      return out;
    }

    out.echo = echo;
    out.missing = [];

    keys.forEach(function (k) {
      if (!Object.prototype.hasOwnProperty.call(echo, k)) {
        out.missing.push(k);
        return;
      }
      if (norm(echo[k]) === norm(sent[k])) {
        out.matched.push(k);
      } else {
        out.mismatched.push({ field: k, sent: sent[k], got: echo[k] });
      }
    });

    if (out.mismatched.length) {
      out.status = 'failed';
      out.reason = 'the write came back holding different values';
    } else if (out.missing.length) {
      out.status = 'unverified';
      out.reason = 'the response echoed only part of what was written';
    } else {
      out.status = 'ok';
      out.reason = '';
    }
    return out;
  }

  // ══════════════════════════════════════════════════════════
  //  Button state
  // ══════════════════════════════════════════════════════════

  function beginButton(btn, busyLabel) {
    if (!btn) return null;
    var state = {
      btn: btn,
      wasDisabled: btn.disabled,
      label: btn.textContent,
      spinTimer: null
    };
    btn.disabled = true;
    btn.classList.add('is-ix-submitting');
    if (busyLabel) btn.textContent = busyLabel;
    state.spinTimer = setTimeout(function () {
      btn.classList.add('is-ix-spinning');
    }, SPINNER_DELAY_MS);
    return state;
  }

  function endButton(state, doneLabel, keepDisabled) {
    if (!state) return;
    if (state.spinTimer) clearTimeout(state.spinTimer);
    var btn = state.btn;
    btn.classList.remove('is-ix-submitting', 'is-ix-spinning');
    // doneLabel is applied only on a VERIFIED success. On failure or
    // unverified the original label returns, so the operator can
    // retry without hunting for a reset.
    btn.textContent = doneLabel || state.label;
    btn.disabled = keepDisabled ? true : state.wasDisabled;
  }

  // ══════════════════════════════════════════════════════════
  //  submit
  // ══════════════════════════════════════════════════════════

  function encodeForm(obj) {
    var p = new URLSearchParams();
    Object.keys(obj || {}).forEach(function (k) {
      var v = obj[k];
      if (v === null || v === undefined) v = '';
      if (typeof v === 'boolean') v = v ? '1' : '0';   // Make sentinel
      p.append(k, String(v));
    });
    return p;
  }

  function submit(opts) {
    opts = opts || {};

    if (!opts.url) {
      throw new TypeError('[IxToast] submit() needs a url.');
    }
    if (!opts.sent || !Object.keys(opts.sent).length) {
      // Hard failure, on purpose. A submit with nothing to verify is
      // exactly the shape of the Promote-to-Next bug. Fail in front
      // of a developer, not an operator.
      throw new TypeError(
        '[IxToast] submit() requires a non-empty `sent` map naming the ' +
        'fields the scenario must echo back. If the scenario does not ' +
        'echo yet, fix the Webhook Response first — do not toast success.'
      );
    }

    var method = (opts.method || 'POST').toUpperCase();
    var body = opts.body || opts.sent;
    var msgs = opts.messages || {};
    var btnState = beginButton(opts.button, opts.busyLabel);
    var busyToast = opts.busyToast ? render(opts.busyToast, 'busy', {}) : null;

    var url = opts.url;
    var init = { method: method, credentials: opts.credentials || 'omit' };

    if (method === 'GET' || method === 'HEAD') {
      var qs = encodeForm(body).toString();
      if (qs) url += (url.indexOf('?') === -1 ? '?' : '&') + qs;
    } else if (opts.json) {
      init.headers = { 'Content-Type': 'application/json' };
      init.body = JSON.stringify(body);
    } else {
      // Default. Make webhooks are wired for form encoding on this
      // platform, and form bodies dodge the CORS preflight that a
      // JSON content-type triggers.
      init.body = encodeForm(body);
    }

    if (opts.mode) init.mode = opts.mode;

    var ctrl = null;
    var timeoutTimer = null;
    if (typeof AbortController !== 'undefined') {
      ctrl = new AbortController();
      init.signal = ctrl.signal;
      timeoutTimer = setTimeout(function () {
        try { ctrl.abort(); } catch (e) {}
      }, opts.timeoutMs || DEFAULT_TIMEOUT_MS);
    }

    function finish(result) {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (busyToast) busyToast.close();

      var verified = result.status === 'ok';
      endButton(btnState, verified ? opts.doneLabel : null, verified && opts.lockOnSuccess);

      if (opts.silent !== true) {
        if (verified) {
          render(msgs.success || opts.success || 'Saved', 'ok', {});
        } else if (result.status === 'failed') {
          render(
            msgs.failure || opts.failure || 'Not saved',
            'err',
            {
              detail: result.reason + (result.mismatched.length ? ' —' : ''),
              fields: result.mismatched.map(function (m) { return m.field; })
            }
          );
        } else {
          render(
            msgs.unverified || opts.unverified || 'Sent, but not confirmed',
            'unverified',
            {
              detail: result.reason + '. Check before relying on it.',
              fields: result.missing
            }
          );
        }
      }

      if (verified && typeof opts.onVerified === 'function') {
        try { opts.onVerified(result); } catch (e) { console.error('[IxToast] onVerified', e); }
      }
      if (!verified && typeof opts.onFailed === 'function') {
        try { opts.onFailed(result); } catch (e) { console.error('[IxToast] onFailed', e); }
      }

      if (!verified) {
        console.warn('[IxToast] unverified write', {
          url: opts.url, status: result.status, reason: result.reason,
          httpStatus: result.httpStatus, raw: result.raw
        });
      }
      return result;
    }

    return fetch(url, init).then(function (res) {
      // Opaque response — no-cors. Nothing readable, so nothing
      // provable. See the header comment for the Make-side fix.
      if (res.type === 'opaque') {
        return finish({
          status: 'unverified',
          httpStatus: 0,
          raw: null,
          echo: null,
          matched: [],
          mismatched: [],
          missing: Object.keys(opts.sent),
          reason: 'the request used no-cors so the response cannot be read'
        });
      }

      return res.text().then(function (text) {
        if (!res.ok) {
          return finish({
            status: 'failed',
            httpStatus: res.status,
            raw: text,
            echo: null,
            matched: [],
            mismatched: [],
            missing: Object.keys(opts.sent),
            reason: 'HTTP ' + res.status + (text ? ' — ' + text.slice(0, 160) : '')
          });
        }

        var parsed = null;
        try { parsed = JSON.parse(text); } catch (e) { parsed = null; }

        // Make's bare "Accepted" acknowledgement lands here: HTTP 200,
        // non-JSON body, nothing written yet. Amber, not green.
        var v = verify(opts.sent, parsed, { echoPath: opts.echoPath });
        v.httpStatus = res.status;
        v.raw = text;
        return finish(v);
      });
    }).catch(function (err) {
      var aborted = err && (err.name === 'AbortError');
      return finish({
        status: aborted ? 'unverified' : 'failed',
        httpStatus: 0,
        raw: null,
        echo: null,
        matched: [],
        mismatched: [],
        missing: Object.keys(opts.sent),
        reason: aborted
          ? 'the request timed out before a response came back'
          : 'the request could not be sent — ' + (err && err.message ? err.message : 'network error')
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  //  Public surface
  // ══════════════════════════════════════════════════════════

  window.IxToast = window.IxToast || {};

  // show(msg, variant, opts) — variant: 'ok' | 'err' | 'unverified'
  // | 'info' | 'busy'. Use 'ok' only for client-side outcomes with
  // no server write behind them.
  window.IxToast.show = function (msg, variant, opts) {
    return render(msg, variant, opts);
  };

  window.IxToast.verify = verify;
  window.IxToast.submit = submit;
  window.IxToast.normalize = norm;

  // Convenience wrapper for the common "one button, one write"
  // shape. buildOpts() runs on click and returns a submit() opts
  // object, so the payload is read at click time rather than at
  // wire time. Mirrors IxRefresh.wire.
  window.IxToast.wire = function (btn, buildOpts) {
    if (!btn || btn.__ixToastWired) return;
    btn.__ixToastWired = true;
    btn.addEventListener('click', function (ev) {
      if (btn.disabled) return;
      var o;
      try { o = buildOpts(ev, btn); } catch (e) {
        console.error('[IxToast] buildOpts threw', e);
        return;
      }
      if (!o) return;                    // buildOpts may veto
      if (!o.button) o.button = btn;
      submit(o);
    });
  };

  window.IxToast.dismissAll = function () {
    var el = document.getElementById(RAIL_ID);
    if (!el) return;
    Array.prototype.slice.call(el.children).forEach(dismiss);
  };
})();
