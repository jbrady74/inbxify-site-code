/* ============================================================
   ta-rte-v1.1.24.js
   INBXIFY — Shared Rich Text Editor Component
   Trix-based RTE with MEDIA image picker + Uploadcare insertion
   Mounts into any container via InbxRTE.init(config)

   v1.1.24 changes (URGENT picker scroll bug — display:flex override):

     PROBLEM: The "Insert image from MEDIA library" modal stopped
     scrolling. Articles with more than ~20 MEDIA images had
     thumbs cut off at the viewport bottom with no scrollbar.

     ROOT CAUSE: togglePicker() at line 1376 set
       panel.style.display = 'block'
     to show the panel. Inline styles have specificity 1000 and
     beat the CSS rule
       .rte-fs-mount .rte-picker-panel { display:flex; ... }
     (specificity 20). With display:block instead of flex, the
     panel's children (header, body, bottom bar) were no longer
     flex items. The body's `flex:1; overflow-y:auto` had no
     effect because flex:1 only works inside a flex parent.
     Body height auto-expanded to its content, and the panel's
     overflow:hidden clipped everything past viewport. The body
     itself never overflowed (because it grew with content), so
     overflow-y:auto had nothing to scroll.

     This regression existed since v1.1.19 (when fullscreen mode
     was introduced with flex layout). The togglePicker show/hide
     was never updated to match the new layout system.

     FIX: one-line change. Toggle inline display to match mode:
       panel.style.display = this.cfg.fullscreen ? 'flex' : 'block'

     In inline mode (used outside the ABE), the picker continues
     to use block as before — no regression. In fullscreen mode
     (ABE), the picker uses flex so the body can scroll.

   ──────────────────────────────────────────────────────────
   v1.1.23 changes (TD-178 UX refinement — Replace in editor):

     The Assess Content side panel's per-finding [Copy] button is
     replaced with a primary [Replace in editor] button that performs
     the find-and-replace directly in the Trix editor. The operator
     no longer has to scroll the article behind the panel, find the
     original snippet manually, select it, paste the replacement,
     and verify the change.

     Mechanics:
       1. Read the editor's current plain-text via
          trixEditor.getDocument().toString()
       2. Find original_text in that string (exact match first; if
          not found, normalize whitespace and try again — but only
          for the existence check, not for position mapping)
       3. If found: setSelectedRange to [idx, idx + length],
          insertString(replacement_text). Trix handles the rest.
       4. Mark editor dirty so Save to CMS knows there's a change.
       5. Flip the button to "✓ Replaced" disabled.

     Fallback: a small ghost-style [Copy] icon-link stays in place
     next to the Replace button for cases where:
       - Replace can't find the text (whitespace mismatch, image
         attachments breaking the plain-text mapping, etc.)
       - Operator wants to use the replacement somewhere else
         (e.g., to paste into a separate note)

     Toast feedback on every action:
       - Success: "Replaced in editor"
       - Multiple matches: "Replaced first of N occurrences"
       - Not found: "Text not found — copy manually"

     Side panel width and position unchanged (480px from right) —
     with Replace as the primary, panel coverage of the article
     no longer matters since the operator never needs to interact
     with the article body manually.

   ──────────────────────────────────────────────────────────
   v1.1.22 changes (TD-178 — "Assess Content using Claude" button):

     New button in the ABE header: [⊕ Assess Content]. Click opens
     a right-side slide-in panel that runs the article body through
     Claude (claude-sonnet-4-5 by default) with web_search tool
     enabled, returning a structured staleness/accuracy review.

     Each finding is rendered as a card with:
       - Priority pill (high/medium/low)
       - Category pill (factual/stylistic/editorial)
       - Original snippet (verbatim from article — what to find)
       - Replacement snippet (drop-in replacement copy)
       - [Copy replacement] button — one-click clipboard copy
       - Reasoning text

     Plus a summary at top + editorial questions list at bottom.

     Frontend-only feature. The existing inbxify-anthropic-proxy
     Cloudflare Worker is a transparent forwarder to Anthropic's
     /v1/messages — no worker change needed. The JS builds the
     full Anthropic request (model, system prompt, tools, messages)
     and POSTs it to window.TA_CONFIG.anthropicProxy.

     System prompt instructs Claude to:
       - Identify time-stamped facts that may be stale
       - Use web_search to verify (cookbook counts, follower counts,
         business statuses, etc.)
       - Return structured JSON wrapped in <findings_json> tags
       - Produce drop-in replacement copy (no [brackets], no TBDs)
       - Omit findings rather than guess

     Constants at top of file:
       ANTHROPIC_MODEL = 'claude-sonnet-4-5'
       ANTHROPIC_WEB_SEARCH_MAX_USES = 5
       ANTHROPIC_MAX_TOKENS = 4000

     Date inputs:
       - "Target issue date" (required, defaults to first of next month)
       - "Article originally published" (optional)

     UX:
       - Side panel from right, 480px wide, slides in via CSS transform
       - ESC closes panel; click outside doesn't close (deliberate —
         user might want to edit while the panel is open)
       - Z-index 10025 — above ABE (10000), picker (10010), lightbox (10020)
       - Loading state: spinner + "Analyzing… 30-60 seconds typical"
       - Failure state: error message + "Try again" button

     Multi-modal coordination:
       - Opening Assess closes the picker if open (deliberate single-focus)
       - Lightbox still works on top of Assess panel (e.g. preview an
         image referenced in a finding's original_text)

     Operator-only feature (Studio convention). No publisher exposure.

     Tier 1 scope only (per locked plan): surfaces findings + makes
     replacement easy to copy. Auto-apply / inline edit / diff view
     deferred to Tier 2.

   ──────────────────────────────────────────────────────────
   v1.1.21 changes (Item #5 part 1 — Picker thumb expand icon):

     Each MEDIA image picker thumb now has a small expand icon
     (top-right corner) that opens the shared ix-lightbox modal
     showing the image at full resolution + caption.

     Companion: ix-lightbox-v1.0.0.js — MUST be loaded BEFORE
     ta-rte on the page. Defines window.InbxLightbox.open(url, opts)
     and the .ix-expand-icon / .ix-expand-icon-host shared classes.

     Markup change:
       Inside renderItem() — when m.imageUrl is set, the .rte-picker-thumb
       container gains the .ix-expand-icon-host class and contains a
       <button class="ix-expand-icon"> with an inline SVG magnify icon.
       NO icon for items without imageUrl (defensive — shouldn't happen
       since the picker filters to mediaType==='Image' AND imageUrl).

     Click handling:
       The expand button's click handler calls e.stopPropagation()
       BEFORE invoking InbxLightbox.open. Without this, the click
       would also fire the thumb's select handler (registered on
       .rte-picker-item) and toggle selection. With stopPropagation,
       expand and select are clearly separated: click thumb body →
       select; click corner icon → preview.

     CSS:
       No new CSS in this file. The .ix-expand-icon / .ix-expand-icon-host
       styles ship from ix-lightbox-v1.0.0.js so both surfaces (RTE
       picker + Components tab cards) share one source of truth.

     Behavior detail:
       - Lightbox ESC handler is window-level capture-phase, so when
         lightbox is open INSIDE the RTE picker (which itself has a
         document-level capture-phase ESC handler from v1.1.19),
         ESC closes the lightbox first. Picker stays open. Press
         ESC again to close picker.

   ──────────────────────────────────────────────────────────
   v1.1.20 changes (CSS regression fix from v1.1.19):

     Bottom bar layout was broken because two legacy inline-mode
     CSS rules leaked into the new fullscreen bottom-bar variant:

       .rte-picker-format-row { width:100%; margin-top:6px; flex-wrap:wrap; }
       .rte-picker-caption-wrap { min-width:180px; }

     Effects in v1.1.19:
       • Format-row consumed 100% of the row, pushing the Save
         button off the right edge into overflow:hidden — Save
         appeared "missing"
       • Size: label appeared eaten because the format-row's
         100% width + the wrap caused unexpected layout
       • Caption input got squeezed against the size buttons

     Fix (CSS-only — no JS / no markup change):
       Added .rte-picker-bottom-bar-scoped overrides:
         • .rte-picker-format-row → width:auto; margin:0; flex-wrap:nowrap; flex-shrink:0
         • .rte-picker-caption-wrap → min-width:160px (was 180)
         • .rte-picker-caption-input → flex:1; min-width:0 (allow proper shrink)
         • .rte-picker-size-label, .rte-img-size-strip, .rte-img-align-strip → flex-shrink:0
         • .rte-picker-bottom-bar flex-wrap:nowrap → wrap (lets bar break to two rows at narrow widths)

     No new state, no markup change, no JS change. Pure CSS regression fix.

   ──────────────────────────────────────────────────────────
   v1.1.19 changes (Item #4 — Full-screen image picker modal):

     The MEDIA image picker, when the RTE is in fullscreen mode (ABE
     used by Studio Assembler + UP Transcriber), now renders as a
     true full-screen modal with a sticky bottom action bar — replacing
     the previous bottom-sheet (50vh slide-up) layout.

     Layout (fullscreen mode only — non-fullscreen unchanged):
       • Full-bleed overlay over the editor with 16px margin scrim
       • Header: title + live filter search box + count + close X
       • Body (scrolls): "Already in this article (N)" + "Available
         to insert (N)" sections with bigger 80px thumbs
       • Sticky bottom bar (Option B): Cancel + Caption + Size strip
         + Align strip + Save. All controls that affect the pending
         insert live in one row at the bottom.

     New state: this.pickerSearch (string, default '').

     New behavior:
       • Search input live-filters both sections by m.name substring
         (case-insensitive). Empty search shows everything. Section
         label hides if its filtered count is zero.
       • ESC key while picker is open closes the picker (separate
         from the editor-level ESC which closes the whole ABE — the
         picker handler stops propagation so editor ESC doesn't also
         fire).
       • Cancel button closes the picker without inserting (same
         action as the close X).
       • Save button = the prior "Insert at cursor" — disabled until
         a thumb is selected.

     What this preserves:
       • Non-fullscreen mode picker layout unchanged (per Q6 lock).
         renderPicker branches on this.cfg.fullscreen.
       • insertImage() unchanged. Caption read still hits the
         #{id}-caption input (same id, new placement).
       • All click-to-edit popover behavior from v1.1.18 intact.
       • size/align active state uses existing TEAL fill + white text
         pattern (from v1.1.5 styles) — NOT gold as some early mockups
         showed. Existing CSS classes (.rte-img-size-btn.active,
         .rte-img-align-btn.active) are reused.

     What this does NOT change:
       • Make scenarios — no payload changes
       • Underlying body-save flow (Studio v1.3.6 owns that)
       • Path B / Item #1 image render rules

   ──────────────────────────────────────────────────────────
   v1.1.18 changes (Click-to-Edit Attached Image — proper rewrite):

     CONTEXT: v1.1.16 and v1.1.17 attempted click-to-edit but both
     failed. v1.1.16 bound the click on trix-editor (bubble phase) —
     Trix intercepts. v1.1.17 fixed click via document-level capture
     but also added an editor-layout CSS rule that broke WYSIWYG and
     shoved Trix's native attachment toolbar into a bad position.

     The real fix required understanding Trix's two attachment
     rendering modes — info I was guessing at before. From actual
     DOM inspection:

       NEW INSERTS (text/html attachments built by insertImage()):
         <figure data-trix-attachment="..." data-trix-content-type="text/html"
                 class="attachment attachment--html" data-trix-id="N">
           <figure class="rte-inserted-image" data-img-size="..." data-img-align="...">
             <img src="https://uyluucdnr2.ucarecd.net/..." data-media-id="...">
           </figure>
           <figcaption class="attachment__caption"></figcaption>
         </figure>

       LEGACY IMAGES (loaded from saved post-body, auto-created by Trix):
         <figure data-trix-attachment="{...JSON...}" data-trix-content-type="image"
                 class="attachment attachment--preview" data-trix-id="N">
           <img src="https://cdn.prod.website-files.com/..." data-trix-mutable="true">
           <figcaption class="attachment__caption attachment__caption--editing">...</figcaption>
           <figcaption class="attachment__caption" style="display:none;"></figcaption>
           <div class="attachment__toolbar">[Trix's native X button etc.]</div>
         </figure>

     v1.1.16's selector figure.rte-inserted-image only matched the
     NEW insert format. Legacy images (i.e. every image in every
     existing article) never fired the handler. That's why clicks
     "did nothing" in Assembler — those were all legacy.

   v1.1.18 FIX:

     1. Click selector matches figure[data-trix-attachment] — any
        Trix image attachment, both formats. Bail when click is on
        .attachment__toolbar so Trix's native controls still work
        (though we also hide that toolbar — see CSS).

     2. State extraction with two branches:
        - Inner figure.rte-inserted-image present → new-insert
          format, read size/align/img attrs from inner
        - Otherwise → legacy image attachment, default size=large
          align=center, img info from outer <img> + parsed
          data-trix-attachment JSON

     3. Apply with two branches:
        - text/html attachment → setAttribute('content', newHTML).
          Trix re-renders attachment in place. (v1.1.2 lesson.)
        - image attachment (legacy) → v1.1.2 removal pattern
          (getRangeOfAttachment → setSelectedRange → deleteInDirection)
          then insertAttachment(new Trix.Attachment({content:newHTML})).
          This UPGRADES the legacy native image into our normalized
          rte-inserted-image format. Side benefit: editing legacy
          content over time migrates it to the proper format.

     4. Replace: same pattern. insertImage() flagged with
        _replacingAttachment branches on the attachment's content
        type and uses the right path.

     5. ONE CSS rule that hides .attachment__toolbar inside any
        Trix attachment wrapper in the editor. Targeted hide, no
        layout change to the figure or img. Suppresses the "X close
        to top" UI that competed with our popover.

     6. NO outer-wrapper CSS — leave editor image rendering exactly
        as v1.1.15 has it. Editor WYSIWYG (size/position visual)
        is a separate task, to be addressed after click-to-edit
        is verified.

     Click handler is bound at document level on the capture phase
     (document.addEventListener('click', handler, true)) so Trix's
     bubble-phase listeners can't prevent it.

     Console log on every fire: [RTE] click-to-edit fired on
     <outer> (mode: html | image) | size=X align=Y — so diagnostic
     is one-tab away if anything misfires.

   v1.1.15 changes (Spectral body + H3 bump + image-size fix):

     PART A — Typography update (WYSIWYG, both surfaces):
       Body:  DM Sans 16/1.7  →  Spectral 18/1.95
              (font-family, font-size +2px, line-height ×1.15)
       H3:    Fraunces 600 19/1.3  →  Fraunces 600 22/1.3
              (font-size +3 — body bump to 18 collapses H3/body
              ratio to 1.06; bump H3 to 22 restores 1.22)
       H2:    UNCHANGED (24/1.25 still gives 1.33 ratio at body 18)

       Spectral loaded globally via Webflow Project Settings →
       available on every page including Studio. No @import in
       this file — would duplicate-fetch on every editor mount.

       Companion change shipped in parallel:
         .article-body-rte inline <style> in Articles Webflow
         template head — same Spectral 18/1.95 desktop body,
         H3 22, PLUS new @media breakpoints:
           desktop ≥992 : 18 / 1.95
           tablet  ≤991 : 17 / 1.9
           mobile L ≤767: 16 / 1.85
           mobile P ≤479: 16 / 1.8
         Studio Trix is desktop-only (operator tool), so no
         @media rules here.

     PART B — Image size + alignment "ignoring selection" fix:
       PROBLEM: Image sizer (33/50/75/100%) and aligner (L/C/R)
       buttons in the MEDIA picker and inline-upload modal
       appeared to do nothing in the Trix editor preview, even
       though the figure HTML was emitted with correct
       data-img-size / data-img-align attributes. State capture,
       button render, write-out — all clean. Diagnostic in
       v1.1.14 source confirmed.

       ROOT CAUSE: Trix wraps every Attachment in an outer
       <figure class="attachment attachment--html"> with its own
       layout semantics (inline-block shrink-wrap, inline-styled
       width based on natural content). The inner
       <figure class="rte-inserted-image"> max-width:50% was
       being measured against the outer wrapper's contracted
       width, not against the editor body — so 50% of a shrink-
       wrapped wrapper rendered visually identical to 75% of one.
       The CSS rules at lines 1704-1712 work fine on the
       published article page (no Trix wrapper there); this is a
       Trix-context-only failure.

       FIX: write inline style="max-width:X%;margin-left:Y;
       margin-right:Z;" directly onto the inner figure at insert
       time. Inline style on the inner figure defeats outer-
       wrapper interference regardless of how Trix renders the
       attachment. data-img-size and data-img-align attrs kept
       — save-side CSS still uses them (article CSS with
       !important wins over inline style at the same property,
       which is correct).

       Three insertion paths patched identically:
         1. insertImage() — MEDIA picker insert         (line ~1104)
         2. swapPlaceholderForImage finalHTML — inline upload swap (~1382)
         3. insertCompletedInlineImage() — fallback path (~1401)

       New helpers added near esc():
         IMG_SIZE_PCT  — { small:'33%', medium:'50%', large:'75%', full:'100%' }
         IMG_ALIGN_CSS — { left, center, right } → margin CSS fragments

     PART C — WYSIWYG mismatch corrected on article side:
       Trix-side "large" = 75%, article-side "large" was 90%.
       Companion CSS update brings article side to 75% to match
       Studio button labels (33/50/75/100). No change here in JS.

     No Trix config changes. No DOM structure changes. No
     Scenario changes. ta-page-body unchanged. ta-studio
     unchanged. cleanHTMLForWebflow preserves inline style attr
     by default — verified no patch needed there.

   v1.1.14 changes (CSS !important armor — h2/h3 finally render):
     PROBLEM: v1.1.13 updated h2/h3 rules to Fraunces 600 24px/19px
     teal, but live diagnostic in the Studio editor revealed the
     rules were only PARTIALLY applying:
       computed for h2:
         font-family: "Arial"      (ours: 'Fraunces',Georgia,serif)
         font-size:   "12px"       (ours: 24px)
         font-weight: "600"        ✓ ours wins
         color:       "rgb(26,58,58)"  ✓ ours wins
     Weight and color won because Webflow's global h2 rules don't
     set those properties. Font-family and font-size LOST because
     Webflow's global h2 has !important on those two properties,
     beating our non-!important values.

     This is the same pattern as .article-body-rte on the article
     page — those rules already carry !important on font-size and
     font-weight for exactly this reason. The RTE injectStyles
     omitted the armor; v1.1.13 inherited that gap.

     FIX: add !important to every property on the h2 and h3 rules
     (font-family, font-size, font-weight, line-height, color,
     margin). Belt-and-suspenders so future Webflow theme updates
     can't silently retake any property. Lines 1652-1653.

     Companion note: the article page (.article-body-rte) CSS
     currently has !important on font-size + font-weight but NOT
     on font-family. If the article page also shows Arial instead
     of Fraunces under inspect-element after deploy, add
     `!important` to font-family there too in a follow-on patch
     to the inline <style> in the Articles Webflow template head.

     No JS logic changes. No Trix config changes.

   v1.1.13 changes (WYSIWYG typography fix):
     PROBLEM: RTE preview did not match the rendered article page
     for headings and body copy. Two failures:
       1. H2/H3 declared 'Tenor Sans' which is not loaded on the
          T-A page (only DM Sans, DM Mono, Fraunces are imported).
          Both silently fell back to generic serif. H2 looked like
          a slightly bigger Times line in the same teal as body —
          read as "nothing happened" when toggled.
       2. H3 color was #C4A35A (brand gold). Gold is an ACCENT
          color (save buttons, dirty borders, blockquote rule)
          and should not be applied to body section headings.

     FIX — replace lines 1620-1621 (now using Option A spec):
       H2: Fraunces 600 teal #1A3A3A at 24px
       H3: Fraunces 600 teal #1A3A3A at 19px (no longer gold)
     Also: body base font-size 14px → 16px (Option A spec) so the
     editor canvas matches the article page body cadence.

     IMPORTANT — companion change required on article render page:
       The article page <head> CSS for .article-body-rte h2/h3/p
       must be updated to the same Option A spec so the saved HTML
       renders identically in production. Stylesheet is currently
       inline in the Articles Webflow template head. See chat
       deliverable accompanying this file ship.

     Fraunces 600 is already imported on the T-A page via the
     existing Google Fonts <link> in the page head — no font
     import work needed for the editor itself.

     No JS logic changes. No Trix config changes. No Scenario
     changes. ta-page-body unchanged. ta-studio unchanged.

   v1.1.5 changes (S13 — Image size + alignment controls):
     PROBLEM: Images inserted via picker or inline upload were
     rendering stretched at every breakpoint in production because:
       1. No size/alignment attrs written to <figure> at insert time
       2. Webflow's global img { width:100% } overrides everything
       3. No CSS armor on figure.rte-inserted-image for the saved
          HTML context (only trix-editor-scoped rules existed)
       4. Publisher had no way to control image size or alignment

     FIX — Picker UI additions:
       - Size control: Small (33%) / Medium (50%) / Large (75%) /
         Full width (100%) segmented button strip in picker actions bar
         Default = Large (75%). Persists while picker is open.
       - Alignment control: Left / Center / Right icon buttons.
         Default = Center. Available only when size < Full width.
       - Both controls also added to the inline upload modal (below
         Component Role dropdown), same defaults, same behavior.

     FIX — figure attribute writes:
       insertImage() and insertCompletedInlineImage() now write:
         data-img-size="small|medium|large|full"
         data-img-align="left|center|right"
       onto the <figure>. These attrs survive Trix serialization and
       are present in the saved HTML written to Webflow CMS.

     FIX — CSS: figure.rte-inserted-image rules (both inside Trix
       and in saved-HTML context via bare class selector):
         [data-img-size="small"]  { max-width:33% }
         [data-img-size="medium"] { max-width:50% }
         [data-img-size="large"]  { max-width:75% }
         [data-img-size="full"]   { max-width:100% }
         [data-img-align="left"]  { margin-right:auto }
         [data-img-align="center"]{ margin-left:auto; margin-right:auto }
         [data-img-align="right"] { margin-left:auto }
       All <img> inside .rte-inserted-image get width:100%; height:auto
       — locks the img to the figure's constrained width, preventing
       Webflow global styles from stretching.

     Hardcoding log: HC-IMG-001
       Size options (small=33%, medium=50%, large=75%, full=100%)
       hardcoded in picker HTML and CSS. If configurable sizes are
       needed per-title in future, add imgSizeOptions to InbxRTE
       init config and read from TA_CONFIG.

     Webflow head deploy:
       SWAP: ta-rte-v1.1.4.js → ta-rte-v1.1.5.js
       Also add figure.rte-inserted-image CSS to your article/NL
       render templates (or global head) — see "Saved HTML CSS" block
       in injectStyles() comment. The injectStyles() rules only apply
       inside the T-A Studio tool. The article render page needs the
       same figure[data-img-size] rules applied globally.

   v1.1.4 changes (S11.5b Wave 2 — TD-160 button system migration):
     Additive class migration for chrome-level RTE buttons (8 emit
     sites). Every <button> outside the Trix toolbar now carries
     BOTH the legacy class AND the new ix-btn ix-btn--* classes.
     The ix-buttons-v1.0.0.css module (loaded in T-A page <head>)
     provides the visual rules with armor.

     Migrated emits:
       - rte-close-btn (fullscreen ✕)        → ix-btn ix-btn--ghost ix-btn--icon
       - rte-btn-cancel (footer cancel)      → ix-btn ix-btn--ghost
       - rte-btn-save (footer Save to CMS)   → ix-btn ix-btn--primary
       - rte-picker-close                    → ix-btn ix-btn--ghost
       - rte-picker-insert-btn (Insert ...)  → ix-btn ix-btn--primary
       - rte-up-modal-close (✕ on modal)     → ix-btn ix-btn--ghost ix-btn--icon
       - rte-up-btn-cancel (modal Cancel)    → ix-btn ix-btn--ghost
       - rte-up-btn-go (modal Upload)        → ix-btn ix-btn--primary

     INTENTIONALLY NOT MIGRATED — Trix toolbar internal buttons:
       - rte-custom-btn (H2, H3 buttons)
       - rte-img-insert-btn (gold-tinted "Image" picker trigger)
       - rte-img-upload-btn (teal-tinted "Upload Inline Image")
       These live inside <trix-toolbar> and must match Trix's own
       toolbar visual conventions (30px height, specific padding,
       inline alignment with H2/H3/bold/italic siblings). They do
       NOT belong in the canonical button system — they're toolbar
       items, not buttons in the standalone sense. The chrome-cascade
       armor rules added in v1.1.3 (trix-toolbar .rte-img-insert-btn
       and trix-toolbar .rte-img-upload-btn) STAY in injectStyles()
       — those are the right armor for toolbar-internal buttons.
       This was a finding during the Wave 2 migration; updates the
       scope of TD-160 to exclude toolbar-internal items.

     No JS behavior changes. No new config options. No DOM structure
     changes. Pure additive class migration on existing markup.

     Webflow head deploy:
       SWAP: ta-rte-v1.1.3.js → ta-rte-v1.1.4.js
       (ix-buttons-v1.0.0.css already loaded from Wave 1 — no head
        changes needed beyond the JS swap.)

   v1.1.3 changes (S11 — Part C support + button color fix):
     - NEW config option: disableImages (default false). When true,
       the RTE renders without ANY image affordances:
         * No "Image" picker toolbar button
         * No "Upload Inline Image" toolbar button
         * No <input type=file> hidden input
         * No image-paste clipboard handler
         * No picker panel markup in render output
       Used by Transcriber (S11 Part C) — Transcriber is a text-only
       intake tool; body images are handled separately via Studio.
       Architectural rationale: image insertion via Transcriber would
       leave MEDIA rows in Status=Available without reconciliation
       (Scenario E does not run Route 3's marker iterator). Removing
       the affordance entirely sidesteps the soft-invariant drift.

     - NEW config option: hideFooter (default false). When true,
       the RTE's own Save / Cancel / dirty-indicator footer is
       suppressed. Used by Transcriber where the host page provides
       its own Save Draft button that ships title + teaser + body
       together to Scenario E.

     - FIX: .rte-img-upload-btn color cascade. Existing rule had
       background:${TEAL} !important; color:white !important; but
       Trix's toolbar re-render was sometimes leaving the button
       face light-toned with barely-visible text (reported as
       Image 2 in the S11 prep thread). Bumped selector specificity
       to trix-toolbar .rte-img-upload-btn and made the rule
       resilient to Trix's class manipulation.

   v1.1.2 changes (S11 testing fix #2):
     - Placeholder swap rewritten to use Trix's API instead of direct
       DOM mutation. Diagnostic showed that classList/innerHTML
       changes to figures inside <trix-editor> are reverted on the
       next Trix render tick, because Trix re-renders from its
       internal Document model (which doesn't know about the
       mutations). The new pattern:
         1. Save the Trix.Attachment object handle when inserting the
            placeholder (this._pendingUploadAttachment)
         2. On success, call doc.getRangeOfAttachment(ph) → setSelectedRange
            → deleteInDirection('forward') to remove the placeholder
            from Trix's model, then insertAttachment(real) to add the
            final image. Same approach for failure-path removal.
       This makes Trix's model the single source of truth, so the
       UI stays consistent and the saved HTML carries the real
       data-media-id (not the placeholder's data).

   v1.1.1 changes (S11 testing fix #1, superseded by v1.1.2):
     - swapPlaceholderForImage(): tried class-only DOM lookup. Did
       find the element but DOM mutations got reverted by Trix.
     - .rte-img-upload-btn span: explicit color:white !important to
       override Trix's .trix-button cascade that was bleeding the
       text color toward gray on first paint. (Retained in v1.1.2,
       extended in v1.1.3.)

   v1.1.0 changes (S11 — Phase 3 Part B — RTE inline upload):
     - NEW: "Upload Inline Image" toolbar button. Opens a modal that
       shows a thumbnail preview, file metadata, and a Component Role
       dropdown (default: Interior Image; option: Main Image). On
       confirm, browser uploads the file directly to Uploadcare via
       their /base/ endpoint, then POSTs metadata to Scenario B
       Route 5 (rte-inline) which creates a MEDIA row with
       Status=Available and returns { uploadcareUrl, mediaItemId }.
       Inserts <figure><img data-media-id="..."></figure> at cursor —
       same shape as the picker, so Studio's S10 marker iterator
       reconciles Status to Attached on body save.

     - NEW: Paste-from-clipboard support. If the user pastes one or
       more image files (e.g. screenshot via Cmd+Ctrl+Shift+4 then
       Cmd+V), the FIRST image is routed to the upload modal. If
       multiple images are present, a toast advises the user to
       paste one at a time. Multi-image queue is deferred (TD-154).

     - NEW: Inline placeholder pattern. While the upload pipeline
       runs (Uploadcare upload → Scenario B Route 5), an inline
       <img> placeholder with a spinner is shown at the cursor.
       On success, the placeholder is swapped to the real
       <figure><img data-media-id="..."></figure>. On failure the
       placeholder is removed and a toast prompts retry.

     - NEW: File validation (client-side, before upload fires):
         - MIME types: png, jpeg, webp, gif, svg+xml, heic, heif
         - Size cap: 10 MB hard ceiling
       Rejection produces a toast with the reason; no orphan
       Uploadcare or MEDIA artifacts.

     - NEW: TA_CONFIG getters. RTE now reads the following
       values directly from window.TA_CONFIG (mirroring Studio +
       Content Library + RTE picker patterns):
         - uploadcarePublicKey (NEW in TA_CONFIG, HC-003)
         - makeConditioner
         - titleSlug, taItemId
         - optionIds.componentRole.{mainImage,interiorImage}
         - optionIds.mediaType.image (NEW in TA_CONFIG)
         - optionIds.mediaStatus.available
       publisherId is read from #title-admin-id [data-pub] in the
       DOM (TA_CONFIG does not expose it).
       No new options added to InbxRTE.openFullscreen / init API.

     - Cancel dialog copy update: when the user cancels with dirty
       state, the confirm now notes that any images they uploaded
       inline remain in "Ready to Assign" and can be picked later.

     - Drag-and-drop is intentionally NOT added in v1.1.0 — TD-157.
       Toolbar button + paste cover the primary affordances and ship
       lighter/safer.

   v1.0.2 changes (S9 Part A — picker fix + article-link affordance):
     - readMediaItems(): SELECTOR FIX
         was: querySelector('.media-wrapper').querySelectorAll('.w-dyn-item')
         now: querySelectorAll('.media-wrapper[data-item]')
         Reason: post-S6 MEDIA collection items are flat at document level —
         each .media-wrapper[data-item] IS the item, not a parent of items.
         Aligns with Studio's cmpReadItems() pattern in ta-studio-v1.2.6.js:2748.
     - articleSlug config option added (passed by Studio at openFullscreen call)
     - Article title in header is now a clickable link to the live Article page,
       opening in a new tab. Slug-based: https://{titleSlug}.inbxify.com/articles/{articleSlug}
       (or whatever publishedSiteOrigin resolves to). Falls back to a plain badge
       if articleSlug is not provided.
     - openFullscreen / init contracts UNCHANGED — Studio v1.2.6 keeps working
       without modification (just won't show the link until Studio passes articleSlug).

   v1.0.1 changes (S9 Part A — schema migration only):
     - readMediaItems(): rewritten for post-S6 MEDIA schema
         data-media-id / data-media-name / data-media-type /
         data-component-role / data-status / data-article-id / data-image-url
     - Picker filter: mediaType === 'Image' AND (articleId === current OR status === 'Available')
     - Status binding is option NAME not hash (HC-006 precedent)
     - T-A scope is server-side via Collection List filter — no JS scope filter
     - Insert flow: <img src> uses bare data-image-url (no JS-side transform)
                   data-media-id attribute on <img> = Webflow MEDIA Item ID
     - Removed: imageWidths config, width selector UI, buildUcUrl helper
     - Caption input retained
     - Fixed duplicate destroy() method (TD-137)

   Out of scope for v1.0.2 (deferred to A.3 / Part B):
     - Route 4 attach on body save reconciliation (A.3)
     - Inline upload mode (Part B)
     - Embedded mode adoption by Transcriber (Part C)
   ============================================================ */

(function () {
  'use strict';

  const VERSION = '1.1.24';
  const TRIX_CSS = 'https://unpkg.com/trix@2.0.10/dist/trix.css';
  const TRIX_JS = 'https://unpkg.com/trix@2.0.10/dist/trix.umd.min.js';

  /* ── Brand tokens ── */
  const TEAL = '#1a3a3a';
  const GOLD = '#c4a35a';
  const CREAM = '#faf9f5';
  const CREAM_ALT = '#f0edd8';
  const BORDER = '#e8e4d8';
  const TEXT_DARK = '#1a3a3a';
  const TEXT_MID = '#5a6a5a';
  const TEXT_LIGHT = '#8a8a7a';
  const TEXT_TINY = '#a0a090';

  // v1.1.22 (TD-178): Anthropic API config for Assess Content feature.
  // Swap ANTHROPIC_MODEL here if a different stable model is preferred.
  // The web_search tool is enabled to let Claude verify time-stamped
  // facts (cookbook counts, follower counts, business statuses, etc.)
  // against the live web — without it, the analysis would only catch
  // staleness Claude can infer from training data.
  const ANTHROPIC_MODEL = 'claude-sonnet-4-5';
  const ANTHROPIC_WEB_SEARCH_MAX_USES = 5;
  const ANTHROPIC_MAX_TOKENS = 4000;

  /* ── Default config ── */
  const DEFAULTS = {
    mountSelector: '#ta-rte-mount',
    mediaWrapperSelector: '.media-wrapper',  // legacy — ignored in v1.0.2; readMediaItems uses canonical .media-wrapper[data-item] query
    uploadcareBase: null,             // e.g. 'https://uyluucdnr2.ucarecd.net' — read from TA_CONFIG (used for thumb display only in v1.0.1)
    webhookUrl: null,                  // Make webhook for saving (legacy fallback; Studio passes onSave)
    articleItemId: null,               // Webflow Article Item ID — {Self} Item ID
    articleTitle: '',                   // Display name for context
    articleViewUrl: '',                 // Optional full URL to view the live Article (badge becomes a link if provided)
    initialHTML: '',                    // Pre-fill body content
    mode: 'edit',                      // 'edit' | 'review' (review = Transcriber output)
    fullscreen: false,                 // true = render in fullscreen overlay appended to body
    onSave: null,                      // callback(html, articleItemId)
    onCancel: null,                    // callback()
    onClose: null,                     // callback() — fullscreen close (after cancel confirm if dirty)
    disableImages: false,              // v1.1.3: when true, suppress all image affordances (picker btn, upload btn, file input, paste handler, picker panel). Used by Transcriber (text-only intake).
    hideFooter: false,                 // v1.1.3: when true, suppress the RTE's own Save/Cancel/dirty footer. Used by Transcriber where the host page owns the save button.
  };

  /* ── Utility ── */
  function loadCSS(href) {
    if (document.querySelector(`link[href="${href}"]`)) return Promise.resolve();
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
    });
  }

  function loadScript(src) {
    if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
    if (window.Trix) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ── v1.1.15: Inline-style maps for image size + alignment ──
     Belt-and-suspenders fix for Trix attachment-wrapper interference
     with the CSS rules at injectStyles() figure.rte-inserted-image
     [data-img-size=...] selectors. Same percentages, written inline
     on the inner figure at insert time, so the size resolves against
     the editor body width regardless of how Trix lays out the outer
     attachment wrapper.

     HC-IMG-001 — size percentages hardcoded as 33/50/75/100% in BOTH
     this map AND the CSS rules below. If per-title or per-publisher
     image sizing ever becomes a requirement, add imgSizeOptions to
     InbxRTE config and thread through this map + CSS generation.
  ── */
  const IMG_SIZE_PCT = { small: '33%', medium: '50%', large: '75%', full: '100%' };
  const IMG_ALIGN_CSS = {
    left:   'margin-left:0;margin-right:auto;',
    center: 'margin-left:auto;margin-right:auto;',
    right:  'margin-left:auto;margin-right:0;'
  };
  function buildFigureInlineStyle(size, align) {
    const pct = IMG_SIZE_PCT[size] || IMG_SIZE_PCT.large;
    const algn = IMG_ALIGN_CSS[align] || IMG_ALIGN_CSS.center;
    return `max-width:${pct};${algn}`;
  }

  function generateId() { return 'rte-' + Math.random().toString(36).substr(2, 9); }

  /* ── TA_CONFIG accessors (S11) ──
     Mirrors Studio's getter pattern. Reads at call time so a page that
     loads RTE before TA_CONFIG (unusual but possible) still works once
     TA_CONFIG resolves. publisherId is read from the DOM, not TA_CONFIG.
  ── */
  function tac() { return (typeof window !== 'undefined' && window.TA_CONFIG) || {}; }

  function getInlineUploadCfg() {
    const C = tac();
    const oi = C.optionIds || {};
    const cr = oi.componentRole || {};
    const ms = oi.mediaStatus || {};
    const mt = oi.mediaType || {};
    const taEl = document.querySelector('#title-admin-id');
    return {
      uploadcarePublicKey: C.uploadcarePublicKey || '',
      makeConditioner: C.makeConditioner || '',
      titleSlug: C.titleSlug || '',
      taItemId: C.taItemId || '',
      publisherId: (taEl && taEl.getAttribute('data-pub')) || '',
      hashes: {
        roleMain:        cr.mainImage || '',
        roleInterior:    cr.interiorImage || '',
        statusAvailable: ms.available || '',
        typeImage:       mt.image || '',
      },
    };
  }

  /* ── File validation (S11) ── */
  const INLINE_ALLOWED_MIME = [
    'image/png', 'image/jpeg', 'image/jpg',
    'image/webp', 'image/gif', 'image/svg+xml',
    'image/heic', 'image/heif',
  ];
  const INLINE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

  function validateInlineFile(file) {
    if (!file) return { ok: false, reason: 'No file selected.' };
    const mime = (file.type || '').toLowerCase();
    if (mime && INLINE_ALLOWED_MIME.indexOf(mime) === -1) {
      return { ok: false, reason: 'Only image files are supported (PNG, JPG, WebP, GIF, SVG, HEIC).' };
    }
    if (file.size > INLINE_MAX_BYTES) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      return { ok: false, reason: 'Image too large (' + mb + ' MB) — max 10 MB.' };
    }
    return { ok: true };
  }

  function humanFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  /* ── Uploadcare browser upload (S11) ──
     Uses Uploadcare's /base/ endpoint — single-shot multipart POST. For
     files under ~10 MB this is fast enough; we cap at 10 MB anyway via
     validateInlineFile, so /base/ is fine. No SDK required.
     Returns Promise<{ uuid, originalUrl }>.
  ── */
  function uploadToUploadcare(file, publicKey) {
    return new Promise(function (resolve, reject) {
      if (!publicKey) {
        reject(new Error('Uploadcare public key missing in TA_CONFIG.'));
        return;
      }
      const fd = new FormData();
      fd.append('UPLOADCARE_PUB_KEY', publicKey);
      fd.append('UPLOADCARE_STORE', '1');
      fd.append('file', file, file.name);

      fetch('https://upload.uploadcare.com/base/', {
        method: 'POST',
        body: fd,
      })
        .then(function (r) {
          if (!r.ok) throw new Error('Uploadcare HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) {
          // Response shape: { file: "<uuid>" }
          if (!data || !data.file) {
            reject(new Error('Uploadcare returned no UUID.'));
            return;
          }
          // Build a URL with the original filename appended so the URL
          // ends in a recognizable extension (Webflow native Image field
          // requires a "Valid URL with Image extension"). Uploadcare
          // serves the file regardless of the trailing path segment.
          const safeName = (file.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
          const originalUrl = 'https://uyluucdnr2.ucarecd.net/' + data.file + '/' + safeName;
          resolve({ uuid: data.file, originalUrl: originalUrl });
        })
        .catch(reject);
    });
  }

  /* ── Scenario B Route 5 POST (S11) ──
     Browser → Make hook → Webflow Create MEDIA + Publish + Webhook
     Response. Returns Promise<{ uploadcareUrl, mediaItemId, ... }>.
     CORS: the webhook responds with Access-Control-Allow-Origin: * so
     the response body is readable by the browser.
  ── */
  function postToConditioner(payload, conditionerUrl) {
    return new Promise(function (resolve, reject) {
      if (!conditionerUrl) {
        reject(new Error('makeConditioner URL missing in TA_CONFIG.'));
        return;
      }
      fetch(conditionerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          // Read body either way — Make returns 200 on success and 500
          // on the Module 64 error handler. Both carry JSON.
          return r.text().then(function (txt) {
            let data = null;
            try { data = JSON.parse(txt); } catch (e) { /* tolerate */ }
            if (!r.ok) {
              const msg = (data && data.error) || ('Conditioner HTTP ' + r.status);
              throw new Error(msg);
            }
            // Defensive: Make sometimes returns the literal "Accepted"
            // before the configured Webhook Response fires. Treat as
            // soft-success but lacking a mediaItemId.
            if (!data) {
              if (txt && txt.toLowerCase().indexOf('accepted') !== -1) {
                throw new Error('Conditioner returned "Accepted" without a media item — Make scenario may not have completed.');
              }
              throw new Error('Conditioner returned non-JSON: ' + txt.substr(0, 100));
            }
            if (data.success !== true) {
              throw new Error((data.error) || 'Conditioner reported failure.');
            }
            if (!data.mediaItemId || !data.uploadcareUrl) {
              throw new Error('Conditioner response missing mediaItemId or uploadcareUrl.');
            }
            resolve(data);
          });
        })
        .catch(reject);
    });
  }


  /* ── Read MEDIA items from the page DOM ──
     Schema (post-S6, confirmed via Webflow Designer audit AND ta-studio-v1.2.6.js:2748):
       data-media-id        ← (Self) MEDIA Item ID  (Webflow Item ID — body-save reconciliation marker)
       data-media-name      ← Name
       data-media-type      ← Media Type            (option NAME, e.g. "Image" or "Text")
       data-component-role  ← Component Role        (option NAME, e.g. "Interior Image")
       data-status          ← Status                (option NAME: "Available" / "Attached" / "Archived")
       data-article-id      ← This Article's Item ID (single-ref ID, may be empty)
       data-image-url       ← Image URL             (full Uploadcare URL, conditioned by Scenario B)

     Structure: each MEDIA record renders as a flat .media-wrapper[data-item] element
     at document level (NOT nested inside a single parent collection-list wrapper).
     This matches Studio's cmpReadItems() pattern.

     Multi-tenant scope is enforced server-side by the Collection List's TITLE-ADMIN filter.
     The 'selector' parameter is retained for backward compatibility but ignored if it does
     not match the post-S6 pattern; the canonical query is .media-wrapper[data-item].
  ── */
  function readMediaItems(selector) {
    // Canonical post-S6 query: every MEDIA record renders as .media-wrapper[data-item]
    var wraps = document.querySelectorAll('.media-wrapper[data-item]');
    if (wraps.length === 0) {
      console.warn('[RTE] No .media-wrapper[data-item] elements found on page');
      return [];
    }
    const media = [];
    Array.prototype.forEach.call(wraps, function (el) {
      const id            = el.getAttribute('data-media-id')        || '';
      const name          = el.getAttribute('data-media-name')      || '';
      const mediaType     = el.getAttribute('data-media-type')      || '';
      const componentRole = el.getAttribute('data-component-role')  || '';
      const status        = el.getAttribute('data-status')          || '';
      const articleId     = el.getAttribute('data-article-id')      || '';
      const imageUrl      = el.getAttribute('data-image-url')       || '';
      if (id) {
        media.push({ id, name, mediaType, componentRole, status, articleId, imageUrl, el });
      }
    });
    return media;
  }

  /* ── Strip Trix wrapper attributes for clean Webflow HTML ── */
  function cleanHTMLForWebflow(html) {
    const div = document.createElement('div');
    div.innerHTML = html;

    // Trix wraps attachments in <figure data-trix-attachment="...">
    // We keep the <figure> but strip Trix-specific attributes.
    // v1.1.11 fix: preserve class="rte-inserted-image" — previously
    // fig.removeAttribute('class') was stripping it, causing data-img-size
    // and data-img-align CSS rules to never match on the article page.
    div.querySelectorAll('figure').forEach(fig => {
      fig.removeAttribute('data-trix-attachment');
      fig.removeAttribute('data-trix-content-type');
      fig.removeAttribute('data-trix-attributes');
      // Only remove trix-specific classes, preserve rte-inserted-image
      const cls = fig.getAttribute('class') || '';
      const cleaned = cls.split(/\s+/)
        .filter(c => c && !c.startsWith('attachment') && !c.startsWith('trix'))
        .join(' ');
      if (cleaned) {
        fig.setAttribute('class', cleaned);
      } else {
        fig.removeAttribute('class');
      }
    });

    // Remove any data-trix-* attributes from all elements
    div.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('data-trix')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    // Remove empty <br> tags that Trix inserts as placeholders
    div.querySelectorAll('br[data-trix-serialize="false"]').forEach(br => br.remove());

    return div.innerHTML;
  }

  /* ── Count words + chars ── */
  function countContent(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || '';
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const images = (html.match(/<img /g) || []).length;
    return { chars, words, images };
  }

  /* ============================================================
     MAIN CLASS
     ============================================================ */
  class InbxRTE {
    constructor(config) {
      this.cfg = Object.assign({}, DEFAULTS, config);
      this.id = generateId();
      this.mount = null;
      this.editorEl = null;
      this.trixEditor = null;
      this.pickerOpen = false;
      this.selectedMediaId = null;
      this.mediaItems = [];
      this.originalHTML = this.cfg.initialHTML;
      this.dirty = false;
      // v1.1.5: image formatting state (persists while picker open)
      this.selectedImgSize = 'large';   // small|medium|large|full  HC-IMG-001
      this.selectedImgAlign = 'center'; // left|center|right

      // v1.1.19: picker search filter state + ESC handler ref.
      // Search empty by default; live-filters both sections on input.
      // ESC handler is bound when picker opens, unbound when closes.
      this.pickerSearch = '';
      this._pickerEscHandler = null;

      // v1.1.22 (TD-178): Assess Content panel state.
      // The panel is a right-side slide-in created on first Assess click.
      // Lives in document.body (z-index 10025) so it floats above ABE +
      // picker + lightbox. ESC handler attached when open.
      this._assessPanel = null;          // DOM ref or null
      this._assessEscHandler = null;
      this._assessStage = 'preflight';   // 'preflight' | 'loading' | 'results' | 'error'
      this._assessResult = null;         // parsed { summary, findings[], editorial_questions[] }
      this._assessError = null;          // string or null
      this._assessTargetDate = '';       // YYYY-MM-DD
      this._assessOriginalDate = '';     // YYYY-MM-DD or ''

      // v1.1.18: click-to-edit popover state
      this._editPopoverEl = null;
      this._editState = null;            // { attachment, outerFig, innerFig|null, mode:'html'|'image', img:{...}, originalSize, originalAlign, stagedSize, stagedAlign }
      this._replacingAttachment = null;  // when set, insertImage() does swap instead of new
      this._editEscHandler = null;
      this._editClickOutsideHandler = null;
      this._editScrollHandler = null;
      this._imageEditClickHandler = null; // document-level capture-phase delegate
    }

    async init() {
      if (this.cfg.fullscreen) {
        // Create fullscreen overlay appended to body
        this._fsOverlay = document.createElement('div');
        this._fsOverlay.id = this.id + '-fs-overlay';
        this._fsOverlay.className = 'rte-fs-overlay';
        this._fsOverlay.innerHTML = `<div class="rte-fs-panel"><div class="rte-fs-mount" id="${this.id}-fs-mount"></div></div>`;
        document.body.appendChild(this._fsOverlay);
        this.mount = this._fsOverlay.querySelector(`#${this.id}-fs-mount`);

        // Close on overlay click (outside panel)
        this._fsOverlay.addEventListener('click', (e) => {
          if (e.target === this._fsOverlay) this.closeFullscreen();
        });

        // Escape key
        this._escHandler = (e) => { if (e.key === 'Escape') this.closeFullscreen(); };
        document.addEventListener('keydown', this._escHandler);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
      } else {
        this.mount = document.querySelector(this.cfg.mountSelector);
        if (!this.mount) {
          console.error('[RTE] Mount element not found:', this.cfg.mountSelector);
          return;
        }
      }

      // Load Trix
      await loadCSS(TRIX_CSS);
      await loadScript(TRIX_JS);

      // Read MEDIA items from DOM
      this.mediaItems = readMediaItems(this.cfg.mediaWrapperSelector);

      // Build UI
      this.render();

      console.log(`[RTE] ta-rte v${VERSION} initialized${this.cfg.fullscreen ? ' (fullscreen)' : ''} | ${this.mediaItems.length} MEDIA items loaded`);
    }

    render() {
      const inputId = this.id + '-input';

      this.mount.innerHTML = `
        <div class="rte-root" id="${this.id}">
          <div class="rte-header">
            <div class="rte-header-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="${GOLD}" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/>
              </svg>
            </div>
            <div class="rte-header-text">
              <div class="rte-header-title">Article body editor</div>
              <div class="rte-header-sub">${this.cfg.mode === 'review' ? 'Review transcription \u2014 edit before saving' : 'Edit body \u2014 insert images at cursor'}</div>
            </div>
            ${this.cfg.articleTitle ? (
              this.cfg.articleViewUrl
                ? `<a class="rte-article-badge rte-article-badge-link" href="${esc(this.cfg.articleViewUrl)}" target="_blank" rel="noopener" title="Open live article in new tab">
                     <span>${esc(this.cfg.articleTitle)}</span>
                     <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px;vertical-align:-1px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                   </a>`
                : `<span class="rte-article-badge">${esc(this.cfg.articleTitle)}</span>`
            ) : ''}
            ${this.cfg.fullscreen ? `<button type="button" class="rte-assess-btn" id="${this.id}-assess-btn" title="Run Claude staleness review on this article body">
              <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="margin-right:5px;">
                <circle cx="8" cy="8" r="6.5"></circle>
                <line x1="8" y1="5" x2="8" y2="11"></line>
                <line x1="5" y1="8" x2="11" y2="8"></line>
              </svg>
              <span>Assess Content</span>
            </button>` : ''}
            <span class="rte-version">v${VERSION}</span>
            ${this.cfg.fullscreen ? `<button class="rte-close-btn ix-btn ix-btn--ghost ix-btn--icon" id="${this.id}-close-fs" title="Close editor">\u2715</button>` : ''}
          </div>

          <input type="hidden" id="${inputId}" value="">
          <trix-editor input="${inputId}" class="rte-trix-editor"></trix-editor>

          <div class="rte-status-bar" id="${this.id}-status">
            <span class="rte-char-count" id="${this.id}-counts">0 chars \u00B7 0 words</span>
            <span class="rte-char-count">Webflow RTE compatible</span>
          </div>

          ${this.cfg.disableImages ? '' : `<div class="rte-picker-panel" id="${this.id}-picker" style="display:none;"></div>`}

          ${this.cfg.hideFooter ? '' : `<div class="rte-save-row">
            <button class="rte-btn rte-btn-cancel ix-btn ix-btn--ghost" id="${this.id}-cancel">Close</button>
            <div class="rte-save-right">
              <span class="rte-dirty-indicator" id="${this.id}-dirty" style="display:none;">unsaved changes</span>
              <button class="rte-btn rte-btn-save ix-btn ix-btn--primary" id="${this.id}-save">Save to CMS</button>
            </div>
          </div>`}
        </div>
      `;

      this.injectStyles();

      // v1.1.6: Register custom block attributes BEFORE trix-initialize fires.
      // Previously registered inside setupToolbar() (inside trix-initialize handler)
      // which was too late — Trix had already parsed its config by then, so clicking
      // the H2 button did nothing. Must register here, synchronously, before the
      // trix-editor element initializes.
      if (window.Trix && window.Trix.config) {
        window.Trix.config.blockAttributes.heading2 = {
          tagName: 'h2',
          terminal: true,
          breakOnReturn: true,
          group: false
        };
        window.Trix.config.blockAttributes.heading3 = {
          tagName: 'h3',
          terminal: true,
          breakOnReturn: true,
          group: false
        };
      }

      this.waitForTrixInit();
    }

    waitForTrixInit() {
      const el = this.mount.querySelector('trix-editor');
      if (!el) return;

      el.addEventListener('trix-initialize', () => {
        this.editorEl = el;
        this.trixEditor = el.editor;

        // Customize toolbar
        this.customizeToolbar();

        // Set initial content
        if (this.cfg.initialHTML) {
          this.trixEditor.loadHTML(this.cfg.initialHTML);
        }

        // Track changes
        el.addEventListener('trix-change', () => {
          this.dirty = true;
          this.updateCounts();
          this.updateDirtyState();
        });

        // Bind save/cancel/close. v1.1.3: cancel and save buttons are
        // suppressed when cfg.hideFooter is true (Transcriber owns its own
        // Save button), so the queries return null. Guard accordingly.
        const cancelBtn = this.mount.querySelector(`#${this.id}-cancel`);
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.handleCancel());
        const saveBtn = this.mount.querySelector(`#${this.id}-save`);
        if (saveBtn) saveBtn.addEventListener('click', () => this.handleSave());
        const closeBtn = this.mount.querySelector(`#${this.id}-close-fs`);
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeFullscreen());

        // v1.1.22 (TD-178): Assess Content button — fullscreen mode only
        const assessBtn = this.mount.querySelector(`#${this.id}-assess-btn`);
        if (assessBtn) assessBtn.addEventListener('click', () => this.openAssessPanel());

        // v1.1.18: click-to-edit popover for inserted images
        if (!this.cfg.disableImages) {
          this.bindImageEditClickHandler();
        }

        this.updateCounts();
      });
    }

    /* ── Toolbar customization ── */
    customizeToolbar() {
      const toolbar = this.mount.querySelector('trix-toolbar');
      if (!toolbar) return;

      // Remove strike button (not in Webflow RTE subset)
      const strike = toolbar.querySelector('.trix-button--icon-strike');
      if (strike) strike.remove();

      // Remove file tools group (we have our own image insertion)
      const fileTools = toolbar.querySelector('.trix-button-group--file-tools');
      if (fileTools) fileTools.remove();

      // Add H2 button
      const blockGroup = toolbar.querySelector('.trix-button-group--block-tools');
      if (blockGroup) {
        // Add H2 — registered in render() before trix-initialize (v1.1.6 fix)
        const h2Btn = document.createElement('button');
        h2Btn.type = 'button';
        h2Btn.className = 'trix-button rte-custom-btn';
        h2Btn.setAttribute('data-trix-attribute', 'heading2');
        h2Btn.title = 'Heading 2';
        h2Btn.textContent = 'H2';
        h2Btn.tabIndex = -1;

        const h3Btn = document.createElement('button');
        h3Btn.type = 'button';
        h3Btn.className = 'trix-button rte-custom-btn';
        h3Btn.setAttribute('data-trix-attribute', 'heading3');
        h3Btn.title = 'Heading 3';
        h3Btn.textContent = 'H3';
        h3Btn.tabIndex = -1;

        // Insert before the first button in block tools
        const firstBlock = blockGroup.firstChild;
        blockGroup.insertBefore(h3Btn, firstBlock);
        blockGroup.insertBefore(h2Btn, h3Btn);
      }

      // v1.1.3: image affordances are suppressed when disableImages is true.
      // Used by Transcriber (text-only intake). Picker btn, upload btn, file
      // input, and image-paste handler are all skipped. The trix-file-accept
      // block below still runs so accidental drops are still rejected.
      if (!this.cfg.disableImages) {
        // Add "Insert Image" button to text tools group
        const textGroup = toolbar.querySelector('.trix-button-group--text-tools');
        if (textGroup) {
          const sep = document.createElement('span');
          sep.className = 'rte-toolbar-sep';

          const imgBtn = document.createElement('button');
          imgBtn.type = 'button';
          imgBtn.className = 'trix-button rte-img-insert-btn';
          imgBtn.title = 'Insert image from MEDIA library';
          imgBtn.innerHTML = `
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M6.75 7.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
            </svg>
            <span>Image</span>
          `;
          imgBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.togglePicker();
          });

          textGroup.appendChild(sep);
          textGroup.appendChild(imgBtn);

          // S11: Upload Inline Image — text button per Jeff's preference
          const sep2 = document.createElement('span');
          sep2.className = 'rte-toolbar-sep';

          const uploadBtn = document.createElement('button');
          uploadBtn.type = 'button';
          uploadBtn.className = 'trix-button rte-img-upload-btn';
          uploadBtn.title = 'Upload a new image directly into this article';
          uploadBtn.id = `${this.id}-upload-btn`;
          uploadBtn.innerHTML = `<span>Upload Inline Image</span>`;
          uploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openUploadFilePicker();
          });

          textGroup.appendChild(sep2);
          textGroup.appendChild(uploadBtn);

          // Hidden <input type=file> the upload button delegates to
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = INLINE_ALLOWED_MIME.join(',');
          fileInput.style.display = 'none';
          fileInput.id = `${this.id}-upload-file-input`;
          fileInput.addEventListener('change', (e) => {
            const f = e.target.files && e.target.files[0];
            if (f) this.handleUploadFileSelected(f);
            // Reset so selecting the same file twice still triggers change
            e.target.value = '';
          });
          this.mount.appendChild(fileInput);
        }
      }

      // Disable default file attachment (drag+drop images).
      // S11 NOTE: drag-and-drop intentionally NOT supported for inline upload
      // (TD-157). We block Trix's default to keep behavior consistent.
      // v1.1.3: this guard remains active even when disableImages is true —
      // text-only mode should still reject file drops, not silently accept
      // them as Trix attachments.
      this.editorEl.addEventListener('trix-file-accept', (e) => {
        e.preventDefault(); // Block direct file drops — use Upload button instead
      });

      // v1.1.3: image-paste handler is also suppressed in disableImages mode.
      // Without it, pasted images fall through to Trix's default which the
      // trix-file-accept handler above will reject — net effect: paste of an
      // image into a text-only RTE does nothing (correct).
      if (!this.cfg.disableImages) {
        // S11: Paste-from-clipboard support. Trix fires 'trix-paste' AND a
        // standard 'paste' event. We intercept the standard one because it
        // gives us access to event.clipboardData.files; Trix's wrapper hides
        // them. If image files are present, route the FIRST one to the
        // upload modal; if multiple are present, toast a hint.
        this.editorEl.addEventListener('paste', (e) => {
          if (!e.clipboardData) return;
          const files = e.clipboardData.files;
          if (!files || files.length === 0) return;
          const imageFiles = [];
          for (let i = 0; i < files.length; i++) {
            if ((files[i].type || '').toLowerCase().indexOf('image/') === 0) {
              imageFiles.push(files[i]);
            }
          }
          if (imageFiles.length === 0) return;
          e.preventDefault();
          if (imageFiles.length > 1) {
            this.showRteToast('Only the first image was uploaded — paste images one at a time.', 'info');
          }
          this.handleUploadFileSelected(imageFiles[0]);
        });
      }
    }

    /* ── Image picker panel ── */
    togglePicker() {
      this.pickerOpen = !this.pickerOpen;
      const panel = this.mount.querySelector(`#${this.id}-picker`);
      if (this.pickerOpen) {
        this.renderPicker();
        // v1.1.24: inline display must match the mode's CSS layout.
        // In fullscreen mode the CSS rule `.rte-fs-mount .rte-picker-panel`
        // sets display:flex (so the body inside can scroll via flex:1
        // + overflow-y:auto). Inline-style `display:block` would beat
        // that rule and break scrolling. Use 'flex' for fullscreen
        // and 'block' for inline mode (which has no flex CSS rule).
        panel.style.display = this.cfg.fullscreen ? 'flex' : 'block';
        // v1.1.19: ESC closes the picker (fullscreen mode only — in
        // inline mode there's no overlay so ESC has no semantic).
        // We use capture-phase + stopPropagation so the outer ABE
        // ESC handler (which would close the whole editor) doesn't
        // also fire.
        if (this.cfg.fullscreen && !this._pickerEscHandler) {
          this._pickerEscHandler = (e) => {
            if (e.key === 'Escape' && this.pickerOpen) {
              e.stopPropagation();
              e.preventDefault();
              this.togglePicker();
            }
          };
          document.addEventListener('keydown', this._pickerEscHandler, true);
        }
      } else {
        panel.style.display = 'none';
        // v1.1.19: clear search filter on close so next open starts fresh.
        this.pickerSearch = '';
        // v1.1.19: detach picker ESC handler.
        if (this._pickerEscHandler) {
          document.removeEventListener('keydown', this._pickerEscHandler, true);
          this._pickerEscHandler = null;
        }
        // v1.1.18: if picker was in replace mode and closed without selection,
        // clear the flag so next insert is a normal insert.
        if (this._replacingAttachment) {
          console.log('[RTE] Replace cancelled — picker closed without selection');
          this._replacingAttachment = null;
        }
      }
    }

    renderPicker() {
      const panel = this.mount.querySelector(`#${this.id}-picker`);

      // Filter to image-type MEDIA items with a usable URL.
      // Status binding is option NAME (HC-006 precedent); compare string literals.
      const images = this.mediaItems.filter(m =>
        m.mediaType === 'Image' && m.imageUrl
      );

      // Split: already linked to this Article vs Available pool.
      // Per the locked picker rule:
      //   show MEDIA where mediaType === 'Image' AND imageUrl present AND
      //     (articleId === currentArticleItemId OR status === 'Available')
      // Multi-tenant scope is server-side via the Collection List filter.
      const currentArticleId = this.cfg.articleItemId || '';
      let linked = images
        .filter(m => currentArticleId && m.articleId === currentArticleId)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      let available = images
        .filter(m => m.status === 'Available' && m.articleId !== currentArticleId)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      // v1.1.19: apply search filter (case-insensitive substring on m.name).
      // Only active in fullscreen mode (inline mode has no search input).
      // Filter is applied AFTER the linked/available split so both sections
      // reflect the search results independently.
      const searchTerm = (this.pickerSearch || '').trim().toLowerCase();
      const totalBeforeFilter = linked.length + available.length;
      if (searchTerm) {
        linked = linked.filter(m => (m.name || '').toLowerCase().indexOf(searchTerm) !== -1);
        available = available.filter(m => (m.name || '').toLowerCase().indexOf(searchTerm) !== -1);
      }

      // Uploadcare base for thumbnail display only (NOT applied to inserted <img> URL).
      // We append a 200x transform here purely so the picker grid is fast — the inserted
      // image uses the bare data-image-url. If the bare URL already carries transforms
      // applied by Scenario B, the thumb transform is ignored by Uploadcare.
      const ucBase = (this.cfg.uploadcareBase || (window.TA_CONFIG && window.TA_CONFIG.uploadcareBase) || '').replace(/\/+$/, '');
      const buildThumb = (url) => {
        if (!url) return '';
        // If URL is already a CDN URL with operations, use it as-is for the thumb.
        // If it's a bare UUID-ended URL, append a 200x transform for grid display.
        if (/-\/resize\//.test(url) || /\/-\//.test(url)) return url;
        return url.replace(/\/+$/, '') + '/-/resize/200x/-/format/auto/-/quality/smart/';
      };

      const statusClass = (s) => {
        const k = (s || '').toLowerCase();
        if (k === 'available') return 'available';
        if (k === 'attached')  return 'attached';
        if (k === 'archived')  return 'archived';
        return 'unknown';
      };

      const renderItem = (m) => {
        const isSelected = m.id === this.selectedMediaId;
        const thumbUrl = buildThumb(m.imageUrl);
        // v1.1.21: when imageUrl exists, add .ix-expand-icon-host class
        // to the thumb container (gives it position:relative) and embed
        // an .ix-expand-icon button. Click stopPropagation prevents the
        // outer .rte-picker-item select handler from also firing.
        // SVG icon: simple magnifying glass, inherits currentColor.
        const expandBtn = m.imageUrl ? `
              <button type="button" class="ix-expand-icon" data-rte-expand-mediaid="${esc(m.id)}" aria-label="Preview at full size">
                <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                  <circle cx="7" cy="7" r="4.5"></circle>
                  <line x1="10.5" y1="10.5" x2="14" y2="14"></line>
                </svg>
              </button>` : '';
        const thumbHostClass = m.imageUrl ? 'rte-picker-thumb ix-expand-icon-host' : 'rte-picker-thumb';
        return `
          <div class="rte-picker-item ${isSelected ? 'selected' : ''}" data-media-id="${esc(m.id)}">
            <div class="${thumbHostClass}" ${thumbUrl ? `style="background-image:url('${esc(thumbUrl)}');background-size:cover;background-position:center;"` : ''}>
              ${thumbUrl ? '' : esc(m.name)}
              ${expandBtn}
            </div>
            <div class="rte-picker-info">
              <div class="rte-picker-name" title="${esc(m.name)}">${esc(m.name)}</div>
              <div class="rte-picker-meta">
                <span class="rte-picker-role">${esc(m.componentRole || '')}</span>
                <span class="rte-picker-status rte-picker-status-${statusClass(m.status)}">${esc(m.status || '')}</span>
              </div>
            </div>
          </div>
        `;
      };

      const totalShown = linked.length + available.length;
      const linkedSection = linked.length ? `
        <div class="rte-picker-section-label">Already in this article (${linked.length})</div>
        <div class="rte-picker-grid">${linked.map(renderItem).join('')}</div>
      ` : '';
      const availableSection = available.length ? `
        <div class="rte-picker-section-label">Available to insert (${available.length})</div>
        <div class="rte-picker-grid">${available.map(renderItem).join('')}</div>
      ` : '';

      // v1.1.19: branch on fullscreen mode. Inline mode renders the
      // legacy bordered-box layout (unchanged from v1.1.18). Fullscreen
      // renders the new Option B modal: header w/search + scrollable
      // body + sticky bottom action bar.
      const isFullscreen = !!this.cfg.fullscreen;

      // Shared empty-state body (used in both modes when no images at all)
      const emptyStateForSearch = searchTerm && totalBeforeFilter > 0;
      const emptyBody = emptyStateForSearch
        ? `<div class="rte-picker-empty">No images match "${esc(searchTerm)}". Clear the search to see all images.</div>`
        : `<div class="rte-picker-empty">No MEDIA images available for this article. Upload images via the Uploads Processor or drop them in the Publisher Upload Folder first.</div>`;

      // Shared actions-row markup (caption + size + align + primary button).
      // In inline mode it's the only actions row; in fullscreen mode it's
      // the bottom bar. The button label/style differs.
      const buildActionsRow = (opts) => {
        const o = opts || {};
        const sizeStrip = `
          <span class="rte-picker-size-label">Size:</span>
          <div class="rte-img-size-strip">
            ${[['small','33%'],['medium','50%'],['large','75%'],['full','100%']].map(([v,l]) =>
              `<button type="button" class="rte-img-size-btn${this.selectedImgSize===v?' active':''}" data-size="${v}">${l}</button>`
            ).join('')}
          </div>`;
        const alignStrip = `
          <span class="rte-picker-size-label" id="${this.id}-align-label" style="${this.selectedImgSize==='full'?'opacity:0.35;pointer-events:none;':''}">Align:</span>
          <div class="rte-img-align-strip" id="${this.id}-align-strip" style="${this.selectedImgSize==='full'?'opacity:0.35;pointer-events:none;':''}">
            ${[['left','\u25C0'],['center','\u25A0'],['right','\u25B6']].map(([v,icon]) =>
              `<button type="button" class="rte-img-align-btn${this.selectedImgAlign===v?' active':''}" data-align="${v}" title="${v}">${icon}</button>`
            ).join('')}
          </div>`;
        const captionInput = `
          <label class="rte-picker-caption-wrap">
            <span class="rte-picker-size-label">Caption:</span>
            <input type="text" class="rte-picker-caption-input" id="${this.id}-caption" placeholder="Image caption (optional)">
          </label>`;
        if (o.fullscreen) {
          // Bottom bar (Option B): Cancel | Caption | Size | Align | Save
          return `
            <div class="rte-picker-bottom-bar">
              <button class="rte-picker-cancel-btn" id="${this.id}-picker-cancel" type="button">Cancel</button>
              ${captionInput}
              <div class="rte-picker-format-row">
                ${sizeStrip}
                ${alignStrip}
              </div>
              <button class="rte-picker-save-btn" id="${this.id}-insert-btn" type="button" ${this.selectedMediaId ? '' : 'disabled'}>Save</button>
            </div>`;
        }
        // Inline mode: original single-row actions
        return `
          <div class="rte-picker-actions">
            ${captionInput}
            <div class="rte-picker-format-row">
              ${sizeStrip}
              ${alignStrip}
            </div>
            <div class="rte-picker-spacer"></div>
            <button class="rte-picker-insert-btn ix-btn ix-btn--primary" id="${this.id}-insert-btn" ${this.selectedMediaId ? '' : 'disabled'}>Insert at cursor</button>
          </div>`;
      };

      if (isFullscreen) {
        // ── Fullscreen modal: header + scrollable body + sticky bottom bar ──
        // The search input keeps its value via the React-style controlled
        // approach: it reads this.pickerSearch on render, and the input
        // event updates this.pickerSearch + re-renders. Focus is preserved
        // by reading document.activeElement BEFORE innerHTML replacement
        // (more reliable than focus/blur events because blur fires
        // asynchronously when elements are removed mid-replacement, racing
        // the re-render).
        const wasSearchFocused = document.activeElement &&
          document.activeElement.id === `${this.id}-picker-search`;
        const priorCaret = wasSearchFocused
          ? document.activeElement.selectionStart
          : null;

        const searchVal = esc(this.pickerSearch || '');
        const countText = searchTerm
          ? `${totalShown} of ${totalBeforeFilter}`
          : `${totalShown} image${totalShown !== 1 ? 's' : ''}`;
        panel.innerHTML = `
          <div class="rte-picker-header">
            <span class="rte-picker-title">Insert image from MEDIA library</span>
            <div class="rte-picker-search-wrap">
              <input type="text" class="rte-picker-search" id="${this.id}-picker-search" placeholder="Filter by name\u2026" value="${searchVal}">
            </div>
            <span class="rte-picker-count">${countText}</span>
            <button class="rte-picker-close-x" id="${this.id}-picker-close" type="button" aria-label="Close">\u00D7</button>
          </div>
          <div class="rte-picker-body">
            ${totalShown === 0 ? emptyBody : `${linkedSection}${availableSection}`}
          </div>
          ${buildActionsRow({ fullscreen: true })}
        `;
        // Restore search input focus + caret if it was the focused element
        // before this re-render (e.g. user was typing in the search box).
        const searchInput = panel.querySelector(`#${this.id}-picker-search`);
        if (searchInput) {
          if (wasSearchFocused) {
            searchInput.focus();
            const pos = priorCaret != null ? priorCaret : searchInput.value.length;
            try { searchInput.setSelectionRange(pos, pos); } catch (e) {}
          }
          searchInput.addEventListener('input', (e) => {
            this.pickerSearch = e.target.value || '';
            this.renderPicker();
          });
        }
        // Wire Cancel button (same as close X — closes picker without insert)
        const cancelBtn = panel.querySelector(`#${this.id}-picker-cancel`);
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.togglePicker());
      } else {
        // ── Inline mode (unchanged from v1.1.18) ──
        panel.innerHTML = `
          <div class="rte-picker-header">
            <span class="rte-picker-title">Insert image from MEDIA library</span>
            <span class="rte-picker-count">${totalShown} image${totalShown !== 1 ? 's' : ''}</span>
            <button class="rte-picker-close ix-btn ix-btn--ghost" id="${this.id}-picker-close">close</button>
          </div>
          ${totalShown === 0 ? emptyBody : `
            ${linkedSection}
            ${availableSection}
            ${buildActionsRow({ fullscreen: false })}
          `}
        `;
      }

      // Bind events (shared across both modes)
      panel.querySelector(`#${this.id}-picker-close`).addEventListener('click', () => this.togglePicker());

      panel.querySelectorAll('.rte-picker-item').forEach(item => {
        item.addEventListener('click', () => {
          this.selectedMediaId = item.getAttribute('data-media-id');
          this.renderPicker(); // Re-render to show selection
        });
      });

      // v1.1.21: expand-icon click handlers — opens shared lightbox.
      // stopPropagation prevents the .rte-picker-item parent click from
      // also firing (which would toggle selection in addition to opening
      // the lightbox). Defensive check on window.InbxLightbox so a
      // missing ix-lightbox script doesn't throw — picker still works
      // as before, just no preview.
      panel.querySelectorAll('.ix-expand-icon').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const mediaId = btn.getAttribute('data-rte-expand-mediaid');
          const m = this.mediaItems.find(x => x.id === mediaId);
          if (!m || !m.imageUrl) return;
          if (typeof window.InbxLightbox === 'undefined' || typeof window.InbxLightbox.open !== 'function') {
            console.warn('[RTE v1.1.21] window.InbxLightbox not loaded. Add ix-lightbox-v1.0.0.js (or later) to the page <head> before ta-rte.');
            return;
          }
          window.InbxLightbox.open(m.imageUrl, { caption: m.name });
        });
      });

      // v1.1.5: size strip
      panel.querySelectorAll('.rte-img-size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.selectedImgSize = btn.getAttribute('data-size');
          this.renderPicker();
        });
      });

      // v1.1.5: align strip
      panel.querySelectorAll('.rte-img-align-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.selectedImgAlign = btn.getAttribute('data-align');
          this.renderPicker();
        });
      });

      const insertBtn = panel.querySelector(`#${this.id}-insert-btn`);
      if (insertBtn) {
        insertBtn.addEventListener('click', () => this.insertImage());
      }
    }

    /* ── Insert image at cursor ──
       Inserts a <figure><img data-media-id=... data-component-role=...></figure>
       at the current cursor position. The src is the bare data-image-url straight
       from the MEDIA row — NO JS-side transforms applied (per S9 decision #3:
       transforms are component-role-specific and applied downstream by Scenario B
       or component-role-specific render paths).

       The data-media-id attribute on the <img> is the Webflow MEDIA Item ID. This
       is the body-save reconciliation marker: at body save (Part A.3 / Part B), the
       saved HTML is scanned for these markers, diffed against MEDIA's current Article
       links, and Route 4 attaches fire for newly-referenced MEDIA rows.
    ── */
    insertImage() {
      if (!this.selectedMediaId || !this.trixEditor) return;

      const media = this.mediaItems.find(m => m.id === this.selectedMediaId);
      if (!media || !media.imageUrl) {
        console.error('[RTE] Selected MEDIA row has no imageUrl');
        return;
      }

      // v1.1.18: Replace-mode branch — when _replacingAttachment is set, this
      // call swaps content on the existing attachment instead of inserting new.
      // Handles both text/html attachments (setAttribute) and image attachments
      // (v1.1.2 remove-then-insert pattern, which upgrades to our format).
      if (this._replacingAttachment) {
        this._performReplace(media);
        return;
      }

      const captionEl = this.mount.querySelector(`#${this.id}-caption`);
      const caption = captionEl ? captionEl.value : '';

      // Bare URL — no JS-side transforms. Component-role-specific transforms are
      // applied downstream (e.g. Scenario B during conditioning, render paths, etc).
      // v1.1.5: data-img-size + data-img-align written for CSS sizing hooks (HC-IMG-001)
      // v1.1.15: inline style ALSO written — defeats Trix attachment-wrapper interference
      //          (see header changelog Part B). data-* attrs preserved for save-side CSS.
      const _size  = this.selectedImgSize  || 'large';
      const _align = this.selectedImgAlign || 'center';
      const _style = buildFigureInlineStyle(_size, _align);
      const figureHTML = `<figure class="rte-inserted-image" data-img-size="${esc(_size)}" data-img-align="${esc(_align)}" style="${esc(_style)}">`
        + `<img src="${esc(media.imageUrl)}" alt="${esc(caption || media.name)}" data-media-id="${esc(media.id)}" data-component-role="${esc(media.componentRole || '')}">`
        + (caption ? `<figcaption>${esc(caption)}</figcaption>` : '')
        + `</figure>`;

      // Insert as Trix content attachment (preserves HTML as-is)
      const attachment = new window.Trix.Attachment({ content: figureHTML });
      this.trixEditor.insertAttachment(attachment);

      // Mark dirty
      this.dirty = true;
      this.updateCounts();
      this.updateDirtyState();

      // Close picker
      this.selectedMediaId = null;
      this.togglePicker();

      console.log(`[RTE] Inserted image: ${media.name} | MEDIA ID: ${media.id} | Status: ${media.status} | Role: ${media.componentRole}`);
    }

    /* ── v1.1.18: Replace path for insertImage() ──
       Reads the existing attachment's state to preserve size/align/caption,
       then swaps in new image src + data-media-id. Two paths:
         - text/html attachment → setAttribute('content', newHTML) in place
         - image attachment (legacy) → v1.1.2 remove-and-insert pattern,
           upgrading the attachment to our normalized text/html format
    ── */
    _performReplace(media) {
      const attachment = this._replacingAttachment;
      if (!attachment) return;

      // Read existing state — preserves size/align/caption
      const contentType = attachment.getContentType ? attachment.getContentType() : null;
      let _size = 'large';
      let _align = 'center';
      let caption = '';

      const oldHTML = attachment.getAttribute('content') || '';
      if (oldHTML) {
        // text/html attachment — parse the content HTML for our wrapper
        const parser = new DOMParser();
        const doc = parser.parseFromString(oldHTML, 'text/html');
        const oldInner = doc.querySelector('figure.rte-inserted-image');
        if (oldInner) {
          _size  = oldInner.getAttribute('data-img-size')  || 'large';
          _align = oldInner.getAttribute('data-img-align') || 'center';
          const oldCaptionEl = oldInner.querySelector('figcaption');
          caption = oldCaptionEl ? (oldCaptionEl.textContent || '') : '';
        }
      }
      // For image-type attachments without 'content', defaults are used.

      const _style = buildFigureInlineStyle(_size, _align);
      const newHTML =
        `<figure class="rte-inserted-image" data-img-size="${esc(_size)}" data-img-align="${esc(_align)}" style="${esc(_style)}">`
        + `<img src="${esc(media.imageUrl)}" alt="${esc(caption || media.name)}" data-media-id="${esc(media.id)}" data-component-role="${esc(media.componentRole || '')}">`
        + (caption ? `<figcaption>${esc(caption)}</figcaption>` : '')
        + `</figure>`;

      const isHtmlAttachment = (contentType === 'text/html');
      if (isHtmlAttachment) {
        // In-place update — Trix re-renders
        attachment.setAttribute('content', newHTML);
        console.log(`[RTE] Replace (in-place html): MEDIA ID ${media.id} | preserved size=${_size} align=${_align}`);
      } else {
        // Legacy image attachment — remove and insert new text/html attachment.
        // v1.1.2 pattern: getRangeOfAttachment → setSelectedRange →
        // deleteInDirection → insertAttachment(new).
        const doc2 = this.trixEditor.getDocument();
        const range = doc2.getRangeOfAttachment(attachment);
        if (range) {
          this.trixEditor.setSelectedRange(range);
          this.trixEditor.deleteInDirection('forward');
          const newAtt = new window.Trix.Attachment({ content: newHTML });
          this.trixEditor.insertAttachment(newAtt);
          console.log(`[RTE] Replace (upgrade image→html): MEDIA ID ${media.id} | preserved size=${_size} align=${_align}`);
        }
      }

      // Reset state
      this._replacingAttachment = null;
      this.selectedMediaId = null;
      this.dirty = true;
      this.updateCounts();
      this.updateDirtyState();

      // Close picker
      this.togglePicker();
    }

    /* ── v1.1.18: Click-to-Edit Popover for inline images ───────────────
       Document-level capture-phase delegation so Trix's bubble-phase
       interception of attachment clicks can't kill the event.

       Matches any Trix image attachment via figure[data-trix-attachment].
       Branches state extraction and Apply by attachment content type.
    ── */
    bindImageEditClickHandler() {
      if (!this.editorEl) return;

      this._imageEditClickHandler = (event) => {
        if (!this.editorEl || !this.editorEl.contains(event.target)) return;
        // Toolbar / native action elements — let Trix handle
        if (event.target.closest('trix-toolbar, .trix-button, [data-trix-action], .attachment__toolbar')) return;
        // Caption editing area — let Trix handle so user can type
        if (event.target.closest('.attachment__caption--editing')) return;

        const outerFig = event.target.closest('figure[data-trix-attachment]');
        if (!outerFig) return;

        // Don't reopen if popover already open for this attachment
        if (this._editState && this._editState.outerFig === outerFig) return;
        if (this._editPopoverEl) this.closeEditPopover(/*revert=*/false);

        const attachment = this._findAttachmentForFigure(outerFig);
        if (!attachment) {
          console.warn('[RTE] click-to-edit: no Trix.Attachment matched for wrapper', outerFig);
          return;
        }

        const state = this._readAttachmentState(outerFig, attachment);
        console.log(`[RTE] click-to-edit fired on ${state.outerFig.tagName} (mode: ${state.mode}) | size=${state.originalSize} align=${state.originalAlign}`);

        this.openEditPopover(state);
      };

      document.addEventListener('click', this._imageEditClickHandler, true);
    }

    _findAttachmentForFigure(outerFig) {
      const trixId = outerFig.getAttribute('data-trix-id');
      if (!trixId) return null;
      if (!this.trixEditor) return null;
      const doc = this.trixEditor.getDocument();
      const attachments = (doc && typeof doc.getAttachments === 'function') ? doc.getAttachments() : [];
      return attachments.find(att => String(att.id) === String(trixId)) || null;
    }

    _readAttachmentState(outerFig, attachment) {
      // Two formats:
      //   NEW INSERT: text/html attachment with inner figure.rte-inserted-image
      //   LEGACY:     native image attachment, bare <img> inside outer wrapper
      const innerFig = outerFig.querySelector(':scope > figure.rte-inserted-image');
      const mode = innerFig ? 'html' : 'image';

      let img = { src: '', alt: '', mediaId: '', componentRole: '', caption: '' };
      let originalSize  = 'large';
      let originalAlign = 'center';

      if (mode === 'html' && innerFig) {
        originalSize  = innerFig.getAttribute('data-img-size')  || 'large';
        originalAlign = innerFig.getAttribute('data-img-align') || 'center';
        const innerImg = innerFig.querySelector('img');
        const innerCap = innerFig.querySelector('figcaption');
        if (innerImg) {
          img.src           = innerImg.getAttribute('src') || '';
          img.alt           = innerImg.getAttribute('alt') || '';
          img.mediaId       = innerImg.getAttribute('data-media-id') || '';
          img.componentRole = innerImg.getAttribute('data-component-role') || '';
        }
        img.caption = innerCap ? (innerCap.textContent || '') : '';
      } else {
        // Legacy: read img info from outer's direct <img>, defaults for size/align
        const outerImg = outerFig.querySelector(':scope > img');
        if (outerImg) {
          img.src = outerImg.getAttribute('src') || '';
          img.alt = outerImg.getAttribute('alt') || '';
        }
        // Legacy images have no data-media-id; mediaId stays ''
        // Caption omitted for legacy (Trix's caption UI is separate)
      }

      return {
        attachment,
        outerFig,
        innerFig,           // null for legacy
        mode,               // 'html' | 'image'
        img,
        originalSize,
        originalAlign,
        stagedSize:  originalSize,
        stagedAlign: originalAlign
      };
    }

    openEditPopover(state) {
      this._editState = state;

      const pop = document.createElement('div');
      pop.className = 'rte-img-edit-popover';
      pop.id = this.id + '-img-edit';
      document.body.appendChild(pop);
      this._editPopoverEl = pop;

      this.renderEditPopover();
      this._positionEditPopover();

      // Reposition on scroll/resize
      this._editScrollHandler = () => this._positionEditPopover();
      window.addEventListener('scroll', this._editScrollHandler, true);
      window.addEventListener('resize', this._editScrollHandler);

      // Escape → cancel
      this._editEscHandler = (e) => { if (e.key === 'Escape') this.closeEditPopover(/*revert=*/true); };
      document.addEventListener('keydown', this._editEscHandler);

      // Outside click → cancel
      this._editClickOutsideHandler = (e) => {
        if (!this._editPopoverEl) return;
        if (this._editPopoverEl.contains(e.target)) return;
        if (this._editState && this._editState.outerFig.contains(e.target)) return;
        this.closeEditPopover(/*revert=*/true);
      };
      setTimeout(() => {
        document.addEventListener('click', this._editClickOutsideHandler, true);
      }, 0);
    }

    renderEditPopover() {
      const pop = this._editPopoverEl;
      const st = this._editState;
      if (!pop || !st) return;

      const sizeDirty  = st.stagedSize  !== st.originalSize;
      const alignDirty = st.stagedAlign !== st.originalAlign;
      const anyDirty   = sizeDirty || alignDirty;
      const alignDisabled = st.stagedSize === 'full';
      const legacyNote = st.mode === 'image'
        ? `<div class="rte-img-edit-note">Legacy image — Apply will upgrade it to the new format with the chosen size and position.</div>`
        : '';

      pop.innerHTML = `
        ${legacyNote}
        <div class="rte-img-edit-row">
          <span class="rte-img-edit-label">Size</span>
          <div class="rte-img-edit-strip${sizeDirty ? ' is-dirty' : ''}" data-control="size">
            ${[['small','33%'],['medium','50%'],['large','75%'],['full','100%']].map(([v,l]) =>
              `<button type="button" class="rte-img-size-btn${st.stagedSize===v?' active':''}" data-size="${v}">${l}</button>`
            ).join('')}
          </div>
        </div>
        <div class="rte-img-edit-row${alignDisabled ? ' is-disabled' : ''}">
          <span class="rte-img-edit-label">Position</span>
          <div class="rte-img-edit-strip${alignDirty ? ' is-dirty' : ''}" data-control="align">
            ${[['left','◀'],['center','■'],['right','▶']].map(([v,icon]) =>
              `<button type="button" class="rte-img-align-btn${st.stagedAlign===v?' active':''}" data-align="${v}" title="${v}">${icon}</button>`
            ).join('')}
          </div>
        </div>
        <div class="rte-img-edit-actions">
          <a href="#" class="rte-img-edit-cancel" id="${this.id}-img-edit-cancel">Cancel</a>
          <div class="rte-img-edit-action-buttons">
            <button type="button" class="ix-btn ix-btn--ghost rte-img-edit-remove"  id="${this.id}-img-edit-remove">Remove</button>
            <button type="button" class="ix-btn ix-btn--ghost rte-img-edit-replace" id="${this.id}-img-edit-replace">Replace</button>
            <button type="button" class="ix-btn ix-btn--primary rte-img-edit-apply" id="${this.id}-img-edit-apply" ${anyDirty || st.mode === 'image' ? '' : 'disabled'}>Apply</button>
          </div>
        </div>
      `;

      // Wire buttons
      pop.querySelectorAll('.rte-img-size-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this._editState.stagedSize = btn.getAttribute('data-size');
          this.renderEditPopover();
        });
      });
      pop.querySelectorAll('.rte-img-align-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (this._editState.stagedSize === 'full') return;
          this._editState.stagedAlign = btn.getAttribute('data-align');
          this.renderEditPopover();
        });
      });
      const cancelLink = pop.querySelector(`#${this.id}-img-edit-cancel`);
      if (cancelLink) cancelLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeEditPopover(/*revert=*/true);
      });
      const removeBtn = pop.querySelector(`#${this.id}-img-edit-remove`);
      if (removeBtn) removeBtn.addEventListener('click', () => this.removeFromEditPopover());
      const replaceBtn = pop.querySelector(`#${this.id}-img-edit-replace`);
      if (replaceBtn) replaceBtn.addEventListener('click', () => this.replaceFromEditPopover());
      const applyBtn = pop.querySelector(`#${this.id}-img-edit-apply`);
      if (applyBtn) applyBtn.addEventListener('click', () => this.applyEditPopover());
    }

    _positionEditPopover() {
      const pop = this._editPopoverEl;
      const st = this._editState;
      if (!pop || !st || !st.outerFig) return;

      const rect = st.outerFig.getBoundingClientRect();
      const popRect = pop.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8;

      let top  = rect.bottom + margin;
      let left = rect.left + (rect.width / 2) - (popRect.width / 2);

      if (top + popRect.height > vh - margin) {
        top = rect.top - popRect.height - margin;
      }
      if (left < margin) left = margin;
      if (left + popRect.width > vw - margin) left = vw - margin - popRect.width;
      if (top < margin) top = margin;

      pop.style.position = 'fixed';
      pop.style.top  = top  + 'px';
      pop.style.left = left + 'px';
    }

    closeEditPopover(revert) {
      // revert is a no-op — staged state lives in memory until Apply
      if (this._editPopoverEl) {
        this._editPopoverEl.remove();
        this._editPopoverEl = null;
      }
      this._editState = null;
      if (this._editEscHandler) {
        document.removeEventListener('keydown', this._editEscHandler);
        this._editEscHandler = null;
      }
      if (this._editClickOutsideHandler) {
        document.removeEventListener('click', this._editClickOutsideHandler, true);
        this._editClickOutsideHandler = null;
      }
      if (this._editScrollHandler) {
        window.removeEventListener('scroll', this._editScrollHandler, true);
        window.removeEventListener('resize', this._editScrollHandler);
        this._editScrollHandler = null;
      }
    }

    applyEditPopover() {
      const st = this._editState;
      if (!st) return;

      const _size  = st.stagedSize  || 'large';
      const _align = st.stagedAlign || 'center';
      const _style = buildFigureInlineStyle(_size, _align);

      const newHTML =
        `<figure class="rte-inserted-image" data-img-size="${esc(_size)}" data-img-align="${esc(_align)}" style="${esc(_style)}">`
        + `<img src="${esc(st.img.src)}" alt="${esc(st.img.alt)}" data-media-id="${esc(st.img.mediaId)}" data-component-role="${esc(st.img.componentRole)}">`
        + (st.img.caption ? `<figcaption>${esc(st.img.caption)}</figcaption>` : '')
        + `</figure>`;

      if (st.mode === 'html') {
        // In-place — Trix re-renders attachment
        st.attachment.setAttribute('content', newHTML);
        console.log(`[RTE] Edit applied (in-place html): size ${st.originalSize}→${_size}, align ${st.originalAlign}→${_align} | MEDIA ID ${st.img.mediaId}`);
      } else {
        // Legacy image — remove and insert as text/html attachment
        const doc = this.trixEditor.getDocument();
        const range = doc.getRangeOfAttachment(st.attachment);
        if (range) {
          this.trixEditor.setSelectedRange(range);
          this.trixEditor.deleteInDirection('forward');
          const newAtt = new window.Trix.Attachment({ content: newHTML });
          this.trixEditor.insertAttachment(newAtt);
          console.log(`[RTE] Edit applied (upgrade image→html): size ${_size}, align ${_align} | URL ${st.img.src}`);
        }
      }

      this.dirty = true;
      this.updateCounts();
      this.updateDirtyState();
      this.closeEditPopover(false);
    }

    removeFromEditPopover() {
      const st = this._editState;
      if (!st || !st.attachment || !this.trixEditor) return;

      const doc = this.trixEditor.getDocument();
      const range = doc.getRangeOfAttachment(st.attachment);
      if (range) {
        this.trixEditor.setSelectedRange(range);
        this.trixEditor.deleteInDirection('forward');
        this.dirty = true;
        this.updateCounts();
        this.updateDirtyState();
        console.log(`[RTE] Removed image (${st.mode}) | MEDIA ID ${st.img.mediaId || '(legacy)'}`);
      }
      this.closeEditPopover(false);
    }

    replaceFromEditPopover() {
      const st = this._editState;
      if (!st || !st.attachment) return;

      this._replacingAttachment = st.attachment;
      this.closeEditPopover(false);
      if (!this.pickerOpen) this.togglePicker();
    }

    /* ── S11: Inline upload pipeline ──
       Three entry points all funnel through handleUploadFileSelected(file):
         1. Toolbar "Upload Inline Image" button → openUploadFilePicker → file input change
         2. Paste from clipboard → 'paste' event handler
         3. (TD-157 / future) Drag-and-drop onto editor body
       From there: validate → show modal (preview + role select) → on
       confirm, upload to Uploadcare, POST to Scenario B Route 5, swap
       the placeholder for the real <figure><img data-media-id>.
    ── */
    openUploadFilePicker() {
      const input = this.mount.querySelector(`#${this.id}-upload-file-input`);
      if (input) input.click();
    }

    handleUploadFileSelected(file) {
      const v = validateInlineFile(file);
      if (!v.ok) {
        this.showRteToast(v.reason, 'error');
        return;
      }
      this.showUploadModal(file);
    }

    /* ── Component-role modal: thumbnail + role dropdown + Cancel/Upload ── */
    showUploadModal(file) {
      // Tear down any prior modal
      this.hideUploadModal();

      const objUrl = URL.createObjectURL(file);
      const overlay = document.createElement('div');
      overlay.className = 'rte-up-modal-overlay';
      overlay.id = `${this.id}-up-modal`;
      overlay.innerHTML = `
        <div class="rte-up-modal" role="dialog" aria-modal="true" aria-labelledby="${this.id}-up-title">
          <div class="rte-up-modal-header">
            <span id="${this.id}-up-title" class="rte-up-modal-title">Upload Inline Image</span>
            <button type="button" class="rte-up-modal-close ix-btn ix-btn--ghost ix-btn--icon" id="${this.id}-up-close" aria-label="Close">&times;</button>
          </div>
          <div class="rte-up-modal-body">
            <div class="rte-up-preview-wrap">
              <img class="rte-up-preview" src="${esc(objUrl)}" alt="Preview">
              <div class="rte-up-meta">
                <div class="rte-up-meta-name" title="${esc(file.name)}">${esc(file.name)}</div>
                <div class="rte-up-meta-size">${humanFileSize(file.size)}</div>
              </div>
            </div>
            <div class="rte-up-field">
              <label class="rte-up-label" for="${this.id}-up-role">Component Role</label>
              <select class="rte-up-select" id="${this.id}-up-role">
                <option value="interiorImage" selected>Interior Image</option>
                <option value="mainImage">Main Image</option>
              </select>
              <div class="rte-up-hint">Default is Interior Image. Choose Main Image if this should be the article's hero.</div>
            </div>
            <div class="rte-up-field">
              <label class="rte-up-label">Display Size</label>
              <div class="rte-img-size-strip rte-img-size-strip--modal">
                ${[['small','Small (33%)'],['medium','Medium (50%)'],['large','Large (75%)'],['full','Full width']].map(([v,l]) =>
                  `<button type="button" class="rte-img-size-btn${this.selectedImgSize===v?' active':''}" data-size="${v}">${l}</button>`
                ).join('')}
              </div>
            </div>
            <div class="rte-up-field" id="${this.id}-up-align-field" style="${this.selectedImgSize==='full'?'opacity:0.35;pointer-events:none;':''}">
              <label class="rte-up-label">Alignment</label>
              <div class="rte-img-align-strip">
                ${[['left','Left ◀'],['center','Center ■'],['right','Right ▶']].map(([v,l]) =>
                  `<button type="button" class="rte-img-align-btn${this.selectedImgAlign===v?' active':''}" data-align="${v}">${l}</button>`
                ).join('')}
              </div>
            </div>
          </div>
          <div class="rte-up-modal-footer">
            <button type="button" class="rte-up-btn rte-up-btn-cancel ix-btn ix-btn--ghost" id="${this.id}-up-cancel">Cancel</button>
            <button type="button" class="rte-up-btn rte-up-btn-go ix-btn ix-btn--primary" id="${this.id}-up-go">Upload</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      this._uploadModal = { overlay, objUrl, file };

      const cleanup = () => this.hideUploadModal();

      overlay.querySelector(`#${this.id}-up-close`).addEventListener('click', cleanup);
      overlay.querySelector(`#${this.id}-up-cancel`).addEventListener('click', cleanup);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(); });
      const escFn = (e) => { if (e.key === 'Escape') cleanup(); };
      document.addEventListener('keydown', escFn);
      this._uploadModal.escFn = escFn;

      // v1.1.5: size/align controls in upload modal — update shared state
      overlay.querySelectorAll('.rte-img-size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.selectedImgSize = btn.getAttribute('data-size');
          const alignField = overlay.querySelector(`#${this.id}-up-align-field`);
          const isFull = this.selectedImgSize === 'full';
          overlay.querySelectorAll('.rte-img-size-btn').forEach(b => b.classList.toggle('active', b === btn));
          if (alignField) { alignField.style.opacity = isFull ? '0.35' : '1'; alignField.style.pointerEvents = isFull ? 'none' : ''; }
        });
      });
      overlay.querySelectorAll('.rte-img-align-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.selectedImgAlign = btn.getAttribute('data-align');
          overlay.querySelectorAll('.rte-img-align-btn').forEach(b => b.classList.toggle('active', b === btn));
        });
      });

      overlay.querySelector(`#${this.id}-up-go`).addEventListener('click', () => {
        const sel = overlay.querySelector(`#${this.id}-up-role`);
        const roleKey = sel ? sel.value : 'interiorImage';
        this.hideUploadModal();
        this.runInlineUpload(file, roleKey);
      });
    }

    hideUploadModal() {
      if (!this._uploadModal) return;
      const { overlay, objUrl, escFn } = this._uploadModal;
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (objUrl) { try { URL.revokeObjectURL(objUrl); } catch (e) { /* noop */ } }
      if (escFn) document.removeEventListener('keydown', escFn);
      this._uploadModal = null;
    }

    /* ── runInlineUpload: drives the full upload pipeline ──
       1. Insert placeholder <img> at cursor (Trix attachment)
       2. Upload to Uploadcare (browser → upload.uploadcare.com)
       3. POST to Scenario B Route 5 (browser → makeConditioner)
       4. Swap placeholder for real <figure><img data-media-id="...">
    ── */
    runInlineUpload(file, roleKey) {
      const cfg = getInlineUploadCfg();

      // Pre-flight: required values present?
      const missing = [];
      if (!cfg.uploadcarePublicKey) missing.push('uploadcarePublicKey');
      if (!cfg.makeConditioner)     missing.push('makeConditioner');
      if (!cfg.taItemId)            missing.push('taItemId');
      if (!cfg.publisherId)         missing.push('publisherId (#title-admin-id [data-pub])');
      if (!cfg.hashes.statusAvailable) missing.push('optionIds.mediaStatus.available');
      if (!cfg.hashes.typeImage)       missing.push('optionIds.mediaType.image');
      const roleHash = (roleKey === 'mainImage') ? cfg.hashes.roleMain : cfg.hashes.roleInterior;
      if (!roleHash) missing.push('optionIds.componentRole.' + roleKey);

      if (missing.length) {
        const msg = 'Cannot upload — TA_CONFIG / DOM is missing: ' + missing.join(', ');
        console.error('[RTE inline upload]', msg);
        this.showRteToast(msg, 'error');
        return;
      }

      const placeholderId = 'rte-up-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      this.insertUploadPlaceholder(placeholderId, file.name);

      uploadToUploadcare(file, cfg.uploadcarePublicKey)
        .then(({ uuid, originalUrl }) => {
          const payload = {
            source: 'rte-inline',
            uploadcareUuid: uuid,
            uploadcareUrl: originalUrl,
            fileName: file.name,
            fileSize: file.size,
            mediaType: 'Image',
            componentRole: (roleKey === 'mainImage') ? 'Main Image' : 'Interior Image',
            componentRoleHash: roleHash,
            mediaTypeHash: cfg.hashes.typeImage,
            mediaStatusAvailableHash: cfg.hashes.statusAvailable,
            taItemId: cfg.taItemId,
            titleSlug: cfg.titleSlug,
            publisherId: cfg.publisherId,
          };
          return postToConditioner(payload, cfg.makeConditioner);
        })
        .then((resp) => {
          this.swapPlaceholderForImage(placeholderId, {
            url: resp.uploadcareUrl,
            mediaItemId: resp.mediaItemId,
            componentRole: resp.componentRole || ((roleKey === 'mainImage') ? 'Main Image' : 'Interior Image'),
            altText: file.name,
          });
          this.dirty = true;
          this.updateCounts();
          this.updateDirtyState();
          console.log('[RTE inline upload] OK | mediaItemId:', resp.mediaItemId);
        })
        .catch((err) => {
          console.error('[RTE inline upload] FAILED:', err);
          this.removeUploadPlaceholder(placeholderId);
          const reason = (err && err.message) ? err.message : 'Unknown error.';
          this.showRteToast('Upload failed — ' + reason + ' Try again.', 'error');
        });
    }

    insertUploadPlaceholder(placeholderId, filename) {
      if (!this.trixEditor) return;
      // Inline SVG spinner; encoded as data URL so no external request.
      const spinnerSvg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='200' height='160' viewBox='0 0 200 160'>
          <rect width='100%' height='100%' fill='#faf9f5' rx='6'/>
          <g transform='translate(100,72)'>
            <circle r='18' fill='none' stroke='#e8e4d8' stroke-width='4'/>
            <path d='M0,-18 A18,18 0 0,1 18,0' fill='none' stroke='#c4a35a' stroke-width='4' stroke-linecap='round'>
              <animateTransform attributeName='transform' type='rotate' from='0' to='360' dur='1s' repeatCount='indefinite'/>
            </path>
          </g>
          <text x='100' y='128' text-anchor='middle' font-family='DM Mono, monospace' font-size='10' fill='#5a6a5a'>Uploading…</text>
        </svg>
      `.trim();
      const dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(spinnerSvg);

      const figureHTML =
        `<figure class="rte-inserted-image rte-upload-placeholder" data-rte-upload-id="${esc(placeholderId)}">` +
        `<img src="${dataUrl}" alt="Uploading ${esc(filename)}" data-rte-uploading="1">` +
        `</figure>`;

      // S11 v1.1.2: keep a handle to the Trix Attachment object so we
      // can remove it via the Trix API later. Direct DOM mutation gets
      // reverted on Trix's next render tick because Trix re-renders
      // from its internal Document model, not from the DOM.
      const attachment = new window.Trix.Attachment({ content: figureHTML });
      this._pendingUploadAttachment = attachment;
      this.trixEditor.insertAttachment(attachment);
    }

    swapPlaceholderForImage(placeholderId, opts) {
      // S11 v1.1.2: Trix owns the rendered DOM inside <trix-editor>.
      // Direct DOM mutations (classList, innerHTML) get reverted on the
      // next Trix render tick because Trix re-renders from its internal
      // Document model, which doesn't know about the mutations. The
      // working pattern is:
      //   1. Locate the placeholder Attachment in Trix's document
      //   2. Use Trix selection API to select that attachment
      //   3. Delete the selection (removes the attachment from the model)
      //   4. Insert the real image as a fresh Attachment
      // This way Trix's model stays the source of truth.
      const ph = this._pendingUploadAttachment;
      if (!ph || !this.trixEditor) {
        console.warn('[RTE inline upload] no pending attachment handle; inserting at cursor');
        this.insertCompletedInlineImage(opts);
        return;
      }

      try {
        // Find the placeholder's range in Trix's document and select it
        const doc = this.trixEditor.getDocument();
        const range = doc.getRangeOfAttachment(ph);
        if (!range) {
          console.warn('[RTE inline upload] placeholder range not in document; inserting at cursor');
          this._pendingUploadAttachment = null;
          this.insertCompletedInlineImage(opts);
          return;
        }
        // Select the placeholder, delete it, then insert the real image
        // attachment in its place.
        this.trixEditor.setSelectedRange(range);
        this.trixEditor.deleteInDirection('forward');

        // v1.1.15: inline style added — see header changelog Part B
        const _sizeS  = this.selectedImgSize  || 'large';
        const _alignS = this.selectedImgAlign || 'center';
        const _styleS = buildFigureInlineStyle(_sizeS, _alignS);
        const finalHTML =
          `<figure class="rte-inserted-image" data-img-size="${esc(_sizeS)}" data-img-align="${esc(_alignS)}" style="${esc(_styleS)}">` +
          `<img src="${esc(opts.url)}" alt="${esc(opts.altText || '')}" ` +
            `data-media-id="${esc(opts.mediaItemId)}" ` +
            `data-component-role="${esc(opts.componentRole || '')}">` +
          `</figure>`;
        const real = new window.Trix.Attachment({ content: finalHTML });
        this.trixEditor.insertAttachment(real);
      } catch (e) {
        console.error('[RTE inline upload] swap failed:', e);
        // Best-effort fallback
        this.insertCompletedInlineImage(opts);
      } finally {
        this._pendingUploadAttachment = null;
      }
    }

    insertCompletedInlineImage(opts) {
      if (!this.trixEditor) return;
      // v1.1.15: inline style added — see header changelog Part B
      const _sizeC  = this.selectedImgSize  || 'large';
      const _alignC = this.selectedImgAlign || 'center';
      const _styleC = buildFigureInlineStyle(_sizeC, _alignC);
      const figureHTML =
        `<figure class="rte-inserted-image" data-img-size="${esc(_sizeC)}" data-img-align="${esc(_alignC)}" style="${esc(_styleC)}">` +
        `<img src="${esc(opts.url)}" alt="${esc(opts.altText || '')}" ` +
          `data-media-id="${esc(opts.mediaItemId)}" ` +
          `data-component-role="${esc(opts.componentRole || '')}">` +
        `</figure>`;
      const attachment = new window.Trix.Attachment({ content: figureHTML });
      this.trixEditor.insertAttachment(attachment);
    }

    removeUploadPlaceholder(placeholderId) {
      // S11 v1.1.2: same pattern as swapPlaceholderForImage — remove
      // through Trix's model, not the DOM.
      const ph = this._pendingUploadAttachment;
      if (!ph || !this.trixEditor) return;
      try {
        const doc = this.trixEditor.getDocument();
        const range = doc.getRangeOfAttachment(ph);
        if (range) {
          this.trixEditor.setSelectedRange(range);
          this.trixEditor.deleteInDirection('forward');
        }
      } catch (e) {
        console.warn('[RTE inline upload] placeholder removal failed:', e);
      } finally {
        this._pendingUploadAttachment = null;
      }
    }

    /* ── Lightweight toast (S11) ──
       Self-contained — does not depend on Studio or page-level toast
       systems. Lives inside the RTE mount so it survives fullscreen.
       Levels: 'info' (cream) | 'error' (red-tinted).
    ── */
    showRteToast(message, level) {
      const lvl = level || 'info';
      const host = this.mount;
      if (!host) return;
      const t = document.createElement('div');
      t.className = 'rte-toast rte-toast-' + lvl;
      t.textContent = message;
      host.appendChild(t);
      // Slide-in via reflow + class
      requestAnimationFrame(() => t.classList.add('rte-toast-show'));
      const lifeMs = (lvl === 'error') ? 5000 : 3500;
      setTimeout(() => {
        t.classList.remove('rte-toast-show');
        setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 250);
      }, lifeMs);
    }

    /* ── Status bar updates ── */
    updateCounts() {
      const html = this.getHTML();
      const { chars, words, images } = countContent(html);
      const countsEl = this.mount.querySelector(`#${this.id}-counts`);
      if (countsEl) {
        countsEl.textContent = `${chars.toLocaleString()} chars \u00B7 ${words.toLocaleString()} words${images > 0 ? ` \u00B7 ${images} image${images !== 1 ? 's' : ''} inserted` : ''}`;
      }
    }

    updateDirtyState() {
      const indicator = this.mount.querySelector(`#${this.id}-dirty`);
      if (indicator) {
        indicator.style.display = this.dirty ? 'inline' : 'none';
      }
    }

    /* ── Get clean HTML for Webflow ── */
    getHTML() {
      const input = this.mount.querySelector(`#${this.id}-input`);
      return input ? input.value : '';
    }

    getCleanHTML() {
      return cleanHTMLForWebflow(this.getHTML());
    }

    /* ── Save handler ── */
    handleSave() {
      const cleanHTML = this.getCleanHTML();

      if (this.cfg.onSave) {
        this.cfg.onSave(cleanHTML, this.cfg.articleItemId);
        this.dirty = false;
        this.updateDirtyState();
        return;
      }

      if (this.cfg.webhookUrl) {
        const payload = new URLSearchParams({
          articleItemId: this.cfg.articleItemId || '',
          articleBody: cleanHTML,
          action: 'updateBody',
        });

        fetch(this.cfg.webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: payload.toString(),
        }).then(() => {
          this.dirty = false;
          this.updateDirtyState();
          console.log('[RTE] Saved to CMS via webhook');
        }).catch(err => {
          console.error('[RTE] Save failed:', err);
        });
        return;
      }

      console.warn('[RTE] No onSave callback or webhookUrl configured');
    }

    /* ── Cancel handler ── */
    handleCancel() {
      if (this.cfg.fullscreen) {
        this.closeFullscreen();
        return;
      }

      if (this.dirty) {
        if (!confirm(
          'You have unsaved changes. Discard them?\n\n' +
          'Note: any images you uploaded inline will remain in your MEDIA library ' +
          '("Ready to Assign") and can be picked later.'
        )) return;
      }

      if (this.cfg.onCancel) {
        this.cfg.onCancel();
        return;
      }

      // Revert to original
      if (this.trixEditor && this.originalHTML) {
        this.trixEditor.loadHTML(this.originalHTML);
      }
      this.dirty = false;
      this.updateDirtyState();
      this.updateCounts();
    }

    /* ── Programmatic API ── */
    setContent(html) {
      if (this.trixEditor) {
        this.trixEditor.loadHTML(html);
        this.originalHTML = html;
        this.dirty = false;
        this.updateCounts();
        this.updateDirtyState();
      }
    }

    focus() {
      if (this.editorEl) this.editorEl.focus();
    }

    /* ════════════════════════════════════════════════════════════
       v1.1.22 (TD-178) — Assess Content using Claude
       ════════════════════════════════════════════════════════════
       Side panel that runs the current article body through Claude
       (with web_search tool enabled) for a staleness/accuracy review.
       Returns structured findings — each with original snippet,
       proposed drop-in replacement, and one-click copy button.

       Lifecycle:
         openAssessPanel()    — entry; closes picker if open; renders preflight
         renderAssessPanel()  — renders the panel DOM based on _assessStage
         runAssessment()      — POSTs to Anthropic proxy, sets _assessStage
         closeAssessPanel()   — tears down panel + ESC handler

       The panel lives in document.body at z-index 10025 (above ABE,
       picker, lightbox) so it floats independently of the RTE mount
       and survives any internal re-renders.
    ════════════════════════════════════════════════════════════ */

    openAssessPanel() {
      // Only available in fullscreen mode (button isn't rendered otherwise)
      if (!this.cfg.fullscreen) return;
      // Close picker if open — single-focus operator UX
      if (this.pickerOpen) {
        try { this.togglePicker(); } catch (e) {}
      }
      // If panel already open, no-op
      if (this._assessPanel) return;
      // Default state for a fresh open
      this._assessStage = 'preflight';
      this._assessResult = null;
      this._assessError = null;
      this._assessTargetDate = this._assessTargetDate || this._defaultTargetIssueDate();
      // Build container
      this._assessPanel = document.createElement('div');
      this._assessPanel.className = 'rte-assess-panel';
      this._assessPanel.id = this.id + '-assess-panel';
      document.body.appendChild(this._assessPanel);
      // ESC handler — window-level capture-phase so it fires BEFORE
      // the ABE's document-level ESC handler. stopPropagation prevents
      // the ABE from also closing.
      this._assessEscHandler = (e) => {
        if (e.key === 'Escape' && this._assessPanel) {
          e.stopPropagation();
          e.preventDefault();
          this.closeAssessPanel();
        }
      };
      window.addEventListener('keydown', this._assessEscHandler, true);
      // Render
      this.renderAssessPanel();
      // Slide in via class flip on next frame
      requestAnimationFrame(() => {
        if (this._assessPanel) this._assessPanel.classList.add('visible');
      });
    }

    closeAssessPanel() {
      if (!this._assessPanel) return;
      if (this._assessEscHandler) {
        window.removeEventListener('keydown', this._assessEscHandler, true);
        this._assessEscHandler = null;
      }
      if (this._assessPanel.parentNode) {
        this._assessPanel.parentNode.removeChild(this._assessPanel);
      }
      this._assessPanel = null;
    }

    _defaultTargetIssueDate() {
      // First of next month, YYYY-MM-DD
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}-01`;
    }

    renderAssessPanel() {
      if (!this._assessPanel) return;
      const stage = this._assessStage;
      let bodyHtml = '';

      if (stage === 'preflight') {
        bodyHtml = `
          <div class="rte-assess-preflight">
            <p class="rte-assess-blurb">Claude reviews the article body for time-stamped facts (cookbook counts, follower numbers, business statuses, dates) that may be stale, and proposes specific drop-in replacement copy. Uses web search to verify current facts.</p>
            <label class="rte-assess-field">
              <span class="rte-assess-field-label">Target issue date <span class="rte-assess-required">*</span></span>
              <input type="date" class="rte-assess-input" id="${this.id}-assess-target" value="${esc(this._assessTargetDate)}" required>
              <span class="rte-assess-field-hint">When this article will appear in print/email.</span>
            </label>
            <label class="rte-assess-field">
              <span class="rte-assess-field-label">Article originally published <span class="rte-assess-optional">(optional)</span></span>
              <input type="date" class="rte-assess-input" id="${this.id}-assess-original" value="${esc(this._assessOriginalDate)}">
              <span class="rte-assess-field-hint">If known. Helps Claude weight what's likely stale.</span>
            </label>
            <div class="rte-assess-preflight-actions">
              <button type="button" class="rte-assess-cancel-btn" id="${this.id}-assess-cancel">Cancel</button>
              <button type="button" class="rte-assess-run-btn" id="${this.id}-assess-run">Run analysis</button>
            </div>
          </div>`;
      } else if (stage === 'loading') {
        bodyHtml = `
          <div class="rte-assess-loading">
            <div class="rte-assess-spinner"></div>
            <div class="rte-assess-loading-text">Analyzing\u2026</div>
            <div class="rte-assess-loading-sub">Claude is fact-checking time-stamped claims via web search. Typically 30\u201360 seconds.</div>
          </div>`;
      } else if (stage === 'error') {
        const errMsg = esc(this._assessError || 'Unknown error');
        bodyHtml = `
          <div class="rte-assess-error">
            <div class="rte-assess-error-title">Analysis failed</div>
            <div class="rte-assess-error-msg">${errMsg}</div>
            <div class="rte-assess-error-actions">
              <button type="button" class="rte-assess-cancel-btn" id="${this.id}-assess-back">Back</button>
              <button type="button" class="rte-assess-run-btn" id="${this.id}-assess-retry">Try again</button>
            </div>
          </div>`;
      } else if (stage === 'results') {
        bodyHtml = this._renderAssessResults();
      }

      this._assessPanel.innerHTML = `
        <div class="rte-assess-header">
          <span class="rte-assess-title">Assess content</span>
          <button type="button" class="rte-assess-close-x" id="${this.id}-assess-close" aria-label="Close">\u00D7</button>
        </div>
        <div class="rte-assess-body">${bodyHtml}</div>`;

      // Wire close X
      const closeX = this._assessPanel.querySelector(`#${this.id}-assess-close`);
      if (closeX) closeX.addEventListener('click', () => this.closeAssessPanel());

      // Wire stage-specific buttons
      if (stage === 'preflight') {
        const cancel = this._assessPanel.querySelector(`#${this.id}-assess-cancel`);
        if (cancel) cancel.addEventListener('click', () => this.closeAssessPanel());
        const run = this._assessPanel.querySelector(`#${this.id}-assess-run`);
        if (run) run.addEventListener('click', () => {
          const targetEl = this._assessPanel.querySelector(`#${this.id}-assess-target`);
          const origEl = this._assessPanel.querySelector(`#${this.id}-assess-original`);
          const target = targetEl ? targetEl.value.trim() : '';
          if (!target) {
            alert('Target issue date is required.');
            return;
          }
          this._assessTargetDate = target;
          this._assessOriginalDate = origEl ? origEl.value.trim() : '';
          this.runAssessment();
        });
      } else if (stage === 'error') {
        const back = this._assessPanel.querySelector(`#${this.id}-assess-back`);
        if (back) back.addEventListener('click', () => {
          this._assessStage = 'preflight';
          this._assessError = null;
          this.renderAssessPanel();
        });
        const retry = this._assessPanel.querySelector(`#${this.id}-assess-retry`);
        if (retry) retry.addEventListener('click', () => this.runAssessment());
      } else if (stage === 'results') {
        this._wireResultsCopyButtons();
        const runAgain = this._assessPanel.querySelector(`#${this.id}-assess-run-again`);
        if (runAgain) runAgain.addEventListener('click', () => {
          this._assessStage = 'preflight';
          this._assessResult = null;
          this.renderAssessPanel();
        });
      }
    }

    _renderAssessResults() {
      const r = this._assessResult;
      if (!r) return '<div class="rte-assess-empty">No results.</div>';

      const summary = r.summary
        ? `<div class="rte-assess-summary"><div class="rte-assess-section-label">Overall</div><p>${esc(r.summary)}</p></div>`
        : '';

      const findings = Array.isArray(r.findings) ? r.findings : [];
      const findingsBlock = findings.length
        ? `<div class="rte-assess-section-label">Findings (${findings.length})</div>` +
          findings.map((f, idx) => this._renderFindingCard(f, idx)).join('')
        : `<div class="rte-assess-no-findings">No staleness issues found. The article should run cleanly as-is.</div>`;

      const questions = Array.isArray(r.editorial_questions) ? r.editorial_questions : [];
      const questionsBlock = questions.length
        ? `<div class="rte-assess-section-label">Editorial decisions to make</div>
           <ul class="rte-assess-questions">
             ${questions.map(q => `<li>${esc(q)}</li>`).join('')}
           </ul>`
        : '';

      return `
        ${summary}
        ${findingsBlock}
        ${questionsBlock}
        <div class="rte-assess-results-footer">
          <button type="button" class="rte-assess-cancel-btn" id="${this.id}-assess-run-again">Run again with different dates</button>
        </div>`;
    }

    _renderFindingCard(f, idx) {
      const priority = (f.priority || 'medium').toLowerCase();
      const category = (f.category || 'editorial').toLowerCase();
      const original = f.original_text || '';
      const replacement = f.replacement_text || '';
      const reasoning = f.reasoning || '';
      // v1.1.23: primary action flipped Copy → Replace. The Copy
      // icon-link survives as a fallback (whitespace mismatch, or
      // operator wants to paste elsewhere). Disabled state styling
      // applied post-click via the wire method.
      const canAct = !!replacement;
      return `
        <div class="rte-assess-finding rte-assess-finding-${priority}" data-finding-idx="${idx}">
          <div class="rte-assess-finding-pills">
            <span class="rte-assess-pill rte-assess-pill-priority rte-assess-pill-${priority}">${esc(priority)}</span>
            <span class="rte-assess-pill rte-assess-pill-category">${esc(category)}</span>
          </div>
          ${original ? `
            <div class="rte-assess-finding-block">
              <div class="rte-assess-finding-block-label">Find in article</div>
              <div class="rte-assess-finding-original">${esc(original)}</div>
            </div>` : ''}
          ${replacement ? `
            <div class="rte-assess-finding-block">
              <div class="rte-assess-finding-block-label">Drop-in replacement</div>
              <div class="rte-assess-finding-replacement" data-replacement-idx="${idx}">${esc(replacement)}</div>
              <div class="rte-assess-finding-actions">
                <button type="button" class="rte-assess-replace-btn" data-replace-idx="${idx}" ${canAct ? '' : 'disabled'} aria-label="Replace text in editor">
                  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="vertical-align:-1px;margin-right:5px;">
                    <path d="M2 8a6 6 0 0 1 10.5-4M14 8a6 6 0 0 1-10.5 4"></path>
                    <polyline points="11 1 12.5 4 9.5 4"></polyline>
                    <polyline points="5 15 3.5 12 6.5 12"></polyline>
                  </svg>
                  <span>Replace in editor</span>
                </button>
                <button type="button" class="rte-assess-copy-link" data-copy-idx="${idx}" title="Copy replacement to clipboard" aria-label="Copy replacement to clipboard">
                  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="5" y="5" width="9" height="9" rx="1"></rect>
                    <path d="M3 11V3a1 1 0 011-1h8"></path>
                  </svg>
                  <span>copy</span>
                </button>
              </div>
            </div>` : ''}
          ${reasoning ? `
            <div class="rte-assess-finding-reasoning">${esc(reasoning)}</div>` : ''}
        </div>`;
    }

    _wireResultsCopyButtons() {
      // v1.1.23: renamed conceptually to "wire results action buttons" —
      // method name preserved for API stability (called from renderAssessPanel).
      // Wires both the primary Replace buttons AND the fallback copy links.
      if (!this._assessPanel) return;
      const findings = (this._assessResult && this._assessResult.findings) || [];

      // ── Replace buttons (primary action) ──
      this._assessPanel.querySelectorAll('.rte-assess-replace-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-replace-idx'), 10);
          const f = findings[idx];
          if (!f || !f.replacement_text) return;
          const result = this._tryReplaceInEditor(f.original_text || '', f.replacement_text);
          if (result.ok) {
            // Flip button to success state
            btn.disabled = true;
            btn.classList.add('rte-assess-replace-btn-done');
            btn.innerHTML = '<span style="font-weight:600;">\u2713 Replaced' +
              (result.multiple ? ' (first of ' + result.totalMatches + ')' : '') +
              '</span>';
            // Brief toast confirmation
            this._showAssessToast(result.multiple
              ? `Replaced first of ${result.totalMatches} matches. Other occurrences left for review.`
              : 'Replaced in editor.', 'success');
          } else {
            this._showAssessToast(result.error || 'Replace failed — try copy instead.', 'error');
          }
        });
      });

      // ── Copy links (fallback) ──
      this._assessPanel.querySelectorAll('.rte-assess-copy-link').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-copy-idx'), 10);
          const f = findings[idx];
          if (!f || !f.replacement_text) return;
          const text = f.replacement_text;
          const onSuccess = () => {
            const orig = btn.innerHTML;
            btn.innerHTML = '<span style="color:#0F9D58;font-weight:600;">\u2713 copied</span>';
            setTimeout(() => { if (btn) btn.innerHTML = orig; }, 1400);
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
              console.warn('[RTE v1.1.23] navigator.clipboard.writeText failed; falling back to execCommand');
              this._legacyCopy(text, onSuccess);
            });
          } else {
            this._legacyCopy(text, onSuccess);
          }
        });
      });
    }

    _legacyCopy(text, onSuccess) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        onSuccess();
      } catch (e) {
        console.error('[RTE v1.1.23] copy failed:', e);
      }
      document.body.removeChild(ta);
    }

    /* v1.1.23 — find-and-replace in the Trix editor.
       Returns { ok, error?, multiple?, totalMatches? }.

       Algorithm:
         1. Get the editor's plain-text via getDocument().toString()
         2. indexOf the original_text — exact match required for
            position mapping (Trix's setSelectedRange uses character
            indices in the plain-text representation, so any
            normalization would desync positions)
         3. If found: setSelectedRange + insertString does the swap.
            Trix re-renders the affected block; selection ends up
            at the end of the inserted text.
         4. Mark dirty so save bar shows "unsaved changes"

       Whitespace mismatch handling:
         If exact match fails, we try a normalized match (collapse
         whitespace) just to detect "the text IS there, formatted
         differently." We do NOT then re-map positions — too fragile.
         Instead we report the situation so the operator can copy
         and paste manually. */
    _tryReplaceInEditor(originalText, replacementText) {
      if (!this.trixEditor || typeof this.trixEditor.getDocument !== 'function') {
        return { ok: false, error: 'Editor not ready. Try again.' };
      }
      if (!originalText) {
        return { ok: false, error: 'No original text to find.' };
      }
      let docString;
      try {
        docString = this.trixEditor.getDocument().toString();
      } catch (e) {
        return { ok: false, error: 'Could not read editor content.' };
      }

      // Exact match — required for accurate position mapping
      const idx = docString.indexOf(originalText);
      if (idx === -1) {
        // Probe: does it exist with different whitespace?
        const normalize = s => s.replace(/\s+/g, ' ').trim();
        const found = normalize(docString).indexOf(normalize(originalText)) !== -1;
        return {
          ok: false,
          error: found
            ? 'Text found but whitespace differs — use Copy to paste manually.'
            : 'Text not found in editor — use Copy and paste manually.'
        };
      }

      // Count total matches (for the "first of N" message)
      let totalMatches = 0;
      let searchFrom = 0;
      while ((searchFrom = docString.indexOf(originalText, searchFrom)) !== -1) {
        totalMatches++;
        searchFrom += originalText.length;
      }

      // Perform the replace via Trix's selection API
      try {
        this.trixEditor.setSelectedRange([idx, idx + originalText.length]);
        this.trixEditor.insertString(replacementText);
      } catch (e) {
        console.error('[RTE v1.1.23] Trix replace failed:', e);
        return { ok: false, error: 'Editor refused the replacement. Try Copy instead.' };
      }

      // Mark dirty so save bar reflects the change
      this.dirty = true;
      this._setDirtyIndicator(true);

      return { ok: true, multiple: totalMatches > 1, totalMatches: totalMatches };
    }

    /* v1.1.23 — show a brief toast inside the assess panel.
       Doesn't conflict with the editor-level toasts since this
       is bottom-anchored inside the panel itself. */
    _showAssessToast(message, kind) {
      if (!this._assessPanel) return;
      // Remove any existing toast
      const stale = this._assessPanel.querySelector('.rte-assess-toast');
      if (stale) stale.remove();
      const toast = document.createElement('div');
      toast.className = 'rte-assess-toast rte-assess-toast-' + (kind || 'info');
      toast.textContent = message;
      this._assessPanel.appendChild(toast);
      requestAnimationFrame(() => { if (toast) toast.classList.add('visible'); });
      setTimeout(() => {
        if (!toast) return;
        toast.classList.remove('visible');
        setTimeout(() => { if (toast && toast.parentNode) toast.remove(); }, 250);
      }, 2600);
    }

    /* v1.1.23 — helper to flip the dirty indicator (existing
       infrastructure assumed). If not present in this version,
       falls back to no-op safely. */
    _setDirtyIndicator(isDirty) {
      try {
        const ind = this.mount && this.mount.querySelector(`#${this.id}-dirty`);
        if (ind) ind.style.display = isDirty ? '' : 'none';
      } catch (e) { /* no-op */ }
    }

    runAssessment() {
      // Move to loading state immediately
      this._assessStage = 'loading';
      this._assessError = null;
      this.renderAssessPanel();

      // Build the article text from the Trix editor's current HTML.
      // Strip Trix attachment wrappers so Claude sees clean prose.
      const articleHtml = this.editorEl
        ? (this.editorEl.editor ? this.editorEl.editor.getDocument().toString() : (this.editorEl.value || ''))
        : '';
      const proxyUrl = (window.TA_CONFIG && window.TA_CONFIG.anthropicProxy) || '';
      if (!proxyUrl) {
        this._assessStage = 'error';
        this._assessError = 'window.TA_CONFIG.anthropicProxy is not configured.';
        this.renderAssessPanel();
        return;
      }

      const systemPrompt = `You are a senior editor at a hyperlocal magazine, reviewing an article body for reprint in an upcoming issue. Your job: identify time-stamped facts, statistics, counts, and other content that has likely become stale since the article was first written, and propose specific drop-in replacement copy.

WHAT TO CHECK:
- Cookbook counts, book counts, album/release counts ("her three cookbooks")
- Follower/subscriber numbers ("over eleven million followers")
- Recent-sounding language ("today", "this year", "currently", "new")
- Awards, titles, positions ("the recently-elected mayor")
- Business statuses (open, closed, acquired, rebranded)
- Time-sensitive references ("last summer", "this April")
- Statistics that update annually (population, rankings)

USE THE web_search TOOL aggressively to verify current facts. Search for the person/business/topic by name and check current numbers.

RULES:
- original_text must be the EXACT verbatim snippet from the article (preserve punctuation, capitalization)
- replacement_text must be production-ready: no [brackets], no <placeholders>, no "(TBD)"
- If you cannot verify the current state with confidence, OMIT the finding — do not guess
- High priority = factual errors that would mislead readers (wrong cookbook count, wrong title)
- Medium priority = staleness that hurts currency ("today" referring to a year ago)
- Low priority = polish opportunities

OUTPUT FORMAT — return your response wrapped in <findings_json> tags with this EXACT structure:

<findings_json>
{
  "summary": "1-2 sentence overall assessment of whether the article can run as-is",
  "findings": [
    {
      "priority": "high",
      "category": "factual",
      "original_text": "...",
      "replacement_text": "...",
      "reasoning": "..."
    }
  ],
  "editorial_questions": [
    "Questions for the human editor to decide (e.g., 'Is the bylined author still affiliated with the org?')"
  ]
}
</findings_json>

If no issues are found, return findings: [] and a summary noting the article can run as-is. Editorial questions can also be empty.`;

      const userMessage = `Please review this article body for reprint.

<article>
${articleHtml}
</article>

<context>
Article originally published: ${this._assessOriginalDate || 'unknown'}
Target reissue date: ${this._assessTargetDate}
</context>`;

      const body = {
        model: ANTHROPIC_MODEL,
        max_tokens: ANTHROPIC_MAX_TOKENS,
        system: systemPrompt,
        tools: [{
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: ANTHROPIC_WEB_SEARCH_MAX_USES
        }],
        messages: [{ role: 'user', content: userMessage }]
      };

      console.log('[RTE v1.1.22] POST to anthropicProxy — assessment starting');
      const t0 = Date.now();

      fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(res => {
          if (!res.ok) {
            return res.text().then(t => {
              throw new Error(`Proxy returned HTTP ${res.status}: ${t.slice(0, 200)}`);
            });
          }
          return res.json();
        })
        .then(data => {
          console.log('[RTE v1.1.22] assessment response received in ' + (Date.now() - t0) + 'ms');
          // If the proxy forwarded an Anthropic error, surface it
          if (data && data.error) {
            throw new Error(`Anthropic API error: ${data.error.message || JSON.stringify(data.error)}`);
          }
          // Extract final text block(s) from Claude's content array.
          // Skip tool_use / web_search_tool_result / etc. — we want the
          // assistant's final assembled text response which contains the
          // <findings_json>...</findings_json> payload.
          const textBlocks = Array.isArray(data.content)
            ? data.content.filter(c => c && c.type === 'text').map(c => c.text || '')
            : [];
          const fullText = textBlocks.join('\n');
          if (!fullText) {
            throw new Error('Claude returned no text content. Raw response logged to console.');
          }
          // Pull the JSON out of the <findings_json> wrapper
          const match = fullText.match(/<findings_json>([\s\S]*?)<\/findings_json>/);
          if (!match) {
            console.warn('[RTE v1.1.22] No <findings_json> wrapper in response. Full text:', fullText);
            throw new Error('Claude did not return findings in the expected format. See console for raw response.');
          }
          let parsed;
          try {
            parsed = JSON.parse(match[1].trim());
          } catch (e) {
            console.warn('[RTE v1.1.22] JSON parse failed. Raw block:', match[1]);
            throw new Error('Findings JSON was malformed. See console for raw response.');
          }
          this._assessResult = parsed;
          this._assessStage = 'results';
          this.renderAssessPanel();
        })
        .catch(err => {
          console.error('[RTE v1.1.22] assessment failed:', err);
          this._assessStage = 'error';
          this._assessError = err && err.message ? err.message : String(err);
          this.renderAssessPanel();
        });
    }

    closeFullscreen() {
      if (!this.cfg.fullscreen) return;
      if (this.dirty) {
        if (!confirm(
          'You have unsaved changes. Close anyway?\n\n' +
          'Note: any images you uploaded inline will remain in your MEDIA library ' +
          '("Ready to Assign") and can be picked later.'
        )) return;
      }
      this.destroy();
      if (this.cfg.onClose) this.cfg.onClose();
    }

    /* ── Destroy ── */
    destroy() {
      if (this._escHandler) {
        document.removeEventListener('keydown', this._escHandler);
        this._escHandler = null;
      }
      // v1.1.19: tear down picker ESC handler if still attached
      if (this._pickerEscHandler) {
        document.removeEventListener('keydown', this._pickerEscHandler, true);
        this._pickerEscHandler = null;
      }
      // v1.1.22: tear down assess panel if still open
      if (this._assessPanel) {
        this.closeAssessPanel();
      }
      // S11: tear down upload modal if open when RTE closes
      this.hideUploadModal();
      // v1.1.18: tear down edit popover if open
      if (this._editPopoverEl) {
        this.closeEditPopover(/*revert=*/false);
      }
      // v1.1.18: remove document-level click-to-edit listener
      if (this._imageEditClickHandler) {
        document.removeEventListener('click', this._imageEditClickHandler, true);
        this._imageEditClickHandler = null;
      }
      if (this._fsOverlay) {
        this._fsOverlay.remove();
        this._fsOverlay = null;
        document.body.style.overflow = '';
      }
      if (this.mount && !this.cfg.fullscreen) {
        this.mount.innerHTML = '';
      }
      this.mount = null;
      this.editorEl = null;
      this.trixEditor = null;
    }

    /* ── Inject scoped styles ── */
    injectStyles() {
      if (document.getElementById('ta-rte-styles')) return;
      const style = document.createElement('style');
      style.id = 'ta-rte-styles';
      style.textContent = `
        /* ── RTE Root ── */
        .rte-root { font-family: 'DM Sans', system-ui, sans-serif; position:relative; }

        /* ── Header ── */
        .rte-header { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
        .rte-header-icon { width:26px; height:26px; background:${TEAL}; border-radius:4px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .rte-header-title { font-size:14px; font-weight:600; color:${TEXT_DARK}; }
        .rte-header-sub { font-size:10px; font-family:'DM Mono',monospace; color:${TEXT_LIGHT}; letter-spacing:0.03em; }
        .rte-article-badge { margin-left:auto; font-size:10px; font-family:'DM Mono',monospace; color:#854F0B; background:rgba(196,163,90,0.12); padding:2px 8px; border-radius:3px; display:inline-flex; align-items:center; }
        .rte-article-badge-link { text-decoration:none; transition:background 0.15s, color 0.15s; cursor:pointer; }
        .rte-article-badge-link:hover { background:rgba(196,163,90,0.25); color:${TEAL}; text-decoration:none; }
        .rte-article-badge-link:focus { outline:2px solid ${GOLD}; outline-offset:1px; }
        .rte-version { font-size:9px; font-family:'DM Mono',monospace; background:${TEAL}; color:${GOLD}; padding:2px 6px; border-radius:3px; }

        /* ── Trix overrides ── */
        trix-toolbar { border:none !important; padding:0 !important; }
        trix-toolbar .trix-button-row { overflow:visible; }
        trix-toolbar .trix-button-group { border:1px solid ${BORDER} !important; border-radius:4px !important; margin-right:6px !important; overflow:hidden; }
        trix-toolbar .trix-button { border:none !important; background:${CREAM} !important; min-width:32px; height:30px; }
        trix-toolbar .trix-button:hover { background:${CREAM_ALT} !important; }
        trix-toolbar .trix-button.trix-active { background:${TEAL} !important; }
        trix-toolbar .trix-button.trix-active::before { filter:invert(1); }

        /* Custom toolbar buttons */
        .rte-custom-btn { font-family:'DM Mono',monospace !important; font-size:11px !important; font-weight:600 !important; color:${TEXT_MID} !important; letter-spacing:0.02em; }
        .rte-custom-btn.trix-active { color:white !important; }
        .rte-toolbar-sep { display:inline-block; width:1px; height:20px; background:${BORDER}; margin:0 4px; vertical-align:middle; }

        /* Image insert button.
           v1.1.3: scoped under trix-toolbar to match the (0,2,1) specificity of
           the 'trix-toolbar .trix-button' reset rule above. Without this scoping,
           that reset's 'background:CREAM !important' was winning on specificity
           even though both rules carry !important — leaving the button face
           cream-toned and the gold-tinted intent invisible. */
        trix-toolbar .rte-img-insert-btn { display:inline-flex !important; align-items:center !important; gap:4px !important; padding:0 10px !important; font-family:'DM Mono',monospace !important; font-size:10px !important; color:#854F0B !important; background:rgba(196,163,90,0.1) !important; border:1px solid ${GOLD} !important; border-radius:4px !important; margin-left:4px !important; height:30px !important; cursor:pointer !important; }
        trix-toolbar .rte-img-insert-btn:hover { background:rgba(196,163,90,0.2) !important; }
        trix-toolbar .rte-img-insert-btn span { pointer-events:none; color:#854F0B !important; }
        trix-toolbar .rte-img-insert-btn svg { pointer-events:none; }

        /* S11: Upload Inline Image button — text button per Jeff preference. Teal-toned to differentiate from gold picker.
           v1.1.3: same specificity fix as picker button. The previous rule had !important on every property
           but lost on specificity to the trix-toolbar .trix-button reset, leaving the button face
           cream-colored and the white text invisible (reported as Image 2 in S11 prep). */
        trix-toolbar .rte-img-upload-btn { display:inline-flex !important; align-items:center !important; gap:4px !important; padding:0 12px !important; font-family:'DM Mono',monospace !important; font-size:10px !important; font-weight:600 !important; color:white !important; background:${TEAL} !important; border:1px solid ${TEAL} !important; border-radius:4px !important; margin-left:4px !important; height:30px !important; cursor:pointer !important; letter-spacing:0.02em; }
        trix-toolbar .rte-img-upload-btn:hover { background:#0f2929 !important; border-color:#0f2929 !important; }
        trix-toolbar .rte-img-upload-btn:disabled { opacity:0.5 !important; cursor:not-allowed !important; }
        trix-toolbar .rte-img-upload-btn span { pointer-events:none; color:white !important; }

        /* S11: Upload modal — fixed overlay above the RTE fullscreen modal (z-index 10001 > 10000) */
        .rte-up-modal-overlay { position:fixed; inset:0; background:rgba(26,58,58,0.55); z-index:10010; display:flex; align-items:center; justify-content:center; padding:20px; }
        .rte-up-modal { background:white; border-radius:8px; box-shadow:0 8px 32px rgba(0,0,0,0.25); width:100%; max-width:440px; overflow:hidden; font-family:'DM Sans',system-ui,sans-serif; }
        .rte-up-modal-header { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; background:${TEAL}; color:white; }
        .rte-up-modal-title { font-family:'DM Mono',monospace; font-size:12px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; }
        .rte-up-modal-close { background:transparent; border:none; color:white; font-size:22px; line-height:1; cursor:pointer; padding:0 4px; opacity:0.8; }
        .rte-up-modal-close:hover { opacity:1; }
        .rte-up-modal-body { padding:18px; }
        .rte-up-preview-wrap { display:flex; gap:14px; align-items:center; padding:12px; background:${CREAM}; border:1px solid ${BORDER}; border-radius:6px; margin-bottom:16px; }
        .rte-up-preview { width:80px; height:80px; object-fit:cover; border-radius:4px; background:white; flex-shrink:0; border:1px solid ${BORDER}; }
        .rte-up-meta { display:flex; flex-direction:column; gap:4px; min-width:0; flex:1; }
        .rte-up-meta-name { font-size:13px; color:${TEXT_DARK}; font-weight:500; word-break:break-all; line-height:1.3; }
        .rte-up-meta-size { font-family:'DM Mono',monospace; font-size:10px; color:${TEXT_MID}; }
        .rte-up-field { margin-top:8px; }
        .rte-up-label { display:block; font-family:'DM Mono',monospace; font-size:10px; font-weight:600; color:${TEXT_DARK}; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:6px; }
        .rte-up-select { width:100%; padding:8px 10px; font-family:'DM Sans',system-ui,sans-serif; font-size:13px; color:${TEXT_DARK}; background:white; border:1px solid ${BORDER}; border-radius:4px; cursor:pointer; }
        .rte-up-select:focus { outline:none; border-color:${TEAL}; box-shadow:0 0 0 2px rgba(26,58,58,0.08); }
        .rte-up-hint { font-size:11px; color:${TEXT_MID}; margin-top:6px; line-height:1.4; }
        .rte-up-modal-footer { display:flex; justify-content:flex-end; gap:8px; padding:12px 18px; background:${CREAM}; border-top:1px solid ${BORDER}; }
        .rte-up-btn { padding:8px 16px; font-family:'DM Mono',monospace; font-size:11px; font-weight:600; letter-spacing:0.03em; border-radius:4px; cursor:pointer; border:1px solid transparent; }
        .rte-up-btn-cancel { background:white; color:${TEXT_MID}; border-color:${BORDER}; }
        .rte-up-btn-cancel:hover { background:${CREAM_ALT}; color:${TEXT_DARK}; }
        .rte-up-btn-go { background:${TEAL}; color:white; }
        .rte-up-btn-go:hover { background:#0f2929; }

        /* S11: Inline upload placeholder — visually de-emphasizes while pipeline runs */
        figure.rte-upload-placeholder { opacity:0.85; }
        figure.rte-upload-placeholder img { background:${CREAM}; }

        /* S11: RTE-local toast — anchored bottom-right, slides up */
        .rte-toast { position:absolute; bottom:64px; right:16px; max-width:380px; padding:10px 14px; font-family:'DM Sans',system-ui,sans-serif; font-size:12px; line-height:1.45; border-radius:5px; box-shadow:0 4px 14px rgba(0,0,0,0.18); opacity:0; transform:translateY(8px); transition:opacity .22s ease, transform .22s ease; z-index:10020; pointer-events:none; }
        .rte-toast-show { opacity:1; transform:translateY(0); }
        .rte-toast-info { background:${CREAM}; border:1px solid ${BORDER}; color:${TEXT_DARK}; }
        .rte-toast-error { background:#fff3f0; border:1px solid #e8b5a8; color:#7a2a1a; }

        /* ── Editor area ── */
        trix-editor.rte-trix-editor { border:1.5px solid ${BORDER} !important; border-radius:0 0 6px 6px !important; min-height:280px !important; padding:16px 20px !important; font-family:'Spectral',Georgia,serif !important; font-size:18px !important; line-height:1.95 !important; color:${TEXT_DARK} !important; background:white !important; }
        trix-editor.rte-trix-editor:focus { border-color:${TEAL} !important; outline:none !important; box-shadow:0 0 0 2px rgba(26,58,58,0.08) !important; }
        trix-editor.rte-trix-editor h1 { font-size:22px; font-weight:700; margin:16px 0 8px; }
        trix-editor.rte-trix-editor h2 { font-family:'Fraunces',Georgia,serif !important; font-size:24px !important; font-weight:600 !important; line-height:1.25 !important; color:#1A3A3A !important; margin:32px 0 12px !important; }
        trix-editor.rte-trix-editor h3 { font-family:'Fraunces',Georgia,serif !important; font-size:22px !important; font-weight:600 !important; line-height:1.3 !important; color:#1A3A3A !important; margin:24px 0 10px !important; }
        trix-editor.rte-trix-editor blockquote { border-left:3px solid ${GOLD}; padding-left:14px; margin:12px 0; color:${TEXT_MID}; font-style:italic; }
        trix-editor.rte-trix-editor figure { margin:16px 0; border-radius:6px; overflow:hidden; border:1px solid ${BORDER}; }
        trix-editor.rte-trix-editor figure img { display:block; max-width:100%; height:auto; }
        trix-editor.rte-trix-editor figcaption { padding:6px 10px; font-size:12px; color:${TEXT_MID}; font-style:italic; background:${CREAM}; }

        /* ── v1.1.5: RTE inserted image — size + alignment system ──
           HC-IMG-001: sizes hardcoded as 33/50/75/100%.
           These rules apply INSIDE the Trix editor (trix-editor scoped).
           The SAME rules (bare .rte-inserted-image selector) must also be
           added to the article/NL render page global head CSS so that
           the saved HTML displays correctly in production.
           See "Saved HTML CSS block" comment below. ── */
        trix-editor.rte-trix-editor figure.rte-inserted-image { display:block; margin:16px auto; border-radius:6px; overflow:hidden; border:1px solid ${BORDER}; }
        trix-editor.rte-trix-editor figure.rte-inserted-image img { display:block; width:100% !important; height:auto !important; max-width:100%; }
        trix-editor.rte-trix-editor figure.rte-inserted-image figcaption { padding:6px 10px; font-size:12px; color:${TEXT_MID}; font-style:italic; background:${CREAM}; text-align:center; }

        /* Size variants — control the figure's max-width */
        trix-editor.rte-trix-editor figure.rte-inserted-image[data-img-size="small"]  { max-width:33%; }
        trix-editor.rte-trix-editor figure.rte-inserted-image[data-img-size="medium"] { max-width:50%; }
        trix-editor.rte-trix-editor figure.rte-inserted-image[data-img-size="large"]  { max-width:75%; }
        trix-editor.rte-trix-editor figure.rte-inserted-image[data-img-size="full"]   { max-width:100%; }

        /* Alignment — margin-based float (block alignment, not float) */
        trix-editor.rte-trix-editor figure.rte-inserted-image[data-img-align="left"]   { margin-left:0; margin-right:auto; }
        trix-editor.rte-trix-editor figure.rte-inserted-image[data-img-align="center"] { margin-left:auto; margin-right:auto; }
        trix-editor.rte-trix-editor figure.rte-inserted-image[data-img-align="right"]  { margin-left:auto; margin-right:0; }

        /* ── Saved HTML CSS block ──
           The following rules (without the trix-editor scope) MUST be added to
           the global head CSS on article render pages (and any page that outputs
           article html-content). Copy this block verbatim:

           figure.rte-inserted-image { display:block; margin:16px auto; border-radius:6px; overflow:hidden; }
           figure.rte-inserted-image img { display:block; width:100% !important; height:auto !important; max-width:100%; }
           figure.rte-inserted-image figcaption { padding:6px 10px; font-size:12px; font-style:italic; text-align:center; }
           figure.rte-inserted-image[data-img-size="small"]  { max-width:33%; }
           figure.rte-inserted-image[data-img-size="medium"] { max-width:50%; }
           figure.rte-inserted-image[data-img-size="large"]  { max-width:75%; }
           figure.rte-inserted-image[data-img-size="full"]   { max-width:100%; }
           figure.rte-inserted-image[data-img-align="left"]   { margin-left:0; margin-right:auto; }
           figure.rte-inserted-image[data-img-align="center"] { margin-left:auto; margin-right:auto; }
           figure.rte-inserted-image[data-img-align="right"]  { margin-left:auto; margin-right:0; }
        ── */

        /* ── v1.1.5: Size + align strip controls ── */
        .rte-picker-format-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:6px; width:100%; }
        .rte-img-size-strip { display:inline-flex; border:1px solid ${BORDER}; border-radius:4px; overflow:hidden; }
        .rte-img-size-strip--modal { border-radius:4px; overflow:hidden; display:flex; }
        .rte-img-size-btn { padding:4px 10px; font-family:'DM Mono',monospace; font-size:9px; font-weight:600; color:${TEXT_MID}; background:white; border:none; border-right:1px solid ${BORDER}; cursor:pointer; transition:background 0.12s,color 0.12s; white-space:nowrap; }
        .rte-img-size-btn:last-child { border-right:none; }
        .rte-img-size-btn:hover { background:${CREAM_ALT}; color:${TEXT_DARK}; }
        .rte-img-size-btn.active { background:${TEAL}; color:white; }
        .rte-img-size-strip--modal .rte-img-size-btn { flex:1; padding:6px 8px; font-size:9px; }
        .rte-img-align-strip { display:inline-flex; border:1px solid ${BORDER}; border-radius:4px; overflow:hidden; }
        .rte-img-align-btn { width:30px; padding:4px 0; font-size:9px; color:${TEXT_MID}; background:white; border:none; border-right:1px solid ${BORDER}; cursor:pointer; transition:background 0.12s,color 0.12s; text-align:center; }
        .rte-img-align-btn:last-child { border-right:none; }
        .rte-img-align-btn:hover { background:${CREAM_ALT}; }
        .rte-img-align-btn.active { background:${TEAL}; color:white; }

        /* ── v1.1.18: Click-to-Edit Popover ──
           Popover lives in document.body (escapes editor scroll).
           NO rules that affect editor figure/img layout — those are
           untouched from v1.1.15. ── */
        .rte-img-edit-popover {
          position: fixed; z-index: 10000;
          min-width: 280px; max-width: 360px;
          background: white;
          border: 1px solid ${BORDER};
          border-radius: 6px;
          box-shadow: 0 6px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08);
          padding: 12px 12px 10px;
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .rte-img-edit-note {
          font-size: 10px; font-family: 'DM Mono', monospace;
          color: ${TEXT_MID};
          background: ${CREAM_ALT};
          padding: 6px 8px;
          border-radius: 3px;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .rte-img-edit-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .rte-img-edit-row.is-disabled { opacity: 0.35; pointer-events: none; }
        .rte-img-edit-label {
          flex-shrink: 0; min-width: 64px;
          font-size: 10px; font-family: 'DM Mono', monospace; font-weight: 600;
          color: ${TEXT_MID}; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .rte-img-edit-strip {
          display: inline-flex;
          border: 1.5px solid ${BORDER};
          border-radius: 4px;
          overflow: hidden;
          transition: border-color 0.12s;
        }
        .rte-img-edit-strip.is-dirty { border-color: ${GOLD}; }
        .rte-img-edit-actions {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 8px; margin-top: 8px;
          border-top: 0.5px solid ${BORDER};
          gap: 8px;
        }
        .rte-img-edit-cancel {
          font-size: 10px; font-family: 'DM Mono', monospace;
          color: #c0392b; text-decoration: none;
          padding: 4px 6px; border-radius: 3px;
          transition: background 0.12s;
        }
        .rte-img-edit-cancel:hover { background: rgba(192,57,43,0.08); }
        .rte-img-edit-action-buttons { display: flex; gap: 6px; }
        .rte-img-edit-action-buttons .ix-btn { padding: 6px 12px; font-size: 10px; }
        .rte-img-edit-apply[disabled] { opacity: 0.4; cursor: not-allowed; }

        /* ── v1.1.18: Subtle hover hint on Trix attachments so users
              discover click-to-edit. Outline only — no layout change. ── */
        trix-editor.rte-trix-editor figure[data-trix-attachment] {
          cursor: pointer;
          transition: outline-color 0.12s;
          outline: 1.5px solid transparent;
          outline-offset: 2px;
        }
        trix-editor.rte-trix-editor figure[data-trix-attachment]:hover {
          outline-color: ${GOLD};
        }

        /* ── v1.1.18: Hide Trix's native attachment toolbar (the X
              button etc.) — our popover provides Remove/Replace, and
              the native toolbar competes visually with it. Targeted
              display:none, no layout impact on the figure/img. ── */
        trix-editor.rte-trix-editor figure[data-trix-attachment] .attachment__toolbar {
          display: none !important;
        }

        /* ── Status bar ── */
        .rte-status-bar { display:flex; align-items:center; justify-content:space-between; padding:5px 10px; border:1px solid ${BORDER}; border-top:none; border-radius:0 0 6px 6px; background:${CREAM}; }
        .rte-char-count { font-size:10px; font-family:'DM Mono',monospace; color:${TEXT_TINY}; }

        /* ── Save row ── */
        .rte-save-row { display:flex; align-items:center; justify-content:space-between; margin-top:10px; }
        .rte-save-right { display:flex; align-items:center; gap:10px; }
        .rte-dirty-indicator { font-size:9px; font-family:'DM Mono',monospace; color:${GOLD}; }
        .rte-btn { font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.04em; padding:6px 14px; border-radius:4px; border:none; cursor:pointer; transition:all 0.15s; }
        .rte-btn-cancel { background:transparent; color:#c0392b; border:0.5px solid ${BORDER}; }
        .rte-btn-cancel:hover { background:rgba(192,57,43,0.06); }
        .rte-btn-save { background:${GOLD}; color:white; }
        .rte-btn-save:hover { opacity:0.9; }

        /* ── Picker panel ── */
        .rte-picker-panel { border:1.5px solid ${GOLD}; border-radius:6px; margin-top:10px; overflow:hidden; }
        .rte-picker-header { display:flex; align-items:center; gap:8px; padding:8px 12px; background:rgba(196,163,90,0.08); border-bottom:0.5px solid ${BORDER}; }
        .rte-picker-title { font-size:12px; font-weight:600; color:#854F0B; }
        .rte-picker-count { font-size:9px; font-family:'DM Mono',monospace; color:#854F0B; flex:1; }
        .rte-picker-close { font-size:10px; font-family:'DM Mono',monospace; color:#854F0B; background:none; border:none; cursor:pointer; }
        .rte-picker-close:hover { opacity:0.7; }
        .rte-picker-empty { padding:20px; text-align:center; font-size:12px; color:${TEXT_LIGHT}; }

        /* Picker grid */
        .rte-picker-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(80px, 1fr)); gap:4px; padding:8px; }
        .rte-picker-section-label { font-size:9px; font-family:'DM Mono',monospace; font-weight:600; color:${TEXT_LIGHT}; text-transform:uppercase; letter-spacing:0.06em; padding:8px 12px 0; }
        .rte-picker-section-label + .rte-picker-grid { padding-top:4px; }
        .rte-picker-item { border:1px solid ${BORDER}; border-radius:4px; overflow:hidden; cursor:pointer; transition:border-color 0.15s; background:white; }
        .rte-picker-item:hover { border-color:${GOLD}; }
        .rte-picker-item.selected { border-color:${GOLD}; border-width:2px; }
        .rte-picker-thumb { width:100%; height:50px; background:${CREAM}; display:flex; align-items:center; justify-content:center; font-size:8px; font-family:'DM Mono',monospace; color:${TEXT_TINY}; overflow:hidden; }
        .rte-picker-info { padding:4px 6px; }
        .rte-picker-name { font-size:10px; font-weight:600; color:${TEXT_DARK}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .rte-picker-meta { font-size:8px; font-family:'DM Mono',monospace; color:${TEXT_TINY}; display:flex; align-items:center; gap:4px; margin-top:2px; }
        .rte-picker-role { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }
        .rte-picker-status { font-size:7px; font-family:'DM Mono',monospace; padding:1px 4px; border-radius:2px; text-transform:uppercase; flex-shrink:0; }
        .rte-picker-status-available { background:rgba(15,157,88,0.1); color:#0F9D58; }
        .rte-picker-status-attached  { background:rgba(196,163,90,0.15); color:#854F0B; }
        .rte-picker-status-archived  { background:rgba(120,120,120,0.12); color:#6a6a6a; }
        .rte-picker-status-unknown   { background:rgba(120,120,120,0.08); color:${TEXT_LIGHT}; }

        /* Picker actions */
        .rte-picker-actions { display:flex; align-items:center; gap:8px; padding:8px 12px; border-top:0.5px solid ${BORDER}; background:${CREAM}; flex-wrap:wrap; }
        .rte-picker-caption-wrap { display:flex; align-items:center; gap:4px; flex:1; min-width:180px; }
        .rte-picker-size-label { font-size:9px; font-family:'DM Mono',monospace; color:${TEXT_LIGHT}; }
        .rte-picker-caption-input { font-size:10px; font-family:'DM Sans',system-ui,sans-serif; border:1px solid ${BORDER}; border-radius:3px; padding:3px 8px; flex:1; color:${TEXT_DARK}; outline:none; }
        .rte-picker-caption-input:focus { border-color:${TEAL}; }
        .rte-picker-spacer { flex:1; }
        .rte-picker-insert-btn { font-size:10px; font-family:'DM Mono',monospace; padding:5px 14px; border-radius:4px; background:${TEAL}; color:${CREAM}; border:none; cursor:pointer; white-space:nowrap; }
        .rte-picker-insert-btn:hover { opacity:0.9; }
        .rte-picker-insert-btn:disabled { opacity:0.4; cursor:not-allowed; }

        /* ── Fullscreen overlay ── */
        .rte-fs-overlay { position:fixed; inset:0; background:rgba(26,58,58,0.7); z-index:10000; display:flex; align-items:flex-start; justify-content:center; padding:24px; overflow-y:auto; }
        .rte-fs-panel { background:white; border-radius:8px; width:100%; max-width:960px; max-height:calc(100vh - 48px); display:flex; flex-direction:column; overflow:hidden; }
        .rte-fs-mount { padding:0 20px 20px; overflow-y:auto; flex:1; }
        .rte-fs-mount .rte-root { max-width:none; }
        .rte-fs-mount trix-editor.rte-trix-editor { min-height:50vh !important; }
        .rte-fs-mount .rte-header { position:sticky; top:0; background:white; z-index:20; padding:16px 0 10px; border-bottom:1px solid ${BORDER}; margin-bottom:0; }
        .rte-fs-mount trix-toolbar { position:sticky; top:76px; background:white; z-index:19; padding:6px 0; border-bottom:1px solid ${BORDER}; margin-bottom:8px; }
        /* v1.1.19: Fullscreen-mode picker becomes a true full-screen modal.
           Replaces the previous bottom-sheet (50vh) layout. 16px margin
           around the modal so the editor scrim shows through at the edges
           (per Q4: "modal padding with editor visible at the edges").

           Structure (column flex):
             .rte-picker-panel (modal frame, full-bleed minus margin)
              ├ .rte-picker-header   (flex-shrink:0)
              ├ .rte-picker-body     (flex:1, overflow-y:auto — the scroll surface)
              └ .rte-picker-bottom-bar (flex-shrink:0, sticky at bottom via flex)

           Override order: base .rte-picker-panel rules apply first,
           then these fullscreen-scoped rules override. */
        .rte-fs-mount .rte-picker-panel {
          position:fixed; top:16px; right:16px; bottom:16px; left:16px;
          z-index:10010;
          margin:0;
          border:1.5px solid ${GOLD};
          border-radius:8px;
          background:white;
          box-shadow:0 8px 32px rgba(0,0,0,0.18);
          display:flex;
          flex-direction:column;
          overflow:hidden;
          max-height:none;
        }

        .rte-fs-mount .rte-picker-header {
          flex-shrink:0;
          padding:12px 18px;
          gap:14px;
        }
        .rte-fs-mount .rte-picker-title { font-size:14px; }

        /* Search input lives in the header in fullscreen mode */
        .rte-picker-search-wrap { flex:1; max-width:320px; }
        .rte-picker-search {
          width:100%; box-sizing:border-box;
          padding:6px 10px;
          font-size:12px; font-family:'DM Sans',system-ui,sans-serif;
          border:1px solid ${BORDER}; border-radius:4px;
          outline:none; background:white;
          color:${TEXT_DARK};
          transition:border-color 0.12s;
        }
        .rte-picker-search:focus { border-color:${GOLD}; }
        .rte-picker-search::placeholder { color:${TEXT_TINY}; }

        /* Close X — circle button, replaces the "close" text link in fullscreen mode.
           The text-link close (.rte-picker-close) stays in inline mode. */
        .rte-picker-close-x {
          width:26px; height:26px;
          border-radius:50%;
          border:1px solid ${BORDER};
          background:white;
          cursor:pointer;
          font-size:16px; line-height:1;
          color:${TEXT_LIGHT};
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
          transition:border-color 0.12s, color 0.12s;
          padding:0;
        }
        .rte-picker-close-x:hover { border-color:#c0392b; color:#c0392b; }

        /* Body — scroll surface. flex:1 takes all space between header and bottom bar. */
        .rte-picker-body {
          flex:1;
          overflow-y:auto;
          padding:14px 18px 18px;
          background:white;
        }

        /* Bigger thumbs in fullscreen mode — 80px tall vs 50px inline.
           Grid uses auto-fit for responsive column count. */
        .rte-fs-mount .rte-picker-grid {
          grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));
          gap:10px;
          padding:4px 0 12px;
        }
        .rte-fs-mount .rte-picker-thumb { height:80px; font-size:9px; }
        .rte-fs-mount .rte-picker-name { font-size:11px; }
        .rte-fs-mount .rte-picker-meta { font-size:9px; }

        /* Sticky bottom bar (Option B): Cancel | Caption | Size | Align | Save.
           flex-shrink:0 keeps it from collapsing; body above scrolls. */
        .rte-picker-bottom-bar {
          flex-shrink:0;
          display:flex; align-items:center; gap:10px;
          padding:12px 18px;
          background:${CREAM};
          border-top:0.5px solid ${BORDER};
          flex-wrap:wrap;
        }
        .rte-picker-bottom-bar .rte-picker-caption-wrap {
          flex:1; min-width:160px;
        }
        /* CRITICAL: override the legacy .rte-picker-format-row rule which sets
           width:100% + margin-top:6px + flex-wrap:wrap — those defaults are
           for the inline-mode actions panel, not the bottom bar. Without these
           overrides, the format-row consumes 100% of the row, the Save button
           is pushed off the right edge into overflow:hidden, and the size/align
           label spacing is broken. */
        .rte-picker-bottom-bar .rte-picker-format-row {
          display:flex; align-items:center; gap:8px;
          flex-shrink:0;
          width:auto;
          margin:0;
          flex-wrap:nowrap;
        }
        .rte-picker-bottom-bar .rte-picker-size-label {
          flex-shrink:0;
          white-space:nowrap;
        }
        .rte-picker-bottom-bar .rte-img-size-strip,
        .rte-picker-bottom-bar .rte-img-align-strip {
          flex-shrink:0;
        }
        .rte-picker-bottom-bar .rte-picker-caption-input {
          flex:1; min-width:0;
        }
        .rte-picker-cancel-btn {
          padding:7px 14px;
          font-size:11px; font-family:'DM Mono',monospace;
          background:transparent; color:${TEXT_MID};
          border:1px solid ${BORDER}; border-radius:4px;
          cursor:pointer;
          flex-shrink:0;
          transition:background 0.12s,color 0.12s;
        }
        .rte-picker-cancel-btn:hover { background:${CREAM_ALT}; color:${TEXT_DARK}; }
        .rte-picker-save-btn {
          padding:7px 18px;
          font-size:11px; font-family:'DM Mono',monospace;
          font-weight:600;
          background:${TEAL}; color:white;
          border:none; border-radius:4px;
          cursor:pointer;
          flex-shrink:0;
          white-space:nowrap;
          transition:opacity 0.12s, background 0.12s;
        }
        .rte-picker-save-btn:hover:not(:disabled) { opacity:0.9; }
        .rte-picker-save-btn:disabled {
          background:${BORDER}; color:${TEXT_LIGHT};
          cursor:not-allowed;
        }

        /* Fullscreen mode: the legacy single-row .rte-picker-actions is
           NOT rendered (we use .rte-picker-bottom-bar instead). The legacy
           inline .rte-picker-close text-link is also not rendered in
           fullscreen (we use .rte-picker-close-x instead). */
        .rte-fs-mount .rte-picker-actions { display:none; }
        .rte-fs-mount .rte-picker-close { display:none; }
        .rte-fs-mount .rte-save-row { position:sticky; bottom:0; background:white; z-index:18; padding-top:10px; border-top:1px solid ${BORDER}; margin-top:10px; }
        .rte-fs-mount .rte-close-btn { width:28px; height:28px; border-radius:50%; border:1.5px solid ${BORDER}; background:white; cursor:pointer; font-size:14px; color:${TEXT_LIGHT}; display:flex; align-items:center; justify-content:center; transition:all 0.15s; flex-shrink:0; margin-left:8px; }
        .rte-fs-mount .rte-close-btn:hover { border-color:#c0392b; color:#c0392b; }

        /* ── v1.1.22 (TD-178): Assess Content button + side panel ── */
        .rte-assess-btn {
          display:inline-flex; align-items:center;
          padding:5px 12px;
          font-size:10px; font-family:'DM Mono',monospace;
          font-weight:600;
          background:rgba(196,163,90,0.12);
          color:#854F0B;
          border:1px solid ${GOLD};
          border-radius:4px;
          cursor:pointer;
          white-space:nowrap;
          transition:background 0.12s, border-color 0.12s;
          margin-left:8px;
        }
        .rte-assess-btn:hover {
          background:rgba(196,163,90,0.22);
          border-color:#854F0B;
        }

        .rte-assess-panel {
          position:fixed;
          top:0; right:0; bottom:0;
          width:480px; max-width:90vw;
          background:white;
          border-left:1.5px solid ${GOLD};
          box-shadow:-8px 0 32px rgba(0,0,0,0.18);
          z-index:10025;
          display:flex; flex-direction:column;
          transform:translateX(100%);
          transition:transform 0.22s ease;
          font-family:'DM Sans',system-ui,sans-serif;
          color:${TEXT_DARK};
        }
        .rte-assess-panel.visible { transform:translateX(0); }

        .rte-assess-header {
          flex-shrink:0;
          display:flex; align-items:center;
          justify-content:space-between;
          padding:14px 18px;
          background:rgba(196,163,90,0.08);
          border-bottom:0.5px solid ${BORDER};
        }
        .rte-assess-title {
          font-size:14px; font-weight:600;
          color:#854F0B;
        }
        .rte-assess-close-x {
          width:26px; height:26px;
          border-radius:50%;
          border:1px solid ${BORDER};
          background:white;
          cursor:pointer;
          font-size:16px; line-height:1;
          color:${TEXT_LIGHT};
          display:flex; align-items:center; justify-content:center;
          padding:0;
          transition:border-color 0.12s, color 0.12s;
        }
        .rte-assess-close-x:hover { border-color:#c0392b; color:#c0392b; }

        .rte-assess-body {
          flex:1; overflow-y:auto;
          padding:16px 18px;
        }

        /* Preflight panel */
        .rte-assess-preflight { display:flex; flex-direction:column; gap:14px; }
        .rte-assess-blurb {
          font-size:12px; color:${TEXT_MID};
          line-height:1.5; margin:0;
        }
        .rte-assess-field {
          display:flex; flex-direction:column; gap:4px;
        }
        .rte-assess-field-label {
          font-size:11px; font-weight:600;
          color:${TEXT_DARK};
        }
        .rte-assess-required { color:#c0392b; }
        .rte-assess-optional { color:${TEXT_LIGHT}; font-weight:400; }
        .rte-assess-field-hint {
          font-size:10px; color:${TEXT_LIGHT};
          font-style:italic;
        }
        .rte-assess-input {
          padding:7px 10px;
          font-size:12px; font-family:'DM Sans',sans-serif;
          color:${TEXT_DARK};
          border:1px solid ${BORDER}; border-radius:4px;
          outline:none;
          transition:border-color 0.12s;
        }
        .rte-assess-input:focus { border-color:${GOLD}; }

        .rte-assess-preflight-actions,
        .rte-assess-error-actions {
          display:flex; gap:8px; justify-content:flex-end;
          margin-top:6px;
        }
        .rte-assess-cancel-btn {
          padding:7px 14px;
          font-size:11px; font-family:'DM Mono',monospace;
          background:transparent; color:${TEXT_MID};
          border:1px solid ${BORDER}; border-radius:4px;
          cursor:pointer;
        }
        .rte-assess-cancel-btn:hover { background:${CREAM_ALT}; color:${TEXT_DARK}; }
        .rte-assess-run-btn {
          padding:7px 14px;
          font-size:11px; font-family:'DM Mono',monospace; font-weight:600;
          background:${TEAL}; color:white;
          border:none; border-radius:4px;
          cursor:pointer;
        }
        .rte-assess-run-btn:hover { opacity:0.9; }

        /* Loading state */
        .rte-assess-loading {
          display:flex; flex-direction:column; align-items:center;
          gap:14px; padding:40px 20px; text-align:center;
        }
        .rte-assess-spinner {
          width:36px; height:36px;
          border:3px solid ${BORDER};
          border-top-color:${GOLD};
          border-radius:50%;
          animation:rte-assess-spin 0.8s linear infinite;
        }
        @keyframes rte-assess-spin { to { transform:rotate(360deg); } }
        .rte-assess-loading-text {
          font-size:14px; font-weight:600; color:${TEXT_DARK};
        }
        .rte-assess-loading-sub {
          font-size:11px; color:${TEXT_LIGHT};
          max-width:280px; line-height:1.5;
        }

        /* Error state */
        .rte-assess-error {
          padding:16px;
          background:rgba(192,57,43,0.06);
          border:1px solid rgba(192,57,43,0.25);
          border-radius:6px;
          display:flex; flex-direction:column; gap:10px;
        }
        .rte-assess-error-title {
          font-size:13px; font-weight:600; color:#c0392b;
        }
        .rte-assess-error-msg {
          font-size:11px; color:${TEXT_DARK};
          font-family:'DM Mono',monospace;
          word-break:break-word;
          line-height:1.5;
        }

        /* Results state */
        .rte-assess-section-label {
          font-size:9px; font-family:'DM Mono',monospace; font-weight:600;
          color:${TEXT_LIGHT}; text-transform:uppercase; letter-spacing:0.08em;
          margin:14px 0 8px;
        }
        .rte-assess-section-label:first-child { margin-top:0; }
        .rte-assess-summary p {
          font-size:13px; color:${TEXT_DARK};
          line-height:1.55; margin:0;
        }
        .rte-assess-no-findings {
          padding:16px;
          background:rgba(15,157,88,0.06);
          border:1px solid rgba(15,157,88,0.25);
          border-radius:6px;
          font-size:12px; color:#0F6E40;
          line-height:1.5;
        }

        /* Finding card */
        .rte-assess-finding {
          margin-bottom:12px; padding:12px;
          border:1px solid ${BORDER}; border-radius:6px;
          background:white;
        }
        .rte-assess-finding-high { border-left:3px solid #c0392b; }
        .rte-assess-finding-medium { border-left:3px solid ${GOLD}; }
        .rte-assess-finding-low { border-left:3px solid ${BORDER}; }

        .rte-assess-finding-pills {
          display:flex; gap:6px; margin-bottom:10px;
        }
        .rte-assess-pill {
          font-size:8px; font-family:'DM Mono',monospace; font-weight:600;
          padding:2px 6px; border-radius:3px; text-transform:uppercase;
          letter-spacing:0.04em;
        }
        .rte-assess-pill-high { background:rgba(192,57,43,0.12); color:#c0392b; }
        .rte-assess-pill-medium { background:rgba(196,163,90,0.18); color:#854F0B; }
        .rte-assess-pill-low { background:rgba(120,120,120,0.12); color:${TEXT_LIGHT}; }
        .rte-assess-pill-category { background:rgba(26,58,58,0.08); color:${TEAL}; }

        .rte-assess-finding-block { margin-bottom:10px; }
        .rte-assess-finding-block-label {
          font-size:9px; font-family:'DM Mono',monospace; font-weight:600;
          color:${TEXT_LIGHT}; text-transform:uppercase; letter-spacing:0.06em;
          margin-bottom:4px;
          display:flex; align-items:center; justify-content:space-between;
          gap:8px;
        }
        .rte-assess-finding-original {
          font-size:12px; color:${TEXT_DARK};
          padding:8px 10px;
          background:${CREAM};
          border-left:2px solid ${TEXT_LIGHT};
          border-radius:0 4px 4px 0;
          line-height:1.5;
          font-style:italic;
          word-break:break-word;
        }
        .rte-assess-finding-replacement {
          font-size:12px; color:${TEXT_DARK};
          padding:8px 10px;
          background:rgba(15,157,88,0.05);
          border-left:2px solid #0F9D58;
          border-radius:0 4px 4px 0;
          line-height:1.5;
          word-break:break-word;
        }
        /* v1.1.23: Action bar replaces inline copy-btn. Houses the
           primary Replace button + a small ghost copy-link fallback. */
        .rte-assess-finding-actions {
          display:flex; align-items:center; gap:8px;
          margin-top:8px;
        }
        .rte-assess-replace-btn {
          display:inline-flex; align-items:center;
          padding:6px 12px;
          font-size:10px; font-family:'DM Mono',monospace; font-weight:600;
          background:${TEAL}; color:white;
          border:none; border-radius:4px;
          cursor:pointer;
          letter-spacing:0.03em;
          transition:opacity 0.12s, background 0.12s;
        }
        .rte-assess-replace-btn:hover:not(:disabled) { opacity:0.88; }
        .rte-assess-replace-btn:disabled {
          background:rgba(15,157,88,0.18); color:#0F6E40;
          cursor:default;
        }
        .rte-assess-replace-btn-done {
          background:rgba(15,157,88,0.18) !important;
          color:#0F6E40 !important;
        }
        .rte-assess-copy-link {
          display:inline-flex; align-items:center; gap:4px;
          padding:5px 8px;
          font-size:9px; font-family:'DM Mono',monospace; font-weight:500;
          background:transparent; color:${TEXT_MID};
          border:1px solid ${BORDER}; border-radius:3px;
          cursor:pointer;
          letter-spacing:0.03em;
          transition:background 0.12s, color 0.12s, border-color 0.12s;
        }
        .rte-assess-copy-link:hover {
          background:${CREAM_ALT}; color:${TEXT_DARK};
          border-color:${TEXT_LIGHT};
        }

        /* Toast inside the assess panel (bottom-anchored) */
        .rte-assess-toast {
          position:absolute;
          bottom:18px; left:18px; right:18px;
          padding:10px 14px;
          background:${TEAL}; color:white;
          border-radius:4px;
          font-size:11px; font-family:'DM Sans',sans-serif;
          line-height:1.4;
          box-shadow:0 4px 14px rgba(0,0,0,0.18);
          opacity:0; transform:translateY(10px);
          transition:opacity 0.18s, transform 0.18s;
          pointer-events:none;
          z-index:5;
        }
        .rte-assess-toast.visible { opacity:1; transform:translateY(0); }
        .rte-assess-toast-success { background:#0F9D58; }
        .rte-assess-toast-error { background:#c0392b; }

        .rte-assess-finding-reasoning {
          font-size:11px; color:${TEXT_MID};
          line-height:1.5; margin-top:8px;
          padding-top:8px;
          border-top:0.5px solid ${BORDER};
        }

        .rte-assess-questions {
          margin:0; padding-left:20px;
        }
        .rte-assess-questions li {
          font-size:12px; color:${TEXT_DARK};
          line-height:1.5; margin-bottom:6px;
        }

        .rte-assess-results-footer {
          margin-top:18px; padding-top:14px;
          border-top:0.5px solid ${BORDER};
          display:flex; justify-content:center;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /* ── Public API ── */
  window.InbxRTE = {
    version: VERSION,
    init: function (config) {
      const instance = new InbxRTE(config);
      instance.init();
      return instance;
    },
    openFullscreen: function (config) {
      return this.init(Object.assign({}, config, { fullscreen: true }));
    },
    InbxRTE: InbxRTE,
  };

  console.log(`[RTE] ta-rte v${VERSION} loaded`);
})();
