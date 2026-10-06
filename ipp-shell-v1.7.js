/* ipp-shell-v1.7.js */
/* ============================================================
   ipp-shell-v1.7.js — Standalone IPP shell
   CHANGELOG
     v1.7 (from v1.6, IPP Build S2): THE HEADER NAMES THE REAL TITLE.
       - The page embed typed "Wyckoff Living NOW" and "W" into the
         header, so every publisher's plan page said Wyckoff
         (HC-P-IPP2-6). The shell now fills both from the plan board:
           [data-ipp-title-name]   plan.titleName (Data Worker v1.0.10+,
                                   the TITLES-ADMIN record's name)
           [data-ipp-title-badge]  the first letter of that name
         Until the board answers, both are blank, so a typed name can
         never show. A board without titleName (an older Worker, or a
         plan with no title) shows "Title not set" and the badge hides.
       - Works whatever the embed holds: the typed text can stay until
         the embed is next edited, then be emptied.
       - CSS unchanged: ipp-shell-v1.4.css stays.
     v1.6 (from v1.5, IPP Build S2 slice 1):
       - THE PLAN BOARD. IPP.board reads the plan from the Data Worker
         (ix-issue-data v1.0.9 GET /plan-board?planId=) so every view
         reads the same rows. Address from PP_WEBHOOKS.planBoard on the
         page (the full /plan-board URL). Nothing about the Worker is
         typed here.
           IPP.board.load({ fresh })  -> Promise<board>; one request at a
                                         time, a second call joins it
           IPP.board.data()           -> last good answer, or null
           IPP.board.error()          -> last failure message, or ''
         Every load announces 'ipp:board' on document with
         detail { ok, data, error }. A failure never keeps the old
         board on screen as if it were current (TOAST-TRUTH): data()
         stays the last good answer, but the event says ok:false and
         the views show the error.
       - IPP.getJSON(url) for the views' own reads (CORS GET, JSON
         answer, plain error message on a non-2xx or a non-JSON reply).
         ix-progress (loaded after PP_WEBHOOKS) shows its card for
         these reads, as it does for every request.
       - Missing PP_WEBHOOKS.planBoard: load() rejects with a sentence
         naming the key. No guessed address.
       - CSS unchanged: ipp-shell-v1.3.css stays.
     v1.5 (from v1.4, Compile Control S1):
       - THE HEADER SHOWS THE PLAN YOU OPENED. Every view's identity
         block (.ipp-id-issue / .ipp-id-date) held typed mockup text
         ("No.114-A", "Saturday, June 7, 2026") on every plan. Now the
         shell fills both from the plan wrapper the page already binds:
           .pubplan-slot-wrapper[data-pubplan-name]  → issue line
           .pubplan-slot-wrapper[data-pubplan-date]  → date line
         The date is shown with its weekday when the browser can read
         it, else exactly as bound. Nothing about the title is typed.
         No name bound → the line says "Plan name missing" (no guess).
       - NO FAKE READINESS. The right rail's Readiness and Send cards
         held typed demo rows ("10 / 12 blocks", "Pos 5 · TS asset not
         assigned", "Subject line set"). The Readiness card now says
         the check is not built yet; the Send card is hidden. Both come
         back when a real readiness check exists.
       - Selectors the page markup must keep: .ipp-id-issue,
         .ipp-id-date, .ipp-rail-right .ipp-card.readiness / .send.
         Any not found is reported once in the console.
       - CSS unchanged: ipp-shell-v1.3.css stays.
     v1.4 (from v1.3):
       - OPEN ON A VIEW FROM THE LINK. A link ending in
         #ipp-view=<picker|layout|publish> opens that view on load, then
         the hash is removed so a reload goes back to normal. Used by the
         T-A Pub Plans tab's Next tile (issues-tab v1.0.27) to open
         Publish, where Promote lives.
       - Opening the page any other way still lands on Picker (Q3).
         Only an explicit link can pick another view.
       - Ignored in legacy-planner mode (the IPP does not boot).
     v1.3 (from v1.2):
       - NO-CODE PLANNER TOGGLE: a small fixed pill (top-center, mounts to
         <body> so it shows in BOTH planner states) flips New ↔ Legacy and
         persists the choice in localStorage, PER-TITLE (key derived from the
         live tenant — never hardcoded). Flipping reloads so the chosen
         planner boots cleanly. useLegacy() precedence is now:
         window.IPP_USE_LEGACY (explicit) > operator toggle (localStorage) >
         [data-use-legacy-planner] sentinel > default(new). Removes the need
         to hand-edit window.IPP_USE_LEGACY on the page.
     v1.2 (from v1.1):
       - LEGACY GATE: boot() now checks useLegacy() — if window.IPP_USE_LEGACY
         or a visible [data-use-legacy-planner] sentinel is present, the IPP
         hides its root and does NOT boot, handing the screen to the legacy
         planner. Lets the operator work an issue on the legacy planner today.
         (Mirror [data-use-new-planner] gate on the legacy side is the page's
         job via Webflow Conditional Visibility.)
       - CLOSE PLAN & RETURN now actually navigates: returnToTA() sends the
         browser to the T-A page's PubPlan tab. URL + tab come from
         window.IPP_RETURN = { url, tab } (preferred), else a tenant-derived
         fallback. Tab passed as #tab=pubplans for the T-A page to pre-select.
     v1_1 (from v1_0):
       - FIX: fullscreen overlay bled past the header / rendered at
         container width. Root cause: position:fixed re-anchors to a
         Webflow embed wrapper that carries transform/filter. boot()
         now reparents [data-ipp-root] to <body> so the overlay
         anchors to the viewport regardless of Webflow wrapping.
     v1_0: initial shell — window.IPP namespace, three-view switcher
       (Picker/Layout/Publish), Treatment A header, PP_WEBHOOKS config,
       no-cors POST writes, tenant ids from .pubplan-slot-wrapper.
   ============================================================ */
window.IPP = (function () {
  'use strict';
  var VIEWS = ['picker','layout','publish'];

  // ── config / io (page conventions) ─────────────────────────
  function webhooks(){ return window.PP_WEBHOOKS || {}; }
  function root(){ return document.querySelector('[data-ipp-root]'); }
  function q(sel, r){ return (r||root()||document).querySelector(sel); }
  function qa(sel, r){ return Array.prototype.slice.call((r||root()||document).querySelectorAll(sel)); }

  function tenant(){
    // same wrappers pubplan-v5 reads — no new binding needed
    var pp = document.querySelector('.pubplan-slot-wrapper[data-pubplan-id]');
    var ta = document.querySelector('.pubplan-slot-wrapper[data-titleadmin-id]');
    return {
      pubplanId:    (pp && pp.getAttribute('data-pubplan-id')) || '',
      titleAdminId: (ta && ta.getAttribute('data-titleadmin-id')) || ''
    };
  }

  // no-cors POST, URLSearchParams body — matches the live page.
  // route = a PP_WEBHOOKS key (e.g. 'cc', 'block'); params = plain object.
  function post(route, params){
    var url = webhooks()[route];
    if (!url){ console.warn('[IPP] no PP_WEBHOOKS["'+route+'"]'); return Promise.reject(new Error('no webhook for '+route)); }
    var body = new URLSearchParams();
    Object.keys(params||{}).forEach(function(k){ body.append(k, params[k]); });
    return fetch(url, { method:'POST', mode:'no-cors',
      headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
      body: body.toString() });
  }

  // ── JSON reads (v1.6) ───────────────────────────────────────
  function getJSON(url){
    return fetch(url, { method:'GET', credentials:'omit' }).then(function(r){
      return r.text().then(function(t){
        var j = null;
        try { j = JSON.parse(t); } catch(e) {
          throw new Error('The reply from ' + url.split('?')[0] + ' is not JSON (HTTP ' + r.status + ').');
        }
        if (!r.ok || (j && j.ok === false)) {
          throw new Error((j && j.error) ? j.error : ('HTTP ' + r.status + ' from ' + url.split('?')[0] + '.'));
        }
        return j;
      });
    });
  }

  // ── the plan board (v1.6) ───────────────────────────────────
  var B = { data:null, error:'', pending:null };
  function announce(detail){ document.dispatchEvent(new CustomEvent('ipp:board', { detail:detail })); }
  function loadBoard(opts){
    opts = opts || {};
    if (B.pending) return B.pending;
    var base = webhooks().planBoard || '';
    var id = tenant().pubplanId;
    var fail = function(msg){
      B.error = msg; announce({ ok:false, data:B.data, error:msg });
      return Promise.reject(new Error(msg));
    };
    if (!base) return fail('The plan board address is not set on this page (PP_WEBHOOKS.planBoard).');
    if (!id)   return fail('This page has no plan id (.pubplan-slot-wrapper[data-pubplan-id]).');
    var url = base + (base.indexOf('?') < 0 ? '?' : '&') + 'planId=' + encodeURIComponent(id) + (opts.fresh ? '&fresh=1' : '');
    B.pending = getJSON(url).then(function(j){
      B.pending = null; B.data = j; B.error = '';
      announce({ ok:true, data:j, error:'' });
      return j;
    }, function(e){
      B.pending = null;
      var msg = (e && e.message) || String(e);
      B.error = msg; announce({ ok:false, data:B.data, error:msg });
      throw e;
    });
    return B.pending;
  }
  var board = {
    load: loadBoard,
    data: function(){ return B.data; },
    error: function(){ return B.error; }
  };

  // ── toast ──────────────────────────────────────────────────
  function toast(msg, isErr){
    var t = document.createElement('div');
    t.className = 'ipp-toast' + (isErr?' err':'');
    t.innerHTML = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.classList.add('show'); });
    setTimeout(function(){ t.classList.remove('show'); setTimeout(function(){ t.remove(); }, 250); }, 2200);
  }

  // ── savebar (shared, transient) ────────────────────────────
  function saving(on, label){
    var bar = q('.ipp-savebar'); if (!bar) return;
    bar.classList.toggle('saving', !!on);
    var stat = q('.stat', bar); if (stat && label) stat.textContent = label;
  }

  // ── view switching (single delegated handler) ──────────────
  function show(view){
    if (VIEWS.indexOf(view) < 0) return;
    qa('.ipp-view').forEach(function(s){ s.classList.toggle('on', s.getAttribute('data-view')===view); });
    qa('.ipp-switcher button').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-view')===view); });
    var active = q('.ipp-view[data-view="'+view+'"]');
    var cv = active && q('.ipp-canvas', active); if (cv) cv.scrollTop = 0;
    IPP._view = view;
    // let view modules know they're now visible (lazy render hook)
    document.dispatchEvent(new CustomEvent('ipp:view', { detail:{ view:view } }));
  }

  function wireSwitcher(){
    qa('.ipp-switcher button').forEach(function(b){
      b.addEventListener('click', function(){ show(b.getAttribute('data-view')); });
    });
    var close = q('.ipp-cpr');
    if (close) close.addEventListener('click', function(){
      close.style.opacity = '.6';
      close.lastChild && (close.lastChild.textContent = ' Returning…');
      document.dispatchEvent(new CustomEvent('ipp:close'));
      returnToTA();
    });
  }

  // ── return to T-A PubPlan tab ───────────────────────────────
  // Navigate back to the Title-Admin page and select its PubPlan tab.
  // URL + tab name come from window.IPP_RETURN (set on the page) so this
  // stays tenant-agnostic; falls back to a sensible default if unset.
  //   window.IPP_RETURN = { url: '/title-admin/wln', tab: 'pubplans' }
  // The tab is a Webflow native tab; we pass it as a hash the T-A page can
  // read on load to pre-select the right w-tab-pane.
  function returnToTA(){
    var cfg = window.IPP_RETURN || {};
    var url = cfg.url || taUrlFromTenant();
    var tab = cfg.tab || 'pubplans';
    if (!url){ console.warn('[IPP] no return URL — set window.IPP_RETURN={url,tab}'); return; }
    window.location.href = url + (url.indexOf('#') < 0 ? '#' : '') + 'tab=' + encodeURIComponent(tab);
  }
  // Best-effort T-A URL from the tenant title-admin id when IPP_RETURN.url unset.
  // Real path pattern lives in window.IPP_RETURN.url (preferred). This is a guard.
  function taUrlFromTenant(){
    var t = tenant();
    return t.titleAdminId ? ('/title-admin?ta=' + t.titleAdminId) : '';
  }

  // ── legacy gate ─────────────────────────────────────────────
  // When the operator wants the LEGACY planner on this issue, the IPP must
  // not boot and must not occupy the screen. Source of truth = a sentinel
  // the page exposes (Webflow Switch fields can't bind to data-* — so the
  // page sets this via Conditional Visibility on a sentinel element OR a
  // global). Precedence: explicit global > operator toggle (localStorage,
  // per-title) > sentinel element. Operator toggle is the no-code switch.
  function legacyKey(){
    // per-title so a publisher with many titles toggles each independently;
    // never hardcoded — derived from the live tenant.
    var t = tenant();
    return 'ipp:useLegacy:' + (t.titleAdminId || t.pubplanId || 'default');
  }
  function readToggle(){
    try { return window.localStorage.getItem(legacyKey()); } catch(e){ return null; }
  }
  function writeToggle(useLegacy){
    try { window.localStorage.setItem(legacyKey(), useLegacy ? '1' : '0'); } catch(e){}
  }
  function useLegacy(){
    // 1) explicit page global wins (back-compat / emergency override)
    if (window.IPP_USE_LEGACY === true) return true;
    if (window.IPP_USE_LEGACY === false) return false;
    // 2) operator toggle (no-code switch, per-title, persists across reloads)
    var t = readToggle();
    if (t === '1') return true;
    if (t === '0') return false;
    // 3) sentinel element (Webflow Conditional Visibility), if the page uses one
    var s = document.querySelector('[data-use-legacy-planner]');
    if (s){
      var cs = window.getComputedStyle(s);
      if (cs.display !== 'none' && cs.visibility !== 'hidden') return true;
    }
    return false; // default: show the new planner
  }

  // ── planner toggle (no-code switch) ─────────────────────────
  // A small fixed pill, top-center, present in BOTH states (mounts to <body>
  // so it shows even when the IPP root is hidden). Flips the per-title toggle
  // and reloads so the chosen planner boots cleanly.
  function mountToggle(){
    if (document.querySelector('.ipp-planner-toggle')) return;
    var legacy = useLegacy();
    var wrap = document.createElement('div');
    wrap.className = 'ipp-planner-toggle';
    wrap.innerHTML =
      '<span class="ippt-label">Planner</span>' +
      '<button type="button" class="ippt-btn ' + (legacy?'':'on') + '" data-target="new">New</button>' +
      '<button type="button" class="ippt-btn ' + (legacy?'on':'') + '" data-target="legacy">Legacy</button>';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function(e){
      var b = e.target.closest('.ippt-btn'); if (!b) return;
      var wantLegacy = b.getAttribute('data-target') === 'legacy';
      if (wantLegacy === useLegacy()) return; // no change
      writeToggle(wantLegacy);
      window.location.reload();
    });
  }

  // ── view from link (v1.4) ───────────────────────────────────
  function viewFromHash(){
    var m = (window.location.hash || '').match(/[#&]ipp-view=([^&]*)/);
    if (!m) return '';
    var v = decodeURIComponent(m[1] || '').toLowerCase();
    return VIEWS.indexOf(v) >= 0 ? v : '';
  }
  function stripViewHash(){
    try {
      var h = (window.location.hash || '').replace(/[#&]?ipp-view=[^&]*/, '').replace(/^&/, '');
      var url = window.location.pathname + window.location.search + (h && h !== '#' ? '#' + h.replace(/^#/, '') : '');
      window.history.replaceState(null, '', url);
    } catch (e) { /* harmless: the hash just stays */ }
  }

  // ── issue identity + honest readiness (v1.5) ───────────────
  function planInfo(){
    var el = document.querySelector('.pubplan-slot-wrapper[data-pubplan-id][data-pubplan-name]');
    var dt = document.querySelector('.pubplan-slot-wrapper[data-pubplan-id][data-pubplan-date]');
    return {
      name: el ? (el.getAttribute('data-pubplan-name') || '').trim() : '',
      date: dt ? (dt.getAttribute('data-pubplan-date') || '').trim() : ''
    };
  }
  function longDate(raw){
    if (!raw) return '';
    var t = Date.parse(raw);
    if (isNaN(t)) return raw;
    try {
      return new Date(t).toLocaleDateString(undefined,
        { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    } catch (e) { return raw; }
  }
  function fillIdentity(){
    var r = root(); if (!r) return;
    var p = planInfo();
    var issues = qa('.ipp-id-issue', r), dates = qa('.ipp-id-date', r);
    if (!issues.length) console.warn('[IPP] no .ipp-id-issue in the shell markup; header left as is');
    if (!dates.length)  console.warn('[IPP] no .ipp-id-date in the shell markup; header left as is');
    issues.forEach(function(el){
      el.textContent = p.name || 'Plan name missing';
      el.classList.toggle('ipp-id-missing', !p.name);
    });
    var d = longDate(p.date);
    dates.forEach(function(el){ el.textContent = d || 'No send date set'; });
  }
  // ── title from the board (v1.7) ─────────────────────────────
  function paintTitle(name, state){
    var r = root(); if (!r) return;
    qa('[data-ipp-title-name]', r).forEach(function(el){
      el.textContent = name || (state === 'none' ? 'Title not set' : '');
      el.classList.toggle('ipp-id-missing', state === 'none');
    });
    qa('[data-ipp-title-badge]', r).forEach(function(el){
      var letter = name ? name.trim().charAt(0).toUpperCase() : '';
      el.textContent = letter;
      el.style.visibility = letter ? '' : 'hidden';
    });
  }
  document.addEventListener('ipp:board', function(e){
    var d = (e && e.detail) || {};
    if (!d.ok) return;                       // keep blank; the views show the error
    var n = d.data && d.data.plan && d.data.plan.titleName;
    paintTitle(n || '', n ? 'ok' : 'none');
  });

  function honestReadiness(){
    var r = root(); if (!r) return;
    var ready = qa('.ipp-rail-right .ipp-card.readiness', r);
    var send  = qa('.ipp-rail-right .ipp-card.send', r);
    if (!ready.length) console.warn('[IPP] no .ipp-card.readiness in the shell markup');
    ready.forEach(function(card){
      card.innerHTML = '<h4>Readiness</h4>' +
        '<p class="ipp-ready-none" style="margin:0;font-size:12.5px;line-height:1.5;color:var(--ipp-text-light)">' +
        'The readiness check is not built yet. Nothing here is checked for this plan.</p>';
    });
    send.forEach(function(card){ card.hidden = true; card.style.display = 'none'; });
  }

  // ── boot ───────────────────────────────────────────────────
  function boot(){
    var r = root();
    if (!r){ return; } // shell markup not on this page
    mountToggle();     // ALWAYS show the toggle, in either state
    if (useLegacy()){
      // Hide the IPP entirely and do NOT initialize — legacy planner takes over.
      r.style.display = 'none';
      console.info('[IPP] use-legacy active → IPP hidden, not booting');
      return;
    }
    // Webflow wraps embeds in containers that may carry transform/filter,
    // which would re-anchor our position:fixed overlay. Reparent to <body>
    // so the fullscreen overlay anchors to the viewport reliably.
    if (r.parentNode !== document.body){ document.body.appendChild(r); }
    wireSwitcher();
    fillIdentity();      // v1.5
    paintTitle('', 'wait');   // v1.7: no typed name ever shows
    honestReadiness();   // v1.5
    // Picker default, forever (Q3). v1.4: an explicit link may ask for
    // another view with #ipp-view=<name>; the hash is then removed.
    var asked = viewFromHash();
    show(asked || 'picker');
    if (asked) stripViewHash();
    console.info('[IPP] shell booted · tenant', tenant());
    document.dispatchEvent(new CustomEvent('ipp:ready'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // public surface for the view modules to use
  return {
    VIEWS: VIEWS, _view: 'picker',
    boot: boot, show: show,
    q: q, qa: qa, root: root,
    tenant: tenant, post: post, toast: toast, saving: saving,
    getJSON: getJSON, board: board,
    planInfo: planInfo, version: '1.7'
  };
})();
