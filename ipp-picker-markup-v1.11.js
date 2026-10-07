/* ipp-picker-markup-v1.11.js */
/* ============================================================
   ipp-picker-markup-v1.11.js
   CHANGELOG
     v1.11 (from v1.10, IPP Build S6 · Allocations ledger). Pairs
       ipp-picker-v1.23.js + ipp-picker-v1.18.css.
       - The rail card is the ledger: title "Allocations from print"
         with a refresh icon (a lock icon on a locked plan, shown by the
         picker), the list, and a four-entry legend at the bottom.
       - No focus chips (All, Articles, Events, Real Estate) and no
         "Show available assets" on the rail. Available assets stay in
         the slot panel that opens on a tile.
       - Canvas sections lose their focus attribute: clicking a section
         no longer narrows the list (IA20 withdrawn, S6 ruling 3).
       - Content Controller and Greeting unchanged.
     v1.10 (from v1.9). Pairs ipp-picker-v1.15.js + ipp-picker-v1.15.css.
       - The Greeting Title is a textarea like the other two, so all
         three boxes can be the same fixed height with their bottoms and
         counters level. Same id, same 30-character cap. The picker keeps
         every Greeting field to one line (no line breaks).
       - Nothing else changed.
     v1.9 (from v1.8, IA53: banners leave the Picker). Pairs
       ipp-picker-v1.13.js + ipp-picker-v1.12.css + ipp-shell-v1.8.js.
       - Banner Ads section (with the Splash Ad column) removed.
       - Content Controller "Banner Ads" row removed.
       - Nothing else changed.
     v1.8 (from v1.7, IPP Build S3 slice 2, pairs ipp-picker-v1.11.js +
       ipp-picker-v1.11.css + ipp-shell-v1.8.js):
       - One new line at the top of the canvas: the Place bar
         (#ipp_placeBar). It says which article is being placed and has
         Cancel. Hidden unless a Place is under way.
       - Nothing else changed. The Add tiles, the slot picker panel and
         the save bar's Save and Cancel all are drawn by the picker.
     v1.7 (from v1.6, IPP Build S2 slice 1, pairs ipp-picker-v1.9.js +
       ipp-picker-v1.9.css + ipp-shell-v1.6.js):
       - DEMO TILES REMOVED. Articles, Banner Ads, The Find, Real Estate
         and Events are now empty containers. ipp-picker v1.9 fills them
         from the plan board (Data Worker /plan-board), one tile per real
         NL-BLOCKS row. No typed article titles, customers or counts.
       - Section heads carry an empty count line the picker fills
         ("4 slots · 1 filled"), and data-ipp-focus, which says what the
         Allocations list narrows to when you click into the section:
         article, event, re, or "" (clears the focus).
       - Local Business Profile section removed. LBP is an Article's
         block type now (scoping v0.4); the Picker never shows FA, TS
         or LBP, and the Layout tab sets it.
       - Splash Ad column says plainly that it is not on the Picker yet,
         instead of a typed customer.
       - A rows-with-no-asset-type section (salmon, hidden unless the
         board names such rows) and a board message line at the top.
       - Content Controller: counts are empty spans the picker fills;
         the LBP item is gone. Greeting, Articles and Banner Ads start
         shown; the picker turns on (and locks) every section the plan
         has slots in.
       - NEW IPP_PICKER_ALLOC_MARKUP: the Allocations card for the right
         rail. Heading, Reload link, focus chips (ix-btn pill), the list,
         and the Show available assets link with its search.
       - Greeting section unchanged (it gains only).
     v1.6 and earlier: see ipp-picker-markup-v1.6.js.
   Markup strings for the Picker module (keeps the page Embed small).
   ============================================================ */
window.IPP_PICKER_CC_MARKUP = `<h4>Content Controller</h4>
<div class="ipp-cc-list">
  <div class="ipp-cc-item ipp-on" data-section="greeting"><div class="ipp-cc-box"></div><div class="ipp-cc-label">Greeting</div><span class="ipp-cc-count" data-ipp-cc-count="greeting" hidden></span></div>
  <div class="ipp-cc-item ipp-on" data-section="articles"><div class="ipp-cc-box"></div><div class="ipp-cc-label">Articles</div><span class="ipp-cc-count" data-ipp-cc-count="articles" hidden></span></div>
  <div class="ipp-cc-item" data-section="txa"><div class="ipp-cc-box"></div><div class="ipp-cc-label">The Find</div><span class="ipp-cc-count" data-ipp-cc-count="txa" hidden></span></div>
  <div class="ipp-cc-item" data-section="re"><div class="ipp-cc-box"></div><div class="ipp-cc-label">Real Estate</div><span class="ipp-cc-count" data-ipp-cc-count="re" hidden></span></div>
  <div class="ipp-cc-item" data-section="events"><div class="ipp-cc-box"></div><div class="ipp-cc-label">Events</div><span class="ipp-cc-count" data-ipp-cc-count="events" hidden></span></div>
</div>`;

window.IPP_PICKER_CANVAS_MARKUP = `
      <div class="ipp-board-msg" id="ipp_boardMsg" role="status">Reading this plan…</div>
      <div class="ipp-place-bar" id="ipp_placeBar" role="status" hidden></div>

      <section class="ipp-cat-section ipp-cat-untyped" id="ippCatUntyped" hidden>
        <div class="ipp-cat-head">
          <h5>Rows with no asset type</h5>
          <span class="ipp-ct"><span class="ipp-muted">The Picker can't place these in a section. Nothing is guessed.</span></span>
        </div>
        <div class="ipp-untyped-list" id="ipp_untypedList"></div>
      </section>

      <!-- ─── GREETING (first section, top of canvas) ─────────
           Two char-limited fields: Title (30) + Message (140). -->
      <section class="ipp-cat-section ipp-cat-greeting" id="ippCatGreeting">
        <div class="ipp-cat-head">
          <h5>Greeting</h5>
          <button type="button" class="ipp-ai-generate-btn" id="ipp_greetingGenerate" aria-label="Generate greeting with AI">
            <svg class="ipp-ai-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 5.5L19 9l-5.4 1.5L12 16l-1.6-5.5L5 9l5.4-1.5z"/><path d="M19.5 15.5l.8 2.6 2.7.4-2.4.9-.5 2.6-1-2.5-2.7-.4 2.4-.9z" opacity=".65"/></svg>
            <span class="ipp-btn-label">AI Generate</span>
          </button>
          <button type="button" class="ipp-ai-undo-btn" id="ipp_greetingUndo" hidden aria-label="Undo AI generation">
            <svg class="ipp-undo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>
            <span>Undo</span>
          </button>
          <span class="ipp-gr-actions">
            <button type="button" class="ix-revert ipp-cancel-link" id="ipp_grCancel" hidden aria-label="Cancel greeting edits">Cancel</button>
            <button type="button" class="ipp-gr-save" id="ipp_grSave" disabled aria-label="Save greeting">Save</button>
          </span>
          <span class="ipp-ct"><span class="ipp-muted">Opening message at the top of every issue</span></span>
        </div>
        <div class="ipp-greeting-row">
          <div class="ipp-greeting-field" data-ai="false">
            <label class="ipp-greeting-label" for="ipp_greetingTitle">Title <span class="ipp-char-limit">30 chars</span></label>
            <textarea class="ipp-greeting-input ipp-greeting-title" id="ipp_greetingTitle" maxlength="30" rows="1" placeholder="Issue greeting title"></textarea>
            <div class="ipp-char-count"><span id="ipp_greetTitleCount">0</span>/30</div>
          </div>
          <div class="ipp-greeting-field" data-ai="false">
            <label class="ipp-greeting-label" for="ipp_greetingParagraph">Paragraph <span class="ipp-char-limit">300 chars</span></label>
            <textarea class="ipp-greeting-input ipp-greeting-para" id="ipp_greetingParagraph" maxlength="300" rows="3" placeholder="The opening paragraph for the issue"></textarea>
            <div class="ipp-char-count"><span id="ipp_greetParaCount">0</span>/300</div>
          </div>
          <div class="ipp-greeting-field" data-ai="false">
            <label class="ipp-greeting-label" for="ipp_greetingSupershort">Super-short <span class="ipp-char-limit">140 chars</span></label>
            <textarea class="ipp-greeting-input ipp-greeting-ss" id="ipp_greetingSupershort" maxlength="140" rows="2" placeholder="A short one-line version (preview / mobile)"></textarea>
            <div class="ipp-char-count"><span id="ipp_greetSSCount">0</span>/140</div>
          </div>
        </div>
      </section>

      <section class="ipp-cat-section ipp-cat-articles" id="ippCatArticles">
        <div class="ipp-cat-head">
          <h5>Articles</h5>
          <span class="ipp-ct" data-ipp-sec-count="articles"></span>
        </div>
        <div class="ipp-cat-tiles" id="ipp_artTiles"></div>
      </section>

      <!-- ─── THE FIND (Text Ad) ───────────────────────────────── -->
      <section class="ipp-cat-section ipp-cat-txa" id="ippCatTXA" hidden>
        <div class="ipp-cat-head">
          <h5>The Find</h5>
          <span class="ipp-ct" data-ipp-sec-count="txa"></span>
        </div>
        <div class="ipp-list-tiles" id="ipp_txaTiles"></div>
      </section>

      <!-- ─── REAL ESTATE ──────────────────────────────────────── -->
      <section class="ipp-cat-section ipp-cat-re" id="ippCatRE" hidden>
        <div class="ipp-cat-head">
          <h5>Real Estate</h5>
          <span class="ipp-ct" data-ipp-sec-count="re"></span>
        </div>
        <div class="ipp-list-tiles" id="ipp_reTiles"></div>
      </section>

      <!-- ─── EVENTS ───────────────────────────────────────────── -->
      <section class="ipp-cat-section ipp-cat-events" id="ippCatEvents" hidden>
        <div class="ipp-cat-head">
          <h5>Events</h5>
          <span class="ipp-ct" data-ipp-sec-count="events"></span>
        </div>
        <div class="ipp-list-tiles" id="ipp_evTiles"></div>
      </section>
      `;

window.IPP_PICKER_ALLOC_MARKUP = `
  <div class="ipp-al-head">
    <h4 class="ipp-al-title">Allocations from print</h4><span class="ipp-al-info" data-ipp-al-info></span>
    <span class="ipp-al-headicon">
      <button type="button" class="ipp-al-reload" data-ipp-al-reload aria-label="Refresh the list" title="Refresh">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>
      </button>
      <span class="ipp-al-lock" data-ipp-al-lock hidden role="img" aria-label="This plan is locked" title="This plan is locked">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
      </span>
    </span>
  </div>
  <div class="ipp-al-list" id="ipp_alList" aria-live="polite"></div>
  <div class="ipp-al-legend" aria-label="What the dots mean">
    <span><i class="ipp-dot ipp-dot--gray"></i>to place</span>
    <span><i class="ipp-dot ipp-dot--orange"></i>no article yet</span>
    <span><i class="ipp-dot ipp-dot--hgreen"></i>in a tile, no article</span>
    <span><i class="ipp-dot ipp-dot--green"></i>in the issue</span>
  </div>
`;
