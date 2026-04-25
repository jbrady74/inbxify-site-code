// ============================================================
// ta-studio-v1.2.6.js
// INBXIFY TA Studio — Assembler field-level Attach (Phase 3 / S8)
// Editable Assembler (Articles) — LIVE save via Scenario G.
//
// Mounts into #studio-mount on the T-A page.
//
// ──────────────────────────────────────────────────────────
// v1.2.6 (Session 8 polish — disable Delete permanently):
//
//   DISABLE: hard delete (the "Delete permanently" overflow
//   menu item on Components-tab cards) is removed from the
//   UI for now.
//
//   Why: Scenario G Route 5's hard_delete sub-route deletes
//   the MEDIA row from Webflow's CMS but does NOT trigger a
//   site republish. The deleted item remains rendered in the
//   T-A page's .media-wrapper collection list HTML until the
//   next manual or scheduled republish, so the post-reload
//   Components tab keeps showing the deleted card. UX broken.
//
//   Adding webflow:publishSite to the sub-route would fix
//   the rendering but pushes ALL pending CMS edits and
//   Designer changes site-wide, which is too invasive.
//
//   Path forward (next update): client-side filter for
//   recently-hard-deleted IDs in sessionStorage, persisted
//   until the next manual site publish refreshes the HTML.
//   That's deferred to a later session.
//
//   v1.2.6 changes:
//
//   (1) Overflow menu's "Delete permanently" button no longer
//       renders. The 3-dot ⋯ overflow button itself stays
//       (no other overflow items today, but the affordance
//       is preserved for future additions).
//
//   (2) cmpHandleDelete short-circuits with a toast if
//       somehow invoked anyway: "Delete permanently is
//       temporarily disabled. Use Archive instead."
//
//   Archive remains fully functional. Attach paths
//   unchanged.
//
// ──────────────────────────────────────────────────────────
// v1.2.5 (Session 8 polish — outer tab activation fix):
//
//   FIX: v1.2.4's studioActivateOuterTab() used best-effort
//   selector lookups (data-ta-tab, data-tab, #studio-tab,
//   etc.) which all missed because the T-A page actually
//   uses Webflow native tabs (.w-tab-link) with a custom
//   .tab-button proxy layer (per body.js line 263–268).
//
//   v1.2.5: studioActivateOuterTab now matches body.js's
//   proven pattern:
//     1. Find .tab-button with text "Studio" — click it
//        (this triggers body.js's handler which proxies to
//        the matching .w-tab-link via :contains).
//     2. Fallback: directly click the .w-tab-link with text
//        "Studio" if .tab-button isn't found.
//
//   This is a one-click guaranteed activation, not best-
//   effort — body.js's pattern is documented in the source.
//
// ──────────────────────────────────────────────────────────
// v1.2.4 (Session 8 polish — restore state across reload + reload UX):
//
//   Two changes from v1.2.3:
//
//   (1) Persist Studio state across the post-write reload.
//       v1.2.3 reloaded the page after every CMS write, but the
//       reload landed the user on the default outer T-A tab
//       (PubPlan), losing all Studio context.
//
//       Fix: before reload, save to sessionStorage:
//         - sub-panel (input | components | assembler)
//         - selectedAssetId (open article, if any)
//         - cmp filter state (search, role, etc.) so the
//           Components grid restores its filtered view
//
//       On Studio mount, read sessionStorage and:
//         - Click the outer "Studio" tab (best-effort lookup
//           by text content if a tab-nav element exists)
//         - Set the saved sub-panel
//         - Re-open the saved article (if applicable)
//         - Restore cmp filters
//
//       Storage key: 'ta-studio-restore-v1'. Cleared after
//       restore consumes it, so a manual reload doesn't keep
//       restoring stale state.
//
//   (2) Persistent banner during the reload wait window.
//       v1.2.3's toast fades out before reload kicks in,
//       leaving a 1–2 second dead zone where the user
//       wonders if anything is happening.
//
//       Fix: studioReloadAfterCMSWrite now renders an
//       inline "Refreshing…" banner with an animated
//       progress bar. Banner persists until reload starts.
//       Replaces the toast emission inside reload paths so
//       the user sees one continuous "saved → refreshing"
//       affordance instead of a fading toast then nothing.
//
//       Banner CSS lives in ta-studio-components-v1.0.5.css —
//       added in this session (.studio-reload-banner).
//
// ──────────────────────────────────────────────────────────
// v1.2.3 (Session 8 patch — auto-reload after CMS writes):
//
//   ADD: After every successful CMS write that touches the
//   Article record's data-bound attributes (.articles-wrapper,
//   .media-wrapper, hidden Collection Lists), the page is
//   reloaded so the user sees fresh data without manual
//   refresh.
//
//   Why: Webflow's static T-A page renders CMS data into
//   data-* attributes at publish time. Scenario G's
//   webflow:publishAnItem modules publish the CHANGED CMS
//   ITEM, but the T-A page's hidden Collection Lists serve
//   from the page's own published HTML — which doesn't
//   refresh until the page is re-fetched. The JS reads from
//   those data-attributes (article model, MEDIA cache), so
//   stale attributes mean stale UI even though the underlying
//   CMS data is live.
//
//   Path C from S8 design discussion: rely on Scenario G's
//   existing webflow:publishAnItem modules (no new Make work,
//   no Worker proxy needed). After confirming success, wait
//   long enough for the user to see the toast, then reload.
//
//   New helper: studioReloadAfterCMSWrite(delayMs).
//   Default delayMs = 1500 — enough to register the success
//   toast visually but fast enough to feel responsive.
//
//   Applied to all five CMS write success paths:
//     1. Field save (Save bar)            — Route 2 / updateArticleFields
//     2. Body editor save (RTE)           — Route 3 / updateArticleBody
//     3. Assembler picker attach          — Route 4 / attachComponent (NEW in S8)
//     4. Components-tab attach            — Route 4 / attachComponent
//     5. Components-tab archive/delete    — Route 5 / deleteComponent
//
//   Field save's existing 1200ms "auto-return to picker"
//   timeout is replaced by the reload — the user lands on
//   a fresh picker with the saved article visible in the
//   correct (just-updated) state.
//
//   beforeunload guard auto-clears: the success path promotes
//   current → loaded, so countDirty() === 0 by the time
//   reload fires. No "you have unsaved changes" prompt.
//
// ──────────────────────────────────────────────────────────
// v1.2.2 (Session 8 patch — derive role hash from slot, not item):
//
//   FIX: v1.2.1 changed the picker to show any Available image
//   regardless of existing Component Role. But asmFireAttach
//   still derived the role hash from `it.role` — the picked
//   MEDIA's CURRENT role label. For S7-conditioned rows this
//   is empty (role is unassigned at conditioning time), so
//   getRoleHash('') returned empty and the attach short-
//   circuited with "Configuration error — unknown role".
//
//   v1.2.2: derive the role hash from the SLOT the picker
//   was opened from. The slot encodes intent ('mainImage' or
//   'interiorImage'), and that intent IS the role assignment.
//   Single-line fix in asmFireAttach.
//
//   New helper: getRoleHashForSlot(slot) — maps slot key
//   directly to the Component Role hash via TA_CONFIG.
//   Bypasses ROLE_LABEL_TO_KEY (which goes label → key) since
//   the slot key already matches the TA_CONFIG key.
//
//   Components-tab attach (cmpFireAttach) is unchanged — it
//   still derives role from `it.role` because Components-tab
//   attach only fires for items that already have a role
//   set (gated by isAttachEnabledRole check in cmpHandleAttach).
//
// ──────────────────────────────────────────────────────────
// v1.2.1 (Session 8 patch — picker filter correction):
//
//   FIX: v1.2.0's picker locked Component Role to the slot's
//   role label and only showed MEDIA rows where role already
//   matched. This was wrong because S7's pipeline writes
//   Component Role = empty at conditioning time — role is
//   assigned by the publisher AT ATTACH TIME, not before.
//   The locked-role filter excluded essentially every fresh
//   conditioned image, leaving the picker empty for Main
//   Image attaches.
//
//   v1.2.1 changes:
//
//   (1) Picker candidate filter is now:
//         status === 'Available'
//         AND mediaType === 'Image'  (excludes Text/Audio/Video
//                                      from image slots)
//         AND customer match (default All)
//       Component Role is NOT a filter. Existing role values
//       on MEDIA rows are ignored — role is overwritten at
//       attach time per the slot's intent.
//
//   (2) Picker header drops the "Role: ___" lock pill. Only
//       "Status: Available" remains. The picker title still
//       reads "Pick a Main Image" / "Pick an Interior Image"
//       to communicate publisher intent.
//
//   (3) Product narrowing filter dropped (per S8 user
//       feedback — rarely useful in practice). Customer is
//       the only narrowing filter.
//
//   (4) Re-attach behavior: pickers show Status=Available
//       components only. Status=Attached components are NOT
//       shown — pulling an attached image off another article
//       is out of scope for S8 (would need explicit detach
//       UX). Role overwriting on Available rows is allowed
//       (and is the new default — see #1).
//
//   SERVER-SIDE COROLLARY (Scenario G Route 4):
//   Route 4 must now ALSO write MEDIA.Component Role on every
//   attach. Today (per Interior Image test) it sets Status +
//   ARTICLE ref but not role — because v1.1.x assumed role
//   was already set. v1.2.1 makes role assignment a write,
//   not a precondition.
//     Route 4b (Main Image attach):
//       MEDIA: Status=Attached, ARTICLE ref, Component Role=Main Image
//       Article: main-image-ulc-link = MEDIA.imageUrl
//                (+ ratio variants if you bind them)
//     Route 4c (Interior Image attach):
//       MEDIA: Status=Attached, ARTICLE ref, Component Role=Interior Image
//       Article: media-items append (with dedupe per F-P1 formula)
//
// ──────────────────────────────────────────────────────────
// v1.2.0 (Session 8 — Assembler field-level Attach):
//
//   Three changes from v1.1.9:
//
//   (1) Assembler Media column — Main Image slot gains Attach.
//       Replaces the v1.1.9 "Phase 3+ (Uploadcare picker)"
//       placeholder and the passive "No main image" empty state.
//
//       Empty state: slot shows a primary [Attach Main Image]
//       button. Click → slot expands inline into a mini-picker
//       (same vertical-grow pattern as Components-tab State B).
//
//       Picker filters: Component Role = Main Image (locked),
//       Status = Available (locked), Customer + Product
//       narrowing dropdowns (default All).
//
//       User clicks a Component card to select (distinctive
//       border via .asm-pick-card--selected). Footer shows
//       [Confirm] [Cancel]. Confirm fires Route 4 with
//       attachKind=mainImage; on success the slot collapses,
//       image preview snaps in, Article main-image-ulc-link
//       (and the four ratio variants) populate.
//
//       Populated state: preview + small "Replace" text link
//       opens the same picker. Replace overwrites the URL
//       fields on the Article; the previously-attached MEDIA
//       row is NOT touched (TD-132 — MEDIA canonicalization
//       parked for post-Studio).
//
//   (2) Assembler Media column — Interior Images slot.
//       Replaces the v1.1.9 "Interior-image gallery arrives in
//       a later phase" stub.
//
//       Renders a gallery of currently-attached Interior Image
//       MEDIA (read from Article.mediaItems hydrated by
//       Scenario G read paths) plus a persistent
//       [+ Attach Interior Image] button below the gallery.
//
//       Click → same picker pattern, Component Role = Interior
//       Image (locked), Status = Available (locked).
//       Confirm fires Route 4 with attachKind=interiorImage;
//       Route 4 sets MEDIA.ARTICLE ref AND appends the
//       MEDIA itemId to Article.media-items (multi-attach,
//       MRF semantics — Article-side append is explicit per
//       the F-P1 dedupe formula contract).
//
//   (3) Role hashes sourced from TA_CONFIG.optionIds.componentRole.
//       Closes TD-130. The static ROLE_HASHES map at
//       v1.1.9 lines 2740–2744 is deleted. JS reads from
//       window.TA_CONFIG.optionIds.componentRole.{mainImage,
//       interiorImage, articleBodyHtml, ...11 total}.
//
//       If TA_CONFIG.optionIds.componentRole is missing or
//       partial, JS logs an explicit error to console and
//       Attach buttons for the missing roles render disabled
//       with a tooltip: "Role hash not configured — see
//       TA_CONFIG.optionIds.componentRole".
//
//   ARCHITECTURAL NOTES:
//
//   - The Assembler picker reuses the .cmp-card design language
//     from the Components tab. Same thumb chrome, same name +
//     meta lines, same status dot. Selected state adds a
//     distinctive border (gold per site-wide editing-state
//     contract).
//
//   - Attach call path is unified: cmpHandleAttach (Components
//     tab) and asmHandleAttach (Assembler) both terminate at
//     postScenarioGRoute4(payload), which builds the Route 4
//     POST body. Payload differs only in attachKind:
//       mainImage      → Route 4b
//       interiorImage  → Route 4c
//       articleBodyHtml → Route 4a (Components-tab only in S8)
//
//   - Replace behavior on Main Image: overwrites Article URL
//     fields only. Previously-attached MEDIA row stays Attached
//     with stale ARTICLE ref. This is a known consequence of
//     MEDIA not being the canonical source for Main Image
//     today — tracked as TD-132.
//
//   - Interior Images detach is OUT OF SCOPE for S8. The
//     gallery shows attached MEDIA but provides no detach
//     control. Tracked as TD-133 for v1.2.x polish.
//
//   - Site-wide editing-state contract enforced:
//       * Picker holds selection while user navigates filters
//       * Selected card has distinctive border
//       * Cancel text link reverts to closed state
//       * Confirm shows ATTACHING… + spinner if >1.5s
//       * Toast on success (4s) and failure (red, 6s)
//
//   DEPLOYMENT PREREQUISITES FOR v1.2.0:
//   - TA_CONFIG.optionIds.componentRole block must be present
//     in page head with all 11 role hashes (mainImage,
//     interiorImage, logo, sidebarAd, bannerAd, articleBodyHtml,
//     eventFlyer, listingPhoto, headshot, videoFile, audioFile).
//   - ta-studio-components-v1.0.5.css must be loaded (adds
//     .asm-pick-* classes for the in-Assembler picker).
//   - No Webflow binding changes.
//
// ──────────────────────────────────────────────────────────
// v1.1.9 (Session 6B patch — role hash lookup + failure UX):
//
//   Two changes from v1.1.8:
//
//   (1) Role hash resolution moved to in-JS lookup.
//       v1.1.8 tried to read data-component-role-hash from the
//       .media-wrapper DOM element. This required a second
//       Webflow Designer attribute binding, which proved
//       impractical: Webflow only allows ONE value per attribute
//       binding (Option Name OR Option Hash, not both).
//       data-component-role is already bound to Option Name
//       for filter labels, so binding the same field to Hash on
//       a second attribute attempted to resolve as Name again
//       (producing data-component-role-hash="Interior Image"
//       which got sent to Route 4 as the literal label,
//       failing the Router filter — Scenario G died silently).
//
//       Fix: a static ROLE_HASHES map in this JS file maps role
//       label → option hash for the three enabled roles. Route 4
//       payload uses the lookup result. No DOM attribute reads.
//       The hashes are schema-stable (same 11 roles in MEDIA
//       Component Role field, Scenario G Router, and this map).
//       If Webflow schema adds a new role, this JS needs a new
//       ROLE_HASHES entry OR the Attach button for that role
//       silently stubs out — tech debt logged as HC-009.
//
//       The CMP_ATTACH_ENABLED_ROLES array from v1.1.8 is now
//       implicit in ROLE_HASHES.keys — no separate constant.
//
//   (2) Half-committed-state failure UX.
//       When Route 4 fails mid-flight (network error, Webflow
//       API reject, Make scenario-level error after MEDIA-side
//       writes have already committed), v1.1.8 flipped the card
//       back to State A with a generic failure toast. This
//       hid the fact that MEDIA rows may already have Status =
//       Attached and an Article ref set — the visible UI said
//       "retry" but the backend was half-committed.
//
//       v1.1.9: on Route 4 failure, card STAYS in State B with
//       an inline red error bar inside the editing panel. Error
//       text: "Attach failed — MEDIA may be in partial state.
//       Refresh the page to see current state." The Attach button
//       is disabled until user clicks Cancel (which does NOT
//       retry — just clears State B). Cleaner than letting the
//       user blindly re-click on corrupt records.
//
//   DEPLOYMENT PREREQUISITES FOR v1.1.9:
//   - Remove any data-component-role-hash attribute binding
//     from .media-wrapper[data-item] in Webflow Designer. It
//     is no longer read by any code path and is confusing
//     dead schema.
//   - No other Webflow binding changes.
//
// ──────────────────────────────────────────────────────────
// v1.1.8 (Session 6B — Components tab Attach UI via Scenario G Route 4):
//
//   The Attach button on Components-tab cards is now live for
//   three Component Roles: Article Body HTML, Main Image, and
//   Interior Image. Clicking Attach expands the card inline
//   (State B — editing) with a Status filter (Draft default,
//   Live, All) + an Article picker. Once an Article is picked,
//   the picker gets a 2px gold border as the pending-change
//   signal, and the Attach button becomes enabled as primary.
//   Clicking Attach fires Scenario G Route 4, which:
//     4a  Article Body HTML → writes Article.post-body
//     4b  Main Image        → writes Article.main-image-ulc-link,
//                             Alt Text, and Main Image GET Link
//     4c  Interior Image    → appends MEDIA to Article.media-items
//                             via explicit reciprocal-ref write
//                             (Webflow API does not auto-sync
//                             reciprocal refs — discovered
//                             during Session 6B Checkpoint B).
//   In all three branches, MEDIA.Status flips Available →
//   Attached and MEDIA.article ref populates.
//
//   What ships:
//   - State machine: cards in State A (Available) show [Attach]
//     button as primary. Click transitions to State B. Only one
//     card can be in State B at a time — clicking Attach on a
//     second card auto-cancels the first.
//   - State B editing UI: Status dropdown (Draft/Live/All,
//     default Draft) + Article picker populated from
//     .articles-wrapper, sorted most-recently-created first.
//     Picker repopulates when Status changes.
//   - Gold border contract: picker gains 2px #C4A35A border
//     when a selection is held (via .cmp-picker--active class).
//     Matches the editing-state visual contract from
//     ta-studio-components-v1.0.2.css.
//   - Cancel text link: small gold underlined link next to
//     Attach button; reverts to State A. ESC key does the same.
//   - Attach confirm: button shows "ATTACHING…" disabled during
//     fetch. On success (strict ok:true in response body, per
//     v1.1.7.2 pattern), card flips to State C (Attached) with
//     attached-Article title rendered under role line, IDs
//     exposed on card, button disabled + relabeled "Attached".
//     Toast top-right, 4s duration: "Attached to [Article Title]".
//   - Role gating: only Article Body HTML, Main Image, Interior
//     Image show the State B editing UI. The other 9 roles
//     (Logo, Sidebar Ad, Banner Ad, Event Flyer, Listing Photo,
//     Headshot, Video File, Audio File) keep a stub toast:
//     "Field-level attach for [role] ships in Session 8."
//   - Failure handling: non-200 response, network error, OR
//     empty/non-confirming body leaves card in State B with
//     enabled button and red toast "Attach failed — please retry".
//     Strict ok-check follows v1.1.7.2 pattern (prevents silent
//     success when Scenario G's data store doesn't pass the
//     webhook bundle downstream).
//
//   DEPLOYMENT PREREQUISITES beyond v1.1.7.3:
//   1. Webflow Designer: add data-component-role-hash attribute
//      binding on .media-wrapper[data-item] element, bound to
//      MEDIA → Component Role → Option Hash. This is what
//      Route 4's inner Router branches on — the JS sends it
//      in the attachComponent payload under componentRole key.
//      Without this binding, Attach attempts toast a
//      "Configuration error — missing role hash" and log to
//      console. Archive and delete continue to work.
//   2. Scenario G Route 4 (attachComponent) must be built and
//      reachable on the existing makeStudio webhook. Payload
//      shape: action=attachComponent, titleSlug, taItemId,
//      mediaItemId, articleItemId, componentRole (option hash).
//      Router branches on componentRole hash into 4a (Article
//      Body HTML), 4b (Main Image), 4c (Interior Image).
//
//   SCOPE EXPLICITLY DEFERRED TO SESSION 7+:
//   - Detach UI (Session 8). Detach must clear both MEDIA.article
//     AND remove the MEDIA ID from Article.media-items —
//     mirroring the explicit-both-sides write pattern from 6B.
//   - Field-level attach for the 9 non-enabled roles (Session 8).
//   - Dedupe UX for repeated attachment of the same Interior
//     Image to the same Article (currently allowed; Route 4c's
//     append formula does not dedupe).
//
// HARDCODED DECISIONS added in v1.1.8 (logged to tech debt):
//   - HC-009: Component Role hashes for the 3 enabled roles are
//     referenced by label ('Article Body HTML', 'Main Image',
//     'Interior Image') when deciding role-gating in JS. Make
//     scenario still filters on hashes server-side; client
//     uses labels for UX decisions only. Intentional — label
//     vocabulary is foundational.
//   - HC-010: Attach success toast duration = 4000ms, failure
//     duration = default 2200ms. Longer success to give the
//     Publisher time to read the attached-Article title.
//
// BACKLOG logged during Session 6B Checkpoint B (TD-):
//   - TD-122: Components tab tiles may not reflect Webflow
//     publish-state green-dot correctly. Cosmetic, not blocking.
//   - TD-123: Main Image thumbnails sometimes show broken-image
//     icon in card preview even when image-url is populated.
//     To investigate in Session 7 — likely Uploadcare transform
//     edge case or lazy-load race.
//   - TD-124: Card metadata should surface Media ID (short) and
//     Article ID (when attached) — addressed in v1.1.8 card
//     rendering.
//   - TD-125: Tenant-isolation audit of hidden CMS collection
//     lists revealed several were not filtered to Current T-A
//     (found + corrected during Session 6B). Going forward,
//     every hidden collection list on the T-A page MUST have
//     a Webflow render-time filter `TITLES-ADMIN = Current
//     TITLES-ADMIN`. Scenarios that create rows programmatically
//     (B, E, F) should fail-fast if the payload is missing
//     TITLE-ADMIN.
//
// ──────────────────────────────────────────────────────────
// v1.1.7.3 (Session 6A — search bar on Components tab):
//   New search input above the filter row. Filters by
//   data-media-name, case-insensitive, partial match
//   (includes). Debounced 150ms to avoid re-rendering on every
//   keystroke. Gold 2px border when the field has content,
//   matching the editing-state contract on dropdown filters.
//   A small × clear button appears inside the input on the
//   right when non-empty. "Clear all" resets the search input
//   too, alongside the five dropdown filters.
//
// ──────────────────────────────────────────────────────────
// v1.1.7.2 (Session 6A patch — Scenario G data store lookup):
//   Scenario G's Data store (module 2) performs a Search records
//   lookup using titleSlug(key) on every incoming request. When
//   the search finds no match, Make.com does NOT pass the original
//   webhook bundle downstream — the scenario effectively ends
//   silently at the data store with no branch firing.
//
//   v1.1.7.1 omitted titleSlug from the deleteComponent payload,
//   causing the Data store to search for titleSlug="" which
//   returned no records, killing the downstream router entirely.
//   UI showed immediate success (JS saw 2xx + empty body, treated
//   as ok=true) but Webflow was never actually touched.
//
//   Fix: add titleSlug: CFG.titleSlug to the deleteComponent
//   payload, matching the convention used by Scenario G Routes
//   1–3.
//
// ──────────────────────────────────────────────────────────
// v1.1.7.1 (Session 6A patch — drawer stacking context fix):
//   The detail drawer was rendering below the .publisher-wrapper
//   banner even with z-index 10001, because the drawer DOM lived
//   inside .dashboard-tabs (a sticky parent with z-index:50 that
//   creates a stacking context). All descendants are clamped to
//   that context — 10001 only competed within dashboard-tabs,
//   not against publisher-wrapper at z-index:100.
//
//   Fix: the drawer and backdrop are now created at
//   document.body scope on open and removed on close. This
//   takes them out of the Studio tab's stacking context so their
//   z-index (10001/10000) competes against the root document.
//
//   No visible API change, no other v1.1.7 behavior change.
//
// ──────────────────────────────────────────────────────────
// v1.1.7 (Session 6A — Components tab read surface):
//   The Components sub-tab goes live. Reads MEDIA rows from
//   the hidden .media-wrapper[data-item] collection on the T-A
//   page (filtered to current TITLES-ADMIN via Webflow native
//   filter — multi-tenancy handled at render time per the
//   Phase 3 architectural principle, no JS T-A scope check).
//
//   What ships:
//   - Components panel replaces its placeholder with a live
//     filter bar + card grid + detail drawer.
//   - Filter bar: Status (default Available), Component Role,
//     Media Type, Customer, Product. Each control gets a gold
//     2px border when holding a non-default value. Status shows
//     the gold border by default because Available is an active
//     filter. "Clear all" text link on the right resets every
//     control to default.
//   - Card grid: 3 / 2 / 1 columns responsive. Cards sort by
//     Created On descending (parsed from data-html-created via
//     new Date()). Status dot colored per status (green =
//     Available, blue = Attached, gray = Archived).
//   - Image-type cards: 16:9 thumbnail built from Image URL with
//     Uploadcare transform -/resize/560x/-/format/auto/.
//   - Text-type cards: 16:9 text preview box showing first ~280
//     chars of innerText derived from the hidden .cm-media-html
//     rich text child.
//   - Attach button: STUB only in 6A (logs selection, shows a
//     toast "Attach wiring ships in v1.1.8"). Full editing-state
//     UI with picker + Cancel link ships in 6B alongside
//     Scenario G Route 4.
//   - Archive button: LIVE. Confirms, then fires Scenario G
//     Route 5 with mode=archive. On success, card fades out if
//     current filter is Status=Available, toast confirms.
//   - Delete permanently (overflow menu): LIVE. Confirm dialog
//     text branches on whether MEDIA is attached — attached
//     rows offer [Archive] (primary) / [Delete permanently] /
//     [Cancel]; unattached rows offer [Delete permanently] /
//     [Cancel]. Fires Scenario G Route 5 with mode=hard_delete.
//   - Detail drawer: right-side panel with full MEDIA fields.
//     Image rows show large thumbnail at -/resize/1400x/-/
//     format/auto/-/quality/smart/. Text rows show rendered
//     HTML from innerHTML. "Attached to" line resolves the
//     ARTICLE ref via .articles-wrapper lookup.
//
//   DEPLOYMENT PREREQUISITES:
//   1. Webflow Designer: hidden Collection List with class
//      .media-wrapper on per-item div, filtered to current
//      TITLES-ADMIN, with these data-* attributes:
//        data-media-id, data-media-name, data-media-type,
//        data-component-role, data-status, data-article-id,
//        data-customer-id, data-product-id, data-image-url,
//        data-html-created, data-slug.
//      Child element: Rich Text field, class cm-media-html,
//      display:none, bound to HTML Content.
//   2. Scenario G Route 5 (deleteComponent) must be built and
//      reachable on the existing makeStudio webhook. Inputs:
//      action=deleteComponent, mediaItemId, mode (archive |
//      hard_delete), taItemId. Router branches on mode.
//      See companion spec in Session 6 transfer doc.
//   3. TA_CONFIG.optionIds.mediaStatus.archived hash must be
//      '57a4f54ecb4035d3c5b706222e82dee5' for Route 5 archive
//      branch to write the correct option hash. (JS does not
//      reference this hash directly — Make.com binds it — but
//      it's listed here for deployment audit.)
//
//   SCOPE EXPLICITLY DEFERRED TO 6B:
//   - Attach button wire-up to Scenario G Route 4
//   - Inline picker UI on cards with editing-state contract
//     (selection persistence, gold border, Cancel text link)
//
// HARDCODED DECISIONS (logged to tech debt tracker):
//   - HC-006: Status labels ('Available', 'Attached', 'Archived')
//     hardcoded in filter logic. Intentional — status vocabulary
//     is foundational; Webflow label changes would be explicit
//     publisher action.
//   - HC-007: Media Type labels ('Text','Image','Video','Audio')
//     hardcoded in filter options. Same reasoning.
//   - HC-008: Uploadcare transform stems hardcoded (thumbnail
//     = -/resize/560x/-/format/auto/; detail = -/resize/1400x/
//     -/format/auto/-/quality/smart/). Future: centralize in
//     TA_CONFIG.uploadcareTransforms or INBXIFY_TRANSFORMS.
//
// ──────────────────────────────────────────────────────────
// v1.1.6 (publish-status migration — closes TD-109 + TD-110):
//   Webflow field migration: `article-status` → `publish-status`.
//   Both fields carried the same two-option schema (Draft, Live)
//   but the option hashes are different because publish-status
//   is a newly created field. Old field will be deprecated after
//   all articles are reassigned.
//   - DOM read: readArticles() now reads d.publishStatus (bound
//     on .articles-wrapper via data-publish-status) instead of
//     d.articleStatus. Matches the Designer rebinding required
//     by this migration.
//   - Internal state key: renamed articleStatus → publishStatus
//     across LOADERS, S.edit state, meta-cell status pill
//     resolution, and the edit-form select id. Closes TD-110.
//   - Payload key: dirtyFields.articleStatus → dirtyFields.
//     publishStatus. MUST be paired with Scenario G Route 2
//     binding update: dirtyFields.publishStatus → publish-status
//     Webflow field slug.
//   - translateDirtyForPayload() now matches on 'publishStatus'
//     and still resolves via TA_CONFIG.optionIds.publishStatus
//     (the optionIds sub-key name was already publishStatus in
//     v1.1.2, so TA_CONFIG is unchanged IF the hashes were
//     updated in it — see Deployment note).
//   - mapStatus() comment updated: data-publish-status outputs
//     the LABEL ("Draft"/"Live"), not the hash, same binding
//     behavior as the old field.
//   - Edit-form Article Status select id renamed to
//     'publishStatus'; label stays "Article Status" for UX
//     continuity (can be changed to "Publish Status" later).
//
// DEPLOYMENT PREREQUISITES:
//   1. Webflow Designer: .articles-wrapper must bind
//      data-publish-status = {{ Publish Status }} (new field).
//      Keep data-article-status bound alongside during migration
//      window for zero downtime.
//   2. TA_CONFIG.optionIds.publishStatus hashes updated to:
//        draft: 'daaf373fb13b9970b489d0131d36c396'
//        live:  '5561293d8d8a03909ee3d2e8849d7cc1'
//      (Previous hashes were from the old article-status field.)
//   3. Scenario G Route 2: rename the incoming field key from
//      dirtyFields.articleStatus to dirtyFields.publishStatus
//      and ensure the Webflow update field slug is publish-status
//      (not article-status).
//   4. Content Library bumped to v1.0.31 in the same deploy —
//      it also reads data-publish-status on .articles-wrapper.
//
// POST-MIGRATION CLEANUP (later, after all articles reassigned):
//   - Remove data-article-status binding from Designer
//   - Delete Webflow `article-status` option field entirely
//   - Remove item-availability-status line from Scenario F
//     Module 154 (isNew create Article)
//
// ──────────────────────────────────────────────────────────
// v1.1.5 (Session 4 — error surfacing fix):
//   - triggerSave() .catch branch no longer calls updateSaveBar()
//     after showSaveError(). updateSaveBar() reads countDirty()
//     and rewrites the info text + button text from scratch,
//     which was immediately overwriting the red error state
//     that showSaveError() had just applied. Net effect: on a
//     save failure, the UI would briefly flash error and then
//     revert to "Save N changes", making errors completely
//     invisible to the user.
//     Confirmed via console in v1.1.4 — catch branch was
//     firing and logging the error, but UI showed no error
//     state. Classic "set-then-overwrite" race.
//   - updateSaveBar() now explicitly drops .has-error class
//     when re-rendering. Triggered when user edits a field
//     after a failed save or clicks Reset — clears the red
//     border/accent styling that .has-error was applying,
//     so the bar returns to normal state cleanly.
//   - Save payload console log corrected to say v1.1.5
//     (was stale "v1.1.3" in v1.1.4 — harmless but confusing
//     when diagnosing).
//   - Header badge, mount log updated to v1.1.5.
//
// TD-114 (logged, not fixed here): Scenario G Route 2 returns
//   the generic "Scenario failed to complete." when Webflow
//   rejects a field (e.g. banner-statement too long). The
//   actual Webflow validation detail is swallowed at the
//   Make level. Studio surfaces what Make sends, but Make
//   is sending a useless string. Fix in a future Make pass:
//   add a Webhook Response module on Route 2's error branch
//   that forwards the Webflow module's error text.
//
// ──────────────────────────────────────────────────────────
// v1.1.4 (Session 4 — body save modal close + success toast):
//   - After Route 3 (updateArticleBody) succeeds, Studio now
//     closes the RTE fullscreen modal by calling
//     window._studioRteInstance.closeFullscreen(). Previously
//     the save completed successfully but the modal stayed
//     open with no feedback, leading users to click Save
//     repeatedly thinking nothing happened. RTE's internal
//     handleSave() sets dirty=false synchronously before
//     firing onSave, so closeFullscreen() runs without
//     triggering the "unsaved changes" confirm dialog.
//   - DEFENSIVE overlay cleanup on open. Before opening a new
//     RTE instance, openBodyEditor() now:
//       (1) calls closeFullscreen() on any existing live
//           _studioRteInstance,
//       (2) removes any orphaned .rte-fs-overlay elements
//           from the DOM (from prior crashed sessions or
//           double-click races),
//       (3) resets document.body.style.overflow.
//     Prevents the "grey screen / frozen page after close"
//     symptom caused by multiple stacked overlays (confirmed
//     via DOM inspection on v1.1.3 — two rte-fs-overlay
//     elements present at once).
//   - New toast element — floating "✓ Body saved to Webflow"
//     pill appears as the RTE modal closes, auto-fades after
//     ~2.2s. Rendered into <body>, not Studio's mount, so it
//     survives DOM replacement by renderAssembler().
//   - On Route 3 failure: modal stays open (user keeps edits
//     in the editor, can fix and retry). Alert surfaces the
//     error text with the existing trimErrorText() helper.
//   - Header badge, mount log updated to v1.1.4.
//
// TD-113 (logged, not fixed here): RTE uses native
//   window.confirm() for "close with unsaved changes" and
//   "cancel with unsaved changes" dialogs. Ugly, but works.
//   Fix in a future ta-rte-v1.0.1 bump (custom modal dialog).
//
// TD-112 (logged, not fixed here): uploads-processor's
//   editArticleBody() has the same "modal doesn't close after
//   save" bug that v1.1.4 just fixed in Studio. Since uploads-
//   processor's body-editor flow is being deprecated in favor
//   of Studio's, this may never need fixing. If a user hits it
//   before the migration completes, fix by mirroring the
//   closeFullscreen() call from this file.
//
// TD-111 (logged, not fixed here): RTE link dialog doesn't
//   hint at the required https:// prefix. Users type "www.x.com"
//   and the link breaks. Fix in future ta-rte-v1.0.1 bump
//   (add placeholder/validation in the link input).
//
// ──────────────────────────────────────────────────────────
// v1.1.3 (Session 4 — post-smoke UX fixes):
//   - Save-bar visual reset: .saving and .has-error classes are
//     now explicitly removed on both success and error paths.
//     Fixes "frozen green border" after a successful save where
//     the bar showed Clean state correctly but still carried
//     leftover success styling.
//   - After a successful save, Studio flashes ✓ for ~1.2s then
//     auto-returns to the picker. Previously it left the user
//     on the article with no clear signal of completion.
//     (Retry-path errors do NOT auto-close — user stays on the
//     article to fix and retry.)
//   - New body-class toggle: when an article is open in the
//     Assembler, <body> gets class `studio-editing` and loses
//     it on close/cancel/back. CSS in the design system hides
//     `.publisher-wrapper` while this class is present, giving
//     the edit form the full page height. No DOM manipulation
//     of the header itself — class-driven per multi-tenancy.
//   - Requires title-admin-page-design CSS update with:
//       body.studio-editing .publisher-wrapper { display: none; }
//     (Design-system file, separate deploy.)
//   - Header badge, mount log updated to v1.1.3.
//
// ──────────────────────────────────────────────────────────
// v1.1.2 (Session 4 — wire Studio to Scenario G):
//   - triggerSave() now POSTs to window.TA_CONFIG.makeStudio
//     (Scenario G Route 2) instead of console.log stub.
//     Real round-trip, real error handling, real dirty-state
//     cleared only on success.
//   - Outbound payload translation for option fields:
//       * articleStatus LABEL ("Draft"/"Live") → publish-status
//         option hash via TA_CONFIG.optionIds.publishStatus
//       * revenueType   LABEL ("Paid Ad"/…)   → revenue-type
//         option hash via TA_CONFIG.optionIds.revenueType
//     Payload key name stays `articleStatus` because Scenario G
//     Route 2 already binds dirtyFields.articleStatus →
//     publish-status slug (see TD-110 for future rename).
//   - Body editor: replaced window.InbxEditBody() call with
//     Studio-owned openBodyEditor() which calls Scenario G
//     Route 1 (getArticleBody) + Route 3 (updateArticleBody)
//     directly via InbxRTE.openFullscreen. Scenario C / uploads-
//     processor's body flow no longer used by Studio.
//   - Body fetch: decodeURIComponent(data.body) on receipt per
//     the Route 1 encodeURL/decodeURIComponent contract
//     established in Session 3.
//   - Body save: always sends bodyStatus = optionIds.bodyStatus.
//     edited. Raw is set upstream by Scenario F (not yet built).
//   - On successful body save, Studio mirrors
//     data-body-status="Edited" onto the matching .articles-
//     wrapper DOM element so the picker reflects the new state
//     without a page reload.
//   - Defensive fetch wrapper: checks r.ok BEFORE r.json(). If
//     Make returns 500 (validation error) or non-JSON, surface
//     the error text inline in the save bar in red, keep Save
//     enabled so user can fix and retry, do NOT promote current
//     → loaded (dirty state persists).
//   - Phase 1 banner: removed "(read-only)" — editing is live.
//   - Header badge, mount log updated to v1.1.2.
//
// TD-110 (RESOLVED in v1.1.6): dirtyFields.articleStatus renamed
//   to dirtyFields.publishStatus. Paired with Scenario G Route 2
//   binding update (publish-status Webflow slug). Internal state
//   key articleStatus also renamed to publishStatus. All call
//   sites updated. Closes TD-110.
//
// ──────────────────────────────────────────────────────────
// v1.1.1 (Session 1 — post-smoke-test fixes):
//   - Header row: now uses SHARED .ix-hdr classes (matches
//     Uploads Processor + every other tab). Title changed
//     "TA Studio" → "Studio". Custom .std-hdr styles removed.
//   - Body editor button: availability check moved from
//     render-time to click-time. Button is always rendered
//     enabled; clicking checks window.InbxEditBody at that
//     moment. Fixes issue where button was inert if the
//     uploads-processor JS loaded after Studio mounted.
//
// v1.1.0 (Session 1 initial):
//   - File renamed: studio-v1.0.x.js → ta-studio-v1.1.x.js
//   - Every field in the three columns is now an input/
//     textarea/select/checkbox — EXCEPT:
//       * Article Body (Phase 5 — uses InbxRTE modal via
//         existing window.InbxEditBody)
//       * Interior Images (Phase 3+)
//       * Main Image URL + UUID (Phase 3+)
//       * body-status (written only by Scenario F)
//       * identifiers block (always readonly)
//   - Dirty-state tracking: each field captures its loaded
//     value; border turns gold when current !== loaded.
//   - Character counters: teaser 400, short summary 150.
//     Counter flips red when over budget.
//   - Save bar (sticky at bottom of open-assembler view):
//       * Cancel link  — reverts + closes back to picker
//       * Reset button — reverts to loaded values
//       * Save button  — label is "Save N changes"; hidden
//         when N=0. POST to Scenario F is STUBBED — payload
//         goes to console.log only. Fake success UI
//         simulates the round-trip so UX can be reviewed.
//   - beforeunload guard fires when dirty fields exist.
//   - Header row (icon + title + subtitle + v1.1.0 badge)
//     added above the back-row, matching the Uploads
//     Processor visual pattern.
//
//   OPTION FIELDS — current state (as of v1.1.0):
//     Webflow option fields bind to their LABEL (e.g. "Draft"
//     "Live"), not their option-ID hash. Session 2 (Scenario F
//     build) will determine whether:
//       (a) Make accepts labels directly, OR
//       (b) Studio translates label→hash via TA_CONFIG, OR
//       (c) Make translates label→hash at scenario start.
//     For v1.1.0 the payload carries the label string and is
//     flagged with TODO-SESSION-2 comments at the save site.
//
// ──────────────────────────────────────────────────────────
// v1.0.1: Webflow binding fixes
//   - Rich text (Article Body) read from innerHTML of element
//     with class `.article-body-source`.
//   - Switches read via presence of sentinel divs with
//     Conditional Visibility.
//   - Main image reads `data-article-main-image-src`.
// v1.0.0: Initial Phase 1.
// ============================================================

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.getElementById('studio-mount');
    if (!mount) return;

    // ── Config ──
    var CFG = {
      get titleSlug()       { return window.TA_CONFIG && window.TA_CONFIG.titleSlug  || ''; },
      get titleId()         { return window.TA_CONFIG && window.TA_CONFIG.titleId    || ''; },
      get taItemId()        { return window.TA_CONFIG && window.TA_CONFIG.taItemId   || ''; },
      get uploadcareBase()  { return window.TA_CONFIG && window.TA_CONFIG.uploadcareBase || 'https://uyluucdnr2.ucarecd.net'; },
      get makeAssembly()    { return window.TA_CONFIG && window.TA_CONFIG.makeAssembly || ''; },
      get makeStudio()      { return window.TA_CONFIG && window.TA_CONFIG.makeStudio    || ''; },
      get optionIds()       { return (window.TA_CONFIG && window.TA_CONFIG.optionIds) || {}; }
    };

    // ── State ──
    var S = {
      panel: 'assembler',     // input | components | assembler
      assetType: 'articles',  // articles | ads | events | re
      filter: {
        name: '',
        customerId: '',
        productId: '',
        mnlsId: '',
        sort: 'recent-edited',
        availabilityOnly: true
      },
      selectedAssetId: null,

      // Edit state (v1.1.0)
      edit: {
        loaded: {},      // snapshot { fieldKey: value } captured on asset open
        current: {},     // current values (mirrors DOM inputs)
        saving: false,   // true during fake save round-trip
        saveJustFinished: false   // briefly true to show ✓ success state
      },

      // Components tab state (v1.1.7, extended in v1.1.7.3 and v1.1.8)
      cmp: {
        items: [],              // parsed MEDIA rows from .media-wrapper
        filters: {
          searchName: '',       // v1.1.7.3: case-insensitive partial match on Name
          status: 'Available',  // Available | Attached | Archived | All (default active filter)
          role: 'All',
          mediaType: 'All',
          customerId: 'All',
          productId: 'All'
        },
        drawerOpenId: null,     // mediaId of currently-open detail drawer, or null
        actionInFlight: null,   // mediaId currently being archived/deleted (disables its buttons)

        // v1.1.8 Attach UI state, extended in v1.1.9. Only one card can
        // be in editing state at a time; clicking Attach on another card
        // auto-cancels.
        attachEdit: {
          mediaId: null,        // mediaId of the card currently in State B, or null
          publishStatus: 'Draft', // 'Draft' | 'Live' | 'All' — defaults to Draft per Session 6B decision
          articleId: null,      // selected Article ID (null until picker selection)
          failed: false         // v1.1.9: true after a failed Route 4 attempt — renders inline red bar,
                                // disables Attach button until user clicks Cancel
        },
        attachInFlight: null    // mediaId currently firing Route 4 (guards double-submit)
      },

      // v1.2.0: Assembler field-level picker state. Only one slot picker
      // can be open at a time; opening a new one auto-closes any prior.
      // The picker reuses cmp.items as its data source (filtered by
      // role + status + customer + product). It does NOT touch cmp's
      // attachEdit or attachInFlight — Assembler attach is a separate
      // call path that terminates at the same Route 4 endpoint.
      asm: {
        picker: {
          slot: null,             // 'mainImage' | 'interiorImage' | null
          selectedMediaId: null,  // currently-highlighted card in the picker
          customerId: 'All',      // user-toggleable narrowing filter
          productId: 'All',       // user-toggleable narrowing filter
          inFlight: false,        // true while Route 4 is firing
          failed: false           // v1.1.9 half-committed-state pattern
        }
      }
    };

    // ── beforeunload guard (installed lazily; only fires when dirty) ──
    var _beforeunloadInstalled = false;
    function installBeforeUnload() {
      if (_beforeunloadInstalled) return;
      _beforeunloadInstalled = true;
      window.addEventListener('beforeunload', _beforeunloadHandler);
    }
    function _beforeunloadHandler(e) {
      if (countDirty() > 0 && !S.edit.saving) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    }

    // ── Shell markup ──
    mount.innerHTML =
      '<div class="std-root">' +
        '<div class="ix-hdr">' +
          '<div class="ix-hdr-left">' +
            '<div class="ix-hdr-icon">\u29BE</div>' +
            '<div>' +
              '<h3>Studio</h3>' +
              '<div class="ix-hdr-sub">Pick an Article \u2192 edit inline \u2192 save to Webflow</div>' +
            '</div>' +
          '</div>' +
          '<span class="ix-badge">v1.2.6</span>' +
        '</div>' +
        '<div class="std-subtabs">' +
          '<button class="std-subtab" data-std-panel="input">' +
            '<span class="std-subtab-icon">\u2B06</span>' +
            '<span>Input</span>' +
          '</button>' +
          '<button class="std-subtab" data-std-panel="components">' +
            '<span class="std-subtab-icon">\u25A3</span>' +
            '<span>Components</span>' +
          '</button>' +
          '<button class="std-subtab active" data-std-panel="assembler">' +
            '<span class="std-subtab-icon">\u29BE</span>' +
            '<span>Assembler</span>' +
          '</button>' +
        '</div>' +
        '<div class="std-panel" data-std-panel-body="input">' +
          '<div class="std-placeholder">' +
            '<div class="std-placeholder-icon">\u2B06</div>' +
            '<div class="std-placeholder-title">Input</div>' +
            '<div class="std-placeholder-sub">Phase 1: placeholder only. Upload (Google Drive) and Transcribe flows move here in Phase 2. Form Submission is being retired.</div>' +
          '</div>' +
        '</div>' +
        '<div class="std-panel" data-std-panel-body="components">' +
          '<div class="cmp-root" id="cmp-root"></div>' +
        '</div>' +
        '<div class="std-panel active" data-std-panel-body="assembler">' +
          '<div class="asm-root" id="asm-root"></div>' +
        '</div>' +
      '</div>';

    // ── Sub-tab wiring ──
    mount.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-std-panel]');
      if (!btn) return;
      var panel = btn.getAttribute('data-std-panel');
      setPanel(panel);
    });

    function setPanel(name) {
      S.panel = name;
      Array.prototype.forEach.call(mount.querySelectorAll('[data-std-panel]'), function (el) {
        el.classList.toggle('active', el.getAttribute('data-std-panel') === name);
      });
      Array.prototype.forEach.call(mount.querySelectorAll('[data-std-panel-body]'), function (el) {
        el.classList.toggle('active', el.getAttribute('data-std-panel-body') === name);
      });
      if (name === 'assembler') {
        renderAssembler();
      } else if (name === 'components') {
        // v1.1.7: Components tab now has a live reader. Re-read
        // the .media-wrapper DOM on every tab activation — cheap,
        // and catches newly-created MEDIA rows that Webflow
        // rendered on a subsequent page load or a republish.
        renderComponents();
        document.body.classList.remove('studio-editing');
      } else {
        // v1.1.3: switching to Input/Components while an article is open
        // should still drop the hide-header class — the user is no
        // longer editing. renderAssembler() handles this when the panel
        // returns, but we need it now too.
        document.body.classList.remove('studio-editing');
      }
    }

    // ═══════════════════════════════════════════
    // DOM readers — pull data from T-A page hidden collections
    // ═══════════════════════════════════════════

    // Articles
    function readArticles() {
      var wraps = document.querySelectorAll('.articles-wrapper[data-item]');
      var out = [];
      Array.prototype.forEach.call(wraps, function (el) {
        var d = el.dataset;
        var id = (d.articleId || '').trim();
        if (!id) return;

        // ── Rich Text (cannot bind to data-attribute in Webflow) ──
        // Read the innerHTML of the element with class `.article-body-source`.
        // Class is applied directly to the Rich Text Block element.
        var bodyEl = el.querySelector('.article-body-source');
        var bodyHtml = bodyEl ? bodyEl.innerHTML : '';

        // ── Switches (cannot bind to data-attribute in Webflow) ──
        // Presence of the flag div = switch is ON.
        // (Webflow's Conditional Visibility removes the element from
        //  the DOM when the switch is false.)
        var showPhotoCredits = !!el.querySelector('.article-flag-photo-credits');
        var photoEssay       = !!el.querySelector('.article-flag-photo-essay');
        var videoArticle     = !!el.querySelector('.article-flag-video-article');

        out.push({
          id: id,
          name: (d.articleTitle || '').trim(),
          customerId: (d.articleCustomerId || '').trim(),
          customerName: (d.articleCustomerName || '').trim(),
          productId: (d.categoryId || '').trim(),
          productName: (d.articleCategory || d.label || '').trim(),
          revenueType: (d.type || '').trim(),
          mnlsId: (d.mnlsId || '').trim(),
          mnlsName: (d.mnlsName || '').trim(),
          newsletterId: (d.newsletterId || '').trim(),
          newsletterName: (d.newsletterName || '').trim(),
          newsletterDate: (d.newsletterDate || '').trim(),
          status: mapStatus((d.publishStatus || '').trim()),
          bodyStatus: (d.bodyStatus || '').trim(),
          created: (d.articleCreated || '').trim(),
          updated: (d.articleUpdated || '').trim(),

          // Body content
          subtitle: (d.articleSubtitle || '').trim(),
          bannerStatement: (d.articleBannerStatement || '').trim(),
          teaser: (d.articleTeaser || '').trim(),
          shortSummary: (d.articleShortSummary || '').trim(),
          bodyHtml: bodyHtml,  // full RTE HTML (script truncates for display)
          printIssueSource: (d.articlePrintIssueSource || '').trim(),

          // Main image — bare URL bound to 🟡 Main Image GET Link.
          // No transformation applied here; use URL as-is.
          mainImageSrc: (d.articleMainImageSrc || '').trim(),
          mainImageAlt: (d.articleMainImageAlt || '').trim(),

          // CTA
          ctaButton: (d.articleCtaButtonText || '').trim(),
          ctaText:   (d.articleCtaText       || '').trim(),
          ctaUrl:    (d.articleCtaUrl        || '').trim(),

          // Writers
          writerName:      (d.articleWriterName      || '').trim(),
          writerTitle:     (d.articleWriterTitle     || '').trim(),
          cowriterName:    (d.articleCowriterName    || '').trim(),
          cowriterTitle:   (d.articleCowriterTitle   || '').trim(),
          writerComposite: (d.articleWriterComposite || '').trim(),
          cowriterComposite: (d.articleCowriterComposite || '').trim(),

          // Media flags (sentinel div presence)
          showPhotoCredits: showPhotoCredits,
          photographer: (d.articlePhotographer || '').trim(),
          photoEssay: photoEssay,
          videoArticle: videoArticle,
          videoUrl: (d.articleVideoUrl || '').trim(),
          audioUrl: (d.articleAudioUrl || '').trim()
        });
      });
      return out;
    }

    function mapStatus(hash) {
      // v1.1.6: reads data-publish-status which (like the old
      // data-article-status) binds to the option's LABEL
      // ("Draft"/"Live"), not its hash. The fallback is what
      // actually runs. Keep lowercased so CSS class hooks
      // (.draft, .live) work.
      if (!hash) return 'draft';
      return String(hash).toLowerCase();
    }

    function isOn() { return false; } // legacy; kept as no-op in case anything still references it

    // ═══════════════════════════════════════════
    // EDIT STATE ENGINE (v1.1.0)
    // ═══════════════════════════════════════════

    // Mapping from field key → how to extract its "loaded" value from
    // an article object. Used when an article is opened.
    var LOADERS = {
      articleTitle:     function (a) { return a.name; },
      subtitle:         function (a) { return a.subtitle; },
      teaser:           function (a) { return a.teaser; },
      shortSummary:     function (a) { return a.shortSummary; },
      bannerStatement:  function (a) { return a.bannerStatement; },
      ctaText:          function (a) { return a.ctaText; },
      ctaButtonText:    function (a) { return a.ctaButton; },
      ctaUrl:           function (a) { return a.ctaUrl; },
      writerName:       function (a) { return a.writerName; },
      writerTitle:      function (a) { return a.writerTitle; },
      cowriterName:     function (a) { return a.cowriterName; },
      cowriterTitle:    function (a) { return a.cowriterTitle; },
      mainImageAlt:     function (a) { return a.mainImageAlt; },
      photographer:     function (a) { return a.photographer; },
      videoUrl:         function (a) { return a.videoUrl; },
      audioUrl:         function (a) { return a.audioUrl; },
      customerId:       function (a) { return a.customerId; },
      productId:        function (a) { return a.productId; },
      mnlsId:           function (a) { return a.mnlsId; },
      revenueType:      function (a) { return a.revenueType; },
      publishStatus:    function (a) { return a.status; },
      showPhotoCredits: function (a) { return !!a.showPhotoCredits; },
      photoEssay:       function (a) { return !!a.photoEssay; },
      videoArticle:     function (a) { return !!a.videoArticle; }
    };

    // Character-limit fields (render counter in UI)
    var CHAR_LIMITS = {
      teaser:       400,
      shortSummary: 150
    };

    // Load an article's values into S.edit.loaded and S.edit.current.
    function loadEditSnapshot(a) {
      S.edit.loaded  = {};
      S.edit.current = {};
      Object.keys(LOADERS).forEach(function (k) {
        var v = LOADERS[k](a);
        // Normalize: treat null/undefined as '' for strings, false for bools
        if (typeof v === 'boolean') {
          S.edit.loaded[k]  = !!v;
          S.edit.current[k] = !!v;
        } else {
          S.edit.loaded[k]  = (v == null ? '' : String(v));
          S.edit.current[k] = (v == null ? '' : String(v));
        }
      });
      S.edit.saving = false;
      S.edit.saveJustFinished = false;
    }

    // Is the given field's current value different from its loaded value?
    function isDirty(key) {
      var cur = S.edit.current[key];
      var ldd = S.edit.loaded[key];
      if (typeof cur === 'boolean' || typeof ldd === 'boolean') {
        return !!cur !== !!ldd;
      }
      return String(cur || '').trim() !== String(ldd || '').trim();
    }

    function countDirty() {
      return Object.keys(S.edit.loaded).filter(isDirty).length;
    }

    function dirtyPayload() {
      var out = {};
      Object.keys(S.edit.loaded).forEach(function (k) {
        if (isDirty(k)) out[k] = S.edit.current[k];
      });
      return out;
    }

    // Called by each editable field on every input/change event.
    function onFieldChange(key, value) {
      S.edit.current[key] = value;
      // Update ONLY the parts of the DOM that need updating, not full re-render,
      // so the user's cursor doesn't jump.
      updateFieldDirtyVisual(key);
      updateCharCounter(key);
      updateSaveBar();
      installBeforeUnload();
    }

    function updateFieldDirtyVisual(key) {
      var el = document.querySelector('[data-asm-field-wrap="' + key + '"]');
      if (!el) return;
      el.classList.toggle('dirty', isDirty(key));
    }

    function updateCharCounter(key) {
      if (!CHAR_LIMITS[key]) return;
      var max = CHAR_LIMITS[key];
      var len = String(S.edit.current[key] || '').length;
      var el = document.querySelector('[data-asm-counter="' + key + '"]');
      if (!el) return;
      el.textContent = len + ' / ' + max;
      el.classList.toggle('over', len > max);
    }

    function updateSaveBar() {
      var n = countDirty();
      var bar = document.getElementById('asm-save-bar');
      if (!bar) return;
      var btn    = bar.querySelector('[data-asm-save]');
      var reset  = bar.querySelector('[data-asm-reset]');
      var info   = bar.querySelector('.asm-save-info');
      var cancel = bar.querySelector('[data-asm-cancel]');
      // v1.1.4: if the bar is in error state and we're being asked to
      // re-render its normal state, clear .has-error. Triggered when
      // the user edits a field after a failed save (onFieldChange calls
      // this) or clicks Reset.
      bar.classList.remove('has-error');
      if (n === 0) {
        bar.classList.remove('has-changes');
        if (btn)   { btn.disabled = true; btn.textContent = 'No changes'; }
        if (reset) reset.disabled = true;
        if (info)  info.textContent = 'Clean \u2014 no pending changes';
        // Cancel is always enabled so user can close the asset
      } else {
        bar.classList.add('has-changes');
        if (btn)   { btn.disabled = false; btn.textContent = 'Save ' + n + ' change' + (n === 1 ? '' : 's'); }
        if (reset) reset.disabled = false;
        if (info)  info.textContent = n + ' field' + (n === 1 ? '' : 's') + ' ready to save';
      }
    }

    // Revert all current values to their loaded values and re-render open view.
    function revertAll() {
      Object.keys(S.edit.loaded).forEach(function (k) {
        S.edit.current[k] = S.edit.loaded[k];
      });
      renderAssembler();
    }

    // v1.1.2: Live save via Scenario G Route 2 (updateArticleFields).
    // Payload shape matches v1.1.1 stub. Option fields translated
    // label → hash via TA_CONFIG.optionIds before POST.
    // On success: promote current → loaded, clear dirty, flash ✓.
    // On failure: surface error inline in save bar, keep Save enabled
    // so user can retry, do NOT clear dirty state.
    function triggerSave() {
      if (countDirty() === 0) return;
      if (!CFG.makeStudio) {
        showSaveError('No makeStudio URL configured. Check window.TA_CONFIG in the T-A page head.');
        return;
      }

      S.edit.saving = true;
      updateSaveBarSavingState();
      clearSaveError();

      var payload = {
        action: 'updateArticleFields',
        titleSlug: CFG.titleSlug,
        articleItemId: S.selectedAssetId,
        taItemId: CFG.taItemId,
        dirtyFields: translateDirtyForPayload(dirtyPayload()),
        loadedAt: new Date().toISOString()
      };

      console.log('[TA-STUDIO v1.1.6] Save payload:', payload);

      fetch(CFG.makeStudio, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function (r) {
        if (!r.ok) {
          // Make returns non-JSON error bodies on scenario failure
          // (e.g. Webflow validation errors come back as 500 with
          // plain text "Scenario failed"). Read as text to avoid the
          // SyntaxError from r.json() on non-JSON.
          return r.text().then(function (txt) {
            throw new Error('HTTP ' + r.status + ': ' + (txt || r.statusText || 'Unknown error'));
          });
        }
        return r.json();
      })
      .then(function (data) {
        if (!data || data.status !== 'success') {
          throw new Error((data && data.error) || 'Webhook returned unsuccessful status');
        }
        // SUCCESS: promote current → loaded, clear dirty, flash ✓.
        // v1.2.3: replace the legacy 1200ms auto-return-to-picker
        // with studioReloadAfterCMSWrite — the reload lands the user
        // on a fresh picker with the just-saved article visible in
        // its updated state (no stale data-attributes).
        S.edit.saving = false;
        S.edit.saveJustFinished = true;
        Object.keys(S.edit.loaded).forEach(function (k) {
          S.edit.loaded[k] = S.edit.current[k];
        });
        clearSaveBarTransientClasses();  // drop .saving, .has-error
        renderAssembler();
        // v1.2.4: banner replaces the redundant toast — same message,
        // persistent until reload, with progress indicator.
        studioReloadAfterCMSWrite({ bannerLabel: '\u2713 Saved \u2014 refreshing\u2026' });
      })
      .catch(function (err) {
        S.edit.saving = false;
        console.error('[TA-STUDIO] Save failed:', err);
        clearSaveBarTransientClasses();  // drop .saving so CSS is clean
        // NOTE: do NOT call updateSaveBar() here — it reads countDirty()
        // and rewrites the info text + button text from scratch, which
        // would immediately overwrite the red error state that
        // showSaveError() just set. Dirty state is already preserved
        // because we never promoted current → loaded.
        showSaveError(trimErrorText(err.message || String(err)));
      });
    }

    // v1.1.3: drop transient CSS classes from the save bar so the bar's
    // visual state matches its logical state (clean/has-changes/error).
    // Without this, .saving left over from updateSaveBarSavingState()
    // kept the bar green even when countDirty() returned 0.
    function clearSaveBarTransientClasses() {
      var bar = document.getElementById('asm-save-bar');
      if (!bar) return;
      bar.classList.remove('saving');
      bar.classList.remove('has-error');
    }

    // v1.1.2: Option-field label → hash translation.
    // Webflow option fields require the option-ID hash on write, but
    // the T-A hidden collection renders them as labels. Studio reads
    // labels from the DOM and must translate back to hashes before
    // POST. Scope: publishStatus, revenueType.
    // v1.1.6: payload key articleStatus → publishStatus (closes
    // TD-110). Scenario G Route 2 must be updated in parallel to
    // read dirtyFields.publishStatus → publish-status slug.
    function translateDirtyForPayload(dirty) {
      var out = {};
      var oids = CFG.optionIds || {};
      Object.keys(dirty).forEach(function (k) {
        var v = dirty[k];
        if (k === 'publishStatus') {
          // Label "Draft" / "Live" → publishStatus hash
          var ps = oids.publishStatus || {};
          var key = String(v || '').toLowerCase();
          if (ps[key]) {
            out[k] = ps[key];
          } else {
            console.warn('[TA-STUDIO] No publishStatus hash for label:', v, '— sending label as-is');
            out[k] = v;
          }
        } else if (k === 'revenueType') {
          // Label "Paid Ad" / "Paid Article" / "Sponsorable" → revenueType hash
          var rt = oids.revenueType || {};
          var rtKey = labelToOptionKey(v);
          if (rtKey && rt[rtKey]) {
            out[k] = rt[rtKey];
          } else {
            console.warn('[TA-STUDIO] No revenueType hash for label:', v, '— sending label as-is');
            out[k] = v;
          }
        } else {
          out[k] = v;
        }
      });
      return out;
    }

    // "Paid Ad" → "paidAd", "Paid Article" → "paidArticle", "Sponsorable" → "sponsorable"
    function labelToOptionKey(label) {
      if (!label) return '';
      var parts = String(label).trim().split(/\s+/);
      if (!parts.length) return '';
      return parts.map(function (p, i) {
        p = p.toLowerCase();
        if (i === 0) return p;
        return p.charAt(0).toUpperCase() + p.slice(1);
      }).join('');
    }

    // Truncate long error messages for the inline save-bar display.
    function trimErrorText(msg) {
      msg = String(msg || '').replace(/\s+/g, ' ').trim();
      if (msg.length > 220) msg = msg.substring(0, 217) + '…';
      return msg;
    }

    function showSaveError(msg) {
      var bar = document.getElementById('asm-save-bar');
      if (!bar) return;
      var info = bar.querySelector('.asm-save-info');
      if (!info) return;
      bar.classList.add('has-error');
      info.innerHTML = '<span style="color:#c0392b;font-weight:600">Save failed:</span> <span style="color:#c0392b">' + esc(msg) + '</span>';
      var btn = bar.querySelector('[data-asm-save]');
      if (btn) { btn.disabled = false; btn.textContent = 'Retry save'; }
    }

    function clearSaveError() {
      var bar = document.getElementById('asm-save-bar');
      if (!bar) return;
      bar.classList.remove('has-error');
    }

    // ═══════════════════════════════════════════
    // BODY EDITOR (v1.1.2) — Studio-owned RTE flow
    // Uses Scenario G Route 1 + Route 3 directly. No dependency on
    // uploads-processor or makeAssembly.
    // ═══════════════════════════════════════════

    // Fetch the current post-body HTML for an article via Scenario G
    // Route 1. Body is URL-encoded over the wire (to survive nested
    // quotes and newlines in the JSON response) — decode on receipt
    // per the contract established Session 3.
    function fetchArticleBody(articleItemId) {
      if (!CFG.makeStudio) {
        console.error('[TA-STUDIO] No makeStudio URL configured');
        return Promise.resolve(null);
      }
      if (!articleItemId) {
        console.error('[TA-STUDIO] fetchArticleBody called without articleItemId');
        return Promise.resolve(null);
      }
      return fetch(CFG.makeStudio, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getArticleBody',
          titleSlug: CFG.titleSlug,
          articleItemId: articleItemId
        })
      })
      .then(function (r) {
        if (!r.ok) {
          return r.text().then(function (txt) {
            throw new Error('HTTP ' + r.status + ': ' + (txt || r.statusText || 'Unknown error'));
          });
        }
        return r.json();
      })
      .then(function (data) {
        if (!data || data.status !== 'ok') {
          throw new Error((data && data.error) || 'getArticleBody returned unsuccessful status');
        }
        // Body is URL-encoded — decode before returning.
        return decodeURIComponent(data.body || '');
      })
      .catch(function (err) {
        console.error('[TA-STUDIO] fetchArticleBody error:', err);
        return null;
      });
    }

    // Save edited body HTML via Scenario G Route 3. Always sends
    // bodyStatus = edited (Raw is set upstream by Scenario F).
    function saveArticleBody(articleItemId, editedHTML) {
      if (!CFG.makeStudio) {
        return Promise.reject(new Error('No makeStudio URL configured'));
      }
      var editedHash = ((CFG.optionIds || {}).bodyStatus || {}).edited || '';
      if (!editedHash) {
        return Promise.reject(new Error('No optionIds.bodyStatus.edited hash in TA_CONFIG'));
      }
      return fetch(CFG.makeStudio, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateArticleBody',
          titleSlug: CFG.titleSlug,
          articleItemId: articleItemId,
          articleBody: editedHTML,
          bodyStatus: editedHash
        })
      })
      .then(function (r) {
        if (!r.ok) {
          return r.text().then(function (txt) {
            throw new Error('HTTP ' + r.status + ': ' + (txt || r.statusText || 'Unknown error'));
          });
        }
        return r.json();
      })
      .then(function (data) {
        if (!data || data.status !== 'success') {
          throw new Error((data && data.error) || 'updateArticleBody returned unsuccessful status');
        }
        return data;
      });
    }

    // Open the fullscreen RTE body editor for an article. Fetches the
    // current body via Route 1, opens InbxRTE, wires onSave to Route 3.
    // On success: mirrors data-body-status="Edited" onto the picker's
    // hidden collection DOM so the UI reflects the new state.
    function openBodyEditor(articleItemId, articleTitle) {
      if (!window.InbxRTE || typeof window.InbxRTE.openFullscreen !== 'function') {
        console.error('[TA-STUDIO] window.InbxRTE not available. Is ta-rte-v1.0.0.js loaded on this page?');
        alert('Body editor is not loaded. Make sure ta-rte-v1.0.0.js is loaded on this page.');
        return;
      }
      if (!articleItemId) {
        console.error('[TA-STUDIO] openBodyEditor called without articleItemId');
        return;
      }

      // v1.1.4: Defensive cleanup. If a prior RTE instance is alive,
      // close it. If any orphaned .rte-fs-overlay elements are in the
      // DOM from prior broken sessions, remove them. Prevents overlay
      // stacking that causes the "grey screen after close" symptom
      // observed in v1.1.3.
      if (window._studioRteInstance &&
          typeof window._studioRteInstance.closeFullscreen === 'function') {
        try { window._studioRteInstance.closeFullscreen(); } catch (e) {}
      }
      window._studioRteInstance = null;
      Array.prototype.forEach.call(
        document.querySelectorAll('.rte-fs-overlay'),
        function (el) { try { el.remove(); } catch (e) {} }
      );
      // Also ensure body scroll is re-enabled (RTE sets overflow:hidden
      // on open and clears on destroy — but stale overlays can leave
      // this set).
      document.body.style.overflow = '';

      fetchArticleBody(articleItemId).then(function (html) {
        if (html === null) {
          alert('Could not load the current article body. Check the console for details.');
          return;
        }
        window._studioRteInstance = window.InbxRTE.openFullscreen({
          articleItemId: articleItemId,
          articleTitle: articleTitle || '',
          initialHTML: html,
          mode: 'edit',
          onSave: function (editedHTML) {
            saveArticleBody(articleItemId, editedHTML)
              .then(function () {
                console.log('[TA-STUDIO] Body saved + body-status=Edited for', articleItemId);
                // Mirror the new body-status onto the hidden collection
                // DOM so the picker reflects it without a page reload.
                var el = document.querySelector('.articles-wrapper[data-article-id="' + articleItemId + '"]');
                if (el) el.setAttribute('data-body-status', 'Edited');
                // v1.1.4: Close the RTE modal. RTE's handleSave() set
                // dirty=false before firing onSave, so closeFullscreen
                // will not trigger the "unsaved changes" confirm dialog.
                if (window._studioRteInstance &&
                    typeof window._studioRteInstance.closeFullscreen === 'function') {
                  window._studioRteInstance.closeFullscreen();
                }
                window._studioRteInstance = null;
                // v1.2.4: banner replaces toast — persistent during reload
                // wait window so user sees one continuous "saved → refreshing"
                // affordance.
                studioReloadAfterCMSWrite({ bannerLabel: '\u2713 Body saved \u2014 refreshing\u2026' });
              })
              .catch(function (err) {
                console.error('[TA-STUDIO] Body save failed:', err);
                // Do NOT close the modal — user keeps their edits and
                // can retry after addressing the error.
                alert('Save failed: ' + trimErrorText(err.message || String(err)) +
                      '\n\nYour edits are still in the editor \u2014 you can try again.');
              });
          },
          onClose: function () {
            window._studioRteInstance = null;
          }
        });
      });
    }

    // v1.1.4: Non-blocking success toast rendered into <body>.
    // Survives Studio's renderAssembler() DOM replacement because it
    // lives outside the Studio mount.
    function showStudioToast(message, opts) {
      opts = opts || {};
      var duration = opts.duration || 2200;
      // Remove any stale toast first
      var existing = document.getElementById('studio-toast');
      if (existing) existing.remove();
      var toast = document.createElement('div');
      toast.id = 'studio-toast';
      toast.className = 'studio-toast';
      toast.textContent = message;
      document.body.appendChild(toast);
      // Force reflow so the transition runs
      void toast.offsetWidth;
      toast.classList.add('visible');
      setTimeout(function () {
        toast.classList.remove('visible');
        setTimeout(function () {
          if (toast && toast.parentNode) toast.remove();
        }, 320);
      }, duration);
    }

    // v1.2.3: shared reload helper. Called by every successful CMS-write
    // path so the user sees fresh data-bound attributes without manually
    // refreshing.
    //
    // v1.2.4: now also (a) persists Studio state to sessionStorage so
    // the reload restores sub-panel + open article instead of dumping
    // the user on PubPlan, and (b) renders a persistent banner during
    // the wait window instead of relying on the fading success toast.
    //
    // Why a hard reload (not soft re-render): the JS reads from
    // .articles-wrapper[data-item] data attributes, which Webflow renders
    // into the published page HTML. A soft re-render reads stale
    // attributes from the DOM that's already loaded. Only a fresh page
    // fetch returns updated attributes.
    //
    // Pre-conditions for safe reload:
    //   - The success path has already promoted current → loaded (or
    //     equivalent) so countDirty() === 0. Otherwise the beforeunload
    //     guard would prompt "you have unsaved changes" before reload.
    //   - S.edit.saving is reset to false to release any save bar state.
    //
    // Bypass: if reloadOnSuccess === false in opts, skip the reload.
    var STUDIO_RESTORE_KEY = 'ta-studio-restore-v1';
    function studioReloadAfterCMSWrite(opts) {
      opts = opts || {};
      var delayMs = (typeof opts.delayMs === 'number') ? opts.delayMs : 1500;
      if (opts.reloadOnSuccess === false) return;
      if (window._studioReloadQueued) return;
      window._studioReloadQueued = true;

      // v1.2.4: persist Studio state for restore-after-reload.
      try {
        var restorePayload = {
          panel: S.panel || 'assembler',
          selectedAssetId: S.selectedAssetId || null,
          cmpFilters: (S.cmp && S.cmp.filters) ? {
            searchName: S.cmp.filters.searchName || '',
            status:     S.cmp.filters.status || 'Available',
            role:       S.cmp.filters.role || 'All',
            mediaType:  S.cmp.filters.mediaType || 'All',
            customerId: S.cmp.filters.customerId || 'All',
            productId:  S.cmp.filters.productId || 'All'
          } : null,
          ts: Date.now()
        };
        sessionStorage.setItem(STUDIO_RESTORE_KEY, JSON.stringify(restorePayload));
      } catch (e) {
        // sessionStorage can fail in some private-browsing modes; carry on.
        console.warn('[TA-STUDIO v1.2.6] could not persist restore state:', e);
      }

      // v1.2.4: persistent banner replaces the fading toast for reload paths.
      // The success toast that fired just before this call is dismissed in
      // favor of the banner so the user sees one continuous affordance.
      showStudioReloadBanner(opts.bannerLabel || 'Saved \u2014 refreshing\u2026');

      setTimeout(function () {
        try {
          var u = new URL(window.location.href);
          u.searchParams.set('_r', Date.now().toString());
          window.location.replace(u.toString());
        } catch (e) {
          window.location.reload();
        }
      }, delayMs);
    }

    // v1.2.4: renders a sticky banner at the top of the Studio mount
    // during the reload wait window. CSS in ta-studio-components-v1.0.5.css
    // (.studio-reload-banner). Replaces any existing toast so the user
    // gets one continuous "saved → refreshing" message.
    function showStudioReloadBanner(label) {
      // Dismiss any active toast first
      var stale = document.getElementById('studio-toast');
      if (stale) stale.remove();
      var existing = document.getElementById('studio-reload-banner');
      if (existing) existing.remove();
      var banner = document.createElement('div');
      banner.id = 'studio-reload-banner';
      banner.className = 'studio-reload-banner';
      banner.innerHTML =
        '<div class="studio-reload-banner-msg">' +
          '<span class="studio-reload-banner-spinner"></span>' +
          '<span class="studio-reload-banner-text">' + (label || 'Refreshing\u2026') + '</span>' +
        '</div>' +
        '<div class="studio-reload-banner-progress"><div class="studio-reload-banner-progress-fill"></div></div>';
      document.body.appendChild(banner);
      // Force reflow so the entry transition runs
      void banner.offsetWidth;
      banner.classList.add('visible');
    }

    // v1.2.4: read sessionStorage and apply restored Studio state.
    // Called once at mount, before the first render. Clears the
    // storage after consuming so a manual reload doesn't keep
    // restoring stale state.
    //
    // Restored state:
    //   - S.panel         (sub-tab)
    //   - S.selectedAssetId (open article)
    //   - S.cmp.filters   (Components grid filter state)
    //
    // Best-effort: the outer T-A tab system is owned by body.js,
    // not Studio. We try to click the "Studio" outer tab via
    // text-content lookup. If it fails (selector miss, system
    // not present, etc.) the user just clicks Studio manually
    // and lands on the correct sub-state.
    function studioRestoreFromSession() {
      var raw;
      try {
        raw = sessionStorage.getItem(STUDIO_RESTORE_KEY);
        if (!raw) return;
        sessionStorage.removeItem(STUDIO_RESTORE_KEY);  // consume once
      } catch (e) {
        return;
      }
      var data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        return;
      }
      if (!data) return;

      // Stale-payload guard: if the persisted state is older than 30s,
      // assume it's a leftover from an earlier session that didn't
      // complete its reload (e.g. user manually navigated away mid-wait).
      // Discard rather than restore stale state.
      if (data.ts && (Date.now() - data.ts > 30000)) return;

      if (data.panel) S.panel = data.panel;
      if (data.selectedAssetId) S.selectedAssetId = data.selectedAssetId;
      if (data.cmpFilters && S.cmp && S.cmp.filters) {
        Object.keys(data.cmpFilters).forEach(function (k) {
          if (data.cmpFilters[k] !== undefined) {
            S.cmp.filters[k] = data.cmpFilters[k];
          }
        });
      }

      // Best-effort: click the outer "Studio" tab so the user lands here.
      // Deferred to next tick so body.js's DOMContentLoaded handler has
      // a chance to wire up .tab-button click handlers first (otherwise
      // the click on .tab-button has no handler attached and no-ops).
      // The .w-tab-link fallback works regardless of body.js order.
      setTimeout(studioActivateOuterTab, 0);
    }

    // v1.2.5: outer-tab activation matching body.js's proven pattern.
    // The T-A page uses Webflow native tabs (.w-tab-link) wrapped by a
    // custom .tab-button proxy layer (body.js lines 263–268). Clicking
    // a .tab-button triggers body.js's handler which finds the matching
    // .w-tab-link via :contains(text) and clicks it.
    //
    // Activation order:
    //   1. Find .tab-button whose text content is "Studio" — click it.
    //      body.js handles the proxy to .w-tab-link.
    //   2. Fallback: if no matching .tab-button, click the .w-tab-link
    //      directly. This works because .w-tab-link is the Webflow-
    //      native tab anchor that drives panel visibility.
    //   3. Final fallback: try legacy selectors (data-ta-tab, etc.) in
    //      case of future schema changes. Silent no-op if none match.
    //
    // The text-content match uses an exact string compare (case-insensitive,
    // trimmed) to avoid the :contains-style false positives where "Studio"
    // would also match "Studio Pro" or similar.
    function studioActivateOuterTab() {
      var STUDIO_LABEL = 'studio';

      function isStudioLabel(el) {
        if (!el) return false;
        var t = (el.textContent || '').trim().toLowerCase();
        return t === STUDIO_LABEL;
      }

      // 1) .tab-button proxy (body.js handler does the rest)
      var tabBtns = document.querySelectorAll('.tab-button');
      for (var i = 0; i < tabBtns.length; i++) {
        if (isStudioLabel(tabBtns[i])) {
          try { tabBtns[i].click(); return; } catch (e) {}
        }
      }

      // 2) Direct .w-tab-link click (Webflow-native)
      var tabLinks = document.querySelectorAll('.w-tab-link');
      for (var j = 0; j < tabLinks.length; j++) {
        if (isStudioLabel(tabLinks[j])) {
          try { tabLinks[j].click(); return; } catch (e) {}
        }
      }

      // 3) Legacy fallbacks (defensive — schema may change)
      var p1 = document.querySelector('[data-ta-tab="studio"], [data-tab="studio"]');
      if (p1) { try { p1.click(); return; } catch (e) {} }
      var p3 = document.querySelector('#studio-tab, .studio-tab');
      if (p3) { try { p3.click(); return; } catch (e) {} }
      // No match — silent no-op. User clicks Studio manually.
    }

    function updateSaveBarSavingState() {
      var bar = document.getElementById('asm-save-bar');
      if (!bar) return;
      bar.classList.add('saving');
      var btn = bar.querySelector('[data-asm-save]');
      if (btn) { btn.disabled = true; btn.textContent = 'Saving\u2026'; }
    }

    // Close the open asset — used by Cancel link and Back.
    // If dirty, confirm before closing.
    function closeAsset(force) {
      if (!force && countDirty() > 0) {
        if (!window.confirm('You have ' + countDirty() + ' unsaved change' + (countDirty() === 1 ? '' : 's') + '. Close and discard?')) {
          return;
        }
      }
      S.selectedAssetId = null;
      S.edit.loaded = {};
      S.edit.current = {};
      // v1.2.0: clear any open Assembler picker + transient mainImage override.
      // The override exists only for the optimistic-update window between
      // a successful Route 4 attach and Webflow republish; once the user
      // navigates away, fresh DOM reads should be authoritative.
      if (S.asm) {
        S.asm.picker = {
          slot: null,
          selectedMediaId: null,
          customerId: 'All',
          productId: 'All',
          inFlight: false,
          failed: false
        };
        S.asm.mainImageOverride = {};
      }
      renderAssembler();
    }

    // Customers / Products / MNLS (for filter dropdowns)
    function readCustomers() {
      return dedupe(
        Array.prototype.map.call(
          document.querySelectorAll('.customers-wrapper[data-item]'),
          function (el) {
            return { id: (el.dataset.id || '').trim(), name: (el.dataset.name || '').trim() };
          }
        ).filter(function (c) { return c.id; })
      ).sort(byName);
    }
    function readProducts() {
      return dedupe(
        Array.prototype.map.call(
          document.querySelectorAll('.products-wrapper[data-item]'),
          function (el) {
            return { id: (el.dataset.id || '').trim(), name: (el.dataset.name || '').trim() };
          }
        ).filter(function (p) { return p.id; })
      ).sort(byName);
    }
    function readMnls() {
      // MNLS values come from Articles' data-mnls-id / data-mnls-name
      var seen = {};
      Array.prototype.forEach.call(
        document.querySelectorAll('.articles-wrapper[data-item]'),
        function (el) {
          var id = (el.dataset.mnlsId || '').trim();
          var name = (el.dataset.mnlsName || '').trim();
          if (id && !seen[id]) seen[id] = { id: id, name: name || id };
        }
      );
      return Object.keys(seen).map(function (k) { return seen[k]; }).sort(byName);
    }
    function dedupe(arr) {
      var seen = {};
      return arr.filter(function (x) {
        if (seen[x.id]) return false;
        seen[x.id] = true;
        return true;
      });
    }
    function byName(a, b) { return (a.name || '').localeCompare(b.name || ''); }

    // ═══════════════════════════════════════════
    // ASSEMBLER rendering
    // ═══════════════════════════════════════════

    function renderAssembler() {
      var root = document.getElementById('asm-root');
      if (!root) return;

      // v1.1.3: body-class toggle drives design-system CSS that hides
      // .publisher-wrapper while editing. Class is driven by state, not
      // by DOM events — so every entry/exit path (open, save-auto-close,
      // cancel, back, reset-then-close) is covered by this one update.
      if (S.selectedAssetId) {
        document.body.classList.add('studio-editing');
        renderOpenAssembler(root);
      } else {
        document.body.classList.remove('studio-editing');
        renderPicker(root);
      }
    }

    // ── Asset picker view ──
    function renderPicker(root) {
      var customers = readCustomers();
      var products = readProducts();
      var mnls = readMnls();

      var h = '';

      h += '<div class="asm-phase-notice"><strong>Phase 2.</strong> Pick an Article to edit inline. Changes save directly to Webflow. Component attachment arrives in Phase 3. Ads / Events / RE coming in Phase 6.</div>';

      h += '<div class="asm-picker-wrap">';

      // Header + type toggle
      h += '<div class="asm-picker-head">';
      h += '<div class="asm-picker-title">Pick an Asset</div>';
      h += '<div class="asm-picker-sub">Filter by type, customer, product, or section</div>';
      h += '<div class="asm-type-toggle">';
      h += typeOpt('articles', 'Articles');
      h += typeOpt('ads', 'Ads');
      h += typeOpt('events', 'Events');
      h += typeOpt('re', 'RE Listings');
      h += '</div>';
      h += '</div>';

      // Filters
      h += '<div class="asm-filters">';
      h += '<div class="asm-ff"><label class="asm-fl">Name</label>' +
           '<input class="asm-finp" id="asm-f-name" type="text" placeholder="Search\u2026" value="' + esc(S.filter.name) + '"></div>';
      h += '<div class="asm-ff"><label class="asm-fl">Customer</label>' +
           '<select class="asm-fsel" id="asm-f-customer">' +
             '<option value="">All customers</option>' +
             customers.map(function (c) {
               return '<option value="' + esc(c.id) + '"' + (c.id === S.filter.customerId ? ' selected' : '') + '>' + esc(c.name) + '</option>';
             }).join('') +
           '</select></div>';
      h += '<div class="asm-ff"><label class="asm-fl">Product Library</label>' +
           '<select class="asm-fsel" id="asm-f-product">' +
             '<option value="">All products</option>' +
             products.map(function (p) {
               return '<option value="' + esc(p.id) + '"' + (p.id === S.filter.productId ? ' selected' : '') + '>' + esc(p.name) + '</option>';
             }).join('') +
           '</select></div>';
      h += '<div class="asm-ff"><label class="asm-fl">MNLS</label>' +
           '<select class="asm-fsel" id="asm-f-mnls">' +
             '<option value="">All sections</option>' +
             mnls.map(function (m) {
               return '<option value="' + esc(m.id) + '"' + (m.id === S.filter.mnlsId ? ' selected' : '') + '>' + esc(m.name) + '</option>';
             }).join('') +
           '</select></div>';
      h += '<div class="asm-ff asm-sort-wrap"><label class="asm-fl">Sort</label>' +
           '<select class="asm-fsel" id="asm-f-sort">' +
             sortOpt('recent-edited', 'Recently edited') +
             sortOpt('recent-added', 'Recently added') +
             sortOpt('name', 'Name A-Z') +
           '</select></div>';
      h += '</div>';

      // Availability toggle
      h += '<div style="padding:6px 18px;border-bottom:1px solid var(--ix-border-soft);background:var(--ix-white);font-family:var(--ix-font-mono);font-size:10px;color:var(--ix-text-mid);display:flex;align-items:center;gap:10px">';
      h += '<label style="display:flex;align-items:center;gap:6px;cursor:pointer">';
      h += '<input type="checkbox" id="asm-f-avail"' + (S.filter.availabilityOnly ? ' checked' : '') + '>';
      h += '<span>Show available only <span style="color:var(--ix-text-tiny)">(not newsletter-attached + not Live)</span></span>';
      h += '</label>';
      h += '</div>';

      // Results list
      h += renderResultsList();

      h += '</div>';

      root.innerHTML = h;

      // Bind filter events
      bindFilterEvents(root);
    }

    function typeOpt(id, label) {
      var disabled = id !== 'articles';
      return '<button class="asm-type-opt' + (id === S.assetType ? ' active' : '') + '"' +
        (disabled ? ' disabled title="Phase 6"' : '') +
        ' data-asm-type="' + id + '">' +
        esc(label) + (disabled ? ' \u2014 soon' : '') +
        '</button>';
    }

    function sortOpt(val, label) {
      return '<option value="' + val + '"' + (val === S.filter.sort ? ' selected' : '') + '>' + esc(label) + '</option>';
    }

    function renderResultsList() {
      if (S.assetType !== 'articles') {
        return '<div class="asm-results-empty">' + S.assetType.toUpperCase() + ' support arrives in Phase 6.</div>';
      }

      var items = getFilteredArticles();
      var h = '<div class="asm-result-count">' + items.length + ' article' + (items.length === 1 ? '' : 's') + '</div>';

      if (!items.length) {
        h += '<div class="asm-results-empty">No articles match these filters.</div>';
        return '<div class="asm-results">' + h + '</div>';
      }

      h += '<div>';
      items.forEach(function (a) {
        var dotClass = a.newsletterId ? 'assigned' : (a.status === 'live' ? 'live' : 'draft');
        var metaBits = [];
        if (a.customerName) metaBits.push(esc(a.customerName));
        else metaBits.push('<span style="color:var(--ix-text-tiny)">No customer</span>');
        if (a.productName) metaBits.push(esc(a.productName));
        if (a.mnlsName) metaBits.push(esc(a.mnlsName));
        if (a.newsletterName) metaBits.push('\u2192 ' + esc(a.newsletterName));

        h += '<div class="asm-result" data-asm-open="' + esc(a.id) + '">';
        h += '<div class="asm-result-main">';
        h += '<div class="asm-result-name">' + (esc(a.name) || '<em>Untitled</em>') + '</div>';
        h += '<div class="asm-result-meta">';
        h += '<span class="asm-status-dot ' + dotClass + '"></span>';
        h += '<span>' + (a.newsletterId ? 'ASSIGNED' : a.status.toUpperCase()) + '</span>';
        metaBits.forEach(function (b, i) {
          h += '<span class="sep">\u00B7</span><span>' + b + '</span>';
        });
        h += '</div></div>';
        h += '<div></div>';
        h += '<div class="asm-result-chevron">\u203A</div>';
        h += '</div>';
      });
      h += '</div>';

      return '<div class="asm-results">' + h + '</div>';
    }

    function getFilteredArticles() {
      var items = readArticles();

      if (S.filter.availabilityOnly) {
        items = items.filter(function (a) {
          return !a.newsletterId && a.status !== 'live';
        });
      }

      var nameQ = S.filter.name.toLowerCase().trim();
      if (nameQ) items = items.filter(function (a) { return (a.name || '').toLowerCase().indexOf(nameQ) !== -1; });
      if (S.filter.customerId) items = items.filter(function (a) { return a.customerId === S.filter.customerId; });
      if (S.filter.productId)  items = items.filter(function (a) { return a.productId  === S.filter.productId; });
      if (S.filter.mnlsId)     items = items.filter(function (a) { return a.mnlsId     === S.filter.mnlsId; });

      items.sort(function (a, b) {
        if (S.filter.sort === 'name') return (a.name || '').localeCompare(b.name || '');
        if (S.filter.sort === 'recent-added') return cmpDesc(a.created, b.created);
        return cmpDesc(a.updated || a.created, b.updated || b.created); // recent-edited (default)
      });

      return items;
    }

    function cmpDesc(a, b) {
      a = a || ''; b = b || '';
      if (a === b) return 0;
      return a < b ? 1 : -1;
    }

    function bindFilterEvents(root) {
      // Type toggle
      Array.prototype.forEach.call(root.querySelectorAll('[data-asm-type]'), function (b) {
        b.addEventListener('click', function () {
          if (b.disabled) return;
          S.assetType = b.getAttribute('data-asm-type');
          renderAssembler();
        });
      });

      // Filters
      var byId = function (id) { return root.querySelector('#' + id); };
      var onName = byId('asm-f-name');
      if (onName) onName.addEventListener('input', function () { S.filter.name = onName.value; updateResults(); });
      var onCust = byId('asm-f-customer');
      if (onCust) onCust.addEventListener('change', function () { S.filter.customerId = onCust.value; updateResults(); });
      var onProd = byId('asm-f-product');
      if (onProd) onProd.addEventListener('change', function () { S.filter.productId = onProd.value; updateResults(); });
      var onMnls = byId('asm-f-mnls');
      if (onMnls) onMnls.addEventListener('change', function () { S.filter.mnlsId = onMnls.value; updateResults(); });
      var onSort = byId('asm-f-sort');
      if (onSort) onSort.addEventListener('change', function () { S.filter.sort = onSort.value; updateResults(); });
      var onAvail = byId('asm-f-avail');
      if (onAvail) onAvail.addEventListener('change', function () { S.filter.availabilityOnly = onAvail.checked; updateResults(); });

      // Result click
      root.addEventListener('click', function (e) {
        var row = e.target.closest('[data-asm-open]');
        if (!row) return;
        S.selectedAssetId = row.getAttribute('data-asm-open');
        renderAssembler();
      });
    }

    function updateResults() {
      var host = document.querySelector('#asm-root .asm-picker-wrap');
      if (!host) return;
      // Replace just the results container
      var existing = host.querySelector('.asm-results');
      var emptyNode = host.querySelector('.asm-results-empty'); // if no asm-results, this might be the fallback
      var replacement = document.createElement('div');
      replacement.innerHTML = renderResultsList();
      var newList = replacement.firstElementChild;
      if (existing) existing.parentNode.replaceChild(newList, existing);
      else if (emptyNode) emptyNode.parentNode.replaceChild(newList, emptyNode);
      else host.appendChild(newList);
    }

    // ── Open Assembler (single asset) ──
    function renderOpenAssembler(root) {
      var articles = readArticles();
      var a = articles.find(function (x) { return x.id === S.selectedAssetId; });

      if (!a) {
        root.innerHTML = '<div class="asm-results-empty">Article not found. It may have been removed, or its CMS data hasn\u2019t loaded yet.</div>' +
                        '<div style="text-align:center;margin-top:12px"><button class="asm-back-btn" id="asm-back">\u2190 Back to picker</button></div>';
        document.getElementById('asm-back').addEventListener('click', function () {
          closeAsset(true);
        });
        return;
      }

      // Snapshot loaded values ONCE on open (only if we haven't already
      // loaded this asset). On re-render after save, S.edit.loaded has
      // been promoted already and we don't want to re-snapshot.
      var hasSnapshot = Object.keys(S.edit.loaded).length > 0;
      if (!hasSnapshot) {
        loadEditSnapshot(a);
      }

      var dirtyCount = countDirty();
      var h = '';

      // Back row — phase label becomes "Editable view (Session 1)"
      h += '<div class="asm-back-row">';
      h += '<button class="asm-back-btn" data-asm-back-btn>\u2190 Back to picker</button>';
      h += '<div style="font-family:var(--ix-font-mono);font-size:10px;color:var(--ix-text-light);letter-spacing:0.04em;text-transform:uppercase">Editable view (v1.1.6) \u00B7 Live save via Scenario G</div>';
      h += '</div>';

      // Metadata strip (read-only display of current values)
      h += '<div class="asm-meta-strip">';
      h += '<div class="asm-meta-bar"></div>';
      h += '<div class="asm-meta-body">';
      var titleDisplay = S.edit.current.articleTitle || a.name || '<em>Untitled</em>';
      h += metaCell('Article', esc(titleDisplay), 'primary');
      h += metaCell('Customer', a.customerName || '', a.customerName ? '' : 'empty');
      h += metaCell('Product', a.productName || '', a.productName ? '' : 'empty');
      h += metaCell('MNLS', a.mnlsName || '', a.mnlsName ? '' : 'empty');
      // Status pill
      var statusNow = (S.edit.current.publishStatus || a.status || 'draft').toLowerCase();
      var pillClass = a.newsletterId ? 'assigned' : statusNow;
      var pillLabel = a.newsletterId ? 'Assigned' : (statusNow === 'live' ? 'Live' : 'Draft');
      h += '<div class="asm-meta-cell">';
      h += '<div class="asm-meta-label">Status</div>';
      h += '<div class="asm-status-pill ' + pillClass + '">' + pillLabel + '</div>';
      if (a.newsletterId && a.newsletterName) {
        h += '<div class="asm-meta-value" style="font-size:11px;color:var(--ix-text-light);margin-top:2px">' + esc(a.newsletterName) + (a.newsletterDate ? ' \u00B7 ' + esc(a.newsletterDate) : '') + '</div>';
      }
      h += '</div>';
      h += '</div>';
      h += '</div>';

      // Three columns
      h += '<div class="asm-columns">';
      h += renderCol1(a);
      h += renderCol2(a);
      h += renderCol3(a);
      h += '</div>';

      // Save bar (sticky at bottom)
      h += renderSaveBar(dirtyCount);

      root.innerHTML = h;

      // Wire events
      bindOpenAssemblerEvents(root, a);

      // Install unload guard lazily — only once any dirty field appears
      if (dirtyCount > 0) installBeforeUnload();
    }

    function renderSaveBar(dirtyCount) {
      var h = '';
      h += '<div class="asm-save-bar' + (dirtyCount > 0 ? ' has-changes' : '') + (S.edit.saveJustFinished ? ' just-saved' : '') + '" id="asm-save-bar">';
      h += '<a class="asm-cancel-link" data-asm-cancel href="javascript:void(0)">\u2715 cancel \u2014 close without saving</a>';
      h += '<div class="asm-save-right">';
      h += '<span class="asm-save-info">' + (dirtyCount > 0 ? (dirtyCount + ' field' + (dirtyCount === 1 ? '' : 's') + ' ready to save') : 'Clean \u2014 no pending changes') + '</span>';
      h += '<button class="asm-reset-btn" data-asm-reset' + (dirtyCount === 0 ? ' disabled' : '') + '>\u21BB Reset</button>';
      h += '<button class="asm-save-btn" data-asm-save' + (dirtyCount === 0 ? ' disabled' : '') + '>';
      h += (dirtyCount === 0 ? 'No changes' : 'Save ' + dirtyCount + ' change' + (dirtyCount === 1 ? '' : 's'));
      h += '</button>';
      h += '</div>';
      h += '</div>';
      return h;
    }

    function bindOpenAssemblerEvents(root, a) {
      // Back button
      var back = root.querySelector('[data-asm-back-btn]');
      if (back) back.addEventListener('click', function () { closeAsset(false); });

      // Save bar actions
      var cancel = root.querySelector('[data-asm-cancel]');
      if (cancel) cancel.addEventListener('click', function () { closeAsset(false); });
      var reset = root.querySelector('[data-asm-reset]');
      if (reset) reset.addEventListener('click', function () {
        if (countDirty() === 0) return;
        if (!window.confirm('Discard ' + countDirty() + ' pending change' + (countDirty() === 1 ? '' : 's') + ' and revert to loaded values?')) return;
        revertAll();
      });
      var save = root.querySelector('[data-asm-save]');
      if (save) save.addEventListener('click', function () { triggerSave(); });

      // v1.1.2: Article body launcher — Studio-owned body editor flow.
      // Calls Scenario G Route 1 (getArticleBody) to fetch current
      // post-body HTML, opens InbxRTE fullscreen, then on save calls
      // Scenario G Route 3 (updateArticleBody) with bodyStatus=edited.
      // No dependency on window.InbxEditBody or uploads-processor.
      var bodyBtn = root.querySelector('[data-asm-body-launch]');
      if (bodyBtn) {
        bodyBtn.addEventListener('click', function () {
          openBodyEditor(a.id, a.name);
        });
      }

      // v1.2.0: Assembler field-level Attach picker handlers.
      // Click delegation — handles open/cancel/confirm + card selection.
      root.addEventListener('click', function (e) {
        var t = e.target;
        if (!t || !t.closest) return;

        // Open picker on a slot
        var openBtn = t.closest('[data-asm-attach-open]');
        if (openBtn) {
          e.preventDefault();
          asmHandlePickerOpen(openBtn.getAttribute('data-asm-attach-open'));
          return;
        }

        // Cancel link inside picker footer
        if (t.closest('[data-asm-pick-cancel]')) {
          e.preventDefault();
          asmHandlePickerCancel();
          return;
        }

        // Confirm button inside picker footer
        if (t.closest('[data-asm-pick-confirm]')) {
          e.preventDefault();
          asmHandlePickerConfirm();
          return;
        }

        // Pick card → select
        var card = t.closest('[data-asm-pick-mediaid]');
        if (card) {
          e.preventDefault();
          asmHandlePickerSelect(card.getAttribute('data-asm-pick-mediaid'));
          return;
        }
      });

      // Change delegation for picker filter dropdowns. Listening for
      // 'change' specifically (not 'input') so single-character partial
      // states don't trigger renders mid-typing — and selects only emit
      // change anyway.
      root.addEventListener('change', function (e) {
        var el = e.target;
        if (!el || !el.matches) return;
        if (el.matches('[data-asm-pick-customer]')) {
          asmHandlePickerCustomer(el.value);
          return;
        }
        if (el.matches('[data-asm-pick-product]')) {
          asmHandlePickerProduct(el.value);
          return;
        }
      });

      // Wire every editable field — delegate input & change to one handler
      root.addEventListener('input', function (e) {
        var el = e.target;
        var key = el.getAttribute && el.getAttribute('data-asm-field');
        if (!key) return;
        var val = (el.type === 'checkbox') ? el.checked : el.value;
        onFieldChange(key, val);
      });
      root.addEventListener('change', function (e) {
        var el = e.target;
        var key = el.getAttribute && el.getAttribute('data-asm-field');
        if (!key) return;
        var val = (el.type === 'checkbox') ? el.checked : el.value;
        onFieldChange(key, val);
      });
    }

    function metaCell(label, value, cls) {
      return '<div class="asm-meta-cell">' +
        '<div class="asm-meta-label">' + esc(label) + '</div>' +
        '<div class="asm-meta-value ' + (cls || '') + '">' + (value || '<span class="empty">\u2014</span>') + '</div>' +
        '</div>';
    }

    // Column 1 — Text
    function renderCol1(a) {
      var h = '';
      h += '<div class="asm-col">';
      h += '<div class="asm-col-head"><div class="asm-col-title">Text</div><div class="asm-col-count">1 of 3</div></div>';
      h += '<div class="asm-col-body">';

      h += editText('articleTitle',   'Title',           { required: true });
      h += editText('subtitle',       'Sub-Title');
      h += editText('bannerStatement','Banner Statement');
      h += editTextarea('teaser',       'Teaser Summary',  { limit: 400, rows: 3 });
      h += editTextarea('shortSummary', 'Short Summary',   { limit: 150, rows: 2 });

      // Revenue Type — select.
      // Values are the Webflow option LABELS. translateDirtyForPayload()
      // converts label → hash via TA_CONFIG.optionIds.revenueType on save.
      var rtOpts = [
        { v: '',             l: '\u2014 None \u2014' },
        { v: 'Paid Ad',      l: 'Paid Ad' },
        { v: 'Paid Article', l: 'Paid Article' },
        { v: 'Sponsorable',  l: 'Sponsorable' }
      ];
      h += editSelect('revenueType', 'Revenue Type', rtOpts);

      // Writers block — two pairs of inline fields
      h += '<div class="asm-sc asm-sc-group">';
      h += '<div class="asm-sc-label">Writer</div>';
      h += '<div class="asm-sc-row">';
      h += editInlineText('writerName',  'Name');
      h += editInlineText('writerTitle', 'Title / Role');
      h += '</div>';
      h += '</div>';

      h += '<div class="asm-sc asm-sc-group">';
      h += '<div class="asm-sc-label">Co-Writer</div>';
      h += '<div class="asm-sc-row">';
      h += editInlineText('cowriterName',  'Name');
      h += editInlineText('cowriterTitle', 'Title / Role');
      h += '</div>';
      h += '</div>';

      h += '</div></div>';
      return h;
    }

    // Column 2 — Media
    function renderCol2(a) {
      var h = '';
      h += '<div class="asm-col">';
      h += '<div class="asm-col-head"><div class="asm-col-title">Media</div><div class="asm-col-count">2 of 3</div></div>';
      h += '<div class="asm-col-body">';

      // ─── Main Image slot (v1.2.0) ───
      // Empty state: [Attach Main Image] button.
      // Populated state: preview thumb + small "Replace" text link.
      // Picker: when S.asm.picker.slot === 'mainImage', renders inline
      // below the slot — same vertical-grow pattern as Components-tab
      // State B.
      var pickerOpenForMain = S.asm.picker.slot === 'mainImage';
      h += '<div class="asm-img-slot' + (pickerOpenForMain ? ' asm-img-slot--picking' : '') + '" data-asm-slot="mainImage">';
      h += '<div class="asm-img-slot-label">Main Image</div>';
      var imgUrl = buildMainImageUrl(a);
      if (imgUrl) {
        h += '<img class="asm-img-thumb" src="' + esc(imgUrl) + '" alt="' + esc(S.edit.current.mainImageAlt || a.mainImageAlt || '') + '">';
        // "Replace" text link — opens same picker
        if (!pickerOpenForMain) {
          h += '<div class="asm-img-slot-actions">' +
                 '<button type="button" class="asm-link-btn" data-asm-attach-open="mainImage">Replace</button>' +
               '</div>';
        }
      } else {
        h += '<div class="asm-img-placeholder">No main image</div>';
        if (!pickerOpenForMain) {
          h += '<div class="asm-img-slot-actions">' +
                 '<button type="button" class="cmp-btn cmp-btn--primary" data-asm-attach-open="mainImage">Attach Main Image</button>' +
               '</div>';
        }
      }
      // Editable alt text
      h += editInlineText('mainImageAlt', 'Alt Text');
      // Inline picker (v1.2.0) — renders only when this slot is the active picker
      if (pickerOpenForMain) {
        h += renderAsmPicker(a, 'mainImage');
      }
      h += '</div>';

      // ─── Interior Images slot (v1.2.0) ───
      // Reads attached MEDIA from S.cmp.items filtered to current article
      // + role=Interior Image. Renders gallery + persistent
      // [+ Attach Interior Image] button. Multi-attach allowed.
      var pickerOpenForInterior = S.asm.picker.slot === 'interiorImage';
      h += '<div class="asm-img-slot' + (pickerOpenForInterior ? ' asm-img-slot--picking' : '') + '" data-asm-slot="interiorImage">';
      h += '<div class="asm-img-slot-label">Interior Images</div>';
      var interiorAttached = asmGetAttachedInteriorImages(a);
      if (interiorAttached.length > 0) {
        h += '<div class="asm-gallery">';
        interiorAttached.forEach(function (it) {
          var thumbUrl = it.imageUrl ? cmpBuildThumbUrl(it.imageUrl) : '';
          h += '<div class="asm-gallery-item" data-asm-gallery-mediaid="' + esc(it.mediaId) + '">';
          if (thumbUrl) {
            h += '<img class="asm-gallery-thumb" src="' + esc(thumbUrl) + '" alt="' + esc(it.name) + '" loading="lazy">';
          } else {
            h += '<div class="asm-gallery-thumb asm-gallery-thumb--empty"></div>';
          }
          h += '<div class="asm-gallery-name">' + esc(it.name || '(Untitled)') + '</div>';
          h += '</div>';
        });
        h += '</div>';
      } else {
        h += '<div class="asm-gallery-empty">No interior images attached yet.</div>';
      }
      if (!pickerOpenForInterior) {
        h += '<div class="asm-img-slot-actions">' +
               '<button type="button" class="cmp-btn cmp-btn--primary" data-asm-attach-open="interiorImage">+ Attach Interior Image</button>' +
             '</div>';
      }
      if (pickerOpenForInterior) {
        h += renderAsmPicker(a, 'interiorImage');
      }
      h += '</div>';

      // Photo credits — editable switch + conditional photographer field
      h += editSwitch('showPhotoCredits', 'Show Photo Credits');
      h += editText('photographer', 'Photographer');

      // Photo essay + video flags
      h += editSwitch('photoEssay', 'Photo Essay');
      h += editSwitch('videoArticle', 'Video Article');
      h += editText('videoUrl', 'Video URL', { type: 'url', placeholder: 'https://\u2026' });
      h += editText('audioUrl', 'Audio URL', { type: 'url', placeholder: 'https://\u2026' });

      h += '</div></div>';
      return h;
    }

    // Column 3 — Editorial / metadata / CTA
    function renderCol3(a) {
      var h = '';
      h += '<div class="asm-col">';
      h += '<div class="asm-col-head"><div class="asm-col-title">Editorial</div><div class="asm-col-count">3 of 3</div></div>';
      h += '<div class="asm-col-body">';

      // Body preview + launcher
      h += '<div class="asm-sc">';
      h += '<div class="asm-sc-label">Article Body';
      if (a.bodyStatus) h += ' <span style="color:var(--ix-text-tiny)">(status: ' + esc(a.bodyStatus) + ')</span>';
      h += '</div>';
      var plainBody = stripTagsAndTruncate(a.bodyHtml, 600);
      if (plainBody) {
        h += '<div class="asm-body-preview">' + esc(plainBody) + (plainBody.length >= 600 ? '\u2026' : '') + '</div>';
      } else {
        h += '<div class="asm-body-preview empty">No body content</div>';
      }
      // Always render button enabled; click handler checks for InbxRTE
      // availability at click time (it may load after Studio mounts).
      h += '<button class="asm-body-launch" data-asm-body-launch>\u270E Open body editor</button>';
      h += '</div>';

      // Customer / Product / MNLS pickers
      h += editSelect('customerId', 'Customer', [
        { v: '', l: '\u2014 None / Unsponsored \u2014' }
      ].concat(readCustomers().map(function (c) { return { v: c.id, l: c.name }; })));

      h += editSelect('productId', 'Product Library', [
        { v: '', l: '\u2014 None \u2014' }
      ].concat(readProducts().map(function (p) { return { v: p.id, l: p.name }; })));

      h += editSelect('mnlsId', 'Major NL Section', [
        { v: '', l: '\u2014 None \u2014' }
      ].concat(readMnls().map(function (m) { return { v: m.id, l: m.name }; })));

      // Publish Status — option select. Values are labels; translated
      // to publishStatus hash on save via translateDirtyForPayload().
      // v1.1.6: field id renamed articleStatus → publishStatus. Label
      // kept as "Article Status" for UX continuity.
      h += editSelect('publishStatus', 'Article Status', [
        { v: 'Draft', l: 'Draft' },
        { v: 'Live',  l: 'Live' }
      ]);

      // CTA — three editable fields
      h += '<div class="asm-sc asm-sc-group">';
      h += '<div class="asm-sc-label">Call-to-Action</div>';
      h += editInlineText('ctaButtonText', 'Button Label');
      h += editInlineText('ctaText',       'Supporting Text');
      h += editInlineText('ctaUrl',        'Redirect URL', { type: 'url', placeholder: 'https://\u2026' });
      h += '</div>';

      // Readonly identifiers block
      h += '<div class="asm-sc asm-sc-readonly" style="opacity:0.7">';
      h += '<div class="asm-sc-label">Identifiers</div>';
      h += '<div class="asm-sc-value" style="font-family:var(--ix-font-mono);font-size:10px;line-height:1.6">';
      h += 'Article: <span style="color:var(--ix-blue-deep)">' + esc(a.id) + '</span>';
      if (a.printIssueSource) h += '<br>Print Issue: <span style="color:var(--ix-text-mid)">' + esc(a.printIssueSource) + '</span>';
      h += '</div></div>';

      h += '</div></div>';
      return h;
    }

    // ── Edit field builders ──
    // All fields wrap in a `.asm-sc` with `data-asm-field-wrap="<key>"`.
    // The input/select/textarea inside carries `data-asm-field="<key>"`
    // so the delegated handler in bindOpenAssemblerEvents picks it up.
    // The `.dirty` class is toggled on the wrap when current !== loaded.

    function editText(key, label, opts) {
      opts = opts || {};
      var val = S.edit.current[key] || '';
      var dirty = isDirty(key);
      var type = opts.type || 'text';
      var placeholder = opts.placeholder || '';
      var h = '';
      h += '<div class="asm-sc' + (dirty ? ' dirty' : '') + '" data-asm-field-wrap="' + esc(key) + '">';
      h += '<div class="asm-sc-label">' + esc(label) + (opts.required ? ' <span class="req">*</span>' : '') + '</div>';
      h += '<input class="asm-input" type="' + esc(type) + '"';
      h += ' data-asm-field="' + esc(key) + '"';
      h += ' value="' + esc(val) + '"';
      if (placeholder) h += ' placeholder="' + esc(placeholder) + '"';
      h += '>';
      h += '</div>';
      return h;
    }

    function editTextarea(key, label, opts) {
      opts = opts || {};
      var val = S.edit.current[key] || '';
      var dirty = isDirty(key);
      var limit = opts.limit || CHAR_LIMITS[key] || 0;
      var rows = opts.rows || 3;
      var len = String(val).length;
      var over = limit && len > limit;
      var h = '';
      h += '<div class="asm-sc' + (dirty ? ' dirty' : '') + '" data-asm-field-wrap="' + esc(key) + '">';
      h += '<div class="asm-sc-label">' + esc(label);
      if (limit) {
        h += ' <span class="asm-sc-counter' + (over ? ' over' : '') + '" data-asm-counter="' + esc(key) + '">' + len + ' / ' + limit + '</span>';
      }
      h += '</div>';
      h += '<textarea class="asm-textarea" rows="' + rows + '"';
      h += ' data-asm-field="' + esc(key) + '">';
      h += esc(val);
      h += '</textarea>';
      h += '</div>';
      return h;
    }

    function editSelect(key, label, options) {
      var val = S.edit.current[key] || '';
      var dirty = isDirty(key);
      // A select "has selection" = value is truthy. Use that for the
      // distinctive-border visual (per product UX rule). `.has-value`
      // class is independent of `.dirty` so users can see what's
      // selected at a glance even before editing.
      var hasVal = !!val;
      var h = '';
      h += '<div class="asm-sc' + (dirty ? ' dirty' : '') + (hasVal ? ' has-value' : '') + '" data-asm-field-wrap="' + esc(key) + '">';
      h += '<div class="asm-sc-label">' + esc(label) + '</div>';
      h += '<select class="asm-select" data-asm-field="' + esc(key) + '">';
      options.forEach(function (o) {
        h += '<option value="' + esc(o.v) + '"' + (String(o.v) === String(val) ? ' selected' : '') + '>' + esc(o.l) + '</option>';
      });
      h += '</select>';
      h += '</div>';
      return h;
    }

    function editSwitch(key, label) {
      var val = !!S.edit.current[key];
      var dirty = isDirty(key);
      var h = '';
      h += '<div class="asm-switch-row' + (dirty ? ' dirty' : '') + (val ? ' on' : '') + '" data-asm-field-wrap="' + esc(key) + '">';
      h += '<label class="asm-switch-label-group">';
      h += '<input type="checkbox" class="asm-switch-input" data-asm-field="' + esc(key) + '"' + (val ? ' checked' : '') + '>';
      h += '<span class="asm-switch-label">' + esc(label) + '</span>';
      h += '</label>';
      h += '<span class="asm-switch-state ' + (val ? 'on' : 'off') + '">' + (val ? 'on' : 'off') + '</span>';
      h += '</div>';
      return h;
    }

    // Inline field: two-per-row compact version of editText (for Writer blocks, CTA group)
    function editInlineText(key, label, opts) {
      opts = opts || {};
      var val = S.edit.current[key] || '';
      var dirty = isDirty(key);
      var type = opts.type || 'text';
      var placeholder = opts.placeholder || '';
      var h = '';
      h += '<div class="asm-inline-ff' + (dirty ? ' dirty' : '') + '" data-asm-field-wrap="' + esc(key) + '">';
      h += '<label class="asm-inline-label">' + esc(label) + '</label>';
      h += '<input class="asm-input asm-input-inline" type="' + esc(type) + '"';
      h += ' data-asm-field="' + esc(key) + '"';
      h += ' value="' + esc(val) + '"';
      if (placeholder) h += ' placeholder="' + esc(placeholder) + '"';
      h += '>';
      h += '</div>';
      return h;
    }

    // ── Legacy read-only scRow (kept for picker/fallback use, not open-asm) ──
    function scRow(label, value, opts) {
      opts = opts || {};
      var h = '<div class="asm-sc">';
      h += '<div class="asm-sc-label">' + esc(label) + '</div>';
      if (value) {
        h += '<div class="asm-sc-value' + (opts.multiline ? ' multiline' : '') + '">' + esc(value) + '</div>';
        if (opts.badge) h += '<div class="asm-sc-badge">' + opts.badge + '</div>';
      } else {
        h += '<div class="asm-sc-value empty">Not set</div>';
      }
      h += '</div>';
      return h;
    }

    function charCount(s, max) {
      var len = (s || '').length;
      var status = len > max ? ' (over)' : (len === 0 ? '' : '');
      return len + ' / ' + max + status;
    }

    function joinBits() {
      return Array.prototype.slice.call(arguments).filter(Boolean).join(', ');
    }

    function stripTagsAndTruncate(html, maxLen) {
      if (!html) return '';
      // Quick server-Webflow-safe tag strip
      var tmp = document.createElement('div');
      tmp.innerHTML = html;
      var txt = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
      if (txt.length > maxLen) txt = txt.substring(0, maxLen);
      return txt;
    }

    function esc(s) {
      if (s === null || s === undefined) return '';
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function buildMainImageUrl(a) {
      // v1.2.0: transient post-attach override. After a successful
      // Main Image attach, the .articles-wrapper data-attribute won't
      // reflect the new URL until Webflow republishes. The override
      // keyed by articleId provides immediate visual feedback. Cleared
      // when the user closes the article or the page reloads.
      var override = (S.asm && S.asm.mainImageOverride && a && a.id)
        ? S.asm.mainImageOverride[a.id]
        : '';
      if (override) return override;

      // Phase 1: use the URL as-is with no transformation.
      // The bound field 🟡 Main Image GET Link provides the bare URL.
      // Transformations (if ever needed) should be added via
      // TA_CONFIG.uploadcareTransforms and a named-transform argument.
      return a.mainImageSrc || '';
    }

    // ═══════════════════════════════════════════
    // COMPONENTS TAB (v1.1.7 — Session 6A)
    // ═══════════════════════════════════════════
    //
    // Read surface over the MEDIA collection, sourced from the hidden
    // Webflow Collection List at .media-wrapper[data-item]. Webflow
    // filters that list to the current TITLES-ADMIN at render time,
    // so JS does no T-A scope check of its own.
    //
    // This block is self-contained: all state lives under S.cmp, all
    // functions are prefixed cmp*, all DOM classes are prefixed cmp-.
    // No Assembler function is touched.
    //
    // 6A scope: reader + filter bar + card grid + drawer + archive +
    // hard-delete. The Attach button is stubbed — 6B wires it to
    // Scenario G Route 4.

    var CMP_THUMB_TRANSFORM  = '-/resize/560x/-/format/auto/';
    var CMP_DETAIL_TRANSFORM = '-/resize/1400x/-/format/auto/-/quality/smart/';
    var CMP_PREVIEW_CHARS    = 280;

    // Entry point wired from setPanel('components')
    function renderComponents() {
      var root = document.getElementById('cmp-root');
      if (!root) return;
      cmpReadItems();
      cmpRender(root);
    }

    // ─── Reader ───
    // Parse every .media-wrapper[data-item] into a plain object and
    // cache on S.cmp.items. Called on every tab activation — cheap
    // because it's a single querySelectorAll + per-item dataset read.
    function cmpReadItems() {
      var wraps = document.querySelectorAll('.media-wrapper[data-item]');
      var items = [];
      Array.prototype.forEach.call(wraps, function (el) {
        var d = el.dataset || {};
        var htmlEl = el.querySelector('.cm-media-html');
        var htmlInner = htmlEl ? htmlEl.innerHTML : '';
        var htmlText  = htmlEl ? (htmlEl.innerText || htmlEl.textContent || '') : '';
        var createdStr = (d.htmlCreated || '').trim();
        var createdMs = createdStr ? (new Date(createdStr).getTime() || 0) : 0;
        items.push({
          mediaId:       (d.mediaId || '').trim(),
          name:          (d.mediaName || '').trim(),
          mediaType:     (d.mediaType || '').trim(),       // label: Text | Image | Video | Audio
          role:          (d.componentRole || '').trim(),   // label — hash is resolved via TA_CONFIG.optionIds.componentRole (v1.2.0)
          status:        (d.status || '').trim(),          // label: Available | Attached | Archived
          articleId:     (d.articleId || '').trim(),
          customerId:    (d.customerId || '').trim(),
          productId:     (d.productId || '').trim(),
          imageUrl:      (d.imageUrl || '').trim(),
          createdStr:    createdStr,
          createdMs:     createdMs,
          slug:          (d.slug || '').trim(),
          htmlContent:   htmlInner,
          htmlPreview:   cmpTruncate(htmlText, CMP_PREVIEW_CHARS)
        });
      });
      // Sort: newest first by parsed Created On timestamp
      items.sort(function (a, b) { return b.createdMs - a.createdMs; });
      S.cmp.items = items;
    }

    function cmpTruncate(s, n) {
      if (!s) return '';
      s = String(s).replace(/\s+/g, ' ').trim();
      if (s.length <= n) return s;
      return s.slice(0, n).replace(/\s+\S*$/, '') + '\u2026';
    }

    // ─── Top-level render ───
    function cmpRender(root) {
      root.innerHTML =
        '<div class="cmp-header">' +
          '<div class="cmp-header-left">' +
            '<h3 class="cmp-title">Components</h3>' +
            '<div class="cmp-subtitle">MEDIA records available to attach to Articles, Ads, Events, and RE Listings.</div>' +
          '</div>' +
          '<div class="cmp-header-right">' +
            '<span class="cmp-count" id="cmp-count"></span>' +
          '</div>' +
        '</div>' +
        '<div class="cmp-searchrow" id="cmp-searchrow"></div>' +
        '<div class="cmp-filterbar" id="cmp-filterbar"></div>' +
        '<div class="cmp-grid-wrap">' +
          '<div class="cmp-grid" id="cmp-grid"></div>' +
          '<div class="cmp-empty" id="cmp-empty" style="display:none"></div>' +
        '</div>';
      // v1.1.7.1: drawer + backdrop are NOT rendered here.
      // They are appended to document.body on open (see cmpOpenDrawer).

      cmpRenderSearchRow();
      cmpRenderFilterBar();
      cmpBindEvents(root);
      cmpRenderGrid();
    }

    function cmpRenderSearchRow() {
      var row = document.getElementById('cmp-searchrow');
      if (!row) return;
      var v = S.cmp.filters.searchName || '';
      var hasValue = v.length > 0;
      row.innerHTML =
        '<div class="cmp-search' + (hasValue ? ' cmp-search--active' : '') + '">' +
          '<svg class="cmp-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<circle cx="11" cy="11" r="7"></circle>' +
            '<line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
          '</svg>' +
          '<input type="text" class="cmp-search-input" id="cmp-search-input" placeholder="Search components by name\u2026" value="' + esc(v) + '">' +
          (hasValue ? '<button type="button" class="cmp-search-clear" data-cmp-search-clear aria-label="Clear search">\u2715</button>' : '') +
        '</div>';
    }

    // ─── Filter bar ───
    function cmpRenderFilterBar() {
      var bar = document.getElementById('cmp-filterbar');
      if (!bar) return;

      var f = S.cmp.filters;

      // Build option lists from current dataset for Role (dynamic)
      var roleSet = {};
      S.cmp.items.forEach(function (it) { if (it.role) roleSet[it.role] = true; });
      var roles = Object.keys(roleSet).sort();

      // Customer / Product option lists come from the sibling wrappers
      // we already use in the Assembler.
      var customers = readCustomers();
      var products  = readProducts();

      // Append "(No customer)" / "(No product)" if any MEDIA row has
      // an empty customerId/productId — so the publisher can filter to
      // orphans explicitly.
      var anyNoCustomer = S.cmp.items.some(function (it) { return !it.customerId; });
      var anyNoProduct  = S.cmp.items.some(function (it) { return !it.productId; });

      // Status filter — always shows all 4 options; default is 'Available'
      // (per spec: all statuses must be filterable-to).
      var statusOpts = ['Available', 'Attached', 'Archived', 'All'];

      var mediaTypeOpts = ['All', 'Text', 'Image', 'Video', 'Audio'];

      function goldIf(active) {
        return active ? ' cmp-fc--active' : '';
      }

      var html = '';
      // Status
      html += '<div class="cmp-fc' + goldIf(true /* Status is always an active filter */) + '">';
      html +=   '<label class="cmp-fc-label">Status</label>';
      html +=   '<select class="cmp-fc-select" data-cmp-filter="status">';
      statusOpts.forEach(function (s) {
        html += '<option value="' + esc(s) + '"' + (s === f.status ? ' selected' : '') + '>' + esc(s) + '</option>';
      });
      html +=   '</select>';
      html += '</div>';

      // Role
      html += '<div class="cmp-fc' + goldIf(f.role !== 'All') + '">';
      html +=   '<label class="cmp-fc-label">Role</label>';
      html +=   '<select class="cmp-fc-select" data-cmp-filter="role">';
      html +=     '<option value="All"' + (f.role === 'All' ? ' selected' : '') + '>All</option>';
      roles.forEach(function (r) {
        html += '<option value="' + esc(r) + '"' + (r === f.role ? ' selected' : '') + '>' + esc(r) + '</option>';
      });
      html +=   '</select>';
      html += '</div>';

      // Media Type
      html += '<div class="cmp-fc' + goldIf(f.mediaType !== 'All') + '">';
      html +=   '<label class="cmp-fc-label">Type</label>';
      html +=   '<select class="cmp-fc-select" data-cmp-filter="mediaType">';
      mediaTypeOpts.forEach(function (t) {
        html += '<option value="' + esc(t) + '"' + (t === f.mediaType ? ' selected' : '') + '>' + esc(t) + '</option>';
      });
      html +=   '</select>';
      html += '</div>';

      // Customer
      html += '<div class="cmp-fc' + goldIf(f.customerId !== 'All') + '">';
      html +=   '<label class="cmp-fc-label">Customer</label>';
      html +=   '<select class="cmp-fc-select" data-cmp-filter="customerId">';
      html +=     '<option value="All"' + (f.customerId === 'All' ? ' selected' : '') + '>All</option>';
      if (anyNoCustomer) {
        html += '<option value="__none__"' + (f.customerId === '__none__' ? ' selected' : '') + '>(No customer)</option>';
      }
      customers.forEach(function (c) {
        html += '<option value="' + esc(c.id) + '"' + (c.id === f.customerId ? ' selected' : '') + '>' + esc(c.name || c.id) + '</option>';
      });
      html +=   '</select>';
      html += '</div>';

      // Product
      html += '<div class="cmp-fc' + goldIf(f.productId !== 'All') + '">';
      html +=   '<label class="cmp-fc-label">Product</label>';
      html +=   '<select class="cmp-fc-select" data-cmp-filter="productId">';
      html +=     '<option value="All"' + (f.productId === 'All' ? ' selected' : '') + '>All</option>';
      if (anyNoProduct) {
        html += '<option value="__none__"' + (f.productId === '__none__' ? ' selected' : '') + '>(No product)</option>';
      }
      products.forEach(function (p) {
        html += '<option value="' + esc(p.id) + '"' + (p.id === f.productId ? ' selected' : '') + '>' + esc(p.name || p.id) + '</option>';
      });
      html +=   '</select>';
      html += '</div>';

      // Clear all — gold text link on the right
      html += '<button type="button" class="cmp-clear-all" data-cmp-clear-all>Clear all</button>';

      bar.innerHTML = html;
    }

    // ─── Event binding ───
    function cmpBindEvents(root) {
      // Filter changes — delegated
      root.addEventListener('change', function (e) {
        var t = e.target;
        if (t && t.matches && t.matches('[data-cmp-filter]')) {
          var key = t.getAttribute('data-cmp-filter');
          var val = t.value;
          S.cmp.filters[key] = val;
          cmpRenderFilterBar();
          cmpRenderGrid();
          return;
        }
        // v1.1.8: Attach editing-state — Status filter change
        if (t && t.matches && t.matches('[data-cmp-attach-status]')) {
          S.cmp.attachEdit.publishStatus = t.value;
          S.cmp.attachEdit.articleId = null; // clear picker — articles repopulate
          cmpRenderGrid();
          return;
        }
        // v1.1.8: Attach editing-state — Article picker change
        if (t && t.matches && t.matches('[data-cmp-attach-picker]')) {
          S.cmp.attachEdit.articleId = t.value || null;
          cmpRenderGrid();
          return;
        }
      });

      // Search input — debounced keystroke handler (v1.1.7.3)
      var searchDebounce = null;
      root.addEventListener('input', function (e) {
        var t = e.target;
        if (t && t.id === 'cmp-search-input') {
          var newVal = t.value;
          if (searchDebounce) clearTimeout(searchDebounce);
          searchDebounce = setTimeout(function () {
            // Only re-render search row if active-state changed, to keep
            // the input focus intact during normal typing.
            var wasActive = (S.cmp.filters.searchName || '').length > 0;
            var nowActive = newVal.length > 0;
            S.cmp.filters.searchName = newVal;
            if (wasActive !== nowActive) cmpRenderSearchRow();
            cmpRenderGrid();
          }, 150);
        }
      });

      // Clicks — delegated for all the card buttons, clear-all, etc.
      root.addEventListener('click', function (e) {
        var t = e.target;

        if (t.closest('[data-cmp-clear-all]')) {
          S.cmp.filters = {
            searchName: '', status: 'Available', role: 'All', mediaType: 'All',
            customerId: 'All', productId: 'All'
          };
          cmpRenderSearchRow();
          cmpRenderFilterBar();
          cmpRenderGrid();
          return;
        }

        if (t.closest('[data-cmp-search-clear]')) {
          S.cmp.filters.searchName = '';
          cmpRenderSearchRow();
          cmpRenderGrid();
          // Return focus to input after clear
          var inp = document.getElementById('cmp-search-input');
          if (inp) inp.focus();
          return;
        }

        var card = t.closest('[data-cmp-card]');
        if (!card) return;
        var mediaId = card.getAttribute('data-cmp-card');

        if (t.closest('[data-cmp-attach]')) {
          cmpHandleAttach(mediaId);
          e.stopPropagation();
          return;
        }
        // v1.1.8: Attach editing-state confirm + cancel
        if (t.closest('[data-cmp-attach-confirm]')) {
          cmpHandleAttachConfirm(mediaId);
          e.stopPropagation();
          return;
        }
        if (t.closest('[data-cmp-attach-cancel]')) {
          cmpHandleAttachCancel();
          e.stopPropagation();
          return;
        }
        if (t.closest('[data-cmp-archive]')) {
          cmpHandleArchive(mediaId);
          e.stopPropagation();
          return;
        }
        if (t.closest('[data-cmp-more]')) {
          cmpToggleOverflow(card, mediaId);
          e.stopPropagation();
          return;
        }
        if (t.closest('[data-cmp-delete]')) {
          cmpHandleDelete(mediaId);
          e.stopPropagation();
          return;
        }

        // Click on card body (not a button) → open drawer.
        // v1.1.8: Don't open drawer if card is in State B — clicks inside
        // the editing panel should land on the form controls, not the card.
        if (S.cmp.attachEdit.mediaId === mediaId) return;
        cmpOpenDrawer(mediaId);
      });

      // Drawer backdrop binding is done on-demand in cmpRenderDrawer
      // since the backdrop is created at document.body on open.
      // v1.1.8: ESC also cancels State B attach-edit (mirrors Cancel link).
      // v1.2.0: ESC also cancels Assembler field-level Attach picker.
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (S.asm && S.asm.picker && S.asm.picker.slot) {
          asmHandlePickerCancel();
          return;
        }
        if (S.cmp.attachEdit.mediaId) {
          cmpHandleAttachCancel();
          return;
        }
        if (S.cmp.drawerOpenId) cmpCloseDrawer();
      });
    }

    // ─── Filter application ───
    function cmpFilterItems() {
      var f = S.cmp.filters;
      var q = (f.searchName || '').trim().toLowerCase();
      return S.cmp.items.filter(function (it) {
        if (q && (it.name || '').toLowerCase().indexOf(q) === -1) return false;
        if (f.status !== 'All' && it.status !== f.status) return false;
        if (f.role !== 'All' && it.role !== f.role) return false;
        if (f.mediaType !== 'All' && it.mediaType !== f.mediaType) return false;
        if (f.customerId !== 'All') {
          if (f.customerId === '__none__') { if (it.customerId) return false; }
          else if (it.customerId !== f.customerId) return false;
        }
        if (f.productId !== 'All') {
          if (f.productId === '__none__') { if (it.productId) return false; }
          else if (it.productId !== f.productId) return false;
        }
        return true;
      });
    }

    // ─── Grid render ───
    function cmpRenderGrid() {
      var grid = document.getElementById('cmp-grid');
      var empty = document.getElementById('cmp-empty');
      var countEl = document.getElementById('cmp-count');
      if (!grid) return;

      var filtered = cmpFilterItems();

      if (countEl) {
        countEl.textContent = filtered.length + ' of ' + S.cmp.items.length;
      }

      if (S.cmp.items.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        if (empty) {
          empty.style.display = '';
          empty.innerHTML =
            '<div class="cmp-empty-inner">' +
              '<div class="cmp-empty-title">No components yet.</div>' +
              '<div class="cmp-empty-sub">Components appear here as content flows in from intake channels.</div>' +
            '</div>';
        }
        return;
      }

      if (filtered.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        if (empty) {
          empty.style.display = '';
          empty.innerHTML =
            '<div class="cmp-empty-inner">' +
              '<div class="cmp-empty-title">No components match these filters.</div>' +
              '<button type="button" class="cmp-empty-clear" data-cmp-clear-all>Clear all filters</button>' +
            '</div>';
        }
        return;
      }

      if (empty) empty.style.display = 'none';
      grid.style.display = '';
      grid.innerHTML = filtered.map(cmpRenderCard).join('');
    }

    // v1.1.8: Three-state render dispatcher. Cards can be in:
    //   State A (Available) — default, not attached
    //   State B (Editing)   — user clicked Attach; inline picker UI
    //   State C (Attached)  — locked, shows attached-Article metadata
    // States A and C share cmpRenderCardDefault; B has its own renderer.
    function cmpRenderCard(it) {
      if (S.cmp.attachEdit.mediaId === it.mediaId) {
        return cmpRenderCardEditing(it);
      }
      return cmpRenderCardDefault(it);
    }

    // State A (Available) and State C (Attached) share the same skeleton.
    // The difference: C shows "→ Article Title" line + disabled "Attached"
    // button. Both surface Media ID (and Article ID on C) via IDs row.
    function cmpRenderCardDefault(it) {
      var isImage = it.mediaType === 'Image' || it.mediaType === 'Video';
      var isAttached = it.status === 'Attached';
      var isArchived = it.status === 'Archived';

      var thumb;
      if (isImage && it.imageUrl) {
        thumb = '<div class="cmp-thumb">' +
                  '<img class="cmp-thumb-img" src="' + esc(cmpBuildThumbUrl(it.imageUrl)) + '" alt="' + esc(it.name) + '" loading="lazy">' +
                '</div>';
      } else if (it.mediaType === 'Text' || it.htmlPreview) {
        thumb = '<div class="cmp-text-preview">' + esc(it.htmlPreview || '\u2014') + '</div>';
      } else {
        thumb = '<div class="cmp-thumb cmp-thumb-empty"><span>' + esc(it.mediaType || 'Media') + '</span></div>';
      }

      var statusDotCls = 'cmp-dot cmp-dot--' + cmpStatusSlug(it.status);
      var customerProduct = cmpResolveCustomerProduct(it);

      var attachBtnLabel = isAttached ? 'Attached' : 'Attach';
      var attachBtnDisabled = isAttached ? ' disabled' : '';
      var attachBtnCls = isAttached ? 'cmp-btn cmp-btn--disabled' : 'cmp-btn cmp-btn--primary';

      // v1.1.8: State C "Attached to" line + IDs row (TD-124)
      var attachedLine = '';
      if (isAttached && it.articleId) {
        var articleTitle = cmpLookupArticleTitle(it.articleId) || '(unknown Article)';
        attachedLine = '<div class="cmp-card-attached">\u2192 ' + esc(articleTitle) + '</div>';
      }
      var idsLine = '<div class="cmp-card-ids">' +
                      'Media: <span class="cmp-card-id-mono">' + esc(cmpShortId(it.mediaId)) + '</span>' +
                      (isAttached && it.articleId
                        ? ' \u00B7 Article: <span class="cmp-card-id-mono">' + esc(cmpShortId(it.articleId)) + '</span>'
                        : '') +
                    '</div>';

      return '' +
        '<div class="cmp-card' + (isArchived ? ' cmp-card--archived' : '') + '" data-cmp-card="' + esc(it.mediaId) + '">' +
          thumb +
          '<div class="cmp-card-body">' +
            '<div class="cmp-card-name">' + esc(it.name || '(Untitled)') + '</div>' +
            '<div class="cmp-card-meta">' +
              '<span class="' + statusDotCls + '"></span>' +
              esc(it.role || '\u2014') + ' \u00B7 ' + esc(it.status || '\u2014') +
            '</div>' +
            attachedLine +
            '<div class="cmp-card-sub">' + esc(customerProduct) + '</div>' +
            idsLine +
          '</div>' +
          '<div class="cmp-card-actions">' +
            '<button type="button" class="' + attachBtnCls + '" data-cmp-attach' + attachBtnDisabled + '>' + esc(attachBtnLabel) + '</button>' +
            '<button type="button" class="cmp-btn" data-cmp-archive>Archive</button>' +
            // v1.2.6: ⋯ overflow + "Delete permanently" temporarily hidden.
            // Hard delete works at the CMS level but the post-delete site
            // republish is missing from Scenario G's hard_delete sub-route,
            // so the rendered .media-wrapper HTML still shows the deleted
            // card after reload. Restore this block when (a) Scenario G
            // adds a publishSite step, OR (b) we add a client-side
            // recently-deleted-IDs filter. See v1.2.6 header comments.
            // '<button type="button" class="cmp-btn cmp-btn--icon" data-cmp-more title="More">\u22EF</button>' +
            // '<div class="cmp-overflow" data-cmp-overflow hidden>' +
            //   '<button type="button" class="cmp-overflow-item cmp-overflow-danger" data-cmp-delete>Delete permanently</button>' +
            // '</div>' +
          '</div>' +
        '</div>';
    }

    // State B (Editing): same card chrome as A but action row replaced
    // with Status filter + Article picker + Attach/Cancel.
    function cmpRenderCardEditing(it) {
      var isImage = it.mediaType === 'Image' || it.mediaType === 'Video';
      var isArchived = it.status === 'Archived';

      var thumb;
      if (isImage && it.imageUrl) {
        thumb = '<div class="cmp-thumb">' +
                  '<img class="cmp-thumb-img" src="' + esc(cmpBuildThumbUrl(it.imageUrl)) + '" alt="' + esc(it.name) + '" loading="lazy">' +
                '</div>';
      } else if (it.mediaType === 'Text' || it.htmlPreview) {
        thumb = '<div class="cmp-text-preview">' + esc(it.htmlPreview || '\u2014') + '</div>';
      } else {
        thumb = '<div class="cmp-thumb cmp-thumb-empty"><span>' + esc(it.mediaType || 'Media') + '</span></div>';
      }

      var statusDotCls = 'cmp-dot cmp-dot--' + cmpStatusSlug(it.status);
      var customerProduct = cmpResolveCustomerProduct(it);

      var ae = S.cmp.attachEdit;
      var isFiring = S.cmp.attachInFlight === it.mediaId;
      var hasFailed = ae.failed === true;

      var statusOpts = ['Draft', 'Live', 'All'].map(function (s) {
        return '<option value="' + esc(s) + '"' + (ae.publishStatus === s ? ' selected' : '') + '>' + esc(s) + '</option>';
      }).join('');

      var articles = cmpReadArticlesForPicker(ae.publishStatus);
      var pickerOpts = '<option value="">\u2014 pick one \u2014</option>' +
        articles.map(function (a) {
          return '<option value="' + esc(a.id) + '"' +
            (ae.articleId === a.id ? ' selected' : '') +
            '>' + esc(a.title) + '</option>';
        }).join('');

      var pickerActiveCls = ae.articleId ? ' cmp-picker--active' : '';
      // v1.1.9: Attach button disabled when firing, OR when no article picked,
      // OR when a prior attempt failed (user must Cancel first to retry cleanly).
      var attachBtnDisabled = (!ae.articleId || isFiring || hasFailed) ? ' disabled' : '';
      var attachBtnLabel = isFiring ? 'ATTACHING\u2026' : 'Attach';

      // v1.1.9: inline error bar when a prior Route 4 attempt failed.
      // Stays visible until user clicks Cancel, which clears State B entirely.
      var errorBar = hasFailed
        ? '<div class="cmp-attach-error">' +
            'Attach failed \u2014 MEDIA may be in partial state. Refresh the page to see current state.' +
          '</div>'
        : '';

      return '' +
        '<div class="cmp-card cmp-card--editing' + (isArchived ? ' cmp-card--archived' : '') + (hasFailed ? ' cmp-card--attach-failed' : '') + '" data-cmp-card="' + esc(it.mediaId) + '">' +
          thumb +
          '<div class="cmp-card-body">' +
            '<div class="cmp-card-name">' + esc(it.name || '(Untitled)') + '</div>' +
            '<div class="cmp-card-meta">' +
              '<span class="' + statusDotCls + '"></span>' +
              esc(it.role || '\u2014') + ' \u00B7 ' + esc(it.status || '\u2014') +
            '</div>' +
            '<div class="cmp-card-sub">' + esc(customerProduct) + '</div>' +
            '<div class="cmp-card-ids">Media: <span class="cmp-card-id-mono">' + esc(cmpShortId(it.mediaId)) + '</span></div>' +
          '</div>' +
          '<div class="cmp-attach-edit">' +
            '<div class="cmp-attach-label">Attach to Article:</div>' +
            '<div class="cmp-attach-row">' +
              '<div class="cmp-attach-status">' +
                '<label class="cmp-fc-label">Status</label>' +
                '<select class="cmp-fc-select" data-cmp-attach-status>' + statusOpts + '</select>' +
              '</div>' +
              '<div class="cmp-attach-picker' + pickerActiveCls + '">' +
                '<label class="cmp-fc-label">Article</label>' +
                '<select class="cmp-fc-select" data-cmp-attach-picker>' + pickerOpts + '</select>' +
              '</div>' +
            '</div>' +
            errorBar +
            '<div class="cmp-attach-actions">' +
              '<button type="button" class="cmp-btn cmp-btn--primary" data-cmp-attach-confirm' + attachBtnDisabled + '>' + esc(attachBtnLabel) + '</button>' +
              '<button type="button" class="cmp-attach-cancel" data-cmp-attach-cancel>Cancel</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    // Short-form ID for card surfacing (first 8 chars + ellipsis).
    function cmpShortId(id) {
      if (!id) return '\u2014';
      return id.length > 10 ? (id.substring(0, 8) + '\u2026') : id;
    }

    // Read Articles for the picker, filtered by publish-status, sorted
    // most-recently-created first. Publish-status = 'All' returns everything.
    // Reads from .articles-wrapper which Webflow renders with tenant filter.
    function cmpReadArticlesForPicker(publishStatus) {
      var wrappers = document.querySelectorAll('.articles-wrapper[data-item]');
      var out = [];
      for (var i = 0; i < wrappers.length; i++) {
        var el = wrappers[i];
        var id = (el.dataset.articleId || el.dataset.id || '').trim();
        var title = (el.dataset.articleTitle || el.dataset.name || '').trim();
        var ps = (el.dataset.publishStatus || '').trim();
        var createdRaw = (el.dataset.htmlCreated || el.dataset.created || '').trim();
        if (!id || !title) continue;
        if (publishStatus !== 'All' && ps !== publishStatus) continue;
        out.push({
          id: id,
          title: title,
          publishStatus: ps,
          created: createdRaw ? new Date(createdRaw).getTime() : 0
        });
      }
      out.sort(function (a, b) { return b.created - a.created; }); // desc
      return out;
    }

    function cmpBuildThumbUrl(imageUrl) {
      // If URL already has a /-/ transform segment, don't stack another.
      if (!imageUrl) return '';
      if (imageUrl.indexOf('/-/') !== -1) return imageUrl;
      // Ensure trailing slash before transform
      var base = imageUrl.replace(/\/+$/, '') + '/';
      return base + CMP_THUMB_TRANSFORM;
    }

    function cmpBuildDetailUrl(imageUrl) {
      if (!imageUrl) return '';
      if (imageUrl.indexOf('/-/') !== -1) return imageUrl;
      var base = imageUrl.replace(/\/+$/, '') + '/';
      return base + CMP_DETAIL_TRANSFORM;
    }

    function cmpStatusSlug(status) {
      switch (status) {
        case 'Available': return 'available';
        case 'Attached':  return 'attached';
        case 'Archived':  return 'archived';
        default:          return 'unknown';
      }
    }

    function cmpResolveCustomerProduct(it) {
      var customerName = it.customerId ? cmpLookupCustomerName(it.customerId) : '';
      var productName  = it.productId  ? cmpLookupProductName(it.productId)   : '';
      if (!customerName && !productName) return '\u2014 \u00B7 \u2014';
      return (customerName || '\u2014') + ' \u00B7 ' + (productName || '\u2014');
    }

    function cmpLookupCustomerName(id) {
      var el = document.querySelector('.customers-wrapper[data-item][data-id="' + id.replace(/"/g, '') + '"]');
      return el ? (el.dataset.name || '') : '';
    }

    function cmpLookupProductName(id) {
      var el = document.querySelector('.products-wrapper[data-item][data-id="' + id.replace(/"/g, '') + '"]');
      return el ? (el.dataset.name || '') : '';
    }

    function cmpLookupArticleTitle(id) {
      var el = document.querySelector('.articles-wrapper[data-item][data-article-id="' + id.replace(/"/g, '') + '"]');
      if (el) return el.dataset.articleTitle || '';
      // Some bindings may use data-id instead — fall back defensively
      el = document.querySelector('.articles-wrapper[data-item][data-id="' + id.replace(/"/g, '') + '"]');
      return el ? (el.dataset.articleTitle || el.dataset.name || '') : '';
    }

    // ─── Overflow menu ───
    function cmpToggleOverflow(cardEl, mediaId) {
      // Close any other open overflow first
      Array.prototype.forEach.call(document.querySelectorAll('[data-cmp-overflow]'), function (o) {
        if (o !== cardEl.querySelector('[data-cmp-overflow]')) o.hidden = true;
      });
      var menu = cardEl.querySelector('[data-cmp-overflow]');
      if (menu) menu.hidden = !menu.hidden;

      // Click-outside closer (one-shot)
      if (menu && !menu.hidden) {
        setTimeout(function () {
          var closer = function (e) {
            if (!e.target.closest('[data-cmp-card="' + mediaId + '"]')) {
              menu.hidden = true;
              document.removeEventListener('click', closer, true);
            }
          };
          document.addEventListener('click', closer, true);
        }, 0);
      }
    }

    // ════════════════════════════════════════════════════════════
    // Assembler field-level Attach (v1.2.0) — Phase 3 / S8
    // ════════════════════════════════════════════════════════════
    //
    // The Assembler renders [Attach] affordances on the Main Image and
    // Interior Images slots in renderCol2. Click → S.asm.picker.slot
    // is set, the slot expands inline into a picker, the user picks
    // a Component, hits Confirm, Route 4 fires.
    //
    // The picker is a curated subset of the Components-tab grid:
    //   - Component Role filter is LOCKED to the slot's role
    //   - Status filter is LOCKED to Available
    //   - Customer + Product narrowing dropdowns are user-toggleable
    //     (default All — per transfer doc S8 recommendation)
    //   - Cards render with the same .cmp-card chrome but with
    //     .asm-pick-card wrapper that keys click handlers off
    //     data-asm-pick-mediaid instead of data-cmp-card
    //
    // Slot → role mapping:
    //   mainImage      → 'Main Image'    → Route 4b
    //   interiorImage  → 'Interior Image' → Route 4c
    //
    // Site-wide editing-state contract:
    //   - Selected card has gold border (.asm-pick-card--selected)
    //   - Selection persists while user navigates Customer/Product filters
    //   - Cancel text link reverts to closed state (slot returns to
    //     pre-picker state)
    //   - Confirm shows ATTACHING… disabled state
    //   - On failure, slot stays in picker state with red error bar
    //     (mirrors v1.1.9 half-committed-state pattern). User clicks
    //     Cancel to clear.

    var ASM_SLOT_TO_ROLE = {
      mainImage:     'Main Image',
      interiorImage: 'Interior Image'
    };

    // Slot → kind label sent in Route 4 payload. The Make scenario
    // routes by componentRole hash, but we also send attachKind for
    // disambiguation/logging (Components tab does not send this).
    var ASM_SLOT_TO_KIND = {
      mainImage:     'mainImage',
      interiorImage: 'interiorImage'
    };

    function asmGetAttachedInteriorImages(article) {
      // Returns Component items where status=Attached, role=Interior Image,
      // and articleId === current article's id. Used for the gallery render.
      if (!article || !article.id) return [];
      if (!S.cmp.items || !S.cmp.items.length) {
        // Lazy-init: if Components tab hasn't been visited, items[] is empty.
        // Read MEDIA wrappers now so the gallery has data on first Assembler
        // open. Cheap querySelectorAll.
        cmpReadItems();
      }
      return (S.cmp.items || []).filter(function (it) {
        return it.role === 'Interior Image'
            && it.status === 'Attached'
            && it.articleId === article.id;
      });
    }

    function asmGetPickerCandidates(slot, article) {
      // v1.2.1: filter is Status=Available + mediaType=Image + Customer
      // narrowing. Component Role is NOT filtered — role gets written
      // by Scenario G Route 4 at attach time based on slot intent.
      // This means even MEDIA rows with role already set (e.g. Interior
      // Image) appear in the Main Image picker — role overwriting is
      // allowed at attach time. Status=Attached rows are NOT shown
      // (pulling images off another article is out of scope for S8).
      if (!ASM_SLOT_TO_ROLE[slot]) return [];
      if (!S.cmp.items || !S.cmp.items.length) {
        cmpReadItems();
      }
      var p = S.asm.picker;
      return (S.cmp.items || []).filter(function (it) {
        if (it.status !== 'Available') return false;
        if (it.mediaType !== 'Image') return false;
        if (p.customerId !== 'All' && it.customerId !== p.customerId) return false;
        return true;
      });
    }

    function renderAsmPicker(article, slot) {
      var roleLabel = ASM_SLOT_TO_ROLE[slot];
      if (!roleLabel) return '';
      var candidates = asmGetPickerCandidates(slot, article);
      var p = S.asm.picker;
      var customers = readCustomers();
      // v1.2.1: products read dropped — Customer is the only narrowing filter.

      var h = '';
      h += '<div class="asm-pick" data-asm-pick="' + esc(slot) + '">';

      // Header row — Status lock only (Role is no longer a filter; v1.2.1).
      // Role gets WRITTEN at attach time by Scenario G Route 4 based on
      // which slot opened the picker. The picker title still communicates
      // intent ("Pick a Main Image") but does not constrain the data.
      h += '<div class="asm-pick-head">';
      h +=   '<div class="asm-pick-title">Pick a ' + esc(roleLabel) + '</div>';
      h +=   '<div class="asm-pick-locks">';
      h +=     '<span class="asm-pick-lock">Status: Available</span>';
      h +=     '<span class="asm-pick-lock">Type: Image</span>';
      h +=   '</div>';
      h += '</div>';

      // Narrow filter row — Customer only (v1.2.1).
      h += '<div class="asm-pick-filters">';
      h +=   '<label class="asm-pick-filter">';
      h +=     '<span class="asm-pick-filter-lbl">Customer</span>';
      h +=     '<select data-asm-pick-customer>';
      h +=       '<option value="All"' + (p.customerId === 'All' ? ' selected' : '') + '>All Customers</option>';
      customers.forEach(function (c) {
        h +=     '<option value="' + esc(c.id) + '"' + (p.customerId === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
      });
      h +=     '</select>';
      h +=   '</label>';
      h += '</div>';

      // Candidates list
      h += '<div class="asm-pick-list">';
      if (!candidates.length) {
        h +=   '<div class="asm-pick-empty">' +
                 'No Available image components match. ' +
                 'Drop a file in your Drive Upload folder, or run the Uploads Processor to condition more.' +
               '</div>';
      } else {
        candidates.forEach(function (it) {
          h += renderAsmPickCard(it);
        });
      }
      h += '</div>';

      // Footer — failed bar (when set), then Cancel + Confirm
      if (p.failed) {
        h += '<div class="asm-pick-error">' +
               'Attach failed \u2014 MEDIA may be in partial state. Refresh the page to see current state.' +
             '</div>';
      }

      var canConfirm = !!p.selectedMediaId && !p.inFlight && !p.failed;
      var confirmLbl = p.inFlight ? 'ATTACHING\u2026' : 'Attach';
      var confirmCls = 'cmp-btn cmp-btn--primary' + (canConfirm ? '' : ' cmp-btn--disabled');
      var confirmDis = canConfirm ? '' : ' disabled';

      h += '<div class="asm-pick-footer">';
      h +=   '<button type="button" class="asm-link-btn" data-asm-pick-cancel>Cancel</button>';
      h +=   '<button type="button" class="' + confirmCls + '" data-asm-pick-confirm' + confirmDis + '>' + esc(confirmLbl) + '</button>';
      h += '</div>';

      h += '</div>'; // .asm-pick
      return h;
    }

    function renderAsmPickCard(it) {
      var isImage = it.mediaType === 'Image' || it.mediaType === 'Video';
      var isSelected = S.asm.picker.selectedMediaId === it.mediaId;

      var thumb;
      if (isImage && it.imageUrl) {
        thumb = '<div class="cmp-thumb">' +
                  '<img class="cmp-thumb-img" src="' + esc(cmpBuildThumbUrl(it.imageUrl)) + '" alt="' + esc(it.name) + '" loading="lazy">' +
                '</div>';
      } else if (it.mediaType === 'Text' || it.htmlPreview) {
        thumb = '<div class="cmp-text-preview">' + esc(it.htmlPreview || '\u2014') + '</div>';
      } else {
        thumb = '<div class="cmp-thumb cmp-thumb-empty"><span>' + esc(it.mediaType || 'Media') + '</span></div>';
      }

      var customerProduct = cmpResolveCustomerProduct(it);
      var statusDotCls = 'cmp-dot cmp-dot--' + cmpStatusSlug(it.status);

      return '' +
        '<div class="asm-pick-card cmp-card' + (isSelected ? ' asm-pick-card--selected' : '') + '" data-asm-pick-mediaid="' + esc(it.mediaId) + '">' +
          thumb +
          '<div class="cmp-card-body">' +
            '<div class="cmp-card-name">' + esc(it.name || '(Untitled)') + '</div>' +
            '<div class="cmp-card-meta">' +
              '<span class="' + statusDotCls + '"></span>' +
              esc(it.role || '\u2014') + ' \u00B7 ' + esc(it.status || '\u2014') +
            '</div>' +
            '<div class="cmp-card-sub">' + esc(customerProduct) + '</div>' +
          '</div>' +
        '</div>';
    }

    // ─── Picker handlers ───
    function asmHandlePickerOpen(slot) {
      if (!ASM_SLOT_TO_ROLE[slot]) return;
      // Block if Route 4 is already firing for this picker (defensive)
      if (S.asm.picker.inFlight) return;
      // Auto-close any other open picker (only one at a time)
      S.asm.picker = {
        slot: slot,
        selectedMediaId: null,
        customerId: 'All',
        productId: 'All',
        inFlight: false,
        failed: false
      };
      // Refresh MEDIA cache so newly-conditioned components are visible
      cmpReadItems();
      renderAssembler();
    }

    function asmHandlePickerCancel() {
      if (!S.asm.picker.slot) return;
      // Don't cancel mid-flight
      if (S.asm.picker.inFlight) return;
      S.asm.picker = {
        slot: null,
        selectedMediaId: null,
        customerId: 'All',
        productId: 'All',
        inFlight: false,
        failed: false
      };
      renderAssembler();
    }

    function asmHandlePickerSelect(mediaId) {
      if (!S.asm.picker.slot) return;
      if (S.asm.picker.inFlight) return;
      if (S.asm.picker.failed) return;
      S.asm.picker.selectedMediaId = mediaId;
      renderAssembler();
    }

    function asmHandlePickerCustomer(customerId) {
      if (!S.asm.picker.slot) return;
      // Selection persists while user changes filters — do NOT clear selectedMediaId
      S.asm.picker.customerId = customerId || 'All';
      renderAssembler();
    }

    function asmHandlePickerProduct(productId) {
      if (!S.asm.picker.slot) return;
      S.asm.picker.productId = productId || 'All';
      renderAssembler();
    }

    function asmHandlePickerConfirm() {
      var p = S.asm.picker;
      if (!p.slot) return;
      if (!p.selectedMediaId) return;
      if (p.inFlight) return;
      if (p.failed) return;

      var article = currentOpenArticle();
      if (!article || !article.id) {
        showStudioToast('No article open.');
        return;
      }
      var it = cmpFindItem(p.selectedMediaId);
      if (!it) {
        showStudioToast('Component not found.');
        return;
      }
      // Defensive: re-check selected item is still Available
      if (it.status !== 'Available') {
        showStudioToast('Component is no longer Available \u2014 refresh.');
        return;
      }
      asmFireAttach(p.slot, p.selectedMediaId, article.id, it);
    }

    // ─── Scenario G Route 4 — Assembler call path ───
    // Same endpoint and payload contract as cmpFireAttach. The Make
    // scenario routes by componentRole hash, so the difference between
    // 4b (Main Image → writes Article URL fields) and 4c (Interior Image
    // → appends to Article.media-items) is determined server-side by
    // the role hash. JS just sends the right hash.
    //
    // attachKind is included for log/disambiguation; Make scenario
    // does not require it but it makes the payload self-describing.
    function asmFireAttach(slot, mediaId, articleId, it) {
      if (!CFG.makeStudio) {
        showStudioToast('No makeStudio URL configured.');
        return;
      }
      // v1.2.2: derive role hash from the SLOT (intent), not from the
      // picked item's current role. The picker now shows any Available
      // image regardless of role, so it.role may be empty for
      // S7-conditioned rows where role is unassigned. The slot already
      // encodes which role this attach should write.
      var roleHash = getRoleHashForSlot(slot);
      if (!roleHash) {
        console.error('[TA-STUDIO v1.2.6] No componentRole hash for slot:', slot);
        showStudioToast('Configuration error \u2014 unknown role.');
        return;
      }

      S.asm.picker.inFlight = true;
      renderAssembler(); // flips Confirm to ATTACHING…

      var payload = {
        action: 'attachComponent',
        attachKind: ASM_SLOT_TO_KIND[slot] || slot,  // mainImage | interiorImage
        titleSlug: CFG.titleSlug,
        taItemId: CFG.taItemId,
        mediaItemId: mediaId,
        articleItemId: articleId,
        componentRole: roleHash
      };

      fetch(CFG.makeStudio, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (body) {
        var ok = false;
        try {
          var j = JSON.parse(body);
          if (j && j.ok === true) ok = true;
        } catch (e) { /* not JSON — fall through as !ok */ }
        if (!ok) throw new Error('Scenario did not confirm success (empty or invalid response)');

        // Success — update local cache so subsequent renders reflect attach.
        // The MEDIA item flips to Attached + articleId set; the Components
        // tab will see the change next time it renders.
        it.status = 'Attached';
        it.articleId = articleId;

        // Close picker.
        S.asm.picker = {
          slot: null,
          selectedMediaId: null,
          customerId: 'All',
          productId: 'All',
          inFlight: false,
          failed: false
        };

        // Note: the slot's image preview won't actually update inline
        // until Webflow republishes (the .articles-wrapper data-attribute
        // is the source of truth for renderCol2's buildMainImageUrl).
        // For Main Image, we set a transient override on S.asm so the
        // next render shows the new image immediately. The override
        // clears when the user closes the article or the page reloads.
        if (slot === 'mainImage' && it.imageUrl) {
          S.asm.mainImageOverride = S.asm.mainImageOverride || {};
          S.asm.mainImageOverride[articleId] = it.imageUrl;
        }
        // For Interior Images, asmGetAttachedInteriorImages reads from
        // S.cmp.items which we just mutated above (it.status='Attached',
        // it.articleId=articleId), so the gallery will pick up the new
        // entry on the next render with no further work.

        var attachLabel = slot === 'mainImage' ? 'Main Image' : 'Interior Image';

        renderAssembler();
        // v1.2.4: banner replaces toast — same affordance, persistent
        // until reload, with progress indicator.
        studioReloadAfterCMSWrite({ bannerLabel: '\u2713 ' + attachLabel + ' attached \u2014 refreshing\u2026' });
      })
      .catch(function (err) {
        console.error('[TA-STUDIO v1.2.6] Asm Route 4 failed:', err);
        // v1.1.9 Option X pattern: stay in picker, flip failed flag, render
        // inline error bar. User must Cancel to clear — no blind retry.
        S.asm.picker.inFlight = false;
        S.asm.picker.failed = true;
        renderAssembler();
      });
    }

    // Helper — current open article (used by picker confirm).
    // Mirrors the pattern in renderOpenAssembler: readArticles() each call,
    // find by S.selectedAssetId. There is no S.assets cache by design —
    // the DOM is the cache, and readArticles() is cheap.
    function currentOpenArticle() {
      var id = S.selectedAssetId;
      if (!id) return null;
      var articles = readArticles();
      for (var i = 0; i < articles.length; i++) {
        if (articles[i].id === id) return articles[i];
      }
      return null;
    }


    //
    // Three-stage flow:
    //   cmpHandleAttach         — click Attach button on a State A card.
    //                             Role-gates via ROLE_HASHES key check;
    //                             roles NOT in the map get a stub toast.
    //                             Opens State B. Only one card at a time —
    //                             auto-cancels any other card in State B.
    //   cmpHandleAttachCancel   — Cancel text link OR ESC key. Clears
    //                             attachEdit (including failed flag) and
    //                             re-renders grid. Does not clear
    //                             search/filter bar state.
    //   cmpHandleAttachConfirm  — clicking Attach button inside State B
    //                             with a selected Article. Fires Route 4.
    //
    // ROLE_HASHES (v1.2.0): sourced from TA_CONFIG.optionIds.componentRole.
    // Closes TD-130 — no more static hash list in the JS file.
    //
    // Mapping from role label (as written in MEDIA Component Role field
    // and read from data-component-role on .media-wrapper) to Webflow
    // option hash (used in Scenario G Route 4 payload + asm picker
    // role-locking).
    //
    // TA_CONFIG block name → label conversion:
    //   mainImage       → 'Main Image'
    //   interiorImage   → 'Interior Image'
    //   articleBodyHtml → 'Article Body HTML'
    //   logo            → 'Logo'
    //   sidebarAd       → 'Sidebar Ad'
    //   bannerAd        → 'Banner Ad'
    //   eventFlyer      → 'Event Flyer'
    //   listingPhoto    → 'Listing Photo'
    //   headshot        → 'Headshot'
    //   videoFile       → 'Video File'
    //   audioFile       → 'Audio File'
    //
    // Roles enabled for Components-tab and Assembler attach in v1.2.0:
    // Article Body HTML (Components tab → Route 4a),
    // Main Image (Assembler + Components tab → Route 4b),
    // Interior Image (Assembler + Components tab → Route 4c).
    // Other 8 roles fall through to the stub toast.
    var ROLE_LABEL_TO_KEY = {
      'Main Image':        'mainImage',
      'Interior Image':    'interiorImage',
      'Article Body HTML': 'articleBodyHtml',
      'Logo':              'logo',
      'Sidebar Ad':        'sidebarAd',
      'Banner Ad':         'bannerAd',
      'Event Flyer':       'eventFlyer',
      'Listing Photo':     'listingPhoto',
      'Headshot':          'headshot',
      'Video File':        'videoFile',
      'Audio File':        'audioFile'
    };

    // Roles that S8 supports for attach. Other 8 roles short-circuit.
    var ATTACH_ENABLED_ROLES = {
      'Article Body HTML': true,  // Route 4a (Components tab only)
      'Main Image':        true,  // Route 4b (Assembler + Components tab)
      'Interior Image':    true   // Route 4c (Assembler + Components tab)
    };

    function getRoleHash(roleLabel) {
      if (!roleLabel) return '';
      var key = ROLE_LABEL_TO_KEY[roleLabel];
      if (!key) return '';
      var roleMap = (CFG.optionIds && CFG.optionIds.componentRole) || {};
      var hash = roleMap[key];
      if (!hash) {
        console.error('[TA-STUDIO v1.2.6] No TA_CONFIG.optionIds.componentRole.' + key + ' configured for role:', roleLabel);
        return '';
      }
      return hash;
    }

    // v1.2.2: lookup by slot key (mainImage | interiorImage | etc.) —
    // the slot key already matches the TA_CONFIG.optionIds.componentRole
    // sub-key one-to-one, so no label→key translation needed. Used by
    // asmFireAttach because the picker now shows any role's images and
    // the role intent comes from the slot, not from the picked item.
    function getRoleHashForSlot(slotKey) {
      if (!slotKey) return '';
      var roleMap = (CFG.optionIds && CFG.optionIds.componentRole) || {};
      var hash = roleMap[slotKey];
      if (!hash) {
        console.error('[TA-STUDIO v1.2.6] No TA_CONFIG.optionIds.componentRole.' + slotKey + ' configured for slot:', slotKey);
        return '';
      }
      return hash;
    }

    function isAttachEnabledRole(roleLabel) {
      return !!(roleLabel && ATTACH_ENABLED_ROLES[roleLabel]);
    }

    function cmpHandleAttach(mediaId) {
      var it = cmpFindItem(mediaId);
      if (!it) return;

      // Safety: Attached cards shouldn't reach this (button disabled), but guard.
      if (it.status === 'Attached') {
        showStudioToast('Already attached.');
        return;
      }
      if (it.status === 'Archived') {
        showStudioToast('Restore from archive before attaching.');
        return;
      }

      // Role gating — roles outside the S8 enabled set get a stub toast.
      if (!isAttachEnabledRole(it.role)) {
        showStudioToast('Field-level attach for ' + (it.role || 'this role') + ' ships in a later phase.');
        return;
      }

      // Open State B. Any prior State B on another card auto-cancels.
      S.cmp.attachEdit = {
        mediaId: mediaId,
        publishStatus: 'Draft',
        articleId: null,
        failed: false
      };
      cmpRenderGrid();
    }

    function cmpHandleAttachCancel() {
      if (!S.cmp.attachEdit.mediaId) return;
      // Do not cancel if Route 4 is firing — wait for response or failure.
      if (S.cmp.attachInFlight) return;
      S.cmp.attachEdit = { mediaId: null, publishStatus: 'Draft', articleId: null, failed: false };
      cmpRenderGrid();
    }

    function cmpHandleAttachConfirm(mediaId) {
      var it = cmpFindItem(mediaId);
      if (!it) return;
      if (S.cmp.attachEdit.mediaId !== mediaId) return;
      if (!S.cmp.attachEdit.articleId) return;
      if (S.cmp.attachEdit.failed) return;  // v1.1.9: blocked until Cancel
      if (S.cmp.attachInFlight) return;     // double-submit guard

      cmpFireAttach(mediaId, S.cmp.attachEdit.articleId, it);
    }

    // ─── Scenario G Route 4 call ───
    // Follows the v1.1.7.2 strict success pattern: ok = false by default,
    // flipped to true only on explicit {ok:true} in the response body.
    // Guards against silent pass-through when Scenario G's data store
    // returns an empty payload downstream (titleSlug mismatch, etc).
    //
    // v1.1.9 failure handling (Option X):
    //   On any fetch error or non-ok response, State B stays open and
    //   attachEdit.failed flips to true. The render shows an inline red
    //   error bar inside the editing panel and disables the Attach button.
    //   User must click Cancel to clear — no blind retry on corrupt state.
    function cmpFireAttach(mediaId, articleId, it) {
      if (!CFG.makeStudio) {
        showStudioToast('No makeStudio URL configured.');
        return;
      }

      // v1.2.0: TA_CONFIG-sourced hash lookup (closes TD-130).
      var roleHash = getRoleHash(it.role);
      if (!roleHash) {
        // Should never reach here — cmpHandleAttach already gated on this.
        console.error('[TA-STUDIO v1.2.6] No componentRole hash for role:', it.role);
        showStudioToast('Configuration error \u2014 unknown role.');
        return;
      }

      S.cmp.attachInFlight = mediaId;
      cmpRenderGrid(); // flip button to "ATTACHING…" disabled state

      var payload = {
        action: 'attachComponent',
        titleSlug: CFG.titleSlug,
        taItemId: CFG.taItemId,
        mediaItemId: mediaId,
        articleItemId: articleId,
        componentRole: roleHash
      };

      fetch(CFG.makeStudio, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (body) {
        // Strict success check (v1.1.7.2 pattern).
        var ok = false;
        var role = '';
        try {
          var j = JSON.parse(body);
          if (j && j.ok === true) ok = true;
          if (j && j.role) role = j.role;
        } catch (e) { /* not JSON — fall through as !ok */ }
        if (!ok) throw new Error('Scenario did not confirm success (empty or invalid response)');

        // Success — flip local cache so next render shows State C.
        S.cmp.attachInFlight = null;
        S.cmp.attachEdit = { mediaId: null, publishStatus: 'Draft', articleId: null, failed: false };
        it.status = 'Attached';
        it.articleId = articleId;

        var articleTitle = cmpLookupArticleTitle(articleId) || '(attached)';

        if (S.cmp.drawerOpenId === mediaId) cmpRenderDrawer();
        cmpRenderGrid();
        // v1.2.4: banner replaces toast for the reload window.
        studioReloadAfterCMSWrite({ bannerLabel: '\u2713 Attached to ' + articleTitle + ' \u2014 refreshing\u2026' });
      })
      .catch(function (err) {
        console.error('[TA-STUDIO v1.2.6] Scenario G Route 4 failed:', err);
        // v1.1.9 Option X: stay in State B, flip failed flag, render inline error.
        // Do NOT toast — the inline error bar is more visible and persistent.
        S.cmp.attachInFlight = null;
        S.cmp.attachEdit.failed = true;
        cmpRenderGrid();
      });
    }

    // ─── Archive ───
    function cmpHandleArchive(mediaId) {
      var it = cmpFindItem(mediaId);
      if (!it) return;
      if (it.status === 'Archived') {
        showStudioToast('Already archived.');
        return;
      }
      var confirmed = window.confirm(
        'Archive this component?\n\n"' + (it.name || '(Untitled)') + '"\n\n' +
        'It will be hidden from the default view. You can restore it by changing the Status filter to Archived.'
      );
      if (!confirmed) return;
      cmpFireDelete(mediaId, 'archive', it);
    }

    // ─── Hard delete (with attachment-aware confirm) ───
    function cmpHandleDelete(mediaId) {
      // v1.2.6: hard delete temporarily disabled. UI affordance is hidden
      // in cmpRenderCardDefault, but defensively short-circuit here in
      // case any other path still routes here.
      showStudioToast('Delete permanently is temporarily disabled. Use Archive instead.');
      return;

      // ---- Original logic preserved below for restoration ----
      /* eslint-disable no-unreachable */
      var it = cmpFindItem(mediaId);
      if (!it) return;

      if (it.articleId) {
        var articleTitle = cmpLookupArticleTitle(it.articleId) || '(unknown Article)';
        // Three-button dialog isn't native to window.confirm() — use a
        // two-step pattern: first prompt is "Archive instead?",
        // second is "Really delete?"
        var archiveInstead = window.confirm(
          'This component is attached to:\n\n"' + articleTitle + '"\n\n' +
          'Click OK to ARCHIVE instead (recommended — preserves audit trail).\n' +
          'Click Cancel to see a second prompt for hard-delete.'
        );
        if (archiveInstead) {
          cmpFireDelete(mediaId, 'archive', it);
          return;
        }
        var reallyDelete = window.confirm(
          'Permanently delete this component?\n\n"' + (it.name || '(Untitled)') + '"\n\n' +
          'This cannot be undone. The Article\'s reference to this component will be orphaned.'
        );
        if (reallyDelete) cmpFireDelete(mediaId, 'hard_delete', it);
        return;
      }

      var confirmed = window.confirm(
        'Permanently delete this component?\n\n"' + (it.name || '(Untitled)') + '"\n\n' +
        'This cannot be undone.'
      );
      if (confirmed) cmpFireDelete(mediaId, 'hard_delete', it);
    }

    function cmpFindItem(mediaId) {
      for (var i = 0; i < S.cmp.items.length; i++) {
        if (S.cmp.items[i].mediaId === mediaId) return S.cmp.items[i];
      }
      return null;
    }

    // ─── Scenario G Route 5 call ───
    function cmpFireDelete(mediaId, mode, it) {
      if (!CFG.makeStudio) {
        showStudioToast('No makeStudio URL configured.');
        return;
      }
      if (S.cmp.actionInFlight === mediaId) return;
      S.cmp.actionInFlight = mediaId;

      // Disable buttons on the affected card optimistically
      var cardEl = document.querySelector('[data-cmp-card="' + mediaId + '"]');
      if (cardEl) cardEl.classList.add('cmp-card--busy');

      var payload = {
        action: 'deleteComponent',
        mediaItemId: mediaId,
        mode: mode,
        taItemId: CFG.taItemId,
        titleSlug: CFG.titleSlug
      };

      fetch(CFG.makeStudio, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (body) {
        // Scenario G Route 5 returns {"ok": true, ...} on success.
        // v1.1.7.2: require explicit ok:true in the body. An empty
        // body (which happens when Scenario G's router doesn't fire
        // any branch — e.g. payload missing fields the data store
        // expects) would otherwise silently pass as success.
        var ok = false;
        try {
          var j = JSON.parse(body);
          if (j && j.ok === true) ok = true;
        } catch (e) { /* not JSON — fall through as !ok */ }

        if (!ok) throw new Error('Scenario did not confirm success (empty or invalid response)');

        S.cmp.actionInFlight = null;

        if (mode === 'archive') {
          // Flip status locally so filter / drawer reflect it without reload
          if (it) it.status = 'Archived';
          // Close drawer if it was open on this item (status changed)
          if (S.cmp.drawerOpenId === mediaId) cmpRenderDrawer();
          cmpRenderGrid();
          // v1.2.4: banner replaces toast.
          studioReloadAfterCMSWrite({ bannerLabel: 'Component archived \u2014 refreshing\u2026' });
        } else {
          // Hard delete — remove from local cache, close drawer if open
          S.cmp.items = S.cmp.items.filter(function (x) { return x.mediaId !== mediaId; });
          if (S.cmp.drawerOpenId === mediaId) cmpCloseDrawer();
          cmpRenderGrid();
          // v1.2.4: banner replaces toast.
          studioReloadAfterCMSWrite({ bannerLabel: 'Component deleted \u2014 refreshing\u2026' });
        }
      })
      .catch(function (err) {
        console.error('[TA-STUDIO v1.1.7] Scenario G Route 5 failed:', err);
        S.cmp.actionInFlight = null;
        if (cardEl) cardEl.classList.remove('cmp-card--busy');
        showStudioToast('Failed: ' + (err.message || 'unknown error'));
      });
    }

    // ─── Detail drawer (v1.1.7.1: hoisted to document.body) ───
    function cmpOpenDrawer(mediaId) {
      S.cmp.drawerOpenId = mediaId;
      cmpEnsureDrawerEls();
      cmpRenderDrawer();
    }

    function cmpCloseDrawer() {
      S.cmp.drawerOpenId = null;
      var drawer = document.getElementById('cmp-drawer');
      var backdrop = document.getElementById('cmp-drawer-backdrop');
      // Fade out, then remove from DOM
      if (drawer) drawer.classList.remove('cmp-drawer--open');
      if (backdrop) backdrop.style.display = 'none';
      // Remove from DOM after transition completes so reopening is clean
      setTimeout(function () {
        if (S.cmp.drawerOpenId) return; // opened again during transition
        var d = document.getElementById('cmp-drawer');
        var b = document.getElementById('cmp-drawer-backdrop');
        if (d && d.parentNode) d.parentNode.removeChild(d);
        if (b && b.parentNode) b.parentNode.removeChild(b);
      }, 240);
    }

    function cmpEnsureDrawerEls() {
      // Create the backdrop + drawer at document.body if not already present.
      // Body-scope hoist takes them out of the .dashboard-tabs stacking
      // context so z-index competes against document root, clearing
      // the publisher-wrapper banner (z-index 100).
      if (!document.getElementById('cmp-drawer-backdrop')) {
        var bd = document.createElement('div');
        bd.id = 'cmp-drawer-backdrop';
        bd.className = 'cmp-drawer-backdrop';
        bd.addEventListener('click', cmpCloseDrawer);
        document.body.appendChild(bd);
      }
      if (!document.getElementById('cmp-drawer')) {
        var dr = document.createElement('aside');
        dr.id = 'cmp-drawer';
        dr.className = 'cmp-drawer';
        dr.setAttribute('aria-hidden', 'true');
        document.body.appendChild(dr);
      }
    }

    function cmpRenderDrawer() {
      var drawer = document.getElementById('cmp-drawer');
      var backdrop = document.getElementById('cmp-drawer-backdrop');
      if (!drawer) return;
      if (!S.cmp.drawerOpenId) {
        cmpCloseDrawer();
        return;
      }
      var it = cmpFindItem(S.cmp.drawerOpenId);
      if (!it) {
        cmpCloseDrawer();
        return;
      }

      var isImage = it.mediaType === 'Image' || it.mediaType === 'Video';
      var preview;
      if (isImage && it.imageUrl) {
        preview = '<div class="cmp-drawer-preview">' +
                    '<img class="cmp-drawer-img" src="' + esc(cmpBuildDetailUrl(it.imageUrl)) + '" alt="' + esc(it.name) + '">' +
                  '</div>';
      } else if (it.htmlContent) {
        preview = '<div class="cmp-drawer-preview cmp-drawer-html-wrap">' +
                    '<div class="cmp-drawer-html">' + it.htmlContent + '</div>' +
                  '</div>';
      } else {
        preview = '<div class="cmp-drawer-preview cmp-drawer-preview-empty">No preview available.</div>';
      }

      var customerName = it.customerId ? (cmpLookupCustomerName(it.customerId) || '(unknown)') : '\u2014';
      var productName  = it.productId  ? (cmpLookupProductName(it.productId)   || '(unknown)') : '\u2014';
      var articleTitle = it.articleId  ? (cmpLookupArticleTitle(it.articleId)  || '(unknown Article)') : '';
      var attachedLine = it.articleId
        ? 'Attached to: <strong>' + esc(articleTitle) + '</strong>'
        : 'Not attached';

      drawer.innerHTML =
        '<div class="cmp-drawer-header">' +
          '<div class="cmp-drawer-title">' + esc(it.name || '(Untitled)') + '</div>' +
          '<button type="button" class="cmp-drawer-close" aria-label="Close">\u2715</button>' +
        '</div>' +
        preview +
        '<dl class="cmp-drawer-fields">' +
          '<dt>Status</dt><dd><span class="cmp-dot cmp-dot--' + cmpStatusSlug(it.status) + '"></span>' + esc(it.status || '\u2014') + '</dd>' +
          '<dt>Role</dt><dd>' + esc(it.role || '\u2014') + '</dd>' +
          '<dt>Type</dt><dd>' + esc(it.mediaType || '\u2014') + '</dd>' +
          '<dt>Customer</dt><dd>' + esc(customerName) + '</dd>' +
          '<dt>Product</dt><dd>' + esc(productName) + '</dd>' +
          '<dt>Created</dt><dd>' + esc(it.createdStr || '\u2014') + '</dd>' +
          '<dt>Slug</dt><dd class="cmp-drawer-mono">' + esc(it.slug || '\u2014') + '</dd>' +
          '<dt>Attachment</dt><dd>' + attachedLine + '</dd>' +
        '</dl>';

      drawer.querySelector('.cmp-drawer-close').addEventListener('click', cmpCloseDrawer);

      if (backdrop) backdrop.style.display = '';
      drawer.classList.add('cmp-drawer--open');
      drawer.setAttribute('aria-hidden', 'false');
    }

    // ═══════════════════════════════════════════
    // END COMPONENTS TAB
    // ═══════════════════════════════════════════

    // ── Init ──
    // v1.2.4: restore Studio state from sessionStorage if a CMS-write
    // reload just happened. This runs before the first render so the
    // first paint reflects the restored state directly.
    studioRestoreFromSession();
    renderAssembler();
    // v1.2.4: if restoration set a panel other than the default
    // 'assembler', switch to it now (renderAssembler() above only
    // handles the assembler panel; setPanel handles the cross-panel
    // routing including components).
    if (S.panel && S.panel !== 'assembler') {
      setPanel(S.panel);
    }
    console.log('\u29BE Studio v1.2.6 mounted \u2014 Components tab (read + attach + archive) + Assembler field-level Attach (Main Image, Interior Images) + auto-reload + state restore (hard delete temporarily disabled)');
  });

})();
