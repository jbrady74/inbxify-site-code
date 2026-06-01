/* ============================================================
   ta-asf-v1.5.0.js
   INBXIFY TA Studio — ASF (Asset Submission Form)

   ────────────────────────────────────────────────────────────
   v1.5.0 — TD-216 (article slice) · EDIT-SAVE via Scenario G updateAsset.
     The HC-15 placeholder is GONE for article edit-save. commitSaveDraft
     edit path now POSTs { action:'updateAsset', assetType, itemId, fields }
     to TA_CONFIG.makeStudio (Scenario G). fields = dirty-only (sparse),
     keyed by ASF STATE KEYS — Scenario G owns the state-key→Webflow-slug
     translation (server-side, single source of truth, mirrors 104). On
     {ok:true} ASF clears dirty + re-snapshots so Revert now reverts to the
     SAVED state (true edit-mode behavior). buildSavePayload carries
     action/assetType/itemId; legacy op/articleId kept for back-compat.
     SCOPE: ARTICLE ONLY this build — ad/event/RE save-routes wait on their
     write-slug confirmation (TD-211 hydrate smoke test) before wiring, to
     avoid writing to an unconfirmed slug (silent data loss). Until then,
     editing an ad/event/RE still hydrates (v1.4.0) but Save is gated with a
     clear toast. MEDIA-swap-on-edit (re-link old/new on image change) is
     OUT — TD-217. Bug-3 interim block (v1.4.1) RELAXED for article: with
     save working, no need to block the RTE — save field edits first via the
     normal Save, then open the body editor.
   v1.4.1 — Three live-use bug fixes (ASF-and-Bundles-10).
     BUG 1+2 (same field): the "Ad assignment" sidebar field was both
       MISLABELED and DEAD. It renders a.mnlsName (the Major NL Section,
       e.g. "Feature Article") but was labeled "Ad assignment", and was
       wired to refType 'ad' — which has no entry in CFG.refTypes, so
       pickerOpenRef bailed silently (click did nothing). FIX: relabel →
       "Newsletter Section" + rewire refType 'ad' → 'mnls' (the existing,
       fully-wired Major NL Section picker: readMnls /
       .articles-wrapper[data-mnls-id]). One render-line change fixes the
       label AND restores clickability.
     BUG 3 (INTERIM B — real fix is TD-216): editing fields OUTSIDE the
       RTE then opening the RTE in edit mode reloaded the page (RTE save →
       Scenario G → reload) and wiped the unsaved field edits. The old
       guard only offered discard-and-continue. INTERIM: launchBodyEditor
       now BLOCKS opening the RTE in edit mode while hasDirty() — a clear
       toast tells the operator to save or revert field edits first. (Save
       itself is still HC-15-blocked; the true no-loss fix — persist field
       edits without a reload — ships with TD-216's edit-save scenario.)
       Create-mode body editing is UNAFFECTED (local mode, no reload).
   v1.4.0 — TD-211 · EDIT-MODE HYDRATION for ad / event / realestate
     (Path 1 — hydrate side only; save-back is TD-216, NOT in this build).
     Previously publicOpen() force-flipped non-article edit→create, so
     Workbench Edit opened a blank form / risked a duplicate. Now:
     • The force-to-create wall for ad/event/RE in edit mode is REMOVED.
     • Article edit path UNCHANGED — still synchronous DOM hydrate via
       hydrateArticle() (.articles-wrapper[data-article-id]).
     • Ad/Event/RE edit path is ASYNC via the Workbench Read webhook
       (TA_CONFIG.makeWorkbenchRead) — same source the Asset Workbench
       uses. New hydrateAssetViaWebhook(assetType, assetId) fetches
       {asset:{fieldData}, media:[...]}, maps fieldData→ASF state keys
       per type (AD_HYDRATE_MAP / EV_HYDRATE_MAP / RE_HYDRATE_MAP),
       seeds a blank shape, then applyPrefill(mapped). Media ids land
       in S.media for the picker.
     • SLUG-CONFIDENCE: where a Webflow slug is uncertain (RE mls / dual
       property-address; event location/address/city), the map tries
       known candidate slugs in order and logs any miss — a wrong slug
       yields an EMPTY field + console warn, never silent corruption.
       Confirm-and-tighten once live fieldData is observed (see notes).
     • SAVE-BACK UNCHANGED + STILL GATED: commitSaveDraft edit path
       remains article-shaped → saveAsf (HC-15 placeholder). Ad/event/RE
       save-as-edit is explicitly OUT — TD-216. Editing + Save on a
       non-article today will hydrate + show changes but cannot persist
       as an edit yet; this is the known Path-1 boundary.
   ────────────────────────────────────────────────────────────
   Companion stylesheet: ta-asf-v1.3.17.css

   ────────────────────────────────────────────────────────────
   v1.3.17 — Post-submit redirect to Asset Workbench
     • On successful Article create (Scenario 104 confirms), ASF now
       closes and opens the Asset Workbench (window.InbxAssetWorkbench
       .open) on the new itemId + assetType from the 104 response —
       the operator lands on the asset they just made instead of an
       empty dashboard. Graceful no-op if the Workbench isn't loaded.
     • No payload/form change.

   ════════════ prior ════════════
   ta-asf-v1.3.16.js
   INBXIFY TA Studio — ASF (Asset Submission Form)
   Companion stylesheet: ta-asf-v1.3.16.css

   ────────────────────────────────────────────────────────────
   v1.3.16 — URL conditioner (normalize-on-blur)
     • Fixes the BundleValidationError "Invalid URL" crash: a bare
       domain ("yahoo.com") in any URL field rejected by Webflow's
       Link field and rolled back the Scenario 104 create.
     • On blur (focusout, which bubbles → works with delegation) any
       URL-type field is normalized:
         non-empty + no scheme  → prepend "https://"
         existing http(s)://    → left untouched (no forced upgrade)
         other protocols        → left untouched (mailto:, tel:)
         empty                  → left empty
     • Visible correction (operator sees the fixed value) per Option-1.
       ASF-side only; no Scenario 104 backstop (by decision).
     • Covers all asset types: ctaUrl, videoUrl, audioUrl, bannerAdLink,
       sidebarAdLink, splashAdLink, redirectLink, lbpPhotoLink,
       propertyLink, eventRedirectLink, website/customerWebsite, plus
       the new-customer sub-screen website field.
     • Re-runs handleFieldEdit on the corrected value so dirty-state /
       changed-border tracking stays accurate.

   ════════════ prior ════════════
   ta-asf-v1.3.15.js
   INBXIFY TA Studio — ASF (Asset Submission Form)
   Companion stylesheet: ta-asf-v1.3.15.css

   ────────────────────────────────────────────────────────────
   v1.3.15 — Inline image MEDIA-ids in create payload (Route 4 feed)
     • Adds extractInlineMediaIds(html): pulls every data-media-id
       out of the RTE body HTML (de-duped, order-preserving) and
       sends it as fields.inlineMediaIds[] in the Article create
       payload. This is the source array for Scenario 104's new
       Route 4 (inline iterator), which flips each inline MEDIA to
       In Use, stamps component-role = Interior Image, and appends
       it to article.media-items (forward link). Closes GAP B
       (104 had no route that processed body-embedded images).
     • Client-side extraction by design — ASF already holds the body
       HTML in S; reliable vs. Make regex over the HTML string.
     • Helper is module-level for reuse by Ad/RE/Event commit paths
       (inline images apply across asset types).
     • No render/UI change.

   ════════════ prior ════════════
   ta-asf-v1.3.14.js
   INBXIFY TA Studio — ASF (Asset Submission Form)
   Companion stylesheet: ta-asf-v1.3.14.css

   ────────────────────────────────────────────────────────────
   v1.3.14 — Swipe / back-navigation guard (no more lost drafts)
     • Fixes: an inadvertent horizontal trackpad swipe (or the
       browser Back gesture) while the ASF overlay is open was
       being read as history back-navigation — the overlay
       unmounted and dropped the operator to the Dashboard,
       silently discarding all in-progress form work.
     • Two-layer prevention (the work is never lost; the gesture
       simply cannot leave the form):
         1. CSS — overscroll-behavior: contain on .ta-asf so the
            swipe is contained to the overlay instead of bubbling
            to browser back-nav (handles Chrome/Edge/most).
         2. JS history guard — on open() we push a trap state; a
            popstate (Back gesture/button) while open re-pushes the
            trap instead of leaving. SILENT by design — the swipe
            was involuntary, so it is simply ignored; no confirm
            dialog. Guard removed cleanly on close() (trap state
            popped if still on top).
     • No payload, render, or form-logic changes. Pure navigation
       hardening. Addresses §10.11 "lost work on accidental input"
       failure mode.

   ════════════ prior ════════════
   ta-asf-v1.3.13.js
   INBXIFY TA Studio — ASF (Asset Submission Form)
   Companion stylesheet: ta-asf-v1.3.13.css

   ────────────────────────────────────────────────────────────
   v1.3.13 — Splash MEDIA role wired into pickerRoleMap
     • pickerRoleMap gains 'splash-image' → 'splashAd' so the
       edit-mode attachComponent / detachComponent flow resolves
       the correct componentRole hash for splash MEDIA. Create-mode
       splash (the new v1.3.12 zone) already worked without it
       because the picker writes state directly via
       setSplashImageFromMedia. This closes the future edit path.
     • TA_CONFIG dependency documented inline:
         optionIds.componentRole.splashAd = 'd0a50aedaa743405138edb9ad52dfd7d'
       (MEDIA · Component Role · Splash Ad option value)
     • No payload or render changes from v1.3.12.

   ════════════ prior ════════════
   ta-asf-v1.3.12.js
   INBXIFY TA Studio — ASF (Asset Submission Form)
   Companion stylesheet: ta-asf-v1.3.12.css

   ────────────────────────────────────────────────────────────
   v1.3.12 — Semantic payload keys + Splash Ad slot
     • Per-asset payload keys are now semantic (no more main/og
       force-fit for non-articles):
         Article  unchanged   mainImage* + ogImage*
         Event    → eventImage* (one image; ogImage* keys dropped)
         RE       → listingImage*
         Ad       → bannerImage* + sidebarImage* + splashImage*
     • Splash Ad slot added (700x700). New AD-form image zone
       below Sidebar, splashAdLink override, attach/replace/preview
       actions, picker dispatch for 'splash' mode.
     • New setter setSplashImageFromMedia mirrors setMain/OgImage
       semantics — writes S.article.splashImageSrc + .splashImageMediaId.
     • blankADS gains splashImageMediaId / Src / Alt + splashAdLink.
     • conditionEventImage: dropped setOgImageFromMedia call
       (events now carry one image only, not a dual main+og write).
     • Internal S.article keys for Event/RE/Ad-banner/Ad-sidebar
       remain on generic mainImageSrc / mainImageMediaId / ogImageSrc /
       ogImageMediaId — the rename lives in the commit-payload layer
       so the picker, setters, and dirty-tracking pipeline stay
       single-path. Splash is the only slot with a brand-new
       internal key (splashImageSrc / splashImageMediaId).

     Dependency:  TA_CONFIG.optionIds.componentRole.splashAd hash
     (Designer: MEDIA → Component Role → add 'Splash Ad' option,
      grab the new hash, wire into TA_CONFIG). Until that's added,
     picker filtering for splash MEDIA falls back to the unfiltered
     list — same behavior as banner/sidebar today.

     Make Scen 104 must be updated in parallel — Event/Ad/RE mapper
     formulas read renamed payload keys (eventImage*, bannerImage*,
     sidebarImage*, splashImage*, listingImage*). See companion
     mapping-delta doc.

   ════════════ prior ════════════
   ta-asf-v1.3.11.js
   INBXIFY TA Studio — ASF (Asset Submission Form)
   Companion stylesheet: ta-asf-v1.3.11.css

   ────────────────────────────────────────────────────────────
   v1.3.11 — Event form: venue address SPLIT (EVENTS rearch)
     • EVENTS rebuilt: Venue Name + Venue Room + Venue Street
       Address + Venue City + Venue State + Venue ZIP (replacing
       combined Venue Address). Event Start/End are now Date/Time
       fields combined in Make.
     • ASF: dropped eventVenueAddress; added eventVenueRoom,
       eventVenueStreetAddress, eventVenueCity, eventVenueState,
       eventVenueZip. eventLocation key kept stable (label still
       "Venue Name"). Worker returns the same 6 keys.
     • Venue block: [Name | Room] / [Street] / [City | State | ZIP]
       via new grid classes asf-ev-grid-2-1 and asf-ev-grid-2-1-1.

   ════════════ prior ════════════
   ta-asf-v1.3.10.js
   INBXIFY TA Studio — ASF (Asset Submission Form)
   Companion stylesheet: ta-asf-v1.3.10.css

   ────────────────────────────────────────────────────────────
   v1.3.10 — Event auto-fill: condition the picked image (live)
     • "Condition & use" is now wired (was inert). Click → POST
       { remoteImageUrl, fileName, taItemId, componentRole,
         componentRoleHash } to TA_CONFIG.makeConditioner (the new
       Scenario B remote-URL route). On { success, mediaItemId,
       uploadcareUrl } it sets the result as BOTH the Main image and
       the OG image (events reuse one image), clears the candidate
       grid, and toasts. Spinner + disable while in flight.

   ════════════ prior ════════════
   ta-asf-v1.3.9.js
   INBXIFY TA Studio — ASF (Asset Submission Form)
   Companion stylesheet: ta-asf-v1.3.9.css

   ────────────────────────────────────────────────────────────
   v1.3.9 — Event auto-fill: image PICK-LIST (was single image)
     • The extract-event worker now returns images[] (every
       candidate on the page, best-guess first) instead of one
       URL — the single-image return kept surfacing the logo and
       missing the actual event photo.
     • renderEventFoundImage now renders a thumbnail grid of all
       candidates; click to select. Selection drives S.autoFill.image
       (defaults to the first). New action: event-pick-image.

   ════════════ prior ════════════
   ta-asf-v1.3.8.js
   INBXIFY TA Studio — ASF (Asset Submission Form)
   Companion stylesheet: ta-asf-v1.3.8.css

   ────────────────────────────────────────────────────────────
   v1.3.8 — Event form: auto-fill from URL
     • New URL bar at the top of the Create Event form. Paste an
       event page URL → "Fetch & fill" POSTs { url } to
       TA_CONFIG.makeExtractEvent (the /extract-event Cloudflare
       worker), which reads the page (JSON-LD Event → OG/meta →
       text) via Claude and returns event fields.
     • Returned values are written to S.article (NOT dirtyFields,
       so no gold styling) and each is marked in S.autoFill.fields;
       renderField/renderEventDescription show a small "auto-filled"
       tag per populated field. Operator reviews/edits, then Saves —
       nothing auto-submits.
     • Any page image is rendered in a preview tile. The
       "Condition & use" button is intentionally inert until the
       Scenario B remote-URL ingest route exists.
     • Dead-air rule honored: Fetch&fill disables + shows a spinner
       + "Reading…" while in flight; success/error toast on return.

   ════════════ prior ════════════
   ta-asf-v1.3.7.js
   INBXIFY TA Studio — ASF (Asset Submission Form)
   Companion stylesheet: ta-asf-v1.3.7.css

   ────────────────────────────────────────────────────────────
   v1.3.7 — Event form: Venue Name + Venue Address
     • The Event "Location" field is relabeled "Venue Name" (key
       unchanged: eventLocation → still writes the EVENTS
       event-location field; no Make/Webflow churn).
     • New field "Venue Address (Street, City)" (key
       eventVenueAddress) added beside it; sent in the create
       payload as fields.eventVenueAddress. NOTE: persistence
       needs a matching EVENTS field + a mapping in Scenario 104
       event modules [210]/[238] — see handoff.
     • Required-field toast updated to "Venue name is required".

   ════════════ prior ════════════
   ta-asf-v1.3.6.js
   INBXIFY TA Studio — ASF (Asset Submission Form)
   Multi-asset create surface. Fullscreen overlay invoked via
   window.InbxASF.open({ mode, assetType, articleId, ... })

   Companion stylesheet: ta-asf-v1.3.6.css

   ────────────────────────────────────────────────────────────
   v1.3.6 — Non-article creates now reach Make + no Scenario G in create mode
     • BLOCKER FIX (pre-existing): curVal() was defined only inside
       commitCreateArticle. commitCreateRE / commitCreateEV /
       commitCreateADS all call curVal() — so they threw
       "ReferenceError: curVal is not defined" at their first
       validation line and never POSTed to Scenario 104. Result:
       Event / RE / Ad ASFs silently failed to trigger Make.
       Fixed by promoting curVal() to module scope (identical impl;
       sits next to curValRead). Article path unchanged (its local
       copy still shadows harmlessly).
     • 500 FIX: fireAttachMedia() posted attachComponent to Scenario G
       with articleItemId = S.article.id even in CREATE mode, where no
       article exists yet → HTTP 500 on every main/OG pick. In create
       mode it now sets local state only (setMain/setOgImageFromMedia)
       and returns; persistence is deferred to Scenario 104's MEDIA
       flip on create. Edit-mode attach via Scenario G unchanged.

   ────────────────────────────────────────────────────────────
   v1.3.5 — Character counters + raw Uploadcare URL hygiene
     • Counter UI on Sub-title (60) and Banner Statement (30):
       live count under the input, neutral until 80% of limit,
       gold "near" at 85%+, red "at" at 100% (maxlength also
       caps the input so paste can't exceed). Uses CFG.limits
       values that were already defined; no new constants.
       Helper renderCharCounter(field) emits the markup;
       onDelegatedInput updates the matching counter sibling
       after handleFieldEdit, for ANY field in CFG.limits — so
       teaser / shortSummary / title get the same treatment
       automatically as soon as they're switched on in render.
     • stripUcTransforms(url) helper applied at every entry
       point that writes a Uploadcare URL into S.article.mainImageSrc
       or .ogImageSrc — DOM hydrate, bundle prefill resolver,
       picker setMain/setOg, Uploadcare upload callback. The
       payload now carries the raw {cdn}/{uuid}/ form; Make
       SetVars 52/62/229/230 own the per-surface transform.
       Eliminates the chained-transform soft-share-card issue
       reported in the OG debug.

   ────────────────────────────────────────────────────────────
   v1.3.4 — Close ASF on save / create success
     • UX: after Save Draft (edit mode) or any create commit
       (Article / RE / Event / Ad), the ASF auto-closes once the
       green success toast fires. Error paths keep the panel open
       so the operator can correct and retry.
     • Implementation: setTimeout(publicClose, 350) added at the
       tail of each .then success branch in commitSaveDraft,
       commitCreateArticle, commitCreateRE, commitCreateEV,
       commitCreateADS. 350ms gives the toast a beat of visual
       presence before the panel unmounts; toast container is
       global so the toast itself continues to display after close.
     • .catch paths unchanged — error keeps ASF open as before.

   ────────────────────────────────────────────────────────────
   v1.2.8 — Inline image insert respects the cursor
     • Bug: inline insert honored size/align but dropped the figure at
       the TOP of the body, not at the cursor. Root cause: the picker is
       a separate sidebar, so opening it blurs Trix and its selection
       collapses; insertImageIntoBody then inserted at the collapsed
       range. (ta-rte avoids this — its insert fires from the in-editor
       toolbar, so focus never leaves.)
     • Fix: openSidebarPickerForMode captures editor.getSelectedRange()
       on inline open (S.inlinePicker.savedRange); insertImageIntoBody
       restores it via editor.setSelectedRange() before inserting.
       Purely additive — falls back to prior behavior if capture fails.
     • Companion CSS bumped to v1.2.8 (content unchanged) to satisfy the
       exact-version self-loader.

   ────────────────────────────────────────────────────────────
   v1.2.6 — Ad-create customer-first gate + Ad-name appendage
     • Create → Ad now opens a focused GATE first (renderAdGate):
       choose an existing advertiser (Continue → hydrates the form
       via prefillAdFromCustomer) or start a new customer (disabled
       until the create-customer route lands). Wired through
       S.adGateOpen (set in publicOpen for ad+create with no customer)
       + render() branch + gate-continue / gate-new-customer actions.
     • Ad name is now "<Customer Name> (Ads)" — the appendage
       distinguishes the Ad record name from the Customer name. Set
       on every customer pick (gate Continue + sidebar ref-pick).

   ────────────────────────────────────────────────────────────
   v1.2.5 — Ad ⟵ Customer full prefill + locked name + headline fix
     • Picking the advertiser now hydrates the WHOLE ad form from the
       Customer record: prefillAdFromCustomer() copies every mapped
       field off the .customers-wrapper dataset (authoritative key map
       CUSTOMER_PREFILL_MAP, confirmed from Designer bindings; hyphenated
       keys txa-1..6 / address-2 via bracket access) onto S.article.
       New read-only renderAdCustomerProfile() block shows the Local
       Business Profile (tagline, address, contact, socials, services,
       logo initials, status) in place of the old placeholder note. The
       sidebar Default Redirect URL + the Default Art Ad reference now
       show their real values. Customer fields are display-only — they
       live on the Customer record and are NOT written back by the ad.
     • Ad name is now LOCKED: rendered as a read-only headline equal to
       the picked customer (no longer an editable input). Removed the
       seed-if-empty logic; prefill always sets it.
     • RE / EV name headline: hardened the input rule specificity (CSS)
       so the header styling reliably wins over the base .asf-input.

   ────────────────────────────────────────────────────────────
   v1.2.4 — name headlines + Ad name field
     • All four variant name fields now render as headers (Fraunces,
       bold, teal, large): Article's .asf-title-headline and the
       .asf-re-headline input (RE address / EV event name / the new
       Ad name) share the look. (CSS only for the three input ones.)
     • AD variant gains an adName field (→ ad-name) as the headline
       at the top of the form, auto-filled from the customer on pick
       (convention: ad name = customer name; it can't be a dynamic
       field, so it's a seeded-but-editable typed value). Mapped in
       commitCreateADS; auto-fill wired into fireUpdateRef's create
       branch.

   ────────────────────────────────────────────────────────────
   v1.2.3 — AD variant + prefilledMediaIds body resolver
     1) AD (ADS) variant — the advertiser's standing creative
        library on one record: four optional sections (Banner,
        Sidebar, The Find Curated Text Ad, Local Business Profile),
        create-only. Banner reuses main-image keys ('main' picker),
        Sidebar reuses og-image keys ('og' picker); a lightweight
        Trix (asf-lbp-rich-*) backs LBP Rich Text. The LBP profile
        lives on the CUSTOMER record (read-only here) — the ad
        carries only lbp-photo-link / lbp-teaser-text / lbp-rich-
        text. Redirect for every section defaults to the Customer's
        Business Website (shown in the sidebar, "from Customer
        record"); each section link overrides it. Per-section product
        derived by section type (HC-AD-1). Phase-5 upsert/archive/
        status still deferred.
        New: blankADS, renderADSImageZone, renderADSMain,
        renderADSSide, renderADSStatusLine, commitCreateADS,
        renderLbpRichText / initLbpTrix / onLbpRichChange.
        Wired: context-bar label, renderMainForType / renderSide-
        ForType, action-bar label, commitSaveDraft dispatch,
        publicOpen assetType + blank select, render() init hook.
     2) prefilledMediaIds resolver (TD-196 / WLN-113) — the Bundles
        cascade opens ASF with { mode:'create', assetType,
        prefilledMediaIds }; <=1.2.2 ignored them, so a bundle's body
        never populated. Now resolved by MEDIA-TYPE (not the always-
        empty component-role): Text → bodyHtml (→ post-body +
        post-body-html via the create payload), Image → main then OG.
        Reads html-content from .cm-media-html; routes through
        applyPrefill (set + dirty). No ta-bundles change needed.
        Persistence to both body fields still depends on the
        Scenario 104 article-route fix (TD-197).

   ────────────────────────────────────────────────────────────
   v1.2.2 — EV second image promoted to a real Social / OG image
     Product decision (Jeff): events need a promotable, OG-ready
     social image. So EV's second image is no longer a "flyer aliased
     onto OG keys" — it IS the OG/social image. This makes the
     ogImage* keys semantically correct (no aliasing, no trap) and
     gives EV the exact same hero + OG image model as the Article
     variant. All three latent costs from the v1.2.1 reuse note are
     gone: the keys mean what they say, EV edit-mode hydration won't
     need an assetType branch for OG, and there's no "spent slot."

     Changes (EV only; Article + RE untouched):
       • renderEVImageZones — second zone relabeled "Social / OG
         image" (was "Event flyer"); adds a "Use event image as OG"
         convenience (set-og-from-main) when a hero exists and no OG
         is set yet, so publishers can promote with one click.
       • commitCreateEV — payload now sends ogImageMediaId/ogImageSrc
         (OG-semantic) instead of eventFlyer*. Scenario 104's event
         route maps these to the EVENTS OG field.
       • Picker header in EV 'og' mode → "Pick social / OG image".
       • blankEV — comment corrected (og keys hold the OG image).

     NOTE — end-to-end persistence still requires the Scenario 104
     EVENT route (queued Make work). The form is clean and ready;
     the image won't save until that route exists and wires the
     OG + hero fields (same blueprint pass that fixes the Article
     route's known image drop).

   ────────────────────────────────────────────────────────────
   v1.2.1 — Event (EV) variant
     Third asset variant on the v1.2.0 branching infra. open() now
     accepts assetType:'event'. Article + Real Estate paths are
     byte-for-byte unchanged. All shared infrastructure reused:
     overlay shell, fixed action bar, sidebar MEDIA picker,
     Uploadcare upload, self-loading CSS, field/dirty/commit plumbing.

     New for EV:
       • blankEV() — Event field bag (eventName, eventDescription
         [rich text], eventLocation, eventStartDate/EndDate,
         eventStartTime/EndTime, eventRedirectLink). Reuses the
         generic mainImage* keys for the Event Image (hero) and the
         ogImage* keys for the Event Flyer, so the existing 'main'
         and 'og' picker modes work with no new picker plumbing.
       • renderEVMain — event name headline + rich-text description
         + location/redirect grid + 2×2 date/time grid + two image
         zones (Event Image via 'main' mode, Event Flyer via 'og').
       • renderEVSide — Customer (sponsor, optional) ref, newsletter
         scheduling (reused), availability, identifiers, status line.
       • renderEventDescription + initEventTrix + onEventDescChange —
         a SEPARATE, lightweight Trix instance bound to
         eventDescription (id asf-ev-desc-*). NO image toolbar
         buttons (plain rich text). Reuses the shared Trix loader.
         Article body Trix (.asf-trix-editor) is untouched —
         distinct selector means initInlineTrix is a no-op in EV
         mode and initEventTrix is a no-op in Article mode.
       • renderEVImageZones — two zones (Event Image + Event Flyer),
         modeled on renderREImageZone, reusing the 'main'/'og'
         picker modes + attach actions.
       • renderDateTimeField via renderField gaining an optional
         `type` ('date' | 'time' | 'text', default 'text') — a
         backward-compatible 1-field extension.
       • Picker header label is asset-aware in EV mode ('main' →
         "Pick event image", 'og' → "Pick event flyer").
       • commitCreateEV — POSTs assetType:'event' to Scenario 104.
         commitSaveDraft dispatches to it in create mode. The
         payload maps ogImage* → eventFlyer* (semantic names) so
         Scenario 104 sees flyer fields, not OG fields.

     EV omits the Article-only machinery (RTP panel, co-writers,
     teaser/OG-social-preview, body image-insert toolbar). RE/EV/ADS
     remain create-only (no edit hydration yet).

   ────────────────────────────────────────────────────────────
   v1.2.0 — assetType branching + Real Estate (RE) variant
     The ASF is no longer Article-only. open() now accepts an
     `assetType` ('article' | 'realestate'; 'event' | 'ad' next),
     and the render tree dispatches by it. ALL shared infrastructure
     is reused untouched: the overlay shell, fixed action bar,
     sidebar MEDIA picker, Uploadcare upload, self-loading CSS,
     and the field/dirty/commit plumbing.

     New for RE:
       • S.assetType (default 'article'); set from params.assetType.
       • blankRE() — RE field bag, TA/title seeded from TA_CONFIG,
         reusing the generic S.article record + S.dirtyFields
         (field-keyed dirty tracking is asset-agnostic).
       • renderMainForType / renderSideForType — render() dispatchers.
         Article path is byte-for-byte unchanged.
       • renderREMain — property identity (address, MLS#, listing
         status, asking price, features) + Property Image (reuses
         the 'main' picker mode + mainImageSrc/Alt keys, no OG) +
         property link.
       • renderRESide — Customer (agent/broker) ref, newsletter
         scheduling (reused), availability status, identifiers.
       • renderSelect() — small option-dropdown primitive (RE
         listing status, availability), mirrors the existing
         .asf-select markup used for revenueType.
       • commitCreateRE — POSTs assetType:'realestate' to Scenario
         104 (TA_CONFIG.makeCreateAssets) with the RE field set.
         commitSaveDraft dispatches to it in create mode.

     RE intentionally omits the Article-only machinery: no RTP
     readiness tiles, no source-screenshot strip, no inline body
     RTE, no OG zone. It's a structured-data form + one image.

     NOTE: Field→Webflow-slug mapping (RE collection) is wired in
     the unified Scenario 104 blueprint, delivered after EV + ADS
     variants are built. The form just collects + POSTs the payload.

   v1.1.11 — Self-loading companion CSS (resilience fix)
     Root cause of the 2026-05-21 "Create no longer opens ASF"
     report: the overlay was mounting fine (open() returned true,
     .ta-asf in the DOM, both renders completing) but was INVISIBLE
     because the head's ta-asf CSS <link> wasn't loading — the JS
     reference had been bumped to a new version while the CSS link
     stayed stale / 404'd. With no ASF CSS, .asf-overlay loses
     position:fixed + the teal backdrop + z-index:10000, so the
     fully-mounted form renders as unstyled inline content nobody
     can see.

     Fix — the JS now guarantees its own stylesheet, the same way
     it already self-loads Trix from CDN:
       • OWN_SCRIPT_SRC: captured at load via document.currentScript
         (with a script-tag scan fallback). This is the URL the JS
         was actually loaded from.
       • CSS URL is derived by swapping `.js`→`.css` on that URL
         (query string preserved), so it always matches the JS's
         own version/host/path. ta-asf-v1.1.11.js → ta-asf-v1.1.11.css.
       • ensureStylesLoaded(): if no <link> for that exact URL is
         present AND no ASF CSS is currently applied (probe reads
         a hidden .asf-overlay's computed z-index === '10000'),
         it injects the stylesheet and re-renders on load.
       • Called at module init (preloads on page load, before the
         user clicks Create) and again in mount() as a backstop.
         Idempotent; the data-asf-autocss link + exact-href check
         prevent double-loading.

     This makes the JS/CSS pair self-healing: a stale or missing
     CSS <link> in the Webflow head can no longer leave the
     overlay invisible. (Best practice is still to ship the CSS
     link correctly; this is a safety net, not a license to skip
     it — the head link loads faster than the JS-injected one.)

     No behavioral change to the form itself. CSS file carries
     only a version/header bump so the derived URL resolves.

   v1.1.10 — Pairing bump (inline image picker fixed top-right · CSS)
     CSS-only release: the inline image picker is now fixed to the
     top-right of the viewport (ta-asf-v1.1.10.css) so it stays in
     reach when you've scrolled deep into the body. No JS behavior
     change — version bumped only to keep the JS/CSS pair aligned
     per the file-version discipline.

   v1.1.9 — Fixed action bar + growing body + toolbar image buttons
     Three fixes from Jeff's 2026-05-21 live-test feedback:

     1) Action bar fixed at bottom of viewport.
        renderActionBar() is now emitted as a sibling of
        .asf-shell (top-level), not inside renderMain(). CSS
        pins it position:fixed at the viewport bottom, centered
        to the 1480px panel width. .asf-main + .asf-side get
        bottom padding so content clears the fixed bar.

     2) Body editor grows vertically; whole overlay scrolls.
        Removed the Trix editor's max-height:60vh + overflow-y:auto
        (CSS) so the editor expands with content and the
        .asf-overlay (already overflow-y:auto) is the single
        scroll surface — top-to-bottom scrolling approximates the
        published reading experience instead of an inner
        scrollbox.

     3) Inline image + upload buttons moved INTO the Trix toolbar,
        on the same row as the bullet / number list icons —
        matching the original ASF (InbxRTE) layout that Chunk 2's
        raw-Trix switch had lost. Implementation mirrors
        ta-rte v1.1.24's toolbar customization:
          • customizeTrixToolbar() runs on trix-initialize (and a
            setTimeout backstop). Idempotent.
          • Removes Trix's file-tools group (we have our own image
            insertion).
          • Appends two buttons to the text-tools group:
              "⊕ Image"  → openSidebarPickerForMode('inline')
                           (gold-tinted, .asf-img-insert-btn)
              "⬆ Upload" → file picker → Uploadcare → inserts the
                           uploaded image into the body immediately
                           using the Uploadcare URL, then Scenario B
                           conditions it into MEDIA in the background
                           (teal, .asf-img-upload-btn)
        The separate .asf-trix-footer insert button is removed;
        the footer now shows only the character counter.

        Upload flow extension: fireUpload() + onFileInputChange()
        gained a `target` param ('inline-body'). When set, the
        uploaded image is inserted into the body via
        insertImageIntoBody() right after the Uploadcare UUID
        resolves — no wait on Scenario B, no full re-render.

   v1.1.8 — Inline image size + alignment (RTE parity)
     Restores the Left/Center/Right alignment and 33/50/75/100%
     size controls that exist in ta-rte's image insert flow.
     Chunk 3 (v1.1.3) used a plain Trix image attachment, which
     lost these — the inserted image had no size/align metadata.

     This version matches ta-rte v1.1.24's model EXACTLY so the
     two editing paths (ASF inline create-mode editor + the
     fullscreen RTE) produce identical body HTML:

       Inserted markup (Trix HTML content attachment):
         <figure class="rte-inserted-image"
                 data-img-size="small|medium|large|full"
                 data-img-align="left|center|right"
                 style="max-width:X%;margin-left:Y;margin-right:Z;">
           <img src="<bare url>" alt="…"
                data-media-id="…" data-component-role="…">
           <figcaption>…</figcaption>   (optional)
         </figure>

       Size map (IMG_SIZE_PCT, copied from RTE verbatim):
         small=33%  medium=50%  large=75%  full=100%
       Align map (IMG_ALIGN_CSS, copied from RTE verbatim):
         left   → margin-left:0;margin-right:auto;
         center → margin-left:auto;margin-right:auto;
         right  → margin-left:auto;margin-right:0;
       Full size disables alignment (100% width can't be aligned)
       — align strip greys out, matching RTE behavior.

     Key implementation change — insertImageIntoBody now uses:
         new Trix.Attachment({ content: figureHTML })
     (an HTML content attachment, preserves the figure wrapper)
     INSTEAD of v1.1.3's
         new Trix.Attachment({ url, contentType, … })
     (a plain image attachment, no wrapper / no size/align).

     Picker UI (inline mode only): a control strip below the
     tabs with Size (33/50/75/100%) + Align (◀ ■ ▶) buttons.
     Selections persist in S.inlinePicker.imgSize / .imgAlign
     (defaults large / center). Clicking a thumbnail inserts
     with the currently-selected size + align. Main and OG
     picker modes don't show this strip (size/align are only
     meaningful for in-body images).

     Image URL: inserted BARE (no JS-side transform), matching
     the RTE. Component-role-specific transforms are applied
     downstream at render / conditioning time. (The picker
     THUMBNAILS still use the v1.1.7 small preview transform —
     that's display-only, doesn't affect the inserted src.)

     CSS partner adds the figure.rte-inserted-image rendering
     rules scoped to .asf-trix-editor so the WYSIWYG matches
     production. NOTE: the article/newsletter RENDER pages also
     need the (unscoped) figure.rte-inserted-image rules — see
     ta-rte v1.1.24 header "Saved HTML CSS block" — those are
     a page-level concern, not ASF's.

   v1.1.7 — Uploadcare image transforms for main / OG / picker thumbs
     Renders accurate previews so the publisher sees what the
     image will actually look like when emailed or shared, not
     just the raw upload.

     Three new transform helpers (all idempotent on non-Uploadcare
     URLs — those pass through unchanged):

       mainImageDisplayUrl(url)
         → -/scale_crop/1200x1200/smart_faces/-/format/jpeg
           /-/quality/better/
         Per Jeff's 2026-05-21 spec: main images are SQUARE.
         smart_faces keeps faces in-frame on automatic crops.
         Applied to .asf-mainog-img (main image zone thumbnail).

       ogImageDisplayUrl(url)
         → -/scale_crop/2400x1260/smart_faces/-/format/jpeg
           /-/quality/better/
         Open Graph spec aspect (2400x1260 ≈ 1.91:1). Applied to
         .asf-mainog-og-img (social preview composition).

       pickerThumbUrl(url)
         → -/preview/240x240/-/format/auto/
         Small, fast-loading thumbnails for the sidebar picker
         grid. Without this, the picker tries to load every
         MEDIA item's full-resolution original — slow and
         bandwidth-heavy for a 50-image library.

     URL handling:
       • isUploadcareUrl(url) — host substring match against
         ucarecdn.com OR ucarecd.net (INBXIFY's CDN alias).
       • stripUploadcareTransforms(url) — splits on '/-/' so we
         never double-apply if the URL already has transforms.
       • applyUploadcareTransform(url, transform) — composer.
       • Non-Uploadcare URLs (fixtures, externals, fallbacks)
         pass through unchanged — no broken renders if the
         upstream isn't Uploadcare.

     CSS partner:
       • .asf-mainog-img aspect-ratio 16/10 → 1/1 (square per
         spec). The OG zone stays 2400/1260 ≈ 1.91/1.

     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     HARDCODING TRACKER · HC-16-A (Image transformation defaults)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     The three transform strings above are HARDCODED in this
     file (CFG.transforms.main / .og / .pickerThumb). Architecture
     question raised by Jeff 2026-05-21: where should these
     actually live?

       Options considered:
       (A) Article field — current state for OG transform.
           Per-article flexibility, but duplication across
           articles + inconsistency across a publication.
       (B) MEDIA field — tie transform to the image itself.
           Less duplication if image is reused; but same
           image used differently in different contexts can't
           have different crops.
       (C) TA-level default + Article override (RECOMMENDED).
           Set once per publication, override per article when
           needed. Single source of truth + flexibility.
       (D) Hardcode in JS (current solution in v1.1.7).
           Zero schema work; not per-publisher.

       Recommendation = (C). To resolve HC-16-A:
         1. Add fields to Titles-Admin collection:
              ta-default-og-transform   (text, optional)
              ta-default-main-transform (text, optional)
         2. ASF reads in priority order:
              article-specific field > TA default > CFG default
         3. Field-slug wire-up is a one-line per surface in
            mainImageDisplayUrl + ogImageDisplayUrl; defer
            until Jeff confirms field slugs.
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   v1.1.6 — Critical hot-fix · action.getAttribute → el.getAttribute
     Bug: every v1.1.0+ action handler that needed to read a
     companion data attribute was written as

         action.getAttribute('data-asf-…')

     But handleAction's signature is (action, el, e) where
     `action` is the STRING action name pulled from
     data-asf-action — NOT the element. Calling .getAttribute
     on a string throws TypeError, which the delegated handler
     swallows. The action silently no-ops.

     Affected (all silently broken since v1.1.0–v1.1.5):
       set-article-type        (segmented control — never switched)
       picker-set-tab          (Available/Attached tabs — never switched)
       picker-toggle-bundle    (bundle carets — never expanded)
       picker-insert-image     (thumbnail clicks — never inserted /
                                attached to main / attached to OG)

     The last one is what Jeff saw: thumbnails visible in the
     picker but no way to attach to main. Same root cause
     across all four.

     Fix: changed `action.getAttribute(…)` → `el.getAttribute(…)`
     in all four cases. No other behavior change.

     Lesson noted: in this codebase's delegated handler convention
     `action` is always the string name and `el` is the element.
     Future handlers must use `el.getAttribute` for any companion
     data attributes.

     Also in this release:
       • Picker thumbnail grid: 4 columns → 3 columns. Aspect ratio
         stays 1:1 (already via aspect-ratio:1/1 on the img).

   v1.1.5 — Unified sidebar picker + lenient filters + diagnostic
     Three deltas, all addressing Jeff's live-test feedback on
     v1.1.4: "I am not seeing any images in either Main or
     Inline. What is the source of the image library that is
     shown and what filters are in use? The main image selector
     should use the same sidebar concept as the inline."

     A) Main + OG picker now uses the same sidebar swap as the
        inline picker (no more separate modal). Sidebar picker
        gains a `mode` dimension:

          S.inlinePicker.mode = 'inline' | 'main' | 'og'

        Header label + thumbnail-click behavior change per mode:
          inline → "Insert inline image" → insertImageIntoBody()
          main   → "Pick main image"     → setMainImageFromMedia()
          og     → "Pick OG image"       → setOgImageFromMedia()

        Action rewires (previously fired pickerOpenMedia which
        triggered the legacy modal):
          attach-main-from-media  → openSidebarPickerForMode('main')
          replace-main-image      → same
          attach-og-from-media    → openSidebarPickerForMode('og')
            (new — wired to a "Pick OG image" button in the OG
            zone for when the publisher wants a dedicated OG
            different from the main)
          attach-inline / insert-inline / replace-inline /
            view-inline → still legacy modal for now, but those
            buttons are no longer surfaced in the v1.1.x UI
            (inline images go through the body editor picker)

     B) Source = same as before. Sidebar picker reads from
        document.querySelectorAll('.media-wrapper[data-item]')
        — the same hidden Webflow collection list rendered on
        the T-A page that the Components tab uses. NO article
        filter (works in create mode where there is no article
        yet). NO publisher filter — the collection list itself
        is already scoped to the current T-A's MEDIA at the
        Webflow CMS level.

        Filters applied:
          mediaType — case-insensitive contains 'image' OR
                      (empty AND imageUrl present). Was strict
                      `=== 'image'` in v1.1.4; tightness was
                      rejecting records whose data-media-type
                      came back as 'Image', 'image/jpeg', etc.
          status    — matches TA_CONFIG.optionIds.mediaStatus
                      hash OR display label, case-insensitive.
                      Tab determines which status is required
                      (Available = default; Attached = secondary
                      tab for re-using images across articles).

     C) Diagnostic logging. On every picker open, console logs
        a compact summary of what the picker sees:
          [picker · diag] .media-wrapper count = N
          [picker · diag] image-type after filter = N
          [picker · diag] tab=available count = N
          [picker · diag] tab=attached  count = N
          [picker · diag] first item raw dataset → {…}
        Paste this into the chat when the picker is empty and
        we can pinpoint whether it's a data-attribute issue or
        an actual empty MEDIA library for that T-A.

     Payload extension (create-mode save):
       commitCreateArticle now includes mainImageMediaId and
       ogImageMediaId in the createAsset payload when the user
       has picked images. Scenario 104 currently ignores these
       fields (HC-16 deferred), but they're plumbed end-to-end
       so the moment the scenario is extended, attach works.
       Until then, in-overlay preview reflects the pick but the
       saved article won't have the binding — flagged via a
       gold toast on save when picks are present.

     Preserved verbatim:
       • All Chunk 1–4 layout, body editor, Trix loader.
       • Legacy modal picker (renderPicker / pickerOpenMedia)
         retained for ref pickers (customer, product, ad).
         Just no longer called for media.
       • All field-render primitives.

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
  // v1.2.7 — New-customer form inside the ad-create gate ("+ Add a new
  //          customer & ad"): full create -> publish -> hydrate via
  //          Scenario 111 (TA_CONFIG.makeCreateCustomer). Returned
  //          dataset-keyed record is wrapped like a picker item and fed
  //          to prefillAdFromCustomer, so the ad form hydrates with zero
  //          reload exactly like picking an existing advertiser.
  //          Directory & visibility group: Major + Business category
  //          gate the hide-from-directory switch (locked ON until both
  //          are set; partial = still hidden). Directory is the
  //          Title-Admin's own (auto, route side). Companion CSS bumped
  //          in lockstep (self-load is exact-version).
  // v1.2.9 — AI assist (Part B): create-mode Article auto-derives
  //   teaser + short summary + section headers from the body via
  //   window.InbxGenerate (ta-generate). Auto-run-once + fill-only-empty
  //   + undoable body rewrite. Range counters on teaser/summary.
  // v1.3.0 — fix: initAiAssist() was commented out (run-on with the
  //   initLbpTrix line) so the bar never bound or auto-ran. Now its own
  //   line. Buttons route through handleAction (data-asf-action
  //   ai-gen/ai-regen/ai-undo). Added visible error state + brand
  //   "AI thinking" SVG busy indicator.
  // v1.3.1 — Trix: register H2/H3 as heading blocks (mirrors ta-rte) so the
  //   inline body editor preserves + renders them as headings instead of
  //   flattening them to bold-looking text. Added H2/H3 toolbar buttons
  //   (active-state shows the current heading level) + clearer heading CSS.
  // v1.3.2 — editor typography now matches the published page (and ta-rte):
  //   body Spectral 18/1.95, headings Fraunces 600 teal #1A3A3A
  //   (h1 28 / h2 24 / h3 22). Supersedes v1.3.1 heading sizing. CSS-only
  //   change; JS bumped so the self-loader pulls the matching v1.3.2 CSS.
  // v1.3.3 — inline body toolbar now sticks to the top while editing,
  //   pinning just below the sticky header. .asf-trix-wrap set to
  //   overflow:visible so sticky isn't clipped; header height is measured
  //   into --asf-hdr-h so the toolbar offsets exactly beneath it.
  var VERSION = '1.3.17';

  // v1.1.11 — capture the URL this script was loaded from, NOW, while
  // document.currentScript is still valid (it's only non-null during
  // initial synchronous execution). Used to derive the companion CSS
  // URL for self-loading. Falls back to scanning script tags.
  var OWN_SCRIPT_SRC = (function () {
    try {
      if (document.currentScript && document.currentScript.src) {
        return document.currentScript.src;
      }
    } catch (e) {}
    try {
      var tags = document.getElementsByTagName('script');
      for (var i = tags.length - 1; i >= 0; i--) {
        if (tags[i].src && /ta-asf-v[\d._]+\.js/i.test(tags[i].src)) {
          return tags[i].src;
        }
      }
    } catch (e2) {}
    return null;
  })();

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
      makeExtractEvent:function () { return this.cfg().makeExtractEvent || null; },  // v1.3.8
      makeCreateCustomer:function () { return this.cfg().makeCreateCustomer || null; }, // v1.2.7
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
      'og-image':       'mainImage',  // OG falls back to main-image role
      'splash-image':   'splashAd'    // v1.3.13 — splash MEDIA role
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

    // v1.1.7 — Uploadcare transformation defaults. Per HC-16-A in
    // the header docblock, these should eventually move to TA-level
    // CMS fields with article-level override. For now they're
    // applied uniformly by the image-display helpers below. Edit
    // here to change the crop / quality / face-handling globally
    // until the schema migration ships.
    transforms: {
      main:        '-/scale_crop/1200x1200/smart_faces/-/format/jpeg/-/quality/better/',
      og:          '-/scale_crop/2400x1260/smart_faces/-/format/jpeg/-/quality/better/',
      pickerThumb: '-/preview/240x240/-/format/auto/'
    },

    // v1.1.8 — inline image size + alignment maps. Copied verbatim
    // from ta-rte v1.1.24 so the ASF inline editor and the
    // fullscreen RTE produce identical <figure class="rte-inserted-image">
    // body HTML. Do not diverge these from the RTE without updating
    // both — the saved article body must render the same regardless
    // of which editor produced it.
    imgSizePct: { small: '33%', medium: '50%', large: '75%', full: '100%' },
    imgAlignCss: {
      left:   'margin-left:0;margin-right:auto;',
      center: 'margin-left:auto;margin-right:auto;',
      right:  'margin-left:auto;margin-right:0;'
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

  // ─── v1.1.7 — Uploadcare URL transform helpers ─────────────────
  //
  // Apply Uploadcare CDN transformations (crop, format, quality)
  // to image URLs before rendering. See CFG.transforms for the
  // current defaults and HC-16-A in the header for the schema
  // migration plan.
  //
  // All four helpers are idempotent on non-Uploadcare URLs —
  // those pass through unchanged so fixture / external images
  // don't break.

  function isUploadcareUrl(url) {
    if (!url) return false;
    var s = String(url);
    return s.indexOf('ucarecdn.com')  !== -1 ||
           s.indexOf('ucarecd.net')   !== -1;
  }

  // Splits a Uploadcare URL down to base = scheme + host + UUID +
  // trailing slash. Drops any transform chain AND any appended
  // filename (Uploadcare URLs are commonly stored as `…/uuid/file.jpg`
  // where the filename is decorative; transforms applied directly
  // after the filename are a less-supported URL form and can break
  // some Uploadcare features). Regex-matches the UUIDv4 path
  // segment so this works regardless of what comes after.
  function stripUploadcareTransforms(url) {
    if (!isUploadcareUrl(url)) return url || '';
    var s = String(url);
    // scheme://host/{uuid}/  — UUIDv4 = 8-4-4-4-12 hex with dashes
    var m = s.match(/^(https?:\/\/[^\/]+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/)/i);
    if (m) return m[1];
    // Fallback for non-UUID Uploadcare URLs (rare): try /-/ split.
    var idx = s.indexOf('/-/');
    if (idx === -1) {
      return s.charAt(s.length - 1) === '/' ? s : (s + '/');
    }
    var base = s.slice(0, idx);
    return base.charAt(base.length - 1) === '/' ? base : (base + '/');
  }

  // Apply a transform string (e.g. '-/scale_crop/1200x1200/.../')
  // onto a URL. Strips any existing transform chain first so we
  // never double-apply. Non-Uploadcare URLs pass through.
  function applyUploadcareTransform(url, transform) {
    if (!url) return '';
    if (!isUploadcareUrl(url)) return url;
    var base = stripUploadcareTransforms(url);
    if (!transform) return base;
    // Strip leading '/' from transform if present so we don't get '//'.
    if (transform.charAt(0) === '/') transform = transform.slice(1);
    return base + transform;
  }

  // ── Surface-specific display URL helpers ──
  // These pull the transform from CFG.transforms so the strings
  // are configurable in one place. Future: read article-level
  // override field, then TA-level default, then CFG default.
  function mainImageDisplayUrl(url) {
    return applyUploadcareTransform(url, CFG.transforms.main);
  }
  function ogImageDisplayUrl(url) {
    return applyUploadcareTransform(url, CFG.transforms.og);
  }
  function pickerThumbUrl(url) {
    return applyUploadcareTransform(url, CFG.transforms.pickerThumb);
  }

  // v1.3.5: strip any Uploadcare /-/transform/.../ tail so S.article.{main,og}ImageSrc
  // carries only the base CDN URL ({cdn}/{uuid}/). Make SetVars own the transforms.
  function stripUcTransforms(url) {
    if (!url || typeof url !== 'string') return url || '';
    var i = url.indexOf('/-/');
    return i === -1 ? url : url.slice(0, i + 1);
  }

  // v1.3.5: character-counter markup for any field in CFG.limits.
  // Emitted inside the .asf-field wrapper, below the input. Live-updated
  // by onDelegatedInput after handleFieldEdit (see ~line 6086 area).
  function renderCharCounter(field, value) {
    var max = CFG.limits && CFG.limits[field];
    if (!max) return '';
    var len = (value == null ? '' : String(value)).length;
    var cls = 'asf-char-counter';
    if (len >= max)            cls += ' at';
    else if (len >= max * 0.85) cls += ' near';
    return '<span class="' + cls + '" data-counter-for="' + esc(field) + '"' +
           ' data-counter-max="' + max + '">' + len + '/' + max + '</span>';
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

  // ═══════════════════════════════════════════════════════════════
  //  TD-211 (v1.4.0) — EDIT-MODE HYDRATION for ad / event / realestate
  //
  //  Source: the Workbench Read webhook (TA_CONFIG.makeWorkbenchRead).
  //  It returns { asset: { name, slug, publishStatus, fieldData:{...} },
  //  media: [{ id, fieldData:{...} }] } for ALL 4 asset types. We map
  //  the asset.fieldData (Webflow slug keys) → ASF state keys, seed a
  //  blank shape, then applyPrefill().
  //
  //  fieldData KEYS = Webflow field SLUGS (per data-ref §3). Where a
  //  slug is not yet confirmed, the map value is an ARRAY of candidate
  //  slugs tried in order — first non-empty wins; all-miss logs a warn.
  //  This guarantees a wrong/renamed slug shows as an empty field +
  //  console warning, never silent data corruption (Bug-Class-#7 safe).
  // ═══════════════════════════════════════════════════════════════

  // value: Webflow slug (string) OR [candidate slugs] tried in order.
  var AD_HYDRATE_MAP = {
    // identity
    adName:        ['ad-name', 'name'],
    slug:          'slug',
    // creatives — raw Uploadcare URLs (URL-only render path)
    bannerSrc:     'banner-ad-700x200',          // slug stale-dim, unchanged (data-ref §3b)
    sidebarSrc:    'sidebar-ad-480x400',
    splashSrc:     ['splash-ad-1080', 'splash-ad'],
    // creative links
    bannerLink:    ['banner-ad-link', 'banner-ad-link-get'],
    sidebarLink:   ['sidebar-ad-link', 'sidebar-ad-link-get'],
    splashLink:    ['splash-ad-link--get', 'splash-ad-link-get'],
    // text-ad / LBP fields
    shortTitle:    'short-title',                // label "Text Ad Title" (Bug-Class-#7)
    shortText:     'short-text',                 // label "Text Ad Text"
    lbpRichText:   'short-text-link',            // label "LBP Rich Text" (Bug-Class-#7)
    redirectLink:  ['redirect-link', 'redirect-link-go'],
    // advertiser ref
    customerId:    ['associated-advertiser', 'associated-business-coc']
  };

  var EV_HYDRATE_MAP = {
    eventName:               ['event-name', 'name'],
    slug:                    'slug',
    eventDescription:        'event-description',
    eventStartDate:          ['event-start', 'event-start-date'],
    eventEndDate:            ['event-end', 'event-end-date'],
    // venue — v1.3.11 split fields; older records may carry combined slugs
    eventLocation:           ['event-location', 'venue-name'],
    eventVenueStreetAddress: ['event-venue-street-address', 'event-address'],
    eventVenueCity:          ['event-venue-city', 'event-city'],
    eventVenueState:         ['event-venue-state'],
    eventVenueZip:           ['event-venue-zip'],
    eventVenueRoom:          ['event-venue-room'],
    eventRedirectLink:       ['event-redirect-link', 'redirect-link'],
    // hero image — URL-only
    mainImageSrc:            ['event-image', 'event-image-link', 'main-image'],
    customerId:              ['associated-advertiser', 'sponsor']
  };

  var RE_HYDRATE_MAP = {
    // primary display name — dual property-address instances per data-ref §3;
    // try the labeled "# Street City" slug first.
    propertyAddress: ['property-address-street-city', 'property-address'],
    slug:            'slug',
    propertyMls:     ['mls-number', 'mls-#', 'mls'],   // exact slug TBD (data-ref §3 note 6)
    propertyPrice:   'property-price',
    propertyFeatures:['property-features'],
    propertyLink:    ['listing-link', 'property-link'],
    propertyStatus:  ['property-status'],
    // primary image — URL-only
    mainImageSrc:    ['property-image-link', 'listing-image-src', 'main-image'],
    customerId:      ['listing-agent-customer', 'associated-advertiser']
  };

  // Resolve one mapped value: slug string or candidate array → first
  // non-empty fieldData value. Returns '' on total miss (caller logs).
  function pickField(fieldData, spec) {
    var cands = (typeof spec === 'string') ? [spec] : (spec || []);
    for (var i = 0; i < cands.length; i++) {
      var raw = fieldData[cands[i]];
      if (raw == null) continue;
      // Webflow reference fields come back as id strings or {id} objects.
      if (typeof raw === 'object') {
        if (raw.id) return String(raw.id);
        continue;
      }
      var v = String(raw).trim();
      if (v !== '') return v;
    }
    return '';
  }

  function mapFieldDataToState(assetType, fieldData) {
    var map = (assetType === 'ad')    ? AD_HYDRATE_MAP
            : (assetType === 'event') ? EV_HYDRATE_MAP
            : RE_HYDRATE_MAP; // realestate
    var out = {};
    var misses = [];
    for (var key in map) {
      if (!map.hasOwnProperty(key)) continue;
      var val = pickField(fieldData, map[key]);
      if (val === '') {
        misses.push(key + ' (' + JSON.stringify(map[key]) + ')');
      } else {
        // image-src keys get UC-transform stripping for consistency
        out[key] = /ImageSrc$|Src$/.test(key) ? stripUcTransforms(val) : val;
      }
    }
    if (misses.length) {
      warn('hydrate ' + assetType + ': no fieldData for → ' + misses.join(', ') +
           ' — confirm slugs against live record (data-ref §3)');
    }
    return out;
  }

  // ASYNC hydrate for ad/event/RE via Workbench Read webhook.
  // Resolves to { fields, media } or null on failure.
  function hydrateAssetViaWebhook(assetType, assetId) {
    var cfg = window.TA_CONFIG || {};
    var hook = cfg.makeWorkbenchRead;
    if (!hook || !assetId) {
      warn('hydrateAssetViaWebhook: missing makeWorkbenchRead or assetId');
      return Promise.resolve(null);
    }
    var url = hook + (hook.indexOf('?') === -1 ? '?' : '&') +
              'assetType=' + encodeURIComponent(assetType) +
              '&assetId='  + encodeURIComponent(assetId);
    return fetch(url, { method: 'GET' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (body) {
        var asset = (body && body.asset) || {};
        var fieldData = asset.fieldData || {};
        var fields = mapFieldDataToState(assetType, fieldData);
        // identity always available at top level
        if (asset.name && !fields.adName && !fields.eventName && !fields.propertyAddress) {
          // seed a generic name into the type's primary name key
          if (assetType === 'ad')    fields.adName        = asset.name;
          if (assetType === 'event') fields.eventName     = asset.name;
          if (assetType === 'realestate') fields.propertyAddress = asset.name;
        }
        if (asset.slug) fields.slug = asset.slug;
        fields.id = assetId;
        var media = (body && body.media) || [];
        return { fields: fields, media: media };
      })
      .catch(function (err) {
        warn('hydrateAssetViaWebhook failed', err);
        return null;
      });
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
      mainImageSrc:     stripUcTransforms((d.articleMainImageSrc || '').trim()),
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
    // v1.1.11 — guarantee the companion stylesheet before painting,
    // so a stale/missing head <link> can't leave the overlay invisible.
    ensureStylesLoaded();

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

    // v1.2.6 — Ad create gate: a focused first screen to choose the
    // advertiser before the form opens. Renders in place of the shell.
    if (S.adGateOpen) {
      panel.innerHTML = renderContextBar() +
        (S.gateNewOpen ? renderNewCustomerForm() : renderAdGate());
      bindAll();
      if (S.gateNewOpen) recomputeDirGate();   // v1.2.7 — paint initial gate state
      return;
    }

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
          renderMainForType(rtp) +
        '</div>' +
        '<div class="' + sideCls + '">' +
          renderSideForType(rtp) +
        '</div>' +
      '</div>' +
      renderActionBar(rtp);   // v1.1.9 — fixed at bottom of viewport

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
    initEventTrix();   // v1.2.1 — no-op unless EV description editor is in DOM
    initLbpTrix();     // v1.2.3 — no-op unless LBP rich-text editor is in DOM
    initAiAssist();    // v1.3.0 — no-op unless create-mode Article + InbxGenerate present
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
    // v1.3.16 — URL conditioner: normalize URL fields on blur. focusout
    // bubbles (blur does not), so it works with event delegation.
    root.addEventListener('focusout', onDelegatedFocusOut);

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

    // v1.4.1 — BUG 3 INTERIM B: editing the body in edit mode reloads
    // the page (RTE save → Scenario G → reload), which would wipe any
    // unsaved field edits. The old guard let the operator discard-and-
    // continue, which still lost the edits. We now BLOCK opening the RTE
    // while there are unsaved field changes and tell them to save/revert
    // first. (The true no-loss fix — persist field edits with no reload —
    // ships with TD-216's edit-save scenario; note that Save itself is
    // currently HC-15-blocked, so "save first" means once TD-216 lands.)
    // v1.5.0 (TD-216): article edit-save is live, so the operator CAN save
    // field edits before the body editor's reload. We still block the open
    // while dirty (the reload would discard unsaved edits), but the message
    // now points at the working Save. For non-article, save isn't wired yet,
    // so the same block stands as a hard guard against loss.
    if (hasDirty()) {
      toast('Save your field edits first (they will be lost when the body ' +
            'editor reloads), then open the body editor.', 'error');
      return;
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
    // v1.2.0 — label reflects asset type
    var typeLabel = S.assetType === 'realestate' ? 'real estate listing'
                  : S.assetType === 'event'      ? 'event'
                  : S.assetType === 'ad'         ? 'ad'
                  : 'article';
    var ctxName = (a.titleAdminName || a.titleName || '').trim() ||
                  (S.mode === 'create' ? ('new ' + typeLabel) : ('edit ' + typeLabel));
    var modeTag = S.mode === 'create' ? (' · new ' + typeLabel) : (' · edit ' + typeLabel);
    return '' +
      '<div class="asf-context-bar">' +
        '<span class="asf-cx-name">' + esc(ctxName) + esc(modeTag) + '</span>' +
        '<span class="asf-cx-close" data-asf-action="close-overlay" title="Close (Esc)">✕</span>' +
      '</div>';
  }

  // v1.2.6 — Ad-create customer-first gate. Pick an existing advertiser
  // (the ad name + Local Business Profile then auto-fill on Continue), or
  // start a new customer (wired when the create-customer route lands).
  // Reuses readCustomers() for the existing list.
  function renderAdGate() {
    var customers = readCustomers();
    var opts = '<option value="">\u2014 choose an advertiser \u2014</option>' +
      customers.map(function (c) {
        return '<option value="' + esc(c.id) + '">' + esc(c.name || c.id) + '</option>';
      }).join('');
    var newDisabled = false;  // v1.2.7 — create-customer form is live
    return '' +
      '<div class="asf-gate">' +
        '<div class="asf-gate-card">' +
          '<div class="asf-gate-head">Start a new ad</div>' +
          '<div class="asf-gate-sub">Every ad belongs to an advertiser. Choose the customer first \u2014 the ad name and the Local Business Profile fill in automatically.</div>' +
          '<div class="asf-gate-opt">' +
            '<label class="asf-gate-label">Use an existing advertiser</label>' +
            '<div class="asf-gate-row">' +
              '<select class="asf-gate-select">' + opts + '</select>' +
              '<button type="button" class="asf-pick-btn primary" data-asf-action="gate-continue">Continue \u2192</button>' +
            '</div>' +
          '</div>' +
          '<div class="asf-gate-or"><span>or</span></div>' +
          '<div class="asf-gate-opt">' +
            '<button type="button" class="asf-gate-new"' + (newDisabled ? ' disabled' : '') +
              ' data-asf-action="gate-new-customer">+ Add a new customer &amp; ad</button>' +
            (newDisabled
              ? '<div class="asf-gate-note">New-customer creation arrives with the create-customer route (in progress). For now, pick an existing advertiser above.</div>'
              : '') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ═══════════════════════════════════════════════════════════════
  //  v1.2.7 — NEW-CUSTOMER FORM  (ad-create gate · "+ Add new customer")
  //  Opens in place of the advertiser picker. POSTs the customer fields
  //  to Scenario 111 (createEditCustomer) at TA_CONFIG.makeCreateCustomer,
  //  which creates + PUBLISHES the Customer and returns the full
  //  dataset-keyed record. We wrap that record like a picker item
  //  ({id,name,raw}) and hand it to prefillAdFromCustomer — so the ad
  //  form hydrates with zero reload, identical to picking an existing
  //  advertiser.
  //
  //  Directory & visibility (per Jeff):
  //    • Directory is the Title-Admin's own directory — auto-assigned on
  //      the route (from the Data Store), NOT an operator pick here.
  //    • A customer shows in a directory only once categorised, so the
  //      hide-from-directory switch is LOCKED ON until BOTH Major and
  //      Business category are set (partial = still hidden).
  //    • Once both are set the switch unlocks and defaults OFF.
  //    • Category is usually deferred at create → uncategorised → hidden;
  //      the route guards the empty-category lookups.
  // ═══════════════════════════════════════════════════════════════
  function blankNewCustomer() {
    return {
      name:'', customerType:'Regular', shortCode:'', tagline:'',
      website:'', phone:'', email:'',
      address:'', address2:'', cityStZip:'', neighborhood:'',
      majorCategory:'', majorCategoryName:'',
      businessCategory:'', businessCategoryName:'',
      hideFromDirectory:true
    };
  }

  // Read the category collection list from the DOM, if the T-A page
  // renders one. Configurable selector (TA_CONFIG.categoriesSelector);
  // defaults to .categories-wrapper[data-cat-id]. Each item exposes
  // data-cat-id, data-cat-name, data-cat-parent (empty/0 = a Major/parent
  // category; otherwise the parent Major's id) and data-cat-type
  // ('major' | 'business') as a fallback signal. Returns
  //   { majors:[{id,name}], subsByParent:{parentId:[{id,name}]} }
  // Degrades to empty when no list is present (the common deferred case).
  function readCategories() {
    var cfg = window.TA_CONFIG || {};
    var sel = cfg.categoriesSelector || '.categories-wrapper[data-cat-id]';
    var out = { majors:[], subsByParent:{} };
    var nodes;
    try { nodes = document.querySelectorAll(sel); } catch (e) { nodes = []; }
    Array.prototype.forEach.call(nodes, function (el) {
      var d = el.dataset || {};
      var id = (d.catId || '').trim();
      if (!id) return;
      var name   = (d.catName || '').trim() || id;
      var parent = (d.catParent || '').trim();
      var type   = (d.catType || '').trim().toLowerCase();
      var isMajor = type === 'major' || (!parent || parent === '0');
      if (isMajor) out.majors.push({ id:id, name:name });
      else (out.subsByParent[parent] = out.subsByParent[parent] || []).push({ id:id, name:name });
    });
    return out;
  }
  var NEWCUST_CATS = null;   // cached per gate render

  function newcustOpt(value, label, selected) {
    return '<option value="' + esc(value) + '"' + (selected ? ' selected' : '') +
           '>' + esc(label) + '</option>';
  }

  function renderNewCustomerForm() {
    var c = S.newCust || (S.newCust = blankNewCustomer());
    NEWCUST_CATS = readCategories();
    var cats = NEWCUST_CATS;
    var cfg  = window.TA_CONFIG || {};
    var dirName = cfg.directoryName || cfg.titleName || CFG.tenant.titleSlug() || 'this title\u2019s directory';

    var typeOpts = ['Regular','Real Estate Agency','Events Contributor','Expert Contributor','Free/Complimentary Client']
      .map(function (t) { return newcustOpt(t, t, c.customerType === t); }).join('');

    var majorOpts = newcustOpt('', '\u2014 choose \u2014', !c.majorCategory) +
      cats.majors.map(function (m) { return newcustOpt(m.id, m.name, c.majorCategory === m.id); }).join('');
    var subs = c.majorCategory ? (cats.subsByParent[c.majorCategory] || []) : [];
    var bizDisabled = !c.majorCategory || !subs.length;
    var bizOpts = bizDisabled
      ? newcustOpt('', cats.majors.length ? '\u2014 pick major first \u2014' : '\u2014 none loaded \u2014', true)
      : (newcustOpt('', '\u2014 choose \u2014', !c.businessCategory) +
         subs.map(function (s) { return newcustOpt(s.id, s.name, c.businessCategory === s.id); }).join(''));
    var noCats = !cats.majors.length;

    function field(label, key, ph, full) {
      return '<div class="asf-nc-f' + (full ? ' full' : '') + '">' +
        '<label class="asf-nc-lab">' + label + '</label>' +
        '<input class="asf-nc-in" data-asf-newcust="' + key + '" value="' + esc(c[key] || '') +
        '" placeholder="' + esc(ph || '') + '"></div>';
    }

    return '' +
    '<div class="asf-nc"><div class="asf-nc-card">' +
      '<div class="asf-nc-head">Add a new advertiser</div>' +
      '<div class="asf-nc-sub">Create the customer, then drop straight into the ad. Only the name and type are required \u2014 the rest can be finished later from the profile.</div>' +

      '<div class="asf-nc-sec">' +
        '<div class="asf-nc-sh"><span class="asf-nc-n">1</span>Identity<span class="asf-nc-meta">Status set automatically</span></div>' +
        '<div class="asf-nc-grid">' +
          '<div class="asf-nc-f full"><label class="asf-nc-lab">Business name <i>*</i></label>' +
            '<input class="asf-nc-in" data-asf-newcust="name" value="' + esc(c.name) + '" placeholder="e.g. Ridgewood Family Dental"></div>' +
          '<div class="asf-nc-f"><label class="asf-nc-lab">Customer type <i>*</i></label>' +
            '<select class="asf-nc-in" data-asf-newcust="customerType">' + typeOpts + '</select></div>' +
          field('Short code', 'shortCode', 'RFD') +
          field('Tagline', 'tagline', 'Modern dentistry for the whole family', true) +
          '<div class="asf-nc-f full"><span class="asf-nc-auto">Client status <b>New-Setup</b> &middot; Profile status <b>Incomplete</b> &mdash; set automatically</span></div>' +
        '</div>' +
      '</div>' +

      '<div class="asf-nc-sec">' +
        '<div class="asf-nc-sh"><span class="asf-nc-n">2</span>Contact</div>' +
        '<div class="asf-nc-grid">' +
          field('Website', 'website', 'https://') +
          field('Phone', 'phone', '201-555-0100') +
          field('Email', 'email', 'hello@business.com', true) +
        '</div>' +
      '</div>' +

      '<div class="asf-nc-sec">' +
        '<div class="asf-nc-sh"><span class="asf-nc-n">3</span>Location</div>' +
        '<div class="asf-nc-grid">' +
          field('Address', 'address', '12 Main St') +
          field('Address 2', 'address2', 'Suite 4') +
          field('City / State / Zip', 'cityStZip', 'Wyckoff, NJ 07481') +
          field('Neighborhood', 'neighborhood', 'Downtown') +
        '</div>' +
      '</div>' +

      '<div class="asf-nc-sec asf-nc-dir">' +
        '<div class="asf-nc-sh"><span class="asf-nc-n gold">4</span>Directory &amp; visibility<span class="asf-nc-meta" data-asf-dir-count>0 of 2 set</span></div>' +
        '<div class="asf-nc-dirnote">A customer appears in a directory only once it\u2019s categorised \u2014 <b>both</b> Major and Business category set. Until then it stays hidden and the switch is locked on. Directory is auto-assigned to <b>' + esc(dirName) + '</b>.</div>' +
        '<div class="asf-nc-gate">' +
          '<div class="asf-nc-two">' +
            '<div class="asf-nc-cell"><span class="asf-nc-step"><span class="asf-nc-dot" data-asf-dot="major"></span>Major Category</span>' +
              '<select class="asf-nc-in" data-asf-newcust-cat="major"' + (noCats ? ' disabled' : '') + '>' + majorOpts + '</select></div>' +
            '<div class="asf-nc-cell"><span class="asf-nc-step"><span class="asf-nc-dot" data-asf-dot="business"></span>Business Category</span>' +
              '<select class="asf-nc-in" data-asf-newcust-cat="business"' + (bizDisabled ? ' disabled' : '') + '>' + bizOpts + '</select></div>' +
          '</div>' +
          '<div class="asf-nc-hide" data-asf-hide-row>' +
            '<label class="asf-nc-tog locked" data-asf-tog><input type="checkbox" data-asf-newcust="hideFromDirectory"' + (c.hideFromDirectory ? ' checked' : '') + ' disabled><span class="asf-nc-track"></span><span class="asf-nc-knob"></span></label>' +
            '<div class="asf-nc-hidetxt"><div class="t">Hide from directory</div><div class="s" data-asf-hide-sub>Locked on until both categories are set.</div></div>' +
            '<span class="asf-nc-lock" data-asf-lock>\uD83D\uDD12 Locked on</span>' +
          '</div>' +
        '</div>' +
        '<div class="asf-nc-vis"><span class="asf-nc-badge hidden" data-asf-vis-badge>Hidden</span><span class="asf-nc-vtxt" data-asf-vis-txt>Won\u2019t appear in any directory yet.</span></div>' +
        (noCats ? '<div class="asf-nc-note">No category list loaded on this page \u2014 categorise later from the customer\u2019s profile. The customer is created hidden.</div>' : '') +
      '</div>' +

      '<div class="asf-nc-foot">' +
        '<button type="button" class="asf-nc-cancel" data-asf-action="gate-cancel-new">\u2190 Back</button>' +
        '<span class="asf-nc-spacer"></span>' +
        '<span class="asf-nc-autonote">Saves &rarr; publishes &rarr; ad hydrates</span>' +
        '<button type="button" class="asf-pick-btn primary" data-asf-action="newcust-create" data-asf-create-btn>Create customer &amp; continue \u2192</button>' +
      '</div>' +
    '</div></div>';
  }

  // Major/Business select change: write id+name, repopulate Business in
  // place, recompute the gate. No full re-render (keeps the operator's
  // place + any open select).
  function handleNewCustCategory(which, el) {
    var c = S.newCust; if (!c) return;
    var label = (el.options && el.options[el.selectedIndex]) ? el.options[el.selectedIndex].text : '';
    if (which === 'major') {
      c.majorCategory = el.value; c.majorCategoryName = el.value ? label : '';
      c.businessCategory = ''; c.businessCategoryName = '';
      populateBusinessSelect();
    } else if (which === 'business') {
      c.businessCategory = el.value; c.businessCategoryName = el.value ? label : '';
    }
    recomputeDirGate();
  }

  function populateBusinessSelect() {
    var c = S.newCust; if (!c) return;
    var sel = qs(S.overlay, '[data-asf-newcust-cat="business"]');
    if (!sel) return;
    var cats = NEWCUST_CATS || readCategories();
    var subs = c.majorCategory ? (cats.subsByParent[c.majorCategory] || []) : [];
    if (!c.majorCategory || !subs.length) {
      sel.innerHTML = newcustOpt('', cats.majors.length ? '\u2014 pick major first \u2014' : '\u2014 none loaded \u2014', true);
      sel.disabled = true;
    } else {
      sel.innerHTML = newcustOpt('', '\u2014 choose \u2014', true) +
        subs.map(function (s) { return newcustOpt(s.id, s.name, false); }).join('');
      sel.disabled = false;
    }
  }

  // The hide-gating heart. Operates on the live DOM (no re-render).
  // complete = BOTH categories set. Incomplete -> hide forced ON +
  // disabled. Complete -> unlocked, defaults OFF on first unlock.
  function recomputeDirGate() {
    var c = S.newCust; if (!c) return;
    var root = S.overlay; if (!root) return;
    var hasMajor = !!c.majorCategory, hasBiz = !!c.businessCategory;
    var n = (hasMajor ? 1 : 0) + (hasBiz ? 1 : 0);
    var complete = n === 2;

    var dM = qs(root, '[data-asf-dot="major"]');    if (dM) dM.classList.toggle('done', hasMajor);
    var dB = qs(root, '[data-asf-dot="business"]');  if (dB) dB.classList.toggle('done', hasBiz);
    var cnt = qs(root, '[data-asf-dir-count]');       if (cnt) cnt.textContent = n + ' of 2 set';

    var box  = qs(root, '[data-asf-newcust="hideFromDirectory"]');
    var tog  = qs(root, '[data-asf-tog]');
    var row  = qs(root, '[data-asf-hide-row]');
    var lock = qs(root, '[data-asf-lock]');
    var sub  = qs(root, '[data-asf-hide-sub]');

    if (!complete) {
      c.hideFromDirectory = true;
      if (box) { box.checked = true; box.disabled = true; }
      if (tog) { tog.classList.add('locked'); tog.classList.remove('unlocked'); tog._unlockedOnce = false; }
      if (row) row.classList.remove('unlocked');
      if (lock) lock.style.display = '';
      if (sub) sub.textContent = (n === 0)
        ? 'Locked on until both categories are set.'
        : 'Partially categorised \u2014 still hidden. Set both to unlock.';
    } else {
      if (box) box.disabled = false;
      if (tog && !tog._unlockedOnce) { if (box) box.checked = false; c.hideFromDirectory = false; tog._unlockedOnce = true; }
      if (tog) { tog.classList.remove('locked'); tog.classList.add('unlocked'); }
      if (row) row.classList.add('unlocked');
      if (lock) lock.style.display = 'none';
      if (sub) sub.textContent = 'Categorised \u2014 visible in the directory. Toggle on to keep it hidden.';
      if (box) c.hideFromDirectory = !!box.checked;
    }
    paintNewCustVis(complete);
  }

  function paintNewCustVis(complete) {
    var c = S.newCust; if (!c) return;
    var root = S.overlay; if (!root) return;
    var b = qs(root, '[data-asf-vis-badge]'), t = qs(root, '[data-asf-vis-txt]');
    var hidden = !complete || c.hideFromDirectory;
    if (b) { b.className = 'asf-nc-badge ' + (hidden ? 'hidden' : 'shown'); b.textContent = hidden ? 'Hidden' : 'Showing'; }
    if (t) t.textContent = hidden
      ? (complete ? 'Set to hidden \u2014 won\u2019t appear in the directory.' : 'Won\u2019t appear in any directory yet.')
      : 'Will appear in the directory.';
  }

  // POST the new customer to Scenario 111, then hydrate the ad from the
  // returned record — same path as picking an existing advertiser.
  function commitCreateCustomer() {
    if (S.newCustSaving) return;
    var c = S.newCust || {};
    var name = (c.name || '').trim();
    if (!name) { toast('Business name is required', 'error'); return; }

    var url = CFG.tenant.makeCreateCustomer();
    var initials = (name.split(/\s+/).filter(Boolean).slice(0, 3)
                      .map(function (w) { return w.charAt(0); }).join('') || name.slice(0, 2)).toUpperCase();

    var payload = {
      action:    'createEditCustomer',
      titleSlug: CFG.tenant.titleSlug(),
      taItemId:  CFG.tenant.taItemId(),
      source:    'asf-v' + VERSION,
      name:           name,
      customerType:   c.customerType || 'Regular',
      shortCode:      (c.shortCode || '').trim(),
      logoInitials:   initials,
      tagline:        c.tagline || '',
      website:        c.website || '',
      phone:          c.phone || '',
      email:          c.email || '',
      address:        c.address || '',
      address2:       c.address2 || '',
      cityStZip:      c.cityStZip || '',
      neighborhood:   c.neighborhood || '',
      majorCategory:    c.majorCategory || '',
      businessCategory: c.businessCategory || '',
      clientStatus:   'New-Setup',
      profileStatus:  'Incomplete',
      hideFromDirectory: !!c.hideFromDirectory,
      expertContributor: false,
      featuredListing:   false
    };
    log('createEditCustomer payload', payload);

    var btn = qs(S.overlay, '[data-asf-create-btn]');
    function btnBusy(b) {
      if (!btn) return;
      btn.disabled = b;
      btn.textContent = b ? 'Creating\u2026' : 'Create customer & continue \u2192';
    }

    if (!url) {
      toast('Create-customer endpoint not configured \u2014 add TA_CONFIG.makeCreateCustomer', 'error');
      console.log('[ASF v' + VERSION + '] would POST createEditCustomer \u2192', payload);
      return;
    }

    S.newCustSaving = true; btnBusy(true);
    fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (body) {
        var j; try { j = JSON.parse(body); } catch (e) { j = null; }
        if (!j || j.ok !== true || !j.customer || !j.customer.id) {
          console.warn('[ASF v' + VERSION + '] createEditCustomer unexpected response:', body);
          throw new Error('Scenario 111 did not confirm \u2014 see console / Make execution history.');
        }
        var item = { id:j.customer.id, name:j.customer.name || name, raw:j.customer };
        S.newCustSaving = false;
        S.article.customerId   = item.id;
        S.article.customerName = item.name;
        prefillAdFromCustomer(item);
        S.gateNewOpen = false;
        S.adGateOpen  = false;
        toast('Customer created \u2014 ad ready', 'success');
        render();
      })
      .catch(function (err) {
        S.newCustSaving = false; btnBusy(false);
        warn('createEditCustomer failed', err);
        toast(err && err.message ? err.message : 'Create failed', 'error');
      });
  }


  // v1.2.0 — render dispatchers. Article path unchanged; new asset
  // types branch here. The picker guard is lifted to the side
  // dispatcher so it's shared across every variant.
  function renderMainForType(rtp) {
    if (S.assetType === 'realestate') return renderREMain();
    if (S.assetType === 'event')      return renderEVMain();
    if (S.assetType === 'ad')         return renderADSMain();
    return renderMain(rtp);
  }
  function renderSideForType(rtp) {
    if (S.inlinePicker && S.inlinePicker.open) return renderInlinePicker();
    if (S.assetType === 'realestate') return renderRESide();
    if (S.assetType === 'event')      return renderEVSide();
    if (S.assetType === 'ad')         return renderADSSide();
    return renderSide(rtp);
  }

  // ═══════════════════════════════════════════════════════════════
  //  v1.2.0 — REAL ESTATE (RE) VARIANT
  //  Structured-listing create form. Reuses the shared shell,
  //  sidebar MEDIA picker ('main' mode), Uploadcare upload, field
  //  primitives, dirty tracking, and commit plumbing.
  // ═══════════════════════════════════════════════════════════════

  // RE field bag. Reuses the generic mainImage* keys for the
  // Property Image so the existing 'main' picker mode works without
  // change. TA/title seeded from TA_CONFIG exactly like blankArticle.
  function blankRE() {
    var cfg = window.TA_CONFIG || {};
    return {
      id:                 null,
      assetType:          'realestate',
      // TA / title (auto, from config)
      taItemId:           cfg.taItemId       || '',
      titleAdminName:     cfg.titleAdminName || '',
      titleId:            cfg.titleId        || '',
      titleName:          cfg.titleName      || cfg.titleSlug || '',
      titleSlug:          cfg.titleSlug      || '',
      // Property identity
      propertyAddress:    '',
      propertyMls:        '',
      propertyStatus:     '',     // Active | Pending | Sold | Withdrawn | Coming Soon
      propertyPrice:      '',
      propertyFeatures:   '',
      propertyLink:       '',
      // Primary (Property) image — reuses generic main-image keys
      mainImageSrc:       '',
      mainImageMediaId:   '',
      mainImageAlt:       '',
      // Refs
      customerId:         '',
      customerName:       '',     // agent / broker
      newsletterId:       '',
      newsletterName:     '',
      newsletterDate:     '',
      revenueType:        '',
      // Lifecycle
      availabilityStatus: 'Available',   // Available | Used
      status:             'Draft',
      created:            '',
      updated:            ''
    };
  }

  // Small option-dropdown primitive (mirrors the .asf-select markup
  // used for revenueType). opts = [{value,label}, ...].
  function renderSelect(o) {
    o = o || {};
    var cur  = o.value == null ? '' : String(o.value);
    var opts = o.options || [];
    var html = '';
    for (var i = 0; i < opts.length; i++) {
      html += '<option value="' + esc(opts[i].value) + '"' +
        (cur === opts[i].value ? ' selected' : '') + '>' +
        esc(opts[i].label) + '</option>';
    }
    var dirty = (o.field && isDirtyKey(o.field)) ? ' dirty' : '';
    var reqMark = o.req ? '<span class="req">*</span>' : '';
    return '' +
      '<div class="asf-field">' +
        '<label class="asf-field-label">' + esc(o.label) + ' ' + reqMark + '</label>' +
        '<select class="asf-select' + dirty + '" data-asf-field="' + esc(o.field) + '">' +
          html +
        '</select>' +
      '</div>';
  }

  // RE Property Image — reuses the 'main' picker mode + mainImage*
  // keys. Simpler than the Article zone (no OG, no "use as OG").
  function renderREImageZone() {
    var a          = S.article || {};
    var displayUrl = a.mainImageSrc || '';
    var altDirty   = isDirtyKey('mainImageAlt');

    var card;
    if (displayUrl) {
      card =
        '<div class="asf-mainog-card has-image">' +
          '<div class="asf-mainog-img"' +
               ' style="background-image:url(' + esc(mainImageDisplayUrl(displayUrl)) + ');"' +
               ' data-asf-action="preview-main-image" title="Click to preview full size"></div>' +
          '<div class="asf-mainog-actions">' +
            '<button type="button" class="asf-mainog-act" data-asf-action="replace-main-image">Replace</button>' +
            '<button type="button" class="asf-mainog-act" data-asf-action="preview-main-image">Preview</button>' +
          '</div>' +
        '</div>';
    } else {
      card =
        '<div class="asf-mainog-card empty"' +
             ' data-asf-action="attach-main-from-media" title="Click to attach from MEDIA library">' +
          '<div class="asf-mainog-empty-icon">🏠</div>' +
          '<div class="asf-mainog-empty-prompt">Click to attach listing photo</div>' +
          '<div class="asf-mainog-empty-sub">Property Image · listing hero</div>' +
        '</div>';
    }

    return '' +
      '<div class="asf-mainog-zone asf-re-imagezone">' +
        '<div class="asf-mainog-head">' +
          '<span class="asf-mainog-title">Property image</span>' +
          (displayUrl ? '<span class="asf-mainog-badge">attached</span>' : '') +
        '</div>' +
        card +
        '<div class="asf-mainog-meta">' +
          '<label class="asf-field-label">Alt text' +
            (a.mainImageAlt ? '' : ' <span class="asf-field-req">·  recommended</span>') +
          '</label>' +
          '<input type="text" class="asf-input' + (altDirty ? ' dirty' : '') + '"' +
            ' data-asf-field="mainImageAlt"' +
            ' value="' + esc(a.mainImageAlt || '') + '"' +
            ' placeholder="e.g. 123 Maple Ave, front exterior">' +
        '</div>' +
      '</div>';
  }

  // RE main column — property identity + image + link.
  function renderREMain() {
    var statusOpts = [
      { value: '',            label: '— select —' },
      { value: 'Active',      label: 'Active' },
      { value: 'Coming Soon', label: 'Coming Soon' },
      { value: 'Pending',     label: 'Pending' },
      { value: 'Sold',        label: 'Sold' },
      { value: 'Withdrawn',   label: 'Withdrawn' }
    ];

    return '' +
      '<div class="asf-re-headline">' +
        renderField({
          label: 'Property address', field: 'propertyAddress', req: true,
          value: curValRead('propertyAddress'),
          placeholder: 'Number, street, city'
        }) +
      '</div>' +

      '<div class="asf-re-grid">' +
        renderSelect({
          label: 'Listing status', field: 'propertyStatus', req: true,
          value: curValRead('propertyStatus'), options: statusOpts
        }) +
        renderField({
          label: 'Asking price', field: 'propertyPrice',
          value: curValRead('propertyPrice'),
          placeholder: '$0,000,000'
        }) +
        renderField({
          label: 'MLS #', field: 'propertyMls',
          value: curValRead('propertyMls'),
          placeholder: 'MLS number'
        }) +
        renderField({
          label: 'Property link', field: 'propertyLink', mono: true,
          value: curValRead('propertyLink'),
          placeholder: 'https:// listing page'
        }) +
      '</div>' +

      renderTextarea({
        label: 'Property features', field: 'propertyFeatures',
        value: curValRead('propertyFeatures'),
        placeholder: 'Beds, baths, sq ft, lot size, highlights…'
      }) +

      renderREImageZone();
  }

  // RE sidebar — customer (agent/broker) ref, newsletter scheduling
  // (reused), availability, identifiers, status line.
  function renderRESide() {
    var a = S.article || {};
    var availOpts = [
      { value: 'Available', label: 'Available' },
      { value: 'Used',      label: 'Used' }
    ];

    var refsInner =
      renderUnlockedRef('Customer (agent / broker)', a.customerName, 'customer');

    var scheduleInner =
      '<div class="asf-field">' +
        '<label class="asf-field-label">Tentative newsletter</label>' +
        renderSideNewsletterSelect() +
      '</div>';

    var availInner = renderSelect({
      label: 'Availability status', field: 'availabilityStatus',
      value: curValRead('availabilityStatus'), options: availOpts
    });

    return '' +
      renderSideSection('references',  'Customer',        refsInner) +
      renderSideSection('scheduling',  'Scheduling',      scheduleInner) +
      renderSideSection('availability','Availability',    availInner) +
      renderSideSection('identifiers', 'Identifiers',     renderSideS6Identifiers()) +
      renderREStatusLine();
  }

  function renderREStatusLine() {
    var a = S.article || {};
    return '' +
      '<div class="asf-statusline">' +
        '<span class="asf-statusline-dot"></span>' +
        '<span class="asf-statusline-text">Real estate listing · ' +
          esc(a.status || 'Draft') + '</span>' +
      '</div>';
  }

  // RE create commit → Scenario 104 (assetType:'realestate').
  function commitCreateRE() {
    if (S.saving) return;

    var addr = curVal('propertyAddress');
    if (!addr || !String(addr).trim()) {
      toast('Property address is required to create a listing', 'error');
      return;
    }
    if (!curVal('propertyStatus')) {
      toast('Listing status is required', 'error');
      return;
    }

    var url = CFG.tenant.makeCreateAssets();
    var a   = S.article || {};

    var payload = {
      action:    'createAsset',
      assetType: 'realestate',
      titleSlug: CFG.tenant.titleSlug(),
      taItemId:  CFG.tenant.taItemId(),
      source:    'asf-v' + VERSION,
      fields: {
        propertyAddress:    curVal('propertyAddress'),
        propertyMls:        curVal('propertyMls'),
        propertyStatus:     curVal('propertyStatus'),
        propertyPrice:      curVal('propertyPrice'),
        propertyFeatures:   curVal('propertyFeatures'),
        propertyLink:       curVal('propertyLink'),
        availabilityStatus: curVal('availabilityStatus') || 'Available',
        // Property image — v1.3.12 semantic keys; read from generic
        // internal state (S.article.mainImage*) where the picker writes.
        listingImageMediaId: a.mainImageMediaId || '',
        listingImageSrc:     a.mainImageSrc     || '',
        listingImageAlt:     curVal('mainImageAlt') || '',
        // Refs
        customerId:         a.customerId   || '',
        customerName:       a.customerName || '',
        newsletterId:       a.newsletterId   || '',
        newsletterName:     a.newsletterName || '',
        newsletterDate:     a.newsletterDate || '',
        revenueType:        a.revenueType || ''
      }
    };
    log('createAsset payload · realestate', payload);

    if (!url) {
      toast('Create Assets endpoint not configured — add TA_CONFIG.makeCreateAssets', 'error');
      console.log('[ASF v' + VERSION + '] would POST createAsset (RE) →', payload);
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
        var j; try { j = JSON.parse(body); } catch (e) { j = null; }
        if (!j || j.ok !== true) {
          console.warn('[ASF v' + VERSION + '] createAsset (RE) unexpected response:', body);
          throw new Error('Scenario 104 did not confirm createAsset — see console. Check the scenario\'s execution history in Make.com.');
        }
        var newId = j.itemId || j.itemId || j.reItemId || null;
        S.saving = false;
        toast('Real estate listing created', 'success');
        if (newId) {
          S.article.id = newId;
          S.article.status = 'Draft';
        }
        S.dirtyFields = {};
        S.dirtySections = {};
        snapshotOriginals();
        render();
        // v1.3.4: close ASF on create-success; error path keeps it open.
        setTimeout(publicClose, 350);
      })
      .catch(function (err) {
        S.saving = false;
        setSaveButtonState('idle');
        warn('createAsset (RE) failed', err);
        toast(err && err.message ? err.message : 'Create failed', 'error');
      });
  }

  // ═══════════════════════════════════════════════════════════════
  //  v1.2.1 — EVENT (EV) VARIANT
  //  Event create form. Reuses the shared shell, sidebar MEDIA picker
  //  ('main' for Event Image, 'og' for Event Flyer), Uploadcare
  //  upload, field primitives, dirty tracking, and commit plumbing.
  //  A separate lightweight Trix instance backs the rich-text
  //  Event Description (does not touch the Article body Trix).
  // ═══════════════════════════════════════════════════════════════

  // EV field bag. Reuses the generic mainImage* keys for the Event
  // Image (hero) and the ogImage* keys for the Event Flyer, so the
  // existing 'main'/'og' picker modes work without new plumbing.
  function blankEV() {
    var cfg = window.TA_CONFIG || {};
    return {
      id:                 null,
      assetType:          'event',
      // TA / title (auto, from config)
      taItemId:           cfg.taItemId       || '',
      titleAdminName:     cfg.titleAdminName || '',
      titleId:            cfg.titleId        || '',
      titleName:          cfg.titleName      || cfg.titleSlug || '',
      titleSlug:          cfg.titleSlug      || '',
      // Event identity
      eventName:          '',
      eventDescription:   '',     // rich text (HTML) via lightweight Trix
      eventLocation:           '',  // labeled "Venue Name" in the UI (v1.3.7)
      eventVenueRoom:          '',  // v1.3.11 — room/suite within venue
      eventVenueStreetAddress: '',  // v1.3.11 — street line only
      eventVenueCity:          '',  // v1.3.11
      eventVenueState:         '',  // v1.3.11 — 2-letter US abbrev
      eventVenueZip:           '',  // v1.3.11 — 5-digit US ZIP
      eventStartDate:     '',
      eventEndDate:       '',
      eventStartTime:     '',
      eventEndTime:       '',
      eventRedirectLink:  '',
      // Event Image (hero) — reuses generic main-image keys
      mainImageSrc:       '',
      mainImageMediaId:   '',
      mainImageAlt:       '',
      // Social / OG image (promo) — uses generic og-image keys
      ogImageSrc:         '',
      ogImageMediaId:     '',
      // Refs
      customerId:         '',
      customerName:       '',     // sponsor (optional)
      newsletterId:       '',
      newsletterName:     '',
      newsletterDate:     '',
      revenueType:        '',
      // Lifecycle
      availabilityStatus: 'Available',   // Available | Used
      status:             'Draft',
      created:            '',
      updated:            ''
    };
  }

  // Lightweight Trix for the Event Description. Distinct ids/classes
  // from the Article body editor so the two never collide. NO image
  // toolbar buttons (plain rich text — bold / italic / lists / links).
  function renderEventDescription() {
    var v          = (S.article && S.article.eventDescription) || '';
    var descDirty  = isDirtyKey('eventDescription');
    var hiddenId   = 'asf-ev-desc-input';   // stable id; re-render replaces it

    // Mirror renderMainBody: EV never calls that path, so if Trix
    // isn't loaded yet we must trigger the CDN load HERE (it re-renders
    // on resolve, flipping this textarea to the real editor) — otherwise
    // opening EV first would leave the description editor inert.
    if (!isTrixAvailable()) {
      ensureTrixLoaded();
      return '' +
        '<div class="asf-field asf-body-field" style="margin-top:8px;">' +
          '<div class="asf-field-label-row">' +
            '<label class="asf-field-label">Event description <span class="req">*</span>' + autoFilledTag('eventDescription') +
              (descDirty ? ' <span class="asf-body-dirty-dot" title="Unsaved changes"></span>' : '') +
            '</label>' +
          '</div>' +
          '<textarea class="asf-textarea' + (descDirty ? ' dirty' : '') + '"' +
            ' data-asf-field="eventDescription" rows="5"' +
            ' placeholder="Describe the event — what, when, who it\u2019s for\u2026">' +
            esc(v) +
          '</textarea>' +
        '</div>';
    }

    var hasBody    = !!v.replace(/<[^>]+>/g, '').trim();

    return '' +
      '<div class="asf-field asf-body-field" style="margin-top:8px;">' +
        '<div class="asf-field-label-row">' +
          '<label class="asf-field-label">Event description <span class="req">*</span>' + autoFilledTag('eventDescription') +
            (descDirty ? ' <span class="asf-body-dirty-dot" title="Unsaved changes"></span>' : '') +
          '</label>' +
        '</div>' +
        '<div class="asf-trix-wrap asf-ev-desc-wrap' + (descDirty ? ' dirty' : '') + '"' +
             ' data-asf-trix-mount="true">' +
          '<input type="hidden" id="' + hiddenId + '" value="' + esc(v) + '">' +
          '<trix-toolbar id="asf-ev-desc-toolbar"></trix-toolbar>' +
          '<trix-editor input="' + hiddenId + '"' +
            ' toolbar="asf-ev-desc-toolbar"' +
            ' class="asf-trix-editor asf-ev-desc-editor"' +
            ' placeholder="' +
              (hasBody ? '' : 'Describe the event — what, when, who it\u2019s for\u2026') +
            '"></trix-editor>' +
        '</div>' +
      '</div>';
  }

  // Wired in render() post-hook (alongside initInlineTrix). No-op
  // unless the EV description editor is in the DOM (i.e. EV mode).
  function initEventTrix() {
    var ed = qs(S.overlay, 'trix-editor.asf-ev-desc-editor');
    if (!ed) return;                 // not in EV mode
    if (ed._asfEvBound) return;      // safety net
    ed._asfEvBound = true;
    ed.addEventListener('trix-change', onEventDescChange);
    ed.addEventListener('trix-blur',   onEventDescChange);
    // No customizeTrixToolbar — EV description has no image insertion.
    // Drop Trix's native file-tools group so the (unused) attach
    // affordance doesn't appear.
    var stripFileTools = function () {
      var tb = qs(S.overlay, '#asf-ev-desc-toolbar');
      if (!tb) return;
      var ft = tb.querySelector('.trix-button-group--file-tools');
      if (ft) ft.remove();
    };
    ed.addEventListener('trix-initialize', stripFileTools);
    setTimeout(stripFileTools, 0);
  }

  function onEventDescChange(e) {
    var el = e && e.target;
    if (!el) return;
    var html = el.innerHTML || '';
    if (!S.article) S.article = {};
    var orig = (S.originalValues && 'eventDescription' in S.originalValues)
      ? (S.originalValues.eventDescription || '')
      : '';
    S.article.eventDescription = html;
    if (html === orig) {
      if (S.dirtyFields) delete S.dirtyFields.eventDescription;
    } else {
      if (!S.dirtyFields) S.dirtyFields = {};
      S.dirtyFields.eventDescription = { from: orig, to: html };
    }
    deriveDirtySections();
    refreshFooter();
    refreshDirtyStamp();
  }

  // Two image zones — Event Image (hero, 'main' mode) + Social / OG
  // image ('og' mode, real OG/social-promo image). Modeled on
  // renderREImageZone. v1.2.2 — second zone is a genuine OG image
  // (not a flyer): keys, payload, and label all agree.
  function renderEVImageZones() {
    var a       = S.article || {};
    var hasHero = !!a.mainImageSrc;
    var hasOg   = !!a.ogImageSrc;

    function zone(opts) {
      var url = opts.url || '';
      var card;
      if (url) {
        card =
          '<div class="asf-mainog-card has-image">' +
            '<div class="asf-mainog-img"' +
                 ' style="background-image:url(' + esc(mainImageDisplayUrl(url)) + ');"' +
                 ' data-asf-action="' + esc(opts.previewAction) + '" title="Click to preview full size"></div>' +
            '<div class="asf-mainog-actions">' +
              '<button type="button" class="asf-mainog-act" data-asf-action="' + esc(opts.replaceAction) + '">Replace</button>' +
            '</div>' +
          '</div>';
      } else {
        card =
          '<div class="asf-mainog-card empty"' +
               ' data-asf-action="' + esc(opts.attachAction) + '" title="Click to attach from MEDIA library">' +
            '<div class="asf-mainog-empty-icon">' + opts.icon + '</div>' +
            '<div class="asf-mainog-empty-prompt">' + esc(opts.prompt) + '</div>' +
            '<div class="asf-mainog-empty-sub">' + esc(opts.sub) + '</div>' +
          '</div>';
      }
      return '' +
        '<div class="asf-mainog-zone">' +
          '<div class="asf-mainog-head">' +
            '<span class="asf-mainog-title">' + esc(opts.title) + '</span>' +
            (url ? '<span class="asf-mainog-badge">attached</span>' : '') +
          '</div>' +
          card +
          (opts.secondary || '') +
        '</div>';
    }

    // "Use event image as OG" — one-click promote the hero into the
    // OG slot (set-og-from-main copies mainImage* → ogImage*). Shown
    // only when a hero exists and no dedicated OG is set yet.
    var ogSecondary = (hasHero && !hasOg)
      ? '<div class="asf-mainog-secondary">' +
          '<button type="button" class="asf-mainog-secondary-btn primary"' +
            ' data-asf-action="set-og-from-main">Use event image →</button>' +
        '</div>'
      : '';

    return '' +
      '<div class="asf-ev-images">' +
        zone({
          title: 'Event image', url: a.mainImageSrc, icon: '\uD83D\uDDBC',
          prompt: 'Click to attach event image', sub: 'hero · top of listing',
          attachAction: 'attach-main-from-media',
          replaceAction: 'replace-main-image',
          previewAction: 'preview-main-image'
        }) +
        zone({
          title: 'Social / OG image', url: a.ogImageSrc, icon: '\uD83D\uDD17',
          prompt: 'Click to attach social image', sub: 'promo · 2400×1260 share card',
          attachAction: 'attach-og-from-media',
          replaceAction: 'attach-og-from-media',
          previewAction: 'attach-og-from-media',
          secondary: ogSecondary
        }) +
      '</div>';
  }

  // v1.3.8 — small per-field tag marking a Claude-populated value.
  function autoFilledTag(field) {
    return (field && S.autoFill && S.autoFill.fields && S.autoFill.fields[field])
      ? ' <span class="asf-autofill-tag">auto-filled</span>' : '';
  }

  // v1.3.8 — URL bar at the top of the Create Event form.
  function renderEventUrlBar() {
    if (S.mode !== 'create' || S.assetType !== 'event') return '';
    var af = S.autoFill || {};
    var loading = !!af.loading;
    var status = '';
    if (loading) {
      status = '<div class="asf-urlfetch-status"><span class="asf-spin"></span>Reading page\u2026</div>';
    } else if (af.error) {
      status = '<div class="asf-urlfetch-status err">' + esc(af.error) + '</div>';
    } else if (af.done) {
      status = '<div class="asf-urlfetch-status ok">\u2713 Filled ' + (af.count || 0) +
               ' field' + ((af.count === 1) ? '' : 's') +
               (af.sourceHost ? (' from ' + esc(af.sourceHost)) : '') +
               ' \u2014 review and edit, then Save. Nothing is submitted yet.</div>';
    }
    return '' +
      '<div class="asf-urlfetch">' +
        '<div class="asf-urlfetch-head">Auto-fill from event page</div>' +
        '<div class="asf-urlfetch-row">' +
          '<input type="text" id="asf-autofill-url-input" class="asf-input asf-urlfetch-input"' +
            ' value="' + esc(af.url || '') + '" placeholder="Paste an event page URL\u2026"' +
            (loading ? ' disabled' : '') + '>' +
          '<button type="button" class="asf-urlfetch-btn" data-asf-action="event-url-fetch"' +
            (loading ? ' disabled' : '') + '>' +
            (loading ? 'Reading\u2026' : 'Fetch &amp; fill') +
          '</button>' +
        '</div>' +
        status +
      '</div>';
  }

  // v1.3.8 — preview tile for the image grabbed off the page.
  function renderEventFoundImage() {
    var af = S.autoFill || {};
    var imgs = af.images || [];
    if (!imgs.length) return '';
    var sel = af.image || imgs[0];
    var thumbs = imgs.map(function (u) {
      var on = (u === sel);
      return '<button type="button" class="asf-img-thumb' + (on ? ' selected' : '') + '"' +
        ' data-asf-action="event-pick-image" data-asf-image="' + esc(u) + '" title="' + esc(u) + '">' +
        '<img src="' + esc(u) + '" alt="" loading="lazy">' +
        (on ? '<span class="asf-img-check">\u2713</span>' : '') +
        '</button>';
    }).join('');
    return '' +
      '<div class="asf-found-image">' +
        '<div class="asf-found-image-head">Found ' + imgs.length + ' image' + (imgs.length === 1 ? '' : 's') +
          ' on the page \u2014 pick the event image</div>' +
        '<div class="asf-img-grid">' + thumbs + '</div>' +
        '<div class="asf-found-image-sel">' +
          '<div class="asf-found-image-url">' + esc(sel) + '</div>' +
          '<button type="button" class="asf-mini-btn primary" data-asf-action="event-condition-image"' +
            (af.conditioning ? ' disabled' : '') + '>' +
            (af.conditioning ? '<span class="asf-spin"></span> Conditioning\u2026' : 'Condition &amp; use as event image') +
          '</button>' +
          '<div class="asf-found-image-note">Pulls the selected image into Uploadcare and sets it as the event hero + social image.</div>' +
        '</div>' +
      '</div>';
  }

  // v1.3.10 — POST the picked image URL to the Scenario B remote-URL
  // route; on success set it as Main + OG and clear the candidate grid.
  function conditionEventImage() {
    if (!S.autoFill) S.autoFill = {};
    var url = S.autoFill.image;
    if (!url) { toast('Pick an image first', 'info'); return; }
    var endpoint = CFG.tenant.makeConditioner();
    if (!endpoint) { toast('makeConditioner URL not configured in TA_CONFIG', 'error'); return; }

    S.autoFill.conditioning = true;
    render();

    var fname = ((S.article && S.article.eventName) ? S.article.eventName : 'event') + ' image';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        remoteImageUrl:    url,
        fileName:          fname,
        taItemId:          CFG.tenant.taItemId(),
        componentRole:     'main-image',
        componentRoleHash: CFG.tenant.roleHash('mainImage')
      })
    })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        if (!j || (j.success !== true && j.ok !== true) || !j.mediaItemId) {
          throw new Error((j && j.error) || 'No MEDIA returned');
        }
        var media = { mediaId: j.mediaItemId, imageUrl: j.uploadcareUrl || '', name: fname };
        setMainImageFromMedia(media);
        // v1.3.12: event uses ONE image; previously also wrote og as a
        // dual-write for parity with the old payload. Payload no longer
        // carries og keys for events, so this is now a single set.
        S.autoFill.images = [];
        S.autoFill.image = null;
        S.autoFill.conditioning = false;
        render();
        toast('Event image conditioned & set', 'success');
      })
      .catch(function (err) {
        S.autoFill.conditioning = false;
        warn('condition event image failed', err);
        render();
        toast('Conditioning failed \u2014 ' + (err && err.message ? err.message : 'unknown error'), 'error');
      });
  }

  // v1.3.8 — POST the URL to the extract-event worker, prefill the form.
  function fetchEventFromUrl() {
    if (!S.autoFill) S.autoFill = { url:'', loading:false, done:false, count:0, image:null, fields:{} };
    var input = qs(S.overlay, '#asf-autofill-url-input');
    var url = input ? String(input.value || '').trim() : '';
    if (!url) { toast('Paste an event page URL first', 'info'); return; }
    if (!/^https?:\/\//i.test(url)) { toast('URL must start with http:// or https://', 'error'); return; }
    var endpoint = CFG.tenant.makeExtractEvent();
    if (!endpoint) { toast('makeExtractEvent URL not configured in TA_CONFIG', 'error'); return; }

    S.autoFill.url = url;
    S.autoFill.loading = true;
    S.autoFill.error = '';
    render();

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url })
    })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        if (!j || j.ok !== true || !j.fields) throw new Error((j && j.error) || 'No event data returned');
        var f = j.fields;
        var keys = ['eventName','eventDescription','eventLocation',
                    'eventVenueRoom','eventVenueStreetAddress','eventVenueCity',
                    'eventVenueState','eventVenueZip',
                    'eventStartDate','eventStartTime','eventEndDate','eventEndTime',
                    'eventRedirectLink'];
        if (!S.article) S.article = {};
        S.autoFill.fields = {};
        var n = 0;
        keys.forEach(function (k) {
          var val = f[k];
          if (val != null && String(val).trim() !== '') {
            S.article[k] = String(val);
            S.autoFill.fields[k] = true;
            n++;
          }
        });
        var imgs = Array.isArray(j.images) ? j.images.filter(function (x) { return /^https?:\/\//i.test(x); }) : [];
        if (!imgs.length && j.imageUrl && /^https?:\/\//i.test(j.imageUrl)) imgs = [j.imageUrl];
        S.autoFill.images  = imgs;
        S.autoFill.image   = imgs[0] || null;
        S.autoFill.count   = n;
        S.autoFill.done    = true;
        S.autoFill.loading = false;
        try { S.autoFill.sourceHost = new URL(url).hostname.replace(/^www\./, ''); }
        catch (e) { S.autoFill.sourceHost = ''; }
        render();
        toast('Filled ' + n + ' field' + (n === 1 ? '' : 's') + ' \u2014 review before saving', 'success');
      })
      .catch(function (err) {
        S.autoFill.loading = false;
        S.autoFill.error = 'Could not read that page \u2014 ' + (err && err.message ? err.message : 'unknown error');
        warn('extract-event failed', err);
        render();
        toast('Auto-fill failed \u2014 ' + (err && err.message ? err.message : 'unknown error'), 'error');
      });
  }

  // EV main column — event identity + description + schedule + images.
  function renderEVMain() {
    return '' +
      renderEventUrlBar() +
      '<div class="asf-re-headline">' +
        renderField({
          label: 'Event name', field: 'eventName', req: true,
          value: curValRead('eventName'),
          placeholder: 'e.g. Summer Street Fair'
        }) +
      '</div>' +

      renderEventDescription() +

      '<div class="asf-ev-grid-2-1">' +
        renderField({
          label: 'Venue Name', field: 'eventLocation', req: true,
          value: curValRead('eventLocation'),
          placeholder: 'e.g. Memorial Hall'
        }) +
        renderField({
          label: 'Venue Room', field: 'eventVenueRoom',
          value: curValRead('eventVenueRoom'),
          placeholder: 'e.g. Banquet Room A'
        }) +
      '</div>' +
      renderField({
        label: 'Venue Street Address', field: 'eventVenueStreetAddress',
        value: curValRead('eventVenueStreetAddress'),
        placeholder: 'e.g. 12 Main St'
      }) +
      '<div class="asf-ev-grid-2-1-1">' +
        renderField({
          label: 'Venue City', field: 'eventVenueCity',
          value: curValRead('eventVenueCity'),
          placeholder: 'e.g. Wyckoff'
        }) +
        renderField({
          label: 'State', field: 'eventVenueState', mono: true,
          value: curValRead('eventVenueState'),
          placeholder: 'NJ'
        }) +
        renderField({
          label: 'ZIP', field: 'eventVenueZip', mono: true,
          value: curValRead('eventVenueZip'),
          placeholder: '07481'
        }) +
      '</div>' +
      renderField({
        label: 'Redirect link', field: 'eventRedirectLink', mono: true,
        value: curValRead('eventRedirectLink'),
        placeholder: 'https:// tickets or info page'
      }) +

      '<div class="asf-ev-datetime-grid">' +
        renderField({
          label: 'Start date', field: 'eventStartDate', req: true, type: 'date',
          value: curValRead('eventStartDate')
        }) +
        renderField({
          label: 'Start time', field: 'eventStartTime', type: 'time',
          value: curValRead('eventStartTime')
        }) +
        renderField({
          label: 'End date', field: 'eventEndDate', type: 'date',
          value: curValRead('eventEndDate')
        }) +
        renderField({
          label: 'End time', field: 'eventEndTime', type: 'time',
          value: curValRead('eventEndTime')
        }) +
      '</div>' +

      renderEventFoundImage() +
      renderEVImageZones();
  }

  // EV sidebar — sponsor (optional) ref, scheduling, availability,
  // identifiers, status line.
  function renderEVSide() {
    var availOpts = [
      { value: 'Available', label: 'Available' },
      { value: 'Used',      label: 'Used' }
    ];
    var a = S.article || {};

    var refsInner =
      renderUnlockedRef('Customer (sponsor · optional)', a.customerName, 'customer');

    var scheduleInner =
      '<div class="asf-field">' +
        '<label class="asf-field-label">Tentative newsletter</label>' +
        renderSideNewsletterSelect() +
      '</div>';

    var availInner = renderSelect({
      label: 'Availability status', field: 'availabilityStatus',
      value: curValRead('availabilityStatus'), options: availOpts
    });

    return '' +
      renderSideSection('references',  'Customer',     refsInner) +
      renderSideSection('scheduling',  'Scheduling',   scheduleInner) +
      renderSideSection('availability','Availability', availInner) +
      renderSideSection('identifiers', 'Identifiers',  renderSideS6Identifiers()) +
      renderEVStatusLine();
  }

  function renderEVStatusLine() {
    var a = S.article || {};
    return '' +
      '<div class="asf-statusline">' +
        '<span class="asf-statusline-dot"></span>' +
        '<span class="asf-statusline-text">Event · ' +
          esc(a.status || 'Draft') + '</span>' +
      '</div>';
  }

  // EV create commit → Scenario 104 (assetType:'event'). Sends the
  // hero via mainImage* and the social/promo image via ogImage*
  // (OG-semantic) — Scenario 104's event route maps both to the
  // EVENTS hero + OG fields.
  function commitCreateEV() {
    if (S.saving) return;

    if (!curVal('eventName') || !String(curVal('eventName')).trim()) {
      toast('Event name is required to create an event', 'error');
      return;
    }
    if (!curVal('eventLocation') || !String(curVal('eventLocation')).trim()) {
      toast('Venue name is required', 'error');
      return;
    }
    if (!curVal('eventStartDate')) {
      toast('Start date is required', 'error');
      return;
    }

    var url = CFG.tenant.makeCreateAssets();
    var a   = S.article || {};

    var payload = {
      action:    'createAsset',
      assetType: 'event',
      titleSlug: CFG.tenant.titleSlug(),
      taItemId:  CFG.tenant.taItemId(),
      source:    'asf-v' + VERSION,
      fields: {
        eventName:          curVal('eventName'),
        eventDescription:   a.eventDescription || '',
        eventLocation:           curVal('eventLocation'),
        eventVenueRoom:          curVal('eventVenueRoom'),
        eventVenueStreetAddress: curVal('eventVenueStreetAddress'),
        eventVenueCity:          curVal('eventVenueCity'),
        eventVenueState:         curVal('eventVenueState'),
        eventVenueZip:           curVal('eventVenueZip'),
        eventStartDate:     curVal('eventStartDate'),
        eventEndDate:       curVal('eventEndDate'),
        eventStartTime:     curVal('eventStartTime'),
        eventEndTime:       curVal('eventEndTime'),
        eventRedirectLink:  curVal('eventRedirectLink'),
        availabilityStatus: curVal('availabilityStatus') || 'Available',
        // Event image (hero) — v1.3.12 semantic keys; read from generic
        // internal state (S.article.mainImage*) where the picker writes.
        eventImageMediaId:  a.mainImageMediaId || '',
        eventImageSrc:      a.mainImageSrc     || '',
        eventImageAlt:      curVal('mainImageAlt') || '',
        // Refs
        customerId:         a.customerId   || '',
        customerName:       a.customerName || '',
        newsletterId:       a.newsletterId   || '',
        newsletterName:     a.newsletterName || '',
        newsletterDate:     a.newsletterDate || '',
        revenueType:        a.revenueType || ''
      }
    };
    log('createAsset payload · event', payload);

    if (!url) {
      toast('Create Assets endpoint not configured — add TA_CONFIG.makeCreateAssets', 'error');
      console.log('[ASF v' + VERSION + '] would POST createAsset (EV) →', payload);
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
        var j; try { j = JSON.parse(body); } catch (e) { j = null; }
        if (!j || j.ok !== true) {
          console.warn('[ASF v' + VERSION + '] createAsset (EV) unexpected response:', body);
          throw new Error('Scenario 104 did not confirm createAsset — see console. Check the scenario\'s execution history in Make.com.');
        }
        var newId = j.itemId || j.eventItemId || null;
        S.saving = false;
        toast('Event created', 'success');
        if (newId) {
          S.article.id = newId;
          S.article.status = 'Draft';
        }
        S.dirtyFields = {};
        S.dirtySections = {};
        snapshotOriginals();
        render();
        // v1.3.4: close ASF on create-success; error path keeps it open.
        setTimeout(publicClose, 350);
      })
      .catch(function (err) {
        S.saving = false;
        setSaveButtonState('idle');
        warn('createAsset (EV) failed', err);
        toast(err && err.message ? err.message : 'Create failed', 'error');
      });
  }

  // ═══════════════════════════════════════════════════════════════
  //  v1.2.3 — AD (ADS) VARIANT
  //  Advertiser's standing creative library — one record, four
  //  optional formats: Banner, Sidebar, The Find (Curated Text Ad),
  //  and Local Business Profile. Create-only (Phase-5 upsert/archive/
  //  status deferred). Reuses the shared shell, sidebar MEDIA picker
  //  ('main' = Banner image, 'og' = Sidebar image), Uploadcare upload,
  //  field primitives, dirty tracking, and commit plumbing. A separate
  //  lightweight Trix (asf-lbp-rich-*) backs LBP Rich Text — mirrors
  //  the EV description editor; never touches the Article body Trix.
  //
  //  The Local Business Profile lives on the CUSTOMER record (tagline,
  //  address, contact, socials, services, logo, status). The ad carries
  //  only the three creative fields (lbp-photo-link / lbp-teaser-text /
  //  lbp-rich-text). Redirect for every section defaults to the
  //  Customer's Business Website; each section link overrides it.
  //  Per-section product derived by section type (HC-AD-1).
  // ═══════════════════════════════════════════════════════════════

  // Ad field bag. Banner image reuses generic main-image keys ('main'
  // picker mode); Sidebar image reuses og-image keys ('og' picker
  // mode) — same two-zone plumbing as EV.
  // ── Customer → Ad form prefill (v1.2.5) ────────────────────────
  // Authoritative key map from the .customers-wrapper dataset bindings
  // (Webflow Designer, confirmed 2026-05). Hyphenated source keys
  // (txa-1..6, address-2) are real dataset keys → bracket access.
  // Targets are display-only fields on S.article — the Local Business
  // Profile lives on the Customer record and is NOT written back by the
  // ad. customerWebsite additionally drives the per-section redirect
  // default.
  var CUSTOMER_PREFILL_MAP = {
    customerWebsite:        'website',
    customerTagline:        'tagline',
    customerLongDesc:       'longDescription',
    customerAddress:        'address',
    customerAddress2:       'address-2',
    customerCityStZip:      'cityStZip',
    customerNeighborhood:   'neighborhood',
    customerPhone:          'phone',
    customerEmail:          'email',
    customerServices:       'services',
    customerLogoInitials:   'logoInitials',
    customerLogoLink:       'logoLink',
    customerShortCode:      'shortCode',
    customerType:           'customerType',
    customerClientStatus:   'clientStatus',
    customerProfileStatus:  'profileStatus',
    customerTxa1:           'txa-1',
    customerTxa2:           'txa-2',
    customerTxa3:           'txa-3',
    customerTxa4:           'txa-4',
    customerTxa5:           'txa-5',
    customerTxa6:           'txa-6',
    customerFacebook:       'facebook',
    customerInstagram:      'instagram',
    customerTiktok:         'tiktok',
    customerYoutube:        'youtube',
    customerXTwitter:       'xTwitter',
    customerPinterest:      'pinterest',
    customerLinkedin:       'linkedin',
    customerHouzz:          'houzz',
    customerDefaultArtAdGet:  'paidAdUrl',
    customerDefaultSponsorAd: 'sponsorshipAd'
  };

  // Copy every mapped Customer field from the picked item's dataset
  // (item.raw, the DOMStringMap) onto S.article for read-only display.
  // Overwrites on re-pick so the form always reflects the current
  // advertiser. Ad name is locked to the customer name.
  function prefillAdFromCustomer(item) {
    var raw = (item && item.raw) || {};
    for (var target in CUSTOMER_PREFILL_MAP) {
      if (!CUSTOMER_PREFILL_MAP.hasOwnProperty(target)) continue;
      var val = raw[CUSTOMER_PREFILL_MAP[target]];
      S.article[target] = (val == null ? '' : String(val)).trim();
    }
    var cn = (item && item.name) || S.article.customerName || '';
    S.article.adName = cn ? (cn + ' (Ads)') : '';
  }

  function blankADS() {
    var cfg = window.TA_CONFIG || {};
    return {
      id:                 null,
      assetType:          'ad',
      // TA / title (auto, from config)
      taItemId:           cfg.taItemId       || '',
      titleAdminName:     cfg.titleAdminName || '',
      titleId:            cfg.titleId        || '',
      titleName:          cfg.titleName      || cfg.titleSlug || '',
      titleSlug:          cfg.titleSlug      || '',
      // Ad name — typed; convention = the customer name (auto-filled on pick)
      adName:             '',
      // Advertiser (Customer) — required ref
      customerId:         '',
      customerName:       '',
      // Customer-sourced read-only profile (the Local Business Profile).
      // Hydrated on customer pick (v1.2.5) from the .customers-wrapper
      // dataset; display-only — these live on the Customer record and are
      // NOT written back by the ad. customerWebsite also drives the
      // redirect default for every section.
      customerWebsite:        '',
      customerTagline:        '',
      customerLongDesc:       '',
      customerAddress:        '',
      customerAddress2:       '',
      customerCityStZip:      '',
      customerNeighborhood:   '',
      customerPhone:          '',
      customerEmail:          '',
      customerServices:       '',
      customerLogoInitials:   '',
      customerLogoLink:       '',
      customerShortCode:      '',
      customerType:           '',
      customerClientStatus:   '',
      customerProfileStatus:  '',
      customerTxa1:           '',
      customerTxa2:           '',
      customerTxa3:           '',
      customerTxa4:           '',
      customerTxa5:           '',
      customerTxa6:           '',
      customerFacebook:       '',
      customerInstagram:      '',
      customerTiktok:         '',
      customerYoutube:        '',
      customerXTwitter:       '',
      customerPinterest:      '',
      customerLinkedin:       '',
      customerHouzz:          '',
      customerDefaultArtAdGet:  '',
      customerDefaultSponsorAd: '',
      // Banner Ad — generic main-image keys ('main' picker mode)
      mainImageSrc:       '',
      mainImageMediaId:   '',
      mainImageAlt:       '',
      bannerAdLink:       '',     // banner-ad-link-get (override)
      // Sidebar Ad — generic og-image keys ('og' picker mode)
      ogImageSrc:         '',
      ogImageMediaId:     '',
      sidebarAdLink:      '',     // sidebar-ad-link-get (override)
      // Splash Ad — dedicated keys ('splash' picker mode) — v1.3.12
      splashImageSrc:     '',
      splashImageMediaId: '',
      splashImageAlt:     '',
      splashAdLink:       '',     // splash-ad-link-get (override)
      // The Find — Curated Text Ad
      textAdTitle:        '',     // text-ad-title
      textAdText:         '',     // text-ad-text
      // Local Business Profile — ad-specific creative (profile on Customer)
      lbpPhotoLink:       '',     // lbp-photo-link
      lbpTeaserText:      '',     // lbp-teaser-text
      lbpRichText:        '',     // lbp-rich-text (HTML via lightweight Trix)
      // Single redirect (redirect-link-go) — The Find / LBP click target
      redirectLink:       '',
      // Lifecycle
      availabilityStatus: 'Available',
      status:             'Draft',
      created:            '',
      updated:            ''
    };
  }

  // Lightweight Trix for LBP Rich Text. Distinct ids/classes from both
  // the Article body editor and the EV description editor so none
  // collide. No image toolbar. Mirrors renderEventDescription.
  function renderLbpRichText() {
    var v        = (S.article && S.article.lbpRichText) || '';
    var rtDirty  = isDirtyKey('lbpRichText');
    var hiddenId = 'asf-lbp-rich-input';

    if (!isTrixAvailable()) {
      ensureTrixLoaded();
      return '' +
        '<div class="asf-field asf-body-field" style="margin-top:8px;">' +
          '<div class="asf-field-label-row">' +
            '<label class="asf-field-label">LBP rich text' +
              (rtDirty ? ' <span class="asf-body-dirty-dot" title="Unsaved changes"></span>' : '') +
            '</label>' +
          '</div>' +
          '<textarea class="asf-textarea' + (rtDirty ? ' dirty' : '') + '"' +
            ' data-asf-field="lbpRichText" rows="4"' +
            ' placeholder="Ad-specific profile copy\u2026">' +
            esc(v) +
          '</textarea>' +
        '</div>';
    }

    var hasBody = !!v.replace(/<[^>]+>/g, '').trim();
    return '' +
      '<div class="asf-field asf-body-field" style="margin-top:8px;">' +
        '<div class="asf-field-label-row">' +
          '<label class="asf-field-label">LBP rich text' +
            (rtDirty ? ' <span class="asf-body-dirty-dot" title="Unsaved changes"></span>' : '') +
          '</label>' +
        '</div>' +
        '<div class="asf-trix-wrap asf-lbp-rich-wrap' + (rtDirty ? ' dirty' : '') + '"' +
             ' data-asf-trix-mount="true">' +
          '<input type="hidden" id="' + hiddenId + '" value="' + esc(v) + '">' +
          '<trix-toolbar id="asf-lbp-rich-toolbar"></trix-toolbar>' +
          '<trix-editor input="' + hiddenId + '"' +
            ' toolbar="asf-lbp-rich-toolbar"' +
            ' class="asf-trix-editor asf-lbp-rich-editor"' +
            ' placeholder="' + (hasBody ? '' : 'Ad-specific profile copy\u2026') + '"></trix-editor>' +
        '</div>' +
      '</div>';
  }

  function initLbpTrix() {
    var ed = qs(S.overlay, 'trix-editor.asf-lbp-rich-editor');
    if (!ed) return;                 // not in AD mode
    if (ed._asfLbpBound) return;     // safety net
    ed._asfLbpBound = true;
    ed.addEventListener('trix-change', onLbpRichChange);
    ed.addEventListener('trix-blur',   onLbpRichChange);
    var stripFileTools = function () {
      var tb = qs(S.overlay, '#asf-lbp-rich-toolbar');
      if (!tb) return;
      var ft = tb.querySelector('.trix-button-group--file-tools');
      if (ft) ft.remove();
    };
    ed.addEventListener('trix-initialize', stripFileTools);
    setTimeout(stripFileTools, 0);
  }

  function onLbpRichChange(e) {
    var el = e && e.target;
    if (!el) return;
    var html = el.innerHTML || '';
    if (!S.article) S.article = {};
    var orig = (S.originalValues && 'lbpRichText' in S.originalValues)
      ? (S.originalValues.lbpRichText || '')
      : '';
    S.article.lbpRichText = html;
    if (html === orig) {
      if (S.dirtyFields) delete S.dirtyFields.lbpRichText;
    } else {
      if (!S.dirtyFields) S.dirtyFields = {};
      S.dirtyFields.lbpRichText = { from: orig, to: html };
    }
    deriveDirtySections();
    refreshFooter();
    refreshDirtyStamp();
  }

  // One ad image zone (Banner 'main' / Sidebar 'og'). Modeled on the
  // EV image zone; takes a pre-rendered link field appended below.
  function renderADSImageZone(opts) {
    var url = opts.url || '';
    var card;
    if (url) {
      card =
        '<div class="asf-mainog-card has-image">' +
          '<div class="asf-mainog-img"' +
               ' style="background-image:url(' + esc(mainImageDisplayUrl(url)) + ');"' +
               ' data-asf-action="' + esc(opts.previewAction) + '" title="Click to preview full size"></div>' +
          '<div class="asf-mainog-actions">' +
            '<button type="button" class="asf-mainog-act" data-asf-action="' + esc(opts.replaceAction) + '">Replace</button>' +
          '</div>' +
        '</div>';
    } else {
      card =
        '<div class="asf-mainog-card empty"' +
             ' data-asf-action="' + esc(opts.attachAction) + '" title="Click to attach from MEDIA library">' +
          '<div class="asf-mainog-empty-icon">\uD83D\uDDBC</div>' +
          '<div class="asf-mainog-empty-prompt">' + esc(opts.prompt) + '</div>' +
          '<div class="asf-mainog-empty-sub">' + esc(opts.sub) + '</div>' +
        '</div>';
    }
    return '' +
      '<div class="asf-mainog-zone">' +
        '<div class="asf-mainog-head">' +
          '<span class="asf-mainog-title">' + esc(opts.title) + '</span>' +
          '<span class="asf-mainog-badge">' + esc(opts.badge) + '</span>' +
          '<span class="asf-ads-prod">' + esc(opts.product) + '</span>' +
        '</div>' +
        card +
        (opts.linkField || '') +
      '</div>';
  }

  // Redirect-fallback hint appended under a link field.
  function adFallbackHint() {
    return '<div class="asf-fallback-hint">blank \u2192 <b>Customer \u00b7 Business Website</b></div>';
  }

  // AD main column — four optional creative sections + bottom reference.
  // Read-only Local Business Profile block (v1.2.5). Renders the
  // customer-sourced fields hydrated by prefillAdFromCustomer; shows
  // only rows that have a value. Empty before an advertiser is picked.
  function renderAdCustomerProfile() {
    var a = S.article || {};
    if (!a.customerId) {
      return '<div class="asf-ads-note">Pick an advertiser to load its Local Business Profile (read-only \u2014 lives on the Customer record).</div>';
    }
    var rows = [];
    function row(label, val, isUrl) {
      if (!val) return;
      rows.push(
        '<div class="asf-cust-prof-row">' +
          '<span class="asf-cust-prof-k">' + label + '</span>' +
          '<span class="asf-cust-prof-v' + (isUrl ? ' url' : '') + '">' + esc(val) + '</span>' +
        '</div>'
      );
    }
    if (a.customerLogoInitials) {
      rows.push('<div class="asf-cust-prof-logo">' + esc(a.customerLogoInitials) + '</div>');
    }
    row('Tagline', a.customerTagline);
    row('Description', a.customerLongDesc);
    var addr = [a.customerAddress, a.customerAddress2, a.customerCityStZip].filter(Boolean).join(', ');
    row('Address', addr);
    row('Neighborhood', a.customerNeighborhood);
    row('Phone', a.customerPhone);
    row('Email', a.customerEmail);
    row('Website', a.customerWebsite, true);
    row('Services', a.customerServices);
    var txa = [a.customerTxa1, a.customerTxa2, a.customerTxa3, a.customerTxa4, a.customerTxa5, a.customerTxa6]
      .filter(Boolean).join(' \u00b7 ');
    row('TXA services', txa);
    var soc = [];
    [['FB', a.customerFacebook], ['IG', a.customerInstagram], ['TikTok', a.customerTiktok],
     ['YouTube', a.customerYoutube], ['X', a.customerXTwitter], ['Pinterest', a.customerPinterest],
     ['LinkedIn', a.customerLinkedin], ['Houzz', a.customerHouzz]
    ].forEach(function (s) { if (s[1]) soc.push(s[0]); });
    row('Socials', soc.join(' \u00b7 '));
    row('Default Sponsorship Ad', a.customerDefaultSponsorAd, true);
    var meta = [];
    if (a.customerType)          meta.push(a.customerType);
    if (a.customerClientStatus)  meta.push(a.customerClientStatus);
    if (a.customerProfileStatus) meta.push(a.customerProfileStatus);
    row('Status', meta.join(' \u00b7 '));
    if (!rows.length) {
      return '<div class="asf-ads-note">Advertiser selected, but its profile fields are empty on the Customer record.</div>';
    }
    return '<div class="asf-cust-prof">' + rows.join('') + '</div>';
  }

  function renderADSMain() {
    var a = S.article || {};

    // 1 · Banner Ad
    var banner = renderADSImageZone({
      title: 'Banner Ad', badge: '700 \u00d7 200', product: 'product: Banner Ad',
      url: a.mainImageSrc,
      prompt: 'Click to attach the banner creative', sub: 'banner-ad-700x200',
      attachAction: 'attach-main-from-media',
      replaceAction: 'replace-main-image',
      previewAction: 'preview-main-image',
      linkField:
        renderField({
          label: 'Banner Ad Link \u2013 GET', field: 'bannerAdLink', mono: true,
          value: curValRead('bannerAdLink'),
          placeholder: 'leave blank to use the default destination'
        }) + adFallbackHint()
    });

    // 2 · Sidebar Ad
    var sidebar = renderADSImageZone({
      title: 'Sidebar Ad', badge: '480 \u00d7 400', product: 'product: Sidebar Ad (Website only)',
      url: a.ogImageSrc,
      prompt: 'Click to attach the sidebar creative', sub: 'sidebar-ad-480x400',
      attachAction: 'attach-og-from-media',
      replaceAction: 'attach-og-from-media',
      previewAction: 'attach-og-from-media',
      linkField:
        renderField({
          label: 'Sidebar Ad Link \u2013 GET', field: 'sidebarAdLink', mono: true,
          value: curValRead('sidebarAdLink'),
          placeholder: 'leave blank to use the default destination'
        }) + adFallbackHint()
    });

    // 3 · Splash Ad — v1.3.12
    var splash = renderADSImageZone({
      title: 'Splash Ad', badge: '700 \u00d7 700', product: 'product: Splash Ad',
      url: a.splashImageSrc,
      prompt: 'Click to attach the splash creative', sub: 'splash-ad-700x700',
      attachAction: 'attach-splash-from-media',
      replaceAction: 'attach-splash-from-media',
      previewAction: 'preview-splash-image',
      linkField:
        renderField({
          label: 'Splash Ad Link \u2013 GET', field: 'splashAdLink', mono: true,
          value: curValRead('splashAdLink'),
          placeholder: 'leave blank to use the default destination'
        }) + adFallbackHint()
    });

    // 4 · The Find — Curated Text Ad
    var theFind =
      '<div class="asf-ads-section">' +
        '<div class="asf-ads-section-head">' +
          '<span class="asf-mainog-title">The Find \u2014 Curated Text Ad</span>' +
          '<span class="asf-mainog-badge">TXA</span>' +
          '<span class="asf-ads-prod">product: The Find</span>' +
        '</div>' +
        renderField({
          label: 'Text Ad Title', field: 'textAdTitle',
          value: curValRead('textAdTitle'), placeholder: 'Headline for the text ad'
        }) +
        renderTextarea({
          label: 'Text Ad Text', field: 'textAdText',
          value: curValRead('textAdText'),
          placeholder: 'Body copy\u2026'
        }) +
        '<div class="asf-ads-note">Built from the Customer\u2019s TXA Services 1\u20136 (authored on the Customer record). The Find category is set at placement, not here.</div>' +
      '</div>';

    // 4 · Local Business Profile
    var custName = a.customerName || '';
    var lbp =
      '<div class="asf-ads-section">' +
        '<div class="asf-ads-section-head">' +
          '<span class="asf-mainog-title">Local Business Profile</span>' +
          '<span class="asf-mainog-badge">LBP</span>' +
          '<span class="asf-ads-prod">product: The Find | Local Business Profile</span>' +
        '</div>' +
        '<div class="asf-cust-profile-ref">' +
          '<div class="asf-cust-profile-ref-head">' +
            '<span class="asf-cust-profile-ref-name">' +
              (custName ? esc(custName) : 'No advertiser selected') +
            '</span>' +
            '<button type="button" class="asf-edit-cust" disabled title="Coming in a future session">' +
              'Edit Customer <span class="soon">soon</span>' +
            '</button>' +
          '</div>' +
          renderAdCustomerProfile() +
        '</div>' +
        renderField({
          label: 'LBP Photo Link', field: 'lbpPhotoLink', mono: true,
          value: curValRead('lbpPhotoLink'), placeholder: 'https:// photo URL'
        }) +
        renderField({
          label: 'LBP Teaser Text', field: 'lbpTeaserText',
          value: curValRead('lbpTeaserText'), placeholder: 'Short teaser line'
        }) +
        renderLbpRichText() +
      '</div>';

    // Bottom reference — Customer Default ART AD (GET = populates the
    // asset; may be outdated). Image preview needs Customer hydration
    // (future); shown as a labeled reference for now.
    var dfltArt = a.customerDefaultArtAdGet || '';
    var defaultArtAd =
      '<div class="asf-ads-refblock">' +
        '<div class="asf-ads-refblock-head">' +
          '<span>Default Art Ad \u2014 reference</span>' +
          '<span class="asf-ads-refblock-stale">may be outdated</span>' +
        '</div>' +
        '<div class="asf-readonly-line' + (dfltArt ? ' url' : ' empty') + '">' +
          (dfltArt ? esc(dfltArt) : 'from Customer record \u00b7 Default ART AD \u2013 GET') +
        '</div>' +
        '<div class="asf-ads-note">Customer \u00b7 <code>Default ART AD \u2013 GET</code> (ULC link) \u2014 the advertiser\u2019s standing default creative, used if no other ad exists. Read-only.</div>' +
      '</div>';

    var adNameVal = curValRead('adName');
    return '' +
      '<div class="asf-ad-name-head' + (adNameVal ? '' : ' empty') + '" title="Ad name is locked to the advertiser">' +
        (adNameVal ? esc(adNameVal) : '\u2014 pick an advertiser below \u2014') +
      '</div>' +
      '<div class="asf-fallback-hint" style="margin:-4px 0 12px;">Ad name is locked to the advertiser \u2014 set automatically when you pick the Customer.</div>' +
      '<div class="asf-ads-intro">Fill the formats this advertiser runs \u2014 each is optional. ' +
        'Redirect destination defaults to the Customer\u2019s Business Website unless a section link overrides it.</div>' +
      banner + sidebar + splash + theFind + lbp + defaultArtAd;
  }

  // AD sidebar — Advertiser (required Customer ref) + Default Redirect
  // URL (from Customer record) with the single redirect override +
  // status line. No scheduling / sponsorship / theme / product picker.
  function renderADSSide() {
    var a = S.article || {};

    var advInner =
      renderUnlockedRef('Customer (advertiser)', a.customerName, 'customer') +
      '<button type="button" class="asf-edit-cust asf-edit-cust-block" disabled title="Coming in a future session">' +
        'Edit Customer record <span class="soon">soon</span>' +
      '</button>';

    var website = a.customerWebsite || '';
    var redirectInner =
      '<div class="asf-field">' +
        '<label class="asf-field-label">Default Redirect URL</label>' +
        '<div class="asf-readonly-line' + (website ? '' : ' empty') + '">' +
          (website ? esc(website) : 'from Customer record \u00b7 Business Website') +
        '</div>' +
        '<div class="asf-fallback-hint">from Customer record \u2014 the fallback for every section.</div>' +
      '</div>' +
      renderField({
        label: 'Redirect Link \u2013 GO', field: 'redirectLink', mono: true,
        value: curValRead('redirectLink'),
        placeholder: 'leave blank to use the default'
      });

    return '' +
      renderSideSection('references', 'Advertiser', advInner) +
      renderSideSection('redirect',   'Redirect',   redirectInner) +
      renderADSStatusLine();
  }

  function renderADSStatusLine() {
    var a = S.article || {};
    return '' +
      '<div class="asf-statusline">' +
        '<span class="asf-statusline-dot"></span>' +
        '<span class="asf-statusline-text">Ad \u00b7 ' + esc(a.status || 'Draft') + '</span>' +
      '</div>';
  }

  // AD create commit → Scenario 104 (assetType:'ad'). v1.3.12 — payload
  // now uses semantic keys per slot:
  //   • bannerImage*  → banner-ad-700x200  (Make reads bannerImageSrc)
  //   • sidebarImage* → sidebar-ad-480x400 (Make reads sidebarImageSrc)
  //   • splashImage*  → splash-ad-700x700  (Make reads splashImageSrc)
  // Internal state still uses generic mainImage*/ogImage* for banner +
  // sidebar so the picker + setMainImageFromMedia / setOgImageFromMedia
  // pipeline stays single-path. Splash has its own dedicated state.
  function commitCreateADS() {
    if (S.saving) return;

    if (!curVal('customerId') && !curVal('customerName')) {
      toast('An advertiser (Customer) is required to create an ad', 'error');
      return;
    }

    var url = CFG.tenant.makeCreateAssets();
    var a   = S.article || {};

    var payload = {
      action:    'createAsset',
      assetType: 'ad',
      titleSlug: CFG.tenant.titleSlug(),
      taItemId:  CFG.tenant.taItemId(),
      source:    'asf-v' + VERSION,
      fields: {
        // Ad name (= customer name by convention)
        adName:             curVal('adName'),
        // Advertiser
        customerId:         a.customerId   || '',
        customerName:       a.customerName || '',
        // Banner (banner-ad-700x200) — semantic keys, sourced from
        // generic internal mainImage* state.
        bannerImageMediaId: a.mainImageMediaId || '',
        bannerImageSrc:     a.mainImageSrc     || '',
        bannerImageAlt:     curVal('mainImageAlt') || '',
        bannerAdLink:       curVal('bannerAdLink'),
        // Sidebar (sidebar-ad-480x400) — semantic keys, sourced from
        // generic internal ogImage* state.
        sidebarImageMediaId: a.ogImageMediaId || '',
        sidebarImageSrc:     a.ogImageSrc     || '',
        sidebarAdLink:       curVal('sidebarAdLink'),
        // Splash (splash-ad-700x700) — dedicated splash* keys.
        splashImageMediaId: a.splashImageMediaId || '',
        splashImageSrc:     a.splashImageSrc     || '',
        splashImageAlt:     curVal('splashImageAlt') || '',
        splashAdLink:       curVal('splashAdLink'),
        // The Find — Curated Text Ad
        textAdTitle:        curVal('textAdTitle'),
        textAdText:         curVal('textAdText'),
        // Local Business Profile — ad creative
        lbpPhotoLink:       curVal('lbpPhotoLink'),
        lbpTeaserText:      curVal('lbpTeaserText'),
        lbpRichText:        a.lbpRichText || '',
        // Single redirect (The Find / LBP)
        redirectLink:       curVal('redirectLink'),
        availabilityStatus: curVal('availabilityStatus') || 'Available'
      }
    };
    log('createAsset payload · ad', payload);

    if (!url) {
      toast('Create Assets endpoint not configured — add TA_CONFIG.makeCreateAssets', 'error');
      console.log('[ASF v' + VERSION + '] would POST createAsset (AD) →', payload);
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
        var j; try { j = JSON.parse(body); } catch (e) { j = null; }
        if (!j || j.ok !== true) {
          console.warn('[ASF v' + VERSION + '] createAsset (AD) unexpected response:', body);
          throw new Error('Scenario 104 did not confirm createAsset — see console. Check the scenario\'s execution history in Make.com.');
        }
        var newId = j.itemId || j.adItemId || null;
        S.saving = false;
        toast('Ad created', 'success');
        if (newId) {
          S.article.id = newId;
          S.article.status = 'Draft';
        }
        S.dirtyFields = {};
        S.dirtySections = {};
        snapshotOriginals();
        render();
        // v1.3.4: close ASF on create-success; error path keeps it open.
        setTimeout(publicClose, 350);
      })
      .catch(function (err) {
        S.saving = false;
        setSaveButtonState('idle');
        warn('createAsset (AD) failed', err);
        toast(err && err.message ? err.message : 'Create failed', 'error');
      });
  }

  // ─── v1.2.3 — prefilledMediaIds resolver (TD-196 / WLN-113) ──────
  // The Bundles cascade opens ASF with
  //   window.InbxASF.open({ mode:'create', assetType, prefilledMediaIds })
  // ta-asf <=1.2.2 ignored prefilledMediaIds, so a bundle's body never
  // populated. Resolves each id by MEDIA-TYPE (not component-role,
  // which is always empty from the conditioning pipeline — TD-195):
  //   Text  → bodyHtml  (→ post-body + post-body-html via the create payload)
  //   Image → main image (first), OG/secondary image (second)
  // Reads html-content from the .cm-media-html child (the same DOM
  // source hydrateMedia uses; hydrateAllMedia omits it). Routes through
  // applyPrefill so values are set AND marked dirty (so they save).
  function resolvePrefilledMediaIds(ids) {
    if (!Array.isArray(ids) || !ids.length) return;
    // v1.2.9 — fresh body prefill = new AI-assist session (re-arm auto-run).
    S.aiAssist = { ran:false, busy:false, done:false, error:'', bodyUndo:null };
    var map   = {};
    var wraps = document.querySelectorAll('.media-wrapper[data-item]');
    Array.prototype.forEach.call(wraps, function (el) {
      var d  = el.dataset || {};
      var id = (d.mediaId || '').trim();
      if (!id) return;
      var htmlEl = el.querySelector('.cm-media-html');
      map[id] = {
        mediaType:   (d.mediaType || '').trim(),
        status:      (d.status || '').trim(),
        imageUrl:    (d.imageUrl || '').trim(),
        htmlContent: htmlEl ? htmlEl.innerHTML : ''
      };
    });

    var resolved = {};
    var imgSlot  = 0;
    var matched  = 0;
    for (var i = 0; i < ids.length; i++) {
      var m = map[ids[i]];
      if (!m) { warn('resolvePrefilledMediaIds: MEDIA not on page for id ' + ids[i]); continue; }
      var mt = (m.mediaType || '').toLowerCase();
      if (mt.indexOf('text') !== -1) {
        if (m.htmlContent) { resolved.bodyHtml = m.htmlContent; matched++; }
      } else if (mt.indexOf('image') !== -1) {
        if (m.imageUrl) {
          if (imgSlot === 0)      { resolved.mainImageSrc = stripUcTransforms(m.imageUrl); resolved.mainImageMediaId = ids[i]; }
          else if (imgSlot === 1) { resolved.ogImageSrc   = stripUcTransforms(m.imageUrl); resolved.ogImageMediaId   = ids[i]; }
          imgSlot++; matched++;
        }
      }
    }

    if (matched) {
      applyPrefill(resolved);
      log('resolvePrefilledMediaIds — matched ' + matched + ' of ' + ids.length + ' id(s)', Object.keys(resolved));
    } else {
      warn('resolvePrefilledMediaIds — no Text/Image MEDIA resolved from', ids);
    }
  }

  // ─── Main column ───────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  //  AI ASSIST (v1.2.9) — Generator field-derivation in the ASF
  //  Create-mode Article only. On open with a seeded body it auto-runs
  //  once (fill-only-empty), then the operator can Regenerate (overwrite)
  //  or Undo the body rewrite. Pure consumer of window.InbxGenerate
  //  (ta-generate-v1.0.0.js) — no API key here.
  // ═══════════════════════════════════════════════════════════════
  function aiAssistState() {
    if (!S.aiAssist) S.aiAssist = { ran:false, busy:false, done:false, error:'', bodyUndo:null };
    return S.aiAssist;
  }
  function aiAssistEligible() {
    return S.mode === 'create' && S.assetType === 'article'
        && window.InbxGenerate && typeof window.InbxGenerate.fromBody === 'function';
  }
  function aiIsEmpty(v) { return v == null || String(v).trim() === ''; }
  function aiSetField(k, v) {
    S.article[k] = v;
    S.dirtyFields[k] = { from: (k in S.originalValues ? S.originalValues[k] : ''), to: v };
  }
  var AI_THINKING_SVG = '<svg class="asf-ai-lottie" viewBox="0 0 50 24" width="46" height="22" aria-hidden="true">' +
    '<path class="asf-ai-spk1" d="M9 4 L10.3 8.7 L15 10 L10.3 11.3 L9 16 L7.7 11.3 L3 10 L7.7 8.7 Z" fill="#C4A35A"/>' +
    '<path class="asf-ai-spk2" d="M16 3 L16.7 5.3 L19 6 L16.7 6.7 L16 9 L15.3 6.7 L13 6 L15.3 5.3 Z" fill="#5B7FFF"/>' +
    '<circle class="asf-ai-dt1" cx="28" cy="12" r="2.3" fill="#C4A35A"/>' +
    '<circle class="asf-ai-dt2" cx="36" cy="12" r="2.3" fill="#5B7FFF"/>' +
    '<circle class="asf-ai-dt3" cx="44" cy="12" r="2.3" fill="#C4A35A"/>' +
  '</svg>';

  function renderAiAssistBar() {
    if (!aiAssistEligible()) return '';
    var a = aiAssistState();
    var bodyLen = stripTags((S.article && S.article.bodyHtml) || '').length;
    var title, sub, actions;
    if (a.busy) {
      title = 'Generating\u2026';
      sub   = 'Teaser, short summary &amp; section headers from the body.';
      actions = AI_THINKING_SVG;
    } else if (a.error) {
      title = 'Generation failed';
      sub   = esc(a.error);
      actions = '<button type="button" class="asf-ai-btn asf-ai-btn--gold" data-asf-action="ai-regen">Try again</button>';
    } else if (a.done) {
      title = 'Auto-filled from body';
      sub   = 'Filled empty fields + added section headers. Existing text untouched.';
      actions =
        (a.bodyUndo != null ? '<button type="button" class="asf-ai-btn asf-ai-btn--ghost" data-asf-action="ai-undo">Undo headers</button>' : '') +
        '<button type="button" class="asf-ai-btn asf-ai-btn--ghost" data-asf-action="ai-regen">\u21bb Regenerate</button>';
    } else {
      title = 'AI assist';
      sub   = bodyLen ? 'Generate teaser, short summary &amp; section headers from the body.'
                      : 'Add a body, then generate teaser, summary &amp; section headers.';
      actions = '<button type="button" class="asf-ai-btn asf-ai-btn--gold" data-asf-action="ai-gen"' +
                (bodyLen ? '' : ' disabled') + '>\u2728 Generate from body</button>';
    }
    return '' +
      '<div class="asf-ai-bar' + (a.busy ? ' busy' : '') + (a.error ? ' err' : '') + '">' +
        '<span class="asf-ai-spark">\u2728</span>' +
        '<div class="asf-ai-txt"><b>' + title + '</b><span class="asf-ai-sub">' + sub + '</span></div>' +
        '<div class="asf-ai-actions">' + actions + '</div>' +
      '</div>';
  }
  function aiGenerate(opts) {
    if (!aiAssistEligible()) return;
    var a = aiAssistState();
    if (a.busy) return;
    var body = (S.article && S.article.bodyHtml) || '';
    if (!stripTags(body)) { toast('Add a body first \u2014 nothing to generate from.', 'error'); return; }
    a.busy = true; a.error = ''; render();
    window.InbxGenerate.fromBody(body).then(function (out) {
      var ow = !!(opts && opts.overwrite);
      if (out.teaser && (ow || aiIsEmpty(S.article.teaser)))             aiSetField('teaser', out.teaser);
      if (out.shortSummary && (ow || aiIsEmpty(S.article.shortSummary))) aiSetField('shortSummary', out.shortSummary);
      if (out.bodyWithHeaders && out.bodyWithHeaders !== body) {
        a.bodyUndo = body;
        aiSetField('bodyHtml', out.bodyWithHeaders);
      }
      deriveDirtySections();
      a.busy = false; a.done = true; render();
    }).catch(function (err) {
      a.busy = false; a.error = (err && err.message) || 'Generation failed.';
      toast(a.error, 'error'); render();
    });
  }
  function aiUndoBody() {
    var a = aiAssistState();
    if (a.bodyUndo == null) return;
    aiSetField('bodyHtml', a.bodyUndo);
    a.bodyUndo = null; deriveDirtySections(); render();
  }
  function initAiAssist() {
    if (!aiAssistEligible()) return;
    var a = aiAssistState();
    // v1.3.0 — buttons route through the ASF delegated click router
    // (data-asf-action ai-gen / ai-regen / ai-undo → handleAction).
    // initAiAssist now only arms the auto-run.
    if (!a.ran && !a.busy && stripTags((S.article && S.article.bodyHtml) || '')) {
      a.ran = true;
      setTimeout(function () { aiGenerate({ overwrite:false }); }, 0);
    }
  }

  function renderMain(rtp) {
    return '' +
      renderAiAssistBar() +     // v1.2.9 — create-mode Article AI assist
      renderSourceScreenshots() +
      renderTitleHeadline() +
      renderMainSubtitle() +
      renderMainWriters() +
      renderMainCoWriters() +
      renderMainTeaser() +
      renderMainShortSummary() +
      renderMainOgZones() +        // v1.1.4 — main + OG side-by-side 50/50
      renderMainBody() +           // v1.1.1 — split: inline Trix in create, popout in edit
      renderIssuesBanner();
      // v1.1.9 — renderActionBar moved OUT of renderMain to top-level
      // render() so it can be position:fixed at the viewport bottom.
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
          ' maxlength="' + (CFG.limits.subtitle) + '"' +
          ' value="' + esc(v) + '"' +
          (naOn ? ' disabled' : '') +
          ' placeholder="Sub-title…">' +
        renderCharCounter('subtitle', v) +
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
      rangeMin: 350,
      limit: 400
    });
  }

  function renderMainShortSummary() {
    return renderTextarea({
      field: 'shortSummary',
      label: 'Short summary',
      value: curValRead('shortSummary'),
      rangeMin: 120,
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
               ' style="background-image:url(' + esc(mainImageDisplayUrl(displayUrl)) + ');"' +
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
          '<div class="asf-mainog-empty-sub">1200 × 1200 square · top of article</div>' +
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
      ? '<div class="asf-mainog-og-img" style="background-image:url(' + esc(ogImageDisplayUrl(previewUrl)) + ');"></div>'
      : '<div class="asf-mainog-og-img empty">' +
          '<span class="asf-mainog-og-img-label">OG · 2400×1260 · empty</span>' +
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
          // v1.1.5 — always show "Pick OG image" so publishers can
          // override the main-image fallback with a dedicated OG.
          '<div class="asf-mainog-secondary">' +
            '<button type="button" class="asf-mainog-secondary-btn"' +
              ' data-asf-action="attach-og-from-media">' +
              (hasOwnOg ? 'Replace OG image' : 'Pick dedicated OG image') +
            '</button>' +
            (hasMain && !hasOwnOg
              ? '<button type="button" class="asf-mainog-secondary-btn primary"' +
                  ' data-asf-action="set-og-from-main">Use main image →</button>'
              : '') +
          '</div>' +
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

  // v1.1.11 — Is the ASF stylesheet actually applied? Probes a
  // hidden .asf-overlay element for its computed z-index, which the
  // ASF CSS sets to 10000. visibility:hidden!important keeps the
  // probe from painting (no teal flash); the element is added and
  // removed synchronously so no reflow paint occurs mid-call.
  function asfCssApplied() {
    try {
      var probe = document.createElement('div');
      probe.className = 'asf-overlay';
      probe.style.cssText = 'visibility:hidden!important;pointer-events:none!important;';
      document.body.appendChild(probe);
      var z = window.getComputedStyle(probe).zIndex;
      document.body.removeChild(probe);
      return z === '10000';
    } catch (e) {
      return false;   // can't probe → assume not applied, let injection try
    }
  }

  // v1.1.11 — Guarantee the companion stylesheet is present. The JS
  // and CSS ship as a version-matched pair; if the head's CSS <link>
  // is stale/missing/404'd, the overlay mounts but renders invisibly.
  // This derives the CSS URL from THIS script's own src and injects
  // it when needed — the same resilience pattern as ensureTrixLoaded.
  // Idempotent: skips when the exact URL is already linked or when
  // some ASF CSS is already applied.
  function ensureStylesLoaded() {
    if (!OWN_SCRIPT_SRC) {
      warn('ensureStylesLoaded: could not self-locate script src — ' +
           'cannot derive companion CSS URL. Ensure the ta-asf CSS ' +
           '<link> is present in the page head.');
      return;
    }
    var cssUrl = OWN_SCRIPT_SRC.replace(/\.js(\?.*)?$/i, '.css$1');

    // Already linked (by us or by the head) → nothing to do.
    if (document.querySelector('link[href="' + cssUrl + '"]')) return;
    // Some ASF CSS is already working → don't fight an existing link.
    if (asfCssApplied()) return;

    var link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = cssUrl;
    link.setAttribute('data-asf-autocss', '1');
    link.onload = function () {
      log('self-loaded companion CSS · ' + cssUrl);
      if (S.open) render();   // repaint now that styles are present
    };
    link.onerror = function () {
      warn('companion CSS failed to load · ' + cssUrl +
           ' — check the file is published at this path.');
    };
    document.head.appendChild(link);
    log('ASF CSS not detected — injecting companion stylesheet · ' + cssUrl);
  }

  // Lazy-load Trix from CDN on first need. Idempotent across
  // multiple calls (script tag deduped via data-asf-trix-loader
  // marker). Calls render() once the script resolves so the
  // popout fallback flips to inline.
  // v1.3.1 — register H2/H3 as Trix heading blocks (mirrors ta-rte). Global +
  // idempotent. MUST run before a trix-editor mounts, else Trix flattens
  // <h2>/<h3> on load and the heading CSS never has anything to style.
  function registerTrixHeadings() {
    if (!window.Trix || !window.Trix.config || !window.Trix.config.blockAttributes) return;
    var ba = window.Trix.config.blockAttributes;
    if (!ba.heading2) ba.heading2 = { tagName: 'h2', terminal: true, breakOnReturn: true, group: false };
    if (!ba.heading3) ba.heading3 = { tagName: 'h3', terminal: true, breakOnReturn: true, group: false };
  }

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
    registerTrixHeadings();   // v1.3.1 — H2/H3 blocks registered before the editor mounts
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
            // v1.1.9 — insert + upload buttons moved into the Trix
            // toolbar (customizeTrixToolbar). Footer now shows only
            // the character counter.
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

    // v1.3.3 — measure the sticky header so the toolbar pins just below it.
    var asfHdr = qs(S.overlay, '.asf-hdr-row1');
    if (asfHdr && S.overlay) S.overlay.style.setProperty('--asf-hdr-h', asfHdr.offsetHeight + 'px');

    // trix-change fires after every content edit — synchronous with
    // user input. Reading from element.innerHTML gives the canonical
    // Trix-serialized HTML (same as Transcriber's sctRteGetHTML).
    trixEditor.addEventListener('trix-change', onTrixChange);
    trixEditor.addEventListener('trix-blur',   onTrixChange);

    // v1.1.9 — inject Image + Upload buttons into the toolbar once
    // Trix populates its default button groups. trix-initialize is
    // the reliable signal; setTimeout backstops the already-fired case.
    trixEditor.addEventListener('trix-initialize', customizeTrixToolbar);
    setTimeout(customizeTrixToolbar, 0);
  }

  // v1.1.9 — Toolbar customization (original ASF / RTE parity).
  // Removes Trix's file-tools group and appends "Image" (MEDIA
  // picker) + "Upload" (direct Uploadcare) buttons to the text-tools
  // group, so they sit on the same row as the bullet / number list
  // icons. Idempotent — bails if already injected or toolbar not
  // yet populated.
  function customizeTrixToolbar() {
    var toolbar = qs(S.overlay, '#asf-trix-toolbar');
    if (!toolbar) return;
    if (toolbar.querySelector('.asf-img-insert-btn')) return;     // already done
    var textGroup = toolbar.querySelector('.trix-button-group--text-tools');
    if (!textGroup) return;                                       // not populated yet

    // Drop Trix's native file-tools group (we provide our own insertion)
    var fileTools = toolbar.querySelector('.trix-button-group--file-tools');
    if (fileTools) fileTools.remove();

    // v1.3.1 — H2/H3 buttons in the block-tools group (Trix's default group
    // already has Heading = H1). data-trix-attribute wires the toggle + the
    // active-state highlight, so the operator can SEE/SET the heading level.
    var blockGroup = toolbar.querySelector('.trix-button-group--block-tools');
    if (blockGroup && !blockGroup.querySelector('[data-trix-attribute="heading2"]')) {
      var mkHead = function (attr, label) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'trix-button asf-trix-head-btn';
        b.setAttribute('data-trix-attribute', attr);
        b.title = label;
        b.textContent = label;
        b.tabIndex = -1;
        return b;
      };
      var h3Btn = mkHead('heading3', 'H3');
      var h2Btn = mkHead('heading2', 'H2');
      var firstBlock = blockGroup.firstChild;
      blockGroup.insertBefore(h3Btn, firstBlock);
      blockGroup.insertBefore(h2Btn, h3Btn);
    }

    // "⊕ Image" — opens the sidebar MEDIA picker in inline mode
    var sep1 = document.createElement('span');
    sep1.className = 'asf-toolbar-sep';
    var imgBtn = document.createElement('button');
    imgBtn.type = 'button';
    imgBtn.className = 'trix-button asf-img-insert-btn';
    imgBtn.title = 'Insert image from MEDIA library';
    imgBtn.tabIndex = -1;
    imgBtn.innerHTML = '<span>\u2295 Image</span>';
    imgBtn.addEventListener('click', function (e) {
      e.preventDefault();
      openSidebarPickerForMode('inline');
    });
    textGroup.appendChild(sep1);
    textGroup.appendChild(imgBtn);

    // "⬆ Upload" — file picker → Uploadcare → insert into body
    var sep2 = document.createElement('span');
    sep2.className = 'asf-toolbar-sep';
    var uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'trix-button asf-img-upload-btn';
    uploadBtn.title = 'Upload a new image directly into the article body';
    uploadBtn.tabIndex = -1;
    uploadBtn.innerHTML = '<span>\u2191 Upload</span>';
    uploadBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var inp = ensureFileInput();
      inp.setAttribute('data-asf-upload-role', 'interior-image');
      inp.setAttribute('data-asf-upload-target', 'inline-body');
      inp.click();
    });
    textGroup.appendChild(sep2);
    textGroup.appendChild(uploadBtn);

    log('Trix toolbar customized — Image + Upload buttons injected');
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
    var createLabel = S.assetType === 'realestate' ? 'Create listing ✓'
                    : S.assetType === 'event'      ? 'Create event ✓'
                    : S.assetType === 'ad'         ? 'Create ad ✓'
                    : 'Save draft ✓';
    var saveLabel  = S.saving ? 'Saving…' :
                     (S.mode === 'create' ? createLabel : 'Save changes ✓');
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
          ' maxlength="' + (CFG.limits.bannerStatement) + '"' +
          ' value="' + esc(bsV) + '"' +
          (bsNA ? ' disabled' : '') + '>' +
        renderCharCounter('bannerStatement', bsV) +
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
        renderUnlockedRef('Newsletter Section', a.mnlsName || '', 'mnls') +
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
  // v1.1.5 — header label varies by mode; thumbnail-click branches
  // in the picker-insert-image action handler below.
  function renderInlinePicker() {
    var pk          = S.inlinePicker || { mode: 'inline', tab: 'available', expandedBundles: {}, search: '' };
    var allMedia    = hydrateAllMedia();
    var availHash   = pickMediaStatusHash('available');
    var attachHash  = pickMediaStatusHash('attached');

    // v1.1.5 — lenient mediaType filter. Webflow Option fields can
    // render with varying casing ("image" vs "Image"); MIME-y values
    // ("image/jpeg") also exist in some fixtures. Accept anything
    // containing 'image' case-insensitively. As a final safety net,
    // accept records with no mediaType set but a non-empty imageUrl
    // (a strong signal that it's still an image).
    var imageMedia  = allMedia.filter(function (m) {
      var t = (m.mediaType || '').toLowerCase();
      if (t.indexOf('image') !== -1) return true;
      if (!t && m.imageUrl) return true;
      return false;
    });
    var availItems  = imageMedia.filter(function (m) {
      return statusMatches(m, availHash, 'Available');
    });
    var attachItems = imageMedia.filter(function (m) {
      return statusMatches(m, attachHash, 'Attached');
    });
    var activeItems = pk.tab === 'attached' ? attachItems : availItems;

    // v1.1.5 — diagnostic log. Fires on every picker render
    // (open + tab switch + search). Keeps the log short so it
    // doesn't flood console; useful when troubleshooting empty
    // results in a new T-A.
    log('picker · diag · ' + pk.mode + ' mode · ' +
        'total=' + allMedia.length + ' · ' +
        'image-type=' + imageMedia.length + ' · ' +
        'available=' + availItems.length + ' · ' +
        'attached=' + attachItems.length +
        (allMedia[0] ? ' · first item:' : ''),
        allMedia[0] || null);

    // Search filter (applies after the diag log so the counts
    // above reflect the unfiltered totals).
    var searchTerm = (pk.search || '').trim().toLowerCase();
    if (searchTerm) {
      activeItems = activeItems.filter(function (m) {
        var hay = ((m.name || '') + ' ' + (m.originalFilename || '')).toLowerCase();
        return hay.indexOf(searchTerm) !== -1;
      });
    }

    // Group by bundle
    var bundleGroups = groupByBundle(activeItems);

    // v1.1.5 — header text per mode
    var headerLabel;
    var headerIcon;
    var isEvent = S.assetType === 'event';
    switch (pk.mode) {
      case 'main':   headerLabel = isEvent ? 'Pick event image' : 'Pick main image';   headerIcon = '🖼'; break;
      case 'og':     headerLabel = isEvent ? 'Pick social / OG image' : 'Pick OG image';   headerIcon = '🔗'; break;
      default:       headerLabel = 'Insert inline image'; headerIcon = '⊕';
    }

    return '' +
      // Header
      '<div class="asf-picker-header" data-asf-picker-mode="' + esc(pk.mode) + '">' +
        '<span class="asf-picker-title">' +
          '<span class="asf-picker-title-icon">' + headerIcon + '</span> ' + esc(headerLabel) +
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
      '</div>' +

      // v1.1.9 — size/align controls appear AFTER an image is
      // selected (inline mode only), as a sticky actions panel at
      // the bottom of the picker. NOT shown upfront.
      ((pk.mode === 'inline' && pk.selectedMediaId)
        ? renderPickerSelectedActions(pk, allMedia)
        : '');
  }

  // v1.1.9 — Sticky actions panel shown once an image is selected
  // in inline mode. Holds the selected-image preview + size + align
  // controls + Insert / Cancel. This is the "configure AFTER select"
  // step Jeff asked for.
  function renderPickerSelectedActions(pk, allMedia) {
    var sel = null;
    for (var i = 0; i < allMedia.length; i++) {
      if (allMedia[i].mediaId === pk.selectedMediaId) { sel = allMedia[i]; break; }
    }
    if (!sel) return '';   // selection stale — grid click will reset

    var size   = pk.imgSize  || 'large';
    var align  = pk.imgAlign || 'center';
    var isFull = size === 'full';
    var name   = sel.name || sel.originalFilename || 'image';
    var thumb  = pickerThumbUrl(sel.imageUrl);

    var sizeBtns = [['small','33%'],['medium','50%'],['large','75%'],['full','100%']]
      .map(function (pair) {
        var v = pair[0], label = pair[1];
        return '<button type="button" class="asf-picker-size-btn' +
               (size === v ? ' active' : '') + '"' +
               ' data-asf-action="picker-set-img-size"' +
               ' data-asf-img-size="' + v + '">' + label + '</button>';
      }).join('');

    var alignBtns = [['left','\u25C0'],['center','\u25A0'],['right','\u25B6']]
      .map(function (pair) {
        var v = pair[0], icon = pair[1];
        return '<button type="button" class="asf-picker-align-btn' +
               (align === v ? ' active' : '') + '"' +
               ' data-asf-action="picker-set-img-align"' +
               ' data-asf-img-align="' + v + '"' +
               ' title="' + v + '">' + icon + '</button>';
      }).join('');

    var alignDisabled = isFull ? ' style="opacity:0.35;pointer-events:none;"' : '';

    return '' +
      '<div class="asf-picker-selected">' +
        '<div class="asf-picker-selected-head">' +
          '<div class="asf-picker-selected-thumb"' +
               ' style="background-image:url(' + esc(thumb) + ');"></div>' +
          '<div class="asf-picker-selected-name" title="' + esc(name) + '">' + esc(name) + '</div>' +
          '<button type="button" class="asf-picker-selected-cancel"' +
            ' data-asf-action="picker-cancel-selection" title="Deselect">✕</button>' +
        '</div>' +
        '<div class="asf-picker-imgctl">' +
          '<div class="asf-picker-imgctl-group">' +
            '<span class="asf-picker-imgctl-label">Size</span>' +
            '<div class="asf-picker-size-strip">' + sizeBtns + '</div>' +
          '</div>' +
          '<div class="asf-picker-imgctl-group"' + alignDisabled + '>' +
            '<span class="asf-picker-imgctl-label">Align</span>' +
            '<div class="asf-picker-align-strip">' + alignBtns + '</div>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="asf-picker-insert-confirm"' +
          ' data-asf-action="picker-confirm-insert">Insert image ✓</button>' +
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
    var selId = (S.inlinePicker && S.inlinePicker.selectedMediaId) || null;
    var html = '<div class="asf-picker-thumbs">';
    for (var i = 0; i < items.length; i++) {
      var m   = items[i];
      var alt = m.name || m.originalFilename || 'image';
      var src = m.imageUrl;
      if (!src) continue;
      // v1.1.7 — small Uploadcare preview transform so the picker
      // loads fast instead of pulling every MEDIA original.
      var thumbSrc = pickerThumbUrl(src);
      var isSel = selId && m.mediaId === selId;
      html += '<div class="asf-picker-thumb' + (isSel ? ' selected' : '') + '"' +
                ' data-asf-action="picker-insert-image"' +
                ' data-asf-media-id="' + esc(m.mediaId) + '"' +
                ' title="' + esc(alt) + '">' +
                '<img src="' + esc(thumbSrc) + '" alt="' + esc(alt) + '" loading="lazy">' +
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
  // v1.1.8 — matches ta-rte v1.1.24 EXACTLY: builds a
  // <figure class="rte-inserted-image"> with data-img-size +
  // data-img-align + inline style, wrapped in a Trix HTML content
  // attachment. This preserves size/alignment (the v1.1.3 plain
  // image attachment lost both). The two editing paths now produce
  // identical body HTML.
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

    var size  = (S.inlinePicker && S.inlinePicker.imgSize)  || 'large';
    var align = (S.inlinePicker && S.inlinePicker.imgAlign) || 'center';
    var style = buildFigureInlineStyle(size, align);
    var alt   = media.name || media.originalFilename || 'image';

    // Bare URL — no JS-side transform (matches RTE). Downstream
    // render / conditioning applies component-role transforms.
    var figureHTML =
      '<figure class="rte-inserted-image"' +
        ' data-img-size="' + esc(size) + '"' +
        ' data-img-align="' + esc(align) + '"' +
        ' style="' + esc(style) + '">' +
        '<img src="' + esc(media.imageUrl) + '"' +
          ' alt="' + esc(alt) + '"' +
          ' data-media-id="' + esc(media.mediaId || '') + '"' +
          ' data-component-role="' + esc(media.role || '') + '">' +
      '</figure>';

    // v1.2.8: restore the cursor captured when the picker opened so the
    // figure inserts at the operator's cursor (Trix collapses its
    // selection on blur / re-render). Offsets map because the body
    // content is unchanged while the picker is open. No-op if unset.
    var savedRange = S.inlinePicker && S.inlinePicker.savedRange;
    if (savedRange && typeof trixEl.editor.setSelectedRange === 'function') {
      try { trixEl.editor.setSelectedRange(savedRange); }
      catch (e) { warn('insertImageIntoBody: could not restore saved range', e); }
    }

    if (typeof window.Trix !== 'undefined' && window.Trix.Attachment) {
      try {
        var attachment = new window.Trix.Attachment({ content: figureHTML });
        trixEl.editor.insertAttachment(attachment);
        log('inserted image (figure attachment) · size=' + size + ' align=' + align,
            { url: media.imageUrl, mediaId: media.mediaId });
        return true;
      } catch (e) {
        warn('insertAttachment(content) failed; falling back to insertHTML', e);
      }
    }
    // Fallback path — insert the figure HTML directly.
    trixEl.editor.insertHTML(figureHTML);
    log('inserted image via insertHTML fallback · size=' + size + ' align=' + align,
        { url: media.imageUrl, mediaId: media.mediaId });
    return true;
  }

  // v1.1.8 — figure inline-style builder. Mirrors ta-rte v1.1.24's
  // buildFigureInlineStyle so output is byte-identical.
  function buildFigureInlineStyle(size, align) {
    var pct  = CFG.imgSizePct[size]   || CFG.imgSizePct.large;
    var algn = CFG.imgAlignCss[align] || CFG.imgAlignCss.center;
    return 'max-width:' + pct + ';' + algn;
  }

  // ─── v1.1.5 — Unified sidebar picker for main + OG image ───────
  //
  // openSidebarPickerForMode: shared entry point for "Pick main image"
  // and "Pick OG image" actions. Flips the same sidebar picker the
  // inline body editor uses, just with a different mode. The picker's
  // header label + thumbnail-click behavior branch on S.inlinePicker.mode.
  function openSidebarPickerForMode(mode) {
    // v1.2.8: capture the live Trix cursor BEFORE re-rendering into
    // picker mode, so an inline insert lands where the operator was
    // typing instead of at the top. main/og don't write into the body,
    // so only inline needs it. Graceful no-op if capture fails.
    var savedRange = null;
    if (mode === 'inline') {
      var tEl = qs(S.overlay, 'trix-editor.asf-trix-editor');
      if (tEl && tEl.editor) {
        try { savedRange = tEl.editor.getSelectedRange(); } catch (e) {}
      }
    }
    if (!S.inlinePicker) {
      S.inlinePicker = { open: true, mode: mode, tab: 'available', expandedBundles: {}, search: '', savedRange: savedRange };
    } else {
      S.inlinePicker.open = true;
      S.inlinePicker.mode = mode;
      S.inlinePicker.tab  = 'available';
      S.inlinePicker.search = '';
      if (mode === 'inline') S.inlinePicker.savedRange = savedRange;
    }
    render();
  }

  // Set the main image from a picked MEDIA record. Updates the
  // in-overlay preview state (S.article.mainImageSrc + a synthetic
  // S.media entry so findMediaByRole('main-image') resolves), plus
  // mainImageMediaId for the save payload. In create mode the
  // actual CMS attach happens server-side when Scenario 104 is
  // extended to consume mainImageMediaId (HC-16 deferred).
  function setMainImageFromMedia(media) {
    if (!media || !media.imageUrl) {
      warn('setMainImageFromMedia: missing media or imageUrl', media);
      return false;
    }
    if (!S.article) S.article = {};

    // Visual state — RTP + Main image zone both read these
    // v1.3.5: store raw base URL only; Make SetVars own per-surface transforms.
    var rawUrl = stripUcTransforms(media.imageUrl);
    S.article.mainImageSrc     = rawUrl;
    S.article.mainImageMediaId = media.mediaId || '';
    // Don't clobber alt text if the publisher already typed one
    if (!S.article.mainImageAlt && media.name) {
      S.article.mainImageAlt = media.name;
    }

    // Synthesize MEDIA entry so findMediaByRole('main-image') works
    // during this session (cleaner than special-casing the renderer).
    var synthetic = Object.assign({}, media, { role: 'main-image' });
    if (!Array.isArray(S.media)) S.media = [];
    S.media = S.media.filter(function (m) { return m.role !== 'main-image'; });
    S.media.push(synthetic);

    // Mark dirty so Save Draft picks up the change. originalValues
    // may not have mainImageSrc snapshotted (it wasn't in CFG.mainFields);
    // initialize a baseline so revert behaves predictably.
    if (!S.dirtyFields) S.dirtyFields = {};
    if (!S.originalValues) S.originalValues = {};
    var prior = S.originalValues.mainImageSrc || '';
    S.dirtyFields.mainImageSrc     = { from: prior, to: rawUrl };
    S.dirtyFields.mainImageMediaId = { from: '', to: media.mediaId || '' };

    deriveDirtySections();
    log('main image set via sidebar picker', { mediaId: media.mediaId, url: rawUrl });
    return true;
  }

  // Set the OG image from a picked MEDIA record. Same shape as
  // setMainImageFromMedia but writes ogImageSrc / ogImageMediaId.
  function setOgImageFromMedia(media) {
    if (!media || !media.imageUrl) {
      warn('setOgImageFromMedia: missing media or imageUrl', media);
      return false;
    }
    if (!S.article) S.article = {};

    // v1.3.5: store raw base URL only; Make SetVars own per-surface transforms.
    var rawOg = stripUcTransforms(media.imageUrl);
    S.article.ogImageSrc     = rawOg;
    S.article.ogImageMediaId = media.mediaId || '';

    var synthetic = Object.assign({}, media, { role: 'og-image' });
    if (!Array.isArray(S.media)) S.media = [];
    S.media = S.media.filter(function (m) { return m.role !== 'og-image'; });
    S.media.push(synthetic);

    if (!S.dirtyFields) S.dirtyFields = {};
    if (!S.originalValues) S.originalValues = {};
    var priorOg = S.originalValues.ogImageSrc || '';
    S.dirtyFields.ogImageSrc     = { from: priorOg, to: rawOg };
    S.dirtyFields.ogImageMediaId = { from: '', to: media.mediaId || '' };

    deriveDirtySections();
    log('OG image set via sidebar picker', { mediaId: media.mediaId, url: rawOg });
    return true;
  }

  // v1.3.12 — Set the Splash image from a picked MEDIA record. Mirrors
  // setMain/Og but writes to dedicated splashImageSrc / splashImageMediaId.
  function setSplashImageFromMedia(media) {
    if (!media || !media.imageUrl) {
      warn('setSplashImageFromMedia: missing media or imageUrl', media);
      return false;
    }
    if (!S.article) S.article = {};

    var rawSp = stripUcTransforms(media.imageUrl);
    S.article.splashImageSrc     = rawSp;
    S.article.splashImageMediaId = media.mediaId || '';
    if (!S.article.splashImageAlt && media.name) {
      S.article.splashImageAlt = media.name;
    }

    var synthetic = Object.assign({}, media, { role: 'splash-image' });
    if (!Array.isArray(S.media)) S.media = [];
    S.media = S.media.filter(function (m) { return m.role !== 'splash-image'; });
    S.media.push(synthetic);

    if (!S.dirtyFields) S.dirtyFields = {};
    if (!S.originalValues) S.originalValues = {};
    var priorSp = S.originalValues.splashImageSrc || '';
    S.dirtyFields.splashImageSrc     = { from: priorSp, to: rawSp };
    S.dirtyFields.splashImageMediaId = { from: '', to: media.mediaId || '' };

    deriveDirtySections();
    log('Splash image set via sidebar picker', { mediaId: media.mediaId, url: rawSp });
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

  // v1.3.6: module-scope curVal. It was previously defined ONLY inside
  // commitCreateArticle, so commitCreateRE / commitCreateEV / commitCreateADS
  // threw "curVal is not defined" at their first validation line and never
  // POSTed to Scenario 104 — i.e. non-article ASFs never triggered Make.
  // Same impl as the article-local copy (returns undefined for a missing key).
  function curVal(k) {
    if (S.dirtyFields && Object.prototype.hasOwnProperty.call(S.dirtyFields, k)) {
      return S.dirtyFields[k].to;
    }
    return S.article ? S.article[k] : undefined;
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
        '<label class="asf-field-label">' + esc(o.label) + ' ' + reqMark + ' ' + hintMark + autoFilledTag(o.field) + '</label>' +
        '<input type="' + esc(o.type || 'text') + '" class="' + cls + '"' +
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

    // v1.2.9 — optional target-range counter (o.rangeMin): green in
    // rangeMin..limit, amber under, red over. Non-range callers unchanged.
    var rmin = o.rangeMin || 0;
    var cntCls = over ? 'over'
               : (rmin ? (len >= rmin ? 'inrange' : 'under')
                       : (near ? 'near' : ''));
    var cntLabel = rmin ? (rmin + '–' + lim) : ('' + lim);
    var counter = lim
      ? '<span class="asf-charcount ' + cntCls + '">' + len + ' / ' + cntLabel + '</span>'
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

  // v1.3.16 — URL conditioner blur handler. On leaving a URL-type field
  // (data-asf-field in URL_FIELDS, or the new-customer 'website' input),
  // normalize the value: bare domain → https://, existing scheme kept,
  // empty left empty. Writes the corrected value back to the DOM and
  // re-runs the normal field-edit path so dirty-state stays accurate.
  function onDelegatedFocusOut(e) {
    if (!S.open) return;
    var t = e.target;
    if (!t || !t.getAttribute) return;
    if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return;
    if (t.readOnly || t.hasAttribute('readonly')) return;

    // Standard form URL fields (data-asf-field)
    var f = t.getAttribute('data-asf-field');
    if (f && URL_FIELDS[f]) {
      var norm = normalizeUrl(t.value);
      if (norm !== t.value) {
        t.value = norm;
        handleFieldEdit(f, t);   // re-run dirty tracking on corrected value
      }
      return;
    }
    // New-customer sub-screen website field (data-asf-newcust='website')
    var nck = t.getAttribute('data-asf-newcust');
    if (nck === 'website') {
      var nv = normalizeUrl(t.value);
      if (nv !== t.value) {
        t.value = nv;
        if (S.newCust) S.newCust.website = nv;
      }
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

    // v1.2.7 — new-customer form fields persist to S.newCust without a
    // re-render (keeps focus/cursor); no dirty tracking on this screen.
    if (t.hasAttribute('data-asf-newcust')) {
      var nck = t.getAttribute('data-asf-newcust');
      if (S.newCust) S.newCust[nck] = (t.type === 'checkbox') ? !!t.checked : t.value;
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
    var field = t.getAttribute('data-asf-field');
    handleFieldEdit(field, t);
    // v1.3.5 — live char counter for any field in CFG.limits.
    var max = CFG.limits && CFG.limits[field];
    if (max) {
      var counter = document.querySelector('.asf-char-counter[data-counter-for="' + field + '"]');
      if (counter) {
        var len = (t.value == null ? (isCE ? (t.textContent || '') : '') : t.value).length;
        counter.textContent = len + '/' + max;
        counter.classList.remove('near', 'at');
        if (len >= max)              counter.classList.add('at');
        else if (len >= max * 0.85)  counter.classList.add('near');
      }
    }
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

    // v1.2.7 — new-customer Directory group: category cascade
    if (t.hasAttribute('data-asf-newcust-cat')) {
      handleNewCustCategory(t.getAttribute('data-asf-newcust-cat'), t);
      return;
    }
    // v1.2.7 — new-customer hide-from-directory toggle
    if (t.getAttribute && t.getAttribute('data-asf-newcust') === 'hideFromDirectory') {
      if (S.newCust) S.newCust.hideFromDirectory = !!t.checked;
      recomputeDirGate();
      return;
    }
    // v1.2.7 — new-customer select fields (customer type)
    if (t.tagName === 'SELECT' && t.hasAttribute('data-asf-newcust')) {
      if (S.newCust) S.newCust[t.getAttribute('data-asf-newcust')] = t.value;
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

      // v1.3.0 — AI assist (create-mode Article)
      case 'ai-gen':   aiGenerate({ overwrite:false }); return;
      case 'ai-regen': aiGenerate({ overwrite:true });  return;
      case 'ai-undo':  aiUndoBody();                    return;

      // v1.2.6 — Ad-create customer-first gate
      case 'gate-continue': {
        var gsel = qs(S.overlay, '.asf-gate-select');
        var cid = gsel ? gsel.value : '';
        if (!cid) { toast('Pick an advertiser to continue', 'info'); return; }
        var custs = readCustomers();
        var picked = null;
        for (var gi = 0; gi < custs.length; gi++) {
          if (custs[gi].id === cid) { picked = custs[gi]; break; }
        }
        if (!picked) { toast('That advertiser was not found', 'error'); return; }
        S.article.customerId   = picked.id;
        S.article.customerName = picked.name;
        prefillAdFromCustomer(picked);
        S.adGateOpen = false;
        render();
        return;
      }
      case 'gate-new-customer':            // v1.2.7
        S.gateNewOpen = true;
        render();
        return;
      case 'gate-cancel-new':              // v1.2.7 — back to advertiser picker
        S.gateNewOpen = false;
        S.newCust = blankNewCustomer();
        render();
        return;
      case 'newcust-create':               // v1.2.7 — POST createEditCustomer
        commitCreateCustomer();
        return;

      // Close overlay (topbar X, footer Cancel)
      // v1.1.0 — sidebar S1 segmented control
      case 'set-article-type':
        var newType = el.getAttribute('data-asf-type');
        if (newType && newType !== S.articleType) {
          S.articleType = newType;
          render();
        }
        return;

      // v1.1.3 (Chunk 3) — inline image picker actions.
      // v1.1.5 — these now serve all three modes (inline body insert,
      // main image pick, OG image pick) via S.inlinePicker.mode.
      case 'open-inline-image-picker':
        if (S.mode !== 'create') {
          // Picker is meaningful only when the body editor is
          // inline (create mode). Edit mode uses the popout body
          // editor which has no insertion point in the sidebar.
          toast('Inline image picker is available in create mode', 'info');
          return;
        }
        openSidebarPickerForMode('inline');
        return;

      case 'event-url-fetch':
        fetchEventFromUrl();
        return;

      case 'event-pick-image':
        if (!S.autoFill) S.autoFill = {};
        S.autoFill.image = el.getAttribute('data-asf-image') || S.autoFill.image;
        render();
        return;

      case 'event-condition-image':
        conditionEventImage();
        return;

      case 'close-inline-picker':
        if (S.inlinePicker) S.inlinePicker.open = false;
        render();
        return;

      case 'picker-set-tab':
        var newTab = el.getAttribute('data-asf-picker-tab');
        if (newTab && S.inlinePicker && S.inlinePicker.tab !== newTab) {
          S.inlinePicker.tab = newTab;
          render();
        }
        return;

      case 'picker-toggle-bundle':
        var bid = el.getAttribute('data-asf-bundle-id');
        if (!bid || !S.inlinePicker) return;
        if (!S.inlinePicker.expandedBundles) S.inlinePicker.expandedBundles = {};
        var explicit = Object.prototype.hasOwnProperty.call(S.inlinePicker.expandedBundles, bid);
        var current  = explicit ? !!S.inlinePicker.expandedBundles[bid] : true;
        S.inlinePicker.expandedBundles[bid] = !current;
        render();
        return;

      // v1.1.8 — inline image size + alignment selection
      case 'picker-set-img-size':
        var newSize = el.getAttribute('data-asf-img-size');
        if (newSize && S.inlinePicker) {
          S.inlinePicker.imgSize = newSize;
          // Selecting full disables align; reset to center so the
          // saved value is sane if they later pick a non-full size.
          if (newSize === 'full') S.inlinePicker.imgAlign = 'center';
          render();
        }
        return;

      case 'picker-set-img-align':
        var newAlign = el.getAttribute('data-asf-img-align');
        if (newAlign && S.inlinePicker && S.inlinePicker.imgSize !== 'full') {
          S.inlinePicker.imgAlign = newAlign;
          render();
        }
        return;

      // v1.1.9 — click behavior branches by mode:
      //   inline → SELECT (stage) the image; size/align + Insert
      //            actions panel appears. picker-confirm-insert
      //            does the actual insertion.
      //   main/og → attach immediately (no size/align to configure).
      case 'picker-insert-image':
        var mediaId = el.getAttribute('data-asf-media-id');
        if (!mediaId) return;
        var pmMode = (S.inlinePicker && S.inlinePicker.mode) || 'inline';

        if (pmMode === 'inline') {
          // Stage the selection — toggle off if re-clicking the same.
          if (S.inlinePicker.selectedMediaId === mediaId) {
            S.inlinePicker.selectedMediaId = null;
          } else {
            S.inlinePicker.selectedMediaId = mediaId;
          }
          render();
          return;
        }

        // main / og — attach immediately
        var allMedia = hydrateAllMedia();
        var picked = null;
        for (var pmI = 0; pmI < allMedia.length; pmI++) {
          if (allMedia[pmI].mediaId === mediaId) { picked = allMedia[pmI]; break; }
        }
        if (!picked) {
          warn('picker-insert-image: MEDIA not found in DOM', mediaId);
          return;
        }
        var pmOk   = false;
        var pmLabel = '';
        if (pmMode === 'main') {
          pmOk    = setMainImageFromMedia(picked);
          pmLabel = 'Main image set to ';
        } else if (pmMode === 'splash') {
          pmOk    = setSplashImageFromMedia(picked);
          pmLabel = 'Splash image set to ';
        } else {
          pmOk    = setOgImageFromMedia(picked);
          pmLabel = 'OG image set to ';
        }
        if (pmOk) {
          if (S.inlinePicker) S.inlinePicker.open = false;
          render();
          toast(pmLabel + (picked.name || picked.originalFilename || 'image'), 'success');
        }
        return;

      // v1.1.9 — confirm insertion of the staged inline image with
      // the chosen size/align.
      case 'picker-confirm-insert':
        if (!S.inlinePicker || !S.inlinePicker.selectedMediaId) return;
        var allMediaC = hydrateAllMedia();
        var pickedC = null;
        for (var pcI = 0; pcI < allMediaC.length; pcI++) {
          if (allMediaC[pcI].mediaId === S.inlinePicker.selectedMediaId) { pickedC = allMediaC[pcI]; break; }
        }
        if (!pickedC) {
          warn('picker-confirm-insert: staged MEDIA not found', S.inlinePicker.selectedMediaId);
          S.inlinePicker.selectedMediaId = null;
          render();
          return;
        }
        var okC = insertImageIntoBody(pickedC);
        if (okC) {
          S.inlinePicker.selectedMediaId = null;
          S.inlinePicker.open = false;
          render();
          toast('Inserted: ' + (pickedC.name || pickedC.originalFilename || 'image'), 'success');
        }
        return;

      // v1.1.9 — deselect the staged inline image (back to grid).
      case 'picker-cancel-selection':
        if (S.inlinePicker) S.inlinePicker.selectedMediaId = null;
        render();
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
      // v1.1.5 — attach-main-from-media now opens the unified sidebar
      // picker instead of the legacy modal. Same for replace-main-image.
      case 'attach-main-from-media':
        openSidebarPickerForMode('main');
        return;
      case 'replace-main-image':
        openSidebarPickerForMode('main');
        return;
      case 'attach-og-from-media':         // v1.1.5 — new
        openSidebarPickerForMode('og');
        return;
      case 'attach-splash-from-media':     // v1.3.12 — splash
        openSidebarPickerForMode('splash');
        return;
      case 'replace-splash-image':         // v1.3.12 — splash
        openSidebarPickerForMode('splash');
        return;
      case 'preview-splash-image':         // v1.3.12 — splash
        if (S.article && S.article.splashImageSrc) {
          window.open(S.article.splashImageSrc, '_blank');
        }
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
  // ═══════════════════════════════════════════════════════════════
  //  v1.3.16 — URL CONDITIONER (normalize-on-blur)
  //  Webflow Link fields reject bare domains ("yahoo.com") — they need
  //  a scheme. An operator typing a bare domain crashed Scenario 104's
  //  createItem with BundleValidationError "Invalid URL". This
  //  normalizes URL-type fields when the operator leaves the input:
  //    • non-empty + no http(s):// scheme  → prepend "https://"
  //    • already has http:// or https://    → left untouched (no forced
  //      upgrade — some advertiser links are legitimately http)
  //    • empty                              → left empty (never write a
  //      scheme onto a blank, which would itself be an invalid value)
  //  Applies across all asset types. Visible to the operator (the input
  //  shows the corrected value immediately) per the Option-1 decision.
  //  Set of data-asf-field names treated as URLs:
  // ═══════════════════════════════════════════════════════════════
  var URL_FIELDS = {
    // Article
    ctaUrl: true, videoUrl: true, audioUrl: true,
    // Ad
    bannerAdLink: true, sidebarAdLink: true, splashAdLink: true,
    redirectLink: true, lbpPhotoLink: true,
    // RE
    propertyLink: true,
    // Event
    eventRedirectLink: true,
    // Customer (new-customer sub-screen uses data-asf-newcust 'website',
    // handled separately below)
    website: true, customerWebsite: true
  };
  function normalizeUrl(val) {
    if (val == null) return val;
    var v = String(val).trim();
    if (v === '') return '';                       // skip empties
    if (/^https?:\/\//i.test(v)) return v;         // leave existing scheme
    // also leave other explicit protocols (mailto:, tel:) alone
    if (/^[a-z][a-z0-9+.\-]*:/i.test(v)) return v;
    return 'https://' + v;                         // prepend default scheme
  }

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
      // v1.5.0 (TD-216): edit-save contract for Scenario G updateAsset.
      action:    'updateAsset',
      assetType: S.assetType || 'article',
      itemId:    S.article.id,
      op:        op,                      // legacy / back-compat
      articleId: S.article.id,            // legacy / back-compat
      titleId:   S.article.mnlsId || null,
      version:   VERSION,
      fields:    {},                      // dirty-only; keyed by ASF STATE KEYS
      rtp:       {
        naState:     S.rtpNAState,
        manualState: S.rtpManualState
      },
      newsletterChoice: S.newsletterChoice,
      timestamp: new Date().toISOString()
    };
    // Only send fields the user actually changed (sparse payload).
    // Scenario G translates these state keys → Webflow slugs per type.
    for (var k in S.dirtyFields) {
      if (!Object.prototype.hasOwnProperty.call(S.dirtyFields, k)) continue;
      p.fields[k] = S.dirtyFields[k].to;
    }
    return p;
  }

  function commitSaveDraft() {
    if (S.saving) return;

    // v1.0.10: create mode → goes through createArticle path instead
    // v1.2.0: dispatch by assetType
    if (S.mode === 'create') {
      if (S.assetType === 'realestate') { commitCreateRE(); return; }
      if (S.assetType === 'event')      { commitCreateEV(); return; }
      if (S.assetType === 'ad')         { commitCreateADS(); return; }
      commitCreateArticle();
      return;
    }

    if (!hasDirty() && !hasRTPChange()) {
      toast('No changes to save', 'info');
      return;
    }

    // v1.5.0 (TD-216): article edit-save is LIVE via Scenario G updateAsset.
    // ad/event/RE save-routes are not wired yet (pending write-slug
    // confirmation from the TD-211 hydrate test) — gate them with a clear
    // message rather than POSTing to a route that can't handle them.
    if (S.assetType && S.assetType !== 'article') {
      toast('Saving edits for ' + S.assetType + ' is not enabled yet (TD-216 — ' +
            'article first). Your changes are not saved.', 'error');
      return;
    }

    var endpoint = CFG.tenant.makeStudio();  // Scenario G (lazy tenant read)
    if (!endpoint) {
      toast('Save unavailable — Scenario G (makeStudio) not configured', 'error');
      warn('commitSaveDraft: makeStudio endpoint missing');
      return;
    }

    var payload = buildSavePayload('save-draft');
    log('updateAsset payload → Scenario G', payload);

    S.saving = true;
    setSaveButtonState('saving');

    fetch(endpoint, {
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
        // v1.3.4: close ASF on save-draft success; error path keeps it open.
        setTimeout(publicClose, 350);
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
  // ═══════════════════════════════════════════════════════════════
  //  v1.3.15 — INLINE IMAGE MEDIA-ID EXTRACTION
  //  RTE-inserted inline images are real MEDIA records whose IDs live
  //  embedded in the body HTML as data-media-id="…" inside each
  //  <figure>. Scenario 104 needs these as a flat array so its new
  //  Route 4 (inline iterator) can flip each MEDIA to In Use, stamp
  //  component-role = Interior Image, and append it to the article's
  //  media-items forward link. We extract here (client-side, from the
  //  HTML we already hold in S) rather than have Make regex the HTML —
  //  reliable, and ASF already owns this string. De-duped; preserves
  //  first-seen order. Reusable across all asset-type commit paths.
  // ═══════════════════════════════════════════════════════════════
  function extractInlineMediaIds(html) {
    if (!html || typeof html !== 'string') return [];
    var ids = [];
    var seen = {};
    var re = /data-media-id\s*=\s*\\?["']([^"'\\]+)\\?["']/g;
    var m;
    while ((m = re.exec(html)) !== null) {
      var id = (m[1] || '').trim();
      if (id && !seen[id]) { seen[id] = true; ids.push(id); }
    }
    return ids;
  }

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
        searchType:        curVal('searchType') || '',
        // v1.1.5 — main + OG image picks. Currently consumed in
        // create mode by setMainImageFromMedia / setOgImageFromMedia
        // which set S.article.{mainImageSrc, mainImageMediaId,
        // ogImageSrc, ogImageMediaId}. Scenario 104 doesn't attach
        // these yet (HC-16 deferred); plumbed for forward
        // compatibility so the moment the scenario is extended, the
        // attach path works without further JS changes.
        mainImageMediaId:  (S.article && S.article.mainImageMediaId) || '',
        mainImageSrc:      (S.article && S.article.mainImageSrc)     || '',
        mainImageAlt:      curVal('mainImageAlt') || '',
        ogImageMediaId:    (S.article && S.article.ogImageMediaId)   || '',
        ogImageSrc:        (S.article && S.article.ogImageSrc)       || '',
        // v1.3.15 — inline body-image MEDIA ids for Scenario 104 Route 4.
        // Each is flipped to In Use + stamped component-role Interior
        // Image + appended to article.media-items (forward link) by 104.
        // Extracted from the RTE body HTML we already hold; de-duped.
        inlineMediaIds:    extractInlineMediaIds((S.article && S.article.bodyHtml) || '')
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
        // v1.3.17 — post-submit redirect to the Asset Workbench for the
        // just-created asset (decision: redirect to the thing you made).
        // Close ASF, then open the Workbench on the new itemId. Falls back
        // to plain close if the Workbench script isn't loaded.
        var _wbType = j.assetType || 'article';
        var _wbId   = newId;
        setTimeout(function () {
          publicClose();
          if (window.InbxAssetWorkbench && typeof window.InbxAssetWorkbench.open === 'function') {
            window.InbxAssetWorkbench.open({ assetType: _wbType, assetId: _wbId });
          }
        }, 350);
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

    // v1.3.6: in CREATE mode there is no article yet, so attaching via
    // Scenario G (which requires articleItemId) returns HTTP 500. In create
    // mode the persistent MEDIA attach is deferred to Scenario 104 (it flips
    // status→Attached + writes the back-ref on create). So set local state
    // only and return — never call Scenario G here.
    if (S.mode === 'create') {
      if (role === 'main-image')    setMainImageFromMedia(item);
      else if (role === 'og-image') setOgImageFromMedia(item);
      // interior-image: already embedded in bodyHtml; nothing to persist now.
      item.status = 'Attached';
      if (S.picker) S.picker.inFlight = false;
      var doneCreate = S.picker && S.picker.onConfirm;
      try { pickerClose(); } catch (e) {}
      toast('Image set — attaches on create', 'success');
      if (typeof doneCreate === 'function') doneCreate(item);
      render();
      return;
    }

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
          S.article.mainImageSrc = stripUcTransforms(item.imageUrl) || S.article.mainImageSrc;
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
      // v1.2.5 — picking the advertiser hydrates the WHOLE ad form from
      // the Customer record (read-only Local Business Profile + redirect
      // default) and locks the Ad name to the customer name.
      if (refType === 'customer' && S.assetType === 'ad') {
        prefillAdFromCustomer(item);
      }
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
    // v1.1.9 — 'inline-body' target inserts the uploaded image into
    // the Trix body immediately (vs setting main image).
    var target = e.target.getAttribute('data-asf-upload-target') || '';
    fireUpload(f, role, target);
    // Reset so the same file can be picked again later
    e.target.value = '';
    e.target.removeAttribute('data-asf-upload-target');
  }

  function fireUpload(file, role, target) {
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
        // v1.1.9 — inline-body target: insert into the Trix body
        // immediately using the Uploadcare URL (don't wait on
        // Scenario B conditioning). Scenario B still runs in the
        // background to create the reusable MEDIA row.
        if (target === 'inline-body') {
          var ucUrl = CFG.tenant.uploadcareBase() + '/' + j.file + '/';
          insertImageIntoBody({
            imageUrl:         ucUrl,
            name:             file.name,
            originalFilename: file.name,
            mediaId:          '',
            role:             'interior-image'
          });
        }
        return notifyScenarioB(j.file, file, role);
      })
      .then(function () {
        if (target === 'inline-body') {
          // Image already inserted live; no re-render (would disrupt
          // the editor). Scenario B has created the MEDIA row in the
          // background for future reuse via the picker.
          toast('Image uploaded + inserted into body', 'success');
        } else {
          toast('Upload complete — file conditioned and added to MEDIA', 'success');
          // Re-hydrate so the new item is visible in the picker
          S.media = hydrateMedia(S.article.id);
          render();
        }
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
  // ═══════════════════════════════════════════════════════════════
  //  v1.3.14 — SWIPE / BACK-NAVIGATION GUARD
  //  An inadvertent horizontal trackpad swipe (or the browser Back
  //  gesture/button) while the overlay is open was unmounting the ASF
  //  and dropping the operator to the Dashboard, discarding the draft.
  //  CSS overscroll-behavior:contain on .ta-asf handles most browsers;
  //  this history trap is the belt-and-suspenders layer for the ones
  //  that ignore it (Safari back-gesture). SILENT: a Back event while
  //  open is simply re-trapped — the involuntary swipe does nothing.
  // ═══════════════════════════════════════════════════════════════
  var _asfNavGuard = null;
  function asfInstallNavGuard() {
    if (_asfNavGuard) return;
    try { history.pushState({ asfOpen: true }, ''); } catch (e) { return; }
    _asfNavGuard = function () {
      // Back fired while ASF is open → re-push the trap, stay put.
      // Silent by design (no discard confirm) — the swipe is involuntary.
      try { history.pushState({ asfOpen: true }, ''); } catch (e) {}
    };
    window.addEventListener('popstate', _asfNavGuard);
  }
  function asfRemoveNavGuard() {
    if (!_asfNavGuard) return;
    window.removeEventListener('popstate', _asfNavGuard);
    _asfNavGuard = null;
    // Pop our trap state if it's still on top, so we don't leave a
    // dangling history entry behind after a clean close.
    try { if (history.state && history.state.asfOpen) history.back(); } catch (e) {}
  }

  // v1.4.0 (TD-211) — shared open() state setup, extracted so the async
  // ad/event/RE edit branch can reuse it before awaiting the webhook.
  // Contains everything between mode-set and mount(): state reset, ad gate,
  // source strip, inline-picker init, snapshotOriginals, and create-mode
  // prefill. Safe for edit (create-only blocks are guarded by mode checks).
  function _finishOpenSetup(params, mode, assetType) {
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

    // v1.2.6 — Ad create starts at the customer-first gate: pick (or, when
    // the create-customer route lands, create) the advertiser before the
    // form. Skipped if a customer is already set (e.g. a caller pre-selects
    // one). Non-ad and edit flows never see the gate.
    S.adGateOpen = (assetType === 'ad' && mode === 'create' &&
                    !(S.article && S.article.customerId));
    // v1.2.7 — new-customer sub-screen state (lives within the gate)
    S.gateNewOpen   = false;
    S.newCust       = blankNewCustomer();
    S.newCustSaving = false;

    // v1.1.0 — Source screenshots strip (T2). Caller (typically the
    // Transcriber) passes an array of image URLs so the operator can
    // cross-reference the parse against the originals. Omitted when
    // ASF is launched from any other entry surface.
    S.sourceImages = Array.isArray(params.sourceImages) ? params.sourceImages.slice() : null;

    // v1.1.3 — inline image picker state. Always starts closed.
    // Sidebar flips to picker mode when the body editor's "Insert
    // inline image" button fires open-inline-image-picker.
    // v1.1.5 — picker now supports multiple modes: 'inline', 'main',
    // 'og'. Header label + thumbnail-click behavior branch on mode.
    S.inlinePicker = {
      open:            false,
      mode:            'inline',      // 'inline' | 'main' | 'og'
      tab:             'available',   // 'available' | 'attached'
      expandedBundles: {},            // bundleId → true
      search:          '',
      // v1.1.8 — inline image insert size + alignment (RTE parity).
      // Only used in 'inline' mode. Defaults match the RTE.
      imgSize:         'large',       // small | medium | large | full
      imgAlign:        'center',      // left | center | right
      // v1.1.9 — staged selection. Inline mode: clicking a thumb
      // SELECTS it (sets this) and reveals the size/align + Insert
      // actions panel. Insert confirms. Main/OG modes don't stage —
      // they attach on click.
      selectedMediaId: null
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

    // v1.2.3 — resolve Bundles-cascade prefilledMediaIds into prefill
    // (Text → bodyHtml, Image → main/OG). Runs after applyPrefill so
    // resolved values count as dirty (and save). No-op when none passed.
    if (mode === 'create' && Array.isArray(params.prefilledMediaIds) && params.prefilledMediaIds.length) {
      resolvePrefilledMediaIds(params.prefilledMediaIds);
    }

  }

  function publicOpen(params) {
    params = params || {};
    var mode = params.mode === 'create' ? 'create' : 'edit';
    var articleId = params.articleId || params.articleItemId;
    // v1.2.0 — asset type selects the variant. Default 'article'
    // keeps every existing caller working unchanged.
    var assetType = params.assetType || 'article';
    if (assetType !== 'article' && assetType !== 'realestate' && assetType !== 'event' && assetType !== 'ad') {
      warn('open(): unknown assetType "' + assetType + '" — falling back to article');
      assetType = 'article';
    }
    // v1.4.0 (TD-211): edit hydration now supported for all 4 types.
    //   - article → synchronous DOM hydrate (hydrateArticle)
    //   - ad/event/realestate → ASYNC webhook hydrate (Workbench Read)
    // assetId is the edit target for non-article; articleId for article.
    var editId = articleId || params.assetId;
    if (mode === 'edit' && !editId) {
      warn('open(): an item id (articleId/assetId) is required for edit mode');
      return false;
    }
    if (S.open) {
      warn('open(): already open; closing previous instance');
      publicClose();
    }

    S.assetType = assetType;   // v1.2.0

    // ── Hydrate or initialize ──
    // v1.4.0: ad/event/RE EDIT is async (webhook). Branch out and finish
    // inside the promise; all other paths stay synchronous as before.
    if (mode === 'edit' && assetType !== 'article') {
      // Seed the blank shape immediately so applyPrefill has a target,
      // then hydrate from the Workbench Read webhook and prefill.
      S.article = (assetType === 'realestate') ? blankRE()
                : (assetType === 'event')      ? blankEV()
                : blankADS();
      S.media   = [];
      S.mode    = mode;
      _finishOpenSetup(params, mode, assetType);
      // Mount immediately in a loading-ish state, then prefill on resolve.
      mount();
      render();
      S.open = true;
      asfInstallNavGuard();
      fetchNewsletters();
      hydrateAssetViaWebhook(assetType, editId).then(function (res) {
        if (!res) {
          toast('Could not load this ' + assetType + ' for editing', 'error');
          return;
        }
        // applyPrefill AFTER snapshotOriginals (done in _finishOpenSetup)
        // so hydrated values count as dirty → Cancel reverts to blank.
        applyPrefill(res.fields);
        if (Array.isArray(res.media) && res.media.length) {
          // Normalize webhook media → ASF media shape (id + src + name).
          S.media = res.media.map(function (m) {
            var fd = m.fieldData || {};
            return {
              mediaId: m.id,
              id:      m.id,
              name:    fd.name || fd['media-name'] || '',
              src:     stripUcTransforms(fd['media-uploadcare-link'] || fd['image'] || fd.src || '')
            };
          });
        }
        render();
        log('open() · EDIT · ' + assetType + ' hydrated', { id: editId, fields: Object.keys(res.fields).length, media: S.media.length });
      });
      return true;
    }

    if (mode === 'create') {
      // v1.0.10: blank state, T-A + Title from TA_CONFIG
      // v1.2.0: blank shape depends on assetType
      S.article = (assetType === 'realestate') ? blankRE()
                : (assetType === 'event')      ? blankEV()
                : (assetType === 'ad')         ? blankADS()
                : blankArticle();
      S.media   = [];
      log('open() · CREATE MODE · ' + assetType, { taItemId: S.article.taItemId, titleName: S.article.titleName });
    } else {
      // article edit — synchronous DOM hydrate (unchanged)
      S.article = hydrateArticle(articleId);
      if (!S.article) {
        warn('open(): could not hydrate article', articleId);
        return false;
      }
      S.media   = hydrateMedia(articleId);
      log('open()', { articleId: articleId, name: S.article.name, mediaCount: S.media.length });
    }

    _finishOpenSetup(params, mode, assetType);
    mount();
    render();
    S.open = true;
    asfInstallNavGuard();   // v1.3.14 — trap Back/swipe while open

    // Async: fetch real newsletter list from HC-16 (stub fallback baked in).
    fetchNewsletters();

    return true;
  }

  function publicClose() {
    if (!S.open) return;
    log('close()');
    asfRemoveNavGuard();   // v1.3.14 — release Back/swipe trap
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

  // v1.1.11 — preload the companion stylesheet now (page load), before
  // the operator clicks Create, so the overlay is styled the instant it
  // opens even if the head's CSS <link> is stale or missing.
  ensureStylesLoaded();

  log('mounted · v' + VERSION + ' · self-loading companion CSS (resilience): JS now guarantees its version-matched stylesheet, derived from its own src — a stale/missing head <link> can no longer leave the overlay invisible.');
})();
