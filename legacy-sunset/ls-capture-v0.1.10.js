/* ls-capture-v0.1.10.js */
/* ============================================================
   ls-capture-v0.1.10.js — Legacy Sunset capture, compare and save
   Legacy Sunset S1 (15 Nov 2026). Deleted with the series.

   v0.1.10 (15 Nov 2026) — EMPTY CARDS. WLN-118B would not save: its empty
     article cards carry Webflow's grey placeholder picture
     (/plugins/Basic/assets/placeholder…svg), which no one can download.
     · The capture now leaves Webflow placeholder pictures out (counted).
     · "Remove blocks" lets Jeff take blocks out of the capture before
       Save (Jeff, 15 Nov: some old issues have empty articles he wants
       gone). Turn it on, click anything in the capture; "Larger" widens the
       pick to the block around it; "Remove" takes it out; "Undo remove"
       puts the last one back. The removal is part of what Save stores.
       Capture again starts over from the live page.
     · After Undo on the Worker side, the panel no longer claims the old
       layout is missing while Webflow is still updating the page.

   v0.1.9 (15 Nov 2026) — FRANCHISE SPONSOR LABELS; PAGE NOT YET UPDATED.
     · WLN-122B showed how the old layout marks a franchise sponsor: a text
       label "SPONSORED by: Top Level Soccer" (.paid-attribution-label) in
       the section header next to the franchise art (.ts-section-img). It is
       now tagged data-ls-ad="sponsor", with data-ls-art = the franchise
       art's Webflow file name (e.g. 69500335bd35dad16f2c957a_WYCKOFF-
       SPORTS.png) so the current-week fill can tell which franchise it is.
       WLN ran no paid articles on the old layout, so every shown label of
       that class is a franchise sponsor.
     · After Undo, Webflow can keep serving the saved page for a minute or
       so. The panel now says so (instead of "the old layout is not on this
       page") when uses-legacy is back on but the page still shows a
       capture.

   v0.1.8 (15 Nov 2026) — AD SLOTS TAGGED. Jeff ruled (15 Nov) that on a
     past issue, old or new path, banner ads, franchise sponsors, house ads
     and the splash ad show the CURRENT week's set, while an article's paid
     ad and the text ads (The Find topic and its businesses) keep the
     issue's own. The capture now tags the slots that change, so the site
     ad script can fill them with the current set when the page loads:
       data-ls-ad="banner"   each banner (a.ad-only-lb), in page order;
                             data-ls-slot="lead" on the Lead's, else 1, 2, …
       data-ls-ad="sponsor"  each shown element whose class names a sponsor
                             (e.g. ev-sponsor-upper), data-ls-slot 1, 2, …
     The original ad stays in the slot until a fill replaces it. Paid
     article ads and text ads are not tagged. House ads and the splash ad
     are not inside the old layout (they sit on the template / splash page).
     The panel counts the tagged slots. HC-P-LS1-8: the old layout's
     banner and sponsor class names, typed here (old WLN template only).

   v0.1.7 (15 Nov 2026) — LIST TEXT SIZE. The newsletter names in the list
     took the page's large serif link style. Links and buttons in the panel
     now keep the panel's own font and size like the rest of its text.

   v0.1.6 (15 Nov 2026) — SAVED PAGES. On a page already saved (WLN-103),
     the panel stopped at "The old layout (data-legacy) is not on this
     page" before looking the newsletter up, so it never said "Already
     saved". Now it always looks the newsletter up; the page check only
     matters when there is something to capture (uses-legacy on).

   v0.1.5 (15 Nov 2026) — CSS PICTURE ADDRESSES WITH BRACKETS. WLN-103:
     "…Ramapo%20College%20campus%20(1 … (403)". A background picture whose
     file name holds brackets ("campus (1).jpg") was cut at its ")" when the
     capture read url( … ), in three places (inline backgrounds, copied
     style rules, Webflow fonts). The cut address went to the Worker and
     the copied rule was broken too. All three now read url("…"), url('…')
     and url(…) whole (CSS_URL). Re-capture any page captured with v0.1.4
     or older before saving it. Needs ix-legacy-sunset v0.1.3 (unchanged).

   v0.1.4 (15 Nov 2026) — PICTURES THE WORKER CANNOT FETCH. Needs
     ix-legacy-sunset v0.1.3. When Save answers needBytes (the Worker could
     not download some Webflow-hosted pictures), the page downloads those
     pictures itself, since the browser is already showing them, and sends
     Save again with their bytes. Status messages wrap long addresses
     instead of running off the panel. Nothing else changes.

   v0.1.3 (15 Nov 2026) — THE LIST. After WLN-116B passed (first save),
     Jeff needs the other old newsletters. "All old newsletters" under the
     panel title opens the list from ix-legacy-sunset /inventory: counts,
     then one row per newsletter (to do first), each with its status and a
     link to its page. "Back" returns to this page's panel. Needs
     ix-legacy-sunset v0.1.2 (unchanged). Nothing else changes.

   v0.1.2 (15 Nov 2026) — CMS FIELD LIST IN STEPS. Needs ix-legacy-sunset
     v0.1.2. "CMS fields shown" stayed at "…" on WLN-116B: the one long
     request never answered. The panel now calls /fields again and again
     (each call about 20 seconds) and shows "reading N items" until the
     list is done. On a newsletter already saved without a list, the panel
     starts the list on its own from the saved Web Render HTML. A failed
     list shows "failed" with the reason under the list. Capture, compare,
     save and the phone view are unchanged from v0.1.1.

   v0.1.1 (15 Nov 2026) — PHONE CHECK. Jeff: in phone view the panel
     covered the page, and the page's own text styles leaked into the
     panel (large serif list text).
     · The panel shrinks to the pill (bottom left) with its "–" button, and
       on its own when the window is narrower than 700 px (phone view). It
       comes back when the window is wide again, unless Jeff shrank it.
     · The pill is the Live / Capture switch: tap it to swap. Its "Panel"
       part reopens the panel.
     · Panel text is fixed to its own font and size (!important), so page
       styles cannot reach it.
     · The phone-view how-to names the DevTools step first.
     Capture, compare and save logic are unchanged from v0.1.0.

   HOW IT IS RUN
     Not on any page by default. Jeff opens an old newsletter (NEWSLETTERS
     uses-legacy on) on www.inbxify.com, signed in as staff, and clicks a
     Chrome bookmark that loads this file. A small panel appears bottom right.

   WHAT IT DOES
     Capture  Takes the old layout (#ix-page data-legacy, inside data-content)
              exactly as it shows now, after every page script has run:
              · drops <script>, <noscript> and blocks hidden by Webflow
                conditional visibility (.w-condition-invisible);
              · renames every site class to ls-<class> so the capture can
                never borrow from the Webflow stylesheet; Webflow's own w-
                classes keep their names (Webflow's code needs them and a
                style clean-up never removes them);
              · copies every style rule the capture uses, from every stylesheet
                on the page, in page order, with media queries, keyframes,
                the Webflow-uploaded fonts it uses and the CSS variables it
                reads, into one <style> inside the capture;
              · pictures: an Uploadcare link becomes its raw link plus a size
                (twice the width shown, never past the original) plus
                -/format/auto/; srcset and sizes are removed. A picture on
                Webflow's file host is left for the Worker to rehost on Save,
                with the width it should get.
     Compare  Puts the capture in the old layout's place and hides the old
              layout, on this same page, in the real page frame (shell plate
              and paper card, as the page keeps them after Save). Toggle back and forth. For phone width, turn on
              Chrome's device toolbar (Cmd+Shift+M) after capturing.
     Save     Asks first. Then ix-legacy-sunset rehosts the Webflow-hosted
              pictures, writes Web Render HTML, reads it back, turns
              uses-legacy off and reads that back. Undo turns uses-legacy on.

   Capture always happens at desktop width (992 px or wider), so sizes are
   measured where pictures show largest.

   HARDCODING (provisional, die with the series): HC-P-LS1-6 the Worker
   address (WORKER); HC-P-LS1-7 the "ls-" class prefix; HC-P-LS1-4 the
   Webflow file hosts (WF_RE), same list as the Worker.
   ============================================================ */
(function () {
  'use strict';
  var VERSION = '0.1.10';
  var WORKER = 'https://ix-legacy-sunset.jeff-2cd.workers.dev';               // HC-P-LS1-6
  var PFX = 'ls-';                                                              // HC-P-LS1-7
  var WF_RE = /^https?:\/\/(cdn\.prod\.website-files\.com|assets\.website-files\.com|assets-global\.website-files\.com|uploads-ssl\.webflow\.com|global-uploads\.webflow\.com)\//i; // HC-P-LS1-4
  var UC_RE = /^(https?:\/\/[a-z0-9.-]*(?:ucarecd\.net|ucarecdn\.com))\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\//i;
  var MIN_W = 992;
  // url("…") | url('…') | url(…): group 1, 2 or 3 is the address, brackets inside quotes kept.
  var CSS_URL = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s'"]*))\s*\)/gi;
  function cssUrl(text) { CSS_URL.lastIndex = 0; var m = CSS_URL.exec(text || ''); return m ? (m[1] != null ? m[1] : m[2] != null ? m[2] : m[3]) : ''; }

  if (window.__lsCapture) { window.__lsCapture.toggle(); return; }

  var S = { item: null, cap: null, showing: 'live', busy: false, holder: null, lstyle: undefined };

  // ── styles (scoped, own names; the public page has no ix-buttons) ────────
  var css = '' +
    '.lsx{position:fixed;right:16px;bottom:16px;z-index:2147483000;width:380px;max-height:80vh;overflow:auto;background:#fff;color:#1d2525;' +
    'border:1px solid #d9d4c7;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.18);font:13px/1.45 "DM Sans",system-ui,sans-serif}' +
    '.lsx *{box-sizing:border-box}' +
    '.lsx,.lsx p,.lsx li,.lsx span,.lsx b,.lsx div,.lsx ul,.lsx a,.lsx button{font-family:"DM Sans",system-ui,sans-serif!important;font-size:13px!important;line-height:1.45!important;letter-spacing:normal!important}' +
    '.lsx p{margin:8px 0!important}' +
    '.lsx .lsx-k,.lsx .lsx-k span{font-size:10px!important;letter-spacing:.08em!important}' +
    '.lsx .lsx-t{font-family:Fraunces,Georgia,serif!important;font-size:15px!important}' +
    '.lsx-h{padding:12px 14px 8px;border-bottom:1px solid #eee9dc}' +
    '.lsx-k{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8a8170;display:flex;justify-content:space-between}' +
    '.lsx-t{font:600 15px/1.3 Fraunces,Georgia,serif;color:#1A3A3A;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.lsx-x{cursor:pointer;color:#8a8170;background:none;border:0;font-size:14px;padding:0}' +
    '.lsx-b{padding:10px 14px}' +
    '.lsx-row{display:flex;gap:8px;margin:2px 0 10px}' +
    '.lsx-btn{flex:0 0 108px;width:108px;height:32px;border-radius:8px;border:1px solid #1A3A3A;background:#fff;color:#1A3A3A;font:600 12px "DM Sans",system-ui,sans-serif;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.lsx-btn.pri{background:#1A3A3A;color:#fff}' +
    '.lsx-btn[disabled]{opacity:.35;cursor:default}' +
    '.lsx-st{padding:8px 10px;border-radius:8px;background:#FAF9F5;border-left:3px solid #C4A35A;margin-bottom:8px;overflow-wrap:anywhere;word-break:break-word}' +
    '.lsx-st.bad{border-left-color:#c0392b;background:#fdf1ef}' +
    '.lsx-st.ok{border-left-color:#2e7d5b;background:#eef7f2}' +
    '.lsx-l{margin:0;padding:0;list-style:none}' +
    '.lsx-l li{display:flex;justify-content:space-between;gap:10px;padding:3px 0;border-bottom:1px dotted #eee9dc}' +
    '.lsx-l li span:last-child{font-variant-numeric:tabular-nums;color:#1A3A3A;font-weight:600;text-align:right}' +
    '.lsx-w{color:#a0521d}' +
    '.lsx-a{color:#1A3A3A;text-decoration:underline;cursor:pointer;background:none;border:0;padding:0;font:inherit}' +
    '.lsx .lsx-nav{margin-top:4px;font-size:12px!important}' +
    '.lsx-inv{list-style:none;margin:0;padding:0}' +
    '.lsx-inv li{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px dotted #eee9dc}' +
    '.lsx-inv a{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#1A3A3A;text-decoration:none;font-weight:600}' +
    '.lsx-inv a:hover{text-decoration:underline}' +
    '.lsx-inv a.here{color:#a0521d}' +
    '.lsx-chip{flex:0 0 96px;width:96px;text-align:center;border-radius:999px;padding:2px 0;font-size:11px!important;font-weight:600;white-space:nowrap}' +
    '.lsx-chip.todo{background:#FAF3E3;color:#8a6a1e}' +
    '.lsx-chip.done{background:#eef7f2;color:#2e7d5b}' +
    '.lsx-chip.off{background:#f1efea;color:#8a8170}' +
    '.lsx-bar{height:6px;border-radius:3px;background:#eee9dc;overflow:hidden;margin:8px 0}' +
    '.lsx-bar i{display:block;height:100%;width:40%;background:linear-gradient(90deg,#C4A35A,#1A3A3A,#C4A35A);animation:lsxrun 1.1s linear infinite}' +
    '@keyframes lsxrun{from{transform:translateX(-100%)}to{transform:translateX(250%)}}' +
    '.lsx-ov{position:fixed;inset:0;z-index:2147483001;background:rgba(20,30,30,.45);display:flex;align-items:center;justify-content:center}' +
    '.lsx-m{width:440px;background:#fff;border-radius:12px;padding:18px 20px;font:13px/1.5 "DM Sans",system-ui,sans-serif;color:#1d2525;box-shadow:0 20px 60px rgba(0,0,0,.3)}' +
    '.lsx-m h3{margin:0 0 8px;font:600 17px Fraunces,Georgia,serif;color:#1A3A3A}' +
    '.lsx-m ul{margin:6px 0 12px 18px;padding:0}' +
    '.lsx-pick{position:fixed;z-index:2147482999;pointer-events:none;border:2px dashed #C4A35A;background:rgba(196,163,90,.12);border-radius:4px;display:none}' +
    '.lsx-pick.sel{border-style:solid;border-color:#c0392b;background:rgba(192,57,43,.12)}' +
    '.lsx-row2{display:flex;gap:8px;align-items:center;margin:-2px 0 10px}' +
    '.lsx-row2 .lsx-btn{flex:0 0 108px}' +
    '.lsx-flag{position:fixed;left:12px;bottom:12px;z-index:2147483000;display:flex;border-radius:999px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.25);font:600 12px/1 "DM Sans",system-ui,sans-serif!important}' +
    '.lsx-flag button{border:0;margin:0;height:32px;padding:0 12px;cursor:pointer;color:#fff;font:600 12px/1 "DM Sans",system-ui,sans-serif!important;white-space:nowrap}' +
    '.lsx-flag .lsx-sw{width:136px;background:#1A3A3A}' +
    '.lsx-flag.live .lsx-sw{background:#8a8170}' +
    '.lsx-flag .lsx-sw[disabled]{cursor:default}' +
    '.lsx-flag .lsx-op{width:64px;background:#C4A35A;color:#1A3A3A}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var panel = document.createElement('div'); panel.className = 'lsx';
  var flag = document.createElement('div'); flag.className = 'lsx-flag live';
  flag.innerHTML = '<button class="lsx-sw" data-f="sw" disabled>Live</button><button class="lsx-op" data-f="op">Panel</button>';
  var swBtn = flag.firstChild, opBtn = flag.lastChild;
  var mini = { user: false, auto: false };
  function setMini(on) { panel.style.display = on ? 'none' : ''; opBtn.style.display = on ? '' : 'none'; }
  function fit() {
    var narrow = window.innerWidth < 700;
    if (narrow && !mini.auto) { mini.auto = true; setMini(true); }
    else if (!narrow && mini.auto) { mini.auto = false; setMini(mini.user); }
  }
  function paintFlag() {
    flag.className = 'lsx-flag' + (S.showing === 'cap' ? '' : ' live');
    swBtn.textContent = S.showing === 'cap' ? 'Capture ⇄ live' : 'Live ⇄ capture';
    swBtn.disabled = !S.cap;
    swBtn.title = S.cap ? 'Tap to swap between the live old layout and the capture' : 'Capture first';
  }
  flag.addEventListener('click', function (e) {
    var f = e.target.getAttribute && e.target.getAttribute('data-f');
    if (f === 'sw' && S.cap) { if (S.showing === 'cap') showLive(); else showCap(); }
    if (f === 'op') { mini.user = false; mini.auto = false; setMini(false); }
  });
  setMini(false);
  document.body.appendChild(panel); document.body.appendChild(flag);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function kb(n) { return (n / 1024).toFixed(1) + ' KB'; }

  // ── auth + Worker ─────────────────────────────────────────────────────────
  function token() {
    return new Promise(function (res) {
      var tries = 0;
      (function wait() {
        var ms = window.$memberstackDom;
        if (ms && ms.getMemberCookie) { Promise.resolve(ms.getMemberCookie()).then(function (t) { res(t || ''); }, function () { res(''); }); return; }
        if (++tries > 40) return res('');
        setTimeout(wait, 150);
      })();
    });
  }
  function call(path, body) {
    return token().then(function (t) {
      if (!t) throw new Error('Not signed in. Sign in on inbxify.com as staff, then click the bookmark again.');
      return fetch(WORKER + path, { method: body ? 'POST' : 'GET', headers: Object.assign({ Authorization: 'Bearer ' + t }, body ? { 'Content-Type': 'application/json' } : {}),
        body: body ? JSON.stringify(body) : undefined });
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (j) {
        if (!r.ok || !j || !j.ok) { var err = new Error((j && j.error) || ('The Worker answered ' + r.status + '.')); err.data = j; err.status = r.status; throw err; }
        return j;
      });
    });
  }

  // ── page parts ────────────────────────────────────────────────────────────
  function parts() {
    var pg = document.getElementById('ix-page');
    if (!pg) return { err: 'This is not a newsletter page (no #ix-page).' };
    var box = document.querySelector(pg.getAttribute('data-content') || '');
    if (!box) return { err: 'data-content does not match anything on this page.' };
    var legacy = box.querySelector(splitSel(pg.getAttribute('data-legacy') || '')[0] || '.nl-inner-wrapper');
    if (!legacy) return { err: 'The old layout (data-legacy) is not on this page.' };
    return { box: box, legacy: legacy };
  }

  // ── capture ───────────────────────────────────────────────────────────────
  function sizeFor(el, natural) {
    var w = Math.round(el.getBoundingClientRect().width || 0);
    var t = w > 0 ? w * 2 : (natural || 0);
    if (natural) t = Math.min(t, natural);
    return Math.min(t, 3000);
  }
  function ucShown(url, w) {
    var m = UC_RE.exec(url); if (!m) return null;
    if (/\.svg($|\?)/i.test(url)) return { url: url, svg: true };
    return { url: m[1] + '/' + m[2] + '/' + (w > 0 ? '-/resize/' + w + 'x/' : '') + '-/format/auto/' };
  }

  function capture() {
    var p = parts(); if (p.err) throw new Error(p.err);
    if (window.innerWidth < MIN_W) throw new Error('Capture at desktop width: make the window at least ' + MIN_W + ' px wide (it is ' + window.innerWidth + ').');
    if (S.showing === 'cap') showLive();
    var legacy = p.legacy, stats = { scripts: 0, hidden: 0, uc: 0, wf: 0, other: [], svg: 0, interactions: 0, forms: 0, ids: 0, banners: 0, sponsors: 0 };
    var pairs = [], keptLive = new Set(), classes = new Set(), wfImages = new Map();

    function cl(live) {
      if (live.nodeType === 3) return document.createTextNode(live.nodeValue);
      if (live.nodeType !== 1) return null;
      var tag = live.tagName.toLowerCase();
      if (tag === 'script' || tag === 'noscript') { stats.scripts++; return null; }
      if (live.classList && live.classList.contains('w-condition-invisible')) { stats.hidden++; return null; }
      if (tag === 'img' && /\/plugins\/[^/]+\/assets\/placeholder/i.test(live.getAttribute('src') || '')) { stats.placeholders = (stats.placeholders || 0) + 1; return null; }
      var c = live.cloneNode(false);
      pairs.push([live, c]); keptLive.add(live);
      for (var i = 0; i < live.childNodes.length; i++) { var k = cl(live.childNodes[i]); if (k) c.appendChild(k); }
      return c;
    }
    var root = cl(legacy);

    function picture(live, url, w, setter) {
      if (!url) return;
      if (WF_RE.test(url)) { stats.wf++; wfImages.set(url, Math.max(wfImages.get(url) || 0, w)); return; }
      var u = ucShown(url, w);
      if (u) { if (u.svg) stats.svg++; else stats.uc++; setter(u.url); return; }
      if (!/^data:/i.test(url)) stats.other.push(url);
    }

    pairs.forEach(function (pr) {
      var live = pr[0], c = pr[1];
      if (live.hasAttribute('data-w-id')) stats.interactions++;
      if (live.tagName === 'FORM') stats.forms++;
      // Ad slots that take the current week's set (HC-P-LS1-8).
      if (live.classList && live.classList.contains('ad-only-lb')) {
        var lead = !!live.closest('.ba-controller.lead');
        if (lead) stats.lead = true; else stats.banners++;
        c.setAttribute('data-ls-ad', 'banner');
        c.setAttribute('data-ls-slot', lead ? 'lead' : String(stats.banners));
      } else if (live.classList && (live.classList.contains('paid-attribution-label') ||
                 (Array.prototype.some.call(live.classList, function (k) { return /sponsor/i.test(k); }) &&
                  !live.parentElement.closest('[class*="sponsor"], .paid-attribution-label')))) {
        stats.sponsors++;
        c.setAttribute('data-ls-ad', 'sponsor');
        c.setAttribute('data-ls-slot', String(stats.sponsors));
        var hdr = live.closest('.ts-section-header') || live.parentElement;
        var art = hdr && hdr.querySelector('img');
        var artSrc = art ? (art.getAttribute('src') || '') : '';
        if (artSrc) c.setAttribute('data-ls-art', decodeURIComponent(artSrc.split('?')[0].split('/').pop()));
      }
      if (live.id) stats.ids++;
      // classes
      if (c.classList && c.classList.length) {
        var next = [];
        for (var i = 0; i < c.classList.length; i++) {
          var k = c.classList[i];
          if (/^w-/.test(k)) next.push(k); else { classes.add(k); next.push(PFX + k); }
        }
        c.setAttribute('class', next.join(' '));
      }
      // pictures
      if (live.tagName === 'IMG') {
        var src = live.currentSrc || live.getAttribute('src') || '';
        c.removeAttribute('srcset'); c.removeAttribute('sizes');
        c.setAttribute('src', src);
        picture(live, src, sizeFor(live, live.naturalWidth), function (v) { c.setAttribute('src', v); });
      }
      if (live.tagName === 'SOURCE') c.removeAttribute('srcset');
      var bg = live.style && live.style.backgroundImage;
      if (bg && bg !== 'none') {
        var bgu = cssUrl(bg);
        if (bgu) picture(live, bgu, sizeFor(live, 0), function (v) { c.style.backgroundImage = 'url("' + v + '")'; });
      }
    });

    // inline <style> kept inside the capture: rename its classes too
    var captureStyleNodes = new Set();
    Array.prototype.forEach.call(legacy.querySelectorAll('style'), function (s) { captureStyleNodes.add(s); });
    Array.prototype.forEach.call(root.querySelectorAll('style'), function (s) { s.textContent = renameIn(s.textContent, classes); });

    return gatherCss(legacy, keptLive, classes, captureStyleNodes, wfImages).then(function (cssOut) {
      var slug = (location.pathname.split('/').filter(Boolean).pop() || '');
      var html = '<div ' + 'data-ls-capture="' + esc(slug) + '" data-ls-version="' + VERSION + '" data-ls-at="' + new Date().toISOString() + '">' +
        '<style data-ls-style>' + cssOut.text + '</style>' + root.outerHTML + '</div>';
      S.cap = { html: html, stats: stats, css: cssOut, images: Array.from(wfImages, function (e) { return { url: e[0], w: e[1] }; }), classes: classes.size };
      return S.cap;
    });
  }

  function renameIn(text, classes) {
    return text.replace(/\.(-?[_a-zA-Z][\w-]*)/g, function (m, k) { return classes.has(k) ? '.' + PFX + k : m; });
  }
  function splitSel(sel) {
    var out = [], depth = 0, cur = '';
    for (var i = 0; i < sel.length; i++) {
      var ch = sel[i];
      if (ch === '(' || ch === '[') depth++; else if (ch === ')' || ch === ']') depth--;
      if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  function readSheets() {
    var list = Array.prototype.slice.call(document.styleSheets);
    return Promise.all(list.map(function (s) {
      var rules = null;
      try { rules = s.cssRules; } catch (e) { rules = null; }
      if (rules) return { sheet: s, rules: rules, href: s.href || 'inline' };
      if (!s.href) return { sheet: s, rules: null, href: 'inline', unreadable: true };
      return fetch(s.href).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
        if (!t) return { sheet: s, rules: null, href: s.href, unreadable: true };
        var ns = new CSSStyleSheet(); ns.replaceSync(t.replace(/@import[^;]+;/g, ''));
        return { sheet: s, rules: ns.cssRules, href: s.href };
      }).catch(function () { return { sheet: s, rules: null, href: s.href, unreadable: true }; });
    }));
  }

  function gatherCss(legacy, keptLive, classes, captureStyleNodes, wfImages) {
    var kept = 0, keyframes = new Map(), fontFaces = [], unreadable = [], usedFamilies = new Set();
    keptLive.forEach(function (el) {
      try { getComputedStyle(el).fontFamily.split(',').forEach(function (f) { usedFamilies.add(f.trim().replace(/^["']|["']$/g, '').toLowerCase()); }); } catch (e) {}
    });
    function hitsCapture(part) {
      var toks = part.match(/\.(-?[_a-zA-Z][\w-]*)/g) || [];
      var any = toks.some(function (t) { return classes.has(t.slice(1)); });
      if (!any) return false;
      var test = part.replace(/::?[a-zA-Z-]+(\((?:[^()]|\([^()]*\))*\))?/g, '').trim();
      if (!test || /[>+~]\s*$/.test(test)) return true;
      var els; try { els = document.querySelectorAll(test); } catch (e) { return true; }
      for (var i = 0; i < els.length; i++) if (keptLive.has(els[i])) return true;
      return false;
    }
    function fixUrls(text) {
      return text.replace(CSS_URL, function (m, q1, q2, q3) {
        var u = q1 != null ? q1 : q2 != null ? q2 : q3;
        if (!u) return m;
        if (WF_RE.test(u)) { if (!wfImages.has(u)) wfImages.set(u, 0); return 'url("' + u + '")'; }
        var uc = ucShown(u, 0); return uc ? 'url("' + uc.url + '")' : m;
      });
    }
    function walk(rules, out) {
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (r.type === 1) {
          var partsKept = splitSel(r.selectorText).filter(hitsCapture);
          if (partsKept.length) { kept++; out.push(renameIn(partsKept.join(','), classes) + '{' + fixUrls(r.style.cssText) + '}'); }
        } else if (r.type === 4 || r.type === 12) {
          var inner = []; walk(r.cssRules, inner);
          if (inner.length) out.push((r.type === 4 ? '@media ' + r.media.mediaText : '@supports ' + r.conditionText) + '{' + inner.join('') + '}');
        } else if (r.type === 7) { keyframes.set(r.name, r.cssText); }
        else if (r.type === 5) { fontFaces.push(r); }
      }
    }
    return readSheets().then(function (sheets) {
      var out = [];
      sheets.forEach(function (s) {
        if (s.sheet.ownerNode && captureStyleNodes.has(s.sheet.ownerNode)) return;   // travels inside the capture
        if (s.sheet.ownerNode && s.sheet.ownerNode === st) return;                   // this panel
        if (!s.rules) { unreadable.push(s.href); return; }
        walk(s.rules, out);
      });
      var body = out.join('\n');
      var kf = []; keyframes.forEach(function (txt, name) { if (body.indexOf(name) !== -1) kf.push(txt); });
      // Fonts uploaded to Webflow (on Webflow's file host) that the capture uses; Google fonts load site-wide.
      var ff = [];
      fontFaces.forEach(function (r) {
        var fam = (r.style.getPropertyValue('font-family') || '').replace(/^["']|["']$/g, '').trim().toLowerCase();
        if (fam && usedFamilies.has(fam) && WF_RE.test(cssUrl(r.cssText))) ff.push(fixUrls(r.cssText));
      });
      // CSS variables the rules read, frozen at today's values on the capture's wrapper.
      var vars = {}, rs = getComputedStyle(document.documentElement), m, vre = /var\(\s*(--[\w-]+)/g;
      while ((m = vre.exec(body))) { var v = rs.getPropertyValue(m[1]).trim(); if (v) vars[m[1]] = v; }
      var varRule = Object.keys(vars).length ? '[data-ls-capture]{' + Object.keys(vars).map(function (k) { return k + ':' + vars[k]; }).join(';') + '}\n' : '';
      var text = varRule + ff.join('\n') + (ff.length ? '\n' : '') + kf.join('\n') + (kf.length ? '\n' : '') + body;
      return { text: text, rules: kept, keyframes: kf.length, fonts: ff.length, vars: Object.keys(vars).length, unreadable: unreadable };
    });
  }

  // ── compare ───────────────────────────────────────────────────────────────
  // The capture goes where the old layout is, and the old layout is hidden.
  // After Save the shell hosts it the same way, once #ix-page data-legacy
  // also names [data-ls-capture] (see the Needs-you step), so the plate and
  // the paper card stay as they are today.
  function showCap() {
    var p = parts(); if (p.err || !S.cap) return;
    if (!S.holder) { S.holder = document.createElement('div'); S.holder.setAttribute('data-ls-preview', ''); }
    S.holder.innerHTML = S.cap.html;
    if (S.holder.parentNode !== p.legacy.parentNode) p.legacy.parentNode.insertBefore(S.holder, p.legacy.nextSibling);
    S.holder.style.display = '';
    if (S.lstyle === undefined) S.lstyle = p.legacy.getAttribute('style');
    p.legacy.style.display = 'none';
    S.showing = 'cap';
    paintFlag();
    render();
  }
  function showLive() {
    var p = parts(); if (p.err) return;
    if (S.holder) S.holder.style.display = 'none';
    S.edit = false; S.sel = null; place(selBox, null); place(hoverBox, null);
    if (S.lstyle === undefined || S.lstyle === null) p.legacy.removeAttribute('style'); else p.legacy.setAttribute('style', S.lstyle);
    S.showing = 'live';
    paintFlag();
    render();
  }

  // ── remove blocks (edit mode) ─────────────────────────────────────────────
  var hoverBox = document.createElement('div'); hoverBox.className = 'lsx-pick'; document.body.appendChild(hoverBox);
  var selBox = document.createElement('div'); selBox.className = 'lsx-pick sel'; document.body.appendChild(selBox);
  S.edit = false; S.sel = null; S.undo = [];
  function capRoot() { return S.holder && S.holder.querySelector('[data-ls-capture]'); }
  function pickable(el) {
    var root = capRoot();
    return el && root && el !== root && root.contains(el) && el.tagName !== 'STYLE';
  }
  function place(box, el) {
    if (!el) { box.style.display = 'none'; return; }
    var r = el.getBoundingClientRect();
    box.style.display = 'block'; box.style.left = r.left + 'px'; box.style.top = r.top + 'px';
    box.style.width = r.width + 'px'; box.style.height = r.height + 'px';
  }
  function describe(el) {
    var cls = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean).map(function (k) { return k.replace(/^ls-/, ''); }).slice(0, 2).join('.');
    var txt = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '') + (txt ? ' · “' + txt + '”' : ' · (no text)');
  }
  function setEdit(on) {
    S.edit = on; S.sel = null; place(hoverBox, null); place(selBox, null); render();
  }
  document.addEventListener('mousemove', function (e) {
    if (!S.edit || S.showing !== 'cap') return;
    place(hoverBox, pickable(e.target) ? e.target : null);
  }, true);
  document.addEventListener('click', function (e) {
    if (!S.edit || S.showing !== 'cap' || !pickable(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    S.sel = e.target; place(selBox, S.sel); render();
  }, true);
  window.addEventListener('scroll', function () { if (S.sel) place(selBox, S.sel); place(hoverBox, null); }, true);
  function larger() { if (S.sel && pickable(S.sel.parentElement)) { S.sel = S.sel.parentElement; place(selBox, S.sel); render(); } }
  function removeSel() {
    if (!S.sel) return;
    S.undo.push(S.cap.html);
    S.sel.parentNode.removeChild(S.sel);
    S.cap.html = S.holder.innerHTML;
    S.cap.removed = (S.cap.removed || 0) + 1;
    S.cap.images = S.cap.images.filter(function (im) { return S.cap.html.indexOf(im.url) !== -1; });
    S.sel = null; place(selBox, null); place(hoverBox, null); render();
  }
  function undoRemove() {
    if (!S.undo.length) return;
    S.cap.html = S.undo.pop(); S.cap.removed = Math.max(0, (S.cap.removed || 1) - 1);
    S.holder.innerHTML = S.cap.html; S.sel = null; place(selBox, null); render();
  }

  // ── panel ─────────────────────────────────────────────────────────────────
  var msg = null;   // { kind: ''|'ok'|'bad', html }
  function render() {
    var it = S.item, c = S.cap;
    var h = '<div class="lsx-h"><div class="lsx-k"><span>Legacy Sunset · v' + VERSION + '</span><span><button class="lsx-x" data-a="mini" title="Shrink to the pill">–</button> <button class="lsx-x" data-a="close" title="Close">✕</button></span></div>' +
      '<div class="lsx-t">' + esc(S.view === 'list' ? 'All old newsletters' : (it ? it.name : 'Old newsletter')) + '</div>' +
      '<div class="lsx-nav"><button class="lsx-a" data-a="' + (S.view === 'list' ? 'back' : 'list') + '">' +
      (S.view === 'list' ? 'Back to this page' : 'All old newsletters') + '</button></div></div><div class="lsx-b">';
    if (S.view === 'list') { panel.innerHTML = h + listHtml() + '</div>'; return; }
    if (msg) h += '<div class="lsx-st ' + (msg.kind || '') + '">' + msg.html + '</div>';
    if (S.busy) h += '<div class="lsx-bar"><i></i></div>';
    var canSave = !!(it && it.usesLegacy && c && !S.busy);
    h += '<div class="lsx-row">' +
      '<button class="lsx-btn" data-a="capture"' + (S.busy || !it || !it.usesLegacy ? ' disabled' : '') + '>' + (c ? 'Capture again' : 'Capture') + '</button>' +
      '<button class="lsx-btn" data-a="toggle"' + (!c || S.busy ? ' disabled' : '') + '>' + (S.showing === 'cap' ? 'Show live' : 'Show capture') + '</button>' +
      '<button class="lsx-btn pri" data-a="save"' + (canSave && !S.edit ? '' : ' disabled') + '>Save</button></div>';
    if (c && it && it.usesLegacy && S.showing === 'cap') {
      h += '<div class="lsx-row2"><button class="lsx-btn" data-a="edit">' + (S.edit ? 'Done removing' : 'Remove blocks') + '</button>' +
        (S.undo.length ? '<button class="lsx-a" data-a="unrem">Undo remove</button>' : '') +
        (c.removed ? '<span>' + c.removed + ' removed</span>' : '') + '</div>';
      if (S.edit) {
        h += S.sel
          ? '<div class="lsx-st">Picked: ' + esc(describe(S.sel)) + '<div class="lsx-row" style="margin:8px 0 0"><button class="lsx-btn" data-a="larger">Larger</button>' +
            '<button class="lsx-btn pri" data-a="remove">Remove</button><button class="lsx-btn" data-a="unpick">Cancel</button></div></div>'
          : '<div class="lsx-st">Click the block to take out. “Larger” widens the pick to the block around it.</div>';
      }
    }
    if (c) {
      var s = c.stats;
      h += '<ul class="lsx-l">' +
        '<li><span>Size</span><span>' + kb(c.html.length) + '</span></li>' +
        '<li><span>Style rules copied</span><span>' + c.css.rules + '</span></li>' +
        '<li><span>Uploadcare pictures (raw + size)</span><span>' + s.uc + '</span></li>' +
        '<li><span>Webflow-hosted pictures to rehost</span><span>' + c.images.length + '</span></li>' +
        '<li><span>Hidden blocks left out</span><span>' + s.hidden + (s.placeholders ? ' + ' + s.placeholders + ' placeholder pictures' : '') + '</span></li>' +
        '<li><span>Scripts left out</span><span>' + s.scripts + '</span></li>' +
        '<li><span>Forms / interactions kept</span><span>' + s.forms + ' / ' + s.interactions + '</span></li>' +
        '<li><span>Ad slots tagged (banners / sponsors)</span><span>' + s.banners + (s.lead ? ' + Lead' : '') + ' / ' + s.sponsors + '</span></li>' +
        '<li><span>CMS fields shown (by value)</span><span>' + (S.fieldsCount == null ? '…' : S.fieldsCount) + '</span></li></ul>';
      var warn = [];
      if (s.other.length) warn.push(s.other.length + ' picture(s) on another host stay as they are: ' + esc(s.other.slice(0, 2).join(', ')));
      if (s.svg) warn.push(s.svg + ' Uploadcare SVG(s) left as stored (SVG gets no size).');
      if (S.fieldsErr) warn.push('CMS field list: ' + esc(S.fieldsErr));
      if (c.css.unreadable.length) warn.push('Stylesheet(s) that could not be read: ' + esc(c.css.unreadable.join(', ')));
      if (warn.length) h += '<p class="lsx-w">' + warn.join('<br>') + '</p>';
      h += '<p>Check it: toggle <b>Show live</b> / <b>Show capture</b> and scroll the whole issue. For phone width: open DevTools (Cmd+Option+I), then click the phone-and-tablet icon at its top left. This panel shrinks to the pill at the bottom left; tap the pill to swap live and capture. Tap <b>Panel</b> to bring this back.</p>';
    } else if (it && it.usesLegacy) {
      h += '<p>Capture takes the old layout as it shows now and puts it in its place, so you can compare on this page. Nothing is saved until you press Save.</p>';
    }
    if (!c && it && !it.usesLegacy && S.fieldsCount != null) h += '<ul class="lsx-l"><li><span>CMS fields shown (by value)</span><span>' + esc(S.fieldsCount) + '</span></li></ul>' +
      (S.fieldsErr ? '<p class="lsx-w">CMS field list: ' + esc(S.fieldsErr) + '</p>' : '');
    if (it && !it.usesLegacy && it.saved && !it.saved.undoneAt) h += '<p>Saved ' + esc(new Date(it.saved.at).toLocaleString()) + '. <button class="lsx-a" data-a="undo">Undo (turn uses-legacy back on)</button></p>';
    h += '</div>';
    panel.innerHTML = h;
  }
  function say(kind, html) { msg = { kind: kind, html: html }; render(); }

  // ── the list (/inventory) ────────────────────────────────────────────────
  function rowState(r) {
    if (!r.usesLegacy && r.saved && !r.saved.undoneAt) return { k: 'done', t: 'Saved' };
    if (!r.published || r.draft || r.archived) return { k: 'off', t: r.draft ? 'Draft' : r.archived ? 'Archived' : 'Not published' };
    return { k: 'todo', t: 'To do' };
  }
  function listHtml() {
    if (S.invErr) return '<div class="lsx-st bad">' + esc(S.invErr) + '</div>';
    if (!S.inv) return '<div class="lsx-bar"><i></i></div><p>Reading NEWSLETTERS…</p>';
    var rows = S.inv.rows.slice(), order = { todo: 0, off: 1, done: 2 }, here = (S.item || {}).id;
    rows.sort(function (a, b) { return order[rowState(a).k] - order[rowState(b).k] || a.name.localeCompare(b.name); });
    var todo = rows.filter(function (r) { return rowState(r).k === 'todo'; }).length;
    var h = '<ul class="lsx-l"><li><span>Old newsletters</span><span>' + rows.length + '</span></li>' +
      '<li><span>To do</span><span>' + todo + '</span></li>' +
      '<li><span>Saved</span><span>' + rows.filter(function (r) { return rowState(r).k === 'done'; }).length + '</span></li>' +
      '<li><span>Not published, draft or archived</span><span>' + rows.filter(function (r) { return rowState(r).k === 'off'; }).length + '</span></li></ul>';
    h += '<ul class="lsx-inv" style="margin-top:10px">' + rows.map(function (r) {
      var st = rowState(r);
      return '<li><a href="' + esc(r.url) + '"' + (r.id === here ? ' class="here" title="This page"' : '') + '>' + esc(r.name || r.slug) + '</a>' +
        '<span class="lsx-chip ' + st.k + '">' + st.t + '</span></li>';
    }).join('') + '</ul>';
    h += '<p>Open a newsletter from the list, then click the bookmark on its page. Not published, draft and archived ones have no live page to capture.</p>';
    return h;
  }
  function openList() {
    S.view = 'list'; S.inv = null; S.invErr = ''; render();
    call('/inventory').then(function (j) { S.inv = j; render(); }, function (e) { S.invErr = e.message; render(); });
  }

  panel.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    var a = b.getAttribute('data-a');
    if (a === 'close') return api.toggle();
    if (a === 'mini') { mini.user = true; return setMini(true); }
    if (a === 'toggle') return S.showing === 'cap' ? showLive() : showCap();
    if (a === 'capture') return doCapture();
    if (a === 'save') return confirmSave();
    if (a === 'undo') return doUndo();
    if (a === 'list') return openList();
    if (a === 'back') { S.view = 'issue'; return render(); }
    if (a === 'edit') return setEdit(!S.edit);
    if (a === 'larger') return larger();
    if (a === 'remove') return removeSel();
    if (a === 'unpick') { S.sel = null; place(selBox, null); return render(); }
    if (a === 'unrem') return undoRemove();
  });

  function doCapture() {
    S.busy = true; S.fieldsCount = null; S.undo = []; S.edit = false; S.sel = null; place(selBox, null); place(hoverBox, null); say('', 'Capturing…');
    var p;
    try { p = capture(); } catch (e) { S.busy = false; return say('bad', esc(e.message)); }
    p.then(function () {
      S.busy = false; msg = null; showCap();
      say('ok', 'Captured. The page now shows the capture in place of the old layout.');
      return runFields(S.cap.html, true);
    }).catch(function (e) { S.busy = false; say('bad', 'Capture failed: ' + esc(e.message)); });
  }

  // CMS field list, in steps (Worker /fields answers done:false until it is done).
  var fieldsRun = 0;
  function runFields(html, restart) {
    var my = ++fieldsRun;
    S.fieldsCount = 'starting…'; S.fieldsErr = ''; render();
    function step(first) {
      if (my !== fieldsRun) return;                          // a newer run took over
      var body = { id: S.item.id }; if (html) body.html = html; if (first && restart) body.restart = true;
      return call('/fields', body).then(function (j) {
        if (my !== fieldsRun) return;
        if (!j.done) { S.fieldsCount = 'reading ' + j.itemsRead + ' items…'; render(); return step(false); }
        S.fieldsCount = j.collections.reduce(function (n, c) { return n + c.fields.length; }, 0) + (j.capped ? ' (capped)' : '');
        render();
      }, function (e) {
        if (my !== fieldsRun) return;
        S.fieldsCount = 'failed'; S.fieldsErr = e.message; render(); console.warn('[ls-capture] /fields:', e.message);
      });
    }
    return step(true);
  }

  function confirmSave() {
    var c = S.cap, it = S.item;
    var ov = document.createElement('div'); ov.className = 'lsx-ov';
    ov.innerHTML = '<div class="lsx-m"><h3>Save ' + esc(it.name) + '?</h3>' +
      '<p>This does three things to the NEWSLETTERS item:</p><ul>' +
      '<li>Uploads ' + c.images.length + ' Webflow-hosted picture(s) to Uploadcare and points the capture at the copies.</li>' +
      '<li>Writes the capture (' + kb(c.html.length) + ') into Web Render HTML.</li>' +
      '<li>Turns uses-legacy off, so this page shows the saved copy from now on.</li></ul>' +
      '<p>Double-check you compared the whole issue at desktop and phone width. Undo turns uses-legacy back on; the old layout returns as long as it is still on the NEWSLETTERS Template.</p>' +
      '<div class="lsx-row" style="justify-content:flex-end;margin:0"><button class="lsx-btn" data-m="no">Cancel</button><button class="lsx-btn pri" data-m="yes">Save</button></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      var m = e.target.getAttribute && e.target.getAttribute('data-m');
      if (e.target === ov || m === 'no') ov.remove();
      if (m === 'yes') { ov.remove(); doSave(); }
    });
  }

  // Download pictures in the browser (it is already showing them) as base64.
  function grab(urls) {
    return Promise.all(urls.map(function (u) {
      return fetch(u, { mode: 'cors', credentials: 'omit' }).then(function (r) {
        if (!r.ok) throw new Error('The browser could not download ' + u + ' either (' + r.status + ').');
        var type = (r.headers.get('Content-Type') || 'application/octet-stream').split(';')[0];
        return r.blob().then(function (b) {
          return new Promise(function (res, rej) {
            var fr = new FileReader();
            fr.onload = function () { res([u, { b64: String(fr.result).split(',')[1] || '', type: type }]); };
            fr.onerror = function () { rej(new Error('Could not read ' + u)); };
            fr.readAsDataURL(b);
          });
        });
      });
    })).then(function (pairs) { var o = {}; pairs.forEach(function (p) { o[p[0]] = p[1]; }); return o; });
  }

  function doSave() {
    S.busy = true; say('', 'Saving: rehosting pictures, writing Web Render HTML, reading it back, then turning uses-legacy off…');
    var body = { id: S.item.id, html: S.cap.html, images: S.cap.images };
    function done(j) {
      S.busy = false; S.item.usesLegacy = false; S.item.saved = j.saved;
      say('ok', 'Saved and read back: ' + j.readBack.webHtmlCharacters.toLocaleString() + ' characters, ' + j.saved.rehosted.length +
        ' picture(s) rehosted, uses-legacy off. Reload the page to see what readers now get.');
    }
    function fail(e) { S.busy = false; say('bad', 'Not saved: ' + esc(e.message)); }
    call('/save', body).then(done, function (e) {
      var need = e.data && e.data.needBytes;
      if (!need || !need.length) return fail(e);
      say('', 'The Worker could not download ' + need.length + ' picture(s); downloading them here and saving again…');
      return grab(need).then(function (files) { body.files = files; return call('/save', body); }).then(done, fail);
    });
  }

  function doUndo() {
    S.busy = true; say('', 'Turning uses-legacy back on…');
    call('/undo', { id: S.item.id }).then(function () {
      S.busy = false; S.item.usesLegacy = true; if (S.item.saved) S.item.saved.undoneAt = new Date().toISOString();
      say('ok', 'uses-legacy is back on. Reload to see the old layout again.');
    }, function (e) { S.busy = false; say('bad', 'Undo failed: ' + esc(e.message)); });
  }

  var api = { toggle: function () { var hide = flag.style.display !== 'none'; panel.style.display = hide ? 'none' : (mini.user || mini.auto ? 'none' : ''); flag.style.display = hide ? 'none' : ''; } };
  window.addEventListener('resize', fit);
  window.__lsCapture = api;

  // ── start ─────────────────────────────────────────────────────────────────
  render(); paintFlag(); fit();
  if (!document.getElementById('ix-page')) { say('bad', 'This is not a newsletter page. Open one from All old newsletters.'); return; }
  var slug = location.pathname.split('/').filter(Boolean).pop() || '';
  S.busy = true; say('', 'Looking up this newsletter…');
  call('/lookup?slug=' + encodeURIComponent(slug)).then(function (j) {
    S.busy = false; S.item = j.item; msg = null;
    var p0 = parts();
    if (j.item.usesLegacy && p0.err && document.querySelector('[data-ls-capture]'))
      say('bad', 'uses-legacy is back on, but this page is still the saved copy: Webflow takes a minute or so to update the page. Wait a minute, reload (Cmd+Shift+R), then click the bookmark again.');
    else if (j.item.usesLegacy && p0.err) say('bad', 'uses-legacy is on, but the old layout is not on this page yet: Webflow is probably still updating it. Wait a minute or two, reload (Cmd+Shift+R), then click the bookmark again. If it stays like this, send a screenshot of the page.');
    else if (!j.item.usesLegacy && !(j.item.saved && !j.item.saved.undoneAt)) say('bad', 'uses-legacy is off on this newsletter, so there is nothing to capture.');
    else if (!j.item.usesLegacy) {
      say('ok', 'Already saved.');
      if (j.fieldsReport) { S.fieldsCount = j.fieldsReport.fields; render(); }
      else runFields('', false);                                // saved before its list finished: read the saved copy
    }
    else render();
  }, function (e) { S.busy = false; say('bad', esc(e.message)); });
})();
