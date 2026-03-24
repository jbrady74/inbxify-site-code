// ============================================================
// content-manager-v1.0.1.js
// INBXIFY Content Manager — System 2 UI
// v1.0.1: "No Customer" option in customer dropdown
//         Assigned filter uses local memory (not Scenario C reload)
//         Filter tab reload only for Ready/All/Decision
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
  const mount = document.getElementById('content-manager-mount');
  if (!mount) return;

  // ── Config ──
  const CFG = {
    get scenarioCUrl() { return window.TA_CONFIG?.scenarioC || 'https://hook.us1.make.com/yg88sqpzwp5nyxiipoqgqcsipqplrfgk'; },
    get titleSlug()    { return window.TA_CONFIG?.titleSlug  || document.querySelector('[data-ta-slug]')?.dataset.taSlug || 'wyckoff-living-now'; },
    get taItemId()     { return window.TA_CONFIG?.taItemId   || ''; },
  };

  // ── State ──
  let FILES     = [];   // loaded from Scenario C
  let FILTER    = 'ready';  // ready | all | done | decision
  let SELECTED  = new Set();
  let LOADING   = false;
  let LOAD_ERR  = null;

  // Assignment state
  let A = {
    productType: '',
    customerId: '',
    cmsItemId: '',
    isNew: false,
    newItemName: '',
    nestedOpen: false,
    nestedName: '',
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

  // ── Product types ──
  const PRODUCT_TYPES = [
    { id:'fa',        label:'Feature Article',   collection:'articles', reqCust:true  },
    { id:'ts',        label:'Themed Spotlight',  collection:'articles', reqCust:true  },
    { id:'gr',        label:'Greeting / Intro',  collection:'articles', reqCust:false },
    { id:'fa-sponsor',label:'FA Sponsor Ad',     collection:'ads',      reqCust:true  },
    { id:'ts-sponsor',label:'TS Sponsor Ad',     collection:'ads',      reqCust:true  },
    { id:'banner',    label:'Banner Ad',         collection:'ads',      reqCust:true  },
    { id:'the-find',  label:'The Find / LBP',    collection:'ads',      reqCust:true  },
    { id:'event',     label:'Event',             collection:'events',   reqCust:false },
    { id:'re-listing',label:'RE Listing',        collection:'re',       reqCust:false },
    { id:'customer',  label:'Customer Record',   collection:'customers',reqCust:false },
  ];

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
  <div id="cm-assign-panel"></div>
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
    renderAssignPanel();
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

  function renderAssignPanel() {
    const sel = FILES.filter(f => f.selected && !f.assigned);
    const el  = document.getElementById('cm-assign-panel');
    if (!sel.length) { el.innerHTML=''; return; }

    const pt  = getPT(A.productType);
    const col = pt?.collection || '';

    // Step indicators
    const s1 = A.productType ? 'done-s' : 'active';
    const s2 = !A.productType ? '' : (!pt?.reqCust || A.customerId) ? 'done-s' : 'active';
    const s3 = !col || col==='customers' ? '' : (A.cmsItemId||(A.isNew&&A.newItemName)) ? 'done-s' : (s2==='done-s'?'active':'');
    const s4done = sel.every(f => f.elementType);
    const s4 = (col==='customers'||(A.cmsItemId||(A.isNew&&A.newItemName))) ? (s4done?'done-s':'active') : '';

    let h = `<div class="cm-ap"><div class="cm-ap-bar"></div><div class="cm-ap-body">`;
    h += `<div class="cm-ap-title">Assign ${sel.length} File${sel.length>1?'s':''}</div>`;
    h += `<div class="cm-ap-sub">Shared fields apply to all · Tag each file's element individually</div>`;
    h += `<div class="cm-steps">
      <span class="cm-step ${s1}">1 Type</span><span class="cm-step-arr">→</span>
      <span class="cm-step ${s2}">2 Customer</span><span class="cm-step-arr">→</span>
      <span class="cm-step ${s3}">3 Item</span><span class="cm-step-arr">→</span>
      <span class="cm-step ${s4}">4 Tag</span>
    </div>`;

    // Step 1: Product Type
    h += `<div class="cm-fr"><div class="cm-ff">
      <label class="cm-fl">Product Type <span class="req">*</span></label>
      <select class="cm-fsel ${A.productType?'changed':''}" onchange="cmSetPT(this.value)">
        <option value="">Select type…</option>
        <optgroup label="Articles">${PRODUCT_TYPES.filter(p=>p.collection==='articles').map(p=>`<option value="${p.id}" ${p.id===A.productType?'selected':''}>${p.label}</option>`).join('')}</optgroup>
        <optgroup label="Ads">${PRODUCT_TYPES.filter(p=>p.collection==='ads').map(p=>`<option value="${p.id}" ${p.id===A.productType?'selected':''}>${p.label}</option>`).join('')}</optgroup>
        <optgroup label="Other">${PRODUCT_TYPES.filter(p=>!['articles','ads'].includes(p.collection)).map(p=>`<option value="${p.id}" ${p.id===A.productType?'selected':''}>${p.label}</option>`).join('')}</optgroup>
      </select>
    </div></div>`;

    if (!A.productType) { h += renderSubBar(sel); h += `</div></div>`; el.innerHTML=h; return; }

    // Step 2: Customer
    if (pt.reqCust) {
      h += `<div class="cm-fr"><div class="cm-ff">
        <label class="cm-fl">Customer <span class="req">*</span></label>
        <select class="cm-fsel ${A.customerId?'changed':A.customerId===''&&A.productType?'':''}" onchange="cmSetCust(this.value)">
          <option value="">Select customer…</option>
          <option value="__none__" ${A.customerId==='__none__'?'selected':''}>— No Customer / Unsponsored</option>
          ${CUSTOMERS.map(c=>`<option value="${c.id}" ${c.id===A.customerId?'selected':''}>${esc(c.name)}</option>`).join('')}
          <option disabled>───────────</option>
          <option value="__new__">+ New Customer</option>
        </select>
      </div></div>`;
      if (A.nestedOpen) {
        h += `<div class="cm-nested"><div class="cm-nested-hdr"><span>+ New Customer</span><button class="cm-nested-close" onclick="cmCloseNested()">✕</button></div>
          <div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Business Name <span class="req">*</span></label>
          <input class="cm-finp ${A.nestedName?'changed':''}" type="text" value="${esc(A.nestedName)}" oninput="cmNestedName(this.value)" placeholder="Business name…"></div></div>
          <div style="text-align:right;margin-top:4px"><button class="cm-sub-btn" ${A.nestedName?'':'disabled'} onclick="cmCreateCust()">Create Customer</button></div>
        </div>`;
      }
      if (pt.reqCust && !A.customerId) { h += renderSubBar(sel); h += `</div></div>`; el.innerHTML=h; return; }
      // Note: __none__ = "No Customer / Unsponsored" — counts as a valid selection
    }

    // Step 3: CMS Item
    if (col !== 'customers') {
      const items = getCMSItems(col, A.customerId);
      if (A.isNew) {
        h += `<div class="cm-fr"><div class="cm-ff"><label class="cm-fl">New ${pt.label} Name <span class="req">*</span></label>
          <input class="cm-finp ${A.newItemName?'changed':''}" type="text" value="${esc(A.newItemName)}" oninput="cmNewItemName(this.value)" placeholder="Name…">
        </div></div>
        <div style="margin-bottom:8px"><button class="cm-link-btn" onclick="cmBackToExisting()">← back to existing</button></div>`;
      } else {
        h += `<div class="cm-fr"><div class="cm-ff"><label class="cm-fl">Assign To <span class="req">*</span></label>
          <select class="cm-fsel ${A.cmsItemId?'changed':''}" onchange="cmSetItem(this.value)">
            <option value="">Select ${pt.label.toLowerCase()}…</option>
            ${items.map(i=>`<option value="${i.id}" ${i.id===A.cmsItemId?'selected':''}>${esc(i.name)}</option>`).join('')}
          </select>
        </div></div>`;
        if (!items.length) {
          h += `<div class="cm-no-results"><span>No items found${A.customerId?' for this customer':''}</span><button onclick="cmStartNew()">+ Create New</button></div>`;
        } else {
          h += `<div style="margin-bottom:8px"><button class="cm-link-btn" onclick="cmStartNew()">+ or create new ${pt.label.toLowerCase()}</button></div>`;
        }
      }
      if (!A.cmsItemId && !(A.isNew && A.newItemName)) { h += renderSubBar(sel); h += `</div></div>`; el.innerHTML=h; return; }
    }

    // Step 4: Element type per file
    const etypes = ETYPES[col] || [];
    if (etypes.length) {
      h += `<div class="cm-file-tag-list"><div class="cm-file-tag-label">Tag Each File's Element Type</div>`;
      sel.forEach(f => {
        const icon = FILE_ICONS[f.mime] || '📄';
        h += `<div class="cm-file-tag-row ${f.elementType?'tagged':''}">
          <span class="cm-file-tag-icon">${icon}</span>
          <span class="cm-file-tag-name">${esc(f.name)}</span>
          <div class="cm-echips">${etypes.map(t=>`<span class="cm-echip ${t.id===f.elementType?'sel':''}" onclick="cmTagFile('${f.id}','${t.id}')">${t.l}</span>`).join('')}</div>
        </div>`;
      });
      h += `</div>`;
    }

    h += renderSubBar(sel);
    h += `</div></div>`;
    el.innerHTML = h;
  }

  function renderSubBar(sel) {
    const ok = checkReady(sel);
    const tagged = sel.filter(f => f.elementType).length;
    return `<div class="cm-sub-bar">
      <button class="cm-cancel" onclick="cmResetAssign()">✕ reset</button>
      <div class="cm-sub-right">
        <span class="cm-sub-info">${tagged}/${sel.length} tagged${ok?' — ready':''}</span>
        <button class="cm-sub-btn" ${ok?'':'disabled'} onclick="cmSubmit()">Assign ${sel.length} File${sel.length>1?'s':''} ✓</button>
      </div>
    </div>`;
  }

  function checkReady(sel) {
    if (!A.productType) return false;
    const pt = getPT(A.productType); if (!pt) return false;
    if (pt.reqCust && !A.customerId) return false; // empty string = not selected; __none__ = valid
    const col = pt.collection;
    if (col !== 'customers' && !A.cmsItemId && !(A.isNew && A.newItemName)) return false;
    return sel.every(f => f.elementType);
  }

  function getCMSItems(col, custId) {
    let items = col==='articles' ? ARTICLES : col==='ads' ? ADS : col==='events' ? EVENTS : col==='re' ? RE : [];
    if (custId) items = items.filter(i => !i.customerId || i.customerId === custId);
    return items;
  }

  // ── Actions exposed to inline handlers ──
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
    A = { productType:'', customerId:'', cmsItemId:'', isNew:false, newItemName:'', nestedOpen:false, nestedName:'' };
    render();
  };

  window.cmSetPT = val => {
    A = { productType:val, customerId:'', cmsItemId:'', isNew:false, newItemName:'', nestedOpen:false, nestedName:'' };
    // Auto-guess element types
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
  window.cmNestedName  = v => { A.nestedName=v; render(); };

  window.cmCreateCust = () => {
    if (!A.nestedName) return;
    // In production: POST to Make to create Webflow Customer CMS item
    // For now: add to local array and select
    const nid = 'new-'+Date.now();
    CUSTOMERS.push({ id:nid, name:A.nestedName });
    A.customerId=nid; A.nestedOpen=false; A.nestedName='';
    render();
  };

  window.cmSetItem = val => { A.cmsItemId=val; render(); };
  window.cmStartNew = () => { A.isNew=true; A.newItemName=''; render(); };
  window.cmBackToExisting = () => { A.isNew=false; A.newItemName=''; render(); };
  window.cmNewItemName = v => { A.newItemName=v; render(); };

  window.cmTagFile = (fid, etype) => {
    const f = FILES.find(x => x.id===fid);
    if (f) { f.elementType=etype; render(); }
  };

  window.cmResetAssign = () => {
    A = { productType:'', customerId:'', cmsItemId:'', isNew:false, newItemName:'', nestedOpen:false, nestedName:'' };
    FILES.filter(f=>f.selected).forEach(f => f.elementType='');
    render();
  };

  window.cmSubmit = () => {
    const sel = FILES.filter(f => f.selected && !f.assigned);
    if (!checkReady(sel)) return;
    const pt = getPT(A.productType);

    sel.forEach(f => {
      const payload = {
        titleSlug:    CFG.titleSlug,
        taItemId:     CFG.taItemId,
        fileId:       f.fileId,
        fileName:     f.name,
        uploadcareUuid: f.uuid,
        mimeType:     f.mime,
        productType:  A.productType,
        customerId:   A.customerId,
        cmsItemId:    A.cmsItemId || '',
        newItemName:  A.newItemName || '',
        isNew:        A.isNew,
        elementType:  f.elementType,
        collection:   pt?.collection || '',
      };

      // ── PLACEHOLDER: Make webhook call goes here ──
      // Once field mapping decided, replace console.log with:
      // const qs = new URLSearchParams(payload);
      // fetch(window.TA_CONFIG.makeAssembly + '?' + qs.toString(), { method:'GET', mode:'no-cors' });
      console.log('[CM ASSIGN]', payload);

      f.assigned = true;
      f.selected = false;
    });

    A = { productType:'', customerId:'', cmsItemId:'', isNew:false, newItemName:'', nestedOpen:false, nestedName:'' };
    render();
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
