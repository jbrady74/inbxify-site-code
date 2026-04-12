// ============================================================
// uploads-processor-v1.0.5.js
// INBXIFY Uploads Processor — System 2 UI
// Mounts into #content-manager-mount on T-A page
// Config from window.TA_CONFIG
//
// v1.0.5: RTE INTEGRATION FOR ARTICLE BODY
//         - Article-body element type opens RTE fullscreen
//           before submitting to Make
//         - fetchFileContent() calls Scenario C Route 5
//           to get file HTML from Google Drive
//         - editedHTML flows through payload to Scenario F
//         - Graceful fallback if RTE not loaded or fetch fails
// v1.0.4: MODAL Z-INDEX HARMONIZATION
//         - Assignment modal now appends to document.body
//           (escapes tab stacking context)
//         - Overlay z-index: 10000 (matches Content Library)
//         - Preview lightbox z-index: 10001 (above modal)
//         - Removed static #cm-modal-root from shell HTML
// v1.0.3: CONVERTER TAB
//         - Added Converter as 5th channel tab
//         - JPEG Reducer: drop/browse a JPG, resize to 1400px max,
//           iteratively compress until under 4MB, download result
//         - Entirely client-side — Canvas API, no Make scenario
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
  let CHANNEL   = 'gdrive';  // gdrive | email | form | transcriber | converter
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
  const CHANNELS = [
    { id:'gdrive',      label:'Google Drive' },
    { id:'email',       label:'Email' },
    { id:'form',        label:'Form Submission' },
    { id:'transcriber', label:'Transcriber' },
    { id:'converter',   label:'Converter' },
  ];

  // ── Sub-tabs (under Google Drive — file status) ──
  const TABS = [
    { id:'pdf-queue', label:'PDF Queue',       status:'AWAITING_DECISION', selectable:true  },
    { id:'ready',     label:'Ready to Assign',  status:'DONE',              selectable:true  },
    { id:'assigned',  label:'Assigned',         status:'ASSIGNED',          selectable:false },
    { id:'archived',  label:'Archived',         status:'ARCHIVED',          selectable:false },
    { id:'hidden',    label:'Hidden',           status:'HIDDEN',            selectable:false },
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

  // ── Fetch file content from Google Drive via Scenario C Route 5 ──
  async function fetchFileContent(fileId) {
    if (!CFG.scenarioCUrl) { console.error('[CP] No Scenario C URL for file content fetch'); return null; }
    try {
      const url = CFG.scenarioCUrl + '?' + new URLSearchParams({ titleSlug: CFG.titleSlug, action: 'fetchFileContent', fileId: fileId }).toString();
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetchFileContent returned ' + res.status);
      const data = await res.json();
      return data.content || data.html || '';
    } catch (err) { console.error('[CP] fetchFileContent error:', err); return null; }
  }

  function checkReady(sel) {
    if (!A.collection) return false;
    if (!A.cmsItemId && !A.isNew) return false;
    if (A.isNew) { if (!A.newItemName) return false; if (A.collection==='articles' && !A.newRevenueType) return false; }
    return sel.every(f => f.elementType);
  }
  function getTabCounts() {
    const c = {};
    TABS.forEach(t => {
      c[t.id] = FILES.filter(f => t.id==='ready' ? (f.status==='DONE' && !f.assigned) : t.id==='assigned' ? (f.status==='ASSIGNED' || f.assigned) : f.status===t.status).length;
    });
    return c;
  }

  // ── CSS ──
  const style = document.createElement('style');
  style.textContent = `
#content-manager-mount{font-family:'DM Sans',system-ui,sans-serif;color:#1a3a3a}
.cm-root{padding:16px 0}
.cm-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 0 6px;border-bottom:2px solid #1a3a3a;margin-bottom:8px}
.cm-hdr-left{display:flex;align-items:center;gap:10px}
.cm-hdr-icon{width:30px;height:30px;background:#1a3a3a;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#c4a35a;font-size:14px}
.cm-hdr h3{font-size:16px;font-weight:700;color:#1a3a3a;margin:0}
.cm-hdr-sub{font-size:10px;font-family:'DM Mono',monospace;color:#8a8a7a;letter-spacing:.04em;text-transform:uppercase}
.cm-badge{font-family:'DM Mono',monospace;font-size:9px;padding:3px 8px;background:#1a3a3a;color:#c4a35a;border-radius:2px;letter-spacing:.06em}
.cm-monitor-inline{font-family:'DM Mono',monospace;font-size:9px;color:#8a8a7a;display:flex;align-items:center;gap:3px;margin-right:10px}
.cm-monitor-count{font-weight:600;color:#5a6a5a}
.cm-monitor-count.warn{color:#e8a030}
.cm-monitor-count.alert{color:#c0392b;font-weight:700}
.cm-channels{display:flex;gap:0;margin-bottom:0;border-bottom:2px solid #e8e4d8;align-items:flex-end}
.cm-channel{font-family:'DM Sans',system-ui,sans-serif;font-size:12px;font-weight:600;padding:10px 18px 8px;border:none;background:transparent;color:#8a8a7a;cursor:pointer;transition:all .15s;border-bottom:3px solid transparent;margin-bottom:-2px}
.cm-channel:hover{color:#1a3a3a}
.cm-channel.active{color:#1a3a3a;border-bottom-color:#c4a35a;background:#fdfcf8}
.cm-channel-spacer{flex:1}
.cm-tabs{display:flex;gap:4px;margin-top:10px;margin-bottom:14px;align-items:center;flex-wrap:wrap}
.cm-tab{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.04em;padding:4px 12px;border-radius:4px;border:1.5px solid #e8e4d8;background:#fff;color:#5a6a5a;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:5px}
.cm-tab:hover{border-color:#1a3a3a;color:#1a3a3a}
.cm-tab.active{background:#1a3a3a;color:#fff;border-color:#1a3a3a}
.cm-tab .cm-tab-count{font-size:9px;opacity:.7}
.cm-tab.active .cm-tab-count{opacity:.8}
.cm-tab-spacer{flex:1}
.cm-refresh{font-family:'DM Mono',monospace;font-size:9px;padding:3px 10px;border-radius:2px;border:1.5px solid #e8e4d8;background:#fff;color:#8a8a7a;cursor:pointer;margin-bottom:2px;align-self:center;transition:all .15s}
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
.cm-archive-btn{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:5px 16px;border-radius:3px;border:1.5px solid rgba(240,237,216,0.4);background:transparent;color:#f0edd8;cursor:pointer;transition:all .15s}
.cm-archive-btn:hover{background:rgba(255,255,255,0.15)}
.cm-pdf-btn{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.04em;padding:5px 14px;border-radius:3px;border:1.5px solid rgba(240,237,216,0.4);background:transparent;color:#f0edd8;cursor:pointer;transition:all .15s}
.cm-pdf-btn:hover{background:rgba(255,255,255,0.15)}
.cm-pdf-btn-transcribe{background:rgba(196,163,90,0.3);border-color:#c4a35a}
.cm-pdf-btn-transcribe:hover{background:rgba(196,163,90,0.5)}
.cm-transcribe-notice{padding:12px 14px;background:#fdfcf8;border:1.5px solid #c4a35a;border-radius:4px;margin-bottom:12px}
.cm-transcribe-notice-hdr{font-family:'DM Mono',monospace;font-size:11px;font-weight:600;color:#1a3a3a;margin-bottom:8px}
.cm-transcribe-notice-files{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.cm-transcribe-file{font-family:'DM Mono',monospace;font-size:10px;padding:3px 8px;background:#fff;border:1px solid #e8e4d8;border-radius:2px;color:#5a6a5a}
.cm-transcribe-notice-dismiss{font-family:'DM Mono',monospace;font-size:9px;color:#8a8a7a;background:none;border:none;cursor:pointer;text-decoration:underline}
.cm-transcribe-notice-dismiss:hover{color:#1a3a3a}
.cm-placeholder{text-align:center;padding:60px 20px;color:#8a8a7a}
.cm-placeholder-icon{font-size:36px;opacity:.3;margin-bottom:12px}
.cm-placeholder-title{font-size:13px;font-weight:600;color:#5a6a5a;margin-bottom:6px}
.cm-placeholder-text{font-size:11px;font-family:'DM Mono',monospace;color:#a0a090;max-width:400px;margin:0 auto}
#screenshot-transcriber-mount .sct-hdr{display:none}
#screenshot-transcriber-mount .sct-root{padding:0;max-width:none;width:100%}
#screenshot-transcriber-mount .sct-card{max-width:none;width:100%}
#screenshot-transcriber-mount .sct-steps{max-width:none;width:100%}
#screenshot-transcriber-mount .sct-paste-zone{max-width:none;width:100%}
#screenshot-transcriber-mount .sct-tx-btn{max-width:none;width:100%}
#screenshot-transcriber-mount .sct-results{max-width:none;width:100%}
.cm-flist{display:flex;flex-direction:column;gap:2px}
.cm-frow{background:#fff;border:1.5px solid #e8e4d8;border-radius:4px;transition:border-color .15s}
.cm-frow.sel{border-color:#c4a35a;background:#fdfcf8}
.cm-frow.assigned{opacity:.65;background:#f4fbf4;border-color:#d4eed4}
.cm-frow-main{display:grid;grid-template-columns:28px 30px 1fr auto;align-items:center;padding:7px 10px;cursor:pointer}
.cm-frow-main.no-select{grid-template-columns:30px 1fr auto;cursor:default}
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
.cm-fbadge.archived{background:#f5f0e0;color:#8b7d3c}
.cm-fbadge.hidden{background:#f5f5f5;color:#8a8a7a}
.cm-empty{text-align:center;padding:40px;color:#8a8a7a}
.cm-empty-icon{font-size:28px;opacity:.35;margin-bottom:8px}
.cm-empty-text{font-size:11px;font-family:'DM Mono',monospace}
.cm-overlay{position:fixed;inset:0;background:rgba(26,58,58,0.7);z-index:10000;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}
.cm-modal{background:#fff;border-radius:8px;width:100%;max-width:760px;box-shadow:0 20px 60px rgba(0,0,0,0.3)}
.cm-modal-bar{height:4px;background:linear-gradient(90deg,#1a3a3a,#c4a35a);border-radius:8px 8px 0 0}
.cm-modal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 12px;border-bottom:1px solid #f0ede4}
.cm-modal-title{font-size:15px;font-weight:700;color:#1a3a3a}
.cm-modal-sub{font-size:10px;font-family:'DM Mono',monospace;color:#8a8a7a;text-transform:uppercase;letter-spacing:.04em;margin-top:2px}
.cm-modal-close{width:28px;height:28px;border-radius:50%;border:1.5px solid #e8e4d8;background:#fff;cursor:pointer;font-size:14px;color:#8a8a7a;transition:all .15s;flex-shrink:0;display:flex;align-items:center;justify-content:center}
.cm-modal-close:hover{border-color:#c0392b;color:#c0392b}
.cm-modal-files{padding:10px 20px;background:#faf9f5;border-bottom:1px solid #f0ede4;display:flex;flex-wrap:wrap;gap:6px}
.cm-modal-file-chip{font-family:'DM Mono',monospace;font-size:9px;padding:3px 8px;background:#fff;border:1px solid #e8e4d8;border-radius:2px;color:#5a6a5a;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cm-modal-body{padding:20px;position:relative}
.cm-modal-footer{padding:12px 20px 16px;border-top:1px solid #f0ede4;display:flex;align-items:center;justify-content:space-between}
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
.cm-choices select.cm-fsel{display:none!important}
.cm-choices{position:relative}
.cm-breadcrumb{display:flex;align-items:center;gap:5px;padding:4px 0 10px;font-family:'DM Mono',monospace;font-size:9px;color:#a0a090}
.cm-bc-icon{font-size:11px;opacity:.5}
.cm-bc-link{color:#8a8a7a;text-decoration:none;letter-spacing:.03em;transition:color .15s}
.cm-bc-link:hover{color:#1a3a3a;text-decoration:underline}
.cm-bc-arrow{font-size:8px;opacity:.4}
.cm-bc-filter{color:#a0a090;font-style:italic;letter-spacing:.02em}
.cm-preview-btn{font-size:14px;background:none;border:1px solid #e8e4d8;border-radius:3px;cursor:pointer;padding:2px 6px;color:#8a8a7a;transition:all .15s;line-height:1}
.cm-preview-btn:hover{border-color:#1a3a3a;color:#1a3a3a;background:#faf9f5}
.cm-preview-overlay{position:fixed;inset:0;background:rgba(26,58,58,0.8);z-index:10001;display:flex;align-items:center;justify-content:center;padding:30px}
.cm-preview-panel{background:#fff;border-radius:8px;width:90vw;max-width:900px;height:85vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.4);overflow:hidden}
.cm-preview-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e8e4d8;flex-shrink:0}
.cm-preview-title{font-family:'DM Mono',monospace;font-size:11px;color:#1a3a3a;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.cm-preview-close{width:28px;height:28px;border-radius:50%;border:1.5px solid #e8e4d8;background:#fff;cursor:pointer;font-size:14px;color:#8a8a7a;display:flex;align-items:center;justify-content:center;transition:all .15s}
.cm-preview-close:hover{border-color:#c0392b;color:#c0392b}
.cm-preview-body{flex:1;overflow:hidden}
.cm-preview-iframe{width:100%;height:100%;border:none}
/* ── Converter panel ── */
.cm-conv{padding:16px 0}
.cm-conv-title{font-size:14px;font-weight:700;color:#1a3a3a;margin-bottom:4px}
.cm-conv-sub{font-size:10px;font-family:'DM Mono',monospace;color:#8a8a7a;text-transform:uppercase;letter-spacing:.04em;margin-bottom:16px}
.cm-conv-tools{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.cm-conv-tool{padding:10px 14px;background:#fff;border:1.5px solid #e8e4d8;border-radius:4px;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:8px;min-width:200px}
.cm-conv-tool:hover{border-color:#c4a35a}
.cm-conv-tool.active{border-color:#1a3a3a;background:#fdfcf8;box-shadow:0 0 0 2px rgba(26,58,58,.06)}
.cm-conv-tool-icon{font-size:20px}
.cm-conv-tool-label{font-size:12px;font-weight:600;color:#1a3a3a}
.cm-conv-tool-desc{font-size:9px;font-family:'DM Mono',monospace;color:#8a8a7a}
.cm-conv-workspace{background:#fff;border:1.5px solid #e8e4d8;border-radius:6px;padding:20px;min-height:200px}
.cm-conv-drop{width:100%;min-height:160px;border:2px dashed #ddd9c8;border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:border-color .2s;background:#faf9f5}
.cm-conv-drop:hover,.cm-conv-drop.drag-over{border-color:#c4a35a;background:#fdfcf8}
.cm-conv-drop-icon{font-size:28px;opacity:.3}
.cm-conv-drop-text{font-size:12px;color:#5a6a5a}
.cm-conv-drop-hint{font-size:9px;font-family:'DM Mono',monospace;color:#a0a090}
.cm-conv-preview{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
.cm-conv-thumb{max-width:200px;max-height:200px;border-radius:4px;border:1px solid #e8e4d8}
.cm-conv-info{flex:1;min-width:200px}
.cm-conv-info-row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0ede4;font-size:11px}
.cm-conv-info-label{font-family:'DM Mono',monospace;font-size:9px;color:#8a8a7a;text-transform:uppercase;letter-spacing:.06em}
.cm-conv-info-val{font-weight:600;color:#1a3a3a}
.cm-conv-info-val.ok{color:#27ae60}
.cm-conv-info-val.bad{color:#c0392b}
.cm-conv-actions{display:flex;gap:8px;margin-top:14px;align-items:center}
.cm-conv-go{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:7px 18px;border-radius:3px;border:none;background:#1a3a3a;color:#f0edd8;cursor:pointer;transition:all .15s}
.cm-conv-go:hover:not(:disabled){background:#244a4a}
.cm-conv-go:disabled{opacity:.35;cursor:not-allowed}
.cm-conv-go.download{background:#c4a35a;color:#1a3a3a;font-weight:700}
.cm-conv-go.download:hover{background:#f4a127}
.cm-conv-status{font-family:'DM Mono',monospace;font-size:10px;color:#5a6a5a}
.cm-conv-progress{width:100%;height:4px;background:#e8e4d8;border-radius:2px;margin-top:8px;overflow:hidden}
.cm-conv-progress-bar{height:100%;background:linear-gradient(90deg,#1a3a3a,#c4a35a);border-radius:2px;transition:width .3s}
.cm-conv-result{margin-top:14px;padding:12px;background:#f4fbf4;border:1px solid #d4eed4;border-radius:4px}
.cm-conv-result-title{font-family:'DM Mono',monospace;font-size:10px;color:#27ae60;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
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
      <div><h3>Uploads Processor</h3><div class="cm-hdr-sub">Select files \u2192 Assign to CMS records</div></div>
    </div>
    <span class="cm-badge">v1.0.5</span>
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
  <div id="cm-converter-panel" style="display:none"></div>
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
    const convEl   = document.getElementById('cm-converter-panel');

    gdriveEl.style.display = CHANNEL === 'gdrive' ? '' : 'none';
    emailEl.style.display  = CHANNEL === 'email' ? '' : 'none';
    formEl.style.display   = CHANNEL === 'form' ? '' : 'none';
    if (transEl) transEl.style.display = CHANNEL === 'transcriber' ? '' : 'none';
    if (convEl) convEl.style.display = CHANNEL === 'converter' ? '' : 'none';

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
    } else if (CHANNEL === 'converter') {
      renderConverter();
    }
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
      const countHtml = `<span class="cm-tab-count">${c[t.id]}</span>`;
      h += `<button class="cm-tab ${isActive?'active':''}" data-cm-tab="${t.id}">${esc(t.label)}${countHtml}</button>`;
    });
    h += `<span class="cm-tab-spacer"></span>`;
    const u = MONITOR.uploadFolder, p = MONITOR.preprocessing;
    const uCls = u > 5 ? 'cm-monitor-count alert' : u > 0 ? 'cm-monitor-count warn' : 'cm-monitor-count';
    const pCls = p > 5 ? 'cm-monitor-count alert' : p > 0 ? 'cm-monitor-count warn' : 'cm-monitor-count';
    h += `<span class="cm-monitor-inline">Upload: <span class="${uCls}">${u}</span></span>`;
    h += `<span class="cm-monitor-inline">Pre-processing: <span class="${pCls}">${p}</span></span>`;
    h += `<button class="cm-refresh" data-cm-refresh>\u21BB Refresh</button>`;
    document.getElementById('cm-tabs').innerHTML = h;
  }

  function renderBreadcrumb() {
    const el = document.getElementById('cm-breadcrumb');
    if (!el) return;
    const folders = {
      'pdf-queue':  { label:'Pre-processing Folder',      id:window.TA_CONFIG?.workingFolderId||'',   filter:'status = AWAITING_DECISION' },
      'ready':      { label:'Ready for Assignment Folder', id:window.TA_CONFIG?.processedFolderId||'', filter:'status = DONE' },
      'assigned':   { label:'Ready for Assignment Folder', id:window.TA_CONFIG?.processedFolderId||'', filter:'status = ASSIGNED' },
      'archived':   { label:'Ready for Assignment Folder', id:window.TA_CONFIG?.processedFolderId||'', filter:'status = ARCHIVED' },
      'hidden':     { label:'Pre-processing Folder',      id:window.TA_CONFIG?.workingFolderId||'',   filter:'status = HIDDEN' },
    };
    const folder = folders[TAB];
    if (!folder || !folder.id) { el.innerHTML = ''; return; }
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
      el.innerHTML = `<div class="cm-sel-bar"><span class="cm-sel-count">${sel.length} PDF${sel.length>1?'s':''} selected</span><div class="cm-sel-spacer"></div><button class="cm-desel" data-cm-desel>\u2715 clear</button><button class="cm-desel" data-cm-hide-sel>\u{1F6AB} hide</button><button class="cm-archive-btn" data-cm-archive-sel>\u{1F4E6} Archive</button><button class="cm-pdf-btn" data-cm-pdf-jpeg>\u{1F5BC}\uFE0F Convert to JPEG</button><button class="cm-pdf-btn cm-pdf-btn-transcribe" data-cm-pdf-transcribe>\u{1F4DD} Transcribe &amp; Summarize</button></div>`;
    } else {
      el.innerHTML = `<div class="cm-sel-bar"><span class="cm-sel-count">${sel.length} file${sel.length>1?'s':''} selected</span><div class="cm-sel-spacer"></div><button class="cm-desel" data-cm-desel>\u2715 clear</button><button class="cm-desel" data-cm-hide-sel>\u{1F6AB} hide</button><button class="cm-archive-btn" data-cm-archive-sel>\u{1F4E6} Archive</button><button class="cm-assign-btn" data-cm-open-modal>Assign ${sel.length} File${sel.length>1?'s':''} \u2192</button></div>`;
    }
  }

  function renderFileList() {
    const el = document.getElementById('cm-flist');
    if (LOADING) { el.innerHTML = `<div class="cm-loading"><div class="cm-loading-spin">\u27F3</div><div>Loading files\u2026</div></div>`; return; }
    const tab = TABS.find(t => t.id === TAB);
    let vis = FILES;
    if (TAB==='ready')     vis = FILES.filter(f => f.status==='DONE' && !f.assigned);
    if (TAB==='assigned')  vis = FILES.filter(f => f.status==='ASSIGNED' || f.assigned);
    if (TAB==='pdf-queue') vis = FILES.filter(f => f.status==='AWAITING_DECISION');
    if (TAB==='archived')  vis = FILES.filter(f => f.status==='ARCHIVED');
    if (TAB==='hidden')    vis = FILES.filter(f => f.status==='HIDDEN');
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
      const isPdf = f.status==='AWAITING_DECISION';
      const badge = isAssigned?'assigned':isArchived?'archived':isHidden?'hidden':isPdf?'decision':'ready';
      const label = isAssigned?'Assigned':isArchived?'Archived':isHidden?'Hidden':isPdf?'PDF Queue':'Ready';
      const uc = f.uuid ? `<span style="color:#1a3a3a">UC:${f.uuid.substring(0,8)}\u2026</span>` : '';
      const disabled = isAssigned || isArchived || isHidden || (isPdf && TAB !== 'pdf-queue');
      if (tab && tab.selectable && !disabled) {
        const previewBtn = f.fileId ? `<button class="cm-preview-btn" data-cm-preview="${esc(f.fileId)}" title="Preview">\u{1F441}</button>` : '';
        return `<div class="cm-frow ${f.selected?'sel':''}" data-cm-fid="${f.id}"><div class="cm-frow-main"><input type="checkbox" class="cm-fcheck" ${f.selected?'checked':''}><span class="cm-ficon">${icon}</span><div class="cm-finfo"><div class="cm-fname">${esc(f.name)}</div><div class="cm-fmeta">${f.size?`<span>${fmtSize(f.size)}</span>`:''} ${f.arrived?`<span>${f.arrived.substring(0,10)}</span>`:''} ${uc}</div></div><div class="cm-fright">${previewBtn}<span class="cm-fbadge ${badge}">${label}</span></div></div></div>`;
      }
      const previewBtnRO = f.fileId ? `<button class="cm-preview-btn" data-cm-preview="${esc(f.fileId)}" title="Preview">\u{1F441}</button>` : '';
      return `<div class="cm-frow ${isAssigned?'assigned':''}"><div class="cm-frow-main no-select"><span class="cm-ficon">${icon}</span><div class="cm-finfo"><div class="cm-fname">${esc(f.name)}</div><div class="cm-fmeta">${f.size?`<span>${fmtSize(f.size)}</span>`:''} ${f.arrived?`<span>${f.arrived.substring(0,10)}</span>`:''} ${uc}</div></div><div class="cm-fright">${previewBtnRO}<span class="cm-fbadge ${badge}">${label}</span></div></div></div>`;
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
  function renderConverter() {
    const el = document.getElementById('cm-converter-panel');
    if (!el) return;
    if (el.dataset.mounted === 'true') return;
    el.dataset.mounted = 'true';

    el.innerHTML = `<div class="cm-conv">
      <div class="cm-conv-title">File Converter</div>
      <div class="cm-conv-sub">Select a conversion tool</div>
      <div class="cm-conv-tools">
        <div class="cm-conv-tool active"><span class="cm-conv-tool-icon">\u{1F5BC}\uFE0F</span><div><div class="cm-conv-tool-label">Reduce JPEG to Under 4MB</div><div class="cm-conv-tool-desc">Resize to 1400px wide + compress</div></div></div>
      </div>
      <div class="cm-conv-workspace" id="cm-conv-ws">
        <div class="cm-conv-drop" id="cm-conv-drop"><div class="cm-conv-drop-icon">\u{1F5BC}\uFE0F</div><div class="cm-conv-drop-text">Drop a JPEG here or click to browse</div><div class="cm-conv-drop-hint">Accepts .jpg / .jpeg files</div></div>
        <input type="file" id="cm-conv-file" accept="image/jpeg,image/jpg" style="display:none">
      </div>
    </div>`;

    const dropZone = document.getElementById('cm-conv-drop');
    const fileInput = document.getElementById('cm-conv-file');
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); const f=e.dataTransfer.files[0]; if(f&&(f.type==='image/jpeg'||f.type==='image/jpg')) convLoadFile(f); });
    fileInput.addEventListener('change', () => { if(fileInput.files[0]) convLoadFile(fileInput.files[0]); fileInput.value=''; });

    let convFile = null;

    function convLoadFile(file) {
      convFile = file;
      const ws = document.getElementById('cm-conv-ws');
      const sizeMB = (file.size/1e6).toFixed(2);
      const isOver = file.size > 4e6;
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          ws.innerHTML = `<div class="cm-conv-preview"><img src="${ev.target.result}" class="cm-conv-thumb" alt="Preview"><div class="cm-conv-info"><div class="cm-conv-info-row"><span class="cm-conv-info-label">Filename</span><span class="cm-conv-info-val">${esc(file.name)}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Original Size</span><span class="cm-conv-info-val ${isOver?'bad':'ok'}">${sizeMB} MB${isOver?' \u2014 over 4MB':' \u2014 under 4MB'}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Dimensions</span><span class="cm-conv-info-val">${img.width} \u00D7 ${img.height}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Target</span><span class="cm-conv-info-val">Under 4MB, max 1400px wide</span></div><div class="cm-conv-actions"><button class="cm-conv-go" id="cm-conv-go">${isOver?'Reduce Now':'Reduce Anyway'}</button><button class="cm-conv-go" id="cm-conv-reset" style="background:transparent;color:#c0392b;border:1px solid #e8e4d8">\u2715 Clear</button><span class="cm-conv-status" id="cm-conv-status"></span></div><div class="cm-conv-progress" id="cm-conv-progress" style="display:none"><div class="cm-conv-progress-bar" id="cm-conv-bar" style="width:0%"></div></div><div id="cm-conv-result"></div></div></div>`;
          document.getElementById('cm-conv-go').addEventListener('click', () => convProcess(img, file.name));
          document.getElementById('cm-conv-reset').addEventListener('click', () => convReset());
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }

    function convProcess(img, filename) {
      const statusEl=document.getElementById('cm-conv-status'), progEl=document.getElementById('cm-conv-progress'), barEl=document.getElementById('cm-conv-bar'), goBtn=document.getElementById('cm-conv-go'), resultEl=document.getElementById('cm-conv-result');
      goBtn.disabled=true; progEl.style.display=''; statusEl.textContent='Processing\u2026';
      const MAX_W=1400; let w=img.width,h=img.height;
      if(w>MAX_W){const ratio=MAX_W/w;w=MAX_W;h=Math.round(img.height*ratio);}
      const canvas=document.createElement('canvas'); canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h); barEl.style.width='30%';
      let quality=0.92; const TARGET=4*1024*1024;
      function tryCompress(){
        statusEl.textContent='Compressing at '+Math.round(quality*100)+'% quality\u2026';
        barEl.style.width=(30+(0.92-quality)/0.52*60)+'%';
        canvas.toBlob(b=>{
          if(!b){statusEl.textContent='Compression failed';goBtn.disabled=false;return;}
          if(b.size<=TARGET||quality<=0.40){
            barEl.style.width='100%';
            const newSizeMB=(b.size/1e6).toFixed(2), savings=convFile?Math.round((1-b.size/convFile.size)*100):0;
            statusEl.textContent='';
            const newName=filename.replace(/\.(jpe?g)$/i,'-reduced.$1');
            resultEl.innerHTML=`<div class="cm-conv-result"><div class="cm-conv-result-title">\u2705 Conversion Complete</div><div class="cm-conv-info-row"><span class="cm-conv-info-label">New Size</span><span class="cm-conv-info-val ok">${newSizeMB} MB</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">New Dimensions</span><span class="cm-conv-info-val">${w} \u00D7 ${h}</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Quality</span><span class="cm-conv-info-val">${Math.round(quality*100)}%</span></div><div class="cm-conv-info-row"><span class="cm-conv-info-label">Savings</span><span class="cm-conv-info-val ok">${savings}% smaller</span></div><div class="cm-conv-actions" style="margin-top:10px"><button class="cm-conv-go download" id="cm-conv-download">\u2B07 Download ${esc(newName)}</button></div></div>`;
            document.getElementById('cm-conv-download').addEventListener('click',()=>{const url=URL.createObjectURL(b);const a=document.createElement('a');a.href=url;a.download=newName;a.click();URL.revokeObjectURL(url);});
            return;
          }
          quality-=0.05; setTimeout(tryCompress,50);
        },'image/jpeg',quality);
      }
      setTimeout(tryCompress,100);
    }

    function convReset(){
      convFile=null;
      const el2=document.getElementById('cm-converter-panel');
      if(el2) el2.dataset.mounted='';
      renderConverter();
    }
  }

  function getSelected() {
    if (TAB === 'pdf-queue') return FILES.filter(f => f.selected && f.status==='AWAITING_DECISION');
    return FILES.filter(f => f.selected && !f.assigned && f.status!=='ASSIGNED' && f.status!=='ARCHIVED' && f.status!=='HIDDEN');
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
    FILES.forEach(x => { x.selected = false; x.elementType = ''; });
    A = freshA();
    if (id === 'gdrive') TAB = 'ready';
    if (id !== 'transcriber') TRANSCRIBE_PDFS = [];
    render();
  }
  function setTab(id) {
    TAB = id;
    FILES.forEach(x => { x.selected = false; x.elementType = ''; });
    A = freshA();
    render();
  }
  function reload() { loadFiles(); loadFolderCounts(); }
  function toggleSel(id) {
    const f = FILES.find(x => x.id === id);
    if (!f || f.assigned || f.status==='ASSIGNED' || f.status==='ARCHIVED') return;
    if (f.status==='AWAITING_DECISION' && TAB !== 'pdf-queue') return;
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
    Promise.all(promises).then(() => render());
  }

  function processPdfs(action) {
    const sel = getSelected();
    if (!sel.length || !CFG.makeConditioner) { if(!CFG.makeConditioner) console.error('[CP] No makeConditioner URL'); return; }
    sel.forEach(f => { f.selected=false; f._processing=true; }); render();
    const promises = sel.map(f =>
      fetch(CFG.makeConditioner, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({titleSlug:CFG.titleSlug,fileId:f.fileId,fileName:f.name,mimeType:f.mime,action}) })
      .then(res=>{if(!res.ok) throw new Error(res.status+' for '+f.name);f.status='DONE';delete f._processing;console.log('[CP] PDF processed:',f.name);})
      .catch(err=>{console.error('[CP] PDF error:',f.name,err);delete f._processing;})
    );
    Promise.all(promises).then(() => render());
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
    lightbox.innerHTML = `<div class="cm-preview-panel"><div class="cm-preview-header"><span class="cm-preview-title">File Preview</span><button class="cm-preview-close" id="cm-preview-close">\u2715</button></div><div class="cm-preview-body"><iframe src="https://drive.google.com/file/d/${fileId}/preview" class="cm-preview-iframe" allowfullscreen></iframe></div></div>`;
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
    let h = `<div class="cm-overlay" data-cm-overlay><div class="cm-modal"><div class="cm-modal-bar"></div><div class="cm-modal-head"><div><div class="cm-modal-title">Assign ${sel.length} File${sel.length>1?'s':''}</div><div class="cm-modal-sub">Complete all steps \u00B7 tag each file individually</div></div><button class="cm-modal-close" data-cm-close>\u2715</button></div><div class="cm-modal-files">${sel.map(f=>`<span class="cm-modal-file-chip">${FILE_ICONS[f.mime]||'\u{1F4C4}'} ${esc(f.name)}</span>`).join('')}</div><div class="cm-modal-body"><div class="cm-steps"><span class="${stepCls(s1,!s1)}">1 Collection</span><span class="cm-step-arr">\u2192</span><span class="${stepCls(s2&&!!A.customerId,s1&&!A.customerId)}">2 Customer</span><span class="cm-step-arr">\u2192</span><span class="${stepCls(s3,s2&&!s3)}">3 Item</span><span class="cm-step-arr">\u2192</span><span class="${stepCls(s4,s3&&!s4)}">4 Tag</span></div>`;
    h += `<div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Select Asset Type <span class="req">*</span></label><select class="cm-fsel${chg(col)}" data-cm-field="collection"><option value="">Select Type\u2026</option>${COLLECTIONS.map(c=>`<option value="${c.id}"${c.id===col?' selected':''}>${esc(c.label)}</option>`).join('')}</select></div></div>`;
    if (s1) {
      h += `<div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Customer</label><select class="cm-fsel${chg(A.customerId)}" data-cm-field="customerId" id="cm-sel-cust"><option value="">Any / None</option><option value="__none__">\u2014 No Customer / Unsponsored</option>${readCustomers().map(c=>`<option value="${c.id}"${c.id===A.customerId?' selected':''}>${esc(c.name)}</option>`).join('')}<option value="__new__">+ New Customer</option></select></div></div>`;
      if (A.nestedOpen) h += `<div class="cm-nested"><div class="cm-nested-hdr"><span>+ New Customer</span><button class="cm-nested-close" data-cm-nested-close>\u2715 cancel</button></div><div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Business Name <span class="req">*</span></label><input class="cm-finp${chg(A.nestedName)}" data-cm-field="nestedName" type="text" value="${esc(A.nestedName)}" placeholder="Business name\u2026"></div></div><div style="text-align:right;margin-top:4px"><button class="cm-sub-btn" data-cm-create-cust${A.nestedName?'':' disabled'}>Create Customer</button></div></div>`;
      if (A.isNew) {
        h += buildNewItemFormHTML(col);
        h += `<div style="margin-bottom:8px"><button class="cm-link-btn" data-cm-back-existing>\u2190 back to existing</button></div>`;
      } else {
        const items = getCMSItems(col, A.customerId);
        h += `<div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Select ${colLabel(col)} <span class="req">*</span></label><select class="cm-fsel${chg(A.cmsItemId)}" data-cm-field="cmsItemId" id="cm-sel-item"><option value="">Select ${colLabel(col)}\u2026</option>${items.map(i=>`<option value="${i.id}"${i.id===A.cmsItemId?' selected':''}>${esc(i.name)}</option>`).join('')}</select></div></div>`;
        if (!items.length) h += `<div class="cm-no-results"><span>No ${colLabel(col)}s found${A.customerId&&A.customerId!=='__none__'?' for this customer':''}</span><button data-cm-new-item>+ Create New</button></div>`;
        else h += `<div style="margin-bottom:8px"><button class="cm-link-btn" data-cm-new-item>+ or create new ${colLabel(col)}</button></div>`;
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
    h += `<div class="cm-modal-footer"><button class="cm-cancel" data-cm-reset>\u2715 reset</button><div class="cm-sub-right"><span class="cm-sub-info">${tagged}/${sel.length} tagged${ok?' \u2014 ready':''}</span><button class="cm-sub-btn" data-cm-submit${ok?'':' disabled'}>Assign ${sel.length} File${sel.length>1?'s':''} \u2713</button></div></div></div></div>`;
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
  // SUBMIT (with RTE integration for article-body)
  // ══════════════════════════════════════════════
  function submitAssignment() {
    const sel=getSelected(); if(!checkReady(sel)) return;

    // Check if any file is tagged as article-body AND RTE is available
    const bodyFile = sel.find(f => f.elementType === 'article-body');
    if (bodyFile && window.InbxRTE) {
      openRTEForBody(bodyFile, sel);
      return;
    }

    // No article-body or no RTE — submit normally
    doSubmit(sel);
  }

  async function openRTEForBody(bodyFile, allSelected) {
    // Show loading state on submit button
    const submitBtn = document.querySelector('[data-cm-submit]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Loading body\u2026'; }

    // Fetch the file content from Google Drive via Scenario C
    const html = await fetchFileContent(bodyFile.fileId);

    if (html === null) {
      // Fetch failed — fall back to direct submit (Make handles the download)
      console.warn('[CP] Could not fetch file content — submitting without RTE edit');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Assign ' + allSelected.length + ' File' + (allSelected.length > 1 ? 's' : '') + ' \u2713'; }
      doSubmit(allSelected);
      return;
    }

    // Close the assignment modal
    closeModal();

    // Build article context for RTE header
    const articleTitle = A.isNew ? A.newItemName : (function() {
      const items = getCMSItems(A.collection, A.customerId);
      const item = items.find(i => i.id === A.cmsItemId);
      return item ? item.name : '';
    })();

    // Preserve assignment state for after RTE save
    const savedA = JSON.parse(JSON.stringify(A));
    const savedSel = allSelected.map(f => f.id);

    // Open RTE fullscreen
    window._cpRteInstance = InbxRTE.openFullscreen({
      articleItemId: A.cmsItemId || '',
      articleTitle: articleTitle,
      initialHTML: html,
      mode: 'edit',
      webhookUrl: null,
      onSave: function(editedHTML) {
        // Restore assignment state
        A = savedA;
        // Attach edited HTML to the body file
        const bf = FILES.find(f => f.id === bodyFile.id);
        if (bf) bf._editedHTML = editedHTML;
        // Re-select the original files
        FILES.forEach(f => { f.selected = savedSel.includes(f.id); });
        // Submit everything
        doSubmit(getSelected());
        window._cpRteInstance = null;
      },
      onClose: function() {
        // User cancelled — restore state and re-open assignment modal
        A = savedA;
        FILES.forEach(f => { f.selected = savedSel.includes(f.id); });
        window._cpRteInstance = null;
        openModal();
      }
    });
  }

  function doSubmit(sel) {
    const payload={titleSlug:CFG.titleSlug,taItemId:CFG.taItemId,collection:A.collection,customerId:A.customerId==='__none__'?'':A.customerId,cmsItemId:A.cmsItemId||'',isNew:A.isNew,newItemName:A.newItemName||'',newProductType:A.newProductType||'',newMajorNlSection:A.newMajorNlSection||'',newRevenueType:A.newRevenueType||'',newSubTitle:A.newSubTitle||'',newWriterName:A.newWriterName||'',newWriterTitle:A.newWriterTitle||'',newCoWriterName:A.newCoWriterName||'',newCoWriterTitle:A.newCoWriterTitle||'',newPhotoCredits:A.newPhotoCredits||false,newPhotographer:A.newPhotographer||'',newPhotoEssay:A.newPhotoEssay||false,newVideoArticle:A.newVideoArticle||false,newVideoUrl:A.newVideoUrl||'',newAudioUrl:A.newAudioUrl||'',newBannerStatement:A.newBannerStatement||'',newAdClickUrl:A.newAdClickUrl||'',newAdStartDate:A.newAdStartDate||'',newAdEndDate:A.newAdEndDate||'',newEventStart:A.newEventStart||'',newEventDescription:A.newEventDescription||'',newEventLocation:A.newEventLocation||'',newEventAddress:A.newEventAddress||'',newEventCity:A.newEventCity||'',newEventLink:A.newEventLink||'',newReListingStatus:A.newReListingStatus||'',newReMls:A.newReMls||'',newRePrice:A.newRePrice||'',newReFeatures:A.newReFeatures||'',newReListingLink:A.newReListingLink||'',files:sel.map(f=>({fileId:f.fileId,fileName:f.name,uploadcareUuid:f.uuid,mimeType:f.mime,elementType:f.elementType,editedHTML:f._editedHTML||''}))};
    console.log('[CP ASSIGN]',payload);
    const done=()=>{sel.forEach(f=>{f.assigned=true;f.selected=false;delete f._editedHTML;});A=freshA();closeModal();render();};
    if(CFG.makeAssembly){fetch(CFG.makeAssembly,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(done).catch(err=>{console.error('[CP] Submit error:',err);done();});}else{done();}
  }

  // ══════════════════════════════════════════════
  // DATA LOADING
  // ══════════════════════════════════════════════
  async function loadFiles(status) {
    if(!CFG.scenarioCUrl){LOAD_ERR='No Scenario C URL configured in window.TA_CONFIG';render();return;}
    LOADING=true;LOAD_ERR=null;render();
    try{
      let url=`${CFG.scenarioCUrl}?titleSlug=${encodeURIComponent(CFG.titleSlug)}`;
      if(status) url+=`&status=${status}`;
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
  loadFiles();
  loadFolderCounts();
  console.log('\u{1F4C2} Uploads Processor v1.0.5 mounted');
});
