/* ls-capture-v0.1.0.js */
/* ============================================================
   ls-capture-v0.1.0.js — Legacy Sunset capture, compare and save
   Legacy Sunset S1 (15 Nov 2026). Deleted with the series.

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
  var VERSION = '0.1.0';
  var WORKER = 'https://ix-legacy-sunset.jeff-2cd.workers.dev';               // HC-P-LS1-6
  var PFX = 'ls-';                                                              // HC-P-LS1-7
  var WF_RE = /^https?:\/\/(cdn\.prod\.website-files\.com|assets\.website-files\.com|assets-global\.website-files\.com|uploads-ssl\.webflow\.com|global-uploads\.webflow\.com)\//i; // HC-P-LS1-4
  var UC_RE = /^(https?:\/\/[a-z0-9.-]*(?:ucarecd\.net|ucarecdn\.com))\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\//i;
  var MIN_W = 992;

  if (window.__lsCapture) { window.__lsCapture.toggle(); return; }

  var S = { item: null, cap: null, showing: 'live', busy: false, holder: null, lstyle: undefined };

  // ── styles (scoped, own names; the public page has no ix-buttons) ────────
  var css = '' +
    '.lsx{position:fixed;right:16px;bottom:16px;z-index:2147483000;width:380px;max-height:80vh;overflow:auto;background:#fff;color:#1d2525;' +
    'border:1px solid #d9d4c7;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.18);font:13px/1.45 "DM Sans",system-ui,sans-serif}' +
    '.lsx *{box-sizing:border-box}' +
    '.lsx-h{padding:12px 14px 8px;border-bottom:1px solid #eee9dc}' +
    '.lsx-k{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8a8170;display:flex;justify-content:space-between}' +
    '.lsx-t{font:600 15px/1.3 Fraunces,Georgia,serif;color:#1A3A3A;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.lsx-x{cursor:pointer;color:#8a8170;background:none;border:0;font-size:14px;padding:0}' +
    '.lsx-b{padding:10px 14px}' +
    '.lsx-row{display:flex;gap:8px;margin:2px 0 10px}' +
    '.lsx-btn{flex:0 0 108px;width:108px;height:32px;border-radius:8px;border:1px solid #1A3A3A;background:#fff;color:#1A3A3A;font:600 12px "DM Sans",system-ui,sans-serif;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.lsx-btn.pri{background:#1A3A3A;color:#fff}' +
    '.lsx-btn[disabled]{opacity:.35;cursor:default}' +
    '.lsx-st{padding:8px 10px;border-radius:8px;background:#FAF9F5;border-left:3px solid #C4A35A;margin-bottom:8px}' +
    '.lsx-st.bad{border-left-color:#c0392b;background:#fdf1ef}' +
    '.lsx-st.ok{border-left-color:#2e7d5b;background:#eef7f2}' +
    '.lsx-l{margin:0;padding:0;list-style:none}' +
    '.lsx-l li{display:flex;justify-content:space-between;gap:10px;padding:3px 0;border-bottom:1px dotted #eee9dc}' +
    '.lsx-l li span:last-child{font-variant-numeric:tabular-nums;color:#1A3A3A;font-weight:600;text-align:right}' +
    '.lsx-w{color:#a0521d}' +
    '.lsx-a{color:#1A3A3A;text-decoration:underline;cursor:pointer;background:none;border:0;padding:0;font:inherit}' +
    '.lsx-bar{height:6px;border-radius:3px;background:#eee9dc;overflow:hidden;margin:8px 0}' +
    '.lsx-bar i{display:block;height:100%;width:40%;background:linear-gradient(90deg,#C4A35A,#1A3A3A,#C4A35A);animation:lsxrun 1.1s linear infinite}' +
    '@keyframes lsxrun{from{transform:translateX(-100%)}to{transform:translateX(250%)}}' +
    '.lsx-ov{position:fixed;inset:0;z-index:2147483001;background:rgba(20,30,30,.45);display:flex;align-items:center;justify-content:center}' +
    '.lsx-m{width:440px;background:#fff;border-radius:12px;padding:18px 20px;font:13px/1.5 "DM Sans",system-ui,sans-serif;color:#1d2525;box-shadow:0 20px 60px rgba(0,0,0,.3)}' +
    '.lsx-m h3{margin:0 0 8px;font:600 17px Fraunces,Georgia,serif;color:#1A3A3A}' +
    '.lsx-m ul{margin:6px 0 12px 18px;padding:0}' +
    '.lsx-flag{position:fixed;left:16px;bottom:16px;z-index:2147483000;padding:6px 12px;border-radius:999px;font:600 12px "DM Sans",system-ui,sans-serif;color:#fff;background:#1A3A3A}' +
    '.lsx-flag.live{background:#8a8170}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var panel = document.createElement('div'); panel.className = 'lsx';
  var flag = document.createElement('div'); flag.className = 'lsx-flag live'; flag.textContent = 'Showing: live old layout';
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
        if (!r.ok || !j || !j.ok) throw new Error((j && j.error) || ('The Worker answered ' + r.status + '.'));
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
    var legacy = p.legacy, stats = { scripts: 0, hidden: 0, uc: 0, wf: 0, other: [], svg: 0, interactions: 0, forms: 0, ids: 0 };
    var pairs = [], keptLive = new Set(), classes = new Set(), wfImages = new Map();

    function cl(live) {
      if (live.nodeType === 3) return document.createTextNode(live.nodeValue);
      if (live.nodeType !== 1) return null;
      var tag = live.tagName.toLowerCase();
      if (tag === 'script' || tag === 'noscript') { stats.scripts++; return null; }
      if (live.classList && live.classList.contains('w-condition-invisible')) { stats.hidden++; return null; }
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
        var m = /url\(["']?([^"')]+)["']?\)/i.exec(bg);
        if (m) picture(live, m[1], sizeFor(live, 0), function (v) { c.style.backgroundImage = 'url("' + v + '")'; });
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
      return text.replace(/url\(\s*["']?([^"')]+)["']?\s*\)/gi, function (m, u) {
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
        if (fam && usedFamilies.has(fam) && WF_RE.test((/url\(["']?([^"')]+)/.exec(r.cssText) || [])[1] || '')) ff.push(fixUrls(r.cssText));
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
    flag.className = 'lsx-flag'; flag.textContent = 'Showing: capture (saved state)';
    render();
  }
  function showLive() {
    var p = parts(); if (p.err) return;
    if (S.holder) S.holder.style.display = 'none';
    if (S.lstyle === undefined || S.lstyle === null) p.legacy.removeAttribute('style'); else p.legacy.setAttribute('style', S.lstyle);
    S.showing = 'live';
    flag.className = 'lsx-flag live'; flag.textContent = 'Showing: live old layout';
    render();
  }

  // ── panel ─────────────────────────────────────────────────────────────────
  var msg = null;   // { kind: ''|'ok'|'bad', html }
  function render() {
    var it = S.item, c = S.cap;
    var h = '<div class="lsx-h"><div class="lsx-k"><span>Legacy Sunset · v' + VERSION + '</span><button class="lsx-x" data-a="close" title="Close">✕</button></div>' +
      '<div class="lsx-t">' + esc(it ? it.name : 'Old newsletter') + '</div></div><div class="lsx-b">';
    if (msg) h += '<div class="lsx-st ' + (msg.kind || '') + '">' + msg.html + '</div>';
    if (S.busy) h += '<div class="lsx-bar"><i></i></div>';
    var canSave = !!(it && it.usesLegacy && c && !S.busy);
    h += '<div class="lsx-row">' +
      '<button class="lsx-btn" data-a="capture"' + (S.busy || !it || !it.usesLegacy ? ' disabled' : '') + '>' + (c ? 'Capture again' : 'Capture') + '</button>' +
      '<button class="lsx-btn" data-a="toggle"' + (!c || S.busy ? ' disabled' : '') + '>' + (S.showing === 'cap' ? 'Show live' : 'Show capture') + '</button>' +
      '<button class="lsx-btn pri" data-a="save"' + (canSave ? '' : ' disabled') + '>Save</button></div>';
    if (c) {
      var s = c.stats;
      h += '<ul class="lsx-l">' +
        '<li><span>Size</span><span>' + kb(c.html.length) + '</span></li>' +
        '<li><span>Style rules copied</span><span>' + c.css.rules + '</span></li>' +
        '<li><span>Uploadcare pictures (raw + size)</span><span>' + s.uc + '</span></li>' +
        '<li><span>Webflow-hosted pictures to rehost</span><span>' + c.images.length + '</span></li>' +
        '<li><span>Hidden blocks left out</span><span>' + s.hidden + '</span></li>' +
        '<li><span>Scripts left out</span><span>' + s.scripts + '</span></li>' +
        '<li><span>Forms / interactions kept</span><span>' + s.forms + ' / ' + s.interactions + '</span></li>' +
        '<li><span>CMS fields shown (by value)</span><span>' + (S.fieldsCount == null ? '…' : S.fieldsCount) + '</span></li></ul>';
      var warn = [];
      if (s.other.length) warn.push(s.other.length + ' picture(s) on another host stay as they are: ' + esc(s.other.slice(0, 2).join(', ')));
      if (s.svg) warn.push(s.svg + ' Uploadcare SVG(s) left as stored (SVG gets no size).');
      if (c.css.unreadable.length) warn.push('Stylesheet(s) that could not be read: ' + esc(c.css.unreadable.join(', ')));
      if (warn.length) h += '<p class="lsx-w">' + warn.join('<br>') + '</p>';
      h += '<p>Check it: toggle <b>Show live</b> / <b>Show capture</b> and scroll the whole issue. For phone width, turn on Chrome’s device toolbar (Cmd+Shift+M) and toggle again.</p>';
    } else if (it && it.usesLegacy) {
      h += '<p>Capture takes the old layout as it shows now and puts it in its place, so you can compare on this page. Nothing is saved until you press Save.</p>';
    }
    if (it && !it.usesLegacy && it.saved && !it.saved.undoneAt) h += '<p>Saved ' + esc(new Date(it.saved.at).toLocaleString()) + '. <button class="lsx-a" data-a="undo">Undo (turn uses-legacy back on)</button></p>';
    h += '</div>';
    panel.innerHTML = h;
  }
  function say(kind, html) { msg = { kind: kind, html: html }; render(); }

  panel.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    var a = b.getAttribute('data-a');
    if (a === 'close') return api.toggle();
    if (a === 'toggle') return S.showing === 'cap' ? showLive() : showCap();
    if (a === 'capture') return doCapture();
    if (a === 'save') return confirmSave();
    if (a === 'undo') return doUndo();
  });

  function doCapture() {
    S.busy = true; S.fieldsCount = null; say('', 'Capturing…');
    var p;
    try { p = capture(); } catch (e) { S.busy = false; return say('bad', esc(e.message)); }
    p.then(function () {
      S.busy = false; msg = null; showCap();
      say('ok', 'Captured. The page now shows the capture in place of the old layout.');
      return call('/fields', { id: S.item.id, html: S.cap.html }).then(function (j) {
        S.fieldsCount = j.collections.reduce(function (n, c) { return n + c.fields.length; }, 0); render();
      }, function (e) { S.fieldsCount = 'failed'; render(); console.warn('[ls-capture] /fields:', e.message); });
    }).catch(function (e) { S.busy = false; say('bad', 'Capture failed: ' + esc(e.message)); });
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

  function doSave() {
    S.busy = true; say('', 'Saving: rehosting pictures, writing Web Render HTML, reading it back, then turning uses-legacy off…');
    call('/save', { id: S.item.id, html: S.cap.html, images: S.cap.images }).then(function (j) {
      S.busy = false; S.item.usesLegacy = false; S.item.saved = j.saved;
      say('ok', 'Saved and read back: ' + j.readBack.webHtmlCharacters.toLocaleString() + ' characters, ' + j.saved.rehosted.length +
        ' picture(s) rehosted, uses-legacy off. Reload the page to see what readers now get.');
    }, function (e) { S.busy = false; say('bad', 'Not saved: ' + esc(e.message)); });
  }

  function doUndo() {
    S.busy = true; say('', 'Turning uses-legacy back on…');
    call('/undo', { id: S.item.id }).then(function () {
      S.busy = false; S.item.usesLegacy = true; if (S.item.saved) S.item.saved.undoneAt = new Date().toISOString();
      say('ok', 'uses-legacy is back on. Reload to see the old layout again.');
    }, function (e) { S.busy = false; say('bad', 'Undo failed: ' + esc(e.message)); });
  }

  var api = { toggle: function () { var hide = panel.style.display !== 'none'; panel.style.display = hide ? 'none' : ''; flag.style.display = hide ? 'none' : ''; } };
  window.__lsCapture = api;

  // ── start ─────────────────────────────────────────────────────────────────
  render();
  var p0 = parts();
  if (p0.err) { say('bad', esc(p0.err)); return; }
  var slug = location.pathname.split('/').filter(Boolean).pop() || '';
  S.busy = true; say('', 'Looking up this newsletter…');
  call('/lookup?slug=' + encodeURIComponent(slug)).then(function (j) {
    S.busy = false; S.item = j.item; msg = null;
    if (!j.item.usesLegacy && !(j.item.saved && !j.item.saved.undoneAt)) say('bad', 'uses-legacy is off on this newsletter, so there is nothing to capture.');
    else if (!j.item.usesLegacy) say('ok', 'Already saved.');
    else render();
  }, function (e) { S.busy = false; say('bad', esc(e.message)); });
})();
