// ============================================================
// PUBPLAN TILE UI — v5.0.25
// Changes from v5.0.24:
//   FIX #25: Events (EV) section — 4 event slots + 1 section
//            sponsor. initEvState() reads .ev-slot-wrapper,
//            initEvSponsor() reads .ev-picker-wrapper. Sponsor
//            strip above tile grid. Event dropdown from
//            .events-wrapper library. Drawer shows event detail
//            fields. Submit posts per-slot + sponsor-level.
// Changes from v5.0.23:
//   FIX #24: Super Short Greeting field (data-greeting-supershort)
//            added to GR tile — 140 char max, required for green
//            slot indicator, posts as hidden-gr-supershort
// Changes from v5.0.14:
//   FIX #22: TF category follows BA tile pattern — saved category
//            shows as frozen text + edit pencil. Edit click opens
//            dropdown with current value + cancel link. Category
//            change shows inline confirm when existing value saved.
//            Dropdown selection toggles TXA/LBP slot visibility.
//            Save button gates on tfCategoryDirty (user action only).
//   FIX #23: LBP submit path includes hidden-category-id and
//            hidden-titleadmin-id (was missing in v14)
// Changes from v5.0.12:
//   FIX #18: LBP selection now marks LBP-1 dirty so Save activates
// Changes from v5.0.11:
//   FIX #15: Category-only save — TXA-1 marked dirty on category
//            change even when no slots have customers
//   FIX #16: has-pending class on FA, TS, TXA tiles when dirty
//            but not in full edit mode (matches BA pattern)
//   FIX #17: initLbpState reads pubplanId from TXA-1 wrapper;
//            initTxaState reads pubplanId for fallback slots
// Changes from v5.0.10:
//   FIX #14: TXA category dropdown replaces LBP/TXA mode toggle
// Prior fixes: #1-#13 (see v5.0.10 changelog)
// Multi-tenant | No hardcoded values | URLSearchParams payload
// HARDCODE TRACKER: see pubplan-hardcode-tracker.md
// ============================================================

window.toggleSection = function (section) {
  var el = document.getElementById('section-' + section);
  if (el) el.classList.toggle('collapsed');
};

(function () {
  'use strict';

  var WEBHOOK_URLS = window.PP_WEBHOOKS || {};
  if (!WEBHOOK_URLS.gr) console.warn('PubPlan: window.PP_WEBHOOKS not found.');

  const SECTION_ANCHORS = { gr:'gr-loc', em:'em-loc', fa:'fa-loc', ts:'ts-loc', ba:'ba-loc', tf:'tf-loc', ev:'ev-loc' };
  const GR_LIMITS = { grTit: 50, grMsg: 600, grSS: 140 };
  const EM_LIMITS = { emSub: 60, emPre: 100 };

  const state = {};
  const originalState = {};
  let currentTfMode = null;
  let tfCategoryId = '';
  let tfCategoryNm = '';
  let tfCategoryDirty = false;
  let tfOriginalCategoryId = '';
  let tfCategoryEditing = false;

  // EV sponsor state (section-level, not per-slot)
  let evSponsorId = '';
  let evSponsorNm = '';
  let evSponsorDirty = false;
  let evOriginalSponsorId = '';
  let evSponsorEditing = false;

  function getPubplanId() {
    var el = document.querySelector('.pubplan-slot-wrapper[data-pubplan-id]');
    return el ? el.dataset.pubplanId || '' : '';
  }
  function getTitleadminId() {
    var el = document.querySelector('.pubplan-slot-wrapper[data-titleadmin-id]');
    return el ? el.dataset.titleadminId || '' : '';
  }

  function showToast(msg, isError) {
    var t = document.getElementById('ppt-toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'ppt-toast show' + (isError ? ' error' : '');
    setTimeout(function () { t.classList.remove('show'); }, 3500);
  }
  function statusIcon(st, sym) { return '<div class="pio ' + st + '">' + sym + '</div>'; }
  function charCountHtml(max, val) {
    var r = Math.max(0, max - (val || '').length);
    var cls = 'pcc' + (r <= max * 0.1 ? ' danger' : r <= max * 0.2 ? ' warning' : '');
    return '<span class="' + cls + '">' + r + ' left</span>';
  }
  function updateCharCounter(el, key, lim) {
    var c = el.parentElement ? el.parentElement.querySelector('.pcc') : null;
    if (!c) return;
    var max = lim[key] || 100, r = Math.max(0, max - el.value.length);
    c.textContent = r + ' left';
    c.className = 'pcc' + (r <= max * 0.1 ? ' danger' : r <= max * 0.2 ? ' warning' : '');
  }

  function showInlineConfirm(anchor, msg, onYes, onNo) {
    var ex = document.querySelector('.ppt-inline-confirm');
    if (ex) ex.remove();
    var bar = document.createElement('div');
    bar.className = 'ppt-inline-confirm visible';
    bar.innerHTML = '<span>' + msg + '</span><span class="ppt-inline-confirm-yes">Yes, continue</span><span class="ppt-inline-confirm-no">Cancel</span>';
    bar.querySelector('.ppt-inline-confirm-yes').addEventListener('click', function () { bar.remove(); onYes(); });
    bar.querySelector('.ppt-inline-confirm-no').addEventListener('click', function () { bar.remove(); if (onNo) onNo(); });
    var p = anchor.closest('.pc') || anchor.parentElement;
    if (p && p.parentElement) p.parentElement.insertBefore(bar, p.nextSibling);
    else anchor.insertAdjacentElement('afterend', bar);
  }

  function updateSlotIndicators(sec, count, fn) {
    var c = document.getElementById(sec + '-indicators');
    if (!c) return;
    var h = '';
    for (var i = 1; i <= count; i++) {
      var code = (sec + '-' + i).toUpperCase(), ready = fn(code);
      h += '<div class="ppt-slot-dot ' + (ready ? 'ready' : 'empty') + '">' + i + '</div>';
    }
    c.innerHTML = h;
  }
  function updateSaveButton(sec, pending) {
    var b = document.getElementById(sec + '-submit-btn');
    if (b) b.className = 'ppt-submit-btn' + (pending ? ' active' : '');
  }

  window.tD = function (sc) {
    var d = document.getElementById('drawer-' + sc), t = document.getElementById('tile-' + sc);
    var ch = t ? t.querySelector('.pch') : null;
    if (d) { d.classList.toggle('open'); if (ch) ch.classList.toggle('open'); }
  };

  // ═══ GREETING (GR) ═══
  function initGrState() {
    var el = document.querySelector('.pubplan-slot-wrapper[data-section-code="gr"]');
    state['GR-1'] = { sc: el ? el.dataset.slotCode || 'GR-1' : 'GR-1', secC: 'gr', slotNum: 1, section: 'Greeting', pubplanId: el ? el.dataset.pubplanId || '' : '', titleadminId: el ? el.dataset.titleadminId || '' : '', grTit: el ? el.dataset.greetingTitle || '' : '', grMsg: el ? el.dataset.greetingMessage || '' : '', grSS: el ? el.dataset.greetingSupershort || '' : '', dirty: false };
  }
  function renderGr() {
    var s = state['GR-1']; if (!s) return;
    var isEd = s.dirty || !!originalState['GR-1'], hasC = s.grTit || s.grMsg || s.grSS, fh, ssRow = '';
    if (isEd) {
      fh = '<div class="pc" style="flex:1;"><span class="ppt-col-label">Greeting Title</span><input type="text" class="pi" data-field="grTit" maxlength="'+GR_LIMITS.grTit+'" value="'+(s.grTit||'').replace(/"/g,'&quot;')+'" placeholder="title...">'+charCountHtml(GR_LIMITS.grTit,s.grTit)+'</div><div class="pc" style="flex:2;"><span class="ppt-col-label">Greeting Message</span><textarea class="ppt-textarea" data-field="grMsg" maxlength="'+GR_LIMITS.grMsg+'" placeholder="message...">'+(s.grMsg||'')+'</textarea>'+charCountHtml(GR_LIMITS.grMsg,s.grMsg)+'</div>';
      ssRow = '<div class="gr-ss-row" style="grid-column:1/-1;display:flex;align-items:flex-start;gap:8px;padding:6px 0 2px 60px;border-top:1px dashed rgba(196,163,90,0.3);margin-top:4px;"><div class="pc" style="flex:1;max-width:480px;"><span class="ppt-col-label">Super Short Greeting</span><input type="text" class="pi" data-field="grSS" maxlength="'+GR_LIMITS.grSS+'" value="'+(s.grSS||'').replace(/"/g,'&quot;')+'" placeholder="140 char max...">'+charCountHtml(GR_LIMITS.grSS,s.grSS)+'</div></div>';
    } else if (hasC) {
      fh = '<div class="pc" style="flex:1;"><span class="ppt-col-label">Greeting Title</span><span class="pcv">'+(s.grTit||'—')+'</span></div><div class="pc" style="flex:2;"><span class="ppt-col-label">Greeting Message</span><span class="pcv">'+(s.grMsg||'—')+'</span></div>';
      ssRow = '<div class="gr-ss-row" style="grid-column:1/-1;display:flex;align-items:flex-start;gap:8px;padding:4px 0 2px 60px;border-top:1px dashed rgba(196,163,90,0.3);margin-top:4px;"><div class="pc" style="flex:1;"><span class="ppt-col-label">Super Short</span><span class="pcv">'+(s.grSS||'—')+'</span></div></div>';
    } else {
      fh = '<div class="pc" style="flex:1;"><span style="color:#ccc;">No greeting set. Click edit to add.</span></div>';
    }
    var ah = isEd ? '<a class="ppt-cancel-lnk visible" data-action="cancel-gr">cancel</a>' : '<a class="pei" data-action="edit-gr" title="Edit">✎</a>';
    var html = '<div class="ptr grr'+(isEd?' hp':'')+'" id="tile-gr-1"><div class="psi sgr">GR-1</div>'+fh+'<div class="pac">'+ah+'</div>'+ssRow+'</div>';
    var ex = document.getElementById('tile-gr-1');
    if (ex) ex.outerHTML = html; else { var g = document.getElementById('gr-grid'); if (g) g.insertAdjacentHTML('beforeend', html); }
    bindGrEvents();
  }
  function bindGrEvents() {
    var t = document.getElementById('tile-gr-1'); if (!t) return;
    t.querySelectorAll('input[data-field],textarea[data-field]').forEach(function(inp) {
      inp.addEventListener('input', function() { var s=state['GR-1']; if(!s)return; s[inp.dataset.field]=inp.value; s.dirty=true; updateCharCounter(inp,inp.dataset.field,GR_LIMITS); updateGrProgress(); });
    });
    var eb = t.querySelector('[data-action="edit-gr"]');
    if (eb) eb.addEventListener('click', function() { var s=state['GR-1']; if(!s)return; originalState['GR-1']=Object.assign({},s); s.dirty=true; renderGr(); updateGrProgress(); });
    var cb = t.querySelector('[data-action="cancel-gr"]');
    if (cb) cb.addEventListener('click', function() { var s=state['GR-1'],o=originalState['GR-1']; if(s&&o){Object.assign(s,o);s.dirty=false;delete originalState['GR-1'];} renderGr(); updateGrProgress(); });
  }
  function updateGrProgress() { updateSlotIndicators('gr',1,function(c){var s=state[c];return!!(s&&s.grTit&&s.grMsg&&s.grSS);}); var s=state['GR-1']; updateSaveButton('gr',s&&s.dirty); }

  // ═══ EMAIL (EM) ═══
  function initEmState() {
    var el = document.querySelector('.pubplan-slot-wrapper[data-section-code="em"]');
    state['EM-1'] = { sc: el ? el.dataset.slotCode || 'EM-1' : 'EM-1', secC: 'em', slotNum: 1, section: 'Email', pubplanId: el ? el.dataset.pubplanId || '' : '', titleadminId: el ? el.dataset.titleadminId || '' : '', emSub: el ? el.dataset.emailSubject || '' : '', emPre: el ? el.dataset.emailPreview || '' : '', dirty: false };
  }
  function renderEm() {
    var s = state['EM-1']; if (!s) return;
    var isEd = s.dirty || !!originalState['EM-1'], hasC = s.emSub || s.emPre, fh;
    if (isEd) {
      fh = '<div class="pc" style="flex:1;"><span class="ppt-col-label">Email Subject</span><input type="text" class="pi" data-field="emSub" maxlength="'+EM_LIMITS.emSub+'" value="'+(s.emSub||'').replace(/"/g,'&quot;')+'" placeholder="subject...">'+charCountHtml(EM_LIMITS.emSub,s.emSub)+'</div><div class="pc" style="flex:1;"><span class="ppt-col-label">Email Preview</span><input type="text" class="pi" data-field="emPre" maxlength="'+EM_LIMITS.emPre+'" value="'+(s.emPre||'').replace(/"/g,'&quot;')+'" placeholder="preview...">'+charCountHtml(EM_LIMITS.emPre,s.emPre)+'</div>';
    } else if (hasC) {
      fh = '<div class="pc" style="flex:1;"><span class="ppt-col-label">Email Subject</span><span class="pcv">'+(s.emSub||'—')+'</span></div><div class="pc" style="flex:1;"><span class="ppt-col-label">Email Preview</span><span class="pcv">'+(s.emPre||'—')+'</span></div>';
    } else {
      fh = '<div class="pc" style="flex:1;"><span style="color:#ccc;">No email settings. Click edit to add.</span></div>';
    }
    var ah = isEd ? '<a class="ppt-cancel-lnk visible" data-action="cancel-em">cancel</a>' : '<a class="pei" data-action="edit-em" title="Edit">✎</a>';
    var html = '<div class="ptr emr'+(isEd?' hp':'')+'" id="tile-em-1"><div class="psi sem">EM-1</div>'+fh+'<div class="pac">'+ah+'</div></div>';
    var ex = document.getElementById('tile-em-1');
    if (ex) ex.outerHTML = html; else { var g = document.getElementById('em-grid'); if (g) g.insertAdjacentHTML('beforeend', html); }
    bindEmEvents();
  }
  function bindEmEvents() {
    var t = document.getElementById('tile-em-1'); if (!t) return;
    t.querySelectorAll('input[data-field]').forEach(function(inp) {
      inp.addEventListener('input', function() { var s=state['EM-1']; if(!s)return; s[inp.dataset.field]=inp.value; s.dirty=true; updateCharCounter(inp,inp.dataset.field,EM_LIMITS); updateEmProgress(); });
    });
    var eb = t.querySelector('[data-action="edit-em"]');
    if (eb) eb.addEventListener('click', function() { var s=state['EM-1']; if(!s)return; originalState['EM-1']=Object.assign({},s); s.dirty=true; renderEm(); updateEmProgress(); });
    var cb = t.querySelector('[data-action="cancel-em"]');
    if (cb) cb.addEventListener('click', function() { var s=state['EM-1'],o=originalState['EM-1']; if(s&&o){Object.assign(s,o);s.dirty=false;delete originalState['EM-1'];} renderEm(); updateEmProgress(); });
  }
  function updateEmProgress() { updateSlotIndicators('em',1,function(c){var s=state[c];return!!(s&&s.emSub&&s.emPre);}); var s=state['EM-1']; updateSaveButton('em',s&&s.dirty); }

  // ═══ OPTION BUILDERS ═══
  function buildCustomerOptions(selId, ph) {
    var els = document.querySelectorAll('.customers-wrapper'), all = [];
    els.forEach(function(el) { if (el.dataset.id) all.push({id:el.dataset.id, name:el.dataset.name||'(unnamed)'}); });
    if (!all.length) return '<option value="" disabled selected>No options</option>';
    return '<option value="" disabled'+ (!selId?' selected':'') +'>'+(ph||'Select customer...')+'</option>' +
      all.sort(function(a,b){return a.name.localeCompare(b.name);}).map(function(c){return '<option value="'+c.id+'"'+(c.id===selId?' selected':'')+'>'+c.name+'</option>';}).join('');
  }
  function buildCategoryOptions(grp, selId) {
    var els = document.querySelectorAll('.products-wrapper');
    var GM = { 'FA':['FA','Feature Article','Feature Articles'], 'TS':['TS','Themed Spotlight','Themed Spotlights'], 'TF':['TF','The Find','tf'] };
    var vg = GM[grp]||[grp], cats = [];
    els.forEach(function(el) { if (vg.indexOf(el.dataset.group)!==-1 && el.dataset.id) cats.push({id:el.dataset.id,name:el.dataset.name||'(unnamed)',type:el.dataset.type||''}); });
    if (!cats.length) return '<option value="" disabled selected>No categories</option>';
    cats.sort(function(a,b){return a.name.localeCompare(b.name);});
    return '<option value="" disabled'+(!selId?' selected':'')+'>Select category...</option>'+cats.map(function(c){return '<option value="'+c.id+'" data-type="'+c.type+'"'+(c.id===selId?' selected':'')+'>'+c.name+'</option>';}).join('');
  }

  // FIX #14: Unified TF category dropdown (LBP + TXA categories)
  function buildTfCategoryDropdown(selVal) {
    var els = document.querySelectorAll('.products-wrapper');
    var lbpItems = [], txaItems = [];
    els.forEach(function(el) {
      if (['TF','The Find','tf'].indexOf(el.dataset.group) !== -1 && el.dataset.id) {
        var item = { id: el.dataset.id, name: el.dataset.name || '(unnamed)', type: el.dataset.type || '', secCode: el.dataset.sectionCode || '' };
        if (item.secCode === 'lbp') lbpItems.push(item);
        else txaItems.push(item);
      }
    });
    lbpItems.sort(function(a, b) { return a.name.localeCompare(b.name); });
    txaItems.sort(function(a, b) { return a.name.localeCompare(b.name); });
    var h = '<option value="" disabled' + (!selVal ? ' selected' : '') + '>Select category...</option>';
    lbpItems.forEach(function(c) {
      h += '<option value="' + c.id + '" data-sec-code="lbp"' + (c.id === selVal ? ' selected' : '') + '>' + c.name + '</option>';
    });
    if (lbpItems.length && txaItems.length) h += '<option disabled>───────────</option>';
    txaItems.forEach(function(c) {
      h += '<option value="' + c.id + '" data-sec-code="txa"' + (c.id === selVal ? ' selected' : '') + '>' + c.name + '</option>';
    });
    return h;
  }

  function buildFaArticleOptions(custId, catId, selId) {
    var all = document.querySelectorAll('.articles-wrapper'), items = [];
    all.forEach(function(el) {
      if (el.dataset.articleCategoryCode !== 'fa') return;
      if (custId) { if (el.dataset.articleCustomerId !== custId) return; } else if (catId) { if (el.dataset.categoryId !== catId) return; }
      var id=el.dataset.articleId||'', nm=el.dataset.articleTitle||''; if (id&&nm) items.push({id:id,name:nm});
    });
    if (!items.length) return '<option value="" disabled selected>No articles</option>';
    items.sort(function(a,b){return a.name.localeCompare(b.name);});
    return '<option value="" disabled'+(!selId?' selected':'')+'>Select article...</option>'+items.map(function(a){return '<option value="'+a.id+'"'+(a.id===selId?' selected':'')+'>'+a.name+'</option>';}).join('');
  }
  function buildTsArticleOptions(custId, catId, selId) {
    var all = document.querySelectorAll('.articles-wrapper'), items = [];
    all.forEach(function(el) {
      if (el.dataset.articleCategoryCode !== 'ts') return;
      if (custId) { if (el.dataset.articleCustomerId !== custId) return; } else if (catId) { if (el.dataset.categoryId !== catId) return; }
      var id=el.dataset.articleId||'', nm=el.dataset.articleTitle||''; if (id&&nm) items.push({id:id,name:nm});
    });
    if (!items.length) return '<option value="" disabled selected>No articles</option>';
    items.sort(function(a,b){return a.name.localeCompare(b.name);});
    return '<option value="" disabled'+(!selId?' selected':'')+'>Select article...</option>'+items.map(function(a){return '<option value="'+a.id+'"'+(a.id===selId?' selected':'')+'>'+a.name+'</option>';}).join('');
  }
  function buildAdOptions(custId, selId) {
    var els = document.querySelectorAll('.ads-wrapper'), all = [];
    els.forEach(function(el) { var id=el.dataset.adId; if(id) all.push({id:id,name:el.dataset.adName||el.dataset.adTitle||el.dataset.name||'(untitled)',custId:el.dataset.adCustomerId||el.dataset.customerId||''}); });
    var f = all.filter(function(a){return !custId||a.custId===custId;});
    if (!f.length) return '<option value="" disabled selected>No ads</option>';
    return '<option value="" disabled'+(!selId?' selected':'')+'>Select ad...</option>'+f.sort(function(a,b){return a.name.localeCompare(b.name);}).map(function(a){return '<option value="'+a.id+'"'+(a.id===selId?' selected':'')+'>'+a.name+'</option>';}).join('');
  }
  function getCatType(catId) { if(!catId)return''; var el=document.querySelector('.products-wrapper[data-id="'+catId+'"]'); return el?el.dataset.type||'':''; }

  // ═══ FEATURE ARTICLES (FA) — 4 slots ═══
  function initFaState() {
    var slotEls = document.querySelectorAll('.pubplan-slot-wrapper[data-section-code="fa"]');
    slotEls.forEach(function(el) {
      var code = el.dataset.slotCode; if (!code) return;
      var faCatId = el.dataset.catId || '';
      var faCatNm = el.dataset.catLabel || '';
      if (faCatId && !faCatNm) { var p = document.querySelector('.products-wrapper[data-id="'+faCatId+'"]'); if (p) faCatNm = p.dataset.name || ''; }
      var faArtId = el.dataset.articleId || '', faArtNm = el.dataset.articleTitle || '';
      if (faArtId && !faArtNm) { var a = document.querySelector('.articles-wrapper[data-article-id="'+faArtId+'"]'); if (a) faArtNm = a.dataset.articleTitle || ''; }
      var faNlSpon = el.dataset.nlSponsored || '';
      var faIsSponCat = getCatType(faCatId).toLowerCase().indexOf('sponsor') !== -1;
      var faNoSponDefault = faIsSponCat && (faNlSpon === '' || faNlSpon.toLowerCase() === 'neither');
      state[code] = { sc:code, secC:'fa', section:el.dataset.section||'Feature Article', slotNum:parseInt(code.replace(/\D/g,''),10), pubplanId:el.dataset.pubplanId||'', titleadminId:el.dataset.titleadminId||'', catId:faCatId, catNm:faCatNm, catType:getCatType(faCatId), artId:faArtId, artNm:faArtNm, custId:el.dataset.customerId||'', custNm:el.dataset.customerName||'', sponsorId:el.dataset.sponsorId||'', sponNm:el.dataset.sponsorName||'', artAdId:el.dataset.artAdId||'', artAdUrl:el.dataset.artAdUrl||'', artAdGo:el.dataset.artAdGo||'', nlSponsored:faNlSpon, noSponsor:faNoSponDefault, catChanged:false, dirty:false };
    });
    for (var i=1;i<=4;i++) { var c='FA-'+i; if(!state[c]) state[c]={sc:c,secC:'fa',slotNum:i,section:'Feature Article',pubplanId:'',titleadminId:'',catId:'',catNm:'',catType:'',artId:'',artNm:'',custId:'',custNm:'',sponsorId:'',sponNm:'',artAdId:'',artAdUrl:'',artAdGo:'',nlSponsored:'',noSponsor:false,catChanged:false,dirty:false}; }
  }

  function getFaPickerData(n) {
    var p = document.querySelector('.fa-picker-wrapper'); if (!p) return {};
    var px = 'fa'+n, s = state['FA-'+n];
    var artEl = (s&&s.artId) ? document.querySelector('.articles-wrapper[data-article-id="'+s.artId+'"]') : null;
    return { artImgGet:artEl?artEl.dataset.artImgGet||'':'', artWfImg:artEl?artEl.dataset.imageUrl||'':'', adImgGet:p.dataset[px+'ArtAdGet']||'', adGoLink:p.dataset[px+'ArtAdGo']||'', artPgSet:(artEl&&(artEl.dataset.showArtAd==='Show'||artEl.dataset.showArtAd==='true'))?'true':'', nlPgSet:p.dataset[px+'NlPgSet']||'', sponsored:p.dataset[px+'SponsoredStatus']||'' };
  }

  function buildFaDrawer(sc) {
    var s=state[sc]; if(!s) return '';
    var d=getFaPickerData(s.slotNum), artEl=s.artId?document.querySelector('.articles-wrapper[data-article-id="'+s.artId+'"]'):null;
    var fields = [
      {l:'Summary',v:(artEl&&artEl.dataset.articleSummary)?artEl.dataset.articleSummary:'—',s:(artEl&&artEl.dataset.articleSummary)?'ok':'bad'},
      {l:'Body',v:(artEl&&artEl.dataset.articleBody)?'Present':'—',s:(artEl&&artEl.dataset.articleBody)?'ok':'bad'},
      {l:'Writer',v:(artEl&&artEl.dataset.writerName)?artEl.dataset.writerName:'—',s:(artEl&&artEl.dataset.writerName)?'ok':'bad'},
      {l:'CoWriter',v:(artEl&&artEl.dataset.cowriterName)?artEl.dataset.cowriterName:'—',s:(artEl&&artEl.dataset.cowriterName)?'ok':'na'},
      {l:'Image',v:d.artWfImg?'Present':'—',s:d.artWfImg?'ok':'bad'},
      {l:'Img GET',v:d.artImgGet?'Present':'—',s:d.artImgGet?'ok':'bad'},
      {l:'Type',v:(artEl&&artEl.dataset.articleType)?artEl.dataset.articleType:'—',s:(artEl&&artEl.dataset.articleType)?'ok':'bad'},
      {l:'Ad Stat',v:d.artPgSet?'ON':'OFF',s:d.artPgSet?'ok':'na'},
      {l:'Ad Img',v:d.adImgGet?'Present':'—',s:d.adImgGet?'ok':((s.custId||s.sponsorId)?'bad':'na')},
      {l:'Ad Go',v:d.adGoLink?'Present':'—',s:d.adGoLink?'ok':((s.custId||s.sponsorId)?'bad':'na')}
    ];
    var fh = fields.map(function(f){var ic=f.s==='ok'?'✓':(f.s==='bad'?'✕':'—');return '<div class="pdr-field"><span class="pdr-label">'+f.l+'</span><span class="pdr-value">'+f.v+'</span></div><div class="pdr-status">'+statusIcon(f.s,ic)+'</div>';}).join('');
    return '<div class="pdr" id="drawer-'+sc+'"><div class="pdr-grid">'+fh+'</div></div>';
  }

  function renderFa(sc) {
    var s = state[sc]; if (!s) return;
    var isEd = (s.dirty && !s.sponDirtyOnly) || (!!originalState[sc] && !s.sponDirtyOnly);
    var isPaid = s.catType && s.catType.toLowerCase().indexOf('paid') !== -1;
    var isSpon = s.catType && s.catType.toLowerCase().indexOf('sponsor') !== -1;

    var catCol;
    if (!isEd) {
      catCol = s.catId
        ? '<div class="pc"><span class="ppt-col-label">Category</span><span class="pcp cfa">'+(s.catNm||'—')+'</span></div>'
        : '<div class="pc"><span class="ppt-col-label">Category</span><select class="pd" data-dropdown="fa-cat" data-sc="'+sc+'">'+buildCategoryOptions('FA','')+'</select></div>';
    } else {
      catCol = '<div class="pc"><span class="ppt-col-label">Category</span><select class="pd'+(s.catId?' hs':'')+'" data-dropdown="fa-cat" data-sc="'+sc+'">'+buildCategoryOptions('FA',s.catId)+'</select></div>';
    }

    var custCol = '';
    if (isPaid) {
      custCol = (!isEd && s.custId)
        ? '<div class="pc"><span class="ppt-col-label">Customer</span><span class="pcv">'+s.custNm+'</span></div>'
        : '<div class="pc"><span class="ppt-col-label">Customer</span><select class="pd'+(s.custId?' hs':'')+'" data-dropdown="fa-cust" data-sc="'+sc+'"'+(!s.catId?' disabled':'')+'>' + buildCustomerOptions(s.custId,'--') + '</select></div>';
    }

    var artDis = (!s.catId || (isPaid && !s.custId)) ? ' disabled' : '';
    var artCol = (!isEd && s.artId)
      ? '<div class="pc"><span class="ppt-col-label">Article</span><span class="pcv">'+s.artNm+'</span></div>'
      : '<div class="pc"><span class="ppt-col-label">Article</span><select class="pd'+(s.artId?' hs':'')+'" data-dropdown="fa-art" data-sc="'+sc+'"'+artDis+'>'+buildFaArticleOptions(isPaid?s.custId:'',s.catId,s.artId)+'</select></div>';

    var sponCol = '';
    if (isSpon) {
      var noSpHtml = '<label class="pxl pxl-right"><input type="checkbox" data-checkbox="fa-nospon" data-sc="'+sc+'"'+(s.noSponsor?' checked':'')+'>No Sponsor</label>';
      sponCol = s.noSponsor
        ? '<div class="pc"><span class="ppt-col-label">Sponsor'+noSpHtml+'</span><span class="pcv ns" style="font-style:italic;color:#999;">No sponsor</span></div>'
        : '<div class="pc"><span class="ppt-col-label">Sponsor'+noSpHtml+'</span><select class="pd'+(s.sponsorId?' hs':'')+'" data-dropdown="fa-spon" data-sc="'+sc+'">'+buildCustomerOptions(s.sponsorId,'Select sponsor...')+'</select></div>';
    } else if (!isPaid) {
      sponCol = '<div class="pc"><span class="ppt-col-label" style="visibility:hidden;">Sponsor</span></div>';
    }

    var actionHtml = '';
    if (isEd) { actionHtml += '<a class="ppt-cancel-lnk visible" data-action="cancel-fa" data-sc="'+sc+'">cancel</a>'; }
    else if (s.catId) { actionHtml += '<a class="pei" data-action="edit-fa" data-sc="'+sc+'" title="Edit">✎</a>'; }
    else { actionHtml += '<span style="color:#ccc;">—</span>'; }
    var chevHtml = '<span class="pch" data-action="toggle-drawer" data-sc="'+sc+'">▾</span>';

    var tCls = 'ptr' + (isEd ? ' hp' : (s.dirty && s.sponDirtyOnly ? ' spon-pending' : (s.dirty ? ' has-pending' : '')));
    var tileHtml = '<div class="'+tCls+'" id="tile-'+sc+'"><div class="psi sfa">'+sc+'</div>'+catCol+custCol+artCol+sponCol+'<div class="pac">'+actionHtml+chevHtml+'</div></div>';
    var drawerHtml = buildFaDrawer(sc);

    var ex = document.getElementById('tile-'+sc), exD = document.getElementById('drawer-'+sc);
    var dOpen = exD ? exD.classList.contains('open') : false;
    if (ex) { ex.outerHTML = tileHtml; if (exD) exD.remove(); }
    else { var g = document.getElementById('fa-grid'); if (g) g.insertAdjacentHTML('beforeend', tileHtml); }
    var nt = document.getElementById('tile-'+sc);
    if (nt) { nt.insertAdjacentHTML('afterend', drawerHtml); if (dOpen) { var d2=document.getElementById('drawer-'+sc); if(d2) d2.classList.add('open'); var ch2=nt.querySelector('.pch'); if(ch2) ch2.classList.add('open'); } }
    bindFaEvents(sc);
  }

  function renderAllFa() { for(var i=1;i<=4;i++) renderFa('FA-'+i); updateFaProgress(); }

  function bindFaEvents(sc) {
    var t = document.getElementById('tile-'+sc); if (!t) return;
    var cs = t.querySelector('[data-dropdown="fa-cat"][data-sc="'+sc+'"]');
    if (cs) cs.addEventListener('change', function(){handleFaCatChange(sc,cs);});
    var cu = t.querySelector('[data-dropdown="fa-cust"][data-sc="'+sc+'"]');
    if (cu) cu.addEventListener('change', function(){handleFaCustChange(sc,cu);});
    var ar = t.querySelector('[data-dropdown="fa-art"][data-sc="'+sc+'"]');
    if (ar) ar.addEventListener('change', function(){handleFaArtChange(sc,ar);});
    var sp = t.querySelector('[data-dropdown="fa-spon"][data-sc="'+sc+'"]');
    if (sp) sp.addEventListener('change', function(){handleFaSponChange(sc,sp);});
    var ns = t.querySelector('[data-checkbox="fa-nospon"][data-sc="'+sc+'"]');
    if (ns) ns.addEventListener('change', function(){handleFaNoSponChange(sc,ns);});
    var eb = t.querySelector('[data-action="edit-fa"][data-sc="'+sc+'"]');
    if (eb) eb.addEventListener('click', function(){var s=state[sc];if(!s)return;originalState[sc]=Object.assign({},s);s.dirty=true;s.sponDirtyOnly=false;renderFa(sc);updateFaProgress();});
    var cb = t.querySelector('[data-action="cancel-fa"][data-sc="'+sc+'"]');
    if (cb) cb.addEventListener('click', function(){var s=state[sc],o=originalState[sc];if(s&&o){Object.assign(s,o);s.dirty=false;s.catChanged=false;s.sponDirtyOnly=false;delete originalState[sc];}renderFa(sc);updateFaProgress();});
    var ch = t.querySelector('[data-action="toggle-drawer"][data-sc="'+sc+'"]');
    if (ch) ch.addEventListener('click', function(){tD(sc);});
  }

  function handleFaCatChange(sc,sel){var s=state[sc];if(!s)return;var opt=sel.options[sel.selectedIndex],nid=opt?opt.value||'':'';if(!nid)return;var has=s.artId||s.custId||s.sponsorId;var doIt=function(){if(!originalState[sc])originalState[sc]=Object.assign({},s);s.catId=nid;s.catNm=opt?opt.textContent||'':'';s.catType=(opt&&opt.dataset)?opt.dataset.type||'':'';s.artId='';s.artNm='';s.custId='';s.custNm='';s.sponsorId='';s.sponNm='';s.catChanged=true;s.dirty=true;renderFa(sc);updateFaProgress();};if(has){showInlineConfirm(sel,'Changing category will clear article & sponsor.',doIt,function(){sel.value=s.catId||'';});}else{doIt();}}
  function handleFaCustChange(sc,sel){var s=state[sc];if(!s)return;var opt=sel.options[sel.selectedIndex],nid=opt?opt.value||'':'';var doIt=function(){if(!originalState[sc])originalState[sc]=Object.assign({},s);s.custId=nid;s.custNm=opt?opt.textContent||'':'';s.artId='';s.artNm='';s.dirty=true;renderFa(sc);updateFaProgress();};if(s.artId&&nid!==s.custId){showInlineConfirm(sel,'Changing customer will clear article selection.',doIt,function(){sel.value=s.custId||'';});}else{doIt();}}
  function handleFaArtChange(sc,sel){var s=state[sc];if(!s)return;if(!originalState[sc])originalState[sc]=Object.assign({},s);var opt=sel.options[sel.selectedIndex];s.artId=opt?opt.value||'':'';s.artNm=opt?opt.textContent||'':'';s.catChanged=false;s.dirty=true;renderFa(sc);updateFaProgress();}
  function handleFaSponChange(sc,sel){var s=state[sc];if(!s)return;if(!originalState[sc])originalState[sc]=Object.assign({},s);var opt=sel.options[sel.selectedIndex];s.sponsorId=opt?opt.value||'':'';s.sponNm=opt?opt.textContent||'':'';var o=originalState[sc];if(o&&s.sponsorId===o.sponsorId&&s.noSponsor===o.noSponsor){s.dirty=false;s.sponDirtyOnly=false;delete originalState[sc];}else{s.dirty=true;s.sponDirtyOnly=true;}renderFa(sc);updateFaProgress();}
  function handleFaNoSponChange(sc,cb){var s=state[sc];if(!s)return;if(!originalState[sc])originalState[sc]=Object.assign({},s);s.noSponsor=cb.checked;if(cb.checked){s.sponsorId='';s.sponNm='';}var o=originalState[sc];if(o&&s.noSponsor===o.noSponsor&&s.sponsorId===o.sponsorId){s.dirty=false;s.sponDirtyOnly=false;delete originalState[sc];}else{s.dirty=true;s.sponDirtyOnly=true;}renderFa(sc);updateFaProgress();}
  function updateFaProgress(){updateSlotIndicators('fa',4,function(c){var s=state[c];if(!s||!s.artId||s.dirty)return false;var isSp=s.catType&&s.catType.toLowerCase().indexOf('sponsor')!==-1;if(isSp&&!s.sponsorId&&!s.noSponsor)return false;return true;});var pc=0;for(var i=1;i<=4;i++){var s=state['FA-'+i];if(s&&s.dirty)pc++;}updateSaveButton('fa',pc>0);}

  // ═══ THEMED SPOTLIGHTS (TS) — 4 slots ═══
  function initTsState() {
    var slotEls = document.querySelectorAll('.pubplan-slot-wrapper[data-section-code="ts"]');
    slotEls.forEach(function(el) {
      var code = el.dataset.slotCode; if (!code) return;
      var tsCatId = el.dataset.catId || '', tsCatNm = el.dataset.catLabel || '';
      if (tsCatId && !tsCatNm) { var p = document.querySelector('.products-wrapper[data-id="'+tsCatId+'"]'); if (p) tsCatNm = p.dataset.name || ''; }
      var tsArtId = el.dataset.articleId || '', tsArtNm = el.dataset.articleTitle || '';
      if (tsArtId && !tsArtNm) { var a = document.querySelector('.articles-wrapper[data-article-id="'+tsArtId+'"]'); if (a) tsArtNm = a.dataset.articleTitle || ''; }
      var tsNlSpon = el.dataset.nlSponsored || '';
      var tsIsSponCat = getCatType(tsCatId).toLowerCase().indexOf('sponsor') !== -1;
      var tsNoSponDefault = tsIsSponCat && (tsNlSpon === '' || tsNlSpon.toLowerCase() === 'neither');
      state[code] = { sc:code, secC:'ts', section:el.dataset.section||'Themed Spotlight', slotNum:parseInt(code.replace(/\D/g,''),10), pubplanId:el.dataset.pubplanId||'', titleadminId:el.dataset.titleadminId||'', catId:tsCatId, catNm:tsCatNm, catType:getCatType(tsCatId), artId:tsArtId, artNm:tsArtNm, custId:el.dataset.customerId||'', custNm:el.dataset.customerName||'', sponsorId:el.dataset.sponsorId||'', sponNm:el.dataset.sponsorName||'', artAdId:el.dataset.artAdId||'', artAdUrl:el.dataset.artAdUrl||'', artAdGo:el.dataset.artAdGo||'', nlSponsored:tsNlSpon, noSponsor:tsNoSponDefault, catChanged:false, dirty:false };
    });
    for (var i=1;i<=4;i++) { var c='TS-'+i; if(!state[c]) state[c]={sc:c,secC:'ts',slotNum:i,section:'Themed Spotlight',pubplanId:'',titleadminId:'',catId:'',catNm:'',catType:'',artId:'',artNm:'',custId:'',custNm:'',sponsorId:'',sponNm:'',artAdId:'',artAdUrl:'',artAdGo:'',nlSponsored:'',noSponsor:false,catChanged:false,dirty:false}; }
  }

  function getTsPickerData(n) {
    var p = document.querySelector('.ts-picker-wrapper'); if (!p) return {};
    var px = 'ts'+n, s = state['TS-'+n];
    var artEl = (s&&s.artId) ? document.querySelector('.articles-wrapper[data-article-id="'+s.artId+'"]') : null;
    return { artImgGet:artEl?artEl.dataset.artImgGet||'':'', artWfImg:artEl?artEl.dataset.imageUrl||'':'', adImgGet:p.dataset[px+'ArtAdGet']||'', adGoLink:p.dataset[px+'ArtAdGo']||'', artPgSet:(artEl&&(artEl.dataset.showArtAd==='Show'||artEl.dataset.showArtAd==='true'))?'true':'', nlPgSet:p.dataset[px+'NlPgSet']||'' };
  }

  function buildTsDrawer(sc) {
    var s=state[sc]; if(!s) return '';
    var d=getTsPickerData(s.slotNum), artEl=s.artId?document.querySelector('.articles-wrapper[data-article-id="'+s.artId+'"]'):null;
    var fields = [
      {l:'Summary',v:(artEl&&artEl.dataset.articleSummary)?artEl.dataset.articleSummary:'—',s:(artEl&&artEl.dataset.articleSummary)?'ok':'bad'},
      {l:'Body',v:(artEl&&artEl.dataset.articleBody)?'Present':'—',s:(artEl&&artEl.dataset.articleBody)?'ok':'bad'},
      {l:'Writer',v:(artEl&&artEl.dataset.writerName)?artEl.dataset.writerName:'—',s:(artEl&&artEl.dataset.writerName)?'ok':'bad'},
      {l:'CoWriter',v:(artEl&&artEl.dataset.cowriterName)?artEl.dataset.cowriterName:'—',s:(artEl&&artEl.dataset.cowriterName)?'ok':'na'},
      {l:'Image',v:d.artWfImg?'Present':'—',s:d.artWfImg?'ok':'bad'},
      {l:'Img GET',v:d.artImgGet?'Present':'—',s:d.artImgGet?'ok':'bad'},
      {l:'Type',v:(artEl&&artEl.dataset.articleType)?artEl.dataset.articleType:'—',s:(artEl&&artEl.dataset.articleType)?'ok':'bad'},
      {l:'Ad Stat',v:d.artPgSet?'ON':'OFF',s:d.artPgSet?'ok':'na'},
      {l:'Ad Img',v:d.adImgGet?'Present':'—',s:d.adImgGet?'ok':((s.custId||s.sponsorId)?'bad':'na')},
      {l:'Ad Go',v:d.adGoLink?'Present':'—',s:d.adGoLink?'ok':((s.custId||s.sponsorId)?'bad':'na')}
    ];
    var fh = fields.map(function(f){var ic=f.s==='ok'?'✓':(f.s==='bad'?'✕':'—');return '<div class="pdr-field"><span class="pdr-label">'+f.l+'</span><span class="pdr-value">'+f.v+'</span></div><div class="pdr-status">'+statusIcon(f.s,ic)+'</div>';}).join('');
    return '<div class="pdr" id="drawer-'+sc+'"><div class="pdr-grid">'+fh+'</div></div>';
  }

  function renderTs(sc) {
    var s = state[sc]; if (!s) return;
    var isEd = (s.dirty && !s.sponDirtyOnly) || (!!originalState[sc] && !s.sponDirtyOnly);
    var isPaid = s.catType && s.catType.toLowerCase().indexOf('paid') !== -1;
    var isSpon = s.catType && s.catType.toLowerCase().indexOf('sponsor') !== -1;

    var catCol;
    if (!isEd) {
      catCol = s.catId
        ? '<div class="pc"><span class="ppt-col-label">Category</span><span class="pcp cts">'+(s.catNm||'—')+'</span></div>'
        : '<div class="pc"><span class="ppt-col-label">Category</span><select class="pd" data-dropdown="ts-cat" data-sc="'+sc+'">'+buildCategoryOptions('TS','')+'</select></div>';
    } else {
      catCol = '<div class="pc"><span class="ppt-col-label">Category</span><select class="pd'+(s.catId?' hs':'')+'" data-dropdown="ts-cat" data-sc="'+sc+'">'+buildCategoryOptions('TS',s.catId)+'</select></div>';
    }

    var custCol = '';
    if (isPaid) {
      custCol = (!isEd && s.custId)
        ? '<div class="pc"><span class="ppt-col-label">Customer</span><span class="pcv">'+s.custNm+'</span></div>'
        : '<div class="pc"><span class="ppt-col-label">Customer</span><select class="pd'+(s.custId?' hs':'')+'" data-dropdown="ts-cust" data-sc="'+sc+'"'+(!s.catId?' disabled':'')+'>' + buildCustomerOptions(s.custId,'--') + '</select></div>';
    }

    var artDis = (!s.catId || (isPaid && !s.custId)) ? ' disabled' : '';
    var artCol = (!isEd && s.artId)
      ? '<div class="pc"><span class="ppt-col-label">Article</span><span class="pcv">'+s.artNm+'</span></div>'
      : '<div class="pc"><span class="ppt-col-label">Article</span><select class="pd'+(s.artId?' hs':'')+'" data-dropdown="ts-art" data-sc="'+sc+'"'+artDis+'>'+buildTsArticleOptions(isPaid?s.custId:'',s.catId,s.artId)+'</select></div>';

    var sponCol = '';
    if (isSpon) {
      var noSpHtml = '<label class="pxl pxl-right"><input type="checkbox" data-checkbox="ts-nospon" data-sc="'+sc+'"'+(s.noSponsor?' checked':'')+'>No Sponsor</label>';
      sponCol = s.noSponsor
        ? '<div class="pc"><span class="ppt-col-label">Sponsor'+noSpHtml+'</span><span class="pcv ns" style="font-style:italic;color:#999;">No sponsor</span></div>'
        : '<div class="pc"><span class="ppt-col-label">Sponsor'+noSpHtml+'</span><select class="pd'+(s.sponsorId?' hs':'')+'" data-dropdown="ts-spon" data-sc="'+sc+'">'+buildCustomerOptions(s.sponsorId,'Select sponsor...')+'</select></div>';
    } else if (!isPaid) {
      sponCol = '<div class="pc"><span class="ppt-col-label" style="visibility:hidden;">Sponsor</span></div>';
    }

    var actionHtml = '';
    if (isEd) { actionHtml += '<a class="ppt-cancel-lnk visible" data-action="cancel-ts" data-sc="'+sc+'">cancel</a>'; }
    else if (s.catId) { actionHtml += '<a class="pei" data-action="edit-ts" data-sc="'+sc+'" title="Edit">✎</a>'; }
    else { actionHtml += '<span style="color:#ccc;">—</span>'; }
    var chevHtml = '<span class="pch" data-action="toggle-drawer" data-sc="'+sc+'">▾</span>';

    var tCls = 'ptr tsr' + (isEd ? ' hp' : (s.dirty && s.sponDirtyOnly ? ' spon-pending' : (s.dirty ? ' has-pending' : '')));
    var tileHtml = '<div class="'+tCls+'" id="tile-'+sc+'"><div class="psi sts">'+sc+'</div>'+catCol+custCol+artCol+sponCol+'<div class="pac">'+actionHtml+chevHtml+'</div></div>';
    var drawerHtml = buildTsDrawer(sc);

    var ex = document.getElementById('tile-'+sc), exD = document.getElementById('drawer-'+sc);
    var dOpen = exD ? exD.classList.contains('open') : false;
    if (ex) { ex.outerHTML = tileHtml; if (exD) exD.remove(); }
    else { var g = document.getElementById('ts-grid'); if (g) g.insertAdjacentHTML('beforeend', tileHtml); }
    var nt = document.getElementById('tile-'+sc);
    if (nt) { nt.insertAdjacentHTML('afterend', drawerHtml); if (dOpen) { var d2=document.getElementById('drawer-'+sc); if(d2) d2.classList.add('open'); var ch2=nt.querySelector('.pch'); if(ch2) ch2.classList.add('open'); } }
    bindTsEvents(sc);
  }

  function renderAllTs() { for(var i=1;i<=4;i++) renderTs('TS-'+i); updateTsProgress(); }

  function bindTsEvents(sc) {
    var t = document.getElementById('tile-'+sc); if (!t) return;
    var cs = t.querySelector('[data-dropdown="ts-cat"][data-sc="'+sc+'"]');
    if (cs) cs.addEventListener('change', function(){handleTsCatChange(sc,cs);});
    var cu = t.querySelector('[data-dropdown="ts-cust"][data-sc="'+sc+'"]');
    if (cu) cu.addEventListener('change', function(){handleTsCustChange(sc,cu);});
    var ar = t.querySelector('[data-dropdown="ts-art"][data-sc="'+sc+'"]');
    if (ar) ar.addEventListener('change', function(){handleTsArtChange(sc,ar);});
    var sp = t.querySelector('[data-dropdown="ts-spon"][data-sc="'+sc+'"]');
    if (sp) sp.addEventListener('change', function(){handleTsSponChange(sc,sp);});
    var ns = t.querySelector('[data-checkbox="ts-nospon"][data-sc="'+sc+'"]');
    if (ns) ns.addEventListener('change', function(){handleTsNoSponChange(sc,ns);});
    var eb = t.querySelector('[data-action="edit-ts"][data-sc="'+sc+'"]');
    if (eb) eb.addEventListener('click', function(){var s=state[sc];if(!s)return;originalState[sc]=Object.assign({},s);s.dirty=true;s.sponDirtyOnly=false;renderTs(sc);updateTsProgress();});
    var cb = t.querySelector('[data-action="cancel-ts"][data-sc="'+sc+'"]');
    if (cb) cb.addEventListener('click', function(){var s=state[sc],o=originalState[sc];if(s&&o){Object.assign(s,o);s.dirty=false;s.catChanged=false;s.sponDirtyOnly=false;delete originalState[sc];}renderTs(sc);updateTsProgress();});
    var ch = t.querySelector('[data-action="toggle-drawer"][data-sc="'+sc+'"]');
    if (ch) ch.addEventListener('click', function(){tD(sc);});
  }

  function handleTsCatChange(sc,sel){var s=state[sc];if(!s)return;var opt=sel.options[sel.selectedIndex],nid=opt?opt.value||'':'';if(!nid)return;var has=s.artId||s.custId||s.sponsorId;var doIt=function(){if(!originalState[sc])originalState[sc]=Object.assign({},s);s.catId=nid;s.catNm=opt?opt.textContent||'':'';s.catType=(opt&&opt.dataset)?opt.dataset.type||'':'';s.artId='';s.artNm='';s.custId='';s.custNm='';s.sponsorId='';s.sponNm='';s.catChanged=true;s.dirty=true;renderTs(sc);updateTsProgress();};if(has){showInlineConfirm(sel,'Changing category will clear article & sponsor.',doIt,function(){sel.value=s.catId||'';});}else{doIt();}}
  function handleTsCustChange(sc,sel){var s=state[sc];if(!s)return;var opt=sel.options[sel.selectedIndex],nid=opt?opt.value||'':'';var doIt=function(){if(!originalState[sc])originalState[sc]=Object.assign({},s);s.custId=nid;s.custNm=opt?opt.textContent||'':'';s.artId='';s.artNm='';s.dirty=true;renderTs(sc);updateTsProgress();};if(s.artId&&nid!==s.custId){showInlineConfirm(sel,'Changing customer will clear article selection.',doIt,function(){sel.value=s.custId||'';});}else{doIt();}}
  function handleTsArtChange(sc,sel){var s=state[sc];if(!s)return;if(!originalState[sc])originalState[sc]=Object.assign({},s);var opt=sel.options[sel.selectedIndex];s.artId=opt?opt.value||'':'';s.artNm=opt?opt.textContent||'':'';s.catChanged=false;s.dirty=true;renderTs(sc);updateTsProgress();}
  function handleTsSponChange(sc,sel){var s=state[sc];if(!s)return;if(!originalState[sc])originalState[sc]=Object.assign({},s);var opt=sel.options[sel.selectedIndex];s.sponsorId=opt?opt.value||'':'';s.sponNm=opt?opt.textContent||'':'';var o=originalState[sc];if(o&&s.sponsorId===o.sponsorId&&s.noSponsor===o.noSponsor){s.dirty=false;s.sponDirtyOnly=false;delete originalState[sc];}else{s.dirty=true;s.sponDirtyOnly=true;}renderTs(sc);updateTsProgress();}
  function handleTsNoSponChange(sc,cb){var s=state[sc];if(!s)return;if(!originalState[sc])originalState[sc]=Object.assign({},s);s.noSponsor=cb.checked;if(cb.checked){s.sponsorId='';s.sponNm='';}var o=originalState[sc];if(o&&s.noSponsor===o.noSponsor&&s.sponsorId===o.sponsorId){s.dirty=false;s.sponDirtyOnly=false;delete originalState[sc];}else{s.dirty=true;s.sponDirtyOnly=true;}renderTs(sc);updateTsProgress();}
  function updateTsProgress(){updateSlotIndicators('ts',4,function(c){var s=state[c];if(!s||!s.artId||s.dirty)return false;var isSp=s.catType&&s.catType.toLowerCase().indexOf('sponsor')!==-1;if(isSp&&!s.sponsorId&&!s.noSponsor)return false;return true;});var pc=0;for(var i=1;i<=4;i++){var s=state['TS-'+i];if(s&&s.dirty)pc++;}updateSaveButton('ts',pc>0);}

  // ═══ BANNER ADS (BA) — 12 slots ═══
  function initBaState() {
    var slotEls = document.querySelectorAll('.ba-slot-wrapper');
    slotEls.forEach(function(el) {
      var code = el.dataset.slotCode; if (!code) return;
      var sn = parseInt(code.replace(/\D/g,''),10), adId = el.dataset.adId||'', adNm = el.dataset.adTitle||el.dataset.adName||'';
      if (adId&&!adNm) { var ae=document.querySelector('.ads-wrapper[data-ad-id="'+adId+'"]'); adNm=ae?(ae.dataset.adName||ae.dataset.adTitle||''):''; }
      state[code] = { sc:code,secC:'ba',slotNum:sn,pubplanId:el.dataset.pubplanId||'',titleadminId:el.dataset.titleadminId||'',section:el.dataset.section||'Banner Ad',catId:el.dataset.catId||'',catNm:el.dataset.catLabel||'',custId:el.dataset.customerId||'',custNm:el.dataset.customerName||'',adId:adId,adName:adNm,dirty:false };
    });
    for(var i=1;i<=12;i++){var c='BA-'+i;if(!state[c])state[c]={sc:c,secC:'ba',slotNum:i,section:'Banner Ad',pubplanId:'',titleadminId:'',catId:'',catNm:'',custId:'',custNm:'',adId:'',adName:'',dirty:false};}
  }
  function getBaPickerData(n){var wc=n<=6?'.ba-picker-1-wrapper':'.ba-picker-2-wrapper',p=document.querySelector(wc);if(!p)return{};var px='ba'+n;return{adGet:p.dataset[px+'AdGet']||'',adGo:p.dataset[px+'AdGo']||''};}
  function buildBaDrawer(sc){var s=state[sc];if(!s)return'';var d=getBaPickerData(s.slotNum);var fs=[{l:'Ad Image Link',v:d.adGet?'Present':'—',s:d.adGet?'ok':(s.adId?'bad':'na')},{l:'Ad Redirect',v:d.adGo?'Present':'—',s:d.adGo?'ok':(s.adId?'bad':'na')}];var fh=fs.map(function(f){var ic=f.s==='ok'?'✓':(f.s==='bad'?'✕':'—');return'<div class="pdr-field"><span class="pdr-label">'+f.l+'</span><span class="pdr-value">'+f.v+'</span></div><div class="pdr-status">'+statusIcon(f.s,ic)+'</div>';}).join('');return'<div class="pdr" id="drawer-'+sc+'"><div class="pdr-grid" style="grid-template-columns:1fr 60px 1fr 60px;">'+fh+'</div></div>';}

  function renderBa(sc) {
    var s=state[sc];if(!s)return;var isEd=s.dirty||!!originalState[sc],d=getBaPickerData(s.slotNum);
    var thumb='';
    if(!isEd&&s.adId&&d.adGet) thumb='<img src="'+d.adGet+'" class="ppt-ad-thumb" alt="">';
    else if(!isEd&&s.adId&&!d.adGet) thumb='<div class="ppt-ad-thumb-placeholder">🖼</div>';
    var custCol=s.custId&&!isEd?'<div class="ppt-card-field"><span class="ppt-col-label">Customer</span><span class="pcv">'+s.custNm+'</span></div>':'<div class="ppt-card-field"><span class="ppt-col-label">Customer</span><select class="pd'+(s.custId?' hs':'')+'" data-dropdown="ba-cust" data-sc="'+sc+'">'+buildCustomerOptions(s.custId,'Select customer...')+'</select></div>';
    var adCol='';
    if(isEd||!s.adId) adCol='<div class="ppt-card-field"><span class="ppt-col-label">Ad</span><select class="pd'+(s.adId?' hs':'')+'" data-dropdown="ba-ad" data-sc="'+sc+'"'+(!s.custId?' disabled':'')+'>' + buildAdOptions(s.custId,s.adId) + '</select></div>';
    var ah=isEd?'<a class="ppt-cancel-lnk visible" data-action="cancel-ba" data-sc="'+sc+'">cancel</a>':(s.adId?'<a class="pei" data-action="edit-ba" data-sc="'+sc+'" title="Edit">✎</a>':'<span style="color:#ccc;">—</span>');
    var chev='<span class="pch" data-action="toggle-drawer" data-sc="'+sc+'">▾</span>';
    var html='<div class="ptw" id="wrapper-'+sc+'"><div class="ptc'+(isEd?' hp':'')+'" id="tile-'+sc+'"><div class="pcs">'+sc+'</div>'+thumb+'<div class="ptc-body">'+custCol+adCol+'</div><div class="pca">'+ah+chev+'</div></div>'+buildBaDrawer(sc)+'</div>';
    var ex=document.getElementById('wrapper-'+sc);
    if(ex){var dO=document.getElementById('drawer-'+sc)?document.getElementById('drawer-'+sc).classList.contains('open'):false;ex.outerHTML=html;if(dO){var d2=document.getElementById('drawer-'+sc);if(d2)d2.classList.add('open');var t2=document.getElementById('tile-'+sc);var ch2=t2?t2.querySelector('.pch'):null;if(ch2)ch2.classList.add('open');}}
    else{var g=document.getElementById('ba-grid');if(g)g.insertAdjacentHTML('beforeend',html);}
    bindBaEvents(sc);
  }
  function renderAllBa(){for(var i=1;i<=12;i++)renderBa('BA-'+i);updateBaProgress();}
  function bindBaEvents(sc){var t=document.getElementById('tile-'+sc);if(!t)return;var cu=t.querySelector('[data-dropdown="ba-cust"][data-sc="'+sc+'"]');if(cu)cu.addEventListener('change',function(){handleBaCustChange(sc,cu);});var ad=t.querySelector('[data-dropdown="ba-ad"][data-sc="'+sc+'"]');if(ad)ad.addEventListener('change',function(){handleBaAdChange(sc,ad);});var eb=t.querySelector('[data-action="edit-ba"][data-sc="'+sc+'"]');if(eb)eb.addEventListener('click',function(){var s=state[sc];if(!s)return;originalState[sc]=Object.assign({},s);s.dirty=true;renderBa(sc);updateBaProgress();});var cb=t.querySelector('[data-action="cancel-ba"][data-sc="'+sc+'"]');if(cb)cb.addEventListener('click',function(){var s=state[sc],o=originalState[sc];if(s&&o){Object.assign(s,o);s.dirty=false;delete originalState[sc];}renderBa(sc);updateBaProgress();});var ch=t.querySelector('[data-action="toggle-drawer"][data-sc="'+sc+'"]');if(ch)ch.addEventListener('click',function(){tD(sc);});}
  function handleBaCustChange(sc,sel){var s=state[sc];if(!s)return;if(!originalState[sc])originalState[sc]=Object.assign({},s);var o=sel.options[sel.selectedIndex];s.custId=o?o.value||'':'';s.custNm=o?o.textContent||'':'';s.adId='';s.adName='';s.dirty=true;renderBa(sc);updateBaProgress();}
  function handleBaAdChange(sc,sel){var s=state[sc];if(!s)return;if(!originalState[sc])originalState[sc]=Object.assign({},s);var o=sel.options[sel.selectedIndex];s.adId=o?o.value||'':'';s.adName=o?o.textContent||'':'';s.dirty=true;renderBa(sc);updateBaProgress();}
  function updateBaProgress(){updateSlotIndicators('ba',12,function(c){var s=state[c];return!!(s&&s.adId&&!s.dirty);});var pc=0;for(var i=1;i<=12;i++){var s=state['BA-'+i];if(s&&s.dirty)pc++;}updateSaveButton('ba',pc>0);}

  // ═══ THE FIND (TF) — BA-PATTERN CATEGORY TILE + TXA (5) + LBP (1) ═══

  // FIX #22: renderTfCategory — BA tile pattern for category display
  function renderTfCategory() {
    var mount = document.getElementById('tf-category-display');
    if (!mount) return;
    var hasSaved = !!tfOriginalCategoryId;
    var hasCurrent = !!tfCategoryId;
    var h = '';

    if (!hasSaved && !tfCategoryEditing) {
      // No saved category — show dropdown, no cancel
      h += '<span class="ppt-col-label">The Find Category</span>';
      h += '<select class="pd' + (hasCurrent ? ' hs' : '') + '" id="tf-category-select" style="margin-top:4px;max-width:280px;">';
      h += buildTfCategoryDropdown(tfCategoryId);
      h += '</select>';
    } else if (tfCategoryEditing || tfCategoryDirty) {
      // Edit mode — dropdown with current value + cancel
      h += '<span class="ppt-col-label">The Find Category</span>';
      h += '<select class="pd' + (hasCurrent ? ' hs' : '') + '" id="tf-category-select" style="margin-top:4px;max-width:280px;">';
      h += buildTfCategoryDropdown(tfCategoryId);
      h += '</select>';
      h += ' <a class="ppt-cancel-lnk visible" id="tf-cat-cancel" style="margin-left:8px;">cancel</a>';
    } else {
      // Saved + not editing — frozen text + edit pencil
      var modeLabel = currentTfMode === 'lbp' ? 'LBP' : 'TXA';
      h += '<span class="ppt-col-label">The Find Category</span>';
      h += '<span class="pcv" style="display:inline-block;margin-top:4px;">' + (tfCategoryNm || '—');
      h += ' <span style="font-size:10px;color:#888;font-weight:400;">(' + modeLabel + ')</span></span>';
      h += ' <a class="pei" id="tf-cat-edit" title="Change category" style="margin-left:8px;cursor:pointer;">✎</a>';
    }
    mount.innerHTML = h;

    // Bind dropdown change
    var sel = document.getElementById('tf-category-select');
    if (sel) sel.addEventListener('change', function() { handleTfCategoryChange(sel); });

    // Bind edit pencil
    var editBtn = document.getElementById('tf-cat-edit');
    if (editBtn) editBtn.addEventListener('click', function() {
      tfCategoryEditing = true;
      renderTfCategory();
    });

    // Bind cancel — revert to original saved state
    var cancelBtn = document.getElementById('tf-cat-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', function() {
      tfCategoryId = tfOriginalCategoryId;
      tfCategoryNm = '';
      tfCategoryDirty = false;
      tfCategoryEditing = false;
      if (tfCategoryId) {
        var catEl = document.querySelector('.products-wrapper[data-id="' + tfCategoryId + '"]');
        if (catEl) {
          tfCategoryNm = catEl.dataset.name || '';
          currentTfMode = (catEl.dataset.sectionCode === 'lbp') ? 'lbp' : 'txa';
        }
      }
      renderTfCategory();
      updateTfProgress();
    });

    // Update slot visibility after every category render
    updateTfSlotVisibility();
  }

  function updateTfSlotVisibility() {
    var txa = document.querySelector('.the-find-txa');
    var lbp = document.querySelector('.the-find-lbp');
    var hasCat = !!tfCategoryId;
    if (txa) txa.classList.toggle('is-active', hasCat && currentTfMode === 'txa');
    if (lbp) lbp.classList.toggle('is-active', hasCat && currentTfMode === 'lbp');
    var ce = document.getElementById('tf-slot-count');
    if (ce) ce.textContent = !hasCat ? '—' : (currentTfMode === 'txa' ? '5 slots' : '1 slot');
    // Re-render active tile set so tiles are populated after mode switch
    if (hasCat && currentTfMode === 'txa') renderAllTxa();
    if (hasCat && currentTfMode === 'lbp') renderLbp();
  }

  window.handleTfCategoryChange = function(sel) {
    var val = sel.value;
    if (!val) return;
    var opt = sel.options[sel.selectedIndex];
    var secCode = opt ? (opt.dataset.secCode || '') : '';
    var isLbp = (secCode === 'lbp');
    var newMode = isLbp ? 'lbp' : 'txa';
    var newCatId = val;
    var newCatNm = opt ? opt.textContent : '';

    // Immediately switch visible panel based on selection
    currentTfMode = newMode;
    tfCategoryId = newCatId;
    tfCategoryNm = newCatNm;
    updateTfSlotVisibility();
    sel.classList.toggle('hs', !!val);

    var doIt = function() {
      // Clear old mode's slot data
      if (newMode === 'txa') {
        // Switching TO txa — clear LBP
        if (state['LBP-1']) { state['LBP-1'].dirty = false; state['LBP-1'].custId = ''; state['LBP-1'].custNm = ''; }
        delete originalState['LBP-1'];
      } else {
        // Switching TO lbp — clear TXA
        for (var i = 1; i <= 5; i++) {
          var c = 'TXA-' + i;
          if (state[c]) { state[c].dirty = false; state[c].custId = ''; state[c].custNm = ''; }
          delete originalState[c];
        }
      }

      tfCategoryDirty = true;

      for (var i = 1; i <= 5; i++) {
        var s = state['TXA-' + i];
        if (s) s.catId = newCatId;
      }

      if (newMode === 'txa') {
        for (var i = 1; i <= 5; i++) {
          var s = state['TXA-' + i];
          if (s && s.custId) s.dirty = true;
        }
      } else {
        if (state['LBP-1'] && state['LBP-1'].custId) state['LBP-1'].dirty = true;
      }

      updateTfProgress();
    };

    // If existing saved category and user picks different, confirm first
    if (tfOriginalCategoryId && newCatId !== tfOriginalCategoryId) {
      showInlineConfirm(sel, 'Change The Find category? This will update the saved category.', doIt, function() {
        // Cancel — revert to original
        tfCategoryId = tfOriginalCategoryId;
        tfCategoryNm = '';
        tfCategoryDirty = false;
        if (tfOriginalCategoryId) {
          var catEl = document.querySelector('.products-wrapper[data-id="' + tfOriginalCategoryId + '"]');
          if (catEl) {
            tfCategoryNm = catEl.dataset.name || '';
            currentTfMode = (catEl.dataset.sectionCode === 'lbp') ? 'lbp' : 'txa';
          }
        }
        sel.value = tfCategoryId || '';
        sel.classList.toggle('hs', !!tfCategoryId);
        updateTfSlotVisibility();
        updateTfProgress();
      });
    } else {
      doIt();
    }
  };

  function initTxaState(){
    var els=document.querySelectorAll('.txa-slot-wrapper');
    els.forEach(function(el){var c=el.dataset.slotCode;if(!c)return;state[c]={sc:c,secC:'txa',slotNum:parseInt(c.replace(/\D/g,''),10),pubplanId:el.dataset.pubplanId||'',titleadminId:el.dataset.titleAdminId||el.dataset.titleadminId||'',section:el.dataset.section||'The Find',custId:el.dataset.customerId||'',custNm:el.dataset.customerName||'',catId:el.dataset.catId||'',dirty:false};});
    for(var i=1;i<=5;i++){var c='TXA-'+i;if(!state[c])state[c]={sc:c,secC:'txa',slotNum:i,section:'The Find',pubplanId:getPubplanId(),titleadminId:getTitleadminId(),custId:'',custNm:'',catId:'',dirty:false};}
  }
  function getTxaPickerData(n){var w=document.querySelector('.txa-picker-wrapper');if(!w)return{};var px='txa'+n;return{logoLink:w.dataset[px+'LogoLink']||'',redirect:w.dataset[px+'Redirect']||'',headline:w.dataset[px+'Headline']||'',body:w.dataset[px+'Body']||''};}
  function buildTxaDrawer(sc){var s=state[sc];if(!s)return'';var d=getTxaPickerData(s.slotNum);var fs=[{l:'Logo',v:d.logoLink?'Present':'—',s:d.logoLink?'ok':(s.custId?'bad':'na')},{l:'Redirect',v:d.redirect?'Present':'—',s:d.redirect?'ok':(s.custId?'bad':'na')},{l:'Headline',v:d.headline||'—',s:d.headline?'ok':(s.custId?'bad':'na')},{l:'Body Text',v:d.body?'Present':'—',s:d.body?'ok':(s.custId?'bad':'na')}];var fh=fs.map(function(f){var ic=f.s==='ok'?'✓':(f.s==='bad'?'✕':'—');return'<div class="pdr-field"><span class="pdr-label">'+f.l+'</span><span class="pdr-value">'+f.v+'</span></div><div class="pdr-status">'+statusIcon(f.s,ic)+'</div>';}).join('');return'<div class="pdr" id="drawer-'+sc+'"><div class="pdr-grid" style="grid-template-columns:repeat(2,1fr 60px);">'+fh+'</div></div>';}

  function renderTxa(sc){
    var s=state[sc];if(!s)return;var isEd=s.dirty||!!originalState[sc],d=getTxaPickerData(s.slotNum);
    var logo='';if(s.custId&&d.logoLink)logo='<img src="'+d.logoLink+'" class="ppt-ad-thumb" alt="">';else if(s.custId&&!d.logoLink)logo='<div class="ppt-ad-thumb-placeholder">🖼</div>';
    var custCol=s.custId&&!isEd?'<div class="ppt-card-field"><span class="ppt-col-label">Customer</span><span class="pcv">'+s.custNm+'</span></div>':'<div class="ppt-card-field"><span class="ppt-col-label">Customer</span><select class="pd'+(s.custId?' hs':'')+'" data-dropdown="txa-cust" data-sc="'+sc+'">'+buildCustomerOptions(s.custId,'Select customer...')+'</select></div>';
    var ah=isEd?'<a class="ppt-cancel-lnk visible" data-action="cancel-txa" data-sc="'+sc+'">cancel</a>':(s.custId?'<a class="pei" data-action="edit-txa" data-sc="'+sc+'" title="Edit">✎</a>':'<span style="color:#ccc;">—</span>');
    var chev='<span class="pch" data-action="toggle-drawer" data-sc="'+sc+'">▾</span>';
    var html='<div class="ptw" id="wrapper-'+sc+'"><div class="ptc tfc'+(isEd?' hp':(s.dirty?' has-pending':''))+'" id="tile-'+sc+'"><div class="pcs">'+sc+'</div>'+logo+'<div class="ptc-body">'+custCol+'</div><div class="pca">'+ah+chev+'</div></div>'+buildTxaDrawer(sc)+'</div>';
    var ex=document.getElementById('wrapper-'+sc);
    if(ex){var dO=document.getElementById('drawer-'+sc)?document.getElementById('drawer-'+sc).classList.contains('open'):false;ex.outerHTML=html;if(dO){var d2=document.getElementById('drawer-'+sc);if(d2)d2.classList.add('open');var t2=document.getElementById('tile-'+sc);var ch2=t2?t2.querySelector('.pch'):null;if(ch2)ch2.classList.add('open');}}
    else{var g=document.getElementById('txa-grid');if(g)g.insertAdjacentHTML('beforeend',html);}
    bindTxaEvents(sc);
  }
  function renderAllTxa(){for(var i=1;i<=5;i++)renderTxa('TXA-'+i);}
  function bindTxaEvents(sc){var t=document.getElementById('tile-'+sc);if(!t)return;var cu=t.querySelector('[data-dropdown="txa-cust"][data-sc="'+sc+'"]');if(cu)cu.addEventListener('change',function(){var s=state[sc];if(!s)return;if(!originalState[sc])originalState[sc]=Object.assign({},s);var o=cu.options[cu.selectedIndex];s.custId=o?o.value||'':'';s.custNm=o?o.textContent||'':'';s.dirty=true;renderTxa(sc);updateTfProgress();});var eb=t.querySelector('[data-action="edit-txa"][data-sc="'+sc+'"]');if(eb)eb.addEventListener('click',function(){var s=state[sc];if(!s)return;originalState[sc]=Object.assign({},s);s.dirty=true;renderTxa(sc);updateTfProgress();});var cb=t.querySelector('[data-action="cancel-txa"][data-sc="'+sc+'"]');if(cb)cb.addEventListener('click',function(){var s=state[sc],o=originalState[sc];if(s&&o){Object.assign(s,o);s.dirty=false;delete originalState[sc];}renderTxa(sc);updateTfProgress();});var ch=t.querySelector('[data-action="toggle-drawer"][data-sc="'+sc+'"]');if(ch)ch.addEventListener('click',function(){tD(sc);});}

  function initLbpState(){var el=document.querySelector('.txa-slot-wrapper[data-slot-code="TXA-1"]');state['LBP-1']={sc:'LBP-1',secC:'lbp',section:'The Find',pubplanId:el?el.dataset.pubplanId||'':getPubplanId(),titleadminId:el?(el.dataset.titleAdminId||el.dataset.titleadminId||''):getTitleadminId(),custId:el?el.dataset.customerId||'':'',custNm:el?el.dataset.customerName||'':'',dirty:false};}
  function getLbpPickerData(){var w=document.querySelector('.txa-picker-wrapper');if(!w)return{};return{logoLink:w.dataset.lbpLogoLink||'',redirect:w.dataset.lbpRedirect||'',service1:w.dataset.lbpService1||'',service2:w.dataset.lbpService2||'',service3:w.dataset.lbpService3||'',service4:w.dataset.lbpService4||'',service5:w.dataset.lbpService5||'',service6:w.dataset.lbpService6||''};}
  function buildLbpDrawer(){var s=state['LBP-1'];if(!s)return'';var d=getLbpPickerData();var fs=[{l:'Logo',v:d.logoLink?'Present':'—',s:d.logoLink?'ok':(s.custId?'bad':'na')},{l:'Redirect',v:d.redirect?'Present':'—',s:d.redirect?'ok':(s.custId?'bad':'na')},{l:'Service 1',v:d.service1||'—',s:d.service1?'ok':'na'},{l:'Service 2',v:d.service2||'—',s:d.service2?'ok':'na'},{l:'Service 3',v:d.service3||'—',s:d.service3?'ok':'na'},{l:'Service 4',v:d.service4||'—',s:d.service4?'ok':'na'},{l:'Service 5',v:d.service5||'—',s:d.service5?'ok':'na'},{l:'Service 6',v:d.service6||'—',s:d.service6?'ok':'na'}];var fh=fs.map(function(f){var ic=f.s==='ok'?'✓':(f.s==='bad'?'✕':'—');return'<div class="pdr-field"><span class="pdr-label">'+f.l+'</span><span class="pdr-value">'+f.v+'</span></div><div class="pdr-status">'+statusIcon(f.s,ic)+'</div>';}).join('');return'<div class="pdr" id="drawer-LBP-1"><div class="pdr-grid" style="grid-template-columns:repeat(4,1fr 60px);">'+fh+'</div></div>';}

  function renderLbp(){
    var s=state['LBP-1'];if(!s)return;var isEd=s.dirty||!!originalState['LBP-1'];
    var custCol=s.custId&&!isEd?'<div class="ppt-card-field"><span class="ppt-col-label">Featured Business</span><span class="pcv">'+s.custNm+'</span></div>':'<div class="ppt-card-field"><span class="ppt-col-label">Featured Business</span><select class="pd'+(s.custId?' hs':'')+'" style="min-width:200px;" data-dropdown="lbp-cust">'+buildCustomerOptions(s.custId,'Select business...')+'</select></div>';
    var ah=isEd?'<a class="ppt-cancel-lnk visible" data-action="cancel-lbp">cancel</a>':(s.custId?'<a class="pei" data-action="edit-lbp" title="Edit">✎</a>':'<span style="color:#ccc;">—</span>');
    var chev='<span class="pch" data-action="toggle-drawer" data-sc="LBP-1">▾</span>';
    var html='<div class="ptc tfc'+(isEd?' hp':'')+'" id="tile-LBP-1"><div class="pcs">LBP</div><div class="ptc-body">'+custCol+'</div><div class="pca">'+ah+chev+'</div></div>';
    var dHtml=buildLbpDrawer();
    var ex=document.getElementById('tile-LBP-1'),exD=document.getElementById('drawer-LBP-1'),dO=exD?exD.classList.contains('open'):false;
    if(ex){ex.outerHTML=html;if(exD)exD.remove();}else{var g=document.getElementById('lbp-grid');if(g)g.insertAdjacentHTML('beforeend',html);}
    var nt=document.getElementById('tile-LBP-1');
    if(nt){nt.insertAdjacentHTML('afterend',dHtml);if(dO){var d2=document.getElementById('drawer-LBP-1');if(d2)d2.classList.add('open');var ch2=nt.querySelector('.pch');if(ch2)ch2.classList.add('open');}}
    bindLbpEvents();
  }
  function bindLbpEvents(){var t=document.getElementById('tile-LBP-1');if(!t)return;var cu=t.querySelector('[data-dropdown="lbp-cust"]');if(cu)cu.addEventListener('change',function(){var s=state['LBP-1'];if(!s)return;if(!originalState['LBP-1'])originalState['LBP-1']=Object.assign({},s);var o=cu.options[cu.selectedIndex];s.custId=o?o.value||'':'';s.custNm=o?o.textContent||'':'';s.dirty=true;renderLbp();updateTfProgress();});var eb=t.querySelector('[data-action="edit-lbp"]');if(eb)eb.addEventListener('click',function(){var s=state['LBP-1'];if(!s)return;originalState['LBP-1']=Object.assign({},s);s.dirty=true;renderLbp();updateTfProgress();});var cb=t.querySelector('[data-action="cancel-lbp"]');if(cb)cb.addEventListener('click',function(){var s=state['LBP-1'],o=originalState['LBP-1'];if(s&&o){Object.assign(s,o);s.dirty=false;delete originalState['LBP-1'];}renderLbp();updateTfProgress();});var ch=t.querySelector('[data-action="toggle-drawer"][data-sc="LBP-1"]');if(ch)ch.addEventListener('click',function(){tD('LBP-1');});}

  // FIX #22: Save button activates when ANY category is selected
  function updateTfProgress(){
    var cnt=currentTfMode==='txa'?5:1,pfx=currentTfMode==='txa'?'TXA':'LBP';
    updateSlotIndicators('tf',cnt,function(c){var idx=parseInt(c.split('-')[1]);var s=state[pfx+'-'+idx];return!!(s&&s.custId);});
    var pc=0;
    if(currentTfMode==='txa'){for(var i=1;i<=5;i++){var s=state['TXA-'+i];if(s&&s.dirty)pc++;}}
    else{if(state['LBP-1']&&state['LBP-1'].dirty)pc++;}
    updateSaveButton('tf',pc>0||tfCategoryDirty);
  }

  // ═══ EVENTS (EV) — 4 slots + 1 section sponsor ═══

  function initEvState() {
    var slotEls = document.querySelectorAll('.ev-slot-wrapper');
    slotEls.forEach(function(el) {
      var code = el.dataset.slotCode; if (!code) return;
      var sn = parseInt(code.replace(/\D/g,''), 10);
      var evId = el.dataset.eventId || '', evNm = el.dataset.eventName || '';
      // Look up additional fields from events library if we have an ID
      if (evId && !evNm) {
        var lib = document.querySelector('.events-wrapper[data-event-id="' + evId + '"]');
        if (lib) evNm = lib.dataset.eventTitle || '';
      }
      state[code] = {
        sc: code, secC: 'ev', slotNum: sn,
        pubplanId: el.dataset.pubplanId || '',
        titleadminId: el.dataset.titleAdminId || el.dataset.titleadminId || '',
        section: 'Events',
        evId: evId, evNm: evNm,
        evMonth: el.dataset.eventMonth || '',
        evDay: el.dataset.eventDay || '',
        evTime: el.dataset.eventTime || '',
        evVenue: el.dataset.eventVenue || '',
        dirty: false
      };
    });
    for (var i = 1; i <= 4; i++) {
      var c = 'EV-' + i;
      if (!state[c]) state[c] = { sc: c, secC: 'ev', slotNum: i, pubplanId: '', titleadminId: '', section: 'Events', evId: '', evNm: '', evMonth: '', evDay: '', evTime: '', evVenue: '', dirty: false };
    }
  }

  function initEvSponsor() {
    var pk = document.querySelector('.ev-picker-wrapper');
    if (pk) {
      evSponsorId = pk.dataset.sponsorId || '';
      evSponsorNm = pk.dataset.sponsorName || '';
    }
    evOriginalSponsorId = evSponsorId;
    evSponsorDirty = false;
    evSponsorEditing = false;
  }

  function buildEventOptions(selId) {
    var els = document.querySelectorAll('.events-wrapper'), all = [];
    els.forEach(function(el) {
      var id = el.dataset.eventId;
      if (id) all.push({ id: id, name: el.dataset.eventTitle || '(untitled)', month: el.dataset.eventMonth || '', day: el.dataset.eventDay || '', venue: el.dataset.eventLocation || '' });
    });
    if (!all.length) return '<option value="" disabled selected>No events</option>';
    all.sort(function(a, b) { return a.name.localeCompare(b.name); });
    return '<option value="" disabled' + (!selId ? ' selected' : '') + '>Select event...</option>' +
      all.map(function(e) {
        var label = e.name + (e.month && e.day ? ' (' + e.month + ' ' + e.day + ')' : '');
        return '<option value="' + e.id + '"' + (e.id === selId ? ' selected' : '') + '>' + label + '</option>';
      }).join('');
  }

  function getEvLibData(evId) {
    if (!evId) return {};
    var el = document.querySelector('.events-wrapper[data-event-id="' + evId + '"]');
    if (!el) return {};
    return {
      title: el.dataset.eventTitle || '',
      month: el.dataset.eventMonth || '',
      day: el.dataset.eventDay || '',
      time: el.dataset.eventTime || '',
      location: el.dataset.eventLocation || '',
      city: el.dataset.eventCity || '',
      imageUrl: el.dataset.eventImageUrl || '',
      link: el.dataset.eventLink || '',
      description: el.dataset.eventDescription || ''
    };
  }

  function buildEvDrawer(sc) {
    var s = state[sc]; if (!s) return '';
    var d = getEvLibData(s.evId);
    var fs = [
      { l: 'Location', v: d.location || s.evVenue || '—', s: (d.location || s.evVenue) ? 'ok' : (s.evId ? 'bad' : 'na') },
      { l: 'City', v: d.city || '—', s: d.city ? 'ok' : 'na' },
      { l: 'Time', v: d.time || s.evTime || '—', s: (d.time || s.evTime) ? 'ok' : (s.evId ? 'bad' : 'na') },
      { l: 'Image', v: d.imageUrl ? 'Present' : '—', s: d.imageUrl ? 'ok' : (s.evId ? 'bad' : 'na') },
      { l: 'Link', v: d.link ? 'Present' : '—', s: d.link ? 'ok' : 'na' },
      { l: 'Description', v: d.description ? 'Present' : '—', s: d.description ? 'ok' : (s.evId ? 'bad' : 'na') }
    ];
    var fh = fs.map(function(f) {
      var ic = f.s === 'ok' ? '✓' : (f.s === 'bad' ? '✕' : '—');
      return '<div class="pdr-field"><span class="pdr-label">' + f.l + '</span><span class="pdr-value">' + f.v + '</span></div><div class="pdr-status">' + statusIcon(f.s, ic) + '</div>';
    }).join('');
    return '<div class="pdr" id="drawer-' + sc + '"><div class="pdr-grid" style="grid-template-columns:repeat(3,1fr 60px);">' + fh + '</div></div>';
  }

  function renderEvSponsor() {
    var mount = document.getElementById('ev-sponsor-display');
    if (!mount) return;
    var hasSaved = !!evOriginalSponsorId;
    var hasCurrent = !!evSponsorId;
    var h = '';

    if (!hasSaved && !evSponsorEditing) {
      // No saved sponsor — show dropdown
      h += '<span class="ppt-col-label">Section Sponsor</span>';
      h += '<select class="pd' + (hasCurrent ? ' hs' : '') + '" id="ev-sponsor-select" style="margin-top:4px;max-width:280px;">';
      h += buildCustomerOptions(evSponsorId, 'Optional — assign sponsor...');
      h += '</select>';
    } else if (evSponsorEditing || evSponsorDirty) {
      // Edit mode — dropdown + cancel
      h += '<span class="ppt-col-label">Section Sponsor</span>';
      h += '<select class="pd' + (hasCurrent ? ' hs' : '') + '" id="ev-sponsor-select" style="margin-top:4px;max-width:280px;">';
      h += buildCustomerOptions(evSponsorId, 'Optional — assign sponsor...');
      h += '</select>';
      h += ' <a class="ppt-cancel-lnk visible" id="ev-spon-cancel" style="margin-left:8px;">cancel</a>';
    } else {
      // Saved + not editing — frozen text + edit pencil
      h += '<span class="ppt-col-label">Section Sponsor</span>';
      h += '<span class="pcv" style="display:inline-block;margin-top:4px;">' + (evSponsorNm || '—') + '</span>';
      h += ' <a class="pei" id="ev-spon-edit" title="Change sponsor" style="margin-left:8px;cursor:pointer;">✎</a>';
    }
    mount.innerHTML = h;

    // Bind dropdown change
    var sel = document.getElementById('ev-sponsor-select');
    if (sel) sel.addEventListener('change', function() {
      var opt = sel.options[sel.selectedIndex];
      evSponsorId = opt ? opt.value || '' : '';
      evSponsorNm = opt ? opt.textContent || '' : '';
      evSponsorDirty = true;
      sel.classList.toggle('hs', !!evSponsorId);
      updateEvProgress();
    });

    // Bind edit pencil
    var editBtn = document.getElementById('ev-spon-edit');
    if (editBtn) editBtn.addEventListener('click', function() {
      evSponsorEditing = true;
      renderEvSponsor();
    });

    // Bind cancel
    var cancelBtn = document.getElementById('ev-spon-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', function() {
      evSponsorId = evOriginalSponsorId;
      evSponsorNm = '';
      evSponsorDirty = false;
      evSponsorEditing = false;
      if (evSponsorId) {
        var c = document.querySelector('.customers-wrapper[data-id="' + evSponsorId + '"]');
        if (c) evSponsorNm = c.dataset.name || '';
      }
      renderEvSponsor();
      updateEvProgress();
    });
  }

  function renderEv(sc) {
    var s = state[sc]; if (!s) return;
    var isEd = s.dirty || !!originalState[sc];
    var d = getEvLibData(s.evId);
    var dateInfo = (s.evMonth && s.evDay) ? s.evMonth + ' ' + s.evDay : (d.month && d.day ? d.month + ' ' + d.day : '');

    // Event dropdown or frozen name
    var evCol = '';
    if (isEd || !s.evId) {
      evCol = '<div class="ppt-card-field"><span class="ppt-col-label">Event</span><select class="pd' + (s.evId ? ' hs' : '') + '" data-dropdown="ev-event" data-sc="' + sc + '">' + buildEventOptions(s.evId) + '</select></div>';
    } else {
      evCol = '<div class="ppt-card-field"><span class="ppt-col-label">Event</span><span class="pcv">' + s.evNm + '</span></div>';
    }

    // Date + venue info
    var infoCol = '';
    if (s.evId && !isEd) {
      var venue = s.evVenue || d.location || '';
      infoCol = '<div class="ppt-card-field"><span class="ppt-col-label">Date / Venue</span><span class="pcv" style="font-size:10px;color:#888;">' + (dateInfo ? dateInfo : '—') + (venue ? ' · ' + venue : '') + '</span></div>';
    }

    var ah = isEd ? '<a class="ppt-cancel-lnk visible" data-action="cancel-ev" data-sc="' + sc + '">cancel</a>' : (s.evId ? '<a class="pei" data-action="edit-ev" data-sc="' + sc + '" title="Edit">✎</a>' : '<span style="color:#ccc;">—</span>');
    var chev = '<span class="pch" data-action="toggle-drawer" data-sc="' + sc + '">▾</span>';

    var tCls = 'ptc evc' + (isEd ? ' hp' : (s.dirty ? ' has-pending' : ''));
    var html = '<div class="ptw" id="wrapper-' + sc + '"><div class="' + tCls + '" id="tile-' + sc + '"><div class="pcs">' + sc + '</div><div class="ptc-body">' + evCol + infoCol + '</div><div class="pca">' + ah + chev + '</div></div>' + buildEvDrawer(sc) + '</div>';

    var ex = document.getElementById('wrapper-' + sc);
    if (ex) {
      var dO = document.getElementById('drawer-' + sc) ? document.getElementById('drawer-' + sc).classList.contains('open') : false;
      ex.outerHTML = html;
      if (dO) {
        var d2 = document.getElementById('drawer-' + sc); if (d2) d2.classList.add('open');
        var t2 = document.getElementById('tile-' + sc); var ch2 = t2 ? t2.querySelector('.pch') : null; if (ch2) ch2.classList.add('open');
      }
    } else {
      var g = document.getElementById('ev-grid'); if (g) g.insertAdjacentHTML('beforeend', html);
    }
    bindEvEvents(sc);
  }

  function renderAllEv() { for (var i = 1; i <= 4; i++) renderEv('EV-' + i); }

  function bindEvEvents(sc) {
    var t = document.getElementById('tile-' + sc); if (!t) return;
    var ev = t.querySelector('[data-dropdown="ev-event"][data-sc="' + sc + '"]');
    if (ev) ev.addEventListener('change', function() { handleEvEventChange(sc, ev); });
    var eb = t.querySelector('[data-action="edit-ev"][data-sc="' + sc + '"]');
    if (eb) eb.addEventListener('click', function() {
      var s = state[sc]; if (!s) return;
      originalState[sc] = Object.assign({}, s);
      s.dirty = true;
      renderEv(sc); updateEvProgress();
    });
    var cb = t.querySelector('[data-action="cancel-ev"][data-sc="' + sc + '"]');
    if (cb) cb.addEventListener('click', function() {
      var s = state[sc], o = originalState[sc];
      if (s && o) { Object.assign(s, o); s.dirty = false; delete originalState[sc]; }
      renderEv(sc); updateEvProgress();
    });
    var ch = t.querySelector('[data-action="toggle-drawer"][data-sc="' + sc + '"]');
    if (ch) ch.addEventListener('click', function() { tD(sc); });
  }

  function handleEvEventChange(sc, sel) {
    var s = state[sc]; if (!s) return;
    if (!originalState[sc]) originalState[sc] = Object.assign({}, s);
    var opt = sel.options[sel.selectedIndex];
    var newId = opt ? opt.value || '' : '';
    s.evId = newId;
    s.evNm = opt ? opt.textContent || '' : '';
    // Read extra fields from library
    var lib = newId ? document.querySelector('.events-wrapper[data-event-id="' + newId + '"]') : null;
    s.evMonth = lib ? lib.dataset.eventMonth || '' : '';
    s.evDay = lib ? lib.dataset.eventDay || '' : '';
    s.evTime = lib ? lib.dataset.eventTime || '' : '';
    s.evVenue = lib ? lib.dataset.eventLocation || '' : '';
    s.dirty = true;
    renderEv(sc); updateEvProgress();
  }

  function updateEvProgress() {
    updateSlotIndicators('ev', 4, function(c) { var s = state[c]; return !!(s && s.evId && !s.dirty); });
    var pc = 0;
    for (var i = 1; i <= 4; i++) { var s = state['EV-' + i]; if (s && s.dirty) pc++; }
    updateSaveButton('ev', pc > 0 || evSponsorDirty);
  }

  // ═══ SUBMIT — per-slot, URLSearchParams, no-cors ═══
  window.submitSection = async function(section) {
    var btn = document.getElementById(section+'-submit-btn');
    if (!btn || btn.classList.contains('submitting')) return;
    btn.classList.add('submitting'); btn.textContent = 'Saving...';
    var pubplanId = getPubplanId(), slots = [];

    if (section === 'gr') {
      var s=state['GR-1']; if(s&&s.dirty) slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':s.sc,'hidden-titleadmin-id':s.titleadminId||'','hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-gr-title':s.grTit,'hidden-gr-message':s.grMsg,'hidden-gr-supershort':s.grSS});
    } else if (section === 'em') {
      var s=state['EM-1']; if(s&&s.dirty) slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':s.sc,'hidden-titleadmin-id':s.titleadminId||'','hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-em-subject':s.emSub,'hidden-em-preview':s.emPre});
    } else if (section === 'fa') {
      for(var i=1;i<=4;i++){var s=state['FA-'+i];if(s&&s.dirty)slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':s.catChanged?('FA-CAT-'+i):s.sc,'hidden-titleadmin-id':s.titleadminId||'','hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-category-id':s.catId,'hidden-category-name':s.catNm,'hidden-category-type':s.catType,'hidden-customer-id':s.custId,'hidden-customer-name':s.custNm,'hidden-article-id':s.artId,'hidden-article-name':s.artNm,'hidden-sponsor-id':s.sponsorId,'hidden-ba-picker-id':s.artAdId||'','hidden-no-sponsor':s.noSponsor});}
    } else if (section === 'ts') {
      for(var i=1;i<=4;i++){var s=state['TS-'+i];if(s&&s.dirty)slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':s.catChanged?('TS-CAT-'+i):s.sc,'hidden-titleadmin-id':s.titleadminId||'','hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-category-id':s.catId,'hidden-category-name':s.catNm,'hidden-category-type':s.catType,'hidden-customer-id':s.custId,'hidden-customer-name':s.custNm,'hidden-article-id':s.artId,'hidden-article-name':s.artNm,'hidden-sponsor-id':s.sponsorId,'hidden-ba-picker-id':s.artAdId||'','hidden-no-sponsor':s.noSponsor});}
    } else if (section === 'ba') {
      for(var i=1;i<=12;i++){var s=state['BA-'+i];if(s&&s.dirty)slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':s.sc,'hidden-titleadmin-id':s.titleadminId||'','hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-category-id':s.catId,'hidden-category-name':s.catNm,'hidden-customer-id':s.custId,'hidden-customer-name':s.custNm,'hidden-ad-id':s.adId});}
    } else if (section === 'tf') {
      // FIX #22: Category-level POST fires only when user selected a category (dirty)
      if (tfCategoryDirty && tfCategoryId) {
        slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':'TF-CAT','hidden-titleadmin-id':getTitleadminId(),'hidden-section-code':'tf','hidden-category-group':'The Find','hidden-customer-id':'','hidden-customer-name':'','hidden-category-id':tfCategoryId,'hidden-category-name':tfCategoryNm,'hidden-tf-mode':currentTfMode});
      }
      // Per-slot POSTs for dirty slots with customer data
      if(currentTfMode==='txa'){for(var i=1;i<=5;i++){var s=state['TXA-'+i];if(s&&s.dirty&&s.custId)slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':s.sc,'hidden-titleadmin-id':s.titleadminId||'','hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-customer-id':s.custId,'hidden-customer-name':s.custNm,'hidden-category-id':tfCategoryId,'hidden-category-name':tfCategoryNm,'hidden-tf-mode':'txa'});}}
      // FIX #23: LBP path includes hidden-category-id and hidden-titleadmin-id
      else{var s=state['LBP-1'];if(s&&s.dirty&&s.custId)slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':'LBP-1','hidden-titleadmin-id':s.titleadminId||getTitleadminId(),'hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-customer-id':s.custId,'hidden-customer-name':s.custNm,'hidden-category-id':tfCategoryId,'hidden-category-name':tfCategoryNm,'hidden-tf-mode':'lbp'});}
    } else if (section === 'ev') {
      // Sponsor-level POST
      if (evSponsorDirty) {
        slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':'EV-SPONSOR','hidden-titleadmin-id':getTitleadminId(),'hidden-section-code':'ev','hidden-category-group':'Events','hidden-customer-id':evSponsorId,'hidden-customer-name':evSponsorNm,'hidden-sponsor-id':evSponsorId,'hidden-sponsor-name':evSponsorNm});
      }
      // Per-slot POSTs
      for(var i=1;i<=4;i++){var s=state['EV-'+i];if(s&&s.dirty)slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':s.sc,'hidden-titleadmin-id':s.titleadminId||getTitleadminId(),'hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-event-id':s.evId,'hidden-event-name':s.evNm});}
    }

    if(!slots.length){btn.classList.remove('submitting');btn.textContent='Save '+section.toUpperCase()+' Changes';showToast('No changes to save.');return;}

    try{
      await Promise.all(slots.map(function(slot){return fetch(WEBHOOK_URLS[section],{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(slot).toString()});}));
      showToast(section.toUpperCase()+' saved! Refreshing in 3s…');
      setTimeout(function(){window.location.reload();},3000);
    }catch(e){
      showToast('Network error — changes not saved. Please try again.',true);
      btn.classList.remove('submitting');btn.textContent='Save '+section.toUpperCase()+' Changes';
    }
  };

  // ═══ INIT ═══
  function init() {
    var nameEl=document.getElementById('pubplan-name-display'),dw=document.querySelector('.pubplan-data-wrapper');
    if(nameEl&&dw) nameEl.textContent=dw.dataset.pubplanName||'';

    var tfEl=document.querySelector('[data-tf-mode]');
    currentTfMode=(tfEl&&tfEl.dataset.tfMode)?tfEl.dataset.tfMode:'txa';

    initGrState(); initEmState(); initFaState(); initTsState(); initBaState(); initTxaState(); initLbpState(); initEvState(); initEvSponsor();

    // Read catId from TXA-1 slot wrapper DOM element directly
    var tfSlotEl = document.querySelector('.txa-slot-wrapper[data-slot-code="TXA-1"]');
    tfCategoryId = (tfSlotEl && tfSlotEl.getAttribute('data-cat-id')) || '';
    tfCategoryNm = '';
    if (tfCategoryId) {
      var catEl = document.querySelector('.products-wrapper[data-id="' + tfCategoryId + '"]');
      if (catEl) {
        tfCategoryNm = catEl.dataset.name || '';
        var prodSecCode = catEl.dataset.sectionCode || '';
        if (prodSecCode === 'lbp') currentTfMode = 'lbp';
        else if (prodSecCode === 'txa') currentTfMode = 'txa';
      }
    }
    tfOriginalCategoryId = tfCategoryId;

    // FIX #22: renderTfCategory handles dropdown/text display + slot visibility
    renderTfCategory();

    renderGr(); renderEm(); renderAllFa(); renderAllTs(); renderAllBa(); renderAllTxa(); renderLbp(); renderEvSponsor(); renderAllEv();
    updateGrProgress(); updateEmProgress(); updateFaProgress(); updateTsProgress(); updateBaProgress(); updateTfProgress(); updateEvProgress();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();

})();
