/* ============================================================
   ipp-picker-v1.4.js — Picker view (Scope A + greeting GR-block write)
   CHANGELOG
     v1.4 (from v1.3): real-time char counters on the 3 greeting fields,
       matching the ASF counter color logic (near at >=85% of cap). HARD
       BLOCK enforcement: maxlength = real cap (30/300/140) in markup, so
       input physically cannot exceed — no "over" state is reachable, only
       "near". AI Generate (still stubbed) gains a reject-and-regenerate
       hook: grAiAccept(candidate) rejects any field over its cap so the
       operator never sees an over-limit option. (Counter already wired in
       v1.3 grSetCount; v1.4 aligns the threshold to ASF's 85% near-state
       and adds the AI gate hook.)
     v1.3 (from v1.2): CORRECTION + the real greeting build.
       v1.2 wrote a 2-field greeting via op='gr-save' to PP_WEBHOOKS.gr with
       a usesLegacy flag (the abandoned flat-field path). That whole approach
       is replaced. Greeting is now a GR BLOCK ROW in NL-BLOCKS at
       stage=planning, written through the greenfield PP_WEBHOOKS.ipp scenario.
       - THREE fields: Title (30) → block-greeting-title,
         Paragraph (300) → block-greeting-paragraph,
         Super-short (140) → block-greeting-supershort.
       - Write contract: op='block-save', blockType='gr', stage='planning',
         pubplanId, titleAdminId, position, nlbId (upsert switch), + 3 fields.
         Empty nlbId → create row; present → update row. Scenario returns
         { ok, nlbId }; we store it so subsequent saves update in place.
       - Reads the existing GR planning row (if any) from the page's hidden
         NL-BLOCKS list to hydrate the inputs + capture nlbId.
       - Edit-state UX UNCHANGED in spirit: persistent values, gold
         ix-picker-input--changed dirty border, per-card ix-revert Cancel,
         savebar "N changed → N writes". Char counters on all three.
       - No usesLegacy. No gr-save. No writes to NEWSLETTER (no Newsletter
         exists at planning; promote carries this row's content to the
         NEWSLETTER flat singletons later — K-6).
     v1.2: (superseded) 2-field gr-save flat-field path.
     v1.1: CC state classes ipp-on / ipp-locked (Webflow .locked collision).
     v1.0: initial Scope A.

   IPP → ipp webhook payload (one POST per save):
     op='block-save', blockType='gr', stage='planning',
     pubplanId, titleAdminId, position='1', nlbId (or empty),
     grTitle, grParagraph, grSupershort
   ============================================================ */
(function () {
  'use strict';
  if (!window.IPP) { console.error('[ipp-picker] shell not loaded'); return; }
  var IPP = window.IPP;

  var CATS = [
    { key:'greeting', field:'include-greeting', sec:'ippCatGreeting' },
    { key:'articles', field:'include-articles', sec:'ippCatArticles' },
    { key:'ads',      field:'include-ads',      sec:'ippCatAds' },
    { key:'lbp',      field:'include-lbp',      sec:'ippCatLBP' },
    { key:'txa',      field:'include-txa',      sec:'ippCatTXA' },
    { key:'re',       field:'include-re',       sec:'ippCatRE' },
    { key:'events',   field:'include-events',   sec:'ippCatEvents' }
  ];
  function cat(k){ for (var i=0;i<CATS.length;i++) if (CATS[i].key===k) return CATS[i]; return null; }
  function ccState(){ return document.querySelector('[data-ipp-cc-state]'); }
  function showSection(id, on){ var el=document.getElementById(id); if(el){ if(on) el.removeAttribute('hidden'); else el.setAttribute('hidden',''); } }
  function labelOf(item){ var l=item.querySelector('.ipp-cc-label'); return l?l.textContent.trim():item.getAttribute('data-section'); }

  /* ──────────────────────────────────────────────────────────
     CC (unchanged from v1.1/v1.2)
     ────────────────────────────────────────────────────────── */
  function hydrate(){
    var st=ccState();
    IPP.qa('.ipp-cc-item').forEach(function(item){
      var key=item.getAttribute('data-section'); var c=cat(key); if(!c) return;
      var on,has;
      if(st){ on=st.getAttribute('data-cc-'+key)==='true'; has=st.getAttribute('data-cc-'+key+'-has-content')==='true'; }
      else  { on=item.classList.contains('ipp-on'); has=item.classList.contains('ipp-locked'); }
      item.classList.toggle('ipp-on',on); item.classList.toggle('ipp-locked',has); showSection(c.sec,on);
    });
  }
  function wireCC(){
    IPP.qa('.ipp-cc-item').forEach(function(item){
      if(item.dataset.wired) return; item.dataset.wired='1';
      item.addEventListener('click',function(){
        var key=item.getAttribute('data-section'); var c=cat(key); if(!c) return;
        if(item.classList.contains('ipp-locked')){ IPP.toast('Cannot turn off <b>'+labelOf(item)+'</b> — it has content. Remove items first.',true); return; }
        var from=item.classList.contains('ipp-on'); var to=!from;
        item.classList.toggle('ipp-on',to); showSection(c.sec,to); saveCC(item,c,to,from);
      });
    });
  }
  function saveCC(item,c,value,from){
    var t=IPP.tenant();
    var revert=function(){ item.classList.toggle('ipp-on',from); showSection(c.sec,from); item.classList.remove('saving'); IPP.toast('Save failed — reverted',true); };
    if(!t.pubplanId || !(window.PP_WEBHOOKS && window.PP_WEBHOOKS.cc)){
      item.classList.remove('saving'); item.classList.add('just-saved'); setTimeout(function(){item.classList.remove('just-saved');},1100); return;
    }
    item.classList.add('saving');
    IPP.post('cc',{op:'cc-save',pubplanId:t.pubplanId,titleAdminId:t.titleAdminId,field:c.field,value:String(value)})
      .then(function(){ item.classList.remove('saving'); item.classList.add('just-saved'); setTimeout(function(){item.classList.remove('just-saved');},1100); })
      .catch(function(err){ console.error('[ipp-picker] cc-save',err); revert(); });
  }

  /* ──────────────────────────────────────────────────────────
     GREETING — GR block row (NL-BLOCKS, stage=planning) via ipp webhook

     draft/original stores per field. Widget reflects live input; original =
     loaded. Dirty when value !== original → gold .ix-picker-input--changed.
     Save upserts one NL-BLOCKS row: create (no nlbId) or update (nlbId).
     ────────────────────────────────────────────────────────── */

  var GR_FIELDS = [
    { name:'title',      id:'ipp_greetingTitle',      payload:'grTitle',      count:'ipp_greetTitleCount', max:30  },
    { name:'paragraph',  id:'ipp_greetingParagraph',  payload:'grParagraph',  count:'ipp_greetParaCount',  max:300 },
    { name:'supershort', id:'ipp_greetingSupershort', payload:'grSupershort', count:'ipp_greetSSCount',    max:140 }
  ];
  var GR_BLOCK_POSITION = '1';     // greeting is first in the sequence (single-block write for now)
  var grOriginal = {};             // { title, paragraph, supershort } as loaded
  var grNlbId    = '';             // existing GR row id; empty = none yet (create on save)
  var grWired    = false;

  function grField(name){ for(var i=0;i<GR_FIELDS.length;i++) if(GR_FIELDS[i].name===name) return GR_FIELDS[i]; return null; }
  function grInput(name){ var f=grField(name); return f?document.getElementById(f.id):null; }
  function grCard(){ return document.getElementById('ippCatGreeting'); }

  // Read the existing GR planning row off the page's hidden NL-BLOCKS list.
  // Convention (mirrors §15 hidden-list pattern): rows carry data-* on a
  // wrapper. We look for a greeting row scoped to this PubPlan.
  // Falls back gracefully to empty (create-mode) if no list / no row.
  function grReadExisting(){
    var t=IPP.tenant();
    var rows=IPP.qa('[data-nlblocks-wrapper] [data-nlb-id]');
    for(var i=0;i<rows.length;i++){
      var r=rows[i];
      var type=(r.getAttribute('data-nlb-type')||'').toLowerCase();
      var stage=(r.getAttribute('data-nlb-stage')||'').toLowerCase();
      var pp=r.getAttribute('data-nlb-pubplan')||'';
      if(type==='gr' && (stage==='planning'||stage==='') && (!pp || pp===t.pubplanId)){
        return {
          nlbId:      r.getAttribute('data-nlb-id')||'',
          title:      r.getAttribute('data-nlb-gr-title')||'',
          paragraph:  r.getAttribute('data-nlb-gr-paragraph')||'',
          supershort: r.getAttribute('data-nlb-gr-supershort')||''
        };
      }
    }
    return null;
  }

  function grSetCount(name){
    var f=grField(name); var el=grInput(name); if(!f||!el) return;
    var c=document.getElementById(f.count); if(!c) return;
    var n=(el.value||'').length; c.textContent=String(n);
    var wrap=c.parentNode;
    // HARD BLOCK: maxlength caps input at f.max, so n can never exceed it.
    // Only the ASF-style "near" state is reachable (>=85% of cap). "at"
    // flags the exact-cap moment so the operator sees they have hit it.
    if(wrap){
      wrap.classList.toggle('near', n>=Math.floor(f.max*0.85) && n<f.max);
      wrap.classList.toggle('at',   n>=f.max);
    }
  }

  // AI Generate gate (AI button still stubbed). When AI returns candidate
  // text, reject any field over its cap so an over-limit option is NEVER
  // shown to the operator. Returns true if the candidate fits (caller may
  // apply it), false if it must be regenerated.
  function grAiCandidateFits(cand){
    cand=cand||{};
    var ok=true;
    GR_FIELDS.forEach(function(f){
      var v=cand[f.name]; if(v==null) return;
      if(String(v).length>f.max) ok=false;
    });
    return ok;
  }
  function grAiApply(cand){
    if(!grAiCandidateFits(cand)) return false;   // reject → caller regenerates
    GR_FIELDS.forEach(function(f){ var el=grInput(f.name); if(el && cand[f.name]!=null) el.value=String(cand[f.name]); });
    grPaintAll();
    return true;
  }
  function grIsDirty(name){ var el=grInput(name); if(!el) return false; return el.value !== (grOriginal[name]==null?'':grOriginal[name]); }
  function grDirtyCount(){ var n=0; GR_FIELDS.forEach(function(f){ if(grIsDirty(f.name)) n++; }); return n; }
  function grPaintField(name){ var el=grInput(name); if(!el) return; el.classList.toggle('ix-picker-input--changed', grIsDirty(name)); }
  function grPaintAll(){ GR_FIELDS.forEach(function(f){ grPaintField(f.name); grSetCount(f.name); }); grReflectBar(); }

  function grReflectBar(){
    var n=grDirtyCount();
    var stat=IPP.q('.ipp-savebar .stat');
    if(stat) stat.textContent = n===0 ? 'No unsaved changes'
                                       : (n+' field'+(n===1?'':'s')+' changed → '+n+' write'+(n===1?'':'s')+' on Save');
    var save=document.getElementById('ipp_grSave');   if(save)   save.disabled=(n===0);
    var cancel=document.getElementById('ipp_grCancel'); if(cancel) cancel.hidden=(n===0);
    var bar=IPP.q('.ipp-savebar'); if(bar) bar.classList.toggle('ipp-dirty', n>0);
  }

  function grSnapshotOriginal(){ GR_FIELDS.forEach(function(f){ var el=grInput(f.name); grOriginal[f.name]= el?el.value:''; }); }

  function grRevert(){
    GR_FIELDS.forEach(function(f){ var el=grInput(f.name); if(!el) return; el.value=grOriginal[f.name]==null?'':grOriginal[f.name]; });
    grPaintAll(); IPP.toast('Greeting reverted');
  }

  function grSave(){
    if(grDirtyCount()===0) return;
    var t=IPP.tenant();
    var save=document.getElementById('ipp_grSave');
    var payload={
      op:'block-save', blockType:'gr', stage:'planning',
      pubplanId:t.pubplanId, titleAdminId:t.titleAdminId,
      position:GR_BLOCK_POSITION, nlbId:grNlbId,
      grTitle:(grInput('title')||{}).value||'',
      grParagraph:(grInput('paragraph')||{}).value||'',
      grSupershort:(grInput('supershort')||{}).value||''
    };
    // No tenant / no ipp webhook → optimistic local commit (preview parity).
    if(!t.pubplanId || !(window.PP_WEBHOOKS && window.PP_WEBHOOKS.ipp)){
      grSnapshotOriginal(); grPaintAll(); IPP.toast('Greeting saved (local)'); return;
    }
    if(save){ save.disabled=true; save.textContent='Saving…'; }
    IPP.saving(true,'Saving greeting…');
    IPP.post('ipp',payload)
      .then(function(res){
        // no-cors → opaque response; we can't read nlbId back from an opaque
        // fetch. Strategy: if this was a CREATE (no prior nlbId), re-read the
        // hidden list after the row publishes to pick up the new id. If the
        // list isn't refreshed client-side, the id is captured on next page
        // hydrate. Either way the row is written.
        grSnapshotOriginal(); grPaintAll();
        IPP.saving(false); if(save) save.textContent='Save';
        IPP.toast('Greeting saved');
        // best-effort id capture for same-session subsequent updates:
        var found=grReadExisting(); if(found && found.nlbId) grNlbId=found.nlbId;
      })
      .catch(function(err){
        console.error('[ipp-picker] block-save (gr)',err);
        IPP.saving(false); if(save){ save.disabled=false; save.textContent='Save'; }
        IPP.toast('Save failed — your edits are kept',true);
        grReflectBar();
      });
  }

  function wireGreeting(){
    if(grWired) return;
    var card=grCard(); if(!card) return;
    grWired=true;
    // hydrate from existing GR row if present
    var ex=grReadExisting();
    if(ex){
      grNlbId=ex.nlbId||'';
      var ti=grInput('title'), pa=grInput('paragraph'), ss=grInput('supershort');
      if(ti) ti.value=ex.title; if(pa) pa.value=ex.paragraph; if(ss) ss.value=ex.supershort;
    }
    grSnapshotOriginal();
    GR_FIELDS.forEach(function(f){
      var el=grInput(f.name); if(!el) return;
      el.addEventListener('input',function(){ grPaintField(f.name); grSetCount(f.name); grReflectBar(); });
    });
    var save=document.getElementById('ipp_grSave');     if(save)   save.addEventListener('click',grSave);
    var cancel=document.getElementById('ipp_grCancel'); if(cancel) cancel.addEventListener('click',grRevert);
    grPaintAll();
  }

  /* ──────────────────────────────────────────────────────────
     STUBS (unchanged — other block assignment not yet built)
     ────────────────────────────────────────────────────────── */
  function wireStubs(){
    var canvas=IPP.q('.ipp-view[data-view="picker"] .ipp-canvas'); if(!canvas) return;
    canvas.addEventListener('click',function(e){
      var t=e.target.closest('.ipp-ctile, .ipp-splash-customer, .ipp-banner-customer, .ipp-lbp-customer, .ipp-re-address, .ipp-banner-add-bar, .ipp-lbp-add, .ipp-re-add, .ipp-ai-generate-btn, .ipp-del-btn');
      if(!t) return; e.stopPropagation();
      if(t.classList.contains('ipp-del-btn'))         { IPP.toast('Would remove this slot'); return; }
      if(t.classList.contains('ipp-ai-generate-btn')) { IPP.toast('Would generate greeting with AI'); return; }
      if(t.classList.contains('ipp-banner-add-bar')||t.classList.contains('ipp-lbp-add')||t.classList.contains('ipp-re-add')){ IPP.toast('Would add a slot'); return; }
      IPP.toast('Would open the picker to assign content');
    });
  }

  function mount(){
    var view=IPP.q('.ipp-view[data-view="picker"]'); if(!view) return;
    if(view.dataset.pickerMounted) return;
    var rail=IPP.q('.ipp-rail',view), canvas=IPP.q('.ipp-canvas',view);
    if(!rail||!canvas) return;
    view.dataset.pickerMounted='1';
    var ccCard=document.createElement('div'); ccCard.className='ipp-card ipp-cc-card';
    ccCard.innerHTML=window.IPP_PICKER_CC_MARKUP||''; rail.appendChild(ccCard);
    canvas.innerHTML=window.IPP_PICKER_CANVAS_MARKUP||'';
    hydrate(); wireCC(); wireGreeting(); wireStubs();
    console.info('[ipp-picker] mounted (v1.3 · greeting=GR-block)');
  }

  document.addEventListener('ipp:ready',mount);
  document.addEventListener('ipp:view',function(e){ if(e.detail&&e.detail.view==='picker') mount(); });
  if(document.querySelector('[data-ipp-root]')) mount();

  window.IPP.picker={ mount:mount, hydrate:hydrate, CATS:CATS,
    greeting:{ dirtyCount:grDirtyCount, save:grSave, revert:grRevert, paint:grPaintAll, nlbId:function(){return grNlbId;},
               aiCandidateFits:grAiCandidateFits, aiApply:grAiApply } };
})();
