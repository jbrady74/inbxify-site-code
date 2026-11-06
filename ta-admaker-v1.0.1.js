/* ta-admaker-v1.0.1.js
   ════════════════════════════════════════════════════════════════
   INBXIFY TA Studio — AD MAKER (sub-tab)

   Turns an advertiser's print ad, a dropped file, an earlier version or
   nothing at all into a newsletter banner and sidebar, and lists every ad
   job waiting. Replaces ta-adreformat v0.6.0 (Ad Reformat) and ta-adgen
   v0.1.0 (Generate). Built to SS-Fork-B-Creative-Scoping-v0_4.md §04 and
   the "Ad Maker · UI mockup v0.3" artifact.

   Load in the TITLES-ADMIN Template page BODY custom code AFTER
   ix-ad-layouts-v1.0.1.js, ix-pdf-pager-v1.1.0.js, ix-info and
   ix-success-toast, and AFTER ta-studio (v1_4_13 dispatches
   std:panel:admaker). Companion: ta-admaker-v1.0.0.css (head).

   ── v1.0.1 · SS-Fork B · Creative S5 (6 Nov 2026, Jeff's rulings) ──
   v1.0.0 was never deployed; v1.0.1 replaces it.
     1 · NO PAIRING. Each ticked banner and each ticked sidebar saves as
         its OWN ADS version row (add-type Banner Ad or Sidebar Ad), named
         <Customer> · <Month Year>, v2, v3 … across both shapes. Shapes are
         made together because a banner needs a sidebar, but they are
         stored apart; the publisher and the advertiser look at banners
         and sidebars as two lists, and approval makes one of each
         current. A later TITLES-ADMIN setting may say a title wants its
         banner and sidebar to travel as a pair; nothing here assumes it.
     2 · AD NEEDED READS OBLIGATIONS FIRST. ix-sales GET /obligations?
         publisher=&title= (Memberstack login, as client-manager reads
         /sales): every Open obligation marked noCreative (the customer
         has no ad of that shape and the send is inside the title's
         lead) is an Ad needed item, due month first. Held-for slot
         notes from the unreleased plans then ADD the slot to the item
         for that customer and shape, or make an item of their own when
         no obligation names it. A sidebar is still inferred from a
         placed banner whose customer has no current sidebar.
     3 · Scenario 104 v3.6 contract: assetType 'ad', addType (the ADS
         add-type option id for the shape, read live), bannerImageSrc /
         sidebarImageSrc (the Uploadcare URL) beside the MEDIA ids,
         reformatRecipe, bannerApproval / sidebarApproval, and the row
         echoed as fieldData.

   ── v1.0.0 · SS-Fork B · Creative S5 (6 Nov 2026) ──
   SCREENS (header steps: Customer · Read · Drafts · Fine-tune · Save)
     1 Start      Needs action (left): Sent back, Ad needed, Note only,
                  nearest send date first. Right side empty until an item
                  is clicked or New creative. Customer first; then logo,
                  brand colours (or Needs you with two boxes), fonts and
                  versions; then the four ways to start.
     2 Read       A dropped PDF page is shown whole and Jeff draws the box
                  round the ad (or takes the whole page). ix-adreformat
                  v1.3.0 reads it with the PDF text (IxPdfPager.text) when
                  there is one. The check step: seven wording lines (gold
                  border and own cancel link when edited), the logo choice
                  (customer's file or print cut; print cut asks this
                  version only / replace the customer's file; no file →
                  print cut flagged "Check it" with a tick to save it), the
                  photo (Use it / Leave it out, sharpness per shape), the
                  fonts (the customer's, or 6 pairs with a tick to save the
                  pick), and the colours.
     3 Drafts     IxAdLayouts.choose then paint. Banners and sidebars are
                  shortlisted SEPARATELY (gold tick). Checks every draft
                  shares show once above the grid; the left-out line too.
     4 Fine-tune  Shortlist on the left (banners above sidebars), the shape
                  being edited in the middle, controls on the right: drag
                  the photo and Zoom, headline choice, text fields, size
                  sliders 70% to 140%. Checks update live. Jeff ticks 1 to
                  3 of each shape to save.
     5 Save       One ADS row per ticked shape (v1.0.1). Each row: paint at 2× →
                  Uploadcare → MEDIA (Scenario B Route 4) → ADS row with the
                  recipe (Scenario 104) → then customer writes once
                  (Scenario 114). Every step shows as it runs. Every write
                  is checked against its echo (TOAST-TRUTH).
     Fix          Opens the sent-back ADS row from its recipe, shows only
                  the returned shape, Save = "Replace banner/sidebar":
                  Scenario G action updateAd replaces that shape's link,
                  the recipe, and resets only its approval to Pending.

   DATA
     Customers      .customers-wrapper[data-item] (the page's hidden list):
                    data-id, data-name, data-logo-link, data-logo-link-light,
                    data-brand-color-main, data-brand-color-accent,
                    data-brand-font-heading, data-brand-font-body,
                    data-business-website. A missing ATTRIBUTE (not a
                    missing value) is reported, never guessed round.
     Ad needed      Data Worker /plans?titleAdminId= then /plan-board?planId=
                    for every unreleased, unlocked plan: slot notes
                    "Held for <Customer>" (banner), and banner slots whose
                    customer has no current sidebar (customers[].noSidebar).
     Sent back      ix-asset-list /list?type=ad&full=reformat-recipe: rows
                    whose shape approval reads the "Sent back" choice.
     Versions       the same list, per customer, newest first.
   NEEDS  TA_CONFIG: taItemId, titleSlug, adReformatWorker,
          objectIsolatorWorker, assetListUrl, planBoard or planList,
          makeConditioner (B), makeCreateAssets (104), makeUpdateCustomer
          (114), makeStudio (G), uploadcarePublicKey, elementTypes.ads.
          salesUrl (ix-sales, Memberstack login on the page).
          Scenario 104 v3.6 (addType, reformatRecipe, the approvals, echo).

   HARDCODING (provisional ids; the doc-maintenance chat numbers them)
     HC-P-SSB-8   Ad needed shapes come from TA_CONFIG.elementTypes.ads
                  (id → label). Resolved here.
     HC-P-SSB4-4  FONT_PAIRS: the six pairs offered when a customer has no
                  brand fonts. One place.
     HC-P-SSB5-6  HELD_RX: Ad needed parses the slot-note words "Held for
                  <Customer> · no <shape> yet" that ipp-revenue v1.7.4 writes
                  (HC-P-RV74-2). Fix: a structured held-for field.
     HC-P-SSB5-7  APPROVAL_WORDS: the ADS approval choices read by name,
                  Pending / Sent back / Approved (TA_CONFIG.adApprovalWords
                  overrides). Same class as HC-P-CM124-2.
     HC-P-SSB5-8  Scenario 104 payload keys (adName, customerId, customerName,
                  bannerImageMediaId, sidebarImageMediaId, reformatRecipe,
                  bannerApproval, sidebarApproval, titleAdminId) and the
                  Scenario G action "updateAd" with ADS camel keys.
     HC-P-SSB5-9  W: every word on the surface, one place.
     HC-P-SSB5-10 SOURCE_MAX 1600: the longest side of the picture sent to
                  the read Worker; READ_JPEG 0.92.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var VERSION = '1.0.1';
  var FILE = 'ta-admaker-v' + VERSION + '.js';
  var MOUNT_ID = 'std-admaker-mount';
  var PANEL = '[data-std-panel-body="admaker"]';

  function CFG() { return window.TA_CONFIG || {}; }
  function log() { try { console.log.apply(console, ['[AdMaker v' + VERSION + ']'].concat([].slice.call(arguments))); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  // ── Platform constants ───────────────────────────────────────
  var FONT_PAIRS = [                                                   // HC-P-SSB4-4
    { id: 'playfair-dmsans', head: 'Playfair Display', headWeight: 700, body: 'DM Sans' },
    { id: 'fraunces-worksans', head: 'Fraunces', headWeight: 700, body: 'Work Sans' },
    { id: 'manrope', head: 'Manrope', headWeight: 800, body: 'Manrope' },
    { id: 'bebas-inter', head: 'Bebas Neue', headWeight: 400, body: 'Inter' },
    { id: 'dmserif-nunito', head: 'DM Serif Display', headWeight: 400, body: 'Nunito' },
    { id: 'poppins', head: 'Poppins', headWeight: 700, body: 'Poppins' }
  ];
  var HELD_RX = /^Held for\s+(.+?)\s*(?:\u00b7|-|\u2013|\u2014)\s*no\s+(banner|sidebar|splash|text ad)\s+yet/i;   // HC-P-SSB5-6
  var APPROVAL_WORDS = Object.assign({ pending: 'Pending', sentBack: 'Sent back', approved: 'Approved' }, CFG().adApprovalWords || {});   // HC-P-SSB5-7
  var SHAPE_SLUG = { banner: { link: 'banner-ad-link', approval: 'banner-approval' }, sidebar: { link: 'sidebar-ad-link', approval: 'sidebar-approval' },
                     splash: { link: 'splash-ad-link--get', approval: 'splash-approval' }, text: { link: 'short-text', approval: 'text-ad-approval' } };
  var SOURCE_MAX = 1600, READ_JPEG = 0.92;                             // HC-P-SSB5-10
  var SLOTS = [['headline', 'Headline'], ['headline2', 'Second headline'], ['supporting', 'Supporting line'], ['button', 'Button'], ['phone', 'Phone'], ['website', 'Website'], ['small_print', 'Small print']];
  var PIECES = [['logo', 'Logo'], ['headline', 'Headline'], ['supporting', 'Supporting line'], ['button', 'Button'], ['phone', 'Phone']];
  var MAX_SAVE = 3;

  var W = {                                                            // HC-P-SSB5-9
    title: 'Ad Maker', needs: 'Needs action', sent: 'Sent back', needed: 'Ad needed', note: 'Note only',
    coming: 'Tool coming', empty: 'Pick an item on the left, or start a creative that isn\u2019t on the list.',
    newC: 'New creative', chooseCust: 'Choose a customer', custFirst: 'Choose the customer first.', howStart: 'Choose how to start.',
    startFrom: 'Start from', srcPrint: 'From a print issue', srcPrintSub: 'Arrives with Print Ads as Input (PA-0)',
    srcDrop: 'Drop a file', srcDropSub: 'A print PDF page, an ad image or an old banner.',
    srcVersion: 'Start from an existing version', srcNone: 'No print ad', srcNoneSub: 'Builds from the logo and brand colours only.',
    dropHere: 'Drop a PDF page, an ad image or an old banner here', orClick: 'or click to choose.',
    needsYou: 'Needs you', noColours: 'No brand colours on the customer. Type them, or leave them empty and a neutral colour is used.',
    readAd: 'Read the ad', showDrafts: 'Show drafts', confirm: 'Confirm and show drafts', tuneBtn: 'Fine-tune the shortlist',
    saveBtn: 'Save', back: 'Back', cancel: 'Cancel', pickAd: 'Draw a box round the ad', wholePage: 'Use the whole page',
    reading: 'Reading the ad', readingSub: 'The ix-adreformat Worker is reading the words, pictures and colours.',
    wording: 'Wording', wordingSub: 'check and fix before the drafts', edited: 'Edited by you',
    logo: 'Logo', custFile: 'Customer\u2019s file', fromAd: 'From this ad', cutFromPrint: 'Cut from print', versionOnly: 'This version only',
    replaceFile: 'Replace the customer\u2019s file', checkIt: 'Check it', noFile: 'No file on the customer.', keepLogo: 'Save it to the customer once checked',
    photo: 'Photo', useIt: 'Use it', leaveOut: 'Leave it out', noPhoto: 'No photo was found in the ad.',
    fonts: 'Fonts', custFonts: 'From the customer', pickPair: 'The customer has no brand fonts. Pick a pair.', keepFonts: 'Save this pair to the customer',
    colours: 'Brand colours', neutral: 'Missing, neutral used', fromCust: 'From the customer', setByYou: 'Set by you, saved to the customer on Save',
    drafts: 'Drafts', draftsSub: 'Click banners and sidebars to shortlist them.', shortlist: 'Shortlist', banners: 'Banners', sidebars: 'Sidebars',
    atLeastOne: 'Pick at least one of each.', saves: 'Saves', editing: 'Editing the', crop: 'Crop', dragPhoto: 'drag the photo', zoom: 'Zoom',
    resetCrop: 'Reset crop', separate: 'Separate the subject \u00b7 Coming', headline: 'Headline', sizes: 'Sizes', thisOnly: 'this shape only',
    checks: 'Checks', toSave: 'Save this one', saved: 'Saved', saving: 'Saving', keepOpen: 'Saving. Keep this tab open.',
    savedMsg: 'Saved. The publisher can now review the shapes.', again: 'Back to Needs action', pending: 'Pending',
    fixing: 'Fixing a sent-back shape', whatSave: 'What Save does', forRef: 'For reference: the',
    noteOnly: 'From a slot note', addInClients: 'Add the customer in CLIENTS', notInList: 'Not in the list?',
    sentNoNote: 'No note came with the send-back.', toolComing: 'are made in a tool that is coming soon. This item stays on the list until then, so nothing booked is missed.'
  };

  // ── State ────────────────────────────────────────────────────
  var S = {};
  function reset() {
    S = { screen: 'start', loading: { needs: true, ads: true }, needs: [], ads: null, adOpts: null, sel: null, custId: '', custPre: '',
          col: { main: '', accent: '' }, src: '', drop: null, page: 1, box: null, boxing: false, drawing: null,
          reading: false, read: null, srcCanvas: null, srcImg: null, words: {}, base: {}, from: {},
          logoUse: 'file', logoScope: 'version', logoKeep: false, printLogo: null, photo: null, usePhoto: true,
          fontPair: '', fontKeep: false, drafts: null, short: { banner: [], sidebar: [] }, ed: null, savePick: { banner: [], sidebar: [] },
          saving: null, fix: null, err: '' };
  }
  reset();

  // ── Customers from the page ──────────────────────────────────
  var CUST = [], CUST_ATTRS = { missing: [] };
  function readCustomers() {
    var want = ['logo-link', 'logo-link-light', 'brand-color-main', 'brand-color-accent', 'brand-font-heading', 'brand-font-body'];
    var els = document.querySelectorAll('.customers-wrapper[data-item]'), seen = {}, out = [];
    var first = els[0], miss = [];
    if (first) want.forEach(function (a) { if (!first.hasAttribute('data-' + a)) miss.push('data-' + a); });
    CUST_ATTRS.missing = miss;
    for (var i = 0; i < els.length; i++) {
      var el = els[i], d = el.dataset, id = (d.id || '').trim();
      if (!id || seen[id]) continue; seen[id] = 1;
      var g = function (a) { return String(el.getAttribute('data-' + a) || '').trim(); };
      out.push({ id: id, name: (d.name || '').trim() || id, logo: g('logo-link'), logoLight: g('logo-link-light'),
                 main: hex(g('brand-color-main')), accent: hex(g('brand-color-accent')),
                 fontHead: g('brand-font-heading'), fontBody: g('brand-font-body'),
                 website: g('business-website') || g('contact-website'), publisherId: (d.publisherId || '').trim() });
    }
    out.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
    CUST = out;
  }
  function hex(v) { var m = String(v || '').trim().match(/^#?([0-9a-f]{6})$/i); return m ? '#' + m[1].toUpperCase() : ''; }
  function cust() { for (var i = 0; i < CUST.length; i++) if (CUST[i].id === S.custId) return CUST[i]; return null; }
  function custById(id) { for (var i = 0; i < CUST.length; i++) if (CUST[i].id === id) return CUST[i]; return null; }
  function custByName(n) { n = String(n || '').trim().toLowerCase(); for (var i = 0; i < CUST.length; i++) if (CUST[i].name.toLowerCase() === n) return CUST[i]; return null; }
  function fontOf(v) { var m = String(v || '').trim().match(/^(.+?)\s+([1-9]00)$/); return m ? { family: m[1], weight: +m[2] } : (v ? { family: String(v).trim(), weight: 0 } : null); }

  // ── Worker base (same rule as client-manager: planBoard, else planList) ──
  function workerBase() { var c = CFG(); return String(c.planBoard || c.planList || '').replace(/\/(plan-board|plans)(\?.*)?$/, '').replace(/\/$/, ''); }
  function fetchJson(url, opts) {
    return fetch(url, opts).then(function (r) { return r.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {} return { ok: r.ok, status: r.status, j: j, t: t }; }); });
  }

  // ── Memberstack login token, as client-manager reads it (ix-sales needs it) ──
  function memberToken() {
    return new Promise(function (res) {
      var n = 0;
      (function wait() {
        var ms = window.$memberstackDom;
        if (ms && ms.getMemberCookie) { Promise.resolve(ms.getMemberCookie()).then(function (t) { res(t || ''); }, function () { res(''); }); return; }
        if (++n > 40) { res(''); return; }
        setTimeout(wait, 150);
      })();
    });
  }
  // ── Ad needed, part 1 (v1.0.1): open obligations with no creative, from ix-sales ──
  var OB_SHAPE = { banner: 'banner', sidebar: 'sidebar', splash: 'splash', 'sponsor band': 'banner', 'list block': 'text' };   // ix-sales slot-shape labels → shapes (its SHAPE_AD_TYPE)
  function loadObligations() {
    var u = String(CFG().salesUrl || '').replace(/\/+$/, ''), ta = CFG().taItemId, pub = CUST.length ? CUST[0].publisherId : '';
    if (!u) { S.obErr = 'TA_CONFIG.salesUrl is not set, so open obligations cannot be read.'; return Promise.resolve([]); }
    if (!pub) { S.obErr = 'The page names no publisher (data-publisher-id on .customers-wrapper), so obligations cannot be read.'; return Promise.resolve([]); }
    return memberToken().then(function (tok) {
      if (!tok) throw new Error('No Memberstack login on this page, so ix-sales cannot be asked for obligations.');
      return fetchJson(u + '/obligations?publisher=' + encodeURIComponent(pub) + '&title=' + encodeURIComponent(ta) + '&status=Open', { headers: { Authorization: 'Bearer ' + tok }, cache: 'no-store' });
    }).then(function (r) {
      if (!r.ok || !r.j || r.j.ok !== true) throw new Error((r.j && r.j.error) || ('ix-sales answered HTTP ' + r.status));
      S.obErr = '';
      return (r.j.obligations || []).filter(function (o) { return o.noCreative; }).map(function (o) {
        var shape = OB_SHAPE[String(o.shape || '').toLowerCase()] || 'banner', c = custById(o.customerId) || custByName(o.customer);
        return { kind: 'needed', id: 'ob-' + o.id, obId: o.id, title: o.customer || (c ? c.name : o.customerId), custId: c ? c.id : (o.customerId || ''), shape: shape, what: shapeLabel(shape),
                 m: 'Sold \u00b7 due ' + (o.dueMonth || '') + (o.nudge ? ' \u00b7 ' + o.nudge : ''), when: (o.dueMonth || '') + '-01', q: o.name || '', coming: !(shape === 'banner' || shape === 'sidebar') };
      });
    }).catch(function (e) { S.obErr = (e && e.message) || 'Obligations could not be read.'; return []; });
  }
  // ── Ad needed, part 2: every unreleased plan's Held-for notes and missing sidebars ──
  function loadNeeds() {
    var base = workerBase(), ta = CFG().taItemId;
    S.loading.needs = true; S.needs = [];
    if (!base || !ta) { S.loading.needs = 'TA_CONFIG has neither planBoard nor planList, or no taItemId, so Ad needed cannot be read.'; return Promise.resolve(); }
    var obP = loadObligations();
    return fetchJson(base + '/plans?titleAdminId=' + encodeURIComponent(ta))
      .then(function (r) {
        if (!r.ok || !r.j || r.j.ok !== true) throw new Error((r.j && r.j.error) || ('/plans answered HTTP ' + r.status));
        var plans = (r.j.plans || []).filter(function (p) { return !p.locked && !(p.publish && p.publish.released); });
        plans.sort(function (a, b) { return String(a.date || '').localeCompare(String(b.date || '')); });
        return Promise.all(plans.map(function (p) {
          return fetchJson(base + '/plan-board?planId=' + encodeURIComponent(p.id)).then(function (b) {
            if (!b.ok || !b.j || b.j.ok !== true) return { plan: p, err: (b.j && b.j.error) || ('HTTP ' + b.status) };
            return { plan: p, board: b.j };
          });
        }));
      })
      .then(function (boards) {
        var items = [], ids = {};
        boards.forEach(function (x) {
          var p = x.plan, bd = x.board; if (!bd) { items.push({ kind: 'needed', id: 'err-' + p.id, title: p.name, what: 'Could not read', m: x.err, err: true }); return; }
          var custs = {}; (bd.customers || []).forEach(function (c) { custs[c.name.toLowerCase()] = c; });
          var when = fmtDate(p.sendAt || p.date), slots = bd.slots || [];
          slots.forEach(function (sl) {
            var m = sl.note && HELD_RX.exec(sl.note);
            if (m) {
              var c = custByName(m[1]), shape = m[2].toLowerCase() === 'text ad' ? 'text' : m[2].toLowerCase();
              items.push({ kind: 'needed', id: 'held-' + sl.id, title: m[1], custId: c ? c.id : '', shape: shape, what: shapeLabel(shape),
                           m: p.name + ' \u00b7 ' + when, when: p.sendAt || p.date, q: 'Held on slot ' + sl.position, coming: !(shape === 'banner' || shape === 'sidebar') });
              return;
            }
            if (sl.asset && sl.asset.kind === 'ad' && sl.asset.customer) {
              var cc = custs[String(sl.asset.customer).toLowerCase()];
              if (cc && cc.noSidebar && !ids['sb-' + cc.id]) {
                ids['sb-' + cc.id] = 1;
                var cp = custByName(cc.name);
                items.push({ kind: 'needed', id: 'sb-' + cc.id + '-' + p.id, title: cc.name, custId: cp ? cp.id : '', shape: 'sidebar', what: 'Sidebar',
                             m: p.name + ' \u00b7 ' + when, when: p.sendAt || p.date, q: 'Banner placed at ' + sl.position + ', no sidebar yet', coming: false });
              }
            }
            if (sl.note && !m && /^(?!Held for)/i.test(sl.note) && (sl.assetType === 'ad' || /banner|sidebar/i.test(sl.note))) {
              items.push({ kind: 'note', id: 'note-' + sl.id, title: 'Slot ' + sl.position, custId: '', shape: 'banner', what: 'Note', m: p.name + ' \u00b7 ' + when, when: p.sendAt || p.date, q: sl.note, coming: false });
            }
          });
        });
        return obP.then(function (obs) {
          // obligations first; a Held-for or missing-sidebar item for the same customer and shape joins its obligation
          var merged = obs.slice();
          items.forEach(function (it) {
            var ob = it.kind === 'needed' && merged.filter(function (o) { return o.obId && o.custId && o.custId === it.custId && o.shape === it.shape; })[0];
            if (ob) { ob.q = (ob.q ? ob.q + ' \u00b7 ' : '') + it.q; ob.m = ob.m + ' \u00b7 ' + it.m; if (!ob.when || it.when < ob.when) ob.when = it.when; }
            else merged.push(it);
          });
          S.needs = merged;
          S.loading.needs = false;
        });
      })
      .catch(function (e) { S.loading.needs = (e && e.message) || 'Ad needed could not be read.'; });
  }
  function shapeLabel(shape) {                                          // HC-P-SSB-8 resolved: labels from TA_CONFIG.elementTypes.ads
    var ads = CFG().elementTypes && CFG().elementTypes.ads, id = { banner: 'banner-ad', sidebar: 'sidebar-ad', splash: 'splash-ad', text: 'text-ad' }[shape] || shape;
    var row = null;
    if (Array.isArray(ads)) ads.forEach(function (r) { if (r && r.id === id) row = r; });
    else if (ads && ads[id]) row = ads[id];
    var l = row ? String(row.l || row.label || '') : '';
    return (l ? l.replace(/\s*\(.*\)\s*$/, '').replace(/\s+Ad$/i, '') : shape[0].toUpperCase() + shape.slice(1));
  }
  function fmtDate(v) {
    if (!v) return '';
    var d = new Date(v); if (isNaN(d)) return String(v).slice(0, 10);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: CFG().titleTimezone || 'America/New_York' });
  }

  // ── ADS rows: sent back + versions ───────────────────────────
  function loadAds() {
    var u = CFG().assetListUrl, ta = CFG().taItemId;
    S.loading.ads = true;
    if (!u || !ta) { S.loading.ads = 'TA_CONFIG.assetListUrl or taItemId is missing, so Sent back and the versions cannot be read.'; return Promise.resolve(); }
    return fetchJson(String(u).replace(/\/$/, '') + '/list?type=ad&title=' + encodeURIComponent(ta) + '&full=reformat-recipe&fresh=1')
      .then(function (r) {
        if (!r.ok || !r.j || r.j.error) throw new Error((r.j && r.j.error) || ('ix-asset-list answered HTTP ' + r.status));
        S.ads = (r.j.items || []).filter(function (it) { return !it.isArchived && !it.isDraft; });
        S.adOpts = r.j.options || {};
        S.adTruncated = !!r.j.truncated;
        S.loading.ads = false;
      })
      .catch(function (e) { S.loading.ads = (e && e.message) || 'The ADS list could not be read.'; });
  }
  function optName(slug, id) { var m = S.adOpts && S.adOpts[slug]; return m && id ? (m[id] || '') : ''; }
  function optId(slug, name) {
    var m = S.adOpts && S.adOpts[slug]; if (!m) return '';
    var keys = Object.keys(m); for (var i = 0; i < keys.length; i++) if (String(m[keys[i]]).toLowerCase() === String(name).toLowerCase()) return keys[i];
    return '';
  }
  function adCustomerId(fd) { var v = fd['associated-advertiser']; if (Array.isArray(v)) v = v[0]; return v && typeof v === 'object' ? v.id : (v || ''); }
  function sentBackItems() {
    if (!S.ads) return [];
    var out = [];
    S.ads.forEach(function (it) {
      var fd = it.fieldData || {};
      ['banner', 'sidebar'].forEach(function (sh) {
        var ap = optName(SHAPE_SLUG[sh].approval, fd[SHAPE_SLUG[sh].approval]);
        if (ap && ap.toLowerCase() === APPROVAL_WORDS.sentBack.toLowerCase()) {
          var cid = adCustomerId(fd), c = custById(cid);
          out.push({ kind: 'sent', id: 'sent-' + it.id + '-' + sh, adId: it.id, title: c ? c.name : (fd.name || it.id), custId: cid, shape: sh, what: shapeLabel(sh),
                     q: String(fd['send-back-note'] || fd['feedback'] || '').trim() || W.sentNoNote, m: fd.name || '', when: it.lastUpdated || '',
                     picture: fd[SHAPE_SLUG[sh].link] || '', recipe: fd['reformat-recipe'] || '', row: it, coming: false });
        }
      });
    });
    out.sort(function (a, b) { return String(b.when).localeCompare(String(a.when)); });
    return out;
  }
  function versionsOf(custId) {
    if (!S.ads || !custId) return [];
    return S.ads.filter(function (it) { return adCustomerId(it.fieldData || {}) === custId && !(it.fieldData || {})['house-kind']; })
      .sort(function (a, b) { return String(b.createdOn || '').localeCompare(String(a.createdOn || '')); })
      .map(function (it) { var fd = it.fieldData || {}; return { id: it.id, name: fd.name || it.id, banner: fd['banner-ad-link'] || '', sidebar: fd['sidebar-ad-link'] || '', recipe: fd['reformat-recipe'] || '',
        bannerApproval: optName('banner-approval', fd['banner-approval']), sidebarApproval: optName('sidebar-approval', fd['sidebar-approval']), createdOn: it.createdOn || '' }; });
  }
  // "<Customer> · <Month Year>", then v2, v3 — counted against the rows that exist.
  function versionName(c, n) {
    var month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    var baseName = c.name + ' \u00b7 ' + month, have = versionsOf(c.id).map(function (v) { return v.name; });
    var k = 1; var name = baseName;
    for (var i = 0; i < n; i++) { while (have.indexOf(name) > -1) { k++; name = baseName + ' v' + k; } have.push(name); if (i < n - 1) { k++; name = baseName + ' v' + k; } }
    return name;
  }
  function needsAll() {
    var sent = sentBackItems(), needed = S.needs.filter(function (x) { return x.kind === 'needed'; }), notes = S.needs.filter(function (x) { return x.kind === 'note'; });
    var byWhen = function (a, b) { return String(a.when || '').localeCompare(String(b.when || '')); };
    needed.sort(byWhen); notes.sort(byWhen);
    return { sent: sent, needed: needed, note: notes, all: sent.concat(needed, notes) };
  }
  function item() { var all = needsAll().all; for (var i = 0; i < all.length; i++) if (all[i].id === S.sel) return all[i]; return null; }

  // ══════════════════════════════════════════════════════════════
  //  Shell: header (title flush left, ⓘ, steps), body, save bar
  // ══════════════════════════════════════════════════════════════
  function badge() {
    if (!(window.IxInfo && IxInfo.badge)) return '';
    return IxInfo.badge({ file: FILE, version: VERSION, title: W.title,
      blurb: 'Lists every ad job waiting (sent back, ad needed, note only) and makes a banner and sidebar Set from a print ad, a dropped file, an earlier version or nothing. Drafts are painted by ix-ad-layouts from the ten platform layouts; each saved option is its own ADS version row, Pending, with its recipe.',
      scenarios: [
        { name: 'Worker \u2014 ix-adreformat', note: 'TA_CONFIG.adReformatWorker: reads the ad (parts, plan, subject boxes)' },
        { name: 'Worker \u2014 ix-object-isolator', note: 'TA_CONFIG.objectIsolatorWorker: cuts a print logo onto transparency' },
        { name: 'Worker \u2014 ix-issue-data', note: '/plans and /plan-board: Ad needed' },
        { name: 'Worker \u2014 ix-asset-list', note: '/list?type=ad: sent back, versions, recipes' },
        { name: 'Scenario B \u2014 Route 4', note: 'TA_CONFIG.makeConditioner: MEDIA rows for the painted shapes' },
        { name: 'Scenario 104', note: 'TA_CONFIG.makeCreateAssets: the ADS version row with its recipe' },
        { name: 'Scenario 114', note: 'TA_CONFIG.makeUpdateCustomer: colours, fonts, a replaced logo' },
        { name: 'Scenario G \u2014 updateAd', note: 'TA_CONFIG.makeStudio: the send-back fix' }
      ],
      companions: 'ta-admaker-v' + VERSION + '.css \u00b7 ix-ad-layouts v' + (window.IxAdLayouts ? IxAdLayouts.VERSION : '?') + ' \u00b7 ix-pdf-pager v1.1.0 \u00b7 ix-info \u00b7 ix-buttons' });
  }
  function stepsHTML() {
    if (S.screen === 'fix' || S.screen === 'fixdone') return '<div class="am-steps"><div class="am-step now wide"><b>!</b>' + W.fixing + '</div></div>';
    var names = ['Customer', 'Read', 'Drafts', 'Fine-tune', 'Save'], k = { start: 1, read: 2, drafts: 3, tune: 4, save: 5, done: 6 }[S.screen] || 1;
    return '<div class="am-steps">' + names.map(function (n, i) {
      var st = i + 1 < k ? 'done' : i + 1 === k ? 'now' : '';
      return '<div class="am-step ' + st + '"><b>' + (i + 1 < k ? '\u2713' : (i + 1)) + '</b>' + n + '</div>';
    }).join('') + '</div>';
  }
  function shell(body, bar) {
    var m = document.getElementById(MOUNT_ID); if (!m) return;
    m.innerHTML = '<div class="am"><div class="am-head"><h2>' + W.title + '</h2>' + badge() + stepsHTML() + '</div>' +
      '<div class="am-body">' + body + '</div><div class="am-savebar">' + bar + '</div></div>';
  }
  function btn(act, label, kind, disabled, extra) {
    return '<button type="button" class="ix-btn ix-btn--' + (kind || 'primary') + '" data-act="' + act + '"' + (disabled ? ' disabled' : '') + (extra || '') +
      ' style="height:34px !important;padding:0 16px !important;font-size:13px !important">' + label + '</button>';
  }
  function ghost(act, label, data) { return '<button type="button" class="am-ghost" data-act="' + act + '"' + (data || '') + '>' + label + '</button>'; }
  function revert(act, data) { return '<button type="button" class="am-revert" data-act="' + act + '"' + (data || '') + '>cancel</button>'; }
  var FLAG_BG = { ok: '#E6F2EC', warn: '#FBF3DF', bad: '#FBEAE7' };
  function flag(level, text) { return '<span class="am-flag ' + level + '" style="background:' + (FLAG_BG[level] || FLAG_BG.warn) + ' !important">' + esc(text) + '</span>'; }
  function col(cls, style, inner) { return '<div class="am-col ' + (cls || '') + '" style="' + (style || '') + '">' + inner + '</div>'; }
  function colh(t, sub) { return '<div class="am-colh">' + esc(t) + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>'; }
  function inp(attrs, value, dirty) {
    return '<input class="am-inp' + (dirty ? ' am-dirty' : '') + '" type="text" ' + attrs + ' value="' + esc(value) + '"' +
      ' style="height:30px !important;padding:0 10px !important;font-size:12.5px !important;width:100% !important;box-sizing:border-box !important;margin:0 !important">';
  }

  // ══════════════════════════════════════════════════════════════
  //  1 · Start
  // ══════════════════════════════════════════════════════════════
  function vStart() {
    var N = needsAll(), it = item();
    var groups = [['sent', W.sent, N.sent], ['needed', W.needed, N.needed], ['note', W.note, N.note]];
    var left = colh(W.needs, (S.loading.needs === true || S.loading.ads === true) ? 'loading\u2026' : N.all.length + ' items');
    if (typeof S.loading.needs === 'string') left += '<div class="am-err">' + esc(S.loading.needs) + '</div>';
    if (typeof S.loading.ads === 'string') left += '<div class="am-err">' + esc(S.loading.ads) + '</div>';
    if (S.obErr) left += '<div class="am-err">' + esc(S.obErr) + '</div>';
    if (CUST_ATTRS.missing.length) left += '<div class="am-err">The page\u2019s .customers-wrapper has no ' + esc(CUST_ATTRS.missing.join(', ')) + '. Add the attribute' + (CUST_ATTRS.missing.length > 1 ? 's' : '') + ' on the TITLES-ADMIN Template.</div>';
    groups.forEach(function (g) {
      if (!g[2].length) return;
      left += '<div class="am-nag"><div class="am-nagh ' + g[0] + '">' + g[1] + '<span class="n">' + g[2].length + '</span></div>';
      g[2].forEach(function (x) {
        left += '<button type="button" class="am-na ' + x.kind + (S.sel === x.id ? ' on' : '') + (x.err ? ' err' : '') + '" data-na="' + esc(x.id) + '">' +
          (x.picture ? '<div class="th"><img src="' + esc(x.picture) + '" alt=""></div>' : '') +
          '<div class="am-nab"><h4>' + esc(x.title) + '</h4><div class="w">' + esc(x.what) + (x.coming ? '<span class="am-coming">' + W.coming + '</span>' : '') + '</div>' +
          (x.q ? '<div class="q" title="' + esc(x.q) + '">' + esc(x.q) + '</div>' : '') + '<div class="m">' + esc(x.m) + '</div></div></button>';
      });
      left += '</div>';
    });
    var right;
    if (!S.sel) right = '<div class="am-empty"><p>' + W.empty + '</p>' + btn('newC', W.newC, 'secondary') + '</div>';
    else if (it && it.coming) right = colh(it.title) + '<div class="am-job"><b>' + esc(it.what) + '</b> ' + esc(it.m) + '</div><div class="am-card"><div class="am-note">' + esc(it.what) + ' ads ' + W.toolComing + '</div></div>';
    else if (it && it.err) right = colh(it.title) + '<div class="am-err">' + esc(it.m) + '</div>';
    else right = rightCreative(it);
    var c = cust(), ready = !!(c && S.src && (S.src !== 'drop' || S.drop) && (S.src !== 'version' || S.fromVersion));
    var pend = (S.col.main ? 1 : 0) + (S.col.accent ? 1 : 0);
    var msg = pend ? '<b>' + pend + ' brand colour' + (pend > 1 ? 's' : '') + '</b> for the customer, saved with the version.' : S.sel ? (c ? W.howStart : W.custFirst) : '';
    var bar = '<div class="am-msg">' + msg + '</div><div class="am-grow"></div>' +
      (S.sel ? ghost('startCancel', W.cancel) : '') +
      (S.sel && !(it && (it.coming || it.err)) ? btn('toRead', S.src === 'none' ? W.showDrafts : W.readAd, 'primary', !ready) : '');
    shell(col('am-left', 'width:300px;flex:none', left) + col('', 'flex:1;min-width:0', right), bar);
  }
  function rightCreative(it) {
    var userPicked = S.custId !== S.custPre, c = cust();
    var h = colh(it ? (it.kind === 'note' ? W.noteOnly : it.title) : W.newC);
    if (it) h += '<div class="am-job"><b>' + esc(it.what) + '</b> ' + esc(it.m) + (it.q ? ' \u00b7 <span>' + esc(it.q) + '</span>' : '') + '</div>';
    h += '<div class="am-card"><div class="am-lab" style="width:330px">Customer' + (userPicked ? revert('custCancel') : '') + '</div>' +
      '<select class="am-sel' + (userPicked ? ' am-dirty' : '') + '" id="am-cust" style="width:330px !important;height:34px !important;font-size:13px !important;padding:0 28px 0 10px !important">' +
      '<option value=""' + (!S.custId ? ' selected' : '') + ' disabled>' + W.chooseCust + '</option>' +
      CUST.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === S.custId ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select>';
    if (it && it.kind === 'note') h += '<div class="am-srcl" style="margin-top:6px">' + W.notInList + ' <a href="#" class="am-up" data-act="clients">' + W.addInClients + '</a></div>';
    if (c) {
      var colourRow;
      if (c.main) colourRow = '<div class="am-sw">' + ['main', 'accent'].map(function (k) { return '<div class="am-swf"><div class="am-lab">' + (k === 'main' ? 'Brand Color Main' : 'Brand Color Accent') + '</div><div class="wrap"><i class="dot" style="background:' + (c[k] || '#fff') + ' !important"></i>' + inp('readonly', c[k] || '\u2014') + '</div></div>'; }).join('') + '</div>';
      else colourRow = '<div class="am-note">' + flag('warn', W.needsYou) + ' ' + esc(W.noColours) + '</div><div class="am-sw">' +
        ['main', 'accent'].map(function (k) { var v = S.col[k]; return '<div class="am-swf"><div class="am-lab">' + (k === 'main' ? 'Brand Color Main' : 'Brand Color Accent') + (v ? revert('colCancel', ' data-k="' + k + '"') : '') + '</div><div class="wrap"><i class="dot" style="background:' + (v || '#fff') + ' !important"></i>' + inp('data-col="' + k + '" placeholder="#000000" maxlength="7"', v, !!v) + '</div></div>'; }).join('') + '</div>';
      var logoRow = '<div class="am-logorow"><div class="am-logotile">' + (c.logo ? '<img src="' + esc(c.logo) + '" alt="">' : '<span class="am-note">No file</span>') + '</div><div>' +
        (c.logo ? flag('ok', 'Transparent file') : flag('warn', 'No file on the customer') + '<div class="am-srcl">You can keep the print cut on the Read step</div>') +
        (c.logoLight ? '<div class="am-srcl">Light logo on file</div>' : '') + '</div></div>';
      var fh = fontOf(c.fontHead), fb = fontOf(c.fontBody);
      var fontRow = (fh || fb) ? '<div class="am-note" style="color:var(--am-ink)">' + esc((fh ? fh.family + ' ' + (fh.weight || '') : '\u2014') + ' / ' + (fb ? fb.family + ' ' + (fb.weight || '') : '\u2014')) + '</div>' : '<div class="am-note">' + flag('warn', 'None') + ' Pick a pair on the Read step.</div>';
      var vs = versionsOf(c.id);
      h += '<div class="am-cust"><div class="k">' + W.logo + '</div><div>' + logoRow + '</div><div class="k">' + W.colours + '</div><div>' + colourRow + '</div>' +
        '<div class="k">' + W.fonts + '</div><div>' + fontRow + '</div><div class="k">Versions</div><div class="am-note" style="padding-top:6px">' + (vs.length ? esc(vs.slice(0, 6).map(function (v) { return v.name; }).join(', ')) + (vs.length > 6 ? ' +' + (vs.length - 6) : '') : 'None yet') + '</div></div>';
    }
    h += '</div>';
    if (c) {
      var vs2 = versionsOf(c.id);
      var tiles = [['print', W.srcPrint, W.srcPrintSub, true], ['drop', W.srcDrop, W.srcDropSub, false],
        ['version', W.srcVersion, vs2.length ? 'Loads a version: its recipe and pictures. Saves as a new version.' : 'No versions yet for this customer.', !vs2.length], ['none', W.srcNone, W.srcNoneSub, false]];
      h += '<div class="am-colh" style="margin-top:12px">' + W.startFrom + '</div><div class="am-srcs">' + tiles.map(function (t) {
        return '<button type="button" class="am-srct' + (t[3] ? ' dis' : '') + (S.src === t[0] ? ' picked' : '') + '"' + (t[3] ? ' disabled' : '') + ' data-src="' + t[0] + '"><b>' + t[1] + '</b><span>' + esc(t[2]) + '</span></button>'; }).join('') + '</div>';
      if (S.src === 'drop' && !S.drop) h += '<div class="am-drop" data-act="fileDrop" id="am-dropzone"><div class="t"><b>' + W.dropHere + '</b>, ' + W.orClick + ' ' + revert('srcCancel') + '</div><input type="file" id="am-file" accept="application/pdf,image/*" style="display:none"></div>';
      else if (S.src === 'drop') h += '<div class="am-drop"><div class="t"><b style="color:var(--am-ink)">' + esc(S.drop.name) + '</b> \u00b7 ' + (S.drop.pages ? S.drop.pages + ' page' + (S.drop.pages > 1 ? 's' : '') + ' \u00b7 you box the ad next' : 'picture') + ' ' + revert('srcCancel') + '</div></div>';
      else if (S.src === 'version') h += '<div class="am-card" style="margin-top:8px"><div class="am-lab">Version ' + revert('srcCancel') + '</div><div class="am-vers">' + vs2.map(function (v) {
        return '<button type="button" class="am-ver' + (S.fromVersion === v.id ? ' on' : '') + '" data-ver="' + esc(v.id) + '">' + (v.banner ? '<img src="' + esc(v.banner) + '" alt="">' : '<span class="am-note">No banner</span>') + '<span>' + esc(v.name) + (v.recipe ? '' : ' \u00b7 no recipe, re-read from the picture') + '</span></button>'; }).join('') + '</div></div>';
      else if (S.src) h += '<div style="margin-top:6px">' + revert('srcCancel') + '</div>';
    }
    return h;
  }

  // ══════════════════════════════════════════════════════════════
  //  Sources: a dropped file, a PDF page, a version, nothing
  // ══════════════════════════════════════════════════════════════
  function takeFile(file) {
    if (!file) return;
    S.drop = { name: file.name, file: file, pages: 0, key: null, img: null };
    S.box = null;
    if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) {
      if (!window.IxPdfPager || !IxPdfPager.load) { S.drop = null; toast('ix-pdf-pager v1.1.0 is not on the page, so a PDF cannot be opened.', 'err'); render(); return; }
      IxPdfPager.load(file).then(function (key) { S.drop.key = key; return IxPdfPager.pages(key); })
        .then(function (n) { S.drop.pages = n || 1; S.page = 1; render(); })
        .catch(function (e) { S.drop = null; toast('The PDF could not be opened: ' + ((e && e.message) || e), 'err'); render(); });
    } else {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { S.drop.img = img; render(); };
      img.onerror = function () { S.drop = null; toast('That file is not a picture or a PDF.', 'err'); render(); };
      img.src = url;
    }
    render();
  }
  // The page picture (for boxing) as an <img>: a rendered PDF page or the dropped picture.
  function pageImage() {
    if (!S.drop) return Promise.resolve(null);
    if (S.drop.img) return Promise.resolve(S.drop.img);
    if (S.drop.pageImg && S.drop.pageImgN === S.page) return Promise.resolve(S.drop.pageImg);
    return IxPdfPager.render(S.drop.key, S.page, 1800).then(function (dataUrl) {
      return new Promise(function (ok, bad) { var i = new Image(); i.onload = function () { S.drop.pageImg = i; S.drop.pageImgN = S.page; ok(i); }; i.onerror = function () { bad(new Error('The page did not render.')); }; i.src = dataUrl; });
    });
  }
  // Crop the source picture to the box (fractions of the picture) → canvas at full resolution.
  function cropToCanvas(img, box) {
    var W0 = img.naturalWidth || img.width, H0 = img.naturalHeight || img.height, b = box || { x: 0, y: 0, w: 1, h: 1 };
    var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(W0 * b.w)); cv.height = Math.max(1, Math.round(H0 * b.h));
    cv.getContext('2d').drawImage(img, Math.round(W0 * b.x), Math.round(H0 * b.y), cv.width, cv.height, 0, 0, cv.width, cv.height);
    return cv;
  }
  function scaled(cv, maxSide) {
    var k = Math.min(1, maxSide / Math.max(cv.width, cv.height)); if (k === 1) return cv;
    var o = document.createElement('canvas'); o.width = Math.round(cv.width * k); o.height = Math.round(cv.height * k);
    o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height); return o;
  }
  function subCanvas(cv, bbox, pad) {
    pad = pad || 0;
    var x = clamp(bbox[0] - pad, 0, 1), y = clamp(bbox[1] - pad, 0, 1), w = clamp(bbox[2] + pad * 2, 0, 1 - x), h = clamp(bbox[3] + pad * 2, 0, 1 - y);
    var o = document.createElement('canvas'); o.width = Math.max(1, Math.round(cv.width * w)); o.height = Math.max(1, Math.round(cv.height * h));
    o.getContext('2d').drawImage(cv, Math.round(cv.width * x), Math.round(cv.height * y), o.width, o.height, 0, 0, o.width, o.height); return o;
  }

  // ── The read: ix-adreformat v1.3.0 ─────────────────────────────
  function readAd() {
    var c = cust(), worker = CFG().adReformatWorker;
    if (!worker) { S.err = 'TA_CONFIG.adReformatWorker is missing.'; render(); return; }
    S.reading = true; S.err = ''; render();
    pageImage().then(function (img) {
      var box = S.box || { x: 0, y: 0, w: 1, h: 1 };
      S.srcCanvas = cropToCanvas(img, box);
      var small = scaled(S.srcCanvas, SOURCE_MAX), data = small.toDataURL('image/jpeg', READ_JPEG).split(',')[1];
      var textP = (S.drop && S.drop.key) ? IxPdfPager.text(S.drop.key, S.page, S.box || undefined).catch(function () { return null; }) : Promise.resolve(null);
      return textP.then(function (pdfText) {
        return fetchJson(worker, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: { media_type: 'image/jpeg', data: data }, pdfText: pdfText || undefined, customer: { name: c.name } }) });
      });
    }).then(function (r) {
      if (!r.ok || !r.j || r.j.ok !== true) throw new Error((r.j && r.j.error) || ('ix-adreformat answered HTTP ' + r.status));
      S.read = r.j; S.reading = false;
      takePlan(r.j); takeParts(r.j);
      render();
    }).catch(function (e) { S.reading = false; S.err = (e && e.message) || 'The read failed.'; render(); });
  }
  function takePlan(j) {
    S.words = {}; S.base = {}; S.from = {};
    (j.plan || []).forEach(function (l) { S.words[l.slot] = l.words || ''; S.base[l.slot] = l.words || ''; S.from[l.slot] = l.label || ''; });
    SLOTS.forEach(function (s) { if (S.words[s[0]] == null) { S.words[s[0]] = ''; S.base[s[0]] = ''; S.from[s[0]] = 'Empty'; } });
    if (!S.words.button) { S.words.button = ''; }
  }
  // Pictures out of the parts: the biggest photo/mascot/graphic, and the logo cut.
  function takeParts(j) {
    var parts = (j.parts && j.parts.images) || [], c = cust();
    var pics = parts.filter(function (p) { return /^(photo|mascot|graphic)$/.test(p.kind); }).sort(function (a, b) { return (b.bbox[2] * b.bbox[3]) - (a.bbox[2] * a.bbox[3]); });
    S.photo = null; S.usePhoto = true;
    if (pics.length) {
      var p = pics[0], cv = subCanvas(S.srcCanvas, p.bbox, 0);
      S.photo = { img: cv, kind: p.kind === 'photo' ? 'photo' : 'graphic', label: p.label, url: '', nativeWidth: cv.width, subject: p.subject || null, bbox: p.bbox };
    }
    var logos = parts.filter(function (p) { return p.kind === 'logo' || p.kind === 'badge'; }).sort(function (a, b) { return (b.bbox[2] * b.bbox[3]) - (a.bbox[2] * a.bbox[3]); });
    S.printLogo = null; S.logoUse = c.logo ? 'file' : 'print'; S.logoScope = 'version'; S.logoKeep = false;
    if (logos.length) {
      var l = logos[0], lc = subCanvas(S.srcCanvas, l.bbox, 0);
      S.printLogo = { img: lc, raw: lc, transparent: false, isolating: false };
      isolateLogo();   // onto transparency (ruled 5 Nov: all logos transparent)
    }
    S.adColours = (j.parts && j.parts.brand_colors) || [];
    if (!c.main && !S.col.main && S.adColours.length) { /* suggestion only: Jeff fills the boxes on Start */ }
    S.fontPair = (fontOf(c.fontHead) && fontOf(c.fontBody)) ? '' : (S.fontPair || FONT_PAIRS[0].id);
  }
  function isolateLogo() {
    var worker = CFG().objectIsolatorWorker, L = S.printLogo; if (!worker || !L) return;
    L.isolating = true;
    fetchJson(worker, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ return_base64: true, image: L.raw.toDataURL('image/png'), box_prompts: [[0, 0, L.raw.width, L.raw.height]] }) })
      .then(function (r) {
        if (!r.ok || !r.j || r.j.ok !== true || !r.j.data) throw new Error((r.j && r.j.error) || 'Isolation failed');
        return new Promise(function (ok, bad) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { bad(new Error('Could not decode the cut-out.')); }; i.src = 'data:' + (r.j.media_type || 'image/png') + ';base64,' + r.j.data; });
      })
      .then(function (img) { var cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; cv.getContext('2d').drawImage(img, 0, 0); L.img = cv; L.transparent = true; L.isolating = false; if (S.screen === 'read') render(); })
      .catch(function (e) { L.isolating = false; L.isoErr = (e && e.message) || 'Isolation failed'; if (S.screen === 'read') render(); });
  }
  // Start from a version: rebuild from the recipe, or read its banner picture.
  function loadVersion(v) {
    S.fromVersion = v.id;
    if (!v.recipe) return;
    try { S.verRecipe = IxAdLayouts.recipe.parse(v.recipe); } catch (e) { S.verRecipe = null; S.verRecipeErr = e.message; }
  }

  // ══════════════════════════════════════════════════════════════
  //  2 · Read: box the ad on a page, then the check step
  // ══════════════════════════════════════════════════════════════
  function needsBox() { return S.src === 'drop' && S.drop && !S.drop.img && !S.boxed; }
  function vRead() {
    var c = cust();
    if (needsBox()) {
      var left = colh('Page', S.drop.name + (S.drop.pages > 1 ? ' \u00b7 page ' + S.page + ' of ' + S.drop.pages : '')) +
        '<div class="am-pagebox" id="am-page"><div class="am-note" style="padding:20px">Rendering the page\u2026</div></div>' +
        (S.drop.pages > 1 ? '<div class="am-pager">' + ghost('pagePrev', '\u2039 Page') + '<span>' + S.page + ' / ' + S.drop.pages + '</span>' + ghost('pageNext', 'Page \u203a') + '</div>' : '');
      var mid = colh('Pick the ad') + '<div class="am-card"><div class="am-note" style="color:var(--am-ink);font-size:13px">' + W.pickAd + ' for ' + esc(c.name) + '. Drag on the page.</div>' +
        (S.box ? '<div style="margin-top:10px">' + flag('ok', 'Box drawn \u00b7 ' + Math.round(S.box.w * 100) + '% \u00d7 ' + Math.round(S.box.h * 100) + '% of the page') + ' ' + revert('boxCancel') + '</div>' : '') +
        '<div class="am-srcl" style="margin-top:10px">One ad fills the page? <a href="#" class="am-up" data-act="wholePage">' + W.wholePage + '</a></div></div>';
      shell(col('', 'width:460px;flex:none', left) + col('', 'flex:1', mid),
        '<div class="am-msg">' + (S.box ? 'Ready to read the boxed ad.' : 'Draw a box round the ad.') + '</div><div class="am-grow"></div>' + ghost('back', W.back) + btn('readBox', W.readAd, 'primary', !S.box));
      pageImage().then(function (img) {
        var el = document.getElementById('am-page'); if (!el || !img) return;
        el.innerHTML = '<img src="' + img.src + '" alt="Page" draggable="false">' + (S.box ? '<div class="bx on" style="left:' + S.box.x * 100 + '%;top:' + S.box.y * 100 + '%;width:' + S.box.w * 100 + '%;height:' + S.box.h * 100 + '%"></div>' : '');
        wireBoxDrawing(el);
      }).catch(function (e) { var el = document.getElementById('am-page'); if (el) el.innerHTML = '<div class="am-err">' + esc(e.message) + '</div>'; });
      return;
    }
    var srcCol = colh('Source', S.src === 'drop' ? S.drop.name : S.src === 'version' ? 'Version' : S.src === 'none' ? 'No print ad' : 'Print issue') +
      '<div class="am-srcimg" id="am-srcimg">' + (S.reading ? '<div class="am-scan"></div>' : '') + '</div>';
    if (S.reading) {
      shell(col('', 'width:260px;flex:none', srcCol) + col('', 'flex:1', colh(W.wording) + '<div class="am-prog"><b>' + W.reading + '</b><div class="am-note">' + W.readingSub + '</div><div class="bar"><i></i></div></div>'),
        '<div class="am-msg">Reading\u2026</div><div class="am-grow"></div>' + btn('x', W.confirm, 'primary', true));
      showSource(); return;
    }
    if (S.err) {
      shell(col('', 'width:260px;flex:none', srcCol) + col('', 'flex:1', colh(W.wording) + '<div class="am-err">' + esc(S.err) + '</div><div style="margin-top:10px">' + btn('readAgain', 'Read again', 'secondary') + '</div>'),
        '<div class="am-msg"></div><div class="am-grow"></div>' + ghost('back', W.back));
      showSource(); return;
    }
    var changed = SLOTS.filter(function (s) { return S.words[s[0]] !== S.base[s[0]]; }).length, rd = S.read && S.read.read;
    var how = rd ? '<div class="am-how' + (rd.method === 'pdf' ? ' exact' : '') + '"><b>' + (rd.method === 'pdf' ? 'PDF text, exact.' : 'Read by vision.') + '</b> <span class="am-note">' + esc(rd.note || '') + '</span></div>' : '';
    var warns = (S.read && S.read.warnings || []).map(function (w) { return '<div class="am-warnline">' + esc(w) + '</div>'; }).join('');
    var mid = colh(W.wording, W.wordingSub) + how + warns + '<div class="am-card" style="padding:2px 12px">' + SLOTS.map(function (s) {
      var k = s[0], ch = S.words[k] !== S.base[k];
      return '<div class="am-wline"><div class="am-lab">' + s[1] + '<em' + (ch ? ' class="ed"' : '') + '>' + (ch ? W.edited : esc(S.from[k] || '')) + '</em>' + (ch ? revert('wCancel', ' data-k="' + k + '"') : '') + '</div>' + inp('data-w="' + k + '" placeholder="None"', S.words[k], ch) + '</div>';
    }).join('') + '</div>';
    // logo
    var logo, L = S.printLogo;
    var printTile = L ? ('<div class="lt' + (L.transparent ? ' tr' : '') + '" id="am-plogo"></div>') : '<div class="lt"><span class="am-note">None found</span></div>';
    if (c.logo) {
      var pr = S.logoUse === 'print';
      logo = '<div class="am-lcmp"><button type="button" class="am-lopt' + (!pr ? ' on' : '') + '" data-logo="file"><div class="lt tr"><img src="' + esc(c.logo) + '" alt=""></div><div class="ln"><i></i>' + W.custFile + '</div><div class="ls">CUSTOMERS Logo Link</div></button>' +
        '<button type="button" class="am-lopt' + (pr ? ' on' : '') + '" data-logo="print"' + (L ? '' : ' disabled') + '>' + printTile + '<div class="ln"><i></i>' + W.fromAd + '</div><div class="ls">' + (L ? (L.isolating ? 'Cutting onto transparency\u2026' : L.transparent ? W.cutFromPrint : (L.isoErr ? 'Not transparent: ' + L.isoErr : W.cutFromPrint)) : 'No logo found in the ad') + '</div></button></div>' +
        (pr ? '<div class="am-seg"><button type="button" class="' + (S.logoScope === 'version' ? 'on' : '') + '" data-scope="version">' + W.versionOnly + '</button><button type="button" class="' + (S.logoScope === 'replace' ? 'on' : '') + '" data-scope="replace">' + W.replaceFile + '</button></div><div style="margin-top:4px">' + revert('logoCancel') + '</div>' : '');
    } else {
      logo = '<div class="am-logorow"><div class="am-lopt on" style="width:150px;cursor:default">' + printTile + '<div class="ln">' + (L ? W.fromAd : 'No logo') + '</div></div><div>' + flag('warn', W.checkIt) + '<div class="am-srcl" style="margin-top:4px">' + W.noFile + (L ? '' : ' The business name is drawn instead.') + '</div></div></div>' +
        (L ? '<label class="am-tick"><input type="checkbox" id="am-logokeep"' + (S.logoKeep ? ' checked' : '') + '> ' + W.keepLogo + '</label>' : '');
    }
    // photo
    var ph = '<div class="am-sec">' + W.photo + '</div>';
    if (S.photo) {
      var sh = ['banner', 'sidebar'].map(function (shape) { var r = sharpFor(shape); return flag(r[0], shapeLabel(shape) + ': ' + r[1]); }).join(' ');
      ph += '<div style="display:flex;gap:10px"><div class="am-lopt" style="width:96px;padding:4px;cursor:default"><div class="lt" style="height:64px;padding:0" id="am-photo-th"></div></div><div style="flex:1"><div class="am-flags">' + sh + (S.photo.subject ? flag('ok', 'Subject found') : flag('warn', 'No subject box')) + '</div>' +
        '<div class="am-seg"><button type="button" class="' + (S.usePhoto ? 'on' : '') + '" data-photo="1">' + W.useIt + '</button><button type="button" class="' + (!S.usePhoto ? 'on' : '') + '" data-photo="0">' + W.leaveOut + '</button></div></div></div>';
    } else ph += '<div class="am-note">' + W.noPhoto + ' Logo-led and brand-block layouts only.</div>';
    // fonts
    var fh = fontOf(c.fontHead), fb = fontOf(c.fontBody), fonts = '<div class="am-sec">' + W.fonts + '</div>';
    if (fh && fb) fonts += '<div class="am-note" style="color:var(--am-ink)">' + esc(fh.family + ' ' + fh.weight + ' / ' + fb.family + ' ' + fb.weight) + '</div><div class="am-srcl">' + W.custFonts + '</div>';
    else fonts += '<div class="am-note">' + esc(W.pickPair) + '</div><div class="am-pairs">' + FONT_PAIRS.map(function (p) {
      return '<button type="button" class="am-pair' + (S.fontPair === p.id ? ' on' : '') + '" data-pair="' + p.id + '"><span style="font-family:\'' + p.head + '\';font-weight:' + p.headWeight + '">Aa Headline</span><small style="font-family:\'' + p.body + '\'">Body text 123</small></button>'; }).join('') + '</div>' +
      '<label class="am-tick"><input type="checkbox" id="am-fontkeep"' + (S.fontKeep ? ' checked' : '') + '> ' + W.keepFonts + '</label>';
    // colours
    var cl = colours(), colsH = '<div class="am-sec">' + W.colours + '</div><div style="display:flex;gap:8px;align-items:center">' +
      (cl.missing ? flag('warn', W.neutral) : '<i class="am-dot" style="background:' + cl.main + ' !important"></i><i class="am-dot" style="background:' + (cl.accent || '#fff') + ' !important"></i><span class="am-note">' + (c.main ? W.fromCust : W.setByYou) + '</span>') + '</div>' +
      (S.adColours && S.adColours.length && !c.main ? '<div class="am-sug">In the ad: ' + S.adColours.map(function (x) { return '<button type="button" style="background:' + esc(x) + ' !important" title="' + esc(x) + '" data-sug="' + esc(x) + '"></button>'; }).join('') + '<span>Click to fill Main, then Accent.</span></div>' : '');
    var right = colh('Logo, photo, fonts and colours') + '<div class="am-card"><div class="am-sec" style="margin-top:0">' + W.logo + '</div>' + logo + ph + fonts + colsH + '</div>';
    shell(col('', 'width:250px;flex:none', srcCol) + col('', 'flex:1;min-width:0', mid) + col('', 'width:320px;flex:none', right),
      '<div class="am-msg">' + (changed ? '<b>' + changed + ' wording change' + (changed > 1 ? 's' : '') + '</b>. Every draft uses the wording as confirmed here.' : 'Check the wording, logo, photo and fonts. Every draft uses what you confirm here.') + '</div><div class="am-grow"></div>' + ghost('back', W.back) + btn('toDrafts', W.confirm));
    showSource();
    var pt = document.getElementById('am-plogo'); if (pt && L) { pt.innerHTML = ''; pt.appendChild(thumbOf(L.img, 46)); }
    var pht = document.getElementById('am-photo-th'); if (pht && S.photo) { pht.innerHTML = ''; pht.appendChild(thumbOf(S.photo.img, 64)); }
  }
  function showSource() {
    var el = document.getElementById('am-srcimg'); if (!el) return;
    if (S.srcCanvas) { var t = thumbOf(S.srcCanvas, 0, 226); el.insertBefore(t, el.firstChild); }
    else if (S.src === 'none') el.innerHTML = '<div class="am-note" style="padding:14px">No print ad. The drafts are built from the logo, the brand colours and the wording you type.</div>';
    else if (S.src === 'version' && S.verImg) { var t2 = thumbOf(S.verImg, 0, 226); el.insertBefore(t2, el.firstChild); }
  }
  function thumbOf(cv, h, w) {
    var img = document.createElement('img');
    img.src = cv.toDataURL ? cv.toDataURL('image/png') : cv.src;
    if (h) { img.style.maxHeight = h + 'px'; } if (w) { img.style.width = w + 'px'; } img.style.maxWidth = '100%'; img.style.display = 'block';
    return img;
  }
  function sharpFor(shape) {
    if (!S.photo || !window.IxAdLayouts) return ['warn', '?'];
    var SH; try { SH = IxAdLayouts.shapes()[shape]; } catch (e) { return ['warn', 'no size']; }
    var need = SH.w * IxAdLayouts.CONST.SHARP_FACTOR * 0.55, have = S.photo.nativeWidth || 0, r = have / need;
    return r >= 1 ? ['ok', 'Sharp'] : r >= IxAdLayouts.CONST.SOFT_RATIO ? ['warn', 'Soft'] : ['bad', 'Too small'];
  }
  function colours() { var c = cust() || {}; var main = c.main || S.col.main, accent = c.accent || S.col.accent; return { main: main, accent: accent, missing: !main }; }
  function wireBoxDrawing(el) {
    var img = el.querySelector('img'); if (!img) return;
    var start = null, bx = null;
    function pos(e) { var r = img.getBoundingClientRect(), p = e.touches ? e.touches[0] : e; return { x: clamp((p.clientX - r.left) / r.width, 0, 1), y: clamp((p.clientY - r.top) / r.height, 0, 1) }; }
    el.addEventListener('mousedown', function (e) { if (e.button !== 0) return; e.preventDefault(); start = pos(e); var old = el.querySelector('.bx'); if (old) old.remove(); bx = document.createElement('div'); bx.className = 'bx on'; el.appendChild(bx); });
    window.addEventListener('mousemove', function (e) { if (!start || !bx) return; var p = pos(e), x = Math.min(start.x, p.x), y = Math.min(start.y, p.y), w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y); bx.style.left = x * 100 + '%'; bx.style.top = y * 100 + '%'; bx.style.width = w * 100 + '%'; bx.style.height = h * 100 + '%'; bx._b = { x: x, y: y, w: w, h: h }; });
    window.addEventListener('mouseup', function () { if (!start) return; if (bx && bx._b && bx._b.w > 0.02 && bx._b.h > 0.02) { S.box = bx._b; render(); } else if (bx) bx.remove(); start = null; bx = null; });
  }

  // ══════════════════════════════════════════════════════════════
  //  The layout input (what ix-ad-layouts paints from)
  // ══════════════════════════════════════════════════════════════
  var IMG_CACHE = {};
  function loadImg(url) {
    if (!url) return Promise.resolve(null);
    if (IMG_CACHE[url]) return Promise.resolve(IMG_CACHE[url]);
    return new Promise(function (ok) { var i = new Image(); i.crossOrigin = 'anonymous'; i.onload = function () { IMG_CACHE[url] = i; ok(i); }; i.onerror = function () { ok(null); }; i.src = url; });
  }
  function fontsFor() {
    var c = cust() || {}, fh = fontOf(c.fontHead), fb = fontOf(c.fontBody);
    if (fh && fb) return { head: fh.family, headWeight: fh.weight || 700, body: fb.family, from: 'customer' };
    var p = FONT_PAIRS.filter(function (x) { return x.id === S.fontPair; })[0] || FONT_PAIRS[0];
    return { head: p.head, headWeight: p.headWeight, body: p.body, from: 'pair' };
  }
  function layoutInput() {
    var c = cust(), cl = colours(), f = fontsFor();
    return Promise.all([loadImg(c.logo), loadImg(c.logoLight)]).then(function (imgs) {
      var useFile = c.logo && S.logoUse === 'file' && imgs[0];
      var logo = useFile ? { main: imgs[0], light: imgs[1], source: 'customer', url: c.logo, lightUrl: c.logoLight || '', nativeWidth: imgs[0].naturalWidth, lightNativeWidth: imgs[1] ? imgs[1].naturalWidth : null }
        : (S.printLogo ? { main: S.printLogo.img, light: null, source: 'print', url: S.printLogoUrl || '', lightUrl: '', nativeWidth: S.printLogo.img.width } : null);
      var photo = (S.photo && S.usePhoto) ? { img: S.photo.img, kind: S.photo.kind, url: S.photo.url || '', nativeWidth: S.photo.nativeWidth, subject: S.photo.subject || null, focus: null } : null;
      var w = {}; SLOTS.forEach(function (s) { w[s[0]] = S.words[s[0]] || ''; });
      return { name: c.name, wording: w, headlineSlot: (S.ed && S.ed.head) || 'headline', colors: { main: cl.main, accent: cl.accent }, fonts: { head: f.head, headWeight: f.headWeight, body: f.body }, logo: logo, photo: photo };
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  3 · Drafts
  // ══════════════════════════════════════════════════════════════
  function makeDrafts() {
    S.drafts = null; S.short = { banner: [], sidebar: [] }; S.draftErr = '';
    return layoutInput().then(function (input) {
      S.input = input;
      var ch = IxAdLayouts.choose(input);
      var all = ch.banner.concat(ch.sidebar);
      return Promise.all(all.map(function (sr) { return IxAdLayouts.paint(input, sr).then(function (p) { return { sr: sr, paint: p }; }); })).then(function (res) {
        S.drafts = { banner: res.filter(function (x) { return x.sr.shape === 'banner'; }), sidebar: res.filter(function (x) { return x.sr.shape === 'sidebar'; }), leftOut: ch.leftOut };
      });
    }).catch(function (e) { S.draftErr = (e && e.message) || 'The drafts could not be painted.'; });
  }
  function sharedChecks() {
    var all = S.drafts.banner.concat(S.drafts.sidebar), first = all[0]; if (!first) return [];
    var ids = {}; first.paint.checks.forEach(function (c) { ids[c.id] = c; });
    all.forEach(function (d) { var have = {}; d.paint.checks.forEach(function (c) { have[c.id] = 1; }); Object.keys(ids).forEach(function (k) { if (!have[k]) delete ids[k]; }); });
    return Object.keys(ids).map(function (k) { return ids[k]; });
  }
  function vDrafts() {
    if (!S.drafts && !S.draftErr) { shell(col('', 'flex:1', colh(W.drafts) + '<div class="am-prog"><b>Painting the drafts</b><div class="am-note">Every layout that suits this ad, at 2\u00d7.</div><div class="bar"><i></i></div></div>'), '<div class="am-msg">Painting\u2026</div><div class="am-grow"></div>' + ghost('back', W.back)); return; }
    if (S.draftErr) { shell(col('', 'flex:1', colh(W.drafts) + '<div class="am-err">' + esc(S.draftErr) + '</div>'), '<div class="am-msg"></div><div class="am-grow"></div>' + ghost('back', W.back)); return; }
    var nb = S.short.banner.length, ns = S.short.sidebar.length, shared = sharedChecks(), sharedIds = {}; shared.forEach(function (c) { sharedIds[c.id] = 1; });
    var top = '<div class="am-shared">' + shared.map(function (c) { return flag(c.level, c.text); }).join('') + '<span class="am-note">' + esc(S.drafts.leftOut) + '</span></div>';
    var grid = function (shape) {
      return '<div class="am-dsec">' + (shape === 'banner' ? W.banners : W.sidebars) + ' <span>' + S.drafts[shape].length + '</span></div><div class="am-dgrid ' + shape + '">' + S.drafts[shape].map(function (d, i) {
        var on = S.short[shape].indexOf(i) > -1, L = IxAdLayouts.LAYOUTS[d.sr.layout];
        return '<div class="am-draft' + (on ? ' on' : '') + '" data-pk="' + shape + ':' + i + '"><div class="ph"><b>' + esc(d.sr.layout + ' \u00b7 ' + L.name) + '</b>' + (d.sr.crop && d.sr.crop.mode !== 'whole' ? '<span class="crop">' + (d.sr.crop.mode === 'close' ? 'Close' : 'Wide') + '</span>' : '') + '</div><div class="pic" data-cv="' + shape + ':' + i + '"></div><div class="chks">' + d.paint.checks.filter(function (c) { return !sharedIds[c.id]; }).map(function (c) { return flag(c.level, c.text); }).join('') + '</div></div>';
      }).join('') + '</div>';
    };
    shell(col('', 'flex:1;min-width:0', colh(W.drafts, W.draftsSub) + top + grid('banner') + grid('sidebar')),
      '<div class="am-msg">' + W.shortlist + ': <b>' + nb + ' banner' + (nb === 1 ? '' : 's') + ', ' + ns + ' sidebar' + (ns === 1 ? '' : 's') + '</b>' + (nb && ns ? '' : '. ' + W.atLeastOne) + '</div><div class="am-grow"></div>' + ghost('back', W.back) + btn('toTune', W.tuneBtn, 'primary', !(nb && ns)));
    document.querySelectorAll('#' + MOUNT_ID + ' [data-cv]').forEach(function (el) {
      var p = el.getAttribute('data-cv').split(':'), d = S.drafts[p[0]][+p[1]]; el.appendChild(canvasView(d.paint.canvas, p[0] === 'banner' ? 300 : 192));
    });
  }
  function canvasView(cv, w) { var i = document.createElement('img'); i.src = cv.toDataURL('image/png'); i.style.width = w + 'px'; i.style.display = 'block'; i.draggable = false; return i; }

  // ══════════════════════════════════════════════════════════════
  //  4 · Fine-tune. Each shortlisted shape keeps its own recipe;
  //  wording is shared. Checks repaint live.
  // ══════════════════════════════════════════════════════════════
  function initTune() {
    var mk = function (shape) { return S.short[shape].map(function (i) { var d = S.drafts[shape][i]; return { sr: JSON.parse(JSON.stringify(d.sr)), sr0: JSON.parse(JSON.stringify(d.sr)), paint: d.paint }; }); };
    S.ed = { B: mk('banner'), S: mk('sidebar'), sel: 'banner', b: 0, s: 0, head: S.input.headlineSlot || 'headline', head0: S.input.headlineSlot || 'headline', w0: JSON.parse(JSON.stringify(S.words)) };
    S.savePick = { banner: S.ed.B.length ? [0] : [], sidebar: S.ed.S.length ? [0] : [] };
  }
  function curShape(shape) { var e = S.ed; return shape === 'banner' ? e.B[e.b] : e.S[e.s]; }
  function changeCount() {
    var e = S.ed, n = 0; if (!e) return 0;
    if (e.head !== e.head0) n++;
    ['supporting', 'button', 'phone', 'website', 'small_print'].forEach(function (k) { if (S.words[k] !== e.w0[k]) n++; });
    e.B.concat(e.S).forEach(function (x) { if (JSON.stringify(x.sr) !== JSON.stringify(x.sr0)) n++; });
    return n;
  }
  var paintTimer = null;
  function repaint(x, shape) {
    if (paintTimer) clearTimeout(paintTimer);
    paintTimer = setTimeout(function () {
      layoutInput().then(function (input) { S.input = input; return IxAdLayouts.paint(input, x.sr); }).then(function (p) { x.paint = p; drawStage(); }).catch(function (e) { toast(e.message, 'err'); });
    }, 60);
  }
  function repaintAll() {
    layoutInput().then(function (input) { S.input = input; return Promise.all(S.ed.B.concat(S.ed.S).map(function (x) { return IxAdLayouts.paint(input, x.sr).then(function (p) { x.paint = p; }); })); }).then(function () { drawStage(); drawShortlist(); }).catch(function (e) { toast(e.message, 'err'); });
  }
  function sizesHTML(x) {
    return PIECES.map(function (p) { var k = p[0], v = x.sr.sizes[k] || 1, ch = Math.abs(v - 1) > 0.001;
      return '<div class="am-szr' + (ch ? ' dirty' : '') + '"><span class="n">' + p[1] + '</span><input type="range" min="' + IxAdLayouts.CONST.SIZE_MIN + '" max="' + IxAdLayouts.CONST.SIZE_MAX + '" step="0.05" value="' + v + '" data-sz="' + k + '"><span class="v">' + Math.round(v * 100) + '%</span>' + (ch ? revert('szCancel', ' data-k="' + k + '"') : '<span class="am-revert"></span>') + '</div>'; }).join('');
  }
  function vTune() {
    var e = S.ed, fix = S.screen === 'fix', target = fix ? S.fix.shape : e.sel, x = curShape(target);
    if (fix) e.sel = target;
    var fld = function (k, label) { var ch = S.words[k] !== e.w0[k]; return '<div class="am-ctl"><div class="am-lab">' + label + (ch ? revert('fCancel', ' data-k="' + k + '"') : '') + '</div>' + inp('data-f="' + k + '"', S.words[k], ch) + '</div>'; };
    var crCh = JSON.stringify(x.sr.crop) !== JSON.stringify(x.sr0.crop), hasPhoto = !!(S.input && S.input.photo) && x.sr.crop && x.sr.crop.mode !== 'whole';
    var left;
    if (fix) {
      var other = target === 'sidebar' ? 'banner' : 'sidebar';
      left = colh(W.sent) + '<div class="am-card"><div class="am-note" style="color:var(--am-ink);font-size:12.5px;line-height:1.45">' + esc(S.fix.q) + '</div><div class="am-note" style="margin-top:6px">' + esc(S.fix.m) + '</div></div>' +
        '<div class="am-card" style="margin-top:10px"><div class="am-lab">' + W.whatSave + '</div><div class="am-note">Replaces the ' + target + ' and resets its approval to ' + APPROVAL_WORDS.pending + '. The ' + other + ' is not touched.</div></div>' +
        (S.fix.otherUrl ? '<div class="am-sec">' + W.forRef + ' ' + other + '</div><img src="' + esc(S.fix.otherUrl) + '" alt="" style="width:100%;border-radius:4px"><div class="am-srcl">' + esc(S.fix.otherApproval || '') + '</div>' : '');
    } else {
      var li = function (shape, arr, cur) { return arr.map(function (y, i) { var on = S.savePick[shape].indexOf(i) > -1;
        return '<div class="am-sli' + (i === cur ? ' on' : '') + '" data-sl="' + shape + ':' + i + '"><div class="pic" data-slcv="' + shape + ':' + i + '"></div><div class="cap"><span>' + esc(y.sr.layout + (y.sr.crop && y.sr.crop.mode !== 'whole' ? ', ' + (y.sr.crop.mode === 'close' ? 'Close' : 'Wide') : '')) + '</span>' +
          '<label class="am-tick small" title="' + W.toSave + '"><input type="checkbox" data-save="' + shape + ':' + i + '"' + (on ? ' checked' : '') + '> ' + W.saves + '</label></div></div>'; }).join(''); };
      left = colh(W.shortlist, 'tick up to ' + MAX_SAVE + ' of each; each saves as its own version') + '<div class="am-slh">' + W.banners + ' <span>' + e.B.length + '</span></div>' + li('banner', e.B, e.b) + '<div class="am-slh" style="margin-top:10px">' + W.sidebars + ' <span>' + e.S.length + '</span></div>' + li('sidebar', e.S, e.s);
    }
    var stage = (fix ? '' : '<div class="am-shapel"><b>Banner</b> 700\u00d7235 \u00b7 shown at 80%</div><div class="am-shapebox' + (e.sel === 'banner' ? ' edit' : '') + '" data-shape="banner" id="am-stB"></div><div class="am-shapel" style="margin-top:14px"><b>Sidebar</b> 480\u00d7400 \u00b7 shown at 50%</div><div style="display:flex;gap:14px;align-items:flex-start"><div class="am-shapebox' + (e.sel === 'sidebar' ? ' edit' : '') + '" data-shape="sidebar" id="am-stS"></div><div style="flex:1;min-width:0"><div class="am-card" style="padding:4px 10px" id="am-checks"></div></div></div>')
      || ('<div class="am-shapel"><b>' + shapeLabel(target) + '</b> ' + (target === 'banner' ? '700\u00d7235 \u00b7 shown at 80%' : '480\u00d7400 \u00b7 actual size') + '</div><div class="am-shapebox edit" data-shape="' + target + '" id="' + (target === 'banner' ? 'am-stB' : 'am-stS') + '"></div><div style="margin-top:14px"><div class="am-card" style="padding:4px 12px" id="am-checks"></div></div>');
    var headCh = e.head !== e.head0;
    var panel = colh(W.editing + ' ' + e.sel) +
      (hasPhoto ? '<div class="am-ctl"><div class="am-lab">' + W.crop + '<span class="am-light">' + W.dragPhoto + '</span>' + (crCh ? '<button type="button" class="am-revert" data-act="cropCancel">' + W.resetCrop + '</button>' : '') + '</div><div class="am-zoomwrap' + (crCh ? ' am-dirty' : '') + '"><div class="am-zoomrow"><span class="am-note">' + W.zoom + '</span><input type="range" min="1" max="' + IxAdLayouts.CONST.ZOOM_MAX + '" step="0.05" value="' + x.sr.crop.zoom + '" id="am-zoom"><span class="v">' + (+x.sr.crop.zoom).toFixed(2) + '\u00d7</span></div></div><button type="button" class="am-sepbtn" disabled>' + W.separate + '</button></div>' : '') +
      '<div class="am-ctl"><div class="am-lab">' + W.headline + (headCh ? revert('headCancel') : '') + '</div><select class="am-sel' + (headCh ? ' am-dirty' : '') + '" id="am-head" style="height:32px !important;font-size:12.5px !important;width:100% !important"><option value="headline"' + (e.head === 'headline' ? ' selected' : '') + '>' + esc(S.words.headline || '(empty)') + '</option><option value="headline2"' + (e.head === 'headline2' ? ' selected' : '') + '>' + esc(S.words.headline2 || '(empty)') + '</option></select></div>' +
      fld('supporting', 'Supporting line') + '<div class="am-two">' + fld('button', 'Button') + fld('phone', 'Phone') + '</div>' +
      '<div class="am-lab" style="margin-top:2px">' + W.sizes + ' <span class="am-light">' + W.thisOnly + '</span></div><div id="am-sizes">' + sizesHTML(x) + '</div>';
    var n = changeCount(), np = S.savePick.banner.length + S.savePick.sidebar.length;
    var npWords = np + ' version' + (np === 1 ? '' : 's');
    shell(col('am-slist', fix ? 'width:240px;flex:none' : '', left) + col('', 'width:' + (fix ? (target === 'banner' ? 580 : 500) : 592) + 'px;flex:none', stage) + col('am-panel', 'flex:1;min-width:250px', panel),
      '<div class="am-msg">' + (n ? '<b>' + n + ' change' + (n > 1 ? 's' : '') + '</b> since the drafts. ' : '') + (fix ? '' : '<b>' + npWords + '</b> to save: ' + S.savePick.banner.length + ' banner' + (S.savePick.banner.length === 1 ? '' : 's') + ', ' + S.savePick.sidebar.length + ' sidebar' + (S.savePick.sidebar.length === 1 ? '' : 's') + ', each its own ADS row.') + '</div><div class="am-grow"></div>' +
      (fix ? '' : ghost('back', W.back)) + ghost('tuneCancel', W.cancel) + btn(fix ? 'doFix' : 'doSave', fix ? 'Replace ' + target : W.saveBtn, 'primary', fix ? false : !np));
    drawStage(); if (!fix) drawShortlist();
  }
  function drawStage() {
    var e = S.ed; if (!e) return;
    var put = function (id, x, w) { var el = document.getElementById(id); if (!el || !x) return; el.innerHTML = ''; var v = canvasView(x.paint.canvas, w); v.className = 'am-stagepic'; el.appendChild(v); if (el.classList.contains('edit') && S.input && S.input.photo && x.sr.crop && x.sr.crop.mode !== 'whole') wireCropDrag(el, x); };
    put('am-stB', e.B[e.b], 560); put('am-stS', e.S[e.s], S.screen === 'fix' ? 480 : 240);
    var x = curShape(e.sel), ck = document.getElementById('am-checks');
    if (ck && x) ck.innerHTML = '<div class="am-chk ckh"><span>' + W.checks + ' \u00b7 ' + shapeLabel(e.sel) + '</span></div>' + (x.paint.checks.length ? x.paint.checks.map(function (c) { return '<div class="am-chk"><span class="n">' + esc(c.text) + '</span><span class="c">' + flag(c.level, c.level === 'ok' ? 'OK' : c.level === 'warn' ? 'Check' : 'Fix') + '</span></div>'; }).join('') : '<div class="am-chk"><span class="n">Nothing to flag.</span></div>');
    var sz = document.getElementById('am-sizes'); if (sz && x) sz.innerHTML = sizesHTML(x);
  }
  function drawShortlist() {
    document.querySelectorAll('#' + MOUNT_ID + ' [data-slcv]').forEach(function (el) { var p = el.getAttribute('data-slcv').split(':'), y = (p[0] === 'banner' ? S.ed.B : S.ed.S)[+p[1]]; el.innerHTML = ''; if (y) el.appendChild(canvasView(y.paint.canvas, p[0] === 'banner' ? 158 : 96)); });
  }
  // One pair of window listeners for the crop drag (wired at mount); the drag itself lives in DRAG.
  var DRAG = null;
  function wireCropDrag(el, x) {
    var pic = el.querySelector('img'); if (!pic) return; pic.classList.add('am-drag');
    pic.addEventListener('mousedown', function (ev) { ev.preventDefault(); DRAG = { pic: pic, x: x, sx: ev.clientX, sy: ev.clientY, cx: x.sr.crop.cx, cy: x.sr.crop.cy }; });
  }
  function dragMove(ev) {
    var d = DRAG; if (!d) return;
    var r = d.pic.getBoundingClientRect(), z = d.x.sr.crop.zoom || 1;
    d.x.sr.crop.cx = clamp(d.cx - (ev.clientX - d.sx) / r.width / z, 0, 1); d.x.sr.crop.cy = clamp(d.cy - (ev.clientY - d.sy) / r.height / z, 0, 1);
    repaint(d.x);
  }
  function dragEnd() { if (DRAG) { DRAG = null; render(); } }

  // ══════════════════════════════════════════════════════════════
  //  5 · Save: pairs by position, one ADS row each, then 114 once
  // ══════════════════════════════════════════════════════════════
  function toBlob(cv) { return new Promise(function (ok, bad) { cv.toBlob(function (b) { b ? ok(b) : bad(new Error('The paint could not be exported.')); }, 'image/png'); }); }
  function upload(blob, name) {
    var pub = CFG().uploadcarePublicKey; if (!pub) return Promise.reject(new Error('TA_CONFIG.uploadcarePublicKey is missing.'));
    var fd = new FormData(); fd.append('UPLOADCARE_PUB_KEY', pub); fd.append('UPLOADCARE_STORE', '1'); fd.append('file', blob, name);
    return fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: fd, ixLabel: 'Uploadcare' }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.file) throw new Error('Uploadcare returned no file id.');
      return { uuid: j.file, cdnUrl: (CFG().uploadcareBase || 'https://ucarecdn.com').replace(/\/$/, '') + '/' + j.file + '/' };
    });
  }
  function mediaRow(up, name) {
    var cfg = CFG(); if (!cfg.makeConditioner) return Promise.reject(new Error('TA_CONFIG.makeConditioner is missing.'));
    return fetchJson(cfg.makeConditioner, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      action: 'createMediaFromBrowserUpload', uploadcareUuid: up.uuid, uploadcareUrl: up.cdnUrl, originalFilename: name, mimeType: 'image/png',
      titleSlug: cfg.titleSlug || '', taItemId: cfg.taItemId || '', componentRole: '', autoAttach: false, sourceChannel: 'reformatter', source: 'ta-admaker-v' + VERSION }) })
      .then(function (r) { if (!r.ok || !r.j || r.j.ok !== true || !(r.j.mediaId || r.j.mediaItemId)) throw new Error('Scenario B did not confirm the MEDIA row for ' + name + '.'); return r.j.mediaId || r.j.mediaItemId; });
  }
  function fileName(c, shape, n) { return (c.name + '-' + shape + '-' + new Date().toISOString().slice(0, 10) + (n > 1 ? '-v' + n : '')).replace(/[^A-Za-z0-9._-]+/g, '-') + '.png'; }
  // v1.0.1 · one row per ticked shape: banners first, then sidebars.
  function rowsToSave() {
    var e = S.ed, out = [];
    S.savePick.banner.slice().sort().forEach(function (i) { out.push({ shape: 'banner', x: e.B[i] }); });
    S.savePick.sidebar.slice().sort().forEach(function (i) { out.push({ shape: 'sidebar', x: e.S[i] }); });
    return out;
  }
  // The ADS add-type option id for a shape, read live from the list's options (never typed here).
  function addTypeId(shape) { return optId('add-type', shape === 'banner' ? 'Banner Ad' : 'Sidebar Ad'); }
  function custWrites() {
    var c = cust(), fd = {}, what = [];
    if (!c.main && S.col.main) { fd.brandColorMain = S.col.main; if (S.col.accent) fd.brandColorAccent = S.col.accent; fd.brandColorEvidence = 'Set by hand in Ad Maker, ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + '.'; what.push('brand colours'); }
    if (S.fontKeep && !(fontOf(c.fontHead) && fontOf(c.fontBody))) { var f = fontsFor(); fd.brandFontHeading = f.head + ' ' + f.headWeight; fd.brandFontBody = f.body + ' 400'; what.push('fonts'); }
    if (S.printLogoUrl && ((c.logo && S.logoUse === 'print' && S.logoScope === 'replace') || (!c.logo && S.logoKeep))) { fd.logoLink = S.printLogoUrl; what.push('logo'); }
    return { fd: fd, what: what };
  }
  function write114(fd, label) {
    var cfg = CFG(), c = cust(); if (!cfg.makeUpdateCustomer) return Promise.reject(new Error('TA_CONFIG.makeUpdateCustomer is missing.'));
    return fetchJson(cfg.makeUpdateCustomer, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', titleSlug: cfg.titleSlug, taItemId: cfg.taItemId, publisherId: c.publisherId, customerId: c.id, publish: true, fieldData: fd, source: 'ta-admaker-v' + VERSION + ' ' + label }) })
      .then(function (r) {
        if (!r.ok || !r.j || r.j.ok !== true) throw new Error('Scenario 114 did not confirm the customer write.');
        var e = r.j.fieldData || {}, miss = [];
        var pairs = { brandColorMain: 'brand-color-main', brandColorAccent: 'brand-color-accent', brandFontHeading: 'brand-font-heading', brandFontBody: 'brand-font-body', logoLink: 'logo-link' };
        Object.keys(fd).forEach(function (k) { var slug = pairs[k]; if (slug && String(e[slug] || '').toUpperCase() !== String(fd[k]).toUpperCase()) miss.push(slug); });
        if (miss.length) throw new Error('Webflow did not keep ' + miss.join(', ') + '. Is Scenario 114 v1.3 imported?');
        if (fd.brandColorMain) { c.main = fd.brandColorMain; c.accent = fd.brandColorAccent || c.accent; }
        if (fd.brandFontHeading) { c.fontHead = fd.brandFontHeading; c.fontBody = fd.brandFontBody; }
        if (fd.logoLink) c.logo = fd.logoLink;
      });
  }
  function step(label, who) { var st = { label: label, who: who, state: 'wait' }; S.saving.steps.push(st); return st; }
  function run(st, p) { st.state = 'run'; render(); return p.then(function (v) { st.state = 'done'; render(); return v; }, function (e) { st.state = 'bad'; st.err = (e && e.message) || String(e); render(); throw e; }); }
  function doSave() {
    var c = cust(), cfg = CFG(), rows = rowsToSave();
    if (!cfg.makeCreateAssets) { toast('TA_CONFIG.makeCreateAssets is missing.', 'err'); return; }
    var pendB = optId('banner-approval', APPROVAL_WORDS.pending), pendS = optId('sidebar-approval', APPROVAL_WORDS.pending);
    if (!pendB || !pendS) { toast('The ADS collection has no "' + APPROVAL_WORDS.pending + '" choice on banner-approval or sidebar-approval, so nothing was saved.', 'err'); return; }
    if (!addTypeId('banner') || !addTypeId('sidebar')) { toast('The ADS add-type field has no "Banner Ad" or "Sidebar Ad" choice, so nothing was saved.', 'err'); return; }
    S.screen = 'save'; S.saving = { steps: [], rows: [], done: false, err: '' }; render();
    var chain = Promise.resolve();
    if (S.printLogo && (S.logoUse === 'print' || !c.logo)) chain = chain.then(function () { return run(step('Uploading the print logo', 'Uploadcare'), toBlob(S.printLogo.img).then(function (b) { return upload(b, fileName(c, 'logo', 1)); })).then(function (u) { S.printLogoUrl = u.cdnUrl; }); });
    if (S.photo && S.usePhoto && !S.photo.url) chain = chain.then(function () { return run(step('Uploading the photo for the recipe', 'Uploadcare'), toBlob(S.photo.img).then(function (b) { return upload(b, fileName(c, 'photo', 1)); })).then(function (u) { S.photo.url = u.cdnUrl; }); });
    rows.forEach(function (row, i) {
      var n = i + 1, sh = row.shape, x = row.x, label = shapeLabel(sh) + ' ' + n + (rows.length > 1 ? ' of ' + rows.length : '');
      chain = chain.then(function () {
        var name = versionName(c, n), up = null, mediaId = null, input;
        return layoutInput().then(function (inp) { input = inp;
          return run(step(label + ': painting at 2\u00d7', 'in the browser'), IxAdLayouts.paint(input, x.sr).then(function (p) { x.paint = p; }));
        }).then(function () {
          return run(step(label + ': uploading', 'Uploadcare'), toBlob(x.paint.canvas).then(function (b) { return upload(b, fileName(c, sh, n)); })).then(function (u) { up = u; });
        }).then(function () {
          return run(step(label + ': recording in MEDIA', 'Scenario B Route 4'), mediaRow(up, fileName(c, sh, n))).then(function (id) { mediaId = id; });
        }).then(function () {
          var recipe = IxAdLayouts.recipe.stringify(IxAdLayouts.recipe.make({ input: input, banner: sh === 'banner' ? x.sr : null, sidebar: sh === 'sidebar' ? x.sr : null }));
          var fields = { adName: name, customerId: c.id, customerName: c.name, addType: addTypeId(sh), reformatRecipe: recipe };
          if (sh === 'banner') { fields.bannerImageMediaId = mediaId; fields.bannerImageSrc = up.cdnUrl; fields.bannerApproval = pendB; }
          else { fields.sidebarImageMediaId = mediaId; fields.sidebarImageSrc = up.cdnUrl; fields.sidebarApproval = pendS; }
          return run(step(label + ': ADS row "' + name + '" with the recipe', 'Scenario 104'),
            fetchJson(cfg.makeCreateAssets, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assetType: 'ad', titleSlug: cfg.titleSlug, taItemId: cfg.taItemId, fields: fields, source: 'ta-admaker-v' + VERSION }) })
              .then(function (r) {
                if (!r.ok || !r.j || r.j.ok !== true) throw new Error('Scenario 104 did not confirm the ADS row.');
                var e = r.j.fieldData || null, miss = [];
                if (!e) throw new Error('Scenario 104 echoed no fieldData, so the row cannot be checked. Import 104 v3.6.');
                if (String(e['reformat-recipe'] || '').trim() !== recipe.trim()) miss.push('reformat-recipe');
                if (!String(e[SHAPE_SLUG[sh].link] || '').trim()) miss.push(SHAPE_SLUG[sh].link);
                if (String(e[SHAPE_SLUG[sh].approval] || '') !== (sh === 'banner' ? pendB : pendS)) miss.push(SHAPE_SLUG[sh].approval);
                if (String(e['add-type'] || '') !== addTypeId(sh)) miss.push('add-type');
                if (miss.length) throw new Error('The row was created but Webflow did not keep ' + miss.join(', ') + '. Is Scenario 104 v3.6 imported?');
                S.saving.rows.push({ name: name, id: r.j.adId || r.j.itemId || '', shape: sh, banner: sh === 'banner' ? e['banner-ad-link'] : '', sidebar: sh === 'sidebar' ? e['sidebar-ad-link'] : '' });
              }));
        });
      });
    });
    var cw = custWrites();
    if (cw.what.length) chain = chain.then(function () { return run(step('Saving the ' + cw.what.join(', ') + ' to the customer', 'Scenario 114'), write114(cw.fd, 'save')); });
    chain.then(function () { S.saving.done = true; render(); return loadAds(); }).then(function () { render(); })
      .catch(function (e) { S.saving.err = (e && e.message) || String(e); render(); });
  }
  function vSave() {
    var sv = S.saving, h = colh(sv.done ? W.saved : W.saving) + '<div class="am-card">' + sv.steps.map(function (st) {
      return '<div class="am-ps ' + st.state + '"><i>' + (st.state === 'done' ? '\u2713' : st.state === 'bad' ? '!' : '') + '</i>' + esc(st.label) + (st.err ? '<span class="am-err inline">' + esc(st.err) + '</span>' : '') + '<span class="who">' + esc(st.who) + '</span></div>'; }).join('');
    if (sv.err) h += '<div class="am-err" style="margin-top:10px">' + esc(sv.err) + '</div>';
    if (sv.rows.length) h += '<div class="am-result"><h4>' + sv.rows.length + ' version' + (sv.rows.length > 1 ? 's' : '') + ' saved</h4>' + sv.rows.map(function (r) { return '<div class="am-rr">' + (r.banner ? '<img src="' + esc(r.banner) + '" alt="" style="width:260px">' : '') + (r.sidebar ? '<img src="' + esc(r.sidebar) + '" alt="" style="width:120px">' : '') + '<div class="lines"><b>' + esc(r.name) + '</b><br>' + (r.banner ? 'Banner <span class="am-pend">' + APPROVAL_WORDS.pending + '</span> ' : '') + (r.sidebar ? 'Sidebar <span class="am-pend">' + APPROVAL_WORDS.pending + '</span>' : '') + '<br><span class="am-note">Recipe saved. Becomes the customer\u2019s current ' + r.shape + ' only after approval.</span></div></div>'; }).join('') + '</div>';
    h += '</div>';
    shell(col('', 'flex:1;max-width:760px', h), '<div class="am-msg">' + (sv.done ? W.savedMsg : sv.err ? 'Stopped. Nothing after the failed step was written.' : W.keepOpen) + '</div><div class="am-grow"></div>' + ((sv.done || sv.err) ? btn('again', W.again, 'secondary') : ''));
  }

  // ══════════════════════════════════════════════════════════════
  //  Fix after send-back: the returned shape only
  // ══════════════════════════════════════════════════════════════
  function openFix(it) {
    S.sel = it.id; S.custId = it.custId; S.custPre = it.custId; S.src = 'version';
    var other = it.shape === 'banner' ? 'sidebar' : 'banner', fd = it.row.fieldData || {};
    S.fix = { adId: it.adId, shape: it.shape, q: it.q, m: it.m, otherUrl: fd[SHAPE_SLUG[other].link] || '', otherApproval: optName(SHAPE_SLUG[other].approval, fd[SHAPE_SLUG[other].approval]), name: fd.name || '' };
    if (!it.recipe) { toast('This version has no recipe (made before Ad Maker), so it cannot be rebuilt here. Start a new creative from a version instead.', 'err'); return; }
    var r; try { r = IxAdLayouts.recipe.parse(it.recipe); } catch (e) { toast('The recipe cannot be read: ' + e.message, 'err'); return; }
    S.screen = 'fix'; S.reading = true; render();
    IxAdLayouts.rebuild(r).then(function (out) {
      S.input = out.input; S.words = Object.assign({}, r.wording); S.base = Object.assign({}, r.wording);
      S.photo = out.input.photo ? Object.assign({}, out.input.photo, { nativeWidth: r.photo.nativeWidth }) : null; S.usePhoto = !!S.photo;
      S.logoUse = r.logo && r.logo.source === 'print' ? 'print' : 'file'; S.printLogoUrl = r.logo && r.logo.source === 'print' ? r.logo.url : '';
      if (S.logoUse === 'print' && out.input.logo) S.printLogo = { img: out.input.logo.main, transparent: true };
      var sr = { shape: it.shape, layout: r[it.shape].layout, crop: r[it.shape].crop, sizes: r[it.shape].sizes };
      var x = { sr: sr, sr0: JSON.parse(JSON.stringify(sr)), paint: out[it.shape] };
      S.ed = { B: it.shape === 'banner' ? [x] : [], S: it.shape === 'sidebar' ? [x] : [], sel: it.shape, b: 0, s: 0, head: r.headlineSlot || 'headline', head0: r.headlineSlot || 'headline', w0: Object.assign({}, r.wording) };
      S.fix.recipe = r; S.reading = false; render();
    }).catch(function (e) { S.reading = false; S.screen = 'start'; toast('The version could not be rebuilt: ' + e.message, 'err'); render(); });
  }
  function doFix() {
    var cfg = CFG(), c = cust(), sh = S.fix.shape, x = curShape(sh), pend = optId(SHAPE_SLUG[sh].approval, APPROVAL_WORDS.pending);
    if (!cfg.makeStudio) { toast('TA_CONFIG.makeStudio is missing.', 'err'); return; }
    if (!pend) { toast('The ADS collection has no "' + APPROVAL_WORDS.pending + '" choice on ' + SHAPE_SLUG[sh].approval + '.', 'err'); return; }
    S.screen = 'save'; S.saving = { steps: [], rows: [], done: false, err: '', fix: true }; render();
    var r = S.fix.recipe, media = {};
    r[sh] = { layout: x.sr.layout, crop: x.sr.crop, sizes: x.sr.sizes }; r.wording = Object.assign({}, S.words); r.headlineSlot = S.ed.head;
    layoutInput().then(function (input) { return run(step('Painting the ' + sh + ' at 2\u00d7', 'in the browser'), IxAdLayouts.paint(input, x.sr).then(function (p) { x.paint = p; })); })
      .then(function () { return run(step('Uploading', 'Uploadcare'), toBlob(x.paint.canvas).then(function (b) { return upload(b, fileName(c, sh, 1)); })).then(function (u) { media.up = u; }); })
      .then(function () { return run(step('Recording in MEDIA', 'Scenario B Route 4'), mediaRow(media.up, fileName(c, sh, 1))).then(function (id) { media.id = id; }); })
      .then(function () {
        var recipe = IxAdLayouts.recipe.stringify(r), body = { action: 'updateAd', titleSlug: cfg.titleSlug, adItemId: S.fix.adId, source: 'ta-admaker-v' + VERSION, fieldData: { reformatRecipe: recipe } };
        body.fieldData[sh === 'banner' ? 'bannerAdLink' : 'sidebarAdLink'] = media.up.cdnUrl;
        body.fieldData[sh === 'banner' ? 'bannerImageMediaId' : 'sidebarImageMediaId'] = media.id;
        body.fieldData[sh === 'banner' ? 'bannerImageSrc' : 'sidebarImageSrc'] = media.up.cdnUrl;
        body.fieldData[sh === 'banner' ? 'bannerApproval' : 'sidebarApproval'] = pend;
        return run(step('Replacing the ' + sh + ' on "' + S.fix.name + '", approval back to ' + APPROVAL_WORDS.pending, 'Scenario G \u00b7 updateAd'),
          fetchJson(cfg.makeStudio, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (res) {
            if (!res.ok || !res.j || res.j.ok !== true) throw new Error('Scenario G did not confirm the update.');
            var e = res.j.fieldData || {}, miss = [];
            if (String(e[SHAPE_SLUG[sh].link] || '') !== media.up.cdnUrl) miss.push(SHAPE_SLUG[sh].link);
            if (String(e[SHAPE_SLUG[sh].approval] || '') !== pend) miss.push(SHAPE_SLUG[sh].approval);
            if (String(e['reformat-recipe'] || '').trim() !== recipe.trim()) miss.push('reformat-recipe');
            if (miss.length) throw new Error('Webflow did not keep ' + miss.join(', ') + '. Does Scenario G have the updateAd route?');
            S.saving.rows.push({ name: S.fix.name, id: S.fix.adId, banner: sh === 'banner' ? media.up.cdnUrl : '', sidebar: sh === 'sidebar' ? media.up.cdnUrl : '' });
          }));
      })
      .then(function () { S.saving.done = true; render(); return loadAds(); }).then(function () { render(); })
      .catch(function (e) { S.saving.err = (e && e.message) || String(e); render(); });
  }

  // ══════════════════════════════════════════════════════════════
  //  Render, events, mount
  // ══════════════════════════════════════════════════════════════
  function toast(msg, kind) { if (window.IxToast && IxToast.show) { try { IxToast.show(msg, kind === 'err' ? 'err' : 'ok', kind === 'err' ? { sticky: true } : undefined); return; } catch (e) {} } log(kind || 'ok', msg); }
  function render() {
    var scroller = document.querySelector('#' + MOUNT_ID + ' .am-col.am-left'), top = scroller ? scroller.scrollTop : 0;
    var v = { start: vStart, read: vRead, drafts: vDrafts, tune: vTune, fix: vTune, save: vSave }[S.screen] || vStart;
    if (S.screen === 'fix' && S.reading) { shell(col('', 'flex:1', colh(W.fixing) + '<div class="am-prog"><b>Rebuilding the version from its recipe</b><div class="bar"><i></i></div></div>'), '<div class="am-msg"></div><div class="am-grow"></div>' + ghost('startCancel', W.cancel)); return; }
    v();
    var s2 = document.querySelector('#' + MOUNT_ID + ' .am-col.am-left'); if (s2 && top) s2.scrollTop = top;
    if (S.screen === 'start' && S.src === 'drop' && !S.drop) wireDrop();
  }
  function wireDrop() {
    var z = document.getElementById('am-dropzone'), f = document.getElementById('am-file'); if (!z || !f) return;
    z.addEventListener('click', function (e) { if (e.target.closest('.am-revert')) return; f.click(); });
    f.addEventListener('change', function () { takeFile(f.files && f.files[0]); });
    z.addEventListener('dragover', function (e) { e.preventDefault(); z.classList.add('over'); });
    z.addEventListener('dragleave', function () { z.classList.remove('over'); });
    z.addEventListener('drop', function (e) { e.preventDefault(); z.classList.remove('over'); takeFile(e.dataTransfer.files && e.dataTransfer.files[0]); });
  }
  function startItem(it) {
    S.sel = it.id; S.custId = it.custId || ''; S.custPre = S.custId; S.src = ''; S.drop = null; S.box = null; S.boxed = false; S.col = { main: '', accent: '' }; S.fromVersion = ''; S.err = '';
  }
  function go(screen) { S.screen = screen; render(); }
  function onClick(e) {
    var t = e.target.closest('[data-act],[data-na],[data-src],[data-ver],[data-logo],[data-scope],[data-photo],[data-pair],[data-sug],[data-pk],[data-sl],[data-shape]');
    if (!t) return;
    var act = t.getAttribute('data-act');
    if (t.hasAttribute('data-na')) { var it = needsAll().all.filter(function (x) { return x.id === t.getAttribute('data-na'); })[0]; if (!it) return; if (it.kind === 'sent') { startItem(it); openFix(it); return; } startItem(it); render(); return; }
    if (t.hasAttribute('data-src')) { S.src = t.getAttribute('data-src'); S.drop = null; S.box = null; S.boxed = false; S.fromVersion = ''; render(); return; }
    if (t.hasAttribute('data-ver')) { var v = versionsOf(S.custId).filter(function (x) { return x.id === t.getAttribute('data-ver'); })[0]; if (v) loadVersion(v); render(); return; }
    if (t.hasAttribute('data-logo')) { S.logoUse = t.getAttribute('data-logo'); render(); return; }
    if (t.hasAttribute('data-scope')) { S.logoScope = t.getAttribute('data-scope'); render(); return; }
    if (t.hasAttribute('data-photo')) { S.usePhoto = t.getAttribute('data-photo') === '1'; render(); return; }
    if (t.hasAttribute('data-pair')) { S.fontPair = t.getAttribute('data-pair'); render(); return; }
    if (t.hasAttribute('data-sug')) { var h = t.getAttribute('data-sug'); if (!S.col.main) S.col.main = hex(h); else if (!S.col.accent) S.col.accent = hex(h); render(); return; }
    if (t.hasAttribute('data-pk')) { var p = t.getAttribute('data-pk').split(':'), arr = S.short[p[0]], i = +p[1], at = arr.indexOf(i); if (at > -1) arr.splice(at, 1); else arr.push(i); render(); return; }
    if (t.hasAttribute('data-sl')) { if (e.target.closest('label')) return; var q = t.getAttribute('data-sl').split(':'); S.ed.sel = q[0]; if (q[0] === 'banner') S.ed.b = +q[1]; else S.ed.s = +q[1]; render(); return; }
    if (t.hasAttribute('data-shape') && S.screen === 'tune') { S.ed.sel = t.getAttribute('data-shape'); render(); return; }
    if (!act) return;
    e.preventDefault();
    switch (act) {
      case 'newC': startItem({ id: 'new', custId: '' }); render(); break;
      case 'startCancel': S.sel = null; S.custId = ''; S.src = ''; S.drop = null; S.fix = null; S.screen = 'start'; render(); break;
      case 'custCancel': S.custId = S.custPre; render(); break;
      case 'colCancel': S.col[t.getAttribute('data-k')] = ''; render(); break;
      case 'srcCancel': S.src = ''; S.drop = null; S.box = null; S.fromVersion = ''; render(); break;
      case 'clients': var lk = document.querySelector('.w-tab-link[data-w-tab="Clients"]'); if (lk) lk.click(); break;
      case 'toRead':
        if (S.src === 'none') { startEmpty(); go('read'); break; }
        if (S.src === 'version') { startFromVersion(); break; }
        S.boxed = false; S.screen = 'read'; if (!needsBox()) { S.boxed = true; readAd(); } else render(); break;
      case 'readBox': S.boxed = true; readAd(); break;
      case 'wholePage': S.box = null; S.boxed = true; readAd(); break;
      case 'boxCancel': S.box = null; render(); break;
      case 'pagePrev': S.page = Math.max(1, S.page - 1); S.box = null; render(); break;
      case 'pageNext': S.page = Math.min(S.drop.pages, S.page + 1); S.box = null; render(); break;
      case 'readAgain': S.err = ''; readAd(); break;
      case 'back': go({ read: 'start', drafts: 'read', tune: 'drafts' }[S.screen] || 'start'); break;
      case 'wCancel': var k = t.getAttribute('data-k'); S.words[k] = S.base[k]; render(); break;
      case 'logoCancel': S.logoUse = 'file'; S.logoScope = 'version'; render(); break;
      case 'toDrafts': S.screen = 'drafts'; S.ed = null; render(); makeDrafts().then(function () { if (S.screen === 'drafts') render(); }); break;
      case 'toTune': initTune(); go('tune'); break;
      case 'tuneCancel': if (S.screen === 'fix') { S.screen = 'start'; S.sel = null; S.fix = null; render(); } else { S.ed.B.concat(S.ed.S).forEach(function (x) { x.sr = JSON.parse(JSON.stringify(x.sr0)); }); S.words = JSON.parse(JSON.stringify(S.ed.w0)); S.ed.head = S.ed.head0; repaintAll(); render(); } break;
      case 'fCancel': var fk = t.getAttribute('data-k'); S.words[fk] = S.ed.w0[fk]; repaintAll(); render(); break;
      case 'headCancel': S.ed.head = S.ed.head0; repaintAll(); render(); break;
      case 'cropCancel': var xc = curShape(S.ed.sel); xc.sr.crop = JSON.parse(JSON.stringify(xc.sr0.crop)); repaint(xc); render(); break;
      case 'szCancel': var xs = curShape(S.ed.sel); xs.sr.sizes[t.getAttribute('data-k')] = 1; repaint(xs); render(); break;
      case 'doSave': doSave(); break;
      case 'doFix': doFix(); break;
      case 'again': reset(); render(); loadNeeds().then(render); loadAds().then(render); break;
    }
  }
  function startEmpty() { S.read = null; S.words = {}; S.base = {}; S.from = {}; SLOTS.forEach(function (s) { S.words[s[0]] = ''; S.base[s[0]] = ''; S.from[s[0]] = 'Type it'; }); S.photo = null; S.printLogo = null; S.srcCanvas = null; S.logoUse = 'file'; S.err = ''; var c = cust(); S.fontPair = (fontOf(c.fontHead) && fontOf(c.fontBody)) ? '' : FONT_PAIRS[0].id; }
  function startFromVersion() {
    var v = versionsOf(S.custId).filter(function (x) { return x.id === S.fromVersion; })[0]; if (!v) return;
    if (S.verRecipe) {
      var r = S.verRecipe; S.screen = 'read'; S.reading = true; render();
      IxAdLayouts.rebuild(r).then(function (out) {
        S.read = { read: { method: 'recipe', note: 'Wording, logo and photo from the saved recipe of ' + v.name + '.' }, warnings: [] };
        S.words = Object.assign({}, r.wording); S.base = Object.assign({}, r.wording); S.from = {}; SLOTS.forEach(function (s) { S.from[s[0]] = 'From the version'; });
        S.photo = out.input.photo ? Object.assign({}, out.input.photo) : null; S.usePhoto = !!S.photo; S.srcCanvas = null; S.verImg = out.banner ? out.banner.canvas : (out.sidebar ? out.sidebar.canvas : null);
        S.printLogo = (r.logo && r.logo.source === 'print' && out.input.logo) ? { img: out.input.logo.main, transparent: true } : null; S.printLogoUrl = S.printLogo ? r.logo.url : '';
        S.logoUse = S.printLogo ? 'print' : 'file'; S.reading = false; render();
      }).catch(function (e) { S.reading = false; S.err = 'The version could not be rebuilt: ' + e.message; render(); });
    } else {
      // no recipe: read the banner picture through the Worker, as a dropped picture
      S.screen = 'read'; S.reading = true; render();
      loadImg(v.banner || v.sidebar).then(function (img) { if (!img) throw new Error('The version\u2019s picture could not be loaded.'); S.drop = { name: v.name, img: img }; S.box = null; S.boxed = true; readAd(); }).catch(function (e) { S.reading = false; S.err = e.message; render(); });
    }
  }
  function onInput(e) {
    var t = e.target;
    if (t.matches('[data-w]')) { S.words[t.getAttribute('data-w')] = t.value; var line = t.closest('.am-wline'); if (line) { var ch = t.value !== S.base[t.getAttribute('data-w')]; t.classList.toggle('am-dirty', ch); } return; }
    if (t.matches('[data-col]')) { S.col[t.getAttribute('data-col')] = t.value; var d = t.parentNode.querySelector('.dot'); if (d && hex(t.value)) d.style.setProperty('background', hex(t.value), 'important'); t.classList.toggle('am-dirty', !!t.value); return; }
    if (t.matches('[data-f]')) { S.words[t.getAttribute('data-f')] = t.value; t.classList.add('am-dirty'); repaintAll(); return; }
    if (t.matches('[data-sz]')) { var x = curShape(S.ed.sel); x.sr.sizes[t.getAttribute('data-sz')] = +t.value; var v = t.parentNode.querySelector('.v'); if (v) v.textContent = Math.round(t.value * 100) + '%'; repaint(x); return; }
    if (t.id === 'am-zoom') { var xz = curShape(S.ed.sel); xz.sr.crop.zoom = +t.value; var vz = t.parentNode.querySelector('.v'); if (vz) vz.textContent = (+t.value).toFixed(2) + '\u00d7'; repaint(xz); return; }
  }
  function onChange(e) {
    var t = e.target;
    if (t.id === 'am-cust') { S.custId = t.value; S.src = ''; S.col = { main: '', accent: '' }; render(); return; }
    if (t.id === 'am-head') { S.ed.head = t.value; repaintAll(); render(); return; }
    if (t.id === 'am-logokeep') { S.logoKeep = t.checked; return; }
    if (t.id === 'am-fontkeep') { S.fontKeep = t.checked; return; }
    if (t.matches('[data-col]')) { S.col[t.getAttribute('data-col')] = hex(t.value); render(); return; }
    if (t.matches('[data-w],[data-f],[data-sz]')) { render(); return; }
    if (t.matches('[data-save]')) { var p = t.getAttribute('data-save').split(':'), arr = S.savePick[p[0]], i = +p[1], at = arr.indexOf(i);
      if (t.checked && at < 0) { if (arr.length >= MAX_SAVE) { t.checked = false; toast('Up to ' + MAX_SAVE + ' ' + p[0] + 's per save.', 'err'); return; } arr.push(i); } else if (!t.checked && at > -1) arr.splice(at, 1); render(); return; }
  }

  var mounted = false;
  function mount() {
    var panel = document.querySelector(PANEL); if (!panel) { log('no Ad Maker panel yet'); return false; }
    var m = document.getElementById(MOUNT_ID); if (!m) { m = document.createElement('div'); m.id = MOUNT_ID; panel.innerHTML = ''; panel.appendChild(m); }
    if (mounted) return true;
    mounted = true;
    var miss = [];
    if (!window.IxAdLayouts) miss.push('ix-ad-layouts');
    try { IxAdLayouts.shapes(); } catch (e) { miss.push(e.message); }
    readCustomers();
    m.addEventListener('click', onClick); m.addEventListener('input', onInput); m.addEventListener('change', onChange);
    window.addEventListener('mousemove', dragMove); window.addEventListener('mouseup', dragEnd);
    if (miss.length) { m.innerHTML = '<div class="am"><div class="am-head"><h2>' + W.title + '</h2>' + badge() + '</div><div class="am-body"><div class="am-err">' + esc(miss.join(' ')) + '</div></div></div>'; return true; }
    render();
    Promise.all([loadNeeds(), loadAds()]).then(function () { render(); });
    log('mounted');
    return true;
  }
  window.addEventListener('std:panel:admaker', function () { setTimeout(mount, 0); });
  window.TaAdMaker = { mount: mount, VERSION: VERSION, _state: function () { return S; } };
  log('loaded, listening for std:panel:admaker');
})();
