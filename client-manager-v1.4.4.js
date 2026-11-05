/* client-manager-v1.4.4.js
   ============================================================
   client-manager-v1.4.4.js

   v1.4.4 (5 Nov 2026, SS-Fork A · Mechanics S2) — THE ADDRESS CAN NAME A TAB.
     A page loaded with #client=<id>&tab=<tab> opens that record on that tab
     (overview, creative, commitments, account, billing). The Revenue Picker
     (ipp-revenue v1.7.5) opens a customer with no current splash this way,
     on Creative, so a version can be made current. Without tab= the record
     opens on Overview, as before. Once open, the address goes back to
     #client=<id>. Nothing else changes.

   v1.4.3 (5 Nov 2026, SS-Fork A · Mechanics S1) — SWITCHES READ FROM THE
     RECORD, NOT THE PAGE. Graze Craze's Expert Contributor is on in
     Webflow, but the page said No: switches were read from the T-A page's
     DOM attributes, which do not carry them reliably. When /customer-ads
     answers (ix-issue-data v1.0.158+), every switch field takes the
     record's value (customer.switches); an edit already made is kept. The
     DOM read also accepts True / Yes now.

   v1.4.2 (5 Nov 2026, SS-Fork A · Mechanics S1) — the Account logo keeps
     its own proportions: the page's image rules set a width and height on
     it, so it now carries width and height auto (important) inside its
     200 x 64 box, with object-fit contain.

   v1.4.1 (5 Nov 2026, SS-Fork A · Mechanics S1) — FIRST LOOK FIXES (Test 4).
     1 · The page uses the full width of the tab. The v1.3.0 rule
         .cm-rec{max-width:1100px} came later in the sheet than v1.4.0's
         .cm-pl{max-width:none} and won; the record now overrides it.
     2 · The Overview Commitments card was 70px wide: its grid class
         cm-c5 collides with the client list's column class .cm-c5
         {width:70px}. The card grid uses cm-span-4…8 now.
     3 · Wider screens get wider layouts: Overview's cards sit on a
         12-column grid without a cap; the Account groups run three
         across from 1500px.
     4 · The current tab's coral underline is straight (the page's
         button radius bent it).
     5 · Account reads links short: the logo shows as its picture; any
         other link shows without https:// and www., on one line.

   v1.4.0 (5 Nov 2026, SS-Fork A · Mechanics S1) — THE CLIENT PAGE,
   ORGANISED BY JOB, IN THE PUBLISHER PORTAL LOOK.

     Ruled by Jeff after client page mockup v0.2: opening a client is not
     data entry. The record is five tabs, each one job, in the Publisher
     Portal's design (ps-shell v1.0.2): Newsreader for the name and the
     shape names, Josefin Sans caps for the eyebrow, tabs and card
     labels, Sen for everything else; warm cream ground, white boxes on
     thin rules, coral underline on the current tab, blue pill buttons.
     No DM Sans or DM Mono on the record.
       OVERVIEW · "Needs you" (versions waiting for approval, sends due
         or missed, a missing sidebar, a current ad that is no longer
         one of the customer's live versions), the customer's
         commitments as green boards, the current ads, and contact.
       CREATIVE · each shape as a row of versions from /customer-ads:
         current (green), other approved versions with "Make current",
         versions waiting with "Approve & make current" and "Send back".
         Send back stages the shape's "Sent back" approval; nothing else.
       COMMITMENTS · the customer's sales records from ix-sales GET
         /sales?publisher=<id>, filtered to this customer: product,
         type, runs, frequency, qty, remaining, board, status. Needs
         TA_CONFIG.salesUrl and a Memberstack login (the page's own),
         like the Publisher Portal.
       ACCOUNT · the data-entry groups, read as plain text, each with an
         Edit link that opens only that group's fields. Changes are gold
         until Save, with the field's own cancel link.
       BILLING · a placeholder that says why: no price, invoice or
         payment is stored anywhere yet.
     One sticky save bar (.asm-save-bar) serves the whole record: staged
     approvals, current-ad picks and Account edits save together, by the
     v1.2.4 path (Scenario G approveAd, then Scenario 114).
     Add Client keeps the v1.3.0 form: it is the one time every field is
     typed in.
     Assumed, Jeff to correct: the five tabs as listed; the four "Needs
     you" items above; Billing visible as a placeholder.
     NEEDS: TA_CONFIG.salesUrl (the ix-sales Worker), the Google Fonts
     Newsreader, Josefin Sans and Sen (this file adds the link once).
     HARDCODING: HC-P-CM140-1 tab names and order; HC-P-CM140-2 the
     approval choice named "Sent back" (read by name, like "Approved",
     HC-P-CM124-2); HC-P-CM140-3 the Portal palette and fonts, copied
     from ps-shell v1.0.2 until the platform tokens carry them (Design
     Family Audit v0.1, step 1).

   v1.3.0 (5 Nov 2026, SS-Fork A · Mechanics S1) — THE CLIENT RECORD IS A
   SURFACE, NOT A MODAL.

     Ruled by Jeff: follow what the platform already does when a list
     opens a record. Pub Plans opens IPP as its own surface, the Asset
     Library hands the whole surface to the Asset Workbench and ASF
     (and returns to the same list), Print Issues hands it to Intake
     Review. None uses a modal or a list-left split. So:
       - The record takes the whole Clients tab (#client-manager-mount).
         The body-level portal and its overlay are gone, and with them
         the z-index fight that began in v1.0.13.
       - Header as Intake Review: the way back ("All clients") sits
         ABOVE the header, never in it (UX-016). The eyebrow reads
         CLIENTS · CLIENT RECORD (or CLIENTS · NEW CLIENT) (UX-017);
         the client's name is the title, first and flush left. The
         version sits behind the ⓘ badge (IxInfo), not in the header.
         The avatar circle is dropped: the title goes first.
       - The canonical sticky save bar (.asm-save-bar,
         title-admin-page-design): counts on the left; cancel, Save and
         Save & Publish on the right; gold top edge while anything is
         unsaved.
       - Leaving with unsaved changes asks first: "All clients" asks
         in the page, and closing or reloading the browser tab gets the
         browser's own prompt.
       - Each record has an address, #client=<CUSTOMERS id>. Opening a
         record sets it; going back clears it; a page loaded with it
         opens the Clients tab and that record. The list comes back
         with the same filter, search and scroll position.
       - Toasts go through IxToast (ix-success-toast) when the page has
         it. v1.2.x's own toast sat at z-index 100000 under the modal
         overlay (2147483000), so no save ever showed one; Jeff saw no
         toast in Test 2 although both saves were written.
       - The text-ad card shows the version name above its text.
     Data paths are unchanged: /customer-ads, Scenario 114, Scenario G
     approveAd. Add Client is the same surface, empty.
     HARDCODING: HC-P-CM130-1 the eyebrow words "Clients · Client
     record" / "Clients · New client"; HC-P-CM130-2 the hash key
     "client".

   v1.2.5 (5 Nov 2026, SS-Fork A · Mechanics S1) — THE T-A PAGE HAS NO
   planBoard; DEFAULT ADS RETIRE FROM THE FORM.

     1 · The Data Worker base. v1.2.4 read it only from
         TA_CONFIG.planBoard, which the IPP page sets and the T-A page
         does not, so Current ads said "TA_CONFIG.planBoard is not set".
         It now reads TA_CONFIG.planBoard, else TA_CONFIG.planList (the
         Worker's /plans address, which T-A does set), and keeps the
         part before /plan-board or /plans. Same rule as
         ta-create-from-print (HC-P-CFP-6).
     2 · The "Default ads" group is removed: Default ART AD
         (default-paid-ad-ulc-link) and Default Sponsorship AD
         (default-sponsorship-ad-link---ulc). Nothing that runs reads
         either one any more: the Data Worker stopped at v1.0.154 (the
         site and the email in-article ads read the customer's current
         banner), Scenarios 206, 104, 108, 110G, 114 and 121 do not read
         them, and the remaining mentions are display only (the ASF ad
         form's "may be outdated" reference block) or code no tile
         uses (ipp-dropdown v1.0, a hidden field in ta-page-body). The
         Webflow fields stay, untouched; 114 keeps its ifempty mapping,
         so nothing is cleared.

   v1.2.4 (5 Nov 2026, SS-Fork A · Mechanics S1) — CURRENT ADS ON THE
   CUSTOMER, AND THE REAL WEBFLOW CHOICES.

     CURRENT ADS. A new "Current ads" group holds the customer's four
     current-ad pointers on CUSTOMERS: current-banner-ad,
     current-sidebar-ad, current-splash-ad, current-text-ad. They are
     read from the Data Worker (ix-issue-data v1.0.157+ GET
     /customer-ads?customer=<id>), which lists every version of each
     shape the customer has, newest first, with its approval.
       - Read mode shows the current version by name, with its
         picture (or its text, for a text ad). A customer with a
         banner and no sidebar shows the quiet note "No sidebar yet".
       - Edit (pencil) lists the approved versions as choices. Below a
         divider, versions not approved yet are greyed with their
         approval word (Pending, Sent back, or "Not approved") and an
         Approve link. Approve stages the approval AND picks that
         version; both show gold until Save; "undo" takes it back.
       - Save writes staged approvals first, one Scenario G (110G)
         call per ADS row, action "approveAd", and checks each echo.
         Then the pointers go to Scenario 114 with the other changes.
         A pointer whose approval was not confirmed is held back and
         stays gold, so a version is never made current unapproved.
       - Add mode cannot set current ads: a new customer has no
         versions yet. The group says so.

     THE REAL CHOICES. Customer Type, Client Status and Profile Status
     now list Webflow's own choices, read from /customer-ads
     (customerOptions), instead of the typed lists that did not match
     Webflow (Advertiser/Contributor/Sponsor/Vendor; Prospect; New).
     An unmatched pick used to make 114's switch() return empty, so
     the old value was kept silently. The form still holds names; on
     Save to 114 each is sent as its option id, and 114 maps the id
     straight (its switch() hash tables are removed). The echo is
     compared id to id. Create (Scenario 111) still sends names.

     NO MORE FALSE "SAVED". Fields 114 does not write could be edited
     and were reported saved because nothing echoed them:
     Directories, Directory Tags, Newsletter Archive, Logo Image,
     Profile Page Image, (Self) This Item ID. They are read-only here
     until 114 maps them (Directory Tags becomes a multi-reference
     picker then). Filtering Categories is removed. Save now counts a
     changed field as saved only when 114's echo shows it.

     FOOTER. The "cancel" link sits beside Save, bottom right, and
     counts staged approvals with the other unsaved changes.

     NEEDS: ix-issue-data v1.0.157; TA_CONFIG.planBoard (the Worker
     base is read from it) and TA_CONFIG.makeStudio (Scenario G);
     Scenario 114 mapping the four pointers and the three option ids;
     Scenario G route approveAd.
     HARDCODING: HC-P-CM124-1 the four shapes, their pointer slugs and
     their labels (mirror ix-issue-data CURRENT_ADS, HC-P-SSA1-1);
     HC-P-CM124-2 the approval choice named "Approved" (read by name
     from approvalOptions); HC-P-CM124-3 Scenario G action "approveAd"
     and its keys adItemId, bannerApproval, sidebarApproval,
     splashApproval, textAdApproval.

   v1.2.3 — Switches are ON or OFF. There is no third state.

     THE DEFECT. Webflow switches are booleans. This file treated
     false as "no value" in three places, which invented an empty
     state that does not exist:
       - line 812 hasVal excluded false, so an OFF switch rendered
         as an em-dash and read as "not set"
       - the same test in the live dirty-repaint path
       - the DOM scan produced false for a missing attribute, which
         then displayed as empty
     Turning Hide from Directory off therefore looked like nothing
     happened: the value changed, the row re-rendered as empty, and
     there was no visible difference from before.

     THE FIX. A switch always hasVal. Read mode prints On or Off.
     Edit mode is an explicit Off/On button pair rather than a bare
     checkbox. cmSetVal coerces to a real boolean on the way in, so
     the dirty diff and the "1"/"0" sentinel sent to 114 both stay
     honest. Anything falsy is OFF.

     ALSO — derived fields stopped going stale-dirty. Parent
     Category Name and Parent Category ID are written into
     MODAL.edit by the cascade but excluded from `changes` because
     the client does not own them, so MODAL.orig never caught up
     and they stayed gold after a successful save. They are now
     reconciled from the echoed fieldData, which is what Webflow
     actually stored. Still TOAST-TRUTH: read from the response,
     not assumed.

   v1.2.2 — Changed fields only; 114 fills the rest from Webflow.

     Scenario 114 now runs getItem in front of updateItem and maps
     every field as
         ifempty(1.fieldData.<camel>; 5.fieldData.<slug>)
     so an unsent field falls back to what the record holds AT
     WRITE TIME. Verified live: sending only `neighborhood` left
     tagline, name, hide-from-directory and all three option
     fields exactly as they were.

     That lets the client go back to sending only what changed,
     which removes the staleness hazard v1.2.1 carried: MODAL.orig
     comes from the page-load DOM scan, so a full merged payload
     would have written page-load values over anything edited in
     Webflow since.

     SWITCHES SEND "1"/"0", NOT BOOLEANS. false reads as empty to
     ifempty, so an untick would fall back to the stored true and
     silently revert. 114 reads the sentinel with if(). The one
     that matters is hide-from-directory: suspend a non-payer,
     save, un-suspend.

     PARENT CATEGORY NAME is sent from here. 114 dropped its
     get MAJOR CATEGORY module — it fired on an empty item_id for
     uncategorised customers and its filter killed the whole
     chain, so a save on an uncategorised customer was a silent
     no-op.

     KNOWN LIMITATION. A text field cannot be CLEARED through this
     path: "" reads as empty and ifempty restores the old value.
     Not silent — the diff sees the old value return, the field
     stays dirty, the toast names it. Fixing it needs a __CLEAR__
     sentinel in 114.

   v1.2.1 — Mapped Webflow modules; full merged payload.

     THE RULE. A field edited on the form updates the record. A
     field not edited survives untouched.

     Sending only changed keys cannot satisfy that. The scenario
     would need ifempty() against a getItem to preserve the rest,
     and ifempty cannot tell a deliberately cleared field or an
     unticked switch from an absent one - both would silently
     revert, and both ARE edits. So the client now sends the FULL
     merged field set: every editable field carries its edited or
     its current value. No preservation logic exists to be wrong.

     v1.2.0 used a raw Webflow API call because the changed-field
     set was dynamic. That was the wrong trade. It broke on header
     serialisation (HTTP 500, "Header name must be a valid HTTP
     token"), and it would have broken again on slugs: the client
     sends 'business-category' but Webflow's field is 'section'.
     114 is now built on mapped updateItem + publishAnItem,
     reusing Scenario 111 module 3's verified field map including
     its switch() expressions for the three option fields.

     CM_TO_WF translates Client Manager slugs to Webflow slugs for
     the TOAST-TRUTH diff. Several diverge - contact-website,
     txa---services-N, customer-4-letter-code, section - and none
     of them are guessable.

   v1.2.0 — SAVE ACTUALLY SAVES.

     Through v1.1.4, cmDoSave() built a payload, console.log'd it,
     mutated CUSTOMERS in memory, then copied `changes` into
     MODAL.orig. That copy is what cleared the gold dirty borders
     and dropped the unsaved-change count to zero, so the UI
     reported success because it had updated ITSELF. The webhook
     call was three commented-out lines under a TODO. Nothing
     reached Make. Nothing reached Webflow. Reloading discarded
     the edit.

     WHAT CHANGED
       - Real POST to TA_CONFIG.makeUpdateCustomer (Scenario 114).
       - UX-006 TOAST-TRUTH: ok:true is necessary, not sufficient.
         The response must echo the stored fieldData; it is diffed
         field by field against what was sent, and ONLY confirmed
         fields are committed. Unconfirmed fields stay dirty and
         are named in the toast.
       - UX-005: buttons disable, label changes to Saving... /
         Publishing..., toast reports the outcome.
       - On failure nothing is committed and nothing is cleared,
         so the operator's edit survives.
       - CM_VERSION constant; the mount log said 1.0.2 while the
         file said 1.1.4.

     WHY 114 AND NOT 111. Scenario 111 creates then updates
     unconditionally - modules 3 and 4 both carry filter:null - so
     it has no concept of an existing customer. 114 PATCHes
     /collections/{id}/items/{itemId}/live, updating and
     publishing in one call and returning the stored item, which
     is what makes the diff possible.

     REQUIRES TA_CONFIG.makeUpdateCustomer.
   ============================================================ */
/* ============================================================
   client-manager-v1.1.4.js
   INBXIFY Client Manager — T-A Page Clients Tab
   
   Mounts into #client-manager-mount on the T-A template page.
   Reads customer data from .customers-wrapper hidden collection list.
   Field grouping config from window.TA_CONFIG.customerFieldGroups.
   
   Features:
     - Sortable columns (name, status, type, profile)
     - Filter pills by Client Status + Incomplete modifier toggle
     - Inline search
     - Edit modal: all CMS fields in tile groups, pencil-to-edit,
       gold dirty state, per-field cancel, Save / Save & Publish
     - Add Client modal: empty-state variant with create action
     - Console.log payloads (Make webhook wired in v1.1)
   
   v1.0.0 — initial build
   v1.0.1 — fix DOM selector, attribute map
   v1.0.2 — reference field dropdowns (categories, directories, archives)
   v1.0.17 — cmScrapeClient now: (1) sends REF_DATA.majors names as
             `categories` in the extract-client-worker POST so the AI
             majorCategory guess is constrained to an exact string
             match — resolved to an id via direct lookup, never fuzzy-
             matched, and never touches Minor/subcategory; (2) derives
             `neighborhood` client-side from the city token in
             cityStZip (no AI signal for this field exists). Pairs
             with extract-client-worker v1.1 (footer-safe text
             extraction + social-link regex fallback, so address/
             socials living in page footers survive truncation).
   v1.0.18 — (1) Major AND Minor category dropdowns were both silently
             capped by Webflow's 100-item DOM render ceiling (165 total
             categories today, growing). Fixed by fetching the full
             collection once, live, when Add/Edit modal opens
             (ensureLiveCategories → 112_IBX_getBusinessSubcategories,
             paginated Make-side past the cap), overwriting
             REF_DATA.majors/subs wholesale. Corrected a field-slug bug
             from the first draft of this fix: the parent relationship
             is the "Parent ID" field (parent-id), not a guessed
             "parent-category-bc" — that mismatch is why the first pass
             returned an incomplete/wrong subset. Both dropdowns show
             "Loading…" while the fetch is in flight; falls back to the
             DOM-capped list if TA_CONFIG.getSubcategoriesUrl isn't set
             or the fetch fails.
             (2) Logo picking now uploads client-side, immediately, via
             uploadcare.fileFrom('url', src) — logo-link holds a live
             ucarecdn.com URL (trimmed to content) before Create Client
             is ever clicked, not just after Make processes it on
             submit. Adds a Trimmed/Square variant picker once the
             upload finishes. Falls back to storing the raw scraped URL
             if Uploadcare's JS isn't loaded on the page.
   v1.1.0  — MODAL REORG (per add-client-reorg-mockup-v0_1, Jeff-locked).
             Wide modal (940px), 6-col grid with per-field spans (`w`
             on field defs), fields as label-over-input cards. New
             section order: Who (Name + Type + Expert Contributor +
             Status) → Reach them (address/contact promoted) → Logo
             (Link + Initials + Short Code, one row) → Directory
             placement (Hide/Featured moved here; Parent Name/ID auto)
             → Story (TXA 1–6 as six mini-inputs on one row) → Social →
             Default ads → System drawer (collapsed <details>: Slug,
             Publisher, Titles-Admin, Profile Status, Archive, Logo
             Image, Profile Page Image, Item ID). Titles-Admin now
             shows the T-A NAME — TA_NAME rejects 24-hex IDs and falls
             back to prettified titleSlug. Field slugs unchanged: edit
             state, scrape map, CREATE_KEY_MAP, TXA split unaffected.
   v1.0.22 — Auto-fill now derives Logo Initials (ASF rule: first
             letter of up to 3 words, uppercased) and Short Code
             (uppercase alphanumerics of name, first 4 chars) from the
             scraped name. Fill-only-if-empty prefills; operator can
             overtype. Short Code feeds utm_term advertiser click
             reporting per the Jan-2026 UTM design.
   v1.0.21 — TXA Services 1–6 auto-fill: the AI's comma-sep services
             list is split into the six TXA slots (first six entries)
             after scrape, filling only currently-empty slots so
             hand-entered values are never overwritten. (TXA 1–6 had
             never been AI-wired; only services-comma-separated was.)
   v1.0.20 — (1) Create success auto-redirects to /end-customers/{slug}
             after a 600ms success beat. Requires Scenario 111's
             Webhook Response to include "slug" (module 3's Slug
             output) in the customer object; degrades to the in-place
             success screen + console warning if absent. (2) adgen
             deep-link consumer: arriving on the T-A page with
             ?adgenCust={id}&adgenName={name} (from the end-customers
             page's Generate Ad button) stashes the customer on
             window.IX_ADGEN_PRESELECT + sessionStorage and clicks
             Studio's Generate tab once it renders. AdGen does not yet
             read the preselect — future AdGen patch.
   v1.0.19 — new filename (v18 was cached mid-revision at CDN; also
             honors the never-reuse-deployed-filenames rule). Category
             fetch now parses the corrected 112 response shape:
             { categories: [{id, name, parentId}] } — a flat array
             built by Text Aggregators in Make. The prior page1/page2
             design was structurally impossible: webflow:listItems
             emits one bundle PER ITEM, so raw item arrays never
             existed in the webhook response, and the un-aggregated
             scenario would have fired the response 100+ times per
             call. Logs loaded major/sub counts to console on success.
   v1.0.16 — Create wired to Make + async feedback. cmDoCreate no
             longer console.logs and tears down the modal. It now maps
             internal slugs to the 111_IBX_createEditCustomer webhook's
             camelCase contract, POSTs JSON to CFG.webhookUrl
             (clientManagerWebhook), and runs a state machine: button
             disables + spinner + "Adding…" while creating; on the
             Make {ok:true,customer} response shows a "Client
             Successfully Added" card with a Done button; on failure
             shows an inline error and leaves the modal open to retry.
             Modal never disappears mid-flight. Validation moved off
             alert() to inline error. New client is pushed to the list
             and appears when the card is dismissed.
   v1.0.15 — portal query fix (regression from v1.0.14). v1.0.14 moved
             the modal into #cm-modal-portal but several handlers still
             ran mount.querySelector() for modal elements — and the
             modal is no longer in mount. Symptom: Auto-fill always said
             "Enter a website URL first" because it read the (missing)
             input from mount, got null, and fell back to empty state.
             Same breakage affected scroll-restore, dirty-dot updates,
             and footer save-button enable/disable. All modal queries
             now target portal; the list search (.cm-sr) stays on mount.
   v1.0.14 — modal portal (real z-index fix). v1.0.13 raised the
             overlay z-index and suppressed the active tab, but the
             page MASTHEAD then bled through — because the modal was
             rendered inside #client-manager-mount, trapped in the
             page's stacking contexts (tabs, .publisher-wrapper), so
             no z-index could win. v1.0.14 renders the modal into a
             #cm-modal-portal node appended directly to <body>, out of
             the page stacking soup entirely. Nothing on the page can
             bleed through now. The v1.0.13 tab-suppression CSS and
             body.cm-modal-open flag were removed as no longer needed.
             List still renders into #client-manager-mount; page mount
             is cleared while the modal is open and repainted on close.
   v1.0.12 — AI URL scrape on Add Client. A URL bar appears at the top
             of the Add modal only. Operator pastes the client's
             website; POST { url } to the extract-client Worker
             (CFG.extractClientUrl). Returned fields are written into
             M.edit and the modal re-renders — populated fields paint
             gold/dirty via existing logic, ready for review + Create.
             Returned candidate images render as a logo picker; clicking
             one sets logo-link. Nothing auto-commits. Text + logo only;
             other-image (vision) selection is a later phase.
             Mirrors the extract-event precedent.
            publisher/titles-admin read-only
            major→sub cascading category dropdown
            auto-fill parent-category-name/id from major selection
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // ── Config ──
  var CFG = {
    get mountId()    { return 'client-manager-mount'; },
    get webhookUrl() { return window.TA_CONFIG?.clientManagerWebhook || ''; },
    // v1.2.0 — Scenario 114. The create path still uses webhookUrl (111).
    get updateUrl()  { return window.TA_CONFIG?.makeUpdateCustomer || ''; },
    get titleSlug()  { return window.TA_CONFIG?.titleSlug || ''; },
    get taItemId()   { return window.TA_CONFIG?.taItemId || ''; },
    get extractClientUrl() { return window.TA_CONFIG?.extractClientUrl || ''; },
    get subcatUrl() { return window.TA_CONFIG?.getSubcategoriesUrl || ''; },
    // v1.2.4 — the Data Worker base, read off TA_CONFIG.planBoard (as ipp-words does), and Scenario G.
    get workerBase() {                                                   // v1.2.5: planBoard, else planList (HC-P-CFP-6)
      var c = window.TA_CONFIG || {};
      return String(c.planBoard || c.planList || '').replace(/\/(plan-board|plans)(\?.*)?$/, '');
    },
    get studioUrl() { return window.TA_CONFIG?.makeStudio || ''; },
    get salesUrl() { return String(window.TA_CONFIG?.salesUrl || '').replace(/\/+$/, ''); }   // v1.4.0: ix-sales
  };

  var mount = document.getElementById(CFG.mountId);
  if (!mount) { console.warn('[CLIENT MGR] No #' + CFG.mountId + ' found'); return; }

  // v1.0.14: modal portal. The list renders into #client-manager-mount
  // (buried in the page DOM, inside tab/wrapper stacking contexts).
  // The modal renders into a node appended directly to <body> so its
  // z-index actually beats every page element (masthead, tabs, etc.).
  // Patching individual offenders (v1.0.13) was whack-a-mole; portaling
  // out of the page stacking soup fixes the whole class of bug.
  // v1.3.0 — no portal: the record renders into the tab itself. `portal`
  // stays as a name for the record's root so every handler keeps working.
  var portal = mount;
  var oldPortal = document.getElementById('cm-modal-portal');
  if (oldPortal) oldPortal.remove();
  var LIST_SCROLL = 0;   // window scroll of the list when a record opened

  // ── Default field groups ──
  // v1.1.0 reorg (per add-client-reorg-mockup-v0_1): priority-ordered
  // sections, 6-col grid (`w` = column span, default 6/full), System
  // group renders as a collapsed drawer. Field slugs unchanged — edit
  // state, scrape map, CREATE_KEY_MAP, TXA split all keep working.
  var DEFAULT_GROUPS = [
    { id: 'who', label: 'Who', fields: [
      { s: 'name', l: 'Customer Name', t: 'text', w: 3 },
      { s: 'customer-type', l: 'Customer Type', t: 'option', w: 3 },          // v1.2.4: Webflow's choices, read live
      { s: 'expert-contributor', l: 'Expert Contributor', t: 'switch', w: 3 },
      { s: 'client-status', l: 'Client Status', t: 'option', w: 3 }
    ]},
    { id: 'reach', label: 'Reach them', fields: [
      { s: 'address', l: 'Address', t: 'text', w: 3 },
      { s: 'address-2', l: 'Address 2', t: 'text', w: 3 },
      { s: 'city-st-zip', l: 'City, ST Zip', t: 'text', w: 3 },
      { s: 'neighborhood', l: 'Neighborhood', t: 'text', w: 3 },
      { s: 'business-website', l: 'Business Website', t: 'link', w: 2 },
      { s: 'business-phone', l: 'Business Phone', t: 'phone', w: 2 },
      { s: 'business-email', l: 'Business Email', t: 'email', w: 2 }
    ]},
    { id: 'logo', label: 'Logo', fields: [
      { s: 'logo-link', l: 'Logo Link (ULC)', t: 'link', w: 4 },
      { s: 'logo-initials', l: 'Logo Initials', t: 'text', w: 1 },
      { s: 'customer-short-code', l: 'Short Code', t: 'text', w: 1 }
    ]},
    { id: 'directory', label: 'Directory placement', fields: [
      { s: 'major-category', l: 'Major Category', t: 'ref-select', src: 'majors', w: 3 },
      { s: 'business-category', l: 'Business Category', t: 'ref-cascade', src: 'subs', parentField: 'major-category', w: 3 },
      { s: 'directories', l: 'Directories', t: 'readonly', src: 'directories', w: 3 },          // v1.2.4: 114 does not write it yet
      { s: 'directory-tags', l: 'Directory Tags', t: 'readonly', w: 3 },    // v1.2.4: multi-reference picker once 114 maps it
      { s: 'hide-from-directory', l: 'Hide from Directory', t: 'switch', w: 3 },
      { s: 'featured-listing', l: 'Featured Listing', t: 'switch', w: 3 },
      { s: 'parent-category-name', l: 'Parent Category Name', t: 'auto', from: 'major-category', prop: 'name', w: 2 },
      { s: 'parent-category-id', l: 'Parent Category ID', t: 'auto', from: 'major-category', prop: 'id', w: 2 }
    ]},
    { id: 'story', label: 'Story', fields: [
      { s: 'tagline', l: 'Tagline', t: 'text', w: 6 },
      { s: 'long-description', l: 'Long Description', t: 'textarea', w: 6 },
      { s: 'services', l: 'Services (comma-sep)', t: 'text', w: 6 },
      { s: 'txa-services-1', l: 'TXA 1', t: 'text', w: 1 },
      { s: 'txa-services-2', l: 'TXA 2', t: 'text', w: 1 },
      { s: 'txa-services-3', l: 'TXA 3', t: 'text', w: 1 },
      { s: 'txa-services-4', l: 'TXA 4', t: 'text', w: 1 },
      { s: 'txa-services-5', l: 'TXA 5', t: 'text', w: 1 },
      { s: 'txa-services-6', l: 'TXA 6', t: 'text', w: 1 }
    ]},
    { id: 'social', label: 'Social', fields: [
      { s: 'facebook', l: 'Facebook', t: 'link', w: 2 },
      { s: 'instagram', l: 'Instagram', t: 'link', w: 2 },
      { s: 'tiktok', l: 'TikTok', t: 'link', w: 2 },
      { s: 'youtube', l: 'YouTube', t: 'link', w: 2 },
      { s: 'linkedin', l: 'LinkedIn', t: 'link', w: 2 },
      { s: 'x', l: 'X', t: 'link', w: 2 },
      { s: 'pinterest', l: 'Pinterest', t: 'link', w: 2 },
      { s: 'houzz', l: 'Houzz', t: 'link', w: 2 }
    ]},
    // v1.2.4 — the customer's current ad per shape (HC-P-CM124-1). Read and written by id.
    { id: 'current', label: 'Current ads', fields: [
      { s: 'current-banner-ad',  l: 'Banner',  t: 'current-ad', shape: 'banner',  w: 3 },
      { s: 'current-sidebar-ad', l: 'Sidebar', t: 'current-ad', shape: 'sidebar', w: 3 },
      { s: 'current-splash-ad',  l: 'Splash',  t: 'current-ad', shape: 'splash',  w: 3 },
      { s: 'current-text-ad',    l: 'Text ad', t: 'current-ad', shape: 'text',    w: 3 }
    ]},
    { id: 'system', label: 'System & auto-managed', drawer: true, fields: [
      { s: 'slug', l: 'Slug', t: 'readonly', w: 2 },
      { s: 'publisher', l: 'Publisher', t: 'readonly', w: 2 },
      { s: 'titles-admin', l: 'Titles-Admin', t: 'readonly', w: 2 },
      { s: 'profile-status', l: 'Profile Status', t: 'option', w: 2 },
      { s: 'archive-assignment', l: 'Newsletter Archive', t: 'readonly', src: 'archives', w: 2 },   // v1.2.4: 114 does not write these
      { s: 'logo-image', l: 'Logo Image', t: 'readonly', w: 2 },
      { s: 'profile-page-image', l: 'Profile Page Image', t: 'readonly', w: 2 },
      { s: 'self-this-item-id', l: '(Self) This Item ID', t: 'readonly', w: 2 }
    ]}
  ];

  var GROUPS = window.TA_CONFIG?.customerFieldGroups || DEFAULT_GROUPS;

  // Build flat field list for total count
  var ALL_FIELDS = [];
  GROUPS.forEach(function (g) { g.fields.forEach(function (f) { ALL_FIELDS.push(f); }); });
  var TOTAL_FIELDS = ALL_FIELDS.length;

  // ── Read DOM data ──
  // Each .customers-wrapper div IS a customer item with data-* attributes
  var ATTR_MAP = {
    'name': 'name',
    'slug': 'slug',
    'customer-short-code': 'shortCode',
    'logo-initials': 'logoInitials',
    'logo-image': 'logoLink',
    'logo-link': 'logoLink',
    'customer-type': 'customerType',
    'client-status': 'clientStatus',
    'profile-status': 'profileStatus',
    'business-phone': 'phone',
    'business-email': 'email',
    'business-website': 'website',
    'facebook': 'facebook',
    'instagram': 'instagram',
    'tiktok': 'tiktok',
    'youtube': 'youtube',
    'linkedin': 'linkedin',
    'x': 'xTwitter',
    'pinterest': 'pinterest',
    'houzz': 'houzz',
    'default-art-ad-get': 'paidAdUrl',
    'default-sponsorship-ad-link-ulc': 'sponsorshipAd',
    'business-category': 'categoryId',
    'publisher': 'publisherName',
    'publisher-id': 'publisherId',
    'address': 'address',
    'address-2': 'address-2',
    'city-st-zip': 'cityStZip',
    'neighborhood': 'neighborhood',
    'tagline': 'tagline',
    'long-description': 'longDescription',
    'services': 'services',
    'txa-services-1': 'txa-1',
    'txa-services-2': 'txa-2',
    'txa-services-3': 'txa-3',
    'txa-services-4': 'txa-4',
    'txa-services-5': 'txa-5',
    'txa-services-6': 'txa-6',
    'self-this-item-id': 'id'
  };

  // T-A name from DOM (same elements PubPlan reads).
  // v1.1.0: on some pages data-ta carries the record ID, not the name —
  // reject 24-hex values and fall back to the prettified titleSlug
  // ('wyckoff-living-now' → 'Wyckoff Living Now'). Tenant-safe.
  var TA_NAME = document.querySelector('#title-admin-id')?.getAttribute('data-ta')
    || document.querySelector('.ta-wrapper')?.dataset?.titleName
    || '';
  if (!TA_NAME || /^[0-9a-f]{24}$/i.test(TA_NAME)) {
    var slugSrc = (window.TA_CONFIG && window.TA_CONFIG.titleSlug) || '';
    if (slugSrc) {
      TA_NAME = slugSrc.split('-').map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      }).join(' ');
    }
  }

  // Publisher name from first customer item's data-publisher-name
  var firstCustEl = document.querySelector('.customers-wrapper');
  var PUBLISHER_NAME = firstCustEl?.dataset?.publisherName || '';
  var PUBLISHER_ID = firstCustEl?.dataset?.publisherId || '';

  var CM_VERSION = '1.4.4';   // v1.2.0 — the mount log said 1.0.2 while the file said 1.1.4

  var CUSTOMERS = [];
  document.querySelectorAll('.customers-wrapper').forEach(function (el) {
    var d = el.dataset;
    if (!d.id) return;
    var rec = { id: d.id };
    ALL_FIELDS.forEach(function (f) {
      var key = f.s;
      // T-A is page-level, not per-customer
      if (key === 'titles-admin') { rec[key] = TA_NAME; return; }
      // Handle hyphenated dataset keys that don't auto-camelCase
      var attrName = ATTR_MAP[key] || camelCase(key);
      var attr;
      if (attrName.indexOf('-') > -1) {
        // Hyphenated keys need bracket access on dataset
        attr = el.getAttribute('data-' + attrName);
      } else {
        attr = d[attrName];
      }
      if (f.t === 'switch') {
        // v1.2.3 — absent / '' / 'false' all mean OFF. Never null, never
        // undefined: a switch is a boolean and must round-trip as one.
        rec[key] = /^(true|1|yes)$/i.test(String(attr || '').trim());   // v1.4.3: True / Yes too
      } else {
        rec[key] = attr || '';
      }
    });
    CUSTOMERS.push(rec);
  });

  // ── Read reference data from DOM ──
  var REF_DATA = { majors: [], subs: [], directories: [], archives: [] };

  // Categories: majors have no parentId, subs have parentId
  document.querySelectorAll('.client-category-wrapper').forEach(function (el) {
    var d = el.dataset;
    if (!d.id) return;
    var item = { id: d.id, name: d.name || '', parentId: d.parentId || '' };
    if (item.parentId) {
      REF_DATA.subs.push(item);
    } else {
      REF_DATA.majors.push(item);
    }
  });
  REF_DATA.majors.sort(function (a, b) { return a.name.localeCompare(b.name); });
  REF_DATA.subs.sort(function (a, b) { return a.name.localeCompare(b.name); });

  // Directories
  document.querySelectorAll('.directory-wrapper').forEach(function (el) {
    var d = el.dataset;
    if (!d.id) return;
    REF_DATA.directories.push({ id: d.id, name: d.name || '' });
  });

  // Archives
  document.querySelectorAll('.archives-wrapper').forEach(function (el) {
    var d = el.dataset;
    if (!d.id) return;
    REF_DATA.archives.push({ id: d.id, name: d.name || '', slug: d.slug || '' });
  });

  // ── v1.2.4: Webflow's option choices and the customer's ad versions ──
  // OPTS: { <webflow option slug>: [{id,name}] } from /customer-ads customerOptions.
  // APPROVAL_OPTS: { banner|sidebar|splash|text: [{id,name}] }.
  var OPTS = null, APPROVAL_OPTS = null, OPTS_LOADING = false, OPTS_ERROR = '';
  var SHAPE_LABEL = { banner: 'banner', sidebar: 'sidebar', splash: 'splash', text: 'text ad' };   // HC-P-CM124-1
  var APPROVAL_KEY = { banner: 'bannerApproval', sidebar: 'sidebarApproval', splash: 'splashApproval', text: 'textAdApproval' };   // HC-P-CM124-3
  function isCurAd(f) { return f && f.t === 'current-ad'; }
  function fieldOf(slug) { return ALL_FIELDS.find(function (x) { return x.s === slug; }); }
  function wfSlug(slug) { return CM_TO_WF[slug] || slug; }
  function optList(slug) { return (OPTS && OPTS[wfSlug(slug)]) || null; }
  function optIdOf(slug, name) {
    var l = optList(slug) || [], n = String(name == null ? '' : name).trim().toLowerCase();
    var o = l.find(function (x) { return String(x.name).trim().toLowerCase() === n; });
    return o ? o.id : '';
  }
  function approvedOptId(shape) {                                   // HC-P-CM124-2
    var l = (APPROVAL_OPTS && APPROVAL_OPTS[shape]) || [];
    var o = l.find(function (x) { return String(x.name).trim().toLowerCase() === 'approved'; });
    return o ? o.id : '';
  }
  function stagedCount() { return MODAL && MODAL.approve ? Object.keys(MODAL.approve).length : 0; }
  function dirtyCount() {
    if (!MODAL) return 0;
    var dc = 0;
    ALL_FIELDS.forEach(function (f) { if (MODAL.edit[f.s] !== MODAL.orig[f.s]) dc++; });
    return dc + stagedCount();
  }
  function shapeStaged(shape) {
    return Object.keys((MODAL && MODAL.approve) || {}).some(function (k) { return k.split('|')[1] === shape; });
  }
  function repaintKeepScroll() {
    var el = portal.querySelector('.cm-mb'), top = el ? el.scrollTop : 0;
    renderModal();
    var el2 = portal.querySelector('.cm-mb'); if (el2) el2.scrollTop = top;
  }
  // GET /customer-ads (ix-issue-data v1.0.157). Without a customer it answers the option lists only.
  function loadCustomerAds(custId) {
    var base = CFG.workerBase;
    if (!base) {
      OPTS_ERROR = 'TA_CONFIG has neither planBoard nor planList, so the Data Worker cannot be reached.';
      if (MODAL && custId && MODAL.custId === custId) MODAL.ads = { state: 'error', error: OPTS_ERROR };
      if (MODAL) repaintKeepScroll();
      return;
    }
    if (!custId) OPTS_LOADING = true;
    fetch(base + '/customer-ads' + (custId ? '?customer=' + encodeURIComponent(custId) : ''), { cache: 'no-store' })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'HTTP ' + r.status }; }); })
      .then(function (j) {
        if (!j || j.ok !== true) throw new Error((j && j.error) || 'The Data Worker did not answer.');
        OPTS = j.customerOptions || {}; APPROVAL_OPTS = j.approvalOptions || {}; OPTS_ERROR = '';
        if (custId && MODAL && MODAL.custId === custId) {
          // v1.4.3 — switches from the record itself (ix-issue-data v1.0.158+).
          var sw = (j.customer && j.customer.switches) || null;
          if (sw) ALL_FIELDS.forEach(function (f) {
            if (f.t !== 'switch' || !Object.prototype.hasOwnProperty.call(sw, wfSlug(f.s))) return;
            var v = sw[wfSlug(f.s)] === true;
            if (MODAL.edit[f.s] === MODAL.orig[f.s]) MODAL.edit[f.s] = v;
            MODAL.orig[f.s] = v;
            var c = CUSTOMERS.find(function (x) { return x.id === custId; }); if (c) c[f.s] = v;
          });
          MODAL.ads = { state: 'ok', versions: j.versions || {}, approvalFields: j.approvalFields || {}, problems: j.problems || [] };
          ALL_FIELDS.forEach(function (f) {
            if (!isCurAd(f)) return;
            var cur = (j.current && j.current[f.shape]) || '';
            if (MODAL.edit[f.s] === MODAL.orig[f.s]) MODAL.edit[f.s] = cur;   // an edit made meanwhile is kept
            MODAL.orig[f.s] = cur;
          });
          if (j.problems && j.problems.length) console.warn('[CLIENT MGR] /customer-ads problems:', j.problems);
        }
      })
      .catch(function (e) {
        OPTS_ERROR = (e && e.message) || 'The Data Worker did not answer.';
        if (custId && MODAL && MODAL.custId === custId) MODAL.ads = { state: 'error', error: OPTS_ERROR };
        console.warn('[CLIENT MGR] /customer-ads failed:', e);
      })
      .finally(function () { OPTS_LOADING = false; if (MODAL) repaintKeepScroll(); });
  }
  function adVersions(shape) { return (MODAL && MODAL.ads && MODAL.ads.versions && MODAL.ads.versions[shape]) || []; }
  function adById(shape, id) { return adVersions(shape).find(function (v) { return v.id === id; }) || null; }
  function isUrl(v) { return /^https?:\/\//i.test(String(v || '')); }
  function adThumb(v, shape) {
    if (!v) return '';
    if (shape !== 'text' && isUrl(v.picture)) return '<img class="cm-ca-img cm-ca-img--' + shape + '" src="' + esc(v.picture) + '" alt="" loading="lazy">';
    var t = String(v.picture || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return '<span class="cm-ca-txt">' + esc(t.length > 120 ? t.slice(0, 117) + '\u2026' : t) + '</span>';
  }
  function adDate(v) {
    var d = v && v.createdOn ? new Date(v.createdOn) : null;
    return d && !isNaN(d) ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  }
  // One current-ad card, read or edit (v1.2.4).
  function renderCurrentAd(f, spanClass, isAdd) {
    var M = MODAL, val = M.edit[f.s] || '', orig = M.orig[f.s] || '';
    var staged = shapeStaged(f.shape);
    var isDirty = val !== orig || staged;
    var h = '<div class="cm-gi cm-ca' + spanClass + (isDirty ? ' cm-dirty' : '') + '" data-cm-field="' + esc(f.s) + '">';
    var ads = M.ads || { state: 'loading' };
    var cur = adById(f.shape, val);
    h += '<div class="cm-gi-d ' + (val ? 'cm-gi-ok' : 'cm-gi-mt') + '"></div>';
    h += '<span class="cm-gi-l">' + esc(f.l) + '</span>';
    if (isAdd) {
      h += '<div class="cm-gi-v cm-empty">Set after the client is created</div></div>';
      return h;
    }
    if (ads.state === 'loading') { h += '<div class="cm-gi-v cm-empty">Loading\u2026</div></div>'; return h; }
    if (ads.state === 'error') { h += '<div class="cm-gi-v cm-ca-err">' + esc(ads.error || 'Could not load versions') + '</div></div>'; return h; }
    var editing = !!M.editing[f.s];
    if (!editing) {
      if (cur) {
        h += f.shape === 'text'   // v1.3.0: a text ad reads name, then text
          ? '<div class="cm-ca-cur cm-ca-cur--text"><span class="cm-ca-nm">' + esc(cur.name) + '</span>' + adThumb(cur, f.shape) + '</div>'
          : '<div class="cm-ca-cur">' + adThumb(cur, f.shape) + '<span class="cm-ca-nm">' + esc(cur.name) + '</span></div>';
      } else if (val) {
        h += '<div class="cm-gi-v cm-ca-err">The current ' + SHAPE_LABEL[f.shape] + ' is archived or no longer this customer\u2019s.</div>';
      } else {
        var quiet = f.shape === 'sidebar' && M.edit['current-banner-ad'];
        h += '<div class="cm-gi-v cm-empty">' + (quiet ? 'No sidebar yet' : 'none') + '</div>';
      }
      h += '<div class="cm-gi-act">';
      if (isDirty) h += '<button class="cm-cancel-lk" onclick="cmRevertField(\'' + esc(f.s) + '\')">cancel</button>';
      h += '<button class="cm-pen" onclick="cmToggleEdit(\'' + esc(f.s) + '\')" title="Edit">' + penSvg('#8a8a7a') + '</button></div>';
      h += '</div>';
      return h;
    }
    var vs = adVersions(f.shape), apId = approvedOptId(f.shape);
    var ok = vs.filter(function (v) { return v.selectable || M.approve[v.id + '|' + f.shape] === apId; });
    var wait = vs.filter(function (v) { return !v.selectable && M.approve[v.id + '|' + f.shape] !== apId; });
    h += '<div class="cm-ca-list">';
    if (!vs.length) h += '<div class="cm-empty cm-ca-none">No ' + SHAPE_LABEL[f.shape] + ' versions for this customer.</div>';
    ok.forEach(function (v) {
      var sel = v.id === val, st = M.approve[v.id + '|' + f.shape];
      h += '<button type="button" class="cm-ca-row' + (sel ? ' is-sel' : '') + '" onclick="cmPickAd(\'' + f.shape + '\',\'' + esc(v.id) + '\')">' +
           '<span class="cm-ca-radio"></span>' + adThumb(v, f.shape) +
           '<span class="cm-ca-meta"><span class="cm-ca-nm">' + esc(v.name) + '</span><span class="cm-ca-dt">' + esc(adDate(v)) + (v.draft ? ' \u00B7 draft' : '') + '</span></span>' +
           (st ? '<span class="cm-ca-st">approves on Save <span class="cm-ca-undo" onclick="event.stopPropagation();cmUnapproveAd(\'' + f.shape + '\',\'' + esc(v.id) + '\')">undo</span></span>' : '') +
           '</button>';
    });
    if (wait.length) {
      h += '<div class="cm-ca-div">Not approved yet</div>';
      wait.forEach(function (v) {
        h += '<div class="cm-ca-row is-off">' + adThumb(v, f.shape) +
             '<span class="cm-ca-meta"><span class="cm-ca-nm">' + esc(v.name) + '</span><span class="cm-ca-dt">' + esc(v.approval || 'Not approved') + (adDate(v) ? ' \u00B7 ' + esc(adDate(v)) : '') + '</span></span>' +
             (apId ? '<button type="button" class="cm-ca-ap" onclick="cmApproveAd(\'' + f.shape + '\',\'' + esc(v.id) + '\')">Approve</button>' : '') +
             '</div>';
      });
    }
    h += '</div>';
    h += '<div class="cm-gi-act">';
    if (isDirty) h += '<button class="cm-cancel-lk" onclick="cmRevertField(\'' + esc(f.s) + '\')">cancel</button>';
    h += '<button class="cm-pen" onclick="cmToggleEdit(\'' + esc(f.s) + '\')" title="Close">' + penSvg('#1a3a3a') + '</button></div>';
    h += '</div>';
    return h;
  }

  // ══ v1.4.0 · THE CLIENT PAGE ════════════════════════════════════
  var REC_TABS = [                                                  // HC-P-CM140-1
    { k: 'overview', l: 'Overview' }, { k: 'creative', l: 'Creative' }, { k: 'commitments', l: 'Commitments' },
    { k: 'account', l: 'Account' }, { k: 'billing', l: 'Billing' }
  ];
  var ACCOUNT_GROUPS = ['who', 'reach', 'logo', 'directory', 'story', 'social', 'system'];
  var SHAPES_ORDER = ['banner', 'sidebar', 'text', 'splash'];
  var SHAPE_NOTE = {
    banner: 'The current banner runs on the site now, and in every email from the next send. A sent email keeps what it ran.',
    sidebar: 'Runs beside the banner on the site rail. Optional: the banner runs alone without it.',
    text: 'Runs in The Find.',
    splash: 'The full-screen splash.'
  };
  function optName(list, id) { var o = (list || []).find(function (x) { return String(x.id) === String(id); }); return o ? o.name : ''; }
  function sentBackOptId(shape) {                                   // HC-P-CM140-2
    var l = (APPROVAL_OPTS && APPROVAL_OPTS[shape]) || [];
    var o = l.find(function (x) { return String(x.name).trim().toLowerCase() === 'sent back'; });
    return o ? o.id : '';
  }
  function curField(shape) { return ALL_FIELDS.find(function (f) { return isCurAd(f) && f.shape === shape; }); }
  function isWaiting(v) { return !v.selectable && String(v.approval || '').trim().toLowerCase() !== 'sent back'; }

  // ix-sales: the customer's sales records (Commitments), with the page's Memberstack login.
  function memberToken() {
    return new Promise(function (res) {
      var n = 0;
      (function wait() {
        var ms = window.$memberstackDom;
        if (ms && ms.getMemberCookie) { Promise.resolve(ms.getMemberCookie()).then(function (t) { res(t || ''); }, function () { res(''); }); return; }
        if (++n > 40) { res(''); return; }
        setTimeout(wait, 150);
      })();
    });
  }
  function loadSales(custId) {
    var M = MODAL;
    if (!CFG.salesUrl) { M.sales = { state: 'error', error: 'TA_CONFIG.salesUrl is not set, so commitments cannot be read.' }; return; }
    if (!PUBLISHER_ID) { M.sales = { state: 'error', error: 'The page names no publisher, so commitments cannot be read.' }; return; }
    M.sales = { state: 'loading' };
    memberToken().then(function (tok) {
      if (!tok) throw new Error('No Memberstack login on this page, so ix-sales cannot be asked.');
      return fetch(CFG.salesUrl + '/sales?publisher=' + encodeURIComponent(PUBLISHER_ID), { headers: { Authorization: 'Bearer ' + tok }, cache: 'no-store' });
    }).then(function (r) { return r.json().catch(function () { return { ok: false, error: 'HTTP ' + r.status }; }); })
      .then(function (j) {
        if (!j || j.ok !== true) throw new Error((j && j.error) || 'ix-sales did not answer.');
        if (MODAL && MODAL.custId === custId) MODAL.sales = { state: 'ok', rows: (j.sales || []).filter(function (r) { return r.customerId === custId; }) };
      })
      .catch(function (e) { if (MODAL && MODAL.custId === custId) MODAL.sales = { state: 'error', error: (e && e.message) || 'ix-sales did not answer.' }; })
      .finally(function () { if (MODAL && MODAL.custId === custId) repaintKeepScroll(); });
  }

  function needsYou() {
    var M = MODAL, items = [];
    var waiting = 0;
    SHAPES_ORDER.forEach(function (sh) { adVersions(sh).forEach(function (v) { if (isWaiting(v) && !M.approve[v.id + '|' + sh]) waiting++; }); });
    if (waiting) items.push({ dot: 'g', text: waiting + ' ad version' + (waiting > 1 ? 's' : '') + ' waiting for approval', go: 'creative', act: 'Review' });
    if (M.sales && M.sales.state === 'ok') {
      var due = 0, missed = 0;
      M.sales.rows.forEach(function (r) { var b = r.board || {}; due += b.due || 0; missed += b.missed || 0; });
      if (due) items.push({ dot: 's', text: due + ' send' + (due > 1 ? 's' : '') + ' due now and not placed in an issue', go: 'commitments', act: 'Open' });
      if (missed) items.push({ dot: 's', text: missed + ' missed send' + (missed > 1 ? 's' : '') + ' with no make good', go: 'commitments', act: 'Open' });
    }
    if (M.ads && M.ads.state === 'ok') {
      SHAPES_ORDER.forEach(function (sh) {
        var f = curField(sh), val = f && M.edit[f.s];
        if (val && !adById(sh, val)) items.push({ dot: 's', text: 'The current ' + SHAPE_LABEL[sh] + ' is archived or no longer this customer\u2019s', go: 'creative', act: 'Fix' });
      });
      if (M.edit['current-banner-ad'] && !M.edit['current-sidebar-ad'])
        items.push({ dot: 'q', text: 'No sidebar yet. The banner runs alone on the site rail.', go: 'creative', act: 'Creative' });
    }
    return items;
  }

  function boardDots(b) {
    var h = '', add = function (n, cls) { for (var i = 0; i < (n || 0); i++) h += '<span class="cm-b ' + cls + '"></span>'; };
    add(b.ran, 'ran'); add(b.planned, 'pl'); add(b.missed, 'miss'); add(b.due, 'due'); add(b.toCome, 'tc');
    return h;
  }
  function boardBar(b, qty) {
    var t = Math.max(1, qty || 0), seg = function (n, cls) { return n ? '<i class="' + cls + '" style="width:' + (n / t * 100) + '%"></i>' : ''; };
    return '<span class="cm-bar">' + seg(b.ran, 'ran') + seg(b.planned, 'pl') + seg(b.due, 'due') + seg(b.missed, 'miss') + '</span>';
  }
  function boardSum(b, qty) {
    var p = [(b.ran || 0) + ' of ' + (qty || 0) + ' ran'];
    if (b.planned) p.push(b.planned + ' planned'); if (b.due) p.push(b.due + ' due now'); if (b.missed) p.push(b.missed + ' missed');
    return p.join(' \u00b7 ');
  }
  function fmtYm(ym) {
    var m = /^(\d{4})-(\d{2})/.exec(ym || ''); if (!m) return '';
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m[2] - 1] + ' \u2019' + m[1].slice(2);
  }
  function salesState(r) {
    var b = r.board || {};
    if (String(r.status).toLowerCase() === 'ended') return '<span class="cm-chip plain">Ended</span>';
    if (b.missed) return '<span class="cm-chip warn">Missed</span>';
    if (b.due) return '<span class="cm-chip warn">Due now</span>';
    return '<span class="cm-chip ok">On track</span>';
  }
  function emptyLine(t) { return '<div class="cm-quiet">' + esc(t) + '</div>'; }

  function recOverview() {
    var M = MODAL, h = '<div class="cm-grid">';
    var items = needsYou();
    h += '<div class="cm-card cm-span-7' + (items.length ? ' attn' : '') + '"><h3>Needs you</h3>';
    if (!items.length) h += emptyLine((M.ads && M.ads.state === 'loading') || (M.sales && M.sales.state === 'loading') ? 'Checking\u2026' : 'Nothing needs you.');
    else {
      h += '<ul class="cm-todo">';
      items.forEach(function (it) { h += '<li><span class="cm-dot ' + it.dot + '"></span><span>' + esc(it.text) + '</span><button class="cm-lk cm-act" onclick="cmTab(\'' + it.go + '\')">' + esc(it.act) + '</button></li>'; });
      h += '</ul>';
    }
    h += '</div>';
    h += '<div class="cm-card cm-span-5"><h3>Commitments <button class="cm-lk" onclick="cmTab(\'commitments\')">All \u2192</button></h3>';
    var S = M.sales || { state: 'loading' };
    if (S.state === 'loading') h += emptyLine('Loading\u2026');
    else if (S.state === 'error') h += '<div class="cm-err">' + esc(S.error) + '</div>';
    else {
      var live = S.rows.filter(function (r) { return String(r.status).toLowerCase() !== 'ended'; });
      if (!live.length) h += emptyLine('No active sales records.');
      live.slice(0, 4).forEach(function (r) {
        h += '<div class="cm-cm"><b>' + esc(r.product || r.name) + ' \u00b7 ' + esc(r.frequency || '') + '</b> <span class="cm-quiet">\u00b7 ' + esc(r.type || '') + ' \u00b7 ' + esc(fmtYm(r.runFrom)) + ' to ' + esc(fmtYm(r.runTo)) + '</span>' +
             '<div class="cm-board">' + boardDots(r.board || {}) + '</div><div class="cm-sum">' + esc(boardSum(r.board || {}, r.qty)) + '</div></div>';
      });
    }
    h += '</div>';
    h += '<div class="cm-card cm-span-8"><h3>Current ads <button class="cm-lk" onclick="cmTab(\'creative\')">Creative \u2192</button></h3>';
    if (!M.ads || M.ads.state === 'loading') h += emptyLine('Loading\u2026');
    else if (M.ads.state === 'error') h += '<div class="cm-err">' + esc(M.ads.error) + '</div>';
    else {
      h += '<div class="cm-run">';
      ['banner', 'sidebar', 'text'].forEach(function (sh) {
        var f = curField(sh), v = f && adById(sh, M.edit[f.s]);
        h += '<div class="cm-slot"><div class="cm-k">' + esc(f ? f.l : sh) + '</div>';
        if (v) h += adThumb(v, sh) + '<div class="cm-w">' + esc(v.name) + '</div>';
        else h += '<div class="cm-emptybox">' + (sh === 'sidebar' && M.edit['current-banner-ad'] ? 'No sidebar yet' : 'None') + '</div>';
        h += '</div>';
      });
      h += '</div>';
    }
    h += '</div>';
    h += '<div class="cm-card cm-span-4"><h3>Contact <button class="cm-lk" onclick="cmTab(\'account\')">Account \u2192</button></h3><dl class="cm-kv">';
    [['business-phone', 'Phone'], ['business-email', 'Email'], ['contact-website', 'Website'], ['address', 'Address'], ['city-st-zip', '']].forEach(function (p) {
      var v = M.edit[p[0]]; if (!v) return;
      h += '<dt>' + esc(p[1]) + '</dt><dd>' + esc(String(v)) + '</dd>';
    });
    h += '</dl></div>';
    h += '</div>';
    return h;
  }

  function verCard(v, sh, curId) {
    var M = MODAL, st = M.approve[v.id + '|' + sh], apId = approvedOptId(sh), sbId = sentBackOptId(sh);
    var isCur = v.id === curId, isOrigCur = v.id === M.orig[curField(sh).s];
    var cls = 'cm-ver' + (isCur ? ' cur' : '') + (isWaiting(v) && !st ? ' wait' : '') + (st || (isCur && !isOrigCur) ? ' gold' : '');
    var label = st ? (optName(APPROVAL_OPTS[sh], st) + ' on Save') : (v.approval || 'Not approved');
    var h = '<div class="' + cls + '">' + (adThumb(v, sh) || '<div class="cm-emptybox">No picture</div>') +
            '<div class="cm-nm" title="' + esc(v.name) + '">' + esc(v.name) + '</div>' +
            '<div class="cm-mt">' + esc(adDate(v)) + ' \u00b7 ' + esc(label) + (v.draft ? ' \u00b7 draft' : '') + '</div><div class="cm-vrow">';
    if (st) h += '<button class="cm-cancel" onclick="cmUnapproveAd(\'' + sh + '\',\'' + esc(v.id) + '\')">undo</button>';
    else if (isCur) h += '<span class="cm-chip ok">Current</span>';
    else if (v.selectable) h += '<button class="cm-lk" onclick="cmPickAd(\'' + sh + '\',\'' + esc(v.id) + '\')">Make current</button>';
    else if (isWaiting(v)) {
      if (apId) h += '<button class="cm-lk" onclick="cmApproveAd(\'' + sh + '\',\'' + esc(v.id) + '\')">Approve &amp; make current</button>';
      if (sbId) h += '<button class="cm-lk cm-lk-q" onclick="cmSendBackAd(\'' + sh + '\',\'' + esc(v.id) + '\')">Send back</button>';
    }
    if (isCur && !isOrigCur && !st) h += '<button class="cm-cancel" onclick="cmRevertField(\'' + esc(curField(sh).s) + '\')">cancel</button>';
    return h + '</div></div>';
  }
  function recCreative() {
    var M = MODAL;
    if (!M.ads || M.ads.state === 'loading') return '<div class="cm-card">' + emptyLine('Loading the versions\u2026') + '</div>';
    if (M.ads.state === 'error') return '<div class="cm-card"><div class="cm-err">' + esc(M.ads.error) + '</div></div>';
    var h = '<div class="cm-card">';
    SHAPES_ORDER.forEach(function (sh) {
      var f = curField(sh), vs = adVersions(sh), curId = M.edit[f.s];
      h += '<div class="cm-shape"><div><div class="cm-lbl">' + esc(f.l) + '</div><div class="cm-sub">' + esc(SHAPE_NOTE[sh]) + '</div></div><div class="cm-vers">';
      if (!vs.length) h += '<div class="cm-ver"><div class="cm-emptybox" style="height:72px">No ' + esc(SHAPE_LABEL[sh]) + ' versions</div><div class="cm-mt">Make one in Studio \u203a Ad Reformat.</div></div>';
      // waiting first, then current, then the rest — newest first inside each
      var order = vs.filter(isWaiting).concat(vs.filter(function (v) { return v.id === curId && !isWaiting(v); }), vs.filter(function (v) { return v.id !== curId && !isWaiting(v); }));
      order.forEach(function (v) { h += verCard(v, sh, curId); });
      if (curId && !adById(sh, curId)) h += '<div class="cm-ver gold"><div class="cm-emptybox" style="height:72px">Current version not found</div><div class="cm-mt">Archived, or no longer this customer\u2019s. Make another current.</div></div>';
      h += '</div></div>';
    });
    return h + '</div>';
  }
  function recCommitments() {
    var S = MODAL.sales || { state: 'loading' };
    var h = '<div class="cm-card"><h3>What they bought</h3>';
    if (S.state === 'loading') return h + emptyLine('Loading\u2026') + '</div>';
    if (S.state === 'error') return h + '<div class="cm-err">' + esc(S.error) + '</div></div>';
    if (!S.rows.length) return h + emptyLine('No sales records for this client. Add one in the Publisher Portal\u2019s Obligations tab.') + '</div>';
    h += '<div class="cm-tblw"><table class="cm-rtbl"><tr><th>Record</th><th>Product</th><th>Type</th><th>Runs</th><th>Frequency</th><th>Qty</th><th>Remaining</th><th>Board</th><th>Status</th></tr>';
    S.rows.forEach(function (r) {
      var b = r.board || {};
      h += '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.product || '') + '</td><td>' + esc(r.type || '') + '</td><td>' + esc(fmtYm(r.runFrom)) + ' to ' + esc(fmtYm(r.runTo)) +
           '</td><td>' + esc(r.frequency || '') + '</td><td>' + (r.qty || 0) + '</td><td>' + (r.remaining || 0) + (r.missedOwed ? ' (' + r.missedOwed + ' missed)' : '') +
           '</td><td title="' + esc(boardSum(b, r.qty)) + '">' + boardBar(b, r.qty) + '</td><td>' + salesState(r) + '</td></tr>';
    });
    return h + '</table></div><div class="cm-quiet" style="margin-top:10px">Each record\u2019s sends, make goods and edits live in the Publisher Portal\u2019s Obligations tab.</div></div>';
  }
  function readVal(f) {
    var v = MODAL.edit[f.s];
    if (f.t === 'switch') return (v === true || v === 'true' || v === '1') ? 'Yes' : 'No';
    if (v === '' || v === null || v === undefined || v === false) return '';
    if (f.src) return refName(f.src, v) || String(v);
    if (f.t === 'ref-select' && f.src) return refName(f.src, v) || String(v);
    if (f.s === 'major-category') return refName('majors', v) || String(v);
    if (f.s === 'section') return refName('subs', v) || String(v);
    return String(v);
  }
  function recAccount() {
    var M = MODAL, h = '<div class="cm-grid acct">';
    GROUPS.forEach(function (g) {
      if (ACCOUNT_GROUPS.indexOf(g.id) < 0) return;
      var open = !!(M.groupOpen && M.groupOpen[g.id]);
      var dirty = g.fields.some(function (f) { return M.edit[f.s] !== M.orig[f.s]; });
      h += '<div class="cm-card cm-span-6' + (dirty ? ' dirty' : '') + '"><h3>' + esc(g.label) +
           '<button class="cm-lk" onclick="cmEditGroup(\'' + g.id + '\')">' + (open ? 'Done' : 'Edit') + '</button></h3>';
      if (open) {
        h += '<div class="cm-gr">';
        g.fields.forEach(function (f) { h += renderField(f, false); });
        h += '</div>';
      } else {
        h += '<dl class="cm-kv">';
        g.fields.forEach(function (f) {
          var v = readVal(f), d = M.edit[f.s] !== M.orig[f.s];
          var isLink = /^https?:\/\//i.test(v);
          var shown = !v ? '<span class="cm-quiet">\u2014</span>'
            : (isLink && f.s === 'logo-link') ? '<img class="cm-logo-read" src="' + esc(v) + '" alt="">'   // v1.4.1
            : isLink ? '<span title="' + esc(v) + '">' + esc(v.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')) + '</span>'
            : esc(v);
          var cls = [d ? 'chg' : '', isLink && f.s !== 'logo-link' ? 'lnk' : ''].filter(Boolean).join(' ');
          h += '<dt>' + esc(f.l) + '</dt><dd' + (cls ? ' class="' + cls + '"' : '') + '>' + shown + '</dd>';
        });
        h += '</dl>';
      }
      h += '</div>';
    });
    return h + '</div>';
  }
  function recBilling() {
    return '<div class="cm-placeholder"><b>Billing has no data yet.</b><br>Sales records say what was sold (Paid or Comp, sends, months) but hold no price, invoice or payment.<br>This tab waits until there is a billing source to read.</div>';
  }

  function renderRecord() {
    var M = MODAL, dc = dirtyCount();
    if (!M.tab) M.tab = 'overview';
    var items = needsYou();
    var waiting = 0; SHAPES_ORDER.forEach(function (sh) { adVersions(sh).forEach(function (v) { if (isWaiting(v) && !M.approve[v.id + '|' + sh]) waiting++; }); });
    var owed = 0; if (M.sales && M.sales.state === 'ok') M.sales.rows.forEach(function (r) { var b = r.board || {}; owed += (b.due || 0) + (b.missed || 0); });
    var counts = { creative: waiting, commitments: owed };
    var status = M.edit['client-status'] || '';
    var sCls = /^active$/i.test(status) ? 'ok' : (/inactive|paused/i.test(status) ? 'plain' : 'warn');
    var cat = refName('majors', M.edit['major-category']) || '';

    var h = '<div class="cm-rec cm-pl ix-own">';
    h += '<button type="button" class="cm-back" onclick="cmCloseModal()">\u2190 All clients</button>';
    h += '<div class="cm-hdr"><div style="min-width:0"><div class="cm-eyebrow">Clients \u00b7 Client</div>';
    h += '<h1 class="cm-h1">' + esc(M.edit.name || 'Unnamed') + '</h1><div class="cm-facts">';
    if (status) h += '<span class="cm-chip ' + sCls + '">\u25cf ' + esc(status) + '</span>';
    if (M.edit['customer-type']) h += '<span>' + esc(M.edit['customer-type']) + '</span>';
    if (cat) h += '<span>' + esc(cat) + '</span>';
    if (items.length) h += '<span class="cm-chip warn">' + items.length + ' need' + (items.length === 1 ? 's' : '') + ' you</span>';
    h += '</div></div><div class="cm-hdr-r">' + infoBadge() + '</div></div>';

    h += '<div class="cm-tabs">';
    REC_TABS.forEach(function (t) {
      h += '<button class="cm-tab' + (M.tab === t.k ? ' on' : '') + '" onclick="cmTab(\'' + t.k + '\')">' + esc(t.l) +
           (counts[t.k] ? '<span class="cm-ct">' + counts[t.k] + '</span>' : '') + '</button>';
    });
    h += '</div><div class="cm-pane">';
    h += M.tab === 'creative' ? recCreative() : M.tab === 'commitments' ? recCommitments() : M.tab === 'account' ? recAccount() : M.tab === 'billing' ? recBilling() : recOverview();
    h += '</div>';

    h += '<div class="asm-save-bar cm-save' + (dc > 0 ? ' has-changes' : '') + '"><div class="cm-mf-l">';
    h += '<span class="cm-mf-dc">' + (dc > 0 ? dc + ' unsaved change' + (dc > 1 ? 's' : '') : 'No unsaved changes') + '</span>';
    h += '</div><div class="asm-save-right cm-mf-r">';
    if (dc > 0) h += '<button class="asm-cancel-link cm-mf-ca" onclick="cmCancelAll()">cancel</button>';
    h += '<button class="cm-mf-sv cm-pbtn"' + (dc === 0 ? ' disabled' : '') + ' onclick="cmDoSave(false)">Save</button>';
    h += '<button class="cm-mf-pub cm-pbtn ghost"' + (dc === 0 ? ' disabled' : '') + ' onclick="cmDoSave(true)">Save &amp; Publish</button>';
    h += '</div></div></div>';
    mount.innerHTML = h;
  }

  // Portal fonts, once (HC-P-CM140-3).
  (function () {
    if (document.getElementById('cm-portal-fonts')) return;
    var l = document.createElement('link');
    l.id = 'cm-portal-fonts'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Josefin+Sans:wght@600;700&family=Sen:wght@400;600;700&display=swap';
    document.head.appendChild(l);
  })();

  // Lookup helpers
  function refName(src, id) {
    var list = REF_DATA[src] || [];
    var item = list.find(function (x) { return x.id === id; });
    return item ? item.name : '';
  }
  function subsForMajor(majorId) {
    return REF_DATA.subs.filter(function (s) { return s.parentId === majorId; });
  }

  // v1.0.18: the DOM's client-category-source list is capped at Webflow's
  // 100-item render ceiling, and with 20 majors + 145 (growing) subs, most
  // categories never make it into REF_DATA at all — this hits BOTH the
  // Major dropdown and the Minor cascade, not just Minor. Fix: fetch the
  // full collection once (live, paginated Make-side past the 100-item cap)
  // when a modal opens, and overwrite REF_DATA.majors/subs wholesale from
  // that response. One fetch covers both dropdowns — the
  // 112_IBX_getBusinessSubcategories webhook already returns the whole
  // collection regardless of what majorId is posted, so there's no need
  // for a separate per-major call; simpler and it can't return a partial
  // subset because there's no per-major filtering happening in Make.
  //
  // CORRECTION from the first pass: the parent relationship used to filter
  // subs from majors is the "Parent ID" field (data-parent-id in the DOM,
  // confirmed against a real CMS record), NOT a "parent-category-bc"
  // reference field — that was an unverified guess in the prior version
  // and is almost certainly why subcategory results came back incomplete.
  var CATEGORIES_LIVE = false;
  var CATEGORIES_LOADING = false;

  function ensureLiveCategories() {
    if (CATEGORIES_LIVE || CATEGORIES_LOADING) return;
    if (!CFG.subcatUrl) {
      console.warn('[CLIENT MGR] Category endpoint not configured (TA_CONFIG.getSubcategoriesUrl) — Major/Minor dropdowns stay on the DOM-capped list.');
      return;
    }
    CATEGORIES_LOADING = true;
    if (MODAL) renderModal(); // shows "Loading categories…" in both dropdowns

    fetch(CFG.subcatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
      .then(function (res) { return res.json().catch(function () { throw new Error('Bad response'); }); })
      .then(function (data) {
        if (!data || !data.ok) throw new Error((data && data.error) || 'Category fetch failed');
        // v1.0.19: scenario 112 now returns a flat pre-shaped array —
        // { categories: [{id, name, parentId}, ...] } — built by Text
        // Aggregators in Make (List Items outputs one bundle per item, so
        // the raw page1/page2 arrays of the earlier design never actually
        // existed in Make's response). Empty parentId = Major.
        var cats = data.categories || [];
        var majors = [];
        var subs = [];
        cats.forEach(function (it) {
          if (!it || !it.id) return;
          var item = { id: it.id, name: it.name || '', parentId: it.parentId || '' };
          if (item.parentId) subs.push(item); else majors.push(item);
        });
        majors.sort(function (a, b) { return a.name.localeCompare(b.name); });
        subs.sort(function (a, b) { return a.name.localeCompare(b.name); });
        REF_DATA.majors = majors;
        REF_DATA.subs = subs;
        CATEGORIES_LIVE = true;
        console.log('[CLIENT MGR] Live categories loaded: ' + majors.length + ' majors, ' + subs.length + ' subs');
      })
      .catch(function (err) {
        console.warn('[CLIENT MGR] Category fetch failed, staying on DOM-capped list:', err && err.message);
      })
      .finally(function () {
        CATEGORIES_LOADING = false;
        if (MODAL) renderModal();
      });
  }

  // Derive major-category from business-category for each customer
  CUSTOMERS.forEach(function (c) {
    var subId = c['business-category'];
    if (subId && !c['major-category']) {
      var sub = REF_DATA.subs.find(function (s) { return s.id === subId; });
      if (sub && sub.parentId) {
        c['major-category'] = sub.parentId;
        var major = REF_DATA.majors.find(function (m) { return m.id === sub.parentId; });
        if (major) {
          c['parent-category-name'] = major.name;
          c['parent-category-id'] = major.id;
        }
      }
    }
  });

  // ── State ──
  var FILTER = 'all';
  var SEARCH = '';
  var SORT_COL = 'name';
  var SORT_DIR = 1;
  var MOD_INCOMPLETE = false;
  var SELECTED = {};
  var MODAL = null;       // { mode:'edit'|'add', custId:string, orig:{}, edit:{}, editing:{} }

  // ── Utilities ──
  function camelCase(s) {
    return s.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); });
  }
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function truncUrl(u) {
    var p = String(u).replace(/^https?:\/\//, '');
    return p.length > 32 ? p.substring(0, 29) + '...' : p;
  }
  function initials(name) {
    return String(name).split(/\s+/).map(function (w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
  }
  function filledCount(rec) {
    var n = 0;
    ALL_FIELDS.forEach(function (f) {
      var v = rec[f.s];
      if (v !== '' && v !== false && v !== undefined && v !== null) n++;
    });
    return n;
  }
  function profileStatus(rec) {
    var ps = rec['profile-status'] || rec['client-status'] || '';
    return ps.toLowerCase();
  }
  function statusOrder(s) { return s === 'active' ? 0 : s === 'paused' ? 1 : s === 'prospect' ? 2 : s === 'inactive' ? 3 : 4; }
  function typeOrder(s) { var v = String(s).toLowerCase(); return v === 'advertiser' ? 0 : v === 'sponsor' ? 1 : v === 'contributor' ? 2 : 3; }
  function profOrder(s) { return s === 'complete' ? 0 : 1; }

  var AVATAR_COLORS = ['#2d6a4f', '#6b2fa0', '#1a5276', '#8a6400', '#7a3b1e', '#1a5e8a', '#c07010', '#993556', '#5f5e5a', '#639922'];
  function avatarColor(id) {
    var n = 0; for (var i = 0; i < id.length; i++) n += id.charCodeAt(i);
    return AVATAR_COLORS[n % AVATAR_COLORS.length];
  }

  // ── Filtering & sorting ──
  function getVisible() {
    var list = CUSTOMERS.filter(function (c) {
      if (SEARCH && c.name.toLowerCase().indexOf(SEARCH.toLowerCase()) < 0) return false;
      var st = (c['client-status'] || '').toLowerCase();
      if (FILTER === 'active' && st !== 'active') return false;
      if (FILTER === 'prospect' && st !== 'prospect') return false;
      if (FILTER === 'paused' && st !== 'paused') return false;
      if (FILTER === 'inactive' && st !== 'inactive') return false;
      if (MOD_INCOMPLETE) {
        var ps = (c['profile-status'] || '').toLowerCase();
        if (ps !== 'incomplete' && ps !== 'new' && ps !== '') return true; // show if NOT complete
        if (ps === 'complete') return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      var va, vb;
      if (SORT_COL === 'name') {
        va = a.name.toLowerCase(); vb = b.name.toLowerCase();
        return va < vb ? -SORT_DIR : va > vb ? SORT_DIR : 0;
      }
      if (SORT_COL === 'status') {
        va = statusOrder((a['client-status'] || '').toLowerCase());
        vb = statusOrder((b['client-status'] || '').toLowerCase());
        return (va - vb) * SORT_DIR || (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
      }
      if (SORT_COL === 'type') {
        va = typeOrder(a['customer-type']); vb = typeOrder(b['customer-type']);
        return (va - vb) * SORT_DIR || (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
      }
      if (SORT_COL === 'profile') {
        va = profOrder((a['profile-status'] || '').toLowerCase());
        vb = profOrder((b['profile-status'] || '').toLowerCase());
        return (va - vb) * SORT_DIR || (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
      }
      return 0;
    });
    return list;
  }

  function incompleteCount() {
    return CUSTOMERS.filter(function (c) {
      var st = (c['client-status'] || '').toLowerCase();
      if (FILTER === 'active' && st !== 'active') return false;
      if (FILTER === 'prospect' && st !== 'prospect') return false;
      if (FILTER === 'paused' && st !== 'paused') return false;
      if (FILTER === 'inactive' && st !== 'inactive') return false;
      var ps = (c['profile-status'] || '').toLowerCase();
      return ps !== 'complete';
    }).length;
  }

  function selCount() {
    var n = 0; for (var k in SELECTED) if (SELECTED[k]) n++; return n;
  }

  // ── Inject CSS ──
  var style = document.createElement('style');
  style.textContent = getCss();
  document.head.appendChild(style);

  // ── Render ──
  function render() {
    // v1.0.14: modal renders into the body-level portal; list renders
    // into the page mount. When no modal is open, clear the portal.
    if (MODAL) { renderModal(); return; }
    var vis = getVisible();
    var counts = countByStatus();
    var ic = incompleteCount();
    var sc = selCount();

    var h = '';

    // Header
    // v1.1.4: header via the shared component. Subtitle is now the
    //         live TITLE name (same on every tab) — the old
    //         "ADVERTISERS · CONTRIBUTORS · SPONSORS" line is dropped
    //         so all tabs read identically.
    var _cmAdd = '<button class="cm-add-btn" onclick="cmAddClient()">+ Add Client</button>';
    h += (window.IxHeader && IxHeader.render)
      ? IxHeader.render({ icon: '&#x1F465;', title: 'Clients', actions: [_cmAdd] })
      : '<div class="ix-hdr"><div class="ix-hdr-left"><div class="ix-hdr-icon">&#x1F465;</div><div><h3>Clients</h3></div></div><div class="ix-hdr-right">' + _cmAdd + '</div></div>';

    // Filter pills
    // v1.1.3: filter row is now the banded Row 2 (.ix-tabs-l1),
    //         shared with Studio's channel tabs.
    h += '<div class="cm-tb ix-tabs-l1">';
    h += pill('all', 'All ' + CUSTOMERS.length, FILTER === 'all', 'on');
    h += pill('active', 'Active ' + counts.active, FILTER === 'active', 'gn');
    h += pill('prospect', 'Prospect ' + counts.prospect, FILTER === 'prospect', 'bl');
    h += pill('paused', 'Paused ' + counts.paused, FILTER === 'paused', 'am');
    h += pill('inactive', 'Inactive ' + counts.inactive, FILTER === 'inactive', 'rd');
    h += '<div class="cm-sp"></div>';
    h += '<input class="cm-sr" type="text" placeholder="Search\u2026" value="' + esc(SEARCH) + '" oninput="cmSearch(this.value)">';
    h += '</div>';

    // Modifier row
    h += '<div class="cm-mr"><label class="cm-mt' + (MOD_INCOMPLETE ? ' ac' : '') + '" onclick="cmToggleMod()">';
    h += '<input type="checkbox" class="cm-mc" ' + (MOD_INCOMPLETE ? 'checked' : '') + ' onclick="event.stopPropagation();cmToggleMod()">';
    h += '<span class="cm-ml">Incomplete profiles only</span>';
    h += '<span class="cm-mn">' + ic + '</span></label></div>';

    // Table
    h += '<div class="cm-tw"><table class="cm-tbl"><thead><tr>';
    h += sortTh('name', 'Client name');
    h += sortTh('status', 'Status', '95px');
    h += sortTh('type', 'Type', '140px');
    h += sortTh('profile', 'Profile', '140px');
    h += '<th class="cm-c5"></th>';
    h += '</tr></thead><tbody>';

    if (!vis.length) {
      h += '<tr class="cm-er"><td colspan="5">No clients match</td></tr>';
    } else {
      vis.forEach(function (c) {
        var st = (c['client-status'] || '').toLowerCase();
        var tp = (c['customer-type'] || '').toLowerCase();
        var ps = (c['profile-status'] || '').toLowerCase();
        var fc = filledCount(c);
        var pct = Math.round(fc / TOTAL_FIELDS * 100);
        var stCls = st === 'active' ? 'sa' : st === 'paused' ? 'sps' : st === 'prospect' ? 'spr' : 'si';
        var tpCls = tp === 'advertiser' ? 'ta2' : tp === 'sponsor' ? 'ts2' : 'tc2';
        var pfDot = ps === 'complete' ? 'do' : 'dw';
        var pfLbl = ps === 'complete' ? 'Complete' : ps || 'Incomplete';

        h += '<tr onclick="cmEdit(\'' + c.id + '\')" style="cursor:pointer">';
        h += '<td><div class="cm-cn">' + esc(c.name) + '</div>';
        h += '<div class="cm-cc">' + esc(c['business-category'] || c['major-category'] || c['customer-type'] || '') + ' &middot; ' + fc + '/' + TOTAL_FIELDS + ' (' + pct + '%)</div></td>';
        h += '<td><span class="cm-pill ' + stCls + '">' + esc(st || 'none') + '</span></td>';
        h += '<td><span class="cm-pill ' + tpCls + '">' + esc(tp || 'none') + '</span></td>';
        h += '<td><span class="cm-pd"><span class="cm-dt ' + pfDot + '"></span>' + esc(pfLbl) + '</span></td>';
        h += '<td><button class="cm-eb" onclick="event.stopPropagation();cmEdit(\'' + c.id + '\')">Open</button></td>';
        h += '</tr>';
      });
    }

    h += '</tbody></table></div>';
    mount.innerHTML = h;
  }

  function pill(key, label, active, cls) {
    // v1.1.3: shared channel-tab button so Clients' Row 2 matches
    // Studio. The old .cm-fp status colours are intentionally
    // dropped - active is marked by the blue underline instead.
    return '<button class="ix-btn ix-btn--tab' + (active ? ' is-active' : '') + '"' +
           (active ? ' data-active="true"' : '') +
           ' onclick="cmSetFilter(\'' + key + '\')">' + label + '</button>';
  }

  function sortTh(col, label, w) {
    var isSorted = SORT_COL === col;
    var arrow = isSorted ? (SORT_DIR === 1 ? '\u25B2' : '\u25BC') : '\u25B2';
    var cls = isSorted ? ' cm-so' : '';
    var style = w ? ' style="width:' + w + '"' : '';
    return '<th class="cm-th' + cls + '"' + style + ' onclick="cmSort(\'' + col + '\')">' + label + ' <span class="cm-ar">' + arrow + '</span></th>';
  }

  function countByStatus() {
    var r = { active: 0, prospect: 0, paused: 0, inactive: 0 };
    CUSTOMERS.forEach(function (c) {
      var st = (c['client-status'] || '').toLowerCase();
      if (r[st] !== undefined) r[st]++;
    });
    return r;
  }

  // ── Modal rendering ──
  function renderModal() {
    var M = MODAL;
    var isAdd = M.mode === 'add';
    if (!isAdd) { renderRecord(); return; }   // v1.4.0: the client page
    var fc = 0;
    var dc = 0;
    ALL_FIELDS.forEach(function (f) {
      var v = M.edit[f.s];
      if (v !== '' && v !== false && v !== undefined && v !== null) fc++;
    });
    dc = dirtyCount();   // v1.2.4: staged approvals count too
    var pct = Math.round(fc / TOTAL_FIELDS * 100);
    var ini = isAdd ? '+' : initials(M.edit.name || '??');
    var nameDisplay = isAdd ? 'New Client' : esc(M.edit.name || 'Unnamed');
    var subLine = isAdd ? 'Fill in required fields to create' : esc((M.edit['customer-type'] || '') + ' \u00B7 ' + (M.edit['client-status'] || '') + ' \u00B7 ' + fc + '/' + TOTAL_FIELDS + ' (' + pct + '%)');

    // v1.3.0 — a surface on the tab. Back above the header (UX-016),
    // eyebrow + title (UX-017), version behind ⓘ.
    var h = '<div class="cm-rec ix-own">';
    h += '<button type="button" class="cm-back" onclick="cmCloseModal()">\u2190 All clients</button>';
    h += '<div class="cm-rh"><div class="cm-rh-l">';
    h += '<span class="cm-eyebrow">' + (isAdd ? 'Clients \u00B7 New client' : 'Clients \u00B7 Client record') + '</span>';   // HC-P-CM130-1
    h += '<h1 class="cm-rh-n">' + nameDisplay + '</h1>';
    h += '<div class="cm-mh-s">' + subLine + '</div>';
    h += '</div><div class="cm-rh-r">' + infoBadge() + '</div></div>';

    // ── v1.0.12: AI URL scrape bar (Add mode only) ──
    if (isAdd && CFG.extractClientUrl) {
      var scrapeState = M.scrapeState || 'idle';  // idle | loading | done | error
      h += '<div class="cm-scrape">';
      h += '<div class="cm-scrape-row">';
      h += '<span class="cm-scrape-ic">\u2728</span>';
      h += '<input type="url" class="cm-scrape-in" id="cm-scrape-url" placeholder="Paste the client\'s website URL to auto-fill\u2026" ' +
           'value="' + esc(M.scrapeUrl || '') + '"' + (scrapeState === 'loading' ? ' disabled' : '') +
           ' onkeydown="if(event.key===\'Enter\'){event.preventDefault();cmScrapeClient();}">';
      h += '<button class="cm-scrape-btn"' + (scrapeState === 'loading' ? ' disabled' : '') +
           ' onclick="cmScrapeClient()">' +
           (scrapeState === 'loading' ? '<span class="cm-spin"></span> Reading\u2026' : 'Auto-fill') + '</button>';
      h += '</div>';
      if (scrapeState === 'error' && M.scrapeError) {
        h += '<div class="cm-scrape-msg cm-scrape-err">' + esc(M.scrapeError) + '</div>';
      } else if (scrapeState === 'done') {
        h += '<div class="cm-scrape-msg cm-scrape-ok">Fields filled below \u2014 review the gold-bordered fields, edit anything, then Create Client.</div>';
      } else {
        h += '<div class="cm-scrape-msg cm-scrape-hint">We\u2019ll read the page and fill what we find. Nothing is saved until you click Create.</div>';
      }
      // Logo candidate picker — v1.0.18: picking a candidate now uploads it
      // to Uploadcare immediately (client-side, via uploadcare.fileFrom),
      // trims it to content, and offers a square crop variant — all before
      // Create Client is ever clicked. logo-link holds a live ucarecdn.com
      // URL by the time you submit, not the original site's raw image URL.
      if (M.scrapeImages && M.scrapeImages.length) {
        var lu = M.logoUpload;
        h += '<div class="cm-logo-pick"><div class="cm-logo-pick-lbl">Pick a logo (uploads to ULC, trims to content):</div><div class="cm-logo-strip">';
        M.scrapeImages.forEach(function (src, i) {
          var isPicked = M.logoPickedIndex === i;
          var sel = (isPicked && lu && lu.state === 'done') ? ' cm-logo-sel' : '';
          var busy = (isPicked && lu && lu.state === 'uploading');
          var errored = (isPicked && lu && lu.state === 'error');
          h += '<button class="cm-logo-thumb' + sel + (busy ? ' cm-logo-busy' : '') + (errored ? ' cm-logo-err' : '') +
               '" title="' + esc(src) + (errored ? ' — click to retry' : '') + '" onclick="cmPickLogo(' + i + ')">' +
               '<img src="' + esc(src) + '" alt="logo candidate ' + (i + 1) + '" loading="lazy" ' +
               'onerror="this.closest(\'.cm-logo-thumb\').style.display=\'none\'">' +
               (busy ? '<span class="cm-logo-spin">\u2026</span>' : '') +
               (errored ? '<span class="cm-logo-x">!</span>' : '') +
               '</button>';
        });
        h += '</div>';
        if (lu && lu.state === 'error') {
          h += '<div class="cm-logo-errmsg">Upload failed: ' + esc(lu.error || 'unknown error') + ' \u2014 click the thumbnail to retry.</div>';
        }
        if (lu && lu.state === 'done') {
          h += '<div class="cm-logo-variants"><div class="cm-logo-pick-lbl">Use:</div>';
          h += '<button class="cm-logo-vbtn' + (lu.selected === 'trim' ? ' cm-logo-vsel' : '') + '" onclick="cmSelectLogoVariant(\'trim\')">' +
               '<img src="' + esc(lu.variants.trim) + '" alt="trimmed logo"><span>Trimmed</span></button>';
          h += '<button class="cm-logo-vbtn' + (lu.selected === 'square' ? ' cm-logo-vsel' : '') + '" onclick="cmSelectLogoVariant(\'square\')">' +
               '<img src="' + esc(lu.variants.square) + '" alt="square logo"><span>Square</span></button>';
          h += '</div>';
        }
        h += '</div>';
      }
      h += '</div>';
    }

    // v1.0.16: Create success card — replaces the form body once Make
    // confirms. Modal stays mounted; user dismisses with Done.
    if (isAdd && M.createState === 'done') {
      h += '<div class="cm-mb"><div class="cm-success">';
      h += '<div class="cm-success-ic">\u2713</div>';
      h += '<div class="cm-success-t">Client Successfully Added</div>';
      h += '<div class="cm-success-s">' + esc(M.createName || M.edit.name || 'New client') + ' was created' + (M.createPublished ? ' and published' : '') + '.</div>';
      h += '<button class="cm-success-btn" onclick="cmCloseModal()">Done</button>';
      h += '</div></div>';
      h += '</div>';
      mount.innerHTML = h;
      return;
    }

    // Modal body
    h += '<div class="cm-mb">';

    // v1.0.16: inline create error (modal stays; user can retry)
    if (isAdd && M.createState === 'error' && M.createError) {
      h += '<div class="cm-create-err">' + esc(M.createError) + '</div>';
    }

    GROUPS.forEach(function (g) {
      var gf = g.fields.length;
      var gfilled = g.fields.filter(function (f) {
        var v = M.edit[f.s]; return v !== '' && v !== false && v !== undefined && v !== null;
      }).length;

      // v1.1.0: drawer groups render collapsed (System & auto-managed)
      if (g.drawer) {
        h += '<details class="cm-drawer"><summary class="cm-drawer-s">' + g.label +
             ' <span class="cm-gh-c">' + gfilled + '/' + gf + '</span></summary>';
      } else {
        h += '<div class="cm-gp"><div class="cm-gh">';
        h += '<span class="cm-gh-t">' + g.label + '</span>';
        h += '<span class="cm-gh-c">' + gfilled + '/' + gf + '</span></div>';
      }
      h += '<div class="cm-gr">';

      g.fields.forEach(function (f) { h += renderField(f, isAdd); });   // v1.4.0: one field renderer
      h += g.drawer ? '</div></details>' : '</div></div>';
    });

    h += '</div>';

    // v1.3.0 — the canonical sticky save bar (title-admin-page-design .asm-save-bar).
    h += '<div class="asm-save-bar' + (dc > 0 ? ' has-changes' : '') + '"><div class="cm-mf-l">';
    h += '<span class="cm-mf-i">' + fc + ' of ' + TOTAL_FIELDS + ' fields populated</span>';
    if (dc > 0) h += '<span class="cm-mf-dc">' + dc + ' unsaved change' + (dc > 1 ? 's' : '') + '</span>';
    h += '</div><div class="asm-save-right cm-mf-r">';
    if (dc > 0) h += '<button class="asm-cancel-link cm-mf-ca" onclick="cmCancelAll()">cancel</button>';   // beside Save
    if (isAdd) {
      var creating = M.createState === 'creating';
      h += '<button class="cm-mf-sv"' + ((dc === 0 || creating) ? ' disabled' : '') + ' onclick="cmDoCreate()">' +
           (creating ? '<span class="cm-spin"></span> Adding\u2026' : 'Create Client') + '</button>';
    } else {
      h += '<button class="cm-mf-sv"' + (dc === 0 ? ' disabled' : '') + ' onclick="cmDoSave(false)">Save</button>';
      h += '<button class="cm-mf-pub"' + (dc === 0 ? ' disabled' : '') + ' onclick="cmDoSave(true)">Save &amp; Publish</button>';
    }
    h += '</div></div>';

    h += '</div>';
    mount.innerHTML = h;
  }


  // v1.4.0 — one field, read or edit; used by the Add form and the Account tab.
  function renderField(f, isAdd) {
    var M = MODAL, h = '';
        var spanClass = ' cm-w' + (f.w || 6);
        if (isCurAd(f)) { h += renderCurrentAd(f, spanClass, isAdd); return h; }   // v1.2.4
        var val = M.edit[f.s];
        var origVal = M.orig[f.s];
        // v1.2.3 — a switch has TWO states, on and off. Treating false as
        // "no value" rendered an OFF switch as an em-dash, which reads as
        // "not set" and invented a third state Webflow does not have.
        var hasVal = (f.t === 'switch')
          ? true
          : (val !== '' && val !== false && val !== undefined && val !== null);
        var isDirty = val !== origVal;
        // In Add mode, all editable fields start open
        var isEditing = isAdd ? true : (M.editing[f.s] || false);
        var dot = hasVal ? 'cm-gi-ok' : 'cm-gi-mt';

        // Readonly fields — no pencil, no editing (even in Add mode for slug)
        if (f.t === 'readonly') {
          h += '<div class="cm-gi' + spanClass + '">';
          h += '<div class="cm-gi-d ' + dot + '"></div>';
          h += '<span class="cm-gi-l">' + f.l + '</span>';
          h += '<div class="cm-gi-v">' + (hasVal ? esc(String((f.src && refName(f.src, val)) || val)) : '<span class="cm-empty">—</span>') + '</div>';   // v1.2.4: names for references
          h += '<div class="cm-gi-act"><span class="cm-lock">&#x1F512;</span></div>';
          h += '</div>';
          return h;
        }

        // Auto-filled fields — read-only, derived from another field
        if (f.t === 'auto') {
          var sourceVal = M.edit[f.from] || '';
          var autoVal = '';
          if (sourceVal && f.from === 'major-category') {
            var major = REF_DATA.majors.find(function (m) { return m.id === sourceVal; });
            autoVal = major ? major[f.prop] || '' : '';
          }
          M.edit[f.s] = autoVal;
          var autoHas = autoVal !== '';
          h += '<div class="cm-gi' + spanClass + (autoVal !== origVal ? ' cm-dirty' : '') + '">';
          h += '<div class="cm-gi-d ' + (autoHas ? 'cm-gi-ok' : 'cm-gi-mt') + '"></div>';
          h += '<span class="cm-gi-l">' + f.l + '</span>';
          h += '<div class="cm-gi-v">' + (autoHas ? esc(autoVal) : '<span class="cm-empty">auto-filled</span>') + '</div>';
          h += '<div class="cm-gi-act"><span class="cm-lock-auto">auto</span></div>';
          h += '</div>';
          return h;
        }

        h += '<div class="cm-gi' + spanClass + (isDirty ? ' cm-dirty' : '') + '" data-cm-field="' + esc(f.s) + '">';
        h += '<div class="cm-gi-d ' + dot + '"></div>';
        h += '<span class="cm-gi-l">' + f.l + '</span>';

        if (isEditing) {
          h += '<div class="cm-gi-e">';

          if (f.t === 'upload') {
            // Uploadcare widget button
            h += '<div class="cm-upload-wrap">';
            if (hasVal) {
              h += '<span class="cm-upload-val">' + truncUrl(val) + '</span>';
              h += '<button class="cm-upload-clear" onclick="cmSetVal(\'' + esc(f.s) + '\',\'\')">x</button>';
            }
            h += '<button class="cm-upload-btn" onclick="cmUploadcare(\'' + esc(f.s) + '\')">Upload</button>';
            h += '</div>';

          } else if (f.t === 'ref-select') {
            // Dropdown from reference data — src:'majors' is affected by the
            // same DOM cap as Minor, so show a loading state while the live
            // full-tree fetch (ensureLiveCategories) is in flight.
            var refList = REF_DATA[f.src] || [];
            var majorLoading = f.src === 'majors' && CATEGORIES_LOADING;
            h += '<select class="cm-esel" onchange="cmSetVal(\'' + esc(f.s) + '\',this.value)"' + (majorLoading ? ' disabled' : '') + '>';
            if (majorLoading) {
              h += '<option value="">Loading…</option>';
            } else {
              h += '<option value="">-- select --</option>';
              refList.forEach(function (item) {
                h += '<option value="' + esc(item.id) + '"' + (val === item.id ? ' selected' : '') + '>' + esc(item.name) + '</option>';
              });
            }
            h += '</select>';

          } else if (f.t === 'ref-cascade') {
            // Sub-dropdown filtered by parent field value
            var parentVal = M.edit[f.parentField] || '';
            var isLoadingSubs = CATEGORIES_LOADING;
            var filteredList = parentVal ? subsForMajor(parentVal) : [];
            h += '<select class="cm-esel" onchange="cmSetVal(\'' + esc(f.s) + '\',this.value)"' + (!parentVal || isLoadingSubs ? ' disabled' : '') + '>';
            if (isLoadingSubs) {
              h += '<option value="">Loading…</option>';
            } else if (!parentVal) {
              h += '<option value="">Select major first</option>';
            } else if (!filteredList.length) {
              h += '<option value="">No subcategories</option>';
            } else {
              h += '<option value="">-- select --</option>';
              filteredList.forEach(function (item) {
                h += '<option value="' + esc(item.id) + '"' + (val === item.id ? ' selected' : '') + '>' + esc(item.name) + '</option>';
              });
            }
            h += '</select>';

          } else if (f.t === 'option') {
            // v1.2.4 — Webflow's own choices (customerOptions), by name. A stored
            // value Webflow no longer offers stays listed so it is not lost.
            var ol = optList(f.s);
            if (!ol) {
              h += '<select class="cm-esel" disabled><option>' + (OPTS_ERROR ? 'Choices unavailable' : 'Loading\u2026') + '</option></select>';
            } else {
              h += '<select class="cm-esel" onchange="cmSetVal(\'' + esc(f.s) + '\',this.value)">';
              h += '<option value="">-- select --</option>';
              var seen = false;
              ol.forEach(function (o) {
                var on = String(val).trim().toLowerCase() === String(o.name).trim().toLowerCase();
                if (on) seen = true;
                h += '<option value="' + esc(o.name) + '"' + (on ? ' selected' : '') + '>' + esc(o.name) + '</option>';
              });
              if (val && !seen) h += '<option value="' + esc(val) + '" selected>' + esc(val) + ' (not a Webflow choice)</option>';
              h += '</select>';
            }
          } else if (f.t === 'switch') {
            // v1.2.3 — two explicit buttons. The bare checkbox gave no way
            // to tell OFF from "never set", and clicking it off looked like
            // nothing happened because the row then rendered as empty.
            var swOn  = (val === true || val === 'true' || val === '1');
            h += '<div class="cm-esw2" role="group">';
            h += '<button type="button" class="cm-esw2-b' + (swOn ? '' : ' is-sel') + '" onclick="cmSetVal(\'' + esc(f.s) + '\',false)">Off</button>';
            h += '<button type="button" class="cm-esw2-b' + (swOn ? ' is-sel' : '') + '" onclick="cmSetVal(\'' + esc(f.s) + '\',true)">On</button>';
            h += '</div>';
          } else if (f.t === 'textarea') {
            h += '<textarea class="cm-ei" rows="2" oninput="cmSetVal(\'' + esc(f.s) + '\',this.value,true)">' + esc(val) + '</textarea>';
          } else {
            var ph = f.t === 'link' ? 'https://...' : f.t === 'email' ? 'email@...' : f.t === 'phone' ? '(201) 555-...' : 'Enter value...';
            h += '<input class="cm-ei" type="text" value="' + esc(val) + '" placeholder="' + ph + '" oninput="cmSetVal(\'' + esc(f.s) + '\',this.value,true)">';
          }
          h += '</div>';
          h += '<div class="cm-gi-act">';
          if (isDirty) h += '<button class="cm-cancel-lk" onclick="cmRevertField(\'' + esc(f.s) + '\')">cancel</button>';
          h += '<button class="cm-pen" onclick="cmToggleEdit(\'' + esc(f.s) + '\')" title="Close">' + penSvg('#1a3a3a') + '</button>';
          h += '</div>';
        } else {
          if (hasVal) {
            h += '<div class="cm-gi-v">';
            if (f.t === 'switch') {
              h += (val === true || val === 'true' || val === '1') ? 'On' : 'Off';
            } else if (f.t === 'ref-select' || f.t === 'ref-cascade') {
              // Show name instead of ID
              var displayName = refName(f.src, val);
              h += esc(displayName || val);
            } else if ((f.t === 'link' || f.t === 'email') && val) {
              h += '<a href="' + esc(val) + '" target="_blank" onclick="event.stopPropagation()">' + truncUrl(val) + '</a>';
            } else if (f.t === 'upload' && val) {
              h += '<span class="cm-img-tag">' + truncUrl(val) + '</span>';
            } else if (f.t === 'image' && val) {
              h += '<span class="cm-img-tag">' + esc(val) + '</span>';
            } else {
              h += esc(String(val));
            }
            h += '</div>';
          } else {
            h += '<div class="cm-gi-v cm-empty">empty</div>';
          }
          h += '<div class="cm-gi-act"><button class="cm-pen" onclick="cmToggleEdit(\'' + esc(f.s) + '\')" title="Edit">' + penSvg('#8a8a7a') + '</button></div>';
        }
        h += '</div>';
    return h;
  }

  // v1.3.0 — the ⓘ badge (ix-info) carries the version; nothing if the page lacks it.
  function infoBadge() {
    if (!(window.IxInfo && IxInfo.badge)) return '';
    try {
      return IxInfo.badge({ file: 'client-manager-v' + CM_VERSION + '.js', version: CM_VERSION, title: 'Client record',
        blurb: 'One client\u2019s record. Changes are gold until Save. Current ads come from the Data Worker (/customer-ads); approvals are written by Scenario G, everything else by Scenario 114.',
        scenarios: [{ name: '114 \u00b7 updateCustomer', note: 'fields, option ids, current-ad pointers' },
                    { name: 'G \u00b7 approveAd', note: 'ad approvals' }] });
    } catch (e) { return ''; }
  }

  function penSvg(color) {
    return '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="' + (color || 'currentColor') + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 1.5l3 3-9 9H2.5v-3z"/><path d="M9.5 3.5l3 3"/></svg>';
  }

  // ── Global actions (attached to window for onclick) ──
  window.cmSetFilter = function (f) { FILTER = f; render(); };
  var _searchTimer = null;
  window.cmSearch = function (v) {
    SEARCH = v;
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(function () {
      var el = mount.querySelector('.cm-sr');
      var pos = el ? el.selectionStart : 0;
      render();
      var newEl = mount.querySelector('.cm-sr');
      if (newEl) { newEl.focus(); newEl.setSelectionRange(pos, pos); }
    }, 150);
  };
  window.cmToggleMod = function () { MOD_INCOMPLETE = !MOD_INCOMPLETE; render(); };
  window.cmSort = function (col) {
    if (SORT_COL === col) SORT_DIR = -SORT_DIR;
    else { SORT_COL = col; SORT_DIR = 1; }
    render();
  };
  window.cmToggleSel = function (id) { SELECTED[id] = !SELECTED[id]; render(); };
  window.cmToggleAll = function () {
    var vis = getVisible();
    var allOn = vis.every(function (c) { return SELECTED[c.id]; });
    vis.forEach(function (c) { SELECTED[c.id] = !allOn; });
    render();
  };
  window.cmClearSel = function () { SELECTED = {}; render(); };

  // Edit modal
  window.cmEdit = function (id) {
    var c = CUSTOMERS.find(function (x) { return x.id === id; });
    if (!c) return;
    var orig = {};
    var edit = {};
    ALL_FIELDS.forEach(function (f) { orig[f.s] = c[f.s]; edit[f.s] = c[f.s]; });
    MODAL = { mode: 'edit', custId: id, orig: orig, edit: edit, editing: {}, approve: {}, ads: { state: 'loading' } };
    render();
    ensureLiveCategories();
    loadCustomerAds(id);   // v1.2.4: versions, current ads and Webflow's option choices
    MODAL.tab = 'overview'; MODAL.groupOpen = {};
    loadSales(id);         // v1.4.0: commitments from ix-sales
    openedRecord(id);      // v1.3.0
  };

  // Add modal
  window.cmAddClient = function () {
    var orig = {};
    var edit = {};
    ALL_FIELDS.forEach(function (f) {
      var def = f.t === 'switch' ? false : '';
      orig[f.s] = def;
      edit[f.s] = def;
    });
    // Pre-fill publisher and titles-admin
    edit['publisher'] = PUBLISHER_NAME;
    orig['publisher'] = PUBLISHER_NAME;
    edit['titles-admin'] = TA_NAME;
    orig['titles-admin'] = TA_NAME;
    MODAL = { mode: 'add', custId: 'new-' + Date.now(), orig: orig, edit: edit, editing: {}, approve: {}, ads: null };
    render();
    ensureLiveCategories();
    if (!OPTS && !OPTS_LOADING) loadCustomerAds(null);   // v1.2.4: option choices only
    openedRecord(null);    // v1.3.0
  };

  // v1.3.0 — back to the list, asking first if anything is unsaved.
  window.cmCloseModal = function () {
    var n = dirtyCount();
    if (n > 0 && !(MODAL && MODAL.createState === 'done') &&
        !window.confirm('Leave this client without saving? ' + n + ' unsaved change' + (n > 1 ? 's' : '') + ' will be lost.')) return;
    MODAL = null;
    setHash('');
    render();
    window.scrollTo(0, LIST_SCROLL);
  };
  function setHash(id) {                                           // HC-P-CM130-2
    try {
      var base = location.pathname + location.search;
      history.replaceState(null, '', id ? base + '#client=' + id : base);
    } catch (e) {}
  }
  function openedRecord(id) {
    LIST_SCROLL = window.scrollY || 0;
    if (id) setHash(id);
    var top = mount.getBoundingClientRect().top + (window.scrollY || 0) - 16;
    window.scrollTo(0, Math.max(0, top));
  }
  window.addEventListener('beforeunload', function (e) {
    if (MODAL && dirtyCount() > 0 && MODAL.createState !== 'done') { e.preventDefault(); e.returnValue = ''; }
  });
  // A page loaded with #client=<id> opens the Clients tab and that record.
  (function () {
    var m = /(?:^#|&)client=([0-9a-f]{24})/i.exec(location.hash || '');
    if (!m) return;
    var id = m[1];
    var tm = /(?:^#|&)tab=([a-z]+)/i.exec(location.hash || ''), tab = tm ? tm[1].toLowerCase() : '';   // v1.4.4
    if (['overview', 'creative', 'commitments', 'account', 'billing'].indexOf(tab) < 0) tab = '';
    if (!CUSTOMERS.some(function (c) { return c.id === id; })) { console.warn('[CLIENT MGR] #client=' + id + ' is not on this page'); return; }
    var go = function () {
      var pane = mount.closest('.w-tab-pane');
      var name = pane && pane.getAttribute('data-w-tab');
      var link = name && document.querySelector('.w-tab-link[data-w-tab="' + name + '"]');
      if (link && !link.classList.contains('w--current')) link.click();
      window.cmEdit(id);
      if (tab && tab !== 'overview') window.cmTab(tab);                       // v1.4.4
    };
    if (window.Webflow && Webflow.push) Webflow.push(function () { setTimeout(go, 50); });
    else setTimeout(go, 300);
  })();

  // ── v1.0.12: AI URL scrape ──
  // Wire map: Worker camelCase field → CMS slug in M.edit.
  var SCRAPE_FIELD_MAP = {
    name:            'name',
    tagline:         'tagline',
    longDescription: 'long-description',
    services:        'services',
    address:         'address',
    address2:        'address-2',
    cityStZip:       'city-st-zip',
    businessWebsite: 'business-website',
    businessPhone:   'business-phone',
    businessEmail:   'business-email',
    facebook:        'facebook',
    instagram:       'instagram',
    tiktok:          'tiktok',
    youtube:         'youtube',
    linkedin:        'linkedin',
    x:               'x',
    pinterest:       'pinterest',
    houzz:           'houzz'
  };

  window.cmScrapeClient = function () {
    if (!MODAL || MODAL.mode !== 'add') return;
    var input = portal.querySelector('#cm-scrape-url');
    var url = input ? (input.value || '').trim() : (MODAL.scrapeUrl || '');
    MODAL.scrapeUrl = url;
    if (!url) {
      MODAL.scrapeState = 'error';
      MODAL.scrapeError = 'Enter a website URL first.';
      renderModal();
      return;
    }
    if (!CFG.extractClientUrl) {
      MODAL.scrapeState = 'error';
      MODAL.scrapeError = 'Scrape endpoint not configured (TA_CONFIG.extractClientUrl).';
      renderModal();
      return;
    }
    MODAL.scrapeState = 'loading';
    MODAL.scrapeError = '';
    renderModal();

    // v1.0.17: send the known Major Category names so the worker can
    // return an exact-match guess instead of an unconstrained string.
    var majorNames = REF_DATA.majors.map(function (m) { return m.name; });

    fetch(CFG.extractClientUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, categories: majorNames })
    })
      .then(function (res) { return res.json().catch(function () { throw new Error('Bad response from scraper'); }); })
      .then(function (data) {
        if (!data || !data.ok) throw new Error((data && data.error) || 'Scrape failed');
        var fields = data.fields || {};
        // Write only non-empty values into M.edit so we don't blank existing entries.
        Object.keys(SCRAPE_FIELD_MAP).forEach(function (wireKey) {
          var slug = SCRAPE_FIELD_MAP[wireKey];
          var val = fields[wireKey];
          if (val != null && String(val).trim() !== '') {
            MODAL.edit[slug] = String(val).trim();
          }
        });

        // v1.0.17: majorCategory comes back as an exact string match
        // against REF_DATA.majors (or "" if nothing fit) — look up the
        // id directly, no fuzzy matching. Also cascades parent-category
        // name/id the same way manual selection does. Leaves
        // business-category (the Minor/subcategory) untouched — AI
        // never guesses that.
        var majorGuess = fields.majorCategory;
        if (majorGuess && String(majorGuess).trim() !== '') {
          var matched = REF_DATA.majors.find(function (m) { return m.name === majorGuess; });
          if (matched) {
            MODAL.edit['major-category'] = matched.id;
            MODAL.edit['parent-category-name'] = matched.name;
            MODAL.edit['parent-category-id'] = matched.id;
          }
        }

        // v1.0.17: neighborhood has no AI signal of its own — derive it
        // from the city token in cityStZip (e.g. "Wyckoff, NJ 07481" →
        // "Wyckoff"). Only fills if neighborhood is currently empty.
        if (!MODAL.edit['neighborhood']) {
          var csz = fields.cityStZip;
          if (csz && String(csz).trim() !== '') {
            var cityToken = String(csz).split(',')[0].trim();
            if (cityToken) MODAL.edit['neighborhood'] = cityToken;
          }
        }

        // v1.0.22: derive Logo Initials + Short Code from the name.
        // Initials rule matches ASF commitCreateCustomer exactly: first
        // letter of up to the first 3 words, uppercased; fallback first
        // 2 chars. Short Code: uppercase alphanumerics of the name,
        // first 4 chars ("JH Renovations LLC" -> "JHRE"). Both are
        // prefills — fill only if empty, operator can overtype.
        var nm = (MODAL.edit['name'] || '').trim();
        if (nm) {
          if (!MODAL.edit['logo-initials']) {
            MODAL.edit['logo-initials'] = (nm.split(/\s+/).filter(Boolean).slice(0, 3)
              .map(function (w) { return w.charAt(0); }).join('') || nm.slice(0, 2)).toUpperCase();
          }
          if (!MODAL.edit['customer-short-code']) {
            var compact = nm.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (compact) MODAL.edit['customer-short-code'] = compact.slice(0, 4);
          }
        }

        // v1.0.21: TXA Services 1–6 were never AI-wired. Split the
        // comma-sep services list into the six TXA slots (first six
        // entries), filling only slots that are currently empty so a
        // hand-entered value is never overwritten.
        var svcRaw = fields.services;
        if (svcRaw && String(svcRaw).trim() !== '') {
          var svcList = String(svcRaw).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
          for (var ti = 0; ti < 6; ti++) {
            var slot = 'txa-services-' + (ti + 1);
            if (svcList[ti] && !MODAL.edit[slot]) MODAL.edit[slot] = svcList[ti];
          }
        }

        MODAL.scrapeImages = Array.isArray(data.images) ? data.images.slice(0, 16) : [];
        MODAL.scrapeState = 'done';
        MODAL.scrapeError = '';
        renderModal();
      })
      .catch(function (err) {
        MODAL.scrapeState = 'error';
        MODAL.scrapeError = (err && err.message) ? err.message : 'Could not read that page.';
        renderModal();
      });
  };

  // v1.0.18: picking a logo candidate now uploads it to Uploadcare
  // immediately (client-side), instead of just storing the raw scraped
  // URL and pushing the upload into the Make create-flow. logo-link ends
  // up holding a live ucarecdn.com URL before Create Client is ever
  // clicked. Falls back to storing the raw URL if Uploadcare's JS lib
  // isn't loaded on this page for some reason, so picking still does
  // *something* rather than silently no-op.
  window.cmPickLogo = function (i) {
    if (!MODAL || !MODAL.scrapeImages) return;
    var src = MODAL.scrapeImages[i];
    if (!src) return;

    // Click the already-picked, already-uploaded candidate again → clear it.
    if (MODAL.logoPickedIndex === i && MODAL.logoUpload && MODAL.logoUpload.state === 'done') {
      MODAL.logoPickedIndex = null;
      MODAL.logoUpload = null;
      MODAL.edit['logo-link'] = '';
      renderModal();
      return;
    }

    MODAL.logoPickedIndex = i;
    MODAL.edit['logo-link'] = '';

    if (!window.uploadcare || !window.uploadcare.fileFrom) {
      console.warn('[CLIENT MGR] Uploadcare JS lib not available on this page — using raw scraped URL as a fallback.');
      MODAL.logoUpload = null;
      MODAL.edit['logo-link'] = src;
      renderModal();
      return;
    }

    MODAL.logoUpload = { state: 'uploading', error: '' };
    renderModal();

    window.uploadcare.fileFrom('url', src)
      .done(function (fileInfo) {
        if (!MODAL || MODAL.logoPickedIndex !== i) return; // superseded by a later pick
        var base = fileInfo.cdnUrl;
        var trimUrl = base + '-/trim/-/preview/-/format/auto/';
        var squareUrl = base + '-/trim/-/scale_crop/500x500/center/-/format/auto/';
        MODAL.logoUpload = { state: 'done', variants: { trim: trimUrl, square: squareUrl }, selected: 'trim' };
        MODAL.edit['logo-link'] = trimUrl;
        renderModal();
      })
      .fail(function (err) {
        if (!MODAL || MODAL.logoPickedIndex !== i) return;
        MODAL.logoUpload = { state: 'error', error: (err && err.message) ? err.message : 'Upload failed' };
        renderModal();
      });
  };

  window.cmSelectLogoVariant = function (variant) {
    if (!MODAL || !MODAL.logoUpload || MODAL.logoUpload.state !== 'done') return;
    if (!MODAL.logoUpload.variants[variant]) return;
    MODAL.logoUpload.selected = variant;
    MODAL.edit['logo-link'] = MODAL.logoUpload.variants[variant];
    renderModal();
  };

  window.cmToggleEdit = function (slug) {
    MODAL.editing[slug] = !MODAL.editing[slug];
    var scrollEl = portal.querySelector('.cm-mb');
    var scrollTop = scrollEl ? scrollEl.scrollTop : 0;
    renderModal();
    var newScrollEl = portal.querySelector('.cm-mb');
    if (newScrollEl) newScrollEl.scrollTop = scrollTop;
  };

  // For text inputs: update state silently, no re-render (avoids focus loss)
  // For selects/checkboxes/upload: re-render to update UI
  window.cmSetVal = function (slug, val, noRender) {
    // v1.2.3 — switches store a real boolean, always. Anything else
    // ('', null, '0', undefined) collapses to false, so the dirty diff and
    // the "1"/"0" sentinel sent to Scenario 114 both stay honest.
    var fsw = ALL_FIELDS.find(function (x) { return x.s === slug; });
    if (fsw && fsw.t === 'switch') {
      val = (val === true || val === 'true' || val === '1');
    }
    MODAL.edit[slug] = val;
    if (slug === 'major-category') {
      MODAL.edit['business-category'] = '';
      MODAL.editing['business-category'] = true;
    }
    // Update the dot indicator in-place without full re-render
    if (noRender) {
      // Just update the dirty border on the current row
      var gi = portal.querySelector('[data-cm-field="' + slug + '"]');
      if (gi) {
        // v1.2.3 — same rule in the live dirty-repaint path.
        var fdef   = ALL_FIELDS.find(function (x) { return x.s === slug; });
        var hasVal = (fdef && fdef.t === 'switch')
          ? true
          : (val !== '' && val !== false);
        var isDirty = val !== MODAL.orig[slug];
        gi.classList.toggle('cm-dirty', isDirty);
        var dot = gi.querySelector('.cm-gi-d');
        if (dot) { dot.classList.toggle('cm-gi-ok', hasVal); dot.classList.toggle('cm-gi-mt', !hasVal); }
      }
      // Update footer counts
      var dc = dirtyCount();   // v1.2.4
      var dcEl = portal.querySelector('.cm-mf-dc');
      if (dcEl) dcEl.textContent = dc > 0 ? dc + ' unsaved change' + (dc > 1 ? 's' : '') : '';
      var barEl = portal.querySelector('.asm-save-bar'); if (barEl) barEl.classList.toggle('has-changes', dc > 0);   // v1.3.0
      var svBtn = portal.querySelector('.cm-mf-sv');
      var pubBtn = portal.querySelector('.cm-mf-pub');
      if (svBtn) svBtn.disabled = dc === 0;
      if (pubBtn) pubBtn.disabled = dc === 0;
      return;
    }
    var scrollEl = portal.querySelector('.cm-mb');
    var scrollTop = scrollEl ? scrollEl.scrollTop : 0;
    renderModal();
    var newScrollEl = portal.querySelector('.cm-mb');
    if (newScrollEl) newScrollEl.scrollTop = scrollTop;
  };

  window.cmRevertField = function (slug) {
    var fr = fieldOf(slug);
    if (isCurAd(fr)) Object.keys(MODAL.approve || {}).forEach(function (k) { if (k.split('|')[1] === fr.shape) delete MODAL.approve[k]; });   // v1.2.4
    MODAL.edit[slug] = MODAL.orig[slug];
    MODAL.editing[slug] = false;
    var scrollEl = portal.querySelector('.cm-mb');
    var scrollTop = scrollEl ? scrollEl.scrollTop : 0;
    renderModal();
    var newScrollEl = portal.querySelector('.cm-mb');
    if (newScrollEl) newScrollEl.scrollTop = scrollTop;
  };

  window.cmCancelAll = function () {
    ALL_FIELDS.forEach(function (f) { MODAL.edit[f.s] = MODAL.orig[f.s]; });
    MODAL.approve = {};   // v1.2.4
    MODAL.editing = {};
    MODAL.groupOpen = {};   // v1.4.0
    renderModal();
  };

  // ── v1.2.4: current ads ──
  function curAdField(shape) { return ALL_FIELDS.find(function (f) { return isCurAd(f) && f.shape === shape; }); }
  window.cmPickAd = function (shape, adId) {
    var f = curAdField(shape); if (!f) return;
    var v = adById(shape, adId);
    if (!v || !(v.selectable || MODAL.approve[adId + '|' + shape] === approvedOptId(shape))) return;   // only approved versions are selectable
    MODAL.edit[f.s] = adId;
    repaintKeepScroll();
  };
  window.cmApproveAd = function (shape, adId) {
    var f = curAdField(shape), id = approvedOptId(shape);
    if (!f || !id || !adById(shape, adId)) return;
    MODAL.approve[adId + '|' + shape] = id;
    MODAL.edit[f.s] = adId;   // Approve also picks it
    repaintKeepScroll();
  };
  // v1.4.0 — the client page's handlers.
  window.cmTab = function (k) { if (!MODAL) return; MODAL.tab = k; renderModal(); };
  window.cmEditGroup = function (gid) {
    if (!MODAL) return;
    MODAL.groupOpen = MODAL.groupOpen || {};
    MODAL.groupOpen[gid] = !MODAL.groupOpen[gid];
    var g = GROUPS.find(function (x) { return x.id === gid; });
    if (g) g.fields.forEach(function (f) { MODAL.editing[f.s] = MODAL.groupOpen[gid]; });
    repaintKeepScroll();
  };
  window.cmSendBackAd = function (shape, adId) {
    var id = sentBackOptId(shape);
    if (!id || !adById(shape, adId)) return;
    MODAL.approve[adId + '|' + shape] = id;   // the pointer does not move
    repaintKeepScroll();
  };
  window.cmUnapproveAd = function (shape, adId) {
    var f = curAdField(shape); if (!f) return;
    delete MODAL.approve[adId + '|' + shape];
    if (MODAL.edit[f.s] === adId) MODAL.edit[f.s] = MODAL.orig[f.s];
    repaintKeepScroll();
  };

  window.cmUploadcare = function (slug) {
    if (window.uploadcare && window.uploadcare.openDialog) {
      var dialog = uploadcare.openDialog(null, {
        publicKey: window.UPLOADCARE_PUBLIC_KEY || '',
        imagesOnly: true
      });
      dialog.done(function (file) {
        file.done(function (info) {
          cmSetVal(slug, info.cdnUrl);
        });
      });
    } else {
      var url = prompt('Paste image URL:');
      if (url) cmSetVal(slug, url);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  //  v1.2.0 — SAVE ACTUALLY SAVES
  //
  //  THE DEFECT. Through v1.1.4 this function built a payload,
  //  console.log'd it, then mutated CUSTOMERS and copied `changes` into
  //  MODAL.orig. Copying into orig is what cleared the gold dirty borders
  //  and dropped the unsaved-change count to zero, so the UI reported
  //  success because it had updated ITSELF. The webhook call was three
  //  commented-out lines with a TODO above them. Nothing reached Make.
  //  Nothing reached Webflow. Reloading the page discarded the edit.
  //
  //  UX-006 (TOAST-TRUTH). ok:true is necessary and not sufficient. The
  //  response must echo the stored fieldData, and we diff it field by
  //  field against what we sent. Local state is updated ONLY for fields
  //  the server confirms. Anything that comes back different, or does not
  //  come back at all, stays dirty and is named in the toast.
  //
  //  Scenario 114 (makeUpdateCustomer), not 111. 111 creates then updates
  //  unconditionally — modules 3 and 4 both carry filter:null — so it has
  //  no notion of an existing customer. 114 PATCHes
  //  /collections/{id}/items/{itemId}/live, which updates and publishes
  //  in one call and returns the stored item.
  //
  //  The field set is dynamic, so 114 uses a raw API call rather than a
  //  mapped updateItem module. Slugs go over the wire as CMS slugs, not
  //  through CREATE_KEY_MAP — that map exists because the CREATE path
  //  goes to 111, which expects camelCase.
  // ═══════════════════════════════════════════════════════════════
  function cmToast(msg, kind) {
    // v1.3.0 — the platform toast when the page has it (UX-027).
    if (window.IxToast && typeof IxToast.show === 'function') {
      try { IxToast.show(msg, kind === 'err' ? 'err' : 'ok', kind === 'err' ? { sticky: true } : undefined); return; } catch (e) {}
    }
    var host = document.querySelector('.cm-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'cm-toast-host';
      document.body.appendChild(host);
    }
    var el = document.createElement('div');
    el.className = 'cm-toast cm-toast--' + (kind || 'ok');
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(function () { el.classList.add('out'); }, kind === 'err' ? 6000 : 3200);
    setTimeout(function () { el.remove(); }, kind === 'err' ? 6400 : 3600);
  }

  function cmSaveBusy(on, publish) {
    ['.cm-mf-sv', '.cm-mf-pub'].forEach(function (sel) {
      var b = document.querySelector(sel);
      if (!b) return;
      b.disabled = on;
      b.classList.toggle('cm-busy', on);
    });
    var active = document.querySelector(publish ? '.cm-mf-pub' : '.cm-mf-sv');
    if (active) {
      if (on) {
        active.dataset.label = active.textContent;
        active.textContent = publish ? 'Publishing…' : 'Saving…';
      } else if (active.dataset.label) {
        active.textContent = active.dataset.label;
        delete active.dataset.label;
      }
    }
  }

  // Compare what we sent against what came back. Switches arrive as
  // booleans, everything else as strings; normalise before comparing so a
  // true/"true" mismatch isn't reported as a failure.
  function cmSameValue(sent, got) {
    // v1.2.2 — switches are SENT as "1"/"0" sentinels and ECHOED as real
    // booleans, so normalise both sides before comparing or every switch
    // save would report as unconfirmed.
    if (sent === '1' || sent === '0' || typeof sent === 'boolean' || typeof got === 'boolean') {
      return (sent === true || sent === 'true' || sent === '1') ===
             (got  === true || got  === 'true' || got  === '1');
    }
    if (sent === '' && (got == null || got === '')) {
      return true;                       // both empty; nothing to reconcile
    }
    if (typeof got === 'object' && got !== null) {
      return false;                      // reference/array echo — can't verify here
    }
    return String(sent == null ? '' : sent).trim() ===
           String(got  == null ? '' : got ).trim();
  }

  // v1.2.1 — Client Manager slug -> real Webflow CUSTOMERS slug. Lifted
  // from Scenario 111 module 3, which is the only verified source for
  // these. Several diverge and the divergence is not guessable.
  var CM_TO_WF = {
    'name':'name', 'customer-short-code':'customer-4-letter-code',
    'logo-initials':'logo-initials', 'logo-link':'logo-link',
    'customer-type':'customer-type', 'client-status':'client-status',
    'profile-status':'profile-status', 'expert-contributor':'expert-contributor',
    'hide-from-directory':'hide-from-directory', 'featured-listing':'featured-listing',
    'major-category':'major-category', 'business-category':'section',
    'address':'address', 'address-2':'address-2', 'city-st-zip':'city-st-zip',
    'neighborhood':'neighborhood', 'business-website':'contact-website',
    'business-phone':'business-phone', 'business-email':'business-email',
    'tagline':'tagline', 'long-description':'long-description',
    'services':'services-comma-separated',
    'txa-services-1':'txa---services-1', 'txa-services-2':'txa---services-2',
    'txa-services-3':'txa---services-3', 'txa-services-4':'txa---services-4',
    'txa-services-5':'txa---services-5', 'txa-services-6':'txa---services-6',
    'facebook':'facebook', 'instagram':'instagram', 'tiktok':'tiktok',
    'youtube':'youtube', 'linkedin':'linkedin', 'x':'x-2',
    'pinterest':'pinterest', 'houzz':'houzz',
    'default-art-ad-get':'default-paid-ad-ulc-link',
    'default-sponsorship-ad-link-ulc':'default-sponsorship-ad-link---ulc',
    // v1.2.4 — the current-ad pointers (same slug on both sides)
    'current-banner-ad':'current-banner-ad', 'current-sidebar-ad':'current-sidebar-ad',
    'current-splash-ad':'current-splash-ad', 'current-text-ad':'current-text-ad',
    // v1.2.3 — derived; reconciled from the echo, never sent.
    'parent-category-name':'major-category-name',
    'parent-category-id':'major-category-id'
  };

  window.cmDoSave = function (publish) {
    // v1.2.2 — THE RULE: a field edited on the form updates the record; a
    // field NOT edited survives untouched. Scenario 114 maps every field as
    //     ifempty(1.fieldData.<camel>; 5.fieldData.<webflow-slug>)
    // against a getItem that reads the record at write time, so the client
    // sends ONLY what changed. Switches send "1"/"0" (114 reads them with
    // if()). A text field cannot be cleared through this path (known
    // limitation; the diff keeps it dirty and the toast names it).
    //
    // v1.2.4 — TWO STEPS, IN THIS ORDER.
    //   1 · Staged approvals: one Scenario G call per ADS row (action
    //       approveAd). An approval counts only when G's echo shows the
    //       Approved option id on that shape's approval field.
    //   2 · Scenario 114 with the field changes, the option fields as ids,
    //       and the current-ad pointers. A pointer whose version is still
    //       waiting for its approval is held back and stays gold, so a
    //       version is never made current unapproved.
    // A changed field counts as saved only when 114's echo shows it.
    var M = MODAL;
    var changes = {};
    ALL_FIELDS.forEach(function (f) {
      if (f.t === 'readonly' || f.t === 'auto') return;   // derived, or not ours to write
      if (M.edit[f.s] !== M.orig[f.s]) changes[f.s] = M.edit[f.s];
    });
    var stagedKeys = Object.keys(M.approve || {});
    if (!Object.keys(changes).length && !stagedKeys.length) return;

    // Option fields go to 114 as Webflow option ids (v1.2.4).
    var noId = Object.keys(changes).filter(function (k) {
      var f = fieldOf(k);
      return f && f.t === 'option' && changes[k] !== '' && !optIdOf(k, changes[k]);
    });
    if (noId.length) {
      cmToast('Not saved: ' + noId.map(function (k) { return fieldOf(k).l; }).join(', ') +
              ' — Webflow\u2019s choices are not loaded or the value is not one of them. Pick it again.', 'err');
      return;
    }
    if (Object.keys(changes).length && !CFG.updateUrl) {
      cmToast('Update endpoint not configured — add TA_CONFIG.makeUpdateCustomer', 'err');
      return;
    }

    var report = { approved: 0, approveFailed: [], saved: [], notSaved: [], held: [] };
    cmSaveBusy(true, publish);

    approveStaged(report)
      .then(function () {
        // Hold back a pointer whose version still waits for its approval.
        Object.keys(changes).forEach(function (k) {
          var f = fieldOf(k);
          if (isCurAd(f) && M.approve[changes[k] + '|' + f.shape]) { report.held.push(f.l); delete changes[k]; }
        });
        if (!Object.keys(changes).length) return null;
        return send114(changes, publish, report);
      })
      .then(function () {
        M.editing = {};
        M.groupOpen = {};   // v1.4.0
        renderModal();
        var bad = report.approveFailed.concat(report.notSaved, report.held.map(function (l) { return l + ' (waits for its approval)'; }));
        var parts = [];
        if (report.approved) parts.push(report.approved + ' approval' + (report.approved > 1 ? 's' : ''));
        if (report.saved.length) parts.push(report.saved.length + ' field' + (report.saved.length > 1 ? 's' : ''));
        if (!bad.length) {
          cmToast((parts.join(' and ') || 'Nothing') + (publish ? ' saved and published' : ' saved'), 'ok');
        } else {
          cmToast('Not saved: ' + bad.join(', ') + '. Still showing as unsaved.' + (parts.length ? ' Saved: ' + parts.join(' and ') + '.' : ''), 'err');
        }
      })
      .catch(function (err) {
        console.warn('[CLIENT MGR] Save failed:', err);
        // Whatever was not confirmed stays as it was: the edit survives.
        renderModal();
        cmToast(err && err.message ? err.message : 'Save failed', 'err');
      })
      .finally(function () { cmSaveBusy(false, publish); });
  };

  // v1.2.4 — step 1: staged approvals, one Scenario G call per ADS row (HC-P-CM124-3).
  function approveStaged(report) {
    var M = MODAL, byAd = {};
    Object.keys(M.approve || {}).forEach(function (k) {
      var p = k.split('|'); (byAd[p[0]] = byAd[p[0]] || {})[p[1]] = M.approve[k];
    });
    var ids = Object.keys(byAd);
    if (!ids.length) return Promise.resolve();
    if (!CFG.studioUrl) {
      ids.forEach(function (id) { Object.keys(byAd[id]).forEach(function (sh) { report.approveFailed.push(approveLabel(sh, id)); }); });
      return Promise.resolve();
    }
    var chain = Promise.resolve();
    ids.forEach(function (adId) {
      chain = chain.then(function () {
        var want = byAd[adId], body = { action: 'approveAd', titleSlug: CFG.titleSlug, adItemId: adId, source: 'client-manager-v' + CM_VERSION };
        Object.keys(APPROVAL_KEY).forEach(function (sh) { body[APPROVAL_KEY[sh]] = want[sh] || ''; });
        return fetch(CFG.studioUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
          .then(function (r) { return r.text().then(function (t) { var j; try { j = JSON.parse(t); } catch (e) { j = null; } return j; }); })
          .catch(function () { return null; })
          .then(function (j) {
            var fd = j && j.ok === true && j.fieldData && typeof j.fieldData === 'object' ? j.fieldData : null;
            if (!fd) console.warn('[CLIENT MGR] approveAd not confirmed for', adId, j);
            var slugs = (M.ads && M.ads.approvalFields) || {};
            Object.keys(want).forEach(function (sh) {
              var slug = slugs[sh] || (sh === 'text' ? 'text-ad-approval' : sh + '-approval');
              if (fd && String(fd[slug] || '') === String(want[sh])) {
                delete M.approve[adId + '|' + sh];
                var v = adById(sh, adId);
                if (v) {                                                  // v1.4.0: Approved or Sent back
                  v.approval = optName(APPROVAL_OPTS && APPROVAL_OPTS[sh], want[sh]) || v.approval;
                  v.selectable = String(want[sh]) === String(approvedOptId(sh));
                }
                report.approved++;
              } else report.approveFailed.push(approveLabel(sh, adId));
            });
          });
      });
    });
    return chain;
  }
  function approveLabel(shape, adId) {
    var v = adById(shape, adId);
    return 'approval of ' + (v ? v.name : adId) + ' (' + SHAPE_LABEL[shape] + ')';
  }

  // v1.2.4 — step 2: Scenario 114, changed fields only. Resolves; never commits what the echo does not show.
  function send114(changes, publish, report) {
    var M = MODAL, keys = Object.keys(changes), out = {}, sent = [];
    keys.forEach(function (k) {
      var camel = CREATE_KEY_MAP[k], fld = fieldOf(k), v = changes[k];
      if (!camel) { report.notSaved.push(fld ? fld.l : k); return; }   // nothing writes it: never "saved"
      sent.push(k);
      if (fld && fld.t === 'switch') out[camel] = (v === true || v === 'true' || v === '1') ? '1' : '0';
      else if (fld && fld.t === 'option') out[camel] = optIdOf(k, v);
      else out[camel] = v == null ? '' : v;
    });
    // 114 has no category lookup, so the parent name comes from here.
    if (Object.prototype.hasOwnProperty.call(changes, 'major-category')) {
      var mj = REF_DATA.majors.find(function (m) { return m.id === changes['major-category']; });
      out.parentCategoryName = mj ? mj.name : '';
    }
    if (!sent.length) return Promise.resolve();
    var payload = { action: 'update', titleSlug: CFG.titleSlug, taItemId: CFG.taItemId, publisherId: PUBLISHER_ID,
                    customerId: M.custId, publish: !!publish, fieldData: out, source: 'client-manager-v' + CM_VERSION };
    return fetch(CFG.updateUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (body) {
        var j; try { j = JSON.parse(body); } catch (e) { j = null; }
        if (!j || j.ok !== true) {
          console.warn('[CLIENT MGR] Unexpected save response:', body);
          throw new Error('Save was not confirmed — check Make execution history.');
        }
        var echoed = j.fieldData || j.customer || null;
        if (!echoed || typeof echoed !== 'object') throw new Error('Save returned no field data to verify against.');
        var c = CUSTOMERS.find(function (x) { return x.id === M.custId; });
        sent.forEach(function (k) {
          var wf = CM_TO_WF[k], fld = fieldOf(k);
          var want = (fld && fld.t === 'option') ? optIdOf(k, changes[k]) : changes[k];
          if (wf && Object.prototype.hasOwnProperty.call(echoed, wf) && cmSameValue(want, echoed[wf])) {
            report.saved.push(k);
            if (c && !isCurAd(fld)) c[k] = changes[k];
            M.orig[k] = changes[k];
          } else report.notSaved.push(fld ? fld.l : k);
        });
        // v1.2.3 — the derived fields, reconciled from what Webflow stored.
        ALL_FIELDS.forEach(function (f) {
          if (f.t !== 'auto' && f.t !== 'readonly') return;
          var wf = CM_TO_WF[f.s] || f.s;
          if (!Object.prototype.hasOwnProperty.call(echoed, wf)) return;
          var stored = echoed[wf];
          if (stored === null || typeof stored === 'object') return;
          M.orig[f.s] = stored; M.edit[f.s] = stored;
          if (c) c[f.s] = stored;
        });
        if (report.notSaved.length) console.warn('[CLIENT MGR] Not confirmed by server:', report.notSaved, 'echoed:', echoed);
      });
  }

  // v1.0.16: maps internal CMS slugs → the camelCase keys the
  // 111_IBX_createEditCustomer webhook expects (from blueprint).
  // Dropdowns send their label ("Active","Regular"); the scenario's
  // switch() resolves option IDs. Switches send booleans.
  var CREATE_KEY_MAP = {
    'name':                              'name',
    'customer-short-code':               'shortCode',
    'logo-initials':                     'logoInitials',
    'logo-link':                         'logoLink',
    'customer-type':                     'customerType',
    'client-status':                     'clientStatus',
    'profile-status':                    'profileStatus',
    'expert-contributor':                'expertContributor',
    'hide-from-directory':               'hideFromDirectory',
    'featured-listing':                  'featuredListing',
    'major-category':                    'majorCategory',
    'business-category':                 'businessCategory',
    'address':                           'address',
    'address-2':                         'address2',
    'city-st-zip':                       'cityStZip',
    'neighborhood':                      'neighborhood',
    'business-website':                  'website',
    'business-phone':                    'phone',
    'business-email':                    'email',
    'tagline':                           'tagline',
    'long-description':                  'longDescription',
    'services':                          'services',
    'txa-services-1':                    'txa1',
    'txa-services-2':                    'txa2',
    'txa-services-3':                    'txa3',
    'txa-services-4':                    'txa4',
    'txa-services-5':                    'txa5',
    'txa-services-6':                    'txa6',
    'facebook':                          'facebook',
    'instagram':                         'instagram',
    'tiktok':                            'tiktok',
    'youtube':                           'youtube',
    'linkedin':                          'linkedin',
    'x':                                 'x',
    'pinterest':                         'pinterest',
    'houzz':                             'houzz',
    'default-art-ad-get':                'defaultArtAdGet',
    'default-sponsorship-ad-link-ulc':   'defaultSponsorshipAd',
    // v1.2.4 — Scenario 114 only (Add mode never sends these)
    'current-banner-ad':                 'currentBannerAd',
    'current-sidebar-ad':                'currentSidebarAd',
    'current-splash-ad':                 'currentSplashAd',
    'current-text-ad':                   'currentTextAd'
  };

  window.cmDoCreate = function () {
    if (!MODAL || MODAL.mode !== 'add') return;
    if (MODAL.createState === 'creating') return;  // guard double-click

    // Validation — inline, no alert()
    var name = (MODAL.edit['name'] || '').trim();
    if (!name) {
      MODAL.createState = 'error';
      MODAL.createError = 'Customer Name is required.';
      renderModal();
      return;
    }
    if (!CFG.webhookUrl) {
      MODAL.createState = 'error';
      MODAL.createError = 'Create endpoint not configured (TA_CONFIG.clientManagerWebhook).';
      renderModal();
      return;
    }

    // Build webhook payload in the camelCase contract the scenario reads.
    var body = { titleSlug: CFG.titleSlug, publish: false };
    Object.keys(CREATE_KEY_MAP).forEach(function (slug) {
      var wireKey = CREATE_KEY_MAP[slug];
      var v = MODAL.edit[slug];
      if (v === undefined || v === null) return;
      if (typeof v === 'boolean') { body[wireKey] = v; return; }
      v = String(v).trim();
      if (v !== '') body[wireKey] = v;
    });

    MODAL.createState = 'creating';
    MODAL.createError = '';
    renderModal();

    fetch(CFG.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(function (res) {
        return res.json().catch(function () { throw new Error('Server returned a non-JSON response.'); });
      })
      .then(function (data) {
        if (!data || !data.ok) throw new Error((data && data.error) || 'Create failed. Please try again.');
        // Success — driven by Make response.
        var cust = data.customer || {};
        MODAL.createName = cust.name || name;
        MODAL.createPublished = !!body.publish;
        // Add the new record to the in-memory list so it appears on close.
        var newRec = { id: cust.id || ('new-' + Date.now()) };
        ALL_FIELDS.forEach(function (f) { newRec[f.s] = MODAL.edit[f.s]; });
        if (cust.id) newRec['self-this-item-id'] = cust.id;
        CUSTOMERS.push(newRec);
        MODAL.createState = 'done';
        renderModal();
        // v1.0.20: auto-redirect to the customer's page. Requires the 111
        // Webhook Response to include "slug" (module 3's Slug output) in
        // the customer object; without it we stay on the success screen
        // rather than navigating somewhere broken.
        if (cust.slug) {
          setTimeout(function () {
            window.location.href = '/end-customers/' + cust.slug;
          }, 600); // brief beat so the success state is visible, not a flash
        } else {
          console.warn('[CLIENT MGR] No slug in create response — add "slug": module 3 Slug to Scenario 111\u2019s Webhook Response to enable redirect.');
        }
      })
      .catch(function (err) {
        MODAL.createState = 'error';
        MODAL.createError = (err && err.message) ? err.message : 'Create failed. Please try again.';
        renderModal();
      });
  };

  // ── CSS ──
  function getCss() {
    return [
      /* v1.1.2: local .cm-hdr/.cm-hdr-l rules REMOVED. Markup now
         uses the shared .ix-hdr family (title-admin-page-design
         v1.4.20 s3). Re-adding local overrides here re-forks the
         header - don't. */
      '.cm-add-btn{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:6px 14px;border-radius:3px;border:1.5px solid #1a3a3a;background:#fff;color:#1a3a3a;cursor:pointer;transition:all .15s}',
      '.cm-add-btn:hover{background:#1a3a3a;color:#f0edd8}',

      '.cm-tb{display:flex;gap:6px;margin-bottom:8px;align-items:center;flex-wrap:wrap}',
      '.cm-fp{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:5px 12px;border-radius:3px;border:1.5px solid #e0ddd0;background:transparent;color:#5a6a5a;cursor:pointer;transition:all .15s}',
      '.cm-fp:hover{border-color:#c4a35a}',
      '.cm-fp.on{background:#1a3a3a;color:#fff;border-color:transparent}',
      '.cm-fp.gn{background:#1e7e4a;color:#fff;border-color:transparent}',
      '.cm-fp.bl{background:#1a5276;color:#fff;border-color:transparent}',
      '.cm-fp.am{background:#c07010;color:#fff;border-color:transparent}',
      '.cm-fp.rd{background:#c0392b;color:#fff;border-color:transparent}',
      '.cm-sp{flex:1}',
      '.cm-sr{font-family:"DM Sans",sans-serif;font-size:12px;padding:5px 10px 5px 28px;border:1.5px solid #d8d4c4;border-radius:3px;background:#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'13\' height=\'13\' fill=\'none\' stroke=\'%238a8a7a\' stroke-width=\'1.5\'%3E%3Ccircle cx=\'5.5\' cy=\'5.5\' r=\'4\'/%3E%3Cline x1=\'8.5\' y1=\'8.5\' x2=\'12\' y2=\'12\'/%3E%3C/svg%3E") no-repeat 8px center;color:#1a3a3a;outline:none;width:200px}',
      '.cm-sr:focus{border-color:#1a3a3a}',

      '.cm-mr{display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:0 2px}',
      '.cm-mt{display:inline-flex;align-items:center;gap:6px;cursor:pointer;-webkit-user-select:none;user-select:none}',
      '.cm-mc{width:14px;height:14px;accent-color:#c07010;cursor:pointer}',
      '.cm-ml{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;color:#5a6a5a}',
      '.cm-mt.ac .cm-ml{color:#c07010;font-weight:600}',
      '.cm-mn{font-family:"DM Mono",monospace;font-size:9px;color:#a0a090;background:#f0ede4;padding:1px 6px;border-radius:2px}',
      '.cm-mt.ac .cm-mn{background:#fdf6e8;color:#c07010}',

      '.cm-sb{display:flex;align-items:center;gap:10px;padding:8px 14px;background:#1a3a3a;color:#f0edd8;border-radius:6px;margin-bottom:10px;font-size:12px}',
      '.cm-sn{font-family:"DM Mono",monospace;font-size:11px;font-weight:600}',
      '.cm-ss{flex:1}',
      '.cm-sd{border:none;opacity:.7;font-size:10px;cursor:pointer;background:none;color:#f0edd8;font-family:"DM Mono",monospace}',
      '.cm-sd:hover{opacity:1}',

      '.cm-tw{border:1.5px solid #e0ddd0;border-radius:5px;overflow:hidden;background:#fff}',
      '.cm-tbl{width:100%;border-collapse:collapse;table-layout:fixed}',
      '.cm-tbl thead th{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;background:#f6f4ee;padding:9px 12px;text-align:left;border-bottom:1.5px solid #e0ddd0;cursor:pointer;-webkit-user-select:none;user-select:none;white-space:nowrap;transition:color .12s}',
      '.cm-tbl thead th:hover{color:#1a3a3a}',
      '.cm-th.cm-so{color:#1a3a3a;font-weight:600}',
      '.cm-ar{font-size:9px;margin-left:3px;opacity:.5}',
      '.cm-so .cm-ar{opacity:1}',
      '.cm-c0{width:36px;cursor:default!important}',
      '.cm-c5{width:70px;cursor:default!important}',
      '.cm-tbl tbody tr{border-bottom:1px solid #f0ede4;transition:background .1s}',
      '.cm-tbl tbody tr:last-child{border-bottom:none}',
      '.cm-tbl tbody tr:hover{background:#fdfcf8}',
      '.cm-tbl tbody tr.cm-sl{background:#faf5e8}',
      '.cm-tbl td{padding:9px 12px;font-size:12px;vertical-align:middle}',
      '.cm-ck{width:15px;height:15px;accent-color:#1a3a3a;cursor:pointer}',
      '.cm-cn{font-weight:600;color:#1a3a3a}',
      '.cm-cc{font-size:9px;font-family:"DM Mono",monospace;color:#a0a090;margin-top:1px}',
      '.cm-pill{font-family:"DM Mono",monospace;font-size:9px;padding:3px 9px;border-radius:3px;letter-spacing:.03em;display:inline-block;white-space:nowrap}',
      '.cm-pill.sa{background:#e8f5e9;color:#1e7e4a;border:1px solid #c8e6c9}',
      '.cm-pill.sps{background:#fdf6e8;color:#c07010;border:1px solid #f0dbb0}',
      '.cm-pill.spr{background:#eaf2fb;color:#1a5276;border:1px solid #b8d4f0}',
      '.cm-pill.si{background:#fdf0ef;color:#c0392b;border:1px solid #f0c4c0}',
      '.cm-pill.ta2{background:#eef6f1;color:#2d6a4f;border:1px solid #c8e6c9}',
      '.cm-pill.tc2{background:#f3eefb;color:#6b2fa0;border:1px solid #d8c8f0}',
      '.cm-pill.ts2{background:#fdf8e8;color:#8a6400;border:1px solid #f0dbb0}',
      '.cm-pd{display:inline-flex;align-items:center;gap:5px;font-family:"DM Mono",monospace;font-size:10px;white-space:nowrap}',
      '.cm-dt{width:8px;height:8px;border-radius:50%;flex-shrink:0}',
      '.cm-dt.do{background:#1e7e4a}',
      '.cm-dt.dw{background:#c07010}',
      '.cm-eb{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.04em;padding:4px 10px;border-radius:3px;border:1.5px solid #e0ddd0;background:#fff;color:#5a6a5a;cursor:pointer;transition:all .12s;white-space:nowrap}',
      '.cm-eb:hover{border-color:#1a3a3a;color:#1a3a3a}',
      '.cm-er td{text-align:center;padding:32px;color:#8a8a7a;font-family:"DM Mono",monospace;font-size:11px}',

      // Modal
      '.cm-mh{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1.5px solid #e0ddd0;background:#f6f4ee}',
      '.cm-mh-l{display:flex;align-items:center;gap:10px}',
      '.cm-mh-av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}',
      '.cm-mh-n{font-size:15px;font-weight:700;color:#1a3a3a}',
      '.cm-mh-s{font-size:9px;font-family:"DM Mono",monospace;color:#8a8a7a;margin-top:1px}',
      '.cm-mx{font-family:"DM Mono",monospace;font-size:11px;color:#c0392b;cursor:pointer;background:none;border:none;padding:4px 8px}',
      '.cm-mx:hover{opacity:.7}',
      '.cm-mb{padding:18px 0}',
      // v1.4.0: the client page, Publisher Portal look (ps-shell v1.0.2), scoped to .cm-pl (HC-P-CM140-3)
      '.cm-pl{--pl-ground:#FAF6EE;--pl-ground-2:#F1ECE2;--pl-paper:#fff;--pl-ink:#22252B;--pl-ink-2:#3A3E46;--pl-muted:#5A5E66;--pl-rule:#D9D2C3;--pl-rule-soft:#ECE6DA;--pl-hover:#FBF8F2;--pl-blue:#5B7FFF;--pl-blue-text:#3550C8;--pl-coral:#F48164;--pl-red:#DF4128;--pl-red-deep:#C2271A;--pl-red-pale:#FBE3DD;--pl-green:#0F5C3F;--pl-green-pale:#E2F1E9;--pl-amber:#7A4E12;--pl-gold:#C4A35A;--pl-serif:Newsreader,Georgia,serif;--pl-caps:"Josefin Sans",system-ui,sans-serif;--pl-sans:Sen,system-ui,sans-serif;background:var(--pl-ground) !important;color:var(--pl-ink);font-family:var(--pl-sans) !important;padding:6px 22px 0;max-width:none}',
      '.cm-pl *{font-family:inherit}',
      '.cm-pl .cm-back{font-family:var(--pl-sans) !important;font-size:12.5px;color:var(--pl-blue-text) !important;margin:6px 0 14px}',
      '.cm-pl .cm-hdr{display:flex;justify-content:space-between;align-items:flex-end;gap:16px}',
      '.cm-pl .cm-eyebrow{font-family:var(--pl-caps) !important;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--pl-muted) !important}',
      '.cm-pl .cm-h1{margin:4px 0 8px;font-family:var(--pl-serif) !important;font-weight:400;font-size:40px;line-height:1;letter-spacing:-.5px;color:var(--pl-ink) !important}',
      '.cm-pl .cm-facts{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;color:var(--pl-muted);align-items:center}',
      '.cm-pl .cm-hdr-r{display:flex;gap:10px;align-items:center;margin-bottom:6px}',
      '.cm-pl .cm-chip{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600}',
      '.cm-pl .cm-chip.ok{color:var(--pl-green);background:var(--pl-green-pale)}',
      '.cm-pl .cm-chip.warn{color:var(--pl-red-deep);background:var(--pl-red-pale)}',
      '.cm-pl .cm-chip.plain{color:var(--pl-muted);background:var(--pl-ground-2)}',
      '.cm-pl .cm-tabs{display:flex;gap:28px;margin:22px 0 0;border-bottom:1px solid var(--pl-rule)}',
      '.cm-pl .cm-tab{font-family:var(--pl-caps) !important;font-size:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:0 0 10px;background:none !important;border:0;border-bottom:3px solid transparent;margin-bottom:-1px;color:var(--pl-muted) !important;cursor:pointer;display:flex;align-items:center;gap:6px}',
      '.cm-pl .cm-tab.on{color:var(--pl-ink) !important;border-bottom-color:var(--pl-coral)}',
      '.cm-pl .cm-ct{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--pl-coral);color:#fff;font-family:var(--pl-sans) !important;font-size:11px;letter-spacing:0}',
      '.cm-pl .cm-pane{padding:20px 0 24px}',
      '.cm-pl .cm-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}',
      '.cm-pl .cm-span-4{grid-column:span 4}.cm-pl .cm-span-5{grid-column:span 5}.cm-pl .cm-span-6{grid-column:span 6}.cm-pl .cm-span-7{grid-column:span 7}.cm-pl .cm-span-8{grid-column:span 8}',
      '.cm-rec.cm-pl{max-width:none !important;width:100%;box-sizing:border-box}',
      '@media (min-width:1500px){.cm-pl .cm-grid.acct>.cm-card{grid-column:span 4}}',
      '@media (max-width:900px){.cm-pl .cm-grid>.cm-card{grid-column:span 12}}',
      '.cm-pl .cm-tab{border-radius:0 !important}',
      '.cm-pl img.cm-logo-read{display:block;width:auto !important;height:auto !important;max-width:200px !important;max-height:64px !important;object-fit:contain;padding:4px;border:1px solid var(--pl-rule-soft);background:#fff}',
      '.cm-pl .cm-kv dd.lnk{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.cm-pl .cm-card{border:1px solid var(--pl-rule);background:var(--pl-paper) !important;padding:14px 18px 16px;min-width:0}',
      '.cm-pl .cm-card.attn{border-top:3px solid var(--pl-coral)}',
      '.cm-pl .cm-card.dirty{border-color:var(--pl-gold)}',
      '.cm-pl .cm-card h3{margin:0 0 10px;font-family:var(--pl-caps) !important;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--pl-muted) !important;display:flex;justify-content:space-between;align-items:center;gap:8px}',
      '.cm-pl .cm-lk{font-family:var(--pl-sans) !important;font-size:12.5px;font-weight:600;color:var(--pl-blue-text) !important;background:none !important;border:0;padding:0;cursor:pointer;letter-spacing:0;text-transform:none}',
      '.cm-pl .cm-lk:hover{text-decoration:underline}',
      '.cm-pl .cm-lk-q{color:var(--pl-muted) !important;font-weight:400}',
      '.cm-pl .cm-cancel{font-size:12.5px;color:var(--pl-red-deep) !important;background:none !important;border:0;padding:0;cursor:pointer;text-decoration:underline}',
      '.cm-pl .cm-quiet{color:var(--pl-muted);font-size:13px}',
      '.cm-pl .cm-err{color:var(--pl-red-deep);font-size:13px;font-weight:600}',
      '.cm-pl .cm-todo{list-style:none;margin:0;padding:0}',
      '.cm-pl .cm-todo li{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--pl-rule-soft);font-size:14px}',
      '.cm-pl .cm-todo li:first-child{border-top:0}',
      '.cm-pl .cm-act{margin-left:auto;flex:none}',
      '.cm-pl .cm-dot{width:9px;height:9px;border-radius:50%;flex:none}',
      '.cm-pl .cm-dot.s{background:var(--pl-coral)}.cm-pl .cm-dot.g{background:var(--pl-gold)}.cm-pl .cm-dot.q{background:var(--pl-rule)}',
      '.cm-pl .cm-cm{font-size:13.5px;margin-bottom:10px}',
      '.cm-pl .cm-board{display:flex;gap:4px;flex-wrap:wrap;margin:6px 0 4px}',
      '.cm-pl .cm-b{width:14px;height:14px;border-radius:50%;border:1.5px solid var(--pl-green)}',
      '.cm-pl .cm-b.ran{background:var(--pl-green)}',
      '.cm-pl .cm-b.pl{background:repeating-linear-gradient(45deg,var(--pl-green) 0 2px,var(--pl-green-pale) 2px 4px)}',
      '.cm-pl .cm-b.due{background:var(--pl-coral);border-color:var(--pl-coral)}',
      '.cm-pl .cm-b.miss{border-color:var(--pl-red);border-width:2px}',
      '.cm-pl .cm-b.tc{border-color:var(--pl-rule)}',
      '.cm-pl .cm-sum{font-size:12.5px;color:var(--pl-muted)}',
      '.cm-pl .cm-bar{display:flex;width:120px;height:9px;border-radius:5px;overflow:hidden;background:var(--pl-rule-soft)}',
      '.cm-pl .cm-bar i{display:block;height:100%}',
      '.cm-pl .cm-bar i.ran{background:var(--pl-green)}.cm-pl .cm-bar i.pl{background:repeating-linear-gradient(45deg,var(--pl-green) 0 2px,var(--pl-green-pale) 2px 4px)}.cm-pl .cm-bar i.due{background:var(--pl-coral)}.cm-pl .cm-bar i.miss{background:var(--pl-red)}',
      '.cm-pl .cm-run{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}',
      '.cm-pl .cm-slot{border:1px solid var(--pl-rule-soft);padding:10px;background:var(--pl-hover) !important;min-width:0}',
      '.cm-pl .cm-k{font-family:var(--pl-caps) !important;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--pl-muted);margin-bottom:7px}',
      '.cm-pl .cm-w{font-size:12.5px;font-weight:600;margin-top:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.cm-pl .cm-emptybox{border:1.5px dashed var(--pl-rule);color:var(--pl-muted);font-size:12.5px;display:flex;align-items:center;justify-content:center;background:var(--pl-paper) !important;min-height:48px}',
      '.cm-pl .cm-ca-img{max-width:100%;max-height:72px;border:1px solid var(--pl-rule-soft);border-radius:0}',
      '.cm-pl .cm-ca-img--sidebar{max-height:120px}',
      '.cm-pl .cm-ca-txt{display:block;max-width:none;font-size:12.5px;color:var(--pl-ink-2);background:var(--pl-paper);border:1px solid var(--pl-rule-soft);padding:8px}',
      '.cm-pl .cm-kv{display:grid;grid-template-columns:130px minmax(0,1fr);gap:7px 12px;margin:0;font-size:14px}',
      '.cm-pl .cm-kv dt{font-size:12.5px;color:var(--pl-muted);padding-top:1px}',
      '.cm-pl .cm-kv dd{margin:0;min-width:0;overflow-wrap:anywhere}',
      '.cm-pl .cm-kv dd.chg{box-shadow:inset 3px 0 0 var(--pl-gold);padding-left:8px}',
      '.cm-pl .cm-shape{display:grid;grid-template-columns:210px minmax(0,1fr);gap:20px;padding:18px 0;border-top:1px solid var(--pl-rule-soft)}',
      '.cm-pl .cm-shape:first-child{border-top:0;padding-top:4px}',
      '.cm-pl .cm-lbl{font-family:var(--pl-serif) !important;font-size:22px;color:var(--pl-ink);line-height:1.1}',
      '.cm-pl .cm-sub{font-size:12.5px;color:var(--pl-muted);margin-top:6px;line-height:1.45}',
      '.cm-pl .cm-vers{display:flex;gap:12px;overflow-x:auto;padding-bottom:4px}',
      '.cm-pl .cm-ver{flex:none;width:240px;border:1px solid var(--pl-rule);padding:8px;background:var(--pl-paper) !important}',
      '.cm-pl .cm-ver.cur{border:2px solid var(--pl-green)}',
      '.cm-pl .cm-ver.wait{background:var(--pl-ground) !important}',
      '.cm-pl .cm-ver.wait .cm-ca-img{opacity:.55}',
      '.cm-pl .cm-ver.gold{border:2px solid var(--pl-gold) !important;box-shadow:0 0 0 3px rgba(196,163,90,.12)}',
      '.cm-pl .cm-nm{font-size:13px;font-weight:600;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.cm-pl .cm-mt{font-size:12px;color:var(--pl-muted);margin-top:1px}',
      '.cm-pl .cm-vrow{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:8px;min-height:20px}',
      '.cm-pl .cm-tblw{overflow-x:auto}',
      '.cm-pl .cm-rtbl{width:100%;border-collapse:collapse;font-size:12.5px;background:var(--pl-paper)}',
      '.cm-pl .cm-rtbl th{font-weight:600;font-size:11.5px;color:var(--pl-muted);text-align:left;padding:8px 6px;background:var(--pl-ground-2) !important;border-bottom:1px solid var(--pl-rule);white-space:nowrap}',
      '.cm-pl .cm-rtbl td{padding:7px 6px;border-top:1px solid var(--pl-rule-soft);white-space:nowrap}',
      '.cm-pl .cm-placeholder{border:1.5px dashed var(--pl-rule);padding:32px;text-align:center;color:var(--pl-muted);font-size:14px;line-height:1.55;background:var(--pl-paper) !important}',
      '.cm-pl .cm-placeholder b{font-family:var(--pl-serif) !important;font-weight:500;font-size:20px;color:var(--pl-ink)}',
      '.cm-pl .cm-gr{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px 12px}',
      '.cm-pl .cm-gi-l{font-family:var(--pl-sans) !important;font-size:12px;font-weight:600;letter-spacing:0;text-transform:none;color:var(--pl-muted)}',
      '.cm-pl .cm-gi-v,.cm-pl .cm-esel,.cm-pl .cm-ei,.cm-pl .cm-ein,.cm-pl textarea,.cm-pl input,.cm-pl select{font-family:var(--pl-sans) !important}',
      '.cm-pl .cm-save{margin:0 -22px;border-radius:0}',
      '.cm-pl .cm-mf-dc{font-family:var(--pl-sans) !important;font-size:12.5px;color:var(--pl-muted)}',
      '.cm-pl .has-changes .cm-mf-dc{color:var(--pl-amber);font-weight:600}',
      '.cm-pl .cm-pbtn{font-family:var(--pl-sans) !important;font-size:13px;font-weight:600;letter-spacing:0;padding:7px 18px;border-radius:999px;border:1.5px solid var(--pl-blue);background:var(--pl-blue) !important;color:#fff !important;cursor:pointer}',
      '.cm-pl .cm-pbtn.ghost{background:var(--pl-paper) !important;color:var(--pl-blue-text) !important}',
      '.cm-pl .cm-pbtn[disabled]{opacity:.45;cursor:default}',
      '.cm-pl .asm-cancel-link{font-family:var(--pl-sans) !important;font-size:12.5px}',
      // v1.3.0: the record surface
      '.cm-rec{max-width:1100px}',
      '.cm-back{font-family:"DM Mono",monospace;font-size:11px;letter-spacing:.03em;color:#5a6a5a;background:none;border:none;padding:2px 0;margin:0 0 10px;cursor:pointer}',
      '.cm-back:hover{color:#1a3a3a;text-decoration:underline}',
      '.cm-rh{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:0 0 12px;border-bottom:1.5px solid #e0ddd0}',
      '.cm-rh-l{display:flex;flex-direction:column;gap:2px;min-width:0}',
      '.cm-eyebrow{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;line-height:1.2;color:var(--ix-gold-ink,#8A6E2E) !important}',
      '.cm-rh-n{font-size:22px;font-weight:700;line-height:1.2;color:#1a3a3a;margin:0}',
      '.cm-rh-r{display:flex;align-items:center;gap:8px;flex:none}',
      '.cm-ca-cur--text{flex-direction:column;align-items:flex-start;gap:3px}',
      '.cm-ca-cur--text .cm-ca-txt{max-width:none}',
      '.cm-gp{margin-bottom:16px}',
      '.cm-gh{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #f0ede4}',
      '.cm-gh-t{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;font-weight:600}',
      '.cm-gh-c{font-family:"DM Mono",monospace;font-size:9px;color:#a0a090;margin-left:auto}',
      '.cm-gr{display:grid;grid-template-columns:repeat(6,1fr);gap:8px 12px;align-items:start}',
      '.cm-w1{grid-column:span 1}.cm-w2{grid-column:span 2}.cm-w3{grid-column:span 3}',
      '.cm-w4{grid-column:span 4}.cm-w5{grid-column:span 5}.cm-w6{grid-column:span 6}',
      '@media(max-width:720px){.cm-w1,.cm-w2{grid-column:span 3}.cm-w3,.cm-w4,.cm-w5{grid-column:span 6}}',
      '.cm-drawer{border:1.5px solid #e0ddd0;border-radius:8px;background:#f4f2ea;margin:6px 0 14px}',
      '.cm-drawer-s{cursor:pointer;padding:11px 15px;font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:#5a6a5a;list-style:none;display:flex;gap:8px;align-items:center}',
      '.cm-drawer-s::before{content:"\\25b8";color:#c4a35a}',
      '.cm-drawer[open] .cm-drawer-s::before{content:"\\25be"}',
      '.cm-drawer .cm-gr{padding:12px 15px;border-top:1.5px solid #e0ddd0}',
      '.cm-gi{display:flex;flex-direction:column;align-items:stretch;gap:3px;padding:6px 9px;border-radius:6px;min-height:30px;border:1.5px solid transparent;transition:all .12s}',
      '.cm-gi:hover{background:#faf9f5}',
      '.cm-gi.cm-dirty{border-color:#c4a35a;background:#faf5e8}',
    /* v1.2.3 — explicit Off/On pair. A checkbox could not distinguish */
    /* "off" from "never set", and off rendered as an em-dash. */
    '.cm-esw2{display:inline-flex;border:1px solid #d8d3c4;border-radius:7px;overflow:hidden}',
    '.cm-esw2-b{padding:6px 16px;font:600 12px/1 DM Sans,sans-serif;background:#fff;color:#77736a;border:0;cursor:pointer}',
    '.cm-esw2-b+.cm-esw2-b{border-left:1px solid #d8d3c4}',
    '.cm-esw2-b.is-sel{background:#1a3a3a;color:#fff}',
    '.cm-toast-host{position:fixed;right:20px;bottom:20px;z-index:2147483600;display:flex;flex-direction:column;gap:8px}',
    '.cm-toast{padding:11px 15px;border-radius:8px;font:600 13px/1.4 DM Sans,sans-serif;color:#fff;box-shadow:0 6px 20px rgba(0,0,0,.22);max-width:380px;opacity:1;transition:opacity .35s}',
    '.cm-toast--ok{background:#2f6b46}',
    '.cm-toast--err{background:#a33a26}',
    '.cm-toast.out{opacity:0}',
    '.cm-mf-sv.cm-busy,.cm-mf-pub.cm-busy{opacity:.65;cursor:progress}',
      '.cm-gi{position:relative}',
      '.cm-gi-d{width:6px;height:6px;border-radius:50%;position:absolute;left:10px;top:12px}',
      '.cm-gi-ok{background:#1e7e4a}',
      '.cm-gi-mt{background:#d0cdc0}',
      '.cm-gi-l{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;padding-left:12px;padding-right:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.cm-gi-v{font-size:12.5px;color:#1a3a3a;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:2px 0 0 12px}',
      '.cm-gi-v.cm-empty{color:#a0a090;font-style:italic;text-align:left}',
      '.cm-gi-v a{color:#1a3a3a;text-decoration:none;font-size:11px}',
      '.cm-gi-v a:hover{text-decoration:underline}',
      '.cm-img-tag{font-family:"DM Mono",monospace;font-size:9px;color:#1a5276;background:#eaf2fb;padding:1px 6px;border-radius:2px}',
      '.cm-gi-e{min-width:0;padding:0}',
      '.cm-gi-act{display:flex;align-items:center;gap:4px;position:absolute;right:7px;top:6px}',
      '.cm-pen{width:22px;height:22px;border:none;background:none;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;border-radius:3px;transition:background .1s}',
      '.cm-pen:hover{background:#f0ede4}',
      '.cm-cancel-lk{font-family:"DM Mono",monospace;font-size:9px;color:#c0392b;cursor:pointer;background:none;border:none;padding:2px 4px}',
      '.cm-cancel-lk:hover{opacity:.7}',
      '.cm-ei{font-family:"DM Sans",sans-serif;font-size:11px;padding:3px 6px;border:1.5px solid #c4a35a;border-radius:3px;background:#fff;color:#1a3a3a;outline:none;width:100%}',
      '.cm-ei:focus{border-color:#1a3a3a}',
      '.cm-esel{font-family:"DM Sans",sans-serif;font-size:11px;padding:3px 6px;border:1.5px solid #c4a35a;border-radius:3px;background:#fff;color:#1a3a3a;outline:none;width:100%;cursor:pointer;-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'5\'%3E%3Cpath d=\'M1 1l3 3 3-3\' fill=\'none\' stroke=\'%238a8a7a\' stroke-width=\'1.2\' stroke-linecap=\'round\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 6px center;padding-right:20px}',
      '.cm-esw{display:flex;align-items:center;gap:6px}',
      '.cm-esw input{accent-color:#1a3a3a}',
      '.cm-esw span{font-size:11px;color:#1a3a3a}',

      '.cm-mf{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-top:1.5px solid #e0ddd0;background:#f6f4ee;flex-wrap:wrap;gap:8px}',
      '.cm-mf-l{display:flex;align-items:center;gap:12px}',
      '.cm-mf-i{font-family:"DM Mono",monospace;font-size:9px;color:#8a8a7a}',
      '.cm-mf-dc{font-family:"DM Mono",monospace;font-size:9px;color:#c4a35a;font-weight:600}',
      '.cm-mf-ca{font-family:"DM Mono",monospace;font-size:10px;color:#c0392b;cursor:pointer;background:none;border:none}',
      '.cm-mf-ca:hover{opacity:.7}',
      '.cm-mf-r{display:flex;align-items:center;gap:8px}',
      '.cm-mf-sv{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:6px 16px;border-radius:3px;border:none;background:#c4a35a;color:#fff;cursor:pointer;font-weight:600;transition:opacity .12s}',
      '.cm-mf-sv:hover{opacity:.85}',
      '.cm-mf-sv:disabled{opacity:.4;cursor:not-allowed}',
      '.cm-mf-pub{font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;padding:6px 16px;border-radius:3px;border:none;background:#1a3a3a;color:#f0edd8;cursor:pointer;transition:opacity .12s}',
      '.cm-mf-pub:hover{background:#244a4a}',
      '.cm-mf-pub:disabled{opacity:.4;cursor:not-allowed}',
      '.cm-lock{font-size:11px;opacity:.4}',
      '.cm-lock-auto{font-family:"DM Mono",monospace;font-size:8px;color:#8a8a7a;background:#f0ede4;padding:1px 5px;border-radius:2px;letter-spacing:.03em}',
      '.cm-esel:disabled{opacity:.5;cursor:not-allowed;background:#f6f4ee}',
      '.cm-upload-wrap{display:flex;align-items:center;gap:6px}',
      '.cm-upload-val{font-family:"DM Mono",monospace;font-size:9px;color:#1a3a3a;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.cm-upload-clear{font-size:11px;color:#c0392b;background:none;border:none;cursor:pointer;padding:0 2px}',
      '.cm-upload-btn{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.04em;padding:3px 10px;border-radius:3px;border:1.5px solid #1a3a3a;background:#fff;color:#1a3a3a;cursor:pointer}',
      '.cm-upload-btn:hover{background:#1a3a3a;color:#f0edd8}',
      '.cm-scrape{padding:14px 20px;background:#faf9f5;border-bottom:1px solid #ece8dc}',
      '.cm-scrape-row{display:flex;align-items:center;gap:8px}',
      '.cm-scrape-ic{font-size:14px;flex:0 0 auto}',
      '.cm-scrape-in{flex:1 1 auto;font-family:"DM Sans",sans-serif;font-size:13px;padding:8px 11px;border:1.5px solid #d8d3c4;border-radius:5px;background:#fff;color:#1a293b;outline:none;transition:border-color .12s}',
      '.cm-scrape-in:focus{border-color:#5b7fff}',
      '.cm-scrape-in:disabled{opacity:.6;cursor:not-allowed}',
      '.cm-scrape-btn{flex:0 0 auto;font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.04em;font-weight:600;padding:8px 16px;border-radius:5px;border:none;background:#5b7fff;color:#fff;cursor:pointer;transition:opacity .12s;display:inline-flex;align-items:center;gap:6px}',
      '.cm-scrape-btn:hover{opacity:.88}',
      '.cm-scrape-btn:disabled{opacity:.5;cursor:not-allowed}',
      '.cm-scrape-msg{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.02em;margin-top:7px;line-height:1.4}',
      '.cm-scrape-hint{color:#8a8a7a}',
      '.cm-scrape-ok{color:#1a3a3a}',
      '.cm-scrape-err{color:#c0392b}',
      '.cm-spin{width:11px;height:11px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;display:inline-block;animation:cm-spin .6s linear infinite}',
      '@keyframes cm-spin{to{transform:rotate(360deg)}}',
      '.cm-logo-pick{margin-top:11px}',
      '.cm-logo-pick-lbl{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.03em;color:#8a8a7a;margin-bottom:6px}',
      '.cm-logo-strip{display:flex;flex-wrap:wrap;gap:7px}',
      '.cm-logo-thumb{width:54px;height:54px;padding:3px;border:1.5px solid #d8d3c4;border-radius:5px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;overflow:hidden;transition:border-color .12s;position:relative}',
      '.cm-logo-thumb:hover{border-color:#5b7fff}',
      '.cm-logo-thumb img{max-width:100%;max-height:100%;object-fit:contain}',
      '.cm-logo-sel{border-color:#c4a35a;border-width:2.5px;background:#faf5e8}',
      '.cm-logo-busy{opacity:.55;position:relative}',
      '.cm-logo-spin{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:16px;color:#5b7fff;background:rgba(255,255,255,.7)}',
      '.cm-logo-err{border-color:#c94a4a}',
      '.cm-logo-x{position:absolute;top:2px;right:2px;width:14px;height:14px;border-radius:50%;background:#c94a4a;color:#fff;font-size:10px;line-height:14px;text-align:center}',
      '.cm-logo-errmsg{margin-top:6px;font-size:11px;color:#c94a4a}',
      '.cm-logo-variants{margin-top:10px;display:flex;align-items:center;gap:8px}',
      '.cm-logo-vbtn{display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px;border:1.5px solid #d8d3c4;border-radius:5px;background:#fff;cursor:pointer;font-family:"DM Mono",monospace;font-size:9px;color:#5a5a4a}',
      '.cm-logo-vbtn img{width:40px;height:40px;object-fit:contain}',
      '.cm-logo-vsel{border-color:#c4a35a;border-width:2px;background:#faf5e8}',
      '.cm-gi.cm-dirty .cm-esel{border-color:#c4a35a;background:#faf5e8}',
      // v1.2.4: current ads
      '.cm-ca-cur{display:flex;align-items:center;gap:8px;min-width:0;padding-right:44px}',
      '.cm-ca-img{display:block;max-height:44px;max-width:150px;object-fit:contain;border:1px solid #e0ddd0;border-radius:3px;background:#fff;flex:none}',
      '.cm-ca-img--sidebar{max-height:64px;max-width:56px}',
      '.cm-ca-txt{font-size:11px;color:#3a4a4a;line-height:1.35;max-width:220px;flex:none}',
      '.cm-ca-nm{font-size:12px;color:#1a3a3a;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}',
      '.cm-ca-dt{font-family:"DM Mono",monospace;font-size:9px;color:#8a8a7a}',
      '.cm-ca-meta{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}',
      '.cm-ca-list{display:flex;flex-direction:column;gap:4px;padding-right:44px;max-height:320px;overflow:auto}',
      '.cm-ca-row{display:flex;align-items:center;gap:8px;padding:5px 7px;border:1.5px solid #e0ddd0;border-radius:4px;background:#fff;text-align:left;cursor:pointer;font:inherit;width:100%}',
      '.cm-ca-row:hover{border-color:#c4a35a}',
      '.cm-ca-row.is-sel{border-color:#c4a35a;background:#faf5e8}',
      '.cm-ca-row.is-off{cursor:default;opacity:.55;background:#f6f4ee}',
      '.cm-ca-row.is-off:hover{border-color:#e0ddd0}',
      '.cm-ca-radio{width:12px;height:12px;border-radius:50%;border:1.5px solid #8a8a7a;flex:none}',
      '.cm-ca-row.is-sel .cm-ca-radio{border-color:#c4a35a;background:radial-gradient(#c4a35a 0 3px,transparent 3.5px)}',
      '.cm-ca-div{font-family:"DM Mono",monospace;font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a7a;border-top:1px solid #e0ddd0;padding-top:6px;margin-top:4px}',
      '.cm-ca-ap{font-family:"DM Mono",monospace;font-size:10px;color:#1a5276;background:none;border:none;cursor:pointer;padding:2px 4px;text-decoration:underline;flex:none}',
      '.cm-ca-st{font-family:"DM Mono",monospace;font-size:9px;color:#9a7a2a;flex:none}',
      '.cm-ca-undo{color:#c0392b;cursor:pointer;margin-left:4px;text-decoration:underline}',
      '.cm-ca-err{font-size:11px;color:#c0392b}',
      '.cm-ca-none{font-size:11px}',
      // v1.0.16: create success card + inline error
      '.cm-success{display:flex;flex-direction:column;align-items:center;text-align:center;padding:44px 24px;gap:12px}',
      '.cm-success-ic{width:52px;height:52px;border-radius:50%;background:#1a3a3a;color:#fff;font-size:26px;display:flex;align-items:center;justify-content:center}',
      '.cm-success-t{font-size:18px;font-weight:700;color:#1a3a3a}',
      '.cm-success-s{font-size:12px;font-family:"DM Mono",monospace;color:#8a8a7a;line-height:1.5;max-width:380px}',
      '.cm-success-btn{margin-top:8px;font-family:"DM Mono",monospace;font-size:11px;letter-spacing:.04em;font-weight:600;padding:9px 28px;border-radius:5px;border:none;background:#5b7fff;color:#fff;cursor:pointer;transition:opacity .12s}',
      '.cm-success-btn:hover{opacity:.88}',
      '.cm-create-err{margin:0 0 14px;padding:10px 13px;border-radius:5px;background:#fdecea;border:1px solid #f0b4ad;color:#c0392b;font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.02em;line-height:1.45}'
    ].join('\n');
  }

  // ── Init ──
  render();
  console.log('\u{1F465} Client Manager v' + CM_VERSION + ' mounted — ' + CUSTOMERS.length + ' customers, ' + REF_DATA.majors.length + ' majors, ' + REF_DATA.subs.length + ' subs, ' + REF_DATA.directories.length + ' dirs, ' + REF_DATA.archives.length + ' archives');

  // ── v1.0.20: adgen deep-link consumer ──
  // The end-customers page's "Generate Ad" button links to
  // /title-admin/{slug}?adgenCust={id}&adgenName={name}. On arrival:
  // stash the customer (window + sessionStorage) for AdGen to consume,
  // then open Studio's Generate tab by clicking it once it exists.
  // NOTE: AdGen v0.1.0 does not yet READ the preselect — landing on the
  // right panel works today; auto-filling the customer inside AdGen is
  // a small future AdGen patch (reads window.IX_ADGEN_PRESELECT).
  (function () {
    var qs = new URLSearchParams(window.location.search);
    var custId = qs.get('adgenCust');
    if (!custId) return;
    var pre = { id: custId, name: qs.get('adgenName') || '' };
    window.IX_ADGEN_PRESELECT = pre;
    try { sessionStorage.setItem('ix-adgen-preselect', JSON.stringify(pre)); } catch (e) {}
    console.log('[CLIENT MGR] adgen deep-link — customer stashed:', pre.name || pre.id);

    var tries = 0;
    var t = setInterval(function () {
      tries++;
      // Try known tab hooks first, then fall back to a Studio tab whose
      // visible label is exactly "Generate".
      var btn = document.querySelector('[data-std-tab="adgen"], [data-tab="adgen"], [data-panel-key="adgen"]');
      if (!btn) {
        var cands = document.querySelectorAll('.std-tab, [class*="std-tab"], button, a');
        for (var i = 0; i < cands.length; i++) {
          if ((cands[i].textContent || '').trim() === 'Generate') { btn = cands[i]; break; }
        }
      }
      if (btn) {
        clearInterval(t);
        btn.click();
        console.log('[CLIENT MGR] adgen deep-link — Generate tab opened.');
      } else if (tries > 40) { // ~10s
        clearInterval(t);
        console.warn('[CLIENT MGR] adgen deep-link — Generate tab not found; customer remains stashed for manual open.');
      }
    }, 250);
  })();
});
