/* ix-perf-site-v1.0.0.js
   INBXIFY · the site collector's page script (Performance Report S2 · build step 1, 16 Nov 2026)

   WHAT IT DOES. On every title site page (NEWSLETTERS, ARTICLES, ARCHIVES, DIRECTORIES and franchise pages) it
   counts, for our own store (the ix-perf Worker, D1 ix-perf), without GA4 (S1 ruling 1):
     · the page opened, tied to a visit and a lasting reader code (ruling 16; 30-minute visit rule, ruling 8);
     · engaged time on the page (ruling 8): a second counts when the tab is in front, the window has focus, and the
       reader moved, scrolled, tapped or typed in the last 60 seconds;
     · every ad on the page and how long it stayed on screen (ruling 13): the longest unbroken stretch and the total,
       with the share of the ad that counts as "on screen" taken from the Worker's one setting (ruling 12; Jeff,
       16 Nov: half the ad, half a second). The Worker decides "seen" from the same setting;
     · every click on a link or button (ruling 2), with its link type (ruling 7: CALL, TEXT, EMAIL, SOCIAL, WEB,
       NO LINK), and, inside an ad, the ad, advertiser, spot and shape.
   Every message carries the publisher and the title, so no row is missing them (the ix-site-ads gap in the seed).

   HOW IT FINDS ADS. Any element with data-ixp-ad (written by the issue templates through ix-issue-data v1.0.187,
   and by ix-site-ads v1.0.14 on every ad it draws or fills). The spot is the element's own data-ixp-slot, else the
   nearest one above it (a rotated banner keeps its new spot's number). Issues compiled before the markers are still
   counted, by their template classes (.nlw-ba > a, .nlw-ha, .nlw-sponsorad > a, .nlw-txa-card), with no ad id and
   the link's host as the identity.

   WHEN IT SENDS (navigator.sendBeacon, text body, so no preflight; fetch keepalive where sendBeacon is missing):
     open    once, when the shell says the page is drawn ("ixs:drawn" / IXShell.drawn), or after 5 s without it.
             The answer carries the seen setting; until it arrives the default (half) is used.
     end     each time the tab goes to the background or the page closes: engaged time so far and every ad's times
             so far. The Worker keeps the largest numbers, so several ends from one page are safe.
     click   at once, on each click.

   WHAT IT KEEPS IN THE BROWSER (localStorage; a per-viewer convenience): ixp-r the reader code (lasting, ruling
   16, privacy-policy line drafted in S2), ixp-v the visit { id, last }. Where storage is refused, codes live for this
   page only.

   SWITCHES. window.IX_PERF = { url: '...' } before this file sets the Worker address. window.IX_PERF = false turns
   the script off. ?ixpdebug=1 prints each message in the console.

   LOAD: in the site-wide body code, after ix-shell. Needs nothing else on the page.

   HARDCODING (provisional, for the S2 delta): HC-P-PR2-6 the Worker address default; HC-P-PR2-7 the 30-minute visit
   rule (ruling 8), the 60-second engaged idle rule, the 5-second open fallback; HC-P-PR2-8 the social host list and
   the search host list; HC-P-PR2-9 the device widths (768 / 1080, the site's own break); HC-P-PR2-10 the fallback
   ad selectors (the templates' class names).
*/
(function () {
  'use strict';
  if (window.IXPerf || window.IX_PERF === false) return;

  var VERSION = '1.0.0';
  var CFG = window.IX_PERF || {};
  var URL_BASE = String(CFG.url || 'https://ix-perf.jeff-2cd.workers.dev').replace(/\/+$/, '');   // HC-P-PR2-6
  var VISIT_MS = 30 * 60 * 1000, IDLE_MS = 60 * 1000, OPEN_WAIT_MS = 5000;                         // HC-P-PR2-7
  var SOCIAL = /(^|\.)(facebook|fb|instagram|twitter|x|tiktok|linkedin|youtube|youtu|pinterest|nextdoor|threads|snapchat|yelp)\.(com|be|net)$/i;   // HC-P-PR2-8
  var SEARCH = /(^|\.)(google|bing|yahoo|duckduckgo|ecosia|baidu|yandex)\./i;                    // HC-P-PR2-8
  var FALLBACK = [['.nlw-ba > a', 'banner'], ['.nlw-ha', 'house'], ['.nlw-sponsorad > a', 'sponsor'], ['.nlw-txa-card', 'text']];   // HC-P-PR2-10
  var DEBUG = /[?&]ixpdebug=1\b/.test(location.search);

  var doc = document;
  var seen = { ratio: 0.5, ms: 500 };   // replaced by the Worker's answer to 'open'

  function log() { if (DEBUG && window.console) console.info.apply(console, ['[ix-perf]'].concat([].slice.call(arguments))); }
  function rid() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, ''); } catch (e) {}
    var s = ''; for (var i = 0; i < 4; i++) s += Math.floor(Math.random() * 0x100000000).toString(16);
    return (s + Date.now().toString(16)).slice(0, 32);
  }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }

  /* ── reader and visit ── */
  var now0 = Date.now();
  var readerCode = store('ixp-r'), readerNew = 0;
  if (!readerCode || !/^[A-Za-z0-9]{16,64}$/.test(readerCode)) { readerCode = rid(); readerNew = 1; store('ixp-r', readerCode); }
  var visit = null, visitFirst = 0;
  try { visit = JSON.parse(store('ixp-v') || 'null'); } catch (e) { visit = null; }
  if (!visit || !visit.id || !(now0 - (visit.last || 0) < VISIT_MS)) { visit = { id: rid(), last: now0 }; visitFirst = 1; }
  function touchVisit() { visit.last = Date.now(); store('ixp-v', JSON.stringify(visit)); }
  touchVisit();

  var pv = rid();

  /* ── where the reader came from ── */
  var params = {};
  try { new URLSearchParams(location.search).forEach(function (v, k) { params[k.toLowerCase()] = v; }); } catch (e) {}
  var refHost = ''; try { refHost = doc.referrer ? new URL(doc.referrer).host : ''; } catch (e) {}
  function refKind() {
    if (String(params.utm_medium || '').toLowerCase() === 'email') return 'email';
    if (!refHost) return 'direct';
    if (refHost === location.host) return 'internal';
    if (/(^|\.)inbxify\.com$/i.test(refHost)) return /^splash\./i.test(refHost) ? 'email' : 'internal';
    if (SEARCH.test(refHost)) return 'search';
    if (SOCIAL.test(refHost)) return 'social';
    return 'other';
  }
  function device() { var w = window.innerWidth || 1200; return w < 768 ? 'phone' : w < 1080 ? 'tablet' : 'desktop'; }   // HC-P-PR2-9

  /* ── page context (from the shell) ── */
  var ctx = { publisher: '', title: '', titleAdmin: '', kind: '', issueId: '', issueCode: String(params.utm_campaign || '') };
  function readCtx(d) {
    var site = (d && d.site) || {};
    var kindAttr = (doc.querySelector('[data-kind]') || { getAttribute: function () { return ''; } }).getAttribute('data-kind') || '';
    ctx.kind = String((d && d.kind) || kindAttr || 'other').toLowerCase();
    ctx.title = (site.title && site.title.slug) || (d && d.title) || '';
    ctx.titleAdmin = (site.title && site.title.adminId) || '';
    ctx.publisher = (site.publisher && site.publisher.slug) || '';
    if (site.issue && site.issue.id) ctx.issueId = site.issue.id;   // ix-issue-data v1.0.187
  }
  function base(t) {
    return { v: VERSION, t: t, pv: pv, at: Date.now(), reader: readerCode, visit: visit.id,
             publisher: ctx.publisher, title: ctx.title, titleAdmin: ctx.titleAdmin, kind: ctx.kind,
             issueId: ctx.issueId, issueCode: ctx.issueCode };
  }

  /* ── sending ── */
  function send(msg, wantAnswer) {
    var body = JSON.stringify(msg), url = URL_BASE + '/c';
    log(msg.t, msg);
    if (wantAnswer && window.fetch) {
      return fetch(url, { method: 'POST', body: body, keepalive: true, credentials: 'omit', headers: { 'Content-Type': 'text/plain' } })
        .then(function (r) { return r.json(); }).catch(function () { return null; });
    }
    try { if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }))) return null; } catch (e) {}
    try { if (window.fetch) fetch(url, { method: 'POST', body: body, keepalive: true, credentials: 'omit', headers: { 'Content-Type': 'text/plain' } }).catch(function () {}); } catch (e) {}
    return null;
  }

  /* ── engaged time ── */
  var engaged = 0, lastInput = Date.now();
  ['scroll', 'mousemove', 'keydown', 'touchstart', 'pointerdown', 'wheel'].forEach(function (ev) {
    window.addEventListener(ev, function () { lastInput = Date.now(); }, { passive: true, capture: true });
  });
  function active() {
    return doc.visibilityState === 'visible' && (!doc.hasFocus || doc.hasFocus()) && (Date.now() - lastInput) < IDLE_MS;
  }
  setInterval(function () {
    if (!active()) return;
    engaged += 1000;
    if (engaged % 15000 === 0) touchVisit();
  }, 1000);

  /* ── ads ── */
  var ads = [], byEl = (typeof WeakMap === 'function') ? new WeakMap() : null, io = null;
  function shapeOf(el, dflt) { return el.getAttribute('data-ixp-shape') || dflt || 'banner'; }
  function slotOf(el) { var s = el.closest ? el.closest('[data-ixp-slot]') : null; return s ? s.getAttribute('data-ixp-slot') || '' : ''; }
  function hrefOf(el) { var a = el.tagName === 'A' ? el : el.querySelector && el.querySelector('a[href]'); return a ? a.href || '' : ''; }
  function hostOf(u) { try { return new URL(u, location.href).host; } catch (e) { return ''; } }
  function onScreen(rec) { return rec.inView && doc.visibilityState === 'visible'; }
  function closeRun(rec, t) {
    if (rec.since == null) return;
    var run = t - rec.since; rec.since = null;
    rec.total += run; if (run > rec.max) rec.max = run;
  }
  function openRun(rec, t) { if (rec.since == null && onScreen(rec)) rec.since = t; }
  function track(el, dflt) {
    if (!el || (byEl && byEl.has(el)) || el._ixpTracked) return;
    var rec = { el: el, n: ads.length, dflt: dflt, at: Date.now(), inView: false, since: null, max: 0, total: 0 };
    ads.push(rec); if (byEl) byEl.set(el, rec); else el._ixpTracked = rec;
    if (io) io.observe(el);
  }
  function recOf(el) { return byEl ? byEl.get(el) : el._ixpTracked; }
  function makeIO() {
    if (!('IntersectionObserver' in window)) return null;
    var th = [0, seen.ratio, 1].filter(function (x, i, a) { return a.indexOf(x) === i; }).sort();
    return new IntersectionObserver(function (entries) {
      var t = Date.now();
      entries.forEach(function (en) {
        var rec = recOf(en.target); if (!rec) return;
        rec.inView = en.isIntersecting && en.intersectionRatio >= seen.ratio - 0.001;
        if (rec.inView) openRun(rec, t); else closeRun(rec, t);
      });
    }, { threshold: th });
  }
  function scan(root) {
    root = root || doc;
    if (!root.querySelectorAll) return;
    if (root.getAttribute && root.hasAttribute('data-ixp-ad')) track(root);
    Array.prototype.forEach.call(root.querySelectorAll('[data-ixp-ad]'), function (el) { track(el); });
    FALLBACK.forEach(function (f) {
      Array.prototype.forEach.call(root.querySelectorAll(f[0]), function (el) {
        if (el.hasAttribute('data-ixp-ad') || (el.closest && el.closest('[data-ixp-ad]'))) return;
        track(el, f[1]);
      });
    });
  }
  function startAds() {
    io = makeIO();
    ads.forEach(function (rec) { if (io) io.observe(rec.el); });
    scan(doc);
    if ('MutationObserver' in window) {
      new MutationObserver(function (list) {
        list.forEach(function (m) {
          if (m.type === 'attributes') { var r = recOf(m.target); if (!r) track(m.target); return; }
          Array.prototype.forEach.call(m.addedNodes || [], function (n) { if (n.nodeType === 1) scan(n); });
        });
      }).observe(doc.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-ixp-ad'] });
    }
  }
  function adList(t) {
    return ads.map(function (rec) {
      var running = rec.since != null ? t - rec.since : 0;
      var el = rec.el, marked = el.hasAttribute('data-ixp-ad');
      return { n: rec.n, at: rec.at,
               ad: marked ? el.getAttribute('data-ixp-ad') : '', adv: marked ? (el.getAttribute('data-ixp-adv') || '') : '',
               slot: slotOf(el) || el.getAttribute('data-ix-rot-from') || '', shape: shapeOf(el, rec.dflt),
               host: hostOf(hrefOf(el)),
               maxMs: Math.max(rec.max, running), totalMs: rec.total + running };
    });
  }

  /* ── leaving and coming back ── */
  var opened = false;
  function end() {
    if (!opened) return;
    var t = Date.now();
    var msg = base('end'); msg.engagedMs = engaged; msg.ratio = seen.ratio; msg.ads = adList(t);
    send(msg, false);
    touchVisit();
  }
  doc.addEventListener('visibilitychange', function () {
    var t = Date.now();
    if (doc.visibilityState === 'hidden') { ads.forEach(function (r) { closeRun(r, t); }); end(); }
    else { lastInput = t; ads.forEach(function (r) { openRun(r, t); }); }
  });
  window.addEventListener('pagehide', end);

  /* ── clicks ── */
  function linkType(href) {
    if (!href) return 'NO LINK';
    var h = String(href).trim().toLowerCase();
    if (h.indexOf('tel:') === 0) return 'CALL';
    if (h.indexOf('sms:') === 0) return 'TEXT';
    if (h.indexOf('mailto:') === 0) return 'EMAIL';
    if (/^https?:/.test(h)) return SOCIAL.test(hostOf(h)) ? 'SOCIAL' : 'WEB';
    if (h.charAt(0) === '#' || h.indexOf('javascript:') === 0) return 'NO LINK';
    return 'WEB';
  }
  function onClick(e) {
    if (!opened) return;
    var tgt = e.target && e.target.closest ? e.target.closest('a, button, [role="button"]') : null;
    if (!tgt) return;
    var href = tgt.tagName === 'A' ? (tgt.getAttribute('href') ? tgt.href : '') : '';
    var adEl = tgt.closest('[data-ixp-ad]');
    if (!adEl) { for (var i = 0; i < FALLBACK.length && !adEl; i++) { adEl = tgt.closest(FALLBACK[i][0]); if (adEl) adEl._ixpShape = FALLBACK[i][1]; } }
    var msg = base('click');
    msg.id = rid();
    msg.dest = href; msg.linkType = linkType(href);
    msg.internal = href && hostOf(href) === location.host ? 1 : 0;
    msg.label = String(tgt.getAttribute('aria-label') || tgt.textContent || (tgt.querySelector('img') || {}).alt || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (adEl) {
      var marked = adEl.hasAttribute('data-ixp-ad');
      msg.ad = marked ? adEl.getAttribute('data-ixp-ad') : '';
      msg.adv = marked ? (adEl.getAttribute('data-ixp-adv') || '') : '';
      msg.slot = slotOf(adEl) || adEl.getAttribute('data-ix-rot-from') || '';
      msg.shape = marked ? shapeOf(adEl) : (adEl._ixpShape || 'banner');
    }
    send(msg, false);
  }
  doc.addEventListener('click', onClick, true);
  doc.addEventListener('auxclick', function (e) { if (e.button === 1) onClick(e); }, true);

  /* ── open ── */
  function open(d) {
    if (opened) return;
    opened = true;
    readCtx(d);
    var msg = base('open');
    msg.visitFirst = visitFirst; msg.readerNew = readerNew;
    msg.path = location.pathname; msg.refKind = refKind(); msg.refHost = refHost;
    msg.utmSource = params.utm_source || ''; msg.utmMedium = params.utm_medium || ''; msg.utmContent = params.utm_content || '';
    msg.device = device();
    var p = send(msg, true);
    if (p && p.then) p.then(function (ans) {
      if (ans && ans.seen && ans.seen.ratio > 0 && ans.seen.ratio <= 1 && ans.seen.ratio !== seen.ratio) {
        var t = Date.now();
        ads.forEach(function (r) { closeRun(r, t); r.inView = false; if (io) io.unobserve(r.el); });
        seen = { ratio: ans.seen.ratio, ms: ans.seen.ms };
        io = makeIO(); ads.forEach(function (r) { if (io) io.observe(r.el); });
      } else if (ans && ans.seen) seen.ms = ans.seen.ms;
    });
  }
  startAds();
  if (window.IXShell && window.IXShell.drawn) open(window.IXShell.drawn);
  else {
    doc.addEventListener('ixs:drawn', function (e) { open(e.detail || {}); });
    setTimeout(function () { open(window.IXShell && window.IXShell.drawn); }, OPEN_WAIT_MS);
  }

  window.IXPerf = { version: VERSION, reader: function () { return readerCode; }, visit: function () { return visit.id; },
                    pageView: pv, ads: function () { return adList(Date.now()); }, engagedMs: function () { return engaged; } };
})();
