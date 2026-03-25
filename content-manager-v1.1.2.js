// content-manager-v1.1.2.js
// INBXIFY Content Manager — System 2 UI
// v1.1.1: surgical DOM updates — modal built once, updated in place
//         no full rebuilds on field interactions = no flash
//         article list filters by product type + customer

document.addEventListener('DOMContentLoaded', function () {
  const mount = document.getElementById('content-manager-mount');
  if (!mount) return;

  const CFG = {
    get scenarioCUrl() { return window.TA_CONFIG?.scenarioC || 'https://hook.us1.make.com/yg88sqpzwp5nyxiipoqgqcsipqplrfgk'; },
    get makeAssembly() { return window.TA_CONFIG?.makeAssembly || ''; },
    get titleSlug()    { return window.TA_CONFIG?.titleSlug  || 'wyckoff-living-now'; },
    get taItemId()     { return window.TA_CONFIG?.taItemId   || ''; },
  };

  let FILES     = [];
  let FILTER    = 'ready';
  let LOADING   = false;
  let LOAD_ERR  = null;
  let MODAL_OPEN = false;
  let MODAL_BUILT = false; // track if modal DOM exists

  let A = {
    productType: '', customerId: '', cmsItemId: '',
    isNew: false, newItemName: '', nestedOpen: false, nestedName: '',
    newRevenueType: '', newSubTitle: '', newWriterName: '', newWriterTitle: '',
    newCoWriterName: '', newCoWriterTitle: '', newPhotoCredits: false,
    newPhotographer: '', newPhotoEssay: false, newVideoArticle: false,
    newVideoUrl: '', newAudioUrl: '', newBannerStatement: '', newExtrasOpen: false,
    newAdClickUrl: '', newAdStartDate: '', newAdEndDate: '',
    newEventStart: '', newEventDescription: '', newEventLocation: '',
    newEventAddress: '', newEventCity: '', newEventLink: '',
    newReListingStatus: '', newReMls: '', newReAddress: '',
    newRePrice: '', newReFeatures: '', newReListingLink: '',
  };

  function resetA() {
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
  }

  // ── Product types from MNLS DOM ──
  const COLLECTION_MAP = {
    'feature article':      { collection:'articles', reqCust:true,  group:'Articles' },
    'themed spotlight':     { collection:'articles', reqCust:true,  group:'Articles' },
    'banner ads':           { collection:'ads',      reqCust:true,  group:'Ads' },
    'sidebar ads':          { collection:'ads',      reqCust:true,  group:'Ads' },
    'the find':             { collection:'ads',      reqCust:true,  group:'Ads' },
    'events calendar':      { collection:'events',   reqCust:false, group:'Other' },
    'real estate listings': { collection:'re',       reqCust:false, group:'Other' },
  };

  const PRODUCT_TYPES = Array.from(document.querySelectorAll('[data-mlns="true"]')).map(el => {
    const label = (el.getAttribute('data-name') || '').trim();
    const id    = el.getAttribute('data-id') || '';
    const group = (el.getAttribute('data-group') || '').trim().toLowerCase();
    const meta  = COLLECTION_MAP[group] || COLLECTION_MAP[label.toLowerCase()] || { collection:'articles', reqCust:false, group:'Other' };
    return { id, label, ...meta };
  }).filter(p => p.id && p.label);

  if (!PRODUCT_TYPES.length) console.warn('[CM] No MNLS items found via [data-mlns="true"]');

  const CUSTOMERS = Array.from(document.querySelectorAll('[data-customers-wrapper] [data-item]')).map(el => ({
    id: el.getAttribute('data-id') || '', name: el.getAttribute('data-name') || '',
  })).filter(c => c.id);

  const ARTICLES = Array.from(document.querySelectorAll('[data-articles-wrapper] [data-item]')).map(el => ({
    id: el.getAttribute('data-article-id') || el.getAttribute('data-id') || '',
    name: el.getAttribute('data-article-title') || el.getAttribute('data-name') || '',
    customerId: el.getAttribute('data-article-customer-id') || '',
    productTypeId: el.getAttribute('data-article-product-type-id') || '',
  })).filter(a => a.id);

  const ADS = Array.from(document.querySelectorAll('[data-ads-wrapper] [data-item]')).map(el => ({
    id: el.getAttribute('data-ad-id') || '', name: el.getAttribute('data-ad-title') || '',
    customerId: el.getAttribute('data-ad-customer-id') || '',
  })).filter(a => a.id);

  const EVENTS = Array.from(document.querySelectorAll('[data-events-wrapper] [data-item]')).map(el => ({
    id: el.getAttribute('data-event-id') || '', name: el.getAttribute('data-event-title') || '',
  })).filter(e => e.id);

  const RE = Array.from(document.querySelectorAll('[data-re-wrapper] [data-item]')).map(el => ({
    id: el.getAttribute('data-re-id') || '', name: el.getAttribute('data-re-title') || '',
  })).filter(r => r.id);

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
  const esc     = s => (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  const show    = el => { if(el) el.style.display=''; };
  const hide    = el => { if(el) el.style.display='none'; };
  const setVal  = (sel, val) => { const el = document.querySelector(sel); if(el) el.value = val||''; };
  const setText = (sel, val) => { const el = document.querySelector(sel); if(el) el.textContent = val||''; };
  const setClass = (sel, cls, on) => { const el = document.querySelector(sel); if(el) el.classList.toggle(cls, on); };
  const M = sel => document.querySelector('#cm-modal-inner ' + sel);

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
/* Modal */
.cm-modal-overlay{position:fixed;inset:0;background:rgba(26,58,58,0.7);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto}
.cm-modal{background:#fff;border-radius:8px;width:100%;max-width:760px;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative}
.cm-modal-bar{height:4px;background:linear-gradient(90deg,#1a3a3a,#c4a35a);border-radius:8px 8px 0 0}
.cm-modal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 12px;border-bottom:1px solid #f0ede4}
.cm-modal-title{font-size:15px;font-weight:700;color:#1a3a3a}
.cm-modal-sub{font-size:10px;font-family:'DM Mono',monospace;color:#8a8a7a;text-transform:uppercase;letter-spacing:.04em;margin-top:2px}
.cm-modal-close{width:28px;height:28px;border-radius:50%;border:1.5px solid #e8e4d8;background:#fff;cursor:pointer;font-size:14px;color:#8a8a7a;transition:all .15s;flex-shrink:0}
.cm-modal-close:hover{border-color:#c0392b;color:#c0392b}
.cm-modal-files{padding:10px 20px;background:#faf9f5;border-bottom:1px solid #f0ede4;display:flex;flex-wrap:wrap;gap:6px}
.cm-modal-file-chip{font-family:'DM Mono',monospace;font-size:9px;padding:3px 8px;background:#fff;border:1px solid #e8e4d8;border-radius:2px;color:#5a6a5a;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cm-modal-body{padding:20px}
.cm-modal-footer{padding:12px 20px 16px;border-top:1px solid #f0ede4;display:flex;align-items:center;justify-content:space-between}
/* Form elements */
.cm-steps{display:flex;gap:4px;margin-bottom:16px;align-items:center}
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
.cm-section{transition:opacity .15s}
.cm-section.hidden{display:none}
.cm-nested{margin-top:8px;padding:10px 12px;background:#fdfcf8;border:1.5px dashed #c4a35a;border-radius:4px}
.cm-nested-hdr{font-size:11px;font-weight:700;color:#1a3a3a;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
.cm-nested-close{font-size:10px;font-family:'DM Mono',monospace;color:#c0392b;cursor:pointer;background:none;border:none}
.cm-no-results{padding:8px 10px;background:#fff8e1;border:1px solid #e8a030;border-radius:3px;font-size:11px;color:#e8a030;margin-top:6px;display:flex;align-items:center;justify-content:space-between}
.cm-no-results button{font-family:'DM Mono',monospace;font-size:10px;padding:3px 10px;border-radius:3px;border:1.5px solid #1a3a3a;background:#fff;color:#1a3a3a;cursor:pointer}
.cm-file-tag-list{margin-top:14px;border-top:1px dashed #e8e4d8;padding-top:12px}
.cm-file-tag-label{font-size:10px;font-family:'DM Mono',monospace;color:#8a8a7a;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.cm-file-tag-row{display:flex;align-items:center;gap:8px;padding:6px 8px;background:#faf9f5;border:1px solid #e8e4d8;border-radius:3px;margin-bottom:4px}
.cm-file-tag-row.tagged{border-color:#c4a35a;background:#fdfcf8}
.cm-file-tag-icon{font-size:16px;flex-shrink:0}
.cm-file-tag-name{flex:1;font-size:11px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.cm-echips{display:flex;flex-wrap:wrap;gap:3px;flex-shrink:0}
.cm-echip{font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.04em;padding:2px 7px;border-radius:2px;border:1px solid #e8e4d8;background:#fff;color:#5a6a5a;cursor:pointer;transition:all .12s;white-space:nowrap}
.cm-echip:hover{border-color:#c4a35a}
.cm-echip.sel{background:#1a3a3a;color:#f0edd8;border-color:transparent}
.cm-sub-bar{display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding-top:12px;border-top:1px solid #f0ede4}
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
.cm-extras-body{margin-top:10px}
  `;
  document.head.appendChild(style);

  // ── Shell HTML ──
  mount.innerHTML = `
<div class="cm-root">
  <div class="cm-hdr">
    <div class="cm-hdr-left">
      <div class="cm-hdr-icon">📂</div>
      <div><h3>Content Manager</h3><div class="cm-hdr-sub">Select files → Assign to CMS records</div></div>
    </div>
    <span class="cm-badge">v1.1.1</span>
  </div>
  <div class="cm-filters" id="cm-filters"></div>
  <div id="cm-error"></div>
  <div id="cm-sel-bar"></div>
  <div class="cm-flist" id="cm-flist"></div>
  <div id="cm-modal"></div>
</div>`;

  // ══════════════════════════════════════════════
  // MODAL — built once, updated surgically
  // ══════════════════════════════════════════════

  function buildModalDOM(sel) {
    const el = document.getElementById('cm-modal');
    el.innerHTML = `
<div class="cm-modal-overlay" id="cm-overlay">
  <div class="cm-modal" id="cm-modal-inner">
    <div class="cm-modal-bar"></div>
    <div class="cm-modal-head">
      <div>
        <div class="cm-modal-title" id="cm-modal-title">Assign ${sel.length} File${sel.length>1?'s':''}</div>
        <div class="cm-modal-sub">Complete all steps · tag each file individually</div>
      </div>
      <button class="cm-modal-close" id="cm-modal-close">✕</button>
    </div>
    <div class="cm-modal-files" id="cm-modal-chips">
      ${sel.map(f=>`<span class="cm-modal-file-chip">${FILE_ICONS[f.mime]||'📄'} ${esc(f.name)}</span>`).join('')}
    </div>
    <div class="cm-modal-body">

      <!-- Steps -->
      <div class="cm-steps" style="margin-bottom:16px">
        <span class="cm-step active" id="cm-step-1">1 Type</span><span class="cm-step-arr">→</span>
        <span class="cm-step" id="cm-step-2">2 Customer</span><span class="cm-step-arr">→</span>
        <span class="cm-step" id="cm-step-3">3 Item</span><span class="cm-step-arr">→</span>
        <span class="cm-step" id="cm-step-4">4 Tag</span>
      </div>

      <!-- Step 1: Product Type -->
      <div class="cm-section" id="cm-s-pt">
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Product Type <span class="req">*</span></label>
          <select class="cm-fsel" id="cm-sel-pt">
            <option value="">Select type…</option>
            ${['Articles','Ads','Other'].map(grp => {
              const items = PRODUCT_TYPES.filter(p => p.group === grp);
              if (!items.length) return '';
              return `<optgroup label="${grp}">${items.map(p=>`<option value="${p.id}">${p.label}</option>`).join('')}</optgroup>`;
            }).join('')}
          </select>
        </div></div>
      </div>

      <!-- Step 2: Customer -->
      <div class="cm-section hidden" id="cm-s-cust">
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl" id="cm-cust-label">Customer</label>
          <select class="cm-fsel" id="cm-sel-cust">
            <option value="">Select customer…</option>
            <option value="__none__">— No Customer / Unsponsored</option>
            ${CUSTOMERS.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}
            <option disabled>───────────</option>
            <option value="__new__">+ New Customer</option>
          </select>
        </div></div>
        <div class="cm-nested hidden" id="cm-nested-cust">
          <div class="cm-nested-hdr"><span>+ New Customer</span><button class="cm-nested-close" id="cm-nested-close">✕</button></div>
          <div class="cm-fr"><div class="cm-ff">
            <label class="cm-fl">Business Name <span class="req">*</span></label>
            <input class="cm-finp" id="cm-nested-name" type="text" placeholder="Business name…">
          </div></div>
          <div style="text-align:right;margin-top:4px"><button class="cm-sub-btn" id="cm-nested-save" disabled>Create Customer</button></div>
        </div>
      </div>

      <!-- Step 3: CMS Item -->
      <div class="cm-section hidden" id="cm-s-item">
        <!-- Existing item picker -->
        <div id="cm-item-picker">
          <div class="cm-fr"><div class="cm-ff">
            <label class="cm-fl" id="cm-item-label">Assign To <span class="req">*</span></label>
            <select class="cm-fsel" id="cm-sel-item">
              <option value="">Select…</option>
            </select>
          </div></div>
          <div id="cm-no-results" class="cm-no-results hidden">
            <span id="cm-no-results-msg">No items found</span>
            <button id="cm-no-results-new">+ Create New</button>
          </div>
          <div id="cm-create-link-wrap" style="margin-bottom:8px">
            <button class="cm-link-btn" id="cm-create-link">+ or create new</button>
          </div>
        </div>
        <!-- New item form -->
        <div id="cm-new-item-wrap" class="hidden"></div>
        <div id="cm-back-link-wrap" class="hidden" style="margin-bottom:8px">
          <button class="cm-link-btn" id="cm-back-link">← back to existing</button>
        </div>
      </div>

      <!-- Step 4: Element tags -->
      <div class="cm-section hidden" id="cm-s-tags">
        <div class="cm-file-tag-list">
          <div class="cm-file-tag-label">Tag Each File's Element Type</div>
          <div id="cm-tag-rows"></div>
        </div>
      </div>

    </div><!-- /modal-body -->

    <div class="cm-modal-footer">
      <button class="cm-cancel" id="cm-reset-btn">✕ reset</button>
      <div class="cm-sub-right">
        <span class="cm-sub-info" id="cm-tag-info"></span>
        <button class="cm-sub-btn" id="cm-submit-btn" disabled>Assign ✓</button>
      </div>
    </div>
  </div>
</div>`;

    // Bind persistent event listeners — only once
    document.getElementById('cm-overlay').addEventListener('click', e => {
      if (e.target.id === 'cm-overlay') cmCloseModal();
    });
    document.getElementById('cm-modal-close').addEventListener('click', cmCloseModal);
    document.getElementById('cm-reset-btn').addEventListener('click', () => { resetA(); updateModal(); });
    document.getElementById('cm-submit-btn').addEventListener('click', cmSubmit);

    document.getElementById('cm-sel-pt').addEventListener('change', function() {
      A.productType = this.value;
      A.customerId=''; A.cmsItemId=''; A.isNew=false; A.newItemName='';
      const pt = getPT(this.value);
      if (pt) FILES.filter(f=>f.selected&&!f.assigned).forEach(f => { f.elementType = guessEType(f, pt.collection); });
      updateModal();
    });

    document.getElementById('cm-sel-cust').addEventListener('change', function() {
      if (this.value === '__new__') {
        A.nestedOpen = true; A.customerId = '';
        show(document.getElementById('cm-nested-cust'));
        return;
      }
      A.customerId = this.value; A.nestedOpen = false; A.cmsItemId = ''; A.isNew = false; A.newItemName = '';
      hide(document.getElementById('cm-nested-cust'));
      updateModal();
    });

    document.getElementById('cm-nested-close').addEventListener('click', () => {
      A.nestedOpen = false;
      hide(document.getElementById('cm-nested-cust'));
      document.getElementById('cm-sel-cust').value = '';
    });

    document.getElementById('cm-nested-name').addEventListener('input', function() {
      A.nestedName = this.value;
      this.classList.toggle('changed', !!this.value);
      document.getElementById('cm-nested-save').disabled = !this.value;
    });

    document.getElementById('cm-nested-save').addEventListener('click', () => {
      if (!A.nestedName) return;
      const nid = 'new-'+Date.now();
      CUSTOMERS.push({ id:nid, name:A.nestedName });
      // Add to dropdown
      const sel = document.getElementById('cm-sel-cust');
      const opt = document.createElement('option');
      opt.value = nid; opt.textContent = A.nestedName;
      sel.insertBefore(opt, sel.querySelector('[disabled]'));
      A.customerId = nid; A.nestedOpen = false; A.nestedName = '';
      hide(document.getElementById('cm-nested-cust'));
      sel.value = nid;
      updateModal();
    });

    document.getElementById('cm-sel-item').addEventListener('change', function() {
      A.cmsItemId = this.value;
      this.classList.toggle('changed', !!this.value);
      updateModal();
    });

    document.getElementById('cm-no-results-new').addEventListener('click', () => {
      A.isNew = true; A.cmsItemId = '';
      updateModal();
    });

    document.getElementById('cm-create-link').addEventListener('click', () => {
      A.isNew = true; A.cmsItemId = '';
      updateModal();
    });

    document.getElementById('cm-back-link').addEventListener('click', () => {
      A.isNew = false; A.newItemName = '';
      updateModal();
    });

    MODAL_BUILT = true;
  }

  // ── updateModal — surgical updates only ──
  function updateModal() {
    if (!MODAL_BUILT) return;
    const sel = FILES.filter(f => f.selected && !f.assigned);
    if (!sel.length) { cmCloseModal(); return; }

    const pt  = getPT(A.productType);
    const col = pt?.collection || '';

    // Steps
    const s1done = !!A.productType;
    const s2done = s1done && (!pt?.reqCust || !!A.customerId);
    const s3done = s2done && (col==='customers' || !!(A.cmsItemId || (A.isNew && A.newItemName)));
    const s4done = s3done && sel.every(f => f.elementType);

    const stepEl = id => document.getElementById(id);
    const setStep = (id, done, active) => {
      const el = stepEl(id);
      if (!el) return;
      el.className = 'cm-step' + (done ? ' done-s' : active ? ' active' : '');
    };
    setStep('cm-step-1', s1done, !s1done);
    setStep('cm-step-2', s2done, s1done && !s2done);
    setStep('cm-step-3', s3done, s2done && !s3done);
    setStep('cm-step-4', s4done, s3done && !s4done);

    // Product type dropdown value
    const ptSel = document.getElementById('cm-sel-pt');
    if (ptSel && ptSel.value !== A.productType) ptSel.value = A.productType;
    if (ptSel) ptSel.classList.toggle('changed', !!A.productType);

    // Customer section
    const custSection = document.getElementById('cm-s-cust');
    if (pt?.reqCust) {
      show(custSection);
      const custLabel = document.getElementById('cm-cust-label');
      if (custLabel) custLabel.innerHTML = `Customer${pt.reqCust?' <span class="req">*</span>':''}`;
      const custSel = document.getElementById('cm-sel-cust');
      if (custSel && custSel.value !== A.customerId) custSel.value = A.customerId || '';
      if (custSel) custSel.classList.toggle('changed', !!A.customerId);
    } else {
      hide(custSection);
    }

    // Item section
    const itemSection = document.getElementById('cm-s-item');
    if (col && col !== 'customers' && s2done) {
      show(itemSection);
      const items = getCMSItems(col, A.customerId, A.productType);
      const itemPicker = document.getElementById('cm-item-picker');
      const newWrap    = document.getElementById('cm-new-item-wrap');
      const backWrap   = document.getElementById('cm-back-link-wrap');
      const itemLabel  = document.getElementById('cm-item-label');

      if (itemLabel) itemLabel.innerHTML = `Assign To <span class="req">*</span>`;

      if (A.isNew) {
        hide(itemPicker);
        show(backWrap);
        // Build new item form if not already built for this collection
        if (newWrap.dataset.col !== col) {
          newWrap.innerHTML = buildNewItemFormHTML(col, pt);
          newWrap.dataset.col = col;
          bindNewItemFormEvents(col);
        }
        show(newWrap);
        // Sync form values
        syncNewItemForm(col);
      } else {
        show(itemPicker);
        hide(newWrap);
        hide(backWrap);

        // Rebuild item dropdown options if needed
        const itemSel = document.getElementById('cm-sel-item');
        if (itemSel) {
          const currentOptions = Array.from(itemSel.options).map(o=>o.value).join(',');
          const newOptions = ['',...items.map(i=>i.id)].join(',');
          if (currentOptions !== newOptions) {
            itemSel.innerHTML = `<option value="">Select ${pt?.label.toLowerCase()||'item'}…</option>`+
              items.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join('');
          }
          if (itemSel.value !== A.cmsItemId) itemSel.value = A.cmsItemId || '';
          itemSel.classList.toggle('changed', !!A.cmsItemId);
        }

        const noResults = document.getElementById('cm-no-results');
        const createLinkWrap = document.getElementById('cm-create-link-wrap');
        const createLink = document.getElementById('cm-create-link');
        if (!items.length) {
          show(noResults);
          hide(createLinkWrap);
        } else {
          hide(noResults);
          show(createLinkWrap);
          if (createLink) createLink.textContent = `+ or create new ${pt?.label.toLowerCase()||'item'}`;
        }
      }
    } else {
      hide(itemSection);
    }

    // Tags section
    const tagsSection = document.getElementById('cm-s-tags');
    if (s3done) {
      show(tagsSection);
      const etypes = ETYPES[col] || [];
      const tagRows = document.getElementById('cm-tag-rows');
      if (tagRows && etypes.length) {
        tagRows.innerHTML = sel.map(f => {
          const icon = FILE_ICONS[f.mime] || '📄';
          return `<div class="cm-file-tag-row ${f.elementType?'tagged':''}" data-fid="${f.id}">
            <span class="cm-file-tag-icon">${icon}</span>
            <span class="cm-file-tag-name">${esc(f.name)}</span>
            <div class="cm-echips">${etypes.map(t=>`<span class="cm-echip ${t.id===f.elementType?'sel':''}" data-etype="${t.id}">${t.l}</span>`).join('')}</div>
          </div>`;
        }).join('');
        // Bind chip clicks
        tagRows.querySelectorAll('.cm-echip').forEach(chip => {
          chip.addEventListener('click', function() {
            const row = this.closest('[data-fid]');
            const fid = row?.dataset.fid;
            const etype = this.dataset.etype;
            const f = FILES.find(x => x.id===fid);
            if (f) { f.elementType = etype; updateModal(); }
          });
        });
      }
    } else {
      hide(tagsSection);
    }

    // Footer
    const ok = checkReady(sel);
    const tagged = sel.filter(f => f.elementType).length;
    const infoEl = document.getElementById('cm-tag-info');
    const submitBtn = document.getElementById('cm-submit-btn');
    if (infoEl) infoEl.textContent = `${tagged}/${sel.length} tagged${ok?' — ready':''}`;
    if (submitBtn) {
      submitBtn.disabled = !ok;
      submitBtn.textContent = `Assign ${sel.length} File${sel.length>1?'s':''} ✓`;
    }
  }

  function buildNewItemFormHTML(col, pt) {
    if (col === 'articles') {
      return `<div class="cm-new-form">
        <div class="cm-new-form-title">New Article</div>
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Article Title <span class="req">*</span></label>
          <input class="cm-finp" id="nf-title" type="text" placeholder="Article title…">
        </div></div>
        <div class="cm-fr"><div class="cm-ff">
          <label class="cm-fl">Sub-Title</label>
          <input class="cm-finp" id="nf-subtitle" type="text" placeholder="Sub-title…">
        </div></div>
        <div class="cm-fr">
          <div class="cm-ff">
            <label class="cm-fl">Revenue Type <span class="req">*</span></label>
            <select class="cm-fsel" id="nf-revenue">
              <option value="">Select…</option>
              <option value="d894f7e97435fc2f06fdb79c75e8ea29">Paid Ad</option>
              <option value="99578b8a5a6a99e9c15c0c2ed30c22b2">Paid Article</option>
              <option value="1625d5aa547083d33098b8b6fd4b0569">Sponsorable</option>
            </select>
          </div>
        </div>
        <div class="cm-fr">
          <div class="cm-ff"><label class="cm-fl">Writer Name</label><input class="cm-finp" id="nf-writer" type="text" placeholder="Name…"></div>
          <div class="cm-ff"><label class="cm-fl">Writer Title</label><input class="cm-finp" id="nf-writertitle" type="text" placeholder="Role…"></div>
          <div class="cm-ff"><label class="cm-fl">Co-Writer</label><input class="cm-finp" id="nf-cowriter" type="text" placeholder="Optional…"></div>
          <div class="cm-ff"><label class="cm-fl">Co-Writer Title</label><input class="cm-finp" id="nf-cowritertitle" type="text" placeholder="Optional…"></div>
        </div>
        <div id="nf-extras-wrap">
          <div style="border-top:1px dashed #ddd9c8;margin-top:8px;padding-top:8px">
            <button class="cm-link-btn" id="nf-extras-toggle">▸ Additional fields</button>
            <div id="nf-extras-body" class="hidden cm-extras-body">
              <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Banner Statement</label><input class="cm-finp" id="nf-banner" type="text" placeholder="Optional…"></div></div>
              <div class="cm-fr" style="align-items:center;gap:20px;flex-wrap:wrap">
                <label style="display:flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:10px;color:#5a6a5a;cursor:pointer"><input type="checkbox" id="nf-photo-credits" style="accent-color:#1a3a3a"> Show Photo Credits</label>
                <label style="display:flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:10px;color:#5a6a5a;cursor:pointer"><input type="checkbox" id="nf-photo-essay" style="accent-color:#1a3a3a"> Photo Essay</label>
                <label style="display:flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:10px;color:#5a6a5a;cursor:pointer"><input type="checkbox" id="nf-video-article" style="accent-color:#1a3a3a"> Video Article</label>
              </div>
              <div id="nf-photographer-wrap" class="hidden cm-fr" style="margin-top:8px"><div class="cm-ff"><label class="cm-fl">Photographer</label><input class="cm-finp" id="nf-photographer" type="text" placeholder="Name…"></div></div>
              <div id="nf-video-wrap" class="hidden cm-fr" style="margin-top:8px"><div class="cm-ff"><label class="cm-fl">Video URL</label><input class="cm-finp" id="nf-video-url" type="text" placeholder="https://…"></div></div>
              <div class="cm-fr" style="margin-top:8px"><div class="cm-ff"><label class="cm-fl">Audio URL</label><input class="cm-finp" id="nf-audio-url" type="text" placeholder="https://…"></div></div>
            </div>
          </div>
        </div>
      </div>`;
    }
    if (col === 'ads') {
      const today = new Date().toISOString().split('T')[0];
      const sixMo = new Date(Date.now()+183*24*60*60*1000).toISOString().split('T')[0];
      return `<div class="cm-new-form">
        <div class="cm-new-form-title">New ${pt.label}</div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Ad Name <span class="req">*</span></label><input class="cm-finp" id="nf-title" type="text" placeholder="Ad name…"></div></div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Click URL</label><input class="cm-finp" id="nf-ad-click" type="text" placeholder="https://…"></div></div>
        <div class="cm-fr">
          <div class="cm-ff"><label class="cm-fl">Start Date</label><input class="cm-finp changed" id="nf-ad-start" type="date" value="${today}"></div>
          <div class="cm-ff"><label class="cm-fl">End Date</label><input class="cm-finp changed" id="nf-ad-end" type="date" value="${sixMo}"></div>
        </div>
      </div>`;
    }
    if (col === 'events') {
      return `<div class="cm-new-form">
        <div class="cm-new-form-title">New Event</div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Event Title <span class="req">*</span></label><input class="cm-finp" id="nf-title" type="text" placeholder="Event title…"></div></div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Event Start <span class="req">*</span></label><input class="cm-finp" id="nf-event-start" type="datetime-local"></div></div>
        <div class="cm-fr">
          <div class="cm-ff"><label class="cm-fl">Location</label><input class="cm-finp" id="nf-event-loc" type="text" placeholder="Venue…"></div>
          <div class="cm-ff"><label class="cm-fl">City</label><input class="cm-finp" id="nf-event-city" type="text" placeholder="City…"></div>
        </div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Address</label><input class="cm-finp" id="nf-event-addr" type="text" placeholder="Street address…"></div></div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Description</label><input class="cm-finp" id="nf-event-desc" type="text" placeholder="Brief description…"></div></div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Event Link</label><input class="cm-finp" id="nf-event-link" type="text" placeholder="https://…"></div></div>
      </div>`;
    }
    if (col === 're') {
      return `<div class="cm-new-form">
        <div class="cm-new-form-title">New RE Listing</div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Property Address <span class="req">*</span></label><input class="cm-finp" id="nf-title" type="text" placeholder="42 Oak Street, Wyckoff…"></div></div>
        <div class="cm-fr">
          <div class="cm-ff">
            <label class="cm-fl">Listing Status</label>
            <select class="cm-fsel" id="nf-re-status">
              <option value="">Select…</option>
              <option value="b0887da3d5d4d77a684cbb96531bd08c">Active</option>
              <option value="4a8316ea601504d55ec421db92fed4ff">Coming Soon</option>
              <option value="9091234ac1ce288c11c363e430337622">Under Contract</option>
              <option value="09a0a251160c6d74cfd8783e267ecae7">Sold</option>
            </select>
          </div>
          <div class="cm-ff"><label class="cm-fl">MLS #</label><input class="cm-finp" id="nf-re-mls" type="text" placeholder="MLS number…"></div>
        </div>
        <div class="cm-fr">
          <div class="cm-ff"><label class="cm-fl">Price</label><input class="cm-finp" id="nf-re-price" type="number" placeholder="549000"></div>
        </div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Features</label><input class="cm-finp" id="nf-re-features" type="text" placeholder="3BR, 2BA…"></div></div>
        <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Listing Link</label><input class="cm-finp" id="nf-re-link" type="text" placeholder="https://…"></div></div>
      </div>`;
    }
    return `<div class="cm-new-form"><div class="cm-new-form-title">New ${pt.label}</div>
      <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Name <span class="req">*</span></label><input class="cm-finp" id="nf-title" type="text" placeholder="Name…"></div></div>
    </div>`;
  }

  function bindNewItemFormEvents(col) {
    const g = id => document.getElementById(id);

    const syncTitle = () => { const el=g('nf-title'); if(el){A.newItemName=el.value; el.classList.toggle('changed',!!el.value); updateFooter();} };
    if (g('nf-title')) g('nf-title').addEventListener('input', syncTitle);

    if (col === 'articles') {
      if (g('nf-subtitle'))     g('nf-subtitle').addEventListener('input', function(){ A.newSubTitle=this.value; });
      if (g('nf-revenue'))      g('nf-revenue').addEventListener('change', function(){ A.newRevenueType=this.value; this.classList.toggle('changed',!!this.value); updateFooter(); });
      if (g('nf-writer'))       g('nf-writer').addEventListener('input', function(){ A.newWriterName=this.value; });
      if (g('nf-writertitle'))  g('nf-writertitle').addEventListener('input', function(){ A.newWriterTitle=this.value; });
      if (g('nf-cowriter'))     g('nf-cowriter').addEventListener('input', function(){ A.newCoWriterName=this.value; });
      if (g('nf-cowritertitle'))g('nf-cowritertitle').addEventListener('input', function(){ A.newCoWriterTitle=this.value; });
      if (g('nf-extras-toggle'))g('nf-extras-toggle').addEventListener('click', function(){
        A.newExtrasOpen = !A.newExtrasOpen;
        const body = g('nf-extras-body');
        if(body){ body.classList.toggle('hidden',!A.newExtrasOpen); }
        this.textContent = (A.newExtrasOpen?'▾':'▸')+' Additional fields';
      });
      if (g('nf-banner'))       g('nf-banner').addEventListener('input', function(){ A.newBannerStatement=this.value; });
      if (g('nf-photo-credits'))g('nf-photo-credits').addEventListener('change', function(){
        A.newPhotoCredits=this.checked;
        const w=g('nf-photographer-wrap'); if(w) w.classList.toggle('hidden',!this.checked);
      });
      if (g('nf-photo-essay'))  g('nf-photo-essay').addEventListener('change', function(){ A.newPhotoEssay=this.checked; });
      if (g('nf-video-article'))g('nf-video-article').addEventListener('change', function(){
        A.newVideoArticle=this.checked;
        const w=g('nf-video-wrap'); if(w) w.classList.toggle('hidden',!this.checked);
      });
      if (g('nf-photographer')) g('nf-photographer').addEventListener('input', function(){ A.newPhotographer=this.value; });
      if (g('nf-video-url'))    g('nf-video-url').addEventListener('input', function(){ A.newVideoUrl=this.value; });
      if (g('nf-audio-url'))    g('nf-audio-url').addEventListener('input', function(){ A.newAudioUrl=this.value; });
    }

    if (col === 'ads') {
      if (g('nf-ad-click')) g('nf-ad-click').addEventListener('input', function(){ A.newAdClickUrl=this.value; });
      if (g('nf-ad-start')) g('nf-ad-start').addEventListener('input', function(){ A.newAdStartDate=this.value; });
      if (g('nf-ad-end'))   g('nf-ad-end').addEventListener('input', function(){ A.newAdEndDate=this.value; });
    }

    if (col === 'events') {
      if (g('nf-event-start')) g('nf-event-start').addEventListener('input', function(){ A.newEventStart=this.value; this.classList.toggle('changed',!!this.value); updateFooter(); });
      if (g('nf-event-loc'))   g('nf-event-loc').addEventListener('input', function(){ A.newEventLocation=this.value; });
      if (g('nf-event-city'))  g('nf-event-city').addEventListener('input', function(){ A.newEventCity=this.value; });
      if (g('nf-event-addr'))  g('nf-event-addr').addEventListener('input', function(){ A.newEventAddress=this.value; });
      if (g('nf-event-desc'))  g('nf-event-desc').addEventListener('input', function(){ A.newEventDescription=this.value; });
      if (g('nf-event-link'))  g('nf-event-link').addEventListener('input', function(){ A.newEventLink=this.value; });
    }

    if (col === 're') {
      if (g('nf-re-status'))   g('nf-re-status').addEventListener('change', function(){ A.newReListingStatus=this.value; });
      if (g('nf-re-mls'))      g('nf-re-mls').addEventListener('input', function(){ A.newReMls=this.value; });
      if (g('nf-re-price'))    g('nf-re-price').addEventListener('input', function(){ A.newRePrice=this.value; });
      if (g('nf-re-features')) g('nf-re-features').addEventListener('input', function(){ A.newReFeatures=this.value; });
      if (g('nf-re-link'))     g('nf-re-link').addEventListener('input', function(){ A.newReListingLink=this.value; });
    }
  }

  function syncNewItemForm(col) {
    const g = id => document.getElementById(id);
    if (g('nf-title') && document.activeElement !== g('nf-title')) g('nf-title').value = A.newItemName;
    if (col === 'articles') {
      if (g('nf-revenue') && document.activeElement !== g('nf-revenue')) g('nf-revenue').value = A.newRevenueType;
    }
  }

  function updateFooter() {
    const sel = FILES.filter(f => f.selected && !f.assigned);
    const ok = checkReady(sel);
    const tagged = sel.filter(f => f.elementType).length;
    const infoEl = document.getElementById('cm-tag-info');
    const submitBtn = document.getElementById('cm-submit-btn');
    if (infoEl) infoEl.textContent = `${tagged}/${sel.length} tagged${ok?' — ready':''}`;
    if (submitBtn) submitBtn.disabled = !ok;
  }

  // ── Trap keys in modal ──
  function trapKeys(e) { e.stopPropagation(); }

  function cmOpenModal() {
    const sel = FILES.filter(f => f.selected && !f.assigned);
    if (!sel.length) return;
    MODAL_OPEN = true;
    MODAL_BUILT = false;
    buildModalDOM(sel);
    updateModal();
    document.addEventListener('keydown', trapKeys, true);
    document.addEventListener('keyup', trapKeys, true);
    document.addEventListener('keypress', trapKeys, true);
  }

  function cmCloseModal() {
    MODAL_OPEN = false;
    MODAL_BUILT = false;
    document.getElementById('cm-modal').innerHTML = '';
    document.removeEventListener('keydown', trapKeys, true);
    document.removeEventListener('keyup', trapKeys, true);
    document.removeEventListener('keypress', trapKeys, true);
  }

  // ── File list render ──
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
      `<button class="cm-pill ${FILTER==='ready'?'active-ok':''}" onclick="cmSetFilter('ready')">Ready ${ready}</button>`+
      `<button class="cm-pill ${FILTER==='all'?'active':''}" onclick="cmSetFilter('all')">All</button>`+
      `<button class="cm-pill ${FILTER==='assigned'?'active':''}" onclick="cmSetFilter('assigned')">Assigned</button>`+
      `<button class="cm-pill ${FILTER==='decision'?'active-dec':''}" onclick="cmSetFilter('decision')">Needs Decision ${dec}</button>`+
      `<button class="cm-refresh" onclick="cmReload()">↻ Refresh</button>`;
  }

  function renderError() {
    const el = document.getElementById('cm-error');
    if (!LOAD_ERR) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="cm-error"><span>${esc(LOAD_ERR)}</span><button onclick="cmReload()">Retry</button></div>`;
  }

  function renderSelBar() {
    const sel = FILES.filter(f => f.selected && !f.assigned);
    const el  = document.getElementById('cm-sel-bar');
    if (!sel.length) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="cm-sel-bar">
      <span class="cm-sel-count">${sel.length} file${sel.length>1?'s':''} selected</span>
      <div class="cm-sel-spacer"></div>
      <button class="cm-desel" onclick="cmDeselAll()">✕ clear</button>
      <button class="cm-assign-btn" onclick="cmOpenModal()">Assign ${sel.length} File${sel.length>1?'s':''} →</button>
    </div>`;
  }

  function renderFileList() {
    const el = document.getElementById('cm-flist');
    if (LOADING) { el.innerHTML=`<div class="cm-loading"><div class="cm-loading-spin">⟳</div><div>Loading files…</div></div>`; return; }
    let vis = FILES;
    if (FILTER==='ready')    vis = FILES.filter(f => f.status==='DONE' && !f.assigned);
    if (FILTER==='assigned') vis = FILES.filter(f => f.assigned);
    if (FILTER==='decision') vis = FILES.filter(f => f.status==='AWAITING_DECISION');
    if (!vis.length) {
      const msgs = {ready:'No conditioned files ready',all:'No files',assigned:'No files assigned yet',decision:'No PDFs awaiting decision'};
      el.innerHTML=`<div class="cm-empty"><div class="cm-empty-icon">${FILTER==='ready'?'✅':'📭'}</div><div class="cm-empty-text">${msgs[FILTER]||'No files'}</div></div>`;
      return;
    }
    el.innerHTML = vis.map(f => {
      const icon  = FILE_ICONS[f.mime]||'📄';
      const badge = f.assigned?'assigned':f.status==='AWAITING_DECISION'?'decision':'ready';
      const label = f.assigned?'Assigned':f.status==='AWAITING_DECISION'?'Needs Decision':'Ready';
      const uc = f.uuid ? `<span style="color:#1a3a3a">UC:${f.uuid.substring(0,8)}…</span>` : '';
      return `<div class="cm-frow ${f.selected?'sel':''} ${f.assigned?'assigned':''}" onclick="cmToggleSel('${f.id}')">
        <div class="cm-frow-main">
          <input type="checkbox" class="cm-fcheck" ${f.selected?'checked':''} ${f.assigned?'disabled':''} onclick="event.stopPropagation();cmToggleSel('${f.id}')">
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

  // ── Load ──
  async function loadFiles(status) {
    LOADING=true; LOAD_ERR=null; render();
    try {
      const url = `${CFG.scenarioCUrl}?titleSlug=${encodeURIComponent(CFG.titleSlug)}&status=${status}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Scenario C returned '+res.status);
      const data = await res.json();
      FILES = (Array.isArray(data)?data:[]).map((row,i)=>({
        id:row['0']||('f'+i), fileId:row['0']||'', name:row['1']||'(unknown)',
        mime:row['2']||'', size:parseInt(row['3']||'0',10)||0,
        arrived:row['4']||'', status:row['5']||'', uuid:row['6']||'',
        selected:false, elementType:'', assigned:false,
      }));
      LOADING=false;
    } catch(err) { LOADING=false; LOAD_ERR=err.message; FILES=[]; }
    render();
  }

  // ── Helpers ──
  function getCMSItems(col, custId, productTypeId) {
    let items = col==='articles'?ARTICLES:col==='ads'?ADS:col==='events'?EVENTS:col==='re'?RE:[];
    if (col==='articles' && productTypeId) items=items.filter(i=>!i.productTypeId||i.productTypeId===productTypeId);
    if (custId && custId!=='__none__') items=items.filter(i=>!i.customerId||i.customerId===custId);
    return items;
  }

  function checkReady(sel) {
    if (!A.productType) return false;
    const pt=getPT(A.productType); if(!pt) return false;
    if (pt.reqCust && !A.customerId) return false;
    const col=pt.collection;
    if (col!=='customers') {
      if (!A.cmsItemId && !A.isNew) return false;
      if (A.isNew) {
        if (!A.newItemName) return false;
        if (col==='articles' && !A.newRevenueType) return false;
        if (col==='ads' && !A.customerId) return false;
        if (col==='events' && !A.newEventStart) return false;
        if (col==='re' && !A.customerId) return false;
      }
    }
    return sel.every(f=>f.elementType);
  }

  function guessEType(f, collection) {
    const n=f.name.toLowerCase();
    const map={'main-image':['hero','feature','photo','main'],'article-body':['docx','doc','html'],'banner-ad':['banner','600x200'],'logo':['logo','svg'],'event-flyer':['flyer'],'ad-creative':['ad','promo']};
    const etypes=ETYPES[collection]||[];
    for(const[etype,keys]of Object.entries(map)){if(keys.some(k=>n.includes(k))&&etypes.find(t=>t.id===etype))return etype;}
    if(f.mime.startsWith('image/')){return etypes.find(t=>t.id==='main-image')?'main-image':'';}
    return '';
  }

  // ── Global handlers ──
  window.cmOpenModal = cmOpenModal;

  window.cmSetFilter = f => {
    FILTER=f; FILES.forEach(x=>{x.selected=false;x.elementType='';}); resetA();
    const statusMap={ready:'DONE',all:'DONE',assigned:'ASSIGNED',decision:'AWAITING_DECISION'};
    loadFiles(statusMap[f]||'DONE');
  };
  window.cmReload = () => {
    const statusMap={ready:'DONE',all:'DONE',assigned:'ASSIGNED',decision:'AWAITING_DECISION'};
    loadFiles(statusMap[FILTER]||'DONE');
  };
  window.cmToggleSel = id => {
    const f=FILES.find(x=>x.id===id); if(!f||f.assigned)return;
    f.selected=!f.selected; if(!f.selected)f.elementType='';
    renderSelBar(); renderFileList();
    if(MODAL_BUILT) updateModal();
  };
  window.cmDeselAll = () => {
    FILES.forEach(f=>{f.selected=false;f.elementType='';}); resetA(); cmCloseModal(); render();
  };

  window.cmSubmit = () => {
    const sel=FILES.filter(f=>f.selected&&!f.assigned);
    if(!checkReady(sel))return;
    const pt=getPT(A.productType);
    const promises=sel.map(f=>{
      const payload={
        titleSlug:CFG.titleSlug, taItemId:CFG.taItemId,
        fileId:f.fileId, fileName:f.name, uploadcareUuid:f.uuid,
        mimeType:f.mime, productType:A.productType,
        customerId:A.customerId==='__none__'?'':A.customerId,
        cmsItemId:A.cmsItemId||'', isNew:A.isNew,
        collection:pt?.collection||'', elementType:f.elementType,
        newItemName:A.newItemName||'', newRevenueType:A.newRevenueType||'',
        newSubTitle:A.newSubTitle||'', newWriterName:A.newWriterName||'',
        newWriterTitle:A.newWriterTitle||'', newCoWriterName:A.newCoWriterName||'',
        newCoWriterTitle:A.newCoWriterTitle||'', newPhotoCredits:A.newPhotoCredits||false,
        newPhotographer:A.newPhotographer||'', newPhotoEssay:A.newPhotoEssay||false,
        newVideoArticle:A.newVideoArticle||false, newVideoUrl:A.newVideoUrl||'',
        newAudioUrl:A.newAudioUrl||'', newBannerStatement:A.newBannerStatement||'',
        newAdClickUrl:A.newAdClickUrl||'', newAdStartDate:A.newAdStartDate||'',
        newAdEndDate:A.newAdEndDate||'', newEventStart:A.newEventStart||'',
        newEventDescription:A.newEventDescription||'', newEventLocation:A.newEventLocation||'',
        newEventAddress:A.newEventAddress||'', newEventCity:A.newEventCity||'',
        newEventLink:A.newEventLink||'', newReListingStatus:A.newReListingStatus||'',
        newReMls:A.newReMls||'', newRePrice:A.newRePrice||'',
        newReFeatures:A.newReFeatures||'', newReListingLink:A.newReListingLink||'',
      };
      console.log('[CM ASSIGN]', payload);
      const qs=new URLSearchParams();
      Object.entries(payload).forEach(([k,v])=>qs.append(k,String(v)));
      return fetch(CFG.makeAssembly+'?'+qs.toString(),{method:'GET',mode:'no-cors'});
    });
    Promise.allSettled(promises).then(()=>{
      sel.forEach(f=>{f.assigned=true;f.selected=false;});
      resetA(); cmCloseModal(); render();
    });
  };

  loadFiles('DONE');
  console.log('📂 Content Manager v1.1.1 mounted');
});
