// ============================================================
// PUBPLAN TILE UI — v5.0.8
// Fixes from v5.0.7:
//   FIX #11: No Sponsor checkbox moved inside Sponsor column label
//   FIX #12: Sponsor column placeholder for non-Sponsorable rows
//   FIX #13: Pencil + chevron horizontal layout
// Prior fixes: #1-#10 (see v5.0.6 changelog)
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

  const SECTION_ANCHORS = { gr:'gr-loc', em:'em-loc', fa:'fa-loc', ts:'ts-loc', ba:'ba-loc', tf:'tf-loc' };
  const GR_LIMITS = { grTit: 50, grMsg: 300 };
  const EM_LIMITS = { emSub: 60, emPre: 100 };

  const state = {};
  const originalState = {};
  let currentTfMode = null;

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
    state['GR-1'] = { sc: el ? el.dataset.slotCode || 'GR-1' : 'GR-1', secC: 'gr', slotNum: 1, section: 'Greeting', pubplanId: el ? el.dataset.pubplanId || '' : '', titleadminId: el ? el.dataset.titleadminId || '' : '', grTit: el ? el.dataset.greetingTitle || '' : '', grMsg: el ? el.dataset.greetingMessage || '' : '', dirty: false };
  }
  function renderGr() {
    var s = state['GR-1']; if (!s) return;
    var isEd = s.dirty || !!originalState['GR-1'], hasC = s.grTit || s.grMsg, fh;
    if (isEd) {
      fh = '<div class="pc" style="flex:1;"><span class="ppt-col-label">Greeting Title</span><input type="text" class="pi" data-field="grTit" maxlength="'+GR_LIMITS.grTit+'" value="'+(s.grTit||'').replace(/"/g,'&quot;')+'" placeholder="title...">'+charCountHtml(GR_LIMITS.grTit,s.grTit)+'</div><div class="pc" style="flex:2;"><span class="ppt-col-label">Greeting Message</span><textarea class="ppt-textarea" data-field="grMsg" maxlength="'+GR_LIMITS.grMsg+'" placeholder="message...">'+(s.grMsg||'')+'</textarea>'+charCountHtml(GR_LIMITS.grMsg,s.grMsg)+'</div>';
    } else if (hasC) {
      fh = '<div class="pc" style="flex:1;"><span class="ppt-col-label">Greeting Title</span><span class="pcv">'+(s.grTit||'—')+'</span></div><div class="pc" style="flex:2;"><span class="ppt-col-label">Greeting Message</span><span class="pcv">'+(s.grMsg||'—')+'</span></div>';
    } else {
      fh = '<div class="pc" style="flex:1;"><span style="color:#ccc;">No greeting set. Click edit to add.</span></div>';
    }
    var ah = isEd ? '<a class="ppt-cancel-lnk visible" data-action="cancel-gr">cancel</a>' : '<a class="pei" data-action="edit-gr" title="Edit">✎</a>';
    var html = '<div class="ptr grr'+(isEd?' hp':'')+'" id="tile-gr-1"><div class="psi sgr">GR-1</div>'+fh+'<div class="pac">'+ah+'</div></div>';
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
  function updateGrProgress() { updateSlotIndicators('gr',1,function(c){var s=state[c];return!!(s&&s.grTit&&s.grMsg);}); var s=state['GR-1']; updateSaveButton('gr',s&&s.dirty); }

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
    var GM = { 'FA':['FA','Feature Article','Feature Articles'], 'TS':['TS','Themed Spotlight','Themed Spotlights'] };
    var vg = GM[grp]||[grp], cats = [];
    els.forEach(function(el) { if (vg.indexOf(el.dataset.group)!==-1 && el.dataset.id) cats.push({id:el.dataset.id,name:el.dataset.name||'(unnamed)',type:el.dataset.type||''}); });
    if (!cats.length) return '<option value="" disabled selected>No categories</option>';
    cats.sort(function(a,b){return a.name.localeCompare(b.name);});
    return '<option value="" disabled'+(!selId?' selected':'')+'>Select category...</option>'+cats.map(function(c){return '<option value="'+c.id+'" data-type="'+c.type+'"'+(c.id===selId?' selected':'')+'>'+c.name+'</option>';}).join('');
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
      state[code] = { sc:code, secC:'fa', section:el.dataset.section||'Feature Article', slotNum:parseInt(code.replace(/\D/g,''),10), pubplanId:el.dataset.pubplanId||'', titleadminId:el.dataset.titleadminId||'', catId:faCatId, catNm:faCatNm, catType:getCatType(faCatId), artId:faArtId, artNm:faArtNm, custId:el.dataset.customerId||'', custNm:el.dataset.customerName||'', sponsorId:el.dataset.sponsorId||'', sponNm:el.dataset.sponsorName||'', artAdId:el.dataset.artAdId||'', artAdUrl:el.dataset.artAdUrl||'', artAdGo:el.dataset.artAdGo||'', nlSponsored:el.dataset.nlSponsored||'', noSponsor:false, catChanged:false, dirty:false };
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

    // Category
    var catCol;
    if (!isEd) {
      catCol = s.catId
        ? '<div class="pc"><span class="ppt-col-label">Category</span><span class="pcp cfa">'+(s.catNm||'—')+'</span></div>'
        : '<div class="pc"><span class="ppt-col-label">Category</span><select class="pd" data-dropdown="fa-cat" data-sc="'+sc+'">'+buildCategoryOptions('FA','')+'</select></div>';
    } else {
      catCol = '<div class="pc"><span class="ppt-col-label">Category</span><select class="pd'+(s.catId?' hs':'')+'" data-dropdown="fa-cat" data-sc="'+sc+'">'+buildCategoryOptions('FA',s.catId)+'</select></div>';
    }

    // Customer (Paid only)
    var custCol = '';
    if (isPaid) {
      custCol = (!isEd && s.custId)
        ? '<div class="pc"><span class="ppt-col-label">Customer</span><span class="pcv">'+s.custNm+'</span></div>'
        : '<div class="pc"><span class="ppt-col-label">Customer</span><select class="pd'+(s.custId?' hs':'')+'" data-dropdown="fa-cust" data-sc="'+sc+'"'+(!s.catId?' disabled':'')+'>' + buildCustomerOptions(s.custId,'--') + '</select></div>';
    }

    // Article
    var artDis = (!s.catId || (isPaid && !s.custId)) ? ' disabled' : '';
    var artCol = (!isEd && s.artId)
      ? '<div class="pc"><span class="ppt-col-label">Article</span><span class="pcv">'+s.artNm+'</span></div>'
      : '<div class="pc"><span class="ppt-col-label">Article</span><select class="pd'+(s.artId?' hs':'')+'" data-dropdown="fa-art" data-sc="'+sc+'"'+artDis+'>'+buildFaArticleOptions(isPaid?s.custId:'',s.catId,s.artId)+'</select></div>';

    // FIX #11/#12: Sponsor column — checkbox inside label, placeholder when not Sponsorable
    var sponCol = '';
    if (isSpon) {
      var noSpHtml = '<label class="pxl pxl-right"><input type="checkbox" data-checkbox="fa-nospon" data-sc="'+sc+'"'+(s.noSponsor?' checked':'')+'>No Sponsor</label>';
      sponCol = s.noSponsor
        ? '<div class="pc"><span class="ppt-col-label">Sponsor'+noSpHtml+'</span><span class="pcv ns" style="font-style:italic;color:#999;">No sponsor</span></div>'
        : '<div class="pc"><span class="ppt-col-label">Sponsor'+noSpHtml+'</span><select class="pd'+(s.sponsorId?' hs':'')+'" data-dropdown="fa-spon" data-sc="'+sc+'">'+buildCustomerOptions(s.sponsorId,'Select sponsor...')+'</select></div>';
    } else if (!isPaid) {
      sponCol = '<div class="pc"><span class="ppt-col-label" style="visibility:hidden;">Sponsor</span></div>';
    }

    // Actions — FIX #11: noSpHtml is NOT here anymore, it is inside sponCol label
    var actionHtml = '';
    if (isEd) { actionHtml += '<a class="ppt-cancel-lnk visible" data-action="cancel-fa" data-sc="'+sc+'">cancel</a>'; }
    else if (s.catId) { actionHtml += '<a class="pei" data-action="edit-fa" data-sc="'+sc+'" title="Edit">✎</a>'; }
    else { actionHtml += '<span style="color:#ccc;">—</span>'; }
    var chevHtml = '<span class="pch" data-action="toggle-drawer" data-sc="'+sc+'">▾</span>';

    var tCls = 'ptr' + (isEd ? ' hp' : (s.dirty && s.sponDirtyOnly ? ' spon-pending' : ''));
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
      state[code] = { sc:code, secC:'ts', section:el.dataset.section||'Themed Spotlight', slotNum:parseInt(code.replace(/\D/g,''),10), pubplanId:el.dataset.pubplanId||'', titleadminId:el.dataset.titleadminId||'', catId:tsCatId, catNm:tsCatNm, catType:getCatType(tsCatId), artId:tsArtId, artNm:tsArtNm, custId:el.dataset.customerId||'', custNm:el.dataset.customerName||'', sponsorId:el.dataset.sponsorId||'', sponNm:el.dataset.sponsorName||'', artAdId:el.dataset.artAdId||'', artAdUrl:el.dataset.artAdUrl||'', artAdGo:el.dataset.artAdGo||'', noSponsor:el.dataset.noSponsor==='true', catChanged:false, dirty:false };
    });
    for (var i=1;i<=4;i++) { var c='TS-'+i; if(!state[c]) state[c]={sc:c,secC:'ts',slotNum:i,section:'Themed Spotlight',pubplanId:'',titleadminId:'',catId:'',catNm:'',catType:'',artId:'',artNm:'',custId:'',custNm:'',sponsorId:'',sponNm:'',artAdId:'',artAdUrl:'',artAdGo:'',noSponsor:false,catChanged:false,dirty:false}; }
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

    // FIX #11/#12: Sponsor column with checkbox inside label
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

    var tCls = 'ptr tsr' + (isEd ? ' hp' : (s.dirty && s.sponDirtyOnly ? ' spon-pending' : ''));
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

  // ═══ THE FIND (TF) — MODE TOGGLE + TXA (5) + LBP (1) ═══
  window.switchTfMode = function(mode) {
    if(mode===currentTfMode) return;
    var hasTxa=[1,2,3,4,5].some(function(i){var s=state['TXA-'+i];return s&&s.dirty;}),hasLbp=state['LBP-1']&&state['LBP-1'].dirty;
    var hasChg=(currentTfMode==='txa'&&hasTxa)||(currentTfMode==='lbp'&&hasLbp);
    var doIt=function(){
      if(currentTfMode==='txa'){for(var i=1;i<=5;i++){var c='TXA-'+i;if(state[c]){state[c].dirty=false;state[c].custId='';state[c].custNm='';}delete originalState[c];}}
      else{if(state['LBP-1']){state['LBP-1'].dirty=false;state['LBP-1'].custId='';state['LBP-1'].custNm='';}delete originalState['LBP-1'];}
      currentTfMode=mode;
      document.querySelectorAll('.tf-mode-btn').forEach(function(b){b.classList.toggle('active',b.dataset.mode===mode);});
      var txa=document.querySelector('.the-find-txa'),lbp=document.querySelector('.the-find-lbp');
      if(txa)txa.classList.toggle('is-active',mode==='txa');if(lbp)lbp.classList.toggle('is-active',mode==='lbp');
      var ce=document.getElementById('tf-slot-count');if(ce)ce.textContent=mode==='txa'?'5 slots':'1 slot';
      updateTfProgress();
    };
    if(hasChg){var btn=document.querySelector('.tf-mode-btn[data-mode="'+mode+'"]');showInlineConfirm(btn||document.getElementById('tf-submit-btn'),'Switching modes will clear unsaved changes.',doIt,null);}else{doIt();}
  };

  function initTxaState(){
    var els=document.querySelectorAll('.txa-slot-wrapper');
    els.forEach(function(el){var c=el.dataset.slotCode;if(!c)return;state[c]={sc:c,secC:'txa',slotNum:parseInt(c.replace(/\D/g,''),10),pubplanId:el.dataset.pubplanId||'',titleadminId:el.dataset.titleAdminId||el.dataset.titleadminId||'',section:el.dataset.section||'The Find',custId:el.dataset.customerId||'',custNm:el.dataset.customerName||'',catId:el.dataset.catId||'',dirty:false};});
    for(var i=1;i<=5;i++){var c='TXA-'+i;if(!state[c])state[c]={sc:c,secC:'txa',slotNum:i,section:'The Find',pubplanId:'',titleadminId:'',custId:'',custNm:'',catId:'',dirty:false};}
  }
  function getTxaPickerData(n){var w=document.querySelector('.txa-picker-wrapper');if(!w)return{};var px='txa'+n;return{logoLink:w.dataset[px+'LogoLink']||'',redirect:w.dataset[px+'Redirect']||'',headline:w.dataset[px+'Headline']||'',body:w.dataset[px+'Body']||''};}
  function buildTxaDrawer(sc){var s=state[sc];if(!s)return'';var d=getTxaPickerData(s.slotNum);var fs=[{l:'Logo',v:d.logoLink?'Present':'—',s:d.logoLink?'ok':(s.custId?'bad':'na')},{l:'Redirect',v:d.redirect?'Present':'—',s:d.redirect?'ok':(s.custId?'bad':'na')},{l:'Headline',v:d.headline||'—',s:d.headline?'ok':(s.custId?'bad':'na')},{l:'Body Text',v:d.body?'Present':'—',s:d.body?'ok':(s.custId?'bad':'na')}];var fh=fs.map(function(f){var ic=f.s==='ok'?'✓':(f.s==='bad'?'✕':'—');return'<div class="pdr-field"><span class="pdr-label">'+f.l+'</span><span class="pdr-value">'+f.v+'</span></div><div class="pdr-status">'+statusIcon(f.s,ic)+'</div>';}).join('');return'<div class="pdr" id="drawer-'+sc+'"><div class="pdr-grid" style="grid-template-columns:repeat(2,1fr 60px);">'+fh+'</div></div>';}

  function renderTxa(sc){
    var s=state[sc];if(!s)return;var isEd=s.dirty||!!originalState[sc],d=getTxaPickerData(s.slotNum);
    var logo='';if(s.custId&&d.logoLink)logo='<img src="'+d.logoLink+'" class="ppt-ad-thumb" alt="">';else if(s.custId&&!d.logoLink)logo='<div class="ppt-ad-thumb-placeholder">🖼</div>';
    var custCol=s.custId&&!isEd?'<div class="ppt-card-field"><span class="ppt-col-label">Customer</span><span class="pcv">'+s.custNm+'</span></div>':'<div class="ppt-card-field"><span class="ppt-col-label">Customer</span><select class="pd'+(s.custId?' hs':'')+'" data-dropdown="txa-cust" data-sc="'+sc+'">'+buildCustomerOptions(s.custId,'Select customer...')+'</select></div>';
    var ah=isEd?'<a class="ppt-cancel-lnk visible" data-action="cancel-txa" data-sc="'+sc+'">cancel</a>':(s.custId?'<a class="pei" data-action="edit-txa" data-sc="'+sc+'" title="Edit">✎</a>':'<span style="color:#ccc;">—</span>');
    var chev='<span class="pch" data-action="toggle-drawer" data-sc="'+sc+'">▾</span>';
    var html='<div class="ptw" id="wrapper-'+sc+'"><div class="ptc tfc'+(isEd?' hp':'')+'" id="tile-'+sc+'"><div class="pcs">'+sc+'</div>'+logo+'<div class="ptc-body">'+custCol+'</div><div class="pca">'+ah+chev+'</div></div>'+buildTxaDrawer(sc)+'</div>';
    var ex=document.getElementById('wrapper-'+sc);
    if(ex){var dO=document.getElementById('drawer-'+sc)?document.getElementById('drawer-'+sc).classList.contains('open'):false;ex.outerHTML=html;if(dO){var d2=document.getElementById('drawer-'+sc);if(d2)d2.classList.add('open');var t2=document.getElementById('tile-'+sc);var ch2=t2?t2.querySelector('.pch'):null;if(ch2)ch2.classList.add('open');}}
    else{var g=document.getElementById('txa-grid');if(g)g.insertAdjacentHTML('beforeend',html);}
    bindTxaEvents(sc);
  }
  function renderAllTxa(){for(var i=1;i<=5;i++)renderTxa('TXA-'+i);}
  function bindTxaEvents(sc){var t=document.getElementById('tile-'+sc);if(!t)return;var cu=t.querySelector('[data-dropdown="txa-cust"][data-sc="'+sc+'"]');if(cu)cu.addEventListener('change',function(){var s=state[sc];if(!s)return;if(!originalState[sc])originalState[sc]=Object.assign({},s);var o=cu.options[cu.selectedIndex];s.custId=o?o.value||'':'';s.custNm=o?o.textContent||'':'';s.dirty=true;renderTxa(sc);updateTfProgress();});var eb=t.querySelector('[data-action="edit-txa"][data-sc="'+sc+'"]');if(eb)eb.addEventListener('click',function(){var s=state[sc];if(!s)return;originalState[sc]=Object.assign({},s);s.dirty=true;renderTxa(sc);updateTfProgress();});var cb=t.querySelector('[data-action="cancel-txa"][data-sc="'+sc+'"]');if(cb)cb.addEventListener('click',function(){var s=state[sc],o=originalState[sc];if(s&&o){Object.assign(s,o);s.dirty=false;delete originalState[sc];}renderTxa(sc);updateTfProgress();});var ch=t.querySelector('[data-action="toggle-drawer"][data-sc="'+sc+'"]');if(ch)ch.addEventListener('click',function(){tD(sc);});}

  function initLbpState(){var el=document.querySelector('.txa-slot-wrapper[data-slot-code="TXA-1"]');state['LBP-1']={sc:'LBP-1',secC:'lbp',section:'The Find',titleadminId:el?(el.dataset.titleAdminId||el.dataset.titleadminId||''):getTitleadminId(),custId:el?el.dataset.customerId||'':'',custNm:el?el.dataset.customerName||'':'',dirty:false};}
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

  function updateTfProgress(){
    var cnt=currentTfMode==='txa'?5:1,pfx=currentTfMode==='txa'?'TXA':'LBP';
    updateSlotIndicators('tf',cnt,function(c){var idx=parseInt(c.split('-')[1]);var s=state[pfx+'-'+idx];return!!(s&&s.custId);});
    var pc=0;
    if(currentTfMode==='txa'){for(var i=1;i<=5;i++){var s=state['TXA-'+i];if(s&&s.dirty)pc++;}}
    else{if(state['LBP-1']&&state['LBP-1'].dirty)pc++;}
    updateSaveButton('tf',pc>0);
  }

  // ═══ SUBMIT — per-slot, URLSearchParams, no-cors ═══
  window.submitSection = async function(section) {
    var btn = document.getElementById(section+'-submit-btn');
    if (!btn || btn.classList.contains('submitting')) return;
    btn.classList.add('submitting'); btn.textContent = 'Saving...';
    var pubplanId = getPubplanId(), slots = [];

    if (section === 'gr') {
      var s=state['GR-1']; if(s&&s.dirty) slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':s.sc,'hidden-titleadmin-id':s.titleadminId||'','hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-gr-title':s.grTit,'hidden-gr-message':s.grMsg});
    } else if (section === 'em') {
      var s=state['EM-1']; if(s&&s.dirty) slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':s.sc,'hidden-titleadmin-id':s.titleadminId||'','hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-em-subject':s.emSub,'hidden-em-preview':s.emPre});
    } else if (section === 'fa') {
      for(var i=1;i<=4;i++){var s=state['FA-'+i];if(s&&s.dirty)slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':s.catChanged?('FA-CAT-'+i):s.sc,'hidden-titleadmin-id':s.titleadminId||'','hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-category-id':s.catId,'hidden-category-name':s.catNm,'hidden-category-type':s.catType,'hidden-customer-id':s.custId,'hidden-customer-name':s.custNm,'hidden-article-id':s.artId,'hidden-article-name':s.artNm,'hidden-sponsor-id':s.sponsorId,'hidden-ba-picker-id':s.artAdId||'','hidden-no-sponsor':s.noSponsor});}
    } else if (section === 'ts') {
      for(var i=1;i<=4;i++){var s=state['TS-'+i];if(s&&s.dirty)slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':s.catChanged?('TS-CAT-'+i):s.sc,'hidden-titleadmin-id':s.titleadminId||'','hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-category-id':s.catId,'hidden-category-name':s.catNm,'hidden-category-type':s.catType,'hidden-customer-id':s.custId,'hidden-customer-name':s.custNm,'hidden-article-id':s.artId,'hidden-article-name':s.artNm,'hidden-sponsor-id':s.sponsorId,'hidden-ba-picker-id':s.artAdId||'','hidden-no-sponsor':s.noSponsor});}
    } else if (section === 'ba') {
      for(var i=1;i<=12;i++){var s=state['BA-'+i];if(s&&s.dirty)slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':s.sc,'hidden-titleadmin-id':s.titleadminId||'','hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-category-id':s.catId,'hidden-category-name':s.catNm,'hidden-customer-id':s.custId,'hidden-customer-name':s.custNm,'hidden-ad-id':s.adId});}
    } else if (section === 'tf') {
      if(currentTfMode==='txa'){for(var i=1;i<=5;i++){var s=state['TXA-'+i];if(s&&s.dirty)slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':s.sc,'hidden-titleadmin-id':s.titleadminId||'','hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-customer-id':s.custId,'hidden-customer-name':s.custNm,'hidden-category-id':s.catId});}}
      else{var s=state['LBP-1'];if(s&&s.dirty)slots.push({'hidden-pubplan-id':pubplanId,'hidden-slot-label':s.sc,'hidden-titleadmin-id':s.titleadminId||'','hidden-section-code':s.secC,'hidden-category-group':s.section,'hidden-customer-id':s.custId,'hidden-customer-name':s.custNm});}
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
    document.querySelectorAll('.tf-mode-btn').forEach(function(b){b.classList.toggle('active',b.dataset.mode===currentTfMode);});
    var txa=document.querySelector('.the-find-txa'),lbp=document.querySelector('.the-find-lbp');
    if(txa)txa.classList.toggle('is-active',currentTfMode==='txa');if(lbp)lbp.classList.toggle('is-active',currentTfMode==='lbp');

    initGrState(); initEmState(); initFaState(); initTsState(); initBaState(); initTxaState(); initLbpState();
    renderGr(); renderEm(); renderAllFa(); renderAllTs(); renderAllBa(); renderAllTxa(); renderLbp();
    updateGrProgress(); updateEmProgress(); updateFaProgress(); updateTsProgress(); updateBaProgress(); updateTfProgress();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();

})();
