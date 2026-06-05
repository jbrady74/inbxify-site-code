/* ============================================================
   ipp-shell-v1_0.js  —  Standalone IPP (Individual PubPlanner)
   ------------------------------------------------------------
   The single pubplanning surface (TD-232). Standalone — NO
   dependency on pubplan-v5 / pubplan-grid. Coexists with the
   live tile UI until cutover; must not touch it.

   CONSISTENCY WITH THE LIVE PAGE
     - Config: window.PP_WEBHOOKS (the page's existing convention).
       IPP routes added under their own keys (see CFG below).
     - Tenant ids: read from .pubplan-slot-wrapper[data-pubplan-id]
       / [data-titleadmin-id] — the SAME wrapper pubplan-v5 reads,
       so no new Webflow binding is required for ids.
     - Write: no-cors POST, URLSearchParams body (matches
       pubplan-v5 submitSection).

   ISOLATION
     - Everything hangs off window.IPP — no bare globals.
     - All DOM work scoped to the [data-ipp-root] mount.
     - Avoids taken globals (toggleSection, tD, submitSection,
       handleTfCategoryChange) and taken CSS prefixes.

   THIS FILE = the shell: header (Treatment A) + three-view
   switcher (Picker/Layout/Publish) + savebar + config/io plumbing.
   View bodies are placeholders; Picker / Layout / Publish builds
   mount into the per-view canvases.
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
      // production: navigate back to T-A Issues / overview
      close.style.opacity='.6';
      var sp = close.querySelector('span'); // not present; keep simple
      close.lastChild && (close.lastChild.textContent = ' Returning…');
      document.dispatchEvent(new CustomEvent('ipp:close'));
    });
  }

  // ── boot ───────────────────────────────────────────────────
  function boot(){
    var r = root();
    if (!r){ return; } // shell markup not on this page
    wireSwitcher();
    show('picker');                       // Picker default, forever (Q3)
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
    tenant: tenant, post: post, toast: toast, saving: saving
  };
})();
