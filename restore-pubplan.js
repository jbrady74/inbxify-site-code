<!-- ============================================================
PUBPLAN TILE UI v4.0.0 — JS EMBED
Horizontal tile layout logic
Make webhook: https://hook.us1.make.com/4cbueud23qmtrkwq396rgw2yhh5yzajb
============================================================ -->
<script>
(function(){
'use strict';
const WEBHOOK_URLS ={
gr: 'https://hook.us1.make.com/4cbueud23qmtrkwq396rgw2yhh5yzajb',
fa: 'https://hook.us1.make.com/4cbueud23qmtrkwq396rgw2yhh5yzajb',
ts: 'https://hook.us1.make.com/4cbueud23qmtrkwq396rgw2yhh5yzajb',
ba: 'https://hook.us1.make.com/gr6i2ang1gpgox8ipotppi26gbjj1f7d',
tf: 'https://hook.us1.make.com/4cbueud23qmtrkwq396rgw2yhh5yzajb'
};
const state ={};
const originalState ={};
let currentTfMode = 'txa';
// UTILITY FUNCTIONS
function pill(status, label){
const icons ={ok: '✓', bad: '✕', na: '—' };
return `<div class="ppt-mini-pill ${status}">${icons[status]} ${label}</div>`;
}
function icon(status, symbol){
return `<div class="ppt-icon ${status}">${symbol}</div>`;
}
function showToast(msg, isError){
const t = document.getElementById('ppt-toast');
if (!t) return;
t.textContent = msg;
t.className = 'ppt-toast show' + (isError ? ' error' : '');
setTimeout(() => t.classList.remove('show'), 3500);
}
window.toggleDrawer = function(slotCode){
const drawer = document.getElementById(`drawer-${slotCode}`);
const tile = document.getElementById(`tile-${slotCode}`);
const chevron = tile?.querySelector('.ppt-chevron');
if (drawer){
 drawer.classList.toggle('open');
 chevron?.classList.toggle('open');
}
};
window.toggleSection = function(section){
const el = document.getElementById(`section-${section}`);
if (el) el.classList.toggle('collapsed');
};
function updateSlotIndicators(section, count, readyFn){
const container = document.getElementById(`${section}-indicators`);
if (!container) return;
let html = '';
for (let i = 1; i <= count; i++){
 const code = `${section}-${i}`;
 const isReady = readyFn(code);
 html += `<div class="ppt-slot-dot ${isReady ? 'ready' : 'empty'}">${i}</div>`;
}
container.innerHTML = html;
}
function getPubplanId(){
const el = document.querySelector('.pubplan-data-wrapper');
return el?.dataset?.pubplanId||'';
}
// DROPDOWN BUILDERS
function buildCustomerOptions(selectedId){
const custEls = document.querySelectorAll('.customers-wrapper');
const allCust = [];
custEls.forEach(el =>{
 if (el.dataset.id){
 allCust.push({id: el.dataset.id, name: el.dataset.name||'(unnamed)' });
 }
});
if (!allCust.length) return '<option value="" disabled selected>No customers</option>';
return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select customer...</option>' +
 allCust.sort((a,b) => a.name.localeCompare(b.name))
 .map(c => `<option value="${c.id}"${c.id === selectedId ? ' selected' : ''}>${c.name}</option>`).join('');
}
function buildSponsorOptions(selectedId){
const custEls = document.querySelectorAll('.customers-wrapper');
const allCust = [];
custEls.forEach(el =>{
 if (el.dataset.id){
 allCust.push({id: el.dataset.id, name: el.dataset.name||'(unnamed)' });
 }
});
if (!allCust.length) return '<option value="" disabled selected>No sponsors</option>';
return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Add sponsor...</option>' +
 allCust.sort((a,b) => a.name.localeCompare(b.name))
 .map(c => `<option value="${c.id}"${c.id === selectedId ? ' selected' : ''}>${c.name}</option>`).join('');
}
function buildCustomerOptionsWithLabel(selectedId, placeholder){
const custEls = document.querySelectorAll('.customers-wrapper');
const allCust = [];
custEls.forEach(el =>{
 if (el.dataset.id){
 allCust.push({id: el.dataset.id, name: el.dataset.name||'(unnamed)' });
 }
});
if (!allCust.length) return '<option value="" disabled selected>No options</option>';
return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>' + placeholder + '</option>' +
 allCust.sort((a,b) => a.name.localeCompare(b.name))
 .map(c => `<option value="${c.id}"${c.id === selectedId ? ' selected' : ''}>${c.name}</option>`).join('');
}
function buildArticleOptions(customerId, selectedId){
const wrapper = document.querySelector('.fa-picker-wrapper');
if (!wrapper) return '<option value="" disabled selected>No articles</option>';
const items = Array.from(wrapper.querySelectorAll('.fa-picker-item')).filter(el =>{
 return !customerId||el.dataset.customerId === customerId;
}).map(el => ({
 id: el.dataset.articleId||'',
 name: el.dataset.articleName||''
})).filter(a => a.id && a.name);
if (!items.length) return '<option value="" disabled selected>No articles</option>';
return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select article...</option>' +
 items.map(a => `<option value="${a.id}"${a.id === selectedId ? ' selected' : ''}>${a.name}</option>`).join('');
}
function buildTsArticleOptions(selectedId){
const wrapper = document.querySelector('.ts-picker-wrapper');
if (!wrapper) return '<option value="" disabled selected>No articles</option>';
const items = Array.from(wrapper.querySelectorAll('.ts-picker-item')).map(el => ({
 id: el.dataset.articleId||'',
 name: el.dataset.articleName||''
})).filter(a => a.id && a.name);
if (!items.length) return '<option value="" disabled selected>No articles</option>';
return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select article...</option>' +
 items.map(a => `<option value="${a.id}"${a.id === selectedId ? ' selected' : ''}>${a.name}</option>`).join('');
}
function buildAdOptions(customerId, selectedId, wrapperClass){
const adEls = document.querySelectorAll('.ads-wrapper');
const allAds = [];
adEls.forEach(el =>{
 const id = el.dataset.adId;
 if (id){
 allAds.push({
 id,
 name: el.dataset.adName||el.dataset.adTitle||el.dataset.name||'(untitled)',
 customerId: el.dataset.adCustomerId||el.dataset.customerId||''
 });
 }
});
const filtered = allAds.filter(a => !customerId||a.customerId === customerId);
if (!filtered.length) return '<option value="" disabled selected>No ads</option>';
return '<option value="" disabled' + (!selectedId ? ' selected' : '') + '>Select ad...</option>' +
 filtered.sort((a,b) => a.name.localeCompare(b.name))
 .map(a => `<option value="${a.id}"${a.id === selectedId ? ' selected' : ''}>${a.name}</option>`).join('');
}
// GR - GREETING
function initGrState(){
const el = document.querySelector('.pubplan-slot-wrapper[data-section-code="gr"]');
state['gr-1'] ={
 slotCode: 'gr-1',
 sectionCode: 'gr',
 slotNum: 1,
 pubplanId: el?.dataset.pubplanId||'',
 greetingTitle: el?.dataset.greetingTitle||'',
 greetingMessage: el?.dataset.greetingMessage||'',
 dirty: false
};
}
function renderGrTile(){
const s = state['gr-1'];
if (!s) return;
const isEditing = s.dirty||originalState['gr-1'];
const hasContent = s.greetingTitle||s.greetingMessage;
let contentHtml;
if (isEditing){
 contentHtml = `
 <div class="ppt-col" style="flex:1;">
 <span class="ppt-col-label">Greeting Title</span>
 <input type="text" class="ppt-input" value="${(s.greetingTitle||'').replace(/"/g, '&quot;')}" onchange="onGrTitleChange(this)" placeholder="Enter title...">
 </div>
 <div class="ppt-col" style="flex:2;">
 <span class="ppt-col-label">Greeting Message</span>
 <textarea class="ppt-textarea" onchange="onGrMessageChange(this)" placeholder="Enter message...">${s.greetingMessage||''}</textarea>
 </div>`;
} else if (hasContent){
 contentHtml = `
 <div class="ppt-col" style="flex:1;">
 <span class="ppt-col-label">Greeting Title</span>
 <span class="ppt-col-value">${s.greetingTitle||'—'}</span>
 </div>
 <div class="ppt-col" style="flex:2;">
 <span class="ppt-col-label">Greeting Message</span>
 <span class="ppt-col-value">${s.greetingMessage||'—'}</span>
 </div>`;
} else{
 contentHtml = `<div class="ppt-col" style="flex:1;"><span style="color:#ccc;">No greeting set. Click edit to add.</span></div>`;
}
const actionLink = isEditing ? 
 `<a class="ppt-cancel-link visible" onclick="cancelGrEdit()">cancel</a>` :
 `<a class="ppt-edit-icon" onclick="initGrEdit()" title="Edit">✎</a>`;
const html = `
 <div class="ppt-tile-row gr-row${isEditing ? ' has-pending' : ''}" id="tile-gr-1">
 <div class="ppt-slot-id sid-gr">GR-1</div>
 ${contentHtml}
 <div class="ppt-actions">${actionLink}</div>
 </div>`;
const existing = document.getElementById('tile-gr-1');
if (existing){existing.outerHTML = html;} else{const grid = document.getElementById('gr-grid'); if (grid) grid.insertAdjacentHTML('beforeend', html);}
}
function updateGrProgress(){
const isSlotReady = (code) =>{const s = state[code]; return !!(s?.greetingTitle && s?.greetingMessage);};
updateSlotIndicators('gr', 1, isSlotReady);
const btn = document.getElementById('gr-submit-btn');
if (btn) btn.className = 'ppt-submit-btn' + (state['gr-1']?.dirty ? ' active' : '');
}
window.onGrTitleChange = function(input){const s = state['gr-1']; if (!s) return; s.greetingTitle = input.value; s.dirty = true; updateGrProgress();};
window.onGrMessageChange = function(textarea){const s = state['gr-1']; if (!s) return; s.greetingMessage = textarea.value; s.dirty = true; updateGrProgress();};
window.initGrEdit = function(){
const s = state['gr-1'];
if (!s) return;
originalState['gr-1'] ={...s};
s.dirty = true;
renderGrTile();
updateGrProgress();
};
window.cancelGrEdit = function(){
const s = state['gr-1'];
const orig = originalState['gr-1'];
if (s && orig){
 Object.assign(s, orig);
 s.dirty = false;
 delete originalState['gr-1'];
}
renderGrTile();
updateGrProgress();
};
// FA - FEATURE ARTICLES
function initFaState(){
const slotEls = document.querySelectorAll('.pubplan-slot-wrapper[data-section-code="fa"]');
slotEls.forEach(el =>{
 const code = el.dataset.slotCode;
 if (!code) return;
 state[code] ={
 slotCode: code,
 sectionCode: 'fa',
 slotNum: parseInt(code.replace(/\D/g, ''), 10),
 pubplanId: el.dataset.pubplanId||'',
 titleadminId: el.dataset.titleadminId||'',
 categoryId: el.dataset.catId||el.dataset.categoryId||'',
 categoryName: el.dataset.catLabel||el.dataset.categoryName||'',
 categoryType: el.dataset.catType||'',
 articleId: el.dataset.articleId||'',
 articleName: el.dataset.articleTitle||el.dataset.articleName||'',
 customerId: el.dataset.customerId||'',
 customerName: el.dataset.customerName||'',
 sponsorId: el.dataset.sponsorId||'',
 sponsorName: el.dataset.sponsorName||'',
 artAdId: el.dataset.artAdId||'',
 artAdName: el.dataset.artAdName||'',
 artAdUrl: el.dataset.artAdUrl||'',
 artAdGo: el.dataset.artAdGo||'',
 nlSponsored: el.dataset.nlSponsored||'',
 dirty: false
 };
});
// Ensure fa-1 through fa-4 exist
for (let i = 1; i <= 4; i++){
 const code = `fa-${i}`;
 if (!state[code]){
 state[code] ={slotCode: code, sectionCode: 'fa', slotNum: i, categoryId: '', categoryName: '', articleId: '', articleName: '', customerId: '', customerName: '', sponsorId: '', sponsorName: '', artAdId: '', artAdName: '', dirty: false };
 }
}
}
function getFaPickerData(slotNum){
const pickerEl = document.querySelector('.fa-picker-wrapper');
if (!pickerEl) return{};
const prefix = `fa${slotNum}`;
// Read from picker wrapper attributes
const sponsoredStatus = pickerEl.dataset[`${prefix}SponsoredStatus`]||'';
const artAdGet = pickerEl.dataset[`${prefix}ArtAdGet`]||'';
const artAdGo = pickerEl.dataset[`${prefix}ArtAdGo`]||'';
// Get article-specific data from articles-wrapper element
const s = state[`fa-${slotNum}`];
const artEl = s?.articleId ? document.querySelector(`.articles-wrapper[data-article-id="${s.articleId}"]`) : null;
const artImgGet = artEl?.dataset.artImgGet||'';
const artWfImg = artEl?.dataset.imageUrl||'';
const showArtAd = artEl?.dataset.showArtAd||'';
const artPgSet = showArtAd === 'Show'||showArtAd === 'true' ? 'true' : '';
const nlPgSet = pickerEl.dataset[`${prefix}NlPgSet`]||'';
return{
 artImgGet,
 artWfImg,
 adImgGet: artAdGet,
 adGoLink: artAdGo,
 artPgSet,
 nlPgSet,
 sponsored: sponsoredStatus
};
}
function buildFaDrawer(slotCode){
const s = state[slotCode];
if (!s) return '';
const d = getFaPickerData(s.slotNum);
const artEl = s.articleId ? document.querySelector(`.articles-wrapper[data-article-id="${s.articleId}"]`) : null;
const fields = [
{label: 'Article Summary', value: artEl?.dataset.articleSummary||'—', status: artEl?.dataset.articleSummary ? 'ok' : 'bad' },
{label: 'Article Body', value: artEl?.dataset.articleBody ? 'Present' : '—', status: artEl?.dataset.articleBody ? 'ok' : 'bad' },
{label: 'Writer Name & Title', value: artEl?.dataset.writerName||'—', status: artEl?.dataset.writerName ? 'ok' : 'bad' },
{label: 'CoWriter Name & Title', value: artEl?.dataset.cowriterName||'—', status: artEl?.dataset.cowriterName ? 'ok' : 'na' },
{label: 'Main Image', value: d.artWfImg ? 'Present' : '—', status: d.artWfImg ? 'ok' : 'bad' },
{label: 'Main Image GET URL', value: d.artImgGet ? 'Present' : '—', status: d.artImgGet ? 'ok' : 'bad' },
{label: 'Article Type', value: artEl?.dataset.articleType||'—', status: artEl?.dataset.articleType ? 'ok' : 'bad' },
{label: 'ArtAd Status', value: d.artPgSet ? 'ON' : 'OFF', status: d.artPgSet ? 'ok' : 'na' },
{label: 'ArtAd Image Link', value: d.adImgGet ? 'Present' : '—', status: d.adImgGet ? 'ok' : (s.customerId||s.sponsorId ? 'bad' : 'na') },
{label: 'ArtAd Redirect', value: d.adGoLink ? 'Present' : '—', status: d.adGoLink ? 'ok' : (s.customerId||s.sponsorId ? 'bad' : 'na') }
];
return `<div class="ppt-drawer" id="drawer-${slotCode}"><div class="ppt-drawer-grid">${fields.map(f => `<div class="ppt-drawer-field"><span class="ppt-drawer-label">${f.label}</span><span class="ppt-drawer-value">${f.value}</span></div><div class="ppt-drawer-status">${icon(f.status, f.status === 'ok' ? '✓' : f.status === 'bad' ? '✕' : '—')}</div>`).join('')}</div></div>`;
}
function renderFaTile(slotCode){
const s = state[slotCode];
if (!s) return;
const isEditing = s.dirty||originalState[slotCode];
// Check if Paid Article based on category type or name
const isPaid = s.categoryType === 'Paid Article'||s.categoryName?.toLowerCase().includes('paid');
// Article column (no status icons)
let articleCol;
if (isEditing && !s.articleId){
 articleCol = `<div class="ppt-col">
 <span class="ppt-col-label">Article</span>
 <select class="ppt-dd${s.articleId ? ' has-selection' : ''}" onchange="onFaArticleChange('${slotCode}',this)">
 ${buildArticleOptions(s.customerId, s.articleId)}
 </select>
 </div>`;
} else if (s.articleId){
 articleCol = `<div class="ppt-col">
 <span class="ppt-col-label">Article</span>
 <span class="ppt-col-value">${s.articleName}</span>
 </div>`;
} else{
 articleCol = `<div class="ppt-col">
 <span class="ppt-col-label">Article</span>
 <select class="ppt-dd" onchange="onFaArticleChange('${slotCode}',this)">
 ${buildArticleOptions(s.customerId, '')}
 </select>
 </div>`;
}
// Customer/Sponsor column - conditional label based on Revenue Type
let custSponCol;
if (isPaid){
 // Paid article - show Customer
 const label = 'Customer';
 const ddLabel = 'Add customer...';
 if (s.customerId && !isEditing){
 custSponCol = `<div class="ppt-col">
 <span class="ppt-col-label">${label}</span>
 <span class="ppt-col-value">${s.customerName}</span>
 </div>`;
 } else{
 custSponCol = `<div class="ppt-col">
 <span class="ppt-col-label">${label}</span>
 <select class="ppt-dd${s.customerId ? ' has-selection' : ''}" onchange="onFaCustomerChange('${slotCode}',this)">
 ${buildCustomerOptionsWithLabel(s.customerId, ddLabel)}
 </select>
 </div>`;
 }
} else{
 // Sponsorable - show Sponsor
 const label = 'Sponsor';
 const ddLabel = 'Add sponsor...';
 if (s.sponsorId && !isEditing){
 custSponCol = `<div class="ppt-col">
 <span class="ppt-col-label">${label}</span>
 <span class="ppt-col-value sponsor">${s.sponsorName}</span>
 </div>`;
 } else{
 custSponCol = `<div class="ppt-col">
 <span class="ppt-col-label">${label}</span>
 <select class="ppt-dd${s.sponsorId ? ' has-selection' : ''}" onchange="onFaSponsorChange('${slotCode}',this)">
 ${buildCustomerOptionsWithLabel(s.sponsorId, ddLabel)}
 </select>
 </div>`;
 }
}
// Category with label
const catCol = `<div class="ppt-col">
 <span class="ppt-col-label">Category</span>
 <span class="ppt-cat-pill cpill-fa">${s.categoryName||'—'}</span>
</div>`;
const actionLink = isEditing ? 
 `<a class="ppt-cancel-link visible" onclick="cancelFaEdit('${slotCode}')">cancel</a>` :
 `<a class="ppt-edit-icon" onclick="initFaEdit('${slotCode}')" title="Edit">✎</a>`;
const chevron = `<span class="ppt-chevron" onclick="toggleDrawer('${slotCode}')">▾</span>`;
const html = `
 <div class="ppt-tile-row${isEditing ? ' has-pending' : ''}" id="tile-${slotCode}">
 <div class="ppt-slot-id sid-fa">${slotCode.toUpperCase()}</div>
 ${catCol}
 ${articleCol}
 ${custSponCol}
 <div class="ppt-actions">${actionLink}${chevron}</div>
 </div>
 ${buildFaDrawer(slotCode)}`;
const existing = document.getElementById(`tile-${slotCode}`);
const existingDrawer = document.getElementById(`drawer-${slotCode}`);
if (existing){
 // Preserve drawer state
 const drawerWasOpen = existingDrawer?.classList.contains('open');
 existing.outerHTML = html.split('\n').filter(l => !l.includes('ppt-drawer')).join('\n');
 if (existingDrawer) existingDrawer.remove();
 // Re-add drawer
 const newTile = document.getElementById(`tile-${slotCode}`);
 if (newTile){
 newTile.insertAdjacentHTML('afterend', buildFaDrawer(slotCode));
 if (drawerWasOpen){
 document.getElementById(`drawer-${slotCode}`)?.classList.add('open');
 newTile.querySelector('.ppt-chevron')?.classList.add('open');
 }
 }
} else{
 const grid = document.getElementById('fa-grid');
 if (grid) grid.insertAdjacentHTML('beforeend', html);
}
}
function renderAllFa(){
for (let i = 1; i <= 4; i++) renderFaTile(`fa-${i}`);
updateFaProgress();
}
window.onFaArticleChange = function(slotCode, sel){
const s = state[slotCode];
if (!s) return;
if (!originalState[slotCode]){
 originalState[slotCode] ={...s };
}
const opt = sel.options[sel.selectedIndex];
s.articleId = opt?.value||'';
s.articleName = opt?.textContent||'';
s.dirty = true;
renderFaTile(slotCode);
updateFaProgress();
};
window.onFaCustomerChange = function(slotCode, sel){
const s = state[slotCode];
if (!s) return;
if (!originalState[slotCode]){
 originalState[slotCode] ={...s };
}
const opt = sel.options[sel.selectedIndex];
s.customerId = opt?.value||'';
s.customerName = opt?.textContent||'';
s.dirty = true;
renderFaTile(slotCode);
updateFaProgress();
};
window.onFaSponsorChange = function(slotCode, sel){
const s = state[slotCode];
if (!s) return;
if (!originalState[slotCode]){
 originalState[slotCode] ={...s };
}
const opt = sel.options[sel.selectedIndex];
s.sponsorId = opt?.value||'';
s.sponsorName = opt?.textContent||'';
s.dirty = true;
renderFaTile(slotCode);
updateFaProgress();
};
window.onFaArtAdChange = function(slotCode, sel){
const s = state[slotCode];
if (!s) return;
if (!originalState[slotCode]){
 originalState[slotCode] ={...s };
}
const opt = sel.options[sel.selectedIndex];
s.artAdId = opt?.value||'';
s.artAdName = opt?.textContent||'';
s.dirty = true;
renderFaTile(slotCode);
updateFaProgress();
};
window.initFaEdit = function(slotCode){
const s = state[slotCode];
if (!s) return;
originalState[slotCode] ={...s };
s.dirty = true;
renderFaTile(slotCode);
updateFaProgress();
};
window.cancelFaEdit = function(slotCode){
const s = state[slotCode];
const orig = originalState[slotCode];
if (s && orig){
 Object.assign(s, orig);
 s.dirty = false;
 delete originalState[slotCode];
}
renderFaTile(slotCode);
updateFaProgress();
};
function updateFaProgress(){
const isSlotReady = (code) =>{
 const s = state[code];
 return !!(s?.articleId);
};
updateSlotIndicators('fa', 4, isSlotReady);
let pendingCount = 0;
for (let i = 1; i <= 4; i++){
 if (state[`fa-${i}`]?.dirty) pendingCount++;
}
const btn = document.getElementById('fa-submit-btn');
if (btn) btn.className = 'ppt-submit-btn' + (pendingCount > 0 ? ' active' : '');
}
// TS - THEMED SPOTLIGHTS
function initTsState(){
const slotEls = document.querySelectorAll('.pubplan-slot-wrapper[data-section-code="ts"]');
slotEls.forEach(el =>{
 const code = el.dataset.slotCode;
 if (!code) return;
 state[code] ={
 slotCode: code,
 sectionCode: 'ts',
 slotNum: parseInt(code.replace(/\D/g, ''), 10),
 pubplanId: el.dataset.pubplanId||'',
 titleadminId: el.dataset.titleadminId||'',
 categoryId: el.dataset.catId||el.dataset.categoryId||'',
 categoryName: el.dataset.catLabel||el.dataset.categoryName||'',
 articleId: el.dataset.articleId||'',
 articleName: el.dataset.articleTitle||el.dataset.articleName||'',
 sponsorId: el.dataset.sponsorId||'',
 sponsorName: el.dataset.sponsorName||'',
 artAdId: el.dataset.artAdId||'',
 artAdName: el.dataset.artAdName||'',
 artAdUrl: el.dataset.artAdUrl||'',
 artAdGo: el.dataset.artAdGo||'',
 dirty: false
 };
});
// Ensure ts-1 through ts-4 exist
for (let i = 1; i <= 4; i++){
 const code = `ts-${i}`;
 if (!state[code]){
 state[code] ={slotCode: code, sectionCode: 'ts', slotNum: i, categoryId: '', categoryName: '', articleId: '', articleName: '', sponsorId: '', sponsorName: '', artAdId: '', artAdName: '', dirty: false };
 }
}
}
function getTsPickerData(slotNum){
const pickerEl = document.querySelector('.ts-picker-wrapper');
if (!pickerEl) return{};
const prefix = `ts${slotNum}`;
const sponsoredStatus = pickerEl.dataset[`${prefix}SponsoredStatus`]||'';
const artAdGet = pickerEl.dataset[`${prefix}ArtAdGet`]||'';
const artAdGo = pickerEl.dataset[`${prefix}ArtAdGo`]||'';
// Get article-specific data from articles-wrapper element
const s = state[`ts-${slotNum}`];
const artEl = s?.articleId ? document.querySelector(`.articles-wrapper[data-article-id="${s.articleId}"]`) : null;
const artImgGet = artEl?.dataset.artImgGet||'';
const artWfImg = artEl?.dataset.imageUrl||'';
const showArtAd = artEl?.dataset.showArtAd||'';
const artPgSet = showArtAd === 'Show'||showArtAd === 'true' ? 'true' : '';
const nlPgSet = pickerEl.dataset[`${prefix}NlPgSet`]||'';
return{
 artImgGet,
 artWfImg,
 adImgGet: artAdGet,
 adGoLink: artAdGo,
 artPgSet,
 nlPgSet
};
}
function buildTsDrawer(slotCode){
const s = state[slotCode];
if (!s) return '';
const d = getTsPickerData(s.slotNum);
const artEl = s.articleId ? document.querySelector(`.articles-wrapper[data-article-id="${s.articleId}"]`) : null;
const fields = [
{label: 'Article Summary', value: artEl?.dataset.articleSummary||'—', status: artEl?.dataset.articleSummary ? 'ok' : 'bad' },
{label: 'Article Body', value: artEl?.dataset.articleBody ? 'Present' : '—', status: artEl?.dataset.articleBody ? 'ok' : 'bad' },
{label: 'Writer Name & Title', value: artEl?.dataset.writerName||'—', status: artEl?.dataset.writerName ? 'ok' : 'bad' },
{label: 'CoWriter Name & Title', value: artEl?.dataset.cowriterName||'—', status: artEl?.dataset.cowriterName ? 'ok' : 'na' },
{label: 'Main Image', value: d.artWfImg ? 'Present' : '—', status: d.artWfImg ? 'ok' : 'bad' },
{label: 'Main Image GET URL', value: d.artImgGet ? 'Present' : '—', status: d.artImgGet ? 'ok' : 'bad' },
{label: 'Article Type', value: artEl?.dataset.articleType||'—', status: artEl?.dataset.articleType ? 'ok' : 'bad' },
{label: 'ArtAd Status', value: d.artPgSet ? 'ON' : 'OFF', status: d.artPgSet ? 'ok' : 'na' },
{label: 'ArtAd Image Link', value: d.adImgGet ? 'Present' : '—', status: d.adImgGet ? 'ok' : (s.sponsorId ? 'bad' : 'na') },
{label: 'ArtAd Redirect', value: d.adGoLink ? 'Present' : '—', status: d.adGoLink ? 'ok' : (s.sponsorId ? 'bad' : 'na') }
];
return `<div class="ppt-drawer" id="drawer-${slotCode}"><div class="ppt-drawer-grid">${fields.map(f => `<div class="ppt-drawer-field"><span class="ppt-drawer-label">${f.label}</span><span class="ppt-drawer-value">${f.value}</span></div><div class="ppt-drawer-status">${icon(f.status, f.status === 'ok' ? '✓' : f.status === 'bad' ? '✕' : '—')}</div>`).join('')}</div></div>`;
}
function renderTsTile(slotCode){
const s = state[slotCode];
if (!s) return;
const isEditing = s.dirty||originalState[slotCode];
// Article column (no status icons)
let articleCol;
if (s.articleId){
 articleCol = `<div class="ppt-col">
 <span class="ppt-col-label">Article</span>
 <span class="ppt-col-value">${s.articleName}</span>
 </div>`;
} else{
 articleCol = `<div class="ppt-col">
 <span class="ppt-col-label">Article</span>
 <select class="ppt-dd" onchange="onTsArticleChange('${slotCode}',this)">
 ${buildTsArticleOptions(s.articleId)}
 </select>
 </div>`;
}
// Sponsor column - TS is always sponsorable
let sponsorCol;
if (s.sponsorId && !isEditing){
 sponsorCol = `<div class="ppt-col">
 <span class="ppt-col-label">Sponsor</span>
 <span class="ppt-col-value sponsor">${s.sponsorName}</span>
 </div>`;
} else{
 sponsorCol = `<div class="ppt-col">
 <span class="ppt-col-label">Sponsor</span>
 <select class="ppt-dd${s.sponsorId ? ' has-selection' : ''}" onchange="onTsSponsorChange('${slotCode}',this)">
 ${buildCustomerOptionsWithLabel(s.sponsorId, 'Add sponsor...')}
 </select>
 </div>`;
}
// Category with label
const catCol = `<div class="ppt-col">
 <span class="ppt-col-label">Category</span>
 <span class="ppt-cat-pill cpill-ts">${s.categoryName||'—'}</span>
</div>`;
const actionLink = isEditing ? 
 `<a class="ppt-cancel-link visible" onclick="cancelTsEdit('${slotCode}')">cancel</a>` :
 `<a class="ppt-edit-icon" onclick="initTsEdit('${slotCode}')" title="Edit">✎</a>`;
const chevron = `<span class="ppt-chevron" onclick="toggleDrawer('${slotCode}')">▾</span>`;
const html = `
 <div class="ppt-tile-row ts-row${isEditing ? ' has-pending' : ''}" id="tile-${slotCode}">
 <div class="ppt-slot-id sid-ts">${slotCode.toUpperCase()}</div>
 ${catCol}
 ${articleCol}
 ${sponsorCol}
 <div class="ppt-actions">${actionLink}${chevron}</div>
 </div>
 ${buildTsDrawer(slotCode)}`;
const existing = document.getElementById(`tile-${slotCode}`);
const existingDrawer = document.getElementById(`drawer-${slotCode}`);
if (existing){
 // Preserve drawer state
 const drawerWasOpen = existingDrawer?.classList.contains('open');
 existing.outerHTML = html.split('\n').filter(l => !l.includes('ppt-drawer')).join('\n');
 if (existingDrawer) existingDrawer.remove();
 // Re-add drawer
 const newTile = document.getElementById(`tile-${slotCode}`);
 if (newTile){
 newTile.insertAdjacentHTML('afterend', buildTsDrawer(slotCode));
 if (drawerWasOpen){
 document.getElementById(`drawer-${slotCode}`)?.classList.add('open');
 newTile.querySelector('.ppt-chevron')?.classList.add('open');
 }
 }
} else{
 const grid = document.getElementById('ts-grid');
 if (grid) grid.insertAdjacentHTML('beforeend', html);
}
}
function renderAllTs(){
for (let i = 1; i <= 4; i++) renderTsTile(`ts-${i}`);
updateTsProgress();
}
window.onTsArticleChange = function(slotCode, sel){
const s = state[slotCode];
if (!s) return;
if (!originalState[slotCode]) originalState[slotCode] ={...s };
const opt = sel.options[sel.selectedIndex];
s.articleId = opt?.value||'';
s.articleName = opt?.textContent||'';
s.dirty = true;
renderTsTile(slotCode);
updateTsProgress();
};
window.onTsSponsorChange = function(slotCode, sel){
const s = state[slotCode];
if (!s) return;
if (!originalState[slotCode]) originalState[slotCode] ={...s };
const opt = sel.options[sel.selectedIndex];
s.sponsorId = opt?.value||'';
s.sponsorName = opt?.textContent||'';
s.dirty = true;
renderTsTile(slotCode);
updateTsProgress();
};
window.onTsArtAdChange = function(slotCode, sel){
const s = state[slotCode];
if (!s) return;
if (!originalState[slotCode]) originalState[slotCode] ={...s };
const opt = sel.options[sel.selectedIndex];
s.artAdId = opt?.value||'';
s.artAdName = opt?.textContent||'';
s.dirty = true;
renderTsTile(slotCode);
updateTsProgress();
};
window.initTsEdit = function(slotCode){
const s = state[slotCode];
if (!s) return;
originalState[slotCode] ={...s };
s.dirty = true;
renderTsTile(slotCode);
updateTsProgress();
};
window.cancelTsEdit = function(slotCode){
const s = state[slotCode];
const orig = originalState[slotCode];
if (s && orig){
 Object.assign(s, orig);
 s.dirty = false;
 delete originalState[slotCode];
}
renderTsTile(slotCode);
updateTsProgress();
};
function updateTsProgress(){
const isSlotReady = (code) =>{
 const s = state[code];
 return !!(s?.articleId);
};
updateSlotIndicators('ts', 4, isSlotReady);
let pendingCount = 0;
for (let i = 1; i <= 4; i++){
 if (state[`ts-${i}`]?.dirty) pendingCount++;
}
const btn = document.getElementById('ts-submit-btn');
if (btn) btn.className = 'ppt-submit-btn' + (pendingCount > 0 ? ' active' : '');
}
// BA - BANNER ADS
function initBaState(){
const slotEls = document.querySelectorAll('.ba-slot-wrapper');
slotEls.forEach(el =>{
 const code = el.dataset.slotCode;
 if (!code) return;
 const slotNum = parseInt(code.replace(/\D/g, ''), 10);
 let adName = el.dataset.adTitle||el.dataset.adName||'';
 const adId = el.dataset.adId||'';
 if (adId && !adName){
 const adEl = document.querySelector(`.ads-wrapper[data-ad-id="${adId}"]`);
 adName = adEl?.dataset.adName||adEl?.dataset.adTitle||'';
 }
 state[code] ={
 slotCode: code,
 sectionCode: 'ba',
 slotNum: slotNum,
 pubplanId: el.dataset.pubplanId||'',
 titleadminId: el.dataset.titleadminId||'',
 customerId: el.dataset.customerId||'',
 customerName: el.dataset.customerName||'',
 adId: adId,
 adName: adName,
 dirty: false
 };
});
// Ensure ba-1 through ba-12 exist
for (let i = 1; i <= 12; i++){
 const code = `ba-${i}`;
 if (!state[code]){
 state[code] ={slotCode: code, sectionCode: 'ba', slotNum: i, customerId: '', customerName: '', adId: '', adName: '', dirty: false };
 }
}
}
function getBaPickerData(slotNum){
const wrapperClass = slotNum <= 6 ? '.ba-picker-1-wrapper' : '.ba-picker-2-wrapper';
const pickerEl = document.querySelector(wrapperClass);
if (!pickerEl) return{};
const prefix = `ba${slotNum}`;
return{
 adGet: pickerEl.dataset[`${prefix}AdGet`]||'',
 adGo: pickerEl.dataset[`${prefix}AdGo`]||''
};
}
function buildBaDrawer(slotCode){
const s = state[slotCode];
if (!s) return '';
const d = getBaPickerData(s.slotNum);
const fields = [
{label: 'Ad Image Link', value: d.adGet ? 'Present' : '—', status: d.adGet ? 'ok' : (s.adId ? 'bad' : 'na') },
{label: 'Ad Redirect', value: d.adGo ? 'Present' : '—', status: d.adGo ? 'ok' : (s.adId ? 'bad' : 'na') }
];
const fieldsHtml = fields.map(f => `
 <div class="ppt-drawer-field">
 <span class="ppt-drawer-label">${f.label}</span>
 <span class="ppt-drawer-value">${f.value}</span>
 </div>
 <div class="ppt-drawer-status">${icon(f.status, f.status === 'ok' ? '✓' : f.status === 'bad' ? '✕' : '—')}</div>
`).join('');
return `<div class="ppt-drawer" id="drawer-${slotCode}">
 <div class="ppt-drawer-grid" style="grid-template-columns: 1fr 80px 1fr 80px;">${fieldsHtml}</div>
</div>`;
}
function renderBaTile(slotCode){
const s = state[slotCode];
if (!s) return;
const isEditing = s.dirty||originalState[slotCode];
const d = getBaPickerData(s.slotNum);
// Ad thumbnail
const adThumb = d.adGet ? 
 `<img src="${d.adGet}" class="ppt-ad-thumb" alt="">` :
 `<div class="ppt-ad-thumb-placeholder">🖼</div>`;
// Customer column
let custCol;
if (s.customerId && !isEditing){
 custCol = `<div class="ppt-card-field">
 <span class="ppt-col-label">Customer</span>
 <span class="ppt-col-value">${s.customerName}</span>
 </div>`;
} else{
 custCol = `<div class="ppt-card-field">
 <span class="ppt-col-label">Customer</span>
 <select class="ppt-dd${s.customerId ? ' has-selection' : ''}" onchange="onBaCustomerChange('${slotCode}',this)">
 ${buildCustomerOptions(s.customerId)}
 </select>
 </div>`;
}
// Ad column
// Ad dropdown only shown when editing
let adCol = '';
if (isEditing||!s.adId){
 const wrapperClass = s.slotNum <= 6 ? '.ba-picker-1-wrapper' : '.ba-picker-2-wrapper';
 adCol = `<div class="ppt-card-field">
 <span class="ppt-col-label">Ad</span>
 <select class="ppt-dd${s.adId ? ' has-selection' : ''}" onchange="onBaAdChange('${slotCode}',this)"${!s.customerId ? ' disabled' : ''}>
 ${buildAdOptions(s.customerId, s.adId, wrapperClass)}
 </select>
 </div>`;
}
const actionLink = isEditing ? 
 `<a class="ppt-cancel-link visible" onclick="cancelBaEdit('${slotCode}')">cancel</a>` :
 (s.adId ? `<a class="ppt-edit-icon" onclick="initBaEdit('${slotCode}')" title="Edit">✎</a>` : '<span style="color:#ccc;">—</span>');
const chevron = `<span class="ppt-chevron" onclick="toggleDrawer('${slotCode}')">▾</span>`;
const html = `
 <div class="ppt-tile-wrapper" id="wrapper-${slotCode}">
 <div class="ppt-tile-card${isEditing ? ' has-pending' : ''}" id="tile-${slotCode}">
 <div class="ppt-card-slot">${slotCode.toUpperCase()}</div>
 ${adThumb}
 <div class="ppt-card-content">
 ${custCol}${adCol}
 </div>
 <div class="ppt-card-actions">${actionLink}${chevron}</div>
 </div>
 ${buildBaDrawer(slotCode)}
 </div>`;
const existing = document.getElementById(`wrapper-${slotCode}`);
if (existing){
 const drawerWasOpen = document.getElementById(`drawer-${slotCode}`)?.classList.contains('open');
 existing.outerHTML = html;
 if (drawerWasOpen){
 document.getElementById(`drawer-${slotCode}`)?.classList.add('open');
 document.getElementById(`tile-${slotCode}`)?.querySelector('.ppt-chevron')?.classList.add('open');
 }
} else{
 const grid = document.getElementById('ba-grid');
 if (grid) grid.insertAdjacentHTML('beforeend', html);
}
}
function renderAllBa(){
for (let i = 1; i <= 12; i++) renderBaTile(`ba-${i}`);
updateBaProgress();
}
window.onBaCustomerChange = function(slotCode, sel){
const s = state[slotCode];
if (!s) return;
if (!originalState[slotCode]) originalState[slotCode] ={...s };
const opt = sel.options[sel.selectedIndex];
s.customerId = opt?.value||'';
s.customerName = opt?.textContent||'';
s.adId = '';
s.adName = '';
s.dirty = true;
renderBaTile(slotCode);
updateBaProgress();
};
window.onBaAdChange = function(slotCode, sel){
const s = state[slotCode];
if (!s) return;
if (!originalState[slotCode]) originalState[slotCode] ={...s };
const opt = sel.options[sel.selectedIndex];
s.adId = opt?.value||'';
s.adName = opt?.textContent||'';
s.dirty = true;
renderBaTile(slotCode);
updateBaProgress();
};
window.initBaEdit = function(slotCode){
const s = state[slotCode];
if (!s) return;
originalState[slotCode] ={...s };
s.dirty = true;
renderBaTile(slotCode);
updateBaProgress();
};
window.cancelBaEdit = function(slotCode){
const s = state[slotCode];
const orig = originalState[slotCode];
if (s && orig){
 Object.assign(s, orig);
 s.dirty = false;
 delete originalState[slotCode];
}
renderBaTile(slotCode);
updateBaProgress();
};
function updateBaProgress(){
const isSlotReady = (code) =>{
 const s = state[code];
 return !!(s?.adId);
};
updateSlotIndicators('ba', 12, isSlotReady);
let pendingCount = 0;
for (let i = 1; i <= 12; i++){
 if (state[`ba-${i}`]?.dirty) pendingCount++;
}
const btn = document.getElementById('ba-submit-btn');
if (btn) btn.className = 'ppt-submit-btn' + (pendingCount > 0 ? ' active' : '');
}
// TF - THE FIND (TXA & LBP)
window.switchTfMode = function(mode){
if (mode === currentTfMode) return;
// Check for pending changes
const hasTxaChanges = [1,2,3,4,5].some(i => state[`txa-${i}`]?.dirty);
const hasLbpChanges = state['lbp-1']?.dirty;
const hasChanges = (currentTfMode === 'txa' && hasTxaChanges)||(currentTfMode === 'lbp' && hasLbpChanges);
if (hasChanges){
 if (!confirm('Switching modes will clear unsaved changes. Continue?')) return;
 // Clear changes
 if (currentTfMode === 'txa'){
 for (let i = 1; i <= 5; i++){
 const code = `txa-${i}`;
 if (state[code]){state[code].dirty = false; state[code].customerId = ''; state[code].customerName = ''; }
 delete originalState[code];
 }
 } else{
 if (state['lbp-1']){state['lbp-1'].dirty = false; state['lbp-1'].customerId = ''; state['lbp-1'].customerName = ''; }
 delete originalState['lbp-1'];
 }
}
currentTfMode = mode;
// Update toggle buttons
document.querySelectorAll('.tf-mode-btn').forEach(btn =>{
 btn.classList.toggle('active', btn.dataset.mode === mode);
});
// Update containers
document.querySelector('.the-find-txa')?.classList.toggle('is-active', mode === 'txa');
document.querySelector('.the-find-lbp')?.classList.toggle('is-active', mode === 'lbp');
// Update slot count
const countEl = document.getElementById('tf-slot-count');
if (countEl) countEl.textContent = mode === 'txa' ? '5 slots' : '1 slot';
updateTfProgress();
};
function initTxaState(){
const slotEls = document.querySelectorAll('.txa-slot-wrapper');
slotEls.forEach(el =>{
 const code = el.dataset.slotCode;
 if (!code) return;
 state[code] ={
 slotCode: code,
 sectionCode: 'txa',
 slotNum: parseInt(code.replace(/\D/g, ''), 10),
 customerId: el.dataset.customerId||'',
 customerName: el.dataset.customerName||'',
 dirty: false
 };
});
// Ensure txa-1 through txa-5 exist
for (let i = 1; i <= 5; i++){
 const code = `txa-${i}`;
 if (!state[code]){
 state[code] ={slotCode: code, sectionCode: 'txa', slotNum: i, customerId: '', customerName: '', dirty: false };
 }
}
}
function getTxaPickerData(slotNum){
const wrapper = document.querySelector('.txa-picker-wrapper');
if (!wrapper) return{};
const prefix = `txa${slotNum}`;
return{
 logoLink: wrapper.dataset[`${prefix}LogoLink`]||'',
 redirect: wrapper.dataset[`${prefix}Redirect`]||'',
 headline: wrapper.dataset[`${prefix}Headline`]||'',
 body: wrapper.dataset[`${prefix}Body`]||''
};
}
function buildTxaDrawer(slotCode){
const s = state[slotCode];
if (!s) return '';
const d = getTxaPickerData(s.slotNum);
const fields = [
{label: 'Logo Link', value: d.logoLink ? 'Present' : '—', status: d.logoLink ? 'ok' : (s.customerId ? 'bad' : 'na') },
{label: 'Redirect URL', value: d.redirect ? 'Present' : '—', status: d.redirect ? 'ok' : (s.customerId ? 'bad' : 'na') },
{label: 'Headline', value: d.headline||'—', status: d.headline ? 'ok' : (s.customerId ? 'bad' : 'na') },
{label: 'Body Text', value: d.body ? 'Present' : '—', status: d.body ? 'ok' : (s.customerId ? 'bad' : 'na') }
];
const fieldsHtml = fields.map(f => `
 <div class="ppt-drawer-field">
 <span class="ppt-drawer-label">${f.label}</span>
 <span class="ppt-drawer-value">${f.value}</span>
 </div>
 <div class="ppt-drawer-status">${icon(f.status, f.status === 'ok' ? '✓' : f.status === 'bad' ? '✕' : '—')}</div>
`).join('');
return `<div class="ppt-drawer" id="drawer-${slotCode}">
 <div class="ppt-drawer-grid" style="grid-template-columns: repeat(2, 1fr 80px);">${fieldsHtml}</div>
</div>`;
}
function renderTxaTile(slotCode){
const s = state[slotCode];
if (!s) return;
const isEditing = s.dirty||originalState[slotCode];
const d = getTxaPickerData(s.slotNum);
// Logo thumbnail
const logoThumb = d.logoLink ? 
 `<img src="${d.logoLink}" class="ppt-ad-thumb" alt="">` :
 `<div class="ppt-ad-thumb-placeholder">🖼</div>`;
// Customer column
let custCol;
if (s.customerId && !isEditing){
 custCol = `<div class="ppt-card-field">
 <span class="ppt-col-label">Customer</span>
 <span class="ppt-col-value">${s.customerName}</span>
 </div>`;
} else{
 custCol = `<div class="ppt-card-field">
 <span class="ppt-col-label">Customer</span>
 <select class="ppt-dd${s.customerId ? ' has-selection' : ''}" onchange="onTxaCustomerChange('${slotCode}',this)">
 ${buildCustomerOptions(s.customerId)}
 </select>
 </div>`;
}
const actionLink = isEditing ? 
 `<a class="ppt-cancel-link visible" onclick="cancelTxaEdit('${slotCode}')">cancel</a>` :
 (s.customerId ? `<a class="ppt-edit-icon" onclick="initTxaEdit('${slotCode}')" title="Edit">✎</a>` : '<span style="color:#ccc;">—</span>');
const chevron = `<span class="ppt-chevron" onclick="toggleDrawer('${slotCode}')">▾</span>`;
const html = `
 <div class="ppt-tile-wrapper" id="wrapper-${slotCode}">
 <div class="ppt-tile-card tf-card${isEditing ? ' has-pending' : ''}" id="tile-${slotCode}">
 <div class="ppt-card-slot">${slotCode.toUpperCase()}</div>
 ${logoThumb}
 <div class="ppt-card-content">
 ${custCol}
 </div>
 <div class="ppt-card-actions">${actionLink}${chevron}</div>
 </div>
 ${buildTxaDrawer(slotCode)}
 </div>`;
const existing = document.getElementById(`wrapper-${slotCode}`);
if (existing){
 const drawerWasOpen = document.getElementById(`drawer-${slotCode}`)?.classList.contains('open');
 existing.outerHTML = html;
 if (drawerWasOpen){
 document.getElementById(`drawer-${slotCode}`)?.classList.add('open');
 document.getElementById(`tile-${slotCode}`)?.querySelector('.ppt-chevron')?.classList.add('open');
 }
} else{
 const grid = document.getElementById('txa-grid');
 if (grid) grid.insertAdjacentHTML('beforeend', html);
}
}
function renderAllTxa(){
for (let i = 1; i <= 5; i++) renderTxaTile(`txa-${i}`);
}
window.onTxaCustomerChange = function(slotCode, sel){
const s = state[slotCode];
if (!s) return;
if (!originalState[slotCode]) originalState[slotCode] ={...s };
const opt = sel.options[sel.selectedIndex];
s.customerId = opt?.value||'';
s.customerName = opt?.textContent||'';
s.dirty = true;
renderTxaTile(slotCode);
updateTfProgress();
};
window.initTxaEdit = function(slotCode){
const s = state[slotCode];
if (!s) return;
originalState[slotCode] ={...s };
s.dirty = true;
renderTxaTile(slotCode);
updateTfProgress();
};
window.cancelTxaEdit = function(slotCode){
const s = state[slotCode];
const orig = originalState[slotCode];
if (s && orig){
 Object.assign(s, orig);
 s.dirty = false;
 delete originalState[slotCode];
}
renderTxaTile(slotCode);
updateTfProgress();
};
// LBP
function initLbpState(){
// LBP uses same customer assignment as TXA-1
const el = document.querySelector('.txa-slot-wrapper[data-slot-code="txa-1"]');
state['lbp-1'] ={
 slotCode: 'lbp-1',
 sectionCode: 'lbp',
 customerId: el?.dataset.customerId||'',
 customerName: el?.dataset.customerName||'',
 dirty: false
};
}
function getLbpPickerData(){
const wrapper = document.querySelector('.txa-picker-wrapper');
if (!wrapper) return{};
return{
 logoLink: wrapper.dataset.lbpLogoLink||'',
 redirect: wrapper.dataset.lbpRedirect||'',
 service1: wrapper.dataset.lbpService1||'',
 service2: wrapper.dataset.lbpService2||'',
 service3: wrapper.dataset.lbpService3||'',
 service4: wrapper.dataset.lbpService4||'',
 service5: wrapper.dataset.lbpService5||'',
 service6: wrapper.dataset.lbpService6||''
};
}
function buildLbpDrawer(){
const s = state['lbp-1'];
if (!s) return '';
const d = getLbpPickerData();
const fields = [
{label: 'Logo Link', value: d.logoLink ? 'Present' : '—', status: d.logoLink ? 'ok' : (s.customerId ? 'bad' : 'na') },
{label: 'Redirect URL', value: d.redirect ? 'Present' : '—', status: d.redirect ? 'ok' : (s.customerId ? 'bad' : 'na') },
{label: 'Service 1', value: d.service1||'—', status: d.service1 ? 'ok' : 'na' },
{label: 'Service 2', value: d.service2||'—', status: d.service2 ? 'ok' : 'na' },
{label: 'Service 3', value: d.service3||'—', status: d.service3 ? 'ok' : 'na' },
{label: 'Service 4', value: d.service4||'—', status: d.service4 ? 'ok' : 'na' },
{label: 'Service 5', value: d.service5||'—', status: d.service5 ? 'ok' : 'na' },
{label: 'Service 6', value: d.service6||'—', status: d.service6 ? 'ok' : 'na' }
];
const fieldsHtml = fields.map(f => `
 <div class="ppt-drawer-field">
 <span class="ppt-drawer-label">${f.label}</span>
 <span class="ppt-drawer-value">${f.value}</span>
 </div>
 <div class="ppt-drawer-status">${icon(f.status, f.status === 'ok' ? '✓' : f.status === 'bad' ? '✕' : '—')}</div>
`).join('');
return `<div class="ppt-drawer" id="drawer-lbp-1">
 <div class="ppt-drawer-grid" style="grid-template-columns: repeat(4, 1fr 60px);">${fieldsHtml}</div>
</div>`;
}
function renderLbpTile(){
const s = state['lbp-1'];
if (!s) return;
const isEditing = s.dirty||originalState['lbp-1'];
const d = getLbpPickerData();
// Customer column
let custCol;
if (s.customerId && !isEditing){
 custCol = `<div class="ppt-card-field">
 <span class="ppt-col-label">Featured Business</span>
 <span class="ppt-col-value">${s.customerName}</span>
 </div>`;
} else{
 custCol = `<div class="ppt-card-field">
 <span class="ppt-col-label">Featured Business</span>
 <select class="ppt-dd${s.customerId ? ' has-selection' : ''}" style="min-width:200px;" onchange="onLbpCustomerChange(this)">
 ${buildCustomerOptions(s.customerId)}
 </select>
 </div>`;
}
const actionLink = isEditing ? 
 `<a class="ppt-cancel-link visible" onclick="cancelLbpEdit()">cancel</a>` :
 (s.customerId ? `<a class="ppt-edit-icon" onclick="initLbpEdit()" title="Edit">✎</a>` : '<span style="color:#ccc;">—</span>');
const chevron = `<span class="ppt-chevron" onclick="toggleDrawer('lbp-1')">▾</span>`;
const html = `
 <div class="ppt-tile-card tf-card${isEditing ? ' has-pending' : ''}" id="tile-lbp-1">
 <div class="ppt-card-slot">LBP</div>
 <div class="ppt-card-content">
 ${custCol}
 </div>
 <div class="ppt-card-actions">${actionLink}${chevron}</div>
 </div>
 ${buildLbpDrawer()}`;
const existing = document.getElementById('tile-lbp-1');
const existingDrawer = document.getElementById('drawer-lbp-1');
if (existing){
 const drawerWasOpen = existingDrawer?.classList.contains('open');
 existing.outerHTML = html.split('\n').filter(l => !l.includes('ppt-drawer')).join('\n');
 if (existingDrawer) existingDrawer.remove();
 const newTile = document.getElementById('tile-lbp-1');
 if (newTile){
 newTile.insertAdjacentHTML('afterend', buildLbpDrawer());
 if (drawerWasOpen){
 document.getElementById('drawer-lbp-1')?.classList.add('open');
 newTile.querySelector('.ppt-chevron')?.classList.add('open');
 }
 }
} else{
 const grid = document.getElementById('lbp-grid');
 if (grid) grid.insertAdjacentHTML('beforeend', html);
}
}
window.onLbpCustomerChange = function(sel){
const s = state['lbp-1'];
if (!s) return;
if (!originalState['lbp-1']) originalState['lbp-1'] ={...s };
const opt = sel.options[sel.selectedIndex];
s.customerId = opt?.value||'';
s.customerName = opt?.textContent||'';
s.dirty = true;
renderLbpTile();
updateTfProgress();
};
window.initLbpEdit = function(){
const s = state['lbp-1'];
if (!s) return;
originalState['lbp-1'] ={...s };
s.dirty = true;
renderLbpTile();
updateTfProgress();
};
window.cancelLbpEdit = function(){
const s = state['lbp-1'];
const orig = originalState['lbp-1'];
if (s && orig){
 Object.assign(s, orig);
 s.dirty = false;
 delete originalState['lbp-1'];
}
renderLbpTile();
updateTfProgress();
};
function updateTfProgress(){
const count = currentTfMode === 'txa' ? 5 : 1;
const prefix = currentTfMode === 'txa' ? 'txa' : 'lbp';
const isSlotReady = (code) =>{
 const s = state[code];
 return !!(s?.customerId);
};
updateSlotIndicators('tf', count, (code) =>{
 const idx = parseInt(code.split('-')[1]);
 return isSlotReady(`${prefix}-${idx}`);
});
let pendingCount = 0;
if (currentTfMode === 'txa'){
 for (let i = 1; i <= 5; i++){
 if (state[`txa-${i}`]?.dirty) pendingCount++;
 }
} else{
 if (state['lbp-1']?.dirty) pendingCount++;
}
const btn = document.getElementById('tf-submit-btn');
if (btn) btn.className = 'ppt-submit-btn' + (pendingCount > 0 ? ' active' : '');
}
// SUBMIT SECTION
window.submitSection = async function(section){
const btn = document.getElementById(`${section}-submit-btn`);
if (!btn||btn.classList.contains('submitting')) return;
btn.classList.add('submitting');
btn.textContent = 'Saving...';
const pubplanId = getPubplanId();
const payload ={section, pubplanId, slots: [] };
if (section === 'gr'){
 const s = state['gr-1'];
 if (s?.dirty){
 payload.slots.push({
 slotCode: s.slotCode,
 greetingTitle: s.greetingTitle,
 greetingMessage: s.greetingMessage
 });
 }
} else if (section === 'fa'){
 for (let i = 1; i <= 4; i++){
 const s = state[`fa-${i}`];
 if (s?.dirty){
 payload.slots.push({
 slotCode: s.slotCode,
 articleId: s.articleId,
 customerId: s.customerId,
 sponsorId: s.sponsorId,
 artAdId: s.artAdId
 });
 }
 }
} else if (section === 'ts'){
 for (let i = 1; i <= 4; i++){
 const s = state[`ts-${i}`];
 if (s?.dirty){
 payload.slots.push({
 slotCode: s.slotCode,
 articleId: s.articleId,
 sponsorId: s.sponsorId,
 artAdId: s.artAdId
 });
 }
 }
} else if (section === 'ba'){
 for (let i = 1; i <= 12; i++){
 const s = state[`ba-${i}`];
 if (s?.dirty){
 payload.slots.push({
 slotCode: s.slotCode,
 customerId: s.customerId,
 adId: s.adId
 });
 }
 }
} else if (section === 'tf'){
 payload.mode = currentTfMode;
 if (currentTfMode === 'txa'){
 for (let i = 1; i <= 5; i++){
 const s = state[`txa-${i}`];
 if (s?.dirty){
 payload.slots.push({
 slotCode: s.slotCode,
 customerId: s.customerId
 });
 }
 }
 } else{
 const s = state['lbp-1'];
 if (s?.dirty){
 payload.slots.push({
 slotCode: 'lbp-1',
 customerId: s.customerId
 });
 }
 }
}
try{
 const resp = await fetch(WEBHOOK_URLS[section],{
 method: 'POST',
 headers:{'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 });
 
 if (resp.ok){
 showToast(`${section.toUpperCase()} changes saved!`);
 // Clear dirty flags
 payload.slots.forEach(slot =>{
 if (state[slot.slotCode]){
 state[slot.slotCode].dirty = false;
 delete originalState[slot.slotCode];
 }
 });
 // Re-render
 if (section === 'gr'){renderGrTile(); updateGrProgress(); }
 else if (section === 'fa'){renderAllFa(); }
 else if (section === 'ts'){renderAllTs(); }
 else if (section === 'ba'){renderAllBa(); }
 else if (section === 'tf'){
 renderAllTxa(); 
 renderLbpTile();
 updateTfProgress();
 }
 } else{
 showToast('Save failed. Please try again.', true);
 }
} catch (e){
 console.error('Submit error:', e);
 showToast('Network error. Please try again.', true);
}
btn.classList.remove('submitting');
btn.textContent = `Save ${section.toUpperCase()} Changes`;
};
// INIT
function init(){
// Display pubplan name
const nameEl = document.getElementById('pubplan-name-display');
const dataWrapper = document.querySelector('.pubplan-data-wrapper');
if (nameEl && dataWrapper){
 nameEl.textContent = dataWrapper.dataset.pubplanName||'';
}
// Initialize all sections
initGrState();
initFaState();
initTsState();
initBaState();
initTxaState();
initLbpState();
// Render all
renderGrTile();
updateGrProgress();
renderAllFa();
renderAllTs();
renderAllBa();
renderAllTxa();
renderLbpTile();
updateTfProgress();
}
if (document.readyState === 'loading'){
document.addEventListener('DOMContentLoaded', init);
} else{
init();
}
})();
</script>
