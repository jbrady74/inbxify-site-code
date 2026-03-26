// ============================================================
// content-manager-v2.2.3.js
// INBXIFY Content Manager — System 2 UI
// Mounts into #content-manager-mount on T-A page
// Config from window.TA_CONFIG
//
// v2.0.0: Clean rewrite from v1.1.3
// v2.1.0: Step 1 = Collection, not Product Type
// v2.1.1: Element types from window.TA_CONFIG.elementTypes
//         Ads selector fixed: .ad-source (not .ads-wrapper)
// v2.2.0: Choices.js searchable dropdowns, live DOM reads, alphabetical sort
// v2.2.1: Fix Choices.js classNames space error (DOMTokenList)
//         Labels: "Select Asset Type" / "Select Type"
// v2.2.2: Fix Choices.js duplicate select display + dropdown z-index
// v2.2.3: CRITICAL — fix event listener stacking on renderModal()
//         (caused 160 duplicate webhook calls on single Assign click)
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  const mount = document.getElementById('content-manager-mount');
  if (!mount) return;

  // ── Config (from window.TA_CONFIG set in Webflow page head) ──
  const CFG = {
    get scenarioCUrl() { return window.TA_CONFIG?.scenarioC || ''; },
    get makeAssembly() { return window.TA_CONFIG?.makeAssembly || ''; },
    get titleSlug()    { return window.TA_CONFIG?.titleSlug || ''; },
    get taItemId()     { return window.TA_CONFIG?.taItemId || ''; },
  };

  // ── State ──
  let FILES     = [];
  let FILTER    = 'ready';
  let LOADING   = false;
  let LOAD_ERR  = null;

  // Assignment state
  let A = freshA();

  function freshA() {
    return {
      collection:'', customerId:'', cmsItemId:'',
      isNew:false, newItemName:'', nestedOpen:false, nestedName:'',
      // Article new-item fields
      newRevenueType:'', newSubTitle:'', newWriterName:'', newWriterTitle:'',
      newCoWriterName:'', newCoWriterTitle:'', newPhotoCredits:false,
      newPhotographer:'', newPhotoEssay:false, newVideoArticle:false,
      newVideoUrl:'', newAudioUrl:'', newBannerStatement:'', newExtrasOpen:false,
      // Ad new-item fields
      newAdClickUrl:'', newAdStartDate:'', newAdEndDate:'',
      // Event new-item fields
      newEventStart:'', newEventDescription:'', newEventLocation:'',
      newEventAddress:'', newEventCity:'', newEventLink:'',
      // RE new-item fields
      newReListingStatus:'', newReMls:'', newReAddress:'',
      newRePrice:'', newReFeatures:'', newReListingLink:'',
    };
  }

  // ── Collections — the 4 CMS content types ──
  const COLLECTIONS = [
    { id:'articles', label:'Articles' },
    { id:'ads',      label:'Ads' },
    { id:'events',   label:'Events' },
    { id:'re',       label:'RE Listings' },
  ];
  const COLLECTION_LABELS = { articles:'article', ads:'ad', events:'event', re:'RE listing' };

  // ── Live DOM readers — fresh data on every call, sorted alphabetically ──
  // Local additions for new customers created in this session (not in DOM yet)
  const localCustomers = [];
  function readCustomers() {
    const fromDOM = Array.from(document.querySelectorAll('.customers-wrapper[data-item]')).map(el => ({
      id: el.getAttribute('data-id') || '', name: el.getAttribute('data-name') || '',
    })).filter(c => c.id);
    return [...fromDOM, ...localCustomers].sort((a,b) => a.name.localeCompare(b.name));
  }

  function readArticles() {
    return Array.from(document.querySelectorAll('.articles-wrapper')).map(el => ({
      id: el.dataset.articleId || '',
      name: el.dataset.articleTitle || '',
      customerId: el.dataset.articleCustomerId || '',
      categoryCode: el.dataset.articleCategoryCode || '',
    })).filter(a => a.id).sort((a,b) => a.name.localeCompare(b.name));
  }

  function readAds() {
    return Array.from(document.querySelectorAll('.ad-source')).map(el => ({
      id: el.dataset.adId || '',
      name: el.dataset.adTitle || el.dataset.label || '',
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

  // ── Element types per collection ──
  // ── Element types per collection — read from window.TA_CONFIG.elementTypes ──
  // Config format: { articles: [{id:'main-image',l:'Main Image'}, ...], ads: [...], ... }
  // Make scenario uses the id to route to the correct CMS field
  const ETYPES = window.TA_CONFIG?.elementTypes || {};
  if (!Object.keys(ETYPES).length) console.warn('[CM] No elementTypes configured in window.TA_CONFIG');

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

  function checkReady(sel) {
    if (!A.collection) return false;
    if (!A.cmsItemId && !A.isNew) return false;
    if (A.isNew) {
      if (!A.newItemName) return false;
      if (A.collection==='articles' && !A.newRevenueType) return false;
    }
    return sel.every(f => f.elementType);
  }

  // ── CSS ──
  const style = document.createElement('style');
  style.textContent = `
#content-manager-mount{font-family:'DM Sans',system-ui,sans-serif;color:#1a3a3a}
.cm-root{max-width:900px;margin:0 auto;padding:16px 0}
.cm-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:2px solid #1a3a3a;margin-bottom:14px}
.cm-hdr-left{display:flex;align-items:center;gap:10px}
.cm-hdr-icon{width:30px;height:30px;background:#1a3a3a;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#c4a35a;font-size:14px}
.cm-hdr h3{font-size:16px;font-weight:700;color:#1a3a3a;margin:0}
.cm-hdr-sub{font-size:10px;font-family:'DM Mono',monospace;color:#8a8a7a;letter-spacing:.04em;text-transform:uppercase}
.cm-badge{font-family:'DM Mono',monospace;font-size:9px;padding:3px 8px;background:#1a3a3a;color:#c4a35a;border-radius:2px;letter-spacing:.06em}
.cm-filters{display:flex;gap:6px;margin-bottom:12px;align-items:center;flex-wrap:wrap}
.cm-pill{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.04em;padding:4px 10px;border-radius:3px;border:1.5px solid #e8e4d8;background:transparent;color:#5a6a5a;cursor:pointer;transition:all .15s}
.cm-pill:hover{border-color:#c4a35a}
.cm-pill.active{background:#1a3a3a;color:#f0edd8;border-color:transparent}
.cm-pill.active-warn{background:#e8a030;color:#fff;border-color:transparent}
.cm-pill.active-ok{background:#27ae60;color:#fff;border-color:transparent}
.cm-pill.active-dec{background:#8b2252;color:#fff;border-color:transparent}
.cm-refresh{font-family:'DM Mono',monospace;font-size:9px;padding:3px 10px;border-radius:2px;border:1.5px solid #e8e4d8;background:#fff;color:#8a8a7a;cursor:pointer;margin-left:auto;transition:all .15s}
.cm-refresh:hover{border-color:#1a3a3a;color:#1a3a3a}
.cm-loading{text-align:center;padding:32px;color:#8a8a7a;font-family:'DM Mono',monospace;font-size:10px}
.cm-loading-spin{display:inline-block;font-size:20px;animation:cm-spin .8s linear infinite;margin-bottom:8px}
@keyframes cm-spin{to{transform:rotate(360deg)}}
.cm-error{padding:10px 12px;background:#fde8e8;border:1px solid #c0392b;border-radius:3px;font-size:11px;font-family:'DM Mono',monospace;color:#c0392b;display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.cm-error button{font-family:'DM Mono',monospace;font-size:9px;padding:3px 10px;border-radius:2px;border:1.5px solid #c0392b;background:#fff;color:#c0392b;cursor:pointer}
.cm-sel-bar{display:flex;align-items:center;gap:10px;padding:8px 14px;background:#1a3a3a;color:#f0edd8;border-radius:4px;margin-bottom:10px;font-size:12px}
.cm-sel-count{font-family:'DM Mono',monospace;font-size:11px;font-weight:600}
.cm-sel-spacer{flex:1}
.cm-desel{font-family:'DM Mono',monospace;font-size:9px;background:none;border:none;color:#f0edd8;cursor:pointer;opacity:.7}
.cm-desel:hover{opacity:1}
.cm-assign-btn{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:5px 16px;border-radius:3px;border:none;background:#c4a35a;color:#1a3a3a;font-weight:700;cursor:pointer;transition:all .15s}
.cm-assign-btn:hover{background:#f4a127}
.cm-flist{display:flex;flex-direction:column;gap:2px}
.cm-frow{background:#fff;border:1.5px solid #e8e4d8;border-radius:4px;transition:border-color .15s}
.cm-frow.sel{border-color:#c4a35a;background:#fdfcf8}
.cm-frow.assigned{opacity:.65;background:#f4fbf4;border-color:#d4eed4}
.cm-frow-main{display:grid;grid-template-columns:28px 30px 1fr auto;align-items:center;padding:7px 10px;cursor:pointer}
.cm-fcheck{width:16px;height:16px;accent-color:#1a3a3a;cursor:pointer}
.cm-ficon{font-size:18px;text-align:center}
.cm-finfo{min-width:0}
.cm-fname{font-size:12px;font-weight:600;color:#1a3a3a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cm-fmeta{font-size:9px;font-family:'DM Mono',monospace;color:#a0a090;display:flex;gap:8px;margin-top:1px;flex-wrap:wrap}
.cm-fright{display:flex;align-items:center;gap:6px;flex-shrink:0}
.cm-fbadge{font-size:8px;font-family:'DM Mono',monospace;padding:2px 7px;border-radius:2px;text-transform:uppercase;letter-spacing:.06em}
.cm-fbadge.ready{background:#e8f5e9;color:#27ae60}
.cm-fbadge.decision{background:#f3e5f5;color:#8b2252}
.cm-fbadge.assigned{background:#e8f5e9;color:#27ae60}
.cm-empty{text-align:center;padding:40px;color:#8a8a7a}
.cm-empty-icon{font-size:28px;opacity:.35;margin-bottom:8px}
.cm-empty-text{font-size:11px;font-family:'DM Mono',monospace}
/* ── Modal ── */
.cm-overlay{position:fixed;inset:0;background:rgba(26,58,58,0.7);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}
.cm-modal{background:#fff;border-radius:8px;width:100%;max-width:760px;box-shadow:0 20px 60px rgba(0,0,0,0.3)}
.cm-modal-bar{height:4px;background:linear-gradient(90deg,#1a3a3a,#c4a35a);border-radius:8px 8px 0 0}
.cm-modal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 12px;border-bottom:1px solid #f0ede4}
.cm-modal-title{font-size:15px;font-weight:700;color:#1a3a3a}
.cm-modal-sub{font-size:10px;font-family:'DM Mono',monospace;color:#8a8a7a;text-transform:uppercase;letter-spacing:.04em;margin-top:2px}
.cm-modal-close{width:28px;height:28px;border-radius:50%;border:1.5px solid #e8e4d8;background:#fff;cursor:pointer;font-size:14px;color:#8a8a7a;transition:all .15s;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.cm-modal-close:hover{border-color:#c0392b;color:#c0392b}
.cm-modal-files{padding:10px 20px;background:#faf9f5;border-bottom:1px solid #f0ede4;display:flex;flex-wrap:wrap;gap:6px}
.cm-modal-file-chip{font-family:'DM Mono',monospace;font-size:9px;padding:3px 8px;background:#fff;border:1px solid #e8e4d8;border-radius:2px;color:#5a6a5a;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cm-modal-body{padding:20px}
.cm-modal-footer{padding:12px 20px 16px;border-top:1px solid #f0ede4;display:flex;align-items:center;justify-content:space-between}
/* ── Form ── */
.cm-steps{display:flex;gap:4px;margin-bottom:16px;align-items:center;flex-wrap:wrap}
.cm-step{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:2px;border:1px solid #e8e4d8;color:#a0a090;background:#fff;transition:all .2s}
.cm-step.active{background:#1a3a3a;color:#f0edd8;border-color:transparent}
.cm-step.done-s{background:#e8f5e9;color:#27ae60;border-color:#d4eed4}
.cm-step-arr{font-size:9px;color:#a0a090}
.cm-fr{display:flex;gap:10px;margin-bottom:10px;flex-wrap:wrap}
.cm-ff{flex:1;min-width:0}
.cm-fl{display:block;font-size:9px;font-family:'DM Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#8a8a7a;margin-bottom:4px}
.cm-fl .req{color:#c0392b}
.cm-fsel,.cm-finp{width:100%;font-family:'DM Sans',system-ui,sans-serif;font-size:12px;color:#1a3a3a;background:#faf9f5;border:1.5px solid #ddd9c8;border-radius:3px;padding:6px 8px;outline:none;transition:border-color .15s}
.cm-fsel{appearance:none;cursor:pointer;padding-right:24px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M1 1l3 3 3-3' fill='none' stroke='%238a8a7a' stroke-width='1.2' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center}
.cm-fsel:focus,.cm-finp:focus{border-color:#1a3a3a;box-shadow:0 0 0 2px rgba(26,58,58,.08)}
.cm-fsel.changed,.cm-finp.changed{border-color:#c4a35a;box-shadow:0 0 0 2px rgba(196,163,90,.12)}
.cm-nested{margin-top:8px;padding:10px 12px;background:#fdfcf8;border:1.5px dashed #c4a35a;border-radius:4px}
.cm-nested-hdr{font-size:11px;font-weight:700;color:#1a3a3a;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
.cm-nested-close{font-size:10px;font-family:'DM Mono',monospace;color:#c0392b;cursor:pointer;background:none;border:none}
.cm-no-results{padding:8px 10px;background:#fff8e1;border:1px solid #e8a030;border-radius:3px;font-size:11px;color:#e8a030;margin-top:6px;display:flex;align-items:center;justify-content:space-between}
.cm-no-results button{font-family:'DM Mono',monospace;font-size:10px;padding:3px 10px;border-radius:3px;border:1.5px solid #1a3a3a;background:#fff;color:#1a3a3a;cursor:pointer}
.cm-tag-list{margin-top:14px;border-top:1px dashed #e8e4d8;padding-top:12px}
.cm-tag-label{font-size:10px;font-family:'DM Mono',monospace;color:#8a8a7a;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.cm-tag-row{display:flex;align-items:center;gap:8px;padding:6px 8px;background:#faf9f5;border:1px solid #e8e4d8;border-radius:3px;margin-bottom:4px}
.cm-tag-row.tagged{border-color:#c4a35a;background:#fdfcf8}
.cm-tag-icon{font-size:16px;flex-shrink:0}
.cm-tag-name{flex:1;font-size:11px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.cm-echips{display:flex;flex-wrap:wrap;gap:3px;flex-shrink:0}
.cm-echip{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.04em;padding:2px 7px;border-radius:2px;border:1px solid #e8e4d8;background:#fff;color:#5a6a5a;cursor:pointer;transition:all .12s;white-space:nowrap}
.cm-echip:hover{border-color:#c4a35a}
.cm-echip.sel{background:#1a3a3a;color:#f0edd8;border-color:transparent}
.cm-cancel{font-size:10px;font-family:'DM Mono',monospace;color:#c0392b;cursor:pointer;background:none;border:none}
.cm-cancel:hover{opacity:.65}
.cm-sub-right{display:flex;align-items:center;gap:12px}
.cm-sub-info{font-size:9px;font-family:'DM Mono',monospace;color:#a0a090}
.cm-sub-btn{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:7px 18px;border-radius:3px;border:none;background:#c4a35a;color:#1a3a3a;font-weight:700;cursor:pointer;transition:all .15s}
.cm-sub-btn:hover:not(:disabled){background:#f4a127}
.cm-sub-btn:disabled{opacity:.35;cursor:not-allowed}
.cm-link-btn{font-family:'DM Mono',monospace;font-size:10px;color:#1a3a3a;background:none;border:none;cursor:pointer;text-decoration:underline;padding:0}
.cm-link-btn:hover{opacity:.7}
.cm-new-form{background:#f5f3ee;border:1.5px solid #e8e4d8;border-radius:4px;padding:14px;margin-bottom:10px}
.cm-new-form-title{font-size:10px;font-family:'DM Mono',monospace;color:#1a3a3a;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px}
.cm-extras-toggle{font-family:'DM Mono',monospace;font-size:10px;color:#1a3a3a;background:none;border:none;cursor:pointer;text-decoration:underline;padding:0}
.cm-chk-label{display:flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:10px;color:#5a6a5a;cursor:pointer}
.cm-chk-label input{accent-color:#1a3a3a}
.cm-choices .choices__inner{font-family:'DM Sans',system-ui,sans-serif;font-size:12px;color:#1a3a3a;background:#faf9f5;border:1.5px solid #ddd9c8;border-radius:3px;padding:4px 8px;min-height:34px}
.cm-choices .choices__inner .choices__item{font-size:12px}
.cm-choices.is-focused .choices__inner{border-color:#1a3a3a;box-shadow:0 0 0 2px rgba(26,58,58,.08)}
.cm-choices .choices__list--dropdown{font-family:'DM Sans',system-ui,sans-serif;font-size:12px;border:1.5px solid #ddd9c8;border-radius:3px;z-index:10000}
.cm-choices .choices__list--dropdown .choices__item{padding:6px 10px}
.cm-choices .choices__list--dropdown .choices__item--selectable.is-highlighted{background:#faf9f5;color:#1a3a3a}
.cm-choices .choices__input{font-family:'DM Sans',system-ui,sans-serif;font-size:11px;color:#1a3a3a;background:#faf9f5}
.cm-choices.has-selection .choices__inner{border-color:#c4a35a;box-shadow:0 0 0 2px rgba(196,163,90,.12)}
/* Hide original select when Choices.js wraps it */
.cm-choices select.cm-fsel{display:none!important}
/* Fix Choices.js dropdown escaping modal */
.cm-modal-body{position:relative}
.cm-choices{position:relative}
  `;
  document.head.appendChild(style);

  // ══════════════════════════════════════════════
  // SHELL HTML
  // ══════════════════════════════════════════════
  mount.innerHTML = `
<div class="cm-root">
  <div class="cm-hdr">
    <div class="cm-hdr-left">
      <div class="cm-hdr-icon">\u{1F4C2}</div>
      <div><h3>Content Manager</h3><div class="cm-hdr-sub">Select files \u2192 Assign to CMS records</div></div>
    </div>
    <span class="cm-badge">v2.2.3</span>
  </div>
  <div class="cm-filters" id="cm-filters"></div>
  <div id="cm-error"></div>
  <div id="cm-sel-bar"></div>
  <div class="cm-flist" id="cm-flist"></div>
  <div id="cm-modal-root"></div>
</div>`;

  // ══════════════════════════════════════════════
  // FILE LIST RENDERING
  // ══════════════════════════════════════════════
  function render() {
    renderFilters();
    renderError();
    renderSelBar();
    renderFileList();
  }

  function renderFilters() {
    const ready = FILES.filter(f => f.status==='DONE' && !f.assigned).length;
    const dec   = FILES.filter(f => f.status==='AWAITING_DECISION').length;
    document.getElementById('cm-filters').innerHTML =
      `<button class="cm-pill ${FILTER==='ready'?'active-ok':''}" data-cm-filter="ready">Ready ${ready}</button>`+
      `<button class="cm-pill ${FILTER==='all'?'active':''}" data-cm-filter="all">All</button>`+
      `<button class="cm-pill ${FILTER==='assigned'?'active':''}" data-cm-filter="assigned">Assigned</button>`+
      `<button class="cm-pill ${FILTER==='decision'?'active-dec':''}" data-cm-filter="decision">Needs Decision ${dec}</button>`+
      `<button class="cm-refresh" data-cm-refresh>↻ Refresh</button>`;
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
    el.innerHTML = `<div class="cm-sel-bar">
      <span class="cm-sel-count">${sel.length} file${sel.length>1?'s':''} selected</span>
      <div class="cm-sel-spacer"></div>
      <button class="cm-desel" data-cm-desel>\u2715 clear</button>
      <button class="cm-assign-btn" data-cm-open-modal>Assign ${sel.length} File${sel.length>1?'s':''} \u2192</button>
    </div>`;
  }

  function renderFileList() {
    const el = document.getElementById('cm-flist');
    if (LOADING) { el.innerHTML = `<div class="cm-loading"><div class="cm-loading-spin">\u27F3</div><div>Loading files\u2026</div></div>`; return; }
    let vis = FILES;
    if (FILTER==='ready')    vis = FILES.filter(f => f.status==='DONE' && !f.assigned);
    if (FILTER==='assigned') vis = FILES.filter(f => f.assigned);
    if (FILTER==='decision') vis = FILES.filter(f => f.status==='AWAITING_DECISION');
    if (!vis.length) {
      const msgs = { ready:'No conditioned files ready', all:'No files', assigned:'No files assigned yet', decision:'No PDFs awaiting decision' };
      el.innerHTML = `<div class="cm-empty"><div class="cm-empty-icon">${FILTER==='ready'?'\u2705':'\u{1F4ED}'}</div><div class="cm-empty-text">${msgs[FILTER]||'No files'}</div></div>`;
      return;
    }
    el.innerHTML = vis.map(f => {
      const icon  = FILE_ICONS[f.mime] || '\u{1F4C4}';
      const badge = f.assigned ? 'assigned' : f.status==='AWAITING_DECISION' ? 'decision' : 'ready';
      const label = f.assigned ? 'Assigned' : f.status==='AWAITING_DECISION' ? 'Needs Decision' : 'Ready';
      const uc    = f.uuid ? `<span style="color:#1a3a3a">UC:${f.uuid.substring(0,8)}\u2026</span>` : '';
      return `<div class="cm-frow ${f.selected?'sel':''} ${f.assigned?'assigned':''}" data-cm-fid="${f.id}">
        <div class="cm-frow-main">
          <input type="checkbox" class="cm-fcheck" ${f.selected?'checked':''} ${f.assigned?'disabled':''}>
          <span class="cm-ficon">${icon}</span>
          <div class="cm-finfo">
            <div class="cm-fname">${esc(f.name)}</div>
            <div class="cm-fmeta">${f.size?`<span>${fmtSize(f.size)}</span>`:''} ${f.arrived?`<span>${f.arrived.substring(0,10)}</span>`:''} ${uc}</div>
          </div>
          <div class="cm-fright"><span class="cm-fbadge ${badge}">${label}</span></div>
        </div>
      </div>`;
    }).join('');
  }

  function getSelected() { return FILES.filter(f => f.selected && !f.assigned); }

  // ══════════════════════════════════════════════
  // EVENT DELEGATION (file list + filter bar)
  // ══════════════════════════════════════════════
  mount.addEventListener('click', function(e) {
    const filterBtn = e.target.closest('[data-cm-filter]');
    if (filterBtn) { setFilter(filterBtn.dataset.cmFilter); return; }

    if (e.target.closest('[data-cm-refresh]')) { reload(); return; }
    if (e.target.closest('[data-cm-desel]'))   { deselectAll(); return; }
    if (e.target.closest('[data-cm-open-modal]')) { openModal(); return; }

    const frow = e.target.closest('[data-cm-fid]');
    if (frow) { toggleSel(frow.dataset.cmFid); return; }
  });

  function setFilter(f) {
    FILTER = f;
    FILES.forEach(x => { x.selected = false; x.elementType = ''; });
    A = freshA();
    const statusMap = { ready:'DONE', all:'DONE', assigned:'ASSIGNED', decision:'AWAITING_DECISION' };
    loadFiles(statusMap[f] || 'DONE');
  }

  function reload() {
    const statusMap = { ready:'DONE', all:'DONE', assigned:'ASSIGNED', decision:'AWAITING_DECISION' };
    loadFiles(statusMap[FILTER] || 'DONE');
  }

  function toggleSel(id) {
    const f = FILES.find(x => x.id === id);
    if (!f || f.assigned) return;
    f.selected = !f.selected;
    if (!f.selected) f.elementType = '';
    renderSelBar();
    renderFileList();
  }

  function deselectAll() {
    FILES.forEach(f => { f.selected = false; f.elementType = ''; });
    A = freshA();
    closeModal();
    render();
  }

  // ══════════════════════════════════════════════
  // MODAL — simple rebuild on every render
  // ══════════════════════════════════════════════
  let MODAL_OPEN = false;

  function openModal() {
    const sel = getSelected();
    if (!sel.length) return;
    MODAL_OPEN = true;
    renderModal();
  }

  function closeModal() {
    MODAL_OPEN = false;
    destroyChoices();
    document.getElementById('cm-modal-root').innerHTML = '';
  }

  function renderModal() {
    if (!MODAL_OPEN) return;
    const sel = getSelected();
    if (!sel.length) { closeModal(); return; }

    const col = A.collection;

    // Step states — customer is always optional, so s2 = s1
    const s1 = !!A.collection;
    const s2 = s1;
    const s3 = s2 && !!(A.cmsItemId || (A.isNew && A.newItemName));
    const s4 = s3 && sel.every(f => f.elementType);
    const stepCls = (done, active) => done ? 'cm-step done-s' : active ? 'cm-step active' : 'cm-step';

    let h = `<div class="cm-overlay" data-cm-overlay>
      <div class="cm-modal">
        <div class="cm-modal-bar"></div>
        <div class="cm-modal-head">
          <div>
            <div class="cm-modal-title">Assign ${sel.length} File${sel.length>1?'s':''}</div>
            <div class="cm-modal-sub">Complete all steps \u00B7 tag each file individually</div>
          </div>
          <button class="cm-modal-close" data-cm-close>\u2715</button>
        </div>
        <div class="cm-modal-files">
          ${sel.map(f => `<span class="cm-modal-file-chip">${FILE_ICONS[f.mime]||'\u{1F4C4}'} ${esc(f.name)}</span>`).join('')}
        </div>
        <div class="cm-modal-body">

          <!-- Steps indicator -->
          <div class="cm-steps">
            <span class="${stepCls(s1, !s1)}">1 Collection</span><span class="cm-step-arr">\u2192</span>
            <span class="${stepCls(s2&&!!A.customerId, s1&&!A.customerId)}">2 Customer</span><span class="cm-step-arr">\u2192</span>
            <span class="${stepCls(s3, s2&&!s3)}">3 Item</span><span class="cm-step-arr">\u2192</span>
            <span class="${stepCls(s4, s3&&!s4)}">4 Tag</span>
          </div>

          <!-- Step 1: Collection -->
          <div class="cm-fr"><div class="cm-ff">
            <label class="cm-fl">Select Asset Type <span class="req">*</span></label>
            <select class="cm-fsel${chg(A.collection)}" data-cm-field="collection">
              <option value="">Select Type\u2026</option>
              ${COLLECTIONS.map(c => `<option value="${c.id}"${c.id===A.collection?' selected':''}>${esc(c.label)}</option>`).join('')}
            </select>
          </div></div>`;

    // Step 2 + 3: Customer (optional) + CMS Item — shown simultaneously when collection is picked
    if (s1) {
      // Customer dropdown (optional, filters item list)
      h += `<div class="cm-fr"><div class="cm-ff">
        <label class="cm-fl">Customer</label>
        <select class="cm-fsel${chg(A.customerId)}" data-cm-field="customerId" id="cm-sel-cust">
          <option value="">Any / None</option>
          <option value="__none__">\u2014 No Customer / Unsponsored</option>
          ${readCustomers().map(c => `<option value="${c.id}"${c.id===A.customerId?' selected':''}>${esc(c.name)}</option>`).join('')}
          <option value="__new__">+ New Customer</option>
        </select>
      </div></div>`;

      // New customer nested form
      if (A.nestedOpen) {
        h += `<div class="cm-nested">
          <div class="cm-nested-hdr"><span>+ New Customer</span><button class="cm-nested-close" data-cm-nested-close>\u2715 cancel</button></div>
          <div class="cm-fr"><div class="cm-ff">
            <label class="cm-fl">Business Name <span class="req">*</span></label>
            <input class="cm-finp${chg(A.nestedName)}" data-cm-field="nestedName" type="text" value="${esc(A.nestedName)}" placeholder="Business name\u2026">
          </div></div>
          <div style="text-align:right;margin-top:4px"><button class="cm-sub-btn" data-cm-create-cust${A.nestedName?'':' disabled'}>Create Customer</button></div>
        </div>`;
      }

      // CMS Item (existing or new)
      if (A.isNew) {
        h += buildNewItemFormHTML(col, null);
        h += `<div style="margin-bottom:8px"><button class="cm-link-btn" data-cm-back-existing>\u2190 back to existing</button></div>`;
      } else {
        const items = getCMSItems(col, A.customerId);
        h += `<div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Select ${colLabel(col)} <span class="req">*</span></label>
          <select class="cm-fsel${chg(A.cmsItemId)}" data-cm-field="cmsItemId" id="cm-sel-item">
            <option value="">Select ${colLabel(col)}\u2026</option>
            ${items.map(i => `<option value="${i.id}"${i.id===A.cmsItemId?' selected':''}>${esc(i.name)}</option>`).join('')}
          </select>
        </div></div>`;
        if (!items.length) {
          h += `<div class="cm-no-results"><span>No ${colLabel(col)}s found${A.customerId&&A.customerId!=='__none__'?' for this customer':''}</span><button data-cm-new-item>+ Create New</button></div>`;
        } else {
          h += `<div style="margin-bottom:8px"><button class="cm-link-btn" data-cm-new-item>+ or create new ${colLabel(col)}</button></div>`;
        }
      }
    }

    // Step 4: Element tags (show if item resolved)
    if (s3) {
      const etypes = ETYPES[col] || [];
      if (etypes.length) {
        h += `<div class="cm-tag-list"><div class="cm-tag-label">Tag Each File\u2019s Element Type</div>`;
        sel.forEach(f => {
          const icon = FILE_ICONS[f.mime] || '\u{1F4C4}';
          h += `<div class="cm-tag-row${f.elementType?' tagged':''}" data-cm-tag-fid="${f.id}">
            <span class="cm-tag-icon">${icon}</span>
            <span class="cm-tag-name">${esc(f.name)}</span>
            <div class="cm-echips">${etypes.map(t => `<span class="cm-echip${t.id===f.elementType?' sel':''}" data-cm-etype="${t.id}">${t.l}</span>`).join('')}</div>
          </div>`;
        });
        h += `</div>`;
      }
    }

    h += `</div><!-- /modal-body -->`;

    // Footer
    const ok = checkReady(sel);
    const tagged = sel.filter(f => f.elementType).length;
    h += `<div class="cm-modal-footer">
      <button class="cm-cancel" data-cm-reset>\u2715 reset</button>
      <div class="cm-sub-right">
        <span class="cm-sub-info">${tagged}/${sel.length} tagged${ok?' \u2014 ready':''}</span>
        <button class="cm-sub-btn" data-cm-submit${ok?'':' disabled'}>Assign ${sel.length} File${sel.length>1?'s':''} \u2713</button>
      </div>
    </div>`;

    h += `</div></div>`; // close modal + overlay

    document.getElementById('cm-modal-root').innerHTML = h;
    bindModalEvents();
    initChoicesDropdowns();
  }

  // ── New item form builders per collection ──
  function buildNewItemFormHTML(col) {
    if (col === 'articles') {
      return `<div class="cm-new-form">
        <div class="cm-new-form-title">New Article</div>
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Article Title <span class="req">*</span></label>
          <input class="cm-finp${chg(A.newItemName)}" data-cm-field="newItemName" type="text" value="${esc(A.newItemName)}" placeholder="Article title\u2026">
        </div></div>
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Sub-Title</label>
          <input class="cm-finp${chg(A.newSubTitle)}" data-cm-field="newSubTitle" type="text" value="${esc(A.newSubTitle)}" placeholder="Sub-title\u2026">
        </div></div>
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Revenue Type <span class="req">*</span></label>
          <select class="cm-fsel${chg(A.newRevenueType)}" data-cm-field="newRevenueType">
            <option value="">Select\u2026</option>
            <option value="d894f7e97435fc2f06fdb79c75e8ea29"${A.newRevenueType==='d894f7e97435fc2f06fdb79c75e8ea29'?' selected':''}>Paid Ad</option>
            <option value="99578b8a5a6a99e9c15c0c2ed30c22b2"${A.newRevenueType==='99578b8a5a6a99e9c15c0c2ed30c22b2'?' selected':''}>Paid Article</option>
            <option value="1625d5aa547083d33098b8b6fd4b0569"${A.newRevenueType==='1625d5aa547083d33098b8b6fd4b0569'?' selected':''}>Sponsorable</option>
          </select>
        </div></div>
        <div class="cm-fr">
          <div class="cm-ff"><label class="cm-fl">Writer Name</label><input class="cm-finp" data-cm-field="newWriterName" type="text" value="${esc(A.newWriterName)}" placeholder="Name\u2026"></div>
          <div class="cm-ff"><label class="cm-fl">Writer Title</label><input class="cm-finp" data-cm-field="newWriterTitle" type="text" value="${esc(A.newWriterTitle)}" placeholder="Role\u2026"></div>
        </div>
        <div class="cm-fr">
          <div class="cm-ff"><label class="cm-fl">Co-Writer</label><input class="cm-finp" data-cm-field="newCoWriterName" type="text" value="${esc(A.newCoWriterName)}" placeholder="Optional\u2026"></div>
          <div class="cm-ff"><label class="cm-fl">Co-Writer Title</label><input class="cm-finp" data-cm-field="newCoWriterTitle" type="text" value="${esc(A.newCoWriterTitle)}" placeholder="Optional\u2026"></div>
        </div>
        <div style="border-top:1px dashed #ddd9c8;margin-top:8px;padding-top:8px">
          <button class="cm-extras-toggle" data-cm-extras-toggle>\u25B8 Additional fields</button>
          <div style="margin-top:10px;${A.newExtrasOpen?'':'display:none'}" data-cm-extras-body>
            <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Banner Statement</label><input class="cm-finp" data-cm-field="newBannerStatement" type="text" value="${esc(A.newBannerStatement)}" placeholder="Optional\u2026"></div></div>
            <div class="cm-fr" style="align-items:center;gap:20px;flex-wrap:wrap">
              <label class="cm-chk-label"><input type="checkbox" data-cm-chk="newPhotoCredits"${A.newPhotoCredits?' checked':''}> Show Photo Credits</label>
              <label class="cm-chk-label"><input type="checkbox" data-cm-chk="newPhotoEssay"${A.newPhotoEssay?' checked':''}> Photo Essay</label>
              <label class="cm-chk-label"><input type="checkbox" data-cm-chk="newVideoArticle"${A.newVideoArticle?' checked':''}> Video Article</label>
            </div>
            <div class="cm-fr" style="margin-top:8px;${A.newPhotoCredits?'':'display:none'}" data-cm-photo-wrap><div class="cm-ff"><label class="cm-fl">Photographer</label><input class="cm-finp" data-cm-field="newPhotographer" type="text" value="${esc(A.newPhotographer)}" placeholder="Name\u2026"></div></div>
            <div class="cm-fr" style="margin-top:8px;${A.newVideoArticle?'':'display:none'}" data-cm-video-wrap><div class="cm-ff"><label class="cm-fl">Video URL</label><input class="cm-finp" data-cm-field="newVideoUrl" type="text" value="${esc(A.newVideoUrl)}" placeholder="https://\u2026"></div></div>
            <div class="cm-fr" style="margin-top:8px"><div class="cm-ff"><label class="cm-fl">Audio URL</label><input class="cm-finp" data-cm-field="newAudioUrl" type="text" value="${esc(A.newAudioUrl)}" placeholder="https://\u2026"></div></div>
          </div>
        </div>
      </div>`;
    }

    if (col === 'ads') {
      const today = new Date().toISOString().split('T')[0];
      const sixMo = new Date(Date.now() + 183*24*60*60*1000).toISOString().split('T')[0];
      return `<div class="cm-new-form">
        <div class="cm-new-form-title">New Ad</div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Ad Name <span class="req">*</span></label><input class="cm-finp${chg(A.newItemName)}" data-cm-field="newItemName" type="text" value="${esc(A.newItemName)}" placeholder="Ad name\u2026"></div></div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Click URL</label><input class="cm-finp${chg(A.newAdClickUrl)}" data-cm-field="newAdClickUrl" type="text" value="${esc(A.newAdClickUrl)}" placeholder="https://\u2026"></div></div>
        <div class="cm-fr">
          <div class="cm-ff"><label class="cm-fl">Start Date</label><input class="cm-finp changed" data-cm-field="newAdStartDate" type="date" value="${A.newAdStartDate||today}"></div>
          <div class="cm-ff"><label class="cm-fl">End Date</label><input class="cm-finp changed" data-cm-field="newAdEndDate" type="date" value="${A.newAdEndDate||sixMo}"></div>
        </div>
      </div>`;
    }

    if (col === 'events') {
      return `<div class="cm-new-form">
        <div class="cm-new-form-title">New Event</div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Event Title <span class="req">*</span></label><input class="cm-finp${chg(A.newItemName)}" data-cm-field="newItemName" type="text" value="${esc(A.newItemName)}" placeholder="Event title\u2026"></div></div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Event Start <span class="req">*</span></label><input class="cm-finp${chg(A.newEventStart)}" data-cm-field="newEventStart" type="datetime-local" value="${A.newEventStart}"></div></div>
        <div class="cm-fr">
          <div class="cm-ff"><label class="cm-fl">Location</label><input class="cm-finp" data-cm-field="newEventLocation" type="text" value="${esc(A.newEventLocation)}" placeholder="Venue\u2026"></div>
          <div class="cm-ff"><label class="cm-fl">City</label><input class="cm-finp" data-cm-field="newEventCity" type="text" value="${esc(A.newEventCity)}" placeholder="City\u2026"></div>
        </div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Address</label><input class="cm-finp" data-cm-field="newEventAddress" type="text" value="${esc(A.newEventAddress)}" placeholder="Street address\u2026"></div></div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Description</label><input class="cm-finp" data-cm-field="newEventDescription" type="text" value="${esc(A.newEventDescription)}" placeholder="Brief description\u2026"></div></div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Event Link</label><input class="cm-finp" data-cm-field="newEventLink" type="text" value="${esc(A.newEventLink)}" placeholder="https://\u2026"></div></div>
      </div>`;
    }

    if (col === 're') {
      return `<div class="cm-new-form">
        <div class="cm-new-form-title">New RE Listing</div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Property Address <span class="req">*</span></label><input class="cm-finp${chg(A.newItemName)}" data-cm-field="newItemName" type="text" value="${esc(A.newItemName)}" placeholder="42 Oak Street\u2026"></div></div>
        <div class="cm-fr">
          <div class="cm-ff">
            <label class="cm-fl">Listing Status</label>
            <select class="cm-fsel${chg(A.newReListingStatus)}" data-cm-field="newReListingStatus">
              <option value="">Select\u2026</option>
              <option value="b0887da3d5d4d77a684cbb96531bd08c"${A.newReListingStatus==='b0887da3d5d4d77a684cbb96531bd08c'?' selected':''}>Active</option>
              <option value="4a8316ea601504d55ec421db92fed4ff"${A.newReListingStatus==='4a8316ea601504d55ec421db92fed4ff'?' selected':''}>Coming Soon</option>
              <option value="9091234ac1ce288c11c363e430337622"${A.newReListingStatus==='9091234ac1ce288c11c363e430337622'?' selected':''}>Under Contract</option>
              <option value="09a0a251160c6d74cfd8783e267ecae7"${A.newReListingStatus==='09a0a251160c6d74cfd8783e267ecae7'?' selected':''}>Sold</option>
            </select>
          </div>
          <div class="cm-ff"><label class="cm-fl">MLS #</label><input class="cm-finp" data-cm-field="newReMls" type="text" value="${esc(A.newReMls)}" placeholder="MLS number\u2026"></div>
        </div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Price</label><input class="cm-finp${chg(A.newRePrice)}" data-cm-field="newRePrice" type="number" value="${A.newRePrice}" placeholder="549000"></div></div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Features</label><input class="cm-finp" data-cm-field="newReFeatures" type="text" value="${esc(A.newReFeatures)}" placeholder="3BR, 2BA\u2026"></div></div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Listing Link</label><input class="cm-finp" data-cm-field="newReListingLink" type="text" value="${esc(A.newReListingLink)}" placeholder="https://\u2026"></div></div>
      </div>`;
    }

    // Fallback
    return `<div class="cm-new-form"><div class="cm-new-form-title">New ${esc(colLabel(col))}</div>
      <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Name <span class="req">*</span></label><input class="cm-finp${chg(A.newItemName)}" data-cm-field="newItemName" type="text" value="${esc(A.newItemName)}" placeholder="Name\u2026"></div></div>
    </div>`;
  }

  // ── Choices.js instances — destroyed and re-created on each modal render ──
  let choicesInstances = [];

  function destroyChoices() {
    choicesInstances.forEach(c => { try { c.destroy(); } catch(e) {} });
    choicesInstances = [];
  }

  function initChoicesDropdowns() {
    destroyChoices();
    if (typeof Choices === 'undefined') return; // Choices.js not loaded

    const custSel = document.getElementById('cm-sel-cust');
    if (custSel) {
      const cc = new Choices(custSel, {
        searchEnabled: true,
        searchPlaceholderValue: 'Type to search customers\u2026',
        itemSelectText: '',
        shouldSort: false, // already sorted alphabetically
        position: 'bottom',
        classNames: { containerOuter: 'cm-choices' },
      });
      if (A.customerId) cc.containerOuter.element.classList.add('has-selection');
      cc.passedElement.element.addEventListener('change', function() {
        cc.containerOuter.element.classList.toggle('has-selection', !!this.value);
        handleFieldChange('customerId', this.value);
      });
      choicesInstances.push(cc);
    }

    const itemSel = document.getElementById('cm-sel-item');
    if (itemSel) {
      const ic = new Choices(itemSel, {
        searchEnabled: true,
        searchPlaceholderValue: 'Type to search\u2026',
        itemSelectText: '',
        shouldSort: false,
        position: 'bottom',
        classNames: { containerOuter: 'cm-choices' },
      });
      if (A.cmsItemId) ic.containerOuter.element.classList.add('has-selection');
      ic.passedElement.element.addEventListener('change', function() {
        ic.containerOuter.element.classList.toggle('has-selection', !!this.value);
        handleFieldChange('cmsItemId', this.value);
      });
      choicesInstances.push(ic);
    }
  }

  // ── Modal event binding — use named handlers to prevent stacking ──
  let _modalClickHandler = null;
  let _modalChangeHandler = null;
  let _modalInputHandler = null;

  function bindModalEvents() {
    const root = document.getElementById('cm-modal-root');
    if (!root.firstChild) return;

    // Remove previous listeners if they exist
    if (_modalClickHandler) root.removeEventListener('click', _modalClickHandler);
    if (_modalChangeHandler) root.removeEventListener('change', _modalChangeHandler);
    if (_modalInputHandler) root.removeEventListener('input', _modalInputHandler);

    _modalClickHandler = function(e) {
      // Overlay click to close
      if (e.target.matches('[data-cm-overlay]')) { closeModal(); return; }
      if (e.target.closest('[data-cm-close]')) { closeModal(); return; }
      if (e.target.closest('[data-cm-reset]')) { A = freshA(); getSelected().forEach(f => f.elementType = ''); renderModal(); return; }
      if (e.target.closest('[data-cm-submit]')) { submitAssignment(); return; }
      if (e.target.closest('[data-cm-new-item]')) { A.isNew = true; A.cmsItemId = ''; renderModal(); return; }
      if (e.target.closest('[data-cm-back-existing]')) { A.isNew = false; A.newItemName = ''; renderModal(); return; }
      if (e.target.closest('[data-cm-nested-close]')) { A.nestedOpen = false; renderModal(); return; }
      if (e.target.closest('[data-cm-create-cust]')) { createCustomer(); return; }
      if (e.target.closest('[data-cm-extras-toggle]')) { A.newExtrasOpen = !A.newExtrasOpen; renderModal(); return; }

      // Element type chip
      const chip = e.target.closest('[data-cm-etype]');
      if (chip) {
        const row = chip.closest('[data-cm-tag-fid]');
        if (row) {
          const f = FILES.find(x => x.id === row.dataset.cmTagFid);
          if (f) { f.elementType = chip.dataset.cmEtype; renderModal(); }
        }
        return;
      }
    };
    root.addEventListener('click', _modalClickHandler);

    // Field changes — use event delegation on change/input
    // Skip Choices.js-wrapped selects (they have their own listeners)
    _modalChangeHandler = function(e) {
      if (e.target.id === 'cm-sel-cust' || e.target.id === 'cm-sel-item') return;
      const field = e.target.dataset.cmField;
      if (!field) {
        // Checkbox
        const chk = e.target.dataset.cmChk;
        if (chk && chk in A) {
          A[chk] = e.target.checked;
          renderModal();
        }
        return;
      }
      handleFieldChange(field, e.target.value);
    };
    root.addEventListener('change', _modalChangeHandler);

    _modalInputHandler = function(e) {
      const field = e.target.dataset.cmField;
      if (!field) return;
      // For text inputs, update state without full re-render (avoid cursor jump)
      if (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') {
        A[field] = e.target.value;
        e.target.classList.toggle('changed', !!e.target.value);
        // Update footer info only
        updateFooterOnly();
      }
    };
    root.addEventListener('input', _modalInputHandler);
  }

  function handleFieldChange(field, value) {
    if (field === 'collection') {
      A.collection = value;
      A.customerId = ''; A.cmsItemId = ''; A.isNew = false; A.newItemName = '';
      A.nestedOpen = false; A.nestedName = '';
      // Reset collection-specific new-item fields
      A.newRevenueType = ''; A.newSubTitle = ''; A.newWriterName = ''; A.newWriterTitle = '';
      A.newCoWriterName = ''; A.newCoWriterTitle = ''; A.newPhotoCredits = false;
      A.newPhotographer = ''; A.newPhotoEssay = false; A.newVideoArticle = false;
      A.newVideoUrl = ''; A.newAudioUrl = ''; A.newBannerStatement = ''; A.newExtrasOpen = false;
      A.newAdClickUrl = ''; A.newAdStartDate = ''; A.newAdEndDate = '';
      A.newEventStart = ''; A.newEventDescription = ''; A.newEventLocation = '';
      A.newEventAddress = ''; A.newEventCity = ''; A.newEventLink = '';
      A.newReListingStatus = ''; A.newReMls = ''; A.newRePrice = '';
      A.newReFeatures = ''; A.newReListingLink = '';
      // Auto-guess element types
      if (value) getSelected().forEach(f => { f.elementType = guessEType(f, value); });
      else getSelected().forEach(f => { f.elementType = ''; });
      renderModal();
    } else if (field === 'customerId') {
      if (value === '__new__') { A.nestedOpen = true; A.customerId = ''; renderModal(); return; }
      A.customerId = value; A.nestedOpen = false; A.cmsItemId = ''; A.isNew = false; A.newItemName = '';
      renderModal();
    } else if (field === 'cmsItemId') {
      A.cmsItemId = value;
      renderModal();
    } else if (field === 'newRevenueType' || field === 'newReListingStatus') {
      A[field] = value;
      renderModal();
    } else {
      // Generic field update (handled by input event for text fields)
      A[field] = value;
    }
  }

  function updateFooterOnly() {
    const sel = getSelected();
    const ok = checkReady(sel);
    const tagged = sel.filter(f => f.elementType).length;
    const info = document.querySelector('.cm-sub-info');
    const btn  = document.querySelector('[data-cm-submit]');
    if (info) info.textContent = `${tagged}/${sel.length} tagged${ok?' \u2014 ready':''}`;
    if (btn) btn.disabled = !ok;
  }

  function createCustomer() {
    if (!A.nestedName) return;
    const nid = 'new-' + Date.now();
    localCustomers.push({ id: nid, name: A.nestedName });
    A.customerId = nid;
    A.nestedOpen = false;
    A.nestedName = '';
    renderModal();
  }

  // ══════════════════════════════════════════════
  // SUBMIT
  // ══════════════════════════════════════════════
  function submitAssignment() {
    const sel = getSelected();
    if (!checkReady(sel)) return;

    if (!CFG.makeAssembly) {
      console.warn('[CM] No makeAssembly URL configured in window.TA_CONFIG — logging only');
    }

    const promises = sel.map(f => {
      const payload = {
        titleSlug: CFG.titleSlug,
        taItemId: CFG.taItemId,
        fileId: f.fileId,
        fileName: f.name,
        uploadcareUuid: f.uuid,
        mimeType: f.mime,
        collection: A.collection,
        customerId: A.customerId === '__none__' ? '' : A.customerId,
        cmsItemId: A.cmsItemId || '',
        isNew: A.isNew,
        elementType: f.elementType,
        newItemName: A.newItemName || '',
        newRevenueType: A.newRevenueType || '',
        newSubTitle: A.newSubTitle || '',
        newWriterName: A.newWriterName || '',
        newWriterTitle: A.newWriterTitle || '',
        newCoWriterName: A.newCoWriterName || '',
        newCoWriterTitle: A.newCoWriterTitle || '',
        newPhotoCredits: A.newPhotoCredits || false,
        newPhotographer: A.newPhotographer || '',
        newPhotoEssay: A.newPhotoEssay || false,
        newVideoArticle: A.newVideoArticle || false,
        newVideoUrl: A.newVideoUrl || '',
        newAudioUrl: A.newAudioUrl || '',
        newBannerStatement: A.newBannerStatement || '',
        newAdClickUrl: A.newAdClickUrl || '',
        newAdStartDate: A.newAdStartDate || '',
        newAdEndDate: A.newAdEndDate || '',
        newEventStart: A.newEventStart || '',
        newEventDescription: A.newEventDescription || '',
        newEventLocation: A.newEventLocation || '',
        newEventAddress: A.newEventAddress || '',
        newEventCity: A.newEventCity || '',
        newEventLink: A.newEventLink || '',
        newReListingStatus: A.newReListingStatus || '',
        newReMls: A.newReMls || '',
        newRePrice: A.newRePrice || '',
        newReFeatures: A.newReFeatures || '',
        newReListingLink: A.newReListingLink || '',
      };

      console.log('[CM ASSIGN]', payload);

      if (CFG.makeAssembly) {
        const qs = new URLSearchParams();
        Object.entries(payload).forEach(([k,v]) => qs.append(k, String(v)));
        return fetch(CFG.makeAssembly + '?' + qs.toString(), { method:'GET', mode:'no-cors' });
      }
      return Promise.resolve();
    });

    Promise.allSettled(promises).then(() => {
      sel.forEach(f => { f.assigned = true; f.selected = false; });
      A = freshA();
      closeModal();
      render();
    });
  }

  // ══════════════════════════════════════════════
  // DATA LOADING (Scenario C)
  // ══════════════════════════════════════════════
  async function loadFiles(status) {
    if (!CFG.scenarioCUrl) {
      LOAD_ERR = 'No Scenario C URL configured in window.TA_CONFIG';
      render();
      return;
    }
    LOADING = true; LOAD_ERR = null; render();
    try {
      const url = `${CFG.scenarioCUrl}?titleSlug=${encodeURIComponent(CFG.titleSlug)}&status=${status}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Scenario C returned ' + res.status);
      const data = await res.json();
      FILES = (Array.isArray(data) ? data : []).map((row, i) => ({
        id: row['0'] || ('f'+i),
        fileId: row['0'] || '',
        name: row['1'] || '(unknown)',
        mime: row['2'] || '',
        size: parseInt(row['3'] || '0', 10) || 0,
        arrived: row['4'] || '',
        status: row['5'] || '',
        uuid: row['6'] || '',
        selected: false,
        elementType: '',
        assigned: false,
      }));
      LOADING = false;
    } catch(err) {
      LOADING = false;
      LOAD_ERR = err.message;
      FILES = [];
    }
    render();
  }

  // ── Init ──
  loadFiles('DONE');
  console.log('\u{1F4C2} Content Manager v2.2.3 mounted');
});
