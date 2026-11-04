// ps-shell-v1.0.0.js
// ============================================================
// INBXIFY · Publisher Portal · the shell (header, tabs, account menu,
// login check) on the PUBLISHERS template, www.inbxify.com/publisher/<slug>
//
// v1.0.0 (4 Nov 2026, Publisher Portal S4) — FIRST BUILD, from portal
//   mockup v0.18.
//
// WHAT IT DOES
//   1. Reads the page's publisher from the Embed (#ps-portal data
//      attributes bound to the PUBLISHERS item: (Self) This Item ID, name,
//      slug, Publisher Logo) and the two Worker addresses.
//   2. Waits for Memberstack, takes the login token
//      ($memberstackDom.getMemberCookie()) and asks ix-members /whoami who
//      this is. Memberstack's gate only checks the plan, not the publisher,
//      so this is the real check:
//        · staff: may view any publisher's page; the staff strip shows.
//        · a member of this publisher: the portal opens.
//        · a member of another publisher: sent to their own page.
//        · no portal at all: a plain message, nothing else drawn.
//      ix-sales checks the login again on every call, using the record's
//      own publisher, so nothing depends on this page being honest.
//   3. Draws the header (publisher logo leads, hairline, "Powered by
//      inbxify"), the six tabs and the account menu, then mounts the
//      chosen tab. Tabs register themselves:
//        PsShell.register({ key, mount(el, ctx) })
//      ctx gives: publisher {id,name,slug}, who {memberId,email,staff},
//      api(path, {method, body, label}) → { status, ok, json } against
//      ix-sales with the login token, info(payload) → the ⓘ badge HTML
//      (staff only, empty otherwise), tip(word) → a help word.
//   4. The tab in the address bar (#obligations) is kept, so a reload or a
//      shared link opens the same tab. Clicking a tab never scrolls.
//
// STANDING RULES CARRIED
//   · ⓘ on every tab in the same spot (title row, after the title), staff
//     only in the portal. "See it as: the publisher" hides it.
//   · Data the page needs is required at the source: an empty Publisher
//     Logo shows a red dashed box naming the field, not a blank.
//   · Progress on every request comes from ix-progress (head), which
//     watches every workers.dev call; each call is named with ixLabel.
//
// HARDCODING (provisional ids, for the tracker)
//   HC-P-PP4-1  TABS: the six tab keys and names (page structure, copy).
//   HC-P-PP4-2  W: the shell's words (copy, by design).
//   HC-P-PP4-3  LOGIN_PATH '/portal-login' (same page ps-login serves;
//               goes with HC-P-PP2-9).
//   Worker addresses and the inbxify logo URL are on the Embed, not here.
// ============================================================
(function () {
  'use strict';
  if (window.PsShell) return;
  var VERSION = '1.0.0';
  var LOGIN_PATH = '/portal-login';                                    // HC-P-PP4-3
  var TABS = [                                                         // HC-P-PP4-1
    { key: 'home', name: 'Home' },
    { key: 'tasks', name: 'Open tasks' },
    { key: 'upload', name: 'Upload' },
    { key: 'ads', name: 'Ads' },
    { key: 'obligations', name: 'Obligations' },
    { key: 'reports', name: 'Reports' }
  ];
  var DEFAULT_TAB = 'obligations';
  var W = {                                                            // HC-P-PP4-2
    place: 'Publisher portal', powered: 'Powered by',
    loading: 'Opening your portal…',
    noMs: 'Login is not available right now. Refresh the page. If it keeps happening, tell your inbxify contact.',
    noAccessH: 'No portal for this login',
    noAccess: 'You are logged in as {email}, but this login is not linked to a publisher portal. Ask your inbxify contact.',
    checkFail: 'We could not check your login: {msg}. Refresh the page to try again.',
    embedBad: 'This page is missing its setup ({what}). Tell your inbxify contact.',
    noLogo: 'Publisher Logo is empty on PUBLISHERS',
    staffView: 'inbxify staff, viewing', seeAs: 'see it as', asStaff: 'inbxify staff', asMember: 'the publisher',
    unbuiltH: 'Not built yet',
    unbuilt: 'This tab is planned and not built yet. Obligations is ready now.',
    menu: [['profile', 'Profile'], ['billing', 'Billing'], ['team', 'Team'], ['contact', 'Contact inbxify']],
    soon: 'Not built yet', signOut: 'Sign out'
  };

  var root, cfg, who = null, member = null, tabs = {}, cur = null, mounted = null, booted = false;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fill(t, o) { return String(t).replace(/\{(\w+)\}/g, function (_, k) { return o[k] == null ? '' : o[k]; }); }

  // ── Memberstack ─────────────────────────────────────────────
  function waitMs(ms) {
    return new Promise(function (res) {
      var t0 = Date.now();
      (function tick() {
        if (window.$memberstackDom) return res(window.$memberstackDom);
        if (Date.now() - t0 > ms) return res(null);
        setTimeout(tick, 100);
      })();
    });
  }
  async function token() {
    var ms = window.$memberstackDom;
    if (!ms) return '';
    try { return (await ms.getMemberCookie()) || ''; } catch (e) { return ''; }
  }

  // ── calls ───────────────────────────────────────────────────
  async function call(base, path, o) {
    o = o || {};
    var t = await token();
    var init = { method: o.method || 'GET', headers: { Authorization: 'Bearer ' + t }, ixLabel: o.label || undefined };
    if (o.body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(o.body); }
    var res, j = null;
    try { res = await fetch(base + path, init); }
    catch (e) { return { status: 0, ok: false, json: { ok: false, error: 'No answer from the server. Check your connection and try again.' } }; }
    try { j = await res.json(); } catch (e) { j = { ok: false, error: 'The server sent an answer that could not be read (HTTP ' + res.status + ').' }; }
    return { status: res.status, ok: res.ok && !!(j && j.ok), json: j || {} };
  }

  // ── drawing ─────────────────────────────────────────────────
  function state(h, body) {
    root.innerHTML = '<div class="ps-state" role="alert"><h2>' + esc(h) + '</h2><div>' + body + '</div></div>';
  }
  function initials() {
    var f = member && member.customFields ? (member.customFields['first-name'] || '') : '';
    var l = member && member.customFields ? (member.customFields['last-name'] || '') : '';
    var s = (f.charAt(0) + l.charAt(0)).toUpperCase();
    if (s) return s;
    return String((who && who.email) || '?').charAt(0).toUpperCase();
  }
  function memberName() {
    var f = member && member.customFields ? (member.customFields['first-name'] || '') : '';
    var l = member && member.customFields ? (member.customFields['last-name'] || '') : '';
    return (f + ' ' + l).trim() || (who && who.email) || '';
  }
  function chrome() {
    var logo = cfg.logo
      ? '<img src="' + esc(cfg.logo) + '" alt="' + esc(cfg.name) + '">'
      : '<span class="ps-nologo">' + esc(W.noLogo) + '</span>';
    var staff = who.staff
      ? '<div class="ps-staff"><div class="in">' + esc(W.staffView) + ' <b>' + esc(cfg.name) + '</b>' +
        '<span style="margin-left:14px">' + esc(W.seeAs) + '</span>' +
        '<select id="ps-seeas" aria-label="See the page as"><option value="staff">' + esc(W.asStaff) + '</option><option value="member">' + esc(W.asMember) + '</option></select></div></div>'
      : '';
    var menu = W.menu.map(function (m) { return '<button type="button" role="menuitem" disabled>' + esc(m[1]) + ' <em>' + esc(W.soon) + '</em></button>'; }).join('');
    root.innerHTML = staff +
      '<header class="ps-head"><div class="top">' +
        '<div class="ps-place">' + esc(W.place) + '</div>' +
        '<div class="ps-brand"><div class="ps-plate">' + logo + '</div><div class="ps-hair"></div>' +
          '<div class="ps-powered">' + esc(W.powered) + ' <img src="' + esc(cfg.inbxifyLogo) + '" alt="inbxify"></div></div>' +
        '<div class="ps-who"><div class="ps-acct"><button type="button" class="ps-acctbtn" id="ps-acctbtn" aria-haspopup="menu" aria-expanded="false" aria-label="Account menu">' +
          '<span class="ps-av">' + esc(initials()) + '</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>' +
          '<div class="ps-menu" id="ps-menu" role="menu" hidden><div class="mhead"><b>' + esc(memberName()) + '</b><span>' + esc(cfg.name) + '</span></div>' + menu +
          '<button type="button" role="menuitem" class="out" id="ps-signout">' + esc(W.signOut) + '</button></div></div></div>' +
      '</div><div class="ps-rule-ink"></div>' +
      '<nav class="ps-nav" aria-label="Portal">' + TABS.map(function (t) {
        return '<a href="#' + t.key + '" data-tab="' + t.key + '">' + esc(t.name) + '</a>'; }).join('') + '</nav>' +
      '<div class="ps-rule-soft"></div></header>' +
      '<main class="ps-main" id="ps-main"></main>';

    var btn = root.querySelector('#ps-acctbtn'), m = root.querySelector('#ps-menu');
    btn.addEventListener('click', function (e) { e.stopPropagation(); m.hidden = !m.hidden; btn.setAttribute('aria-expanded', String(!m.hidden)); });
    m.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { m.hidden = true; btn.setAttribute('aria-expanded', 'false'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { m.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
    root.querySelector('#ps-signout').addEventListener('click', async function () {
      try { await window.$memberstackDom.logout(); } catch (e) {}
      location.href = LOGIN_PATH;
    });
    var sa = root.querySelector('#ps-seeas');
    if (sa) sa.addEventListener('change', function () { root.classList.toggle('ps-asmember', sa.value === 'member'); });
    root.querySelectorAll('.ps-nav a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();                                            // no jump, no scroll
        var k = a.getAttribute('data-tab');
        if (history.replaceState) history.replaceState(null, '', '#' + k); else location.hash = k;
        show(k);
      });
    });
    window.addEventListener('hashchange', function () { show(tabFromHash()); });
  }
  function tabFromHash() {
    var h = (location.hash || '').replace(/^#/, '');
    return TABS.some(function (t) { return t.key === h; }) ? h : DEFAULT_TAB;
  }
  function ctx() {
    return {
      publisher: { id: cfg.id, name: cfg.name, slug: cfg.slug },
      who: { memberId: who.memberId, email: who.email, staff: !!who.staff },
      api: function (path, o) { return call(cfg.salesUrl, path, o); },
      info: function (p) { return who.staff && window.IxInfo ? window.IxInfo.badge(p) : ''; },
      tip: function (word, text, right) { return '<span class="ps-tip' + (right ? ' r' : '') + '" tabindex="0" data-tip="' + esc(text) + '">' + esc(word) + '</span>'; },
      esc: esc
    };
  }
  function show(key) {
    if (!booted) return;
    cur = key;
    root.querySelectorAll('.ps-nav a').forEach(function (a) {
      if (a.getAttribute('data-tab') === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var main = root.querySelector('#ps-main');
    if (mounted === key) return;
    var t = tabs[key];
    if (!t) {
      var name = (TABS.find(function (x) { return x.key === key; }) || {}).name || key;
      main.innerHTML = '<div class="ps-titlerow"><h1>' + esc(name) + '</h1>' +
        ctx().info({ file: 'not built', version: '', title: name, blurb: 'Planned portal tab. No file is deployed for it yet.', scenarios: [], companions: 'ps-shell-v' + VERSION }) +
        '</div><div class="ps-unbuilt"><b>' + esc(W.unbuiltH) + '.</b> ' + esc(W.unbuilt) + '</div>';
      mounted = key;
      return;
    }
    var y = window.scrollY;
    main.innerHTML = '';
    var el = document.createElement('div');
    el.className = 'ps-tab ps-tab-' + key;
    main.appendChild(el);
    mounted = key;
    try { t.mount(el, ctx()); }
    catch (e) { el.innerHTML = '<div class="ps-state" role="alert"><h2>This tab could not start</h2><div>' + esc(e && e.message || e) + '</div></div>'; }
    window.scrollTo(0, y);
  }

  // ── boot ────────────────────────────────────────────────────
  async function boot() {
    root = document.getElementById('ps-portal');
    if (!root) return;
    root.classList.add('ps-portal');
    var d = root.dataset;
    cfg = { id: (d.publisherId || '').trim(), name: (d.publisherName || '').trim(), slug: (d.publisherSlug || '').trim(),
            logo: (d.publisherLogo || '').trim(), membersUrl: (d.membersUrl || '').replace(/\/+$/, ''),
            salesUrl: (d.salesUrl || '').replace(/\/+$/, ''), inbxifyLogo: (d.inbxifyLogo || '').trim() };
    var missing = [];
    if (!/^[0-9a-f]{24}$/.test(cfg.id)) missing.push('data-publisher-id: bind PUBLISHERS (Self) This Item ID');
    if (!cfg.name) missing.push('data-publisher-name');
    if (!cfg.membersUrl) missing.push('data-members-url');
    if (!cfg.salesUrl) missing.push('data-sales-url');
    if (!cfg.inbxifyLogo) missing.push('data-inbxify-logo');
    if (missing.length) { state('Setup', esc(fill(W.embedBad, { what: missing.join('; ') }))); return; }

    state(W.loading, '');
    var ms = await waitMs(10000);
    if (!ms) { state('Login', esc(W.noMs)); return; }
    var t = await token();
    if (!t) { location.href = LOGIN_PATH; return; }
    try { var cm = await ms.getCurrentMember(); member = cm && cm.data ? cm.data : null; } catch (e) { member = null; }

    var r = await call(cfg.membersUrl, '/whoami', { label: 'Checking your login' });
    if (r.status === 401) { location.href = LOGIN_PATH; return; }
    if (!r.ok) { state('Login', esc(fill(W.checkFail, { msg: (r.json && r.json.error) || ('HTTP ' + r.status) }))); return; }
    who = r.json;
    var mine = (who.publishers || []).some(function (p) { return p.id === cfg.id; });
    if (!who.staff && !mine) {
      var own = (who.publishers || [])[0];
      if (own && own.portalPath) { location.replace(own.portalPath + (location.hash || '')); return; }
      state(W.noAccessH, esc(fill(W.noAccess, { email: who.email || 'this address' })));
      return;
    }
    booted = true;
    chrome();
    show(tabFromHash());
  }

  window.PsShell = {
    version: VERSION,
    register: function (t) {
      if (!t || !t.key || typeof t.mount !== 'function') return;
      tabs[t.key] = t;
      if (booted && cur === t.key && mounted === t.key) { mounted = null; show(t.key); }   // tab arrived after the placeholder
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
