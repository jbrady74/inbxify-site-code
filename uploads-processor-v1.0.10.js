// ============================================================
// uploads-processor-v1.0.10.js
// INBXIFY Uploads Processor — System 2 UI
// Mounts into #content-manager-mount on T-A page
// Config from window.TA_CONFIG
//
// v1.0.10: CONVERTER EXCISED (S13 Step 3)
//          The Converter is now a standalone module —
//          ta-converter-v1.0.0.js — which self-mounts into
//          Studio Tab 5 via the std:panel:converter CustomEvent.
//          UP no longer hosts the Converter.
//
//          Q-Q lock: UP's "Converter" channel button is removed
//          from the channel strip entirely. During parallel-run,
//          users access the Converter through Studio Tab 5 only.
//          UP gets visibly smaller; Studio is the new home for
//          conversion tooling. Pattern matches Transcriber
//          migration (Step 2) where UP's Transcriber channel
//          went dark.
//
//          Removed in v1.0.10:
//            1. CHANNELS array entry { id:'converter', label:'Converter' }
//            2. CHANNEL initial-value comment updated (no longer
//               lists 'converter' as a possible value)
//            3. Shell HTML: <div id="cm-converter-panel"> dropped
//            4. render() — convEl lookup, display toggle, branch
//               that calls renderConverter()
//            5. renderConverter() function and its three nested
//               helpers (convLoadFile, convProcess, convReset).
//               80 lines of code lifted to ta-converter-v1.0.0.js
//               verbatim (only the mount-target lookup is now a
//               parameter rather than hardcoded).
//
//          UP shrinks from 885 lines to ~795 lines.
//
//          .cm-conv-* CSS rules in title-admin-page-design v1.4.11
//          remain — used by the standalone module for visual
//          parity. Class rename to .cnv-* deferred to S15 / TD-163.
//
//          Webflow head deploy:
//            SWAP: uploads-processor-v1.0.9.js
//                  → uploads-processor-v1.0.10.js
//            ADD:  <script src=".../ta-converter-v1.0.0.js"></script>
//            (recommend adding right after ta-page-body in
//             the <body> script list)
//
// v1.0.9: TD-160 BUTTON SYSTEM MIGRATION (S11.5b Wave 3)
//         Additive class migration for every button emit (19 sites).
//         Each button now carries BOTH the legacy class AND the
//         canonical ix-btn ix-btn--* classes per the migration table
//         in TD-160-Button-Audit.docx. The ix-buttons-v1.0.x.css
//         module wins via specificity + !important + dual
//         background-color/background-image armor.
//
//         Migrated emits:
//           cm-tab (status pills, ×N)        → ix-btn ix-btn--pill
//                                              (active state via .active class)
//           cm-refresh                       → ix-btn ix-btn--ghost
//           cm-desel × 4 (clear, hide × 2 bars) → ix-btn ix-btn--ghost
//           cm-archive-btn × 2               → ix-btn ix-btn--secondary
//           cm-pdf-btn (Convert to JPEG)     → ix-btn ix-btn--secondary
//           cm-pdf-btn-transcribe (gold)     → ix-btn ix-btn--secondary
//                                              (gold styling retained from
//                                               legacy class — toolbar context,
//                                               not part of canonical scheme)
//           cm-assign-btn (gold CTA)         → ix-btn ix-btn--primary ix-btn--gold
//           cm-preview-btn × 2 (eye icon)    → ix-btn ix-btn--ghost ix-btn--icon
//           cm-preview-close (✕)             → ix-btn ix-btn--ghost ix-btn--icon
//           cm-modal-close (✕)               → ix-btn ix-btn--ghost ix-btn--icon
//           cm-nested-close                  → ix-btn ix-btn--ghost
//           cm-link-btn × 2                  → ix-btn ix-btn--ghost
//           cm-cancel                        → ix-btn ix-btn--ghost
//           cm-sub-btn × 2 (Create, Submit)  → ix-btn ix-btn--primary
//
//         "Ready to Assign" tab pill — the broken active state pill
//         from S11 testing (the screenshot bug that surfaced TD-160)
//         is fixed by this migration. Active pills now render blue +
//         white from the canonical pill variant via .active synonym.
//
//         Webflow head deploy:
//           SWAP: uploads-processor-v1.0.8.js → uploads-processor-v1.0.9.js
//           (ix-buttons-v1.0.x.css already loaded — Wave 3 also bumps
//            module to v1.0.1; see Wave 3 ship notes.)
//
// v1.0.8: STATUS RENAMES + PER-TAB REFETCH
//         - Status values renamed Sheet-wide:
//             AWAITING           → RAW
//             AWAITING_DECISION  → PDF_PENDING
//             DONE               → READY_TO_ASSIGN
//           ASSIGNED, ARCHIVED, HIDDEN unchanged.
//         - loadFiles(status) now REQUIRES a status param.
//           Each tab fetches its own status from Scenario C
//           route 1 (Filtered). No more client-side status
//           filtering of a single combined payload.
//         - setTab() refetches on every tab switch.
//         - Init call is loadFiles('READY_TO_ASSIGN') since
//           'ready' is the default tab.
//         - Client-side !f.assigned check removed — Scenario F
//           writes ASSIGNED to the Sheet now, so the transient
//           in-memory flag is redundant.
// v1.0.7: CSS EXTRACTION
//         - Removed ALL embedded CSS (~200 lines)
//         - All styles now provided by title-admin-page-design-v1.0.0.css
//           loaded in Webflow <head>
//         - No class name changes — .cm-* classes still used
//         - Legacy aliases in DS file ensure visual parity
// v1.0.6: RTE INTEGRATION — CORRECTED ROUTING
//         - Replaced fetchFileContent (was Scenario C Route 5)
//           with fetchArticleBody via makeAssembly (Scenario F)
//         - action=getArticleBody reads body from Webflow CMS
//           not from Google Drive — returns already-written content
//         - Scenario C dependency fully removed from RTE flow
// v1.0.5: RTE INTEGRATION FOR ARTICLE BODY
// v1.0.4: MODAL Z-INDEX HARMONIZATION
// v1.0.3: CONVERTER TAB
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  const mount = document.getElementById('content-manager-mount');
  if (!mount) return;

  // ── Config (from window.TA_CONFIG set in Webflow page head) ──
  const CFG = {
    get scenarioCUrl()    { return window.TA_CONFIG?.scenarioC || ''; },
    get makeAssembly()    { return window.TA_CONFIG?.makeAssembly || ''; },
    get makeArchive()     { return window.TA_CONFIG?.makeArchive || ''; },
    get makeConditioner() { return window.TA_CONFIG?.makeConditioner || ''; },
    get titleSlug()       { return window.TA_CONFIG?.titleSlug || ''; },
    get taItemId()        { return window.TA_CONFIG?.taItemId || ''; },
  };

  // ── State ──
  let FILES     = [];
  let CHANNEL   = 'gdrive';  // gdrive | email | form | transcriber  (v1.0.10: 'converter' removed — moved to ta-converter-v1.0.0.js)
  let TAB       = 'ready';   // pdf-queue | ready | assigned | archived | hidden (only when CHANNEL=gdrive)
  let LOADING   = false;
  let LOAD_ERR  = null;
  let TRANSCRIBE_PDFS = []; // filenames pending transcription via Transcriber tab

  // Monitor counts (from Drive API / separate calls)
  let MONITOR = { uploadFolder: 0, preprocessing: 0 };

  // Assignment state
  let A = freshA();

  function freshA() {
    return {
      collection:'', customerId:'', cmsItemId:'',
      isNew:false, newItemName:'', nestedOpen:false, nestedName:'',
      newRevenueType:'', newProductType:'', newMajorNlSection:'',
      newSubTitle:'', newWriterName:'', newWriterTitle:'',
      newCoWriterName:'', newCoWriterTitle:'', newPhotoCredits:false,
      newPhotographer:'', newPhotoEssay:false, newVideoArticle:false,
      newVideoUrl:'', newAudioUrl:'', newBannerStatement:'', newExtrasOpen:false,
      newAdClickUrl:'', newAdStartDate:'', newAdEndDate:'',
      newEventStart:'', newEventDescription:'', newEventLocation:'',
      newEventAddress:'', newEventCity:'', newEventLink:'',
      newReListingStatus:'', newReMls:'', newReAddress:'',
      newRePrice:'', newReFeatures:'', newReListingLink:'',
    };
  }

  // ── Channel tabs (top level — intake source) ──
  // v1.0.10: 'converter' entry removed; the Converter is now a
  // standalone module (ta-converter-v1.0.0.js) hosted exclusively
  // in Studio Tab 5. UP no longer offers a Converter channel.
  const CHANNELS = [
    { id:'gdrive',      label:'Google Drive' },
    { id:'email',       label:'Email' },
    { id:'form',        label:'Form Submission' },
    { id:'transcriber', label:'Transcriber' },
  ];

  // ── Sub-tabs (under Google Drive — file status) ──
  const TABS = [
    { id:'pdf-queue', label:'PDF Queue',        status:'PDF_PENDING',      selectable:true  },
    { id:'ready',     label:'Ready to Assign',  status:'READY_TO_ASSIGN',  selectable:true  },
    { id:'assigned',  label:'Assigned',         status:'ASSIGNED',         selectable:false },
    { id:'archived',  label:'Archived',         status:'ARCHIVED',         selectable:false },
    { id:'hidden',    label:'Hidden',           status:'HIDDEN',           selectable:false },
  ];

  const COLLECTIONS = [
    { id:'articles', label:'Articles' },
    { id:'ads',      label:'Ads' },
    { id:'events',   label:'Events' },
    { id:'re',       label:'RE Listings' },
  ];
  const COLLECTION_LABELS = { articles:'article', ads:'ad', events:'event', re:'RE listing' };

  // ── Live DOM readers ──
  const localCustomers = [];
  function readCustomers() {
    const fromDOM = Array.from(document.querySelectorAll('.customers-wrapper[data-item]')).map(el => ({
      id: el.getAttribute('data-id') || '', name: el.getAttribute('data-name') || '',
    })).filter(c => c.id);
    return [...fromDOM, ...localCustomers].sort((a,b) => a.name.localeCompare(b.name));
  }
  function readArticles() {
    return Array.from(document.querySelectorAll('.articles-wrapper')).map(el => ({
      id: el.dataset.articleId || '', name: el.dataset.articleTitle || '',
      customerId: el.dataset.articleCustomerId || '', categoryCode: el.dataset.articleCategoryCode || '',
    })).filter(a => a.id).sort((a,b) => a.name.localeCompare(b.name));
  }
  function readAds() {
    return Array.from(document.querySelectorAll('.ad-source')).map(el => ({
      id: el.dataset.adId || '', name: el.dataset.adTitle || el.dataset.label || '',
      customerId: el.dataset.adCustomerId || '',
    })).filter(a => a.id).sort((a,b) => a.name.localeCompare(b.name));
  }
  function readEvents() {
    return Array.from(document.querySelectorAll('[data-events-wrapper] [data-item]')).map(el => ({
      id: el.getAttribute('data-event-id') || '', name: el.getAttribute('data-event-title') || '',
    })).filter(e => e.id).sort((a,b) => a.name.localeCompare(b.name));
  }
  function readRE() {
    return Array.from(document.querySelectorAll('[data-re-wrapper] [data-item]')).map(el => ({
      id: el.getAttribute('data-re-id') || '', name: el.getAttribute('data-re-title') || '',
    })).filter(r => r.id).sort((a,b) => a.name.localeCompare(b.name));
  }
  function readProducts() {
    return Array.from(document.querySelectorAll('.products-wrapper[data-item]')).map(el => ({
      id: el.getAttribute('data-id') || '', name: el.getAttribute('data-name') || '',
      group: el.getAttribute('data-group') || '', mnlsId: el.getAttribute('data-collection-id') || '',
    })).filter(p => p.id).sort((a,b) => a.name.localeCompare(b.name));
  }

  const ETYPES = window.TA_CONFIG?.elementTypes || {};
  if (!Object.keys(ETYPES).length) console.warn('[CP] No elementTypes configured in window.TA_CONFIG');

  const FILE_ICONS = {
    'image/jpeg':'\u{1F5BC}\uFE0F','image/jpg':'\u{1F5BC}\uFE0F','image/png':'\u{1F5BC}\uFE0F',
    'image/webp':'\u{1F5BC}\uFE0F','image/svg+xml':'\u270F\uFE0F','application/pdf':'\u{1F4D5}',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'\u{1F4D8}',
    'text/html':'\u{1F4D7}','application/zip':'\u{1F4E6}',
  };

  // ── Utilities ──
  const fmtSize = b => b > 1e6 ? (b/1e6).toFixed(1)+' MB' : Math.round(b/1e3)+' KB';
  const esc     = s => (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  const chg     = v => v ? ' changed' : '';
  const colLabel = col => COLLECTION_LABELS[col] || 'item';

  const MIME_LABELS = {
    'image/jpeg':'JPEG','image/jpg':'JPEG','image/png':'PNG','image/webp':'WEBP',
    'image/gif':'GIF','image/svg+xml':'SVG',
    'application/pdf':'PDF','text/html':'HTML','text/plain':'TXT',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'DOCX',
    'application/msword':'DOC',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'XLSX',
    'application/vnd.ms-excel':'XLS',
    'application/zip':'ZIP',
    'application/vnd.google-apps.document':'G-DOC',
    'application/vnd.google-apps.presentation':'G-SLIDES',
    'application/vnd.google-apps.spreadsheet':'G-SHEET',
  };
  function mimeLabel(mime) {
    if (!mime) return '\u2014';
    if (MIME_LABELS[mime]) return MIME_LABELS[mime];
    // Fallback: take the bit after the slash, uppercase, truncate
    const after = mime.split('/').pop() || mime;
    return after.length > 10 ? after.substring(0,10).toUpperCase() : after.toUpperCase();
  }

  function getCMSItems(col, custId) {
    let items = col==='articles'?readArticles():col==='ads'?readAds():col==='events'?readEvents():col==='re'?readRE():[];
    if (custId && custId!=='__none__') items = items.filter(i => !i.customerId || i.customerId===custId);
    return items;
  }
  function guessEType(f, collection) {
    const n = f.name.toLowerCase();
    const map = {'main-image':['hero','feature','photo','main'],'article-body':['docx','doc','html'],'banner-ad':['banner','600x200'],'logo':['logo','svg'],'event-flyer':['flyer'],'ad-creative':['ad','promo']};
    const etypes = ETYPES[collection] || [];
    for (const [etype, keys] of Object.entries(map)) {
      if (keys.some(k => n.includes(k)) && etypes.find(t => t.id===etype)) return etype;
    }
    if (f.mime.startsWith('image/')) return etypes.find(t => t.id==='main-image') ? 'main-image' : '';
    return '';
  }

  // ── Fetch article body from Webflow CMS via Scenario F ──
  async function fetchArticleBody(articleItemId) {
    if (!CFG.makeAssembly) { console.error('[CP] No makeAssembly URL for body fetch'); return null; }
    if (!articleItemId) { console.error('[CP] No articleItemId for body fetch'); return null; }
    try {
      const url = CFG.makeAssembly + '?' + new URLSearchParams({ action: 'getArticleBody', articleItemId: articleItemId, titleSlug: CFG.titleSlug }).toString();
      const res = await fetch(url);
      if (!res.ok) throw new Error('getArticleBody returned ' + res.status);
      const data = await res.json();
      return data.body || data.content || data.html || '';
    } catch (err) { console.error('[CP] fetchArticleBody error:', err); return null; }
  }

  function checkReady(sel) {
    if (!A.collection) return false;
    if (!A.cmsItemId && !A.isNew) return false;
    if (A.isNew) { if (!A.newItemName) return false; if (A.collection==='articles' && !A.newRevenueType) return false; }
    return sel.every(f => f.elementType);
  }
  function getTabCounts() {
    // We only know the count of the currently-loaded tab (FILES holds
    // only that tab's rows after v1.0.8 per-tab refetch). Other tabs
    // show no count until you click them. Honest, and avoids stale data.
    const c = {};
    TABS.forEach(t => { c[t.id] = (t.id === TAB) ? FILES.length : null; });
    return c;
  }

  // ══════════════════════════════════════════════
  // CSS: No longer embedded here.
  // All styles provided by title-admin-page-design-v1.0.0.css
  // loaded in Webflow T-A page <head>.
  // ══════════════════════════════════════════════

  // ══════════════════════════════════════════════
  // SHELL HTML
  // ══════════════════════════════════════════════
  mount.innerHTML = `
<div class="cm-root">
  <div class="cm-hdr">
    <div class="cm-hdr-left">
      <div class="cm-hdr-icon">\u{1F4C2}</div>
      <div><h3>Uploads Processor</h3><div class="cm-hdr-sub">Select files \u2192 Assign to CMS records</div></div>
    </div>
    <span class="cm-badge">v1.0.10</span>
  </div>
  <div class="cm-channels" id="cm-channels"></div>
  <div id="cm-gdrive-panel">
    <div class="cm-tabs" id="cm-tabs"></div>
    <div id="cm-breadcrumb"></div>
    <div id="cm-error"></div>
    <div id="cm-sel-bar"></div>
    <div class="cm-flist" id="cm-flist"></div>
  </div>
  <div id="cm-email-panel" style="display:none"></div>
  <div id="cm-form-panel" style="display:none"></div>
</div>`;

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════
  function render() {
    renderChannels();
    const gdriveEl = document.getElementById('cm-gdrive-panel');
    const emailEl  = document.getElementById('cm-email-panel');
    const formEl   = document.getElementById('cm-form-panel');
    const transEl  = document.getElementById('screenshot-transcriber-mount');

    gdriveEl.style.display = CHANNEL === 'gdrive' ? '' : 'none';
    emailEl.style.display  = CHANNEL === 'email' ? '' : 'none';
    formEl.style.display   = CHANNEL === 'form' ? '' : 'none';
    if (transEl) transEl.style.display = CHANNEL === 'transcriber' ? '' : 'none';

    if (CHANNEL === 'gdrive') {
      renderTabs();
      renderBreadcrumb();
      renderError();
      renderSelBar();
      renderFileList();
    } else if (CHANNEL === 'email') {
      renderEmailPlaceholder();
    } else if (CHANNEL === 'form') {
      renderFormPlaceholder();
    }
    // v1.0.10: Converter branch removed — Converter is now a
    // standalone module (ta-converter-v1.0.0.js) self-mounting
    // into Studio Tab 5.
  }

  function renderChannels() {
    let h = '';
    CHANNELS.forEach(ch => {
      const isActive = ch.id === CHANNEL;
      h += `<button class="cm-channel ${isActive?'active':''}" data-cm-channel="${ch.id}">${esc(ch.label)}</button>`;
    });
    document.getElementById('cm-channels').innerHTML = h;
  }

  function renderEmailPlaceholder() {
    document.getElementById('cm-email-panel').innerHTML = `<div class="cm-placeholder">
      <div class="cm-placeholder-icon">\u{1F4E7}</div>
      <div class="cm-placeholder-title">Email Intake</div>
      <div class="cm-placeholder-text">Accept files from publishers via email. Configure a dedicated email address and files will appear here automatically.</div>
    </div>`;
  }

  function renderFormPlaceholder() {
    document.getElementById('cm-form-panel').innerHTML = `<div class="cm-placeholder">
      <div class="cm-placeholder-icon">\u{1F4CB}</div>
      <div class="cm-placeholder-title">Form Submission</div>
      <div class="cm-placeholder-text">Accept content submissions via web form. Placeholder for future intake channel.</div>
    </div>`;
  }

  function renderTabs() {
    const c = getTabCounts();
    let h = '';
    TABS.forEach(t => {
      const isActive = t.id === TAB;
      const countHtml = c[t.id] !== null ? `<span class="cm-tab-count">${c[t.id]}</span>` : '';
      h += `<button class="cm-tab ${isActive?'active':''} ix-btn ix-btn--pill" data-cm-tab="${t.id}">${esc(t.label)}${countHtml}</button>`;
    });
    h += `<span class="cm-tab-spacer"></span>`;
    const u = MONITOR.uploadFolder, p = MONITOR.preprocessing;
    const uCls = u > 5 ? 'cm-monitor-count alert' : u > 0 ? 'cm-monitor-count warn' : 'cm-monitor-count';
    const pCls = p > 5 ? 'cm-monitor-count alert' : p > 0 ? 'cm-monitor-count warn' : 'cm-monitor-count';
    h += `<span class="cm-monitor-inline">Upload: <span class="${uCls}">${u}</span></span>`;
    h += `<span class="cm-monitor-inline">Pre-processing: <span class="${pCls}">${p}</span></span>`;
    h += `<button class="cm-refresh ix-btn ix-btn--ghost" data-cm-refresh>\u21BB Refresh</button>`;
    document.getElementById('cm-tabs').innerHTML = h;
  }

  function renderBreadcrumb() {
    const el = document.getElementById('cm-breadcrumb');
    if (!el) return;
    const folders = {
      'pdf-queue': { label:'Pre-processing Folder',       id:window.TA_CONFIG?.workingFolderId||'',   filter:'status = PDF_PENDING' },
      'ready':     { label:'Ready for Assignment Folder', id:window.TA_CONFIG?.processedFolderId||'', filter:'status = READY_TO_ASSIGN' },
      'assigned':  { label:'Assigned Folder',             id:window.TA_CONFIG?.assignedFolderId||'',  filter:'status = ASSIGNED' },
      'archived':  { label:'Archives',                     id:window.TA_CONFIG?.archiveFolderId||'',   filter:'status = ARCHIVED' },
      'hidden':    { label:'Hidden Folder',                id:window.TA_CONFIG?.hiddenFolderId||'',    filter:'status = HIDDEN' },
    };
    const folder = folders[TAB];
    if (!folder) { el.innerHTML = ''; return; }
    // If folder id not yet configured in TA_CONFIG, show label without link
    if (!folder.id) {
      el.innerHTML = `<div class="cm-breadcrumb"><span class="cm-bc-icon">\u{1F4C1}</span><span class="cm-bc-link" style="text-decoration:none;color:#999">${esc(folder.label)} (not configured)</span><span class="cm-bc-filter">\u00B7 filtered: ${esc(folder.filter)}</span></div>`;
      return;
    }
    const driveUrl = 'https://drive.google.com/drive/folders/' + folder.id;
    el.innerHTML = `<div class="cm-breadcrumb"><span class="cm-bc-icon">\u{1F4C1}</span><a href="${driveUrl}" target="_blank" class="cm-bc-link">${esc(folder.label)}</a><span class="cm-bc-arrow">\u2197</span><span class="cm-bc-filter">\u00B7 filtered: ${esc(folder.filter)}</span></div>`;
  }

  function renderError() {
    const el = document.getElementById('cm-error');
    if (!LOAD_ERR) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="cm-error"><span>${esc(LOAD_ERR)}</span><button data-cm-refresh>Retry</button></div>`;
  }

  function renderSelBar() {
    const sel = getSelected();
    const el  = document.getElementById('cm-sel-bar');
    if (!sel.length) { el.innerHTML = ''; return; }
    if (TAB === 'pdf-queue') {
      el.innerHTML = `<div class="cm-sel-bar"><span class="cm-sel-count">${sel.length} PDF${sel.length>1?'s':''} selected</span><div class="cm-sel-spacer"></div><button class="cm-desel ix-btn ix-btn--ghost" data-cm-desel>\u2715 clear</button><button class="cm-desel ix-btn ix-btn--ghost" data-cm-hide-sel>\u{1F6AB} hide</button><button class="cm-archive-btn ix-btn ix-btn--secondary" data-cm-archive-sel>\u{1F4E6} Archive</button><button class="cm-pdf-btn ix-btn ix-btn--secondary" data-cm-pdf-jpeg>\u{1F5BC}\uFE0F Convert to JPEG</button><button class="cm-pdf-btn cm-pdf-btn-transcribe ix-btn ix-btn--secondary" data-cm-pdf-transcribe>\u{1F4DD} Transcribe &amp; Summarize</button></div>`;
    } else {
      el.innerHTML = `<div class="cm-sel-bar"><span class="cm-sel-count">${sel.length} file${sel.length>1?'s':''} selected</span><div class="cm-sel-spacer"></div><button class="cm-desel ix-btn ix-btn--ghost" data-cm-desel>\u2715 clear</button><button class="cm-desel ix-btn ix-btn--ghost" data-cm-hide-sel>\u{1F6AB} hide</button><button class="cm-archive-btn ix-btn ix-btn--secondary" data-cm-archive-sel>\u{1F4E6} Archive</button><button class="cm-assign-btn ix-btn ix-btn--primary ix-btn--gold" data-cm-open-modal>Assign ${sel.length} File${sel.length>1?'s':''} \u2192</button></div>`;
    }
  }

  function renderFileList() {
    const el = document.getElementById('cm-flist');
    if (LOADING) { el.innerHTML = `<div class="cm-loading"><div class="cm-loading-spin">\u27F3</div><div>Loading files\u2026</div></div>`; return; }
    const tab = TABS.find(t => t.id === TAB);
    // Scenario C already filtered server-side by status. FILES only
    // holds rows for the active tab. No client-side status filtering.
    const vis = FILES;
    if (!vis.length) {
      const msgs = {'pdf-queue':'No PDFs awaiting decision',ready:'No files ready to assign',assigned:'No files assigned yet',archived:'No archived files',hidden:'No hidden files'};
      el.innerHTML = `<div class="cm-empty"><div class="cm-empty-icon">${TAB==='ready'?'\u2705':'\u{1F4ED}'}</div><div class="cm-empty-text">${msgs[TAB]||'No files'}</div></div>`;
      return;
    }
    el.innerHTML = vis.map(f => {
      const icon = FILE_ICONS[f.mime] || '\u{1F4C4}';
      const isAssigned = f.assigned || f.status==='ASSIGNED';
      const isArchived = f.status==='ARCHIVED';
      const isHidden = f.status==='HIDDEN';
      const isPdf = f.status==='PDF_PENDING';
      const badge = isAssigned?'assigned':isArchived?'archived':isHidden?'hidden':isPdf?'decision':'ready';
      const label = isAssigned?'Assigned':isArchived?'Archived':isHidden?'Hidden':isPdf?'PDF Queue':'Ready';
      const typeLabel = mimeLabel(f.mime);
      const ucIndicator = f.uuid ? `<span style="color:#27ae60" title="Uploadcare UUID: ${esc(f.uuid)}">UC \u2713</span>` : `<span style="color:#999" title="No Uploadcare UUID">UC \u2014</span>`;
      const sizeLabel = f.size ? fmtSize(f.size) : `<span style="color:#999">size \u2014</span>`;
      const metaRow = `<span>${typeLabel}</span> <span>${sizeLabel}</span> ${f.arrived?`<span>${f.arrived.substring(0,10)}</span>`:''} ${ucIndicator}`;
      const disabled = isAssigned || isArchived || isHidden || (isPdf && TAB !== 'pdf-queue');
      if (tab && tab.selectable && !disabled) {
        const previewBtn = f.fileId ? `<button class="cm-preview-btn ix-btn ix-btn--ghost ix-btn--icon" data-cm-preview="${esc(f.fileId)}" title="Preview">\u{1F441}</button>` : '';
        return `<div class="cm-frow ${f.selected?'sel':''}" data-cm-fid="${f.id}"><div class="cm-frow-main"><input type="checkbox" class="cm-fcheck" ${f.selected?'checked':''}><span class="cm-ficon">${icon}</span><div class="cm-finfo"><div class="cm-fname">${esc(f.name)}</div><div class="cm-fmeta">${metaRow}</div></div><div class="cm-fright">${previewBtn}<span class="cm-fbadge ${badge}">${label}</span></div></div></div>`;
      }
      const previewBtnRO = f.fileId ? `<button class="cm-preview-btn ix-btn ix-btn--ghost ix-btn--icon" data-cm-preview="${esc(f.fileId)}" title="Preview">\u{1F441}</button>` : '';
      return `<div class="cm-frow ${isAssigned?'assigned':''}"><div class="cm-frow-main no-select"><span class="cm-ficon">${icon}</span><div class="cm-finfo"><div class="cm-fname">${esc(f.name)}</div><div class="cm-fmeta">${metaRow}</div></div><div class="cm-fright">${previewBtnRO}<span class="cm-fbadge ${badge}">${label}</span></div></div></div>`;
    }).join('');
  }

  function renderTranscriberNotice() {
    const el = document.getElementById('screenshot-transcriber-mount');
    if (!el) return;
    const existing = el.querySelector('.cm-transcribe-notice');
    if (existing) existing.remove();
    if (TRANSCRIBE_PDFS.length) {
      const fileList = TRANSCRIBE_PDFS.map(n => `<span class="cm-transcribe-file">\u{1F4D5} ${esc(n)}</span>`).join('');
      el.insertAdjacentHTML('afterbegin', `<div class="cm-transcribe-notice"><div class="cm-transcribe-notice-hdr">\u{1F4DD} Download these PDFs from Google Drive, then drop them here:</div><div class="cm-transcribe-notice-files">${fileList}</div><button class="cm-transcribe-notice-dismiss" onclick="this.closest('.cm-transcribe-notice').remove()">dismiss</button></div>`);
    }
  }

  // ── Converter panel ──
  // v1.0.10: renderConverter() and its three nested helpers
  // (convLoadFile, convProcess, convReset) lifted to standalone
  // ta-converter-v1.0.0.js. Behavior unchanged; the standalone
  // module self-mounts into Studio Tab 5 via the
  // std:panel:converter CustomEvent (dispatched by ta-studio
  // v1.2.10+). UP no longer hosts the Converter.

  function getSelected() {
    if (TAB === 'pdf-queue') return FILES.filter(f => f.selected && f.status==='PDF_PENDING');
    return FILES.filter(f => f.selected && f.status!=='ASSIGNED' && f.status!=='ARCHIVED' && f.status!=='HIDDEN');
  }

  // ══════════════════════════════════════════════
  // EVENT DELEGATION
  // ══════════════════════════════════════════════
  mount.addEventListener('click', function(e) {
    const chBtn = e.target.closest('[data-cm-channel]');
    if (chBtn) { setChannel(chBtn.dataset.cmChannel); return; }
    const tabBtn = e.target.closest('[data-cm-tab]');
    if (tabBtn) { setTab(tabBtn.dataset.cmTab); return; }
    if (e.target.closest('[data-cm-refresh]')) { reload(); return; }
    if (e.target.closest('[data-cm-desel]'))   { deselectAll(); return; }
    if (e.target.closest('[data-cm-hide-sel]')) { hideSelected(); return; }
    if (e.target.closest('[data-cm-archive-sel]')) { archiveSelected(); return; }
    if (e.target.closest('[data-cm-pdf-jpeg]')) { processPdfs('convert_to_jpeg'); return; }
    if (e.target.closest('[data-cm-pdf-transcribe]')) { redirectToTranscriber(); return; }
    if (e.target.closest('[data-cm-open-modal]')) { openModal(); return; }
    const previewBtn = e.target.closest('[data-cm-preview]');
    if (previewBtn) { e.stopPropagation(); openPreview(previewBtn.dataset.cmPreview); return; }
    const frow = e.target.closest('[data-cm-fid]');
    if (frow) { toggleSel(frow.dataset.cmFid); return; }
  });

  function setChannel(id) {
    CHANNEL = id;
    FILES = [];
    A = freshA();
    if (id === 'gdrive') {
      TAB = 'ready';
      const tab = TABS.find(t => t.id === TAB);
      loadFiles(tab.status);
    }
    if (id !== 'transcriber') TRANSCRIBE_PDFS = [];
    render();
  }
  function setTab(id) {
    TAB = id;
    FILES = [];
    A = freshA();
    const tab = TABS.find(t => t.id === id);
    if (tab) loadFiles(tab.status);
    render();
  }
  function reload() {
    const tab = TABS.find(t => t.id === TAB);
    if (tab) loadFiles(tab.status);
    loadFolderCounts();
  }
  function toggleSel(id) {
    const f = FILES.find(x => x.id === id);
    if (!f || f.status==='ASSIGNED' || f.status==='ARCHIVED') return;
    if (f.status==='PDF_PENDING' && TAB !== 'pdf-queue') return;
    f.selected = !f.selected;
    if (!f.selected) f.elementType = '';
    renderSelBar(); renderFileList();
  }
  function deselectAll() {
    FILES.forEach(f => { f.selected = false; f.elementType = ''; });
    A = freshA(); closeModal(); render();
  }
  function hideSelected() { updateFileStatuses(getSelected(), 'HIDDEN'); }
  function archiveSelected() { updateFileStatuses(getSelected(), 'ARCHIVED'); }

  function updateFileStatuses(sel, newStatus) {
    if (!sel.length || !CFG.scenarioCUrl) return;
    sel.forEach(f => { f.selected=false; f.elementType=''; f._updating=true; });
    render();
    const promises = sel.map(f => {
      const qs = new URLSearchParams({ titleSlug:CFG.titleSlug, action:'updateStatus', fileId:f.fileId, newStatus });
      return fetch(CFG.scenarioCUrl+'?'+qs.toString()).then(res=>{if(!res.ok) throw new Error(res.status);return res.json();}).then(()=>{f.status=newStatus;delete f._updating;console.log('[CP]',f.name,'\u2192',newStatus);}).catch(err=>{console.error('[CP] Status update error:',f.name,err);delete f._updating;});
    });
    Promise.all(promises).then(() => {
      // Files that just changed status no longer belong in the active
      // tab. Remove them locally rather than re-fetching.
      const activeStatus = (TABS.find(t => t.id === TAB) || {}).status;
      FILES = FILES.filter(f => f.status === activeStatus);
      render();
    });
  }

  function processPdfs(action) {
    const sel = getSelected();
    if (!sel.length || !CFG.makeConditioner) { if(!CFG.makeConditioner) console.error('[CP] No makeConditioner URL'); return; }
    sel.forEach(f => { f.selected=false; f._processing=true; }); render();
    const promises = sel.map(f =>
      fetch(CFG.makeConditioner, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({titleSlug:CFG.titleSlug,fileId:f.fileId,fileName:f.name,mimeType:f.mime,action}) })
      .then(res=>{if(!res.ok) throw new Error(res.status+' for '+f.name);f.status='READY_TO_ASSIGN';delete f._processing;console.log('[CP] PDF processed:',f.name);})
      .catch(err=>{console.error('[CP] PDF error:',f.name,err);delete f._processing;})
    );
    Promise.all(promises).then(() => {
      // After PDF conversion, files are now READY_TO_ASSIGN — they
      // don't belong in PDF Queue anymore. Remove from local FILES.
      const activeStatus = (TABS.find(t => t.id === TAB) || {}).status;
      FILES = FILES.filter(f => f.status === activeStatus);
      render();
    });
  }

  function redirectToTranscriber() {
    const sel = getSelected(); if (!sel.length) return;
    TRANSCRIBE_PDFS = sel.map(f => f.name);
    sel.forEach(f => { f.selected = false; });
    CHANNEL = 'transcriber'; A = freshA(); render(); renderTranscriberNotice();
    console.log('[CP] Redirected to Transcriber for:', TRANSCRIBE_PDFS.join(', '));
  }

  // ══════════════════════════════════════════════
  // FILE PREVIEW LIGHTBOX
  // ══════════════════════════════════════════════
  function openPreview(fileId) {
    if (!fileId) return;
    const existing = document.getElementById('cm-preview-lightbox');
    if (existing) existing.remove();
    const lightbox = document.createElement('div');
    lightbox.id = 'cm-preview-lightbox';
    lightbox.className = 'cm-preview-overlay';
    lightbox.innerHTML = `<div class="cm-preview-panel"><div class="cm-preview-header"><span class="cm-preview-title">File Preview</span><button class="cm-preview-close ix-btn ix-btn--ghost ix-btn--icon" id="cm-preview-close">\u2715</button></div><div class="cm-preview-body"><iframe src="https://drive.google.com/file/d/${fileId}/preview" class="cm-preview-iframe" allowfullscreen></iframe></div></div>`;
    document.body.appendChild(lightbox);
    document.getElementById('cm-preview-close').addEventListener('click', closePreview);
    lightbox.addEventListener('click', function(e) { if (e.target === lightbox) closePreview(); });
    document.addEventListener('keydown', previewEscHandler);
  }
  function closePreview() { const lb=document.getElementById('cm-preview-lightbox'); if(lb) lb.remove(); document.removeEventListener('keydown',previewEscHandler); }
  function previewEscHandler(e) { if(e.key==='Escape') closePreview(); }

  // ══════════════════════════════════════════════
  // MODAL
  // ══════════════════════════════════════════════
  let MODAL_OPEN = false;
  function openModal() { const sel=getSelected(); if(!sel.length) return; MODAL_OPEN=true; renderModal(); }
  function closeModal() { MODAL_OPEN=false; destroyChoices(); var existing=document.getElementById('cm-modal-root'); if(existing) existing.remove(); }

  function renderModal() {
    if (!MODAL_OPEN) return;
    const sel = getSelected();
    if (!sel.length) { closeModal(); return; }
    const col=A.collection, s1=!!col, s2=s1, s3=s2&&!!(A.cmsItemId||(A.isNew&&A.newItemName)), s4=s3&&sel.every(f=>f.elementType);
    const stepCls = (done,active) => done?'cm-step done-s':active?'cm-step active':'cm-step';
    let h = `<div class="cm-overlay" data-cm-overlay><div class="cm-modal"><div class="cm-modal-bar"></div><div class="cm-modal-head"><div><div class="cm-modal-title">Assign ${sel.length} File${sel.length>1?'s':''}</div><div class="cm-modal-sub">Complete all steps \u00B7 tag each file individually</div></div><button class="cm-modal-close ix-btn ix-btn--ghost ix-btn--icon" data-cm-close>\u2715</button></div><div class="cm-modal-files">${sel.map(f=>`<span class="cm-modal-file-chip">${FILE_ICONS[f.mime]||'\u{1F4C4}'} ${esc(f.name)}</span>`).join('')}</div><div class="cm-modal-body"><div class="cm-steps"><span class="${stepCls(s1,!s1)}">1 Collection</span><span class="cm-step-arr">\u2192</span><span class="${stepCls(s2&&!!A.customerId,s1&&!A.customerId)}">2 Customer</span><span class="cm-step-arr">\u2192</span><span class="${stepCls(s3,s2&&!s3)}">3 Item</span><span class="cm-step-arr">\u2192</span><span class="${stepCls(s4,s3&&!s4)}">4 Tag</span></div>`;
    h += `<div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Select Asset Type <span class="req">*</span></label><select class="cm-fsel${chg(col)}" data-cm-field="collection"><option value="">Select Type\u2026</option>${COLLECTIONS.map(c=>`<option value="${c.id}"${c.id===col?' selected':''}>${esc(c.label)}</option>`).join('')}</select></div></div>`;
    if (s1) {
      h += `<div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Customer</label><select class="cm-fsel${chg(A.customerId)}" data-cm-field="customerId" id="cm-sel-cust"><option value="">Any / None</option><option value="__none__">\u2014 No Customer / Unsponsored</option>${readCustomers().map(c=>`<option value="${c.id}"${c.id===A.customerId?' selected':''}>${esc(c.name)}</option>`).join('')}<option value="__new__">+ New Customer</option></select></div></div>`;
      if (A.nestedOpen) h += `<div class="cm-nested"><div class="cm-nested-hdr"><span>+ New Customer</span><button class="cm-nested-close ix-btn ix-btn--ghost" data-cm-nested-close>\u2715 cancel</button></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Business Name <span class="req">*</span></label><input class="cm-finp${chg(A.nestedName)}" data-cm-field="nestedName" type="text" value="${esc(A.nestedName)}" placeholder="Business name\u2026"></div></div><div style="text-align:right;margin-top:4px"><button class="cm-sub-btn ix-btn ix-btn--primary" data-cm-create-cust${A.nestedName?'':' disabled'}>Create Customer</button></div></div>`;
      if (A.isNew) {
        h += buildNewItemFormHTML(col);
        h += `<div style="margin-bottom:8px"><button class="cm-link-btn ix-btn ix-btn--ghost" data-cm-back-existing>\u2190 back to existing</button></div>`;
      } else {
        const items = getCMSItems(col, A.customerId);
        h += `<div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Select ${colLabel(col)} <span class="req">*</span></label><select class="cm-fsel${chg(A.cmsItemId)}" data-cm-field="cmsItemId" id="cm-sel-item"><option value="">Select ${colLabel(col)}\u2026</option>${items.map(i=>`<option value="${i.id}"${i.id===A.cmsItemId?' selected':''}>${esc(i.name)}</option>`).join('')}</select></div></div>`;
        if (!items.length) h += `<div class="cm-no-results"><span>No ${colLabel(col)}s found${A.customerId&&A.customerId!=='__none__'?' for this customer':''}</span><button data-cm-new-item>+ Create New</button></div>`;
        else h += `<div style="margin-bottom:8px"><button class="cm-link-btn ix-btn ix-btn--ghost" data-cm-new-item>+ or create new ${colLabel(col)}</button></div>`;
      }
    }
    if (s3) {
      const etypes = ETYPES[col] || [];
      if (etypes.length) {
        h += `<div class="cm-tag-list"><div class="cm-tag-label">Tag Each File\u2019s Element Type</div>`;
        sel.forEach(f => { const icon=FILE_ICONS[f.mime]||'\u{1F4C4}'; h += `<div class="cm-tag-row${f.elementType?' tagged':''}" data-cm-tag-fid="${f.id}"><span class="cm-tag-icon">${icon}</span><span class="cm-tag-name">${esc(f.name)}</span><div class="cm-echips">${etypes.map(t=>`<span class="cm-echip${t.id===f.elementType?' sel':''}" data-cm-etype="${t.id}">${t.l}</span>`).join('')}</div></div>`; });
        h += `</div>`;
      }
    }
    h += `</div>`;
    const ok=checkReady(sel), tagged=sel.filter(f=>f.elementType).length;
    h += `<div class="cm-modal-footer"><button class="cm-cancel ix-btn ix-btn--ghost" data-cm-reset>\u2715 reset</button><div class="cm-sub-right"><span class="cm-sub-info">${tagged}/${sel.length} tagged${ok?' \u2014 ready':''}</span><button class="cm-sub-btn ix-btn ix-btn--primary" data-cm-submit${ok?'':' disabled'}>Assign ${sel.length} File${sel.length>1?'s':''} \u2713</button></div></div></div></div>`;
    var existing=document.getElementById('cm-modal-root'); if(existing) existing.remove();
    var modalRoot=document.createElement('div'); modalRoot.id='cm-modal-root'; modalRoot.innerHTML=h; document.body.appendChild(modalRoot);
    bindModalEvents(); initChoicesDropdowns();
  }

  function buildNewItemFormHTML(col) {
    if (col==='articles') return `<div class="cm-new-form"><div class="cm-new-form-title">New Article</div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Article Title <span class="req">*</span></label><input class="cm-finp${chg(A.newItemName)}" data-cm-field="newItemName" type="text" value="${esc(A.newItemName)}" placeholder="Article title\u2026"></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Sub-Title</label><input class="cm-finp${chg(A.newSubTitle)}" data-cm-field="newSubTitle" type="text" value="${esc(A.newSubTitle)}" placeholder="Sub-title\u2026"></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Revenue Type <span class="req">*</span></label><select class="cm-fsel${chg(A.newRevenueType)}" data-cm-field="newRevenueType"><option value="">Select\u2026</option><option value="d894f7e97435fc2f06fdb79c75e8ea29"${A.newRevenueType==='d894f7e97435fc2f06fdb79c75e8ea29'?' selected':''}>Paid Ad</option><option value="99578b8a5a6a99e9c15c0c2ed30c22b2"${A.newRevenueType==='99578b8a5a6a99e9c15c0c2ed30c22b2'?' selected':''}>Paid Article</option><option value="1625d5aa547083d33098b8b6fd4b0569"${A.newRevenueType==='1625d5aa547083d33098b8b6fd4b0569'?' selected':''}>Sponsorable</option></select></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Product (Category)</label><select class="cm-fsel${chg(A.newProductType)}" data-cm-field="newProductType"><option value="">Select product\u2026</option>${readProducts().map(p=>`<option value="${p.id}" data-mnls="${p.mnlsId}"${p.id===A.newProductType?' selected':''}>${esc(p.name)}</option>`).join('')}</select></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Writer Name</label><input class="cm-finp" data-cm-field="newWriterName" type="text" value="${esc(A.newWriterName)}" placeholder="Name\u2026"></div><div class="cm-ff"><label class="cm-fl">Writer Title</label><input class="cm-finp" data-cm-field="newWriterTitle" type="text" value="${esc(A.newWriterTitle)}" placeholder="Role\u2026"></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Co-Writer</label><input class="cm-finp" data-cm-field="newCoWriterName" type="text" value="${esc(A.newCoWriterName)}" placeholder="Optional\u2026"></div><div class="cm-ff"><label class="cm-fl">Co-Writer Title</label><input class="cm-finp" data-cm-field="newCoWriterTitle" type="text" value="${esc(A.newCoWriterTitle)}" placeholder="Optional\u2026"></div></div><div style="border-top:1px dashed #ddd9c8;margin-top:8px;padding-top:8px"><button class="cm-extras-toggle" data-cm-extras-toggle>\u25B8 Additional fields</button><div style="margin-top:10px;${A.newExtrasOpen?'':'display:none'}" data-cm-extras-body><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Banner Statement</label><input class="cm-finp" data-cm-field="newBannerStatement" type="text" value="${esc(A.newBannerStatement)}" placeholder="Optional\u2026"></div></div><div class="cm-fr" style="align-items:center;gap:20px;flex-wrap:wrap"><label class="cm-chk-label"><input type="checkbox" data-cm-chk="newPhotoCredits"${A.newPhotoCredits?' checked':''}> Show Photo Credits</label><label class="cm-chk-label"><input type="checkbox" data-cm-chk="newPhotoEssay"${A.newPhotoEssay?' checked':''}> Photo Essay</label><label class="cm-chk-label"><input type="checkbox" data-cm-chk="newVideoArticle"${A.newVideoArticle?' checked':''}> Video Article</label></div><div class="cm-fr" style="margin-top:8px;${A.newPhotoCredits?'':'display:none'}" data-cm-photo-wrap><div class="cm-ff"><label class="cm-fl">Photographer</label><input class="cm-finp" data-cm-field="newPhotographer" type="text" value="${esc(A.newPhotographer)}" placeholder="Name\u2026"></div></div><div class="cm-fr" style="margin-top:8px;${A.newVideoArticle?'':'display:none'}" data-cm-video-wrap><div class="cm-ff"><label class="cm-fl">Video URL</label><input class="cm-finp" data-cm-field="newVideoUrl" type="text" value="${esc(A.newVideoUrl)}" placeholder="https://\u2026"></div></div><div class="cm-fr" style="margin-top:8px"><div class="cm-ff"><label class="cm-fl">Audio URL</label><input class="cm-finp" data-cm-field="newAudioUrl" type="text" value="${esc(A.newAudioUrl)}" placeholder="https://\u2026"></div></div></div></div></div>`;
    if (col==='ads') { const today=new Date().toISOString().split('T')[0], sixMo=new Date(Date.now()+183*24*60*60*1000).toISOString().split('T')[0]; return `<div class="cm-new-form"><div class="cm-new-form-title">New Ad</div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Ad Name <span class="req">*</span></label><input class="cm-finp${chg(A.newItemName)}" data-cm-field="newItemName" type="text" value="${esc(A.newItemName)}" placeholder="Ad name\u2026"></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Click URL</label><input class="cm-finp${chg(A.newAdClickUrl)}" data-cm-field="newAdClickUrl" type="text" value="${esc(A.newAdClickUrl)}" placeholder="https://\u2026"></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Start Date</label><input class="cm-finp changed" data-cm-field="newAdStartDate" type="date" value="${A.newAdStartDate||today}"></div><div class="cm-ff"><label class="cm-fl">End Date</label><input class="cm-finp changed" data-cm-field="newAdEndDate" type="date" value="${A.newAdEndDate||sixMo}"></div></div></div>`; }
    if (col==='events') return `<div class="cm-new-form"><div class="cm-new-form-title">New Event</div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Event Title <span class="req">*</span></label><input class="cm-finp${chg(A.newItemName)}" data-cm-field="newItemName" type="text" value="${esc(A.newItemName)}" placeholder="Event title\u2026"></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Event Start <span class="req">*</span></label><input class="cm-finp${chg(A.newEventStart)}" data-cm-field="newEventStart" type="datetime-local" value="${A.newEventStart}"></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Location</label><input class="cm-finp" data-cm-field="newEventLocation" type="text" value="${esc(A.newEventLocation)}" placeholder="Venue\u2026"></div><div class="cm-ff"><label class="cm-fl">City</label><input class="cm-finp" data-cm-field="newEventCity" type="text" value="${esc(A.newEventCity)}" placeholder="City\u2026"></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Address</label><input class="cm-finp" data-cm-field="newEventAddress" type="text" value="${esc(A.newEventAddress)}" placeholder="Street address\u2026"></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Description</label><input class="cm-finp" data-cm-field="newEventDescription" type="text" value="${esc(A.newEventDescription)}" placeholder="Brief description\u2026"></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Event Link</label><input class="cm-finp" data-cm-field="newEventLink" type="text" value="${esc(A.newEventLink)}" placeholder="https://\u2026"></div></div></div>`;
    if (col==='re') return `<div class="cm-new-form"><div class="cm-new-form-title">New RE Listing</div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Property Address <span class="req">*</span></label><input class="cm-finp${chg(A.newItemName)}" data-cm-field="newItemName" type="text" value="${esc(A.newItemName)}" placeholder="42 Oak Street\u2026"></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Listing Status</label><select class="cm-fsel${chg(A.newReListingStatus)}" data-cm-field="newReListingStatus"><option value="">Select\u2026</option><option value="b0887da3d5d4d77a684cbb96531bd08c"${A.newReListingStatus==='b0887da3d5d4d77a684cbb96531bd08c'?' selected':''}>Active</option><option value="4a8316ea601504d55ec421db92fed4ff"${A.newReListingStatus==='4a8316ea601504d55ec421db92fed4ff'?' selected':''}>Coming Soon</option><option value="9091234ac1ce288c11c363e430337622"${A.newReListingStatus==='9091234ac1ce288c11c363e430337622'?' selected':''}>Under Contract</option><option value="09a0a251160c6d74cfd8783e267ecae7"${A.newReListingStatus==='09a0a251160c6d74cfd8783e267ecae7'?' selected':''}>Sold</option></select></div><div class="cm-ff"><label class="cm-fl">MLS #</label><input class="cm-finp" data-cm-field="newReMls" type="text" value="${esc(A.newReMls)}" placeholder="MLS number\u2026"></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Price</label><input class="cm-finp${chg(A.newRePrice)}" data-cm-field="newRePrice" type="number" value="${A.newRePrice}" placeholder="549000"></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Features</label><input class="cm-finp" data-cm-field="newReFeatures" type="text" value="${esc(A.newReFeatures)}" placeholder="3BR, 2BA\u2026"></div></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Listing Link</label><input class="cm-finp" data-cm-field="newReListingLink" type="text" value="${esc(A.newReListingLink)}" placeholder="https://\u2026"></div></div></div>`;
    return `<div class="cm-new-form"><div class="cm-new-form-title">New ${esc(colLabel(col))}</div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Name <span class="req">*</span></label><input class="cm-finp${chg(A.newItemName)}" data-cm-field="newItemName" type="text" value="${esc(A.newItemName)}" placeholder="Name\u2026"></div></div></div>`;
  }

  // ── Choices.js ──
  let choicesInstances = [];
  function destroyChoices() { choicesInstances.forEach(c=>{try{c.destroy();}catch(e){}}); choicesInstances=[]; }
  function initChoicesDropdowns() {
    destroyChoices();
    if (typeof Choices === 'undefined') return;
    const custSel=document.getElementById('cm-sel-cust');
    if (custSel) { const cc=new Choices(custSel,{searchEnabled:true,searchPlaceholderValue:'Type to search customers\u2026',itemSelectText:'',shouldSort:false,position:'bottom',classNames:{containerOuter:'cm-choices'}}); if(A.customerId) cc.containerOuter.element.classList.add('has-selection'); cc.passedElement.element.addEventListener('change',function(){cc.containerOuter.element.classList.toggle('has-selection',!!this.value);handleFieldChange('customerId',this.value);}); choicesInstances.push(cc); }
    const itemSel=document.getElementById('cm-sel-item');
    if (itemSel) { const ic=new Choices(itemSel,{searchEnabled:true,searchPlaceholderValue:'Type to search\u2026',itemSelectText:'',shouldSort:false,position:'bottom',classNames:{containerOuter:'cm-choices'}}); if(A.cmsItemId) ic.containerOuter.element.classList.add('has-selection'); ic.passedElement.element.addEventListener('change',function(){ic.containerOuter.element.classList.toggle('has-selection',!!this.value);handleFieldChange('cmsItemId',this.value);}); choicesInstances.push(ic); }
  }

  // ── Modal events ──
  let _modalClickHandler=null, _modalChangeHandler=null, _modalInputHandler=null;
  function bindModalEvents() {
    const root=document.getElementById('cm-modal-root'); if(!root.firstChild) return;
    if(_modalClickHandler) root.removeEventListener('click',_modalClickHandler);
    if(_modalChangeHandler) root.removeEventListener('change',_modalChangeHandler);
    if(_modalInputHandler) root.removeEventListener('input',_modalInputHandler);
    _modalClickHandler = function(e) {
      if(e.target.matches('[data-cm-overlay]')){closeModal();return;}
      if(e.target.closest('[data-cm-close]')){closeModal();return;}
      if(e.target.closest('[data-cm-reset]')){A=freshA();getSelected().forEach(f=>f.elementType='');renderModal();return;}
      if(e.target.closest('[data-cm-submit]')){submitAssignment();return;}
      if(e.target.closest('[data-cm-new-item]')){A.isNew=true;A.cmsItemId='';renderModal();return;}
      if(e.target.closest('[data-cm-back-existing]')){A.isNew=false;A.newItemName='';renderModal();return;}
      if(e.target.closest('[data-cm-nested-close]')){A.nestedOpen=false;renderModal();return;}
      if(e.target.closest('[data-cm-create-cust]')){createCustomer();return;}
      if(e.target.closest('[data-cm-extras-toggle]')){A.newExtrasOpen=!A.newExtrasOpen;renderModal();return;}
      const chip=e.target.closest('[data-cm-etype]');
      if(chip){const row=chip.closest('[data-cm-tag-fid]');if(row){const f=FILES.find(x=>x.id===row.dataset.cmTagFid);if(f){const overlay=document.querySelector('.cm-overlay');const sp=overlay?overlay.scrollTop:0;f.elementType=chip.dataset.cmEtype;renderModal();const o2=document.querySelector('.cm-overlay');if(o2)o2.scrollTop=sp;}}return;}
    };
    root.addEventListener('click',_modalClickHandler);
    _modalChangeHandler = function(e) {
      if(e.target.id==='cm-sel-cust'||e.target.id==='cm-sel-item') return;
      const field=e.target.dataset.cmField;
      if(!field){const chk=e.target.dataset.cmChk;if(chk&&chk in A){A[chk]=e.target.checked;renderModal();}return;}
      handleFieldChange(field,e.target.value);
    };
    root.addEventListener('change',_modalChangeHandler);
    _modalInputHandler = function(e) {
      const field=e.target.dataset.cmField; if(!field) return;
      if(e.target.tagName==='INPUT'&&e.target.type!=='checkbox'){A[field]=e.target.value;e.target.classList.toggle('changed',!!e.target.value);updateFooterOnly();}
    };
    root.addEventListener('input',_modalInputHandler);
  }

  function handleFieldChange(field, value) {
    if(field==='collection'){A.collection=value;A.customerId='';A.cmsItemId='';A.isNew=false;A.newItemName='';A.nestedOpen=false;A.nestedName='';A.newRevenueType='';A.newProductType='';A.newMajorNlSection='';A.newSubTitle='';A.newWriterName='';A.newWriterTitle='';A.newCoWriterName='';A.newCoWriterTitle='';A.newPhotoCredits=false;A.newPhotographer='';A.newPhotoEssay=false;A.newVideoArticle=false;A.newVideoUrl='';A.newAudioUrl='';A.newBannerStatement='';A.newExtrasOpen=false;A.newAdClickUrl='';A.newAdStartDate='';A.newAdEndDate='';A.newEventStart='';A.newEventDescription='';A.newEventLocation='';A.newEventAddress='';A.newEventCity='';A.newEventLink='';A.newReListingStatus='';A.newReMls='';A.newRePrice='';A.newReFeatures='';A.newReListingLink='';if(value)getSelected().forEach(f=>{f.elementType=guessEType(f,value);});else getSelected().forEach(f=>{f.elementType='';});renderModal();}
    else if(field==='customerId'){if(value==='__new__'){A.nestedOpen=true;A.customerId='';renderModal();return;}A.customerId=value;A.nestedOpen=false;A.cmsItemId='';A.isNew=false;A.newItemName='';renderModal();}
    else if(field==='cmsItemId'){A.cmsItemId=value;renderModal();}
    else if(field==='newRevenueType'||field==='newReListingStatus'){A[field]=value;renderModal();}
    else if(field==='newProductType'){A.newProductType=value;const opt=document.querySelector('[data-cm-field="newProductType"] option:checked');A.newMajorNlSection=opt?opt.getAttribute('data-mnls')||'':'';renderModal();}
    else{A[field]=value;}
  }

  function updateFooterOnly() {
    const sel=getSelected(),ok=checkReady(sel),tagged=sel.filter(f=>f.elementType).length;
    const info=document.querySelector('.cm-sub-info'),btn=document.querySelector('[data-cm-submit]');
    if(info) info.textContent=`${tagged}/${sel.length} tagged${ok?' \u2014 ready':''}`;
    if(btn) btn.disabled=!ok;
  }

  function createCustomer() {
    if(!A.nestedName) return;
    localCustomers.push({id:'new-'+Date.now(),name:A.nestedName});
    A.customerId='new-'+Date.now();A.nestedOpen=false;A.nestedName='';renderModal();
  }

  // ══════════════════════════════════════════════
  // SUBMIT
  // ══════════════════════════════════════════════
  function submitAssignment() {
    const sel=getSelected(); if(!checkReady(sel)) return;
    doSubmit(sel);
  }

  function doSubmit(sel) {
    const payload={titleSlug:CFG.titleSlug,taItemId:CFG.taItemId,collection:A.collection,customerId:A.customerId==='__none__'?'':A.customerId,cmsItemId:A.cmsItemId||'',isNew:A.isNew,newItemName:A.newItemName||'',newProductType:A.newProductType||'',newMajorNlSection:A.newMajorNlSection||'',newRevenueType:A.newRevenueType||'',newSubTitle:A.newSubTitle||'',newWriterName:A.newWriterName||'',newWriterTitle:A.newWriterTitle||'',newCoWriterName:A.newCoWriterName||'',newCoWriterTitle:A.newCoWriterTitle||'',newPhotoCredits:A.newPhotoCredits||false,newPhotographer:A.newPhotographer||'',newPhotoEssay:A.newPhotoEssay||false,newVideoArticle:A.newVideoArticle||false,newVideoUrl:A.newVideoUrl||'',newAudioUrl:A.newAudioUrl||'',newBannerStatement:A.newBannerStatement||'',newAdClickUrl:A.newAdClickUrl||'',newAdStartDate:A.newAdStartDate||'',newAdEndDate:A.newAdEndDate||'',newEventStart:A.newEventStart||'',newEventDescription:A.newEventDescription||'',newEventLocation:A.newEventLocation||'',newEventAddress:A.newEventAddress||'',newEventCity:A.newEventCity||'',newEventLink:A.newEventLink||'',newReListingStatus:A.newReListingStatus||'',newReMls:A.newReMls||'',newRePrice:A.newRePrice||'',newReFeatures:A.newReFeatures||'',newReListingLink:A.newReListingLink||'',files:sel.map(f=>({fileId:f.fileId,fileName:f.name,uploadcareUuid:f.uuid,mimeType:f.mime,elementType:f.elementType}))};
    console.log('[CP ASSIGN]',payload);
    const done=()=>{sel.forEach(f=>{f.assigned=true;f.selected=false;});A=freshA();closeModal();render();};
    if(CFG.makeAssembly){fetch(CFG.makeAssembly,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(done).catch(err=>{console.error('[CP] Submit error:',err);done();});}else{done();}
  }

  // ══════════════════════════════════════════════
  // RTE — EDIT ARTICLE BODY
  // ══════════════════════════════════════════════
  async function editArticleBody(articleItemId, articleTitle) {
    if (!window.InbxRTE) { console.error('[CP] InbxRTE not loaded'); return; }
    if (!articleItemId) { console.error('[CP] No articleItemId'); return; }

    const html = await fetchArticleBody(articleItemId);
    if (html === null) {
      console.error('[CP] Could not fetch article body for', articleItemId);
      return;
    }

    window._cpRteInstance = InbxRTE.openFullscreen({
      articleItemId: articleItemId,
      articleTitle: articleTitle || '',
      initialHTML: html,
      mode: 'edit',
      onSave: function(editedHTML) {
        if (CFG.makeAssembly) {
          fetch(CFG.makeAssembly, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'updateArticleBody',
              titleSlug: CFG.titleSlug,
              articleItemId: articleItemId,
              articleBody: editedHTML,
              bodyStatus: 'Edited'
            })
          }).then(() => {
            console.log('[CP] Article body saved + status set to Edited:', articleItemId);
            const el = document.querySelector(`.articles-wrapper[data-article-id="${articleItemId}"]`);
            if (el) el.setAttribute('data-body-status', 'Edited');
          }).catch(err => console.error('[CP] Body save error:', err));
        }
        window._cpRteInstance = null;
      },
      onClose: function() {
        window._cpRteInstance = null;
      }
    });
  }

  window.InbxEditBody = editArticleBody;

  // ══════════════════════════════════════════════
  // DATA LOADING
  // ══════════════════════════════════════════════
  async function loadFiles(status) {
    if(!CFG.scenarioCUrl){LOAD_ERR='No Scenario C URL configured in window.TA_CONFIG';render();return;}
    if(!status){console.error('[CP] loadFiles called without status param');return;}
    LOADING=true;LOAD_ERR=null;render();
    try{
      const url=`${CFG.scenarioCUrl}?titleSlug=${encodeURIComponent(CFG.titleSlug)}&status=${encodeURIComponent(status)}`;
      const res=await fetch(url);
      if(!res.ok) throw new Error('Scenario C returned '+res.status);
      const data=await res.json();
      FILES=(Array.isArray(data)?data:[]).map((row,i)=>({id:row['0']||('f'+i),fileId:row['0']||'',name:row['1']||'(unknown)',mime:row['2']||'',size:parseInt(row['3']||'0',10)||0,arrived:row['4']||'',status:row['5']||'',uuid:row['6']||'',selected:false,elementType:'',assigned:false}));
      LOADING=false;
    }catch(err){LOADING=false;LOAD_ERR=err.message;FILES=[];}
    render();
  }

  async function loadFolderCounts() {
    if(!CFG.scenarioCUrl) return;
    try{
      const url=`${CFG.scenarioCUrl}?titleSlug=${encodeURIComponent(CFG.titleSlug)}&action=folderCounts`;
      const res=await fetch(url);
      if(!res.ok) throw new Error('Folder counts returned '+res.status);
      const data=await res.json();
      MONITOR.uploadFolder=data.uploadFolder||0;
      MONITOR.preprocessing=data.preprocessing||0;
      console.log('[CP] Folder counts:',MONITOR);
      renderTabs();
    }catch(err){console.error('[CP] Folder counts error:',err);}
  }

  // ── Init ──
  loadFiles('READY_TO_ASSIGN');
  loadFolderCounts();
  console.log('\u{1F4C2} Uploads Processor v1.0.10 mounted (S13 Step 3 \u2014 Converter excised; standalone module ta-converter-v1.0.0.js)');
});
