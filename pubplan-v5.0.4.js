// ============================================================
// PUBPLAN TILE UI — v5.0.4
// Fixes from v5.0.3:
//   FIX #6: Category name lookup from Products when catLabel empty in CMS
//   FIX #7: Article name lookup from articles-wrapper when artNm empty
//   FIX #8: Sponsor dropdown always editable (independent of article)
//   FIX #9: No Sponsor checkbox does NOT trigger full edit mode
//   FIX #10: Sponsor column layout — No Sponsor right-aligned, smaller
// Fixes from v5.0.1:
//   FIX #1: Post-save uses window.location.reload() after 3s
//           instead of window.location.href (Memberstack blank page fix)
//   FIX #2: buildFaArticleOptions rewired to query .articles-wrapper
//           elements (not .fa-picker-item which don't exist)
//   FIX #3: buildTsArticleOptions rewired same way
//   FIX #4: CSS note — .ptr::before border needs top:0;bottom:0
//           (applied in CSS, not JS — see pubplan-v4.6.css)
//   FIX #5: Added hidden-category-type to FA and TS payloads
//           (s.catType from Products wrapper — enables Make to determine
//           Paid/Sponsored/Neither without reverse-engineering from other fields)
//
// Clean rebuild from v4.0.31 (ORIGINAL) spec
// Sections: GR, EM, FA, TS, BA, TF
//
// Key improvements over v4.0.31:
//   - Surgical DOM updates: dropdowns/inputs persist during edits
//   - Full tile rebuild ONLY on mode switch (view↔edit)
//   - Readable class/variable names
//   - Multi-tenant: no hardcoded publisher/title values
//   - Payload format: URLSearchParams, no-cors, 1 fetch per slot
//     (exact match to LIVE/Make.com expectations)
//
// HARDCODE TRACKER: see pubplan-hardcode-tracker.md
// ============================================================

// ── Section toggle — global so HTML onclick can reach it ──
window.toggleSection = function (section) {
  const el = document.getElementById('section-' + section);
  if (el) el.classList.toggle('collapsed');
};

(function () {
  'use strict';

  // ════════════════════════════════════════════════════════
  //  CONSTANTS & CONFIG
  // ════════════════════════════════════════════════════════

  // Webhook URLs: read from window.PP_WEBHOOKS (set in Webflow page head)
  // This keeps webhook URLs out of the public GitHub repo
  var WEBHOOK_URLS = window.PP_WEBHOOKS || {};
  if (!WEBHOOK_URLS.gr) {
    console.warn('PubPlan: window.PP_WEBHOOKS not found. Add webhook config to page head.');
  }

  // Section anchors for post-save reload (kept for future use)
  const SECTION_ANCHORS = {
    gr: 'gr-loc', em: 'em-loc', fa: 'fa-loc',
    ts: 'ts-loc', ba: 'ba-loc', tf: 'tf-loc'
  };

  const GR_LIMITS = { grTit: 50, grMsg: 300 };
  const EM_LIMITS = { emSub: 60, emPre: 100 };

  // ════════════════════════════════════════════════════════
  //  STATE
  // ════════════════════════════════════════════════════════

  const state = {};
  const originalState = {};
  let currentTfMode = null;

  // ════════════════════════════════════════════════════════
  //  DOM HELPERS
  // ════════════════════════════════════════════════════════

  function getPubplanId() {
    var el = document.querySelector('.pubplan-slot-wrapper[data-pubplan-id]');
    return el ? el.dataset.pubplanId || '' : '';
  }

  function getTitleadminId() {
    var el = document.querySelector('.pubplan-slot-wrapper[data-titleadmin-id]');
    return el ? el.dataset.titleadminId || '' : '';
  }

  // ════════════════════════════════════════════════════════
  //  UI UTILITIES
  // ════════════════════════════════════════════════════════

  function showToast(msg, isError) {
    var t = document.getElementById('ppt-toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'ppt-toast show' + (isError ? ' error' : '');
    setTimeout(function () { t.classList.remove('show'); }, 3500);
  }

  function statusIcon(status, symbol) {
    return '<div class="pio ' + status + '">' + symbol + '</div>';
  }

  function charCountHtml(max, currentValue) {
    var remaining = Math.max(0, max - (currentValue || '').length);
    var cls = 'pcc';
    if (remaining <= max * 0.1) cls += ' danger';
    else if (remaining <= max * 0.2) cls += ' warning';
    return '<span class="' + cls + '">' + remaining + ' left</span>';
  }

  function updateCharCounter(inputEl, fieldKey, limits) {
    var counter = inputEl.parentElement ? inputEl.parentElement.querySelector('.pcc') : null;
    if (!counter) return;
    var max = limits[fieldKey] || 100;
    var remaining = Math.max(0, max - inputEl.value.length);
    counter.textContent = remaining + ' left';
    counter.className = 'pcc' + (remaining <= max * 0.1 ? ' danger' : remaining <= max * 0.2 ? ' warning' : '');
  }

  // ════════════════════════════════════════════════════════
  //  INLINE CONFIRM
  // ════════════════════════════════════════════════════════

  function showInlineConfirm(anchorEl, msg, onYes, onNo) {
    var existing = document.querySelector('.ppt-inline-confirm');
    if (existing) existing.remove();

    var bar = document.createElement('div');
    bar.className = 'ppt-inline-confirm visible';
    bar.innerHTML =
      '<span>' + msg + '</span>' +
      '<span class="ppt-inline-confirm-yes">Yes, continue</span>' +
      '<span class="ppt-inline-confirm-no">Cancel</span>';

    bar.querySelector('.ppt-inline-confirm-yes').addEventListener('click', function () {
      bar.remove();
      onYes();
    });
    bar.querySelector('.ppt-inline-confirm-no').addEventListener('click', function () {
      bar.remove();
      if (onNo) onNo();
    });

    var parent = anchorEl.closest('.pc') || anchorEl.parentElement;
    if (parent && parent.parentElement) {
      parent.parentElement.insertBefore(bar, parent.nextSibling);
    } else {
      anchorEl.insertAdjacentElement('afterend', bar);
    }
  }

  // ════════════════════════════════════════════════════════
  //  SLOT INDICATORS
  // ════════════════════════════════════════════════════════

  function updateSlotIndicators(section, count, isReadyFn) {
    var container = document.getElementById(section + '-indicators');
    if (!container) return;
    var html = '';
    for (var i = 1; i <= count; i++) {
      var code = (section + '-' + i).toUpperCase();
      var ready = isReadyFn(code);
      html += '<div class="ppt-slot-dot ' + (ready ? 'ready' : 'empty') + '">' + i + '</div>';
    }
    container.innerHTML = html;
  }

  function updateSaveButton(section, hasPending) {
    var btn = document.getElementById(section + '-submit-btn');
    if (btn) btn.className = 'ppt-submit-btn' + (hasPending ? ' active' : '');
  }

  // ════════════════════════════════════════════════════════
  //  DRAWER TOGGLE
  // ════════════════════════════════════════════════════════

  window.tD = function (sc) {
    var drawer = document.getElementById('drawer-' + sc);
    var tile = document.getElementById('tile-' + sc);
    var chevron = tile ? tile.querySelector('.pch') : null;
    if (drawer) {
      drawer.classList.toggle('open');
      if (chevron) chevron.classList.toggle('open');
    }
  };

  // ════════════════════════════════════════════════════════
  //  GREETING (GR) — 1 slot, 2 text fields
  // ════════════════════════════════════════════════════════

  function initGrState() {
    var el = document.querySelector('.pubplan-slot-wrapper[data-section-code="gr"]');
    state['GR-1'] = {
      sc: el ? el.dataset.slotCode || 'GR-1' : 'GR-1',
      secC: 'gr',
      slotNum: 1,
      section: 'Greeting',
      pubplanId: el ? el.dataset.pubplanId || '' : '',
      titleadminId: el ? el.dataset.titleadminId || '' : '',
      grTit: el ? el.dataset.greetingTitle || '' : '',
      grMsg: el ? el.dataset.greetingMessage || '' : '',
      dirty: false
    };
  }

  function renderGr() {
    var s = state['GR-1'];
    if (!s) return;

    var isEditing = s.dirty || !!originalState['GR-1'];
    var hasContent = s.grTit || s.grMsg;

    var fieldsHtml;

    if (isEditing) {
      fieldsHtml =
        '<div class="pc" style="flex:1;">' +
          '<span class="ppt-col-label">Greeting Title</span>' +
          '<input type="text" class="pi" data-field="grTit" maxlength="' + GR_LIMITS.grTit + '" ' +
            'value="' + (s.grTit || '').replace(/"/g, '&quot;') + '" ' +
            'placeholder="title...">' +
          charCountHtml(GR_LIMITS.grTit, s.grTit) +
        '</div>' +
        '<div class="pc" style="flex:2;">' +
          '<span class="ppt-col-label">Greeting Message</span>' +
          '<textarea class="ppt-textarea" data-field="grMsg" maxlength="' + GR_LIMITS.grMsg + '" ' +
            'placeholder="message...">' + (s.grMsg || '') + '</textarea>' +
          charCountHtml(GR_LIMITS.grMsg, s.grMsg) +
        '</div>';
    } else if (hasContent) {
      fieldsHtml =
        '<div class="pc" style="flex:1;">' +
          '<span class="ppt-col-label">Greeting Title</span>' +
          '<span class="pcv">' + (s.grTit || '—') + '</span>' +
        '</div>' +
        '<div class="pc" style="flex:2;">' +
          '<span class="ppt-col-label">Greeting Message</span>' +
          '<span class="pcv">' + (s.grMsg || '—') + '</span>' +
        '</div>';
    } else {
      fieldsHtml =
        '<div class="pc" style="flex:1;">' +
          '<span style="color:#ccc;">No greeting set. Click edit to add.</span>' +
        '</div>';
    }

    var actionHtml;
    if (isEditing) {
      actionHtml = '<a class="ppt-cancel-lnk visible" data-action="cancel-gr">cancel</a>';
    } else {
      actionHtml = '<a class="pei" data-action="edit-gr" title="Edit">✎</a>';
    }

    var tileHtml =
      '<div class="ptr grr' + (isEditing ? ' hp' : '') + '" id="tile-gr-1">' +
        '<div class="psi sgr">GR-1</div>' +
        fieldsHtml +
        '<div class="pac">' + actionHtml + '</div>' +
      '</div>';

    var existing = document.getElementById('tile-gr-1');
    if (existing) {
      existing.outerHTML = tileHtml;
    } else {
      var grid = document.getElementById('gr-grid');
      if (grid) grid.insertAdjacentHTML('beforeend', tileHtml);
    }

    bindGrEvents();
  }

  function bindGrEvents() {
    var tile = document.getElementById('tile-gr-1');
    if (!tile) return;

    var inputs = tile.querySelectorAll('input[data-field], textarea[data-field]');
    inputs.forEach(function (input) {
      input.addEventListener('input', function () {
        var s = state['GR-1'];
        if (!s) return;
        s[input.dataset.field] = input.value;
        s.dirty = true;
        updateCharCounter(input, input.dataset.field, GR_LIMITS);
        updateGrProgress();
      });
    });

    var editBtn = tile.querySelector('[data-action="edit-gr"]');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        var s = state['GR-1'];
        if (!s) return;
        originalState['GR-1'] = Object.assign({}, s);
        s.dirty = true;
        renderGr();
        updateGrProgress();
      });
    }

    var cancelBtn = tile.querySelector('[data-action="cancel-gr"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        var s = state['GR-1'];
        var orig = originalState['GR-1'];
        if (s && orig) {
          Object.assign(s, orig);
          s.dirty = false;
          delete originalState['GR-1'];
        }
        renderGr();
        updateGrProgress();
      });
    }
  }

  function updateGrProgress() {
    updateSlotIndicators('gr', 1, function (code) {
      var s = state[code];
      return !!(s && s.grTit && s.grMsg);
    });
    var s = state['GR-1'];
    updateSaveButton('gr', s && s.dirty);
  }

  // ════════════════════════════════════════════════════════
  //  EMAIL (EM) — 1 slot, 2 text fields
  // ════════════════════════════════════════════════════════

  function initEmState() {
    var el = document.querySelector('.pubplan-slot-wrapper[data-section-code="em"]');
    state['EM-1'] = {
      sc: el ? el.dataset.slotCode || 'EM-1' : 'EM-1',
      secC: 'em',
      slotNum: 1,
      section: 'Email',
      pubplanId: el ? el.dataset.pubplanId || '' : '',
      titleadminId: el ? el.dataset.titleadminId || '' : '',
      emSub: el ? el.dataset.emailSubject || '' : '',
      emPre: el ? el.dataset.emailPreview || '' : '',
      dirty: false
    };
  }

  function renderEm() {
    var s = state['EM-1'];
    if (!s) return;

    var isEditing = s.dirty || !!originalState['EM-1'];
    var hasContent = s.emSub || s.emPre;

    var fieldsHtml;

    if (isEditing) {
      fieldsHtml =
        '<div class="pc" style="flex:1;">' +
          '<span class="ppt-col-label">Email Subject</span>' +
          '<input type="text" class="pi" data-field="emSub" maxlength="' + EM_LIMITS.emSub + '" ' +
            'value="' + (s.emSub || '').replace(/"/g, '&quot;') + '" ' +
            'placeholder="subject...">' +
          charCountHtml(EM_LIMITS.emSub, s.emSub) +
        '</div>' +
        '<div class="pc" style="flex:1;">' +
          '<span class="ppt-col-label">Email Preview</span>' +
          '<input type="text" class="pi" data-field="emPre" maxlength="' + EM_LIMITS.emPre + '" ' +
            'value="' + (s.emPre || '').replace(/"/g, '&quot;') + '" ' +
            'placeholder="preview...">' +
          charCountHtml(EM_LIMITS.emPre, s.emPre) +
        '</div>';
    } else if (hasContent) {
      fieldsHtml =
        '<div class="pc" style="flex:1;">' +
          '<span class="ppt-col-label">Email Subject</span>' +
          '<span class="pcv">' + (s.emSub || '—') + '</span>' +
        '</div>' +
        '<div class="pc" style="flex:1;">' +
          '<span class="ppt-col-label">Email Preview</span>' +
          '<span class="pcv">' + (s.emPre || '—') + '</span>' +
        '</div>';
    } else {
      fieldsHtml =
        '<div class="pc" style="flex:1;">' +
          '<span style="color:#ccc;">No email settings. Click edit to add.</span>' +
        '</div>';
    }

    var actionHtml;
    if (isEditing) {
      actionHtml = '<a class="ppt-cancel-lnk visible" data-action="cancel-em">cancel</a>';
    } else {
      actionHtml = '<a class="pei" data-action="edit-em" title="Edit">✎</a>';
    }

    var tileHtml =
      '<div class="ptr emr' + (isEditing ? ' hp' : '') + '" id="tile-em-1">' +
        '<div class="psi sem">EM-1</div>' +
        fieldsHtml +
        '<div class="pac">' + actionHtml + '</div>' +
      '</div>';

    var existing = document.getElementById('tile-em-1');
    if (existing) {
      existing.outerHTML = tileHtml;
    } else {
      var grid = document.getElementById('em-grid');
      if (grid) grid.insertAdjacentHTML('beforeend', tileHtml);
    }

    bindEmEvents();
  }

  function bindEmEvents() {
    var tile = document.getElementById('tile-em-1');
    if (!tile) return;

    var inputs = tile.querySelectorAll('input[data-field]');
    inputs.forEach(function (input) {
      input.addEventListener('input', function () {
        var s = state['EM-1'];
        if (!s) return;
        s[input.dataset.field] = input.value;
        s.dirty = true;
        updateCharCounter(input, input.dataset.field, EM_LIMITS);
        updateEmProgress();
      });
    });

    var editBtn = tile.querySelector('[data-action="edit-em"]');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        var s = state['EM-1'];
        if (!s) return;
        originalState['EM-1'] = Object.assign({}, s);
        s.dirty = true;
        renderEm();
        updateEmProgress();
      });
    }

    var cancelBtn = tile.querySelector('[data-action="cancel-em"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        var s = state['EM-1'];
        var orig = originalState['EM-1'];
        if (s && orig) {
          Object.assign(s, orig);
          s.dirty = false;
          delete originalState['EM-1'];
        }
        renderEm();
        updateEmProgress();
      });
    }
  }

  function updateEmProgress() {
    updateSlotIndicators('em', 1, function (code) {
      var s = state[code];
      return !!(s && s.emSub && s.emPre);
    });
    var s = state['EM-1'];
    updateSaveButton('em', s && s.dirty);
  }

  // ════════════════════════════════════════════════════════
  //  OPTION BUILDERS (shared across FA, TS, BA, TF)
  // ════════════════════════════════════════════════════════

  function buildCustomerOptions(selectedId, placeholder) {
    var custEls = document.querySelectorAll('.customers-wrapper');
    var allCust = [];
    custEls.forEach(function (el) {
      if (el.dataset.id) {
        allCust.push({ id: el.dataset.id, name: el.dataset.name || '(unnamed)' });
      }
    });
    if (!allCust.length) return '<option value="" disabled selected>No options</option>';
    return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>' +
      (placeholder || 'Select customer...') + '</option>' +
      allCust.sort(function (a, b) { return a.name.localeCompare(b.name); })
        .map(function (c) {
          return '<option value="' + c.id + '"' + (c.id === selectedId ? ' selected' : '') + '>' + c.name + '</option>';
        }).join('');
  }

  function buildCategoryOptions(group, selectedId) {
    var prodEls = document.querySelectorAll('.products-wrapper');
    var GROUP_MAP = {
      'FA': ['FA', 'Feature Article', 'Feature Articles'],
      'TS': ['TS', 'Themed Spotlight', 'Themed Spotlights']
    };
    var validGroups = GROUP_MAP[group] || [group];
    var cats = [];
    prodEls.forEach(function (el) {
      if (validGroups.indexOf(el.dataset.group) !== -1 && el.dataset.id) {
        cats.push({
          id: el.dataset.id,
          name: el.dataset.name || '(unnamed)',
          type: el.dataset.type || ''
        });
      }
    });
    if (!cats.length) return '<option value="" disabled selected>No categories</option>';
    cats.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select category...</option>' +
      cats.map(function (c) {
        return '<option value="' + c.id + '" data-type="' + c.type + '"' +
          (c.id === selectedId ? ' selected' : '') + '>' + c.name + '</option>';
      }).join('');
  }

  /**
   * FIX #2: Build FA article <option> list from .articles-wrapper elements.
   * Filters by articleCategoryCode="fa", then by:
   *   - articleCustomerId (for Paid categories where custId is set)
   *   - categoryId (for non-Paid categories)
   */
  function buildFaArticleOptions(custId, catId, selectedId) {
    var allArts = document.querySelectorAll('.articles-wrapper');
    var items = [];
    allArts.forEach(function (el) {
      // Only FA articles
      if (el.dataset.articleCategoryCode !== 'fa') return;
      // Filter: if custId provided, match by customer; otherwise match by category
      if (custId) {
        if (el.dataset.articleCustomerId !== custId) return;
      } else if (catId) {
        if (el.dataset.categoryId !== catId) return;
      }
      var id = el.dataset.articleId || '';
      var name = el.dataset.articleTitle || '';
      if (id && name) items.push({ id: id, name: name });
    });
    if (!items.length) return '<option value="" disabled selected>No articles</option>';
    items.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select article...</option>' +
      items.map(function (a) {
        return '<option value="' + a.id + '"' + (a.id === selectedId ? ' selected' : '') + '>' + a.name + '</option>';
      }).join('');
  }

  /**
   * FIX #3: Build TS article <option> list from .articles-wrapper elements.
   * Same logic as FA but filters articleCategoryCode="ts".
   */
  function buildTsArticleOptions(custId, catId, selectedId) {
    var allArts = document.querySelectorAll('.articles-wrapper');
    var items = [];
    allArts.forEach(function (el) {
      // Only TS articles
      if (el.dataset.articleCategoryCode !== 'ts') return;
      if (custId) {
        if (el.dataset.articleCustomerId !== custId) return;
      } else if (catId) {
        if (el.dataset.categoryId !== catId) return;
      }
      var id = el.dataset.articleId || '';
      var name = el.dataset.articleTitle || '';
      if (id && name) items.push({ id: id, name: name });
    });
    if (!items.length) return '<option value="" disabled selected>No articles</option>';
    items.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select article...</option>' +
      items.map(function (a) {
        return '<option value="' + a.id + '"' + (a.id === selectedId ? ' selected' : '') + '>' + a.name + '</option>';
      }).join('');
  }

  /**
   * Build ad <option> list from .ads-wrapper elements.
   */
  function buildAdOptions(custId, selectedId) {
    var adEls = document.querySelectorAll('.ads-wrapper');
    var allAds = [];
    adEls.forEach(function (el) {
      var id = el.dataset.adId;
      if (id) {
        allAds.push({
          id: id,
          name: el.dataset.adName || el.dataset.adTitle || el.dataset.name || '(untitled)',
          custId: el.dataset.adCustomerId || el.dataset.customerId || ''
        });
      }
    });
    var filtered = allAds.filter(function (a) { return !custId || a.custId === custId; });
    if (!filtered.length) return '<option value="" disabled selected>No ads</option>';
    return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select ad...</option>' +
      filtered.sort(function (a, b) { return a.name.localeCompare(b.name); })
        .map(function (a) {
          return '<option value="' + a.id + '"' + (a.id === selectedId ? ' selected' : '') + '>' + a.name + '</option>';
        }).join('');
  }

  // ════════════════════════════════════════════════════════
  //  FEATURE ARTICLES (FA) — 4 slots
  // ════════════════════════════════════════════════════════

  function getCatType(catId) {
    if (!catId) return '';
    var el = document.querySelector('.products-wrapper[data-id="' + catId + '"]');
    return el ? el.dataset.type || '' : '';
  }

  function initFaState() {
    var slotEls = document.querySelectorAll('.pubplan-slot-wrapper[data-section-code="fa"]');
    slotEls.forEach(function (el) {
      var code = el.dataset.slotCode;
      if (!code) return;
      var faCatId = el.dataset.catId || '';
      // FIX #6: Look up catNm from Products if CMS catLabel is empty
      var faCatNm = el.dataset.catLabel || '';
      if (faCatId && !faCatNm) {
        var prodEl = document.querySelector('.products-wrapper[data-id="' + faCatId + '"]');
        if (prodEl) faCatNm = prodEl.dataset.name || '';
      }
      // FIX #7: Look up artNm from articles-wrapper if CMS articleTitle is empty
      var faArtId = el.dataset.articleId || '';
      var faArtNm = el.dataset.articleTitle || '';
      if (faArtId && !faArtNm) {
        var artEl = document.querySelector('.articles-wrapper[data-article-id="' + faArtId + '"]');
        if (artEl) faArtNm = artEl.dataset.articleTitle || '';
      }
      state[code] = {
        sc: code,
        secC: 'fa',
        section: el.dataset.section || 'Feature Article',
        slotNum: parseInt(code.replace(/\D/g, ''), 10),
        pubplanId: el.dataset.pubplanId || '',
        titleadminId: el.dataset.titleadminId || '',
        catId: faCatId,
        catNm: faCatNm,
        catType: getCatType(faCatId),
        artId: faArtId,
        artNm: faArtNm,
        custId: el.dataset.customerId || '',
        custNm: el.dataset.customerName || '',
        sponsorId: el.dataset.sponsorId || '',
        sponNm: el.dataset.sponsorName || '',
        artAdId: el.dataset.artAdId || '',
        artAdUrl: el.dataset.artAdUrl || '',
        artAdGo: el.dataset.artAdGo || '',
        nlSponsored: el.dataset.nlSponsored || '',
        noSponsor: false,
        catChanged: false,
        dirty: false
      };
    });
    for (var i = 1; i <= 4; i++) {
      var code = 'FA-' + i;
      if (!state[code]) {
        state[code] = {
          sc: code, secC: 'fa', slotNum: i, section: 'Feature Article',
          pubplanId: '', titleadminId: '',
          catId: '', catNm: '', catType: '',
          artId: '', artNm: '',
          custId: '', custNm: '',
          sponsorId: '', sponNm: '',
          artAdId: '', artAdUrl: '', artAdGo: '', nlSponsored: '',
          noSponsor: false, catChanged: false, dirty: false
        };
      }
    }
  }

  function getFaPickerData(slotNum) {
    var pickerEl = document.querySelector('.fa-picker-wrapper');
    if (!pickerEl) return {};
    var prefix = 'fa' + slotNum;
    var sponsoredStatus = pickerEl.dataset[prefix + 'SponsoredStatus'] || '';
    var artAdGet = pickerEl.dataset[prefix + 'ArtAdGet'] || '';
    var artAdGo = pickerEl.dataset[prefix + 'ArtAdGo'] || '';
    var s = state['FA-' + slotNum];
    var artEl = (s && s.artId) ? document.querySelector('.articles-wrapper[data-article-id="' + s.artId + '"]') : null;
    var artImgGet = artEl ? artEl.dataset.artImgGet || '' : '';
    var artWfImg = artEl ? artEl.dataset.imageUrl || '' : '';
    var showArtAd = artEl ? artEl.dataset.showArtAd || '' : '';
    var artPgSet = (showArtAd === 'Show' || showArtAd === 'true') ? 'true' : '';
    var nlPgSet = pickerEl.dataset[prefix + 'NlPgSet'] || '';
    return {
      artImgGet: artImgGet, artWfImg: artWfImg,
      adImgGet: artAdGet, adGoLink: artAdGo,
      artPgSet: artPgSet, nlPgSet: nlPgSet,
      sponsored: sponsoredStatus
    };
  }

  function buildFaDrawer(sc) {
    var s = state[sc];
    if (!s) return '';
    var d = getFaPickerData(s.slotNum);
    var artEl = s.artId ? document.querySelector('.articles-wrapper[data-article-id="' + s.artId + '"]') : null;

    var fields = [
      { label: 'Summary',  value: (artEl && artEl.dataset.articleSummary) ? artEl.dataset.articleSummary : '—', status: (artEl && artEl.dataset.articleSummary) ? 'ok' : 'bad' },
      { label: 'Body',     value: (artEl && artEl.dataset.articleBody) ? 'Present' : '—', status: (artEl && artEl.dataset.articleBody) ? 'ok' : 'bad' },
      { label: 'Writer',   value: (artEl && artEl.dataset.writerName) ? artEl.dataset.writerName : '—', status: (artEl && artEl.dataset.writerName) ? 'ok' : 'bad' },
      { label: 'CoWriter', value: (artEl && artEl.dataset.cowriterName) ? artEl.dataset.cowriterName : '—', status: (artEl && artEl.dataset.cowriterName) ? 'ok' : 'na' },
      { label: 'Image',    value: d.artWfImg ? 'Present' : '—', status: d.artWfImg ? 'ok' : 'bad' },
      { label: 'Img GET',  value: d.artImgGet ? 'Present' : '—', status: d.artImgGet ? 'ok' : 'bad' },
      { label: 'Type',     value: (artEl && artEl.dataset.articleType) ? artEl.dataset.articleType : '—', status: (artEl && artEl.dataset.articleType) ? 'ok' : 'bad' },
      { label: 'Ad Stat',  value: d.artPgSet ? 'ON' : 'OFF', status: d.artPgSet ? 'ok' : 'na' },
      { label: 'Ad Img',   value: d.adImgGet ? 'Present' : '—', status: d.adImgGet ? 'ok' : ((s.custId || s.sponsorId) ? 'bad' : 'na') },
      { label: 'Ad Go',    value: d.adGoLink ? 'Present' : '—', status: d.adGoLink ? 'ok' : ((s.custId || s.sponsorId) ? 'bad' : 'na') }
    ];

    var fieldsHtml = fields.map(function (f) {
      var iconSymbol = f.status === 'ok' ? '✓' : (f.status === 'bad' ? '✕' : '—');
      return '<div class="pdr-field"><span class="pdr-label">' + f.label + '</span>' +
        '<span class="pdr-value">' + f.value + '</span></div>' +
        '<div class="pdr-status">' + statusIcon(f.status, iconSymbol) + '</div>';
    }).join('');

    return '<div class="pdr" id="drawer-' + sc + '"><div class="pdr-grid">' + fieldsHtml + '</div></div>';
  }

  function renderFa(sc) {
    var s = state[sc];
    if (!s) return;

    // FIX #9: sponDirtyOnly means sponsor changed but NOT full edit mode
    var isEditing = (s.dirty && !s.sponDirtyOnly) || (!!originalState[sc] && !s.sponDirtyOnly);
    var isPaid = s.catType && s.catType.toLowerCase().indexOf('paid') !== -1;
    var isSponsored = s.catType && s.catType.toLowerCase().indexOf('sponsor') !== -1;

    var catCol;
    if (!isEditing) {
      if (s.catId) {
        catCol = '<div class="pc"><span class="ppt-col-label">Category</span>' +
          '<span class="pcp cfa">' + (s.catNm || '—') + '</span></div>';
      } else {
        catCol = '<div class="pc"><span class="ppt-col-label">Category</span>' +
          '<select class="pd" data-dropdown="fa-cat" data-sc="' + sc + '">' +
          buildCategoryOptions('FA', '') + '</select></div>';
      }
    } else {
      catCol = '<div class="pc"><span class="ppt-col-label">Category</span>' +
        '<select class="pd' + (s.catId ? ' hs' : '') + '" data-dropdown="fa-cat" data-sc="' + sc + '">' +
        buildCategoryOptions('FA', s.catId) + '</select></div>';
    }

    var custCol = '';
    if (isPaid) {
      if (!isEditing && s.custId) {
        custCol = '<div class="pc"><span class="ppt-col-label">Customer</span>' +
          '<span class="pcv">' + s.custNm + '</span></div>';
      } else {
        custCol = '<div class="pc"><span class="ppt-col-label">Customer</span>' +
          '<select class="pd' + (s.custId ? ' hs' : '') + '" data-dropdown="fa-cust" data-sc="' + sc + '"' +
          (!s.catId ? ' disabled' : '') + '>' +
          buildCustomerOptions(s.custId, '--') + '</select></div>';
      }
    }

    var artCol;
    var artDisabled = (!s.catId || (isPaid && !s.custId)) ? ' disabled' : '';
    if (!isEditing && s.artId) {
      artCol = '<div class="pc"><span class="ppt-col-label">Article</span>' +
        '<span class="pcv">' + s.artNm + '</span></div>';
    } else {
      artCol = '<div class="pc"><span class="ppt-col-label">Article</span>' +
        '<select class="pd' + (s.artId ? ' hs' : '') + '" data-dropdown="fa-art" data-sc="' + sc + '"' +
        artDisabled + '>' +
        buildFaArticleOptions(isPaid ? s.custId : '', s.catId, s.artId) + '</select></div>';
    }

    // FIX #8: Sponsor dropdown always editable (independent of article selection)
    // FIX #9: No Sponsor checkbox does NOT trigger full edit mode — just marks dirty
    // FIX #10: No Sponsor checkbox right-aligned in header, smaller
    var sponCol = '';
    if (isSponsored) {
      var noSpCheckbox = '<label class="pxl pxl-right"><input type="checkbox" data-checkbox="fa-nospon" data-sc="' + sc + '"' +
        (s.noSponsor ? ' checked' : '') + '> No Sponsor</label>';

      if (s.noSponsor) {
        sponCol = '<div class="pc"><span class="ppt-col-label">Sponsor <span style="flex:1;"></span>' + noSpCheckbox + '</span>' +
          '<span class="pcv ns" style="font-style:italic;color:#999;">No sponsor</span></div>';
      } else {
        // Always show dropdown — not gated by artId or edit mode
        sponCol = '<div class="pc"><span class="ppt-col-label">Sponsor <span style="flex:1;"></span>' + noSpCheckbox + '</span>' +
          '<select class="pd' + (s.sponsorId ? ' hs' : '') + '" data-dropdown="fa-spon" data-sc="' + sc + '">' +
          buildCustomerOptions(s.sponsorId, '--') + '</select></div>';
      }
    }

    var actionHtml;
    if (isEditing) {
      actionHtml = '<a class="ppt-cancel-lnk visible" data-action="cancel-fa" data-sc="' + sc + '">cancel</a>';
    } else if (s.catId) {
      actionHtml = '<a class="pei" data-action="edit-fa" data-sc="' + sc + '" title="Edit">✎</a>';
    } else {
      actionHtml = '<span style="color:#ccc;">—</span>';
    }
    var chevronHtml = '<span class="pch" data-action="toggle-drawer" data-sc="' + sc + '">▾</span>';

    var tileHtml =
      '<div class="ptr' + (isEditing ? ' hp' : '') + '" id="tile-' + sc + '">' +
        '<div class="psi sfa">' + sc + '</div>' +
        catCol + custCol + artCol + sponCol +
        '<div class="pac">' + actionHtml + chevronHtml + '</div>' +
      '</div>';

    var drawerHtml = buildFaDrawer(sc);

    var existing = document.getElementById('tile-' + sc);
    var existingDrawer = document.getElementById('drawer-' + sc);
    var drawerWasOpen = existingDrawer ? existingDrawer.classList.contains('open') : false;

    if (existing) {
      existing.outerHTML = tileHtml;
      if (existingDrawer) existingDrawer.remove();
    } else {
      var grid = document.getElementById('fa-grid');
      if (grid) grid.insertAdjacentHTML('beforeend', tileHtml);
    }

    var newTile = document.getElementById('tile-' + sc);
    if (newTile) {
      newTile.insertAdjacentHTML('afterend', drawerHtml);
      if (drawerWasOpen) {
        var d = document.getElementById('drawer-' + sc);
        if (d) d.classList.add('open');
        var ch = newTile.querySelector('.pch');
        if (ch) ch.classList.add('open');
      }
    }

    bindFaEvents(sc);
  }

  function renderAllFa() {
    for (var i = 1; i <= 4; i++) renderFa('FA-' + i);
    updateFaProgress();
  }

  function bindFaEvents(sc) {
    var tile = document.getElementById('tile-' + sc);
    if (!tile) return;

    var catSelect = tile.querySelector('[data-dropdown="fa-cat"][data-sc="' + sc + '"]');
    if (catSelect) {
      catSelect.addEventListener('change', function () {
        handleFaCatChange(sc, catSelect);
      });
    }

    var custSelect = tile.querySelector('[data-dropdown="fa-cust"][data-sc="' + sc + '"]');
    if (custSelect) {
      custSelect.addEventListener('change', function () {
        handleFaCustChange(sc, custSelect);
      });
    }

    var artSelect = tile.querySelector('[data-dropdown="fa-art"][data-sc="' + sc + '"]');
    if (artSelect) {
      artSelect.addEventListener('change', function () {
        handleFaArtChange(sc, artSelect);
      });
    }

    var sponSelect = tile.querySelector('[data-dropdown="fa-spon"][data-sc="' + sc + '"]');
    if (sponSelect) {
      sponSelect.addEventListener('change', function () {
        handleFaSponChange(sc, sponSelect);
      });
    }

    var noSponCb = tile.querySelector('[data-checkbox="fa-nospon"][data-sc="' + sc + '"]');
    if (noSponCb) {
      noSponCb.addEventListener('change', function () {
        handleFaNoSponChange(sc, noSponCb);
      });
    }

    var editBtn = tile.querySelector('[data-action="edit-fa"][data-sc="' + sc + '"]');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        var s = state[sc];
        if (!s) return;
        originalState[sc] = Object.assign({}, s);
        s.dirty = true;
        s.sponDirtyOnly = false;  // Full edit overrides sponsor-only
        renderFa(sc);
        updateFaProgress();
      });
    }

    var cancelBtn = tile.querySelector('[data-action="cancel-fa"][data-sc="' + sc + '"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        var s = state[sc];
        var orig = originalState[sc];
        if (s && orig) {
          Object.assign(s, orig);
          s.dirty = false;
          s.catChanged = false;
          s.sponDirtyOnly = false;
          delete originalState[sc];
        }
        renderFa(sc);
        updateFaProgress();
      });
    }

    var chevron = tile.querySelector('[data-action="toggle-drawer"][data-sc="' + sc + '"]');
    if (chevron) {
      chevron.addEventListener('click', function () {
        tD(sc);
      });
    }
  }

  function handleFaCatChange(sc, sel) {
    var s = state[sc];
    if (!s) return;
    var opt = sel.options[sel.selectedIndex];
    var newCatId = opt ? opt.value || '' : '';
    if (!newCatId) return;

    var hasDownstream = s.artId || s.custId || s.sponsorId;

    var doChange = function () {
      if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
      s.catId = newCatId;
      s.catNm = opt ? opt.textContent || '' : '';
      s.catType = (opt && opt.dataset) ? opt.dataset.type || '' : '';
      s.artId = ''; s.artNm = '';
      s.custId = ''; s.custNm = '';
      s.sponsorId = ''; s.sponNm = '';
      s.catChanged = true;
      s.dirty = true;
      renderFa(sc);
      updateFaProgress();
    };

    if (hasDownstream) {
      showInlineConfirm(sel, 'Changing category will clear article & sponsor.', doChange, function () {
        sel.value = s.catId || '';
      });
    } else {
      doChange();
    }
  }

  function handleFaCustChange(sc, sel) {
    var s = state[sc];
    if (!s) return;
    var opt = sel.options[sel.selectedIndex];
    var newCustId = opt ? opt.value || '' : '';

    var doChange = function () {
      if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
      s.custId = newCustId;
      s.custNm = opt ? opt.textContent || '' : '';
      s.artId = ''; s.artNm = '';
      s.dirty = true;
      renderFa(sc);
      updateFaProgress();
    };

    if (s.artId && newCustId !== s.custId) {
      showInlineConfirm(sel, 'Changing customer will clear article selection.', doChange, function () {
        sel.value = s.custId || '';
      });
    } else {
      doChange();
    }
  }

  function handleFaArtChange(sc, sel) {
    var s = state[sc];
    if (!s) return;
    if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
    var opt = sel.options[sel.selectedIndex];
    s.artId = opt ? opt.value || '' : '';
    s.artNm = opt ? opt.textContent || '' : '';
    s.catChanged = false;
    s.dirty = true;
    renderFa(sc);
    updateFaProgress();
  }

  function handleFaSponChange(sc, sel) {
    var s = state[sc];
    if (!s) return;
    if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
    var opt = sel.options[sel.selectedIndex];
    s.sponsorId = opt ? opt.value || '' : '';
    s.sponNm = opt ? opt.textContent || '' : '';
    s.dirty = true;
    s.sponDirtyOnly = true;  // FIX #9: don't trigger full edit mode
    renderFa(sc);
    updateFaProgress();
  }

  function handleFaNoSponChange(sc, cb) {
    var s = state[sc];
    if (!s) return;
    if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
    s.noSponsor = cb.checked;
    if (cb.checked) { s.sponsorId = ''; s.sponNm = ''; }
    s.dirty = true;
    s.sponDirtyOnly = true;  // FIX #9: don't trigger full edit mode
    renderFa(sc);
    updateFaProgress();
  }

  function updateFaProgress() {
    updateSlotIndicators('fa', 4, function (code) {
      var s = state[code];
      return !!(s && s.artId && !s.dirty);
    });
    var pendingCount = 0;
    for (var i = 1; i <= 4; i++) {
      var s = state['FA-' + i];
      if (s && s.dirty) pendingCount++;
    }
    updateSaveButton('fa', pendingCount > 0);
  }

  // ════════════════════════════════════════════════════════
  //  THEMED SPOTLIGHTS (TS) — 4 slots
  // ════════════════════════════════════════════════════════

  function initTsState() {
    var slotEls = document.querySelectorAll('.pubplan-slot-wrapper[data-section-code="ts"]');
    slotEls.forEach(function (el) {
      var code = el.dataset.slotCode;
      if (!code) return;
      var tsCatId = el.dataset.catId || '';
      // FIX #6: Look up catNm from Products if CMS catLabel is empty
      var tsCatNm = el.dataset.catLabel || '';
      if (tsCatId && !tsCatNm) {
        var prodEl = document.querySelector('.products-wrapper[data-id="' + tsCatId + '"]');
        if (prodEl) tsCatNm = prodEl.dataset.name || '';
      }
      // FIX #7: Look up artNm from articles-wrapper if CMS articleTitle is empty
      var tsArtId = el.dataset.articleId || '';
      var tsArtNm = el.dataset.articleTitle || '';
      if (tsArtId && !tsArtNm) {
        var artEl = document.querySelector('.articles-wrapper[data-article-id="' + tsArtId + '"]');
        if (artEl) tsArtNm = artEl.dataset.articleTitle || '';
      }
      state[code] = {
        sc: code,
        secC: 'ts',
        section: el.dataset.section || 'Themed Spotlight',
        slotNum: parseInt(code.replace(/\D/g, ''), 10),
        pubplanId: el.dataset.pubplanId || '',
        titleadminId: el.dataset.titleadminId || '',
        catId: tsCatId,
        catNm: tsCatNm,
        catType: getCatType(tsCatId),
        artId: tsArtId,
        artNm: tsArtNm,
        custId: el.dataset.customerId || '',
        custNm: el.dataset.customerName || '',
        sponsorId: el.dataset.sponsorId || '',
        sponNm: el.dataset.sponsorName || '',
        artAdId: el.dataset.artAdId || '',
        artAdUrl: el.dataset.artAdUrl || '',
        artAdGo: el.dataset.artAdGo || '',
        noSponsor: el.dataset.noSponsor === 'true',
        catChanged: false,
        dirty: false
      };
    });
    for (var i = 1; i <= 4; i++) {
      var code = 'TS-' + i;
      if (!state[code]) {
        state[code] = {
          sc: code, secC: 'ts', slotNum: i, section: 'Themed Spotlight',
          pubplanId: '', titleadminId: '',
          catId: '', catNm: '', catType: '',
          artId: '', artNm: '',
          custId: '', custNm: '',
          sponsorId: '', sponNm: '',
          artAdId: '', artAdUrl: '', artAdGo: '',
          noSponsor: false, catChanged: false, dirty: false
        };
      }
    }
  }

  function getTsPickerData(slotNum) {
    var pickerEl = document.querySelector('.ts-picker-wrapper');
    if (!pickerEl) return {};
    var prefix = 'ts' + slotNum;
    var artAdGet = pickerEl.dataset[prefix + 'ArtAdGet'] || '';
    var artAdGo = pickerEl.dataset[prefix + 'ArtAdGo'] || '';
    var s = state['TS-' + slotNum];
    var artEl = (s && s.artId) ? document.querySelector('.articles-wrapper[data-article-id="' + s.artId + '"]') : null;
    var artImgGet = artEl ? artEl.dataset.artImgGet || '' : '';
    var artWfImg = artEl ? artEl.dataset.imageUrl || '' : '';
    var showArtAd = artEl ? artEl.dataset.showArtAd || '' : '';
    var artPgSet = (showArtAd === 'Show' || showArtAd === 'true') ? 'true' : '';
    var nlPgSet = pickerEl.dataset[prefix + 'NlPgSet'] || '';
    return {
      artImgGet: artImgGet, artWfImg: artWfImg,
      adImgGet: artAdGet, adGoLink: artAdGo,
      artPgSet: artPgSet, nlPgSet: nlPgSet
    };
  }

  function buildTsDrawer(sc) {
    var s = state[sc];
    if (!s) return '';
    var d = getTsPickerData(s.slotNum);
    var artEl = s.artId ? document.querySelector('.articles-wrapper[data-article-id="' + s.artId + '"]') : null;

    var fields = [
      { label: 'Summary',  value: (artEl && artEl.dataset.articleSummary) ? artEl.dataset.articleSummary : '—', status: (artEl && artEl.dataset.articleSummary) ? 'ok' : 'bad' },
      { label: 'Body',     value: (artEl && artEl.dataset.articleBody) ? 'Present' : '—', status: (artEl && artEl.dataset.articleBody) ? 'ok' : 'bad' },
      { label: 'Writer',   value: (artEl && artEl.dataset.writerName) ? artEl.dataset.writerName : '—', status: (artEl && artEl.dataset.writerName) ? 'ok' : 'bad' },
      { label: 'CoWriter', value: (artEl && artEl.dataset.cowriterName) ? artEl.dataset.cowriterName : '—', status: (artEl && artEl.dataset.cowriterName) ? 'ok' : 'na' },
      { label: 'Image',    value: d.artWfImg ? 'Present' : '—', status: d.artWfImg ? 'ok' : 'bad' },
      { label: 'Img GET',  value: d.artImgGet ? 'Present' : '—', status: d.artImgGet ? 'ok' : 'bad' },
      { label: 'Type',     value: (artEl && artEl.dataset.articleType) ? artEl.dataset.articleType : '—', status: (artEl && artEl.dataset.articleType) ? 'ok' : 'bad' },
      { label: 'Ad Stat',  value: d.artPgSet ? 'ON' : 'OFF', status: d.artPgSet ? 'ok' : 'na' },
      { label: 'Ad Img',   value: d.adImgGet ? 'Present' : '—', status: d.adImgGet ? 'ok' : ((s.custId || s.sponsorId) ? 'bad' : 'na') },
      { label: 'Ad Go',    value: d.adGoLink ? 'Present' : '—', status: d.adGoLink ? 'ok' : ((s.custId || s.sponsorId) ? 'bad' : 'na') }
    ];

    var fieldsHtml = fields.map(function (f) {
      var iconSymbol = f.status === 'ok' ? '✓' : (f.status === 'bad' ? '✕' : '—');
      return '<div class="pdr-field"><span class="pdr-label">' + f.label + '</span>' +
        '<span class="pdr-value">' + f.value + '</span></div>' +
        '<div class="pdr-status">' + statusIcon(f.status, iconSymbol) + '</div>';
    }).join('');

    return '<div class="pdr" id="drawer-' + sc + '"><div class="pdr-grid">' + fieldsHtml + '</div></div>';
  }

  function renderTs(sc) {
    var s = state[sc];
    if (!s) return;

    var isEditing = (s.dirty && !s.sponDirtyOnly) || (!!originalState[sc] && !s.sponDirtyOnly);
    var isPaid = s.catType && s.catType.toLowerCase().indexOf('paid') !== -1;
    var isSponsored = s.catType && s.catType.toLowerCase().indexOf('sponsor') !== -1;

    var catCol;
    if (!isEditing) {
      if (s.catId) {
        catCol = '<div class="pc"><span class="ppt-col-label">Category</span>' +
          '<span class="pcp cts">' + (s.catNm || '—') + '</span></div>';
      } else {
        catCol = '<div class="pc"><span class="ppt-col-label">Category</span>' +
          '<select class="pd" data-dropdown="ts-cat" data-sc="' + sc + '">' +
          buildCategoryOptions('TS', '') + '</select></div>';
      }
    } else {
      catCol = '<div class="pc"><span class="ppt-col-label">Category</span>' +
        '<select class="pd' + (s.catId ? ' hs' : '') + '" data-dropdown="ts-cat" data-sc="' + sc + '">' +
        buildCategoryOptions('TS', s.catId) + '</select></div>';
    }

    var custCol = '';
    if (isPaid) {
      if (!isEditing && s.custId) {
        custCol = '<div class="pc"><span class="ppt-col-label">Customer</span>' +
          '<span class="pcv">' + s.custNm + '</span></div>';
      } else {
        custCol = '<div class="pc"><span class="ppt-col-label">Customer</span>' +
          '<select class="pd' + (s.custId ? ' hs' : '') + '" data-dropdown="ts-cust" data-sc="' + sc + '"' +
          (!s.catId ? ' disabled' : '') + '>' +
          buildCustomerOptions(s.custId, '--') + '</select></div>';
      }
    }

    var artCol;
    var artDisabled = (!s.catId || (isPaid && !s.custId)) ? ' disabled' : '';
    if (!isEditing && s.artId) {
      artCol = '<div class="pc"><span class="ppt-col-label">Article</span>' +
        '<span class="pcv">' + s.artNm + '</span></div>';
    } else {
      artCol = '<div class="pc"><span class="ppt-col-label">Article</span>' +
        '<select class="pd' + (s.artId ? ' hs' : '') + '" data-dropdown="ts-art" data-sc="' + sc + '"' +
        artDisabled + '>' +
        buildTsArticleOptions(isPaid ? s.custId : '', s.catId, s.artId) + '</select></div>';
    }

    var sponCol = '';
    if (isSponsored) {
      var noSpCheckbox = '<label class="pxl pxl-right"><input type="checkbox" data-checkbox="ts-nospon" data-sc="' + sc + '"' +
        (s.noSponsor ? ' checked' : '') + '> No Sponsor</label>';

      if (s.noSponsor) {
        sponCol = '<div class="pc"><span class="ppt-col-label">Sponsor <span style="flex:1;"></span>' + noSpCheckbox + '</span>' +
          '<span class="pcv ns" style="font-style:italic;color:#999;">No sponsor</span></div>';
      } else {
        sponCol = '<div class="pc"><span class="ppt-col-label">Sponsor <span style="flex:1;"></span>' + noSpCheckbox + '</span>' +
          '<select class="pd' + (s.sponsorId ? ' hs' : '') + '" data-dropdown="ts-spon" data-sc="' + sc + '">' +
          buildCustomerOptions(s.sponsorId, '--') + '</select></div>';
      }
    }

    var actionHtml;
    if (isEditing) {
      actionHtml = '<a class="ppt-cancel-lnk visible" data-action="cancel-ts" data-sc="' + sc + '">cancel</a>';
    } else if (s.catId) {
      actionHtml = '<a class="pei" data-action="edit-ts" data-sc="' + sc + '" title="Edit">✎</a>';
    } else {
      actionHtml = '<span style="color:#ccc;">—</span>';
    }
    var chevronHtml = '<span class="pch" data-action="toggle-drawer" data-sc="' + sc + '">▾</span>';

    var tileHtml =
      '<div class="ptr tsr' + (isEditing ? ' hp' : '') + '" id="tile-' + sc + '">' +
        '<div class="psi sts">' + sc + '</div>' +
        catCol + custCol + artCol + sponCol +
        '<div class="pac">' + actionHtml + chevronHtml + '</div>' +
      '</div>';

    var drawerHtml = buildTsDrawer(sc);

    var existing = document.getElementById('tile-' + sc);
    var existingDrawer = document.getElementById('drawer-' + sc);
    var drawerWasOpen = existingDrawer ? existingDrawer.classList.contains('open') : false;

    if (existing) {
      existing.outerHTML = tileHtml;
      if (existingDrawer) existingDrawer.remove();
    } else {
      var grid = document.getElementById('ts-grid');
      if (grid) grid.insertAdjacentHTML('beforeend', tileHtml);
    }

    var newTile = document.getElementById('tile-' + sc);
    if (newTile) {
      newTile.insertAdjacentHTML('afterend', drawerHtml);
      if (drawerWasOpen) {
        var d = document.getElementById('drawer-' + sc);
        if (d) d.classList.add('open');
        var ch = newTile.querySelector('.pch');
        if (ch) ch.classList.add('open');
      }
    }

    bindTsEvents(sc);
  }

  function renderAllTs() {
    for (var i = 1; i <= 4; i++) renderTs('TS-' + i);
    updateTsProgress();
  }

  function bindTsEvents(sc) {
    var tile = document.getElementById('tile-' + sc);
    if (!tile) return;

    var catSelect = tile.querySelector('[data-dropdown="ts-cat"][data-sc="' + sc + '"]');
    if (catSelect) {
      catSelect.addEventListener('change', function () {
        handleTsCatChange(sc, catSelect);
      });
    }

    var custSelect = tile.querySelector('[data-dropdown="ts-cust"][data-sc="' + sc + '"]');
    if (custSelect) {
      custSelect.addEventListener('change', function () {
        handleTsCustChange(sc, custSelect);
      });
    }

    var artSelect = tile.querySelector('[data-dropdown="ts-art"][data-sc="' + sc + '"]');
    if (artSelect) {
      artSelect.addEventListener('change', function () {
        handleTsArtChange(sc, artSelect);
      });
    }

    var sponSelect = tile.querySelector('[data-dropdown="ts-spon"][data-sc="' + sc + '"]');
    if (sponSelect) {
      sponSelect.addEventListener('change', function () {
        handleTsSponChange(sc, sponSelect);
      });
    }

    var noSponCb = tile.querySelector('[data-checkbox="ts-nospon"][data-sc="' + sc + '"]');
    if (noSponCb) {
      noSponCb.addEventListener('change', function () {
        handleTsNoSponChange(sc, noSponCb);
      });
    }

    var editBtn = tile.querySelector('[data-action="edit-ts"][data-sc="' + sc + '"]');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        var s = state[sc];
        if (!s) return;
        originalState[sc] = Object.assign({}, s);
        s.dirty = true;
        s.sponDirtyOnly = false;
        renderTs(sc);
        updateTsProgress();
      });
    }

    var cancelBtn = tile.querySelector('[data-action="cancel-ts"][data-sc="' + sc + '"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        var s = state[sc];
        var orig = originalState[sc];
        if (s && orig) {
          Object.assign(s, orig);
          s.dirty = false;
          s.catChanged = false;
          s.sponDirtyOnly = false;
          delete originalState[sc];
        }
        renderTs(sc);
        updateTsProgress();
      });
    }

    var chevron = tile.querySelector('[data-action="toggle-drawer"][data-sc="' + sc + '"]');
    if (chevron) {
      chevron.addEventListener('click', function () {
        tD(sc);
      });
    }
  }

  function handleTsCatChange(sc, sel) {
    var s = state[sc];
    if (!s) return;
    var opt = sel.options[sel.selectedIndex];
    var newCatId = opt ? opt.value || '' : '';
    if (!newCatId) return;

    var hasDownstream = s.artId || s.custId || s.sponsorId;

    var doChange = function () {
      if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
      s.catId = newCatId;
      s.catNm = opt ? opt.textContent || '' : '';
      s.catType = (opt && opt.dataset) ? opt.dataset.type || '' : '';
      s.artId = ''; s.artNm = '';
      s.custId = ''; s.custNm = '';
      s.sponsorId = ''; s.sponNm = '';
      s.catChanged = true;
      s.dirty = true;
      renderTs(sc);
      updateTsProgress();
    };

    if (hasDownstream) {
      showInlineConfirm(sel, 'Changing category will clear article & sponsor.', doChange, function () {
        sel.value = s.catId || '';
      });
    } else {
      doChange();
    }
  }

  function handleTsCustChange(sc, sel) {
    var s = state[sc];
    if (!s) return;
    var opt = sel.options[sel.selectedIndex];
    var newCustId = opt ? opt.value || '' : '';

    var doChange = function () {
      if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
      s.custId = newCustId;
      s.custNm = opt ? opt.textContent || '' : '';
      s.artId = ''; s.artNm = '';
      s.dirty = true;
      renderTs(sc);
      updateTsProgress();
    };

    if (s.artId && newCustId !== s.custId) {
      showInlineConfirm(sel, 'Changing customer will clear article selection.', doChange, function () {
        sel.value = s.custId || '';
      });
    } else {
      doChange();
    }
  }

  function handleTsArtChange(sc, sel) {
    var s = state[sc];
    if (!s) return;
    if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
    var opt = sel.options[sel.selectedIndex];
    s.artId = opt ? opt.value || '' : '';
    s.artNm = opt ? opt.textContent || '' : '';
    s.catChanged = false;
    s.dirty = true;
    renderTs(sc);
    updateTsProgress();
  }

  function handleTsSponChange(sc, sel) {
    var s = state[sc];
    if (!s) return;
    if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
    var opt = sel.options[sel.selectedIndex];
    s.sponsorId = opt ? opt.value || '' : '';
    s.sponNm = opt ? opt.textContent || '' : '';
    s.dirty = true;
    s.sponDirtyOnly = true;
    renderTs(sc);
    updateTsProgress();
  }

  function handleTsNoSponChange(sc, cb) {
    var s = state[sc];
    if (!s) return;
    if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
    s.noSponsor = cb.checked;
    if (cb.checked) { s.sponsorId = ''; s.sponNm = ''; }
    s.dirty = true;
    s.sponDirtyOnly = true;
    renderTs(sc);
    updateTsProgress();
  }

  function updateTsProgress() {
    updateSlotIndicators('ts', 4, function (code) {
      var s = state[code];
      return !!(s && s.artId && !s.dirty);
    });
    var pendingCount = 0;
    for (var i = 1; i <= 4; i++) {
      var s = state['TS-' + i];
      if (s && s.dirty) pendingCount++;
    }
    updateSaveButton('ts', pendingCount > 0);
  }

  // ════════════════════════════════════════════════════════
  //  BANNER ADS (BA) — 12 slots
  // ════════════════════════════════════════════════════════

  function initBaState() {
    var slotEls = document.querySelectorAll('.ba-slot-wrapper');
    slotEls.forEach(function (el) {
      var code = el.dataset.slotCode;
      if (!code) return;
      var slotNum = parseInt(code.replace(/\D/g, ''), 10);
      var adId = el.dataset.adId || '';
      var adName = el.dataset.adTitle || el.dataset.adName || '';
      if (adId && !adName) {
        var adEl = document.querySelector('.ads-wrapper[data-ad-id="' + adId + '"]');
        adName = adEl ? (adEl.dataset.adName || adEl.dataset.adTitle || '') : '';
      }
      state[code] = {
        sc: code,
        secC: 'ba',
        slotNum: slotNum,
        pubplanId: el.dataset.pubplanId || '',
        titleadminId: el.dataset.titleadminId || '',
        section: el.dataset.section || 'Banner Ad',
        catId: el.dataset.catId || '',
        catNm: el.dataset.catLabel || '',
        custId: el.dataset.customerId || '',
        custNm: el.dataset.customerName || '',
        adId: adId,
        adName: adName,
        dirty: false
      };
    });
    for (var i = 1; i <= 12; i++) {
      var code = 'BA-' + i;
      if (!state[code]) {
        state[code] = {
          sc: code, secC: 'ba', slotNum: i, section: 'Banner Ad',
          pubplanId: '', titleadminId: '',
          catId: '', catNm: '',
          custId: '', custNm: '',
          adId: '', adName: '',
          dirty: false
        };
      }
    }
  }

  function getBaPickerData(slotNum) {
    var wrapperClass = slotNum <= 6 ? '.ba-picker-1-wrapper' : '.ba-picker-2-wrapper';
    var pickerEl = document.querySelector(wrapperClass);
    if (!pickerEl) return {};
    var prefix = 'ba' + slotNum;
    return {
      adGet: pickerEl.dataset[prefix + 'AdGet'] || '',
      adGo: pickerEl.dataset[prefix + 'AdGo'] || ''
    };
  }

  function buildBaDrawer(sc) {
    var s = state[sc];
    if (!s) return '';
    var d = getBaPickerData(s.slotNum);
    var fields = [
      { label: 'Ad Image Link', value: d.adGet ? 'Present' : '—', status: d.adGet ? 'ok' : (s.adId ? 'bad' : 'na') },
      { label: 'Ad Redirect',   value: d.adGo ? 'Present' : '—', status: d.adGo ? 'ok' : (s.adId ? 'bad' : 'na') }
    ];
    var fieldsHtml = fields.map(function (f) {
      var iconSymbol = f.status === 'ok' ? '✓' : (f.status === 'bad' ? '✕' : '—');
      return '<div class="pdr-field"><span class="pdr-label">' + f.label + '</span>' +
        '<span class="pdr-value">' + f.value + '</span></div>' +
        '<div class="pdr-status">' + statusIcon(f.status, iconSymbol) + '</div>';
    }).join('');
    return '<div class="pdr" id="drawer-' + sc + '">' +
      '<div class="pdr-grid" style="grid-template-columns: 1fr 60px 1fr 60px;">' + fieldsHtml + '</div></div>';
  }

  function renderBa(sc) {
    var s = state[sc];
    if (!s) return;

    var isEditing = s.dirty || !!originalState[sc];
    var d = getBaPickerData(s.slotNum);

    var adThumb = '';
    if (!isEditing && s.adId && d.adGet) {
      adThumb = '<img src="' + d.adGet + '" class="ppt-ad-thumb" alt="">';
    } else if (!isEditing && s.adId && !d.adGet) {
      adThumb = '<div class="ppt-ad-thumb-placeholder">🖼</div>';
    }

    var custCol;
    if (s.custId && !isEditing) {
      custCol = '<div class="ppt-card-field"><span class="ppt-col-label">Customer</span>' +
        '<span class="pcv">' + s.custNm + '</span></div>';
    } else {
      custCol = '<div class="ppt-card-field"><span class="ppt-col-label">Customer</span>' +
        '<select class="pd' + (s.custId ? ' hs' : '') + '" data-dropdown="ba-cust" data-sc="' + sc + '">' +
        buildCustomerOptions(s.custId, 'Select customer...') + '</select></div>';
    }

    var adCol = '';
    if (isEditing || !s.adId) {
      adCol = '<div class="ppt-card-field"><span class="ppt-col-label">Ad</span>' +
        '<select class="pd' + (s.adId ? ' hs' : '') + '" data-dropdown="ba-ad" data-sc="' + sc + '"' +
        (!s.custId ? ' disabled' : '') + '>' +
        buildAdOptions(s.custId, s.adId) + '</select></div>';
    }

    var actionHtml;
    if (isEditing) {
      actionHtml = '<a class="ppt-cancel-lnk visible" data-action="cancel-ba" data-sc="' + sc + '">cancel</a>';
    } else if (s.adId) {
      actionHtml = '<a class="pei" data-action="edit-ba" data-sc="' + sc + '" title="Edit">✎</a>';
    } else {
      actionHtml = '<span style="color:#ccc;">—</span>';
    }
    var chevronHtml = '<span class="pch" data-action="toggle-drawer" data-sc="' + sc + '">▾</span>';

    var cardHtml =
      '<div class="ptw" id="wrapper-' + sc + '">' +
        '<div class="ptc' + (isEditing ? ' hp' : '') + '" id="tile-' + sc + '">' +
          '<div class="pcs">' + sc + '</div>' +
          adThumb +
          '<div class="ptc-body">' + custCol + adCol + '</div>' +
          '<div class="pca">' + actionHtml + chevronHtml + '</div>' +
        '</div>' +
        buildBaDrawer(sc) +
      '</div>';

    var existing = document.getElementById('wrapper-' + sc);
    if (existing) {
      var drawerWasOpen = document.getElementById('drawer-' + sc) ?
        document.getElementById('drawer-' + sc).classList.contains('open') : false;
      existing.outerHTML = cardHtml;
      if (drawerWasOpen) {
        var d2 = document.getElementById('drawer-' + sc);
        if (d2) d2.classList.add('open');
        var tile = document.getElementById('tile-' + sc);
        var ch = tile ? tile.querySelector('.pch') : null;
        if (ch) ch.classList.add('open');
      }
    } else {
      var grid = document.getElementById('ba-grid');
      if (grid) grid.insertAdjacentHTML('beforeend', cardHtml);
    }

    bindBaEvents(sc);
  }

  function renderAllBa() {
    for (var i = 1; i <= 12; i++) renderBa('BA-' + i);
    updateBaProgress();
  }

  function bindBaEvents(sc) {
    var tile = document.getElementById('tile-' + sc);
    if (!tile) return;

    var custSelect = tile.querySelector('[data-dropdown="ba-cust"][data-sc="' + sc + '"]');
    if (custSelect) {
      custSelect.addEventListener('change', function () {
        handleBaCustChange(sc, custSelect);
      });
    }

    var adSelect = tile.querySelector('[data-dropdown="ba-ad"][data-sc="' + sc + '"]');
    if (adSelect) {
      adSelect.addEventListener('change', function () {
        handleBaAdChange(sc, adSelect);
      });
    }

    var editBtn = tile.querySelector('[data-action="edit-ba"][data-sc="' + sc + '"]');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        var s = state[sc];
        if (!s) return;
        originalState[sc] = Object.assign({}, s);
        s.dirty = true;
        renderBa(sc);
        updateBaProgress();
      });
    }

    var cancelBtn = tile.querySelector('[data-action="cancel-ba"][data-sc="' + sc + '"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        var s = state[sc];
        var orig = originalState[sc];
        if (s && orig) {
          Object.assign(s, orig);
          s.dirty = false;
          delete originalState[sc];
        }
        renderBa(sc);
        updateBaProgress();
      });
    }

    var chevron = tile.querySelector('[data-action="toggle-drawer"][data-sc="' + sc + '"]');
    if (chevron) {
      chevron.addEventListener('click', function () {
        tD(sc);
      });
    }
  }

  function handleBaCustChange(sc, sel) {
    var s = state[sc];
    if (!s) return;
    if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
    var opt = sel.options[sel.selectedIndex];
    s.custId = opt ? opt.value || '' : '';
    s.custNm = opt ? opt.textContent || '' : '';
    s.adId = '';
    s.adName = '';
    s.dirty = true;
    renderBa(sc);
    updateBaProgress();
  }

  function handleBaAdChange(sc, sel) {
    var s = state[sc];
    if (!s) return;
    if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
    var opt = sel.options[sel.selectedIndex];
    s.adId = opt ? opt.value || '' : '';
    s.adName = opt ? opt.textContent || '' : '';
    s.dirty = true;
    renderBa(sc);
    updateBaProgress();
  }

  function updateBaProgress() {
    updateSlotIndicators('ba', 12, function (code) {
      var s = state[code];
      return !!(s && s.adId && !s.dirty);
    });
    var pendingCount = 0;
    for (var i = 1; i <= 12; i++) {
      var s = state['BA-' + i];
      if (s && s.dirty) pendingCount++;
    }
    updateSaveButton('ba', pendingCount > 0);
  }

  // ════════════════════════════════════════════════════════
  //  THE FIND (TF) — MODE TOGGLE + TXA (5 slots) + LBP (1 slot)
  // ════════════════════════════════════════════════════════

  window.switchTfMode = function (mode) {
    if (mode === currentTfMode) return;

    var hasTxaChanges = [1, 2, 3, 4, 5].some(function (i) {
      var s = state['TXA-' + i];
      return s && s.dirty;
    });
    var hasLbpChanges = state['LBP-1'] && state['LBP-1'].dirty;
    var hasChanges = (currentTfMode === 'txa' && hasTxaChanges) || (currentTfMode === 'lbp' && hasLbpChanges);

    var doSwitch = function () {
      if (currentTfMode === 'txa') {
        for (var i = 1; i <= 5; i++) {
          var code = 'TXA-' + i;
          if (state[code]) { state[code].dirty = false; state[code].custId = ''; state[code].custNm = ''; }
          delete originalState[code];
        }
      } else {
        if (state['LBP-1']) { state['LBP-1'].dirty = false; state['LBP-1'].custId = ''; state['LBP-1'].custNm = ''; }
        delete originalState['LBP-1'];
      }

      currentTfMode = mode;

      document.querySelectorAll('.tf-mode-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.mode === mode);
      });

      var tfTxa = document.querySelector('.the-find-txa');
      var tfLbp = document.querySelector('.the-find-lbp');
      if (tfTxa) tfTxa.classList.toggle('is-active', mode === 'txa');
      if (tfLbp) tfLbp.classList.toggle('is-active', mode === 'lbp');

      var countEl = document.getElementById('tf-slot-count');
      if (countEl) countEl.textContent = mode === 'txa' ? '5 slots' : '1 slot';

      updateTfProgress();
    };

    if (hasChanges) {
      var btn = document.querySelector('.tf-mode-btn[data-mode="' + mode + '"]');
      showInlineConfirm(
        btn || document.getElementById('tf-submit-btn'),
        'Switching modes will clear unsaved changes.',
        doSwitch,
        null
      );
    } else {
      doSwitch();
    }
  };

  function initTxaState() {
    var slotEls = document.querySelectorAll('.txa-slot-wrapper');
    slotEls.forEach(function (el) {
      var code = el.dataset.slotCode;
      if (!code) return;
      state[code] = {
        sc: code,
        secC: 'txa',
        slotNum: parseInt(code.replace(/\D/g, ''), 10),
        pubplanId: el.dataset.pubplanId || '',
        titleadminId: el.dataset.titleAdminId || el.dataset.titleadminId || '',
        section: el.dataset.section || 'The Find',
        custId: el.dataset.customerId || '',
        custNm: el.dataset.customerName || '',
        catId: el.dataset.catId || '',
        dirty: false
      };
    });
    for (var i = 1; i <= 5; i++) {
      var code = 'TXA-' + i;
      if (!state[code]) {
        state[code] = {
          sc: code, secC: 'txa', slotNum: i, section: 'The Find',
          pubplanId: '', titleadminId: '',
          custId: '', custNm: '', catId: '',
          dirty: false
        };
      }
    }
  }

  function getTxaPickerData(slotNum) {
    var wrapper = document.querySelector('.txa-picker-wrapper');
    if (!wrapper) return {};
    var prefix = 'txa' + slotNum;
    return {
      logoLink: wrapper.dataset[prefix + 'LogoLink'] || '',
      redirect: wrapper.dataset[prefix + 'Redirect'] || '',
      headline: wrapper.dataset[prefix + 'Headline'] || '',
      body: wrapper.dataset[prefix + 'Body'] || ''
    };
  }

  function buildTxaDrawer(sc) {
    var s = state[sc];
    if (!s) return '';
    var d = getTxaPickerData(s.slotNum);
    var fields = [
      { label: 'Logo',      value: d.logoLink ? 'Present' : '—', status: d.logoLink ? 'ok' : (s.custId ? 'bad' : 'na') },
      { label: 'Redirect',  value: d.redirect ? 'Present' : '—', status: d.redirect ? 'ok' : (s.custId ? 'bad' : 'na') },
      { label: 'Headline',  value: d.headline || '—',            status: d.headline ? 'ok' : (s.custId ? 'bad' : 'na') },
      { label: 'Body Text', value: d.body ? 'Present' : '—',    status: d.body ? 'ok' : (s.custId ? 'bad' : 'na') }
    ];
    var fieldsHtml = fields.map(function (f) {
      var iconSymbol = f.status === 'ok' ? '✓' : (f.status === 'bad' ? '✕' : '—');
      return '<div class="pdr-field"><span class="pdr-label">' + f.label + '</span>' +
        '<span class="pdr-value">' + f.value + '</span></div>' +
        '<div class="pdr-status">' + statusIcon(f.status, iconSymbol) + '</div>';
    }).join('');
    return '<div class="pdr" id="drawer-' + sc + '">' +
      '<div class="pdr-grid" style="grid-template-columns: repeat(2,1fr 60px);">' + fieldsHtml + '</div></div>';
  }

  function renderTxa(sc) {
    var s = state[sc];
    if (!s) return;

    var isEditing = s.dirty || !!originalState[sc];
    var d = getTxaPickerData(s.slotNum);

    var logoThumb = '';
    if (s.custId && d.logoLink) {
      logoThumb = '<img src="' + d.logoLink + '" class="ppt-ad-thumb" alt="">';
    } else if (s.custId && !d.logoLink) {
      logoThumb = '<div class="ppt-ad-thumb-placeholder">🖼</div>';
    }

    var custCol;
    if (s.custId && !isEditing) {
      custCol = '<div class="ppt-card-field"><span class="ppt-col-label">Customer</span>' +
        '<span class="pcv">' + s.custNm + '</span></div>';
    } else {
      custCol = '<div class="ppt-card-field"><span class="ppt-col-label">Customer</span>' +
        '<select class="pd' + (s.custId ? ' hs' : '') + '" data-dropdown="txa-cust" data-sc="' + sc + '">' +
        buildCustomerOptions(s.custId, 'Select customer...') + '</select></div>';
    }

    var actionHtml;
    if (isEditing) {
      actionHtml = '<a class="ppt-cancel-lnk visible" data-action="cancel-txa" data-sc="' + sc + '">cancel</a>';
    } else if (s.custId) {
      actionHtml = '<a class="pei" data-action="edit-txa" data-sc="' + sc + '" title="Edit">✎</a>';
    } else {
      actionHtml = '<span style="color:#ccc;">—</span>';
    }
    var chevronHtml = '<span class="pch" data-action="toggle-drawer" data-sc="' + sc + '">▾</span>';

    var cardHtml =
      '<div class="ptw" id="wrapper-' + sc + '">' +
        '<div class="ptc tfc' + (isEditing ? ' hp' : '') + '" id="tile-' + sc + '">' +
          '<div class="pcs">' + sc + '</div>' +
          logoThumb +
          '<div class="ptc-body">' + custCol + '</div>' +
          '<div class="pca">' + actionHtml + chevronHtml + '</div>' +
        '</div>' +
        buildTxaDrawer(sc) +
      '</div>';

    var existing = document.getElementById('wrapper-' + sc);
    if (existing) {
      var drawerWasOpen = document.getElementById('drawer-' + sc) ?
        document.getElementById('drawer-' + sc).classList.contains('open') : false;
      existing.outerHTML = cardHtml;
      if (drawerWasOpen) {
        var d2 = document.getElementById('drawer-' + sc);
        if (d2) d2.classList.add('open');
        var tile = document.getElementById('tile-' + sc);
        var ch = tile ? tile.querySelector('.pch') : null;
        if (ch) ch.classList.add('open');
      }
    } else {
      var grid = document.getElementById('txa-grid');
      if (grid) grid.insertAdjacentHTML('beforeend', cardHtml);
    }

    bindTxaEvents(sc);
  }

  function renderAllTxa() {
    for (var i = 1; i <= 5; i++) renderTxa('TXA-' + i);
  }

  function bindTxaEvents(sc) {
    var tile = document.getElementById('tile-' + sc);
    if (!tile) return;

    var custSelect = tile.querySelector('[data-dropdown="txa-cust"][data-sc="' + sc + '"]');
    if (custSelect) {
      custSelect.addEventListener('change', function () {
        var s = state[sc];
        if (!s) return;
        if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
        var opt = custSelect.options[custSelect.selectedIndex];
        s.custId = opt ? opt.value || '' : '';
        s.custNm = opt ? opt.textContent || '' : '';
        s.dirty = true;
        renderTxa(sc);
        updateTfProgress();
      });
    }

    var editBtn = tile.querySelector('[data-action="edit-txa"][data-sc="' + sc + '"]');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        var s = state[sc];
        if (!s) return;
        originalState[sc] = Object.assign({}, s);
        s.dirty = true;
        renderTxa(sc);
        updateTfProgress();
      });
    }

    var cancelBtn = tile.querySelector('[data-action="cancel-txa"][data-sc="' + sc + '"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        var s = state[sc];
        var orig = originalState[sc];
        if (s && orig) {
          Object.assign(s, orig);
          s.dirty = false;
          delete originalState[sc];
        }
        renderTxa(sc);
        updateTfProgress();
      });
    }

    var chevron = tile.querySelector('[data-action="toggle-drawer"][data-sc="' + sc + '"]');
    if (chevron) {
      chevron.addEventListener('click', function () {
        tD(sc);
      });
    }
  }

  function initLbpState() {
    var el = document.querySelector('.txa-slot-wrapper[data-slot-code="TXA-1"]');
    state['LBP-1'] = {
      sc: 'LBP-1',
      secC: 'lbp',
      section: 'The Find',
      titleadminId: el ? (el.dataset.titleAdminId || el.dataset.titleadminId || '') : getTitleadminId(),
      custId: el ? el.dataset.customerId || '' : '',
      custNm: el ? el.dataset.customerName || '' : '',
      dirty: false
    };
  }

  function getLbpPickerData() {
    var wrapper = document.querySelector('.txa-picker-wrapper');
    if (!wrapper) return {};
    return {
      logoLink: wrapper.dataset.lbpLogoLink || '',
      redirect: wrapper.dataset.lbpRedirect || '',
      service1: wrapper.dataset.lbpService1 || '',
      service2: wrapper.dataset.lbpService2 || '',
      service3: wrapper.dataset.lbpService3 || '',
      service4: wrapper.dataset.lbpService4 || '',
      service5: wrapper.dataset.lbpService5 || '',
      service6: wrapper.dataset.lbpService6 || ''
    };
  }

  function buildLbpDrawer() {
    var s = state['LBP-1'];
    if (!s) return '';
    var d = getLbpPickerData();
    var fields = [
      { label: 'Logo',      value: d.logoLink ? 'Present' : '—', status: d.logoLink ? 'ok' : (s.custId ? 'bad' : 'na') },
      { label: 'Redirect',  value: d.redirect ? 'Present' : '—', status: d.redirect ? 'ok' : (s.custId ? 'bad' : 'na') },
      { label: 'Service 1', value: d.service1 || '—', status: d.service1 ? 'ok' : 'na' },
      { label: 'Service 2', value: d.service2 || '—', status: d.service2 ? 'ok' : 'na' },
      { label: 'Service 3', value: d.service3 || '—', status: d.service3 ? 'ok' : 'na' },
      { label: 'Service 4', value: d.service4 || '—', status: d.service4 ? 'ok' : 'na' },
      { label: 'Service 5', value: d.service5 || '—', status: d.service5 ? 'ok' : 'na' },
      { label: 'Service 6', value: d.service6 || '—', status: d.service6 ? 'ok' : 'na' }
    ];
    var fieldsHtml = fields.map(function (f) {
      var iconSymbol = f.status === 'ok' ? '✓' : (f.status === 'bad' ? '✕' : '—');
      return '<div class="pdr-field"><span class="pdr-label">' + f.label + '</span>' +
        '<span class="pdr-value">' + f.value + '</span></div>' +
        '<div class="pdr-status">' + statusIcon(f.status, iconSymbol) + '</div>';
    }).join('');
    return '<div class="pdr" id="drawer-LBP-1">' +
      '<div class="pdr-grid" style="grid-template-columns: repeat(4,1fr 60px);">' + fieldsHtml + '</div></div>';
  }

  function renderLbp() {
    var s = state['LBP-1'];
    if (!s) return;

    var isEditing = s.dirty || !!originalState['LBP-1'];

    var custCol;
    if (s.custId && !isEditing) {
      custCol = '<div class="ppt-card-field"><span class="ppt-col-label">Featured Business</span>' +
        '<span class="pcv">' + s.custNm + '</span></div>';
    } else {
      custCol = '<div class="ppt-card-field"><span class="ppt-col-label">Featured Business</span>' +
        '<select class="pd' + (s.custId ? ' hs' : '') + '" style="min-width:200px;" data-dropdown="lbp-cust">' +
        buildCustomerOptions(s.custId, 'Select business...') + '</select></div>';
    }

    var actionHtml;
    if (isEditing) {
      actionHtml = '<a class="ppt-cancel-lnk visible" data-action="cancel-lbp">cancel</a>';
    } else if (s.custId) {
      actionHtml = '<a class="pei" data-action="edit-lbp" title="Edit">✎</a>';
    } else {
      actionHtml = '<span style="color:#ccc;">—</span>';
    }
    var chevronHtml = '<span class="pch" data-action="toggle-drawer" data-sc="LBP-1">▾</span>';

    var tileHtml =
      '<div class="ptc tfc' + (isEditing ? ' hp' : '') + '" id="tile-LBP-1">' +
        '<div class="pcs">LBP</div>' +
        '<div class="ptc-body">' + custCol + '</div>' +
        '<div class="pca">' + actionHtml + chevronHtml + '</div>' +
      '</div>';

    var drawerHtml = buildLbpDrawer();

    var existing = document.getElementById('tile-LBP-1');
    var existingDrawer = document.getElementById('drawer-LBP-1');
    var drawerWasOpen = existingDrawer ? existingDrawer.classList.contains('open') : false;

    if (existing) {
      existing.outerHTML = tileHtml;
      if (existingDrawer) existingDrawer.remove();
    } else {
      var grid = document.getElementById('lbp-grid');
      if (grid) grid.insertAdjacentHTML('beforeend', tileHtml);
    }

    var newTile = document.getElementById('tile-LBP-1');
    if (newTile) {
      newTile.insertAdjacentHTML('afterend', drawerHtml);
      if (drawerWasOpen) {
        var d = document.getElementById('drawer-LBP-1');
        if (d) d.classList.add('open');
        var ch = newTile.querySelector('.pch');
        if (ch) ch.classList.add('open');
      }
    }

    bindLbpEvents();
  }

  function bindLbpEvents() {
    var tile = document.getElementById('tile-LBP-1');
    if (!tile) return;

    var custSelect = tile.querySelector('[data-dropdown="lbp-cust"]');
    if (custSelect) {
      custSelect.addEventListener('change', function () {
        var s = state['LBP-1'];
        if (!s) return;
        if (!originalState['LBP-1']) originalState['LBP-1'] = Object.assign({}, s);
        var opt = custSelect.options[custSelect.selectedIndex];
        s.custId = opt ? opt.value || '' : '';
        s.custNm = opt ? opt.textContent || '' : '';
        s.dirty = true;
        renderLbp();
        updateTfProgress();
      });
    }

    var editBtn = tile.querySelector('[data-action="edit-lbp"]');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        var s = state['LBP-1'];
        if (!s) return;
        originalState['LBP-1'] = Object.assign({}, s);
        s.dirty = true;
        renderLbp();
        updateTfProgress();
      });
    }

    var cancelBtn = tile.querySelector('[data-action="cancel-lbp"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        var s = state['LBP-1'];
        var orig = originalState['LBP-1'];
        if (s && orig) {
          Object.assign(s, orig);
          s.dirty = false;
          delete originalState['LBP-1'];
        }
        renderLbp();
        updateTfProgress();
      });
    }

    var chevron = tile.querySelector('[data-action="toggle-drawer"][data-sc="LBP-1"]');
    if (chevron) {
      chevron.addEventListener('click', function () {
        tD('LBP-1');
      });
    }
  }

  function updateTfProgress() {
    var count = currentTfMode === 'txa' ? 5 : 1;
    var prefix = currentTfMode === 'txa' ? 'TXA' : 'LBP';

    updateSlotIndicators('tf', count, function (code) {
      var idx = parseInt(code.split('-')[1]);
      var s = state[prefix + '-' + idx];
      return !!(s && s.custId);
    });

    var pendingCount = 0;
    if (currentTfMode === 'txa') {
      for (var i = 1; i <= 5; i++) {
        var s = state['TXA-' + i];
        if (s && s.dirty) pendingCount++;
      }
    } else {
      if (state['LBP-1'] && state['LBP-1'].dirty) pendingCount++;
    }
    updateSaveButton('tf', pendingCount > 0);
  }

  // ════════════════════════════════════════════════════════
  //  SUBMIT — per-slot, URLSearchParams, no-cors
  //  FIX #1: Post-save uses window.location.reload() after 3s
  // ════════════════════════════════════════════════════════

  window.submitSection = async function (section) {
    var btn = document.getElementById(section + '-submit-btn');
    if (!btn || btn.classList.contains('submitting')) return;
    btn.classList.add('submitting');
    btn.textContent = 'Saving...';

    var pubplanId = getPubplanId();
    var slots = [];

    if (section === 'gr') {
      var s = state['GR-1'];
      if (s && s.dirty) {
        slots.push({
          'hidden-pubplan-id':     pubplanId,
          'hidden-slot-label':     s.sc,
          'hidden-titleadmin-id':  s.titleadminId || '',
          'hidden-section-code':   s.secC,
          'hidden-category-group': s.section,
          'hidden-gr-title':       s.grTit,
          'hidden-gr-message':     s.grMsg
        });
      }
    } else if (section === 'em') {
      var s = state['EM-1'];
      if (s && s.dirty) {
        slots.push({
          'hidden-pubplan-id':     pubplanId,
          'hidden-slot-label':     s.sc,
          'hidden-titleadmin-id':  s.titleadminId || '',
          'hidden-section-code':   s.secC,
          'hidden-category-group': s.section,
          'hidden-em-subject':     s.emSub,
          'hidden-em-preview':     s.emPre
        });
      }

    } else if (section === 'fa') {
      for (var i = 1; i <= 4; i++) {
        var s = state['FA-' + i];
        if (s && s.dirty) {
          slots.push({
            'hidden-pubplan-id':     pubplanId,
            'hidden-slot-label':     s.catChanged ? ('FA-CAT-' + i) : s.sc,
            'hidden-titleadmin-id':  s.titleadminId || '',
            'hidden-section-code':   s.secC,
            'hidden-category-group': s.section,
            'hidden-category-id':    s.catId,
            'hidden-category-name':  s.catNm,
            'hidden-category-type':  s.catType,
            'hidden-customer-id':    s.custId,
            'hidden-customer-name':  s.custNm,
            'hidden-article-id':     s.artId,
            'hidden-article-name':   s.artNm,
            'hidden-sponsor-id':     s.sponsorId,
            'hidden-ba-picker-id':   s.artAdId || '',
            'hidden-no-sponsor':     s.noSponsor
          });
        }
      }

    } else if (section === 'ts') {
      for (var i = 1; i <= 4; i++) {
        var s = state['TS-' + i];
        if (s && s.dirty) {
          slots.push({
            'hidden-pubplan-id':     pubplanId,
            'hidden-slot-label':     s.catChanged ? ('TS-CAT-' + i) : s.sc,
            'hidden-titleadmin-id':  s.titleadminId || '',
            'hidden-section-code':   s.secC,
            'hidden-category-group': s.section,
            'hidden-category-id':    s.catId,
            'hidden-category-name':  s.catNm,
            'hidden-category-type':  s.catType,
            'hidden-customer-id':    s.custId,
            'hidden-customer-name':  s.custNm,
            'hidden-article-id':     s.artId,
            'hidden-article-name':   s.artNm,
            'hidden-sponsor-id':     s.sponsorId,
            'hidden-ba-picker-id':   s.artAdId || '',
            'hidden-no-sponsor':     s.noSponsor
          });
        }
      }

    } else if (section === 'ba') {
      for (var i = 1; i <= 12; i++) {
        var s = state['BA-' + i];
        if (s && s.dirty) {
          slots.push({
            'hidden-pubplan-id':     pubplanId,
            'hidden-slot-label':     s.sc,
            'hidden-titleadmin-id':  s.titleadminId || '',
            'hidden-section-code':   s.secC,
            'hidden-category-group': s.section,
            'hidden-category-id':    s.catId,
            'hidden-category-name':  s.catNm,
            'hidden-customer-id':    s.custId,
            'hidden-customer-name':  s.custNm,
            'hidden-ad-id':          s.adId
          });
        }
      }

    } else if (section === 'tf') {
      if (currentTfMode === 'txa') {
        for (var i = 1; i <= 5; i++) {
          var s = state['TXA-' + i];
          if (s && s.dirty) {
            slots.push({
              'hidden-pubplan-id':     pubplanId,
              'hidden-slot-label':     s.sc,
              'hidden-titleadmin-id':  s.titleadminId || '',
              'hidden-section-code':   s.secC,
              'hidden-category-group': s.section,
              'hidden-customer-id':    s.custId,
              'hidden-customer-name':  s.custNm,
              'hidden-category-id':    s.catId
            });
          }
        }
      } else {
        var s = state['LBP-1'];
        if (s && s.dirty) {
          slots.push({
            'hidden-pubplan-id':     pubplanId,
            'hidden-slot-label':     s.sc,
            'hidden-titleadmin-id':  s.titleadminId || '',
            'hidden-section-code':   s.secC,
            'hidden-category-group': s.section,
            'hidden-customer-id':    s.custId,
            'hidden-customer-name':  s.custNm
          });
        }
      }
    }

    if (!slots.length) {
      btn.classList.remove('submitting');
      btn.textContent = 'Save ' + section.toUpperCase() + ' Changes';
      showToast('No changes to save.');
      return;
    }

    // ── Send: 1 fetch per slot, URLSearchParams, no-cors ──
    try {
      await Promise.all(
        slots.map(function (slot) {
          return fetch(WEBHOOK_URLS[section], {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(slot).toString()
          });
        })
      );

      // FIX #1: Use reload() instead of href redirect (avoids Memberstack blank page)
      showToast(section.toUpperCase() + ' saved! Refreshing in 3s…');
      setTimeout(function () {
        window.location.reload();
      }, 3000);

    } catch (e) {
      showToast('Network error — changes not saved. Please try again.', true);
      btn.classList.remove('submitting');
      btn.textContent = 'Save ' + section.toUpperCase() + ' Changes';
    }
  };

  // ════════════════════════════════════════════════════════
  //  INIT
  // ════════════════════════════════════════════════════════

  function init() {
    var nameEl = document.getElementById('pubplan-name-display');
    var dataWrapper = document.querySelector('.pubplan-data-wrapper');
    if (nameEl && dataWrapper) {
      nameEl.textContent = dataWrapper.dataset.pubplanName || '';
    }

    var tfModeEl = document.querySelector('[data-tf-mode]');
    currentTfMode = (tfModeEl && tfModeEl.dataset.tfMode) ? tfModeEl.dataset.tfMode : 'txa';
    document.querySelectorAll('.tf-mode-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.mode === currentTfMode);
    });
    var tfTxa = document.querySelector('.the-find-txa');
    var tfLbp = document.querySelector('.the-find-lbp');
    if (tfTxa) tfTxa.classList.toggle('is-active', currentTfMode === 'txa');
    if (tfLbp) tfLbp.classList.toggle('is-active', currentTfMode === 'lbp');

    initGrState();
    initEmState();
    initFaState();
    initTsState();
    initBaState();
    initTxaState();
    initLbpState();

    renderGr();
    renderEm();
    renderAllFa();
    renderAllTs();
    renderAllBa();
    renderAllTxa();
    renderLbp();

    updateGrProgress();
    updateEmProgress();
    updateFaProgress();
    updateTsProgress();
    updateBaProgress();
    updateTfProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
