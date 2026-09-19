/* ============================================================
   ipp-publish-v1.0.js — Publish view for the IPP
   Companion stylesheet: ipp-publish-v1.0.css

   WHAT IT DOES
     Renders the Publish view, which the shell has declared since
     v1.0 and nothing has ever filled. One action: compile the
     issue. It opens 206's webhook in a new tab, so the operator
     sees the render come back rather than a button claiming
     success it cannot verify (no-cors posts return nothing —
     TOAST-TRUTH).

   WHAT IT READS
     Newsletter id   [data-nl-id]      on .pubplan-slot-wrapper
     PubPlan id      [data-pubplan-id] on .pubplan-slot-wrapper
     Webhook         window.PP_WEBHOOKS.compile
     Issue label     [data-issue-name] if present, else the id

   NOTHING IS HARDCODED. With no PP_WEBHOOKS.compile the view says
   so and the button stays disabled, rather than guessing a URL.

   WHAT HAPPENS AFTER THE CLICK, for the operator's information:
     206 compiles, writes both renders to the NEWSLETTER item,
     publishes it, returns the email render to the new tab, commits
     the email HTML to the private archive repo, and emails on a
     failed commit.
   ============================================================ */
(function () {
  'use strict';

  var MOUNTED = 'data-publish-mounted';

  function wrapper() {
    return document.querySelector('.pubplan-slot-wrapper[data-nl-id]') ||
           document.querySelector('.pubplan-slot-wrapper[data-pubplan-id]');
  }
  function attr(name) {
    var w = wrapper();
    return (w && w.getAttribute(name)) || '';
  }
  function ids() {
    var t = (window.IPP && IPP.tenant) ? IPP.tenant() : {};
    return {
      nlId:      attr('data-nl-id'),
      pubplanId: t.pubplanId || attr('data-pubplan-id'),
      issue:     attr('data-issue-name')
    };
  }
  function compileUrl() {
    var base = (window.PP_WEBHOOKS || {}).compile || '';
    if (!base) return '';
    var i = ids();
    if (!i.nlId || !i.pubplanId) return '';
    return base +
      (base.indexOf('?') < 0 ? '?' : '&') +
      'contextNlId=' + encodeURIComponent(i.nlId) +
      '&parentId='   + encodeURIComponent(i.pubplanId);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  function render() {
    var i = ids();
    var url = compileUrl();
    var blocked = [];
    if (!(window.PP_WEBHOOKS || {}).compile) blocked.push('the compile webhook is not set on this page (PP_WEBHOOKS.compile)');
    if (!i.nlId)      blocked.push('this plan has no newsletter attached');
    if (!i.pubplanId) blocked.push('the publication plan id is missing from the page');

    var head =
      '<div class="ipp-pub-head">' +
        '<p class="ipp-pub-kicker">Final step</p>' +
        '<h2 class="ipp-pub-title">Compile this issue</h2>' +
        '<p class="ipp-pub-sub">Builds the email and the web page from the blocks in this plan. ' +
        'Nothing is sent to readers.</p>' +
      '</div>';

    var body;
    if (blocked.length) {
      body =
        '<div class="ipp-pub-card ipp-pub-blocked">' +
          '<p class="ipp-pub-blocked-head">Cannot compile yet</p>' +
          '<ul class="ipp-pub-list">' +
            blocked.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') +
          '</ul>' +
        '</div>';
    } else {
      body =
        '<div class="ipp-pub-card">' +
          '<dl class="ipp-pub-facts">' +
            '<dt>Issue</dt><dd>' + esc(i.issue || i.nlId) + '</dd>' +
            '<dt>Newsletter</dt><dd class="mono">' + esc(i.nlId) + '</dd>' +
            '<dt>Plan</dt><dd class="mono">' + esc(i.pubplanId) + '</dd>' +
          '</dl>' +
          '<button type="button" class="ipp-pub-go" data-publish-go>Compile and preview</button>' +
          '<p class="ipp-pub-note">Opens in a new tab and shows the email render when it finishes. ' +
          'A copy is saved to the archive automatically; you are emailed only if that fails.</p>' +
        '</div>';
    }

    return head + body;
  }

  function mount() {
    var canvas = document.querySelector('.ipp-view[data-view="publish"] .ipp-canvas');
    if (!canvas) return false;
    if (canvas.getAttribute(MOUNTED) === '1') return true;
    canvas.innerHTML = render();
    canvas.setAttribute(MOUNTED, '1');

    canvas.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-publish-go]');
      if (!btn) return;
      var url = compileUrl();
      if (!url) return;
      window.open(url, '_blank', 'noopener');
      btn.textContent = 'Compiling in the new tab\u2026';
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = 'Compile again';
        btn.disabled = false;
      }, 4000);
    });
    return true;
  }

  // re-render when the view is shown, so ids that arrive late are picked up
  document.addEventListener('ipp:view', function (e) {
    if (!e.detail || e.detail.view !== 'publish') return;
    var canvas = document.querySelector('.ipp-view[data-view="publish"] .ipp-canvas');
    if (canvas && canvas.getAttribute(MOUNTED) === '1') canvas.innerHTML = render();
    else mount();
  });
  document.addEventListener('ipp:ready', mount);
  if (document.querySelector('[data-ipp-root]')) mount();
})();
