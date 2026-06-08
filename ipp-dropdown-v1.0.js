/* ============================================================
   ipp-dropdown-v1.0.js — Shared source reader + customer/asset dropdown
   PATH 1 (UI half): reads the hidden CMS source lists, renders a
   searchable dropdown on every tile picker button, and registers each
   through IPP.registerDropdown so selection PERSISTS (gold .ipp-dirty
   border + scope Cancel) exactly like greeting/CC. SAVE is STUBBED
   behind greeting's proven no-cors pattern — it logs the intended
   payload and shows the SAVING…/toast feedback, but points at a
   placeholder until the assign write contract + Make scenario exist.

   When the write contract lands, flip STUB_SAVE=false and set the
   per-type route in ASSIGN_ROUTE — no other change needed.

   DEPENDS ON: ipp-shell (window.IPP), ipp-picker-v1.5+ (IPP.editState,
   IPP.registerDropdown). Load AFTER ipp-picker.
   ============================================================ */
(function () {
  'use strict';
  if (!window.IPP) { console.error('[ipp-dropdown] shell not loaded'); return; }
  var IPP = window.IPP;

  /* ─── Source readers ────────────────────────────────────────
     Parse each hidden CMS wrapper ONCE into clean arrays. Every
     dropdown reads from here — one parse, reused everywhere. An
     empty/unrendered collection yields []. Attribute names are the
     EXACT live ones confirmed off the page (no guesses). */
  function readList(selector, map) {
    var rows = [];
    document.querySelectorAll(selector).forEach(function (el) {
      try { rows.push(map(el)); } catch (e) { /* skip malformed row */ }
    });
    return rows;
  }
  function attr(el, name) { var v = el.getAttribute(name); return v == null ? '' : v; }

  var Sources = {
    _cache: {},
    _build: function () {
      this._cache = {
        customers: readList('.customers-wrapper', function (el) {
          return {
            id: attr(el, 'data-id'),
            name: attr(el, 'data-name'),
            slug: attr(el, 'data-slug'),
            shortCode: attr(el, 'data-short-code'),
            logoInitials: attr(el, 'data-logo-initials'),
            website: attr(el, 'data-website'),
            email: attr(el, 'data-email'),
            phone: attr(el, 'data-phone'),
            tagline: attr(el, 'data-tagline'),
            neighborhood: attr(el, 'data-neighborhood'),
            paidAdUrl: attr(el, 'data-paid-ad-url'),
            sponsorshipAd: attr(el, 'data-sponsorship-ad'),
            categoryId: attr(el, 'data-category-id'),
            // TXA presets live on the customer item (per standing note)
            txa: [1,2,3,4,5,6].map(function (n) { return attr(el, 'data-txa-' + n); }).filter(Boolean)
          };
        }),
        products: readList('.products-wrapper', function (el) {
          return {
            id: attr(el, 'data-id'),
            name: attr(el, 'data-name'),
            abbr: attr(el, 'data-abbr'),
            group: attr(el, 'data-group'),
            contentType: attr(el, 'data-content-type'),
            sectionCode: attr(el, 'data-section-code'),
            collectionId: attr(el, 'data-collection-id')
          };
        }),
        events: readList('.events-wrapper', function (el) {
          return {
            id: attr(el, 'data-event-id'),
            title: attr(el, 'data-event-title'),
            label: attr(el, 'data-label'),
            date: attr(el, 'data-event-date'),
            customerId: attr(el, 'data-customer-id'),
            customerName: attr(el, 'data-customer-name'),
            group: attr(el, 'data-group'),
            type: attr(el, 'data-type')
          };
        }),
        articles: readList('.articles-wrapper', function (el) {
          return {
            id: attr(el, 'data-article-id'),
            title: attr(el, 'data-article-title'),
            slug: attr(el, 'data-article-slug'),
            categoryCode: attr(el, 'data-article-category-code'),
            category: attr(el, 'data-article-category'),
            customerId: attr(el, 'data-article-customer-id'),
            mnlsId: attr(el, 'data-mnls-id'),
            mnlsName: attr(el, 'data-mnls-name'),
            type: attr(el, 'data-type'),
            mainImageSrc: attr(el, 'data-article-main-image-src'),
            publishStatus: attr(el, 'data-publish-status')
          };
        }),
        slots: readList('.pubplan-slot-wrapper', function (el) {
          return {
            slotCode: attr(el, 'data-slot-code'),
            section: attr(el, 'data-section'),
            sectionId: attr(el, 'data-section-id'),
            sectionCode: attr(el, 'data-section-code'),
            catId: attr(el, 'data-cat-id'),
            catLabel: attr(el, 'data-cat-label'),
            pubplanId: attr(el, 'data-pubplan-id'),
            pubplanName: attr(el, 'data-pubplan-name'),
            pubplanDate: attr(el, 'data-pubplan-date'),
            titleAdminId: attr(el, 'data-titleadmin-id'),
            titleAdminName: attr(el, 'data-titleadmin-name')
          };
        })
      };
      return this._cache;
    },
    get: function (key) {
      if (!this._cache.customers) this._build();
      return this._cache[key] || [];
    },
    refresh: function () { return this._build(); }
  };
  IPP.sources = Sources;

  /* ─── Dropdown component ────────────────────────────────────
     One searchable panel, reused for every tile. open(button, opts):
       opts.source  : 'customers' | 'products' | 'events' | 'articles'
       opts.scope   : editState scope (e.g. 'ads-banners')
       opts.key     : editState key (unique per tile)
       opts.onPick  : (item) => {}  // optional, after selection
     The button MUST already be registered via IPP.registerDropdown so
     the pick persists + paints dirty. */
  var panel = null, panelState = null;

  function buildPanel() {
    if (panel) return panel;
    panel = document.createElement('div');
    panel.className = 'ipp-dd-panel';
    panel.setAttribute('role', 'listbox');
    panel.hidden = true;
    panel.innerHTML =
      '<div class="ipp-dd-search"><input type="text" class="ipp-dd-input" placeholder="Search…" aria-label="Search options"></div>' +
      '<div class="ipp-dd-list"></div>';
    document.body.appendChild(panel);

    var input = panel.querySelector('.ipp-dd-input');
    input.addEventListener('input', function () { renderList(input.value); });
    document.addEventListener('click', function (e) {
      if (!panel || panel.hidden) return;
      if (panel.contains(e.target)) return;
      if (panelState && panelState.button && panelState.button.contains(e.target)) return;
      closePanel();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });
    return panel;
  }

  function labelFor(source, item) {
    if (source === 'customers') return item.name || item.slug || item.id;
    if (source === 'products')  return item.name + (item.abbr ? ' · ' + item.abbr : '');
    if (source === 'events')    return item.title || item.label || item.id;
    if (source === 'articles')  return item.title || item.slug || item.id;
    return item.name || item.id;
  }
  function subFor(source, item) {
    if (source === 'customers') return [item.neighborhood, item.shortCode].filter(Boolean).join(' · ');
    if (source === 'products')  return item.group || item.contentType || '';
    if (source === 'events')    return item.date || item.group || '';
    if (source === 'articles')  return [item.category, item.publishStatus].filter(Boolean).join(' · ');
    return '';
  }

  function renderList(q) {
    if (!panelState) return;
    var items = IPP.sources.get(panelState.source);
    var src = panelState.source;
    var needle = (q || '').trim().toLowerCase();
    var listEl = panel.querySelector('.ipp-dd-list');
    listEl.innerHTML = '';

    // "Unassigned" clear option always first
    var clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'ipp-dd-opt ipp-dd-opt--clear';
    clear.textContent = 'Unassigned';
    clear.addEventListener('click', function () { pick({ id: '', name: 'Unassigned' }); });
    listEl.appendChild(clear);

    var shown = 0;
    items.forEach(function (item) {
      var label = labelFor(src, item);
      if (needle && label.toLowerCase().indexOf(needle) === -1) return;
      shown++;
      var opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'ipp-dd-opt';
      var sub = subFor(src, item);
      opt.innerHTML = '<span class="ipp-dd-opt-label"></span>' + (sub ? '<span class="ipp-dd-opt-sub"></span>' : '');
      opt.querySelector('.ipp-dd-opt-label').textContent = label;
      if (sub) opt.querySelector('.ipp-dd-opt-sub').textContent = sub;
      opt.addEventListener('click', function () { pick(item); });
      listEl.appendChild(opt);
    });

    if (!shown && needle) {
      var none = document.createElement('div');
      none.className = 'ipp-dd-empty';
      none.textContent = 'No matches';
      listEl.appendChild(none);
    }
    if (!items.length) {
      var em = document.createElement('div');
      em.className = 'ipp-dd-empty';
      em.textContent = 'No ' + src + ' available';
      listEl.appendChild(em);
    }
  }

  function pick(item) {
    if (!panelState) return;
    var ps = panelState;
    // Persist through editState — this is the canonical write path:
    // stores value + repaints label + flags dirty (gold border).
    IPP.editState.set(ps.scope, ps.key, item.name || 'Unassigned');
    // Stash the picked id on the tile for the (stubbed) save payload.
    if (ps.button) {
      ps.button.setAttribute('data-picked-id', item.id || '');
      ps.button.setAttribute('data-picked-name', item.name || '');
    }
    if (typeof ps.onPick === 'function') ps.onPick(item);
    closePanel();
  }

  function openPanel(button, opts) {
    buildPanel();
    panelState = {
      button: button, source: opts.source, scope: opts.scope,
      key: opts.key, onPick: opts.onPick
    };
    var r = button.getBoundingClientRect();
    panel.style.position = 'absolute';
    panel.style.top = (window.scrollY + r.bottom + 4) + 'px';
    panel.style.left = (window.scrollX + r.left) + 'px';
    panel.style.minWidth = Math.max(r.width, 240) + 'px';
    panel.hidden = false;
    var input = panel.querySelector('.ipp-dd-input');
    input.value = '';
    renderList('');
    setTimeout(function () { input.focus(); }, 0);
  }
  function closePanel() {
    if (panel) panel.hidden = true;
    panelState = null;
  }

  IPP.dropdown = { open: openPanel, close: closePanel };

  /* ─── Stubbed assign save ───────────────────────────────────
     Path 1: NO real write. Logs the intended payload + shows the
     standard SAVING…/toast feedback so the UX is real. Flip
     STUB_SAVE=false and fill ASSIGN_ROUTE when the contract lands. */
  var STUB_SAVE = true;
  var ASSIGN_ROUTE = null; // e.g. 'ba' | 'ev' | a single 'ipp' route — TBD by write contract

  IPP.assignSave = function (payload) {
    if (STUB_SAVE || !ASSIGN_ROUTE) {
      console.info('[ipp-dropdown] STUB assign-save (no write contract yet) →', payload);
      IPP.toast && IPP.toast('Selection held (save not wired yet)');
      return Promise.resolve({ ok: true, stub: true });
    }
    return IPP.post(ASSIGN_ROUTE, payload); // greeting's no-cors pattern
  };

  console.info('[ipp-dropdown] v1.0 ready · sources parsed · save STUBBED (Path 1)');
})();
