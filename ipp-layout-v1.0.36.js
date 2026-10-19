/* ipp-layout-v1.0.36.js */
/* ============================================================
   ipp-layout-v1.0.36.js — Layout view for the IPP
   Companion stylesheet: ipp-layout-v1.0.21.css

   v1.0.36 (19 Oct 2026, 106 Gap Interview S3) — BANNER ROWS SHOW THE AD,
   NOT ITS FILE NAME (Jeff, on the first look at v1.0.35). A banner row
   is a small picture of the ad (CSS .ipp-ly-thumb, 48 x 24) followed by
   the customer's name; the ad's file name is gone from the line (it is
   still in the open panel). Everything else as v1.0.35. The stylesheet
   bump (v1.0.21) takes 2px off every size and gives Preview 15% less of
   the width.

   v1.0.35 (19 Oct 2026, 106 Gap Interview S3 · the quiet Layout)

   v1.0.35 (19 Oct 2026, 106 Gap Interview S3 · the quiet Layout) — ONE
   LINE PER BLOCK; THE CHECKLIST OF UNUSED KINDS; A SPONSORED STORY IS
   NEVER IN AROUND TOWN. Three rulings in one bump.
   · THE TILE (Jeff's brief, 19 Oct, mockup "IPP Layout · Zen concept"
     accepted): a resting tile is one line: grip, number, the name with
     a few grey words after it, then a fixed right column with the
     sponsor tag and the state dot, the dot in the same place on every
     row. Article titles print in curly quotes; names are coloured by
     what the block is for (furniture, revenue, lists; articles in ink).
     Nothing else sits on a resting tile: the type, the design, the
     picture, Cancel and Remove all moved into the open panel, where
     the Design is a row of pills (one choice = the name as text, v1.0.33
     rule kept), the saved pill struck through when a new one is picked,
     the picked one bordered gold. Cancel / Close / Remove sit at the
     panel's foot, right. The open panel is the gold-edged card; the
     tile's dot takes a gold ring when the block has an unsaved change
     (the standing rule: a changed thing stays gold until Save or Cancel).
     The dot: green = ready to compile (design set, content in), salmon
     = waiting on you (a Before Publish line names it), grey = pending
     (added or removed on Save).
     The sponsor tag: "Not sponsored" in grey on every article tile, a
     standing reminder to sell the section; "Sponsored · <customer>" in
     amber when Revenue has set one (slot.sponsor, Data Worker v1.0.28).
     HC-P-L35-1: the tag words. The head carries one sentence: "Every
     block has a design. Nothing to fix." or "N blocks to fix before
     Publish." HC-P-L35-2: those words.
   · NOT IN THIS ISSUE (closure S2 D15, ruling 4): a permanent side card
     listing every block type the title has a live design for that this
     plan does not use (from the board's designChoices against the
     plan's types). A kind the Add row can add gets an Add link; the
     rest say "on the Picker" (articles and lists are chosen there).
     HC-P-L35-3: "on the Picker". The Before Publish card is unchanged
     and shows only when it has something to say.
   · AROUND TOWN (ruled by Jeff, 18 Oct, S3 ruling 13): a story whose
     section is sponsored this issue may not sit inside an Around Town
     group. It is prohibited, not advised: the tile goes salmon, Before
     Publish names it ("… is in Around Town, but Sports Corner is
     sponsored this issue. Move it to its own tile."), and the row is
     marked blocked. Save is allowed (you may be mid-move); the Data
     Worker's preflight refuses the compile (v1.0.64, queued).
   · The Add row is pills. The group bracket is a soft gold edge.
   · Kept as they were: drag and keyboard moves, Save and its batches,
     editions, Preview, Heads up, the rail tab's fit count, the info
     badge, the one-type stopgap on a typed block (v1.0.16).
   Companion stylesheet ipp-layout-v1.0.19.css (rewritten tile rules).

   v1.0.34 — kept below as history.
   Companion stylesheet: ipp-layout-v1.0.18.css (unchanged since v1.0.30)

   v1.0.34 (18 Oct 2026, 106 Gap Interview S2 · shadow plan) — THE WEATHER
   BLOCK NEEDS NO DESIGN; THE GREETING PILL STANDS ALONE
   - Before Publish stopped WLN-901A on "no design is made for LW blocks
     for this title". Wrong check: the LW block is a switch, not a drawn
     block. The Data Worker (v1.0.42) turns the shell's weather strip on
     when an LW block is in the plan and never looks for a DESIGNS row,
     so there is nothing to pick. fitOf() now answers ok for the weather
     block, as it does for an open article slot. The Design column on
     the weather tile was already empty.
   - The greeting tile's state line is the pill alone when ready; the
     sentence after "Ready" is gone (Jeff, 17 Oct). "Missing" keeps the
     missing part's name beside it ("short greeting", "paragraph").
   Companion stylesheet ipp-layout-v1.0.18.css unchanged.

   v1.0.33 (17 Oct 2026, 106 Gap Interview S2 · shadow plan) — THE
   GREETING TILE SAYS "GREETING" AND WHETHER IT IS READY; ONE CHOICE IS
   NOT A DROP-DOWN (ruled by Jeff on WLN-901A, 17 Oct)
   - The greeting tile's title is the word "Greeting". No words from
     the greeting on the tile (v1.0.32 printed the first twelve; ruled
     pointless). Under it, the weather tile's pattern: a fixed green
     "Ready" pill when the paragraph and the short greeting are both
     written, a red "Missing" pill naming the missing part otherwise
     (the title is optional and never counted). HC-P-L33-1: the pill
     words.
   - A design control with exactly ONE live design for the type shows
     that design's name as text, not a select of one. Any kind, not just
     GR. When the block has no design yet and there is only one, the
     Layout fills it in and the tile goes dirty so Save writes it ("set
     on Save"). More than one choice: the select, as before.
   - The Before Publish greeting line is unchanged from v1.0.32.
   Companion stylesheet ipp-layout-v1.0.18.css unchanged (the pill
   reuses .ipp-ly-wxpill; the text reuses .ipp-ly-dtx).

   v1.0.32 (17 Oct 2026, 106 Gap Interview S2 · shadow plan) — A GREETING
   IS ITS WORDS, NOT ITS TITLE
   Seen live on WLN-901A: the Picker saved a paragraph and a short
   greeting, the Layout tile still read "No greeting yet" after a full
   reload. The tile keyed "has a greeting" on the greeting TITLE, which
   is optional by ruling (17 Oct, S1 ruling 2: paragraph and short
   greeting required, title optional). Not stale data: the wrong test.
   - grHas(s): true when the paragraph or the short greeting (or the
     title) holds text. Used by rowTitle, rowTitleEmpty and hasContent.
   - rowTitle for a greeting: the title when there is one, else the short
     greeting, else the first words of the paragraph, else "No greeting
     yet". Cut at GR_TITLE_WORDS words with an ellipsis (HC-P-L32-1).
   - The Before Publish check line shows Title, Short greeting (email)
     and Opening (web) so a missing required part is named.
   - VERSION constant corrected to this file's number (v1.0.31 carried
     '1.0.30', badge read v1.0.30).
   Companion stylesheet ipp-layout-v1.0.18.css unchanged.

   v1.0.31 (16 Oct 2026, Data Worker S2) — THE SWATCH IS THE GROUND
   DESIGNS now carries a swatch per design and ix-issue-data v1.0.58
   passes it on every design choice. Seen live on WLN-888A: the panels
   went near-white, because pairTint (v1.0.28, written for a bold
   bracket stroke) used the swatch as the hairline and 12% of it in
   white as the ground; a pale wash bleaches to nothing that way.
   Now: the ground is the swatch exactly as set in Webflow, the hairline
   is the swatch darkened with a third of the brand teal, the left
   accent and labels stay brand teal (option A). No swatch: the CSS
   default tint (HC-P-L30-1), unchanged. Nothing else changes.
   HARDCODING
     HC-P-L31-1 (provisional) the hairline mix (65% swatch, 35% the
       --ix-teal ink) in pairTint. Platform design token.

   v1.0.30 (16 Oct 2026, IPP Build S19) — the group panel takes the
   teal ground Jeff chose (option A: pale teal wash, teal hairline,
   brand teal accent and labels). CSS only; this file bumps for the
   pairing and its badge. Includes all of v1.0.29.

   v1.0.29 (16 Oct 2026, IPP Build S19) — THE GROUP IS A PANEL
   Jeff on v1.0.28 live: the bars were ugly. Redesigned in the page's
   own language instead of inventing one: a group is a panel, like the
   Before Publish and Preview cards, with a section header on top and
   a footer rule at the bottom.
   · Header (36px): handle · number · AT tag · the name in the page's
     small-caps mono label style · the design dropdown · Remove.
   · Panel: faint warm wash, 1px gold hairline, 3px gold accent down
     the left, 10px inset; the blocks inside keep their tile look.
   · Footer (22px): handle · a hairline · "end · around town" in the
     same label style, right. No controls (Remove is on the header).
   Markup: the opener is .ipp-ly-ghead, the end is .ipp-ly-gfoot, both
   still .ipp-ly-tile with data-ly-row / data-ly-end so drag, keys and
   Remove work as in v1.0.24. Includes all of v1.0.28; pairTint kept.

   v1.0.28 (16 Oct 2026, IPP Build S19) — THE PAIR IS A BRACKET
   Ruled by Jeff on v1.0.27 live (tests 5 and reload passed): the frame
   was too subtle and the teal too stark. The pair now draws as one
   bracket, a big "C": a half-height opener bar on top, a 3px left
   stroke down the side, a half-height end bar at the bottom, the group
   indented inside, all in one soft tint. The opener bar carries the
   handle, number, type tag, name, the design dropdown and Remove on
   one line (34px); the end bar carries the handle, "<name> · end" and
   Remove (26px); together they take one tile's height. The tint is one
   token on the pair (--ly-pair / --ly-pair-bg, soft gold by default);
   when a design choice carries a colour (DESIGNS swatch, not yet a
   field) the bracket takes that colour instead, so the bracket can
   tell one Around Town design from another once the data is there.
   Also: the beige picture box is gone from every block that never
   carries an image (Around Town, The Find, Divider, Spacer, Weather;
   the art slot stays, clear, so titles keep their line). Includes all
   of v1.0.27.
   HARDCODING
     HC-P-L28-1 (provisional) default bracket tint (#C9A84C stroke,
       #FBF6E3 ground) until DESIGNS carries a swatch per design.

   v1.0.27 (16 Oct 2026, IPP Build S19) — NO PHANTOM CHANGE ON LOAD
   Seen on WLN-888A with the catalog flags live: a plan whose opener had
   no saved end mark opened with "1 block changed, not saved" before
   Jeff touched anything. The load rule closes such a group at the
   first non-groupable block (as the render does), and v1.0.26 counted
   that derived closer as a change because no mark is stored there.
   Now the group as read is the baseline: a block is "changed" on its
   mark only when the mark it should carry differs from the one it
   carries OR from the closer the load rule derived. Nothing is written
   until the user moves an end, a block or an opener. Includes all of
   v1.0.26.

   v1.0.26 (15 Oct 2026, IPP Build S19) — THE SAME NUMBER, THE SAME LOOK
   Jeff, on v1.0.25 live: Before Publish said "Pos 1" while the tile
   shows a bare "1", so the two did not read as one thing. Ruled: drop
   the word; the card's lines lead with the number in the tile's own
   mono style (.ipp-ly-n). Nothing else changed; includes all of
   v1.0.25.

   v1.0.25 (15 Oct 2026, IPP Build S19) — NO ADS ON THE ADD ROW
   Ruled by Jeff on v1.0.24 committed: the Add row must not offer
   Banners, and never Sidebar Ads; ads belong to the Revenue tab.
   addable() leaves out every catalog entry whose side is revenue (the
   side comes from IX_CONFIG.catalog, nothing typed here). Add offers
   Around Town, Divider and Spacer. Nothing else changed; includes all
   of v1.0.24.

   v1.0.24 (15 Oct 2026, IPP Build S19, ruled by Jeff at the end of S18)
   — LESS ON THE TILE; AROUND TOWN IS A PAIR; ADD FROM THE CATALOG
   1 · CLEANUP (remove, not add).
       · An empty article tile: no beige picture box (the art slot is
         there but clear), no "Takes any article", no "Design after an
         article". Same 56px head as every other tile; the title still
         starts on the same line.
       · Local Weather never says its state twice. The pill says it;
         the sentence says only the one fact that matters: "Forecast
         opens Nov 8." / "Publish date was Oct 21." / "Set the issue's
         publish date." / "Set the title's weather location." Nothing
         about Compile. (HC-P-M206-15 reworded; the pill labels of
         HC-P-L22-1 unchanged.)
       · The hint sentence under the Layout heading is gone; the
         ⓘ badge carries it.
   2 · A GROUP IS A PAIR (the Default Layout's S18 rule, now here).
       An opener kind (catalog opener: true; Around Town) draws as its
       own tile plus a "<name> · end" tile; the tiles between are its
       group, framed and indented. The end tile is not a row: it is the
       end-group mark on the group's last block (or on the opener when
       the group is empty), drawn where the group ends.
       · Drag the opener and the whole group moves. Drag the end tile
         to grow or shrink the group. Drag a tile between the opener
         and its end and it joins; drag it out and it leaves.
       · Only groupable kinds (catalog groupable: true: articles, ads,
         divider, spacer) may sit inside; a drop of any other kind
         inside is refused with a note (same rule as the Default Layout,
         option 1 of S18, so the render never splits a group silently).
       · On load: the opener takes the blocks after it up to the first
         end-group mark; a group running across a non-groupable block
         closes before it; an opener with no mark closes at the end of
         the list, and an opener's own mark means an empty group.
       · Remove on the opener (or its end tile) takes the opener out on
         Save and clears the mark on its closer; the contents stay. The
         S18 stray-mark bug is gone with it.
       · Save writes the marks through 124's layout op (endGroup), one
         per block whose mark changes, and reads them back.
   3 · ADD A BLOCK. A fixed row under the stack: "Add" and one button
       per catalog kind the Picker does not offer and that is not
       revenue (blocks: true, controller: false, side not revenue;
       perIssue one hidden once the plan has it): Around Town, Divider,
       Spacer. Banners and Sidebar Ads are Revenue's, never offered
       here (ruled 15 Oct). Press one and
       a pending tile appears at the bottom of the stack (gold, "Added
       on Save", its own Cancel); drag it where it goes,
       pick its design. An opener is born as an empty pair. Save
       creates it through 124's create op (slot-key <kind>-<stamp>,
       asset-type, block-type, position, design when picked) and counts
       it as added only when the fresh read has the slot-key. This
       edition only, like Remove.
   4 · Save also no longer needs a design for a new block; Before
       Publish lists it until one is picked, as for any block.
   NOT IN THIS VERSION: group marks are not copied to the other
   editions (order, types and designs still are); a reorder that
   changes a group on 121A leaves 121B's marks as they were.
   HARDCODING
     HC-P-L24-1 (provisional) Control copy: "· end", "Added on Save",
       "Removed on Save" (replaces HC-P-L23-1's "Will be removed when
       you Save", which was cut off on the tile), "Only articles, ads,
       dividers and spacers can sit inside a group", "N blocks added",
       the Add row's "Add".
     HC-P-M206-15 reworded (the weather sentences, section 1).
   Needs Data Worker ix-issue-data v1.0.57 (catalog opener and
   groupable on /plan-board) and Scenario 124 v2.24. On an older
   Worker no kind is an opener, so no frame draws and Add offers the
   same kinds without a pair. Includes all of v1.0.23.

   v1.0.23 (15 Oct 2026, IPP Build S18, ruled by Jeff on WLN-1002A) —
   ANY BLOCK YOU ADD CAN BE REMOVED HERE
   Until now only the weather block had a way out on Layout; Around
   Town, Banners, Sidebar, Divider and Spacer (controller-false kinds,
   born from the Default Layout) could not be removed anywhere once a
   plan had them. Ruled: remove anything, regardless of how it got here.
   1 · Every tile carries a small "Remove" link in its right column,
       next to its Cancel. The weather tile's "Remove weather block"
       becomes the same link. The row turns gold, strikes its title,
       says "Will be removed when you Save" (v1.0.24: "Removed on Save";
       the long line was cut off on the tile), and has its own Cancel.
       Save deletes the NL-BLOCKS row through 124's delete op (the
       v1.0.5 weather contract, now for every block) and counts it as
       removed only when the fresh read no longer has it (TOAST-TRUTH).
       Removal is this edition only, as before.
   2 · Two refusals, said on the tile and in a toast:
         · a block holding content (an article, an ad, a greeting title,
           items in a list) is not removed from here: "Remove its
           content on the Picker first." (same rule as the Picker's
           untick, S16 C7). A block whose content has unsaved edits on
           this tab is not stopped by them; only saved content counts.
         · the Greeting is never removed (S16 C3: always on).
   3 · Tray and note count blocks: "2 blocks removed from this edition."
   HARDCODING
     HC-P-L23-1 (provisional) the three sentences above. Page copy.
   Nothing else changed; includes all of v1.0.22.

   v1.0.22, second part (13 Oct 2026, ruled by Jeff from S16's plan 888
   test) — THE WEATHER TILE'S LINE NEVER TRUNCATES
   The LW tile's second line is wxSay()'s sentence, and the stack's
   one-line rule was cutting it in the centre column. Layout only:
   · The weather tile's sentence wraps to as many lines as it needs
     (.ipp-ly-l2.is-wx, .ipp-ly-s.is-wrap); the tile grows and nothing
     else on the stack changes. Every other tile keeps its one line.
   · The state leads as a fixed-width pill (.ipp-ly-wxpill, 104px, text
     truncates inside the pill, never the sentence): green "Forecast
     ready"; red "Too far ahead", "Date passed", "No date", "No
     location", "Not checked"; grey "Off" (and grey "Not checked" while
     the plan data has no weather answer). Same green and red as the
     tile edge.
   · Red states keep "Remove weather block" as the way out (12 Oct).
   · The title still starts on the same vertical line as every other
     tile's title (.ipp-ly-tile.is-wx .ipp-ly-grid1 pads instead of
     centring). Checked in Chromium at 480px and 620px stack widths.
   HARDCODING
     HC-P-M206-15 (the seven sentences) unchanged.
     HC-P-L22-1 (provisional) the pill labels above. Platform copy.

   v1.0.22 (13 Oct 2026, Allocator RE Events · 5, step 2) — A DESIGN THAT
   FOLLOWS THE COUNT IS NOT CHOSEN HERE
   Spec Allocator-RE-Events v1.13 §7.4: a list block's design is set by
   the Picker from how many items it holds (one DESIGNS row per count).
   When every design offered for a block's type carries an item count
   (board.designChoices[].itemCount, Data Worker v1.0.53), the tile shows
   the design as text, "EV · 4 · from the count", with no dropdown. A
   stored design that does not match the item count is not flagged here;
   Publish's "Design matches the count" tile does that. Types with
   count-free designs (FA, TS, LBP…) keep their dropdown. Nothing else
   changed; includes all of v1.0.21.

   v1.0.21 (13 Oct 2026) — THE PREVIEW SHOWS ON FIRST OPEN
     Seen by Jeff on WLN-998B: on several page loads the preview said
     "Made <time>" with both panes blank, until a Save. The page opens
     on the Picker, so Layout is hidden when the plan is read; Layout
     still made the preview then (v1.0.12, once per plan) and sized each
     page against a box 0 px wide: scale went negative and the height 0.
     Nothing measured again when Layout was opened.
     1 · A pane is never sized while its box has no width; it waits.
     2 · Layout watches its own canvas, so the moment it is shown (or
         resized) every pane is measured again. The cause: v1.0.12 set
         that watch up only on the first paint that drew the preview
         box, but the first paint ends early ("Reading the plan"), so the
         watch was never set up at all. It is now set up on every paint
         (once; later calls do nothing).

   v1.0.20 (13 Oct 2026) — A BLOCK TAKES ITS ARTICLE'S TYPE
     Ruled by Jeff 13 Oct (mockup inbxify-picker-slot-type-mockup-v0_1,
     changes 4 and 5 accepted). Pairs ipp-picker v1.34. No new hardcoding.
     1 · AN EMPTY ARTICLE BLOCK IS OPEN. Its tag reads "Open", it has no
         design dropdown ("Design after an article"), and Before Publish
         does not list it. Whatever type a block saved before 13 Oct
         keeps is ignored while it is empty.
     2 · A BLOCK FOLLOWS ITS ARTICLE. When the article's Section type
         differs from the block's saved type (the Section was changed on
         the Article form after the article was placed), the block shows
         the article's type at once, waiting for Save (gold). If its
         saved design is not one of that type's designs, the design is
         dropped and the dropdown asks for one. The line under the
         headline says what happened. Save writes the type (124 layout)
         and the chosen design (124 fill), or clears the old design
         (124 clear) when none is chosen yet, so Save is never blocked
         by it. Cancel cannot undo the follow; it undoes your own edits.
         Locked plans follow nothing.
     3 · NO TYPE DROPDOWN. The v1.0.16 stopgap (type an untyped article
         block here) is retired: the type comes from the Section, set on
         the Article form. An article with no Section says "Set its
         Section on the Article form".

   v1.0.19 (Controls parity, 12 Oct 2026) — TYPE FROM THE SECTION ONLY
     Ruled by Jeff: the article's type always comes from its Section; the
     ARTICLES block-type field is deleted. Needs Data Worker v1.0.49.
     1 · The article's type is its Section's (typeCheck.article, else
         asset.sectionType). Nothing reads an own type.
     2 · The opened tile says "No Section yet" when the article has no
         Section (or its Section has no type), instead of "The Picker
         decides".
     3 · Before Publish says "pick an FA design", not "a FA design".

   v1.0.18 (12 Oct 2026) — the version badge read v1.0.16 in v1.0.17
     (the VERSION constant was not bumped). Badge fixed. No other change.

   v1.0.17 (Controls parity · S2 step 7, 12 Oct 2026) — ARTICLE TYPE SHOWN
     Needs Data Worker ix-issue-data v1.0.48 (slot.asset.type,
     slot.asset.sectionType, slot.typeCheck). Older boards: nothing new
     shows, nothing breaks.
     The article's type is its own, else its Section's (ruled 12 Oct: the
     Section carries the type). Compared with the block's type as it
     stands on the page, so a stopgap choice is checked before Save.
     1 · MISMATCH: the type tag turns salmon, and Before Publish lists it:
         "<headline> is a TS article in an FA block. Move it to a TS
         block on the Picker." Layout still never changes a saved type.
     2 · The opened tile names the article's type, in salmon when it
         disagrees with the block.
     3 · The v1.0.16 stopgap (type an untyped block once) now offers only
         the article's own type when it has one, so it cannot create a
         mismatch. An untyped article still gets FA, TS and LBP.
     An article with no type and no Section is not flagged: the Picker
     decides it (ruled 12 Oct).

   v1.0.16 (Controls parity, 12 Oct 2026) — STOPGAP: TYPE AN UNTYPED BLOCK ONCE
     v1.0.15 removed the type control. But article blocks are still
     created with no type (Scenario 126 for a new plan, the Picker's Add),
     and Layout was the only place that typed them, so a new plan's
     article blocks could not get a type anywhere (Controls Parity
     Scoping v0.3, §4a).
     1 · An article block that has NO saved type shows a type dropdown
         (FA, TS, LBP from IX_CONFIG layout.articleTypes). Choose one, then
         a design, then Save. Gold with Cancel until saved, as before.
     2 · Once a type is saved it is a plain tag and can never be changed
         here. FA can still never become TS or LBP on Layout.
     3 · Retires when the Picker takes the type from the article's
         franchise (Controls Parity session 2).

   v1.0.15 (Controls parity, 12 Oct 2026) — NO TYPE CHANGE ON LAYOUT
     Ruled by Jeff: Layout must not change a block from FA to TS to LBP.
     What an article is gets decided at article create where it can, and
     for certain on the Picker, which writes it back to the article. By
     Layout the type is settled; only the design (centered, left, right)
     is chosen here.
     1 · The type dropdown on article tiles is gone. The type is a plain
         tag on every tile, as on every other block.
     2 · The design dropdown still offers only the designs made for the
         block's type.
     3 · A block with no type shows "?" in salmon and "Pick a type" in
         the design column, and Before Publish lists it. The fix is on
         the Picker, not here.
     setType stays in the code for Save's read-back, but nothing on the
     page calls it.

   v1.0.14 (Layout Preview · S2, 12 Oct 2026) — BEFORE PUBLISH ONLY WHEN NEEDED
     Ruled by Jeff: show Before Publish only if something needs fixing.
     1 · Every block fits and no heads-up: no card. Preview takes the
         whole right column. The rail's fit / total (12/12) still says
         all is well.
     2 · A block to fix: the salmon card, as before, with any heads-up
         under it.
     3 · Only a heads-up (e.g. a banner above the Greeting): a small grey
         card. A heads-up is a note, never a fix.

   v1.0.13 (Layout Preview · S2, 12 Oct 2026) — CLICK OFF A TILE
     Jeff, on v1.0.12 live: clicking off an open tile must put the page
     back to its default. Before, only the tile itself, Esc, or the thin
     gaps between tiles closed it.
     1 · A click anywhere outside the open tile closes it: Before
         Publish, the preview pages, the tray, the left rail, the page
         head. Clicking another tile still opens that one. Choosing in
         another tile's dropdown leaves it open (closing would redraw the
         dropdown mid-choice).
     2 · Two places keep it open, because they work on it: the Preview
         button and the Email / Even / Web switch (the open tile stays
         shaded in the new preview).
     Closing only folds the tile. Changes waiting for Save stay gold.

   v1.0.12 (Layout Preview · S2, 12 Oct 2026) — PREVIEW
     The right column now shows the issue as Compile will make it, email
     and web side by side, under Before Publish. Ruled earlier: "Preview"
     in Layout saves nothing; "Compile" in Publish is the final, saved
     version.
     1 · PREVIEW. Calls the Data Worker's GET /preview (ix-issue-data
         v1.0.47+, address PP_WEBHOOKS.preview, else planBoard with
         /plan-board changed to /preview). It assembles with the same code
         Compile uses and renders both pages through newsletter-render
         (v1.19.0+); nothing is written. Runs once when a plan opens, and
         again whenever you press Preview.
     2 · EMAIL / EVEN / WEB. Show the email page alone, both, or the web
         page alone. Each page is drawn at its real width (email 640,
         web 1100) and scaled to fit; the email shows its size in KB.
     3 · BEHIND? A gold note says when the preview no longer matches:
         unsaved changes ("the preview shows the saved layout; Save, then
         Preview"), or a Save since the preview was made.
     4 · THE OPEN TILE IS SHADED in both pages, salmon, and each page
         scrolls to it. The block is found by the markers newsletter-render
         puts around each block for Preview only. If the block is not in
         the preview, a line says why (Compile leaves it out, with the
         reason; or it has unsaved changes).
     Errors are said in plain words in the note; nothing else on the tab
     waits for the preview.
     HARDCODING
       HC-P-PV-1  Preview page widths (email 640, web 1100). Page layout.
       HC-P-PV-2  Preview note and button wording. Page copy.

   v1.0.11 (Layout tiles · S1, 12 Oct 2026) — FIXED ICONS, OPTION B
     Jeff picked option B from frame 7 of the canvas ("Fixed icons:
     three levels of ceremony"): each kind's pale ground, a faint
     pattern of its own, and the icon on a small white disc.
       Greeting      speech bubble, warm sand, arcs      (new)
       Events        calendar, sage, hatching
       Real Estate   house, soft lavender, dots
     The Greeting's art slot is no longer empty. The hues stay clear of
     gold (unsaved), salmon (needs you), teal (EC) and the banners'
     blue-grey.
     HARDCODING
       HC-P-LT-3 (widened)  The icon and its ground per kind: greeting
                  (block GR), event and re (list asset types). Page
                  artwork; the colours and patterns live in the CSS.

   v1.0.10 (Layout tiles · S1, 12 Oct 2026) — LAYOUT ON THE TILE,
   CONTENT IN THE OPENED TILE
     Jeff, on v1.0.9: the opened tile was out of proportion and mixed
     two jobs. Ruled:
     1 · Type and design are chosen on the tile itself, in its right
         column, without opening anything. Articles carry a type
         dropdown on the tag (FA, TS, LBP); every block carries a design
         dropdown. A dropdown you changed keeps its new value and a gold
         border until Save or Cancel; a small Cancel sits under it.
     2 · Up and Down are gone. Move a tile by dragging its handle, or
         with Arrow Up / Arrow Down on the handle.
     3 · Opening a tile shows only the content, for checking it:
           Event     picture, name, date and start (and end) time,
                     venue, the first words of the description, link.
           Listing   picture, address, price, beds / baths / sq ft,
                     agent and brokerage, first words, link.
           Article   picture, headline, byline, the first words of the
                     summary.
           Banner    the banner itself at full width, and its link.
           Greeting  the title and the first words of the paragraph.
           Weather   the forecast state (Remove weather block stays on
                     the tile's right column).
         Anything missing that the email needs is named in salmon
         ("No date", "No picture", "No link").
     Needs Data Worker ix-issue-data v1.0.46 for the event, listing and
     article facts; on v1.0.45 the opened tile shows names and pictures.
     HARDCODING
       HC-P-LT-5  The review fields per kind and their "No ..." wording.
                  Page copy.

   v1.0.9 (Layout tiles · S1, 12 Oct 2026) — LIST TILES
     Jeff, on v1.0.8 live: the Events tile stays "Events" (the
     "Events Calendar" requirement is withdrawn). List tiles say what
     they are and how many, and show their contents when opened.
     1 · Events and Real Estate tiles show a fixed icon in the art
         slot: a calendar for events, a house for listings. The first
         item's picture is no longer used there.
     2 · The line under the title is "N items" for every list block
         (was "1 event", "3 listings"). HC-P-LT-1 is retired.
     3 · Opening a list tile shows its items, one line each: picture,
         name and, for events, the start date. Read only; the Picker
         still chooses what is in the block.
     HARDCODING
       HC-P-LT-3  The icon per list asset type (event = calendar,
                  re = house). Page artwork, keyed by asset type.
       HC-P-LT-4  Event dates show in the browser's time zone; the
                  board does not carry title-timezone yet.

   v1.0.8 (Layout tiles · S1, 12 Oct 2026) — THE TILE REDESIGN
     Built from frame 6 v3 of the canvas "PubPlan Layout tab · S12
     mockup", accepted by Jeff on 12 Oct. Needs Data Worker
     ix-issue-data v1.0.45 (asset.ec, asset.writer, items[].thumb,
     slots[].inside). On v1.0.44 the tiles still draw; the EC badge,
     list art and the inside-ad strip are simply absent.
     1 · EACH BLOCK IS A TILE. Handle, position, type tag, art in a
         fixed 72 x 40 slot (banners 72 x 18), then the title line and
         one line under it. Every tile has the same art slot and the
         same 24px badge slot, so every title starts on one vertical
         line (the alignment rule).
     2 · THE TITLE LINE NAMES THE BLOCK, NEVER ITS KIND. The kind is
         the type tag only. Ruled 12 Oct:
           Article   the headline
           Banner    the customer, in italic
           Greeting  the greeting's own title
           Lists     the section's name (WLN: "On the Market"), else the
                     catalog entry's name. The count goes on the line
                     under it: "1 event", "3 listings".
           Weather and other fixed blocks: the catalog entry's name.
     3 · THE LINE UNDER IT: the EC badge (filled teal, articles whose
         business is an Expert Contributor), the byline (writer and
         business; the banner's file name; the count), the franchise
         (articles) and the design.
     4 · BANNER TILES have a light blue-grey ground, so the ads show at
         a glance. Gold stays "changed, not saved"; salmon stays "needs
         you".
     5 · THE AD INSIDE AN ARTICLE gets a strip under the tile:
         "Paid ad inside this article · <customer>" or "Sponsored by ·
         <customer>", with the banner's art. A paid ad 206 will leave
         out (no active banner with a link) says so.
     6 · TILES OPEN IN PLACE. Click a tile to open it: Move (Up, Down,
         or drag the handle), Type (articles), Design, and a small
         Cancel when it has changes. Click it again, press Esc or click
         empty space to close. The side panel is gone; the right column
         keeps Before Publish. Preview arrives in S2.
     7 · A changed tile keeps its gold border and a small Cancel link on
         its title line while closed, so every edit can be undone
         without opening it. Cancel all stays in the tray.
     Save, editions, weather and Before Publish behave exactly as
     v1.0.7.
   HARDCODING
     HC-P-LT-1  Count nouns per asset type (event/events, listing/
                listings, ad/ads, item/items). Page copy.
     HC-P-LT-2  Inside-ad strip wording. Page copy.

   v1.0.7 (Modular 206 S3, 12 Oct 2026) — EDITIONS READ FROM THE PLAN AGAIN
     Seen on WLN-998B: "Other editions could not be read (Failed to
     fetch). Save changes this edition only."
     Cause: v1.0.3 reads GET /editions, but no Data Worker in the repo
     has that route. The version that added it was numbered v1.0.37, and
     the Assembler port's v1.0.37 took the same number; every Worker since
     is built on the Assembler line, which still answers editions inside
     /plan-board. So since v1.0.3 Layout has never read the other
     editions, and Save has changed this edition only.
     1 · Layout takes the editions from the plan read it already has
         (/plan-board editions, Data Worker v1.0.36+). No extra call.
     2 · Only when the plan read has no editions list does it still try
         GET /editions, as before.
     Nothing else changed.

   v1.0.6 (Modular 206 S3, 12 Oct 2026) — EVERY BLOCK MOVES
     Ruled by Jeff after the Picker/Revenue/Layout audit: locking was too
     early. On WLN-998B the Lead banner sat above the Greeting and both
     were pinned, so nothing could fix it.
     1 · The three locks are gone: the Greeting is no longer pinned
         first, the Lead is no longer pinned, and a banner may go above
         the Lead. Every block can be dragged or moved with the arrow
         keys. Only a locked plan, or a weather block waiting to be
         removed, stays still.
     2 · THE LEAD IS WHATEVER BANNER IS FIRST (ruled: "whatever's in the
         BA1 position"). The row label follows the order on screen, so
         moving a banner above the Lead makes it "Lead banner" at once.
         Revenue and web rotation already treat the first banner as the
         Lead, so they agree after Save.
     3 · HEADS UP in Before Publish: "A banner is above the Greeting."
         It names the rows and lets you click to them. It is a note, not
         a fix: it does not count in fit / total, does not light the
         tab's dot, and never stops Save or Compile.
     HARDCODING
       HC-P-S12-3 (narrowed)  'GR' still names the Greeting; the Lead
                  rule is now "first block whose asset type is 'ad'".
       HC-P-M206-17  Heads-up wording. Page copy.

   v1.0.5 (Modular 206 S3, 12 Oct 2026) — THE WEATHER BLOCK
     Needs Data Worker ix-issue-data v1.0.42 (the LW block switches the
     weather strip on; /plan-board weather and newsletters[].weather).
     1 · THE LW ROW SHOWS THE FORECAST STATE, from the same answer Compile
         will get (the board asks newsletter-render's weather rule):
           ready     green edge: "Forecast ready from Oct 21."
           too far   red: names the day the forecast opens. Compile still
                     runs and leaves the strip out (warn and allow).
           past      red: the publish date has passed. Compile is
                     blocked while the block is in.
           no date / no place / could not check   red, with the reason.
         Red is the same red as Publish's check tiles.
     2 · REMOVE WEATHER BLOCK. A small link on the LW row and in its
         panel. The row turns gold, says it will be removed, and has its
         own Cancel. Save deletes the NL-BLOCKS row through Scenario 124
         (delete { id }, the Picker's Remove slot contract). Removal is
         this edition only; Save says so when there are other editions.
         Green only from the read (TOAST-TRUTH): the block counts as
         removed when the fresh plan read no longer has it.
     HARDCODING
       HC-P-M206-15  Weather wording on the LW row and panel. Page copy.

   v1.0.4 (IPP Build S12, 11 Oct 2026) — THE STORED POSITION ON EACH ROW
     Asked by Jeff: show the NL-BLOCKS position on the row, so Layout's
     1 to N can be matched to the CMS. Each row now shows "Position 11"
     in small type in the middle of the row, in a fixed-width spot. It is
     the saved value: a block moved but not yet saved still shows its old
     number until Save writes the new one. Whole numbers show without a
     decimal; 3.5 shows as 3.5. When the stack is narrow (under 760px),
     the label moves onto the line under the title, so the title keeps
     its room.

   v1.0.3 (IPP Build S12, 11 Oct 2026) — EDITIONS FROM THEIR OWN ROUTE
     Data Worker v1.0.37 moved the other editions out of /plan-board (the
     plan read went over Cloudflare's call limit) into GET /editions.
     Layout now reads /editions itself: when the plan loads, and fresh
     after every Save. The address is PP_WEBHOOKS.editions, else the
     planBoard address with /plan-board changed to /editions (the way
     Publish finds /link-check). No page change needed.
     While it reads, the tray says so and Save waits. If it cannot be
     read, the tray says Save will change this edition only, in plain
     words, before you press it.

   v1.0.2 (IPP Build S12, 11 Oct 2026) — ONE SAVE, AND ONLY ON LAYOUT
     Live on WLN-998B (v1.0.1): Layout's tray showed its own "Save 2
     changes" and, at the far right, a second, dormant Save. That was the
     Picker's Save. The Picker puts its Save into the first tray it finds
     with the class ipp-savebar; once Layout's tray carried that class,
     the Picker found it and moved in. Also, leaving Layout for Publish
     brought the shared tray back on Publish, where the shell hides it.
     1 · Layout's tray no longer carries the class ipp-savebar. It is
         .ipp-ly-bar, styled by ipp-layout-v1.0.1.css, so no other module
         can find it or write into it.
     2 · While Layout is open every ipp-savebar is hidden. Leaving Layout
         hands each one back as it was: the shell decides for the trays it
         looks after (shown on Picker, hidden on Revenue and Publish).

   v1.0.1 (IPP Build S12, 11 Oct 2026) — THE TRAY IS LAYOUT'S OWN
     Live on WLN-998B: a move turned the block gold, but the bottom tray
     still said "No unsaved changes" and Save stayed off. The page has
     one shared tray outside the views, and it carries the Picker's Save.
     v1.0.0 drew Layout's tray inside the Layout view, under the shared
     one, so the Picker's tray was the one on screen.
     Now Layout keeps its own tray (.ipp-savebar.ipp-ly-bar) in its view
     and, while Layout is open, hides every other tray. Leaving Layout
     shows them again. One save concept per screen, as ruled.
     Nothing else changed.

   v1.0.0 (IPP Build S12, 11 Oct 2026) — FIRST BUILD
     Built from the canvas "PubPlan Layout tab · S12 mockup", proposal B
     (accepted 11 Oct): a compact stack of the issue's blocks, with type
     and design set in a side panel.
     1 · THE STACK. Every block of the plan below the loose rows, top of
         the email first: position, type, what is in it, its design.
         Drag a block by its handle to move it; its content and design
         move with it. The handle also takes Arrow Up / Arrow Down.
         The Greeting stays first. A banner spot never goes above the
         Lead banner (the first ad block), and the Lead does not move.
     2 · THE PANEL. Click a block. Article blocks pick their type from
         /plan-board layout.articleTypes (IX_CONFIG, e.g. FA, TS, LBP).
         Every block picks its design from designChoices[<type>]: only
         the designs made for that type (the title's own first). A type
         change clears the design unless the type has exactly one.
     3 · BEFORE PUBLISH. Lists every block with no type, no design, or a
         design not made for its type. The Layout tab on the rail shows
         fit / total and a salmon dot while anything is open. Publish's
         "Designs fit" tile reads the same facts.
     4 · EDITING STATE. A changed block has the gold border and a small
         Cancel (puts its type, design and place back). The shared tray
         holds "Save N changes" and Cancel all. Nothing is written
         before Save.
     5 · SAVE, through Scenario 124 v2.20 (PP_WEBHOOKS.blockWriter):
           reorder  { id, position }        position read back
           layout   { id, blockTypeJson, endGroup, blockTextJson }
                    block-type read back. end-group and block-text are
                    sent as they are, because 124 rewrites all three.
           fill     { id, assetField: blockFields.design, assetId }
                    design read back.
         Positions: a moved block takes a number between its new
         neighbours (one decimal place, the field's precision), so one
         move is one write. When there is no room, the blocks are
         renumbered 1, 2, 3 ... and only those whose number changes are
         written. Positions stay below loosePositionFrom.
         Then the plan is read fresh (TOAST-TRUTH): a change counts as
         saved only when the fresh read shows it. Anything that did not
         land stays gold with "Not saved: <why>".
     6 · EDITIONS (ruled 11 Oct). Save also applies the change to every
         open edition of the same issue (/plan-board editions, Data
         Worker v1.0.36): the order, types and designs of articles and
         sections. Banner spots belong to each edition and are never
         copied. Blocks are matched by slot-key. A locked edition is
         left alone and named. The other edition's shared blocks take
         the new order among the places they already hold, so its own
         banner spots stay where they are.
     7 · A locked plan shows the stack read-only.
   HARDCODING (provisional ids, for the doc-maintenance chat)
     HC-P-S12-3  'GR' is the Greeting's block label (same as the
                 Picker); the Lead banner is the first block whose asset
                 type is 'ad' (same rule as Revenue).
     HC-P-S12-4  Page copy: panel, tray, Before Publish lines.
     HC-P-S12-5  Edition rule: asset type 'ad' blocks are never copied
                 to other editions; everything else is matched by
                 slot-key.
   Needs on the page: ipp-shell v1.15+, ix-tokens, ix-buttons,
   ix-form-controls v1.1.0, ix-info, ix-success-toast. Data Worker
   ix-issue-data v1.0.36 with IX_CONFIG.layout.articleTypes. Writes:
   Scenario 124 v2.20 (PP_WEBHOOKS.blockWriter).
   ============================================================ */
(function () {
  'use strict';
  var VERSION = '1.0.36', FILE = 'ipp-layout-v1.0.36.js';
  var GR = 'GR';                       // HC-P-S12-3
  var AD = 'ad';                       // HC-P-S12-3 / HC-P-S12-5
  var BATCH_URL_CEILING = 7000, BATCH_CHUNK = 20;

  // ── state ─────────────────────────────────────────────────
  var BOARD = null, LOCKED = false, ERR = '';
  var ROWS = {};          // id -> slot (from the board)
  var ORIG = null;        // { order:[ids], type:{id:label}, design:{id:designId}, pos:{id:number} }
  var CUR = null;         // { order:[ids], type:{}, design:{} }
  var SEL = '';           // the open tile's block id
  var FAILS = {};         // id -> why (last save)
  var SAVING = false;
  var NOTE = '';          // line under the stack after a save
  var DRAG = null;
  var TOUCHED = {};        // blocks you moved by hand (tie-break for which block counts as moved)
  var REMOVE = {};         // v1.0.5: id -> 1, a block waiting to be deleted on Save (v1.0.23: any block)
  var NEW = {};            // v1.0.24: tempId -> catalog entry, a block waiting to be created on Save
  var NEW_N = 0;

  // ── small helpers ─────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function plural(n, w) { return n + ' ' + (n === 1 ? w[0] : w[1]); }
  function r1(x) { return Math.round(x * 10) / 10; }
  function view() { return document.querySelector('.ipp-view[data-view="layout"]'); }
  function canvas() { var v = view(); return v && v.querySelector('.ipp-canvas'); }
  function blockWriter() { return String((window.PP_WEBHOOKS || {}).blockWriter || ''); }
  function toast(msg, kind, detail) {
    if (window.IxToast && typeof IxToast.show === 'function') IxToast.show(msg, kind, detail ? { detail: detail, key: 'ipp-layout' } : { key: 'ipp-layout' });
    else if (window.IPP && IPP.toast) IPP.toast(msg + (detail ? ' ' + detail : ''), kind === 'err');
  }
  function posText(n) { var v = Number(n); return isNaN(v) ? '?' : (v % 1 === 0 ? String(v) : String(r1(v))); }
  function looseFrom() { var n = Number(BOARD && BOARD.loosePositionFrom); return n > 0 ? n : 900; }
  function choices(label) { return (BOARD && BOARD.designChoices && BOARD.designChoices[label]) || []; }
  function articleTypes() { return (BOARD && BOARD.layout && BOARD.layout.articleTypes) || []; }
  function typeHash(label) { return (BOARD && BOARD.writeIds && BOARD.writeIds.blockType && BOARD.writeIds.blockType[label]) || ''; }
  function designField() { return (BOARD && BOARD.blockFields && BOARD.blockFields.design) || ''; }
  function designName(id, slot) {
    if (!id) return '';
    var all = (BOARD && BOARD.designChoices) || {};
    for (var k in all) if (own(all, k)) for (var i = 0; i < all[k].length; i++) if (all[k][i].id === id) return all[k][i].name;
    if (slot && slot.design === id && slot.designInfo && slot.designInfo.name) return slot.designInfo.name;
    return 'a design not offered here';
  }

  // ── what kind of block ────────────────────────────────────
  function isGreeting(s) { return s && s.blockType === GR; }
  // v1.0.5 — the weather block (its type comes from the board, HC-P-M206-14)
  function wxLabel() { return String((BOARD && BOARD.weather && BOARD.weather.label) || 'LW').toUpperCase(); }
  function isWeather(s) { return !!s && String(s.blockLabel || s.blockType || '').toUpperCase() === wxLabel(); }
  function wxState() {
    var ns = (BOARD && BOARD.publish && BOARD.publish.newsletters) || [];
    for (var i = 0; i < ns.length; i++) if (ns[i] && ns[i].weather) return ns[i].weather;
    return null;
  }
  function wxDay(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : String(iso || '');
  }
  // { tone: 'ok' | 'bad' | 'wait', text } — HC-P-M206-15
  function wxSay() {
    var w = wxState();
    if (!w) return { tone: 'wait', pill: 'Not checked', text: 'Weather: the forecast state is not known yet (needs Data Worker v1.0.42).' };
    switch (w.state) {
      // v1.0.24 — the pill says the state; the sentence says only the one fact that matters (never the state again, never Compile)
      case 'ready':    return { tone: 'ok', pill: 'Forecast ready', text: 'For ' + wxDay(w.date) + '.' };
      case 'too-far':  return { tone: 'bad', pill: 'Too far ahead', text: 'Forecast opens ' + wxDay(w.availableOn) + '.' };
      case 'past':     return { tone: 'bad', pill: 'Date passed', text: 'Publish date was ' + wxDay(w.date) + '.' };
      case 'no-date':  return { tone: 'bad', pill: 'No date', text: 'Set the issue\u2019s publish date.' };
      case 'no-place': return { tone: 'bad', pill: 'No location', text: 'Set the title\u2019s weather location.' };
      case 'off':      return { tone: 'wait', pill: 'Off', text: '' };
      default:         return { tone: 'bad', pill: 'Not checked', text: (w.error ? String(w.error) : 'The forecast could not be checked') + '.' };
    }
  }
  function leadId() {
    if (!CUR) return '';
    for (var i = 0; i < CUR.order.length; i++) { var s = ROWS[CUR.order[i]]; if (s && s.assetType === AD) return s.id; }
    return '';
  }
  function origLeadId() {
    if (!ORIG) return '';
    for (var i = 0; i < ORIG.order.length; i++) { var s = ROWS[ORIG.order[i]]; if (s && s.assetType === AD) return s.id; }
    return '';
  }
  function pinned(id) { var s = ROWS[id]; return !s || !!REMOVE[id]; }   // v1.0.6: no block is locked in place
  // v1.0.24 — pairs: an opener kind and what may sit inside one (catalog opener / groupable, Data Worker v1.0.57)
  function isOpener(s) { var e = catEntry(s); return !!(e && e.opener === true); }
  function isGroupable(s) { var e = catEntry(s); return !!(e && e.groupable === true); }
  function isNew(id) { return own(NEW, id); }
  function isArticle(s) { return s && s.assetType === 'article'; }
  // v1.0.20 — an article block with no article is open; a typed article sets its block's type
  function isOpenArt(s) { return isArticle(s) && !s.asset; }
  var FOLLOW = {};                                    // id -> { type, design, from }: the block follows its article
  function base(id) { return FOLLOW[id] || { type: ORIG.type[id], design: ORIG.design[id] }; }
  function fitsType(did, label) { var l = choices(label); for (var i = 0; i < l.length; i++) if (l[i].id === did) return true; return false; }
  // v1.0.8 — the catalog entry a block belongs to (IX_CONFIG.catalog via /plan-board)
  function catEntry(s) {
    var cat = (BOARD && BOARD.catalog) || [], l = String((s && (s.blockType || s.blockLabel)) || '');
    if (s && s.isNew && s.catalogKey) { for (var n = 0; n < cat.length; n++) if (cat[n].key === s.catalogKey) return cat[n]; }   // v1.0.24
    for (var i = 0; i < cat.length; i++) if ((cat[i].labels || []).indexOf(l) >= 0) return cat[i];
    // v1.0.24 — a block with no label (an empty article) belongs to the entry whose add is '' for its asset type (the Worker's own rule)
    if (!l && s && s.assetType) for (var j = 0; j < cat.length; j++) if (cat[j].blocks && cat[j].add === '' && cat[j].assetType === s.assetType) return cat[j];
    return null;
  }
  function isList(s) { return !!s && (s.listCount != null || !!s.list); }
  function isBanner(s) { return !!s && s.assetType === AD; }
  // The title line names the block, never its kind (ruled 12 Oct).
  // v1.0.32 — a greeting exists when any of its parts holds words; the
  // title is optional (ruled 17 Oct). HC-P-L32-1: the words shown.
  var GR_TITLE_WORDS = 12;
  function grText(v) { return String(v == null ? '' : v).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
  function grHas(s) { var g = (s && s.greeting) || {}; return !!(grText(g.paragraph) || grText(g.supershort) || grText(g.title)); }
  function grLabel(s) {
    var g = (s && s.greeting) || {};
    var t = grText(g.title); if (t) return t;
    var w = (grText(g.supershort) || grText(g.paragraph)).split(' ').filter(Boolean);
    return w.length ? w.slice(0, GR_TITLE_WORDS).join(' ') + (w.length > GR_TITLE_WORDS ? '\u2026' : '') : '';
  }
  // v1.0.33 — the greeting tile's state, the weather tile's way. HC-P-L33-1.
  function grSay(s) {
    var g = (s && s.greeting) || {}, miss = [];
    if (!grText(g.title)) miss.push('title');                                   // v1.0.35: required (S2 ruling 1)
    if (!grText(g.supershort)) miss.push('short greeting');
    if (!grText(g.paragraph)) miss.push('paragraph');
    if (!miss.length) return { tone: 'ok', pill: 'Ready', text: '' };                       // v1.0.34: the pill alone
    return { tone: 'bad', pill: 'Missing', text: miss.join(' + ') };          // the pill is 104px wide; the part named beside it
  }
  function rowTitle(s) {
    if (isGreeting(s)) return 'Greeting';   // v1.0.33: the word, never the words
    if (isBanner(s)) return (s.asset && (s.asset.customer || s.asset.name)) || 'No ad yet';
    if (isArticle(s)) return (s.asset && s.asset.name) || 'No article yet';
    if (isList(s)) return (s.section && s.section.name) || ((catEntry(s) || {}).name) || s.blockType || 'List';
    var e = catEntry(s);
    return (e && e.name) || (s.section && s.section.name) || s.blockType || 'Block';
  }
  function rowTitleEmpty(s) {
    return (isBanner(s) && !s.asset) || (isArticle(s) && !s.asset);   // v1.0.33: the greeting title is always the word
  }
  function rowSub(s) {
    if (REMOVE[s.id]) return 'Removed on Save.';                                    // v1.0.24: shortened (was "Will be removed when you Save."), it was cut off
    if (isNew(s.id)) return 'Added on Save.';                                       // v1.0.24
    if (isWeather(s)) return wxSay().text;
    if (isGreeting(s)) { var gs = grSay(s); return gs.tone === 'ok' ? (grText((s.greeting || {}).title) || '') : 'Missing: ' + gs.text; }   // v1.0.35: the Greeting Title after the word, or what is missing
    if (isBanner(s)) return '';   // v1.0.36: the picture says it; the file name is in the open panel
    if (isList(s)) return plural(Number(s.listCount) || 0, ['item', 'items']);   // v1.0.9
    if (isArticle(s)) {
      if (!s.asset) return '';                                                            // v1.0.24: nothing (was "Takes any article")
      if (FOLLOW[s.id] && !FAILS[s.id]) return 'Now ' + FOLLOW[s.id].type + ', from its Section';
      var bits = [];                                                                        // v1.0.35: the kind of block and its section, not the byline (that is in the open panel)
      if (CUR && CUR.type[s.id]) bits.push(CUR.type[s.id]);
      if (s.section && s.section.name) bits.push(s.section.name);
      if (s.asset.ec) bits.push('EC');
      return bits.join(' \u00b7 ');
    }
    return '';
  }
  // v1.0.9 — HC-P-LT-3: the fixed icon for a list block, by asset type
  var ICONS = {
    event: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 16.8h2M11 16.8h2"/></svg>',
    re: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/></svg>',
    greeting: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 20 17h-9l-4.5 3.5V17H4a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 4 5.5z"/><path d="M7.5 10.5h9M7.5 13.5h6"/></svg>'
  };
  // v1.0.11 — which fixed icon a block takes ('' = its own picture)
  function iconKey(s) { return isGreeting(s) ? 'greeting' : (isList(s) && ICONS[s.assetType] ? s.assetType : ''); }
  function iconOf(s) { var k = iconKey(s); return k ? '<span class="ipp-ly-disc">' + ICONS[k] + '</span>' : ''; }
  function artUrl(s) {
    if (s.asset && s.asset.thumb) return s.asset.thumb;
    var it = (s.items || []).filter(function (x) { return x && x.thumb; })[0];
    return it ? it.thumb : '';
  }
  // HC-P-LT-2
  function insideText(x) {
    var who = x.customer || 'a customer with no name';
    if (x.kind === 'paid') return 'Paid ad inside this article \u00b7 ' + who + (x.prints ? '' : ' \u00b7 not printing: no active banner with a link');
    return 'Sponsored by \u00b7 ' + who;
  }

  // ── fit checks ────────────────────────────────────────────
  function fitOf(id) {
    if (isOpenArt(ROWS[id])) return { ok: true };       // v1.0.20
    if (isWeather(ROWS[id])) return { ok: true };       // v1.0.34: a switch, not a drawn block; no DESIGNS row exists or is needed
    var t = CUR.type[id], d = CUR.design[id];
    if (!t) return { ok: false, why: 'no-type' };
    if (!d) return { ok: false, why: 'no-design' };
    var list = choices(t);
    for (var i = 0; i < list.length; i++) if (list[i].id === d) return { ok: true };
    return { ok: false, why: 'mismatch' };
  }
  // v1.0.17 — the article's type: its own, else its Section's
  function artType(s) {
    if (!isArticle(s) || !s.asset || s.asset.missing) return '';
    if (s.typeCheck && s.typeCheck.article) return String(s.typeCheck.article).toUpperCase();
    return String(s.asset.sectionType || '').toUpperCase();                  // v1.0.19: the Section only
  }
  function aOrAn(l) { l = String(l || ''); return (/^[AEFHILMNORSX]/.test(l) ? 'an ' : 'a ') + l; }   // said by letter: an FA, a TS, an LBP
  function typeClash(id) {
    var a = artType(ROWS[id]), b = String(CUR.type[id] || '').toUpperCase();
    return !!(a && b && a !== b);
  }
  function problems() {
    var out = [];
    CUR.order.forEach(function (id, i) {
      var s = ROWS[id], f = fitOf(id), t = CUR.type[id];
      if (REMOVE[id]) return;
      if (inAtSponsored(id)) {                                                // v1.0.35: S3 ruling 13
        out.push({ id: id, pos: i + 1, text: '\u201c' + rowTitle(s) + '\u201d is in Around Town, but ' + ((s.section && s.section.name) || 'its section') + ' is sponsored this issue. Move it to its own tile.' });
        return;
      }
      if (typeClash(id)) {                                                    // v1.0.17
        var at = artType(s);
        out.push({ id: id, pos: i + 1, text: '\u201c' + (rowTitle(s) || 'This article') + '\u201d is ' + aOrAn(at) + ' article in ' + aOrAn(t) + ' block, and this plan is locked.' });
        return;
      }
      if (f.ok) return;
      var line = f.why === 'no-type' ? (isArticle(s) ? 'its article has no Section. Set it on the Article form.' : 'block has no type.')
               : f.why === 'no-design' ? (choices(t).length ? 'pick ' + aOrAn(t) + ' design.' : 'no design is made for ' + t + ' blocks for this title.')
               : '\u201c' + designName(CUR.design[id], s) + '\u201d is not made for ' + t + '.';
      out.push({ id: id, pos: i + 1, text: line });
    });
    return out;
  }

  // ── changes ───────────────────────────────────────────────
  // A block counts as moved when it left the longest run of blocks still in
  // their old order: drag one block and only that block is gold, not its
  // neighbours. The same set decides which positions Save writes.
  var KEEP = { key: '', set: {} };
  function keepSet() {
    var k = CUR.order.join() + '|' + ORIG.order.join() + '|' + Object.keys(TOUCHED).join();
    if (KEEP.key !== k) KEEP = { key: k, set: lisKeep(CUR.order, ORIG.pos, TOUCHED) };
    return KEEP.set;
  }
  function moved(id) { return orderChanged() && !keepSet()[id]; }
  function typeChanged(id) { return (CUR.type[id] || '') !== (ORIG.type[id] || ''); }
  function designChanged(id) { return (CUR.design[id] || '') !== (ORIG.design[id] || ''); }
  function changed(id) { return !!REMOVE[id] || isNew(id) || typeChanged(id) || designChanged(id) || moved(id) || groupChanged(id); }   // v1.0.24: new, group
  // v1.0.20 — an edit you made (not just the follow), so Cancel has something to undo
  function ownEdit(id) { var b = base(id); return !!REMOVE[id] || isNew(id) || moved(id) || groupChanged(id) || (CUR.type[id] || '') !== (b.type || '') || (CUR.design[id] || '') !== (b.design || ''); }
  function changedIds() { return CUR ? CUR.order.filter(changed) : []; }
  function orderChanged() { return CUR && ORIG && CUR.order.join() !== ORIG.order.join(); }

  // ── from the board ────────────────────────────────────────
  function snapshot(b) {
    var slots = ((b && b.slots) || []).slice().sort(function (x, y) { return (Number(x.position) || 0) - (Number(y.position) || 0); });
    var o = { order: [], type: {}, design: {}, pos: {}, end: {} };
    ROWS = {};
    slots.forEach(function (s) {
      ROWS[s.id] = s; o.order.push(s.id);
      o.type[s.id] = s.blockType || ''; o.design[s.id] = s.design || ''; o.pos[s.id] = Number(s.position) || 0;
      o.end[s.id] = s.endGroup === true;                                              // v1.0.24
    });
    return o;
  }
  function onBoard(e) {
    var d = (e && e.detail) || {};
    if (!d.ok) { ERR = d.error || 'The plan could not be read.'; paint(); return; }
    ERR = '';
    var keep = CUR && changedIds().length && !SAVING;
    var pendCur = keep ? JSON.parse(JSON.stringify(CUR)) : null;
    BOARD = d.data; LOCKED = !!(BOARD && BOARD.plan && BOARD.plan.locked);
    ORIG = snapshot(BOARD);
    if (pendCur && !LOCKED) {
      // keep edits waiting for Save across a refresh another tab caused
      var ids = pendCur.order.filter(function (id) { return own(ROWS, id) || isNew(id); });   // v1.0.24: pending new blocks stay
      ORIG.order.forEach(function (id, i) { if (ids.indexOf(id) < 0) ids.splice(Math.min(i, ids.length), 0, id); });
      CUR = { order: ids, type: {}, design: {}, size: pendCur.size || {} };
      ids.forEach(function (id) {
        CUR.type[id] = own(pendCur.type, id) ? pendCur.type[id] : ORIG.type[id];
        CUR.design[id] = own(pendCur.design, id) ? pendCur.design[id] : ORIG.design[id];
      });
    } else {
      CUR = { order: ORIG.order.slice(), type: Object.assign({}, ORIG.type), design: Object.assign({}, ORIG.design), size: {} };
      NEW = {};
    }
    if (LOCKED) NEW = {};
    Object.keys(NEW).forEach(function (id) { if (CUR.order.indexOf(id) < 0) delete NEW[id]; else ROWS[id] = newRow(id); });   // v1.0.24
    groupsFromMarks(!pendCur);                                                  // v1.0.24
    follow();                                                                   // v1.0.20
    Object.keys(REMOVE).forEach(function (id) { if (!own(ROWS, id) || LOCKED) delete REMOVE[id]; });   // v1.0.5
    if (SEL && !own(ROWS, SEL)) SEL = '';
    paint();
    if (BOARD && BOARD.plan && PV_AUTO !== BOARD.plan.id && !SAVING) { PV_AUTO = BOARD.plan.id; runPreview(); }   // v1.0.12: once per plan
    if (!SAVING && BOARD && BOARD.plan && (Array.isArray(BOARD.editions) || EDS.planId !== BOARD.plan.id || EDS.state === 'idle')) loadEditions(false);   // v1.0.7: every plan read carries editions
  }

  // v1.0.20 — a block whose article is of another type takes the article's type
  function follow() {
    FOLLOW = {};
    if (LOCKED || !CUR) return;
    CUR.order.forEach(function (id) {
      var s = ROWS[id], a = artType(s);
      if (!a || articleTypes().indexOf(a) < 0 || a === (ORIG.type[id] || '').toUpperCase()) return;
      var d = fitsType(ORIG.design[id], a) ? ORIG.design[id] : '';
      FOLLOW[id] = { type: a, design: d, from: ORIG.type[id] || '' };
      if ((CUR.type[id] || '').toUpperCase() !== a) { CUR.type[id] = a; CUR.design[id] = d; }
      else if (CUR.design[id] && !fitsType(CUR.design[id], a)) CUR.design[id] = d;
    });
  }

  // ── edits ─────────────────────────────────────────────────
  // v1.0.24 — moves are on the drawn list (blocks and end tiles). A gap g
  // is "before item g" of displayList() with the dragged item taken out.
  // what: { kind:'block', id } or { kind:'end', id: opener }
  function canMoveTo(what, g) {
    if (!CUR) return { ok: false };
    var list = displayList().filter(function (it) { return !(it.kind === what.kind && it.id === what.id) && !(what.kind === 'block' && it.inside === what.id); });
    if (what.kind === 'block' && pinned(what.id)) return { ok: false };
    if (g < 0 || g > list.length) return { ok: false };
    var s = ROWS[what.id];
    // the group the gap sits in: inside when the gap is after an opener and before its end item
    var host = '';
    for (var k = g - 1; k >= 0; k--) {
      var it = list[k];
      if (it.kind === 'end') break;
      if (it.kind === 'block' && isOpener(ROWS[it.id]) && !REMOVE[it.id]) { host = it.id; break; }
    }
    if (what.kind === 'end') {
      // the end tile only moves inside its own opener's run of groupable blocks
      if (host !== what.id) return { ok: false };
      return { ok: true, host: host, list: list };
    }
    if (host && isOpener(s)) return { ok: false };                                            // a pair holds no pair
    if (host && !isGroupable(s)) return { ok: false, why: 'Only articles, ads, dividers and spacers can sit inside a group.' };   // HC-P-L24-1
    return { ok: true, host: host, list: list };
  }
  function moveTo(what, g) {
    if (LOCKED || SAVING) return false;
    var can = canMoveTo(what, g); if (!can.ok) { if (can.why) toast('Not moved', 'err', can.why); return false; }
    var list = can.list, before = list[g] || null, id = what.id;
    if (what.kind === 'end') {
      // the group now ends before item g: count the blocks between the opener and the gap
      var oi = -1, size = 0;
      for (var k = 0; k < list.length && k < g; k++) { if (list[k].kind === 'block' && list[k].id === id) oi = k; else if (oi >= 0 && list[k].kind === 'block') size++; }
      CUR.size[id] = size; TOUCHED[id] = 1; delete FAILS[id]; NOTE = ''; fixGroups(); paint(); return true;
    }
    var mine = [id].concat(isOpener(ROWS[id]) ? CUR.order.slice(CUR.order.indexOf(id) + 1, CUR.order.indexOf(id) + 1 + (CUR.size[id] || 0)) : []);
    var rest = CUR.order.filter(function (x) { return mine.indexOf(x) < 0; });
    // leaving a group it was in, or joining one (sizes first: the gap after a group counts its blocks)
    var from = groupOf(id);
    if (from && from !== can.host && !isOpener(ROWS[id])) CUR.size[from] = Math.max(0, (CUR.size[from] || 0) - 1);
    if (can.host && from !== can.host) CUR.size[can.host] = (CUR.size[can.host] || 0) + 1;
    var at = rest.length;
    if (before) {
      if (before.kind === 'block') at = rest.indexOf(before.id);
      else at = rest.indexOf(before.id) + 1 + (CUR.size[before.id] || 0) - (can.host === before.id ? 1 : 0);   // after the last block of that group (the joiner not yet in it)
    }
    rest.splice.apply(rest, [at, 0].concat(mine));
    CUR.order = rest; TOUCHED[id] = 1; delete FAILS[id]; NOTE = '';
    fixGroups(); paint(); return true;
  }
  function setType(id, label) {
    if (LOCKED || SAVING) return;
    CUR.type[id] = label;
    if (label === ORIG.type[id]) CUR.design[id] = ORIG.design[id];
    else { var c = choices(label); CUR.design[id] = c.length === 1 ? c[0].id : ''; }
    delete FAILS[id]; NOTE = ''; paint();
  }
  function setDesign(id, did) { if (LOCKED || SAVING) return; CUR.design[id] = did; delete FAILS[id]; NOTE = ''; paint(); }
  // v1.0.23 — why a block cannot be removed here ('' when it can). HC-P-L23-1
  function hasContent(s) {
    if (!s) return false;
    if (isGreeting(s)) return grHas(s);   // v1.0.32: words, not title
    if (isList(s)) return (Number(s.listCount) || 0) > 0 || (s.items || []).length > 0;
    return !!s.asset;
  }
  function removeWhy(id) {
    var s = ROWS[id];
    if (!s) return 'this block is not in the plan';
    if (isGreeting(s)) return 'The Greeting is always on.';
    if (hasContent(s)) return 'Remove its content on the Picker first.';
    return '';
  }
  // v1.0.5 — a block waits for Save, back in its saved place (v1.0.23: any block)
  function removeRow(id) {
    if (LOCKED || SAVING || !own(ROWS, id)) return;
    if (isNew(id)) { cancelRow(id); return; }                                   // v1.0.24: a pending new block just goes
    var why = removeWhy(id);
    if (why) { toast('Not removed', 'err', rowTitle(ROWS[id]) + ': ' + why); return; }
    cancelRow(id); REMOVE[id] = 1; NOTE = '';
    if (isOpener(ROWS[id])) CUR.size[id] = 0;                                   // v1.0.24: the contents stay, ungrouped
    fixGroups(); paint();
  }
  function cancelRow(id) {
    delete REMOVE[id];
    if (isNew(id)) {                                                            // v1.0.24: a pending new block just goes
      delete NEW[id]; delete ROWS[id]; delete CUR.size[id]; delete CUR.type[id]; delete CUR.design[id]; delete FAILS[id]; delete TOUCHED[id];
      CUR.order = CUR.order.filter(function (x) { return x !== id; });
      fixGroups(); paint(); return;
    }
    var o = CUR.order.filter(function (x) { return x !== id; });
    o.splice(Math.min(ORIG.order.indexOf(id), o.length), 0, id);
    CUR.order = o; CUR.type[id] = base(id).type; CUR.design[id] = base(id).design; delete FAILS[id]; delete TOUCHED[id];   // v1.0.20: base
    if (isOpener(ROWS[id])) CUR.size[id] = ORIG_SIZE[id] || 0;                 // v1.0.24: the group as it was read
    fixGroups(); paint();
  }
  function cancelAll() {
    if (SAVING) return;
    Object.keys(NEW).forEach(function (id) { delete ROWS[id]; });
    NEW = {};
    CUR = { order: ORIG.order.slice(), type: Object.assign({}, ORIG.type), design: Object.assign({}, ORIG.design), size: {} };
    groupsFromMarks(true);                                                      // v1.0.24
    follow();                                                                   // v1.0.20
    FAILS = {}; TOUCHED = {}; REMOVE = {}; NOTE = ''; paint();
  }

  // ── v1.0.24 pairs ──────────────────────────────────────────
  // CUR.size[openerId] = how many blocks sit inside the opener's group
  // (0 = an empty pair). The group is the opener and the next size
  // blocks of CUR.order. Groups never nest (an opener is never
  // groupable) and never overlap.
  var ORIG_SIZE = {};
  function groupsFromMarks(setOrig) {
    // the Default Layout's load rule: the opener takes the blocks after it
    // up to the first end mark; a non-groupable block closes the group
    // before it; no mark closes at the end; the opener's own mark = empty.
    var sizes = {}, i = 0, n = CUR.order.length;
    while (i < n) {
      var id = CUR.order[i], s = ROWS[id];
      if (!isOpener(s)) { i++; continue; }
      var size = 0;
      if (!ORIG.end[id]) {
        for (var j = i + 1; j < n; j++) {
          var t = ROWS[CUR.order[j]];
          if (!isGroupable(t)) break;
          size++;
          if (ORIG.end[CUR.order[j]]) break;
        }
      }
      sizes[id] = size; i += 1 + size;
    }
    if (setOrig) ORIG_SIZE = Object.assign({}, sizes);
    Object.keys(sizes).forEach(function (k) { if (!own(CUR.size, k)) CUR.size[k] = sizes[k]; });
    Object.keys(CUR.size).forEach(function (k) { if (!own(sizes, k)) delete CUR.size[k]; });
    fixGroups();
  }
  // Keep every group inside the list and off anything it may not hold.
  function fixGroups() {
    var i = 0, n = CUR.order.length;
    while (i < n) {
      var id = CUR.order[i], s = ROWS[id];
      if (!isOpener(s)) { i++; continue; }
      var size = Math.max(0, Number(CUR.size[id]) || 0), ok = 0;
      for (var j = i + 1; j < n && ok < size; j++) { if (!isGroupable(ROWS[CUR.order[j]]) || REMOVE[CUR.order[j]]) break; ok++; }
      CUR.size[id] = ok; i += 1 + ok;
    }
  }
  // the opener an index of CUR.order sits inside ('' when none)
  function openerAt(i) {
    for (var k = i - 1; k >= 0; k--) {
      var id = CUR.order[k];
      if (isOpener(ROWS[id])) return (k + (CUR.size[id] || 0) >= i) ? id : '';
    }
    return '';
  }
  function groupOf(id) { var i = CUR.order.indexOf(id); return i < 0 ? '' : openerAt(i); }
  // the block that carries the end mark for an opener as the page stands
  function closerOf(opener) {
    var i = CUR.order.indexOf(opener), size = CUR.size[opener] || 0;
    return size > 0 ? CUR.order[i + size] : opener;
  }
  function wantMarks() {
    var m = {};
    CUR.order.forEach(function (id) { if (isOpener(ROWS[id]) && !REMOVE[id]) m[closerOf(id)] = true; });
    return m;
  }
  // v1.0.27 — the marks the plan was read with, plus the closer the load
  // rule derived for an opener that had none (that group is the baseline)
  function origMarks() {
    var m = {};
    ORIG.order.forEach(function (id) { if (ORIG.end[id]) m[id] = true; });
    ORIG.order.forEach(function (id, i) {
      if (!isOpener(ROWS[id]) || ORIG.end[id]) return;
      var size = ORIG_SIZE[id] || 0, closer = size > 0 ? ORIG.order[i + size] : id;
      if (closer && !ORIG.end[closer]) m[closer] = 'derived';
    });
    return m;
  }
  function groupChanged(id) {
    if (!ORIG || !CUR || isNew(id)) return false;
    return !!wantMarks()[id] !== !!origMarks()[id];
  }
  // the stack as drawn: block items and, after each group, its end item
  function displayList() {
    var out = [], i = 0, n = CUR.order.length;
    while (i < n) {
      var id = CUR.order[i];
      out.push({ kind: 'block', id: id, i: i });
      if (isOpener(ROWS[id]) && !REMOVE[id]) {
        var size = CUR.size[id] || 0;
        for (var j = 1; j <= size; j++) out.push({ kind: 'block', id: CUR.order[i + j], i: i + j, inside: id });
        out.push({ kind: 'end', id: id });
        i += 1 + size;
      } else i++;
    }
    return out;
  }
  function newRow(id) {
    var e = NEW[id];
    return { id: id, blockType: e.add || '', blockLabel: e.add || '', assetType: e.assetType || '', position: 0, endGroup: false, slotKey: e.slotKey, isNew: true, catalogKey: e.key };
  }
  // what the Add row offers: kinds that make blocks, that the Picker's
  // controller does not add, and that are not revenue (ads belong to the
  // Revenue tab; ruled by Jeff 15 Oct, v1.0.25: no Banners, no Sidebar Ads here).
  // The side comes from the catalog entry (IX_CONFIG.catalog side), not a list typed here.
  function addable() {
    var cat = (BOARD && BOARD.catalog) || [], out = [];
    cat.forEach(function (e) {
      if (!e || !e.blocks || e.controller || e.side === 'revenue') return;
      if (e.perIssue === 'one' && CUR.order.some(function (id) { var s = ROWS[id]; var c = catEntry(s); return c && c.key === e.key && !REMOVE[id]; })) return;
      out.push(e);
    });
    return out;
  }
  function addBlock(key) {
    if (LOCKED || SAVING || !CUR) return;
    var e = addable().filter(function (x) { return x.key === key; })[0];
    if (!e) { toast('Not added', 'err', 'That kind cannot be added here.'); return; }
    var id = 'new:' + (++NEW_N) + ':' + Date.now().toString(36);
    NEW[id] = Object.assign({}, e, { slotKey: e.key + '-' + Date.now().toString(36) });
    ROWS[id] = newRow(id);
    CUR.order.push(id); CUR.type[id] = e.add || ''; CUR.design[id] = (e.design && e.design.id) || '';
    if (e.opener) CUR.size[id] = 0;
    TOUCHED[id] = 1; NOTE = ''; paint();
    var c = canvas(), t = c && c.querySelector('[data-ly-row="' + id + '"]'); if (t && t.scrollIntoView) t.scrollIntoView({ block: 'nearest' });
  }

  // ── positions: fewest writes, one decimal place ───────────
  function lisKeep(order, pos, touched) {
    // longest strictly increasing run of original positions, kept as they
    // are. On a tie, the blocks you did not move are the ones kept, so the
    // block you dragged is the one that turns gold and gets written.
    var n = order.length, len = [], prev = [], w = function (id) { return 1 + (touched && touched[id] ? 0 : 0.001); };
    for (var i = 0; i < n; i++) {
      len[i] = w(order[i]); prev[i] = -1;
      for (var j = 0; j < i; j++) if (pos[order[j]] < pos[order[i]] && len[j] + w(order[i]) > len[i]) { len[i] = len[j] + w(order[i]); prev[i] = j; }
    }
    var best = -1; for (var k = 0; k < n; k++) if (best < 0 || len[k] > len[best]) best = k;
    var keep = {}; for (var x = best; x >= 0; x = prev[x]) keep[order[x]] = 1;
    return keep;
  }
  function newPositions(order, pos, ceiling, touched) {
    var keep = lisKeep(order, pos, touched), out = {}, ok = true, i = 0;
    while (i < order.length) {
      if (keep[order[i]]) { out[order[i]] = pos[order[i]]; i++; continue; }
      var j = i; while (j < order.length && !keep[order[j]]) j++;
      var lo = i > 0 ? out[order[i - 1]] : 0, hi = j < order.length ? pos[order[j]] : null, k = j - i;
      for (var m = 1; m <= k; m++) {
        var v = hi == null ? r1(Math.floor(lo) + m) : r1(lo + (hi - lo) * m / (k + 1));
        out[order[i + m - 1]] = v;
      }
      for (var c = i; c < j; c++) {
        var prevV = c > 0 ? out[order[c - 1]] : 0, nextV = c + 1 < order.length ? (c + 1 < j ? out[order[c + 1]] : (hi == null ? ceiling : hi)) : ceiling;
        if (!(out[order[c]] > prevV) || !(out[order[c]] < nextV) || out[order[c]] >= ceiling) ok = false;
      }
      i = j;
    }
    if (!ok) { out = {}; order.forEach(function (id, n) { out[id] = n + 1; }); }
    return out;
  }

  // ── editions ──────────────────────────────────────────────
  // v1.0.3 — the other editions come from /editions (Data Worker v1.0.37)
  var EDS = { list: [], state: 'idle', error: '', planId: '' };
  function editionsUrl() {
    var w = window.PP_WEBHOOKS || {};
    if (w.editions) return String(w.editions);
    return w.planBoard ? String(w.planBoard).replace(/\/plan-board.*$/, '/editions') : '';
  }
  function loadEditions(fresh) {
    var pid = BOARD && BOARD.plan && BOARD.plan.id, u = editionsUrl();
    // v1.0.7 — /plan-board already answers editions; use them
    if (pid && BOARD && Array.isArray(BOARD.editions)) { EDS = { list: BOARD.editions, state: 'ok', error: '', planId: pid }; paint(); return Promise.resolve(); }
    if (!pid || !u) { EDS = { list: [], state: 'error', error: 'the editions address is not known', planId: pid || '' }; paint(); return Promise.resolve(); }
    EDS.state = 'loading'; EDS.planId = pid; paintSavebar();
    return IPP.getJSON(u + (u.indexOf('?') < 0 ? '?' : '&') + 'planId=' + encodeURIComponent(pid) + (fresh ? '&fresh=1' : ''))
      .then(function (j) { EDS = { list: (j && j.editions) || [], state: 'ok', error: '', planId: pid }; },
            function (e) { EDS = { list: [], state: 'error', error: (e && e.message) || 'the request failed', planId: pid }; })
      .then(function () { paint(); });
  }
  function editions() { return EDS.state === 'ok' ? EDS.list : []; }
  function sharedRow(r) { return r && r.assetType !== AD && !!r.slotKey && !r.isNew; }   // v1.0.24: a pending new block is this edition's
  function editionPlan() {
    // what Save does to the other editions of this issue
    var out = { ops: { reorder: [], layout: [], fill: [], clear: [] }, open: [], locked: [], missing: [] };
    var mine = CUR.order.map(function (id) { return ROWS[id]; }).filter(sharedRow);
    var mineOrig = ORIG.order.map(function (id) { return ROWS[id]; }).filter(sharedRow);
    var relOrderChanged = mine.map(function (s) { return s.id; }).join() !== mineOrig.map(function (s) { return s.id; }).join();
    editions().forEach(function (ed) {
      if (ed.locked) { out.locked.push(ed.name); return; }
      var byKey = {}, dup = {};
      (ed.rows || []).forEach(function (r) { if (!sharedRow(r)) return; if (byKey[r.slotKey]) dup[r.slotKey] = 1; byKey[r.slotKey] = r; });
      var pairs = [];
      mine.forEach(function (s) { if (byKey[s.slotKey] && !dup[s.slotKey]) pairs.push([s, byKey[s.slotKey]]); });
      var touched = false;
      if (relOrderChanged && pairs.length) {
        var places = pairs.map(function (p) { return p[1].position; }).sort(function (a, b) { return a - b; });
        pairs.forEach(function (p, i) {
          if (p[1].position !== places[i]) { out.ops.reorder.push({ op: { id: p[1].id, position: places[i] }, ed: ed.name, of: p[0].id }); touched = true; }
        });
      }
      pairs.forEach(function (p) {
        var s = p[0], r = p[1];
        if (typeChanged(s.id) && (CUR.type[s.id] || '') !== (r.blockType || '')) {
          out.ops.layout.push({ op: { id: r.id, blockTypeJson: JSON.stringify(typeHash(CUR.type[s.id])), endGroup: !!r.endGroup, blockTextJson: JSON.stringify(r.blockText || '') }, ed: ed.name, of: s.id, want: typeHash(CUR.type[s.id]) });
          touched = true;
        }
        if ((typeChanged(s.id) || designChanged(s.id)) && CUR.design[s.id] && CUR.design[s.id] !== (r.design || '')) {
          out.ops.fill.push({ op: { id: r.id, assetField: designField(), assetId: CUR.design[s.id] }, ed: ed.name, of: s.id, want: CUR.design[s.id] });
          touched = true;
        }
        if (typeChanged(s.id) && !CUR.design[s.id] && r.design) {                      // v1.0.20: the old design goes too
          out.ops.clear.push({ op: { id: r.id, assetField: designField() }, ed: ed.name, of: s.id, want: '' });
          touched = true;
        }
      });
      var changedShared = changedIds().filter(function (id) { return sharedRow(ROWS[id]) && !REMOVE[id] && !(groupChanged(id) && !moved(id) && !typeChanged(id) && !designChanged(id)); });   // v1.0.5: removal is this edition only; v1.0.24: so is a group mark
      changedShared.forEach(function (id) { if (!byKey[ROWS[id].slotKey]) out.missing.push(ed.name + ': ' + rowTitle(ROWS[id])); });
      if (touched || changedShared.length) out.open.push(ed.name);
    });
    return out;
  }

  // ── Scenario 124 batch contract (same as the Picker) ──────
  function batchUrl(url, op, batchId, ops) {
    return url + (url.indexOf('?') < 0 ? '?' : '&') + 'op=' + encodeURIComponent(op) +
      '&batchId=' + encodeURIComponent(batchId) + '&batch=' + encodeURIComponent(JSON.stringify({ ops: ops }));
  }
  function sendBatch(url, op, ops) {
    var batchId = 'ipl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    var chunks = [];
    if (batchUrl(url, op, batchId, ops).length <= BATCH_URL_CEILING) chunks = [ops];
    else for (var i = 0; i < ops.length; i += BATCH_CHUNK) chunks.push(ops.slice(i, i + BATCH_CHUNK));
    var results = [], base = 0;
    return chunks.reduce(function (chain, chunk, ci) {
      return chain.then(function () {
        return fetch(batchUrl(url, op, batchId + (ci ? '-' + ci : ''), chunk), { method: 'GET', credentials: 'omit' })
          .then(function (r) {
            return r.text().then(function (t) {
              if (!r.ok) throw new Error('Scenario 124 answered HTTP ' + r.status + ' to ' + op + '.');
              var body; try { body = JSON.parse(t); } catch (e) { throw new Error('Scenario 124 sent a reply that is not JSON (' + op + ').'); }
              ((body && body.results) || []).forEach(function (row) { row.__idx = base + (Number(row.i) - 1); results.push(row); });
              base += chunk.length;
            });
          });
      });
    }, Promise.resolve()).then(function () { return results; });
  }
  function resultFor(results, i) { for (var n = 0; n < results.length; n++) if (results[n].__idx === i) return results[n]; return null; }
  function stage(op, items, check) {
    if (!items.length) return Promise.resolve([]);
    return sendBatch(blockWriter(), op, items.map(function (it) { return it.op; })).then(function (results) {
      return items.map(function (it, i) {
        var res = resultFor(results, i), why = '';
        if (!res) why = 'no result came back';
        else if (res.ok !== true || !res.id) why = res.err || 'Webflow refused the write';
        else why = check(it, res.fieldData || {});
        return { item: it, why: why };
      });
    }, function (e) {
      var why = (e && e.message) || 'the request failed';
      return items.map(function (it) { return { item: it, why: why }; });
    });
  }

  // v1.0.5 — delete answers { deleted }, not fieldData (as the Picker reads it)
  function deleteStage(items) {
    if (!items.length) return Promise.resolve([]);
    return sendBatch(blockWriter(), 'delete', items.map(function (it) { return it.op; })).then(function (results) {
      return items.map(function (it, i) {
        var res = resultFor(results, i);
        return { item: it, why: !res ? 'no result came back' : (res.deleted === true ? '' : (res.err || 'the row was not deleted')) };
      });
    }, function (e) {
      var why = (e && e.message) || 'the request failed';
      return items.map(function (it) { return { item: it, why: why }; });
    });
  }

  // v1.0.24 — the end-group field as 124 reads it back (NL-BLOCKS slug end-group; display name end-group-here)
  function endOf(fd) { return !!fd && (fd['end-group'] === true || fd['end-group-here'] === true); }
  // v1.0.24 — create answers { ok, id, fieldData } (as the Picker reads it)
  function createStage(items) {
    if (!items.length) return Promise.resolve([]);
    return sendBatch(blockWriter(), 'create', items.map(function (it) { return it.op; })).then(function (results) {
      return items.map(function (it, i) {
        var res = resultFor(results, i), why = '';
        if (!res) why = 'no result came back';
        else if (res.ok !== true || !res.id) why = res.err || 'Webflow refused the write';
        else {
          var fd = res.fieldData || {};
          if (String(fd['slot-key'] || '') !== it.slotKey) why = 'did not store the slot key';
          else if (String(fd['asset-type'] || '') !== String(it.op.assetTypeHash)) why = 'did not store the asset type';
          else if (it.op.designId && String(fd.design || '') !== String(it.op.designId)) why = 'did not store the design';
        }
        return { item: it, why: why, res: res };
      });
    }, function (e) {
      var why = (e && e.message) || 'the request failed';
      return items.map(function (it) { return { item: it, why: why }; });
    });
  }

  // ── save ──────────────────────────────────────────────────
  function save() {
    if (SAVING || LOCKED || !CUR) return;
    var all = changedIds(); if (!all.length) return;
    var dels = Object.keys(REMOVE).filter(function (id) { return own(ROWS, id); }).map(function (id) { return { op: { id: id }, of: id }; });   // v1.0.5
    var news = Object.keys(NEW).filter(function (id) { return CUR.order.indexOf(id) >= 0; });                                            // v1.0.24
    var ids = all.filter(function (id) { return !REMOVE[id] && !isNew(id); });
    if (EDS.state === 'loading') { toast('One moment', 'info', 'Still reading the other editions of this issue.'); return; }
    if (!blockWriter()) { toast('Can\u2019t save', 'err', 'This page has no PP_WEBHOOKS.blockWriter address (Scenario 124). Nothing was sent.'); return; }
    var need = ids.filter(function (id) { return typeChanged(id) && !CUR.design[id] && !FOLLOW[id]; });   // v1.0.20: a followed block may save without one; v1.0.24: new blocks never need one
    if (need.length) {
      need.forEach(function (id) { FAILS[id] = 'pick a design for the new type first'; });
      paint(); toast('Pick a design first', 'err', plural(need.length, ['block has', 'blocks have']) + ' a new type and no design yet. Nothing was sent.'); return;
    }
    if (ids.some(function (id) { return typeChanged(id) && !typeHash(CUR.type[id]); })) { toast('Can\u2019t save', 'err', 'The plan data has no option id for a chosen type (IX_CONFIG.blockTypes). Nothing was sent.'); return; }
    if (ids.some(function (id) { return designChanged(id); }) && !designField()) { toast('Can\u2019t save', 'err', 'The plan data does not name the design field (blockFields.design, Data Worker v1.0.34+). Nothing was sent.'); return; }
    // v1.0.24 — new blocks need their option ids
    var wi = (BOARD && BOARD.writeIds) || {}, plan = (BOARD && BOARD.plan) || {};
    for (var ni = 0; ni < news.length; ni++) {
      var ne = NEW[news[ni]];
      if (!((wi.assetType || {})[ne.assetType])) { toast('Can\u2019t save', 'err', 'The plan data has no option id for asset type \u201c' + ne.assetType + '\u201d (writeIds). Nothing was sent.'); return; }
      if (ne.add && !typeHash(ne.add)) { toast('Can\u2019t save', 'err', 'The plan data has no option id for block type \u201c' + ne.add + '\u201d (IX_CONFIG.blockTypes). Nothing was sent.'); return; }
    }
    var marksChanged = CUR.order.filter(function (id) { return !REMOVE[id] && groupChanged(id); });
    if (marksChanged.some(function (id) { return CUR.type[id] && !typeHash(CUR.type[id]); })) { toast('Can\u2019t save', 'err', 'The plan data has no option id for a block\u2019s type, so its group mark cannot be written (IX_CONFIG.blockTypes). Nothing was sent.'); return; }

    // this plan
    var newPos = orderChanged() ? newPositions(CUR.order, ORIG.pos, looseFrom(), TOUCHED) : {};
    Object.keys(REMOVE).forEach(function (id) { delete newPos[id]; });                     // v1.0.5
    var reorder = [], layout = [], fill = [], clear = [], creates = [];   // clear v1.0.20, creates v1.0.24
    var marks = wantMarks();
    news.forEach(function (id) {
      var ne = NEW[id], pos = newPos[id] || (Math.floor(Math.max.apply(null, [0].concat(Object.keys(ORIG.pos).map(function (k) { return ORIG.pos[k]; })))) + 1);
      creates.push({ of: id, slotKey: ne.slotKey, endGroup: !!marks[id], op: {
        pubplanId: plan.id, blockName: (plan.name || 'Plan') + '-b' + pos, slotKey: ne.slotKey, position: pos,
        planningNote: '', showAsSponsored: false, blockTypeHash: ne.add ? typeHash(ne.add) : '', assetTypeHash: (wi.assetType || {})[ne.assetType],
        assetField: 'slot-key', assetId: ne.slotKey, designId: CUR.design[id] || '', endGroup: !!marks[id] } });
      delete newPos[id];
    });
    Object.keys(newPos).forEach(function (id) { if (newPos[id] !== ORIG.pos[id]) reorder.push({ op: { id: id, position: newPos[id] }, of: id }); });
    ids.forEach(function (id) {
      var s = ROWS[id];
      if (typeChanged(id) || groupChanged(id)) layout.push({ op: { id: id, blockTypeJson: CUR.type[id] ? JSON.stringify(typeHash(CUR.type[id])) : 'null', endGroup: !!marks[id], blockTextJson: JSON.stringify(s.blockText || '') }, of: id, want: CUR.type[id] ? typeHash(CUR.type[id]) : '', wantEnd: !!marks[id] });
      if (designChanged(id) || (typeChanged(id) && CUR.design[id] !== ORIG.design[id])) {
        if (CUR.design[id]) fill.push({ op: { id: id, assetField: designField(), assetId: CUR.design[id] }, of: id, want: CUR.design[id] });
        else if (ORIG.design[id]) clear.push({ op: { id: id, assetField: designField() }, of: id, want: '' });   // v1.0.20
      }
    });
    // the other editions
    var ed = editionPlan();
    reorder = reorder.concat(ed.ops.reorder); layout = layout.concat(ed.ops.layout); fill = fill.concat(ed.ops.fill); clear = clear.concat(ed.ops.clear);

    var newsInfo = news.map(function (id) { return { id: id, key: NEW[id].slotKey, name: NEW[id].name || NEW[id].key, type: CUR.type[id] || '', design: CUR.design[id] || '', opener: !!NEW[id].opener, size: CUR.size[id] || 0, mark: !!marks[id], why: '' }; });   // v1.0.24
    SAVING = true; FAILS = {}; NOTE = ''; paint();
    var bad = [], made = {};   // made: tempId -> the row 124 created (v1.0.24)
    var note = function (rs) { rs.forEach(function (r) { if (r.why) { bad.push(r); if (!r.item.ed) FAILS[r.item.of] = r.why; } }); };
    // v1.0.24 — creates first (the Picker's create contract, plus endGroup for 124 v2.24)
    createStage(creates).then(function (rs) {
      note(rs);
      rs.forEach(function (r) { if (!r.why && r.res) made[r.item.of] = r.res; else newsInfo.forEach(function (n0) { if (n0.id === r.item.of) n0.why = r.why; }); });
      // an opener born as an empty pair whose mark did not land on create gets it through the layout op
      rs.forEach(function (r) {
        if (r.why || !r.item.endGroup) return;
        var fd = (r.res && r.res.fieldData) || {};
        if (!endOf(fd)) layout.push({ op: { id: r.res.id, blockTypeJson: r.item.op.blockTypeHash ? JSON.stringify(r.item.op.blockTypeHash) : 'null', endGroup: true, blockTextJson: '""' }, of: r.item.of, want: r.item.op.blockTypeHash || '', wantEnd: true });
      });
      return stage('reorder', reorder, function (it, fd) { return Number(fd.position) === Number(it.op.position) ? '' : 'did not store the position'; });
    })
      .then(function (rs) { note(rs); return stage('layout', layout, function (it, fd) {
        if (String(fd['block-type'] || '') !== String(it.want)) return 'did not store the type';
        if (own(it, 'wantEnd') && (endOf(fd)) !== it.wantEnd) return 'did not store the group mark';
        return ''; }); })
      .then(function (rs) { note(rs); return stage('fill', fill, function (it, fd) { return String(fd.asset || '') === String(it.want) ? '' : 'did not store the design'; }); })
      .then(function (rs) { note(rs); return stage('clear', clear, function (it, fd) { return String(fd.asset || '') === '' ? '' : 'did not clear the old design'; }); })   // v1.0.20
      .then(function (rs) { note(rs); return deleteStage(dels); })                          // v1.0.5
      .then(function (rs) {
        note(rs);
        var want = { order: CUR.order.slice(), type: Object.assign({}, CUR.type), design: Object.assign({}, CUR.design), size: Object.assign({}, CUR.size), marks: wantMarks() };
        return IPP.board.load({ fresh: true }).then(function () { return loadEditions(true); }, function () {}).then(function () { return want; });
      })
      .then(function (want) {
        SAVING = false;
        // v1.0.24 — a new block counts as added only when the fresh read has
        // its slot-key. The read reset NEW and ROWS; the pending tiles are
        // gone either way, so one that did not land is named, not redrawn.
        var added = 0, notAdded = [];
        newsInfo.forEach(function (n0) {
          var real = '';
          Object.keys(ROWS).forEach(function (k) { if (!real && ROWS[k] && ROWS[k].slotKey === n0.key) real = k; });
          delete FAILS[n0.id]; delete TOUCHED[n0.id];
          if (real) {
            added++;
            want.order = want.order.map(function (x) { return x === n0.id ? real : x; });
            want.type[real] = n0.type; want.design[real] = n0.design;
            if (n0.opener && CUR) { want.size[real] = n0.size; CUR.size[real] = n0.size; }
            if (n0.mark) want.marks[real] = true;
          } else {
            notAdded.push(n0.name + (n0.why ? ' (' + n0.why + ')' : ''));
          }
        });
        if (CUR) fixGroups();
        // TOAST-TRUTH: what the fresh read shows decides
        var lost = [];
        if (CUR && ORIG) {
          Object.keys(want.marks).forEach(function (id) {
            if (!own(ROWS, id) || isNew(id)) return;
            if (!ORIG.end[id]) { FAILS[id] = FAILS[id] || 'the fresh read shows no group mark'; lost.push(id); }
          });
          want.order.forEach(function (id) {
            if (!own(ROWS, id)) return;
            var t = (want.type[id] || '') === (ORIG.type[id] || ''), d = (want.design[id] || '') === (ORIG.design[id] || '');
            if (!t) { CUR.type[id] = want.type[id]; FAILS[id] = FAILS[id] || 'the fresh read shows the old type'; lost.push(id); }
            if (!d) { CUR.design[id] = want.design[id]; FAILS[id] = FAILS[id] || 'the fresh read shows the old design'; lost.push(id); }
          });
          var readOrder = ORIG.order.join(), wantOrder = want.order.filter(function (id) { return own(ROWS, id) && !isNew(id); });
          if (wantOrder.join() !== readOrder) {
            ORIG.order.forEach(function (id) { if (wantOrder.indexOf(id) < 0) wantOrder.push(id); });
            CUR.order = wantOrder;
            wantOrder.forEach(function (id) { if (moved(id) && !FAILS[id]) { FAILS[id] = 'the fresh read shows the old order'; lost.push(id); } });
          }
        }
        // v1.0.5: removed only when the fresh read no longer has it
        Object.keys(REMOVE).forEach(function (id) {
          if (!own(ROWS, id)) { delete REMOVE[id]; delete FAILS[id]; }
          else FAILS[id] = FAILS[id] || 'the fresh read still shows the block';
        });
        var edBad = bad.filter(function (r) { return r.item.ed; });
        // a write whose reply looked wrong but whose change the fresh read shows is saved
        Object.keys(FAILS).forEach(function (id) { if (!own(ROWS, id) || !changed(id)) delete FAILS[id]; });
        if (!Object.keys(FAILS).length && !edBad.length && !notAdded.length) {
          TOUCHED = {};
          var also = ed.open.length ? ' Also applied to ' + ed.open.join(', ') + '.' : '';
          if (dels.length) also += ' ' + plural(dels.length, ['block', 'blocks']) + ' removed' + (editions().length ? ' from this edition only.' : '.');   // v1.0.23
          if (added) also += ' ' + plural(added, ['block', 'blocks']) + ' added' + (editions().length ? ' to this edition only.' : '.');            // v1.0.24
          LAST_SAVE = Date.now();                                                      // v1.0.12: the preview is now behind
          NOTE = 'Saved.' + also + (ed.locked.length ? ' ' + ed.locked.join(', ') + (ed.locked.length === 1 ? ' is' : ' are') + ' locked and was not changed.' : '') +
                 (ed.missing.length ? ' Not in the other edition: ' + ed.missing.join('; ') + '.' : '');
          toast('Layout saved', 'ok', also.trim() || undefined);
        } else {
          NOTE = 'Not everything saved.' + (Object.keys(FAILS).length ? ' Gold blocks still wait.' : '') +
                 (notAdded.length ? ' Not added: ' + notAdded.join('; ') + '. Add it again.' : '') +   // v1.0.24
                 (edBad.length ? ' ' + plural(edBad.length, ['change', 'changes']) + ' to other editions did not land: ' + edBad.map(function (r) { return r.item.ed + ' (' + r.why + ')'; }).join('; ') + '.' : '');
          toast('Layout not fully saved', 'err', NOTE);
        }
        paint();
      });
  }

  // ── paint ─────────────────────────────────────────────────
  function info() {
    if (!window.IxInfo || typeof IxInfo.badge !== 'function') return '';
    return IxInfo.badge({
      file: FILE, version: VERSION, title: 'Layout \u00b7 order, types and designs',
      blurb: 'The issue top to bottom, the way the email runs. Drag a block by its handle to move it; ' +
             'its content and design move with it. Any block can go anywhere; the first banner is the Lead.\n\n' +
             'Click a block to open it: its type, its design (only the designs made for the block\u2019s type are offered) and the facts to check. Every article tile says whether its section is sponsored this issue. The type is decided on the Picker; a block with no type yet may be typed here once. Click a tile to open it and check its content: dates, venue, pictures, links. Click it again, press Esc or click empty space to close it.\n\n' +
             'Changes wait with a gold border until you Save. Save also applies the order, types and designs of articles ' +
             'and sections to the other open editions of this issue. Banner spots belong to each edition.\n\n' +
             'Remove takes an empty block out of this edition on Save; a block holding content is emptied on the Picker first, and the Greeting is always on. The Weather block shows whether the forecast can be fetched for the publish date.\n\n' +
             'Around Town is a pair: its tile and its end tile, with the blocks between as the group. Drag the end to grow or shrink it; drag the opener and the group moves with it. Only articles, ads, dividers and spacers sit inside. The Add row under the stack adds the kinds neither the Picker nor Revenue offers (Around Town, Divider, Spacer); a new block is created on Save, this edition only.',
      scenarios: [{ name: '124 \u00b7 PubPlan Block Writer', note: 'create (new blocks), reorder (positions), layout (block type, group mark), fill (design), delete (any empty block)' }],
      companions: 'ipp-layout-v1.0.21.css \u00b7 ix-issue-data v1.0.57 /plan-board (catalog opener, groupable) and /preview \u00b7 newsletter-render v1.19.0 (block markers, x_endGroup)'
    });
  }
  var GRIP = '<svg width="9" height="12" viewBox="0 0 14 18" fill="currentColor" aria-hidden="true"><circle cx="4" cy="3" r="1.7"/><circle cx="10" cy="3" r="1.7"/><circle cx="4" cy="9" r="1.7"/><circle cx="10" cy="9" r="1.7"/><circle cx="4" cy="15" r="1.7"/><circle cx="10" cy="15" r="1.7"/></svg>';
  var LOCK = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  function artHtml(url, cls, alt) {
    return url ? '<img class="' + cls + '" src="' + esc(url) + '" alt="' + esc(alt) + '" loading="lazy">' : '<span class="' + cls + ' is-empty"></span>';
  }
  // v1.0.10 — the dropdowns on the tile (standing rule: a changed one stays gold until Save or Cancel)
  function typeCtl(id, s, off) {
    if (isOpenArt(s)) return '<span class="ipp-ly-type is-open" title="Takes the type of the article you place">Open</span>';   // v1.0.20
    var t = CUR.type[id], types = articleTypes();
    var clash = typeClash(id), at = artType(s);                                // v1.0.17
    var cls = 'ipp-ly-type' + (t && !clash ? '' : ' is-none') + (clash ? ' is-bad' : '') + (typeChanged(id) ? ' is-changed' : '');
    if (at && types.indexOf(at) >= 0) types = [at];                            // v1.0.17: the stopgap offers only the article's type
    // v1.0.16 stopgap: only an article block with no SAVED type may be typed, once
    if (true) return '<span class="' + cls + '"' + (clash ? ' title="This is a ' + esc(at) + ' article in a ' + esc(t) + ' block."' : '') + '>' + esc(t || '?') + '</span>';
    var opts = (t ? '' : '<option value="" selected>?</option>') + types.map(function (l) {
      return '<option value="' + esc(l) + '"' + (t === l ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('');
    return '<select class="' + cls + ' ipp-ly-tsel" data-ly-tsel="' + id + '" aria-label="Type (this block has none yet)"' + off + '>' + opts + '</select>';
  }
  // v1.0.22 — every design made for this type carries an item count: the Picker sets it from the count
  function byCount(label) { var l = choices(label); return !!l.length && l.every(function (d) { return Number.isInteger(d.itemCount) && d.itemCount > 0; }); }
  // v1.0.35 — the Design row in the open panel: pills, not a select. One choice is the name as text (v1.0.33 rule).
  function designCtl(id, s, off) {
    if (isOpenArt(s)) return '<span class="ipp-ly-fv is-off">Design after an article</span>';   // v1.0.20
    var t = CUR.type[id], cur = CUR.design[id], f = fitOf(id);
    if (t && byCount(t)) {   // v1.0.22
      var dn = cur ? designName(cur, s) : '';
      return '<span class="ipp-ly-fv' + (cur ? '' : ' is-off') + '" title="This design is set on the Picker from how many items the block holds.">' + (cur ? esc(dn) + ' \u00b7 from the count' : 'Set by the count on the Picker') + '</span>';
    }
    if (!t) return '<span class="ipp-ly-fv is-bad">' + (isArticle(s) ? 'Set its Section first' : 'No type') + '</span>';   // v1.0.20
    var list = choices(t);
    if (!list.length) return '<span class="ipp-ly-fv is-bad" title="No live design is made for ' + esc(t) + ' blocks for this title.">No ' + esc(t) + ' design</span>';
    if (list.length === 1 && (!cur || cur === list[0].id)) {   // v1.0.33: one choice is not a control
      if (!cur) CUR.design[id] = list[0].id;
      return '<span class="ipp-ly-fv" title="The only ' + esc(t) + ' design made for this title.">' + esc(list[0].name) + (designChanged(id) ? ' \u00b7 set on Save' : '') + '</span>';
    }
    var saved = base(id).design, h = '<span class="ipp-ly-pills" role="radiogroup" aria-label="Design">';
    if (cur && !f.ok) h += '<button type="button" class="ipp-ly-pill is-bad" disabled title="Not made for ' + esc(t) + '">' + esc(designName(cur, s)) + '</button>';
    list.forEach(function (dz) {
      var on = cur === dz.id, was = saved === dz.id && !on && designChanged(id);
      h += '<button type="button" class="ipp-ly-pill' + (on ? (designChanged(id) ? ' is-on' : ' is-saved') : '') + (was ? ' is-was' : '') + '" data-ly-dpick="' + id + '" data-ly-design="' + dz.id + '" aria-checked="' + on + '" role="radio"' + off + '>' + esc(dz.name) + '</button>';
    });
    return h + '</span>';
  }
  // v1.0.35 — the colour class by what the block is for; articles in ink
  function kindCls(s) {
    if (isGreeting(s) || isWeather(s) || isOpener(s)) return ' is-fur';
    if (isBanner(s) || s.assetType === 'txa' || /^(TXA|HA|BA)$/i.test(String(s.blockType || ''))) return ' is-ad';
    if (isList(s)) return ' is-list';
    return '';
  }
  // v1.0.35 — the tile's name: article titles in curly quotes
  function tileName(s) { var t = rowTitle(s); return isArticle(s) && s.asset ? '\u201c' + t + '\u201d' : t; }
  // v1.0.35 — the sponsor tag on an article tile (HC-P-L35-1)
  function tagHtml(s) {
    if (!isArticle(s) || !s.asset) return '';
    return s.sponsor && s.sponsor.name ? '<span class="ipp-ly-tag is-sp" title="Section sponsor, set on Revenue">Sponsored \u00b7 ' + esc(s.sponsor.name) + '</span>'
      : '<span class="ipp-ly-tag" title="No section sponsor this issue">Not sponsored</span>';
  }
  // v1.0.35 — the dot: ok (ready to compile), wait (a Before Publish line names it), pend (added or removed on Save)
  function dotOf(id, pr) {
    var s = ROWS[id];
    if (REMOVE[id] || isNew(id)) return 'pend';
    for (var i = 0; i < pr.length; i++) if (pr[i].id === id) return 'wait';
    if (isWeather(s)) return wxSay().tone === 'ok' ? 'ok' : 'wait';
    if (isGreeting(s)) return grSay(s).tone === 'ok' ? 'ok' : 'wait';
    if (!fitOf(id).ok) return 'wait';
    return 'ok';
  }
  // v1.0.35 — S3 ruling 13: a sponsored section's story may not sit in Around Town
  function inAtSponsored(id) { var s = ROWS[id]; return !!(isArticle(s) && s.asset && s.sponsor && s.sponsor.name && groupOf(id)); }
  var PR = [];   // the current problems, for the dots
  // v1.0.28 — the panel's colour: a design choice's swatch when the data carries one, else the CSS default tint.
  // v1.0.31 — the swatch is the ground as set; the hairline is the swatch with a third of the brand teal (HC-P-L31-1).
  function pairTint(id) {
    var cur = CUR.design[id], list = choices(CUR.type[id] || ''), d = null;
    for (var i = 0; i < list.length; i++) if (list[i].id === cur) { d = list[i]; break; }
    var c = d && d.swatch ? String(d.swatch).trim() : '';
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c)) return '';
    return ' style="--ly-pair-bg:' + c + ';--ly-pair:color-mix(in srgb, ' + c + ' 65%, var(--ix-teal, #1A3A3A))"';
  }
  // v1.0.28 — the opener bar: one half-height line with the name, the design pick and Remove
  // v1.0.35 — the opener row: the same one-line tile, the name in Fraunces (CSS), its design in the open panel
  function openerHtml(id, i) {
    var s = ROWS[id], ch = changed(id), nu = isNew(id), open = SEL === id;
    var handle = (LOCKED || SAVING) ? '<span class="ipp-ly-h ipp-ly-lock">' + LOCK + '</span>'
      : '<button type="button" class="ipp-ly-h" data-ly-handle="' + id + '" aria-label="Move ' + esc(rowTitle(s)) + ' and its group (drag, or Arrow Up and Arrow Down)">' + GRIP + '</button>';
    var sub = FAILS[id] ? 'Not saved: ' + FAILS[id] : (nu ? 'Added on Save' : plural(CUR.size[id] || 0, ['story', 'stories']));
    var h = '<div class="ipp-ly-tile is-opener ipp-ly-ghead' + (ch ? ' ipp-dirty' : '') + (open ? ' is-open' : '') + (FAILS[id] ? ' is-failed' : '') + (nu ? ' is-new' : '') + '" data-ly-row="' + id + '" role="listitem">' +
      '<div class="ipp-ly-tr">' + handle +
      '<span class="ipp-ly-pos" title="' + (nu ? 'Not saved yet' : 'Saved position ' + esc(posText(ORIG.pos[id]))) + '">' + (i + 1) + '</span>' +
      '<button type="button" class="ipp-ly-main" data-ly-sel="' + id + '" aria-expanded="' + open + '">' +
        '<span class="ipp-ly-t is-fur">' + esc(rowTitle(s)) + '</span><span class="ipp-ly-s">' + esc(sub) + '</span>' +
      '</button>' +
      '<span class="ipp-ly-rc"><span class="ipp-ly-dot is-' + dotOf(id, PR) + '"></span></span>' +
      '</div>';
    if (open) h += openHtml(id);
    return h + '</div>';
  }
  // v1.0.24 — the end of a group: the mark, drawn where the group ends. Not a row. v1.0.28: a half-height bar.
  // v1.0.24 — the end of a group: the mark, drawn where the group ends. Not a row. v1.0.35: a hairline with the label.
  function endHtml(opener) {
    var s = ROWS[opener], off = LOCKED || SAVING, name = rowTitle(s);
    var handle = off ? '<span class="ipp-ly-h ipp-ly-lock">' + LOCK + '</span>'
      : '<button type="button" class="ipp-ly-h" data-ly-ehandle="' + opener + '" aria-label="Move the end of ' + esc(name) + ' (drag, or Arrow Up and Arrow Down)">' + GRIP + '</button>';
    return '<div class="ipp-ly-tile is-end ipp-ly-gfoot' + (changed(opener) ? ' ipp-dirty' : '') + '" data-ly-end="' + opener + '" role="listitem"><div class="ipp-ly-tr">' + handle +
      '<span></span><span class="ipp-ly-gl is-end">end \u00b7 ' + esc(name) + '</span><span></span></div></div>';
  }
  // v1.0.35 — one line per block (see the file head)
  function rowHtml(id, i, inside) {
    var s = ROWS[id], ch = changed(id), pin = pinned(id) || LOCKED, open = SEL === id, nu = isNew(id);
    var cls = 'ipp-ly-tile' + (isBanner(s) ? ' is-banner' : '') + (ch ? ' ipp-dirty' : '') + (open ? ' is-open' : '') + (FAILS[id] ? ' is-failed' : '') +
      (REMOVE[id] ? ' is-removing' : '') + (isOpenArt(s) ? ' is-openart' : '') + (nu ? ' is-new' : '') + (inside ? ' is-inside' : '') + (inAtSponsored(id) ? ' is-blocked' : '');
    var handle = pin
      ? '<span class="ipp-ly-h ipp-ly-lock">' + LOCK + '</span>'
      : '<button type="button" class="ipp-ly-h" data-ly-handle="' + id + '" aria-label="Move ' + esc(rowTitle(s)) + ' (drag, or Arrow Up and Arrow Down)">' + GRIP + '</button>';
    var sub = FAILS[id] ? 'Not saved: ' + FAILS[id] : (inAtSponsored(id) ? (s.section && s.section.name ? s.section.name : 'This section') + ' is sponsored this issue, so it cannot sit in Around Town. Move it to its own tile.' : rowSub(s));
    var bad = !!FAILS[id] || inAtSponsored(id);
    var h = '<div class="' + cls + '" data-ly-row="' + id + '" role="listitem">' +
      '<div class="ipp-ly-tr">' + handle +
      '<span class="ipp-ly-pos" title="' + (nu ? 'Not saved yet' : 'Saved position ' + esc(posText(ORIG.pos[id]))) + '">' + (i + 1) + '</span>' +
      '<button type="button" class="ipp-ly-main" data-ly-sel="' + id + '" aria-expanded="' + open + '">' +
        (isBanner(s) && s.asset && s.asset.thumb ? '<img class="ipp-ly-thumb" src="' + esc(s.asset.thumb) + '" alt="" loading="lazy">' : '') +   // v1.0.36
        '<span class="ipp-ly-t' + kindCls(s) + (rowTitleEmpty(s) ? ' is-empty' : '') + '">' + esc(tileName(s)) + '</span>' +
        (sub ? '<span class="ipp-ly-s' + (bad ? ' is-bad' : '') + '" title="' + esc(sub) + '">' + esc(sub) + '</span>' : '') +
      '</button>' +
      '<span class="ipp-ly-rc">' + tagHtml(s) + '<span class="ipp-ly-dot is-' + dotOf(id, PR) + '"></span></span>' +
      '</div>';
    if (open) h += openHtml(id);
    return h + '</div>';
  }

  // v1.0.24 — the Add row under the stack: one fixed button per addable kind (HC-P-L24-1)
  function addRowHtml() {
    if (LOCKED) return '';
    var kinds = addable(); if (!kinds.length) return '';
    return '<div class="ipp-ly-addrow"><span class="ipp-ly-addk">Add</span>' + kinds.map(function (e) {
      return '<button type="button" class="ipp-ly-addb" data-ly-add="' + esc(e.key) + '" title="Add ' + esc(e.name) + (e.opener ? ' as an empty group' : '') + '"' + (SAVING ? ' disabled' : '') + '>' + esc(e.name) + '</button>';
    }).join('') + '</div>';
  }

  // v1.0.10 — the opened tile is for checking the content (HC-P-LT-5)
  function miss(what) { return '<span class="ipp-ly-miss">No ' + esc(what) + '</span>'; }
  function val(v, what) { return v ? esc(v) : miss(what); }
  function pic(url, cls) { return url ? '<img class="' + cls + '" src="' + esc(url) + '" alt="" loading="lazy">' : '<span class="' + cls + ' is-missing">No picture</span>'; }
  function line(k, v) { return '<dt class="ipp-ly-rk">' + esc(k) + '</dt><dd class="ipp-ly-rv">' + v + '</dd>'; }   // v1.0.35: a definition list
  function has(o, k) { return o && Object.prototype.hasOwnProperty.call(o, k); }   // v1.0.45 boards lack the review facts
  function evHtml(it) {
    var g = '<span class="ipp-ly-rn">' + esc(it.name || 'No name') + '</span>';
    if (has(it, 'when')) {
      var when = it.when ? esc(it.when) + ' \u00b7 ' + (it.time ? esc(it.time) + (it.endTime ? ' to ' + esc(it.endTime) : '') : miss('start time')) : miss('date');
      g += line('When', when) + line('Where', val(it.venue, 'venue')) +
        line('About', it.teaser ? esc(it.teaser) : miss('description')) + line('Link', it.hasLink ? 'Yes' : miss('link'));
    }
    return '<div class="ipp-ly-card2">' + pic(it.thumb, 'ipp-ly-rp') + '<div class="ipp-ly-rg">' + g + '</div></div>';
  }
  function reHtml(it) {
    var g = '<span class="ipp-ly-rn">' + esc(it.name || 'No address') + '</span>';
    if (has(it, 'price')) {
      var price = it.price ? esc(it.price) : (it.priceHidden ? 'Price hidden' : miss('price'));
      var size = [it.beds ? it.beds + ' bd' : '', it.baths ? it.baths + ' ba' : '', it.sqft ? it.sqft + ' sq ft' : ''].filter(Boolean).join(' \u00b7 ');
      g += line('Price', price) + line('Home', size ? esc(size) : miss('beds or baths')) +
        line('Agent', [it.agent, it.brokerage].filter(Boolean).map(esc).join(' \u00b7 ') || miss('agent')) +
        line('About', it.teaser ? esc(it.teaser) : miss('description')) + line('Link', it.hasLink ? 'Yes' : miss('link'));
    }
    return '<div class="ipp-ly-card2">' + pic(it.thumb, 'ipp-ly-rp') + '<div class="ipp-ly-rg">' + g + '</div></div>';
  }
  // v1.0.10 — the opened tile is for checking the content (HC-P-LT-5). v1.0.35: it also holds the type, the design and the links.
  function openHtml(id) {
    var s = ROWS[id], a = s.asset || null, off = (LOCKED || SAVING) ? ' disabled' : '', h = '<div class="ipp-ly-open">';
    var typeTxt = isOpenArt(s) ? '<span class="ipp-ly-fv is-off">Takes the type of the article you place</span>'
      : (CUR.type[id] ? '<span class="ipp-ly-fv' + (typeClash(id) ? ' is-bad' : '') + '">' + esc(CUR.type[id]) + (typeClash(id) ? ' (this is ' + aOrAn(artType(s)) + ' article)' : '') + '</span>'
      : '<span class="ipp-ly-fv is-bad">' + (isArticle(s) ? 'No type: set the article\u2019s Section' : 'No type') + '</span>');
    var showType = !isWeather(s) && !isGreeting(s) && !REMOVE[id];
    var showDesign = !isWeather(s) && !REMOVE[id] && !isOpenArt(s);
    if (showType) h += '<div class="ipp-ly-fld"><span class="ipp-ly-fk">Type</span>' + typeTxt + '</div>';
    if (showDesign) h += '<div class="ipp-ly-fld"><span class="ipp-ly-fk">Design</span>' + designCtl(id, s, off) + '</div>';
    if (inAtSponsored(id)) h += '<p class="ipp-ly-msg is-bad">' + esc((s.section && s.section.name) || 'This section') + ' is sponsored this issue by ' + esc(s.sponsor.name) + '. A sponsored story prints as its own tile with the sponsor\u2019s banner under it, so it cannot sit inside Around Town. Drag it out of the group.</p>';
    if (isWeather(s)) {
      var w = wxSay();
      h += '<p class="ipp-ly-wx is-' + (REMOVE[id] ? 'wait' : w.tone) + '">' + esc(REMOVE[id] ? 'Removed on Save. The email will have no weather strip.' : (w.pill + (w.text ? ' \u00b7 ' + w.text : ''))) + '</p>';   // v1.0.24
    } else if (REMOVE[id]) {
      h += '<p class="ipp-ly-msg">Removed on Save. Its contents stay on the Picker.</p>';
    } else if (isList(s)) {
      var items = s.items || [];
      if (!items.length) h += '<p class="ipp-ly-msg">' + (Number(s.listCount) ? plural(Number(s.listCount), ['item', 'items']) + ' chosen; this Data Worker does not list them.' : 'Nothing is chosen yet. Choose items on the Picker.') + '</p>';
      items.forEach(function (it) {
        if (it.missing) h += '<p class="ipp-ly-msg is-bad">An item in this block was not found (' + esc(it.id) + ').</p>';
        else h += s.assetType === 'event' ? evHtml(it) : s.assetType === 're' ? reHtml(it)
          : '<div class="ipp-ly-card2">' + pic(it.thumb, 'ipp-ly-rp') + '<div class="ipp-ly-rg"><span class="ipp-ly-rn">' + esc(it.name || 'No name') + '</span></div></div>';
      });
    } else if (isBanner(s)) {
      h += a ? '<div class="ipp-ly-banbig">' + pic(a.thumb, 'ipp-ly-bp') + '</div><dl class="ipp-ly-chkg">' +
          line('Ad', esc(a.name || '')) + (has(a, 'hasLink') ? line('Link', a.hasLink ? 'Yes' : miss('link')) : '') + '</dl>'
        : '<p class="ipp-ly-msg">No ad is placed here yet. Place one on Revenue.</p>';
    } else if (isArticle(s)) {
      var inside = s.inside || [];
      h += a ? '<dl class="ipp-ly-chkg">' +
          line('By', [a.writer, a.customer].filter(Boolean).map(esc).join(' \u00b7 ') || miss('byline')) +
          (has(a, 'dek') ? line('Summary', a.dek ? esc(a.dek) : miss('summary')) : '') +
          line('Picture', (a.ogSrc || a.thumb) ? pic(a.ogSrc || a.thumb, 'ipp-ly-rp') : miss('picture')) +
          (s.sponsor && s.sponsor.name ? line('Sponsor', esc(s.sponsor.name) + ' (set on Revenue)') : '') +
          (inside.length ? line('Inside', esc(inside.map(insideText).join('  \u00b7  '))) : '') +
          '</dl>'
        : '<p class="ipp-ly-msg">No article is placed here yet. Place one on the Picker.</p>';
    } else if (isGreeting(s)) {
      var g = s.greeting || {}, words = String(g.paragraph || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
      var para = words.slice(0, 24).join(' ') + (words.length > 24 ? '\u2026' : '');
      h += '<dl class="ipp-ly-chkg">' + line('Title', g.title && g.title.trim() ? esc(g.title.trim()) : miss('title (masthead)')) +
           line('Short greeting', grText(g.supershort) ? esc(grText(g.supershort)) : miss('short greeting (email)')) +
           line('Opening', para ? esc(para) : miss('paragraph (web page)')) + '</dl>';   // v1.0.35: the title is required (S2 ruling 1)
    } else if (isOpener(s)) {
      h += '<p class="ipp-ly-msg">' + plural(CUR.size[id] || 0, ['story', 'stories']) + ' in this group. Drag the end bar to grow or shrink it.</p>';
    } else {
      h += '<p class="ipp-ly-msg">Nothing to check in this block.</p>';
    }
    // the foot: Cancel (this tile's change) · Close · Remove
    var canRm = !REMOVE[id] && !LOCKED && !SAVING && !removeWhy(id), nu = isNew(id);
    var foot = (changed(id) && !SAVING && ownEdit(id) ? '<button type="button" class="ipp-ly-cx" data-ly-cancel="' + id + '">Cancel</button>' : '') +
      '<button type="button" class="ipp-ly-cl" data-ly-close="' + id + '">Close</button>' +
      (!REMOVE[id] && !LOCKED && !SAVING && !isGreeting(s) && !nu
        ? '<button type="button" class="ipp-ly-rm' + (canRm ? '' : ' is-off') + '" data-ly-rm="' + id + '" title="' + esc(canRm ? (isOpener(s) ? 'Remove this block from this edition (its contents stay)' : 'Remove this block from this edition') : removeWhy(id)) + '">Remove</button>'
        : '');
    return h + '<div class="ipp-ly-foot">' + foot + '</div></div>';
  }

  // v1.0.6 — notes, not fixes (HC-P-M206-17)
  function headsUp() {
    var out = [], gr = -1;
    CUR.order.forEach(function (id, i) { if (gr < 0 && isGreeting(ROWS[id])) gr = i; });
    if (gr > 0) CUR.order.slice(0, gr).forEach(function (id, i) {
      if (ROWS[id] && ROWS[id].assetType === AD) out.push({ id: id, pos: i + 1, text: (id === leadId() ? 'The Lead banner' : 'A banner') + ' is above the Greeting.' });
    });
    return out;
  }
  // v1.0.35 — D15: the block types the title has designs for that this plan does not use
  function unusedKinds() {
    var dc = (BOARD && BOARD.designChoices) || {}, used = {}, out = [];
    CUR.order.forEach(function (id) { if (!REMOVE[id] && CUR.type[id]) used[String(CUR.type[id]).toUpperCase()] = 1; });
    var cat = (BOARD && BOARD.catalog) || [], add = addable();
    Object.keys(dc).forEach(function (label) {
      if (!(dc[label] || []).length || used[String(label).toUpperCase()]) return;
      var e = null;
      for (var i = 0; i < cat.length; i++) if (cat[i].add === label || (cat[i].labels || []).indexOf(label) >= 0) { e = cat[i]; break; }
      var canAdd = !!(e && add.some(function (x) { return x.key === e.key; }));
      out.push({ label: label, name: (e && e.name) || label, key: canAdd ? e.key : '', side: e && e.side });
    });
    out.sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
    return out;
  }
  function unusedHtml() {
    var u = unusedKinds(); if (!u.length) return '';
    return '<div class="ipp-ly-card ipp-ly-unused"><div class="ipp-ly-k">Not in this issue</div><p>The title has designs for these, and this plan uses none.</p><ul>' +
      u.map(function (k) {
        var right = k.key ? '<button type="button" data-ly-add="' + esc(k.key) + '"' + (LOCKED || SAVING ? ' disabled' : '') + '>Add</button>'
          : '<span class="is-no">' + (k.side === 'revenue' ? 'on Revenue' : 'on the Picker') + '</span>';   // HC-P-L35-3
        return '<li><span>' + esc(k.name) + '</span>' + right + '</li>';
      }).join('') + '</ul></div>';
  }
  function checkHtml(pr) {
    var hu = headsUp();
    var notes = hu.length ? '<div class="ipp-ly-k ipp-ly-k--hu">Heads up</div><ul class="ipp-ly-hu">' +
      hu.map(function (p) { return '<li><button type="button" data-ly-sel="' + p.id + '"><span class="ipp-ly-n">' + p.pos + '</span>' + esc(p.text) + '</button></li>'; }).join('') + '</ul>' : '';   // v1.0.26
    var check = !pr.length ? (hu.length ? '<div class="ipp-ly-card ipp-ly-check is-note">' + notes.replace('ipp-ly-k ipp-ly-k--hu', 'ipp-ly-k') + '</div>' : '')   // v1.0.14
      : '<div class="ipp-ly-card ipp-ly-check"><div class="ipp-ly-k">Before Publish \u00b7 ' + plural(pr.length, ['block', 'blocks']) + ' to fix</div><ul>' +
        pr.map(function (p) { return '<li><button type="button" data-ly-sel="' + p.id + '"><span class="ipp-ly-n">' + p.pos + '</span>' + esc(p.text) + '</button></li>'; }).join('') + '</ul>' + notes + '</div>';   // v1.0.26
    return check + unusedHtml() + '<p class="ipp-ly-how">Click a block to check it or change its design. Drag the dots to reorder.</p>';   // v1.0.35
  }
  function paintTab(pr) {
    var total = CUR ? CUR.order.length : 0, fit = total - pr.length;
    document.querySelectorAll('.ipp-switcher button[data-view="layout"]').forEach(function (b) {
      if (!b.querySelector('.ipp-ly-tabname')) b.innerHTML = '<span class="ipp-ly-tabname">' + esc(b.textContent.trim() || 'Layout') + '</span><span class="ipp-ly-tabn"></span><span class="ipp-ly-tabdot" hidden></span>';
      b.classList.add('ipp-ly-tab');
      b.querySelector('.ipp-ly-tabn').textContent = total ? fit + '/' + total : '';
      b.querySelector('.ipp-ly-tabdot').hidden = !pr.length;
      b.setAttribute('aria-label', 'Layout' + (total ? ', ' + fit + ' of ' + total + ' designs fit' : '') + (pr.length ? ', needs attention' : ''));
    });
  }
  function savebar() {
    var v = view(); if (!v) return null;
    var bar = v.querySelector('.ipp-ly-bar');
    if (!bar) { bar = document.createElement('div'); bar.className = 'ipp-ly-bar'; bar.innerHTML = '<span class="dot"></span><span class="stat"></span>'; v.appendChild(bar); }
    var box = bar.querySelector('.ipp-ly-actions');
    if (!box) {
      box = document.createElement('span'); box.className = 'ipp-ly-actions';
      box.innerHTML = '<span class="ipp-ly-ed"></span><button type="button" class="ix-revert" data-ly-cancel-all hidden>Cancel all</button>' +
        '<button type="button" class="ix-btn ix-btn--primary" data-ly-save disabled>Save</button>';
      bar.appendChild(box);
      box.addEventListener('click', function (e) {
        if (e.target.closest('[data-ly-cancel-all]')) cancelAll();
        else if (e.target.closest('[data-ly-save]')) save();
      });
    }
    return bar;
  }
  function paintSavebar() {
    var bar = savebar(); if (!bar) return;
    var n = CUR ? changedIds().length : 0;
    var stat = bar.querySelector('.stat');
    if (stat) stat.textContent = SAVING ? 'Saving\u2026' : (LOCKED ? 'This plan is locked. Layout is read-only.' : (n ? plural(n, ['block', 'blocks']) + ' changed, not saved' : 'No unsaved changes'));
    bar.classList.toggle('ipp-dirty', n > 0); bar.classList.toggle('saving', SAVING);
    var edLine = '';
    if (n && !SAVING && CUR) {
      var ep = editionPlan();
      if (EDS.state === 'loading') edLine = 'Reading the other editions\u2026';
      else if (EDS.state === 'error') edLine = 'Other editions could not be read (' + EDS.error + '). Save changes this edition only.';
      else if (ep.open.length) edLine = 'Save also applies it to ' + ep.open.join(', ') + '.';
      if (ep.locked.length) edLine += (edLine ? ' ' : '') + ep.locked.join(', ') + (ep.locked.length === 1 ? ' is' : ' are') + ' locked.';
    }
    var el = bar.querySelector('.ipp-ly-ed'); if (el) el.textContent = edLine;
    var sv = bar.querySelector('[data-ly-save]'), ca = bar.querySelector('[data-ly-cancel-all]');
    if (sv) { sv.disabled = !n || SAVING || LOCKED || EDS.state === 'loading'; sv.textContent = SAVING ? 'Saving\u2026' : (n ? 'Save ' + plural(n, ['change', 'changes']) : 'Save'); }
    if (ca) ca.hidden = !n || SAVING;
  }
  // ── v1.0.12 Preview ("Compile light": assembles and renders, saves nothing) ──
  var PV = { state: 'idle', at: 0, planId: '', email: null, web: null, weather: null, skipped: [], error: '', split: 'even' };
  var LAST_SAVE = 0, PV_AUTO = '';                  // when Layout last saved, to tell when the preview is behind
  var PV_W = { email: 640, web: 1100 };   // the width each page is drawn at before it is scaled to fit
  function previewUrl() {
    var w = window.PP_WEBHOOKS || {}, pb = String(w.planBoard || '');
    return String(w.preview || (pb ? pb.replace(/\/plan-board.*$/, '/preview') : ''));
  }
  function nlId() {
    var el = document.querySelector('.newsletter-source [data-nl-id]');
    var v = el ? String(el.getAttribute('data-nl-id') || '').trim() : '';
    if (v) return v;
    var list = (BOARD && ((BOARD.publish && BOARD.publish.newsletters) || (BOARD.splash && BOARD.splash.newsletters))) || [];
    return list.length === 1 ? String(list[0].id || '') : '';
  }
  function runPreview() {
    if (PV.state === 'loading' || !BOARD || !BOARD.plan) return;
    var url = previewUrl(), n = nlId(), pid = BOARD.plan.id;
    if (!url) { PV.state = 'error'; PV.error = 'This page has no preview address (PP_WEBHOOKS.preview or planBoard).'; paintPreview(true); return; }
    if (!n) { PV.state = 'error'; PV.error = 'This plan has no single newsletter to preview.'; paintPreview(true); return; }
    PV.state = 'loading'; PV.error = ''; paintPreview(false);
    fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 'contextNlId=' + encodeURIComponent(n) + '&parentId=' + encodeURIComponent(pid) + '&fresh=1',
      { method: 'GET', credentials: 'omit' })
      .then(function (r) { return r.json().catch(function () { throw new Error('the preview answer was not JSON (HTTP ' + r.status + ')'); }); })
      .then(function (j) {
        if (!j || !j.ok) throw new Error((j && j.error) || 'the preview failed');
        PV = { state: 'ok', at: Date.now(), planId: pid, email: j.email, web: j.web, weather: j.weather || null,
               skipped: j.skipped || [], error: '', split: PV.split };
      }, function (e) { throw e; })
      .catch(function (e) { PV.state = 'error'; PV.error = (e && e.message) || 'the preview failed'; })
      .then(function () { paintPreview(true); });
  }
  function hhmm(t) { return new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
  function behind() {
    if (PV.state !== 'ok') return '';
    var n = CUR ? changedIds().length : 0;
    if (n) return plural(n, ['change', 'changes']) + ' not saved yet. The preview shows the saved layout; Save, then Preview.';
    if (LAST_SAVE > PV.at) return 'Saved since this preview. Preview again to see it.';
    return '';
  }
  function pvShell() {
    return '<div class="ipp-ly-pvh"><span class="ipp-ly-k">Preview</span><span class="ipp-ly-pvt"></span><span class="ipp-ly-sp1"></span>' +
      '<span class="ipp-ly-seg" role="group" aria-label="Preview width">' +
        '<button type="button" data-ly-split="email">Email</button><button type="button" data-ly-split="even">Even</button><button type="button" data-ly-split="web">Web</button></span>' +
      '<button type="button" class="ix-btn ix-btn--secondary ipp-ly-pvgo" data-ly-preview>Preview</button></div>' +
      '<p class="ipp-ly-pvnote" hidden></p>' +
      '<div class="ipp-ly-panes">' +
        '<div class="ipp-ly-pane" data-pv="email"><div class="ipp-ly-pnh"><span>Email</span><span class="ipp-ly-pnm"></span></div><div class="ipp-ly-pvs"><div class="ipp-ly-pvz"></div></div></div>' +
        '<div class="ipp-ly-pane" data-pv="web"><div class="ipp-ly-pnh"><span>Web</span><span class="ipp-ly-pnm">title page</span></div><div class="ipp-ly-pvs"><div class="ipp-ly-pvz"></div></div></div>' +
      '</div><p class="ipp-ly-pvfoot">Preview saves nothing. Compile on Publish is the final, saved version.</p>';
  }
  // Paint the preview's header and note; rebuild the two pages only when asked (a new answer).
  function paintPreview(rebuild) {
    var c = canvas(), box = c && c.querySelector('.ipp-ly-pv'); if (!box) return;
    if (!box.firstChild) box.innerHTML = pvShell();
    var t = box.querySelector('.ipp-ly-pvt');
    t.textContent = PV.state === 'loading' ? 'Rendering\u2026' : PV.state === 'ok' ? 'Made ' + hhmm(PV.at) : '';
    var go = box.querySelector('[data-ly-preview]');
    go.disabled = PV.state === 'loading'; go.textContent = PV.state === 'loading' ? 'Previewing\u2026' : 'Preview';
    Array.prototype.forEach.call(box.querySelectorAll('[data-ly-split]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-ly-split') === PV.split)); });
    box.querySelector('.ipp-ly-panes').setAttribute('data-split', PV.split);
    var note = box.querySelector('.ipp-ly-pvnote'), nb = PV.state === 'error' ? 'The preview could not be made: ' + PV.error : behind();
    note.hidden = !nb; note.textContent = nb; note.className = 'ipp-ly-pvnote' + (PV.state === 'error' ? ' is-bad' : ' is-behind');
    var em = box.querySelector('[data-pv="email"] .ipp-ly-pnm');
    em.textContent = PV.state === 'ok' && PV.email && PV.email.bytes ? Math.round(PV.email.bytes / 102.4) / 10 + ' KB' : '600 px';
    if (rebuild) ['email', 'web'].forEach(function (k) { drawPane(box, k); });
    shadePanes();
  }
  function drawPane(box, k) {
    var z = box.querySelector('[data-pv="' + k + '"] .ipp-ly-pvz'); if (!z) return;
    var part = PV[k];
    if (PV.state !== 'ok' || !part) { z.innerHTML = '<p class="ipp-ly-pvempty">' + (PV.state === 'loading' ? 'Rendering\u2026' : 'Press Preview to see this issue as Compile will make it.') + '</p>'; return; }
    if (!part.html) { z.innerHTML = '<p class="ipp-ly-pvempty is-bad">' + esc(k === 'email' ? 'Email' : 'Web') + ' did not render: ' + esc(part.error || 'no page came back') + '</p>'; return; }
    z.innerHTML = '';
    var f = document.createElement('iframe');
    f.className = 'ipp-ly-pvf'; f.setAttribute('sandbox', 'allow-same-origin'); f.setAttribute('title', k + ' preview');
    f.style.width = PV_W[k] + 'px';
    f.addEventListener('load', function () {
      fitPane(z); shadePanes();
      try { f.contentDocument.addEventListener('click', function () { closeOpen(); }); } catch (e) {}   // v1.0.13: a click in a page closes the tile
    });
    f.srcdoc = part.html;
    z.appendChild(f);
  }
  function fitPane(z) {
    var f = z && z.querySelector('iframe'); if (!f) return;
    var doc; try { doc = f.contentDocument; } catch (e) { doc = null; }
    if (!doc || !doc.documentElement) return;
    var w = parseInt(f.style.width, 10) || 600, h = Math.max(doc.documentElement.scrollHeight, doc.body ? doc.body.scrollHeight : 0);
    var room = z.parentNode ? z.parentNode.clientWidth - 2 : 0;
    if (room <= 0 || !h) return;                                  // v1.0.21: hidden; measured again when shown
    var s = Math.min(1, room / w);
    f.style.height = h + 'px'; f.style.transform = 'scale(' + s + ')';
    z.style.height = Math.ceil(h * s) + 'px'; z.setAttribute('data-scale', String(s));
  }
  function fitAll() { var c = canvas(); if (!c) return; Array.prototype.forEach.call(c.querySelectorAll('.ipp-ly-pvz'), fitPane); shadePanes(); }
  // The open tile's block, shaded in both pages (markers from newsletter-render v1.19.0).
  function samePos(a, b) { return Math.abs(Number(a) - Number(b)) < 0.001; }
  function shadePanes() {
    var c = canvas(); if (!c) return;
    var pos = SEL && ORIG && own(ORIG.pos, SEL) ? ORIG.pos[SEL] : null, missing = '';
    Array.prototype.forEach.call(c.querySelectorAll('.ipp-ly-pvz'), function (z) {
      var f = z.querySelector('iframe'), doc; try { doc = f && f.contentDocument; } catch (e) { doc = null; }
      if (!doc || !doc.body) return;
      var old = doc.getElementById('ix-ly-shade'); if (old) old.parentNode.removeChild(old);
      if (pos == null) return;
      var tw = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT), n, start = null, end = null;
      while ((n = tw.nextNode())) {
        var m = /^INBXIFY block:(.*)$/.exec(n.nodeValue);
        if (!start && m && m[1].split(',').some(function (p) { return p !== '' && samePos(p, pos); })) { start = n; continue; }
        if (start && /^INBXIFY \/block$/.test(n.nodeValue)) { end = n; break; }
      }
      if (!start || !end) { missing = 'yes'; return; }
      var r = doc.createRange(); r.setStartAfter(start); r.setEndBefore(end);
      var b = r.getBoundingClientRect(), sx = doc.defaultView.scrollX, sy = doc.defaultView.scrollY;
      if (!b.height) { missing = 'yes'; return; }
      var o = doc.createElement('div'); o.id = 'ix-ly-shade';
      o.setAttribute('style', 'position:absolute;pointer-events:none;z-index:99999;box-sizing:border-box;border:3px solid #EC7259;background:rgba(236,114,89,.16);border-radius:4px;' +
        'left:' + (b.left + sx - 3) + 'px;top:' + (b.top + sy - 3) + 'px;width:' + (b.width + 6) + 'px;height:' + (b.height + 6) + 'px');
      doc.body.appendChild(o);
      var s = Number(z.getAttribute('data-scale')) || 1, sc = z.parentNode;
      sc.scrollTop = Math.max(0, (b.top + sy) * s - 40);
    });
    var note = c.querySelector('.ipp-ly-pvsel');
    if (!note) { var host = c.querySelector('.ipp-ly-pvfoot'); if (host) { note = document.createElement('p'); note.className = 'ipp-ly-pvsel'; host.parentNode.insertBefore(note, host); } }
    if (note) {
      var why = '';
      if (pos != null && PV.state === 'ok' && missing) {
        var sk = (PV.skipped || []).filter(function (x) { return x.id === SEL; })[0];
        why = 'Block ' + (CUR.order.indexOf(SEL) + 1) + ' is not in this preview' + (sk && sk.why ? ': ' + sk.why : (changed(SEL) ? ': it has unsaved changes.' : '.'));
      }
      note.hidden = !why; note.textContent = why;
    }
  }
  var PV_RO = null;
  function watchPanes(c) {
    if (PV_RO || !window.ResizeObserver) return;
    PV_RO = new ResizeObserver(function () { fitAll(); });
    PV_RO.observe(c);                                             // v1.0.21: the canvas itself, shown or resized
    Array.prototype.forEach.call(c.querySelectorAll('.ipp-ly-pvs'), function (el) { PV_RO.observe(el); });
  }

  function paint() {
    var c = canvas(); if (!c) return;
    if (!c.querySelector('.ipp-ly')) {
      c.innerHTML = '<div class="ipp-ly"><div class="ipp-ly-head"><h2 class="ipp-ly-h2">Layout</h2><span class="ipp-ly-hint"></span><span class="ipp-ly-info"></span><span class="ipp-ly-state" hidden></span></div>' +   // v1.0.35: the one sentence
        '<div class="ipp-ly-msgline" hidden></div><div class="ipp-ly-body"><div class="ipp-ly-stack" role="list"></div><div class="ipp-ly-side"></div></div></div>';
      wire(c);
    }
    var root = c.querySelector('.ipp-ly');
    root.querySelector('.ipp-ly-info').innerHTML = info();
    root.querySelector('.ipp-ly-hint').textContent = LOCKED ? 'This plan is locked. Unlock it in Pub Plans to change its layout.' : '';   // v1.0.24: the ⓘ badge carries the how-to
    var msg = root.querySelector('.ipp-ly-msgline');
    var text = ERR ? 'The plan could not be read: ' + ERR : NOTE;
    msg.hidden = !text; msg.textContent = text; msg.classList.toggle('is-bad', !!ERR || /^Not /.test(NOTE));
    var stack = root.querySelector('.ipp-ly-stack'), keep = stack.scrollTop;
    var side = root.querySelector('.ipp-ly-side'), fresh = false;                          // v1.0.12: Before Publish + Preview
    if (!side.querySelector('.ipp-ly-chk')) { side.innerHTML = '<div class="ipp-ly-chk"></div><div class="ipp-ly-card ipp-ly-pv"></div>'; fresh = true; }
    if (!CUR) { stack.innerHTML = '<p class="ipp-ly-wait">' + (ERR ? '' : 'Reading the plan\u2026') + '</p>'; side.querySelector('.ipp-ly-chk').innerHTML = ''; paintSavebar(); return; }
    PR = problems();                                                                       // v1.0.35: the dots read it
    var html = '', list = displayList(), opener = '';
    list.forEach(function (it) {
      if (it.kind === 'end') { html += endHtml(it.id) + '</div>'; opener = ''; return; }
      if (isOpener(ROWS[it.id]) && !REMOVE[it.id]) { html += '<div class="ipp-ly-pair" data-ly-pair="' + it.id + '"' + pairTint(it.id) + '>' + openerHtml(it.id, it.i); opener = it.id; return; }   // v1.0.28: the bracket's top bar
      html += rowHtml(it.id, it.i, it.inside);
    });
    if (opener) html += '</div>';
    stack.innerHTML = (html || '<p class="ipp-ly-wait">This plan has no blocks yet. Add them on the Picker.</p>') + addRowHtml();   // v1.0.24
    stack.scrollTop = keep;
    var pr = PR;
    side.querySelector('.ipp-ly-chk').innerHTML = checkHtml(pr);
    var st = root.querySelector('.ipp-ly-state');                                           // v1.0.35 (HC-P-L35-2)
    if (st) { st.hidden = !CUR.order.length; st.classList.toggle('is-bad', !!pr.length);
      st.innerHTML = '<span class="ipp-ly-dot is-' + (pr.length ? 'wait' : 'ok') + '"></span>' + (pr.length ? esc(plural(pr.length, ['block', 'blocks']) + ' to fix before Publish') : 'Every block has a design. Nothing to fix.'); }
    paintPreview(fresh); watchPanes(c);                                       // v1.0.21: every paint (it sets up once)
    paintTab(pr); paintSavebar();
  }

  // v1.0.1 — while Layout is open, its tray is the only one on screen.
  function otherTrays(hide) {
    var root = window.IPP && IPP.root ? IPP.root() : null;
    Array.prototype.slice.call(document.querySelectorAll('.ipp-savebar')).forEach(function (b) {
      if (hide) {
        if (!b.hasAttribute('data-ly-hid')) b.setAttribute('data-ly-hid', b.style.display || '');
        b.style.setProperty('display', 'none', 'important');
        return;
      }
      if (!b.hasAttribute('data-ly-hid')) return;
      var was = b.getAttribute('data-ly-hid'); b.removeAttribute('data-ly-hid');
      // inside the IPP the shell has just set it for the new view; outside, put it back
      if (root && root.contains(b)) { if (b.style.getPropertyPriority('display') === 'important') b.style.removeProperty('display'); }
      else b.style.display = was;
    });
  }

  // ── events ────────────────────────────────────────────────
  // v1.0.13 — a click outside the open tile puts the page back to default
  function closeOpen() { if (SEL) { SEL = ''; paint(); } }
  var OFF_WIRED = false;
  function wireOff() {
    if (OFF_WIRED) return; OFF_WIRED = true;
    document.addEventListener('click', function (e) {
      if (!SEL) return;
      var v = view(); if (!v || v.hidden || !v.offsetParent) return;            // Layout not on screen
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('[data-ly-row="' + SEL + '"]')) return;                       // inside the open tile
      if (t.closest('[data-ly-sel]')) return;                                      // a tile or a Before Publish line: its own handler decides
      if (t.closest('[data-ly-preview], [data-ly-split]')) return;                 // Preview controls keep the shading
      if (t.closest('select')) return;                                             // a dropdown is mid-choice; redrawing would drop it
      closeOpen();
    });
  }
  function wire(c) {
    wireOff();
    c.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-ly-cancel]'))) { e.preventDefault(); cancelRow(b.getAttribute('data-ly-cancel')); return; }
      if ((b = e.target.closest('[data-ly-rm]'))) { e.preventDefault(); removeRow(b.getAttribute('data-ly-rm')); return; }   // v1.0.5
      if ((b = e.target.closest('[data-ly-add]'))) { e.preventDefault(); addBlock(b.getAttribute('data-ly-add')); return; }  // v1.0.24
      if ((b = e.target.closest('[data-ly-dpick]'))) { e.preventDefault(); if (!b.disabled) setDesign(b.getAttribute('data-ly-dpick'), b.getAttribute('data-ly-design')); return; }   // v1.0.35: a pill
      if ((b = e.target.closest('[data-ly-close]'))) { e.preventDefault(); closeOpen(); return; }   // v1.0.35
      if (e.target.closest('select')) return;                                               // v1.0.10: dropdowns answer on change
      if ((b = e.target.closest('[data-ly-preview]'))) { runPreview(); return; }              // v1.0.12
      if ((b = e.target.closest('[data-ly-split]'))) { PV.split = b.getAttribute('data-ly-split'); paintPreview(false); requestAnimationFrame(fitAll); return; }
      if ((b = e.target.closest('[data-ly-sel]'))) {
        var id = b.getAttribute('data-ly-sel'), fromList = !b.classList.contains('ipp-ly-main');
        SEL = (SEL === id && !fromList) ? '' : id; paint();                               // v1.0.8: a tile click toggles; a Before Publish line opens
        if (SEL && fromList) { var t = c.querySelector('[data-ly-row="' + SEL + '"]'); if (t) t.scrollIntoView({ block: 'nearest' }); }
        return;
      }
    });
    c.addEventListener('change', function (e) {                                           // v1.0.10: type and design on the tile
      var t = e.target;
      if (t.hasAttribute('data-ly-tsel')) setType(t.getAttribute('data-ly-tsel'), t.value);
      else if (t.hasAttribute('data-ly-dsel') && t.value) setDesign(t.getAttribute('data-ly-dsel'), t.value);
    });
    c.addEventListener('keydown', function (e) {                                          // v1.0.8: Esc closes the open tile
      if (e.key === 'Escape' && SEL) { var was = SEL; SEL = ''; paint(); var m = c.querySelector('[data-ly-sel="' + was + '"]'); if (m) m.focus({ preventScroll: true }); }
    });
    // v1.0.24 — a handle is a block's (data-ly-handle) or an end tile's (data-ly-ehandle)
    function whatOf(h) { return h.hasAttribute('data-ly-ehandle') ? { kind: 'end', id: h.getAttribute('data-ly-ehandle') } : { kind: 'block', id: h.getAttribute('data-ly-handle') }; }
    function itemIndex(what) {
      var list = displayList().filter(function (it) { return !(it.kind === what.kind && it.id === what.id) && !(what.kind === 'block' && it.inside === what.id); });
      // where the item sits now, as a gap in the list without it
      var full = displayList(), k = -1;
      for (var i = 0; i < full.length; i++) if (full[i].kind === what.kind && full[i].id === what.id) { k = i; break; }
      var g = 0; for (var j = 0; j < k; j++) { var it = full[j]; if (!(what.kind === 'block' && it.inside === what.id)) g++; }
      return { g: g, list: list };
    }
    c.addEventListener('keydown', function (e) {
      var h = e.target.closest && e.target.closest('[data-ly-handle], [data-ly-ehandle]'); if (!h) return;
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      var what = whatOf(h), now = itemIndex(what).g, d = e.key === 'ArrowUp' ? -1 : 1, g = now + d;
      // skip gaps the item may not take (an end tile outside its group, a non-groupable block inside one)
      while (g >= 0 && g <= now + 2 && g >= now - 2 && !canMoveTo(what, g).ok) g += d;
      if (moveTo(what, g)) {
        var nh = c.querySelector(what.kind === 'end' ? '[data-ly-ehandle="' + what.id + '"]' : '[data-ly-handle="' + what.id + '"]'); if (nh) nh.focus({ preventScroll: true });
      }
    });
    c.addEventListener('pointerdown', function (e) {
      var h = e.target.closest && e.target.closest('[data-ly-handle], [data-ly-ehandle]'); if (!h || LOCKED || SAVING || e.button !== 0) return;
      var what = whatOf(h), row = h.closest('.ipp-ly-tile'), stack = c.querySelector('.ipp-ly-stack');
      e.preventDefault();
      var line = document.createElement('div'); line.className = 'ipp-ly-drop'; stack.appendChild(line);
      row.classList.add('is-dragging');
      var pair = what.kind === 'block' && isOpener(ROWS[what.id]) ? row.closest('.ipp-ly-pair') : null;
      if (pair) pair.classList.add('is-dragging');
      DRAG = { what: what, to: -1, line: line, stack: stack, row: row, pair: pair, why: '' };
      try { h.setPointerCapture(e.pointerId); } catch (x) {}
      dragMove(e);
    });
    c.addEventListener('pointermove', function (e) { if (DRAG) dragMove(e); });
    c.addEventListener('pointerup', function () { if (DRAG) dragEnd(true); });
    c.addEventListener('pointercancel', function () { if (DRAG) dragEnd(false); });
  }
  function dragMove(e) {
    var d = DRAG, what = d.what;
    // the drawn items (block tiles and end tiles) in the order of displayList(), without the dragged item (and its group)
    var rows = Array.prototype.slice.call(d.stack.querySelectorAll('.ipp-ly-tile')).filter(function (r) {
      if (r === d.row) return false;
      if (d.pair && d.pair.contains(r)) return false;
      return true;
    });
    var to = rows.length;
    for (var i = 0; i < rows.length; i++) { var rc = rows[i].getBoundingClientRect(); if (e.clientY < rc.top + rc.height / 2) { to = i; break; } }
    // auto-scroll near the edges
    var sr = d.stack.getBoundingClientRect();
    if (e.clientY < sr.top + 30) d.stack.scrollTop -= 12; else if (e.clientY > sr.bottom - 30) d.stack.scrollTop += 12;
    var can = canMoveTo(what, to);
    d.to = can.ok ? to : -1; d.why = can.why || '';
    if (!can.ok) { d.line.style.display = 'none'; return; }
    var ref = rows[to] || rows[rows.length - 1], rr = ref ? ref.getBoundingClientRect() : null;
    if (!rr) { d.line.style.display = 'none'; return; }
    var y = (rows[to] ? rr.top - 4 : rr.bottom + 2) - sr.top + d.stack.scrollTop;
    d.line.style.display = ''; d.line.style.top = y + 'px';
  }
  function dragEnd(drop) {
    var d = DRAG; DRAG = null;
    if (d.line.parentNode) d.line.parentNode.removeChild(d.line);
    d.row.classList.remove('is-dragging');
    if (d.pair) d.pair.classList.remove('is-dragging');
    if (drop && d.to >= 0) moveTo(d.what, d.to);
    else if (drop && d.why) toast('Not moved', 'err', d.why);
  }

  // ── boot ──────────────────────────────────────────────────
  var MOUNTED = false;
  function mount() {
    if (MOUNTED || !view() || !canvas() || !window.IPP) return;
    MOUNTED = true;
    paint();
    document.addEventListener('ipp:board', onBoard);
    if (!IPP.board || typeof IPP.board.load !== 'function') { ERR = 'This page loads an older IPP shell. Layout needs ipp-shell-v1.6.js or later.'; paint(); }
    else if (IPP.board.data()) onBoard({ detail: { ok: true, data: IPP.board.data() } });
    else IPP.board.load().catch(function () { /* shown by onBoard */ });
    window.addEventListener('beforeunload', function (e) { if (CUR && changedIds().length) { e.preventDefault(); e.returnValue = ''; return ''; } });
    if (!blockWriter()) console.warn('[ipp-layout] PP_WEBHOOKS.blockWriter is not set; Save will refuse and say so.');
    console.info('[ipp-layout] mounted (v' + VERSION + ' \u00b7 writes through 124 reorder, layout, fill, delete)');
  }
  document.addEventListener('ipp:ready', mount);
  document.addEventListener('ipp:view', function (e) {
    var on = !!(e.detail && e.detail.view === 'layout');
    if (on) { mount(); paint(); }
    otherTrays(on);
  });
  if (document.querySelector('[data-ipp-root]')) mount();

  window.IPP = window.IPP || {};
  window.IPP.layout = { version: VERSION, save: save, cancelAll: cancelAll, mount: mount,
    pending: function () { return CUR ? changedIds() : []; }, problems: function () { return CUR ? problems() : []; },
    _positions: newPositions,
    _state: function () { return { order: CUR && CUR.order.slice(), size: CUR && Object.assign({}, CUR.size), marks: CUR ? wantMarks() : {}, list: CUR ? displayList() : [] }; },   // v1.0.24 (tests)
    _moveTo: moveTo, _add: addBlock, _remove: removeRow, _cancel: cancelRow };
})();
