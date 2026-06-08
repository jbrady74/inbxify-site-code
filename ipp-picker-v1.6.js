/* ============================================================
   ipp-picker-v1.6.js — Picker view (Scope A + greeting + edit-state + tile dropdowns)
   CHANGELOG
     v1.6 (from v1.5): TILE DROPDOWN WIRING (Path 1 — pairs ipp-dropdown-v1.0.js).
       Every tile picker button (.ipp-banner-customer / .ipp-splash-customer /
       .ipp-lbp-customer / .txa-customer / .ipp-re-address / .event-name) is now
       wired to the shared searchable dropdown (IPP.dropdown) and registered via
       IPP.registerDropdown so a selection PERSISTS with the gold dirty border +
       scope Cancel — identical contract to greeting/CC. Reads come from
       IPP.sources (hidden CMS wrappers parsed once). SAVE is STUBBED behind
       greeting's no-cors pattern (IPP.assignSave logs payload + toast) until the
       assign write contract + Make scenario exist — flip STUB_SAVE in
       ipp-dropdown when ready. wireStubs() no longer fires on customer buttons
       (they're real now); non-dropdown stubs (+add bars, del) still toast.
       Each tile-type maps to its source: banner/splash/lbp → customers · txa →
       customers (txa presets on the item) · re → customers · event → events.
       Tiles carry no slot data-attrs yet (demo markup) so dropdowns persist by
       DOM-position key; when tiles gain data-slot-code (from pubplan-slot-
       wrapper) the save payload anchors to the real slot — one-line change.
     v1.5 (from v1.4): CANONICAL EDIT-STATE CONTROLLER (IPP.editState).
       One shared controller every editable control (input, dropdown, tile)
       registers with. It owns four behaviors uniformly so they are IDENTICAL
       everywhere — current greeting/CC and every future tile dropdown:
         1. DIRTY TRACKING — register(scope,key,read,opts). On change, compares
            live value to the captured original. Differs → control gets
            .ipp-dirty (canonical gold border). Set back to original →
            .ipp-dirty clears automatically. Save writes ONLY dirty controls.
         2. PERSISTENT SELECTION — the chosen value lives in editState (JS),
            not in DOM render. A control's display repaints from state, so a
            selection never visually resets as the operator moves around / edits
            other controls. (read() returns current; setValue() updates + paints.)
         3. ONE DIRTY BORDER — single .ipp-dirty class → --ipp-edit-dirty-border
            (= --ipp-gold). Distinct from char-limit .near/.at. Greeting's old
            .ix-picker-input--changed kept as a compat alias of .ipp-dirty.
         4. ONE CANCEL AFFORDANCE — .ipp-cancel-link injected/shown when a scope
            is dirty; click → editState.revert(scope) restores originals + clears
            dirty. Same markup + handler for every control. No per-block cancel.
       Greeting refactored onto editState (3 fields register; grRevert/grReflect
       now delegate). CC refactored: each include-* toggle registers as a
       boolean control so the savebar + cancel reflect pending toggles too.
       NOTE: CC currently saves per-click (optimistic). editState registration
       is additive — it does NOT change the existing per-click save path; it
       layers dirty/persist/cancel so CC conforms to the same contract as the
       rest of the picker once batched-save lands. Per-click behavior unchanged.
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

  /* ════════════════════════════════════════════════════════════
     IPP.editState — CANONICAL EDIT-STATE CONTROLLER
     The one place edit behavior is defined so it is IDENTICAL for
     every control type (text inputs, customer dropdowns, tiles).

     A "control" is registered with:
       register(scope, key, spec)
         scope : logical group sharing one Save/Cancel (e.g. 'greeting',
                 'cc', 'ads-banners'). Cancel reverts a whole scope.
         key   : unique id of the control within the scope.
         spec  : {
           el        : the element to flag .ipp-dirty on (input or tile),
           getValue  : () => current value (string/bool),
           setValue  : (v) => apply v to the UI (used by revert + persist),
           original  : initial value (captured now if omitted via getValue),
           onChange  : optional () => {} fired after any dirty recompute
         }

     Persistent selection: setValue is the single write path. Dropdowns
     call editState.set(scope,key,value) on pick — that stores it AND
     repaints via setValue, so the choice survives re-render / moving
     around. Dirty = getValue() !== original.

     Save reads dirtyKeys(scope) to write only changed controls.
     ════════════════════════════════════════════════════════════ */
  var EditState = (function () {
    var scopes = {};   // scope -> { key -> rec }

    function ensure(scope){ return (scopes[scope] || (scopes[scope] = {})); }
    function rec(scope, key){ var s = scopes[scope]; return s ? s[key] : null; }

    function isDirty(r){
      if (!r) return false;
      var cur = r.getValue();
      return String(cur) !== String(r.original == null ? '' : r.original);
    }

    function paint(r){
      if (!r || !r.el) return;
      var d = isDirty(r);
      r.el.classList.toggle('ipp-dirty', d);
      // compat: greeting inputs historically used .ix-picker-input--changed
      if (r.compatChanged) r.el.classList.toggle('ix-picker-input--changed', d);
      if (typeof r.onChange === 'function') r.onChange(d);
    }

    function reflectScope(scope){
      var s = scopes[scope]; if (!s) return;
      for (var k in s) if (s.hasOwnProperty(k)) paint(s[k]);
      var n = dirtyKeys(scope).length;
      if (typeof scopeHooks[scope] === 'function') scopeHooks[scope](n);
      ensureCancel(scope, n);
    }

    function dirtyKeys(scope){
      var s = scopes[scope]; var out = []; if (!s) return out;
      for (var k in s) if (s.hasOwnProperty(k) && isDirty(s[k])) out.push(k);
      return out;
    }

    function register(scope, key, spec){
      var s = ensure(scope);
      var r = {
        el: spec.el || null,
        getValue: spec.getValue,
        setValue: spec.setValue || function(){},
        original: spec.original != null ? spec.original
                  : (typeof spec.getValue === 'function' ? spec.getValue() : ''),
        onChange: spec.onChange || null,
        compatChanged: !!spec.compatChanged
      };
      s[key] = r;
      paint(r);
      return r;
    }

    // call after the UI value changed (input event, toggle, etc.)
    function touched(scope, key){ paint(rec(scope, key)); reflectScope(scope); }

    // canonical write path for selections (dropdowns): store + repaint + reflect
    function set(scope, key, value){
      var r = rec(scope, key); if (!r) return;
      if (typeof r.setValue === 'function') r.setValue(value);
      paint(r); reflectScope(scope);
    }

    // snapshot current values as the new "original" (after a successful save)
    function commit(scope){
      var s = scopes[scope]; if (!s) return;
      for (var k in s) if (s.hasOwnProperty(k)) s[k].original = s[k].getValue();
      reflectScope(scope);
    }
    function commitKey(scope, key){ var r = rec(scope, key); if (r){ r.original = r.getValue(); paint(r); reflectScope(scope); } }

    // revert every control in a scope to its captured original
    function revert(scope){
      var s = scopes[scope]; if (!s) return;
      for (var k in s) if (s.hasOwnProperty(k)){
        var r = s[k];
        if (typeof r.setValue === 'function') r.setValue(r.original == null ? '' : r.original);
      }
      reflectScope(scope);
    }

    // scope-level "is anything dirty" + per-scope reflect hook registration
    var scopeHooks = {};
    function onReflect(scope, fn){ scopeHooks[scope] = fn; }

    /* ── Canonical Cancel link ──────────────────────────────────
       One affordance, one handler, every scope. A scope opts in by
       providing a host element (data-ipp-cancel-host="<scope>") OR an
       explicit anchor element via cancelAnchor(scope, el). When the
       scope is dirty we ensure a `.ipp-cancel-link` exists in the host
       and is visible; when clean we hide it. Click → revert(scope). */
    var cancelEls = {};   // scope -> link element
    var cancelHosts = {}; // scope -> host element

    function cancelAnchor(scope, hostEl){ if (hostEl) cancelHosts[scope] = hostEl; }

    function ensureCancel(scope, dirtyCount){
      var host = cancelHosts[scope]
        || document.querySelector('[data-ipp-cancel-host="'+scope+'"]');
      if (!host) return; // scope manages its own cancel (e.g. greeting legacy btn)
      var link = cancelEls[scope];
      if (!link){
        link = document.createElement('button');
        link.type = 'button';
        link.className = 'ipp-cancel-link';
        link.textContent = 'Cancel';
        link.setAttribute('aria-label', 'Cancel ' + scope + ' edits');
        link.addEventListener('click', function(){ revert(scope); });
        host.appendChild(link);
        cancelEls[scope] = link;
      }
      link.hidden = !(dirtyCount > 0);
    }

    return {
      register: register, touched: touched, set: set,
      commit: commit, commitKey: commitKey, revert: revert,
      isDirtyScope: function(scope){ return dirtyKeys(scope).length > 0; },
      dirtyKeys: dirtyKeys, reflect: reflectScope,
      onReflect: onReflect, cancelAnchor: cancelAnchor,
      _rec: rec
    };
  })();
  IPP.editState = EditState;

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
      var key=item.getAttribute('data-section'); var c=cat(key);
      // Register the toggle as a boolean control on the 'cc' scope so CC
      // conforms to the same dirty/persist/cancel contract as the rest of
      // the picker. Value = live on-state. setValue repaints the checkbox +
      // its section (persistent selection). Per-click save still commits
      // immediately (below), so under optimistic save CC returns to clean.
      if(c){
        EditState.register('cc', key, {
          el: item,
          getValue: function(){ return item.classList.contains('ipp-on'); },
          setValue: function(v){ var on=(v===true||v==='true'); item.classList.toggle('ipp-on',on); showSection(c.sec,on); }
        });
      }
      item.addEventListener('click',function(){
        var c2=cat(key); if(!c2) return;
        if(item.classList.contains('ipp-locked')){ IPP.toast('Cannot turn off <b>'+labelOf(item)+'</b> — it has content. Remove items first.',true); return; }
        var from=item.classList.contains('ipp-on'); var to=!from;
        item.classList.toggle('ipp-on',to); showSection(c2.sec,to);
        EditState.touched('cc', key);
        saveCC(item,c2,to,from);
      });
    });
  }
  function saveCC(item,c,value,from){
    var t=IPP.tenant();
    var revert=function(){ item.classList.toggle('ipp-on',from); showSection(c.sec,from); item.classList.remove('saving'); EditState.touched('cc', c.key); IPP.toast('Save failed — reverted',true); };
    if(!t.pubplanId || !(window.PP_WEBHOOKS && window.PP_WEBHOOKS.cc)){
      item.classList.remove('saving'); item.classList.add('just-saved'); setTimeout(function(){item.classList.remove('just-saved');},1100);
      EditState.commitKey('cc', c.key); return;
    }
    item.classList.add('saving');
    IPP.post('cc',{op:'cc-save',pubplanId:t.pubplanId,titleAdminId:t.titleAdminId,field:c.field,value:String(value)})
      .then(function(){ item.classList.remove('saving'); item.classList.add('just-saved'); setTimeout(function(){item.classList.remove('just-saved');},1100); EditState.commitKey('cc', c.key); })
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
  function grIsDirty(name){ return EditState.dirtyKeys('greeting').indexOf(name) !== -1; }
  function grDirtyCount(){ return EditState.dirtyKeys('greeting').length; }
  function grPaintField(name){ EditState.touched('greeting', name); }
  function grPaintAll(){ GR_FIELDS.forEach(function(f){ grSetCount(f.name); }); EditState.reflect('greeting'); }

  function grReflectBar(){ EditState.reflect('greeting'); }

  // editState reflect hook for the greeting scope: drives savebar + Save/Cancel.
  EditState.onReflect('greeting', function(n){
    var stat=IPP.q('.ipp-savebar .stat');
    if(stat) stat.textContent = n===0 ? 'No unsaved changes'
                                       : (n+' field'+(n===1?'':'s')+' changed → '+n+' write'+(n===1?'':'s')+' on Save');
    var save=document.getElementById('ipp_grSave');   if(save)   save.disabled=(n===0);
    var cancel=document.getElementById('ipp_grCancel'); if(cancel) cancel.hidden=(n===0);
    var bar=IPP.q('.ipp-savebar'); if(bar) bar.classList.toggle('ipp-dirty', n>0);
  });

  function grSnapshotOriginal(){ EditState.commit('greeting'); }

  function grRevert(){
    EditState.revert('greeting');
    GR_FIELDS.forEach(function(f){ grSetCount(f.name); });
    IPP.toast('Greeting reverted');
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
    // Register each greeting field with the canonical edit-state controller.
    // original is captured NOW (post-hydrate) so dirty = edited-since-load.
    GR_FIELDS.forEach(function(f){
      var el=grInput(f.name); if(!el) return;
      EditState.register('greeting', f.name, {
        el: el,
        getValue: function(){ return el.value; },
        setValue: function(v){ el.value = (v==null?'':v); },
        compatChanged: true   // also toggles legacy .ix-picker-input--changed
      });
      el.addEventListener('input',function(){ grSetCount(f.name); EditState.touched('greeting', f.name); });
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
      // NOTE: customer/asset picker buttons are handled by wireTileDropdowns()
      // (real dropdowns now) — intentionally excluded from this stub catch-all.
      var t=e.target.closest('.ipp-banner-add-bar, .ipp-lbp-add, .ipp-re-add, .ipp-ai-generate-btn, .ipp-del-btn');
      if(!t) return; e.stopPropagation();
      if(t.classList.contains('ipp-del-btn'))         { IPP.toast('Would remove this slot'); return; }
      if(t.classList.contains('ipp-ai-generate-btn')) { IPP.toast('Would generate greeting with AI'); return; }
      if(t.classList.contains('ipp-banner-add-bar')||t.classList.contains('ipp-lbp-add')||t.classList.contains('ipp-re-add')){ IPP.toast('Would add a slot'); return; }
    });
  }

  /* ─── Tile dropdown wiring (Path 1) ─────────────────────────
     Wire every tile picker button to the shared searchable dropdown
     and register it with editState so the pick persists (gold border)
     + Cancel reverts. Each button gets a stable key by tile-type +
     DOM index (tiles carry no slot data-attr yet — demo markup). When
     tiles gain data-slot-code, swap the key to the slot code and point
     the (currently stubbed) save at the real assign route. */
  var TILE_DD = [
    { sel: '.ipp-banner-customer', source: 'customers', scope: 'ads-banners' },
    { sel: '.ipp-splash-customer', source: 'customers', scope: 'ads-splash'  },
    { sel: '.ipp-lbp-customer',    source: 'customers', scope: 'ads-lbp'     },
    { sel: '.txa-customer',        source: 'customers', scope: 'txa'         },
    { sel: '.ipp-re-address',      source: 'customers', scope: 're'          },
    { sel: '.event-name',          source: 'events',    scope: 'events'      }
  ];

  function wireTileDropdowns(){
    if(!IPP.dropdown || !IPP.registerDropdown){
      console.warn('[ipp-picker] ipp-dropdown not loaded — tile dropdowns skipped'); return;
    }
    TILE_DD.forEach(function(cfg){
      var btns=IPP.qa(cfg.sel);
      btns.forEach(function(btn, i){
        if(btn.dataset.ddWired) return; btn.dataset.ddWired='1';
        var key=cfg.scope+'-'+i;                       // stable per-tile key
        var labelEl=btn.querySelector('.ipp-name');
        // register so selection persists + paints dirty + joins scope Save/Cancel
        IPP.registerDropdown(cfg.scope, key, {
          el: btn,
          labelEl: labelEl,
          value: labelEl ? labelEl.textContent.trim() : ''
        });
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          IPP.dropdown.open(btn, {
            source: cfg.source, scope: cfg.scope, key: key,
            onPick: function(item){
              // STUBBED save — logs intended payload, shows toast.
              IPP.assignSave({
                op:'assign', scope:cfg.scope, source:cfg.source,
                tileKey:key, pickedId:item.id||'', pickedName:item.name||item.title||''
              });
            }
          });
        });
      });
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
    hydrate(); wireCC(); wireGreeting(); wireTileDropdowns(); wireStubs();
    console.info('[ipp-picker] mounted (v1.6 · editState + tile dropdowns · save stubbed Path 1)');
  }

  document.addEventListener('ipp:ready',mount);
  document.addEventListener('ipp:view',function(e){ if(e.detail&&e.detail.view==='picker') mount(); });
  if(document.querySelector('[data-ipp-root]')) mount();

  /* Canonical dropdown registration helper. Every future customer/asset
     dropdown calls this ONCE per control to be automatically correct:
     persistent selection + gold dirty border + scope Save/Cancel. The
     dropdown's own open/list/pick UI calls IPP.editState.set(scope,key,val)
     on selection. `labelEl` is the element whose text shows the choice. */
  IPP.registerDropdown = function(scope, key, opts){
    opts = opts || {};
    var tile = opts.el, labelEl = opts.labelEl || (tile && tile.querySelector('.ipp-name'));
    var current = (opts.value != null) ? opts.value : (labelEl ? labelEl.textContent.trim() : '');
    return IPP.editState.register(scope, key, {
      el: tile,
      getValue: function(){ return (opts.read ? opts.read() : current); },
      setValue: function(v){ current = v; if (labelEl) labelEl.textContent = (v==null?'':v); if (opts.apply) opts.apply(v); },
      original: current
    });
  };

  window.IPP.picker={ mount:mount, hydrate:hydrate, CATS:CATS,
    greeting:{ dirtyCount:grDirtyCount, save:grSave, revert:grRevert, paint:grPaintAll, nlbId:function(){return grNlbId;},
               aiCandidateFits:grAiCandidateFits, aiApply:grAiApply } };
})();
