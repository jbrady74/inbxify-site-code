// ============================================================
// PUBPLAN TILE UI — v5.0.1
// Clean rebuild from v4.0.31 (ORIGINAL) spec
// Sections: GR, EM (FA, TS, BA, TF to follow)
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

  // Section anchors for post-save reload
  const SECTION_ANCHORS = {
    gr: 'gr-loc', em: 'em-loc', fa: 'fa-loc',
    ts: 'ts-loc', ba: 'ba-loc', tf: 'tf-loc'
  };

  const GR_LIMITS = { grTit: 50, grMsg: 300 };
  const EM_LIMITS = { emSub: 60, emPre: 100 };

  // ════════════════════════════════════════════════════════
  //  STATE
  // ════════════════════════════════════════════════════════

  // Current working state for each slot, keyed by slot code as it comes from CMS (e.g. 'GR-1', 'FA-2') — always CAPS
  const state = {};

  // Snapshot of state at the moment edit was initiated, for cancel/revert
  const originalState = {};

  // TF mode: 'txa' or 'lbp' — synced from DOM on init
  let currentTfMode = null;

  // ════════════════════════════════════════════════════════
  //  DOM HELPERS
  // ════════════════════════════════════════════════════════

  function getPubplanId() {
    const el = document.querySelector('.pubplan-slot-wrapper[data-pubplan-id]');
    return el ? el.dataset.pubplanId || '' : '';
  }

  function getTitleadminId() {
    const el = document.querySelector('.pubplan-slot-wrapper[data-titleadmin-id]');
    return el ? el.dataset.titleadminId || '' : '';
  }

  // ════════════════════════════════════════════════════════
  //  UI UTILITIES
  // ════════════════════════════════════════════════════════

  function showToast(msg, isError) {
    const t = document.getElementById('ppt-toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'ppt-toast show' + (isError ? ' error' : '');
    setTimeout(() => t.classList.remove('show'), 3500);
  }

  /** Status icon (checkmark, X, or dash) */
  function statusIcon(status, symbol) {
    return '<div class="pio ' + status + '">' + symbol + '</div>';
  }

  /** Character counter HTML */
  function charCountHtml(max, currentValue) {
    const remaining = Math.max(0, max - (currentValue || '').length);
    let cls = 'pcc';
    if (remaining <= max * 0.1) cls += ' danger';
    else if (remaining <= max * 0.2) cls += ' warning';
    return '<span class="' + cls + '">' + remaining + ' left</span>';
  }

  /**
   * Surgically update a character counter without rebuilding the tile.
   * Finds the .pcc sibling inside the same .pc parent as the input/textarea.
   */
  function updateCharCounter(inputEl, fieldKey, limits) {
    const counter = inputEl.parentElement ? inputEl.parentElement.querySelector('.pcc') : null;
    if (!counter) return;
    const max = limits[fieldKey] || 100;
    const remaining = Math.max(0, max - inputEl.value.length);
    counter.textContent = remaining + ' left';
    counter.className = 'pcc' + (remaining <= max * 0.1 ? ' danger' : remaining <= max * 0.2 ? ' warning' : '');
  }

  // ════════════════════════════════════════════════════════
  //  INLINE CONFIRM (replaces browser confirm() dialogs)
  // ════════════════════════════════════════════════════════

  function showInlineConfirm(anchorEl, msg, onYes, onNo) {
    // Remove any existing confirm bar
    const existing = document.querySelector('.ppt-inline-confirm');
    if (existing) existing.remove();

    const bar = document.createElement('div');
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

    const parent = anchorEl.closest('.pc') || anchorEl.parentElement;
    if (parent && parent.parentElement) {
      parent.parentElement.insertBefore(bar, parent.nextSibling);
    } else {
      anchorEl.insertAdjacentElement('afterend', bar);
    }
  }

  // ════════════════════════════════════════════════════════
  //  SLOT INDICATORS (dots in section bar)
  // ════════════════════════════════════════════════════════

  function updateSlotIndicators(section, count, isReadyFn) {
    const container = document.getElementById(section + '-indicators');
    if (!container) return;
    let html = '';
    for (let i = 1; i <= count; i++) {
      const code = (section + '-' + i).toUpperCase();
      const ready = isReadyFn(code);
      html += '<div class="ppt-slot-dot ' + (ready ? 'ready' : 'empty') + '">' + i + '</div>';
    }
    container.innerHTML = html;
  }

  /** Enable/disable the section Save button based on dirty slot count */
  function updateSaveButton(section, hasPending) {
    const btn = document.getElementById(section + '-submit-btn');
    if (btn) btn.className = 'ppt-submit-btn' + (hasPending ? ' active' : '');
  }

  // ════════════════════════════════════════════════════════
  //  DRAWER TOGGLE — global for HTML onclick
  // ════════════════════════════════════════════════════════

  window.tD = function (sc) {
    const drawer = document.getElementById('drawer-' + sc);
    const tile = document.getElementById('tile-' + sc);
    const chevron = tile ? tile.querySelector('.pch') : null;
    if (drawer) {
      drawer.classList.toggle('open');
      if (chevron) chevron.classList.toggle('open');
    }
  };

  // ════════════════════════════════════════════════════════
  //  GREETING (GR) — 1 slot, 2 text fields
  // ════════════════════════════════════════════════════════

  function initGrState() {
    const el = document.querySelector('.pubplan-slot-wrapper[data-section-code="gr"]');
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

  /**
   * Render the GR tile. This does a full tile build, but is only called on:
   *   - Initial load
   *   - Mode switch (view → edit, edit → view via cancel)
   *   - NOT on individual field input (that's handled surgically)
   */
  function renderGr() {
    var s = state['GR-1'];
    if (!s) return;

    var isEditing = s.dirty || !!originalState['GR-1'];
    var hasContent = s.grTit || s.grMsg;

    var fieldsHtml;

    if (isEditing) {
      // EDIT MODE: show inputs
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
      // VIEW MODE: show read-only values
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
      // EMPTY STATE
      fieldsHtml =
        '<div class="pc" style="flex:1;">' +
          '<span style="color:#ccc;">No greeting set. Click edit to add.</span>' +
        '</div>';
    }

    // Action link: cancel (in edit) or pencil (in view)
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

    // Bind event listeners (instead of inline onclick/oninput)
    bindGrEvents();
  }

  /**
   * Bind GR event listeners after render.
   * Uses event delegation on the tile for inputs and actions.
   */
  function bindGrEvents() {
    var tile = document.getElementById('tile-gr-1');
    if (!tile) return;

    // Input fields — surgical updates only (no re-render)
    var inputs = tile.querySelectorAll('input[data-field], textarea[data-field]');
    inputs.forEach(function (input) {
      input.addEventListener('input', function () {
        var s = state['GR-1'];
        if (!s) return;
        s[input.dataset.field] = input.value;
        s.dirty = true;
        updateCharCounter(input, input.dataset.field, GR_LIMITS);
        updateGrProgress();
        // NOTE: No renderGr() call — the input persists in the DOM
      });
    });

    // Edit action
    var editBtn = tile.querySelector('[data-action="edit-gr"]');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        var s = state['GR-1'];
        if (!s) return;
        originalState['GR-1'] = Object.assign({}, s);
        s.dirty = true;
        renderGr();  // Mode switch: view → edit (full rebuild OK)
        updateGrProgress();
      });
    }

    // Cancel action
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
        renderGr();  // Mode switch: edit → view (full rebuild OK)
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

  /**
   * Build customer <option> list from hidden .customers-wrapper elements.
   * Used by FA (Paid categories), BA, TXA, LBP.
   */
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

  /**
   * Build category <option> list from hidden .products-wrapper elements.
   * Filters by group (FA or TS). Each option carries data-type for catType detection.
   */
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
   * Build FA article <option> list from hidden .fa-picker-wrapper items.
   * Filters by custId (for Paid categories) or catId.
   */
  function buildFaArticleOptions(custId, catId, selectedId) {
    var wrapper = document.querySelector('.fa-picker-wrapper');
    if (!wrapper) return '<option value="" disabled selected>No articles</option>';
    var items = Array.from(wrapper.querySelectorAll('.fa-picker-item')).filter(function (el) {
      if (custId) return el.dataset.customerId === custId;
      if (catId) return el.dataset.catId === catId;
      return true;
    }).map(function (el) {
      return { id: el.dataset.articleId || '', name: el.dataset.artNm || '' };
    }).filter(function (a) { return a.id && a.name; });
    if (!items.length) return '<option value="" disabled selected>No articles</option>';
    return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select article...</option>' +
      items.map(function (a) {
        return '<option value="' + a.id + '"' + (a.id === selectedId ? ' selected' : '') + '>' + a.name + '</option>';
      }).join('');
  }

  /**
   * Build ad <option> list from hidden .ads-wrapper elements.
   * Filters by custId if provided. Used by BA section.
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
  //  Cascade: Category → Customer (if Paid) → Article → Sponsor (if Sponsored)
  //  catChanged flag: tells Make a category-only change happened
  // ════════════════════════════════════════════════════════

  /** Look up category type from the products DOM wrapper */
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
      state[code] = {
        sc: code,
        secC: 'fa',
        section: el.dataset.section || 'Feature Article',
        slotNum: parseInt(code.replace(/\D/g, ''), 10),
        pubplanId: el.dataset.pubplanId || '',
        titleadminId: el.dataset.titleadminId || '',
        catId: faCatId,
        catNm: el.dataset.catLabel || '',
        catType: getCatType(faCatId),
        artId: el.dataset.articleId || '',
        artNm: el.dataset.articleTitle || '',
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
    // Ensure all 4 slots exist even if CMS wrappers are missing
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

  // ── FA Picker Data (status pills read from DOM) ──

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

  // ── FA Drawer (article detail + status pills) ──

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

  // ── FA Render ──

  /**
   * Render a single FA tile. Called on:
   *   - Initial load
   *   - Mode switch (view ↔ edit)
   *   - Cascading dropdown changes (category change clears downstream)
   *
   * For non-cascading changes (article select, sponsor select),
   * we surgically update only the affected dropdown and state,
   * then rebuild the drawer (status pills need fresh data).
   */
  function renderFa(sc) {
    var s = state[sc];
    if (!s) return;

    var isEditing = s.dirty || !!originalState[sc];
    var isPaid = s.catType && s.catType.toLowerCase().indexOf('paid') !== -1;
    var isSponsored = s.catType && s.catType.toLowerCase().indexOf('sponsor') !== -1;

    // ── Category column ──
    var catCol;
    if (!isEditing) {
      // VIEW: show pill if set, otherwise show dropdown for initial assignment
      if (s.catId) {
        catCol = '<div class="pc"><span class="ppt-col-label">Category</span>' +
          '<span class="pcp cfa">' + (s.catNm || '—') + '</span></div>';
      } else {
        catCol = '<div class="pc"><span class="ppt-col-label">Category</span>' +
          '<select class="pd" data-dropdown="fa-cat" data-sc="' + sc + '">' +
          buildCategoryOptions('FA', '') + '</select></div>';
      }
    } else {
      // EDIT: always show dropdown with selection highlighted
      catCol = '<div class="pc"><span class="ppt-col-label">Category</span>' +
        '<select class="pd' + (s.catId ? ' hs' : '') + '" data-dropdown="fa-cat" data-sc="' + sc + '">' +
        buildCategoryOptions('FA', s.catId) + '</select></div>';
    }

    // ── Customer column (only for Paid categories) ──
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

    // ── Article column ──
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

    // ── Sponsor column (only for Sponsored categories) ──
    var sponCol = '';
    if (isSponsored) {
      var noSpCheckbox = '<label class="pxl"><input type="checkbox" data-checkbox="fa-nospon" data-sc="' + sc + '"' +
        (s.noSponsor ? ' checked' : '') + '> No Sponsor</label>';

      if (s.noSponsor) {
        sponCol = '<div class="pc"><span class="ppt-col-label">Sponsor</span>' +
          '<span class="pcv ns">' + noSpCheckbox + '</span></div>';
      } else if (!isEditing && s.sponsorId) {
        sponCol = '<div class="pc"><span class="ppt-col-label">Sponsor</span>' +
          '<span class="pcv sponsor">' + s.sponNm + '</span></div>';
      } else {
        sponCol = '<div class="pc"><span class="ppt-col-label">Sponsor ' + noSpCheckbox + '</span>' +
          '<select class="pd' + (s.sponsorId ? ' hs' : '') + '" data-dropdown="fa-spon" data-sc="' + sc + '"' +
          (!s.artId ? ' disabled' : '') + '>' +
          buildCustomerOptions(s.sponsorId, '--') + '</select></div>';
      }
    }

    // ── Actions: cancel/edit + drawer chevron ──
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

    // ── DOM insertion with drawer state preservation ──
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

    // Insert drawer after tile
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

    // Bind events for this tile
    bindFaEvents(sc);
  }

  function renderAllFa() {
    for (var i = 1; i <= 4; i++) renderFa('FA-' + i);
    updateFaProgress();
  }

  // ── FA Event Binding ──

  function bindFaEvents(sc) {
    var tile = document.getElementById('tile-' + sc);
    if (!tile) return;

    // Category dropdown
    var catSelect = tile.querySelector('[data-dropdown="fa-cat"][data-sc="' + sc + '"]');
    if (catSelect) {
      catSelect.addEventListener('change', function () {
        handleFaCatChange(sc, catSelect);
      });
    }

    // Customer dropdown
    var custSelect = tile.querySelector('[data-dropdown="fa-cust"][data-sc="' + sc + '"]');
    if (custSelect) {
      custSelect.addEventListener('change', function () {
        handleFaCustChange(sc, custSelect);
      });
    }

    // Article dropdown
    var artSelect = tile.querySelector('[data-dropdown="fa-art"][data-sc="' + sc + '"]');
    if (artSelect) {
      artSelect.addEventListener('change', function () {
        handleFaArtChange(sc, artSelect);
      });
    }

    // Sponsor dropdown
    var sponSelect = tile.querySelector('[data-dropdown="fa-spon"][data-sc="' + sc + '"]');
    if (sponSelect) {
      sponSelect.addEventListener('change', function () {
        handleFaSponChange(sc, sponSelect);
      });
    }

    // No-Sponsor checkbox
    var noSponCb = tile.querySelector('[data-checkbox="fa-nospon"][data-sc="' + sc + '"]');
    if (noSponCb) {
      noSponCb.addEventListener('change', function () {
        handleFaNoSponChange(sc, noSponCb);
      });
    }

    // Edit button
    var editBtn = tile.querySelector('[data-action="edit-fa"][data-sc="' + sc + '"]');
    if (editBtn) {
      editBtn.addEventListener('click', function () {
        var s = state[sc];
        if (!s) return;
        originalState[sc] = Object.assign({}, s);
        s.dirty = true;
        renderFa(sc);  // Mode switch: view → edit
        updateFaProgress();
      });
    }

    // Cancel button
    var cancelBtn = tile.querySelector('[data-action="cancel-fa"][data-sc="' + sc + '"]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        var s = state[sc];
        var orig = originalState[sc];
        if (s && orig) {
          Object.assign(s, orig);
          s.dirty = false;
          s.catChanged = false;
          delete originalState[sc];
        }
        renderFa(sc);  // Mode switch: edit → view
        updateFaProgress();
      });
    }

    // Drawer toggle
    var chevron = tile.querySelector('[data-action="toggle-drawer"][data-sc="' + sc + '"]');
    if (chevron) {
      chevron.addEventListener('click', function () {
        tD(sc);
      });
    }
  }

  // ── FA Event Handlers ──

  /**
   * Category change — cascading: clears customer, article, sponsor.
   * If downstream data exists, shows inline confirm first.
   * Sets catChanged = true so submit sends FA-CAT-{i} as slot label.
   */
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
      // Clear all downstream
      s.artId = ''; s.artNm = '';
      s.custId = ''; s.custNm = '';
      s.sponsorId = ''; s.sponNm = '';
      s.catChanged = true;
      s.dirty = true;
      renderFa(sc);  // Full rebuild needed — downstream columns change
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

  /**
   * Customer change — cascading: clears article.
   * If article exists and customer is changing, shows inline confirm.
   */
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
      renderFa(sc);  // Rebuild — article dropdown needs repopulation
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

  /**
   * Article change — non-cascading.
   * Updates state, marks dirty, rebuilds tile to refresh drawer status pills.
   * catChanged is set to false since an article was explicitly selected.
   */
  function handleFaArtChange(sc, sel) {
    var s = state[sc];
    if (!s) return;
    if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
    var opt = sel.options[sel.selectedIndex];
    s.artId = opt ? opt.value || '' : '';
    s.artNm = opt ? opt.textContent || '' : '';
    s.catChanged = false;
    s.dirty = true;
    // Rebuild to refresh drawer (status pills depend on article data)
    renderFa(sc);
    updateFaProgress();
  }

  /**
   * Sponsor change — non-cascading. Updates state, marks dirty.
   */
  function handleFaSponChange(sc, sel) {
    var s = state[sc];
    if (!s) return;
    if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
    var opt = sel.options[sel.selectedIndex];
    s.sponsorId = opt ? opt.value || '' : '';
    s.sponNm = opt ? opt.textContent || '' : '';
    s.dirty = true;
    renderFa(sc);
    updateFaProgress();
  }

  /**
   * No-Sponsor checkbox — clears sponsor if checked.
   */
  function handleFaNoSponChange(sc, cb) {
    var s = state[sc];
    if (!s) return;
    if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
    s.noSponsor = cb.checked;
    if (cb.checked) { s.sponsorId = ''; s.sponNm = ''; }
    s.dirty = true;
    renderFa(sc);
    updateFaProgress();
  }

  // ── FA Progress ──

  function updateFaProgress() {
    updateSlotIndicators('fa', 4, function (code) {
      var s = state[code];
      // Ready = has article AND is saved (not dirty)
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
  //  Same cascade logic as FA: Category → Customer (if Paid) → Article → Sponsor (if Sponsored)
  //  Uses .ts-picker-wrapper / .ts-picker-item for article options
  // ════════════════════════════════════════════════════════

  function initTsState() {
    var slotEls = document.querySelectorAll('.pubplan-slot-wrapper[data-section-code="ts"]');
    slotEls.forEach(function (el) {
      var code = el.dataset.slotCode;
      if (!code) return;
      var tsCatId = el.dataset.catId || '';
      state[code] = {
        sc: code,
        secC: 'ts',
        section: el.dataset.section || 'Themed Spotlight',
        slotNum: parseInt(code.replace(/\D/g, ''), 10),
        pubplanId: el.dataset.pubplanId || '',
        titleadminId: el.dataset.titleadminId || '',
        catId: tsCatId,
        catNm: el.dataset.catLabel || '',
        catType: getCatType(tsCatId),
        artId: el.dataset.articleId || '',
        artNm: el.dataset.articleTitle || '',
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
    // Ensure all 4 slots exist
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

  // ── TS Article Options (from .ts-picker-wrapper, filters by custId or catId) ──

  function buildTsArticleOptions(custId, catId, selectedId) {
    var wrapper = document.querySelector('.ts-picker-wrapper');
    if (!wrapper) return '<option value="" disabled selected>No articles</option>';
    var items = Array.from(wrapper.querySelectorAll('.ts-picker-item')).filter(function (el) {
      if (custId) return el.dataset.customerId === custId;
      if (catId) return el.dataset.catId === catId;
      return true;
    }).map(function (el) {
      return { id: el.dataset.articleId || '', name: el.dataset.artNm || '' };
    }).filter(function (a) { return a.id && a.name; });
    if (!items.length) return '<option value="" disabled selected>No articles</option>';
    return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select article...</option>' +
      items.map(function (a) {
        return '<option value="' + a.id + '"' + (a.id === selectedId ? ' selected' : '') + '>' + a.name + '</option>';
      }).join('');
  }

  // ── TS Picker Data (status pills from DOM) ──

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

  // ── TS Drawer (same 10 fields as FA) ──

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

  // ── TS Render ──

  function renderTs(sc) {
    var s = state[sc];
    if (!s) return;

    var isEditing = s.dirty || !!originalState[sc];
    var isPaid = s.catType && s.catType.toLowerCase().indexOf('paid') !== -1;
    var isSponsored = s.catType && s.catType.toLowerCase().indexOf('sponsor') !== -1;

    // ── Category column ──
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

    // ── Customer column (only for Paid categories) ──
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

    // ── Article column ──
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

    // ── Sponsor column (only for Sponsored categories) ──
    var sponCol = '';
    if (isSponsored) {
      var noSpCheckbox = '<label class="pxl"><input type="checkbox" data-checkbox="ts-nospon" data-sc="' + sc + '"' +
        (s.noSponsor ? ' checked' : '') + '> No Sponsor</label>';

      if (s.noSponsor) {
        sponCol = '<div class="pc"><span class="ppt-col-label">Sponsor</span>' +
          '<span class="pcv ns">' + noSpCheckbox + '</span></div>';
      } else if (!isEditing && s.sponsorId) {
        sponCol = '<div class="pc"><span class="ppt-col-label">Sponsor</span>' +
          '<span class="pcv sponsor">' + s.sponNm + '</span></div>';
      } else {
        sponCol = '<div class="pc"><span class="ppt-col-label">Sponsor ' + noSpCheckbox + '</span>' +
          '<select class="pd' + (s.sponsorId ? ' hs' : '') + '" data-dropdown="ts-spon" data-sc="' + sc + '"' +
          (!s.artId ? ' disabled' : '') + '>' +
          buildCustomerOptions(s.sponsorId, '--') + '</select></div>';
      }
    }

    // ── Actions ──
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

    // ── DOM insertion with drawer state preservation ──
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

  // ── TS Event Binding ──

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

  // ── TS Event Handlers ──

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
    renderTs(sc);
    updateTsProgress();
  }

  // ── TS Progress ──

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
  //  BANNER ADS (BA) — 12 slots, 2-column card grid
  //  Cascade: Customer → Ad (no category/article/sponsor)
  //  Uses .ba-slot-wrapper for state, .ba-picker-1-wrapper (1–6) / .ba-picker-2-wrapper (7–12)
  //  Drawer: 2 fields (Ad Image Link, Ad Redirect)
  // ════════════════════════════════════════════════════════

  function initBaState() {
    var slotEls = document.querySelectorAll('.ba-slot-wrapper');
    slotEls.forEach(function (el) {
      var code = el.dataset.slotCode;
      if (!code) return;
      var slotNum = parseInt(code.replace(/\D/g, ''), 10);
      var adId = el.dataset.adId || '';
      var adName = el.dataset.adTitle || el.dataset.adName || '';
      // If we have an adId but no name, look it up from the ads wrapper
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
    // Ensure all 12 slots exist
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

  // ── BA Picker Data (ad image + redirect from split wrappers) ──

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

  // ── BA Drawer (2 fields: Ad Image Link, Ad Redirect) ──

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

  // ── BA Render (card layout, not horizontal row) ──

  function renderBa(sc) {
    var s = state[sc];
    if (!s) return;

    var isEditing = s.dirty || !!originalState[sc];
    var d = getBaPickerData(s.slotNum);

    // ── Ad thumbnail (view mode only) ──
    var adThumb = '';
    if (!isEditing && s.adId && d.adGet) {
      adThumb = '<img src="' + d.adGet + '" class="ppt-ad-thumb" alt="">';
    } else if (!isEditing && s.adId && !d.adGet) {
      adThumb = '<div class="ppt-ad-thumb-placeholder">🖼</div>';
    }

    // ── Customer column ──
    var custCol;
    if (s.custId && !isEditing) {
      custCol = '<div class="ppt-card-field"><span class="ppt-col-label">Customer</span>' +
        '<span class="pcv">' + s.custNm + '</span></div>';
    } else {
      custCol = '<div class="ppt-card-field"><span class="ppt-col-label">Customer</span>' +
        '<select class="pd' + (s.custId ? ' hs' : '') + '" data-dropdown="ba-cust" data-sc="' + sc + '">' +
        buildCustomerOptions(s.custId, 'Select customer...') + '</select></div>';
    }

    // ── Ad column (show in edit mode, or when no ad is set) ──
    var adCol = '';
    if (isEditing || !s.adId) {
      adCol = '<div class="ppt-card-field"><span class="ppt-col-label">Ad</span>' +
        '<select class="pd' + (s.adId ? ' hs' : '') + '" data-dropdown="ba-ad" data-sc="' + sc + '"' +
        (!s.custId ? ' disabled' : '') + '>' +
        buildAdOptions(s.custId, s.adId) + '</select></div>';
    }

    // ── Actions ──
    var actionHtml;
    if (isEditing) {
      actionHtml = '<a class="ppt-cancel-lnk visible" data-action="cancel-ba" data-sc="' + sc + '">cancel</a>';
    } else if (s.adId) {
      actionHtml = '<a class="pei" data-action="edit-ba" data-sc="' + sc + '" title="Edit">✎</a>';
    } else {
      actionHtml = '<span style="color:#ccc;">—</span>';
    }
    var chevronHtml = '<span class="pch" data-action="toggle-drawer" data-sc="' + sc + '">▾</span>';

    // BA uses card layout: .ptw wrapper > .ptc card > .ptc-body content
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

    // ── DOM insertion ──
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

  // ── BA Event Binding ──

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

  // ── BA Event Handlers ──

  /**
   * Customer change — clears ad selection (ad list is customer-filtered).
   */
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

  /**
   * Ad change — non-cascading.
   */
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

  // ── BA Progress ──

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
  //  TXA: 5-pack grid, each slot is a customer pick
  //  LBP: single featured business with services drawer
  //  Mode toggle switches between them; unsaved changes prompt confirm
  // ════════════════════════════════════════════════════════

  // ── Mode Toggle (global for HTML onclick on mode buttons) ──

  window.switchTfMode = function (mode) {
    if (mode === currentTfMode) return;

    var hasTxaChanges = [1, 2, 3, 4, 5].some(function (i) {
      var s = state['TXA-' + i];
      return s && s.dirty;
    });
    var hasLbpChanges = state['LBP-1'] && state['LBP-1'].dirty;
    var hasChanges = (currentTfMode === 'txa' && hasTxaChanges) || (currentTfMode === 'lbp' && hasLbpChanges);

    var doSwitch = function () {
      // Clear dirty state from the mode we're leaving
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

      // Toggle button active states
      document.querySelectorAll('.tf-mode-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.mode === mode);
      });

      // Toggle container visibility
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

  // ── TXA State Init ──

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

  // ── TXA Picker Data ──

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

  // ── TXA Drawer (4 fields: Logo, Redirect, Headline, Body Text) ──

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

  // ── TXA Render (card layout, like BA but with .tfc class) ──

  function renderTxa(sc) {
    var s = state[sc];
    if (!s) return;

    var isEditing = s.dirty || !!originalState[sc];
    var d = getTxaPickerData(s.slotNum);

    // Logo thumbnail
    var logoThumb = '';
    if (s.custId && d.logoLink) {
      logoThumb = '<img src="' + d.logoLink + '" class="ppt-ad-thumb" alt="">';
    } else if (s.custId && !d.logoLink) {
      logoThumb = '<div class="ppt-ad-thumb-placeholder">🖼</div>';
    }

    // Customer column
    var custCol;
    if (s.custId && !isEditing) {
      custCol = '<div class="ppt-card-field"><span class="ppt-col-label">Customer</span>' +
        '<span class="pcv">' + s.custNm + '</span></div>';
    } else {
      custCol = '<div class="ppt-card-field"><span class="ppt-col-label">Customer</span>' +
        '<select class="pd' + (s.custId ? ' hs' : '') + '" data-dropdown="txa-cust" data-sc="' + sc + '">' +
        buildCustomerOptions(s.custId, 'Select customer...') + '</select></div>';
    }

    // Actions
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

  // ── TXA Event Binding ──

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

  // ── LBP State Init ──

  function initLbpState() {
    // LBP reads from the first TXA slot wrapper for titleadminId
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

  // ── LBP Picker Data (from .txa-picker-wrapper with lbp prefix) ──

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

  // ── LBP Drawer (8 fields: Logo, Redirect, 6 Services) ──

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

  // ── LBP Render ──

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

  // ── LBP Event Binding ──

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

  // ── TF Progress (shared by TXA and LBP) ──

  function updateTfProgress() {
    var count = currentTfMode === 'txa' ? 5 : 1;
    var prefix = currentTfMode === 'txa' ? 'TXA' : 'LBP';

    updateSlotIndicators('tf', count, function (code) {
      // code comes in as 'TF-1', 'TF-2' etc — remap to TXA-1 or LBP-1
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
  //  Exact payload match to LIVE / Make.com expectations
  // ════════════════════════════════════════════════════════

  window.submitSection = async function (section) {
    var btn = document.getElementById(section + '-submit-btn');
    if (!btn || btn.classList.contains('submitting')) return;
    btn.classList.add('submitting');
    btn.textContent = 'Saving...';

    var pubplanId = getPubplanId();
    var slots = [];

    // ── Build payload per section ──
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

    // ── FA payload: 1 fetch per dirty slot, catChanged → FA-CAT-{i} label ──
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

    // ── TS payload: same structure as FA, catChanged → TS-CAT-{i} label ──
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

    // ── BA payload: Customer + Ad, uses hidden-ad-id ──
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

    // ── TF payload: mode-dependent — TXA (5 slots) or LBP (1 slot) ──
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

      showToast(section.toUpperCase() + ' saved! Refreshing…');

      // Reload with section anchor after brief delay
      setTimeout(function () {
        var anchor = SECTION_ANCHORS[section] || '';
        var base = window.location.pathname + window.location.search;
        window.location.href = base + (anchor ? '#' + anchor : '');
      }, 1200);

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
    // Pubplan name display
    var nameEl = document.getElementById('pubplan-name-display');
    var dataWrapper = document.querySelector('.pubplan-data-wrapper');
    if (nameEl && dataWrapper) {
      nameEl.textContent = dataWrapper.dataset.pubplanName || '';
    }

    // TF mode sync from DOM
    var tfModeEl = document.querySelector('[data-tf-mode]');
    currentTfMode = (tfModeEl && tfModeEl.dataset.tfMode) ? tfModeEl.dataset.tfMode : 'txa';
    document.querySelectorAll('.tf-mode-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.mode === currentTfMode);
    });
    var tfTxa = document.querySelector('.the-find-txa');
    var tfLbp = document.querySelector('.the-find-lbp');
    if (tfTxa) tfTxa.classList.toggle('is-active', currentTfMode === 'txa');
    if (tfLbp) tfLbp.classList.toggle('is-active', currentTfMode === 'lbp');

    // Initialize state from DOM
    initGrState();
    initEmState();
    initFaState();
    initTsState();
    initBaState();
    initTxaState();
    initLbpState();

    // Render tiles
    renderGr();
    renderEm();
    renderAllFa();
    renderAllTs();
    renderAllBa();
    renderAllTxa();
    renderLbp();

    // Update progress indicators
    updateGrProgress();
    updateEmProgress();
    updateFaProgress();
    updateTsProgress();
    updateBaProgress();
    updateTfProgress();
  }

  // ── Boot ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
