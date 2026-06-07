/* ============================================================
   ipp-picker-v1.2.js — Picker view (Scope A + greeting edit-state)
   CHANGELOG
     v1.2 (from v1.1):
       - NEW: greeting edit-state. Adopts the canonical ix-form-controls
         editing pattern (ix-picker-input--changed dirty border, ix-revert
         per-card Cancel) — conforms to canon, no fork. Greeting inputs now
         carry a draft-vs-original store: edits persist as the operator moves
         around; any field where draft !== original gets .ix-picker-input--changed
         (gold --ix-changed-border) so it is obvious at a glance which fields
         will be written on Save. Per-card "Cancel" (.ix-revert) reverts the
         greeting card to loaded values.
       - NEW: savebar now reports "N dirty → N field writes" and exposes a Save
         action. Save posts the greeting write through PP_WEBHOOKS.gr.
       - NEW: write path is gated by uses-legacy (a switch on PUBLICATION PLAN).
         While legacy: op='gr-save', writes greeting to the current PUBLICATION
         PLAN target via gr (the working path today). When uses-legacy flips OFF
         (post-MNA), the same gr scenario routes pubplanId → NEWSLETTER record
         (TD-233). IPP sends usesLegacy in the payload so the scenario branches;
         IPP does not change.
       - Greeting field map is the one open blocker for the NEWSLETTER branch:
         IPP Message → entry-paragraph-for-each-newsletter vs super-short-greeting
         (CONFIRM). The IPP-side payload keys here are stable regardless; only the
         Make scenario's NEWSLETTER field binding depends on that answer.
     v1.1 (from v1.0):
       - FIX: CC checkboxes rendered as 50x50 red boxes (Webflow global .locked).
         Namespaced CC state classes: on→ipp-on, locked→ipp-locked.
     v1.0: initial Scope A — CC live wiring + stubbed content clicks.

   PAYLOAD CONTRACT (gr-save) — mirrors cc-save / sequencer shape:
     {
       op:           'gr-save',
       pubplanId:    <PUBLICATION PLAN item id>,
       titleAdminId: <TITLE-ADMIN id>,
       usesLegacy:   'true' | 'false',   // routes scenario: PubPlan vs NEWSLETTER
       title:        <greeting title, ≤30>,
       message:      <greeting message, ≤140>
     }
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
     CC (unchanged from v1.1)
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
     GREETING EDIT-STATE  (new in v1.2)

     Two stores keyed by field name. The widget always reflects the
     live <input>/<textarea> value; "original" holds what was loaded.
     A field is dirty when value !== original. Dirty fields carry
     .ix-picker-input--changed (gold border). The savebar reports the
     dirty count. Per-card Cancel restores originals.
     ────────────────────────────────────────────────────────── */

  // field name → input id  (single source for the greeting field set)
  var GR_FIELDS = [
    { name:'title',   id:'ipp_greetingTitle' },
    { name:'message', id:'ipp_greetingMsg' }
  ];
  var grOriginal = {};   // { title:'…', message:'…' } as loaded
  var grWired = false;

  function grInput(name){ for (var i=0;i<GR_FIELDS.length;i++) if (GR_FIELDS[i].name===name) return document.getElementById(GR_FIELDS[i].id); return null; }
  function grCard(){ return document.getElementById('ippCatGreeting'); }

  // usesLegacy: read from a switch sentinel on the cc-state node (or default
  // true while the NEWSLETTER branch is not yet live). Webflow switch fields
  // can't bind to attributes directly, so this reads a data-* sentinel that
  // mirrors the PUBLICATION PLAN uses-legacy switch (same pattern as cc-state).
  function usesLegacy(){
    var st=ccState();
    if(st && st.hasAttribute('data-uses-legacy')) return st.getAttribute('data-uses-legacy')==='true';
    return true; // safe default until NEWSLETTER write branch ships
  }

  function grIsDirty(name){
    var el=grInput(name); if(!el) return false;
    return el.value !== (grOriginal[name]==null?'':grOriginal[name]);
  }
  function grDirtyCount(){ var n=0; GR_FIELDS.forEach(function(f){ if(grIsDirty(f.name)) n++; }); return n; }

  function grPaintField(name){
    var el=grInput(name); if(!el) return;
    el.classList.toggle('ix-picker-input--changed', grIsDirty(name));
  }
  function grPaintAll(){ GR_FIELDS.forEach(function(f){ grPaintField(f.name); }); grReflectBar(); }

  // savebar: "N dirty → N field writes" + Save / Cancel affordances.
  function grReflectBar(){
    var n=grDirtyCount();
    var stat=IPP.q('.ipp-savebar .stat');
    if(stat) stat.textContent = n===0 ? 'No unsaved changes'
                                       : (n+' field'+(n===1?'':'s')+' changed → '+n+' write'+(n===1?'':'s')+' on Save');
    var save=document.getElementById('ipp_grSave');
    if(save) save.disabled = (n===0);
    var cancel=document.getElementById('ipp_grCancel');
    if(cancel) cancel.hidden = (n===0);
    var bar=IPP.q('.ipp-savebar');
    if(bar) bar.classList.toggle('ipp-dirty', n>0);
  }

  function grSnapshotOriginal(){
    GR_FIELDS.forEach(function(f){ var el=grInput(f.name); grOriginal[f.name]= el?el.value:''; });
  }

  function grRevert(){
    GR_FIELDS.forEach(function(f){
      var el=grInput(f.name); if(!el) return;
      el.value = grOriginal[f.name]==null?'':grOriginal[f.name];
      // keep char counters honest
      el.dispatchEvent(new Event('input',{bubbles:true}));
    });
    grPaintAll();
    IPP.toast('Greeting reverted');
  }

  function grSave(){
    var n=grDirtyCount(); if(n===0) return;
    var t=IPP.tenant();
    var save=document.getElementById('ipp_grSave');
    var payload={
      op:'gr-save',
      pubplanId:t.pubplanId,
      titleAdminId:t.titleAdminId,
      usesLegacy:String(usesLegacy()),
      title:(grInput('title')||{}).value||'',
      message:(grInput('message')||{}).value||''
    };
    // No webhook / no tenant → optimistic local commit (dev/preview parity).
    if(!t.pubplanId || !(window.PP_WEBHOOKS && window.PP_WEBHOOKS.gr)){
      grSnapshotOriginal(); grPaintAll(); IPP.toast('Greeting saved (local)'); return;
    }
    if(save){ save.disabled=true; save.textContent='Saving…'; }
    IPP.saving(true,'Saving greeting…');
    IPP.post('gr',payload)
      .then(function(){
        grSnapshotOriginal(); grPaintAll();
        IPP.saving(false); if(save) save.textContent='Save';
        IPP.toast('Greeting saved');
      })
      .catch(function(err){
        console.error('[ipp-picker] gr-save',err);
        IPP.saving(false); if(save){ save.disabled=false; save.textContent='Save'; }
        IPP.toast('Save failed — your edits are kept',true);
        grReflectBar();
      });
  }

  function wireGreeting(){
    if(grWired) return;
    var card=grCard(); if(!card) return;
    grWired=true;
    grSnapshotOriginal();                       // capture loaded values as "original"
    GR_FIELDS.forEach(function(f){
      var el=grInput(f.name); if(!el) return;
      el.addEventListener('input',function(){ grPaintField(f.name); grReflectBar(); });
    });
    var save=document.getElementById('ipp_grSave');     if(save)   save.addEventListener('click',grSave);
    var cancel=document.getElementById('ipp_grCancel'); if(cancel) cancel.addEventListener('click',grRevert);
    grPaintAll();
  }

  /* ──────────────────────────────────────────────────────────
     STUBS (unchanged — articles/ads/etc. assignment not yet built)
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
    console.info('[ipp-picker] mounted');
  }

  document.addEventListener('ipp:ready',mount);
  document.addEventListener('ipp:view',function(e){ if(e.detail&&e.detail.view==='picker') mount(); });
  if(document.querySelector('[data-ipp-root]')) mount();

  window.IPP.picker={ mount:mount, hydrate:hydrate, CATS:CATS,
    greeting:{ dirtyCount:grDirtyCount, save:grSave, revert:grRevert, paint:grPaintAll } };
})();
