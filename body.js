/* ── 1. MOBILE NAV v2.0 ─────────────────────────── */
/* Replaces: Sections 1 + 9 from body.js v1.2
   Pairs with: head.js Section 6 (mobile-nav CSS)

   Features:
   - CSS animated hamburger → X morph (replaces image)
   - GPU-accelerated slide-from-right panel
   - Backdrop scrim (non-dismissing)
   - Close via hamburger/X toggle ONLY
   - Scroll position preserved on open/close
   - Subscribe / Contact popup integration
   - Isolated from PubPlan event delegation
   - Staggered link entry animation via CSS

   DOM contract:
     .mh-menu-tablet   — hamburger trigger (bars injected by this script)
     .mobile-nav-i     — backdrop overlay
     .slide-menu        — slide panel
     body.nav-open      — open state class
*/
(function () {
  'use strict';

  /* ── References ── */
  var trigger = document.querySelector('.mh-menu-tablet');
  var panel   = document.querySelector('.slide-menu');
  if (!trigger || !panel) return;          /* Bail on pages without the nav */

  var savedScrollY = 0;

  /* ── Inject CSS hamburger bars (replace image) ── */
  function injectBars() {
    if (trigger.querySelector('.nav-bar')) return;     /* Already injected */
    trigger.innerHTML = '';                             /* Remove image child */
    for (var i = 0; i < 3; i++) {
      var bar = document.createElement('span');
      bar.className = 'nav-bar';
      bar.setAttribute('aria-hidden', 'true');
      trigger.appendChild(bar);
    }
  }

  /* ── Open / Close ── */
  function openNav() {
    savedScrollY = window.scrollY;
    document.body.classList.add('nav-open');
    document.body.style.top = '-' + savedScrollY + 'px';
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-label', 'Close menu');
    panel.setAttribute('aria-hidden', 'false');
  }

  function closeNav() {
    document.body.classList.remove('nav-open');
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Open menu');
    panel.setAttribute('aria-hidden', 'true');

    /* Reset stagger animations so they replay on next open */
    panel.querySelectorAll('.w-dyn-item, .nav-slide-divider, .nav-slide-btn, .nav-slide-auth a')
      .forEach(function (el) {
        el.style.animation = 'none';
        /* Force reflow, then clear so CSS animation can re-trigger */
        void el.offsetHeight;
        el.style.animation = '';
      });
  }

  function toggleNav(e) {
    e.stopPropagation();                               /* Isolate from PubPlan */
    e.preventDefault();
    if (document.body.classList.contains('nav-open')) {
      closeNav();
    } else {
      openNav();
    }
  }

  /* ── Bind trigger ── */
  trigger.addEventListener('click', toggleNav, false);

  /* Prevent touch delay on mobile */
  trigger.addEventListener('touchend', function (e) {
    e.preventDefault();
    toggleNav(e);
  }, { passive: false });

  /* ── Accessibility — ARIA setup ── */
  trigger.setAttribute('role', 'button');
  trigger.setAttribute('tabindex', '0');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', 'Open menu');
  trigger.setAttribute('aria-controls', 'slide-menu');
  panel.setAttribute('id', 'slide-menu');
  panel.setAttribute('role', 'navigation');
  panel.setAttribute('aria-hidden', 'true');

  /* Keyboard: Enter/Space on trigger */
  trigger.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleNav(e);
    }
  });

  /* ── Subscribe / Contact button wiring ── */
  /* If buttons with data-subscribe="true" or data-contact="true" live
     inside the slide menu, close the nav first then trigger the popup */
  panel.addEventListener('click', function (e) {
    var subscribeBtn = e.target.closest('[data-subscribe="true"]');
    var contactBtn   = e.target.closest('[data-contact="true"]');

    if (subscribeBtn) {
      e.preventDefault();
      closeNav();
      setTimeout(function () {
        if (typeof window.openSubscribePopup === 'function') window.openSubscribePopup();
      }, 350);                                        /* Wait for panel close animation */
      return;
    }

    if (contactBtn) {
      e.preventDefault();
      closeNav();
      setTimeout(function () {
        if (typeof window.openContactModal === 'function') window.openContactModal();
      }, 350);
      return;
    }
  });

  /* ── Close on internal link navigation ── */
  panel.querySelectorAll('a[href]').forEach(function (link) {
    if (link.hasAttribute('data-subscribe') || link.hasAttribute('data-contact')) return;
    link.addEventListener('click', function () {
      closeNav();
    });
  });

  /* ── Close on window resize above breakpoint ── */
  var mql = window.matchMedia('(min-width: 992px)');
  function handleResize(e) {
    if (e.matches && document.body.classList.contains('nav-open')) {
      closeNav();
    }
  }
  if (mql.addEventListener) {
    mql.addEventListener('change', handleResize);
  } else if (mql.addListener) {
    mql.addListener(handleResize);                    /* Safari <14 fallback */
  }

  /* ── Init ── */
  injectBars();

})();
