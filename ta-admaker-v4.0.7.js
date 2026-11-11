/* ta-admaker-v4.0.7.js
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
   ── v4.0.7 (11 Nov 2026, S8) ── MAGIC RESIZE IN TWO STEPS, AND CLEAN UP (Jeff's rulings)
   · Needs ix-ad-layouts v2.4.0 and, for AI fill, fluxgen v1.1.0 (TA_CONFIG.fluxGen, default
     https://fluxgen.jeff-2cd.workers.dev/).
   · The print words are cleared from the ad's own picture before anything is cut from it: on a box or plain
     ground each line is painted over with the colour round it (inside its box if it sits in one), and a box
     on plain ground is painted over too. Clearing never paints inside a picture. So the box is a real shape in its own colour, its words are live
     type, and nothing is doubled or left behind when either moves. Words on a photo or inside a logo stay
     in the picture: they are not drawn again as live type, and "Clear from picture" paints them out.
   · A box's lines belong to it: they move with it, and sit on its colour (on the ad's ground once the box
     is removed). Words wrap and shrink; they are never cut short with an ellipsis.
   · Fine-tune for a Magic resize concept runs in steps: 1 Remove (the background, then what the reader
     rebuilt, grouped by box and picture; strike what you don't want, down to a plain white ad; nothing is
     added), 2 Add back (bring back what you removed, a
     box in any colour from the ad, any line the reader found, the customer's logo file and contact details;
     a line goes into the box selected on the ad), 3 Fine-tune (the usual tools). Move between them freely.
   · Pink suggestions at step 1: a busy box gets one "Remove its N lines?" (the box stays); a logo cut from
     print gets "Remove?" when the customer record has a logo file; a long loose block gets "Remove?".
     "Larger?" waits for step 3.
   · CLEAN UP on any picture (the toolbar's Clean up, or Clear from picture): select with a brush, a box or
     by colour, zoom to 800% (buttons, or ⌘/Ctrl + wheel), then fill the selection from around, with a
     colour (picker or eyedropper) or by AI fill (FLUX.1 Fill through fluxgen). Undo inside; "cancel" leaves
     the picture as it was. On a Magic resize concept it cleans the ad's own picture, so every piece cut
     from it changes; on a photo it makes a cleaned copy beside the original.
   HARDCODING: HC-P-SSB8-14 (clearing print words), HC-P-SSB8-15 (where Add back puts new parts),
     HC-P-SSB8-16 (Clean up zoom, AI size cap, colour tolerance, area cap, undo depth), HC-P-SSB8-17 (the
     fluxgen URL fallback).
   ── v4.0.6 (11 Nov 2026, S8) ── MAGIC RESIZE (Jeff's ruling: "go straight to building it")
   · Pick's first concept is "Magic resize": the first source ad rebuilt in the new shape from its own
     elements, as read by ix-adreformat v1.4.0 (where each block of words, panel and picture sits, with its
     colours and type). Pictures are the ad's own pixels; words are live type, so they stay crisp and
     editable. Needs ix-ad-layouts v2.3.0 (layouts MG / MH).
   · In Fine-tune every element is clickable: move, resize, hide, bring back, recolour (words and panels),
     corners and Improve (pictures). Improve on a picture sharpens the whole source once, so every picture
     cut from it gets sharper.
   · Pink suggestions: a block of many words gets "Remove?"; words too small for a screen get "Larger?".
     Yes or No on each; nothing changes until you say yes.
   · Elements lists the ad's own elements; under it, "Add a line" offers every line the reader found (all
     the lines from a busy box, separately) to put back as a new line you can place.
   · Save uploads the source picture once for magic concepts so the recipe can rebuild them.
   HARDCODING: HC-P-SSB8-13 SUGGEST_WORDS 14 (a block longer than this is offered for removal), SUGGEST_PX 11
     (words drawn smaller than this are offered larger), the 1.5x "Larger" step.
   ── v4.0.5 (11 Nov 2026, S8) ── ASK FOR A CONCEPT (typed or spoken)
   · Pick has "Ask for a concept": type, or press the microphone and say, what you want ("keep her photo
     and the logo, drop the green box, use just one line from it"). Claude (through the platform's Anthropic
     proxy, TA_CONFIG.anthropicProxy) sees the first source ad and the pool and answers with up to three
     concepts as recipes. Each is checked before it is painted: colours only from the pool (plus white and
     black), fonts only from the list, wording only from words already in the pool (lines may be shortened
     or one sentence picked; nothing new is written), layouts only from the engine's own. New concepts
     appear first and are marked "Asked".
   · "Change this one" on any concept sends that concept with your request; the changed version is added
     beside it, the original stays.
   · ⓘ beside the box gives phrasing that works.
   · A concept may carry its own wording (e.g. one line kept from a busy box). Fine-tune's Wording shows and
     edits that concept's words; Save writes them into its recipe.
   · Fix: repainting every concept (a wording edit, Improve) now paints each with its own picture and words;
     v4.0.3 painted them all with the one in front.
   HARDCODING: HC-P-SSB8-11 ASK_MODEL 'claude-sonnet-4-5' (as ta-rte), ASK_MAX 3 concepts, the hint lines.
   ── v4.0.4 (11 Nov 2026, S8) ── PICTURES KEEP THEIR SHAPE
   · A cut piece shown in the Pictures tiles (Read and Fine-tune) keeps the shape it was cut in: the tile
     fits the whole picture inside it instead of stretching it to the tile. The piece saved to MEDIA was
     already the exact cut (no change there).
   ── v4.0.3 (11 Nov 2026, S8) ── CONCEPTS PER PICTURE, ELEMENTS, CORNERS, IMPROVE (Jeff's rulings)
   · "Directions" are now "concepts" everywhere.
   · Read: the pool's pictures are larger and tickable; one is ticked to start (the photo found, or the
     piece you marked last). Pick makes concepts for every ticked picture (the as-is concept once).
   · Pick watches its inputs (the ticked pictures, the wording, the sources): if they changed since the
     concepts were made, "Show the concepts" makes them again; any you kept stay, the rest are replaced.
   · Each concept keeps its own picture through Fine-tune and Save. Choosing another picture in
     Fine-tune's Picture group repaints the ad straight away.
   · Elements (was Layers) opens and closes like the other groups, in smaller type, with a divider and
     "The whole ad" heading above the groups. Wording keeps only the words (show or hide is in Elements);
     Colours keeps only the background (a piece's colour is in its toolbar).
   · A box made wider or taller keeps the size you dragged it to (the outline is the box, not the ink).
   · Photo and logo toolbars: corners Square · Rounded · Round (ix-ad-layouts v2.2.3, style.photo/logo.corner);
     Improve sends just that picture to the upscale Worker (submit/poll) and swaps the sharper one in,
     with Before / After; it is used in this job, and saved with the ad.
   · The customer's email is read from data-email (then data-business-email, data-contact-email).
   HARDCODING: HC-P-SSB8-10 IMPROVE_SCALE 2 and the 1.5 s poll, 3 min cap (as ta-converter HC-UPS-015).
   ── v4.0.2 (11 Nov 2026, S8) ── FROM TEST 4
   · Mark the photo (and the box on a PDF page or screenshot) shows the whole picture inside the screen,
     whatever its shape, so a box can be drawn round any part of it. No more cropped, scrolled picture.
   · The floating toolbar sits under the ad, never over it.
   · A worded piece's box can be made wider (right-edge handle) or taller (bottom-edge handle) so a line
     that wrapped gets room; the corner handle still scales the size. Kept inside the ad (ix-ad-layouts
     v2.2.2, sr.style[piece].dw / dh).
   · Fine-tune stays responsive: paints are coalesced (one at a time, the latest wins), a drag ends if the
     pointer leaves the window, and nothing is left half-dragged.
   ── v4.0.1 (11 Nov 2026, S8) ── THE CONTACT CHECK WRITES WHAT SCENARIO 114 READS
   · Checked against 114's blueprint (v1.5): it takes fieldData.phone → business-phone, fieldData.website →
     contact-website, fieldData.email → business-email. v4.0.0 sent other names, which 114 would have
     dropped (and Save would have stopped). The record's email is read from data-business-email.
   ── v4.0.0 (11 Nov 2026, S8) ── FLOW v6, PART 1: ONE POOL ON READ, CANVA-STYLE FINE-TUNE (canvas "Flow v6", ruled)
   · Read: no type to pick and no roles. Each source shows at its own proportions with the shape stated as
     a fact ("Tall, about 4 : 5 · the shape of a print ad"). The right column is the pool, label beside
     value with a hairline between rows: The look (colours sampled from the ads, the pictures found, Mark
     the photo) and The words (every line, every source's version). Read splits 55 / 45.
   · Contact check on Read: each phone number, website and email found is compared with the customer
     record; a mismatch offers "Use in the ad and update the customer" (written through Scenario 114 on
     Save, checked) or "Use in the ad only".
   · Fine-tune works on the ad itself: click a piece to select it; drag to move it; drag the corner handle
     to resize it; it snaps to the ad's centre, the 12 px safe margin and the other pieces' edges, with a
     guide line; nothing can be moved or sized off the ad. Arrow keys move 2 px (Shift 10 px); Delete hides;
     Esc lets go; ⌘Z / ⇧⌘Z undo and redo. A toolbar floats by the selected piece with only what fits it
     (font, size, colour for words; size and plate for the logo; zoom and fit for the photo; Hide, Reset).
   · The tools column: Undo / Redo / Reset all, Layers (every piece, select, show or hide, reset), then the
     whole-ad groups (Wording, Background and colours, Panels, Picture, Spacing, Borders and corners). The
     photo found in the sources is swapped in the Picture group.
   · Pasted screenshots are named "Screenshot pasted 9:17 am"; the tray card's picture is kept as a still
     copy so it always shows. The large Read picture keeps its proportions at every width.
   Part 2 (next): the read Worker returns where each piece sits and its colours and fonts; Pick's directions
   are then built only from the pool, the first being the source re-fitted. Part 3: Clean up (inpainting).
   HARDCODING: HC-P-SSB8-8 SNAP_PX 6 and SAFE_PX 12 (display/design px); HC-P-SSB8-9 the toolbar's offset.
   ── v3.1.1 (10 Nov 2026, S8) ── FROM TEST 3
   · A picked tile shows its tick (the page painted the tick box white). The tray is taller and shows each
     source as a picture; a paste or a dropped file says so (toast) and its tray card flashes.
   · Each source on Read has a role: Design (the directions are modelled on it), Words and pieces (its
     wording and pieces are offered, its look is not used), or Leave out (ignored). The first source is
     Design until you choose; the others are Words and pieces. Each tab also says what the source is,
     judged from its own proportions, and it is never forced into the shape being made.
   · Read and Fine-tune split the panel 60 / 40; the right-hand column's type is 2 px smaller throughout.
   · The click target over each piece is the box it was drawn in (ix-ad-layouts v2.2.0), so the logo's
     outline matches the logo at any size. Position has ← → as well as ↑ ↓ (sr.style[piece].dx).
   ── v3.1.0 (10 Nov 2026, S8) ── FROM WHAT: DESIGN A, SEVERAL SOURCES (Jeff's rulings)
   · From what is five chips (Print issue, Saved ads, Saved pieces, Upload or paste, Scratch), each with
     its count and an ⓘ that says what it is. The chip in front opens one fixed-height strip of same-size
     tiles that scrolls sideways (Upload or paste opens the drop/paste zone). Everything picked, from any
     chip, collects in the tray below with a × to drop it. Pick as many sources as you like.
   · Read shows every source, one tab each: the source in full and what was found in it. Nothing wins on
     Read. Each tab reads when it is first opened (a PDF page or screenshot asks for its box then).
     "Use this design" on a tab marks the source the directions are modelled on (the first one until
     you choose); the others still feed in.
   · What every read found is pooled: every photo and piece goes into one tray; where sources give a
     line different words, Fine-tune's Wording offers each version ("From: …") beside the field.
   · The shared panel is a tick list: which pieces sit on it (Jeff ruled 2: yes). Needs ix-ad-layouts
     v2.1.0 (sr.shared.slots).
   HARDCODING: HC-P-SSB8-7 SRC_CHIPS, the five chip names and their ⓘ descriptions.
   ── v3.0.1 (10 Nov 2026, S8) ── FROM TEST 2 AND JEFF'S NOTES A, B, D, F, G
   · A: the customer line above the steps is gone; the tab names the job.
   · B: a job's note (the slot note, the send-back words) shows on Start under Who.
   · D: "The drafts will use" shows only what the customer record holds. With no fonts on the record it
     says so: the directions use the platform pair and Fine-tune sets a font for each piece. No pair picker.
   · F: once a job is open the Working on column folds to a narrow tab (with the job count); click it to
     open the list again; picking a job folds it.
   · G: Fine-tune's tools column is wider (400 px) with smaller type; the stage has less padding.
   · Test 2, step 7: the T-A page's own .open class drew a dashed arc and pushed the open group to the
     right; the group now uses am-accopen. Every wording line has a Show tick: off hides it on this ad,
     on adds a line the layout does not carry (at the layout's spot for it).
   · Test 2, step 9: "Make the sidebar next" now opens Start with the sidebar picked and a note: it is
     made from the banner just saved; the wording, photo and logo carry over, and Read shows that banner.
   ── v3.0.0 (9 Nov 2026, S8) ── FIVE STEPS: START · READ · PICK · FINE-TUNE · SAVE (canvas "Flow v5", ruled)
   · Start: a shape must be picked every time (a job no longer pre-picks one); "The drafts will use"
     is back on Start, where the default font pair is chosen.
   · Read: the ad as it is, large; beside it "What we found": the wording as read, the logo, the photo
     found (with Mark the photo) and Read as. Nothing else to set.
   · Pick: a few directions that differ in kind, large, each with "Keep as it is" and "Fine-tune this".
     Same type: the ad as it is (with a band); photo with words; photo behind on one white panel;
     words and logo on the accent with a frame; the headline on its own panel. A source with no photo
     gets the worded directions only.
   · Fine-tune: the one ad at full size and one tools column, one group open at a time, in this order:
     Wording, Colours (background and every worded piece), Type (font and size for every worded piece),
     Spacing and alignment, Picture (crop, arrangement, behind with a strength), Panels (per piece and
     one shared panel), Logo, Borders and corners. A changed group shows a gold dot and a cancel link.
     Clicking a piece on the stage still opens that piece's own tools.
   · Save: every kept ad at full size before Save; afterwards "Make the <other shape> next" keeps the
     customer, the source and the read.
   Needs ix-ad-layouts v2.0.0.
   HARDCODING: HC-P-SSB8-5 the direction set (which layouts make the directions, and their settings) in
     directionsFor(); HC-P-SSB8-6 the shared panel and photo-behind defaults (white panel, strength 0.75),
     a border of 3 px for the framed direction.
   ── v2.8.4 (9 Nov 2026, S8) ── READ SHOWS WHAT WAS FOUND; MAKE EDITS THE WORDING
   · Jeff: Read had become a pre-Make edit screen. Read now shows each wording line as read, with
     where it came from, and nothing to type into. Picking the photo, Mark the photo, Read as and the
     starting font pair stay on Read (they are about reading the ad and the customer's record).
   · Make's Wording group carries every line (all nine), each with a gold border while changed and a
     cancel link back to the wording Make opened with. An edit there changes every proposal; a
     piece clicked on the stage still edits that proposal only. The headline chooser is now
     "Leads the ad" (which line the layouts treat as the headline).
   · A line changed on Make shows "Edited on Make" when you go back to Read.
   ── v2.8.3 (9 Nov 2026, S8) ── THE SHAPE STAYS CHANGEABLE; START TIDIED
   · Jeff, Test 1: going back to Start and picking Banner after Sidebar seemed locked. Picking a shape
     wiped the source choice, so Read the ad greyed out. Now a shape change keeps the source, the read
     wording and everything found; only the proposals are remade in the new shape. When proposals are
     already kept, it asks first: "Change to banner? Your N kept sidebars will be dropped."
   · The job line (customer · making a … · starting from …) sits above the step strip, on every step.
   · Read the ad, pressed again with the same customer and source, goes straight back to Read: no
     second read, so wording edits and marked pieces stay.
   · Start has no "The drafts will use" column (nothing to decide there yet).
   · Step numbers and the Who / Which shape / From what headings, and the Read labels, take a clay
     accent (#B5651D) so they stand apart from the filled-in values. Gold stays unsaved, blue selected.
   HARDCODING: none new (the clay is a design value in the CSS).
   ── v2.8.2 (9 Nov 2026, S8) ── A NOTE JOB BRINGS ITS CUSTOMER
   · Jeff: picking a job from the list must not ask for the customer. A slot note ("SENIOR CARE
     AUTHORITY", "GRAZE CRAZE!") is matched to a customer: the same name first (case, spaces and
     punctuation ignored), then the one customer whose name starts with the note's words ("Senior Care
     Authority - Northern & Central New Jersey"). Only a single match is taken; two or more, or none,
     and Start asks as before.
   ── v2.8.1 (8 Nov 2026, S8) ── FIXES FROM TEST 1 ON SENIOR CARE AUTHORITY
   · The source ad IS the whole-ad picture. v2.7.1 took it only from a read piece covering 80 % of the
     ad; the read of the SCA banner returned none, so "The ad · Read as" never showed and no as-is
     proposal could be made. Now, with no such piece, the source picture itself is the whole ad.
   · Job cards and group heads use prefixed kind classes (am-k-sent, am-k-needed, am-k-note): the T-A
     page has its own .note class, which centred the Note only head, hid its count and marked the card.
   · Group heads and their wrapper sit on the column's ground (the page painted them white).
   · The job line drops a part that only repeats the customer's name (a note reading the name, a
     version named after the customer).
   · Text links (Mark the photo, Change customer) keep Ad Maker's own type; the page's link style made
     them large serif.
   ── v2.8.0 (8 Nov 2026, S8) ── THE FRAME: JOB LIST BESIDE ONE JOB PANEL, OPEN JOBS AS TABS
   Built to the canvas artboard "Frame v3" (Jeff: "excellent"; tabs as drawn; ask before closing unsaved).
   · Working on is the left column on its own warm surface, its head level with the job panel's top:
     "+ New ad" in the head, then every job (Sent back, Ad needed, Note only). An open job's card says
     "Open · <step>", with a gold dot when it has unsaved changes. The picked job is ringed blue.
   · The job panel (white, raised, hairline) holds, top to bottom: the open jobs as tabs (fixed 230 px,
     gold dot when unsaved, × to close), the Start · Read · Make · Save strip for that job only, a job
     line (customer, the job, any send-back words), the work and its column, and the save bar.
   · Several jobs at once: each open job keeps its own step, wording, proposals, kept set and edits;
     switching tabs loses nothing. The page-wide lists (Needs action, the ADS list, MEDIA) are shared.
     A tab cannot be switched or closed while its job is reading, painting or saving (it would lose
     the answer); a toast says so.
   · Closing a job with unsaved changes asks first (ix-modals): "Close without saving?", naming what
     would be lost; "Keep working" or "Close without saving". Cancel on Start and Cancel on a fix
     close the job outright, as before.
   · Kept for Save moves from the left column to the foot of the Make work area.
   HARDCODING: none new (tab width and surface colours are design values in the CSS).
   ── v2.7.1 (8 Nov 2026, S8) ── AS-IS BY AD TYPE (Jeff's ruling), THE PHOTO INSIDE THE AD
   · The source has a type: Banner, Sidebar, Splash, Print ad or Something else. A version on file
     knows it (its ADS shape); a PDF page is a print ad; a dropped picture or a screenshot is judged
     from its proportions against TA_CONFIG.elementTypes.ads. Read shows it in "The ad" row
     ("Read as") with a dropdown and a cancel link; a change shows gold until cancelled.
   · Same type as the shape being made (a banner from a banner): the ad is proposed as itself first.
     "With a band" comes in up to three ground colours (brand main, brand accent, the colour round the
     ad's edge), then "As it is" and "Filled" once each, then the layouts.
     "As it is" is not varied: a same-type ad fills its space, so its ground barely shows.
   · Another type (a banner into a sidebar, a print ad into anything): the ad is the brief. No as-is
     proposals; the layouts are made from its words, logo, colours and the photo found inside it.
   · The photo found inside the ad (the biggest piece that is not the whole ad, a photo before a
     graphic) feeds the photo layouts by default, for either type. A piece marked by hand, or one
     picked from the found pieces, takes its place as before.
   · The whole-ad picture is kept apart (S.whole) and travels to the engine as input.asIs; the
     recipe of a saved row records the picture that row was painted from. Needs ix-ad-layouts v1.5.1.
   HARDCODING: HC-P-SSB8-1 SRC_TYPES, the five source types and their words; HC-P-SSB8-2
     TYPE_GUESS_TOL 1.3, how far a picture's proportions may be from the nearest ad shape before it
     is judged "Something else"; HC-P-SSB8-3 AS_IS_GROUNDS 3, the most ground colours offered.
   ── v2.7.0 (8 Nov 2026) ── TOOLS FOLLOW THE ELEMENT + BUSINESS NAME + ADD ANY FIELD + VERTICAL BG2 + AS-IS
   · Make: nothing selected = the proposal's tools (wording, add a piece, backgrounds, font pair,
     arrangement, sizes). Click a piece on the stage = that piece's tools only (type and colour,
     size, position, its wording; the logo gets the plate switch). Click the picture's empty ground,
     or "proposal tools", to go back. Needs ix-ad-layouts v1.5.0.
   · Business name is a wording slot, filled from the customer ("From the customer").
   · "Add to this proposal": every slot with words that the layout does not draw (business name,
     second headline, website, small print). Adding places it at the layout's default spot; it then
     moves and styles like any text. "Remove" takes it off again.
   · Two backgrounds: the second panel can sit top or bottom as well as left or right; the split
     drags vertically then.
   · A source picture that is the whole ad (the Worker's whole-ad case) is proposed as itself first:
     As it is, Filled, With a band. The layout proposals follow. "Use it" as a photo still works.
   ── v2.6.0 (8 Nov 2026) ── PIECES CART + SAVED PIECES AS A SOURCE
   · Read: a "Pieces" section on the right lists every piece you cut (thumb,
     size, state, drop). The bar gains "Save N pieces as media": writes those
     MEDIA rows (Uploadcare + Scenario B Route 4, customer on the payload)
     and stays on Read. Pieces left unsaved are written by the end Save.
     The v2.5.0 tick is gone.
   · Start: the "An ad already on file" tile also lists the customer's saved
     pieces (MEDIA rows that reference the customer; read from ix-asset-list
     v1.2.0 /list?type=media). Pick one → Read opens with that picture as the
     photo and the wording to type, like Scratch.
   ── v2.5.0 (8 Nov 2026) ── HARVEST: SHAPES, MANY MARKS, SAVE AS MEDIA
   · Mark view: Rectangle | Circle. Shift while dragging locks the box to a
     square (so Circle gives a true circle). Circle cuts to the ellipse
     inscribed in the box, transparent outside, and is tagged a graphic so
     the layouts fit it whole and never crop the round edge.
   · "Add this piece" adds the box as a found piece and keeps you on the
     picture (numbered outlines show what you have cut); "Done" returns.
     The last piece added is the one in use; pick another from the tiles.
   · One tick under Photo: "Save the marked pieces to the customer's media".
     On Save each marked piece is uploaded and recorded as a MEDIA row via
     Scenario B Route 4 with customerId / customerName in the payload.
   · The ADS rows' MEDIA calls also carry customerId / customerName now.
   ── v2.4.0 (8 Nov 2026) ── MARK THE PHOTO + FOUND PIECES
   · The Photo entry on the Read step offers every picture the Worker found
     as a small tile (pick one by eye; the biggest is taken by default), and
     a "Mark the photo" link: the ad opens at full size in the centre, the
     same drag box as the crop step, and the box becomes the photo, cut from
     the source at its own pixels. "put it back" restores what was found.
   · One photo per job, as before: it feeds every proposal. Scratch has no
     source, so no link; a version job marks on its saved picture.
   ── v2.3.0 (8 Nov 2026) ── PASTE A SCREENSHOT + MATCH BY ID
   · Fourth source on Start: "Paste a screenshot". Copy an ad off any screen,
     press ⌘V / Ctrl+V while the tile is picked (or drop/click as for a file).
     A pasted picture always goes through the box step next, because a
     screenshot carries what was round the ad; "Use the whole picture" if
     not. Same Uploadcare path and sharpness check as a dropped file.
   · Needs-action: a placed ad slot is matched to the board's customer by
     id first (asset.customerId / asset.customer.id against customers[].id),
     then by a normalised name (case, spaces, punctuation ignored); the
     board customer is then matched to CLIENTS by id first, name second.
   · Source tiles reordered: file, paste, on file, scratch; the print issue
     (coming) sits last.
     Held-for notes use the same normalised name. Fixes a customer missing
     from the list when the slot's customer string and the board name differ.
   ── v2.2.1 (8 Nov 2026) ── a found picture covering ≥ WHOLE_AD_SHARE of the
   source is the ad itself (a picture-only saved ad, read back): left out by
   default, named as such on the right, so SP/SQ don't fit the old banner
   inside the new sidebar. HC-P-SSB7-9: WHOLE_AD_SHARE = 0.8.
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
  var VERSION = '4.0.7';
  var SUGGEST_WORDS = 14, SUGGEST_PX = 11, LARGER_STEP = 1.5;   // HC-P-SSB8-13
  var ASK_MODEL = 'claude-sonnet-4-5', ASK_MAX = 3;   // HC-P-SSB8-11
  var ASK_HINTS = ['Keep the photo and the logo; drop the busy box; use only its first line.', 'Use the darkest colour as the background and the brightest for the button.', 'Make the phone bigger and put the headline on a white panel.', 'Only the headline, the phone and the website \u2014 nothing else.', 'Round photo, logo top left, words on the right.', 'Resize only: keep this ad as it is and fit it to the new shape (best once the reader finds where each piece sits).'];
  var IMPROVE_SCALE = 2, IMPROVE_POLL_MS = 1500, IMPROVE_CAP_MS = 180000;   // HC-P-SSB8-10
  var SNAP_PX = 6, SAFE_PX = 12;   // HC-P-SSB8-8
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
  var SLOTS = [['headline', 'Headline'], ['headline2', 'Second headline'], ['supporting', 'Supporting line'], ['button', 'Button'], ['phone', 'Phone'], ['website', 'Website'], ['small_print', 'Small print'], ['business', 'Business name']];   // v2.7.0: + business
  var PIECES = [['logo', 'Logo'], ['headline', 'Headline'], ['supporting', 'Supporting line'], ['button', 'Button'], ['phone', 'Phone']];
  var MAX_SAVE = 3;
  // v1.2.0 · the pieces a layout can carry and their stage names
  var PIECE_WORDS = { logo: 'Logo', headline: 'Headline', headline2: 'Second headline', supporting: 'Supporting line', button: 'Button', phone: 'Phone', website: 'Website', small_print: 'Small print', business: 'Business name' };
  // v1.2.0 · a starting list for the font box; any Google family can be typed (HC-P-SSB7-3)
  var FONT_LIST = ['Manrope', 'Inter', 'DM Sans', 'Work Sans', 'Montserrat', 'Poppins', 'Raleway', 'Nunito', 'Lato', 'Open Sans', 'Roboto', 'Source Sans 3', 'Oswald', 'Bebas Neue', 'Anton', 'Playfair Display', 'Fraunces', 'Lora', 'Merriweather', 'Libre Baskerville', 'EB Garamond', 'Cormorant Garamond', 'DM Serif Display', 'Abril Fatface', 'Pacifico', 'Caveat', 'Dancing Script'];
  var INK = '#1E2A3A', WHITE = '#FFFFFF';
  var STEP_NAMES = ['Start', 'Read', 'Pick', 'Fine-tune', 'Save'];   // v3.0.0                                   // HC-P-SSB7-5
  var STEP_SUBS = ['Who, which shape, from what', 'The ad, and what we found', 'A few concepts', 'Make it yours', 'Look it over, then save'];
  var SCREEN_STEP = { start: 1, read: 2, drafts: 3, make: 3, pick: 3, finetune: 4, tune: 4, save: 5, done: 5 };
  var CARD_W = { banner: 340, sidebar: 232 };   // card width on the Make grid; the stage is 100%
  var PROPOSAL_MAX = 8, AD_COLOURS_MAX = 3;                                               // HC-P-SSB7-8
  var SRC_CHIPS = [   // v3.1.0 · HC-P-SSB8-7
    ['print', 'Print issue', 'Ads found when a print issue is taken in.'],
    ['saved', 'Saved ads', 'This customer\u2019s ads already in inbxify: made in Ad Maker, or older pictures.'],
    ['pieces', 'Saved pieces', 'Photos and logos cut from ads and kept as media.'],
    ['upload', 'Upload or paste', 'A PDF, a JPG or a screenshot from outside inbxify.'],
    ['scratch', 'Scratch', 'No ad: type the wording; the logo and colours come from the customer.']
  ];
  var SRC_TYPES = [['banner', 'Banner'], ['sidebar', 'Sidebar'], ['splash', 'Splash'], ['print', 'Print ad'], ['other', 'Something else']];   // HC-P-SSB8-1
  var TYPE_GUESS_TOL = 1.3, AS_IS_GROUNDS = 3;                                                // HC-P-SSB8-2, HC-P-SSB8-3
  var WHOLE_AD_SHARE = 0.8;   // a found picture covering this much of the source is the ad itself, not a photo   // HC-P-SSB7-9
  var SHAPE_TILES = [['banner', 'Banner', '700 \u00d7 235', false], ['sidebar', 'Sidebar', '480 \u00d7 400', false], ['splash', 'Splash', 'coming', true], ['text', 'Text ad', 'coming', true]];

  var W = {                                                            // HC-P-SSB5-9
    title: 'Ad Maker', tagline: 'one shape at a time, from what the customer already has', whichShape: 'Which shape', oneAtATime: 'one at a time; come back for the next', keep: 'Keep', kept: 'Kept \u2713', clone: 'Clone', variations: 'Variations', putBack: 'put it back', keptFor: 'Kept for Save', workingOn: 'Working on', upNext: 'Up next', willUse: 'The drafts will use', nothingToDecide: 'Nothing to decide.', needs: 'Needs action', sent: 'Sent back', needed: 'Ad needed', note: 'Note only',
    coming: 'Tool coming', empty: 'Pick an item on the left, or start a creative that isn\u2019t on the list.',
    newC: 'New ad', chooseCust: 'Choose a customer', custFirst: 'Choose the customer first.', howStart: 'Choose how to start.',
    startFrom: 'Start from', startFromSub: 'Pick one. Everything after this step is the same whichever you choose.', srcPrint: 'The print issue', srcPrintSub: 'The ad as it ran in the magazine, found for you when a print issue is taken in.', srcPrintHint: 'Arrives with Print Ads as Input. Nothing waiting for this customer.',
    srcDrop: 'A file you have', srcDropSub: 'A PDF page, a JPG of the ad, or an old banner. We read the wording and the logo off it.', srcDropHint: 'Best when the advertiser sent you something.', srcVersionHint: 'Best when the customer already has a banner and needs a sidebar.', srcNoneHint: 'Best for a new advertiser with nothing yet.',
    srcVersion: 'An ad already on file', srcNone: 'Scratch', srcNoneSub: 'No ad to work from. Type the wording; the drafts use the customer\u2019s logo and colours.',
    dropHere: 'Drop a PDF page, an ad image or an old banner here', orClick: 'or click to choose.',
    srcPaste: 'Paste a screenshot', srcPasteSub: 'Copy the ad off any screen, then paste it here. You crop to the ad next.', srcPasteHint: 'Best when the ad is on a website or in an email. Text in a screenshot stays a picture.',
    pasteHere: 'Press {k} to paste', pasteOr: 'or drop a picture, or click to choose.', wholePicture: 'Use the whole picture',
    needsYou: 'Needs you', noColours: 'No brand colours on the customer. Type them, or leave them empty and a neutral colour is used.',
    readAd: 'Read the ad', showDrafts: 'Show drafts', confirm: 'Confirm and show drafts', tuneBtn: 'Fine-tune the shortlist',
    saveBtn: 'Save', back: 'Back', cancel: 'Cancel', keepThese: 'Keep these', looksRight: 'Looks right', whatSaveWrites: 'What Save writes', seeAd: 'See the ad', pickAd: 'Draw a box round the ad', wholePage: 'Use the whole page',
    reading: 'Reading the ad', readingSub: 'The ix-adreformat Worker is reading the words, pictures and colours.',
    wording: 'Wording', wordingSub: 'check and fix before the drafts', edited: 'Edited by you',
    logo: 'Logo', custFile: 'Customer\u2019s file', fromAd: 'From this ad', cutFromPrint: 'Cut from print', versionOnly: 'This version only',
    replaceFile: 'Replace the customer\u2019s file', checkIt: 'Check it', noFile: 'No file on the customer.', keepLogo: 'Save it to the customer once checked',
    photo: 'Photo', useIt: 'Use it', leaveOut: 'Leave it out', noPhoto: 'No photo was found in the ad.',
    markPhoto: 'Mark the photo', markPhotoSub: 'Drag a box round a piece of the ad. Hold Shift for a square or a true circle.', markedByYou: 'Marked by you', useAsPhoto: 'Add this piece', foundPieces: 'Found in the ad',
    shapeRect: 'Rectangle', shapeCircle: 'Circle', markDone: 'Done', piecesCut: 'cut so far', pieces: 'Pieces', piecesSub: 'cut from the ad, saved as media', savedPieces: 'Saved pieces', srcPieceSub: 'Start from a picture already in this customer\u2019s media.',
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
    S = { screen: 'start', srcs: [], srcChip: 'saved', srcAt: 0, srcN: 0, loading: { needs: true, ads: true }, needs: [], ads: null, adOpts: null, sel: null, custId: '', custPre: '',
          col: { main: '', accent: '' }, shape: '', src: '', drop: null, page: 1, box: null, boxing: false, drawing: null,
          reading: false, read: null, srcCanvas: null, srcImg: null, words: {}, base: {}, from: {},
          logoUse: 'file', logoScope: 'version', logoKeep: false, logoNewUrl: '', logoNewImg: null, logoSwap: false, logoSwapKeep: false, printLogo: null, photo: null, usePhoto: true, pics: [], photoFound: null, whole: null, srcType: '', srcType0: '', srcTypeFrom: '', photoMark: false, markBox: null, markShape: 'rect', marks: [], savingPieces: false, fromPiece: '',
          fontPair: '', fontKeep: false, drafts: null, short: { banner: [], sidebar: [] }, ed: null, savePick: { banner: [], sidebar: [] },
          saving: null, fix: null, err: '' };
  }
  reset();

  // ── v2.8.0 · open jobs (tabs). S is the job in front; JOBS holds every open job's own state. ──
  var JOBS = [], newN = 0, railOpen = false;   // v3.0.1: the Working on column folds once a job is open
  var SHARED_KEYS = ['loading', 'needs', 'ads', 'adOpts', 'media', 'mediaOpts', 'obErr'];   // page-wide lists, not the job's
  function shareInto(dst, src) { SHARED_KEYS.forEach(function (k) { if (src && k in src) dst[k] = src[k]; }); }
  function busyWord(s) {
    s = s || S;
    if (s.reading) return 'reading';
    if (s.savingPieces || (s.saving && !s.saving.done && !s.saving.err)) return 'saving';
    if (s.screen === 'make' && s.sel && !s.drafts && !s.draftErr) return 'painting';
    if (s.printLogo && s.printLogo.isolating) return 'cutting the logo';
    return '';
  }
  function withS(s, f) { var k = S; S = s; try { return f(); } finally { S = k; } }
  function lostOf(s) {   // what closing this job would throw away
    return withS(s, function () {
      var out = [];
      if (!S.sel || S.screen === 'fixdone' || (S.saving && S.saving.done)) return out;
      var nw = SLOTS.filter(function (sl) { return (S.words[sl[0]] || '') !== (S.base[sl[0]] || ''); }).length;
      if (nw) out.push(nw + ' wording change' + (nw > 1 ? 's' : ''));
      if (S.ed) {
        var nk = keptItems().length; if (nk) out.push(nk + ' kept proposal' + (nk > 1 ? 's' : ''));
        var ne = allCards().filter(function (x) { return !x.kept && x.sr0 && JSON.stringify(x.sr) !== JSON.stringify(x.sr0); }).length;
        if (ne) out.push(ne + ' edited proposal' + (ne > 1 ? 's' : ''));
      }
      var np = (S.pics || []).filter(function (p) { return p.marked && !p.mediaId; }).length; if (np) out.push(np + ' piece' + (np > 1 ? 's' : '') + ' not saved as media');
      if (S.col && (S.col.main || S.col.accent)) out.push('brand colours typed');
      if (S.srcType !== S.srcType0) out.push('the ad\u2019s type');
      return out;
    });
  }
  function dirtyOf(s) { return lostOf(s).length > 0; }
  function stepWordOf(s) { if (s.screen === 'fix' || s.screen === 'fixdone') return W.fixing; return STEP_NAMES[(SCREEN_STEP[s.screen] || 1) - 1]; }
  function tabName(s) {
    return withS(s, function () {
      var c = cust(), it = item(), nm = c ? c.name : (it && it.title) || W.newC;
      var sh = S.screen === 'fix' || S.screen === 'fixdone' ? (S.fix ? shapeLabel(S.fix.shape).toLowerCase() + ' fix' : 'fix') : S.shape ? shapeLabel(S.shape).toLowerCase() : 'no shape yet';
      return nm + ' \u00b7 ' + sh;
    });
  }
  function jobFor(id) { for (var i = 0; i < JOBS.length; i++) if (JOBS[i].sel === id) return JOBS[i]; return null; }
  function busyToast() { toast('Wait for ' + tabName(S) + ' to finish ' + busyWord() + ' first.', 'err'); }
  function openJob(it, then) {
    railOpen = false;   // v3.0.1
    var j = jobFor(it.id); if (j) { switchTo(j); return; }
    if (S.sel && busyWord()) { busyToast(); return; }
    if (S.sel) { var prev = S; reset(); shareInto(S, prev); }
    JOBS.push(S); startItem(it);
    if (then) then(); else render();
  }
  function switchTo(j) {
    railOpen = false;
    if (j === S) { render(); return; }
    if (busyWord()) { busyToast(); return; }
    var prev = S; S = j; shareInto(S, prev); render();
  }
  function closeJob(j, ask) {
    if (busyWord(j)) { toast('Wait for ' + tabName(j) + ' to finish ' + busyWord(j) + ' first.', 'err'); return; }
    var lost = lostOf(j);
    if (ask && lost.length) { confirmClose(j, lost, function () { doClose(j); }); return; }
    doClose(j);
  }
  function doClose(j) {
    var i = JOBS.indexOf(j); if (i > -1) JOBS.splice(i, 1);
    if (j === S || i < 0) {
      var nxt = JOBS[Math.min(Math.max(i, 0), JOBS.length - 1)];
      if (nxt) { S = nxt; shareInto(S, j); } else { reset(); shareInto(S, j); }
    }
    render();
  }
  function confirmClose(j, lost, ok) {
    var ov = document.createElement('div'); ov.className = 'ix-overlay am-ov';
    ov.innerHTML = '<div class="ix-modal" role="dialog" aria-modal="true" aria-label="Close without saving?" style="max-width:480px">' +
      '<div class="ix-modal-banner ix-modal-banner--alert">Close without saving?</div>' +
      '<div class="ix-modal-body"><p style="margin:0 0 8px"><b>' + esc(tabName(j)) + '</b> has changes that are not saved: ' + esc(lost.join(', ')) + '.</p>' +
      '<p style="margin:0">Closing throws them away. To keep them, go back and Save.</p></div>' +
      '<div class="ix-modal-footer"><div class="ix-modal-footer-right">' +
      '<button type="button" class="ix-btn ix-btn--secondary" data-k="no">Keep working</button> ' +
      '<button type="button" class="ix-btn ix-btn--danger" data-k="yes">Close without saving</button></div></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (!b && e.target !== ov) return; ov.remove(); if (b && b.getAttribute('data-k') === 'yes') ok(); });
  }
  function tabsHTML() {
    return '<div class="am-tabs" role="tablist">' + JOBS.map(function (j, i) {
      var on = j === S, nm = tabName(j), d = dirtyOf(j);
      return '<div class="am-tab' + (on ? ' on' : '') + '"><button type="button" class="am-tabb" role="tab" aria-selected="' + on + '" data-tab="' + i + '" title="' + esc(nm) + '"><span class="nm">' + esc(nm) + '</span>' +
        (d ? '<i class="am-gdot" role="img" aria-label="Unsaved changes"></i>' : '') + '</button><button type="button" class="am-tabx" data-tabx="' + i + '" aria-label="Close ' + esc(nm) + '">\u00d7</button></div>';
    }).join('') + '</div>';
  }

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
                 website: g('business-website') || g('contact-website'), email: g('email') || g('business-email') || g('contact-email'), phone: g('business-phone') || g('contact-phone'), publisherId: (d.publisherId || '').trim() });
    }
    out.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
    CUST = out;
  }
  function hex(v) { var m = String(v || '').trim().match(/^#?([0-9a-f]{6})$/i); return m ? '#' + m[1].toUpperCase() : ''; }
  function cust() { for (var i = 0; i < CUST.length; i++) if (CUST[i].id === S.custId) return CUST[i]; return null; }
  function custById(id) { for (var i = 0; i < CUST.length; i++) if (CUST[i].id === id) return CUST[i]; return null; }
  function normName(n) { return String(n || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ''); }   // v2.3.0: case, spaces, punctuation ignored
  // v2.8.2: a slot note names a customer loosely: same name, else the ONE customer whose name starts with it
  function custFromNote(note) {
    var k = normName(note); if (k.length < 4) return null;
    var exact = custByName(note); if (exact) return exact;
    var hits = CUST.filter(function (c) { return normName(c.name).indexOf(k) === 0; });
    return hits.length === 1 ? hits[0] : null;
  }
  function custByName(n) { var k = normName(n); if (!k) return null; for (var i = 0; i < CUST.length; i++) if (normName(CUST[i].name) === k) return CUST[i]; return null; }
  function custByIdOrName(id, name) { return (id && custById(id)) || custByName(name); }
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
          var custs = {}, custsById = {}; (bd.customers || []).forEach(function (c) { custs[normName(c.name)] = c; if (c.id) custsById[c.id] = c; });   // v2.3.0
          var when = fmtDate(p.sendAt || p.date), slots = bd.slots || [];
          slots.forEach(function (sl) {
            var m = sl.note && HELD_RX.exec(sl.note);
            if (m) {
              var c = custByName(m[1]), shape = m[2].toLowerCase() === 'text ad' ? 'text' : m[2].toLowerCase();
              items.push({ kind: 'needed', id: 'held-' + sl.id, title: m[1], custId: c ? c.id : '', shape: shape, what: shapeLabel(shape),
                           m: p.name + ' \u00b7 ' + when, when: p.sendAt || p.date, q: 'Held on slot ' + sl.position, coming: !(shape === 'banner' || shape === 'sidebar') });
              return;
            }
            if (sl.asset && sl.asset.kind === 'ad' && (sl.asset.customer || sl.asset.customerId)) {
              var ac = sl.asset.customer, acId = sl.asset.customerId || (ac && typeof ac === 'object' ? ac.id : '') || '';
              var acName = ac && typeof ac === 'object' ? (ac.name || '') : (ac || '');
              var cc = (acId && custsById[acId]) || custs[normName(acName)];   // v2.3.0: id first, then normalised name
              if (cc && cc.noSidebar && !ids['sb-' + cc.id]) {
                ids['sb-' + cc.id] = 1;
                var cp = custByIdOrName(cc.id, cc.name);
                items.push({ kind: 'needed', id: 'sb-' + cc.id + '-' + p.id, title: cc.name, custId: cp ? cp.id : '', shape: 'sidebar', what: 'Sidebar',
                             m: p.name + ' \u00b7 ' + when, when: p.sendAt || p.date, q: 'Banner placed at ' + sl.position + ', no sidebar yet', coming: false });
              }
            }
            if (sl.note && !m && /^(?!Held for)/i.test(sl.note) && (sl.assetType === 'ad' || /banner|sidebar/i.test(sl.note))) {
              var nc = custFromNote(sl.note);   // v2.8.2
              items.push({ kind: 'note', id: 'note-' + sl.id, title: 'Slot ' + sl.position, custId: nc ? nc.id : '', shape: 'banner', what: 'Note', m: p.name + ' \u00b7 ' + when, when: p.sendAt || p.date, q: sl.note, coming: false });
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
  // v2.6.0: MEDIA rows for this publisher (ix-asset-list v1.2.0); a customer's pieces are the rows that reference the customer
  function loadMedia() {
    var u = CFG().assetListUrl, ta = CFG().taItemId; S.loading.media = true; S.media = S.media || [];
    if (!u || !ta) { S.loading.media = 'TA_CONFIG.assetListUrl or taItemId is missing.'; return Promise.resolve(); }
    return fetchJson(String(u).replace(/\/$/, '') + '/list?type=media&title=' + encodeURIComponent(ta) + '&fresh=1')
      .then(function (r) {
        if (!r.ok || !r.j || r.j.error) throw new Error((r.j && r.j.error) || ('ix-asset-list answered HTTP ' + r.status));
        S.media = (r.j.items || []).filter(function (it) { return !it.isArchived && !it.isDraft; }); S.mediaOpts = r.j.options || {}; S.loading.media = false;
      }).catch(function (e) { S.loading.media = (e && e.message) || 'The MEDIA list could not be read.'; });
  }
  function refersTo(fd, id) { return Object.keys(fd || {}).some(function (k) { var v = fd[k]; if (Array.isArray(v)) return v.some(function (x) { return (x && x.id) === id || x === id; }); return v === id || (v && typeof v === 'object' && v.id === id); }); }
  function piecesOf(custId) {
    if (!custId) return [];
    return (S.media || []).filter(function (it) { var fd = it.fieldData || {}; return refersTo(fd, custId) && (fd['image-url'] || (fd.image && fd.image.url)); })
      .map(function (it) { var fd = it.fieldData || {}, roleMap = S.mediaOpts && S.mediaOpts['component-role'] || {};
        return { id: it.id, name: fd.name || 'Picture', url: fd['image-url'] || fd.image.url, w: +fd['pixel-width'] || 0, h: +fd['pixel-height'] || 0, role: roleMap[fd['component-role']] || '' }; });
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
  // v3.0.0: a step is open when its screen has something to show: Read once read, Pick once painted, Fine-tune with one picked, Save with one kept
  function canStep(n) {
    if (S.saving) return false;
    if (n === 1) return true;
    if (n === 2) return !!(S.read || S.src === 'none' || S.ed);
    if (n === 3) return !!(S.ed && S.drafts);
    if (n === 4) return !!(S.ed && forward());
    if (n === 5) return !!(S.ed && keptItems().length);
    return false;
  }
  function stepsHTML() {
    if (S.screen === 'fix' || S.screen === 'fixdone') return '<div class="am-steps"><div class="am-step now wide"><em>!</em><div><b>' + W.fixing + '</b><span>Replaces the returned shape only</span></div></div></div>';
    var k = SCREEN_STEP[S.screen] || 1, saved = S.screen === 'save' && S.saving && (S.saving.done || S.saving.err);
    return '<div class="am-steps">' + STEP_NAMES.map(function (n, i) {
      var num = i + 1, st = num < k ? 'done' : num === k ? 'now' : '', can = num !== k && canStep(num);
      var isLast = num === STEP_NAMES.length;
      return '<' + (can ? 'button type="button" data-step="' + num + '"' : 'div') + ' class="am-step ' + st + '"><em>' + (num < k || (isLast && saved) ? '\u2713' : num) + '</em><div><b>' + n + '</b><span>' + STEP_SUBS[i] + '</span></div></' + (can ? 'button' : 'div') + '>';
    }).join('') + '</div>';
  }
  // v2.0.0: one frame. shell(centre, bar, opts) - opts.left / opts.right override the standing columns (null = none).
  function shell(body, bar, opts) {
    opts = opts || {};
    var m = document.getElementById(MOUNT_ID); if (!m) return;
    var right = 'right' in opts ? opts.right : (cust() && S.screen === 'start' ? useCol() : '');   // v3.0.0: The drafts will use sits on Start; Read and Fine-tune bring their own
    // v2.8.0: the job list on the left; the open jobs' tabs and ONE job panel (steps, job line, work, save bar) beside it
    var job = !!S.sel;
    m.innerHTML = '<div class="am"><div class="am-head"><div class="am-headrow"><h2>' + W.title + '</h2><span class="am-tag">' + W.tagline + '</span>' + badge() + '</div></div>' +
      '<div class="am-frame">' + (job && !railOpen ? '<button type="button" class="am-railtab" data-act="railOpen" title="Show the job list"><span>Working on \u00b7 ' + needsAll().all.length + '</span></button>' : col('am-left', '', jobCol())) +
      '<div class="am-work">' + tabsHTML() +
      '<div class="am-panel scr-' + S.screen + (JOBS.length ? '' : ' notabs') + '">' + (job ? stepsHTML() : '') +   // v3.0.1: no customer line; the tab names the job
      '<div class="am-body">' + col('am-main', '', body + keptStrip()) + (right === null || right === '' ? '' : col('am-right', '', right)) + '</div>' +
      '<div class="am-savebar">' + bar + '</div></div></div></div></div>';
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
    var pn = m.querySelector('.am-panel'), pr = pn ? pn.getBoundingClientRect() : r;   // v2.8.0: the bar is the job panel's
    bar.style.left = Math.round(pr.left) + 'px'; bar.style.width = Math.round(pr.width) + 'px';
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
      h += '<div class="am-nag"><div class="am-nagh am-k-' + g[0] + '">' + g[1] + '<span class="n">' + rows.length + '</span></div>';
      rows.forEach(function (x) { h += naHTML(x, x.id === S.sel); });   // v2.8.0: the job in front is ringed
      h += '</div>';
    });
    return h;
  }
  function naHTML(x, on) {
    return '<button type="button" class="am-na am-k-' + x.kind + (on ? ' on' : '') + (x.err ? ' err' : '') + '" data-na="' + esc(x.id) + '">' +
      (x.picture ? '<div class="th"><img src="' + esc(x.picture) + '" alt=""></div>' : '') +
      '<div class="am-nab"><h4>' + esc(x.title) + '</h4><div class="w">' + esc(x.what) + (x.coming ? '<span class="am-coming">' + W.coming + '</span>' : '') + '</div>' +
      (x.q ? '<div class="q" title="' + esc(x.q) + '">' + esc(x.q) + '</div>' : '') + '<div class="m">' + esc(x.m) + '</div>' + openMark(x.id) + '</div></button>';
  }
  function openMark(id) {   // v2.8.0: an open job says so on its card
    var j = jobFor(id); if (!j) return '';
    return '<div class="am-openm">' + (dirtyOf(j) ? '<i class="am-gdot" role="img" aria-label="Unsaved changes"></i>' : '') + 'Open \u00b7 ' + esc(stepWordOf(j)) + '</div>';
  }
  // LEFT - the job, on every step. Nothing picked yet -> the whole queue under Needs action.
  // v2.8.0: LEFT - every job, always. The job in front is ringed; open jobs say so.
  function jobCol() {
    var N = needsAll(), h = '';
    if (typeof S.loading.needs === 'string') h += '<div class="am-err">' + esc(S.loading.needs) + '</div>';
    if (typeof S.loading.ads === 'string') h += '<div class="am-err">' + esc(S.loading.ads) + '</div>';
    if (S.obErr) h += '<div class="am-err">' + esc(S.obErr) + '</div>';
    if (CUST_ATTRS.missing.length) h += '<div class="am-err">The page\u2019s .customers-wrapper has no ' + esc(CUST_ATTRS.missing.join(', ')) + '. Add the attribute' + (CUST_ATTRS.missing.length > 1 ? 's' : '') + ' on the TITLES-ADMIN Template.</div>';
    var loading = S.loading.needs === true || S.loading.ads === true;
    return '<div class="am-wohead"><span class="am-wotitle">' + W.workingOn + '</span><span class="am-wocount">' + (loading ? 'loading\u2026' : N.all.length + ' jobs') + '</span>' +
      '<button type="button" class="am-newad" data-act="newC">+ ' + W.newC + '</button>' + (S.sel ? '<button type="button" class="am-railx" data-act="railClose" title="Fold the job list">\u00ab</button>' : '') + '</div>' +
      '<div class="am-wosub">Click a job to open it. Open jobs keep their place.</div>' + h + queueHTML(N, null);
  }
  // v2.8.0: the line under the steps: who, the job, the send-back words, where it started
  function jobLine() {
    var it = item(), c = cust();
    var srcWord = { print: W.srcPrint, drop: W.srcDrop, paste: 'a screenshot', version: W.srcVersion, piece: 'a saved piece', none: W.srcNone }[S.src] || '';
    var fv = S.src === 'version' && S.fromVersion ? versionsOf(S.custId).filter(function (v) { return v.id === S.fromVersion; })[0] : null;
    var nm = String(c ? c.name : (it && it.title) || '').toLowerCase().trim(), same = function (t) { t = String(t || '').toLowerCase().trim(); return !t || t === nm || nm.indexOf(t) === 0; };   // v2.8.1: no repeats of the name
    var bits = [jobWord(it)];
    if (it && it.kind !== 'note' && it.m) bits.push(it.m);
    if (it && it.q && !same(it.q)) bits.push(it.q);
    if (S.screen !== 'start' && srcWord) bits.push('starting from ' + srcWord.toLowerCase() + (fv && !same(fv.name) ? ' \u00b7 ' + fv.name : ''));
    return '<div class="am-jobline"><b>' + esc(c ? c.name : (it && it.title) || W.newC) + '</b><span>' + esc(bits.join(' \u00b7 ')) + '</span></div>';
  }
  // v2.8.0: Kept for Save sits at the foot of the Make work area (it was in the left column)
  function keptStrip() {
    if (!S.ed || S.screen !== 'make') return '';
    var ks = keptItems();
    later(function () { document.querySelectorAll('#' + MOUNT_ID + ' [data-keptcv]').forEach(function (el) { var k = itemById(+el.getAttribute('data-keptcv')); if (k && k.paint) { el.innerHTML = ''; el.appendChild(canvasView(k.paint.canvas, 60)); } }); });
    return '<div class="am-keptwrap">' + colh(W.keptFor, ks.length ? ks.length + ' so far' : '') + (ks.length ? '<div class="am-keptstrip">' + ks.map(function (k) { return '<div class="am-keptrow"><div class="pic" data-keptcv="' + k.id + '"></div><div class="tx"><b>' + esc(k.label) + '</b></div><button type="button" class="am-revert" data-act="unkeep" data-id="' + k.id + '">drop</button></div>'; }).join('') + '</div>' : '<div class="am-note">Nothing yet. Keep a proposal as it is, or edit one and keep that.</div>') + '</div>';
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
        '<div class="am-chip ondark">' + (light ? '<img src="' + esc(light) + '" alt="">' : '<span>No light logo \u00b7 on dark, a white plate only where it would not read</span>') + '</div></div>';
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
    if (editing && S.whole && S.screen === 'read') {   // v2.7.1: what the source is decides whether it is offered as itself
      var tCh = S.srcType !== S.srcType0, same = sameType(), tgt = shapeLabel(targetShape() || 'banner').toLowerCase();
      h += '<div class="am-urow"><div class="k">The ad<span>\u00b7 ' + (tCh ? 'set by you' : esc(S.srcTypeFrom || '')) + '</span>' + (tCh ? revert('srcTypeCancel') : '') + '</div>' +
        '<div class="am-ctl"><div class="am-lab">Read as</div><select class="am-sel' + (tCh ? ' am-dirty' : '') + '" id="am-srctype" style="height:32px !important;font-size:12.5px !important;width:100% !important">' +
        (S.srcType ? '' : '<option value="" selected disabled>Choose what this ad is</option>') +
        SRC_TYPES.map(function (t) { return '<option value="' + t[0] + '"' + (S.srcType === t[0] ? ' selected' : '') + '>' + esc(t[1]) + '</option>'; }).join('') + '</select></div>' +
        '<div class="am-urnote">' + (same ? 'Same type as the ' + esc(tgt) + ' you are making: offered as it is first, then the layouts.'
          : 'A ' + esc(typeWord(S.srcType).toLowerCase()) + ' made into a ' + esc(tgt) + ': used as the brief. The layouts take its words, logo, colours and the photo inside it.') + '</div></div>';
    }
    if (editing) {
      var ph = '<div class="am-urow"><div class="k">' + W.photo + '<span>\u00b7 cut from the ad</span></div>';
      var markSrc = photoSource(), canMark = !!markSrc && S.screen === 'read' && !S.reading;
      var markLink = canMark ? '<a href="#" class="am-up" data-act="photoMark">' + W.markPhoto + '</a>' : '';
      var showPieces = S.pics.length > 1, nMarked = S.pics.filter(function (p) { return p.marked; }).length;
      var pieces = showPieces ? '<div class="am-phpicks">' + S.pics.map(function (p) { return '<button type="button" class="am-phpick' + (p.marked ? ' cut' : '') + (S.photo && S.photo.i === p.i ? ' on' : '') + '" data-pick="' + p.i + '" title="' + esc(p.label || p.kind) + '"><span class="th" data-pickth="' + p.i + '"></span></button>'; }).join('') + '<small>' + (nMarked ? nMarked + ' marked \u00b7 ' : '') + W.foundPieces + (markLink ? ' \u00b7 ' : '') + markLink + '</small></div>' : (markLink ? '<div class="am-phpicks"><small>' + markLink + '</small></div>' : '');
      var cart = S.pics.filter(function (p) { return p.marked; });
      if (cart.length) {
        var unsaved = cart.filter(function (p) { return !p.mediaId; }).length;
        pieces += '<div class="am-urow am-cart"><div class="k">' + W.pieces + '<span>\u00b7 ' + W.piecesSub + '</span></div>' + cart.map(function (p) {
          var st = p.mediaId ? flag('ok', 'Saved \u00b7 MEDIA') : p.state === 'saving' ? flag('warn', 'Saving\u2026') : p.state === 'bad' ? flag('bad', 'Failed') : flag('warn', 'Not saved');
          return '<div class="am-cartrow"><span class="th' + (p.cutout ? ' checker' : '') + '" data-cartth="' + p.i + '"></span><div class="tx"><b>' + esc(p.label) + '</b><small>' + (p.shape === 'circle' ? 'circle \u00b7 ' : '') + p.img.width + ' \u00d7 ' + p.img.height + ' px' + (p.err ? ' \u00b7 ' + esc(p.err) : '') + '</small></div>' + st + (p.mediaId || p.state === 'saving' ? '' : ' <a href="#" class="am-revert" data-drop-piece="' + p.i + '">drop</a>') + '</div>'; }).join('') +
          '<div class="am-srcl" style="margin-top:6px">' + (unsaved ? unsaved + ' not saved \u00b7 ' + (S.screen === 'read' ? 'Save pieces as media in the bar, or they are saved with the ad.' : 'saved with the ad.') : 'All saved to ' + esc(cust().name) + '\u2019s media.') + '</div></div>';
        later(function () { cart.forEach(function (p) { var t = document.querySelector('[data-cartth="' + p.i + '"]'); if (t) { t.innerHTML = ''; t.appendChild(thumbOf(p.img, 34)); } }); });
      }
      if (S.photo) {
        var sh = ['banner', 'sidebar'].map(function (shape) { return sharpFor(shape); });
      var isAsIs = function () { return S.photo && S.photo.whole; };
        var allSharp = sh.every(function (r) { return r[0] === 'ok'; });
        ph += '<div class="am-phrow"><div class="am-phth" id="am-photo-th"></div><div style="flex:1;min-width:0"><div class="am-flags">' + (S.photo.marked ? flag('ok', W.markedByYou + (S.photo.shape === 'circle' ? ' \u00b7 circle, transparent' : '')) + ' ' : '') + (S.photo.whole ? flag('warn', 'This is the whole ad, not a photo') : (allSharp ? flag('ok', 'Sharp for both shapes') : sh.map(function (r, i) { return flag(r[0], shapeLabel(i ? 'sidebar' : 'banner') + ': ' + r[1]); }).join(' '))) + '</div>' + (S.photo.whole ? '<div class="am-urnote">No photo was found inside the ad, so the layouts that need one are left out. ' + (canMark ? 'Mark a part of it to use as a photo. ' : '') + 'Use it only if you want the whole old ad inside the new one.</div>' : '') +
          '<div class="am-seg"><button type="button" class="' + (S.usePhoto ? 'on' : '') + '" data-photo="1">' + W.useIt + '</button><button type="button" class="' + (!S.usePhoto ? 'on' : '') + '" data-photo="0">' + W.leaveOut + '</button></div></div></div>' + pieces;
        later(function () { var pht = document.getElementById('am-photo-th'); if (pht && S.photo) { pht.innerHTML = ''; pht.appendChild(thumbOf(S.photo.img, 64)); } });
      } else ph += '<div class="am-urnote">' + W.noPhoto + ' Logo-led and brand-block layouts only.</div>' + pieces;
      later(function () { S.pics.forEach(function (p) { var t = document.querySelector('[data-pickth="' + p.i + '"]'); if (t) { t.innerHTML = ''; t.appendChild(thumbOf(p.img, 34)); } }); });
      h += ph + '</div>';
    }
    var fh = fontOf(c.fontHead), fb = fontOf(c.fontBody), ft = '<div class="am-urow"><div class="k">' + W.fonts;
    if (fh && fb) ft += '<span>\u00b7 from the customer</span></div><div class="am-urnote" style="color:var(--am-ink)">' + esc(fh.family + ' ' + fh.weight + ' / ' + fb.family + ' ' + fb.weight) + '. ' + W.nothingToDecide + '</div>';
    else if (true) ft += '<span class="am-flag warn" style="background:#FBF3DF !important">None on the customer</span></div><div class="am-urnote">The concepts use the platform pair; Fine-tune sets a font for each piece. Set fonts on the client record to use them everywhere.</div>';   // v3.0.1: the rail shows the record only
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
    var ready = !!(c && S.shape && S.srcs && S.srcs.length);   // v3.1.0
    var pend = (S.col.main ? 1 : 0) + (S.col.accent ? 1 : 0);
    var srcWord = { print: W.srcPrint, drop: W.srcDrop, paste: 'a screenshot', version: W.srcVersion, piece: 'a saved piece', none: W.srcNone }[S.src] || '';
    var fv = S.src === 'version' && S.fromVersion ? versionsOf(S.custId).filter(function (v) { return v.id === S.fromVersion; })[0] : null;
    var msg = S.sel ? (c ? (!S.shape ? W.whichShape + '?' : S.srcs && S.srcs.length ? 'Making a ' + S.shape + ' from <b>' + S.srcs.length + ' source' + (S.srcs.length > 1 ? 's' : '') + '</b>' + (pend ? ' \u00b7 ' + pend + ' brand colour' + (pend > 1 ? 's' : '') + ' to the customer on Save' : '') : W.howStart) : W.custFirst) : 'Pick a job on the left.';
    shell(mid, barHTML(msg, (S.sel ? ghost('startCancel', W.cancel) : '') + (S.sel && !(it && (it.coming || it.err)) ? btn('toRead', W.readAd, 'primary', !ready) : '')));
  }
  function jobWord(it) { return S.shape ? 'Making a ' + S.shape : (it && it.what ? String(it.what) : 'Not on the list'); }
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
    h = ask(1, 'Who', '', '<div class="am-who2"><span class="nm">' + esc(c.name) + '</span>' + (S.changeCust ? '' : '<a href="#" class="am-up" data-act="changeCust">Change customer</a>') + (S.custId !== S.custPre ? ' ' + revert('custCancel') : '') + '</div>' + (S.changeCust ? h : '') + '<div class="am-srcl">The logo and colours on this record are what the ads use.</div>' + (item() && item().q ? '<div class="am-jobnote"><b>Note</b> ' + esc(item().q) + '</div>' : ''));   // v3.0.1: the job's note lives here
    if (S.startNote) h = '<div class="am-startnote">' + esc(S.startNote) + '</div>' + h;
    h += ask(2, W.whichShape, W.oneAtATime, '<div class="am-shapes">' + SHAPE_TILES.map(function (t) { var off = t[3]; return '<button type="button" class="am-shape' + (off ? ' off' : S.shape === t[0] ? ' on' : '') + '"' + (off ? ' disabled' : ' data-shape="' + t[0] + '"') + '><i class="' + t[0] + '"></i><b>' + t[1] + '</b><small>' + t[2] + '</small></button>'; }).join('') + '</div>');
    if (!S.shape) return h + ask(3, 'From what', '', '<div class="am-srcl">Pick the shape first.</div>', true);
    // v3.1.0 · From what, design A: chips, one strip, a tray. Several sources.
    absorbDrop();
    var vs = versionsOf(c.id), ps = piecesOf(c.id), chip = S.srcChip || 'saved';
    var countOf = { print: 0, saved: vs.length, pieces: ps.length, upload: S.srcs.filter(function (r) { return r.kind === 'drop' || r.kind === 'paste'; }).length, scratch: '' };
    var chips = '<div class="am-chips2">' + SRC_CHIPS.map(function (k) {
      return '<button type="button" class="am-chip2' + (chip === k[0] ? ' on' : '') + '" data-act="srcChip" data-v="' + k[0] + '" title="' + esc(k[2]) + '">' + esc(k[1]) + (countOf[k[0]] !== '' ? '<i>' + countOf[k[0]] + '</i>' : '') + '<span class="am-chipi" aria-label="' + esc(k[2]) + '">i</span></button>';
    }).join('') + '</div><div class="am-chipdesc">' + esc((SRC_CHIPS.filter(function (k) { return k[0] === chip; })[0] || [])[2] || '') + '</div>';
    var picked = function (kind, id) { return S.srcs.some(function (r) { return r.kind === kind && r.id === id; }); };
    var tile = function (kind, id, img, name, meta) { var on = picked(kind, id); return '<button type="button" class="am-st' + (on ? ' on' : '') + '" data-act="srcToggle" data-k="' + kind + '" data-v="' + esc(id) + '" title="' + esc(name) + '"><span class="ck">' + (on ? '\u2713' : '') + '</span><span class="bx">' + (img ? '<img src="' + esc(img) + '" alt="">' : '<i></i>') + '</span><b>' + esc(name) + '</b><small>' + esc(meta) + '</small></button>'; };
    var strip = '';
    if (chip === 'saved') strip = vs.length ? '<div class="am-strip">' + vs.map(function (v) { return tile('version', v.id, v.banner || v.sidebar, v.name, (v.recipe ? 'Made in Ad Maker' : 'Picture only') + (v.banner ? ' \u00b7 banner' : ' \u00b7 sidebar')); }).join('') + '</div>' : '<div class="am-srcl">No saved ads for this customer yet.</div>';
    else if (chip === 'pieces') strip = ps.length ? '<div class="am-strip">' + ps.map(function (q) { return tile('piece', q.id, q.url, q.name, q.w ? q.w + ' \u00d7 ' + q.h + ' px' : 'piece'); }).join('') + '</div>' : (S.loading.media === true ? '<div class="am-srcl">Reading the customer\u2019s media\u2026</div>' : '<div class="am-srcl">No saved pieces yet. Cut them on Read with Mark the photo.</div>');
    else if (chip === 'print') strip = '<div class="am-srcl">Nothing waiting for this customer. Arrives with Print Ads as Input.</div>';
    else if (chip === 'upload') strip = (S.drop ? '<div class="am-srcl">Opening ' + esc(S.drop.name) + '\u2026</div>' : '<div class="am-drop am-paste" data-act="fileDrop" id="am-dropzone" tabindex="0"><div class="t"><b>Drop a PDF or picture here</b>, or click here and press ' + esc(pasteKey()) + ' to paste a screenshot. <a href="#" class="am-up" data-act="pickFile">Choose a file</a></div><input type="file" id="am-file" accept="image/*,application/pdf" style="display:none"></div>');
    else if (chip === 'scratch') strip = '<button type="button" class="am-btn2' + (picked('none', 'scratch') ? ' dark' : '') + '" data-act="srcToggle" data-k="none" data-v="scratch">' + (picked('none', 'scratch') ? 'Scratch is picked \u2713' : 'Add Scratch') + '</button>';
    var tray = '<div class="am-tray"><span class="lbl">Picked \u00b7 ' + S.srcs.length + '</span>' + (S.srcs.length ? S.srcs.map(function (r, i) {
      return '<span class="am-tpill' + (S.srcFlash === r.key ? ' flash' : '') + '"><span class="mini">' + (r.thumb ? '<img src="' + esc(r.thumb) + '" alt="">' : '') + '</span><span class="nm" title="' + esc(r.name) + '">' + esc(r.name) + '</span><button type="button" data-act="srcDrop" data-v="' + i + '" aria-label="Remove ' + esc(r.name) + '">\u00d7</button></span>';
    }).join('') : '<span class="am-srcl">Nothing yet. Pick from any chip above; nothing wins here, Read shows each one.</span>') + '</div>';
    h += ask(3, 'From what', 'pick as many as you like', chips + strip + tray);
    return h;
  }

  // ══════════════════════════════════════════════════════════════
  //  Sources: a dropped file, a PDF page, a version, nothing
  // ══════════════════════════════════════════════════════════════
  function pasteKey() { return /Mac|iPhone|iPad/i.test(navigator.platform || '') ? '\u2318V' : 'Ctrl+V'; }
  function takePaste(e) {
    if (S.screen !== 'start' || !(S.src === 'paste' || (S.src === 'drop' && S.srcChip === 'upload')) || S.drop) return;
    S.srcPasting = true;   // v3.1.0
    var tg = e.target; if (tg && tg.closest && tg.closest('input, textarea, [contenteditable]') && !tg.closest('#am-dropzone')) return;
    var items = (e.clipboardData && e.clipboardData.items) || [], f = null;
    for (var i = 0; i < items.length; i++) if (/^image\//.test(items[i].type)) { f = items[i].getAsFile(); if (f) break; }
    if (!f) { toast('Nothing pasted that is a picture. Copy the ad as an image and try again.', 'err'); return; }
    e.preventDefault();
    var stamp = new Date(), hh = stamp.getHours(); var nm = 'Screenshot pasted ' + ((hh % 12) || 12) + ':' + String(stamp.getMinutes()).padStart(2, '0') + (hh < 12 ? ' am' : ' pm');   // v4.0.0
    takeFile(f, nm);
  }
  function takeFile(file, nameOverride) {
    if (!file) return;
    if (S.src === 'paste' && (/pdf$/i.test(file.type) || /\.pdf$/i.test(file.name || ''))) { toast('Paste a screenshot takes a picture, not a PDF. Use \u201cA file you have\u201d for a PDF.', 'err'); return; }
    S.drop = { name: nameOverride || file.name || 'Pasted picture', file: file, pages: 0, key: null, img: null };
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
  // v2.5.0: the ellipse inscribed in the box, transparent outside (the clip edge is anti-aliased by the canvas)
  function cropToEllipse(img, box) {
    var cv = cropToCanvas(img, box), o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height;
    var g = o.getContext('2d'); g.save(); g.beginPath(); g.ellipse(o.width / 2, o.height / 2, o.width / 2, o.height / 2, 0, 0, Math.PI * 2); g.clip(); g.drawImage(cv, 0, 0); g.restore();
    return o;
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
      setSrcType(); takePlan(r.j); takeParts(r.j);
      render();
    }).catch(function (e) { S.reading = false; S.err = (e && e.message) || 'The read failed.'; render(); });
  }
  function takePlan(j) {
    S.words = {}; S.base = {}; S.from = {};
    (j.plan || []).forEach(function (l) { S.words[l.slot] = l.words || ''; S.base[l.slot] = l.words || ''; S.from[l.slot] = l.label || ''; });
    SLOTS.forEach(function (s) { if (S.words[s[0]] == null) { S.words[s[0]] = ''; S.base[s[0]] = ''; S.from[s[0]] = 'Empty'; } });
    if (!S.words.button) { S.words.button = ''; }
    businessDefault();   // v2.7.0: the read leaves it empty unless the ad carried a business line
  }
  // Pictures out of the parts: the biggest photo/mascot/graphic, and the logo cut.
  function takeParts(j) {
    var parts = (j.parts && j.parts.images) || [], c = cust();
    var pics = parts.filter(function (p) { return /^(photo|mascot|graphic)$/.test(p.kind); }).sort(function (a, b) { return (b.bbox[2] * b.bbox[3]) - (a.bbox[2] * a.bbox[3]); });
    S.photo = null; S.usePhoto = true; S.photoMark = false; S.markBox = null; S.marks = [];
    // v2.4.0: every found piece is kept as a choice; the biggest is the default
    S.pics = pics.map(function (p, i) { var cv = subCanvas(S.srcCanvas, p.bbox, 0); return { i: i, img: cv, kind: p.kind === 'photo' ? 'photo' : 'graphic', label: p.label, url: '', nativeWidth: cv.width, subject: p.subject || null, bbox: p.bbox, whole: (p.bbox[2] * p.bbox[3]) >= WHOLE_AD_SHARE }; });
    // v2.7.1: the whole-ad picture is kept apart (offered as itself only for a source of the same type);
    // the photo for the layouts is the biggest piece inside the ad, a photo before a graphic
    var w0 = S.pics.filter(function (p) { return p.whole; })[0]; S.whole = w0 ? Object.assign({}, w0) : null;
    if (!S.whole && S.srcCanvas) S.whole = { i: -1, img: S.srcCanvas, kind: 'photo', label: 'the whole ad', url: '', nativeWidth: S.srcCanvas.width, subject: null, bbox: [0, 0, 1, 1], whole: true };   // v2.8.1: the source is the ad
    var inner = S.pics.filter(function (p) { return !p.whole; }), best = inner.filter(function (p) { return p.kind === 'photo'; })[0] || inner[0] || null;
    if (best) S.photo = Object.assign({}, best);
    else if (S.whole) { S.photo = Object.assign({}, S.whole); S.usePhoto = false; }
    S.photoFound = S.photo ? Object.assign({}, S.photo) : null;
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
  function needsBox() { return S.drop && !S.boxed && ((S.src === 'drop' && !S.drop.img) || S.src === 'paste'); }
  // v2.4.0: the picture a photo can be marked on — the read source, or a version's saved picture
  function photoSource() { return S.srcCanvas || (S.src === 'version' && S.verImg) || null; }
  // v3.1.0 · one tab per source on Read
  // v4.0.0: a source's shape, as a fact
  function shapeFact(img) {
    var w = img ? (img.width || img.naturalWidth || 0) : 0, h = img ? (img.height || img.naturalHeight || 0) : 0; if (!w || !h) return '';
    var r = w / h, near = function (a, b) { return Math.abs(Math.log(r / (a / b))) < 0.12; };
    var ratio = r >= 1 ? (r >= 1.9 ? Math.round(r * 10) / 10 + ' : 1' : near(4, 3) ? '4 : 3' : near(3, 2) ? '3 : 2' : near(6, 5) ? '6 : 5' : near(1, 1) ? '1 : 1' : Math.round(r * 10) / 10 + ' : 1') : (near(4, 5) ? '4 : 5' : near(3, 4) ? '3 : 4' : near(2, 3) ? '2 : 3' : '1 : ' + Math.round(10 / r) / 10);
    var kind = r >= 2.2 ? 'the shape of a banner' : (r >= 1.05 && r < 1.6) ? 'the shape of a sidebar' : r < 0.95 ? 'the shape of a print ad' : 'about square';
    return (r >= 1.05 ? 'Wide' : r <= 0.95 ? 'Tall' : 'Square') + ', about ' + ratio + ' \u00b7 ' + kind;
  }
  function srcTabs() {
    if (!S.srcs || !S.srcs.length) return '';
    var d = designRec();
    return '<div class="am-srctabs">' + S.srcs.map(function (r, i) {
      return '<div class="am-srctab' + (i === S.srcAt ? ' on' : '') + '"><button type="button" class="am-srctabb" data-act="srcTab" data-v="' + i + '"><span class="mini">' + (r.thumb ? '<img src="' + esc(r.thumb) + '" alt="">' : '') + '</span><span class="nm" title="' + esc(r.name) + '">' + esc(r.name) + '</span>' + (r.snap ? '<span class="rd">\u2713</span>' : '') + '</button>' +
        (r.snap ? '<span class="am-srctype">' + esc(shapeFact(r.snap.srcCanvas || r.snap.verImg)) + '</span>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function vRead() {
    var c = cust();
    var ar = S.srcs && S.srcs[S.srcAt]; if (ar && ar.snap && S._shownSrc !== ar.key && !S.reading) { restoreSnap(ar); S._shownSrc = ar.key; }   // v3.1.0: Read shows the source in front as read
    if (S.photoMark && photoSource()) {
      var ms = photoSource(), mb = S.markBox, cut = S.marks.length;
      var left = colh('The ad', S.drop ? S.drop.name : (S.src === 'version' ? 'saved picture' : '')) + '<div class="am-pagebox am-markbox" id="am-mark"></div>';
      var mid = colh(W.markPhoto) + '<div class="am-card"><div class="am-note" style="color:var(--am-ink);font-size:13px">' + W.markPhotoSub + ' Leave the wording out; it is set as text by the layouts.</div>' +
        '<div class="am-seg" style="margin-top:10px"><button type="button" class="' + (S.markShape === 'rect' ? 'on' : '') + '" data-mshape="rect">' + W.shapeRect + '</button><button type="button" class="' + (S.markShape === 'circle' ? 'on' : '') + '" data-mshape="circle">' + W.shapeCircle + '</button></div>' +
        (mb ? '<div style="margin-top:10px">' + flag('ok', (S.markShape === 'circle' ? 'Circle' : 'Box') + ' drawn \u00b7 ' + Math.round(ms.width * mb.w) + ' \u00d7 ' + Math.round(ms.height * mb.h) + ' px') + ' ' + revert('markBoxCancel') + '</div>' : '') +
        (cut ? '<div class="am-urnote" style="margin-top:10px">' + cut + ' piece' + (cut > 1 ? 's' : '') + ' ' + W.piecesCut + '. The last one added is the photo in use.</div>' : '') + '</div>';
      later(function () {
        var el = document.getElementById('am-mark'); if (!el) return;
        var done = S.marks.map(function (m, i) { return '<div class="bx did' + (m.shape === 'circle' ? ' round' : '') + '" style="left:' + m.x * 100 + '%;top:' + m.y * 100 + '%;width:' + m.w * 100 + '%;height:' + m.h * 100 + '%"><i>' + (i + 1) + '</i></div>'; }).join('');
        el.innerHTML = '<img src="' + scaled(ms, 1600).toDataURL('image/png') + '" alt="The ad" draggable="false">' + done + (mb ? '<div class="bx on' + (S.markShape === 'circle' ? ' round' : '') + '" style="left:' + mb.x * 100 + '%;top:' + mb.y * 100 + '%;width:' + mb.w * 100 + '%;height:' + mb.h * 100 + '%"></div>' : '');
        wireBoxDrawing(el, function (b) { S.markBox = b; }, { round: S.markShape === 'circle', aspect: ms.width / ms.height });
      });
      shell('<div class="am-boxcols">' + col('', 'flex:1;min-width:0', left) + col('', 'width:340px;flex:none', mid) + '</div>',
        barHTML(mb ? 'Ready to add.' : (cut ? 'Drag another, or Done.' : 'Drag a box round a piece of the ad.'), ghost('photoMarkCancel', W.markDone) + btn('photoMarkUse', W.useAsPhoto, 'primary', !mb)), { right: null });
      return;
    }
    if (needsBox()) {
      var left = colh(S.src === 'paste' ? 'Screenshot' : 'Page', S.drop.name + (S.drop.pages > 1 ? ' \u00b7 page ' + S.page + ' of ' + S.drop.pages : '')) +
        '<div class="am-pagebox" id="am-page"><div class="am-note" style="padding:20px">Rendering the page\u2026</div></div>' +
        (S.drop.pages > 1 ? '<div class="am-pager">' + ghost('pagePrev', '\u2039 Page') + '<span>' + S.page + ' / ' + S.drop.pages + '</span>' + ghost('pageNext', 'Page \u203a') + '</div>' : '');
      var mid = colh('Pick the ad') + '<div class="am-card"><div class="am-note" style="color:var(--am-ink);font-size:13px">' + W.pickAd + ' for ' + esc(c.name) + (S.src === 'paste' ? '. Drag on the screenshot.' : '. Drag on the page.') + '</div>' +
        (S.box ? '<div style="margin-top:10px">' + flag('ok', 'Box drawn \u00b7 ' + Math.round(S.box.w * 100) + '% \u00d7 ' + Math.round(S.box.h * 100) + '% of the page') + ' ' + revert('boxCancel') + '</div>' : '') +
        '<div class="am-srcl" style="margin-top:10px">' + (S.src === 'paste' ? 'The screenshot is just the ad? <a href="#" class="am-up" data-act="wholePage">' + W.wholePicture + '</a>' : 'One ad fills the page? <a href="#" class="am-up" data-act="wholePage">' + W.wholePage + '</a>') + '</div></div>';
      shell(srcTabs() + '<div class="am-boxcols">' + col('', 'width:460px;flex:none', left) + col('', 'flex:1', mid) + '</div>',
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
      return '<div class="am-from"><div class="am-fromth" id="am-srcimg">' + (S.reading ? '<div class="am-scan"></div>' : '') + '</div><div class="am-fromtx">' + (rd0 ? '<b>' + (rd0.method === 'pdf' ? 'PDF text, exact.' : rd0.method === 'recipe' ? 'From the saved recipe.' : rd0.method === 'piece' ? 'From a saved piece.' : 'Read by vision.') + '</b> ' + esc(rd0.note || '') : (S.reading ? '<b>' + W.reading + '</b> ' + W.readingSub : S.src === 'none' ? '<b>Nothing to read.</b> Type the wording below; website and phone come from the customer.' : '')) +
        (S.read && S.read.warnings || []).map(function (w) { return '<span class="am-warnline">' + esc(w) + '</span>'; }).join('') + '</div></div>';
    };
    if (S.reading) {
      shell(srcTabs() + colh(W.wording, W.wordingSub) + srcStrip() + '<div class="am-prog"><b>' + W.reading + '</b><div class="am-note">' + W.readingSub + '</div><div class="bar"><i></i></div></div>',
        barHTML('Reading\u2026', btn('x', W.confirm, 'primary', true)));
      showSource(); return;
    }
    if (S.err) {
      shell(colh(W.wording) + srcStrip() + '<div class="am-err">' + esc(S.err) + '</div><div style="margin-top:10px">' + btn('readAgain', 'Read again', 'secondary') + '</div>', barHTML('', ghost('back', W.back)));
      showSource(); return;
    }
    // v3.0.0: Read = the ad as it is, large; beside it what we found. Nothing to set but the photo and Read as.
    snapActive(); if (ar) S._shownSrc = ar.key;   // v3.1.0: a finished read is kept for this source
    var mid = srcTabs() + colh('The ad as it is', ar ? ar.name : (S.drop ? S.drop.name : '')) +
      '<div class="am-readbig" id="am-srcbig">' + (S.src === 'none' ? '<div class="am-note" style="padding:30px">No ad to read: the wording is typed on Fine-tune.</div>' : '') + '</div>' + srcStrip();
    var found = poolCol();   // v4.0.0: the pool
    var unsavedN = S.pics.filter(function (p) { return p.marked && !p.mediaId; }).length;   // v2.6.0
    var pieceBtn = S.savingPieces ? btn('x', 'Saving pieces\u2026', 'secondary', true) : unsavedN ? btn('savePieces', 'Save ' + unsavedN + ' piece' + (unsavedN > 1 ? 's' : '') + ' as media', 'secondary') : '';
    shell(mid, barHTML(S.savingPieces ? 'Saving the pieces to ' + esc(c.name) + '\u2019s media\u2026' : 'What was read off the ad \u00b7 nothing to set here',
      ghost('back', W.back) + pieceBtn + btn('toDrafts', S.ed && S.drafts && S.draftSig === inputSig() ? 'See the concepts' : 'Show the concepts', 'primary', S.savingPieces)), { right: found });
    showSource();
    (function () { var el = document.getElementById('am-srcbig'), src = S.srcCanvas || S.verImg; if (!el || !src) return; var wv = Math.min(760, el.clientWidth - 40 || 700); var im = canvasView(src.tagName === 'IMG' ? imgToCanvas(src) : src, wv); im.style.maxWidth = '100%'; im.style.margin = '0 auto'; el.innerHTML = ''; el.appendChild(im); })();   // after shell: the column exists now
  }
  // v4.0.0 · Read's right column: the pool and the contact check
  // v4.0.3 · the pictures ticked for concepts (kept by picture, so it survives the pool being rebuilt)
  function picKey(p) { return p ? p.img : null; }
  function tickedPics() {
    var pics = (S.pics || []).filter(function (p) { return !p.whole; }).concat((S._poolPics || []).filter(function (p) { return (S.pics || []).every(function (q) { return q.img !== p.img; }); }));
    if (!S.ticks) { var d0 = S.photo && S.usePhoto ? pics.filter(function (p) { return p.img === S.photo.img; })[0] : null; S.ticks = d0 ? [picKey(d0)] : (pics[0] ? [picKey(pics[0])] : []); }
    var seen = []; return pics.filter(function (p) { var k = picKey(p); if (S.ticks.indexOf(k) < 0 || seen.indexOf(k) > -1) return false; seen.push(k); return true; });
  }
  function inputSig() { var t = tickedPics().map(function (p) { return (p.label || '') + (p.img && p.img.width) + 'x' + (p.img && p.img.height); }); return JSON.stringify([t, S.words, (S.srcs || []).map(function (r) { return r.key; }), S.shape]); }
  function usePicOf(x) { if (!x || !x.picRef) return; var p = (S.pics || []).filter(function (q) { return picKey(q) === x.picRef || q.img === x.picImg; })[0]; if (p) { S.photo = Object.assign({}, p); S.usePhoto = true; } }
  function poolCol() {
    mergeSources();
    var read = (S.srcs || []).filter(function (r) { return r.snap; });
    var cols = []; read.forEach(function (r) { (r.snap.adColours || []).forEach(function (cc) { var h0 = hex(cc); if (h0 && cols.indexOf(h0) < 0) cols.push(h0); }); });
    if (!cols.length) (S.adColours || []).forEach(function (cc) { var h0 = hex(cc); if (h0 && cols.indexOf(h0) < 0) cols.push(h0); });
    var allP = [], seenP = []; read.forEach(function (r) { (r.snap.pics || []).forEach(function (p) { if (!p.whole && seenP.indexOf(p.img) < 0) { seenP.push(p.img); allP.push(p); } }); });   // v4.0.3: every source's pictures
    (S.pics || []).forEach(function (p) { if (!p.whole && seenP.indexOf(p.img) < 0) { seenP.push(p.img); allP.push(p); } });
    S._poolPics = allP; if (!S.ticks && allP.length) S.ticks = [S.photo && S.usePhoto && seenP.indexOf(S.photo.img) > -1 ? S.photo.img : allP[0].img];
    var pics = allP.map(function (p, i) { return { p: p, i: i }; });
    var h = '<div class="am-sech2" style="margin-top:0">The look</div><dl class="am-pool">' +
      '<dt>Colours</dt><dd>' + (cols.length ? cols.map(function (cc) { return '<span class="am-pchip"><i style="background:' + cc + ' !important"></i>' + esc(colourWord(cc)) + '</span>'; }).join('') : '<span class="am-light">None sampled yet</span>') + '</dd>' +
      '<dt>Pictures</dt><dd><div class="am-tnote">Tick the pictures to make concepts for.</div><div class="am-ppics big">' + pics.map(function (q) { var on = (S.ticks || []).indexOf(q.p.img) > -1; return '<button type="button" class="am-ppic big' + (on ? ' on' : '') + '" data-act="picTick" data-v="' + q.i + '" title="' + esc(q.p.label || 'piece') + '"><span class="ck">' + (on ? '\u2713' : '') + '</span><span class="im" data-pcv="' + q.i + '"></span></button>'; }).join('') + '</div><a href="#" class="am-up" data-act="photoMark">Mark the photo</a></dd>' +
      '<dt>Logo</dt><dd>' + (cust() && cust().logo ? 'From the customer record' : 'None on the customer') + '</dd></dl>';
    later(function () { document.querySelectorAll('#' + MOUNT_ID + ' [data-pcv]').forEach(function (el) { var p = (S._poolPics || [])[+el.getAttribute('data-pcv')]; if (p && p.img) { el.innerHTML = ''; el.appendChild(canvasView(p.img.getContext ? p.img : imgToCanvas(p.img), 150, true)); } }); });
    h += '<div class="am-sech2">The words</div><dl class="am-pool">' + SLOTS.map(function (sl) {
      var vars = (S.variants && S.variants[sl[0]]) || [], v = S.words[sl[0]] || '';
      if (!vars.length && v) vars = [{ v: v, from: '' }];
      return '<dt>' + esc(sl[1]) + '</dt><dd>' + (vars.length ? vars.map(function (q) { return '<div>' + esc(q.v) + (read.length > 1 && q.from ? ' <span class="am-pfrom">' + esc(q.from) + '</span>' : '') + '</div>'; }).join('') : '<span class="am-light">None</span>') + '</dd>';
    }).join('') + '</dl>';
    h += contactCheck();
    return h;
  }
  function normPhone(v) { return String(v || '').replace(/\D+/g, '').replace(/^1(?=\d{10}$)/, ''); }
  function normWeb(v) { return String(v || '').toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, ''); }
  function foundContacts() {
    var out = { phone: [], website: [], email: [] }, seen = {};
    var add = function (k, v) { if (!v) return; var key = k + '|' + (k === 'phone' ? normPhone(v) : normWeb(v)); if (seen[key]) return; seen[key] = 1; out[k].push(v); };
    var vals = []; (S.srcs || []).forEach(function (r) { if (r.snap && r.snap.words) Object.keys(r.snap.words).forEach(function (k) { vals.push([k, r.snap.words[k]]); }); });
    if (!vals.length) Object.keys(S.words || {}).forEach(function (k) { vals.push([k, S.words[k]]); });
    vals.forEach(function (kv) { var v = String(kv[1] || ''); if (kv[0] === 'phone') add('phone', v); if (kv[0] === 'website') add('website', v);
      (v.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) || []).forEach(function (m) { add('email', m); }); });
    return out;
  }
  function contactCheck() {
    var c = cust() || {}, f = foundContacts(), rows = [];
    S.contactDecide = S.contactDecide || {};
    var rec = { phone: c.phone || '', website: c.website || '', email: c.email || '' }, word = { phone: 'Phone', website: 'Website', email: 'Email' };
    ['phone', 'website', 'email'].forEach(function (k) {
      f[k].forEach(function (v) {
        var same = k === 'phone' ? normPhone(v) === normPhone(rec[k]) : normWeb(v) === normWeb(rec[k]), key = k + '|' + v, dec = S.contactDecide[key];
        if (same) { rows.push('<div class="am-cflag ok"><b>' + word[k] + ' matches.</b> ' + esc(v) + ' is on the record.</div>'); return; }
        if (dec) { rows.push('<div class="am-cflag ok"><b>' + word[k] + ':</b> the ad uses ' + esc(v) + (dec === 'both' ? '; the customer record is updated on Save.' : '; the customer record is left as it is.') + ' ' + revert('contactUndo', ' data-k="' + esc(key) + '"') + '</div>'); return; }
        rows.push('<div class="am-cflag"><b>' + word[k] + ' differs.</b> The ad says <b>' + esc(v) + '</b>; the record has <b>' + esc(rec[k] || 'nothing') + '</b>.' +
          '<div class="am-cflagb"><button type="button" class="am-btn2 dark" data-act="contactBoth" data-k="' + esc(key) + '">Use in the ad and update the customer</button><button type="button" class="am-btn2" data-act="contactAd" data-k="' + esc(key) + '">Use in the ad only</button></div></div>');
      });
    });
    return rows.length ? '<div class="am-sech2">Contact check \u00b7 against the customer record</div>' + rows.join('') : '';
  }
  function imgToCanvas(img) { var c = document.createElement('canvas'); c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height; c.getContext('2d').drawImage(img, 0, 0); return c; }
  // v3.0.0: the found-things part of the old column: logo, Read as, the photo found and Mark the photo (no fonts, no colours to set)
  function useColFound() {
    var full = useCol(), d = document.createElement('div'); d.innerHTML = full;
    var keep = [];
    d.querySelectorAll('.am-urow').forEach(function (r) { var k = r.querySelector('.k'), t = k ? k.textContent : ''; if (/^(Logo|The ad|Photo)/.test(t)) keep.push(r.outerHTML); });
    return keep.join('');
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
  // ── v2.7.1 · the source's type ─────────────────────────────
  function targetShape() { return S.fix ? S.fix.shape : S.shape; }
  function sameType() { return !!S.srcType && S.srcType === targetShape(); }
  function typeWord(t) { for (var i = 0; i < SRC_TYPES.length; i++) if (SRC_TYPES[i][0] === t) return SRC_TYPES[i][1]; return 'Not known'; }
  function shapeDims(shape) {   // from TA_CONFIG.elementTypes.ads: { w, h } or explicit numbers in the label, "(700x235)"
    var ads = CFG().elementTypes && CFG().elementTypes.ads, id = { banner: 'banner-ad', sidebar: 'sidebar-ad', splash: 'splash-ad' }[shape], row = null;
    if (Array.isArray(ads)) ads.forEach(function (r) { if (r && r.id === id) row = r; }); else if (ads && ads[id]) row = ads[id];
    if (!row) return null;
    var w = +row.w, h = +row.h; if (!(w > 0 && h > 0)) { var m = String(row.l || row.label || '').match(/(\d+)\s*[x\u00d7]\s*(\d+)/i); if (m) { w = +m[1]; h = +m[2]; } }
    return w > 0 && h > 0 ? { w: w, h: h } : null;
  }
  function guessType(w, h) {   // the nearest ad shape by proportion; too far from all of them = Something else (HC-P-SSB8-2)
    if (!(w > 0 && h > 0)) return 'other';
    var r = w / h, best = 'other', bestD = Math.log(TYPE_GUESS_TOL);
    ['banner', 'sidebar', 'splash'].forEach(function (t) { var d = shapeDims(t); if (!d) return; var k = Math.abs(Math.log(r / (d.w / d.h))); if (k <= bestD) { bestD = k; best = t; } });
    return best;
  }
  function setSrcType() {
    var t = '', from = '';
    if (S.src === 'version') { var fv = versionsOf(S.custId).filter(function (v) { return v.id === S.fromVersion; })[0]; t = fv && !fv.banner && fv.sidebar ? 'sidebar' : 'banner'; from = 'the version on file'; }
    else if (S.drop && S.drop.key) { t = 'print'; from = 'a PDF page'; }
    else if (S.srcCanvas) { t = guessType(S.srcCanvas.width, S.srcCanvas.height); from = 'judged from its proportions'; }
    S.srcType = t; S.srcType0 = t; S.srcTypeFrom = from;
  }
  // A recipe's photo: a whole-ad picture (an as-is row) goes to S.whole, any other to S.photo
  function takeRecipePhoto(ph, shape) {
    S.whole = null; S.photo = null; S.usePhoto = false;
    if (!ph) return;
    if (ph.whole) { S.whole = Object.assign({}, ph, { whole: true }); S.srcType = shape; S.srcType0 = shape; S.srcTypeFrom = 'the version on file'; }
    else { S.photo = Object.assign({}, ph); S.usePhoto = true; }
  }
  function photoOf(x) { return !!(S.input && x && IxAdLayouts.inputFor(S.input, x.sr).photo); }
  function colours() { var c = cust() || {}; var main = c.main || S.col.main, accent = c.accent || S.col.accent; return { main: main, accent: accent, missing: !main }; }
  function wireBoxDrawing(el, set, opt) {
    set = set || function (b) { S.box = b; }; opt = opt || {};
    var img = el.querySelector('img'); if (!img) return;
    var start = null, bx = null, aspect = opt.aspect || (img.naturalWidth / img.naturalHeight) || 1;
    function pos(e) { var r = img.getBoundingClientRect(), p = e.touches ? e.touches[0] : e; return { x: clamp((p.clientX - r.left) / r.width, 0, 1), y: clamp((p.clientY - r.top) / r.height, 0, 1) }; }
    el.addEventListener('mousedown', function (e) { if (e.button !== 0) return; e.preventDefault(); start = pos(e); var old = el.querySelector('.bx.on'); if (old) old.remove(); bx = document.createElement('div'); bx.className = 'bx on' + (opt.round ? ' round' : ''); el.appendChild(bx); });
    window.addEventListener('mousemove', function (e) { if (!start || !bx) return; var p = pos(e);
      if (e.shiftKey) {   // v2.5.0: Shift locks to a square in pixels (w and h equal on the picture), so Circle gives a true circle
        var dx = p.x - start.x, dy = p.y - start.y, side = Math.max(Math.abs(dx), Math.abs(dy) / aspect);
        p = { x: clamp(start.x + Math.sign(dx || 1) * side, 0, 1), y: clamp(start.y + Math.sign(dy || 1) * side * aspect, 0, 1) };
      }
      var x = Math.min(start.x, p.x), y = Math.min(start.y, p.y), w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y); bx.style.left = x * 100 + '%'; bx.style.top = y * 100 + '%'; bx.style.width = w * 100 + '%'; bx.style.height = h * 100 + '%'; bx._b = { x: x, y: y, w: w, h: h }; });
    window.addEventListener('mouseup', function () { if (!start) return; if (bx && bx._b && bx._b.w > 0.02 && bx._b.h > 0.02) { set(bx._b); render(); } else if (bx) bx.remove(); start = null; bx = null; });
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
      var magicImg = S.magicImg || null;   // v4.0.6: the source the magic concept is cut from
      if (logo && S.logoImproved && S.logoImproved.img) { if (logo.main) { logo.main = S.logoImproved.img; logo.url = S.logoImproved.url; logo.nativeWidth = S.logoImproved.img.naturalWidth; } else if (logo.light) { logo.light = S.logoImproved.img; logo.lightUrl = S.logoImproved.url; } }   // v4.0.3: Improve
      var lp = (S.photo && S.usePhoto) ? S.photo : null;   // v2.7.1: the photo for the layouts (the whole ad only if you chose Use it)
      var photo = lp ? { img: lp.img, kind: lp.kind, url: lp.url || '', nativeWidth: lp.nativeWidth, subject: lp.subject || null, focus: null, cutout: !!lp.cutout, whole: false } : null;
      var wp = (S.whole && sameType()) ? { img: S.whole.img, kind: S.whole.kind, url: S.whole.url || '', nativeWidth: S.whole.nativeWidth, subject: null, focus: null, cutout: false, whole: true } : null;   // the ad as itself
      var w = {}; SLOTS.forEach(function (s) { w[s[0]] = (S._wOverride && S._wOverride[s[0]] != null) ? S._wOverride[s[0]] : (S.words[s[0]] || ''); });   // v4.0.5: a concept's own words
      return { magicImg: magicImg, name: c.name, wording: w, headlineSlot: (S.ed && S.ed.head) || 'headline', colors: { main: cl.main, accent: cl.accent }, fonts: { head: f.head, headWeight: f.headWeight, body: f.body }, logo: logo, photo: photo, asIs: wp, sourceType: S.srcType || '' };
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
      var all = ch[shape] || [], c = cust() || {}, asIsCodes = (IxAdLayouts.AS_IS || {})[shape] || [];
      var asIs = all.filter(function (q) { return asIsCodes.indexOf(q.layout) > -1; }), layouts = all.filter(function (q) { return asIsCodes.indexOf(q.layout) < 0; });
      var bgs = [''].concat((S.adColours || []).map(hex).filter(Boolean).slice(0, AD_COLOURS_MAX)); if (c.main && bgs.indexOf(hex(c.main)) < 0) bgs.push(hex(c.main));
      if (bgs.length === 1) bgs.push(INK);   // nothing found in the ad and no brand colour: still offer a dark version
      var custFonts = !!(fontOf(c.fontHead) && fontOf(c.fontBody)), pairs = custFonts ? [null] : FONT_PAIRS;
      var props = [], li = 0, pi = 0;
      // v2.7.1: the ad as itself (same type only; the engine leaves these out otherwise). With a band in up to
      // AS_IS_GROUNDS ground colours (brand main, brand accent, the colour round the ad's edge), then As it is, then Filled.
      if (asIs.length && input.asIs) {   // v3.0.0: one as-is direction, with a band in the brand main
        var bandQ = asIs.filter(function (q) { return q.layout.slice(-1) === 'B'; })[0] || asIs[0], srA = JSON.parse(JSON.stringify(bandQ)); if (hex(colours().main)) srA.bg = hex(colours().main);
        props.push({ key: 'asis', sr: srA, label: 'The ad as it is', what: 'The ' + (S.srcType || 'ad') + ' on file, with a band carrying the website and phone.' });
      }
      if (false) {
        var cl0 = colours(), grounds = [], gWord = {};
        [[cl0.main, 'brand main'], [cl0.accent, 'brand accent'], [IxAdLayouts.edgeColour ? IxAdLayouts.edgeColour(input.asIs.img) : '', 'the ad\u2019s edge']].forEach(function (v) { var h = hex(v[0]); if (h && grounds.indexOf(h) < 0) { grounds.push(h); gWord[h] = v[1]; } });
        grounds = grounds.slice(0, AS_IS_GROUNDS);
        var byEnd = function (e) { return asIs.filter(function (q) { return q.layout.slice(-1) === e; })[0]; };
        var band = byEnd('B'), fitW = byEnd('F'), fill = byEnd('C');
        if (band) (grounds.length ? grounds : ['']).forEach(function (gc) { var sr = JSON.parse(JSON.stringify(band)); if (gc) sr.bg = gc; props.push({ key: 'asis|' + band.layout + '|' + gc, sr: sr, label: 'the ad with a band' + (gc ? ' \u00b7 ' + gWord[gc] : '') + ' \u00b7 ' + band.layout }); });
        if (fitW) props.push({ key: 'asis|' + fitW.layout, sr: JSON.parse(JSON.stringify(fitW)), label: 'the ad as it is \u00b7 ' + fitW.layout });
        if (fill) props.push({ key: 'asis|' + fill.layout, sr: JSON.parse(JSON.stringify(fill)), label: 'the ad filled \u00b7 ' + fill.layout });
      }
      // v4.0.3: concepts for every ticked picture (none ticked: the concepts without a photo)
      var ticked = tickedPics(), sets = ticked.length ? ticked : [null], photo0 = S.photo, use0 = S.usePhoto;
      var mg = magicSr(shape); if (mg) { input.magicImg = S.magicImg; props.unshift({ key: 'magic', sr: mg, label: 'Magic resize', what: 'The ad itself, re-fitted to this shape. In Fine-tune: first remove what you don\u2019t want, then add things back.' }); }   // v4.0.6
      var jobs = props.map(function (q) { return { q: q, pic: null, input: input }; });
      return sets.reduce(function (pr, pic, pi) {
        return pr.then(function () {
          if (pic) { S.photo = Object.assign({}, pic); S.usePhoto = true; } else { S.usePhoto = false; }
          return layoutInput().then(function (inp) {
            var lay = (IxAdLayouts.choose(inp)[shape] || []).filter(function (q) { return asIsCodes.indexOf(q.layout) < 0; });
            directionsFor(shape, lay, custFonts).forEach(function (q) { var L0 = IxAdLayouts.LAYOUTS[q.sr.layout] || {}; if (pi > 0 && !L0.usesPhoto) return; q.label = q.label + (pic && L0.usesPhoto && sets.length > 1 ? ' \u00b7 picture ' + (pi + 1) : ''); jobs.push({ q: q, pic: L0.usesPhoto ? pic : null, input: inp }); });
          });
        });
      }, Promise.resolve()).then(function () {
        S.photo = photo0; S.usePhoto = use0;
        return Promise.all(jobs.map(function (j) { return IxAdLayouts.paint(j.input, j.q.sr).then(function (p) { return { sr: j.q.sr, paint: p, label: j.q.label, what: j.q.what || '', picRef: j.pic ? picKey(j.pic) : null, picImg: j.pic ? j.pic.img : null }; }); }));
      }).then(function (res) {
        S.drafts = { banner: shape === 'banner' ? res : [], sidebar: shape === 'sidebar' ? res : [], leftOut: ch.leftOut }; S.draftSig = inputSig();
      });
    }).catch(function (e) { S.draftErr = (e && e.message) || 'The drafts could not be painted.'; });
  }
  // v3.0.0 · HC-P-SSB8-5 / -6: the directions. Each is a layout the engine offered, with its own settings.
  // v4.0.6 · Magic resize: the source ad's own elements, in the new shape
  function magicSr(shape) {
    var lead = S.pool && S.pool.lead && S.pool.lead.snap; if (!lead) { var r0 = (S.srcs || [])[0]; lead = r0 && r0.snap; }
    var L = lead && lead.read && lead.read.layout; if (!L || !L.elements || !L.elements.length) return null;
    var src = lead.srcCanvas || lead.verImg; if (!src) return null;
    if (S.magicLead !== lead || !S.magicImg || !S.magicCl) { var raw = src.getContext ? src : imgToCanvas(src), cl0 = cleanSource(raw, L.elements); S.magicRaw = raw; S.magicImg = cl0.canvas; S.magicCl = cl0; S.magicLead = lead; }   // v4.0.7: once per source
    var cl = S.magicCl, style = {};
    var els = L.elements.map(function (e, i) {
      var b = e.bbox, o = { id: 'm' + i, x: b[0], y: b[1], w: b[2], h: b[3] };
      if (e.kind === 'text') { o.panel = cl.panelOf[i] != null ? 'm' + cl.panelOf[i] : false; if (cl.inPic[i]) { o.inPic = true; style[o.id] = { show: false }; } }   // v4.0.7
      if (e.kind === 'panel') return Object.assign(o, { k: 'panel', color: e.color, shape: e.shape });
      if (e.kind === 'image') return Object.assign(o, { k: 'image', src: [b[0], b[1], b[2], b[3]], what: e.what || e.label || 'picture', label: e.label || e.what || 'picture' });
      return Object.assign(o, { k: 'text', txt: e.text, font: e.font, weight: e.weight, italic: e.italic, color: e.color, align: e.align, lines: e.lines, role: e.role });
    });
    return { layout: shape === 'banner' ? 'MG' : 'MH', magic: { bg: L.background || '#FFFFFF', els: els }, sizes: {}, style: style };
  }
  function magicEl(x, id) { return x && x.sr && x.sr.magic ? x.sr.magic.els.filter(function (e) { return e.id === id; })[0] || null : null; }
  function magicName(x, id) { var m = magicEl(x, id); if (!m) return PIECE_WORDS[id] || id; if (m.k === 'text') { var t = String(m.txt || ''); return '\u201c' + (t.length > 34 ? t.slice(0, 32) + '\u2026' : t) + '\u201d' + (m.inPic && !m.cleared ? ' in the picture' : ''); } if (m.k === 'panel') return 'Box'; if (m.use === 'logo') return 'Customer logo'; return 'Picture \u00b7 ' + (m.label || m.what || ''); }
  function magicSuggestions(x) {   // the pink ones: long blocks to remove, small words to enlarge
    var out = []; if (!x || !x.sr.magic || !x.paint || !x.paint.fit) return out; x.sugNo = x.sugNo || {};
    var kt = x.paint.width / IxAdLayouts.CONST.DESIGN[IxAdLayouts.LAYOUTS[x.sr.layout].shape].w, step = mStepOf(x);
    if (step === 'add') return out;
    if (step === 'remove') {   // v4.0.7: only removals at step 1
      var els0 = x.sr.magic.els, grouped = {}, c0 = cust() || {};
      els0.forEach(function (p) {
        if (p.k !== 'panel' || !mShown(x, p.id) || x.sugNo['L' + p.id]) return;
        var kids = els0.filter(function (m) { return m.k === 'text' && m.panel === p.id && !m.inPic && mShown(x, m.id); }), nw0 = kids.reduce(function (a, m) { return a + String(m.txt || '').split(/\s+/).filter(Boolean).length; }, 0);
        if (kids.length > 1 && nw0 > SUGGEST_WORDS) { kids.forEach(function (m) { grouped[m.id] = 1; }); out.push({ id: p.id, no: 'L' + p.id, kind: 'lines', word: 'Remove its ' + kids.length + ' lines? ' + nw0 + ' words (the box stays)' }); }
      });
      if (c0.logo || c0.logoLight) els0.forEach(function (m) { if (m.k === 'image' && !m.use && /logo/i.test(String(m.what || '') + ' ' + String(m.label || '')) && mShown(x, m.id) && !x.sugNo[m.id]) out.push({ id: m.id, kind: 'remove', word: 'Remove? The customer\u2019s logo file is better' }); });
      els0.forEach(function (m) { if (m.k !== 'text' || m.inPic || grouped[m.id] || x.sugNo[m.id] || !mShown(x, m.id)) return; var nw1 = String(m.txt || '').split(/\s+/).filter(Boolean).length; if (nw1 > SUGGEST_WORDS) out.push({ id: m.id, kind: 'remove', word: 'Remove? It is ' + nw1 + ' words' }); });
      return out;
    }
    x.sr.magic.els.forEach(function (m) {
      if (m.k !== 'text' || x.sugNo[m.id]) return; var st = (x.sr.style && x.sr.style[m.id]) || {}; if (st.show === false) return;
      var nw = String(m.txt || '').split(/\s+/).filter(Boolean).length, f = x.paint.fit[m.id];
      if (f && f.size && f.size / kt < SUGGEST_PX && !(x.sr.sizes && x.sr.sizes[m.id] > 1)) out.push({ id: m.id, kind: 'larger', word: 'Larger? Small on a screen' });
    });
    return out;
  }
  // ── v4.0.7 · Magic resize: the cleaned source, Remove then Add back, Clean up ─────────────
  // HC-P-SSB8-14 · clearing the print words: the pad round a line (share of its line height, px cap), the ring read
  //   round it, how close a ring pixel must be to its median to count as flat, and the share that must be flat.
  var CLEAN_PAD = 0.22, CLEAN_PAD_MAX = 14, CLEAN_RING = 4, FLAT_TOL = 40, FLAT_SHARE = 0.7;
  // HC-P-SSB8-15 · where Add back puts a new box, line or logo (fractions of the ad)
  var NEW_BOX = { x: 0.25, y: 0.36, w: 0.5, h: 0.28 }, NEW_LINE = { x: 0.05, y: 0.72, w: 0.6, h: 0.11 }, NEW_LOGO = { x: 0.04, y: 0.04, w: 0.3, h: 0.2 };
  // HC-P-SSB8-16 · Clean up: zoom steps (actual pixels), the largest side sent to AI fill, the colour-select tolerance,
  //   the largest area (px²) Fill from around takes before it says to use AI fill, undo depth.
  var CU_ZOOMS = [0.25, 0.5, 1, 2, 4, 8], CU_AI_MAX = 1024, CU_WAND_TOL = 36, CU_AROUND_MAX = 160000, CU_UNDO = 12;
  function fluxUrl() { var cfg = CFG(); return cfg.fluxGen || (window.TA_CONFIG && window.TA_CONFIG.fluxGen) || 'https://fluxgen.jeff-2cd.workers.dev/'; }
  // The print words are cleared from the picture: on flat ground (a box, plain paper) each line is painted over with the
  // colour round it, inside its box if it sits in one; a box on flat ground is painted over too, so it can be moved,
  // resized or removed and nothing is left behind. Words on a photo or inside a logo stay in the picture (inPic): they
  // are not drawn again as live type unless asked, and Clean up can clear them.
  function cleanSource(raw, elements) {
    var W = raw.width, H = raw.height, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var g = cv.getContext('2d'); g.drawImage(raw, 0, 0);
    var out = { canvas: cv, inPic: {}, panelOf: {}, cleared: 0 }, id;
    try { id = g.getImageData(0, 0, W, H); } catch (e) { return out; }
    var d = id.data;
    var px = function (b) { return { x: Math.round(b[0] * W), y: Math.round(b[1] * H), w: Math.max(1, Math.round(b[2] * W)), h: Math.max(1, Math.round(b[3] * H)) }; };
    var full = { x: 0, y: 0, w: W, h: H };
    var inB = function (cx, cy, b) { return cx >= b[0] && cx <= b[0] + b[2] && cy >= b[1] && cy <= b[1] + b[3]; };
    var panels = [], pics = [];
    elements.forEach(function (e, i) { if (e.kind === 'panel') panels.push({ i: i, b: e.bbox }); else if (e.kind === 'image') pics.push({ i: i, b: e.bbox, what: String(e.what || '') + ' ' + String(e.label || '') }); });
    var picPx = pics.map(function (p) { return px(p.b); });
    var inPicPx = function (x, y) { for (var q = 0; q < picPx.length; q++) { var a = picPx[q]; if (x >= a.x && y >= a.y && x < a.x + a.w && y < a.y + a.h) return true; } return false; };
    var ring = function (r, lim) {
      var R = [], G = [], B = [];
      var take = function (x, y) { if (x < lim.x || y < lim.y || x >= lim.x + lim.w || y >= lim.y + lim.h || x < 0 || y < 0 || x >= W || y >= H || inPicPx(x, y)) return; var o = (y * W + x) * 4; R.push(d[o]); G.push(d[o + 1]); B.push(d[o + 2]); };
      var st = Math.max(1, Math.round((r.w + r.h) / 300)), x, y, k;
      for (k = 1; k <= CLEAN_RING; k++) {
        for (x = r.x - k; x < r.x + r.w + k; x += st) { take(x, r.y - k); take(x, r.y + r.h - 1 + k); }
        for (y = r.y; y < r.y + r.h; y += st) { take(r.x - k, y); take(r.x + r.w - 1 + k, y); }
      }
      if (R.length < 8) return null;
      var med = function (a) { var s = a.slice().sort(function (p, q) { return p - q; }); return s[s.length >> 1]; };
      var c = [med(R), med(G), med(B)], flat = 0;
      for (var i = 0; i < R.length; i++) if (Math.abs(R[i] - c[0]) <= FLAT_TOL && Math.abs(G[i] - c[1]) <= FLAT_TOL && Math.abs(B[i] - c[2]) <= FLAT_TOL) flat++;
      return { c: c, flat: flat / R.length };
    };
    var fill = function (r, c, lim) {
      var x0 = Math.max(r.x, lim.x, 0), y0 = Math.max(r.y, lim.y, 0), x1 = Math.min(r.x + r.w, lim.x + lim.w, W), y1 = Math.min(r.y + r.h, lim.y + lim.h, H);
      for (var y = y0; y < y1; y++) for (var x = x0; x < x1; x++) { if (inPicPx(x, y)) continue; var o = (y * W + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; }
    };
    elements.forEach(function (e, i) {
      if (e.kind !== 'text' || !Array.isArray(e.bbox)) return;
      var b = e.bbox, cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2, pan = null, pic = null;
      panels.forEach(function (p) { if (inB(cx, cy, p.b)) pan = p; });
      pics.forEach(function (p) { if (inB(cx, cy, p.b)) pic = p; });
      if (pan) out.panelOf[i] = pan.i;
      if (pic && !pan && /logo|badge|graphic|qr|seal|emblem/i.test(pic.what)) { out.inPic[i] = true; return; }   // a logo's own lettering is the logo
      var r = px(b), lh = r.h / Math.max(1, +e.lines || 1), pad = Math.max(2, Math.min(CLEAN_PAD_MAX, Math.round(lh * CLEAN_PAD)));
      r = { x: r.x - pad, y: r.y - pad, w: r.w + 2 * pad, h: r.h + 2 * pad };
      var lim = pan ? px(pan.b) : full, rg = ring(r, lim);
      if (rg && rg.flat >= FLAT_SHARE) { fill(r, rg.c, lim); out.cleared++; } else out.inPic[i] = true;
    });
    panels.forEach(function (p) {
      var r = px(p.b); r = { x: r.x - 2, y: r.y - 2, w: r.w + 4, h: r.h + 4 };
      var rg = ring(r, full); if (rg && rg.flat >= FLAT_SHARE) fill(r, rg.c, full);
    });
    g.putImageData(id, 0, 0);
    return out;
  }
  function mStepOf(x) { return x && x.sr && x.sr.magic ? (x.mstep || 'remove') : ''; }
  function mShown(x, id) { var st = x.sr.style && x.sr.style[id]; return !(st && st.show === false); }
  function mFill(x, m) { var st = (x.sr.style && x.sr.style[m.id]) || {}; return hex(st.fill) || hex(m.color) || '#FFFFFF'; }
  function mStepBar(x) {
    var cur = mStepOf(x), steps = [['remove', '1', 'Remove'], ['add', '2', 'Add back'], ['tune', '3', 'Fine-tune']];
    return '<div class="am-msteps">' + steps.map(function (s) { return '<button type="button" class="' + (cur === s[0] ? 'on' : '') + '" data-act="mStep" data-v="' + s[0] + '"><i>' + s[1] + '</i>' + s[2] + '</button>'; }).join('') + '</div>';
  }
  function mGroups(x) {   // boxes with their lines, pictures with the words inside them, then the loose lines
    var els = x.sr.magic.els, used = {}, groups = [];
    var inside = function (m, p) { var cx = m.x + m.w / 2, cy = m.y + m.h / 2; return cx >= p.x && cx <= p.x + p.w && cy >= p.y && cy <= p.y + p.h; };
    els.filter(function (m) { return m.k === 'panel'; }).forEach(function (p) { used[p.id] = 1; var kids = els.filter(function (m) { return m.k === 'text' && m.panel === p.id; }); kids.forEach(function (m) { used[m.id] = 1; }); groups.push({ head: p, kids: kids }); });
    els.filter(function (m) { return m.k === 'image'; }).forEach(function (p) { used[p.id] = 1; var kids = p.use ? [] : els.filter(function (m) { return m.k === 'text' && !used[m.id] && m.inPic && inside(m, p); }); kids.forEach(function (m) { used[m.id] = 1; }); groups.push({ head: p, kids: kids }); });
    var loose = els.filter(function (m) { return !used[m.id]; }); if (loose.length) groups.push({ head: null, kids: loose });
    return groups;
  }
  function magicRemoveHTML(x) {
    var e = S.ed, gone = 0;
    var row = function (m, kid) {
      var on = mShown(x, m.id), act;
      if (m.inPic) act = m.cleared ? '<span class="am-light">cleared from the picture</span>' : '<button type="button" class="am-mbtn" data-act="mClear" data-k="' + m.id + '" title="Paint these words out of the picture">Clear from picture</button>';
      else if (on) act = '<button type="button" class="am-mbtn" data-act="mRemove" data-k="' + m.id + '">Remove</button>';
      else { gone++; act = '<button type="button" class="am-mbtn back" data-act="mBack" data-k="' + m.id + '">Bring back</button>'; }
      return '<div class="am-mrow' + (kid ? ' kid' : '') + (on || m.inPic ? '' : ' gone') + (e.piece === m.id ? ' on' : '') + '"><span class="nm" data-act="pickPiece" data-v="' + m.id + '">' + (m.k === 'panel' ? '<i class="am-mdot" style="background:' + mFill(x, m) + ' !important"></i>' : '') + esc(magicName(x, m.id)) + '</span>' + act + '</div>';
    };
    var bgOn = mShown(x, 'mbg'); if (!bgOn) gone++;
    var bgRow = '<div class="am-mgrp"><div class="am-mrow' + (bgOn ? '' : ' gone') + '"><span class="nm"><i class="am-mdot" style="background:' + (hex(x.sr.magic.bg) || '#FFFFFF') + ' !important"></i>Background</span>' + (bgOn ? '<button type="button" class="am-mbtn" data-act="mRemove" data-k="mbg" title="The ad goes plain white">Remove</button>' : '<button type="button" class="am-mbtn back" data-act="mBack" data-k="mbg">Bring back</button>') + '</div></div>';
    var body = bgRow + mGroups(x).map(function (gp) { return '<div class="am-mgrp">' + (gp.head ? row(gp.head, false) : '<div class="am-mgh">Lines</div>') + gp.kids.map(function (m) { return row(m, !!gp.head); }).join('') + '</div>'; }).join('');
    return '<div class="am-mstep"><div class="am-mnote">What the reader rebuilt. Strike what you don\u2019t want; nothing is added at this step. A box and its lines go separately, so you can drop the words and keep the box.</div>' + body +
      '<div class="am-mfoot"><span class="am-light">' + (gone ? gone + ' removed' : 'Nothing removed yet') + '</span><button type="button" class="am-btn2 dark" data-act="mStep" data-v="add">Next: add back \u2192</button></div></div>';
  }
  function mBoxColours(x) {
    var out = [], add = function (v) { v = hex(v); if (v && out.indexOf(v) < 0) out.push(v); };
    x.sr.magic.els.forEach(function (m) { if (m.k === 'panel') add(m.color); }); add(x.sr.magic.bg); (S.adColours || []).forEach(add); var cl = colours(); add(cl.main); add(cl.accent); add(WHITE); add(INK);
    return out.slice(0, 10);
  }
  function magicAddHTML(x) {
    var e = S.ed, els = x.sr.magic.els, c = cust() || {}, selBox = magicEl(x, e.piece), into = selBox && selBox.k === 'panel' ? selBox : null;
    var back = els.filter(function (m) { return !m.inPic && !mShown(x, m.id); });
    var shownTxt = {}; els.forEach(function (m) { if (m.k === 'text' && (mShown(x, m.id) || !m.inPic)) shownTxt[String(m.txt || '').trim()] = 1; });   // shown, or already offered under Bring back
    var lines = (S.srcs || []).reduce(function (acc, r) { var L = r.snap && r.snap.read && r.snap.read.layout; (L && L.elements || []).forEach(function (el) { if (el.kind === 'text' && el.text) acc.push(el.text); }); return acc; }, []).concat(poolLines());
    var seen = {}, adds = lines.filter(function (l) { l = String(l || '').trim(); if (!l || seen[l] || shownTxt[l]) return false; seen[l] = 1; return true; });
    var contacts = [['phone', c.phone], ['website', c.website], ['email', c.email]].filter(function (q) { return q[1] && !shownTxt[String(q[1]).trim()]; });
    var hasLogo = !!(c.logo || c.logoLight || S.logoNewUrl), logoIn = els.some(function (m) { return m.use === 'logo' && mShown(x, m.id); });
    var sec = function (t, sub, body) { return body ? '<div class="am-msec"><div class="am-mgh">' + t + (sub ? ' <span class="am-light">' + sub + '</span>' : '') + '</div>' + body + '</div>' : ''; };
    return '<div class="am-mstep"><div class="am-mnote">Put back what the ad needs. Select a box on the ad first and a line goes into it.' + (into ? ' <b>Lines go into: ' + esc(magicName(x, into.id)) + '</b>' : '') + '</div>' +
      sec('Bring back', 'removed at step 1', (mShown(x, 'mbg') ? '' : '<button type="button" class="am-madd" data-act="mBack" data-k="mbg">+ Background</button>') + back.map(function (m) { return '<button type="button" class="am-madd" data-act="mBack" data-k="' + m.id + '">+ ' + esc(magicName(x, m.id)) + '</button>'; }).join('')) +
      sec('A box', 'in a colour from the ad', '<div class="am-swrow">' + mBoxColours(x).map(function (h) { return '<button type="button" class="am-swb" style="background:' + h + ' !important" data-act="mAddBox" data-v="' + h + '" title="Add a box in ' + h + '"></button>'; }).join('') + '</div>') +
      sec('Lines from the ad', 'every line the reader found', adds.map(function (l) { return '<button type="button" class="am-madd" data-act="mAddLine" data-v="' + esc(l) + '">+ ' + esc(l.length > 64 ? l.slice(0, 62) + '\u2026' : l) + '</button>'; }).join('')) +
      sec('From the customer record', '', (hasLogo && !logoIn ? '<button type="button" class="am-madd" data-act="mAddLogo">+ The customer\u2019s logo file</button>' : '') + contacts.map(function (q) { return '<button type="button" class="am-madd" data-act="mAddLine" data-v="' + esc(q[1]) + '">+ ' + esc(q[1]) + '</button>'; }).join('')) +
      '<div class="am-mfoot"><a href="#" class="am-up" data-act="mStep" data-v="remove">\u2190 Back to Remove</a><button type="button" class="am-btn2 dark" data-act="mStep" data-v="tune">Done: fine-tune \u2192</button></div></div>';
  }
  function mNewId(x) { return 'n' + (x.sr.magic.els.length + 1) + '_' + (Date.now() % 100000); }
  function mAddLine(x, text) {
    var into = magicEl(x, S.ed.piece); if (!into || into.k !== 'panel') into = null;
    var o = { id: mNewId(x), k: 'text', txt: text, font: 'sans', weight: 700, italic: false, color: null, align: 'left', lines: 1, added: true, panel: false };
    if (into) {
      var sibs = x.sr.magic.els.filter(function (m) { return m.k === 'text' && m.panel === into.id && mShown(x, m.id) && !m.inPic; });
      var bottom = sibs.reduce(function (a, m) { return Math.max(a, m.y + m.h); }, 0), y = bottom ? bottom + 0.006 : into.y + into.h * 0.08;
      var h = Math.min(NEW_LINE.h, into.y + into.h - y - 0.006); if (h < 0.04) { h = Math.min(NEW_LINE.h, into.h * 0.3); y = into.y + into.h - h - 0.006; }
      Object.assign(o, { x: into.x + into.w * 0.06, y: y, w: into.w * 0.88, h: h, panel: into.id, align: sibs[0] ? sibs[0].align : 'left', weight: sibs[0] ? sibs[0].weight : 700 });
    } else Object.assign(o, NEW_LINE);
    x.sr.magic.els.push(o); return o.id;
  }
  // ── Clean up: brush, box or colour select; fill with the colour round it, a colour, or AI fill. Zoom to 800%. ──
  function openCleanup(o) {
    var src = o.img.getContext ? o.img : imgToCanvas(o.img), W = src.width, H = src.height;
    var base = document.createElement('canvas'); base.width = W; base.height = H; var bg = base.getContext('2d'); bg.drawImage(src, 0, 0);
    var mask = document.createElement('canvas'); mask.width = W; mask.height = H; var mg = mask.getContext('2d');
    var cu = { tool: o.tool || 'brush', size: 24, zoom: 1, colour: '#FFFFFF', hist: [], busy: false, edited: false, picking: false };
    S.cu = cu;
    var root = document.createElement('div'); root.className = 'am-cu';
    root.innerHTML = '<div class="am-cuw" role="dialog" aria-label="Clean up"><div class="am-cuh"><b>Clean up</b><span class="am-light">' + esc(o.title || '') + '</span><a href="#" class="am-up am-cux" data-cu="cancel">cancel</a></div>' +
      '<div class="am-cut"><div class="am-seg">' + [['brush', 'Brush'], ['box', 'Box'], ['wand', 'Select a colour']].map(function (t) { return '<button type="button" data-cu="tool" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<label class="am-cusz">Size <input type="range" min="4" max="120" step="2" value="24" data-cu="size"></label><span class="sep"></span>' +
      '<button type="button" class="am-btn2" data-cu="zout">\u2212</button><span class="am-cuzv">100%</span><button type="button" class="am-btn2" data-cu="zin">+</button><button type="button" class="am-btn2" data-cu="fit">Fit</button><span class="sep"></span>' +
      '<button type="button" class="am-btn2" data-cu="undo">\u21b6 Undo</button><button type="button" class="am-btn2" data-cu="clear">Clear selection</button></div>' +
      '<div class="am-cuv"><div class="am-cuc"></div></div>' +
      '<div class="am-cuf"><span class="am-light">Fill the selection</span><button type="button" class="am-btn2" data-cu="around" title="Blend in from the pixels round it">From around</button>' +
      '<span class="am-cucol"><button type="button" class="am-btn2" data-cu="colour">With colour</button><input type="color" value="#FFFFFF" data-cu="col" aria-label="Fill colour"><button type="button" class="am-btn2" data-cu="eye" title="Pick the fill colour from the picture">\u2316</button></span>' +
      '<button type="button" class="am-btn2 dark" data-cu="ai" title="AI repaints the selection to match what is round it">AI fill</button><span class="am-custat"></span>' +
      '<span style="flex:1"></span><a href="#" class="am-up" data-cu="cancel">cancel</a><button type="button" class="am-btn2 dark" data-cu="use">Use this</button></div></div>';
    document.body.appendChild(root);
    var box = root.querySelector('.am-cuc'), view = root.querySelector('.am-cuv'), stat = root.querySelector('.am-custat');
    base.className = 'am-cuimg'; var ov = document.createElement('canvas'); ov.width = W; ov.height = H; ov.className = 'am-cuov'; var og = ov.getContext('2d');
    box.appendChild(base); box.appendChild(ov);
    var drawOv = function () { og.clearRect(0, 0, W, H); og.globalCompositeOperation = 'source-over'; og.drawImage(mask, 0, 0); og.globalCompositeOperation = 'source-in'; og.fillStyle = 'rgba(224,69,123,0.5)'; og.fillRect(0, 0, W, H); og.globalCompositeOperation = 'source-over'; };
    var snap = function () { var c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(base, 0, 0); var m = document.createElement('canvas'); m.width = W; m.height = H; m.getContext('2d').drawImage(mask, 0, 0); cu.hist.push({ b: c, m: m }); if (cu.hist.length > CU_UNDO) cu.hist.shift(); };
    var fitZ = function () { return Math.min((view.clientWidth - 24) / W, (view.clientHeight - 24) / H); };
    var setZoom = function (z, cx, cy) {
      var r = view.getBoundingClientRect(), fx = cx == null ? 0.5 : cx, fy = cy == null ? 0.5 : cy;
      var ax = (view.scrollLeft + view.clientWidth * fx) / (W * cu.zoom), ay = (view.scrollTop + view.clientHeight * fy) / (H * cu.zoom);
      cu.zoom = Math.max(0.05, Math.min(8, z)); box.style.width = Math.round(W * cu.zoom) + 'px'; box.style.height = Math.round(H * cu.zoom) + 'px';
      view.scrollLeft = ax * W * cu.zoom - view.clientWidth * fx; view.scrollTop = ay * H * cu.zoom - view.clientHeight * fy;
      root.querySelector('.am-cuzv').textContent = Math.round(cu.zoom * 100) + '%';
    };
    var focus = function (f) {   // fit a region (fractions) with room round it, centred
      var rw = f.w * W * 3, rh = f.h * H * 3, z = Math.min(8, Math.max(fitZ(), Math.min((view.clientWidth - 24) / Math.max(rw, 40), (view.clientHeight - 24) / Math.max(rh, 40))));
      cu.zoom = z; box.style.width = Math.round(W * z) + 'px'; box.style.height = Math.round(H * z) + 'px';
      view.scrollLeft = (f.x + f.w / 2) * W * z - view.clientWidth / 2; view.scrollTop = (f.y + f.h / 2) * H * z - view.clientHeight / 2;
      root.querySelector('.am-cuzv').textContent = Math.round(z * 100) + '%';
    };
    var paintTools = function () {
      root.querySelectorAll('[data-cu="tool"]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === cu.tool && !cu.picking); });
      root.querySelector('[data-cu="eye"]').classList.toggle('on', cu.picking);
      root.querySelector('.am-cusz').style.visibility = cu.tool === 'brush' ? 'visible' : 'hidden';
      box.style.cursor = cu.picking ? 'copy' : cu.tool === 'wand' ? 'pointer' : 'crosshair';
      root.querySelectorAll('[data-cu="around"],[data-cu="colour"],[data-cu="ai"],[data-cu="use"],[data-cu="undo"],[data-cu="clear"]').forEach(function (b) { b.disabled = cu.busy; });
    };
    var hasMask = function () { var b = maskBox(); return !!b; };
    var maskBox = function () {
      var md = mg.getImageData(0, 0, W, H).data, x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) if (md[(y * W + x) * 4 + 3] > 127) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    };
    var at = function (ev) { var r = base.getBoundingClientRect(); return { x: (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * H }; };
    var wand = function (p) {
      var bd = bg.getImageData(0, 0, W, H).data, md = mg.getImageData(0, 0, W, H), mdd = md.data, sx = Math.floor(p.x), sy = Math.floor(p.y); if (sx < 0 || sy < 0 || sx >= W || sy >= H) return;
      var o0 = (sy * W + sx) * 4, c = [bd[o0], bd[o0 + 1], bd[o0 + 2]], seen = new Uint8Array(W * H), stack = [sy * W + sx]; seen[sy * W + sx] = 1;
      while (stack.length) { var q = stack.pop(), qx = q % W, qy = (q - qx) / W, o = q * 4;
        if (Math.abs(bd[o] - c[0]) > CU_WAND_TOL || Math.abs(bd[o + 1] - c[1]) > CU_WAND_TOL || Math.abs(bd[o + 2] - c[2]) > CU_WAND_TOL) continue;
        mdd[o] = mdd[o + 1] = mdd[o + 2] = mdd[o + 3] = 255;
        if (qx > 0 && !seen[q - 1]) { seen[q - 1] = 1; stack.push(q - 1); } if (qx < W - 1 && !seen[q + 1]) { seen[q + 1] = 1; stack.push(q + 1); }
        if (qy > 0 && !seen[q - W]) { seen[q - W] = 1; stack.push(q - W); } if (qy < H - 1 && !seen[q + W]) { seen[q + W] = 1; stack.push(q + W); } }
      mg.putImageData(md, 0, 0);
      mg.save(); mg.globalCompositeOperation = 'source-over'; mg.shadowColor = '#fff'; mg.shadowBlur = 0; mg.restore();
    };
    var grow = function (n) {   // a pixel or two more round the selection, so no fringe of the old print is left
      var t = document.createElement('canvas'); t.width = W; t.height = H; var tg = t.getContext('2d');
      for (var dx = -n; dx <= n; dx++) for (var dy = -n; dy <= n; dy++) if (dx * dx + dy * dy <= n * n) tg.drawImage(mask, dx, dy);
      mg.drawImage(t, 0, 0);
    };
    var drag = null;
    box.addEventListener('mousedown', function (ev) {
      if (cu.busy || ev.button !== 0) return; ev.preventDefault(); var p = at(ev);
      if (cu.picking) { var pd = bg.getImageData(Math.max(0, Math.min(W - 1, Math.floor(p.x))), Math.max(0, Math.min(H - 1, Math.floor(p.y))), 1, 1).data; cu.colour = '#' + [pd[0], pd[1], pd[2]].map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('').toUpperCase(); root.querySelector('[data-cu="col"]').value = cu.colour; cu.picking = false; paintTools(); return; }
      snap();
      if (cu.tool === 'wand') { wand(p); drawOv(); return; }
      drag = { p0: p, last: p };
      if (cu.tool === 'brush') { mg.fillStyle = '#fff'; mg.beginPath(); mg.arc(p.x, p.y, cu.size / 2 / cu.zoom, 0, Math.PI * 2); mg.fill(); drawOv(); }
    });
    var mm = function (ev) {
      if (!drag) return; var p = at(ev);
      if (cu.tool === 'brush') { mg.strokeStyle = '#fff'; mg.lineWidth = cu.size / cu.zoom; mg.lineCap = 'round'; mg.beginPath(); mg.moveTo(drag.last.x, drag.last.y); mg.lineTo(p.x, p.y); mg.stroke(); drag.last = p; drawOv(); }
      else { drawOv(); og.strokeStyle = '#E0457B'; og.lineWidth = 2 / cu.zoom; og.strokeRect(Math.min(drag.p0.x, p.x), Math.min(drag.p0.y, p.y), Math.abs(p.x - drag.p0.x), Math.abs(p.y - drag.p0.y)); drag.last = p; }
    };
    var mu = function () { if (!drag) return; if (cu.tool === 'box') { var a = drag.p0, b = drag.last; mg.fillStyle = '#fff'; mg.fillRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y)); drawOv(); } drag = null; };
    window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
    view.addEventListener('wheel', function (ev) { if (!(ev.ctrlKey || ev.metaKey)) return; ev.preventDefault(); var r = view.getBoundingClientRect(); setZoom(cu.zoom * (ev.deltaY < 0 ? 1.25 : 0.8), (ev.clientX - r.left) / view.clientWidth, (ev.clientY - r.top) / view.clientHeight); }, { passive: false });
    var done = function () { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); document.removeEventListener('keydown', key, true); root.remove(); S.cu = null; };
    var key = function (ev) { if (ev.key === 'Escape') { ev.stopPropagation(); ev.preventDefault(); if (!cu.busy) done(); } else if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'z' || ev.key === 'Z')) { ev.stopPropagation(); ev.preventDefault(); undo(); } };
    document.addEventListener('keydown', key, true);
    var undo = function () { var h = cu.hist.pop(); if (!h) return; bg.clearRect(0, 0, W, H); bg.drawImage(h.b, 0, 0); mg.clearRect(0, 0, W, H); mg.drawImage(h.m, 0, 0); drawOv(); };
    var afterFill = function () { mg.clearRect(0, 0, W, H); drawOv(); cu.edited = true; };
    var fillColour = function () { var b = maskBox(); if (!b) { toast('Select something first: brush, box or a colour.', 'err'); return; } snap(); grow(1); var t = document.createElement('canvas'); t.width = W; t.height = H; var tg = t.getContext('2d'); tg.fillStyle = cu.colour; tg.fillRect(0, 0, W, H); tg.globalCompositeOperation = 'destination-in'; tg.drawImage(mask, 0, 0); bg.drawImage(t, 0, 0); afterFill(); };
    var fillAround = function () {
      var b = maskBox(); if (!b) { toast('Select something first: brush, box or a colour.', 'err'); return; }
      if (b.w * b.h > CU_AROUND_MAX) { toast('That is a large area: AI fill will do it better.', 'err'); return; }
      snap(); grow(1); b = maskBox();
      var x0 = Math.max(0, b.x - 2), y0 = Math.max(0, b.y - 2), w = Math.min(W, b.x + b.w + 2) - x0, h = Math.min(H, b.y + b.h + 2) - y0;
      var im = bg.getImageData(x0, y0, w, h), d = im.data, md = mg.getImageData(x0, y0, w, h).data, known = new Uint8Array(w * h), i, todo = 0;
      for (i = 0; i < w * h; i++) { known[i] = md[i * 4 + 3] > 127 ? 0 : 1; if (!known[i]) todo++; }
      var guard = 0;
      while (todo > 0 && guard++ < 2000) {
        var next = [];
        for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var q = y * w + x; if (known[q]) continue; var r = 0, g = 0, bl = 0, n = 0;
          for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var xx = x + dx, yy = y + dy; if ((dx || dy) && xx >= 0 && yy >= 0 && xx < w && yy < h && known[yy * w + xx]) { var o = (yy * w + xx) * 4; r += d[o]; g += d[o + 1]; bl += d[o + 2]; n++; } }
          if (n) next.push(q, r / n, g / n, bl / n); }
        if (!next.length) break;
        for (i = 0; i < next.length; i += 4) { var oo = next[i] * 4; d[oo] = next[i + 1]; d[oo + 1] = next[i + 2]; d[oo + 2] = next[i + 3]; d[oo + 3] = 255; known[next[i]] = 1; todo--; }
      }
      bg.putImageData(im, x0, y0); afterFill();
    };
    var aiFill = function () {
      var b = maskBox(); if (!b) { toast('Select something first: brush, box or a colour.', 'err'); return; }
      snap(); grow(2); b = maskBox();
      var pad = Math.max(48, Math.round(Math.max(b.w, b.h) * 0.5)), rx = Math.max(0, b.x - pad), ry = Math.max(0, b.y - pad), rw = Math.min(W, b.x + b.w + pad) - rx, rh = Math.min(H, b.y + b.h + pad) - ry;
      var k = Math.min(1, CU_AI_MAX / Math.max(rw, rh)), sw = Math.max(32, Math.round(rw * k)), sh = Math.max(32, Math.round(rh * k));
      var ic = document.createElement('canvas'); ic.width = sw; ic.height = sh; ic.getContext('2d').drawImage(base, rx, ry, rw, rh, 0, 0, sw, sh);
      var mc = document.createElement('canvas'); mc.width = sw; mc.height = sh; var mcg = mc.getContext('2d'); mcg.fillStyle = '#000'; mcg.fillRect(0, 0, sw, sh); var mw = document.createElement('canvas'); mw.width = sw; mw.height = sh; var mwg = mw.getContext('2d'); mwg.drawImage(mask, rx, ry, rw, rh, 0, 0, sw, sh); mwg.globalCompositeOperation = 'source-in'; mwg.fillStyle = '#fff'; mwg.fillRect(0, 0, sw, sh); mcg.drawImage(mw, 0, 0);
      cu.busy = true; paintTools(); var t0 = Date.now(), tick = setInterval(function () { stat.textContent = 'AI fill\u2026 ' + Math.round((Date.now() - t0) / 1000) + 's'; }, 500);
      var stop = function (msg) { clearInterval(tick); cu.busy = false; stat.textContent = ''; paintTools(); if (msg) { undo(); toast('AI fill: ' + msg, 'err'); } };
      fetch(fluxUrl(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'fill', image: ic.toDataURL('image/png'), mask: mc.toDataURL('image/png') }) })
        .then(function (r) { return r.json(); }).then(function (j) {
          if (!j || !j.url) throw new Error((j && j.error) || 'nothing came back.');
          return loadImg(j.url).then(function (im) {
            if (!im) throw new Error('the filled picture would not load.');
            var t = document.createElement('canvas'); t.width = rw; t.height = rh; var tg = t.getContext('2d'); tg.drawImage(im, 0, 0, rw, rh);
            var fm = document.createElement('canvas'); fm.width = rw; fm.height = rh; var fg = fm.getContext('2d'); if ('filter' in fg) fg.filter = 'blur(1.5px)'; fg.drawImage(mask, rx, ry, rw, rh, 0, 0, rw, rh);
            tg.globalCompositeOperation = 'destination-in'; tg.drawImage(fm, 0, 0); bg.drawImage(t, rx, ry); stop(); afterFill();
          });
        }).catch(function (e) { stop((e && e.message) || 'the fill service could not be reached.'); });
    };
    root.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-cu]'); if (!t || t.tagName === 'INPUT') return; ev.preventDefault(); var a = t.getAttribute('data-cu');
      if (cu.busy && a !== 'cancel') return;
      if (a === 'cancel') { if (cu.busy) return; done(); }
      else if (a === 'tool') { cu.tool = t.getAttribute('data-v'); cu.picking = false; paintTools(); }
      else if (a === 'zin' || a === 'zout') { var zs = CU_ZOOMS.concat([fitZ()]).sort(function (p, q) { return p - q; }), i = 0; if (a === 'zin') { while (i < zs.length && zs[i] <= cu.zoom + 1e-3) i++; setZoom(zs[Math.min(zs.length - 1, i)]); } else { i = zs.length - 1; while (i >= 0 && zs[i] >= cu.zoom - 1e-3) i--; setZoom(zs[Math.max(0, i)]); } }
      else if (a === 'fit') setZoom(fitZ());
      else if (a === 'undo') undo();
      else if (a === 'clear') { snap(); mg.clearRect(0, 0, W, H); drawOv(); }
      else if (a === 'eye') { cu.picking = !cu.picking; paintTools(); }
      else if (a === 'colour') fillColour();
      else if (a === 'around') fillAround();
      else if (a === 'ai') aiFill();
      else if (a === 'use') { if (!cu.edited) { done(); return; } var outc = document.createElement('canvas'); outc.width = W; outc.height = H; outc.getContext('2d').drawImage(base, 0, 0); done(); o.onUse(outc); }
    });
    root.querySelector('[data-cu="size"]').addEventListener('input', function (ev) { cu.size = +ev.target.value; });
    root.querySelector('[data-cu="col"]').addEventListener('input', function (ev) { cu.colour = ev.target.value; });
    if (o.preMask) { var pm = o.preMask; mg.fillStyle = '#fff'; mg.fillRect(pm.x * W, pm.y * H, pm.w * W, pm.h * H); }
    drawOv(); paintTools();
    requestAnimationFrame(function () { if (o.focus) focus(o.focus); else setZoom(fitZ()); });
    return cu;
  }
  function mPadBox(m) { var lh = m.h / Math.max(1, +m.lines || 1), p = Math.max(0.004, lh * CLEAN_PAD); return { x: m.x - p, y: m.y - p, w: m.w + 2 * p, h: m.h + 2 * p }; }
  function cleanMagic(id, pre) {
    var fx = forward(), m = fx && magicEl(fx, id); if (!S.magicImg) { toast('There is no picture to clean here.', 'err'); return; }
    var f = m ? (m.k === 'image' && m.src ? { x: m.src[0], y: m.src[1], w: m.src[2], h: m.src[3] } : mPadBox(m)) : null;
    openCleanup({ img: S.magicImg, title: m ? magicName(fx, id) + ' \u00b7 the ad\u2019s own picture (every piece cut from it changes)' : 'the ad\u2019s own picture', focus: f, preMask: pre ? f : null, tool: pre ? 'brush' : 'brush',
      onUse: function (cv) { S.magicImg = cv; if (m && pre) allCards().forEach(function (y) { var mm2 = magicEl(y, id); if (mm2) mm2.cleared = true; }); repaintAll(); render(); toast('Cleaned. Every piece cut from the ad now uses it.', 'ok'); } });
  }
  function cleanPhoto() {
    var fx = forward(), p0 = S.photo; if (!p0 || !p0.img) { toast('There is no photo to clean here.', 'err'); return; }
    openCleanup({ img: p0.img, title: (p0.label || 'the photo') + ' \u00b7 a cleaned copy goes beside the original', onUse: function (cv) {
      var maxI = (S.pics || []).reduce(function (a, q) { return Math.max(a, +q.i || 0); }, 0);
      var np = Object.assign({}, p0, { img: cv, url: '', mediaId: null, i: maxI + 1, label: (p0.label || 'picture') + ' \u00b7 cleaned', nativeWidth: cv.width });
      S.pics = (S.pics || []).concat([np]); S.photo = Object.assign({}, np); S.usePhoto = true; if (fx) { pushHist(); fx.picRef = picKey(np); fx.picImg = cv; repaint(fx); } render(); toast('Cleaned copy added beside the original.', 'ok');
    } });
  }
  function directionsFor(shape, layouts, custFonts) {
    var cl = colours(), main = hex(cl.main) || INK, acc = hex(cl.accent) || '', out = [];
    var get = function (code) { var q = layouts.filter(function (z) { return z.layout === code && !(z.crop && z.crop.mode === 'close'); })[0]; return q ? JSON.parse(JSON.stringify(q)) : null; };
    var alt = FONT_PAIRS[1] || FONT_PAIRS[0];
    var B = shape === 'banner';
    var plan = [
      { code: B ? 'BP' : 'SP', label: 'Photo with words', what: B ? 'The photo on the left, the words re-set beside it.' : 'The photo across the top, the words below it.', set: function (sr) { } },
      { code: B ? 'BR' : 'SQ', label: 'Photo behind \u00b7 white panel', what: 'The photo fills the ad; the headline and its line sit together on one white panel.', set: function (sr) { sr.behind = { op: 0.75 }; sr.shared = { color: '#FFFFFF' }; sr.plate = true; } },
      { code: B ? 'BB' : 'SB', label: 'Words and logo', what: 'No photo. The accent colour, a thin frame, a different headline font.', set: function (sr) { if (acc) sr.bg = acc; sr.border = { w: 3, color: main }; if (!custFonts && alt) { sr.style = sr.style || {}; sr.style.headline = { font: alt.head, weight: alt.headWeight }; IxAdLayouts.ensureFont(alt.head); } } },
      { code: B ? 'BS' : 'SL', label: 'Headline on a panel', what: 'The headline on its own ' + (acc ? 'accent' : 'white') + ' panel; rounded corners.', set: function (sr) { sr.style = sr.style || {}; sr.style.headline = { fill: acc || '#FFFFFF' }; sr.radius = 'round'; } }
    ];
    plan.forEach(function (d) { var sr = get(d.code); if (!sr) return; d.set(sr); out.push({ key: 'dir|' + d.code, sr: sr, label: d.label, what: d.what }); });
    if (out.length < 3) [B ? 'BL' : 'SB', B ? 'BB' : 'SL'].forEach(function (code) { if (out.length >= 3 || out.some(function (o) { return o.sr.layout === code; })) return; var sr = get(code); if (sr) out.push({ key: 'dir|' + code + '|plain', sr: sr, label: 'Logo led', what: 'The logo first, the words beside it, the brand main colour.' }); });
    return out;
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
  function canvasView(cv, w, fit) { var i = document.createElement('img'); i.src = cv.toDataURL('image/png'); if (fit) { i.style.maxWidth = '100%'; i.style.maxHeight = '100%'; i.style.width = 'auto'; i.style.height = 'auto'; } else i.style.width = w + 'px'; i.style.display = 'block'; i.draggable = false; return i; }   // v4.0.4: fit keeps the shape

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
    var items = (S.drafts[shape] || []).map(function (d) { n++; return { id: n, picRef: d.picRef || null, picImg: d.picImg || null, sr: JSON.parse(JSON.stringify(d.sr)), sr0: JSON.parse(JSON.stringify(d.sr)), paint: d.paint, label: d.label || shapeLabel(shape), what: d.what || '', kept: false }; });
    S.ed = { B: shape === 'banner' ? items : [], S: shape === 'sidebar' ? items : [], sel: shape, b: -1, s: -1, next: n + 1, piece: null, head: S.input.headlineSlot || 'headline', head0: S.input.headlineSlot || 'headline', w0: JSON.parse(JSON.stringify(S.words)), scope: 'one', palette: [] };
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
  function each(fn) { var ts = targets(); if (!ts.length) return; if (!S._noHist) pushHist(); ts.forEach(fn); repaint(ts[0]); }   // v4.0.0: every change can be undone
  function cardLabel(x) { return shapeLabel(cardShape(x)) + ' \u00b7 ' + (x.label || ''); }
  function curShape(shape) { var e = S.ed; return shape === 'banner' ? e.B[e.b] : e.S[e.s]; }
  function changeCount() {
    var e = S.ed, n = 0; if (!e) return 0;
    if (e.head !== e.head0) n++;
    ['supporting', 'button', 'phone', 'website', 'small_print', 'business', 'headline2'].forEach(function (k) { if (S.words[k] !== e.w0[k]) n++; });
    e.B.concat(e.S).forEach(function (x) { if (JSON.stringify(x.sr) !== JSON.stringify(x.sr0)) n++; });
    return n;
  }
  var paintTimer = null;
  var PAINTING = false, PAINT_NEXT = null;   // v4.0.2: one paint at a time; the latest request wins
  function repaint(x, shape) {
    if (paintTimer) clearTimeout(paintTimer);
    paintTimer = setTimeout(function () {
      if (PAINTING) { PAINT_NEXT = x; return; }
      PAINTING = true; usePicOf(x); S._wOverride = x && x.words ? x.words : null;   // v4.0.3: its own picture · v4.0.5: its own words
      layoutInput().then(function (input) { S._wOverride = null; S.input = input; return IxAdLayouts.paint(input, x.sr); }).then(function (p) { x.paint = p; drawStage(); drawShortlist(); fontRetry(x, p); }).catch(function (e) { S._wOverride = null; toast(e.message, 'err'); })
        .then(function () { PAINTING = false; if (PAINT_NEXT) { var nx = PAINT_NEXT; PAINT_NEXT = null; repaint(nx); } });
    }, 40);
  }
  // v2.1.0: a font that was still loading at paint time gets one more paint once the browser has it
  function fontRetry(x, p) {
    if (!p || !p.checks || !document.fonts || x._fontRetry) return;
    if (!p.checks.some(function (c) { return /^font-/.test(c.id); })) return;
    x._fontRetry = true;
    document.fonts.ready.then(function () { setTimeout(function () { if (S.ed && allCards().indexOf(x) > -1) repaint(x); }, 400); });
  }
  function repaintAll() {   // v4.0.5: each concept with its own picture and words
    var items = S.ed ? S.ed.B.concat(S.ed.S) : [], fx = forward(), chain = Promise.resolve();
    items.forEach(function (x) { chain = chain.then(function () { usePicOf(x); S._wOverride = x.words || null; return layoutInput().then(function (input) { S._wOverride = null; return IxAdLayouts.paint(input, x.sr).then(function (p) { x.paint = p; }); }); }); });
    chain.then(function () { if (fx) usePicOf(fx); S._wOverride = fx && fx.words ? fx.words : null; return layoutInput(); }).then(function (input) { S._wOverride = null; S.input = input; drawStage(); drawShortlist(); }).catch(function (e) { S._wOverride = null; toast(e.message, 'err'); });
  }
  function sizesHTML(x) {
    return PIECES.map(function (p) { var k = p[0], v = x.sr.sizes[k] || 1, ch = Math.abs(v - 1) > 0.001;
      return '<div class="am-szr' + (ch ? ' dirty' : '') + '"><span class="n">' + p[1] + '</span><input type="range" min="' + IxAdLayouts.CONST.SIZE_MIN + '" max="' + IxAdLayouts.CONST.SIZE_MAX + '" step="0.05" value="' + v + '" data-sz="' + k + '"><span class="v">' + Math.round(v * 100) + '%</span>' + (ch ? revert('szCancel', ' data-k="' + k + '"') : '<span class="am-revert"></span>') + '</div>'; }).join('');
  }
  // v1.2.0 · per-piece style helpers
  function pieceOf(sr, k) { if (!sr.style) sr.style = {}; if (!sr.style[k]) sr.style[k] = {}; return sr.style[k]; }
  function tidy(sr, k) { var st = sr.style && sr.style[k]; if (st) { Object.keys(st).forEach(function (q) { if (st[q] === '' || st[q] == null || st[q] === false && q !== 'show' || ((q === 'dy' || q === 'dx' || q === 'dw' || q === 'dh') && !st[q]) || (q === 'show' && st[q] === true)) delete st[q]; }); if (!Object.keys(st).length) delete sr.style[k]; } if (sr.style && !Object.keys(sr.style).length) delete sr.style; }
  function pieceSlots(x) {   // the pieces this layout actually carries, as [key, label]
    var L = IxAdLayouts.LAYOUTS[x.sr.layout], out = [], seen = {}, e = S.ed;
    (L.els || []).concat(extrasOf(x)).forEach(function (el) { var k = el.k === 'chip' || el.k === 'lbox' ? 'logo' : el.k === 'button' ? 'button' : el.k === 'text' ? (el.slot === 'headline' ? e.head : el.slot) : ''; if (!k || seen[k]) return; if (k !== 'logo' && k !== 'button' && !S.words[k]) return; if (k === 'button' && !S.words.button) return; seen[k] = 1; out.push([k, PIECE_WORDS[k] || k]); });
    return out;
  }
  function extrasOf(x) { return IxAdLayouts.extraEls ? IxAdLayouts.extraEls(IxAdLayouts.LAYOUTS[x.sr.layout], x.sr) : []; }   // v2.7.0: pieces added to this proposal
  function addable(x) {   // slots with words that this layout does not draw and that are not yet added
    var L = IxAdLayouts.LAYOUTS[x.sr.layout], has = {}; (L.els || []).forEach(function (el) { if (el.k === 'text') has[el.slot] = 1; });
    return (IxAdLayouts.CONST.EXTRA_SLOTS || []).filter(function (k) { var st = (x.sr.style || {})[k] || {}; var word = k === 'headline2' ? S.words[S.ed.head === 'headline' ? 'headline2' : 'headline'] : S.words[k]; return !has[k] && st.show !== true && !!word; });
  }
  function isExtra(x, k) { var L = IxAdLayouts.LAYOUTS[x.sr.layout]; return (IxAdLayouts.CONST.EXTRA_SLOTS || []).indexOf(k) > -1 && !(L.els || []).some(function (el) { return el.k === 'text' && el.slot === k; }); }
  function styleKey(x, piece) { return piece === 'headline2' && !isExtra(x, 'headline2') ? 'headline' : piece; }   // the layout's headline slot paints whichever headline is chosen
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
      '<div class="am-ctl"><div class="am-lab">Position</div><div class="am-nudge"><button type="button" data-act="nudge" data-v="-1" title="Up ' + IxAdLayouts.CONST.NUDGE_STEP + 'px">\u2191</button><button type="button" data-act="nudge" data-v="1" title="Down ' + IxAdLayouts.CONST.NUDGE_STEP + 'px">\u2193</button><button type="button" data-act="nudgeX" data-v="-1" title="Left ' + IxAdLayouts.CONST.NUDGE_STEP + 'px">\u2190</button><button type="button" data-act="nudgeX" data-v="1" title="Right ' + IxAdLayouts.CONST.NUDGE_STEP + 'px">\u2192</button><span class="v' + (st.dy || st.dx ? ' on' : '') + '">' + (st.dy || st.dx ? (st.dx ? (st.dx > 0 ? '\u2192' : '\u2190') + Math.abs(st.dx) + ' ' : '') + (st.dy ? (st.dy > 0 ? '\u2193' : '\u2191') + Math.abs(st.dy) : '') + ' px' : 'in place') + '</span></div></div>' +
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
  // v4.0.0: select, drag, resize, snap, a floating toolbar. Boxes are the ones each piece was drawn in.
  var HITS = [];
  function drawPieceOverlay() {
    var e = S.ed, x = curShape(e.sel), el = document.getElementById('am-st'); if (!x || !el) return;
    var img = el.querySelector('img'); if (!img) return;
    var L = IxAdLayouts.LAYOUTS[x.sr.layout], D = IxAdLayouts.CONST.DESIGN[L.shape], r = img.getBoundingClientRect(), er = el.getBoundingClientRect(), k = r.width / D.w;
    var ox = r.left - er.left, oy = r.top - er.top;   // the picture's place inside the stage
    var RH = x.paint && x.paint.width ? r.width * x.paint.height / x.paint.width : (r.height || D.h * k);   // v4.0.2: the ad's height even before the picture has laid out
    el.querySelectorAll('.am-hit,.am-ftb,.am-guide,.am-sug').forEach(function (n) { n.remove(); });
    el.style.position = 'relative'; HITS = [];
    var kb = x.paint && x.paint.width ? r.width / x.paint.width : k;
    if (x.sr.magic) drawSuggestions(x, el, ox, oy, kb);   // v4.0.6
    (IxAdLayouts.elsFor ? IxAdLayouts.elsFor(L, x.sr) : L.els || []).forEach(function (q) {
      var key = q.k === 'mrect' || q.k === 'mimg' ? q.id : q.magic ? q.slot : q.k === 'chip' || q.k === 'lbox' ? 'logo' : q.k === 'button' ? 'button' : q.k === 'text' ? (q.slot === 'headline' ? e.head : q.slot) : q.k === 'photo' ? 'photo' : '';
      if (!key) return; var isMagic = !!(q.magic || q.k === 'mrect' || q.k === 'mimg'); if (isMagic && x.sr.style && x.sr.style[key] && x.sr.style[key].show === false) return;
      if (!isMagic && key !== 'logo' && key !== 'photo' && key !== 'headline2' && !S.words[key]) return;
      if (key === 'photo' && !(S.input && S.input.photo)) return;
      var left = q.x * k, top = q.y * k, w = (q.w || q.maxw || 160) * k, h = (q.h || 40) * k;
      var fq = x.paint && x.paint.fit && q.k === 'text' ? x.paint.fit[q.slot] : null, stq = (x.sr.style && x.sr.style[styleKey(x, key)]) || {};
      var fb = x.paint && x.paint.fit ? ((q.k === 'mrect' || q.k === 'mimg') ? (x.paint.fit[key] || {}).box : key === 'logo' ? x.paint.fit.logoBox : q.k === 'button' ? (x.paint.fit.button || {}).box : key === 'photo' ? null : (fq && fq.cell && (stq.dw || stq.dh) ? fq.cell : (fq || {}).box)) : null;   // v4.0.3: a widened box shows as set
      if (fb) { left = fb.x * kb; top = fb.y * kb; w = fb.w * kb; h = fb.h * kb; }
      var d = document.createElement('div'); d.className = 'am-hit' + (key === e.piece ? ' on' : '') + (key === 'photo' ? ' photo' : ''); d.setAttribute('data-act', 'pickPiece'); d.setAttribute('data-v', key); d.title = key === 'photo' ? 'Photo: drag to move it inside its frame' : (isMagic ? magicName(x, key) : (PIECE_WORDS[key] || key)) + ': drag to move';
      d.style.cssText = 'left:' + (ox + left - 3) + 'px;top:' + (oy + top - 3) + 'px;width:' + (w + 6) + 'px;height:' + (h + 6) + 'px';
      el.appendChild(d);
      var hit = { key: key, l: left, t: top, w: w, h: h, el: d }; if (key !== 'photo') HITS.push(hit);
      d.addEventListener('mousedown', function (ev) {
        if (ev.button) return; ev.preventDefault(); ev.stopPropagation(); pushHist(); S._noHist = true;
        if (key === 'photo') { if (!x.sr.crop) return; DRAG = { pic: img, x: x, sx: ev.clientX, sy: ev.clientY, cx: x.sr.crop.cx, cy: x.sr.crop.cy, sel: 'photo' }; return; }
        var st = (x.sr.style && x.sr.style[styleKey(x, key)]) || {}; e.piece = key;
        DRAG = { move: true, key: key, x: x, sx: ev.clientX, sy: ev.clientY, box: hit, dx0: +st.dx || 0, dy0: +st.dy || 0, k: k, W: r.width, H: RH, ox: ox, oy: oy, el: d, stage: el };
      });
      if (key === e.piece && key !== 'photo') {
        var hd = document.createElement('div'); hd.className = 'am-handle'; hd.title = 'Drag to resize';
        d.appendChild(hd);
        hd.addEventListener('mousedown', function (ev) { ev.preventDefault(); ev.stopPropagation(); pushHist(); S._noHist = true; var kk = styleKey(x, key); DRAG = { resize: true, key: key, x: x, sx: ev.clientX, box: hit, s0: (x.sr.sizes && x.sr.sizes[kk] != null) ? x.sr.sizes[kk] : 1, W: r.width, H: RH, el: d }; });
        if (key !== 'logo' && key !== 'button' && q.k !== 'mimg' && q.k !== 'mrect') ['w', 'h'].forEach(function (ax) {   // v4.0.2: give the words room
          var eh = document.createElement('div'); eh.className = 'am-edge ' + ax; eh.title = ax === 'w' ? 'Drag to make the box wider' : 'Drag to make the box taller'; d.appendChild(eh);
          eh.addEventListener('mousedown', function (ev) { ev.preventDefault(); ev.stopPropagation(); pushHist(); S._noHist = true; var st0 = (x.sr.style && x.sr.style[styleKey(x, key)]) || {}; DRAG = { edge: ax, key: key, x: x, sx: ev.clientX, sy: ev.clientY, box: hit, d0: +(ax === 'w' ? st0.dw : st0.dh) || 0, k: k, W: r.width, H: RH, el: d }; });
        });
      }
      if (key === e.piece) {   // the floating toolbar
        var tb = document.createElement('div'); tb.className = 'am-ftb';
        tb.innerHTML = toolbarHTML(x, key);
        var ty = oy + RH + 12;   // v4.0.2: under the ad, never over it (the picture may not have laid out yet)
        tb.style.cssText = 'left:' + Math.max(0, Math.min(ox + left, er.width - 420)) + 'px;top:' + ty + 'px';
        tb.addEventListener('mousedown', function (ev) { ev.stopPropagation(); });
        el.appendChild(tb);
        var tbw = tb.offsetWidth; if (tbw > er.width - 8) { tb.style.flexWrap = 'wrap'; tb.style.whiteSpace = 'normal'; tb.style.maxWidth = (er.width - 8) + 'px'; tbw = tb.offsetWidth; } tb.style.left = Math.max(4, Math.min(ox + (r.width - tbw) / 2, er.width - tbw - 4)) + 'px';   // kept inside the stage
      }
    });
  }
  // v4.0.3 · Improve: just this picture through the upscale Worker (submit, then poll), Before / After
  function upscaleUrl() { var cfg = CFG(); return cfg.upscaleWorker || (window.TA_CONFIG && window.TA_CONFIG.upscaleWorker) || 'https://upscaleinbxifycom.jeff-2cd.workers.dev/'; }
  function picOfKey(pk) { if (pk === 'magic') return S.magicImg; if (pk === 'logo') { var lg = S.input && S.input.logo; return lg ? (lg.main || lg.light) : null; } return S.photo && S.photo.img; }
  function improvePicture(pk) {
    var src = picOfKey(pk); if (!src) { toast('There is no picture to improve here.', 'err'); return; }
    S.improve = S.improve || {}; var st = S.improve[pk] = { busy: true, secs: 0, before: src, url: '', on: false, img: null }; render();
    var cv = src.getContext ? src : imgToCanvas(src), data = cv.toDataURL('image/png'), t0 = Date.now(), url = upscaleUrl(), ctx = { source_surface: 'ad-maker-improve' };
    var fail = function (m) { st.busy = false; delete S.improve[pk]; toast('Improve: ' + m, 'err'); render(); };
    var tick = setInterval(function () { st.secs = Math.round((Date.now() - t0) / 1000); var v = document.querySelector('#' + MOUNT_ID + ' .am-ftb .v'); if (v && st.busy) v.textContent = 'Improving\u2026 ' + st.secs + 's'; }, 1000);
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'submit', source: { type: 'base64', data: data }, scale: IMPROVE_SCALE, face_restore: false, context: ctx }) })
      .then(function (r) { return r.json(); }).then(function (j) {
        if (!j || j.ok !== true || !j.vendor_request_id) throw new Error((j && j.error && j.error.message) || 'the upscale service did not take the picture.');
        var poll = function () {
          if (Date.now() - t0 > IMPROVE_CAP_MS) { clearInterval(tick); fail('it is taking more than 3 minutes. Try again.'); return; }
          fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'poll', vendor_request_id: j.vendor_request_id, context: ctx }) })
            .then(function (r) { return r.json(); }).then(function (q) {
              if (!q || q.ok !== true) { clearInterval(tick); fail((q && q.error && q.error.message) || 'the upscale failed.'); return; }
              if (q.phase === 'processing') { setTimeout(poll, IMPROVE_POLL_MS); return; }
              var u = q.upscaled && q.upscaled.url; if (!u) { clearInterval(tick); fail('no picture came back.'); return; }
              loadImg(u).then(function (im) { clearInterval(tick); if (!im) { fail('the improved picture would not load.'); return; } st.busy = false; st.url = u; st.img = im; st.on = true; applyImprove(pk); toast('Improved. Compare with Before / After.', 'ok'); });
            }).catch(function () { setTimeout(poll, IMPROVE_POLL_MS); });
        };
        setTimeout(poll, IMPROVE_POLL_MS);
      }).catch(function (e) { clearInterval(tick); fail(e.message || 'the upscale service could not be reached.'); });
  }
  function applyImprove(pk) {
    var st = S.improve && S.improve[pk]; if (!st) return;
    var use = st.on ? st.img : st.before;
    if (pk === 'magic') { S.magicImg = use; }   // v4.0.6: every picture cut from the ad gets sharper
    else if (pk === 'logo') { S.logoImproved = st.on ? { img: st.img, url: st.url } : null; }
    if (pk !== 'magic' && pk !== 'logo' && S.ticks) S.ticks = S.ticks.map(function (k) { return k === st.before || k === st.img ? use : k; });   // the tick follows the picture
    else { var p = (S.pics || []).filter(function (q) { return q.img === st.before || q.img === st.img; })[0]; if (p) { p.img = use; p.url = st.on ? st.url : (p.url === st.url ? '' : p.url); p.nativeWidth = use.naturalWidth || use.width; } if (S.photo) { S.photo.img = use; S.photo.url = p ? p.url : S.photo.url; S.photo.nativeWidth = use.naturalWidth || use.width; } var fx = S.ed && forward(); if (fx) fx.picImg = use; }
    repaintAll(); render();
  }
  function drawSuggestions(x, el, ox, oy, kb) {   // v4.0.6
    magicSuggestions(x).forEach(function (sg) {
      var f = x.paint.fit[sg.id], b = f && (f.cell || f.box); if (!b) return;
      var d = document.createElement('div'); d.className = 'am-sug'; d.style.cssText = 'left:' + (ox + b.x * kb - 4) + 'px;top:' + (oy + b.y * kb - 4) + 'px;width:' + (b.w * kb + 8) + 'px;height:' + (b.h * kb + 8) + 'px';
      var chip = document.createElement('div'); chip.className = 'am-sugchip'; chip.innerHTML = '<span>' + esc(sg.word) + '</span><button type="button" data-act="sugYes" data-k="' + sg.id + '" data-v="' + sg.kind + '">Yes</button><button type="button" data-act="sugNo" data-k="' + (sg.no || sg.id) + '">No</button>';
      chip.addEventListener('mousedown', function (ev) { ev.stopPropagation(); });
      d.appendChild(chip); el.appendChild(d);
    });
  }
  function toolbarHTML(x, key) {
    var mEl = magicEl(x, key), st = (x.sr.style && x.sr.style[styleKey(x, key)]) || {}, name = mEl ? magicName(x, key) : key === 'photo' ? 'Photo' : (PIECE_WORDS[key] || key), h = '<span class="nm">' + esc(name) + '</span><span class="sep"></span>';
    var pal = swatchList().map(function (q) { return q[0]; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).slice(0, 6);
    var cornerSeg = function (pk) { var cur = ((x.sr.style && x.sr.style[pk]) || {}).corner || 'square'; return '<span class="sep"></span>' + [['square', 'Square'], ['rounded', 'Rounded'], ['round', 'Round']].map(function (o) { return '<button type="button" class="' + (cur === o[0] ? 'on' : '') + '" data-act="pCorner" data-k="' + pk + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join(''); };   // v4.0.3
    var impr = function (pk) { var st2 = S.improve && S.improve[pk]; return '<span class="sep"></span>' + (st2 && st2.busy ? '<span class="v">Improving\u2026 ' + (st2.secs || 0) + 's</span>' : st2 && st2.url ? '<button type="button" class="' + (st2.on ? 'on' : '') + '" data-act="pImproveShow" data-k="' + pk + '" data-v="after">After</button><button type="button" class="' + (st2.on ? '' : 'on') + '" data-act="pImproveShow" data-k="' + pk + '" data-v="before">Before</button>' : '<button type="button" data-act="pImprove" data-k="' + pk + '" title="Sharpen just this picture">Improve</button>'); };
    if (mEl && mEl.k === 'image') return h + '<button type="button" data-act="pSize" data-v="-0.1">\u2212</button><span class="v">' + Math.round(((x.sr.sizes && x.sr.sizes[key]) || 1) * 100) + '%</span><button type="button" data-act="pSize" data-v="0.1">+</button>' + cornerSeg(key) + (mEl.use ? '' : impr('magic') + '<button type="button" data-act="mCleanPic" data-k="' + key + '" title="Paint out what you don\u2019t want">Clean up</button>') + '<span class="sep"></span><button type="button" data-act="pHide">' + (mStepOf(x) === 'tune' ? 'Hide' : 'Remove') + '</button><button type="button" data-act="pReset" data-k="' + key + '">Reset</button>';   // v4.0.6
    if (mEl && mEl.k === 'panel') return h + '<button type="button" class="sw' + (!st.fill ? ' on' : '') + '" style="background:' + (mEl.color || '#fff') + ' !important" data-act="pFill" data-k="' + key + '" data-v="" title="As read"></button>' + pal.map(function (c) { return '<button type="button" class="sw' + (hex(st.fill) === c ? ' on' : '') + '" style="background:' + c + ' !important" data-act="pFill" data-k="' + key + '" data-v="' + c + '"></button>'; }).join('') + '<span class="sep"></span><button type="button" data-act="pHide">' + (mStepOf(x) === 'tune' ? 'Hide' : 'Remove') + '</button><button type="button" data-act="pReset" data-k="' + key + '">Reset</button>';
    if (key === 'photo') h += '<button type="button" data-act="pZoom" data-v="-0.1">Zoom \u2212</button><span class="v">' + Math.round(((x.sr.crop && x.sr.crop.zoom) || 1) * 100) + '%</span><button type="button" data-act="pZoom" data-v="0.1">Zoom +</button><button type="button" data-act="pFit">Fit</button>' + cornerSeg('photo') + impr('photo') + '<button type="button" data-act="pCleanPhoto" title="Paint out what you don\u2019t want; a cleaned copy goes beside the original">Clean up</button>';
    else if (key === 'logo') { var pl = typeof x.sr.plate === 'boolean' ? (x.sr.plate ? 'on' : 'off') : 'auto'; h += '<button type="button" data-act="pSize" data-v="-0.1">\u2212</button><span class="v">' + Math.round(((x.sr.sizes && x.sr.sizes.logo) || 1) * 100) + '%</span><button type="button" data-act="pSize" data-v="0.1">+</button><span class="sep"></span>' + ['auto', 'on', 'off'].map(function (v) { return '<button type="button" class="' + (pl === v ? 'on' : '') + '" data-act="platePick" data-v="' + v + '">Plate ' + v + '</button>'; }).join('') + cornerSeg('logo') + impr('logo'); }
    else {
      var f = fontsFor(), auto = mEl ? 'As in the ad' : (key === 'headline' || key === 'headline2' ? f.head : f.body), cur = st.font || '';
      var fams = FONT_PAIRS.map(function (p) { return p.head; }).concat(FONT_LIST).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).slice(0, 14);
      h += '<select data-pf="' + key + '" aria-label="Font"><option value="">' + esc(auto) + '</option>' + fams.map(function (fm) { return '<option value="' + esc(fm) + '"' + (fm === cur ? ' selected' : '') + '>' + esc(fm) + '</option>'; }).join('') + '</select>' +
        '<button type="button" data-act="pSize" data-v="-0.05" aria-label="Smaller">A\u2212</button><span class="v">' + Math.round(((x.sr.sizes && x.sr.sizes[styleKey(x, key)]) || 1) * 100) + '%</span><button type="button" data-act="pSize" data-v="0.05" aria-label="Larger">A+</button><span class="sep"></span>' +
        '<button type="button" class="sw none' + (!st.color ? ' on' : '') + '" data-act="pcColour" data-k="' + key + '" data-v="" title="By contrast">\u2205</button>' + pal.map(function (c) { return '<button type="button" class="sw' + (hex(st.color) === c ? ' on' : '') + '" style="background:' + c + ' !important" data-act="pcColour" data-k="' + key + '" data-v="' + c + '" aria-label="' + c + '"></button>'; }).join('');
    }
    return h + '<span class="sep"></span>' + (key === 'photo' ? '' : '<button type="button" data-act="pHide" title="' + (mEl && mStepOf(x) !== 'tune' ? 'Remove' : 'Hide') + ' (Delete)">' + (mEl && mStepOf(x) !== 'tune' ? 'Remove' : 'Hide') + '</button>') + '<button type="button" data-act="pReset" data-k="' + key + '">Reset</button>';
  }
  function guide(stage, vert, pos) { var g = document.createElement('div'); g.className = 'am-guide ' + (vert ? 'v' : 'h'); g.style[vert ? 'left' : 'top'] = pos + 'px'; stage.appendChild(g); }
  function nudgePiece(dxd, dyd) {   // keyboard: move the selected piece, kept inside the ad
    var e = S.ed, key = e && e.piece; if (!key || key === 'photo') return;
    var hit = HITS.filter(function (q) { return q.key === key; })[0], x = forward(); if (!hit || !x) return;
    var L = IxAdLayouts.LAYOUTS[x.sr.layout], D = IxAdLayouts.CONST.DESIGN[L.shape], img = document.querySelector('#am-st img'); if (!img) return;
    var r = img.getBoundingClientRect(), k = r.width / D.w;
    var rh = x.paint && x.paint.width ? r.width * x.paint.height / x.paint.width : r.height;
    var nl = clamp(hit.l + dxd * k, 0, r.width - hit.w), nt = clamp(hit.t + dyd * k, 0, rh - hit.h);
    each(function (y) { var pp = pieceOf(y.sr, styleKey(y, key)); pp.dx = Math.round((+pp.dx || 0) + (nl - hit.l) / k); pp.dy = Math.round((+pp.dy || 0) + (nt - hit.t) / k); tidy(y.sr, styleKey(y, key)); });
    render();
  }
  function onKeyFT(ev) {
    if (S.screen !== 'finetune' || !S.ed || S.cu) return;   // v4.0.7: not while Clean up is open
    var tg = ev.target && ev.target.tagName; if (tg === 'INPUT' || tg === 'SELECT' || tg === 'TEXTAREA') return;
    if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'z' || ev.key === 'Z')) { ev.preventDefault(); var b0 = document.querySelector('#' + MOUNT_ID + ' [data-act="' + (ev.shiftKey ? 'redo' : 'undo') + '"]'); if (b0) b0.click(); return; }
    if (!S.ed.piece) return;
    var step = ev.shiftKey ? 10 : 2, mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[ev.key];
    if (mv) { ev.preventDefault(); nudgePiece(mv[0], mv[1]); return; }
    if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); var hb = document.querySelector('#' + MOUNT_ID + ' .am-ftb [data-act="pHide"]'); if (hb) hb.click(); return; }
    if (ev.key === 'Escape') { S.ed.piece = null; render(); }
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
    if (b2) h += '<div class="am-ctl"><div class="am-lab">Panel 2 <span class="am-light">' + Math.round((b2.w || 0.35) * 100) + '% of the ' + (b2.side === 'top' || b2.side === 'bottom' ? 'height' : 'width') + ' \u00b7 drag the split on the stage</span></div>' + paletteHTML(hex(b2.color) || '', 'bg2Colour', 'bg2') +
      '<div class="am-zoomrow" style="margin-top:6px"><input type="range" min="0.05" max="0.8" step="0.01" value="' + (b2.w || 0.35) + '" data-st="bg2w"><span class="v">' + Math.round((b2.w || 0.35) * 100) + '%</span></div>' +
      seg('bg2Side', ['left', 'right', 'top', 'bottom'].indexOf(b2.side) > -1 ? b2.side : 'right', [['left', 'Left'], ['right', 'Right'], ['top', 'Top'], ['bottom', 'Bottom']]) + '</div>';
    h += '<div class="am-ctl"><div class="am-lab">Add a colour to the palette</div><div class="am-swrow"><input type="color" data-st="palPick" value="#000000"><input class="am-inp" data-st="palAdd" placeholder="#hex, then Enter" maxlength="7" style="height:28px !important;width:110px !important;font-size:12px !important"></div></div></div>';
    return h;
  }
  function arrangementGroupHTML(x) {
    var shape = cardShape(x), L = IxAdLayouts.LAYOUTS, codes = Object.keys(L).filter(function (c) { return L[c].shape === shape && (L[c].asIs ? !!(S.input && S.input.asIs) : (!L[c].usesPhoto || (S.input && S.input.photo))); });   // v2.7.1: as-is only for a same-type source
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
  // v3.0.0 · Pick: a few directions, large. Keep one as it is, or take one into Fine-tune.
  // v3.0.0: which recipe keys each Fine-tune group owns (for its gold dot and its cancel)
  // v3.0.1: every wording line with a Show tick (off hides it on this ad; on adds a line the layout does not carry)
  function wordRows(x) {
    if (x.sr.magic) return x.sr.magic.els.filter(function (m) { return m.k === 'text'; }).map(function (m) { return '<div class="am-wrow"><div class="am-lab">' + esc(magicName(x, m.id)) + '</div><textarea class="am-inp am-mtxt" data-mt="' + m.id + '" rows="' + Math.min(4, Math.max(1, Math.ceil(String(m.txt || '').length / 48))) + '">' + esc(m.txt || '') + '</textarea></div>'; }).join('');   // v4.0.6: the ad's own words, editable
    var e = S.ed, carried = {}; (IxAdLayouts.LAYOUTS[x.sr.layout].els || []).forEach(function (el) { if (el.k === 'text') carried[el.slot === 'headline' ? e.head : el.slot] = 1; if (el.k === 'button') carried.button = 1; });   // the layout's own places
    var EXTRA = (IxAdLayouts.CONST.EXTRA_SLOTS || []);
    return SLOTS.map(function (sl) {
      var k = sl[0], st = (x.sr.style && x.sr.style[styleKey(x, k)]) || {}, ch = S.words[k] !== e.w0[k];
      var canAdd = EXTRA.indexOf(k) > -1, onAd = carried[k] ? st.show !== false : (canAdd && st.show === true);
      var tickable = carried[k] || canAdd;
      var vars = (S.variants && S.variants[k]) || [];
      var varSel = vars.length > 1 ? '<select class="am-sel am-varsel" data-var="' + k + '" title="Other sources say it differently" style="height:26px !important;font-size:11.5px !important;width:100% !important;margin-top:4px"><option value="">Other sources: ' + (vars.length - 1) + ' more version' + (vars.length > 2 ? 's' : '') + '</option>' + vars.map(function (q) { return '<option value="' + esc(q.v) + '">From ' + esc(q.from) + ': ' + esc(q.v.slice(0, 70)) + '</option>'; }).join('') + '</select>' : '';
      return '<div class="am-wrow"><div class="am-lab">' + esc(sl[1]) + (ch ? revert('fCancel', ' data-k="' + k + '"') : '') +
        (tickable ? '' : '<span class="am-light" style="margin-left:auto;font-size:11px">this layout has no place for it</span>') + '</div>' +   // v4.0.3: show or hide lives in Elements
        inp('data-f="' + k + '"', (x.words && x.words[k] != null) ? x.words[k] : S.words[k], ch) + varSel + '</div>';
    }).join('');
  }
  // ── v4.0.0 · Canva-style Fine-tune ───────────────────────
  function histBar() {
    var e = S.ed;
    return '<div class="am-hist"><button type="button" class="am-btn2" data-act="undo"' + ((e.hist || []).length ? '' : ' disabled') + ' title="Undo (\u2318Z)">\u21b6 Undo</button><button type="button" class="am-btn2" data-act="redo"' + ((e.fut || []).length ? '' : ' disabled') + ' title="Redo (\u21e7\u2318Z)">\u21b7 Redo</button><button type="button" class="am-btn2" data-act="resetAll">Reset all</button></div>';
  }
  function layerKeys(x) { var ks = pieceSlots(x).map(function (q) { return q[0]; }); if (S.input && S.input.photo && (IxAdLayouts.LAYOUTS[x.sr.layout] || {}).usesPhoto) ks.push('photo'); return ks; }
  function magicLayersHTML(x) {   // v4.0.6: the ad's own elements, and every line the reader found to put back
    var e = S.ed, openE = e.elOpen !== false, shownTxt = {};
    var rows = x.sr.magic.els.map(function (m) {
      var st = (x.sr.style && x.sr.style[m.id]) || {}, shown = st.show !== false; if (m.k === 'text' && shown) shownTxt[String(m.txt || '').trim()] = 1;
      return '<div class="am-ly' + (e.piece === m.id ? ' on' : '') + (shown ? '' : ' off') + '"><span class="nm" data-act="pickPiece" data-v="' + m.id + '">' + esc(magicName(x, m.id)) + '</span>' +
        '<button type="button" data-act="layerEyeM" data-k="' + m.id + '" title="' + (shown ? 'Hide' : 'Show') + '">' + (shown ? '\u25cf' : '\u25cc') + '</button><button type="button" data-act="pReset" data-k="' + m.id + '" title="Reset">\u21ba</button></div>';
    }).join('');
    var lines = poolLines().concat((S.srcs || []).reduce(function (acc, r) { var L = r.snap && r.snap.read && r.snap.read.layout; (L && L.elements || []).forEach(function (el) { if (el.kind === 'text' && el.text) acc.push(el.text); }); return acc; }, []));
    var seen = {}, adds = lines.filter(function (l) { l = String(l || '').trim(); if (!l || seen[l] || shownTxt[l]) return false; seen[l] = 1; return true; });
    return '<div class="am-acc' + (openE ? ' am-accopen' : '') + ' am-elacc"><button type="button" class="am-acch" data-act="elToggle"><span>Elements</span><span class="pm">' + (openE ? '\u2212' : '+') + '</span></button>' +
      (openE ? '<div class="am-layers">' + rows + '</div><div class="am-note" style="margin-top:6px">To put things back, go to <a href="#" class="am-up" data-act="mStep" data-v="add">2 Add back</a>.</div>' : '') +   // v4.0.7
      '</div><div class="am-wholehd">The whole ad</div>';
  }
  function layersHTML(x) {
    if (x.sr.magic) return magicLayersHTML(x);
    var e = S.ed, carried = {}; (IxAdLayouts.LAYOUTS[x.sr.layout].els || []).forEach(function (el) { if (el.k === 'text') carried[el.slot === 'headline' ? e.head : el.slot] = 1; if (el.k === 'button') carried.button = 1; if (el.k === 'chip' || el.k === 'lbox') carried.logo = 1; });
    var all = SLOTS.map(function (sl) { return sl[0]; }).concat(['logo']).filter(function (k) { return carried[k] || (IxAdLayouts.CONST.EXTRA_SLOTS || []).indexOf(k) > -1; });
    if (S.input && S.input.photo && (IxAdLayouts.LAYOUTS[x.sr.layout] || {}).usesPhoto) all.unshift('photo');
    var openE = S.ed.elOpen !== false;   // v4.0.3: Elements opens and closes like the groups
    return '<div class="am-acc' + (openE ? ' am-accopen' : '') + ' am-elacc"><button type="button" class="am-acch" data-act="elToggle"><span>Elements</span><span class="pm">' + (openE ? '\u2212' : '+') + '</span></button>' + (openE ? '<div class="am-layers">' + all.map(function (k) {
      var st = (x.sr.style && x.sr.style[styleKey(x, k)]) || {}, extra = isExtra(x, k), shown = k === 'photo' ? true : extra ? st.show === true : st.show !== false;
      var empty = k !== 'logo' && k !== 'photo' && !S.words[k];
      return '<div class="am-ly' + (e.piece === k ? ' on' : '') + (shown && !empty ? '' : ' off') + '"><span class="nm" data-act="pickPiece" data-v="' + k + '">' + esc(k === 'photo' ? 'Photo' : PIECE_WORDS[k] || k) + (empty ? ' <i>no words</i>' : '') + '</span>' +
        (k === 'photo' ? '' : '<button type="button" data-act="layerEye" data-k="' + k + '" title="' + (shown ? 'Hide' : 'Show') + '" aria-label="' + (shown ? 'Hide' : 'Show') + ' ' + esc(PIECE_WORDS[k] || k) + '">' + (shown ? '\u25cf' : '\u25cc') + '</button>') +
        '<button type="button" data-act="pReset" data-k="' + k + '" title="Reset this piece" aria-label="Reset ' + esc(PIECE_WORDS[k] || k) + '">\u21ba</button></div>';
    }).join('') + '</div>' : '') + '</div><div class="am-wholehd">The whole ad</div>';
  }
  function foundPicsHTML() {
    var pics = (S.pics || []).map(function (p, i) { return { p: p, i: i }; }).filter(function (q) { return !q.p.whole; }); if (!pics.length) return '';
    later(function () { document.querySelectorAll('#' + MOUNT_ID + ' [data-fpcv]').forEach(function (el) { var p = S.pics[+el.getAttribute('data-fpcv')]; if (p && p.img) { el.innerHTML = ''; el.appendChild(canvasView(p.img.getContext ? p.img : imgToCanvas(p.img), 56, true)); } }); });
    var fx2 = S.ed && forward(); return '<div class="am-lab">The photo, from the sources</div><div class="am-ppics">' + pics.map(function (q) { return '<button type="button" class="am-ppic' + ((fx2 && fx2.picImg ? fx2.picImg === q.p.img : (S.photo && S.photo.img === q.p.img)) && S.usePhoto ? ' on' : '') + '" data-pick="' + q.i + '" data-fpcv="' + q.i + '" title="' + esc(q.p.label || 'piece') + '"></button>'; }).join('') + '</div>';
  }
  function snapHist() { var e = S.ed, x = forward(); if (!e || !x) return null; return JSON.stringify({ id: x.id, sr: x.sr, words: S.words, head: e.head }); }
  function pushHist() { var e = S.ed, sn = snapHist(); if (!sn) return; e.hist = (e.hist || []).concat([sn]).slice(-60); e.fut = []; }
  function applySnap(sn) { var o = JSON.parse(sn), e = S.ed, x = itemById(o.id); if (!x) return; x.sr = o.sr; S.words = o.words; e.head = o.head; repaintAll(); }
  function grpKeys(k) { return { words: [], colours: ['bg', 'bg2', 'style'], type: ['style', 'sizes'], space: ['align'], picture: ['crop', 'layout', 'behind'], panels: ['shared', 'style'], logo: ['plate', 'sizes'], frame: ['border', 'radius'] }[k] || []; }
  function grpDirty(x, k) {
    var e = S.ed, d = function (a, b) { return JSON.stringify(a === undefined ? null : a) !== JSON.stringify(b === undefined ? null : b); };
    var stv = function (sr, prop) { var o = {}; Object.keys((sr.style || {})).forEach(function (pk) { var v = sr.style[pk] && sr.style[pk][prop]; if (v) o[pk] = v; }); return o; };
    if (k === 'words') return SLOTS.some(function (sl) { return S.words[sl[0]] !== e.w0[sl[0]]; }) || e.head !== e.head0;
    if (k === 'colours') return d(x.sr.bg, x.sr0.bg) || d(x.sr.bg2, x.sr0.bg2) || d(stv(x.sr, 'color'), stv(x.sr0, 'color'));
    if (k === 'type') return d(stv(x.sr, 'font'), stv(x.sr0, 'font')) || d(x.sr.sizes, x.sr0.sizes);
    if (k === 'space') return d(x.sr.align, x.sr0.align);
    if (k === 'picture') return d(x.sr.crop, x.sr0.crop) || d(x.sr.layout, x.sr0.layout) || d(x.sr.behind, x.sr0.behind);
    if (k === 'panels') return d(x.sr.shared, x.sr0.shared) || d(stv(x.sr, 'fill'), stv(x.sr0, 'fill'));
    if (k === 'logo') return d(x.sr.plate, x.sr0.plate);
    if (k === 'frame') return d(x.sr.border, x.sr0.border) || d(x.sr.radius, x.sr0.radius);
    return false;
  }
  // ── v4.0.5 · Ask for a concept ───────────────────────────
  function askPanel() {
    var a = S.ask = S.ask || { text: '', busy: false, err: '', target: null, hints: false, listening: false }, tg = a.target ? itemById(a.target) : null;
    return '<div class="am-ask"><div class="am-askh"><b>Ask for a concept</b><span class="am-light">Type or say what you want. It is made only from the pool: these ads\u2019 colours, pictures and words.</span><button type="button" class="am-info" data-act="askHints" title="Phrasing that works" aria-label="Phrasing that works">i</button></div>' +
      (a.hints ? '<div class="am-askhints">' + ASK_HINTS.map(function (hh) { return '<button type="button" data-act="askUse" data-v="' + esc(hh) + '">' + esc(hh) + '</button>'; }).join('') + '</div>' : '') +
      (tg ? '<div class="am-asktarget">Changing <b>' + esc(tg.label) + '</b> \u00b7 the original stays. <a href="#" class="am-up" data-act="askClear">Make new concepts instead</a></div>' : '') +
      '<div class="am-askrow"><textarea id="am-askt" rows="2" placeholder="e.g. Keep her photo and the logo, drop the green box, use just one line from it"' + (a.busy ? ' disabled' : '') + '>' + esc(a.text) + '</textarea>' +
      '<button type="button" class="am-mic' + (a.listening ? ' on' : '') + '" data-act="askMic" title="Say it" aria-label="Say it">' + (a.listening ? '\u25a0' : '\ud83c\udf99') + '</button>' +
      '<button type="button" class="am-btn2 dark" data-act="askGo"' + (a.busy || !a.text.trim() ? ' disabled' : '') + '>' + (a.busy ? 'Making\u2026' : tg ? 'Change it' : 'Make concepts') + '</button></div>' +
      (a.err ? '<div class="am-err" style="margin-top:8px">' + esc(a.err) + '</div>' : '') + '</div>';
  }
  var REC = null;
  function askMic() {
    var a = S.ask; var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('This browser cannot take dictation; type it, or use the Mac\u2019s dictation key.', 'err'); return; }
    if (a.listening && REC) { REC.stop(); return; }
    REC = new SR(); REC.lang = 'en-US'; REC.continuous = true; REC.interimResults = true; var base = a.text ? a.text.replace(/\s+$/, '') + ' ' : '';
    REC.onresult = function (ev) { var txt = ''; for (var i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript; a.text = base + txt; var ta = document.getElementById('am-askt'); if (ta) ta.value = a.text; var go = document.querySelector('#' + MOUNT_ID + ' [data-act="askGo"]'); if (go) go.disabled = !a.text.trim(); };
    REC.onend = function () { a.listening = false; REC = null; render(); };
    REC.onerror = function (ev) { a.listening = false; toast('Dictation stopped: ' + (ev.error || 'unknown'), 'err'); };
    a.listening = true; REC.start(); render();
  }
  function poolColourList() { var out = []; (S.srcs || []).forEach(function (r) { if (r.snap) (r.snap.adColours || []).forEach(function (cc) { var h0 = hex(cc); if (h0 && out.indexOf(h0) < 0) out.push(h0); }); }); (S.adColours || []).forEach(function (cc) { var h0 = hex(cc); if (h0 && out.indexOf(h0) < 0) out.push(h0); }); var cl = colours(); [cl.main, cl.accent].forEach(function (cc) { var h0 = hex(cc); if (h0 && out.indexOf(h0) < 0) out.push(h0); }); return out; }
  function poolLines() { var out = []; SLOTS.forEach(function (sl) { var vs = (S.variants && S.variants[sl[0]]) || []; if (!vs.length && S.words[sl[0]]) vs = [{ v: S.words[sl[0]] }]; vs.forEach(function (q) { if (q.v && out.indexOf(q.v) < 0) out.push(q.v); }); }); return out; }
  function wordsFromPool(txt, lines) {   // every word must already be in the pool's words: lines may be cut, nothing added
    var bag = {}; lines.join(' ').toLowerCase().replace(/[^a-z0-9@.'\- ]+/g, ' ').split(/\s+/).forEach(function (w) { if (w) bag[w.replace(/^[.'\-]+|[.'\-]+$/g, '')] = 1; });
    return String(txt || '').toLowerCase().replace(/[^a-z0-9@.'\- ]+/g, ' ').split(/\s+/).every(function (w) { w = w.replace(/^[.'\-]+|[.'\-]+$/g, ''); return !w || bag[w]; });
  }
  function askGo() {
    var a = S.ask, cfg = CFG(), shape = S.shape || 'banner', tg = a.target ? itemById(a.target) : null;
    if (!cfg.anthropicProxy) { a.err = 'TA_CONFIG.anthropicProxy is missing on this page, so there is no one to ask.'; render(); return; }
    var lead = S.pool && S.pool.lead && S.pool.lead.snap, srcCv = lead && (lead.srcCanvas || lead.verImg) || S.srcCanvas, img64 = '';
    try { if (srcCv) { var sc0 = scaled(srcCv.getContext ? srcCv : imgToCanvas(srcCv), 1200); img64 = sc0.toDataURL('image/jpeg', 0.85).split(',')[1]; } } catch (e) { img64 = ''; }
    var cols = poolColourList(), lines = poolLines(), pics = (S._poolPics || (S.pics || []).filter(function (p) { return !p.whole; }));
    var fonts = FONT_PAIRS.map(function (p) { return p.head; }).concat(FONT_PAIRS.map(function (p) { return p.body; }), FONT_LIST).filter(function (v, i, arr) { return v && arr.indexOf(v) === i; }).slice(0, 24);
    var lays = Object.keys(IxAdLayouts.LAYOUTS).filter(function (k) { var L = IxAdLayouts.LAYOUTS[k]; return L.shape === shape && !L.asIs; }).map(function (k) { var L = IxAdLayouts.LAYOUTS[k]; return k + ': ' + (L.label || L.name || k) + (L.usesPhoto ? ' (has a photo place)' : ' (no photo)') + '; places: ' + (L.els || []).filter(function (e) { return e.k === 'text' || e.k === 'button'; }).map(function (e) { return e.slot || e.k; }).join(', '); });
    var words = {}; SLOTS.forEach(function (sl) { var vs = (S.variants && S.variants[sl[0]]) || []; words[sl[0]] = vs.length ? vs.map(function (q) { return q.v; }) : (S.words[sl[0]] ? [S.words[sl[0]]] : []); });
    var system = 'You design small newsletter ads for local businesses inside an ad editor. You answer ONLY with JSON, no prose, no code fences. ' +
      'Make at most ' + ASK_MAX + ' concepts for a ' + shape + ' (' + (shape === 'banner' ? '700 x 235' : '480 x 400') + ' px) that do what the user asks, using ONLY what is in the pool. Rules: ' +
      '1) colours: only these hex values, or #FFFFFF / #000000: ' + cols.join(', ') + '. 2) fonts: only these names: ' + fonts.join(', ') + '. ' +
      '3) words: you may pick a line, cut a line down, or pick one sentence of it, but every word you use must already appear in the pool words; never write new words. Leave a slot out of "words" to keep it as it is; set it to "" to remove it. ' +
      '4) layout: one of these codes: ' + lays.join(' | ') + '. 5) picture: an index into the pictures list, or null for no photo. ' +
      'Schema: {"concepts":[{"label":"2-5 words","what":"one plain sentence","layout":"CODE","picture":0,"bg":"#hex or null","words":{"headline":"..."},"hide":["slot"],"show":["slot"],"style":{"slot":{"color":"#hex","fill":"#hex","font":"Name"}},"sizes":{"slot":1.2},"shared":{"color":"#hex","slots":["headline","supporting"]},"behind":false,"border":{"w":3,"color":"#hex"},"radius":"round or null","photoCorner":"square|rounded|round"}]}. ' +
      'Slots: headline, headline2, supporting, button, phone, website, small_print, business, logo. The logo comes from the customer record and is always available.';
    var user = 'Request: ' + a.text.trim() + '\n\nPool words (by slot): ' + JSON.stringify(words) + '\nPictures: ' + JSON.stringify(pics.map(function (p, i) { return { index: i, label: p.label || 'picture', w: p.img && p.img.width, h: p.img && p.img.height, cutByUser: !!p.marked }; })) +
      (tg ? '\n\nChange THIS concept (keep what the request does not mention): ' + JSON.stringify({ label: tg.label, layout: tg.sr.layout, recipe: tg.sr, words: tg.words || null }) : '') + (img64 ? '\n\nThe image is the source ad the pool was read from.' : '');
    var content = (img64 ? [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: img64 } }] : []).concat([{ type: 'text', text: user }]);
    a.busy = true; a.err = ''; render();
    fetchJson(cfg.anthropicProxy, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ASK_MODEL, max_tokens: 2500, system: system, messages: [{ role: 'user', content: content }] }) })
      .then(function (r) {
        if (!r.ok || !r.j) throw new Error('The Anthropic proxy answered HTTP ' + r.status + '.');
        var txt = (r.j.content || []).map(function (c) { return c.type === 'text' ? c.text : ''; }).join('').replace(/```json|```/g, '').trim();
        var obj; try { obj = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)); } catch (e) { throw new Error('The answer was not a recipe Ad Maker can read.'); }
        return applyAsked((obj.concepts || []).slice(0, ASK_MAX), tg, cols, fonts, lines, pics);
      }).then(function (n) { a.busy = false; if (!n) a.err = 'Nothing usable came back. Try saying it another way (\u24d8 has examples).'; else { a.text = ''; a.target = null; toast(n + ' concept' + (n > 1 ? 's' : '') + ' made from your request.', 'ok'); } render(); })
      .catch(function (e) { a.busy = false; a.err = e.message || 'The request failed.'; render(); });
  }
  function applyAsked(list, tg, cols, fonts, lines, pics) {
    var shape = S.shape || 'banner', okHex = function (v) { var h0 = hex(v); return h0 && (cols.indexOf(h0) > -1 || h0 === '#FFFFFF' || h0 === '#000000') ? h0 : null; };
    var SL = SLOTS.map(function (sl) { return sl[0]; }).concat(['logo']), made = [], chain = Promise.resolve(), photo0 = S.photo, use0 = S.usePhoto;
    list.forEach(function (c) {
      chain = chain.then(function () {
        var L = IxAdLayouts.LAYOUTS[c.layout]; if (!L || L.shape !== shape || L.asIs) { if (!tg) return; c.layout = tg.sr.layout; L = IxAdLayouts.LAYOUTS[c.layout]; }
        var pic = (c.picture != null && pics[+c.picture]) ? pics[+c.picture] : (tg ? null : null);
        if (pic) { S.photo = Object.assign({}, pic); S.usePhoto = true; } else if (tg) usePicOf(tg); else S.usePhoto = false;
        return layoutInput().then(function (inp) {
          var base = tg && tg.sr.layout === c.layout ? JSON.parse(JSON.stringify(tg.sr)) : ((IxAdLayouts.choose(inp)[shape] || []).filter(function (q) { return q.layout === c.layout && !(q.crop && q.crop.mode === 'close'); })[0] || null);
          if (!base) return; var sr = JSON.parse(JSON.stringify(base)); sr.style = sr.style || {}; sr.sizes = sr.sizes || {};
          if (okHex(c.bg)) sr.bg = okHex(c.bg);
          (c.hide || []).forEach(function (k) { if (SL.indexOf(k) > -1) { sr.style[k] = Object.assign({}, sr.style[k] || {}, { show: false }); } });
          (c.show || []).forEach(function (k) { if (SL.indexOf(k) > -1) { sr.style[k] = Object.assign({}, sr.style[k] || {}); if ((IxAdLayouts.CONST.EXTRA_SLOTS || []).indexOf(k) > -1) sr.style[k].show = true; else delete sr.style[k].show; } });
          Object.keys(c.style || {}).forEach(function (k) { if (SL.indexOf(k) < 0) return; var v = c.style[k] || {}, st = sr.style[k] = Object.assign({}, sr.style[k] || {}); if (okHex(v.color)) st.color = okHex(v.color); if (okHex(v.fill)) st.fill = okHex(v.fill); if (v.font && fonts.indexOf(v.font) > -1) st.font = v.font; });
          Object.keys(c.sizes || {}).forEach(function (k) { if (SL.indexOf(k) > -1 && isFinite(+c.sizes[k])) sr.sizes[k] = clamp(+c.sizes[k], IxAdLayouts.CONST.SIZE_FREE_MIN, IxAdLayouts.CONST.SIZE_FREE_MAX); });
          if (c.shared && okHex(c.shared.color)) sr.shared = { color: okHex(c.shared.color), slots: (c.shared.slots || []).filter(function (k) { return SL.indexOf(k) > -1; }) };
          if (c.behind === true && L.usesPhoto) sr.behind = { op: 0.75 }; else if (c.behind === false) delete sr.behind;
          if (c.border && okHex(c.border.color)) sr.border = { w: clamp(+c.border.w || 3, 1, 12), color: okHex(c.border.color) };
          if (c.radius === 'round') sr.radius = 'round';
          if (c.photoCorner === 'rounded' || c.photoCorner === 'round') sr.style.photo = Object.assign({}, sr.style.photo || {}, { corner: c.photoCorner });
          var w2 = null; Object.keys(c.words || {}).forEach(function (k) { if (SL.indexOf(k) < 0 || k === 'logo') return; var v = String(c.words[k] == null ? '' : c.words[k]).trim(); if (v && !wordsFromPool(v, lines)) return; w2 = w2 || {}; w2[k] = v; });
          var tw = tg && tg.words ? Object.assign({}, tg.words, w2 || {}) : w2;
          S._wOverride = tw; return layoutInput().then(function (inp2) { S._wOverride = null; return IxAdLayouts.paint(inp2, sr); }).then(function (p) {
            var e = S.ed, x = { id: e.next++, asked: true, picRef: pic ? picKey(pic) : (tg ? tg.picRef : null), picImg: pic ? pic.img : (tg ? tg.picImg : null), words: tw, sr: sr, sr0: JSON.parse(JSON.stringify(sr)), paint: p, label: String(c.label || 'Asked concept').slice(0, 40) + (tg ? ' \u00b7 changed' : ''), what: String(c.what || '').slice(0, 160), kept: false };
            var arr = shape === 'banner' ? e.B : e.S, at = tg ? arr.indexOf(tg) + 1 : 0; arr.splice(at + made.length, 0, x); made.push(x);
          });
        });
      });
    });
    return chain.then(function () { S.photo = photo0; S.usePhoto = use0; syncSavePick(); return made.length; }, function (e) { S.photo = photo0; S.usePhoto = use0; throw e; });
  }
  function vPick() {
    var shape = S.shape || 'banner';
    if (!S.drafts && !S.draftErr) { shell(colh('Pick \u00b7 ' + shapeLabel(shape)) + '<div class="am-prog"><b>Painting the concepts</b><div class="am-note">A few different ways to make this ' + shape + '.</div><div class="bar"><i></i></div></div>', barHTML('Painting\u2026', ghost('back', W.back))); return; }
    if (S.draftErr) { shell(colh('Pick') + '<div class="am-err">' + esc(S.draftErr) + '</div>', barHTML('', ghost('back', W.back))); return; }
    if (!S.ed) initMake();
    var items = allCards(), nk = keptItems().length, wv = shape === 'banner' ? 520 : 380;
    var cards = items.map(function (y) {
      return '<div class="am-dir' + (y.kept ? ' kept' : '') + (y.asked ? ' asked' : '') + '"><div class="am-dirh">' + (y.asked ? '<span class="am-askedtag">Asked</span>' : '') + '<b>' + esc(y.label) + '</b>' + (y.kept ? '<span class="am-kepttag">' + W.kept + '</span>' : '') + '</div>' +
        (y.what ? '<div class="am-dirw">' + esc(y.what) + '</div>' : '') + '<div class="am-dirpic" data-dircv="' + y.id + '"></div>' +
        '<div class="am-diracts"><button type="button" class="am-btn2" data-act="keepItem" data-id="' + y.id + '">' + (y.kept ? 'Kept \u2713' : 'Keep as it is') + '</button>' +
        '<button type="button" class="am-btn2 dark" data-act="tuneItem" data-id="' + y.id + '">Fine-tune this</button><a href="#" class="am-up am-askfor" data-act="askFor" data-id="' + y.id + '">Change this one</a></div></div>';
    }).join('');
    later(function () { document.querySelectorAll('#' + MOUNT_ID + ' [data-dircv]').forEach(function (el) { var y = itemById(+el.getAttribute('data-dircv')); if (y && y.paint) { el.innerHTML = ''; el.appendChild(canvasView(y.paint.canvas, wv)); } }); });
    shell(colh('Pick \u00b7 ' + items.length + ' concepts for the ' + shape, 'Keep one as it is, or take one into Fine-tune and change anything.') + askPanel() + '<div class="am-dirgrid ' + shape + '">' + cards + '</div>',
      barHTML(nk ? '<b>' + nk + ' kept for Save</b>' : 'Keep one as it is, or Fine-tune one', ghost('back', W.back) + btn('toSave', nk ? 'Review and save ' + nk : 'Review and save', 'primary', !nk)), { right: null });
  }
  function vMake() {
    var e = S.ed, shape = S.shape || 'banner';
    if (!S.drafts && !S.draftErr) { shell(colh('Make \u00b7 ' + shapeLabel(shape)) + '<div class="am-prog"><b>Painting the proposals</b><div class="am-note">Every layout that suits a ' + shape + ', in every colour found in the ad.</div><div class="bar"><i></i></div></div>', barHTML('Painting\u2026', ghost('back', W.back))); return; }
    if (S.draftErr) { shell(colh('Make') + '<div class="am-err">' + esc(S.draftErr) + '</div>', barHTML('', ghost('back', W.back))); return; }
    if (!e) { initMake(); e = S.ed; }
    var x = forward(), items = allCards(), kept = keptItems();
    if (!x) { S.screen = 'pick'; vPick(); return; }   // v3.0.0: Fine-tune always has one ad
    var card = function (y) { if (y === x) return ''; return '<div class="am-mcard' + (y.kept ? ' kept' : '') + '" data-fw="' + y.id + '"><div class="pic" data-slcv="' + y.id + '"></div><div class="cap"><b>' + esc(y.label) + '</b>' + (y.kept ? '<span class="am-kepttag">' + W.kept + '</span>' : '') + '</div></div>'; };
    var grid = '<div class="am-gridh"><span class="am-lbl2">' + (x ? 'The rest' : 'Proposals') + '</span><span class="am-note">' + (x ? 'behind the one you\u2019re on \u00b7 click to swap' : 'every layout that suits a ' + shape + ' \u00d7 every colour found in the ad \u00b7 click one to bring it forward') + '</span></div><div class="am-mgrid' + (x ? ' back' : '') + '">' + items.map(card).join('') + '</div>';
    var stage = '';
    if (x) {
      var L = IxAdLayouts.LAYOUTS[x.sr.layout] || {}, dims = shape === 'banner' ? '700 \u00d7 235' : '480 \u00d7 400', hasPhoto = photoOf(x) && x.sr.crop && x.sr.crop.mode !== 'whole' && !(L.asIs && x.sr.layout.slice(-1) !== 'C');
      stage = '<div class="am-fwd"><div class="am-fwdacts"><span class="nm"><b>' + esc(x.label) + '</b> \u00b7 ' + esc(x.sr.layout + (L.name ? ' ' + L.name : '')) + ' \u00b7 ' + dims + ' at 100% \u00b7 click a piece for its tools, the ground for the proposal\u2019s' + (hasPhoto ? ' \u00b7 drag the photo' : '') + (x.sr.bg2 ? ' \u00b7 drag the split' : '') + '</span>' +
        ghost('cloneItem', W.clone) + ghost('variation', W.variations) + '<button type="button" class="am-keep' + (x.kept ? ' done' : '') + '" data-act="keep">' + (x.kept ? W.kept : W.keep) + '</button>' + revert('putBack').replace('>cancel<', '>' + W.putBack + '<') + '</div>' +
        '<div class="am-stage"><div class="am-shapebox edit" data-shape="' + shape + '" id="am-st"></div></div><div class="am-card am-ckcard" id="am-checks"></div></div>';
    }
    var mid = '<div class="am-colh">Fine-tune \u00b7 ' + esc(shapeLabel(shape)) + '<span>Change anything on the right. Keep puts this version in the save set.</span></div>' + stage;   // v3.0.0: one ad, no grid
    var panel;
    if (!x) panel = '<div class="am-note" style="line-height:1.5">Click a proposal to bring it forward. The controls work on the one that\u2019s forward.</div>';
    else {
      var fld = function (k, label) { var ch = S.words[k] !== e.w0[k]; return '<div class="am-ctl"><div class="am-lab">' + label + (ch ? '<span class="am-edited">edited</span>' + revert('fCancel', ' data-k="' + k + '"') : '') + '</div>' + inp('data-f="' + k + '"', S.words[k], ch) + '</div>'; };
      var headCh = e.head !== e.head0, crCh = JSON.stringify(x.sr.crop) !== JSON.stringify(x.sr0.crop), hasPh = photoOf(x) && x.sr.crop && x.sr.crop.mode !== 'whole' && !((IxAdLayouts.LAYOUTS[x.sr.layout] || {}).asIs && x.sr.layout.slice(-1) !== 'C');
      var allWords = function () {   // v2.8.4: all nine lines; short ones in pairs
        var shortK = { button: 1, phone: 1 }, h = '', pend = [];
        SLOTS.forEach(function (sl) { if (shortK[sl[0]]) { pend.push(fld(sl[0], sl[1])); if (pend.length === 2) { h += '<div class="am-two">' + pend.join('') + '</div>'; pend = []; } } else h += fld(sl[0], sl[1]); });
        if (pend.length) h += pend.join('');
        return h;
      };
      var headSel = '<div class="am-ctl"><div class="am-lab">Leads the ad' + (headCh ? revert('headCancel') : '') + '</div><select class="am-sel' + (headCh ? ' am-dirty' : '') + '" id="am-head" style="height:32px !important;font-size:12.5px !important;width:100% !important"><option value="headline"' + (e.head === 'headline' ? ' selected' : '') + '>' + esc(S.words.headline || '(empty)') + '</option><option value="headline2"' + (e.head === 'headline2' ? ' selected' : '') + '>' + esc(S.words.headline2 || '(empty)') + '</option></select></div>';
      var L7 = IxAdLayouts.LAYOUTS[x.sr.layout] || {}, asIsItem = !!L7.asIs;
      var seg7 = function (act, cur, opts) { return '<div class="am-seg">' + opts.map(function (o) { return '<button type="button" class="' + (cur === o[0] ? 'on' : '') + '" data-act="' + act + '" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; };
      var plate7 = typeof x.sr.plate === 'boolean' ? (x.sr.plate ? 'on' : 'off') : 'auto';
      if (false && e.piece) {   // v4.0.0: piece tools moved to the floating toolbar on the stage
        var pk = e.piece, pword = PIECE_WORDS[pk] || pk, wordKey = pk === 'headline' || pk === 'headline2' ? (isExtra(x, 'headline2') && pk === 'headline2' ? (e.head === 'headline' ? 'headline2' : 'headline') : e.head) : pk;
        panel = '<div class="am-note" style="margin:-4px 0 10px">Editing <b style="color:var(--am-ink)">' + esc(pword) + '</b> on ' + esc(x.label) + '. <a href="#" class="am-up" data-act="pickPiece" data-v="">proposal tools</a></div>' +
          (pk === 'logo' ? '<div class="am-grp"><h4>Logo</h4><div class="am-ctl"><div class="am-lab">Plate on dark <span class="am-light">a white plate only where the logo would not read</span></div>' + seg7('platePick', plate7, [['auto', 'Auto'], ['on', 'On'], ['off', 'Off']]) + '</div></div>' : '') +
          (pk !== 'logo' && pk !== 'button' && wordKey !== e.head ? '<div class="am-grp"><h4>Wording</h4>' + fld(wordKey, pword) + (isExtra(x, pk) ? '<div class="am-ctl"><a href="#" class="am-up" data-act="removeExtra" data-v="' + pk + '">Remove from this proposal</a></div>' : '') + '</div>' : '') +
          (pk !== 'logo' && wordKey === e.head ? '<div class="am-grp"><h4>Wording</h4>' + headSel + '</div>' : '') +
          (pk === 'button' ? '<div class="am-grp"><h4>Wording</h4>' + fld('button', 'Button') + '</div>' : '') +
          styleGroupHTML(x, pk);
      } else {   // v3.0.0: the proposal's tools, in groups, one open at a time
        var adds = addable(x), op = e.open === undefined ? 'words' : e.open;
        var grp = function (key, title, body) {
          var dirty = grpDirty(x, key), open = op === key;
          return '<div class="am-acc' + (open ? ' am-accopen' : '') + '"><button type="button" class="am-acch" data-act="grpOpen" data-v="' + key + '">' + esc(title) + (dirty ? '<i class="am-gdot" role="img" aria-label="Changed"></i>' : '') + '<span class="am-accarr">' + (open ? '\u2212' : '+') + '</span></button>' +
            (open ? '<div class="am-accb">' + body + (dirty ? '<div style="margin-top:6px">' + revert('grpCancel', ' data-v="' + key + '"').replace('>cancel<', '>cancel ' + esc(title.toLowerCase()) + '<') + '</div>' : '') + '</div>' : '') + '</div>';
        };
        var seg8 = function (act, cur, opts, extra) { return '<div class="am-seg">' + opts.map(function (o) { return '<button type="button" class="' + (cur === o[0] ? 'on' : '') + '" data-act="' + act + '" data-v="' + o[0] + '"' + (extra || '') + '>' + o[1] + '</button>'; }).join('') + '</div>'; };
        var pal8 = swatchList().map(function (q) { return q[0]; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).slice(0, 7);
        var sw8 = function (act, k, cur, withNone) { return '<div class="am-swrow">' + (withNone ? '<button type="button" class="am-swb none' + (!cur ? ' on' : '') + '" data-act="' + act + '" data-k="' + k + '" data-v="" title="None">\u2205</button>' : '') + pal8.map(function (h) { return '<button type="button" class="am-swb' + (hex(cur) === h ? ' on' : '') + '" style="background:' + h + ' !important" data-act="' + act + '" data-k="' + k + '" data-v="' + h + '" title="' + h + '"></button>'; }).join('') + '</div>'; };
        var textPieces = pieceSlots(x).filter(function (q) { return q[0] !== 'logo'; });
        var stOf = function (k) { return (x.sr.style && x.sr.style[styleKey(x, k)]) || {}; };
        var fams = FONT_PAIRS.map(function (p) { return p.head; }).concat(FONT_LIST).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).slice(0, 14);
        var fontSel = function (k) { var cur = stOf(k).font || '', f = fontsFor(), auto = k === 'headline' || k === 'headline2' ? f.head : f.body; return '<select class="am-sel' + (cur ? ' am-dirty' : '') + '" data-pf="' + k + '" style="height:30px !important;font-size:12px !important;width:100% !important"><option value="">' + esc(auto) + ' (layout)</option>' + fams.map(function (fm) { return '<option value="' + esc(fm) + '"' + (fm === cur ? ' selected' : '') + ' style="font-family:\'' + esc(fm) + '\'">' + esc(fm) + '</option>'; }).join('') + '</select>'; };
        var sizeIn = function (k) { var sz = x.sr.sizes && x.sr.sizes[styleKey(x, k)] != null ? x.sr.sizes[styleKey(x, k)] : 1; return '<input class="am-inp' + (Math.abs(sz - 1) > 0.001 ? ' am-dirty' : '') + '" type="number" min="30" max="300" step="5" data-ps="' + k + '" value="' + Math.round(sz * 100) + '" style="height:30px !important;width:64px !important;font-size:12px !important" aria-label="' + esc(PIECE_WORDS[k] || k) + ' size, percent">'; };
        var rows = function (fn) { return textPieces.map(function (q) { return '<div class="am-trow"><span class="k">' + esc(q[1]) + '</span>' + fn(q[0]) + '</div>'; }).join(''); };
        var plate8 = typeof x.sr.plate === 'boolean' ? (x.sr.plate ? 'on' : 'off') : 'auto';
        var MST = mStepOf(x);   // v4.0.7: a Magic resize concept runs Remove, Add back, Fine-tune
        panel = (MST ? mStepBar(x) : '') + histBar() + (MST && MST !== 'tune' ? (MST === 'add' ? magicAddHTML(x) : magicRemoveHTML(x)) : layersHTML(x) +   // v4.0.0: undo/redo, then Layers, then the whole-ad groups
        (asIsItem ? '<div class="am-grp"><h4>The ad as it is</h4><div class="am-note">The picture is the ad; only what is round it changes. Fine-tune a worded concept to re-set the words.</div></div>' + grp('colours', 'Colours', backgroundsGroupHTML(x)) :
        grp('words', 'Wording', wordRows(x) + headSel) +
        grp('colours', 'Background', backgroundsGroupHTML(x)) +   // v4.0.3: a piece's colour is in its toolbar
        grp('space', 'Spacing and alignment', '<div class="am-lab">Align the words</div>' + seg8('alignPick', x.sr.align || '', [['', 'Layout'], ['left', 'Left'], ['center', 'Centre'], ['right', 'Right']]) + '<div class="am-note" style="margin-top:8px">To move one piece up or down, click it on the stage and use \u2191 \u2193.</div>') +
        grp('picture', 'Picture', foundPicsHTML() + (hasPh ? '<div class="am-grp"><h4>Picture</h4><div class="am-ctl"><div class="am-lab">' + W.crop + '<span class="am-light">' + W.dragPhoto + ' on the stage</span>' + (crCh ? '<button type="button" class="am-revert" data-act="cropCancel">' + W.resetCrop + '</button>' : '') + '</div><div class="am-zoomwrap' + (crCh ? ' am-dirty' : '') + '"><div class="am-zoomrow"><span class="am-note">' + W.zoom + '</span><input type="range" min="1" max="' + IxAdLayouts.CONST.ZOOM_MAX + '" step="0.05" value="' + (x.sr.crop.zoom || 1) + '" id="am-zoom"><span class="v">' + (+(x.sr.crop.zoom || 1)).toFixed(2) + '\u00d7</span></div></div></div></div>' : '') + arrangementGroupHTML(x) + (S.input && S.input.photo ? '<div class="am-lab" style="margin-top:8px">The photo</div>' + seg8('behindPick', x.sr.behind ? 'on' : '', [['', 'In its place'], ['on', 'Behind everything']]) + (x.sr.behind ? '<div class="am-zoomrow" style="margin-top:6px"><input type="range" min="0.1" max="1" step="0.05" value="' + x.sr.behind.op + '" data-st="behindOp" aria-label="Photo strength"><span class="v">' + Math.round(x.sr.behind.op * 100) + '%</span></div>' : '') : '')) +
        grp('panels', 'Panels', '<div class="am-lab">One panel behind several pieces</div>' + sw8('panelPick', 'shared', x.sr.shared && x.sr.shared.color, true) +
          (x.sr.shared ? '<div class="am-shticks"><span class="am-light">On this panel:</span>' + pieceSlots(x).filter(function (q) { return q[0] !== 'logo'; }).map(function (q) { var on = (x.sr.shared.slots || ['headline', 'headline2', 'supporting', 'business']).indexOf(q[0] === e.head ? 'headline' : q[0]) > -1 || (x.sr.shared.slots || ['headline', 'headline2', 'supporting', 'business']).indexOf(q[0]) > -1; return '<label class="am-showtick"><input type="checkbox" data-shslot="' + (q[0] === e.head ? 'headline' : q[0]) + '"' + (on ? ' checked' : '') + '> ' + esc(q[1]) + '</label>'; }).join('') + '</div>' : '') + '<div class="am-lab" style="margin-top:8px">Behind one piece</div>' + rows(function (k) { return k === 'button' ? '<span class="am-light" style="font-size:11.5px">the button is its own panel (Colours)</span>' : sw8('panelPick', k, stOf(k).fill, true); })) +
        grp('frame', 'Borders and corners', '<div class="am-lab">Border</div>' + seg8('borderPick', String((x.sr.border && x.sr.border.w) || 0), [['0', 'None'], ['3', 'Thin'], ['8', 'Thick']]) + '<div class="am-lab" style="margin-top:8px">Corners</div>' + seg8('radiusPick', x.sr.radius || '', [['', 'Layout'], ['square', 'Square'], ['round', 'Rounded']]))));
      }
    }
    var nk = kept.length, n = changeCount();
    shell(mid, barHTML('<b>' + nk + ' kept for Save</b>' + (n ? ' <span class="am-flag warn" style="background:#FBF3DF !important">' + n + ' change' + (n > 1 ? 's' : '') + ' not kept</span>' : ''),
      ghost('tuneCancel', W.cancel) + ghost('toPick', 'Back to the concepts') + btn('toSave', nk ? 'Review and save ' + nk : 'Review and save', 'primary', !nk)), { right: colh('Tools') + panel });   // v3.0.0
    if (x) drawStage(); drawShortlist();
  }
  function vTune() {
    var e = S.ed, fix = S.screen === 'fix', target = fix ? S.fix.shape : e.sel, x = curShape(target);
    if (fix) e.sel = target;
    if (!x) { e.sel = target = e.B.length ? 'banner' : 'sidebar'; x = curShape(target); }
    var fld = function (k, label) { var ch = S.words[k] !== e.w0[k]; return '<div class="am-ctl"><div class="am-lab">' + label + (ch ? '<span class="am-edited">edited</span>' + revert('fCancel', ' data-k="' + k + '"') : '') + '</div>' + inp('data-f="' + k + '"', S.words[k], ch) + '</div>'; };
    var crCh = JSON.stringify(x.sr.crop) !== JSON.stringify(x.sr0.crop), hasPhoto = photoOf(x) && x.sr.crop && x.sr.crop.mode !== 'whole';
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
    if (photoOf(x) && x.sr.crop && x.sr.crop.mode !== 'whole' && !((IxAdLayouts.LAYOUTS[x.sr.layout] || {}).asIs && x.sr.layout.slice(-1) !== 'C')) wireCropDrag(el, x);
    drawPieceOverlay();
    v.addEventListener('click', function (ev) { if (DRAG_MOVED) { DRAG_MOVED = false; return; } if (S.ed.piece) { S.ed.piece = null; render(); } });   // v2.7.0: the empty ground = the proposal's tools
    if (x.sr.bg2) {   // v2.1.0: the split between the two backgrounds, draggable · v2.7.0: vertical for top/bottom
      var hd = document.createElement('div'), vert = x.sr.bg2.side === 'top' || x.sr.bg2.side === 'bottom'; hd.className = 'am-split' + (vert ? ' vert' : ''); hd.title = 'Drag to resize panel 2';
      var rr = v.getBoundingClientRect(), pw = rr.width || (e.sel === 'banner' ? 700 : 480), ph = rr.height || (e.sel === 'banner' ? 235 : 400), w2 = x.sr.bg2.w || 0.35;
      if (vert) hd.style.top = ((x.sr.bg2.side === 'top' ? w2 : 1 - w2) * ph - 4) + 'px'; else hd.style.left = ((x.sr.bg2.side === 'left' ? w2 : 1 - w2) * pw - 4) + 'px';
      hd.addEventListener('mousedown', function (ev) { ev.preventDefault(); ev.stopPropagation(); DRAG = { split: true, pic: v, x: x, sx: ev.clientX, sy: ev.clientY, w0: w2, vert: vert }; });
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
  var DRAG_MOVED = false;
  var RAF = 0;
  function dragMove(ev) {
    var d = DRAG; if (!d) return;
    DRAG_MOVED = true;
    if (d.move) {   // v4.0.0: move a piece, snapping, never off the ad
      var b0 = d.box, nl = b0.l + (ev.clientX - d.sx), nt = b0.t + (ev.clientY - d.sy), gv = null, gh = null, sp = SAFE_PX * d.k;
      var xs = [[d.W / 2, 'c'], [sp, 'l'], [d.W - sp, 'r']], ys = [[d.H / 2, 'c'], [sp, 't'], [d.H - sp, 'b']];
      HITS.forEach(function (q) { if (q.key === d.key) return; xs.push([q.l, 'l'], [q.l + q.w, 'r'], [q.l + q.w / 2, 'c']); ys.push([q.t, 't'], [q.t + q.h, 'b'], [q.t + q.h / 2, 'c']); });
      xs.some(function (t) { var v = t[1] === 'c' ? nl + b0.w / 2 : t[1] === 'l' ? nl : nl + b0.w; if (Math.abs(v - t[0]) <= SNAP_PX) { nl += t[0] - v; gv = t[0]; return true; } return false; });
      ys.some(function (t) { var v = t[1] === 'c' ? nt + b0.h / 2 : t[1] === 't' ? nt : nt + b0.h; if (Math.abs(v - t[0]) <= SNAP_PX) { nt += t[0] - v; gh = t[0]; return true; } return false; });
      nl = clamp(nl, 0, d.W - b0.w); nt = clamp(nt, 0, d.H - b0.h);
      var pp = pieceOf(d.x.sr, styleKey(d.x, d.key)); pp.dx = Math.round(d.dx0 + (nl - b0.l) / d.k); pp.dy = Math.round(d.dy0 + (nt - b0.t) / d.k);
      d.el.style.left = (d.ox + nl - 3) + 'px'; d.el.style.top = (d.oy + nt - 3) + 'px';
      d.stage.querySelectorAll('.am-guide').forEach(function (n) { n.remove(); });
      if (gv !== null) guide(d.stage, true, d.ox + gv); if (gh !== null) guide(d.stage, false, d.oy + gh);
      if (!RAF) RAF = requestAnimationFrame(function () { RAF = 0; repaint(d.x); });
      return;
    }
    if (d.edge) {   // v4.0.2: a wider or taller box, inside the ad
      var b2 = d.box, pe = pieceOf(d.x.sr, styleKey(d.x, d.edge === 'w' ? d.key : d.key));
      if (d.edge === 'w') { var nw = clamp(b2.w + (ev.clientX - d.sx), 20, d.W - b2.l); pe.dw = Math.round(d.d0 + (nw - b2.w) / d.k); d.el.style.width = (nw + 6) + 'px'; }
      else { var nh = clamp(b2.h + (ev.clientY - d.sy), 10, d.H - b2.t); pe.dh = Math.round(d.d0 + (nh - b2.h) / d.k); d.el.style.height = (nh + 6) + 'px'; }
      if (!RAF) RAF = requestAnimationFrame(function () { RAF = 0; repaint(d.x); });
      return;
    }
    if (d.resize) {   // v4.0.0: corner drag scales the piece, kept inside the ad
      var b1 = d.box, sc = (b1.w + (ev.clientX - d.sx)) / b1.w;
      sc = Math.min(sc, (d.W - b1.l) / b1.w, (d.H - b1.t) / b1.h); sc = Math.max(sc, 0.3);
      d.x.sr.sizes = d.x.sr.sizes || {}; d.x.sr.sizes[styleKey(d.x, d.key)] = clamp(d.s0 * sc, IxAdLayouts.CONST.SIZE_FREE_MIN, IxAdLayouts.CONST.SIZE_FREE_MAX);
      d.el.style.width = (b1.w * sc + 6) + 'px'; d.el.style.height = (b1.h * sc + 6) + 'px';
      if (!RAF) RAF = requestAnimationFrame(function () { RAF = 0; repaint(d.x); });
      return;
    }
    if (d.split) {
      var rb = d.pic.getBoundingClientRect(), hd = document.querySelector('#am-st .am-split');
      if (d.vert) { var dyv = (ev.clientY - d.sy) / rb.height; d.x.sr.bg2.w = clamp(d.x.sr.bg2.side === 'top' ? d.w0 + dyv : d.w0 - dyv, 0.05, 0.8); if (hd) hd.style.top = ((d.x.sr.bg2.side === 'top' ? d.x.sr.bg2.w : 1 - d.x.sr.bg2.w) * rb.height - 4) + 'px'; }
      else { var dx = (ev.clientX - d.sx) / rb.width; d.x.sr.bg2.w = clamp(d.x.sr.bg2.side === 'left' ? d.w0 + dx : d.w0 - dx, 0.05, 0.8); if (hd) hd.style.left = ((d.x.sr.bg2.side === 'left' ? d.x.sr.bg2.w : 1 - d.x.sr.bg2.w) * rb.width - 4) + 'px'; }
      repaint(d.x); return; }
    var r = d.pic.getBoundingClientRect(), z = d.x.sr.crop.zoom || 1;
    d.x.sr.crop.cx = clamp(d.cx - (ev.clientX - d.sx) / r.width / z, 0, 1); d.x.sr.crop.cy = clamp(d.cy - (ev.clientY - d.sy) / r.height / z, 0, 1);
    repaint(d.x);
  }
  function dragEnd() { if (DRAG) { if (DRAG.sel) S.ed.piece = DRAG.sel; DRAG = null; S._noHist = false; document.querySelectorAll('#am-st .am-guide').forEach(function (n) { n.remove(); }); render(); } }

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
  // v2.6.0: one piece → Uploadcare → MEDIA row (Scenario B Route 4). Used by the Read bar and by the end Save.
  function pieceName(c, p, k) { return (c.name + ' - cut ' + k + (p.shape === 'circle' ? ' circle' : '') + '.png').replace(/[^A-Za-z0-9._ -]+/g, '-'); }
  function savePiece(p, k) {
    var c = cust(), nm = pieceName(c, p, k); p.state = 'saving'; p.err = ''; render();
    return toBlob(p.img).then(function (b) { return upload(b, nm); }).then(function (u) { p.url = u.cdnUrl; if (S.photo && S.photo.i === p.i) S.photo.url = u.cdnUrl; return mediaRow(u, nm, 'other'); })
      .then(function (id) { p.mediaId = id; p.state = 'saved'; if (S.photo && S.photo.i === p.i) S.photo.mediaId = id; render(); return id; })
      .catch(function (e) { p.state = 'bad'; p.err = (e && e.message) || String(e); render(); throw e; });
  }
  function savePieces() {
    var todo = S.pics.filter(function (p) { return p.marked && !p.mediaId; }); if (!todo.length || S.savingPieces) return;
    S.savingPieces = true; render();
    var chain = Promise.resolve(), k = 0;
    todo.forEach(function (p) { chain = chain.then(function () { k++; return savePiece(p, cartIndex(p)).catch(function () {}); }); });
    chain.then(function () { S.savingPieces = false; var bad = todo.filter(function (p) { return p.state === 'bad'; }).length; toast(bad ? bad + ' piece' + (bad > 1 ? 's' : '') + ' did not save; the rest are in MEDIA.' : todo.length + ' piece' + (todo.length > 1 ? 's' : '') + ' saved to ' + cust().name + '\u2019s media.', bad ? 'err' : 'ok'); render(); return loadMedia(); }).then(function () { render(); });
  }
  function cartIndex(p) { var cart = S.pics.filter(function (x) { return x.marked; }); return cart.indexOf(p) + 1; }
  function mediaRow(up, name, role) {
    var cfg = CFG(), c = cust() || {}; if (!cfg.makeConditioner) return Promise.reject(new Error('TA_CONFIG.makeConditioner is missing.'));
    return fetchJson(cfg.makeConditioner, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      action: 'createMediaFromBrowserUpload', uploadcareUuid: up.uuid, uploadcareUrl: up.cdnUrl, originalFilename: name, mimeType: 'image/png',
      titleSlug: cfg.titleSlug || '', taItemId: cfg.taItemId || '', componentRole: role || '', customerId: c.id || '', customerName: c.name || '', autoAttach: false, sourceChannel: 'reformatter', source: 'ta-admaker-v' + VERSION }) })
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
    Object.keys(S.contactDecide || {}).forEach(function (key) { if (S.contactDecide[key] !== 'both') return; var k = key.slice(0, key.indexOf('|')), v = key.slice(key.indexOf('|') + 1);   // v4.0.0: the contact check
      if (k === 'phone') { fd.phone = v; what.push('phone'); } if (k === 'website') { fd.website = v; what.push('website'); } if (k === 'email') { fd.email = v; what.push('email'); }   /* v4.0.1: 114's keys */ });
    return { fd: fd, what: what };
  }
  function write114(fd, label) {
    var cfg = CFG(), c = cust(); if (!cfg.makeUpdateCustomer) return Promise.reject(new Error('TA_CONFIG.makeUpdateCustomer is missing.'));
    return fetchJson(cfg.makeUpdateCustomer, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update', titleSlug: cfg.titleSlug, taItemId: cfg.taItemId, publisherId: c.publisherId, customerId: c.id, publish: true, fieldData: fd, source: 'ta-admaker-v' + VERSION + ' ' + label }) })
      .then(function (r) {
        if (!r.ok || !r.j || r.j.ok !== true) throw new Error('Scenario 114 did not confirm the customer write.');
        var e = r.j.fieldData || {}, miss = [];
        var pairs = { phone: 'business-phone', website: 'contact-website', email: 'business-email', brandColorMain: 'brand-color-main', brandColorAccent: 'brand-color-accent', brandFontHeading: 'brand-font-heading', brandFontBody: 'brand-font-body', logoLink: 'logo-link', logoLinkLight: 'logo-link-light', currentBannerAd: 'current-banner-ad', currentSidebarAd: 'current-sidebar-ad' };
        var idOf = function (v) { if (Array.isArray(v)) v = v[0]; return v && typeof v === 'object' ? (v.id || v.itemId || '') : (v || ''); };
        Object.keys(fd).forEach(function (k) { var slug = pairs[k]; if (slug && String(idOf(e[slug])).toUpperCase() !== String(fd[k]).toUpperCase()) miss.push(slug); });
        if (miss.length) throw new Error('Webflow did not keep ' + miss.join(', ') + '. Check Scenario 114\u2019s mapping for those fields.');
        if (fd.brandColorMain) { c.main = fd.brandColorMain; c.accent = fd.brandColorAccent || c.accent; }
        if (fd.brandFontHeading) { c.fontHead = fd.brandFontHeading; c.fontBody = fd.brandFontBody; }
        if (fd.logoLink) c.logo = fd.logoLink;
        if (fd.phone) c.phone = fd.phone; if (fd.website) c.website = fd.website; if (fd.email) c.email = fd.email;
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
    var keptAsIs = rows.some(function (row) { var L1 = IxAdLayouts.LAYOUTS[row.x.sr.layout]; return L1 && L1.asIs; });   // v2.7.0
    var keptPhoto = rows.some(function (row) { var L1 = IxAdLayouts.LAYOUTS[row.x.sr.layout]; return L1 && !L1.asIs && L1.usesPhoto; });   // v2.7.1: each picture uploaded only if a kept row uses it
    var keptMagic = rows.filter(function (row) { return row.x.sr.magic; });   // v4.0.6
    if (keptMagic.length && S.magicImg && !S.magicUrl) chain = chain.then(function () { return run(step('Uploading the ad picture for the magic recipe', 'Uploadcare'), toBlob(S.magicImg).then(function (b) { return upload(b, fileName(c, 'photo', 9)); })).then(function (u) { S.magicUrl = u.cdnUrl; }); });
    chain = chain.then(function () { keptMagic.forEach(function (row) { if (S.magicUrl) row.x.sr.magic.src = S.magicUrl; }); });
    var upPics = []; rows.forEach(function (row) { var L1 = IxAdLayouts.LAYOUTS[row.x.sr.layout]; if (!L1 || L1.asIs || !L1.usesPhoto) return; usePicOf(row.x); var p0 = (S.pics || []).filter(function (q) { return S.photo && q.img === S.photo.img; })[0] || S.photo; if (p0 && upPics.indexOf(p0) < 0) upPics.push(p0); });   // v4.0.3: each concept's own picture
    upPics.forEach(function (p0, pi) { if (p0.url) return; chain = chain.then(function () { return run(step('Uploading picture ' + (pi + 1) + ' for the recipe', 'Uploadcare'), toBlob(p0.img).then(function (b) { return upload(b, fileName(c, 'photo', pi + 1)); })).then(function (u) { p0.url = u.cdnUrl; if (S.photo && S.photo.img === p0.img) S.photo.url = u.cdnUrl; }); }); });
    if (S.whole && keptAsIs && !S.whole.url) chain = chain.then(function () { return run(step('Uploading the ad picture for the recipe', 'Uploadcare'), toBlob(S.whole.img).then(function (b) { return upload(b, fileName(c, 'photo', 2)); })).then(function (u) { S.whole.url = u.cdnUrl; }); });
    S.pics.filter(function (p) { return p.marked && !p.mediaId; }).forEach(function (p) {   // v2.6.0: pieces not yet saved go with the ad
      var k = cartIndex(p);
      chain = chain.then(function () { return run(step('Piece ' + k + ': uploading and recording in MEDIA for ' + c.name, 'Uploadcare \u00b7 Scenario B Route 4'), savePiece(p, k)); });
    });
    rows.forEach(function (row, i) {
      var n = i + 1, sh = row.shape, x = row.x, label = shapeLabel(sh) + ' \u00b7 ' + versionName(c, n);
      chain = chain.then(function () {
        var name = versionName(c, n), up = null, mediaId = null, input;
        usePicOf(x); S._wOverride = x.words || null; if (S.photo) { var pu = (S.pics || []).filter(function (q) { return q.img === S.photo.img; })[0]; if (pu && pu.url) S.photo.url = pu.url; }   // v4.0.3
        return layoutInput().then(function (inp) { input = inp; S._wOverride = null;
          return run(step(label + ': painting at 2\u00d7', 'in the browser'), IxAdLayouts.paint(input, x.sr).then(function (p) { x.paint = p; }));
        }).then(function () {
          return run(step(label + ': uploading', 'Uploadcare'), toBlob(x.paint.canvas).then(function (b) { return upload(b, fileName(c, sh, n)); })).then(function (u) { up = u; });
        }).then(function () {
          return run(step(label + ': recording in MEDIA', 'Scenario B Route 4'), mediaRow(up, fileName(c, sh, n))).then(function (id) { mediaId = id; });
        }).then(function () {
          var recipe = IxAdLayouts.recipe.stringify(IxAdLayouts.recipe.make({ input: IxAdLayouts.inputFor(input, x.sr), banner: sh === 'banner' ? x.sr : null, sidebar: sh === 'sidebar' ? x.sr : null }));
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
        rows.map(function (r, i) { var L = IxAdLayouts.LAYOUTS[r.x.sr.layout] || {}; return '<div class="am-sumrow big"><div class="pic" data-sumcv="' + i + '"></div><div><b>' + esc(shapeLabel(r.shape)) + '</b> \u00b7 ' + esc((r.x.label ? r.x.label + ' \u00b7 ' : '') + r.x.sr.layout + (L.name ? ' ' + L.name : '')) + '<div class="am-srcl">Saved as <b>' + esc(versionName(c, i + 1)) + '</b> \u00b7 ' + APPROVAL_WORDS.pending + '</div></div></div>'; }).join('') +
        (cw.what.length ? '<div class="am-sumline gold">Also writes to the customer: ' + esc(cw.what.join(', ')) + '.</div>' : '<div class="am-sumline">Nothing is written to the customer record.</div>') +
        (n ? '<div class="am-sumline">' + n + ' fine-tune change' + (n > 1 ? 's' : '') + ' go into the recipes.</div>' : '') + '</div>';
      later(function () { document.querySelectorAll('#' + MOUNT_ID + ' [data-sumcv]').forEach(function (el) { var r = rows[+el.getAttribute('data-sumcv')]; el.innerHTML = ''; el.appendChild(canvasView(r.x.paint.canvas, r.shape === 'banner' ? 700 : 480)); }); });
      shell(h0, barHTML('<b>' + rows.length + ' version' + (rows.length === 1 ? '' : 's') + '</b> to the customer, pending' + (cw.what.length ? ' \u00b7 ' + cw.what.length + ' customer write' + (cw.what.length > 1 ? 's' : '') : ''),
        ghost('back', W.back) + btn('doSave', W.saveBtn + ' ' + rows.length + ' version' + (rows.length === 1 ? '' : 's'), 'primary', !rows.length)));
      return;
    }
    var h = colh(sv.done ? W.saved : W.saving, sv.head || '') + '<div class="am-card">' + sv.steps.map(function (st) {
      return '<div class="am-ps ' + st.state + '"><i>' + (st.state === 'done' ? '\u2713' : st.state === 'bad' ? '!' : '') + '</i>' + esc(st.label) + (st.err ? '<span class="am-err inline">' + esc(st.err) + '</span>' : '') + '<span class="who">' + esc(st.who) + '</span></div>'; }).join('');
    if (sv.err) h += '<div class="am-err" style="margin-top:10px">' + esc(sv.err) + '</div>';
    if (sv.rows.length) h += '<div class="am-result"><h4>' + sv.rows.length + ' version' + (sv.rows.length > 1 ? 's' : '') + ' saved</h4>' + sv.rows.map(function (r, i) { return '<div class="am-rr">' + (r.banner ? '<img src="' + esc(r.banner) + '" alt="" style="width:260px">' : '') + (r.sidebar ? '<img src="' + esc(r.sidebar) + '" alt="" style="width:120px">' : '') + '<div class="lines"><b>' + esc(r.name) + '</b><br>' + (r.banner ? 'Banner <span class="am-pend">' + APPROVAL_WORDS.pending + '</span> ' : '') + (r.sidebar ? 'Sidebar <span class="am-pend">' + APPROVAL_WORDS.pending + '</span>' : '') + '<br>' + (r.current ? '<span class="am-flag ok" style="background:#E6F2EC !important">Approved \u00b7 the customer\u2019s current ' + r.shape + '</span>' : r.busy ? '<span class="am-note">' + esc(r.busy) + '</span>' : (r.approveErr ? '<span class="am-err inline">' + esc(r.approveErr) + '</span> ' : '') + '<button type="button" class="ix-btn ix-btn--secondary" data-act="approveRow" data-i="' + i + '" style="height:30px !important;padding:0 12px !important;font-size:12.5px !important;margin-top:6px">Approve &amp; make current</button> <span class="am-note">or leave it Pending for the publisher to review</span>') + '</div></div>'; }).join('') + '</div>';
    h += '</div>';
    shell(h, barHTML(sv.done ? W.savedMsg : sv.err ? 'Stopped. Nothing after the failed step was written.' : W.keepOpen, (sv.done || sv.err) ? btn('again', W.again, 'secondary') + (sv.done && (S.shape === 'banner' || S.shape === 'sidebar') ? ' ' + btn('nextShape', 'Make the ' + (S.shape === 'banner' ? 'sidebar' : 'banner') + ' next', 'primary') : '') : ''), { right: null });
  }

  // ══════════════════════════════════════════════════════════════
  //  Fix after send-back: the returned shape only
  // ══════════════════════════════════════════════════════════════
  function openFix(it) {
    S.sel = it.id; S.custId = it.custId; S.custPre = it.custId; S.src = 'version';
    var other = it.shape === 'banner' ? 'sidebar' : 'banner', fd = it.row.fieldData || {};
    S.fix = { adId: it.adId, shape: it.shape, q: it.q, m: it.m, otherUrl: fd[SHAPE_SLUG[other].link] || '', otherApproval: optName(SHAPE_SLUG[other].approval, fd[SHAPE_SLUG[other].approval]), name: fd.name || '' };
    if (!it.recipe) { toast('This version has no recipe (made before Ad Maker), so it cannot be rebuilt here. Start a new ad from a version instead.', 'err'); if (jobFor(it.id) === S) doClose(S); return; }
    var r; try { r = IxAdLayouts.recipe.parse(it.recipe); } catch (e) { toast('The recipe cannot be read: ' + e.message, 'err'); if (jobFor(it.id) === S) doClose(S); return; }
    S.screen = 'fix'; S.reading = true; render();
    IxAdLayouts.rebuild(r).then(function (out) {
      S.input = out.input; S.words = Object.assign({}, r.wording); S.base = Object.assign({}, r.wording); businessDefault();
      S.srcType = ''; S.srcType0 = ''; S.srcTypeFrom = ''; takeRecipePhoto(out.input.photo ? Object.assign({}, out.input.photo, { nativeWidth: r.photo.nativeWidth }) : null, it.shape);   // v2.7.1
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
    var v = { start: vStart, read: vRead, drafts: vPick, make: vPick, pick: vPick, finetune: vMake, tune: vMake, fix: vTune, save: vSave }[S.screen] || vStart;   // v3.0.0
    if (S.screen === 'fix' && S.reading) { shell(colh(W.fixing) + '<div class="am-prog"><b>Rebuilding the version from its recipe</b><div class="bar"><i></i></div></div>', '<div class="am-msg"></div><div class="am-grow"></div>' + ghost('startCancel', W.cancel)); return; }
    v();
    Object.keys(keep).forEach(function (k) { var el = document.querySelector('#' + MOUNT_ID + ' .am-col.' + k); if (el && keep[k]) el.scrollTop = keep[k]; });
    if (S.screen === 'start' && (S.src === 'drop' || S.src === 'paste' || S.srcChip === 'upload') && !S.drop) wireDrop();
  }
  function wireDrop() {
    var z = document.getElementById('am-dropzone'), f = document.getElementById('am-file'); if (!z || !f) return;
    z.addEventListener('click', function (e) { if (e.target.closest('.am-revert')) return; if (z.classList.contains('am-paste')) { z.focus(); if (e.detail > 1) f.click(); return; } f.click(); });
    if (z.classList.contains('am-paste')) { z.addEventListener('paste', takePaste); z.focus(); }
    f.addEventListener('change', function () { takeFile(f.files && f.files[0]); });
    z.addEventListener('dragover', function (e) { e.preventDefault(); z.classList.add('over'); });
    z.addEventListener('dragleave', function () { z.classList.remove('over'); });
    z.addEventListener('drop', function (e) { e.preventDefault(); z.classList.remove('over'); takeFile(e.dataTransfer.files && e.dataTransfer.files[0]); });
  }
  function startItem(it) {   // v3.0.0: the shape is picked on Start every time
    S.startNote = '';
    S.sel = it.id; S.custId = it.custId || ''; S.custPre = S.custId; S.shape = ''; S.slotShape = (it.shape === 'banner' || it.shape === 'sidebar') ? it.shape : ''; S.src = ''; S.drop = null; S.box = null; S.boxed = false; S.col = { main: '', accent: '' }; S.fromVersion = ''; S.err = '';
  }
  function go(screen) { S.screen = screen; render(); }
  function srcKey() { return [S.custId, S.src, S.fromVersion, S.drop && S.drop.name, S.box ? JSON.stringify(S.box) : ''].join('|'); }   // v2.8.3
  // v2.8.3: a new shape keeps the source and the read; only the proposals go. Kept ones are asked about first.
  function changeShape(sh) {
    if (!sh || sh === S.shape) return;
    var nk = S.ed ? keptItems().length : 0;
    var doIt = function () { S.shape = sh; S.drafts = null; S.draftErr = ''; S.ed = null; S.short = { banner: [], sidebar: [] }; S.savePick = { banner: [], sidebar: [] }; render(); };
    if (!nk) { doIt(); return; }
    var was = S.shape ? shapeLabel(S.shape).toLowerCase() : 'proposal';
    confirmBox('Change to ' + shapeLabel(sh).toLowerCase() + '?', 'Your ' + nk + ' kept ' + was + (nk > 1 ? 's' : '') + ' will be dropped. The wording and what was read off the ad stay.', 'Keep the ' + was, 'Change to ' + shapeLabel(sh).toLowerCase(), doIt);
  }
  function confirmBox(title, body, noWord, yesWord, ok) {
    var ov = document.createElement('div'); ov.className = 'ix-overlay am-ov';
    ov.innerHTML = '<div class="ix-modal" role="dialog" aria-modal="true" aria-label="' + esc(title) + '" style="max-width:480px"><div class="ix-modal-banner ix-modal-banner--alert">' + esc(title) + '</div>' +
      '<div class="ix-modal-body"><p style="margin:0">' + esc(body) + '</p></div><div class="ix-modal-footer"><div class="ix-modal-footer-right">' +
      '<button type="button" class="ix-btn ix-btn--secondary" data-k="no">' + esc(noWord) + '</button> <button type="button" class="ix-btn ix-btn--danger" data-k="yes">' + esc(yesWord) + '</button></div></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (!b && e.target !== ov) return; ov.remove(); if (b && b.getAttribute('data-k') === 'yes') ok(); });
  }
  function onClick(e) {
    var tb = e.target.closest('[data-tab],[data-tabx]');   // v2.8.0: tabs
    if (tb) { var tj = JOBS[+(tb.getAttribute('data-tab') || tb.getAttribute('data-tabx'))]; if (!tj) return; if (tb.hasAttribute('data-tabx')) closeJob(tj, true); else switchTo(tj); return; }
    var t = e.target.closest('[data-act],[data-na],[data-src],[data-ver],[data-piece],[data-drop-piece],[data-step],[data-shape],[data-fw],[data-photo],[data-pick],[data-mshape],[data-pair],[data-sug],[data-pk],[data-sl]');
    if (!t) return;
    var act = t.getAttribute('data-act');
    if (t.hasAttribute('data-na')) { var it = needsAll().all.filter(function (x) { return x.id === t.getAttribute('data-na'); })[0]; if (!it) return; openJob(it, it.kind === 'sent' ? function () { openFix(it); } : null); return; }   // v2.8.0
    if (t.hasAttribute('data-shape')) { changeShape(t.getAttribute('data-shape')); return; }   // v2.8.3
    if (t.hasAttribute('data-fw')) { var fw = itemById(+t.getAttribute('data-fw')); if (fw) setForward(fw); render(); return; }
    if (t.hasAttribute('data-src')) { S.src = t.getAttribute('data-src'); S.drop = null; S.box = null; S.boxed = false; S.fromVersion = ''; render(); return; }
    if (t.hasAttribute('data-drop-piece')) { var di = +t.getAttribute('data-drop-piece'), dp = S.pics.filter(function (p) { return p.i === di; })[0]; if (dp && !dp.mediaId) { S.pics = S.pics.filter(function (p) { return p.i !== di; }); S.marks = S.marks.filter(function (m, k) { return S.pics.some(function (p) { return p.marked && p.bbox && p.bbox[0] === m.x && p.bbox[1] === m.y; }); }); if (S.photo && S.photo.i === di) { S.photo = S.photoFound ? Object.assign({}, S.photoFound) : null; S.usePhoto = !!(S.photo && !S.photo.whole); } } render(); return; }
    if (t.hasAttribute('data-piece')) { S.src = 'piece'; S.fromPiece = t.getAttribute('data-piece'); S.drop = null; S.fromVersion = ''; render(); return; }
    if (t.hasAttribute('data-ver')) { var v = versionsOf(S.custId).filter(function (x) { return x.id === t.getAttribute('data-ver'); })[0]; if (v) { S.src = 'version'; S.drop = null; loadVersion(v); } render(); return; }
    if (t.hasAttribute('data-step')) { var sn = +t.getAttribute('data-step'); if (!canStep(sn)) return; go({ 1: 'start', 2: 'read', 3: 'pick', 4: 'finetune', 5: 'save' }[sn]); return; }   // v3.0.0
    if (t.hasAttribute('data-photo')) { S.usePhoto = t.getAttribute('data-photo') === '1'; render(); return; }
    if (t.hasAttribute('data-mshape')) { S.markShape = t.getAttribute('data-mshape'); render(); return; }
    if (t.hasAttribute('data-pick')) { var pk = S.pics[+t.getAttribute('data-pick')]; if (pk) { S.photo = Object.assign({}, pk); S.usePhoto = !pk.whole; var fx = S.ed && forward(); if (fx) { pushHist(); fx.picRef = picKey(pk); fx.picImg = pk.img; repaint(fx); } } render(); return; }   // v4.0.3
    if (t.hasAttribute('data-pair')) { S.fontPair = t.getAttribute('data-pair'); render(); return; }
    if (t.hasAttribute('data-sug')) { var h = t.getAttribute('data-sug'); if (!S.col.main) S.col.main = hex(h); else if (!S.col.accent) S.col.accent = hex(h); render(); return; }
    if (t.hasAttribute('data-pk')) { var p = t.getAttribute('data-pk').split(':'), arr = S.short[p[0]], i = +p[1], at = arr.indexOf(i); if (at > -1) arr.splice(at, 1); else arr.push(i); render(); return; }
    if (t.hasAttribute('data-sl')) { if (e.target.closest('label')) return; var q = t.getAttribute('data-sl').split(':'); S.ed.sel = q[0]; if (q[0] === 'banner') S.ed.b = +q[1]; else S.ed.s = +q[1]; render(); return; }
    if (!act) return;
    e.preventDefault();
    switch (act) {
      case 'newC': openJob({ id: 'new-' + (++newN), custId: '' }); break;   // v2.8.0: a job of its own
      case 'startCancel': closeJob(S, false); break;   // v2.8.0: Cancel on Start closes the job
      case 'custCancel': S.custId = S.custPre; S.changeCust = false; render(); break;
      case 'changeCust': S.changeCust = !S.changeCust; render(); break;
      case 'logoSwapOn': S.logoSwap = true; render(); if (S.ed) repaintAll(); break;
      case 'logoSwapOff': S.logoSwap = false; S.logoSwapKeep = false; render(); if (S.ed) repaintAll(); break;
      case 'colCancel': S.col[t.getAttribute('data-k')] = ''; render(); break;
      case 'srcCancel': S.src = ''; S.drop = null; S.box = null; S.fromVersion = ''; S.fromPiece = ''; render(); break;
      case 'clients': var lk = document.querySelector('.w-tab-link[data-w-tab="Clients"]'); if (lk) lk.click(); break;
      case 'toRead':
        absorbDrop();
        if (S.readKey && S.readKey === srcsKey() && !S.err && !S.reading) { go('read'); break; }   // v3.1.0: same sources: no second read
        S.readKey = srcsKey(); S.srcs.forEach(function (r) { r.snap = null; }); S.pool = null; S.srcAt = 0; useSource(S.srcs[0]);
        runSourceRead(); break;
      case 'readBox': S.boxed = true; readAd(); break;
      case 'wholePage': S.box = null; S.boxed = true; readAd(); break;
      case 'boxCancel': S.box = null; render(); break;
      case 'savePieces': savePieces(); break;
      case 'photoMark': S.photoMark = true; S.markBox = null; S.marks = []; S.screen = 'read'; render(); break;
      case 'photoMarkCancel': S.photoMark = false; S.markBox = null; render(); break;
      case 'markBoxCancel': S.markBox = null; render(); break;
      case 'photoMarkUse': if (S.markBox && photoSource()) { var mb0 = S.markBox, round = S.markShape === 'circle', mcv = round ? cropToEllipse(photoSource(), mb0) : cropToCanvas(photoSource(), mb0);
          var piece = { i: S.pics.length, img: mcv, kind: round ? 'graphic' : 'photo', shape: round ? 'circle' : 'rect', label: W.markedByYou + ' ' + (S.marks.length + 1), url: '', nativeWidth: mcv.width, subject: null, bbox: [mb0.x, mb0.y, mb0.w, mb0.h], whole: false, marked: true, cutout: round };
          S.pics.push(piece); S.marks.push({ x: mb0.x, y: mb0.y, w: mb0.w, h: mb0.h, shape: piece.shape }); S.photo = Object.assign({}, piece); S.usePhoto = true; tickedPics(); if (S.ticks.indexOf(picKey(piece)) < 0) S.ticks.push(picKey(piece)); }   // v4.0.3: ticked for concepts
        S.markBox = null; render(); break;
      case 'photoRevert': S.photo = S.photoFound ? Object.assign({}, S.photoFound) : null; S.usePhoto = !!(S.photo && !S.photo.whole); render(); break;
      case 'pagePrev': S.page = Math.max(1, S.page - 1); S.box = null; render(); break;
      case 'pageNext': S.page = Math.min(S.drop.pages, S.page + 1); S.box = null; render(); break;
      case 'readAgain': S.err = ''; readAd(); break;
      case 'back': go({ read: 'start', drafts: 'read', make: 'read', pick: 'read', finetune: 'pick', tune: 'pick', save: (S.ed && forward()) ? 'finetune' : 'pick' }[S.screen] || 'start'); break;   // v3.0.0
      case 'wCancel': var k = t.getAttribute('data-k'); S.words[k] = S.base[k]; render(); break;
      case 'logoCancel': S.logoUse = 'file'; S.logoScope = 'version'; render(); if (S.ed) repaintAll(); break;
      case 'logoPrint': S.logoUse = 'print'; S.logoScope = 'version'; render(); if (S.ed) repaintAll(); break;
      case 'srcTypeCancel': S.srcType = S.srcType0; render(); break;   // v2.7.1
      case 'readCancel': SLOTS.forEach(function (sl) { S.words[sl[0]] = S.base[sl[0]]; }); render(); break;
      case 'draftsCancel': S.short = { banner: [], sidebar: [] }; render(); break;
      case 'toSave': S.saving = null; go('save'); break;
      case 'toDrafts': { snapActive(); if (S.ed && S.drafts && S.draftSig === inputSig()) { go('pick'); break; }   // v4.0.3: same inputs, same concepts
        var keepPrev = S.ed ? keptItems().map(function (k) { return JSON.parse(JSON.stringify({ sr: k.sr, sr0: k.sr0, label: k.label, what: k.what, picRef: typeof k.picRef === 'string' ? k.picRef : null })) ; }) : [], keepObjs = S.ed ? keptItems() : [];
        if (!S.ed) applyPool(); else { mergeSources(); var ld = S.pool && S.pool.lead && S.pool.lead.snap; if (ld) { S.whole = ld.whole; S.srcType = ld.srcType; S.srcType0 = ld.srcType0; } }   // the as-is candidate is the first source again
        S.screen = 'pick'; S.ed = null; render();
        makeDrafts().then(function () { if (S.screen === 'pick') { if (S.drafts) { initMake(); if (keepObjs.length) { var sh0 = S.shape || 'banner', arr0 = sh0 === 'banner' ? S.ed.B : S.ed.S; keepObjs.forEach(function (k) { k.id = S.ed.next++; k.kept = true; arr0.unshift(k); }); syncSavePick(); } } render(); } }); } break;
      case 'toPick': go('pick'); break;
      case 'contactBoth': case 'contactAd': { S.contactDecide = S.contactDecide || {}; var ck = t.getAttribute('data-k'), cv = ck.slice(ck.indexOf('|') + 1), cf = ck.slice(0, ck.indexOf('|')); S.contactDecide[ck] = act === 'contactBoth' ? 'both' : 'ad'; if (cf === 'phone' || cf === 'website') { S.words[cf] = cv; if (S.base) S.base[cf] = cv; } render(); } break;   // v4.0.0
      case 'picTick': { var tp = (S._poolPics || [])[+t.getAttribute('data-v')]; if (tp) { tickedPics(); var tk = picKey(tp), at = S.ticks.indexOf(tk); if (at > -1) S.ticks.splice(at, 1); else S.ticks.push(tk); } render(); } break;   // v4.0.3
      case 'contactUndo': if (S.contactDecide) delete S.contactDecide[t.getAttribute('data-k')]; render(); break;
      case 'srcChip': S.srcChip = t.getAttribute('data-v'); if (S.srcChip === 'upload') { S.src = 'drop'; S.drop = null; S.srcPasting = false; } render(); break;   // v3.1.0
      case 'srcToggle': { var sk = t.getAttribute('data-k'), sv = t.getAttribute('data-v'), at = -1; S.srcs.forEach(function (r, i) { if (r.kind === sk && r.id === sv) at = i; }); if (at > -1) S.srcs.splice(at, 1); else { var rec = srcRecFor(sk, sv); if (rec) S.srcs.push(rec); } render(); } break;
      case 'srcDrop': S.srcs.splice(+t.getAttribute('data-v'), 1); render(); break;
      case 'pickFile': { var fi = document.getElementById('am-file'); if (fi) fi.click(); } break;
      case 'srcTab': { snapActive(); var ti2 = +t.getAttribute('data-v'), r2 = S.srcs[ti2]; if (!r2) break; S.srcAt = ti2; useSource(r2); if (r2.snap) { restoreSnap(r2); S.screen = 'read'; render(); } else { S.read = null; S.srcCanvas = null; S.verImg = null; runSourceRead(); } } break;
      case 'srcRole': { var ri = +t.getAttribute('data-v'), rr = t.getAttribute('data-r'); if (rr === 'design') S.srcs.forEach(function (q) { if (roleOf(q) === 'design') q.role = 'use'; }); S.srcs[ri].role = rr; mergeSources(); if (S.ed) { S.ed = null; S.drafts = null; } render(); } break;   // v3.1.1
      case 'railOpen': railOpen = true; render(); break;
      case 'railClose': railOpen = false; render(); break;
      case 'tuneItem': { var ti = itemById(+t.getAttribute('data-id')); if (ti) { setForward(ti); S.ed.piece = null; S.ed.open = S.ed.open || 'words'; go('finetune'); } } break;
      case 'keepItem': { var ki = itemById(+t.getAttribute('data-id')); if (ki) { ki.kept = !ki.kept; syncSavePick(); } render(); } break;
      case 'grpOpen': S.ed.open = S.ed.open === t.getAttribute('data-v') ? '' : t.getAttribute('data-v'); S.ed.piece = null; render(); break;
      case 'alignPick': each(function (x) { var av = t.getAttribute('data-v'); if (av) x.sr.align = av; else delete x.sr.align; }); render(); break;
      case 'behindPick': each(function (x) { if (t.getAttribute('data-v') === 'on') x.sr.behind = { op: 0.75 }; else delete x.sr.behind; }); render(); break;
      case 'panelPick': each(function (x) { var pk2 = t.getAttribute('data-k'), pv2 = t.getAttribute('data-v'); if (pk2 === 'shared') { if (pv2) x.sr.shared = { color: hex(pv2) }; else delete x.sr.shared; } else { var pp2 = pieceOf(x.sr, styleKey(x, pk2)); pp2.fill = pv2 ? hex(pv2) : ''; tidy(x.sr, styleKey(x, pk2)); } }); render(); break;
      case 'pcColour': each(function (x) { var pk3 = styleKey(x, t.getAttribute('data-k')), pp3 = pieceOf(x.sr, pk3); pp3.color = t.getAttribute('data-v') ? hex(t.getAttribute('data-v')) : ''; tidy(x.sr, pk3); }); render(); break;
      case 'borderPick': each(function (x) { var bv2 = +t.getAttribute('data-v'); if (bv2) x.sr.border = { w: bv2 }; else delete x.sr.border; }); render(); break;
      case 'radiusPick': each(function (x) { var rv = t.getAttribute('data-v'); if (rv) x.sr.radius = rv; else delete x.sr.radius; }); render(); break;
      case 'grpCancel': { var gk = t.getAttribute('data-v'); each(function (x) { grpKeys(gk).forEach(function (k) { if (k === 'style') { x.sr.style = JSON.parse(JSON.stringify(x.sr0.style || {})); } else if (k === 'sizes') { x.sr.sizes = JSON.parse(JSON.stringify(x.sr0.sizes || {})); } else if (x.sr0[k] === undefined) delete x.sr[k]; else x.sr[k] = JSON.parse(JSON.stringify(x.sr0[k])); }); }); if (gk === 'words') { S.words = JSON.parse(JSON.stringify(S.ed.w0)); S.ed.head = S.ed.head0; repaintAll(); } render(); } break;
      case 'nextShape': { var made = S.ed ? keptItems()[0] : null, was = S.shape, other = was === 'banner' ? 'sidebar' : 'banner';   // v3.0.1
        if (made && made.paint && made.paint.canvas) S.srcCanvas = made.paint.canvas;
        S.saving = null; S.shape = other; S.drafts = null; S.draftErr = ''; S.ed = null; S.short = { banner: [], sidebar: [] }; S.savePick = { banner: [], sidebar: [] };
        S.startNote = 'Making the ' + other + ' from the ' + was + ' you just saved. Its wording, photo and logo carry over; Read shows that ' + was + '.';
        go('start'); } break;
      case 'toTune': go('make'); break;
      case 'tuneCancel': if (S.screen === 'fix') { closeJob(S, false); } else { S.ed.B.concat(S.ed.S).forEach(function (x) { x.sr = JSON.parse(JSON.stringify(x.sr0)); }); S.words = JSON.parse(JSON.stringify(S.ed.w0)); S.ed.head = S.ed.head0; repaintAll(); render(); } break;
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
      case 'pickPiece': S.ed.piece = t.getAttribute('data-v') || null; render(); break;
      case 'pCorner': { var ck2 = t.getAttribute('data-k'), cv2 = t.getAttribute('data-v'); each(function (x) { var pp = pieceOf(x.sr, ck2); if (cv2 === 'square') delete pp.corner; else pp.corner = cv2; tidy(x.sr, ck2); }); render(); } break;   // v4.0.3
      case 'pImprove': improvePicture(t.getAttribute('data-k')); break;
      case 'pImproveShow': { var ik = t.getAttribute('data-k'), io = S.improve && S.improve[ik]; if (io) { io.on = t.getAttribute('data-v') === 'after'; applyImprove(ik); } } break;
      case 'askGo': askGo(); break;   // v4.0.5
      case 'sugYes': { var sk2 = t.getAttribute('data-k'), sv2 = t.getAttribute('data-v'); each(function (x) { if (!x.sr.magic) return; if (sv2 === 'lines') { x.sr.magic.els.forEach(function (m) { if (m.k === 'text' && m.panel === sk2 && !m.inPic) pieceOf(x.sr, m.id).show = false; }); } else if (sv2 === 'remove') { pieceOf(x.sr, sk2).show = false; } else { x.sr.sizes = x.sr.sizes || {}; x.sr.sizes[sk2] = LARGER_STEP; var pp = pieceOf(x.sr, sk2); pp.dh = (+pp.dh || 0) + 12; } }); render(); } break;   // v4.0.6
      case 'sugNo': { var fxn = forward(); if (fxn) { fxn.sugNo = fxn.sugNo || {}; fxn.sugNo[t.getAttribute('data-k')] = true; } render(); } break;
      case 'pFill': { var fk2 = t.getAttribute('data-k'), fv2 = t.getAttribute('data-v'); each(function (x) { var pp = pieceOf(x.sr, fk2); if (fv2) pp.fill = fv2; else delete pp.fill; tidy(x.sr, fk2); }); render(); } break;
      case 'mStep': { var fxs = forward(); if (fxs && fxs.sr.magic) { fxs.mstep = t.getAttribute('data-v'); } render(); } break;   // v4.0.7
      case 'mRemove': { var rk7 = t.getAttribute('data-k'); each(function (x) { pieceOf(x.sr, rk7).show = false; }); if (S.ed.piece === rk7) S.ed.piece = null; render(); } break;
      case 'mBack': { var bk7 = t.getAttribute('data-k'); each(function (x) { var pp7 = pieceOf(x.sr, bk7); delete pp7.show; tidy(x.sr, bk7); }); S.ed.piece = bk7 === 'mbg' ? null : bk7; render(); } break;
      case 'mAddLine': { var fx7 = forward(); if (!fx7 || !fx7.sr.magic) break; pushHist(); var into7 = magicEl(fx7, S.ed.piece), nid7 = mAddLine(fx7, t.getAttribute('data-v')); if (!(into7 && into7.k === 'panel')) S.ed.piece = nid7; repaint(fx7); render(); } break;   // a box stays selected, so lines stack inside it
      case 'mAddBox': { var fx8 = forward(); if (!fx8 || !fx8.sr.magic) break; pushHist(); var bid = mNewId(fx8), lastP = -1; fx8.sr.magic.els.forEach(function (m, i) { if (m.k === 'panel') lastP = i; }); fx8.sr.magic.els.splice(lastP + 1, 0, Object.assign({ id: bid, k: 'panel', color: t.getAttribute('data-v'), shape: 'rect', added: true }, NEW_BOX)); S.ed.piece = bid; repaint(fx8); render(); } break;
      case 'mAddLogo': { var fx9 = forward(); if (!fx9 || !fx9.sr.magic) break; pushHist(); var lid = mNewId(fx9); fx9.sr.magic.els.push(Object.assign({ id: lid, k: 'image', use: 'logo', what: 'logo', label: 'customer logo', added: true }, NEW_LOGO)); S.ed.piece = lid; repaint(fx9); render(); } break;
      case 'mClear': cleanMagic(t.getAttribute('data-k'), true); break;
      case 'mCleanPic': cleanMagic(t.getAttribute('data-k'), false); break;
      case 'pCleanPhoto': cleanPhoto(); break;
      case 'magicAdd': { var line = t.getAttribute('data-v'), fx4 = forward(); if (!fx4 || !fx4.sr.magic) break; pushHist(); var nid = 'a' + (fx4.sr.magic.els.length + 1) + '_' + Date.now() % 1000; fx4.sr.magic.els.push({ id: nid, k: 'text', txt: line, x: 0.05, y: 0.72, w: 0.6, h: 0.16, font: 'sans', weight: 700, italic: false, color: null, align: 'left', lines: 1 }); S.ed.piece = nid; repaint(fx4); render(); } break;
      case 'askMic': askMic(); break;
      case 'askHints': S.ask.hints = !S.ask.hints; render(); break;
      case 'askUse': S.ask.text = t.getAttribute('data-v'); S.ask.hints = false; render(); break;
      case 'askFor': S.ask = S.ask || { text: '', busy: false, err: '', target: null, hints: false, listening: false }; S.ask.target = +t.getAttribute('data-id'); render(); later(function () { var ta = document.getElementById('am-askt'); if (ta) { ta.focus(); ta.scrollIntoView({ block: 'center' }); } }); break;
      case 'askClear': S.ask.target = null; render(); break;
      case 'layerEyeM': { var mk = t.getAttribute('data-k'); each(function (x) { var pp = pieceOf(x.sr, mk); if (pp.show === false) delete pp.show; else pp.show = false; tidy(x.sr, mk); }); render(); } break;   // v4.0.6
      case 'elToggle': S.ed.elOpen = S.ed.elOpen === false; render(); break;   // v4.0.3
      case 'undo': { var eu = S.ed; if (eu && eu.hist && eu.hist.length) { var cur = snapHist(); applySnap(eu.hist.pop()); eu.fut = (eu.fut || []).concat([cur]); } render(); } break;   // v4.0.0
      case 'redo': { var er = S.ed; if (er && er.fut && er.fut.length) { var cur2 = snapHist(); applySnap(er.fut.pop()); er.hist = (er.hist || []).concat([cur2]); } render(); } break;
      case 'resetAll': each(function (x) { x.sr = JSON.parse(JSON.stringify(x.sr0)); }); S.ed.piece = null; render(); break;
      case 'layerEye': { var lk = t.getAttribute('data-k'); each(function (x) { var kk = styleKey(x, lk); if (isExtra(x, lk)) { x.sr.style = x.sr.style || {}; var on0 = x.sr.style[lk] && x.sr.style[lk].show === true; if (on0) delete x.sr.style[lk]; else x.sr.style[lk] = Object.assign({}, x.sr.style[lk] || {}, { show: true }); } else { var pp = pieceOf(x.sr, kk); if (pp.show === false) delete pp.show; else pp.show = false; tidy(x.sr, kk); } }); render(); } break;
      case 'pReset': { var rk = t.getAttribute('data-k') || S.ed.piece; each(function (x) { var kk = styleKey(x, rk); if (rk === 'photo') { x.sr.crop = JSON.parse(JSON.stringify(x.sr0.crop || x.sr.crop)); return; } if (x.sr.style) { if (x.sr0.style && x.sr0.style[kk]) x.sr.style[kk] = JSON.parse(JSON.stringify(x.sr0.style[kk])); else delete x.sr.style[kk]; } if (x.sr.sizes) { if (x.sr0.sizes && x.sr0.sizes[kk] != null) x.sr.sizes[kk] = x.sr0.sizes[kk]; else delete x.sr.sizes[kk]; } }); render(); } break;
      case 'pSize': { var sk = S.ed.piece, sd = +t.getAttribute('data-v'); each(function (x) { var kk = styleKey(x, sk); x.sr.sizes = x.sr.sizes || {}; x.sr.sizes[kk] = clamp((x.sr.sizes[kk] != null ? x.sr.sizes[kk] : 1) + sd, IxAdLayouts.CONST.SIZE_FREE_MIN, IxAdLayouts.CONST.SIZE_FREE_MAX); }); render(); } break;
      case 'pZoom': { var zd = +t.getAttribute('data-v'); each(function (x) { if (!x.sr.crop) return; x.sr.crop.zoom = clamp((x.sr.crop.zoom || 1) + zd, 1, 4); }); render(); } break;
      case 'pFit': each(function (x) { if (x.sr.crop) { x.sr.crop.zoom = 1; x.sr.crop.cx = 0.5; x.sr.crop.cy = 0.5; } }); render(); break;
      case 'pHide': { var hk = S.ed.piece; each(function (x) { var kk = styleKey(x, hk); if (isExtra(x, hk)) { if (x.sr.style) delete x.sr.style[hk]; } else { pieceOf(x.sr, kk).show = false; } }); S.ed.piece = null; render(); } break;
      case 'addExtra': (function () { var k = t.getAttribute('data-v'); each(function (x) { x.sr.style = x.sr.style || {}; x.sr.style[k] = Object.assign({}, x.sr.style[k] || {}, { show: true }); }); S.ed.piece = k; })(); render(); break;
      case 'removeExtra': (function () { var k = t.getAttribute('data-v'); each(function (x) { if (x.sr.style) delete x.sr.style[k]; if (x.sr.sizes) delete x.sr.sizes[k]; }); S.ed.piece = null; })(); render(); break;
      case 'logoVariant': each(function (x) { var pv2 = pieceOf(x.sr, 'logo'), vv = t.getAttribute('data-v'); if (vv) pv2.variant = vv; else delete pv2.variant; tidy(x.sr, 'logo'); }); render(); break;
      case 'nudgeX': each(function (x) { var kn = styleKey(x, S.ed.piece), pn = pieceOf(x.sr, kn); pn.dx = (+pn.dx || 0) + (+t.getAttribute('data-v')) * IxAdLayouts.CONST.NUDGE_STEP; tidy(x.sr, kn); }); render(); break;   // v3.1.1
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
      case 'again': doClose(S); loadNeeds().then(render); loadAds().then(render); loadMedia().then(render); break;   // v2.8.0: the saved job closes; the lists reload
    }
  }
  // v2.7.0: the business name slot is filled from the customer unless the read supplied one
  function businessDefault() { var c0 = cust() || {}; if (!S.words.business && c0.name) { S.words.business = c0.name; S.base.business = c0.name; S.from.business = 'From the customer'; } }
  // ── v3.1.0 · several sources ─────────────────────────────
  function srcRecFor(kind, id) {
    var c = cust() || {};
    if (kind === 'version') { var v = versionsOf(c.id).filter(function (x) { return x.id === id; })[0]; return v ? { key: 'v|' + id, kind: 'version', id: id, name: v.name, thumb: v.banner || v.sidebar || '' } : null; }
    if (kind === 'piece') { var q = piecesOf(c.id).filter(function (x) { return x.id === id; })[0]; return q ? { key: 'p|' + id, kind: 'piece', id: id, name: q.name, thumb: q.url } : null; }
    if (kind === 'none') return { key: 'none', kind: 'none', id: 'scratch', name: 'Scratch', thumb: '' };
    return null;
  }
  // a dropped or pasted file joins the sources once it has opened
  function absorbDrop() {
    if (!S.drop || !(S.drop.img || S.drop.pages)) return;
    var d = S.drop; S.drop = null; S.srcN = (S.srcN || 0) + 1;
    var still = ''; try { if (d.img) { var tc = document.createElement('canvas'), tw = 224, th = Math.max(1, Math.round(tw * (d.img.naturalHeight || d.img.height || 1) / (d.img.naturalWidth || d.img.width || 1))); tc.width = tw; tc.height = th; tc.getContext('2d').drawImage(d.img, 0, 0, tw, th); still = tc.toDataURL('image/jpeg', 0.8); } } catch (ex) { still = ''; }   // v4.0.0
    S.srcs.push({ key: 'd|' + S.srcN, kind: d.pages ? 'drop' : (S.srcPasting ? 'paste' : 'drop'), id: 'd' + S.srcN, name: d.name, thumb: still || (d.img ? d.img.src : ''), drop: d });
    S.srcFlash = 'd|' + S.srcN; later(function () { toast((S.srcPasting ? 'Screenshot' : d.name) + ' added to the sources.', 'ok'); setTimeout(function () { S.srcFlash = ''; var f = document.querySelector('#' + MOUNT_ID + ' .am-tpill.flash'); if (f) f.classList.remove('flash'); }, 1600); });
    S.srcPasting = false;
  }
  function srcsKey() { return S.custId + '|' + (S.srcs || []).map(function (r) { return r.key; }).join(','); }
  function roleOf(r) { r.role = null; /* v4.0.0: no roles; every source feeds the pool, the first is the as-is candidate */ var first = (S.srcs || []).filter(function (q) { return q.role !== 'out'; })[0]; return r === first && !(S.srcs || []).some(function (q) { return q.role === 'design'; }) ? 'design' : 'use'; }   // v3.1.1
  function designRec() { var live = (S.srcs || []).filter(function (r) { return roleOf(r) !== 'out'; }); return live.filter(function (r) { return roleOf(r) === 'design'; })[0] || live[0] || null; }
  // put one source in the single-source fields the read machinery uses
  function useSource(r) {
    S.src = r.kind === 'none' ? 'none' : r.kind; S.fromVersion = r.kind === 'version' ? r.id : ''; S.fromPiece = r.kind === 'piece' ? r.id : '';
    S.drop = r.drop || null; S.box = r.box || null; S.boxed = !!r.boxed; S.err = ''; S.verRecipe = null; S.verRecipeErr = '';
    if (r.kind === 'version') { var v = versionsOf(S.custId).filter(function (x) { return x.id === r.id; })[0]; if (v) loadVersion(v); }
  }
  var SNAP_KEYS = ['srcCanvas', 'verImg', 'read', 'words', 'base', 'from', 'pics', 'whole', 'photo', 'usePhoto', 'photoFound', 'srcType', 'srcType0', 'srcTypeFrom', 'adColours', 'printLogo', 'printLogoUrl', 'logoUse'];
  function snapActive() {
    var r = S.srcs[S.srcAt]; if (!r || S.reading || S.err) return;
    if (r.snap) { r.snap.pics = (S.pics || []).slice(); mergeSources(); return; }   // only new marked pieces after the first read
    if (!S.read && r.kind !== 'none') return;
    r.box = S.box; r.boxed = S.boxed;
    var sn = {}; SNAP_KEYS.forEach(function (k) { var v = S[k]; sn[k] = (v && typeof v === 'object' && !(v.getContext || v.tagName) && !Array.isArray(v)) ? Object.assign({}, v) : Array.isArray(v) ? v.slice() : v; });
    sn.srcType = S.srcType; r.snap = sn; mergeSources();
  }
  function restoreSnap(r) { SNAP_KEYS.forEach(function (k) { var v = r.snap[k]; S[k] = (v && typeof v === 'object' && !(v.getContext || v.tagName) && !Array.isArray(v)) ? Object.assign({}, v) : Array.isArray(v) ? v.slice() : v; }); }
  // pool what every read source found. Words: the design source's, with every other version kept as an alternative.
  function mergeSources() {
    var read = S.srcs.filter(function (r) { return r.snap && roleOf(r) !== 'out'; }); if (!read.length) { S.pool = null; return; }   // v3.1.1: left-out sources give nothing
    var d = designRec(); var lead = (d && d.snap) ? d : read[0];
    S.variants = {};
    SLOTS.forEach(function (sl) { var k = sl[0], seen = []; [lead].concat(read.filter(function (r) { return r !== lead; })).forEach(function (r) { var v = (r.snap.words || {})[k]; if (v && !seen.some(function (q) { return q.v === v; })) seen.push({ v: v, from: r.name }); }); S.variants[k] = seen; });
    S.merged = { lead: lead.key };
    S.pool = { words: {}, pics: [], adColours: [] };
    SLOTS.forEach(function (sl) { S.pool.words[sl[0]] = S.variants[sl[0]][0] ? S.variants[sl[0]][0].v : ''; });
    read.forEach(function (r) { (r.snap.pics || []).forEach(function (p) { if (!p.whole) S.pool.pics.push(Object.assign({}, p, { from: r.name })); }); (r.snap.adColours || []).forEach(function (cc) { if (S.pool.adColours.indexOf(cc) < 0) S.pool.adColours.push(cc); }); });
    S.pool.lead = lead;
  }
  // after Read, before the directions: the pooled words, pieces and colours; the design source's picture and type
  function applyPool() {
    if (!S.pool || !S.pool.lead) return;
    var L = S.pool.lead.snap, marked = (S.pics || []).filter(function (p) { return p.marked; });
    restoreSnap(S.pool.lead); S._shownSrc = '';
    S.words = Object.assign({}, S.pool.words); S.base = Object.assign({}, S.pool.words);
    var seenI = []; S.pics = (L.whole ? [L.whole] : []).concat(S.pool.pics, marked).filter(function (q) { if (seenI.indexOf(q.img) > -1) return false; seenI.push(q.img); return true; });   // v4.0.3: each picture once
    S.adColours = S.pool.adColours.slice();
  }
  function runSourceRead() {
    S.boxed = false; S.screen = 'read';
    if (S.src === 'none') { startEmpty(); render(); return; }
    if (S.src === 'version') { startFromVersion(); return; }
    if (S.src === 'piece') { startFromPiece(); return; }
    if (!needsBox()) { S.boxed = true; readAd(); } else render();
  }
  function startEmpty() { S.read = null; S.words = {}; S.base = {}; S.from = {}; var c0 = cust() || {}; SLOTS.forEach(function (s) { S.words[s[0]] = ''; S.base[s[0]] = ''; S.from[s[0]] = 'Type it'; });
    if (c0.website) { S.words.website = c0.website; S.base.website = c0.website; S.from.website = 'From the customer'; }
    if (c0.phone) { S.words.phone = c0.phone; S.base.phone = c0.phone; S.from.phone = 'From the customer'; } businessDefault(); S.photo = null; S.pics = []; S.photoFound = null; S.whole = null; S.srcType = ''; S.srcType0 = ''; S.srcTypeFrom = ''; S.photoMark = false; S.marks = []; S.savingPieces = false; S.printLogo = null; S.srcCanvas = null; S.logoUse = 'file'; S.err = ''; var c = cust(); S.fontPair = (fontOf(c.fontHead) && fontOf(c.fontBody)) ? '' : FONT_PAIRS[0].id; }
  // v2.6.0: a saved piece is the photo; the wording is typed, as for Scratch
  function startFromPiece() {
    var p = piecesOf(S.custId).filter(function (x) { return x.id === S.fromPiece; })[0]; if (!p) return;
    startEmpty(); S.screen = 'read'; S.reading = true; render();
    loadImg(p.url).then(function (img) {
      S.reading = false;
      if (!img) { S.err = 'The saved piece could not be loaded from ' + p.url; render(); return; }
      var cut = looksCutout(img);
      S.photo = { i: 0, img: img, kind: cut ? 'graphic' : 'photo', label: p.name, url: p.url, nativeWidth: img.naturalWidth || p.w, subject: null, bbox: null, whole: false, marked: false, cutout: cut, mediaId: p.id };
      S.pics = [Object.assign({}, S.photo)]; S.photoFound = Object.assign({}, S.photo); S.usePhoto = true;
      S.read = { read: { method: 'piece', note: p.name + (cut ? ', a cut-out.' : '.') + ' Type the wording; website and phone come from the customer.' }, warnings: [] };
      render();
    });
  }
  function looksCutout(img) { try { var cv = document.createElement('canvas'); cv.width = 8; cv.height = 8; var c = cv.getContext('2d'); c.drawImage(img, 0, 0, 8, 8); var d = c.getImageData(0, 0, 8, 8).data, see = 0; [0, 7, 56, 63].forEach(function (k) { if (d[k * 4 + 3] < 64) see++; }); return see >= 2; } catch (e) { return false; } }
  function startFromVersion() {
    var v = versionsOf(S.custId).filter(function (x) { return x.id === S.fromVersion; })[0]; if (!v) return;
    if (S.verRecipe) {
      var r = S.verRecipe; S.screen = 'read'; S.reading = true; render();
      IxAdLayouts.rebuild(r).then(function (out) {
        S.read = { read: { method: 'recipe', note: 'Wording, logo and photo from the saved recipe of ' + v.name + '.' }, warnings: [] };
        S.words = Object.assign({}, r.wording); S.base = Object.assign({}, r.wording); S.from = {}; SLOTS.forEach(function (s) { S.from[s[0]] = 'From the version'; }); businessDefault();
        S.srcType = ''; S.srcType0 = ''; S.srcTypeFrom = ''; takeRecipePhoto(out.input.photo, v.banner ? 'banner' : 'sidebar'); S.srcCanvas = null; S.verImg = out.banner ? out.banner.canvas : (out.sidebar ? out.sidebar.canvas : null);
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
    if (t.matches('[data-mt]')) { var mfx = S.ed && forward(), mm = magicEl(mfx, t.getAttribute('data-mt')); if (mm) { mm.txt = t.value; repaint(mfx); } return; }   // v4.0.6
    if (t.id === 'am-askt') { S.ask.text = t.value; var go = document.querySelector('#' + MOUNT_ID + ' [data-act="askGo"]'); if (go) go.disabled = !t.value.trim() || S.ask.busy; return; }   // v4.0.5
    if (t.matches('[data-w]')) { var wk = t.getAttribute('data-w'); S.words[wk] = t.value; var line = t.closest('.am-wline'); if (line) { var ch = t.value !== S.base[wk]; t.classList.toggle('am-dirty', ch); var cn = line.querySelector('[data-cnt]'); if (cn) cn.textContent = t.value ? t.value.length + ' chars' : ''; } return; }
    if (t.matches('[data-col]')) { S.col[t.getAttribute('data-col')] = t.value; var d = t.parentNode.querySelector('.dot'); if (d && hex(t.value)) d.style.setProperty('background', hex(t.value), 'important'); t.classList.toggle('am-dirty', !!t.value); return; }
    if (t.matches('[data-f]')) { var fk = t.getAttribute('data-f'), fx3 = S.ed && forward(); if (fx3 && fx3.words && fx3.words[fk] != null) fx3.words[fk] = t.value; else S.words[fk] = t.value; t.classList.add('am-dirty'); repaintAll(); return; }   // v4.0.5
    if (t.matches('[data-sz]')) { each(function (x) { x.sr.sizes[t.getAttribute('data-sz')] = +t.value; }); var v = t.parentNode.querySelector('.v'); if (v) v.textContent = Math.round(t.value * 100) + '%'; return; }
    if (t.matches('[data-st]')) {
      var what = t.getAttribute('data-st'), val = t.value;
      if (what === 'behindOp') { each(function (x) { if (x.sr.behind) x.sr.behind.op = clamp(+val, 0.1, 1); }); var vb = t.parentNode.querySelector('.v'); if (vb) vb.textContent = Math.round(val * 100) + '%'; return; }   // v3.0.0
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
    if (t.matches('[data-ps]')) { var psk = t.getAttribute('data-ps'); each(function (x) { x.sr.sizes[styleKey(x, psk)] = clamp((+t.value || 100) / 100, IxAdLayouts.CONST.SIZE_FREE_MIN, IxAdLayouts.CONST.SIZE_FREE_MAX); }); t.classList.add('am-dirty'); return; }   // v3.0.0
    if (t.id === 'am-zoom') { each(function (x) { if (x.sr.crop && x.sr.crop.mode !== 'whole') x.sr.crop.zoom = +t.value; }); var vz = t.parentNode.querySelector('.v'); if (vz) vz.textContent = (+t.value).toFixed(2) + '\u00d7'; return; }
  }
  function onChange(e) {
    var t = e.target;
    if (t.id === 'am-cust') { S.custId = t.value; S.src = ''; S.changeCust = false; S.col = { main: '', accent: '' }; S.logoNewUrl = ''; S.logoNewImg = null; S.logoSwap = false; S.logoSwapKeep = false; render(); return; }
    if (t.id === 'am-srctype') { S.srcType = t.value; render(); return; }   // v2.7.1
    if (t.id === 'am-head') { S.ed.head = t.value; repaintAll(); render(); return; }
    if (t.matches('[data-var]')) { if (t.value) { S.words[t.getAttribute('data-var')] = t.value; repaintAll(); } render(); return; }   // v3.1.0: another source's words
    if (t.matches('[data-shslot]')) { var ssk = t.getAttribute('data-shslot'), son = t.checked; each(function (x) { if (!x.sr.shared) return; var cur = (x.sr.shared.slots || ['headline', 'headline2', 'supporting', 'business']).slice(), at = cur.indexOf(ssk); if (son && at < 0) cur.push(ssk); if (!son && at > -1) cur.splice(at, 1); x.sr.shared.slots = cur; }); render(); return; }   // v3.1.0
    if (t.matches('[data-show]')) { var shk = t.getAttribute('data-show'), on = t.checked; each(function (x) { var kk = styleKey(x, shk); if (isExtra(x, shk)) { if (on) { x.sr.style = x.sr.style || {}; x.sr.style[shk] = Object.assign({}, x.sr.style[shk] || {}, { show: true }); } else if (x.sr.style) { delete x.sr.style[shk]; if (x.sr.sizes) delete x.sr.sizes[shk]; } } else { var pp = pieceOf(x.sr, kk); if (on) delete pp.show; else pp.show = false; tidy(x.sr, kk); } }); render(); return; }   // v3.0.1: base places hide; extra lines are added
    if (t.matches('[data-pf]')) { var pfk = t.getAttribute('data-pf'); each(function (x) { var kk = styleKey(x, pfk), pp = pieceOf(x.sr, kk); pp.font = t.value.trim(); x._fontRetry = false; if (pp.font) IxAdLayouts.ensureFont(pp.font); tidy(x.sr, kk); }); render(); return; }   // v3.0.0
    if (t.matches('[data-ps]')) { render(); return; }
    if (t.id === 'am-layout') { var code = t.value, Lc = IxAdLayouts.LAYOUTS[code]; each(function (x) { if (cardShape(x) !== Lc.shape) return; x.sr.layout = code; if (Lc.usesPhoto) { var src = (S.drafts[Lc.shape] || []).filter(function (d) { return d.sr.layout === code; })[0]; x.sr.crop = x.sr.crop && x.sr.crop.mode !== 'whole' ? x.sr.crop : (src ? JSON.parse(JSON.stringify(src.sr.crop)) : null); } else x.sr.crop = null; }); render(); return; }
    if (t.matches('[data-st="palAdd"]')) { var ph = hex(t.value); if (ph && S.ed.palette.indexOf(ph) < 0) S.ed.palette.push(ph); render(); return; }
    if (t.id === 'am-logokeep') { S.logoKeep = t.checked; return; }
    if (t.id === 'am-fontkeep') { S.fontKeep = t.checked; return; }
    if (t.id === 'am-logoswapkeep') { S.logoSwapKeep = t.checked; return; }
    if (t.matches('[data-st]')) {
      var wc = t.getAttribute('data-st');
      if (wc === 'behindOp') { render(); return; }   // v3.0.0
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
    document.addEventListener('paste', takePaste);   // v2.3.0: a screenshot pasted anywhere while the Paste tile is picked
    window.addEventListener('mousemove', dragMove); window.addEventListener('mouseup', dragEnd); document.addEventListener('keydown', onKeyFT); window.addEventListener('blur', dragEnd); document.addEventListener('mouseleave', dragEnd);   // v4.0.0 · v4.0.2: no half-finished drag
    if (miss.length) { m.innerHTML = '<div class="am"><div class="am-head"><h2>' + W.title + '</h2>' + badge() + '</div><div class="am-body"><div class="am-err">' + esc(miss.join(' ')) + '</div></div></div>'; return true; }
    render();
    Promise.all([loadNeeds(), loadAds(), loadMedia()]).then(function () { render(); });
    log('mounted');
    return true;
  }
  window.addEventListener('std:panel:admaker', function () { setTimeout(mount, 0); });
  window.TaAdMaker = { mount: mount, VERSION: VERSION, _state: function () { return S; }, _render: render, _bizDefault: function () { businessDefault(); } };
  log('loaded, listening for std:panel:admaker');
})();
