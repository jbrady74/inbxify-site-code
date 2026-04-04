/* ================================================
   INBXIFY — Site-Wide Body Code
   Repo: jbrady74/inbxify-site-code
   File: body.js
   Version: 1.12 — March 2026

CHANGES FROM 1.11:
- [FIX] Section 17: Added null check on $memberstackDom.onReady
  before calling .then() — undefined .onReady was crashing the
  entire script, preventing Section 13 (Subscribe Popup) and
  Section 14 (Contact Modal) from initializing.

CHANGES FROM 1.09:
- [UPD] Section 1: removed the injector buttons and boxes for mobile nav

- [FIX] Section 13: Wrapped in DOMContentLoaded — footer HTML loads
  after head scripts execute. Without it, all getElementById = null.
- [FIX] Section 14: Same DOMContentLoaded wrapper.
- [FIX] Section 16: Rewired to watch new #signinModal (not old
  Webflow .sign-in component). Wrapped in DOMContentLoaded.
- [NEW] Section 17: Sign In Modal — open/close, password eye toggle,
  Memberstack data-ms-form="login" handles actual auth.
  Opens via data-signin="true" clicks, ?signin=true URL param,
  or window.openSigninModal().
- [FIX] Section 13/14: Null guards on inner elements.
- [UPD] Section 1: Nav drawer wired for data-signin="true" links.

CONTENTS:
1.  Mobile Nav v2.0 (slide menu)
2.  Directory Grid + Theme Assignment
3.  Tab Button
4.  Memberscript #17 — Custom Field as Link
5.  Inactivity Timer (20 min logout)
6.  Fixed Bottom Popup
7.  Character Counter
8.  Dynamic Favicon
9.  Memberscript #45 — Show/Hide Password
10. Jetboost
11. Uploadcare
12. Cleave.js Form Formatting
13. Subscribe Popup
14. Contact Modal
15. GA4 Element Visibility Tracking
16. Sign In Backdrop
17. Sign In Modal
   ================================================ */


/* ── 0. LIBRARY LOADERS ─────────────────────────── */
(function() {
  function loadScript(src, onload) {
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    if (onload) s.onload = onload;
    document.head.appendChild(s);
  }

  window.UPLOADCARE_PUBLIC_KEY = '4534a0ba747a413f13c8';
  loadScript('https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js');

  loadScript('https://cdn.jsdelivr.net/npm/cleave.js@1.6.0', function() {
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/cleave.js/1.6.0/addons/cleave-phone.us.js');
  });
})();


/* ── 1. MOBILE NAV v2.1 ─────────────────────────── */
/*
   CHANGES FROM v2.0:
   - [FIX] Replaced DOMContentLoaded wrapper with event delegation on
     document.body — click handler fires immediately, no DOM-parse wait.
   - [FIX] Wired .inbx-nav-close to closeNav() — was missing after
     injectCloseBtn() removal (close button is now native Webflow DOM).
   - [FIX] Panel uses will-change:transform for GPU-composited slide.
*/
(function () {
  'use strict';

  var savedScrollY = 0;
  var panel = null;
  var trigger = null;

  function getPanel() {
    if (!panel) panel = document.querySelector('.inbx-nav-panel');
    return panel;
  }

  function getTrigger() {
    if (!trigger) trigger = document.querySelector('.mh-menu-tablet');
    return trigger;
  }

  function openNav() {
    var p = getPanel();
    if (!p) return;
    savedScrollY = window.scrollY;
    document.body.classList.add('nav-open');
    document.body.style.top = '-' + savedScrollY + 'px';
    p.setAttribute('aria-hidden', 'false');
  }

  function closeNav() {
    var p = getPanel();
    document.body.classList.remove('nav-open');
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);
    if (p) {
      p.setAttribute('aria-hidden', 'true');
      p.querySelectorAll('.w-dyn-item, .nav-slide-divider, .nav-slide-btn, .nav-slide-auth a')
        .forEach(function (el) {
          el.style.animation = 'none';
          void el.offsetHeight;
          el.style.animation = '';
        });
    }
  }

  /* ── Event delegation — works immediately, no DOM wait ── */
  document.addEventListener('click', function (e) {

    /* OPEN: hamburger trigger */
    var trig = e.target.closest('.mh-menu-tablet');
    if (trig) {
      e.stopPropagation();
      e.preventDefault();
      if (!document.body.classList.contains('nav-open')) openNav();
      return;
    }

    /* CLOSE: X button */
    var closeBtn = e.target.closest('.inbx-nav-close');
    if (closeBtn) {
      e.stopPropagation();
      e.preventDefault();
      closeNav();
      return;
    }

    /* Panel interior clicks */
    var panelEl = e.target.closest('.inbx-nav-panel');
    if (!panelEl) return;

    var subscribeBtn = e.target.closest('[data-subscribe="true"]');
    var contactBtn   = e.target.closest('[data-contact="true"]');
    var signinBtn    = e.target.closest('[data-signin="true"]');

    if (subscribeBtn) {
      e.preventDefault();
      closeNav();
      setTimeout(function () {
        if (typeof window.openSubscribePopup === 'function') window.openSubscribePopup();
      }, 350);
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

    if (signinBtn) {
      e.preventDefault();
      closeNav();
      setTimeout(function () {
        if (typeof window.openSigninModal === 'function') window.openSigninModal();
      }, 350);
      return;
    }

    /* Regular nav link — close drawer */
    var link = e.target.closest('a[href]');
    if (link && !link.hasAttribute('data-subscribe') && !link.hasAttribute('data-contact') && !link.hasAttribute('data-signin')) {
      closeNav();
    }
  }, false);

  /* ── Touch handler for instant mobile response ── */
  document.addEventListener('touchend', function (e) {
    var trig = e.target.closest('.mh-menu-tablet');
    if (trig) {
      e.preventDefault();
      if (!document.body.classList.contains('nav-open')) openNav();
      return;
    }

    var closeBtn = e.target.closest('.inbx-nav-close');
    if (closeBtn) {
      e.preventDefault();
      closeNav();
    }
  }, { passive: false });

  /* ── Accessibility (deferred — these are progressive enhancement) ── */
  document.addEventListener('DOMContentLoaded', function () {
    var t = getTrigger();
    var p = getPanel();
    if (t) {
      t.setAttribute('role', 'button');
      t.setAttribute('tabindex', '0');
      t.setAttribute('aria-label', 'Open menu');
      t.setAttribute('aria-controls', 'inbx-nav-panel');
    }
    if (p) {
      p.setAttribute('id', 'inbx-nav-panel');
      p.setAttribute('role', 'navigation');
      p.setAttribute('aria-hidden', 'true');
    }
  });

  /* ── Keyboard: Enter/Space on hamburger ── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      var trig = e.target.closest('.mh-menu-tablet');
      if (trig) {
        e.preventDefault();
        if (!document.body.classList.contains('nav-open')) openNav();
      }
    }
  });

  /* ── Close on resize above breakpoint ── */
  var mql = window.matchMedia('(min-width: 992px)');
  function handleResize(e) {
    if (e.matches && document.body.classList.contains('nav-open')) {
      closeNav();
    }
  }
  if (mql.addEventListener) {
    mql.addEventListener('change', handleResize);
  } else if (mql.addListener) {
    mql.addListener(handleResize);
  }

})();


/* ── 2. DIRECTORY GRID + THEME ASSIGNMENT ───────── */
(function(){
  var themes=['forest','slate','burgundy','navy','terracotta','plum','copper','teal','sage','charcoal'];
  function assignThemes(){
    var cards=document.querySelectorAll('.collection-list-25 > *');
    for(var i=0;i<cards.length;i++){
      if(!cards[i].getAttribute('data-theme')){
        cards[i].setAttribute('data-theme',themes[i%themes.length]);
      }
    }
  }
  assignThemes();
  window.addEventListener('load',function(){setTimeout(assignThemes,200)});
  var t=document.querySelector('.directory-grid-wrapper,[class*="jetboost-list-wrapper"]');
  if(t) new MutationObserver(assignThemes).observe(t,{childList:true,subtree:true});
})();


/* ── 3. TAB BUTTON ──────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  if (typeof $ === 'undefined') return;
  $(".tab-button").click(function(e) {
    e.preventDefault();
    $(".tab-button").removeClass("tab-button-active");
    $(".w-tab-link:contains(" + e.target.innerText + ")").click();
    $(e.target).addClass("tab-button-active");
  });
});


/* ── 4. MEMBERSCRIPT #17 — CUSTOM FIELD AS LINK ─── */
document.addEventListener("DOMContentLoaded", function() {
  const memberData = JSON.parse(localStorage.getItem('_ms-mem') || '{}');
  if (memberData && memberData.id) {
    const customFields = memberData.customFields;
    const elements = document.querySelectorAll('[ms-code-field-link]');
    elements.forEach(element => {
      const fieldKey = element.getAttribute('ms-code-field-link');
      if (customFields.hasOwnProperty(fieldKey)) {
        const fieldValue = customFields[fieldKey];
        if (fieldValue.trim() === '') {
          element.style.display = 'none';
        } else {
          let link = fieldValue;
          if (!/^https?:\/\//i.test(link)) { link = 'http://' + link; }
          element.setAttribute('href', link);
        }
      } else {
        element.style.display = 'none';
      }
    });
  }
});


/* ── 5. INACTIVITY TIMER (20 min) ───────────────── */
const INACTIVITY_LIMIT = 1200000;
const STORAGE_KEY = 'lastActivityTime';

function getLastActivityTime() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored, 10) : Date.now();
}
function resetInactivityTimer() {
  localStorage.setItem(STORAGE_KEY, Date.now());
}
async function logoutUser() {
  try {
    const memberstack = window.$memberstackDom;
    if (!memberstack) return;
    const { data: member } = await memberstack.getCurrentMember();
    if (member) {
      await memberstack.logout();
      window.location.href = '/expired';
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}
function checkInactivity() {
  if (Date.now() - getLastActivityTime() > INACTIVITY_LIMIT) { logoutUser(); }
}
['mousemove', 'keypress', 'touchstart', 'click', 'scroll'].forEach(event => {
  document.addEventListener(event, resetInactivityTimer);
});
window.onload = () => {
  resetInactivityTimer();
  setInterval(checkInactivity, 30000);
};


/* ── 6. FIXED BOTTOM POPUP ──────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  function showPopup() {
    const popup = document.getElementById('Fixed-Bottom-Div');
    if (popup) {
      popup.style.display = 'block';
      setTimeout(() => { popup.classList.add('show'); }, 50);
    }
  }
  const dismissedUntil = localStorage.getItem('popupDismissedUntil');
  const subscribed = localStorage.getItem('popupSubscribed');
  const now = Date.now();
  if (!subscribed && (!dismissedUntil || now > parseInt(dismissedUntil))) {
    setTimeout(showPopup, 30000);
  }
  const closeDiv = document.querySelector('.Allow-Close-Div');
  if (closeDiv) {
    closeDiv.addEventListener('click', () => {
      localStorage.setItem('popupDismissedUntil', Date.now() + 86400000);
    });
  }
  const form = document.querySelector('#subscribe-form');
  if (form) {
    form.addEventListener('submit', () => { localStorage.setItem('popupSubscribed', 'true'); });
  }
});


/* ── 7. CHARACTER COUNTER ───────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  const MAX_CHARS_PER_WORD = 5;
  function getWordRange(charsRemaining) {
    if (charsRemaining <= 0) return "0–0";
    const maxWords = Math.floor(charsRemaining / MAX_CHARS_PER_WORD);
    if (maxWords < 1) return "0–1";
    return `${Math.round(maxWords * 0.8)}–${maxWords}`;
  }
  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }
  document.querySelectorAll(".ib-char-counter").forEach(counter => {
    const fieldName = counter.dataset.field;
    if (!fieldName) return;
    const input = document.querySelector(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
    if (!input) return;
    const max = parseInt(input.getAttribute("maxlength"), 10);
    if (!max) return;
    const remainingEl = counter.querySelector(".ib-remaining");
    if (!remainingEl) return;
    function update() {
      const wrapper = counter.closest("[class^='field-'], [class*=' field-']");
      if (wrapper && !isVisible(wrapper)) { counter.style.display = "none"; return; }
      counter.style.display = "block";
      const remaining = Math.max(0, max - input.value.length);
      remainingEl.textContent = `${remaining} characters remaining (~${getWordRange(remaining)} words)`;
      counter.classList.toggle("ib-warning", remaining <= max * 0.2);
      counter.classList.toggle("ib-danger", remaining <= max * 0.05);
    }
    update();
    input.addEventListener("input", update);
    input.addEventListener("blur", update);
  });
});


/* ── 8. DYNAMIC FAVICON ─────────────────────────── */
(function() {
  const subdomain = window.location.hostname.split('.')[0];
  const faviconMap = {
    'wyckoff-living-now': 'https://uyluucdnr2.ucarecd.net/4825a27d-42a4-43ec-971f-25eba7eade09/WLNFavicon1.png'
  };
  if (faviconMap[subdomain]) {
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = faviconMap[subdomain];
    document.head.appendChild(link);
  }
})();


/* ── 9. MEMBERSCRIPT #45 — SHOW/HIDE PASSWORD ──── */
document.querySelectorAll("[ms-code-password='transform']").forEach(function(button) {
  var isPassword = true;
  button.addEventListener("click", function() {
    var passwordInputs = document.querySelectorAll(
      "[data-ms-member='password'], [data-ms-member='new-password'], [data-ms-member='current-password']"
    );
    passwordInputs.forEach(function(myInput) {
      myInput.setAttribute("type", isPassword ? "text" : "password");
    });
    isPassword = !isPassword;
  });
});


/* ── 10. JETBOOST ───────────────────────────────── */
window.JETBOOST_SITE_ID = "clkv6ks4h012u0juqgxzeb7n6";
(function(d) {
  var s = d.createElement("script");
  s.src = "https://cdn.jetboost.io/jetboost.js";
  s.async = 1;
  d.getElementsByTagName("head")[0].appendChild(s);
})(document);


/* ── 11. UPLOADCARE ─────────────────────────────── */
// Loaded via Section 0 library loader above


/* ── 12. CLEAVE.JS FORM FORMATTING ─────────────── */
document.addEventListener('DOMContentLoaded', function(){
  const elements = document.querySelectorAll('[ms-code-autoformat], [ms-code-autoformat-prefix]');
  for (let element of elements) {
    const formatType = element.getAttribute('ms-code-autoformat');
    const prefix = element.getAttribute('ms-code-autoformat-prefix');
    let cleaveOptions = { prefix: prefix || '', blocks: [Infinity] };
    if (formatType) {
      switch (formatType) {
        case 'phone-number': cleaveOptions.phone = true; cleaveOptions.phoneRegionCode = 'US'; break;
        case 'date-yyyy-mm-dd': cleaveOptions.date = true; cleaveOptions.datePattern = ['Y','m','d']; break;
        case 'date-mm-dd-yyyy': cleaveOptions.date = true; cleaveOptions.datePattern = ['m','d','Y']; break;
        case 'date-dd-mm-yyyy': cleaveOptions.date = true; cleaveOptions.datePattern = ['d','m','Y']; break;
        case 'time-hh-mm-ss': cleaveOptions.time = true; cleaveOptions.timePattern = ['h','m','s']; break;
        case 'time-hh-mm': cleaveOptions.time = true; cleaveOptions.timePattern = ['h','m']; break;
        case 'number-thousand': cleaveOptions.numeral = true; cleaveOptions.numeralThousandsGroupStyle = 'thousand'; break;
      }
    }
    new Cleave(element, cleaveOptions);
  }
});


/* ── 13. SUBSCRIBE POPUP ────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  var overlay        = document.getElementById('subscribeOverlay');
  var popup          = document.getElementById('subscribePopup');
  var closeBtn       = document.getElementById('subscribeClose');
  var form           = document.getElementById('subscribeForm');
  var contentWrapper = document.getElementById('subscribeContent');
  var successWrapper = document.getElementById('subscribeSuccess');
  var emailInput     = document.getElementById('subscribeEmail');
  var zipInput       = document.getElementById('subscribeZip');
  var emailError     = document.getElementById('emailError');
  var zipError       = document.getElementById('zipError');
  var submitBtn      = document.getElementById('subscribeSubmit');

  if (!overlay || !popup || !form || !emailInput || !zipInput) {
    window.openSubscribePopup = function(){};
    return;
  }

  var SUBSCRIBE_WEBHOOK = 'https://hook.us1.make.com/t67jnl5pbt5wlgyly99nlhjjolit7ice';

  function showSuccess() {
    /* Hide header + benefits + form — success replaces everything */
    var header   = popup.querySelector('.subscribe-popup__header');
    var benefits = popup.querySelector('.subscribe-popup__benefits');
    if (header)   header.style.display = 'none';
    if (benefits) benefits.style.display = 'none';
    if (contentWrapper) contentWrapper.style.display = 'none';
    if (successWrapper) successWrapper.classList.add('show');
    setTimeout(closeSubscribePopup, 6000);
  }

  function resetPopupUI() {
    /* Restore everything when closing */
    var header   = popup.querySelector('.subscribe-popup__header');
    var benefits = popup.querySelector('.subscribe-popup__benefits');
    if (header)   header.style.display = '';
    if (benefits) benefits.style.display = '';
    if (contentWrapper) contentWrapper.style.display = '';
    if (successWrapper) successWrapper.classList.remove('show');
    form.classList.remove('hidden');
    form.reset();
    if (emailInput)  emailInput.classList.remove('input-error');
    if (zipInput)    zipInput.classList.remove('input-error');
    if (emailError)  emailError.classList.remove('show');
    if (zipError)    zipError.classList.remove('show');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign Me Up!'; }
  }

  function openSubscribePopup() {
    overlay.classList.add('active');
    popup.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSubscribePopup() {
    overlay.classList.remove('active');
    popup.classList.remove('active');
    document.body.style.overflow = '';
    var url = new URL(window.location);
    url.searchParams.delete('subscribe');
    window.history.replaceState({}, '', url);
    setTimeout(resetPopupUI, 350);
  }

  function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  function validateZip(z)   { return /^\d{5}$/.test(z); }

  emailInput.addEventListener('input', function() {
    if (emailInput.classList.contains('input-error') && validateEmail(emailInput.value)) {
      emailInput.classList.remove('input-error');
      if (emailError) emailError.classList.remove('show');
    }
  });
  zipInput.addEventListener('input', function() {
    zipInput.value = zipInput.value.replace(/\D/g, '').slice(0, 5);
    if (zipInput.classList.contains('input-error') && validateZip(zipInput.value)) {
      zipInput.classList.remove('input-error');
      if (zipError) zipError.classList.remove('show');
    }
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var valid = true;
    if (!validateEmail(emailInput.value)) {
      emailInput.classList.add('input-error');
      if (emailError) emailError.classList.add('show');
      valid = false;
    }
    if (!validateZip(zipInput.value)) {
      zipInput.classList.add('input-error');
      if (zipError) zipError.classList.add('show');
      valid = false;
    }
    if (!valid) return;

    /* Honeypot check — hidden field in footer HTML */
    var honeypot = form.querySelector('#subscribeHoneypot');
    if (honeypot && honeypot.value) return;

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

    /* Read multi-tenant data from CMS-bound div */
    var dataDiv = document.querySelector('.contact-publisher-data');
    var payload = {
      email:     emailInput.value.trim(),
      zip:       zipInput.value.trim(),
      publisher: dataDiv ? (dataDiv.dataset.publisher || '') : '',
      title:     dataDiv ? (dataDiv.dataset.title || '') : '',
      title_id:  dataDiv ? (dataDiv.dataset.titleId || '') : ''
    };

    fetch(SUBSCRIBE_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(showSuccess).catch(showSuccess);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeSubscribePopup);
  overlay.addEventListener('click', closeSubscribePopup);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && popup.classList.contains('active')) closeSubscribePopup();
  });

  window.openSubscribePopup = openSubscribePopup;

  document.querySelectorAll('[data-subscribe="true"]').forEach(function(el) {
    el.addEventListener('click', function(e) { e.preventDefault(); openSubscribePopup(); });
  });

  if (new URLSearchParams(window.location.search).get('subscribe') === 'true') {
    setTimeout(openSubscribePopup, 500);
  }
});


/* ── 14. CONTACT MODAL ──────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  'use strict';
  var WEBHOOK_URL = 'https://hook.us1.make.com/jpwexn5422dumimghplq5874ehlpgybg';
  var overlay    = document.getElementById('contactModalOverlay');
  var modal      = document.getElementById('contactModal');
  var closeBtn   = document.getElementById('contactModalClose');
  var form       = document.getElementById('contactModalForm');
  var submitBtn  = document.getElementById('contactSubmitBtn');
  var errorDiv   = document.getElementById('contactError');
  var successDiv = document.getElementById('contactSuccess');
  var pubCard    = document.getElementById('contactPublisherCard');
  var pubPhoto   = document.getElementById('contactPubPhoto');
  var pubName    = document.getElementById('contactPubName');
  var pubPhone   = document.getElementById('contactPubPhone');
  var pubEmail   = document.getElementById('contactPubEmail');

  if (!overlay || !modal || !form) {
    window.openContactModal = function(){};
    return;
  }

  function populatePublisher() {
    var dataDiv = document.querySelector('.contact-publisher-data');
    if (!dataDiv || !pubCard) return;
    var headshot = dataDiv.dataset.headshot || '';
    var name     = dataDiv.dataset.name || '';
    var phone    = dataDiv.dataset.phone || '';
    var email    = dataDiv.dataset.email || '';
    if (!name && !phone && !email) { pubCard.style.display = 'none'; return; }
    if (headshot && pubPhoto) { pubPhoto.src = headshot; } else if (pubPhoto) { pubPhoto.style.display = 'none'; }
    if (pubName)  pubName.textContent  = name;
    if (pubPhone) pubPhone.textContent = phone;
    if (pubEmail && email) { pubEmail.textContent = email; pubEmail.href = 'mailto:' + email; }
    pubCard.style.display = '';
  }

  window.openContactModal = function() {
    populatePublisher();
    overlay.classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  function closeContactModal() {
    overlay.classList.remove('active');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(function() {
      form.reset();
      form.style.display = '';
      if (successDiv) successDiv.classList.remove('active');
      if (errorDiv) { errorDiv.classList.remove('active'); errorDiv.textContent = ''; }
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit'; }
    }, 300);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeContactModal);
  overlay.addEventListener('click', closeContactModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeContactModal();
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (errorDiv) { errorDiv.classList.remove('active'); errorDiv.textContent = ''; }
    var nameVal  = ((form.querySelector('#contact-name') || {}).value || '').trim();
    var emailVal = ((form.querySelector('#contact-email') || {}).value || '').trim();
    if (!nameVal) {
      if (errorDiv) { errorDiv.textContent = 'Please enter your name.'; errorDiv.classList.add('active'); }
      return;
    }
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      if (errorDiv) { errorDiv.textContent = 'Please enter a valid email address.'; errorDiv.classList.add('active'); }
      return;
    }
    var phoneVal = ((form.querySelector('#contact-phone') || {}).value || '').trim();
    if (phoneVal && phoneVal.replace(/[^0-9]/g,'').length !== 10) {
      if (errorDiv) { errorDiv.textContent = 'Please enter a 10-digit phone number.'; errorDiv.classList.add('active'); }
      return;
    }
    var purposeRadio = form.querySelector('input[name="purpose"]:checked');
    var dataDiv = document.querySelector('.contact-publisher-data');
    var payload = {
      name: nameVal, email: emailVal, phone: phoneVal,
      company:   ((form.querySelector('#contact-company') || {}).value || '').trim(),
      purpose:   purposeRadio ? purposeRadio.value : '',
      comments:  ((form.querySelector('#contact-comments') || {}).value || '').trim(),
      website:   (form.querySelector('#contact-website') || {}).value || '',
      publisher: dataDiv ? (dataDiv.dataset.publisher || '') : '',
      title:     dataDiv ? (dataDiv.dataset.title || '') : '',
      title_id:  dataDiv ? (dataDiv.dataset.titleId || '') : ''
    };
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }
    fetch(WEBHOOK_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      .then(function(response) {
        if (response.ok || response.status === 200) {
          form.style.display = 'none';
          if (pubCard) pubCard.style.display = 'none';
          if (successDiv) successDiv.classList.add('active');
        } else { throw new Error('Server responded with ' + response.status); }
      }).catch(function() {
        if (errorDiv) { errorDiv.textContent = 'Something went wrong. Please try again or contact us directly.'; errorDiv.classList.add('active'); }
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit'; }
      });
  });

  document.querySelectorAll('[data-contact="true"]').forEach(function(el) {
    el.addEventListener('click', function(e) { e.preventDefault(); window.openContactModal(); });
  });
  if (new URLSearchParams(window.location.search).get('contact') === 'true') {
    setTimeout(window.openContactModal, 500);
  }
});


/* ── 15. GA4 ELEMENT VISIBILITY TRACKING ────────── */
(function() {
  'use strict';
  var tracked = new Set();
  var THRESHOLD = 0.25;
  var MIN_VIEW_MS = 500;
  var timers = new Map();
  var observer;

  function fireEvent(el) {
    var uid = el.getAttribute('data-track-id') || el.id || 'unknown';
    if (tracked.has(uid)) return;
    tracked.add(uid);
    function inherit(attr) {
      if (el.getAttribute(attr)) return el.getAttribute(attr);
      var parent = el.parentElement;
      while (parent && parent !== document.body) {
        if (parent.getAttribute(attr)) return parent.getAttribute(attr);
        parent = parent.parentElement;
      }
      return '';
    }
    var params = {
      'element_type':      el.getAttribute('data-track-type') || 'unknown',
      'element_id':        uid,
      'element_name':      el.getAttribute('data-track-name') || '',
      'element_position':  el.getAttribute('data-track-position') || '',
      'advertiser':        el.getAttribute('data-track-advertiser') || '',
      'advertiser_id':     el.getAttribute('data-track-advertiser-id') || '',
      'newsletter_id':     inherit('data-track-newsletter'),
      'newsletter_name':   inherit('data-track-newsletter-name'),
      'page_type':         document.body.getAttribute('data-page-type') || 'unknown'
    };
    Object.keys(params).forEach(function(k) { if (!params[k]) delete params[k]; });
    if (typeof gtag === 'function') { gtag('event', 'element_view', params); }
  }

  function onIntersect(entries) {
    entries.forEach(function(entry) {
      var el = entry.target;
      var uid = el.getAttribute('data-track-id') || el.id || Math.random().toString(36).substr(2);
      if (entry.isIntersecting) {
        if (!timers.has(uid)) {
          timers.set(uid, setTimeout(function() {
            fireEvent(el);
            if (observer) observer.unobserve(el);
            timers.delete(uid);
          }, MIN_VIEW_MS));
        }
      } else {
        if (timers.has(uid)) { clearTimeout(timers.get(uid)); timers.delete(uid); }
      }
    });
  }

  observer = new IntersectionObserver(onIntersect, { threshold: THRESHOLD });

  function observeAll() {
    document.querySelectorAll('[data-track-view]').forEach(function(el) { observer.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeAll);
  } else {
    observeAll();
  }
  var wrapper = document.querySelector('[class*="jetboost-list-wrapper"], .directory-grid-wrapper');
  if (wrapper) { new MutationObserver(function() { setTimeout(observeAll, 300); }).observe(wrapper, { childList: true, subtree: true }); }
  window.addEventListener('load', function() { setTimeout(observeAll, 500); });
})();


/* ── 16. SIGN IN BACKDROP ───────────────────────── */
/*
   Watches #signinModal for active class and toggles #inbx-backdrop.
*/
document.addEventListener('DOMContentLoaded', function () {
  var backdrop = document.getElementById('inbx-backdrop');
  var modal    = document.getElementById('signinModal');
  if (!backdrop || !modal) return;

  var observer = new MutationObserver(function () {
    if (modal.classList.contains('active')) {
      backdrop.classList.add('visible');
    } else {
      backdrop.classList.remove('visible');
    }
  });

  observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
});


/* ── 17. SIGN IN MODAL ──────────────────────────── */
/*
   Opens/closes the sign-in modal. Memberstack handles actual auth
   via data-ms-form="login" on the form — we just handle UI.
   Triggers: data-signin="true" clicks, ?signin=true URL, window.openSigninModal()
*/
document.addEventListener('DOMContentLoaded', function() {
  var overlay   = document.getElementById('signinOverlay');
  var modal     = document.getElementById('signinModal');
  var closeBtn  = document.getElementById('signinClose');
  var form      = document.getElementById('signinForm');
  var errorDiv  = document.getElementById('signinError');
  var submitBtn = document.getElementById('signinSubmit');
  var eyeToggle = document.getElementById('signinEyeToggle');
  var pwInput   = document.getElementById('signin-password');

  if (!overlay || !modal) {
    window.openSigninModal = function(){};
    return;
  }

  function openSigninModal() {
    overlay.classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSigninModal() {
    overlay.classList.remove('active');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(function() {
      if (form) form.reset();
      if (errorDiv) { errorDiv.classList.remove('active'); errorDiv.textContent = ''; }
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign In'; }
      /* Reset password visibility */
      if (pwInput) pwInput.type = 'password';
      if (eyeToggle) {
        var showSvg = eyeToggle.querySelector('.signin-modal__eye-show');
        var hideSvg = eyeToggle.querySelector('.signin-modal__eye-hide');
        if (showSvg) showSvg.style.display = '';
        if (hideSvg) hideSvg.style.display = 'none';
      }
    }, 300);
  }

  /* Password eye toggle */
  if (eyeToggle && pwInput) {
    eyeToggle.addEventListener('click', function(e) {
      e.preventDefault();
      var isPassword = pwInput.type === 'password';
      pwInput.type = isPassword ? 'text' : 'password';
      var showSvg = eyeToggle.querySelector('.signin-modal__eye-show');
      var hideSvg = eyeToggle.querySelector('.signin-modal__eye-hide');
      if (showSvg) showSvg.style.display = isPassword ? 'none' : '';
      if (hideSvg) hideSvg.style.display = isPassword ? '' : 'none';
    });
  }

  /* Close handlers */
  if (closeBtn) closeBtn.addEventListener('click', closeSigninModal);
  if (overlay)  overlay.addEventListener('click', closeSigninModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeSigninModal();
  });

  /* Expose globally */
  window.openSigninModal = openSigninModal;

  /* Wire data-signin="true" buttons */
  document.querySelectorAll('[data-signin="true"]').forEach(function(el) {
    el.addEventListener('click', function(e) { e.preventDefault(); openSigninModal(); });
  });

  /* URL trigger: ?signin=true */
  if (new URLSearchParams(window.location.search).get('signin') === 'true') {
    setTimeout(openSigninModal, 500);
  }

  /*
     Memberstack error handling:
     Memberstack fires its own validation on data-ms-form="login".
     If MS shows an error, we can optionally surface it in our UI.
     Listen for MS error events if available.
  */
  if (window.$memberstackDom && window.$memberstackDom.onReady) {
    window.$memberstackDom.onReady.then(function(ms) {
      /* Memberstack will handle the form submit natively via data-ms-form="login".
         On success, MS redirects or reloads. On failure, we show the error. */
    }).catch(function() { /* MS not loaded yet, form still works when it loads */ });
  }
});
