/* ============================================================
   ipp-picker-v1.1.js — Picker view (Scope A)
   CHANGELOG
     v1.1 (from v1.0):
       - FIX: CC checkboxes rendered as 50x50 red boxes. Root cause:
         Webflow's published CSS has a GLOBAL .locked rule
         (background:var(--red);50x50) that hit our cc-items carrying
         the bare "locked" class. Also "on" is collision-prone.
         Namespaced the CC state classes: on→ipp-on, locked→ipp-locked.
     v1.0: initial Scope A — CC live wiring + stubbed content clicks.
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
    hydrate(); wireCC(); wireStubs();
    console.info('[ipp-picker] mounted');
  }

  document.addEventListener('ipp:ready',mount);
  document.addEventListener('ipp:view',function(e){ if(e.detail&&e.detail.view==='picker') mount(); });
  if(document.querySelector('[data-ipp-root]')) mount();

  window.IPP.picker={ mount:mount, hydrate:hydrate, CATS:CATS };
})();
