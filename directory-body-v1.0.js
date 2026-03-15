/* ============================================
   INBXIFY DIRECTORY PAGE — Combined JS
   File: directory-body-v1.0.js
   GitHub: jbrady74/inbxify-site-code
   jsDelivr: https://cdn.jsdelivr.net/gh/jbrady74/inbxify-site-code@latest/directory-body-v1.0.js
   
   Last updated: 2026-03-15
   
   CONTENTS:
   1. Profile Modal + Card Clicks + Result Count
   2. Social Icons builder
   3. Compact Row builder (mobile)
   4. Webflow Dropdown close fix
   5. Filter System — v1.0 (Category + Subcategory)
   
   HARDCODING: None
   ============================================ */
(function () {
  'use strict';

  var D = document;
  var Q = function (s, p) { return (p || D).querySelector(s); };
  var QA = function (s, p) { return (p || D).querySelectorAll(s); };
  var GI = function (i) { return D.getElementById(i); };
  var IO = 'is-open';
  var H = 'psh';

  /* ===========================================
     UNIFIED SOCIAL ICON MAP (cards + modal)
     =========================================== */
  var SOCIALS = {
    website:   { svg: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>', fill: false },
    email:     { svg: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>', fill: false },
    facebook:  { svg: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>', fill: false },
    instagram: { svg: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>', fill: false },
    tiktok:    { svg: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>', fill: false },
    youtube:   { svg: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>', fill: false },
    linkedin:  { svg: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>', fill: false },
    x:         { svg: '<path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"/>', fill: true, viewBox: '0 0 16 16' },
    pinterest: { svg: '<path d="M8 12a4 4 0 1 1 8 0c0 2-1.5 3.5-3 3.5s-1.5-1-1.2-2.2l.8-3.3"/><circle cx="12" cy="12" r="10"/>', fill: false },
    houzz:     { svg: '<path d="M12 2v8H6v12h12V10h-6V2z"/>', fill: false }
  };
  var SOCIAL_ORDER = ['website', 'email', 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'x', 'pinterest', 'houzz'];

  function makeSocialSVG(key) {
    var s = SOCIALS[key]; if (!s) return '';
    var vb = s.viewBox || '0 0 24 24';
    if (s.fill) {
      return '<svg viewBox="' + vb + '" fill="currentColor">' + s.svg + '</svg>';
    }
    return '<svg viewBox="' + vb + '" fill="none" stroke="currentColor" stroke-width="2">' + s.svg + '</svg>';
  }

  /* ===========================================
     1. RESULT COUNT (used by both modal JS and filter)
     =========================================== */
  function updResCnt() {
    setTimeout(function () {
      var gw = Q('.jetboost-list-wrapper-lyem,.directory-grid-wrapper,[class*="jetboost-list-wrapper"]');
      if (!gw) return;
      var items = gw.querySelectorAll('.w-dyn-item');
      var v = 0;
      items.forEach(function (it) {
        var s = getComputedStyle(it);
        if (s.display !== 'none' && s.visibility !== 'hidden') v++;
      });
      var rc = GI('resultsCount');
      if (rc) rc.textContent = v;
      // Also update filter result count if present
      var drc = Q('.dir-result-count');
      if (drc) drc.innerHTML = '<span>' + v + '</span> result' + (v !== 1 ? 's' : '');
    }, 200);
  }

  var gw = Q('.jetboost-list-wrapper-lyem,.directory-grid-wrapper,[class*="jetboost-list-wrapper"]');
  if (gw) new MutationObserver(updResCnt).observe(gw, { childList: true, subtree: true, attributes: true });

  var si = Q('.jetboost-list-search-input-19pb');
  if (si) si.addEventListener('input', function () { setTimeout(updResCnt, 150); });

  /* ===========================================
     2. PROFILE MODAL
     =========================================== */
  var pm = GI('profileModal'), pc = GI('profileClose');
  var pe = {
    logo: GI('profileLogo'), name: GI('profileName'), category: GI('profileCategory'),
    tagline: GI('profileTagline'), description: GI('profileDescription'),
    address: GI('profileAddress'), phone: GI('profilePhone'),
    websiteBtn: GI('profileWebsiteBtn'), phoneBtn: GI('profilePhoneBtn'),
    aboutSection: GI('profileAboutSection'), socialSection: GI('profileSocialSection'),
    addressItem: GI('profileAddressItem'), phoneItem: GI('profilePhoneItem'),
    socialLinks: GI('profileSocialLinks')
  };

  function toTC(s) { return s.replace(/\w\S*/g, function (t) { return t[0].toUpperCase() + t.substr(1).toLowerCase(); }); }

  function openProfileModal(d) {
    var lr = GI('profileLogoRow');
    if (d.logoUrl) {
      pe.logo.innerHTML = '<img src="' + d.logoUrl + '" alt="' + ((d.name || '') + ' logo') + '">';
      pe.logo.className = 'profile-logo has-image';
      if (lr) lr.classList.remove(H);
    } else if (d.initials) {
      pe.logo.innerHTML = ''; pe.logo.textContent = d.initials;
      pe.logo.className = 'profile-logo';
      if (lr) lr.classList.remove(H);
    } else { if (lr) lr.classList.add(H); }

    var catText = d.category && d.subcategory ? d.category + ' \u203A ' + d.subcategory : (d.subcategory || d.category || 'Business');
    pe.category.textContent = catText;
    pe.name.textContent = toTC(d.name || 'Business');
    pe.tagline.textContent = d.tagline || '';
    d.address ? (pe.address.textContent = d.address, pe.addressItem.classList.remove(H)) : pe.addressItem.classList.add(H);
    if (d.phone) {
      pe.phone.textContent = d.phone; pe.phone.href = 'tel:' + d.phone.replace(/[^0-9+]/g, '');
      pe.phoneBtn.href = 'tel:' + d.phone.replace(/[^0-9+]/g, '');
      pe.phoneItem.classList.remove(H); pe.phoneBtn.style.display = 'flex';
    } else { pe.phoneItem.classList.add(H); pe.phoneBtn.style.display = 'none'; }

    d.website ? (pe.websiteBtn.href = d.website, pe.websiteBtn.style.display = 'flex') : pe.websiteBtn.style.display = 'none';
    d.description ? (pe.description.textContent = d.description, pe.aboutSection.classList.remove(H)) : pe.aboutSection.classList.add(H);

    var svcSec = GI('profileServicesSection'), svcList = GI('profileServices');
    if (d.services && d.services.length > 0) {
      svcList.innerHTML = '';
      d.services.forEach(function (s) { var t = D.createElement('span'); t.className = 'profile-service-tag'; var sv = s.trim(); t.textContent = sv.charAt(0).toUpperCase() + sv.slice(1); svcList.appendChild(t); });
      svcSec.classList.remove(H);
    } else { svcSec.classList.add(H); }

    /* Build social links dynamically */
    pe.socialLinks.innerHTML = '';
    var hasSocial = false;
    var socialData = { website: d.website, email: d.email ? ('mailto:' + d.email) : '', facebook: d.facebook, instagram: d.instagram, tiktok: d.tiktok, youtube: d.youtube, linkedin: d.linkedin, x: d.x, pinterest: d.pinterest, houzz: d.houzz };
    SOCIAL_ORDER.forEach(function (key) {
      var url = socialData[key];
      if (!url) return;
      hasSocial = true;
      var a = D.createElement('a');
      a.href = url;
      a.className = 'profile-social-link';
      a.title = key === 'x' ? 'X (Twitter)' : key === 'website' ? 'Visit Website' : key.charAt(0).toUpperCase() + key.slice(1);
      if (key !== 'email') a.target = '_blank';
      a.innerHTML = makeSocialSVG(key);
      pe.socialLinks.appendChild(a);
    });
    hasSocial ? pe.socialSection.classList.remove(H) : pe.socialSection.classList.add(H);

    pm.setAttribute('data-theme', d.theme || '');
    pm.classList.add(IO); document.body.style.overflow = 'hidden';
  }

  function closeProfileModal() { pm.classList.remove(IO); document.body.style.overflow = ''; }
  if (pc) pc.addEventListener('click', closeProfileModal);
  if (pm) pm.addEventListener('click', function (e) { if (e.target === pm) closeProfileModal(); });

  /* Card Click → Profile Modal */
  QA('.directory-card').forEach(function (card) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function (e) {
      if (e.target.closest('.card-social-icon')) return;
      if (e.target.closest('.card-category')) return;       // reserved for filter click
      if (e.target.closest('.card-subcategory')) return;    // reserved for filter click
      openProfileModal({
        name: card.dataset.name || card.querySelector('.card-name')?.textContent || '',
        theme: card.dataset.theme || card.closest('[data-theme]')?.dataset.theme || '',
        initials: card.dataset.initials || card.querySelector('.card-logo-initials')?.textContent?.trim() || '',
        logoUrl: card.dataset.logoUrl || (card.querySelector('.card-logo-tile img') ? card.querySelector('.card-logo-tile img').src : '') || '',
        category: card.dataset.category || card.querySelector('.card-category')?.textContent || '',
        subcategory: card.dataset.subcategory || card.querySelector('.card-subcategory')?.textContent || '',
        tagline: card.dataset.tagline || card.querySelector('.card-description')?.textContent || '',
        description: card.dataset.description || '',
        services: card.dataset.services ? card.dataset.services.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [],
        phone: card.dataset.phone || '',
        email: card.dataset.email || '',
        website: card.dataset.website || '',
        address: card.dataset.address || card.querySelector('.card-location')?.textContent?.trim() || '',
        facebook: card.dataset.facebook || '',
        instagram: card.dataset.instagram || '',
        tiktok: card.dataset.tiktok || '',
        youtube: card.dataset.youtube || '',
        linkedin: card.dataset.linkedin || '',
        x: card.dataset.x || '',
        pinterest: card.dataset.pinterest || '',
        houzz: card.dataset.houzz || ''
      });
    });
  });

  QA('.card-cta').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); b.closest('.directory-card')?.click(); });
  });

  D.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && pm && pm.classList.contains(IO)) closeProfileModal();
  });

  /* ===========================================
     3. BUILD CARD SOCIAL ICONS
     =========================================== */
  function buildCardSocials() {
    QA('.directory-card').forEach(function (card) {
      var d = card.querySelector('.card-socials');
      if (!d || d.dataset.built === '1') return;
      d.innerHTML = ''; var n = 0;
      SOCIAL_ORDER.forEach(function (key) {
        var u = card.getAttribute('data-' + key);
        if (!u || u === '' || u === '#') return;
        n++;
        var a = D.createElement('a');
        a.href = key === 'email' ? ('mailto:' + u) : u;
        if (key !== 'email') { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        a.className = 'card-social-icon';
        a.title = key === 'x' ? 'X (Twitter)' : key === 'website' ? 'Visit Website' : key.charAt(0).toUpperCase() + key.slice(1);
        a.innerHTML = makeSocialSVG(key);
        a.addEventListener('click', function (e) { e.stopPropagation(); });
        d.appendChild(a);
      });
      if (n === 0) d.innerHTML = '<span style="display:block;height:26px"></span>';
      d.dataset.built = '1';
    });
  }
  buildCardSocials();
  var cardWrapper = Q('.directory-grid-wrapper,[class*="jetboost-list-wrapper"]');
  if (cardWrapper) new MutationObserver(buildCardSocials).observe(cardWrapper, { childList: true, subtree: true });

  updResCnt();

  /* ===========================================
     4. COMPACT ROW BUILDER (mobile tiles)
     =========================================== */
  function buildCompactRows() {
    QA('.directory-card').forEach(function (c) {
      if (c.querySelector('.compact-row')) return;
      var n = c.dataset.name || c.querySelector('.card-name')?.textContent || '';
      var s = c.dataset.subcategory || c.querySelector('.card-subcategory')?.textContent || '';
      var d = D.createElement('div');
      d.className = 'compact-row';
      d.innerHTML = '<div class="cr-info"><div class="cr-name">' + n + '</div><div class="cr-sub">' + s + '</div></div><div class="cr-view">View \u203A</div>';
      c.appendChild(d);
    });
  }
  buildCompactRows();
  if (cardWrapper) new MutationObserver(buildCompactRows).observe(cardWrapper, { childList: true, subtree: true });

  /* ===========================================
     5. WEBFLOW DROPDOWN CLOSE FIX
     =========================================== */
  D.addEventListener('click', function (e) {
    var item = e.target.closest('.w-dropdown-list a, .w-dropdown-list .w-dyn-item');
    if (!item) return;
    var dd = item.closest('.w-dropdown');
    if (!dd) return;
    var toggle = dd.querySelector('.w-dropdown-toggle');
    dd.classList.remove('w--open');
    if (toggle) toggle.classList.remove('w--open');
    dd.querySelector('.w-dropdown-list')?.classList.remove('w--open');
  });

  /* ===========================================
     6. FILTER SYSTEM — v1.0
     Category + Subcategory cascading dropdowns
     Reads data-category + data-subcategory from
     .directory-card elements. Multi-tenant safe.
     
     HARDCODING: None
     =========================================== */
  var filterState = {
    allCards: [],      // [{el, cat, sub}, ...]
    catMap: {},        // { "Parent Cat": { count: N, subs: { "Sub Cat": count } } }
    activeCat: '',
    activeSub: ''
  };

  var fDOM = {}; // catWrap, catBtn, catPanel, subWrap, subBtn, subPanel, resetBtn, resultCountEl

  function scanCards() {
    filterState.allCards = [];
    filterState.catMap = {};
    QA('.directory-card').forEach(function (card) {
      var cat = (card.dataset.category || '').trim();
      var sub = (card.dataset.subcategory || '').trim();
      if (!cat) return;
      filterState.allCards.push({ el: card, cat: cat, sub: sub });

      if (!filterState.catMap[cat]) filterState.catMap[cat] = { count: 0, subs: {} };
      filterState.catMap[cat].count++;
      if (sub) {
        if (!filterState.catMap[cat].subs[sub]) filterState.catMap[cat].subs[sub] = 0;
        filterState.catMap[cat].subs[sub]++;
      }
    });
  }

  function fTotalCount() { return filterState.allCards.length; }

  function fMakeItem(label, count, isActive) {
    var div = D.createElement('div');
    div.className = 'dir-filter-item' + (isActive ? ' is-active' : '');
    div.setAttribute('data-value', label.indexOf('All ') === 0 ? '' : label);

    var nameSpan = D.createElement('span');
    nameSpan.textContent = label;
    div.appendChild(nameSpan);

    var countSpan = D.createElement('span');
    countSpan.className = 'dir-filter-count';
    countSpan.textContent = count;
    div.appendChild(countSpan);

    return div;
  }

  function fBuildCatOptions() {
    fDOM.catPanel.innerHTML = '';
    var sorted = Object.keys(filterState.catMap).sort(function (a, b) { return a.localeCompare(b); });
    fDOM.catPanel.appendChild(fMakeItem('All Categories', fTotalCount(), filterState.activeCat === ''));
    sorted.forEach(function (cat) {
      fDOM.catPanel.appendChild(fMakeItem(cat, filterState.catMap[cat].count, filterState.activeCat === cat));
    });
  }

  function fBuildSubOptions() {
    fDOM.subPanel.innerHTML = '';
    var subs = {};
    if (filterState.activeCat && filterState.catMap[filterState.activeCat]) {
      subs = filterState.catMap[filterState.activeCat].subs;
    } else {
      Object.keys(filterState.catMap).forEach(function (cat) {
        Object.keys(filterState.catMap[cat].subs).forEach(function (sub) {
          if (!subs[sub]) subs[sub] = 0;
          subs[sub] += filterState.catMap[cat].subs[sub];
        });
      });
    }

    var sorted = Object.keys(subs).sort(function (a, b) { return a.localeCompare(b); });
    var allCount = filterState.activeCat && filterState.catMap[filterState.activeCat] ? filterState.catMap[filterState.activeCat].count : fTotalCount();
    fDOM.subPanel.appendChild(fMakeItem('All Subcategories', allCount, filterState.activeSub === ''));

    sorted.forEach(function (sub) {
      fDOM.subPanel.appendChild(fMakeItem(sub, subs[sub], filterState.activeSub === sub));
    });

    // Disable sub dropdown if no sub options
    if (sorted.length === 0) {
      fDOM.subBtn.textContent = 'Subcategory';
      fDOM.subBtn.classList.add('is-placeholder');
      fDOM.subWrap.style.opacity = '0.5';
      fDOM.subWrap.style.pointerEvents = 'none';
    } else {
      fDOM.subWrap.style.opacity = '';
      fDOM.subWrap.style.pointerEvents = '';
    }
  }

  function fFilterCards() {
    var visibleCount = 0;
    filterState.allCards.forEach(function (c) {
      var matchCat = !filterState.activeCat || c.cat === filterState.activeCat;
      var matchSub = !filterState.activeSub || c.sub === filterState.activeSub;
      var show = matchCat && matchSub;
      c.el.dataset.dirFiltered = show ? 'true' : 'false';
      // Hide the .w-dyn-item wrapper (Webflow wraps each card in one)
      var wrapper = c.el.closest('.w-dyn-item') || c.el;
      if (show) {
        wrapper.style.display = '';
        visibleCount++;
      } else {
        wrapper.style.display = 'none';
      }
    });

    fUpdateResultCount(visibleCount);
    fUpdateResetVisibility();
  }

  function fUpdateResultCount(count) {
    if (fDOM.resultCountEl) {
      fDOM.resultCountEl.innerHTML = '<span>' + count + '</span> result' + (count !== 1 ? 's' : '');
    }
    var rc = GI('resultsCount');
    if (rc) rc.textContent = count;
  }

  function fUpdateResetVisibility() {
    if (!fDOM.resetBtn) return;
    if (filterState.activeCat || filterState.activeSub) {
      fDOM.resetBtn.classList.add('is-visible');
    } else {
      fDOM.resetBtn.classList.remove('is-visible');
    }
  }

  function fSelectCategory(value) {
    filterState.activeCat = value;
    filterState.activeSub = '';

    if (value) {
      fDOM.catBtn.textContent = value;
      fDOM.catBtn.classList.remove('is-placeholder');
      fDOM.catWrap.classList.add('is-filtered');
    } else {
      fDOM.catBtn.textContent = 'Category';
      fDOM.catBtn.classList.add('is-placeholder');
      fDOM.catWrap.classList.remove('is-filtered');
    }

    fDOM.subBtn.textContent = 'Subcategory';
    fDOM.subBtn.classList.add('is-placeholder');
    fDOM.subWrap.classList.remove('is-filtered');

    fCloseAll();
    fBuildSubOptions();
    fFilterCards();
  }

  function fSelectSubcategory(value) {
    filterState.activeSub = value;

    if (value) {
      fDOM.subBtn.textContent = value;
      fDOM.subBtn.classList.remove('is-placeholder');
      fDOM.subWrap.classList.add('is-filtered');
    } else {
      fDOM.subBtn.textContent = 'Subcategory';
      fDOM.subBtn.classList.add('is-placeholder');
      fDOM.subWrap.classList.remove('is-filtered');
    }

    fCloseAll();
    fFilterCards();
  }

  function fResetFilters() {
    filterState.activeCat = '';
    filterState.activeSub = '';

    fDOM.catBtn.textContent = 'Category';
    fDOM.catBtn.classList.add('is-placeholder');
    fDOM.catWrap.classList.remove('is-filtered');

    fDOM.subBtn.textContent = 'Subcategory';
    fDOM.subBtn.classList.add('is-placeholder');
    fDOM.subWrap.classList.remove('is-filtered');

    fCloseAll();
    fBuildCatOptions();
    fBuildSubOptions();
    fFilterCards();

    // Also clear Jetboost search
    var searchInput = Q('.jetboost-list-search-input-19pb');
    if (searchInput) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /* --- Exposed for pill click integration (task #4) --- */
  window.INBXIFY_DIR_FILTER = {
    selectCategory: function (val) { if (fDOM.catBtn) fSelectCategory(val); },
    selectSubcategory: function (val) { if (fDOM.subBtn) fSelectSubcategory(val); },
    reset: function () { if (fDOM.catBtn) fResetFilters(); }
  };

  function fToggle(wrap) {
    var wasOpen = wrap.classList.contains('is-open');
    fCloseAll();
    if (!wasOpen) {
      wrap.classList.add('is-open');
      if (wrap === fDOM.catWrap) fBuildCatOptions();
      if (wrap === fDOM.subWrap) fBuildSubOptions();
    }
  }

  function fCloseAll() {
    [fDOM.catWrap, fDOM.subWrap].forEach(function (w) {
      if (w) w.classList.remove('is-open');
    });
  }

  function fInjectUI() {
    var filterBar = Q('.filter-bar');
    if (!filterBar) { console.warn('[DirFilter] .filter-bar not found'); return false; }

    // --- Category ---
    fDOM.catWrap = D.createElement('div');
    fDOM.catWrap.className = 'dir-filter-wrap';

    fDOM.catBtn = D.createElement('button');
    fDOM.catBtn.className = 'dir-filter-select is-placeholder';
    fDOM.catBtn.type = 'button';
    fDOM.catBtn.textContent = 'Category';
    fDOM.catBtn.setAttribute('aria-haspopup', 'listbox');
    fDOM.catBtn.setAttribute('aria-expanded', 'false');

    fDOM.catPanel = D.createElement('div');
    fDOM.catPanel.className = 'dir-filter-panel';
    fDOM.catPanel.setAttribute('role', 'listbox');

    fDOM.catWrap.appendChild(fDOM.catBtn);
    fDOM.catWrap.appendChild(fDOM.catPanel);

    // --- Subcategory ---
    fDOM.subWrap = D.createElement('div');
    fDOM.subWrap.className = 'dir-filter-wrap';

    fDOM.subBtn = D.createElement('button');
    fDOM.subBtn.className = 'dir-filter-select is-placeholder';
    fDOM.subBtn.type = 'button';
    fDOM.subBtn.textContent = 'Subcategory';
    fDOM.subBtn.setAttribute('aria-haspopup', 'listbox');
    fDOM.subBtn.setAttribute('aria-expanded', 'false');

    fDOM.subPanel = D.createElement('div');
    fDOM.subPanel.className = 'dir-filter-panel';
    fDOM.subPanel.setAttribute('role', 'listbox');

    fDOM.subWrap.appendChild(fDOM.subBtn);
    fDOM.subWrap.appendChild(fDOM.subPanel);

    // --- Result Count ---
    fDOM.resultCountEl = D.createElement('div');
    fDOM.resultCountEl.className = 'dir-result-count';
    fDOM.resultCountEl.innerHTML = '<span>0</span> results';

    // --- Reset ---
    fDOM.resetBtn = D.createElement('a');
    fDOM.resetBtn.className = 'dir-filter-reset';
    fDOM.resetBtn.href = '#';
    fDOM.resetBtn.textContent = 'RESET';
    fDOM.resetBtn.addEventListener('click', function (e) {
      e.preventDefault();
      fResetFilters();
    });

    // --- Insert: [search form] | Cat | Sub | Count | Reset ---
    var searchForm = filterBar.querySelector('form, .w-form');
    var refNode = searchForm ? searchForm.nextSibling : filterBar.firstChild;
    filterBar.insertBefore(fDOM.catWrap, refNode);
    filterBar.insertBefore(fDOM.subWrap, fDOM.catWrap.nextSibling);
    filterBar.insertBefore(fDOM.resultCountEl, fDOM.subWrap.nextSibling);
    filterBar.insertBefore(fDOM.resetBtn, fDOM.resultCountEl.nextSibling);

    return true;
  }

  function fBindEvents() {
    fDOM.catBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      fToggle(fDOM.catWrap);
      fDOM.catBtn.setAttribute('aria-expanded', fDOM.catWrap.classList.contains('is-open'));
    });

    fDOM.subBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      fToggle(fDOM.subWrap);
      fDOM.subBtn.setAttribute('aria-expanded', fDOM.subWrap.classList.contains('is-open'));
    });

    fDOM.catPanel.addEventListener('click', function (e) {
      var item = e.target.closest('.dir-filter-item');
      if (!item) return;
      fSelectCategory(item.dataset.value);
    });

    fDOM.subPanel.addEventListener('click', function (e) {
      var item = e.target.closest('.dir-filter-item');
      if (!item) return;
      fSelectSubcategory(item.dataset.value);
    });

    D.addEventListener('click', function (e) {
      if (!e.target.closest('.dir-filter-wrap')) fCloseAll();
    });

    D.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') fCloseAll();
    });

    // Sync with Jetboost search for result count
    var searchInput = Q('.jetboost-list-search-input-19pb');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        setTimeout(function () {
          if (!filterState.activeCat && !filterState.activeSub) {
            var gw2 = Q('.jetboost-list-wrapper-lyem,[class*="jetboost-list-wrapper"]');
            if (gw2) {
              var v = 0;
              gw2.querySelectorAll('.w-dyn-item').forEach(function (item) {
                var s = getComputedStyle(item);
                if (s.display !== 'none') v++;
              });
              fUpdateResultCount(v);
            }
          }
        }, 300);
      });
    }
  }

  /* --- Filter Init --- */
  function fInit() {
    scanCards();
    if (filterState.allCards.length === 0) {
      var gw3 = Q('.jetboost-list-wrapper-lyem,.directory-grid-wrapper,[class*="jetboost-list-wrapper"]');
      if (gw3) {
        var obs = new MutationObserver(function () {
          scanCards();
          if (filterState.allCards.length > 0) {
            obs.disconnect();
            fCompleteInit();
          }
        });
        obs.observe(gw3, { childList: true, subtree: true });
      }
      return;
    }
    fCompleteInit();
  }

  function fCompleteInit() {
    if (!fInjectUI()) return;
    fBindEvents();
    fBuildCatOptions();
    fBuildSubOptions();
    fFilterCards();
    console.log('[DirFilter] v1.0 ready —', filterState.allCards.length, 'cards,', Object.keys(filterState.catMap).length, 'categories');
  }

  // Kick off filter init
  fInit();

})();
