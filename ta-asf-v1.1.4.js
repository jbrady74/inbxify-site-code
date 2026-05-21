/* ============================================================
   ta-asf-v1.1.4.js
   INBXIFY TA Studio — ASF (Asset Submission Form) · Article variant
   Fullscreen overlay route invoked via window.InbxASF.open({ articleId, ... })

   Companion stylesheet: ta-asf-v1.1.4.css
   Reference spec:       v1.1 ASF layout — Chunk 4 of 4 (FINAL)

   ────────────────────────────────────────────────────────────
   v1.1.4 — CHUNK 4 · Main + OG side-by-side · legacy prune (FINAL)
     Closes out the ASF v2 layout rebuild. Two deliverables:

     A) Main + OG side-by-side
        Replaces the legacy renderRow03() (full-width main image
        zone + inline images palette + full-width OG preview)
        with a compact 50/50 grid sitting in the main column,
        above the body editor. Each zone is its own card:

          Main image zone (left half):
            - Empty state: 📷 icon + "Click to attach main image"
              affordance. Clicking opens the existing MEDIA
              picker via attach-main-from-media action.
            - Attached state: thumbnail (4:3 letterboxed) +
              name caption + small action buttons:
                · Preview full (lightbox via preview-main-image)
                · Replace (re-opens picker via replace-main-image)
                · Use as OG (one-click copy via set-og-from-main)
            - Alt text input below thumbnail (required for RTP
              t1 main-image-alt). Same data-asf-field contract;
              dirty styling applies as on any other input.
            - Upload + Generate buttons retained as secondary
              affordances (upload-main / generate-main actions).

          OG zone (right half):
            - Social-share preview card showing how Facebook /
              LinkedIn / Slack will render the share: image on
              top, title + teaser + site URL stacked beneath.
            - Source caption ("dedicated OG image" / "main image
              fallback" / "none") so the publisher knows which
              image is actually serving the social share.
            - "Use main image" button (set-og-from-main) appears
              when main exists and OG doesn't have its own image.
            - No separate OG-picker for v1.1.4. Dedicated OG
              images come in a later pass; current contract is
              "OG falls back to main" which covers 95% of cases.

        Layout: .asf-mainog-grid is a 1fr / 1fr CSS grid with
        16px gap. Below ~720px main-column width the grid
        collapses to a single column (responsive).

     B) Legacy prune
        Removes the dead-code renderers preserved through
        Chunks 1–3 for diff-readability. File drops from ~5500
        to ~4600 lines. Functions deleted:

          renderTopbar               (replaced by renderContextBar)
          renderTitleBar             (folded into renderTitleHeadline)
          renderReadinessTile        (status → S8 status line)
          renderAssignmentTile       (newsletter → S2 sidebar)
          renderRTPPanel             (RTP panel obsolete; tally
                                      lives in S8 status line)
          renderRTPItem              (")
          renderRTPImagePips         (")
          renderPip                  (")
          renderRow01                (newsletter moved to S2)
          renderRowHeader            (no row headers in new layout)
          renderReadonlyInput        (unused after Row 01 removal)
          renderRow02                (identity fields moved to main
                                      column + sidebar)
          renderMetaSection          (")
          renderSectionIdentity      (")
          renderSectionPositioning   (")
          renderSectionNarrative     (")
          renderSectionPeople        (")
          renderSectionRefs          (")
          renderComingSoonOverlay    (article type segmented control
                                      handles photo-essay/video gating
                                      now; overlay obsolete)
          renderRow03                (replaced by renderMainOgZones)
          renderMainImageZone        (replaced by compact main zone)
          renderInlineImagesZone     (inline images go through the
                                      Trix picker in Chunk 3 now)
          renderOgBlock              (replaced by compact OG zone)
          renderRow04                (body extracted into
                                      renderMainBody/Legacy; the
                                      rest moved to sidebar)
          renderTechDrawer           (tech-drawer surface removed
                                      from new layout)
          renderFooter               (replaced by renderActionBar)

        Also removed:
          • edit-section case in onDelegatedClick (no edit-section
            trigger exists anywhere in v1.1.4 — sidebar uses
            cancel-section only)
          • All references to the deleted renderers' selectors
            in refresh helpers (already guarded behind qs returns
            in v1.1.0–v1.1.3, so removal is a clean prune)

     Preserved verbatim:
       • renderMainBodyLegacy() — still the EDIT-mode body path
         (inline Trix is create-mode only until HC-15 ships).
       • All field-render primitives (renderField, renderTextarea,
         renderSwitch, renderUnlockedRef, renderLockedRef).
       • All Chunk 1–3 layout + body editor + picker logic.
       • Picker modal (S.picker, renderPicker, ref-picker flow)
         used by main-image / OG / customer / product / ad
         pickers — untouched.

     ASF v1.1.x is now COMPLETE. Track A next: TD-187 (ASF Ad
     variant) per Studio-Master-Roadmap §12 sequence.

   v1.1.3 — CHUNK 3 · Inline image picker (sidebar swap state)
     Wires the "Insert inline image" toolbar button (stub since
     v1.1.1) to an actual picker. When the button fires, the
     right sidebar swaps from sections mode (S1–S8) to picker
     mode: full-height MEDIA library grouped by bundle, with
     Available (default) / Attached tabs.

     What ships in Chunk 3:

       • State addition — S.inlinePicker = {
             open:             false,
             tab:              'available',   // | 'attached'
             expandedBundles:  {},            // bundleId → true
             search:           ''
         }

       • Sidebar dispatcher — renderSide() now branches on
         S.inlinePicker.open:
           true  → renderInlinePicker()  (full sidebar swap)
           false → existing S1–S8 sections render
         The shell itself is unchanged; only the inner content
         of .asf-side flips. Visual continuity preserved.

       • renderInlinePicker() — three regions:
           1. Header: title "Insert inline image" + ✕ close
           2. Tab strip: Available (count) · Attached (count)
              + small search input (filters across all bundles
              in the active tab by media name + filename)
           3. Body: bundle list, each bundle a collapsible
              folder (▼/▶) with a thumbnail grid inside.
              Items with no bundleId → "Loose tray" section
              at the bottom, same expand/collapse mechanic.
              Empty state when filter has no hits.

       • Filter logic:
           - mediaType === 'image' only (text MEDIA never inline)
           - status = TA_CONFIG.optionIds.mediaStatus.available
             on Available tab; .attached on Attached tab
           - Free-text search matches name + originalFilename
             (case-insensitive substring)

       • Bundle grouping — reads all MEDIA from DOM (not just
         the article-scoped subset hydrateMedia returns). New
         helper hydrateAllMedia() walks every
         .media-wrapper[data-item] without article filter and
         pulls bundleId + bundleLabel.

       • Image insertion via insertImageIntoBody() — uses the
         Trix Attachment API when window.Trix.Attachment is
         present (canonical), falls back to editor.insertHTML
         when only the custom element is registered. After
         insert, the picker closes (sidebar returns to
         sections) so the publisher sees the image in context.

       • New action handlers wired into onDelegatedClick:
           open-inline-image-picker  → open + render
                                       (was a toast in v1.1.2)
           close-inline-picker       → close + render
           picker-set-tab            → switch tab + render
           picker-toggle-bundle      → expand/collapse one
                                       bundle, no full re-render
           picker-insert-image       → insertImageIntoBody +
                                       close picker

       • CSS additions in companion stylesheet:
           .asf-side.asf-side--picker  (different padding)
           .asf-picker-header (top bar)
           .asf-picker-tabs / .asf-picker-tab (+ .on)
           .asf-picker-search
           .asf-picker-bundles (scroll container)
           .asf-picker-bundle  (+ .collapsed)
           .asf-picker-bundle-head (clickable folder label)
           .asf-picker-thumbs (4-up grid)
           .asf-picker-thumb (+ :hover for inserting affordance)
           .asf-picker-empty (no-results state)
           .asf-picker-loose-divider

     Preserved verbatim:
       • All Chunk 1 + Chunk 2 layout, Trix loader, body editor
         logic — picker is additive only.
       • Existing .asf-pick-host modal (Main Image / OG image /
         Customer / Product / Ad pickers) remains its own surface
         and is unaffected. Picker swap is exclusively the inline-
         image-into-body flow.

     Known limitations:
       • Picker only meaningful in create mode (where Trix is
         inline). In edit mode the popout body editor doesn't
         consume the picker — clicking the Insert button is
         essentially a no-op there. Wired anyway for forward
         consistency; Chunk 4 + edit-mode-inline-Trix pass
         clean this up.
       • Image insertion uses Trix's attachment model; the
         saved HTML includes data-trix-attachment metadata.
         Webflow's rich-text rendering should preserve the
         resulting <figure><img> structure; if Webflow strips
         data-* attributes the image still renders, just
         without Trix-side editability after reload.

   v1.1.2 — Trix hot-fix: force-load Trix from CDN
     Symptom (v1.1.1 in live test): ASF detected
     window.Trix === undefined at render() time and fell back to
     the legacy popout button. Cause: ta-rte v1.1.24 loads Trix
     LAZILY — only when InbxRTE.openFullscreen() is called. The
     library isn't on the page at ASF open time even though the
     Transcriber "requires" it.

     Fix: ASF now loads Trix itself from CDN on first open. Two
     deltas:

       1. ensureTrixLoaded(callback) — checks for Trix via BOTH
          window.Trix AND customElements.get('trix-editor')
          (the custom element may register without exposing the
          global, depending on how the bundle is built). If
          neither is present, injects two tags into <head>:
            • <link> for trix.css (CDN-pinned to a known good
              version so the body editor styling stays stable)
            • <script> for trix.umd.min.js
          The script's onload re-invokes render() if ASF is still
          open, so the popout-button placeholder swaps live to the
          inline Trix editor without the user clicking anything.

       2. renderMainBody() now treats a not-yet-loaded Trix as a
          transient state, not a permanent fallback. It STILL
          renders the popout fallback during the brief load
          window so the form isn't broken — but it also fires
          ensureTrixLoaded() so the next render() flips to inline.

     Standing comment discipline (locked from this version forward):
     EVERY file ships with a fully-updated header reflecting:
       • current filename in the first comment line
       • current version on the VERSION constant
       • full v1.x.y changelog above the previous changelog,
         not just a delta entry sitting under a stale banner.
     Applies to JS and CSS equally. No "appended sections under
     v1.0.x banner" — the banner is the current version.

   v1.1.1 — CHUNK 2 · Inline body editor for create mode
     Replaces the legacy "Edit body" popout button in CREATE mode
     with an inline Trix editor sitting in the main column at the
     Transcriber Review & Edit position. Body content is editable
     in place — no font/styling discontinuity, no separate window.

     What ships in Chunk 2:
       • renderMainBody() — split path:
           CREATE mode → inline Trix editor with toolbar
                       + bodyComplete inline N/A toggle next to
                         the "Body" label
                       + "Insert inline image" toolbar button
                         (Chunk 3 wires to picker; Chunk 2 stubs
                         with a toast)
                       + 20,000-char visible-text cap (matches
                         Transcriber)
           EDIT mode  → unchanged. Legacy popout button via
                       launchBodyEditor() → Scenario G → page reload.
                       Inline Trix in edit mode would need a new
                       saveAsf endpoint (HC-15) wired to Scenario G,
                       which is out of Chunk 2 scope. Edit-mode
                       inline RTE comes in a later phase.
       • Trix lifecycle:
           - Mount created on render via initInlineTrix() (called
             from a post-render hook after S.overlay innerHTML
             is set).
           - Initial content seeded from S.article.bodyHtml on
             every render (incl. prefill.bodyHtml via applyPrefill).
           - trix-change event → updates BOTH S.article.bodyHtml
             AND S.dirtyFields.bodyHtml.
           - On render() teardown, the previous trix-editor
             element is replaced by innerHTML; the new instance
             initializes fresh from the hidden input's value.
             Cursor position is lost only when render() is
             triggered by a non-body action (sidebar toggle,
             segmented control, newsletter pick). Body editing
             itself does NOT trigger render() — only
             refreshFooter / refreshSectionHeads — so typing
             stays uninterrupted.
       • Insert inline image stub:
           Toolbar button labeled "Insert inline image" with
           data-asf-action="open-inline-image-picker". For
           Chunk 2 it shows a toast: "Picker comes in Chunk 3."
           Chunk 3 replaces the toast with the sidebar swap.

     Preserved verbatim:
       • Legacy launchBodyEditor() — still used by edit mode +
         retained for any caller that still triggers
         data-asf-action="launch-body-editor".
       • All v1.0.17 prefill / dirty / picker / save plumbing.
       • All v1.1.0 layout shell + sidebar logic.

   v1.1.0 — MAJOR · ASF v2 layout rebuild (Chunk 1 of 4)
     Foundation chunk. Replaces the multi-row vertical-stack layout
     with a two-column shell (75% main / 25% sidebar) and the
     Transcriber Review & Edit field order in the main column.

     What ships in Chunk 1:
       • Thin context bar at top (T-A name · ✕). Replaces the
         prominent v1.0.x topbar + title-bar + RTP panel.
       • Two-column .asf-shell grid (75% main / 25% sidebar).
       • Main column — Transcriber-order fields:
           T3   Title — in-place big-font headline (28px DM Sans
                bold), gold underline when dirty. No separate
                label/input box; the headline IS the editor.
           T4   Sub-title (with subtle inline N/A toggle next to label)
           T5   Writer name + Writer title (2-col row)
           T6   Co-writer name + Co-writer title (2-col row)
           T7   Teaser (400 char, counter)
           T8   Short summary (150 char, counter)
           T2   Source-screenshots strip — CONDITIONAL: rendered
                only when caller passes params.sourceImages
                (typically from Transcriber). Otherwise omitted.
                Lets the operator cross-reference parse against
                originals.
           MI/OG  Main + OG image zones — TEMPORARILY using legacy
                  renderRow03 surfaces; Chunk 4 replaces with
                  side-by-side 50/50.
           T9 (legacy) Body — TEMPORARILY keeps the v1.0.x
                "Edit Body" popout button; Chunk 2 replaces with
                inline RTE.
           T10  Issues banner — only rendered on validation
                failure (placeholder for v1.2 validation pass).
           T11  Action bar — Cancel + Save Draft.
       • Sidebar — S1–S8 in Jeff-locked order:
           S1   Article type (Std / Photo / Video segmented)
           S2   Scheduling — tentative newsletter, revenue type
           S3   Credits beyond writers — photographer, show
                photo credits switch
           S4   CTA & banner — banner statement (with inline N/A),
                button label, CTA text, CTA URL
           S5   References — customer / product / ad pickers
                (using existing renderUnlockedRef primitive)
           S6   Identifiers — print issue source
           S7   Video / audio URLs
           S8   Status — "Draft · X/Y ready" line
         Each section gets a per-section "Revert" link that
         appears only when the section is dirty, identical
         contract to v1.0.x cancel-section (reuses
         data-asf-action="cancel-section" + data-asf-section-id
         so the existing delegated handler + revertSection()
         work without code changes).
       • Subtle inline N/A toggles — small DM Mono pill with
         empty/filled box, placed next to the field's label
         (subtitle, banner statement). Uses existing
         data-asf-switch contract so handleSwitch() handles
         the toggle without new event wiring.

     Preserved verbatim from v1.0.17 (no behavior changes):
       • applyPrefill() + TD-186 prefill contract
       • Dirty tracking (S.dirtyFields, S.originalValues)
       • snapshotOriginals() with new mainFields awareness
       • All Chunk C delegated event handlers
       • commitSaveDraft / commitCreateArticle → Scenario 104
       • All field-render primitives (renderField, renderTextarea,
         renderSwitch, renderUnlockedRef, renderLockedRef)
       • Picker plumbing (S.picker, renderPicker, ref-picker flow)
       • Public API (open / close / isOpen / version)
       • Hydration (hydrateArticle, hydrateMedia)
       • restoreFromSession path

     Removed from the rendered tree (functions kept as dead code
     for now; pruned in Chunk 4 after layout stabilizes):
       • renderTopbar (replaced by renderContextBar)
       • renderTitleBar (folded into renderTitleHeadline)
       • renderRTPPanel + renderRTPItem + renderRTPImagePips + renderPip
         (status line in S8 supersedes; RTP machinery still used by
         computeRTP for the "X/Y ready" tally)
       • renderRow01 (newsletter moved to sidebar S2)
       • renderRow02 + renderMetaSection + renderSectionIdentity /
         Positioning / Narrative / People / Refs (replaced by flat
         main-column + sidebar sections)
       • renderFooter (replaced by renderActionBar)
       • renderRow04 non-body parts (body kept; rest moved to sidebar)

     What's STILL CALLED from v1.0.x for Chunk 1:
       • renderRow03 (media zones, called from main column above body)
       • renderRow04's body block (extracted into renderBodyButton)
       • All renderField/Textarea/Switch primitives

     Remaining chunks:
       Chunk 2 — inline body editor (replaces popout button + RTE
                 mount; "Insert inline image" toolbar action)
       Chunk 3 — inline image picker (sidebar swap state)
       Chunk 4 — main + OG side-by-side (replaces legacy Row 03);
                 prune dead renderers

   v1.0.17 — TD-186 prep: create-mode prefill support
     Enables window.InbxASF.open({ mode:'create', prefill: {...} }) so
     external creation surfaces (Transcriber, Bundles cascade, Generator,
     Upload) can launch ASF with parsed/derived field values already
     populated. NO AI in this path — the caller decides which fields to
     populate; missing fields stay blank.

     Public-API change:
       publicOpen() now accepts an optional `prefill` object on create
       mode. Keys correspond to blankArticle field names (name, subtitle,
       bannerStatement, teaser, shortSummary, bodyHtml, writerName,
       writerTitle, cowriterName, cowriterTitle, photographer, plus any
       other property of S.article). Each non-null value is written to
       BOTH S.article[k] (so the body editor and other downstream readers
       see it) AND S.dirtyFields[k] = { from:'', to:value } (so it counts
       as a pending change for save payload + visual dirty styling +
       cancel-section revert).

       Prefill is applied AFTER snapshotOriginals(), so the originals
       snapshot captures the blank state — Cancel-section / Revert returns
       a prefilled field to '', not to the prefilled value. This matches
       the principle that prefill is "pre-typed by a tool" rather than
       "the canonical record state".

       Unknown keys (not in blankArticle) still land in S.article + dirty
       but are dropped silently at createAsset payload time, since that
       payload uses an explicit field list. No-op, no error.

     Internal-renderer change:
       renderField / renderTextarea / renderSwitch now apply the `.dirty`
       class at initial render when the field's name is present in
       S.dirtyFields. Previously `.dirty` was added only by Chunk C input
       handlers — fine when dirtyFields started empty, broken once create
       mode could open with pre-populated dirty fields from prefill.
       Edit-mode behavior unchanged (dirtyFields starts empty there too).

     Caller contract for Transcriber (TD-186 wiring, ta-page-body):
       window.InbxASF.open({
         mode: 'create',
         prefill: {
           name:          parsedTitle      || '',  // empty string OK
           subtitle:      parsedSubtitle   || '',
           teaser:        parsedTeaser     || '',
           shortSummary:  parsedShort      || '',
           bodyHtml:      parsedBodyHtml   || '',
           writerName:    parsedWriter     || '',
           writerTitle:   parsedWriterRole || '',
           cowriterName:  parsedCoWriter   || '',
           cowriterTitle: parsedCoWriterRole || ''
         }
       });
       Pass empty string (or omit the key) for unidentified fields. Do
       not invent values — leaving a field blank lets the publisher fill
       it manually in ASF.

   v1.0.16 — createAsset payload: 5 more fields
     Added to fields object: photoEssay, videoArticle, videoUrl,
     audioUrl, searchType. Reading semantics:
       • photoEssay / videoArticle — booleans, switches in the form.
         curVal() reads dirtyFields first (if user toggled), falls
         back to S.article (initialized false in blankArticle).
       • videoUrl / audioUrl — strings, text inputs. Same pattern.
       • searchType — NEW field, not in blankArticle. Read via curVal
         with empty-string fallback so the key always appears in the
         payload. If/when a UI control is wired to write this, no
         further payload change needed — curVal already handles the
         dirtyFields path.
     bodyStatus was already added in v1.0.15 — re-listed in Jeff's
     request for confirmation, not duplicated here.

   v1.0.15 — Body editing enabled in create mode (paired with Studio v1.4.0)
     • Edit Body button re-enabled in create mode. No longer shows the
       "Save draft first to enable body editor" disabled state.
     • launchBodyEditor() branches on S.mode:
         - 'create' → calls window.InbxStudioBodyEditor with new
           mode:'local' contract. Editor skips Scenario G entirely —
           caller provides initialBody, receives final HTML via onSave
           callback, ASF writes it to S.article.bodyHtml and re-renders.
           No page reload (which would wipe the in-progress create form).
         - 'edit' / default → existing edit-mode flow unchanged (fetch
           body via Scenario G, save via Scenario G, reload page on save).
     • createAsset payload now includes bodyHtml (the editor's local
       output) and bodyStatus (derived: 'Edited' if there's body content,
       'Empty' otherwise). Scenario 104 should map these onto Webflow's
       post-body / post-body-html / body-status fields when creating the
       Articles record.
     • Studio dependency bumped: requires ta-studio v1.4.0+ for create-
       mode body editing. Older Studio (v1.3.9 or below) means the
       Edit Body button still works in EDIT mode, but in CREATE mode
       falls back to an error toast because mode:'local' wasn't yet
       supported.

   v1.0.14 — Create payload: include CMS refs + fix create-mode ref picker
     1. createAsset payload now includes the CMS reference fields
        (customerId/Name, productId/Name, mnlsId/Name, newsletterId/Name,
        revenueType). Previously only content fields and switches were
        sent, so any ref the user picked in the form was silently
        dropped when the article was created.
     2. fireUpdateRef() now short-circuits in create mode — instead of
        POSTing updateArticleRef to Scenario G (which would fail because
        there's no article record yet), it just writes the picked ref
        to S.article locally. The ref travels out with the createAsset
        payload on first save, where Scenario 104 writes it onto the
        Webflow record at creation time.

   v1.0.13 — Create flow moved off Scenario G → Scenario 104 (Create Assets)
     • Scenario G reverted to its pre-ASF state. The createArticle
       route I tried to graft onto it was scrapped — too much friction
       layering create logic into a scenario already loaded with
       read-write routes.
     • New endpoint: Scenario 104 "Create Assets" — its own dedicated
       webhook for all four creation flows (Article today; Ad / RE
       Listing / Event later). Webhook URL stored in TA_CONFIG.
     • Tenant config: added CFG.tenant.makeCreateAssets() getter
       reading window.TA_CONFIG.makeCreateAssets. No fallback — if
       missing, ASF surfaces "endpoint not configured" toast.
     • Payload generalized so the same scenario handles all four
       asset types:
         action:     'createAsset'   (was 'createArticle')
         assetType:  'article'       (new — selects Make router branch)
         titleSlug, taItemId, source, fields:{...}  (unchanged)
     • Response contract generalized too:
         { ok: true, assetType: 'article', itemId: '<new id>' }
       ASF reads `itemId` now (was `articleItemId`). When Ad/RE/Event
       creation ships, the same response shape applies — only assetType
       differs.
     • commitCreateArticle() function name kept (only article create is
       wired today). Will rename to commitCreateAsset() when Ad/RE/Event
       flows arrive.

   v1.0.12 — Create-mode bugfix triple
     1. "Title required" false-positive in create-mode Save Draft.
        handleFieldEdit() writes user input to S.dirtyFields[name].to,
        NOT S.article.name. commitCreateArticle was reading S.article
        directly so it always saw the empty initial value. Fixed by
        introducing curVal(k) helper that reads dirtyFields first,
        falls back to S.article. Also: on successful create, dirty
        values are now copied to S.article BEFORE dirtyFields is
        cleared, so the user's typed values persist into edit mode.
     2. Edit body button in create mode now properly disabled with
        an inline message: "Body editor enabled after first Save
        draft." The body editor needs an article record to write to,
        which doesn't exist yet in create mode. Once the article is
        created (first save), it flips to edit mode and the button
        becomes active.
     3. CMS-ref picker clicks not registering. CSS regression — the
        rule .asf-meta-section.readonly .asf-input has pointer-events:
        none for the readonly styling, which was blocking clicks on
        the clickable ref inputs (Major NL Section, Newsletter,
        Customer, Product Library). Fix lives in companion CSS v1.0.12:
        override pointer-events:auto for .asf-input.readonly.clickable.

   v1.0.11 — Drop per-section edit gating; all sections always editable
     • Removed the "Edit Identity / Edit Positioning / Edit Narrative /
       Edit People" buttons from each meta section. Was friction
       without enough benefit — most operators open ASF to edit, not
       browse, so forcing a per-section click-to-enter-edit was wrong
       default.
     • renderMetaSection() no longer drives a readonly class from
       S.editingSection. Instead it reads S.mode:
         'edit' | 'create' → sections render in edit form (open fields,
                              switches active, textareas live)
         'readonly'        → sections render readonly (future — used by
                              the upcoming hyperlink-to-readonly view)
     • Create mode: all sections immediately editable on open (was
       already in edit mode in 1.0.10 but only because no Edit buttons
       had been clicked — now explicit + permanent).
     • renderSectionNarrative() updated to read S.mode instead of
       S.editingSection for its readonly check.
     • "Revert changes" link kept per section. Now shows only when
       that section has dirty fields. (Previously shown when section
       was in edit mode regardless of dirty state.)
     • S.editingSection state retained but no longer read by render —
       left for potential per-section UX additions later (e.g., a
       "focused editing" expanded view). Setting/clearing it is a
       no-op for rendering as of v1.0.11.

   v1.0.10 — Create mode (de novo article creation)
     • open({ mode: 'create' }) — new entry path that skips DOM
       hydration entirely. State starts blank except for T-A and
       Title which are pre-populated from window.TA_CONFIG
       (titleAdminId/titleAdminName + titleId/titleName).
     • S.mode added to state ('edit' | 'create'). Default 'edit'
       preserves existing behavior for all open({articleId:...}) calls.
     • Header shows "New Article" placeholder until the user types a
       title; once typed, the header reflects what they wrote. A
       small CREATE-MODE badge sits next to the title to distinguish
       this from edit-mode opens at a glance.
     • Save Draft in create mode posts to Scenario G with
       action: 'createArticle'. On {ok:true, articleItemId: '<new>'}
       response, ASF flips S.mode → 'edit' and S.article.id is set,
       so subsequent saves use the normal updateArticle path.
     • Until the createArticle Make route exists, save is gated
       behind a placeholder — payload logged to console, toast
       surfaces "createArticle route needed" message.
     • Publish & Slot is disabled in create mode (can't slot what
       doesn't have a Webflow record yet).
     • Close-with-dirty-state confirm dialog works the same way it
       does in edit mode — if the user typed anything and tries to
       close without saving, they're warned.

   v1.0.5 — Narrative readonly auto-size + edit-mode height alignment
     • renderTextarea() now accepts `readonly` flag. In readonly mode,
       renders content as `<div class="asf-textarea-readout">` (auto-
       sizes to content, no scrollbar, no clip, no resize handle, no
       char counter). In edit mode, renders the standard textarea with
       a higher min-height so 400-char content fits without scroll.
     • renderSectionNarrative() detects editing state via
       S.editingSection === 'narrative' and threads it down to both
       textareas + uses the new .asf-fgrid-2-skew grid class for a
       2/3 + 1/3 width split (teaser wider, short summary narrower,
       proportional to their 400 vs 150 char limits).
     • No payload changes. No new endpoints. No behavior change to
       save/publish/attach flows.

   v1.0.4 — Picker + Attach + Upload + Ref-edit (the "all 7")
     1. Picker modal — generic `.asf-pick-*` overlay, mounted as a
        sibling above .asf-overlay (z-index +500). Supports two kinds:
          • media — filter by customer/product, search by name,
            cards with thumbnail/name/sub-info, click to select
          • ref   — flat list, search by name, single-column rows
        Backdrop click + Esc-aware close. Single in-flight guard so
        the user can't double-fire.
     2. Attach from MEDIA — wired for main image, interior image,
        and OG image. Posts attachComponent to Scenario G via
        window.TA_CONFIG.makeStudio. Optimistic local update on
        success (item.status='Attached'); re-hydrates after.
     3. Upload — Uploadcare browser-direct upload using
        TA_CONFIG.uploadcarePublicKey. On success, notifies Scenario B
        (makeConditioner) with the UUID + context, expecting it to
        create the MEDIA row and (autoAttach:true) attach to article.
        NOTE: requires a new Scenario B route 'createMediaFromBrowserUpload'.
        Until built, payload is logged + error toast surfaced.
     4. Generate (AI image) — kept as toast placeholder ("ships when
        endpoint decided"). Wired button, no flow.
     5. Replace / Remove main image — replace re-opens picker;
        remove not yet wired (needs detach UI affordance — left as
        a follow-up since the destructive action wasn't pressing).
     6. Insert / Replace / View inline images — insert is direct
        attach (mediaId known); replace re-opens picker; view opens
        the image URL in a new tab.
     7. CMS-ref pickers (TD-178) — the 4 unlocked refs (Major NL
        Section, Newsletter, Customer, Product Library) become
        clickable inputs. Click opens ref picker, posts
        updateArticleRef to Scenario G. NOTE: requires a new Scenario G
        route 'updateArticleRef'. Until built, payload logged + error
        toast.

     Make.com routes that need to exist (in increasing priority order):
       • Scenario G route: attachComponent     — likely exists already
         (Studio v1.3.7 uses it). Verify works for ASF source.
       • Scenario G route: detachComponent    — for Remove/Replace
       • Scenario G route: updateArticleRef   — new, for TD-178
       • Scenario B route: createMediaFromBrowserUpload — new, for #3

     Tenant config consumed (read at call time from window.TA_CONFIG):
       • makeStudio              (Scenario G webhook URL)
       • makeConditioner         (Scenario B webhook URL)
       • uploadcarePublicKey     (browser upload auth)
       • uploadcareBase          (CDN host)
       • titleSlug, taItemId     (route context)
       • optionIds.componentRole (role hash for attach payload)

   v1.0.3 — Character limits + label cleanup
     • CFG.limits values (confirmed by Jeff against Webflow CMS spec
       and Studio v1.3.7 contract):
         title:           60   (was 120 — fabricated)
         subtitle:        60   (was 160 — fabricated)
         bannerStatement: 30   (was 100 — fabricated)
         teaser:         400   (was 280 — corrected to match Studio)
         shortSummary:   150   (was 320 — corrected to match Studio)
     • Removed counters entirely on mainImageAlt / ctaButton /
       ctaText (matches Studio v1.3.7 which doesn't enforce limits
       on these either).
     • Renamed ASF field labels to match Webflow CMS display names
       exactly (single source of truth for editorial terminology):
         "Teaser"        → "Article Teaser Summary"
         "Short Summary" → "Short Article Summary"
       (Studio's labels are still the legacy "Teaser Summary" /
       "Short Summary" — those should be aligned separately when
       Studio is next touched.)

   v1.0.2 — Compact header redesign
     • Replaced two-row header (topbar with breadcrumb + tall title
       bar with two ~200px tiles) with a leaner two-row layout:
         Row 1: ASF badge + article title (24px serif, single line)
                + sponsor pill + "Editing · unsaved"/"No changes"
                dirty stamp + circular × close button.
         Row 2: two horizontal status bars (Readiness + Newsletter),
                each ~52px tall, click-to-toggle.
     • Total header height: ~280px → ~118px (saves ~162px, 58%).
     • Removed: fictional "Studio / Assembler / Article" breadcrumb,
       "ARTICLE · SUBMISSION FORM" eyebrow, MODE / EDIT toggle pill,
       large Readiness "!"/"✓" badge, vertical NEWSLETTER tile.
     • Added: passive dirty stamp (updates incrementally via
       refreshDirtyStamp on every field/switch/select change so the
       header reflects unsaved state without a full re-render).
     • Added action: `focus-newsletter` — clicking the Newsletter
       status bar smooth-scrolls to Row 01 and focuses the
       tentative-newsletter dropdown. Replaces the deleted tile click.
     • Companion CSS: ta-asf-v1.0.3.css (header rules rebuilt).

   v1.0.1 · CMS References tweaks (post-smoke-test)
   ────────────────────────────────────────────────────────────
     • Renamed "Title (T-A)" label → "Major NL Section" (was bound to
       mnlsName, which is the MNLS, not the T-A title — old label
       misled)
     • Renamed "Category" label → "Product Library" (was bound to
       productName, which IS the product library, not a category)
     • Visually unlocked 4 of 6 ref fields: Major NL Section, Newsletter,
       Customer, Product Library. Removed diamond prefix + lock icon;
       render now uses .asf-input.readonly for visual continuity with
       other readonly fields. Underlying values still display-only —
       the CMS-picker edit affordance ships in Chunk D (TD-178).
     • Article ID + Body Status stay locked (system fields).
     • Refs section head hint updated to reflect mixed lock state.

     TD-178 (Chunk D scope): CMS-picker for the 4 unlocked ref fields.
     Each needs a lookup against the appropriate CMS collection
     (MNLS, Newsletters, Customers, Product Libraries) filtered by
     the active T-A. UI pattern reuses the .cmp-card chrome already
     used by Studio's Assembler picker.

   v1.0.0 · Chunks B + C complete
   ────────────────────────────────────────────────────────────
     INFRASTRUCTURE (Chunk B)
     • IIFE shell + VERSION constant
     • CFG (limits, stubs, segments, RTP items, endpoint placeholders,
       sectionFields map, switchFields map, sessionStorage config)
     • State S (article, media, dirty maps, originals snapshot, etc.)
     • Helpers: esc, qs, qsa, cssBg, log, warn, parseIssueNo, mapStatus,
       hasDirty, toast, snapshotOriginals, fieldsEqual, deriveDirtySections,
       closestEl, isDisabled, findNewsletter, isPlaceholderEndpoint
     • CMS hydration via .articles-wrapper[data-article-id]
       (matches Studio's readArticles() shape 1:1 + sentinels HC-12/13/14)
     • MEDIA hydration via .media-wrapper[data-item]
       (matches ta-components-tab's readMediaItems(), filtered + sorted)
     • RTP computation (T1 Auto / T2 N/A-able / T3 Manual) + summary
     • Overlay mount/unmount — matches InbxRTE.openFullscreen pattern
     • Full render tree (Topbar, TitleBar, RTPPanel, Rows 01–04, Footer)
     • window.InbxASF public API: open / close / isOpen / version

     BEHAVIOR (Chunk C)
     • bindAll() — single delegated click + input + change + keydown
       listener on the overlay root, bound ONCE per mount via the
       listenersBound guard.
     • Action router (handleAction) covering:
         - Nav: nav-studio, nav-assembler (soft-close + toast for now)
         - RTP: toggle-rtp (expand/collapse)
         - Section: edit-section, cancel-section (with per-section revert)
         - Newsletter: cancel-newsletter
         - Body: edit-body / launch-body-editor (Path 2 RTE handoff)
         - Tech drawer: toggle-tech-drawer
         - Save: save-draft, publish (both go through HC-15)
         - Image flows: stubbed with toast → ship in Chunk D
     • Field input handlers:
         - Text/textarea: live dirty toggle + .dirty class + charcount update
         - Select (newsletter): full re-render with dirty bookkeeping
         - Switches (renderSwitch + bodyComplete button): in-place toggle
           with class sync; re-render for RTP-affecting switches
         - Article-type segments: switch + Coming Soon overlay
         - RTP T2 N/A checkboxes: live state update + mirror to article
         - RTP T3 Manual checkboxes: live state update
     • Per-section revert: cancel-section restores fields from
       S.originalValues (snapshotted at open-time) and clears the section
       from dirtyFields.
     • Newsletter revert: cancel-newsletter restores S.originalNewsletterChoice.
     • Save-draft flow:
         - Sparse payload (only dirty fields + RTP state changes)
         - POST to CFG.endpoints.saveAsf (HC-15)
         - Placeholder-guard: dev toast + console.log of payload when unset
         - On success: merge server response → re-snapshot → toast
         - On error: restore button state + error toast
     • Publish-and-slot flow:
         - Validates RTP required-pending == 0
         - Validates newsletterChoice is set
         - Same POST endpoint, distinguished by op="publish-and-slot"
         - On success: toast + auto-close after 1.2s
     • Newsletter list (TD-176 / HC-16):
         - Fired on overlay open; HC-16 placeholder → silent stub fallback
         - When resolved: GET ?titleId=... → { newsletters: [...] }
         - Result merged into S.newsletterList; Row 01 re-renders
     • sessionStorage restore (post-RTE-reload):
         - Edit body → writes asf:returnContext = { articleId, ts }
         - Scenario G → page reload → script re-init → tryRestore() reads
           the key (one-shot, < 90s old) and re-opens the same ASF.
         - Polls for .articles-wrapper readiness (up to 2s) before opening.
     • Toast surface: single-instance .asf-toast with info/success/error
       kinds, auto-dismiss (2.8s / 4.5s).
     • Cmd/Ctrl+S keyboard shortcut → save-draft (when dirty + not in RTE).

     IMAGE FLOWS — INTENTIONALLY DEFERRED (Chunk D)
     The buttons render and route to handleAction, but each image
     action currently toasts "Image flows ship in Chunk D".
     Reason: attach-from-MEDIA needs picker UI (no CSS yet); upload
     needs a Scenario B webhook URL (new HC entry); generate needs
     an Anthropic image-gen endpoint (not built). Splitting Chunk D
     out keeps Chunk C reviewable in one sitting.


   ────────────────────────────────────────────────────────────
   Hardcoded values tracked (HC-NNN)
   ────────────────────────────────────────────────────────────
     HC-12  CMS Switch field: sub-title-na  (declared in CSS, hydrated
            here via sentinel class .article-flag-sub-title-na on
            .articles-wrapper — requires Webflow Designer binding)
     HC-13  CMS Switch field: banner-statement-na (sentinel
            .article-flag-banner-statement-na)
     HC-14  CMS Switch field: body-complete (sentinel
            .article-flag-body-complete)
     HC-15  ASF save endpoint URL — placeholder string until Chunk C
            resolves the Scenario G route. Do NOT call from Chunk B.
     HC-16  Tentative Newsletter list endpoint — placeholder. Stub
            list rendered until TD-176 resolves the source decision
            (live webhook vs synthesized from PubPlan DOM).

   ────────────────────────────────────────────────────────────
   Webflow Designer prerequisites (multi-tenant, no extra hardcoding)
   ────────────────────────────────────────────────────────────
     On the existing .articles-wrapper hidden-collection element,
     three new Conditional Visibility flag divs are required so the
     ASF can read switch state (Webflow Switch fields cannot bind
     to data-attributes — same workaround the Studio uses for
     photo-credits / photo-essay / video-article flags):

       <div class="article-flag-sub-title-na">      (HC-12, when ON)
       <div class="article-flag-banner-statement-na"> (HC-13)
       <div class="article-flag-body-complete">     (HC-14)

     Absence of the div = switch OFF. Identical to Studio's existing
     readArticles() switch-sentinel pattern.
   ============================================================ */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  //  VERSION
  // ═══════════════════════════════════════════════════════════════
  var VERSION = '1.1.4';

  // ═══════════════════════════════════════════════════════════════
  //  CFG — limits, segments, RTP items, stubs, endpoint placeholders
  //
  //  Everything in here is data-driven so the render tree never has
  //  to hardcode a label or limit inline. Multi-tenant rule: nothing
  //  in this object is publisher-specific.
  // ═══════════════════════════════════════════════════════════════
  var CFG = {
    // Field character limits (mirrors v0.3 mockup spec)
    limits: {
      title:            60,  // confirmed v1.0.3
      subtitle:         60,  // confirmed v1.0.3
      bannerStatement:  30,  // confirmed v1.0.3
      teaser:          400,  // confirmed v1.0.3 (matches Studio v1.3.7 line 1653)
      shortSummary:    150   // confirmed v1.0.3 (matches Studio v1.3.7 line 1654)
      // mainImageAlt, ctaButton, ctaText — no counters per Jeff
      // (matches Studio v1.3.7 which doesn't enforce limits on these either)
    },

    // Article Type segmented control
    articleTypes: [
      { id: 'standard',    label: 'Standard Article', soon: false },
      { id: 'photo-essay', label: 'Photo Essay',      soon: true  },
      { id: 'video',       label: 'Video Article',    soon: true  }
    ],

    // Row 02 meta sections (A–E). Order matters — drives render order.
    metaSections: [
      { letter: 'A', id: 'identity',    title: 'Identity',        hint: 'title · subtitle · banner · slug' },
      { letter: 'B', id: 'positioning', title: 'Positioning',     hint: 'product type · revenue · print source' },
      { letter: 'C', id: 'narrative',   title: 'Narrative',       hint: 'teaser · short summary · CTA' },
      { letter: 'D', id: 'people',      title: 'People',          hint: 'writer · co-writer · photographer' },
      { letter: 'E', id: 'refs',        title: 'CMS References',  hint: 'CMS-locked · diamond-marked' }
    ],

    // RTP checklist (Readiness to Publish)
    //   t1 = Auto-checked, REQUIRED for publish
    //   t2 = Auto-checked, can be marked N/A (HC-12/13 use this)
    //   t3 = Manual confirmation by operator
    rtpItems: [
      { id: 'title',          label: 'Title set',                tier: 't1' },
      { id: 'main-image',     label: 'Main image attached',      tier: 't1' },
      { id: 'body-complete',  label: 'Body marked complete',     tier: 't1' },
      { id: 'main-image-alt', label: 'Main image alt text',      tier: 't1' },
      { id: 'og-image',       label: 'OG / social image present', tier: 't1' },
      { id: 'subtitle',       label: 'Subtitle set',             tier: 't2', naField: 'subTitleNA'        /* HC-12 */ },
      { id: 'banner',         label: 'Banner statement set',     tier: 't2', naField: 'bannerStatementNA' /* HC-13 */ },
      { id: 'cta',            label: 'CTA configured',           tier: 't2' },
      { id: 'sponsor-ok',     label: 'Sponsor approval received', tier: 't3' },
      { id: 'edit-pass',      label: 'Editorial review complete', tier: 't3' }
    ],

    // Newsletter Assignment states (display only — actual state derives
    // from S.article.newsletterId presence + S.newsletterChoice).
    assignmentStates: {
      unassigned: { label: 'Unassigned',  className: 'unassigned' },
      tentative:  { label: 'Tentative',   className: 'tentative'  },
      committed:  { label: 'Committed',   className: 'committed'  }
    },

    // TD-176 stub. Chunk C will replace this with a fetch from
    // CFG.endpoints.newsletterList (HC-16). The shape is the contract:
    // { id, label, issueNo, date }.
    newsletterStub: [
      { id: '__none__', label: '— Unassigned —',         issueNo: '',    date: ''      },
      { id: 'stub-106', label: 'Issue 106 · May 19',     issueNo: '106', date: 'May 19' },
      { id: 'stub-107', label: 'Issue 107 · May 26',     issueNo: '107', date: 'May 26' },
      { id: 'stub-108', label: 'Issue 108 · Jun 02',     issueNo: '108', date: 'Jun 02' }
    ],

    // Endpoint placeholders. Do NOT fetch these in Chunk B — they're
    // intentionally non-URLs so a stray call fails loud during dev.
    endpoints: {
      saveAsf:        '__HC15_PLACEHOLDER__', // HC-15
      newsletterList: '__HC16_PLACEHOLDER__'  // HC-16 (TD-176)
    },

    // v1.0.4 — picker + media-attach + upload config.
    //   makeStudio:      Scenario G (attachComponent / detachComponent /
    //                    updateArticleRef). Reads from window.TA_CONFIG
    //                    at runtime — single source of truth.
    //   makeConditioner: Scenario B (upload → MEDIA row). Same lookup.
    //   uploadcareKey:   Browser-direct upload public key.
    //   uploadcareBase:  CDN host for serving uploaded images.
    //
    //   Each is null-checked at call site; if window.TA_CONFIG isn't
    //   defined or the key is missing, the call short-circuits with
    //   a "needs config" toast and a console.log of the payload that
    //   would have been sent.
    tenant: {
      // Lazily read so the same code works in any tenant context.
      cfg: function () { return window.TA_CONFIG || {}; },
      makeStudio:      function () { return this.cfg().makeStudio || null; },
      makeConditioner: function () { return this.cfg().makeConditioner || null; },
      makeCreateAssets:function () { return this.cfg().makeCreateAssets || null; },  // v1.0.13
      uploadcareKey:   function () { return this.cfg().uploadcarePublicKey || null; },
      uploadcareBase:  function () { return this.cfg().uploadcareBase || 'https://uyluucdnr2.ucarecd.net'; },
      titleSlug:       function () { return this.cfg().titleSlug || ''; },
      taItemId:        function () { return this.cfg().taItemId || ''; },
      roleHash:        function (roleKey) {
        var ids = this.cfg().optionIds;
        if (!ids || !ids.componentRole) return null;
        return ids.componentRole[roleKey] || null;
      }
    },

    // Picker role → Webflow CMS componentRole key map. Used to translate
    // the slot the user clicked on into the optionId hash the Make
    // scenario expects.
    pickerRoleMap: {
      'main-image':     'mainImage',
      'interior-image': 'interiorImage',
      'og-image':       'mainImage'   // OG falls back to main-image role
    },

    // CMS-ref picker types. Each maps to a tenant collection in DOM.
    refTypes: {
      mnls:       { label: 'Major NL Section', selector: '.articles-wrapper[data-mnls-id]', extractId: 'mnlsId', extractName: 'mnlsName', dedupe: true },
      newsletter: { label: 'Newsletter',       selector: null /* stub fallback */, extractId: null, extractName: null, dedupe: false },
      customer:   { label: 'Customer',         selector: '.customers-wrapper[data-item]', extractId: 'id', extractName: 'name', dedupe: true },
      product:    { label: 'Product Library',  selector: '.products-wrapper[data-item]',  extractId: 'id', extractName: 'name', dedupe: true }
    },

    // Path 2 RTE handoff. Studio's openBodyEditor reads this and lands
    // the user back on the ASF after Save → reload → restore.
    rteReturnPanel: 'asf',

    // ── Chunk C: section → field map. Used by:
    //    • cancel-section to know which fields to revert
    //    • derived `dirtySections` so section heads can show a dot
    //    • the save payload, which is sliced by section for clarity
    //
    //  Read-only ref values live in their own section but are not in
    //  this map (refs can't be edited via ASF).
    //  Row-level fields (tentativeNewsletter, bodyComplete) live
    //  outside meta-sections; see `rowFields` below.
    // v1.1.0 — sectionFields now maps SIDEBAR section IDs to their
    // fields. Used by deriveDirtySections + revertSection for the
    // per-section Revert link in the sidebar. Main-column fields
    // (title, subtitle, writers, teaser, etc.) do not participate
    // in section-revert — they use the whole-form Cancel only,
    // matching Transcriber Review & Edit semantics.
    //
    // S1 article-type and S5 references and S8 status are NOT
    // present here:
    //   - articleType is not a tracked field in dirtyFields (it's
    //     a render-time toggle, S.articleType)
    //   - references write directly to S.article (not dirtyFields)
    //     so no section-revert applies; the picker has its own
    //     cancel inside the modal
    //   - status is derived display only
    sectionFields: {
      scheduling:  ['tentativeNewsletter', 'revenueType'],
      credits:     ['photographer', 'showPhotoCredits'],
      ctaBanner:   ['bannerStatement', 'bannerStatementNA', 'ctaButton', 'ctaText', 'ctaUrl'],
      identifiers: ['printIssueSource'],
      mediaFlags:  ['videoUrl', 'audioUrl']
    },

    // v1.1.0 — main-column fields, tracked for snapshot/dirty but
    // not grouped under a section-revert. Inline N/A toggles
    // (subTitleNA, bodyComplete) live here next to their parents.
    mainFields: [
      'name', 'subtitle', 'subTitleNA',
      'writerName', 'writerTitle', 'cowriterName', 'cowriterTitle',
      'teaser', 'shortSummary',
      'bodyHtml', 'bodyComplete'
    ],

    // Row-level fields (sit outside the meta-sections grid).
    // v1.1.0: kept for back-compat with snapshotOriginals walk;
    // values are now duplicated under mainFields where applicable.
    rowFields: {
      assignment: ['tentativeNewsletter'],
      body:       ['bodyComplete']
    },

    // Switch-style fields (boolean toggle, not text). Used by the
    // input handler to know not to compare string values.
    switchFields: {
      subTitleNA:         true,
      bannerStatementNA:  true,
      showPhotoCredits:   true,
      bodyComplete:       true,
      photoEssay:         true,
      videoArticle:       true
    },

    // sessionStorage key for post-RTE-reload restore.
    sessionStorageKey:    'asf:returnContext',
    sessionRestoreMaxAge: 90 * 1000   // 90s — guards against stale keys
  };

  // ═══════════════════════════════════════════════════════════════
  //  STATE — single source of truth for the overlay's lifecycle.
  //
  //  All mutations during Chunk C will go through small setters so
  //  re-render is deterministic; for Chunk B we mutate directly inside
  //  open() and the safety-net handlers.
  // ═══════════════════════════════════════════════════════════════
  var S = {
    open:             false,
    mode:             'edit', // v1.0.10: 'edit' | 'create'
    overlay:          null,   // root DOM node (.ta-asf)
    article:          null,   // hydrated article record (readArticles shape)
    media:            [],     // hydrated media items for this article
    articleType:      'standard',
    rtpExpanded:      true,
    rtpNAState:       {},     // { rtpId: true } — T2 N/A toggles (live state)
    rtpManualState:   {},     // { rtpId: true } — T3 manual confirmations
    editingSection:   null,   // 'identity' | 'positioning' | ... | null
    dirtyFields:      {},     // { fieldName: { from, to } } — Revert + save payload
    dirtySections:    {},     // { sectionId: true } — derived from dirtyFields
    newsletterChoice: null,   // { id, label, issueNo, date } when tentative
    bodyEditOpen:     false,  // true while InbxRTE is mounted on top
    saving:           false,
    lastEscHandler:   null,

    // ── Chunk C additions ──
    originalValues:   {},     // snapshot of article fields at open-time (revert source)
    originalNAState:  {},     // snapshot of NA state at open-time
    originalManual:   {},     // snapshot of manual-tier state at open-time
    originalNewsletterChoice: null,  // snapshot for newsletter revert
    techDrawerOpen:   false,
    newsletterList:   null,   // populated by fetchNewsletters (null = not yet fetched)
    toastEl:          null,
    toastTimer:       null,
    listenersBound:   false,  // guard against double-binding on re-render

    // ── v1.0.4: Picker modal state ──
    // Single picker instance, can be in 'media' or 'ref' mode.
    picker: {
      open:           false,
      kind:           null,    // 'media' | 'ref'
      mediaRole:      null,    // 'main-image' | 'interior-image' | 'og-image'
      refType:        null,    // 'mnls' | 'newsletter' | 'customer' | 'product'
      title:          '',      // displayed in picker header
      items:          [],      // currently-loaded items (subject to filter)
      allItems:       [],      // unfiltered set (for re-applying filter)
      selectedId:     null,    // currently-picked item id
      filterCustomer: '',
      filterProduct:  '',
      filterSearch:   '',
      inFlight:       false,   // true while attach is firing
      onConfirm:      null,    // callback (item) after successful attach
      replaceMediaId: null     // when replacing, the old media id to detach
    },

    // v1.0.4: Hidden file input for upload flow. Created lazily on first
    // upload action. Persisted across opens to avoid GC of the listener.
    fileInput:        null
  };

  // ═══════════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════════
  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function qs(root, sel) {
    return (root || document).querySelector(sel);
  }

  function qsa(root, sel) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  // Safe CSS background-image for use inside a style="" attribute.
  // The URL sits inside url('...') inside style="..." — a double-nested
  // string context that naive escaping (e.g. JSON.stringify) breaks
  // because outer attribute and inner CSS both use quote chars.
  // Solution: percent-encode the problem characters.
  function cssBg(url) {
    if (!url) return '';
    var safe = String(url)
      .replace(/&/g, '&amp;')
      .replace(/'/g, '%27')
      .replace(/"/g, '%22')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29');
    return "background-image:url('" + safe + "');";
  }

  function log() {
    if (!window.console || !console.log) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[ASF v' + VERSION + ']');
    console.log.apply(console, args);
  }

  function warn() {
    if (!window.console || !console.warn) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[ASF v' + VERSION + ']');
    console.warn.apply(console, args);
  }

  function parseIssueNo(s) {
    if (!s) return '';
    var m = String(s).match(/(\d+)/);
    return m ? m[1] : '';
  }

  function mapStatus(hash) {
    if (!hash) return 'draft';
    return String(hash).toLowerCase();
  }

  function hasDirty() {
    for (var k in S.dirtyFields) {
      if (Object.prototype.hasOwnProperty.call(S.dirtyFields, k)) return true;
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════════════
  //  HELPERS · Chunk C additions
  //
  //  Toast surface, originals snapshot, dirty derivation, small DOM
  //  utilities for delegated event handling. Kept separate from the
  //  Chunk B helper block above so the diff stays auditable.
  // ═══════════════════════════════════════════════════════════════

  // Single-instance toast. CSS classes from ta-asf-v1.0.0.css:
  //   .asf-toast (.show / .success / .error)
  function toast(msg, kind) {
    if (!S.overlay) return;
    kind = kind || 'info';

    // Reuse the existing toast node if present; otherwise create one.
    if (!S.toastEl || !S.toastEl.parentNode) {
      S.toastEl = document.createElement('div');
      S.toastEl.className = 'asf-toast';
      S.overlay.appendChild(S.toastEl);
    }
    // Reset kind classes
    S.toastEl.className = 'asf-toast' + (kind === 'success' ? ' success' : kind === 'error' ? ' error' : '');
    S.toastEl.textContent = String(msg);

    // Force reflow before adding .show so the transition runs even on
    // back-to-back toasts.
    /* eslint-disable no-unused-expressions */
    S.toastEl.offsetHeight;
    /* eslint-enable no-unused-expressions */
    S.toastEl.classList.add('show');

    if (S.toastTimer) clearTimeout(S.toastTimer);
    S.toastTimer = setTimeout(function () {
      if (S.toastEl) S.toastEl.classList.remove('show');
      S.toastTimer = null;
    }, kind === 'error' ? 4500 : 2800);
  }

  // Snapshot the editable subset of S.article into S.originalValues
  // so cancel-section / cancel-newsletter can revert without a re-hydrate.
  function snapshotOriginals() {
    var a = S.article || {};
    var snap = {};
    var allFields = [];
    var sf = CFG.sectionFields;
    for (var sec in sf) {
      if (!Object.prototype.hasOwnProperty.call(sf, sec)) continue;
      allFields = allFields.concat(sf[sec]);
    }
    // v1.1.0: include main-column fields in the originals snapshot
    // so any field in main (title, subtitle, writers, teaser, etc.)
    // is revertable via close-with-dirty confirm + cancel-newsletter.
    if (CFG.mainFields && CFG.mainFields.length) {
      allFields = allFields.concat(CFG.mainFields);
    }
    allFields = allFields.concat(CFG.rowFields.assignment, CFG.rowFields.body);
    for (var i = 0; i < allFields.length; i++) {
      var k = allFields[i];
      snap[k] = (k in a) ? a[k] : null;
    }
    S.originalValues = snap;

    // RTP NA/Manual originals: NA is sourced from article flags (HC-12, HC-13);
    // for CTA there's no persisted source so we treat false as original.
    S.originalNAState = {
      subtitle: !!a.subTitleNA,
      banner:   !!a.bannerStatementNA,
      cta:      false
    };
    S.originalManual = {};   // manual tier (sponsor-ok, edit-pass) — always false at open
    S.originalNewsletterChoice = null;

    // Seed live rtpNAState from article flags so the RTP panel matches reality.
    S.rtpNAState = {
      subtitle: S.originalNAState.subtitle,
      banner:   S.originalNAState.banner,
      cta:      S.originalNAState.cta
    };
    S.rtpManualState = {};
  }

  // v1.0.17 — TD-186: external creation surfaces (Transcriber, Bundles
  // cascade, Generator, Upload) pre-populate ASF fields via the public
  // open({ mode:'create', prefill: {...} }) API. Each non-null entry is
  // written to BOTH S.article (so curVal() fallback + body editor see
  // it) AND S.dirtyFields (so it counts as a pending change for save
  // payload + dirty styling + cancel-section revert). Caller is the
  // sole source of values — ASF does not invent any data.
  //
  // Recognized prefill keys: every property of blankArticle(). Common
  // Transcriber fields are name, subtitle, teaser, shortSummary,
  // bodyHtml, writerName, writerTitle, cowriterName, cowriterTitle.
  // Unrecognized keys still land in S.article + dirtyFields but are
  // silently dropped at createAsset payload time (explicit field list).
  //
  // Empty-string and null values are treated as "not present" and
  // skipped, so the caller can pass a uniform `{ name: parsed || '' }`
  // shape without producing fake dirty fields for unidentified content.
  function applyPrefill(prefill) {
    if (!prefill || typeof prefill !== 'object') return;
    var count = 0;
    for (var k in prefill) {
      if (!Object.prototype.hasOwnProperty.call(prefill, k)) continue;
      var v = prefill[k];
      // Skip null / undefined / empty string — those represent
      // "unidentified" per the no-AI principle. Boolean false IS a
      // meaningful value (e.g. showPhotoCredits: false), so we keep it.
      if (v == null) continue;
      if (typeof v === 'string' && v === '') continue;
      S.article[k] = v;
      S.dirtyFields[k] = { from: (k in S.originalValues ? S.originalValues[k] : ''), to: v };
      count++;
    }
    deriveDirtySections();
    log('applyPrefill — populated ' + count + ' field(s)', Object.keys(prefill));
  }

  // Loose equality that treats null/undefined/'' as equivalent, so an
  // untouched empty field doesn't get flagged dirty on focus-blur.
  function fieldsEqual(a, b) {
    if (a == null && (b === '' || b == null)) return true;
    if (b == null && (a === '' || a == null)) return true;
    if (typeof a === 'boolean' || typeof b === 'boolean') return !!a === !!b;
    return String(a) === String(b);
  }

  function deriveDirtySections() {
    var out = {};
    var sf = CFG.sectionFields;
    for (var sec in sf) {
      if (!Object.prototype.hasOwnProperty.call(sf, sec)) continue;
      var fields = sf[sec];
      for (var i = 0; i < fields.length; i++) {
        if (S.dirtyFields[fields[i]]) { out[sec] = true; break; }
      }
    }
    S.dirtySections = out;
  }

  // Minimal closest() polyfill wrapper; preferred over IIFE-internal
  // closures so each handler is testable.
  function closestEl(el, sel) {
    while (el && el.nodeType === 1) {
      if (el.matches && el.matches(sel)) return el;
      el = el.parentNode;
    }
    return null;
  }

  function isDisabled(el) {
    return !!(el && (el.disabled || el.getAttribute('aria-disabled') === 'true'));
  }

  // Lookup newsletter stub/list by id.
  function findNewsletter(id) {
    var list = S.newsletterList || CFG.newsletterStub;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  // True when an endpoint is still a placeholder (HC-15 / HC-16 unresolved).
  function isPlaceholderEndpoint(url) {
    return !url || /^__HC\d+_PLACEHOLDER__$/.test(String(url));
  }

  // ═══════════════════════════════════════════════════════════════
  //  CMS HYDRATION — Article
  //
  //  Reads the hidden .articles-wrapper[data-article-id=...] element
  //  rendered by Webflow's Collection List. Shape matches Studio's
  //  readArticles() output exactly (Studio v1.3.7 line 1528+), so
  //  downstream consumers (RTP, save payload, OG preview) can use
  //  identical keys. Three new flag sentinels added for HC-12/13/14.
  // ═══════════════════════════════════════════════════════════════
  function hydrateArticle(articleId) {
    if (!articleId) return null;
    var el = document.querySelector(
      '.articles-wrapper[data-article-id="' + articleId + '"]'
    );
    if (!el) {
      warn('hydrateArticle: no .articles-wrapper found for', articleId);
      return null;
    }
    var d = el.dataset || {};

    // Rich Text body — cannot bind to data-attribute in Webflow, so
    // we read innerHTML from the .article-body-source RTE element.
    var bodyEl = el.querySelector('.article-body-source');
    var bodyHtml = bodyEl ? bodyEl.innerHTML : '';

    // Switch sentinels — Webflow Switch fields can't bind to
    // data-attributes either, so we use Conditional Visibility:
    // presence of the flag div = ON.
    var showPhotoCredits  = !!el.querySelector('.article-flag-photo-credits');
    var photoEssay        = !!el.querySelector('.article-flag-photo-essay');
    var videoArticle      = !!el.querySelector('.article-flag-video-article');
    // ASF-new flags (Webflow Designer must add these):
    var subTitleNA        = !!el.querySelector('.article-flag-sub-title-na');        // HC-12
    var bannerStatementNA = !!el.querySelector('.article-flag-banner-statement-na'); // HC-13
    var bodyComplete      = !!el.querySelector('.article-flag-body-complete');       // HC-14

    return {
      // Identity
      id:               (d.articleId || '').trim(),
      name:             (d.articleTitle || '').trim(),
      slug:             (d.articleSlug || '').trim(),

      // Customer / category / mnls — locked CMS refs
      customerId:       (d.articleCustomerId || '').trim(),
      customerName:     (d.articleCustomerName || '').trim(),
      productId:        (d.categoryId || '').trim(),
      productName:      (d.articleCategory || d.label || '').trim(),
      revenueType:      (d.type || '').trim(),
      mnlsId:           (d.mnlsId || '').trim(),
      mnlsName:         (d.mnlsName || '').trim(),
      newsletterId:     (d.newsletterId || '').trim(),
      newsletterName:   (d.newsletterName || '').trim(),
      newsletterDate:   (d.newsletterDate || '').trim(),

      // Lifecycle
      status:           mapStatus((d.publishStatus || '').trim()),
      bodyStatus:       (d.bodyStatus || '').trim(),
      created:          (d.articleCreated || '').trim(),
      updated:          (d.articleUpdated || '').trim(),

      // Body content
      subtitle:         (d.articleSubtitle || '').trim(),
      bannerStatement:  (d.articleBannerStatement || '').trim(),
      teaser:           (d.articleTeaser || '').trim(),
      shortSummary:     (d.articleShortSummary || '').trim(),
      bodyHtml:         bodyHtml,
      printIssueSource: (d.articlePrintIssueSource || '').trim(),

      // Main image
      mainImageSrc:     (d.articleMainImageSrc || '').trim(),
      mainImageAlt:     (d.articleMainImageAlt || '').trim(),

      // CTA
      ctaButton:        (d.articleCtaButtonText || '').trim(),
      ctaText:          (d.articleCtaText || '').trim(),
      ctaUrl:           (d.articleCtaUrl || '').trim(),

      // Writers
      writerName:       (d.articleWriterName || '').trim(),
      writerTitle:      (d.articleWriterTitle || '').trim(),
      cowriterName:     (d.articleCowriterName || '').trim(),
      cowriterTitle:    (d.articleCowriterTitle || '').trim(),
      writerComposite:  (d.articleWriterComposite || '').trim(),
      cowriterComposite:(d.articleCowriterComposite || '').trim(),

      // Photo / video flags + extras
      showPhotoCredits: showPhotoCredits,
      photographer:     (d.articlePhotographer || '').trim(),
      photoEssay:       photoEssay,
      videoArticle:     videoArticle,
      videoUrl:         (d.articleVideoUrl || '').trim(),
      audioUrl:         (d.articleAudioUrl || '').trim(),

      // ASF-new flags (HC-12 / HC-13 / HC-14)
      subTitleNA:        subTitleNA,
      bannerStatementNA: bannerStatementNA,
      bodyComplete:      bodyComplete
    };
  }

  // ═══════════════════════════════════════════════════════════════
  //  v1.0.10 — Blank article state for CREATE MODE
  //  No DOM hydration. T-A and Title come from window.TA_CONFIG so
  //  the new article is bound to the current page context. Every
  //  other field is empty — the user fills them in.
  //
  //  Note: id is intentionally null. The Webflow CMS record doesn't
  //  exist yet — it's created by Scenario G on first Save Draft.
  // ═══════════════════════════════════════════════════════════════
  function blankArticle() {
    var cfg = window.TA_CONFIG || {};
    return {
      // Identity
      id:               null,                            // ← no record yet
      name:             '',                              // user fills
      slug:             '',

      // T-A and Title — pre-filled from page context
      taItemId:         cfg.taItemId || '',
      titleAdminName:   cfg.titleAdminName || '',
      titleId:          cfg.titleId || '',
      titleName:        cfg.titleName || cfg.titleSlug || '',
      titleSlug:        cfg.titleSlug || '',

      // CMS refs — all blank (user picks via ref picker after create)
      customerId:       '',
      customerName:     '',
      productId:        '',
      productName:      '',
      revenueType:      '',
      mnlsId:           '',
      mnlsName:         '',
      newsletterId:     '',
      newsletterName:   '',
      newsletterDate:   '',

      // Lifecycle
      status:           'Draft',
      bodyStatus:       'Empty',
      created:          '',
      updated:          '',

      // Body content
      subtitle:         '',
      bannerStatement:  '',
      teaser:           '',
      shortSummary:     '',
      bodyHtml:         '',
      printIssueSource: '',

      // Main image
      mainImageSrc:     '',
      mainImageAlt:     '',

      // CTA
      ctaButton:        '',
      ctaText:          '',
      ctaUrl:           '',

      // Writers
      writerName:       '',
      writerTitle:      '',
      cowriterName:     '',
      cowriterTitle:    '',
      writerComposite:  '',
      cowriterComposite:'',

      // Photo / video flags + extras
      showPhotoCredits: false,
      photographer:     '',
      photoEssay:       false,
      videoArticle:     false,
      videoUrl:         '',
      audioUrl:         '',

      // ASF-new flags
      subTitleNA:        false,
      bannerStatementNA: false,
      bodyComplete:      false
    };
  }

  // ═══════════════════════════════════════════════════════════════
  //  CMS HYDRATION — Media items for this article
  //
  //  Reads every .media-wrapper[data-item] (same as
  //  ta-components-tab v1.0.6 readMediaItems() at line 337+) and
  //  filters to records whose data-article-id matches. Sorted
  //  newest-first by html-created.
  // ═══════════════════════════════════════════════════════════════
  function hydrateMedia(articleId) {
    var wraps = document.querySelectorAll('.media-wrapper[data-item]');
    var items = [];

    Array.prototype.forEach.call(wraps, function (el) {
      var d = el.dataset || {};
      var thisArticleId = (d.articleId || '').trim();
      if (!articleId || thisArticleId !== articleId) return;

      var htmlEl    = el.querySelector('.cm-media-html');
      var htmlInner = htmlEl ? htmlEl.innerHTML : '';
      var htmlText  = htmlEl ? (htmlEl.innerText || htmlEl.textContent || '') : '';
      var createdStr = (d.htmlCreated || '').trim();
      var createdMs  = createdStr ? (new Date(createdStr).getTime() || 0) : 0;

      items.push({
        mediaId:          (d.mediaId || '').trim(),
        name:             (d.mediaName || '').trim(),
        mediaType:        (d.mediaType || '').trim(),
        role:             (d.componentRole || '').trim(),
        status:           (d.status || '').trim(),
        articleId:        thisArticleId,
        customerId:       (d.customerId || '').trim(),
        productId:        (d.productId || '').trim(),
        imageUrl:         (d.imageUrl || '').trim(),
        slug:             (d.slug || '').trim(),
        sourceChannel:    (d.sourceChannel || '').trim(),
        pdfProvenance:    (d.pdfProvenance || '').trim(),
        originalFilename: (d.originalFilename || '').trim(),
        mimeType:         (d.mimeType || '').trim(),
        size:             (d.size || '').trim(),
        createdStr:       createdStr,
        createdMs:        createdMs,
        htmlContent:      htmlInner,
        htmlText:         htmlText
      });
    });

    items.sort(function (a, b) { return b.createdMs - a.createdMs; });
    return items;
  }

  // ═══════════════════════════════════════════════════════════════
  //  RTP COMPUTATION
  //
  //  Single source of truth for "is this article publishable?".
  //  Drives both the title-bar Readiness tile and the expandable
  //  checklist panel. Pure function over S — call any time.
  // ═══════════════════════════════════════════════════════════════
  function computeRTP() {
    var a = S.article || {};
    var hasMainImage = !!a.mainImageSrc || !!findMediaByRole('main-image');
    var hasOgImage   = !!findMediaByRole('og-image') || hasMainImage; // OG falls back to main

    return CFG.rtpItems.map(function (item) {
      var passed = false;
      var markedNA = false;
      var manualChecked = false;

      switch (item.id) {
        case 'title':          passed = !!a.name; break;
        case 'main-image':     passed = hasMainImage; break;
        case 'body-complete':  passed = !!a.bodyComplete; break;
        case 'main-image-alt': passed = !!a.mainImageAlt; break;
        case 'og-image':       passed = hasOgImage; break;

        case 'subtitle':
          markedNA = !!a.subTitleNA || !!S.rtpNAState[item.id];
          passed = markedNA || !!a.subtitle;
          break;
        case 'banner':
          markedNA = !!a.bannerStatementNA || !!S.rtpNAState[item.id];
          passed = markedNA || !!a.bannerStatement;
          break;
        case 'cta':
          markedNA = !!S.rtpNAState[item.id];
          passed = markedNA || !!(a.ctaButton && a.ctaUrl);
          break;

        case 'sponsor-ok':
        case 'edit-pass':
          manualChecked = !!S.rtpManualState[item.id];
          passed = manualChecked;
          break;
      }

      return {
        id:            item.id,
        label:         item.label,
        tier:          item.tier,
        naField:       item.naField || null,
        passed:        passed,
        markedNA:      markedNA,
        manualChecked: manualChecked
      };
    });
  }

  function findMediaByRole(role) {
    for (var i = 0; i < S.media.length; i++) {
      if (S.media[i].role === role) return S.media[i];
    }
    return null;
  }

  function rtpReadyState() {
    var rows = computeRTP();
    var required = rows.filter(function (r) { return r.tier === 't1'; });
    var pendingReq = required.filter(function (r) { return !r.passed; });
    var optional = rows.filter(function (r) { return r.tier !== 't1'; });
    return {
      ready:           pendingReq.length === 0,
      passedCount:     rows.filter(function (r) { return r.passed; }).length,
      totalCount:      rows.length,
      requiredPending: pendingReq.length,
      requiredTotal:   required.length,
      optionalPassed:  optional.filter(function (r) { return r.passed; }).length,
      optionalTotal:   optional.length,
      rows:            rows
    };
  }

  // ═══════════════════════════════════════════════════════════════
  //  OVERLAY MOUNT / UNMOUNT
  //
  //  Pattern lifted from InbxRTE.openFullscreen so the two overlays
  //  feel identical at the OS level: full-viewport mount as a child
  //  of <body>, body class to lock scroll, Esc to close (with dirty
  //  guard). Esc handler is captured so unmount can remove the same
  //  reference (no closures leaking).
  // ═══════════════════════════════════════════════════════════════
  function mount() {
    // Defensive: tear down any stale instance (e.g. dev hot-reload).
    if (S.overlay && S.overlay.parentNode) {
      try { S.overlay.parentNode.removeChild(S.overlay); } catch (e) {}
    }
    // Also remove any orphaned .ta-asf nodes from prior broken sessions.
    Array.prototype.forEach.call(
      document.querySelectorAll('.ta-asf'),
      function (el) { try { el.remove(); } catch (e) {} }
    );

    S.overlay = document.createElement('div');
    S.overlay.className = 'ta-asf';
    S.overlay.innerHTML =
      '<div class="asf-overlay">' +
        '<div class="asf-panel" id="asf-panel"></div>' +
      '</div>';
    document.body.appendChild(S.overlay);
    document.body.classList.add('asf-open');

    S.lastEscHandler = function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        // Don't intercept Esc while the RTE is layered on top — let
        // ta-rte's own Esc handler run first. ta-rte unsets the
        // overlay before its Esc returns, so the next Esc lands here.
        if (S.bodyEditOpen) return;
        e.preventDefault();
        attemptClose();
      }
    };
    document.addEventListener('keydown', S.lastEscHandler);
  }

  function unmount() {
    if (S.lastEscHandler) {
      document.removeEventListener('keydown', S.lastEscHandler);
      S.lastEscHandler = null;
    }
    if (S.overlay && S.overlay.parentNode) {
      try { S.overlay.parentNode.removeChild(S.overlay); } catch (e) {}
    }
    S.overlay = null;
    document.body.classList.remove('asf-open');
    document.body.style.overflow = '';
  }

  function attemptClose() {
    // Chunk C will replace the confirm() with a proper modal (using
    // ix-modals primitives) and a more granular dirty summary.
    if (hasDirty()) {
      if (!window.confirm('You have unsaved changes in the form. Discard and close?')) return;
    }
    publicClose();
  }

  // ═══════════════════════════════════════════════════════════════
  //  RENDER — top-level orchestrator
  //
  //  innerHTML replacement is intentional. The ASF is short-lived,
  //  state changes are coarse (segment switch, RTP toggle, save), and
  //  full re-renders are cheaper than diffing for this surface size.
  //  Chunk C may add fine-grained patch helpers if perf demands.
  // ═══════════════════════════════════════════════════════════════
  function render() {
    var panel = qs(S.overlay, '#asf-panel');
    if (!panel) return;

    var rtp = rtpReadyState();

    // v1.1.0 — two-column shell replaces the v1.0.x row stack.
    // Functions kept-but-not-called (renderTopbar, renderTitleBar,
    // renderRTPPanel, renderRow01/02/04 non-body, renderFooter) are
    // dead code preserved for diff-readability; Chunk 4 prunes them.
    // v1.1.3 — .asf-side gets .asf-side--picker class while picker
    // is open so the CSS can adjust padding/scroll behavior.
    var sideCls = 'asf-side' +
      (S.inlinePicker && S.inlinePicker.open ? ' asf-side--picker' : '');
    panel.innerHTML =
      renderContextBar() +
      '<div class="asf-shell">' +
        '<div class="asf-main">' +
          renderMain(rtp) +
        '</div>' +
        '<div class="' + sideCls + '">' +
          renderSide(rtp) +
        '</div>' +
      '</div>';

    // v1.0.4 — picker modal is a sibling overlay above .asf-overlay.
    // Mounted inside .ta-asf so it inherits the token scope.
    var pickerHost = qs(S.overlay, '.asf-pick-host');
    if (!pickerHost) {
      pickerHost = document.createElement('div');
      pickerHost.className = 'asf-pick-host';
      S.overlay.appendChild(pickerHost);
    }
    pickerHost.innerHTML = renderPicker();

    bindAll();

    // v1.1.1 (Chunk 2) — post-render Trix initialization. The
    // editor element exists in DOM after the innerHTML above;
    // this just binds the change listener. Safe no-op when not
    // in create mode (qs returns null).
    initInlineTrix();
  }

  // ═══════════════════════════════════════════════════════════════
  //  bindAll() — SAFETY-NET ONLY in Chunk B.
  //
  //  Chunk C fills in the rest: field change handlers, switch
  //  toggles, segmented-control click, edit-section / cancel-section,
  //  RTP NA checkboxes, RTP manual checkboxes, attach/upload/generate,
  //  tech drawer, save-draft, publish, newsletter dropdown commit, etc.
  //
  //  Wired here (because the overlay is otherwise un-dismissable, and
  //  Jeff specified the Path 2 RTE contract in the prompt):
  //    • Topbar Close button             → attemptClose
  //    • Footer Cancel button            → attemptClose
  //    • Esc keydown                     → attemptClose (mount-level)
  //    • Path 2 "Edit body" button       → launchBodyEditor
  // ═══════════════════════════════════════════════════════════════
  function bindAll() {
    // Mount-level listeners (one-time per overlay instance). The render
    // tree is replaced on every render() call, but the overlay root is
    // stable, so we attach listeners ONCE via event delegation.
    if (S.listenersBound) return;
    var root = S.overlay;
    if (!root) return;

    // ── Delegated event router (handles every interactive element) ──
    root.addEventListener('click',  onDelegatedClick);
    root.addEventListener('input',  onDelegatedInput);
    root.addEventListener('change', onDelegatedChange);
    root.addEventListener('keydown', onDelegatedKeydown);

    S.listenersBound = true;
  }

  // ═══════════════════════════════════════════════════════════════
  //  Path 2 RTE handoff
  //
  //  Contract (locked in spec):
  //    window.InbxStudioBodyEditor({
  //      articleItemId, articleTitle, returnPanel: 'asf'
  //    })
  //
  //  Studio's openBodyEditor → InbxRTE.openFullscreen → on save:
  //  Scenario G (post-body + post-body-html dual-write) → page reload
  //  → Studio's restore reads returnPanel and re-launches the ASF.
  //  Chunk C will add the restore-on-mount path that reads sessionStorage
  //  and re-opens the ASF for the same articleId post-reload.
  // ═══════════════════════════════════════════════════════════════
  function launchBodyEditor() {
    if (typeof window.InbxStudioBodyEditor !== 'function') {
      warn('launchBodyEditor: window.InbxStudioBodyEditor is missing — Studio v1.4.0+ required');
      toast('Body editor is unavailable — load Studio v1.4.0 or newer', 'error');
      return;
    }

    // v1.0.15: create mode goes through local-mode body editor.
    // No article record yet, so no Scenario G fetch/save — body HTML
    // lives in S.article.bodyHtml until first Save Draft, when it
    // travels out with the createAsset payload.
    if (S.mode === 'create') {
      S.bodyEditOpen = true;
      window.InbxStudioBodyEditor({
        mode:         'local',
        articleTitle: S.article && S.article.name ? S.article.name : 'New Article',
        initialBody:  (S.article && S.article.bodyHtml) || '',
        onSave: function (html) {
          if (!S.article) S.article = {};
          S.article.bodyHtml = html || '';
          S.bodyEditOpen = false;
          // Editing body counts as a dirty change so Save Draft shows
          // unsaved state and the body content travels out on create.
          if (!S.dirtyFields) S.dirtyFields = {};
          S.dirtyFields.bodyHtml = { from: '', to: S.article.bodyHtml };
          deriveDirtySections();
          render();
          toast('Body saved locally — will be sent with Save Draft', 'success');
        },
        onClose: function () {
          S.bodyEditOpen = false;
        }
      });
      return;
    }

    // Edit mode (existing behavior — unchanged):
    if (!S.article || !S.article.id) {
      warn('launchBodyEditor: no article in state');
      return;
    }

    // RTE save → Scenario G → page reload. Any unsaved ASF edits would
    // be lost. Warn before handing off.
    if (hasDirty()) {
      var ok = window.confirm(
        'You have unsaved ASF changes that will be lost when the body editor reloads the page.\n\n' +
        'Save draft first, or click OK to discard them and continue to the body editor.'
      );
      if (!ok) return;
    }

    // Write restore context so ASF can re-open itself after the reload.
    try {
      sessionStorage.setItem(CFG.sessionStorageKey, JSON.stringify({
        articleId: S.article.id,
        ts:        Date.now()
      }));
    } catch (e) {
      warn('sessionStorage write failed (private mode?)', e);
    }

    S.bodyEditOpen = true;
    window.InbxStudioBodyEditor({
      articleItemId: S.article.id,
      articleTitle:  S.article.name,
      returnPanel:   CFG.rteReturnPanel  // 'asf'
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  RENDER · v1.1.0 layout
  //
  //  These are the renderers actually called by render() in v1.1.0.
  //  The legacy renderTopbar / renderTitleBar / renderRTPPanel /
  //  renderRow01-04 / renderFooter functions below remain in the
  //  file as dead code to keep diffs readable; Chunk 4 prunes them.
  // ═══════════════════════════════════════════════════════════════

  // T0 — thin context strip. Small, faded. Not a "header"; just a
  // sliver showing where you are + a close affordance.
  function renderContextBar() {
    var a       = S.article || {};
    var ctxName = (a.titleAdminName || a.titleName || '').trim() ||
                  (S.mode === 'create' ? 'new article' : 'edit article');
    var modeTag = S.mode === 'create' ? ' · new article' : '';
    return '' +
      '<div class="asf-context-bar">' +
        '<span class="asf-cx-name">' + esc(ctxName) + esc(modeTag) + '</span>' +
        '<span class="asf-cx-close" data-asf-action="close-overlay" title="Close (Esc)">✕</span>' +
      '</div>';
  }

  // ─── Main column ───────────────────────────────────────────────
  function renderMain(rtp) {
    return '' +
      renderSourceScreenshots() +
      renderTitleHeadline() +
      renderMainSubtitle() +
      renderMainWriters() +
      renderMainCoWriters() +
      renderMainTeaser() +
      renderMainShortSummary() +
      renderMainOgZones() +        // v1.1.4 — main + OG side-by-side 50/50
      renderMainBody() +           // v1.1.1 — split: inline Trix in create, popout in edit
      renderIssuesBanner() +
      renderActionBar(rtp);
  }

  // T2 — source screenshots strip (conditional). Render only when
  // the caller passed sourceImages (typically Transcriber).
  function renderSourceScreenshots() {
    if (!S.sourceImages || !S.sourceImages.length) return '';
    var imgs = '';
    for (var i = 0; i < S.sourceImages.length; i++) {
      var u = S.sourceImages[i];
      imgs += '<img class="asf-source-strip-img" src="' + esc(u) +
              '" alt="Source screenshot ' + (i + 1) + '">';
    }
    return '' +
      '<div class="asf-source-strip">' +
        '<span class="asf-source-strip-label">Source</span>' +
        imgs +
      '</div>';
  }

  // T3 — in-place big-font headline (WYSIWYG title editing).
  // Uses contenteditable so the heading IS the editor — no
  // separate label/input box. Dirty styling = gold border-bottom.
  function renderTitleHeadline() {
    var v       = curValRead('name');
    var isDirty = S.dirtyFields &&
                  Object.prototype.hasOwnProperty.call(S.dirtyFields, 'name');
    var cls     = 'asf-title-headline' + (isDirty ? ' dirty' : '');
    var placeholder = S.mode === 'create' ? 'Article title…' : 'Untitled';
    return '' +
      '<div class="asf-field">' +
        '<div class="asf-title-headline-label">Title — edit in place</div>' +
        '<div class="' + cls + '"' +
          ' contenteditable="true"' +
          ' data-asf-field="name"' +
          ' data-asf-headline="true"' +
          ' data-placeholder="' + esc(placeholder) + '"' +
          ' spellcheck="true">' +
          esc(v) +
        '</div>' +
      '</div>';
  }

  // T4 — subtitle with subtle inline N/A toggle next to label.
  function renderMainSubtitle() {
    var v       = curValRead('subtitle');
    var isDirty = isDirtyKey('subtitle');
    var naOn    = !!curValRead('subTitleNA');
    var inputCls = 'asf-input' + (isDirty ? ' dirty' : '');
    return '' +
      '<div class="asf-field">' +
        '<div class="asf-field-label-row">' +
          '<label class="asf-field-label">Sub-title</label>' +
          renderNAToggleInline('subTitleNA', naOn) +
        '</div>' +
        '<input type="text" class="' + inputCls + '"' +
          ' data-asf-field="subtitle"' +
          ' value="' + esc(v) + '"' +
          (naOn ? ' disabled' : '') +
          ' placeholder="Sub-title…">' +
      '</div>';
  }

  function renderMainWriters() {
    return '' +
      '<div class="asf-writer-row">' +
        renderField({ field: 'writerName',  label: 'Writer',       value: curValRead('writerName') }) +
        renderField({ field: 'writerTitle', label: 'Writer title', value: curValRead('writerTitle') }) +
      '</div>';
  }

  function renderMainCoWriters() {
    return '' +
      '<div class="asf-writer-row">' +
        renderField({ field: 'cowriterName',  label: 'Co-writer',       value: curValRead('cowriterName') }) +
        renderField({ field: 'cowriterTitle', label: 'Co-writer title', value: curValRead('cowriterTitle') }) +
      '</div>';
  }

  function renderMainTeaser() {
    return renderTextarea({
      field: 'teaser',
      label: 'Teaser',
      value: curValRead('teaser'),
      limit: 400
    });
  }

  function renderMainShortSummary() {
    return renderTextarea({
      field: 'shortSummary',
      label: 'Short summary',
      value: curValRead('shortSummary'),
      limit: 150
    });
  }

  // ─── v1.1.4 (Chunk 4) — Main + OG side-by-side ─────────────────
  //
  // Replaces the legacy renderRow03 (full-width vertical stack).
  // Emits a 50/50 grid: main image zone (left) + OG preview (right).
  // Both zones sit inside the main column, above the body editor.
  // Action handlers (attach-main-from-media, replace-main-image,
  // preview-main-image, set-og-from-main, upload-main, generate-main)
  // are unchanged — only the visual shell is new.
  function renderMainOgZones() {
    var mainImg = findMediaByRole('main-image');
    var ogImg   = findMediaByRole('og-image');
    return '' +
      '<div class="asf-mainog-grid">' +
        renderMainImageZoneCompact(mainImg) +
        renderOgZoneCompact(mainImg, ogImg) +
      '</div>';
  }

  // Main image zone — compact. Two states:
  //   Empty:    icon + "Click to attach" prompt. Click anywhere on
  //             the empty card opens the MEDIA picker.
  //   Attached: thumbnail (16:10 letterbox) + caption + small
  //             action buttons (Preview / Replace / Use as OG).
  // Alt text input below thumbnail (required for RTP t1).
  // Upload + Generate retained as secondary affordances.
  function renderMainImageZoneCompact(mainImg) {
    var a           = S.article || {};
    var fallbackUrl = a.mainImageSrc || '';
    var displayUrl  = (mainImg && mainImg.imageUrl) || fallbackUrl;
    var displayName = (mainImg && (mainImg.name || mainImg.originalFilename)) || '';
    var altDirty    = isDirtyKey('mainImageAlt');

    var cardHtml;
    if (displayUrl) {
      cardHtml = '' +
        '<div class="asf-mainog-card has-image">' +
          '<div class="asf-mainog-img"' +
               ' style="background-image:url(' + esc(displayUrl) + ');"' +
               ' data-asf-action="preview-main-image"' +
               ' title="Click to preview full size">' +
          '</div>' +
          (displayName ? '<div class="asf-mainog-caption">' + esc(displayName) + '</div>' : '') +
          '<div class="asf-mainog-actions">' +
            '<button type="button" class="asf-mainog-act"' +
              ' data-asf-action="replace-main-image">Replace</button>' +
            '<button type="button" class="asf-mainog-act"' +
              ' data-asf-action="preview-main-image">Preview</button>' +
            '<button type="button" class="asf-mainog-act primary"' +
              ' data-asf-action="set-og-from-main">Use as OG</button>' +
          '</div>' +
        '</div>';
    } else {
      cardHtml = '' +
        '<div class="asf-mainog-card empty"' +
             ' data-asf-action="attach-main-from-media"' +
             ' title="Click to attach from MEDIA library">' +
          '<div class="asf-mainog-empty-icon">📷</div>' +
          '<div class="asf-mainog-empty-prompt">Click to attach main image</div>' +
          '<div class="asf-mainog-empty-sub">1180 × 600 · top of article</div>' +
        '</div>';
    }

    return '' +
      '<div class="asf-mainog-zone">' +
        '<div class="asf-mainog-head">' +
          '<span class="asf-mainog-title">Main image</span>' +
          (displayUrl ? '<span class="asf-mainog-badge">attached</span>' : '') +
        '</div>' +
        cardHtml +
        '<div class="asf-mainog-meta">' +
          '<label class="asf-field-label">Alt text' +
            (a.mainImageAlt ? '' : ' <span class="asf-field-req">·  required</span>') +
          '</label>' +
          '<input type="text" class="asf-input' + (altDirty ? ' dirty' : '') + '"' +
            ' data-asf-field="mainImageAlt"' +
            ' value="' + esc(a.mainImageAlt || '') + '"' +
            ' placeholder="Describe the image for screen readers / SEO">' +
        '</div>' +
        '<div class="asf-mainog-secondary">' +
          '<button type="button" class="asf-mainog-secondary-btn"' +
            ' data-asf-action="upload-main">⬆ Upload</button>' +
          '<button type="button" class="asf-mainog-secondary-btn"' +
            ' data-asf-action="generate-main">✨ Generate</button>' +
        '</div>' +
      '</div>';
  }

  // OG zone — compact social-share preview. Shows how the article
  // will appear when shared on Facebook / LinkedIn / Slack. No
  // dedicated picker for OG in v1.1.4 — falls back to main image.
  // "Use main image" button surfaces when main exists and OG doesn't.
  function renderOgZoneCompact(mainImg, ogImg) {
    var a          = S.article || {};
    var hasMain    = !!(mainImg || a.mainImageSrc);
    var hasOwnOg   = !!ogImg;
    var previewUrl = (ogImg && ogImg.imageUrl) ||
                     (mainImg && mainImg.imageUrl) ||
                     a.mainImageSrc || '';
    var sourceText = hasOwnOg ? 'dedicated OG image' :
                     hasMain  ? 'main image fallback' : 'none';

    // Build preview card (title + teaser overlay, image at top)
    var titleText = a.name || 'Untitled article';
    var descText  = a.teaser || a.shortSummary || 'No teaser yet.';
    var siteText  = 'inbxify.com';

    var imgPanel = previewUrl
      ? '<div class="asf-mainog-og-img" style="background-image:url(' + esc(previewUrl) + ');"></div>'
      : '<div class="asf-mainog-og-img empty">' +
          '<span class="asf-mainog-og-img-label">OG · 1200×630 · empty</span>' +
        '</div>';

    return '' +
      '<div class="asf-mainog-zone">' +
        '<div class="asf-mainog-head">' +
          '<span class="asf-mainog-title">Social / OG preview</span>' +
          '<span class="asf-mainog-hint">FB · LinkedIn · Slack</span>' +
        '</div>' +
        '<div class="asf-mainog-og-card">' +
          imgPanel +
          '<div class="asf-mainog-og-text">' +
            '<div class="asf-mainog-og-site">' + esc(siteText) + '</div>' +
            '<div class="asf-mainog-og-title">' + esc(titleText) + '</div>' +
            '<div class="asf-mainog-og-desc">' + esc(descText) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="asf-mainog-meta">' +
          '<div class="asf-mainog-og-source">' +
            'Source: <strong>' + esc(sourceText) + '</strong>' +
          '</div>' +
          (hasMain && !hasOwnOg
            ? '<button type="button" class="asf-mainog-secondary-btn primary"' +
                ' data-asf-action="set-og-from-main">Use main image as OG →</button>'
            : '') +
        '</div>' +
      '</div>';
  }

  // T9 (legacy) — body editor button. Chunk 2 replaces with inline RTE.
  // Includes the bodyComplete N/A-style toggle inline per Jeff's "subtle
  // placement near the appropriate field" rule.
  function renderMainBodyLegacy() {
    var hasBody    = !!(S.article && S.article.bodyHtml &&
                        S.article.bodyHtml.replace(/<[^>]+>/g, '').trim());
    var bodyStatus = hasBody ? 'Body present' : 'Body empty';
    var complete   = !!curValRead('bodyComplete');
    var btnLabel   = hasBody ? 'Edit body' : 'Edit body — start writing';
    return '' +
      '<div class="asf-field" style="margin-top:8px;">' +
        '<div class="asf-field-label-row">' +
          '<label class="asf-field-label">Body</label>' +
          renderNAToggleInline('bodyComplete', complete, 'Complete') +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;' +
                    'padding:14px 16px;background:var(--cream-bg);' +
                    'border:0.5px solid var(--input-border);border-radius:4px;">' +
          '<span style="font-size:12px;color:var(--text-mid);">' + esc(bodyStatus) +
            ' · <em style="color:var(--text-tiny);font-style:normal;">(inline RTE in Chunk 2)</em></span>' +
          '<button type="button" class="ix-btn ix-btn--primary ix-btn--teal"' +
            ' data-asf-action="launch-body-editor"' +
            ' style="font-size:12px;padding:6px 14px;">' + esc(btnLabel) + '</button>' +
        '</div>' +
      '</div>';
  }

  // ─── v1.1.1 (Chunk 2) — inline body editor ─────────────────────
  //
  // Dispatcher: create mode → inline Trix; edit mode → legacy popout
  // button. Edit-mode inline RTE is gated on the saveAsf endpoint
  // (HC-15) being wired to Scenario G — out of Chunk 2 scope.
  //
  // v1.1.2 — Trix detection now checks the custom-element registry
  // (some bundles register <trix-editor> without exposing window.Trix).
  // If neither is present, fires ensureTrixLoaded() to CDN-inject
  // Trix and falls back to the legacy popout button JUST for this
  // render. As soon as Trix finishes loading, ensureTrixLoaded
  // triggers a re-render and the popout swaps to inline.
  function renderMainBody() {
    if (S.mode !== 'create') {
      return renderMainBodyLegacy();
    }
    if (isTrixAvailable()) {
      return renderMainBodyInline();
    }
    // Trix not yet on page — kick off async load + render fallback.
    // The load completion handler re-invokes render() so the
    // popout swaps to inline without user action.
    ensureTrixLoaded();
    return renderMainBodyLegacy();
  }

  // True when Trix is mountable: either the global is present
  // OR the <trix-editor> custom element has been registered.
  function isTrixAvailable() {
    if (typeof window.Trix !== 'undefined') return true;
    if (typeof customElements !== 'undefined' &&
        customElements.get &&
        customElements.get('trix-editor')) return true;
    return false;
  }

  // Lazy-load Trix from CDN on first need. Idempotent across
  // multiple calls (script tag deduped via data-asf-trix-loader
  // marker). Calls render() once the script resolves so the
  // popout fallback flips to inline.
  function ensureTrixLoaded() {
    if (isTrixAvailable()) return;
    if (S._trixLoading) return;            // load already in flight
    S._trixLoading = true;

    // CDN-pinned to the Trix 2.x major. jsDelivr resolves @2 to
    // the current stable 2.x release. If a future Trix 3.x breaks
    // anything, this constant is the single point of override.
    var TRIX_CSS_URL = 'https://cdn.jsdelivr.net/npm/trix@2/dist/trix.css';
    var TRIX_JS_URL  = 'https://cdn.jsdelivr.net/npm/trix@2/dist/trix.umd.min.js';

    // CSS first (no callback needed; style applies as it loads)
    if (!document.querySelector('link[data-asf-trix-loader]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = TRIX_CSS_URL;
      link.setAttribute('data-asf-trix-loader', 'true');
      document.head.appendChild(link);
    }

    // JS — re-render on load so the popout swaps to inline.
    if (!document.querySelector('script[data-asf-trix-loader]')) {
      var script = document.createElement('script');
      script.src = TRIX_JS_URL;
      script.async = true;
      script.setAttribute('data-asf-trix-loader', 'true');
      script.onload = function () {
        log('Trix loaded from CDN · re-rendering ASF for inline editor');
        S._trixLoading = false;
        if (S.open) render();
      };
      script.onerror = function () {
        warn('Trix CDN load failed (' + TRIX_JS_URL + ') — staying on legacy popout button');
        S._trixLoading = false;
      };
      document.head.appendChild(script);
    } else {
      // Tag already in flight from a prior call — wait for load.
      // (Edge case: ASF opened, closed, re-opened during the
      // initial load. Just ride the existing onload.)
    }
  }

  // Inline Trix editor — create mode. Mounts via initInlineTrix()
  // in the post-render hook. Layout matches the Transcriber Review
  // & Edit body block so the font/styling discontinuity Jeff
  // flagged is gone: same Trix instance shape, same toolbar
  // affordances.
  function renderMainBodyInline() {
    var v             = (S.article && S.article.bodyHtml) || '';
    var hasBody       = !!v.replace(/<[^>]+>/g, '').trim();
    var charCount     = stripTags(v).length;
    var maxChars      = 20000;
    var over          = charCount > maxChars;
    var bodyDirty     = isDirtyKey('bodyHtml');
    var bodyComplete  = !!curValRead('bodyComplete');
    var hiddenInputId = 'asf-trix-input';   // stable id; re-render replaces it

    return '' +
      '<div class="asf-field asf-body-field" style="margin-top:8px;">' +
        '<div class="asf-field-label-row">' +
          '<label class="asf-field-label">' +
            'Body' +
            (bodyDirty ? ' <span class="asf-body-dirty-dot" title="Unsaved changes"></span>' : '') +
          '</label>' +
          renderNAToggleInline('bodyComplete', bodyComplete, 'Complete') +
        '</div>' +
        '<div class="asf-trix-wrap' + (bodyDirty ? ' dirty' : '') + (over ? ' over' : '') + '"' +
             ' data-asf-trix-mount="true">' +
          '<input type="hidden" id="' + hiddenInputId + '"' +
            ' value="' + esc(v) + '">' +
          '<trix-toolbar id="asf-trix-toolbar"></trix-toolbar>' +
          '<trix-editor input="' + hiddenInputId + '"' +
            ' toolbar="asf-trix-toolbar"' +
            ' class="asf-trix-editor"' +
            ' placeholder="' +
              (hasBody ? '' : 'Start writing the article body…') +
            '"></trix-editor>' +
          '<div class="asf-trix-footer">' +
            '<button type="button" class="asf-trix-insert-image"' +
              ' data-asf-action="open-inline-image-picker"' +
              ' title="Insert image from MEDIA library">' +
              '<span class="asf-trix-insert-icon">⊕</span> Insert inline image' +
            '</button>' +
            '<span class="asf-trix-charcount' +
              (over ? ' over' :
               (charCount > maxChars * 0.85 ? ' near' : '')) + '">' +
              charCount.toLocaleString() + ' / ' + maxChars.toLocaleString() +
            '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // Plain-text length helper — matches Transcriber's sctRteGetText
  // shape (strips tags, counts visible chars).
  function stripTags(html) {
    if (!html) return '';
    // Quick-and-safe: tag strip + entity decode via a detached div.
    var tmp = document.createElement('div');
    tmp.innerHTML = String(html);
    return (tmp.textContent || tmp.innerText || '').trim();
  }

  // Called from render() at the very end of the synchronous block.
  // Trix custom element auto-initializes on connection, so we just
  // need to wire the change listener once per render. The trix-editor
  // element is REPLACED on every render — there's no instance to
  // preserve. Content seeds from the hidden input's value (already
  // written to S.article.bodyHtml by any prior change handler).
  function initInlineTrix() {
    var trixEditor = qs(S.overlay, 'trix-editor.asf-trix-editor');
    if (!trixEditor) return;                          // not in create mode
    if (trixEditor._asfBound) return;                 // safety net
    trixEditor._asfBound = true;

    // trix-change fires after every content edit — synchronous with
    // user input. Reading from element.innerHTML gives the canonical
    // Trix-serialized HTML (same as Transcriber's sctRteGetHTML).
    trixEditor.addEventListener('trix-change', onTrixChange);
    trixEditor.addEventListener('trix-blur',   onTrixChange);

    // trix-focus / trix-blur could be hooked later for advanced UX.
    // Insert-image and other toolbar custom actions are delegated
    // via onDelegatedClick using data-asf-action attributes.
  }

  function onTrixChange(e) {
    var el = e && e.target;
    if (!el) return;
    var html = el.innerHTML || '';
    if (!S.article) S.article = {};
    var orig = (S.originalValues && 'bodyHtml' in S.originalValues)
      ? (S.originalValues.bodyHtml || '')
      : '';
    S.article.bodyHtml = html;

    if (html === orig) {
      if (S.dirtyFields) delete S.dirtyFields.bodyHtml;
    } else {
      if (!S.dirtyFields) S.dirtyFields = {};
      S.dirtyFields.bodyHtml = { from: orig, to: html };
    }
    deriveDirtySections();
    refreshFooter();
    refreshDirtyStamp();
    refreshTrixFooter();
  }

  // Targeted refresh of just the Trix footer (char count + dirty
  // marker) without re-rendering the whole editor. Called from
  // onTrixChange so the count updates live.
  function refreshTrixFooter() {
    var wrap = qs(S.overlay, '.asf-trix-wrap');
    if (!wrap) return;
    var counter = qs(wrap, '.asf-trix-charcount');
    if (!counter) return;
    var html  = (S.article && S.article.bodyHtml) || '';
    var len   = stripTags(html).length;
    var max   = 20000;
    counter.textContent = len.toLocaleString() + ' / ' + max.toLocaleString();
    counter.classList.remove('over', 'near');
    if (len > max) counter.classList.add('over');
    else if (len > max * 0.85) counter.classList.add('near');

    // Reflect dirty + over state on the wrap itself.
    if (isDirtyKey('bodyHtml')) wrap.classList.add('dirty');
    else                        wrap.classList.remove('dirty');
    if (len > max)              wrap.classList.add('over');
    else                        wrap.classList.remove('over');
  }

  // T10 — issues banner. Rendered only when validation has flagged
  // problems. Placeholder for v1.2 validation pass — for Chunk 1
  // returns empty (no validation gating beyond Save Draft).
  function renderIssuesBanner() {
    if (!S.issues || !S.issues.length) return '';
    var items = '';
    for (var i = 0; i < S.issues.length; i++) {
      items += '<li>' + esc(S.issues[i]) + '</li>';
    }
    return '' +
      '<div class="asf-issues">' +
        '<div class="asf-issues-hdr">Before you can save:</div>' +
        '<ul class="asf-issues-list">' + items + '</ul>' +
      '</div>';
  }

  // T11 — action bar. Cancel + Save Draft. Save uses the v1.0.x
  // commitSaveDraft / commitCreateArticle paths unchanged.
  function renderActionBar(rtp) {
    var saveLabel  = S.saving ? 'Saving…' :
                     (S.mode === 'create' ? 'Save draft ✓' : 'Save changes ✓');
    var saveCls    = 'asf-action-save' + (S.saving ? ' saving' : '');
    return '' +
      '<div class="asf-action-bar">' +
        '<button type="button" class="asf-action-cancel" data-asf-action="close-overlay">✕ Cancel</button>' +
        '<button type="button" class="' + saveCls + '" data-asf-action="save-draft"' +
          (S.saving ? ' disabled' : '') + '>' + esc(saveLabel) + '</button>' +
      '</div>';
  }

  // ─── Sidebar (S1–S8) ──────────────────────────────────────────
  // v1.1.3 — sidebar now branches: inline image picker overlays
  // the section list when open. The .asf-side container itself is
  // unchanged; only its inner content swaps. This keeps layout
  // continuity (same width, same position) per Jeff's spec.
  function renderSide(rtp) {
    if (S.inlinePicker && S.inlinePicker.open) {
      return renderInlinePicker();
    }
    return '' +
      renderSideS1ArticleType() +
      renderSideSection('scheduling',  'Scheduling',                renderSideS2Scheduling()) +
      renderSideSection('credits',     'Credits beyond writers',    renderSideS3Credits()) +
      renderSideSection('ctaBanner',   'CTA & banner',              renderSideS4CtaBanner()) +
      renderSideS5References() +     // refs don't use cancel-section pattern (write to S.article directly)
      renderSideSection('identifiers', 'Identifiers',               renderSideS6Identifiers()) +
      renderSideSection('mediaFlags',  'Video / audio',             renderSideS7VideoAudio()) +
      renderStatusLine(rtp);
  }

  // Sidebar section primitive — emits header with conditional
  // Revert link (only when section dirty) + content slot. Uses
  // existing data-asf-action="cancel-section" contract so the
  // delegated handler + revertSection() pick it up without new
  // event wiring.
  function renderSideSection(sectionId, label, innerHtml) {
    var isDirty = !!(S.dirtySections && S.dirtySections[sectionId]);
    var headCls = 'asf-side-section-head';
    var sectCls = 'asf-side-section' + (isDirty ? ' has-dirty' : '');
    var revert  = isDirty
      ? '<button type="button" class="asf-side-section-cancel"' +
          ' data-asf-action="cancel-section"' +
          ' data-asf-section-id="' + esc(sectionId) + '">Revert</button>'
      : '';
    return '' +
      '<div class="' + sectCls + '" data-asf-side-section="' + esc(sectionId) + '">' +
        '<div class="' + headCls + '">' +
          '<span>' + esc(label) + '</span>' +
          revert +
        '</div>' +
        innerHtml +
      '</div>';
  }

  // S1 — Article type segmented control (no section-revert; this
  // is a render-time toggle on S.articleType, not a tracked field).
  function renderSideS1ArticleType() {
    var t = S.articleType || 'standard';
    function item(id, label, disabled) {
      var c = 'asf-type-seg-item' + (t === id ? ' on' : '') + (disabled ? ' disabled' : '');
      return '<div class="' + c + '"' +
             (disabled ? '' : ' data-asf-action="set-article-type" data-asf-type="' + id + '"') +
             '>' + label + '</div>';
    }
    return '' +
      '<div class="asf-side-section">' +
        '<div class="asf-side-section-head"><span>Article type</span></div>' +
        '<div class="asf-type-seg">' +
          item('standard',    'Std',   false) +
          item('photo-essay', 'Photo', true) +
          item('video',       'Video', true) +
        '</div>' +
      '</div>';
  }

  // S2 — Scheduling: tentative newsletter (existing dropdown
  // machinery in renderAssignmentTile) + revenue type.
  function renderSideS2Scheduling() {
    var rev = curValRead('revenueType') || '';
    var revOpts = [
      { value: '',          label: '— select —' },
      { value: 'editorial', label: 'Editorial (unpaid)' },
      { value: 'sponsored', label: 'Sponsored' },
      { value: 'paid',      label: 'Paid placement' }
    ];
    var revHtml = '';
    for (var i = 0; i < revOpts.length; i++) {
      revHtml += '<option value="' + esc(revOpts[i].value) + '"' +
        (rev === revOpts[i].value ? ' selected' : '') + '>' +
        esc(revOpts[i].label) + '</option>';
    }
    var revDirty = isDirtyKey('revenueType') ? ' dirty' : '';

    // Tentative newsletter — render as compact select; binds via
    // existing focus-newsletter / cancel-newsletter pattern below
    // in renderSideNewsletterSelect.
    var nl = renderSideNewsletterSelect();

    return '' +
      '<div class="asf-field">' +
        '<label class="asf-field-label">Tentative newsletter</label>' +
        nl +
      '</div>' +
      '<div class="asf-field">' +
        '<label class="asf-field-label">Revenue type</label>' +
        '<select class="asf-select' + revDirty + '" data-asf-field="revenueType">' +
          revHtml +
        '</select>' +
      '</div>';
  }

  function renderSideNewsletterSelect() {
    var nls = (S.newsletters && S.newsletters.length)
      ? S.newsletters
      : [{ id: '', name: '— loading… —' }];
    var choice = S.newsletterChoice ||
                 ((S.article && S.article.newsletterId) || '');
    var opts = '<option value="">— none —</option>';
    for (var i = 0; i < nls.length; i++) {
      opts += '<option value="' + esc(nls[i].id) + '"' +
        (choice === nls[i].id ? ' selected' : '') + '>' +
        esc(nls[i].name) + '</option>';
    }
    var dirty = (S.dirtyFields && S.dirtyFields.tentativeNewsletter) ? ' dirty' : '';
    return '<select class="asf-select' + dirty + '" data-asf-field="tentativeNewsletter">' +
             opts +
           '</select>';
  }

  // S3 — Credits beyond writers
  function renderSideS3Credits() {
    return '' +
      renderField({ field: 'photographer', label: 'Photographer',
                    value: curValRead('photographer') }) +
      renderSwitch({ field: 'showPhotoCredits', label: 'Show photo credits',
                     on: !!curValRead('showPhotoCredits') });
  }

  // S4 — CTA & banner. Banner statement (+ inline N/A) + CTA fields.
  function renderSideS4CtaBanner() {
    var bsV     = curValRead('bannerStatement');
    var bsDirty = isDirtyKey('bannerStatement') ? ' dirty' : '';
    var bsNA    = !!curValRead('bannerStatementNA');
    return '' +
      '<div class="asf-field">' +
        '<div class="asf-field-label-row">' +
          '<label class="asf-field-label">Banner statement</label>' +
          renderNAToggleInline('bannerStatementNA', bsNA) +
        '</div>' +
        '<input type="text" class="asf-input' + bsDirty + '"' +
          ' data-asf-field="bannerStatement"' +
          ' value="' + esc(bsV) + '"' +
          (bsNA ? ' disabled' : '') + '>' +
      '</div>' +
      renderField({ field: 'ctaButton', label: 'Button label', value: curValRead('ctaButton') }) +
      renderField({ field: 'ctaText',   label: 'CTA text',     value: curValRead('ctaText') }) +
      renderField({ field: 'ctaUrl',    label: 'CTA URL',      value: curValRead('ctaUrl'),    mono: true });
  }

  // S5 — References. No section-revert (refs write directly to
  // S.article via the picker). Wrapped in its own .asf-side-section
  // for visual consistency with the other sidebar groups.
  function renderSideS5References() {
    var a = S.article || {};
    return '' +
      '<div class="asf-side-section">' +
        '<div class="asf-side-section-head"><span>References</span></div>' +
        renderUnlockedRef('Customer',      a.customerName,   'customer') +
        renderUnlockedRef('Product',       a.productName,    'product') +
        renderUnlockedRef('Ad assignment', a.mnlsName || '', 'ad') +
      '</div>';
  }

  // S6 — Identifiers
  function renderSideS6Identifiers() {
    return renderField({
      field: 'printIssueSource',
      label: 'Print issue source',
      value: curValRead('printIssueSource')
    });
  }

  // S7 — Video / audio URLs. Article-type-gated in a later pass;
  // for Chunk 1 they always render.
  function renderSideS7VideoAudio() {
    return '' +
      renderField({ field: 'videoUrl', label: 'Video URL', value: curValRead('videoUrl'), mono: true }) +
      renderField({ field: 'audioUrl', label: 'Audio URL', value: curValRead('audioUrl'), mono: true });
  }

  // S8 — Status line. Reuses computeRTP for the "X / Y ready" tally.
  function renderStatusLine(rtp) {
    var have = (rtp && typeof rtp.have === 'number') ? rtp.have : 0;
    var need = (rtp && typeof rtp.need === 'number') ? rtp.need : 0;
    var status = (S.article && S.article.status) || 'Draft';
    var countCls = (need > 0 && have >= need) ? ' complete' : '';
    return '' +
      '<div class="asf-status-line">' +
        '<span>Status · ' + esc(status) + '</span>' +
        '<span class="asf-rtp-count' + countCls + '">' + have + ' / ' + need + ' ready</span>' +
      '</div>';
  }

  // ─── v1.1.3 (Chunk 3) — Inline image picker (sidebar swap) ─────

  // Renders the picker that overlays the sections sidebar. Header
  // + tabs + bundle-grouped thumbnails. Filters MEDIA by tab status
  // + (optional) search string. Image insertion routes through
  // insertImageIntoBody() which uses Trix's attachment API.
  function renderInlinePicker() {
    var pk          = S.inlinePicker || { tab: 'available', expandedBundles: {}, search: '' };
    var allMedia    = hydrateAllMedia();
    var availHash   = pickMediaStatusHash('available');
    var attachHash  = pickMediaStatusHash('attached');

    // Image-only subset, then split by status so we can show
    // accurate counts on both tabs without re-walking.
    var imageMedia  = allMedia.filter(function (m) { return m.mediaType === 'image'; });
    var availItems  = imageMedia.filter(function (m) {
      return statusMatches(m, availHash, 'Available');
    });
    var attachItems = imageMedia.filter(function (m) {
      return statusMatches(m, attachHash, 'Attached');
    });
    var activeItems = pk.tab === 'attached' ? attachItems : availItems;

    // Search filter
    var searchTerm = (pk.search || '').trim().toLowerCase();
    if (searchTerm) {
      activeItems = activeItems.filter(function (m) {
        var hay = ((m.name || '') + ' ' + (m.originalFilename || '')).toLowerCase();
        return hay.indexOf(searchTerm) !== -1;
      });
    }

    // Group by bundle
    var bundleGroups = groupByBundle(activeItems);

    return '' +
      // Header
      '<div class="asf-picker-header">' +
        '<span class="asf-picker-title">' +
          '<span class="asf-picker-title-icon">⊕</span> Insert inline image' +
        '</span>' +
        '<span class="asf-picker-close" data-asf-action="close-inline-picker"' +
              ' title="Close picker (return to sections)">✕</span>' +
      '</div>' +

      // Tabs
      '<div class="asf-picker-tabs">' +
        '<button type="button" class="asf-picker-tab' +
          (pk.tab === 'available' ? ' on' : '') + '"' +
          ' data-asf-action="picker-set-tab" data-asf-picker-tab="available">' +
          'Available · ' + availItems.length +
        '</button>' +
        '<button type="button" class="asf-picker-tab' +
          (pk.tab === 'attached' ? ' on' : '') + '"' +
          ' data-asf-action="picker-set-tab" data-asf-picker-tab="attached">' +
          'Attached · ' + attachItems.length +
        '</button>' +
      '</div>' +

      // Search
      '<div class="asf-picker-search-wrap">' +
        '<input type="text" class="asf-picker-search"' +
          ' data-asf-picker-search="true"' +
          ' value="' + esc(pk.search || '') + '"' +
          ' placeholder="Filter by name or filename…">' +
      '</div>' +

      // Bundle list (scrolling region)
      '<div class="asf-picker-bundles">' +
        renderInlinePickerBundles(bundleGroups, pk) +
      '</div>';
  }

  function renderInlinePickerBundles(groups, pk) {
    // groups = [{ id, label, items: [...] }, ..., { id: '__loose__', ... }]
    if (!groups.length || groups.every(function (g) { return !g.items.length; })) {
      return '<div class="asf-picker-empty">' +
        'No ' + (pk.tab === 'attached' ? 'attached' : 'available') +
        ' images match.' +
        (pk.search ? ' Try clearing the filter.' : '') +
      '</div>';
    }

    var html = '';
    for (var i = 0; i < groups.length; i++) {
      var g           = groups[i];
      if (!g.items.length) continue;
      var isLoose     = g.id === '__loose__';
      // Expanded by default; user toggles per-bundle.
      var collapsedKey  = g.id;
      var explicitlySet = pk.expandedBundles &&
                          Object.prototype.hasOwnProperty.call(pk.expandedBundles, collapsedKey);
      var expanded      = explicitlySet ? !!pk.expandedBundles[collapsedKey] : true;

      // Visual divider before the loose tray
      if (isLoose) {
        html += '<div class="asf-picker-loose-divider"></div>';
      }

      html += '<div class="asf-picker-bundle' + (expanded ? '' : ' collapsed') + '">' +
                '<div class="asf-picker-bundle-head"' +
                  ' data-asf-action="picker-toggle-bundle"' +
                  ' data-asf-bundle-id="' + esc(collapsedKey) + '">' +
                  '<span class="asf-picker-bundle-caret">' + (expanded ? '▼' : '▶') + '</span>' +
                  '<span class="asf-picker-bundle-label">' + esc(g.label) + '</span>' +
                  '<span class="asf-picker-bundle-count">' + g.items.length + '</span>' +
                '</div>' +
                (expanded ? renderInlinePickerThumbs(g.items) : '') +
              '</div>';
    }
    return html;
  }

  function renderInlinePickerThumbs(items) {
    var html = '<div class="asf-picker-thumbs">';
    for (var i = 0; i < items.length; i++) {
      var m   = items[i];
      var alt = m.name || m.originalFilename || 'image';
      var src = m.imageUrl;
      if (!src) continue;
      html += '<div class="asf-picker-thumb"' +
                ' data-asf-action="picker-insert-image"' +
                ' data-asf-media-id="' + esc(m.mediaId) + '"' +
                ' title="' + esc(alt) + ' — click to insert">' +
                '<img src="' + esc(src) + '" alt="' + esc(alt) + '">' +
                '<span class="asf-picker-thumb-name">' + esc(alt) + '</span>' +
              '</div>';
    }
    html += '</div>';
    return html;
  }

  // Hydrate every .media-wrapper[data-item] regardless of article
  // association. Same field shape as hydrateMedia, plus bundleId
  // + bundleLabel which the article-scoped hydrate doesn't read.
  function hydrateAllMedia() {
    var wraps = document.querySelectorAll('.media-wrapper[data-item]');
    var items = [];
    Array.prototype.forEach.call(wraps, function (el) {
      var d = el.dataset || {};
      var createdStr = (d.htmlCreated || '').trim();
      var createdMs  = createdStr ? (new Date(createdStr).getTime() || 0) : 0;
      items.push({
        mediaId:          (d.mediaId || '').trim(),
        name:             (d.mediaName || '').trim(),
        mediaType:        (d.mediaType || '').trim(),
        role:             (d.componentRole || '').trim(),
        status:           (d.status || '').trim(),
        articleId:        (d.articleId || '').trim(),
        customerId:       (d.customerId || '').trim(),
        productId:        (d.productId || '').trim(),
        imageUrl:         (d.imageUrl || '').trim(),
        slug:             (d.slug || '').trim(),
        sourceChannel:    (d.sourceChannel || '').trim(),
        originalFilename: (d.originalFilename || '').trim(),
        mimeType:         (d.mimeType || '').trim(),
        size:             (d.size || '').trim(),
        bundleId:         (d.bundleId || '').trim(),
        bundleLabel:      (d.bundleLabel || '').trim(),
        createdStr:       createdStr,
        createdMs:        createdMs
      });
    });
    items.sort(function (a, b) { return b.createdMs - a.createdMs; });
    return items;
  }

  // Pull a MEDIA status option hash from TA_CONFIG. Returns null
  // when TA_CONFIG isn't configured for status hashes — the
  // statusMatches helper then falls back to string comparison.
  function pickMediaStatusHash(key) {
    var t = window.TA_CONFIG;
    if (!t || !t.optionIds || !t.optionIds.mediaStatus) return null;
    return t.optionIds.mediaStatus[key] || null;
  }

  // Match either the option hash OR the display label, so the
  // picker still works in environments where TA_CONFIG hasn't
  // surfaced the hash map yet.
  function statusMatches(m, hash, label) {
    var s = (m.status || '').toLowerCase();
    if (hash && m.status === hash) return true;
    if (label && s === label.toLowerCase()) return true;
    return false;
  }

  // Group an items array by bundleId. Items without bundleId
  // collect into the "__loose__" group rendered last with a
  // divider. Each group is sorted within itself by createdMs
  // (already sorted by hydrateAllMedia, preserved here).
  function groupByBundle(items) {
    var map   = {};
    var order = [];
    var loose = { id: '__loose__', label: 'Loose tray · no bundle', items: [] };
    for (var i = 0; i < items.length; i++) {
      var m = items[i];
      var id = m.bundleId;
      if (!id) { loose.items.push(m); continue; }
      if (!map[id]) {
        map[id] = { id: id, label: m.bundleLabel || ('Bundle · ' + id.slice(0, 8)), items: [] };
        order.push(id);
      }
      map[id].items.push(m);
    }
    var groups = order.map(function (id) { return map[id]; });
    if (loose.items.length) groups.push(loose);
    return groups;
  }

  // Insert the picked MEDIA into the Trix editor at cursor position.
  // Prefers Trix's Attachment model (canonical, preserves editability
  // and metadata in the serialized HTML). Falls back to raw insertHTML
  // when only the custom element is registered (no window.Trix global).
  function insertImageIntoBody(media) {
    var trixEl = qs(S.overlay, 'trix-editor.asf-trix-editor');
    if (!trixEl || !trixEl.editor) {
      warn('insertImageIntoBody: Trix editor not found — body may be in popout mode');
      toast('Open the body editor first', 'error');
      return false;
    }
    if (!media || !media.imageUrl) {
      warn('insertImageIntoBody: media missing imageUrl', media);
      return false;
    }

    var url      = media.imageUrl;
    var alt      = media.name || media.originalFilename || 'image';
    var mimeType = media.mimeType || 'image/jpeg';

    if (typeof window.Trix !== 'undefined' && window.Trix.Attachment) {
      try {
        var attachment = new window.Trix.Attachment({
          url:         url,
          href:        url,
          contentType: mimeType,
          filename:    media.originalFilename || alt
        });
        trixEl.editor.insertAttachment(attachment);
        log('inserted image via Trix.Attachment', { url: url, mediaId: media.mediaId });
        return true;
      } catch (e) {
        warn('insertAttachment failed; falling back to insertHTML', e);
      }
    }
    // Fallback path
    var html = '<img src="' + esc(url) + '" alt="' + esc(alt) + '">';
    trixEl.editor.insertHTML(html);
    log('inserted image via insertHTML fallback', { url: url, mediaId: media.mediaId });
    return true;
  }

  // ─── Helpers used by v1.1.0 renderers ──────────────────────────

  // Subtle inline N/A toggle pill. Uses existing data-asf-switch
  // contract so handleSwitch() catches it via delegated click —
  // no new event wiring needed.
  function renderNAToggleInline(field, on, labelText) {
    var label = labelText || 'N/A';
    var cls   = 'asf-na-toggle' + (on ? ' on' : '');
    return '<button type="button" class="' + cls + '"' +
           ' data-asf-switch="' + esc(field) + '"' +
           ' title="Toggle ' + esc(label) + '">' +
           '<span class="asf-na-box"></span>' + esc(label) +
           '</button>';
  }

  // Same precedence as commitCreateArticle's curVal: dirtyFields
  // wins, then S.article. Read-only (no writes here).
  function curValRead(k) {
    if (S.dirtyFields && Object.prototype.hasOwnProperty.call(S.dirtyFields, k)) {
      return S.dirtyFields[k].to;
    }
    return (S.article && k in S.article) ? S.article[k] : '';
  }

  function isDirtyKey(k) {
    return !!(S.dirtyFields && Object.prototype.hasOwnProperty.call(S.dirtyFields, k));
  }

  // ───────────────────────────────────────────────────────────────
  //  RENDER · Topbar (LEGACY — kept as dead code, pruned in Chunk 4)
  // ───────────────────────────────────────────────────────────────

  // Display-only ref pill WITHOUT the diamond marker or lock icon. Renders
  // as a clickable styled input — clicking opens the CMS-ref picker for
  // that ref type (v1.0.4). Until Scenario G's updateArticleRef route
  // is built, the picker confirms with a payload-logged toast.
  // ─── v1.0.x legacy renderers removed in v1.1.4 Chunk 4 ──────────
  //   renderTopbar, renderTitleBar, renderReadinessTile,
  //   renderAssignmentTile, renderRTPPanel/Item/ImagePips/Pip,
  //   renderRow01, renderRowHeader, renderReadonlyInput, renderRow02,
  //   renderMetaSection, renderSectionIdentity/Positioning/Narrative/
  //   People/Refs — all replaced by v1.1.0 layout. Git history retains.

  function renderUnlockedRef(label, value, refType) {
    var clickable = !!refType;
    return '' +
      '<div class="asf-field">' +
        '<label class="asf-field-label">' + esc(label) +
          (clickable ? ' <span class="hint">(click to change)</span>' : '') +
        '</label>' +
        '<input type="text" class="asf-input readonly' + (clickable ? ' clickable' : '') + '"' +
          ' value="' + esc(value) + '" readonly' +
          (clickable ? ' data-asf-action="open-ref-picker" data-asf-ref-type="' + esc(refType) + '"' : '') +
          ' style="cursor:' + (clickable ? 'pointer' : 'default') + ';">' +
      '</div>';
  }

  function renderLockedRef(label, value) {
    return '' +
      '<div class="asf-field">' +
        '<label class="asf-field-label"><span class="diamond">◆</span> ' + esc(label) + '</label>' +
        '<div class="asf-ref-locked-pill">' +
          '<span class="diamond-marker">◆</span>' +
          esc(value) +
          '<span class="lock-icon">🔒</span>' +
        '</div>' +
      '</div>';
  }

  // Generic text input with optional limit, charcounter, mono, readonly,
  // placeholder, required marker, hint suffix.
  function renderField(o) {
    o = o || {};
    var v = o.value == null ? '' : String(o.value);
    var lim = o.limit || 0;
    var len = v.length;
    var over = lim && len > lim;
    var near = lim && len > Math.floor(lim * 0.85) && !over;

    var cls = 'asf-input';
    if (o.readonly)        cls += ' readonly';
    if (o.mono)            cls += ' url';
    if (over)              cls += ' over';
    // v1.0.17 — apply .dirty at render so prefilled fields show gold
    // border immediately on open. Chunk C input handlers still toggle
    // the class on subsequent user edits; this just covers the
    // initial-render case for create-mode prefill (TD-186).
    if (o.field && S.dirtyFields &&
        Object.prototype.hasOwnProperty.call(S.dirtyFields, o.field)) {
      cls += ' dirty';
    }

    var reqMark  = o.req  ? '<span class="req">*</span>'  : '';
    var hintMark = o.hint ? '<span class="hint">' + esc(o.hint) + '</span>' : '';
    var counter = lim
      ? '<span class="asf-charcount' +
          (over ? ' over' : (near ? ' near' : '')) +
        '">' + len + ' / ' + lim + '</span>'
      : '';

    return '' +
      '<div class="asf-field">' +
        '<label class="asf-field-label">' + esc(o.label) + ' ' + reqMark + ' ' + hintMark + '</label>' +
        '<input type="text" class="' + cls + '"' +
          ' data-asf-field="' + esc(o.field) + '"' +
          ' value="' + esc(v) + '"' +
          (o.readonly    ? ' readonly' : '') +
          (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') +
          (lim           ? ' maxlength="' + (lim * 2) + '"' : '') +
        '>' +
        counter +
      '</div>';
  }

  function renderTextarea(o) {
    o = o || {};
    var v = o.value == null ? '' : String(o.value);
    var lim = o.limit || 0;
    var len = v.length;
    var over = lim && len > lim;
    var near = lim && len > Math.floor(lim * 0.85) && !over;

    var reqMark = o.req ? '<span class="req">*</span>' : '';

    // v1.0.5: readonly mode renders the value as an auto-sizing div
    // instead of a clipped textarea. No counter — counter is an
    // editing-mode affordance only.
    if (o.readonly) {
      var emptyCls = v ? '' : ' empty';
      return '' +
        '<div class="asf-field">' +
          '<label class="asf-field-label">' + esc(o.label) + ' ' + reqMark + '</label>' +
          '<div class="asf-textarea-readout' + emptyCls + '" data-asf-field="' + esc(o.field) + '">' +
            (v ? esc(v) : '<span class="asf-readout-placeholder">—</span>') +
          '</div>' +
        '</div>';
    }

    var cls = 'asf-textarea';
    if (o.long) cls += ' long';
    if (over)   cls += ' over';
    // v1.0.17 — apply .dirty at render (see renderField note above).
    if (o.field && S.dirtyFields &&
        Object.prototype.hasOwnProperty.call(S.dirtyFields, o.field)) {
      cls += ' dirty';
    }

    var counter = lim
      ? '<span class="asf-charcount' +
          (over ? ' over' : (near ? ' near' : '')) +
        '">' + len + ' / ' + lim + '</span>'
      : '';

    return '' +
      '<div class="asf-field">' +
        '<label class="asf-field-label">' + esc(o.label) + ' ' + reqMark + '</label>' +
        '<textarea class="' + cls + '" data-asf-field="' + esc(o.field) + '">' + esc(v) + '</textarea>' +
        counter +
      '</div>';
  }

  function renderSwitch(o) {
    var on = !!o.on;
    var rowCls = 'asf-switch-row' + (on ? ' on' : '');
    var swCls  = 'asf-switch'     + (on ? ' on' : '');
    // v1.0.17 — apply .dirty at render so prefilled switches show
    // gold-soft bg immediately on open (TD-186).
    if (o.field && S.dirtyFields &&
        Object.prototype.hasOwnProperty.call(S.dirtyFields, o.field)) {
      rowCls += ' dirty';
    }
    return '' +
      '<div class="asf-field">' +
        '<label class="asf-field-label">&nbsp;</label>' +
        '<div class="' + rowCls + '" data-asf-switch="' + esc(o.field) + '">' +
          '<span class="asf-switch-label">' + esc(o.label) + '</span>' +
          '<div class="' + swCls + '"></div>' +
        '</div>' +
      '</div>';
  }


  // ───────────────────────────────────────────────────────────────
  //  RENDER · Row 03 — Media (two-zone + OG preview)
  // ───────────────────────────────────────────────────────────────

  // ═══════════════════════════════════════════════════════════════
  //  BEHAVIOR · Chunk C
  //
  //  Delegated event handlers, action router, dirty tracking, save
  //  & publish flows, newsletter fetch, sessionStorage restore.
  //
  //  All listeners are attached ONCE in bindAll() on the overlay root;
  //  these functions resolve targets via closestEl() and data-attrs.
  // ═══════════════════════════════════════════════════════════════

  // ── Delegated routers ─────────────────────────────────────────
  // ─── v1.0.x legacy renderers removed in v1.1.4 Chunk 4 ──────────
  //   renderRow03 (replaced by renderMainOgZones), renderMainImageZone,
  //   renderInlineImagesZone (inline images go through Trix picker),
  //   renderOgBlock (replaced by renderOgZoneCompact),
  //   renderRow04 (body extracted; rest moved to sidebar),
  //   renderTechDrawer, renderFooter (replaced by renderActionBar).

  function onDelegatedClick(e) {
    if (!S.open) return;
    var t = e.target;

    // v1.0.4 — picker card click (highest priority when picker is open)
    if (S.picker.open) {
      var card = closestEl(t, '[data-asf-pick-id]');
      if (card) {
        pickerSelect(card.getAttribute('data-asf-pick-id'));
        return;
      }
      // Backdrop click — only fires if user clicks the dim area outside
      // the modal. The modal itself stops propagation via :not selector
      // on the data-asf-action, but we double-check by ignoring if the
      // click was inside .asf-pick-modal.
      if (closestEl(t, '.asf-pick-modal')) {
        // Allow action handlers (close button, confirm button) to run
        // via the normal action router below.
      } else if (closestEl(t, '.asf-pick-overlay')) {
        pickerClose();
        return;
      }
    }

    // Action takes priority — it's the most specific intent.
    var actionEl = closestEl(t, '[data-asf-action]');
    if (actionEl && !isDisabled(actionEl)) {
      var action = actionEl.getAttribute('data-asf-action');
      handleAction(action, actionEl, e);
      return;
    }

    // Switches (toggle controls) — both renderSwitch divs and the
    // bodyComplete custom button. RTP N/A and Manual rows are <label>
    // wrappers around checkboxes — let the native click → change
    // event handle those so the checkbox state is reliable.
    if (closestEl(t, '.asf-rtp-na, .asf-rtp-manual-toggle')) return;

    var switchEl = closestEl(t, '[data-asf-switch]');
    if (switchEl && !isDisabled(switchEl)) {
      handleSwitch(switchEl.getAttribute('data-asf-switch'), switchEl, e);
      return;
    }

    // Article type segments
    var typeEl = closestEl(t, '[data-asf-type]');
    if (typeEl && !isDisabled(typeEl)) {
      handleTypeChange(typeEl.getAttribute('data-asf-type'));
      return;
    }
  }

  function onDelegatedInput(e) {
    if (!S.open) return;
    var t = e.target;
    if (!t || !t.hasAttribute) return;

    // v1.0.4 — picker filter inputs
    if (t.hasAttribute('data-asf-pick-filter')) {
      pickerSetFilter(t.getAttribute('data-asf-pick-filter'), t.value);
      return;
    }

    // v1.1.3 — inline image picker search input. Updates picker
    // state + re-renders the sidebar so the bundle list filters.
    if (t.hasAttribute('data-asf-picker-search')) {
      if (!S.inlinePicker) return;
      S.inlinePicker.search = t.value || '';
      render();
      // Re-focus the search input + restore cursor after render
      // so typing isn't interrupted by the sidebar rebuild.
      setTimeout(function () {
        var s = qs(S.overlay, '[data-asf-picker-search]');
        if (s) {
          s.focus();
          // Place cursor at end (best we can do across browsers
          // without persisting selection offsets)
          var v = s.value;
          try { s.setSelectionRange(v.length, v.length); } catch (_) {}
        }
      }, 0);
      return;
    }

    if (!t.hasAttribute('data-asf-field')) return;
    // v1.1.0 — accept contenteditable headlines (Title) in addition
    // to native INPUT / TEXTAREA. The handleFieldEdit helper now
    // reads .textContent when the element has contenteditable=true.
    var isCE = t.getAttribute('contenteditable') === 'true' ||
               t.isContentEditable === true;
    if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA' && !isCE) return;
    if (t.readOnly || t.hasAttribute('readonly')) return;
    handleFieldEdit(t.getAttribute('data-asf-field'), t);
  }

  function onDelegatedChange(e) {
    if (!S.open) return;
    var t = e.target;
    if (!t || !t.hasAttribute) return;

    // v1.0.4 — picker filter selects
    if (t.hasAttribute('data-asf-pick-filter')) {
      pickerSetFilter(t.getAttribute('data-asf-pick-filter'), t.value);
      return;
    }

    // Newsletter select (and any future native selects)
    if (t.tagName === 'SELECT' && t.hasAttribute('data-asf-field')) {
      handleSelectChange(t.getAttribute('data-asf-field'), t);
      return;
    }

    // RTP N/A checkboxes (T2)
    if (t.tagName === 'INPUT' && t.hasAttribute('data-asf-rtp-na')) {
      handleRTPNAChange(t.getAttribute('data-asf-rtp-na'), !!t.checked);
      return;
    }

    // RTP manual checkboxes (T3)
    if (t.tagName === 'INPUT' && t.hasAttribute('data-asf-rtp-manual')) {
      handleRTPManualChange(t.getAttribute('data-asf-rtp-manual'), !!t.checked);
      return;
    }
  }

  function onDelegatedKeydown(e) {
    if (!S.open) return;
    // Cmd/Ctrl+S → save draft (only when at least one field is dirty
    // and we're not inside the RTE overlay).
    if (S.bodyEditOpen) return;
    var key = e.key || '';
    var isSaveCombo = (e.metaKey || e.ctrlKey) && (key === 's' || key === 'S');
    if (isSaveCombo) {
      e.preventDefault();
      if (hasDirty()) commitSaveDraft();
      else toast('Nothing to save', 'info');
    }
  }

  // ── Action router ─────────────────────────────────────────────
  function handleAction(action, el, e) {
    switch (action) {

      // Close overlay (topbar X, footer Cancel)
      // v1.1.0 — sidebar S1 segmented control
      case 'set-article-type':
        var newType = action.getAttribute('data-asf-type');
        if (newType && newType !== S.articleType) {
          S.articleType = newType;
          render();
        }
        return;

      // v1.1.3 (Chunk 3) — inline image picker actions.
      // Replaces the v1.1.2 toast stub. Sidebar swaps to picker
      // mode; subsequent actions navigate the picker, pick an
      // image, or close it.
      case 'open-inline-image-picker':
        if (S.mode !== 'create') {
          // Picker is meaningful only when the body editor is
          // inline (create mode). Edit mode uses the popout body
          // editor which has no insertion point in the sidebar.
          toast('Inline image picker is available in create mode', 'info');
          return;
        }
        if (!S.inlinePicker) {
          S.inlinePicker = { open: true, tab: 'available', expandedBundles: {}, search: '' };
        } else {
          S.inlinePicker.open = true;
        }
        render();
        return;

      case 'close-inline-picker':
        if (S.inlinePicker) S.inlinePicker.open = false;
        render();
        return;

      case 'picker-set-tab':
        var newTab = action.getAttribute('data-asf-picker-tab');
        if (newTab && S.inlinePicker && S.inlinePicker.tab !== newTab) {
          S.inlinePicker.tab = newTab;
          render();
        }
        return;

      case 'picker-toggle-bundle':
        var bid = action.getAttribute('data-asf-bundle-id');
        if (!bid || !S.inlinePicker) return;
        if (!S.inlinePicker.expandedBundles) S.inlinePicker.expandedBundles = {};
        var explicit = Object.prototype.hasOwnProperty.call(S.inlinePicker.expandedBundles, bid);
        var current  = explicit ? !!S.inlinePicker.expandedBundles[bid] : true;
        S.inlinePicker.expandedBundles[bid] = !current;
        render();
        return;

      case 'picker-insert-image':
        var mediaId = action.getAttribute('data-asf-media-id');
        if (!mediaId) return;
        var allMedia = hydrateAllMedia();
        var picked = null;
        for (var pmI = 0; pmI < allMedia.length; pmI++) {
          if (allMedia[pmI].mediaId === mediaId) { picked = allMedia[pmI]; break; }
        }
        if (!picked) {
          warn('picker-insert-image: MEDIA not found in DOM', mediaId);
          return;
        }
        var ok = insertImageIntoBody(picked);
        if (ok) {
          // Close the picker so the publisher sees the inserted
          // image in context. They can re-open to insert another.
          if (S.inlinePicker) S.inlinePicker.open = false;
          render();
          toast('Inserted: ' + (picked.name || picked.originalFilename || 'image'), 'success');
        }
        return;

      case 'close-overlay':
        attemptClose();
        return;

      // (v1.0.2 — removed `nav-studio` and `nav-assembler` cases;
      //  the breadcrumb that emitted them is gone in the compact header.)

      // v1.1.4 — removed legacy action cases that referenced deleted
      // DOM:
      //   toggle-rtp           (RTP panel deleted; tally now in S8)
      //   focus-newsletter     (.assignment-row deleted; sidebar S2
      //                         hosts the newsletter dropdown directly)
      //   toggle-tech-drawer   (tech drawer surface deleted entirely)

      // Per-section cancel (sidebar Revert link). edit-section was
      // removed in v1.1.4 — the new layout has no inline edit-mode
      // for sections; all fields are always editable.
      case 'cancel-section':
        var cancelSec = el.getAttribute('data-asf-section-id');
        if (!cancelSec) return;
        revertSection(cancelSec);
        S.editingSection = null;
        render();
        return;

      // Newsletter revert (Row 01 — sits outside meta-sections)
      case 'cancel-newsletter':
        S.newsletterChoice = S.originalNewsletterChoice;
        // The newsletter field key in dirtyFields is 'tentativeNewsletter'
        delete S.dirtyFields.tentativeNewsletter;
        deriveDirtySections();
        render();
        return;

      // Body editor (Path 2 RTE handoff)
      case 'edit-body':
      case 'launch-body-editor':
        launchBodyEditor();
        return;

      // Save & publish
      case 'save-draft':
        commitSaveDraft();
        return;
      case 'publish':
        commitPublishAndSlot();
        return;

      // Image flows — v1.0.4 wires the picker. Upload via Uploadcare +
      // Scenario B. Generate stays as a placeholder until image-gen
      // endpoint is decided.
      case 'attach-main-from-media':
        pickerOpenMedia('main-image');
        return;
      case 'attach-inline':
        pickerOpenMedia('interior-image');
        return;
      case 'insert-inline':
        // We already know the mediaId from the card. Direct attach,
        // no picker needed.
        var insMediaId = el.getAttribute('data-asf-media-id');
        if (insMediaId) {
          var insItem = null;
          for (var iI = 0; iI < S.media.length; iI++) {
            if (S.media[iI].mediaId === insMediaId) { insItem = S.media[iI]; break; }
          }
          if (insItem) fireAttachMedia(insItem, 'interior-image', null);
        }
        return;
      case 'replace-inline':
        // Open picker; on confirm, detach old then attach new.
        var oldMediaId = el.getAttribute('data-asf-media-id');
        pickerOpenMedia('interior-image', { replaceMediaId: oldMediaId });
        return;
      case 'view-inline':
        var viewId = el.getAttribute('data-asf-media-id');
        var viewItem = null;
        for (var iV = 0; iV < S.media.length; iV++) {
          if (S.media[iV].mediaId === viewId) { viewItem = S.media[iV]; break; }
        }
        if (viewItem && viewItem.imageUrl) {
          window.open(viewItem.imageUrl, '_blank');
        }
        return;
      case 'replace-main-image':
        pickerOpenMedia('main-image', { replaceMediaId: (findMediaByRole('main-image') || {}).mediaId });
        return;
      case 'preview-main-image':
        var pmain = findMediaByRole('main-image');
        if (pmain && pmain.imageUrl) window.open(pmain.imageUrl, '_blank');
        else if (S.article.mainImageSrc) window.open(S.article.mainImageSrc, '_blank');
        return;
      case 'set-og-from-main':
        fireSetOgFromMain();
        return;
      case 'upload-main':
        var inp = ensureFileInput();
        inp.setAttribute('data-asf-upload-role', 'main-image');
        inp.click();
        return;
      case 'generate-main':
        toast('Image generation will ship when image-gen endpoint is decided', 'info');
        return;

      // Picker (v1.0.4)
      case 'picker-close':
      case 'picker-backdrop':
        pickerClose();
        return;
      case 'picker-confirm':
        pickerConfirm();
        return;

      // CMS-ref pickers (TD-178) — invoked when readonly ref inputs are clicked
      case 'open-ref-picker':
        var refType = el.getAttribute('data-asf-ref-type');
        if (refType) pickerOpenRef(refType);
        return;

      default:
        warn('Unhandled action:', action);
    }
  }

  // ── Field input (text/textarea) ───────────────────────────────
  function handleFieldEdit(fieldName, inputEl) {
    if (!fieldName || !inputEl) return;
    // v1.1.0 — contenteditable (Title headline) reads .textContent
    // rather than .value. Boolean isContentEditable covers cases where
    // the attribute is present without an explicit "true" value.
    var isCE  = inputEl.getAttribute &&
                (inputEl.getAttribute('contenteditable') === 'true' ||
                 inputEl.isContentEditable === true);
    var current = isCE
      ? (inputEl.textContent != null ? inputEl.textContent : '')
      : inputEl.value;
    var original = S.originalValues[fieldName];

    if (fieldsEqual(current, original)) {
      delete S.dirtyFields[fieldName];
      inputEl.classList.remove('dirty');
    } else {
      S.dirtyFields[fieldName] = { from: original, to: current };
      inputEl.classList.add('dirty');
    }
    deriveDirtySections();
    refreshFooter();
    refreshSectionHeads();
    refreshDirtyStamp();

    // Live charcount update (count siblings within .asf-field).
    // Skipped for contenteditable — headline has no char counter.
    if (isCE) return;
    var field = closestEl(inputEl, '.asf-field');
    if (field) {
      var counter = qs(field, '.asf-charcount');
      if (counter) {
        var lim = parseInt(inputEl.getAttribute('maxlength'), 10);
        // maxlength was set to lim*2 in renderField so the user can
        // exceed; derive the original limit by halving.
        if (lim) lim = Math.floor(lim / 2);
        var len = current.length;
        if (lim) {
          counter.textContent = len + ' / ' + lim;
          counter.classList.remove('over', 'near');
          if (len > lim) counter.classList.add('over');
          else if (len > Math.floor(lim * 0.85)) counter.classList.add('near');
        }
      }
    }
  }

  // ── Select change (newsletter, future selects) ────────────────
  function handleSelectChange(fieldName, selectEl) {
    if (fieldName === 'tentativeNewsletter') {
      var id = selectEl.value;
      if (!id || id === '__none__') {
        S.newsletterChoice = null;
      } else {
        S.newsletterChoice = findNewsletter(id);
      }
      // Dirty when the user's choice differs from open-time original.
      var origId = S.originalNewsletterChoice ? S.originalNewsletterChoice.id : null;
      var newId  = S.newsletterChoice          ? S.newsletterChoice.id          : null;
      if (origId === newId) {
        delete S.dirtyFields.tentativeNewsletter;
      } else {
        S.dirtyFields.tentativeNewsletter = { from: origId, to: newId };
      }
      deriveDirtySections();
      render();
      return;
    }
    // Generic select handling: treat like a text field.
    handleFieldEdit(fieldName, selectEl);
  }

  // ── Switch / toggle handling ──────────────────────────────────
  //   Used by:
  //     • renderSwitch outputs (.asf-switch-row [data-asf-switch="..."])
  //     • bodyComplete custom button [data-asf-switch="bodyComplete"]
  //
  //   These are click-toggles; we flip the cached value, update the
  //   .on / .checked classes directly, and recompute dirty.
  function handleSwitch(fieldName, el, e) {
    if (!fieldName) return;
    if (e && e.preventDefault) e.preventDefault();

    // Current on-state derives from the class — fall back to original
    // article value if no class yet (first interaction).
    var wasOn;
    if (el.classList.contains('on') || el.classList.contains('checked')) {
      wasOn = true;
    } else if (el.classList.contains('off')) {
      wasOn = false;
    } else {
      wasOn = !!S.originalValues[fieldName];
      // Sync class to truth before we flip
      if (wasOn) el.classList.add('on');
    }
    var nowOn = !wasOn;

    // Apply class semantics. .asf-switch-row uses .on; the bodyComplete
    // button (.asf-complete-toggle) uses .checked. Toggle both keys to
    // cover both surfaces.
    if (nowOn) {
      el.classList.add('on');
      el.classList.add('checked');
    } else {
      el.classList.remove('on');
      el.classList.remove('checked');
    }
    // The inner switch knob (if present)
    var knob = qs(el, '.asf-switch');
    if (knob) {
      if (nowOn) knob.classList.add('on');
      else       knob.classList.remove('on');
    }
    // Update bodyComplete label content (it has icon + text baked in)
    if (fieldName === 'bodyComplete') {
      el.textContent = (nowOn ? '✓ ' : '○ ') + 'Body complete (HC-14)';
    }

    // Dirty bookkeeping
    var origOn = !!S.originalValues[fieldName];
    if (origOn === nowOn) {
      delete S.dirtyFields[fieldName];
      el.classList.remove('dirty');
    } else {
      S.dirtyFields[fieldName] = { from: origOn, to: nowOn };
      el.classList.add('dirty');
    }
    deriveDirtySections();

    // bodyComplete affects RTP (it's a T1 required item) — re-render
    // the RTP panel + footer + title bar. For simplicity, full render.
    // subTitleNA / bannerStatementNA also feed RTP via computeRTP.
    if (fieldName === 'bodyComplete' || fieldName === 'subTitleNA' || fieldName === 'bannerStatementNA') {
      // Mirror the new value back to S.article so computeRTP reflects it.
      S.article[fieldName] = nowOn;
      render();
    } else {
      refreshFooter();
      refreshSectionHeads();
      refreshDirtyStamp();
    }
  }

  // ── Article type segment ──────────────────────────────────────
  function handleTypeChange(typeId) {
    if (!typeId || typeId === S.articleType) return;
    var typeDef = null;
    for (var i = 0; i < CFG.articleTypes.length; i++) {
      if (CFG.articleTypes[i].id === typeId) { typeDef = CFG.articleTypes[i]; break; }
    }
    if (!typeDef) return;
    if (typeDef.soon) {
      toast('"' + typeDef.label + '" is coming soon', 'info');
      return;
    }
    S.articleType = typeId;
    render();
  }

  // ── RTP toggles ───────────────────────────────────────────────
  function handleRTPNAChange(itemId, checked) {
    S.rtpNAState[itemId] = !!checked;
    // For subtitle / banner the NA state is also persisted on the
    // article (HC-12 / HC-13). Mirror to S.article so subsequent
    // re-renders are consistent. Save persists this to CMS.
    if (itemId === 'subtitle') {
      S.article.subTitleNA = !!checked;
      // Also mark the renderSwitch field as dirty if state changed
      // from the original article value.
      syncSwitchDirty('subTitleNA', !!checked);
    } else if (itemId === 'banner') {
      S.article.bannerStatementNA = !!checked;
      syncSwitchDirty('bannerStatementNA', !!checked);
    }
    // CTA has no article-side persistence — pure session state.
    render();
  }

  function handleRTPManualChange(itemId, checked) {
    S.rtpManualState[itemId] = !!checked;
    render();
  }

  function syncSwitchDirty(fieldName, nowOn) {
    var origOn = !!S.originalValues[fieldName];
    if (origOn === nowOn) {
      delete S.dirtyFields[fieldName];
    } else {
      S.dirtyFields[fieldName] = { from: origOn, to: nowOn };
    }
    deriveDirtySections();
  }

  // ── Section revert ────────────────────────────────────────────
  function revertSection(sectionId) {
    var fields = CFG.sectionFields[sectionId];
    if (!fields) return;
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      S.article[f] = S.originalValues[f];
      delete S.dirtyFields[f];
    }
    // Special: NA flags within the identity section affect RTP state.
    if (sectionId === 'identity') {
      S.rtpNAState.subtitle = !!S.originalValues.subTitleNA;
      S.rtpNAState.banner   = !!S.originalValues.bannerStatementNA;
    }
    deriveDirtySections();
  }

  // ── Incremental refresh helpers (avoid full re-render where safe) ──
  function refreshFooter() {
    var footer = qs(S.overlay, '.asf-footer');
    var rtp = rtpReadyState();
    if (footer) footer.outerHTML = renderFooter(rtp);
    // v1.1.0 — also refresh the new action bar (Save button state +
    // status line tally). Targeted swap so the contenteditable
    // headline doesn't lose cursor position on every keystroke.
    var actionBar = qs(S.overlay, '.asf-action-bar');
    if (actionBar) actionBar.outerHTML = renderActionBar(rtp);
    var statusLine = qs(S.overlay, '.asf-status-line');
    if (statusLine) statusLine.outerHTML = renderStatusLine(rtp);
  }

  function refreshSectionHeads() {
    // Add/remove a 'has-dirty' marker on each section head label.
    // Cheap operation — no full re-render.
    // v1.1.0: walks both legacy .asf-meta-section (kept until Chunk 4
    // prunes legacy renderers) AND new .asf-side-section sidebar
    // sections. Both use data-asf-section / data-asf-side-section.
    var heads = qsa(S.overlay, '.asf-meta-section');
    for (var i = 0; i < heads.length; i++) {
      var sec = heads[i].getAttribute('data-asf-section');
      if (S.dirtySections[sec]) heads[i].classList.add('has-dirty');
      else                       heads[i].classList.remove('has-dirty');
    }
    var sideHeads = qsa(S.overlay, '.asf-side-section');
    for (var j = 0; j < sideHeads.length; j++) {
      var sid = sideHeads[j].getAttribute('data-asf-side-section');
      if (!sid) continue;
      if (S.dirtySections[sid]) {
        sideHeads[j].classList.add('has-dirty');
        // Re-render is needed for the Revert link to appear/disappear,
        // since the link is conditional on has-dirty at render time.
        // Cheap full render keeps the contract simple in Chunk 1; can
        // micro-optimize in Chunk 4 if needed.
      } else {
        sideHeads[j].classList.remove('has-dirty');
      }
    }
  }

  // v1.0.2 — update the topbar dirty stamp without re-rendering.
  // Called from any handler that mutates dirty state (text input,
  // switch toggle, select change, newsletter revert, save success).
  function refreshDirtyStamp() {
    var stamp = qs(S.overlay, '.asf-hdr-dirty-stamp');
    if (!stamp) return;
    if (hasDirty()) {
      stamp.classList.add('on');
      stamp.classList.remove('off');
      stamp.innerHTML = '<span class="dot"></span>Editing · unsaved';
    } else {
      stamp.classList.remove('on');
      stamp.classList.add('off');
      stamp.innerHTML = '<span class="dot"></span>No changes';
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  SAVE & PUBLISH
  //
  //  Two paths share an endpoint (HC-15) distinguished by `op` in
  //  payload. Until HC-15 is set, both paths show a toast explaining
  //  what's missing and what would have been sent — useful for dev.
  // ═══════════════════════════════════════════════════════════════
  function buildSavePayload(op) {
    var p = {
      op:        op,
      articleId: S.article.id,
      titleId:   S.article.mnlsId || null,
      version:   VERSION,
      fields:    {},
      rtp:       {
        naState:     S.rtpNAState,
        manualState: S.rtpManualState
      },
      newsletterChoice: S.newsletterChoice,
      timestamp: new Date().toISOString()
    };
    // Only send fields the user actually changed (sparse payload).
    for (var k in S.dirtyFields) {
      if (!Object.prototype.hasOwnProperty.call(S.dirtyFields, k)) continue;
      p.fields[k] = S.dirtyFields[k].to;
    }
    return p;
  }

  function commitSaveDraft() {
    if (S.saving) return;

    // v1.0.10: create mode → goes through createArticle path instead
    if (S.mode === 'create') {
      commitCreateArticle();
      return;
    }

    if (!hasDirty() && !hasRTPChange()) {
      toast('No changes to save', 'info');
      return;
    }
    var payload = buildSavePayload('save-draft');
    log('save-draft payload', payload);

    if (isPlaceholderEndpoint(CFG.endpoints.saveAsf)) {
      // Dev mode: show what would be sent.
      toast('Save endpoint not configured (HC-15) — see console for payload', 'error');
      console.log('[ASF v' + VERSION + '] would POST save-draft →', payload);
      return;
    }

    S.saving = true;
    setSaveButtonState('saving');

    fetch(CFG.endpoints.saveAsf, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (body) {
        S.saving = false;
        // Server response should echo the persisted article so we can
        // refresh originals. Accepts both { article: {...} } and a
        // flat shape; tolerate either.
        var fresh = body && body.article ? body.article : body;
        if (fresh && typeof fresh === 'object') {
          // Apply server-confirmed values back to S.article
          for (var k in fresh) {
            if (Object.prototype.hasOwnProperty.call(fresh, k)) {
              S.article[k] = fresh[k];
            }
          }
        }
        S.dirtyFields   = {};
        S.dirtySections = {};
        snapshotOriginals();
        render();
        toast('Draft saved', 'success');
      })
      .catch(function (err) {
        S.saving = false;
        setSaveButtonState('idle');
        warn('save-draft failed', err);
        toast('Save failed — ' + (err && err.message ? err.message : 'unknown error'), 'error');
      });
  }

  // ═══════════════════════════════════════════════════════════════
  //  v1.0.10 — Create Article (first save in create mode)
  //
  //  Posts to Scenario G (window.TA_CONFIG.makeStudio) with
  //  action: 'createArticle'. Carries the full S.article object
  //  as fields. On success, the Make scenario creates the Webflow
  //  CMS record and returns { ok: true, articleItemId: '<new id>' }.
  //  ASF then flips S.mode → 'edit' and stores the new id so
  //  subsequent saves use the normal save-draft path.
  //
  //  Make route to build: 'createArticle' on Scenario G. Until it
  //  exists, payload is logged + error toast surfaces.
  // ═══════════════════════════════════════════════════════════════
  function commitCreateArticle() {
    // v1.0.12: read field values from dirtyFields (the user-typed
    // values) with fallback to S.article. handleFieldEdit() writes
    // to dirtyFields, NOT to S.article, so reading S.article alone
    // misses everything the user typed.
    function curVal(k) {
      if (S.dirtyFields && Object.prototype.hasOwnProperty.call(S.dirtyFields, k)) {
        return S.dirtyFields[k].to;
      }
      return S.article ? S.article[k] : undefined;
    }

    var currentName = curVal('name');
    if (!currentName || !String(currentName).trim()) {
      toast('Title is required to create an article', 'error');
      return;
    }
    var url = CFG.tenant.makeCreateAssets();

    var payload = {
      action:         'createAsset',     // v1.0.13: was 'createArticle'
      assetType:      'article',          // v1.0.13: selects Make router branch
      titleSlug:      CFG.tenant.titleSlug(),
      taItemId:       CFG.tenant.taItemId(),
      source:         'asf-v' + VERSION,
      // Full field set — Make scenario takes what it needs
      fields: {
        name:             currentName,
        slug:              curVal('slug'),
        subtitle:          curVal('subtitle'),
        bannerStatement:   curVal('bannerStatement'),
        teaser:            curVal('teaser'),
        shortSummary:      curVal('shortSummary'),
        printIssueSource:  curVal('printIssueSource'),
        ctaButton:         curVal('ctaButton'),
        ctaText:           curVal('ctaText'),
        ctaUrl:            curVal('ctaUrl'),
        writerName:        curVal('writerName'),
        writerTitle:       curVal('writerTitle'),
        cowriterName:      curVal('cowriterName'),
        cowriterTitle:     curVal('cowriterTitle'),
        photographer:      curVal('photographer'),
        showPhotoCredits:  curVal('showPhotoCredits'),
        subTitleNA:        curVal('subTitleNA'),
        bannerStatementNA: curVal('bannerStatementNA'),
        bodyComplete:      curVal('bodyComplete'),
        // v1.0.14: CMS refs — ref pickers write directly to S.article
        // (not to dirtyFields), so we read from S.article here. In
        // create mode the ref picker short-circuits the Scenario G
        // call; values just sit on S.article until they travel out
        // here on first save.
        customerId:        (S.article && S.article.customerId)     || '',
        customerName:      (S.article && S.article.customerName)   || '',
        productId:         (S.article && S.article.productId)      || '',
        productName:       (S.article && S.article.productName)    || '',
        mnlsId:            (S.article && S.article.mnlsId)         || '',
        mnlsName:          (S.article && S.article.mnlsName)       || '',
        newsletterId:      (S.article && S.article.newsletterId)   || '',
        newsletterName:    (S.article && S.article.newsletterName) || '',
        newsletterDate:    (S.article && S.article.newsletterDate) || '',
        revenueType:       (S.article && S.article.revenueType)    || '',
        // v1.0.15: body content from create-mode local body editor.
        // bodyHtml is the full RTE-edited HTML, bodyStatus reflects
        // whether the user actually edited (anything beyond empty
        // string).
        bodyHtml:          (S.article && S.article.bodyHtml)       || '',
        bodyStatus:        (S.article && S.article.bodyHtml && S.article.bodyHtml.replace(/<[^>]+>/g, '').trim()) ? 'Edited' : 'Empty',
        // v1.0.16: media flags + classification
        photoEssay:        curVal('photoEssay'),
        videoArticle:      curVal('videoArticle'),
        videoUrl:          curVal('videoUrl') || '',
        audioUrl:          curVal('audioUrl') || '',
        searchType:        curVal('searchType') || ''
      }
    };
    log('createAsset payload', payload);

    if (!url) {
      toast('Create Assets endpoint not configured — add TA_CONFIG.makeCreateAssets', 'error');
      console.log('[ASF v' + VERSION + '] would POST createAsset →', payload);
      return;
    }

    S.saving = true;
    setSaveButtonState('saving');

    fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (body) {
        var j;
        try { j = JSON.parse(body); } catch (e) { j = null; }
        if (!j || j.ok !== true) {
          // v1.0.13: surface what Make actually returned so we can debug
          console.warn('[ASF v' + VERSION + '] createAsset unexpected response:', body);
          throw new Error('Scenario 104 did not confirm createAsset — see console for raw response. Check the scenario\'s execution history in Make.com for the actual error.');
        }
        var newId = j.itemId || j.articleItemId || j.articleId || null;  // v1.0.13: prefer itemId
        if (!newId) {
          throw new Error('createAsset succeeded but no itemId returned in response');
        }

        // v1.0.12: BEFORE clearing dirtyFields, apply them to S.article
        // so the user's typed values persist into edit mode.
        if (S.dirtyFields) {
          for (var k in S.dirtyFields) {
            if (Object.prototype.hasOwnProperty.call(S.dirtyFields, k)) {
              S.article[k] = S.dirtyFields[k].to;
            }
          }
        }

        // Flip to edit mode for subsequent saves
        S.article.id = newId;
        S.mode = 'edit';
        S.saving = false;
        S.dirtyFields   = {};
        S.dirtySections = {};
        snapshotOriginals();
        render();
        toast('Article created — drafted as "' + (S.article.name || 'Untitled') + '"', 'success');
      })
      .catch(function (err) {
        S.saving = false;
        setSaveButtonState('idle');
        warn('createAsset failed', err);
        toast('Create failed — ' + (err && err.message ? err.message : 'unknown error'), 'error');
      });
  }

  function commitPublishAndSlot() {
    if (S.saving) return;
    var rtp = rtpReadyState();
    if (rtp.requiredPending > 0) {
      toast(rtp.requiredPending + ' required readiness item(s) still pending', 'error');
      return;
    }
    if (!S.newsletterChoice || !S.newsletterChoice.id || S.newsletterChoice.id === '__none__') {
      toast('Pick a tentative newsletter before publishing', 'error');
      return;
    }
    var payload = buildSavePayload('publish-and-slot');
    log('publish-and-slot payload', payload);

    if (isPlaceholderEndpoint(CFG.endpoints.saveAsf)) {
      toast('Publish endpoint not configured (HC-15) — see console for payload', 'error');
      console.log('[ASF v' + VERSION + '] would POST publish-and-slot →', payload);
      return;
    }

    S.saving = true;
    setSaveButtonState('publishing');

    fetch(CFG.endpoints.saveAsf, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function () {
        S.saving = false;
        toast('Slotted into ' + S.newsletterChoice.label, 'success');
        setTimeout(publicClose, 1200);
      })
      .catch(function (err) {
        S.saving = false;
        setSaveButtonState('idle');
        warn('publish failed', err);
        toast('Publish failed — ' + (err && err.message ? err.message : 'unknown error'), 'error');
      });
  }

  function hasRTPChange() {
    // True when user has toggled NA or manual state away from originals.
    var keys = ['subtitle', 'banner', 'cta'];
    for (var i = 0; i < keys.length; i++) {
      if (!!S.rtpNAState[keys[i]] !== !!S.originalNAState[keys[i]]) return true;
    }
    for (var k in S.rtpManualState) {
      if (S.rtpManualState[k]) return true;  // any manual confirmation is a change
    }
    return false;
  }

  function setSaveButtonState(state) {
    var btn = qs(S.overlay, '[data-asf-action="save-draft"]');
    var pub = qs(S.overlay, '[data-asf-action="publish"]');
    if (state === 'saving') {
      if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
      if (pub) pub.disabled = true;
    } else if (state === 'publishing') {
      if (pub) { pub.disabled = true; pub.textContent = 'Publishing…'; }
      if (btn) btn.disabled = true;
    } else {
      if (btn) { btn.disabled = false; btn.textContent = 'Save draft'; }
      if (pub) { pub.disabled = false; }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  NEWSLETTER LIST (TD-176 / HC-16)
  //
  //  Fires on overlay open. While HC-16 is a placeholder, we fall
  //  back to CFG.newsletterStub silently — the surface remains
  //  functional. When HC-16 is set, fetch returns { newsletters: [...] }
  //  and we swap CFG.newsletterStub → S.newsletterList for the dropdown.
  // ═══════════════════════════════════════════════════════════════
  function fetchNewsletters() {
    if (isPlaceholderEndpoint(CFG.endpoints.newsletterList)) {
      S.newsletterList = CFG.newsletterStub.slice();
      log('newsletter list: using stub (HC-16 unresolved)');
      return;
    }
    var titleId = S.article && S.article.mnlsId ? S.article.mnlsId : '';
    var url = CFG.endpoints.newsletterList + (titleId ? '?titleId=' + encodeURIComponent(titleId) : '');
    fetch(url, { method: 'GET' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (body) {
        var list = (body && body.newsletters) ? body.newsletters : (body || []);
        if (!list.length || list[0].id !== '__none__') {
          list.unshift({ id: '__none__', label: '— Unassigned —', issueNo: '', date: '' });
        }
        S.newsletterList = list;
        // Re-render Row 01 so the dropdown picks up the real list.
        if (S.open) render();
      })
      .catch(function (err) {
        warn('newsletter list fetch failed; falling back to stub', err);
        S.newsletterList = CFG.newsletterStub.slice();
      });
  }

  // ═══════════════════════════════════════════════════════════════
  //  sessionStorage RESTORE — post-RTE-reload
  //
  //  Flow: ASF → Edit body → writes sessionStorage → Studio launches
  //  InbxRTE → user saves → Scenario G runs → page reloads → this
  //  script re-initializes → restore() checks storage, finds a fresh
  //  context (< CFG.sessionRestoreMaxAge), and re-opens the ASF on
  //  the same article.
  // ═══════════════════════════════════════════════════════════════
  function tryRestore() {
    try {
      var raw = sessionStorage.getItem(CFG.sessionStorageKey);
      if (!raw) return;
      var ctx = JSON.parse(raw);
      // One-shot — always clear, so a stale key doesn't keep firing.
      sessionStorage.removeItem(CFG.sessionStorageKey);
      if (!ctx || !ctx.articleId) return;
      var age = Date.now() - (ctx.ts || 0);
      if (age > CFG.sessionRestoreMaxAge) {
        log('restore: context too old, skipping (age=' + age + 'ms)');
        return;
      }
      // Defer until the article wrapper is in the DOM. Webflow CMS
      // collections render server-side, so they're present at
      // DOMContentLoaded — but be defensive.
      var attempt = function (tries) {
        var wrap = document.querySelector('.articles-wrapper[data-article-id="' + ctx.articleId + '"]');
        if (wrap) {
          publicOpen({ articleId: ctx.articleId });
          // Inform the user this is a continuation.
          setTimeout(function () { toast('Body saved · returned to ASF', 'success'); }, 150);
          return;
        }
        if (tries < 20) setTimeout(function () { attempt(tries + 1); }, 100);
        else warn('restore: article wrapper never appeared for', ctx.articleId);
      };
      attempt(0);
    } catch (e) {
      warn('restore: sessionStorage read/parse failed', e);
    }
  }

  // Run restore on DOM-ready (or immediately if already ready).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryRestore);
  } else {
    setTimeout(tryRestore, 0);
  }

  // ═══════════════════════════════════════════════════════════════
  //  v1.0.4 · PICKER · MEDIA-ATTACH · UPLOAD · REF-UPDATE
  //
  //  Generic searchable modal usable for two distinct jobs:
  //    kind='media' → pick a MEDIA item to attach to the article
  //    kind='ref'   → pick a CMS reference (MNLS / Newsletter / Customer
  //                   / Product) to replace the article's current ref
  //
  //  The picker is a SECOND overlay layered on top of ASF (z-index
  //  bumped above .asf-overlay), mounted as a child of S.overlay so it
  //  inherits the .ta-asf CSS-token scope. Clicking outside the modal
  //  or pressing Esc dismisses without confirming.
  //
  //  All write paths go through Scenario G via window.TA_CONFIG.makeStudio.
  //  Upload path goes through Uploadcare browser-direct upload, then
  //  notifies Scenario B (makeConditioner) so the MEDIA row is created
  //  and (optionally) auto-attached.
  // ═══════════════════════════════════════════════════════════════

  // ── Tenant collection hydrators (mirror Studio v1.3.7 patterns) ──
  function readCustomers() {
    var seen = {}, out = [];
    var els = document.querySelectorAll('.customers-wrapper[data-item]');
    for (var i = 0; i < els.length; i++) {
      var d = els[i].dataset;
      var id = (d.id || '').trim();
      var name = (d.name || '').trim();
      if (id && !seen[id]) { seen[id] = true; out.push({ id: id, name: name || id, raw: d }); }
    }
    return out.sort(byName);
  }
  function readProducts() {
    var seen = {}, out = [];
    var els = document.querySelectorAll('.products-wrapper[data-item]');
    for (var i = 0; i < els.length; i++) {
      var d = els[i].dataset;
      var id = (d.id || '').trim();
      var name = (d.name || '').trim();
      if (id && !seen[id]) { seen[id] = true; out.push({ id: id, name: name || id, raw: d }); }
    }
    return out.sort(byName);
  }
  function readMnls() {
    // MNLS values are derived from each article's data-mnls-id / data-mnls-name
    var seen = {}, out = [];
    var els = document.querySelectorAll('.articles-wrapper[data-article-id]');
    for (var i = 0; i < els.length; i++) {
      var d = els[i].dataset;
      var id = (d.mnlsId || '').trim();
      var name = (d.mnlsName || '').trim();
      if (id && !seen[id]) { seen[id] = true; out.push({ id: id, name: name || id }); }
    }
    return out.sort(byName);
  }
  function readNewslettersForTitle() {
    // TD-176: until the real list is fetched (S.newsletterList) we fall
    // back to CFG.newsletterStub. Same source as Row 01 dropdown.
    var src = S.newsletterList || CFG.newsletterStub || [];
    return src.filter(function (n) { return n.id !== '__none__'; }).map(function (n) {
      return { id: n.id, name: n.label, issueNo: n.issueNo, date: n.date };
    });
  }
  function byName(a, b) { return (a.name || '').localeCompare(b.name || ''); }

  // ── MEDIA filtering for the picker ──────────────────────────────
  // Returns MEDIA items eligible for attachment in a given role.
  // Mirrors Studio v1.3.7 v1.2.2 filter rule:
  //   - status === 'Available' (not already attached anywhere)
  //   - kind matches the role's expected media kind (image vs other)
  //   - role-agnostic on the media side — the role is determined by the
  //     SLOT we're attaching to, not by the media's current role.
  function pickerEligibleMedia(role) {
    var imgKinds = { 'main-image': true, 'interior-image': true, 'og-image': true };
    var wantsImage = !!imgKinds[role];
    var out = [];
    for (var i = 0; i < S.media.length; i++) {
      var m = S.media[i];
      if (m.status !== 'Available') continue;
      if (wantsImage && m.mediaType && m.mediaType.toLowerCase().indexOf('image') < 0) continue;
      out.push(m);
    }
    return out;
  }

  // ── Filter application (called whenever filter inputs change) ───
  function applyPickerFilter() {
    var p = S.picker;
    var cf = (p.filterCustomer || '').toLowerCase();
    var pf = (p.filterProduct  || '').toLowerCase();
    var sf = (p.filterSearch   || '').toLowerCase().trim();
    p.items = p.allItems.filter(function (it) {
      if (cf && cf !== 'all' && String(it.customerId || '').toLowerCase() !== cf) return false;
      if (pf && pf !== 'all' && String(it.productId  || '').toLowerCase() !== pf) return false;
      if (sf) {
        var hay = (it.name || '').toLowerCase() + ' ' + (it.originalFilename || '').toLowerCase();
        if (hay.indexOf(sf) < 0) return false;
      }
      return true;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  Picker control surface
  // ═══════════════════════════════════════════════════════════════
  function pickerOpenMedia(role, opts) {
    opts = opts || {};
    S.picker.open           = true;
    S.picker.kind           = 'media';
    S.picker.mediaRole      = role;
    S.picker.refType        = null;
    S.picker.title          = opts.title || ('Pick ' + (role === 'main-image' ? 'a main image' : role === 'og-image' ? 'an OG image' : 'an inline image'));
    S.picker.allItems       = pickerEligibleMedia(role);
    S.picker.items          = S.picker.allItems.slice();
    S.picker.selectedId     = null;
    S.picker.filterCustomer = '';
    S.picker.filterProduct  = '';
    S.picker.filterSearch   = '';
    S.picker.inFlight       = false;
    S.picker.onConfirm      = opts.onConfirm || null;
    S.picker.replaceMediaId = opts.replaceMediaId || null;
    render();
    setTimeout(focusPickerSearch, 50);
  }

  function pickerOpenRef(refType, opts) {
    opts = opts || {};
    var def = CFG.refTypes[refType];
    if (!def) { warn('pickerOpenRef: unknown refType', refType); return; }
    S.picker.open           = true;
    S.picker.kind           = 'ref';
    S.picker.refType        = refType;
    S.picker.mediaRole      = null;
    S.picker.title          = 'Change ' + def.label;
    var list;
    if (refType === 'newsletter')      list = readNewslettersForTitle();
    else if (refType === 'customer')   list = readCustomers();
    else if (refType === 'product')    list = readProducts();
    else if (refType === 'mnls')       list = readMnls();
    else                                list = [];
    S.picker.allItems   = list;
    S.picker.items      = list.slice();
    S.picker.selectedId = null;
    S.picker.filterCustomer = '';
    S.picker.filterProduct  = '';
    S.picker.filterSearch   = '';
    S.picker.inFlight   = false;
    S.picker.onConfirm  = opts.onConfirm || null;
    render();
    setTimeout(focusPickerSearch, 50);
  }

  function pickerClose() {
    if (S.picker.inFlight) return; // don't dismiss mid-flight
    S.picker.open       = false;
    S.picker.kind       = null;
    S.picker.items      = [];
    S.picker.allItems   = [];
    S.picker.selectedId = null;
    S.picker.onConfirm  = null;
    render();
  }

  function pickerSelect(id) {
    if (S.picker.inFlight) return;
    S.picker.selectedId = id;
    render();
  }

  function pickerSetFilter(key, value) {
    if (S.picker.inFlight) return;
    if (key === 'customer') S.picker.filterCustomer = value;
    if (key === 'product')  S.picker.filterProduct  = value;
    if (key === 'search')   S.picker.filterSearch   = value;
    applyPickerFilter();
    // For text search we want incremental update — re-render the list
    // only (full render is acceptable here since picker is small).
    render();
    if (key === 'search') setTimeout(focusPickerSearch, 0);
  }

  function focusPickerSearch() {
    var el = qs(S.overlay, '.asf-pick-search');
    if (el && el.focus) {
      el.focus();
      try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {}
    }
  }

  function pickerConfirm() {
    var p = S.picker;
    if (p.inFlight) return;
    if (!p.selectedId) { toast('Pick an item first', 'info'); return; }
    var item = null;
    for (var i = 0; i < p.allItems.length; i++) {
      if (p.allItems[i].id === p.selectedId || p.allItems[i].mediaId === p.selectedId) { item = p.allItems[i]; break; }
    }
    if (!item) { warn('pickerConfirm: item not found in allItems'); return; }

    p.inFlight = true;
    render();

    if (p.kind === 'media') {
      fireAttachMedia(item, p.mediaRole, p.replaceMediaId);
    } else if (p.kind === 'ref') {
      fireUpdateRef(item, p.refType);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  Attach / Detach MEDIA via Scenario G
  // ═══════════════════════════════════════════════════════════════
  function fireAttachMedia(item, role, replaceMediaId) {
    var mediaId = item.mediaId || item.id;
    var roleKey = CFG.pickerRoleMap[role];
    var roleHash = CFG.tenant.roleHash(roleKey);
    var url = CFG.tenant.makeStudio();

    if (!roleHash) {
      S.picker.inFlight = false;
      render();
      toast('Missing componentRole hash for ' + role + ' — check TA_CONFIG.optionIds', 'error');
      return;
    }

    var payload = {
      action:        'attachComponent',
      attachKind:    roleKey,
      titleSlug:     CFG.tenant.titleSlug(),
      taItemId:      CFG.tenant.taItemId(),
      mediaItemId:   mediaId,
      articleItemId: S.article.id,
      componentRole: roleHash,
      source:        'asf-v' + VERSION
    };
    if (replaceMediaId) payload.replaceMediaItemId = replaceMediaId;

    log('attachComponent payload', payload);

    if (!url) {
      S.picker.inFlight = false;
      render();
      toast('makeStudio URL not configured in TA_CONFIG — see console for payload', 'error');
      console.log('[ASF v' + VERSION + '] would POST attachComponent →', payload);
      return;
    }

    fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (body) {
        var ok = false;
        try { var j = JSON.parse(body); if (j && j.ok === true) ok = true; }
        catch (e) { /* not JSON */ }
        if (!ok) throw new Error('Scenario did not confirm (empty or non-{ok:true} response)');

        // Optimistic local update — flip item to Attached, set articleId.
        item.status    = 'Attached';
        item.articleId = S.article.id;
        if (role === 'main-image' || role === 'og-image') {
          S.article.mainImageSrc = item.imageUrl || S.article.mainImageSrc;
        }
        // Mark picker as done, close, re-render
        S.picker.inFlight = false;
        var done = S.picker.onConfirm;
        pickerClose();
        toast('Attached ' + (role === 'interior-image' ? 'inline image' : role.replace('-', ' ')), 'success');
        if (typeof done === 'function') done(item);
        // Re-hydrate MEDIA in case Scenario G changed other rows
        S.media = hydrateMedia(S.article.id);
        render();
      })
      .catch(function (err) {
        S.picker.inFlight = false;
        warn('attachComponent failed', err);
        toast('Attach failed — ' + (err && err.message ? err.message : 'unknown error'), 'error');
        render();
      });
  }

  function fireDetachMedia(mediaId, role) {
    var url = CFG.tenant.makeStudio();
    var payload = {
      action:        'detachComponent',
      titleSlug:     CFG.tenant.titleSlug(),
      taItemId:      CFG.tenant.taItemId(),
      mediaItemId:   mediaId,
      articleItemId: S.article.id,
      role:          role,
      source:        'asf-v' + VERSION
    };
    log('detachComponent payload', payload);
    if (!url) {
      toast('makeStudio URL not configured — see console for payload', 'error');
      console.log('[ASF v' + VERSION + '] would POST detachComponent →', payload);
      return;
    }
    fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (body) {
        var ok = false;
        try { var j = JSON.parse(body); if (j && j.ok === true) ok = true; }
        catch (e) {}
        if (!ok) throw new Error('Scenario did not confirm');
        toast('Removed', 'success');
        S.media = hydrateMedia(S.article.id);
        if (role === 'main-image') {
          S.article.mainImageSrc = '';
          S.article.mainImageAlt = '';
        }
        render();
      })
      .catch(function (err) {
        warn('detachComponent failed', err);
        toast('Remove failed — ' + (err && err.message ? err.message : 'unknown error'), 'error');
      });
  }

  // ═══════════════════════════════════════════════════════════════
  //  CMS-ref update via Scenario G (TD-178)
  //  Make route to build: action='updateArticleRef', refField, refId.
  //  Until the route exists, this short-circuits with a placeholder toast.
  // ═══════════════════════════════════════════════════════════════
  function fireUpdateRef(item, refType) {
    var url = CFG.tenant.makeStudio();
    var fieldMap = {
      mnls:       { field: 'mnlsId',       nameField: 'mnlsName' },
      newsletter: { field: 'newsletterId', nameField: 'newsletterName' },
      customer:   { field: 'customerId',   nameField: 'customerName' },
      product:    { field: 'productId',    nameField: 'productName' }
    };
    var f = fieldMap[refType];
    if (!f) {
      S.picker.inFlight = false;
      render();
      toast('Unknown refType: ' + refType, 'error');
      return;
    }

    // v1.0.14: in create mode there's no article record yet, so we
    // skip the Scenario G call entirely. Write the ref locally; it'll
    // travel out with the createAsset payload on first Save Draft.
    if (S.mode === 'create') {
      S.article[f.field] = item.id;
      S.article[f.nameField] = item.name;
      S.picker.inFlight = false;
      pickerClose();
      toast('Set ' + (CFG.refTypes[refType] && CFG.refTypes[refType].label || refType) + ' to "' + (item.name || item.id) + '"', 'success');
      render();
      return;
    }

    var payload = {
      action:        'updateArticleRef',
      titleSlug:     CFG.tenant.titleSlug(),
      taItemId:      CFG.tenant.taItemId(),
      articleItemId: S.article.id,
      refField:      f.field,
      refId:         item.id,
      refName:       item.name,
      source:        'asf-v' + VERSION
    };
    log('updateArticleRef payload', payload);

    if (!url) {
      S.picker.inFlight = false;
      render();
      toast('makeStudio URL not configured — see console for payload', 'error');
      console.log('[ASF v' + VERSION + '] would POST updateArticleRef →', payload);
      return;
    }

    fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (body) {
        var ok = false;
        try { var j = JSON.parse(body); if (j && j.ok === true) ok = true; }
        catch (e) {}
        if (!ok) throw new Error('Scenario did not confirm — likely the updateArticleRef Make route is not yet built. Build it as Scenario G Route N with shape { action: "updateArticleRef", refField, refId } and have it write to the Article CMS record.');
        // Optimistic local update
        S.article[f.field] = item.id;
        S.article[f.nameField] = item.name;
        S.picker.inFlight = false;
        pickerClose();
        toast('Updated ' + CFG.refTypes[refType].label, 'success');
        render();
      })
      .catch(function (err) {
        S.picker.inFlight = false;
        warn('updateArticleRef failed', err);
        toast('Update failed — ' + (err && err.message ? err.message : 'unknown error'), 'error');
        render();
      });
  }

  // ═══════════════════════════════════════════════════════════════
  //  UPLOAD flow — Uploadcare browser-direct → Scenario B
  //
  //  1. User clicks Upload → file input
  //  2. POST file to Uploadcare Upload API (multipart, public key auth)
  //  3. Receive { file: <uuid> }
  //  4. POST uuid + context to Scenario B (makeConditioner) — Make
  //     creates the MEDIA row + (optionally) auto-attaches.
  //  5. On success → re-hydrate MEDIA, optionally trigger attach.
  // ═══════════════════════════════════════════════════════════════
  function ensureFileInput() {
    if (S.fileInput && S.fileInput.parentNode) return S.fileInput;
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;';
    inp.addEventListener('change', onFileInputChange);
    document.body.appendChild(inp);
    S.fileInput = inp;
    return inp;
  }

  function onFileInputChange(e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var role = e.target.getAttribute('data-asf-upload-role') || 'main-image';
    fireUpload(f, role);
    // Reset so the same file can be picked again later
    e.target.value = '';
  }

  function fireUpload(file, role) {
    var pubKey = CFG.tenant.uploadcareKey();
    if (!pubKey) {
      toast('Uploadcare key not configured in TA_CONFIG', 'error');
      return;
    }

    toast('Uploading ' + file.name + '...', 'info');

    var form = new FormData();
    form.append('UPLOADCARE_PUB_KEY', pubKey);
    form.append('UPLOADCARE_STORE', 'auto');
    form.append('file', file);

    fetch('https://upload.uploadcare.com/base/', {
      method: 'POST',
      body:   form
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Uploadcare HTTP ' + r.status);
        return r.json();
      })
      .then(function (j) {
        if (!j || !j.file) throw new Error('Uploadcare returned no file UUID');
        return notifyScenarioB(j.file, file, role);
      })
      .then(function () {
        toast('Upload complete — file conditioned and added to MEDIA', 'success');
        // Re-hydrate so the new item is visible in the picker
        S.media = hydrateMedia(S.article.id);
        render();
      })
      .catch(function (err) {
        warn('upload failed', err);
        toast('Upload failed — ' + (err && err.message ? err.message : 'unknown error'), 'error');
      });
  }

  function notifyScenarioB(uploadcareUuid, file, role) {
    var url = CFG.tenant.makeConditioner();
    var roleKey = CFG.pickerRoleMap[role];
    var roleHash = CFG.tenant.roleHash(roleKey);
    var a = S.article || {};
    var payload = {
      action:           'createMediaFromBrowserUpload',
      uploadcareUuid:   uploadcareUuid,
      uploadcareUrl:    CFG.tenant.uploadcareBase() + '/' + uploadcareUuid + '/',
      originalFilename: file.name,
      mimeType:         file.type || 'image/jpeg',
      size:             file.size,
      titleSlug:        CFG.tenant.titleSlug(),
      taItemId:         CFG.tenant.taItemId(),
      articleItemId:    a.id || '',
      customerId:       a.customerId || '',
      productId:        a.productId || '',
      mnlsId:           a.mnlsId || '',
      componentRole:    roleHash,
      componentRoleKey: roleKey,
      autoAttach:       true,    // Scenario B should attach to article on success
      sourceChannel:    'asf-upload',
      source:           'asf-v' + VERSION
    };
    log('createMediaFromBrowserUpload payload', payload);

    if (!url) {
      console.log('[ASF v' + VERSION + '] would POST createMediaFromBrowserUpload →', payload);
      throw new Error('makeConditioner URL not configured — payload logged to console');
    }

    return fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error('Scenario B HTTP ' + r.status);
      return r.text();
    }).then(function (body) {
      var ok = false;
      try { var j = JSON.parse(body); if (j && j.ok === true) ok = true; }
      catch (e) {}
      if (!ok) throw new Error('Scenario B did not confirm — likely the createMediaFromBrowserUpload Make route is not yet built. Build it as a new Scenario B route that creates a MEDIA row from { uploadcareUuid, articleItemId, componentRole } and (if autoAttach) calls attachComponent.');
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  Set OG from main image — copy main image URL to OG slot.
  //  No picker; if there's no main image yet, prompt to attach one.
  // ═══════════════════════════════════════════════════════════════
  function fireSetOgFromMain() {
    var mainMedia = findMediaByRole('main-image');
    if (!mainMedia && !S.article.mainImageSrc) {
      toast('Attach a main image first', 'info');
      return;
    }
    // Reuse attach with role='og-image', mediaItemId=main image's mediaId
    if (mainMedia) {
      fireAttachMedia(mainMedia, 'og-image', null);
    } else {
      toast('Main image attached but no MEDIA row found — OG fallback uses main URL automatically', 'info');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  PICKER · RENDER
  //  Mounted as a sibling inside .ta-asf (above .asf-overlay).
  //  Returns HTML string; render() concatenates it after the panel.
  // ═══════════════════════════════════════════════════════════════
  function renderPicker() {
    var p = S.picker;
    if (!p.open) return '';

    var headerHtml = '' +
      '<div class="asf-pick-head">' +
        '<div class="asf-pick-title">' + esc(p.title) + '</div>' +
        '<button type="button" class="asf-pick-close" aria-label="Close picker" data-asf-action="picker-close">×</button>' +
      '</div>';

    var filtersHtml = '';
    if (p.kind === 'media') {
      var customers = readCustomers();
      var products = readProducts();
      var custOpts = '<option value="all">All customers</option>' +
        customers.map(function (c) {
          var sel = c.id === p.filterCustomer ? ' selected' : '';
          return '<option value="' + esc(c.id) + '"' + sel + '>' + esc(c.name) + '</option>';
        }).join('');
      var prodOpts = '<option value="all">All products</option>' +
        products.map(function (pr) {
          var sel = pr.id === p.filterProduct ? ' selected' : '';
          return '<option value="' + esc(pr.id) + '"' + sel + '>' + esc(pr.name) + '</option>';
        }).join('');
      filtersHtml = '' +
        '<div class="asf-pick-filters">' +
          '<input type="text" class="asf-pick-search" placeholder="Search by name…"' +
            ' value="' + esc(p.filterSearch) + '" data-asf-pick-filter="search">' +
          '<select class="asf-pick-fsel" data-asf-pick-filter="customer">' + custOpts + '</select>' +
          '<select class="asf-pick-fsel" data-asf-pick-filter="product">' + prodOpts + '</select>' +
        '</div>';
    } else {
      // Ref picker: just a search box
      filtersHtml = '' +
        '<div class="asf-pick-filters">' +
          '<input type="text" class="asf-pick-search" placeholder="Search…"' +
            ' value="' + esc(p.filterSearch) + '" data-asf-pick-filter="search">' +
        '</div>';
    }

    var gridHtml;
    if (p.items.length === 0) {
      gridHtml = '<div class="asf-pick-empty">' +
        (p.kind === 'media'
          ? 'No available items match these filters. Try clearing the filters, or upload a new image.'
          : 'No items found.') +
      '</div>';
    } else if (p.kind === 'media') {
      gridHtml = '<div class="asf-pick-grid">' +
        p.items.map(function (m) { return renderPickerMediaCard(m); }).join('') +
      '</div>';
    } else {
      gridHtml = '<div class="asf-pick-list">' +
        p.items.map(function (it) { return renderPickerRefRow(it); }).join('') +
      '</div>';
    }

    var canConfirm = !!p.selectedId && !p.inFlight;
    var confirmLabel;
    if (p.inFlight) confirmLabel = 'Working…';
    else if (p.kind === 'media') confirmLabel = 'Attach selected';
    else confirmLabel = 'Use selected';

    var footHtml = '' +
      '<div class="asf-pick-foot">' +
        '<button type="button" class="asf-pick-btn ghost" data-asf-action="picker-close"' +
          (p.inFlight ? ' disabled' : '') + '>Cancel</button>' +
        '<button type="button" class="asf-pick-btn primary" data-asf-action="picker-confirm"' +
          (canConfirm ? '' : ' disabled') + '>' + esc(confirmLabel) + '</button>' +
      '</div>';

    return '' +
      '<div class="asf-pick-overlay" data-asf-action="picker-backdrop">' +
        '<div class="asf-pick-modal" role="dialog" aria-label="' + esc(p.title) + '">' +
          headerHtml +
          filtersHtml +
          '<div class="asf-pick-body">' + gridHtml + '</div>' +
          footHtml +
        '</div>' +
      '</div>';
  }

  function renderPickerMediaCard(m) {
    var p = S.picker;
    var isSelected = p.selectedId === (m.mediaId || m.id);
    var thumbHtml;
    var imageUrl = m.imageUrl || '';
    if (imageUrl) {
      thumbHtml = '<div class="asf-pick-thumb">' +
        '<img class="asf-pick-thumb-img" src="' + esc(imageUrl) + '" alt="' + esc(m.name || '') + '" loading="lazy">' +
      '</div>';
    } else {
      thumbHtml = '<div class="asf-pick-thumb empty"><span>' + esc(m.mediaType || 'Media') + '</span></div>';
    }
    var customerProduct = '';
    if (m.customerName) customerProduct += esc(m.customerName);
    if (m.productName)  customerProduct += (customerProduct ? ' · ' : '') + esc(m.productName);
    return '' +
      '<div class="asf-pick-card' + (isSelected ? ' selected' : '') + '"' +
        ' data-asf-pick-id="' + esc(m.mediaId || m.id) + '">' +
        thumbHtml +
        '<div class="asf-pick-card-body">' +
          '<div class="asf-pick-card-name">' + esc(m.name || '(Untitled)') + '</div>' +
          (customerProduct ? '<div class="asf-pick-card-sub">' + customerProduct + '</div>' : '') +
        '</div>' +
      '</div>';
  }

  function renderPickerRefRow(it) {
    var p = S.picker;
    var isSelected = p.selectedId === it.id;
    var sub = '';
    if (it.issueNo) sub = 'Issue ' + esc(it.issueNo) + (it.date ? ' · ' + esc(it.date) : '');
    return '' +
      '<div class="asf-pick-row' + (isSelected ? ' selected' : '') + '" data-asf-pick-id="' + esc(it.id) + '">' +
        '<div class="asf-pick-row-name">' + esc(it.name || it.id) + '</div>' +
        (sub ? '<div class="asf-pick-row-sub">' + sub + '</div>' : '') +
        (isSelected ? '<div class="asf-pick-row-mark">✓</div>' : '') +
      '</div>';
  }

  // ═══════════════════════════════════════════════════════════════
  //  PUBLIC API — window.InbxASF
  //
  //  open({ articleId })       → mount + render (edit mode, returns true on success)
  //  open({ articleItemId })   → same (alias for Studio-side caller parity)
  //  open({ mode: 'create' })  → mount + render (create mode, blank state)
  //  open({ mode: 'create', prefill: { name, subtitle, teaser, ... } })
  //                            → create mode with caller-supplied field values
  //                              (v1.0.17 · TD-186 · used by Transcriber and
  //                              other intake surfaces to launch ASF with
  //                              parsed content already populated; null /
  //                              empty-string values are skipped, not faked)
  //  open({ mode: 'create', prefill: {...}, sourceImages: [url, url, ...] })
  //                            → also renders the T2 source-screenshots
  //                              strip in the main column so the operator
  //                              can cross-reference the parse against the
  //                              originals (v1.1.0)
  //  close()                   → unmount + reset state
  //  isOpen()                  → boolean
  //  version                   → '1.1.0'
  //
  //  _internal is exposed for Chunk C wiring + console debugging.
  //  Not part of the stable public contract; may change without notice.
  // ═══════════════════════════════════════════════════════════════
  function publicOpen(params) {
    params = params || {};
    var mode = params.mode === 'create' ? 'create' : 'edit';
    var articleId = params.articleId || params.articleItemId;

    if (mode === 'edit' && !articleId) {
      warn('open(): articleId is required for edit mode');
      return false;
    }
    if (S.open) {
      warn('open(): already open; closing previous instance');
      publicClose();
    }

    // ── Hydrate or initialize ──
    if (mode === 'create') {
      // v1.0.10: blank state, T-A + Title from TA_CONFIG
      S.article = blankArticle();
      S.media   = [];
      log('open() · CREATE MODE', { taItemId: S.article.taItemId, titleName: S.article.titleName });
    } else {
      S.article = hydrateArticle(articleId);
      if (!S.article) {
        warn('open(): could not hydrate article', articleId);
        return false;
      }
      S.media   = hydrateMedia(articleId);
      log('open()', { articleId: articleId, name: S.article.name, mediaCount: S.media.length });
    }

    S.mode             = mode;
    S.articleType      = 'standard';
    S.rtpExpanded      = true;
    S.rtpNAState       = {};
    S.rtpManualState   = {};
    S.editingSection   = null;
    S.dirtyFields      = {};
    S.dirtySections    = {};
    S.newsletterChoice = null;
    S.bodyEditOpen     = false;
    S.saving           = false;
    S.techDrawerOpen   = false;
    S.listenersBound   = false;

    // v1.1.0 — Source screenshots strip (T2). Caller (typically the
    // Transcriber) passes an array of image URLs so the operator can
    // cross-reference the parse against the originals. Omitted when
    // ASF is launched from any other entry surface.
    S.sourceImages = Array.isArray(params.sourceImages) ? params.sourceImages.slice() : null;

    // v1.1.3 — inline image picker state. Always starts closed.
    // Sidebar flips to picker mode when the body editor's "Insert
    // inline image" button fires open-inline-image-picker.
    S.inlinePicker = {
      open:            false,
      tab:             'available',   // 'available' | 'attached'
      expandedBundles: {},            // bundleId → true
      search:          ''
    };

    // Snapshot originals BEFORE first render (revert source + dirty compare).
    snapshotOriginals();

    // v1.0.17 — TD-186: apply create-mode prefill AFTER snapshotOriginals,
    // so prefilled values count as dirty (Cancel-section reverts to blank,
    // not to the prefilled value). Caller passes only the fields they
    // have a value for — unidentified fields stay blank for the publisher
    // to fill manually. No AI fallback inside ASF.
    if (mode === 'create' && params.prefill && typeof params.prefill === 'object') {
      applyPrefill(params.prefill);
    }

    mount();
    render();
    S.open = true;

    // Async: fetch real newsletter list from HC-16 (stub fallback baked in).
    fetchNewsletters();

    return true;
  }

  function publicClose() {
    if (!S.open) return;
    log('close()');
    unmount();
    S.open             = false;
    S.mode             = 'edit';  // v1.0.10: reset for next open
    S.article          = null;
    S.media            = [];
    S.dirtyFields      = {};
    S.dirtySections    = {};
    S.editingSection   = null;
    S.newsletterChoice = null;
    S.bodyEditOpen     = false;
  }

  function publicIsOpen() { return !!S.open; }

  window.InbxASF = {
    open:    publicOpen,
    close:   publicClose,
    isOpen:  publicIsOpen,
    version: VERSION,

    // Internal — Chunk C wiring. Read-only contract: do NOT mutate
    // S or CFG from outside the IIFE; use the public API. Exposed
    // for console-debug and integration tests only.
    _internal: {
      state:                S,
      cfg:                  CFG,
      render:               render,
      computeRTP:           computeRTP,
      rtpReadyState:        rtpReadyState,
      hydrateArticle:       hydrateArticle,
      hydrateMedia:         hydrateMedia,
      launchBodyEditor:     launchBodyEditor,
      // Chunk C
      toast:                toast,
      commitSaveDraft:      commitSaveDraft,
      commitPublishAndSlot: commitPublishAndSlot,
      fetchNewsletters:     fetchNewsletters,
      snapshotOriginals:    snapshotOriginals,
      tryRestore:           tryRestore
    }
  };

  log('mounted · v' + VERSION + ' · ASF v2 layout — Chunk 4 of 4 COMPLETE (main+OG side-by-side · legacy renderers pruned · ASF v1.1.x done).');
})();
