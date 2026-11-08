/* ta-admaker-v2.2.0.js
   ════════════════════════════════════════════════════════════════
   INBXIFY TA Studio — AD MAKER (sub-tab)

   Turns an advertiser's print ad, a dropped file, an earlier version or
   nothing at all into a newsletter banner and sidebar, and lists every ad
   job waiting. Replaces ta-adreformat v0.6.0 (Ad Reformat) and ta-adgen
   v0.1.0 (Generate). Built to SS-Fork-B-Creative-Scoping-v0_4.md §04 and
   the "Ad Maker · UI mockup v0.3" artifact.

   Load in the TITLES-ADMIN Template page BODY custom code AFTER
   ix-ad-layouts-v1.0.1.js, ix-pdf-pager-v1.1.0.js, ix-info and
   ix-success-toast, and AFTER ta-studio (v1_4_13 dispatches
   std:panel:admaker). Companion: ta-admaker-v1.1.0.css (head).

   ── v1.5.0 · SS-Fork B · Creative S7 (7 Nov 2026, logo read by Worker) ──
   Needs extract-client v1.4.0 (/logo). Logo files are no longer read
   in the browser: TA_CONFIG.extractClientUrl + /logo fetches the file
   server-side (Uploadcare 64px PNG preview, any host) and answers
   tone and transparency. Logo card redrawn at a readable size: 240px
   tiles on the background each file is meant for, grey text when a
   file is missing, swap offer whenever Logo Link Light is empty.
   ── v2.0.0 · SS-Fork B · Creative S7 (7 Nov 2026) · REBUILD TO THE CANVAS ──
   The screens are rebuilt to the approved click-through (canvas artboard
   "Click-through", https://claude.ai/artifact/XugJHxPZkAV5fXgeo6kDhV).
   The engine (reading, painting, fine-tune mechanics, the save chain, the
   send-back fix) is the v1.5 engine untouched. What changed:
   · ONE FRAME on every step: left = the job (Working on + Up next), right
     = The drafts will use (logo, photo, fonts, colours), centre = the work
     of that step. Only the centre changes.
   · The five steps are the spine: a row of boxes under the title with a
     line each; current solid teal, done ticked; a reached step is clickable.
   · The bar is identical on every step: message · Cancel · Back · one
     primary. Save is the step-5 primary, in the bar, like any other save.
     Step 5 shows what will be written before Save, then progress/result.
   · LOGO IS NOT A CHOICE. The customer's file is the logo: two chips (light
     panels / dark panels), "Nothing to decide". A known-light file in the
     dark slot gets one sentence and one link. No logo on the customer ->
     one ask for a file link (saved to the record on Save); the print cut
     is a last-resort link under that ask, this version only. The side-by-
     side picker (v1.4-1.5) is gone; logoTiles/readLogoPicker removed.
   · Selected = blue. Gold = changed and unsaved, nothing else.
   · Fine-tune keeps its ruled mechanics inside the frame: the shortlist is
     a strip over the stage, the controls take the right column.
   HC-P-SSB7-5 (provisional): STEP_NAMES / STEP_SUBS - the step row's words.
   ── v2.0.1 (7 Nov 2026) ── CSS only: the T-A page paints b/span white inside
   the step boxes; every element inside a step is forced transparent.
   ── v2.0.2 (8 Nov 2026) ── render() keeps every column's scroll position, not just the left one.
   ── v2.0.3 (8 Nov 2026) ── the stage's click box for a text piece hugs the drawn text, not the layout's reserved slot.
   ── v2.1.0 · SS-Fork B · Creative S7 (8 Nov 2026) · MAKE, the workbench (canvas "Make") ──
   Four steps: Start · Read · Make · Save. Drafts and Fine-tune are one step.
   · Make opens with the engine's best pick per shape, with and without the
     photo (two cards, or four with a photo). Every card is live; the selected
     one also sits on a 100% stage with the piece overlay, crop drag and the
     background split handle.
   · "Apply to: this one / all" at the top of the controls; every control
     obeys it (wording, type and colour, size, position, backgrounds, plate,
     arrangement, photo zoom). Arrangement and zoom only reach cards they fit.
   · Two backgrounds: ix-ad-layouts v1.3.0 paints sr.bg2 { color, w, side };
     dragged on the stage, or the slider. Palette = colours found in the ad,
     brand main/accent, ink, white, plus any hex you add (this session only).
   · "+ Variations of this one" clones the selected card with a nudge (photo
     zoomed, or a swapped background) as a new card, Saves off until ticked.
   · A font that arrives after the first paint triggers one more paint, so a
     typed or picked font takes without going back.
   · Fix-after-send-back keeps the v2.0 fine-tune screen (vTune) for its one shape.
   Requires ix-ad-layouts v1.3.0.
   ── v2.2.0 · SS-Fork B · Creative S7 (8 Nov 2026) · ONE SHAPE AT A TIME (canvas Start2 / Make2) ──
   · Start asks three things in order: who, WHICH SHAPE (banner · sidebar;
     splash and text ad shown as coming), from what. The Needs-action card
     pre-fills the shape; the choice is still shown and must be made.
   · Make is one room. It opens with up to PROPOSAL_MAX proposals of that one
     shape: every layout that suits it × every colour found in the ad (plus
     the layout's own) × the font pairs, colours dominating. Click one and it
     comes forward at 100% with the controls; the rest sit dimmed behind it,
     still clickable. Edits stay on the one you made them on.
   · KEEP puts the forward item in the save set; Keep again takes it out.
     CLONE copies it as a new, selected item. VARIATIONS replaces the unkept
     proposals with recolours of the forward one. Kept items never move.
   · Save writes the kept set, nothing else. The old Saves tick is gone.
   · Font controls are pickers (each option in its own face), not free text.
   · The "apply to all" switch (v2.1.0) is withdrawn with the four-shape grid.
   HC-P-SSB7-8 (provisional): PROPOSAL_MAX = 8, AD_COLOURS_MAX = 3.
   ── v1.5.2 · SS-Fork B · Creative S7 (7 Nov 2026) ──
   Dark-slot tile is white only once the file is confirmed dark; unknown or
   light files sit on a grey checker so a white logo can be seen. Swap offer
   is one line. The /logo failure is logged to the console once per file.
   ── v1.5.1 · SS-Fork B · Creative S7 (7 Nov 2026, Read screen redo) ──
   The Read screen's right column held two 260px tiles in a 320px column
   (the page side-scrolled; everything beneath inherited the half-width
   lane) and a second logo picker under the first. Now: one logo control
   (readLogoPicker) in a 340px column, the customer's two files side by
   side inside option 1, the print cut as option 2. Selected = blue; gold
   only for a choice that writes to the customer on Save (Replace the
   file). Failure copy in plain words (the Worker's error is a title
   attribute). CMS field names out of the labels. The how-it-was-read note
   sits under the source. placeBar() sizes the panel to the viewport so the
   fixed save bar never covers a column. Back link is grey, not gold.
   Companion CSS ta-admaker-v1.5.0.css.
   ── v1.4.0 · SS-Fork B · Creative S6 (7 Nov 2026, two logos) ──
   Needs ix-ad-layouts v1.2.0. A customer has a dark logo (Logo Link,
   for light panels) and a light logo (Logo Link Light, for dark
   panels). Ad Maker reads both, shows both on Start and Read on the
   swatch they are meant for, tells you the tone of each file and when
   Logo Link holds a light file (with a one-click swap, saved to the
   customer on Save if ticked), and Fine-tune's Logo piece gets a
   Which file control: Auto / Dark / Light, kept in the recipe.
   Companion CSS ta-admaker-v1.5.0.css.
   ── v1.3.0 · SS-Fork B · Creative S6 (7 Nov 2026, Start screen) ──
   Start rebuilt to the ruled sequence: who → how to start → what the
   drafts will use. One customer line, large, with Change customer and
   a job pill; the plan note to the right. Start from is four equal
   full-width tiles with plain names; the versions list lives inside
   the "ad already on file" tile. Logo, colours and fonts drop to a
   compact strip. Gold is reserved for changed-and-unsaved; the chosen
   queue card, tile and version use the blue stage border.
   Companion CSS ta-admaker-v1.5.0.css.
   v1.3.2: piece overlays transparent (the page paints divs white);
   the stage has a fixed minimum height so the picture never leaves it.
   v1.3.1: selected-state rules (queue card, start tile, version row,
   shortlist card) carry the section.publisher-wrapper prefix so they
   outrank the base rules; tile copy forced to the body font. (v1.2.1's am-swb rename kept.)
   ── v1.2.0 · SS-Fork B · Creative S6 (7 Nov 2026, Fine-tune v2) ──
   Needs ix-ad-layouts v1.1.0 (recipe v2). Click a piece on the stage to
   select it; Type and colour group per piece: any Google font, weight,
   size, colour (ad and brand swatches, picker, hex), nudge 2px steps,
   show/hide, button fill. Layout group: background, logo plate. Saved
   screen: Approve & make current per version (G approveAd, then 114).
   No print ad pre-fills website and phone from the customer. Read step
   shows a length count per line. Companion CSS ta-admaker-v1.5.0.css.
   v1.3.2: piece overlays transparent (the page paints divs white);
   the stage has a fixed minimum height so the picture never leaves it.
   v1.3.1: selected-state rules (queue card, start tile, version row,
   shortlist card) carry the section.publisher-wrapper prefix so they
   outrank the base rules; tile copy forced to the body font.
   v1.2.1: the colour-swatch buttons were classed am-sw, which the Start
   screen already uses for its brand-colour row; renamed am-swb.
   ── v1.1.0 · SS-Fork B · Creative S6 (7 Nov 2026, Jeff's rulings) ──
   Fine-tune rebuilt to the settled three-zone frame: shortlist (what to
   work on) · stage (one ad at 100%, chosen by its shortlist card) ·
   controls (Wording · Picture · Sizes). Checks are a count row with the
   list under the stage. The shortlist gate takes either shape; Save
   writes only ticked shapes and never touches an unticked banner.
   Save-step lines name the shape and version, with one header count.
   Start screen labels versions "Made in Ad Maker" / "Picture only".
   Companion CSS is ta-admaker-v1.2.0.css.
   ── v1.0.2 · SS-Fork B · Creative S6 (6 Nov 2026, first live test) ──
   Three defects from the live Start screen: the colour swatch covered the
   placeholder (inline padding beat the stylesheet); "Transparent file" now
   tests the pixels (alpha), not that a file exists; the save bar is fixed
   to the bottom of the viewport, z-index 1000, per the new UX-031.
   Companion CSS is now ta-admaker-v1.0.1.css.
   ── v1.0.1 · SS-Fork B · Creative S5 (6 Nov 2026, Jeff's rulings) ──
   v1.0.0 was never deployed; v1.0.1 replaces it.
     1 · NO PAIRING. Each ticked banner and each ticked sidebar saves as
         its OWN ADS version row (add-type Banner Ad or Sidebar Ad), named
         <Customer> · <Month Year>, v2, v3 … across both shapes. Shapes are
         made together because a banner needs a sidebar, but they are
         stored apart; the publisher and the advertiser look at banners
         and sidebars as two lists, and approval makes one of each
         current. A later TITLES-ADMIN setting may say a title wants its
         banner and sidebar to travel as a pair; nothing here assumes it.
     2 · AD NEEDED READS OBLIGATIONS FIRST. ix-sales GET /obligations?
         publisher=&title= (Memberstack login, as client-manager reads
         /sales): every Open obligation marked noCreative (the customer
         has no ad of that shape and the send is inside the title's
         lead) is an Ad needed item, due month first. Held-for slot
         notes from the unreleased plans then ADD the slot to the item
         for that customer and shape, or make an item of their own when
         no obligation names it. A sidebar is still inferred from a
         placed banner whose customer has no current sidebar.
     3 · Scenario 104 v3.6 contract: assetType 'ad', addType (the ADS
         add-type option id for the shape, read live), bannerImageSrc /
         sidebarImageSrc (the Uploadcare URL) beside the MEDIA ids,
         reformatRecipe, bannerApproval / sidebarApproval, and the row
         echoed as fieldData.

   ── v1.0.0 · SS-Fork B · Creative S5 (6 Nov 2026) ──
   SCREENS (header steps: Customer · Read · Drafts · Fine-tune · Save)
     1 Start      Needs action (left): Sent back, Ad needed, Note only,
                  nearest send date first. Right side empty until an item
                  is clicked or New creative. Customer first; then logo,
                  brand colours (or Needs you with two boxes), fonts and
                  versions; then the four ways to start.
     2 Read       A dropped PDF page is shown whole and Jeff draws the box
                  round the ad (or takes the whole page). ix-adreformat
                  v1.3.0 reads it with the PDF text (IxPdfPager.text) when
                  there is one. The check step: seven wording lines (gold
                  border and own cancel link when edited), the logo choice
                  (customer's file or print cut; print cut asks this
                  version only / replace the customer's file; no file →
                  print cut flagged "Check it" with a tick to save it), the
                  photo (Use it / Leave it out, sharpness per shape), the
                  fonts (the customer's, or 6 pairs with a tick to save the
                  pick), and the colours.
     3 Drafts     IxAdLayouts.choose then paint. Banners and sidebars are
                  shortlisted SEPARATELY (gold tick). Checks every draft
                  shares show once above the grid; the left-out line too.
     4 Fine-tune  Shortlist on the left (banners above sidebars), the shape
                  being edited in the middle, controls on the right: drag
                  the photo and Zoom, headline choice, text fields, size
                  sliders 70% to 140%. Checks update live. Jeff ticks 1 to
                  3 of each shape to save.
     5 Save       One ADS row per ticked shape (v1.0.1). Each row: paint at 2× →
                  Uploadcare → MEDIA (Scenario B Route 4) → ADS row with the
                  recipe (Scenario 104) → then customer writes once
                  (Scenario 114). Every step shows as it runs. Every write
                  is checked against its echo (TOAST-TRUTH).
     Fix          Opens the sent-back ADS row from its recipe, shows only
                  the returned shape, Save = "Replace banner/sidebar":
                  Scenario G action updateAd replaces that shape's link,
                  the recipe, and resets only its approval to Pending.

   DATA
     Customers      .customers-wrapper[data-item] (the page's hidden list):
                    data-id, data-name, data-logo-link, data-logo-link-light,
                    data-brand-color-main, data-brand-color-accent,
                    data-brand-font-heading, data-brand-font-body,
                    data-business-website. A missing ATTRIBUTE (not a
                    missing value) is reported, never guessed round.
     Ad needed      Data Worker /plans?titleAdminId= then /plan-board?planId=
                    for every unreleased, unlocked plan: slot notes
                    "Held for <Customer>" (banner), and banner slots whose
                    customer has no current sidebar (customers[].noSidebar).
     Sent back      ix-asset-list /list?type=ad&full=reformat-recipe: rows
                    whose shape approval reads the "Sent back" choice.
     Versions       the same list, per customer, newest first.
   NEEDS  TA_CONFIG: taItemId, titleSlug, adReformatWorker,
          objectIsolatorWorker, assetListUrl, planBoard or planList,
          makeConditioner (B), makeCreateAssets (104), makeUpdateCustomer
          (114), makeStudio (G), uploadcarePublicKey, elementTypes.ads.
          salesUrl (ix-sales, Memberstack login on the page).
          Scenario 104 v3.6 (addType, reformatRecipe, the approvals, echo).

   HARDCODING (provisional ids; the doc-maintenance chat numbers them)
     HC-P-SSB-8   Ad needed shapes come from TA_CONFIG.elementTypes.ads
                  (id → label). Resolved here.
     HC-P-SSB4-4  FONT_PAIRS: the six pairs offered when a customer has no
                  brand fonts. One place.
     HC-P-SSB5-6  HELD_RX: Ad needed parses the slot-note words "Held for
                  <Customer> · no <shape> yet" that ipp-revenue v1.7.4 writes
                  (HC-P-RV74-2). Fix: a structured held-for field.
     HC-P-SSB5-7  APPROVAL_WORDS: the ADS approval choices read by name,
                  Pending / Sent back / Approved (TA_CONFIG.adApprovalWords
                  overrides). Same class as HC-P-CM124-2.
     HC-P-SSB5-8  Scenario 104 payload keys (adName, customerId, customerName,
                  bannerImageMediaId, sidebarImageMediaId, reformatRecipe,
                  bannerApproval, sidebarApproval, titleAdminId) and the
                  Scenario G action "updateAd" with ADS camel keys.
     HC-P-SSB5-9  W: every word on the surface, one place.
     HC-P-SSB5-10 SOURCE_MAX 1600: the longest side of the picture sent to
                  the read Worker; READ_JPEG 0.92.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var VERSION = '2.2.0';
  var FILE = 'ta-admaker-v' + VERSION + '.js';
  var MOUNT_ID = 'std-admaker-mount';
  var PANEL = '[data-std-panel-body="admaker"]';

  function CFG() { return window.TA_CONFIG || {}; }
  function log() { try { console.log.apply(console, ['[AdMaker v' + VERSION + ']'].concat([].slice.call(arguments))); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  // ── Platform constants ───────────────────────────────────────
  var FONT_PAIRS = [                                                   // HC-P-SSB4-4
    { id: 'playfair-dmsans', head: 'Playfair Display', headWeight: 700, body: 'DM Sans' },
    { id: 'fraunces-worksans', head: 'Fraunces', headWeight: 700, body: 'Work Sans' },
    { id: 'manrope', head: 'Manrope', headWeight: 800, body: 'Manrope' },
    { id: 'bebas-inter', head: 'Bebas Neue', headWeight: 400, body: 'Inter' },
    { id: 'dmserif-nunito', head: 'DM Serif Display', headWeight: 400, body: 'Nunito' },
    { id: 'poppins', head: 'Poppins', headWeight: 700, body: 'Poppins' }
  ];
  var HELD_RX = /^Held for\s+(.+?)\s*(?:\u00b7|-|\u2013|\u2014)\s*no\s+(banner|sidebar|splash|text ad)\s+yet/i;   // HC-P-SSB5-6
  var APPROVAL_WORDS = Object.assign({ pending: 'Pending', sentBack: 'Sent back', approved: 'Approved' }, CFG().adApprovalWords || {});   // HC-P-SSB5-7
  var SHAPE_SLUG = { banner: { link: 'banner-ad-link', approval: 'banner-approval' }, sidebar: { link: 'sidebar-ad-link', approval: 'sidebar-approval' },
                     splash: { link: 'splash-ad-link--get', approval: 'splash-approval' }, text: { link: 'short-text', approval: 'text-ad-approval' } };
  var SOURCE_MAX = 1600, READ_JPEG = 0.92;                             // HC-P-SSB5-10
  var SLOTS = [['headline', 'Headline'], ['headline2', 'Second headline'], ['supporting', 'Supporting line'], ['button', 'Button'], ['phone', 'Phone'], ['website', 'Website'], ['small_print', 'Small print']];
  var PIECES = [['logo', 'Logo'], ['headline', 'Headline'], ['supporting', 'Supporting line'], ['button', 'Button'], ['phone', 'Phone']];
  var MAX_SAVE = 3;
  // v1.2.0 · the pieces a layout can carry and their stage names
  var PIECE_WORDS = { logo: 'Logo', headline: 'Headline', headline2: 'Headline', supporting: 'Supporting line', button: 'Button', phone: 'Phone', website: 'Website', small_print: 'Small print' };
  // v1.2.0 · a starting list for the font box; any Google family can be typed (HC-P-SSB7-3)
  var FONT_LIST = ['Manrope', 'Inter', 'DM Sans', 'Work Sans', 'Montserrat', 'Poppins', 'Raleway', 'Nunito', 'Lato', 'Open Sans', 'Roboto', 'Source Sans 3', 'Oswald', 'Bebas Neue', 'Anton', 'Playfair Display', 'Fraunces', 'Lora', 'Merriweather', 'Libre Baskerville', 'EB Garamond', 'Cormorant Garamond', 'DM Serif Display', 'Abril Fatface', 'Pacifico', 'Caveat', 'Dancing Script'];
  var INK = '#1E2A3A', WHITE = '#FFFFFF';
  var STEP_NAMES = ['Start', 'Read', 'Make', 'Save'];                                   // HC-P-SSB7-5
  var STEP_SUBS = ['Who, which shape, from what', 'Check the wording off the ad', 'Proposals on the stage. Pick, edit, keep.', 'The kept set, pending approval'];
  var SCREEN_STEP = { start: 1, read: 2, drafts: 3, make: 3, tune: 3, save: 4, done: 4 };
  var CARD_W = { banner: 340, sidebar: 232 };   // card width on the Make grid; the stage is 100%
  var PROPOSAL_MAX = 8, AD_COLOURS_MAX = 3;                                               // HC-P-SSB7-8
  var SHAPE_TILES = [['banner', 'Banner', '700 \u00d7 235', false], ['sidebar', 'Sidebar', '480 \u00d7 400', false], ['splash', 'Splash', 'coming', true], ['text', 'Text ad', 'coming', true]];

  var W = {                                                            // HC-P-SSB5-9
    title: 'Ad Maker', tagline: 'one shape at a time, from what the customer already has', whichShape: 'Which shape', oneAtATime: 'one at a time; come back for the next', keep: 'Keep', kept: 'Kept \u2713', clone: 'Clone', variations: 'Variations', putBack: 'put it back', keptFor: 'Kept for Save', workingOn: 'Working on', upNext: 'Up next', willUse: 'The drafts will use', nothingToDecide: 'Nothing to decide.', needs: 'Needs action', sent: 'Sent back', needed: 'Ad needed', note: 'Note only',
    coming: 'Tool coming', empty: 'Pick an item on the left, or start a creative that isn\u2019t on the list.',
    newC: 'New creative', chooseCust: 'Choose a customer', custFirst: 'Choose the customer first.', howStart: 'Choose how to start.',
    startFrom: 'Start from', startFromSub: 'Pick one. Everything after this step is the same whichever you choose.', srcPrint: 'The print issue', srcPrintSub: 'The ad as it ran in the magazine, found for you when a print issue is taken in.', srcPrintHint: 'Arrives with Print Ads as Input. Nothing waiting for this customer.',
    srcDrop: 'A file you have', srcDropSub: 'A PDF page, a JPG of the ad, or an old banner. We read the wording and the logo off it.', srcDropHint: 'Best when the advertiser sent you something.', srcVersionHint: 'Best when the customer already has a banner and needs a sidebar.', srcNoneHint: 'Best for a new advertiser with nothing yet.',
    srcVersion: 'An ad already on file', srcNone: 'Scratch', srcNoneSub: 'No ad to work from. Type the wording; the drafts use the customer\u2019s logo and colours.',
    dropHere: 'Drop a PDF page, an ad image or an old banner here', orClick: 'or click to choose.',
    needsYou: 'Needs you', noColours: 'No brand colours on the customer. Type them, or leave them empty and a neutral colour is used.',
    readAd: 'Read the ad', showDrafts: 'Show drafts', confirm: 'Confirm and show drafts', tuneBtn: 'Fine-tune the shortlist',
    saveBtn: 'Save', back: 'Back', cancel: 'Cancel', keepThese: 'Keep these', looksRight: 'Looks right', whatSaveWrites: 'What Save writes', seeAd: 'See the ad', pickAd: 'Draw a box round the ad', wholePage: 'Use the whole page',
    reading: 'Reading the ad', readingSub: 'The ix-adreformat Worker is reading the words, pictures and colours.',
    wording: 'Wording', wordingSub: 'check and fix before the drafts', edited: 'Edited by you',
    logo: 'Logo', custFile: 'Customer\u2019s file', fromAd: 'From this ad', cutFromPrint: 'Cut from print', versionOnly: 'This version only',
    replaceFile: 'Replace the customer\u2019s file', checkIt: 'Check it', noFile: 'No file on the customer.', keepLogo: 'Save it to the customer once checked',
    photo: 'Photo', useIt: 'Use it', leaveOut: 'Leave it out', noPhoto: 'No photo was found in the ad.',
    fonts: 'Fonts', custFonts: 'From the customer', pickPair: 'The customer has no brand fonts. Pick a pair.', keepFonts: 'Save this pair to the customer',
    colours: 'Brand colours', neutral: 'Missing, neutral used', fromCust: 'From the customer', setByYou: 'Set by you, saved to the customer on Save',
    drafts: 'Drafts', draftsSub: 'Click banners and sidebars to shortlist them.', shortlist: 'Shortlist', banners: 'Banners', sidebars: 'Sidebars',
    atLeastOne: 'Pick at least one banner or sidebar.', saves: 'Saves', editing: 'Editing', crop: 'Crop', dragPhoto: 'drag the photo', zoom: 'Zoom',
    resetCrop: 'Reset crop', separate: 'Separate the subject \u00b7 Coming', headline: 'Headline', sizes: 'Sizes', thisOnly: 'this shape only',
    checks: 'Checks', toSave: 'Save this one', saved: 'Saved', saving: 'Saving', keepOpen: 'Saving. Keep this tab open.',
    savedMsg: 'Saved. The publisher can now review the shapes.', again: 'Back to Needs action', pending: 'Pending',
    fixing: 'Fixing a sent-back shape', whatSave: 'What Save does', forRef: 'For reference: the',
    noteOnly: 'From a slot note', addInClients: 'Add the customer in CLIENTS', notInList: 'Not in the list?',
    sentNoNote: 'No note came with the send-back.', toolComing: 'are made in a tool that is coming soon. This item stays on the list until then, so nothing booked is missed.'
  };

  // ── State ────────────────────────────────────────────────────
  var S = {};
  function reset() {
    S = { screen: 'start', loading: { needs: true, ads: true }, needs: [], ads: null, adOpts: null, sel: null, custId: '', custPre: '',
          col: { main: '', accent: '' }, shape: '', src: '', drop: null, page: 1, box: null, boxing: false, drawing: null,
          reading: false, read: null, srcCanvas: null, srcImg: null, words: {}, base: {}, from: {},
          logoUse: 'file', logoScope: 'version', logoKeep: false, logoNewUrl: '', logoNewImg: null, logoSwap: false, logoSwapKeep: false, printLogo: null, photo: null, usePhoto: true,
          fontPair: '', fontKeep: false, drafts: null, short: { banner: [], sidebar: [] }, ed: null, savePick: { banner: [], sidebar: [] },
          saving: null, fix: null, err: '' };
  }
  reset();

  // ── Customers from the page ──────────────────────────────────
  var CUST = [], CUST_ATTRS = { missing: [] };
  function readCustomers() {
    var want = ['logo-link', 'logo-link-light', 'brand-color-main', 'brand-color-accent', 'brand-font-heading', 'brand-font-body'];
    var els = document.querySelectorAll('.customers-wrapper[data-item]'), seen = {}, out = [];
    var first = els[0], miss = [];
    if (first) want.forEach(function (a) { if (!first.hasAttribute('data-' + a)) miss.push('data-' + a); });
    CUST_ATTRS.missing = miss;
    for (var i = 0; i < els.length; i++) {
      var el = els[i], d = el.dataset, id = (d.id || '').trim();
      if (!id || seen[id]) continue; seen[id] = 1;
      var g = function (a) { return String(el.getAttribute('data-' + a) || '').trim(); };
      out.push({ id: id, name: (d.name || '').trim() || id, logo: g('logo-link'), logoLight: g('logo-link-light'),
                 main: hex(g('brand-color-main')), accent: hex(g('brand-color-accent')),
                 fontHead: g('brand-font-heading'), fontBody: g('brand-font-body'),
                 website: g('business-website') || g('contact-website'), phone: g('business-phone') || g('contact-phone'), publisherId: (d.publisherId || '').trim() });
    }
    out.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
    CUST = out;
  }
  function hex(v) { var m = String(v || '').trim().match(/^#?([0-9a-f]{6})$/i); return m ? '#' + m[1].toUpperCase() : ''; }
  function cust() { for (var i = 0; i < CUST.length; i++) if (CUST[i].id === S.custId) return CUST[i]; return null; }
  function custById(id) { for (var i = 0; i < CUST.length; i++) if (CUST[i].id === id) return CUST[i]; return null; }
  function custByName(n) { n = String(n || '').trim().toLowerCase(); for (var i = 0; i < CUST.length; i++) if (CUST[i].name.toLowerCase() === n) return CUST[i]; return null; }
  function fontOf(v) { var m = String(v || '').trim().match(/^(.+?)\s+([1-9]00)$/); return m ? { family: m[1], weight: +m[2] } : (v ? { family: String(v).trim(), weight: 0 } : null); }

  // ── Worker base (same rule as client-manager: planBoard, else planList) ──
  function workerBase() { var c = CFG(); return String(c.planBoard || c.planList || '').replace(/\/(plan-board|plans)(\?.*)?$/, '').replace(/\/$/, ''); }
  function fetchJson(url, opts) {
    return fetch(url, opts).then(function (r) { return r.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {} return { ok: r.ok, status: r.status, j: j, t: t }; }); });
  }

  // ── Memberstack login token, as client-manager reads it (ix-sales needs it) ──
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
  // ── Ad needed, part 1 (v1.0.1): open obligations with no creative, from ix-sales ──
  var OB_SHAPE = { banner: 'banner', sidebar: 'sidebar', splash: 'splash', 'sponsor band': 'banner', 'list block': 'text' };   // ix-sales slot-shape labels → shapes (its SHAPE_AD_TYPE)
  function loadObligations() {
    var u = String(CFG().salesUrl || '').replace(/\/+$/, ''), ta = CFG().taItemId, pub = CUST.length ? CUST[0].publisherId : '';
    if (!u) { S.obErr = 'TA_CONFIG.salesUrl is not set, so open obligations cannot be read.'; return Promise.resolve([]); }
    if (!pub) { S.obErr = 'The page names no publisher (data-publisher-id on .customers-wrapper), so obligations cannot be read.'; return Promise.resolve([]); }
    return memberToken().then(function (tok) {
      if (!tok) throw new Error('No Memberstack login on this page, so ix-sales cannot be asked for obligations.');
      return fetchJson(u + '/obligations?publisher=' + encodeURIComponent(pub) + '&title=' + encodeURIComponent(ta) + '&status=Open', { headers: { Authorization: 'Bearer ' + tok }, cache: 'no-store' });
    }).then(function (r) {
      if (!r.ok || !r.j || r.j.ok !== true) throw new Error((r.j && r.j.error) || ('ix-sales answered HTTP ' + r.status));
      S.obErr = '';
      return (r.j.obligations || []).filter(function (o) { return o.noCreative; }).map(function (o) {
        var shape = OB_SHAPE[String(o.shape || '').toLowerCase()] || 'banner', c = custById(o.customerId) || custByName(o.customer);
        return { kind: 'needed', id: 'ob-' + o.id, obId: o.id, title: o.customer || (c ? c.name : o.customerId), custId: c ? c.id : (o.customerId || ''), shape: shape, what: shapeLabel(shape),
                 m: 'Sold \u00b7 due ' + (o.dueMonth || '') + (o.nudge ? ' \u00b7 ' + o.nudge : ''), when: (o.dueMonth || '') + '-01', q: o.name || '', coming: !(shape === 'banner' || shape === 'sidebar') };
      });
    }).catch(function (e) { S.obErr = (e && e.message) || 'Obligations could not be read.'; return []; });
  }
  // ── Ad needed, part 2: every unreleased plan's Held-for notes and missing sidebars ──
  function loadNeeds() {
    var base = workerBase(), ta = CFG().taItemId;
    S.loading.needs = true; S.needs = [];
    if (!base || !ta) { S.loading.needs = 'TA_CONFIG has neither planBoard nor planList, or no taItemId, so Ad needed cannot be read.'; return Promise.resolve(); }
    var obP = loadObligations();
    return fetchJson(base + '/plans?titleAdminId=' + encodeURIComponent(ta))
      .then(function (r) {
        if (!r.ok || !r.j || r.j.ok !== true) throw new Error((r.j && r.j.error) || ('/plans answered HTTP ' + r.status));
        var plans = (r.j.plans || []).filter(function (p) { return !p.locked && !(p.publish && p.publish.released); });
        plans.sort(function (a, b) { return String(a.date || '').localeCompare(String(b.date || '')); });
        return Promise.all(plans.map(function (p) {
          return fetchJson(base + '/plan-board?planId=' + encodeURIComponent(p.id)).then(function (b) {
            if (!b.ok || !b.j || b.j.ok !== true) return { plan: p, err: (b.j && b.j.error) || ('HTTP ' + b.status) };
            return { plan: p, board: b.j };
          });
        }));
      })
      .then(function (boards) {
        var items = [], ids = {};
        boards.forEach(function (x) {
          var p = x.plan, bd = x.board; if (!bd) { items.push({ kind: 'needed', id: 'err-' + p.id, title: p.name, what: 'Could not read', m: x.err, err: true }); return; }
          var custs = {}; (bd.customers || []).forEach(function (c) { custs[c.name.toLowerCase()] = c; });
          var when = fmtDate(p.sendAt || p.date), slots = bd.slots || [];
          slots.forEach(function (sl) {
            var m = sl.note && HELD_RX.exec(sl.note);
            if (m) {
              var c = custByName(m[1]), shape = m[2].toLowerCase() === 'text ad' ? 'text' : m[2].toLowerCase();
              items.push({ kind: 'needed', id: 'held-' + sl.id, title: m[1], custId: c ? c.id : '', shape: shape, what: shapeLabel(shape),
                           m: p.name + ' \u00b7 ' + when, when: p.sendAt || p.date, q: 'Held on slot ' + sl.position, coming: !(shape === 'banner' || shape === 'sidebar') });
              return;
            }
            if (sl.asset && sl.asset.kind === 'ad' && sl.asset.customer) {
              var cc = custs[String(sl.asset.customer).toLowerCase()];
              if (cc && cc.noSidebar && !ids['sb-' + cc.id]) {
                ids['sb-' + cc.id] = 1;
                var cp = custByName(cc.name);
                items.push({ kind: 'needed', id: 'sb-' + cc.id + '-' + p.id, title: cc.name, custId: cp ? cp.id : '', shape: 'sidebar', what: 'Sidebar',
                             m: p.name + ' \u00b7 ' + when, when: p.sendAt || p.date, q: 'Banner placed at ' + sl.position + ', no sidebar yet', coming: false });
              }
            }
            if (sl.note && !m && /^(?!Held for)/i.test(sl.note) && (sl.assetType === 'ad' || /banner|sidebar/i.test(sl.note))) {
              items.push({ kind: 'note', id: 'note-' + sl.id, title: 'Slot ' + sl.position, custId: '', shape: 'banner', what: 'Note', m: p.name + ' \u00b7 ' + when, when: p.sendAt || p.date, q: sl.note, coming: false });
            }
          });
        });
        return obP.then(function (obs) {
          // obligations first; a Held-for or missing-sidebar item for the same customer and shape joins its obligation
          var merged = obs.slice();
          items.forEach(function (it) {
            var ob = it.kind === 'needed' && merged.filter(function (o) { return o.obId && o.custId && o.custId === it.custId && o.shape === it.shape; })[0];
            if (ob) { ob.q = (ob.q ? ob.q + ' \u00b7 ' : '') + it.q; ob.m = ob.m + ' \u00b7 ' + it.m; if (!ob.when || it.when < ob.when) ob.when = it.when; }
            else merged.push(it);
          });
          S.needs = merged;
          S.loading.needs = false;
        });
      })
      .catch(function (e) { S.loading.needs = (e && e.message) || 'Ad needed could not be read.'; });
  }
  function shapeLabel(shape) {                                          // HC-P-SSB-8 resolved: labels from TA_CONFIG.elementTypes.ads
    var ads = CFG().elementTypes && CFG().elementTypes.ads, id = { banner: 'banner-ad', sidebar: 'sidebar-ad', splash: 'splash-ad', text: 'text-ad' }[shape] || shape;
    var row = null;
    if (Array.isArray(ads)) ads.forEach(function (r) { if (r && r.id === id) row = r; });
    else if (ads && ads[id]) row = ads[id];
    var l = row ? String(row.l || row.label || '') : '';
    return (l ? l.replace(/\s*\(.*\)\s*$/, '').replace(/\s+Ad$/i, '') : shape[0].toUpperCase() + shape.slice(1));
  }
  function fmtDate(v) {
    if (!v) return '';
    var d = new Date(v); if (isNaN(d)) return String(v).slice(0, 10);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: CFG().titleTimezone || 'America/New_York' });
  }

  // ── ADS rows: sent back + versions ───────────────────────────
  function loadAds() {
    var u = CFG().assetListUrl, ta = CFG().taItemId;
    S.loading.ads = true;
    if (!u || !ta) { S.loading.ads = 'TA_CONFIG.assetListUrl or taItemId is missing, so Sent back and the versions cannot be read.'; return Promise.resolve(); }
    return fetchJson(String(u).replace(/\/$/, '') + '/list?type=ad&title=' + encodeURIComponent(ta) + '&full=reformat-recipe&fresh=1')
      .then(function (r) {
        if (!r.ok || !r.j || r.j.error) throw new Error((r.j && r.j.error) || ('ix-asset-list answered HTTP ' + r.status));
        S.ads = (r.j.items || []).filter(function (it) { return !it.isArchived && !it.isDraft; });
        S.adOpts = r.j.options || {};
        S.adTruncated = !!r.j.truncated;
        S.loading.ads = false;
      })
      .catch(function (e) { S.loading.ads = (e && e.message) || 'The ADS list could not be read.'; });
  }
  function optName(slug, id) { var m = S.adOpts && S.adOpts[slug]; return m && id ? (m[id] || '') : ''; }
  function optId(slug, name) {
    var m = S.adOpts && S.adOpts[slug]; if (!m) return '';
    var keys = Object.keys(m); for (var i = 0; i < keys.length; i++) if (String(m[keys[i]]).toLowerCase() === String(name).toLowerCase()) return keys[i];
    return '';
  }
  function adCustomerId(fd) { var v = fd['associated-advertiser']; if (Array.isArray(v)) v = v[0]; return v && typeof v === 'object' ? v.id : (v || ''); }
  function sentBackItems() {
    if (!S.ads) return [];
    var out = [];
    S.ads.forEach(function (it) {
      var fd = it.fieldData || {};
      ['banner', 'sidebar'].forEach(function (sh) {
        var ap = optName(SHAPE_SLUG[sh].approval, fd[SHAPE_SLUG[sh].approval]);
        if (ap && ap.toLowerCase() === APPROVAL_WORDS.sentBack.toLowerCase()) {
          var cid = adCustomerId(fd), c = custById(cid);
          out.push({ kind: 'sent', id: 'sent-' + it.id + '-' + sh, adId: it.id, title: c ? c.name : (fd.name || it.id), custId: cid, shape: sh, what: shapeLabel(sh),
                     q: String(fd['send-back-note'] || fd['feedback'] || '').trim() || W.sentNoNote, m: fd.name || '', when: it.lastUpdated || '',
                     picture: fd[SHAPE_SLUG[sh].link] || '', recipe: fd['reformat-recipe'] || '', row: it, coming: false });
        }
      });
    });
    out.sort(function (a, b) { return String(b.when).localeCompare(String(a.when)); });
    return out;
  }
  function versionsOf(custId) {
    if (!S.ads || !custId) return [];
    return S.ads.filter(function (it) { return adCustomerId(it.fieldData || {}) === custId && !(it.fieldData || {})['house-kind']; })
      .sort(function (a, b) { return String(b.createdOn || '').localeCompare(String(a.createdOn || '')); })
      .map(function (it) { var fd = it.fieldData || {}; return { id: it.id, name: fd.name || it.id, banner: fd['banner-ad-link'] || '', sidebar: fd['sidebar-ad-link'] || '', recipe: fd['reformat-recipe'] || '',
        bannerApproval: optName('banner-approval', fd['banner-approval']), sidebarApproval: optName('sidebar-approval', fd['sidebar-approval']), createdOn: it.createdOn || '' }; });
  }
  // "<Customer> · <Month Year>", then v2, v3 — counted against the rows that exist.
  function versionName(c, n) {
    var month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    var baseName = c.name + ' \u00b7 ' + month, have = versionsOf(c.id).map(function (v) { return v.name; });
    var k = 1; var name = baseName;
    for (var i = 0; i < n; i++) { while (have.indexOf(name) > -1) { k++; name = baseName + ' v' + k; } have.push(name); if (i < n - 1) { k++; name = baseName + ' v' + k; } }
    return name;
  }
  function needsAll() {
    var sent = sentBackItems(), needed = S.needs.filter(function (x) { return x.kind === 'needed'; }), notes = S.needs.filter(function (x) { return x.kind === 'note'; });
    var byWhen = function (a, b) { return String(a.when || '').localeCompare(String(b.when || '')); };
    needed.sort(byWhen); notes.sort(byWhen);
    return { sent: sent, needed: needed, note: notes, all: sent.concat(needed, notes) };
  }
  function item() { var all = needsAll().all; for (var i = 0; i < all.length; i++) if (all[i].id === S.sel) return all[i]; return null; }

  // ══════════════════════════════════════════════════════════════
  //  Shell: header (title flush left, ⓘ, steps), body, save bar
  // ══════════════════════════════════════════════════════════════
  function badge() {
    if (!(window.IxInfo && IxInfo.badge)) return '';
    return IxInfo.badge({ file: FILE, version: VERSION, title: W.title,
      blurb: 'Lists every ad job waiting (sent back, ad needed, note only) and makes a banner and sidebar Set from a print ad, a dropped file, an earlier version or nothing. Drafts are painted by ix-ad-layouts from the ten platform layouts; each saved option is its own ADS version row, Pending, with its recipe.',
      scenarios: [
        { name: 'Worker \u2014 ix-adreformat', note: 'TA_CONFIG.adReformatWorker: reads the ad (parts, plan, subject boxes)' },
        { name: 'Worker \u2014 ix-object-isolator', note: 'TA_CONFIG.objectIsolatorWorker: cuts a print logo onto transparency' },
        { name: 'Worker \u2014 ix-issue-data', note: '/plans and /plan-board: Ad needed' },
        { name: 'Worker \u2014 ix-asset-list', note: '/list?type=ad: sent back, versions, recipes' },
        { name: 'Scenario B \u2014 Route 4', note: 'TA_CONFIG.makeConditioner: MEDIA rows for the painted shapes' },
        { name: 'Scenario 104', note: 'TA_CONFIG.makeCreateAssets: the ADS version row with its recipe' },
        { name: 'Scenario 114', note: 'TA_CONFIG.makeUpdateCustomer: colours, fonts, a replaced logo' },
        { name: 'Scenario G \u2014 updateAd', note: 'TA_CONFIG.makeStudio: the send-back fix' }
      ],
      companions: 'ta-admaker-v' + VERSION + '.css \u00b7 ix-ad-layouts v' + (window.IxAdLayouts ? IxAdLayouts.VERSION : '?') + ' \u00b7 ix-pdf-pager v1.1.0 \u00b7 ix-info \u00b7 ix-buttons' });
  }
  // v2.0.0: the five steps are the spine - a row of boxes, one line each; a reached step is a button back to it.
  function stepsHTML() {
    if (S.screen === 'fix' || S.screen === 'fixdone') return '<div class="am-steps"><div class="am-step now wide"><em>!</em><div><b>' + W.fixing + '</b><span>Replaces the returned shape only</span></div></div></div>';
    var k = SCREEN_STEP[S.screen] || 1, saved = S.screen === 'save' && S.saving && (S.saving.done || S.saving.err);
    return '<div class="am-steps">' + STEP_NAMES.map(function (n, i) {
      var num = i + 1, st = num < k ? 'done' : num === k ? 'now' : '', can = num < k && !S.saving;
      var isLast = num === STEP_NAMES.length;
      return '<' + (can ? 'button type="button" data-step="' + num + '"' : 'div') + ' class="am-step ' + st + '"><em>' + (num < k || (isLast && saved) ? '\u2713' : num) + '</em><div><b>' + n + '</b><span>' + STEP_SUBS[i] + '</span></div></' + (can ? 'button' : 'div') + '>';
    }).join('') + '</div>';
  }
  // v2.0.0: one frame. shell(centre, bar, opts) - opts.left / opts.right override the standing columns (null = none).
  function shell(body, bar, opts) {
    opts = opts || {};
    var m = document.getElementById(MOUNT_ID); if (!m) return;
    var left = 'left' in opts ? opts.left : jobCol(), right = 'right' in opts ? opts.right : (cust() ? useCol() : '');
    m.innerHTML = '<div class="am"><div class="am-head"><div class="am-headrow"><h2>' + W.title + '</h2><span class="am-tag">' + W.tagline + '</span>' + badge() + '</div>' + stepsHTML() + '</div>' +
      '<div class="am-body">' + (left === null ? '' : col('am-left', '', left)) + col('am-main', '', body) + (right === null || right === '' ? '' : col('am-right', '', right)) + '</div><div class="am-savebar">' + bar + '</div></div>';
    placeBar();
    afterRender.forEach(function (f) { try { f(); } catch (e) { log('afterRender', e); } }); afterRender = [];
  }
  var afterRender = [];
  function later(f) { afterRender.push(f); }
  function barHTML(msg, acts) { return '<div class="am-msg">' + msg + '</div><div class="am-grow"></div>' + acts; }
  // v1.0.2 (UX-031): the save bar is fixed to the bottom of the viewport, the width of the pane it serves, above everything else.
  function placeBar() {
    var m = document.getElementById(MOUNT_ID), am = m && m.querySelector('.am'), bar = m && m.querySelector('.am-savebar');
    if (!am || !bar) return;
    var r = am.getBoundingClientRect();
    // v1.5.1: size the panel to the viewport so its scrolling columns end above the fixed bar, whatever the page header costs
    var hh = Math.max(560, Math.round(window.innerHeight - r.top - 16));
    if (Math.abs(hh - r.height) > 2) { am.style.height = hh + 'px'; r = am.getBoundingClientRect(); }
    bar.style.left = Math.round(r.left) + 'px'; bar.style.width = Math.round(r.width) + 'px';
  }
  window.addEventListener('resize', placeBar);
  function btn(act, label, kind, disabled, extra) {
    return '<button type="button" class="ix-btn ix-btn--' + (kind || 'primary') + '" data-act="' + act + '"' + (disabled ? ' disabled' : '') + (extra || '') +
      ' style="height:34px !important;padding:0 16px !important;font-size:13px !important">' + label + '</button>';
  }
  function ghost(act, label, data) { return '<button type="button" class="am-ghost" data-act="' + act + '"' + (data || '') + '>' + label + '</button>'; }
  function revert(act, data) { return '<button type="button" class="am-revert" data-act="' + act + '"' + (data || '') + '>cancel</button>'; }
  var FLAG_BG = { ok: '#E6F2EC', warn: '#FBF3DF', bad: '#FBEAE7' };
  function flag(level, text) { return '<span class="am-flag ' + level + '" style="background:' + (FLAG_BG[level] || FLAG_BG.warn) + ' !important">' + esc(text) + '</span>'; }
  function col(cls, style, inner) { return '<div class="am-col ' + (cls || '') + '" style="' + (style || '') + '">' + inner + '</div>'; }
  function colh(t, sub) { return '<div class="am-colh">' + esc(t) + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>'; }
  function inp(attrs, value, dirty, pad) {
    // v1.0.2: pad lets the colour boxes clear their swatch (the inline !important here beat the stylesheet's padding-left).
    return '<input class="am-inp' + (dirty ? ' am-dirty' : '') + '" type="text" ' + attrs + ' value="' + esc(value) + '"' +
      ' style="height:30px !important;padding:' + (pad || '0 10px') + ' !important;font-size:12.5px !important;width:100% !important;box-sizing:border-box !important;margin:0 !important">';
  }
  function swatch(v) { return '<i class="dot' + (v ? '' : ' empty') + '" style="background:' + (v || 'transparent') + ' !important"></i>'; }
  var COL_PAD = '0 10px 0 34px';

  // ══════════════════════════════════════════════════════════════
  //  1 · Start
  // ══════════════════════════════════════════════════════════════
  function queueHTML(N, skipId) {
    var h = '';
    [['sent', W.sent, N.sent], ['needed', W.needed, N.needed], ['note', W.note, N.note]].forEach(function (g) {
      var rows = g[2].filter(function (x) { return x.id !== skipId; }); if (!rows.length) return;
      h += '<div class="am-nag"><div class="am-nagh ' + g[0] + '">' + g[1] + '<span class="n">' + rows.length + '</span></div>';
      rows.forEach(function (x) { h += naHTML(x, false); });
      h += '</div>';
    });
    return h;
  }
  function naHTML(x, on) {
    return '<button type="button" class="am-na ' + x.kind + (on ? ' on' : '') + (x.err ? ' err' : '') + '" data-na="' + esc(x.id) + '">' +
      (x.picture ? '<div class="th"><img src="' + esc(x.picture) + '" alt=""></div>' : '') +
      '<div class="am-nab"><h4>' + esc(x.title) + '</h4><div class="w">' + esc(x.what) + (x.coming ? '<span class="am-coming">' + W.coming + '</span>' : '') + '</div>' +
      (x.q ? '<div class="q" title="' + esc(x.q) + '">' + esc(x.q) + '</div>' : '') + '<div class="m">' + esc(x.m) + '</div></div></button>';
  }
  // LEFT - the job, on every step. Nothing picked yet -> the whole queue under Needs action.
  function jobCol() {
    var N = needsAll(), it = item(), c = cust(), h = '';
    if (typeof S.loading.needs === 'string') h += '<div class="am-err">' + esc(S.loading.needs) + '</div>';
    if (typeof S.loading.ads === 'string') h += '<div class="am-err">' + esc(S.loading.ads) + '</div>';
    if (S.obErr) h += '<div class="am-err">' + esc(S.obErr) + '</div>';
    if (CUST_ATTRS.missing.length) h += '<div class="am-err">The page\u2019s .customers-wrapper has no ' + esc(CUST_ATTRS.missing.join(', ')) + '. Add the attribute' + (CUST_ATTRS.missing.length > 1 ? 's' : '') + ' on the TITLES-ADMIN Template.</div>';
    if (!S.sel) {
      return colh(W.needs, (S.loading.needs === true || S.loading.ads === true) ? 'loading\u2026' : N.all.length + ' items') + h + queueHTML(N, null) +
        '<div style="margin-top:10px">' + ghost('newC', '+ ' + W.newC) + '</div>';
    }
    var srcWord = { print: W.srcPrint, drop: W.srcDrop, version: W.srcVersion, none: W.srcNone }[S.src] || '';
    var fv = S.src === 'version' && S.fromVersion ? versionsOf(S.custId).filter(function (v) { return v.id === S.fromVersion; })[0] : null;
    var card = '<div class="am-job"><h4>' + esc(c ? c.name : (it && it.title) || W.chooseCust) + '</h4>' +
      '<span class="am-jobpill">' + esc(jobWord(it)) + '</span>' +
      (it && it.kind !== 'note' && it.m ? '<div class="m">' + esc(it.m) + '</div>' : '') + (it && it.q ? '<div class="m">' + esc(it.q) + '</div>' : '') +
      (S.screen !== 'start' && srcWord ? '<div class="m">Starting from ' + esc(srcWord.toLowerCase()) + (fv ? ' \u00b7 ' + esc(fv.name) : '') + '</div>' : '') +
      '</div>';
    var keptH = '';
    if (S.ed && (S.screen === 'make' || S.screen === 'save') && S.ed.B.concat(S.ed.S).some(function (x) { return x.label != null; })) {
      var ks = keptItems();
      keptH = colh(W.keptFor, ks.length ? ks.length + ' so far' : '') + (ks.length ? ks.map(function (k) { return '<div class="am-keptrow"><div class="pic" data-keptcv="' + k.id + '"></div><div class="tx"><b>' + esc(k.label) + '</b></div>' + (S.screen === 'make' ? '<button type="button" class="am-revert" data-act="unkeep" data-id="' + k.id + '">drop</button>' : '') + '</div>'; }).join('') : '<div class="am-note" style="margin-bottom:10px">Nothing yet. Keep a proposal as it is, or edit one and keep that.</div>');
      later(function () { document.querySelectorAll('#' + MOUNT_ID + ' [data-keptcv]').forEach(function (el) { var k = itemById(+el.getAttribute('data-keptcv')); if (k && k.paint) { el.innerHTML = ''; el.appendChild(canvasView(k.paint.canvas, 60)); } }); });
    }
    var rest = N.all.filter(function (x) { return x.id !== S.sel; }).length;
    return colh(W.workingOn) + h + card + keptH + (rest ? colh(W.upNext, rest + ' more \u00b7 nearest send first') + queueHTML(N, S.sel) : '') +
      (S.screen === 'start' ? '<div style="margin-top:10px">' + ghost('newC', '+ ' + W.newC) + '</div>' : '');
  }
  // RIGHT - The drafts will use. Quiet when the record has it; one thing to do when it does not. Never a worse source beside a better one.
  function useCol() {
    var c = cust(); if (!c) return '';
    var editing = S.screen !== 'start';
    var h = colh(W.willUse);
    var lg = '<div class="am-urow"><div class="k">' + W.logo;
    if (c.logo || S.logoNewUrl) {
      var dark = S.logoSwap ? '' : (c.logo || S.logoNewUrl), light = S.logoSwap ? c.logo : c.logoLight, td = logoTone(dark);
      var knownLight = td && td !== 'checking' && td.ok && td.transparent && td.light;
      lg += '<span>\u00b7 ' + (S.logoNewUrl && !c.logo ? 'your file, saved to the customer on Save' : 'from the customer') + '</span></div>' +
        '<div class="am-chips"><div class="am-chip ' + darkPlate(dark) + '">' + (dark ? '<img src="' + esc(dark) + '" alt="">' : '<span>Light panels: the business name is drawn</span>') + '</div>' +
        '<div class="am-chip ondark">' + (light ? '<img src="' + esc(light) + '" alt="">' : '<span>No light logo \u00b7 a white plate is used</span>') + '</div></div>';
      if (S.logoSwap) lg += '<div class="am-urnote">Dark-slot file moved to dark panels for this ad. ' + revert('logoSwapOff') + ' <label class="am-tick small"><input type="checkbox" id="am-logoswapkeep"' + (S.logoSwapKeep ? ' checked' : '') + '> Save the swap to the customer</label></div>';
      else if (knownLight && !light) lg += '<div class="am-urnote">' + flag('warn', 'This file is light') + ' It will vanish on light panels. <button type="button" class="am-revert am-link" data-act="logoSwapOn">Use it on dark panels instead</button></div>';
      else if (td === 'checking') lg += '<div class="am-urnote">Checking the file\u2026</div>';
      else lg += '<div class="am-urnote">Light panels \u00b7 dark panels. ' + W.nothingToDecide + '</div>';
      if (S.logoUse === 'print') lg += '<div class="am-urnote">' + flag('warn', 'Using the cut from the print ad') + ' this version only. ' + revert('logoCancel') + '</div>';
    } else {
      lg += '<span class="am-flag warn" style="background:#FBF3DF !important">None on the customer</span></div>' +
        '<div class="am-ask"><div>Fetch one and save it to the customer. Paste a link to the file.</div>' +
        inp('data-logonew="1" placeholder="Logo file link (Uploadcare or any image URL)"', S.logoNewUrl, false) +
        (S.printLogo && S.logoUse !== 'print' ? '<div class="am-urnote">No file to be had? <button type="button" class="am-revert am-link" data-act="logoPrint">Use the cut from the print ad</button> for this version only.</div>' : '') +
        (S.logoUse === 'print' ? '<div class="am-urnote">' + flag('warn', 'Using the cut from the print ad') + ' this version only. ' + revert('logoCancel') + '</div>' : '') + '</div>';
    }
    h += lg + '</div>';
    if (editing) {
      var ph = '<div class="am-urow"><div class="k">' + W.photo + '<span>\u00b7 cut from the ad</span></div>';
      if (S.photo) {
        var sh = ['banner', 'sidebar'].map(function (shape) { return sharpFor(shape); });
        var allSharp = sh.every(function (r) { return r[0] === 'ok'; });
        ph += '<div class="am-phrow"><div class="am-phth" id="am-photo-th"></div><div style="flex:1;min-width:0"><div class="am-flags">' + (allSharp ? flag('ok', 'Sharp for both shapes') : sh.map(function (r, i) { return flag(r[0], shapeLabel(i ? 'sidebar' : 'banner') + ': ' + r[1]); }).join(' ')) + '</div>' +
          '<div class="am-seg"><button type="button" class="' + (S.usePhoto ? 'on' : '') + '" data-photo="1">' + W.useIt + '</button><button type="button" class="' + (!S.usePhoto ? 'on' : '') + '" data-photo="0">' + W.leaveOut + '</button></div></div></div>';
        later(function () { var pht = document.getElementById('am-photo-th'); if (pht && S.photo) { pht.innerHTML = ''; pht.appendChild(thumbOf(S.photo.img, 64)); } });
      } else ph += '<div class="am-urnote">' + W.noPhoto + ' Logo-led and brand-block layouts only.</div>';
      h += ph + '</div>';
    }
    var fh = fontOf(c.fontHead), fb = fontOf(c.fontBody), ft = '<div class="am-urow"><div class="k">' + W.fonts;
    if (fh && fb) ft += '<span>\u00b7 from the customer</span></div><div class="am-urnote" style="color:var(--am-ink)">' + esc(fh.family + ' ' + fh.weight + ' / ' + fb.family + ' ' + fb.weight) + '. ' + W.nothingToDecide + '</div>';
    else if (!editing) ft += '<span class="am-flag warn" style="background:#FBF3DF !important">None on the customer</span></div><div class="am-urnote">Pick a pair on the Read step.</div>';
    else ft += '<span class="am-flag warn" style="background:#FBF3DF !important">None on the customer</span></div><div class="am-pairs">' + FONT_PAIRS.map(function (p) {
      return '<button type="button" class="am-pair' + (S.fontPair === p.id ? ' on' : '') + '" data-pair="' + p.id + '"><span style="font-family:\'' + p.head + '\';font-weight:' + p.headWeight + '">Aa Headline</span><small style="font-family:\'' + p.body + '\'">Body text 123</small></button>'; }).join('') + '</div>' +
      '<label class="am-tick' + (S.fontKeep ? ' gold' : '') + '"><input type="checkbox" id="am-fontkeep"' + (S.fontKeep ? ' checked' : '') + '> ' + W.keepFonts + '</label>';
    h += ft + '</div>';
    var cl = colours(), co = '<div class="am-urow"><div class="k">' + W.colours;
    if (c.main) co += '<span>\u00b7 from the customer</span></div><div class="am-urnote" style="display:flex;align-items:center;gap:8px;color:var(--am-ink)"><i class="am-dot" style="background:' + cl.main + ' !important"></i><i class="am-dot" style="background:' + (cl.accent || '#fff') + ' !important"></i>Main \u00b7 Accent. ' + W.nothingToDecide + '</div>';
    else co += '<span class="am-flag warn" style="background:#FBF3DF !important">' + W.needsYou + '</span></div>' +
      '<div class="am-cols">' + ['main', 'accent'].map(function (k) { var v = S.col[k]; return '<div class="am-swf"><div class="am-lab">' + (k === 'main' ? 'Main' : 'Accent') + (v ? revert('colCancel', ' data-k="' + k + '"') : '') + '</div><div class="wrap">' + swatch(v) + inp('data-col="' + k + '" placeholder="#000000" maxlength="7"', v, !!v, COL_PAD) + '</div></div>'; }).join('') + '</div>' +
      (S.adColours && S.adColours.length ? '<div class="am-sug">In the ad: ' + S.adColours.map(function (x) { return '<button type="button" style="background:' + esc(x) + ' !important" title="' + esc(x) + '" data-sug="' + esc(x) + '"></button>'; }).join('') + '<span>Click to fill Main, then Accent.</span></div>' : '') +
      '<div class="am-urnote">Leave empty and a neutral colour is used. Filled, they are saved to the customer on Save.</div>';
    h += co + '</div>';
    return h;
  }

  // ══════════════════════════════════════════════════════════════
  //  1 · Start - who, and from what
  // ══════════════════════════════════════════════════════════════
  function vStart() {
    var it = item(), c = cust();
    var mid;
    if (!S.sel) mid = '<div class="am-empty"><p>' + W.empty + '</p>' + btn('newC', W.newC, 'secondary') + '</div>';
    else if (it && it.coming) mid = colh(it.title) + '<div class="am-card"><div class="am-note">' + esc(it.what) + ' ads ' + W.toolComing + '</div></div>';
    else if (it && it.err) mid = colh(it.title) + '<div class="am-err">' + esc(it.m) + '</div>';
    else mid = startCentre(it);
    var ready = !!(c && S.shape && S.src && (S.src !== 'drop' || S.drop) && (S.src !== 'version' || S.fromVersion));
    var pend = (S.col.main ? 1 : 0) + (S.col.accent ? 1 : 0);
    var srcWord = { print: W.srcPrint, drop: W.srcDrop, version: W.srcVersion, none: W.srcNone }[S.src] || '';
    var fv = S.src === 'version' && S.fromVersion ? versionsOf(S.custId).filter(function (v) { return v.id === S.fromVersion; })[0] : null;
    var msg = S.sel ? (c ? (!S.shape ? W.whichShape + '?' : S.src ? 'Making a ' + S.shape + ' from <b>' + esc(srcWord.toLowerCase()) + '</b>' + (fv ? ' \u00b7 ' + esc(fv.name) : '') + (pend ? ' \u00b7 ' + pend + ' brand colour' + (pend > 1 ? 's' : '') + ' to the customer on Save' : '') : W.howStart) : W.custFirst) : 'Pick a job on the left.';
    shell(mid, barHTML(msg, (S.sel ? ghost('startCancel', W.cancel) : '') + (S.sel && !(it && (it.coming || it.err)) ? btn('toRead', S.src === 'none' ? W.showDrafts : W.readAd, 'primary', !ready) : '')));
  }
  function jobWord(it) { return S.shape ? 'Making a ' + S.shape : (it && it.what ? String(it.what) : 'New creative'); }
  function startCentre(it) {
    var userPicked = S.custId !== S.custPre, c = cust(), h = '';
    if (!c || S.changeCust) {
      h += colh(W.chooseCust) + '<div class="am-custpick"><select class="am-sel' + (userPicked ? ' am-dirty' : '') + '" id="am-cust" style="width:420px !important;height:36px !important;font-size:13.5px !important;padding:0 28px 0 10px !important">' +
        '<option value=""' + (!S.custId ? ' selected' : '') + ' disabled>' + W.chooseCust + '</option>' +
        CUST.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === S.custId ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select>' +
        (it && it.kind === 'note' ? '<div class="am-srcl" style="margin-top:6px">' + W.notInList + ' <a href="#" class="am-up" data-act="clients">' + W.addInClients + '</a></div>' : '') + '</div>';
      if (!c) return h;
    }
    var ask = function (n, title, sub, body, todo) { return '<div class="am-askrow' + (todo ? ' todo' : '') + '"><div class="n">' + n + '</div><div class="am-askb"><div class="t">' + title + (sub ? ' <span>' + sub + '</span>' : '') + '</div>' + body + '</div></div>'; };
    h = ask(1, 'Who', '', '<div class="am-who2"><span class="nm">' + esc(c.name) + '</span>' + (S.changeCust ? '' : '<a href="#" class="am-up" data-act="changeCust">Change customer</a>') + (S.custId !== S.custPre ? ' ' + revert('custCancel') : '') + '</div>' + (S.changeCust ? h : '') + '<div class="am-srcl">The logo, colours and fonts on this record are what the ads use.</div>');
    h += ask(2, W.whichShape, W.oneAtATime, '<div class="am-shapes">' + SHAPE_TILES.map(function (t) { var off = t[3]; return '<button type="button" class="am-shape' + (off ? ' off' : S.shape === t[0] ? ' on' : '') + '"' + (off ? ' disabled' : ' data-shape="' + t[0] + '"') + '><i class="' + t[0] + '"></i><b>' + t[1] + '</b><small>' + t[2] + '</small></button>'; }).join('') + '</div>');
    if (!S.shape) return h + ask(3, 'From what', '', '<div class="am-srcl">Pick the shape first.</div>', true);
    var vs = versionsOf(c.id);
    var verList = vs.length ? '<div class="am-vers">' + vs.slice(0, 4).map(function (v) {
        return '<button type="button" class="am-ver' + (S.src === 'version' && S.fromVersion === v.id ? ' on' : '') + '" data-ver="' + esc(v.id) + '">' + (v.banner ? '<img src="' + esc(v.banner) + '" alt="">' : '<i></i>') + '<span>' + esc(v.name) + '</span><em>' + (v.recipe ? 'Made in Ad Maker' : 'Picture only') + '</em></button>'; }).join('') +
        (vs.length > 4 ? '<div class="am-srcl">+ ' + (vs.length - 4) + ' more on the Asset Library</div>' : '') + '</div>' : '<div class="am-srcl">No ads on file for this customer yet.</div>';
    var tiles = [
      { k: 'print', t: W.srcPrint, p: W.srcPrintSub, hint: W.srcPrintHint, dis: true },
      { k: 'drop', t: W.srcDrop, p: W.srcDropSub, hint: W.srcDropHint, dis: false, inner: S.src === 'drop' ? (S.drop ? '<div class="am-dropin"><b>' + esc(S.drop.name) + '</b> \u00b7 ' + (S.drop.pages ? S.drop.pages + ' page' + (S.drop.pages > 1 ? 's' : '') + ' \u00b7 you box the ad next' : 'picture') + ' ' + revert('srcCancel') + '</div>' : '<div class="am-drop" data-act="fileDrop" id="am-dropzone"><div class="t"><b>' + W.dropHere + '</b>, ' + W.orClick + '</div><input type="file" id="am-file" accept="application/pdf,image/*" style="display:none"></div>') : '' },
      { k: 'version', t: W.srcVersion, p: 'Reuse the wording and logo from one of this customer\u2019s saved ads, then change what you like.', hint: W.srcVersionHint, dis: !vs.length, inner: verList },
      { k: 'none', t: W.srcNone, p: W.srcNoneSub, hint: W.srcNoneHint, dis: false }
    ];
    h += ask(3, 'From what', W.startFromSub, '<div class="am-srcs">' + tiles.map(function (t) {
      return '<div class="am-srct' + (t.dis ? ' dis' : '') + (S.src === t.k ? ' picked' : '') + '"' + (t.dis ? '' : ' data-src="' + t.k + '"') + '><h3>' + esc(t.t) + '</h3><p>' + esc(t.p) + '</p>' + (t.inner || '') + '<small>' + esc(t.hint) + '</small></div>';
    }).join('') + '</div>');
    return h;
  }

  // ══════════════════════════════════════════════════════════════
  //  Sources: a dropped file, a PDF page, a version, nothing
  // ══════════════════════════════════════════════════════════════
  function takeFile(file) {
    if (!file) return;
    S.drop = { name: file.name, file: file, pages: 0, key: null, img: null };
    S.box = null;
    if (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name)) {
      if (!window.IxPdfPager || !IxPdfPager.load) { S.drop = null; toast('ix-pdf-pager v1.1.0 is not on the page, so a PDF cannot be opened.', 'err'); render(); return; }
      IxPdfPager.load(file).then(function (key) { S.drop.key = key; return IxPdfPager.pages(key); })
        .then(function (n) { S.drop.pages = n || 1; S.page = 1; render(); })
        .catch(function (e) { S.drop = null; toast('The PDF could not be opened: ' + ((e && e.message) || e), 'err'); render(); });
    } else {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () { S.drop.img = img; render(); };
      img.onerror = function () { S.drop = null; toast('That file is not a picture or a PDF.', 'err'); render(); };
      img.src = url;
    }
    render();
  }
  // The page picture (for boxing) as an <img>: a rendered PDF page or the dropped picture.
  function pageImage() {
    if (!S.drop) return Promise.resolve(null);
    if (S.drop.img) return Promise.resolve(S.drop.img);
    if (S.drop.pageImg && S.drop.pageImgN === S.page) return Promise.resolve(S.drop.pageImg);
    return IxPdfPager.render(S.drop.key, S.page, 1800).then(function (dataUrl) {
      return new Promise(function (ok, bad) { var i = new Image(); i.onload = function () { S.drop.pageImg = i; S.drop.pageImgN = S.page; ok(i); }; i.onerror = function () { bad(new Error('The page did not render.')); }; i.src = dataUrl; });
    });
  }
  // Crop the source picture to the box (fractions of the picture) → canvas at full resolution.
  function cropToCanvas(img, box) {
    var W0 = img.naturalWidth || img.width, H0 = img.naturalHeight || img.height, b = box || { x: 0, y: 0, w: 1, h: 1 };
    var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(W0 * b.w)); cv.height = Math.max(1, Math.round(H0 * b.h));
    cv.getContext('2d').drawImage(img, Math.round(W0 * b.x), Math.round(H0 * b.y), cv.width, cv.height, 0, 0, cv.width, cv.height);
    return cv;
  }
  function scaled(cv, maxSide) {
    var k = Math.min(1, maxSide / Math.max(cv.width, cv.height)); if (k === 1) return cv;
    var o = document.createElement('canvas'); o.width = Math.round(cv.width * k); o.height = Math.round(cv.height * k);
    o.getContext('2d').drawImage(cv, 0, 0, o.width, o.height); return o;
  }
  function subCanvas(cv, bbox, pad) {
    pad = pad || 0;
    var x = clamp(bbox[0] - pad, 0, 1), y = clamp(bbox[1] - pad, 0, 1), w = clamp(bbox[2] + pad * 2, 0, 1 - x), h = clamp(bbox[3] + pad * 2, 0, 1 - y);
    var o = document.createElement('canvas'); o.width = Math.max(1, Math.round(cv.width * w)); o.height = Math.max(1, Math.round(cv.height * h));
    o.getContext('2d').drawImage(cv, Math.round(cv.width * x), Math.round(cv.height * y), o.width, o.height, 0, 0, o.width, o.height); return o;
  }

  // ── The read: ix-adreformat v1.3.0 ─────────────────────────────
  function readAd() {
    var c = cust(), worker = CFG().adReformatWorker;
    if (!worker) { S.err = 'TA_CONFIG.adReformatWorker is missing.'; render(); return; }
    S.reading = true; S.err = ''; render();
    pageImage().then(function (img) {
      var box = S.box || { x: 0, y: 0, w: 1, h: 1 };
      S.srcCanvas = cropToCanvas(img, box);
      var small = scaled(S.srcCanvas, SOURCE_MAX), data = small.toDataURL('image/jpeg', READ_JPEG).split(',')[1];
      var textP = (S.drop && S.drop.key) ? IxPdfPager.text(S.drop.key, S.page, S.box || undefined).catch(function () { return null; }) : Promise.resolve(null);
      return textP.then(function (pdfText) {
        return fetchJson(worker, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: { media_type: 'image/jpeg', data: data }, pdfText: pdfText || undefined, customer: { name: c.name } }) });
      });
    }).then(function (r) {
      if (!r.ok || !r.j || r.j.ok !== true) throw new Error((r.j && r.j.error) || ('ix-adreformat answered HTTP ' + r.status));
      S.read = r.j; S.reading = false;
      takePlan(r.j); takeParts(r.j);
      render();
    }).catch(function (e) { S.reading = false; S.err = (e && e.message) || 'The read failed.'; render(); });
  }
  function takePlan(j) {
    S.words = {}; S.base = {}; S.from = {};
    (j.plan || []).forEach(function (l) { S.words[l.slot] = l.words || ''; S.base[l.slot] = l.words || ''; S.from[l.slot] = l.label || ''; });
    SLOTS.forEach(function (s) { if (S.words[s[0]] == null) { S.words[s[0]] = ''; S.base[s[0]] = ''; S.from[s[0]] = 'Empty'; } });
    if (!S.words.button) { S.words.button = ''; }
  }
  // Pictures out of the parts: the biggest photo/mascot/graphic, and the logo cut.
  function takeParts(j) {
    var parts = (j.parts && j.parts.images) || [], c = cust();
    var pics = parts.filter(function (p) { return /^(photo|mascot|graphic)$/.test(p.kind); }).sort(function (a, b) { return (b.bbox[2] * b.bbox[3]) - (a.bbox[2] * a.bbox[3]); });
    S.photo = null; S.usePhoto = true;
    if (pics.length) {
      var p = pics[0], cv = subCanvas(S.srcCanvas, p.bbox, 0);
      S.photo = { img: cv, kind: p.kind === 'photo' ? 'photo' : 'graphic', label: p.label, url: '', nativeWidth: cv.width, subject: p.subject || null, bbox: p.bbox };
    }
    var logos = parts.filter(function (p) { return p.kind === 'logo' || p.kind === 'badge'; }).sort(function (a, b) { return (b.bbox[2] * b.bbox[3]) - (a.bbox[2] * a.bbox[3]); });
    S.printLogo = null; S.logoUse = c.logo ? 'file' : 'print'; S.logoScope = 'version'; S.logoKeep = false; S.logoSwap = false; S.logoSwapKeep = false;
    if (logos.length) {
      var l = logos[0], lc = subCanvas(S.srcCanvas, l.bbox, 0);
      S.printLogo = { img: lc, raw: lc, transparent: false, isolating: false };
      isolateLogo();   // onto transparency (ruled 5 Nov: all logos transparent)
    }
    S.adColours = (j.parts && j.parts.brand_colors) || [];
    if (!c.main && !S.col.main && S.adColours.length) { /* suggestion only: Jeff fills the boxes on Start */ }
    S.fontPair = (fontOf(c.fontHead) && fontOf(c.fontBody)) ? '' : (S.fontPair || FONT_PAIRS[0].id);
  }
  function isolateLogo() {
    var worker = CFG().objectIsolatorWorker, L = S.printLogo; if (!worker || !L) return;
    L.isolating = true;
    fetchJson(worker, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ return_base64: true, image: L.raw.toDataURL('image/png'), box_prompts: [[0, 0, L.raw.width, L.raw.height]] }) })
      .then(function (r) {
        if (!r.ok || !r.j || r.j.ok !== true || !r.j.data) throw new Error((r.j && r.j.error) || 'Isolation failed');
        return new Promise(function (ok, bad) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { bad(new Error('Could not decode the cut-out.')); }; i.src = 'data:' + (r.j.media_type || 'image/png') + ';base64,' + r.j.data; });
      })
      .then(function (img) { var cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; cv.getContext('2d').drawImage(img, 0, 0); L.img = cv; L.transparent = true; L.isolating = false; if (S.screen === 'read') render(); })
      .catch(function (e) { L.isolating = false; L.isoErr = (e && e.message) || 'Isolation failed'; if (S.screen === 'read') render(); });
  }
  // Start from a version: rebuild from the recipe, or read its banner picture.
  function loadVersion(v) {
    S.fromVersion = v.id;
    if (!v.recipe) return;
    try { S.verRecipe = IxAdLayouts.recipe.parse(v.recipe); } catch (e) { S.verRecipe = null; S.verRecipeErr = e.message; }
  }

  // ══════════════════════════════════════════════════════════════
  //  2 · Read: box the ad on a page, then the check step
  // ══════════════════════════════════════════════════════════════
  function needsBox() { return S.src === 'drop' && S.drop && !S.drop.img && !S.boxed; }
  function vRead() {
    var c = cust();
    if (needsBox()) {
      var left = colh('Page', S.drop.name + (S.drop.pages > 1 ? ' \u00b7 page ' + S.page + ' of ' + S.drop.pages : '')) +
        '<div class="am-pagebox" id="am-page"><div class="am-note" style="padding:20px">Rendering the page\u2026</div></div>' +
        (S.drop.pages > 1 ? '<div class="am-pager">' + ghost('pagePrev', '\u2039 Page') + '<span>' + S.page + ' / ' + S.drop.pages + '</span>' + ghost('pageNext', 'Page \u203a') + '</div>' : '');
      var mid = colh('Pick the ad') + '<div class="am-card"><div class="am-note" style="color:var(--am-ink);font-size:13px">' + W.pickAd + ' for ' + esc(c.name) + '. Drag on the page.</div>' +
        (S.box ? '<div style="margin-top:10px">' + flag('ok', 'Box drawn \u00b7 ' + Math.round(S.box.w * 100) + '% \u00d7 ' + Math.round(S.box.h * 100) + '% of the page') + ' ' + revert('boxCancel') + '</div>' : '') +
        '<div class="am-srcl" style="margin-top:10px">One ad fills the page? <a href="#" class="am-up" data-act="wholePage">' + W.wholePage + '</a></div></div>';
      shell('<div class="am-boxcols">' + col('', 'width:460px;flex:none', left) + col('', 'flex:1', mid) + '</div>',
        barHTML(S.box ? 'Ready to read the boxed ad.' : 'Draw a box round the ad.', ghost('back', W.back) + btn('readBox', W.readAd, 'primary', !S.box)), { right: null });
      pageImage().then(function (img) {
        var el = document.getElementById('am-page'); if (!el || !img) return;
        el.innerHTML = '<img src="' + img.src + '" alt="Page" draggable="false">' + (S.box ? '<div class="bx on" style="left:' + S.box.x * 100 + '%;top:' + S.box.y * 100 + '%;width:' + S.box.w * 100 + '%;height:' + S.box.h * 100 + '%"></div>' : '');
        wireBoxDrawing(el);
      }).catch(function (e) { var el = document.getElementById('am-page'); if (el) el.innerHTML = '<div class="am-err">' + esc(e.message) + '</div>'; });
      return;
    }
    // v2.0.0: Read = the wording in the centre; where the words came from sits above it.
    var rd0 = S.read && S.read.read;
    var srcStrip = function () {
      return '<div class="am-from"><div class="am-fromth" id="am-srcimg">' + (S.reading ? '<div class="am-scan"></div>' : '') + '</div><div class="am-fromtx">' + (rd0 ? '<b>' + (rd0.method === 'pdf' ? 'PDF text, exact.' : rd0.method === 'recipe' ? 'From the saved recipe.' : 'Read by vision.') + '</b> ' + esc(rd0.note || '') : (S.reading ? '<b>' + W.reading + '</b> ' + W.readingSub : S.src === 'none' ? '<b>Nothing to read.</b> Type the wording below; website and phone come from the customer.' : '')) +
        (S.read && S.read.warnings || []).map(function (w) { return '<span class="am-warnline">' + esc(w) + '</span>'; }).join('') + '</div></div>';
    };
    if (S.reading) {
      shell(colh(W.wording, W.wordingSub) + srcStrip() + '<div class="am-prog"><b>' + W.reading + '</b><div class="am-note">' + W.readingSub + '</div><div class="bar"><i></i></div></div>',
        barHTML('Reading\u2026', btn('x', W.confirm, 'primary', true)));
      showSource(); return;
    }
    if (S.err) {
      shell(colh(W.wording) + srcStrip() + '<div class="am-err">' + esc(S.err) + '</div><div style="margin-top:10px">' + btn('readAgain', 'Read again', 'secondary') + '</div>', barHTML('', ghost('back', W.back)));
      showSource(); return;
    }
    var changed = SLOTS.filter(function (s) { return S.words[s[0]] !== S.base[s[0]]; }).length;
    var mid = colh(W.wording, 'Check and fix. Every draft uses the words as you confirm them here.') + srcStrip() + '<div class="am-card" style="padding:2px 12px">' + SLOTS.map(function (s) {
      var k = s[0], ch = S.words[k] !== S.base[k];
      return '<div class="am-wline"><div class="am-lab">' + s[1] + '<em' + (ch ? ' class="ed"' : '') + '>' + (ch ? W.edited : esc(S.from[k] || '')) + '</em>' + (ch ? revert('wCancel', ' data-k="' + k + '"') : '') + '<span class="am-cnt" data-cnt="' + k + '">' + (S.words[k] ? S.words[k].length + ' chars' : '') + '</span></div>' + inp('data-w="' + k + '" placeholder="None"', S.words[k], ch) + '</div>';
    }).join('') + '</div>';
    shell(mid, barHTML(changed ? '<b>' + changed + ' wording change' + (changed > 1 ? 's' : '') + '</b> \u00b7 the drafts use the words as confirmed here' : 'Wording as read \u00b7 the drafts use it as confirmed here',
      (changed ? ghost('readCancel', W.cancel) : '') + ghost('back', W.back) + btn('toDrafts', W.confirm)));
    showSource();
  }
  function showSource() {
    var el = document.getElementById('am-srcimg'); if (!el) return;
    if (S.srcCanvas) { var t = thumbOf(S.srcCanvas, 56); el.insertBefore(t, el.firstChild); }
    else if (S.src === 'none') el.innerHTML = '<div class="am-note" style="padding:6px;font-size:11px">No print ad</div>';
    else if (S.src === 'version' && S.verImg) { var t2 = thumbOf(S.verImg, 56); el.insertBefore(t2, el.firstChild); }
  }
  function thumbOf(cv, h, w) {
    var img = document.createElement('img');
    img.src = cv.toDataURL ? cv.toDataURL('image/png') : cv.src;
    if (h) { img.style.maxHeight = h + 'px'; } if (w) { img.style.width = w + 'px'; } img.style.maxWidth = '100%'; img.style.display = 'block';
    return img;
  }
  function sharpFor(shape) {
    if (!S.photo || !window.IxAdLayouts) return ['warn', '?'];
    var SH; try { SH = IxAdLayouts.shapes()[shape]; } catch (e) { return ['warn', 'no size']; }
    var need = SH.w * IxAdLayouts.CONST.SHARP_FACTOR * 0.55, have = S.photo.nativeWidth || 0, r = have / need;
    return r >= 1 ? ['ok', 'Sharp'] : r >= IxAdLayouts.CONST.SOFT_RATIO ? ['warn', 'Soft'] : ['bad', 'Too small'];
  }
  function colours() { var c = cust() || {}; var main = c.main || S.col.main, accent = c.accent || S.col.accent; return { main: main, accent: accent, missing: !main }; }
  function wireBoxDrawing(el) {
    var img = el.querySelector('img'); if (!img) return;
    var start = null, bx = null;
    function pos(e) { var r = img.getBoundingClientRect(), p = e.touches ? e.touches[0] : e; return { x: clamp((p.clientX - r.left) / r.width, 0, 1), y: clamp((p.clientY - r.top) / r.height, 0, 1) }; }
    el.addEventListener('mousedown', function (e) { if (e.button !== 0) return; e.preventDefault(); start = pos(e); var old = el.querySelector('.bx'); if (old) old.remove(); bx = document.createElement('div'); bx.className = 'bx on'; el.appendChild(bx); });
    window.addEventListener('mousemove', function (e) { if (!start || !bx) return; var p = pos(e), x = Math.min(start.x, p.x), y = Math.min(start.y, p.y), w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y); bx.style.left = x * 100 + '%'; bx.style.top = y * 100 + '%'; bx.style.width = w * 100 + '%'; bx.style.height = h * 100 + '%'; bx._b = { x: x, y: y, w: w, h: h }; });
    window.addEventListener('mouseup', function () { if (!start) return; if (bx && bx._b && bx._b.w > 0.02 && bx._b.h > 0.02) { S.box = bx._b; render(); } else if (bx) bx.remove(); start = null; bx = null; });
  }

  // ══════════════════════════════════════════════════════════════
  //  The layout input (what ix-ad-layouts paints from)
  // ══════════════════════════════════════════════════════════════
  var IMG_CACHE = {};
  // v1.0.2: "Transparent file" is a pixel test, not a file-exists test. Result cached per URL:
  // 'transparent' (any sampled pixel has alpha < 250), 'opaque', or 'unknown' (the picture could not be read back: CORS).
  // v1.5.0 · each logo file is read server-side by extract-client /logo: { ok, transparent, light, lum, error }.
  var TONE = {};
  function logoTone(url) {
    if (!url) return null;
    var r = TONE[url];
    if (!r) {
      TONE[url] = 'checking'; r = 'checking';
      var base = String(CFG().extractClientUrl || '').replace(/\/+$/, '');
      if (!base) { TONE[url] = { ok: false, error: 'TA_CONFIG.extractClientUrl is missing' }; return TONE[url]; }
      fetchJson(base + '/logo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url }) })
        .then(function (q) { var j = q.j || {}; TONE[url] = q.ok && j.ok ? { ok: true, transparent: !!j.transparent, light: !!j.light, lum: j.lum, w: j.w, h: j.h } : { ok: false, error: j.error || ('Worker answered ' + q.status) }; })
        .catch(function (e) { TONE[url] = { ok: false, error: (e && e.message) || String(e) }; })
        .then(function () { if (S.screen === 'start' || S.screen === 'read') render(); });
    }
    return r;
  }
  function logoFlag(url, expect) {   // expect: 'dark' | 'light' (what the field is for)
    var t = logoTone(url);
    if (t === 'checking') return flag('warn', 'Reading the file\u2026');
    if (!t || !t.ok) { if (!t._logged) { t._logged = true; try { console.warn('[ad-maker] /logo could not read ' + url + ': ' + (t && t.error)); } catch (e) {} } return flag('warn', 'Couldn\u2019t check this file') + '<span class="am-srcl" title="' + esc((t && t.error) || '') + '">Judge it by eye on the tile.</span>'; }
    if (!t.transparent) return flag('bad', 'Not transparent') + '<span class="am-srcl">The file brings its own background, so it is drawn as it is. A transparent PNG works on every panel.</span>';
    var tone = t.light ? 'Light logo' : 'Dark logo', fits = (expect === 'light') === t.light;
    return flag(fits ? 'ok' : 'bad', tone + ' \u00b7 transparent') + (fits ? '' : '<span class="am-srcl">' + (expect === 'dark' ? 'This field is for the dark logo, used on light panels.' : 'This field is for the light logo, used on dark panels.') + '</span>');
  }
  // v1.5.2: the dark slot is drawn on white only once the file is known to be dark. Unknown or light → grey checker,
  // so a white-on-transparent file is visible instead of vanishing into a white tile.
  function darkPlate(url) { var t = logoTone(url); return (t && t !== 'checking' && t.ok && !t.light) ? 'onlight' : 'onchk'; }
  // v2.0.0: logoTiles / readLogoPicker (v1.4-v1.5) removed. The customer's file is the logo; see useCol().
  function loadImg(url) {
    if (!url) return Promise.resolve(null);
    if (IMG_CACHE[url]) return Promise.resolve(IMG_CACHE[url]);
    return new Promise(function (ok) { var i = new Image(); i.crossOrigin = 'anonymous'; i.onload = function () { IMG_CACHE[url] = i; ok(i); }; i.onerror = function () { ok(null); }; i.src = url; });
  }
  function fontsFor() {
    var c = cust() || {}, fh = fontOf(c.fontHead), fb = fontOf(c.fontBody);
    if (fh && fb) return { head: fh.family, headWeight: fh.weight || 700, body: fb.family, from: 'customer' };
    var p = FONT_PAIRS.filter(function (x) { return x.id === S.fontPair; })[0] || FONT_PAIRS[0];
    return { head: p.head, headWeight: p.headWeight, body: p.body, from: 'pair' };
  }
  function layoutInput() {
    var c = cust(), cl = colours(), f = fontsFor();
    return Promise.all([loadImg(c.logo), loadImg(c.logoLight)]).then(function (imgs) {
      if (!imgs[0] && S.logoNewImg) imgs[0] = S.logoNewImg;   // v2.0.0: a file pasted for a customer with none
      var useFile = (c.logo || S.logoNewUrl) && S.logoUse === 'file' && imgs[0];
      var logo = useFile ? (S.logoSwap ? { main: null, light: imgs[0], source: 'customer', url: '', lightUrl: c.logo, nativeWidth: null, lightNativeWidth: imgs[0].naturalWidth } : { main: imgs[0], light: imgs[1], source: 'customer', url: c.logo || S.logoNewUrl, lightUrl: c.logoLight || '', nativeWidth: imgs[0].naturalWidth, lightNativeWidth: imgs[1] ? imgs[1].naturalWidth : null })
        : (S.printLogo ? { main: S.printLogo.img, light: null, source: 'print', url: S.printLogoUrl || '', lightUrl: '', nativeWidth: S.printLogo.img.width } : null);
      var photo = (S.photo && S.usePhoto) ? { img: S.photo.img, kind: S.photo.kind, url: S.photo.url || '', nativeWidth: S.photo.nativeWidth, subject: S.photo.subject || null, focus: null } : null;
      var w = {}; SLOTS.forEach(function (s) { w[s[0]] = S.words[s[0]] || ''; });
      return { name: c.name, wording: w, headlineSlot: (S.ed && S.ed.head) || 'headline', colors: { main: cl.main, accent: cl.accent }, fonts: { head: f.head, headWeight: f.headWeight, body: f.body }, logo: logo, photo: photo };
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  3 · Drafts
  // ══════════════════════════════════════════════════════════════
  function makeDrafts() {
    S.drafts = null; S.short = { banner: [], sidebar: [] }; S.draftErr = '';
    return layoutInput().then(function (input) {
      S.input = input;
      var ch = IxAdLayouts.choose(input), shape = S.shape || 'banner';
      // v2.2.0: proposals of the one shape — colours dominate, then layouts, then font pairs
      var layouts = ch[shape] || [], c = cust() || {};
      var bgs = [''].concat((S.adColours || []).map(hex).filter(Boolean).slice(0, AD_COLOURS_MAX)); if (c.main && bgs.indexOf(hex(c.main)) < 0) bgs.push(hex(c.main));
      if (bgs.length === 1) bgs.push(INK);   // nothing found in the ad and no brand colour: still offer a dark version
      var custFonts = !!(fontOf(c.fontHead) && fontOf(c.fontBody)), pairs = custFonts ? [null] : FONT_PAIRS;
      var props = [], li = 0, pi = 0;
      for (var round = 0; props.length < PROPOSAL_MAX && round < 4; round++) {
        for (var b = 0; b < bgs.length && props.length < PROPOSAL_MAX; b++) {
          var base = layouts[li % layouts.length]; if (!base) break;
          var sr = JSON.parse(JSON.stringify(base)); if (bgs[b]) sr.bg = bgs[b];
          var pr = pairs[pi % pairs.length]; if (pr) { sr.style = sr.style || {}; sr.style.headline = { font: pr.head, weight: pr.headWeight }; IxAdLayouts.ensureFont(pr.head); }
          var key = sr.layout + '|' + (sr.bg || '') + '|' + (pr ? pr.id : '') + '|' + (sr.crop ? sr.crop.mode : '');
          if (!props.some(function (q) { return q.key === key; })) props.push({ key: key, sr: sr, label: (bgs[b] ? colourWord(bgs[b]) : 'layout colours') + (pr ? ' \u00b7 ' + pr.head : '') + ' \u00b7 ' + sr.layout });
          li++; pi++;
        }
      }
      return Promise.all(props.map(function (q) { return IxAdLayouts.paint(input, q.sr).then(function (p) { return { sr: q.sr, paint: p, label: q.label }; }); })).then(function (res) {
        S.drafts = { banner: shape === 'banner' ? res : [], sidebar: shape === 'sidebar' ? res : [], leftOut: ch.leftOut };
      });
    }).catch(function (e) { S.draftErr = (e && e.message) || 'The drafts could not be painted.'; });
  }
  function colourWord(h) {   // a plain word for a palette colour, for labels only
    var m = String(h).replace('#', ''), r = parseInt(m.substr(0, 2), 16), g = parseInt(m.substr(2, 2), 16), b = parseInt(m.substr(4, 2), 16), l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn < 24) return l > 0.85 ? 'white' : l < 0.2 ? 'black' : 'grey';
    var hue = mx === r ? (60 * ((g - b) / (mx - mn)) + 360) % 360 : mx === g ? 60 * ((b - r) / (mx - mn)) + 120 : 60 * ((r - g) / (mx - mn)) + 240;
    return hue < 20 || hue >= 340 ? 'red' : hue < 50 ? 'orange' : hue < 70 ? 'yellow' : hue < 170 ? 'green' : hue < 200 ? 'teal' : hue < 260 ? 'blue' : hue < 300 ? 'purple' : 'pink';
  }
  function sharedChecks() {
    var all = S.drafts.banner.concat(S.drafts.sidebar), first = all[0]; if (!first) return [];
    var ids = {}; first.paint.checks.forEach(function (c) { ids[c.id] = c; });
    all.forEach(function (d) { var have = {}; d.paint.checks.forEach(function (c) { have[c.id] = 1; }); Object.keys(ids).forEach(function (k) { if (!have[k]) delete ids[k]; }); });
    return Object.keys(ids).map(function (k) { return ids[k]; });
  }
  function vDrafts() {
    if (!S.drafts && !S.draftErr) { shell(colh(W.drafts) + '<div class="am-prog"><b>Painting the drafts</b><div class="am-note">Every layout that suits this ad, at 2\u00d7.</div><div class="bar"><i></i></div></div>', barHTML('Painting\u2026', ghost('back', W.back))); return; }
    if (S.draftErr) { shell(colh(W.drafts) + '<div class="am-err">' + esc(S.draftErr) + '</div>', barHTML('', ghost('back', W.back))); return; }
    var nb = S.short.banner.length, ns = S.short.sidebar.length, shared = sharedChecks(), sharedIds = {}; shared.forEach(function (c) { sharedIds[c.id] = 1; });
    var top = '<div class="am-shared">' + shared.map(function (c) { return flag(c.level, c.text); }).join('') + '<span class="am-note">' + esc(S.drafts.leftOut) + '</span></div>';
    var grid = function (shape) {
      return '<div class="am-dsec">' + (shape === 'banner' ? W.banners : W.sidebars) + ' <span>' + S.drafts[shape].length + '</span></div><div class="am-dgrid ' + shape + '">' + S.drafts[shape].map(function (d, i) {
        var on = S.short[shape].indexOf(i) > -1, L = IxAdLayouts.LAYOUTS[d.sr.layout];
        return '<div class="am-draft' + (on ? ' on' : '') + '" data-pk="' + shape + ':' + i + '"><div class="ph"><b>' + esc(d.sr.layout + ' \u00b7 ' + L.name) + '</b>' + (d.sr.crop && d.sr.crop.mode !== 'whole' ? '<span class="crop">' + (d.sr.crop.mode === 'close' ? 'Close' : 'Wide') + '</span>' : '') + '</div><div class="pic" data-cv="' + shape + ':' + i + '"></div><div class="chks">' + d.paint.checks.filter(function (c) { return !sharedIds[c.id]; }).map(function (c) { return flag(c.level, c.text); }).join('') + '</div></div>';
      }).join('') + '</div>';
    };
    shell(colh(W.drafts, 'From the same wording, logo and photo. Pick the ones to keep; the rest are dropped.') + top + grid('banner') + grid('sidebar'),
      barHTML(W.shortlist + ': <b>' + nb + ' banner' + (nb === 1 ? '' : 's') + ', ' + ns + ' sidebar' + (ns === 1 ? '' : 's') + '</b>' + (nb || ns ? ' \u00b7 the others are dropped' : '. ' + W.atLeastOne), (nb || ns ? ghost('draftsCancel', W.cancel) : '') + ghost('back', W.back) + btn('toTune', W.keepThese, 'primary', !(nb || ns))));
    document.querySelectorAll('#' + MOUNT_ID + ' [data-cv]').forEach(function (el) {
      var p = el.getAttribute('data-cv').split(':'), d = S.drafts[p[0]][+p[1]]; el.appendChild(canvasView(d.paint.canvas, p[0] === 'banner' ? 300 : 192));
    });
  }
  function canvasView(cv, w) { var i = document.createElement('img'); i.src = cv.toDataURL('image/png'); i.style.width = w + 'px'; i.style.display = 'block'; i.draggable = false; return i; }

  // ══════════════════════════════════════════════════════════════
  //  4 · Fine-tune. Each shortlisted shape keeps its own recipe;
  //  wording is shared. Checks repaint live.
  // ══════════════════════════════════════════════════════════════
  function initTune() {
    var mk = function (shape) { return S.short[shape].map(function (i) { var d = S.drafts[shape][i]; return { sr: JSON.parse(JSON.stringify(d.sr)), sr0: JSON.parse(JSON.stringify(d.sr)), paint: d.paint }; }); };
    S.ed = { B: mk('banner'), S: mk('sidebar'), sel: S.short.banner.length ? 'banner' : 'sidebar', b: 0, s: 0, piece: 'headline', head: S.input.headlineSlot || 'headline', head0: S.input.headlineSlot || 'headline', w0: JSON.parse(JSON.stringify(S.words)) };
    S.savePick = { banner: S.ed.B.length ? [0] : [], sidebar: S.ed.S.length ? [0] : [] };
  }
  // v2.1.0 · Make: the engine's best pick per shape, with and without the photo
  function initMake() {
    var shape = S.shape || 'banner', n = 0;
    var items = (S.drafts[shape] || []).map(function (d) { n++; return { id: n, sr: JSON.parse(JSON.stringify(d.sr)), sr0: JSON.parse(JSON.stringify(d.sr)), paint: d.paint, label: d.label || shapeLabel(shape), kept: false }; });
    S.ed = { B: shape === 'banner' ? items : [], S: shape === 'sidebar' ? items : [], sel: shape, b: -1, s: -1, next: n + 1, piece: 'headline', head: S.input.headlineSlot || 'headline', head0: S.input.headlineSlot || 'headline', w0: JSON.parse(JSON.stringify(S.words)), scope: 'one', palette: [] };
    syncSavePick();
  }
  function keptItems() { return allCards().filter(function (x) { return x.kept; }); }
  function itemById(id) { return allCards().filter(function (x) { return x.id === id; })[0] || null; }
  function syncSavePick() { S.savePick = { banner: [], sidebar: [] }; S.ed.B.forEach(function (x, i) { if (x.kept) S.savePick.banner.push(i); }); S.ed.S.forEach(function (x, i) { if (x.kept) S.savePick.sidebar.push(i); }); }
  function forward() { var e = S.ed, i = e.sel === 'banner' ? e.b : e.s, arr = e.sel === 'banner' ? e.B : e.S; return i >= 0 ? arr[i] : null; }
  function setForward(x) { var e = S.ed; if (!x) { e.b = -1; e.s = -1; return; } var i = e.B.indexOf(x); if (i > -1) { e.sel = 'banner'; e.b = i; } else { e.sel = 'sidebar'; e.s = e.S.indexOf(x); } }
  function allCards() { return S.ed ? S.ed.B.concat(S.ed.S) : []; }
  function cardShape(x) { return S.ed.B.indexOf(x) > -1 ? 'banner' : 'sidebar'; }
  function targets() { var f = forward(); return f ? [f] : []; }   // v2.2.0: the forward item only
  function each(fn) { var ts = targets(); if (!ts.length) return; ts.forEach(fn); repaint(ts[0]); }
  function cardLabel(x) { return shapeLabel(cardShape(x)) + ' \u00b7 ' + (x.label || ''); }
  function curShape(shape) { var e = S.ed; return shape === 'banner' ? e.B[e.b] : e.S[e.s]; }
  function changeCount() {
    var e = S.ed, n = 0; if (!e) return 0;
    if (e.head !== e.head0) n++;
    ['supporting', 'button', 'phone', 'website', 'small_print'].forEach(function (k) { if (S.words[k] !== e.w0[k]) n++; });
    e.B.concat(e.S).forEach(function (x) { if (JSON.stringify(x.sr) !== JSON.stringify(x.sr0)) n++; });
    return n;
  }
  var paintTimer = null;
  function repaint(x, shape) {
    if (paintTimer) clearTimeout(paintTimer);
    paintTimer = setTimeout(function () {
      layoutInput().then(function (input) { S.input = input; return IxAdLayouts.paint(input, x.sr); }).then(function (p) { x.paint = p; drawStage(); drawShortlist(); fontRetry(x, p); }).catch(function (e) { toast(e.message, 'err'); });
    }, 60);
  }
  // v2.1.0: a font that was still loading at paint time gets one more paint once the browser has it
  function fontRetry(x, p) {
    if (!p || !p.checks || !document.fonts || x._fontRetry) return;
    if (!p.checks.some(function (c) { return /^font-/.test(c.id); })) return;
    x._fontRetry = true;
    document.fonts.ready.then(function () { setTimeout(function () { if (S.ed && allCards().indexOf(x) > -1) repaint(x); }, 400); });
  }
  function repaintAll() {
    layoutInput().then(function (input) { S.input = input; return Promise.all(S.ed.B.concat(S.ed.S).map(function (x) { return IxAdLayouts.paint(input, x.sr).then(function (p) { x.paint = p; }); })); }).then(function () { drawStage(); drawShortlist(); }).catch(function (e) { toast(e.message, 'err'); });
  }
  function sizesHTML(x) {
    return PIECES.map(function (p) { var k = p[0], v = x.sr.sizes[k] || 1, ch = Math.abs(v - 1) > 0.001;
      return '<div class="am-szr' + (ch ? ' dirty' : '') + '"><span class="n">' + p[1] + '</span><input type="range" min="' + IxAdLayouts.CONST.SIZE_MIN + '" max="' + IxAdLayouts.CONST.SIZE_MAX + '" step="0.05" value="' + v + '" data-sz="' + k + '"><span class="v">' + Math.round(v * 100) + '%</span>' + (ch ? revert('szCancel', ' data-k="' + k + '"') : '<span class="am-revert"></span>') + '</div>'; }).join('');
  }
  // v1.2.0 · per-piece style helpers
  function pieceOf(sr, k) { if (!sr.style) sr.style = {}; if (!sr.style[k]) sr.style[k] = {}; return sr.style[k]; }
  function tidy(sr, k) { var st = sr.style && sr.style[k]; if (st) { Object.keys(st).forEach(function (q) { if (st[q] === '' || st[q] == null || st[q] === false && q !== 'show' || (q === 'dy' && !st[q]) || (q === 'show' && st[q] === true)) delete st[q]; }); if (!Object.keys(st).length) delete sr.style[k]; } if (sr.style && !Object.keys(sr.style).length) delete sr.style; }
  function pieceSlots(x) {   // the pieces this layout actually carries, as [key, label]
    var L = IxAdLayouts.LAYOUTS[x.sr.layout], out = [], seen = {}, e = S.ed;
    (L.els || []).forEach(function (el) { var k = el.k === 'chip' || el.k === 'lbox' ? 'logo' : el.k === 'button' ? 'button' : el.k === 'text' ? (el.slot === 'headline' ? e.head : el.slot) : ''; if (!k || seen[k]) return; if (k !== 'logo' && k !== 'button' && !S.words[k]) return; if (k === 'button' && !S.words.button) return; seen[k] = 1; out.push([k, PIECE_WORDS[k] || k]); });
    return out;
  }
  function styleKey(x, piece) { return piece === 'headline2' ? 'headline' : piece; }   // the layout's headline slot paints whichever headline is chosen
  function swatchList(extra) {
    var cl = colours(), list = [];
    var add = function (v, t) { v = hex(v); if (v && !list.some(function (q) { return q[0] === v; })) list.push([v, t]); };
    (S.adColours || []).forEach(function (v) { add(v, 'From the ad'); });
    add(cl.main, 'Brand main'); add(cl.accent, 'Brand accent'); add(INK, 'Ink'); add(WHITE, 'White'); (extra || []).forEach(function (q) { add(q[0], q[1]); });
    (S.ed && S.ed.palette || []).forEach(function (h) { add(h, 'Added'); });
    return list;
  }
  function swatchesHTML(cur, act, extra) {
    var list = swatchList(extra);
    return list.map(function (q) { return '<button type="button" class="am-swb' + (cur === q[0] ? ' on' : '') + '" style="background:' + q[0] + ' !important" title="' + esc(q[1] + ' ' + q[0]) + '" data-act="' + act + '" data-v="' + q[0] + '"></button>'; }).join('');
  }
  function styleGroupHTML(x, piece) {
    var k = styleKey(x, piece), st = (x.sr.style && x.sr.style[k]) || {}, st0 = (x.sr0.style && x.sr0.style[k]) || {}, ch = JSON.stringify(st) !== JSON.stringify(st0);
    var f = fontsFor(), autoFam = k === 'headline' ? f.head : f.body, isText = k !== 'logo';
    var slots = pieceSlots(x);
    var tabs = '<div class="am-pcs">' + slots.map(function (q) { return '<button type="button" class="am-pc' + (q[0] === piece ? ' on' : '') + '" data-act="pickPiece" data-v="' + q[0] + '">' + esc(q[1]) + (x.sr.style && x.sr.style[styleKey(x, q[0])] && Object.keys(x.sr.style[styleKey(x, q[0])]).length ? '<i></i>' : '') + '</button>'; }).join('') + '</div>';
    var h = '<div class="am-grp' + (ch ? ' am-grp-dirty' : '') + '"><h4>Type and colour <small>' + esc(PIECE_WORDS[piece] || piece) + ' only</small>' + (ch ? revert('pieceCancel', ' data-k="' + k + '"') : '') + '</h4>' + tabs;
    if (isText) {
      h += '<div class="am-two"><div class="am-ctl"><div class="am-lab">Font</div><select class="am-sel' + (st.font ? ' am-dirty' : '') + '" data-st="font" style="height:30px !important;font-size:12.5px !important;width:100% !important"><option value="">' + esc(autoFam) + ' (layout)</option>' + FONT_PAIRS.map(function (p) { return p.head; }).concat(FONT_LIST).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).map(function (v) { return '<option value="' + esc(v) + '"' + (st.font === v ? ' selected' : '') + ' style="font-family:\'' + esc(v) + '\'">' + esc(v) + '</option>'; }).join('') + '</select></div>' +
        '<div class="am-ctl"><div class="am-lab">Weight</div><select class="am-sel' + (st.weight ? ' am-dirty' : '') + '" data-st="weight" style="height:30px !important;font-size:12.5px !important;width:100% !important"><option value="">Layout</option>' + IxAdLayouts.CONST.FONT_WEIGHTS.map(function (w) { return '<option value="' + w + '"' + (st.weight === w ? ' selected' : '') + '>' + w + '</option>'; }).join('') + '</select></div></div>';
    }
    var sz = x.sr.sizes[k] != null ? x.sr.sizes[k] : 1;
    h += '<div class="am-row3"><div class="am-ctl"><div class="am-lab">Size</div><div class="am-numwrap"><input class="am-inp' + (Math.abs(sz - 1) > 0.001 ? ' am-dirty' : '') + '" type="number" min="30" max="300" step="5" data-st="size" value="' + Math.round(sz * 100) + '" style="height:30px !important;font-size:12.5px !important;width:100% !important"><span>%</span></div></div>' +
      '<div class="am-ctl"><div class="am-lab">Position</div><div class="am-nudge"><button type="button" data-act="nudge" data-v="-1" title="Up ' + IxAdLayouts.CONST.NUDGE_STEP + 'px">\u2191</button><button type="button" data-act="nudge" data-v="1" title="Down ' + IxAdLayouts.CONST.NUDGE_STEP + 'px">\u2193</button><span class="v' + (st.dy ? ' on' : '') + '">' + (st.dy ? (st.dy > 0 ? '+' : '') + st.dy + 'px' : 'in place') + '</span></div></div>' +
      '<div class="am-ctl"><div class="am-lab">Shown</div><label class="am-tick" style="margin-top:6px"><input type="checkbox" data-st="show"' + (st.show === false ? '' : ' checked') + '> ' + (st.show === false ? 'Hidden' : 'Yes') + '</label></div></div>';
    if (isText) h += '<div class="am-ctl"><div class="am-lab">Colour <span class="am-light">' + (st.color ? 'your colour' : 'by contrast') + '</span></div><div class="am-swrow">' + swatchesHTML(st.color || '', 'pieceColour') + '<input type="color" data-st="colorPick" value="' + (st.color || '#000000') + '" title="Any colour"><input class="am-inp' + (st.color ? ' am-dirty' : '') + '" data-st="color" placeholder="auto" maxlength="7" value="' + esc(st.color || '') + '" style="height:28px !important;width:84px !important;font-size:12px !important">' + (st.color ? revert('pieceClear', ' data-k="color"') : '') + '</div></div>';
    if (k === 'logo') { var hasD = !!(cust() && cust().logo) && !S.logoSwap, hasL = !!(cust() && (cust().logoLight || S.logoSwap)), cur = st.variant || '';
      h += '<div class="am-ctl"><div class="am-lab">Which file <span class="am-light">' + (cur ? 'forced' : 'picked per panel') + '</span></div><div class="am-seg"><button type="button" class="' + (!cur ? 'on' : '') + '" data-act="logoVariant" data-v="">Auto</button><button type="button" class="' + (cur === 'dark' ? 'on' : '') + '" data-act="logoVariant" data-v="dark"' + (hasD ? '' : ' disabled') + '>Dark</button><button type="button" class="' + (cur === 'light' ? 'on' : '') + '" data-act="logoVariant" data-v="light"' + (hasL ? '' : ' disabled') + '>Light</button></div></div>'; }
    if (k === 'button') h += '<div class="am-ctl"><div class="am-lab">Button fill <span class="am-light">' + (st.fill ? 'your colour' : 'brand accent') + '</span></div><div class="am-swrow">' + swatchesHTML(st.fill || '', 'pieceFill') + '<input type="color" data-st="fillPick" value="' + (st.fill || '#000000') + '" title="Any colour"><input class="am-inp' + (st.fill ? ' am-dirty' : '') + '" data-st="fill" placeholder="accent" maxlength="7" value="' + esc(st.fill || '') + '" style="height:28px !important;width:84px !important;font-size:12px !important">' + (st.fill ? revert('pieceClear', ' data-k="fill"') : '') + '</div></div>';
    return h + '</div>';
  }
  function layoutGroupHTML(x) {
    var bg = x.sr.bg || '', plate = typeof x.sr.plate === 'boolean' ? (x.sr.plate ? 'on' : 'off') : 'auto', ch = bg !== (x.sr0.bg || '') || plate !== (typeof x.sr0.plate === 'boolean' ? (x.sr0.plate ? 'on' : 'off') : 'auto');
    var cl = colours(), seg = function (act, cur, opts) { return '<div class="am-seg">' + opts.map(function (o) { return '<button type="button" class="' + (cur === o[0] ? 'on' : '') + '" data-act="' + act + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; };
    var custom = bg && ['main', 'accent', 'white'].indexOf(bg) < 0 ? hex(bg) : '';
    return '<div class="am-grp' + (ch ? ' am-grp-dirty' : '') + '"><h4>Layout <small>this shape</small>' + (ch ? revert('layoutCancel') : '') + '</h4>' +
      '<div class="am-ctl"><div class="am-lab">Background</div>' + seg('bgPick', custom ? 'custom' : (bg || ''), [['', 'Layout'], ['main', 'Main'], ['accent', 'Accent'], ['white', 'White'], ['custom', 'Custom']]) + (custom || bg === 'custom' ? '<div class="am-swrow" style="margin-top:6px">' + swatchesHTML(custom, 'bgColour') + '<input type="color" data-st="bgPick" value="' + (custom || cl.main || '#000000') + '"><input class="am-inp am-dirty" data-st="bg" maxlength="7" value="' + esc(custom) + '" placeholder="#000000" style="height:28px !important;width:84px !important;font-size:12px !important"></div>' : '') + '</div>' +
      '<div class="am-ctl"><div class="am-lab">Logo plate</div>' + seg('platePick', plate, [['auto', 'As needed'], ['on', 'Always'], ['off', 'Never']]) + '</div></div>';
  }
  function drawPieceOverlay() {   // clickable, outlined pieces over the stage picture
    var e = S.ed, x = curShape(e.sel), el = document.getElementById('am-st'); if (!x || !el) return;
    var img = el.querySelector('img'); if (!img) return;
    var L = IxAdLayouts.LAYOUTS[x.sr.layout], D = IxAdLayouts.CONST.DESIGN[L.shape], r = img.getBoundingClientRect(), k = r.width / D.w;
    el.querySelectorAll('.am-hit').forEach(function (n) { n.remove(); });
    el.style.position = 'relative';
    (L.els || []).forEach(function (q) {
      var key = q.k === 'chip' || q.k === 'lbox' ? 'logo' : q.k === 'button' ? 'button' : q.k === 'text' ? (q.slot === 'headline' ? e.head : q.slot) : '';
      if (!key) return; if (key !== 'logo' && !S.words[key]) return;
      var st = (x.sr.style || {})[styleKey(x, key)] || {}, dy = (+st.dy || 0) * k;
      var h = (q.h || (q.k === 'chip' ? q.h : 0) || 40) * k, w = (q.w || q.maxw || 160) * k, top = q.y * k + dy;
      // v2.0.3: a text piece's box hugs the ink it drew (lines × size × line height), not the layout's reserved slot
      var ft = q.k === 'text' && x.paint && x.paint.fit && x.paint.fit[q.slot];
      if (ft && ft.lines && ft.size) {
        var kc = r.width / x.paint.width, ink = ft.lines * ft.size * IxAdLayouts.CONST.LINE_HEIGHT * kc;
        if (ink < h) { if (q.mid) top += (h - ink) / 2; h = ink; }
      }
      var d = document.createElement('div'); d.className = 'am-hit' + (key === e.piece ? ' on' : ''); d.setAttribute('data-act', 'pickPiece'); d.setAttribute('data-v', key); d.title = PIECE_WORDS[key] || key;
      d.style.cssText = 'left:' + (q.x * k) + 'px;top:' + top + 'px;width:' + w + 'px;height:' + h + 'px';
      el.appendChild(d);
    });
  }
  // ══════════════════════════════════════════════════════════════
  //  3 · Make — the workbench
  // ══════════════════════════════════════════════════════════════
  function paletteHTML(cur, act, extra) {
    var sw = swatchesHTML(cur, act, (S.ed.palette || []).map(function (h) { return [h, 'Added']; }));
    return '<div class="am-swrow">' + sw + '<input type="color" data-st="' + extra + 'Pick" value="' + (cur || '#000000') + '" title="Any colour"><input class="am-inp' + (cur ? ' am-dirty' : '') + '" data-st="' + extra + '" placeholder="#hex" maxlength="7" value="' + esc(cur || '') + '" style="height:28px !important;width:84px !important;font-size:12px !important"></div>';
  }
  function backgroundsGroupHTML(x) {
    var bg = x.sr.bg || '', b2 = x.sr.bg2 || null, plate = typeof x.sr.plate === 'boolean' ? (x.sr.plate ? 'on' : 'off') : 'auto';
    var ch = JSON.stringify([x.sr.bg || null, x.sr.bg2 || null, x.sr.plate]) !== JSON.stringify([x.sr0.bg || null, x.sr0.bg2 || null, x.sr0.plate]);
    var seg = function (act, cur, opts) { return '<div class="am-seg">' + opts.map(function (o) { return '<button type="button" class="' + (cur === o[0] ? 'on' : '') + '" data-act="' + act + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; };
    var cl = colours(), custom = bg && ['main', 'accent', 'white'].indexOf(bg) < 0 ? hex(bg) : (bg === 'main' ? hex(cl.main) : bg === 'accent' ? hex(cl.accent) : bg === 'white' ? WHITE : '');
    var h = '<div class="am-grp' + (ch ? ' am-grp-dirty' : '') + '"><h4>Backgrounds' + (ch ? revert('layoutCancel') : '') + '</h4>' +
      '<div class="am-ctl">' + seg('bgCount', b2 ? '2' : '1', [['1', 'One'], ['2', 'Two']]) + '</div>' +
      '<div class="am-ctl"><div class="am-lab">Panel 1 <span class="am-light">' + (bg ? '' : 'the layout\u2019s') + '</span>' + (bg ? revert('bgPick', ' data-v=""') : '') + '</div>' + paletteHTML(custom, 'bgColour', 'bg') + '</div>';
    if (b2) h += '<div class="am-ctl"><div class="am-lab">Panel 2 <span class="am-light">' + Math.round((b2.w || 0.35) * 100) + '% of the width \u00b7 drag the split on the stage</span></div>' + paletteHTML(hex(b2.color) || '', 'bg2Colour', 'bg2') +
      '<div class="am-zoomrow" style="margin-top:6px"><input type="range" min="0.05" max="0.8" step="0.01" value="' + (b2.w || 0.35) + '" data-st="bg2w"><span class="v">' + Math.round((b2.w || 0.35) * 100) + '%</span></div>' +
      seg('bg2Side', b2.side === 'left' ? 'left' : 'right', [['left', 'On the left'], ['right', 'On the right']]) + '</div>';
    h += '<div class="am-ctl"><div class="am-lab">Logo plate</div>' + seg('platePick', plate, [['auto', 'As needed'], ['on', 'Always'], ['off', 'Never']]) + '</div>' +
      '<div class="am-ctl"><div class="am-lab">Add a colour to the palette</div><div class="am-swrow"><input type="color" data-st="palPick" value="#000000"><input class="am-inp" data-st="palAdd" placeholder="#hex, then Enter" maxlength="7" style="height:28px !important;width:110px !important;font-size:12px !important"></div></div></div>';
    return h;
  }
  function arrangementGroupHTML(x) {
    var shape = cardShape(x), L = IxAdLayouts.LAYOUTS, codes = Object.keys(L).filter(function (c) { return L[c].shape === shape && (!L[c].usesPhoto || (S.input && S.input.photo)); });
    var ch = x.sr.layout !== x.sr0.layout;
    return '<div class="am-grp' + (ch ? ' am-grp-dirty' : '') + '"><h4>Arrangement <small>' + esc(shapeLabel(shape)) + '</small>' + (ch ? revert('layoutBack') : '') + '</h4>' +
      '<select class="am-sel' + (ch ? ' am-dirty' : '') + '" id="am-layout" style="height:32px !important;font-size:12.5px !important;width:100% !important">' + codes.map(function (c) { return '<option value="' + c + '"' + (c === x.sr.layout ? ' selected' : '') + '>' + esc(c + ' \u00b7 ' + L[c].name + (L[c].usesPhoto ? ' (photo)' : '')) + '</option>'; }).join('') + '</select></div>';
  }
  function fontPickHTML(x) {
    var k = styleKey(x, S.ed.piece), st = (x.sr.style && x.sr.style[k]) || {}, f = fontsFor(), autoFam = k === 'headline' ? f.head : f.body;
    var fams = FONT_PAIRS.map(function (p) { return p.head; }).concat(FONT_LIST).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).slice(0, 12);
    fams.forEach(IxAdLayouts.ensureFont);
    return '<div class="am-fontpick"><button type="button" class="' + (!st.font ? 'on' : '') + '" data-act="fontPick" data-v="">' + esc(autoFam) + '<small>the layout\u2019s</small></button>' + fams.map(function (fam) { return '<button type="button" class="' + (st.font === fam ? 'on' : '') + '" style="font-family:\'' + esc(fam) + '\'" data-act="fontPick" data-v="' + esc(fam) + '">' + esc(fam) + '</button>'; }).join('') + '</div>';
  }
  function vMake() {
    var e = S.ed, shape = S.shape || 'banner';
    if (!S.drafts && !S.draftErr) { shell(colh('Make \u00b7 ' + shapeLabel(shape)) + '<div class="am-prog"><b>Painting the proposals</b><div class="am-note">Every layout that suits a ' + shape + ', in every colour found in the ad.</div><div class="bar"><i></i></div></div>', barHTML('Painting\u2026', ghost('back', W.back))); return; }
    if (S.draftErr) { shell(colh('Make') + '<div class="am-err">' + esc(S.draftErr) + '</div>', barHTML('', ghost('back', W.back))); return; }
    if (!e) { initMake(); e = S.ed; }
    var x = forward(), items = allCards(), kept = keptItems();
    var card = function (y) { if (y === x) return ''; return '<div class="am-mcard' + (y.kept ? ' kept' : '') + '" data-fw="' + y.id + '"><div class="pic" data-slcv="' + y.id + '"></div><div class="cap"><b>' + esc(y.label) + '</b>' + (y.kept ? '<span class="am-kepttag">' + W.kept + '</span>' : '') + '</div></div>'; };
    var grid = '<div class="am-gridh"><span class="am-lbl2">' + (x ? 'The rest' : 'Proposals') + '</span><span class="am-note">' + (x ? 'behind the one you\u2019re on \u00b7 click to swap' : 'every layout that suits a ' + shape + ' \u00d7 every colour found in the ad \u00b7 click one to bring it forward') + '</span></div><div class="am-mgrid' + (x ? ' back' : '') + '">' + items.map(card).join('') + '</div>';
    var stage = '';
    if (x) {
      var L = IxAdLayouts.LAYOUTS[x.sr.layout] || {}, dims = shape === 'banner' ? '700 \u00d7 235' : '480 \u00d7 400', hasPhoto = !!(S.input && S.input.photo) && x.sr.crop && x.sr.crop.mode !== 'whole';
      stage = '<div class="am-fwd"><div class="am-fwdacts"><span class="nm"><b>' + esc(x.label) + '</b> \u00b7 ' + esc(x.sr.layout + (L.name ? ' ' + L.name : '')) + ' \u00b7 ' + dims + ' at 100% \u00b7 click a piece to edit it' + (hasPhoto ? ' \u00b7 drag the photo' : '') + (x.sr.bg2 ? ' \u00b7 drag the split' : '') + '</span>' +
        ghost('cloneItem', W.clone) + ghost('variation', W.variations) + '<button type="button" class="am-keep' + (x.kept ? ' done' : '') + '" data-act="keep">' + (x.kept ? W.kept : W.keep) + '</button>' + revert('putBack').replace('>cancel<', '>' + W.putBack + '<') + '</div>' +
        '<div class="am-stage"><div class="am-shapebox edit" data-shape="' + shape + '" id="am-st"></div></div><div class="am-card am-ckcard" id="am-checks"></div></div>';
    }
    var mid = '<div class="am-colh">Make \u00b7 ' + esc(shapeLabel(shape)) + '<span>' + (x ? 'Edit it on the right. Keep puts it in the save set; Clone makes another from it.' : items.length + ' proposals. Click one to bring it forward.') + '</span></div>' + stage + grid;
    var panel;
    if (!x) panel = '<div class="am-note" style="line-height:1.5">Click a proposal to bring it forward. The controls work on the one that\u2019s forward.</div>';
    else {
      var fld = function (k, label) { var ch = S.words[k] !== e.w0[k]; return '<div class="am-ctl"><div class="am-lab">' + label + (ch ? '<span class="am-edited">edited</span>' + revert('fCancel', ' data-k="' + k + '"') : '') + '</div>' + inp('data-f="' + k + '"', S.words[k], ch) + '</div>'; };
      var headCh = e.head !== e.head0, crCh = JSON.stringify(x.sr.crop) !== JSON.stringify(x.sr0.crop), hasPh = !!(S.input && S.input.photo) && x.sr.crop && x.sr.crop.mode !== 'whole';
      panel = '<div class="am-note" style="margin:-4px 0 10px">Working on <b style="color:var(--am-ink)">' + esc(x.label) + '</b>. Gold means changed and not yet kept.</div>' +
        '<div class="am-grp"><h4>Font <small>' + esc(PIECE_WORDS[e.piece] || e.piece) + '</small></h4>' + fontPickHTML(x) + '</div>' +
        styleGroupHTML(x, e.piece) +
        '<div class="am-grp"><h4>Wording <small>every item</small></h4>' +
        '<div class="am-ctl"><div class="am-lab">' + W.headline + (headCh ? revert('headCancel') : '') + '</div><select class="am-sel' + (headCh ? ' am-dirty' : '') + '" id="am-head" style="height:32px !important;font-size:12.5px !important;width:100% !important"><option value="headline"' + (e.head === 'headline' ? ' selected' : '') + '>' + esc(S.words.headline || '(empty)') + '</option><option value="headline2"' + (e.head === 'headline2' ? ' selected' : '') + '>' + esc(S.words.headline2 || '(empty)') + '</option></select></div>' +
        fld('supporting', 'Supporting line') + '<div class="am-two">' + fld('button', 'Button') + fld('phone', 'Phone') + '</div></div>' +
        (hasPh ? '<div class="am-grp"><h4>Picture</h4><div class="am-ctl"><div class="am-lab">' + W.crop + '<span class="am-light">' + W.dragPhoto + ' on the stage</span>' + (crCh ? '<button type="button" class="am-revert" data-act="cropCancel">' + W.resetCrop + '</button>' : '') + '</div><div class="am-zoomwrap' + (crCh ? ' am-dirty' : '') + '"><div class="am-zoomrow"><span class="am-note">' + W.zoom + '</span><input type="range" min="1" max="' + IxAdLayouts.CONST.ZOOM_MAX + '" step="0.05" value="' + (x.sr.crop.zoom || 1) + '" id="am-zoom"><span class="v">' + (+(x.sr.crop.zoom || 1)).toFixed(2) + '\u00d7</span></div></div></div></div>' : '') +
        backgroundsGroupHTML(x) + arrangementGroupHTML(x) +
        '<div class="am-grp"><h4>' + W.sizes + '</h4><div id="am-sizes">' + sizesHTML(x) + '</div></div>';
    }
    var nk = kept.length, n = changeCount();
    shell(mid, barHTML('<b>' + nk + ' to save</b>' + (nk ? ' \u00b7 ' + kept.map(function (k) { return esc(k.label); }).join(', ') + ' \u00b7 each its own ADS row, pending' : ' \u00b7 nothing kept yet') + (n ? ' <span class="am-flag warn" style="background:#FBF3DF !important">' + n + ' change' + (n > 1 ? 's' : '') + ' not saved</span>' : ''),
      ghost('tuneCancel', W.cancel) + ghost('back', W.back) + btn('toSave', W.looksRight, 'primary', !nk)), { right: colh('Controls') + panel });
    if (x) drawStage(); drawShortlist();
  }
  function vTune() {
    var e = S.ed, fix = S.screen === 'fix', target = fix ? S.fix.shape : e.sel, x = curShape(target);
    if (fix) e.sel = target;
    if (!x) { e.sel = target = e.B.length ? 'banner' : 'sidebar'; x = curShape(target); }
    var fld = function (k, label) { var ch = S.words[k] !== e.w0[k]; return '<div class="am-ctl"><div class="am-lab">' + label + (ch ? '<span class="am-edited">edited</span>' + revert('fCancel', ' data-k="' + k + '"') : '') + '</div>' + inp('data-f="' + k + '"', S.words[k], ch) + '</div>'; };
    var crCh = JSON.stringify(x.sr.crop) !== JSON.stringify(x.sr0.crop), hasPhoto = !!(S.input && S.input.photo) && x.sr.crop && x.sr.crop.mode !== 'whole';
    var L = IxAdLayouts.LAYOUTS[x.sr.layout] || {}, dims = target === 'banner' ? '700 \u00d7 235' : '480 \u00d7 400';
    var left;
    if (fix) {
      var other = target === 'sidebar' ? 'banner' : 'sidebar';
      left = colh(W.sent) + '<div class="am-card"><div class="am-note" style="color:var(--am-ink);font-size:12.5px;line-height:1.45">' + esc(S.fix.q) + '</div><div class="am-note" style="margin-top:6px">' + esc(S.fix.m) + '</div></div>' +
        '<div class="am-card" style="margin-top:10px"><div class="am-lab">' + W.whatSave + '</div><div class="am-note">Replaces the ' + target + ' and resets its approval to ' + APPROVAL_WORDS.pending + '. The ' + other + ' is not touched.</div></div>' +
        (S.fix.otherUrl ? '<div class="am-sec">' + W.forRef + ' ' + other + '</div><img src="' + esc(S.fix.otherUrl) + '" alt="" style="width:100%;border-radius:4px"><div class="am-srcl">' + esc(S.fix.otherApproval || '') + '</div>' : '');
    } else {
      var li = function (shape, arr, cur) { if (!arr.length) return '<div class="am-note" style="margin-bottom:8px">None shortlisted.</div>'; return arr.map(function (y, i) { var on = S.savePick[shape].indexOf(i) > -1, here = shape === e.sel && i === cur;
        return '<div class="am-sli' + (here ? ' on' : '') + '" data-sl="' + shape + ':' + i + '"><div class="pic" data-slcv="' + shape + ':' + i + '"></div><div class="cap"><b>' + esc(y.sr.layout + (y.sr.crop && y.sr.crop.mode !== 'whole' ? ' \u00b7 ' + (y.sr.crop.mode === 'close' ? 'Close' : 'Wide') : '')) + '</b>' + (here ? '<span class="here">on the stage</span>' : '') +
          '<label class="am-tick small" title="' + W.toSave + '"><input type="checkbox" data-save="' + shape + ':' + i + '"' + (on ? ' checked' : '') + '> ' + W.saves + '</label></div></div>'; }).join(''); };
      left = '<div class="am-strip"><div class="am-striph">' + W.banners + ' <span>' + e.B.length + '</span></div>' + li('banner', e.B, e.b) + '<div class="am-striph">' + W.sidebars + ' <span>' + e.S.length + '</span></div>' + li('sidebar', e.S, e.s) + '</div>' +
        '<div class="am-note" style="margin:4px 0 10px">Click a card to put it on the stage. Tick <b>Saves</b> on each version to write. Either shape can be saved alone.</div>';
    }
    var stage = '<div class="am-stagehd"><b>' + esc(shapeLabel(target)) + ' \u00b7 ' + esc(x.sr.layout + (L.name ? ' ' + L.name : '')) + '</b><span>' + dims + ' \u00b7 shown at 100% \u00b7 click a piece to edit it' + (hasPhoto ? ' \u00b7 drag the photo to crop' : '') + '</span>' + (fix ? '' : '<span class="r">Pick a card above to change which ad is here</span>') + '</div>' +
      '<div class="am-stage"><div class="am-shapebox edit" data-shape="' + target + '" id="am-st"></div></div>' +
      '<div class="am-card am-ckcard" id="am-checks"></div>';
    var headCh = e.head !== e.head0;
    var panel = '<div class="am-colh">' + W.editing + ' <span style="color:var(--am-ink)">' + esc(shapeLabel(target)) + ' \u00b7 ' + esc(PIECE_WORDS[e.piece] || e.piece) + '</span></div><div class="am-note" style="margin:-4px 0 6px">Changes here apply to this shape only. Gold means changed and not yet saved.</div>' +
      '<div class="am-grp"><h4>Wording</h4>' +
      '<div class="am-ctl"><div class="am-lab">' + W.headline + (headCh ? revert('headCancel') : '') + '</div><select class="am-sel' + (headCh ? ' am-dirty' : '') + '" id="am-head" style="height:32px !important;font-size:12.5px !important;width:100% !important"><option value="headline"' + (e.head === 'headline' ? ' selected' : '') + '>' + esc(S.words.headline || '(empty)') + '</option><option value="headline2"' + (e.head === 'headline2' ? ' selected' : '') + '>' + esc(S.words.headline2 || '(empty)') + '</option></select></div>' +
      fld('supporting', 'Supporting line') + '<div class="am-two">' + fld('button', 'Button') + fld('phone', 'Phone') + '</div></div>' +
      (hasPhoto ? '<div class="am-grp"><h4>Picture</h4><div class="am-ctl"><div class="am-lab">' + W.crop + '<span class="am-light">' + W.dragPhoto + ' on the stage</span>' + (crCh ? '<button type="button" class="am-revert" data-act="cropCancel">' + W.resetCrop + '</button>' : '') + '</div><div class="am-zoomwrap' + (crCh ? ' am-dirty' : '') + '"><div class="am-zoomrow"><span class="am-note">' + W.zoom + '</span><input type="range" min="1" max="' + IxAdLayouts.CONST.ZOOM_MAX + '" step="0.05" value="' + x.sr.crop.zoom + '" id="am-zoom"><span class="v">' + (+x.sr.crop.zoom).toFixed(2) + '\u00d7</span></div></div><button type="button" class="am-sepbtn" disabled>' + W.separate + '</button></div></div>' : '') +
      styleGroupHTML(x, e.piece) + layoutGroupHTML(x) +
      '<div class="am-grp"><h4>' + W.sizes + ' <small>' + W.thisOnly + '</small></h4><div id="am-sizes">' + sizesHTML(x) + '</div></div>';
    var n = changeCount(), np = S.savePick.banner.length + S.savePick.sidebar.length;
    var npWords = np + ' version' + (np === 1 ? '' : 's');
    shell((fix ? left : '') + colh(fix ? W.fixing : 'Fine-tune', fix ? '' : 'Click a piece on the stage, then nudge it. Stepped moves only.') + (fix ? '' : left) + stage,
      barHTML((fix ? '' : '<b>' + npWords + '</b> to save: ' + S.savePick.banner.length + ' banner' + (S.savePick.banner.length === 1 ? '' : 's') + ', ' + S.savePick.sidebar.length + ' sidebar' + (S.savePick.sidebar.length === 1 ? '' : 's') + ', each its own ADS row.') + (n ? ' <span class="am-flag warn" style="background:#FBF3DF !important">' + n + ' change' + (n > 1 ? 's' : '') + ' not saved</span>' : ''),
        ghost('tuneCancel', W.cancel) + (fix ? '' : ghost('back', W.back)) + btn(fix ? 'doFix' : 'toSave', fix ? 'Replace ' + target : W.looksRight, 'primary', fix ? false : !np)),
      { right: colh('What you can do') + panel });
    drawStage(); if (!fix) drawShortlist();
  }
  function drawStage() {
    var e = S.ed; if (!e) return;
    var x = curShape(e.sel), el = document.getElementById('am-st'); if (!x || !el) return;
    el.innerHTML = ''; var v = canvasView(x.paint.canvas, e.sel === 'banner' ? 700 : 480); v.className = 'am-stagepic'; el.appendChild(v);
    if (S.input && S.input.photo && x.sr.crop && x.sr.crop.mode !== 'whole') wireCropDrag(el, x);
    drawPieceOverlay();
    if (x.sr.bg2) {   // v2.1.0: the split between the two backgrounds, draggable
      var hd = document.createElement('div'); hd.className = 'am-split'; hd.title = 'Drag to resize panel 2';
      var pw = v.getBoundingClientRect().width || (e.sel === 'banner' ? 700 : 480), w2 = x.sr.bg2.w || 0.35;
      hd.style.left = ((x.sr.bg2.side === 'left' ? w2 : 1 - w2) * pw - 4) + 'px';
      hd.addEventListener('mousedown', function (ev) { ev.preventDefault(); ev.stopPropagation(); DRAG = { split: true, pic: v, x: x, sx: ev.clientX, w0: w2 }; });
      el.appendChild(hd);
    }
    var ck = document.getElementById('am-checks');
    if (ck) { var cs = x.paint.checks || [], nf = cs.filter(function (c) { return c.level === 'bad'; }).length, nw = cs.filter(function (c) { return c.level === 'warn'; }).length, no = cs.filter(function (c) { return c.level === 'ok'; }).length;
      ck.innerHTML = '<div class="am-ckrow"><span class="am-chk ckh">' + W.checks + ' \u00b7 ' + esc(shapeLabel(e.sel)) + '</span>' + (nf ? flag('bad', nf + ' fix') : '') + (nw ? flag('warn', nw + ' check') : '') + (no ? flag('ok', no + ' ok') : '') + (cs.length ? '' : flag('ok', 'Nothing to flag')) + '</div>' +
        cs.filter(function (c) { return c.level !== 'ok'; }).map(function (c) { return '<div class="am-chk"><span class="n">' + esc(c.text) + '</span><span class="c">' + flag(c.level, c.level === 'warn' ? 'Check' : 'Fix') + '</span></div>'; }).join(''); }
    var sz = document.getElementById('am-sizes'); if (sz) sz.innerHTML = sizesHTML(x);
  }
  function drawShortlist() {
    document.querySelectorAll('#' + MOUNT_ID + ' [data-slcv]').forEach(function (el) { var v = el.getAttribute('data-slcv'), y = v.indexOf(':') > -1 ? (v.split(':')[0] === 'banner' ? S.ed.B : S.ed.S)[+v.split(':')[1]] : itemById(+v); el.innerHTML = ''; if (y) el.appendChild(canvasView(y.paint.canvas, CARD_W[cardShape(y)])); });
  }
  // One pair of window listeners for the crop drag (wired at mount); the drag itself lives in DRAG.
  var DRAG = null;
  function wireCropDrag(el, x) {
    var pic = el.querySelector('img'); if (!pic) return; pic.classList.add('am-drag');
    pic.addEventListener('mousedown', function (ev) { ev.preventDefault(); DRAG = { pic: pic, x: x, sx: ev.clientX, sy: ev.clientY, cx: x.sr.crop.cx, cy: x.sr.crop.cy }; });
  }
  function dragMove(ev) {
    var d = DRAG; if (!d) return;
    if (d.split) { var rw = d.pic.getBoundingClientRect().width, dx = (ev.clientX - d.sx) / rw; d.x.sr.bg2.w = clamp(d.x.sr.bg2.side === 'left' ? d.w0 + dx : d.w0 - dx, 0.05, 0.8); var hd = document.querySelector('#am-st .am-split'); if (hd) hd.style.left = ((d.x.sr.bg2.side === 'left' ? d.x.sr.bg2.w : 1 - d.x.sr.bg2.w) * rw - 4) + 'px'; repaint(d.x); return; }
    var r = d.pic.getBoundingClientRect(), z = d.x.sr.crop.zoom || 1;
    d.x.sr.crop.cx = clamp(d.cx - (ev.clientX - d.sx) / r.width / z, 0, 1); d.x.sr.crop.cy = clamp(d.cy - (ev.clientY - d.sy) / r.height / z, 0, 1);
    repaint(d.x);
  }
  function dragEnd() { if (DRAG) { DRAG = null; render(); } }

  // ══════════════════════════════════════════════════════════════
  //  5 · Save: pairs by position, one ADS row each, then 114 once
  // ══════════════════════════════════════════════════════════════
  function toBlob(cv) { return new Promise(function (ok, bad) { cv.toBlob(function (b) { b ? ok(b) : bad(new Error('The paint could not be exported.')); }, 'image/png'); }); }
  function upload(blob, name) {
    var pub = CFG().uploadcarePublicKey; if (!pub) return Promise.reject(new Error('TA_CONFIG.uploadcarePublicKey is missing.'));
    var fd = new FormData(); fd.append('UPLOADCARE_PUB_KEY', pub); fd.append('UPLOADCARE_STORE', '1'); fd.append('file', blob, name);
    return fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: fd, ixLabel: 'Uploadcare' }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.file) throw new Error('Uploadcare returned no file id.');
      return { uuid: j.file, cdnUrl: (CFG().uploadcareBase || 'https://ucarecdn.com').replace(/\/$/, '') + '/' + j.file + '/' };
    });
  }
  function mediaRow(up, name) {
    var cfg = CFG(); if (!cfg.makeConditioner) return Promise.reject(new Error('TA_CONFIG.makeConditioner is missing.'));
    return fetchJson(cfg.makeConditioner, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      action: 'createMediaFromBrowserUpload', uploadcareUuid: up.uuid, uploadcareUrl: up.cdnUrl, originalFilename: name, mimeType: 'image/png',
      titleSlug: cfg.titleSlug || '', taItemId: cfg.taItemId || '', componentRole: '', autoAttach: false, sourceChannel: 'reformatter', source: 'ta-admaker-v' + VERSION }) })
      .then(function (r) { if (!r.ok || !r.j || r.j.ok !== true || !(r.j.mediaId || r.j.mediaItemId)) throw new Error('Scenario B did not confirm the MEDIA row for ' + name + '.'); return r.j.mediaId || r.j.mediaItemId; });
  }
  function fileName(c, shape, n) { return (c.name + '-' + shape + '-' + new Date().toISOString().slice(0, 10) + (n > 1 ? '-v' + n : '')).replace(/[^A-Za-z0-9._-]+/g, '-') + '.png'; }
  // v1.0.1 · one row per ticked shape: banners first, then sidebars.
  function rowsToSave() {
    var e = S.ed, out = [];
    e.B.forEach(function (x, i) { if (x.kept || (x.label == null && S.savePick.banner.indexOf(i) > -1)) out.push({ shape: 'banner', x: x }); });
    e.S.forEach(function (x, i) { if (x.kept || (x.label == null && S.savePick.sidebar.indexOf(i) > -1)) out.push({ shape: 'sidebar', x: x }); });
    return out;
  }
  // The ADS add-type option id for a shape, read live from the list's options (never typed here).
  function addTypeId(shape) { return optId('add-type', shape === 'banner' ? 'Banner Ad' : 'Sidebar Ad'); }
  function custWrites() {
    var c = cust(), fd = {}, what = [];
    if (!c.main && S.col.main) { fd.brandColorMain = S.col.main; if (S.col.accent) fd.brandColorAccent = S.col.accent; fd.brandColorEvidence = 'Set by hand in Ad Maker, ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + '.'; what.push('brand colours'); }
    if (S.fontKeep && !(fontOf(c.fontHead) && fontOf(c.fontBody))) { var f = fontsFor(); fd.brandFontHeading = f.head + ' ' + f.headWeight; fd.brandFontBody = f.body + ' 400'; what.push('fonts'); }
    if (!c.logo && S.logoNewUrl && S.logoUse === 'file') { fd.logoLink = S.logoNewUrl; what.push('logo'); }   // v2.0.0: the file you fetched
    if (S.logoSwap && S.logoSwapKeep && c.logo && !c.logoLight) { fd.logoLinkLight = c.logo; fd.logoLink = fd.logoLink || ''; what.push('logo swap'); }
    return { fd: fd, what: what };
  }
  function write114(fd, label) {
    var cfg = CFG(), c = cust(); if (!cfg.makeUpdateCustomer) return Promise.reject(new Error('TA_CONFIG.makeUpdateCustomer is missing.'));
    return fetchJson(cfg.makeUpdateCustomer, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', titleSlug: cfg.titleSlug, taItemId: cfg.taItemId, publisherId: c.publisherId, customerId: c.id, publish: true, fieldData: fd, source: 'ta-admaker-v' + VERSION + ' ' + label }) })
      .then(function (r) {
        if (!r.ok || !r.j || r.j.ok !== true) throw new Error('Scenario 114 did not confirm the customer write.');
        var e = r.j.fieldData || {}, miss = [];
        var pairs = { brandColorMain: 'brand-color-main', brandColorAccent: 'brand-color-accent', brandFontHeading: 'brand-font-heading', brandFontBody: 'brand-font-body', logoLink: 'logo-link', logoLinkLight: 'logo-link-light', currentBannerAd: 'current-banner-ad', currentSidebarAd: 'current-sidebar-ad' };
        var idOf = function (v) { if (Array.isArray(v)) v = v[0]; return v && typeof v === 'object' ? (v.id || v.itemId || '') : (v || ''); };
        Object.keys(fd).forEach(function (k) { var slug = pairs[k]; if (slug && String(idOf(e[slug])).toUpperCase() !== String(fd[k]).toUpperCase()) miss.push(slug); });
        if (miss.length) throw new Error('Webflow did not keep ' + miss.join(', ') + '. Check Scenario 114\u2019s mapping for those fields.');
        if (fd.brandColorMain) { c.main = fd.brandColorMain; c.accent = fd.brandColorAccent || c.accent; }
        if (fd.brandFontHeading) { c.fontHead = fd.brandFontHeading; c.fontBody = fd.brandFontBody; }
        if (fd.logoLink) c.logo = fd.logoLink;
      });
  }
  function step(label, who) { var st = { label: label, who: who, state: 'wait' }; S.saving.steps.push(st); return st; }
  function run(st, p) { st.state = 'run'; render(); return p.then(function (v) { st.state = 'done'; render(); return v; }, function (e) { st.state = 'bad'; st.err = (e && e.message) || String(e); render(); throw e; }); }
  function doSave() {
    var c = cust(), cfg = CFG(), rows = rowsToSave();
    if (!cfg.makeCreateAssets) { toast('TA_CONFIG.makeCreateAssets is missing.', 'err'); return; }
    var pendB = optId('banner-approval', APPROVAL_WORDS.pending), pendS = optId('sidebar-approval', APPROVAL_WORDS.pending);
    if (!pendB || !pendS) { toast('The ADS collection has no "' + APPROVAL_WORDS.pending + '" choice on banner-approval or sidebar-approval, so nothing was saved.', 'err'); return; }
    if (!addTypeId('banner') || !addTypeId('sidebar')) { toast('The ADS add-type field has no "Banner Ad" or "Sidebar Ad" choice, so nothing was saved.', 'err'); return; }
    var nB = rows.filter(function (r) { return r.shape === 'banner'; }).length, nS = rows.length - nB;
    S.screen = 'save'; S.saving = { steps: [], rows: [], done: false, err: '', head: rows.length + ' version' + (rows.length === 1 ? '' : 's') + ': ' + nB + ' banner' + (nB === 1 ? '' : 's') + ', ' + nS + ' sidebar' + (nS === 1 ? '' : 's') + ', each its own ADS row' }; render();
    var chain = Promise.resolve();
    if (S.printLogo && (S.logoUse === 'print' || !c.logo)) chain = chain.then(function () { return run(step('Uploading the print logo', 'Uploadcare'), toBlob(S.printLogo.img).then(function (b) { return upload(b, fileName(c, 'logo', 1)); })).then(function (u) { S.printLogoUrl = u.cdnUrl; }); });
    if (S.photo && S.usePhoto && !S.photo.url) chain = chain.then(function () { return run(step('Uploading the photo for the recipe', 'Uploadcare'), toBlob(S.photo.img).then(function (b) { return upload(b, fileName(c, 'photo', 1)); })).then(function (u) { S.photo.url = u.cdnUrl; }); });
    rows.forEach(function (row, i) {
      var n = i + 1, sh = row.shape, x = row.x, label = shapeLabel(sh) + ' \u00b7 ' + versionName(c, n);
      chain = chain.then(function () {
        var name = versionName(c, n), up = null, mediaId = null, input;
        return layoutInput().then(function (inp) { input = inp;
          return run(step(label + ': painting at 2\u00d7', 'in the browser'), IxAdLayouts.paint(input, x.sr).then(function (p) { x.paint = p; }));
        }).then(function () {
          return run(step(label + ': uploading', 'Uploadcare'), toBlob(x.paint.canvas).then(function (b) { return upload(b, fileName(c, sh, n)); })).then(function (u) { up = u; });
        }).then(function () {
          return run(step(label + ': recording in MEDIA', 'Scenario B Route 4'), mediaRow(up, fileName(c, sh, n))).then(function (id) { mediaId = id; });
        }).then(function () {
          var recipe = IxAdLayouts.recipe.stringify(IxAdLayouts.recipe.make({ input: input, banner: sh === 'banner' ? x.sr : null, sidebar: sh === 'sidebar' ? x.sr : null }));
          var fields = { adName: name, customerId: c.id, customerName: c.name, addType: addTypeId(sh), reformatRecipe: recipe };
          if (sh === 'banner') { fields.bannerImageMediaId = mediaId; fields.bannerImageSrc = up.cdnUrl; fields.bannerApproval = pendB; }
          else { fields.sidebarImageMediaId = mediaId; fields.sidebarImageSrc = up.cdnUrl; fields.sidebarApproval = pendS; }
          return run(step(label + ': ADS row "' + name + '" with the recipe', 'Scenario 104'),
            fetchJson(cfg.makeCreateAssets, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assetType: 'ad', titleSlug: cfg.titleSlug, taItemId: cfg.taItemId, fields: fields, source: 'ta-admaker-v' + VERSION }) })
              .then(function (r) {
                if (!r.ok || !r.j || r.j.ok !== true) throw new Error('Scenario 104 did not confirm the ADS row.');
                var e = r.j.fieldData || null, miss = [];
                if (!e) throw new Error('Scenario 104 echoed no fieldData, so the row cannot be checked. Check Scenario 104\u2019s echo module.');
                if (String(e['reformat-recipe'] || '').trim() !== recipe.trim()) miss.push('reformat-recipe');
                if (!String(e[SHAPE_SLUG[sh].link] || '').trim()) miss.push(SHAPE_SLUG[sh].link);
                if (String(e[SHAPE_SLUG[sh].approval] || '') !== (sh === 'banner' ? pendB : pendS)) miss.push(SHAPE_SLUG[sh].approval);
                if (String(e['add-type'] || '') !== addTypeId(sh)) miss.push('add-type');
                if (miss.length) throw new Error('The row was created but Webflow did not keep ' + miss.join(', ') + '. Check Scenario 104\u2019s mapping for those fields.');
                S.saving.rows.push({ name: name, id: r.j.adId || r.j.itemId || '', shape: sh, banner: sh === 'banner' ? e['banner-ad-link'] : '', sidebar: sh === 'sidebar' ? e['sidebar-ad-link'] : '' });
              }));
        });
      });
    });
    var cw = custWrites();
    if (cw.what.length) chain = chain.then(function () { return run(step('Saving the ' + cw.what.join(', ') + ' to the customer', 'Scenario 114'), write114(cw.fd, 'save')); });
    chain.then(function () { S.saving.done = true; render(); return loadAds(); }).then(function () { render(); })
      .catch(function (e) { S.saving.err = (e && e.message) || String(e); render(); });
  }
  // v1.2.0 · Approve & make current from the Saved screen: Scenario G approveAd (echo checked), then 114 sets the customer's current-<shape>-ad pointer (echo checked).
  function approveRow(i) {
    var r = S.saving.rows[i], cfg = CFG(), c = cust(); if (!r || r.busy) return;
    if (!cfg.makeStudio) { toast('TA_CONFIG.makeStudio is missing.', 'err'); return; }
    var sh = r.shape, approvedId = optId(SHAPE_SLUG[sh].approval, APPROVAL_WORDS.approved);
    if (!approvedId) { toast('The ADS ' + SHAPE_SLUG[sh].approval + ' field has no "' + APPROVAL_WORDS.approved + '" choice.', 'err'); return; }
    r.busy = 'Approving\u2026'; r.approveErr = ''; render();
    var body = { action: 'approveAd', titleSlug: cfg.titleSlug, adItemId: r.id, source: 'ta-admaker-v' + VERSION };
    body[sh === 'banner' ? 'bannerApproval' : 'sidebarApproval'] = approvedId;
    fetchJson(cfg.makeStudio, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (q) { var fd = q.ok && q.j && q.j.ok === true && q.j.fieldData; if (!fd || String(fd[SHAPE_SLUG[sh].approval] || '') !== approvedId) throw new Error('Scenario G did not confirm the approval.'); r.busy = 'Making it current\u2026'; render();
        var fd2 = {}; fd2[sh === 'banner' ? 'currentBannerAd' : 'currentSidebarAd'] = r.id; return write114(fd2, 'current'); })
      .then(function () { r.busy = ''; r.current = true; render(); toast(esc(r.name) + ' approved and set as the current ' + sh + '.', 'ok'); return loadAds(); })
      .catch(function (e) { r.busy = ''; r.approveErr = (e && e.message) || String(e); render(); });
  }
  function vSave() {
    var sv = S.saving;
    if (!sv) {   // v2.0.0: what Save writes, before it writes it - Save is the bar's primary, like any other save
      var c = cust(), rows = rowsToSave(), cw = custWrites(), n = changeCount();
      var h0 = colh(W.whatSaveWrites, 'Press Save in the bar. Nothing is written until then.') + '<div class="am-card am-sum">' +
        rows.map(function (r, i) { var L = IxAdLayouts.LAYOUTS[r.x.sr.layout] || {}; return '<div class="am-sumrow"><div class="pic" data-sumcv="' + i + '"></div><div><b>' + esc(shapeLabel(r.shape)) + '</b> \u00b7 ' + esc((r.x.label ? r.x.label + ' \u00b7 ' : '') + r.x.sr.layout + (L.name ? ' ' + L.name : '')) + '<div class="am-srcl">Saved as <b>' + esc(versionName(c, i + 1)) + '</b> \u00b7 ' + APPROVAL_WORDS.pending + '</div></div></div>'; }).join('') +
        (cw.what.length ? '<div class="am-sumline gold">Also writes to the customer: ' + esc(cw.what.join(', ')) + '.</div>' : '<div class="am-sumline">Nothing is written to the customer record.</div>') +
        (n ? '<div class="am-sumline">' + n + ' fine-tune change' + (n > 1 ? 's' : '') + ' go into the recipes.</div>' : '') + '</div>';
      later(function () { document.querySelectorAll('#' + MOUNT_ID + ' [data-sumcv]').forEach(function (el) { var r = rows[+el.getAttribute('data-sumcv')]; el.innerHTML = ''; el.appendChild(canvasView(r.x.paint.canvas, r.shape === 'banner' ? 260 : 150)); }); });
      shell(h0, barHTML('<b>' + rows.length + ' version' + (rows.length === 1 ? '' : 's') + '</b> to the customer, pending' + (cw.what.length ? ' \u00b7 ' + cw.what.length + ' customer write' + (cw.what.length > 1 ? 's' : '') : ''),
        ghost('back', W.back) + btn('doSave', W.saveBtn + ' ' + rows.length + ' version' + (rows.length === 1 ? '' : 's'), 'primary', !rows.length)));
      return;
    }
    var h = colh(sv.done ? W.saved : W.saving, sv.head || '') + '<div class="am-card">' + sv.steps.map(function (st) {
      return '<div class="am-ps ' + st.state + '"><i>' + (st.state === 'done' ? '\u2713' : st.state === 'bad' ? '!' : '') + '</i>' + esc(st.label) + (st.err ? '<span class="am-err inline">' + esc(st.err) + '</span>' : '') + '<span class="who">' + esc(st.who) + '</span></div>'; }).join('');
    if (sv.err) h += '<div class="am-err" style="margin-top:10px">' + esc(sv.err) + '</div>';
    if (sv.rows.length) h += '<div class="am-result"><h4>' + sv.rows.length + ' version' + (sv.rows.length > 1 ? 's' : '') + ' saved</h4>' + sv.rows.map(function (r, i) { return '<div class="am-rr">' + (r.banner ? '<img src="' + esc(r.banner) + '" alt="" style="width:260px">' : '') + (r.sidebar ? '<img src="' + esc(r.sidebar) + '" alt="" style="width:120px">' : '') + '<div class="lines"><b>' + esc(r.name) + '</b><br>' + (r.banner ? 'Banner <span class="am-pend">' + APPROVAL_WORDS.pending + '</span> ' : '') + (r.sidebar ? 'Sidebar <span class="am-pend">' + APPROVAL_WORDS.pending + '</span>' : '') + '<br>' + (r.current ? '<span class="am-flag ok" style="background:#E6F2EC !important">Approved \u00b7 the customer\u2019s current ' + r.shape + '</span>' : r.busy ? '<span class="am-note">' + esc(r.busy) + '</span>' : (r.approveErr ? '<span class="am-err inline">' + esc(r.approveErr) + '</span> ' : '') + '<button type="button" class="ix-btn ix-btn--secondary" data-act="approveRow" data-i="' + i + '" style="height:30px !important;padding:0 12px !important;font-size:12.5px !important;margin-top:6px">Approve &amp; make current</button> <span class="am-note">or leave it Pending for the publisher to review</span>') + '</div></div>'; }).join('') + '</div>';
    h += '</div>';
    shell(h, barHTML(sv.done ? W.savedMsg : sv.err ? 'Stopped. Nothing after the failed step was written.' : W.keepOpen, (sv.done || sv.err) ? btn('again', W.again, 'secondary') : ''), { right: null });
  }

  // ══════════════════════════════════════════════════════════════
  //  Fix after send-back: the returned shape only
  // ══════════════════════════════════════════════════════════════
  function openFix(it) {
    S.sel = it.id; S.custId = it.custId; S.custPre = it.custId; S.src = 'version';
    var other = it.shape === 'banner' ? 'sidebar' : 'banner', fd = it.row.fieldData || {};
    S.fix = { adId: it.adId, shape: it.shape, q: it.q, m: it.m, otherUrl: fd[SHAPE_SLUG[other].link] || '', otherApproval: optName(SHAPE_SLUG[other].approval, fd[SHAPE_SLUG[other].approval]), name: fd.name || '' };
    if (!it.recipe) { toast('This version has no recipe (made before Ad Maker), so it cannot be rebuilt here. Start a new creative from a version instead.', 'err'); return; }
    var r; try { r = IxAdLayouts.recipe.parse(it.recipe); } catch (e) { toast('The recipe cannot be read: ' + e.message, 'err'); return; }
    S.screen = 'fix'; S.reading = true; render();
    IxAdLayouts.rebuild(r).then(function (out) {
      S.input = out.input; S.words = Object.assign({}, r.wording); S.base = Object.assign({}, r.wording);
      S.photo = out.input.photo ? Object.assign({}, out.input.photo, { nativeWidth: r.photo.nativeWidth }) : null; S.usePhoto = !!S.photo;
      S.logoUse = r.logo && r.logo.source === 'print' ? 'print' : 'file'; S.printLogoUrl = r.logo && r.logo.source === 'print' ? r.logo.url : '';
      if (S.logoUse === 'print' && out.input.logo) S.printLogo = { img: out.input.logo.main, transparent: true };
      var sr = { shape: it.shape, layout: r[it.shape].layout, crop: r[it.shape].crop, sizes: r[it.shape].sizes };
      var x = { sr: sr, sr0: JSON.parse(JSON.stringify(sr)), paint: out[it.shape] };
      S.ed = { B: it.shape === 'banner' ? [x] : [], S: it.shape === 'sidebar' ? [x] : [], sel: it.shape, b: 0, s: 0, head: r.headlineSlot || 'headline', head0: r.headlineSlot || 'headline', w0: Object.assign({}, r.wording) };
      S.fix.recipe = r; S.reading = false; render();
    }).catch(function (e) { S.reading = false; S.screen = 'start'; toast('The version could not be rebuilt: ' + e.message, 'err'); render(); });
  }
  function doFix() {
    var cfg = CFG(), c = cust(), sh = S.fix.shape, x = curShape(sh), pend = optId(SHAPE_SLUG[sh].approval, APPROVAL_WORDS.pending);
    if (!cfg.makeStudio) { toast('TA_CONFIG.makeStudio is missing.', 'err'); return; }
    if (!pend) { toast('The ADS collection has no "' + APPROVAL_WORDS.pending + '" choice on ' + SHAPE_SLUG[sh].approval + '.', 'err'); return; }
    S.screen = 'save'; S.saving = { steps: [], rows: [], done: false, err: '', fix: true }; render();
    var r = S.fix.recipe, media = {};
    r[sh] = { layout: x.sr.layout, crop: x.sr.crop, sizes: x.sr.sizes }; r.wording = Object.assign({}, S.words); r.headlineSlot = S.ed.head;
    layoutInput().then(function (input) { return run(step('Painting the ' + sh + ' at 2\u00d7', 'in the browser'), IxAdLayouts.paint(input, x.sr).then(function (p) { x.paint = p; })); })
      .then(function () { return run(step('Uploading', 'Uploadcare'), toBlob(x.paint.canvas).then(function (b) { return upload(b, fileName(c, sh, 1)); })).then(function (u) { media.up = u; }); })
      .then(function () { return run(step('Recording in MEDIA', 'Scenario B Route 4'), mediaRow(media.up, fileName(c, sh, 1))).then(function (id) { media.id = id; }); })
      .then(function () {
        var recipe = IxAdLayouts.recipe.stringify(r), body = { action: 'updateAd', titleSlug: cfg.titleSlug, adItemId: S.fix.adId, source: 'ta-admaker-v' + VERSION, fieldData: { reformatRecipe: recipe } };
        body.fieldData[sh === 'banner' ? 'bannerAdLink' : 'sidebarAdLink'] = media.up.cdnUrl;
        body.fieldData[sh === 'banner' ? 'bannerImageMediaId' : 'sidebarImageMediaId'] = media.id;
        body.fieldData[sh === 'banner' ? 'bannerImageSrc' : 'sidebarImageSrc'] = media.up.cdnUrl;
        body.fieldData[sh === 'banner' ? 'bannerApproval' : 'sidebarApproval'] = pend;
        return run(step('Replacing the ' + sh + ' on "' + S.fix.name + '", approval back to ' + APPROVAL_WORDS.pending, 'Scenario G \u00b7 updateAd'),
          fetchJson(cfg.makeStudio, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (res) {
            if (!res.ok || !res.j || res.j.ok !== true) throw new Error('Scenario G did not confirm the update.');
            var e = res.j.fieldData || {}, miss = [];
            if (String(e[SHAPE_SLUG[sh].link] || '') !== media.up.cdnUrl) miss.push(SHAPE_SLUG[sh].link);
            if (String(e[SHAPE_SLUG[sh].approval] || '') !== pend) miss.push(SHAPE_SLUG[sh].approval);
            if (String(e['reformat-recipe'] || '').trim() !== recipe.trim()) miss.push('reformat-recipe');
            if (miss.length) throw new Error('Webflow did not keep ' + miss.join(', ') + '. Does Scenario G have the updateAd route?');
            S.saving.rows.push({ name: S.fix.name, id: S.fix.adId, banner: sh === 'banner' ? media.up.cdnUrl : '', sidebar: sh === 'sidebar' ? media.up.cdnUrl : '' });
          }));
      })
      .then(function () { S.saving.done = true; render(); return loadAds(); }).then(function () { render(); })
      .catch(function (e) { S.saving.err = (e && e.message) || String(e); render(); });
  }

  // ══════════════════════════════════════════════════════════════
  //  Render, events, mount
  // ══════════════════════════════════════════════════════════════
  function toast(msg, kind) { if (window.IxToast && IxToast.show) { try { IxToast.show(msg, kind === 'err' ? 'err' : 'ok', kind === 'err' ? { sticky: true } : undefined); return; } catch (e) {} } log(kind || 'ok', msg); }
  function render() {
    // v2.0.2: every column keeps its scroll position across a re-render (a click on a sidebar draft used to jump the centre back to the top)
    var keep = {}; ['am-left', 'am-main', 'am-right'].forEach(function (k) { var el = document.querySelector('#' + MOUNT_ID + ' .am-col.' + k); keep[k] = el ? el.scrollTop : 0; });
    var v = { start: vStart, read: vRead, drafts: vMake, make: vMake, tune: vMake, fix: vTune, save: vSave }[S.screen] || vStart;
    if (S.screen === 'fix' && S.reading) { shell(colh(W.fixing) + '<div class="am-prog"><b>Rebuilding the version from its recipe</b><div class="bar"><i></i></div></div>', '<div class="am-msg"></div><div class="am-grow"></div>' + ghost('startCancel', W.cancel)); return; }
    v();
    Object.keys(keep).forEach(function (k) { var el = document.querySelector('#' + MOUNT_ID + ' .am-col.' + k); if (el && keep[k]) el.scrollTop = keep[k]; });
    if (S.screen === 'start' && S.src === 'drop' && !S.drop) wireDrop();
  }
  function wireDrop() {
    var z = document.getElementById('am-dropzone'), f = document.getElementById('am-file'); if (!z || !f) return;
    z.addEventListener('click', function (e) { if (e.target.closest('.am-revert')) return; f.click(); });
    f.addEventListener('change', function () { takeFile(f.files && f.files[0]); });
    z.addEventListener('dragover', function (e) { e.preventDefault(); z.classList.add('over'); });
    z.addEventListener('dragleave', function () { z.classList.remove('over'); });
    z.addEventListener('drop', function (e) { e.preventDefault(); z.classList.remove('over'); takeFile(e.dataTransfer.files && e.dataTransfer.files[0]); });
  }
  function startItem(it) {
    S.sel = it.id; S.custId = it.custId || ''; S.custPre = S.custId; S.shape = (it.shape === 'banner' || it.shape === 'sidebar') ? it.shape : ''; S.src = ''; S.drop = null; S.box = null; S.boxed = false; S.col = { main: '', accent: '' }; S.fromVersion = ''; S.err = '';
  }
  function go(screen) { S.screen = screen; render(); }
  function onClick(e) {
    var t = e.target.closest('[data-act],[data-na],[data-src],[data-ver],[data-step],[data-shape],[data-fw],[data-photo],[data-pair],[data-sug],[data-pk],[data-sl]');
    if (!t) return;
    var act = t.getAttribute('data-act');
    if (t.hasAttribute('data-na')) { var it = needsAll().all.filter(function (x) { return x.id === t.getAttribute('data-na'); })[0]; if (!it) return; if (it.kind === 'sent') { startItem(it); openFix(it); return; } startItem(it); render(); return; }
    if (t.hasAttribute('data-shape')) { S.shape = t.getAttribute('data-shape'); S.src = ''; S.drop = null; S.fromVersion = ''; render(); return; }
    if (t.hasAttribute('data-fw')) { var fw = itemById(+t.getAttribute('data-fw')); if (fw) setForward(fw); render(); return; }
    if (t.hasAttribute('data-src')) { S.src = t.getAttribute('data-src'); S.drop = null; S.box = null; S.boxed = false; S.fromVersion = ''; render(); return; }
    if (t.hasAttribute('data-ver')) { var v = versionsOf(S.custId).filter(function (x) { return x.id === t.getAttribute('data-ver'); })[0]; if (v) { S.src = 'version'; S.drop = null; loadVersion(v); } render(); return; }
    if (t.hasAttribute('data-step')) { var sn = +t.getAttribute('data-step'); go({ 1: 'start', 2: 'read', 3: 'make', 4: 'save' }[sn]); return; }
    if (t.hasAttribute('data-photo')) { S.usePhoto = t.getAttribute('data-photo') === '1'; render(); return; }
    if (t.hasAttribute('data-pair')) { S.fontPair = t.getAttribute('data-pair'); render(); return; }
    if (t.hasAttribute('data-sug')) { var h = t.getAttribute('data-sug'); if (!S.col.main) S.col.main = hex(h); else if (!S.col.accent) S.col.accent = hex(h); render(); return; }
    if (t.hasAttribute('data-pk')) { var p = t.getAttribute('data-pk').split(':'), arr = S.short[p[0]], i = +p[1], at = arr.indexOf(i); if (at > -1) arr.splice(at, 1); else arr.push(i); render(); return; }
    if (t.hasAttribute('data-sl')) { if (e.target.closest('label')) return; var q = t.getAttribute('data-sl').split(':'); S.ed.sel = q[0]; if (q[0] === 'banner') S.ed.b = +q[1]; else S.ed.s = +q[1]; render(); return; }
    if (!act) return;
    e.preventDefault();
    switch (act) {
      case 'newC': startItem({ id: 'new', custId: '' }); render(); break;
      case 'startCancel': S.sel = null; S.custId = ''; S.src = ''; S.drop = null; S.fix = null; S.screen = 'start'; render(); break;
      case 'custCancel': S.custId = S.custPre; S.changeCust = false; render(); break;
      case 'changeCust': S.changeCust = !S.changeCust; render(); break;
      case 'logoSwapOn': S.logoSwap = true; render(); if (S.ed) repaintAll(); break;
      case 'logoSwapOff': S.logoSwap = false; S.logoSwapKeep = false; render(); if (S.ed) repaintAll(); break;
      case 'colCancel': S.col[t.getAttribute('data-k')] = ''; render(); break;
      case 'srcCancel': S.src = ''; S.drop = null; S.box = null; S.fromVersion = ''; render(); break;
      case 'clients': var lk = document.querySelector('.w-tab-link[data-w-tab="Clients"]'); if (lk) lk.click(); break;
      case 'toRead':
        if (S.src === 'none') { startEmpty(); go('read'); break; }
        if (S.src === 'version') { startFromVersion(); break; }
        S.boxed = false; S.screen = 'read'; if (!needsBox()) { S.boxed = true; readAd(); } else render(); break;
      case 'readBox': S.boxed = true; readAd(); break;
      case 'wholePage': S.box = null; S.boxed = true; readAd(); break;
      case 'boxCancel': S.box = null; render(); break;
      case 'pagePrev': S.page = Math.max(1, S.page - 1); S.box = null; render(); break;
      case 'pageNext': S.page = Math.min(S.drop.pages, S.page + 1); S.box = null; render(); break;
      case 'readAgain': S.err = ''; readAd(); break;
      case 'back': go({ read: 'start', drafts: 'read', make: 'read', tune: 'read', save: 'make' }[S.screen] || 'start'); break;
      case 'wCancel': var k = t.getAttribute('data-k'); S.words[k] = S.base[k]; render(); break;
      case 'logoCancel': S.logoUse = 'file'; S.logoScope = 'version'; render(); if (S.ed) repaintAll(); break;
      case 'logoPrint': S.logoUse = 'print'; S.logoScope = 'version'; render(); if (S.ed) repaintAll(); break;
      case 'readCancel': SLOTS.forEach(function (sl) { S.words[sl[0]] = S.base[sl[0]]; }); render(); break;
      case 'draftsCancel': S.short = { banner: [], sidebar: [] }; render(); break;
      case 'toSave': S.saving = null; go('save'); break;
      case 'toDrafts': S.screen = 'make'; S.ed = null; render(); makeDrafts().then(function () { if (S.screen === 'make') { if (S.drafts) initMake(); render(); } }); break;
      case 'toTune': go('make'); break;
      case 'tuneCancel': if (S.screen === 'fix') { S.screen = 'start'; S.sel = null; S.fix = null; render(); } else { S.ed.B.concat(S.ed.S).forEach(function (x) { x.sr = JSON.parse(JSON.stringify(x.sr0)); }); S.words = JSON.parse(JSON.stringify(S.ed.w0)); S.ed.head = S.ed.head0; repaintAll(); render(); } break;
      case 'keep': { var kx = forward(); if (kx) { kx.kept = !kx.kept; syncSavePick(); } render(); } break;
      case 'unkeep': { var ux = itemById(+t.getAttribute('data-id')); if (ux) { ux.kept = false; syncSavePick(); } render(); } break;
      case 'putBack': setForward(null); render(); break;
      case 'fontPick': each(function (x) { var kf = styleKey(x, S.ed.piece), pf = pieceOf(x.sr, kf), fv = t.getAttribute('data-v'); if (fv) { pf.font = fv; var pr = FONT_PAIRS.filter(function (q) { return q.head === fv; })[0]; if (pr && kf === 'headline') pf.weight = pr.headWeight; else delete pf.weight; IxAdLayouts.ensureFont(fv); } else { delete pf.font; delete pf.weight; } x._fontRetry = false; tidy(x.sr, kf); }); render(); break;
      case 'cloneItem': { var co = forward(); if (!co) break; var cc = { id: S.ed.next++, sr: JSON.parse(JSON.stringify(co.sr)), sr0: JSON.parse(JSON.stringify(co.sr)), paint: co.paint, label: (co.label || '').replace(/ \u00b7 clone.*$/, '') + ' \u00b7 clone', kept: false };
        (S.ed.sel === 'banner' ? S.ed.B : S.ed.S).push(cc); setForward(cc); syncSavePick(); render(); } break;
      case 'variation': { var cv0 = forward(); if (!cv0) break;
        var pal = swatchList().map(function (q) { return q[0]; }).filter(function (h) { return h !== hex(cv0.sr.bg || ''); }).slice(0, 3);
        var arr = S.ed.sel === 'banner' ? S.ed.B : S.ed.S, keepers = arr.filter(function (y) { return y.kept || y === cv0; });
        var vs = pal.map(function (h) { var sr = JSON.parse(JSON.stringify(cv0.sr)); sr.bg = h; return { id: S.ed.next++, sr: sr, sr0: JSON.parse(JSON.stringify(sr)), paint: cv0.paint, label: colourWord(h) + ' \u00b7 variation of ' + (cv0.label || '').split(' \u00b7 ')[0], kept: false }; });
        arr.length = 0; keepers.concat(vs).forEach(function (y) { arr.push(y); }); setForward(cv0); syncSavePick();
        layoutInput().then(function (input) { S.input = input; return Promise.all(vs.map(function (y) { return IxAdLayouts.paint(input, y.sr).then(function (p) { y.paint = p; }); })); }).then(function () { render(); }).catch(function (er) { toast(er.message, 'err'); });
        render(); } break;
      case 'bgCount': each(function (x) { if (t.getAttribute('data-v') === '2') { if (!x.sr.bg2) x.sr.bg2 = { color: hex(colours().accent) || hex(colours().main) || '#333333', w: 0.35, side: 'right' }; } else delete x.sr.bg2; }); render(); break;
      case 'bg2Colour': each(function (x) { if (!x.sr.bg2) x.sr.bg2 = { w: 0.35, side: 'right' }; x.sr.bg2.color = hex(t.getAttribute('data-v')); }); render(); break;
      case 'bg2Side': each(function (x) { if (x.sr.bg2) x.sr.bg2.side = t.getAttribute('data-v'); }); render(); break;
      case 'layoutBack': each(function (x) { x.sr.layout = x.sr0.layout; x.sr.crop = x.sr0.crop ? JSON.parse(JSON.stringify(x.sr0.crop)) : null; }); render(); break;
      case 'fCancel': var fk = t.getAttribute('data-k'); S.words[fk] = S.ed.w0[fk]; repaintAll(); render(); break;
      case 'headCancel': S.ed.head = S.ed.head0; repaintAll(); render(); break;
      case 'cropCancel': each(function (x) { if (x.sr.crop && x.sr0.crop) x.sr.crop = JSON.parse(JSON.stringify(x.sr0.crop)); }); render(); break;
      case 'pickPiece': S.ed.piece = t.getAttribute('data-v'); render(); break;
      case 'logoVariant': each(function (x) { var pv2 = pieceOf(x.sr, 'logo'), vv = t.getAttribute('data-v'); if (vv) pv2.variant = vv; else delete pv2.variant; tidy(x.sr, 'logo'); }); render(); break;
      case 'nudge': each(function (x) { var kn = styleKey(x, S.ed.piece), pn = pieceOf(x.sr, kn); pn.dy = (+pn.dy || 0) + (+t.getAttribute('data-v')) * IxAdLayouts.CONST.NUDGE_STEP; tidy(x.sr, kn); }); render(); break;
      case 'pieceColour': case 'pieceFill': each(function (x) { var kp = styleKey(x, S.ed.piece), pp = pieceOf(x.sr, kp); pp[act === 'pieceFill' ? 'fill' : 'color'] = hex(t.getAttribute('data-v')); tidy(x.sr, kp); }); render(); break;
      case 'pieceClear': each(function (x) { var kq = styleKey(x, S.ed.piece), pq = pieceOf(x.sr, kq); delete pq[t.getAttribute('data-k')]; tidy(x.sr, kq); }); render(); break;
      case 'pieceCancel': each(function (x) { var kr = t.getAttribute('data-k'); if (x.sr.style) delete x.sr.style[kr]; if (x.sr0.style && x.sr0.style[kr]) { x.sr.style = x.sr.style || {}; x.sr.style[kr] = JSON.parse(JSON.stringify(x.sr0.style[kr])); } x.sr.sizes[kr] = x.sr0.sizes[kr] != null ? x.sr0.sizes[kr] : 1; tidy(x.sr, kr); }); render(); break;
      case 'bgPick': each(function (x) { var bv = t.getAttribute('data-v'); if (bv === 'custom') x.sr.bg = hex(colours().main) || '#333333'; else if (bv) x.sr.bg = bv; else delete x.sr.bg; }); render(); break;
      case 'bgColour': each(function (x) { x.sr.bg = hex(t.getAttribute('data-v')); }); render(); break;
      case 'platePick': each(function (x) { var pv = t.getAttribute('data-v'); if (pv === 'auto') delete x.sr.plate; else x.sr.plate = pv === 'on'; }); render(); break;
      case 'layoutCancel': each(function (x) { if (x.sr0.bg) x.sr.bg = x.sr0.bg; else delete x.sr.bg; if (x.sr0.bg2) x.sr.bg2 = JSON.parse(JSON.stringify(x.sr0.bg2)); else delete x.sr.bg2; if (typeof x.sr0.plate === 'boolean') x.sr.plate = x.sr0.plate; else delete x.sr.plate; }); render(); break;
      case 'approveRow': approveRow(+t.getAttribute('data-i')); break;
      case 'szCancel': each(function (x) { x.sr.sizes[t.getAttribute('data-k')] = 1; }); render(); break;
      case 'doSave': doSave(); break;
      case 'doFix': doFix(); break;
      case 'again': reset(); render(); loadNeeds().then(render); loadAds().then(render); break;
    }
  }
  function startEmpty() { S.read = null; S.words = {}; S.base = {}; S.from = {}; var c0 = cust() || {}; SLOTS.forEach(function (s) { S.words[s[0]] = ''; S.base[s[0]] = ''; S.from[s[0]] = 'Type it'; });
    if (c0.website) { S.words.website = c0.website; S.base.website = c0.website; S.from.website = 'From the customer'; }
    if (c0.phone) { S.words.phone = c0.phone; S.base.phone = c0.phone; S.from.phone = 'From the customer'; } S.photo = null; S.printLogo = null; S.srcCanvas = null; S.logoUse = 'file'; S.err = ''; var c = cust(); S.fontPair = (fontOf(c.fontHead) && fontOf(c.fontBody)) ? '' : FONT_PAIRS[0].id; }
  function startFromVersion() {
    var v = versionsOf(S.custId).filter(function (x) { return x.id === S.fromVersion; })[0]; if (!v) return;
    if (S.verRecipe) {
      var r = S.verRecipe; S.screen = 'read'; S.reading = true; render();
      IxAdLayouts.rebuild(r).then(function (out) {
        S.read = { read: { method: 'recipe', note: 'Wording, logo and photo from the saved recipe of ' + v.name + '.' }, warnings: [] };
        S.words = Object.assign({}, r.wording); S.base = Object.assign({}, r.wording); S.from = {}; SLOTS.forEach(function (s) { S.from[s[0]] = 'From the version'; });
        S.photo = out.input.photo ? Object.assign({}, out.input.photo) : null; S.usePhoto = !!S.photo; S.srcCanvas = null; S.verImg = out.banner ? out.banner.canvas : (out.sidebar ? out.sidebar.canvas : null);
        S.printLogo = (r.logo && r.logo.source === 'print' && out.input.logo) ? { img: out.input.logo.main, transparent: true } : null; S.printLogoUrl = S.printLogo ? r.logo.url : '';
        S.logoUse = S.printLogo ? 'print' : 'file'; S.reading = false; render();
      }).catch(function (e) { S.reading = false; S.err = 'The version could not be rebuilt: ' + e.message; render(); });
    } else {
      // no recipe: read the banner picture through the Worker, as a dropped picture
      S.screen = 'read'; S.reading = true; render();
      loadImg(v.banner || v.sidebar).then(function (img) { if (!img) throw new Error('The version\u2019s picture could not be loaded.'); S.drop = { name: v.name, img: img }; S.box = null; S.boxed = true; readAd(); }).catch(function (e) { S.reading = false; S.err = e.message; render(); });
    }
  }
  function onInput(e) {
    var t = e.target;
    if (t.matches('[data-w]')) { var wk = t.getAttribute('data-w'); S.words[wk] = t.value; var line = t.closest('.am-wline'); if (line) { var ch = t.value !== S.base[wk]; t.classList.toggle('am-dirty', ch); var cn = line.querySelector('[data-cnt]'); if (cn) cn.textContent = t.value ? t.value.length + ' chars' : ''; } return; }
    if (t.matches('[data-col]')) { S.col[t.getAttribute('data-col')] = t.value; var d = t.parentNode.querySelector('.dot'); if (d && hex(t.value)) d.style.setProperty('background', hex(t.value), 'important'); t.classList.toggle('am-dirty', !!t.value); return; }
    if (t.matches('[data-f]')) { S.words[t.getAttribute('data-f')] = t.value; t.classList.add('am-dirty'); repaintAll(); return; }
    if (t.matches('[data-sz]')) { each(function (x) { x.sr.sizes[t.getAttribute('data-sz')] = +t.value; }); var v = t.parentNode.querySelector('.v'); if (v) v.textContent = Math.round(t.value * 100) + '%'; return; }
    if (t.matches('[data-st]')) {
      var what = t.getAttribute('data-st'), val = t.value;
      if (what === 'palAdd' || what === 'palPick') { if (what === 'palPick') { var pa = t.parentNode.querySelector('[data-st="palAdd"]'); if (pa) pa.value = val; } return; }
      if (what === 'bg2w') { each(function (x) { if (x.sr.bg2) x.sr.bg2.w = clamp(+val, 0.05, 0.8); }); var v2 = t.parentNode.querySelector('.v'); if (v2) v2.textContent = Math.round(val * 100) + '%'; return; }
      var mirror = function (sel, v) { var o = t.parentNode.querySelector('[data-st="' + sel + '"]'); if (o && v) o.value = v; };
      each(function (x) {
        var kk = styleKey(x, S.ed.piece), p = pieceOf(x.sr, kk);
        if (what === 'font') { p.font = val.trim(); x._fontRetry = false; if (p.font) IxAdLayouts.ensureFont(p.font); }
        else if (what === 'size') { x.sr.sizes[kk] = clamp((+val || 100) / 100, IxAdLayouts.CONST.SIZE_FREE_MIN, IxAdLayouts.CONST.SIZE_FREE_MAX); }
        else if (what === 'color' || what === 'fill') { if (hex(val) || !val) p[what] = hex(val); }
        else if (what === 'colorPick' || what === 'fillPick') { p[what === 'colorPick' ? 'color' : 'fill'] = hex(val); }
        else if (what === 'bg' || what === 'bgPick') { if (hex(val)) x.sr.bg = hex(val); }
        else if (what === 'bg2' || what === 'bg2Pick') { if (hex(val)) { if (!x.sr.bg2) x.sr.bg2 = { w: 0.35, side: 'right' }; x.sr.bg2.color = hex(val); } }
        tidy(x.sr, kk);
      });
      if (what === 'color' || what === 'fill') mirror(what + 'Pick', hex(val)); if (what === 'colorPick' || what === 'fillPick') mirror(what.replace('Pick', ''), hex(val));
      if (what === 'bg') mirror('bgPick', hex(val)); if (what === 'bgPick') mirror('bg', hex(val)); if (what === 'bg2') mirror('bg2Pick', hex(val)); if (what === 'bg2Pick') mirror('bg2', hex(val));
      return;
    }
    if (t.id === 'am-zoom') { each(function (x) { if (x.sr.crop && x.sr.crop.mode !== 'whole') x.sr.crop.zoom = +t.value; }); var vz = t.parentNode.querySelector('.v'); if (vz) vz.textContent = (+t.value).toFixed(2) + '\u00d7'; return; }
  }
  function onChange(e) {
    var t = e.target;
    if (t.id === 'am-cust') { S.custId = t.value; S.src = ''; S.changeCust = false; S.col = { main: '', accent: '' }; S.logoNewUrl = ''; S.logoNewImg = null; S.logoSwap = false; S.logoSwapKeep = false; render(); return; }
    if (t.id === 'am-head') { S.ed.head = t.value; repaintAll(); render(); return; }
    if (t.id === 'am-layout') { var code = t.value, Lc = IxAdLayouts.LAYOUTS[code]; each(function (x) { if (cardShape(x) !== Lc.shape) return; x.sr.layout = code; if (Lc.usesPhoto) { var src = (S.drafts[Lc.shape] || []).filter(function (d) { return d.sr.layout === code; })[0]; x.sr.crop = x.sr.crop && x.sr.crop.mode !== 'whole' ? x.sr.crop : (src ? JSON.parse(JSON.stringify(src.sr.crop)) : null); } else x.sr.crop = null; }); render(); return; }
    if (t.matches('[data-st="palAdd"]')) { var ph = hex(t.value); if (ph && S.ed.palette.indexOf(ph) < 0) S.ed.palette.push(ph); render(); return; }
    if (t.id === 'am-logokeep') { S.logoKeep = t.checked; return; }
    if (t.id === 'am-fontkeep') { S.fontKeep = t.checked; return; }
    if (t.id === 'am-logoswapkeep') { S.logoSwapKeep = t.checked; return; }
    if (t.matches('[data-st]')) {
      var wc = t.getAttribute('data-st');
      if (wc === 'font') { onInput(e); return; }
      if (wc !== 'weight' && wc !== 'show') return;
      each(function (x) { var kc = styleKey(x, S.ed.piece), pc2 = pieceOf(x.sr, kc); if (wc === 'weight') pc2.weight = +t.value || 0; else pc2.show = t.checked ? true : false; tidy(x.sr, kc); }); render(); return;
    }
    if (t.matches('[data-col]')) { S.col[t.getAttribute('data-col')] = hex(t.value); render(); return; }
    if (t.matches('[data-logonew]')) { var u = t.value.trim(); S.logoNewUrl = /^https?:\/\//i.test(u) ? u : ''; S.logoNewImg = null; if (!S.logoNewUrl && u) toast('Paste a full link, starting https://', 'err'); render();
      if (S.logoNewUrl) loadImg(S.logoNewUrl).then(function (img) { if (!img) { toast('That link did not load as an image.', 'err'); S.logoNewUrl = ''; } else S.logoNewImg = img; render(); if (S.ed) repaintAll(); }); return; }
    if (t.matches('[data-w],[data-f],[data-sz]')) { render(); return; }
    if (t.matches('[data-save]')) { var p = t.getAttribute('data-save').split(':'), arr = S.savePick[p[0]], i = +p[1], at = arr.indexOf(i);
      if (t.checked && at < 0) { if (arr.length >= MAX_SAVE) { t.checked = false; toast('Up to ' + MAX_SAVE + ' ' + p[0] + 's per save.', 'err'); return; } arr.push(i); } else if (!t.checked && at > -1) arr.splice(at, 1); render(); return; }
  }

  var mounted = false;
  function mount() {
    var panel = document.querySelector(PANEL); if (!panel) { log('no Ad Maker panel yet'); return false; }
    var m = document.getElementById(MOUNT_ID); if (!m) { m = document.createElement('div'); m.id = MOUNT_ID; panel.innerHTML = ''; panel.appendChild(m); }
    if (mounted) return true;
    mounted = true;
    var miss = [];
    if (!window.IxAdLayouts) miss.push('ix-ad-layouts');
    try { IxAdLayouts.shapes(); } catch (e) { miss.push(e.message); }
    readCustomers();
    m.addEventListener('click', onClick); m.addEventListener('input', onInput); m.addEventListener('change', onChange);
    window.addEventListener('mousemove', dragMove); window.addEventListener('mouseup', dragEnd);
    if (miss.length) { m.innerHTML = '<div class="am"><div class="am-head"><h2>' + W.title + '</h2>' + badge() + '</div><div class="am-body"><div class="am-err">' + esc(miss.join(' ')) + '</div></div></div>'; return true; }
    render();
    Promise.all([loadNeeds(), loadAds()]).then(function () { render(); });
    log('mounted');
    return true;
  }
  window.addEventListener('std:panel:admaker', function () { setTimeout(mount, 0); });
  window.TaAdMaker = { mount: mount, VERSION: VERSION, _state: function () { return S; } };
  log('loaded, listening for std:panel:admaker');
})();
