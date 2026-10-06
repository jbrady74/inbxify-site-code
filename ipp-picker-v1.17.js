/* ipp-picker-v1.17.js */
/* ============================================================
   ipp-picker-v1.17.js — Picker view
   CHANGELOG
     v1.17 (from v1.16, first live look). Pairs ipp-picker-v1.17.css.
       - FIX: on the Allocations list, Create and link and Link sat beside
         the title and squeezed it to two letters. A line's buttons now sit
         on their own row under the source line, right-aligned, so the
         title has the full width. Same for Place, Retry and Cancel, and for
         the available-assets lines. Nothing else changed.
     v1.16 (from v1.15, IPP Build S4 · slice 3 · LINK). Pairs
       ipp-picker-v1.16.css, ipp-picker-markup-v1.10.js (unchanged),
       Data Worker ix-issue-data v1.0.13 and Scenario 103B v1.4.1.
       Spec: IPP-Allocations-Scoping-v0_5.md §06 R7 and R9, §09.
       - LINK (R7). A salmon "no article" line on an Article or Other
         allocation has Link. It opens a panel of the publisher's articles,
         same title as the printed item first ("Same title as the printed
         item"), then this plan's own, then the newest, with search. The
         pick waits for Save: the line turns gold, shows "Article: <name>"
         and "link waiting", and keeps its own Cancel while you work
         elsewhere. A waiting link can be placed at once (Place).
       - CREATE AND LINK is shown and not wired (IA23). Clicking it says
         so and does nothing.
       - LINK AND PLACE (R9). An available article whose title matches an
         unlinked allocation says "Same title as the p.n allocation · links
         it too". Picking it in a slot picker, or placing it from the
         available list ("Link and place"), makes two pending changes, the
         link and the fill, each with its own Cancel.
       - SAVE. Links go first, through Scenario 103B `link` at
         PP_WEBHOOKS.slateWriter, then 124 create, fill, clear, delete as
         before. The field written comes from the board (linkFields, Data
         Worker v1.0.13); no slug is typed here. A link counts only when
         103B says ok, fieldOk, and the value it read back equals the id
         sent. A fill whose link failed is still sent; the toast names the
         failed link (§09). After Save the board read must show the link,
         or the page says it has not caught up.
       - Links waiting on an allocation that is gone, or that someone
         else linked meanwhile, are dropped on the next read, and said.
       - Link is offered only on Article and Other allocations: the panel
         lists articles. Events and RE pages link in slice 4.
     HARDCODING (provisional ids, for the doc-maintenance chat)
       HC-P-IPP4-3  LINKABLE: Link is offered on allocations that focus as
                    article or other (ALLOC_FOCUS words). By design until
                    slice 4 lists events and listings.
       HC-P-IPP4-4  Copy for Link, Create and link and their notes. By
                    design (copy).
     v1.15 (from v1.14). Pairs ipp-picker-markup-v1.10.js and
       ipp-picker-v1.15.css.
       - Greeting fields take no line breaks. Enter does nothing, and a
         line break pasted in becomes a space. A line break in a text
         field sent on to Scenario 206 breaks the render (standing risk).
       - Nothing else changed.
     v1.14 (from v1.13, ruled 6 Oct: moving an article between slots is a
       Layout act, IA55). Pairs ipp-picker-v1.13.css,
       ipp-picker-markup-v1.9.js (unchanged).
       - The slot picker no longer offers an article that is saved in
         another slot. It still lists it, greyed, with "in Pos n · move it
         on the Layout tab", so the operator sees where it is.
       - setFill refuses the same move if any path asks for it, and says
         why. No move clears are ever sent from the Picker.
       - Unchanged on the Picker (ruled): fill an empty slot, Empty this
         slot, Add slot, Remove slot, Place.
       - The move code (srcSlot, movingAwayTo, the move clear in Save) is
         kept but cannot run from the Picker. The Layout tab reuses it.
     v1.13 (from v1.12, ruled 6 Oct: banners leave the Picker, IA53).
       Pairs ipp-picker-markup-v1.9.js and ipp-picker-v1.12.css (unchanged).
       - The Picker is editorial. Ads belong on the coming Revenue tab
         (IA54), where OBLIGATIONS inventory meets ad slot availability.
       - No Banner Ads section, no Splash Ad column, no "Banner Ads" row in
         the Content Controller (markup v1.9). Its include-ads switch is
         no longer on the Picker; it moves to Revenue.
       - The Allocations list leaves out ad items: allocations typed
         print-ad or house-ad, anything whose linked asset is an ad, and
         loose rows holding an ad. They stay on the Allocator.
       - Ad rows stay in the plan untouched. Positions stay on the Picker.
       - Includes v1.12 (The Find's Add tile, no doubled "No slots" line).
     v1.12 (from v1.11, first live look on WLN-998). Pairs
       ipp-picker-v1.12.css, ipp-picker-markup-v1.8.js (unchanged).
       - The Find can have an Add tile ("Add The Find") when
         IX_CONFIG.addTypes names "text-ad". No code decides it; the
         config line does. Filling its businesses is still slice 4.
       - An empty section with no Add tile no longer says "No slots in
         this plan" twice (once in its heading, once in its body). The
         heading says it; the body stays empty.
       - Nothing else changed.
     v1.11 (from v1.10, IPP Build S3 · slice 2 · WRITE). Pairs
       ipp-picker-v1.11.css, ipp-picker-markup-v1.8.js, ipp-shell-v1.8.js
       (unchanged) and Data Worker ix-issue-data v1.0.12.
       Spec: IPP-Allocations-Scoping-v0_5.md §06 R1 to R6, §09, with the
       S1 closure's corrections (124 v2.14 routes).
       - FILL A SLOT. Click an article tile. A panel opens on it: this
         plan's own articles first, then "Show available assets" (the
         publisher's other articles, with search), then "Empty this slot".
         An article already in another slot says "moves here"; picking it
         fills this slot and empties the old one on Save.
       - PLACE FROM THE LIST (R3). Plain lines (and available lines) have
         Place. Every empty article slot is outlined; click one. Esc or
         Cancel stops.
       - ONE-TAP ADD (R1, IA24). Articles, Events and Real Estate end with
         an Add tile. It adds a slot of that section's type right away,
         gold and marked New, with its own Cancel. A new article slot can
         be filled before Save. What Add makes comes from the plan board
         (IX_CONFIG.addTypes via Data Worker v1.0.12); no option id is
         typed here. Position: the first free whole number after the
         section's last slot (the Layout tab sets exact order).
       - REMOVE SLOT. Empty article, events and real estate tiles carry a
         small Remove slot link. A filled slot has none: empty it first.
       - PENDING, GOLD, CANCEL (R5, standing rules). Every change waits in
         JS (never in the DOM), so it persists while the operator moves
         around and the board redraws. Each pending tile and line has the
         gold border and its own small Cancel. The save bar says what
         Save will write and has Cancel all.
       - SAVE (R6, §09). One Save, through Scenario 124 v2.14 at
         PP_WEBHOOKS.blockWriter, in this order: create, fill, clear,
         delete. A move empties the old slot only after the new slot has
         the article. A loose row is deleted only after its fill landed.
         Every value sent is compared with what Webflow sent back; a
         missing result is a failure. What landed leaves the pending list;
         what did not stays gold with "Did not save: why", ready to retry.
       - GREEN ONLY FROM THE READ (IA18, TOAST-TRUTH). After Save the page
         reads /plan-board again. A tile turns green only when that read
         shows the article. If a confirmed fill is not on the read yet,
         the page says so instead of painting green.
       - LOOSE ROW LEFT. A loose row whose article is already in a slot
         shows "loose row left" with Retry (removes it on Save).
       - THE GREETING USES THE PLAN'S GR ROW (S2 closure §05 item 1). The
         card reads and updates the GR row the board names. It no longer
         reads the hidden NL-BLOCKS list the page never rendered, so a
         Greeting Save no longer creates a second GR row. Save waits for
         the board. Its webhook (PP_WEBHOOKS.ipp) cannot answer the page,
         so the card re-reads the plan and says "Greeting saved" only when
         the three fields read back as sent.
       - PAID ON LINES. A line shows the Customer only on a paid item
         (Data Worker v1.0.12: the rule, Article + Customer, or the hand
         override).
       - The ix-refresh bus hears 'nl-blocks:written' { planId, source,
         rows } after a Save, when ix-refresh-helper is on the page.
       - The page asks before leaving with changes waiting.
       - Unchanged: IPP.editState, the Content Controller and its per-click
         save, focus and chips, available assets, the print-page link.
         ipp-dropdown v1.0 still loads; no tile uses it.
       NOT IN THIS VERSION: banner ad filling (out of scope), Events, RE and
       The Find list fills (slice 4), Link and Link and place (slice 3,
       103B link), the "Already in WLN-121A" flag across plans (R4).
     HARDCODING (provisional ids, for the doc-maintenance chat)
       HC-P-IPP3-3  GR_CHECK_TRIES 4 × GR_CHECK_GAP_MS 2500: how long the
                    Greeting waits for its write to show on a read. By
                    design (Make's usual run time).
       HC-P-IPP3-4  ADD_LABEL copy for the Add tiles. By design (copy).
       HC-P-IPP3-5  BATCH_URL_CEILING 1800 and BATCH_CHUNK 15, the same
                    values as the Allocator's 124 calls. By design.
       HC-P-IPP3-6  New slot names "<plan name>-b<position>" and slot keys
                    "slot-<position>", Scenario 126's own pattern. By design.
       GR_NEW_POSITION '1' (existing): only when the plan has no GR row.
       HC-P-IPP2-3/4/5 and HC-P-IA-1/2/6/11 apply as before.
     v1.10 and earlier: see ipp-picker-v1.10.js.
   ============================================================ */
(function () {
  'use strict';
  if (!window.IPP) { console.error('[ipp-picker] shell not loaded'); return; }
  var IPP = window.IPP;
  var VERSION = '1.17';
  var FILE = 'ipp-picker-v1.17.js';

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
     GREETING — the plan's GR row (v1.11)
     The card reads and updates the GR row the plan board names
     (Data Worker v1.0.12 answers greeting {title, paragraph,
     supershort} on it). It no longer looks in a hidden NL-BLOCKS
     list, which the page never rendered and which made every Save
     create a second GR row.
     The write still goes to PP_WEBHOOKS.ipp (op block-save), which
     cannot answer the page (no-cors). So the card proves the write
     the other way: it reads the plan back and compares the three
     fields with what it sent (TOAST-TRUTH). Saved is said only when
     the read matches.
     ────────────────────────────────────────────────────────── */

  var GR_FIELDS = [
    { name:'title',      id:'ipp_greetingTitle',      payload:'grTitle',      count:'ipp_greetTitleCount', max:30  },
    { name:'paragraph',  id:'ipp_greetingParagraph',  payload:'grParagraph',  count:'ipp_greetParaCount',  max:300 },
    { name:'supershort', id:'ipp_greetingSupershort', payload:'grSupershort', count:'ipp_greetSSCount',    max:140 }
  ];
  /* Used only when the board says the plan has NO GR row: the new row
     goes first. Existing default, by design (greeting opens the issue). */
  var GR_NEW_POSITION = '1';
  var GR_CHECK_TRIES = 4, GR_CHECK_GAP_MS = 2500;   // HC-P-IPP3-3: read-back wait
  var GR = { ready:false, nlbId:'', position:'', saving:false };
  var grWired = false;

  function grField(name){ for(var i=0;i<GR_FIELDS.length;i++) if(GR_FIELDS[i].name===name) return GR_FIELDS[i]; return null; }
  function grInput(name){ var f=grField(name); return f?document.getElementById(f.id):null; }
  function grCard(){ return document.getElementById('ippCatGreeting'); }
  function grRow(b){
    var s=(b&&b.slots)||[];
    for(var i=0;i<s.length;i++) if(s[i].blockType==='GR') return s[i];
    return null;
  }

  function grSetCount(name){
    var f=grField(name); var el=grInput(name); if(!f||!el) return;
    var c=document.getElementById(f.count); if(!c) return;
    var n=(el.value||'').length; c.textContent=String(n);
    var wrap=c.parentNode;
    if(wrap){
      wrap.classList.toggle('near', n>=Math.floor(f.max*0.85) && n<f.max);
      wrap.classList.toggle('at',   n>=f.max);
    }
  }
  function grAiCandidateFits(cand){
    cand=cand||{}; var ok=true;
    GR_FIELDS.forEach(function(f){ var v=cand[f.name]; if(v!=null && String(v).length>f.max) ok=false; });
    return ok;
  }
  function grAiApply(cand){
    if(!grAiCandidateFits(cand)) return false;
    GR_FIELDS.forEach(function(f){ var el=grInput(f.name); if(el && cand[f.name]!=null) el.value=String(cand[f.name]); });
    grPaintAll();
    return true;
  }
  function grDirtyCount(){ return EditState.dirtyKeys('greeting').length; }
  function grPaintAll(){ GR_FIELDS.forEach(function(f){ grSetCount(f.name); }); EditState.reflect('greeting'); }

  // The savebar line is owned by the board (paintSavebar); the greeting
  // hook drives only its own card's Save and Cancel.
  EditState.onReflect('greeting', function(n){
    var save=document.getElementById('ipp_grSave');
    if(save) save.disabled=(n===0 || !GR.ready || GR.saving);
    var cancel=document.getElementById('ipp_grCancel'); if(cancel) cancel.hidden=(n===0);
    paintSavebar();
  });

  function grRevert(){
    EditState.revert('greeting');
    GR_FIELDS.forEach(function(f){ grSetCount(f.name); });
  }

  // Board answered: take the GR row's id and, unless the operator has
  // edits waiting, its words (a pending edit is never overwritten).
  function grFromBoard(b){
    var row=grRow(b);
    GR.ready=true;
    GR.nlbId=row?row.id:'';
    GR.position=row?String(row.position):GR_NEW_POSITION;
    var g=(row&&row.greeting)||{ title:'', paragraph:'', supershort:'' };
    if(grDirtyCount()===0 && !GR.saving){
      GR_FIELDS.forEach(function(f){ var el=grInput(f.name); if(el) el.value=String(g[f.name]||''); });
      EditState.commit('greeting');
    }
    grPaintAll();
  }

  function grSave(){
    if(grDirtyCount()===0 || GR.saving) return;
    if(!GR.ready){ say('The plan has not been read yet. Wait a moment, then Save.', 'err'); return; }
    var t=IPP.tenant();
    var sent={};
    GR_FIELDS.forEach(function(f){ sent[f.name]=(grInput(f.name)||{}).value||''; });
    if(!t.pubplanId || !(window.PP_WEBHOOKS && window.PP_WEBHOOKS.ipp)){
      say('Can\u2019t save the greeting: this page has no PP_WEBHOOKS.ipp address.', 'err'); return;
    }
    var payload={
      op:'block-save', blockType:'gr', stage:'planning',
      pubplanId:t.pubplanId, titleAdminId:t.titleAdminId,
      position:GR.position, nlbId:GR.nlbId,
      grTitle:sent.title, grParagraph:sent.paragraph, grSupershort:sent.supershort
    };
    var save=document.getElementById('ipp_grSave');
    GR.saving=true; if(save){ save.disabled=true; save.textContent='Saving\u2026'; }
    paintSavebar();
    var done=function(kind, msg){
      GR.saving=false; if(save) save.textContent='Save';
      EditState.reflect('greeting');
      say(msg, kind);
    };
    IPP.post('ipp',payload).then(function(){
      var tries=0;
      var check=function(){
        tries++;
        IPP.board.load({ fresh:true }).then(function(b){
          var row=grRow(b), g=(row&&row.greeting)||{};
          var same=row && GR_FIELDS.every(function(f){ return String(g[f.name]||'')===sent[f.name]; });
          if(same){ GR.saving=false; grFromBoardAfterSave(b); done('ok','Greeting saved.'); return; }
          if(tries<GR_CHECK_TRIES){ setTimeout(check, GR_CHECK_GAP_MS); return; }
          done('unverified','The greeting was sent, but the plan does not show it yet. Your edits are kept. Reload in a minute to check.');
        }, function(e){
          done('unverified','The greeting was sent, but the plan could not be read back to check it: '+((e&&e.message)||e));
        });
      };
      setTimeout(check, GR_CHECK_GAP_MS);
    }).catch(function(err){
      console.error('[ipp-picker] block-save (gr)',err);
      done('err','The greeting did not send. Your edits are kept.');
    });
  }
  function grFromBoardAfterSave(b){
    // the read matched what was sent: take it as the new original
    var row=grRow(b); GR.nlbId=row?row.id:GR.nlbId; GR.position=row?String(row.position):GR.position;
    EditState.commit('greeting'); grPaintAll();
  }

  function wireGreeting(){
    if(grWired) return;
    var card=grCard(); if(!card) return;
    grWired=true;
    GR_FIELDS.forEach(function(f){
      var el=grInput(f.name); if(!el) return;
      EditState.register('greeting', f.name, {
        el: el,
        getValue: function(){ return el.value; },
        setValue: function(v){ el.value = (v==null?'':v); },
        compatChanged: true
      });
      // v1.15: one line only. A line break reaching 206 breaks the render.
      el.addEventListener('keydown',function(e){ if(e.key==='Enter') e.preventDefault(); });
      el.addEventListener('input',function(){
        if(/[\r\n]/.test(el.value)){
          var at=el.selectionStart;
          el.value=el.value.replace(/\r\n|[\r\n]/g,' ');
          try{ el.setSelectionRange(at,at); }catch(err){}
        }
        grSetCount(f.name); EditState.touched('greeting', f.name);
      });
    });
    var save=document.getElementById('ipp_grSave');     if(save)   save.addEventListener('click',grSave);
    var cancel=document.getElementById('ipp_grCancel'); if(cancel) cancel.addEventListener('click',grRevert);
    grPaintAll();
  }


  /* ════════════════════════════════════════════════════════════
     THE BOARD — tiles, the Allocations list, and (v1.11) writes
     ════════════════════════════════════════════════════════════ */

  /* HC-P-IPP2-3: the Allocator's type words, as the asset type they focus as. */
  var ALLOC_FOCUS = { 'article':'article', 'events-page':'event', 're-page':'re',
                      'print-ad':'ad', 'house-ad':'ad', 'other':'other' };
  /* HC-P-IPP2-4 */
  var MISSING_WORD = { article:'no article', event:'no event', re:'no listing', ad:'no ad', other:'nothing linked' };
  var TYPE_WORD = { event:'Events page', re:'RE page', ad:'Ad', other:'Other' };
  var LIST_NOUN = { event:['event','events'], re:['listing','listings'], 'text-ad':['business','businesses'] };
  /* HC-P-IPP3-4: what each Add tile is called (copy). */
  var ADD_LABEL = { article:'Add article', event:'Add events', re:'Add real estate', 'text-ad':'Add The Find' };
  /* HC-P-IPP2-5 */
  var AVAIL_MAX = 60;
  /* HC-P-IPP3-5: 124's write contract, as the Allocator uses it. */
  var BATCH_URL_CEILING = 1800, BATCH_CHUNK = 15;
  /* Which tile container shows which asset type's slots. */
  var TILE_BOX = { article:'ipp_artTiles', event:'ipp_evTiles', re:'ipp_reTiles', 'text-ad':'ipp_txaTiles' };

  var FOCUS = '';          // '' | 'article' | 'event' | 're'
  var BOARD = null;        // last good /plan-board answer
  var AVAIL = { open:false, items:null, titles:[], truncated:false, error:'', loading:false, q:'' };

  /* ── PENDING: everything Save will write (v1.11) ─────────────
     Lives in JS, never in the DOM, so a selection persists while the
     operator moves around and the board redraws.
       adds    [ { key:'new-1', assetType, blockType, position } ]
       fills   key -> { asset:{kind,id,name,thumb,customer}, srcLoose, srcSlot }
               key is a slot id, or an add's key
       clears  slot id -> true   (Empty this slot)
       removes slot id -> true   (Remove slot)
       fails   key -> why        (the last Save did not land it)
     Gold means waiting for Save. Green comes only from the board's
     own read after Save (IA18, TOAST-TRUTH). */
  var P = { adds:[], fills:{}, clears:{}, removes:{}, links:{}, fails:{}, seq:0, saving:false };
  /* v1.16: links  allocation id -> { asset:{kind,id,name,thumb} }
     A link failure is kept in fails under 'link:<allocation id>'. */
  var ARMED = null;        // Place: { asset, srcLoose, srcSlot, title, linkTo }
  var SP = { key:'', avail:false, q:'', mode:'slot', allocId:'' };   // the open panel
  /* HC-P-IPP4-3: allocations Link is offered on (the panel lists articles). */
  var LINKABLE = { article:1, other:1 };

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function plural(n, pair){ return n + ' ' + (n === 1 ? pair[0] : pair[1]); }
  function view(){ return IPP.q('.ipp-view[data-view="picker"]'); }
  function canvasEl(){ var v = view(); return v && IPP.q('.ipp-canvas', v); }
  function byId(id){ return document.getElementById(id); }
  function hasOwn(o,k){ return Object.prototype.hasOwnProperty.call(o,k); }

  function say(msg, kind){
    if (window.IxToast && typeof window.IxToast.show === 'function') {
      window.IxToast.show(msg, kind === 'ok' ? 'ok' : (kind === 'err' ? 'err' : (kind === 'unverified' ? 'unverified' : 'info')),
        { key:'ipp-picker:' + (kind || 'info') });
      return;
    }
    IPP.toast(esc(msg), kind === 'err' || kind === 'unverified');
  }

  // Redraw without moving the view (standing rule).
  function keepScroll(fn){
    var c = canvasEl(), l = byId('ipp_alList');
    var ct = c ? c.scrollTop : 0, lt = l ? l.scrollTop : 0;
    fn();
    if (c) c.scrollTop = ct;
    if (l) l.scrollTop = lt;
  }

  // ── board lookups ─────────────────────────────────────────
  function slots(){ return (BOARD && BOARD.slots) || []; }
  function slotById(id){ var s = slots(); for (var i=0;i<s.length;i++) if (s[i].id === id) return s[i]; return null; }
  function looseById(id){ var l = (BOARD && BOARD.loose) || []; for (var i=0;i<l.length;i++) if (l[i].id === id) return l[i]; return null; }
  function addByKey(k){ for (var i=0;i<P.adds.length;i++) if (P.adds[i].key === k) return P.adds[i]; return null; }
  function posOf(key){ var s = slotById(key); if (s) return s.position; var a = addByKey(key); return a ? a.position : '?'; }
  function acceptsField(assetType){ var a = (BOARD && BOARD.accepts) || {}; return a[assetType]; }
  // Where an asset sits on the saved board: { slotId, position } or null.
  function savedSlotOf(assetId){
    var s = slots();
    for (var i=0;i<s.length;i++) if (s[i].asset && s[i].asset.id === assetId) return { slotId:s[i].id, position:s[i].position };
    return null;
  }
  function pendingKeyFor(assetId){
    for (var k in P.fills) if (hasOwn(P.fills,k) && P.fills[k].asset.id === assetId) return k;
    return '';
  }
  // v1.16 — links
  function allocById(id){ var a = (BOARD && BOARD.allocations) || []; for (var i=0;i<a.length;i++) if (a[i].id === id) return a[i]; return null; }
  function linkField(){ return (BOARD && BOARD.linkFields && BOARD.linkFields.article) || ''; }
  function canLink(a){ return !!a && !a.asset && !!LINKABLE[ALLOC_FOCUS[a.type] || 'other'] && !!linkField(); }
  // The allocation an article is waiting to be linked to, or ''.
  function linkWaitFor(assetId){
    for (var k in P.links) if (hasOwn(P.links,k) && P.links[k].asset.id === assetId) return k;
    return '';
  }
  // The saved allocation on this plan that already names an article, or null.
  function allocOfAsset(assetId){
    var a = (BOARD && BOARD.allocations) || [];
    for (var i=0;i<a.length;i++) if (a[i].asset && a[i].asset.id === assetId) return a[i];
    return null;
  }
  function setLink(allocId, asset){
    var a = allocById(allocId);
    if (!canLink(a)) { say('That allocation cannot take a link here.', 'info'); return false; }
    var on = allocOfAsset(asset.id);
    if (on) { say('\u201c' + (asset.name || 'That article') + '\u201d is already linked to the p.' + (on.page == null ? '?' : on.page) + ' allocation.', 'info'); return false; }
    var other = linkWaitFor(asset.id); if (other && other !== allocId) { delete P.links[other]; delete P.fails['link:' + other]; }
    P.links[allocId] = { asset:{ kind:'article', id:asset.id, name:asset.name || '', thumb:asset.thumb || '' } };
    delete P.fails['link:' + allocId];
    changed();
    return true;
  }
  function cancelLinkOf(allocId){ delete P.links[allocId]; delete P.fails['link:' + allocId]; changed(); }

  // A saved slot whose article is moving to another slot, and nothing
  // else is waiting on it: the move will empty it.
  function movingAwayTo(slotId){
    if (P.fills[slotId] || P.removes[slotId] || P.clears[slotId]) return '';
    for (var k in P.fills) if (hasOwn(P.fills,k) && P.fills[k].srcSlot === slotId) return k;
    return '';
  }
  function isEmptySaved(s){ return !s.asset && !(Number(s.listCount) > 0); }
  function fillable(s){ return s.assetType === 'article' && acceptsField('article') && acceptsField('article') !== 'list'; }

  // ── pending actions ───────────────────────────────────────
  function changed(){ delete P.fails.__save; redraw(); }

  function setFill(key, asset, src){
    src = src || {};
    var s = slotById(key);
    // the slot already holds this article: nothing to write
    if (s && s.asset && s.asset.id === asset.id) { delete P.fills[key]; delete P.clears[key]; delete P.fails[key]; changed(); return; }
    // one article, one slot: drop any other waiting fill of it
    var other = pendingKeyFor(asset.id); if (other && other !== key) { delete P.fills[other]; delete P.fails[other]; }
    var saved = savedSlotOf(asset.id);
    // v1.14 (IA55): moving a saved article between slots is a Layout act.
    if (saved && saved.slotId !== key) {
      say('\u201c' + (asset.name || 'That article') + '\u201d is already in Pos ' + saved.position +
          '. Moving it between slots is done on the Layout tab.', 'info');
      return;
    }
    P.fills[key] = {
      asset: { kind:asset.kind || 'article', id:asset.id, name:asset.name || '', thumb:asset.thumb || '', customer:asset.customer || '' },
      srcLoose: src.srcLoose || '',
      srcSlot: (saved && saved.slotId !== key) ? saved.slotId : ''
    };
    delete P.clears[key]; delete P.removes[key]; delete P.fails[key];
    changed();
  }
  function setClear(key){
    if (addByKey(key)) { delete P.fills[key]; changed(); return; }
    var s = slotById(key);
    delete P.fills[key]; delete P.fails[key];
    if (s && s.asset) P.clears[key] = true;
    changed();
  }
  function toggleRemove(id){
    if (P.removes[id]) delete P.removes[id]; else P.removes[id] = true;
    delete P.fails[id];
    changed();
  }
  function addSlot(section){
    var at = BOARD && BOARD.addTypes && BOARD.addTypes[section];
    if (!at) { say('This plan cannot add a slot here: the plan data names no Add type for it (IX_CONFIG.addTypes).', 'err'); return; }
    P.seq++;
    P.adds.push({ key:'new-' + P.seq, assetType:at.assetType, blockType:at.blockType, position:newPosition(section) });
    changed();
  }
  // Cancel one thing. A key is a slot id or an add's key.
  function cancelKey(key){
    var i;
    for (i = 0; i < P.adds.length; i++) if (P.adds[i].key === key) { P.adds.splice(i,1); delete P.fills[key]; delete P.fails[key]; changed(); return; }
    var away = movingAwayTo(key);
    if (away) { delete P.fills[away]; delete P.fails[away]; changed(); return; }
    delete P.fills[key]; delete P.clears[key]; delete P.removes[key]; delete P.fails[key];
    changed();
  }
  function cancelAll(){
    P.adds = []; P.fills = {}; P.clears = {}; P.removes = {}; P.links = {}; P.fails = {};
    ARMED = null; closeSlotPicker();
    redraw();
  }
  function pendingCounts(){
    var c = { added:P.adds.length, removed:0, filled:0, emptied:0, loose:0, linked:Object.keys(P.links).length };
    for (var k in P.fills) if (hasOwn(P.fills,k)) {
      if (!addByKey(k)) c.filled++;
      if (P.fills[k].srcLoose) c.loose++;
      if (P.fills[k].srcSlot && !P.fills[P.fills[k].srcSlot] && !P.removes[P.fills[k].srcSlot] && !P.clears[P.fills[k].srcSlot]) c.emptied++;
    }
    for (k in P.clears) if (hasOwn(P.clears,k)) c.emptied++;
    for (k in P.removes) if (hasOwn(P.removes,k)) { if (looseById(k)) c.loose++; else c.removed++; }
    c.total = c.added + c.removed + c.filled + c.emptied + c.loose + c.linked;
    return c;
  }
  function anyPending(){ return pendingCounts().total > 0; }

  // First free whole position after the section's last slot (the Layout
  // tab sets the exact order). Never one a row or a waiting Add holds.
  function newPosition(section){
    var used = {}, last = 0, maxAll = 0;
    slots().forEach(function(s){ used[s.position] = 1; if (s.position > maxAll) maxAll = s.position; if (s.assetType === section && s.position > last) last = s.position; });
    ((BOARD && BOARD.loose) || []).forEach(function(l){ used[l.position] = 1; });
    P.adds.forEach(function(a){ used[a.position] = 1; if (a.assetType === section && a.position > last) last = a.position; });
    var p = Math.floor(last || maxAll) + 1;
    while (used[p]) p++;
    return p;
  }

  // ── tiles ────────────────────────────────────────────────
  function thumbHtml(url, cls){
    if (!url) return '<div class="' + cls + ' ipp-ghost-img"></div>';
    return '<div class="' + cls + ' ipp-slot-thumb" style="background-image:url(&quot;' + esc(url) + '&quot;)"></div>';
  }
  function check(){ return '<span class="ipp-slot-check" aria-label="Filled and saved">\u2713</span>'; }
  function cancelLink(key, label){
    return '<button type="button" class="ix-revert ipp-tile-cancel" data-ipp-cancel="' + esc(key) + '"' +
      ' aria-label="' + esc(label || 'Cancel this change') + '">Cancel</button>';
  }
  function failLine(key){
    return P.fails[key] ? '<div class="ipp-tile-fail">Did not save: ' + esc(P.fails[key]) + '</div>' : '';
  }
  function targetCls(s, key){
    if (!ARMED) return '';
    var empty = s ? (isEmptySaved(s) && !P.removes[key]) : true;
    return (empty && !P.fills[key] && (s ? fillable(s) : true)) ? ' ipp-slot--target' : '';
  }

  function articleTile(s){
    var key = s.id, a = s.asset, f = P.fills[key];
    var head = '<span class="pos-tag">Pos ' + esc(s.position) + '</span>';
    if (P.removes[key]) {
      return '<div class="ipp-ctile ghost ipp-slot ipp-dirty ipp-slot--removing" data-slot-key="' + esc(key) + '">' + head +
        '<div class="ipp-ghost-img"></div><div class="ipp-tmeta ipp-tile-word">Slot will be removed</div>' +
        failLine(key) + '<div class="ipp-tile-actions">' + cancelLink(key, 'Keep this slot') + '</div></div>';
    }
    if (f) {
      return '<div class="ipp-ctile filled ipp-slot ipp-dirty" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head +
        thumbHtml(f.asset.thumb, 'ipp-art-thumb') +
        '<div class="ipp-ttitle">' + esc(f.asset.name || 'Untitled article') + '</div>' +
        '<div class="ipp-tmeta ipp-tile-word">' + (a ? 'Replaces \u201c' + esc(a.name || 'article') + '\u201d' : 'Fills on Save') + '</div>' +
        failLine(key) + '<div class="ipp-tile-actions">' + cancelLink(key, 'Cancel this fill') + '</div></div>';
    }
    if (P.clears[key]) {
      return '<div class="ipp-ctile ghost ipp-slot ipp-dirty" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head +
        '<div class="ipp-ghost-img"></div><div class="ipp-ttitle">' + esc(a ? a.name : '') + '</div>' +
        '<div class="ipp-tmeta ipp-tile-word">Empties on Save</div>' +
        failLine(key) + '<div class="ipp-tile-actions">' + cancelLink(key, 'Keep this article') + '</div></div>';
    }
    var away = movingAwayTo(key);
    if (away) {
      return '<div class="ipp-ctile ghost ipp-slot ipp-dirty" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head +
        '<div class="ipp-ghost-img"></div><div class="ipp-ttitle">' + esc(a ? a.name : '') + '</div>' +
        '<div class="ipp-tmeta ipp-tile-word">Moving to Pos ' + esc(posOf(away)) + '</div>' +
        '<div class="ipp-tile-actions">' + cancelLink(key, 'Cancel the move') + '</div></div>';
    }
    if (a && a.missing) {
      return '<div class="ipp-ctile ipp-slot ipp-slot--bad" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head +
        '<div class="ipp-ghost-img"></div><div class="ipp-ttitle">Article not found</div><div class="ipp-tmeta">' + esc(a.id) + '</div></div>';
    }
    if (a) {
      return '<div class="ipp-ctile filled ipp-slot ipp-slot--ok" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head + check() +
        thumbHtml(a.thumb, 'ipp-art-thumb') +
        '<div class="ipp-ttitle">' + esc(a.name || 'Untitled article') + '</div>' +
        '<div class="ipp-tmeta">' + (a.customer ? esc(a.customer) : '') + '</div></div>';
    }
    return '<div class="ipp-ctile ghost ipp-slot' + targetCls(s, key) + '" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head +
      '<div class="ipp-ghost-img"></div><div class="ipp-ghost-line long"></div><div class="ipp-ghost-line short"></div>' +
      '<div class="ipp-tmeta">Empty article slot</div>' + failLine(key) +
      '<div class="ipp-tile-actions"><button type="button" class="ix-revert ipp-tile-remove" data-ipp-remove="' + esc(key) + '">Remove slot</button></div></div>';
  }
  function newArticleTile(n){
    var key = n.key, f = P.fills[key];
    var head = '<span class="pos-tag">New \u00b7 Pos ' + esc(n.position) + '</span>';
    var body = f
      ? thumbHtml(f.asset.thumb, 'ipp-art-thumb') + '<div class="ipp-ttitle">' + esc(f.asset.name || 'Untitled article') + '</div>' +
        '<div class="ipp-tmeta ipp-tile-word">New slot, filled on Save</div>'
      : '<div class="ipp-ghost-img"></div><div class="ipp-ghost-line long"></div>' +
        '<div class="ipp-tmeta ipp-tile-word">New article slot</div>';
    return '<div class="ipp-ctile ' + (f ? 'filled' : 'ghost') + ' ipp-slot ipp-dirty ipp-slot--new' + (f ? '' : targetCls(null, key)) +
      '" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head + body + failLine(key) +
      '<div class="ipp-tile-actions">' + cancelLink(key, 'Cancel this new slot') + '</div></div>';
  }
  function addTile(section){
    if (!(BOARD && BOARD.addTypes && BOARD.addTypes[section])) return '';
    var cls = section === 'article' ? 'ipp-ctile add ipp-add-tile' : 'ipp-list-tile ipp-add-tile';
    return '<button type="button" class="' + cls + '" data-ipp-add="' + esc(section) + '">' +
      '<span class="ipp-add-circle">+</span><span class="ipp-add-lbl">' + esc(ADD_LABEL[section] || 'Add') + '</span></button>';
  }
  function atLine(s){
    return '<div class="ipp-at-line" data-slot-id="' + esc(s.id) + '" data-ipp-focus="">' +
      '<span class="ipp-at-tag">Around Town</span>' +
      '<span class="ipp-at-teaser">' + (s.blockText ? esc(s.blockText) : '<i>No teaser yet</i>') + '</span>' +
      '<span class="pos-tag">Pos ' + esc(s.position) + '</span></div>';
  }
  function listTile(s){
    var key = s.id, n = Number(s.listCount) || 0;
    var noun = LIST_NOUN[s.assetType] || ['item','items'];
    var head = '<span class="pos-tag">Pos ' + esc(s.position) + '</span>';
    if (P.removes[key]) {
      return '<div class="ipp-list-tile ghost ipp-slot ipp-dirty ipp-slot--removing" data-slot-key="' + esc(key) + '">' + head +
        '<div class="ipp-list-count">Slot will be removed</div>' + failLine(key) +
        '<div class="ipp-tile-actions">' + cancelLink(key, 'Keep this slot') + '</div></div>';
    }
    var canRemove = n === 0 && (s.assetType === 'event' || s.assetType === 're');
    return '<div class="ipp-list-tile ipp-slot ' + (n > 0 ? 'ipp-slot--ok' : 'ghost') + '" data-slot-key="' + esc(key) + '">' + head +
      (n > 0 ? check() : '') + '<div class="ipp-list-count">' + (n > 0 ? plural(n, noun) : 'No ' + noun[1] + ' yet') + '</div>' +
      failLine(key) +
      (canRemove ? '<div class="ipp-tile-actions"><button type="button" class="ix-revert ipp-tile-remove" data-ipp-remove="' + esc(key) + '">Remove slot</button></div>' : '') +
      '</div>';
  }
  function newListTile(n){
    var noun = LIST_NOUN[n.assetType] || ['item','items'];
    return '<div class="ipp-list-tile ghost ipp-slot ipp-dirty ipp-slot--new" data-slot-key="' + esc(n.key) + '">' +
      '<span class="pos-tag">New \u00b7 Pos ' + esc(n.position) + '</span>' +
      '<div class="ipp-list-count">New slot, no ' + esc(noun[1]) + ' yet</div>' + failLine(n.key) +
      '<div class="ipp-tile-actions">' + cancelLink(n.key, 'Cancel this new slot') + '</div></div>';
  }

  function secCount(key, list, filledFn){
    var el = IPP.q('[data-ipp-sec-count="' + key + '"]'); if (!el) return;
    if (!list.length) { el.innerHTML = '<span class="ipp-muted">No slots in this plan</span>'; return; }
    var f = list.filter(filledFn).length;
    el.innerHTML = '<b>' + list.length + '</b> slot' + (list.length === 1 ? '' : 's') + ' \u00b7 <b>' + f + '</b> filled';
  }
  function ccCount(key, text){
    var el = IPP.q('[data-ipp-cc-count="' + key + '"]'); if (!el) return;
    el.textContent = text || ''; el.hidden = !text;
  }
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
    var group = { article:[], ad:[], 'text-ad':[], re:[], event:[], none:[], gr:[] };
    var artFlow = [];
    ((b && b.slots) || []).forEach(function(s){
      if (s.assetType === null || s.assetType === undefined) { group.none.push(s); return; }
      if (s.assetType === 'article') { group.article.push(s); artFlow.push(s); return; }
      if (s.assetType === 'other') {
        if (s.blockType === 'AT') artFlow.push(s);
        if (s.blockType === 'GR') group.gr.push(s);
        return;
      }
      if (group[s.assetType]) group[s.assetType].push(s);
    });
    var addsOf = function(t){ return P.adds.filter(function(a){ return a.assetType === t; }); };
    var filled = function(s){ return !!(s.asset && !s.asset.missing); };
    var listed = function(s){ return Number(s.listCount) > 0; };

    keepScroll(function(){
      var at = byId(TILE_BOX.article);
      if (at) {
        var html = artFlow.map(function(s){ return s.assetType === 'article' ? articleTile(s) : atLine(s); }).join('') +
          addsOf('article').map(newArticleTile).join('') + addTile('article');
        at.innerHTML = html || '<div class="ipp-sec-empty">No article slots in this plan.</div>';
      }
      // v1.13: ad slots are not drawn on the Picker (IA53, the Revenue tab).
      [['text-ad'],['re'],['event']].forEach(function(p){
        var t = p[0], el = byId(TILE_BOX[t]); if (!el) return;
        var html = group[t].map(listTile).join('') + addsOf(t).map(newListTile).join('') + addTile(t);
        el.innerHTML = html;   // v1.12: the heading already says "No slots in this plan"
        el.hidden = !html;
      });
      var ut = byId('ipp_untypedList'), us = byId('ippCatUntyped');
      if (ut) ut.innerHTML = group.none.map(function(s){
        return '<div class="ipp-untyped-row">Pos ' + esc(s.position) + ' \u00b7 ' +
          (s.blockType ? 'block type ' + esc(s.blockType) : 'no block type') + '</div>';
      }).join('');
      if (us) us.hidden = !group.none.length;

      secCount('articles', group.article, filled);
      secCount('txa', group['text-ad'], listed);
      secCount('re', group.re, listed);
      secCount('events', group.event, listed);

      var slotWord = function(n){ return n ? n + ' slot' + (n === 1 ? '' : 's') : ''; };
      ccCount('greeting', group.gr.length ? 'In plan' : '');
      ccCount('articles', slotWord(group.article.length));
      ccCount('txa', slotWord(group['text-ad'].length));
      ccCount('re', slotWord(group.re.length));
      ccCount('events', slotWord(group.event.length));
      ccFromBoard('greeting', group.gr.length);
      ccFromBoard('articles', group.article.length + addsOf('article').length);
      ccFromBoard('txa', group['text-ad'].length);
      ccFromBoard('re', group.re.length + addsOf('re').length);
      ccFromBoard('events', group.event.length + addsOf('event').length);

      var warns = (b && b.meta && b.meta.warnings) || [];
      if (warns.length) {
        setMsg('<details class="ipp-board-notes"><summary>' + plural(warns.length, ['note','notes']) +
          ' from the plan data</summary><ul>' + warns.map(function(w){ return '<li>' + esc(w) + '</li>'; }).join('') +
          '</ul></details>', 'note');
      } else setMsg('', '');
      paintFocus();
      paintPlaceBar();
    });
    renderList();
    paintSavebar();
    if (SP.key) renderSlotPicker();
  }
  function redraw(){ if (BOARD) renderBoard(BOARD); else paintSavebar(); }

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

  // ── Place (R3) ───────────────────────────────────────────
  function arm(asset, src, title){
    ARMED = { asset:asset, srcLoose:(src && src.srcLoose) || '', linkTo:(src && src.linkTo) || '', title:title || asset.name || 'Untitled' };
    closeSlotPicker();
    setFocus('article');
    redraw();
  }
  function disarm(){ if (!ARMED) return; ARMED = null; redraw(); }
  function paintPlaceBar(){
    var bar = byId('ipp_placeBar'); if (!bar) return;
    if (!ARMED) { bar.hidden = true; bar.innerHTML = ''; return; }
    bar.hidden = false;
    bar.innerHTML = '<span>' + (ARMED.linkTo ? 'Linking and placing' : 'Placing') + ' <b>\u201c' + esc(ARMED.title) + '\u201d</b>. Click an empty article slot.</span>' +
      '<button type="button" class="ix-revert" data-ipp-disarm>Cancel</button>';
  }

  // ── the Allocations list ─────────────────────────────────
  function linesOf(b){
    var out = [];
    var allocAssetIds = {};
    // A loose row whose article is already in a slot: its delete did not
    // land ("loose row left", with Retry).
    var inSlot = {}, looseLeft = {};
    ((b && b.slots) || []).forEach(function(s){ if (s.asset && !s.asset.missing) inSlot[s.asset.id] = s.position; });
    ((b && b.loose) || []).forEach(function(l){ if (l.asset && inSlot[l.asset.id] != null) looseLeft[l.asset.id] = l.id; });
    ((b && b.allocations) || []).forEach(function(a){
      if (a.asset) allocAssetIds[a.asset.id] = true;
      var look = !a.asset ? 'salmon' : ((a.placement && !a.placement.loose) ? 'green' : 'plain');
      // v1.16: a link waiting for Save stands in for the article
      var lw = (!a.asset && P.links[a.id]) ? P.links[a.id].asset : null;
      if (lw) {
        var lwLoose = '';
        ((b && b.loose) || []).forEach(function(l){ if (l.asset && l.asset.id === lw.id) lwLoose = l.id; });
        if (lwLoose) allocAssetIds[lw.id] = true;
        out.push({
          key: 'al-' + a.id, allocId: a.id, linkWait: true,
          title: a.printTitle || lw.name || 'Untitled',
          focus: 'article', customer: a.paid ? (a.customer || '') : '',
          page: a.page, pdfPage: a.pdfPage, pdfUrl: a.pdfUrl, library: false,
          look: inSlot[lw.id] != null ? 'green' : 'plain', typeWord: '', missing: '',
          pos: inSlot[lw.id] != null ? inSlot[lw.id] : null,
          assetName: (lw.name && lw.name !== a.printTitle) ? lw.name : '',
          asset: { kind:'article', id:lw.id, name:lw.name || a.printTitle || '', thumb:lw.thumb || '' },
          srcLoose: lwLoose, looseLeft: ''
        });
        return;
      }
      out.push({
        allocId: a.id, canLink: canLink(a),
        key: 'al-' + a.id,
        title: a.printTitle || (a.asset && a.asset.name) || 'Untitled',
        focus: a.asset ? a.asset.kind : (ALLOC_FOCUS[a.type] || 'other'),
        customer: a.paid ? (a.customer || '') : '',
        page: a.page, pdfPage: a.pdfPage, pdfUrl: a.pdfUrl, library: false,
        look: look,
        typeWord: a.asset ? '' : (TYPE_WORD[ALLOC_FOCUS[a.type] || 'other'] || ''),
        missing: MISSING_WORD[ALLOC_FOCUS[a.type] || 'other'] || 'nothing linked',
        pos: (look === 'green') ? a.placement.position : null,
        assetName: (a.asset && a.asset.name && a.asset.name !== a.printTitle) ? a.asset.name : '',
        asset: a.asset ? { kind:a.asset.kind, id:a.asset.id, name:a.asset.name || a.printTitle || '' } : null,
        srcLoose: (a.placement && a.placement.loose) ? a.placement.blockId : '',
        looseLeft: (a.asset && look === 'green') ? (looseLeft[a.asset.id] || '') : ''
      });
    });
    ((b && b.loose) || []).forEach(function(l){
      if (!l.asset || allocAssetIds[l.asset.id]) return;
      var left = inSlot[l.asset.id] != null;
      out.push({
        key: 'lo-' + l.id, title: l.asset.name || 'Untitled', focus: l.asset.kind,
        customer: l.asset.customer || '', page: null, pdfPage: null, pdfUrl: '', library: true,
        look: left ? 'green' : 'plain', pos: left ? inSlot[l.asset.id] : null, assetName: '', typeWord: '', missing: '',
        asset: { kind:l.asset.kind, id:l.asset.id, name:l.asset.name || '', customer:l.asset.customer || '' },
        srcLoose: l.id, looseLeft: left ? l.id : ''
      });
    });
    // needs-you first: loose row left, no article, not in a slot; then waiting; then green
    var weight = function(x){
      if (x.looseLeft && !P.removes[x.looseLeft]) return 0;
      if (x.linkWait || (x.asset && pendingKeyFor(x.asset.id))) return 3;
      if (x.looseLeft) return 3;
      return { salmon:1, plain:2, green:4 }[x.look];
    };
    var pg = function(x){ return x.library ? 1e9 : (Number(x.page) || 0); };
    out.sort(function(x, y){
      var wx = weight(x), wy = weight(y);
      return wx - wy || pg(x) - pg(y) || String(x.title).localeCompare(String(y.title));
    });
    return out;
  }
  var LINES = {};   // key -> line, for the click handlers
  // v1.13 (IA53): ad items belong to the Revenue tab, not the Picker.
  function notAd(l){ return l.focus !== 'ad'; }

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
    var bits = [], waitKey = ln.asset ? pendingKeyFor(ln.asset.id) : '';
    if (ln.typeWord) bits.push('<span class="ipp-al-type">' + esc(ln.typeWord) + '</span>');
    // v1.16: a waiting link says so, with its own Cancel
    if (ln.linkWait) bits.push('<span class="ipp-al-word ipp-al-word--gold">link waiting</span>' +
      '<button type="button" class="ix-revert ipp-tile-cancel ipp-al-linkcancel" data-ipp-cancel-link="' + esc(ln.allocId) + '" aria-label="Cancel this link">Cancel</button>');
    if (ln.customer) bits.push('<span class="ipp-al-cust">' + esc(ln.customer) + '</span>');
    var src = srcHtml(ln); if (src) bits.push(src);
    var action = '';
    if (waitKey) {
      bits.push('<span class="ipp-al-word ipp-al-word--gold">\u2192 Pos ' + esc(posOf(waitKey)) + '</span>');
      action = cancelLink(waitKey, 'Cancel this fill');
    } else if (ln.look === 'salmon') {
      bits.push('<span class="ipp-al-word ipp-al-word--salmon">' + esc(ln.missing) + '</span>');
      if (ln.canLink) action =
        '<button type="button" class="ix-btn ix-btn--secondary ipp-al-place ipp-al-soon" data-ipp-create-link="' + esc(ln.allocId) + '" aria-disabled="true" title="Not wired yet">Create and link</button>' +
        '<button type="button" class="ix-btn ix-btn--secondary ipp-al-place" data-ipp-link="' + esc(ln.allocId) + '">Link</button>';
    } else if (ln.look === 'green') {
      bits.push('<span class="ipp-al-word">Pos ' + esc(ln.pos) + '</span>');
      if (ln.looseLeft && P.removes[ln.looseLeft]) {
        bits.push('<span class="ipp-al-word ipp-al-word--gold">loose row removes on Save</span>');
        action = cancelLink(ln.looseLeft, 'Keep the loose row');
      } else if (ln.looseLeft) {
        bits.push('<span class="ipp-al-word ipp-al-word--salmon">loose row left</span>');
        action = '<button type="button" class="ix-btn ix-btn--secondary ipp-al-place" data-ipp-retry-loose="' + esc(ln.looseLeft) + '">Retry</button>';
      }
    } else {
      bits.push('<span class="ipp-al-word">not in a slot</span>');
      if (ln.asset && ln.asset.kind === 'article')
        action = '<button type="button" class="ix-btn ix-btn--secondary ipp-al-place" data-ipp-place="' + esc(ln.key) + '">Place</button>';
    }
    var look = ln.linkWait || waitKey || (ln.looseLeft && P.removes[ln.looseLeft]) ? 'gold' : ln.look;
    var lf = ln.allocId ? P.fails['link:' + ln.allocId] : '';
    var linking = SP.key && SP.mode === 'link' && SP.allocId === ln.allocId;
    return '<div class="ipp-al-it ipp-al-it--' + look + (ARMED && ln.asset && ARMED.asset.id === ln.asset.id ? ' ipp-al-it--armed' : '') +
      (linking ? ' ipp-al-it--linking' : '') +
      '" data-al-key="' + esc(ln.key) + '">' +
      '<div class="ipp-al-row"><div class="ipp-al-t">' + (ln.look === 'green' && !waitKey ? '<span class="ipp-al-ok">\u2713</span>' : '') + esc(ln.title) + '</div></div>' +
      (ln.assetName ? '<div class="ipp-al-asset">Article: ' + esc(ln.assetName) + '</div>' : '') +
      '<div class="ipp-al-sub">' + bits.join('<span class="ipp-al-dot">\u00b7</span>') + '</div>' +
      (lf ? '<div class="ipp-tile-fail">Link did not save: ' + esc(lf) + '</div>' : '') +
      (action ? '<div class="ipp-al-act">' + action + '</div>' : '') + '</div>';
  }
  function renderList(){
    var el = byId('ipp_alList'); if (!el) return;
    if (!BOARD) { el.innerHTML = '<div class="ipp-al-empty">' + (IPP.board && IPP.board.error() ? '' : 'Reading this plan\u2026') + '</div>'; return; }
    var all = linesOf(BOARD).filter(notAd); LINES = {};
    all.forEach(function(l){ LINES[l.key] = l; });
    var lines = all.filter(function(l){ return !FOCUS || l.focus === FOCUS; });
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
  // The publisher's articles not already on this plan's list, shaped.
  function availRows(q){
    var on = {}, unlinked = [];
    ((BOARD && BOARD.allocations) || []).forEach(function(a){ if (a.asset) on[a.asset.id] = true; else if (canLink(a) && !P.links[a.id]) unlinked.push(a); });
    for (var lk in P.links) if (hasOwn(P.links,lk)) on[P.links[lk].asset.id] = true;   // v1.16: shown on its line
    ((BOARD && BOARD.loose) || []).forEach(function(l){ if (l.asset) on[l.asset.id] = true; });
    var titleName = {}; (AVAIL.titles || []).forEach(function(t){ titleName[t.id] = t.name; });
    var mine = titleAdminId();
    q = String(q || '').trim().toLowerCase();
    var rows = (AVAIL.items || []).filter(function(it){
      if (on[it.id]) return false;
      var n = String((it.fieldData || {}).name || '');
      return !q || n.toLowerCase().indexOf(q) >= 0;
    }).map(function(it){
      var f = it.fieldData || {}, n = String(f.name || '');
      var match = null;
      for (var i = 0; i < unlinked.length; i++) {
        if (n.trim() && String(unlinked[i].printTitle || '').trim().toLowerCase() === n.trim().toLowerCase()) { match = unlinked[i]; break; }
      }
      var t = f['associated-title']; t = Array.isArray(t) ? t[0] : t;
      var saved = savedSlotOf(it.id);
      var thumb = f['main-image-ulc-link---1-1-ratio'] || (f['main-image'] && f['main-image'].url) || '';
      return { id: it.id, name: n, match: match, pos: saved ? saved.position : null, thumb: thumb,
               title: (t && t !== mine) ? (titleName[t] || '') : '', at: String(it.lastUpdated || '') };
    });
    rows.sort(function(a, b){ return (b.match ? 1 : 0) - (a.match ? 1 : 0) || b.at.localeCompare(a.at); });
    return rows;
  }
  var AVAIL_BY_ID = {};
  function renderAvail(){
    var box = IPP.q('.ipp-al-availbox'), list = byId('ipp_alAvailList'), link = IPP.q('[data-ipp-avail-toggle]');
    if (SP.key && SP.avail) renderSlotPicker();
    if (!box || !list) return;
    box.hidden = !AVAIL.open;
    if (link) link.textContent = AVAIL.open ? 'Hide available assets' : 'Show available assets';
    if (!AVAIL.open) return;
    if (AVAIL.error) { list.innerHTML = '<div class="ipp-al-empty ipp-al-empty--bad">' + esc(AVAIL.error) + '</div>'; return; }
    if (AVAIL.loading || !AVAIL.items) { list.innerHTML = '<div class="ipp-al-empty">Reading the publisher\u2019s articles\u2026</div>'; return; }
    var rows = availRows(AVAIL.q), total = rows.length;
    rows.forEach(function(r){ AVAIL_BY_ID[r.id] = r; });
    var html = rows.slice(0, AVAIL_MAX).map(function(r){
      var wait = pendingKeyFor(r.id);
      var look = wait ? 'gold' : (r.pos != null ? 'green' : 'plain');
      var sub = [];
      if (r.title) sub.push('<span class="ipp-al-cust">' + esc(r.title) + '</span>');
      if (wait) sub.push('<span class="ipp-al-word ipp-al-word--gold">\u2192 Pos ' + esc(posOf(wait)) + '</span>');
      else if (r.pos != null) sub.push('<span class="ipp-al-word">Pos ' + esc(r.pos) + '</span>');
      if (r.match) sub.push('<span class="ipp-al-word ipp-al-word--match">Same title as the p.' + esc(r.match.page) + ' allocation</span>');
      var action = wait ? cancelLink(wait, 'Cancel this fill')
        : (r.pos == null ? '<button type="button" class="ix-btn ix-btn--secondary ipp-al-place" data-ipp-place-avail="' + esc(r.id) + '">' +
            (r.match ? 'Link and place' : 'Place') + '</button>' : '');
      return '<div class="ipp-al-it ipp-al-it--' + look + '"><div class="ipp-al-row"><div class="ipp-al-t">' +
        (look === 'green' ? '<span class="ipp-al-ok">\u2713</span>' : '') + esc(r.name || 'Untitled') + '</div></div>' +
        (sub.length ? '<div class="ipp-al-sub">' + sub.join('<span class="ipp-al-dot">\u00b7</span>') + '</div>' : '') +
        (action ? '<div class="ipp-al-act">' + action + '</div>' : '') + '</div>';
    }).join('');
    if (!total) html = '<div class="ipp-al-empty">' + (AVAIL.q.trim() ? 'No article matches \u201c' + esc(AVAIL.q) + '\u201d.' : 'No other articles for this publisher.') + '</div>';
    if (total > AVAIL_MAX) html += '<div class="ipp-al-empty">Showing ' + AVAIL_MAX + ' of ' + total + '. Search to narrow.</div>';
    if (AVAIL.truncated) html = '<div class="ipp-al-empty ipp-al-empty--bad">This list is incomplete: the asset list stopped early. Reload to try again.</div>' + html;
    list.innerHTML = html;
  }

  // ── the slot picker (R4) ─────────────────────────────────
  /* One panel, opened on a tile. It shows the plan's own articles first,
     then the publisher's other articles behind "Show available assets",
     then "Empty this slot". A pick is pending (gold) until Save, and the
     panel closes; the choice stays on the tile. */
  function spEl(){
    var r = IPP.root(); if (!r) return null;
    var el = r.querySelector('.ipp-sp');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'ipp-sp'; el.hidden = true;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Fill this slot');
    r.appendChild(el);
    el.addEventListener('click', onSlotPickerClick);
    el.addEventListener('input', function(e){
      if (e.target.matches('[data-sp-q]')) { SP.q = e.target.value; renderSlotPicker(true); }
    });
    return el;
  }
  // v1.16: the same panel, opened on a salmon line, picks an article to link.
  function openLinkPicker(allocId){
    if (P.saving) return;
    var a = allocById(allocId);
    if (!canLink(a)) { say('That allocation cannot take a link here.', 'info'); return; }
    ARMED = null;
    SP.key = 'link:' + allocId; SP.mode = 'link'; SP.allocId = allocId; SP.q = ''; SP.avail = true;
    var el = spEl(); if (!el) return;
    el.setAttribute('aria-label', 'Link an article');
    if (!AVAIL.items && !AVAIL.loading) loadAvail(false);
    renderList();
    renderSlotPicker();
    el.hidden = false;
    placeSlotPicker();
    var q = el.querySelector('[data-sp-q]'); if (q) q.focus();
  }
  function openSlotPicker(key, tile){
    if (P.saving) return;
    SP.key = key; SP.q = ''; SP.avail = false; SP.mode = 'slot'; SP.allocId = '';
    var sp0 = spEl(); if (sp0) sp0.setAttribute('aria-label', 'Fill this slot');
    var el = spEl(); if (!el) return;
    renderSlotPicker();
    el.hidden = false;
    placeSlotPicker(tile);
  }
  function placeSlotPicker(tile){
    var el = spEl(); if (!el || el.hidden) return;
    var cssq = function(v){ return window.CSS && CSS.escape ? CSS.escape(v) : v; };
    tile = tile || (SP.mode === 'link' ? IPP.q('[data-al-key="al-' + cssq(SP.allocId) + '"]')
                                       : IPP.q('[data-slot-key="' + cssq(SP.key) + '"]'));
    if (!tile) { closeSlotPicker(); return; }
    var r = tile.getBoundingClientRect(), w = Math.min(360, window.innerWidth - 24);
    var left = Math.max(12, Math.min(r.left, window.innerWidth - w - 12));
    var below = window.innerHeight - r.bottom - 16, above = r.top - 16;
    el.style.width = w + 'px';
    el.style.left = left + 'px';
    if (below >= 280 || below >= above) { el.style.top = (r.bottom + 6) + 'px'; el.style.bottom = 'auto'; el.style.maxHeight = Math.max(200, below) + 'px'; }
    else { el.style.top = 'auto'; el.style.bottom = (window.innerHeight - r.top + 6) + 'px'; el.style.maxHeight = Math.max(200, above) + 'px'; }
  }
  function closeSlotPicker(){
    var wasLink = SP.mode === 'link';
    SP.key = ''; SP.mode = 'slot'; SP.allocId = '';
    var r = IPP.root(); var el = r && r.querySelector('.ipp-sp');
    if (el) { el.hidden = true; el.innerHTML = ''; }
    if (wasLink && BOARD) renderList();
  }
  function spOption(o){
    return '<button type="button" class="ix-picker-option ipp-sp-opt" data-sp-pick="' + esc(o.ref) + '">' +
      '<span class="ipp-sp-t">' + esc(o.name || 'Untitled') + '</span>' +
      (o.meta ? '<span class="ix-picker-option-meta">' + o.meta + '</span>' : '') + '</button>';
  }
  // v1.14: an article saved in another slot is shown, not offered.
  function spOff(name, meta){
    return '<div class="ix-picker-option ipp-sp-opt ipp-sp-opt--off" aria-disabled="true">' +
      '<span class="ipp-sp-t">' + esc(name || 'Untitled') + '</span>' +
      '<span class="ix-picker-option-meta">' + meta + '</span></div>';
  }
  var SP_REFS = {};
  // v1.16 — the link panel. Same title first, then this plan's own, then newest.
  function linkRows(q){
    var a = allocById(SP.allocId), t = String((a && a.printTitle) || '').trim().toLowerCase();
    var mine = {};
    ((BOARD && BOARD.loose) || []).forEach(function(l){ if (l.asset) mine[l.asset.id] = 'Library row on this plan'; });
    slots().forEach(function(s){ if (s.asset) mine[s.asset.id] = 'in Pos ' + s.position; });
    var titleName = {}; (AVAIL.titles || []).forEach(function(x){ titleName[x.id] = x.name; });
    var me = titleAdminId();
    q = String(q || '').trim().toLowerCase();
    var rows = (AVAIL.items || []).map(function(it){
      var f = it.fieldData || {}, n = String(f.name || '');
      var tt = f['associated-title']; tt = Array.isArray(tt) ? tt[0] : tt;
      return { id:it.id, name:n, same: !!t && n.trim().toLowerCase() === t, mine: mine[it.id] || '',
               linkedTo: allocOfAsset(it.id), waitTo: linkWaitFor(it.id),
               thumb: f['main-image-ulc-link---1-1-ratio'] || (f['main-image'] && f['main-image'].url) || '',
               title: (tt && tt !== me) ? (titleName[tt] || '') : '', at: String(it.lastUpdated || '') };
    }).filter(function(r){ return !q || r.name.toLowerCase().indexOf(q) >= 0 || r.same; });
    rows.sort(function(x, y){
      return (y.same ? 1 : 0) - (x.same ? 1 : 0) || (y.mine ? 1 : 0) - (x.mine ? 1 : 0) || y.at.localeCompare(x.at);
    });
    return rows;
  }
  function renderLinkPicker(el, keepInput){
    var a = allocById(SP.allocId);
    if (!a) { closeSlotPicker(); return; }
    SP_REFS = {};
    var waiting = P.links[a.id] ? P.links[a.id].asset : null;
    var head = '<div class="ipp-sp-head"><b>Link</b> \u00b7 p.' + esc(a.page == null ? '?' : a.page) + ' \u201c' + esc(a.printTitle || 'Untitled') + '\u201d' +
      '<button type="button" class="ix-revert ipp-sp-close" data-sp-close>Close</button></div>';
    var cur = waiting ? '<div class="ipp-sp-cur">Now: <b>' + esc(waiting.name || 'Untitled') + '</b> <span class="ipp-al-word--gold">(waiting for Save)</span></div>' : '';
    var list;
    if (AVAIL.error) list = '<div class="ipp-al-empty ipp-al-empty--bad">' + esc(AVAIL.error) + '</div>';
    else if (AVAIL.loading || !AVAIL.items) list = '<div class="ipp-al-empty">Reading the publisher\u2019s articles\u2026</div>';
    else {
      var rows = linkRows(SP.q).filter(function(r){ return !(waiting && waiting.id === r.id); });
      var opts = rows.slice(0, AVAIL_MAX).map(function(r){
        if (r.linkedTo) return spOff(r.name, 'linked to the p.' + esc(r.linkedTo.page == null ? '?' : r.linkedTo.page) + ' allocation');
        var ref = 'k:' + r.id;
        SP_REFS[ref] = { asset:{ kind:'article', id:r.id, name:r.name, thumb:r.thumb }, link:true };
        var meta = [];
        if (r.same) meta.push('<span class="ipp-al-word--match">Same title as the printed item</span>');
        if (r.mine) meta.push(esc(r.mine));
        if (r.title) meta.push(esc(r.title));
        if (r.waitTo) { var wa = allocById(r.waitTo); meta.push('waiting to link to p.' + esc(wa && wa.page != null ? wa.page : '?') + ' (moves here)'); }
        return spOption({ ref:ref, name:r.name, meta:meta.join(' \u00b7 ') });
      });
      list = '<div class="ipp-sp-list ipp-sp-list--avail">' + (opts.length ? opts.join('') :
        '<div class="ipp-al-empty">' + (SP.q.trim() ? 'No article matches \u201c' + esc(SP.q) + '\u201d.' : 'No articles for this publisher.') + '</div>') + '</div>' +
        (rows.length > AVAIL_MAX ? '<div class="ipp-al-empty">Showing ' + AVAIL_MAX + ' of ' + rows.length + '. Search to narrow.</div>' : '');
    }
    var search = '<input type="search" class="ipp-al-search" data-sp-q placeholder="Search this publisher\u2019s articles" aria-label="Search articles to link" value="' + esc(SP.q) + '">';
    var foot = waiting ? '<div class="ipp-sp-foot"><button type="button" class="ix-revert ipp-sp-empty" data-sp-unlink>Cancel this link</button></div>' : '';
    if (keepInput) {
      var listBox = el.querySelector('.ipp-sp-list--avail');
      var tmp = document.createElement('div'); tmp.innerHTML = list;
      var fresh = tmp.querySelector('.ipp-sp-list--avail');
      if (listBox && fresh) { listBox.innerHTML = fresh.innerHTML; return; }
    }
    el.innerHTML = head + cur + '<div class="ipp-sp-sec">The publisher\u2019s articles</div>' + search + list + foot;
  }
  function renderSlotPicker(keepInput){
    var el = spEl(); if (!el || !SP.key) return;
    if (SP.mode === 'link') { renderLinkPicker(el, keepInput); return; }
    var key = SP.key, s = slotById(key), isNew = !!addByKey(key);
    var current = P.fills[key] ? P.fills[key].asset : (s && !P.clears[key] ? s.asset : null);
    SP_REFS = {};
    var mine = [];
    linesOf(BOARD).forEach(function(l){
      if (!l.asset || l.asset.kind !== 'article') return;
      if (current && current.id === l.asset.id) return;
      var ref = 'l:' + l.key; SP_REFS[ref] = { asset:l.asset, srcLoose:l.srcLoose };
      var meta = [];
      meta.push(l.library ? 'Library' : (l.page != null ? 'p.' + esc(l.page) : ''));
      var wait = pendingKeyFor(l.asset.id), saved = savedSlotOf(l.asset.id);
      if (saved) { mine.push(spOff(l.title, 'in Pos ' + esc(saved.position) + ' \u00b7 move it on the Layout tab')); return; }
      if (wait) meta.push('waiting for Pos ' + esc(posOf(wait)));
      else meta.push('not in a slot');
      mine.push(spOption({ ref:ref, name:l.title, meta:meta.filter(Boolean).join(' \u00b7 ') }));
    });
    var head = '<div class="ipp-sp-head"><b>Pos ' + esc(posOf(key)) + '</b> \u00b7 ' + (isNew ? 'New article slot' : 'Article slot') +
      '<button type="button" class="ix-revert ipp-sp-close" data-sp-close>Close</button></div>';
    var cur = current ? '<div class="ipp-sp-cur">Now: <b>' + esc(current.name || 'Untitled') + '</b>' +
      (P.fills[key] ? ' <span class="ipp-al-word--gold">(waiting for Save)</span>' : '') + '</div>' : '';
    var body = '<div class="ipp-sp-sec">On this plan\u2019s list</div>' +
      (mine.length ? '<div class="ipp-sp-list">' + mine.join('') + '</div>' : '<div class="ipp-al-empty">No other articles on this plan\u2019s list.</div>');
    var avail = '';
    if (!SP.avail) {
      avail = '<button type="button" class="ipp-al-availlink" data-sp-avail>Show available assets</button>';
    } else if (AVAIL.error) {
      avail = '<div class="ipp-al-empty ipp-al-empty--bad">' + esc(AVAIL.error) + '</div>';
    } else if (AVAIL.loading || !AVAIL.items) {
      avail = '<div class="ipp-al-empty">Reading the publisher\u2019s articles\u2026</div>';
    } else {
      var rows = availRows(SP.q).filter(function(r){ return !(current && current.id === r.id); });
      var opts = rows.slice(0, AVAIL_MAX).map(function(r){
        var ref = 'a:' + r.id;
        if (r.pos != null) return spOff(r.name, 'in Pos ' + esc(r.pos) + ' \u00b7 move it on the Layout tab');
        SP_REFS[ref] = { asset:{ kind:'article', id:r.id, name:r.name, thumb:r.thumb }, linkTo: r.match ? r.match.id : '' };
        var meta = [];
        if (r.title) meta.push(esc(r.title));
        var wait = pendingKeyFor(r.id);
        if (wait) meta.push('waiting for Pos ' + esc(posOf(wait)));
        if (r.match) meta.push('<span class="ipp-al-word--match">Same title as the p.' + esc(r.match.page) + ' allocation \u00b7 links it too</span>');
        return spOption({ ref:ref, name:r.name, meta:meta.join(' \u00b7 ') });
      });
      avail = '<div class="ipp-sp-sec">Available assets</div>' +
        '<input type="search" class="ipp-al-search" data-sp-q placeholder="Search this publisher\u2019s articles" aria-label="Search available articles" value="' + esc(SP.q) + '">' +
        '<div class="ipp-sp-list ipp-sp-list--avail">' + (opts.length ? opts.join('') :
          '<div class="ipp-al-empty">' + (SP.q.trim() ? 'No article matches \u201c' + esc(SP.q) + '\u201d.' : 'No other articles for this publisher.') + '</div>') + '</div>' +
        (rows.length > AVAIL_MAX ? '<div class="ipp-al-empty">Showing ' + AVAIL_MAX + ' of ' + rows.length + '. Search to narrow.</div>' : '');
    }
    var foot = current ? '<div class="ipp-sp-foot"><button type="button" class="ix-revert ipp-sp-empty" data-sp-empty>Empty this slot</button></div>' : '';
    if (keepInput) {
      var listBox = el.querySelector('.ipp-sp-list--avail');
      var tmp = document.createElement('div'); tmp.innerHTML = avail;
      var fresh = tmp.querySelector('.ipp-sp-list--avail');
      if (listBox && fresh) { listBox.innerHTML = fresh.innerHTML; return; }
    }
    el.innerHTML = head + cur + body + '<div class="ipp-sp-availbox">' + avail + '</div>' + foot;
  }
  function onSlotPickerClick(e){
    e.stopPropagation();
    if (e.target.closest('[data-sp-close]')) { closeSlotPicker(); return; }
    if (e.target.closest('[data-sp-avail]')) {
      SP.avail = true;
      if (!AVAIL.items && !AVAIL.loading) loadAvail(false);
      renderSlotPicker();
      var q = spEl().querySelector('[data-sp-q]'); if (q) q.focus();
      return;
    }
    if (e.target.closest('[data-sp-empty]')) { var k = SP.key; closeSlotPicker(); setClear(k); return; }
    if (e.target.closest('[data-sp-unlink]')) { var al = SP.allocId; closeSlotPicker(); cancelLinkOf(al); return; }
    var pick = e.target.closest('[data-sp-pick]');
    if (pick) {
      var ref = SP_REFS[pick.getAttribute('data-sp-pick')], key2 = SP.key, alloc2 = SP.allocId;
      closeSlotPicker();
      if (!ref) return;
      if (ref.link) { setLink(alloc2, ref.asset); return; }
      if (ref.linkTo) setLink(ref.linkTo, ref.asset);   // v1.16 Link and place (R9)
      setFill(key2, ref.asset, { srcLoose:ref.srcLoose });
    }
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

  // ── the save bar (R6) ────────────────────────────────────
  function savebarEl(){ var v = view(); return (v && IPP.q('.ipp-savebar', v)) || IPP.q('.ipp-savebar'); }
  function ensureSavebarActions(){
    var bar = savebarEl(); if (!bar) return null;
    var box = bar.querySelector('.ipp-board-actions');
    if (box) return box;
    box = document.createElement('span');
    box.className = 'ipp-board-actions';
    box.innerHTML = '<button type="button" class="ix-revert" data-ipp-cancel-all hidden>Cancel all</button>' +
      '<button type="button" class="ix-btn ix-btn--primary" data-ipp-save disabled>Save</button>';
    bar.appendChild(box);
    box.addEventListener('click', function(e){
      if (e.target.closest('[data-ipp-cancel-all]')) { cancelAll(); return; }
      if (e.target.closest('[data-ipp-save]')) saveBoard();
    });
    return box;
  }
  function paintSavebar(){
    var bar = savebarEl(); if (!bar) return;
    var box = ensureSavebarActions();
    var c = pendingCounts(), parts = [];
    if (c.added)   parts.push(plural(c.added,   ['slot added','slots added']));
    if (c.removed) parts.push(plural(c.removed, ['slot removed','slots removed']));
    if (c.filled)  parts.push(plural(c.filled,  ['slot filled','slots filled']));
    if (c.emptied) parts.push(plural(c.emptied, ['slot emptied','slots emptied']));
    if (c.loose)   parts.push(plural(c.loose,   ['loose row removed','loose rows removed']));
    if (c.linked)  parts.push(plural(c.linked,  ['allocation link','allocation links']));
    var gr = grDirtyCount();
    var text = P.saving ? 'Saving ' + plural(c.total, ['write','writes']) + '\u2026'
      : (c.total ? plural(c.total, ['write','writes']) + ' waiting: ' + parts.join(', ') : 'No unsaved changes');
    if (gr && !P.saving) text += (c.total ? ' \u00b7 ' : ' \u00b7 ') + 'Greeting edited (save it in its card)';
    if (!c.total && !gr && !P.saving) text = 'No unsaved changes';
    var stat = bar.querySelector('.stat'); if (stat) stat.textContent = text;
    bar.classList.toggle('ipp-dirty', c.total > 0 || gr > 0);
    bar.classList.toggle('saving', !!P.saving);
    if (box) {
      var save = box.querySelector('[data-ipp-save]'), all = box.querySelector('[data-ipp-cancel-all]');
      if (save) { save.disabled = !c.total || P.saving; save.textContent = P.saving ? 'Saving\u2026' : (c.total ? 'Save ' + plural(c.total, ['change','changes']) : 'Save'); }
      if (all) all.hidden = !c.total || P.saving;
    }
  }

  /* ════════════════════════════════════════════════════════════
     SAVE — Scenario 124, the batch contract (v1.11)
     GET {PP_WEBHOOKS.blockWriter}?op=<op>&batchId=<id>&batch={"ops":[…]}
     → { batchId, op, results:[ {i (1-based), ok, id, fieldData|deleted} ] }
     Order: create, fill, clear, then delete (scoping §09). A loose row
     is deleted only after its fill landed. Every value sent is checked
     against what Webflow sent back; a missing result is a failure.
     ════════════════════════════════════════════════════════════ */
  function blockWriter(){ return String((window.PP_WEBHOOKS || {}).blockWriter || ''); }
  function slateWriter(){ return String((window.PP_WEBHOOKS || {}).slateWriter || ''); }   // v1.16: Scenario 103B
  function batchUrl(url, op, batchId, ops){
    return url + (url.indexOf('?') < 0 ? '?' : '&') + 'op=' + encodeURIComponent(op) +
      '&batchId=' + encodeURIComponent(batchId) + '&batch=' + encodeURIComponent(JSON.stringify({ ops: ops }));
  }
  function chunkOps(url, op, batchId, ops){
    if (batchUrl(url, op, batchId, ops).length <= BATCH_URL_CEILING) return [ops];
    var out = []; for (var i = 0; i < ops.length; i += BATCH_CHUNK) out.push(ops.slice(i, i + BATCH_CHUNK));
    return out;
  }
  // Sequential chunks; resolves to results indexed against `ops`.
  function sendBatch(url, op, ops, who){
    who = who || 'Scenario 124';
    var batchId = 'ipp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    var chunks = chunkOps(url, op, batchId, ops), results = [], base = 0;
    return chunks.reduce(function(chain, chunk, ci){
      return chain.then(function(){
        return fetch(batchUrl(url, op, batchId + (ci ? '-' + ci : ''), chunk), { method:'GET', credentials:'omit' })
          .then(function(r){
            return r.text().then(function(t){
              if (!r.ok) throw new Error(who + ' answered HTTP ' + r.status + ' to ' + op + '.');
              var body; try { body = JSON.parse(t); } catch (e) { throw new Error(who + ' sent a reply that is not JSON (' + op + ').'); }
              ((body && body.results) || []).forEach(function(row){ row.__idx = base + (Number(row.i) - 1); results.push(row); });
              base += chunk.length;
            });
          });
      });
    }, Promise.resolve()).then(function(){ return results; });
  }
  function resultFor(results, i){ for (var n = 0; n < results.length; n++) if (results[n].__idx === i) return results[n]; return null; }
  // checks: [[label, sentValue, fieldDataKey]] — every one must match.
  function verdict(res, checks){
    if (!res) return 'no result came back';
    if (res.ok !== true || !res.id) return res.err || 'Webflow refused the write';
    var fd = res.fieldData || {}, bad = [];
    (checks || []).forEach(function(c){ if (String(fd[c[2]] == null ? '' : fd[c[2]]) !== String(c[1] == null ? '' : c[1])) bad.push(c[0]); });
    return bad.length ? 'did not store ' + bad.join(', ') : '';
  }
  // One write stage: send ops, return [{ item, why }] with why '' on success.
  function stage(url, op, items, toOp, checksOf){
    if (!items.length) return Promise.resolve([]);
    var ops = items.map(toOp);
    // ix-progress shows its own card for every call to Make; no second one here.
    return sendBatch(url, op, ops).then(function(results){
      return items.map(function(it, i){ return { item:it, why: verdict(resultFor(results, i), checksOf(it, ops[i])), res: resultFor(results, i) }; });
    }, function(e){
      var why = (e && e.message) || 'the request failed';
      return items.map(function(it){ return { item:it, why:why }; });
    });
  }

  function saveBoard(){
    if (P.saving) return;
    var c = pendingCounts(); if (!c.total) return;
    var url = blockWriter();
    if (!url) { say('Can\u2019t save: this page has no PP_WEBHOOKS.blockWriter address (Scenario 124).', 'err'); return; }
    if (!BOARD || !BOARD.plan) { say('Can\u2019t save: the plan has not been read yet.', 'err'); return; }
    var lurl = slateWriter(), lfield = linkField();
    if (c.linked && !lurl) { say('Can\u2019t save: this page has no PP_WEBHOOKS.slateWriter address (Scenario 103B), so links cannot be written. Nothing was sent.', 'err'); return; }
    if (c.linked && !lfield) { say('Can\u2019t save: the plan data does not name the field a link writes (linkFields, Data Worker v1.0.13). Nothing was sent.', 'err'); return; }
    var plan = BOARD.plan, wi = BOARD.writeIds || { assetType:{}, blockType:{} };
    var articleField = acceptsField('article');
    closeSlotPicker(); ARMED = null;
    P.saving = true; P.fails = {}; redraw();

    var creates = [], fills = [], clears = [], dels = [], links = [];
    Object.keys(P.links).forEach(function(k){
      links.push({ key:'link:' + k, allocId:k, asset:P.links[k].asset, op:{ id:k, field:lfield, assetId:P.links[k].asset.id } });
    });
    P.adds.forEach(function(a){
      var f = P.fills[a.key], field = acceptsField(a.assetType);
      var at = (wi.assetType || {})[a.assetType], bt = a.blockType ? (wi.blockType || {})[a.blockType] : '';
      if (!at) { P.fails[a.key] = 'no option id for asset type \u201c' + a.assetType + '\u201d (plan data writeIds)'; return; }
      if (a.blockType && !bt) { P.fails[a.key] = 'no option id for block type \u201c' + a.blockType + '\u201d'; return; }
      if (f && !(field && field !== 'list')) { P.fails[a.key] = 'this slot type cannot hold an article'; return; }
      var sk = 'slot-' + a.position;
      creates.push({ key:a.key, fill:f || null, op:{
        pubplanId: plan.id, blockName: (plan.name || 'Plan') + '-b' + a.position, slotKey: sk, position: a.position,
        planningNote: '', showAsSponsored: false, blockTypeHash: bt, assetTypeHash: at,
        assetField: f ? field : 'slot-key', assetId: f ? f.asset.id : sk } });
    });
    Object.keys(P.fills).forEach(function(k){
      if (addByKey(k)) return;
      if (!articleField || articleField === 'list') { P.fails[k] = 'the plan data does not say which field holds an article'; return; }
      fills.push({ key:k, fill:P.fills[k], op:{ id:k, assetField:articleField, assetId:P.fills[k].asset.id } });
    });
    Object.keys(P.clears).forEach(function(k){ clears.push({ key:k, op:{ id:k, assetField:articleField } }); });

    var passed = {}, failed = {};
    var mark = function(rows){ rows.forEach(function(r){ if (r.why) failed[r.item.key] = r.why; else passed[r.item.key] = r.res || true; }); };

    // v1.16: 103B links first (§09). A link counts only when 103B read the
    // field back and it holds the id sent.
    var linkStage = !links.length ? Promise.resolve([]) :
      sendBatch(lurl, 'link', links.map(function(it){ return it.op; }), 'Scenario 103B').then(function(results){
        return links.map(function(it, i){
          var res = resultFor(results, i), why = '';
          if (!res) why = 'no result came back';
          else if (res.fieldOk !== true) why = '103B refused the field \u201c' + (res.field || it.op.field) + '\u201d';
          else if (res.ok !== true || !res.id) why = res.err || 'Webflow refused the write';
          else if (String(res.value || '') !== String(it.op.assetId)) why = 'the allocation does not hold the article after the write';
          return { item:it, why:why, res:res };
        });
      }, function(e){
        var why = (e && e.message) || 'the request failed';
        return links.map(function(it){ return { item:it, why:why }; });
      });

    linkStage.then(function(r){
      mark(r);
      return stage(url, 'create', creates, function(it){ return it.op; }, function(it, op){
      return [['position', op.position, 'position'], ['slot-key', op.slotKey, 'slot-key'],
              ['asset', op.assetId, 'asset'], ['asset type', op.assetTypeHash, 'asset-type']];
      });
    }).then(function(r){
      mark(r);
      return stage(url, 'fill', fills, function(it){ return it.op; }, function(it, op){ return [['article', op.assetId, 'asset']]; });
    }).then(function(r){
      mark(r);
      // a move empties the old slot, once the new slot has it
      fills.concat(creates).forEach(function(it){
        var f = it.fill; if (!f || !f.srcSlot || failed[it.key] || !passed[it.key]) return;
        if (P.fills[f.srcSlot] || P.removes[f.srcSlot] || P.clears[f.srcSlot]) return;
        clears.push({ key:f.srcSlot, moveOf:it.key, op:{ id:f.srcSlot, assetField:articleField } });
      });
      return stage(url, 'clear', clears, function(it){ return it.op; }, function(){ return [['empty asset', '', 'asset']]; });
    }).then(function(r){
      mark(r);
      Object.keys(P.removes).forEach(function(k){ dels.push({ key:k, op:{ id:k } }); });
      fills.concat(creates).forEach(function(it){
        if (it.fill && it.fill.srcLoose && passed[it.key]) dels.push({ key:'loose:' + it.fill.srcLoose, ofKey:it.key, op:{ id:it.fill.srcLoose } });
      });
      return stage(url, 'delete', dels, function(it){ return it.op; }, function(){ return []; });
    }).then(function(r){
      // delete answers { deleted, liveRemoved }, not fieldData
      var notes = [];
      r.forEach(function(x){
        var res = x.res;
        if (!x.why && !(res && res.deleted === true)) x.why = 'the row was not deleted';
        if (!x.why && res && res.liveRemoved === false) notes.push('Pos ' + esc(posOf(x.item.ofKey || x.item.key)) + ': the published copy was not removed');
      });
      mark(r);
      finishSave(creates, fills, clears, dels, passed, failed, notes, links);
    }).catch(function(e){
      P.saving = false; redraw();
      say('Save stopped: ' + ((e && e.message) || e) + '. Nothing after that point was sent. Your changes are kept.', 'err');
    });
  }

  function finishSave(creates, fills, clears, dels, passed, failed, notes, links){
    var labels = [], landed = [];
    links = links || [];
    links.forEach(function(it){
      if (failed[it.key]) { P.fails[it.key] = failed[it.key]; labels.push('Link \u201c' + it.asset.name + '\u201d (' + failed[it.key] + ')'); }
      else if (passed[it.key]) delete P.links[it.allocId];
    });
    var nameOf = function(key){ var f = P.fills[key]; return 'Pos ' + posOf(key) + (f ? ' \u201c' + f.asset.name + '\u201d' : ''); };
    creates.forEach(function(it){ if (failed[it.key]) { P.fails[it.key] = failed[it.key]; labels.push(nameOf(it.key) + ' (' + failed[it.key] + ')'); } });
    fills.forEach(function(it){ if (failed[it.key]) { P.fails[it.key] = failed[it.key]; labels.push(nameOf(it.key) + ' (' + failed[it.key] + ')'); } });
    clears.forEach(function(it){
      if (!failed[it.key]) return;
      if (it.moveOf) labels.push('Pos ' + posOf(it.key) + ' still holds its old article (' + failed[it.key] + '). Empty it from its slot picker.');
      else { P.fails[it.key] = failed[it.key]; labels.push('Pos ' + posOf(it.key) + ' (' + failed[it.key] + ')'); }
    });
    dels.forEach(function(it){
      if (!failed[it.key]) return;
      if (it.ofKey) labels.push(nameOf(it.ofKey) + ': loose row left (' + failed[it.key] + '). Its article is in the slot; the extra row needs removing.');
      else { P.fails[it.key] = failed[it.key]; labels.push((looseById(it.key) ? 'A loose row' : 'Pos ' + posOf(it.key)) + ' (' + failed[it.key] + ')'); }
    });
    // what landed leaves the pending list; the board read decides green
    var rows = [];
    creates.forEach(function(it){ if (passed[it.key] && !failed[it.key]) {
      for (var i = 0; i < P.adds.length; i++) if (P.adds[i].key === it.key) { P.adds.splice(i,1); break; }
      delete P.fills[it.key]; landed.push(it.key);
      rows.push({ id: (passed[it.key] && passed[it.key].id) || '', fields:{ position: it.op.position, 'slot-key': it.op.slotKey } });
    } });
    fills.forEach(function(it){ if (passed[it.key]) { delete P.fills[it.key]; landed.push(it.key); rows.push({ id:it.key, fields:{ asset: it.op.assetId } }); } });
    clears.forEach(function(it){ if (passed[it.key]) { delete P.clears[it.key]; rows.push({ id:it.key, fields:{ asset:'' } }); } });
    dels.forEach(function(it){ if (passed[it.key] && !it.ofKey) { delete P.removes[it.key]; rows.push({ id:it.key, deleted:true }); } });
    P.saving = false;

    var planId = BOARD && BOARD.plan ? BOARD.plan.id : '';
    if (window.IxRefresh && typeof window.IxRefresh.emit === 'function' && rows.length) {
      window.IxRefresh.emit('nl-blocks:written', { planId: planId, source:'ipp-picker', rows: rows });
    }
    var reread = IPP.board.load({ fresh:true });
    reread.then(function(b){
      // every confirmed fill must show on the read, or say so
      var lag = [];
      fills.forEach(function(it){
        if (!passed[it.key]) return;
        var s = null; (b.slots || []).forEach(function(x){ if (x.id === it.key) s = x; });
        if (!s || !s.asset || s.asset.id !== it.op.assetId) lag.push('Pos ' + (s ? s.position : '?'));
      });
      links.forEach(function(it){
        if (!passed[it.key]) return;
        var a = null; (b.allocations || []).forEach(function(x){ if (x.id === it.allocId) a = x; });
        if (!a || !a.asset || a.asset.id !== it.op.assetId) lag.push('the link to \u201c' + it.asset.name + '\u201d');
      });
      if (lag.length) say('Saved, but the plan read has not caught up for ' + lag.join(', ') + '. Reload in a moment; nothing is lost.', 'unverified');
    }, function(){ /* onBoard shows the read error */ });

    if (labels.length) {
      say((Object.keys(passed).length ? 'Some changes saved, but not all. ' : 'Nothing was saved. ') + labels.join('; ') +
        '. What did not save is still waiting, gold, ready to try again.', 'err');
    } else {
      var n = Object.keys(passed).length;
      say('Saved ' + plural(n, ['change','changes']) + '.' + (notes.length ? ' Note: ' + notes.join('; ') + '.' : ''), notes.length ? 'unverified' : 'ok');
    }
    redraw();
  }

  // ── the rail card ────────────────────────────────────────
  function infoBadge(){
    if (!window.IxInfo || typeof window.IxInfo.badge !== 'function') return '';
    return window.IxInfo.badge({
      file: FILE, version: VERSION, title: 'Picker \u00b7 Allocations',
      blurb: 'The tiles are this plan\u2019s real slots, read fresh from the CMS each time the page opens. ' +
             'Ads are not on the Picker; they belong to the Revenue tab. ' +
             'Moving an article between slots is done on the Layout tab. ' +
             'Click an article tile to fill it, or click Place on a line and then an empty slot. ' +
             'Add makes a new slot; Remove slot takes out an empty one.\n\n' +
             'Every change waits in gold, with its own Cancel, until you press Save. Save writes through ' +
             'Scenario 124 and checks each value Webflow sends back. A tile turns green only when the plan, ' +
             'read again after Save, shows the change.\n\n' +
             'Allocations lists what the Print Issue Allocator assigned to this plan, plus anything sent here ' +
             'from the Asset Library. Salmon means nothing is linked yet. Plain means the article exists but ' +
             'is not in a slot. Green means it is in a slot.',
      scenarios: [{ name: 'Scenario 124 \u00b7 PubPlan Block Writer', note: 'create, fill, clear, delete (PP_WEBHOOKS.blockWriter)' },
                  { name: 'Data Worker \u00b7 ix-issue-data', note: '/plan-board, v1.0.12 or later' },
                  { name: 'ix-asset-list Worker', note: 'the publisher\u2019s articles, for Show available assets' },
                  { name: 'PP_WEBHOOKS.ipp', note: 'the Greeting card\u2019s save' }],
      companions: 'ipp-picker-markup-v1.10.js \u00b7 ipp-picker-v1.15.css \u00b7 ipp-shell-v1.9.js'
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
      var cx = e.target.closest('[data-ipp-cancel]');
      if (cx) { cancelKey(cx.getAttribute('data-ipp-cancel')); return; }
      if (P.saving) return;
      var cl = e.target.closest('[data-ipp-cancel-link]');
      if (cl) { cancelLinkOf(cl.getAttribute('data-ipp-cancel-link')); return; }
      var lk = e.target.closest('[data-ipp-link]');
      if (lk) { openLinkPicker(lk.getAttribute('data-ipp-link')); return; }
      if (e.target.closest('[data-ipp-create-link]')) {
        say('Create and link is not wired yet. It arrives after the first real issue (IA23). For now, use Link to choose an existing article.', 'info');
        return;
      }
      var pl = e.target.closest('[data-ipp-place]');
      if (pl) {
        var ln = LINES[pl.getAttribute('data-ipp-place')];
        if (ln && ln.asset) arm(ln.asset, { srcLoose:ln.srcLoose }, ln.title);
        return;
      }
      var rl = e.target.closest('[data-ipp-retry-loose]');
      if (rl) { var lid = rl.getAttribute('data-ipp-retry-loose'); P.removes[lid] = true; delete P.fails[lid]; changed(); return; }
      var pa = e.target.closest('[data-ipp-place-avail]');
      if (pa) {
        var r = AVAIL_BY_ID[pa.getAttribute('data-ipp-place-avail')];
        if (r) arm({ kind:'article', id:r.id, name:r.name, thumb:r.thumb }, { linkTo: r.match ? r.match.id : '' }, r.name);
        return;
      }
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

  function wireCanvas(canvas){
    canvas.addEventListener('click', function(e){
      if (e.target.closest('[data-ipp-board-retry]')) { IPP.board.load({ fresh:true }).catch(function(){}); return; }
      if (e.target.closest('[data-ipp-disarm]')) { disarm(); return; }
      var sec = e.target.closest('[data-ipp-focus]');
      if (sec && canvas.contains(sec)) setFocus(sec.getAttribute('data-ipp-focus') || '');
      if (P.saving) return;
      var add = e.target.closest('[data-ipp-add]');
      if (add) { addSlot(add.getAttribute('data-ipp-add')); return; }
      var rm = e.target.closest('[data-ipp-remove]');
      if (rm) { toggleRemove(rm.getAttribute('data-ipp-remove')); return; }
      var cx = e.target.closest('[data-ipp-cancel]');
      if (cx) { cancelKey(cx.getAttribute('data-ipp-cancel')); return; }
      var tile = e.target.closest('[data-ipp-open][data-slot-key]');
      if (!tile) return;
      var key = tile.getAttribute('data-slot-key');
      if (ARMED) {
        if (tile.classList.contains('ipp-slot--target')) {
          var a = ARMED; ARMED = null;
          if (a.linkTo) setLink(a.linkTo, a.asset);   // v1.16 Link and place (R9)
          setFill(key, a.asset, { srcLoose:a.srcLoose });
        }
        else say('Pick an empty article slot (outlined), or Cancel the Place.', 'info');
        return;
      }
      openSlotPicker(key, tile);
    });
    // the panel follows its tile; a scroll of the canvas moves it
    canvas.addEventListener('scroll', function(){ if (SP.key) placeSlotPicker(); }, { passive:true });
  }

  function onBoard(e){
    var d = (e && e.detail) || {};
    if (d.ok) {
      BOARD = d.data;
      // pending changes whose slot no longer exists are dropped, and said
      var gone = [];
      ['fills','clears','removes'].forEach(function(n){
        Object.keys(P[n]).forEach(function(k){
          if (addByKey(k) || slotById(k) || (n === 'removes' && looseById(k))) return;
          delete P[n][k];
          if (!(n === 'removes' && !slotById(k))) gone.push(k);   // a loose row that is gone is what Retry wanted
        });
      });
      if (gone.length) say('A slot you had a change waiting on is no longer in this plan. That change was dropped.', 'unverified');
      // v1.16: a waiting link whose allocation is gone, or now holds an article
      var lgone = [];
      Object.keys(P.links).forEach(function(k){
        var a = allocById(k);
        if (a && !a.asset) return;
        if (a && a.asset && a.asset.id === P.links[k].asset.id) { delete P.links[k]; return; }
        lgone.push(P.links[k].asset.name || 'an article'); delete P.links[k]; delete P.fails['link:' + k];
      });
      if (lgone.length) say('A link you had waiting (' + lgone.join(', ') + ') was dropped: its allocation is gone or already has an article.', 'unverified');
      grFromBoard(BOARD);
      renderBoard(BOARD);
      return;
    }
    var msg = '<b>Could not read this plan.</b> ' + esc(d.error || '') +
      ' <button type="button" class="ipp-board-retry" data-ipp-board-retry>Try again</button>';
    setMsg(msg, 'bad');
    var el = byId('ipp_alList');
    if (el) el.innerHTML = '<div class="ipp-al-empty ipp-al-empty--bad">The list could not be read. ' +
      (BOARD ? 'What shows may be out of date.' : '') + '</div>';
  }

  /* Canonical dropdown registration helper (unchanged). ipp-dropdown
     v1.0 still loads; no Picker tile uses it in v1.11. */
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
    mountRail(view); wireCanvas(canvas); paintFocus(); paintSavebar();
    // close the slot picker on a click anywhere else, or Esc
    document.addEventListener('click', function(e){
      if (!SP.key) return;
      var el = IPP.root() && IPP.root().querySelector('.ipp-sp');
      if (el && el.contains(e.target)) return;
      if (e.target.closest && e.target.closest('[data-ipp-open][data-slot-key], [data-ipp-link]')) return;
      closeSlotPicker();
    });
    document.addEventListener('keydown', function(e){
      if (e.key !== 'Escape') return;
      if (SP.key) { closeSlotPicker(); return; }
      if (ARMED) disarm();
    });
    window.addEventListener('resize', function(){ if (SP.key) placeSlotPicker(); });
    // never leave with changes waiting, without being asked
    window.addEventListener('beforeunload', function(e){
      if (!anyPending() && !grDirtyCount()) return;
      e.preventDefault(); e.returnValue = ''; return '';
    });
    document.addEventListener('ipp:board', onBoard);
    if (!IPP.board || typeof IPP.board.load !== 'function') {
      setMsg('<b>This page loads an older IPP shell.</b> The Picker needs ipp-shell-v1.6.js or later to read the plan.', 'bad');
    } else if (IPP.board.data()) {
      onBoard({ detail:{ ok:true, data:IPP.board.data() } });
    } else {
      IPP.board.load().catch(function(){ /* shown by onBoard */ });
    }
    if (!blockWriter()) console.warn('[ipp-picker] PP_WEBHOOKS.blockWriter is not set; Save will refuse and say so.');
    if (!slateWriter()) console.warn('[ipp-picker] PP_WEBHOOKS.slateWriter is not set; a Save with links will refuse and say so.');
    console.info('[ipp-picker] mounted (v' + VERSION + ' \u00b7 plan board read \u00b7 writes through 103B and 124)');
  }

  document.addEventListener('ipp:ready',mount);
  document.addEventListener('ipp:view',function(e){ if(e.detail&&e.detail.view==='picker') mount(); });
  if(document.querySelector('[data-ipp-root]')) mount();

  window.IPP.picker={ mount:mount, hydrate:hydrate, CATS:CATS, version:VERSION,
    focus:function(){ return FOCUS; }, setFocus:setFocus, board:function(){ return BOARD; },
    pending:function(){ return JSON.parse(JSON.stringify({ adds:P.adds, fills:P.fills, clears:P.clears, removes:P.removes, links:P.links, fails:P.fails })); },
    save:saveBoard, cancelAll:cancelAll,
    greeting:{ dirtyCount:grDirtyCount, save:grSave, revert:grRevert, paint:grPaintAll, nlbId:function(){ return GR.nlbId; },
               aiCandidateFits:grAiCandidateFits, aiApply:grAiApply } };
})();
