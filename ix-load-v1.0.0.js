// ix-load-v1.0.0.js
// ============================================================
// INBXIFY · the page loader (Agent Groundwork G1, Part A)
//
// v1.0.0 (17 Nov 2026, Agent Groundwork G1) — FIRST BUILD, from Agent-Groundwork-Scoping-v0_2.md §2.
//
// WHAT IT IS
//   The one permanent script tag an operator page carries, twice: once at the end of the head code, once at the
//   end of the body code. It never changes when a module ships. Each tag names its page and its slot:
//     <script src="…/inbxify-site-code@main/ix-load-v1.0.0.js" data-ix-page="quill" data-ix-slot="head"></script>
//     <script src="…/inbxify-site-code@main/ix-load-v1.0.0.js" data-ix-page="quill" data-ix-slot="body"></script>
//
// WHAT IT DOES
//   1. Works out which branch to read: main, or a preview branch for this browser tab only (see PREVIEW).
//   2. Writes one script tag for that page and slot's version list:  loaders/ix-load-<page>-<slot>.js
//      That file is generated from manifests/<page>.json by tools/build-loaders.mjs (never edited by hand).
//   3. The version list calls IxLoad.run(list), and this file writes the page's <link> and <script> tags in
//      place, in list order, while the page is still loading. So every module runs in the same order as when
//      its tag was typed in Webflow, and before DOMContentLoaded. No module needs changing.
//
// WHY TWO FILES AND NOT ONE
//   jsDelivr tells browsers to keep any file read from a branch name (…@main/…) for 7 days, and a purge only
//   clears jsDelivr's own copy, not a browser's. A version list read straight from the page tag would therefore
//   reach a browser up to a week late, and so would a rollback. This file is a versioned name (it never changes,
//   so a long browser copy is right), and it asks for the version list with a time stamp on the address, so the
//   browser asks jsDelivr again once the minute changes. Going live and rolling back reach every browser within about
//   a minute of the purge.
//
// PREVIEW (the staging answer; tests run on www.inbxify.com by ruling)
//   ?ixbranch=<branch> on the page address makes both tags read that branch's version lists and that branch's
//   files, for this browser tab only (sessionStorage). It stays on as the tab moves between loader pages.
//   ?ixbranch=off turns it off. Branch names must start with one of PREFIXES. While a preview is on, a small
//   label at the bottom left of the page says so, with "Exit preview". Everyone else keeps seeing main.
//
// IF SOMETHING FAILS
//   · The version list does not arrive (network, or the preview branch has no list for this page): a plain red
//     line at the top of the page says the page's code did not load, and the console names the address.
//   · This file is ever loaded late (async, defer, or added by another script): it does not use document.write
//     (which would wipe the page); it adds the tags to the page one by one, still in list order.
//
// PATHWAYS: cdn.jsdelivr.net only (the repo this file was itself loaded from; nothing is typed here).
// COMPANIONS: tools/build-loaders.mjs, tools/verify-cdn.mjs, .github/workflows/loaders.yml, manifests/*.json.
// HARDCODING (provisional): HC-P-AG-1 PREFIXES (the allowed preview branch prefixes); HC-P-AG-4 the words W;
//   HC-P-AG-5 LIVE_BUCKET_MS (how often a browser asks again for the version list).
// ============================================================
(function () {
  'use strict';

  var VERSION = '1.0.0', FILE = 'ix-load-v1.0.0.js';
  var PREFIXES = ['reskin-', 'agent-', 'jeff-'];   // HC-P-AG-1
  var LIVE_BUCKET_MS = 60000;                      // HC-P-AG-5
  var KEY = 'ixbranch';
  var W = {                                        // HC-P-AG-4
    preview: 'Preview: ', exit: 'Exit preview',
    failed: 'This page\u2019s code did not load. Reload the page. If it keeps happening, tell inbxify.',
    failedPreview: 'Preview branch \u201c{b}\u201d has no code for this page ({p}).',
    badName: 'Preview name not allowed: '
  };

  var me = document.currentScript;
  if (!me) { if (window.console) console.error('[ix-load] no currentScript; nothing loaded'); return; }
  var page = me.getAttribute('data-ix-page'), slot = me.getAttribute('data-ix-slot');
  var src = /^(.*\/gh\/[^\/@]+\/[^\/@]+)@([^\/]+)\//.exec(me.src || '');
  if (!page || !/^[a-z0-9-]+$/.test(page) || (slot !== 'head' && slot !== 'body') || !src) {
    console.error('[ix-load] the tag needs data-ix-page, data-ix-slot="head|body" and a jsDelivr /gh/ address', me);
    return;
  }
  var root = src[1], liveRef = src[2], id = page + ':' + slot;

  function allowed(b) {
    if (!/^[A-Za-z0-9._-]{1,80}$/.test(b)) return false;
    for (var i = 0; i < PREFIXES.length; i++) if (b.indexOf(PREFIXES[i]) === 0 && b.length > PREFIXES[i].length) return true;
    return false;
  }

  // ── which branch ─────────────────────────────────────────
  var preview = null, refused = null;
  try {
    var q = new URLSearchParams(location.search).get(KEY);
    if (q !== null) {
      if (q === 'off' || q === '') sessionStorage.removeItem(KEY);
      else if (allowed(q)) sessionStorage.setItem(KEY, q);
      else refused = q;
    }
    preview = sessionStorage.getItem(KEY);
    if (preview && !allowed(preview)) { sessionStorage.removeItem(KEY); preview = null; }
  } catch (e) { preview = null; }
  var ref = preview || liveRef;
  var base = root + '@' + ref + '/';

  // ── shared state (both tags on a page use one IxLoad) ────
  var L = window.IxLoad = window.IxLoad || { version: VERSION, file: FILE, slots: {} };
  L.ref = ref; L.preview = preview; L.live = liveRef;
  var late = document.readyState !== 'loading' || me.async || me.defer;
  L.slots[id] = { page: page, slot: slot, base: base, late: late, ran: false, files: [] };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function abs(u, b) { return /^https?:\/\//.test(u) ? u : b + u; }
  function tagOf(it, b) {
    var a = {}, k, name = 'script';
    if (it.k === 'css') { name = 'link'; a.rel = 'stylesheet'; a.href = abs(it.u, b); }
    else if (it.k === 'js') { a.src = abs(it.u, b); }
    else if (it.k === 'link') { name = 'link'; }
    else return null;
    if (it.a) for (k in it.a) if (Object.prototype.hasOwnProperty.call(it.a, k)) a[k] = it.a[k];
    return { name: name, attrs: a };
  }
  function html(t) {
    var s = '<' + t.name, k;
    for (k in t.attrs) s += t.attrs[k] === true ? ' ' + k : ' ' + k + '="' + esc(t.attrs[k]) + '"';
    return s + (t.name === 'script' ? '><\/script>' : '>');
  }
  function node(t, where) {
    var el = document.createElement(t.name), k;
    for (k in t.attrs) el.setAttribute(k, t.attrs[k] === true ? '' : t.attrs[k]);
    if (t.name === 'script') el.async = false;            // added scripts still run in list order
    (where === 'head' ? document.head : (document.body || document.head)).appendChild(el);
    return el;
  }

  // ── the version list calls this ──────────────────────────
  L.run = function (list) {
    var st = list && L.slots[list.page + ':' + list.slot];
    if (!st || st.ran || !list.items) return;
    st.ran = true;
    var out = '', i, t;
    for (i = 0; i < list.items.length; i++) {
      t = tagOf(list.items[i], st.base);
      if (!t) continue;
      st.files.push(t.attrs.src || t.attrs.href);
      if (st.late || document.readyState !== 'loading') node(t, st.slot); else out += html(t);
    }
    if (out) document.write(out);
  };

  // ── failure and preview notes ────────────────────────────
  function whenBody(fn) {
    if (document.body) fn(); else document.addEventListener('DOMContentLoaded', fn);
  }
  function bar(text) {
    whenBody(function () {
      if (document.querySelector('[data-ix-load-failed]')) return;
      var d = document.createElement('div');
      d.setAttribute('data-ix-load-failed', '');
      d.setAttribute('role', 'alert');
      d.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#8B1A1A !important;color:#fff !important;' +
        'font:500 14px/1.4 system-ui,-apple-system,sans-serif;padding:10px 16px;text-align:left';
      d.textContent = text;
      document.body.appendChild(d);
    });
  }
  L.fail = function (which, url) {
    var st = L.slots[which]; if (!st || st.failed) return;
    st.failed = true;
    console.error('[ix-load] version list did not load for ' + which + ': ' + url);
    bar(L.preview ? W.failedPreview.replace('{b}', L.preview).replace('{p}', which) : W.failed);
  };
  L.check = function (which, url) { var st = L.slots[which]; if (st && !st.ran) L.fail(which, url); };

  function badge() {
    whenBody(function () {
      if (document.querySelector('[data-ix-preview]')) return;
      var off = new URL(location.href); off.searchParams.set(KEY, 'off');
      var d = document.createElement('div');
      d.setAttribute('data-ix-preview', L.preview || '');
      d.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483646;background:#1A3A3A !important;color:#fff !important;' +
        'font:500 12px/1 system-ui,-apple-system,sans-serif;padding:8px 12px;border-radius:999px;border:1px solid #C4A35A;' +
        'max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      var txt = refused && !L.preview ? W.badName + refused : W.preview + L.preview;
      d.appendChild(document.createTextNode(txt + ' \u00b7 '));
      var a = document.createElement('a');
      a.href = off.toString(); a.textContent = W.exit;
      a.style.cssText = 'color:#C4A35A !important;background:transparent !important;text-decoration:underline;font:inherit';
      d.appendChild(a);
      document.body.appendChild(d);
    });
  }
  if (preview || refused) badge();
  if (refused) console.warn('[ix-load] ' + W.badName + refused + ' (must start with ' + PREFIXES.join(', ') + ')');

  // ── ask for the version list ─────────────────────────────
  var stamp = preview ? Date.now() : Math.floor(Date.now() / LIVE_BUCKET_MS);
  var listUrl = base + 'loaders/ix-load-' + page + '-' + slot + '.js?t=' + stamp;
  L.slots[id].list = listUrl;
  if (!late) {
    document.write(
      '<script src="' + esc(listUrl) + '" onerror="IxLoad.fail(\'' + id + '\',this.src)"><\/script>' +
      '<script>IxLoad.check(\'' + id + '\',\'' + esc(listUrl) + '\')<\/script>'
    );
  } else {
    console.warn('[ix-load] ' + id + ' loaded late (async, defer or injected); tags are added without document.write');
    var el = document.createElement('script');
    el.src = listUrl; el.async = false;
    el.onerror = function () { L.fail(id, listUrl); };
    el.onload = function () { L.check(id, listUrl); };
    (document.head || document.documentElement).appendChild(el);
  }
})();
