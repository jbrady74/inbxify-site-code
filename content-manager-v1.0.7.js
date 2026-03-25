// ============================================================
// content-manager-v1.0.7.js
// INBXIFY Content Manager — System 2 UI
// v1.0.7: PRODUCT_TYPES now read from MNLS products-wrapper DOM
//         instead of hardcoded array (TD-010 deferred items tracked)
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  const mount = document.getElementById('content-manager-mount');
  if (!mount) return;

  // ── Config ──
  const CFG = {
    get scenarioCUrl() { return window.TA_CONFIG?.scenarioC || 'https://hook.us1.make.com/yg88sqpzwp5nyxiipoqgqcsipqplrfgk'; },
    get makeAssembly() { return window.TA_CONFIG?.makeAssembly || ''; },
    get titleSlug()    { return window.TA_CONFIG?.titleSlug  || document.querySelector('[data-ta-slug]')?.dataset.taSlug || 'wyckoff-living-now'; },
    get taItemId()     { return window.TA_CONFIG?.taItemId   || ''; },
  };

  // ── State ──
  let FILES     = [];   // loaded from Scenario C
  let FILTER    = 'ready';  // ready | all | done | decision
  let SELECTED  = new Set();
  let LOADING   = false;
  let LOAD_ERR  = null;
  let MODAL_OPEN = false;

  // Debounced render — prevents re-render on every keystroke for text inputs
  let _renderTimer = null;
  function deferRender() {
    clearTimeout(_renderTimer);
    _renderTimer = setTimeout(render, 300);
  }

  // Assignment state
  let A = {
    productType: '',
    customerId: '',
    cmsItemId: '',
    isNew: false,
    newItemName: '',
    nestedOpen: false,
    nestedName: '',
    // Article creation fields
    newRevenueType: '',
    newSubTitle: '',
    newWriterName: '',
    newWriterTitle: '',
    newCoWriterName: '',
    newCoWriterTitle: '',
    newPhotoCredits: false,
    newPhotographer: '',
    newPhotoEssay: false,
    newVideoArticle: false,
    newVideoUrl: '',
    newAudioUrl: '',
    newBannerStatement: '',
    newExtrasOpen: false,
    // Ad creation fields
    newAdClickUrl: '',
    newAdStartDate: '',
    newAdEndDate: '',
    // Event creation fields
    newEventStart: '',
    newEventDescription: '',
    newEventLocation: '',
    newEventAddress: '',
    newEventCity: '',
    newEventLink: '',
    // RE creation fields
    newReListingStatus: '',
    newReMls: '',
    newReAddress: '',
    newRePrice: '',
    newReFeatures: '',
    newReListingLink: '',
  };

  // ── Static data (customers + CMS items from Webflow hidden lists) ──
  // In production these come from hidden Webflow collection list wrappers
  // For now: read from DOM data attributes (same pattern as PubPlan modal)
  const CUSTOMERS = Array.from(document.querySelectorAll('[data-customers-wrapper] [data-item]')).map(el => ({
    id:   el.getAttribute('data-id')   || el.dataset.id   || '',
    name: el.getAttribute('data-name') || el.dataset.name || '',
  })).filter(c => c.id);

  const ARTICLES = Array.from(document.querySelectorAll('[data-articles-wrapper] [data-item]')).map(el => ({
    id:         el.getAttribute('data-article-id') || el.getAttribute('data-id') || '',
    name:       el.getAttribute('data-article-title') || el.getAttribute('data-name') || '',
    customerId: el.getAttribute('data-article-customer-id') || '',
  })).filter(a => a.id);

  const ADS = Array.from(document.querySelectorAll('[data-ads-wrapper] [data-item]')).map(el => ({
    id:         el.getAttribute('data-ad-id') || '',
    name:       el.getAttribute('data-ad-title') || '',
    customerId: el.getAttribute('data-ad-customer-id') || '',
  })).filter(a => a.id);

  const EVENTS = Array.from(document.querySelectorAll('[data-events-wrapper] [data-item]')).map(el => ({
    id:   el.getAttribute('data-event-id') || '',
    name: el.getAttribute('data-event-title') || '',
  })).filter(e => e.id);

  const RE = Array.from(document.querySelectorAll('[data-re-wrapper] [data-item]')).map(el => ({
    id:   el.getAttribute('data-re-id') || '',
    name: el.getAttribute('data-re-title') || '',
  })).filter(r => r.id);

  // ── Product types — read from MNLS products-wrapper DOM ──
  // Falls back to empty array if DOM wrappers not present
  // TD-010: GR, FA Sponsor, TS Sponsor, Customer Record not in MNLS — deferred
  const COLLECTION_MAP = {
    'feature article':      { collection:'articles', reqCust:true,  group:'Articles' },
    'themed spotlight':     { collection:'articles', reqCust:true,  group:'Articles' },
    'banner ads':           { collection:'ads',      reqCust:true,  group:'Ads' },
    'sidebar ads':          { collection:'ads',      reqCust:true,  group:'Ads' },
    'the find':             { collection:'ads',      reqCust:true,  group:'Ads' },
    'events calendar':      { collection:'events',   reqCust:false, group:'Other' },
    'real estate listings': { collection:'re',       reqCust:false, group:'Other' },
  };

  const PRODUCT_TYPES = Array.from(document.querySelectorAll('[data-item="true"]')).map(el => {
    const label = (el.getAttribute('data-name') || '').trim();
    const id    = el.getAttribute('data-id') || '';
    const key   = label.toLowerCase();
    const meta  = COLLECTION_MAP[key] || { collection:'articles', reqCust:false, group:'Other' };
    return { id, label, ...meta };
  }).filter(p => p.id && p.label);

  // Fallback if DOM not ready or wrappers missing
  if (!PRODUCT_TYPES.length) {
    console.warn('[CM] products-wrapper items not found — PRODUCT_TYPES empty. Check T-A page DOM.');
  }

  // ── Element types per collection ──
  const ETYPES = {
    articles:  [{id:'main-image',l:'Main Image'},{id:'interior-image',l:'Interior Image'},{id:'article-body',l:'Article Body'},{id:'headline',l:'Headline'}],
    ads:       [{id:'ad-creative',l:'Ad Creative'},{id:'banner-ad',l:'Banner Ad'},{id:'logo',l:'Logo'},{id:'ad-click-url',l:'Click URL'}],
    events:    [{id:'event-flyer',l:'Event Flyer'},{id:'main-image',l:'Main Image'},{id:'document',l:'Document'}],
    re:        [{id:'listing-photo',l:'Listing Photo'},{id:'main-image',l:'Main Image'},{id:'document',l:'Document'}],
    customers: [{id:'logo',l:'Logo'},{id:'headshot',l:'Headshot'},{id:'document',l:'Document'}],
  };

  const FILE_ICONS = {
    'image/jpeg':'🖼️','image/jpg':'🖼️','image/png':'🖼️','image/webp':'🖼️',
    'image/svg+xml':'✏️','application/pdf':'📕',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'📘',
    'text/html':'📗','application/zip':'📦',
  };

  const fmtSize = b => b > 1e6 ? (b/1e6).toFixed(1)+' MB' : Math.round(b/1e3)+' KB';
  const getPT   = id => PRODUCT_TYPES.find(p => p.id === id);
  const esc     = s => (s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;');

  // ── Inject CSS ──
  const style = document.createElement('style');
  style.textContent = `
#content-manager-mount { font-family:'DM Sans',system-ui,sans-serif; color:#1a3a3a; }
.cm-root { max-width:900px; margin:0 auto; padding:16px 0; }
.cm-hdr { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:2px solid #1a3a3a; margin-bottom:14px; }
.cm-hdr-left { display:flex; align-items:center; gap:10px; }
.cm-hdr-icon { width:30px; height:30px; background:#1a3a3a; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#c4a35a; font-size:14px; }
.cm-hdr h3 { font-size:16px; font-weight:700; color:#1a3a3a; margin:0; }
.cm-hdr-sub { font-size:10px; font-family:'DM Mono',monospace; color:#8a8a7a; letter-spacing:.04em; text-transform:uppercase; }
.cm-badge { font-family:'DM Mono',monospace; font-size:9px; padding:3px 8px; background:#1a3a3a; color:#c4a35a; border-radius:2px; letter-spacing:.06em; }

.cm-filters { display:flex; gap:6px; margin-bottom:12px; align-items:center; flex-wrap:wrap; }
.cm-pill { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.04em; padding:4px 10px; border-radius:3px; border:1.5px solid #e8e4d8; background:transparent; color:#5a6a5a; cursor:pointer; transition:all .15s; }
.cm-pill:hover { border-color:#c4a35a; }
.cm-pill.active { background:#1a3a3a; color:#f0edd8; border-color:transparent; }
.cm-pill.active-warn { background:#e8a030; color:#fff; border-color:transparent; }
.cm-pill.active-ok { background:#27ae60; color:#fff; border-color:transparent; }
.cm-pill.active-dec { background:#8b2252; color:#fff; border-color:transparent; }
.cm-refresh { font-family:'DM Mono',monospace; font-size:9px; padding:3px 10px; border-radius:2px; border:1.5px solid #e8e4d8; background:#fff; color:#8a8a7a; cursor:pointer; margin-left:auto; transition:all .15s; }
.cm-refresh:hover { border-color:#1a3a3a; color:#1a3a3a; }

.cm-loading { text-align:center; padding:32px; color:#8a8a7a; font-family:'DM Mono',monospace; font-size:10px; }
.cm-loading-spin { display:inline-block; font-size:20px; animation:cm-spin .8s linear infinite; margin-bottom:8px; }
@keyframes cm-spin { to { transform:rotate(360deg); } }
.cm-error { padding:10px 12px; background:#fde8e8; border:1px solid #c0392b; border-radius:3px; font-size:11px; font-family:'DM Mono',monospace; color:#c0392b; display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.cm-error button { font-family:'DM Mono',monospace; font-size:9px; padding:3px 10px; border-radius:2px; border:1.5px solid #c0392b; background:#fff; color:#c0392b; cursor:pointer; }

.cm-sel-bar { display:flex; align-items:center; gap:10px; padding:8px 14px; background:#1a3a3a; color:#f0edd8; border-radius:4px; margin-bottom:10px; font-size:12px; }
.cm-sel-count { font-family:'DM Mono',monospace; font-size:11px; font-weight:600; }
.cm-sel-spacer { flex:1; }
.cm-desel { font-family:'DM Mono',monospace; font-size:9px; background:none; border:none; color:#f0edd8; cursor:pointer; opacity:.7; }
.cm-desel:hover { opacity:1; }

.cm-flist { display:flex; flex-direction:column; gap:2px; }
.cm-frow { background:#fff; border:1.5px solid #e8e4d8; border-radius:4px; transition:all .15s; }
.cm-frow.sel { border-color:#c4a35a; background:#fdfcf8; }
.cm-frow.assigned { opacity:.65; background:#f4fbf4; border-color:#d4eed4; }
.cm-frow-main { display:grid; grid-template-columns:28px 30px 1fr auto; align-items:center; padding:7px 10px; cursor:pointer; }
.cm-fcheck { width:16px; height:16px; accent-color:#1a3a3a; cursor:pointer; }
.cm-ficon { font-size:18px; text-align:center; }
.cm-finfo { min-width:0; }
.cm-fname { font-size:12px; font-weight:600; color:#1a3a3a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cm-fmeta { font-size:9px; font-family:'DM Mono',monospace; color:#a0a090; display:flex; gap:8px; margin-top:1px; flex-wrap:wrap; }
.cm-fmeta .uc { color:#1a3a3a; }
.cm-fright { display:flex; align-items:center; gap:6px; flex-shrink:0; }
.cm-fbadge { font-size:8px; font-family:'DM Mono',monospace; padding:2px 7px; border-radius:2px; text-transform:uppercase; letter-spacing:.06em; }
.cm-fbadge.ready   { background:#e8f5e9; color:#27ae60; }
.cm-fbadge.decision{ background:#f3e5f5; color:#8b2252; }
.cm-fbadge.assigned{ background:#e8f5e9; color:#27ae60; }

.cm-empty { text-align:center; padding:40px; color:#8a8a7a; }
.cm-empty-icon { font-size:28px; opacity:.35; margin-bottom:8px; }
.cm-empty-text { font-size:11px; font-family:'DM Mono',monospace; }

/* Assignment panel */
.cm-ap { background:#fff; border:2px solid #c4a35a; border-radius:6px; margin-top:12px; overflow:hidden; box-shadow:0 4px 20px rgba(26,58,58,.1); animation:cm-fade .2s ease; }
@keyframes cm-fade { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
.cm-ap-bar { height:4px; background:linear-gradient(90deg,#1a3a3a,#c4a35a); }
.cm-ap-body { padding:16px; }
.cm-ap-title { font-size:13px; font-weight:700; color:#1a3a3a; margin-bottom:3px; }
.cm-ap-sub { font-size:10px; font-family:'DM Mono',monospace; color:#8a8a7a; text-transform:uppercase; letter-spacing:.04em; margin-bottom:14px; }

.cm-steps { display:flex; gap:4px; margin-bottom:14px; align-items:center; }
.cm-step { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.04em; text-transform:uppercase; padding:3px 8px; border-radius:2px; border:1px solid #e8e4d8; color:#a0a090; background:#fff; transition:all .2s; }
.cm-step.active { background:#1a3a3a; color:#f0edd8; border-color:transparent; }
.cm-step.done-s { background:#e8f5e9; color:#27ae60; border-color:#d4eed4; }
.cm-step-arr { font-size:9px; color:#a0a090; }

.cm-fr { display:flex; gap:10px; margin-bottom:10px; flex-wrap:wrap; }
.cm-ff { flex:1; min-width:0; }
.cm-fl { display:block; font-size:9px; font-family:'DM Mono',monospace; letter-spacing:.08em; text-transform:uppercase; color:#8a8a7a; margin-bottom:4px; }
.cm-fl .req { color:#c0392b; }
.cm-fsel,.cm-finp { width:100%; font-family:'DM Sans',system-ui,sans-serif; font-size:12px; color:#1a3a3a; background:#faf9f5; border:1.5px solid #ddd9c8; border-radius:3px; padding:6px 8px; outline:none; transition:border-color .15s,box-shadow .15s; }
.cm-fsel { appearance:none; cursor:pointer; padding-right:24px; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M1 1l3 3 3-3' fill='none' stroke='%238a8a7a' stroke-width='1.2' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 8px center; }
.cm-fsel:focus,.cm-finp:focus { border-color:#1a3a3a; box-shadow:0 0 0 2px rgba(26,58,58,.08); }
.cm-fsel.changed,.cm-finp.changed { border-color:#c4a35a; box-shadow:0 0 0 2px rgba(196,163,90,.12); }

.cm-file-tag-list { margin-top:14px; border-top:1px dashed #e8e4d8; padding-top:12px; }
.cm-file-tag-label { font-size:10px; font-family:'DM Mono',monospace; color:#8a8a7a; text-transform:uppercase; letter-spacing:.06em; margin-bottom:8px; }
.cm-file-tag-row { display:flex; align-items:center; gap:8px; padding:6px 8px; background:#faf9f5; border:1px solid #e8e4d8; border-radius:3px; margin-bottom:4px; }
.cm-file-tag-row.tagged { border-color:#c4a35a; background:#fdfcf8; }
.cm-file-tag-icon { font-size:16px; flex-shrink:0; }
.cm-file-tag-name { flex:1; font-size:11px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
.cm-echips { display:flex; flex-wrap:wrap; gap:3px; flex-shrink:0; }
.cm-echip { font-family:'DM Mono',monospace; font-size:8px; letter-spacing:.04em; padding:2px 7px; border-radius:2px; border:1px solid #e8e4d8; background:#fff; color:#5a6a5a; cursor:pointer; transition:all .12s; white-space:nowrap; }
.cm-echip:hover { border-color:#c4a35a; }
.cm-echip.sel { background:#1a3a3a; color:#f0edd8; border-color:transparent; }

.cm-nested { margin-top:8px; padding:10px 12px; background:#fdfcf8; border:1.5px dashed #c4a35a; border-radius:4px; }
.cm-nested-hdr { font-size:11px; font-weight:700; color:#1a3a3a; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; }
.cm-nested-close { font-size:10px; font-family:'DM Mono',monospace; color:#c0392b; cursor:pointer; background:none; border:none; }
.cm-no-results { padding:8px 10px; background:#fff8e1; border:1px solid #e8a030; border-radius:3px; font-size:11px; color:#e8a030; margin-top:6px; display:flex; align-items:center; justify-content:space-between; }
.cm-no-results button { font-family:'DM Mono',monospace; font-size:10px; padding:3px 10px; border-radius:3px; border:1.5px solid #1a3a3a; background:#fff; color:#1a3a3a; cursor:pointer; }

.cm-sub-bar { display:flex; align-items:center; justify-content:space-between; margin-top:14px; padding-top:12px; border-top:1px solid #f0ede4; }
.cm-cancel { font-size:10px; font-family:'DM Mono',monospace; color:#c0392b; cursor:pointer; background:none; border:none; }
.cm-cancel:hover { opacity:.65; }
.cm-sub-right { display:flex; align-items:center; gap:12px; }
.cm-sub-info { font-size:9px; font-family:'DM Mono',monospace; color:#a0a090; }
.cm-sub-btn { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.06em; text-transform:uppercase; padding:7px 18px; border-radius:3px; border:none; background:#c4a35a; color:#1a3a3a; font-weight:700; cursor:pointer; transition:all .15s; }
.cm-sub-btn:hover:not(:disabled) { background:#f4a127; }
.cm-sub-btn:disabled { opacity:.35; cursor:not-allowed; }
.cm-link-btn { font-family:'DM Mono',monospace; font-size:10px; color:#1a3a3a; background:none; border:none; cursor:pointer; text-decoration:underline; padding:0; }
.cm-link-btn:hover { opacity:.7; }

/* Modal */
.cm-modal-overlay { position:fixed; inset:0; background:rgba(26,58,58,0.7); z-index:9999; display:flex; align-items:flex-start; justify-content:center; padding:40px 20px; overflow-y:auto; animation:cm-overlay-in .15s ease; }
@keyframes cm-overlay-in { from{opacity:0} to{opacity:1} }
.cm-modal { background:#fff; border-radius:8px; width:100%; max-width:760px; box-shadow:0 20px 60px rgba(0,0,0,0.3); animation:cm-modal-in .2s ease; position:relative; }
@keyframes cm-modal-in { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
.cm-modal-bar { height:4px; background:linear-gradient(90deg,#1a3a3a,#c4a35a); border-radius:8px 8px 0 0; }
.cm-modal-head { display:flex; align-items:center; justify-content:space-between; padding:16px 20px 12px; border-bottom:1px solid #f0ede4; }
.cm-modal-title { font-size:15px; font-weight:700; color:#1a3a3a; }
.cm-modal-sub { font-size:10px; font-family:'DM Mono',monospace; color:#8a8a7a; text-transform:uppercase; letter-spacing:.04em; margin-top:2px; }
.cm-modal-close { width:28px; height:28px; border-radius:50%; border:1.5px solid #e8e4d8; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; color:#8a8a7a; transition:all .15s; flex-shrink:0; }
.cm-modal-close:hover { border-color:#c0392b; color:#c0392b; }
.cm-modal-files { padding:12px 20px; background:#faf9f5; border-bottom:1px solid #f0ede4; display:flex; flex-wrap:wrap; gap:6px; }
.cm-modal-file-chip { font-family:'DM Mono',monospace; font-size:9px; padding:3px 8px; background:#fff; border:1px solid #e8e4d8; border-radius:2px; color:#5a6a5a; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cm-modal-body { padding:20px; }
.cm-modal-footer { padding:12px 20px 16px; border-top:1px solid #f0ede4; display:flex; align-items:center; justify-content:space-between; }

  `;
  document.head.appendChild(style);

  // ── Inject HTML shell ──
  mount.innerHTML = `
<div class="cm-root">
  <div class="cm-hdr">
    <div class="cm-hdr-left">
      <div class="cm-hdr-icon">📂</div>
      <div>
        <h3>Content Manager</h3>
        <div class="cm-hdr-sub">Select files → Assign to CMS records</div>
      </div>
    </div>
    <span class="cm-badge">v1.0</span>
  </div>
  <div class="cm-filters" id="cm-filters"></div>
  <div id="cm-error"></div>
  <div id="cm-sel-bar"></div>
  <div class="cm-flist" id="cm-flist"></div>
  <div id="cm-modal"></div>
</div>`;

  // ── Load files from Scenario C ──
  async function loadFiles(status) {
    LOADING = true; LOAD_ERR = null;
    render();
    try {
      const url = `${CFG.scenarioCUrl}?titleSlug=${encodeURIComponent(CFG.titleSlug)}&status=${status}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Scenario C returned ' + res.status);
      const data = await res.json();
      // Map numeric keys to named fields
      FILES = (Array.isArray(data) ? data : []).map((row, i) => ({
        id:         row['0'] || ('file-'+i),
        fileId:     row['0'] || '',
        name:       row['1'] || '(unknown)',
        mime:       row['2'] || '',
        size:       parseInt(row['3']||'0', 10) || 0,
        arrived:    row['4'] || '',
        status:     row['5'] || '',
        uuid:       row['6'] || '',   // Uploadcare UUID
        selected:   false,
        elementType: '',
        assigned:   false,
      }));
      LOADING = false;
    } catch(err) {
      LOADING = false;
      LOAD_ERR = err.message;
      FILES = [];
    }
    render();
  }

  // ── Render ──
  function render() {
    renderFilters();
    renderError();
    renderSelBar();
    renderFileList();
    renderModal();
  }

  function renderFilters() {
    const ready  = FILES.filter(f => f.status==='DONE').length;
    const dec    = FILES.filter(f => f.status==='AWAITING_DECISION').length;
    document.getElementById('cm-filters').innerHTML =
      `<button class="cm-pill ${FILTER==='ready'?'active-ok':''}" onclick="cmSetFilter('ready')">Ready ${ready}</button>`+
      `<button class="cm-pill ${FILTER==='all'?'active':''}" onclick="cmSetFilter('all')">All</button>`+
      `<button class="cm-pill ${FILTER==='assigned'?'active':''}" onclick="cmSetFilter('assigned')">Assigned</button>`+
      `<button class="cm-pill ${FILTER==='decision'?'active-dec':''}" onclick="cmSetFilter('decision')">Needs Decision ${dec}</button>`+
      `<button class="cm-refresh" onclick="cmReload()">↻ Refresh</button>`;
  }

  function renderError() {
    const el = document.getElementById('cm-error');
    if (!LOAD_ERR) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="cm-error"><span>Load error: ${esc(LOAD_ERR)}</span><button onclick="cmReload()">Retry</button></div>`;
  }

  function renderSelBar() {
    const sel = FILES.filter(f => f.selected && !f.assigned);
    const el  = document.getElementById('cm-sel-bar');
    if (!sel.length) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="cm-sel-bar">
      <span class="cm-sel-count">${sel.length} file${sel.length>1?'s':''} selected</span>
      <div class="cm-sel-spacer"></div>
      <button class="cm-desel" onclick="cmDeselAll()">✕ clear</button>
      <button style="font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:5px 16px;border-radius:3px;border:none;background:#c4a35a;color:#1a3a3a;font-weight:700;cursor:pointer;margin-left:8px;" onclick="cmOpenModal()">Assign ${sel.length} File${sel.length>1?'s':''} →</button>
    </div>`;
  }

  function renderFileList() {
    const el = document.getElementById('cm-flist');

    if (LOADING) {
      el.innerHTML = `<div class="cm-loading"><div class="cm-loading-spin">⟳</div><div>Loading files…</div></div>`;
      return;
    }

    let vis = FILES;
    if (FILTER === 'ready')    vis = FILES.filter(f => f.status==='DONE' && !f.assigned);
    if (FILTER === 'assigned') vis = FILES.filter(f => f.assigned);
    if (FILTER === 'decision') vis = FILES.filter(f => f.status==='AWAITING_DECISION');

    if (!vis.length) {
      const msgs = { ready:'No conditioned files ready for assignment', all:'No files in inbox', assigned:'No files assigned yet', decision:'No PDFs awaiting decision' };
      el.innerHTML = `<div class="cm-empty"><div class="cm-empty-icon">${FILTER==='ready'?'✅':'📭'}</div><div class="cm-empty-text">${msgs[FILTER]||'No files'}</div></div>`;
      return;
    }

    el.innerHTML = vis.map(f => {
      const icon  = FILE_ICONS[f.mime] || '📄';
      const badge = f.assigned ? 'assigned' : f.status==='AWAITING_DECISION' ? 'decision' : 'ready';
      const badgeLabel = f.assigned ? 'Assigned' : f.status==='AWAITING_DECISION' ? 'Needs Decision' : 'Ready';
      const ucLabel = f.uuid ? `<span class="uc">UC:${f.uuid.substring(0,8)}…</span>` : '';
      return `<div class="cm-frow ${f.selected?'sel':''} ${f.assigned?'assigned':''}" onclick="cmToggleSel('${f.id}')">
        <div class="cm-frow-main">
          <input type="checkbox" class="cm-fcheck" ${f.selected?'checked':''} ${f.assigned?'disabled':''} onclick="event.stopPropagation();cmToggleSel('${f.id}')">
          <span class="cm-ficon">${icon}</span>
          <div class="cm-finfo">
            <div class="cm-fname">${esc(f.name)}</div>
            <div class="cm-fmeta">
              ${f.size ? `<span>${fmtSize(f.size)}</span>` : ''}
              ${f.arrived ? `<span>${f.arrived.substring(0,10)}</span>` : ''}
              ${ucLabel}
              ${f.elementType ? `<span style="color:#c4a35a">[${f.elementType}]</span>` : ''}
            </div>
          </div>
          <div class="cm-fright"><span class="cm-fbadge ${badge}">${badgeLabel}</span></div>
        </div>
      </div>`;
    }).join('');
  }

  function renderModal() {
    const el = document.getElementById('cm-modal');
    if (!MODAL_OPEN) { el.innerHTML = ''; return; }

    const sel = FILES.filter(f => f.selected && !f.assigned);
    if (!sel.length) { MODAL_OPEN = false; el.innerHTML = ''; return; }

    const pt  = getPT(A.productType);
    const col = pt?.collection || '';

    const s1 = A.productType ? 'done-s' : 'active';
    const s2 = !A.productType ? '' : (!pt?.reqCust || A.customerId) ? 'done-s' : 'active';
    const s3 = !col || col==='customers' ? '' : (A.cmsItemId||(A.isNew&&A.newItemName)) ? 'done-s' : (s2==='done-s'?'active':'');
    const s4done = sel.every(f => f.elementType);
    const s4 = (col==='customers'||(A.cmsItemId||(A.isNew&&A.newItemName))) ? (s4done?'done-s':'active') : '';

    let h = `<div class="cm-modal-overlay" onclick="cmOverlayClick(event)">
      <div class="cm-modal" id="cm-modal-inner">
        <div class="cm-modal-bar"></div>
        <div class="cm-modal-head">
          <div>
            <div class="cm-modal-title">Assign ${sel.length} File${sel.length>1?'s':''}</div>
            <div class="cm-modal-sub">Complete all steps · tag each file individually</div>
          </div>
          <button class="cm-modal-close" onclick="cmCloseModal()">✕</button>
        </div>
        <div class="cm-modal-files">${sel.map(f=>`<span class="cm-modal-file-chip">${FILE_ICONS[f.mime]||'📄'} ${esc(f.name)}</span>`).join('')}</div>
        <div class="cm-modal-body">`;

    h += `<div class="cm-steps" style="margin-bottom:16px">
      <span class="cm-step ${s1}">1 Type</span><span class="cm-step-arr">→</span>
      <span class="cm-step ${s2}">2 Customer</span><span class="cm-step-arr">→</span>
      <span class="cm-step ${s3}">3 Item</span><span class="cm-step-arr">→</span>
      <span class="cm-step ${s4}">4 Tag</span>
    </div>`;

    h += `<div class="cm-fr"><div class="cm-ff">
      <label class="cm-fl">Product Type <span class="req">*</span></label>
      <select class="cm-fsel ${A.productType?'changed':''}" onchange="cmSetPT(this.value)">
        <option value="">Select type…</option>
        ${['Articles','Ads','Other'].map(grp => {
          const items = PRODUCT_TYPES.filter(p => p.group === grp);
          if (!items.length) return '';
          return `<optgroup label="${grp}">${items.map(p=>`<option value="${p.id}" ${p.id===A.productType?'selected':''}>${p.label}</option>`).join('')}</optgroup>`;
        }).join('')}
      </select>
    </div></div>`;

    if (!A.productType) { h += renderModalFooter(sel); h += `</div></div></div>`; el.innerHTML=h; return; }

    if (pt.reqCust) {
      h += `<div class="cm-fr"><div class="cm-ff">
        <label class="cm-fl">Customer <span class="req">*</span></label>
        <select class="cm-fsel ${A.customerId?'changed':''}" onchange="cmSetCust(this.value)">
          <option value="">Select customer…</option>
          <option value="__none__" ${A.customerId==='__none__'?'selected':''}>— No Customer / Unsponsored</option>
          ${CUSTOMERS.map(c=>`<option value="${c.id}" ${c.id===A.customerId?'selected':''  }>${esc(c.name)}</option>`).join('')}
          <option disabled>───────────</option>
          <option value="__new__">+ New Customer</option>
        </select>
      </div></div>`;
      if (A.nestedOpen) {
        h += `<div class="cm-nested"><div class="cm-nested-hdr"><span>+ New Customer</span><button class="cm-nested-close" onclick="cmCloseNested()">✕</button></div>
          <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Business Name <span class="req">*</span></label>
          <input class="cm-finp ${A.nestedName?'changed':''}" type="text" value="${esc(A.nestedName)}" oninput="cmNestedName(this.value)" placeholder="Business name…"></div></div>
          <div style="text-align:right;margin-top:4px"><button class="cm-sub-btn" ${A.nestedName?''  :'disabled'} onclick="cmCreateCust()">Create Customer</button></div>
        </div>`;
      }
      if (pt.reqCust && !A.customerId) { h += renderModalFooter(sel); h += `</div></div></div>`; el.innerHTML=h; return; }
    }

    if (col !== 'customers') {
      const items = getCMSItems(col, A.customerId);
      if (A.isNew) {
        h += renderNewItemForm(col, pt, sel);
      } else {
        h += `<div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Assign To <span class="req">*</span></label>
          <select class="cm-fsel ${A.cmsItemId?'changed':''}" onchange="cmSetItem(this.value)">
            <option value="">Select ${pt.label.toLowerCase()}…</option>
            ${items.map(i=>`<option value="${i.id}" ${i.id===A.cmsItemId?'selected':''  }>${esc(i.name)}</option>`).join('')}
          </select>
        </div></div>`;
        if (!items.length) {
          h += `<div class="cm-no-results"><span>No items found${A.customerId?' for this customer':''}</span><button onclick="cmStartNew()">+ Create New</button></div>`;
        } else {
          h += `<div style="margin-bottom:8px"><button class="cm-link-btn" onclick="cmStartNew()">+ or create new ${pt.label.toLowerCase()}</button></div>`;
        }
      }
      if (!A.cmsItemId && !(A.isNew && A.newItemName)) { h += renderModalFooter(sel); h += `</div></div></div>`; el.innerHTML=h; return; }
    }

    const etypes = ETYPES[col] || [];
    if (etypes.length) {
      h += `<div class="cm-file-tag-list"><div class="cm-file-tag-label">Tag Each File's Element Type</div>`;
      sel.forEach(f => {
        const icon = FILE_ICONS[f.mime] || '📄';
        h += `<div class="cm-file-tag-row ${f.elementType?'tagged':''  }">
          <span class="cm-file-tag-icon">${icon}</span>
          <span class="cm-file-tag-name">${esc(f.name)}</span>
          <div class="cm-echips">${etypes.map(t=>`<span class="cm-echip ${t.id===f.elementType?'sel':''  }" onclick="cmTagFile('${f.id}','${t.id}')">${t.l}</span>`).join('')}</div>
        </div>`;
      });
      h += `</div>`;
    }

    h += renderModalFooter(sel);
    h += `</div></div></div>`;
    el.innerHTML = h;
  }

  function renderNewItemForm(col, pt) {
    if (col === 'articles') {
      return `
      <div style="background:#f5f3ee;border:1.5px solid #e8e4d8;border-radius:4px;padding:14px;margin-bottom:10px">
        <div style="font-size:10px;font-family:'DM Mono',monospace;color:#1a3a3a;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">New Article</div>
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Article Title <span class="req">*</span></label>
          <input class="cm-finp ${A.newItemName?'changed':''}" type="text" value="${esc(A.newItemName)}" oninput="cmNewItemName(this.value)" placeholder="Article title…">
        </div></div>
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Sub-Title</label>
          <input class="cm-finp ${A.newSubTitle?'changed':''}" type="text" value="${esc(A.newSubTitle)}" oninput="A.newSubTitle=this.value" placeholder="Sub-title…">
        </div></div>
        <div class="cm-fr">
          <div class="cm-ff">
            <label class="cm-fl">Revenue Type <span class="req">*</span></label>
            <select class="cm-fsel ${A.newRevenueType?'changed':''}" onchange="cmSetRevenueType(this.value)">
              <option value="">Select…</option>
              <option value="d894f7e97435fc2f06fdb79c75e8ea29" ${A.newRevenueType==='d894f7e97435fc2f06fdb79c75e8ea29'?'selected':''}>Paid Ad</option>
              <option value="99578b8a5a6a99e9c15c0c2ed30c22b2" ${A.newRevenueType==='99578b8a5a6a99e9c15c0c2ed30c22b2'?'selected':''}>Paid Article</option>
              <option value="1625d5aa547083d33098b8b6fd4b0569" ${A.newRevenueType==='1625d5aa547083d33098b8b6fd4b0569'?'selected':''}>Sponsorable</option>
            </select>
          </div>
          <div class="cm-ff">
            <label class="cm-fl">Customer ${A.newRevenueType&&A.newRevenueType!=='1625d5aa547083d33098b8b6fd4b0569'?'<span class="req">*</span>':''}</label>
            <select class="cm-fsel ${A.customerId?'changed':''}" onchange="cmSetCust(this.value)">
              <option value="">Select customer…</option>
              <option value="__none__" ${A.customerId==='__none__'?'selected':''}>— No Customer</option>
              ${CUSTOMERS.map(c=>`<option value="${c.id}" ${c.id===A.customerId?'selected':''}>${esc(c.name)}</option>`).join('')}
              <option disabled>───────────</option>
              <option value="__new__">+ New Customer</option>
            </select>
          </div>
        </div>
        <div class="cm-fr">
          <div class="cm-ff"><label class="cm-fl">Writer Name</label><input class="cm-finp ${A.newWriterName?'changed':''}" type="text" value="${esc(A.newWriterName)}" oninput="A.newWriterName=this.value" placeholder="Name…"></div>
          <div class="cm-ff"><label class="cm-fl">Writer Title</label><input class="cm-finp ${A.newWriterTitle?'changed':''}" type="text" value="${esc(A.newWriterTitle)}" oninput="A.newWriterTitle=this.value" placeholder="Role…"></div>
          <div class="cm-ff"><label class="cm-fl">Co-Writer Name</label><input class="cm-finp ${A.newCoWriterName?'changed':''}" type="text" value="${esc(A.newCoWriterName)}" oninput="A.newCoWriterName=this.value" placeholder="Optional…"></div>
          <div class="cm-ff"><label class="cm-fl">Co-Writer Title</label><input class="cm-finp ${A.newCoWriterTitle?'changed':''}" type="text" value="${esc(A.newCoWriterTitle)}" oninput="A.newCoWriterTitle=this.value" placeholder="Optional…"></div>
        </div>
        ${['fa','ts'].includes(A.productType) ? `
        <div style="border-top:1px dashed #ddd9c8;margin-top:8px;padding-top:8px">
          <button class="cm-link-btn" onclick="A.newExtrasOpen=!A.newExtrasOpen;render()" style="font-size:10px">${A.newExtrasOpen?'▾':'▸'} Additional fields</button>
          ${A.newExtrasOpen ? `
          <div style="margin-top:10px">
            <div class="cm-fr"><div class="cm-ff">
              <label class="cm-fl">Banner Statement</label>
              <input class="cm-finp ${A.newBannerStatement?'changed':''}" type="text" value="${esc(A.newBannerStatement)}" oninput="A.newBannerStatement=this.value" placeholder="Optional…">
            </div></div>
            <div class="cm-fr" style="align-items:center;gap:20px;flex-wrap:wrap">
              <label style="display:flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:10px;color:#5a6a5a;cursor:pointer">
                <input type="checkbox" ${A.newPhotoCredits?'checked':''} onchange="A.newPhotoCredits=this.checked;render()" style="accent-color:#1a3a3a"> Show Photo Credits
              </label>
              <label style="display:flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:10px;color:#5a6a5a;cursor:pointer">
                <input type="checkbox" ${A.newPhotoEssay?'checked':''} onchange="A.newPhotoEssay=this.checked;render()" style="accent-color:#1a3a3a"> Photo Essay
              </label>
              <label style="display:flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:10px;color:#5a6a5a;cursor:pointer">
                <input type="checkbox" ${A.newVideoArticle?'checked':''} onchange="A.newVideoArticle=this.checked;render()" style="accent-color:#1a3a3a"> Video Article
              </label>
            </div>
            ${A.newPhotoCredits?`<div class="cm-fr" style="margin-top:8px"><div class="cm-ff"><label class="cm-fl">Photographer</label><input class="cm-finp ${A.newPhotographer?'changed':''}" type="text" value="${esc(A.newPhotographer)}" oninput="A.newPhotographer=this.value" placeholder="Name…"></div></div>`:''}
            ${A.newVideoArticle?`<div class="cm-fr" style="margin-top:8px"><div class="cm-ff"><label class="cm-fl">Video URL</label><input class="cm-finp ${A.newVideoUrl?'changed':''}" type="text" value="${esc(A.newVideoUrl)}" oninput="A.newVideoUrl=this.value" placeholder="https://…"></div></div>`:''}
            <div class="cm-fr" style="margin-top:8px"><div class="cm-ff"><label class="cm-fl">Audio URL</label><input class="cm-finp ${A.newAudioUrl?'changed':''}" type="text" value="${esc(A.newAudioUrl)}" oninput="A.newAudioUrl=this.value" placeholder="https://…"></div></div>
          </div>` : ''}
        </div>` : ''}
      </div>
      <div style="margin-bottom:8px"><button class="cm-link-btn" onclick="cmBackToExisting()">← back to existing</button></div>`;

    } else if (col === 'ads') {
      const today = new Date().toISOString().split('T')[0];
      const sixMonths = new Date(Date.now() + 183*24*60*60*1000).toISOString().split('T')[0];
      if (!A.newAdStartDate) A.newAdStartDate = today;
      if (!A.newAdEndDate)   A.newAdEndDate   = sixMonths;
      return `
      <div style="background:#f5f3ee;border:1.5px solid #e8e4d8;border-radius:4px;padding:14px;margin-bottom:10px">
        <div style="font-size:10px;font-family:'DM Mono',monospace;color:#1a3a3a;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">New ${pt.label}</div>
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Ad Name <span class="req">*</span></label>
          <input class="cm-finp ${A.newItemName?'changed':''}" type="text" value="${esc(A.newItemName)}" oninput="cmNewItemName(this.value)" placeholder="Ad name…">
        </div></div>
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Customer <span class="req">*</span></label>
          <select class="cm-fsel ${A.customerId?'changed':''}" onchange="cmSetCust(this.value)">
            <option value="">Select customer…</option>
            ${CUSTOMERS.map(c=>`<option value="${c.id}" ${c.id===A.customerId?'selected':''}>${esc(c.name)}</option>`).join('')}
            <option disabled>───────────</option>
            <option value="__new__">+ New Customer</option>
          </select>
        </div></div>
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Click-Through URL</label>
          <input class="cm-finp ${A.newAdClickUrl?'changed':''}" type="text" value="${esc(A.newAdClickUrl)}" oninput="A.newAdClickUrl=this.value" placeholder="https://…">
        </div></div>
        <div class="cm-fr">
          <div class="cm-ff"><label class="cm-fl">Start Date</label><input class="cm-finp changed" type="date" value="${A.newAdStartDate}" oninput="A.newAdStartDate=this.value"></div>
          <div class="cm-ff"><label class="cm-fl">End Date</label><input class="cm-finp changed" type="date" value="${A.newAdEndDate}" oninput="A.newAdEndDate=this.value"></div>
        </div>
      </div>
      <div style="margin-bottom:8px"><button class="cm-link-btn" onclick="cmBackToExisting()">← back to existing</button></div>`;

    } else if (col === 'events') {
      return `
      <div style="background:#f5f3ee;border:1.5px solid #e8e4d8;border-radius:4px;padding:14px;margin-bottom:10px">
        <div style="font-size:10px;font-family:'DM Mono',monospace;color:#1a3a3a;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">New Event</div>
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Event Title <span class="req">*</span></label>
          <input class="cm-finp ${A.newItemName?'changed':''}" type="text" value="${esc(A.newItemName)}" oninput="cmNewItemName(this.value)" placeholder="Event title…">
        </div></div>
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Event Start <span class="req">*</span></label>
          <input class="cm-finp ${A.newEventStart?'changed':''}" type="datetime-local" value="${A.newEventStart}" oninput="A.newEventStart=this.value">
        </div></div>
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Customer</label>
          <select class="cm-fsel ${A.customerId?'changed':''}" onchange="cmSetCust(this.value)">
            <option value="">No customer</option>
            <option value="__none__" ${A.customerId==='__none__'?'selected':''}>— No Customer</option>
            ${CUSTOMERS.map(c=>`<option value="${c.id}" ${c.id===A.customerId?'selected':''}>${esc(c.name)}</option>`).join('')}
          </select>
        </div></div>
        <div class="cm-fr">
          <div class="cm-ff"><label class="cm-fl">Location</label><input class="cm-finp ${A.newEventLocation?'changed':''}" type="text" value="${esc(A.newEventLocation)}" oninput="A.newEventLocation=this.value" placeholder="Venue…"></div>
          <div class="cm-ff"><label class="cm-fl">City</label><input class="cm-finp ${A.newEventCity?'changed':''}" type="text" value="${esc(A.newEventCity)}" oninput="A.newEventCity=this.value" placeholder="City…"></div>
        </div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Address</label><input class="cm-finp ${A.newEventAddress?'changed':''}" type="text" value="${esc(A.newEventAddress)}" oninput="A.newEventAddress=this.value" placeholder="Street address…"></div></div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Description</label><input class="cm-finp ${A.newEventDescription?'changed':''}" type="text" value="${esc(A.newEventDescription)}" oninput="A.newEventDescription=this.value" placeholder="Brief description…"></div></div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Event Link</label><input class="cm-finp ${A.newEventLink?'changed':''}" type="text" value="${esc(A.newEventLink)}" oninput="A.newEventLink=this.value" placeholder="https://…"></div></div>
      </div>
      <div style="margin-bottom:8px"><button class="cm-link-btn" onclick="cmBackToExisting()">← back to existing</button></div>`;

    } else if (col === 're') {
      return `
      <div style="background:#f5f3ee;border:1.5px solid #e8e4d8;border-radius:4px;padding:14px;margin-bottom:10px">
        <div style="font-size:10px;font-family:'DM Mono',monospace;color:#1a3a3a;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px">New RE Listing</div>
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Property Address (# Street City) <span class="req">*</span></label>
          <input class="cm-finp ${A.newItemName?'changed':''}" type="text" value="${esc(A.newItemName)}" oninput="cmNewItemName(this.value)" placeholder="42 Oak Street, Wyckoff…">
        </div></div>
        <div class="cm-fr">
          <div class="cm-ff">
            <label class="cm-fl">Listing Agent <span class="req">*</span></label>
            <select class="cm-fsel ${A.customerId?'changed':''}" onchange="cmSetCust(this.value)">
              <option value="">Select agent…</option>
              ${CUSTOMERS.map(c=>`<option value="${c.id}" ${c.id===A.customerId?'selected':''}>${esc(c.name)}</option>`).join('')}
              <option disabled>───────────</option>
              <option value="__new__">+ New Customer</option>
            </select>
          </div>
          <div class="cm-ff">
            <label class="cm-fl">Listing Status</label>
            <select class="cm-fsel ${A.newReListingStatus?'changed':''}" onchange="A.newReListingStatus=this.value;render()">
              <option value="">Select…</option>
              <option value="b0887da3d5d4d77a684cbb96531bd08c" ${A.newReListingStatus==='b0887da3d5d4d77a684cbb96531bd08c'?'selected':''}>Active</option>
              <option value="4a8316ea601504d55ec421db92fed4ff" ${A.newReListingStatus==='4a8316ea601504d55ec421db92fed4ff'?'selected':''}>Coming Soon</option>
              <option value="9091234ac1ce288c11c363e430337622" ${A.newReListingStatus==='9091234ac1ce288c11c363e430337622'?'selected':''}>Under Contract</option>
              <option value="09a0a251160c6d74cfd8783e267ecae7" ${A.newReListingStatus==='09a0a251160c6d74cfd8783e267ecae7'?'selected':''}>Sold</option>
            </select>
          </div>
        </div>
        <div class="cm-fr">
          <div class="cm-ff"><label class="cm-fl">MLS #</label><input class="cm-finp ${A.newReMls?'changed':''}" type="text" value="${esc(A.newReMls)}" oninput="A.newReMls=this.value" placeholder="MLS number…"></div>
          <div class="cm-ff"><label class="cm-fl">Price</label><input class="cm-finp ${A.newRePrice?'changed':''}" type="number" value="${A.newRePrice}" oninput="A.newRePrice=this.value" placeholder="549000"></div>
        </div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Features</label><input class="cm-finp ${A.newReFeatures?'changed':''}" type="text" value="${esc(A.newReFeatures)}" oninput="A.newReFeatures=this.value" placeholder="3BR, 2BA…"></div></div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Listing Link</label><input class="cm-finp ${A.newReListingLink?'changed':''}" type="text" value="${esc(A.newReListingLink)}" oninput="A.newReListingLink=this.value" placeholder="https://…"></div></div>
      </div>
      <div style="margin-bottom:8px"><button class="cm-link-btn" onclick="cmBackToExisting()">← back to existing</button></div>`;

    } else {
      return `<div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Name <span class="req">*</span></label>
        <input class="cm-finp ${A.newItemName?'changed':''}" type="text" value="${esc(A.newItemName)}" oninput="cmNewItemName(this.value)" placeholder="Name…">
      </div></div>
      <div style="margin-bottom:8px"><button class="cm-link-btn" onclick="cmBackToExisting()">← back to existing</button></div>`;
    }
  }

  function renderModalFooter(sel) {
    const ok = checkReady(sel);
    const tagged = sel.filter(f => f.elementType).length;
    return `</div>
      <div class="cm-modal-footer">
        <button class="cm-cancel" onclick="cmResetAssign()">✕ reset</button>
        <div style="display:flex;align-items:center;gap:12px">
          <span class="cm-sub-info">${tagged}/${sel.length} tagged${ok?' — ready':''}</span>
          <button class="cm-sub-btn" ${ok?''  :'disabled'} onclick="cmSubmit()">Assign ${sel.length} File${sel.length>1?'s':''} ✓</button>
        </div>
      </div>`;
  }

    function checkReady(sel) {
    if (!A.productType) return false;
    const pt = getPT(A.productType); if (!pt) return false;
    if (pt.reqCust && !A.customerId) return false;
    const col = pt.collection;
    if (col !== 'customers') {
      if (!A.cmsItemId && !A.isNew) return false;
      if (A.isNew) {
        if (!A.newItemName) return false;
        if (col === 'articles' && !A.newRevenueType) return false;
        if (col === 'ads' && !A.customerId) return false;
        if (col === 'events' && !A.newEventStart) return false;
        if (col === 're' && !A.customerId) return false;
      }
    }
    return sel.every(f => f.elementType);
  }

  function getCMSItems(col, custId) {
    let items = col==='articles' ? ARTICLES : col==='ads' ? ADS : col==='events' ? EVENTS : col==='re' ? RE : [];
    if (custId) items = items.filter(i => !i.customerId || i.customerId === custId);
    return items;
  }

  // ── Actions exposed to inline handlers ──
  window.cmOpenModal  = () => { MODAL_OPEN = true; render(); };
  window.cmCloseModal = () => { MODAL_OPEN = false; render(); };
  window.cmOverlayClick = e => { if (e.target.classList.contains('cm-modal-overlay')) { MODAL_OPEN = false; render(); } };

  window.cmSetFilter = f => {
    FILTER = f;
    SELECTED.clear();
    FILES.forEach(x => x.selected = false);
    A = { productType:'', customerId:'', cmsItemId:'', isNew:false, newItemName:'', nestedOpen:false, nestedName:'' };
    const statusMap = { ready:'DONE', all:'DONE', assigned:'ASSIGNED', decision:'AWAITING_DECISION' };
    loadFiles(statusMap[f] || 'DONE');
  };

  window.cmReload = () => {
    const statusMap = { ready:'DONE', all:'DONE', assigned:'DONE', decision:'AWAITING_DECISION' };
    loadFiles(statusMap[FILTER] || 'DONE');
  };

  window.cmToggleSel = id => {
    const f = FILES.find(x => x.id===id);
    if (!f || f.assigned) return;
    f.selected = !f.selected;
    if (!f.selected) f.elementType = '';
    render();
  };

  window.cmDeselAll = () => {
    FILES.forEach(f => { f.selected=false; f.elementType=''; });
    MODAL_OPEN = false;
    A = { productType:'', customerId:'', cmsItemId:'', isNew:false, newItemName:'', nestedOpen:false, nestedName:'' };
    render();
  };

  window.cmSetPT = val => {
    A = { productType:val, customerId:'', cmsItemId:'', isNew:false, newItemName:'', nestedOpen:false, nestedName:'' };
    const pt = getPT(val);
    if (pt) FILES.filter(f=>f.selected&&!f.assigned).forEach(f => { f.elementType = guessEType(f, pt.collection); });
    render();
  };

  window.cmSetCust = val => {
    if (val==='__new__') { A.nestedOpen=true; A.customerId=''; render(); return; }
    // __none__ = No Customer / Unsponsored — valid selection, clears item filter
    A.customerId=val; A.nestedOpen=false; A.cmsItemId=''; A.isNew=false; A.newItemName='';
    render();
  };

  window.cmCloseNested = () => { A.nestedOpen=false; render(); };
  window.cmNestedName  = v => { A.nestedName=v; deferRender(); };

  window.cmCreateCust = () => {
    if (!A.nestedName) return;
    // In production: POST to Make to create Webflow Customer CMS item
    // For now: add to local array and select
    const nid = 'new-'+Date.now();
    CUSTOMERS.push({ id:nid, name:A.nestedName });
    A.customerId=nid; A.nestedOpen=false; A.nestedName='';
    render();
  };

  window.cmSetRevenueType = val => { A.newRevenueType = val; render(); };

  window.cmSetItem = val => { A.cmsItemId=val; render(); };
  window.cmStartNew = () => { A.isNew=true; A.newItemName=''; render(); };
  window.cmBackToExisting = () => { A.isNew=false; A.newItemName=''; render(); };
  window.cmNewItemName = v => { A.newItemName=v; deferRender(); };

  window.cmTagFile = (fid, etype) => {
    const f = FILES.find(x => x.id===fid);
    if (f) { f.elementType=etype; render(); }
  };

  window.cmResetAssign = () => {
    A = {
      productType:'', customerId:'', cmsItemId:'', isNew:false,
      newItemName:'', nestedOpen:false, nestedName:'',
      newRevenueType:'', newSubTitle:'', newWriterName:'', newWriterTitle:'',
      newCoWriterName:'', newCoWriterTitle:'', newPhotoCredits:false,
      newPhotographer:'', newPhotoEssay:false, newVideoArticle:false,
      newVideoUrl:'', newAudioUrl:'', newBannerStatement:'', newExtrasOpen:false,
      newAdClickUrl:'', newAdStartDate:'', newAdEndDate:'',
      newEventStart:'', newEventDescription:'', newEventLocation:'',
      newEventAddress:'', newEventCity:'', newEventLink:'',
      newReListingStatus:'', newReMls:'', newReAddress:'',
      newRePrice:'', newReFeatures:'', newReListingLink:'',
    };
    FILES.filter(f=>f.selected).forEach(f => f.elementType='');
    render();
  };

  window.cmSubmit = () => {
    const sel = FILES.filter(f => f.selected && !f.assigned);
    if (!checkReady(sel)) return;
    const pt = getPT(A.productType);

    // Fire one GET request to Scenario F per selected file
    const promises = sel.map(f => {
      const payload = {
        titleSlug:    CFG.titleSlug,
        taItemId:     CFG.taItemId,
        fileId:       f.fileId,
        fileName:     f.name,
        uploadcareUuid: f.uuid,
        mimeType:     f.mime,
        productType:  A.productType,
        customerId:   A.customerId === '__none__' ? '' : A.customerId,
        cmsItemId:    A.cmsItemId || '',
        isNew:        A.isNew,
        collection:   pt?.collection || '',
        elementType:  f.elementType,
        newItemName:      A.newItemName || '',
        newRevenueType:   A.newRevenueType || '',
        newSubTitle:      A.newSubTitle || '',
        newWriterName:    A.newWriterName || '',
        newWriterTitle:   A.newWriterTitle || '',
        newCoWriterName:  A.newCoWriterName || '',
        newCoWriterTitle: A.newCoWriterTitle || '',
        newPhotoCredits:  A.newPhotoCredits || false,
        newPhotographer:  A.newPhotographer || '',
        newPhotoEssay:    A.newPhotoEssay || false,
        newVideoArticle:  A.newVideoArticle || false,
        newVideoUrl:      A.newVideoUrl || '',
        newAudioUrl:      A.newAudioUrl || '',
        newBannerStatement: A.newBannerStatement || '',
        newAdClickUrl:    A.newAdClickUrl || '',
        newAdStartDate:   A.newAdStartDate || '',
        newAdEndDate:     A.newAdEndDate || '',
        newEventStart:    A.newEventStart || '',
        newEventDescription: A.newEventDescription || '',
        newEventLocation: A.newEventLocation || '',
        newEventAddress:  A.newEventAddress || '',
        newEventCity:     A.newEventCity || '',
        newEventLink:     A.newEventLink || '',
        newReListingStatus: A.newReListingStatus || '',
        newReMls:         A.newReMls || '',
        newRePrice:       A.newRePrice || '',
        newReFeatures:    A.newReFeatures || '',
        newReListingLink: A.newReListingLink || '',
      };

      console.log('[CM ASSIGN]', payload);

      const qs = new URLSearchParams();
      Object.entries(payload).forEach(([k,v]) => qs.append(k, String(v)));
      return fetch(CFG.makeAssembly + '?' + qs.toString(), { method:'GET', mode:'no-cors' });
    });

    // After all webhooks fire, update UI
    Promise.allSettled(promises).then(() => {
      sel.forEach(f => { f.assigned = true; f.selected = false; });
      MODAL_OPEN = false;
      A = {
        productType:'', customerId:'', cmsItemId:'', isNew:false,
        newItemName:'', nestedOpen:false, nestedName:'',
        newRevenueType:'', newSubTitle:'', newWriterName:'', newWriterTitle:'',
        newCoWriterName:'', newCoWriterTitle:'', newPhotoCredits:false,
        newPhotographer:'', newPhotoEssay:false, newVideoArticle:false,
        newVideoUrl:'', newAudioUrl:'', newBannerStatement:'', newExtrasOpen:false,
        newAdClickUrl:'', newAdStartDate:'', newAdEndDate:'',
        newEventStart:'', newEventDescription:'', newEventLocation:'',
        newEventAddress:'', newEventCity:'', newEventLink:'',
        newReListingStatus:'', newReMls:'', newReAddress:'',
        newRePrice:'', newReFeatures:'', newReListingLink:'',
      };
      render();
    });
  };

  // ── Helpers ──
  function guessEType(f, collection) {
    const n = f.name.toLowerCase();
    const map = { 'main-image':['hero','feature','photo','main'], 'article-body':['docx','doc','html'], 'banner-ad':['banner','600x200'], 'logo':['logo','svg'], 'event-flyer':['flyer'], 'ad-creative':['ad','promo'] };
    const etypes = ETYPES[collection] || [];
    for (const [etype, keys] of Object.entries(map)) {
      if (keys.some(k => n.includes(k)) && etypes.find(t => t.id===etype)) return etype;
    }
    if (f.mime.startsWith('image/')) { return etypes.find(t=>t.id==='main-image') ? 'main-image' : ''; }
    return '';
  }

  // ── Init ──
  loadFiles('DONE');
  console.log('📂 Content Manager v1.0 mounted');
});
