/* ipp-picker-v1.50.js */
/* v1.50 (22 Oct 2026, Reserved Tiles Build S2 · Picker matches, notes).
   Pairs ipp-picker-markup-v1.20.js and ipp-picker-v1.34.css. Needs
   ix-issue-data v1.0.75 (slot.note, blockFields.note, holds,
   shelf.usedArticleIds), Scenario 124 v2.26 (fill and clear pass the
   field raw, so slot-note writes need no 124 change) and 103B v1.4.1.
   1 · THE RAIL IS THE ARTICLES SHELF. "Allocations from Print" (lines,
       dots, Assign, Link, the fold strip, the Place bar) is gone: no live
       plan predates the Allocator placing tiles, so nothing needs the old
       path (ruled 22 Oct). The right rail now lists this title's articles
       not yet in this issue, with a search, in three groups (RT-9b):
       "Matches a print item on this plan" (same name as a reserved tile's
       print title, or the article a print item on this plan already
       names), "Never used in an issue" (not in shelf.usedArticleIds), and
       "Ran before". Newest first inside a group. Nothing is greyed.
   2 · FILL IS A SHELF PICK. Click an empty article slot (saved or new),
       or Match article on a reserved tile: that tile becomes the target
       (gold dashed ring, "Next: pick an article from the shelf") and the
       shelf says which slot it is filling, with a Cancel. Click an article
       on the shelf: it lands on the tile pending (gold, its own Cancel)
       and the shelf returns to the top of its list. A Match records the
       article on the print item through 103B in the same Save (as the
       old slot panel did). The slot popover is deleted; the panel code
       stays only for Events and Real Estate lists, and for Move to….
   3 · RESERVED TILES show Match article beside Create article.
   4 · NOTES ON EMPTY ARTICLE SLOTS (C6, ruled YES). An empty slot has an
       Add note link. The note card is the tile itself: a text box and
       three links, Fill this slot, Move to…, Delete. Typing is pending at
       once (gold, Cancel); nothing writes until the Picker's one Save.
       Save writes the note as a 124 fill of blockFields.note (RT-8 refusal
       comes back from the Worker); Delete is a 124 clear of it; filling a
       noted slot clears the note in the same batch, silently (RT-7a).
       Move to… lists this title's other open, unlocked plans by date
       (Data Worker /plans) with a tick each; Save copies the note to each
       chosen plan's lowest open article slot (a slot is added when none
       is open, RT-2) and takes it off this one. Text sent to 124 has its
       whitespace folded to single spaces and straight double quotes
       turned to curly ones (the text rides inside Make's JSON string).
   5 · REMOVE SLOT stays a plain link on any empty slot (Choice B, ruled
       22 Oct). The Picker never trims a slot on its own; only the
       Allocator cleans up a slot it added itself.
   6 · TOASTS STACK on the shared IxToast rail: every message carries its
       own key, so a second error no longer replaces the first. Errors
       and unverified messages persist until dismissed; ok and info fade
       (UI Standing Rules v2.3).
   Hardcoding (provisional, numbered by the doc-maintenance chat):
     HC-P-PK50-1  /plans is reached from PP_WEBHOOKS.plans, else from
                  PP_WEBHOOKS.planBoard with "/plan-board" swapped for
                  "/plans".
     HC-P-PK50-2  the shelf group names and the NEXT words.
     HC-P-PK50-3  the note text rules before 124 (whitespace folded,
                  straight double quotes to curly).
   Not in this version: Revenue ad-slot notes (S3), Compile's holds tile
   (S3), the Layout and Send Setup "edits not saved" on load (S3).
   v1.49 (21 Oct 2026, 106 Gap Interview S10): SHORTER NEXT WORDS, AND A
   REFUSED WRITE SAYS WHY. The Place target read "Next: click to place",
   the open slot "Next: pick an article" (HC-P-PK48-1 reworded). Scenario
   124 v2.26 answers 409 with the Data Worker's own sentence in error, so
   the batch writer throws that sentence (refusalOf(), as ipp-publish
   v2.51). FILE constant corrected.
   v1.48 (21 Oct 2026, 106 Gap Interview S9 · S5 ruling 8): ARMED SLOTS
   SAY WHAT COMES NEXT (NEXT words, HC-P-PK48-1). */
/* v1.47 (20 Oct 2026, 106 Gap Interview S5): the rail's Editorial Picker button no longer shows the Content Controller ticked/total count ("4/6"), ruled noise by Jeff. paintPickerTab keeps its signature; the .ipp-pk-tabn span is no longer drawn, so the CSS rule for it is unused until the next ipp-picker CSS bump. */
/* ipp-picker-v1.50.js (the block below is the running history) */
/* ============================================================
   ipp-picker — Picker view (history)
   CHANGELOG
     v1.46 (20 Oct 2026, 106 Gap Interview S4, Jeff on 901A at six
       events: "Add event should not show after there's a sixth tile;
       you should be forced to delete one before you add another. Same
       with real estate"). Pairs markup v1.19 and CSS v1.33, unchanged.
       - NO ADD TILE WHEN THE BLOCK IS FULL. At the largest design count
         the add tile is not drawn; the note line under the row says
         "Full at 6. Remove one to add another." Remove a tile and the
         add tile comes back. v1.45's greyed add tile (.is-full) is no
         longer drawn; its CSS rules stay unused until the next CSS bump.
     v1.45 kept below.
     v1.45 (20 Oct 2026, 106 Gap Interview S4, Jeff on 901A: "Not seeing
       anything turn salmon. In fact, I'm even allowed to save."). Pairs
       markup v1.19 (unchanged) and CSS v1.33.
       - SAVE IS OFF WHILE A LIST COUNT HAS NO DESIGN (standing rule of
         19 Oct: a forbidden state is refused before Save, never caught
         at Save). With 3 events and designs for 1, 2, 4 or 6 the Save
         button stays off and the save bar says why: "Events: 3 has no
         design (takes 1, 2, 4 or 6)". Adding is still allowed at 3,
         because 4 is one add away; only Save is held. v1.38's refusal
         inside Save stays as the last guard.
       - THE SALMON HEAD WAS LOST TO THE CASCADE. v1.32's .ipp-ct.is-bad
         rule lost to the section-head rule's higher specificity; v1.33
         states it at the same specificity, so "no design for 3" is
         salmon.
     v1.44 kept below.
     v1.44 (20 Oct 2026, 106 Gap Interview S4 · list tiles). Pairs
       markup v1.19 (unchanged) and CSS v1.32. Mockup ipp-picker-list-
       tiles-mockup v0.1, Jeff: "yes that is what I meant"; address
       alone on listings, a photo where there is one, drag to reorder.
       - ONE TILE PER EVENT AND PER LISTING. An Events or Real Estate
         block no longer draws as one tile that says "2 events"; each
         item in the block is a tile of its own, the size of an article
         tile (210 wide, fixed height): position tag top left ("Event 2",
         "Listing 3"), green check top right when saved, the name on two
         lines, a meta line (date and venue for events; listings show the
         address alone, with the listing photo at the left when there is
         one), Remove at the bottom right. The add tile closes the row,
         as it does for Articles; it greys out when the block is full at
         its largest design count. The block itself is unchanged: still
         one Events block and one Real Estate block per plan (perIssue
         one); Save still writes the id list through 124 as v1.26 did.
       - GOLD FOR WHAT WAITS, IN PLACE. An added item is a gold tile,
         "Event 3 · goes in on Save", with Cancel this. A removed item
         stays in its position, gold, struck through, "comes out on
         Save", with Keep it. Nothing shifts while the operator decides.
       - DRAG TO REORDER LISTINGS. Listings run in the order they sit;
         dragging a tile left or right in the row sets the order, gold
         until Save. Events keep date order, so their tiles do not drag.
         The canvas scrolls on its own while a drag sits near its top or
         bottom edge (standing rule, 15 Oct).
       - THE COUNT RULE MOVES TO THE SECTION HEAD. "2 events · takes 1,
         2, 4 or 6" replaces the count inside the tile; it goes salmon the
         moment the count has no design, before Save is reached. The row
         ends in a note line for what waits ("Changes wait for Save ·
         Cancel changes"), a failed save, and the order rule.
       - THE PANEL IS THE SHELF ONLY. The side panel no longer lists what
         is in the block (the tiles show it; ruling of 17 Oct); it is
         headed "Add events" / "Add listings" and offers the publisher's
         items not yet in the block. Remove lives on the tiles.
       - Block-level states keep their one tile: a slot being removed, a
         print item held or coming out, and The Find (blocked). v1.43's
         add link inside the block tile is retired; the add tile does it.
       - listItem reads RE LISTINGS property-image-link as thumb (the
         field the Data Worker uses, v1.0.45).
       HARDCODING
         HC-P-PK44-1  DRAG_EDGE 60px, DRAG_STEP 12px: the canvas scrolls
                      by 12px per dragover while a tile drag sits within
                      60px of its top or bottom edge.
     v1.43 kept below.
     v1.43 (20 Oct 2026, 106 Gap Interview S4 · Picker add). Pairs
       markup v1.19 (unchanged) and CSS v1.31 (the add link).
       - EVERY EVENTS AND REAL ESTATE TILE SAYS HOW TO ADD. Since v1.26
         a list tile opened its panel only when the tile itself was
         clicked, and nothing on the tile said so (Jeff on 901A: "How do
         I add another event?"). Each open list tile now carries a small
         blue text link in its footer, left of Cancel: "+ Add events" /
         "+ Add listings" when the block has items, "Pick events" /
         "Pick listings" when it is empty, "Change events" / "Change
         listings" when it is full at its largest design count. The link
         and the tile click do the same thing: open the panel. Blocked
         tiles (The Find, a locked plan, an unreadable list) show no
         link; the tile's own why line still says what is wrong.
         A plan has one Real Estate block and one Events block
         (perIssue one, v1.35 oneAlready): the link adds items inside
         that block, never a second block.
       - LIST_NOUN gains the link words (HC-P-IPP3-4 covers the copy).
     v1.42 kept below.
     v1.42 (19 Oct 2026, 106 Gap Interview S3 · greeting title). Pairs
       markup v1.18 and CSS v1.30, both unchanged.
       - THE REFUSAL TOAST GOES AWAY WHEN THE OPERATOR COMPLIES. v1.41's
         red "The greeting needs a title..." message is sticky (errors
         persist until dismissed, ix-success-toast rule) and nothing
         ever dismissed it: the operator filled the box, saved, and the
         green "Greeting saved." landed beside the stale red one (seen
         on WLN-901A, 19 Oct). The refusal now carries its own toast key
         (GR_MISSING_KEY) and is dismissed (IxToast.dismissKey) the
         moment the last red box is filled by typing, and again at the
         top of any Save that passes the empty check. Only this one
         message is touched; other Picker toasts keep their kind keys.
       - FILE constant corrected (v1.41 carried 'ipp-picker-v1.40.js').
     v1.41 (19 Oct 2026, 106 Gap Interview S3 · greeting title). Pairs
       markup v1.18 (title labelled required) and CSS v1.30 (the
       missing-field border).
       - SAVE REFUSES AN EMPTY REQUIRED FIELD (ruled 19 Oct: "why design
         something that Saves when something required is empty"). Title,
         paragraph and short greeting are all required (S2 ruling 1 for
         the title; the Worker's readiness rule, ix-issue-data v1.0.63,
         for all three). Save with any of them blank sends nothing: the
         empty boxes take a red border, the first one gets focus and the
         toast names them ("The greeting needs a title and a short
         greeting before it can save."). Typing in a box clears its red.
         Lengths are unchanged: a short hand-written field still saves
         (v1.39); only an empty one is refused. GR_FIELDS carries
         required:true and a plain-English `word` per field; nothing else
         in the file types the rule.
     v1.40 (17 Oct 2026, 106 Gap Interview S2 · shadow plan). Pairs
       markup v1.17 and CSS v1.29, both unchanged.
       - NO AROUND TOWN LINE ON THE PICKER (ruled 17 Oct on WLN-901A,
         and queued since S17: "AT opener line off the Picker"). Around
         Town is a Layout matter: the group, its design and its teaser
         live on the Layout tab. The Picker draws its article slots as
         one flat row of tiles in plan order; opener rows stay in the
         board and in every save op, they are just not drawn. atLine()
         is kept for reference and no longer called.
       - VERSION constant corrected (v1.39 carried '1.38'; badge read
         v1.38).
     v1.39 (17 Oct 2026, 106 Gap Interview S2 · shadow plan). Pairs
       markup v1.17 (maxlength 50 / 600 / 140); CSS v1.29 unchanged.
       - GREETING LENGTHS MATCH WHAT THE PUBLISHER ALREADY WRITES (ruled
         17 Oct from the "WLN Greetings & Closings" instructions): title at
         most 50, paragraph 550 to 600, short greeting at most 140. The
         Picker had 30 / 300 / 140 and cut WLN-122B's real paragraph
         (590 chars) at 300. GR_FIELDS now carries min as well as max;
         the paragraph is the only field with a min and it applies to
         the AI answer only, never to Save (a hand-written greeting is
         never refused for being short).
       - AI GENERATE gets the same targets: paragraph 550 to 600 in the
         publisher's voice, title at most 50, short greeting at most 140,
         always positive, and told to spread the mentions across several
         items rather than lead with one. An answer outside the paragraph
         range counts as "does not fit" and gets the usual one retry.
       - HC-P-S7-13 stays the home of these numbers (GR_FIELDS + markup
         maxlength); nothing else in the file types a length.
     v1.38 (13 Oct 2026, Allocator RE Events · 5, step 2: COUNTS AND DONE).
       Built on S16's v1.37. Pairs ipp-picker-v1.27.css + markup v1.15
       (the Done tick and its host in each list frame's header); shell
       v1.16 unchanged. Needs Data Worker ix-issue-data v1.0.53
       (designChoices[].itemCount, slot.listDone, blockFields.listDone),
       Scenario 124 v2.23 (op flag), and the DESIGNS item-count records.
       Spec Allocator-RE-Events v1.13, Section 7.4.
       - THE COUNTS A LIST TAKES ARE THE COUNTS THAT HAVE A DESIGN. For a
         list block (events, listings; The Find when it can be filled
         here) the allowed item counts are the itemCount values of the
         live DESIGNS rows made for its type (board.designChoices). The
         slot panel shows "3 of 1, 2, 4 or 6"; a count with no design is
         refused at Save, per tile: "Events take 1, 2, 4 or 6 items. You
         have 3." Nothing past the largest count can be added. No count
         is typed in code; add a 3-item record and 3 is allowed.
       - THE DESIGN FOLLOWS THE COUNT. On Save, a list that lands with n
         items also writes the block's design: the one DESIGNS row of its
         type whose itemCount is n (this title's own row first, then the
         platform row), through 124 fill on blockFields.design, the same
         write Layout makes. An emptied list clears the design (124
         clear). Two rows for one count, or none, refuse the Save and say
         which.
       - A COUNT-DESIGNED KIND IS BORN WITHOUT A DESIGN, ON PURPOSE. When
         every design made for a Content Controller row's block type
         carries an item count, the row's pending note reads "design set
         by the count on Save" instead of "no design yet", and the tick
         shows no "Layout picks one" toast.
       - DONE PICKING. Each list frame (Real Estate, Events; The Find
         once fillable) shows one tick, "Done picking", for its one block.
         It reads slot.listDone. Ticking is a change like any other: gold
         until Save, with a Cancel link, written through 124 op flag on
         blockFields.listDone and read back. Adding or removing an item
         on a block marked done unticks it (gold) automatically; taking
         the list change back puts the tick back. The tick waits while
         the block has no items or is being removed. Publish reads it
         (ipp-publish v2.16): Compile stays off until every list block
         in the plan is marked done.
       - FRESHNESS ON THE SLOT PANEL. The publisher's events are offered
         only when they end on or after this plan's publish date (any
         date of a multi-date event counts); listings only when created
         or changed within LIST_FRESH_MONTHS of it. No publish date: today
         is used and the panel says so. Reuse across plans and editions is
         unlimited (ruled 13 Oct); these two rules are the only filter.
       HARDCODING
         HC-P-STC-4  LIST_FRESH_MONTHS { re: 4 }: listings offered are those
                     created or changed within four months of the publish
                     date. Candidate for a publisher setting (spec §11).
     v1.37 (13 Oct 2026, IPP Build S16 · Catalog S2: THE CONTENT
       CONTROLLER COMES FROM THE CATALOG). Pairs ipp-picker-v1.26.css
       and ipp-picker-markup-v1.14.js (both new), ipp-shell-v1.16.js
       (Editorial and Revenue under Picker). Needs Data Worker
       ix-issue-data v1.0.43 or later (/plan-board answers catalog) and
       the IX_CONFIG changes made with this file: catalog the-find says
       perIssue one; addTypes drops text-ad. Rulings BC-1, BC-2, BC-4
       (12 Oct) and Jeff's S16 answers (13 Oct): C1 to C8.
       - THE ROWS ARE THE CATALOG. One row per BOARD.catalog entry with
         side editorial and controller true, in catalog order. Nothing
         is typed in markup (v1.14 ships an empty list). The row's
         label is the title's SECTIONS name (sectionName), else the
         catalog name. Add a catalog line and the row appears.
       - TICKED MEANS THE PLAN HAS THE BLOCK (BC-2), read from the
         board (plan.blockIds) plus what is waiting: a block marked for
         removal does not count, a waiting new slot does. The include-*
         fields are no longer read or written: cc-save is gone, hydrate
         is gone, [data-ipp-cc-state] is not read. Only the Picker ever
         read them (S1 finding); the Webflow fields stay until plan 888
         proves this, then Jeff deletes them by hand.
       - EVERY TICK WAITS FOR THE ONE SAVE. Tick on: one new slot of
         the entry's kind (blockType = add, design = the catalog's born
         design, position after the kind's last block), gold, written
         by Save through 124 create as any new slot. Tick off: the
         kind's empty saved blocks are marked for removal (124 delete
         on Save) and any waiting one is dropped. A row with a change
         waiting turns gold, says what Save will do ("adds 1 slot on
         Save", "removed on Save") and has its own small Cancel. The
         same rule for every row: Articles, The Find, Real Estate,
         Events, Local Weather (C7). perIssue one never makes a second
         block; perIssue many (Articles) adds one slot per tick, more
         come from Add slot as today.
       - UNTICK WITH CONTENT REFUSES (C6): a row whose blocks hold
         anything (plan.filledIds, as the Worker counts them) shows the
         grey box and says "Remove items first."
       - GREETING STAYS (C3, reversing the 8 Oct move): its row is
         always ticked and never toggles; its card and its own Save
         stay at the bottom of the canvas. The Greeting row is the
         catalog entry whose labels name the Greeting block type
         (HC-P-S16-1), and its canvas section is the markup section
         carrying that label (data-ipp-sec-block).
       - COUNTS (C8): the number on a row is how many things its blocks
         hold now: filled article slots, events, listings, businesses.
         Blank at zero, and blank on rows with nothing to count
         (content none: Greeting, Local Weather).
       - CANVAS SECTIONS follow the rows: a row's section (markup
         [data-ipp-sec], keyed by IX_CONFIG.sections, found through the
         row's assetType) shows while the row is ticked, pending ticks
         included. A row with no section (Local Weather) shows nothing
         on the canvas; Layout shows its block.
       - THE EDITORIAL TAB COUNT: the rail's Picker › Editorial button
         shows ticked/total rows (.ipp-pk-tabn), as Layout shows its
         designs.
       - Gone: CATS, cat(), hydrate(), saveCC(), syncOneInclude(),
         oneEntryForCC(), ccKeyOfAsset(), addOneFromCatalog(),
         removeOneOf(), ccCount(), ccFromBoard(), the EditState 'cc'
         scope. IPP.picker no longer exports hydrate or CATS.
       HARDCODING
         HC-P-S16-1  GR_LABEL 'GR' names the Greeting's NL-BLOCKS block
                     type, to find its catalog row and keep it always
                     on. Same constant and class as HC-P-S12-3 (Layout)
                     and the 'GR' test in renderBoard below. Platform
                     level, unless IX_CONFIG.greetingBlock names another
                     (not yet read; added when a title needs it).
         HC-P-S16-2  Copy on the rows: "adds 1 slot/block on Save",
                     "removed on Save", "no design yet", "Remove items
                     first." Platform level.
     v1.36 (13 Oct 2026, Allocator RE Events · 4, step 1 continued: THE
       CONTENT CONTROLLER TICK ADDS THE ONE BLOCK). Pairs ipp-picker-v1.25
       .css + markup v1.13 (both unchanged). Supersedes v1.35, which took
       Add events / Add real estate away before anything else could add the
       block (Jeff, 13 Oct: "how do we add anything to the section?").
       Block Catalog ruling BC-2 (12 Oct): the tick is read from the
       blocks. Spec Allocator-RE-Events v1.13, Section 7.3.
       - A ONE-BLOCK KIND IS TICKED INTO THE PLAN. For a Content Controller
         row whose section's catalog entry says perIssue "one" and names an
         add label (today Real Estate and Events; Greeting stays always on):
           tick ON   adds the block, gold, as a new slot with the entry's
                     label and born design (BOARD.catalog[].design, the
                     same rule Add used). Save writes it through 124
                     create, as any new slot. Cancel on the tile, or
                     unticking, takes it back.
           tick OFF  when the block is empty: the saved block is marked
                     for removal (gold, "removed on Save") and any waiting
                     one is dropped. When it holds anything the tick stays
                     on and says so, as before.
         Nothing adds a second: a tick on a kind that already has its
         block changes nothing.
       - THE TICK IS READ FROM THE BLOCKS (BC-2) for one-block kinds: on
         when the plan has the block (saved and not being removed, or
         waiting), off otherwise. "Has content" means an item, a print
         item or an article in it, not merely that the block exists, so
         an empty block can be unticked.
       - The plan's include-* switch (PP_WEBHOOKS.cc, op cc-save) is still
         written on every tick and whenever a Cancel or Remove slot leaves
         a one-block kind with no block, so anything that still reads it
         agrees with the blocks. It is no longer what the tick shows.
       - Remove slot on an empty list tile is offered for one-block kinds
         (catalog perIssue "one") instead of the typed words event and re.
       - Which Content Controller row is which kind: the row's data-section
         is a key in IX_CONFIG.sections; that section's assetType finds the
         catalog entry. Nothing here names event or re.
       - No new hardcoding. CATS (the include-* slugs and section ids)
         stays as it was.
     v1.35 (13 Oct 2026, Allocator RE Events · 4, build step 1: ONE BLOCK
       EACH). Pairs ipp-picker-v1.25.css + markup v1.13 (both unchanged).
       Spec Allocator-RE-Events v1.13, Section 7.3 and build order step 1.
       Needs Data Worker ix-issue-data v1.0.43 or later (/plan-board
       answers catalog) and the IX_CONFIG changes made with this file:
       addTypes drops event and re; catalog events and real-estate say
       perIssue: one.
       - THE PICKER READS THE CATALOG (BOARD.catalog, the one list every
         page reads). A section's catalog entry is the one whose assetType
         is the section's key (article, event, re, text-ad).
       - NO SECOND BLOCK OF A perIssue: one KIND. The Add tile is not drawn,
         and addSlot refuses, when the catalog entry for that section says
         perIssue "one" and the plan already has a block of it (saved, or
         waiting as a new slot). IX_CONFIG.addTypes still decides whether
         Add is offered at all; this is the second check, so the rule holds
         even if addTypes lists the type again one day.
       - A PRINT ROW NEVER GOES INTO A LIST TILE. Assign on an orange row
         (an Events page, an RE page, a Find page) is offered, and hold()
         accepts, only when the section's catalog entry says content "one"
         (a tile that holds one asset, today the article tiles). An Events
         page or RE page row shows on the Allocations list with no Assign;
         the Events and Real Estate tiles are filled from their items. This
         retires the path that made WLN-998B's extra blocks. Saved holds on
         list tiles from before today still show as they are (reality);
         none can be made.
       - No catalog on the board: Add is unchanged (addTypes alone), and an
         orange row's Assign is refused with a sentence naming
         IX_CONFIG.catalog. Nothing falls back silently.
       - No new hardcoding. The words "one", "list" and "perIssue" are the
         catalog's own values (HC-P-BC-1, Data Worker). Nothing here names
         event or re.
     v1.34 (13 Oct 2026). Pairs ipp-picker-v1.25.css + markup v1.13
       (unchanged). Needs ta-create-from-print v1.1.2 on the T-A page for
       "Set it on the article" when the ASF is not on this page. Ruled by
       Jeff 13 Oct (mockup inbxify-picker-slot-type-mockup-v0_1, all five
       accepted): the Section is set only on the Article form, and a slot
       has no type of its own; it takes the type of the article in it.
       - THE SECTION SHOWS AS TEXT. No dropdown, no Cancel, no 124
         article-section write. The tile shows the Section's name and its
         type tag, read from the article.
       - NO SECTION: "No Section" in salmon, a dashed "No type" tag, and
         "Set it on the article", which opens that article's form: in
         place when the ASF is on this page (window.InbxASF), else on the
         T-A page (?ipp_edit=<article>&ipp_ret=<this page>), coming back
         here when the form closes. The board is read fresh either way.
       - AN EMPTY SLOT TAKES ANY ARTICLE. Assign fills the lowest open
         slot whatever type was saved on it; the Picker never refuses an
         article for its slot's type.
       - ON SAVE, A FILLED SLOT TAKES ITS ARTICLE'S TYPE (124 layout,
         read back), whenever the saved type differs. If its saved design
         is not one of that type's designs (board.designChoices), the
         design is cleared (124 clear on blockFields.design, read back),
         so Layout and Publish ask for one. An article with no Section
         leaves the slot's type and design as they are.
       - ON SAVE, AN EMPTIED ARTICLE SLOT LOSES ITS TYPE AND DESIGN, in
         the same Save (124 layout with type null, 124 clear on design).
       - No new hardcoding.

     v1.33 (Controls parity, 12 Oct 2026). Pairs ipp-picker-v1.24.css (new)
       + markup v1.13 (unchanged). Needs Data Worker ix-issue-data
       v1.0.49 and Scenario 124 v2.22 (op article-section).
       Ruled by Jeff: an article references a Section; its type ALWAYS
       comes from that Section. The ARTICLES block-type field is deleted.
       Supersedes v1.32's own-type reading and its article-type write.
       - THE ARTICLE TILE: every picture the same size (4:3), every title
         two lines tall, then a small Section dropdown and the type.
         The type is shown, never edited: the Section's FA / TS / LBP, or
         "No Section yet" in salmon. A type that clashes with the slot's
         shows in salmon ("in an FA slot").
       - THE SECTION DROPDOWN lists this title's Sections that carry a
         type (/sections, labels in layout.articleTypes). A change turns
         gold, stays while you work elsewhere, saves with Save (124
         article-section, read back), and a small Cancel on the tile puts
         it back. Locked plans show it read-only.
       - FIT: an article with no Section has no type, so it only goes in a
         slot with no type. An untyped slot still takes the article's
         Section type on Save (124 layout op).
       - The tile no longer prints the business line under the headline;
         the slot panel still names it.
       HARDCODING: HC-P-CP-2 narrows to the ARTICLES 'section' slug.
     v1.32 (Controls parity · S2 step 4, 12 Oct 2026). Pairs
       ipp-picker-v1.23.css + markup v1.13 (both unchanged). Needs Data
       Worker ix-issue-data v1.0.48 (/sections answers blockType) and
       Scenario 124 v2.21 (op article-type).
       Ruled 12 Oct (Jeff): an article's type (FA, TS, LBP) is its own,
       else its Section's; it must match its block; the Picker is where it
       is decided for certain and writes it back to the article.
       - AN ARTICLE ONLY GOES WHERE IT FITS. Every way into a slot (the
         slot panel, Show available assets, Assign) checks the article's
         type against the slot's. A TS article is shown, not offered, in
         an FA slot ("TS article · this is an FA slot"). Assign picks the
         next open slot of the article's type, or an untyped one.
       - AN UNTYPED SLOT TAKES THE ARTICLE'S TYPE. A new slot is created
         with it; a saved one is typed through 124's layout op (end-group
         and block-text sent back as they are), checked by read-back.
       - THE TYPE IS WRITTEN BACK TO THE ARTICLE when the article has none
         of its own: the slot's type, through 124's new article-type op.
         ARTICLES' option ids are read from ix-asset-list's options, never
         typed in. This is a note, not a failure: the fill still counts.
         Before 124 v2.21 is live the note says 124 refused article-type.
       - An article with no type and no Section fits any slot.
       - Where the types come from: ix-asset-list (the article's own
         block-type and its section), and the Data Worker's /sections
         (each Section's blockType), whose address is planBoard with
         /plan-board swapped for /sections, as Layout's Preview does.
       HARDCODING
         HC-P-CP-2  ARTICLES slugs 'block-type' and 'section' read from
                    ix-asset-list's fieldData. Same class as HC-P-DW1-2.
         The words "FA", "TS", "LBP" are never typed: labels come from
         ARTICLES' options, /sections and writeIds.
     v1.31 (from v1.30). Pairs ipp-picker-v1.23.css + markup v1.13 (both
       unchanged). Needs Data Worker ix-issue-data v1.0.21 and Scenario
       124 writing `design` on create (see below).
       - A LIST SLOT IS BORN WITH ITS DESIGN. Add on Events, Real Estate
         or The Find now writes the block's design along with its type,
         so Scenario 206 keeps the block instead of skipping it. The
         design comes from /plan-board (addTypes.<key>.designId): the one
         DESIGNS row that fits that block type for this title. Nothing is
         named in this file.
       - 124 create gets designId. The read-back checks `design` came back
         as sent (TOAST-TRUTH); a 124 that ignores it fails the slot with
         "did not store design".
       - Article Adds are unchanged: no type, no design. The Layout tab
         chooses FA/TS/LBP and its design.
       - When the plan data has no design for a typed section, Add still
         works and says the slot will have no design, so 206 will skip it
         until one is set.
     v1.30 (from v1.29, Create from print P1). Pairs ipp-picker-v1.23.css
       + markup v1.13 (both unchanged). Needs ta-create-from-print v1.0.0
       and ta-asf v1.11.7 on the T-A page.
       - CREATE ARTICLE IS CONNECTED (HC-P-IPP6-2 wired). On a hollow-green
         tile, Create article opens the T-A page with the print item, this
         plan and this tile in the address:
           /title-admin/<title slug>?cfp_alloc=<allocation id>
             &cfp_plan=<plan id>&cfp_slot=<tile id>&cfp_ret=<this page>
         The T-A page shows the print page beside the Intake files it
         guesses belong, the operator confirms, the Asset Form builds the
         article, and the article is linked to the print item (103B) and
         put in this tile (124). Then the operator lands back here, on the
         Picker.
       - Create waits while other changes are unsaved: it says to Save or
         Cancel them first, so nothing typed here is lost on the way.
       - BACK FROM CREATE, THE PICKER SAYS WHAT HAPPENED. The T-A page
         leaves one message in this tab's sessionStorage (ix.cfp.result);
         the Picker shows it once, after the board has been read fresh.
         The tile's green comes from that fresh read, not from the message.
       HARDCODING (provisional)
         HC-P-CFP-10 the cfp_* address names and '#ipp-view=picker' as
                     the return view. '/title-admin/' reuses HC-P-IPP2-7;
                     window.IPP_RETURN.url still overrides the page path.
     v1.29 (from v1.28). Pairs ipp-picker-v1.23.css + markup v1.13
       (unchanged).
       - GREETING BOXES FIT THEIR WORDS. Title, super-short and paragraph
         grow to show every line, so nothing hides behind a scroll or a
         clipped edge. Fitted on typing, AI fill, Undo, Cancel, load,
         and whenever the card changes width.
       - AI GENERATE SHOWS IT IS WORKING. While it writes, the button
         stays green and its stars pulse (CSS, ipp-picker-v1.23.css),
         instead of greying out like a disabled button.
     v1.28 (from v1.27, IPP Build S7 · AI Generate connected). Pairs
       ipp-picker-v1.22.css + ipp-picker-markup-v1.13.js (unchanged) and
       Data Worker v1.0.18. Needs PP_WEBHOOKS.anthropicProxy on the page.
       - AI GENERATE WRITES THE GREETING. When the gate is open, a click
         reads the saved plan: every article slot (title, plus teaser or
         short summary when the article has one) and every event slot
         (name, date, place), in issue order, and asks Claude through
         inbxify-anthropic-proxy for a title, super-short and paragraph.
       - Lengths come from the Greeting boxes (GR_FIELDS max: 30 / 140 /
         300 then; 50 / 140 / 550-600 since v1.39), not from the prompt text. An answer that does not fit, or
         is not the three fields, gets one retry; if it still does not
         fit, nothing changes and the line says so.
       - The words land in the boxes as unsaved edits (gold, Cancel), and
         Undo puts back exactly what the boxes held before. Nothing is
         written until Save. AI never saves.
       - While it writes, the button reads "Writing…" and is off.
       - Missing PP_WEBHOOKS.anthropicProxy: the click says so and
         nothing is sent. Proxy or model errors are shown in plain words;
         the boxes are untouched (TOAST-TRUTH).
       - The "not connected yet" note is retired.
     HARDCODING (provisional ids, for the doc-maintenance chat)
       HC-P-S7-12 GR_MODEL 'claude-sonnet-4-6' (same model ta-generate
                  uses). Retires into IX_CONFIG / TA_CONFIG with the
                  other model names.
       HC-P-S7-13 The greeting prompt (platform voice rules, no invented
                  facts, no emoji). English only, same class as HC-013.
       HC-P-S7-14 Article fields read for context: teaser, short-article-
                  summary, post-summary (first present wins).
     v1.27 (from v1.26). Pairs ipp-picker-v1.21.css, markup v1.13 and
       Data Worker v1.0.18, all unchanged. One fix:
       - THE AI GENERATE LINE NAMES THE REAL WORK. An article tile holding
         a print item with no article (hollow green) used to read "Fill or
         remove 1 article slot", which sent the operator looking for an
         empty slot. It now reads "Create the article for “<print title>”,
         or take its print item out." Two or more say how many. Truly
         empty slots keep "Fill or remove…". Both can show at once. The
         rule is unchanged: a hollow-green tile still keeps AI off.
       HC-P-S7-4 (wording) grows by these lines.
     v1.26 (from v1.25, IPP Build S7 · slice 4: fill Events and Real
       Estate). Pairs ipp-picker-v1.21.css + ipp-picker-markup-v1.13.js
       (unchanged) and Data Worker ix-issue-data v1.0.18 (slots[].list).
       Shell, Scenario 124 and 103B unchanged.
       - CLICK AN EVENTS OR REAL ESTATE TILE to open its panel. Top: what
         is in the slot now. Below: the publisher's events (or listings)
         from ix-asset-list, with a search. Click one to add it, Remove to
         take it out. The tile turns gold with Cancel; nothing is sent
         until Save.
       - ORDER. Events go in date order automatically (event-start).
         Listings go in the order you add them. (Provisional, HC-P-S7-9;
         Jeff's ruling on order still open.)
       - AN ITEM ALREADY IN ANOTHER SLOT OF THIS PLAN is shown, not
         offered. Archived items are not offered. Past events and
         cancelled or postponed ones are offered but say so.
       - SAVE WRITES THE LIST THROUGH SCENARIO 127 (block level). 127
         replaces the whole design-json field, so the Picker sends the
         block's stored design-json back with only the list key changed
         (evEvents / reListings, named by the Data Worker). A block whose
         stored design-json is not valid JSON is not written: the tile
         says so. Emptying a list removes the key.
       - GREEN ONLY FROM THE READ (TOAST-TRUTH). A list counts as saved
         only when the fresh plan read shows exactly the ids sent, in
         order. If 127 cannot be reached or the read disagrees, the tile
         stays gold with "Did not save" and the reason.
       - A NEW list slot fills after its first Save (127 needs the row's
         id). The tile says so.
       - THE FIND is not fillable yet: it picks businesses and
         ix-asset-list has no business list. Its tile says so.
       - Missing PP_WEBHOOKS.designWrite: Save refuses before sending
         anything and names the missing address.
     HARDCODING (provisional ids, for the doc-maintenance chat)
       HC-P-S7-8  LIST_SOURCE: which ix-asset-list type feeds each list
                  slot (event → event, re → realestate). Retires when the
                  Data Worker answers it with the sections.
       HC-P-S7-9  LIST_ORDER: events by date, listings by pick order.
       HC-P-S7-10 Panel and tile wording for list slots.
       HC-P-S7-11 Event fields read for the panel line (event-start,
                  event-end, dt-date-short, event-location, status,
                  schedule-status) and listing field (name).
     v1.25 (from v1.24, IPP Build S7 · Greeting last). Pairs
       ipp-picker-markup-v1.13.js + ipp-picker-v1.20.css. Shell, Data
       Worker, Scenario 124 and 103B unchanged.
       - AI GENERATE WAITS FOR A FULL ISSUE. The button is off until
         every article slot and every event slot on the plan has content.
         Two ways to get there: fill the slot, or remove it. An article
         slot counts when it holds an article (a print item waiting for
         its article does not: there is nothing for AI to read yet). An
         event slot counts when its list has events. The Greeting's own
         three boxes do not count; they are what AI writes. Changes
         waiting for Save also keep it off (AI reads the saved plan).
         The line under the button says why it is off, with numbers.
       - Locked plan: AI Generate stays off, as before.
       - AI Generate is still not connected to a model. Clicking it when
         on says so; it does not pretend (TOAST-TRUTH).
       - GREETING STAYS ON in the Content Controller: always ticked,
         never unticked. Clicking it says it is always in the issue.
     HARDCODING (provisional ids, for the doc-maintenance chat)
       HC-P-S7-4  The gate's wording (#ipp_grGenWhy lines) and the
                  not-connected note.
       HC-P-S7-5  Which slot types gate AI Generate: article + event
                  (Jeff, 8 Oct 2026). Retires if IX_CONFIG.sections
                  gains a per-section "feeds the greeting" flag.
     v1.24 (from v1.23, IPP Build S6 · layout B and first-look fixes).
       Pairs ipp-picker-v1.19.css, ipp-picker-markup-v1.12.js and
       ipp-shell-v1.11.js / ipp-shell-v1.6.css (all new). Data Worker,
       Scenario 124 and 103B unchanged.
       - THE PANEL COLLAPSES. A collapse button on the Allocations card
         folds the right column to a 48px strip, and the plan takes the
         full width. The strip opens it again, and shows a dot for each
         kind of row still waiting on you (gray to place, orange no
         article yet, gold a change waiting for Save). The choice is
         remembered in this browser for every plan (localStorage
         ipp:alFolded). Collapsing is a view setting, not an edit: it
         works on a locked plan too.
       - REFRESH SPINS AND RE-READS THE ARTICLES. The refresh icon turns
         while the plan is read again, for at least 0.9 seconds. Refresh
         also re-reads the publisher's article list when it has been read
         before, so an article made in the Studio shows in a tile's panel
         without a page reload. (v1.23 had dropped this.)
       - A LOCKED PLAN CLOSES ALL EDITING, not just the tiles and the
         list: the Greeting boxes are read-only, AI Generate, Undo, the
         Greeting's Save and Cancel are off, and the Content Controller
         does not toggle. Greeting edits waiting when the plan reads
         locked are put back, and said, like the tile changes.
       - Card head: "Allocations from Print" on one line; the version
         badge on its own line under it (markup v1.12).
     HARDCODING (provisional ids, for the doc-maintenance chat)
       HC-P-IPP6-4  localStorage key 'ipp:alFolded', one setting per
                    browser for every plan. By design (a viewer
                    convenience; nothing about a publisher is stored).
       HC-P-IPP6-5  SPIN_MS 900, the least time the refresh icon turns.
                    By design (UX timing).
     v1.23 (from v1.22, IPP Build S6 · the Allocations ledger). Pairs
       ipp-picker-v1.18.css and ipp-picker-markup-v1.11.js (both new),
       Data Worker ix-issue-data v1.0.16, Scenario 124 v2.14 and
       Scenario 103B v1.4.1 (both unchanged). Approved canvas boards
       "A · Ledger" and "A · Ledger — plan locked".
       - THE RAIL IS A LEDGER. Title "Allocations from print" with a
         refresh icon. Rows grouped under the plan's sections, in the
         order of IX_CONFIG.sections (Data Worker `sections`); each
         allocation sits where its `sectionKey` says. A row whose
         sectionKey is null (print ads, house ads, Other) is not on the
         rail; no exclusion list here. A section with no rows is not
         drawn. Library rows sit in the section whose asset type matches.
       - Plain 38px rows, no cards, no counts, no strike-throughs. The
         Customer shows after " · " only when the item is paid. A 9px dot
         carries the state:
           hollow gray    the article exists, not in the issue (to place)
           hollow orange  no article, not in a tile
           hollow green   in a tile, no article yet
           solid green    in the issue
         Gold dot and gold border: a change waiting for Save, with its own
         Cancel. Nothing is written until Save.
       - ONE ACTION, "Assign →", in a fixed 68px column, on gray and
         orange rows only.
           gray    puts the article into the next open article slot
                   (unchanged rule, HC-P-IPP5-1). Only on articles: an
                   event or listing placed into a list is slice 4.
           orange  puts the print item into the next open tile of its
                   section (an empty article slot, or an Events or Real
                   Estate tile with nothing in it), adding one if the plan
                   can. Save writes the ALLOCATIONS id into the tile's
                   asset-allocation-id through 124 `fill` (a new tile
                   through 124 `create`). The field name comes from the
                   board (blockFields); none is typed here.
       - A TILE CAN HOLD A PRINT ITEM WITH NO ARTICLE (hollow green). It
         shows the print title, "No article yet" and a filled "Create
         article" button. Create is shown and NOT wired: it will open the
         Studio ASF. Picking an article for that tile in its slot panel
         fills it and records the article on the print item (103B), on
         the same Save. "Empty this slot" takes the print item out
         (124 `clear` on asset-allocation-id, and on asset-article when
         the tile has one). The tile turns green only from the read.
       - NO FOCUS. No chips, and clicking a canvas section no longer
         narrows the list (IA20 withdrawn, S6 ruling 3).
       - NO "Show available assets", "Article found", "Choose" or Create
         on the rail. Available assets stay in the slot panel.
       - LOCKED PLAN. When the plan's planning-status is one of
         IX_CONFIG.lockedPlanStatuses (board plan.locked), every row and
         dot stays, Assign, Cancel and Retry are hidden, tiles lose Create,
         Add, Remove slot and their panel, a lock icon replaces the
         refresh icon, and Save refuses. Changes waiting when the plan
         reads locked are dropped, and said. The Content Controller and
         the Greeting card are not locked by this version.
       - "Extra row left" (a Library row whose delete did not land) keeps
         its Retry in the action column: it is the only way to finish it.
       - The rail is about 50px wider on the Picker (CSS v1.18).
     HARDCODING (provisional ids, for the doc-maintenance chat)
       HC-P-IPP6-1  The four state words in the legend (to place, no article
                    yet, in a tile no article, in the issue). By design (copy).
       HC-P-IPP6-2  Copy for "Create article", "No article yet" on a tile and
                    its not-wired note. By design (copy). Retires the rail
                    Create copy in HC-P-IPP5-3.
       HC-P-IPP6-3  The rail's 68px action column and 38px row. By design
                    (UX-030 fixed sizes).
       Dot colours are platform tokens (HC-P-IA-11). HC-P-IPP2-3
       (ALLOC_FOCUS) is no longer used to place lines; it stays only for
       canLink. HC-P-IPP2-4 MISSING_WORD no longer shows.
     v1.22 (from v1.20, ruled 7 Oct: Release is withdrawn). The code is
       v1.20 exactly; v1.21's Release action is taken back out. Taking a
       plan off a print item that sits in the PubPlan's rail is done by
       unticking it on the Allocator (ta-cadence-board v0.7.13), not on
       the Picker. Emptying a slot still frees its allocation (v1.20).
       Pairs ipp-picker-v1.17.css and ipp-picker-markup-v1.10.js
       (unchanged). v1.21 must not be loaded.
     v1.20 (from v1.19, ruled 7 Oct: taking an article out of the PubPlan
       frees its allocation). Pairs ipp-picker-v1.17.css and
       ipp-picker-markup-v1.10.js (unchanged). NEEDS Data Worker v1.0.14
       (each allocation's `plans`) and Scenario 103B v1.4.1 (unchanged).
       - When a Save takes an article out of this plan (Empty this slot,
         or a slot filled with a different article), the print item it
         was allocated from has THIS plan taken off its PubPlan
         assignment through 103B `save`, in the same Save, after the 124
         write lands. Other plans on the item are kept. With none left,
         the item goes back to undecided. The Allocator then shows it
         unassigned and its Hide unlocks.
       - Not freed when the same article still sits in another slot of
         this plan (it has not left the plan).
       - Verified: 103B must echo the plan count and disposition sent.
         A free that fails is named in the message; the slot change
         itself still stands.
       - Refuses the whole Save, saying why, when a free is needed but
         the plan data has no `plans` (Worker older than v1.0.14) or the
         page has no PP_WEBHOOKS.slateWriter. Nothing is sent.
     v1.19 (from v1.18, first live look, ruled 7 Oct: print provenance
       does not travel to the PubPlan). Pairs ipp-picker-v1.17.css and
       ipp-picker-markup-v1.10.js (both unchanged).
       - A line no longer shows the print item's type word (Other, Events
         page, RE page) or its page number / print-page link. A line from
         the Asset Library still says Library.
       - The Allocator's type no longer decides anything for an article on
         the Picker: a print item typed Other that can take an article
         counts as an Article (Articles chip, Assign). Events and RE pages
         are unchanged (slice 4).
       - Messages and panels name a print item by its title, not its page.
       - HC-P-IPP2-4 (TYPE_WORD) no longer shows anywhere on the Picker.
     v1.18 (from v1.17, ruled 7 Oct: the Picker picks, it does not lay
       out). Pairs ipp-picker-v1.17.css (unchanged),
       ipp-picker-markup-v1.10.js (unchanged), Data Worker v1.0.13,
       Scenario 103B v1.4.1 and Scenario 124 v2.14 (all unchanged).
       - NO POSITIONS ON THE PICKER. Tiles show filled or empty. No Pos
         tag on a tile, a line, the Around Town line, the slot panel or a
         message. Position still lives on every NL-BLOCKS row; the Layout
         tab shows it and owns order. A new tile is tagged "New".
       - ASSIGN replaces Place, Link and Link and place. One button on a
         line puts its article into the next open article slot (lowest
         position first, then a waiting new slot). If none is open and the
         plan can add one (IX_CONFIG.addTypes), it adds one, gold and New.
         No slot clicking.
       - THE ALLOCATIONS LIST, three states:
           article exists, not in the issue: "Not in the issue yet" + Assign
           print item with no article recorded:
             same-title article found: "Article found: <name>" + Assign,
               and "Choose another"
             none found: "No article yet" + Create, and "Choose an
               existing article"
           in the issue: green, "In the issue"
         Create is shown and NOT wired. Clicking it says so and points to
         the Allocator. It opens the Studio ASF when /match lands.
       - ASSIGN ON A PRINT ITEM WITH NO ARTICLE writes two things on one
         Save: 103B records the article on the allocation, 124 fills the
         slot. One gold state, one Cancel (on the line or the tile) that
         drops both. The word "link" is gone from the page; the plumbing
         and save order are unchanged (§09: 103B first, then 124).
       - An article picked for a print item that is already in a slot
         (built and placed by hand) is recorded on Save without moving it.
       - The slot panel (click a tile) still fills or empties that one
         slot. A same-title pick there still records the article on its
         print item, quietly.
       - The publisher's articles load in the background when the plan is
         read, so the list can say "Article found" without a click.
       - Removed from the Picker: Pos tags, Place, the Place bar, Link,
         Create and link, "link waiting". The move code stays inert for the
         Layout tab (v1.14).
       - NOT IN THIS VERSION: an undo for a wrong article on a green line
         ("Not the right article"); Layout tab drag-to-reorder.
     HARDCODING (provisional ids, for the doc-maintenance chat)
       HC-P-IPP5-1  Assign's slot rule: lowest-position open article slot,
                    then a waiting new slot, then add one. By design.
       HC-P-IPP5-2  "Article found" is an exact title match (trimmed, any
                    case) between the print item and the article name. By
                    design until /match.
       HC-P-IPP5-3  Copy for the three line states, Assign, Create and its
                    not-wired note. By design (copy).
       HC-P-IPP4-3 (LINKABLE) applies as before. HC-P-IPP4-4 retires.
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
  var VERSION = '1.50';
  var FILE = 'ipp-picker-v1.50.js';

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

  /* ──────────────────────────────────────────────────────────
     CONTENT CONTROLLER (v1.37) — rows from the catalog.
     One row per BOARD.catalog entry with side editorial and controller
     true. Ticked = the plan has a block of that kind (plan.blockIds,
     less removals, plus waiting adds). Every tick waits for Save.
     ────────────────────────────────────────────────────────── */
  var GR_LABEL = 'GR';   // HC-P-S16-1 (same constant as HC-P-S12-3)
  function ccListEl(){ var v = view(); return v && IPP.q('.ipp-cc-list', v); }
  function ccRows(){
    var c = catalogList(); if (!c) return [];
    return c.filter(function(e){ return e && e.blocks !== false && e.side === 'editorial' && e.controller === true; });
  }
  function ccEntry(key){ var r = ccRows(); for (var i=0;i<r.length;i++) if (r[i].key === key) return r[i]; return null; }
  function ccLabel(e){ return String(e.sectionName || e.name || e.key); }
  function isGreetingEntry(e){ return !!(e && Array.isArray(e.labels) && e.labels.indexOf(GR_LABEL) >= 0); }
  // The canvas section a row shows: the markup section carrying one of the
  // row's block labels (data-ipp-sec-block), else the IX_CONFIG.sections
  // entry whose assetType is the row's (data-ipp-sec). null: no section.
  function ccSectionEl(e){
    var v = view(); if (!v || !e) return null;
    var labs = e.labels || [];
    for (var i=0;i<labs.length;i++) { var el = IPP.q('[data-ipp-sec-block="' + labs[i] + '"]', v); if (el) return el; }
    if (!e.assetType || e.assetType === 'other') return null;
    var l = sectionList() || [];
    for (var j=0;j<l.length;j++) if (l[j].assetType === e.assetType) return IPP.q('[data-ipp-sec="' + l[j].key + '"]', v);
    return null;
  }
  function showSectionOf(e, on){ var el = ccSectionEl(e); if (el) { if (on) el.removeAttribute('hidden'); else el.setAttribute('hidden',''); } }
  // Which saved blocks are this row's: the Worker's blockIds, else its rule.
  function ccBlocks(e){
    var ids = (e.plan && Array.isArray(e.plan.blockIds)) ? e.plan.blockIds : null;
    return slots().filter(function(s){
      if (ids) return ids.indexOf(s.id) >= 0;
      return s.blockType ? (e.labels || []).indexOf(s.blockType) >= 0 : (e.add === '' && s.assetType === e.assetType);
    });
  }
  function ccAdds(e){
    return P.adds.filter(function(a){
      if (a.cat) return a.cat === e.key;
      return a.blockType ? (e.labels || []).indexOf(a.blockType) >= 0 : (e.add === '' && a.assetType === e.assetType);
    });
  }
  function ccLiveBlocks(e){ return ccBlocks(e).filter(function(s){ return !P.removes[s.id]; }); }
  function ccLive(e){ return ccLiveBlocks(e).length + ccAdds(e).length; }
  function ccOn(e){ return isGreetingEntry(e) || ccLive(e) > 0; }
  // Blocks holding anything, as the Worker counts them (filledIds).
  function ccFilled(e){
    var f = (e.plan && Array.isArray(e.plan.filledIds)) ? e.plan.filledIds : [];
    return ccBlocks(e).filter(function(s){ return f.indexOf(s.id) >= 0 || !isEmptySaved(s); });
  }
  // C8: how many things the row's blocks hold now. '' when none or nothing to count.
  /* v1.38 — the Done tick in a list frame's header (markup v1.15 host
     [data-ipp-sec-done]). One block per plan, so one tick per frame. */
  function doneTick(key, list){
    var host = IPP.q('[data-ipp-sec-done="' + key + '"]'); if (!host) return;
    var live = list.filter(function(s){ return s.list && !P.removes[s.id]; });
    if (live.length !== 1 || listBlocked(live[0])) { host.innerHTML = ''; host.hidden = true; return; }
    var s = live[0], on = doneNow(s), dirty = doneDirty(s), n = listIdsNow(s).length;
    var why = s.listDone === null || s.listDone === undefined ? 'The plan data has no Done field yet (Data Worker v1.0.53).' :
              !doneField() ? 'NL-BLOCKS has no list-done field, so Done cannot be saved.' :
              LOCKED ? 'This plan is locked.' : (!n ? 'Pick at least one first.' : '');
    var off = !!why;
    host.hidden = false;
    host.innerHTML = '<button type="button" class="ipp-done' + (on ? ' ipp-on' : '') + (dirty ? ' ipp-dirty' : '') + '" data-ipp-done="' + esc(s.id) + '"' +
      (off ? ' disabled title="' + esc(why) + '"' : '') + ' aria-pressed="' + (on ? 'true' : 'false') + '">' +
      '<span class="ipp-done-box" aria-hidden="true"></span><span class="ipp-done-label">Done picking</span></button>' +
      (dirty && !P.done[s.id].auto ? '<button type="button" class="ix-revert ipp-done-cancel" data-ipp-done-cancel="' + esc(s.id) + '">Cancel</button>' : '') +
      (dirty && P.done[s.id].auto ? '<span class="ipp-done-note">unticked by the list change</span>' : '') +
      (P.fails['done:' + s.id] ? '<span class="ipp-tile-fail">Did not save: ' + esc(P.fails['done:' + s.id]) + '</span>' : '');
  }
  function ccCountText(e){
    if (e.content === 'none') return '';
    var n = 0;
    ccLiveBlocks(e).forEach(function(s){
      if (e.content === 'list') n += Number(s.listCount) || 0;
      else if ((s.asset && !s.asset.missing) || s.allocation) n++;
    });
    return n > 0 ? String(n) : '';
  }
  function ccPending(e){
    if (ccAdds(e).length) return 'add';
    if (ccBlocks(e).some(function(s){ return !!P.removes[s.id]; })) return 'remove';
    return '';
  }
  function ccNote(e){
    var st = ccPending(e); if (!st) return '';
    if (st === 'add') return (e.perIssue === 'many' ? 'adds 1 slot on Save' : 'adds 1 block on Save') + ((e.add && !(e.design && e.design.id)) ? (byCount(e.add) ? ' \u00b7 design set by the count on Save' : ' \u00b7 no design yet') : '');   // HC-P-S16-2; byCount v1.38
    var n = ccBlocks(e).filter(function(s){ return !!P.removes[s.id]; }).length;
    return ccLive(e) > 0 ? plural(n, ['empty slot removed on Save','empty slots removed on Save']) : 'removed on Save';
  }
  // Tick on: one new slot of this kind. perIssue one never makes a second.
  function ccTickOn(e){
    if (e.perIssue === 'one' && ccLive(e) > 0) return;
    var d = e.design || null;
    P.seq++;
    var nk = 'new-' + P.seq;
    P.adds.push({ key:nk, cat:e.key, assetType:e.assetType, blockType:e.add || '', designId:(d && d.id) || '', position:newPosition(e.assetType) });
    if (e.add && !(d && d.id) && !byCount(e.add)) say('This ' + ccLabel(e) + ' block will have no design: the plan data names none for ' + e.add + '. Layout picks one.', 'info');   // v1.38: a count-designed kind gets its design from the count
    changed();
  }
  // Tick off: drop the waiting ones, mark the empty saved ones for removal.
  function ccTickOff(e){
    ccAdds(e).forEach(function(a){ cancelKey(a.key); });
    ccLiveBlocks(e).forEach(function(s){
      if (isEmptySaved(s)) { P.removes[s.id] = true; delete P.lists[s.id]; delete P.done[s.id]; delete P.fails[s.id]; }   // done v1.38
    });
    changed();
  }
  function ccCancel(e){
    ccAdds(e).forEach(function(a){ cancelKey(a.key); });
    ccBlocks(e).forEach(function(s){ if (P.removes[s.id]) cancelKey(s.id); });
  }
  function ccRowHtml(e){
    var on = ccOn(e), gr = isGreetingEntry(e), filled = gr || ccFilled(e).length > 0, st = ccPending(e), label = ccLabel(e), n = ccCountText(e);
    var cls = 'ipp-cc-item' + (on ? ' ipp-on' : '') + (filled && on ? ' ipp-locked' : '') + (st ? ' ipp-cc-pending' : '');
    return '<div class="' + cls + '" data-cc-key="' + esc(e.key) + '" role="checkbox" aria-checked="' + (on ? 'true' : 'false') + '" tabindex="0">' +
      '<div class="ipp-cc-box"></div><div class="ipp-cc-label" title="' + esc(label) + '">' + esc(label) + '</div>' +
      '<span class="ipp-cc-count"' + (n ? '' : ' hidden') + '>' + esc(n) + '</span>' +
      (st ? '<span class="ipp-cc-note">' + esc(ccNote(e)) + (LOCKED ? '' : '<button type="button" class="ix-revert ipp-cc-cx" data-ipp-cc-cancel="' + esc(e.key) + '">Cancel</button>') + '</span>' : '') +
      '</div>';
  }
  function renderCC(){
    var el = ccListEl(); if (!el) return;
    var rows = ccRows();
    if (!catalogList()) { el.innerHTML = '<div class="ipp-cc-wait ipp-cc-wait--bad">The plan data has no block catalog (IX_CONFIG.catalog, Data Worker v1.0.43), so nothing can be ticked.</div>'; paintPickerTab(0, 0); return; }
    if (!rows.length) { el.innerHTML = '<div class="ipp-cc-wait">The catalog has no editorial rows.</div>'; paintPickerTab(0, 0); return; }
    el.innerHTML = rows.map(ccRowHtml).join('');
    var on = 0;
    rows.forEach(function(e){ var o = ccOn(e); if (o) on++; showSectionOf(e, o); });
    IPP.qa('.ipp-cc-item', el).forEach(function(it){ it.setAttribute('aria-disabled', LOCKED ? 'true' : 'false'); });
    paintPickerTab(on, rows.length);
  }
  // The rail's Editorial button: ticked/total, the way Layout paints its count.
  function paintPickerTab(on, total){                                        // v1.47: name only; the ticked/total count is retired (ruled noise by Jeff)
    document.querySelectorAll('.ipp-switcher button[data-view="picker"]').forEach(function(b){
      if (!b.querySelector('.ipp-pk-tabname')) b.innerHTML = '<span class="ipp-pk-tabname">' + esc(b.textContent.trim() || 'Editorial') + '</span>';
      b.classList.add('ipp-pk-tab');
    });
  }
  function wireCC(){
    var el = ccListEl(); if (!el || el.dataset.ccWired) return; el.dataset.ccWired = '1';
    var act = function(t){
      var cx = t.closest('[data-ipp-cc-cancel]');
      if (cx) { if (LOCKED || P.saving) return; var e0 = ccEntry(cx.getAttribute('data-ipp-cc-cancel')); if (e0) ccCancel(e0); return; }
      var item = t.closest('.ipp-cc-item'); if (!item) return;
      if (LOCKED) return;   // v1.24: a locked plan's Content Controller does not toggle
      var e = ccEntry(item.getAttribute('data-cc-key')); if (!e) return;
      if (isGreetingEntry(e)) { IPP.toast('The <b>Greeting</b> is always in the issue.'); return; }
      if (P.saving) return;
      if (ccOn(e)) {
        if (ccFilled(e).length) { IPP.toast('Cannot turn off <b>' + esc(ccLabel(e)) + '</b> \u2014 it has content. Remove items first.', true); return; }   // HC-P-S16-2
        ccTickOff(e);
      } else ccTickOn(e);
    };
    el.addEventListener('click', function(ev){ act(ev.target); });
    el.addEventListener('keydown', function(ev){ if (ev.key === ' ' || ev.key === 'Enter') { var it = ev.target.closest && ev.target.closest('.ipp-cc-item'); if (it) { ev.preventDefault(); act(it); } } });
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
    /* v1.39: 50 / 550-600 / 140 — the publisher's working lengths. min is
       an AI target only; Save never blocks on it. HC-P-S7-13. */
    { name:'title',      id:'ipp_greetingTitle',      payload:'grTitle',      count:'ipp_greetTitleCount', max:50,           required:true, word:'a title' },
    { name:'paragraph',  id:'ipp_greetingParagraph',  payload:'grParagraph',  count:'ipp_greetParaCount',  max:600, min:550, required:true, word:'a paragraph' },
    { name:'supershort', id:'ipp_greetingSupershort', payload:'grSupershort', count:'ipp_greetSSCount',    max:140,          required:true, word:'a short greeting' }
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

  // v1.29: a greeting box is as tall as its words.
  function grFit(el){
    if(!el || !el.offsetParent) return;           // hidden: fit when shown
    el.style.height='auto';
    var edge=el.offsetHeight-el.clientHeight;     // borders (border-box)
    el.style.height=(el.scrollHeight+edge)+'px';
  }
  var grFitObs=null;
  function grFitWatch(){
    if(grFitObs || typeof ResizeObserver!=='function') return;
    var card=grCard(); if(!card) return;
    var lastW=-1;
    grFitObs=new ResizeObserver(function(){
      var w=card.clientWidth; if(w===lastW) return; lastW=w;
      GR_FIELDS.forEach(function(f){ grFit(grInput(f.name)); });
    });
    grFitObs.observe(card);
  }
  function grSetCount(name){
    var f=grField(name); var el=grInput(name); if(!f||!el) return;
    grFit(el);
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
    GR_FIELDS.forEach(function(f){ var v=cand[f.name]; if(v==null) return; var n=String(v).length; if(n>f.max) ok=false; if(f.min && n<f.min) ok=false; });   // v1.39: min is for the AI answer only
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
    if(save) save.disabled=(n===0 || !GR.ready || GR.saving || LOCKED);
    var cancel=document.getElementById('ipp_grCancel'); if(cancel) cancel.hidden=(n===0 || LOCKED);
    paintSavebar();
  });

  // ── AI Generate (v1.28) ─────────────────────────────────
  var GR_MODEL = 'claude-sonnet-4-6';   // HC-P-S7-12
  var grAiBefore = null, grAiBusy = false;
  function aiProxy(){ return String((window.PP_WEBHOOKS || {}).anthropicProxy || ''); }
  function grWhy(text, ok){ var w = byId('ipp_grGenWhy'); if (w) { w.textContent = text; w.classList.toggle('ipp-gr-why--ok', !!ok); } }
  function waitFor(test){ return new Promise(function(res){ if (test()) { res(); return; } var n = 0, t = setInterval(function(){ if (test() || ++n > 150) { clearInterval(t); res(); } }, 100); }); }
  // The article and event lists the context needs.
  function grNeedLists(){
    if (!AVAIL.items && !AVAIL.loading && !AVAIL.error) loadAvail(false);
    var src = listSrc('event');
    if (src && !src.items && !src.loading && !src.error) loadList('event', false);
    return Promise.all([
      waitFor(function(){ return !!(AVAIL.items || AVAIL.error); }),
      waitFor(function(){ return !src || !!(src.items || src.error); })
    ]);
  }
  function articleText(id){
    var it = null; (AVAIL.items || []).forEach(function(x){ if (x.id === id) it = x; });
    var f = (it && it.fieldData) || {};
    return String(f['teaser'] || f['short-article-summary'] || f['post-summary'] || '').replace(/\s+/g, ' ').trim().slice(0, 400);   // HC-P-S7-14
  }
  // The saved plan, in issue order, as plain lines for the model.
  function grContext(){
    var arts = [], evs = [];
    slots().slice().sort(function(a, b){ return Number(a.position) - Number(b.position); }).forEach(function(s){
      if (s.assetType === 'article' && s.asset && !s.asset.missing) {
        var t = articleText(s.asset.id);
        arts.push('- ' + (s.asset.name || 'Untitled') + (t ? ': ' + t : ''));
      } else if (s.assetType === 'event' && s.list) {
        s.list.ids.forEach(function(id){
          var r = listItemById('event', id);
          if (r) evs.push('- ' + r.name + [r.when, r.where].filter(Boolean).map(function(x){ return ' (' + x + ')'; }).join(''));
        });
      }
    });
    return { arts: arts, evs: evs };
  }
  // HC-P-S7-13. Limits come from GR_FIELDS, never typed here.
  function grPrompt(ctx, retryNote){
    var plan = (BOARD && BOARD.plan) || {}, max = {}, min = {};
    GR_FIELDS.forEach(function(f){ max[f.name] = f.max; if (f.min) min[f.name] = f.min; });
    return 'Write the greeting that opens this issue of a local community newsletter.\n\n' +
      'Newsletter: ' + (plan.titleName || 'the newsletter') + '\n' +
      (plan.date ? 'Issue date: ' + plan.date + '\n' : '') +
      '\nArticles in this issue, in order:\n' + (ctx.arts.join('\n') || '- none') +
      '\n\nEvents in this issue:\n' + (ctx.evs.join('\n') || '- none') +
      '\n\nRules:\n' +
      '- Written in the publisher\'s voice: warm, neighbourly, plain English, speaking to local readers. Always positive.\n' +
      '- Point readers to what is inside. Mention several of the items above, not one; spread the attention across them. Use only the facts listed; do not invent names, dates, places or numbers.\n' +
      '- No emoji and no hashtags.\n' +
      '- title: a catchy heading over the greeting, at most ' + max.title + ' characters.\n' +
      '- supershort: a one-sentence teaser, at most ' + max.supershort + ' characters.\n' +
      '- paragraph: ' + (min.paragraph ? 'between ' + min.paragraph + ' and ' + max.paragraph : 'at most ' + max.paragraph) + ' characters. End with "Enjoy."\n' +
      (retryNote ? '- ' + retryNote + '\n' : '') +
      '\nAnswer with only a JSON object, no other text: {"title": "...", "supershort": "...", "paragraph": "..."}';
  }
  function grAsk(prompt){
    return fetch(aiProxy(), { method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ model: GR_MODEL, max_tokens: 1000, messages: [{ role:'user', content: prompt }] }) })
      .then(function(r){ return r.text().then(function(t){
        var b = null; try { b = JSON.parse(t); } catch (e) {}
        if (!r.ok) throw new Error((b && b.error && (b.error.message || b.error)) || ('the AI service answered HTTP ' + r.status));
        var text = ((b && b.content) || []).filter(function(c){ return c.type === 'text'; }).map(function(c){ return c.text; }).join('');
        var m = text.replace(/```json|```/g, '').match(/\{[\s\S]*\}/);
        var out = null; try { out = m ? JSON.parse(m[0]) : null; } catch (e) {}
        return out;
      }); });
  }
  function grShape(o){
    if (!o || typeof o !== 'object') return null;
    var c = {}, ok = true;
    GR_FIELDS.forEach(function(f){ var v = o[f.name]; if (typeof v !== 'string' || !v.trim()) ok = false; else c[f.name] = v.trim(); });
    return ok ? c : null;
  }
  function grGenerate(){
    if (grAiBusy || LOCKED || genBlocker()) return;
    if (!aiProxy()) { say('AI Generate can\u2019t run: this page has no PP_WEBHOOKS.anthropicProxy address. Nothing was sent.', 'err'); return; }
    var btn = byId('ipp_greetingGenerate'), lbl = btn && btn.querySelector('.ipp-btn-label');
    grAiBusy = true;
    if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
    if (lbl) lbl.textContent = 'Writing\u2026';
    grWhy('Reading the issue and writing the greeting\u2026', false);
    var done = function(msg, kind){
      grAiBusy = false;
      if (btn) btn.removeAttribute('aria-busy');
      if (lbl) lbl.textContent = 'AI Generate';
      paintGenGate();
      if (msg) say(msg, kind);
    };
    grNeedLists().then(function(){
      var ctx = grContext();
      if (!ctx.arts.length && !ctx.evs.length) { done('AI Generate found nothing to read on this plan. Nothing changed.', 'err'); return; }
      return grAsk(grPrompt(ctx)).then(function(o){
        var c = grShape(o);
        if (c && grAiCandidateFits(c)) return c;
        return grAsk(grPrompt(ctx, 'Your last answer did not fit. Keep every field strictly within its limit and return all three.'))
          .then(function(o2){ var c2 = grShape(o2); return (c2 && grAiCandidateFits(c2)) ? c2 : null; });
      }).then(function(c){
        if (!c) { done('AI wrote a greeting that did not fit the boxes, twice. Nothing changed. Try again.', 'err'); return; }
        var before = {}; GR_FIELDS.forEach(function(f){ var el = grInput(f.name); before[f.name] = el ? el.value : ''; });
        grAiApply(c);
        grAiBefore = before;
        var ub = byId('ipp_greetingUndo'); if (ub) ub.hidden = false;
        done('AI wrote a greeting. Read it, edit it, then Save. Undo puts back what was there.', 'ok');
      });
    }).catch(function(e){
      done('AI Generate failed: ' + ((e && e.message) || e) + '. Nothing changed.', 'err');
    });
  }
  function grUndoAi(){
    if (!grAiBefore) return;
    grAiApply(grAiBefore);
    grAiBefore = null;
    var ub = byId('ipp_greetingUndo'); if (ub) ub.hidden = true;
  }

  function grRevert(){
    grAiBefore = null; var ub = byId('ipp_greetingUndo'); if (ub) ub.hidden = true;   // v1.28
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

  // v1.41: a required field that is empty stops Save before anything is sent.
  var GR_MISSING_CLASS='ipp-greeting-input--missing';
  var GR_MISSING_KEY='ipp-picker:gr-missing';   // v1.42
  function grMissingDismiss(){   // v1.42
    if(window.IxToast && typeof window.IxToast.dismissKey==='function') window.IxToast.dismissKey(GR_MISSING_KEY);
  }
  function grAnyMissing(){   // v1.42
    return GR_FIELDS.some(function(f){ var el=grInput(f.name); return !!(el && el.classList.contains(GR_MISSING_CLASS)); });
  }
  function grRefuseEmpty(){
    var empty=[];
    GR_FIELDS.forEach(function(f){
      if(!f.required) return;
      var el=grInput(f.name); if(!el) return;
      var blank=!String(el.value||'').trim();
      el.classList.toggle(GR_MISSING_CLASS, blank);
      if(blank) empty.push({ f:f, el:el });
    });
    if(!empty.length){ grMissingDismiss(); return false; }   // v1.42
    try{ empty[0].el.focus(); }catch(err){}
    var words=empty.map(function(x){ return x.f.word; });
    var list=words.length===1 ? words[0] : words.slice(0,-1).join(', ')+' and '+words[words.length-1];
    if(window.IxToast && typeof window.IxToast.show==='function'){
      window.IxToast.show('The greeting needs '+list+' before it can save.', 'err', { key:GR_MISSING_KEY });   // v1.42: own key, so compliance can dismiss it
    } else {
      say('The greeting needs '+list+' before it can save.', 'err');
    }
    return true;
  }
  function grSave(){
    if(grDirtyCount()===0 || GR.saving) return;
    if(LOCKED){ say('This plan is locked. The greeting cannot change.', 'info'); return; }   // v1.24
    if(!GR.ready){ say('The plan has not been read yet. Wait a moment, then Save.', 'err'); return; }
    if(grRefuseEmpty()) return;   // v1.41
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
    grAiBefore = null; var ub = byId('ipp_greetingUndo'); if (ub) ub.hidden = true;   // v1.28
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
        if(String(el.value||'').trim()){
          el.classList.remove(GR_MISSING_CLASS);   // v1.41
          if(!grAnyMissing()) grMissingDismiss();   // v1.42: last red box filled, the message has done its job
        }
        grSetCount(f.name); EditState.touched('greeting', f.name);
      });
    });
    var save=document.getElementById('ipp_grSave');     if(save)   save.addEventListener('click',grSave);
    var cancel=document.getElementById('ipp_grCancel'); if(cancel) cancel.addEventListener('click',grRevert);
    grFitWatch();   // v1.29
    var gen=document.getElementById('ipp_greetingGenerate');
    if(gen) gen.addEventListener('click',function(){ if(!gen.disabled) grGenerate(); });   // v1.28
    var undo=document.getElementById('ipp_greetingUndo');
    if(undo) undo.addEventListener('click',grUndoAi);
    grPaintAll();
  }


  /* ════════════════════════════════════════════════════════════
     THE BOARD — tiles, the Allocations list, and (v1.11) writes
     ════════════════════════════════════════════════════════════ */

  /* HC-P-IPP2-3: the Allocator's type words, as the asset type they focus as. */
  var ALLOC_FOCUS = { 'article':'article', 'events-page':'event', 're-page':'re',
                      'print-ad':'ad', 'house-ad':'ad', 'other':'other' };
  /* HC-P-IPP2-4 */
  var MISSING_WORD = { article:'No article yet', event:'No events yet', re:'No listings yet', ad:'No ad yet', other:'No article yet' };
  var TYPE_WORD = { event:'Events page', re:'RE page', ad:'Ad', other:'Other' };
  var LIST_NOUN = { event:['event','events'], re:['listing','listings'], 'text-ad':['business','businesses'] };
  // v1.26 — slice 4. HC-P-S7-8 / HC-P-S7-9.
  var LIST_SOURCE = { event:'event', re:'realestate' };
  var LIST_ORDER  = { event:'date', re:'pick' };
  var LIST_FRESH_MONTHS = { re: 4 };   // v1.38, HC-P-STC-4: listings offered are those changed within four months of the publish date
  var LISTS = {};   // per source type: { items, options, loading, error, truncated }
  /* HC-P-IPP3-4: what each Add tile is called (copy). */
  var ADD_LABEL = { article:'Add article', event:'Add events', re:'Add real estate', 'text-ad':'Add The Find' };
  /* HC-P-IPP2-5 */
  var AVAIL_MAX = 60;
  /* HC-P-IPP3-5: 124's write contract, as the Allocator uses it. */
  var BATCH_URL_CEILING = 1800, BATCH_CHUNK = 15;
  /* Which tile container shows which asset type's slots. */
  var TILE_BOX = { article:'ipp_artTiles', event:'ipp_evTiles', re:'ipp_reTiles', 'text-ad':'ipp_txaTiles' };

  var LOCKED = false;      // v1.23: the plan reads locked (board plan.locked)
  var BOARD = null;        // last good /plan-board answer
  var AVAIL = { open:false, items:null, titles:[], truncated:false, error:'', loading:false, q:'' };
  // v1.32 — article types: ARTICLES option labels (from ix-asset-list) and Section types (/sections)
  var TYPES = { sec:null, list:[], names:{}, secLoading:false, secError:'' };   // v1.33: Section only; names v1.34

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
  var P = { adds:[], fills:{}, clears:{}, removes:{}, links:{}, holds:{}, lists:{}, done:{}, notes:{}, noteDels:{}, moves:{}, fails:{}, seq:0, saving:false };   // v1.34: no Section edits here; done v1.38; notes v1.50
  /* v1.23: holds  slot key -> { allocId, printTitle, assetType }
     A print item with no article going into a tile on Save. */
  /* v1.16: links  allocation id -> { asset:{kind,id,name,thumb} }
     A link failure is kept in fails under 'link:<allocation id>'. */
  /* v1.50: notes     slot key -> { text }        a note typed, waiting (124 fill of blockFields.note)
            noteDels  slot id  -> true            a saved note deleted on Save (124 clear)
            moves     slot id  -> { planIds:[], names:[] }  a saved note copied to those plans and taken off here */
  var SHELF = { target:'', allocId:'', q:'' };   // v1.50: the tile the next shelf pick fills; allocId when it is a Match
  var SP = { key:'', avail:false, q:'', mode:'list', allocId:'' };   // the open panel: 'list' (Events, Real Estate) or 'move' (v1.50)
  var MOVE = { sel:{}, plans:null, loading:false, error:'' };   // v1.50: the Move to… panel
  /* HC-P-IPP4-3: allocations Link is offered on (the panel lists articles). */
  var LINKABLE = { article:1, other:1 };

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function plural(n, pair){ return n + ' ' + (n === 1 ? pair[0] : pair[1]); }
  function view(){ return IPP.q('.ipp-view[data-view="picker"]'); }
  function canvasEl(){ var v = view(); return v && IPP.q('.ipp-canvas', v); }
  function byId(id){ return document.getElementById(id); }
  function hasOwn(o,k){ return Object.prototype.hasOwnProperty.call(o,k); }

  // v1.50: every message carries its own key, so messages stack on the shared rail; the same sentence twice supersedes itself.
  function msgKey(msg){ var h = 0, t = String(msg || ''); for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function say(msg, kind){
    if (window.IxToast && typeof window.IxToast.show === 'function') {
      window.IxToast.show(msg, kind === 'ok' ? 'ok' : (kind === 'err' ? 'err' : (kind === 'unverified' ? 'unverified' : 'info')),
        { key:'ipp-picker:' + (kind || 'info') + ':' + msgKey(msg) });
      return;
    }
    IPP.toast(esc(msg), kind === 'err' || kind === 'unverified');
  }

  // Redraw without moving the view (standing rule).
  function keepScroll(fn){
    var c = canvasEl(), l = byId('ipp_shelfList');   // v1.50: the shelf keeps its place too
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
  // v1.18: how a slot is named in messages, without its position.
  function slotName(key){
    var f = P.fills[key]; if (f) return '\u201c' + (f.asset.name || 'Untitled') + '\u201d';
    var h = P.holds[key]; if (h) return '\u201c' + (h.printTitle || 'Untitled') + '\u201d';
    var s = slotById(key); if (s && s.asset && s.asset.name) return 'The slot holding \u201c' + s.asset.name + '\u201d';
    if (s && (s.assetType === 'event' || s.assetType === 're')) return s.assetType === 'event' ? 'An Events slot' : 'A Real Estate slot';   // v1.26
    if (P.notes[key] || (s && s.note)) return 'The note \u201c' + noteSnip(P.notes[key] ? P.notes[key].text : s.note) + '\u201d';   // v1.50
    return addByKey(key) ? 'A new article slot' : 'An article slot';
  }
  function acceptsField(assetType){ var a = (BOARD && BOARD.accepts) || {}; return a[assetType]; }
  // Where an asset sits on the saved board: { slotId, position } or null.
  function savedSlotOf(assetId){
    var s = slots();
    for (var i=0;i<s.length;i++) if (s[i].asset && s[i].asset.id === assetId) return { slotId:s[i].id, position:s[i].position };
    return null;
  }
  /* v1.20 - the allocation to free when this article leaves the plan, or
     null. `leaving` = slot ids whose saved article is going (cleared or
     filled over) on this Save. Returns { op, name } or { error }. */
  function freeFor(assetId, leaving){
    if (!assetId || !BOARD || !BOARD.plan) return null;
    var s = slots();
    for (var i = 0; i < s.length; i++) {
      if (s[i].asset && s[i].asset.id === assetId && !leaving[s[i].id]) return null;   // still in the plan
    }
    var k2; for (k2 in P.fills) if (hasOwn(P.fills,k2) && P.fills[k2].asset.id === assetId) return null;   // being placed again
    var al = BOARD.allocations || [], a = null;
    for (var n = 0; n < al.length; n++) if (al[n].asset && al[n].asset.id === assetId) { a = al[n]; break; }
    if (!a) return null;                       // not from a print item (Library)
    if (!Array.isArray(a.plans)) return { error: 'the plan data does not list each print item\u2019s plans (Data Worker v1.0.14 needed)' };
    var planId = BOARD.plan.id, rest = a.plans.filter(function(p){ return p && p !== planId; });
    return { name: a.asset.name || a.printTitle || 'the article',
             op: { id: a.id, plansJson: JSON.stringify(rest), plansCount: rest.length,
                   disposition: rest.length ? 'intended' : 'undecided' } };
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
  /* v1.18: withFill marks a record made together with a slot fill
     (Assign). Cancelling either cancels both. */
  function setLink(allocId, asset, withFill, quiet){
    var a = allocById(allocId);
    if (!canLink(a)) { say('That print item cannot take an article here.', 'info'); return false; }
    var on = allocOfAsset(asset.id);
    if (on) { say('\u201c' + (asset.name || 'That article') + '\u201d is already the article for \u201c' + (on.printTitle || 'another print item') + '\u201d.', 'info'); return false; }
    var other = linkWaitFor(asset.id); if (other && other !== allocId) { delete P.links[other]; delete P.fails['link:' + other]; }
    P.links[allocId] = { asset:{ kind:'article', id:asset.id, name:asset.name || '', thumb:asset.thumb || '' }, withFill: !!withFill };
    delete P.fails['link:' + allocId];
    if (!quiet) changed();
    return true;
  }
  // v1.18: drop a record that was made together with this article's fill.
  function dropPairedLink(assetId){
    var lk = assetId ? linkWaitFor(assetId) : '';
    if (lk && P.links[lk].withFill) { delete P.links[lk]; delete P.fails['link:' + lk]; }
  }
  function cancelLinkOf(allocId){ delete P.links[allocId]; delete P.fails['link:' + allocId]; changed(); }

  // A saved slot whose article is moving to another slot, and nothing
  // else is waiting on it: the move will empty it.
  function movingAwayTo(slotId){
    if (P.fills[slotId] || P.removes[slotId] || P.clears[slotId]) return '';
    for (var k in P.fills) if (hasOwn(P.fills,k) && P.fills[k].srcSlot === slotId) return k;
    return '';
  }
  function isEmptySaved(s){ return !s.asset && !s.allocation && !(Number(s.listCount) > 0); }
  // v1.50 — notes. A slot is "noted" when it is empty and a note sits on it, saved or typed.
  function noteField(){ return (BOARD && BOARD.blockFields && BOARD.blockFields.note) || ''; }
  function savedNote(s){ return (s && s.note) ? String(s.note) : ''; }
  function noteNow(key){ var s = slotById(key); if (P.notes[key]) return P.notes[key].text; return P.noteDels[key] ? '' : savedNote(s); }
  function noteSnip(t){ t = String(t || '').trim(); return t.length > 40 ? t.slice(0, 38) + '\u2026' : t; }
  // HC-P-PK50-3: what 124 is sent. One line, single spaces, curly double quotes.
  function noteWire(t){ return String(t || '').replace(/\s+/g, ' ').trim().replace(/"([^"]*)"/g, '\u201c$1\u201d').replace(/"/g, '\u201d'); }
  function noteDirty(key){ var s = slotById(key); return !!P.notes[key] && noteWire(P.notes[key].text) !== noteWire(savedNote(s)); }
  function plansUrl(){   // HC-P-PK50-1
    var w = window.PP_WEBHOOKS || {};
    if (w.plans) return String(w.plans);
    var b = String(w.planBoard || '').split('?')[0];
    return b.indexOf('/plan-board') >= 0 ? b.replace('/plan-board', '/plans') : '';
  }

  // ── list slots (v1.26, slice 4) ──────────────────────────
  function designWriter(){ var w = window.PP_WEBHOOKS || {}; return String(w.designWrite || w.makeDesignWrite || ''); }
  // Why this saved list slot cannot be filled here, or ''.
  function listBlocked(s){
    if (s.assetType === 'text-ad') return 'Filling The Find comes later.';
    if (!LIST_SOURCE[s.assetType]) return 'This slot type cannot be filled here.';
    if (!s.list || !s.list.key) return 'The plan data does not say where this list is stored (Data Worker v1.0.18).';
    if (s.list.jsonOk === false) return 'This slot\u2019s design settings cannot be read, so its list cannot be written. Fix them on the Layout tab first.';
    return '';
  }
  function listSrc(assetType){ var t = LIST_SOURCE[assetType]; return t ? (LISTS[t] || (LISTS[t] = { items:null, options:{}, loading:false, error:'', truncated:false })) : null; }
  function loadList(assetType, fresh){
    var src = listSrc(assetType), t = LIST_SOURCE[assetType]; if (!src) return;
    var base = assetListBase(), ta = titleAdminId();
    if (!base) { src.error = 'The asset list address is not set on this page (PP_WEBHOOKS.assetList).'; redraw(); return; }
    if (!ta) { src.error = 'This plan has no title (TITLES-ADMIN) to list items for.'; redraw(); return; }
    src.loading = true; src.error = '';
    IPP.getJSON(base + '/list?type=' + encodeURIComponent(t) + '&title=' + encodeURIComponent(ta) + (fresh ? '&fresh=1' : ''))
      .then(function(j){
        src.loading = false; src.items = j.items || []; src.options = j.options || {}; src.truncated = !!j.truncated;
        redraw();
      }, function(e){
        src.loading = false; src.error = 'Could not read the publisher\u2019s ' + (LIST_NOUN[assetType] || ['','items'])[1] + ': ' + ((e && e.message) || e);
        redraw();
      });
  }
  function optLabel(src, field, v){ var o = (src.options || {})[field] || {}; return String(o[v] || ''); }
  // One shaped row for an event or listing.
  function listItem(assetType, it){
    var src = listSrc(assetType), f = it.fieldData || {};
    var r = { id:it.id, name:String(f.name || 'Untitled'), archived: !!it.isArchived, start:'', when:'', where:'', flag:'', past:false, stale:false,
              changed: String(it.lastUpdated || it.createdOn || '') };   // changed v1.38
    if (assetType === 'event') {
      r.start = String(f['event-start'] || '');
      var end = String(f['event-end'] || r.start);
      r.when = String(f['dt-date-short'] || '') || (r.start ? r.start.slice(0, 10) : '');
      r.where = String(f['event-location'] || '');
      if (end && new Date(end).getTime() < freshFrom().getTime()) r.past = true;   // v1.38: against the publish date
    } else if (assetType === 're') {
      // v1.38, HC-P-STC-4: a listing is fresh when created or changed within LIST_FRESH_MONTHS of the publish date
      var mo = LIST_FRESH_MONTHS[assetType], ch = r.changed ? new Date(r.changed) : null;
      if (mo && ch && !isNaN(ch)) { var lim = freshFrom(); lim.setMonth(lim.getMonth() - mo); r.stale = ch.getTime() < lim.getTime(); }
      r.thumb = String(f['property-image-link'] || '');   // v1.44: the listing photo
      if (/archiv/i.test(optLabel(src, 'status', f.status))) r.archived = true;
      var sch = optLabel(src, 'schedule-status', f['schedule-status']);
      if (sch && !/^scheduled$/i.test(sch)) r.flag = sch;
    }
    return r;
  }
  /* v1.38 — the day freshness is measured from: this plan's publish
     date, else today (the panel says which). Local midnight. */
  function planDay(){
    var d = BOARD && BOARD.plan && BOARD.plan.date ? new Date(BOARD.plan.date) : null;
    return (d && !isNaN(d)) ? d : null;
  }
  function freshFrom(){
    var d = planDay() || new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function freshNote(assetType){
    var pd = planDay(), when = pd ? 'this plan\u2019s publish date (' + pd.toLocaleDateString('en-US', { month:'short', day:'numeric' }) + ')' : 'today (this plan has no publish date yet)';
    if (assetType === 'event') return 'Showing events that end on or after ' + when + '.';
    var mo = LIST_FRESH_MONTHS[assetType];
    return mo ? 'Showing listings created or changed within ' + mo + ' months of ' + when + '.' : '';
  }
  /* v1.38 — the counts a list block takes are the counts that have a
     design (DESIGNS item-count, via board.designChoices[label]). */
  function listLabel(s){ return String((s && s.blockType) || '').toUpperCase(); }
  function countDesigns(label){
    var ch = (BOARD && BOARD.designChoices && BOARD.designChoices[label]) || [];
    return ch.filter(function(d){ return d && Number.isInteger(d.itemCount) && d.itemCount > 0; });
  }
  // Every design made for this label carries a count: the design is set from the count, never picked.
  function byCount(label){
    var ch = (BOARD && BOARD.designChoices && BOARD.designChoices[String(label || '').toUpperCase()]) || [];
    return !!ch.length && countDesigns(String(label || '').toUpperCase()).length === ch.length;
  }
  function allowedCounts(label){
    var out = [];
    countDesigns(label).forEach(function(d){ if (out.indexOf(d.itemCount) < 0) out.push(d.itemCount); });
    return out.sort(function(a, b){ return a - b; });
  }
  function countWords(list){ return list.length < 2 ? String(list[0] || '') : list.slice(0, -1).join(', ') + ' or ' + list[list.length - 1]; }
  // '' when n items is a count this block's type has a design for.
  function countWhy(s, n){
    if (!n) return '';
    var label = listLabel(s), noun = LIST_NOUN[s.assetType] || ['item','items'];
    if (!label) return 'this slot has no block type, so no design can be chosen for its count';
    var ok = allowedCounts(label);
    if (!ok.length) return 'no live DESIGNS row for ' + label + ' carries an item count, so this list cannot take a design (needs the item-count records and Data Worker v1.0.53)';
    if (ok.indexOf(n) < 0) return noun[1].charAt(0).toUpperCase() + noun[1].slice(1) + ' take ' + countWords(ok) + ' items. You have ' + n + '.';
    return '';
  }
  function maxCount(s){ var ok = allowedCounts(listLabel(s)); return ok.length ? ok[ok.length - 1] : 0; }
  // The design for n items: this title's own row first, then the platform row.
  function designForCount(s, n){
    var label = listLabel(s), rows = countDesigns(label).filter(function(d){ return d.itemCount === n; });
    var mine = rows.filter(function(d){ return d.mine; }), pool = mine.length ? mine : rows;
    if (pool.length === 1) return { id: pool[0].id, name: pool[0].name };
    if (!pool.length) return { why: 'no design is made for ' + n + ' ' + label + ' items' };
    return { why: pool.length + ' designs are made for ' + n + ' ' + label + ' items (' + pool.map(function(d){ return '\u201c' + d.name + '\u201d'; }).join(', ') + '); keep one, or give this title its own' };
  }
  /* v1.38 — Done picking, one tick per list block. */
  function doneField(){ return (BOARD && BOARD.blockFields && BOARD.blockFields.listDone) || ''; }
  function doneNow(s){ var d = P.done[s.id]; return d ? !!d.on : s.listDone === true; }
  function doneDirty(s){ return !!P.done[s.id]; }
  function toggleDone(key){
    var s = slotById(key); if (!s || LOCKED || P.saving) return;
    var want = !doneNow(s);
    if (want === (s.listDone === true)) delete P.done[key]; else P.done[key] = { on: want, auto: false };
    delete P.fails['done:' + key];
    changed();
  }
  // A list change on a block marked done unticks it; taking the change back puts it back.
  function doneFollowsList(key){
    var s = slotById(key); if (!s) return;
    var d = P.done[key];
    if (P.lists[key]) { if (s.listDone === true && !(d && !d.auto)) P.done[key] = { on: false, auto: true }; }
    else if (d && d.auto) delete P.done[key];
  }
  function listItemById(assetType, id){
    var src = listSrc(assetType); if (!src || !src.items) return null;
    for (var i = 0; i < src.items.length; i++) if (src.items[i].id === id) return listItem(assetType, src.items[i]);
    return null;
  }
  function listItemName(assetType, id){ var r = listItemById(assetType, id); return r ? r.name : (listSrc(assetType) && listSrc(assetType).items ? 'Not found' : '\u2026'); }
  function listIdsNow(s){ return P.lists[s.id] ? P.lists[s.id].ids.slice() : ((s.list && s.list.ids) || []).slice(); }
  // Events by date (HC-P-S7-9); anything without a date keeps its place at the end.
  function orderIds(assetType, ids){
    if (LIST_ORDER[assetType] !== 'date') return ids;
    var at = function(id){ var r = listItemById(assetType, id); var t = r && r.start ? new Date(r.start).getTime() : NaN; return isNaN(t) ? Infinity : t; };
    return ids.map(function(id, i){ return { id:id, i:i, t:at(id) }; })
      .sort(function(a, b){ return a.t - b.t || a.i - b.i; }).map(function(x){ return x.id; });
  }
  function sameIds(a, b){ if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
  function setListIds(key, ids){
    var s = slotById(key); if (!s) return;
    var mx = maxCount(s);
    if (mx && ids.length > mx) { say((LIST_NOUN[s.assetType] || ['','Items'])[1].replace(/^./, function(c){ return c.toUpperCase(); }) + ' take up to ' + mx + ' items.', 'info'); return; }   // v1.38
    ids = orderIds(s.assetType, ids);
    if (sameIds(ids, (s.list && s.list.ids) || []) && s.list.from !== 'reference') delete P.lists[key];
    else P.lists[key] = { ids: ids };
    delete P.fails[key];
    doneFollowsList(key);   // v1.38
    changed();
  }
  // Where else on this plan an id already sits (saved or waiting).
  function listElsewhere(key, id){
    var out = '';
    slots().forEach(function(s){
      if (out || s.id === key || !s.list) return;
      if (listIdsNow(s).indexOf(id) >= 0) out = slotName(s.id);
    });
    return out;
  }
  // The merged design-json to send: stored JSON, list key replaced.
  function listJson(s, ids){
    var raw = (s.list && s.list.designJson) || '', obj = {};
    if (raw.trim()) obj = JSON.parse(raw);
    if (ids.length) obj[s.list.key] = ids; else delete obj[s.list.key];
    return JSON.stringify(obj);
  }
  /* v1.23 — the tile field that holds a print item (Data Worker v1.0.16). */
  function allocField(){ return (BOARD && BOARD.blockFields && BOARD.blockFields.allocation) || ''; }
  // v1.34 — the design field, and whether a design is one of a type's designs
  var DESIGN_CLEARS = [];
  function designField(){ return (BOARD && BOARD.blockFields && BOARD.blockFields.design) || ''; }
  function designFits(designId, label){
    var ch = (BOARD && BOARD.designChoices && BOARD.designChoices[label]) || [];
    for (var i = 0; i < ch.length; i++) if (ch[i].id === designId) return true;
    return false;
  }
  function holdKeyFor(allocId){
    for (var k in P.holds) if (hasOwn(P.holds,k) && P.holds[k].allocId === allocId) return k;
    return '';
  }
  function sectionList(){ return (BOARD && Array.isArray(BOARD.sections)) ? BOARD.sections : null; }
  function sectionByKey(k){ var l = sectionList() || []; for (var i=0;i<l.length;i++) if (l[i].key === k) return l[i]; return null; }
  function sectionKeyOfAsset(kind){
    var l = sectionList() || [];
    for (var i=0;i<l.length;i++) if (l[i].assetType && l[i].assetType === kind) return l[i].key;
    return '';
  }
  /* v1.35 — the block catalog (IX_CONFIG.catalog via /plan-board, Data
     Worker v1.0.43). A section's entry is the one whose assetType is the
     section's key. null when the board has no catalog. */
  function catalogList(){ return (BOARD && Array.isArray(BOARD.catalog)) ? BOARD.catalog : null; }
  function catEntryFor(assetType){
    var c = catalogList(); if (!c) return null;
    for (var i=0;i<c.length;i++) if (c[i] && c[i].blocks !== false && c[i].assetType === assetType) return c[i];
    return null;
  }
  // v1.35 — a tile that holds one asset (catalog content "one"); only these take a print row.
  function holdsOne(assetType){ var e = catEntryFor(assetType); return !!(e && e.content === 'one'); }
  // v1.35 — true when this kind is perIssue "one" and the plan already has one (saved or waiting).
  function oneAlready(assetType){
    var e = catEntryFor(assetType); if (!e || e.perIssue !== 'one') return false;
    var have = slots().some(function(s){ return s.assetType === assetType && !P.removes[s.id]; });
    if (!have) have = P.adds.some(function(a){ return a.assetType === assetType; });
    return have;
  }
  /* v1.36 — a "one kind" is a catalog entry with perIssue "one", blocks,
     and an add label (Remove slot is offered on its empty tile). */
  function oneKind(assetType){ var e = catEntryFor(assetType); return (e && e.perIssue === 'one' && e.add) ? e : null; }
  function fillable(s){ return s.assetType === 'article' && acceptsField('article') && acceptsField('article') !== 'list'; }

  // ── v1.32: article type against slot type ─────────────────
  function sectionsUrl(){
    var u = String((window.PP_WEBHOOKS || {}).planBoard || '');
    return /\/plan-board(\?|$)/.test(u) ? u.replace(/\/plan-board(\?.*)?$/, '/sections') : '';
  }
  function loadSectionTypes(){
    if (TYPES.sec || TYPES.secLoading) return;
    var u = sectionsUrl(), ta = titleAdminId();
    if (!u || !ta) { TYPES.secError = 'the Sections address is not known'; return; }
    TYPES.secLoading = true;
    IPP.getJSON(u + '?taId=' + encodeURIComponent(ta)).then(function(j){
      var m = {}, list = [], nm = {}; ((j && j.items) || []).forEach(function(it){
        m[it.id] = String(it.blockType || '').toUpperCase();
        nm[it.id] = String(it.name || '');                                                    // v1.34
        if (m[it.id]) list.push({ id: it.id, name: String(it.name || ''), type: m[it.id] });   // v1.33: typed Sections only
      });
      TYPES.sec = m; TYPES.list = list; TYPES.names = nm; TYPES.secLoading = false; TYPES.secError = ''; redraw();
    }, function(e){ TYPES.secLoading = false; TYPES.secError = (e && e.message) || 'the Sections read failed'; });
  }
  function upLabel(v){ return String(v || '').trim().split(/\s+/)[0].toUpperCase(); }
  function availItem(id){ var l = AVAIL.items || []; for (var i=0;i<l.length;i++) if (l[i].id === id) return l[i]; return null; }
  // { own, sec, type }: own is the article's block-type, sec its Section's; type = own || sec
  // v1.33: the article's Section id (a waiting change first), and the type it carries
  function savedSecOf(id){
    var it = availItem(id);
    if (it) { var sid = (it.fieldData || {}).section; sid = Array.isArray(sid) ? sid[0] : sid; return sid || ''; }
    var out = ''; slots().forEach(function(s){ if (s.asset && s.asset.id === id && s.section && s.section.from === 'article') out = s.section.id; });
    return out;
  }
  function secOf(id){ return savedSecOf(id); }   // v1.34: the article's saved Section only
  function artTypeOf(id){
    var sid = secOf(id), sec = '';
    if (sid && TYPES.sec) sec = TYPES.sec[sid] || '';
    else slots().forEach(function(s){ if (s.asset && s.asset.id === id) sec = upLabel(s.asset.sectionType); });
    return { sec: sec, type: sec, sectionId: sid };
  }
  function slotTypeOf(key){
    var a = addByKey(key); if (a) return upLabel(a.blockType);
    var s = slotById(key); return s ? upLabel(s.blockType) : '';
  }
  function aOrAn(l){ return (/^[AEFHILMNORSX]/.test(l) ? 'an ' : 'a ') + l; }
  // '' when it fits, else the reason
  function misfit(assetId, key){
    return '';   // v1.34: a slot takes the type of the article in it, so no article misfits
    var at = artTypeOf(assetId).type, st = slotTypeOf(key);
    if (!at && st) return 'no Section yet \u00b7 this is ' + aOrAn(st) + ' slot';   // v1.33
    return (at && st && at !== st) ? aOrAn(at) + ' article \u00b7 this is ' + aOrAn(st) + ' slot' : '';
  }

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
      say('\u201c' + (asset.name || 'That article') + '\u201d is already in this issue. ' +
          'Moving it between slots is done on the Layout tab.', 'info');
      return;
    }
    var why = misfit(asset.id, key);                                       // v1.32
    if (why) { say('\u201c' + (asset.name || 'That article') + '\u201d has ' + why.replace(' \u00b7 this is ', ', and this is ').replace(/^an? (\w+) article/, 'type $1') + '. ' +
      (artTypeOf(asset.id).type ? 'Put it in a slot of its own type.' : 'Give it a Section first.'), 'info'); return; }
    var addRow = addByKey(key), at0 = artTypeOf(asset.id).type;
    if (addRow && !addRow.blockType && at0) addRow.blockType = at0;           // v1.32: a new slot is born with the article's type
    delete P.holds[key];   // v1.23: an article picked for a tile replaces a print item waiting there
    delete P.notes[key]; delete P.noteDels[key]; delete P.moves[key];   // v1.50: an article in the slot ends its note (RT-7a, cleared on Save)
    P.fills[key] = {
      asset: { kind:asset.kind || 'article', id:asset.id, name:asset.name || '', thumb:asset.thumb || '', customer:asset.customer || '' },
      srcLoose: src.srcLoose || '',
      srcSlot: (saved && saved.slotId !== key) ? saved.slotId : ''
    };
    delete P.clears[key]; delete P.removes[key]; delete P.fails[key];
    changed();
  }
  function setClear(key){
    if (P.fills[key]) dropPairedLink(P.fills[key].asset.id);   // v1.18
    if (addByKey(key)) { delete P.fills[key]; delete P.holds[key]; changed(); return; }
    var s = slotById(key);
    delete P.fills[key]; delete P.holds[key]; delete P.fails[key];
    if (s && (s.asset || s.allocation)) P.clears[key] = true;   // v1.23: a held print item empties too
    changed();
  }
  function toggleRemove(id){
    if (P.removes[id]) delete P.removes[id]; else { P.removes[id] = true; delete P.lists[id]; delete P.done[id]; delete P.notes[id]; delete P.noteDels[id]; delete P.moves[id]; }   // done v1.38; notes v1.50
    delete P.fails[id];
    if (SHELF.target === id) clearTarget(false);
    changed();
  }
  // ── v1.50 · notes ─────────────────────────────────────────
  function setNote(key, text){
    if (LOCKED) return;
    if (!noteField()) { say('This plan cannot hold a note: the plan data does not name the note field (blockFields.note, Data Worker v1.0.75). Nothing was changed.', 'err'); return; }
    var s = slotById(key);
    delete P.noteDels[key]; delete P.moves[key]; delete P.fails[key];
    if (noteWire(text) === noteWire(savedNote(s))) delete P.notes[key];   // back to what is saved: nothing to write
    else P.notes[key] = { text: String(text || '') };
  }
  function delNote(key){
    var s = slotById(key);
    delete P.notes[key]; delete P.moves[key]; delete P.fails[key];
    if (s && savedNote(s)) P.noteDels[key] = true;
    if (SHELF.target === key) clearTarget(false);
    changed();
  }
  function setMove(key, planIds, names){
    var s = slotById(key);
    if (!s || !savedNote(s)) { say('Save the note first; Move to\u2026 works on a saved note.', 'info'); return; }
    delete P.notes[key]; delete P.noteDels[key]; delete P.fails[key];
    P.moves[key] = { planIds: planIds.slice(), names: names.slice() };
    changed();
  }
  function addSlot(section){
    var at = BOARD && BOARD.addTypes && BOARD.addTypes[section];
    if (!at) { say('This plan cannot add a slot here: the plan data names no Add type for it (IX_CONFIG.addTypes).', 'err'); return; }
    if (oneAlready(section)) { say('A plan has one ' + ((catEntryFor(section) || {}).name || section) + ' block. This plan already has it (IX_CONFIG.catalog, perIssue one).', 'info'); return; }   // v1.35
    P.seq++;
    var nk = 'new-' + P.seq;
    P.adds.push({ key:nk, assetType:at.assetType, blockType:at.blockType, designId:at.designId || '', position:newPosition(section) });   // v1.31
    if (at.blockType && !at.designId) say('This slot will have no design: the plan data names none for ' + at.blockType + '. The newsletter will leave it out until one is set.', 'info');   // v1.31
    changed();
    return nk;
  }

  /* Assign, hold and nextOpenSlot (v1.18, v1.23) left with the rail in
     v1.50: the Allocator places print items into tiles; the Picker fills
     a slot the operator clicked. */
  // Cancel one thing. A key is a slot id or an add's key.
  function cancelKey(key){
    var i;
    if (P.fills[key]) dropPairedLink(P.fills[key].asset.id);   // v1.18: one Cancel, both writes
    for (i = 0; i < P.adds.length; i++) if (P.adds[i].key === key) { P.adds.splice(i,1); delete P.fills[key]; delete P.holds[key]; delete P.fails[key]; changed(); return; }
    var away = movingAwayTo(key);
    if (away) { delete P.fills[away]; delete P.fails[away]; changed(); return; }
    delete P.fills[key]; delete P.holds[key]; delete P.clears[key]; delete P.removes[key]; delete P.lists[key]; delete P.done[key]; delete P.notes[key]; delete P.noteDels[key]; delete P.moves[key]; delete P.fails[key]; delete P.fails['done:' + key];   // done v1.38; notes v1.50
    if (SHELF.target === key) clearTarget(false);
    changed();
  }
  function cancelAll(){
    P.adds = []; P.fills = {}; P.clears = {}; P.removes = {}; P.links = {}; P.holds = {}; P.lists = {}; P.done = {}; P.notes = {}; P.noteDels = {}; P.moves = {}; P.fails = {};   // done v1.38; notes v1.50
    clearTarget(false); closeSlotPicker();
    redraw();
  }
  function pendingCounts(){
    var c = { added:P.adds.length, removed:0, filled:0, emptied:0, loose:0, linked:0, held:0, listed:Object.keys(P.lists).length, records:Object.keys(P.links).length };
    for (var hk in P.holds) if (hasOwn(P.holds,hk) && !addByKey(hk)) c.held++;   // v1.23
    // v1.18: a record waiting with its fill is part of that fill, not a change of its own
    for (var lk in P.links) if (hasOwn(P.links,lk) && !(P.links[lk].withFill && pendingKeyFor(P.links[lk].asset.id))) c.linked++;
    for (var k in P.fills) if (hasOwn(P.fills,k)) {
      if (!addByKey(k)) c.filled++;
      if (P.fills[k].srcLoose) c.loose++;
      if (P.fills[k].srcSlot && !P.fills[P.fills[k].srcSlot] && !P.removes[P.fills[k].srcSlot] && !P.clears[P.fills[k].srcSlot]) c.emptied++;
    }
    for (k in P.clears) if (hasOwn(P.clears,k)) c.emptied++;
    for (k in P.removes) if (hasOwn(P.removes,k)) { if (looseById(k)) c.loose++; else c.removed++; }
    c.done = Object.keys(P.done).length;   // v1.38
    c.noted = 0; for (k in P.notes) if (hasOwn(P.notes,k) && noteDirty(k)) c.noted++;   // v1.50
    c.noteDel = Object.keys(P.noteDels).length;
    c.moved = Object.keys(P.moves).length;
    c.total = c.added + c.removed + c.filled + c.emptied + c.loose + c.linked + c.held + c.listed + c.done + c.noted + c.noteDel + c.moved;
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
  // v1.43 — the add link inside an open list tile; the tile click does the same
  function listAddLink(s, count){
    if (LOCKED || listBlocked(s)) return '';
    var noun = LIST_NOUN[s.assetType] || ['item','items'], mx = maxCount(s);
    var word = count > 0 ? (mx && count >= mx ? 'Change ' : '+ Add ') : 'Pick ';
    return '<button type="button" class="ix-revert ipp-tile-add" data-ipp-list-add="' + esc(s.id) + '">' + word + esc(noun[1]) + '</button>';
  }
  function cancelLink(key, label){
    if (LOCKED) return '';
    return '<button type="button" class="ix-revert ipp-tile-cancel" data-ipp-cancel="' + esc(key) + '"' +
      ' aria-label="' + esc(label || 'Cancel this change') + '">Cancel</button>';
  }
  function failLine(key){
    return P.fails[key] ? '<div class="ipp-tile-fail">Did not save: ' + esc(P.fails[key]) + '</div>' : '';
  }
  var NEXT = { pick: 'Next: pick an article from the shelf' };   // v1.48, HC-P-PK48-1; v1.50 (HC-P-PK50-2): one state, the shelf
  // v1.50 — the meta line of an empty slot: the next act while it is the shelf's target, else the resting words
  function slotNext(key, target, rest){ return target ? NEXT.pick : rest; }
  function targetCls(s, key){ return SHELF.target === key ? ' ipp-slot--target' : ''; }
  // v1.50 — arm a tile as the shelf's target. allocId when the pick also records the article on that print item (Match).
  function setTarget(key, allocId){
    if (LOCKED || P.saving) return;
    closeSlotPicker();
    SHELF.target = key; SHELF.allocId = allocId || '';
    if (!AVAIL.items && !AVAIL.loading) loadAvail(false);
    redraw();
    var q = byId('ipp_shelfQ'); if (q) q.focus();
  }
  function clearTarget(draw){ SHELF.target = ''; SHELF.allocId = ''; if (draw !== false) redraw(); }
  // v1.50 — a shelf row was clicked: it lands on the target, pending.
  function pickForTarget(r){
    var key = SHELF.target, allocId = SHELF.allocId; if (!key || !r) return;
    var asset = { kind:'article', id:r.id, name:r.name, thumb:r.thumb };
    if (P.fills[key]) dropPairedLink(P.fills[key].asset.id);   // replacing a waiting pick
    var hs = slotById(key), heldId = allocId || ((hs && !hs.asset && hs.allocation && !hs.allocation.missing) ? hs.allocation.id : '');
    if (heldId) { if (!setLink(heldId, asset, true, true)) { redraw(); return; } }
    else if (r.match && !r.alloc) setLink(r.match.id, asset, true, true);   // same title as a print item: recorded quietly (R9)
    SHELF.target = ''; SHELF.allocId = ''; SHELF.q = '';
    setFill(key, asset, {});
    var l = byId('ipp_shelfList'); if (l) l.scrollTop = 0;
  }

  /* v1.23 — a tile holding a print item with no article (hollow green). */
  function heldTitle(s){ return (s.allocation && s.allocation.printTitle) || 'Untitled'; }
  function createBtn(allocId, key){
    if (LOCKED) return '';
    // v1.50: Match article (the shelf) beside Create article
    return '<div class="ipp-tile-create">' +
      (key ? '<button type="button" class="ipp-match-btn" data-ipp-match="' + esc(key) + '" data-ipp-match-alloc="' + esc(allocId) + '">Match article</button>' : '') +
      '<button type="button" class="ipp-create-btn" data-ipp-create="' + esc(allocId) + '">Create article</button></div>';
  }
  function heldArticleTile(s, head){
    var key = s.id, al = s.allocation;
    if (al.missing) {
      return '<div class="ipp-ctile ipp-slot ipp-slot--bad" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head +
        '<div class="ipp-ghost-img"></div><div class="ipp-ttitle">Print item not found</div><div class="ipp-tmeta">' + esc(al.id) + '</div></div>';
    }
    var tc = targetCls(s, key);   // v1.50: a reserved tile is the target while Match article waits on the shelf
    return '<div class="ipp-ctile filled ipp-slot ipp-slot--held' + tc + '" data-slot-key="' + esc(key) + '">' + head +
      '<div class="ipp-ghost-img ipp-held-img"></div>' +
      '<div class="ipp-ttitle">' + esc(heldTitle(s)) + '</div>' +
      '<div class="ipp-tile-noart">' + (tc ? NEXT.pick : 'No article yet') + '</div>' + failLine(key) +
      (tc ? '<div class="ipp-tile-actions">' + '<button type="button" class="ix-revert ipp-tile-cancel" data-ipp-untarget="' + esc(key) + '">Cancel</button></div>' : createBtn(al.id, key)) + '</div>';
  }
  // v1.34 — the Section as text and its type; no Section links to the form
  function secNameOf(assetId){
    var sid = secOf(assetId);
    if (sid && TYPES.names && TYPES.names[sid]) return TYPES.names[sid];
    var out = ''; slots().forEach(function(s){ if (s.asset && s.asset.id === assetId && s.asset.sectionName) out = s.asset.sectionName; });
    return out || (sid ? 'Section' : '');
  }
  function factsHtml(assetId){
    if (!assetId) return '';
    var t = artTypeOf(assetId), nm = secNameOf(assetId);
    var line = nm
      ? '<div class="ipp-tsec-name"><span class="ipp-tsec-dot"></span>' + esc(nm) + '</div>'
      : '<div class="ipp-tsec-none">No Section</div>';
    var type = t.type
      ? '<span class="ipp-ttag">' + esc(t.type) + '</span>'
      : '<span class="ipp-ttag is-none">No type</span>' +
        (LOCKED ? '' : '<button type="button" class="ipp-tsec-go" data-ipp-edit-art="' + esc(assetId) + '">Set it on the article</button>');
    return '<div class="ipp-tfacts" data-ipp-facts>' + line + '<div class="ipp-ttype">' + type + '</div></div>';
  }
  // v1.34 — open the article's form: here if the ASF is on this page, else on the T-A page.
  function editArticle(id){
    if (!id) return;
    var asf = window.InbxASF;
    if (asf && typeof asf.open === 'function') {
      asf.open({ mode:'edit', assetType:'article', assetId:id, articleId:id,
        onClosed: function(){ loadAvail(true); if (IPP.board && typeof IPP.board.load === 'function') IPP.board.load({ fresh:true }).catch(function(){}); } });
      return;
    }
    if (anyPending()) { say('Save or cancel your changes first; opening the article leaves this page.', 'info'); return; }
    var plan = BOARD && BOARD.plan;
    var page = (window.IPP_RETURN && window.IPP_RETURN.url) ? String(window.IPP_RETURN.url).split('#')[0].split('?')[0]
             : (plan && plan.titleSlug ? '/title-admin/' + plan.titleSlug : '');   // HC-P-IPP2-7
    if (!page) { say('Can\u2019t open the article: the plan data has no title slug, so the T-A page is unknown.', 'err'); return; }
    var ret = window.location.pathname + window.location.search + '#ipp-view=picker';   // HC-P-CFP-10
    window.location.href = page + '?ipp_edit=' + encodeURIComponent(id) + '&ipp_ret=' + encodeURIComponent(ret);
  }
  function articleTile(s){
    var key = s.id, a = s.asset, f = P.fills[key];
    var head = '';   // v1.18: no positions on the Picker
    if (P.removes[key]) {
      return '<div class="ipp-ctile ghost ipp-slot ipp-dirty ipp-slot--removing" data-slot-key="' + esc(key) + '">' + head +
        '<div class="ipp-ghost-img"></div><div class="ipp-tmeta ipp-tile-word">Slot will be removed</div>' +
        failLine(key) + '<div class="ipp-tile-actions">' + cancelLink(key, 'Keep this slot') + '</div></div>';
    }
    if (f) {
      return '<div class="ipp-ctile filled ipp-slot ipp-dirty" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head +
        thumbHtml(f.asset.thumb, 'ipp-art-thumb') +
        '<div class="ipp-ttitle">' + esc(f.asset.name || 'Untitled article') + '</div>' + factsHtml(f.asset.id) +
        '<div class="ipp-tmeta ipp-tile-word">' + (a ? 'Replaces \u201c' + esc(a.name || 'article') + '\u201d' : 'Fills on Save') + '</div>' +
        failLine(key) + '<div class="ipp-tile-actions">' + cancelLink(key, 'Cancel this fill') + '</div></div>';
    }
    var h = P.holds[key];
    if (h) {
      return '<div class="ipp-ctile filled ipp-slot ipp-dirty ipp-slot--held" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head +
        '<div class="ipp-ghost-img ipp-held-img"></div><div class="ipp-ttitle">' + esc(h.printTitle) + '</div>' +
        '<div class="ipp-tmeta ipp-tile-word">Print item goes in on Save</div>' +
        failLine(key) + '<div class="ipp-tile-actions">' + cancelLink(key, 'Cancel this') + '</div></div>';
    }
    if (P.clears[key]) {
      return '<div class="ipp-ctile ghost ipp-slot ipp-dirty" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head +
        '<div class="ipp-ghost-img"></div><div class="ipp-ttitle">' + esc(a ? a.name : (s.allocation ? heldTitle(s) : '')) + '</div>' +
        '<div class="ipp-tmeta ipp-tile-word">Empties on Save</div>' +
        failLine(key) + '<div class="ipp-tile-actions">' + cancelLink(key, 'Keep this article') + '</div></div>';
    }
    var away = movingAwayTo(key);
    if (away) {
      return '<div class="ipp-ctile ghost ipp-slot ipp-dirty" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head +
        '<div class="ipp-ghost-img"></div><div class="ipp-ttitle">' + esc(a ? a.name : '') + '</div>' +
        '<div class="ipp-tmeta ipp-tile-word">Moving to another slot</div>' +
        '<div class="ipp-tile-actions">' + cancelLink(key, 'Cancel the move') + '</div></div>';
    }
    if (a && a.missing) {
      return '<div class="ipp-ctile ipp-slot ipp-slot--bad" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head +
        '<div class="ipp-ghost-img"></div><div class="ipp-ttitle">Article not found</div><div class="ipp-tmeta">' + esc(a.id) + '</div></div>';
    }
    if (!a && s.allocation) return heldArticleTile(s, head);   // v1.23
    if (a) {
      return '<div class="ipp-ctile filled ipp-slot ipp-slot--ok" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head + check() +
        thumbHtml(a.thumb, 'ipp-art-thumb') +
        '<div class="ipp-ttitle">' + esc(a.name || 'Untitled article') + '</div>' + factsHtml(a.id, key) + '</div>';   // v1.33
    }
    if (P.noteDels[key]) {   // v1.50: a saved note deleted on Save
      return '<div class="ipp-ctile ghost ipp-slot ipp-dirty ipp-slot--note" data-slot-key="' + esc(key) + '">' + head +
        '<div class="ipp-note-text ipp-note-text--gone">' + esc(savedNote(s)) + '</div>' +
        '<div class="ipp-tmeta ipp-tile-word">Note deletes on Save</div>' + failLine(key) +
        '<div class="ipp-tile-actions">' + cancelLink(key, 'Keep this note') + '</div></div>';
    }
    if (P.moves[key]) {   // v1.50: a saved note going to other plans
      var mv = P.moves[key];
      return '<div class="ipp-ctile ghost ipp-slot ipp-dirty ipp-slot--note" data-slot-key="' + esc(key) + '">' + head +
        '<div class="ipp-note-text ipp-note-text--gone">' + esc(savedNote(s)) + '</div>' +
        '<div class="ipp-tmeta ipp-tile-word">Moves on Save to ' + esc(mv.names.join(', ')) + '</div>' + failLine(key) +
        '<div class="ipp-tile-actions">' + cancelLink(key, 'Cancel the move') + '</div></div>';
    }
    var tc = targetCls(s, key);   // v1.48; v1.50: the shelf's target
    var note = noteNow(key), noteOpen = !!P.notes[key] || !!note;
    if (noteOpen && !tc) return noteTile(s, key, note, P.notes[key] ? noteDirty(key) : false);   // v1.50: the note card is the tile
    return '<div class="ipp-ctile ghost ipp-slot' + tc + '" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head +
      '<div class="ipp-ghost-img"></div><div class="ipp-ghost-line long"></div><div class="ipp-ghost-line short"></div>' +
      '<div class="ipp-tmeta">' + slotNext(key, !!tc, 'Open slot. Takes any article.') + '</div>' + failLine(key) +
      (LOCKED ? '' : '<div class="ipp-tile-actions">' +
        (tc ? '<button type="button" class="ix-revert ipp-tile-cancel" data-ipp-untarget="' + esc(key) + '">Cancel</button>'
            : (note ? '' : '<button type="button" class="ix-revert ipp-tile-note" data-ipp-note-add="' + esc(key) + '">Add note</button>') +
              '<button type="button" class="ix-revert ipp-tile-remove" data-ipp-remove="' + esc(key) + '">Remove slot</button>') + '</div>') + '</div>';
  }
  /* v1.50 — the note card (C6). The slot is held by its note until it is
     filled, moved or deleted. Typing is pending at once; the text box keeps
     focus because the input handler paints in place and does not redraw. */
  function noteTile(s, key, text, dirty){
    var saved = savedNote(s);
    var word = dirty ? (saved ? 'Note changes on Save' : 'Note holds this slot on Save') : 'Note holds this slot';
    return '<div class="ipp-ctile ghost ipp-slot ipp-slot--note' + (dirty ? ' ipp-dirty' : '') + '" data-slot-key="' + esc(key) + '">' +
      '<div class="ipp-note-head">Note</div>' +
      '<textarea class="ipp-note-box" data-ipp-note="' + esc(key) + '" rows="3" maxlength="500" placeholder="What this slot is for"' + (LOCKED ? ' readonly' : '') + '>' + esc(text) + '</textarea>' +
      '<div class="ipp-tmeta' + (dirty ? ' ipp-tile-word' : '') + '" data-ipp-note-word>' + word + '</div>' + failLine(key) +
      (LOCKED ? '' : '<div class="ipp-tile-actions ipp-note-actions">' +
        '<button type="button" class="ix-revert ipp-tile-note" data-ipp-note-fill="' + esc(key) + '">Fill this slot</button>' +
        (saved && !dirty ? '<button type="button" class="ix-revert ipp-tile-note" data-ipp-note-move="' + esc(key) + '">Move to\u2026</button>' : '') +
        '<button type="button" class="ix-revert ipp-tile-remove" data-ipp-note-del="' + esc(key) + '">Delete</button>' +
        (dirty ? cancelLink(key, saved ? 'Back to the saved note' : 'Drop this note') : '') + '</div>') + '</div>';
  }
  function newArticleTile(n){
    var key = n.key, f = P.fills[key], h = P.holds[key];
    var head = '<span class="pos-tag">New</span>';
    var body = f
      ? thumbHtml(f.asset.thumb, 'ipp-art-thumb') + '<div class="ipp-ttitle">' + esc(f.asset.name || 'Untitled article') + '</div>' + factsHtml(f.asset.id) +
        '<div class="ipp-tmeta ipp-tile-word">New slot, filled on Save</div>'
      : h ? '<div class="ipp-ghost-img ipp-held-img"></div><div class="ipp-ttitle">' + esc(h.printTitle) + '</div>' +
        '<div class="ipp-tmeta ipp-tile-word">New slot, print item goes in on Save</div>'
      : '<div class="ipp-ghost-img"></div><div class="ipp-ghost-line long"></div>' +
        '<div class="ipp-tmeta ipp-tile-word">' + slotNext(key, !!targetCls(null, key), 'New article slot') + '</div>';   // v1.48
    return '<div class="ipp-ctile ' + (f || h ? 'filled' : 'ghost') + ' ipp-slot ipp-dirty ipp-slot--new' + (f || h ? '' : targetCls(null, key)) +
      '" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head + body + failLine(key) +
      '<div class="ipp-tile-actions">' + (targetCls(null, key) ? '<button type="button" class="ix-revert ipp-tile-cancel" data-ipp-untarget="' + esc(key) + '">Cancel</button>' : '') + cancelLink(key, 'Cancel this new slot') + '</div></div>';
  }
  function addTile(section){
    if (LOCKED) return '';   // v1.23
    if (!(BOARD && BOARD.addTypes && BOARD.addTypes[section])) return '';
    if (oneAlready(section)) return '';   // v1.35: one block of this kind per plan, and it is here
    var cls = section === 'article' ? 'ipp-ctile add ipp-add-tile' : 'ipp-list-tile ipp-add-tile';
    return '<button type="button" class="' + cls + '" data-ipp-add="' + esc(section) + '">' +
      '<span class="ipp-add-circle">+</span><span class="ipp-add-lbl">' + esc(ADD_LABEL[section] || 'Add') + '</span></button>';
  }
  function atLine(s){
    return '<div class="ipp-at-line" data-slot-id="' + esc(s.id) + '" data-ipp-focus="">' +
      '<span class="ipp-at-tag">Around Town</span>' +
      '<span class="ipp-at-teaser">' + (s.blockText ? esc(s.blockText) : '<i>No teaser yet</i>') + '</span></div>';
  }
  function listTile(s){
    var key = s.id, n = Number(s.listCount) || 0;
    var noun = LIST_NOUN[s.assetType] || ['item','items'];
    var head = '', h = P.holds[key], al = s.allocation;
    if (P.removes[key]) {
      return '<div class="ipp-list-tile ghost ipp-slot ipp-dirty ipp-slot--removing" data-slot-key="' + esc(key) + '">' + head +
        '<div class="ipp-list-count">Slot will be removed</div>' + failLine(key) +
        '<div class="ipp-tile-actions">' + cancelLink(key, 'Keep this slot') + '</div></div>';
    }
    // v1.23 — a print item waiting to go in, being taken out, or held
    if (h) {
      return '<div class="ipp-list-tile ipp-slot ipp-dirty ipp-slot--held" data-slot-key="' + esc(key) + '">' + head +
        '<div class="ipp-list-title">' + esc(h.printTitle) + '</div>' +
        '<div class="ipp-list-count">Print item goes in on Save</div>' + failLine(key) +
        '<div class="ipp-tile-actions">' + cancelLink(key, 'Cancel this') + '</div></div>';
    }
    if (al && P.clears[key]) {
      return '<div class="ipp-list-tile ghost ipp-slot ipp-dirty" data-slot-key="' + esc(key) + '">' + head +
        '<div class="ipp-list-title">' + esc(heldTitle(s)) + '</div>' +
        '<div class="ipp-list-count">Print item comes out on Save</div>' + failLine(key) +
        '<div class="ipp-tile-actions">' + cancelLink(key, 'Keep the print item') + '</div></div>';
    }
    // v1.26 — a list waiting for Save
    var pl = P.lists[key];
    if (pl) {
      var names = pl.ids.slice(0, 3).map(function(id){ return esc(listItemName(s.assetType, id)); }).join(', ') + (pl.ids.length > 3 ? ', \u2026' : '');
      var cw = countWhy(s, pl.ids.length);   // v1.38
      return '<div class="ipp-list-tile ipp-slot ipp-dirty" data-slot-key="' + esc(key) + '" data-ipp-open="1">' + head +
        '<div class="ipp-list-count">' + (pl.ids.length ? plural(pl.ids.length, noun) + ' \u00b7 goes in on Save' : 'List empties on Save') + '</div>' +
        (pl.ids.length ? '<div class="ipp-list-names">' + names + '</div>' : '') +
        (cw ? '<div class="ipp-list-why ipp-list-why--bad">' + esc(cw) + '</div>' : '') + failLine(key) +
        '<div class="ipp-tile-actions">' + listAddLink(s, pl.ids.length) + cancelLink(key, 'Cancel this') + '</div></div>';   // v1.43: add link
    }
    var why = listBlocked(s), open = !LOCKED && !why;
    var canRemove = !LOCKED && n === 0 && !al && !!oneKind(s.assetType);   // v1.36: one-block kinds, from the catalog
    var titleLine = al ? '<div class="ipp-list-title">' + esc(al.missing ? 'Print item not found' : heldTitle(s)) + '</div>' : '';
    var takeOut = (al && !LOCKED) ? '<div class="ipp-tile-actions"><button type="button" class="ix-revert ipp-tile-remove" data-ipp-empty="' + esc(key) + '">Take the print item out</button></div>' : '';
    var look = n > 0 ? 'ipp-slot--ok' : (al ? 'ipp-slot--held' : 'ghost');
    var savedNames = (n > 0 && s.list && LISTS[LIST_SOURCE[s.assetType]] && LISTS[LIST_SOURCE[s.assetType]].items)
      ? '<div class="ipp-list-names">' + s.list.ids.slice(0, 3).map(function(id){ return esc(listItemName(s.assetType, id)); }).join(', ') + (s.list.ids.length > 3 ? ', \u2026' : '') + '</div>' : '';
    return '<div class="ipp-list-tile ipp-slot ' + look + '" data-slot-key="' + esc(key) + '"' + (open ? ' data-ipp-open="1"' : '') + '>' + head +
      (n > 0 ? check() : '') + titleLine + '<div class="ipp-list-count">' + (n > 0 ? plural(n, noun) : 'No ' + noun[1] + ' yet') + '</div>' + savedNames +
      (!LOCKED && why ? '<div class="ipp-list-why">' + esc(why) + '</div>' : '') +
      failLine(key) + takeOut +
      ((open && !al) || canRemove ? '<div class="ipp-tile-actions">' + (open && !al ? listAddLink(s, n) : '') +   // v1.43: add link
        (canRemove ? '<button type="button" class="ix-revert ipp-tile-remove" data-ipp-remove="' + esc(key) + '">Remove slot</button>' : '') + '</div>' : '') +
      '</div>';
  }
  // v1.44 — one tile per item in a list block, the add tile at the end, a note line under the row
  function itemTiles(s){
    var key = s.id, t = s.assetType, noun = LIST_NOUN[t] || ['item','items'], Noun = noun[0].replace(/^./, function(c){ return c.toUpperCase(); });
    var savedIds = ((s.list && s.list.ids) || []).slice(), now = listIdsNow(s), pending = !!P.lists[key];
    var inNow = {}; now.forEach(function(id, i){ inNow[id] = i + 1; });
    var merged = now.slice();
    savedIds.forEach(function(id, i){ if (!(id in inNow)) merged.splice(Math.min(i, merged.length), 0, id); });
    var why = listBlocked(s), open = !LOCKED && !why, canDrag = open && LIST_ORDER[t] !== 'date' && now.length > 1;
    var ready = !!(listSrc(t) && listSrc(t).items);
    var html = merged.map(function(id){
      var r = listItemById(t, id);
      var name = r ? r.name : (ready ? 'Not in the publisher\u2019s list' : '\u2026');
      var meta = r ? [r.when, r.where].filter(Boolean).map(esc).join(' \u00b7 ') : '';
      var isNew = (id in inNow) && savedIds.indexOf(id) < 0, isRm = !(id in inNow);
      var isMoved = !isNew && !isRm && pending && savedIds.indexOf(id) !== inNow[id] - 1;   // reordered, waits for Save
      var pos = isRm ? Noun + ' \u00b7 comes out on Save' : Noun + ' ' + inNow[id] + (isNew ? ' \u00b7 goes in on Save' : isMoved ? ' \u00b7 moves on Save' : '');
      var cls = 'ipp-list-tile ipp-item-tile' + (isRm ? ' ipp-dirty ipp-item--rm' : isNew ? ' ipp-dirty ipp-item--new' : isMoved ? ' ipp-dirty ipp-item--moved' : ' ipp-slot--ok');
      var thumb = r && r.thumb ? '<span class="ipp-item-thumb" style="background-image:url(&quot;' + esc(r.thumb) + '&quot;)"></span>' : '';
      var acts = !open ? ''
        : isRm ? '<button type="button" class="ix-revert ipp-tile-cancel" data-ipp-lkeep="' + esc(id) + '" data-ipp-item-slot="' + esc(key) + '">Keep it</button>'
        : isNew ? '<button type="button" class="ix-revert ipp-tile-cancel" data-ipp-lrm="' + esc(id) + '" data-ipp-item-slot="' + esc(key) + '">Cancel this</button>'
        : '<button type="button" class="ix-revert ipp-tile-remove" data-ipp-lrm="' + esc(id) + '" data-ipp-item-slot="' + esc(key) + '">Remove</button>';
      return '<div class="' + cls + '" data-ipp-item="' + esc(id) + '" data-ipp-item-slot="' + esc(key) + '"' + (canDrag && !isRm ? ' draggable="true" title="Drag to reorder"' : '') + '>' +
        '<span class="pos-tag">' + esc(pos) + '</span>' + (!isNew && !isRm && !isMoved ? check() : '') +
        '<div class="ipp-item-body">' + thumb + '<div class="ipp-item-text"><div class="ipp-list-title">' + esc(name) + '</div>' +
          (meta ? '<div class="ipp-item-meta">' + meta + '</div>' : isRm ? '<div class="ipp-item-meta ipp-item-meta--gold">Removed on Save</div>' : isNew ? '<div class="ipp-item-meta ipp-item-meta--gold">Added on Save</div>' : '') + '</div></div>' +
        '<div class="ipp-tile-actions">' + acts + '</div></div>';
    }).join('');
    var mx = maxCount(s), full = !!(mx && now.length >= mx);
    if (open && !full) html += '<button type="button" class="ipp-list-tile ipp-add-tile ipp-slot" data-slot-key="' + esc(key) + '" data-ipp-open="1" data-ipp-list-add="' + esc(key) + '">' +   // v1.46: no add tile when full
      '<span class="ipp-add-circle">+</span><span class="ipp-add-lbl">Add ' + esc(noun[0]) + '</span></button>';
    var note = [];
    if (open && full) note.push('<span>Full at ' + mx + '. Remove one to add another.</span>');
    if (!LOCKED && why) note.push('<span>' + esc(why) + '</span>');
    if (pending && open) note.push('<span class="ipp-al-word--gold">Changes wait for Save</span><button type="button" class="ix-revert" data-ipp-lcancel="' + esc(key) + '">Cancel changes</button>');
    if (P.fails[key]) note.push('<span class="is-bad">Did not save: ' + esc(P.fails[key]) + '</span>');
    if (open && now.length) note.push('<span>' + (LIST_ORDER[t] === 'date' ? 'Events run in date order.' : 'Listings run in this order. Drag a tile to reorder.') + '</span>');
    var canRemove = !LOCKED && now.length === 0 && !savedIds.length && !pending && !!oneKind(t);
    if (canRemove) note.push('<button type="button" class="ix-revert ipp-tile-remove" data-ipp-remove="' + esc(key) + '">Remove slot</button>');
    return html + (note.length ? '<div class="ipp-list-note">' + note.join('') + '</div>' : '');
  }
  // v1.44 — the section head reads the count rule for the block (one block per kind)
  function secListCount(key, list){
    var el = IPP.q('[data-ipp-sec-count="' + key + '"]'); if (!el) return;
    el.classList.remove('is-bad');
    if (!list.length) { el.innerHTML = '<span class="ipp-muted">No slots in this plan</span>'; return; }
    var s = list[0], noun = LIST_NOUN[s.assetType] || ['item','items'], n = listIdsNow(s).length, ok = allowedCounts(listLabel(s)), cw = n ? countWhy(s, n) : '';
    if (list.length > 1 || !s.list) { secCount(key, list, function(x){ return Number(x.listCount) > 0 || !!x.allocation; }); return; }
    el.innerHTML = '<b>' + n + '</b> ' + (n === 1 ? noun[0] : noun[1]) + (ok.length ? ' \u00b7 takes ' + countWords(ok) : ' \u00b7 <b>no designs made for ' + esc(listLabel(s)) + '</b>') + (cw ? ' \u00b7 <b>no design for ' + n + '</b>' : '');
    if (cw || !ok.length) el.classList.add('is-bad');
  }
  function newListTile(n){
    var noun = LIST_NOUN[n.assetType] || ['item','items'], h = P.holds[n.key];
    return '<div class="ipp-list-tile ghost ipp-slot ipp-dirty ipp-slot--new' + (h ? ' ipp-slot--held' : '') + '" data-slot-key="' + esc(n.key) + '">' +
      '<span class="pos-tag">New</span>' +
      (h ? '<div class="ipp-list-title">' + esc(h.printTitle) + '</div><div class="ipp-list-count">New slot, print item goes in on Save</div>'
         : '<div class="ipp-list-count">New slot, no ' + esc(noun[1]) + ' yet</div><div class="ipp-list-why">Fill it after Save.</div>') + failLine(n.key) +
      '<div class="ipp-tile-actions">' + cancelLink(n.key, 'Cancel this new slot') + '</div></div>';
  }

  function secCount(key, list, filledFn){
    var el = IPP.q('[data-ipp-sec-count="' + key + '"]'); if (!el) return;
    if (!list.length) { el.innerHTML = '<span class="ipp-muted">No slots in this plan</span>'; return; }
    var f = list.filter(filledFn).length;
    el.innerHTML = '<b>' + list.length + '</b> slot' + (list.length === 1 ? '' : 's') + ' \u00b7 <b>' + f + '</b> filled';
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
    var filled = function(s){ return !!((s.asset && !s.asset.missing) || s.allocation); };   // v1.23: a held print item counts
    var listed = function(s){ return Number(s.listCount) > 0 || !!s.allocation; };

    keepScroll(function(){
      var at = byId(TILE_BOX.article);
      if (at) {
        var html = artFlow.filter(function(s){ return s.assetType === 'article'; }).map(articleTile).join('') +   // v1.40: no Around Town line here
          addsOf('article').map(newArticleTile).join('') + addTile('article');
        at.innerHTML = html || '<div class="ipp-sec-empty">No article slots in this plan.</div>';
      }
      // v1.13: ad slots are not drawn on the Picker (IA53, the Revenue tab).
      [['text-ad'],['re'],['event']].forEach(function(p){
        var t = p[0], el = byId(TILE_BOX[t]); if (!el) return;
        var html = group[t].map(function(s){ return (P.removes[s.id] || P.holds[s.id] || s.allocation || listBlocked(s)) ? listTile(s) : itemTiles(s); }).join('') + addsOf(t).map(newListTile).join('') + addTile(t);   // v1.44
        el.innerHTML = html;   // v1.12: the heading already says "No slots in this plan"
        el.hidden = !html;
      });
      var ut = byId('ipp_untypedList'), us = byId('ippCatUntyped');
      if (ut) ut.innerHTML = group.none.map(function(s){
        return '<div class="ipp-untyped-row">' + (s.blockType ? 'Block type ' + esc(s.blockType) : 'No block type') + '</div>';
      }).join('');
      if (us) us.hidden = !group.none.length;

      secCount('articles', group.article, filled);
      secCount('txa', group['text-ad'], listed);
      secListCount('re', group.re);        // v1.44
      secListCount('events', group.event);
      doneTick('txa', group['text-ad']);   // v1.38
      doneTick('re', group.re);
      doneTick('events', group.event);

      renderCC();   // v1.37: the Content Controller, from the catalog

      var warns = (b && b.meta && b.meta.warnings) || [];
      if (warns.length) {
        setMsg('<details class="ipp-board-notes"><summary>' + plural(warns.length, ['note','notes']) +
          ' from the plan data</summary><ul>' + warns.map(function(w){ return '<li>' + esc(w) + '</li>'; }).join('') +
          '</ul></details>', 'note');
      } else setMsg('', '');
      paintLock();
    });
    renderShelf();   // v1.50: the right rail
    paintSavebar();
    if (SP.key) renderSlotPicker();
  }
  function redraw(){ if (BOARD) renderBoard(BOARD); else paintSavebar(); }

  // ── lock (v1.23) ─────────────────────────────────────────
  // A locked plan keeps every line and dot; edits are hidden.
  function paintLock(){
    var lock = IPP.q('[data-ipp-al-lock]'), reload = IPP.q('[data-ipp-al-reload]');
    if (lock) lock.hidden = !LOCKED;
    if (reload) reload.hidden = LOCKED;
    var v = view(); if (v) v.classList.toggle('ipp-plan-locked', LOCKED);
    // v1.24: the Greeting and the Content Controller close too
    GR_FIELDS.forEach(function(f){ var el = grInput(f.name); if (el) el.readOnly = LOCKED; });
    ['ipp_greetingUndo'].forEach(function(id){   // v1.25: AI Generate is set by paintGenGate()
      var b = byId(id); if (!b) return;
      if (LOCKED) { if (!b.disabled) { b.disabled = true; b.setAttribute('data-ipp-lock-off', '1'); } }
      else if (b.getAttribute('data-ipp-lock-off')) { b.disabled = false; b.removeAttribute('data-ipp-lock-off'); }
    });
    EditState.reflect('greeting');
    paintGenGate();
  }

  // ── AI Generate gate (v1.25) ─────────────────────────────
  // On only when every article slot and every event slot has content.
  // Returns '' when AI Generate may run, else the reason, in words.
  function genBlocker(){
    if (LOCKED) return 'This plan is locked.';
    if (!BOARD) return 'Reading this plan\u2026';
    var arts = 0, artEmpty = 0, evs = 0, evEmpty = 0, needArt = [];
    slots().forEach(function(s){
      if (s.assetType === 'article') {
        arts++;
        if (s.asset && !s.asset.missing) return;
        // v1.27: a print item waiting for its article is work to create, not a gap to fill
        if (s.allocation && !s.allocation.missing) needArt.push(s.allocation.printTitle || 'Untitled');
        else artEmpty++;
      }
      else if (s.assetType === 'event') { evs++; if (!(Number(s.listCount) > 0)) evEmpty++; }
    });
    if (!arts && !evs) return 'Place articles or events first. AI writes the greeting from them.';
    var bits = [], out = [];
    if (artEmpty) bits.push(plural(artEmpty, ['article slot','article slots']));
    if (evEmpty)  bits.push(plural(evEmpty,  ['event slot','event slots']));
    if (needArt.length === 1) out.push('Create the article for \u201c' + needArt[0] + '\u201d, or take its print item out.');
    else if (needArt.length) out.push('Create ' + needArt.length + ' articles for print items waiting in their tiles, or take them out.');
    if (bits.length) out.push('Fill or remove ' + bits.join(' and ') + '.');
    if (out.length) return out.join(' ');
    if (anyPending()) return 'Save your changes first.';
    return '';
  }
  function paintGenGate(){
    var b = byId('ipp_greetingGenerate'), why = byId('ipp_grGenWhy');
    if (grAiBusy) return;   // v1.28: the writing state owns the button
    var reason = genBlocker();
    if (b) { b.disabled = !!reason; b.classList.toggle('ipp-gen-ready', !reason); }
    if (why) { why.textContent = reason || 'Ready. Every slot is filled.'; why.classList.toggle('ipp-gr-why--ok', !reason); }
  }

  // ── the shelf's refresh (was the rail's, v1.24) ───────────
  var SPIN_MS = 900;               // HC-P-IPP6-5
  function refreshAll(btn){
    var t0 = Date.now();
    if (btn) btn.classList.add('ipp-al-spin');
    var stop = function(){
      setTimeout(function(){ if (btn) btn.classList.remove('ipp-al-spin'); }, Math.max(0, SPIN_MS - (Date.now() - t0)));
    };
    loadAvail(true);   // v1.24: the articles too
    if (IPP.board && typeof IPP.board.load === 'function') IPP.board.load({ fresh:true }).then(stop, stop);
    else stop();
  }

  // ── available assets (R2, IA14) ──────────────────────────
  function assetListBase(){ return String((window.PP_WEBHOOKS || {}).assetList || '').replace(/\/+$/, ''); }
  function titleAdminId(){ return (BOARD && BOARD.plan && BOARD.plan.titleAdminId) || IPP.tenant().titleAdminId || ''; }
  function loadAvail(fresh){
    var base = assetListBase(), ta = titleAdminId();
    if (!base) { AVAIL.error = 'The asset list address is not set on this page (PP_WEBHOOKS.assetList).'; renderShelf(); return; }
    if (!ta) { AVAIL.error = 'This plan has no title (TITLES-ADMIN) to list articles for.'; renderShelf(); return; }
    AVAIL.loading = true; AVAIL.error = ''; renderShelf();
    IPP.getJSON(base + '/list?type=article&title=' + encodeURIComponent(ta) + (fresh ? '&fresh=1' : ''))
      .then(function(j){
        AVAIL.loading = false;
        AVAIL.items = (j.items || []).filter(function(it){ return !it.isArchived; });
        AVAIL.titles = j.titles || []; AVAIL.truncated = !!j.truncated;
        renderShelf();
      }, function(e){
        AVAIL.loading = false; AVAIL.error = 'Could not read the publisher\u2019s articles: ' + ((e && e.message) || e);
        renderShelf();
      });
  }
  /* v1.50 — THE SHELF (RT-9b). This title's articles not in this issue,
     in three groups: 1 matches a print item on this plan (the article a
     print item already names, or the same name as a reserved tile's print
     title); 2 never used in an issue (not in BOARD.shelf.usedArticleIds);
     3 ran before. Newest first inside a group. An article saved in a slot
     of this plan is not listed; one waiting on a tile is listed gold. */
  var SHELF_GROUPS = [['match', 'Matches a print item on this plan'], ['fresh', 'Never used in an issue'], ['ran', 'Ran before']];   // HC-P-PK50-2
  function shelfRows(q){
    var byAlloc = {}, reserved = [];
    ((BOARD && BOARD.allocations) || []).forEach(function(a){
      if (a.asset) byAlloc[a.asset.id] = a;
      else if (canLink(a) && !P.links[a.id]) reserved.push(a);
    });
    var titleName = {}; (AVAIL.titles || []).forEach(function(t){ titleName[t.id] = t.name; });
    var used = {}; (((BOARD && BOARD.shelf) || {}).usedArticleIds || []).forEach(function(id){ used[id] = 1; });
    var mine = titleAdminId();
    q = String(q || '').trim().toLowerCase();
    var rows = (AVAIL.items || []).filter(function(it){
      if (savedSlotOf(it.id)) return false;   // in the issue
      var n = String((it.fieldData || {}).name || '');
      return !q || n.toLowerCase().indexOf(q) >= 0;
    }).map(function(it){
      var f = it.fieldData || {}, n = String(f.name || '');
      var match = null;
      for (var i = 0; i < reserved.length; i++) {
        if (n.trim() && String(reserved[i].printTitle || '').trim().toLowerCase() === n.trim().toLowerCase()) { match = reserved[i]; break; }
      }
      var t = f['associated-title']; t = Array.isArray(t) ? t[0] : t;
      var thumb = f['main-image-ulc-link---1-1-ratio'] || (f['main-image'] && f['main-image'].url) || '';
      var alloc = byAlloc[it.id] || null;
      return { id: it.id, name: n, match: match, alloc: alloc, thumb: thumb,
               group: (match || alloc) ? 'match' : (used[it.id] ? 'ran' : 'fresh'),
               title: (t && t !== mine) ? (titleName[t] || '') : '', at: String(it.lastUpdated || '') };
    });
    rows.sort(function(a, b){ return b.at.localeCompare(a.at); });
    return rows;
  }
  var AVAIL_BY_ID = {};
  function shelfHead(){
    var box = byId('ipp_shelfTarget'); if (!box) return;
    if (!SHELF.target) { box.hidden = true; box.innerHTML = ''; return; }
    var s = slotById(SHELF.target), al = SHELF.allocId ? allocById(SHELF.allocId) : null;
    var what = al ? 'Matching \u201c' + esc(al.printTitle || 'Untitled') + '\u201d' : (s && s.allocation ? 'Matching \u201c' + esc(heldTitle(s)) + '\u201d' : (addByKey(SHELF.target) ? 'Filling the new slot' : 'Filling an open slot'));
    box.hidden = false;
    box.innerHTML = '<span>' + what + '. <b>Pick an article below.</b></span><button type="button" class="ix-revert" data-ipp-untarget="' + esc(SHELF.target) + '">Cancel</button>';
  }
  function renderShelf(){
    var list = byId('ipp_shelfList'), q = byId('ipp_shelfQ'); shelfHead();
    var v = view(); if (v) v.classList.toggle('ipp-shelf-armed', !!SHELF.target);
    if (!list) return;
    if (q && q.value !== SHELF.q) q.value = SHELF.q;
    if (AVAIL.error) { list.innerHTML = '<div class="ipp-al-empty ipp-al-empty--bad">' + esc(AVAIL.error) + '</div>'; return; }
    if (AVAIL.loading || !AVAIL.items) { list.innerHTML = '<div class="ipp-al-empty">Reading this title\u2019s articles\u2026</div>'; return; }
    var rows = shelfRows(SHELF.q), total = rows.length, shown = 0;
    AVAIL_BY_ID = {}; rows.forEach(function(r){ AVAIL_BY_ID[r.id] = r; });
    var html = SHELF_GROUPS.map(function(g){
      var gr = rows.filter(function(r){ return r.group === g[0]; }); if (!gr.length) return '';
      var items = gr.slice(0, Math.max(0, AVAIL_MAX - shown)); shown += items.length;
      return '<div class="ipp-al-sec"><div class="ipp-al-sechead">' + esc(g[1]) + ' <span class="ipp-al-secn">' + gr.length + '</span></div>' +
        items.map(function(r){
          var wait = pendingKeyFor(r.id), sub = [];
          if (r.title) sub.push('<span class="ipp-al-cust">' + esc(r.title) + '</span>');
          if (r.alloc) sub.push('<span class="ipp-al-word ipp-al-word--match">Article for \u201c' + esc(r.alloc.printTitle || 'a print item') + '\u201d</span>');
          else if (r.match) sub.push('<span class="ipp-al-word ipp-al-word--match">Same name as \u201c' + esc(r.match.printTitle || 'a print item') + '\u201d</span>');
          if (wait) sub.push('<span class="ipp-al-word ipp-al-word--gold">Goes in on Save</span>');
          var pickable = !!SHELF.target && !wait && !LOCKED && !P.saving;
          return '<div class="ipp-al-it' + (wait ? ' ipp-al-it--gold' : '') + (pickable ? ' ipp-al-it--pick' : '') + '"' + (pickable ? ' data-ipp-shelf-pick="' + esc(r.id) + '" role="button" tabindex="0"' : '') + '>' +
            '<div class="ipp-al-row"><div class="ipp-al-t">' + esc(r.name || 'Untitled') + '</div>' + (wait ? '<div class="ipp-al-act">' + cancelLink(wait, 'Cancel') + '</div>' : '') + '</div>' +
            (sub.length ? '<div class="ipp-al-sub">' + sub.join('<span class="ipp-al-dot">\u00b7</span>') + '</div>' : '') + '</div>';
        }).join('') + '</div>';
    }).join('');
    if (!total) html = '<div class="ipp-al-empty">' + (SHELF.q.trim() ? 'No article matches \u201c' + esc(SHELF.q) + '\u201d.' : 'Every article for this title is in this issue.') + '</div>';
    if (total > shown) html += '<div class="ipp-al-empty">Showing ' + shown + ' of ' + total + '. Search to narrow.</div>';
    if (AVAIL.truncated) html = '<div class="ipp-al-empty ipp-al-empty--bad">This list is incomplete: the asset list stopped early. Refresh to try again.</div>' + html;
    keepScroll(function(){ list.innerHTML = html; });
  }

  // ── the panel (R4) ───────────────────────────────────────
  /* One popover, opened on a tile. v1.50: article slots fill from the
     shelf, so the panel has two modes left: 'list' (an Events or Real
     Estate slot picks its items) and 'move' (a note picks the plans it
     goes to). */
  function spEl(){
    var r = IPP.root(); if (!r) return null;
    var el = r.querySelector('.ipp-sp');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'ipp-sp'; el.hidden = true;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Fill this list');
    r.appendChild(el);
    el.addEventListener('click', onSlotPickerClick);
    el.addEventListener('input', function(e){
      if (e.target.matches('[data-sp-q]')) { SP.q = e.target.value; renderSlotPicker(true); }
    });
    return el;
  }
  // v1.50 — the Move to… panel on a note tile: this title's other plans, a tick each
  function openMovePicker(key, tile){
    if (P.saving || LOCKED) return;
    var s = slotById(key); if (!s || !savedNote(s)) return;
    SP.key = key; SP.q = ''; SP.avail = false; SP.mode = 'move'; SP.allocId = '';
    MOVE.sel = {};
    var el = spEl(); if (!el) return;
    el.setAttribute('aria-label', 'Move this note to other plans');
    if (!MOVE.plans && !MOVE.loading) loadPlans();
    renderSlotPicker();
    el.hidden = false;
    placeSlotPicker(tile);
  }
  function loadPlans(){
    var url = plansUrl(), ta = titleAdminId();
    if (!url) { MOVE.error = 'The plans address is not known (PP_WEBHOOKS.plans or planBoard).'; renderSlotPicker(); return; }
    if (!ta) { MOVE.error = 'This plan has no title (TITLES-ADMIN) to list plans for.'; renderSlotPicker(); return; }
    MOVE.loading = true; MOVE.error = '';
    IPP.getJSON(url + (url.indexOf('?') < 0 ? '?' : '&') + 'titleAdminId=' + encodeURIComponent(ta))
      .then(function(j){ MOVE.loading = false; MOVE.plans = j.plans || []; renderSlotPicker(); },
            function(e){ MOVE.loading = false; MOVE.error = 'Could not read this title\u2019s plans: ' + ((e && e.message) || e); renderSlotPicker(); });
  }
  function movePlanRows(){
    var me = BOARD && BOARD.plan ? BOARD.plan.id : '', today = new Date().toISOString().slice(0, 10);
    return (MOVE.plans || []).filter(function(p){ return p.id !== me && !p.locked && String(p.date || '').slice(0, 10) >= today; })
      .sort(function(a, b){ return String(a.date || '').localeCompare(String(b.date || '')) || String(a.name).localeCompare(String(b.name)); });
  }
  function renderMovePicker(el){
    var s = slotById(SP.key);
    if (!s || !savedNote(s)) { closeSlotPicker(); return; }
    var head = '<div class="ipp-sp-head"><b>Move this note to\u2026</b><button type="button" class="ix-revert ipp-sp-close" data-sp-close>Close</button></div>';
    var cur = '<div class="ipp-sp-cur">\u201c' + esc(noteSnip(savedNote(s))) + '\u201d</div>';
    var body;
    if (MOVE.error) body = '<div class="ipp-al-empty ipp-al-empty--bad">' + esc(MOVE.error) + '</div>';
    else if (MOVE.loading || !MOVE.plans) body = '<div class="ipp-al-empty">Reading this title\u2019s plans\u2026</div>';
    else {
      var rows = movePlanRows();
      body = rows.length ? '<div class="ipp-sp-list">' + rows.map(function(p){
        var d = String(p.date || '').slice(0, 10), when = d ? new Date(d + 'T12:00:00').toLocaleDateString(undefined, { month:'short', day:'numeric' }) : '';
        return '<label class="ix-picker-option ipp-sp-opt ipp-sp-plan"><input type="checkbox" data-sp-plan="' + esc(p.id) + '"' + (MOVE.sel[p.id] ? ' checked' : '') + '>' +
          '<span class="ipp-sp-t">' + esc(p.name || 'Plan') + '</span>' + (when ? '<span class="ix-picker-option-meta">' + esc(when) + (p.open === false ? ' \u00b7 not open' : '') + '</span>' : '') + '</label>';
      }).join('') + '</div>' : '<div class="ipp-al-empty">No other unlocked plan for this title is dated today or later.</div>';
    }
    var n = Object.keys(MOVE.sel).filter(function(k){ return MOVE.sel[k]; }).length;
    var foot = '<div class="ipp-sp-foot"><span class="ipp-sp-note">Goes into each plan\u2019s lowest open article slot and leaves this one.</span>' +
      '<button type="button" class="ix-btn ix-btn--primary ipp-sp-move" data-sp-move' + (n ? '' : ' disabled') + '>Move' + (n ? ' to ' + plural(n, ['plan', 'plans']) : '') + '</button></div>';
    el.innerHTML = head + cur + body + foot;
  }
  function placeSlotPicker(tile){
    var el = spEl(); if (!el || el.hidden) return;
    var cssq = function(v){ return window.CSS && CSS.escape ? CSS.escape(v) : v; };
    tile = tile || IPP.q('[data-slot-key="' + cssq(SP.key) + '"]');
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
    SP.key = ''; SP.mode = 'list'; SP.allocId = ''; MOVE.sel = {};
    var r = IPP.root(); var el = r && r.querySelector('.ipp-sp');
    if (el) { el.hidden = true; el.innerHTML = ''; }
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
  // v1.26 — the list panel for an Events or Real Estate slot
  function openListPicker(key, tile){
    if (P.saving) return;
    var s = slotById(key); if (!s) return;
    var why = listBlocked(s); if (why) { say(why, 'info'); return; }
    clearTarget(false);
    SP.key = key; SP.q = ''; SP.avail = true; SP.mode = 'list'; SP.allocId = '';
    var el = spEl(); if (!el) return;
    el.setAttribute('aria-label', 'Fill this ' + ((LIST_NOUN[s.assetType] || ['',''])[0]) + ' slot');
    var src = listSrc(s.assetType);
    if (src && !src.items && !src.loading) loadList(s.assetType, false);
    renderSlotPicker();
    el.hidden = false;
    placeSlotPicker(tile);
  }
  function renderListPicker(el, keepInput){
    var s = slotById(SP.key);
    if (!s || !s.list) { closeSlotPicker(); return; }
    var t = s.assetType, noun = LIST_NOUN[t] || ['item','items'], src = listSrc(t);
    var ids = listIdsNow(s), inSlot = {}; ids.forEach(function(id){ inSlot[id] = 1; });
    var head = '<div class="ipp-sp-head"><b>Add ' + esc(noun[1]) + '</b>' +   // v1.44: the shelf only
      '<button type="button" class="ix-revert ipp-sp-close" data-sp-close>Close</button></div>';
    var ready = src && src.items;
    var line = function(id){
      var r = listItemById(t, id);
      var meta = r ? [r.when, r.where].filter(Boolean).map(esc) : [];
      if (r && r.flag) meta.push('<span class="ipp-al-word--gold">' + esc(r.flag) + '</span>');
      if (r && r.past) meta.push('past');
      return '<div class="ipp-sp-lsel"><span class="ipp-sp-t">' + esc(r ? r.name : (ready ? 'Not in the publisher\u2019s list' : 'Reading\u2026')) + '</span>' +
        (meta.length ? '<span class="ix-picker-option-meta">' + meta.join(' \u00b7 ') + '</span>' : '') +
        '<button type="button" class="ix-revert ipp-sp-lrm" data-sp-lrm="' + esc(id) + '">Remove</button></div>';
    };
    // v1.38 — the counts this block takes, from its type's designs
    var okCounts = allowedCounts(listLabel(s)), cw = countWhy(s, ids.length);
    var countLine = okCounts.length
      ? '<div class="ipp-sp-note' + (cw ? ' ipp-sp-note--bad' : '') + '">' + ids.length + ' of ' + countWords(okCounts) + (cw ? ' \u00b7 ' + esc(cw) : '') + '</div>'
      : '<div class="ipp-sp-note ipp-sp-note--bad">' + esc(countWhy(s, ids.length || 1)) + '</div>';
    var now = '<div class="ipp-sp-sec">In the block' + (P.lists[s.id] ? ' <span class="ipp-al-word--gold">(waiting for Save)</span>' : '') + '</div>' +   // v1.44: the tiles list them; only the count here
      countLine +
      (s.list.from === 'reference' && !P.lists[s.id] ? '<div class="ipp-al-empty">This slot uses the old single-' + noun[0] + ' field. Any change here moves it into the list.</div>' : '');
    var avail;
    if (src && src.error) avail = '<div class="ipp-al-empty ipp-al-empty--bad">' + esc(src.error) + '</div>';
    else if (!ready) avail = '<div class="ipp-al-empty">Reading the publisher\u2019s ' + noun[1] + '\u2026</div>';
    else {
      var q = String(SP.q || '').trim().toLowerCase();
      var rows = src.items.map(function(it){ return listItem(t, it); }).filter(function(r){
        return !r.archived && !r.past && !r.stale && !inSlot[r.id] && (!q || r.name.toLowerCase().indexOf(q) >= 0 || r.where.toLowerCase().indexOf(q) >= 0);   // v1.38: freshness
      });
      if (t === 'event') rows.sort(function(a, b){ return String(a.start).localeCompare(String(b.start)); });
      else rows.sort(function(a, b){ return a.name.localeCompare(b.name); });
      SP_REFS = {};
      var opts = rows.slice(0, AVAIL_MAX).map(function(r){
        var where = listElsewhere(s.id, r.id);
        var meta = [r.when, r.where].filter(Boolean).map(esc);
        if (r.flag) meta.push('<span class="ipp-al-word--gold">' + esc(r.flag) + '</span>');
        if (r.past) meta.push('past');
        if (where) return spOff(r.name, 'in ' + esc(where));
        SP_REFS['v:' + r.id] = { listId: r.id };
        return spOption({ ref:'v:' + r.id, name:r.name, meta:meta.join(' \u00b7 ') });
      });
      var full = maxCount(s) && ids.length >= maxCount(s);   // v1.38
      avail = (full ? '<div class="ipp-al-empty">This block is full at ' + maxCount(s) + '. Remove one to add another.</div>' : '') +
        '<div class="ipp-sp-list ipp-sp-list--avail"' + (full ? ' aria-disabled="true" style="opacity:.45;pointer-events:none"' : '') + '>' + (opts.length ? opts.join('') :
        '<div class="ipp-al-empty">' + (q ? 'Nothing matches \u201c' + esc(SP.q) + '\u201d.' : 'No other fresh ' + noun[1] + ' for this publisher.') + '</div>') + '</div>' +
        '<div class="ipp-sp-note">' + esc(freshNote(t)) + '</div>' +
        (rows.length > AVAIL_MAX ? '<div class="ipp-al-empty">Showing ' + AVAIL_MAX + ' of ' + rows.length + '. Search to narrow.</div>' : '') +
        (src.truncated ? '<div class="ipp-al-empty ipp-al-empty--bad">This list is incomplete: the asset list stopped early. Reload to try again.</div>' : '');
    }
    if (keepInput) {
      var box = el.querySelector('.ipp-sp-list--avail');
      var tmp = document.createElement('div'); tmp.innerHTML = avail;
      var fresh = tmp.querySelector('.ipp-sp-list--avail');
      if (box && fresh) { box.innerHTML = fresh.innerHTML; return; }
    }
    var search = '<input type="search" class="ipp-al-search" data-sp-q placeholder="Search this publisher\u2019s ' + noun[1] + '" aria-label="Search ' + noun[1] + '" value="' + esc(SP.q) + '">';
    var foot = P.lists[s.id] ? '<div class="ipp-sp-foot"><button type="button" class="ix-revert ipp-sp-empty" data-sp-lundo>Cancel changes to this slot</button></div>' : '';
    el.innerHTML = head + now + '<div class="ipp-sp-sec">The publisher\u2019s ' + noun[1] + '</div>' + search + avail + foot;
  }
  function renderSlotPicker(keepInput){
    var el = spEl(); if (!el || !SP.key) return;
    if (SP.mode === 'move') { renderMovePicker(el); return; }   // v1.50
    renderListPicker(el, keepInput);
  }
  function onSlotPickerClick(e){
    e.stopPropagation();
    if (e.target.closest('[data-sp-close]')) { closeSlotPicker(); return; }
    // v1.50 — Move to…: ticks, then Move
    if (SP.mode === 'move') {
      var cb = e.target.closest('[data-sp-plan]');
      if (cb) { MOVE.sel[cb.getAttribute('data-sp-plan')] = !!cb.checked; var mb = spEl().querySelector('[data-sp-move]'), n = Object.keys(MOVE.sel).filter(function(k){ return MOVE.sel[k]; }).length; if (mb) { mb.disabled = !n; mb.textContent = 'Move' + (n ? ' to ' + plural(n, ['plan', 'plans']) : ''); } return; }
      if (e.target.closest('[data-sp-move]')) {
        var ids = Object.keys(MOVE.sel).filter(function(k){ return MOVE.sel[k]; }), names = [];
        ids.forEach(function(id){ (MOVE.plans || []).forEach(function(p){ if (p.id === id) names.push(p.name || 'Plan'); }); });
        var mk = SP.key; closeSlotPicker();
        if (ids.length) setMove(mk, ids, names);
      }
      return;
    }
    // v1.26 — list panel: add, remove, undo; the panel stays open
    var ls = slotById(SP.key); if (!ls) { closeSlotPicker(); return; }
    if (e.target.closest('[data-sp-lundo]')) { delete P.lists[ls.id]; delete P.fails[ls.id]; doneFollowsList(ls.id); changed(); return; }   // done v1.38
    var rm = e.target.closest('[data-sp-lrm]');
    if (rm) { var rid = rm.getAttribute('data-sp-lrm'); setListIds(ls.id, listIdsNow(ls).filter(function(x){ return x !== rid; })); return; }
    var lp = e.target.closest('[data-sp-pick]'), lref = lp && SP_REFS[lp.getAttribute('data-sp-pick')];
    if (lref && lref.listId) { setListIds(ls.id, listIdsNow(ls).concat([lref.listId])); return; }
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
  // v1.45 — list blocks whose waiting count has no design; Save stays off while any exist
  function listsBad(){
    var out = [];
    slots().forEach(function(s){
      if (!s.list || !P.lists[s.id] || P.removes[s.id]) return;
      var n = P.lists[s.id].ids.length; if (!n) return;
      var cw = countWhy(s, n); if (!cw) return;
      var label = (LIST_NOUN[s.assetType] || ['item','items'])[1].replace(/^./, function(c){ return c.toUpperCase(); }), ok = allowedCounts(listLabel(s));
      out.push(label + ': ' + n + ' has no design' + (ok.length ? ' (takes ' + countWords(ok) + ')' : ''));
    });
    return out;
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
    if (c.linked)  parts.push(plural(c.linked,  ['print item matched','print items matched']));
    if (c.held)    parts.push(plural(c.held,    ['print item placed','print items placed']));   // v1.23
    if (c.listed)  parts.push(plural(c.listed,  ['list changed','lists changed']));
    if (c.done)    parts.push(plural(c.done,    ['Done tick changed','Done ticks changed']));   // v1.38
    if (c.noted)   parts.push(plural(c.noted,   ['note','notes']));                              // v1.50
    if (c.noteDel) parts.push(plural(c.noteDel, ['note deleted','notes deleted']));
    if (c.moved)   parts.push(plural(c.moved,   ['note moved','notes moved']));
    var gr = grDirtyCount();
    var text = P.saving ? 'Saving ' + plural(c.total, ['write','writes']) + '\u2026'
      : (c.total ? plural(c.total, ['write','writes']) + ' waiting: ' + parts.join(', ') : 'No unsaved changes');
    if (gr && !P.saving) text += (c.total ? ' \u00b7 ' : ' \u00b7 ') + 'Greeting edited (save it in its card)';
    if (!c.total && !gr && !P.saving) text = 'No unsaved changes';
    var lb = P.saving ? [] : listsBad();                                   // v1.45
    if (lb.length) text += ' \u00b7 Save is off: ' + lb.join('; ');
    var stat = bar.querySelector('.stat'); if (stat) stat.textContent = text;
    bar.classList.toggle('ipp-savebar--bad', lb.length > 0);
    bar.classList.toggle('ipp-dirty', c.total > 0 || gr > 0);
    bar.classList.toggle('saving', !!P.saving);
    if (box) {
      var save = box.querySelector('[data-ipp-save]'), all = box.querySelector('[data-ipp-cancel-all]');
      if (save) { save.disabled = !c.total || P.saving || lb.length > 0; save.title = lb.length ? lb.join('; ') : ''; save.textContent = P.saving ? 'Saving\u2026' : (c.total ? 'Save ' + plural(c.total, ['change','changes']) : 'Save'); }
      if (all) all.hidden = !c.total || P.saving;
    }
    paintGenGate();   // v1.25: waiting changes keep AI Generate off
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
    function refusalOf(text) { try { var j = JSON.parse(text); return (j && typeof j.error === 'string' && j.error.trim()) ? j.error.trim() : ''; } catch (e) { return ''; } }   // v1.49, as ipp-publish v2.51
    return chunks.reduce(function(chain, chunk, ci){
      return chain.then(function(){
        return fetch(batchUrl(url, op, batchId + (ci ? '-' + ci : ''), chunk), { method:'GET', credentials:'omit' })
          .then(function(r){
            return r.text().then(function(t){
              if (!r.ok) throw new Error(refusalOf(t) || (who + ' answered HTTP ' + r.status + ' to ' + op + '.'));   // v1.49: the Worker's sentence first
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
    if (LOCKED) { say('Can\u2019t save: this plan is locked. Nothing was sent.', 'err'); return; }   // v1.23
    var url = blockWriter();
    if (!url) { say('Can\u2019t save: this page has no PP_WEBHOOKS.blockWriter address (Scenario 124).', 'err'); return; }
    if (!BOARD || !BOARD.plan) { say('Can\u2019t save: the plan has not been read yet.', 'err'); return; }
    var lurl = slateWriter(), lfield = linkField();
    if (c.records && !lurl) { say('Can\u2019t save: this page has no PP_WEBHOOKS.slateWriter address (Scenario 103B), so the print items cannot be updated. Nothing was sent.', 'err'); return; }
    if (c.records && !lfield) { say('Can\u2019t save: the plan data does not name the print item\u2019s article field (linkFields, Data Worker v1.0.13). Nothing was sent.', 'err'); return; }
    var plan = BOARD.plan, wi = BOARD.writeIds || { assetType:{}, blockType:{} };
    var articleField = acceptsField('article');
    var heldField = allocField();   // v1.23
    var needsHeld = Object.keys(P.holds).length > 0 || Object.keys(P.clears).some(function(k){ var s0 = slotById(k); return s0 && s0.allocation; });
    if (needsHeld && !heldField) { say('Can\u2019t save: the plan data does not name the tile field for print items (blockFields, Data Worker v1.0.16). Nothing was sent.', 'err'); return; }
    // v1.50 — notes: typed (124 fill of blockFields.note), deleted (124 clear), cleared under a fill (RT-7a), moved (fill on another plan, then clear here)
    var nfield = noteField(), noteFills = [], noteClears = [], moves = [];
    Object.keys(P.notes).forEach(function(k){
      if (!noteDirty(k) || !slotById(k)) return;
      var txt = noteWire(P.notes[k].text);
      if (txt) noteFills.push({ key:'note:' + k, slotKey:k, note:true, text:txt, op:{ id:k, assetField:nfield, assetId:txt } });
      else if (savedNote(slotById(k))) noteClears.push({ key:'notedel:' + k, slotKey:k, note:true, op:{ id:k, assetField:nfield } });
    });
    Object.keys(P.noteDels).forEach(function(k){ if (slotById(k)) noteClears.push({ key:'notedel:' + k, slotKey:k, note:true, op:{ id:k, assetField:nfield } }); });
    Object.keys(P.fills).concat(Object.keys(P.holds)).forEach(function(k){   // RT-7a: an article or print item into a noted slot takes the note off, silently
      var ns = slotById(k); if (!ns || !savedNote(ns) || P.noteDels[k]) return;
      noteClears.push({ key:'notecl:' + k, slotKey:k, note:true, quiet:true, op:{ id:k, assetField:nfield } });
    });
    Object.keys(P.moves).forEach(function(k){ var ms = slotById(k); if (ms && savedNote(ms)) moves.push({ slotKey:k, text:noteWire(savedNote(ms)), planIds:P.moves[k].planIds.slice(), names:P.moves[k].names.slice() }); });
    if ((noteFills.length || noteClears.length || moves.length) && !nfield) { say('Can\u2019t save: the plan data does not name the note field (blockFields.note, Data Worker v1.0.75). Nothing was sent.', 'err'); return; }
    var boardBase = String((window.PP_WEBHOOKS || {}).planBoard || '');
    if (moves.length && !boardBase) { say('Can\u2019t save: this page has no PP_WEBHOOKS.planBoard address, so the other plans cannot be read for Move to\u2026. Nothing was sent.', 'err'); return; }
    // v1.26 — list writes through Scenario 127, checked before anything is sent
    var durl = designWriter(), listW = [], listErr = '', designW = [];   // designW v1.38
    Object.keys(P.lists).forEach(function(k){
      var ls = slotById(k);
      if (!ls) { listErr = 'a waiting list belongs to a slot that is no longer on the plan'; return; }
      var bw = listBlocked(ls); if (bw) { listErr = slotName(k) + ': ' + bw; return; }
      var n = P.lists[k].ids.length;
      // v1.38 — the count must have a design, and that design is written with the list
      var cw = countWhy(ls, n); if (cw) { listErr = slotName(k) + ': ' + cw; return; }
      if (n) {
        var d = designForCount(ls, n); if (d.why) { listErr = slotName(k) + ': ' + d.why; return; }
        if (!designField()) { listErr = 'the plan data does not name the design field (blockFields.design)'; return; }
        if (ls.design !== d.id) designW.push({ key:'design:' + k, slotKey:k, design:true, name:d.name, op:{ id:k, assetField:designField(), assetId:d.id } });
      } else if (ls.design && designField()) designW.push({ key:'design:' + k, slotKey:k, design:true, clear:true, op:{ id:k, assetField:designField() } });
      try { listW.push({ key:'list:' + k, slotKey:k, ids:P.lists[k].ids.slice(), json: listJson(ls, P.lists[k].ids) }); }
      catch (e) { listErr = slotName(k) + ': its design settings cannot be read'; }
    });
    if (listW.length && !durl) { say('Can\u2019t save: this page has no PP_WEBHOOKS.designWrite address (Scenario 127), so event and listing lists cannot be written. Nothing was sent.', 'err'); return; }
    if (listErr) { say('Can\u2019t save: ' + listErr + '. Nothing was sent.', 'err'); return; }
    if (listW.length && !plan.titleAdminId) { say('Can\u2019t save: the plan data has no title id for Scenario 127. Nothing was sent.', 'err'); return; }
    // v1.38 — Done ticks, through 124 op flag on blockFields.listDone
    var dones = [], dfield = doneField();
    Object.keys(P.done).forEach(function(k){
      var ds = slotById(k); if (!ds) return;
      dones.push({ key:'done:' + k, slotKey:k, on: !!P.done[k].on, op:{ id:k, field:dfield, on: !!P.done[k].on } });
    });
    if (dones.length && !dfield) { say('Can\u2019t save: the plan data does not name the Done field (blockFields.listDone, Data Worker v1.0.53). Nothing was sent.', 'err'); return; }
    closeSlotPicker(); clearTarget(false);
    P.saving = true; P.fails = {}; redraw();

    var creates = [], fills = [], clears = [], dels = [], links = [];
    Object.keys(P.links).forEach(function(k){
      // v1.18: paired = made with a fill on this Save, so not a change of its own in the count
      links.push({ key:'link:' + k, allocId:k, asset:P.links[k].asset, paired: !!(P.links[k].withFill && pendingKeyFor(P.links[k].asset.id)),
                   op:{ id:k, field:lfield, assetId:P.links[k].asset.id } });
    });
    P.adds.forEach(function(a){
      var f = P.fills[a.key], field = acceptsField(a.assetType), h = P.holds[a.key];
      var at = (wi.assetType || {})[a.assetType], bt = a.blockType ? (wi.blockType || {})[a.blockType] : '';
      if (!at) { P.fails[a.key] = 'no option id for asset type \u201c' + a.assetType + '\u201d (plan data writeIds)'; return; }
      if (a.blockType && !bt) { P.fails[a.key] = 'no option id for block type \u201c' + a.blockType + '\u201d'; return; }
      if (f && !(field && field !== 'list')) { P.fails[a.key] = 'this slot type cannot hold an article'; return; }
      var sk = 'slot-' + a.position;
      // v1.23: a new tile can carry a print item (asset-allocation-id) instead of an article
      creates.push({ key:a.key, fill:f || null, hold: (!f && h) ? h : null, op:{
        pubplanId: plan.id, blockName: (plan.name || 'Plan') + '-b' + a.position, slotKey: sk, position: a.position,
        planningNote: '', showAsSponsored: false, blockTypeHash: bt, assetTypeHash: at,
        assetField: f ? field : (h ? heldField : 'slot-key'), assetId: f ? f.asset.id : (h ? h.allocId : sk),
        designId: a.designId || '' } });   // v1.31: 124 writes design when sent
    });
    Object.keys(P.fills).forEach(function(k){
      if (addByKey(k)) return;
      if (!articleField || articleField === 'list') { P.fails[k] = 'the plan data does not say which field holds an article'; return; }
      fills.push({ key:k, fill:P.fills[k], op:{ id:k, assetField:articleField, assetId:P.fills[k].asset.id } });
    });
    // v1.23: a print item into a saved tile, through the same 124 fill
    Object.keys(P.holds).forEach(function(k){
      if (addByKey(k)) return;
      fills.push({ key:k, hold:P.holds[k], op:{ id:k, assetField:heldField, assetId:P.holds[k].allocId } });
    });
    // v1.23: emptying a tile clears its article, its print item, or both
    Object.keys(P.clears).forEach(function(k){
      var s2 = slotById(k);
      if (!s2 || s2.asset) clears.push({ key:k, slotKey:k, op:{ id:k, assetField:articleField } });
      if (s2 && s2.allocation) clears.push({ key:'hc:' + k, slotKey:k, held:true, op:{ id:k, assetField:heldField } });
    });
    // v1.38: a list's design follows its count (124 fill / clear on the design field)
    designW.forEach(function(d){ if (d.clear) clears.push(d); else fills.push(d); });
    noteFills.forEach(function(n){ fills.push(n); });     // v1.50
    noteClears.forEach(function(n){ clears.push(n); });

    // v1.20: articles leaving this plan, and the allocations they free.
    var leaving = {}, outgoing = [];
    clears.forEach(function(it){ if (it.held) return; var s0 = slotById(it.key); if (s0 && s0.asset) { leaving[it.key] = 1; outgoing.push({ key:it.key, assetId:s0.asset.id }); } });
    fills.forEach(function(it){ if (it.design) return; var s1 = slotById(it.key); if (s1 && s1.asset && s1.asset.id !== it.op.assetId) { leaving[it.key] = 1; outgoing.push({ key:it.key, assetId:s1.asset.id }); } });   // design v1.38
    var frees = [], freeErr = '', seenFree = {};
    outgoing.forEach(function(o){
      var f = freeFor(o.assetId, leaving); if (!f) return;
      if (f.error) { freeErr = f.error; return; }
      if (seenFree[f.op.id]) return; seenFree[f.op.id] = 1;
      frees.push({ key:'free:' + f.op.id, slotKey:o.key, name:f.name, op:f.op });
    });
    if (frees.length || freeErr) {
      if (freeErr) { P.saving = false; P.fails = {}; redraw(); say('Can\u2019t save: an article leaving this plan came from a print item, and ' + freeErr + '. Nothing was sent.', 'err'); return; }
      if (!lurl) { P.saving = false; redraw(); say('Can\u2019t save: an article leaving this plan came from a print item, and this page has no PP_WEBHOOKS.slateWriter address (Scenario 103B) to free it. Nothing was sent.', 'err'); return; }
    }

    var passed = {}, failed = {}, typeNotes = [];   // typeNotes v1.32
    DESIGN_CLEARS = [];                             // v1.34
    var mark = function(rows){ rows.forEach(function(r){ if (r.why) failed[r.item.key] = r.why; else passed[r.item.key] = r.res || true; }); };

    // v1.16: 103B links first (§09). A link counts only when 103B read the
    // field back and it holds the id sent.
    /* v1.50 — Move to…: read each chosen plan, take its lowest open article
       slot (or add one, RT-2), and write the note there in that plan's own
       batch; the clear here is added once every copy landed. */
    var moveFills = [], moveCreates = [];
    function prepMoves(){
      if (!moves.length) return Promise.resolve();
      var seen = {};
      return moves.reduce(function(chain, m){
        return m.planIds.reduce(function(ch, pid, pi){
          return ch.then(function(){
            var rd = seen[pid] || (seen[pid] = IPP.getJSON(boardBase + (boardBase.indexOf('?') < 0 ? '?' : '&') + 'planId=' + encodeURIComponent(pid) + '&fresh=1'));
            return rd.then(function(tb){
              var name = m.names[pi] || (tb.plan && tb.plan.name) || 'the plan';
              if (tb.plan && tb.plan.locked) throw new Error(name + ' is locked, so the note cannot go there.');
              var taken = {}; moveFills.concat(moveCreates).forEach(function(x){ if (x.planId === pid) taken[x.op.id || x.op.slotKey] = 1; });
              var open = (tb.slots || []).filter(function(x){ return x.assetType === 'article' && !x.asset && !x.allocation && !x.note && !(Number(x.listCount) > 0) && !taken[x.id]; })
                .sort(function(x, y){ return Number(x.position) - Number(y.position); })[0];
              if (open) { moveFills.push({ key:'move:' + m.slotKey + ':' + pid, slotKey:m.slotKey, planId:pid, planName:name, note:true, move:true, text:m.text, op:{ id:open.id, assetField:nfield, assetId:m.text } }); return; }
              var at = tb.addTypes && tb.addTypes.article, tw = (tb.writeIds || {}).assetType || {};
              if (!at || !tw[at.assetType]) throw new Error(name + ' has no open article slot and cannot add one (IX_CONFIG.addTypes).');
              var used = {}, last = 0; (tb.slots || []).forEach(function(x){ used[x.position] = 1; if (x.position > last) last = x.position; }); moveCreates.forEach(function(x){ if (x.planId === pid) used[x.op.position] = 1; });
              var pos = Math.floor(last) + 1; while (used[pos]) pos++;
              moveCreates.push({ key:'move:' + m.slotKey + ':' + pid, slotKey:m.slotKey, planId:pid, planName:name, note:true, move:true, text:m.text,
                op:{ pubplanId:pid, blockName:((tb.plan && tb.plan.name) || 'Plan') + '-b' + pos, slotKey:'slot-' + pos, position:pos, planningNote:'', showAsSponsored:false,
                     blockTypeHash:'', assetTypeHash:tw[at.assetType], assetField:nfield, assetId:m.text, designId:at.designId || '' } });
            });
          });
        }, chain);
      }, Promise.resolve());
    }
    function moveStage(op, items){   // one batch per plan: the Worker's /release-check reads one plan per batch
      var byPlan = {}; items.forEach(function(it){ (byPlan[it.planId] = byPlan[it.planId] || []).push(it); });
      return Object.keys(byPlan).reduce(function(chain, pid){
        return chain.then(function(acc){ return stage(url, op, byPlan[pid], function(it){ return it.op; }, function(it){ return [['note', it.op.assetId, nfield]]; }).then(function(r){ return acc.concat(r); }); });
      }, Promise.resolve([]));
    }
    var linkStage = function(){ return !links.length ? Promise.resolve([]) :
      sendBatch(lurl, 'link', links.map(function(it){ return it.op; }), 'Scenario 103B').then(function(results){
        return links.map(function(it, i){
          var res = resultFor(results, i), why = '';
          if (!res) why = 'no result came back';
          else if (res.fieldOk !== true) why = '103B refused the field \u201c' + (res.field || it.op.field) + '\u201d';
          else if (res.ok !== true || !res.id) why = res.err || 'Webflow refused the write';
          else if (String(res.value || '') !== String(it.op.assetId)) why = 'the print item does not hold the article after the write';
          return { item:it, why:why, res:res };
        });
      }, function(e){
        var why = (e && e.message) || 'the request failed';
        return links.map(function(it){ return { item:it, why:why }; });
      }); };

    prepMoves().then(function(){ return linkStage(); }).then(function(r){
      mark(r);
      return moveStage('create', moveCreates);   // v1.50: a note into a slot added on another plan
    }).then(function(r){
      mark(r);
      return moveStage('fill', moveFills);       // v1.50: a note into an open slot on another plan
    }).then(function(r){
      mark(r);
      // every copy of a note landed: it leaves this slot in the clear stage below
      moves.forEach(function(m){
        var all = moveFills.concat(moveCreates).filter(function(x){ return x.slotKey === m.slotKey; });
        if (all.length && all.every(function(x){ return passed[x.key] && !failed[x.key]; })) clears.push({ key:'notemv:' + m.slotKey, slotKey:m.slotKey, note:true, moveNote:true, op:{ id:m.slotKey, assetField:nfield } });
      });
      return stage(url, 'create', creates, function(it){ return it.op; }, function(it, op){
      return [['position', op.position, 'position'], ['slot-key', op.slotKey, 'slot-key'],
              ['asset', op.assetId, 'asset'], ['asset type', op.assetTypeHash, 'asset-type']]
             .concat(op.designId ? [['design', op.designId, 'design']] : []);   // v1.31
      });
    }).then(function(r){
      mark(r);
      return stage(url, 'fill', fills, function(it){ return it.op; }, function(it, op){ return [[it.note ? 'note' : it.design ? 'design' : (it.hold ? 'print item' : 'article'), op.assetId, it.note ? nfield : 'asset']]; });   // design v1.38; note v1.50
    }).then(function(r){
      mark(r);
      // v1.34 — a filled slot takes its article's type (124 layout op), and
      // loses a design of another type (124 clear on the design field).
      var typing = [];
      fills.forEach(function(it){
        if (!it.fill || !passed[it.key]) return;
        var s3 = slotById(it.key), t3 = artTypeOf(it.fill.asset.id).type;
        if (!s3 || !t3) return;                                       // no Section: the slot stays as it is
        if (upLabel(s3.blockType) !== t3) {
          var h3 = (wi.blockType || {})[t3];
          if (!h3) typeNotes.push(slotName(it.key) + ': no option id for block type ' + t3);
          else typing.push({ key:'type:' + it.key, slotKey:it.key, want:h3,
            op:{ id:it.key, blockTypeJson: JSON.stringify(h3), endGroup: !!s3.endGroup, blockTextJson: JSON.stringify(s3.blockText || '') } });
        }
        if (s3.design && !designFits(s3.design, t3)) DESIGN_CLEARS.push({ key:'dc:' + it.key, slotKey:it.key, op:{ id:it.key, assetField:designField() } });
      });
      return stage(url, 'layout', typing, function(it){ return it.op; }, function(it){ return [['type', it.want, 'block-type']]; });
    }).then(function(r){
      r.forEach(function(x){ if (x.why) typeNotes.push(slotName(x.item.slotKey) + ': the slot\u2019s type did not save (' + x.why + ')'); });
      return [];
    }).then(function(r){
      mark(r);
      // a move empties the old slot, once the new slot has it
      fills.concat(creates).forEach(function(it){
        var f = it.fill; if (!f || !f.srcSlot || failed[it.key] || !passed[it.key]) return;   // a hold has no fill
        if (P.fills[f.srcSlot] || P.removes[f.srcSlot] || P.clears[f.srcSlot]) return;
        clears.push({ key:f.srcSlot, moveOf:it.key, op:{ id:f.srcSlot, assetField:articleField } });
      });
      return stage(url, 'clear', clears, function(it){ return it.op; }, function(it){ return it.note ? [['empty note', '', nfield]] : [['empty asset', '', 'asset']]; });   // note v1.50
    }).then(function(r){
      mark(r);
      // v1.34 — an emptied article slot loses its type (124 layout, null) and its design
      var untype = [];
      clears.forEach(function(it){
        if (it.held || !passed[it.key] || failed[it.key]) return;
        var s4 = slotById(it.key); if (!s4 || s4.assetType !== 'article') return;
        if (P.fills[it.key] || P.holds[it.key]) return;                 // something else goes in
        if (s4.blockType) untype.push({ key:'untype:' + it.key, slotKey:it.key,
          op:{ id:it.key, blockTypeJson: 'null', endGroup: !!s4.endGroup, blockTextJson: JSON.stringify(s4.blockText || '') } });
        if (s4.design) DESIGN_CLEARS.push({ key:'dc:' + it.key, slotKey:it.key, op:{ id:it.key, assetField:designField() } });
      });
      return stage(url, 'layout', untype, function(it){ return it.op; }, function(){ return [['type', '', 'block-type']]; });
    }).then(function(r){
      r.forEach(function(x){ if (x.why) typeNotes.push(slotName(x.item.slotKey) + ': the slot\u2019s type was not cleared (' + x.why + ')'); });
      var dcs = DESIGN_CLEARS.filter(function(d){ return d.op.assetField; });
      if (DESIGN_CLEARS.length && !dcs.length) typeNotes.push('designs were not cleared: the plan data does not name the design field (blockFields.design)');
      return stage(url, 'clear', dcs, function(it){ return it.op; }, function(){ return [['empty design', '', 'asset']]; });
    }).then(function(r){
      r.forEach(function(x){ if (x.why) typeNotes.push(slotName(x.item.slotKey) + ': the old design was not cleared (' + x.why + ')'); });
      return [];
    }).then(function(r){
      mark(r);
      // v1.20: free only where the article really left the slot
      var go = frees.filter(function(f){ return passed[f.slotKey] && !failed[f.slotKey]; });
      if (!go.length) return [];
      return sendBatch(lurl, 'save', go.map(function(f){ return f.op; }), 'Scenario 103B').then(function(results){
        return go.map(function(it, i){
          return { item:it, why: verdict(resultFor(results, i), [['publication-plans', it.op.plansCount, 'plansCount'], ['disposition', it.op.disposition, 'disposition']]), res: resultFor(results, i) };
        });
      }, function(e){
        var why = (e && e.message) || 'the request failed';
        return go.map(function(it){ return { item:it, why:why }; });
      });
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
        if (!x.why && res && res.liveRemoved === false) notes.push(slotName(x.item.ofKey || x.item.key) + ': the published copy was not removed');
      });
      mark(r);
      // v1.38 — Done ticks (124 op flag); the read decides, as for every field
      return stage(url, 'flag', dones, function(it){ return it.op; }, function(it){ return [['Done', it.on, 'flag']]; }).then(function(r2){ return { rows:r2, notes:notes }; });
    }).then(function(fr){
      var notes = fr.notes;
      mark(fr.rows);
      // v1.26 — lists last, one 127 call each. The read decides; this only
      // records what 127 said, so a reply we cannot read is not a failure yet.
      return listW.reduce(function(chain, it){
        return chain.then(function(){ return sendDesign(durl, plan, it).then(function(said){ it.said = said; }); });
      }, Promise.resolve()).then(function(){
        finishSave(creates, fills, clears, dels, passed, failed, notes.concat(typeNotes), links, frees, listW, dones, moveFills.concat(moveCreates));   // typeNotes v1.32, dones v1.38, moves v1.50
      });
    }).catch(function(e){
      P.saving = false; redraw();
      say('Save stopped: ' + ((e && e.message) || e) + '. Nothing after that point was sent. Your changes are kept.', 'err');
    });
  }

  // v1.26 — one Scenario 127 block write. GET with the payload as query
  // params, like 124 and 103B. Resolves to what 127 said ('' when it said
  // ok or we could not read its reply); never rejects.
  function sendDesign(url, plan, it){
    var q = 'level=block&targetId=' + encodeURIComponent(it.slotKey) + '&taItemId=' + encodeURIComponent(plan.titleAdminId) +
      '&taName=' + encodeURIComponent(plan.titleName || '') + '&json=' + encodeURIComponent(it.json);
    return fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + q, { method:'GET', credentials:'omit' }).then(function(r){
      return r.text().then(function(t){
        if (!r.ok) return 'Scenario 127 answered HTTP ' + r.status;
        var b = null; try { b = JSON.parse(t); } catch (e) { return ''; }
        if (b && b.ok === false) return String(b.error || b.err || 'Scenario 127 refused the write');
        return '';
      });
    }, function(){ return ''; });   // unreadable reply: the read decides
  }
  var FINAL = null;
  // The read decides every list: green only when it shows exactly what was sent.
  function settleLists(b, listW, lag){
    var bad = [], good = 0, f = FINAL || {};
    listW.forEach(function(it){
      var s = null; (b.slots || []).forEach(function(x){ if (x.id === it.slotKey) s = x; });
      var got = (s && s.list && s.list.ids) || [];
      var ok = sameIds(got, it.ids) && (it.ids.length ? s.list.from === 'design-json' : true);
      if (ok) { good++; delete P.lists[it.slotKey]; delete P.fails[it.slotKey]; return; }
      var why = it.said || (it.ids.length || !got.length ? 'the plan read does not show the new list' :
        'the list is empty, but the old single-item field still holds one, so it still shows');
      P.fails[it.slotKey] = why;
      bad.push(slotName(it.slotKey) + ' (' + why + ')');
    });
    FINAL = null; P.saving = false;
    var labels = (f.labels || []).concat(bad), passedN = Object.keys(f.passed || {}).length + good;
    (f.links || []).forEach(function(it){ if (it.paired && f.passed[it.key]) passedN--; });
    (f.frees || []).forEach(function(it){ if (f.passed[it.key]) passedN--; });
    (f.clears || []).forEach(function(it){ if (it.held && f.passed[it.key] && !f.failed[it.slotKey] && f.clears.some(function(x){ return !x.held && x.slotKey === it.slotKey; })) passedN--; });
    (f.fills || []).concat(f.clears || []).forEach(function(it){ if (it.design && f.passed[it.key]) passedN--; });   // v1.38: the design rides with its list
    if (labels.length) say((passedN ? 'Some changes saved, but not all. ' : 'Nothing was saved. ') + labels.join('; ') +
      '. What did not save is still waiting, gold, ready to try again.' + ((f.freeBad || []).length ? ' Also: ' + f.freeBad.join('; ') + '.' : ''), 'err');
    else if ((f.freeBad || []).length) say('The slot change saved. ' + f.freeBad.join('; ') + '.', 'err');
    else if (lag.length) say('Saved, but the plan read has not caught up for ' + lag.join(', ') + '. Reload in a moment; nothing is lost.', 'unverified');
    else say('Saved ' + plural(passedN, ['change','changes']) + '.' + ((f.notes || []).length ? ' Note: ' + f.notes.join('; ') + '.' : ''), (f.notes || []).length ? 'unverified' : 'ok');
    redraw();
  }

  function noteRow(v){ var o = {}; o[noteField() || 'note'] = v; return o; }   // v1.50: the field by its slug from the board, for IxRefresh
  function finishSave(creates, fills, clears, dels, passed, failed, notes, links, frees, listW, dones, moved){
    var labels = [], landed = [];
    links = links || []; frees = frees || []; listW = listW || []; dones = dones || []; moved = moved || [];
    // v1.50 — a note's copies on other plans
    moved.forEach(function(it){
      if (failed[it.key]) { P.fails[it.slotKey] = failed[it.key]; labels.push('The note into ' + it.planName + ' (' + failed[it.key] + ')'); }
    });
    // v1.38 — Done ticks
    dones.forEach(function(it){
      if (failed[it.key]) { P.fails[it.key] = failed[it.key]; labels.push('Done on ' + slotName(it.slotKey) + ' (' + failed[it.key] + ')'); }
      else if (passed[it.key]) delete P.done[it.slotKey];
    });
    // v1.20: the slot change stands; say plainly that the print item did not follow
    var freeBad = [];
    frees.forEach(function(it){
      if (failed[it.key]) freeBad.push('\u201c' + it.name + '\u201d left this plan, but its print item still lists it (' + failed[it.key] + '). Take the plan off it in the Print Issue Allocator');
    });
    links.forEach(function(it){
      if (failed[it.key]) { P.fails[it.key] = failed[it.key]; labels.push('Recording \u201c' + it.asset.name + '\u201d on its print item (' + failed[it.key] + ')'); }
      else if (passed[it.key]) delete P.links[it.allocId];
    });
    var nameOf = function(key){ return slotName(key); };
    creates.forEach(function(it){ if (failed[it.key]) { P.fails[it.key] = failed[it.key]; labels.push(nameOf(it.key) + ' (' + failed[it.key] + ')'); } });
    // v1.23: a tile emptied of both article and print item is done only when both landed
    fills.forEach(function(it){ if (failed[it.key]) { var fk = it.slotKey || it.key; P.fails[fk] = failed[it.key]; labels.push((it.note ? 'The note on ' : '') + nameOf(fk) + (it.design ? ', its design' : '') + ' (' + failed[it.key] + ')'); } });   // design v1.38; note v1.50
    var clearBad = {};
    clears.forEach(function(it){
      if (!failed[it.key]) return;
      var sk = it.slotKey || it.key;
      if (it.design) { labels.push(slotName(sk) + ': its old design was not cleared (' + failed[it.key] + ')'); return; }   // v1.38
      if (it.note) {   // v1.50
        if (it.quiet) { labels.push('The note on ' + nameOf(sk) + ' was not cleared under the fill (' + failed[it.key] + '). Delete it from the tile.'); return; }
        if (it.moveNote) { labels.push('The note copied to its plans but still sits on this one (' + failed[it.key] + '). Delete it from the tile.'); delete P.moves[sk]; return; }
        P.fails[sk] = failed[it.key]; labels.push('Deleting the note on ' + nameOf(sk) + ' (' + failed[it.key] + ')'); return;
      }
      if (it.moveOf) labels.push(slotName(it.key) + ' still holds its old article (' + failed[it.key] + '). Empty it from its slot panel.');
      else { clearBad[sk] = 1; P.fails[sk] = failed[it.key]; labels.push(slotName(sk) + (it.held ? ', its print item' : '') + ' (' + failed[it.key] + ')'); }
    });
    dels.forEach(function(it){
      if (!failed[it.key]) return;
      if (it.ofKey) labels.push(nameOf(it.ofKey) + ': extra row left (' + failed[it.key] + '). Its article is in the slot; the extra row needs removing.');
      else { P.fails[it.key] = failed[it.key]; labels.push((looseById(it.key) ? 'An extra row' : slotName(it.key)) + ' (' + failed[it.key] + ')'); }
    });
    // what landed leaves the pending list; the board read decides green
    var rows = [];
    creates.forEach(function(it){ if (passed[it.key] && !failed[it.key]) {
      for (var i = 0; i < P.adds.length; i++) if (P.adds[i].key === it.key) { P.adds.splice(i,1); break; }
      delete P.fills[it.key]; delete P.holds[it.key]; landed.push(it.key);
      rows.push({ id: (passed[it.key] && passed[it.key].id) || '', fields:{ position: it.op.position, 'slot-key': it.op.slotKey } });
    } });
    fills.forEach(function(it){ if (passed[it.key]) {
      if (it.design) { rows.push({ id:it.slotKey, fields:{ design: it.op.assetId } }); return; }   // v1.38
      if (it.note) { delete P.notes[it.slotKey]; landed.push(it.slotKey); rows.push({ id:it.slotKey, fields:noteRow(it.op.assetId) }); return; }   // v1.50
      if (it.hold) delete P.holds[it.key]; else delete P.fills[it.key];
      landed.push(it.key); rows.push({ id:it.key, fields:{ asset: it.op.assetId } }); } });
    clears.forEach(function(it){
      var sk = it.slotKey || it.key;
      if (it.design) { if (passed[it.key]) rows.push({ id:sk, fields:{ design:'' } }); return; }   // v1.38
      if (it.note) { if (passed[it.key]) { delete P.noteDels[sk]; delete P.notes[sk]; if (it.moveNote) delete P.moves[sk]; rows.push({ id:sk, fields:noteRow('') }); } return; }   // v1.50
      if (passed[it.key] && !clearBad[sk]) { if (!it.moveOf) delete P.clears[sk]; rows.push({ id:sk, fields:{ asset:'' } }); }
    });
    dones.forEach(function(it){ if (passed[it.key]) rows.push({ id:it.slotKey, fields:{ 'list-done': it.on } }); });   // v1.38
    dels.forEach(function(it){ if (passed[it.key] && !it.ofKey) { delete P.removes[it.key]; rows.push({ id:it.key, deleted:true }); } });
    listW.forEach(function(it){ rows.push({ id:it.slotKey, fields:{ 'design-json': it.json } }); });
    P.saving = !!listW.length;   // v1.26: lists wait for the read

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
        var s = null; (b.slots || []).forEach(function(x){ if (x.id === (it.slotKey || it.key)) s = x; });
        if (it.design) { if (!s || s.design !== it.op.assetId) lag.push(slotName(it.slotKey) + '\u2019s design'); return; }   // v1.38
        if (it.note) { if (!s || String(s.note || '') !== it.op.assetId) lag.push('the note on article slot ' + (s ? s.position : '?')); return; }   // v1.50
        if (it.hold) {   // v1.23: the tile must read back holding the print item
          if (!s || !s.allocation || s.allocation.id !== it.op.assetId) lag.push('\u201c' + it.hold.printTitle + '\u201d in its tile');
          return;
        }
        if (!s || !s.asset || s.asset.id !== it.op.assetId) lag.push('\u201c' + it.fill.asset.name + '\u201d');
      });
      links.forEach(function(it){
        if (!passed[it.key]) return;
        var a = null; (b.allocations || []).forEach(function(x){ if (x.id === it.allocId) a = x; });
        if (!a || !a.asset || a.asset.id !== it.op.assetId) lag.push('\u201c' + it.asset.name + '\u201d on its print item');
      });
      frees.forEach(function(it){
        if (!passed[it.key]) return;
        (b.allocations || []).forEach(function(x){ if (x.id === it.op.id) lag.push('\u201c' + it.name + '\u201d leaving its print item'); });
      });
      dones.forEach(function(it){   // v1.38
        if (!passed[it.key]) return;
        var sd = null; (b.slots || []).forEach(function(x){ if (x.id === it.slotKey) sd = x; });
        if (!sd || (sd.listDone === true) !== it.on) lag.push('Done on ' + slotName(it.slotKey));
      });
      if (lag.length && !listW.length) say('Saved, but the plan read has not caught up for ' + lag.join(', ') + '. Reload in a moment; nothing is lost.', 'unverified');
      if (listW.length) settleLists(b, listW, lag);
    }, function(){
      /* onBoard shows the read error */
      if (listW.length) { FINAL = null; P.saving = false; listW.forEach(function(it){ P.fails[it.slotKey] = 'the plan could not be read back to check it'; });
        say('Sent, but the plan could not be read back, so the event and listing lists are not confirmed. They stay gold; reload and check before trying again.', 'unverified'); redraw(); }
    });
    if (listW.length) { FINAL = { labels:labels, freeBad:freeBad, passed:passed, notes:notes, links:links, frees:frees, clears:clears, fills:fills, failed:failed }; redraw(); return; }   // fills v1.38

    if (labels.length) {
      say((Object.keys(passed).length ? 'Some changes saved, but not all. ' : 'Nothing was saved. ') + labels.join('; ') +
        '. What did not save is still waiting, gold, ready to try again.' + (freeBad.length ? ' Also: ' + freeBad.join('; ') + '.' : ''), 'err');
    } else if (freeBad.length) {
      // v1.20: the slot change landed; only the print item did not follow
      say('The slot change saved. ' + freeBad.join('; ') + '.', 'err');
    } else {
      var n = Object.keys(passed).length;
      links.forEach(function(it){ if (it.paired && passed[it.key]) n--; });   // v1.18: counted with its fill
      frees.forEach(function(it){ if (passed[it.key]) n--; });                 // v1.20: counted with its slot
      clears.forEach(function(it){ if (it.held && passed[it.key] && !failed[it.slotKey] && clears.some(function(x){ return !x.held && x.slotKey === it.slotKey; })) n--; });   // v1.23: one tile, one change
      fills.concat(clears).forEach(function(it){ if (it.design && passed[it.key]) n--; });   // v1.38: the design rides with its list
      clears.forEach(function(it){ if (it.note && (it.quiet || it.moveNote) && passed[it.key]) n--; });   // v1.50: a note cleared under a fill or a move rides with it
      var movedSlots = {}; moved.forEach(function(it){ if (passed[it.key]) movedSlots[it.slotKey] = (movedSlots[it.slotKey] || 0) + 1; });
      Object.keys(movedSlots).forEach(function(k){ n -= movedSlots[k] - 1; });   // one move, however many plans
      say('Saved ' + plural(n, ['change','changes']) + '.' + (notes.length ? ' Note: ' + notes.join('; ') + '.' : ''), notes.length ? 'unverified' : 'ok');
    }
    redraw();
  }

  // ── v1.30 · Create from print ────────────────────────────
  var CFP_RESULT_KEY = 'ix.cfp.result';
  function createFromPrint(allocId, slotId){
    if (!allocId) return;
    if (anyPending() || grDirtyCount() > 0) {
      say('Save or Cancel your other changes first. Create article leaves this page, and unsaved changes would be lost.', 'info');
      return;
    }
    var plan = BOARD && BOARD.plan;
    var page = (window.IPP_RETURN && window.IPP_RETURN.url) ? String(window.IPP_RETURN.url).split('#')[0].split('?')[0]
             : (plan && plan.titleSlug ? '/title-admin/' + plan.titleSlug : '');   // HC-P-IPP2-7
    if (!page) { say('Can\u2019t open Create: the plan data has no title slug, so the T-A page is unknown.', 'err'); return; }
    if (!plan.id) { say('Can\u2019t open Create: the plan data has no plan id.', 'err'); return; }
    var ret = window.location.pathname + window.location.search + '#ipp-view=picker';   // HC-P-CFP-10
    window.location.href = page + '?cfp_alloc=' + encodeURIComponent(allocId) +
      '&cfp_plan=' + encodeURIComponent(plan.id) +
      (slotId ? '&cfp_slot=' + encodeURIComponent(slotId) : '') +
      '&cfp_ret=' + encodeURIComponent(ret);
  }
  // Shown once, after a fresh board read, when Create from print sent us back.
  function cfpResult(){
    var raw = null; try { raw = sessionStorage.getItem(CFP_RESULT_KEY); } catch (e) { raw = null; }
    if (!raw) return;
    try { sessionStorage.removeItem(CFP_RESULT_KEY); } catch (e) {}
    var r = null; try { r = JSON.parse(raw); } catch (e) { r = null; }
    if (!r || !r.msg || (Date.now() - Number(r.at || 0)) > 600000) return;
    var al = (BOARD && BOARD.allocations || []).filter(function(a){ return a.id === r.allocId; })[0];
    var shown = al && al.asset;
    say(shown ? r.msg : r.msg + ' The plan read just now does not show it yet; refresh in a moment.', shown ? 'ok' : 'unverified');
  }

  // ── the shelf card (v1.50) ───────────────────────────────
  function infoBadge(){
    if (!window.IxInfo || typeof window.IxInfo.badge !== 'function') return '';
    return window.IxInfo.badge({
      file: FILE, version: VERSION, title: 'Picker \u00b7 Articles',
      blurb: 'The tiles are this plan\u2019s real slots, read fresh from the CMS each time the page opens. ' +
             'Ads are not on the Picker; they belong to the Revenue tab. ' +
             'The Picker picks; it does not lay out. Order and moving between slots are done on the Layout tab.\n\n' +
             'The shelf lists this title\u2019s articles that are not in this issue, in three groups: ones that match a print item ' +
             'on this plan (the article a print item already names, or the same name as a reserved tile\u2019s print title), ' +
             'ones never used in an issue, and ones that ran before. To fill a slot, click an empty tile (or Match article on a ' +
             'reserved tile), then pick an article on the shelf. A reserved tile is a print item the Allocator placed with no ' +
             'article yet; Create article opens the T-A page with its print page beside the Asset Form, then brings you back.\n\n' +
             'An empty slot can hold a note (Add note): the note keeps the slot and stops Compile until the slot is filled, the note ' +
             'is moved to other plans, or it is deleted. Move to\u2026 copies it into each chosen plan\u2019s lowest open article slot.\n\n' +
             'Every change waits in gold, with its own Cancel, until you press Save. Save writes through ' +
             'Scenario 124 (and 103B for a Match) and checks each value Webflow sends back. A tile turns green only when the plan, ' +
             'read again after Save, shows the change. A locked plan shows everything and changes nothing.',
      scenarios: [{ name: 'Scenario 103B \u00b7 Allocations Writer', note: 'records a matched article on its print item (PP_WEBHOOKS.slateWriter)' },
                  { name: 'Scenario 124 \u00b7 PubPlan Block Writer', note: 'create, fill (articles, designs, notes), clear, delete, flag (Done) \u2014 v2.26 or later (PP_WEBHOOKS.blockWriter)' },
                  { name: 'Scenario 127 \u00b7 Design Writer', note: 'the event and listing lists (PP_WEBHOOKS.designWrite)' },
                  { name: 'Data Worker \u00b7 ix-issue-data', note: '/plan-board (notes, holds, shelf groups), /plans (Move to\u2026), /sections \u2014 v1.0.75 or later (PP_WEBHOOKS.planBoard)' },
                  { name: 'ix-asset-list Worker', note: 'this title\u2019s articles, for the shelf (PP_WEBHOOKS.assetList)' }],
      companions: 'ipp-picker-markup-v1.20.js \u00b7 ipp-picker-v1.34.css \u00b7 ipp-shell-v1.26.js \u00b7 ix-issue-data v1.0.75 \u00b7 124 v2.26 \u00b7 103B v1.4.1'
    });
  }
  function mountShelf(v){
    var rail = IPP.q('.ipp-rail-right', v); if (!rail || IPP.q('.ipp-shelf-card', rail)) return;
    var card = document.createElement('div');
    card.className = 'ipp-card ipp-al-card ipp-shelf-card';
    card.innerHTML = window.IPP_PICKER_SHELF_MARKUP || '';
    if (!window.IPP_PICKER_SHELF_MARKUP) console.warn('[ipp-picker] IPP_PICKER_SHELF_MARKUP is missing: load ipp-picker-markup-v1.20.js');
    rail.insertBefore(card, rail.firstChild);
    var slot = IPP.q('[data-ipp-al-info]', card); if (slot) slot.innerHTML = infoBadge();
    card.addEventListener('click', function(e){
      var rb = e.target.closest('[data-ipp-al-reload]');
      if (rb) { refreshAll(rb); return; }
      var ut = e.target.closest('[data-ipp-untarget]');
      if (ut) { clearTarget(); return; }
      if (LOCKED || P.saving) return;   // v1.23: a locked plan shows, it does not change
      var cx = e.target.closest('[data-ipp-cancel]');
      if (cx) { cancelKey(cx.getAttribute('data-ipp-cancel')); return; }
      var pk = e.target.closest('[data-ipp-shelf-pick]');
      if (pk) { pickForTarget(AVAIL_BY_ID[pk.getAttribute('data-ipp-shelf-pick')]); return; }
    });
    card.addEventListener('keydown', function(e){
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var pk = e.target.closest && e.target.closest('[data-ipp-shelf-pick]'); if (!pk) return;
      e.preventDefault(); pickForTarget(AVAIL_BY_ID[pk.getAttribute('data-ipp-shelf-pick')]);
    });
    card.addEventListener('input', function(e){
      if (e.target.matches('#ipp_shelfQ')) { SHELF.q = e.target.value; renderShelf(); }
    });
  }

  function wireCanvas(canvas){
    canvas.addEventListener('click', function(e){
      if (e.target.closest('[data-ipp-board-retry]')) { IPP.board.load({ fresh:true }).catch(function(){}); return; }
      var ut = e.target.closest('[data-ipp-untarget]');                        // v1.50: Cancel on the shelf's target
      if (ut) { clearTarget(); return; }
      if (LOCKED || P.saving) return;   // v1.23
      var mt = e.target.closest('[data-ipp-match]');                           // v1.50: Match article on a reserved tile
      if (mt) { setTarget(mt.getAttribute('data-ipp-match'), mt.getAttribute('data-ipp-match-alloc')); return; }
      var na = e.target.closest('[data-ipp-note-add]');                        // v1.50: the note card
      if (na) { var nk = na.getAttribute('data-ipp-note-add'); if (!noteField()) { setNote(nk, ''); return; } P.notes[nk] = { text:'' }; changed(); var box = IPP.q('[data-ipp-note="' + nk + '"]'); if (box) box.focus(); return; }
      var nf = e.target.closest('[data-ipp-note-fill]');
      if (nf) { setTarget(nf.getAttribute('data-ipp-note-fill'), ''); return; }
      var nm = e.target.closest('[data-ipp-note-move]');
      if (nm) { var mk = nm.getAttribute('data-ipp-note-move'); openMovePicker(mk, nm.closest('[data-slot-key]')); return; }
      var nd = e.target.closest('[data-ipp-note-del]');
      if (nd) { delNote(nd.getAttribute('data-ipp-note-del')); return; }
      if (e.target.closest('[data-ipp-note]')) return;                         // typing in the box is not a tile click
      if (e.target.closest('[data-ipp-create]')) {
        /* v1.30 — HC-P-IPP6-2 wired: Create from print on the T-A page. */
        var cb = e.target.closest('[data-ipp-create]');
        var ct = cb.closest('[data-slot-key]');
        createFromPrint(cb.getAttribute('data-ipp-create'), ct ? ct.getAttribute('data-slot-key') : '');
        return;
      }
      var em = e.target.closest('[data-ipp-empty]');
      if (em) { setClear(em.getAttribute('data-ipp-empty')); return; }
      var add = e.target.closest('[data-ipp-add]');
      if (add) { addSlot(add.getAttribute('data-ipp-add')); return; }
      var rm = e.target.closest('[data-ipp-remove]');
      if (rm) { toggleRemove(rm.getAttribute('data-ipp-remove')); return; }
      var dn = e.target.closest('[data-ipp-done]');                            // v1.38
      if (dn) { if (!dn.disabled) toggleDone(dn.getAttribute('data-ipp-done')); return; }
      var dc = e.target.closest('[data-ipp-done-cancel]');
      if (dc) { var dk = dc.getAttribute('data-ipp-done-cancel'); delete P.done[dk]; delete P.fails['done:' + dk]; changed(); return; }
      var cx = e.target.closest('[data-ipp-cancel]');
      if (cx) { cancelKey(cx.getAttribute('data-ipp-cancel')); return; }
      var lr = e.target.closest('[data-ipp-lrm]');                          // v1.44: Remove / Cancel this on an item tile
      if (lr) { var lrs = slotById(lr.getAttribute('data-ipp-item-slot')), lrid = lr.getAttribute('data-ipp-lrm'); if (lrs) setListIds(lrs.id, listIdsNow(lrs).filter(function(x){ return x !== lrid; })); return; }
      var lk = e.target.closest('[data-ipp-lkeep]');                        // v1.44: Keep it on a removed item tile
      if (lk) { var lks = slotById(lk.getAttribute('data-ipp-item-slot')), lkid = lk.getAttribute('data-ipp-lkeep'); if (lks) { var cur = listIdsNow(lks), at = ((lks.list && lks.list.ids) || []).indexOf(lkid); cur.splice(Math.min(at < 0 ? cur.length : at, cur.length), 0, lkid); setListIds(lks.id, cur); } return; }
      var lc = e.target.closest('[data-ipp-lcancel]');                      // v1.44: Cancel changes to the block
      if (lc) { var lck = lc.getAttribute('data-ipp-lcancel'); delete P.lists[lck]; delete P.fails[lck]; doneFollowsList(lck); changed(); return; }
      var la = e.target.closest('[data-ipp-list-add]');                     // v1.43/v1.44: the add tile opens the shelf
      if (la) { if (!la.classList.contains('is-full')) openListPicker(la.getAttribute('data-ipp-list-add'), la.closest('[data-slot-key]')); else say('This block is full. Remove one to add another.', 'info'); return; }
      var ea = e.target.closest('[data-ipp-edit-art]');                     // v1.34
      if (ea) { editArticle(ea.getAttribute('data-ipp-edit-art')); return; }
      if (e.target.closest('[data-ipp-facts]')) return;                     // the facts line is not a tile click
      var tile = e.target.closest('[data-ipp-open][data-slot-key]');
      if (!tile) return;
      var key = tile.getAttribute('data-slot-key');
      var ls = slotById(key);
      if (ls && ls.list && !addByKey(key)) { openListPicker(key, tile); return; }   // v1.26
      // v1.50: an empty article tile (saved or new) becomes the shelf's target; a filled one does nothing here
      var isEmpty = addByKey(key) ? !(P.fills[key] || P.holds[key]) : (ls && ls.assetType === 'article' && isEmptySaved(ls) && !P.fills[key] && !P.holds[key] && !P.removes[key]);
      if (!isEmpty) return;
      if (SHELF.target === key) { clearTarget(); return; }
      setTarget(key, '');
    });
    // v1.50 — typing in a note box: pending at once, painted in place so the box keeps focus
    canvas.addEventListener('input', function(e){
      var box = e.target.closest && e.target.closest('[data-ipp-note]'); if (!box || LOCKED || P.saving) return;
      var k = box.getAttribute('data-ipp-note'); setNote(k, box.value);
      var tile = box.closest('.ipp-slot'), dirty = noteDirty(k), saved = savedNote(slotById(k));
      if (tile) {
        tile.classList.toggle('ipp-dirty', dirty);
        var w = tile.querySelector('[data-ipp-note-word]'); if (w) { w.textContent = dirty ? (saved ? 'Note changes on Save' : 'Note holds this slot on Save') : 'Note holds this slot'; w.classList.toggle('ipp-tile-word', dirty); }
        var acts = tile.querySelector('.ipp-note-actions');
        if (acts) {
          var c = acts.querySelector('[data-ipp-cancel]'), mv = acts.querySelector('[data-ipp-note-move]');
          if (dirty && !c) acts.insertAdjacentHTML('beforeend', cancelLink(k, saved ? 'Back to the saved note' : 'Drop this note'));
          if (!dirty && c) c.remove();
          if (mv) mv.hidden = dirty;
        }
      }
      paintSavebar();
    });
    // the panel follows its tile; a scroll of the canvas moves it
    canvas.addEventListener('scroll', function(){ if (SP.key) placeSlotPicker(); }, { passive:true });
    // v1.44 — drag a listing tile to reorder it; the canvas scrolls itself near its edges
    var DRAG = null, DRAG_EDGE = 60, DRAG_STEP = 12;   // HC-P-PK44-1: the auto-scroll edge and step for a tile drag
    canvas.addEventListener('dragstart', function(e){
      var tile = e.target.closest && e.target.closest('.ipp-item-tile[draggable="true"]'); if (!tile) return;
      DRAG = { slot: tile.getAttribute('data-ipp-item-slot'), id: tile.getAttribute('data-ipp-item') };
      tile.classList.add('is-dragging');
      try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', DRAG.id); } catch (x) {}
    });
    canvas.addEventListener('dragover', function(e){
      if (!DRAG) return;
      var r = canvas.getBoundingClientRect(), edge = DRAG_EDGE;   // HC-P-PK44-1
      if (e.clientY < r.top + edge) canvas.scrollTop -= DRAG_STEP; else if (e.clientY > r.bottom - edge) canvas.scrollTop += DRAG_STEP;
      var over = e.target.closest && e.target.closest('.ipp-item-tile'); if (!over || over.getAttribute('data-ipp-item-slot') !== DRAG.slot || over.classList.contains('ipp-item--rm')) return;
      e.preventDefault();
      var or = over.getBoundingClientRect(), before = e.clientX < or.left + or.width / 2;
      IPP.qa('.ipp-item-tile.is-drop-before, .ipp-item-tile.is-drop-after', canvas).forEach(function(x){ x.classList.remove('is-drop-before', 'is-drop-after'); });
      if (over.getAttribute('data-ipp-item') !== DRAG.id) over.classList.add(before ? 'is-drop-before' : 'is-drop-after');
    });
    canvas.addEventListener('drop', function(e){
      if (!DRAG) return;
      var over = e.target.closest && e.target.closest('.ipp-item-tile'); if (!over || over.getAttribute('data-ipp-item-slot') !== DRAG.slot) return;
      e.preventDefault();
      var s = slotById(DRAG.slot), tid = over.getAttribute('data-ipp-item'); if (!s || tid === DRAG.id) { DRAG = null; redraw(); return; }
      var or = over.getBoundingClientRect(), before = e.clientX < or.left + or.width / 2;
      var ids = listIdsNow(s).filter(function(x){ return x !== DRAG.id; }), at = ids.indexOf(tid); if (at < 0) { DRAG = null; redraw(); return; }
      ids.splice(before ? at : at + 1, 0, DRAG.id);
      DRAG = null; setListIds(s.id, ids);
    });
    canvas.addEventListener('dragend', function(){ DRAG = null; IPP.qa('.ipp-item-tile.is-dragging, .ipp-item-tile.is-drop-before, .ipp-item-tile.is-drop-after', canvas).forEach(function(x){ x.classList.remove('is-dragging', 'is-drop-before', 'is-drop-after'); }); });
  }

  function onBoard(e){
    var d = (e && e.detail) || {};
    if (d.ok) {
      BOARD = d.data;
      setTimeout(cfpResult, 0);   // v1.30
      loadSectionTypes();                                         // v1.32: Section types
      if (!AVAIL.items && !AVAIL.loading) loadAvail(false);       // v1.32: the articles' own types
      // v1.23: a locked plan takes no changes; anything waiting is dropped, and said
      LOCKED = !!(BOARD.plan && BOARD.plan.locked === true);
      // v1.26: names for saved list tiles
      (BOARD.slots || []).forEach(function(s){ var src = s.list && listSrc(s.assetType); if (src && !src.items && !src.loading && !src.error) loadList(s.assetType, false); });
      var grWaiting = LOCKED && grDirtyCount() > 0 && !GR.saving;
      if (LOCKED && (anyPending() || grWaiting)) {
        P.adds = []; P.fills = {}; P.clears = {}; P.removes = {}; P.links = {}; P.holds = {}; P.lists = {}; P.notes = {}; P.noteDels = {}; P.moves = {}; P.fails = {};
        clearTarget(false); closeSlotPicker();
        if (grWaiting) grRevert();   // v1.24: the greeting is closed too
        say('This plan is locked. The changes you had waiting were dropped; nothing was sent.', 'unverified');
      }
      if (LOCKED) closeSlotPicker();
      // pending changes whose slot no longer exists are dropped, and said
      var gone = [];
      ['fills','clears','removes','holds','lists','notes','noteDels','moves'].forEach(function(n){   // notes v1.50
        Object.keys(P[n]).forEach(function(k){
          if (addByKey(k) || slotById(k) || (n === 'removes' && looseById(k))) return;
          delete P[n][k];
          if (!(n === 'removes' && !slotById(k))) gone.push(k);   // a loose row that is gone is what Retry wanted
        });
      });
      if (gone.length) say('A slot you had a change waiting on is no longer in this plan. That change was dropped.', 'unverified');
      // v1.50: an empty note card with nothing typed closes on a fresh read; a deleted or moved note that is already gone is done
      Object.keys(P.notes).forEach(function(k){ if (!noteDirty(k) && !savedNote(slotById(k))) delete P.notes[k]; });
      Object.keys(P.noteDels).forEach(function(k){ if (!savedNote(slotById(k))) delete P.noteDels[k]; });
      Object.keys(P.moves).forEach(function(k){ if (!savedNote(slotById(k))) delete P.moves[k]; });
      if (SHELF.target && !addByKey(SHELF.target) && !slotById(SHELF.target)) clearTarget(false);
      // v1.16: a waiting link whose allocation is gone, or now holds an article
      var lgone = [];
      Object.keys(P.links).forEach(function(k){
        var a = allocById(k);
        if (a && !a.asset) return;
        if (a && a.asset && a.asset.id === P.links[k].asset.id) { delete P.links[k]; return; }
        lgone.push(P.links[k].asset.name || 'an article'); delete P.links[k]; delete P.fails['link:' + k];
      });
      if (lgone.length) say('An article you had chosen (' + lgone.join(', ') + ') was dropped: its print item is gone or already has an article.', 'unverified');
      // v1.23: a print item waiting to go in whose allocation is gone, already has its article, or is already in a tile
      var hgone = [];
      Object.keys(P.holds).forEach(function(k){
        var a = allocById(P.holds[k].allocId);
        if (a && !a.asset && !a.placement) return;
        hgone.push(P.holds[k].printTitle || 'a print item'); delete P.holds[k]; delete P.fails[k];
      });
      if (hgone.length) say('A print item you had waiting (' + hgone.join(', ') + ') was dropped: it is gone, has its article, or is already in a tile.', 'unverified');
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
    wireCC(); wireGreeting(); renderCC();
    mountShelf(view); wireCanvas(canvas); paintLock(); paintSavebar();
    // close the panel on a click anywhere else, or Esc
    document.addEventListener('click', function(e){
      if (!SP.key) return;
      var el = IPP.root() && IPP.root().querySelector('.ipp-sp');
      if (el && el.contains(e.target)) return;
      if (e.target.closest && e.target.closest('[data-ipp-open][data-slot-key], [data-ipp-choose], [data-ipp-note-move]')) return;
      closeSlotPicker();
    });
    document.addEventListener('keydown', function(e){
      if (e.key !== 'Escape') return;
      if (SP.key) { closeSlotPicker(); return; }
      if (SHELF.target) clearTarget();   // v1.50
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
    console.info('[ipp-picker] mounted (v' + VERSION + ' \u00b7 catalog controller \u00b7 articles shelf \u00b7 notes \u00b7 lists through 127 \u00b7 writes through 103B and 124)');
  }

  document.addEventListener('ipp:ready',mount);
  document.addEventListener('ipp:view',function(e){ if(e.detail&&e.detail.view==='picker') mount(); });
  if(document.querySelector('[data-ipp-root]')) mount();

  window.IPP.picker={ mount:mount, version:VERSION, catalogRows:ccRows,
    locked:function(){ return LOCKED; }, board:function(){ return BOARD; },
    pending:function(){ return JSON.parse(JSON.stringify({ adds:P.adds, fills:P.fills, clears:P.clears, removes:P.removes, links:P.links, holds:P.holds, lists:P.lists, notes:P.notes, noteDels:P.noteDels, moves:P.moves, fails:P.fails })); },   // lists v1.44; notes v1.50
    shelfTarget:function(){ return SHELF.target; },
    save:saveBoard, cancelAll:cancelAll,
    greeting:{ dirtyCount:grDirtyCount, save:grSave, revert:grRevert, paint:grPaintAll, nlbId:function(){ return GR.nlbId; },
               aiCandidateFits:grAiCandidateFits, aiApply:grAiApply } };
})();
