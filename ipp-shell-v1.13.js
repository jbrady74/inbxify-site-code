/* ipp-shell-v1.13.js */
/* ============================================================
   ipp-shell-v1.13.js — Standalone IPP shell
   CHANGELOG
     v1.13 (from v1.12, IPP Build S7 · order of work, 10 Oct 2026)
       Ruled (Jeff): the order is Picker, Revenue, Layout, Publish.
       Revenue's rail button now goes straight after Picker instead of
       last, and VIEWS follows the same order. The Webflow switcher
       markup (Picker/Layout/Publish) is untouched; the shell inserts
       Revenue after the Picker button, or appends it if there is none.
       Pairs ipp-shell-v1.7.css unchanged.
     v1.12 (from v1.11, IPP Build S7 · surface A3 on flat grey, approved
       9 Oct from ipp-surface-mockup-v0_3). Pairs ipp-shell-v1.7.css and
       issues-tab-v1.0.32.js (which opens the plan in the same tab).
       - THE PLAN IS A SHEET. The IPP no longer fills the window edge to
         edge: it sits as a rounded sheet with generous margins on a flat
         grey (--ix-cream-deep) ground, so it reads as a surface you open
         and close, not another tab. Nothing of T-A shows behind it.
       - A CROWN across the top of the sheet: "PubPlan", then the title,
         the plan name and its date, then the Planner switch, an Esc hint
         and Close plan, top right. The old top bar and the logo strip
         are hidden; the rail no longer carries Close at its foot.
       - THE RAIL IS INK (#1E2A3A, the platform's dark text colour), not
         the T-A teal, so the two surfaces can't be mistaken. The open
         tab has a white spine. No status colour is used for chrome:
         gold stays "edited", salmon stays "needs attention".
       - ESC CLOSES THE PLAN, unless the key is typed in a box, a menu or
         dialog is open, or a view has already handled it.
       - UNSAVED EDITS ARE NOT LOST SILENTLY. If anything on the plan is
         marked edited (.ipp-dirty or .is-pending, the classes the Picker
         and Revenue already set), Close asks first, in the crown:
         "N edits not saved · Keep editing · Close without saving".
         Views may also cancel 'ipp:before-close' (a cancelable event)
         to stop a close.
       - CLOSE GOES BACK TO T-A IN THE SAME TAB (/title-admin/<slug>#PubPlan,
         unchanged v1.8 rule). A plan still open in an old separate tab
         keeps the v1.10 behaviour and closes that tab.
       - The page embed needs no edit. Missing pieces are named once in
         the console.
     v1.11 (from v1.10, IPP Build S6 · layout B "Anchor", approved on
       the canvas "PubPlan Picker · Layout directions"). Pairs
       ipp-shell-v1.6.css, ipp-picker-v1.24.js, ipp-picker-v1.19.css and
       ipp-picker-markup-v1.12.js.
       - THE LEFT COLUMN IS THE DARK RAIL. Every view's left rail is the
         platform rail colour (--ix-rail) and runs the full height of the
         screen. At its top: the INBXIFY logo, then the title name (small
         capitals), the plan name and its date, then Picker / Layout /
         Publish / Revenue as a vertical list. Close Plan and Return sits
         at the bottom of the rail.
       - The shell builds this from the page's own elements. It moves
         .ipp-logo and .ipp-cpr out of the header into two strips over
         the rail, and moves each view's identity block and switcher into
         a head block at the top of its rail. A wrapper left empty by the
         move is hidden. Nothing in the page embed has to change.
       - THE HEADER IS A TOP BAR over the working area only: the title
         name on the left, the Planner New / Legacy switch on the right.
         The switch moves into the bar, so it no longer sits on top of
         the title. In legacy mode it stays where it was.
       - READINESS IS GONE. The Readiness and Send cards are hidden on
         every view (ruled 7 Oct: not used). Their placeholder copy is
         removed. A right rail with nothing in it takes no space.
       - Missing elements are named once in the console; nothing breaks.
     v1.10 (from v1.9): CLOSE PLAN CLOSES ITS OWN TAB.
       - When the plan was opened in a new tab (the tab has no history
         of its own, or a page opened it), Close Plan and Return closes
         this tab. The T-A tab that opened it is still there, so no second
         T-A tab appears. Reported 6 Oct: two T-A tabs after one return.
       - If the browser refuses to close the tab, the button goes to the
         T-A page as before (v1.8 rule: /title-admin/<titleSlug>#PubPlan).
       - Opened in the same tab: unchanged, it goes back to the T-A page.
       - CSS unchanged: ipp-shell-v1.5.css stays.
     v1.9 (from v1.8, IA54): A FOURTH TAB, REVENUE, AS A PLACEHOLDER.
       - The switcher gains Revenue after Publish, on every view.
       - The page embed needs no edit: if it has no
         .ipp-view[data-view="revenue"], the shell builds one by copying
         the Layout view's frame (rails, header, identity), dropping its
         ids, and putting a placeholder card in its canvas. If the embed
         later gains its own Revenue view, the shell uses that instead.
       - A link ending #ipp-view=revenue opens it, like the others.
       - Pairs ipp-shell-v1.5.css (the switcher holds four buttons).
       HARDCODING (provisional)
         HC-P-IPP3-7  The Revenue placeholder copy. By design (copy);
                      replaced when the Revenue module ships.
     v1.8 (from v1.7, IPP Build S2): CLOSE PLAN AND RETURN WORKS.
       - It went to /title-admin?ta=<id>, which does not exist (404),
         and added #tab=pubplans, which the T-A page never matches: T-A
         clicks the tab whose data-w-tab equals everything after '#'.
       - Now: /title-admin/<titleSlug>#PubPlan.
           titleSlug  from the plan board (Data Worker v1.0.11+), the
                      TITLES-ADMIN record's slug. If the board has not
                      answered yet, the button waits for it.
           PubPlan    the T-A Pub Plans tab's data-w-tab value (read off
                      the live T-A page, 6 Oct 2026), sent bare.
         window.IPP_RETURN = { url, tab } still overrides either part.
       - No slug (older Worker, plan with no title): the button says why
         in a red toast and stays on the page. It never opens a guessed
         address.
       HARDCODING (provisional)
         HC-P-IPP2-7  '/title-admin/' (the T-A template page's path) and
                      'PubPlan' (its tab) in RETURN_PATH / RETURN_TAB.
                      Platform values: one Webflow site, one T-A template,
                      the same for every publisher and title. Overridable
                      through IPP_RETURN. By design.
       - CSS unchanged: ipp-shell-v1.4.css stays.
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
  var VIEWS = ['picker','revenue','layout','publish'];   // v1.13 order of work

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

  // ── Revenue placeholder (v1.9, IA54) ───────────────────────
  var REVENUE_PH =
    '<div class="ipp-ph"><div class="pic">' +
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' +
    '</div><h2>Revenue</h2>' +
    '<p>What was sold for this issue, and the ad slots it fills. OBLIGATIONS inventory joined with this ' +
    'plan\u2019s ad slots, plus the ADS collection by Customer for comped ads, or before billing runs.</p>' +
    '<div class="chunk">Revenue build mounts here</div></div>';
  function ensureRevenue(){
    var r = root(); if (!r) return;
    qa('.ipp-switcher', r).forEach(function(sw){
      if (sw.querySelector('button[data-view="revenue"]')) return;
      var last = sw.querySelector('button:last-of-type'); if (!last) return;
      var b = last.cloneNode(true);
      b.setAttribute('data-view', 'revenue'); b.classList.remove('on'); b.textContent = 'Revenue';
      // v1.13 Revenue sits right after Picker (Picker, Revenue, Layout, Publish)
      var pk = sw.querySelector('button[data-view="picker"]');
      if (pk && pk.parentNode) pk.parentNode.insertBefore(b, pk.nextSibling); else sw.appendChild(b);
    });
    if (q('.ipp-view[data-view="revenue"]', r)) return;
    var src = q('.ipp-view[data-view="layout"]', r) || q('.ipp-view[data-view="publish"]', r);
    if (!src) { console.warn('[IPP] no Layout or Publish view to copy; Revenue tab has no view'); return; }
    var v = src.cloneNode(true);
    v.setAttribute('data-view', 'revenue'); v.classList.remove('on');
    v.removeAttribute('id');
    Array.prototype.slice.call(v.querySelectorAll('[id]')).forEach(function(el){ el.removeAttribute('id'); });
    var cv = q('.ipp-canvas', v);
    if (cv) cv.innerHTML = REVENUE_PH;
    src.parentNode.insertBefore(v, src.nextSibling);
  }

  function wireSwitcher(){
    qa('.ipp-switcher button').forEach(function(b){
      b.addEventListener('click', function(){ show(b.getAttribute('data-view')); });
    });
    var close = q('.ipp-cpr');
    if (close) close.addEventListener('click', function(){ requestClose(); });
    var stay = q('.ipp-crown-stay'), go = q('.ipp-crown-go');
    if (stay) stay.addEventListener('click', function(){ askClose(0); if (close) close.focus(); });
    if (go) go.addEventListener('click', function(){ askClose(0); doClose(); });
    document.addEventListener('keydown', onEsc);
  }

  // ── close: ask first when edits are waiting (v1.12) ─────────
  var CLOSE_ICON = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  function closeLabel(t){
    var l = q('.ipp-cpr .ipp-cpr-l'); if (l) l.textContent = t;
    var c = q('.ipp-cpr'); if (c) c.style.opacity = (t === 'Close plan') ? '' : '.6';
  }
  // Edits a view has marked but not saved. The Picker marks .ipp-dirty,
  // Revenue marks .is-pending; both clear them once a save reads back.
  function unsavedCount(){
    var r = root(); if (!r) return 0;
    return r.querySelectorAll('.ipp-dirty, .is-pending').length;
  }
  function askClose(n){
    var ask = q('.ipp-crown-ask'), tools = q('.ipp-crown-tools'); if (!ask) return;
    ask.hidden = !n; if (tools) tools.hidden = !!n;
    var lab = q('.ipp-crown-ask-n', ask);
    if (lab) lab.textContent = n === 1 ? '1 edit not saved' : n + ' edits not saved';
    if (n) { var s = q('.ipp-crown-stay', ask); if (s) s.focus(); }
  }
  function asking(){ var a = q('.ipp-crown-ask'); return !!(a && !a.hidden); }
  function requestClose(){
    var ev = new CustomEvent('ipp:before-close', { cancelable:true });
    if (!document.dispatchEvent(ev)) return;          // a view said no
    var n = unsavedCount();
    if (n) { askClose(n); return; }
    doClose();
  }
  function doClose(){
    closeLabel('Returning\u2026');
    document.dispatchEvent(new CustomEvent('ipp:close'));
    returnToTA();
  }
  function onEsc(e){
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    if (asking()) { askClose(0); return; }            // Esc on the question = Keep editing
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    // a menu, picker list or dialog that is open owns Esc
    if (document.querySelector('[role="dialog"]:not([hidden]), [aria-modal="true"], [aria-expanded="true"], ' +
        '.ix-modal-backdrop, .ipp-dd.open, .is-open[role="listbox"]')) return;
    var r = root(); if (!r || r.style.display === 'none') return;
    requestClose();
  }

  // ── return to T-A PubPlan tab ───────────────────────────────
  // Navigate back to the Title-Admin page and select its PubPlan tab.
  // URL + tab name come from window.IPP_RETURN (set on the page) so this
  // stays tenant-agnostic; falls back to a sensible default if unset.
  //   window.IPP_RETURN = { url: '/title-admin/wln', tab: 'pubplans' }
  // The tab is a Webflow native tab; we pass it as a hash the T-A page can
  // read on load to pre-select the right w-tab-pane.
  var RETURN_PATH = '/title-admin/';   // HC-P-IPP2-7
  var RETURN_TAB  = 'PubPlan';         // HC-P-IPP2-7, the T-A tab's data-w-tab
  // v1.10: a plan opened in its own tab closes that tab instead of
  // opening the T-A page a second time. Falls through if the browser
  // will not close it.
  function openedInNewTab(){
    var op = null; try { op = window.opener; } catch (e) { op = null; }
    return (op && !op.closed) || window.history.length <= 1;
  }
  function returnToTA(){
    if (openedInNewTab()) {
      try { if (window.opener && !window.opener.closed) window.opener.focus(); } catch (e) {}
      window.close();
      setTimeout(function(){ if (!window.closed) returnByLink(); }, 250);
      return;
    }
    returnByLink();
  }
  function returnByLink(){
    var cfg = window.IPP_RETURN || {};
    var tab = cfg.tab || RETURN_TAB;
    var go = function(url){ window.location.href = url.split('#')[0] + '#' + tab; };
    if (cfg.url) { go(cfg.url); return; }
    var fromBoard = function(b){ return b && b.plan && b.plan.titleSlug ? RETURN_PATH + b.plan.titleSlug : ''; };
    var now = fromBoard(board.data());
    if (now) { go(now); return; }
    var stop = function(why){
      toast('Can\u2019t return to the title page: ' + why, true);
      closeLabel('Close plan');
    };
    board.load().then(function(b){
      var u = fromBoard(b);
      if (u) go(u);
      else stop('the plan data has no title page name (Data Worker v1.0.11 or later, and a title on the plan).');
    }, function(e){ stop((e && e.message) || 'the plan could not be read.'); });
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
  function shortDate(raw){
    if (!raw) return '';
    var t = Date.parse(raw); if (isNaN(t)) return raw;
    try { return new Date(t).toLocaleDateString(undefined, { month:'short', day:'numeric' }); }
    catch (e) { return raw; }
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
    // v1.12: the crown's plan and short date
    qa('.ipp-crown-plan', r).forEach(function(el){
      el.textContent = p.name || 'Plan name missing';
      el.classList.toggle('ipp-id-missing', !p.name);
    });
    qa('.ipp-crown-date', r).forEach(function(el){ el.textContent = shortDate(p.date) || 'No send date'; });
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

  // v1.11: Readiness and Send are gone (ruled 7 Oct). Hidden, not emptied,
  // so a later readiness build can bring its card back in the embed.
  function retireRightCards(){
    var r = root(); if (!r) return;
    qa('.ipp-rail-right .ipp-card.readiness, .ipp-rail-right .ipp-card.send', r).forEach(function(card){
      card.hidden = true; card.style.display = 'none';
    });
  }

  // ── layout B "Anchor" (v1.11) ───────────────────────────────
  function el(tag, cls){ var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function emptyNow(n){ return n && n.nodeType === 1 && !n.children.length && !String(n.textContent || '').trim(); }
  function frameB(){
    var r = root(); if (!r || r.classList.contains('ipp-b')) return;
    r.classList.add('ipp-b');
    // v1.12: a sheet on a flat grey ground, with a crown across its top
    r.classList.add('ipp-sheet');
    if (!document.querySelector('.ipp-sheet-ground')) {
      var ground = el('div', 'ipp-sheet-ground'); ground.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(ground, r);
    }
    var crown = el('div', 'ipp-crown');
    crown.setAttribute('role', 'banner');
    crown.innerHTML =
      '<span class="ipp-crown-k">PubPlan</span>' +
      '<span class="ipp-crown-p"><span class="ipp-crown-t" data-ipp-title-name></span>' +
      '<span class="ipp-crown-sep" aria-hidden="true">\u00b7</span><span class="ipp-crown-plan"></span>' +
      '<span class="ipp-crown-sep" aria-hidden="true">\u00b7</span><span class="ipp-crown-date"></span></span>' +
      '<span class="ipp-crown-sp"></span>' +
      '<span class="ipp-crown-ask" hidden><span class="ipp-crown-ask-n"></span>' +
      '<button type="button" class="ipp-crown-stay">Keep editing</button>' +
      '<button type="button" class="ipp-crown-go">Close without saving</button></span>' +
      '<span class="ipp-crown-tools"><kbd class="ipp-crown-esc" title="Esc closes the plan">Esc</kbd></span>';
    var cpr = q('.ipp-cpr', r);
    if (cpr) {
      cpr.innerHTML = CLOSE_ICON + '<span class="ipp-cpr-l">Close plan</span>';
      cpr.setAttribute('type', 'button');
      cpr.setAttribute('aria-label', 'Close plan and return to the title page');
      q('.ipp-crown-tools', crown).appendChild(cpr);
    } else console.warn('[IPP] no .ipp-cpr in the header; the crown shows no Close button (Esc still works)');
    r.insertBefore(crown, r.firstChild);
    var hc = q('.ipp-hchrome', r); if (hc) hc.style.display = 'none';
    // each view: title name, plan name and date, then the tabs, at the top of its rail
    qa('.ipp-view', r).forEach(function(v){
      var rail = q('.ipp-rail', v); if (!rail || q('.ipp-b-head', rail)) return;
      var head = el('div', 'ipp-b-head'), left = [];
      var pub = el('div', 'ipp-b-pub'); pub.setAttribute('data-ipp-title-name', '');
      head.appendChild(pub);
      var issue = q('.ipp-id-issue', v), hero = issue && issue.closest('.ipp-id-hero');
      if (hero && rail.contains(hero)) { left.push(hero.parentNode); head.appendChild(hero); }
      else {
        [issue, q('.ipp-id-date', v)].forEach(function(n){
          if (n && rail.contains(n)) { left.push(n.parentNode); head.appendChild(n); }
        });
      }
      var sw = q('.ipp-switcher', v);
      if (sw && rail.contains(sw)) { left.push(sw.parentNode); head.appendChild(sw); }
      else console.warn('[IPP] no .ipp-switcher in the ' + v.getAttribute('data-view') + ' rail');
      rail.insertBefore(head, rail.firstChild);
      left.forEach(function(p){ if (p && p !== rail && p !== head && emptyNow(p)) p.style.display = 'none'; });
    });
    // the Planner switch goes into the crown, before Esc and Close
    var tg = document.querySelector('.ipp-planner-toggle');
    var tools = q('.ipp-crown-tools', crown);
    if (tg && tools) { tg.classList.add('ipp-planner-toggle--bar'); tools.insertBefore(tg, tools.firstChild); }
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
    ensureRevenue();     // v1.9
    frameB();            // v1.11/v1.12: rail head, sheet and crown, before the title paint
    wireSwitcher();
    fillIdentity();      // v1.5
    paintTitle('', 'wait');   // v1.7: no typed name ever shows
    retireRightCards();  // v1.11
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
    planInfo: planInfo, requestClose: requestClose, version: '1.13'
  };
})();
