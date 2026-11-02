// ps-login-v1.0.0.js
// ============================================================
// INBXIFY · Publisher Portal · the /portal-login page
//
// v1.0.0 (2 Nov 2026, Publisher Portal S2) — FIRST BUILD.
//   Passwordless login for publisher members, on our own form
//   (ps-login-embed-v1.0.0.html), styled by ps-login-v1.0.0.css.
//
//   WHY THE MEMBERSTACK DOM API AND NOT DATA ATTRIBUTES. The attribute
//   form (data-ms-form="passwordless-login") decides on its own when to
//   show step 2 and what errors say. Driving the same two Memberstack
//   calls from this file lets the page show the address the code went
//   to, say plainly why a code failed, offer "send a new code", and show
//   progress on every submit (standing rule). Same Memberstack feature,
//   same emails, same security.
//     1. $memberstackDom.sendMemberLoginPasswordlessEmail({ email })
//     2. $memberstackDom.loginMemberPasswordless({ passwordlessToken, email })
//
//   WHERE A MEMBER GOES AFTER LOGIN
//     a. The member's own Memberstack login redirect, if it is a
//        /publisher/ page (Add member in Quill sets it).
//     b. Else ix-members /whoami → the first publisher that lists them.
//     c. Else a plain message: logged in, but no portal is linked.
//   Someone already logged in who opens this page is sent on the same way.
//
//   The page must not be gated. Memberstack's own script must be on the
//   site (it is: site-wide head).
//
// HARDCODING (provisional ids, for the tracker)
//   HC-P-PP2-7  The ix-members URL, on the Embed as data-members-url.
//   HC-P-PP2-8  The page words, in the Embed and in MSG below.
//   HC-P-PP2-9  PORTAL_PREFIX "/publisher/" — same value as the
//               ix-members IX_CONFIG portalPath (HC-P-PP2-4).
// ============================================================
(function () {
  'use strict';
  var VERSION = '1.0.0';
  var PORTAL_PREFIX = '/publisher/';                                  // HC-P-PP2-9
  var MSG = {                                                          // HC-P-PP2-8
    emailBad: 'Enter a full email address, like you@yourmagazine.com.',
    sendFail: 'We could not send a code to that address. Check it, or ask your inbxify contact.',
    codeBad: 'Enter the 6 digits from the email.',
    codeFail: 'That code did not work or has expired.',
    resent: 'A new code is on its way.',
    noPortal: 'You are logged in, but no publisher portal is linked to this login. Ask your inbxify contact.',
    noMs: 'Login is not available right now. Refresh the page, and if it keeps happening, tell your inbxify contact.',
    sending: 'Sending your code…', checking: 'Checking…'
  };

  var root = document.getElementById('ps-login');
  if (!root) return;
  var $ = function (sel) { return root.querySelector(sel); };
  var stepEmail = $('[data-ps-step="email"]'), stepCode = $('[data-ps-step="code"]');
  var emailForm = $('#ps-login-email-form'), codeForm = $('#ps-login-code-form');
  var emailIn = $('#ps-login-email'), codeIn = $('#ps-login-code');
  var emailErr = $('#ps-login-email-err'), codeErr = $('#ps-login-code-err');
  var sentTo = $('#ps-login-sent-to'), note = $('#ps-login-note');
  var membersUrl = (root.getAttribute('data-members-url') || '').replace(/\/+$/, '');
  var email = '';

  function ms() {                                                      // wait for Memberstack's script
    return new Promise(function (resolve, reject) {
      var t0 = Date.now();
      (function poll() {
        if (window.$memberstackDom) return resolve(window.$memberstackDom);
        if (Date.now() - t0 > 10000) return reject(new Error('no-memberstack'));
        setTimeout(poll, 100);
      })();
    });
  }
  function busy(form, on, label) {
    var b = form.querySelector('button[type="submit"]');
    if (!b) return;
    if (on) { b.dataset.label = b.textContent; b.textContent = label; b.setAttribute('aria-busy', 'true'); b.disabled = true; }
    else { b.textContent = b.dataset.label || b.textContent; b.removeAttribute('aria-busy'); b.disabled = false; }
  }
  function fail(input, out, text, linkResend) {
    input.setAttribute('aria-invalid', 'true');
    out.textContent = text;
    if (linkResend) {
      out.appendChild(document.createTextNode(' '));
      var a = document.createElement('button'); a.type = 'button'; a.className = 'ps-login-linkbtn'; a.textContent = 'Send a new code';
      a.style.color = 'inherit'; a.style.fontWeight = '600'; a.addEventListener('click', resend); out.appendChild(a);
    }
  }
  function clear(input, out) { input.removeAttribute('aria-invalid'); out.textContent = ''; }
  function show(step) {
    stepEmail.hidden = step !== 'email'; stepCode.hidden = step !== 'code';
    (step === 'email' ? emailIn : codeIn).focus();
  }

  async function goOn(member) {
    var r = member && member.loginRedirect ? String(member.loginRedirect) : '';
    if (r.indexOf(PORTAL_PREFIX) === 0) { location.assign(r); return; }
    try {
      var dom = await ms(), token = dom.getMemberCookie ? await dom.getMemberCookie() : null;
      if (token && membersUrl) {
        var res = await fetch(membersUrl + '/whoami', { headers: { Authorization: 'Bearer ' + token } });
        var j = await res.json().catch(function () { return null; });
        if (j && j.ok && j.publishers && j.publishers.length) { location.assign(j.publishers[0].portalPath); return; }
      }
    } catch (e) { /* falls through to the message */ }
    show('code'); fail(codeIn, codeErr, MSG.noPortal, false);
  }

  async function sendCode(isResend) {
    var dom = await ms();
    await dom.sendMemberLoginPasswordlessEmail({ email: email });
    if (isResend) note.textContent = MSG.resent;
  }
  async function resend() {
    note.textContent = ''; clear(codeIn, codeErr);
    try { await sendCode(true); } catch (e) { fail(codeIn, codeErr, MSG.sendFail, false); }
  }

  emailForm.addEventListener('submit', async function (ev) {
    ev.preventDefault(); clear(emailIn, emailErr);
    email = String(emailIn.value || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { fail(emailIn, emailErr, MSG.emailBad, false); return; }
    busy(emailForm, true, MSG.sending);
    try { await sendCode(false); sentTo.textContent = email; codeIn.value = ''; note.textContent = ''; clear(codeIn, codeErr); show('code'); }
    catch (e) { fail(emailIn, emailErr, e && e.message === 'no-memberstack' ? MSG.noMs : MSG.sendFail, false); }
    finally { busy(emailForm, false); }
  });

  codeIn.addEventListener('input', function () { codeIn.value = codeIn.value.replace(/\D/g, '').slice(0, 6); if (codeIn.value.length === 6) clear(codeIn, codeErr); });

  codeForm.addEventListener('submit', async function (ev) {
    ev.preventDefault(); clear(codeIn, codeErr); note.textContent = '';
    var code = String(codeIn.value || '').replace(/\D/g, '');
    if (code.length !== 6) { fail(codeIn, codeErr, MSG.codeBad, false); return; }
    busy(codeForm, true, MSG.checking);
    try {
      var dom = await ms();
      var r = await dom.loginMemberPasswordless({ passwordlessToken: code, email: email });
      await goOn(r && r.data ? r.data.member : null);
    } catch (e) { fail(codeIn, codeErr, e && e.message === 'no-memberstack' ? MSG.noMs : MSG.codeFail, !(e && e.message === 'no-memberstack')); }
    finally { busy(codeForm, false); }
  });

  root.querySelector('[data-ps-resend]').addEventListener('click', resend);
  root.querySelector('[data-ps-back]').addEventListener('click', function () { clear(emailIn, emailErr); show('email'); });

  // already logged in? send them on.
  ms().then(function (dom) { return dom.getCurrentMember(); })
      .then(function (r) { if (r && r.data) goOn(r.data); })
      .catch(function () {});
  root.setAttribute('data-ps-version', VERSION);
})();
