// pubplan-v4.js — v4.0.4
// ── SECTION TOGGLE — defined outside IIFE so HTML onclick can reach it ──
window.toggleSection = function(section) {
  const el = document.getElementById('section-' + section);
  if (el) el.classList.toggle('collapsed');
};

(function(){
'use strict';

const WEBHOOK_URLS = {
  gr: 'https://hook.us1.make.com/ganq7imi5erisgnlplsmhicog6ixjdwq',
  em: 'https://hook.us1.make.com/ganq7imi5erisgnlplsmhicog6ixjdwq',
  fa: 'https://hook.us1.make.com/4cbueud23qmtrkwq396rgw2yhh5yzajb',
  ts: 'https://hook.us1.make.com/4cbueud23qmtrkwq396rgw2yhh5yzajb',
  ba: 'https://hook.us1.make.com/gr6i2ang1gpgox8ipotppi26gbjj1f7d',
  tf: 'https://hook.us1.make.com/4cbueud23qmtrkwq396rgw2yhh5yzajb'
};

const state = {};
const origSt = {};
let currentTfMode = 'txa';

/* ─── UTILITIES ─── */
function pill(status, label) {
  const icons = { ok: '✓', bad: '✕', na: '—' };
  return `<div class="pmp ${status}">${icons[status]} ${label}</div>`;
}

function icon(status, symbol) {
  return `<div class="pio ${status}">${symbol}</div>`;
}

function showToast(msg, isError) {
  const t = document.getElementById('ppt-toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'ppt-toast show' + (isError ? ' error' : '');
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* ─── SECTION TOGGLE — defined above IIFE ─── */

/* ─── DRAWER TOGGLE ─── */
window.tD = function(sc) {
  const drawer = document.getElementById(`drawer-${sc}`);
  const tile = document.getElementById(`tile-${sc}`);
  const chevron = tile ? tile.querySelector('.pch') : null;
  if (drawer) {
    drawer.classList.toggle('open');
    chevron && chevron.classList.toggle('open');
  }
};

/* ─── SLOT INDICATORS ─── */
function updSlotInd(section, count, readyFn) {
  const container = document.getElementById(`${section}-indicators`);
  if (!container) return;
  let html = '';
  for (let i = 1; i <= count; i++) {
    const code = `${section}-${i}`;
    const isReady = readyFn(code);
    html += `<div class="ppt-slot-dot ${isReady ? 'ready' : 'empty'}">${i}</div>`;
  }
  container.innerHTML = html;
}

function getPubplanId() {
  const el = document.querySelector('.pubplan-slot-wrapper[data-pubplan-id]');
  return el ? el.dataset.pubplanId || '' : '';
}

/* ─── OPTION BUILDERS ─── */
function buildCustomerOptions(selectedId) {
  const custEls = document.querySelectorAll('.customers-wrapper');
  const allCust = [];
  custEls.forEach(el => {
    if (el.dataset.id) {
      allCust.push({ id: el.dataset.id, name: el.dataset.name || '(unnamed)' });
    }
  });
  if (!allCust.length) return '<option value="" disabled selected>No customers</option>';
  return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select customer...</option>' +
    allCust.sort((a, b) => a.name.localeCompare(b.name))
      .map(c => `<option value="${c.id}"${c.id === selectedId ? ' selected' : ''}>${c.name}</option>`).join('');
}

function buildCustOpts(selectedId, placeholder) {
  const custEls = document.querySelectorAll('.customers-wrapper');
  const allCust = [];
  custEls.forEach(el => {
    if (el.dataset.id) {
      allCust.push({ id: el.dataset.id, name: el.dataset.name || '(unnamed)' });
    }
  });
  if (!allCust.length) return '<option value="" disabled selected>No options</option>';
  return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>' + placeholder + '</option>' +
    allCust.sort((a, b) => a.name.localeCompare(b.name))
      .map(c => `<option value="${c.id}"${c.id === selectedId ? ' selected' : ''}>${c.name}</option>`).join('');
}

function buildArtOpts(custId, selectedId) {
  const wrapper = document.querySelector('.fa-picker-wrapper');
  if (!wrapper) return '<option value="" disabled selected>No articles</option>';
  const items = Array.from(wrapper.querySelectorAll('.fa-picker-item')).filter(el => {
    return !custId || el.dataset.custId === custId;
  }).map(el => ({
    id: el.dataset.artId || '',
    name: el.dataset.artNm || ''
  })).filter(a => a.id && a.name);
  if (!items.length) return '<option value="" disabled selected>No articles</option>';
  return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select article...</option>' +
    items.map(a => `<option value="${a.id}"${a.id === selectedId ? ' selected' : ''}>${a.name}</option>`).join('');
}

function buildTsArtOpts(selectedId) {
  const wrapper = document.querySelector('.ts-picker-wrapper');
  if (!wrapper) return '<option value="" disabled selected>No articles</option>';
  const items = Array.from(wrapper.querySelectorAll('.ts-picker-item')).map(el => ({
    id: el.dataset.artId || '',
    name: el.dataset.artNm || ''
  })).filter(a => a.id && a.name);
  if (!items.length) return '<option value="" disabled selected>No articles</option>';
  return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select article...</option>' +
    items.map(a => `<option value="${a.id}"${a.id === selectedId ? ' selected' : ''}>${a.name}</option>`).join('');
}

function buildCatOpts(group, selectedId) {
  const prodEls = document.querySelectorAll('.product-wrapper');
  const cats = [];
  prodEls.forEach(el => {
    if (el.dataset.group === group && el.dataset.id) {
      cats.push({
        id: el.dataset.id,
        name: el.dataset.name || '(unnamed)',
        type: el.dataset.type || ''
      });
    }
  });
  if (!cats.length) return '<option value="" disabled selected>No categories</option>';
  cats.sort((a, b) => a.name.localeCompare(b.name));
  return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select category...</option>' +
    cats.map(c => `<option value="${c.id}" data-type="${c.type}"${c.id === selectedId ? ' selected' : ''}>${c.name}</option>`).join('');
}

function buildAdOptions(custId, selectedId) {
  const adEls = document.querySelectorAll('.ads-wrapper');
  const allAds = [];
  adEls.forEach(el => {
    const id = el.dataset.adId;
    if (id) {
      allAds.push({
        id,
        name: el.dataset.adName || el.dataset.adTitle || el.dataset.name || '(untitled)',
        custId: el.dataset.adCustomerId || el.dataset.custId || ''
      });
    }
  });
  const filtered = allAds.filter(a => !custId || a.custId === custId);
  if (!filtered.length) return '<option value="" disabled selected>No ads</option>';
  return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select ad...</option>' +
    filtered.sort((a, b) => a.name.localeCompare(b.name))
      .map(a => `<option value="${a.id}"${a.id === selectedId ? ' selected' : ''}>${a.name}</option>`).join('');
}

/* ─── CHAR COUNT HELPER ─── */
const GR_LIMITS = { grTit: 50, grMsg: 300 };
const EM_LIMITS = { emSub: 60, emPre: 100 };
function charCount(max, val) {
  const rem = Math.max(0, max - (val || '').length);
  const cls = rem <= max * 0.1 ? 'danger' : rem <= max * 0.2 ? 'warning' : '';
  return `<span class="pcc ${cls}">${rem} left</span>`;
}

/* ════════════════════════════════════════════════════════
   GREETING (GR)
════════════════════════════════════════════════════════ */
function initGrState() {
  const el = document.querySelector('.pubplan-slot-wrapper[data-section-code="gr"]');
  state['gr-1'] = {
    sc: 'gr-1', secC: 'gr', slotNum: 1,
    pubplanId: el ? el.dataset.ppId || '' : '',
    grTit: el ? el.dataset.grTitle || '' : '',
    grMsg: el ? el.dataset.grMessage || '' : '',
    dirty: false
  };
}

function renGr() {
  const s = state['gr-1'];
  if (!s) return;
  const isEd = s.dirty || origSt['gr-1'];
  const hasCon = s.grTit || s.grMsg;
  let cHtml;
  if (isEd) {
    cHtml = `<div class="pc" style="flex:1;"><span class="pcl">Greeting Title</span><input type="text" class="pi" maxlength="${GR_LIMITS.grTit}" value="${(s.grTit || '').replace(/"/g, '&quot;')}" oninput="onGrFieldChange('grTit',this)" placeholder="title...">${charCount(GR_LIMITS.grTit, s.grTit)}</div><div class="pc" style="flex:2;"><span class="pcl">Greeting Message</span><textarea class="ppt-textarea" maxlength="${GR_LIMITS.grMsg}" oninput="onGrFieldChange('grMsg',this)" placeholder="message...">${s.grMsg || ''}</textarea>${charCount(GR_LIMITS.grMsg, s.grMsg)}</div>`;
  } else if (hasCon) {
    cHtml = `<div class="pc" style="flex:1;"><span class="pcl">Greeting Title</span><span class="pcv">${s.grTit || '—'}</span></div><div class="pc" style="flex:2;"><span class="pcl">Greeting Message</span><span class="pcv">${s.grMsg || '—'}</span></div>`;
  } else {
    cHtml = `<div class="pc" style="flex:1;"><span style="color:#ccc;">No greeting set. Click edit to add.</span></div>`;
  }
  const actLnk = isEd
    ? `<a class="pcl visible" onclick="cancelGrEdit()">cancel</a>`
    : `<a class="pei" onclick="initGrEdit()" title="Edit">✎</a>`;
  const html = `<div class="ptr grr${isEd ? ' hp' : ''}" id="tile-gr-1"><div class="psi sgr">GR-1</div>${cHtml}<div class="pac">${actLnk}</div></div>`;
  const existing = document.getElementById('tile-gr-1');
  if (existing) { existing.outerHTML = html; } else { const grid = document.getElementById('gr-grid'); if (grid) grid.insertAdjacentHTML('beforeend', html); }
}

function updGrProg() {
  updSlotInd('gr', 1, (c) => !!(state[c] && state[c].grTit && state[c].grMsg));
  const btn = document.getElementById('gr-submit-btn');
  if (btn) btn.className = 'ppt-submit-btn' + (state['gr-1'] && state['gr-1'].dirty ? ' active' : '');
}

window.onGrFieldChange = function(f, el) {
  const s = state['gr-1'];
  if (!s) return;
  s[f] = el.value;
  s.dirty = true;
  const c = el.parentElement ? el.parentElement.querySelector('.pcc') : null;
  if (c) {
    const max = GR_LIMITS[f] || 100;
    const rem = Math.max(0, max - el.value.length);
    c.textContent = rem + ' left';
    c.className = 'pcc' + (rem <= max * 0.1 ? ' danger' : rem <= max * 0.2 ? ' warning' : '');
  }
  updGrProg();
};

window.initGrEdit = function() {
  const s = state['gr-1'];
  if (!s) return;
  origSt['gr-1'] = Object.assign({}, s);
  s.dirty = true;
  renGr();
  updGrProg();
};

window.cancelGrEdit = function() {
  const s = state['gr-1'];
  const o = origSt['gr-1'];
  if (s && o) { Object.assign(s, o); s.dirty = false; delete origSt['gr-1']; }
  renGr();
  updGrProg();
};

/* ════════════════════════════════════════════════════════
   EMAIL (EM)
════════════════════════════════════════════════════════ */
function initEmState() {
  const el = document.querySelector('.pubplan-slot-wrapper[data-section-code="em"]');
  state['em-1'] = {
    sc: 'em-1', secC: 'em', slotNum: 1,
    pubplanId: el ? el.dataset.ppId || '' : '',
    emSub: el ? el.dataset.emSubject || '' : '',
    emPre: el ? el.dataset.emPreview || '' : '',
    dirty: false
  };
}

function renEm() {
  const s = state['em-1'];
  if (!s) return;
  const isEd = s.dirty || origSt['em-1'];
  const hasCon = s.emSub || s.emPre;
  let cHtml;
  if (isEd) {
    cHtml = `<div class="pc" style="flex:1;"><span class="pcl">Email Subject</span><input type="text" class="pi" maxlength="${EM_LIMITS.emSub}" value="${(s.emSub || '').replace(/"/g, '&quot;')}" oninput="onEmFieldChange('emSub',this)" placeholder="subject...">${charCount(EM_LIMITS.emSub, s.emSub)}</div><div class="pc" style="flex:1;"><span class="pcl">Email Preview</span><input type="text" class="pi" maxlength="${EM_LIMITS.emPre}" value="${(s.emPre || '').replace(/"/g, '&quot;')}" oninput="onEmFieldChange('emPre',this)" placeholder="preview...">${charCount(EM_LIMITS.emPre, s.emPre)}</div>`;
  } else if (hasCon) {
    cHtml = `<div class="pc" style="flex:1;"><span class="pcl">Email Subject</span><span class="pcv">${s.emSub || '—'}</span></div><div class="pc" style="flex:1;"><span class="pcl">Email Preview</span><span class="pcv">${s.emPre || '—'}</span></div>`;
  } else {
    cHtml = `<div class="pc" style="flex:1;"><span style="color:#ccc;">No email settings. Click edit to add.</span></div>`;
  }
  const actLnk = isEd
    ? `<a class="pcl visible" onclick="cancelEmEdit()">cancel</a>`
    : `<a class="pei" onclick="initEmEdit()" title="Edit">✎</a>`;
  const html = `<div class="ptr emr${isEd ? ' hp' : ''}" id="tile-em-1"><div class="psi sem">EM-1</div>${cHtml}<div class="pac">${actLnk}</div></div>`;
  const existing = document.getElementById('tile-em-1');
  if (existing) { existing.outerHTML = html; } else { const grid = document.getElementById('em-grid'); if (grid) grid.insertAdjacentHTML('beforeend', html); }
}

function updEmProg() {
  updSlotInd('em', 1, (c) => !!(state[c] && state[c].emSub && state[c].emPre));
  const btn = document.getElementById('em-submit-btn');
  if (btn) btn.className = 'ppt-submit-btn' + (state['em-1'] && state['em-1'].dirty ? ' active' : '');
}

window.onEmFieldChange = function(f, el) {
  const s = state['em-1'];
  if (!s) return;
  s[f] = el.value;
  s.dirty = true;
  const c = el.parentElement ? el.parentElement.querySelector('.pcc') : null;
  if (c) {
    const max = EM_LIMITS[f] || 100;
    const rem = Math.max(0, max - el.value.length);
    c.textContent = rem + ' left';
    c.className = 'pcc' + (rem <= max * 0.1 ? ' danger' : rem <= max * 0.2 ? ' warning' : '');
  }
  updEmProg();
};

window.initEmEdit = function() {
  const s = state['em-1'];
  if (!s) return;
  origSt['em-1'] = Object.assign({}, s);
  s.dirty = true;
  renEm();
  updEmProg();
};

window.cancelEmEdit = function() {
  const s = state['em-1'];
  const o = origSt['em-1'];
  if (s && o) { Object.assign(s, o); s.dirty = false; delete origSt['em-1']; }
  renEm();
  updEmProg();
};

/* ════════════════════════════════════════════════════════
   FEATURE ARTICLES (FA)
════════════════════════════════════════════════════════ */
function initFaState() {
  const slotEls = document.querySelectorAll('.pubplan-slot-wrapper[data-section-code="fa"]');
  slotEls.forEach(el => {
    const code = el.dataset.sc;
    if (!code) return;
    state[code] = {
      sc: code, secC: 'fa',
      slotNum: parseInt(code.replace(/\D/g, ''), 10),
      pubplanId: el.dataset.ppId || '',
      titleadminId: el.dataset.taId || '',
      catId: el.dataset.catId || '',
      catNm: el.dataset.catLabel || el.dataset.catNm || '',
      catType: el.dataset.catType || '',
      artId: el.dataset.artId || '',
      artNm: el.dataset.articleTitle || el.dataset.artNm || '',
      custId: el.dataset.custId || '',
      custNm: el.dataset.custNm || '',
      sponsorId: el.dataset.sponId || '',
      sponNm: el.dataset.sponNm || '',
      artAdId: el.dataset.artAdId || '',
      artAdName: el.dataset.artAdName || '',
      artAdUrl: el.dataset.artAdUrl || '',
      artAdGo: el.dataset.artAdGo || '',
      nlSponsored: el.dataset.nlSponsored || '',
      noSponsor: el.dataset.noSponsor === 'true',
      locked: el.dataset.locked === 'true',
      dirty: false
    };
  });
  for (let i = 1; i <= 4; i++) {
    const code = `fa-${i}`;
    if (!state[code]) {
      state[code] = { sc: code, secC: 'fa', slotNum: i, catId: '', catNm: '', artId: '', artNm: '', custId: '', custNm: '', sponsorId: '', sponNm: '', artAdId: '', artAdName: '', noSponsor: false, dirty: false };
    }
  }
}

function getFaPickerData(slotNum) {
  const pickerEl = document.querySelector('.fa-picker-wrapper');
  if (!pickerEl) return {};
  const prefix = `fa${slotNum}`;
  const sponsoredStatus = pickerEl.dataset[`${prefix}SponsoredStatus`] || '';
  const artAdGet = pickerEl.dataset[`${prefix}ArtAdGet`] || '';
  const artAdGo = pickerEl.dataset[`${prefix}ArtAdGo`] || '';
  const s = state[`fa-${slotNum}`];
  const artEl = s && s.artId ? document.querySelector(`.articles-wrapper[data-article-id="${s.artId}"]`) : null;
  const artImgGet = artEl ? artEl.dataset.artImgGet || '' : '';
  const artWfImg = artEl ? artEl.dataset.imageUrl || '' : '';
  const showArtAd = artEl ? artEl.dataset.showArtAd || '' : '';
  const artPgSet = (showArtAd === 'Show' || showArtAd === 'true') ? 'true' : '';
  const nlPgSet = pickerEl.dataset[`${prefix}NlPgSet`] || '';
  return { artImgGet, artWfImg, adImgGet: artAdGet, adGoLink: artAdGo, artPgSet, nlPgSet, sponsored: sponsoredStatus };
}

function buildFaDrawer(sc) {
  const s = state[sc];
  if (!s) return '';
  const d = getFaPickerData(s.slotNum);
  const artEl = s.artId ? document.querySelector(`.articles-wrapper[data-article-id="${s.artId}"]`) : null;
  const fields = [
    { label: 'Summary', value: artEl && artEl.dataset.articleSummary ? artEl.dataset.articleSummary : '—', status: artEl && artEl.dataset.articleSummary ? 'ok' : 'bad' },
    { label: 'Body', value: artEl && artEl.dataset.articleBody ? 'Present' : '—', status: artEl && artEl.dataset.articleBody ? 'ok' : 'bad' },
    { label: 'Writer', value: artEl && artEl.dataset.writerName ? artEl.dataset.writerName : '—', status: artEl && artEl.dataset.writerName ? 'ok' : 'bad' },
    { label: 'CoWriter', value: artEl && artEl.dataset.cowriterName ? artEl.dataset.cowriterName : '—', status: artEl && artEl.dataset.cowriterName ? 'ok' : 'na' },
    { label: 'Image', value: d.artWfImg ? 'Present' : '—', status: d.artWfImg ? 'ok' : 'bad' },
    { label: 'Img GET', value: d.artImgGet ? 'Present' : '—', status: d.artImgGet ? 'ok' : 'bad' },
    { label: 'Type', value: artEl && artEl.dataset.articleType ? artEl.dataset.articleType : '—', status: artEl && artEl.dataset.articleType ? 'ok' : 'bad' },
    { label: 'Ad Stat', value: d.artPgSet ? 'ON' : 'OFF', status: d.artPgSet ? 'ok' : 'na' },
    { label: 'Ad Img', value: d.adImgGet ? 'Present' : '—', status: d.adImgGet ? 'ok' : (s.custId || s.sponsorId ? 'bad' : 'na') },
    { label: 'Ad Go', value: d.adGoLink ? 'Present' : '—', status: d.adGoLink ? 'ok' : (s.custId || s.sponsorId ? 'bad' : 'na') }
  ];
  return `<div class="pdr" id="drawer-${sc}"><div class="pdr-grid">${fields.map(f => `<div class="pdr-field"><span class="pdr-label">${f.label}</span><span class="pdr-value">${f.value}</span></div><div class="pdr-status">${icon(f.status, f.status === 'ok' ? '✓' : f.status === 'bad' ? '✕' : '—')}</div>`).join('')}</div></div>`;
}

function renFa(sc) {
  const s = state[sc];
  if (!s) return;
  const isEd = s.dirty || origSt[sc];
  const isPaid = s.catType === 'Paid Article' || (s.catNm && s.catNm.toLowerCase().includes('paid'));
  let html;

  if (!s.catId) {
    const catDd = `<div class="pc" style="flex:2;"><span class="pcl">Category</span><select class="pd" onchange="onFaCatChange('${sc}',this)">${buildCatOpts('FA', '')}</select></div>`;
    const emptyCol = `<div class="pc"><span class="pcl">Article</span><span style="color:#ccc;font-size:11px;">—</span></div>`;
    const emptyCs = `<div class="pc"><span class="pcl">C/S</span><span style="color:#ccc;font-size:11px;">—</span></div>`;
    const chevron = `<span class="pch" onclick="tD('${sc}')">▾</span>`;
    html = `<div class="ptr" id="tile-${sc}"><div class="psi sfa">${sc.toUpperCase()}</div>${catDd}${emptyCol}${emptyCs}<div class="pac">${chevron}</div></div>${buildFaDrawer(sc)}`;
  }
  else if (s.catId && !s.artId) {
    const catPill = `<div class="pc"><span class="pcl">Category</span><div style="display:flex;align-items:center;gap:6px;"><span class="pcp cfa${isEd ? ' cpn' : ''}">${s.catNm || '—'}</span><span class="ppt-x" onclick="resetFaCat('${sc}')" title="Change category">✕</span></div></div>`;
    let custCol = '';
    if (isPaid) {
      if (s.custId) {
        custCol = `<div class="pc"><span class="pcl">Customer</span><span class="pcv">${s.custNm}</span></div>`;
      } else {
        custCol = `<div class="pc"><span class="pcl">Customer</span><select class="pd${s.custId ? ' hs' : ''}" onchange="onFaCustomerChange('${sc}',this)">${buildCustOpts(s.custId, '--')}</select></div>`;
      }
    }
    const artDd = `<div class="pc"><span class="pcl">Article</span><select class="pd" onchange="onFaArticleChange('${sc}',this)">${buildArtOpts(s.custId, '')}</select></div>`;
    let sponCol = '';
    if (!isPaid) {
      sponCol = `<div class="pc"><span class="pcl">Sponsor</span><span style="color:#ccc;font-size:11px;">—</span></div>`;
    }
    const actLnk = isEd ? `<a class="pcl visible" onclick="cancelFaEdit('${sc}')">cancel</a>` : `<a class="pei" onclick="initFaEdit('${sc}')" title="Edit">✎</a>`;
    const chevron = `<span class="pch" onclick="tD('${sc}')">▾</span>`;
    html = `<div class="ptr${isEd ? ' hp' : ''}" id="tile-${sc}"><div class="psi sfa">${sc.toUpperCase()}</div>${catPill}${isPaid ? custCol : ''}${artDd}${!isPaid ? sponCol : ''}<div class="pac">${actLnk}${chevron}</div></div>${buildFaDrawer(sc)}`;
  }
  else {
    const catCol = `<div class="pc"><span class="pcl">Category</span><span class="pcp cfa">${s.catNm || '—'}</span></div>`;
    const artCol = `<div class="pc"><span class="pcl">Article</span><span class="pcv">${s.artNm}</span></div>`;
    let csCol;
    if (isPaid) {
      if (s.custId && !isEd) {
        csCol = `<div class="pc"><span class="pcl">Customer</span><span class="pcv">${s.custNm}</span></div>`;
      } else {
        csCol = `<div class="pc"><span class="pcl">Customer</span><select class="pd${s.custId ? ' hs' : ''}" onchange="onFaCustomerChange('${sc}',this)">${buildCustOpts(s.custId, '--')}</select></div>`;
      }
    } else {
      const noSpCb = `<label class="pxl"><input type="checkbox" ${s.noSponsor ? 'checked' : ''} onchange="onFaNoSponsorChange('${sc}',this)"> No Sponsor</label>`;
      if (s.noSponsor) {
        csCol = `<div class="pc"><span class="pcl">Sponsor ${noSpCb}</span><span class="pcv" style="color:#999;font-style:italic;">No sponsor</span></div>`;
      } else if (s.sponsorId && !isEd) {
        csCol = `<div class="pc"><span class="pcl">Sponsor ${noSpCb}</span><span class="pcv sponsor">${s.sponNm}</span></div>`;
      } else {
        csCol = `<div class="pc"><span class="pcl">Sponsor ${noSpCb}</span><select class="pd${s.sponsorId ? ' hs' : ''}" onchange="onFaSponsorChange('${sc}',this)">${buildCustOpts(s.sponsorId, '--')}</select></div>`;
      }
    }
    const actLnk = isEd ? `<a class="pcl visible" onclick="cancelFaEdit('${sc}')">cancel</a>` : `<a class="pei" onclick="initFaEdit('${sc}')" title="Edit">✎</a>`;
    const chevron = `<span class="pch" onclick="tD('${sc}')">▾</span>`;
    html = `<div class="ptr${isEd ? ' hp' : ''}" id="tile-${sc}"><div class="psi sfa">${sc.toUpperCase()}</div>${catCol}${artCol}${csCol}<div class="pac">${actLnk}${chevron}</div></div>${buildFaDrawer(sc)}`;
  }

  const existing = document.getElementById(`tile-${sc}`);
  const existingDrawer = document.getElementById(`drawer-${sc}`);
  if (existing) {
    const drawerWasOpen = existingDrawer ? existingDrawer.classList.contains('open') : false;
    existing.outerHTML = html;
    if (existingDrawer) existingDrawer.remove();
    const newTile = document.getElementById(`tile-${sc}`);
    if (newTile) {
      newTile.insertAdjacentHTML('afterend', buildFaDrawer(sc));
      if (drawerWasOpen) {
        const d = document.getElementById(`drawer-${sc}`);
        if (d) d.classList.add('open');
        const ch = newTile.querySelector('.pch');
        if (ch) ch.classList.add('open');
      }
    }
  } else {
    const grid = document.getElementById('fa-grid');
    if (grid) grid.insertAdjacentHTML('beforeend', html);
  }
}

function renderAllFa() {
  for (let i = 1; i <= 4; i++) renFa(`fa-${i}`);
  updFaProg();
}

window.onFaArticleChange = function(sc, sel) {
  const s = state[sc];
  if (!s) return;
  if (!origSt[sc]) origSt[sc] = Object.assign({}, s);
  const opt = sel.options[sel.selectedIndex];
  s.artId = opt ? opt.value || '' : '';
  s.artNm = opt ? opt.textContent || '' : '';
  s.dirty = true;
  renFa(sc);
  updFaProg();
};

window.onFaCatChange = function(sc, sel) {
  const s = state[sc];
  if (!s) return;
  if (!origSt[sc]) origSt[sc] = Object.assign({}, s);
  const opt = sel.options[sel.selectedIndex];
  s.catId = opt ? opt.value || '' : '';
  s.catNm = opt ? opt.textContent || '' : '';
  s.catType = opt && opt.dataset ? opt.dataset.type || '' : '';
  s.artId = ''; s.artNm = ''; s.custId = ''; s.custNm = ''; s.sponsorId = ''; s.sponNm = '';
  s.dirty = true;
  renFa(sc);
  updFaProg();
};

window.resetFaCat = function(sc) {
  const s = state[sc];
  if (!s) return;
  if (!origSt[sc]) origSt[sc] = Object.assign({}, s);
  s.catId = ''; s.catNm = ''; s.catType = '';
  s.artId = ''; s.artNm = ''; s.custId = ''; s.custNm = ''; s.sponsorId = ''; s.sponNm = '';
  s.dirty = false;
  delete origSt[sc];
  renFa(sc);
  updFaProg();
};

window.onFaCustomerChange = function(sc, sel) {
  const s = state[sc];
  if (!s) return;
  if (!origSt[sc]) origSt[sc] = Object.assign({}, s);
  const opt = sel.options[sel.selectedIndex];
  s.custId = opt ? opt.value || '' : '';
  s.custNm = opt ? opt.textContent || '' : '';
  s.dirty = true;
  renFa(sc);
  updFaProg();
};

window.onFaSponsorChange = function(sc, sel) {
  const s = state[sc];
  if (!s) return;
  if (!origSt[sc]) origSt[sc] = Object.assign({}, s);
  const opt = sel.options[sel.selectedIndex];
  s.sponsorId = opt ? opt.value || '' : '';
  s.sponNm = opt ? opt.textContent || '' : '';
  s.dirty = true;
  renFa(sc);
  updFaProg();
};

window.onFaNoSponsorChange = function(sc, cb) {
  const s = state[sc];
  if (!s) return;
  if (!origSt[sc]) origSt[sc] = Object.assign({}, s);
  s.noSponsor = cb.checked;
  if (cb.checked) { s.sponsorId = ''; s.sponNm = ''; }
  s.dirty = true;
  renFa(sc);
  updFaProg();
};

window.initFaEdit = function(sc) {
  const s = state[sc];
  if (!s) return;
  origSt[sc] = Object.assign({}, s);
  s.dirty = true;
  renFa(sc);
  updFaProg();
};

window.cancelFaEdit = function(sc) {
  const s = state[sc];
  const orig = origSt[sc];
  if (s && orig) { Object.assign(s, orig); s.dirty = false; delete origSt[sc]; }
  renFa(sc);
  updFaProg();
};

function updFaProg() {
  updSlotInd('fa', 4, (code) => !!(state[code] && state[code].artId));
  let pCnt = 0;
  for (let i = 1; i <= 4; i++) { if (state[`fa-${i}`] && state[`fa-${i}`].dirty) pCnt++; }
  const btn = document.getElementById('fa-submit-btn');
  if (btn) btn.className = 'ppt-submit-btn' + (pCnt > 0 ? ' active' : '');
}

/* ════════════════════════════════════════════════════════
   THEMED SPOTLIGHTS (TS)
════════════════════════════════════════════════════════ */
function initTsState() {
  const slotEls = document.querySelectorAll('.pubplan-slot-wrapper[data-section-code="ts"]');
  slotEls.forEach(el => {
    const code = el.dataset.sc;
    if (!code) return;
    state[code] = {
      sc: code, secC: 'ts',
      slotNum: parseInt(code.replace(/\D/g, ''), 10),
      pubplanId: el.dataset.ppId || '',
      titleadminId: el.dataset.taId || '',
      catId: el.dataset.catId || '',
      catNm: el.dataset.catLabel || el.dataset.catNm || '',
      artId: el.dataset.artId || '',
      artNm: el.dataset.articleTitle || el.dataset.artNm || '',
      sponsorId: el.dataset.sponId || '',
      sponNm: el.dataset.sponNm || '',
      artAdId: el.dataset.artAdId || '',
      artAdName: el.dataset.artAdName || '',
      artAdUrl: el.dataset.artAdUrl || '',
      artAdGo: el.dataset.artAdGo || '',
      noSponsor: el.dataset.noSponsor === 'true',
      locked: el.dataset.locked === 'true',
      dirty: false
    };
  });
  for (let i = 1; i <= 4; i++) {
    const code = `ts-${i}`;
    if (!state[code]) {
      state[code] = { sc: code, secC: 'ts', slotNum: i, catId: '', catNm: '', artId: '', artNm: '', sponsorId: '', sponNm: '', artAdId: '', artAdName: '', noSponsor: false, dirty: false };
    }
  }
}

function getTsPickerData(slotNum) {
  const pickerEl = document.querySelector('.ts-picker-wrapper');
  if (!pickerEl) return {};
  const prefix = `ts${slotNum}`;
  const sponsoredStatus = pickerEl.dataset[`${prefix}SponsoredStatus`] || '';
  const artAdGet = pickerEl.dataset[`${prefix}ArtAdGet`] || '';
  const artAdGo = pickerEl.dataset[`${prefix}ArtAdGo`] || '';
  const s = state[`ts-${slotNum}`];
  const artEl = s && s.artId ? document.querySelector(`.articles-wrapper[data-article-id="${s.artId}"]`) : null;
  const artImgGet = artEl ? artEl.dataset.artImgGet || '' : '';
  const artWfImg = artEl ? artEl.dataset.imageUrl || '' : '';
  const showArtAd = artEl ? artEl.dataset.showArtAd || '' : '';
  const artPgSet = (showArtAd === 'Show' || showArtAd === 'true') ? 'true' : '';
  const nlPgSet = pickerEl.dataset[`${prefix}NlPgSet`] || '';
  return { artImgGet, artWfImg, adImgGet: artAdGet, adGoLink: artAdGo, artPgSet, nlPgSet };
}

function buildTsDrawer(sc) {
  const s = state[sc];
  if (!s) return '';
  const d = getTsPickerData(s.slotNum);
  const artEl = s.artId ? document.querySelector(`.articles-wrapper[data-article-id="${s.artId}"]`) : null;
  const fields = [
    { label: 'Summary', value: artEl && artEl.dataset.articleSummary ? artEl.dataset.articleSummary : '—', status: artEl && artEl.dataset.articleSummary ? 'ok' : 'bad' },
    { label: 'Body', value: artEl && artEl.dataset.articleBody ? 'Present' : '—', status: artEl && artEl.dataset.articleBody ? 'ok' : 'bad' },
    { label: 'Writer', value: artEl && artEl.dataset.writerName ? artEl.dataset.writerName : '—', status: artEl && artEl.dataset.writerName ? 'ok' : 'bad' },
    { label: 'CoWriter', value: artEl && artEl.dataset.cowriterName ? artEl.dataset.cowriterName : '—', status: artEl && artEl.dataset.cowriterName ? 'ok' : 'na' },
    { label: 'Image', value: d.artWfImg ? 'Present' : '—', status: d.artWfImg ? 'ok' : 'bad' },
    { label: 'Img GET', value: d.artImgGet ? 'Present' : '—', status: d.artImgGet ? 'ok' : 'bad' },
    { label: 'Type', value: artEl && artEl.dataset.articleType ? artEl.dataset.articleType : '—', status: artEl && artEl.dataset.articleType ? 'ok' : 'bad' },
    { label: 'Ad Stat', value: d.artPgSet ? 'ON' : 'OFF', status: d.artPgSet ? 'ok' : 'na' },
    { label: 'Ad Img', value: d.adImgGet ? 'Present' : '—', status: d.adImgGet ? 'ok' : (s.sponsorId ? 'bad' : 'na') },
    { label: 'Ad Go', value: d.adGoLink ? 'Present' : '—', status: d.adGoLink ? 'ok' : (s.sponsorId ? 'bad' : 'na') }
  ];
  return `<div class="pdr" id="drawer-${sc}"><div class="pdr-grid">${fields.map(f => `<div class="pdr-field"><span class="pdr-label">${f.label}</span><span class="pdr-value">${f.value}</span></div><div class="pdr-status">${icon(f.status, f.status === 'ok' ? '✓' : f.status === 'bad' ? '✕' : '—')}</div>`).join('')}</div></div>`;
}

function renTs(sc) {
  const s = state[sc];
  if (!s) return;
  const isEd = s.dirty || origSt[sc];
  let html;

  if (!s.catId) {
    const catDd = `<div class="pc" style="flex:2;"><span class="pcl">Category</span><select class="pd" onchange="onTsCatChange('${sc}',this)">${buildCatOpts('TS', '')}</select></div>`;
    const emptyCol = `<div class="pc"><span class="pcl">Article</span><span style="color:#ccc;font-size:11px;">—</span></div>`;
    const emptySp = `<div class="pc"><span class="pcl">Sponsor</span><span style="color:#ccc;font-size:11px;">—</span></div>`;
    const chevron = `<span class="pch" onclick="tD('${sc}')">▾</span>`;
    html = `<div class="ptr tsr" id="tile-${sc}"><div class="psi sts">${sc.toUpperCase()}</div>${catDd}${emptyCol}${emptySp}<div class="pac">${chevron}</div></div>${buildTsDrawer(sc)}`;
  }
  else if (s.catId && !s.artId) {
    const catPill = `<div class="pc"><span class="pcl">Category</span><div style="display:flex;align-items:center;gap:6px;"><span class="pcp cts${isEd ? ' cpn' : ''}">${s.catNm || '—'}</span><span class="ppt-x" onclick="resetTsCat('${sc}')" title="Change category">✕</span></div></div>`;
    const artDd = `<div class="pc"><span class="pcl">Article</span><select class="pd" onchange="onTsArticleChange('${sc}',this)">${buildTsArtOpts('')}</select></div>`;
    const sponCol = `<div class="pc"><span class="pcl">Sponsor</span><span style="color:#ccc;font-size:11px;">—</span></div>`;
    const actLnk = isEd ? `<a class="pcl visible" onclick="cancelTsEdit('${sc}')">cancel</a>` : `<a class="pei" onclick="initTsEdit('${sc}')" title="Edit">✎</a>`;
    const chevron = `<span class="pch" onclick="tD('${sc}')">▾</span>`;
    html = `<div class="ptr tsr${isEd ? ' hp' : ''}" id="tile-${sc}"><div class="psi sts">${sc.toUpperCase()}</div>${catPill}${artDd}${sponCol}<div class="pac">${actLnk}${chevron}</div></div>${buildTsDrawer(sc)}`;
  }
  else {
    const catCol = `<div class="pc"><span class="pcl">Category</span><span class="pcp cts">${s.catNm || '—'}</span></div>`;
    const artCol = `<div class="pc"><span class="pcl">Article</span><span class="pcv">${s.artNm}</span></div>`;
    let sponCol;
    const noSpCb = `<label class="pxl"><input type="checkbox" ${s.noSponsor ? 'checked' : ''} onchange="onTsNoSponsorChange('${sc}',this)"> No Sponsor</label>`;
    if (s.noSponsor) {
      sponCol = `<div class="pc"><span class="pcl">Sponsor ${noSpCb}</span><span class="pcv" style="color:#999;font-style:italic;">No sponsor</span></div>`;
    } else if (s.sponsorId && !isEd) {
      sponCol = `<div class="pc"><span class="pcl">Sponsor ${noSpCb}</span><span class="pcv sponsor">${s.sponNm}</span></div>`;
    } else {
      sponCol = `<div class="pc"><span class="pcl">Sponsor ${noSpCb}</span><select class="pd${s.sponsorId ? ' hs' : ''}" onchange="onTsSponsorChange('${sc}',this)">${buildCustOpts(s.sponsorId, '--')}</select></div>`;
    }
    const actLnk = isEd ? `<a class="pcl visible" onclick="cancelTsEdit('${sc}')">cancel</a>` : `<a class="pei" onclick="initTsEdit('${sc}')" title="Edit">✎</a>`;
    const chevron = `<span class="pch" onclick="tD('${sc}')">▾</span>`;
    html = `<div class="ptr tsr${isEd ? ' hp' : ''}" id="tile-${sc}"><div class="psi sts">${sc.toUpperCase()}</div>${catCol}${artCol}${sponCol}<div class="pac">${actLnk}${chevron}</div></div>${buildTsDrawer(sc)}`;
  }

  const existing = document.getElementById(`tile-${sc}`);
  const existingDrawer = document.getElementById(`drawer-${sc}`);
  if (existing) {
    const drawerWasOpen = existingDrawer ? existingDrawer.classList.contains('open') : false;
    existing.outerHTML = html;
    if (existingDrawer) existingDrawer.remove();
    const newTile = document.getElementById(`tile-${sc}`);
    if (newTile) {
      newTile.insertAdjacentHTML('afterend', buildTsDrawer(sc));
      if (drawerWasOpen) {
        const d = document.getElementById(`drawer-${sc}`);
        if (d) d.classList.add('open');
        const ch = newTile.querySelector('.pch');
        if (ch) ch.classList.add('open');
      }
    }
  } else {
    const grid = document.getElementById('ts-grid');
    if (grid) grid.insertAdjacentHTML('beforeend', html);
  }
}

function renderAllTs() {
  for (let i = 1; i <= 4; i++) renTs(`ts-${i}`);
  updTsProg();
}

window.onTsArticleChange = function(sc, sel) {
  const s = state[sc];
  if (!s) return;
  if (!origSt[sc]) origSt[sc] = Object.assign({}, s);
  const opt = sel.options[sel.selectedIndex];
  s.artId = opt ? opt.value || '' : '';
  s.artNm = opt ? opt.textContent || '' : '';
  s.dirty = true;
  renTs(sc);
  updTsProg();
};

window.onTsCatChange = function(sc, sel) {
  const s = state[sc];
  if (!s) return;
  if (!origSt[sc]) origSt[sc] = Object.assign({}, s);
  const opt = sel.options[sel.selectedIndex];
  s.catId = opt ? opt.value || '' : '';
  s.catNm = opt ? opt.textContent || '' : '';
  s.catType = opt && opt.dataset ? opt.dataset.type || '' : '';
  s.artId = ''; s.artNm = ''; s.sponsorId = ''; s.sponNm = '';
  s.dirty = true;
  renTs(sc);
  updTsProg();
};

window.resetTsCat = function(sc) {
  const s = state[sc];
  if (!s) return;
  if (!origSt[sc]) origSt[sc] = Object.assign({}, s);
  s.catId = ''; s.catNm = ''; s.catType = '';
  s.artId = ''; s.artNm = ''; s.sponsorId = ''; s.sponNm = '';
  s.dirty = false;
  delete origSt[sc];
  renTs(sc);
  updTsProg();
};

window.onTsSponsorChange = function(sc, sel) {
  const s = state[sc];
  if (!s) return;
  if (!origSt[sc]) origSt[sc] = Object.assign({}, s);
  const opt = sel.options[sel.selectedIndex];
  s.sponsorId = opt ? opt.value || '' : '';
  s.sponNm = opt ? opt.textContent || '' : '';
  s.dirty = true;
  renTs(sc);
  updTsProg();
};

window.onTsNoSponsorChange = function(sc, cb) {
  const s = state[sc];
  if (!s) return;
  if (!origSt[sc]) origSt[sc] = Object.assign({}, s);
  s.noSponsor = cb.checked;
  if (cb.checked) { s.sponsorId = ''; s.sponNm = ''; }
  s.dirty = true;
  renTs(sc);
  updTsProg();
};

window.initTsEdit = function(sc) {
  const s = state[sc];
  if (!s) return;
  origSt[sc] = Object.assign({}, s);
  s.dirty = true;
  renTs(sc);
  updTsProg();
};

window.cancelTsEdit = function(sc) {
  const s = state[sc];
  const orig = origSt[sc];
  if (s && orig) { Object.assign(s, orig); s.dirty = false; delete origSt[sc]; }
  renTs(sc);
  updTsProg();
};

function updTsProg() {
  updSlotInd('ts', 4, (code) => !!(state[code] && state[code].artId));
  let pCnt = 0;
  for (let i = 1; i <= 4; i++) { if (state[`ts-${i}`] && state[`ts-${i}`].dirty) pCnt++; }
  const btn = document.getElementById('ts-submit-btn');
  if (btn) btn.className = 'ppt-submit-btn' + (pCnt > 0 ? ' active' : '');
}

/* ════════════════════════════════════════════════════════
   BANNER ADS (BA)
════════════════════════════════════════════════════════ */
function initBaState() {
  const slotEls = document.querySelectorAll('.ba-slot-wrapper');
  slotEls.forEach(el => {
    const code = el.dataset.sc;
    if (!code) return;
    const slotNum = parseInt(code.replace(/\D/g, ''), 10);
    let adName = el.dataset.adTitle || el.dataset.adName || '';
    const adId = el.dataset.adId || '';
    if (adId && !adName) {
      const adEl = document.querySelector(`.ads-wrapper[data-ad-id="${adId}"]`);
      adName = adEl ? adEl.dataset.adName || adEl.dataset.adTitle || '' : '';
    }
    state[code] = {
      sc: code, secC: 'ba', slotNum,
      pubplanId: el.dataset.ppId || '',
      titleadminId: el.dataset.taId || '',
      custId: el.dataset.custId || '',
      custNm: el.dataset.custNm || '',
      adId,
      adName,
      dirty: false
    };
  });
  for (let i = 1; i <= 12; i++) {
    const code = `ba-${i}`;
    if (!state[code]) {
      state[code] = { sc: code, secC: 'ba', slotNum: i, custId: '', custNm: '', adId: '', adName: '', dirty: false };
    }
  }
}

function getBaPickerData(slotNum) {
  const wrapperClass = slotNum <= 6 ? '.ba-picker-1-wrapper' : '.ba-picker-2-wrapper';
  const pickerEl = document.querySelector(wrapperClass);
  if (!pickerEl) return {};
  const prefix = `ba${slotNum}`;
  return {
    adGet: pickerEl.dataset[`${prefix}AdGet`] || '',
    adGo: pickerEl.dataset[`${prefix}AdGo`] || ''
  };
}

function buildBaDrawer(sc) {
  const s = state[sc];
  if (!s) return '';
  const d = getBaPickerData(s.slotNum);
  const fields = [
    { label: 'Ad Image Link', value: d.adGet ? 'Present' : '—', status: d.adGet ? 'ok' : (s.adId ? 'bad' : 'na') },
    { label: 'Ad Redirect', value: d.adGo ? 'Present' : '—', status: d.adGo ? 'ok' : (s.adId ? 'bad' : 'na') }
  ];
  const fieldsHtml = fields.map(f => `<div class="pdr-field"><span class="pdr-label">${f.label}</span><span class="pdr-value">${f.value}</span></div><div class="pdr-status">${icon(f.status, f.status === 'ok' ? '✓' : f.status === 'bad' ? '✕' : '—')}</div>`).join('');
  return `<div class="pdr" id="drawer-${sc}"><div class="pdr-grid" style="grid-template-columns: 1fr 60px 1fr 60px;">${fieldsHtml}</div></div>`;
}

function renBa(sc) {
  const s = state[sc];
  if (!s) return;
  const isEd = s.dirty || origSt[sc];
  const d = getBaPickerData(s.slotNum);
  const adThumb = s.adId && d.adGet
    ? `<img src="${d.adGet}" class="ppt-ad-thumb" alt="">`
    : s.adId && !d.adGet
    ? `<div class="ppt-ad-thumb-placeholder">🖼</div>`
    : '';
  let custCol;
  if (s.custId && !isEd) {
    custCol = `<div class="ppt-card-field"><span class="pcl">Customer</span><span class="pcv">${s.custNm}</span></div>`;
  } else {
    custCol = `<div class="ppt-card-field"><span class="pcl">Customer</span><select class="pd${s.custId ? ' hs' : ''}" onchange="onBaCustomerChange('${sc}',this)">${buildCustomerOptions(s.custId)}</select></div>`;
  }
  let adCol = '';
  if (isEd || !s.adId) {
    adCol = `<div class="ppt-card-field"><span class="pcl">Ad</span><select class="pd${s.adId ? ' hs' : ''}" onchange="onBaAdChange('${sc}',this)"${!s.custId ? ' disabled' : ''}>${buildAdOptions(s.custId, s.adId)}</select></div>`;
  }
  const actLnk = isEd
    ? `<a class="pcl visible" onclick="cancelBaEdit('${sc}')">cancel</a>`
    : (s.adId ? `<a class="pei" onclick="initBaEdit('${sc}')" title="Edit">✎</a>` : '<span style="color:#ccc;">—</span>');
  const chevron = `<span class="pch" onclick="tD('${sc}')">▾</span>`;
  const html = `<div class="ptw" id="wrapper-${sc}"><div class="ptc${isEd ? ' hp' : ''}" id="tile-${sc}"><div class="pcs">${sc.toUpperCase()}</div>${adThumb}<div class="pcc">${custCol}${adCol}</div><div class="pca">${actLnk}${chevron}</div></div>${buildBaDrawer(sc)}</div>`;
  const existing = document.getElementById(`wrapper-${sc}`);
  if (existing) {
    const drawerWasOpen = document.getElementById(`drawer-${sc}`) ? document.getElementById(`drawer-${sc}`).classList.contains('open') : false;
    existing.outerHTML = html;
    if (drawerWasOpen) {
      const d2 = document.getElementById(`drawer-${sc}`);
      if (d2) d2.classList.add('open');
      const tile = document.getElementById(`tile-${sc}`);
      const ch = tile ? tile.querySelector('.pch') : null;
      if (ch) ch.classList.add('open');
    }
  } else {
    const grid = document.getElementById('ba-grid');
    if (grid) grid.insertAdjacentHTML('beforeend', html);
  }
}

function renderAllBa() {
  for (let i = 1; i <= 12; i++) renBa(`ba-${i}`);
  updBaProg();
}

window.onBaCustomerChange = function(sc, sel) {
  const s = state[sc];
  if (!s) return;
  if (!origSt[sc]) origSt[sc] = Object.assign({}, s);
  const opt = sel.options[sel.selectedIndex];
  s.custId = opt ? opt.value || '' : '';
  s.custNm = opt ? opt.textContent || '' : '';
  s.adId = '';
  s.adName = '';
  s.dirty = true;
  renBa(sc);
  updBaProg();
};

window.onBaAdChange = function(sc, sel) {
  const s = state[sc];
  if (!s) return;
  if (!origSt[sc]) origSt[sc] = Object.assign({}, s);
  const opt = sel.options[sel.selectedIndex];
  s.adId = opt ? opt.value || '' : '';
  s.adName = opt ? opt.textContent || '' : '';
  s.dirty = true;
  renBa(sc);
  updBaProg();
};

window.initBaEdit = function(sc) {
  const s = state[sc];
  if (!s) return;
  origSt[sc] = Object.assign({}, s);
  s.dirty = true;
  renBa(sc);
  updBaProg();
};

window.cancelBaEdit = function(sc) {
  const s = state[sc];
  const orig = origSt[sc];
  if (s && orig) { Object.assign(s, orig); s.dirty = false; delete origSt[sc]; }
  renBa(sc);
  updBaProg();
};

function updBaProg() {
  updSlotInd('ba', 12, (code) => !!(state[code] && state[code].adId));
  let pCnt = 0;
  for (let i = 1; i <= 12; i++) { if (state[`ba-${i}`] && state[`ba-${i}`].dirty) pCnt++; }
  const btn = document.getElementById('ba-submit-btn');
  if (btn) btn.className = 'ppt-submit-btn' + (pCnt > 0 ? ' active' : '');
}

/* ════════════════════════════════════════════════════════
   THE FIND (TF) — MODE TOGGLE, TXA, LBP
════════════════════════════════════════════════════════ */
window.switchTfMode = function(mode) {
  if (mode === currentTfMode) return;
  const hasTxaChanges = [1, 2, 3, 4, 5].some(i => state[`txa-${i}`] && state[`txa-${i}`].dirty);
  const hasLbpChanges = state['lbp-1'] && state['lbp-1'].dirty;
  const hasChanges = (currentTfMode === 'txa' && hasTxaChanges) || (currentTfMode === 'lbp' && hasLbpChanges);
  if (hasChanges) {
    if (!confirm('Switching modes will clear unsaved changes. Continue?')) return;
    if (currentTfMode === 'txa') {
      for (let i = 1; i <= 5; i++) {
        const code = `txa-${i}`;
        if (state[code]) { state[code].dirty = false; state[code].custId = ''; state[code].custNm = ''; }
        delete origSt[code];
      }
    } else {
      if (state['lbp-1']) { state['lbp-1'].dirty = false; state['lbp-1'].custId = ''; state['lbp-1'].custNm = ''; }
      delete origSt['lbp-1'];
    }
  }
  currentTfMode = mode;
  document.querySelectorAll('.tf-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  const tfTxa = document.querySelector('.the-find-txa');
  const tfLbp = document.querySelector('.the-find-lbp');
  if (tfTxa) tfTxa.classList.toggle('is-active', mode === 'txa');
  if (tfLbp) tfLbp.classList.toggle('is-active', mode === 'lbp');
  const countEl = document.getElementById('tf-slot-count');
  if (countEl) countEl.textContent = mode === 'txa' ? '5 slots' : '1 slot';
  updTfProg();
};

function initTxaState() {
  const slotEls = document.querySelectorAll('.txa-slot-wrapper');
  slotEls.forEach(el => {
    const code = el.dataset.sc;
    if (!code) return;
    state[code] = {
      sc: code, secC: 'txa',
      slotNum: parseInt(code.replace(/\D/g, ''), 10),
      custId: el.dataset.custId || '',
      custNm: el.dataset.custNm || '',
      dirty: false
    };
  });
  for (let i = 1; i <= 5; i++) {
    const code = `txa-${i}`;
    if (!state[code]) {
      state[code] = { sc: code, secC: 'txa', slotNum: i, custId: '', custNm: '', dirty: false };
    }
  }
}

function getTxaPickerData(slotNum) {
  const wrapper = document.querySelector('.txa-picker-wrapper');
  if (!wrapper) return {};
  const prefix = `txa${slotNum}`;
  return {
    logoLink: wrapper.dataset[`${prefix}LogoLink`] || '',
    redirect: wrapper.dataset[`${prefix}Redirect`] || '',
    headline: wrapper.dataset[`${prefix}Headline`] || '',
    body: wrapper.dataset[`${prefix}Body`] || ''
  };
}

function buildTxaDrawer(sc) {
  const s = state[sc];
  if (!s) return '';
  const d = getTxaPickerData(s.slotNum);
  const fields = [
    { label: 'Logo', value: d.logoLink ? 'Present' : '—', status: d.logoLink ? 'ok' : (s.custId ? 'bad' : 'na') },
    { label: 'Redirect', value: d.redirect ? 'Present' : '—', status: d.redirect ? 'ok' : (s.custId ? 'bad' : 'na') },
    { label: 'Headline', value: d.headline || '—', status: d.headline ? 'ok' : (s.custId ? 'bad' : 'na') },
    { label: 'Body Text', value: d.body ? 'Present' : '—', status: d.body ? 'ok' : (s.custId ? 'bad' : 'na') }
  ];
  const fieldsHtml = fields.map(f => `<div class="pdr-field"><span class="pdr-label">${f.label}</span><span class="pdr-value">${f.value}</span></div><div class="pdr-status">${icon(f.status, f.status === 'ok' ? '✓' : f.status === 'bad' ? '✕' : '—')}</div>`).join('');
  return `<div class="pdr" id="drawer-${sc}"><div class="pdr-grid" style="grid-template-columns: repeat(2,1fr 60px);">${fieldsHtml}</div></div>`;
}

function renTxa(sc) {
  const s = state[sc];
  if (!s) return;
  const isEd = s.dirty || origSt[sc];
  const d = getTxaPickerData(s.slotNum);
  const logoThumb = s.custId && d.logoLink
    ? `<img src="${d.logoLink}" class="ppt-ad-thumb" alt="">`
    : s.custId && !d.logoLink
    ? `<div class="ppt-ad-thumb-placeholder">🖼</div>`
    : '';
  let custCol;
  if (s.custId && !isEd) {
    custCol = `<div class="ppt-card-field"><span class="pcl">Customer</span><span class="pcv">${s.custNm}</span></div>`;
  } else {
    custCol = `<div class="ppt-card-field"><span class="pcl">Customer</span><select class="pd${s.custId ? ' hs' : ''}" onchange="onTxaCustomerChange('${sc}',this)">${buildCustomerOptions(s.custId)}</select></div>`;
  }
  const actLnk = isEd
    ? `<a class="pcl visible" onclick="cancelTxaEdit('${sc}')">cancel</a>`
    : (s.custId ? `<a class="pei" onclick="initTxaEdit('${sc}')" title="Edit">✎</a>` : '<span style="color:#ccc;">—</span>');
  const chevron = `<span class="pch" onclick="tD('${sc}')">▾</span>`;
  const html = `<div class="ptw" id="wrapper-${sc}"><div class="ptc tfc${isEd ? ' hp' : ''}" id="tile-${sc}"><div class="pcs">${sc.toUpperCase()}</div>${logoThumb}<div class="pcc">${custCol}</div><div class="pca">${actLnk}${chevron}</div></div>${buildTxaDrawer(sc)}</div>`;
  const existing = document.getElementById(`wrapper-${sc}`);
  if (existing) {
    const drawerWasOpen = document.getElementById(`drawer-${sc}`) ? document.getElementById(`drawer-${sc}`).classList.contains('open') : false;
    existing.outerHTML = html;
    if (drawerWasOpen) {
      const d2 = document.getElementById(`drawer-${sc}`);
      if (d2) d2.classList.add('open');
      const tile = document.getElementById(`tile-${sc}`);
      const ch = tile ? tile.querySelector('.pch') : null;
      if (ch) ch.classList.add('open');
    }
  } else {
    const grid = document.getElementById('txa-grid');
    if (grid) grid.insertAdjacentHTML('beforeend', html);
  }
}

function renderAllTxa() {
  for (let i = 1; i <= 5; i++) renTxa(`txa-${i}`);
}

window.onTxaCustomerChange = function(sc, sel) {
  const s = state[sc];
  if (!s) return;
  if (!origSt[sc]) origSt[sc] = Object.assign({}, s);
  const opt = sel.options[sel.selectedIndex];
  s.custId = opt ? opt.value || '' : '';
  s.custNm = opt ? opt.textContent || '' : '';
  s.dirty = true;
  renTxa(sc);
  updTfProg();
};

window.initTxaEdit = function(sc) {
  const s = state[sc];
  if (!s) return;
  origSt[sc] = Object.assign({}, s);
  s.dirty = true;
  renTxa(sc);
  updTfProg();
};

window.cancelTxaEdit = function(sc) {
  const s = state[sc];
  const orig = origSt[sc];
  if (s && orig) { Object.assign(s, orig); s.dirty = false; delete origSt[sc]; }
  renTxa(sc);
  updTfProg();
};

function initLbpState() {
  const el = document.querySelector('.txa-slot-wrapper[data-slot-code="txa-1"]');
  state['lbp-1'] = {
    sc: 'lbp-1', secC: 'lbp',
    custId: el ? el.dataset.custId || '' : '',
    custNm: el ? el.dataset.custNm || '' : '',
    dirty: false
  };
}

function getLbpPickerData() {
  const wrapper = document.querySelector('.txa-picker-wrapper');
  if (!wrapper) return {};
  return {
    logoLink: wrapper.dataset.lbpLogoLink || '',
    redirect: wrapper.dataset.lbpRedirect || '',
    service1: wrapper.dataset.lbpService1 || '',
    service2: wrapper.dataset.lbpService2 || '',
    service3: wrapper.dataset.lbpService3 || '',
    service4: wrapper.dataset.lbpService4 || '',
    service5: wrapper.dataset.lbpService5 || '',
    service6: wrapper.dataset.lbpService6 || ''
  };
}

function buildLbpDrawer() {
  const s = state['lbp-1'];
  if (!s) return '';
  const d = getLbpPickerData();
  const fields = [
    { label: 'Logo', value: d.logoLink ? 'Present' : '—', status: d.logoLink ? 'ok' : (s.custId ? 'bad' : 'na') },
    { label: 'Redirect', value: d.redirect ? 'Present' : '—', status: d.redirect ? 'ok' : (s.custId ? 'bad' : 'na') },
    { label: 'Service 1', value: d.service1 || '—', status: d.service1 ? 'ok' : 'na' },
    { label: 'Service 2', value: d.service2 || '—', status: d.service2 ? 'ok' : 'na' },
    { label: 'Service 3', value: d.service3 || '—', status: d.service3 ? 'ok' : 'na' },
    { label: 'Service 4', value: d.service4 || '—', status: d.service4 ? 'ok' : 'na' },
    { label: 'Service 5', value: d.service5 || '—', status: d.service5 ? 'ok' : 'na' },
    { label: 'Service 6', value: d.service6 || '—', status: d.service6 ? 'ok' : 'na' }
  ];
  const fieldsHtml = fields.map(f => `<div class="pdr-field"><span class="pdr-label">${f.label}</span><span class="pdr-value">${f.value}</span></div><div class="pdr-status">${icon(f.status, f.status === 'ok' ? '✓' : f.status === 'bad' ? '✕' : '—')}</div>`).join('');
  return `<div class="pdr" id="drawer-lbp-1"><div class="pdr-grid" style="grid-template-columns: repeat(4,1fr 60px);">${fieldsHtml}</div></div>`;
}

function renLbp() {
  const s = state['lbp-1'];
  if (!s) return;
  const isEd = s.dirty || origSt['lbp-1'];
  let custCol;
  if (s.custId && !isEd) {
    custCol = `<div class="ppt-card-field"><span class="pcl">Featured Business</span><span class="pcv">${s.custNm}</span></div>`;
  } else {
    custCol = `<div class="ppt-card-field"><span class="pcl">Featured Business</span><select class="pd${s.custId ? ' hs' : ''}" style="min-width:200px;" onchange="onLbpCustomerChange(this)">${buildCustomerOptions(s.custId)}</select></div>`;
  }
  const actLnk = isEd
    ? `<a class="pcl visible" onclick="cancelLbpEdit()">cancel</a>`
    : (s.custId ? `<a class="pei" onclick="initLbpEdit()" title="Edit">✎</a>` : '<span style="color:#ccc;">—</span>');
  const chevron = `<span class="pch" onclick="tD('lbp-1')">▾</span>`;
  const html = `<div class="ptc tfc${isEd ? ' hp' : ''}" id="tile-lbp-1"><div class="pcs">LBP</div><div class="pcc">${custCol}</div><div class="pca">${actLnk}${chevron}</div></div>${buildLbpDrawer()}`;
  const existing = document.getElementById('tile-lbp-1');
  const existingDrawer = document.getElementById('drawer-lbp-1');
  if (existing) {
    const drawerWasOpen = existingDrawer ? existingDrawer.classList.contains('open') : false;
    existing.outerHTML = html;
    if (existingDrawer) existingDrawer.remove();
    const newTile = document.getElementById('tile-lbp-1');
    if (newTile) {
      newTile.insertAdjacentHTML('afterend', buildLbpDrawer());
      if (drawerWasOpen) {
        const d = document.getElementById('drawer-lbp-1');
        if (d) d.classList.add('open');
        const ch = newTile.querySelector('.pch');
        if (ch) ch.classList.add('open');
      }
    }
  } else {
    const grid = document.getElementById('lbp-grid');
    if (grid) grid.insertAdjacentHTML('beforeend', html);
  }
}

window.onLbpCustomerChange = function(sel) {
  const s = state['lbp-1'];
  if (!s) return;
  if (!origSt['lbp-1']) origSt['lbp-1'] = Object.assign({}, s);
  const opt = sel.options[sel.selectedIndex];
  s.custId = opt ? opt.value || '' : '';
  s.custNm = opt ? opt.textContent || '' : '';
  s.dirty = true;
  renLbp();
  updTfProg();
};

window.initLbpEdit = function() {
  const s = state['lbp-1'];
  if (!s) return;
  origSt['lbp-1'] = Object.assign({}, s);
  s.dirty = true;
  renLbp();
  updTfProg();
};

window.cancelLbpEdit = function() {
  const s = state['lbp-1'];
  const orig = origSt['lbp-1'];
  if (s && orig) { Object.assign(s, orig); s.dirty = false; delete origSt['lbp-1']; }
  renLbp();
  updTfProg();
};

function updTfProg() {
  const count = currentTfMode === 'txa' ? 5 : 1;
  const prefix = currentTfMode === 'txa' ? 'txa' : 'lbp';
  updSlotInd('tf', count, (code) => {
    const idx = parseInt(code.split('-')[1]);
    const s = state[`${prefix}-${idx}`];
    return !!(s && s.custId);
  });
  let pCnt = 0;
  if (currentTfMode === 'txa') {
    for (let i = 1; i <= 5; i++) { if (state[`txa-${i}`] && state[`txa-${i}`].dirty) pCnt++; }
  } else {
    if (state['lbp-1'] && state['lbp-1'].dirty) pCnt++;
  }
  const btn = document.getElementById('tf-submit-btn');
  if (btn) btn.className = 'ppt-submit-btn' + (pCnt > 0 ? ' active' : '');
}

/* ════════════════════════════════════════════════════════
   SUBMIT
════════════════════════════════════════════════════════ */
window.submitSection = async function(section) {
  const btn = document.getElementById(`${section}-submit-btn`);
  if (!btn || btn.classList.contains('submitting')) return;
  btn.classList.add('submitting');
  btn.textContent = 'Saving...';
  const pubplanId = getPubplanId();
  const payload = { section, pubplanId, slots: [] };

  if (section === 'gr') {
    const s = state['gr-1'];
    if (s && s.dirty) payload.slots.push({ sc: s.sc, grTit: s.grTit, grMsg: s.grMsg });
  } else if (section === 'em') {
    const s = state['em-1'];
    if (s && s.dirty) payload.slots.push({ sc: s.sc, emSub: s.emSub, emPre: s.emPre });
  } else if (section === 'fa') {
    for (let i = 1; i <= 4; i++) {
      const s = state[`fa-${i}`];
      if (s && s.dirty) payload.slots.push({ sc: s.sc, artId: s.artId, custId: s.custId, sponsorId: s.sponsorId, artAdId: s.artAdId, noSponsor: s.noSponsor });
    }
  } else if (section === 'ts') {
    for (let i = 1; i <= 4; i++) {
      const s = state[`ts-${i}`];
      if (s && s.dirty) payload.slots.push({ sc: s.sc, artId: s.artId, sponsorId: s.sponsorId, artAdId: s.artAdId, noSponsor: s.noSponsor });
    }
  } else if (section === 'ba') {
    for (let i = 1; i <= 12; i++) {
      const s = state[`ba-${i}`];
      if (s && s.dirty) payload.slots.push({ sc: s.sc, custId: s.custId, adId: s.adId });
    }
  } else if (section === 'tf') {
    payload.mode = currentTfMode;
    if (currentTfMode === 'txa') {
      for (let i = 1; i <= 5; i++) {
        const s = state[`txa-${i}`];
        if (s && s.dirty) payload.slots.push({ sc: s.sc, custId: s.custId });
      }
    } else {
      const s = state['lbp-1'];
      if (s && s.dirty) payload.slots.push({ sc: 'lbp-1', custId: s.custId });
    }
  }

  try {
    const resp = await fetch(WEBHOOK_URLS[section], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (resp.ok) {
      showToast(`${section.toUpperCase()} changes saved!`);
      payload.slots.forEach(slot => {
        if (state[slot.sc]) { state[slot.sc].dirty = false; delete origSt[slot.sc]; }
      });
      if (section === 'gr') { renGr(); updGrProg(); }
      else if (section === 'em') { renEm(); updEmProg(); }
      else if (section === 'fa') { renderAllFa(); }
      else if (section === 'ts') { renderAllTs(); }
      else if (section === 'ba') { renderAllBa(); }
      else if (section === 'tf') { renderAllTxa(); renLbp(); updTfProg(); }
    } else {
      showToast('Save failed. Please try again.', true);
    }
  } catch (e) {
    showToast('Network error', true);
  }
  btn.classList.remove('submitting');
  btn.textContent = `Save ${section.toUpperCase()} Changes`;
};

/* ════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════ */
function init() {
  const nameEl = document.getElementById('pubplan-name-display');
  const dataWrapper = document.querySelector('.pubplan-data-wrapper');
  if (nameEl && dataWrapper) {
    nameEl.textContent = dataWrapper.dataset.pubplanName || '';
  }
  initGrState();
  initEmState();
  initFaState();
  initTsState();
  initBaState();
  initTxaState();
  initLbpState();
  renGr();    updGrProg();
  renEm();    updEmProg();
  renderAllFa();
  renderAllTs();
  renderAllBa();
  renderAllTxa();
  renLbp();
  updTfProg();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
