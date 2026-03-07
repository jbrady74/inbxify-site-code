/* ================================================
   INBXIFY — Site-Wide Body Code
   Repo: jbrady74/inbxify-site-code
   File: body.js
   Version: 1.0 — March 2026

   CONTENTS:
   1.  Mobile Nav (slide menu)
   2.  Directory Grid + Theme Assignment
   3.  Tab Button
   4.  Memberscript #17 — Custom Field as Link
   5.  Inactivity Timer (20 min logout)
   6.  Fixed Bottom Popup
   7.  Character Counter
   8.  Dynamic Favicon
   9.  Mobile Nav (body delegate — duplicate handler)
   10. Memberscript #45 — Show/Hide Password
   11. Jetboost
   12. Uploadcare
   13. Cleave.js Form Formatting
   14. Subscribe Popup
   15. Contact Modal
   16. GA4 Element Visibility Tracking
   17. Sign In Backdrop
   ================================================ */


/* ── 1. MOBILE NAV ──────────────────────────────── */
(function(){
  document.addEventListener('click', function(e) {
    if (e.target.closest('.mh-menu-tablet')) {
      document.querySelector('.slide-menu').classList.add('is-open');
      document.querySelector('.mobile-nav-i').classList.add('is-active');
      document.body.style.overflow = 'hidden';
      return;
    }
    if (e.target.closest('.bam-closer') || e.target.classList.contains('mobile-nav-i')) {
      document.querySelector('.slide-menu').classList.remove('is-open');
      document.querySelector('.mobile-nav-i').classList.remove('is-active');
      document.body.style.overflow = '';
    }
  }, true);
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
$(".tab-button").click(function(e) {
  e.preventDefault();
  $(".tab-button").removeClass("tab-button-active");
  $(".w-tab-link:contains(" + e.target.innerText + ")").click();
  $(e.target).addClass("tab-button-active");
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


/* ── 9. MOBILE NAV BODY DELEGATE ────────────────── */
document.body.addEventListener('click', function(e) {
  var trigger = e.target.closest('.mh-menu-mobile2, .mh-menu-tablet');
  var closer = e.target.closest('.bam-closer');
  var overlay = e.target.classList.contains('mobile-nav-i');
  if (trigger) {
    document.querySelector('.slide-menu').classList.add('is-open');
    document.querySelector('.mobile-nav-i').classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }
  if (closer || overlay) {
    document.querySelector('.slide-menu').classList.remove('is-open');
    document.querySelector('.mobile-nav-i').classList.remove('is-active');
    document.body.style.overflow = '';
  }
});


/* ── 10. MEMBERSCRIPT #45 — SHOW/HIDE PASSWORD ──── */
document.querySelectorAll("[ms-code-password='transform']").forEach(function(button) {
  button.addEventListener("click", transform);
});
var isPassword = true;
function transform() {
  var passwordInputs = document.querySelectorAll("[data-ms-member='password'], [data-ms-member='new-password'], [data-ms-member='current-password']");
  passwordInputs.forEach(function(myInput) {
    myInput.setAttribute("type", isPassword ? "text" : "password");
  });
  isPassword = !isPassword;
}


/* ── 11. JETBOOST ───────────────────────────────── */
window.JETBOOST_SITE_ID = "clkv6ks4h012u0juqgxzeb7n6";
(function(d) {
  var s = d.createElement("script");
  s.src = "https://cdn.jetboost.io/jetboost.js";
  s.async = 1;
  d.getElementsByTagName("head")[0].appendChild(s);
})(document);


/* ── 12. UPLOADCARE ─────────────────────────────── */
// Public key set inline; widget loaded via external script tag in Webflow
// UPLOADCARE_PUBLIC_KEY = '4534a0ba747a413f13c8'


/* ── 13. CLEAVE.JS FORM FORMATTING ─────────────── */
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


/* ── 14. SUBSCRIBE POPUP ────────────────────────── */
(function() {
  var overlay   = document.getElementById('subscribeOverlay');
  var popup     = document.getElementById('subscribePopup');
  var closeBtn  = document.getElementById('subscribeClose');
  var form      = document.getElementById('subscribeForm');
  var contentWrapper = document.getElementById('subscribeContent');
  var successWrapper = document.getElementById('subscribeSuccess');
  var emailInput = document.getElementById('subscribeEmail');
  var zipInput   = document.getElementById('subscribeZip');
  var emailError = document.getElementById('emailError');
  var zipError   = document.getElementById('zipError');
  var submitBtn  = document.getElementById('subscribeSubmit');

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
      contentWrapper.style.display = '';
      successWrapper.classList.remove('show');
      form.classList.remove('hidden');
      form.reset();
      emailInput.classList.remove('input-error');
      zipInput.classList.remove('input-error');
      emailError.classList.remove('show');
      zipError.classList.remove('show');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign Me Up!';
    }, 350);
  }
  function showSuccess() {
    contentWrapper.style.display = 'none';
    successWrapper.classList.add('show');
    setTimeout(closeSubscribePopup, 5000);
  }
  function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  function validateZip(z)   { return /^\d{5}$/.test(z); }

  emailInput.addEventListener('input', function() {
    if (emailInput.classList.contains('input-error') && validateEmail(emailInput.value)) {
      emailInput.classList.remove('input-error'); emailError.classList.remove('show');
    }
  });
  zipInput.addEventListener('input', function() {
    zipInput.value = zipInput.value.replace(/\D/g, '').slice(0, 5);
    if (zipInput.classList.contains('input-error') && validateZip(zipInput.value)) {
      zipInput.classList.remove('input-error'); zipError.classList.remove('show');
    }
  });

  if (form) form.addEventListener('submit', function(e) {
    e.preventDefault();
    var valid = true;
    if (!validateEmail(emailInput.value)) { emailInput.classList.add('input-error'); emailError.classList.add('show'); valid = false; }
    if (!validateZip(zipInput.value))     { zipInput.classList.add('input-error');   zipError.classList.add('show');   valid = false; }
    if (!valid) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    var formData = new FormData(form);
    fetch(form.action, { method: 'POST', body: formData })
      .then(showSuccess).catch(showSuccess);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeSubscribePopup);
  if (overlay)  overlay.addEventListener('click', closeSubscribePopup);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && popup && popup.classList.contains('active')) closeSubscribePopup();
  });
  window.openSubscribePopup = openSubscribePopup;
  document.querySelectorAll('[data-subscribe="true"]').forEach(function(el) {
    el.addEventListener('click', function(e) { e.preventDefault(); openSubscribePopup(); });
  });
  (function() {
    if (new URLSearchParams(window.location.search).get('subscribe') === 'true') {
      setTimeout(openSubscribePopup, 500);
    }
  })();
})();


/* ── 15. CONTACT MODAL ──────────────────────────── */
(function() {
  'use strict';
  const WEBHOOK_URL = 'https://hook.us1.make.com/jpwexn5422dumimghplq5874ehlpgybg';
  const overlay    = document.getElementById('contactModalOverlay');
  const modal      = document.getElementById('contactModal');
  const closeBtn   = document.getElementById('contactModalClose');
  const form       = document.getElementById('contactModalForm');
  const submitBtn  = document.getElementById('contactSubmitBtn');
  const errorDiv   = document.getElementById('contactError');
  const successDiv = document.getElementById('contactSuccess');
  const pubCard    = document.getElementById('contactPublisherCard');
  const pubPhoto   = document.getElementById('contactPubPhoto');
  const pubName    = document.getElementById('contactPubName');
  const pubPhone   = document.getElementById('contactPubPhone');
  const pubEmail   = document.getElementById('contactPubEmail');

  function populatePublisher() {
    const dataDiv = document.querySelector('.contact-publisher-data');
    if (!dataDiv) { pubCard.style.display = 'none'; return; }
    const headshot = dataDiv.dataset.headshot || '';
    const name     = dataDiv.dataset.name || '';
    const phone    = dataDiv.dataset.phone || '';
    const email    = dataDiv.dataset.email || '';
    if (!name && !phone && !email) { pubCard.style.display = 'none'; return; }
    if (headshot) { pubPhoto.src = headshot; } else { pubPhoto.style.display = 'none'; }
    pubName.textContent  = name;
    pubPhone.textContent = phone;
    if (email) { pubEmail.textContent = email; pubEmail.href = 'mailto:' + email; }
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
      successDiv.classList.remove('active');
      errorDiv.classList.remove('active');
      errorDiv.textContent = '';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }, 300);
  }

  if (closeBtn) closeBtn.addEventListener('click', closeContactModal);
  if (overlay)  overlay.addEventListener('click', closeContactModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) closeContactModal();
  });

  if (form) form.addEventListener('submit', async function(e) {
    e.preventDefault();
    errorDiv.classList.remove('active'); errorDiv.textContent = '';
    const name  = form.querySelector('#contact-name').value.trim();
    const email = form.querySelector('#contact-email').value.trim();
    if (!name) { errorDiv.textContent = 'Please enter your name.'; errorDiv.classList.add('active'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errorDiv.textContent = 'Please enter a valid email address.'; errorDiv.classList.add('active'); return; }
    const phone = form.querySelector('#contact-phone').value.trim();
    if (phone && phone.replace(/[^0-9]/g,'').length !== 10) {
      errorDiv.textContent = 'Please enter a 10-digit phone number.'; errorDiv.classList.add('active'); return;
    }
    const purposeRadio = form.querySelector('input[name="purpose"]:checked');
    const dataDiv = document.querySelector('.contact-publisher-data');
    const payload = {
      name, email, phone,
      company:  form.querySelector('#contact-company').value.trim(),
      purpose:  purposeRadio ? purposeRadio.value : '',
      comments: form.querySelector('#contact-comments').value.trim(),
      website:  form.querySelector('#contact-website').value,
      publisher: dataDiv ? (dataDiv.dataset.publisher || '') : '',
      title:     dataDiv ? (dataDiv.dataset.title || '') : '',
      title_id:  dataDiv ? (dataDiv.dataset.titleId || '') : ''
    };
    submitBtn.disabled = true; submitBtn.textContent = 'Sending...';
    try {
      const response = await fetch(WEBHOOK_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (response.ok || response.status === 200) {
        form.style.display = 'none'; pubCard.style.display = 'none'; successDiv.classList.add('active');
      } else { throw new Error('Server responded with ' + response.status); }
    } catch(err) {
      errorDiv.textContent = 'Something went wrong. Please try again or contact us directly.';
      errorDiv.classList.add('active'); submitBtn.disabled = false; submitBtn.textContent = 'Submit';
    }
  });

  document.querySelectorAll('[data-contact="true"]').forEach(function(el) {
    el.addEventListener('click', function(e) { e.preventDefault(); openContactModal(); });
  });
  if (new URLSearchParams(window.location.search).get('contact') === 'true') {
    setTimeout(openContactModal, 500);
  }
})();


/* ── 16. GA4 ELEMENT VISIBILITY TRACKING ────────── */
(function() {
  'use strict';
  var tracked = new Set();
  var THRESHOLD = 0.25;
  var MIN_VIEW_MS = 500;
  var timers = new Map();

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
            fireEvent(el); observer.unobserve(el); timers.delete(uid);
          }, MIN_VIEW_MS));
        }
      } else {
        if (timers.has(uid)) { clearTimeout(timers.get(uid)); timers.delete(uid); }
      }
    });
  }

  var observer = new IntersectionObserver(onIntersect, { threshold: THRESHOLD });

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


/* ── 17. SIGN IN BACKDROP ───────────────────────── */
(function () {
  var backdrop = document.getElementById('inbx-backdrop');

  function checkModal() {
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkModal);
  } else {
    checkModal();
  }
})();
