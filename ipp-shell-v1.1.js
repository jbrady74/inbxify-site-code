/* ============================================================
   ipp-shell-v1_1.js — Standalone IPP shell
   CHANGELOG
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
    // Webflow wraps embeds in containers that may carry transform/filter,
    // which would re-anchor our position:fixed overlay. Reparent to <body>
    // so the fullscreen overlay anchors to the viewport reliably.
    if (r.parentNode !== document.body){ document.body.appendChild(r); }
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
