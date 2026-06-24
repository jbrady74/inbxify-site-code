/*
   ta-intake-manager-v1.0.3.js
   ─────────────────────────────────────────────────────────────
   Studio · Intake tab manager — single owner of the Intake panel.

   v1.0.3 - added Console logs
   
   v1.0.2 — TWO FIXES over v1.0.1:
     1. ACTION BAR now actually renders. v1.0.1's bar lived in a
        sibling <div id="intk-bar"> but the selection→bar render
        path was never exercised; rebuilt as a fixed-anchor bar
        that appears whenever ≥1 item is selected.
     2. ATTACH + CREATE are REAL now, ported faithfully from the
        working ta-bundles-v1.2.1 cascade (not the fictional
        InbxASF.openAttach of v1.0.1):
          • Attach to existing → Scenario K mode:attach with the
            full payload (assetType, assetId, assetCollId,
            mediaCollId, tenantId, mediaStatusAttached, forceReplace)
            + article-collision preflight modal.
          • Create new → window.InbxASF.open({ mode:'create',
            assetType, prefilledMediaIds, tenantId }) — exactly as
            v1.2.1 called it.
        Two-step cascade: pick Asset Type → (attach: search/pick
        existing asset · create: confirm) → Save.

   Still owns: Scenario I read, nested subtabs, derived bundle
   status ("archived counts as resolved"), multi-select (item +
   bundle-header), bulk ARCHIVE/RESTORE via Scenario K
   (mode:archive/restore).

   CONFIG (window.TA_CONFIG):
     • titleSlug
     • scenarioI / makeBundlesRead   (reader; fallback below)
     • makeAttachFiles               (Scenario K — attach/archive/restore)
     • wfColl.{articles,ads,events,realEstate,media}  (collection IDs)
     • optionIds.mediaStatus.{available,attached,archived}  (hashes)

   DEPLOY: replace ta-intake-manager-v1.0.1.js in T-A head.
   ─────────────────────────────────────────────────────────────
*/
(function () {
  'use strict';

  var FILE_VERSION = '1.0.3';
  var DEBUG = !!(window.TA_CONFIG && window.TA_CONFIG.debug);

  /* HC-INTK-1 · Scenario I reader (hook 2718766 · Bundles_Read responder)
     HC-INTK-2 · Scenario K (hook 2718974 · attach/create/archive/restore) */
  var SCENARIO_I_FALLBACK = 'https://hook.us1.make.com/fkqas4u7bptpo7a3up1knqur8i9xtfwj';
  var SCENARIO_K_FALLBACK = 'https://hook.us1.make.com/b1w6sq7c3dzs8504rnl03ihokg1jsa1t';

  var TYPE_LABELS = { article: 'Article', ad: 'Ad', event: 'Event', re: 'RE Listing' };
  var TYPE_TO_ASSETS_KEY = { article: 'articles', ad: 'ads', event: 'events', re: 'reListings' };

  function _cfg() { return (window && window.TA_CONFIG) ? window.TA_CONFIG : {}; }
  function _scenarioIUrl() { var c = _cfg(); return c.scenarioI || c.makeBundlesRead || SCENARIO_I_FALLBACK; }
  function _scenarioKUrl() { var c = _cfg(); return c.makeAttachFiles || SCENARIO_K_FALLBACK; }
  function _mediaStatusHash(which) {
    var ids = (_cfg().optionIds && _cfg().optionIds.mediaStatus) || {};
    return ids[which] || null;
  }
  function getAssetCollId(type) {
    var w = _cfg().wfColl || {};
    switch (type) {
      case 'article': return w.articles;
      case 'ad':      return w.ads;
      case 'event':   return w.events;
      case 're':      return w.realEstate;
      default:        return null;
    }
  }

  /* ── State ── */
  var S = {
    loading: false, error: null, data: null, tenantId: null, lastFetchAt: 0,
    mounted: false,
    l1: 'bundles', l2: 'pending',
    expanded: {}, selected: {}, busy: false,
    cascade: null,        // null | { mode:'attach'|'create', type, assetId, assetName }
    replaceModal: null    // null | { collisions:[...], payload }
  };

  var L2_DEFS = {
    bundles: [['pending','Awaiting assignment'],['partial','Partially assigned'],['fully_assigned','Fully assigned'],['archived','Archived']],
    loose:   [['available','Awaiting use'],['used','Used'],['archived','Archived']]
  };

  /* ── helpers ── */
  function escHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function escAttr(s){return escHtml(s);}

  /* ── data shaping ── */
  function mergeMedia(d){var a=(d&&Array.isArray(d.media))?d.media:[];var b=(d&&Array.isArray(d.mediaExtra))?d.mediaExtra:[];return a.concat(b);}
  function filterByTenant(items,tid){if(!tid)return items;return items.filter(function(i){var fd=i&&i.fieldData;return fd&&fd['title-admin']===tid;});}
  function groupByBundle(items){var g={},o=[];items.forEach(function(m){var fd=m.fieldData||{},bid=fd['bundle-id'];if(!bid)return;if(!g[bid]){g[bid]={id:bid,label:fd['bundle-label']||bid,items:[]};o.push(bid);}g[bid].items.push(m);});return o.map(function(id){return g[id];});}
  function findLoose(items){return items.filter(function(m){return !(m.fieldData||{})['bundle-id'];});}
  function buildAssetLookup(d){function ix(a){var o={};if(Array.isArray(a))a.forEach(function(r){if(r&&r.id)o[r.id]=r;});return o;}return{articles:ix(d.articles),ads:ix(d.ads),events:ix(d.events),reListings:ix(d.reListings)};}
  function assetDisplayName(rec){if(!rec)return null;var fd=rec.fieldData||{};return fd.name||fd.slug||rec.id;}
  function assetMetaLine(rec){if(!rec)return '';var fd=rec.fieldData||{};return fd['issue-label']||fd['publish-date']||fd.slug||'';}
  function fileName(item){var fd=item.fieldData||{};return fd['original-filename']||fd.name||fd['file-name']||fd.slug||item.id;}

  function assetBelongsToTenant(rec,type,tid){
    if(!tid)return true;
    var fd=rec&&rec.fieldData; if(!fd)return false;
    if(type==='article')return fd['associated-title']===tid;
    var t=fd['titles']; return Array.isArray(t)&&t.indexOf(tid)!==-1;
  }
  function getAssetsForType(type){
    if(!S.data)return [];
    var arr=S.data[TYPE_TO_ASSETS_KEY[type]]; if(!Array.isArray(arr))return [];
    return arr.filter(function(r){return assetBelongsToTenant(r,type,S.tenantId);})
              .map(function(r){return {id:r.id,name:assetDisplayName(r),meta:assetMetaLine(r)};});
  }
  function filterAssets(assets,q){if(!q)return assets;q=String(q).toLowerCase();return assets.filter(function(a){return (a.name||'').toLowerCase().indexOf(q)!==-1;});}

  /* ── status ── */
  function readMediaStatus(m){
    var fd=(m&&m.fieldData)||{},raw=fd.status; if(raw==null||raw==='')return 'other';
    var av=_mediaStatusHash('available'),at=_mediaStatusHash('attached'),ar=_mediaStatusHash('archived');
    if(av&&raw===av)return 'available'; if(at&&raw===at)return 'attached'; if(ar&&raw===ar)return 'archived';
    var s=String(raw).trim().toLowerCase();
    if(s==='available')return 'available'; if(s==='attached')return 'attached'; if(s==='archived')return 'archived';
    return 'other';
  }
  function getMediaAssetRefs(m,lookup){
    var fd=m.fieldData||{},refs=[],seen={};
    function push(t,id,reg){if(!id)return;var k=t+':'+id;if(seen[k])return;seen[k]=true;refs.push({type:t,id:id,name:assetDisplayName(reg[id])||id});}
    if(fd.article)push('article',fd.article,lookup.articles);
    Object.keys(lookup.articles).forEach(function(a){var mi=lookup.articles[a].fieldData&&lookup.articles[a].fieldData['media-items'];if(Array.isArray(mi)&&mi.indexOf(m.id)!==-1)push('article',a,lookup.articles);});
    if(Array.isArray(fd.ads))fd.ads.forEach(function(id){push('ad',id,lookup.ads);});
    Object.keys(lookup.ads).forEach(function(a){var mi=lookup.ads[a].fieldData&&lookup.ads[a].fieldData['media-items'];if(Array.isArray(mi)&&mi.indexOf(m.id)!==-1)push('ad',a,lookup.ads);});
    if(Array.isArray(fd.events))fd.events.forEach(function(id){push('event',id,lookup.events);});
    Object.keys(lookup.events).forEach(function(a){var mi=lookup.events[a].fieldData&&lookup.events[a].fieldData['media-items'];if(Array.isArray(mi)&&mi.indexOf(m.id)!==-1)push('event',a,lookup.events);});
    var re=fd['re-listing']; if(Array.isArray(re))re.forEach(function(id){push('re',id,lookup.reListings);});else if(typeof re==='string'&&re)push('re',re,lookup.reListings);
    Object.keys(lookup.reListings).forEach(function(a){var mi=lookup.reListings[a].fieldData&&lookup.reListings[a].fieldData['media-items'];if(Array.isArray(mi)&&mi.indexOf(m.id)!==-1)push('re',a,lookup.reListings);});
    return refs;
  }
  function isItemResolved(item,lookup){var st=readMediaStatus(item);if(st==='attached'||st==='archived')return true;return getMediaAssetRefs(item,lookup).length>0;}
  function computeBundleStatus(bundle,lookup){
    var items=bundle.items||[]; if(!items.length)return 'pending';
    if(items.every(function(i){return readMediaStatus(i)==='archived';}))return 'archived';
    var r=0; items.forEach(function(i){if(isItemResolved(i,lookup))r++;});
    if(r===0)return 'pending'; if(r===items.length)return 'fully_assigned'; return 'partial';
  }
  function looseBucket(item,lookup){var st=readMediaStatus(item);if(st==='archived')return 'archived';if(st==='attached'||getMediaAssetRefs(item,lookup).length>0)return 'used';return 'available';}
  function bundleCounts(bs,lk){var c={pending:0,partial:0,fully_assigned:0,archived:0};bs.forEach(function(b){c[computeBundleStatus(b,lk)]++;});return c;}
  function looseCounts(ls,lk){var c={available:0,used:0,archived:0};ls.forEach(function(f){c[looseBucket(f,lk)]++;});return c;}

  /* ── selection ── */
  function isSel(id){return S.selected[id]===true;}
  function selIds(){return Object.keys(S.selected).filter(function(k){return S.selected[k];});}
  function selectedCount(){return selIds().length;}
  function clearSel(){S.selected={};S.cascade=null;}
  function toggleSel(id){if(S.selected[id])delete S.selected[id];else S.selected[id]=true;if(selectedCount()===0)S.cascade=null;}

  /* ── fetch (Scenario I) ── */
  function fetchAndRender(force){
    if(S.loading)return;
    var cfg=_cfg();
    if(!cfg.titleSlug){S.error='TA_CONFIG.titleSlug missing — cannot identify tenant';render();return;}
    if(S.data&&!force){render();return;}
    S.loading=true;S.error=null;render();
    fetch(_scenarioIUrl(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({titleSlug:cfg.titleSlug})})
    .then(function(res){if(!res.ok)throw new Error('Scenario I returned HTTP '+res.status);return res.text();})
    .then(function(txt){
      var t=(txt||'').trim();
      if(t===''||/^accepted$/i.test(t))throw new Error('Reader returned "'+(t||'empty')+'" instead of JSON — check TA_CONFIG.scenarioI / hook 2718766.');
      var data; try{data=JSON.parse(t);}catch(e){throw new Error('Reader response not valid JSON: '+t.slice(0,80));}
      if(!data||data.ok!==true)throw new Error('Scenario I response missing ok=true');
      S.data=data; S.tenantId=(data.tenant&&data.tenant.titleAdminId)||null; S.lastFetchAt=Date.now(); S.loading=false;
      var present={}; filterByTenant(mergeMedia(data),S.tenantId).forEach(function(m){present[m.id]=true;});
      Object.keys(S.selected).forEach(function(id){if(!present[id])delete S.selected[id];});
      render();
    })
    .catch(function(err){if(DEBUG)console.error('[Intake] fetch error:',err);S.loading=false;S.error=err.message||'Network error';render();});
  }

  /* ── bulk archive / restore (Scenario K) ── */
  function bulkStatusWrite(mode){
    var ids=selIds(); if(!ids.length||S.busy)return;
    S.busy=true; renderAnchor();
    var cfg=_cfg(),w=cfg.wfColl||{};
    var payload={mode:mode,mediaIds:ids,titleSlug:cfg.titleSlug,tenantId:S.tenantId,mediaCollId:w.media||''};
    fetch(_scenarioKUrl(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(res){if(!res.ok)throw new Error('Scenario K HTTP '+res.status);return res.text().then(function(t){if(!t)return{ok:true};try{return JSON.parse(t);}catch(e){return{ok:true,_raw:t};}});})
    .then(function(data){
      if(data&&data.ok===false)throw new Error(data.error||'Scenario K reported failure');
      toast((mode==='restore'?'Restored ':'Archived ')+ids.length+' item'+(ids.length===1?'':'s')+(mode==='restore'?' — back to Awaiting.':'.'),'success');
      clearSel(); S.busy=false; fetchAndRender(true);
    })
    .catch(function(err){if(DEBUG)console.error('[Intake] bulk '+mode+':',err);S.busy=false;toast('Failed: '+(err.message||'network'),'error');renderAnchor();});
  }

  /* ── ATTACH (Scenario K mode:attach) — faithful port of v1.2.1 doAttachSave ── */
  function doAttachSave(force){
    var c=S.cascade; if(!c||c.mode!=='attach')return;
    var cfg=_cfg(),url=_scenarioKUrl();
    if(!c.type||!c.assetId){flashStatus('Pick an asset before saving.','error');return;}
    var mediaIds=selIds(); if(!mediaIds.length){flashStatus('No files selected.','error');return;}
    var w=cfg.wfColl||{},assetCollId=getAssetCollId(c.type),mediaCollId=w.media;
    if(!assetCollId||!mediaCollId){flashStatus('Config error: TA_CONFIG.wfColl incomplete (need articles, ads, events, realEstate, media).','error');return;}
    var payload={
      mode:'attach', assetType:c.type, assetId:c.assetId, assetCollId:assetCollId,
      mediaIds:mediaIds, mediaCollId:mediaCollId, tenantId:S.tenantId, titleSlug:cfg.titleSlug||null,
      mediaStatusAttached:_mediaStatusHash('attached'), forceReplace:force===true
    };
    // Article SRF collision preflight (MRF types can't collide).
    if(c.type==='article'&&force!==true){
      var collisions=detectArticleCollisions(mediaIds,c.assetId);
      if(collisions.length>0){S.replaceModal={collisions:collisions,payload:payload};renderAnchor();return;}
    }
    S.busy=true; flashStatus('Saving…','saving'); renderAnchor();
    fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(res){if(!res.ok)throw new Error('Scenario K HTTP '+res.status);return res.text().then(function(t){if(!t)return{ok:true};try{return JSON.parse(t);}catch(e){return{ok:true,_raw:t};}});})
    .then(function(data){
      if(data&&data.ok===false)throw new Error(data.error||data.message||'Scenario K reported failure');
      toast('Attached '+mediaIds.length+' file'+(mediaIds.length===1?'':'s')+' to "'+(c.assetName||'asset')+'".','success');
      clearSel(); S.replaceModal=null; S.busy=false; fetchAndRender(true);
    })
    .catch(function(err){if(DEBUG)console.error('[Intake] attach:',err);S.busy=false;flashStatus('Failed: '+(err.message||'network'),'error');renderAnchor();});
  }
  function detectArticleCollisions(mediaIds,newAssetId){
    var out=[]; if(!S.data||!mediaIds.length)return out;
    var all=mergeMedia(S.data),byId={}; all.forEach(function(m){byId[m.id]=m;});
    var lookup=buildAssetLookup(S.data);
    mediaIds.forEach(function(mid){
      var m=byId[mid]; if(!m)return; var fd=m.fieldData||{},ex=fd.article;
      if(!ex||ex===newAssetId)return;
      var name=(lookup.articles[ex])?assetDisplayName(lookup.articles[ex]):null;
      out.push({mediaId:mid,mediaFilename:(fd['original-filename']||fd.name||mid),existingAssetId:ex,existingAssetName:name,skip:false});
    });
    return out;
  }

  /* ── CREATE (InbxASF) — faithful port of v1.2.1 ── */
  function doCreateLaunch(){
    var c=S.cascade; if(!c||c.mode!=='create'||!c.type)return;
    var mediaIds=selIds(); if(!mediaIds.length){flashStatus('No files selected.','error');return;}
    if(!window.InbxASF||typeof window.InbxASF.open!=='function'){flashStatus('Asset Form not loaded on this page. Refresh and try again.','error');return;}
    S.busy=true; flashStatus('Opening Asset Form…','saving'); renderAnchor();
    try{
      window.InbxASF.open({mode:'create',assetType:c.type,prefilledMediaIds:mediaIds,tenantId:S.tenantId});
      setTimeout(function(){clearSel();S.busy=false;render();},400);  // ASF takes over; clean the surface
    }catch(err){if(DEBUG)console.error('[Intake] create:',err);S.busy=false;flashStatus('Could not open Asset Form: '+(err.message||'unknown'),'error');renderAnchor();}
  }

  /* ── toast + cascade status ── */
  function toast(msg,kind){var el=document.getElementById('intk-toast');if(!el)return;el.className='intk-toast intk-toast--'+(kind||'info');el.textContent=msg;el.style.display='block';clearTimeout(toast._t);toast._t=setTimeout(function(){el.style.display='none';},2800);}
  function flashStatus(msg,mood){var el=document.querySelector('[data-intk-cascade-status]');if(el){el.textContent=msg;el.className='intk-cascade-status intk-cascade-status--'+(mood||'info');}}

  /* ── render ── */
  function host(){return document.getElementById('intk-root');}
  function render(){
    var h=host(); if(!h)return;
    if(S.loading&&!S.data){h.innerHTML='<div class="intk-state intk-state--loading">Loading intake…</div>';return;}
    if(S.error&&!S.data){h.innerHTML='<div class="intk-state intk-state--error">'+escHtml(S.error)+'</div>';return;}
    if(!S.data){h.innerHTML='<div class="intk-state">No data yet.</div>';return;}
    var media=filterByTenant(mergeMedia(S.data),S.tenantId),bundles=groupByBundle(media),loose=findLoose(media),lookup=buildAssetLookup(S.data);
    var validL2=L2_DEFS[S.l1].map(function(d){return d[0];}); if(validL2.indexOf(S.l2)===-1)S.l2=validL2[0];
    h.innerHTML=
      '<div class="intk-wrap">'+
        renderL1()+
        renderL2(bundles,loose,lookup)+
        '<div class="intk-list">'+(S.l1==='bundles'?renderBundles(bundles,lookup):renderLoose(loose,lookup))+'</div>'+
        '<div class="intk-toast" id="intk-toast" style="display:none"></div>'+
        '<div id="intk-anchor"></div>'+
      '</div>';
    renderAnchor();
    wireOnce();
  }
  function renderL1(){
    return '<div class="intk-l1">'+
      '<button class="intk-l1-tab'+(S.l1==='bundles'?' is-active':'')+'" data-l1="bundles">Bundles</button>'+
      '<button class="intk-l1-tab'+(S.l1==='loose'?' is-active':'')+'" data-l1="loose">Loose files</button>'+
      '<button class="intk-refresh ix-btn ix-btn--ghost ix-btn--icon'+(S.loading?' is-spinning':'')+'"'+(S.loading?' disabled':'')+' data-intk-refresh title="Refresh intake" aria-label="Refresh intake">↻</button>'+
    '</div>';
  }
  function renderL2(bundles,loose,lookup){
    var counts=(S.l1==='bundles')?bundleCounts(bundles,lookup):looseCounts(loose,lookup);
    var h='<div class="intk-l2">';
    L2_DEFS[S.l1].forEach(function(d){h+='<button class="intk-chip'+(S.l2===d[0]?' is-active':'')+'" data-l2="'+d[0]+'">'+escHtml(d[1])+'<span class="intk-chip-ct">'+(counts[d[0]]||0)+'</span></button>';});
    return h+'</div>';
  }
  function statusPill(s){var m={pending:['pending','Awaiting assignment'],partial:['partial','Partially assigned'],fully_assigned:['full','Fully assigned'],archived:['arch','Archived'],available:['pending','Awaiting use'],used:['full','Used']}[s]||['pending',s];return '<span class="intk-pill intk-pill--'+m[0]+'">'+escHtml(m[1])+'</span>';}
  function checkbox(ck,attr,val){return '<span class="intk-cb'+(ck?' is-checked':'')+'" '+attr+'="'+escAttr(val)+'" role="checkbox" aria-checked="'+(ck?'true':'false')+'" tabindex="0">'+(ck?'✓':'')+'</span>';}
  function renderBundles(bundles,lookup){var shown=bundles.filter(function(b){return computeBundleStatus(b,lookup)===S.l2;});if(!shown.length)return emptyBucket();return shown.map(function(b){return renderBundleCard(b,lookup);}).join('');}
  function renderBundleCard(bundle,lookup){
    var status=computeBundleStatus(bundle,lookup),expanded=!!S.expanded[bundle.id],caret=expanded?'▾':'▸';
    var selectable=(status==='pending'||status==='partial'||S.l2!=='fully_assigned');
    // Allow selection in all buckets except where nothing actionable (fully-assigned bundles still selectable to archive).
    selectable=(status!=='archived'); // archived bundles → select to RESTORE handled in loose/items; keep header selectable for restore? Bundles restore via items.
    var allSel=bundle.items.length>0&&bundle.items.every(function(i){return isSel(i.id);});
    var head='<div class="intk-bhead" data-intk-toggle="'+escAttr(bundle.id)+'">'+
      (selectable?checkbox(allSel,'data-intk-ball',bundle.id):'<span class="intk-cb-spacer"></span>')+
      '<span class="intk-caret">'+caret+'</span>'+
      '<span class="intk-bname">'+escHtml(bundle.label)+'</span>'+
      '<span class="intk-bcount">'+bundle.items.length+' '+(bundle.items.length===1?'file':'files')+'</span>'+
      statusPill(status)+'</div>';
    var body=expanded?'<div class="intk-bbody">'+bundle.items.map(function(i){return renderItemRow(i,lookup,selectable);}).join('')+'</div>':'';
    return '<div class="intk-bundle intk-bundle--'+status+(expanded?' is-expanded':'')+'" data-intk-bundle="'+escAttr(bundle.id)+'">'+head+body+'</div>';
  }
  function renderItemRow(item,lookup,selectable){
    var on=isSel(item.id),refs=getMediaAssetRefs(item,lookup),st=readMediaStatus(item),fn=fileName(item);
    var meta;
    if(st==='archived')meta='<span class="intk-tag intk-tag--arch">archived</span>';
    else if(refs.length)meta='<span class="intk-tag">→ '+escHtml(refs[0].name)+(refs.length>1?' +'+(refs.length-1):'')+'</span>';
    else meta='<span class="intk-tag intk-tag--orphan">unassigned</span>';
    return '<div class="intk-row'+(on?' is-selected':'')+'">'+
      (selectable?checkbox(on,'data-intk-item',item.id):'<span class="intk-cb-spacer"></span>')+
      '<span class="intk-meta"><span class="intk-fn">'+escHtml(fn)+'</span><span class="intk-id">'+escHtml(item.id)+'</span></span>'+
      meta+'</div>';
  }
  function renderLoose(loose,lookup){
    var shown=loose.filter(function(f){return looseBucket(f,lookup)===S.l2;});
    if(!shown.length)return emptyBucket();
    return shown.map(function(f){
      var on=isSel(f.id),bucket=looseBucket(f,lookup),fn=fileName(f);
      return '<div class="intk-loose-card"><div class="intk-row'+(on?' is-selected':'')+'">'+
        checkbox(on,'data-intk-item',f.id)+
        '<span class="intk-meta"><span class="intk-fn">'+escHtml(fn)+'</span><span class="intk-id">'+escHtml(f.id)+'</span></span>'+
        statusPill(bucket)+'</div></div>';
    }).join('');
  }
  function emptyBucket(){return '<div class="intk-empty">Nothing here — this bucket is clear.</div>';}

  /* ── ANCHOR: action bar | cascade | replace-modal (the v1.0.1 bug fix) ── */
  function renderAnchor(){
    var a=document.getElementById('intk-anchor'); if(!a)return;
    if(selectedCount()===0&&!S.replaceModal){a.innerHTML='';document.body.classList.remove('intk-has-sel');return;}
    document.body.classList.add('intk-has-sel');
    if(S.replaceModal){a.innerHTML=renderReplaceModal();return;}
    a.innerHTML=S.cascade?renderCascadePanel():renderActionBar();
  }
  function renderActionBar(){
    var n=selectedCount(),inArchived=(S.l2==='archived');
    var actions;
    if(inArchived){
      actions='<button class="intk-act intk-act--restore" data-intk-restore'+(S.busy?' disabled':'')+'>'+(S.busy?'Restoring…':'Restore '+n)+'</button>';
    }else{
      actions=
        '<button class="intk-act intk-act--attach" data-intk-cascade="attach"'+(S.busy?' disabled':'')+'>Attach to existing</button>'+
        '<button class="intk-act intk-act--create" data-intk-cascade="create"'+(S.busy?' disabled':'')+'>Create new</button>'+
        '<button class="intk-act intk-act--archive" data-intk-archive'+(S.busy?' disabled':'')+'>'+(S.busy?'Archiving…':'Archive '+n)+'</button>';
    }
    return '<div class="intk-bar">'+
      '<span class="intk-bar-count"><strong>'+n+'</strong> selected</span>'+
      '<button class="intk-bar-cancel" data-intk-cancel>Cancel</button>'+
      '<span class="intk-bar-spacer"></span>'+actions+'</div>';
  }
  function renderCascadePanel(){
    var c=S.cascade;
    return '<div class="intk-cascade intk-cascade--'+c.mode+'">'+
      '<div class="intk-cascade-head">'+
        '<span class="intk-cascade-mode intk-cascade-mode--'+c.mode+'">'+(c.mode==='attach'?'Attach to existing':'Create new')+'</span>'+
        '<span class="intk-cascade-count">'+selectedCount()+' file'+(selectedCount()===1?'':'s')+'</span>'+
        '<button class="intk-bar-cancel" data-intk-switch="'+(c.mode==='attach'?'create':'attach')+'">'+(c.mode==='attach'?'Switch to Create new':'Switch to Attach existing')+'</button>'+
      '</div>'+
      '<div class="intk-cascade-body">'+renderStep1(c)+renderStep2(c)+'</div>'+
      renderCascadeFooter(c)+
    '</div>';
  }
  function renderStep1(c){
    var chips=['article','ad','event','re'].map(function(t){return '<button class="intk-chip2'+(c.type===t?' is-set':'')+'" data-intk-type="'+t+'">'+escHtml(TYPE_LABELS[t])+'</button>';}).join('');
    return '<div class="intk-cstep'+(c.type?' is-set':' is-active')+'">'+
      '<div class="intk-cstep-head"><span class="intk-cstep-num">1</span><span class="intk-cstep-label">Asset Type</span>'+
      (c.type?'<button class="intk-bar-cancel" data-intk-revert="1">Change</button>':'')+'</div>'+
      '<div class="intk-chip2-group">'+chips+'</div></div>';
  }
  function renderStep2(c){
    if(!c.type)return '<div class="intk-cstep intk-cstep--inactive"><div class="intk-cstep-head"><span class="intk-cstep-num is-pending">2</span><span class="intk-cstep-label is-muted">'+(c.mode==='attach'?'Pick the existing asset':'Confirm — opens the Asset Form')+'</span></div></div>';
    if(c.mode==='attach'){
      var label=TYPE_LABELS[c.type]||c.type;
      return '<div class="intk-cstep is-active'+(c.assetId?' is-set':'')+'">'+
        '<div class="intk-cstep-head"><span class="intk-cstep-num">2</span><span class="intk-cstep-label">Pick the existing '+escHtml(label)+'</span>'+
        (c.assetId?'<button class="intk-bar-cancel" data-intk-revert="2">Change</button>':'')+'</div>'+
        '<div class="intk-picker" data-intk-picker>'+
          '<input type="text" class="intk-picker-input'+(c.assetId?' is-set':'')+'" value="'+escAttr(c.assetName||'')+'" placeholder="Search '+escAttr(label.toLowerCase())+'s by name…" autocomplete="off" data-intk-picker-input>'+
          '<div class="intk-picker-list" hidden data-intk-picker-list></div>'+
        '</div></div>';
    }
    var n=selectedCount();
    return '<div class="intk-cstep is-active is-set"><div class="intk-cstep-head"><span class="intk-cstep-num">2</span><span class="intk-cstep-label">Confirm — opens the Asset Form</span></div>'+
      '<div class="intk-create-info">On <strong>Save</strong>, the <strong>Asset Form</strong> opens with the '+n+' selected file'+(n===1?'':'s')+' pre-attached. Fill name, summary, and other fields there.</div></div>';
  }
  function renderCascadeFooter(c){
    var n=selectedCount(),disabled,label,status;
    if(c.mode==='attach'){
      disabled=!(c.type&&c.assetId); label='Save';
      status=disabled?(c.type?'Pick an existing '+(TYPE_LABELS[c.type]||c.type)+' to enable Save':'Choose an Asset Type, then pick an existing asset'):'Ready — will attach '+n+' file'+(n===1?'':'s')+' to "'+escHtml(c.assetName||'?')+'"';
    }else{
      disabled=!c.type; label='Continue to Asset Form →';
      status=disabled?'Choose an Asset Type to continue':'Ready — will open '+(TYPE_LABELS[c.type]||c.type)+' submission form';
    }
    return '<div class="intk-cascade-foot">'+
      '<div class="intk-cascade-foot-left"><button class="intk-bar-cancel" data-intk-cascade-cancel>Cancel</button>'+
      '<span class="intk-cascade-status" data-intk-cascade-status>'+escHtml(status)+'</span></div>'+
      '<button class="intk-act intk-act--archive" data-intk-cascade-save'+((disabled||S.busy)?' disabled':'')+'>'+escHtml(label)+'</button></div>';
  }
  function renderPickerListSurgically(query){
    if(!S.cascade||S.cascade.mode!=='attach'||!S.cascade.type)return;
    var listEl=document.querySelector('[data-intk-picker-list]'); if(!listEl)return;
    var assets=filterAssets(getAssetsForType(S.cascade.type),query);
    listEl.innerHTML=assets.length
      ? assets.map(function(a){return '<button class="intk-picker-option" data-intk-pick data-asset-id="'+escAttr(a.id)+'" data-asset-name="'+escAttr(a.name||'')+'">'+escHtml(a.name||a.id)+(a.meta?'<span class="intk-picker-meta">'+escHtml(a.meta)+'</span>':'')+'</button>';}).join('')
      : '<div class="intk-picker-empty">No matches for "'+escHtml(query||'')+'"</div>';
    listEl.hidden=false;
  }
  function renderReplaceModal(){
    var m=S.replaceModal,cs=m.collisions,multi=cs.length>1;
    var rows=cs.map(function(col,i){
      return '<div class="intk-replace-card'+(col.skip?' is-skipped':'')+'">'+
        (multi?'<input type="checkbox" class="intk-replace-skip" data-intk-skip="'+i+'"'+(col.skip?'':' checked')+'>':'')+
        '<span class="intk-replace-text">'+escHtml(col.mediaFilename)+' → '+escHtml(col.existingAssetName||'another article')+'</span></div>';
    }).join('');
    return '<div class="intk-replace-bg"><div class="intk-replace-modal">'+
      '<div class="intk-replace-head"><strong>'+(multi?cs.length+' files are already linked to other articles':'File already linked to another article')+'</strong></div>'+
      '<div class="intk-replace-body"><p>'+(multi?'Replacing will detach them and attach here. Uncheck any to leave alone.':'Replacing will detach it from there and attach it here.')+'</p>'+rows+'</div>'+
      '<div class="intk-replace-foot"><button class="intk-bar-cancel" data-intk-replace-cancel>Cancel</button>'+
      '<button class="intk-act intk-act--archive" data-intk-replace-confirm>Replace &amp; attach</button></div>'+
    '</div></div>';
  }

  /* ── wiring (delegated once on document) ── */
  var _wired=false;
  function wireOnce(){
    if(_wired)return; _wired=true;
    document.addEventListener('click',function(e){
      var t=e.target;
      // subtab / refresh / select (inside #intk-root)
      var l1=t.closest('[data-l1]'),l2=t.closest('[data-l2]'),refresh=t.closest('[data-intk-refresh]');
      var item=t.closest('[data-intk-item]'),ball=t.closest('[data-intk-ball]'),toggle=t.closest('[data-intk-toggle]');
      // anchor actions
      var cancel=t.closest('[data-intk-cancel]'),archive=t.closest('[data-intk-archive]'),restore=t.closest('[data-intk-restore]');
      var openC=t.closest('[data-intk-cascade]'),switchC=t.closest('[data-intk-switch]');
      var typeChip=t.closest('[data-intk-type]'),revert=t.closest('[data-intk-revert]');
      var pick=t.closest('[data-intk-pick]'),cascCancel=t.closest('[data-intk-cascade-cancel]'),cascSave=t.closest('[data-intk-cascade-save]');
      var repCancel=t.closest('[data-intk-replace-cancel]'),repConfirm=t.closest('[data-intk-replace-confirm]'),skip=t.closest('[data-intk-skip]');

      if(refresh){fetchAndRender(true);return;}
      if(l1){S.l1=l1.getAttribute('data-l1');S.l2=L2_DEFS[S.l1][0][0];clearSel();render();return;}
      if(l2){S.l2=l2.getAttribute('data-l2');clearSel();render();return;}
      if(item){toggleSel(item.getAttribute('data-intk-item'));render();return;}
      if(ball){var bid=ball.getAttribute('data-intk-ball');var b=currentBundles().filter(function(x){return x.id===bid;})[0];if(b){var all=b.items.every(function(i){return isSel(i.id);});b.items.forEach(function(i){if(all)delete S.selected[i.id];else S.selected[i.id]=true;});if(selectedCount()===0)S.cascade=null;}render();return;}

      if(cancel){clearSel();render();return;}
      if(archive){bulkStatusWrite('archive');return;}
      if(restore){bulkStatusWrite('restore');return;}
      if(openC){S.cascade={mode:openC.getAttribute('data-intk-cascade'),type:null,assetId:null,assetName:null};renderAnchor();return;}
      if(switchC){S.cascade={mode:switchC.getAttribute('data-intk-switch'),type:null,assetId:null,assetName:null};renderAnchor();return;}
      if(typeChip){if(S.cascade){S.cascade.type=typeChip.getAttribute('data-intk-type');S.cascade.assetId=null;S.cascade.assetName=null;}renderAnchor();return;}
      if(revert){var step=parseInt(revert.getAttribute('data-intk-revert'),10);if(S.cascade){if(step===1){S.cascade.type=null;S.cascade.assetId=null;S.cascade.assetName=null;}else if(step===2){S.cascade.assetId=null;S.cascade.assetName=null;}}renderAnchor();return;}
      if(pick){if(S.cascade){S.cascade.assetId=pick.getAttribute('data-asset-id');S.cascade.assetName=pick.getAttribute('data-asset-name');}renderAnchor();return;}
      if(cascCancel){S.cascade=null;renderAnchor();return;}
      if(cascSave){if(S.cascade&&S.cascade.mode==='attach')doAttachSave(false);else doCreateLaunch();return;}
      if(repCancel){S.replaceModal=null;renderAnchor();return;}
      if(repConfirm){if(S.replaceModal){var p=S.replaceModal.payload;var keep=S.replaceModal.collisions.filter(function(c){return !c.skip;}).map(function(c){return c.mediaId;});
        // mediaIds to attach = original payload minus skipped collisions
        var skipSet={};S.replaceModal.collisions.forEach(function(c){if(c.skip)skipSet[c.mediaId]=true;});
        p.mediaIds=p.mediaIds.filter(function(id){return !skipSet[id];});p.forceReplace=true;
        S.replaceModal=null;S.busy=true;renderAnchor();
        fetch(_scenarioKUrl(),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)})
        .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.text();})
        .then(function(){toast('Attached.','success');clearSel();S.busy=false;fetchAndRender(true);})
        .catch(function(err){S.busy=false;toast('Failed: '+(err.message||'network'),'error');renderAnchor();});}
        return;}
      if(skip){var idx=parseInt(skip.getAttribute('data-intk-skip'),10);if(S.replaceModal&&S.replaceModal.collisions[idx])S.replaceModal.collisions[idx].skip=!skip.checked;return;}

      // click outside picker → hide list
      if(S.cascade&&S.cascade.mode==='attach'&&!t.closest('[data-intk-picker]')){var lst=document.querySelector('[data-intk-picker-list]');if(lst&&!lst.hidden)lst.hidden=true;}

      // bundle toggle (after select guards)
      if(toggle&&!item&&!ball){S.expanded[toggle.getAttribute('data-intk-toggle')]=!S.expanded[toggle.getAttribute('data-intk-toggle')];render();return;}
    });
    document.addEventListener('input',function(e){if(e.target&&e.target.matches&&e.target.matches('[data-intk-picker-input]'))renderPickerListSurgically(e.target.value);});
    document.addEventListener('focusin',function(e){if(e.target&&e.target.matches&&e.target.matches('[data-intk-picker-input]'))renderPickerListSurgically(e.target.value);});
  }
  function currentBundles(){return groupByBundle(filterByTenant(mergeMedia(S.data),S.tenantId));}

  /* ── mount ── */
  function mount(){
    var panel=document.querySelector('[data-std-panel-body="input"]'); if(!panel)return false;
    if(!panel.querySelector('#intk-root')){var r=document.createElement('div');r.id='intk-root';r.className='intk-root';panel.appendChild(r);}
    if(!S.mounted){S.mounted=true;if(window.console&&console.log)console.log('[Intake] v'+FILE_VERSION+' mounted into Studio Intake panel — fetching from Scenario I');fetchAndRender(false);}
    return true;
  }
  function watch(){var n=0,t=setInterval(function(){n++;if(mount()){clearInterval(t);return;}if(n>40)clearInterval(t);},250);}
  function boot(){
    watch();
    document.addEventListener('click',function(e){var tab=e.target.closest('[data-std-panel="input"]');if(tab)setTimeout(function(){if(mount()&&!S.data&&!S.loading)fetchAndRender(false);},60);});
    if(window.console&&console.log)console.log('[Intake] v'+FILE_VERSION+' loaded — window.InbxIntake available; owns Studio Intake panel (subtabs + archive/restore + attach/create)');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();

  window.InbxIntake={version:FILE_VERSION,refresh:function(){fetchAndRender(true);},_state:function(){return S;}};
})();
