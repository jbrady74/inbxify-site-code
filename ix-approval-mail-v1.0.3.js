/* ix-approval-mail-v1.0.3.js
   INBXIFY ix series — THE APPROVAL EMAIL POP-UP (Ad Maker Build S6, B2, 27 Nov 2026)
   Companion CSS: ix-approval-mail-v1.0.3.css.
   v1.0.3 (27 Nov 2026, checked in Chrome): the Webflow site CSS sets every img to 200 px wide, so the ad picture showed
     at 200 px. Each picture in the email now takes the width ix-sales gives it (536 or 240). The subject row lines up
     with the email card's edges, and the dim margin above the pop-up is 24 px.
   v1.0.2 (27 Nov 2026, checked in Chrome on the T-A page): ta-page-head-v1.4.css forces every text box and textarea to
     Tenor Sans 12px with !important, so the message showed in 12px Tenor Sans, not the email's 16px Helvetica. The
     email's paragraph style is now set on the message box with !important, and the CSS holds its boxes the same way.
   v1.0.1 (27 Nov 2026): the message box takes the email's own paragraph style from ix-sales v1.3.21 (font, size, colour),
   so the words are edited in the type the publisher reads them in. (v1.0.0 and v1.0.1 were on the preview branch only.)

   Rulings (Jeff, 24 Nov and 27 Nov, on the B2 mockup):
   · The approval email opens in a large centred pop-up (not full screen) that shows the whole email without
     scrolling a small box, so he reads it before it goes.
   · One pop-up for Ad Maker's Check (Save with "Send for approval" picked) and the board card's "Send for approval".
   · It shows the email as the publisher gets it: the ad picture, the "Review and decide" button and the "works
     until" line are shown and fixed; only the subject and the message can be changed, in place.
   · A test goes to Jeff as the very same email ("Hi Doug" included); seeing and editing it here is enough.

   The email's layout is NOT drawn here. ix-sales v1.3.21+ answers a preview with `frame`, the email's body HTML from
   the same code that builds the email it sends, with two marks: <div data-ix-mail="message"> (the editable message
   goes there) and data-ix-mail="picture" on each picture (an empty src is filled by opts.picture(shape)).

   USE
     IxApprovalMail.open({
       sub:     'Banner · AA ChemDry of North Jersey · …',      // the line beside the title
       load:    function () { return Promise<ix-sales preview answer> },
       picture: function (shape) { return url },               // optional: fills a picture ix-sales left empty
       go:      'Save and send',                                 // the Send button's words
       bar:     function (toName) { return 'Save writes …, then emails ' + toName + '.' },
       send:    function ({ to, subject?, message? }) { return Promise<{ head, line }> or null },
                // subject/message are only passed when changed. A Promise keeps the pop-up open (Sending…, then the
                // done screen with head and line, or the error in the bar). null closes the pop-up at once (Check:
                // its own Save screen shows the steps).
       onClose: function (sent) {}                               // optional
     })  →  { close() }
   HARDCODING: HC-P-AMS6-2 the pop-up's words (W below) and its 1040 px width.
*/
(function () {
  'use strict';
  var FILE = 'ix-approval-mail-v1.0.3.js', VERSION = '1.0.3';
  var W = {   // HC-P-AMS6-2
    title: 'The approval email', sendTo: 'Send to', test: 'Me, as a test', noContact: 'The PUBLISHERS record has no Contact Name or Business Email, so only a test can be sent.',
    testNote: 'You get {first}’s email word for word, “Hi {first}” included. Approving from it counts as a real approval.',
    seeHead: 'What you see', see1: 'This is the email as it lands. Click the subject or the words to change them; a changed part gets the gold edge.',
    see2: 'The picture, the button and the date line are added by inbxify and cannot be changed here.',
    revert: 'Put back the standard words', subject: 'Subject', loading: 'Reading the email…',
    fail: 'The email could not be read ({msg}). Send still sends the standard email.', need: 'The subject and the message cannot be empty.',
    cancel: 'Cancel', going: 'Sending…', done: 'Done', close: 'Close'
  };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fill(t, o) { return String(t).replace(/\{(\w+)\}/g, function (_, k) { return o[k] == null ? '' : o[k]; }); }

  function open(opts) {
    opts = opts || {};
    var S = { loading: true, err: '', std: null, subject: '', message: '', to: 'publisher', pub: null, test: '', busy: false, barErr: '', done: null };
    var ov = document.createElement('div');
    ov.className = 'ix-overlay ixam-ov';
    ov.setAttribute('data-ix-file', FILE);
    document.body.appendChild(ov);
    var prevOverflow = document.documentElement.style.overflow;
    function onKey(e) { if (e.key === 'Escape' && !S.busy) close(); }
    document.addEventListener('keydown', onKey);
    var closed = false;
    function close() {
      if (closed) return; closed = true;
      document.removeEventListener('keydown', onKey);
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      document.documentElement.style.overflow = prevOverflow;
      if (opts.onClose) try { opts.onClose(!!S.done); } catch (e) { }
    }
    function toName() { return S.to === 'test' ? 'you' : ((S.pub && S.pub.name) || 'the publisher'); }
    function changedSub() { return S.std && S.subject !== S.std.subject; }
    function changedMsg() { return S.std && S.message !== S.std.message; }

    function frameHTML() {
      var f = S.frame || '';
      return f;
    }
    function render() {
      var h = '<div class="ixam" role="dialog" aria-modal="true" aria-labelledby="ixam-t">' +
        '<div class="ixam-head"><h2 id="ixam-t">' + esc(W.title) + '</h2><span class="ixam-sub">' + esc(opts.sub || '') + '</span><span class="ixam-sp"></span>' +
        '<button type="button" class="ixam-x" data-ixam="close" aria-label="' + esc(W.close) + '"' + (S.busy ? ' disabled' : '') + '><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 3l12 12M15 3L3 15" stroke="currentColor" stroke-width="1.8" fill="none"/></svg></button></div>';
      if (S.done) {
        h += '<div class="ixam-done"><svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="20" fill="#0F5C3F"/><path d="M13 22l6 6 12-12" stroke="#fff" stroke-width="3" fill="none"/></svg>' +
          '<b>' + esc(S.done.head || '') + '</b>' + (S.done.line ? '<span>' + esc(S.done.line) + '</span>' : '') +
          '<button type="button" class="ixam-btn ixam-go" data-ixam="close">' + esc(W.done) + '</button></div></div>';
        ov.innerHTML = h; focusFirst('[data-ixam="close"].ixam-go'); return;
      }
      var first = S.pub && S.pub.name ? String(S.pub.name).split(' ')[0] : 'the publisher';
      h += '<div class="ixam-body"><div class="ixam-side">';
      h += '<div class="ixam-grp"><span class="ixam-cap">' + esc(W.sendTo) + '</span>';
      h += '<label class="ixam-r"><input type="radio" name="ixam-to" value="publisher"' + (S.to === 'publisher' ? ' checked' : '') + (S.pub ? '' : ' disabled') + (S.busy ? ' disabled' : '') + '><span>' +
        (S.pub ? '<b>' + esc(S.pub.name) + '</b><i>' + esc(S.pub.email) + '</i>' : '<i>' + esc(S.loading ? W.loading : W.noContact) + '</i>') + '</span></label>';
      h += '<label class="ixam-r"><input type="radio" name="ixam-to" value="test"' + (S.to === 'test' ? ' checked' : '') + (S.busy ? ' disabled' : '') + '><span><b>' + esc(W.test) + '</b><i>' + esc(S.test || '') + '</i></span></label>';
      if (S.to === 'test' && S.pub) h += '<div class="ixam-note">' + esc(fill(W.testNote, { first: first })) + '</div>';
      h += '</div><div class="ixam-grp ixam-see"><span class="ixam-cap">' + esc(W.seeHead) + '</span><span>' + esc(W.see1) + '</span><span>' + esc(W.see2) + '</span>' +
        (changedSub() || changedMsg() ? '<button type="button" class="ixam-link" data-ixam="revert"' + (S.busy ? ' disabled' : '') + '>' + esc(W.revert) + '</button>' : '') + '</div></div>';
      h += '<div class="ixam-mail">';
      if (S.loading) h += '<div class="ixam-wait">' + esc(W.loading) + '</div>';
      else if (S.err) h += '<div class="ixam-wait">' + esc(S.err) + '</div>';
      else h += '<div class="ixam-subj"><label class="ixam-cap" for="ixam-subj">' + esc(W.subject) + '</label><input type="text" id="ixam-subj" class="ixam-in' + (changedSub() ? ' chg' : '') + '" maxlength="200" value="' + esc(S.subject) + '"' + (S.busy ? ' disabled' : '') + '></div>' +
        '<div class="ixam-frame">' + frameHTML() + '</div>';
      h += '</div></div>';
      var canGo = !S.loading && !S.busy && (S.err || (String(S.subject).trim() && String(S.message).trim()));
      var barTxt = S.barErr || (!S.loading && !S.err && !(String(S.subject).trim() && String(S.message).trim()) ? W.need : (opts.bar ? opts.bar(toName()) : ''));
      h += '<div class="ixam-bar"><span class="ixam-bmsg' + (S.barErr ? ' bad' : '') + '">' + esc(barTxt) + '</span><span class="ixam-sp"></span>' +
        '<button type="button" class="ixam-btn ixam-cancel" data-ixam="close"' + (S.busy ? ' disabled' : '') + '>' + esc(W.cancel) + '</button>' +
        '<button type="button" class="ixam-btn ixam-go" data-ixam="send"' + (canGo ? '' : ' disabled') + '>' + esc(S.busy ? W.going : (opts.go || 'Send email')) + '</button></div></div>';
      ov.innerHTML = h;
      if (!S.loading && !S.err) mountMessage();
    }
    function mountMessage() {
      var spot = ov.querySelector('[data-ix-mail="message"]');
      if (spot) {
        var ta = document.createElement('textarea');
        ta.className = 'ixam-in ixam-msg' + (changedMsg() ? ' chg' : '');
        ta.id = 'ixam-msg'; ta.setAttribute('aria-label', 'Message'); ta.maxLength = 4000; ta.value = S.message; ta.disabled = S.busy;
        (spot.getAttribute('style') || '').split(';').forEach(function (d) {   // the email's own paragraph type, from ix-sales; !important beats the T-A page's textarea rule
          var i = d.indexOf(':'); if (i < 0) return; var k = d.slice(0, i).trim(), v = d.slice(i + 1).trim();
          if (k && v && !/^margin/.test(k)) ta.style.setProperty(k, v, 'important');
        });
        spot.parentNode.replaceChild(ta, spot); grow(ta);
      }
      Array.prototype.forEach.call(ov.querySelectorAll('img[data-ix-mail="picture"]'), function (img) {
        if (!img.getAttribute('src') && opts.picture) { var u = opts.picture(img.getAttribute('data-shape')); if (u) img.setAttribute('src', u); }
        var w = img.getAttribute('width'); if (w) img.style.setProperty('width', w + 'px', 'important');   // v1.0.3: the site CSS sets img { width: 200px }
      });
      Array.prototype.forEach.call(ov.querySelectorAll('.ixam-frame a'), function (a) { a.removeAttribute('href'); a.setAttribute('tabindex', '-1'); });
    }
    function grow(ta) { ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px'; }
    function focusFirst(sel) { var el = ov.querySelector(sel); if (el && el.focus) el.focus(); }

    ov.addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === 'ixam-subj') { S.subject = t.value; t.classList.toggle('chg', changedSub()); }
      else if (t.id === 'ixam-msg') { S.message = t.value; t.classList.toggle('chg', changedMsg()); grow(t); }
      else return;
      S.barErr = '';
      var go = ov.querySelector('[data-ixam="send"]'), ok = String(S.subject).trim() && String(S.message).trim();
      if (go) go.disabled = !ok;
      var bm = ov.querySelector('.ixam-bmsg'); if (bm) { bm.className = 'ixam-bmsg'; bm.textContent = ok ? (opts.bar ? opts.bar(toName()) : '') : W.need; }
      var see = ov.querySelector('.ixam-see'), rv = ov.querySelector('[data-ixam="revert"]');
      if (see && !rv && (changedSub() || changedMsg())) { var b = document.createElement('button'); b.type = 'button'; b.className = 'ixam-link'; b.setAttribute('data-ixam', 'revert'); b.textContent = W.revert; see.appendChild(b); }
      if (rv && !(changedSub() || changedMsg())) rv.parentNode.removeChild(rv);
    });
    ov.addEventListener('change', function (e) { if (e.target.name === 'ixam-to') { S.to = e.target.value; S.barErr = ''; render(); } });
    ov.addEventListener('click', function (e) {
      if (e.target === ov && !S.busy) { return; }   // a click on the dim page does nothing: Cancel or ✕ closes
      var b = e.target.closest && e.target.closest('[data-ixam]'); if (!b || b.disabled) return;
      var k = b.getAttribute('data-ixam');
      if (k === 'close') { close(); return; }
      if (k === 'revert') { S.subject = S.std.subject; S.message = S.std.message; render(); return; }
      if (k === 'send') doSend();
    });
    function doSend() {
      if (S.busy) return;
      var words = { to: S.to };
      if (S.std) { if (changedSub()) words.subject = S.subject; if (changedMsg()) words.message = S.message; }
      var p = opts.send ? opts.send(words) : null;
      if (!p || typeof p.then !== 'function') { S.done = { head: '' }; close(); return; }
      S.busy = true; S.barErr = ''; render();
      p.then(function (d) { S.busy = false; S.done = d || { head: '' }; render(); },
        function (e) { S.busy = false; S.barErr = (e && e.message) || String(e); render(); });
    }

    render();
    document.documentElement.style.overflow = 'hidden';
    Promise.resolve().then(function () { return opts.load ? opts.load() : null; }).then(function (j) {
      if (closed) return;
      S.loading = false;
      if (!j) { S.err = fill(W.fail, { msg: 'no answer' }); render(); return; }
      S.std = { subject: j.subject || '', message: j.message || '' }; S.subject = S.std.subject; S.message = S.std.message;
      S.pub = j.to && j.to.publisher ? j.to.publisher : null; S.test = (j.to && j.to.test) || ''; S.to = S.pub ? 'publisher' : 'test';
      S.frame = j.frame || '';
      if (!S.frame) S.err = fill(W.fail, { msg: 'ix-sales is older than v1.3.21 and sent no layout' });
      render(); focusFirst('#ixam-msg');
    }, function (e) { if (closed) return; S.loading = false; S.err = fill(W.fail, { msg: (e && e.message) || String(e) }); render(); });
    return { close: close };
  }
  window.IxApprovalMail = { open: open, version: VERSION, file: FILE };
})();
