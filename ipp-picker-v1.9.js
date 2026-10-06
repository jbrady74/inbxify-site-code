/* ipp-picker-v1.9.js */
/* ============================================================
   ipp-picker-v1.9.js — Picker view
   CHANGELOG
     v1.9 (from v1.8, IPP Build S2 slice 1 · READ). Pairs
       ipp-picker-markup-v1.7.js, ipp-picker-v1.9.css, ipp-shell-v1.6.js
       and Data Worker ix-issue-data v1.0.9 (/plan-board).
       Spec: IPP-Allocations-Scoping-v0_5.md §06 R1, R2, §08.
       - TILES FROM THE PLAN'S REAL ROWS. Every NL-BLOCKS row of the plan
         is one tile in its section, keyed by its NL-BLOCKS id, sorted by
         position. Section by asset type (never by block type):
           article  -> Articles      ad -> Banner Ads    text-ad -> The Find
           re       -> Real Estate   event -> Events
           other    -> not a tile (Greeting has its own card; an Around
                       Town opener shows as a thin header line in the
                       Articles flow, with its teaser; Divider, Spacer and
                       the rest are layout, set on the Layout tab)
           none     -> the salmon "Rows with no asset type" list
       - GREEN = FILLED AND SAVED. A tile is green with a check when the
         board read back an asset on it (Events, Real Estate and The Find:
         at least one item in the list). Nothing paints green from what
         the page sent (TOAST-TRUTH); slice 1 sends nothing.
       - THE PICKER NEVER SAYS FA, TS OR LBP. Tiles say what they hold.
       - ALLOCATIONS LIST (right rail, read-only):
           lines   this plan's allocations, plus loose rows whose asset
                   is not already an allocation's (source "Library")
           looks   green ✓ placed in a slot (Events/RE: in the list)
                   plain   an asset stands behind it, not in a slot
                   salmon  "no article": allocated, nothing linked
           order   salmon, then plain, then green; page order within
           source  the page number opens the print page (ix-pdf-pager
                   when the page loads it, else the PDF in a new tab at
                   that page); loose rows say "Library"
           focus   follows the centre: clicking into Articles, Events or
                   Real Estate narrows the list and outlines the section;
                   Greeting, Banner Ads and The Find clear it. Chips do
                   the same without touching the centre. No counter (IA19).
           avail   "Show available assets" (focus All or Articles) lists
                   the publisher's other articles from ix-asset-list
                   (PP_WEBHOOKS.assetList), with search; anything already
                   on the list is dropped; a title equal to an unlinked
                   allocation's printed title says so (R9, case-insensitive,
                   exact).
       - CONTENT CONTROLLER COUNTS FOLLOW THE BOARD ("4 slots"). A section
         the plan has slots in is shown and locked on. A section the
         Controller has on with no slots still shows, empty.
       - REMOVED: the demo tiles and their stubbed customer dropdowns
         (TILE_DD), and the "Would add / remove" stub toasts. Add, remove,
         fill, Place and Link arrive in slice 2 with the write path; the
         standing edit rules (selection persists, gold border on pending
         fields, a Cancel link on every edit) come with them through
         IPP.editState, which is unchanged here.
       - Kept as is: IPP.editState, IPP.registerDropdown (ipp-dropdown
         v1.0 still loads), the Content Controller toggles and their
         per-click save, and the Greeting card.
       - Never scrolls the view: a redraw keeps the canvas and the list
         where they were.
       - Known, not changed here: the Greeting card still looks for its
         row in a hidden NL-BLOCKS list the page does not render, so a
         Greeting Save creates a new GR row at position 1 even when the
         plan already has one. Slice 2 points it at the board's GR row.
     HARDCODING (provisional ids, for the doc-maintenance chat)
       HC-P-IPP2-3  ALLOC_FOCUS: Allocator type words (article,
                    events-page, re-page, print-ad, house-ad, other) to
                    the asset type they focus as. Platform vocabulary,
                    the Allocator's own (ta-print-review TYPE_OPTS).
                    By design.
       HC-P-IPP2-4  LIST_NOUN: "event / listing / business" counts copy.
                    By design (copy).
       HC-P-IPP2-5  AVAIL_MAX = 60 available lines drawn before "search
                    to narrow". By design (screen size).
       HC-P-IA-1/2/6/11 apply as scoped (copy, needs-you-first order,
                    exact title match, look colours as tokens).
     v1.8 and earlier:
       v1.8 (from v1.7): FIX — IPP.registerDropdown was defined at the file TAIL,
         AFTER the immediate `if(querySelector('[data-ipp-root]')) mount()` call,
         so wireTileDropdowns() ran before registerDropdown existed →
         "registerDropdown missing — cannot wire tiles" (observed live on v1.7).
         Moved the IPP.registerDropdown assignment ABOVE mount(). Also widened the
         self-retry guard to cover BOTH registerDropdown AND dropdown missing
         (was: only dropdown). Now resilient to in-file define-order AND
         cross-file load-order. (v1.7 was loaded live but tiles never wired;
         v1.8 supersedes it — delete v1.7 from page.)
       v1.7 (from v1.6): FIX — wireTileDropdowns() no longer bails permanently
         when ipp-dropdown-v1.0.js hasn't executed yet. mount() is guarded by
         data-picker-mounted (never re-runs), so the old guard meant a single
         early mount left dropdowns unwired forever regardless of script order.
         Now it self-retries (~50ms × up to 40 = ~2s) until IPP.dropdown exists,
         then wires. Load-order independent — dropdown can load before OR after
         picker. Adds a wired-count console line for verification. No behavior
         change once wired. (Root cause of "tile dropdowns nothing working":
         ipp-dropdown loaded AFTER picker, picker mounted first, guard tripped.)
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
   ============================================================ */
(function () {
  'use strict';
  if (!window.IPP) { console.error('[ipp-picker] shell not loaded'); return; }
  var IPP = window.IPP;
  var VERSION = '1.9';
  var FILE = 'ipp-picker-v1.9.js';

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


  /* ════════════════════════════════════════════════════════════
     THE BOARD (v1.9) — tiles and the Allocations list, read-only
     ════════════════════════════════════════════════════════════ */

  /* HC-P-IPP2-3: the Allocator's type words, as the asset type they focus as. */
  var ALLOC_FOCUS = { 'article':'article', 'events-page':'event', 're-page':'re',
                      'print-ad':'ad', 'house-ad':'ad', 'other':'other' };
  /* HC-P-IPP2-4 */
  var LIST_NOUN = { event:['event','events'], re:['listing','listings'], 'text-ad':['business','businesses'] };
  /* HC-P-IPP2-5 */
  var AVAIL_MAX = 60;

  var FOCUS = '';          // '' | 'article' | 'event' | 're'
  var BOARD = null;        // last good /plan-board answer
  var AVAIL = { open:false, items:null, titles:[], truncated:false, error:'', loading:false, q:'' };

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function plural(n, pair){ return n + ' ' + (n === 1 ? pair[0] : pair[1]); }
  function view(){ return IPP.q('.ipp-view[data-view="picker"]'); }
  function canvasEl(){ var v = view(); return v && IPP.q('.ipp-canvas', v); }
  function byId(id){ return document.getElementById(id); }

  // Redraw without moving the view (standing rule).
  function keepScroll(fn){
    var c = canvasEl(), l = byId('ipp_alList');
    var ct = c ? c.scrollTop : 0, lt = l ? l.scrollTop : 0;
    fn();
    if (c) c.scrollTop = ct;
    if (l) l.scrollTop = lt;
  }

  function thumbHtml(url, cls){
    if (!url) return '<div class="' + cls + ' ipp-ghost-img"></div>';
    return '<div class="' + cls + ' ipp-slot-thumb" style="background-image:url(&quot;' + esc(url) + '&quot;)"></div>';
  }
  function check(){ return '<span class="ipp-slot-check" aria-label="Filled">\u2713</span>'; }

  // ── tiles ────────────────────────────────────────────────
  function articleTile(s){
    var a = s.asset;
    if (a && a.missing) {
      return '<div class="ipp-ctile ipp-slot ipp-slot--bad" data-slot-id="' + esc(s.id) + '">' +
        '<span class="pos-tag">Pos ' + esc(s.position) + '</span><div class="ipp-ghost-img"></div>' +
        '<div class="ipp-ttitle">Article not found</div><div class="ipp-tmeta">' + esc(a.id) + '</div></div>';
    }
    if (a) {
      return '<div class="ipp-ctile filled ipp-slot ipp-slot--ok" data-slot-id="' + esc(s.id) + '">' +
        '<span class="pos-tag">Pos ' + esc(s.position) + '</span>' + check() +
        thumbHtml(a.thumb, 'ipp-art-thumb') +
        '<div class="ipp-ttitle">' + esc(a.name || 'Untitled article') + '</div>' +
        '<div class="ipp-tmeta">' + (a.customer ? esc(a.customer) : '') + '</div></div>';
    }
    return '<div class="ipp-ctile ghost ipp-slot" data-slot-id="' + esc(s.id) + '">' +
      '<span class="pos-tag">Pos ' + esc(s.position) + '</span><div class="ipp-ghost-img"></div>' +
      '<div class="ipp-ghost-line long"></div><div class="ipp-ghost-line short"></div>' +
      '<div class="ipp-tmeta">Empty article slot</div></div>';
  }
  function atLine(s){
    return '<div class="ipp-at-line" data-slot-id="' + esc(s.id) + '" data-ipp-focus="">' +
      '<span class="ipp-at-tag">Around Town</span>' +
      '<span class="ipp-at-teaser">' + (s.blockText ? esc(s.blockText) : '<i>No teaser yet</i>') + '</span>' +
      '<span class="pos-tag">Pos ' + esc(s.position) + '</span></div>';
  }
  function adTile(s){
    var a = s.asset;
    var name = a ? (a.customer || a.name || 'Ad') : 'Unassigned';
    var img = (a && a.thumb)
      ? '<div class="ipp-banner-img-frame"><img class="ipp-banner-photo" alt="" loading="lazy" src="' + esc(a.thumb) + '"></div>'
      : '<div class="ipp-banner-img-frame"><div class="ipp-banner-img"></div></div>';
    var cls = a ? (a.missing ? 'ipp-slot--bad' : 'ipp-slot--ok') : 'ghost';
    return '<div class="ipp-banner-tile ipp-slot ' + cls + '" data-slot-id="' + esc(s.id) + '">' +
      '<span class="pos-tag">Pos ' + esc(s.position) + '</span>' + (a && !a.missing ? check() : '') + img +
      '<div class="ipp-slot-name">' + esc(a && a.missing ? 'Ad not found' : name) + '</div></div>';
  }
  function listTile(s){
    var n = Number(s.listCount) || 0;
    var noun = LIST_NOUN[s.assetType] || ['item','items'];
    return '<div class="ipp-list-tile ipp-slot ' + (n > 0 ? 'ipp-slot--ok' : 'ghost') + '" data-slot-id="' + esc(s.id) + '">' +
      '<span class="pos-tag">Pos ' + esc(s.position) + '</span>' + (n > 0 ? check() : '') +
      '<div class="ipp-list-count">' + (n > 0 ? plural(n, noun) : 'No ' + noun[1] + ' yet') + '</div></div>';
  }

  function secCount(key, slots, filledFn){
    var el = IPP.q('[data-ipp-sec-count="' + key + '"]'); if (!el) return;
    if (!slots.length) { el.innerHTML = '<span class="ipp-muted">No slots in this plan</span>'; return; }
    var f = slots.filter(filledFn).length;
    el.innerHTML = '<b>' + slots.length + '</b> slot' + (slots.length === 1 ? '' : 's') + ' \u00b7 <b>' + f + '</b> filled';
  }

  function ccCount(key, text){
    var el = IPP.q('[data-ipp-cc-count="' + key + '"]'); if (!el) return;
    el.textContent = text || ''; el.hidden = !text;
  }
  // A section the plan has slots in shows and is locked on.
  function ccFromBoard(key, n){
    var item = IPP.q('.ipp-cc-item[data-section="' + key + '"]'); var c = cat(key);
    if (!item || !c) return;
    if (n > 0) { item.classList.add('ipp-on'); item.classList.add('ipp-locked'); }
    else item.classList.remove('ipp-locked');
    showSection(c.sec, item.classList.contains('ipp-on'));
    if (EditState._rec('cc', key)) EditState.commitKey('cc', key);
  }

  function setMsg(html, kind){
    var m = byId('ipp_boardMsg'); if (!m) return;
    m.className = 'ipp-board-msg' + (kind ? ' ipp-board-msg--' + kind : '');
    m.innerHTML = html; m.hidden = !html;
  }

  function renderBoard(b){
    var slots = (b && b.slots) || [];
    var group = { article:[], ad:[], 'text-ad':[], re:[], event:[], none:[], gr:[] };
    var artFlow = [];
    slots.forEach(function(s){
      if (s.assetType === null || s.assetType === undefined) { group.none.push(s); return; }
      if (s.assetType === 'article') { group.article.push(s); artFlow.push(s); return; }
      if (s.assetType === 'other') {
        if (s.blockType === 'AT') artFlow.push(s);
        if (s.blockType === 'GR') group.gr.push(s);
        return;
      }
      if (group[s.assetType]) group[s.assetType].push(s);
    });
    var filled = function(s){ return !!(s.asset && !s.asset.missing); };
    var listed = function(s){ return Number(s.listCount) > 0; };

    keepScroll(function(){
      var at = byId('ipp_artTiles');
      if (at) at.innerHTML = artFlow.length
        ? artFlow.map(function(s){ return s.assetType === 'article' ? articleTile(s) : atLine(s); }).join('')
        : '<div class="ipp-sec-empty">No article slots in this plan.</div>';
      var bt = byId('ipp_bnrTiles');
      if (bt) bt.innerHTML = group.ad.length ? group.ad.map(adTile).join('')
        : '<div class="ipp-sec-empty">No banner slots in this plan.</div>';
      [['ipp_txaTiles','text-ad'],['ipp_reTiles','re'],['ipp_evTiles','event']].forEach(function(p){
        var el = byId(p[0]); if (!el) return;
        el.innerHTML = group[p[1]].length ? group[p[1]].map(listTile).join('')
          : '<div class="ipp-sec-empty">No slots in this plan.</div>';
      });
      var ut = byId('ipp_untypedList'), us = byId('ippCatUntyped');
      if (ut) ut.innerHTML = group.none.map(function(s){
        return '<div class="ipp-untyped-row">Pos ' + esc(s.position) + ' \u00b7 ' +
          (s.blockType ? 'block type ' + esc(s.blockType) : 'no block type') + '</div>';
      }).join('');
      if (us) us.hidden = !group.none.length;

      secCount('articles', group.article, filled);
      secCount('ads', group.ad, filled);
      secCount('txa', group['text-ad'], listed);
      secCount('re', group.re, listed);
      secCount('events', group.event, listed);

      var slotWord = function(n){ return n ? n + ' slot' + (n === 1 ? '' : 's') : ''; };
      ccCount('greeting', group.gr.length ? 'In plan' : '');
      ccCount('articles', slotWord(group.article.length));
      ccCount('ads', slotWord(group.ad.length));
      ccCount('txa', slotWord(group['text-ad'].length));
      ccCount('re', slotWord(group.re.length));
      ccCount('events', slotWord(group.event.length));
      ccFromBoard('greeting', group.gr.length);
      ccFromBoard('articles', group.article.length);
      ccFromBoard('ads', group.ad.length);
      ccFromBoard('txa', group['text-ad'].length);
      ccFromBoard('re', group.re.length);
      ccFromBoard('events', group.event.length);

      var warns = (b && b.meta && b.meta.warnings) || [];
      if (warns.length) {
        setMsg('<details class="ipp-board-notes"><summary>' + plural(warns.length, ['note','notes']) +
          ' from the plan data</summary><ul>' + warns.map(function(w){ return '<li>' + esc(w) + '</li>'; }).join('') +
          '</ul></details>', 'note');
      } else setMsg('', '');
      paintFocus();
    });
    renderList();
  }

  // ── focus ────────────────────────────────────────────────
  function paintFocus(){
    IPP.qa('.ipp-view[data-view="picker"] .ipp-cat-section').forEach(function(sec){
      var f = sec.getAttribute('data-ipp-focus') || '';
      sec.classList.toggle('ipp-focus-on', !!FOCUS && f === FOCUS);
    });
    IPP.qa('[data-ipp-chip]').forEach(function(b){
      b.setAttribute('data-active', String((b.getAttribute('data-ipp-chip') || '') === FOCUS));
    });
    var av = byId('ipp_alAvail');
    if (av) av.hidden = !(FOCUS === '' || FOCUS === 'article');
  }
  function setFocus(f){
    f = f || '';
    if (f === FOCUS) return;
    FOCUS = f;
    keepScroll(paintFocus);
    renderList();
  }

  // ── the Allocations list ─────────────────────────────────
  function linesOf(b){
    var out = [];
    var allocAssetIds = {};
    ((b && b.allocations) || []).forEach(function(a){
      if (a.asset) allocAssetIds[a.asset.id] = true;
      var look = !a.asset ? 'salmon' : ((a.placement && !a.placement.loose) ? 'green' : 'plain');
      out.push({
        key: 'al-' + a.id,
        title: a.printTitle || (a.asset && a.asset.name) || 'Untitled',
        focus: a.asset ? a.asset.kind : (ALLOC_FOCUS[a.type] || 'other'),
        customer: '',
        page: a.page, pdfPage: a.pdfPage, pdfUrl: a.pdfUrl, library: false,
        look: look,
        pos: (look === 'green') ? a.placement.position : null,
        assetName: (a.asset && a.asset.name && a.asset.name !== a.printTitle) ? a.asset.name : ''
      });
    });
    ((b && b.loose) || []).forEach(function(l){
      if (!l.asset || allocAssetIds[l.asset.id]) return;
      out.push({
        key: 'lo-' + l.id, title: l.asset.name || 'Untitled', focus: l.asset.kind,
        customer: l.asset.customer || '', page: null, pdfPage: null, pdfUrl: '', library: true,
        look: 'plain', pos: null, assetName: ''
      });
    });
    var rank = { salmon:0, plain:1, green:2 };
    var pg = function(x){ return x.library ? 1e9 : (Number(x.page) || 0); };
    out.sort(function(x, y){ return rank[x.look] - rank[y.look] || pg(x) - pg(y) || String(x.title).localeCompare(String(y.title)); });
    return out;
  }

  function srcHtml(ln){
    if (ln.library) return '<span class="ipp-al-src">Library</span>';
    if (ln.page == null) return '';
    var label = 'p.' + esc(ln.page);
    if (!ln.pdfUrl) return '<span class="ipp-al-src">' + label + '</span>';
    return '<button type="button" class="ipp-al-src ipp-al-pdf" data-pdf="' + esc(ln.pdfUrl) +
      '" data-pdf-page="' + esc(ln.pdfPage || ln.page) + '" data-pdf-title="' + esc(ln.title) +
      '" title="Open the print page">' + label + '</button>';
  }
  function lineHtml(ln){
    var bits = [];
    if (ln.customer) bits.push('<span class="ipp-al-cust">' + esc(ln.customer) + '</span>');
    var src = srcHtml(ln); if (src) bits.push(src);
    if (ln.look === 'salmon') bits.push('<span class="ipp-al-word ipp-al-word--salmon">no article</span>');
    if (ln.look === 'green') bits.push('<span class="ipp-al-word">Pos ' + esc(ln.pos) + '</span>');
    if (ln.look === 'plain') bits.push('<span class="ipp-al-word">not in a slot</span>');
    return '<div class="ipp-al-it ipp-al-it--' + ln.look + '" data-al-key="' + esc(ln.key) + '">' +
      '<div class="ipp-al-t">' + (ln.look === 'green' ? '<span class="ipp-al-ok">\u2713</span>' : '') + esc(ln.title) + '</div>' +
      (ln.assetName ? '<div class="ipp-al-asset">Article: ' + esc(ln.assetName) + '</div>' : '') +
      '<div class="ipp-al-sub">' + bits.join('<span class="ipp-al-dot">\u00b7</span>') + '</div></div>';
  }
  function renderList(){
    var el = byId('ipp_alList'); if (!el) return;
    if (!BOARD) { el.innerHTML = '<div class="ipp-al-empty">' + (IPP.board && IPP.board.error() ? '' : 'Reading this plan\u2026') + '</div>'; return; }
    var lines = linesOf(BOARD).filter(function(l){ return !FOCUS || l.focus === FOCUS; });
    var label = { article:'Articles', event:'Events', re:'Real Estate' }[FOCUS];
    keepScroll(function(){
      el.innerHTML = lines.length ? lines.map(lineHtml).join('')
        : '<div class="ipp-al-empty">' + (label ? 'No ' + label + ' allocated to this plan.' : 'Nothing is allocated to this plan yet.') + '</div>';
    });
    if (AVAIL.open) renderAvail();
  }

  // ── available assets (R2, IA14) ──────────────────────────
  function assetListBase(){ return String((window.PP_WEBHOOKS || {}).assetList || '').replace(/\/+$/, ''); }
  function titleAdminId(){ return (BOARD && BOARD.plan && BOARD.plan.titleAdminId) || IPP.tenant().titleAdminId || ''; }
  function loadAvail(fresh){
    var base = assetListBase(), ta = titleAdminId();
    if (!base) { AVAIL.error = 'The asset list address is not set on this page (PP_WEBHOOKS.assetList).'; renderAvail(); return; }
    if (!ta) { AVAIL.error = 'This plan has no title (TITLES-ADMIN) to list articles for.'; renderAvail(); return; }
    AVAIL.loading = true; AVAIL.error = ''; renderAvail();
    IPP.getJSON(base + '/list?type=article&title=' + encodeURIComponent(ta) + (fresh ? '&fresh=1' : ''))
      .then(function(j){
        AVAIL.loading = false;
        AVAIL.items = (j.items || []).filter(function(it){ return !it.isArchived; });
        AVAIL.titles = j.titles || []; AVAIL.truncated = !!j.truncated;
        renderAvail();
      }, function(e){
        AVAIL.loading = false; AVAIL.error = 'Could not read the publisher\u2019s articles: ' + ((e && e.message) || e);
        renderAvail();
      });
  }
  function renderAvail(){
    var box = IPP.q('.ipp-al-availbox'), list = byId('ipp_alAvailList'), link = IPP.q('[data-ipp-avail-toggle]');
    if (!box || !list) return;
    box.hidden = !AVAIL.open;
    if (link) link.textContent = AVAIL.open ? 'Hide available assets' : 'Show available assets';
    if (!AVAIL.open) return;
    if (AVAIL.error) { list.innerHTML = '<div class="ipp-al-empty ipp-al-empty--bad">' + esc(AVAIL.error) + '</div>'; return; }
    if (AVAIL.loading || !AVAIL.items) { list.innerHTML = '<div class="ipp-al-empty">Reading the publisher\u2019s articles\u2026</div>'; return; }
    var on = {}, inSlot = {}, unlinked = [];
    ((BOARD && BOARD.allocations) || []).forEach(function(a){
      if (a.asset) on[a.asset.id] = true; else unlinked.push(a);
    });
    ((BOARD && BOARD.loose) || []).forEach(function(l){ if (l.asset) on[l.asset.id] = true; });
    ((BOARD && BOARD.slots) || []).forEach(function(s){ if (s.asset) inSlot[s.asset.id] = s.position; });
    var titleName = {}; AVAIL.titles.forEach(function(t){ titleName[t.id] = t.name; });
    var mine = titleAdminId();
    var q = AVAIL.q.trim().toLowerCase();
    var rows = AVAIL.items.filter(function(it){
      if (on[it.id]) return false;
      var n = String((it.fieldData || {}).name || '');
      return !q || n.toLowerCase().indexOf(q) >= 0;
    }).map(function(it){
      var f = it.fieldData || {}, n = String(f.name || '');
      var match = null;
      for (var i = 0; i < unlinked.length; i++) {
        if (String(unlinked[i].printTitle || '').trim().toLowerCase() === n.trim().toLowerCase() && n.trim()) { match = unlinked[i]; break; }
      }
      var t = f['associated-title']; t = Array.isArray(t) ? t[0] : t;
      return { id: it.id, name: n, match: match, pos: inSlot[it.id],
               title: (t && t !== mine) ? (titleName[t] || '') : '', at: String(it.lastUpdated || '') };
    });
    rows.sort(function(a, b){ return (b.match ? 1 : 0) - (a.match ? 1 : 0) || b.at.localeCompare(a.at); });
    var total = rows.length;
    var html = rows.slice(0, AVAIL_MAX).map(function(r){
      var look = r.pos != null ? 'green' : 'plain';
      var sub = [];
      if (r.title) sub.push('<span class="ipp-al-cust">' + esc(r.title) + '</span>');
      if (r.pos != null) sub.push('<span class="ipp-al-word">Pos ' + esc(r.pos) + '</span>');
      if (r.match) sub.push('<span class="ipp-al-word ipp-al-word--match">Same title as the p.' + esc(r.match.page) + ' allocation</span>');
      return '<div class="ipp-al-it ipp-al-it--' + look + '"><div class="ipp-al-t">' +
        (look === 'green' ? '<span class="ipp-al-ok">\u2713</span>' : '') + esc(r.name || 'Untitled') + '</div>' +
        (sub.length ? '<div class="ipp-al-sub">' + sub.join('<span class="ipp-al-dot">\u00b7</span>') + '</div>' : '') + '</div>';
    }).join('');
    if (!total) html = '<div class="ipp-al-empty">' + (q ? 'No article matches \u201c' + esc(AVAIL.q) + '\u201d.' : 'No other articles for this publisher.') + '</div>';
    if (total > AVAIL_MAX) html += '<div class="ipp-al-empty">Showing ' + AVAIL_MAX + ' of ' + total + '. Search to narrow.</div>';
    if (AVAIL.truncated) html = '<div class="ipp-al-empty ipp-al-empty--bad">This list is incomplete: the asset list stopped early. Reload to try again.</div>' + html;
    list.innerHTML = html;
  }

  // ── print page ───────────────────────────────────────────
  function openPdf(btn){
    var url = btn.getAttribute('data-pdf'), page = Number(btn.getAttribute('data-pdf-page')) || 1;
    if (window.IxPdfPager && typeof window.IxPdfPager.open === 'function') {
      window.IxPdfPager.open({ url: url, page: page, title: btn.getAttribute('data-pdf-title') || '' });
      return;
    }
    window.open(url + '#page=' + page, '_blank', 'noopener');
  }

  // ── the rail card ────────────────────────────────────────
  function infoBadge(){
    if (!window.IxInfo || typeof window.IxInfo.badge !== 'function') return '';
    return window.IxInfo.badge({
      file: FILE, version: VERSION, title: 'Picker \u00b7 Allocations',
      blurb: 'The tiles are this plan\u2019s real slots, read fresh from the CMS each time the page opens. ' +
             'A tile is green when an article, ad or list item is saved in it.\n\n' +
             'Allocations lists what the Print Issue Allocator assigned to this plan, plus anything sent here ' +
             'from the Asset Library. Salmon means no article is linked yet. Plain means the article exists but ' +
             'is not in a slot. Green means it is in a slot.\n\n' +
             'This version only reads. Filling slots, Place and Link come next.',
      scenarios: [{ name: 'Data Worker \u00b7 ix-issue-data', note: '/plan-board, v1.0.9 or later' },
                  { name: 'ix-asset-list Worker', note: 'the publisher\u2019s articles, for Show available assets' }],
      companions: 'ipp-picker-markup-v1.7.js \u00b7 ipp-picker-v1.9.css \u00b7 ipp-shell-v1.6.js'
    });
  }
  function mountRail(v){
    var rail = IPP.q('.ipp-rail-right', v); if (!rail || IPP.q('.ipp-al-card', rail)) return;
    var card = document.createElement('div');
    card.className = 'ipp-card ipp-al-card';
    card.innerHTML = window.IPP_PICKER_ALLOC_MARKUP || '';
    rail.insertBefore(card, rail.firstChild);
    var slot = IPP.q('[data-ipp-al-info]', card); if (slot) slot.innerHTML = infoBadge();
    card.addEventListener('click', function(e){
      var chip = e.target.closest('[data-ipp-chip]');
      if (chip) { setFocus(chip.getAttribute('data-ipp-chip') || ''); return; }
      var pdf = e.target.closest('.ipp-al-pdf');
      if (pdf) { openPdf(pdf); return; }
      if (e.target.closest('[data-ipp-al-reload]')) {
        if (IPP.board) IPP.board.load({ fresh:true }).catch(function(){});
        if (AVAIL.open) loadAvail(true); else AVAIL.items = null;
        return;
      }
      if (e.target.closest('[data-ipp-avail-toggle]')) {
        AVAIL.open = !AVAIL.open;
        if (AVAIL.open && !AVAIL.items && !AVAIL.loading) loadAvail(false); else renderAvail();
      }
    });
    var qIn = IPP.q('[data-ipp-avail-q]', card);
    if (qIn) qIn.addEventListener('input', function(){ AVAIL.q = qIn.value; renderAvail(); });
  }

  function wireCanvasFocus(canvas){
    canvas.addEventListener('click', function(e){
      var sec = e.target.closest('[data-ipp-focus]');
      if (!sec || !canvas.contains(sec)) return;
      setFocus(sec.getAttribute('data-ipp-focus') || '');
    });
  }

  function onBoard(e){
    var d = (e && e.detail) || {};
    if (d.ok) { BOARD = d.data; renderBoard(BOARD); return; }
    var msg = '<b>Could not read this plan.</b> ' + esc(d.error || '') +
      ' <button type="button" class="ipp-board-retry" data-ipp-board-retry>Try again</button>';
    setMsg(msg, 'bad');
    var el = byId('ipp_alList');
    if (el) el.innerHTML = '<div class="ipp-al-empty ipp-al-empty--bad">The list could not be read. ' +
      (BOARD ? 'What shows may be out of date.' : '') + '</div>';
  }

  /* Canonical dropdown registration helper. DEFINED BEFORE mount() so it
     exists when wireTileDropdowns() runs (mount can fire immediately on the
     `if(querySelector(...)) mount()` line below). Every customer/asset
     dropdown calls this ONCE per control: persistent selection + gold dirty
     border + scope Save/Cancel. The dropdown's pick UI calls
     IPP.editState.set(scope,key,val). `labelEl` shows the choice. */
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


  function mount(){
    var view=IPP.q('.ipp-view[data-view="picker"]'); if(!view) return;
    if(view.dataset.pickerMounted) return;
    var rail=IPP.q('.ipp-rail',view), canvas=IPP.q('.ipp-canvas',view);
    if(!rail||!canvas) return;
    view.dataset.pickerMounted='1';
    var ccCard=document.createElement('div'); ccCard.className='ipp-card ipp-cc-card';
    ccCard.innerHTML=window.IPP_PICKER_CC_MARKUP||''; rail.appendChild(ccCard);
    canvas.innerHTML=window.IPP_PICKER_CANVAS_MARKUP||'';
    hydrate(); wireCC(); wireGreeting();
    mountRail(view); wireCanvasFocus(canvas); paintFocus();
    canvas.addEventListener('click', function(e){
      if (e.target.closest('[data-ipp-board-retry]')) { e.stopPropagation(); IPP.board.load({ fresh:true }).catch(function(){}); }
    });
    document.addEventListener('ipp:board', onBoard);
    if (!IPP.board || typeof IPP.board.load !== 'function') {
      setMsg('<b>This page loads an older IPP shell.</b> The Picker needs ipp-shell-v1.6.js or later to read the plan.', 'bad');
    } else if (IPP.board.data()) {
      onBoard({ detail:{ ok:true, data:IPP.board.data() } });
    } else {
      IPP.board.load().catch(function(){ /* shown by onBoard */ });
    }
    console.info('[ipp-picker] mounted (v' + VERSION + ' \u00b7 plan board read \u00b7 allocations read-only)');
  }

  document.addEventListener('ipp:ready',mount);
  document.addEventListener('ipp:view',function(e){ if(e.detail&&e.detail.view==='picker') mount(); });
  if(document.querySelector('[data-ipp-root]')) mount();

  window.IPP.picker={ mount:mount, hydrate:hydrate, CATS:CATS, version:VERSION,
    focus:function(){ return FOCUS; }, setFocus:setFocus, board:function(){ return BOARD; },
    greeting:{ dirtyCount:grDirtyCount, save:grSave, revert:grRevert, paint:grPaintAll, nlbId:function(){return grNlbId;},
               aiCandidateFits:grAiCandidateFits, aiApply:grAiApply } };
})();
