/* ================================================
   INBXIFY — Site-Wide Body Code
   Repo: jbrady74/inbxify-site-code
   File: body.js
   Version: 1.7 — March 2026

CHANGES FROM 1.5:
- [FIX] Section 13: Wrapped in DOMContentLoaded — subscribe popup
  HTML lives in Webflow Before-Body footer, which loads AFTER this
  script executes from the Head. Without the wrapper, getElementById
  returns null for every element and the section bails immediately.
- [FIX] Section 14: Same DOMContentLoaded wrapper for contact modal.
- [FIX] Section 16: Moved getElementById('inbx-backdrop') inside
  DOMContentLoaded so it finds the footer-injected backdrop div.
- [FIX] Section 13: Added null guards on closeBtn, contentWrapper,
  successWrapper, emailError, zipError, submitBtn.
- [FIX] Section 16: Added null guard on backdrop.

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


/* ── 1. MOBILE NAV v2.0 ─────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var trigger = document.querySelector('.mh-menu-tablet');
  var panel   = document.querySelector('.inbx-nav-panel');
  if (!trigger || !panel) return;

  var savedScrollY = 0;

  function injectBars() {
    if (trigger.querySelector('.nav-bar')) return;
    trigger.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var bar = document.createElement('span');
      bar.className = 'nav-bar';
      bar.setAttribute('aria-hidden', 'true');
      trigger.appendChild(bar);
    }
  }

  function injectCloseBtn() {
    if (panel.querySelector('.inbx-nav-close')) return;
    var btn = document.createElement('button');
    btn.className = 'inbx-nav-close';
    btn.setAttribute('aria-label', 'Close menu');
    btn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      closeNav();
    });
    panel.insertBefore(btn, panel.firstChild);
  }

  function openNav() {
    savedScrollY = window.scrollY;
    document.body.classList.add('nav-open');
    document.body.style.top = '-' + savedScrollY + 'px';
    panel.setAttribute('aria-hidden', 'false');
  }

  function closeNav() {
    document.body.classList.remove('nav-open');
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);
    panel.setAttribute('aria-hidden', 'true');

    panel.querySelectorAll('.w-dyn-item, .nav-slide-divider, .nav-slide-btn, .nav-slide-auth a')
      .forEach(function (el) {
        el.style.animation = 'none';
        void el.offsetHeight;
        el.style.animation = '';
      });
  }

  function handleOpen(e) {
    e.stopPropagation();
    e.preventDefault();
    if (!document.body.classList.contains('nav-open')) {
      openNav();
    }
  }

  trigger.addEventListener('click', handleOpen, false);

  trigger.addEventListener('touchend', function (e) {
    e.preventDefault();
    handleOpen(e);
  }, { passive: false });

  trigger.setAttribute('role', 'button');
  trigger.setAttribute('tabindex', '0');
  trigger.setAttribute('aria-label', 'Open menu');
  trigger.setAttribute('aria-controls', 'inbx-nav-panel');
  panel.setAttribute('id', 'inbx-nav-panel');
  panel.setAttribute('role', 'navigation');
  panel.setAttribute('aria-hidden', 'true');

  trigger.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen(e);
    }
  });

  panel.addEventListener('click', function (e) {
    var subscribeBtn = e.target.closest('[data-subscribe="true"]');
    var contactBtn   = e.target.closest('[data-contact="true"]');

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
  });

  panel.querySelectorAll('a[href]').forEach(function (link) {
    if (link.hasAttribute('data-subscribe') || link.hasAttribute('data-contact')) return;
    link.addEventListener('click', function () {
      closeNav();
    });
  });

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

  injectBars();
  injectCloseBtn();

});


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
/*
   v1.7: Wrapped in DOMContentLoaded.
   This script loads from <head>. The subscribe popup HTML lives in the
   Webflow Before-</body> footer block, which hasn't been parsed yet when
   <head> scripts execute. Without DOMContentLoaded, every getElementById
   returns null and the section silently bails via the gate check.
*/
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

  /* Gate: bail if critical elements are missing */
  if (!overlay || !popup || !form || !emailInput || !zipInput) {
    window.openSubscribePopup = function(){};
    return;
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
    setTimeout(function() {
      if (contentWrapper) contentWrapper.style.display = '';
      if (successWrapper) successWrapper.classList.remove('show');
      form.classList.remove('hidden');
      form.reset();
      if (emailInput)  emailInput.classList.remove('input-error');
      if (zipInput)    zipInput.classList.remove('input-error');
      if (emailError)  emailError.classList.remove('show');
      if (zipError)    zipError.classList.remove('show');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Sign Me Up!'; }
    }, 350);
  }

  function showSuccess() {
    if (contentWrapper) contentWrapper.style.display = 'none';
    if (successWrapper) successWrapper.classList.add('show');
    setTimeout(closeSubscribePopup, 5000);
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
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }
    var formData = new FormData(form);
    fetch(form.action, { method: 'POST', body: formData })
      .then(showSuccess).catch(showSuccess);
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
/*
   v1.7: Wrapped in DOMContentLoaded.
   Same reason as Section 13 — modal HTML is in the Before-</body> footer.
*/
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
    var nameVal  = (form.querySelector('#contact-name') || {}).value || '';
    nameVal = nameVal.trim();
    var emailVal = (form.querySelector('#contact-email') || {}).value || '';
    emailVal = emailVal.trim();
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
      name: nameVal,
      email: emailVal,
      phone: phoneVal,
      company:   ((form.querySelector('#contact-company') || {}).value || '').trim(),
      purpose:   purposeRadio ? purposeRadio.value : '',
      comments:  ((form.querySelector('#contact-comments') || {}).value || '').trim(),
      website:   (form.querySelector('#contact-website') || {}).value || '',
      publisher: dataDiv ? (dataDiv.dataset.publisher || '') : '',
      title:     dataDiv ? (dataDiv.dataset.title || '') : '',
      title_id:  dataDiv ? (dataDiv.dataset.titleId || '') : ''
    };
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    }).then(function(response) {
      if (response.ok || response.status === 200) {
        form.style.display = 'none';
        if (pubCard) pubCard.style.display = 'none';
        if (successDiv) successDiv.classList.add('active');
      } else {
        throw new Error('Server responded with ' + response.status);
      }
    }).catch(function() {
      if (errorDiv) {
        errorDiv.textContent = 'Something went wrong. Please try again or contact us directly.';
        errorDiv.classList.add('active');
      }
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
   v1.7: Wrapped getElementById in DOMContentLoaded.
   #inbx-backdrop lives in the Before-</body> footer block.
*/
document.addEventListener('DOMContentLoaded', function () {
  var backdrop = document.getElementById('inbx-backdrop');
  if (!backdrop) return;

  var modal = document.querySelector('.sign-in');
  if (!modal) return;

  var observer = new MutationObserver(function () {
    var style = window.getComputedStyle(modal);
    if (style.display !== 'none' && style.visibility !== 'hidden') {
      backdrop.classList.add('visible');
    } else {
      backdrop.classList.remove('visible');
    }
  });

  observer.observe(modal, { attributes: true, attributeFilter: ['style', 'class'] });

  var parent = modal.parentElement;
  if (parent) {
    observer.observe(parent, { attributes: true, attributeFilter: ['style', 'class'] });
  }
});
