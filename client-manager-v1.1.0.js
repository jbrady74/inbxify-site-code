/* ============================================================
   client-manager-v1.1.0.js
   INBXIFY Client Manager — T-A Page Clients Tab
   
   Mounts into #client-manager-mount on the T-A template page.
   Reads customer data from .customers-wrapper hidden collection list.
   Field grouping config from window.TA_CONFIG.customerFieldGroups.
   
   Features:
     - Sortable columns (name, status, type, profile)
     - Filter pills by Client Status + Incomplete modifier toggle
     - Inline search
     - Edit modal: all CMS fields in tile groups, pencil-to-edit,
       gold dirty state, per-field cancel, Save / Save & Publish
     - Add Client modal: empty-state variant with create action
     - Console.log payloads (Make webhook wired in v1.1)
   
   v1.0.0 — initial build
   v1.0.1 — fix DOM selector, attribute map
   v1.0.2 — reference field dropdowns (categories, directories, archives)
   v1.0.17 — cmScrapeClient now: (1) sends REF_DATA.majors names as
             `categories` in the extract-client-worker POST so the AI
             majorCategory guess is constrained to an exact string
             match — resolved to an id via direct lookup, never fuzzy-
             matched, and never touches Minor/subcategory; (2) derives
             `neighborhood` client-side from the city token in
             cityStZip (no AI signal for this field exists). Pairs
             with extract-client-worker v1.1 (footer-safe text
             extraction + social-link regex fallback, so address/
             socials living in page footers survive truncation).
   v1.0.18 — (1) Major AND Minor category dropdowns were both silently
             capped by Webflow's 100-item DOM render ceiling (165 total
             categories today, growing). Fixed by fetching the full
             collection once, live, when Add/Edit modal opens
             (ensureLiveCategories → 112_IBX_getBusinessSubcategories,
             paginated Make-side past the cap), overwriting
             REF_DATA.majors/subs wholesale. Corrected a field-slug bug
             from the first draft of this fix: the parent relationship
             is the "Parent ID" field (parent-id), not a guessed
             "parent-category-bc" — that mismatch is why the first pass
             returned an incomplete/wrong subset. Both dropdowns show
             "Loading…" while the fetch is in flight; falls back to the
             DOM-capped list if TA_CONFIG.getSubcategoriesUrl isn't set
             or the fetch fails.
             (2) Logo picking now uploads client-side, immediately, via
             uploadcare.fileFrom('url', src) — logo-link holds a live
             ucarecdn.com URL (trimmed to content) before Create Client
             is ever clicked, not just after Make processes it on
             submit. Adds a Trimmed/Square variant picker once the
             upload finishes. Falls back to storing the raw scraped URL
             if Uploadcare's JS isn't loaded on the page.
   v1.1.0  — MODAL REORG (per add-client-reorg-mockup-v0_1, Jeff-locked).
             Wide modal (940px), 6-col grid with per-field spans (`w`
             on field defs), fields as label-over-input cards. New
             section order: Who (Name + Type + Expert Contributor +
             Status) → Reach them (address/contact promoted) → Logo
             (Link + Initials + Short Code, one row) → Directory
             placement (Hide/Featured moved here; Parent Name/ID auto)
             → Story (TXA 1–6 as six mini-inputs on one row) → Social →
             Default ads → System drawer (collapsed <details>: Slug,
             Publisher, Titles-Admin, Profile Status, Archive, Logo
             Image, Profile Page Image, Item ID). Titles-Admin now
             shows the T-A NAME — TA_NAME rejects 24-hex IDs and falls
             back to prettified titleSlug. Field slugs unchanged: edit
             state, scrape map, CREATE_KEY_MAP, TXA split unaffected.
   v1.0.22 — Auto-fill now derives Logo Initials (ASF rule: first
             letter of up to 3 words, uppercased) and Short Code
             (uppercase alphanumerics of name, first 4 chars) from the
             scraped name. Fill-only-if-empty prefills; operator can
             overtype. Short Code feeds utm_term advertiser click
             reporting per the Jan-2026 UTM design.
   v1.0.21 — TXA Services 1–6 auto-fill: the AI's comma-sep services
             list is split into the six TXA slots (first six entries)
             after scrape, filling only currently-empty slots so
             hand-entered values are never overwritten. (TXA 1–6 had
             never been AI-wired; only services-comma-separated was.)
   v1.0.20 — (1) Create success auto-redirects to /end-customers/{slug}
             after a 600ms success beat. Requires Scenario 111's
             Webhook Response to include "slug" (module 3's Slug
             output) in the customer object; degrades to the in-place
             success screen + console warning if absent. (2) adgen
             deep-link consumer: arriving on the T-A page with
             ?adgenCust={id}&adgenName={name} (from the end-customers
             page's Generate Ad button) stashes the customer on
             window.IX_ADGEN_PRESELECT + sessionStorage and clicks
             Studio's Generate tab once it renders. AdGen does not yet
             read the preselect — future AdGen patch.
   v1.0.19 — new filename (v18 was cached mid-revision at CDN; also
             honors the never-reuse-deployed-filenames rule). Category
             fetch now parses the corrected 112 response shape:
             { categories: [{id, name, parentId}] } — a flat array
             built by Text Aggregators in Make. The prior page1/page2
             design was structurally impossible: webflow:listItems
             emits one bundle PER ITEM, so raw item arrays never
             existed in the webhook response, and the un-aggregated
             scenario would have fired the response 100+ times per
             call. Logs loaded major/sub counts to console on success.
   v1.0.16 — Create wired to Make + async feedback. cmDoCreate no
             longer console.logs and tears down the modal. It now maps
             internal slugs to the 111_IBX_createEditCustomer webhook's
             camelCase contract, POSTs JSON to CFG.webhookUrl
             (clientManagerWebhook), and runs a state machine: button
             disables + spinner + "Adding…" while creating; on the
             Make {ok:true,customer} response shows a "Client
             Successfully Added" card with a Done button; on failure
             shows an inline error and leaves the modal open to retry.
             Modal never disappears mid-flight. Validation moved off
             alert() to inline error. New client is pushed to the list
             and appears when the card is dismissed.
   v1.0.15 — portal query fix (regression from v1.0.14). v1.0.14 moved
             the modal into #cm-modal-portal but several handlers still
             ran mount.querySelector() for modal elements — and the
             modal is no longer in mount. Symptom: Auto-fill always said
             "Enter a website URL first" because it read the (missing)
             input from mount, got null, and fell back to empty state.
             Same breakage affected scroll-restore, dirty-dot updates,
             and footer save-button enable/disable. All modal queries
             now target portal; the list search (.cm-sr) stays on mount.
   v1.0.14 — modal portal (real z-index fix). v1.0.13 raised the
             overlay z-index and suppressed the active tab, but the
             page MASTHEAD then bled through — because the modal was
             rendered inside #client-manager-mount, trapped in the
             page's stacking contexts (tabs, .publisher-wrapper), so
             no z-index could win. v1.0.14 renders the modal into a
             #cm-modal-portal node appended directly to <body>, out of
             the page stacking soup entirely. Nothing on the page can
             bleed through now. The v1.0.13 tab-suppression CSS and
             body.cm-modal-open flag were removed as no longer needed.
             List still renders into #client-manager-mount; page mount
             is cleared while the modal is open and repainted on close.
   v1.0.12 — AI URL scrape on Add Client. A URL bar appears at the top
             of the Add modal only. Operator pastes the client's
             website; POST { url } to the extract-client Worker
             (CFG.extractClientUrl). Returned fields are written into
             M.edit and the modal re-renders — populated fields paint
             gold/dirty via existing logic, ready for review + Create.
             Returned candidate images render as a logo picker; clicking
             one sets logo-link. Nothing auto-commits. Text + logo only;
             other-image (vision) selection is a later phase.
             Mirrors the extract-event precedent.
            publisher/titles-admin read-only
            major→sub cascading category dropdown
            auto-fill parent-category-name/id from major selection
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // ── Config ──
  var CFG = {
    get mountId()    { return 'client-manager-mount'; },
    get webhookUrl() { return window.TA_CONFIG?.clientManagerWebhook || ''; },
    get titleSlug()  { return window.TA_CONFIG?.titleSlug || ''; },
    get taItemId()   { return window.TA_CONFIG?.taItemId || ''; },
    get extractClientUrl() { return window.TA_CONFIG?.extractClientUrl || ''; },
    get subcatUrl() { return window.TA_CONFIG?.getSubcategoriesUrl || ''; }
  };

  var mount = document.getElementById(CFG.mountId);
  if (!mount) { console.warn('[CLIENT MGR] No #' + CFG.mountId + ' found'); return; }

  // v1.0.14: modal portal. The list renders into #client-manager-mount
  // (buried in the page DOM, inside tab/wrapper stacking contexts).
  // The modal renders into a node appended directly to <body> so its
  // z-index actually beats every page element (masthead, tabs, etc.).
  // Patching individual offenders (v1.0.13) was whack-a-mole; portaling
  // out of the page stacking soup fixes the whole class of bug.
  var portal = document.getElementById('cm-modal-portal');
  if (!portal) {
    portal = document.createElement('div');
    portal.id = 'cm-modal-portal';
    document.body.appendChild(portal);
  }

  // ── Default field groups ──
  // v1.1.0 reorg (per add-client-reorg-mockup-v0_1): priority-ordered
  // sections, 6-col grid (`w` = column span, default 6/full), System
  // group renders as a collapsed drawer. Field slugs unchanged — edit
  // state, scrape map, CREATE_KEY_MAP, TXA split all keep working.
  var DEFAULT_GROUPS = [
    { id: 'who', label: 'Who', fields: [
      { s: 'name', l: 'Customer Name', t: 'text', w: 3 },
      { s: 'customer-type', l: 'Customer Type', t: 'option', opts: ['Advertiser', 'Contributor', 'Sponsor', 'Vendor'], w: 3 },
      { s: 'expert-contributor', l: 'Expert Contributor', t: 'switch', w: 3 },
      { s: 'client-status', l: 'Client Status', t: 'option', opts: ['Active', 'Paused', 'Prospect', 'Inactive'], w: 3 }
    ]},
    { id: 'reach', label: 'Reach them', fields: [
      { s: 'address', l: 'Address', t: 'text', w: 3 },
      { s: 'address-2', l: 'Address 2', t: 'text', w: 3 },
      { s: 'city-st-zip', l: 'City, ST Zip', t: 'text', w: 3 },
      { s: 'neighborhood', l: 'Neighborhood', t: 'text', w: 3 },
      { s: 'business-website', l: 'Business Website', t: 'link', w: 2 },
      { s: 'business-phone', l: 'Business Phone', t: 'phone', w: 2 },
      { s: 'business-email', l: 'Business Email', t: 'email', w: 2 }
    ]},
    { id: 'logo', label: 'Logo', fields: [
      { s: 'logo-link', l: 'Logo Link (ULC)', t: 'link', w: 4 },
      { s: 'logo-initials', l: 'Logo Initials', t: 'text', w: 1 },
      { s: 'customer-short-code', l: 'Short Code', t: 'text', w: 1 }
    ]},
    { id: 'directory', label: 'Directory placement', fields: [
      { s: 'major-category', l: 'Major Category', t: 'ref-select', src: 'majors', w: 3 },
      { s: 'business-category', l: 'Business Category', t: 'ref-cascade', src: 'subs', parentField: 'major-category', w: 3 },
      { s: 'directories', l: 'Directories', t: 'ref-select', src: 'directories', w: 3 },
      { s: 'directory-tags', l: 'Directory Tags', t: 'text', w: 3 },
      { s: 'hide-from-directory', l: 'Hide from Directory', t: 'switch', w: 3 },
      { s: 'featured-listing', l: 'Featured Listing', t: 'switch', w: 3 },
      { s: 'filtering-categories', l: 'Filtering Categories', t: 'text', w: 2 },
      { s: 'parent-category-name', l: 'Parent Category Name', t: 'auto', from: 'major-category', prop: 'name', w: 2 },
      { s: 'parent-category-id', l: 'Parent Category ID', t: 'auto', from: 'major-category', prop: 'id', w: 2 }
    ]},
    { id: 'story', label: 'Story', fields: [
      { s: 'tagline', l: 'Tagline', t: 'text', w: 6 },
      { s: 'long-description', l: 'Long Description', t: 'textarea', w: 6 },
      { s: 'services', l: 'Services (comma-sep)', t: 'text', w: 6 },
      { s: 'txa-services-1', l: 'TXA 1', t: 'text', w: 1 },
      { s: 'txa-services-2', l: 'TXA 2', t: 'text', w: 1 },
      { s: 'txa-services-3', l: 'TXA 3', t: 'text', w: 1 },
      { s: 'txa-services-4', l: 'TXA 4', t: 'text', w: 1 },
      { s: 'txa-services-5', l: 'TXA 5', t: 'text', w: 1 },
      { s: 'txa-services-6', l: 'TXA 6', t: 'text', w: 1 }
    ]},
    { id: 'social', label: 'Social', fields: [
      { s: 'facebook', l: 'Facebook', t: 'link', w: 2 },
      { s: 'instagram', l: 'Instagram', t: 'link', w: 2 },
      { s: 'tiktok', l: 'TikTok', t: 'link', w: 2 },
      { s: 'youtube', l: 'YouTube', t: 'link', w: 2 },
      { s: 'linkedin', l: 'LinkedIn', t: 'link', w: 2 },
      { s: 'x', l: 'X', t: 'link', w: 2 },
      { s: 'pinterest', l: 'Pinterest', t: 'link', w: 2 },
      { s: 'houzz', l: 'Houzz', t: 'link', w: 2 }
    ]},
    { id: 'ads', label: 'Default ads', fields: [
      { s: 'default-art-ad-get', l: 'Default ART AD', t: 'link', w: 3 },
      { s: 'default-sponsorship-ad-link-ulc', l: 'Default Sponsorship AD', t: 'link', w: 3 }
    ]},
    { id: 'system', label: 'System & auto-managed', drawer: true, fields: [
      { s: 'slug', l: 'Slug', t: 'readonly', w: 2 },
      { s: 'publisher', l: 'Publisher', t: 'readonly', w: 2 },
      { s: 'titles-admin', l: 'Titles-Admin', t: 'readonly', w: 2 },
      { s: 'profile-status', l: 'Profile Status', t: 'option', opts: ['Complete', 'Incomplete', 'New'], w: 2 },
      { s: 'archive-assignment', l: 'Newsletter Archive', t: 'ref-select', src: 'archives', w: 2 },
      { s: 'logo-image', l: 'Logo Image', t: 'upload', w: 2 },
      { s: 'profile-page-image', l: 'Profile Page Image', t: 'upload', w: 2 },
      { s: 'self-this-item-id', l: '(Self) This Item ID', t: 'text', w: 2 }
    ]}
  ];

  var GROUPS = window.TA_CONFIG?.customerFieldGroups || DEFAULT_GROUPS;

  // Build flat field list for total count
  var ALL_FIELDS = [];
  GROUPS.forEach(function (g) { g.fields.forEach(function (f) { ALL_FIELDS.push(f); }); });
  var TOTAL_FIELDS = ALL_FIELDS.length;

  // ── Read DOM data ──
  // Each .customers-wrapper div IS a customer item with data-* attributes
  var ATTR_MAP = {
    'name': 'name',
    'slug': 'slug',
    'customer-short-code': 'shortCode',
    'logo-initials': 'logoInitials',
    'logo-image': 'logoLink',
    'logo-link': 'logoLink',
    'customer-type': 'customerType',
    'client-status': 'clientStatus',
    'profile-status': 'profileStatus',
    'business-phone': 'phone',
    'business-email': 'email',
    'business-website': 'website',
    'facebook': 'facebook',
    'instagram': 'instagram',
    'tiktok': 'tiktok',
    'youtube': 'youtube',
    'linkedin': 'linkedin',
    'x': 'xTwitter',
    'pinterest': 'pinterest',
    'houzz': 'houzz',
    'default-art-ad-get': 'paidAdUrl',
    'default-sponsorship-ad-link-ulc': 'sponsorshipAd',
    'business-category': 'categoryId',
    'publisher': 'publisherName',
    'publisher-id': 'publisherId',
    'address': 'address',
    'address-2': 'address-2',
    'city-st-zip': 'cityStZip',
    'neighborhood': 'neighborhood',
    'tagline': 'tagline',
    'long-description': 'longDescription',
    'services': 'services',
    'txa-services-1': 'txa-1',
    'txa-services-2': 'txa-2',
    'txa-services-3': 'txa-3',
    'txa-services-4': 'txa-4',
    'txa-services-5': 'txa-5',
    'txa-services-6': 'txa-6',
    'self-this-item-id': 'id'
  };

  // T-A name from DOM (same elements PubPlan reads).
  // v1.1.0: on some pages data-ta carries the record ID, not the name —
  // reject 24-hex values and fall back to the prettified titleSlug
  // ('wyckoff-living-now' → 'Wyckoff Living Now'). Tenant-safe.
  var TA_NAME = document.querySelector('#title-admin-id')?.getAttribute('data-ta')
    || document.querySelector('.ta-wrapper')?.dataset?.titleName
    || '';
  if (!TA_NAME || /^[0-9a-f]{24}$/i.test(TA_NAME)) {
    var slugSrc = (window.TA_CONFIG && window.TA_CONFIG.titleSlug) || '';
    if (slugSrc) {
      TA_NAME = slugSrc.split('-').map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      }).join(' ');
    }
  }

  // Publisher name from first customer item's data-publisher-name
  var firstCustEl = document.querySelector('.customers-wrapper');
  var PUBLISHER_NAME = firstCustEl?.dataset?.publisherName || '';
  var PUBLISHER_ID = firstCustEl?.dataset?.publisherId || '';

  var CUSTOMERS = [];
  document.querySelectorAll('.customers-wrapper').forEach(function (el) {
    var d = el.dataset;
    if (!d.id) return;
    var rec = { id: d.id };
    ALL_FIELDS.forEach(function (f) {
      var key = f.s;
      // T-A is page-level, not per-customer
      if (key === 'titles-admin') { rec[key] = TA_NAME; return; }
      // Handle hyphenated dataset keys that don't auto-camelCase
      var attrName = ATTR_MAP[key] || camelCase(key);
      var attr;
      if (attrName.indexOf('-') > -1) {
        // Hyphenated keys need bracket access on dataset
        attr = el.getAttribute('data-' + attrName);
      } else {
        attr = d[attrName];
      }
      if (f.t === 'switch') {
        rec[key] = attr === 'true' || attr === '1';
      } else {
        rec[key] = attr || '';
      }
    });
    CUSTOMERS.push(rec);
  });

  // ── Read reference data from DOM ──
  var REF_DATA = { majors: [], subs: [], directories: [], archives: [] };

  // Categories: majors have no parentId, subs have parentId
  document.querySelectorAll('.client-category-wrapper').forEach(function (el) {
    var d = el.dataset;
    if (!d.id) return;
    var item = { id: d.id, name: d.name || '', parentId: d.parentId || '' };
    if (item.parentId) {
      REF_DATA.subs.push(item);
    } else {
      REF_DATA.majors.push(item);
    }
  });
  REF_DATA.majors.sort(function (a, b) { return a.name.localeCompare(b.name); });
  REF_DATA.subs.sort(function (a, b) { return a.name.localeCompare(b.name); });

  // Directories
  document.querySelectorAll('.directory-wrapper').forEach(function (el) {
    var d = el.dataset;
    if (!d.id) return;
    REF_DATA.directories.push({ id: d.id, name: d.name || '' });
  });

  // Archives
  document.querySelectorAll('.archives-wrapper').forEach(function (el) {
    var d = el.dataset;
    if (!d.id) return;
    REF_DATA.archives.push({ id: d.id, name: d.name || '', slug: d.slug || '' });
  });

  // Lookup helpers
  function refName(src, id) {
    var list = REF_DATA[src] || [];
    var item = list.find(function (x) { return x.id === id; });
    return item ? item.name : '';
  }
  function subsForMajor(majorId) {
    return REF_DATA.subs.filter(function (s) { return s.parentId === majorId; });
  }

  // v1.0.18: the DOM's client-category-source list is capped at Webflow's
  // 100-item render ceiling, and with 20 majors + 145 (growing) subs, most
  // categories never make it into REF_DATA at all — this hits BOTH the
  // Major dropdown and the Minor cascade, not just Minor. Fix: fetch the
  // full collection once (live, paginated Make-side past the 100-item cap)
  // when a modal opens, and overwrite REF_DATA.majors/subs wholesale from
  // that response. One fetch covers both dropdowns — the
  // 112_IBX_getBusinessSubcategories webhook already returns the whole
  // collection regardless of what majorId is posted, so there's no need
  // for a separate per-major call; simpler and it can't return a partial
  // subset because there's no per-major filtering happening in Make.
  //
  // CORRECTION from the first pass: the parent relationship used to filter
  // subs from majors is the "Parent ID" field (data-parent-id in the DOM,
  // confirmed against a real CMS record), NOT a "parent-category-bc"
  // reference field — that was an unverified guess in the prior version
  // and is almost certainly why subcategory results came back incomplete.
  var CATEGORIES_LIVE = false;
  var CATEGORIES_LOADING = false;

  function ensureLiveCategories() {
    if (CATEGORIES_LIVE || CATEGORIES_LOADING) return;
    if (!CFG.subcatUrl) {
      console.warn('[CLIENT MGR] Category endpoint not configured (TA_CONFIG.getSubcategoriesUrl) — Major/Minor dropdowns stay on the DOM-capped list.');
      return;
    }
    CATEGORIES_LOADING = true;
    if (MODAL) renderModal(); // shows "Loading categories…" in both dropdowns

    fetch(CFG.subcatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
      .then(function (res) { return res.json().catch(function () { throw new Error('Bad response'); }); })
      .then(function (data) {
        if (!data || !data.ok) throw new Error((data && data.error) || 'Category fetch failed');
        // v1.0.19: scenario 112 now returns a flat pre-shaped array —
        // { categories: [{id, name, parentId}, ...] } — built by Text
        // Aggregators in Make (List Items outputs one bundle per item, so
        // the raw page1/page2 arrays of the earlier design never actually
        // existed in Make's response). Empty parentId = Major.
        var cats = data.categories || [];
        var majors = [];
        var subs = [];
        cats.forEach(function (it) {
          if (!it || !it.id) return;
          var item = { id: it.id, name: it.name || '', parentId: it.parentId || '' };
          if (item.parentId) subs.push(item); else majors.push(item);
        });
        majors.sort(function (a, b) { return a.name.localeCompare(b.name); });
        subs.sort(function (a, b) { return a.name.localeCompare(b.name); });
        REF_DATA.majors = majors;
        REF_DATA.subs = subs;
        CATEGORIES_LIVE = true;
        console.log('[CLIENT MGR] Live categories loaded: ' + majors.length + ' majors, ' + subs.length + ' subs');
      })
      .catch(function (err) {
        console.warn('[CLIENT MGR] Category fetch failed, staying on DOM-capped list:', err && err.message);
      })
      .finally(function () {
        CATEGORIES_LOADING = false;
        if (MODAL) renderModal();
      });
  }

  // Derive major-category from business-category for each customer
  CUSTOMERS.forEach(function (c) {
    var subId = c['business-category'];
    if (subId && !c['major-category']) {
      var sub = REF_DATA.subs.find(function (s) { return s.id === subId; });
      if (sub && sub.parentId) {
        c['major-category'] = sub.parentId;
        var major = REF_DATA.majors.find(function (m) { return m.id === sub.parentId; });
        if (major) {
          c['parent-category-name'] = major.name;
          c['parent-category-id'] = major.id;
        }
      }
    }
  });

  // ── State ──
  var FILTER = 'all';
  var SEARCH = '';
  var SORT_COL = 'name';
  var SORT_DIR = 1;
  var MOD_INCOMPLETE = false;
  var SELECTED = {};
  var MODAL = null;       // { mode:'edit'|'add', custId:string, orig:{}, edit:{}, editing:{} }

  // ── Utilities ──
  function camelCase(s) {
    return s.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); });
  }
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function truncUrl(u) {
    var p = String(u).replace(/^https?:\/\//, '');
    return p.length > 32 ? p.substring(0, 29) + '...' : p;
  }
  function initials(name) {
    return String(name).split(/\s+/).map(function (w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
  }
  function filledCount(rec) {
    var n = 0;
    ALL_FIELDS.forEach(function (f) {
      var v = rec[f.s];
      if (v !== '' && v !== false && v !== undefined && v !== null) n++;
    });
    return n;
  }
  function profileStatus(rec) {
    var ps = rec['profile-status'] || rec['client-status'] || '';
    return ps.toLowerCase();
  }
  function statusOrder(s) { return s === 'active' ? 0 : s === 'paused' ? 1 : s === 'prospect' ? 2 : s === 'inactive' ? 3 : 4; }
  function typeOrder(s) { var v = String(s).toLowerCase(); return v === 'advertiser' ? 0 : v === 'sponsor' ? 1 : v === 'contributor' ? 2 : 3; }
  function profOrder(s) { return s === 'complete' ? 0 : 1; }

  var AVATAR_COLORS = ['#2d6a4f', '#6b2fa0', '#1a5276', '#8a6400', '#7a3b1e', '#1a5e8a', '#c07010', '#993556', '#5f5e5a', '#639922'];
  function avatarColor(id) {
    var n = 0; for (var i = 0; i < id.length; i++) n += id.charCodeAt(i);
    return AVATAR_COLORS[n % AVATAR_COLORS.length];
  }

  // ── Filtering & sorting ──
  function getVisible() {
    var list = CUSTOMERS.filter(function (c) {
      if (SEARCH && c.name.toLowerCase().indexOf(SEARCH.toLowerCase()) < 0) return false;
      var st = (c['client-status'] || '').toLowerCase();
      if (FILTER === 'active' && st !== 'active') return false;
      if (FILTER === 'prospect' && st !== 'prospect') return false;
      if (FILTER === 'paused' && st !== 'paused') return false;
      if (FILTER === 'inactive' && st !== 'inactive') return false;
      if (MOD_INCOMPLETE) {
        var ps = (c['profile-status'] || '').toLowerCase();
        if (ps !== 'incomplete' && ps !== 'new' && ps !== '') return true; // show if NOT complete
        if (ps === 'complete') return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      var va, vb;
      if (SORT_COL === 'name') {
        va = a.name.toLowerCase(); vb = b.name.toLowerCase();
        return va < vb ? -SORT_DIR : va > vb ? SORT_DIR : 0;
      }
      if (SORT_COL === 'status') {
        va = statusOrder((a['client-status'] || '').toLowerCase());
        vb = statusOrder((b['client-status'] || '').toLowerCase());
        return (va - vb) * SORT_DIR || (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
      }
      if (SORT_COL === 'type') {
        va = typeOrder(a['customer-type']); vb = typeOrder(b['customer-type']);
        return (va - vb) * SORT_DIR || (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
      }
      if (SORT_COL === 'profile') {
        va = profOrder((a['profile-status'] || '').toLowerCase());
        vb = profOrder((b['profile-status'] || '').toLowerCase());
        return (va - vb) * SORT_DIR || (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
      }
      return 0;
    });
    return list;
  }

  function incompleteCount() {
    return CUSTOMERS.filter(function (c) {
      var st = (c['client-status'] || '').toLowerCase();
      if (FILTER === 'active' && st !== 'active') return false;
      if (FILTER === 'prospect' && st !== 'prospect') return false;
      if (FILTER === 'paused' && st !== 'paused') return false;
      if (FILTER === 'inactive' && st !== 'inactive') return false;
      var ps = (c['profile-status'] || '').toLowerCase();
      return ps !== 'complete';
    }).length;
  }

  function selCount() {
    var n = 0; for (var k in SELECTED) if (SELECTED[k]) n++; return n;
  }

  // ── Inject CSS ──
  var style = document.createElement('style');
  style.textContent = getCss();
  document.head.appendChild(style);

  // ── Render ──
  function render() {
    // v1.0.14: modal renders into the body-level portal; list renders
    // into the page mount. When no modal is open, clear the portal.
    if (MODAL) { renderModal(); return; }
    portal.innerHTML = '';
    var vis = getVisible();
    var counts = countByStatus();
    var ic = incompleteCount();
    var sc = selCount();

    var h = '';

    // Header
    h += '<div class="cm-hdr"><div class="cm-hdr-l">';
    h += '<div class="cm-ic">&#x1F465;</div>';
    h += '<div><div class="cm-ti">Clients</div>';
    h += '<div class="cm-su">ADVERTISERS &middot; CONTRIBUTORS &middot; SPONSORS</div></div>';
    h += '</div>';
    h += '<button class="cm-add-btn" onclick="cmAddClient()">+ Add Client</button>';
    h += '</div>';

    // Filter pills
    h += '<div class="cm-tb">';
    h += pill('all', 'All ' + CUSTOMERS.length, FILTER === 'all', 'on');
    h += pill('active', 'Active ' + counts.active, FILTER === 'active', 'gn');
    h += pill('prospect', 'Prospect ' + counts.prospect, FILTER === 'prospect', 'bl');
    h += pill('paused', 'Paused ' + counts.paused, FILTER === 'paused', 'am');
    h += pill('inactive', 'Inactive ' + counts.inactive, FILTER === 'inactive', 'rd');
    h += '<div class="cm-sp"></div>';
    h += '<input class="cm-sr" type="text" placeholder="Search\u2026" value="' + esc(SEARCH) + '" oninput="cmSearch(this.value)">';
    h += '</div>';

    // Modifier row
    h += '<div class="cm-mr"><label class="cm-mt' + (MOD_INCOMPLETE ? ' ac' : '') + '" onclick="cmToggleMod()">';
    h += '<input type="checkbox" class="cm-mc" ' + (MOD_INCOMPLETE ? 'checked' : '') + ' onclick="event.stopPropagation();cmToggleMod()">';
    h += '<span class="cm-ml">Incomplete profiles only</span>';
    h += '<span class="cm-mn">' + ic + '</span></label></div>';

    // Table
    h += '<div class="cm-tw"><table class="cm-tbl"><thead><tr>';
    h += sortTh('name', 'Client name');
    h += sortTh('status', 'Status', '95px');
    h += sortTh('type', 'Type', '140px');
    h += sortTh('profile', 'Profile', '140px');
    h += '<th class="cm-c5"></th>';
    h += '</tr></thead><tbody>';

    if (!vis.length) {
      h += '<tr class="cm-er"><td colspan="5">No clients match</td></tr>';
    } else {
      vis.forEach(function (c) {
        var st = (c['client-status'] || '').toLowerCase();
        var tp = (c['customer-type'] || '').toLowerCase();
        var ps = (c['profile-status'] || '').toLowerCase();
        var fc = filledCount(c);
        var pct = Math.round(fc / TOTAL_FIELDS * 100);
        var stCls = st === 'active' ? 'sa' : st === 'paused' ? 'sps' : st === 'prospect' ? 'spr' : 'si';
        var tpCls = tp === 'advertiser' ? 'ta2' : tp === 'sponsor' ? 'ts2' : 'tc2';
        var pfDot = ps === 'complete' ? 'do' : 'dw';
        var pfLbl = ps === 'complete' ? 'Complete' : ps || 'Incomplete';

        h += '<tr onclick="cmEdit(\'' + c.id + '\')" style="cursor:pointer">';
        h += '<td><div class="cm-cn">' + esc(c.name) + '</div>';
        h += '<div class="cm-cc">' + esc(c['business-category'] || c['major-category'] || c['customer-type'] || '') + ' &middot; ' + fc + '/' + TOTAL_FIELDS + ' (' + pct + '%)</div></td>';
        h += '<td><span class="cm-pill ' + stCls + '">' + esc(st || 'none') + '</span></td>';
        h += '<td><span class="cm-pill ' + tpCls + '">' + esc(tp || 'none') + '</span></td>';
        h += '<td><span class="cm-pd"><span class="cm-dt ' + pfDot + '"></span>' + esc(pfLbl) + '</span></td>';
        h += '<td><button class="cm-eb" onclick="event.stopPropagation();cmEdit(\'' + c.id + '\')">Open</button></td>';
        h += '</tr>';
      });
    }

    h += '</tbody></table></div>';
    mount.innerHTML = h;
  }

  function pill(key, label, active, cls) {
    return '<button class="cm-fp' + (active ? ' ' + cls : '') + '" onclick="cmSetFilter(\'' + key + '\')">' + label + '</button>';
  }

  function sortTh(col, label, w) {
    var isSorted = SORT_COL === col;
    var arrow = isSorted ? (SORT_DIR === 1 ? '\u25B2' : '\u25BC') : '\u25B2';
    var cls = isSorted ? ' cm-so' : '';
    var style = w ? ' style="width:' + w + '"' : '';
    return '<th class="cm-th' + cls + '"' + style + ' onclick="cmSort(\'' + col + '\')">' + label + ' <span class="cm-ar">' + arrow + '</span></th>';
  }

  function countByStatus() {
    var r = { active: 0, prospect: 0, paused: 0, inactive: 0 };
    CUSTOMERS.forEach(function (c) {
      var st = (c['client-status'] || '').toLowerCase();
      if (r[st] !== undefined) r[st]++;
    });
    return r;
  }

  // ── Modal rendering ──
  function renderModal() {
    var M = MODAL;
    var isAdd = M.mode === 'add';
    var fc = 0;
    var dc = 0;
    ALL_FIELDS.forEach(function (f) {
      var v = M.edit[f.s];
      if (v !== '' && v !== false && v !== undefined && v !== null) fc++;
      if (M.edit[f.s] !== M.orig[f.s]) dc++;
    });
    var pct = Math.round(fc / TOTAL_FIELDS * 100);
    var ini = isAdd ? '+' : initials(M.edit.name || '??');
    var nameDisplay = isAdd ? 'New Client' : esc(M.edit.name || 'Unnamed');
    var subLine = isAdd ? 'Fill in required fields to create' : esc((M.edit['customer-type'] || '') + ' \u00B7 ' + (M.edit['client-status'] || '') + ' \u00B7 ' + fc + '/' + TOTAL_FIELDS + ' (' + pct + '%)');

    var h = '<div class="cm-ov"><div class="cm-mo">';

    // Modal header
    h += '<div class="cm-mh"><div class="cm-mh-l">';
    h += '<div class="cm-mh-av" style="background:' + (isAdd ? '#c4a35a' : avatarColor(M.custId)) + '">' + ini + '</div>';
    h += '<div><div class="cm-mh-n">' + nameDisplay + '</div>';
    h += '<div class="cm-mh-s">' + subLine + '</div></div>';
    h += '</div>';
    h += '<button class="cm-mx" onclick="cmCloseModal()">\u2715 close</button></div>';

    // ── v1.0.12: AI URL scrape bar (Add mode only) ──
    if (isAdd && CFG.extractClientUrl) {
      var scrapeState = M.scrapeState || 'idle';  // idle | loading | done | error
      h += '<div class="cm-scrape">';
      h += '<div class="cm-scrape-row">';
      h += '<span class="cm-scrape-ic">\u2728</span>';
      h += '<input type="url" class="cm-scrape-in" id="cm-scrape-url" placeholder="Paste the client\'s website URL to auto-fill\u2026" ' +
           'value="' + esc(M.scrapeUrl || '') + '"' + (scrapeState === 'loading' ? ' disabled' : '') +
           ' onkeydown="if(event.key===\'Enter\'){event.preventDefault();cmScrapeClient();}">';
      h += '<button class="cm-scrape-btn"' + (scrapeState === 'loading' ? ' disabled' : '') +
           ' onclick="cmScrapeClient()">' +
           (scrapeState === 'loading' ? '<span class="cm-spin"></span> Reading\u2026' : 'Auto-fill') + '</button>';
      h += '</div>';
      if (scrapeState === 'error' && M.scrapeError) {
        h += '<div class="cm-scrape-msg cm-scrape-err">' + esc(M.scrapeError) + '</div>';
      } else if (scrapeState === 'done') {
        h += '<div class="cm-scrape-msg cm-scrape-ok">Fields filled below \u2014 review the gold-bordered fields, edit anything, then Create Client.</div>';
      } else {
        h += '<div class="cm-scrape-msg cm-scrape-hint">We\u2019ll read the page and fill what we find. Nothing is saved until you click Create.</div>';
      }
      // Logo candidate picker — v1.0.18: picking a candidate now uploads it
      // to Uploadcare immediately (client-side, via uploadcare.fileFrom),
      // trims it to content, and offers a square crop variant — all before
      // Create Client is ever clicked. logo-link holds a live ucarecdn.com
      // URL by the time you submit, not the original site's raw image URL.
      if (M.scrapeImages && M.scrapeImages.length) {
        var lu = M.logoUpload;
        h += '<div class="cm-logo-pick"><div class="cm-logo-pick-lbl">Pick a logo (uploads to ULC, trims to content):</div><div class="cm-logo-strip">';
        M.scrapeImages.forEach(function (src, i) {
          var isPicked = M.logoPickedIndex === i;
          var sel = (isPicked && lu && lu.state === 'done') ? ' cm-logo-sel' : '';
          var busy = (isPicked && lu && lu.state === 'uploading');
          var errored = (isPicked && lu && lu.state === 'error');
          h += '<button class="cm-logo-thumb' + sel + (busy ? ' cm-logo-busy' : '') + (errored ? ' cm-logo-err' : '') +
               '" title="' + esc(src) + (errored ? ' — click to retry' : '') + '" onclick="cmPickLogo(' + i + ')">' +
               '<img src="' + esc(src) + '" alt="logo candidate ' + (i + 1) + '" loading="lazy" ' +
               'onerror="this.closest(\'.cm-logo-thumb\').style.display=\'none\'">' +
               (busy ? '<span class="cm-logo-spin">\u2026</span>' : '') +
               (errored ? '<span class="cm-logo-x">!</span>' : '') +
               '</button>';
        });
        h += '</div>';
        if (lu && lu.state === 'error') {
          h += '<div class="cm-logo-errmsg">Upload failed: ' + esc(lu.error || 'unknown error') + ' \u2014 click the thumbnail to retry.</div>';
        }
        if (lu && lu.state === 'done') {
          h += '<div class="cm-logo-variants"><div class="cm-logo-pick-lbl">Use:</div>';
          h += '<button class="cm-logo-vbtn' + (lu.selected === 'trim' ? ' cm-logo-vsel' : '') + '" onclick="cmSelectLogoVariant(\'trim\')">' +
               '<img src="' + esc(lu.variants.trim) + '" alt="trimmed logo"><span>Trimmed</span></button>';
          h += '<button class="cm-logo-vbtn' + (lu.selected === 'square' ? ' cm-logo-vsel' : '') + '" onclick="cmSelectLogoVariant(\'square\')">' +
               '<img src="' + esc(lu.variants.square) + '" alt="square logo"><span>Square</span></button>';
          h += '</div>';
        }
        h += '</div>';
      }
      h += '</div>';
    }

    // v1.0.16: Create success card — replaces the form body once Make
    // confirms. Modal stays mounted; user dismisses with Done.
    if (isAdd && M.createState === 'done') {
      h += '<div class="cm-mb"><div class="cm-success">';
      h += '<div class="cm-success-ic">\u2713</div>';
      h += '<div class="cm-success-t">Client Successfully Added</div>';
      h += '<div class="cm-success-s">' + esc(M.createName || M.edit.name || 'New client') + ' was created' + (M.createPublished ? ' and published' : '') + '.</div>';
      h += '<button class="cm-success-btn" onclick="cmCloseModal()">Done</button>';
      h += '</div></div>';
      h += '</div></div>';
      portal.innerHTML = h;
      mount.innerHTML = '';
      return;
    }

    // Modal body
    h += '<div class="cm-mb">';

    // v1.0.16: inline create error (modal stays; user can retry)
    if (isAdd && M.createState === 'error' && M.createError) {
      h += '<div class="cm-create-err">' + esc(M.createError) + '</div>';
    }

    GROUPS.forEach(function (g) {
      var gf = g.fields.length;
      var gfilled = g.fields.filter(function (f) {
        var v = M.edit[f.s]; return v !== '' && v !== false && v !== undefined && v !== null;
      }).length;

      // v1.1.0: drawer groups render collapsed (System & auto-managed)
      if (g.drawer) {
        h += '<details class="cm-drawer"><summary class="cm-drawer-s">' + g.label +
             ' <span class="cm-gh-c">' + gfilled + '/' + gf + '</span></summary>';
      } else {
        h += '<div class="cm-gp"><div class="cm-gh">';
        h += '<span class="cm-gh-t">' + g.label + '</span>';
        h += '<span class="cm-gh-c">' + gfilled + '/' + gf + '</span></div>';
      }
      h += '<div class="cm-gr">';

      g.fields.forEach(function (f) {
        var spanClass = ' cm-w' + (f.w || 6);
        var val = M.edit[f.s];
        var origVal = M.orig[f.s];
        var hasVal = val !== '' && val !== false && val !== undefined && val !== null;
        var isDirty = val !== origVal;
        // In Add mode, all editable fields start open
        var isEditing = isAdd ? true : (M.editing[f.s] || false);
        var dot = hasVal ? 'cm-gi-ok' : 'cm-gi-mt';

        // Readonly fields — no pencil, no editing (even in Add mode for slug)
        if (f.t === 'readonly') {
          h += '<div class="cm-gi' + spanClass + '">';
          h += '<div class="cm-gi-d ' + dot + '"></div>';
          h += '<span class="cm-gi-l">' + f.l + '</span>';
          h += '<div class="cm-gi-v">' + (hasVal ? esc(String(val)) : '<span class="cm-empty">—</span>') + '</div>';
          h += '<div class="cm-gi-act"><span class="cm-lock">&#x1F512;</span></div>';
          h += '</div>';
          return;
        }

        // Auto-filled fields — read-only, derived from another field
        if (f.t === 'auto') {
          var sourceVal = M.edit[f.from] || '';
          var autoVal = '';
          if (sourceVal && f.from === 'major-category') {
            var major = REF_DATA.majors.find(function (m) { return m.id === sourceVal; });
            autoVal = major ? major[f.prop] || '' : '';
          }
          M.edit[f.s] = autoVal;
          var autoHas = autoVal !== '';
          h += '<div class="cm-gi' + spanClass + (autoVal !== origVal ? ' cm-dirty' : '') + '">';
          h += '<div class="cm-gi-d ' + (autoHas ? 'cm-gi-ok' : 'cm-gi-mt') + '"></div>';
          h += '<span class="cm-gi-l">' + f.l + '</span>';
          h += '<div class="cm-gi-v">' + (autoHas ? esc(autoVal) : '<span class="cm-empty">auto-filled</span>') + '</div>';
          h += '<div class="cm-gi-act"><span class="cm-lock-auto">auto</span></div>';
          h += '</div>';
          return;
        }

        h += '<div class="cm-gi' + spanClass + (isDirty ? ' cm-dirty' : '') + '" data-cm-field="' + esc(f.s) + '">';
        h += '<div class="cm-gi-d ' + dot + '"></div>';
        h += '<span class="cm-gi-l">' + f.l + '</span>';

        if (isEditing) {
          h += '<div class="cm-gi-e">';

          if (f.t === 'upload') {
            // Uploadcare widget button
            h += '<div class="cm-upload-wrap">';
            if (hasVal) {
              h += '<span class="cm-upload-val">' + truncUrl(val) + '</span>';
              h += '<button class="cm-upload-clear" onclick="cmSetVal(\'' + esc(f.s) + '\',\'\')">x</button>';
            }
            h += '<button class="cm-upload-btn" onclick="cmUploadcare(\'' + esc(f.s) + '\')">Upload</button>';
            h += '</div>';

          } else if (f.t === 'ref-select') {
            // Dropdown from reference data — src:'majors' is affected by the
            // same DOM cap as Minor, so show a loading state while the live
            // full-tree fetch (ensureLiveCategories) is in flight.
            var refList = REF_DATA[f.src] || [];
            var majorLoading = f.src === 'majors' && CATEGORIES_LOADING;
            h += '<select class="cm-esel" onchange="cmSetVal(\'' + esc(f.s) + '\',this.value)"' + (majorLoading ? ' disabled' : '') + '>';
            if (majorLoading) {
              h += '<option value="">Loading…</option>';
            } else {
              h += '<option value="">-- select --</option>';
              refList.forEach(function (item) {
                h += '<option value="' + esc(item.id) + '"' + (val === item.id ? ' selected' : '') + '>' + esc(item.name) + '</option>';
              });
            }
            h += '</select>';

          } else if (f.t === 'ref-cascade') {
            // Sub-dropdown filtered by parent field value
            var parentVal = M.edit[f.parentField] || '';
            var isLoadingSubs = CATEGORIES_LOADING;
            var filteredList = parentVal ? subsForMajor(parentVal) : [];
            h += '<select class="cm-esel" onchange="cmSetVal(\'' + esc(f.s) + '\',this.value)"' + (!parentVal || isLoadingSubs ? ' disabled' : '') + '>';
            if (isLoadingSubs) {
              h += '<option value="">Loading…</option>';
            } else if (!parentVal) {
              h += '<option value="">Select major first</option>';
            } else if (!filteredList.length) {
              h += '<option value="">No subcategories</option>';
            } else {
              h += '<option value="">-- select --</option>';
              filteredList.forEach(function (item) {
                h += '<option value="' + esc(item.id) + '"' + (val === item.id ? ' selected' : '') + '>' + esc(item.name) + '</option>';
              });
            }
            h += '</select>';

          } else if (f.t === 'option') {
            h += '<select class="cm-esel" onchange="cmSetVal(\'' + esc(f.s) + '\',this.value)">';
            h += '<option value="">-- select --</option>';
            (f.opts || []).forEach(function (o) {
              h += '<option value="' + esc(o) + '"' + (val === o ? ' selected' : '') + '>' + esc(o) + '</option>';
            });
            h += '</select>';
          } else if (f.t === 'switch') {
            h += '<div class="cm-esw"><input type="checkbox" ' + (val ? 'checked' : '') + ' onchange="cmSetVal(\'' + esc(f.s) + '\',this.checked)">';
            h += '<span>' + (val ? 'On' : 'Off') + '</span></div>';
          } else if (f.t === 'textarea') {
            h += '<textarea class="cm-ei" rows="2" oninput="cmSetVal(\'' + esc(f.s) + '\',this.value,true)">' + esc(val) + '</textarea>';
          } else {
            var ph = f.t === 'link' ? 'https://...' : f.t === 'email' ? 'email@...' : f.t === 'phone' ? '(201) 555-...' : 'Enter value...';
            h += '<input class="cm-ei" type="text" value="' + esc(val) + '" placeholder="' + ph + '" oninput="cmSetVal(\'' + esc(f.s) + '\',this.value,true)">';
          }
          h += '</div>';
          h += '<div class="cm-gi-act">';
          if (isDirty) h += '<button class="cm-cancel-lk" onclick="cmRevertField(\'' + esc(f.s) + '\')">cancel</button>';
          h += '<button class="cm-pen" onclick="cmToggleEdit(\'' + esc(f.s) + '\')" title="Close">' + penSvg('#1a3a3a') + '</button>';
          h += '</div>';
        } else {
          if (hasVal) {
            h += '<div class="cm-gi-v">';
            if (f.t === 'switch') {
              h += val ? 'On' : 'Off';
            } else if (f.t === 'ref-select' || f.t === 'ref-cascade') {
              // Show name instead of ID
              var displayName = refName(f.src, val);
              h += esc(displayName || val);
            } else if ((f.t === 'link' || f.t === 'email') && val) {
              h += '<a href="' + esc(val) + '" target="_blank" onclick="event.stopPropagation()">' + truncUrl(val) + '</a>';
            } else if (f.t === 'upload' && val) {
              h += '<span class="cm-img-tag">' + truncUrl(val) + '</span>';
            } else if (f.t === 'image' && val) {
              h += '<span class="cm-img-tag">' + esc(val) + '</span>';
            } else {
              h += esc(String(val));
            }
            h += '</div>';
          } else {
            h += '<div class="cm-gi-v cm-empty">empty</div>';
          }
          h += '<div class="cm-gi-act"><button class="cm-pen" onclick="cmToggleEdit(\'' + esc(f.s) + '\')" title="Edit">' + penSvg('#8a8a7a') + '</button></div>';
        }
        h += '</div>';
      });
      h += g.drawer ? '</div></details>' : '</div></div>';
    });

    h += '</div>';

    // Modal footer
    h += '<div class="cm-mf"><div class="cm-mf-l">';
    h += '<span class="cm-mf-i">' + fc + ' of ' + TOTAL_FIELDS + ' fields populated</span>';
    if (dc > 0) {
      h += '<span class="cm-mf-dc">' + dc + ' unsaved change' + (dc > 1 ? 's' : '') + '</span>';
      h += '<button class="cm-mf-ca" onclick="cmCancelAll()">\u2715 cancel all edits</button>';
    }
    h += '</div><div class="cm-mf-r">';
    if (isAdd) {
      var creating = M.createState === 'creating';
      h += '<button class="cm-mf-sv"' + ((dc === 0 || creating) ? ' disabled' : '') + ' onclick="cmDoCreate()">' +
           (creating ? '<span class="cm-spin"></span> Adding\u2026' : 'Create Client') + '</button>';
    } else {
      h += '<button class="cm-mf-sv"' + (dc === 0 ? ' disabled' : '') + ' onclick="cmDoSave(false)">Save</button>';
      h += '<button class="cm-mf-pub"' + (dc === 0 ? ' disabled' : '') + ' onclick="cmDoSave(true)">Save &amp; Publish</button>';
    }
    h += '</div></div>';

    h += '</div></div>';
    portal.innerHTML = h;
    mount.innerHTML = '';
  }

  function penSvg(color) {
    return '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 1.5l3 3-9 9H2.5v-3z"/><path d="M9.5 3.5l3 3"/></svg>';
  }

  // ── Global actions (attached to window for onclick) ──
  window.cmSetFilter = function (f) { FILTER = f; render(); };
  var _searchTimer = null;
  window.cmSearch = function (v) {
    SEARCH = v;
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(function () {
      var el = mount.querySelector('.cm-sr');
      var pos = el ? el.selectionStart : 0;
      render();
      var newEl = mount.querySelector('.cm-sr');
      if (newEl) { newEl.focus(); newEl.setSelectionRange(pos, pos); }
    }, 150);
  };
  window.cmToggleMod = function () { MOD_INCOMPLETE = !MOD_INCOMPLETE; render(); };
  window.cmSort = function (col) {
    if (SORT_COL === col) SORT_DIR = -SORT_DIR;
    else { SORT_COL = col; SORT_DIR = 1; }
    render();
  };
  window.cmToggleSel = function (id) { SELECTED[id] = !SELECTED[id]; render(); };
  window.cmToggleAll = function () {
    var vis = getVisible();
    var allOn = vis.every(function (c) { return SELECTED[c.id]; });
    vis.forEach(function (c) { SELECTED[c.id] = !allOn; });
    render();
  };
  window.cmClearSel = function () { SELECTED = {}; render(); };

  // Edit modal
  window.cmEdit = function (id) {
    var c = CUSTOMERS.find(function (x) { return x.id === id; });
    if (!c) return;
    var orig = {};
    var edit = {};
    ALL_FIELDS.forEach(function (f) { orig[f.s] = c[f.s]; edit[f.s] = c[f.s]; });
    MODAL = { mode: 'edit', custId: id, orig: orig, edit: edit, editing: {} };
    render();
    ensureLiveCategories();
  };

  // Add modal
  window.cmAddClient = function () {
    var orig = {};
    var edit = {};
    ALL_FIELDS.forEach(function (f) {
      var def = f.t === 'switch' ? false : '';
      orig[f.s] = def;
      edit[f.s] = def;
    });
    // Pre-fill publisher and titles-admin
    edit['publisher'] = PUBLISHER_NAME;
    orig['publisher'] = PUBLISHER_NAME;
    edit['titles-admin'] = TA_NAME;
    orig['titles-admin'] = TA_NAME;
    MODAL = { mode: 'add', custId: 'new-' + Date.now(), orig: orig, edit: edit, editing: {} };
    render();
    ensureLiveCategories();
  };

  window.cmCloseModal = function () { MODAL = null; render(); };

  // ── v1.0.12: AI URL scrape ──
  // Wire map: Worker camelCase field → CMS slug in M.edit.
  var SCRAPE_FIELD_MAP = {
    name:            'name',
    tagline:         'tagline',
    longDescription: 'long-description',
    services:        'services',
    address:         'address',
    address2:        'address-2',
    cityStZip:       'city-st-zip',
    businessWebsite: 'business-website',
    businessPhone:   'business-phone',
    businessEmail:   'business-email',
    facebook:        'facebook',
    instagram:       'instagram',
    tiktok:          'tiktok',
    youtube:         'youtube',
    linkedin:        'linkedin',
    x:               'x',
    pinterest:       'pinterest',
    houzz:           'houzz'
  };

  window.cmScrapeClient = function () {
    if (!MODAL || MODAL.mode !== 'add') return;
    var input = portal.querySelector('#cm-scrape-url');
    var url = input ? (input.value || '').trim() : (MODAL.scrapeUrl || '');
    MODAL.scrapeUrl = url;
    if (!url) {
      MODAL.scrapeState = 'error';
      MODAL.scrapeError = 'Enter a website URL first.';
      renderModal();
      return;
    }
    if (!CFG.extractClientUrl) {
      MODAL.scrapeState = 'error';
      MODAL.scrapeError = 'Scrape endpoint not configured (TA_CONFIG.extractClientUrl).';
      renderModal();
      return;
    }
    MODAL.scrapeState = 'loading';
    MODAL.scrapeError = '';
    renderModal();

    // v1.0.17: send the known Major Category names so the worker can
    // return an exact-match guess instead of an unconstrained string.
    var majorNames = REF_DATA.majors.map(function (m) { return m.name; });

    fetch(CFG.extractClientUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, categories: majorNames })
    })
      .then(function (res) { return res.json().catch(function () { throw new Error('Bad response from scraper'); }); })
      .then(function (data) {
        if (!data || !data.ok) throw new Error((data && data.error) || 'Scrape failed');
        var fields = data.fields || {};
        // Write only non-empty values into M.edit so we don't blank existing entries.
        Object.keys(SCRAPE_FIELD_MAP).forEach(function (wireKey) {
          var slug = SCRAPE_FIELD_MAP[wireKey];
          var val = fields[wireKey];
          if (val != null && String(val).trim() !== '') {
            MODAL.edit[slug] = String(val).trim();
          }
        });

        // v1.0.17: majorCategory comes back as an exact string match
        // against REF_DATA.majors (or "" if nothing fit) — look up the
        // id directly, no fuzzy matching. Also cascades parent-category
        // name/id the same way manual selection does. Leaves
        // business-category (the Minor/subcategory) untouched — AI
        // never guesses that.
        var majorGuess = fields.majorCategory;
        if (majorGuess && String(majorGuess).trim() !== '') {
          var matched = REF_DATA.majors.find(function (m) { return m.name === majorGuess; });
          if (matched) {
            MODAL.edit['major-category'] = matched.id;
            MODAL.edit['parent-category-name'] = matched.name;
            MODAL.edit['parent-category-id'] = matched.id;
          }
        }

        // v1.0.17: neighborhood has no AI signal of its own — derive it
        // from the city token in cityStZip (e.g. "Wyckoff, NJ 07481" →
        // "Wyckoff"). Only fills if neighborhood is currently empty.
        if (!MODAL.edit['neighborhood']) {
          var csz = fields.cityStZip;
          if (csz && String(csz).trim() !== '') {
            var cityToken = String(csz).split(',')[0].trim();
            if (cityToken) MODAL.edit['neighborhood'] = cityToken;
          }
        }

        // v1.0.22: derive Logo Initials + Short Code from the name.
        // Initials rule matches ASF commitCreateCustomer exactly: first
        // letter of up to the first 3 words, uppercased; fallback first
        // 2 chars. Short Code: uppercase alphanumerics of the name,
        // first 4 chars ("JH Renovations LLC" -> "JHRE"). Both are
        // prefills — fill only if empty, operator can overtype.
        var nm = (MODAL.edit['name'] || '').trim();
        if (nm) {
          if (!MODAL.edit['logo-initials']) {
            MODAL.edit['logo-initials'] = (nm.split(/\s+/).filter(Boolean).slice(0, 3)
              .map(function (w) { return w.charAt(0); }).join('') || nm.slice(0, 2)).toUpperCase();
          }
          if (!MODAL.edit['customer-short-code']) {
            var compact = nm.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (compact) MODAL.edit['customer-short-code'] = compact.slice(0, 4);
          }
        }

        // v1.0.21: TXA Services 1–6 were never AI-wired. Split the
        // comma-sep services list into the six TXA slots (first six
        // entries), filling only slots that are currently empty so a
        // hand-entered value is never overwritten.
        var svcRaw = fields.services;
        if (svcRaw && String(svcRaw).trim() !== '') {
          var svcList = String(svcRaw).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
          for (var ti = 0; ti < 6; ti++) {
            var slot = 'txa-services-' + (ti + 1);
            if (svcList[ti] && !MODAL.edit[slot]) MODAL.edit[slot] = svcList[ti];
          }
        }

        MODAL.scrapeImages = Array.isArray(data.images) ? data.images.slice(0, 16) : [];
        MODAL.scrapeState = 'done';
        MODAL.scrapeError = '';
        renderModal();
      })
      .catch(function (err) {
        MODAL.scrapeState = 'error';
        MODAL.scrapeError = (err && err.message) ? err.message : 'Could not read that page.';
        renderModal();
      });
  };

  // v1.0.18: picking a logo candidate now uploads it to Uploadcare
  // immediately (client-side), instead of just storing the raw scraped
  // URL and pushing the upload into the Make create-flow. logo-link ends
  // up holding a live ucarecdn.com URL before Create Client is ever
  // clicked. Falls back to storing the raw URL if Uploadcare's JS lib
  // isn't loaded on this page for some reason, so picking still does
  // *something* rather than silently no-op.
  window.cmPickLogo = function (i) {
    if (!MODAL || !MODAL.scrapeImages) return;
    var src = MODAL.scrapeImages[i];
    if (!src) return;

    // Click the already-picked, already-uploaded candidate again → clear it.
    if (MODAL.logoPickedIndex === i && MODAL.logoUpload && MODAL.logoUpload.state === 'done') {
      MODAL.logoPickedIndex = null;
      MODAL.logoUpload = null;
      MODAL.edit['logo-link'] = '';
      renderModal();
      return;
    }

    MODAL.logoPickedIndex = i;
    MODAL.edit['logo-link'] = '';

    if (!window.uploadcare || !window.uploadcare.fileFrom) {
      console.warn('[CLIENT MGR] Uploadcare JS lib not available on this page — using raw scraped URL as a fallback.');
      MODAL.logoUpload = null;
      MODAL.edit['logo-link'] = src;
      renderModal();
      return;
    }

    MODAL.logoUpload = { state: 'uploading', error: '' };
    renderModal();

    window.uploadcare.fileFrom('url', src)
      .done(function (fileInfo) {
        if (!MODAL || MODAL.logoPickedIndex !== i) return; // superseded by a later pick
        var base = fileInfo.cdnUrl;
        var trimUrl = base + '-/trim/-/preview/-/format/auto/';
        var squareUrl = base + '-/trim/-/scale_crop/500x500/center/-/format/auto/';
        MODAL.logoUpload = { state: 'done', variants: { trim: trimUrl, square: squareUrl }, selected: 'trim' };
        MODAL.edit['logo-link'] = trimUrl;
        renderModal();
      })
      .fail(function (err) {
        if (!MODAL || MODAL.logoPickedIndex !== i) return;
        MODAL.logoUpload = { state: 'error', error: (err && err.message) ? err.message : 'Upload failed' };
        renderModal();
      });
  };

  window.cmSelectLogoVariant = function (variant) {
    if (!MODAL || !MODAL.logoUpload || MODAL.logoUpload.state !== 'done') return;
    if (!MODAL.logoUpload.variants[variant]) return;
    MODAL.logoUpload.selected = variant;
    MODAL.edit['logo-link'] = MODAL.logoUpload.variants[variant];
    renderModal();
  };

  window.cmToggleEdit = function (slug) {
    MODAL.editing[slug] = !MODAL.editing[slug];
    var scrollEl = portal.querySelector('.cm-mb');
    var scrollTop = scrollEl ? scrollEl.scrollTop : 0;
    renderModal();
    var newScrollEl = portal.querySelector('.cm-mb');
    if (newScrollEl) newScrollEl.scrollTop = scrollTop;
  };

  // For text inputs: update state silently, no re-render (avoids focus loss)
  // For selects/checkboxes/upload: re-render to update UI
  window.cmSetVal = function (slug, val, noRender) {
    MODAL.edit[slug] = val;
    if (slug === 'major-category') {
      MODAL.edit['business-category'] = '';
      MODAL.editing['business-category'] = true;
    }
    // Update the dot indicator in-place without full re-render
    if (noRender) {
      // Just update the dirty border on the current row
      var gi = portal.querySelector('[data-cm-field="' + slug + '"]');
      if (gi) {
        var hasVal = val !== '' && val !== false;
        var isDirty = val !== MODAL.orig[slug];
        gi.classList.toggle('cm-dirty', isDirty);
        var dot = gi.querySelector('.cm-gi-d');
        if (dot) { dot.classList.toggle('cm-gi-ok', hasVal); dot.classList.toggle('cm-gi-mt', !hasVal); }
      }
      // Update footer counts
      var dc = 0;
      ALL_FIELDS.forEach(function (f) { if (MODAL.edit[f.s] !== MODAL.orig[f.s]) dc++; });
      var dcEl = portal.querySelector('.cm-mf-dc');
      if (dcEl) dcEl.textContent = dc > 0 ? dc + ' unsaved change' + (dc > 1 ? 's' : '') : '';
      var svBtn = portal.querySelector('.cm-mf-sv');
      var pubBtn = portal.querySelector('.cm-mf-pub');
      if (svBtn) svBtn.disabled = dc === 0;
      if (pubBtn) pubBtn.disabled = dc === 0;
      return;
    }
    var scrollEl = portal.querySelector('.cm-mb');
    var scrollTop = scrollEl ? scrollEl.scrollTop : 0;
    renderModal();
    var newScrollEl = portal.querySelector('.cm-mb');
    if (newScrollEl) newScrollEl.scrollTop = scrollTop;
  };

  window.cmRevertField = function (slug) {
    MODAL.edit[slug] = MODAL.orig[slug];
    MODAL.editing[slug] = false;
    var scrollEl = portal.querySelector('.cm-mb');
    var scrollTop = scrollEl ? scrollEl.scrollTop : 0;
    renderModal();
    var newScrollEl = portal.querySelector('.cm-mb');
    if (newScrollEl) newScrollEl.scrollTop = scrollTop;
  };

  window.cmCancelAll = function () {
    ALL_FIELDS.forEach(function (f) { MODAL.edit[f.s] = MODAL.orig[f.s]; });
    MODAL.editing = {};
    renderModal();
  };

  window.cmUploadcare = function (slug) {
    if (window.uploadcare && window.uploadcare.openDialog) {
      var dialog = uploadcare.openDialog(null, {
        publicKey: window.UPLOADCARE_PUBLIC_KEY || '',
        imagesOnly: true
      });
      dialog.done(function (file) {
        file.done(function (info) {
          cmSetVal(slug, info.cdnUrl);
        });
      });
    } else {
      var url = prompt('Paste image URL:');
      if (url) cmSetVal(slug, url);
    }
  };

  window.cmDoSave = function (publish) {
    var changes = {};
    ALL_FIELDS.forEach(function (f) {
      if (MODAL.edit[f.s] !== MODAL.orig[f.s]) changes[f.s] = MODAL.edit[f.s];
    });
    if (Object.keys(changes).length === 0) return;

    var payload = {
      action: 'update',
      titleSlug: CFG.titleSlug,
      taItemId: CFG.taItemId,
      publisherId: PUBLISHER_ID,
      customerId: MODAL.custId,
      publish: !!publish,
      fields: changes
    };

    console.log('[CLIENT MGR] Save payload:', payload);

    // Update in-memory data
    var c = CUSTOMERS.find(function (x) { return x.id === MODAL.custId; });
    if (c) {
      for (var k in changes) c[k] = changes[k];
    }

    // Update orig to match
    for (var k in changes) MODAL.orig[k] = changes[k];
    MODAL.editing = {};
    renderModal();

    // TODO: Replace console.log with Make webhook call
    // var qs = new URLSearchParams(payload);
    // fetch(CFG.webhookUrl + '?' + qs.toString(), { method: 'GET', mode: 'no-cors' });
  };

  // v1.0.16: maps internal CMS slugs → the camelCase keys the
  // 111_IBX_createEditCustomer webhook expects (from blueprint).
  // Dropdowns send their label ("Active","Regular"); the scenario's
  // switch() resolves option IDs. Switches send booleans.
  var CREATE_KEY_MAP = {
    'name':                              'name',
    'customer-short-code':               'shortCode',
    'logo-initials':                     'logoInitials',
    'logo-link':                         'logoLink',
    'customer-type':                     'customerType',
    'client-status':                     'clientStatus',
    'profile-status':                    'profileStatus',
    'expert-contributor':                'expertContributor',
    'hide-from-directory':               'hideFromDirectory',
    'featured-listing':                  'featuredListing',
    'major-category':                    'majorCategory',
    'business-category':                 'businessCategory',
    'address':                           'address',
    'address-2':                         'address2',
    'city-st-zip':                       'cityStZip',
    'neighborhood':                      'neighborhood',
    'business-website':                  'website',
    'business-phone':                    'phone',
    'business-email':                    'email',
    'tagline':                           'tagline',
    'long-description':                  'longDescription',
    'services':                          'services',
    'txa-services-1':                    'txa1',
    'txa-services-2':                    'txa2',
    'txa-services-3':                    'txa3',
    'txa-services-4':                    'txa4',
    'txa-services-5':                    'txa5',
    'txa-services-6':                    'txa6',
    'facebook':                          'facebook',
    'instagram':                         'instagram',
    'tiktok':                            'tiktok',
    'youtube':                           'youtube',
    'linkedin':                          'linkedin',
    'x':                                 'x',
    'pinterest':                         'pinterest',
    'houzz':                             'houzz',
    'default-art-ad-get':                'defaultArtAdGet',
    'default-sponsorship-ad-link-ulc':   'defaultSponsorshipAd'
  };

  window.cmDoCreate = function () {
    if (!MODAL || MODAL.mode !== 'add') return;
    if (MODAL.createState === 'creating') return;  // guard double-click

    // Validation — inline, no alert()
    var name = (MODAL.edit['name'] || '').trim();
    if (!name) {
      MODAL.createState = 'error';
      MODAL.createError = 'Customer Name is required.';
      renderModal();
      return;
    }
    if (!CFG.webhookUrl) {
      MODAL.createState = 'error';
      MODAL.createError = 'Create endpoint not configured (TA_CONFIG.clientManagerWebhook).';
      renderModal();
      return;
    }

    // Build webhook payload in the camelCase contract the scenario reads.
    var body = { titleSlug: CFG.titleSlug, publish: false };
    Object.keys(CREATE_KEY_MAP).forEach(function (slug) {
      var wireKey = CREATE_KEY_MAP[slug];
      var v = MODAL.edit[slug];
      if (v === undefined || v === null) return;
      if (typeof v === 'boolean') { body[wireKey] = v; return; }
      v = String(v).trim();
      if (v !== '') body[wireKey] = v;
    });

    MODAL.createState = 'creating';
    MODAL.createError = '';
    renderModal();

    fetch(CFG.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (res) {
        return res.json().catch(function () { throw new Error('Server returned a non-JSON response.'); });
      })
      .then(function (data) {
        if (!data || !data.ok) throw new Error((data && data.error) || 'Create failed. Please try again.');
        // Success — driven by Make response.
        var cust = data.customer || {};
        MODAL.createName = cust.name || name;
        MODAL.createPublished = !!body.publish;
        // Add the new record to the in-memory list so it appears on close.
        var newRec = { id: cust.id || ('new-' + Date.now()) };
        ALL_FIELDS.forEach(function (f) { newRec[f.s] = MODAL.edit[f.s]; });
        if (cust.id) newRec['self-this-item-id'] = cust.id;
        CUSTOMERS.push(newRec);
        MODAL.createState = 'done';
        renderModal();
        // v1.0.20: auto-redirect to the customer's page. Requires the 111
        // Webhook Response to include "slug" (module 3's Slug output) in
        // the customer object; without it we stay on the success screen
        // rather than navigating somewhere broken.
        if (cust.slug) {
          setTimeout(function () {
            window.location.href = '/end-customers/' + cust.slug;
          }, 600); // brief beat so the success state is visible, not a flash
        } else {
          console.warn('[CLIENT MGR] No slug in create response — add "slug": module 3 Slug to Scenario 111\u2019s Webhook Response to enable redirect.');
        }
      })
      .catch(function (err) {
        MODAL.createState = 'error';
        MODAL.createError = (err && err.message) ? err.message : 'Create failed. Please try again.';
        renderModal();
      });
  };

  // ── CSS ──
  function getCss() {
    return [
      '.cm-hdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;border-bottom:2px solid #1a3a3a;padding-bottom:12px}',
      '.cm-hdr-l{display:flex;align-items:center;gap:10px}',
      '.cm-ic{width:34px;height:34px;background:#1a3a3a;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:15px;color:#c4a35a}',
      '.cm-ti{font-size:18px;font-weight:700;color:#1a3a3a}',
      '.cm-su{font-size:10px;font-family:"DM Mono",monospace;color:#8a8a7a;letter-spacing:.04em;text-transform:uppercase;margin-top:1px}',
      '.cm-add-btn{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:6px 14px;border-radius:3px;border:1.5px solid #1a3a3a;background:#fff;color:#1a3a3a;cursor:pointer;transition:all .15s}',
      '.cm-add-btn:hover{background:#1a3a3a;color:#f0edd8}',

      '.cm-tb{display:flex;gap:6px;margin-bottom:8px;align-items:center;flex-wrap:wrap}',
      '.cm-fp{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:5px 12px;border-radius:3px;border:1.5px solid #e0ddd0;background:transparent;color:#5a6a5a;cursor:pointer;transition:all .15s}',
      '.cm-fp:hover{border-color:#c4a35a}',
      '.cm-fp.on{background:#1a3a3a;color:#fff;border-color:transparent}',
      '.cm-fp.gn{background:#1e7e4a;color:#fff;border-color:transparent}',
      '.cm-fp.bl{background:#1a5276;color:#fff;border-color:transparent}',
      '.cm-fp.am{background:#c07010;color:#fff;border-color:transparent}',
      '.cm-fp.rd{background:#c0392b;color:#fff;border-color:transparent}',
      '.cm-sp{flex:1}',
      '.cm-sr{font-family:"DM Sans",sans-serif;font-size:12px;padding:5px 10px 5px 28px;border:1.5px solid #d8d4c4;border-radius:3px;background:#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'13\' height=\'13\' fill=\'none\' stroke=\'%238a8a7a\' stroke-width=\'1.5\'%3E%3Ccircle cx=\'5.5\' cy=\'5.5\' r=\'4\'/%3E%3Cline x1=\'8.5\' y1=\'8.5\' x2=\'12\' y2=\'12\'/%3E%3C/svg%3E") no-repeat 8px center;color:#1a3a3a;outline:none;width:200px}',
      '.cm-sr:focus{border-color:#1a3a3a}',

      '.cm-mr{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:0 2px}',
      '.cm-mt{display:inline-flex;align-items:center;gap:6px;cursor:pointer;-webkit-user-select:none;user-select:none}',
      '.cm-mc{width:14px;height:14px;accent-color:#c07010;cursor:pointer}',
      '.cm-ml{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;color:#5a6a5a}',
      '.cm-mt.ac .cm-ml{color:#c07010;font-weight:600}',
      '.cm-mn{font-family:"DM Mono",monospace;font-size:9px;color:#a0a090;background:#f0ede4;padding:1px 6px;border-radius:2px}',
      '.cm-mt.ac .cm-mn{background:#fdf6e8;color:#c07010}',

      '.cm-sb{display:flex;align-items:center;gap:10px;padding:8px 14px;background:#1a3a3a;color:#f0edd8;border-radius:6px;margin-bottom:10px;font-size:12px}',
      '.cm-sn{font-family:"DM Mono",monospace;font-size:11px;font-weight:600}',
      '.cm-ss{flex:1}',
      '.cm-sd{border:none;opacity:.7;font-size:10px;cursor:pointer;background:none;color:#f0edd8;font-family:"DM Mono",monospace}',
      '.cm-sd:hover{opacity:1}',

      '.cm-tw{border:1.5px solid #e0ddd0;border-radius:5px;overflow:hidden;background:#fff}',
      '.cm-tbl{width:100%;border-collapse:collapse;table-layout:fixed}',
      '.cm-tbl thead th{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;background:#f6f4ee;padding:9px 12px;text-align:left;border-bottom:1.5px solid #e0ddd0;cursor:pointer;-webkit-user-select:none;user-select:none;white-space:nowrap;transition:color .12s}',
      '.cm-tbl thead th:hover{color:#1a3a3a}',
      '.cm-th.cm-so{color:#1a3a3a;font-weight:600}',
      '.cm-ar{font-size:9px;margin-left:3px;opacity:.5}',
      '.cm-so .cm-ar{opacity:1}',
      '.cm-c0{width:36px;cursor:default!important}',
      '.cm-c5{width:70px;cursor:default!important}',
      '.cm-tbl tbody tr{border-bottom:1px solid #f0ede4;transition:background .1s}',
      '.cm-tbl tbody tr:last-child{border-bottom:none}',
      '.cm-tbl tbody tr:hover{background:#fdfcf8}',
      '.cm-tbl tbody tr.cm-sl{background:#faf5e8}',
      '.cm-tbl td{padding:9px 12px;font-size:12px;vertical-align:middle}',
      '.cm-ck{width:15px;height:15px;accent-color:#1a3a3a;cursor:pointer}',
      '.cm-cn{font-weight:600;color:#1a3a3a}',
      '.cm-cc{font-size:9px;font-family:"DM Mono",monospace;color:#a0a090;margin-top:1px}',
      '.cm-pill{font-family:"DM Mono",monospace;font-size:9px;padding:3px 9px;border-radius:3px;letter-spacing:.03em;display:inline-block;white-space:nowrap}',
      '.cm-pill.sa{background:#e8f5e9;color:#1e7e4a;border:1px solid #c8e6c9}',
      '.cm-pill.sps{background:#fdf6e8;color:#c07010;border:1px solid #f0dbb0}',
      '.cm-pill.spr{background:#eaf2fb;color:#1a5276;border:1px solid #b8d4f0}',
      '.cm-pill.si{background:#fdf0ef;color:#c0392b;border:1px solid #f0c4c0}',
      '.cm-pill.ta2{background:#eef6f1;color:#2d6a4f;border:1px solid #c8e6c9}',
      '.cm-pill.tc2{background:#f3eefb;color:#6b2fa0;border:1px solid #d8c8f0}',
      '.cm-pill.ts2{background:#fdf8e8;color:#8a6400;border:1px solid #f0dbb0}',
      '.cm-pd{display:inline-flex;align-items:center;gap:5px;font-family:"DM Mono",monospace;font-size:10px;white-space:nowrap}',
      '.cm-dt{width:8px;height:8px;border-radius:50%;flex-shrink:0}',
      '.cm-dt.do{background:#1e7e4a}',
      '.cm-dt.dw{background:#c07010}',
      '.cm-eb{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.04em;padding:4px 10px;border-radius:3px;border:1.5px solid #e0ddd0;background:#fff;color:#5a6a5a;cursor:pointer;transition:all .12s;white-space:nowrap}',
      '.cm-eb:hover{border-color:#1a3a3a;color:#1a3a3a}',
      '.cm-er td{text-align:center;padding:32px;color:#8a8a7a;font-family:"DM Mono",monospace;font-size:11px}',

      // Modal
      '.cm-ov{position:fixed;inset:0;background:rgba(26,58,58,0.45);display:flex;align-items:flex-start;justify-content:center;padding:30px 16px;z-index:2147483000;overflow-y:auto;-webkit-overflow-scrolling:touch}',
      '.cm-mo{background:#fff;border-radius:6px;width:100%;max-width:940px;overflow:hidden;border:1.5px solid #e0ddd0}',
      '.cm-mh{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1.5px solid #e0ddd0;background:#f6f4ee}',
      '.cm-mh-l{display:flex;align-items:center;gap:10px}',
      '.cm-mh-av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}',
      '.cm-mh-n{font-size:15px;font-weight:700;color:#1a3a3a}',
      '.cm-mh-s{font-size:9px;font-family:"DM Mono",monospace;color:#8a8a7a;margin-top:1px}',
      '.cm-mx{font-family:"DM Mono",monospace;font-size:11px;color:#c0392b;cursor:pointer;background:none;border:none;padding:4px 8px}',
      '.cm-mx:hover{opacity:.7}',
      '.cm-mb{padding:18px;max-height:60vh;overflow-y:auto;-webkit-overflow-scrolling:touch}',
      '.cm-gp{margin-bottom:16px}',
      '.cm-gh{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #f0ede4}',
      '.cm-gh-t{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;font-weight:600}',
      '.cm-gh-c{font-family:"DM Mono",monospace;font-size:9px;color:#a0a090;margin-left:auto}',
      '.cm-gr{display:grid;grid-template-columns:repeat(6,1fr);gap:8px 12px;align-items:start}',
      '.cm-w1{grid-column:span 1}.cm-w2{grid-column:span 2}.cm-w3{grid-column:span 3}',
      '.cm-w4{grid-column:span 4}.cm-w5{grid-column:span 5}.cm-w6{grid-column:span 6}',
      '@media(max-width:720px){.cm-w1,.cm-w2{grid-column:span 3}.cm-w3,.cm-w4,.cm-w5{grid-column:span 6}}',
      '.cm-drawer{border:1.5px solid #e0ddd0;border-radius:8px;background:#f4f2ea;margin:6px 0 14px}',
      '.cm-drawer-s{cursor:pointer;padding:11px 15px;font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:#5a6a5a;list-style:none;display:flex;gap:8px;align-items:center}',
      '.cm-drawer-s::before{content:"\\25b8";color:#c4a35a}',
      '.cm-drawer[open] .cm-drawer-s::before{content:"\\25be"}',
      '.cm-drawer .cm-gr{padding:12px 15px;border-top:1.5px solid #e0ddd0}',
      '.cm-gi{display:flex;flex-direction:column;align-items:stretch;gap:3px;padding:6px 9px;border-radius:6px;min-height:30px;border:1.5px solid transparent;transition:all .12s}',
      '.cm-gi:hover{background:#faf9f5}',
      '.cm-gi.cm-dirty{border-color:#c4a35a;background:#faf5e8}',
      '.cm-gi{position:relative}',
      '.cm-gi-d{width:6px;height:6px;border-radius:50%;position:absolute;left:10px;top:12px}',
      '.cm-gi-ok{background:#1e7e4a}',
      '.cm-gi-mt{background:#d0cdc0}',
      '.cm-gi-l{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;padding-left:12px;padding-right:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.cm-gi-v{font-size:12.5px;color:#1a3a3a;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:2px 0 0 12px}',
      '.cm-gi-v.cm-empty{color:#a0a090;font-style:italic;text-align:left}',
      '.cm-gi-v a{color:#1a3a3a;text-decoration:none;font-size:11px}',
      '.cm-gi-v a:hover{text-decoration:underline}',
      '.cm-img-tag{font-family:"DM Mono",monospace;font-size:9px;color:#1a5276;background:#eaf2fb;padding:1px 6px;border-radius:2px}',
      '.cm-gi-e{min-width:0;padding:0}',
      '.cm-gi-act{display:flex;align-items:center;gap:4px;position:absolute;right:7px;top:6px}',
      '.cm-pen{width:22px;height:22px;border:none;background:none;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;border-radius:3px;transition:background .1s}',
      '.cm-pen:hover{background:#f0ede4}',
      '.cm-cancel-lk{font-family:"DM Mono",monospace;font-size:9px;color:#c0392b;cursor:pointer;background:none;border:none;padding:2px 4px}',
      '.cm-cancel-lk:hover{opacity:.7}',
      '.cm-ei{font-family:"DM Sans",sans-serif;font-size:11px;padding:3px 6px;border:1.5px solid #c4a35a;border-radius:3px;background:#fff;color:#1a3a3a;outline:none;width:100%}',
      '.cm-ei:focus{border-color:#1a3a3a}',
      '.cm-esel{font-family:"DM Sans",sans-serif;font-size:11px;padding:3px 6px;border:1.5px solid #c4a35a;border-radius:3px;background:#fff;color:#1a3a3a;outline:none;width:100%;cursor:pointer;-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'5\'%3E%3Cpath d=\'M1 1l3 3 3-3\' fill=\'none\' stroke=\'%238a8a7a\' stroke-width=\'1.2\' stroke-linecap=\'round\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 6px center;padding-right:20px}',
      '.cm-esw{display:flex;align-items:center;gap:6px}',
      '.cm-esw input{accent-color:#1a3a3a}',
      '.cm-esw span{font-size:11px;color:#1a3a3a}',

      '.cm-mf{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-top:1.5px solid #e0ddd0;background:#f6f4ee;flex-wrap:wrap;gap:8px}',
      '.cm-mf-l{display:flex;align-items:center;gap:12px}',
      '.cm-mf-i{font-family:"DM Mono",monospace;font-size:9px;color:#8a8a7a}',
      '.cm-mf-dc{font-family:"DM Mono",monospace;font-size:9px;color:#c4a35a;font-weight:600}',
      '.cm-mf-ca{font-family:"DM Mono",monospace;font-size:10px;color:#c0392b;cursor:pointer;background:none;border:none}',
      '.cm-mf-ca:hover{opacity:.7}',
      '.cm-mf-r{display:flex;align-items:center;gap:8px}',
      '.cm-mf-sv{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:6px 16px;border-radius:3px;border:none;background:#c4a35a;color:#fff;cursor:pointer;font-weight:600;transition:opacity .12s}',
      '.cm-mf-sv:hover{opacity:.85}',
      '.cm-mf-sv:disabled{opacity:.4;cursor:not-allowed}',
      '.cm-mf-pub{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:6px 16px;border-radius:3px;border:none;background:#1a3a3a;color:#f0edd8;cursor:pointer;transition:opacity .12s}',
      '.cm-mf-pub:hover{background:#244a4a}',
      '.cm-mf-pub:disabled{opacity:.4;cursor:not-allowed}',
      '.cm-lock{font-size:11px;opacity:.4}',
      '.cm-lock-auto{font-family:"DM Mono",monospace;font-size:8px;color:#8a8a7a;background:#f0ede4;padding:1px 5px;border-radius:2px;letter-spacing:.03em}',
      '.cm-esel:disabled{opacity:.5;cursor:not-allowed;background:#f6f4ee}',
      '.cm-upload-wrap{display:flex;align-items:center;gap:6px}',
      '.cm-upload-val{font-family:"DM Mono",monospace;font-size:9px;color:#1a3a3a;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.cm-upload-clear{font-size:11px;color:#c0392b;background:none;border:none;cursor:pointer;padding:0 2px}',
      '.cm-upload-btn{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.04em;padding:3px 10px;border-radius:3px;border:1.5px solid #1a3a3a;background:#fff;color:#1a3a3a;cursor:pointer}',
      '.cm-upload-btn:hover{background:#1a3a3a;color:#f0edd8}',
      '.cm-scrape{padding:14px 20px;background:#faf9f5;border-bottom:1px solid #ece8dc}',
      '.cm-scrape-row{display:flex;align-items:center;gap:8px}',
      '.cm-scrape-ic{font-size:14px;flex:0 0 auto}',
      '.cm-scrape-in{flex:1 1 auto;font-family:"DM Sans",sans-serif;font-size:13px;padding:8px 11px;border:1.5px solid #d8d3c4;border-radius:5px;background:#fff;color:#1a293b;outline:none;transition:border-color .12s}',
      '.cm-scrape-in:focus{border-color:#5b7fff}',
      '.cm-scrape-in:disabled{opacity:.6;cursor:not-allowed}',
      '.cm-scrape-btn{flex:0 0 auto;font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;font-weight:600;padding:8px 16px;border-radius:5px;border:none;background:#5b7fff;color:#fff;cursor:pointer;transition:opacity .12s;display:inline-flex;align-items:center;gap:6px}',
      '.cm-scrape-btn:hover{opacity:.88}',
      '.cm-scrape-btn:disabled{opacity:.5;cursor:not-allowed}',
      '.cm-scrape-msg{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.02em;margin-top:7px;line-height:1.4}',
      '.cm-scrape-hint{color:#8a8a7a}',
      '.cm-scrape-ok{color:#1a3a3a}',
      '.cm-scrape-err{color:#c0392b}',
      '.cm-spin{width:11px;height:11px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;display:inline-block;animation:cm-spin .6s linear infinite}',
      '@keyframes cm-spin{to{transform:rotate(360deg)}}',
      '.cm-logo-pick{margin-top:11px}',
      '.cm-logo-pick-lbl{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.03em;color:#8a8a7a;margin-bottom:6px}',
      '.cm-logo-strip{display:flex;flex-wrap:wrap;gap:7px}',
      '.cm-logo-thumb{width:54px;height:54px;padding:3px;border:1.5px solid #d8d3c4;border-radius:5px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;overflow:hidden;transition:border-color .12s;position:relative}',
      '.cm-logo-thumb:hover{border-color:#5b7fff}',
      '.cm-logo-thumb img{max-width:100%;max-height:100%;object-fit:contain}',
      '.cm-logo-sel{border-color:#c4a35a;border-width:2.5px;background:#faf5e8}',
      '.cm-logo-busy{opacity:.55;position:relative}',
      '.cm-logo-spin{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:16px;color:#5b7fff;background:rgba(255,255,255,.7)}',
      '.cm-logo-err{border-color:#c94a4a}',
      '.cm-logo-x{position:absolute;top:2px;right:2px;width:14px;height:14px;border-radius:50%;background:#c94a4a;color:#fff;font-size:10px;line-height:14px;text-align:center}',
      '.cm-logo-errmsg{margin-top:6px;font-size:11px;color:#c94a4a}',
      '.cm-logo-variants{margin-top:10px;display:flex;align-items:center;gap:8px}',
      '.cm-logo-vbtn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px;border:1.5px solid #d8d3c4;border-radius:5px;background:#fff;cursor:pointer;font-family:"DM Mono",monospace;font-size:9px;color:#5a5a4a}',
      '.cm-logo-vbtn img{width:40px;height:40px;object-fit:contain}',
      '.cm-logo-vsel{border-color:#c4a35a;border-width:2px;background:#faf5e8}',
      '.cm-gi.cm-dirty .cm-esel{border-color:#c4a35a;background:#faf5e8}',
      // v1.0.16: create success card + inline error
      '.cm-success{display:flex;flex-direction:column;align-items:center;text-align:center;padding:44px 24px;gap:12px}',
      '.cm-success-ic{width:52px;height:52px;border-radius:50%;background:#1a3a3a;color:#fff;font-size:26px;display:flex;align-items:center;justify-content:center}',
      '.cm-success-t{font-size:18px;font-weight:700;color:#1a3a3a}',
      '.cm-success-s{font-size:12px;font-family:"DM Mono",monospace;color:#8a8a7a;line-height:1.5;max-width:380px}',
      '.cm-success-btn{margin-top:8px;font-family:"DM Mono",monospace;font-size:11px;letter-spacing:.04em;font-weight:600;padding:9px 28px;border-radius:5px;border:none;background:#5b7fff;color:#fff;cursor:pointer;transition:opacity .12s}',
      '.cm-success-btn:hover{opacity:.88}',
      '.cm-create-err{margin:0 0 14px;padding:10px 13px;border-radius:5px;background:#fdecea;border:1px solid #f0b4ad;color:#c0392b;font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.02em;line-height:1.45}'
    ].join('\n');
  }

  // ── Init ──
  render();
  console.log('\u{1F465} Client Manager v1.0.2 mounted — ' + CUSTOMERS.length + ' customers, ' + REF_DATA.majors.length + ' majors, ' + REF_DATA.subs.length + ' subs, ' + REF_DATA.directories.length + ' dirs, ' + REF_DATA.archives.length + ' archives');

  // ── v1.0.20: adgen deep-link consumer ──
  // The end-customers page's "Generate Ad" button links to
  // /title-admin/{slug}?adgenCust={id}&adgenName={name}. On arrival:
  // stash the customer (window + sessionStorage) for AdGen to consume,
  // then open Studio's Generate tab by clicking it once it exists.
  // NOTE: AdGen v0.1.0 does not yet READ the preselect — landing on the
  // right panel works today; auto-filling the customer inside AdGen is
  // a small future AdGen patch (reads window.IX_ADGEN_PRESELECT).
  (function () {
    var qs = new URLSearchParams(window.location.search);
    var custId = qs.get('adgenCust');
    if (!custId) return;
    var pre = { id: custId, name: qs.get('adgenName') || '' };
    window.IX_ADGEN_PRESELECT = pre;
    try { sessionStorage.setItem('ix-adgen-preselect', JSON.stringify(pre)); } catch (e) {}
    console.log('[CLIENT MGR] adgen deep-link — customer stashed:', pre.name || pre.id);

    var tries = 0;
    var t = setInterval(function () {
      tries++;
      // Try known tab hooks first, then fall back to a Studio tab whose
      // visible label is exactly "Generate".
      var btn = document.querySelector('[data-std-tab="adgen"], [data-tab="adgen"], [data-panel-key="adgen"]');
      if (!btn) {
        var cands = document.querySelectorAll('.std-tab, [class*="std-tab"], button, a');
        for (var i = 0; i < cands.length; i++) {
          if ((cands[i].textContent || '').trim() === 'Generate') { btn = cands[i]; break; }
        }
      }
      if (btn) {
        clearInterval(t);
        btn.click();
        console.log('[CLIENT MGR] adgen deep-link — Generate tab opened.');
      } else if (tries > 40) { // ~10s
        clearInterval(t);
        console.warn('[CLIENT MGR] adgen deep-link — Generate tab not found; customer remains stashed for manual open.');
      }
    }, 250);
  })();
});
