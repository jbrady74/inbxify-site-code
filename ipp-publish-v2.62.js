/* ipp-publish-v2.62.js */
/* v2.62 (23 Oct 2026, Test 2 on WLN-902A): THE FIND'S LIMIT, AS THE PICKER HAS IT. v2.61 read The Find's limit from item counts on its designs, and none of The Find's designs carries one, so the empty Find still read "Pick them". The Find now uses the same rule as ipp-picker v1.58: the counts on its designs when there are any, else IX_CONFIG.findMax, else 6. So the row reads "The Find has no businesses yet. Pick up to 6, or remove the tile." And a list tile whose number has no design no longer says "Tell INBXIFY support": it reads "No design is made for this number yet. Choose one on Layout." with the button Choose designs (Jeff: self-correct, not talk-to-the-hand). Needs ipp-picker v1.58 for the Pick businesses and Add theme buttons to lead somewhere that works. CSS stays ipp-publish-v2.24.css. HARDCODING: HC-P-PK58-1 (the fallback 6, shared with ipp-picker v1.58); the new sentence joins HC-P-PUB59-1. */
/* v2.61 (23 Oct 2026, Test 2 on WLN-902A): THE FIND NAMES ITS LIMIT, FOR REAL. v2.60 looked up a block's designs under its label (s.blockLabel), but board.designChoices is keyed by the block type in capitals, which is how the Picker reads it (ipp-picker v1.57 listLabel/allowedCounts). The lookup missed, so the empty Find still read "Pick them". countsFor now reads the same key as the Picker (blockType, upper case) and falls back to the label. Nothing else changes. CSS stays ipp-publish-v2.24.css. HARDCODING: none new. */
/* v2.60 (23 Oct 2026, Compile "What's left" test on WLN-902A): EVERY JOB YOU CAN FIX, YOU FIX HERE. Jeff: "I am INBXIFY support"; a row that says "tell INBXIFY support" when the user could fix it is talk-to-the-hand. (1) A filled article tile with no type is no longer an "Our side" row. Layout never lets you type an article tile (its type comes from the article's section, ipp-layout v1.0.16), so the fix is the section: "“Test PE 002” has no section, so its tile has no type." / "“X” is in the Y section, which has no tile type.", with the button "Set section", which opens the Picker at that tile (its edit link opens the Article form). Once the section is set, the tile takes its type on its own (ix-issue-data v1.0.77). (2) An empty Find names its limit: "The Find has no businesses yet. Pick up to 6, or remove the tile." The 6 is the largest count a Find design is made for (designChoices), the same limit the Picker enforces (ipp-picker maxCount); with no count designs the sentence has no number. CSS stays ipp-publish-v2.24.css. HARDCODING: the new sentences join HC-P-PUB59-1. */
/* v2.59 (23 Oct 2026, Compile "What's left" redesign): COMPILE LISTS WHAT'S LEFT, IN PLAIN WORDS. Built to the mockup "Compile · What's left · review v0.1" (https://claude.ai/artifact/BTayYGdyXt4b4ASsdmvNNj), every board and row accepted by Jeff. (1) THE LIST. jobsModel() reads the plan and writes one job per thing left to do: one plain sentence, a detail line, one button named for the action (Add article, Choose designs, Pick events, Write greeting, Fill or remove, Set send time...). No system words: no block, slot, check, design-json, Pre-check or tab codes. Rows run First (unsaved changes, gold), Articles, Events, Real Estate, The Find, Words, Revenue, Send, then Our side (faults that are ours, never the user's, each with Check again and "tell INBXIFY support"). Each row carries its group's name at the left. A button opens the tab and lights the tile, or opens the fix here (pictures, links, send time). Designs are one job, "Choose a design for N tiles", with one button to Layout: types with one design are filled by the Data Worker (ix-issue-data v1.0.77 slot.fill) and never reach Compile, and a design for a count is set on the Picker. (2) THE HEADER keeps its three rows. Headline "N jobs left before you can compile", or "Nothing left. Ready to compile." The cells are Articles, Events, Real Estate, The Find, Words, Revenue and Send, each counting its jobs; the "Notes and reserved tiles", "Pre-check" and "Unsaved changes" cells are gone (their jobs sit in the list). A cell shows only its own jobs; click it again, or "Show every job", for all. (3) WEATHER, ruled by Jeff: Compile is never stopped by the weather. Before its window it is a grey note under the list, "The weather can be added from <date>. Compile before then and the email goes without it." Each compile now records the weather's state on the compile stamp (compile.wx). Once the forecast is in range after a compile without it: the job "The weather is ready now. Compile again to add it." (it does not stop Compile). At Review and release, when the compile has no weather and the issue has a weather tile, a window asks first: Wait for the weather (nothing is released) or Send without weather (the release goes ahead; the weather tile stays on the plan for later issues). (4) THE FIND: "Pick this week's theme for The Find." until a theme is typed on its tile (ipp-picker v1.57, ix-issue-data v1.0.77 slot.theme); an empty Find reads "The Find has no businesses yet. Pick them, or remove the tile." (5) The Picker's waiting themes count as unsaved Picker changes. The old check tiles (tilesFor) still feed the Issues tab's history and nothing on screen. Needs ix-issue-data v1.0.77, ipp-picker v1.57 and ipp-publish-v2.24.css. HARDCODING: HC-P-PUB59-1 the jobs' words and group names (JW and every job sentence); HC-P-PUB59-2 the "FA" label read as the Feature Article (as v2.13 did); HC-P-PUB59-3 the weather window's words. Retires HC-P-PUB57-1 (the 204px Unsaved changes chip: the chip is gone) and HC-P-PUB58-1 (tile-name words now live in JW and the job sentences). */
/* v2.58 (23 Oct 2026, Reserved Tiles Build S4, Jeff's test on WLN-902A): ONE ROW PER HOLD, AND NO POSITION NUMBERS. (1) A tile held by a note or a reserved print item is reported once, in "Notes and reserved tiles", and nowhere else. Before, the reserved tile "A Season Of Thrilling Suspense" also showed in Articles as "Position 27 is empty", as "Position 27 has no design" and as "Position 27: It has no block type", so one fact made four red rows. Now boardModel leaves every held slot (board.holds[].slotId) out of the section groups; its hold row is its only row, and the header count drops with it. (2) Ruled by Jeff: a position number means nothing to him. Every sentence on Compile and in its Correct dialogs now names the tile the way the Picker shows it: the article's title for a filled tile ("the \u201cMeet Frank and Carol Floriani\u201d tile"), the section for a list tile ("the Events tile"), and the type for an empty one ("an empty Feature Article tile", or "an empty tile with no type"). Several tiles with the same problem are counted, then named. posTxt and posList are gone; tileName and tileNames replace them. Nothing else changes. CSS unchanged: ipp-publish-v2.23.css. HARDCODING: HC-P-PUB58-1, the English words of the tile names (same class as HC-P-PUB46-1). */
/* v2.57 (23 Oct 2026, Reserved Tiles Build S4): THE UNSAVED CHANGES CHIP READS IN FULL. Jeff, S3 closure item 2: the chip for the "Unsaved changes" band showed "Unsaved ch\u2026" because every chip shares the row equally (flex 1 1 0, at most 160px). ipp-publish-v2.23.css gives that one chip (.ipp-cx-g--k-edits) a fixed 204px, so the whole label shows; the other chips keep sharing what is left, exactly as before. (2) Line 1 of this file named v2.54 since v2.55; it now names the file. Only the version and the badge's companion line change in this file. Goes with ipp-publish-v2.23.css. HARDCODING: HC-P-PUB57-1, the 204px width (sized to the English words "Unsaved changes"). */
/* v2.56 (23 Oct 2026, Reserved Tiles Build S3): THE SECTION CHIP COUNTS ITS TO-FIX ROWS. Jeff on 902A: Words 1, Articles 6, Events 1 on the chips, but 2, 3 and 3 rows under them in To fix. The chip printed g.n, the number of blocks in the group, not the number of problems. Ruled: the number on a chip is the number of rows you see when you click it, red plus gold. A clean section shows its sold count (Revenue) or no number. Body tag only; CSS v2.22 unchanged. */
/* v2.55 (23 Oct 2026, Reserved Tiles Build S3, after Jeff's test run): FOUR FIXES. (1) The version label reads 2.55; v2.54 shipped still saying 2.53 in its badge. (2) The Pre-check band no longer repeats the hold rows: tilesFor() branched on the kind, and kindOf('stop') is 'holds' (they share a spine colour), so the Pre-check band drew every note and reserved tile a second time. It now branches on the band's own key. (3) One count: the header's "N things to fix before Compile" counted red ('bad') tiles only while the To fix list counted red, warn and unsaved; the header now counts red and warn (both red on the page), and the list says "N to fix" plus "and N unsaved" when there are gold rows, so the two numbers agree. (4) Sectors are optional in Send Setup (Jeff, 23 Oct): a blank sectors field no longer holds Send Setup or Compile, the row is labelled "optional", and the Ages 20-80 fallback is no longer offered as a default when the title has none (HC-P-PUB20-1 retired); the title's own default sectors are still offered. Pairs with ix-issue-data v1.0.76 (Setup counts four, not five). CSS unchanged: ipp-publish-v2.22.css. */
/* v2.54 (22 Oct 2026, Reserved Tiles Build S3): NOTES AND RESERVED TILES HOLD COMPILE, AND SAY SO (RT-9, RT-9a). The board gets a first band, "Notes and reserved tiles", drawn from the Data Worker's board.holds (ix-issue-data v1.0.75): one red row per hold, a slot note ("Note \u00b7 \u201cCheck 123 Carpet\u201d") or a reserved tile with no article yet ("Reserved \u00b7 \u201cMeet Frank and Carol Floriani\u201d"), each naming where it sits (Picker or Revenue) and carrying one button, Fill, that opens that tab at that slot (ipp-revenue v1.6.5 IPPRevenue.goTo; on the Picker the tile is scrolled into view and lit for a moment). The rows are faults in the saved plan (red), so Compile stays off and the header counts them until the band is empty; Delete and Move to\u2026 live on the tile itself, one click away. Second, the pre-check's refusal is no longer silent: when /issue-check answers wouldStop (the Worker's designed 4xx from buildIssue, answered as 200 wouldStop, never an error toast) and no hold explains it, a "Pre-check" band shows the Worker's sentence as one red row, where before the Compile button simply went grey with no reason on the page. Nothing else changes. Goes with ipp-publish-v2.22.css (the band's spine colour). HARDCODING: HC-P-PUB54-1 the English words of the hold rows and the Fill button (same class as HC-P-PUB46-1). */
/* v2.53 (22 Oct 2026, Reserved Tiles S2): A DEFAULT IS NOT YOUR EDIT. Send Setup still offers its defaults (legacy subject and preview, the title's sectors or Ages 20-80, the issue date as send date) as gold changes with Cancel, and Save still writes them. While a field holds exactly the value the program offered, its input also carries .ipp-auto, which ipp-shell v1.27 leaves out of the Close count, so opening a plan and closing it no longer asks "Close without saving". Type over a default and it becomes your edit: .ipp-auto drops and Close asks. EM.seedVal keeps the offered value. Nothing else changes. */
/* v2.52 (21 Oct 2026, 106 Gap Interview S10): THE RANGES COME FROM THE WORKER. ix-issue-data v1.0.74 answers the six word ranges on /plan-board (words.ranges: subject, preview, closing, title, supershort, paragraph; HC-W-74-1), and this file now reads them there through maxLen(k) / minLen(k) instead of typing them: Send Setup's counts, maxlength and Save check (the old MAXLEN / MINLEN, HC-P-PUB7-1, retired), the Compile Words tile's "outside their range" test (the v2.36 typed list, retired), and the Correct window's counts and maxlength for the greeting parts (the old GR_MAX, HC-P-S10-7, retired). The one number still typed is the send-volume digit cap (VOLUME_MAX 9, HC-P-PUB52-1). When the board carries no ranges (the Worker is behind), the Send Setup counts read "Ranges not answered by the Worker (needs ix-issue-data v1.0.74)", Save refuses with that sentence, and the Compile Words tile reports it as a thing to fix (HC-P-PUB52-2). Everything else is v2.51. CSS v2.21 unchanged. */
/* v2.51 (21 Oct 2026, 106 Gap Interview S9): TWO SMALL TRUTHS. 1 · A refused write says why. Scenario 124 v2.26 answers 409 with the Data Worker's own sentence in error ("This issue is released. Unlock it in the IPP first."; "Subject line is 53 characters, needs 20 to 50."), so patchNewsletter() and call124() now read the body of a non-200 answer and throw that sentence instead of "Scenario 124 answered HTTP 409 to <op>"; the HTTP line is kept only when the body carries no error. 2 · The clean-board sentence under a words-only stale header reads "The words changed after this compile, so the files above are behind it. Compile again." instead of "The plan was saved after this compile" (HX.cleanStaleWords, HC-P-PUB46-1 extended). Everything else is v2.50. CSS v2.21 unchanged. */
/* v2.50 (21 Oct 2026, 106 Gap Interview S8): THE WORDS ARE PART OF THE COMPILE'S BASIS (ruled after the 901A incident). The compile stamp now keeps compile.basisSig = plan.saved.sig (rows plus the newsletter's subject, preview and closing, ix-issue-data v1.0.72) and compile.basisRowsSig = plan.saved.rowsSig. The stale test is unchanged (basisSig differs from saved.sig); what changed is what moves it: a changed subject, preview or closing after the compile now turns the header gold, from whatever door the change came. When only the words moved (the rows signature still matches) the headline reads "The words changed after the compile" and the stamp sentence says "the words changed since" instead of a plan-saved time. Everything else is v2.49. CSS v2.21 unchanged. HARDCODING: HX words extended (HC-P-PUB46-1). */
/* v2.49 (21 Oct 2026, 106 Gap Interview S8): DISTRIBUTION IS ONE SURFACE (Jeff: the Vendor Status tab repeated the side card, so the two tabs go). The email stays on the left (Subject, Body, Attach, Open in Outlook, I sent it). On the right the Released card and a Vendor Status card you tick directly: five rows, each a checkbox, the step's short name and its time once ticked; a tick marks the row pending with the gold border and shows Save and Cancel at the card foot (Cancel reverts); steps 2 to 5 stay disabled until step 1 is saved; step 1 itself is set by "I sent it" (the acknowledgement) and cleared by Unlock, never by hand; when "Fully set up" is saved the card turns green and carries the "This issue is done" line. Cut: the Vendor Status tab and bar, the "n of 5 steps ticked" line, and the grey "Later: …" lines under each step (Jeff: remove). Everything else is v2.48. Needs ipp-publish-v2.21.css. */
/* v2.48 (21 Oct 2026, 106 Gap Interview S8): THE VENDOR ADDRESS LIST IS DEFERRED (Jeff: he copies the vendor email into Outlook by hand and nothing on the platform sends it, so To and CC are not needed yet; no TITLES-ADMIN field, no ix-issue-data v1.0.70 for now). Submit to Vendor: "I sent it" works with no address picked; the red "no vendor address" line is gone; the To and CC pickers draw only when the Worker or IX_CONFIG.vendor.email names at least one address, and the Mark as sent dialog and the saved send record name the addresses only when some were picked. Everything else is v2.47. CSS: ipp-publish-v2.20.css unchanged. */
/* v2.47 (21 Oct 2026, 106 Gap Interview S8): THE NO-SCROLL COMPILE PAGE AND THE DISTRIBUTION RECOVERY. Built to the S8 canvas "IPP Compile · no-scroll page + Distribution recovery" (boards 1 to 8 accepted by Jeff, 21 Oct). Compile: the header runs edge to edge with a solid backdrop (no card, nothing scrolls behind it); the board under it lists only what needs a hand (red and gold tiles as one list, each naming its section, with its Correct or Open button); a green section lives only in its header cell (one place per fact), so a clean board is empty; a section cell is a button: click it and that section's checks open under the header, click it again to close (CX.open). Delivery's detail holds the send facts and the tracking-codes list; the "Last compile" foot band is gone (the stamp row has it). The primary band keeps one height in every state: no demoted link under the button; "Compile again" is a text link beside "Check again" in state 2 (an article's words or picture can change without the plan changing). Review and release opens the Confirmation IN PLACE of the board, under the same header, with a small Back link above the title (CX.review); its "This issue" box is gone (the header has it), four equal cards, three ticks, one button; after Confirm and release the page STAYS on Compile and shows the green band (S7 ruling 9; no jump to Distribution). The two sold Revenue tiles no longer count as checks (S7 §4: "24 of 26" on an all-green board). Distribution: Submit to Vendor opens from the release stamp alone (S7 §4); To and CC are pickers over the title's vendor address list (ix-issue-data v1.0.70 publish.vendor.addresses from TITLES-ADMIN, Jeff S8: the list lives on T-A; until then IX_CONFIG.vendor.email split on commas), several addresses, a pending change carries the gold border with a Cancel link, the addresses used are saved with the send record (vendor.sentTo, sentCc, sentCompileAt, file); the release facts and the five vendor steps sit in a right column so the page needs no scroll. Unlock after a vendor send opens the recovery dialog (S7 ruling 13): it names the file the vendor holds, voids it (vendor.voided {file, sentAt, sentTo}), clears the five vendor steps, and the next Submit to Vendor email is marked REPLACEMENT naming the file it replaces, with a gold note and a Download button at the top of the pane. "I sent it" opens the Mark as sent dialog (ruling 14: acknowledgements on exactly three steps). "The vendor has an older file" now compares the compile stamp with the compile the vendor was sent. Needs ipp-publish-v2.20.css. HARDCODING: HX words (HC-P-PUB46-1, extended); KB_LIMIT (HC-P-PUB46-2); VX, the Distribution words by state (HC-P-PUB47-1); the IX_CONFIG.vendor.email comma split as the address-list fallback until ix-issue-data v1.0.70 (HC-P-PUB47-2). */
/* v2.46 (20 Oct 2026, 106 Gap Interview S7): THE COMPILE HEADER, FOUR STATES. Built to the S6 canvas "IPP Compile header · four states" and the S6 closure rulings 1 to 10. The sticky header is three fixed rows that never move between states: STATUS (dot or lock, headline, one fact line; the one primary button 200x44 with a demoted link slot under it), SECTIONS (fixed 160px cells in catalog order: dot, name, count, tick / "!" / x / lock; a cell goes red or gold exactly like its band), STAMP (the compile or release sentence; "53.7 / 95 KB · 20 / 20 links" in mono and View email · Download · Web page at 96x32, the same three in every compiled state, dimmed when stale, never "old"). The verdict, the chip row, the go hint, the mini line and the release bar of v2.31 to v2.45 are gone. States, read from publish-step-state on the NEWSLETTER (ruling 1, no new fields): 1 Not compiled (no compile stamp): Compile issue, held red or gold by the board; 2 Compiled (compile.basisSig equals the Worker's plan.saved.sig): Review and release, Compile again demoted; 3 Stale (the sig differs: any saved change to the plan's blocks after the compile, ruling 2; Send Setup never): Compile again alone, gold band; 4 Released (release.at): solid green band, white lock, no primary button (ruling 10), Unlock a quiet link flush right. Compile writes compile{at,basisAt,basisSig,kb,links} (links filled once the link check answers); Confirm and release writes release{at,compileAt} and still sets final-send-authorized-at for the legacy readers; Unlock (ruling 9, confirmation as worded in the closure) clears both and returns to state 2 with the compile stamp kept. A released issue locks Send Setup too (Jeff, S7): the only way back is Unlock, so the Send Setup save no longer clears the release and the Confirmation card's Withdraw is gone. Confirmation opens only for a current compile (not stale). The Distribution rail dot paints from the release stamp (ruling 7). A compile from before stamps were kept (lastCompile with no stamp) reads as state 1 with its files dimmed and the stamp sentence saying so. Needs ix-issue-data v1.0.69 (plan.saved) and ipp-publish-v2.19.css. HARDCODING: HX, the header's words by state (HC-P-PUB46-1); KB_LIMIT 95 when the Worker names no limit (HC-P-PUB46-2). */
/* v2.45 (20 Oct 2026, 106 Gap Interview S5): ONE BAND FOR THE ADS. Jeff, on seeing Banners "Ad links work 11 of 12" above Revenue "Banners 12 of 12 filled · Lead banner Carbon Health": duplicative, and they do not agree. Both judged the same twelve blocks. The ad block groups (every catalog entry whose assetType is ad) now fold into the Revenue band: their link check and left-out tiles sit beside the sold, sponsor and splash tiles, so a dead ad link turns Revenue red. The Banners band and chip are gone; the block count stays in the header total. Nothing typed: the catalog says which groups are ads. Goes with ipp-publish-v2.18.css. */
/* v2.44 (20 Oct 2026, 106 Gap Interview S5): UNSAVED IS GOLD, NOT RED. Ruled by Jeff: a missing thing is a fault in the saved plan (red); an unsaved edit is the saved plan being behind you (gold). Both hold Compile; the colour says which. New tile state 'hold' (gold, "!" badge, Open <tab> button): v2.43's Revenue unsaved tiles move to it, and a new first band "Unsaved changes" carries one tile per tab with open edits: Picker (IPP.picker.pending, counted as ipp-words counts it), Layout (IPP.layout.pending), Words (IppWords.pending). Counts: a band's hold is separate from its bad; the chip reads "N unsaved" in gold when there is no fault; the verdict reads "N unsaved to save or cancel before Compile"; the rail dot for the tab goes gold (IPP.dot 'hold', ipp-shell v1.25) when the tab has holds and no reds. recordCheck still records faults only. Goes with ipp-publish-v2.18.css and ipp-shell-v1.18.css. */
/* v2.43 (20 Oct 2026, 106 Gap Interview S5): COMPILE SEES UNSAVED SPONSOR AND SPLASH CHANGES. Test on 901A: an armed, unsaved sponsor change on Revenue left the Compile Revenue band green and the rail dot green. Cause: Compile read IPPRevenue.gate(), whose unsaved count covers banner slots only; sponsor and splash changes are reported by IPPRevenue.readiness() (sponsors / splash: 'ready' | 'unsaved' | 'needs'), which Compile never called. Now the Splash card and every sponsor card read readiness() first: 'unsaved' makes the card red "Revenue has unsaved <splash|sponsor> changes. Save or cancel there first", go revenue; 'needs' (a cloned sponsor waiting for approval, blocks that disagree, a failed save) is red with the same go, where the v2.40 disagreement text already covers the mixed case. So the rail's Revenue dot now paints for any pending Revenue change, not only banners. Body tag only; CSS v2.17 unchanged. */
/* v2.42 (20 Oct 2026, 106 Gap Interview S5): THE REVENUE BAND COUNTS SALES, NOT CARDS. v2.41's header said "2 sold" for twelve banners and one sponsorship, because it counted tiles in the sold state. Now each sold tile carries what it stands for (n sales, kind), the band header reads them by kind ("12 banners \u00b7 1 sponsor", "\u00b7 splash" when paid) and the chip shows the total ("13 Revenue"); an empty banner slot is not a sale, so the banner count is the filled ones. The sponsor card no longer prints the block position ("(12.8)" was the internal group position, as the Words change line also showed). VERSION and FILE now come from one string, so the badge cannot lag the file name again (v2.40 bumped VERSION only, v2.41 bumped FILE only). Body tag only; CSS v2.17 unchanged. */
/* v2.41 (20 Oct 2026, 106 Gap Interview S5): COMPILE LISTS WHAT WAS SOLD. Jeff, on seeing 901A with Sports Corner sold to Climate Plus and Compile saying only "12 Banners": "there's no reporting of anything other than banner ads; we don't have the splash ad on Compile, nor a check of the sponsorships. Major problem." The v2.40 Section sponsors tile was a check, and passing checks fold into a tick, so a sold section appeared on Compile only when something was wrong with it. Ruled: Compile lists what was sold; the checks qualify the list, they do not replace it. New synthetic group Revenue (after Other blocks, before Delivery, wired like delivery) with a new tile state 'sold': green, never folds to the tick line, the name is its value. Rows: Splash (sold "<customer>" when the newsletter's splash source is paid; ok "House splash" otherwise, which folds, since it is not a sale; bad when a paid splash has no image or no go link, go revenue; bad with no go when the Worker returns more than one newsletter for the plan, which Jeff says is one for one, so a second record is a data fault); one row per sponsored section (sold "<section> \u00b7 <sponsor>", blocks named; the v2.40 disagreement wording stays, red, go revenue) and the Banners count as sold "N of N filled" with the Lead banner's customer named, both moved here from the Banners group (Cloned ads approved, links and left-over tiles stay there). Band reads "N sold" in the header and the chip, so the rail's Revenue dot now paints from this group under the v2.38 one-painter rule. The Review-and-release Advertisers box gains Splash and Sponsors rows. Sidebars are left off: ipp-revenue v1.6.2 has no sidebar tab yet (ads-model). Body tag only; CSS unchanged, so the Revenue band and chip take the default (kind-less) colours until the next ipp-publish CSS bump gives ipp-cx-g--revenue a colour. HC-P-PUB41-1: a paid splash is splash.newsletters[0].source === 'paid', the same test ipp-revenue v1.1 uses; its name is current.name, its image current.image, its go link current.go when the Worker sends that key (ix-issue-data v1.0.63 is not confirmed to; an absent key is not judged). HC-P-PUB41-2: the three checks on a sold item are asset present, image present and go link present; no size or shape check, which is Design Port's. */
/* v2.40 (20 Oct 2026, 106 Gap Interview S5): SECTION SPONSORS COUNTS THE BLOCKS WITH NO SPONSOR. WLN-901A had Top Level Soccer on one Sports Corner block and nothing on the other; Revenue's Sponsors tab showed "Blocks disagree" with a red dot on its own tab, but the Compile tile read "All agree" and the rail stayed green, because the tile only gathered blocks that carry a sponsor (one id, no clash). Now every block in a sectioned slot counts, a bare one as "no sponsor", so one sponsor plus none is a disagreement: red tile naming the section and what each block says, go revenue, which paints the Revenue dot salmon through the v2.38 one-painter rule (Jeff: "you'd think this kind of problem would come up if it mattered"). Body tag only; CSS unchanged. */
/* v2.39 (20 Oct 2026, 106 Gap Interview S5): STORIES IN AROUND TOWN. A story whose section is sponsored this issue may not sit in Around Town (S3 ruling 13). Layout refuses the drop and lists existing cases, but Compile had no tile for it, so with one painter (v2.38) such a case was red on the Layout page and green on its dot and on Compile. New tile "Stories in Around Town" in the Articles group: red (go layout) naming each story in a group whose section carries a sponsor, green otherwise. Groups are read with Layout's load rule (opener takes the groupable blocks after it up to the first endGroup mark) from the same board; no Worker change. HC-P-PUB39-1: the sponsor test is slot.sponsor.name on an article slot with an asset, the same as ipp-layout v1.0.40. */
/* ipp-publish-v2.38.js */
/* v2.38 (20 Oct 2026, 106 Gap Interview S5): ONE PAINTER FOR THE RAIL DOTS. Ruled by Jeff: a red on Compile must show red on the tab that owns it, never Compile red with the tab green. Until now five painters decided the dots (Layout from problems(), Words from done and stale, this file for Compile and Send Setup, nothing for the two Pickers and Distribution), so they could disagree. Every Compile tile already names the tab that fixes it (its go: picker, revenue, layout, setup, words), so railDots() now paints every dot from the board: a tab is salmon when any red tile (bad or warn) points at it, green when the board is read and none does, grey while the board is still being read. Tiles with a Correct button and no tab (photo fixes) count only toward Compile (Jeff: "compile only"). Send Setup keeps the setupGate() rule; Compile keeps compileBlockers(); Distribution is green once the vendor's "Fully set up" tick is saved and grey before (Jeff: "yes"), repainted after a vendor save. ipp-layout v1.0.44 and ipp-words v1.0.6 no longer paint their own dots. DOT_VIEW (HC-P-PUB38-1) maps a tile's go word to the shell view name. CSS: ipp-publish-v2.16.css unchanged. */
/* v2.37 (20 Oct 2026): the Compile group for the Greeting block is headed "Words" (the catalog entry is still named Greeting; its tiles judge the six parts of the Words tab, so the board and the tab use one word). HC-P-PUB37-1: the word. Nothing else changes. */
/* v2.36 (20 Oct 2026): Send Setup checks the same inbox ranges as the Words tab (ipp-words v1.0.1): subject 20 to 50, preview 40 to 90 (MAXLEN now 50 / 90, new MINLEN 20 / 40; HC-P-PUB7-1 updated). The counts read "n / 20–50" and go salmon outside the range; Save refuses a value outside it and says why. The Compile Words tile names a saved value outside its range ("Subject line is 12 characters; it needs 20 to 50") as a thing to fix. CSS unchanged (v2.16). */
/* v2.35 (20 Oct 2026): the Greeting tab is the Words tab (ipp-words v1.0.0). The Compile board's greeting group judges all six parts: subject line and preview text (NEWSLETTER), title, short greeting and paragraph (GR row), closing (NEWSLETTER Closing Note); its tiles are "Newsletter marked done", "Words written N of 6" and "Words older than the issue: N changes", the last from the Data Worker v1.0.68 basis diff (greeting.basis on the GR slot) instead of the timestamp rule, which is retired here (grcStale, GR_STALE_TYPES removed). The Delivery group keeps the send time only; the subject and preview tiles moved to Words. GO.words "Open Words" (data-pub-go="words"). CSS unchanged (v2.16). */
/* v2.34 (20 Oct 2026): the Compile board agrees with the Greeting rail dot. When the newsletter is not marked done (slots[].greetingDone false), the Greeting section shows "Newsletter marked done: Not yet" whether or not the words exist (v2.33 only showed it for an empty greeting). Also the three last-compile links in the Compile header are small outlined buttons again (ix-btn--sm), not plain <a> tags the page's link style swallowed (Jeff's screenshot, v2.33). CSS v2.16. */
/* ipp-publish-v2.33.js */
/* ============================================================
   ipp-publish-v2.33.js (20 Oct 2026, 106 Gap Interview S4) — the greeting
   leaves Compile. The band, the ix-ai modal call, the GRC state, the
   three boxes and the Correct-window greeting branches are now
   ipp-greeting v1.0.0 (its own tab, below Layout). Compile keeps one
   verdict per rule in the Greeting section, each with an Open Greeting
   button (GO.greeting, data-pub-go="greeting"): not marked done, parts
   missing, older than the issue, or written. Reads slots[].greetingDone
   (ix-issue-data v1.0.67). CSS: ipp-publish-v2.15.css (the .ipp-grc
   rules are gone; the band CSS lives in ipp-greeting-v1.0.0.css).
   Also announces the Compile and Send Setup rail dots (IPP.dot,
   ipp-shell v1.21) from compileBlockers() and setupGate().
   ---- v2.32 header follows ----
   ipp-publish-v2.32.js
/* ============================================================
   ipp-publish-v2.32.js — Send Setup, Compile and Distribution views for the IPP
   Companion stylesheet: ipp-publish-v2.14.css
   Requires: ix-ai-v1.0.0.js + ix-ai-v1.0.1.css (the css fix is needed; see below)
   v2.32 (20 Oct 2026) — THE RELEASE LINE JOINS THE STICKY HEADER
   Jeff's screenshot of v2.31 on WLN-901A: the v2.24 release bar, a
   sticky strip pinned 12px above the foot of the scroll, now floats
   over the middle of the band layout and reads as a stray tile
   ("something on the bottom that's like a floating tile"). It was the
   last piece of the old side-panel design still on the page.
     - The bar is gone. The same words and buttons draw as a third row
       of the sticky header (.ipp-cx-rel, under the verdict and the
       navigator), only while the Confirmation step is open: green dot,
       "Ready to release · goes out <when>" and Review and release; or
       "Released for distribution · <when>", Open Distribution and the
       × that clears it. One sticky thing on the page, as the redesign
       said. drawBar() now targets [data-publish-release]; the
       data-bar-review / data-bar-dismiss handlers are unchanged.
     - Also found in the same screenshot: the ix-ai modal opened BEHIND
       the IPP shell (z-index 1200 under .ipp-fullscreen at 9000), so
       the page locked and the Greeting button stuck on "Writing…".
       Fixed in ix-ai-v1.0.1.css, no JS change. Load that css.
   HC-P-PUB24-1 carries forward (the release line's words).
   ---- v2.31 header follows ----
   ipp-publish-v2.31.js — Send Setup, Compile and Distribution views for the IPP
   Companion stylesheet: ipp-publish-v2.13.css
   Requires: ix-ai-v1.0.0.js + ix-ai-v1.0.0.css (v2.30)
   v2.31 (20 Oct 2026) — THE COMPILE PAGE REDESIGN (IPP Compile redesign mockup v0.1, "go")
   Status in one place, sections evident, far fewer tiles:
     - a sticky header (.ipp-cx-head) carries the verdict, a navigator of
       chips (one per section, with its count and state; click scrolls to
       the band), the last-compile summary with View/Download links, and
       the only Compile button. The right-hand panel and the loose
       "22 blocks =" strip are gone; every data-publish-* hook they held
       lives in the header now (the Correct, Compile, recheck and link
       handlers are unchanged).
     - every section is a band (.ipp-cx-band) with a spine in its own
       colour, a header row (name, blocks, that section's verdict) and
       its checks inside. The Greeting band (v2.30) sits inside the
       Greeting section; it is built once and moved, never rebuilt, so
       typing survives redraws.
     - passing checks fold to one line of ticks with "Show details";
       only a failing (or still-reading) check is drawn as a tile with
       its Correct button. The greeting's own red tile is not drawn: the
       band above it is the action (one red language, v2.27).
     - the full "Last compile" detail and the tracking-codes table live
       in a Last compile band at the foot.
   ---- v2.30 header follows ----
   ipp-publish-v2.30.js — Send Setup, Compile and Distribution views for the IPP
   Companion stylesheet: ipp-publish-v2.12.css
   Requires: ix-ai-v1.0.0.js + ix-ai-v1.0.0.css (the shared AI writing modal)
   v2.30 (20 Oct 2026) — GREETING BAND + ix-ai MODAL (ix-ai Greeting mockup v0.1, ruled "go")
   The Greeting card becomes a one-line band in three states:
     - no greeting: "Write the greeting" (primary) and "Type it by hand";
     - current: the title and the start of the paragraph on one line,
       Edit and "Write it again";
     - older than the issue: salmon, "N blocks changed since it was
       saved <when>", Write it again / Keep this greeting / Edit by hand.
   The three boxes (today's card body, Save and Cancel) open under the
   band only when editing: Type it by hand, Edit, or after the modal
   hands back a greeting. Cancel closes them. The v2.28 veil and blur
   are retired (the band is the collapsed stale state).
   AI Generate now opens IxAI.open(): a spread per field (3 titles in
   three tones, 3 short greetings, 2 paragraphs), per-field regenerate
   with a note, the prompt visible and editable, Amend, history. "Use
   this greeting" drops the chosen words into the boxes as a draft;
   Save is unchanged (block-save gr + read-back). HC-P-PUB30-1 (tones
   Warm / Playful / Straight and counts 3 / 3 / 2), HC-P-PUB30-2 (the
   house prompt text stays in this file until a per-title prompt exists).
   ---- v2.29 header follows ----
   ipp-publish-v2.29.js — Send Setup, Compile and Distribution views for the IPP
   Companion stylesheet: ipp-publish-v2.11.css (unchanged)
   v2.29 (19 Oct 2026, same day as v2.28) — AI GENERATE "DID NOT FIT, TWICE"
   (Jeff: it never seems to work). The answer was rejected whenever the
   paragraph fell outside 550 to 600 characters; models count characters
   badly, so a 50-character window fails most tries. Now:
     - the maximums (50 / 600 / 140) are the only hard rule; 550 is a
       target the prompt asks for, never a gate (the 17 Oct ruling said
       the minimum is for the AI answer, and even there it should steer,
       not reject);
     - an overrun gets one retry that names the exact count ("your
       paragraph was 642 characters; the limit is 600");
     - if it is still over, the paragraph is cut at the last sentence end
       under the limit, the title and short greeting at the last word;
     - the card says what happened ("AI wrote a greeting; the paragraph
       was trimmed to fit"), and a failure names the part and its count
       instead of "did not fit the boxes".
   ---- v2.28 header follows ----
   ipp-publish-v2.28.js — Send Setup, Compile and Distribution views for the IPP
   Companion stylesheet: ipp-publish-v2.11.css (the stale greeting is behind, blurred)
   v2.28 (19 Oct 2026, same day as v2.27) — A STALE GREETING IS BEHIND
   (Jeff: treat it like the Layout preview; and Correct did nothing you
   could see).
     1  When the greeting is older than the issue and nothing is being
         typed, its three boxes are behind: blurred and read-only
         (.ipp-grc.is-behind, the Layout preview's own treatment), with a
         veil over them carrying the fact and the two ways out:
         "Write it again" (AI Generate) and "Keep this greeting" (it
         still fits; re-saves so the row is stamped after the content).
         "Edit it by hand" lifts the veil to type. AI Generate or typing
         makes the card dirty, which lifts the veil until Save or Cancel.
     2  The tile's Correct now lands: the card scrolls into view and
         pulses a gold ring for a moment (.is-pulse), and the first veil
         button takes focus.
   ---- v2.27 header follows ----
   ipp-publish-v2.27.js — Send Setup, Compile and Distribution views for the IPP
   Companion stylesheet: ipp-publish-v2.10.css (the Greeting card, quieter)
   v2.27 (19 Oct 2026, same day as v2.26) — LESS RED FOR ONE FACT (Jeff:
   five red places for one changed block, and no way to tell which to
   act on).
     1  The Greeting card no longer turns pink when stale. The stamp
         line says it in salmon and "Keep this greeting" becomes a real
         button beside Save: the card carries the action, the board
         carries the verdict. The tile, chip and verdict panel keep the
         board's one language for every problem.
     2  Confirmation and the release bar now need a green board, not
         only "compiled and links OK" (stepOpen('confirm')). A greeting
         saved after the compile means the compiled email is behind the
         content, so "Ready to release" was wrong beside a red board.
         lockWhy('confirm') names it: "Fix the red tiles and compile
         again".
   ---- v2.26 header follows ----
   ipp-publish-v2.26.js — Send Setup, Compile and Distribution views for the IPP
   Companion stylesheet: ipp-publish-v2.9.css (the Greeting card)
   Needs ix-issue-data v1.0.66 for the stale rule (slots[].updatedAt);
   on an older Worker the card works and the stale rule stays quiet.
   Pairs ipp-picker-markup v1.19 (the Picker's Greeting card removed).

   v2.26 (19 Oct 2026, 106 Gap Interview S3) — THE GREETING IS WRITTEN ON
   COMPILE (ruled by Jeff, 19 Oct: the greeting summarises the finished
   issue; since the Picker no longer needs the first article chosen, a
   greeting written there can have the content change under it, so it
   moves to where the issue is final and locks against it).
     1  A Greeting card at the top of the Compile page, above the board:
         Title (masthead), Short greeting (email) side by side, Paragraph
         (web page) under them, each with its count; AI Generate reads
         the issue as the board shows it (articles in order with their
         deks, events with when and where) and fills the three boxes;
         Undo puts back what was there; a changed box carries the gold
         border; Cancel reverts; Save writes the plan's GR row through
         Scenario 122 (block-save, as the Picker did) and reads it back
         (TOAST-TRUTH). A locked plan: boxes read-only, buttons off.
     2  THE STALE RULE. Every slot now carries updatedAt (Worker
         v1.0.66). The greeting is older than the issue when an article,
         event or listing block was saved after the GR row. Then the
         card says so ("3 blocks changed since it was saved"), the board
         tile goes red ("Greeting older than the issue") and holds
         Compile, and the card offers "Keep this greeting" (re-saves the
         same words, so the row is stamped after the content) beside
         Save. Ad and sponsor changes do not count: the greeting is not
         written from them. Without updatedAt (older Worker) no block
         counts and the rule stays quiet.
     3  The "Greeting written" tile's Correct now goes to the card (it
         scrolls up and focuses the first empty box) instead of opening
         a Correct window; the window's greeting form stays for safety
         but nothing reaches it.
     4  GR_MAX corrected to the Picker's current limits, 50 / 600 / 140
         (it still said 30 / 300 from S10, so the Compile form would have
         cut a 400-character paragraph). GR_MIN 550 for the paragraph is
         for the AI answer only, never for Save (ruled 17 Oct).
     HC-P-PUB26-1  the card's words (head, stamp lines, AI gate reasons,
                   button labels); HC-P-S10-7 updated (limits);
                   HC-P-PUB26-2 GR_MODEL 'claude-sonnet-4-6' and the
                   prompt (copied from the Picker's HC-P-S7-12/13);
                   HC-P-PUB26-3 the stale rule counts article, event and
                   re slots only.
   ---- v2.25 header follows ----
   ipp-publish-v2.25.js — Send Setup, Compile and Distribution views for the IPP
   v2.25 (19 Oct 2026): tells the shell the send time. refreshAll fires
   ipp:send-at { local } (the saved send time, local wall clock, or '')
   so ipp-shell v1.20 can write "Sends Wed, Oct 21, 9:45 PM" under the
   publication date in the left panel; it fires again after a Send Setup
   save. Also: the ipp:board listener's guard looked for the old tab bar
   ([data-publish-tabs]), which now exists only on Distribution; it now
   checks for any mounted canvas.
   ---- v2.24 header follows ----
   ipp-publish-v2.24.js — Send Setup, Compile and Distribution views for the IPP
   Companion stylesheet: ipp-publish-v2.8.css (the release bar)
   v2.24 (19 Oct 2026) — THE RELEASE BAR (ruled by Jeff on the first
   Compile run: the Confirmation sat below the fold, nobody would know it
   was there, and it never opened).
     1 · Two defects fixed: the Confirmation never unlocked because the
         link check's answer redrew the board but not the panes (v2.21's
         tab bar used to carry that); and the "Confirmation opens once …"
         note is gone, it said nothing useful.
     2 · A bar fixed to the bottom of the Compile page (.ipp-cx-bar,
         sticky) that exists only when there is something to do:
         - ready to release: a green bar, "Ready to release · goes out
           <when>", and a button "Review and release" that scrolls to the
           Confirmation card, which now draws under the result as soon as
           the gate opens;
         - released: "Released for distribution · <when>" with Open
           Distribution, and an × that clears it (until the next release);
         - otherwise no bar at all.
       HC-P-PUB24-1: the bar's words.
   ---- v2.23 header follows ----
   ipp-publish-v2.23.js — Send Setup, Compile and Distribution views for the IPP
   v2.23 (19 Oct 2026, same day as v2.22) — COMPILE SAID "FINISH SEND SETUP
   FIRST" ON A FINISHED SEND SETUP. The Compile page is drawn when the
   view first mounts, which is before the plan data has arrived, so the
   gate answers "wait" and the locked card is drawn. Nothing redrew the
   page when the data came in (the old tab bar used to, on every board
   event; the locked card did not). Now syncCompile() runs on every board
   event and in refreshAll: if the page shows the locked card while the
   gate is open, or the board while it is closed, the page is redrawn and
   the pre-check and link check start. Also: switching back to Compile
   redrew the Send Setup page by mistake (redraw() with no view).
   ---- v2.22 header follows ----
   ipp-publish-v2.22.js — Send Setup, Compile and Distribution views for the IPP
   Companion stylesheet: ipp-publish-v2.7.css (unchanged)
   Needs ipp-shell v1.18 (the rail: Send Setup, Compile, Distribution).

   v2.22 (19 Oct 2026, 106 Gap Interview S3) — THE RAIL IS THE STEPS
   (ruled by Jeff, 19 Oct: "Publish" is gone; one flat rail, Send Setup
   then Compile then Distribution; Confirmation is not a tab he would
   ever click, it lives where the work is).
     - The old Publish view (data-view "publish", kept as the DOM name so
       nothing else moves) is now the Send Setup page only: its head says
       Send Setup, there is no tab bar, and the setup card fills it.
     - Compile is its own view (data-view "compile", the shell clones it):
       the board, the Compile button, the result and the link check, with
       no tab bar. Below the result, the Confirmation card: the three
       statements and "Confirm and release for distribution", drawn only
       once Compile is done and every link responds; before that a one-line
       note says what unlocks it. Send Setup not finished: the Compile view
       shows the locked card with a button to Send Setup.
     - Distribution is unchanged: its two steps keep their bar.
     - The step machinery (stepOpen, stepDone, lockWhy, openStep) is
       unchanged; only which view each step draws in moved. STEPS view
       values: setup → publish, compile and confirm → compile.
     - HC-P-PUB22-1: the heads ("Send Setup", "Compile this Issue") and
       the Confirmation note ("Confirmation opens once …").
   ---- v2.21 header follows ----
   ipp-publish-v2.21.js — Publish and Distribution views for the IPP
   Companion stylesheet: ipp-publish-v2.7.css (Send Setup grid; v2.6 + 6 rules)
   Needs Data Worker ix-issue-data v1.0.43 or later for the catalog
   (groups); v1.0.53 for listDone and itemCount; v1.0.52 for article type;
   v1.0.61 for the greeting rule below to match the Worker's.

   v2.21 (18 Oct 2026, 106 Gap Interview S3 · fixes) — FOUR FIXES FROM THE
   WLN-901A SHADOW COMPILE (closure S2: D2, D12; rulings 1, 9, 12).
     D2  · The "left out" warning names each block. v2.20 said "the tiles
           name each one", and they never did for a block the Worker had
           dropped (its tile was green or absent). The warning now reads
           the board itself: every slot whose compile.state is left-out
           prints as "Position N (type): why". When 206's count and the
           board disagree, the line says so and asks for a reload.
           HC-P-GI2-1 (the sentence) is retired.
     D12 · "View email" and "Download email" open the email 206 saved on
           the NEWSLETTER, read through the Worker's GET /email-html
           (ix-issue-data v1.0.30), not only a blob built in this session:
           they work after a reload and after a compile run elsewhere.
           This session's compile is used first when the page holds it.
           The file is named for the plan (WLN-901A.html, ruling 9), the
           name the vendor file carries in inbxify-email-outputs; the
           Distribution tab's attachment name follows (was <issue>-email.html).
     R1  · The Greeting Title is required (ruling 1 supersedes S1 ruling
           2). The tile counts 3 of 3 parts; the fix modal marks all three
           required. ix-issue-data v1.0.62 still passes on paragraph and
           short greeting alone (its v1.0.61 rule); its next bump matches.
     R12 · Send Setup lies across the width: Inbox and Audience side by
           side, Schedule under, the actions under that (ipp-publish
           v2.7.css). No scrolling at desktop widths. The same grid draws
           in Confirmation's in-place editor.
     FILE constant corrected (v2.19 and v2.20 carried 'ipp-publish-v2.18.js').

   v2.20 (17 Oct 2026, 106 Gap Interview S1 · rail) — DISTRIBUTION IS ITS
   OWN TAB. Ruled (Jeff): the rail is one flat row of five — Editorial
   Picker, Revenue Picker, Layout, Publish, Distribution (ipp-shell
   v1.17). Publish keeps steps 1–3 (Send Setup, Compile, Confirmation);
   Distribution takes Submit to Vendor and Vendor Status, numbered 1 and
   2 on its own step bar. The steps, their gates and their state are
   unchanged; only where they draw.
     - STEPS entries carry a view. frame(view) builds a head, a step bar
       and the panes for that view only; both views mount from the same
       module (mount(view)), with one click/change/input handler bound
       to each canvas.
     - state.tab becomes state.tabs[view]. curTab(view), firstOpenStep
       (view), drawTabs (every bar), showPane(k) (the step's own view).
     - openStep(k) for a step in the other view clicks that rail button
       first, so Confirm and release (and the Vendor Status pill links)
       land on Distribution. Confirmation's fine print says so.
     - Distribution before release: Submit to Vendor draws a locked card
       (Confirm and release first, with a link to Publish) instead of
       the mailto block.
     - ipp:view answers both views; ipp:board redraws the open one.
     HARDCODING
       HC-P-GI1-2  The Distribution head words ("After publish",
                   "Distribute this Issue") and the locked-card copy.
                   Platform level, same class as the Publish head.

   v2.19 (17 Oct 2026, 106 Gap Interview S1 · step 4) — EDIT THE ENVELOPE
   ON CONFIRMATION; COMPILE AGAIN FROM THERE; THE GREETING RULE.
     Ruled 17 Oct (Jeff):
     1 · Confirmation edits in place. Subject, preview, sends, sectors and
         send time are envelope fields (NEWSLETTER): none is in the HTML,
         so changing them needs no rebuild. The Inbox, Audience and Goes
         out read-backs get one Edit link; it swaps them for the Send
         Setup card itself (same editors, same Save, same per-field
         Cancel, same gold pending border), drawn in a second host inside
         this pane. Save clears the release exactly as a Send Setup save
         does, and returns the read-back. A Done link leaves the editor
         when nothing is pending. While a draft is open on this tab the
         tab stays open: stepOpen('confirm') reads the saved settings,
         not the draft (setupGate(true)); Compile still refuses a draft.
     2 · Contents and Advertisers link to Picker, Layout and Revenue, and
         a Compile again button sits under them for changes made in the
         blocks. It runs the same compile as step 2 (which already
         rechecks every link afterwards, v2.8); if the board is not green
         it opens step 2 instead so the red tiles show. A "changed since
         the last compile" line waits on the Worker reporting block
         edits after compile; until then the button is always offered.
     3 · The greeting: the paragraph (web page) and the short greeting
         (email) are required; the title is optional (the Worker's
         readiness rule, ix-issue-data v1.0.61). The tile counts 2 parts
         and names the missing one; the fix modal marks only those two
         required. v2.18 required all three, against the ruling.
     Setup editors now draw into every [data-publish-setup] host and read
     the host the control sits in; nothing else in them changed.

   v2.18 (16 Oct 2026, IPP Build S20 · step 2) — THE PRE-CHECK COUNT IS
   RECORDED ON THE NEWSLETTER.
     Ruled 16 Oct (Jeff): the Issues tab pill says "Compile" while this
     page says "13 things to fix", so the pill carries the count. The
     page is the only place the count exists, so each time the Compile
     board finishes a check it writes the number to the newsletter:
       publish-step-state.check = { fixes: <n>, at: <ISO time> }
     (the field the vendor ticks and link memory already live in, via
     Scenario 124 op nlmeta). The Data Worker (v1.0.60) answers it on
     /plans and the Issues tab (v1.0.42) prints it.
     · Written only when the count differs from the one recorded, never
       while the board is still checking, and no sooner than 15 s after
       the last write. A failed write is one console warning, no toast
       (nothing of the operator's was lost).
     · The local plan row is updated in place after the write, so the
       page does not reload and later writes to publish-step-state (the
       vendor ticks) merge from the current value, not a stale one.
     No new hardcoding. The record's shape pairs with ix-issue-data
     v1.0.60 publishStepOf.

   v2.17 (15 Oct 2026, IPP Build S17 · Catalog S3) — GROUPS FROM THE
   CATALOG.
     1 · A Before-Publish group is a catalog entry (BOARD.catalog, the
         same list the Picker and Layout read). A block belongs to the
         entry whose labels hold its type, or, untyped, to the entry
         with add "" and its asset type (the Picker's rule). Groups
         come in catalog order, then Other blocks (a block no entry
         covers), then Delivery. Group names: the title's SECTIONS name
         for the entry, else the catalog name. GROUP_ORDER and
         GROUP_FALLBACK are gone; so is the typed 'GR' test, replaced
         by one constant GR (HC-P-S16-1 class) used to find the
         Greeting entry and the Greeting slot.
     2 · The tiles a group gets follow its kind: the entry's asset
         type (article, ad, event, re, text-ad), greeting for the
         Greeting entry, other for the rest. Local Weather, Around
         Town, Divider and Spacer are each their own group now, each
         with its left-out tile; weather's forecast tile stays under
         Delivery. The group's colour follows its kind (CSS v2.5
         unchanged: ipp-cx-g--<kind>), and a second class names the
         entry (ipp-cx-g--k-<key>) for later styling.
     3 · With no catalog on the board (older Worker) every block falls
         into Other blocks and a tile says so; nothing is typed back in.
   Earlier: see the v2.16 note below and ipp-publish-v1.6.js.

   v2.16 (13 Oct 2026, Allocator RE Events · 5, step 2) — DONE PICKING
   GATES COMPILE; THE DESIGN MUST MATCH THE COUNT.
     Spec Allocator-RE-Events v1.13 §7.4 (ruled 13 Oct, Q1 and Q2).
     Two tiles join each list group (Events, Real Estate, and The Find
     once it is filled on the Picker):
     · "Marked done" — red, stops Compile, until the block's Done
       picking tick on the Picker is on (slot.listDone): "Events not
       marked done. Tick Done picking on the Picker." Grey when the plan
       data has no Done answer yet (older Worker).
     · "Design matches the count" — red, stops Compile, when the block's
       design is made for a count (designInfo.itemCount) other than the
       number of items it holds, or when it has no design and holds
       items: "Open Picker and Save to set the design from the count."
       Not shown for a block whose design carries no count.
     A plan with no Events or Real Estate block has neither tile.
     Pairs ipp-publish-v2.5.css (unchanged). No new hardcoding.

   v2.15 (13 Oct 2026) — "Articles fit their blocks" sends you to Layout.
     Ruled by Jeff 13 Oct: a block takes its article's type. With
     ipp-layout v1.0.20 a mismatched block already shows the article's
     type on Layout and needs only Save (and a design). So the red tile's
     button is now Open Layout and its text says what to do there:
     "Open Layout, pick a TS design and Save." An article with no
     Section is set on the Article form (the Picker links to it), so
     that line now says "Set its Section on the Article form."
     Pairs ipp-publish-v2.5.css (unchanged). No new hardcoding.

   v2.14 (13 Oct 2026) — "Articles fit their blocks" reads in one line.
     A red tile shows one line of text (ipp-publish-v2.5.css), so v2.13's
     message was cut after the headline. And when one article was in the
     wrong block and another had no Section, v2.13 named only the first
     while counting both ("2 of 4"). Now:
       · the first sentence is a count of each problem, e.g.
         "1 article in the wrong type of block. 1 has no Section.";
       · the detail for every article follows it (whole text on hover);
       · both kinds are named whenever both exist.
     Nothing else changed.

   v2.13 (13 Oct 2026, Controls Parity step 7) — ARTICLES FIT THEIR
   BLOCKS. Ruled: the pre-check lists an article whose type (its
   Section's) differs from its block; Compile leaves that block out.
     1 · A new tile in Articles, after "Designs fit each block":
         "Articles fit their blocks". Red, stops Compile, when any
         article's type differs from its block (slot.typeCheck.ok false),
         naming each: position, headline, its type and Section, and the
         block's type. Opens the Picker, where the article's Section is
         changed or another article chosen.
         Red but NOT stopping Compile (warn) when an article has no
         Section, or its Section has no type: it compiles, and the tile
         says the Picker can only place it in an untyped slot.
         Green otherwise. Not shown when the Worker sends no typeCheck.
     2 · A block left out for this reason (compile.kind 'article-type',
         v1.0.52) is named only on the new tile, never again under
         "Left out of the email" or as a design problem.

   v2.12 (Modular 206 S3, 12 Oct 2026) — THE WEATHER TILE
     1 · A "Weather" tile in Delivery, before the links tile. It reads
         the board's answer for this newsletter (newsletters[].weather),
         which is the same rule Compile meets:
           off        green  "Not in this issue" (no LW block)
           ready      green  "Ready", forecast from the publish date
           too-far    red, does NOT stop Compile (warn and allow, ruled
                      by Jeff): Compile leaves the strip out; the tile
                      names the day to compile again
           failed / unknown   red, does not stop Compile (the forecast
                      service, not the issue)
           past       red, stops Compile (ruled by Jeff: a passed date
                      is blocked); the fix is on Layout
           no-date / no-place   red, stops Compile, with the reason
         A red tile that does not stop Compile is state "warn": drawn
         exactly like a red tile, counted in its group's chip, left out
         of "things to fix before Compile". Every red line still has a
         red tile.
     2 · The version badge now says v2.12. v2.10 and v2.11 kept saying
         v2.9 because VERSION and FILE were never bumped.
     HARDCODING
       HC-P-M206-16  Weather tile wording, and which states stop Compile
                     (past, no-date, no-place). Page rule from Jeff's
                     rulings, 12 Oct 2026.

/* ---- v2.11 header follows ---- */
/* ============================================================
   ipp-publish-v2.11.js — Publish view for the IPP · PUBLISH THIS ISSUE
   Companion stylesheet: ipp-publish-v2.5.css (unchanged)
   Needs Data Worker ix-issue-data v1.0.38 (cls "unchecked").

   v2.11 (Modular 206 · Assembler port S1, 12 Oct 2026) — CONFIRMATION
   OPENS WHEN THE PANEL SAYS IT CAN
     Seen on WLN-998B: compiled, every tile green, the panel said "Links
     respond 8 of 8", and step 3 Confirmation stayed locked. The panel
     counts a link you confirmed with It works (v2.9); the lock did not.
     It still demanded that every link in the email answered the checker.
     1 · The lock now asks the same question as the panel: no link that
         failed the check and that you have not confirmed. One rule, two
         places that show it.
   Includes all of v2.10 (never deployed on its own; skip it).
   ============================================================ */
/* ---- v2.10 header follows ---- */
/* ============================================================
   ipp-publish-v2.10.js — Publish view for the IPP · PUBLISH THIS ISSUE
   Companion stylesheet: ipp-publish-v2.5.css (unchanged)
   Needs Data Worker ix-issue-data v1.0.38 (cls "unchecked").

   v2.10 (Modular 206 · Assembler port S1, 12 Oct 2026) — IT WORKS ON
   EVERY FLAGGED LINK
     Seen on WLN-999: three ad links that open fine were marked dead,
     because the checker itself hit a Cloudflare limit. Dead links had no
     It works, so the only way on was to change a good link.
     Ruled 12 Oct (Jeff): a person opening the link beats the checker.
     1 · Every flagged link offers It works: turned away, dead, and the
         new "could not check" (the Data Worker answers cls "unchecked"
         when the failure is Cloudflare's, not the site's). Remembered for
         this issue, the same NEWSLETTER publish-step-state as before.
     2 · A dead link stays red until you press It works. Once confirmed,
         the tile is green and its line says how many links you opened
         yourself, dead ones counted, so a confirmed dead link is never
         silently forgotten.
     3 · "Or change the link" is still there under every link.
     Nothing else changed.
   ============================================================ */
/* ---- v2.9 header follows ---- */
/* ============================================================
   ipp-publish-v2.9.js — Publish view for the IPP · PUBLISH THIS ISSUE
   Companion stylesheet: ipp-publish-v2.5.css (unchanged)

   v2.9 (IPP Build S12, 11 Oct 2026) — A RED LINE ALWAYS HAS A RED TILE
     Seen live on WLN-998B: the Compile panel said "Links respond 7 of 8"
     in red while every tile was green, and nothing offered a fix.
     Two checks, two lists. The tiles check each record's link before
     Compile (/links), and a site that turned the checker away counts
     once you say "It works". The panel checks every link in the
     compiled email (/link-check), which carries tracking codes, and it
     never looked at "It works". So the link you had confirmed was red
     again in the panel.
     1 · "It works" is matched without the tracking codes (utm_* dropped),
         so a link you confirmed counts in the panel too.
     2 · A new Delivery tile, "Links in the email", after a compile:
         green when every link answers or you have confirmed it; red with
         Correct when one does not. Correct lists each such link with
         Open link and It works (remembered for this issue, the same
         NEWSLETTER publish-step-state as the record links). A link from
         a record is still changed in its record, through that group's
         own links tile. The panel line and the tile always agree.
     Nothing else changed.

   v2.8 (IPP Build S10, 11 Oct 2026) — CORRECT BUTTONS
     Built from compile-correct-mockup v0.2 (all 10 changes accepted).
     1 · Correct opens a small window over the board (ix-modals). The
         tiles never change size. Every changed value has the gold border
         until Save; each block in the window has its own small Cancel,
         and the footer Cancel puts everything back. While changes are
         waiting, clicking outside or Esc does nothing (ruled 11 Oct).
     2 · Save writes, then reads the records back (TOAST-TRUTH). Only
         then does it say Saved; the tile checks itself again from the
         fresh read. A change that did not land stays gold with
         "Not saved: <why>".
     3 · Delivery: subject, preview and send time, saved to the same
         NEWSLETTER fields Send Setup uses (124 op nlmeta). As in Send
         Setup, saving clears a recorded release.
     4 · Greeting: all three parts, the empty one marked required. Saved
         the way the Picker saves it: Scenario 122 block-save gr, then
         the plan is read back up to 4 times (HC-P-IPP3-3).
     5 · Cloned ads: each banner shown full width at its real shape, one
         Approve per ad, Save clears adFields.approval on each (124 clear).
     6 · Designs: only board.designChoices[<block label>] is offered (the
         title's own designs first). Saved with 124 fill on
         blockFields.design.
     7 · Links checked before Compile, read from their records
         (Data Worker /links): one tile per group (Article, Ad, Event,
         Listing links work). Dead, turned away, or works.
     8 · A turned-away link: Open link, then It works, remembered for this
         issue in NEWSLETTER publish-step-state (links: { <url>: time }).
         A dead link is cleared only by a new link, saved to the record
         through Scenario G v6 updateAsset (article: part "link").
     9 · Pictures (article main image, listing photo, event photo): pick
         from the title's MEDIA (Data Worker /media) or upload (Uploadcare,
         then Scenario B, the same keys ASF sends). Saved through
         Scenario G v6 (article: part "picture"; listing: MEDIA reference
         and photo URL; event: the hero URL). New tile: Event photos.
    10 · Real choices keep "Open …": an empty banner or article slot, an
         event dated before the send, sponsors, anything 206 leaves out.
     Also: every tile names all its failures, not only the first.
     Compile writes only the compile: it no longer clears the release.
     Confirmation says "Compiled again after you confirmed" and Submit to
     Vendor says "The vendor has an older file" when the compile is newer
     (times compared, nothing stored; the compile time is the newsletter's
     last publish, from /issue-check lastCompile.at, or this session's).
     Unapproved cloned ads stay red (the accepted v0.6 rule).
     HARDCODING (provisional ids)
       HC-P-S10-5  G_TYPES: the asset types Scenario G v6 updates.
       HC-P-S10-6  UC_T: the main and share-image crops, copied from ASF
                   CFG.transforms (one more copy; candidate for the email
                   tokens cascade).
       HC-P-S10-7  GR_MAX 30 / 300 / 140: the Picker's greeting limits.
                   (retired v2.52: the greeting parts' limits come from the board)
       HC-P-S10-8  UPLOAD_SOURCE 'asf-upload': the source Scenario B's
                   browser-upload route accepts.
     Needs: ix-issue-data v1.0.34 (IX_CONFIG r3), Scenario G v6, ix-modals
     CSS on the page, PP_WEBHOOKS links, media, studio, conditioner, ipp.

   v2.7 (IPP Build S9, 11 Oct 2026) — THE NEW COMPILE STEP
     Built from compile-landscape-mockup v0.6 (all 8 changes accepted).
     1 · Layout. The Compile card runs full width (no 860px cap): the
         check board on the left, the Compile panel on the right, which
         stays on screen while the board scrolls.
     2 · Grouped by what is in the newsletter: Articles, Ads, Events,
         Real Estate, The Find, Greeting, Delivery (Picker, Revenue and
         Layout are never headings). A group shows only when the issue
         has its blocks. Group names come from IX_CONFIG.sections via
         the board, so "The Find" is the title's word for TXA, not typed
         here. "Ads" and "Delivery" are page copy. Blocks no group owns
         (LW, Divider, Spacer, AT) sit under "Other blocks", which shows
         only if one of them would be left out.
     3 · One line adds up the issue: "N blocks = 7 Articles, 12 Ads, ...",
         one fixed-width chip per group, salmon when the group has a red
         tile. SB blocks never count (they are never in the email).
     4 · Tiles: equal widths filling the row (2, 3 or 4 across by
         container width), 124px tall, heading on one line, a big
         answer, up to three lines of explanation.
     5 · Only checks that can fail. Gone: Published in Webflow, Placed
         in the issue, the splash, zips/sends/sectors, allocations from
         print, the issue address. The new rules: an event dated before
         the send day is red; Goes out is red only when the time has
         passed (no comparison to the last issue, ruled 11 Oct).
     6 · A red tile carries its own fix button (Open Picker, Revenue,
         Layout or Send Setup).
     7 · The panel is Compile only: verdict, Compile issue, the first
         red reason, Check again, then Last compile (email size with a
         bar, blocks compiled, links respond, links carry tracking,
         View email, View web page, all links). Email size over the
         line is shown there and no longer blocks Compile.
     8 · "Designs fit" tiles confirm; Layout prevents (Layout build).
     Anything Scenario 206 v1.44 would leave out is always on a red
     tile: its design tile, its content tile, or "Left out of the
     email" with 206's own reason. "206 would stop" (/issue-check)
     still switches Compile off and shows in the panel.
     Ruled 9 Oct, warn-only for unapproved cloned ads, is superseded by
     the accepted v0.6 table: an unapproved cloned ad is now red.
     Lock rule, for the record (final 10 Oct, reaffirmed 11 Oct): only
     Locked is read-only; a Next plan stays editable. The v2.2 note
     below that says ["Locked","Next"] is history.
     HC-P-S8-5  Subject 60 and preview 100 characters: the tiles reuse
                MAXLEN (HC-P-PUB7-1), the same limits Send Setup types
                against. (retired v2.52: the ranges come from the board, HC-W-74-1)
                against, so there is one copy. Candidates for title settings.
     Needs: ix-issue-data v1.0.33 with IX_CONFIG.compile set.

   v2.6 (IPP Build S7, 10 Oct 2026) — FALSE SAVE-FAILED TOAST
     A red "0 send settings not saved" toast showed after every good
     Send Setup save (v2.4 bug: the error toast hung off an else of
     the release check instead of checking for failures).

   v2.5 (IPP Build S7, 10 Oct 2026) — TWO FIXES
     1. The version badge said v2.3 (VERSION was not bumped in v2.4).
     2. Send date default was a day early: Webflow stores the issue
        date as midnight UTC, which is the evening before in New York
        (Oct 21 showed as Oct 20, 8:00 PM). The default now takes the
        issue's calendar date as written and a default send time of
        8:00 AM local. HC-P-S7-17: the 8:00 AM default is typed here;
        candidate for a title setting (send time) later.

   v2.4 (IPP Build S7, 10 Oct 2026) — PUBLISH WRITES THE NEWSLETTER STATUS
     Ruled 10 Oct (Jeff). The newsletter's Publishing Status follows the
     steps, in the same PATCH as the step's own write:
       Confirm and release        → Ready to Publish
       Withdraw, or a Send Setup
       change that clears the release → Draft
       Vendor Status "Fully set up" saved   → Publish Next as Current
       "Fully set up" unticked     → Ready to Publish (Draft if not released)
     The option ids come from the Worker (ix-issue-data v1.0.32,
     publish.statusIds), read by label from the schema; none are typed
     here. If an id is missing the step still saves and the toast says
     the status was not changed. TOAST-TRUTH: the status is read back.
     The Pub Plans tab (issues-tab v1.0.37) colours Next from it.

   Needs on the page: ix-tokens, ix-buttons, ix-form-controls v1.1.0,
   ix-success-toast (CSS + JS), ix-info (CSS + JS), ipp-shell v1.13+,
   ipp-revenue v1.6.0+ (banner gate). Data: ix-issue-data v1.0.32
   (/plan-board publish block, /link-check, /email-html, /issue-check). Writes:
   Scenario 124 v2.19 op nlmeta (PATCH NEWSLETTER, staged).

   v2.3 (IPP Build S7, 10 Oct 2026) — SECTORS ARE A LIST OF SEGMENTS
     Ruled 10 Oct (Jeff): sectors are not only an age band. They are the
     vendor's targeting segments, e.g. "Homeowners", "Ages 20-80",
     "Income over $55K". Send Setup now edits them as a list of chips:
     type one and press Enter (or Add), x removes one. Stored in
     NEWSLETTER send-sectors and TITLES-ADMIN send-sectors-default as
     plain text, segments separated by "; " (the field is single-line
     Plain text, so no line breaks). A bare range such as "20-80" (the
     v2.0 to v2.2 format) reads as "Ages 20-80". The title's default list
     arrives as gold chips waiting for Save, else "Ages 20-80"
     (HC-P-PUB20-1). The board, Confirmation and the vendor email list
     every segment. Order is kept; a duplicate is ignored.

   v2.2 (IPP Build S7, 10 Oct 2026) — VENDOR STATUS STAYS OPEN ON A NEXT PLAN
     Ruled 10 Oct (Jeff): a Next plan is read-only (IX_CONFIG
     lockedPlanStatuses ["Locked","Next"]). Send Setup and the release
     follow that lock, but Vendor Status tracks the vendor, not the plan,
     so its tick boxes stay usable on a Next or Locked plan: Set as Next
     may happen before the vendor's last reply. Nothing else changed.

   v2.1 (IPP Build S7, 10 Oct 2026) — STEPS 4 AND 5 BY HAND
     Ruled 10 Oct (Jeff): no sending or mailbox watching yet. Step 4 is
     copy and paste: To (IX_CONFIG.vendor via the board), Subject and
     Body built from the saved values (Newsletter ID included), each with
     a Copy button; "Download the HTML file" (this session's compile, else
     the Worker's /email-html); "Open in Outlook" (a mail link with To,
     Subject and Body filled; attach the file yourself). Then "I sent it".
     Step 5 is five tick boxes Jeff sets himself: sent to the vendor,
     vendor confirmed receipt, in testing, test looked right, fully set
     up. Each shows when it was ticked and, in grey, what could do it
     automatically later. Ticks follow the editing pattern: gold until
     Save, Cancel per tick, Save writes them all. They live as JSON in the
     existing NEWSLETTER field publish-step-state (read back before
     "Saved"). Fully set up turns the rail deep green with a lock
     (root class ipp-pub-done). Set as Next stays the Pub Plans button
     for now; the pane says so. The release cannot be withdrawn once the
     email is marked sent.
     Supersedes v2.0 (not deployed); everything in v2.0 below still holds
     except that steps 4 and 5 are no longer simulations.

   v2.0 (IPP Build S7, 10 Oct 2026) — FIVE STEPS, 1 TO 3 LIVE, 4 AND 5 SIMULATED
     Designed in ipp-publish-mockup (v0.1 to v0.7) and ruled by Jeff on
     10 Oct. Supersedes the unshipped v1.7 to v1.9.
     1 SEND SETUP   NEWSLETTER fields: email-subject (60), email-preview
                    (100), send-volume, send-sectors (v2.3: "A; B; C"), send-time
                    (date and time, ISO, entered in this computer's time
                    zone). Zip codes are read-only from TITLES-ADMIN
                    send-zip-codes ("set once on the title"). Defaults,
                    offered as gold changes waiting for Save: the legacy
                    planner's subject/preview; sectors from TITLES-ADMIN
                    send-sectors-default, else 20-80 (HC-P-PUB20-1); send
                    date and time from the issue's publish-date. Every value
                    is required. A missing Webflow field is named exactly.
                    Gold changed border, Cancel per field, Save, Cancel all;
                    changed inputs carry .ipp-dirty for the shell's Close.
                    Save re-reads the board and compares every field before
                    "Saved" (TOAST-TRUTH). Saving clears a recorded release.
     2 COMPILE      The readiness board: Picker (content per block, the
                    feature, the greeting, unpublished records, print
                    allocations, closing-note and design notes), Revenue
                    (banners N of N, Clone approvals warn, splash, sponsors),
                    Layout (every block has its own place), Send Setup (each
                    value), Web (OG image, archive image, address), Build
                    (newsletter linked, 206 would stop, size). Compile is on
                    only when nothing is red. After a confirmed compile the
                    Worker opens every link in the saved email (/link-check)
                    and lists its tracking codes; a link that does not
                    answer blocks Confirmation. A new compile clears the
                    release.
     3 CONFIRMATION The read-back (what, when with a countdown, inbox,
                    audience with the Newsletter ID, contents, advertisers),
                    three ticks, and the release button. It writes the time
                    to final-send-authorized-at and reads it back; Withdraw
                    clears it. Opens only when Compile is done and every
                    link answers.
     4, 5           SIMULATION, labelled on screen: the vendor email built
                    from the saved values (Newsletter ID included), a
                    simulated send, and Vendor Status with waiting / in
                    testing / fully ready / queued. Fully ready turns the
                    rail green with a lock (class ipp-sim-done on the root).
                    Nothing is sent or saved. Vendor and mailbox are not
                    chosen yet (Stirista, Data Axle).
     Steps unlock in order; a locked step says why. Opens on the first
     step not done.
     Not yet detected: Picker/Revenue/Layout edits made after a compile
     (the board re-checks them, but the release is not cleared by them).

   HISTORY: v1.6 banners N of N (live). v1.5 unapproved-ads warning. v1.4
   pre-check. v1.3 compile result. Earlier: see ipp-publish-v1.6.js.
   ============================================================ */
(function () {
  'use strict';

  var VERSION = '2.62';   // v2.42: FILE is derived from this
  var DEFAULT_SEND_TIME = '08:00'; // HC-P-S7-17
  var FILE = 'ipp-publish-v' + VERSION + '.js';
  var MOUNTED = 'data-publish-mounted';
  var TIMEOUT_MS = 150000;
  var CLOCK_SLACK_MS = 300000;

  var STAGE = {
    data:    'Stopped while reading the issue\u2019s data',
    render:  'Stopped while building the email and web page',
    save:    'Stopped while saving the issue',
    publish: 'Saved, but not published'
  };

  var state = { result: null, running: false, last: null, emailUrl: '', checking: false, stopped: false, lastCheck: null, compiledOk: false, tab: null, links: null, rl: null };

  // ── page values ──────────────────────────────────────────────
  // v1.2 — this plan's newsletter(s), from the filtered list only.
  function newsletters() {
    var seen = {}, out = [];
    var els = document.querySelectorAll('.newsletter-source [data-nl-id]');
    Array.prototype.forEach.call(els, function (el) {
      var id = (el.getAttribute('data-nl-id') || '').trim();
      if (!id || seen[id]) return;
      seen[id] = 1;
      out.push({ id: id, name: (el.getAttribute('data-issue-name') || '').trim() });
    });
    return out;
  }
  function planId() {
    var t = (window.IPP && IPP.tenant) ? IPP.tenant() : {};
    if (t.pubplanId) return t.pubplanId;
    var el = document.querySelector('.pubplan-slot-wrapper[data-pubplan-id]');
    return (el && el.getAttribute('data-pubplan-id')) || '';
  }
  function ids() {
    var n = newsletters();
    var one = n.length === 1 ? n[0] : null;
    return {
      nlId:      one ? one.id : '',
      issue:     one ? one.name : '',
      pubplanId: planId(),
      found:     n
    };
  }
  function hook() { return (window.PP_WEBHOOKS || {}).compile || ''; }
  // v2.21 (D12, ruling 9): the vendor file is named for the plan, no timestamp.
  function emailFileName() { return (ids().issue || 'newsletter') + '.html'; }
  function checkUrl() { return (window.PP_WEBHOOKS || {}).issueCheck || ''; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function kb(bytes) { return (Math.round(bytes / 102.4) / 10).toFixed(1); }
  // ── helpers ──────────────────────────────────────────────────
  function boardData() { return (window.IPP && IPP.board && typeof IPP.board.data === 'function') ? IPP.board.data() : null; }
  function blockWriter() { return (window.PP_WEBHOOKS || {}).blockWriter || ''; }
  function linkCheckUrl() {
    var pb = (window.PP_WEBHOOKS || {}).planBoard || '';
    return (window.PP_WEBHOOKS || {}).linkCheck || (pb ? pb.replace(/\/plan-board.*$/, '/link-check') : '');
  }
  function planLocked() { var b = boardData(); return !!(b && b.plan && b.plan.locked); }
  function pubBoard() { var b = boardData(); return b && b.publish ? b.publish : null; }
  function pubRow() {
    var p = pubBoard(), nl = ids().nlId; if (!p || !nl) return null;
    for (var i = 0; i < (p.newsletters || []).length; i++) if (p.newsletters[i].id === nl) return p.newsletters[i];
    return null;
  }
  function rawVal(k) { var r = pubRow(); var v = r && r.values ? r.values[k] : null; return v == null ? '' : String(v); }
  // v2.4 — put the newsletter status into a PATCH. Returns the id written,
  // or '' when this page cannot (no field, or no id for that label).
  function withStatus(fd, key) {
    var p = pubBoard(); if (!p || !p.fields || !p.fields.status || p.types.status === null) return '';
    var id = (p.statusIds || {})[key] || ''; if (!id) return '';
    fd[p.fields.status] = id; return id;
  }
  function statusCheck(id, okMsg) {
    if (!id) { IxToast.show('Newsletter status not changed', 'err', { detail: 'The plan data has no status id for this step. Check ix-issue-data v1.0.32 and its warnings.' }); return; }
    if (rawVal('status') !== id) IxToast.show('Newsletter status not saved', 'err', { detail: 'The newsletter did not keep its new Publishing Status. ' + (okMsg || '') });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function localStamp(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function isoToLocal(v) { var d = v ? new Date(v) : null; return d && !isNaN(d) ? localStamp(d) : ''; }
  function niceWhen(local, long) {
    if (!local) return '';
    var d = new Date(local); if (isNaN(d)) return local;
    return d.toLocaleDateString('en-US', { weekday: long ? 'long' : 'short', month: long ? 'long' : 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  function digits(v) { return String(v == null ? '' : v).replace(/[^0-9]/g, ''); }
  function commas(v) { v = digits(v); return v ? Number(v).toLocaleString('en-US') : ''; }
  // v2.3 sectors: a list of segments, stored "A; B; C".
  function sectorList(v) {
    var seen = {}, out = [];
    String(v == null ? '' : v).split(/\s*(?:;|\n)\s*/).forEach(function (x) {
      x = x.replace(/\s+/g, ' ').trim(); if (!x) return;
      if (/^\d{1,3}\s*[-\u2013to]+\s*\d{1,3}$/i.test(x)) x = 'Ages ' + x.replace(/\s*(?:-|\u2013|to)\s*/i, '-');
      var key = x.toLowerCase(); if (seen[key]) return; seen[key] = 1; out.push(x);
    });
    return out;
  }
  function sectorsNorm(v) { return sectorList(v).join('; '); }
  function sectorsShown(v) { return sectorList(v).join(' \u00b7 '); }

  // ── step 1 · Send Setup ──────────────────────────────────────
  var SETUP_KEYS = ['subject', 'preview', 'volume', 'sectors', 'sendAt'];
  var SETUP_OPTIONAL = { sectors: 1 };                             // v2.55: sectors may be left blank (Jeff, 23 Oct)
  var LABEL = { subject: 'Subject line', preview: 'Preview text', volume: 'Number of sends', sectors: 'Sectors',
                sendAt: 'Send date and time', zips: 'Zip codes' };
  // v2.52 — the word ranges are read from the board (ix-issue-data v1.0.74 words.ranges, HC-W-74-1); nothing is typed here but the volume digit cap
  var VOLUME_MAX = 9;                                              // HC-P-PUB52-1: digits in Number of sends
  var NO_RANGES = 'Ranges not answered by the Worker (needs ix-issue-data v1.0.74)';   // HC-P-PUB52-2
  var WORD_RANGE_KEYS = ['subject', 'preview', 'closing', 'title', 'supershort', 'paragraph'];
  function wordRanges() { var b = boardData(), r = b && b.words && b.words.ranges; return (r && WORD_RANGE_KEYS.every(function (k) { return Array.isArray(r[k]) && r[k].length === 2 && r[k][1] > 0; })) ? r : null; }
  function maxLen(k) { if (k === 'volume') return VOLUME_MAX; var r = wordRanges(); return r && r[k] ? r[k][1] : 0; }   // 0 = no range known
  function minLen(k) { var r = wordRanges(); return r && r[k] ? r[k][0] : 0; }
  function rangeTxt(k) { if (!wordRanges()) return '?'; return minLen(k) > 1 ? minLen(k) + '\u2013' + maxLen(k) : '' + maxLen(k); }
  function outOfRange(k, v) { v = String(v == null ? '' : v); if (!v) return ''; if (!wordRanges()) return NO_RANGES + '.'; if (minLen(k) && v.length < minLen(k)) return LABEL[k] + ' is ' + v.length + ' characters; it needs ' + rangeTxt(k).replace('\u2013', ' to ') + '.'; if (maxLen(k) && v.length > maxLen(k)) return LABEL[k] + ' is ' + v.length + ' characters; it needs ' + rangeTxt(k).replace('\u2013', ' to ') + '.'; return ''; }
  var TIMES = []; for (var h = 0; h < 24; h++) for (var m = 0; m < 60; m += 15) TIMES.push(pad(h) + ':' + pad(m));
  var EM = { draft: {}, seeded: {}, seedVal: {}, saving: false, fails: {}, note: '' };   // v2.53: seedVal = the value offered

  function norm(k, v) {
    v = String(v == null ? '' : v);
    if (k === 'volume') return digits(v);
    if (k === 'sectors') return sectorsNorm(v);
    if (k === 'sendAt') return /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(v) ? v : isoToLocal(v);
    return v.replace(/\s+/g, ' ').trim();
  }
  function savedVal(k) { return norm(k, rawVal(k)); }
  function curVal(k) { return (k in EM.draft) ? norm(k, EM.draft[k]) : savedVal(k); }
  function isChanged(k) { return (k in EM.draft) && norm(k, EM.draft[k]) !== savedVal(k); }
  function changedKeys() { return SETUP_KEYS.filter(isChanged); }
  // v2.53: still exactly the default the program offered (not your edit)
  function isAuto(k) { return isChanged(k) && (k in EM.seeded) && (k in EM.seedVal) && norm(k, EM.draft[k]) === EM.seedVal[k]; }
  function dirtyCls(k) { return isChanged(k) ? ' ipp-dirty' + (isAuto(k) ? ' ipp-auto' : '') : ''; }
  function fieldMissing(k) { var p = pubBoard(); return !!(p && p.types && p.types[k] === null); }
  function titleInfo() { var p = pubBoard(); return (p && p.title) || { zips: null, sectorsDefault: null, has: {} }; }

  // Defaults offered once, as gold changes waiting for Save.
  function seedDefaults() {
    if (EM.seededOnce || !pubRow()) return;
    EM.seededOnce = true;
    var el = document.querySelector('.pubplan-slot-wrapper[data-section-code="em"]');
    if (el) ['subject', 'preview'].forEach(function (k) {
      var lg = norm(k, el.getAttribute('data-email-' + k));
      if (lg && !savedVal(k) && !fieldMissing(k)) { EM.draft[k] = lg.slice(0, maxLen(k) || lg.length); EM.seeded[k] = 'From the legacy planner. Save to keep it.'; EM.seedVal[k] = norm(k, EM.draft[k]); }
    });
    var td = sectorsNorm(titleInfo().sectorsDefault);                     // v2.55: only the title's own default; no fallback
    if (td && !savedVal('sectors') && !fieldMissing('sectors')) {
      EM.draft.sectors = td;
      EM.seeded.sectors = 'The title\u2019s default sectors. Save to keep them, or remove them; sectors are optional.';
      EM.seedVal.sectors = norm('sectors', EM.draft.sectors);                // v2.53
    }
    if (!savedVal('sendAt') && !fieldMissing('sendAt')) {
      // HC-P-S7-17: issue date is a calendar date; use it as written
      // (not converted from UTC) with the default send time.
      var rawIss = String(rawVal('issueDate') || ''), dm = rawIss.match(/^(\d{4}-\d\d-\d\d)/);
      var iss = dm ? dm[1] + 'T' + DEFAULT_SEND_TIME : '';
      if (iss) { EM.draft.sendAt = iss; EM.seeded.sendAt = 'The issue date. Save to keep it.'; EM.seedVal.sendAt = norm('sendAt', iss); }
    }
  }

  function setupGate(ignoreDraft) {                              // v2.19: ignoreDraft for stepOpen('confirm')
    if (!boardData()) return { ok: false, wait: true, html: 'Reading the send settings\u2026' };
    var p = pubBoard();
    if (!p) return { ok: false, html: 'The plan data has no send settings (needs Data Worker v1.0.29 or later).' };
    if (!pubRow()) return { ok: false, html: 'This plan\u2019s newsletter was not found in the plan data.' };
    var miss = SETUP_KEYS.filter(fieldMissing);
    if (miss.length) return { ok: false, html: 'Create the NEWSLETTER field' + (miss.length > 1 ? 's ' : ' ') + miss.map(function (k) { return p.fields[k]; }).join(', ') + ' (Plain text) in Webflow.' };
    var t = titleInfo();
    if (!t.has || !t.has.zips) return { ok: false, html: 'Create the TITLES-ADMIN field send-zip-codes (Plain text) in Webflow, and fill it for this title.' };
    var ch = ignoreDraft ? 0 : changedKeys().length;
    if (ch) return { ok: false, html: 'Send Setup has ' + ch + ' unsaved change' + (ch === 1 ? '' : 's') + '. Save or cancel them first.' };
    var empty = SETUP_KEYS.filter(function (k) { return !SETUP_OPTIONAL[k] && !savedVal(k); }).map(function (k) { return LABEL[k].toLowerCase(); });
    if (!t.zips) empty.unshift('zip codes (on the title)');
    if (empty.length) return { ok: false, html: 'Still to fill in: ' + empty.join(', ') + '.' };
    return { ok: true, html: 'Send Setup is complete.' };
  }

  function rowHtml(k, inner, extra) {
    var c = isChanged(k), fail = EM.fails[k], miss = fieldMissing(k);
    var cnt = (k === 'subject' || k === 'preview') ? '<span class="ipp-pub-em-count' + (outOfRange(k, curVal(k)) ? ' is-over' : '') + '" data-em-count="' + k + '">' + (wordRanges() ? curVal(k).length + '/' + rangeTxt(k) : NO_RANGES) + '</span>' : '';   // v2.36, board ranges v2.52
    var note = miss ? '<p class="ipp-pub-em-note is-bad">Create the NEWSLETTER field ' + esc(pubBoard().fields[k]) + ' (Plain text) in Webflow.</p>'
      : fail ? '<p class="ipp-pub-em-note is-bad">Not saved: ' + esc(fail) + '</p>'
      : (c && EM.seeded[k] && norm(k, EM.draft[k]) === curVal(k)) ? '<p class="ipp-pub-em-note">' + esc(EM.seeded[k]) + '</p>'
      : (extra || '');
    return '<div class="ipp-pub-em-row" data-em-row="' + k + '"><div class="ipp-pub-em-labelrow"><span class="ipp-pub-em-label">' + LABEL[k] + '</span>' +
      (SETUP_OPTIONAL[k] ? '<span class="ipp-pub-em-opt">optional</span>' : '') +   // v2.55
      (c && !EM.saving ? '<button type="button" class="ix-revert" data-em-cancel="' + k + '">Cancel</button>' : '') + cnt + '</div>' + inner + note + '</div>';
  }
  function cls(k) { return 'ix-picker-input' + (isChanged(k) ? ' ix-picker-input--changed' : '') + dirtyCls(k); }   // v2.53
  function dis(k) { return (planLocked() || released() || EM.saving || fieldMissing(k)) ? ' disabled' : ''; }   // v2.46: a released issue is locked here too

  function setupCardHtml() {
    if (!boardData()) return '<p class="ipp-pub-em-wait">Reading the send settings\u2026</p>';
    var p = pubBoard(), row = pubRow();
    if (!p || !row) return '<p class="ipp-pub-em-wait">' + esc(setupGate().html) + '</p>';
    seedDefaults();
    var t = titleInfo();
    var sub = rowHtml('subject', '<input type="text" class="' + cls('subject') + '" data-em-field="subject"' + (maxLen('subject') ? ' maxlength="' + maxLen('subject') + '"' : '') + ' value="' + esc(curVal('subject')) + '" placeholder="What the inbox shows as the subject"' + dis('subject') + '>');
    var pre = rowHtml('preview', '<input type="text" class="' + cls('preview') + '" data-em-field="preview"' + (maxLen('preview') ? ' maxlength="' + maxLen('preview') + '"' : '') + ' value="' + esc(curVal('preview')) + '" placeholder="The grey line after the subject in the inbox"' + dis('preview') + '>');
    var zips = (t.zips || '').split(/[\s,;]+/).filter(Boolean);
    var zipHtml = '<div class="ipp-pub-em-row"><div class="ipp-pub-em-labelrow"><span class="ipp-pub-em-label">Zip codes</span><span class="ipp-pub-em-opt">from the title \u00b7 same every issue</span></div>' +
      (zips.length ? '<div class="ipp-pub-chips">' + zips.map(function (z) { return '<span class="ipp-pub-chip">' + esc(z) + '</span>'; }).join('') + '</div><p class="ipp-pub-em-note is-dim">Set once on the title. Change them there, not per issue.</p>'
        : '<p class="ipp-pub-em-note is-bad">' + (t.has && t.has.zips ? 'No zip codes on the title yet. Fill send-zip-codes on this title\u2019s TITLES-ADMIN item.' : 'Create the TITLES-ADMIN field send-zip-codes (Plain text), then fill it for this title.') + '</p>') + '</div>';
    var vol = rowHtml('volume', '<input type="text" inputmode="numeric" class="' + cls('volume') + '" data-em-field="volume" value="' + esc(commas(curVal('volume'))) + '" placeholder="e.g. 8,500"' + dis('volume') + '>');
    var sl = sectorList(curVal('sectors')), sd = dis('sectors');
    var sec = rowHtml('sectors', '<div class="ipp-pub-secs' + (isChanged('sectors') ? ' is-changed' : '') + dirtyCls('sectors') + '">' +
      sl.map(function (x, n) { return '<span class="ipp-pub-sec">' + esc(x) + (sd ? '' : '<button type="button" class="ipp-pub-sec-x" data-sec-del="' + n + '" aria-label="Remove ' + esc(x) + '">\u00d7</button>') + '</span>'; }).join('') +
      (sd ? '' : '<span class="ipp-pub-sec-add"><input type="text" class="ix-picker-input" data-sec-new placeholder="Add a sector, e.g. Homeowners" maxlength="60">' +
        '<button type="button" class="ix-btn ix-btn--secondary ix-btn--sm" data-sec-add>Add</button></span>') + '</div>',
      '<p class="ipp-pub-em-note is-dim">The vendor\u2019s targeting segments: age band, homeowners, income and so on. One per chip.</p>');
    var sa = curVal('sendAt'), sd = sa.slice(0, 10), st = sa.slice(11, 16);
    var tOpts = '<option value=""></option>' + TIMES.map(function (x) { var d = new Date('2000-01-01T' + x); return '<option value="' + x + '"' + (x === st ? ' selected' : '') + '>' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + '</option>'; }).join('');
    var when = rowHtml('sendAt', '<div class="ipp-pub-when"><input type="date" class="' + cls('sendAt') + '" data-em-when="date" value="' + esc(sd) + '"' + dis('sendAt') + '>' +
      '<select class="' + cls('sendAt') + '" data-em-when="time"' + dis('sendAt') + '>' + tOpts + '</select></div>',
      '<p class="ipp-pub-em-note is-dim">In this computer\u2019s time zone. Defaults to the issue date.</p>');
    return '<div class="ipp-pub-setup-grid">' +                                   // v2.21 (ruling 12): across the width
      '<div class="ipp-pub-grp"><p class="ipp-pub-em-head">Inbox</p>' + sub + pre + '</div>' +
      '<div class="ipp-pub-grp"><p class="ipp-pub-em-head">Audience</p>' + zipHtml + '<div class="ipp-pub-two">' + vol + '<div></div></div>' + sec + '</div>' +
      '<div class="ipp-pub-grp ipp-pub-grp--wide"><p class="ipp-pub-em-head">Schedule</p>' + when + '</div>' +
      '<div class="ipp-pub-setup-foot">' + setupFootHtml() + '</div></div>';
  }
  function setupFootHtml() {
    var ch = changedKeys();
    return planLocked() ? '<p class="ipp-pub-em-note is-dim">This plan is locked. The send settings are read-only.</p>'
      : released() ? '<p class="ipp-pub-em-note is-dim">Released. Unlock the issue on Compile to change the send settings.</p>'   // v2.46
      : '<div class="ipp-pub-em-actions">' +
          '<button type="button" class="ix-btn ix-btn--primary ix-btn--sm" data-em-save' + (ch.length && !EM.saving ? '' : ' disabled') + '>' +
            (EM.saving ? 'Saving\u2026' : ch.length ? 'Save ' + ch.length + ' change' + (ch.length === 1 ? '' : 's') : 'Save') + '</button>' +
          (ch.length > 1 && !EM.saving ? '<button type="button" class="ix-revert" data-em-cancel-all>Cancel all</button>' : '') +
          (EM.note ? '<span class="ipp-pub-em-status">' + esc(EM.note) + '</span>' : '') +
        '</div>';
  }
  function setupHosts() { return Array.prototype.slice.call(document.querySelectorAll('[data-publish-setup]')); }   // v2.19: step 1's card and, while editing, Confirmation's
  function drawSetup() {
    var hosts = setupHosts(); if (!hosts.length) return;
    var act = document.activeElement, key = act && act.getAttribute && (act.getAttribute('data-em-field') || null), pos = null;
    var home = key && act.closest ? act.closest('[data-publish-setup]') : null;
    if (key) { try { pos = act.selectionStart; } catch (e) {} }
    EM.drawing = true;
    try { var html = setupCardHtml(); hosts.forEach(function (box) { box.innerHTML = html; }); } finally { EM.drawing = false; }
    if (key && home) { var n = home.querySelector('[data-em-field="' + key + '"]'); if (n) { n.focus(); try { if (pos != null && key !== 'volume') n.setSelectionRange(pos, pos); } catch (e) {} } }
  }
  function setDraft(k, v) {
    delete EM.fails[k]; EM.note = '';
    if (norm(k, v) === savedVal(k)) { delete EM.draft[k]; delete EM.seeded[k]; } else EM.draft[k] = v;
  }
  function liveRefresh(k) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-publish-setup] [data-em-row="' + k + '"]'), function (row) {   // v2.19: every host
      Array.prototype.forEach.call(row.querySelectorAll('input,select'), function (el) {
        el.classList.toggle('ix-picker-input--changed', isChanged(k)); el.classList.toggle('ipp-dirty', isChanged(k)); el.classList.toggle('ipp-auto', isAuto(k));   // v2.53
      });
      Array.prototype.forEach.call(row.querySelectorAll('.ipp-pub-secs'), function (el) { el.classList.toggle('ipp-dirty', isChanged(k)); el.classList.toggle('ipp-auto', isAuto(k)); });
      var cnt = row.querySelector('[data-em-count]'); if (cnt) { cnt.textContent = wordRanges() ? curVal(k).length + '/' + rangeTxt(k) : NO_RANGES; cnt.classList.toggle('is-over', !!outOfRange(k, curVal(k))); }   // v2.36, board ranges v2.52
      var lr = row.querySelector('.ipp-pub-em-labelrow'), cb = lr && lr.querySelector('[data-em-cancel]');
      if (isChanged(k) && !cb && lr) { var b = document.createElement('button'); b.type = 'button'; b.className = 'ix-revert'; b.setAttribute('data-em-cancel', k); b.textContent = 'Cancel';
        lr.insertBefore(b, lr.querySelector('.ipp-pub-em-count')); }
      else if (!isChanged(k) && cb) cb.parentNode.removeChild(cb);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-publish-setup] .ipp-pub-em-actions'), function (act) { var t = document.createElement('div'); t.innerHTML = setupFootHtml(); act.parentNode.replaceChild(t.firstChild, act); });
    refreshAll();
  }
  function onSetupInput(el) {
    var k = el.getAttribute('data-em-field');
    if (k) { var v = k === 'volume' ? digits(el.value).slice(0, VOLUME_MAX) : el.value.slice(0, maxLen(k) || el.value.length); setDraft(k, v); liveRefresh(k); return; }
    var box = el.closest('[data-publish-setup]') || document.querySelector('[data-publish-setup]');   // v2.19: the host the control sits in

    if (el.hasAttribute('data-em-when')) {
      var d = box.querySelector('[data-em-when="date"]').value, t = box.querySelector('[data-em-when="time"]').value;
      setDraft('sendAt', d && t ? d + 'T' + t : ''); liveRefresh('sendAt');
    }
  }

  function addSector() {                                         // v2.3
    var inp = document.querySelector('.ipp-pub-pane:not([hidden]) [data-publish-setup] [data-sec-new]') || document.querySelector('[data-publish-setup] [data-sec-new]'); if (!inp) return;   // v2.19: the visible host
    var v = inp.value.replace(/[;\n]+/g, ' ').trim(); if (!v) { inp.focus(); return; }
    setDraft('sectors', sectorList(curVal('sectors')).concat([v]).join('; '));
    drawSetup(); refreshAll();
    var again = document.querySelector('.ipp-pub-pane:not([hidden]) [data-publish-setup] [data-sec-new]'); if (again) again.focus();
  }

  // One PATCH to the NEWSLETTER through Scenario 124 op nlmeta, then a fresh
  // re-read: success only when every field reads back as written (TOAST-TRUTH).
  function patchNewsletter(fd) {
    var url = blockWriter(), row = pubRow();
    if (!url) return Promise.reject(new Error('this page has no PP_WEBHOOKS.blockWriter address (Scenario 124)'));
    if (!row) return Promise.reject(new Error('the plan data has no newsletter for this plan'));
    var batchId = 'pub-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    var ops = [{ id: row.id, body: JSON.stringify({ fieldData: fd }) }];
    var u = url + (url.indexOf('?') < 0 ? '?' : '&') + 'op=nlmeta&batchId=' + encodeURIComponent(batchId) +
      '&batch=' + encodeURIComponent(JSON.stringify({ ops: ops }));
    return fetch(u, { method: 'GET', credentials: 'omit' }).then(function (r) {
      return r.text().then(function (t) {
        if (!r.ok) throw new Error(refusalOf(t) || ('Scenario 124 answered HTTP ' + r.status + (r.status === 400 ? ' (is v2.19, op nlmeta, imported?)' : '')));   // v2.51: the Worker's sentence first
        var b; try { b = JSON.parse(t); } catch (x) { throw new Error('Scenario 124 sent a reply that is not JSON. Is v2.19 (op nlmeta) imported?'); }
        if (b && b.op && b.op !== 'nlmeta') throw new Error('Scenario 124 does not know op nlmeta yet. Import v2.19.');
        var res = (b && b.results && b.results[0]) || null;
        if (!res || res.ok !== true || !res.id) throw new Error('Webflow refused the write');
      });
    }).then(function () { return (window.IPP && IPP.board && IPP.board.load) ? IPP.board.load({ fresh: true }) : null; });
  }

  function setupSave() {
    var ch = changedKeys(); if (!ch.length || EM.saving) return;
    var p = pubBoard(); if (!p) return;
    var bad = wordRanges() ? ch.map(function (k) { return outOfRange(k, norm(k, EM.draft[k])); }).filter(Boolean) : [NO_RANGES + '.'];   // v2.36: the Words ranges; v2.52: from the board, none = refuse
    if (bad.length) { EM.note = 'Not saved: ' + bad.join(' '); drawSetup(); return; }
    var fd = {}, want = {};
    ch.forEach(function (k) {
      var v = norm(k, EM.draft[k]); want[k] = v;
      var slug = p.fields[k];
      if (k === 'volume') fd[slug] = v === '' ? null : (p.types.volume === 'Number' ? Number(v) : v);
      else if (k === 'sendAt') fd[slug] = v === '' ? null : new Date(v).toISOString();
      else fd[slug] = v === '' ? null : v;
    });
    if (released()) { EM.note = 'Not saved: this issue is released. Unlock it on Compile first.'; drawSetup(); return; }   // v2.46: no back door out of Released
    var wasAuthorized = false, stId = null;                                 // v2.46: a Send Setup save never clears the release now
    EM.saving = true; EM.fails = {}; EM.note = ''; drawSetup(); refreshAll();
    patchNewsletter(fd).then(function () {
      var bad = ch.filter(function (k) { return savedVal(k) !== want[k]; });
      EM.saving = false;
      bad.forEach(function (k) { EM.fails[k] = 'the newsletter did not keep the change'; });
      ch.forEach(function (k) { if (bad.indexOf(k) < 0) { delete EM.draft[k]; delete EM.seeded[k]; } });
      if (!bad.length) { EM.note = 'Saved'; IxToast.show('Send Setup saved', 'ok', wasAuthorized ? { detail: 'The release for distribution was cleared. Compile and confirm again.' } : undefined); }
      if (wasAuthorized) statusCheck(stId);   // v2.4
      if (!changedKeys().length) CF.edit = false;   // v2.19: nothing pending, Confirmation shows the read-back again
      if (bad.length) IxToast.show(bad.length + ' send setting' + (bad.length === 1 ? '' : 's') + ' not saved', 'err', { detail: bad.map(function (k) { return LABEL[k]; }).join(', ') });
      drawSetup(); refreshAll(); if (confirmShown()) drawConfirm();   // v2.19
    }).catch(function (err) {
      EM.saving = false;
      var why = (err && err.message) || 'the request failed';
      ch.forEach(function (k) { EM.fails[k] = why; });
      IxToast.show('Send Setup not saved', 'err', { detail: why });
      drawSetup(); refreshAll();
    });
  }

  // ── step 2 · the readiness board ─────────────────────────────
  function revenueGate() {
    if (!window.IPPRevenue || typeof IPPRevenue.gate !== 'function')
      return { ok: false, html: 'Revenue is not on this page (needs ipp-revenue v1.6.0 or later), so the banner slots cannot be checked.' };
    var g = IPPRevenue.gate();
    if (!g.loaded) return { ok: false, wait: true, html: 'Reading the banner slots\u2026' };
    if (g.empty.length) {
      var n = g.empty.length;
      return { ok: false, html: 'Banners ' + g.filled + '/' + g.total + ': ' + n + (n === 1 ? ' slot is' : ' slots are') + ' empty (' + esc(g.empty.slice(0, 6).join(', ')) + (n > 6 ? ', \u2026' : '') + '). Fill or delete ' + (n === 1 ? 'it' : 'them') + '.', go: 'revenue' };
    }
    if (g.unsaved) return { ok: false, html: 'Revenue has ' + g.unsaved + ' unsaved change' + (g.unsaved === 1 ? '' : 's') + '. Save or cancel there first.', go: 'revenue' };
    return { ok: true, html: 'Banners ' + g.filled + '/' + g.total + ': every slot is filled.' };
  }
  var GO = { revenue: 'Open Revenue', picker: 'Open Picker', layout: 'Open Layout', setup: 'Open Send Setup', words: 'Open Words' };   // greeting v2.33; words v2.35
  var HOLD_FILL = 'Fill';   // v2.54, HC-P-PUB54-1: the one button on a hold row

  // ── v2.7 · the Compile check board ───────────────────────────
  // Grouped by what is in the newsletter, never by IPP tab. A tile is
  // a rule that can fail: green passed, red failed (with its own fix
  // button), grey still reading. The facts come from /plan-board
  // (ix-issue-data v1.0.33): blockLabel, designInfo, designFits,
  // items, compile (206 v1.44's three tests), asset.ogSrc.
  // v2.17 — groups are catalog entries. GROUP_COPY is page copy for the
  // two groups that are not entries.
  var GROUP_COPY = { holds: 'Notes and reserved tiles', stop: 'Pre-check', edits: 'Unsaved changes', other: 'Other blocks', revenue: 'Revenue', delivery: 'Delivery' };   // v2.41; v2.44 edits; v2.54 holds, stop
  var GR = 'GR';                                                            // HC-P-S16-1 class: the Greeting block type
  function catalog() { var b = boardData(); return (b && b.catalog) || []; }
  function catEntry(s) {
    var cat = catalog(), l = String((s && (s.blockType || s.blockLabel)) || '');
    for (var i = 0; i < cat.length; i++) {
      var e = cat[i];
      if (e.blocks === false) continue;
      if (l ? (e.labels || []).indexOf(l) >= 0 : (e.add === '' && e.assetType === s.assetType)) return e;
    }
    return null;
  }
  // v2.39 — the stories sitting inside an Around Town group whose section is sponsored this issue.
  // Groups follow Layout's load rule: an opener takes the groupable blocks after it, in position
  // order, up to the first endGroup mark; a non-groupable block closes the group before it. HC-P-PUB39-1
  function sponsoredInGroups(b) {
    var slots = ((b && b.slots) || []).slice().sort(function (x, y) { return (Number(x.position) || 0) - (Number(y.position) || 0); }), out = [];
    for (var i = 0; i < slots.length; i++) {
      var e = catEntry(slots[i]);
      if (!(e && e.opener === true)) continue;
      if (slots[i].endGroup === true) continue;
      for (var j = i + 1; j < slots.length; j++) {
        var s = slots[j], te = catEntry(s);
        if (!(te && te.groupable === true)) break;
        if (s.assetType === 'article' && s.asset && !s.asset.missing && s.sponsor && s.sponsor.name) out.push(s);
        if (s.endGroup === true) break;
      }
      i += Math.max(0, j - i - 1);
    }
    return out;
  }
  function catByKey(k) { var cat = catalog(); for (var i = 0; i < cat.length; i++) if (cat[i].key === k) return cat[i]; return null; }
  // The tile set a group takes: its entry's asset type, greeting, or other.
  function kindOf(g) {
    if (g === 'other' || g === 'delivery' || g === 'revenue' || g === 'edits') return g;   // v2.41; v2.44
    if (g === 'holds' || g === 'stop') return 'holds';                                         // v2.54: one spine colour for both
    var e = catByKey(g);
    if (!e) return 'other';
    if ((e.labels || []).indexOf(GR) >= 0) return 'greeting';
    return ['article', 'ad', 'event', 're', 'text-ad'].indexOf(e.assetType) >= 0 ? e.assetType : 'other';
  }
  function groupOrder() { return ['holds', 'stop', 'edits'].concat(catalog().filter(function (e) { return e.blocks !== false; }).map(function (e) { return e.key; }), ['other', 'revenue', 'delivery']); }   // v2.41: Revenue before Delivery; v2.44: Unsaved changes first
  function T_(s, h, v, c, go, thumb, fix, slot) { return { s: s, h: h, v: v, c: c || '', go: go || null, thumb: thumb || '', fix: fix || null, slot: slot || '' }; }   // slot v2.54
  function sold(t, n, kind) { t.sale = { n: n, kind: kind }; return t; }   // v2.42: what a sold tile stands for
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  // v2.58 (HC-P-PUB58-1): a tile is named as the Picker shows it, never by its position number.
  function typeName(s) { var e = catEntry(s); return (e && (e.sectionName || e.name)) || ''; }
  function tileName(s) {
    if (!s) return 'a tile';
    if (s.asset && !s.asset.missing && s.asset.name) return 'the \u201c' + snip(s.asset.name) + '\u201d tile';
    var t = typeName(s);
    if (found(s).length) return 'the ' + (t || 'unnamed') + ' tile';
    return t ? 'an empty ' + t + ' tile' : 'an empty tile with no type';
  }
  function cap(x) { x = String(x || ''); return x.charAt(0).toUpperCase() + x.slice(1); }
  function andList(n) { return n.length < 3 ? n.join(' and ') : n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1]; }
  function tileNames(ss) { return andList(ss.map(tileName)); }
  function nameList(xs) { var n = xs.map(function (x) { return x.name || x.id; }); return n.length < 3 ? n.join(' and ') : n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1]; }

  function groupOf(s) {
    if (s.compile && s.compile.state === 'not-email') return null;      // SB: never in the email
    var e = catEntry(s);                                                 // v2.17
    return e ? e.key : 'other';
  }
  // Group names: the title's SECTIONS name for the entry, else the
  // catalog's name. Nothing typed here.
  function groupName(g) {
    if (GROUP_COPY[g]) return GROUP_COPY[g];
    var e = catByKey(g);
    if (e && (e.labels || []).indexOf(GR) >= 0) return 'Words';   // v2.37, HC-P-PUB37-1: the Greeting block's group judges the Words tab
    return (e && (e.sectionName || e.name)) || g;
  }

  function leftOut(s) { return !!(s.compile && s.compile.state === 'left-out'); }
  function found(s) { return (s.items || []).filter(function (x) { return !x.missing; }); }
  function contentEmpty(s) {
    var L = String(s.blockLabel || '').toUpperCase();
    if (L === 'EV' || L === 'RE' || L === 'TXA') return !found(s).length;
    return !(s.asset && !s.asset.missing);
  }
  function designWhy(s) {                                   // '' when the design is fine
    if (!s.design) return 'has no design';
    if (s.designInfo && s.designInfo.missing) return 'points at a design that is not in DESIGNS';
    if (s.designFits === false) return 'uses ' + (s.designInfo && s.designInfo.name ? '\u201c' + s.designInfo.name + '\u201d' : 'a design') + ', which is made for ' + (s.designInfo && s.designInfo.label) + ' blocks';
    return '';
  }
  // Why 206 would leave a block out: 'type', 'design' or 'content'.
  function outKind(s) {
    if (!leftOut(s)) return null;
    if (s.compile.kind === 'article-type') return 'article-type';   // v2.13
    if (!s.compile.lane) return 'type';
    if (designWhy(s)) return 'design';
    if (s.compile.lane === 'heavy' && contentEmpty(s)) return 'content';
    return 'design';                                        // its template file is not this type's
  }
  function designOk(s) { return !designWhy(s) && outKind(s) !== 'design'; }

  function designTile(ss, k) {
    var bad = ss.filter(function (s) { return !designOk(s); });
    if (!bad.length) return T_('ok', 'Designs fit each block', ss.length + ' of ' + ss.length, 'Each block uses a design made for its type.');
    var none = bad.filter(function (s) { return designWhy(s) === 'has no design'; }), rest = bad.filter(function (s) { return designWhy(s) !== 'has no design'; });   // v2.58: counted, then named
    var why = (none.length === 1 ? cap(tileName(none[0])) + ' has no design.' : none.length ? plural(none.length, 'tile') + ' have no design: ' + tileNames(none) + '.' : '') +
      rest.map(function (s) { return ' ' + cap(tileName(s)) + ' ' + (designWhy(s) || 'has a design whose email file is not made for ' + (s.blockLabel || 'its type')) + '.'; }).join('');
    why = why.trim();
    return T_('bad', 'Designs fit each block', (ss.length - bad.length) + ' of ' + ss.length, why, 'layout', '', { kind: 'design', ids: bad.map(function (s) { return s.id; }), k: k + ' \u00b7 Designs fit each block' });   // v2.38: owned by Layout for the rail dot; the Correct button stays (fix wins in tileHtml)
  }
  // v2.13 — an article's type is its Section's; it must match the block.
  function typeTile(ss, K) {
    var arts = ss.filter(function (s) { return s.asset && !s.asset.missing && s.typeCheck; });
    if (!arts.length) return null;                          // older Worker, or no articles yet
    var bad = arts.filter(function (s) { return s.typeCheck.ok === false; });
    var unk = arts.filter(function (s) { return s.typeCheck.reason === 'untyped-article'; });
    var name = function (s) { return '\u201c' + (s.asset.name || '') + '\u201d'; };
    var sec = function (s) { return s.asset.sectionName ? ' (' + s.asset.sectionName + ')' : ''; };
    var an = function (x) { return /^[AEFHILMNORSX]/i.test(x) ? 'an ' : 'a '; };
    var v = (arts.length - bad.length - unk.length) + ' of ' + arts.length;
    // v2.14 — a count first (a red tile shows one line), then each article.
    var lead = [];
    if (bad.length) lead.push(plural(bad.length, 'article') + ' in the wrong type of block.');
    if (unk.length) lead.push(unk.length + (unk.length === 1 ? ' has' : ' have') + ' no Section type.');
    var det = bad.map(function (s) { var t = s.typeCheck; return name(s) + ' is ' + an(t.article) + t.article + ' story' + sec(s) + ' in ' + an(t.block) + t.block + ' block.'; })   // v2.58: no position
      .concat(unk.map(function (s) { return name(s) + (s.asset.sectionName ? ' is in ' + s.asset.sectionName + ', which has no type.' : ' has no Section.'); }));
    if (bad.length) return T_('bad', 'Articles fit their blocks', v, lead.join(' ') + ' ' + det.join(' ') +
      ' Open Layout, pick ' + (bad.length === 1 ? an(bad[0].typeCheck.article) + bad[0].typeCheck.article + ' design' : 'a design for each') + ' and Save.', 'layout');   // v2.15
    if (unk.length) return T_('warn', 'Articles fit their blocks', v, lead.join(' ') + ' ' + det.join(' ') +
      ' ' + (unk.length === 1 ? 'It still compiles' : 'They still compile') + '. Set ' + (unk.length === 1 ? 'its' : 'their') + ' Section on the Article form.', 'picker');   // v2.15
    return T_('ok', 'Articles fit their blocks', v, 'Each article\u2019s Section matches its block\u2019s type.');
  }
  // v2.16 — Done picking (slot.listDone, Data Worker v1.0.53) gates Compile
  function doneTile(ss, K) {
    var known = ss.filter(function (s) { return s.listDone === true || s.listDone === false; });
    if (!known.length) return ss.some(function (s) { return s.listDone === null; })
      ? T_('wait', 'Marked done', 'Unknown', 'The plan data has no Done answer (needs Data Worker v1.0.53).') : null;
    var open = known.filter(function (s) { return s.listDone !== true; });
    if (!open.length) return T_('ok', 'Marked done', 'Done', 'Done picking is ticked on the Picker.');
    return T_('bad', 'Marked done', 'Not yet', K + ' not marked done. Tick Done picking on the Picker.', 'picker');
  }
  // v2.16 — a design made for a count must match the items the block holds
  function countTile(ss, K) {
    var counted = ss.filter(function (s) { return s.designInfo && !s.designInfo.missing && Number.isInteger(s.designInfo.itemCount); });
    var bare = ss.filter(function (s) { return !s.design && found(s).length; });
    if (!counted.length && !bare.length) return null;
    var bad = counted.filter(function (s) { return found(s).length !== s.designInfo.itemCount; });
    if (!bad.length && !bare.length) return T_('ok', 'Design matches the count', counted.length === 1 ? counted[0].designInfo.itemCount + ' items' : 'All match', 'The design is the one made for the number of items in the block.');
    var why = bad.map(function (s) { return cap(tileName(s)) + ' holds ' + plural(found(s).length, 'item') + ' but uses \u201c' + (s.designInfo.name || '') + '\u201d, made for ' + s.designInfo.itemCount + '.'; })
      .concat(bare.map(function (s) { return cap(tileName(s)) + ' holds ' + plural(found(s).length, 'item') + ' and has no design.'; })).join(' ');
    return T_('bad', 'Design matches the count', 'Mismatch', why + ' Open Picker and Save to set the design from the count.', 'picker');
  }
  function leftTile(ss, covered) {                          // anything 206 drops that no other tile names
    var out = ss.filter(function (s) { var k = outKind(s); return k && covered.indexOf(k) < 0; });
    if (!out.length) return null;
    return T_('bad', 'Left out of the email', plural(out.length, 'block'), out.map(function (s) { return cap(tileName(s)) + ': ' + String(s.compile.why || 'compile would skip it.').replace(/\.$/, '') + '.'; }).join(' '), 'layout');
  }
  function sendDay() { var v = savedVal('sendAt'); var d = v ? new Date(v) : null; return d && !isNaN(d) ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null; }
  function dayOf(iso) { var d = iso ? new Date(iso) : null; return d && !isNaN(d) ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null; }
  function shortWhen(local) { var d = new Date(local); return isNaN(d) ? local : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
  function clock(local) { var d = new Date(local); return isNaN(d) ? '' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
  function shortDay(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  function push(T, t) { if (t) T.push(t); }

  // v2.12 — the weather tile, from the board (HC-P-M206-16)
  function wxDay(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : String(iso || '');
  }
  function weatherTile() {
    var b = boardData(), ns = (b && b.publish && b.publish.newsletters) || [], nl = ids().nlId;
    var n = ns.filter(function (x) { return x.id === nl; })[0] || (ns.length === 1 ? ns[0] : null);
    var w = n && n.weather;
    if (!w) return T_('wait', 'Weather', 'Unknown', 'The plan data has no weather answer (needs Data Worker v1.0.42).');
    switch (w.state) {
      case 'off':      return T_('ok', 'Weather', 'Not in this issue', 'There is no weather block in the layout.');
      case 'ready':    return T_('ok', 'Weather', 'Ready', 'Forecast from ' + wxDay(w.date) + ', fetched at Compile.');
      case 'too-far':  return T_('warn', 'Weather', 'Too far ahead', 'Compile leaves the strip out. Compile again on or after ' + wxDay(w.availableOn) + ' to include it.', 'layout');
      case 'past':     return T_('bad', 'Weather', 'Date has passed', 'The publish date (' + wxDay(w.date) + ') has passed. Remove the weather block on Layout.', 'layout');
      case 'no-date':  return T_('bad', 'Weather', 'No publish date', 'Set the publish date. The forecast starts on it.');
      case 'no-place': return T_('bad', 'Weather', 'No location', 'The title has no weather location (TITLES-ADMIN weather-lat and weather-lon), or remove the weather block on Layout.', 'layout');
      default:         return T_('warn', 'Weather', 'Could not check', 'The forecast could not be checked' + (w.error ? ' (' + w.error + ')' : '') + '. Compile will try again.');
    }
  }

  // v2.8: every tile names all its failures; a fix that can be made here
  // is a Correct (fix), a real choice made on another tab stays Open (go).
  function tilesFor(key, ss) {
    var T = [], b = boardData(), K = groupName(key), g = kindOf(key);   // v2.17: g is the kind, key the entry
    if (g === 'article') {
      var filled = ss.filter(function (s) { return s.asset && !s.asset.missing; });
      var fa = ss.filter(function (s) { return String(s.blockLabel || '').toUpperCase() === 'FA'; }).sort(function (x, y) { return x.position - y.position; })[0];
      var byL = {}; ss.forEach(function (s) { var k = s.blockLabel || 'untyped'; byL[k] = (byL[k] || 0) + 1; });
      var mix = Object.keys(byL).map(function (k) { return byL[k] + ' ' + k; }).join(', ');
      var empty = ss.filter(function (s) { return !(s.asset && !s.asset.missing); });
      if (!fa) T.push(T_('bad', 'Articles selected', filled.length + ' of ' + ss.length + ' slots', 'This plan has no Feature Article block.', 'layout'));
      else if (empty.length) T.push(T_('bad', 'Articles selected', filled.length + ' of ' + ss.length + ' slots', (empty.length === 1 ? cap(tileName(empty[0])) + ' has no article.' : plural(empty.length, 'tile') + ' have no article: ' + tileNames(empty) + '.'), 'picker'));   // v2.58
      else T.push(T_('ok', 'Articles selected', filled.length + ' of ' + ss.length + ' slots', mix + '. Feature: \u201c' + (fa.asset.name || '') + '\u201d.'));
      T.push(designTile(ss, K));
      push(T, typeTile(ss, K));                                  // v2.13
      var noImg = filled.filter(function (s) { return !s.asset.thumb; });
      var imgFix = function (list) { return { kind: 'photo', k: K + ' \u00b7 Main images', items: list.map(function (s) { return { id: s.asset.id, name: s.asset.name || '', kind: 'article', label: cap(tileName(s)) + ' \u00b7 main image' }; }) }; };
      T.push(noImg.length ? T_('bad', 'Main images', (filled.length - noImg.length) + ' of ' + filled.length, (noImg.length === 1 ? '' : plural(noImg.length, 'article') + ' have no main image: ') + noImg.map(function (s) { return '\u201c' + (s.asset.name || '') + '\u201d'; }).join(', ') + (noImg.length === 1 ? ' has no main image.' : '.'), null, '', imgFix(noImg))
        : T_('ok', 'Main images', filled.length + ' of ' + filled.length, 'Every selected article has a main image.'));
      var og = fa && fa.asset && !fa.asset.missing ? fa.asset.ogSrc : '';
      var faFix = fa && fa.asset && !fa.asset.missing ? imgFix([fa]) : null;
      T.push(og ? T_('ok', 'Share image (OG)', 'Set', 'Made from the Feature article\u2019s main image.', null, og)
        : T_('bad', 'Share image (OG)', 'Missing', fa && fa.asset ? 'The Feature article has no square main image to make it from.' : 'There is no Feature article to make it from.', faFix ? null : 'picker', '', faFix));
      T.push(og ? T_('ok', 'Archive page image', 'Matches', 'The Feature article\u2019s main image, the same as the share image.')
        : T_('bad', 'Archive page image', 'Missing', 'It comes from the Feature article\u2019s main image, which is missing.', faFix ? null : 'picker', '', faFix));
      var atBad = sponsoredInGroups(b);                                   // v2.39
      T.push(atBad.length ? T_('bad', 'Stories in Around Town', plural(atBad.length, 'story', 'stories') + ' misplaced', atBad.map(function (s) { return '\u201c' + (s.asset.name || 'Untitled') + '\u201d is in Around Town, but ' + ((s.section && s.section.name) || 'its section') + ' is sponsored this issue by ' + s.sponsor.name + '.'; }).join(' ') + ' Move ' + (atBad.length === 1 ? 'it' : 'them') + ' to ' + (atBad.length === 1 ? 'its' : 'their') + ' own block on Layout.', 'layout')
        : T_('ok', 'Stories in Around Town', 'None in a sponsored section', 'No story in an Around Town group belongs to a section that is sponsored this issue.'));
      push(T, linksTile('article', K));
      push(T, leftTile(ss, ['design', 'content', 'article-type']));   // v2.13
    } else if (g === 'ad') {
      // v2.41: Banner slots filled moved to the Revenue group
      var all = (b && b.slots) || [], ack = all.filter(function (s) { return s.needsAck; });
      // v2.41: Section sponsors moved to the Revenue group
      push(T, linksTile('ad', K));
      push(T, leftTile(ss, []));
    } else if (g === 'event') {
      var ev = []; ss.forEach(function (s) { ev = ev.concat(found(s)); });
      var none = ss.filter(function (s) { return !found(s).length; });
      var sd = sendDay(), early = sd ? ev.filter(function (e) { var d = dayOf(e.start); return d && d < sd; }) : [];
      var days = ev.map(function (e) { return dayOf(e.start); }).filter(Boolean).sort(function (x, y) { return x - y; });
      if (none.length) T.push(T_('bad', 'Events selected', plural(ev.length, 'event'), cap(tileNames(none)) + (none.length === 1 ? ' has' : ' have') + ' no events.', 'picker'));   // v2.58
      else if (early.length) T.push(T_('bad', 'Events selected', plural(ev.length, 'event'), early.map(function (e) { return '\u201c' + e.name + '\u201d is on ' + shortDay(dayOf(e.start)); }).join('; ') + ', before the ' + shortDay(sd) + ' send.', 'picker'));
      else T.push(T_('ok', 'Events selected', plural(ev.length, 'event'), (days.length ? shortDay(days[0]) + (days.length > 1 ? ' to ' + shortDay(days[days.length - 1]) : '') + '. ' : '') + (sd ? 'All on or after the send date.' : 'The send date is not set yet.')));
      T.push(designTile(ss, K));
      var evAll = []; ss.forEach(function (s) { evAll = evAll.concat(found(s).map(function (x) { return Object.assign({ _slot: s }, x); })); });
      var noEp = evAll.filter(function (x) { return !x.photo; });
      if (evAll.length) T.push(noEp.length ? T_('bad', 'Event photos', (evAll.length - noEp.length) + ' of ' + evAll.length, noEp.length === 1 ? '\u201c' + noEp[0].name + '\u201d has no photo.' : plural(noEp.length, 'event') + ' have no photo: ' + nameList(noEp) + '.', null, '',
          { kind: 'photo', k: K + ' \u00b7 Event photos', items: noEp.map(function (x) { return { id: x.id, name: x.name, kind: 'event', label: cap(tileName(x._slot)) + ' \u00b7 event photo' }; }) })
        : T_('ok', 'Event photos', evAll.length + ' of ' + evAll.length, 'Every event has a photo.'));
      push(T, countTile(ss, K));                                // v2.16
      push(T, doneTile(ss, K));                                 // v2.16
      push(T, linksTile('event', K));
      push(T, leftTile(ss, ['design', 'content']));
    } else if (g === 're') {
      var li = []; ss.forEach(function (s) { li = li.concat(found(s).map(function (x) { return Object.assign({ _slot: s }, x); })); });
      var none2 = ss.filter(function (s) { return !found(s).length; });
      T.push(none2.length ? T_('bad', 'Listings selected', plural(li.length, 'listing'), cap(tileNames(none2)) + (none2.length === 1 ? ' has' : ' have') + ' no listings.', 'picker')
        : T_('ok', 'Listings selected', plural(li.length, 'listing'), nameList(li) + '.'));
      T.push(designTile(ss, K));
      var noPh = li.filter(function (x) { return !x.photo; });
      T.push(noPh.length ? T_('bad', 'Listing photos', (li.length - noPh.length) + ' of ' + li.length, noPh.length === 1 ? '\u201c' + noPh[0].name + '\u201d has no photo.' : plural(noPh.length, 'listing') + ' have no photo: ' + nameList(noPh) + '.', null, '',
          { kind: 'photo', k: K + ' \u00b7 Listing photos', items: noPh.map(function (x) { return { id: x.id, name: x.name, kind: 're', label: cap(tileName(x._slot)) + ' \u00b7 listing photo' }; }) })
        : T_('ok', 'Listing photos', li.length + ' of ' + li.length, 'Every listing has a photo.'));
      push(T, countTile(ss, K));                                // v2.16
      push(T, doneTile(ss, K));                                 // v2.16
      push(T, linksTile('re', K));
      push(T, leftTile(ss, ['design', 'content']));
    } else if (g === 'text-ad') {
      var fx = []; ss.forEach(function (s) { fx = fx.concat(found(s)); });
      var none3 = ss.filter(function (s) { return !found(s).length; });
      T.push(none3.length ? T_('bad', K + ' selected', plural(fx.length, 'ad'), cap(tileNames(none3)) + (none3.length === 1 ? ' has' : ' have') + ' nothing selected.', 'picker')
        : T_('ok', K + ' selected', fx.length === 1 ? fx[0].name : plural(fx.length, 'ad'), fx.length === 1 ? 'One is chosen for this issue.' : nameList(fx) + '.'));
      T.push(designTile(ss, K));
      push(T, countTile(ss, K));                                // v2.16
      push(T, doneTile(ss, K));                                 // v2.16
      push(T, linksTile('text-ad', K));
      push(T, leftTile(ss, ['design', 'content']));
    } else if (g === 'greeting') {
      // v2.35: the six parts of the Words tab, judged together
      var gr = ss[0], gg = (gr && gr.greeting) || {};
      var wv = { subject: savedVal('subject'), preview: savedVal('preview'), closing: savedVal('closing'), title: String(gg.title || '').trim(), supershort: String(gg.supershort || '').trim(), paragraph: String(gg.paragraph || '').trim() };
      var wm = WD_KEYS.filter(function (k) { return !wv[k]; });
      var basis = (gg && gg.basis) || null, wchg = (basis && basis.changes) || [];
      var gdone = gr ? gr.greetingDone : null;                                                                                   // the Words tab's tick (null = the Worker has no such field)
      if (gdone === false) T.push(T_('bad', 'Newsletter marked done', 'Not yet', wm.length ? 'Tick \u201cThe newsletter is done\u201d on the Words tab, then write the words.' : 'The words exist, but the newsletter is not marked done. Tick it on the Words tab.', 'words'));
      var rg = wordRanges();                                                                                                    // v2.52: the Worker's ranges (HC-W-74-1)
      var wr = !rg ? [] : WD_KEYS.filter(function (k) { var n = wv[k].length; return n && (n < rg[k][0] || n > rg[k][1]); }).map(function (k) { return WD_LABEL[k] + ' is ' + wv[k].length + ' characters; it needs ' + (rg[k][0] > 1 ? rg[k][0] + ' to ' + rg[k][1] : 'under ' + (rg[k][1] + 1)) + '.'; });
      if (!rg) T.push(T_('bad', 'Word ranges', 'Not answered', NO_RANGES + '. Deploy the Worker, then reload.', 'words'));   // v2.52: HC-P-PUB52-2
      if (wm.length) T.push(T_('bad', 'Words written', (WD_KEYS.length - wm.length) + ' of ' + WD_KEYS.length + ' parts', 'Missing: ' + wm.map(function (k) { return WD_LABEL[k].toLowerCase(); }).join(', ') + '. Write them on the Words tab.', 'words'));
      else if (wr.length) T.push(T_('bad', 'Words outside their range', plural(wr.length, 'part'), wr.join(' ') + ' Fix on the Words tab.', 'words'));
      else if (basis && basis.stale) T.push(T_('bad', 'Words older than the issue', plural(wchg.length, 'change') + ' since', wordsChanges(wchg) + ' Keep the words or write them again on the Words tab.', 'words'));
      else T.push(T_('ok', 'Words written', WD_KEYS.length + ' of ' + WD_KEYS.length + ' parts', 'Subject, preview, title, short greeting, paragraph and closing are written' + (basis && basis.stored && basis.hasField ? ' and fit the issue as it stands.' : '.') + ' Change them on the Words tab.'));
      push(T, leftTile(ss, []));
    } else if (g === 'other') {
      if (key === 'other' && !catalog().length) T.push(T_('warn', 'Block catalog', 'Not read', 'The Data Worker answered no catalog, so these blocks could not be grouped.'));
      push(T, leftTile(ss, []));
    } else if (key === 'holds') {                                           // v2.54; v2.55 by key (kindOf('stop') is 'holds' too): notes and reserved tiles from the Data Worker (RT-9, RT-9a)
      boardHolds().forEach(function (h) {
        var tab = h.tab === 'revenue' ? 'revenue' : 'picker', where = tab === 'revenue' ? 'Revenue' : 'Picker';
        if (h.kind === 'note') T.push(T_('bad', 'Note \u00b7 \u201c' + snip(h.text) + '\u201d', where, 'This note holds a slot on the ' + where + '. Fill the slot, move the note to another plan, or delete it there.', tab, '', null, h.slotId));
        else T.push(T_('bad', 'Reserved \u00b7 \u201c' + snip(h.printTitle || 'Untitled') + '\u201d', where, 'A print item holds this tile and has no article yet. Match or create its article on the Picker.', tab, '', null, h.slotId));
      });
    } else if (key === 'stop') {                                            // v2.54; v2.55 by key: the pre-check's refusal, when no hold explains it
      var o = state.lastCheck && state.lastCheck.body, ws = o && o.ok === true && o.wouldStop ? o.wouldStop : null;
      if (ws && !boardHolds().length) T.push(T_('bad', 'The Data Worker would stop this compile', 'HTTP ' + (ws.status || ''), String(ws.message || 'no reason given') + ' Fix it, then Check again.'));
    } else if (g === 'edits') {                                             // v2.44: one hold tile per tab with open edits
      pendingTabs().forEach(function (e) { T.push(T_('hold', e.name, plural(e.n, 'change'), 'The ' + e.name + ' tab has ' + plural(e.n, 'unsaved change') + '. Compile builds from the saved plan: save or cancel there first.', e.go)); });
    } else if (g === 'revenue') {                                           // v2.41: what was sold, by name
      var allS = (b && b.slots) || [];                                        // v2.45: the ad block groups' own checks, first
      groupOrder().filter(function (k) { return kindOf(k) === 'ad'; }).forEach(function (k) {
        var ks = allS.filter(function (s) { return groupOf(s) === k; }); if (!ks.length) return;
        push(T, linksTile('ad', groupName(k)));
        push(T, leftTile(ks, []));
      });
      var rb = (b && b.splash) || null, rl = rb && Array.isArray(rb.newsletters) ? rb.newsletters : [];
      var rd = window.IPPRevenue && typeof IPPRevenue.readiness === 'function' ? IPPRevenue.readiness() : null;   // v2.43: sponsor and splash changes live here, not in gate()
      if (rd && rd.splash === 'unsaved') T.push(T_('hold', 'Splash', 'Unsaved', 'Revenue has unsaved splash changes. Save or cancel there first.', 'revenue'));
      else if (rd && rd.splash === 'needs' && rb && rl.length) T.push(T_('bad', 'Splash', 'Not ready', 'Revenue marks the splash not ready (a failed save, or the splash could not be read). Open Revenue to see why.', 'revenue'));
      else if (!rb) T.push(T_('wait', 'Splash', 'Reading\u2026', 'Reading the splash from the newsletter.'));
      else if (rl.length > 1) T.push(T_('bad', 'Splash', rl.length + ' newsletters', 'This plan has ' + plural(rl.length, 'newsletter record') + '; it should have one. The splash cannot be judged until the extra ' + (rl.length === 2 ? 'record is' : 'records are') + ' removed.'));
      else if (!rl.length) T.push(T_('bad', 'Splash', 'No newsletter', 'This plan has no newsletter record, so it has no splash page.'));
      else {
        var sn = rl[0], sc = sn.current || {};
        if (sn.source === 'paid') {                                          // HC-P-PUB41-1
          var miss = []; if (!sc.image) miss.push('no splash image'); if (Object.prototype.hasOwnProperty.call(sc, 'go') && !sc.go) miss.push('no link');   // the Worker's board may not carry go yet (ipp-revenue reads only image and name); an absent key is not a missing link
          T.push(miss.length ? T_('bad', 'Splash', sc.name || 'Paid', 'Sold to ' + (sc.name || 'a customer') + ' but the ad has ' + miss.join(' and ') + '. Pick its ad again on Revenue.', 'revenue', sc.image || '')
            : sold(T_('sold', 'Splash', sc.name || 'Paid', 'Sold this issue. The splash page shows this customer\u2019s ad.', null, sc.image || ''), 1, 'splash'));
        } else T.push(T_('ok', 'Splash', 'House splash', 'Not sold this issue; the splash page shows the title\u2019s house splash.'));
      }
      var allR = (b && b.slots) || [], bySec = {};
      allR.forEach(function (s) { if (s.section && s.section.id) { var k = s.section.id, sid = (s.sponsor && s.sponsor.id) || ''; (bySec[k] = bySec[k] || { name: s.section.name, ids: {}, n: {} }).ids[sid] = sid ? (s.sponsor.name || sid) : 'no sponsor'; (bySec[k].n[sid] = bySec[k].n[sid] || []).push(s.position); } });   // v2.40: a block with no sponsor counts too
      var sponPending = rd && rd.sponsors === 'unsaved';
      if (sponPending && !Object.keys(bySec).some(function (k) { return Object.keys(bySec[k].ids).some(function (i) { return !!i; }); })) T.push(T_('hold', 'Section sponsors', 'Unsaved', 'Revenue has unsaved sponsor changes. Save or cancel there first.', 'revenue'));   // v2.43: a first sponsor not yet saved has no section row to go red
      Object.keys(bySec).forEach(function (k) {
        var ids = Object.keys(bySec[k].ids).filter(function (i) { return !!i; });
        if (!ids.length) return;                                              // no sponsor is a resting state, not a row
        var all2 = Object.keys(bySec[k].ids);
        if (sponPending) T.push(T_('hold', bySec[k].name, 'Unsaved', 'Revenue has unsaved sponsor changes. Save or cancel there first.', 'revenue'));   // v2.43
        else if (all2.length > 1) T.push(T_('bad', bySec[k].name, 'Blocks disagree', all2.map(function (i) { return bySec[k].ids[i] + ' on block ' + bySec[k].n[i].join(' and '); }).join(', ') + '. Set one sponsor for the section on Revenue.', 'revenue'));
        else T.push(sold(T_('sold', bySec[k].name, bySec[k].ids[ids[0]], 'Sponsors ' + plural(bySec[k].n[ids[0]].length, 'block') + ' this issue.'), 1, 'sponsor'));   // v2.42: no position number
      });
      var rg = window.IPPRevenue && typeof IPPRevenue.gate === 'function' ? IPPRevenue.gate() : null;
      var leadS = allR.filter(function (s) { return s.assetType === 'ad'; }).sort(function (x, y) { return x.position - y.position; })[0];
      var leadN = leadS && leadS.asset && !leadS.asset.missing ? (leadS.asset.customer || leadS.asset.name) : '';
      if (!rg) T.push(T_('bad', 'Banners', 'Unknown', 'Revenue is not on this page (needs ipp-revenue v1.6.0 or later).'));
      else if (!rg.loaded) T.push(T_('wait', 'Banners', 'Reading\u2026', 'Reading the banner slots.'));
      else if (rg.empty.length) T.push(T_('bad', 'Banners', rg.filled + ' of ' + rg.total + ' filled', plural(rg.empty.length, 'slot is', 'slots are') + ' empty: ' + rg.empty.join(', ') + '. Fill or delete ' + (rg.empty.length === 1 ? 'it' : 'them') + '.', 'revenue'));
      else if (rg.unsaved) T.push(T_('hold', 'Banners', rg.filled + ' of ' + rg.total + ' filled', 'Revenue has ' + plural(rg.unsaved, 'unsaved change') + '. Save or cancel there first.', 'revenue'));
      else T.push(sold(T_('sold', 'Banners', rg.filled + ' of ' + rg.total + ' filled', (leadN ? 'Lead banner: ' + leadN + '. ' : '') + 'Every slot is filled.'), rg.filled, 'banner'));
    } else if (g === 'delivery') {
      var sg = setupGate();
      if (sg.wait) { T.push(T_('wait', 'Send setup', 'Reading\u2026', 'Reading the newsletter.')); return T; }
      var at = savedVal('sendAt');                                                                         // v2.35: subject and preview are judged under Words
      var dfix = function (key, h) { return { kind: 'delivery', key: key, k: K + ' \u00b7 ' + h }; };
      var when = at ? new Date(at) : null, h = when && !isNaN(when) ? Math.round((when - Date.now()) / 36e5) : null;
      T.push(h == null ? T_('bad', 'Goes out', 'Not set', 'Set the send date and time.', null, '', dfix('sendAt', 'Goes out'))
        : h < 0 ? T_('bad', 'Goes out', shortWhen(at), clock(at) + '. This time has passed. Set a time in the future.', null, '', dfix('sendAt', 'Goes out'))
        : T_('ok', 'Goes out', shortWhen(at), clock(at) + ', ' + (h < 48 ? 'in ' + plural(h, 'hour') : 'in ' + plural(Math.floor(h / 24), 'day') + ', ' + plural(h % 24, 'hour')) + '. It must be in the future.'));
      T.push(weatherTile());                                     // v2.12
      // v2.9: the links in the compiled email, after a compile
      var lk = state.links;
      if (lk && !lk.running && !lk.error && lk.links) {
        var cb2 = compiledBad(), conf2 = lk.links.filter(function (x) { return !x.ok && remembered(x.url); }).length;
        T.push(!cb2.length ? T_('ok', 'Links in the email', lk.checked + ' of ' + lk.checked, 'Every link in the compiled email answers.' + (conf2 ? ' ' + plural(conf2, 'link') + ' you opened yourself.' : ''))
          : T_('bad', 'Links in the email', (lk.checked - cb2.length) + ' of ' + lk.checked, 'No answer from ' + cb2.map(compiledWhy).join(' '), null, '',
               { kind: 'clink', urls: cb2.map(function (x) { return { url: x.url, text: x.text, status: x.status, error: x.error }; }), k: K + ' \u00b7 Links in the email' }));
      }
    }
    return T;
  }

  // v2.42: "12 banners \u00b7 1 sponsor \u00b7 splash", banners first
  function soldByKind(tiles) {
    var by = {}; tiles.forEach(function (t) { if (t.sale) by[t.sale.kind] = (by[t.sale.kind] || 0) + t.sale.n; });
    var out = []; if (by.banner) out.push(plural(by.banner, 'banner')); if (by.sponsor) out.push(plural(by.sponsor, 'sponsor')); if (by.splash) out.push('splash');
    return out.join(' \u00b7 ');
  }
  // v2.44: which tabs hold unsaved edits. Picker's pending() is counted as ipp-words counts it (v1.0.6).
  function pendingTabs() {
    var out = [], P = window.IPP && IPP.picker, L = window.IPP && IPP.layout, W = window.IppWords;
    try { if (P && P.pending) { var p = P.pending(), c = (p.adds || []).length + ['fills', 'clears', 'removes', 'links', 'holds', 'lists', 'themes'].reduce(function (n, k) { return n + Object.keys(p[k] || {}).length; }, 0); if (c) out.push({ name: 'Picker', n: c, go: 'picker' }); } } catch (e) {}
    try { if (L && L.pending) { var l = L.pending().length; if (l) out.push({ name: 'Layout', n: l, go: 'layout' }); } } catch (e) {}
    try { if (W && W.pending) { var w = W.pending().length; if (w) out.push({ name: 'Words', n: w, go: 'words' }); } } catch (e) {}
    return out;
  }
  // v2.41: the Review-and-release Advertisers box
  function splashName(b) { var l = b && b.splash && Array.isArray(b.splash.newsletters) ? b.splash.newsletters : []; if (!l.length) return 'none'; var c = l[0].current || {}; return l[0].source === 'paid' ? (c.name || 'paid') : 'house splash'; }
  function sponsorList(slots) { var seen = {}, out = []; (slots || []).forEach(function (s) { if (s.section && s.section.id && s.sponsor && s.sponsor.name && !seen[s.section.id]) { seen[s.section.id] = 1; out.push(s.section.name + ' \u00b7 ' + s.sponsor.name); } }); return out.join(', '); }
  function boardHolds() { var b = boardData(); return b && Array.isArray(b.holds) ? b.holds : []; }   // v2.54
  function snip(t) { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > 48 ? t.slice(0, 46) + '\u2026' : t; }   // v2.54
  function boardModel() {
    var b = boardData();
    if (!b) return { wait: true, groups: [], total: 0, compiles: 0 };
    var slots = b.slots || [], by = {}, held = {};
    boardHolds().forEach(function (h) { if (h && h.slotId) held[h.slotId] = 1; });   // v2.58: a held tile's one row is its hold row
    slots.forEach(function (s) { if (held[s.id]) return; var g = groupOf(s); if (g) (by[g] = by[g] || []).push(s); });
    var groups = groupOrder().filter(function (g) { return g === 'delivery' || g === 'revenue' || g === 'edits' || g === 'holds' || g === 'stop' || (by[g] && kindOf(g) !== 'ad'); }).map(function (g) {   // v2.45: ad groups report inside Revenue   // v2.17; v2.41 revenue; v2.44 edits (empty when nothing is pending; navHtml and bandsHtml skip empty groups)
      var ss = by[g] || [], tiles = tilesFor(g, ss);
      return { key: g, kind: kindOf(g), name: groupName(g), n: ss.length, tiles: tiles, sold: tiles.reduce(function (n, t) { return n + (t.sale ? t.sale.n : 0); }, 0), soldBy: soldByKind(tiles),   // v2.41; v2.42 sales, by kind
               bad: tiles.filter(function (t) { return t.s === 'bad' || t.s === 'warn'; }).length,   // v2.12: warn is red too
               hold: tiles.filter(function (t) { return t.s === 'hold'; }).length,   // v2.44: unsaved edits, gold
               wait: tiles.some(function (t) { return t.s === 'wait'; }) };
    });
    var inEmail = slots.filter(function (s) { return groupOf(s); });
    var configured = !!(b.compile && b.compile.configured);
    return { wait: false, groups: groups, total: inEmail.length, configured: configured,
             compiles: inEmail.filter(function (s) { return s.compile && s.compile.state === 'compiles'; }).length };
  }
  // ── v2.59 · WHAT'S LEFT ──────────────────────────────────────
  // Jeff (Compile redesign, 23 Oct 2026, every board of "What's left"
  // v0.1 accepted): Compile lists the jobs left before the issue can go,
  // one plain sentence each, a second line of detail, one button named
  // for the action. No system words. Rows run in the order a person
  // works: first, content, revenue, send; then our side. Weather that is
  // not in range yet is a grey note, not a job. The check tiles above
  // (tilesFor) stay for the Issues-tab count's history only; the jobs
  // decide the headline, the cells, the rail dots and the Compile button.
  var JW = {                                                               // HC-P-PUB59-1: the jobs' group names and fixed words
    groups: { first: 'First', articles: 'Articles', events: 'Events', re: 'Real Estate', find: 'The Find', words: 'Words', revenue: 'Revenue', send: 'Send', ours: 'Our side' },
    order: ['first', 'articles', 'events', 're', 'find', 'words', 'revenue', 'send', 'ours'],
    cells: ['articles', 'events', 're', 'find', 'words', 'revenue', 'send'],
    left: function (n) { return plural(n, 'job') + ' left before you can compile'; },
    nothing: 'Nothing left. Ready to compile.',
    sub: 'Work down the list. Each button takes you to the spot.',
    subNone: 'Every job is done.',
    clean: 'Nothing left to do on this issue.',
    support: 'If it happens again, tell INBXIFY support.',
    showAll: 'Show every job'
  };
  function J_(g, k, a, b, btn, act) { act = act || {}; return { g: g, k: k, a: a, b: b || '', btn: btn || '', go: act.go || '', slot: act.slot || '', fix: act.fix || null, run: act.run || '', free: !!act.free }; }
  function qt(x) { return '\u201c' + String(x || 'Untitled') + '\u201d'; }
  function qList(xs) { return andList(xs.map(qt)); }
  function slotOf(id) { var b = boardData(), out = null; ((b && b.slots) || []).forEach(function (s) { if (s.id === id) out = s; }); return out; }
  function tileLabel(s) { return s && s.asset && !s.asset.missing && s.asset.name ? qt(snip(s.asset.name)) : (typeName(s) || 'unnamed'); }
  function isDesignOut(s) { return leftOut(s) && /design/i.test(String(s.compile.why || '')); }
  function countsFor(s) {                                                  // the item counts a list block's designs are made for
    var b = boardData(), dc = (b && b.designChoices) || {}, l = dc[String(s.blockType || '').toUpperCase()] || dc[s.blockLabel] || dc[s.blockType] || [];   // v2.61: the Picker's key
    return l.map(function (d) { return d.itemCount; }).filter(function (n) { return Number.isInteger(n); }).sort(function (x, y) { return x - y; });
  }
  function findMax() { var v = Number((window.IX_CONFIG || {}).findMax); return v > 0 ? Math.floor(v) : 6; }   // v2.62, HC-P-PK58-1
  function countWords(ns) { return !ns.length ? '' : ns.length === 1 ? String(ns[0]) : ns[0] + ' to ' + ns[ns.length - 1]; }
  function wxNow() {
    var b = boardData(), ns = (b && b.publish && b.publish.newsletters) || [], nl = ids().nlId;
    var n = ns.filter(function (x) { return x.id === nl; })[0] || (ns.length === 1 ? ns[0] : null);
    return (n && n.weather) || null;
  }
  // A list block (events, listings, The Find): pick, tick Done, design for the count.
  function listJobs(J, g, ss, noun, pickBtn, isFind) {
    ss.forEach(function (s) {
      var K = typeName(s) || JW.groups[g], n = found(s).length, act = { go: 'picker', slot: s.id };
      var mx = countsFor(s).slice(-1)[0] || (isFind ? findMax() : 0);   // v2.62: The Find's limit as the Picker has it (HC-P-PK58-1)                                 // v2.60: the largest count a design is made for
      if (!n) J.push(J_(g, 'red', isFind ? K + ' has no ' + noun[1] + ' yet. Pick ' + (mx ? 'up to ' + mx : 'them') + ', or remove the tile.' : 'Pick the ' + noun[1] + ' for the ' + K + ' tile, then tick Done picking.', 'The tile is empty.', pickBtn, act));
      else if (s.listDone === false) J.push(J_(g, 'red', 'Tick Done picking on the ' + K + ' tile.', plural(n, noun[0], noun[1]) + ' picked. Tick it when the list is final.', pickBtn, act));
      if (n && s.designInfo && !s.designInfo.missing && Number.isInteger(s.designInfo.itemCount) && s.designInfo.itemCount !== n && !(s.fill && s.fill.design)) {
        var cs = countsFor(s);
        J.push(J_(g, 'red', 'The ' + K + ' design doesn\u2019t fit the ' + plural(n, noun[0], noun[1]) + ' picked.', (cs.length ? 'Designs are made for ' + countWords(cs) + '. ' : '') + 'Change the number, then Save on the Picker.', 'Open Picker', act));
      } else if (n && isDesignOut(s)) {
        var cs2 = countsFor(s);
        J.push(cs2.length ? J_(g, 'red', 'There is no ' + K + ' design for ' + plural(n, noun[0], noun[1]) + '.', 'Designs are made for ' + countWords(cs2) + '. Change the number on the Picker.', 'Open Picker', act)
                         : J_(g, 'red', 'There is no ' + K + ' design for ' + plural(n, noun[0], noun[1]) + '.', 'No design is made for this number yet. Choose one on Layout.', 'Choose designs', { go: 'layout' }));   // v2.62: no talk-to-the-hand
      }
      if (isFind && s.theme !== undefined && !String(s.theme || '').trim())
        J.push(J_(g, 'red', 'Pick this week\u2019s theme for ' + K + '.', 'Type it in the theme box on the tile. It\u2019s the heading readers see over the section.', 'Add theme', act));
    });
  }
  function photoJobs(J, g, list, kind, noun, label) {
    if (!list.length) return;
    var fix = { kind: 'photo', k: JW.groups[g] + ' \u00b7 ' + label, items: list.map(function (x) { return { id: x.id, name: x.name, kind: kind, label: qt(x.name) + ' \u00b7 ' + label.toLowerCase() }; }) };
    J.push(list.length === 1 ? J_(g, 'red', qt(list[0].name) + ' has no ' + label.toLowerCase() + '.', 'Add one here, or swap the ' + noun + '.', 'Add photo', { fix: fix })
      : J_(g, 'red', plural(list.length, noun) + ' have no ' + label.toLowerCase() + '.', qList(list.map(function (x) { return x.name; })) + '. Add them here, or swap them.', 'Add photos', { fix: fix }));
  }
  function linkJobs(J, g, grp) {
    var rl = state.rl; if (!rl || rl.running || rl.error) return;
    var bad = (rl.links || []).filter(function (x) { return x.group === grp && x.cls !== 'none' && !linkOk(x); });
    if (!bad.length) return;
    J.push(J_(g, 'red', bad.length === 1 ? 'A link in ' + qt(bad[0].name) + ' doesn\u2019t open.' : plural(bad.length, 'link') + ' don\u2019t open.', bad.map(linkWhy).join(' ') + ' Open it yourself. If it works, say so.', bad.length === 1 ? 'Check link' : 'Check links', { fix: { kind: 'link', group: grp, k: JW.groups[g] + ' \u00b7 links' } }));
  }
  function oursOut(J, ss) {                                                // anything still left out that no job above names
    ss.forEach(function (s) {
      if (!leftOut(s) || isDesignOut(s)) return;
      var w = String(s.compile.why || '');
      if (/^No (events|ads|listings) are selected|^No article is selected/.test(w)) return;
      if (/no block type/i.test(w) && s.assetType === 'article' && s.asset && !s.asset.missing) return;   // v2.60: a job above names it, with Set section
      J.push(J_('ours', 'ours', 'We couldn\u2019t place ' + tileName(s) + ' in the email.', w + ' ' + JW.support, 'Check again', { run: 'recheck' }));
    });
  }
  function jobsModel() {
    var b = boardData(), J = [], grey = [];
    if (!b) return { wait: true, jobs: J, grey: grey };
    var held = {}; boardHolds().forEach(function (h) { if (h && h.slotId) held[h.slotId] = 1; });
    var by = { article: [], ad: [], event: [], re: [], 'text-ad': [], greeting: [], other: [] }, inPlan = {};
    (b.slots || []).forEach(function (s) { var gk = groupOf(s); if (!gk) return; var k = kindOf(gk); inPlan[k] = 1; if (held[s.id]) return; (by[k] || by.other).push(s); });
    // First: unsaved changes, one per tab
    pendingTabs().forEach(function (e) { J.push(J_('first', 'gold', 'You have ' + plural(e.n, 'change') + ' on ' + e.name + ' that ' + (e.n === 1 ? 'isn\u2019t' : 'aren\u2019t') + ' saved. Save ' + (e.n === 1 ? 'it' : 'them') + ' or cancel ' + (e.n === 1 ? 'it' : 'them') + '.', 'Compile builds from the saved plan, so it waits for this.', 'Save or cancel', { go: e.go })); });
    var rd = window.IPPRevenue && typeof IPPRevenue.readiness === 'function' ? IPPRevenue.readiness() : null;
    var rg = window.IPPRevenue && typeof IPPRevenue.gate === 'function' ? IPPRevenue.gate() : null;
    var revUnsaved = (rd && (rd.splash === 'unsaved' || rd.sponsors === 'unsaved')) || (rg && rg.loaded && rg.unsaved);
    if (revUnsaved && !pendingTabs().some(function (e) { return e.go === 'revenue'; })) J.push(J_('first', 'gold', 'You have changes on Revenue that aren\u2019t saved. Save them or cancel them.', 'Compile builds from the saved plan, so it waits for this.', 'Save or cancel', { go: 'revenue' }));
    var chg = changedKeys().length;
    if (chg) J.push(J_('first', 'gold', 'You have ' + plural(chg, 'change') + ' on Send Setup that ' + (chg === 1 ? 'isn\u2019t' : 'aren\u2019t') + ' saved. Save or cancel.', 'Compile builds from the saved plan, so it waits for this.', 'Save or cancel', { go: 'setup' }));
    // Holds: reserved tiles and notes
    boardHolds().forEach(function (h) {
      var s = slotOf(h.slotId), g = h.tab === 'revenue' ? 'revenue' : 'articles', act = { go: h.tab === 'revenue' ? 'revenue' : 'picker', slot: h.slotId };
      if (h.kind === 'note') J.push(J_(g, 'red', 'Read the note on ' + tileName(s) + '.', qt(snip(h.text)) + ' Do what it says, then clear the note.', 'Open note', act));
      else { var pg = s && s.allocation && s.allocation.page; J.push(J_(g, 'red', 'Add the article for \u201c' + String(h.printTitle || 'Untitled') + '.\u201d', (pg != null ? 'Page ' + pg + ' of the print issue holds this spot.' : 'A print item holds this spot.') + ' Match an article or create one.', 'Add article', act)); }
    });
    // Articles
    var ar = by.article;
    if (ar.length || inPlan.article) {
      var filled = ar.filter(function (s) { return s.asset && !s.asset.missing; });
      var faL = function (s) { return String(s.blockType || s.blockLabel || '').toUpperCase() === 'FA' || !!(s.fill && s.fill.type && String(s.fill.type.to).toUpperCase() === 'FA'); };
      var fa = ar.filter(faL).sort(function (x, y) { return x.position - y.position; })[0];
      if (!fa && !boardHolds().length) J.push(J_('articles', 'red', 'This issue has no Feature Article. Add one.', 'The Feature Article leads the email and makes its share picture.', 'Add article', { go: 'picker' }));
      ar.filter(function (s) { return !(s.asset && !s.asset.missing); }).forEach(function (s) {
        J.push(J_('articles', 'red', 'The ' + (typeName(s) || 'article') + ' tile is empty. Pick an article for it.', 'Or remove the tile if this issue doesn\u2019t need it.', 'Pick article', { go: 'picker', slot: s.id }));
      });
      var dz = (b.slots || []).filter(function (s) { var k = kindOf(groupOf(s) || ''); return (k === 'article' || k === 'ad' || k === 'other') && isDesignOut(s) && !held[s.id]; });
      if (dz.length) J.push(J_('articles', 'red', dz.length === 1 ? 'Choose a design for the ' + tileLabel(dz[0]) + ' tile.' : 'Choose a design for ' + plural(dz.length, 'tile') + '.', dz.length === 1 ? 'It has more than one design to choose from.' : andList(dz.map(tileLabel)) + '.', 'Choose designs', { go: 'layout' }));
      ar.forEach(function (s) {                                             // v2.60: a filled tile with no type is fixed through its article's section
        if (!s.asset || s.asset.missing || (s.fill && s.fill.type) || String(s.blockType || s.blockLabel || '')) return;
        var nm = qt(s.asset.name), act = { go: 'picker', slot: s.id };
        if (s.asset.sectionName) J.push(J_('articles', 'red', nm + ' is in the ' + s.asset.sectionName + ' section, which has no tile type.', 'Open the article on the Picker and choose a different section. The tile takes its type from it.', 'Set section', act));
        else J.push(J_('articles', 'red', nm + ' has no section, so its tile has no type.', 'Open the article on the Picker and choose its section. The tile takes its type from it.', 'Set section', act));
      });
      ar.forEach(function (s) {
        var tc = s.typeCheck; if (!tc || !s.asset || s.asset.missing || (s.fill && s.fill.type) || !String(s.blockType || s.blockLabel || '')) return;
        if (tc.ok === false) J.push(J_('articles', 'red', qt(s.asset.name) + ' is filed under ' + (s.asset.sectionName || tc.article) + ', but it sits in a ' + (typeName(s) || tc.block) + ' tile.', 'Move it to a matching tile, or change its section.', 'Fix the tile', { go: 'layout' }));
        else if (tc.reason === 'untyped-article') J.push(J_('articles', 'red', qt(s.asset.name) + ' has no section.', 'Set its section on the Article form. The section decides how it shows.', 'Open Picker', { go: 'picker', slot: s.id }));
      });
      photoJobs(J, 'articles', filled.filter(function (s) { return !s.asset.thumb; }).map(function (s) { return { id: s.asset.id, name: s.asset.name || '' }; }), 'article', 'article', 'Main picture');
      if (fa && fa.asset && !fa.asset.missing && fa.asset.thumb && !fa.asset.ogSrc)
        J.push(J_('articles', 'red', 'The Feature article needs a square main picture.', 'It becomes the share picture and the archive page picture.', 'Add picture', { fix: { kind: 'photo', k: 'Articles \u00b7 share picture', items: [{ id: fa.asset.id, name: fa.asset.name || '', kind: 'article', label: qt(fa.asset.name) + ' \u00b7 main picture' }] } }));
      sponsoredInGroups(b).forEach(function (s) {
        J.push(J_('articles', 'red', qt(s.asset.name) + ' is in Around Town, but ' + ((s.section && s.section.name) || 'its section') + ' is sponsored this issue.', 'Move it to its own tile so it shows under the sponsor, ' + s.sponsor.name + '.', 'Move story', { go: 'layout' }));
      });
      linkJobs(J, 'articles', 'article');
      oursOut(J, ar);
    }
    // Events, Real Estate, The Find
    var sd = sendDay();
    if (by.event.length) {
      listJobs(J, 'events', by.event, ['event', 'events'], 'Pick events', false);
      var evAll = []; by.event.forEach(function (s) { evAll = evAll.concat(found(s).map(function (x) { return Object.assign({ _slot: s }, x); })); });
      if (sd) evAll.filter(function (e) { var d = dayOf(e.start); return d && d < sd; }).forEach(function (e) {
        J.push(J_('events', 'red', qt(e.name) + ' happens before this issue goes out.', 'It is on ' + shortDay(dayOf(e.start)) + '. Remove it from the ' + (typeName(e._slot) || 'Events') + ' tile.', 'Remove event', { go: 'picker', slot: e._slot.id }));
      });
      photoJobs(J, 'events', evAll.filter(function (x) { return !x.photo; }), 'event', 'event', 'Photo');
      linkJobs(J, 'events', 'event'); oursOut(J, by.event);
    }
    if (by.re.length) {
      listJobs(J, 're', by.re, ['listing', 'listings'], 'Pick listings', false);
      var li = []; by.re.forEach(function (s) { li = li.concat(found(s)); });
      photoJobs(J, 're', li.filter(function (x) { return !x.photo; }), 're', 'listing', 'Photo');
      linkJobs(J, 're', 're'); oursOut(J, by.re);
    }
    if (by['text-ad'].length) { listJobs(J, 'find', by['text-ad'], ['business', 'businesses'], 'Pick businesses', true); linkJobs(J, 'find', 'text-ad'); oursOut(J, by['text-ad']); }
    // Words
    var gr = by.greeting[0];
    if (gr) {
      var gg = gr.greeting || {};
      var wv = { subject: savedVal('subject'), preview: savedVal('preview'), closing: savedVal('closing'), title: String(gg.title || '').trim(), supershort: String(gg.supershort || '').trim(), paragraph: String(gg.paragraph || '').trim() };
      var wm = WD_KEYS.filter(function (k) { return !wv[k]; }), rgw = wordRanges(), basis = gg.basis || null;
      if (wm.length) J.push(J_('words', 'red', 'Write the greeting, then tick \u201cThe newsletter is done.\u201d', 'Still to write: ' + andList(wm.map(function (k) { return WD_LABEL[k].toLowerCase(); })) + '.', 'Write greeting', { go: 'words' }));
      else if (gr.greetingDone === false) J.push(J_('words', 'red', 'Tick \u201cThe newsletter is done\u201d on the Words tab.', 'The words are written.', 'Open Words', { go: 'words' }));
      if (!rgw) J.push(J_('ours', 'ours', 'We couldn\u2019t read the word limits for this issue.', 'Click Check again. ' + JW.support, 'Check again', { run: 'recheck' }));
      else if (!wm.length) WD_KEYS.forEach(function (k) {
        var n = wv[k].length, r = rgw[k]; if (!r || !n || (n >= r[0] && n <= r[1])) return;
        J.push(J_('words', 'red', 'The ' + WD_LABEL[k].toLowerCase() + ' is ' + n + ' characters. Make it ' + (r[0] > 1 ? r[0] + ' to ' + r[1] : 'under ' + (r[1] + 1)) + '.', qt(snip(wv[k])), 'Edit words', { go: 'words' }));
      });
      if (!wm.length && basis && basis.stale) J.push(J_('words', 'red', 'The articles changed after the words were written.', 'Read the words again. Keep them or rewrite them.', 'Review words', { go: 'words' }));
      oursOut(J, by.greeting);
    }
    // Revenue
    var rb = b.splash || null, rl = rb && Array.isArray(rb.newsletters) ? rb.newsletters : [];
    if (!rg) J.push(J_('ours', 'ours', 'We couldn\u2019t read the banners for this issue.', 'Reload the page. ' + JW.support, 'Check again', { run: 'recheck' }));
    else if (rg.loaded && rg.empty.length) J.push(J_('revenue', 'red', plural(rg.empty.length, 'banner spot is', 'banner spots are') + ' unsold. Sell ' + (rg.empty.length === 1 ? 'it or remove it.' : 'them or remove them.'), cap(rg.empty.join(', ')) + '.', 'Fill or remove', { go: 'revenue' }));
    if (rd && rd.splash === 'needs' && rl.length === 1) J.push(J_('revenue', 'red', 'The splash page isn\u2019t ready.', 'A save failed or it couldn\u2019t be read. Open Revenue to see why.', 'Open Revenue', { go: 'revenue' }));
    else if (rb && rl.length !== 1) J.push(J_('ours', 'ours', rl.length ? 'This issue has ' + rl.length + ' newsletter records; it should have one.' : 'This issue has no newsletter record.', 'So its splash page can\u2019t be checked. ' + JW.support, 'Check again', { run: 'recheck' }));
    else if (rl.length === 1 && rl[0].source === 'paid') {
      var sc = rl[0].current || {}, miss = []; if (!sc.image) miss.push('no picture'); if (Object.prototype.hasOwnProperty.call(sc, 'go') && !sc.go) miss.push('no link');
      if (miss.length) J.push(J_('revenue', 'red', 'The splash ad for ' + (sc.name || 'this customer') + ' has ' + andList(miss) + '.', 'Pick its ad again on Revenue.', 'Fix splash', { go: 'revenue' }));
    }
    var bySec = {};
    (b.slots || []).forEach(function (s) { if (s.section && s.section.id) { var k = s.section.id, sid = (s.sponsor && s.sponsor.id) || ''; (bySec[k] = bySec[k] || { name: s.section.name, ids: {} }).ids[sid] = sid ? (s.sponsor.name || sid) : ''; } });
    Object.keys(bySec).forEach(function (k) {
      var all = Object.keys(bySec[k].ids), named = all.filter(Boolean);
      if (!named.length || all.length < 2 || (rd && rd.sponsors === 'unsaved')) return;
      J.push(J_('revenue', 'red', bySec[k].name + ' has ' + (named.length > 1 ? plural(named.length, 'sponsor') + ' set' : 'a sponsor on some tiles and not others') + '. Pick one.', andList(named.map(function (i) { return bySec[k].ids[i]; })) + (all.length > named.length ? ', and tiles with none' : '') + '.', 'Pick sponsor', { go: 'revenue' }));
    });
    linkJobs(J, 'revenue', 'ad'); oursOut(J, by.ad);
    // Send
    var sg = setupGate(true), t = titleInfo();
    if (!sg.wait) {
      if (!sg.ok && /Webflow/.test(sg.html)) J.push(J_('ours', 'ours', 'The send settings aren\u2019t set up for this title.', String(sg.html).replace(/<[^>]+>/g, '') + ' ' + JW.support, 'Check again', { run: 'recheck' }));
      else {
        if (!t.zips) J.push(J_('ours', 'ours', 'This title has no send zip codes.', 'They go to the vendor with every issue. ' + JW.support, 'Check again', { run: 'recheck' }));
        var em = SETUP_KEYS.filter(function (k) { return k !== 'sendAt' && !SETUP_OPTIONAL[k] && !savedVal(k) && !(k === 'subject' || k === 'preview') ; });
        if (em.length) J.push(J_('send', 'red', 'Fill in ' + andList(em.map(function (k) { return LABEL[k].toLowerCase(); })) + ' on Send Setup.', 'The vendor needs ' + (em.length === 1 ? 'it' : 'them') + ' to send the issue.', 'Open Send Setup', { go: 'setup' }));
        var at = savedVal('sendAt'), when = at ? new Date(at) : null;
        if (!when || isNaN(when)) J.push(J_('send', 'red', 'Set the send date and time.', '', 'Set send time', { fix: { kind: 'delivery', key: 'sendAt', k: 'Send \u00b7 send time' } }));
        else if (when < Date.now()) J.push(J_('send', 'red', 'The send time has passed. Set a new one.', 'It was ' + shortWhen(at) + ' at ' + clock(at) + '.', 'Set send time', { fix: { kind: 'delivery', key: 'sendAt', k: 'Send \u00b7 send time' } }));
      }
    }
    var lk = state.links;
    if (lk && !lk.running && !lk.error && lk.links) {
      var cb2 = compiledBad();
      if (cb2.length) J.push(J_('send', 'red', cb2.length === 1 ? 'A link in the email doesn\u2019t open.' : plural(cb2.length, 'link') + ' in the email don\u2019t open.', cb2.map(compiledWhy).join(' ') + ' Open it yourself. If it works, say so.', cb2.length === 1 ? 'Check link' : 'Check links', { fix: { kind: 'clink', urls: cb2.map(function (x) { return { url: x.url, text: x.text, status: x.status, error: x.error }; }), k: 'Send \u00b7 links in the email' } }));
    }
    // Weather (ruled 23 Oct): a grey note before its window; after a compile without it, a job to compile again.
    var w = wxNow(), cs = compileStamp();
    if (w) {
      if (w.state === 'too-far') grey.push('The weather can be added from ' + wxDay(w.availableOn) + '. Compile before then and the email goes without it.');
      else if (w.state === 'ready' && cs && !cs.legacy && cs.wx && cs.wx !== 'ready' && cs.wx !== 'off' && !released())
        J.push(J_('send', 'red', 'The weather is ready now. Compile again to add it.', 'The email you compiled has no weather.', 'Compile again', { run: 'compile', free: true }));
      else if (w.state === 'no-place') J.push(J_('ours', 'ours', 'This title has no weather location.', 'Remove the weather tile on Layout. If you want the weather, tell INBXIFY support.', 'Open Layout', { go: 'layout' }));
      else if (w.state === 'failed' || w.state === 'unknown') grey.push('The forecast couldn\u2019t be checked just now. Compile will try again.');
    }
    // Our side: the pre-check's refusal no job explains
    var o = state.lastCheck && state.lastCheck.body, ws = o && o.ok === true && o.wouldStop ? o.wouldStop : null;
    if (ws && !boardHolds().length) J.push(J_('ours', 'ours', 'We couldn\u2019t finish checking this issue. Click Check again.', String(ws.message || '') + ' ' + JW.support, 'Check again', { run: 'recheck' }));
    if (!(b.compile && b.compile.configured)) J.push(J_('ours', 'ours', 'We couldn\u2019t finish checking this issue. Click Check again.', JW.support, 'Check again', { run: 'recheck' }));
    if (!catalog().length) J.push(J_('ours', 'ours', 'We couldn\u2019t read the kinds of tile this title uses.', 'Click Check again. ' + JW.support, 'Check again', { run: 'recheck' }));
    var rank = {}; JW.order.forEach(function (g, i) { rank[g] = i; });
    J = J.map(function (j, i) { j._i = i; return j; }).sort(function (x, y) { return (rank[x.g] - rank[y.g]) || (x._i - y._i); });
    var cells = {}; JW.cells.forEach(function (g) { cells[g] = { n: 0, show: false }; });
    cells.articles.show = !!(by.article.length || inPlan.article); cells.events.show = !!inPlan.event; cells.re.show = !!inPlan.re; cells.find.show = !!inPlan['text-ad'];
    cells.words.show = !!inPlan.greeting; cells.revenue.show = true; cells.send.show = true;
    J.forEach(function (j) { if (cells[j.g]) { cells[j.g].n++; cells[j.g].show = true; } });
    var names = {}; JW.cells.forEach(function (g) { names[g] = JW.groups[g]; });
    [['event', 'events'], ['re', 're'], ['text-ad', 'find']].forEach(function (p) { var s = by[p[0]][0]; if (s && typeName(s)) names[p[1]] = typeName(s); });
    return { wait: false, jobs: J, grey: grey, cells: cells, names: names };
  }
  function jobBtn(j) {
    if (!j.btn) return '<span class="ipp-wl-btn is-none"></span>';
    if (j.fix) return '<button type="button" class="ipp-wl-btn" data-cor="' + (FIXES.push(j.fix) - 1) + '">' + esc(j.btn) + '</button>';
    if (j.run === 'compile') return '<button type="button" class="ipp-wl-btn" data-publish-go' + (state.running || state.stopped ? ' disabled' : '') + '>' + esc(j.btn) + '</button>';
    if (j.run === 'recheck') return '<button type="button" class="ipp-wl-btn" data-publish-recheck>' + esc(j.btn) + '</button>';
    if (j.go) return '<button type="button" class="ipp-wl-btn" data-pub-go="' + esc(j.go) + '"' + (j.slot ? ' data-pub-slot="' + esc(j.slot) + '"' : '') + '>' + esc(j.btn) + '</button>';
    return '<span class="ipp-wl-btn is-none"></span>';
  }
  function jobHtml(j, names) {
    return '<div class="ipp-wl-row is-' + j.k + '"><span class="ipp-wl-g">' + esc((names && names[j.g]) || JW.groups[j.g]) + '</span><div class="ipp-wl-t"><b>' + esc(j.a) + '</b>' +
      (j.b ? '<span title="' + esc(j.b) + '">' + esc(j.b) + '</span>' : '') + '</div>' + jobBtn(j) + '</div>';
  }
  function greyHtml(grey) { return grey.map(function (g) { return '<p class="ipp-wl-grey">' + esc(g) + '</p>'; }).join(''); }
  function compileBlockers() {
    var jm = jobsModel(), wait = jm.wait || !state.lastCheck || state.checking;
    var bad = jm.jobs.filter(function (j) { return (j.k === 'red' || j.k === 'ours') && !j.free; }).length;
    var hold = jm.jobs.filter(function (j) { return j.k === 'gold'; }).length;
    var first = jm.jobs[0] ? jm.jobs[0].a : null;
    return { bad: bad, hold: hold, wait: wait, first: first, jobs: jm, n: jm.jobs.length, model: boardModel() };
  }

  // host + Uploadcare id, every operation dropped (same as 206 module 25321)
  function ucBase(u) { var p = String(u || '').split('/'); return p.length > 3 && p[2] && p[3] ? 'https://' + p[2] + '/' + p[3] + '/' : ''; }
  var CX = { open: '', review: false };                                     // v2.47: the section whose checks are open under the header; the Confirmation in place of the board
  function rowHtml2(t, g, withSec) {                                      // v2.47: one check as a list row (the canvas's tile)
    var red = t.s === 'bad' || t.s === 'warn', hold = t.s === 'hold';
    var cls = 'ipp-cx-row2 ipp-cx-g--' + g.kind + (red ? ' is-bad' : hold ? ' is-hold' : t.s === 'wait' ? ' is-wait' : t.s === 'sold' ? ' is-sold' : ' is-ok');
    var btn = red && t.fix ? '<button type="button" class="ipp-cx-fix is-cor" data-cor="' + (FIXES.push(t.fix) - 1) + '">Correct</button>'
      : t.go && (red || hold) ? '<button type="button" class="ipp-cx-fix" data-pub-go="' + t.go + '"' + (t.slot ? ' data-pub-slot="' + esc(t.slot) + '"' : '') + '>' + (t.slot ? HOLD_FILL : GO[t.go]) + '</button>' : '<span class="ipp-cx-fix is-none"></span>';   // slot v2.54
    var sub = [t.v, t.c].filter(Boolean).join(' \u00b7 ');
    return '<div class="' + cls + '"><i aria-hidden="true"></i><div class="ipp-cx-r2t"><b>' + (withSec ? '<span class="ipp-cx-sec">' + esc(g.name) + '</span>' : '') + esc(t.h) + '</b><span title="' + esc(sub) + '">' + esc(sub) + '</span></div>' +
      (t.thumb && ucBase(t.thumb) ? '<img class="ipp-cx-thumb2" alt="" src="' + esc(ucBase(t.thumb)) + '-/scale_crop/96x50/smart_faces/">' : '<span class="ipp-cx-thumb2 is-none"></span>') + btn + '</div>';
  }
  function deliveryFacts() {                                              // v2.47: the send facts and the tracking codes live in Delivery's detail (S7 §4)
    var t = titleInfo(), i = ids(), row = function (k, v) { return '<div class="ipp-cx-kv"><span>' + k + '</span><b>' + v + '</b></div>'; };
    var vol = commas(savedVal('volume'));
    var lk = state.links, codes = lk && lk.links && lk.links.length ? utmPanel() : '<span class="ipp-cx-kv-dim">' + (lk && lk.running ? 'checking links\u2026' : 'after the link check') + '</span>';
    return '<div class="ipp-cx-facts">' + row('Subject line', esc(savedVal('subject') || '\u2014')) + row('Preview text', esc(savedVal('preview') || '\u2014')) +
      row('Audience', esc([vol ? vol + ' sends' : '', t.zips || '', sectorsShown(savedVal('sectors'))].filter(Boolean).join(' \u00b7 ') || '\u2014')) + row('Tracking codes', codes) + row('Newsletter ID', '<span class="mono">' + esc(i.nlId) + '</span>') + '</div>';
  }
  function boardHtml(cb) {                                                // v2.59: the jobs left, one list
    var jm = cb.jobs, hs = headerState();
    FIXES = [];
    if (jm.wait) return '<p class="ipp-cx-wait">Reading the plan\u2026</p>';
    var list = CX.open ? jm.jobs.filter(function (j) { return j.g === CX.open; }) : jm.jobs;
    if (CX.open && !(jm.cells[CX.open] && jm.cells[CX.open].show)) { CX.open = ''; list = jm.jobs; }
    var head = CX.open ? '<div class="ipp-wl-filter"><b>' + esc(jm.names[CX.open] || JW.groups[CX.open]) + '</b> \u00b7 ' + (list.length ? plural(list.length, 'job') + ' left' : 'nothing left here') + ' \u00b7 <button type="button" class="ipp-cx-again" data-cx-nav="' + esc(CX.open) + '">' + JW.showAll + '</button></div>' : '';
    if (list.length) return head + '<div class="ipp-wl-list">' + list.map(function (j) { return jobHtml(j, jm.names); }).join('') + '</div>' + greyHtml(jm.grey);
    var msg = CX.open ? '' : hs === 'stale' ? (wordsOnlyStale() ? HX.cleanStaleWords : HX.cleanStale) : hs === 'released' ? HX.cleanReleased : JW.clean;
    return head + (msg ? '<div class="ipp-cx-clean"><div><b>' + esc(msg) + '</b></div></div>' : '') + greyHtml(jm.grey);
  }

  // v2.18 — record the pre-check count on the newsletter for the Issues tab.
  var CHK = { busy: false, wroteAt: 0, last: null };
  function recordCheck(cb) {
    if (!cb || cb.wait || CHK.busy) return;
    var p = pubBoard(); if (!p || p.types.stepState === null || !pubRow()) return;
    var n = Number(cb.bad) || 0;
    var cur = stepState(); if (cur._bad) return;   // never overwrite a bad field silently; the Vendor pane names it
    var rec = cur.check && typeof cur.check === 'object' ? Number(cur.check.fixes) : NaN;
    if (rec === n || CHK.last === n) return;
    if (Date.now() - CHK.wroteAt < 15000) return;
    CHK.busy = true;
    var next = Object.assign({}, cur, { v: 1, check: { fixes: n, at: new Date().toISOString() } });
    var fd = {}; fd[p.fields.stepState] = JSON.stringify(next);
    patchNewsletter(fd).then(function () {
      CHK.last = n; CHK.wroteAt = Date.now();
      var row = pubRow(); if (row && row.values) row.values.stepState = fd[p.fields.stepState];
    }).catch(function (e) {
      CHK.wroteAt = Date.now();
      console.warn('[Publish] pre-check count not recorded on the newsletter: ' + ((e && e.message) || e));
    }).then(function () { CHK.busy = false; });
  }

  // v2.38 — the rail dots, one painter. A tile's go names the tab that
  // fixes it; the tab is red when any red tile points at it.
  var DOT_VIEW = { picker: 'picker', revenue: 'revenue', layout: 'layout', words: 'words', setup: 'publish' };   // HC-P-PUB38-1: go word → shell view
  function railDots(cb) {
    if (!(window.IPP && IPP.dot)) return;
    cb = cb || compileBlockers();
    var red = {}, gold = {};
    if (!cb.wait) cb.jobs.jobs.forEach(function (j) { if (!(j.go && DOT_VIEW[j.go]) || j.free) return; if (j.k === 'red' || j.k === 'ours') red[DOT_VIEW[j.go]] = true; else if (j.k === 'gold') gold[DOT_VIEW[j.go]] = true; });   // v2.44: gold for unsaved; v2.59: from the jobs
    Object.keys(DOT_VIEW).forEach(function (k) { var v = DOT_VIEW[k]; if (v === 'publish') return; IPP.dot(v, cb.wait ? '' : red[v] ? 'bad' : gold[v] ? 'hold' : 'ok'); });
    IPP.dot('publish', setupGate().ok && !red.publish ? (gold.publish ? 'hold' : 'ok') : 'bad');
    IPP.dot('compile', cb.wait ? '' : cb.bad ? 'bad' : cb.hold ? 'hold' : 'ok');
    IPP.dot('distribution', released() ? 'ok' : '');                      // v2.46: from the release stamp (S6 ruling 7)
  }

  function drawBoard() {
    var box = document.querySelector('[data-publish-board]'); if (!box) return;
    var cb = compileBlockers();
    recordCheck(cb);   // v2.18
    box.innerHTML = boardHtml(cb);
    railDots(cb);   // v2.38: every rail dot, from the tiles' owners
    var checks = 0, pass = 0;                                                // v2.59: the header counts jobs, not checks
    drawHeader(cb, checks, pass);                                            // v2.46: the three rows; the button's state is drawn, not toggled
    drawReview();                                                            // v2.47: the Confirmation in place of the board, or the board
  }
  function utmPanel() {
    var lc = state.links; if (!lc || !lc.links || !lc.links.length) return '';
    var common = (lc.common && lc.common.utm) || {};
    var ck = Object.keys(common);
    var rows = lc.links.map(function (x) {
      var own = Object.keys(x.utm || {}).filter(function (k) { return !(k in common); });
      return '<tr' + (x.ok ? '' : ' class="is-bad"') + '><td>' + esc(x.text || '\u2014') + '</td><td class="u">' + esc(x.url.replace(/^https?:\/\//, '').split('?')[0].slice(0, 46)) + '</td><td>' +
        own.map(function (k) { return '<code>' + esc(k.replace('utm_', '')) + '=' + esc(x.utm[k]) + '</code>'; }).join(' ') + '</td><td class="st">' + esc(x.status || x.error || '') + '</td></tr>';
    }).join('');
    return '<details class="ipp-pub-utm"><summary>Show the tracking codes and all ' + lc.checked + ' links' + (lc.source === 'web' ? ' (from the web page; the email copy was not saved)' : '') + '</summary>' +
      (ck.length ? '<div class="ipp-pub-utm-common"><span>On every link</span>' + ck.map(function (k) { return '<code>' + esc(k) + '=' + esc(common[k]) + '</code>'; }).join('') + '</div>' : '') +
      '<div class="ipp-pub-utm-wrap"><table><thead><tr><th>Link</th><th>Goes to</th><th>Its own codes</th><th>Answer</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>';
  }
  function runLinkCheck(fresh) {
    var u = linkCheckUrl(), nl = ids().nlId;
    if (!u || !nl) { state.links = { error: 'the link-check address is not known (PP_WEBHOOKS.planBoard or linkCheck)' }; drawBoard(); return; }
    state.links = { running: true }; drawBoard();
    fetch(u + (u.indexOf('?') < 0 ? '?' : '&') + 'n=' + encodeURIComponent(nl) + (fresh ? '&fresh=1' : ''), { method: 'GET', credentials: 'omit' })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'HTTP ' + r.status }; }); })
      .then(function (j) { state.links = j && j.ok ? j : { error: (j && j.error) || 'no answer' }; refreshAll(); writeLinksOnStamp(); })      // v2.24: the panes and the bar follow; v2.46: links onto the stamp
      .catch(function (e) { state.links = { error: (e && e.message) || 'request failed' }; refreshAll(); });
  }
  function refreshAll() { announceSend(); drawTabs(); syncCompile(); drawBoard(); if (canvas('compile') && canvas('compile').getAttribute(MOUNTED) === '1') showPane('compile'); }   // v2.22: Confirmation unlocks in place
  // v2.23 — the Compile page follows the Send Setup gate as data arrives
  var SYNCING = false;
  function syncCompile() {
    if (SYNCING) return;
    var c = canvas('compile'); if (!c || c.getAttribute(MOUNTED) !== '1') return;
    if (blockers().length) return;                                           // the blocked card has its own redraws
    var showsBoard = !!c.querySelector('[data-publish-board]'), open = stepOpen('compile');
    if (showsBoard === open) return;
    SYNCING = true;
    try { redraw('compile'); if (open) { runCheck(); runLinks(false); } } finally { SYNCING = false; }
  }

  // ════════════════════════════════════════════════════════════
  // v2.8 · CORRECT WINDOWS, LINKS FROM THEIR RECORDS, MEDIA
  // From compile-correct-mockup v0.2 (all 10 changes accepted).
  // A Correct opens a window over the board; the tiles never move.
  // Every changed value carries the gold border until Save; each block
  // has its own small Cancel, and the footer Cancel puts everything
  // back. While changes are waiting, clicking outside or Esc does
  // nothing: only Save or Cancel closes the window.
  // Save writes, reads the records back (TOAST-TRUTH), and the tile
  // checks itself again from the fresh read.
  // ════════════════════════════════════════════════════════════
  var G_TYPES = { article: 'article', re: 'realestate', event: 'event', ad: 'ad' };   // HC-P-S10-5: Scenario G v6 updateAsset types
  var UC_T = { main: '-/resize/1600x/-/format/jpeg/-/quality/better/',            // HC-P-S10-6: ASF CFG.transforms,
               og:   '-/scale_crop/2400x1260/smart_faces/-/format/jpeg/-/quality/better/' };   // one copy each for now
  var GR_KEYS = ['title', 'paragraph', 'supershort'];
  var GR_LABEL = { title: 'Title', paragraph: 'Paragraph (web page)', supershort: 'Short greeting (email)' };
  var GR_REQ = ['title', 'paragraph', 'supershort'];            // v2.21: all three required (S2 ruling 1); v2.19 had the title optional
  // v2.35: the six parts of the Words tab, in the order the reader meets them (ipp-words v1.0.0 HC-P-WD1-1)
  var WD_KEYS = ['subject', 'preview', 'title', 'supershort', 'paragraph', 'closing'];
  var WD_LABEL = { subject: 'Subject line', preview: 'Preview text', title: 'Title', supershort: 'Short greeting', paragraph: 'Paragraph', closing: 'Closing' };
  function wordsChanges(changes) {                                                                         // the Worker's basis diff, in a sentence
    var w = (changes || []).slice(0, 4).map(function (c) {
      var what = c.what === 'find' ? 'The Find' : c.what === 'event' ? 'the event' : '';
      if (c.kind === 'moved') return c.name + ' moved from ' + c.from + ' to ' + c.to;
      if (c.kind === 'added') return (what ? what + ' ' : '') + c.name + ' added';
      if (c.kind === 'removed') return (what ? what + ' ' : '') + c.name + ' removed';
      return c.name + (what ? ' (' + what + ')' : '') + ' edited';
    });
    return w.length ? w.join('; ') + ((changes || []).length > 4 ? '; and more.' : '.') : '';
  }
  var GR_MIN = { paragraph: 550 };                               // v2.26: a target in the AI prompt only (v2.29: never a gate)
  var GR_TRIES = 4, GR_GAP_MS = 2500;                           // the Picker's read-back wait (HC-P-IPP3-3)
  var UPLOAD_SOURCE = 'asf-upload';                             // HC-P-S10-8: Scenario B's browser-upload route
  var FIXES = [];
  var COR = { fix: null, draft: {}, saving: false, fails: {}, note: '' };
  var MED = { items: null, loading: false, error: '', upload: null, session: [], busy: '' };

  function hooks() { return window.PP_WEBHOOKS || {}; }
  function workerBase() { var pb = hooks().planBoard || ''; return pb.replace(/\/plan-board.*$/, ''); }
  function linksUrl() { return hooks().links || (workerBase() ? workerBase() + '/links' : ''); }
  function mediaUrl() { return hooks().media || (workerBase() ? workerBase() + '/media' : ''); }
  function slotById(id) { var b = boardData(); return ((b && b.slots) || []).filter(function (s) { return s.id === id; })[0] || null; }
  function grSlot() { var b = boardData(); return ((b && b.slots) || []).filter(function (s) { return s.blockLabel === GR || s.blockType === GR; })[0] || null; }

  // ── links, read from their records before Compile (/links) ──
  // v2.9: matched without tracking codes, so the compiled email's links
  // (which carry utm_*) count when the record link was confirmed.
  function bareUrl(u) {
    try { var x = new URL(String(u || '')); var drop = []; x.searchParams.forEach(function (v, k) { if (/^utm_/i.test(k)) drop.push(k); });
      drop.forEach(function (k) { x.searchParams.delete(k); }); x.hash = '';
      return (x.protocol + '//' + x.host.toLowerCase() + x.pathname.replace(/\/+$/, '') + (x.search || '')); }
    catch (e) { return String(u || '').trim(); }
  }
  function remembered(u) {
    if (!u) return false;
    var l = stepState().links || {}; if (l[u]) return true;
    var b = bareUrl(u); for (var k in l) if (Object.prototype.hasOwnProperty.call(l, k) && l[k] && bareUrl(k) === b) return true;
    return false;
  }
  function compiledBad() { var lk = state.links; return (lk && lk.links ? lk.links : []).filter(function (x) { return !x.ok && !remembered(x.url); }); }
  function compiledWhy(x) { return (x.text ? '\u201c' + x.text + '\u201d' : x.url.replace(/^https?:\/\//, '').slice(0, 48)) + (x.status ? ' (' + x.status + ')' : x.error ? ' (' + x.error + ')' : '') + '.'; }
  function linkOk(x) { return x.cls === 'works' || x.cls === 'none' || remembered(x.url); }   // v2.10: any flagged link, once confirmed
  function linkWhy(x) {
    var who = x.name || 'A record';
    if (x.cls === 'away') return who + ': the site turned the checker away' + (x.status ? ' (' + x.status + ')' : ' (no answer in 8 s)') + '.';
    if (x.cls === 'unchecked') return who + ': the checker could not open it' + (x.error ? ' (' + x.error + ')' : '') + '.';   // v2.10
    return who + ': dead link' + (x.status ? ' (' + x.status + ')' : x.error ? ' (' + x.error + ')' : '') + '.';
  }
  function linkHead(g) { return (g === 'article' ? 'Article' : g === 'event' ? 'Event' : g === 're' ? 'Listing' : 'Ad') + ' links work'; }
  function linksTile(g, k) {
    var rl = state.rl, h = linkHead(g);
    if (!rl || rl.running) return T_('wait', h, 'Checking\u2026', 'Opening each link from its record.');
    if (rl.error) return T_('bad', h, 'Not checked', 'The link check could not run: ' + rl.error + '. Press Check again.');
    var mine = (rl.links || []).filter(function (x) { return x.group === g && x.cls !== 'none'; });
    if (!mine.length) return null;
    var bad = mine.filter(function (x) { return !linkOk(x); });
    if (!bad.length) {
      var conf = mine.filter(function (x) { return x.cls !== 'works'; }).length;   // v2.10: dead and unchecked confirmed count too
      return T_('ok', h, mine.length + ' of ' + mine.length, 'Every link answers.' + (conf ? ' ' + plural(conf, 'link') + ' you opened yourself.' : ''));
    }
    return T_('bad', h, (mine.length - bad.length) + ' of ' + mine.length, bad.map(linkWhy).join(' '), null, '', { kind: 'link', group: g, k: k + ' \u00b7 ' + h });
  }
  function runLinks(fresh) {
    var u = linksUrl(), p = ids().pubplanId;
    if (!u || !p) { state.rl = { error: 'the links address is not known (PP_WEBHOOKS.links)' }; refreshAll(); return Promise.resolve(); }
    state.rl = { running: true, prev: state.rl && state.rl.links ? state.rl : null }; refreshAll();
    return fetch(u + (u.indexOf('?') < 0 ? '?' : '&') + 'planId=' + encodeURIComponent(p) + (fresh ? '&fresh=1' : ''), { method: 'GET', credentials: 'omit' })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'HTTP ' + r.status }; }); })
      .then(function (j) { state.rl = j && j.ok ? j : { error: (j && j.error) || 'no answer' }; refreshAll(); corRedraw(); })
      .catch(function (e) { state.rl = { error: (e && e.message) || 'request failed' }; refreshAll(); corRedraw(); });
  }

  // ── the title's MEDIA (/media) ───────────────────────────────
  function loadMedia(fresh) {
    var b = boardData(), ta = b && b.plan && b.plan.titleAdminId, u = mediaUrl();
    if (!u || !ta) { MED.error = !u ? 'the MEDIA address is not known (PP_WEBHOOKS.media)' : 'the plan data has no title'; corRedraw(); return Promise.resolve(); }
    MED.loading = true; MED.error = ''; corRedraw();
    return fetch(u + '?taId=' + encodeURIComponent(ta) + (fresh ? '&fresh=1' : ''), { method: 'GET', credentials: 'omit' })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'HTTP ' + r.status }; }); })
      .then(function (j) {
        MED.loading = false;
        if (!j || !j.ok) { MED.error = (j && j.error) || 'no answer'; }
        else { MED.items = j.items || []; MED.upload = j.upload || null; }
        corRedraw();
      })
      .catch(function (e) { MED.loading = false; MED.error = (e && e.message) || 'request failed'; corRedraw(); });
  }
  function mediaList() {
    var seen = {}, out = [];
    MED.session.concat(MED.items || []).forEach(function (m) { if (!seen[m.id]) { seen[m.id] = 1; out.push(m); } });
    return out;
  }
  function mediaById(id) { return mediaList().filter(function (m) { return m.id === id; })[0] || null; }
  // Uploadcare: the canonical address is host + uuid + '/'; shapes are
  // added after it (ASF's locked URL rule).
  function ucCanon(u) {
    var p = String(u || '').split('/');
    if (p.length > 3 && /^[0-9a-f-]{36}$/i.test(p[3] || '')) return 'https://' + p[2] + '/' + p[3] + '/';
    var i = String(u || '').indexOf('/-/'); return i === -1 ? String(u || '') : String(u).slice(0, i + 1);
  }
  function ucApply(base, t) { base = String(base || ''); return base ? base.replace(/\/?$/, '/') + t : ''; }
  function thumbOf(u) { var c = ucCanon(u); return /^[0-9a-f-]{36}$/i.test(c.split('/')[3] || '') ? c + '-/preview/240x240/-/format/auto/' : u; }

  function uploadFor(itemId, file) {
    var up = MED.upload, b = boardData();
    var miss = !up ? ['the MEDIA settings (not read yet)'] : (up.missing || []).slice();
    if (!hooks().conditioner) miss.push('PP_WEBHOOKS.conditioner (Scenario B)');
    if (miss.length) { IxToast.show('Can\u2019t upload', 'err', { detail: 'Missing: ' + miss.join(', ') + '.' }); return; }
    if (!file || !/^image\//.test(file.type || '')) { IxToast.show('Can\u2019t upload', 'err', { detail: 'Choose a picture file.' }); return; }
    MED.busy = itemId; corRedraw();
    var form = new FormData();
    form.append('UPLOADCARE_PUB_KEY', up.publicKey); form.append('UPLOADCARE_STORE', '1'); form.append('file', file, file.name);
    var canon = '';
    fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: form })
      .then(function (r) { if (!r.ok) throw new Error('Uploadcare answered HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        if (!j || !j.file) throw new Error('Uploadcare sent no file id');
        canon = String(up.base).replace(/\/+$/, '') + '/' + j.file + '/';
        var safe = String(file.name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
        var payload = { source: UPLOAD_SOURCE, uploadcareUuid: j.file, uploadcareUrl: canon + safe, fileName: file.name, fileSize: file.size,
          mediaType: 'Image', componentRole: 'Main Image', componentRoleHash: up.hashes.roleMainImage, mediaTypeHash: up.hashes.typeImage,
          mediaStatusAvailableHash: up.hashes.statusAvailable, taItemId: b.plan.titleAdminId, titleSlug: up.titleSlug || b.plan.titleSlug,
          publisherId: up.publisherId || '', componentRoleKey: 'mainImage', mimeType: file.type || '', sourceChannel: UPLOAD_SOURCE,
          uploadedFrom: 'ipp-publish-v' + VERSION };
        return fetch(hooks().conditioner, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      })
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {} if (!r.ok) throw new Error((j && j.error) || ('Scenario B answered HTTP ' + r.status)); return j; }); })
      .then(function (j) {
        var ok = j && (j.success === true || j.ok === true) && j.mediaItemId;
        if (!ok) throw new Error('Scenario B did not confirm a new MEDIA row');
        MED.session.unshift({ id: j.mediaItemId, name: file.name, url: canon });
        MED.busy = ''; setDraft2(itemId, j.mediaItemId, ''); corDraw();
        IxToast.show('Uploaded ' + file.name, 'ok', { detail: 'Picked for this record. Save to keep it.' });
      })
      .catch(function (e) { MED.busy = ''; corRedraw(); IxToast.show('Upload failed', 'err', { detail: (e && e.message) || 'the request failed' }); });
  }

  // ── the window ───────────────────────────────────────────────
  function setDraft2(key, val, orig) { if (String(val == null ? '' : val) === String(orig == null ? '' : orig)) delete COR.draft[key]; else COR.draft[key] = val; delete COR.fails[key]; COR.note = ''; }
  function nPending() { return Object.keys(COR.draft).length; }
  function has(k) { return Object.prototype.hasOwnProperty.call(COR.draft, k); }
  function failNote(k) { return COR.fails[k] ? '<p class="ipp-cor-fail">Not saved: ' + esc(COR.fails[k]) + '</p>' : ''; }
  function undo(keys) { return '<button type="button" class="ix-revert ipp-cor-undo" data-cor-undo="' + esc(keys.join(' ')) + '">Cancel</button>'; }
  function blkClass(keys) { return 'ipp-cor-blk' + (keys.some(has) ? ' is-dirty' : ''); }
  function linkTargets(f) { var rl = state.rl; return ((rl && rl.links) || []).filter(function (x) { return x.group === f.group && x.cls !== 'none' && (!linkOk(x) || has('ok:' + x.id) || has('url:' + x.id)); }); }

  function corSpec(f) {
    var b = boardData();
    if (f.kind === 'design') return { t: f.ids.length === 1 ? 'Pick a design for ' + tileName(slotById(f.ids[0])) : 'Pick a design for each tile',   // v2.58
      p: 'Only the designs made for each block\u2019s type are offered. Saved to the block (Scenario 124).',
      body: f.ids.map(function (id) {
        var s = slotById(id); if (!s) return '';
        var L = s.blockLabel || '', ch = ((b && b.designChoices) || {})[L] || [], cur = has(id) ? COR.draft[id] : s.design;
        return '<div class="' + blkClass([id]) + '"><div class="ipp-cor-bh"><b>' + esc(cap(tileName(s))) + '</b><span>Now: ' + esc(s.designInfo && s.designInfo.name ? '\u201c' + s.designInfo.name + '\u201d' : 'no design') + '</span>' + undo([id]) + '</div>' +
          (ch.length ? '<div class="ipp-cor-dz">' + ch.map(function (d) {
            return '<button type="button" class="ipp-cor-dzb' + (cur === d.id ? ' is-sel' : '') + '" data-cor-pick="' + esc(id + '|' + d.id) + '" title="' + esc(d.name) + '"><span>' + esc(d.name) + '</span>' + (d.mine ? '' : '<small>every title</small>') + '</button>';
          }).join('') + '</div>' : '<p class="ipp-cor-why">No design made for ' + esc(L || 'this type of') + ' blocks is set up for this title. Add one in DESIGNS.</p>') + failNote(id) + '</div>';
      }).join('') };
    if (f.kind === 'photo') {
      var dz = MED.loading && !MED.items ? '<p class="ipp-cor-why">Reading this title\u2019s pictures\u2026</p>' : MED.error ? '<p class="ipp-cor-fail">The pictures could not be read: ' + esc(MED.error) + '</p>' : '';
      return { t: f.items.length === 1 ? 'Add a picture to \u201c' + f.items[0].name + '\u201d' : 'Add the pictures',
        p: 'Pick a picture from this title\u2019s MEDIA for each one, or upload one. Saved as the record\u2019s MEDIA picture (Scenario G).',
        body: f.items.map(function (it) {
          var sel = COR.draft[it.id] || '', list = mediaList();
          var up = '<label class="ipp-cor-up' + (MED.busy ? ' is-busy' : '') + '">' + (MED.busy === it.id ? 'Uploading\u2026' : 'Upload') + '<input type="file" accept="image/*" data-cor-upload="' + esc(it.id) + '"' + (MED.busy ? ' disabled' : '') + '></label>';
          return '<div class="' + blkClass([it.id]) + '"><div class="ipp-cor-bh"><b>' + esc(it.name) + '</b><span>' + esc(it.label) + '</span>' + undo([it.id]) + up + '</div>' +
            (dz || (list.length ? '<div class="ipp-cor-media">' + list.map(function (m) {
              return '<button type="button" class="ipp-cor-mb' + (sel === m.id ? ' is-sel' : '') + '" data-cor-media="' + esc(it.id + '|' + m.id) + '" title="' + esc(m.name || '') + '"><img alt="" loading="lazy" src="' + esc(thumbOf(m.url)) + '"></button>';
            }).join('') + '</div>' : '<p class="ipp-cor-why">This title has no pictures in MEDIA yet. Upload one.</p>')) + failNote(it.id) + '</div>';
        }).join('') };
    }
    if (f.kind === 'link') {
      var ts = linkTargets(f);
      return { t: ts.length === 1 ? (ts[0].name || 'This record') + '\u2019s link' : 'Fix the links', p: 'Open each link yourself. If it opens, say so with It works: you are the final check. If it really is broken, change the link and Save (Scenario G).',
        body: ts.length ? ts.map(function (x) {
          var ok = 'ok:' + x.id, uk = 'url:' + x.id, val = has(uk) ? COR.draft[uk] : x.url;
          return '<div class="' + blkClass([ok, uk]) + '"><div class="ipp-cor-bh"><b>' + esc(x.name || x.id) + '</b><span>' + esc(linkWhy(x).replace(/^[^:]*: /, '')) + '</span>' + undo([ok, uk]) + '</div>' +
            '<div class="ipp-cor-lk"><span title="' + esc(x.url) + '">' + esc(x.url.replace(/^https?:\/\//, '')) + '</span><a class="ipp-cor-open" href="' + esc(x.url) + '" target="_blank" rel="noopener">Open link</a></div>' +
            '<div class="ipp-cor-row' + (has(ok) ? ' is-dirty' : '') + '"><div><b>It works</b><span>I opened it and it loads. Remembered for this issue.</span></div><button type="button" class="ipp-cor-tog' + (has(ok) ? ' is-on' : '') + '" data-cor-ok="' + esc(x.id) + '">It works</button></div>' +   // v2.10: every flagged link
            '<label class="ipp-cor-lbl">Or change the link</label><input type="url" class="ix-picker-input ipp-cor-in' + (has(uk) ? ' ix-picker-input--changed ipp-dirty' : '') + '" data-cor-url="' + esc(x.id) + '" value="' + esc(val) + '" placeholder="https://">' +
            failNote(ok) + failNote(uk) + '</div>';
        }).join('') : '<p class="ipp-cor-why">Every link in this group answers now.</p>' };
    }
    if (f.kind === 'clink') {
      return { t: f.urls.length === 1 ? 'A link in the email' : 'Links in the email', p: 'Open each link yourself. A site that turned the checker away usually opens fine for a person: say so with It works. A link that comes from a record is changed in that record, from its group\u2019s links tile.',
        body: f.urls.map(function (x, i) {
          var ck = 'cok:' + i;
          return '<div class="' + blkClass([ck]) + '"><div class="ipp-cor-bh"><b>' + esc(x.text || 'Link') + '</b><span>' + esc(x.status ? 'answered ' + x.status : (x.error || 'no answer')) + '</span>' + undo([ck]) + '</div>' +
            '<div class="ipp-cor-lk"><span title="' + esc(x.url) + '">' + esc(x.url.replace(/^https?:\/\//, '')) + '</span><a class="ipp-cor-open" href="' + esc(x.url) + '" target="_blank" rel="noopener">Open link</a></div>' +
            '<div class="ipp-cor-row' + (has(ck) ? ' is-dirty' : '') + '"><div><b>It works</b><span>I opened it and it loads. Remembered for this issue.</span></div><button type="button" class="ipp-cor-tog' + (has(ck) ? ' is-on' : '') + '" data-cor-cok="' + i + '">It works</button></div>' +
            failNote(ck) + '</div>';
        }).join('') };
    }
    if (f.kind === 'ack') {
      var ack = ((b && b.slots) || []).filter(function (s) { return s.needsAck; });
      return { t: 'Approve the cloned ads', p: 'Clone copied these from the last issue. Each banner is shown at full width, as it will run. Approve each one that should run again (Scenario 124).',
        body: ack.length ? ack.map(function (s) {
          var a = s.asset || {}, on = has(s.id);
          return '<div class="ipp-cor-ad' + (on ? ' is-dirty' : '') + '">' + (a.thumb ? '<img class="ipp-cor-adimg" alt="" src="' + esc(a.thumb) + '">' : '<div class="ipp-cor-adimg is-none">No banner image on this ad</div>') +
            '<div class="ipp-cor-adm"><div><b>' + esc(a.customer || a.name || 'Ad') + '</b><span>' + esc(cap(tileName(s))) + ' \u00b7 copied by Clone</span></div>' +
            '<button type="button" class="ipp-cor-tog' + (on ? ' is-on' : '') + '" data-cor-ack="' + esc(s.id) + '">' + (on ? 'Approved' : 'Approve') + '</button></div>' + failNote(s.id) + '</div>';
        }).join('') : '<p class="ipp-cor-why">No cloned ad is waiting for approval now.</p>' };
    }
    if (f.kind === 'delivery') {
      var k2 = f.key, v2 = has(k2) ? COR.draft[k2] : savedVal(k2), cls2 = 'ix-picker-input ipp-cor-in' + (has(k2) ? ' ix-picker-input--changed ipp-dirty' : '');
      var ctl2;
      if (k2 === 'sendAt') {
        var d = v2.slice(0, 10), tm = v2.slice(11, 16);
        ctl2 = '<div class="ipp-pub-when"><input type="date" class="' + cls2 + '" data-cor-dl="date" value="' + esc(d) + '"><select class="' + cls2 + '" data-cor-dl="time"><option value=""></option>' +
          TIMES.map(function (x) { var dd = new Date('2000-01-01T' + x); return '<option value="' + x + '"' + (x === tm ? ' selected' : '') + '>' + dd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + '</option>'; }).join('') + '</select></div>';
      } else ctl2 = '<input type="text" class="' + cls2 + '" data-cor-dl="' + k2 + '" ' + (maxLen(k2) ? 'maxlength="' + maxLen(k2) + '" ' : '') + 'value="' + esc(v2) + '">';   // v2.52: board ranges
      return { t: k2 === 'sendAt' ? 'Correct the send time' : 'Correct the ' + LABEL[k2].toLowerCase(),
        p: (k2 === 'sendAt' ? 'It must be in the future. ' : '') + 'Saved to the newsletter, the same field Send Setup uses (Scenario 124).' + (rawVal('authorizedAt') ? ' Saving clears the release, as a Send Setup change does.' : ''),
        body: '<div class="' + blkClass([k2]) + ' is-field"><div class="ipp-cor-bh"><b>' + LABEL[k2] + '</b><span data-cor-count="' + k2 + '">' + (maxLen(k2) && k2 !== 'sendAt' ? v2.length + ' / ' + maxLen(k2) : '') + '</span>' + undo([k2]) + '</div>' + ctl2 + failNote(k2) + '</div>' };
    }
    return { t: 'Correct', p: '', body: '' };
  }
  function corFoot() {
    var n = nPending();
    return '<span class="ipp-cor-note">' + esc(COR.saving ? 'Saving, then reading it back\u2026' : COR.note || (n ? n + ' change' + (n === 1 ? '' : 's') + ' waiting for Save' : '')) + '</span>' +
      '<div class="ix-modal-footer-right"><button type="button" class="ix-revert" data-cor-cancel' + (COR.saving ? ' disabled' : '') + '>Cancel</button>' +
      '<button type="button" class="ix-btn ix-btn--primary ipp-cor-save" data-cor-save' + (n && !COR.saving ? '' : ' disabled') + '>' + (COR.saving ? 'Saving\u2026' : 'Save') + '</button></div>';
  }
  function corRoot() { return document.querySelector('[data-ipp-cor]'); }
  function corDraw() {
    var f = COR.fix, ov = corRoot(); if (!f) return;
    var first = !ov;
    if (!ov) { ov = document.createElement('div'); ov.className = 'ix-overlay ipp-cor-ov'; ov.setAttribute('data-ipp-cor', ''); document.body.appendChild(ov); wireCor(ov); }
    var body = ov.querySelector('.ix-modal-body'), top = body ? body.scrollTop : 0;
    var act = document.activeElement, fk = act && act.getAttribute && ['data-cor-url', 'data-cor-gr', 'data-cor-dl'].filter(function (a) { return act.hasAttribute(a); })[0], fv = fk ? act.getAttribute(fk) : null, pos = null;
    if (fk) { try { pos = act.selectionStart; } catch (e) {} }
    var sp = corSpec(f);
    ov.innerHTML = '<div class="ix-modal ipp-cor' + (first ? '' : ' is-drawn') + (COR.saving ? ' is-locked' : '') + '" role="dialog" aria-modal="true" aria-labelledby="ipp-cor-t"><div class="ix-modal-bar"></div>' +
      '<div class="ix-modal-head"><div class="ix-modal-title-block"><p class="ipp-cor-k">' + esc(f.k || '') + '</p><h3 class="ix-modal-title" id="ipp-cor-t">' + esc(sp.t) + '</h3><p class="ipp-cor-p">' + esc(sp.p) + '</p></div></div>' +
      '<div class="ix-modal-body ipp-cor-b">' + sp.body + '</div><div class="ix-modal-footer" data-cor-foot>' + corFoot() + '</div></div>';
    var nb = ov.querySelector('.ix-modal-body'); if (nb) nb.scrollTop = top;
    if (fk) { var n = ov.querySelector('[' + fk + '="' + fv + '"]'); if (n) { n.focus(); try { if (pos != null) n.setSelectionRange(pos, pos); } catch (e) {} } }
  }
  function corRedraw() { if (!COR.fix || COR.saving) return; var a = document.activeElement; if (a && a.closest && a.closest('[data-ipp-cor]') && /^(INPUT|TEXTAREA)$/.test(a.tagName) && a.type !== 'file') { corFootOnly(); return; } corDraw(); }
  // Updates the footer in place. Replacing it would swap the Save button
  // between mousedown and mouseup (an input's change event fires on the
  // way to Save) and the click would be lost.
  function corFootOnly() {
    var ft = document.querySelector('[data-ipp-cor] [data-cor-foot]'); if (!ft) return;
    var n = nPending(), note = ft.querySelector('.ipp-cor-note'), sv = ft.querySelector('[data-cor-save]');
    if (note) note.textContent = COR.saving ? 'Saving, then reading it back\u2026' : COR.note || (n ? n + ' change' + (n === 1 ? '' : 's') + ' waiting for Save' : '');
    if (sv) { sv.disabled = !n || COR.saving; sv.textContent = COR.saving ? 'Saving\u2026' : 'Save'; }
  }
  function openCor(f) {
    if (!f) return;
    if (released()) { IxToast.show('This issue is released', 'info', { detail: 'Unlock it on Compile to change anything.' }); return; }   // v2.46: refused at the click (ruled 19 Oct)
    if (['design', 'ack'].indexOf(f.kind) >= 0 && planLocked()) { IxToast.show('This plan is locked', 'info', { detail: 'Only Locked plans are read-only. Unlock it in Pub Plans to change its blocks.' }); return; }
    COR.fix = f; COR.draft = {}; COR.fails = {}; COR.note = ''; COR.saving = false;
    if (f.kind === 'photo' && !MED.items && !MED.loading) loadMedia(false);
    corDraw();
    var first = corRoot().querySelector('input:not([type=file]),textarea,.ipp-cor-dzb,.ipp-cor-mb,.ipp-cor-tog'); if (first) first.focus();
  }
  function closeCor() { var ov = corRoot(); if (ov) ov.parentNode.removeChild(ov); COR.fix = null; COR.draft = {}; COR.fails = {}; COR.note = ''; }
  function tryClose() { if (COR.saving || nPending()) return; closeCor(); }

  function wireCor(ov) {
    ov.addEventListener('click', function (e) {
      var t = e.target, el; if (!t.closest) return;
      if (t === ov) { tryClose(); return; }
      if (COR.saving) return;
      if ((el = t.closest('[data-cor-cancel]'))) { closeCor(); return; }
      if ((el = t.closest('[data-cor-save]'))) { corSave(); return; }
      if ((el = t.closest('[data-cor-undo]'))) { el.getAttribute('data-cor-undo').split(' ').forEach(function (k) { delete COR.draft[k]; delete COR.fails[k]; }); COR.note = ''; corDraw(); return; }
      if ((el = t.closest('[data-cor-pick]'))) { var pp = el.getAttribute('data-cor-pick').split('|'), s = slotById(pp[0]); setDraft2(pp[0], (has(pp[0]) && COR.draft[pp[0]] === pp[1]) ? (s && s.design) : pp[1], s && s.design); corDraw(); return; }
      if ((el = t.closest('[data-cor-media]'))) { var mm = el.getAttribute('data-cor-media').split('|'); setDraft2(mm[0], COR.draft[mm[0]] === mm[1] ? '' : mm[1], ''); corDraw(); return; }
      if ((el = t.closest('[data-cor-cok]'))) { var cok = 'cok:' + el.getAttribute('data-cor-cok'); setDraft2(cok, has(cok) ? '' : '1', ''); corDraw(); return; }
      if ((el = t.closest('[data-cor-ok]'))) { var ok = 'ok:' + el.getAttribute('data-cor-ok'); setDraft2(ok, has(ok) ? '' : '1', ''); corDraw(); return; }
      if ((el = t.closest('[data-cor-ack]'))) { var ak = el.getAttribute('data-cor-ack'); setDraft2(ak, has(ak) ? '' : '1', ''); corDraw(); return; }
    });
    ov.addEventListener('input', function (e) {
      var t = e.target, k, orig;
      if (t.hasAttribute('data-cor-url')) { var id = t.getAttribute('data-cor-url'), x = (state.rl && state.rl.links || []).filter(function (y) { return y.id === id; })[0]; k = 'url:' + id; orig = x ? x.url : ''; setDraft2(k, t.value.trim(), orig); }
      else if (t.hasAttribute('data-cor-gr')) { k = t.getAttribute('data-cor-gr'); orig = String(((grSlot() || {}).greeting || {})[k] || ''); setDraft2(k, t.value, orig); }
      else if (t.hasAttribute('data-cor-dl')) {
        k = COR.fix.key; orig = savedVal(k);
        if (k === 'sendAt') { var box = corRoot(), d = box.querySelector('[data-cor-dl="date"]').value, tm = box.querySelector('[data-cor-dl="time"]').value; setDraft2(k, d && tm ? d + 'T' + tm : '', orig); }
        else setDraft2(k, norm(k, t.value) === orig ? orig : t.value, orig);
      } else return;
      var blk = t.closest('.ipp-cor-blk'), on = has(k) || (k.indexOf('url:') === 0 && has('ok:' + k.slice(4)));
      var targets = k === COR.fix.key && COR.fix.kind === 'delivery' ? corRoot().querySelectorAll('[data-cor-dl]') : [t];
      Array.prototype.forEach.call(targets, function (n) { n.classList.toggle('ix-picker-input--changed', has(k)); n.classList.toggle('ipp-dirty', has(k)); });
      if (blk) blk.classList.toggle('is-dirty', on);
      var cnt = corRoot().querySelector('[data-cor-count="' + k + '"]'), mx = maxLen(k);   // v2.52: board ranges
      if (cnt && mx && k !== 'sendAt') { cnt.textContent = t.value.length + ' / ' + mx; cnt.classList.toggle('is-over', t.value.length > mx); }
      corFootOnly();
    });
    ov.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-cor-upload')) { var f = t.files && t.files[0]; if (f) uploadFor(t.getAttribute('data-cor-upload'), f); t.value = ''; return; }
      if (t.hasAttribute('data-cor-dl')) { var ev = document.createEvent('Event'); ev.initEvent('input', true, true); t.dispatchEvent(ev); }
    });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && COR.fix) { e.preventDefault(); tryClose(); } });

  // v2.51 — the sentence a refused 124 write carries (124 v2.26 passes the
  // Data Worker's error through on a 409); '' when the body has none.
  function refusalOf(text) { try { var j = JSON.parse(text); return (j && typeof j.error === 'string' && j.error.trim()) ? j.error.trim() : ''; } catch (e) { return ''; } }
  // ── writes ───────────────────────────────────────────────────
  function call124(op, ops) {
    var url = blockWriter();
    if (!url) return Promise.reject(new Error('this page has no PP_WEBHOOKS.blockWriter address (Scenario 124)'));
    var batchId = 'cor-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    var u = url + (url.indexOf('?') < 0 ? '?' : '&') + 'op=' + encodeURIComponent(op) + '&batchId=' + encodeURIComponent(batchId) + '&batch=' + encodeURIComponent(JSON.stringify({ ops: ops }));
    return fetch(u, { method: 'GET', credentials: 'omit' }).then(function (r) {
      return r.text().then(function (t) {
        if (!r.ok) throw new Error(refusalOf(t) || ('Scenario 124 answered HTTP ' + r.status + ' to ' + op));   // v2.51: the Worker's sentence first
        var b; try { b = JSON.parse(t); } catch (e) { throw new Error('Scenario 124 sent a reply that is not JSON (' + op + ')'); }
        return (b && b.results) || [];
      });
    });
  }
  function callG(kind, id, fields, part) {
    var url = hooks().studio, b = boardData(), slug = b && b.plan && b.plan.titleSlug;
    if (!url) return Promise.reject(new Error('this page has no PP_WEBHOOKS.studio address (Scenario G)'));
    if (!G_TYPES[kind]) return Promise.reject(new Error('Scenario G cannot save ' + kind + ' edits yet'));
    if (!slug) return Promise.reject(new Error('the plan data has no title slug'));
    var payload = { action: 'updateAsset', assetType: G_TYPES[kind], itemId: id, articleId: id, titleSlug: slug, op: 'save-draft',
      titleId: null, version: 'ipp-publish-v' + VERSION, fields: fields, timestamp: new Date().toISOString() };
    if (part) payload.part = part;   // G v6: an article edit names its part (link or picture), so G writes only that
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = JSON.parse(t); } catch (e) {}
        if (!r.ok) throw new Error((j && j.error) || ('Scenario G answered HTTP ' + r.status));
        if (j && (j.ok === false || j.success === false)) throw new Error(j.error || 'Scenario G refused the save');
        return j;
      });
    });
  }
  function reload() { return (window.IPP && IPP.board && IPP.board.load) ? IPP.board.load({ fresh: true }) : Promise.resolve(null); }
  function writeStepState(mut) {
    var p = pubBoard(); if (!p || p.types.stepState === null) return Promise.reject(new Error('the NEWSLETTER has no publish-step-state field'));
    var cur = stepState(); if (cur._bad) cur = {};
    var next = Object.assign({}, cur, { v: 1 }); mut(next);
    var fd = {}; fd[p.fields.stepState] = JSON.stringify(next);
    return patchNewsletter(fd);
  }
  function each(list, fn) { return list.reduce(function (ch, x) { return ch.then(function () { return fn(x); }); }, Promise.resolve()); }

  function corSave() {
    var f = COR.fix, keys = Object.keys(COR.draft); if (!f || !keys.length || COR.saving) return;
    COR.saving = true; COR.fails = {}; COR.note = ''; corDraw();
    var fails = {}, b = boardData(), job;
    try {
    if (f.kind === 'design') {
      var F = (b && b.blockFields && b.blockFields.design) || '';
      job = !F ? Promise.reject(new Error('the plan data does not name the design field (Data Worker v1.0.34)'))
        : call124('fill', keys.map(function (id) { return { id: id, assetField: F, assetId: COR.draft[id] }; })).then(reload).then(function () {
          keys.forEach(function (id) { var s = slotById(id); if (!s || s.design !== COR.draft[id]) fails[id] = 'the block did not keep the new design'; });
        });
    } else if (f.kind === 'ack') {
      var A = (b && b.adFields && b.adFields.approval) || '';
      job = !A ? Promise.reject(new Error('the plan data does not name the approval field'))
        : call124('clear', keys.map(function (id) { return { id: id, assetField: A }; })).then(reload).then(function () {
          keys.forEach(function (id) { var s = slotById(id); if (!s || s.needsAck) fails[id] = 'the ad is still waiting for approval'; });
        });
    } else if (f.kind === 'delivery') {
      var p = pubBoard(), fd = {}, want = {};
      keys.forEach(function (k) {
        var v = norm(k, COR.draft[k]); want[k] = v;
        fd[p.fields[k]] = v === '' ? null : (k === 'sendAt' ? new Date(v).toISOString() : v);
      });
      var wasAuth = false;                                                    // v2.46: a Correct save never clears the release (Correct is held while released)
      var stId = wasAuth ? withStatus(fd, 'draft') : null;
      job = patchNewsletter(fd).then(function () {
        keys.forEach(function (k) { if (savedVal(k) !== want[k]) fails[k] = 'the newsletter did not keep the change'; else { delete EM.draft[k]; delete EM.seeded[k]; } });
        if (wasAuth) statusCheck(stId);
      });
    } else if (f.kind === 'link') {
      var links = (state.rl && state.rl.links) || [], byId = {}; links.forEach(function (x) { byId[x.id] = x; });
      var oks = keys.filter(function (k) { return k.indexOf('ok:') === 0; }), urls = keys.filter(function (k) { return k.indexOf('url:') === 0; });
      var okUrls = oks.map(function (k) { return (byId[k.slice(3)] || {}).url; }).filter(Boolean), stamp = new Date().toISOString();
      job = (okUrls.length ? writeStepState(function (n) { n.links = Object.assign({}, n.links || {}); okUrls.forEach(function (u) { n.links[u] = stamp; }); })
          .then(function () { oks.forEach(function (k) { if (!remembered((byId[k.slice(3)] || {}).url)) fails[k] = 'the newsletter did not keep it'; }); }, function (e) { oks.forEach(function (k) { fails[k] = (e && e.message) || 'the request failed'; }); })
        : Promise.resolve()).then(function () {
          return each(urls, function (k) {
            var x = byId[k.slice(4)], v = COR.draft[k];
            if (!x) { fails[k] = 'the record is no longer in this issue'; return; }
            if (!/^https?:\/\/\S+\.\S+/.test(v)) { fails[k] = 'that is not a web address (start it with https://)'; return; }
            var fields = {}; fields[x.key] = v;
            return callG(x.kind, x.id, fields, x.kind === 'article' ? 'link' : '').catch(function (e) { fails[k] = (e && e.message) || 'the request failed'; });
          });
        }).then(function () { return urls.length ? runLinks(true) : null; }).then(function () {
          var now = {}; ((state.rl && state.rl.links) || []).forEach(function (x) { now[x.id] = x; });
          urls.forEach(function (k) { if (fails[k]) return; var x = now[k.slice(4)]; if (!x || x.url !== COR.draft[k]) fails[k] = 'the record did not keep the new link'; });
        });
    } else if (f.kind === 'clink') {
      var cUrls = keys.map(function (k) { return (f.urls[Number(k.slice(4))] || {}).url; }), cStamp = new Date().toISOString();
      job = writeStepState(function (n) { n.links = Object.assign({}, n.links || {}); cUrls.forEach(function (u) { if (u) n.links[bareUrl(u)] = cStamp; }); })
        .then(function () { keys.forEach(function (k, i) { if (!remembered(cUrls[i])) fails[k] = 'the newsletter did not keep it'; }); },
              function (e) { keys.forEach(function (k) { fails[k] = (e && e.message) || 'the request failed'; }); });
    } else if (f.kind === 'photo') {
      job = each(keys, function (id) {
        var it = f.items.filter(function (x) { return x.id === id; })[0], m = mediaById(COR.draft[id]);
        if (!it || !m) { fails[id] = 'that picture is no longer in MEDIA'; return; }
        var base = ucCanon(m.url), K = ((boardData() || {}).photoKeys || {})[it.kind] || {}, fields = {};
        if (!K.src) { fails[id] = 'the plan data does not name the picture fields (Data Worker v1.0.34)'; return; }
        fields[K.src] = it.kind === 'article' ? ucApply(base, UC_T.main) : base;
        if (K.media) fields[K.media] = m.id;
        if (it.kind === 'article') fields.ogImageSrc = ucApply(base, UC_T.og);
        return callG(it.kind, id, fields, it.kind === 'article' ? 'picture' : '').catch(function (e) { fails[id] = (e && e.message) || 'the request failed'; });
      }).then(reload).then(function () {
        var bb = boardData();
        keys.forEach(function (id) {
          if (fails[id]) return;
          var got = false;
          ((bb && bb.slots) || []).forEach(function (s) {
            if (s.asset && s.asset.id === id && s.asset.thumb) got = true;
            (s.items || []).forEach(function (x) { if (x.id === id && x.photo) got = true; });
          });
          if (!got) fails[id] = 'the record still has no picture the email reads';
        });
      });
    }
    } catch (e) { job = Promise.reject(e); }   // a throw while starting the save must still end it
    if (!job) job = Promise.resolve();
    job.catch(function (e) { keys.forEach(function (k) { if (!fails[k]) fails[k] = (e && e.message) || 'the request failed'; }); }).then(function () {
      COR.saving = false;
      var bad = Object.keys(fails);
      keys.forEach(function (k) { if (bad.indexOf(k) < 0) delete COR.draft[k]; });
      COR.fails = fails;
      refreshAll();
      if (!bad.length) {
        COR.note = 'Saved, read back, and checked again';
        IxToast.show('Saved', 'ok', { detail: 'Read back from the records. The tile has checked itself again.' });
        corDraw(); setTimeout(function () { if (COR.fix === f && !nPending()) closeCor(); }, 900);
      } else {
        COR.note = bad.length + ' not saved';
        IxToast.show(bad.length + ' change' + (bad.length === 1 ? '' : 's') + ' not saved', 'err', { detail: fails[bad[0]] });
        corDraw();
      }
    });
  }

  // ────────────────────────────────────────────────────────────
  // v2.26  THE GREETING CARD (top of the Compile page)
  // The greeting is written last, from the issue as the board shows
  // it. Saved to the plan's GR row through Scenario 122 (block-save,
  // the Picker's own op), read back before it is called saved.
  // Stale rule: a content block (article, event, re) saved after the GR
  // row means the greeting is older than the issue (HC-P-PUB26-3).
  // ────────────────────────────────────────────────────────────
  // v2.35: GR_STALE_TYPES and grcStale() retired; the Worker's basis diff (greeting.basis) is the one stale rule.

  // ── compile, release and vendor times (derived, nothing stored) ──
  function compiledAt() {
    var a = state.result && Date.parse(state.result.written || ''), o = state.lastCheck && state.lastCheck.body, lc = o && o.lastCompile;
    var c = lc && lc.at ? Date.parse(lc.at) : NaN;
    var best = Math.max(isNaN(a) || !a ? 0 : a, isNaN(c) ? 0 : c);
    return best || 0;
  }
  function newerThan(iso) { var t = Date.parse(iso || ''); return !!(t && compiledAt() > t + 1000); }

  // ── the five steps ───────────────────────────────────────────
  var STEPS = [                                                            // v2.20: each step draws in one view
    { key: 'setup',   label: 'Send Setup',       view: 'publish' },   // v2.22: the Send Setup page (DOM name kept)
    { key: 'compile', label: 'Compile',          view: 'compile' },   // v2.22: its own view
    { key: 'confirm', label: 'Confirmation',     view: 'compile' },   // v2.22: a card under the compile result, not a tab
    { key: 'vendor',  label: 'Submit to Vendor', view: 'distribution' },
    { key: 'status',  label: 'Vendor Status',    view: 'distribution' }
  ];
  function stepsOf(view) { return STEPS.filter(function (t) { return t.view === view; }); }
  function viewOf(k) { var t = STEPS.filter(function (x) { return x.key === k; })[0]; return t ? t.view : 'publish'; }
  function shellView() { return (window.IPP && IPP._view) || 'publish'; }
  function setupDone() { return setupGate().ok; }
  function compileDone() {
    if (state.compiledOk) return true;
    if (stampsOf().compile && stampsOf().compile.at) return true;         // v2.46: the stamp
    var o = state.lastCheck && state.lastCheck.body;
    return !!(o && o.ok === true && o.lastCompile && o.lastCompile.sizeKb != null);
  }
  function boardGreen() { var cb = compileBlockers(); return !cb.bad && !cb.hold && !cb.wait; }   // v2.44   // v2.27: the board has no red tile and is not still reading
  function linksOk() { var l = state.links; return !!(l && l.ok && compiledBad().length === 0); }   // v2.11: same rule as the panel line
  function confirmDone() { return released(); }                          // v2.46: the release stamp, or the legacy field
  function stepOpen(k) {
    if (k === 'setup') return true;
    if (k === 'compile') return setupDone();
    if (k === 'confirm') return setupGate(true).ok && compileDone() && linksOk() && boardGreen() && !isStale();   // v2.19: the saved settings, not the draft; v2.27: and no red tile; v2.46: and the compile is current
    if (k === 'vendor') return released();                                 // v2.47: the release stamp alone (S7 §4)
    if (k === 'status') return released() && !!vs('sentAt');
    return false;
  }
  function stepDone(k) { return k === 'setup' ? setupDone() : k === 'compile' ? (compileDone() && linksOk()) : k === 'confirm' ? confirmDone() : k === 'vendor' ? !!vs('sentAt') : !!vs('readyAt'); }
  function lockWhy(k) {
    return k === 'compile' ? 'Finish Send Setup first' : k === 'confirm' ? (!compileDone() ? 'Compile the issue first' : isStale() ? 'The plan changed after the compile. Compile again' : !boardGreen() ? 'Fix the red tiles and compile again' : 'Every link must respond first')
      : k === 'vendor' ? 'Release the issue on Compile first' : 'Press I sent it first';
  }
  function firstOpenStep(view) {                                           // v2.20: within one view
    var S = stepsOf(view || 'publish');
    for (var i = 0; i < S.length; i++) if (!stepOpen(S[i].key) || !stepDone(S[i].key) || !stepOpen(S[i + 1] ? S[i + 1].key : '')) return S[i].key;
    return S[S.length - 1].key;
  }
  function curTab(view) {
    view = view || shellView(); if (view !== 'distribution' && view !== 'compile') view = 'publish';   // v2.22
    if (!state.tabs) state.tabs = {};
    var t = state.tabs[view];
    if (!t || viewOf(t) !== view || (!stepOpen(t) && t !== firstOpenStep(view))) state.tabs[view] = t = firstOpenStep(view);
    return t;
  }
  var LOCK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  function tabsHtml(view) {
    view = view || 'publish';
    var cur = curTab(view);
    return stepsOf(view).map(function (t, n) {
      var open = stepOpen(t.key), on = cur === t.key, done = open && stepDone(t.key);
      return '<button type="button" class="ipp-pub-tab' + (on ? ' is-active' : '') + (open ? '' : ' is-locked') + (done ? ' is-done' : '') + (t.sim ? ' is-sim' : '') + '"' +
        ' role="tab" aria-selected="' + on + '" data-pub-tab="' + t.key + '"' + (open ? '' : ' aria-disabled="true" title="' + lockWhy(t.key) + '"') + '>' +
        '<span class="ipp-pub-tab-n">' + (n + 1) + '</span><span class="ipp-pub-tab-name">' + t.label + '</span>' +
        '<span class="ipp-pub-tab-end">' + (open ? (done ? '\u2713' : '') : LOCK) + '</span></button>';
    }).join('');
  }
  function drawTabs() {                                                    // v2.20: every mounted bar
    Array.prototype.forEach.call(document.querySelectorAll('[data-publish-tabs]'), function (bar) {
      var view = bar.getAttribute('data-publish-tabs') || 'publish';
      var before = state.tabs && state.tabs[view], cur = curTab(view);
      bar.innerHTML = tabsHtml(view);
      if (before !== cur) showPane(cur);
    });
  }
  // v2.25 — the shell shows the send time under the publication date
  var SENT_AT = null;
  function announceSend() {
    var local = ''; try { local = boardData() ? (savedVal('sendAt') || '') : ''; } catch (e) { local = ''; }
    if (local === SENT_AT) return; SENT_AT = local;
    document.dispatchEvent(new CustomEvent('ipp:send-at', { detail: { local: local, text: local ? niceWhen(local) : '' } }));
  }
  // v2.24 — the release bar at the foot of Compile (HC-P-PUB24-1); v2.46: gone, the header's stamp row is the release line
  var BAR = { dismissed: '' };
  function drawBar_retired() {
    var bar = document.querySelector('.ipp-view[data-view="compile"] [data-publish-release]'); if (!bar) return;   // v2.32: a row of the sticky header
    if (!confirmShown()) { bar.hidden = true; bar.innerHTML = ''; return; }
    var authAt = rawVal('authorizedAt'), sendLocal = savedVal('sendAt');
    if (authAt) {
      if (BAR.dismissed === authAt) { bar.hidden = true; bar.innerHTML = ''; return; }
      bar.className = 'ipp-cx-rel is-done';
      bar.innerHTML = '<span class="ipp-cx-rel-dot"></span><span class="ipp-cx-rel-text"><b>Released for distribution</b> \u00b7 ' + esc(niceWhen(isoToLocal(authAt))) + '</span>' +
        '<button type="button" class="ix-btn ix-btn--secondary ix-btn--sm" data-pub-go="vendor">Open Distribution</button>' +
        '<button type="button" class="ipp-cx-rel-x" data-bar-dismiss aria-label="Clear">\u00d7</button>';
    } else {
      bar.className = 'ipp-cx-rel is-ready';
      bar.innerHTML = '<span class="ipp-cx-rel-dot"></span><span class="ipp-cx-rel-text"><b>Ready to release</b>' + (sendLocal ? ' \u00b7 goes out ' + esc(niceWhen(sendLocal)) : '') + '</span>' +
        '<button type="button" class="ix-btn ix-btn--primary ix-btn--sm" data-bar-review>Review and release</button>';
    }
    bar.hidden = false;
  }
  function confirmShown() { var c = canvas('compile'); return !!(c && c.getAttribute(MOUNTED) === '1' && CX.review); }   // v2.47: the Confirmation is on screen only in review
  function showPane(k) {
    var view = viewOf(k);
    if (view === 'compile') { drawReview(); return; }                       // v2.47: the Confirmation in place of the board
    if (view === 'distribution') { drawSim(); return; }                     // v2.49: one pane
    Array.prototype.forEach.call(document.querySelectorAll('.ipp-view[data-view="' + view + '"] .ipp-pub-pane'), function (p) { p.hidden = p.getAttribute('data-pane') !== k; });
    if (k === 'confirm') drawConfirm();
  }
  function openStep(k) {
    if (!stepOpen(k)) { IxToast.show(lockWhy(k), 'info'); return; }
    var view = viewOf(k); if (!state.tabs) state.tabs = {};
    state.tabs[view] = k;
    if (shellView() !== view) {                                            // v2.20: the step is on the other tab
      var b = document.querySelector('.ipp-switcher button[data-view="' + view + '"]');
      if (b) { b.click(); if (!canvas(view) || canvas(view).getAttribute(MOUNTED) !== '1') mount(view); }
    }
    drawTabs(); showPane(k);
  }

  // ── step 3 · Confirmation ────────────────────────────────────
  var CF = { ticks: [false, false, false], saving: false, edit: false };   // v2.19: edit = the envelope editor is open on this tab
  function confirmHtml() {
    var t = titleInfo(), b = boardData(), i = ids(), lc = state.lastCheck && state.lastCheck.body;
    var slots = (b && b.slots) || [], fa = slots.filter(function (s) { return s.blockType === 'FA' && s.asset; })[0];
    var bannerG = window.IPPRevenue && IPPRevenue.gate ? IPPRevenue.gate() : null;
    var lead = slots.filter(function (s) { return s.assetType === 'ad'; }).sort(function (x, y) { return x.position - y.position; })[0];
    var sendLocal = savedVal('sendAt'), when = sendLocal ? new Date(sendLocal) : null;
    var days = when ? Math.round((when - Date.now()) / 36e5) : null;
    var inTxt = days == null ? '' : days < 0 ? 'this time has passed' : days < 48 ? 'in ' + days + ' hours' : 'in ' + Math.floor(days / 24) + ' days, ' + (days % 24) + ' hours';
    var row = function (k, v) { return '<div class="cf-row"><span>' + k + '</span><b>' + v + '</b></div>'; };
    var authAt = releaseStamp() ? releaseStamp().at : '';                   // v2.46
    var canEdit = !planLocked() && !released(), editing = CF.edit && canEdit;                  // v2.19; v2.46: nothing edits a released issue
    var editLink = canEdit && !editing ? '<button type="button" class="ix-revert" data-cf-edit>Edit</button>' : '';
    var goLink = function (g, txt) { return '<a class="cf-link" data-pub-go="' + g + '">' + txt + '</a>'; };
    var envelope = editing
      ? '<div class="cf-edit"><div class="cf-k cf-k-row"><span>Subject, preview, audience and send time</span>' + (changedKeys().length || EM.saving ? '' : '<button type="button" class="ix-revert" data-cf-edit-close>Done</button>') + '</div>' +
          '<div data-publish-setup>' + setupCardHtml() + '</div></div>'
      : '<div class="cf-grid"><div class="cf-box"><div class="cf-k cf-k-row"><span>Inbox</span>' + editLink + '</div>' + row('Subject', esc(savedVal('subject'))) + row('Preview', esc(savedVal('preview'))) + '</div>' +
          '<div class="cf-box"><div class="cf-k cf-k-row"><span>Audience</span>' + editLink + '</div>' + row('Sends', esc(commas(savedVal('volume')))) + row('Zip codes', esc(t.zips || '')) + row('Sectors', esc(sectorsShown(savedVal('sectors')))) + '</div></div>';   // v2.47: the Newsletter ID lives in Delivery's detail
    var contents = '<div class="cf-box"><div class="cf-k cf-k-row"><span>Contents</span>' + (canEdit ? goLink('layout', 'Open Layout') : '') + '</div>' + row('Feature', esc(fa ? fa.asset.name : '\u2014')) + row('Blocks', esc(String(slots.length))) + row('Sponsors', esc(sponsorList(slots) || 'none')) + '</div>';
    var ads = '<div class="cf-box"><div class="cf-k cf-k-row"><span>Advertisers</span>' + (canEdit ? goLink('revenue', 'Open Revenue') : '') + '</div>' + row('Lead banner', esc(lead && lead.asset ? (lead.asset.customer || lead.asset.name) : 'house ad')) + row('Splash', esc(splashName(b))) + row('Banners', esc(bannerG ? bannerG.filled + ' of ' + bannerG.total + ' filled' : '\u2014')) + '</div>';
    return '<p class="ipp-pub-sub cf-lead">The last stop before this issue goes to readers. Read it through once more. Nothing is sent until you press the button.</p>' +   // v2.47: no "This issue" box (the header has it); four equal cards
      '<div class="cf-goes"><b>Goes out ' + esc(sendLocal ? niceWhen(sendLocal) : 'not set') + '</b><span>' + esc(inTxt) + '</span>' + editLink + '</div>' +
      (editing ? envelope : envelope.replace('<div class="cf-grid">', '<div class="cf-grid cf-grid--4">').replace(/<\/div><\/div>$/, '</div>' + contents + ads + '</div>')) +
      (authAt ? '<div class="cf-done">\u2713 Released for distribution \u00b7 ' + esc(niceWhen(isoToLocal(authAt))) + ' \u00b7 locked until Unlock, on the Compile header</div>'
        : '<div class="cf-ack">' + ['The subject line and preview text are right.', 'The audience and the send date and time are right.', 'I opened the email and the web page, and they look right.'].map(function (txt, n) {
            return '<label><input type="checkbox" data-cf-tick="' + n + '"' + (CF.ticks[n] ? ' checked' : '') + (CF.saving ? ' disabled' : '') + '> ' + txt + '</label>'; }).join('') + '</div>' +
          '<div class="cf-gorow"><button type="button" class="ix-btn ix-btn--primary cf-go" data-cf-go' + (CF.ticks.every(Boolean) && !CF.saving ? '' : ' disabled') + '>' + (CF.saving ? 'Recording\u2026' : 'Confirm and release for distribution') + '</button>' +
          '<p class="cf-fine">Records the release, with the time, on the newsletter and locks the four editing tabs. The only way back is Unlock, on the Compile header.</p></div>');
  }
  function drawConfirm() { var box = document.querySelector('[data-publish-confirm]'); if (box) box.innerHTML = confirmHtml(); }
  function drawReview() {                                                  // v2.47: Review and release replaces the board under the same header (S7 ruling 9)
    var c = canvas('compile'); if (!c || c.getAttribute(MOUNTED) !== '1') return;
    if (CX.review && !stepOpen('confirm') && !released()) CX.review = false;   // the compile went stale or red: back to the board
    var on = CX.review;
    var board = c.querySelector('[data-publish-board]'), cf = c.querySelector('[data-publish-confirm]'), back = c.querySelector('[data-publish-back]'), ttl = c.querySelector('[data-publish-title]'), res = c.querySelector('[data-publish-result]');
    if (board) board.hidden = on;
    if (cf) { cf.hidden = !on; if (on) cf.innerHTML = confirmHtml(); }
    if (back) back.hidden = !on;
    if (ttl) ttl.textContent = on ? HX.reviewTitle : HX.pageTitle;
    if (res && on) res.hidden = true;
  }
  function setRelease(on) {                                                // v2.46: the release stamp (ruling 1) plus the legacy field; off = Unlock (ruling 9)
    var p = pubBoard(); if (!p) return Promise.resolve();
    var stamp = on ? new Date().toISOString() : null, c = stampsOf().compile;
    var st = stampFd(function (n) {
      if (on) { n.release = { at: stamp, compileAt: c && c.at ? c.at : null }; return; }
      delete n.release;
      var vd = n.vendor && typeof n.vendor === 'object' ? n.vendor : null;                     // v2.47: Unlock after a vendor send voids that file (S7 ruling 13)
      if (vd && vd.sentAt) n.vendor = { voided: { file: vd.file || emailFileName(), sentAt: vd.sentAt, sentTo: vd.sentTo || [], at: stamp || new Date().toISOString() } };
      else if (vd && vd.voided) n.vendor = { voided: vd.voided };
      else delete n.vendor;
    });
    if (!st) { IxToast.show(on ? 'Can\u2019t record the release' : 'Can\u2019t unlock', 'err', { detail: 'The NEWSLETTER has no publish-step-state field.' }); return Promise.resolve(); }
    var fd = {}; fd[st.slug] = st.value;
    if (p.types.authorizedAt !== null) fd[p.fields.authorizedAt] = stamp;   // the legacy field keeps pace for its readers (Scenario 108, /plans)
    var stId = withStatus(fd, on ? 'readyToPublish' : 'draft');   // v2.4
    CF.saving = true; drawConfirm(); drawBoard();
    return patchNewsletter(fd).then(function () {
      CF.saving = false;
      var got = released();
      if (on ? !got : got) { IxToast.show(on ? 'Release not recorded' : 'Not unlocked', 'err', { detail: 'The newsletter did not keep the change.' }); }
      else { IxToast.show(on ? 'Released for distribution' : 'Unlocked. The release is withdrawn', 'ok'); if (!on) CF.ticks = [false, false, false]; statusCheck(stId); }
      if (on && released()) CX.review = false;                   // v2.47: stay on Compile and show the green band (S7 ruling 9)
      VS.draft = {}; VS.to = null; VS.cc = null; VS.open = '';
      drawSetup(); refreshAll(); drawConfirm(); if (canvas('distribution') && canvas('distribution').getAttribute(MOUNTED) === '1') drawSim();
      document.dispatchEvent(new CustomEvent('ipp:release', { detail: { released: released(), at: on ? stamp : null } }));   // v2.46: ipp-shell v1.26 locks the editing tabs from this
    }).catch(function (err) { CF.saving = false; IxToast.show(on ? 'Release not recorded' : 'Not unlocked', 'err', { detail: (err && err.message) || 'the request failed' }); drawConfirm(); drawBoard(); });
  }

  // ── steps 4 and 5 · by hand (v2.1) ──────────────────────────
  // Their state is JSON in NEWSLETTER publish-step-state:
  //   { v:1, vendor:{ sentAt, receivedAt, testingAt, testOkAt, readyAt } }
  var VSTEPS = [
    { k: 'sentAt',     label: 'Sent to the vendor',                 auto: 'Later: the Send button sends it from the send mailbox.' },
    { k: 'receivedAt', label: 'The vendor confirmed they have it',  short: 'The vendor has it', auto: 'Later: read from the vendor\u2019s first reply.' },
    { k: 'testingAt',  label: 'In testing (a seed or test send is on its way)', short: 'In testing', auto: 'Later: read from a reply saying \u201cin testing\u201d or \u201cseed test\u201d.' },
    { k: 'testOkAt',   label: 'I checked the test and it looks right', short: 'I checked the test', auto: 'Stays a person\u2019s call.' },
    { k: 'readyAt',    label: 'Fully set up: nothing more needed',  short: 'Fully set up', auto: 'Later: read from a reply saying \u201cfully scheduled\u201d or \u201cnothing more needed\u201d.' }
  ];
  var VS = { draft: {}, saving: false, fails: '', note: '', copied: '', to: null, cc: null, open: '' };   // v2.47: to/cc = the pending picks (null = the list's defaults); open = which picker's drop-down is open
  function stepState() { var r = rawVal('stepState'); if (!r) return {}; try { var o = JSON.parse(r); return o && typeof o === 'object' ? o : {}; } catch (e) { return { _bad: true }; } }

  // ── v2.46 · the stamps and the header state ─────────────────
  var HX = {                                                               // HC-P-PUB46-1: the header's words, by state
    none:     { head: 'Ready to compile', go: 'Compile issue' },
    current:  { head: 'Compiled', go: 'Review and release', again2: 'Compile again' },   // v2.47: a text link in the fact line, not a demoted button
    stale:    { head: 'The plan changed after the compile', headWords: 'The words changed after the compile', go: 'Compile again' },   // v2.50
    released: { head: 'Released', sub: 'Locked \u00b7 unlock to edit', link: 'Unlock' },
    notYet: 'Not compiled yet', saved: 'plan saved', wordsSince: 'the words changed since', again: 'Check again', before: 'before stamps were kept',
    building: 'Building the email and web page. Usually under 10 seconds.',
    toFix: 'To fix', clean: 'Every check passed.', pick: 'Pick a section above to read its checks.',
    cleanStale: 'The plan was saved after this compile, so the files above are behind it. Compile again.',
    cleanStaleWords: 'The words changed after this compile, so the files above are behind it. Compile again.',   // v2.51
    cleanReleased: 'Released and locked. Pick a section above to read its checks; nothing here can change until Unlock.',
    pageTitle: 'Compile this Issue', reviewTitle: 'Review and release', back: '\u2190 Back to Compile', close: 'Click the cell again to close.',
    unlockTitle: 'Unlock this issue?',
    unlockBody: 'This withdraws the release. Distribution closes until you release again. Nothing in the plan is lost.',
    files: { view: 'View email', download: 'Download', web: 'Web page' }
  };
  var KB_LIMIT = 95;                                                       // HC-P-PUB46-2: the vendor's email ceiling when the Worker names none
  var TICK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
  var BIGLOCK = '<svg class="ipp-cx-biglock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10.5" width="16" height="11" rx="2.5"/><path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3"/></svg>';
  function stampsOf() { var o = stepState(); if (o._bad) o = {}; var g = function (k) { return o[k] && typeof o[k] === 'object' ? o[k] : null; }; return { check: g('check'), compile: g('compile'), release: g('release') }; }
  function compileStamp() {                                                // the stamp, else a compile from before stamps were kept (legacy)
    var c = stampsOf().compile; if (c && c.at) return c;
    var o = state.lastCheck && state.lastCheck.body, lc = o && o.ok === true ? o.lastCompile : null;
    if (lc && lc.at) return { at: lc.at, kb: lc.sizeKb != null ? Number(lc.sizeKb) : null, links: null, legacy: true };
    return null;
  }
  function savedInfo() { var b = boardData(); return (b && b.plan && b.plan.saved) || null; }   // ix-issue-data v1.0.69: { at, rows, sig }
  function releaseStamp() { var r = stampsOf().release; if (r && r.at) return r; var a = rawVal('authorizedAt'); return a ? { at: a, compileAt: null, legacy: true } : null; }
  function released() { return !!releaseStamp(); }
  function isStale() {
    var c = compileStamp(); if (!c || c.legacy) return false;
    var sv = savedInfo(); if (!sv) return false;
    if (c.basisSig && sv.sig) return c.basisSig !== sv.sig;
    return !!(c.basisAt && sv.at && sv.at > c.basisAt);
  }
  function wordsOnlyStale() { var c = compileStamp(), sv = savedInfo(); return !!(isStale() && c && c.basisRowsSig && sv && sv.rowsSig && c.basisRowsSig === sv.rowsSig); }   // v2.50: the blocks match, the words do not
  function headerState() { if (released()) return 'released'; var c = compileStamp(); if (!c || c.legacy) return 'none'; return isStale() ? 'stale' : 'current'; }
  function stampDay(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  function stampFull(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function stampClock(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
  function stampNear(iso, ref) { return stampDay(iso) && stampDay(iso) === stampDay(ref) ? stampClock(iso) : stampFull(iso); }   // the same day as the first stamp: clock only
  function sendsTxt() { var v = savedVal('sendAt'); var d = v ? new Date(v) : null; return d && !isNaN(d) ? d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''; }
  function limitKb() {
    var r = state.result, o = state.lastCheck && state.lastCheck.body && state.lastCheck.body.ok === true ? state.lastCheck.body : null, lc = o && o.lastCompile;
    return r && r.emailLimit ? Math.round(Number(r.emailLimit) / 1024) : lc && lc.limitKb ? Number(lc.limitKb) : KB_LIMIT;
  }
  function sizeKbNow() { var r = state.result, c = compileStamp(); return r && r.emailSizeKb != null ? Number(r.emailSizeKb) : c && c.kb != null ? Number(c.kb) : null; }
  function stampFd(mut) {                                                  // the publish-step-state field entry, mutated; for writes that carry other fields too
    var p = pubBoard(); if (!p || p.types.stepState === null) return null;
    var cur = stepState(); if (cur._bad) cur = {};
    var next = Object.assign({}, cur, { v: 1 }); mut(next);
    return { slug: p.fields.stepState, value: JSON.stringify(next) };
  }
  function writeCompileStamp(o) {                                          // after a proven compile: the stamp with the plan's saved basis
    var sv = savedInfo();
    return writeStepState(function (n) {
      n.compile = { at: o.written || new Date().toISOString(), basisAt: sv ? sv.at : null, basisSig: sv ? sv.sig : null, basisRowsSig: sv && sv.rowsSig ? sv.rowsSig : null,   // v2.50: rows apart, so the header can name the words
                    kb: o.emailSizeKb != null ? Number(o.emailSizeKb) : null, links: null,
                    wx: (function () { var w = wxNow(); return w ? String(w.state || '') : null; })() };   // v2.59: the weather the compile was built with
    }).catch(function (e) { IxToast.show('Compile stamp not recorded', 'err', { detail: (e && e.message) || 'the request failed' }); });
  }
  function writeLinksOnStamp() {                                           // once, when the link check answers and the stamp has no links yet
    var c = stampsOf().compile, lk = state.links;
    if (!c || !c.at || c.links || !lk || lk.running || lk.error || !lk.links) return;
    var rec = { checked: Number(lk.checked) || 0, bad: compiledBad().length };
    writeStepState(function (n) { if (n.compile && n.compile.at === c.at) n.compile.links = rec; })
      .catch(function (e) { console.warn('[Publish] link count not recorded on the compile stamp: ' + ((e && e.message) || e)); });
  }
  // ── the header: three fixed rows ─────────────────────────────
  function statusRowHtml(cb, checks, pass) {
    var hs = headerState(), W = HX[hs], locked = hs === 'released';
    var held = cb.bad ? 'bad' : cb.hold ? 'hold' : '';
    var again = ' \u00b7 <button type="button" class="ipp-cx-again" data-publish-recheck>' + HX.again + '</button>';
    var again2 = hs === 'current' && !released() ? ' \u00b7 <button type="button" class="ipp-cx-again" data-publish-go' + (state.stopped ? ' disabled' : '') + '>' + HX.current.again2 + '</button>' : '';   // v2.47
    var fact = state.running ? '<span data-publish-status>' + HX.building + '</span>'
      : cb.wait ? 'Reading the issue\u2026'
      : (cb.n ? JW.sub : JW.subNone) + again + again2;                     // v2.59
    var head = (cb.bad || cb.hold) ? JW.left(cb.n) : hs === 'none' ? JW.nothing : (hs === 'stale' && wordsOnlyStale() ? W.headWords : W.head);   // v2.59: the jobs left outrank the state word
    if (locked) return '<i class="ipp-cx-biglock-box">' + BIGLOCK + '</i><div class="ipp-cx-txt"><h2 class="ipp-cx-h">' + esc(W.head) + '</h2><p class="ipp-cx-sub">' + W.sub + '</p></div>' +
      '<div class="ipp-cx-act is-link"><button type="button" class="ipp-cx-demote" data-cx-unlock' + (CF.saving ? ' disabled' : '') + '>' + (CF.saving ? 'Unlocking\u2026' : HX.released.link) + '</button></div>';
    var canGo = !state.stopped && !cb.bad && !cb.hold && !cb.wait && setupGate().ok;
    var btn;
    if (state.running) btn = '<button type="button" class="ix-btn ix-btn--primary ipp-cx-go" data-publish-go disabled>Compiling\u2026</button>';
    else if (hs === 'current') btn = '<button type="button" class="ix-btn ix-btn--primary ipp-cx-go' + (held ? ' is-' + held : '') + '" data-cx-review' + (canGo && linksOk() ? '' : ' disabled') + '>' + W.go + '</button>';
    else btn = '<button type="button" class="ix-btn ix-btn--primary ipp-cx-go' + (held ? ' is-' + held : '') + '" data-publish-go' + (canGo ? '' : ' disabled') + '>' + W.go + '</button>';
    return '<i class="ipp-cx-sdot' + (held ? ' is-' + held : cb.wait ? ' is-wait' : '') + '" aria-hidden="true"></i><div class="ipp-cx-txt"><h2 class="ipp-cx-h' + (held ? ' is-' + held : '') + '">' + esc(head) + '</h2><p class="ipp-cx-sub">' + fact + '</p></div>' +
      '<div class="ipp-cx-act">' + btn + '</div>';                                                   // v2.47: one height in every state, no demoted slot
  }
  function cellsHtml(cb) {                                                // v2.59: one cell per group of jobs
    if (cb.wait) return '';
    var locked = released(), jm = cb.jobs;
    return JW.cells.filter(function (g) { return jm.cells[g] && jm.cells[g].show; }).map(function (g) {
      var n = jm.cells[g].n, red = jm.jobs.some(function (j) { return j.g === g && (j.k === 'red' || j.k === 'ours') && !j.free; });
      var end = locked ? LOCK : n ? (red ? '\u2715' : '!') : TICK;
      return '<button type="button" class="ipp-cx-cell ipp-cx-g--k-' + g + (n ? (red ? ' is-bad' : ' is-hold') : '') + (locked ? ' is-locked' : '') + (CX.open === g ? ' is-open' : '') + '" data-cx-nav="' + g + '" title="' + esc(jm.names[g]) + '" aria-pressed="' + (CX.open === g) + '">' +
        '<i aria-hidden="true"></i><span>' + esc(jm.names[g]) + '</span><em>' + (n ? n : '') + '</em><b>' + end + '</b></button>';
    }).join('');
  }
  function stampRowHtml() {
    var hs = headerState(), c = compileStamp(), r = releaseStamp(), sv = savedInfo();
    var left, dim = hs === 'stale' || (c && c.legacy);
    if (!c && !r) left = HX.notYet;
    else if (hs === 'released') left = '<b>Released ' + esc(stampFull(r.at)) + '</b>' + (c ? ' \u00b7 compiled ' + esc(stampNear(c.at, r.at)) : '') + (sendsTxt() ? ' \u00b7 sends ' + esc(sendsTxt()) : '');
    else if (c.legacy) left = '<b>Compiled ' + esc(stampFull(c.at)) + '</b> \u00b7 ' + HX.before;
    else left = '<b' + (hs === 'stale' ? ' class="is-k"' : '') + '>Compiled ' + esc(stampFull(c.at)) + '</b>' + (hs === 'stale' && wordsOnlyStale() ? ' \u00b7 ' + HX.wordsSince : sv && sv.at ? ' \u00b7 ' + HX.saved + ' ' + esc(stampNear(sv.at, c.at)) : '');   // v2.50
    var right = '';
    if (c) {
      var kbN = sizeKbNow(), lim = limitKb(), lk = state.links, bits = [];
      if (kbN != null) bits.push((kbN > lim ? '<span class="is-bad">' : '<span>') + esc(kbN) + ' / ' + esc(lim) + ' KB</span>');
      if (lk && !lk.running && !lk.error && lk.links) { var badL = compiledBad().length; bits.push((badL ? '<span class="is-bad">' : '<span>') + (lk.checked - badL) + ' / ' + lk.checked + ' links</span>'); }
      else if (lk && lk.running) bits.push('<span>checking links\u2026</span>');
      var slug = pubRow() && pubRow().slug, sm = 'class="ipp-cx-sm' + (dim ? ' is-dim' : '') + '"';
      right = '<span class="ipp-cx-fact' + (dim ? ' is-dim' : '') + '">' + bits.join(' \u00b7 ') + '</span>' +
        '<button type="button" ' + sm + ' data-publish-view-email>' + HX.files.view + '</button><button type="button" ' + sm + ' data-publish-download-email>' + HX.files.download + '</button>' +
        (slug ? '<a ' + sm + ' href="/nl/' + esc(slug) + '" target="_blank" rel="noopener">' + HX.files.web + '</a>' : '<span ' + sm + ' aria-disabled="true">' + HX.files.web + '</span>');
    }
    return '<div class="ipp-cx-stl">' + left + '</div><div class="ipp-cx-str">' + right + '</div>';
  }
  function drawHeader(cb, checks, pass) {
    var head = document.querySelector('[data-publish-head]'); if (!head) return;
    var hs = headerState();
    head.className = 'ipp-cx-head is-' + hs;
    var s = head.querySelector('[data-publish-status-row]'); if (s) s.innerHTML = statusRowHtml(cb, checks, pass);
    var c = head.querySelector('[data-publish-secs]'); if (c) c.innerHTML = cellsHtml(cb);
    var t = head.querySelector('[data-publish-stamp]'); if (t) t.innerHTML = stampRowHtml();
  }
  // v2.59 — release without weather: asked once, at Review and release (ruled by Jeff, 23 Oct)
  var WXQ = {                                                              // HC-P-PUB59-3
    title: 'This issue has no weather yet',
    body: function (d) { return 'The email was compiled before the forecast reached the send date' + (d ? '. The weather can be added from ' + d : '') + '.'; },
    wait: 'Wait for the weather', go: 'Send without weather',
    waitNote: 'Nothing is released. Compile again once the weather is ready, then release.',
    goNote: 'The weather is left out of this issue only. The weather tile stays on the plan.'
  };
  function noWeatherCompile() {
    var c = compileStamp(), w = wxNow();
    if (!c || c.legacy || !c.wx || !w || w.state === 'off') return false;
    return c.wx !== 'ready' && c.wx !== 'off';
  }
  function openWxAsk() {
    if (document.querySelector('[data-ipp-wxask]')) return;
    var w = wxNow(), d = w && w.availableOn ? wxDay(w.availableOn) : '';
    var ov = document.createElement('div'); ov.className = 'ix-overlay ipp-cx-unlock-ov'; ov.setAttribute('data-ipp-wxask', '');
    ov.innerHTML = '<div class="ix-modal ipp-cx-unlock" role="dialog" aria-modal="true" aria-labelledby="ippWxAskT"><div class="ix-modal-bar"></div>' +
      '<div class="ix-modal-head"><div class="ix-modal-title-block"><h3 class="ix-modal-title" id="ippWxAskT">' + esc(WXQ.title) + '</h3>' +
      '<p class="ipp-cx-unlock-p">' + esc(WXQ.body(d)) + '</p>' +
      '<ul class="ipp-cx-unlock-l"><li><b>' + esc(WXQ.wait) + ':</b> ' + esc(WXQ.waitNote) + '</li><li><b>' + esc(WXQ.go) + ':</b> ' + esc(WXQ.goNote) + '</li></ul></div></div>' +
      '<div class="ix-modal-footer ipp-cx-unlock-f"><button type="button" class="ix-btn ix-btn--secondary" data-wxask="wait">' + esc(WXQ.wait) + '</button><button type="button" class="ix-btn ix-btn--primary" data-wxask="go">' + esc(WXQ.go) + '</button></div></div>';
    document.body.appendChild(ov);
    var close = function () { if (ov.parentNode) ov.parentNode.removeChild(ov); document.removeEventListener('keydown', onKey); };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-wxask]');
      if (e.target === ov || (b && b.getAttribute('data-wxask') === 'wait')) { close(); return; }
      if (b && b.getAttribute('data-wxask') === 'go') { close(); setRelease(true); }
    });
    var f = ov.querySelector('[data-wxask="wait"]'); if (f) f.focus();
  }
  // Unlock (ruling 9): the one way back from Released
  var UNLOCK_OPEN = false;
  function openUnlock() {
    if (UNLOCK_OPEN || !released()) return;
    UNLOCK_OPEN = true;
    var ov = document.createElement('div'); ov.className = 'ix-overlay ipp-cx-unlock-ov'; ov.setAttribute('data-ipp-unlock', '');
    var sent = vsSaved('sentAt'), body;                                   // v2.47: after a vendor send, the recovery dialog (S7 ruling 13)
    if (sent) body = '<p class="ipp-cx-unlock-p">The vendor already has <span class="mono">' + esc(vsSaved('file') || emailFileName()) + '</span>, sent ' + esc(niceWhen(isoToLocal(sent))) + '. Unlocking voids that file.</p>' +
      '<ul class="ipp-cx-unlock-l"><li>The five Vendor Status steps are cleared.</li><li>After you compile and release again, Submit to Vendor sends a replacement and names the file it replaces.</li><li>Nothing in the plan is lost.</li></ul>' +
      '<p class="ipp-cx-unlock-p">Double-check: has the vendor scheduled or tested the old file? If so, tell them a replacement is coming.</p>';
    else body = '<p class="ipp-cx-unlock-p">' + HX.unlockBody + '</p>';
    ov.innerHTML = '<div class="ix-modal ipp-cx-unlock' + (sent ? ' is-void' : '') + '" role="dialog" aria-modal="true" aria-labelledby="ipp-cx-unlock-t"><div class="ix-modal-bar"></div>' +
      '<div class="ix-modal-head"><div class="ix-modal-title-block"><h3 class="ix-modal-title" id="ipp-cx-unlock-t">' + HX.unlockTitle + '</h3>' + body + '</div></div>' +
      '<div class="ix-modal-footer ipp-cx-unlock-f"><button type="button" class="ix-revert" data-unlock-cancel>Cancel</button><button type="button" class="ix-btn ' + (sent ? 'ix-btn--danger' : 'ix-btn--primary') + '" data-unlock-go>' + (sent ? 'Unlock and void the file' : 'Unlock') + '</button></div></div>';
    document.body.appendChild(ov);
    var close = function () { if (ov.parentNode) ov.parentNode.removeChild(ov); UNLOCK_OPEN = false; document.removeEventListener('keydown', onKey); };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) {
      var t = e.target; if (!t.closest) return;
      if (t.closest('[data-unlock-cancel]')) { e.preventDefault(); close(); return; }
      if (t.closest('[data-unlock-go]')) { e.preventDefault(); close(); setRelease(false); return; }
    });
    var b = ov.querySelector('[data-unlock-cancel]'); if (b) b.focus();
  }
  function vsSaved(k) { var v = (stepState().vendor || {})[k]; return v || ''; }
  function vs(k) { return (k in VS.draft) ? VS.draft[k] : vsSaved(k); }
  function vsChanged() { return Object.keys(VS.draft).filter(function (k) { return !!VS.draft[k] !== !!vsSaved(k); }); }
  var VX = {                                                               // HC-P-PUB47-1: the Distribution words by state
    lead: 'Send this yourself from Outlook for now: copy each part, or open it filled in, then attach the file.',
    noList: 'No vendor address is set for this title: add the vendor address list on TITLES-ADMIN (or IX_CONFIG.vendor.email on the Data Worker).',
    pickTo: 'Pick addresses', listFoot: 'Addresses come from this title\u2019s vendor list on T-A. None here? Add it there.',
    replTitle: 'This replaces the file the vendor already has.', replBody: 'This replaces the {file} file sent {when}. Please discard that file and schedule the attached one instead.',
    replBtn: 'Download the new file', sentTitle: 'Mark as sent?', sentBtn: 'I sent it',
    outlook: 'Opens a new email with Subject and Body filled in. Attach the downloaded file before sending. \u201cI sent it\u201d records the time.',
    cleared: 'Cleared at Unlock, '
  };
  function vendorInfo() { var p = pubBoard(); return (p && p.vendor) || { email: null, name: null, signoff: null, addresses: null }; }
  function vendorAddresses() {                                            // the title's list (ix-issue-data v1.0.70); else IX_CONFIG.vendor.email split (HC-P-PUB47-2)
    var v = vendorInfo();
    if (Array.isArray(v.addresses) && v.addresses.length) return v.addresses.map(function (a) { return typeof a === 'string' ? { email: a, label: '', use: '' } : { email: String(a.email || ''), label: String(a.label || ''), use: String(a.use || a.default || '') }; }).filter(function (a) { return a.email; });
    return String(v.email || '').split(/[;,\s]+/).filter(Boolean).map(function (e) { return { email: e, label: 'vendor', use: 'to' }; });
  }
  function addrDefault(kind) {                                            // the list's own defaults; none marked: every address goes in To
    var all = vendorAddresses(), marked = all.filter(function (a) { return a.use === kind; }).map(function (a) { return a.email; });
    if (marked.length || all.some(function (a) { return a.use; })) return marked;
    return kind === 'to' ? all.map(function (a) { return a.email; }) : [];
  }
  function addrPicked(kind) { var cur = kind === 'to' ? VS.to : VS.cc; return cur ? cur.slice() : addrDefault(kind); }
  function addrChanged(kind) { var cur = kind === 'to' ? VS.to : VS.cc; return !!cur && cur.join(',') !== addrDefault(kind).join(','); }
  function tzName(d) { try { return new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(d).filter(function (x) { return x.type === 'timeZoneName'; })[0].value; } catch (e) { return ''; } }
  function voided() { var v = stepState().vendor; return v && v.voided && !vsSaved('sentAt') ? v.voided : null; }   // the file the vendor holds from before an Unlock
  function vendorSubject() {
    var b = boardData(), i = ids(), w = savedVal('sendAt');
    return '[' + i.issue + '] ' + (voided() ? 'REPLACEMENT \u00b7 ' : '') + ((b && b.plan && b.plan.titleName) || '') + ' \u00b7 send ' + (w ? niceWhen(w) : '');
  }
  function vendorBody() {
    var t = titleInfo(), i = ids(), v = vendorInfo(), w = savedVal('sendAt'), d = w ? new Date(w) : null, vo = voided();
    return (v.name ? 'Hi ' + v.name + ',' : 'Hi,') + '\n\n' +
      (vo ? VX.replBody.replace('{file}', vo.file || emailFileName()).replace('{when}', stampFull(vo.sentAt)) + '\n\n' : 'Please schedule the attached newsletter:\n\n') +
      '- Subject line: ' + savedVal('subject') + '\n' +
      '- Preview text: ' + savedVal('preview') + '\n' +
      '- Zip codes: ' + (t.zips || '') + '\n' +
      '- Number of sends: ' + commas(savedVal('volume')) + '\n' +
      '- Sectors:\n' + sectorList(savedVal('sectors')).map(function (x) { return '    - ' + x; }).join('\n') + '\n' +
      '- Send date and time: ' + (d ? niceWhen(w, true) + (tzName(d) ? ' ' + tzName(d) : '') : '') + '\n' +
      '- Newsletter ID: ' + i.nlId + ' (please include it on the performance report)\n\n' +
      'The newsletter is attached as ' + emailFileName() + '.\n\n' +
      'Thank you' + (v.signoff ? ',\n' + v.signoff : '');
  }
  function pickerHtml(kind) {                                             // To or CC: chips plus a drop-down of the list; a pending change wears the gold border with Cancel
    var all = vendorAddresses(), picked = addrPicked(kind), open = VS.open === kind, changed = addrChanged(kind), sent = !!vsSaved('sentAt');
    var chips = picked.map(function (e) { var a = all.filter(function (x) { return x.email === e; })[0]; var isNew = changed && addrDefault(kind).indexOf(e) < 0; return '<span class="vd-chip' + (isNew ? ' is-new' : '') + '" title="' + esc(a && a.label ? a.label : e) + '">' + esc(e) + (sent ? '' : '<button type="button" data-vd-drop="' + kind + ':' + esc(e) + '" aria-label="Remove">\u00d7</button>') + '</span>'; }).join('');
    var dd = open && !sent ? '<div class="vd-dd">' + all.map(function (a) { return '<label><input type="checkbox" data-vd-pick="' + kind + ':' + esc(a.email) + '"' + (picked.indexOf(a.email) >= 0 ? ' checked' : '') + '> <span>' + esc(a.email) + '</span><em>' + esc(a.label) + '</em></label>'; }).join('') + '<div class="vd-dd-foot">' + VX.listFoot + '</div></div>' : '';
    return '<div class="vd-f"><div class="vd-l">' + (kind === 'to' ? 'To' : 'CC') + '</div><div class="vd-pickwrap">' +
      '<div class="vd-pick' + (changed ? ' is-changed' : '') + (open ? ' is-open' : '') + '">' + (chips || '<span class="vd-ph">' + VX.pickTo + '</span>') + (sent ? '' : '<button type="button" class="vd-chev" data-vd-open="' + kind + '" aria-label="Choose addresses">\u25be</button>') + dd + '</div>' +
      (changed && !sent ? '<button type="button" class="ix-revert vd-cancel" data-vd-reset="' + kind + '">Cancel</button>' : '') + '</div></div>';
  }
  function vendorHtml() {
    var all = vendorAddresses(), sent = vsSaved('sentAt'), vo = voided(), c = compileStamp(), r = releaseStamp();
    var to = addrPicked('to'), cc = addrPicked('cc');
    var mailto = 'mailto:' + encodeURIComponent(to.join(',')) + '?' + (cc.length ? 'cc=' + encodeURIComponent(cc.join(',')) + '&' : '') + 'subject=' + encodeURIComponent(vendorSubject()) + '&body=' + encodeURIComponent(vendorBody());   // v2.48: with no list, Outlook opens with To empty
    var older = sent && c && c.at && vsSaved('sentCompileAt') && Date.parse(c.at) > Date.parse(vsSaved('sentCompileAt')) + 1000;   // v2.47: against the compile the vendor was sent (S7 §4)
    var copyRow = function (label, key, value, mono, btn) {
      return '<div class="vd-f"><div class="vd-l">' + label + '</div><div class="vd-frow"><div class="vd-v' + (mono ? ' mono' : '') + '">' + esc(value || '') + '</div>' +
        '<button type="button" class="vd-copy' + (VS.copied === key ? ' is-done' : '') + '" data-vd-' + (btn || 'copy') + '="' + key + '">' + (btn === 'download' ? 'Download' : VS.copied === key ? 'Copied' : 'Copy') + '</button></div></div>';
    };
    var note = vo ? '<div class="vd-note"><div><b>' + VX.replTitle + '</b> ' + esc(vo.file || emailFileName()) + ' was sent ' + esc(stampFull(vo.sentAt)) + ', then the issue was unlocked' + (c && c.at ? ' and compiled again at ' + esc(stampClock(c.at)) : '') + '. The email below says so; the vendor\u2019s five steps were cleared.</div><button type="button" class="ix-btn ix-btn--primary ix-btn--sm" data-vd-download="file">' + VX.replBtn + '</button></div>' : '';
    var warn = (older ? '<p class="ipp-pub-em-note is-bad">The vendor has an older file. This issue was compiled again after you sent it: download the new file and send it again.</p>' : '');
    var ch = vsChanged(), ready = !!vsSaved('readyAt'), nSent = !!vsSaved('sentAt');
    var steps = VSTEPS.map(function (st, n) {                             // v2.49: tick the steps on the card itself
      var cur = vs(st.k), chg = ch.indexOf(st.k) >= 0, dis = n === 0 || !nSent || VS.saving;
      return '<label class="vd-step' + (cur ? ' is-on' : '') + (chg ? ' is-changed' : '') + (dis ? ' is-dis' : '') + '"><input type="checkbox" data-vs-tick="' + st.k + '"' + (cur ? ' checked' : '') + (dis ? ' disabled' : '') + '><span>' + (st.short || st.label) + '</span>' +
        '<em>' + (cur ? (chg ? 'waiting for Save' : esc(stampFull(cur))) : '') + '</em></label>';
    }).join('');
    var foot = ch.length ? '<div class="vd-foot"><button type="button" class="ix-btn ix-btn--primary ix-btn--sm" data-vs-save' + (VS.saving ? ' disabled' : '') + '>' + (VS.saving ? 'Saving\u2026' : 'Save ' + ch.length + ' change' + (ch.length === 1 ? '' : 's')) + '</button>' +
      (VS.saving ? '' : '<button type="button" class="ix-revert" data-vs-cancel-all>Cancel</button>') + '</div>' : '';
    var doneLine = ready ? '<p class="vd-done"><b>This issue is done.</b> The vendor has it fully set up. Next: press <b>Set as Next</b> on its Pub Plans tile. On the send date, Scenario 108 promotes it to the current issue and locks the plan.</p>' : '';
    var side = '<div class="vd-side"><div class="vd-card"><h4>Released</h4><div class="vd-kv">' +
        '<span>At</span><b>' + esc(r && r.at ? stampFull(r.at) : '\u2014') + '</b><span>File</span><b class="mono">' + esc(emailFileName()) + '</b><span>Compiled</span><b>' + esc(c && c.at ? stampFull(c.at) : '\u2014') + '</b>' +
        (vo ? '<span>Replaces</span><b>file sent ' + esc(stampFull(vo.sentAt)) + '</b>' : '<span>Sends</span><b>' + esc(sendsTxt() || 'not set') + '</b>') + '</div></div>' +
      '<div class="vd-card vd-status' + (ready ? ' is-ready' : '') + (ch.length ? ' is-pending' : '') + '"><h4>Vendor status</h4>' + (stepState()._bad ? '<p class="ipp-pub-em-note is-bad">publish-step-state on the newsletter is not valid JSON; saving will replace it.</p>' : '') +
        '<div class="vd-steps">' + steps + '</div>' + foot + doneLine + (vo ? '<p class="vd-cleared">' + VX.cleared + esc(stampFull(vo.at)) + '.</p>' : '') + '</div></div>';
    var actions = sent
      ? '<div class="cf-done">\u2713 Marked as sent \u00b7 ' + esc(niceWhen(isoToLocal(sent))) + (vsSaved('sentTo') && vsSaved('sentTo').length ? ' \u00b7 to ' + esc(vsSaved('sentTo').join(', ')) : '') + '</div>'
      : '<div class="vd-actions">' + (mailto ? '<a class="ix-btn ix-btn--secondary" href="' + esc(mailto) + '" data-vd-mail>Open in Outlook</a>' : '') +
        '<button type="button" class="ix-btn ix-btn--primary" data-vd-sent' + (VS.saving ? ' disabled' : '') + '>' + (VS.saving ? 'Recording\u2026' : VX.sentBtn) + '</button><p class="cf-fine">' + VX.outlook + '</p></div>';
    return '<p class="ipp-pub-sub">' + VX.lead + '</p>' + note + warn +
      '<div class="vd-wrap"><div class="vd-form">' + (all.length ? pickerHtml('to') + pickerHtml('cc') : '') +   // v2.48: pickers only when a list exists
        copyRow('Subject', 'subject', vendorSubject(), true) +
        '<div class="vd-f"><div class="vd-l">Body</div><div class="vd-frow is-body"><pre class="vd-body' + (vo ? ' is-short' : '') + '">' + esc(vendorBody()) + '</pre><button type="button" class="vd-copy' + (VS.copied === 'body' ? ' is-done' : '') + '" data-vd-copy="body">' + (VS.copied === 'body' ? 'Copied' : 'Copy') + '</button></div></div>' +
        copyRow('Attach', 'file', emailFileName(), true, 'download') + actions + '</div>' + side + '</div>';
  }
  var SENT_OPEN = false;
  function openSentDialog() {                                             // v2.47: the Mark as sent acknowledgement (ruling 14)
    if (SENT_OPEN || vsSaved('sentAt')) return;
    var to = addrPicked('to'), cc = addrPicked('cc'), c = compileStamp();
    SENT_OPEN = true;
    var ov = document.createElement('div'); ov.className = 'ix-overlay ipp-cx-unlock-ov'; ov.setAttribute('data-ipp-sent', '');
    ov.innerHTML = '<div class="ix-modal ipp-cx-unlock is-sent" role="dialog" aria-modal="true" aria-labelledby="ipp-vd-sent-t"><div class="ix-modal-bar"></div>' +
      '<div class="ix-modal-head"><div class="ix-modal-title-block"><h3 class="ix-modal-title" id="ipp-vd-sent-t">' + VX.sentTitle + '</h3>' +
      '<p class="ipp-cx-unlock-p">This records that <span class="mono">' + esc(emailFileName()) + '</span> went to ' + (to.length ? esc(to.join(' and ')) + (cc.length ? ' (CC ' + esc(cc.join(', ')) + ')' : '') : 'the vendor') + ' at ' + esc(niceWhen(localStamp(new Date()))) + ', and opens Vendor Status.</p>' +
      '<ul class="ipp-cx-unlock-l"><li>Nothing is sent from here; you sent it yourself.</li><li>Changing the plan after this needs Unlock, which voids this file.</li></ul>' +
      '<p class="ipp-cx-unlock-p">Double-check: the file you attached is the one compiled at ' + esc(c && c.at ? stampClock(c.at) : '\u2014') + ', and the send date in the email is ' + esc(sendsTxt() || 'not set') + '.</p></div></div>' +
      '<div class="ix-modal-footer ipp-cx-unlock-f"><button type="button" class="ix-revert" data-sent-cancel>Cancel</button><button type="button" class="ix-btn ix-btn--primary" data-sent-go>' + VX.sentBtn + '</button></div></div>';
    document.body.appendChild(ov);
    var close = function () { if (ov.parentNode) ov.parentNode.removeChild(ov); SENT_OPEN = false; document.removeEventListener('keydown', onKey); };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) {
      var t = e.target; if (!t.closest) return;
      if (t.closest('[data-sent-cancel]')) { e.preventDefault(); close(); return; }
      if (t.closest('[data-sent-go]')) {
        e.preventDefault(); close();
        saveVendorState({ sentAt: new Date().toISOString(), sentTo: to, sentCc: cc, sentCompileAt: c && c.at ? c.at : '', file: emailFileName(), voided: null })
          .then(function (ok) { if (ok) { VS.to = null; VS.cc = null; VS.open = ''; IxToast.show('Marked as sent', 'ok'); drawSim(); } });   // v2.49: the card on the right is step 2 onward
        return;
      }
    });
    var b = ov.querySelector('[data-sent-cancel]'); if (b) b.focus();
  }
  function lockedHtml(k) {                                                 // v2.20, HC-P-GI1-2
    return '<p class="ipp-pub-sub">' + esc(lockWhy(k)) + '.</p>' +
      (k === 'vendor' ? '<p class="ipp-pub-em-note">Compile the issue, then press Review and release and confirm. <button type="button" class="ix-revert" data-pub-go="compile">Open Compile</button></p>' : '');
  }
  function drawSim() {
    var v = document.querySelector('[data-publish-vendor]');
    if (v) v.innerHTML = stepOpen('vendor') ? vendorHtml() : lockedHtml('vendor');
    var root = document.querySelector('[data-ipp-root]');
    if (root) root.classList.toggle('ipp-pub-done', !!vsSaved('readyAt'));
  }
  function saveVendorState(patch) {
    var p = pubBoard(); if (!p || p.types.stepState === null) { IxToast.show('Can\u2019t save', 'err', { detail: 'The NEWSLETTER has no publish-step-state field.' }); return Promise.resolve(false); }
    var cur = stepState(); if (cur._bad) cur = {};
    var next = Object.assign({}, cur, { v: 1, vendor: Object.assign({}, cur.vendor || {}) });
    Object.keys(patch).forEach(function (k) { if (patch[k] && !(Array.isArray(patch[k]) && !patch[k].length)) next.vendor[k] = patch[k]; else delete next.vendor[k]; });
    var fd = {}; fd[p.fields.stepState] = JSON.stringify(next);
    var stId = null;                                                        // v2.4
    if ('readyAt' in patch) stId = withStatus(fd, patch.readyAt ? 'publishNextAsCurrent' : (rawVal('authorizedAt') ? 'readyToPublish' : 'draft'));
    VS.saving = true; drawSim();
    return patchNewsletter(fd).then(function () {
      VS.saving = false;
      var bad = Object.keys(patch).filter(function (k) { return k !== 'voided' && !!vsSaved(k) !== !!(patch[k] && !(Array.isArray(patch[k]) && !patch[k].length)); });
      if (bad.length) { IxToast.show('Not saved', 'err', { detail: 'The newsletter did not keep ' + bad.length + ' change' + (bad.length === 1 ? '' : 's') + '.' }); drawSim(); drawTabs(); return false; }
      if (stId !== null) statusCheck(stId);   // v2.4
      drawSim(); drawTabs(); railDots(); return true;   // v2.38: the Distribution dot follows the Fully set up tick
    }).catch(function (err) { VS.saving = false; IxToast.show('Not saved', 'err', { detail: (err && err.message) || 'the request failed' }); drawSim(); return false; });
  }
  function copyText(key) {
    var txt = key === 'to' ? addrPicked('to').join(', ') : key === 'cc' ? addrPicked('cc').join(', ') : key === 'subject' ? vendorSubject() : vendorBody();
    var done = function () { VS.copied = key; drawSim(); setTimeout(function () { if (VS.copied === key) { VS.copied = ''; drawSim(); } }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { IxToast.show('Could not copy', 'err', { detail: 'Select the text and copy it by hand.' }); });
    else IxToast.show('Could not copy', 'err', { detail: 'Select the text and copy it by hand.' });
  }
  // v2.21 (D12) — the compiled email as a file. This session's compile when
  // the page holds it; otherwise the saved one, read from the Worker's
  // /email-html (ix-issue-data v1.0.30, the email 206 stored on the
  // NEWSLETTER). View and Download share it; the file is named for the plan.
  function emailFile(cb, what) {
    if (state.emailUrl) { cb(state.emailUrl); return; }
    var u = linkCheckUrl().replace(/\/link-check.*$/, '/email-html'), nl = ids().nlId;
    if (!u || !nl) { IxToast.show('No email yet', 'err', { detail: 'Compile first.' }); return; }
    fetch(u + '?n=' + encodeURIComponent(nl), { method: 'GET', credentials: 'omit' })
      .then(function (r) { if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || ('HTTP ' + r.status)); }, function () { throw new Error('HTTP ' + r.status); }); return r.blob(); })
      .then(function (b) { state.emailUrl = URL.createObjectURL(new Blob([b], { type: 'text/html' })); cb(state.emailUrl); })
      .catch(function (e) { IxToast.show(what === 'view' ? 'Could not open the email' : 'No file to download', 'err', { detail: (e && e.message) || 'the request failed' }); });
  }
  function viewHtml() { emailFile(function (url) { window.open(url, '_blank', 'noopener'); }, 'view'); }
  function downloadHtml() {
    emailFile(function (url) { var a = document.createElement('a'); a.href = url; a.download = emailFileName(); document.body.appendChild(a); a.click(); a.remove(); }, 'download');
  }


  function blockers() {
    var i = ids(), out = [];
    if (!hook())       out.push('The compile webhook is not set on this page (PP_WEBHOOKS.compile).');
    if (!i.found.length) {
      out.push('No newsletter points at this plan. Set the plan on its NEWSLETTER item, or check that the page has the newsletter-source list.');
    } else if (i.found.length > 1) {
      out.push(i.found.length + ' newsletters point at this plan (' +
        i.found.slice(0, 4).map(function (x) { return x.name || x.id; }).join(', ') +
        (i.found.length > 4 ? ', \u2026' : '') +
        '). A plan has one newsletter. Check the newsletter-source list\u2019s filter on this page, ' +
        'or fix the extra NEWSLETTER item.');
    }
    if (!i.pubplanId)  out.push('The publication plan id is missing from the page.');
    if (!window.IxToast || typeof IxToast.submit !== 'function')
                       out.push('ix-success-toast is not loaded on this page.');
    return out;
  }

  // ── frame (rendered once; only the result area changes) ──────
  function infoBadge() {
    if (!window.IxInfo || typeof IxInfo.badge !== 'function') return '';
    return IxInfo.badge({
      file: FILE, version: VERSION, title: 'Send Setup \u00b7 Compile \u00b7 Distribution',
      blurb: 'Builds the email and the web page from the blocks in this plan, ' +
             'saves both to the issue, and publishes the issue\u2019s web page. ' +
             'Nothing is sent to readers.\n\n' +
             'The Greeting card at the top is written last, from the issue as it stands: AI Generate reads the ' +
             'articles and events and drafts all three parts; Save writes them to the plan. If a content block ' +
             'changes after the greeting is saved, the card and its tile say so and Compile waits until it is ' +
             'saved again or kept.\n\n' +
             'Before you click, the tiles run 206\u2019s own three tests on every block (its type, ' +
             'its design, its content), open every link from its record, and check ads, events, ' +
             'listings, the greeting and delivery. A red tile names every problem. Correct fixes it ' +
             'right here in a small window; Open \u2026 goes to the tab where that choice is made.\n\n' +
             'Green means 206 confirmed the save. Red names the stage that stopped ' +
             'and why. Amber means there was no clear answer: check the issue before ' +
             'compiling again.',
      scenarios: [{ name: '206 \u00b7 Modular newsletter compiler', note: 'v1.44+, answers this view in JSON' },
                  { name: 'G \u00b7 Studio Read/Write', note: 'v6, updateAsset for article, listing, event, ad (Correct)' },
                  { name: '124 \u00b7 PubPlan Block Writer', note: 'designs, approvals, send settings' },
                  { name: '122 \u00b7 IPP Writing', note: 'the greeting' },
                  { name: 'B \u00b7 Conditioner', note: 'picture uploads' }],
      companions: 'ipp-publish-v2.23.css \u00b7 ipp-shell v1.27 \u00b7 ix-modals \u00b7 ix-success-toast \u00b7 pathways: ix-issue-data v1.0.76 /plan-board (publish block, holds; Setup counts four), /links, /media, /link-check, /email-html, /issue-check (wouldStop), Scenario 124 webhook (op nlmeta), Scenario 206 webhook (Compile) \u00b7 ipp-revenue v1.6.5 (IPPRevenue.gate, goTo) \u00b7 ipp-picker v1.55+ (data-slot-key tiles)'
    });
  }

  function parse(raw) {
    if (!raw) return null;
    try { var o = JSON.parse(raw); return (o && typeof o === 'object') ? o : null; }
    catch (e) { return null; }
  }

  // The render Worker's own answer for one surface, as plain lines.
  function surfaceLines(obj, http, label) {
    if (obj && obj.missing && obj.missing.length) {
      return ['These required values are empty: ' + obj.missing.join(', ') + '.'];
    }
    if (obj && obj.problems && obj.problems.length) return obj.problems.slice();
    if (obj && obj.error) return [String(obj.error)];
    if (http && http !== 200) return ['The ' + label + ' render did not answer (HTTP ' + http + ').'];
    return [];
  }

  function stopLines(o) {
    if (o.stage !== 'render') return [o.message || 'No reason was given.'];
    var em = surfaceLines(o.email, o.emailHttp, 'email');
    var wb = surfaceLines(o.web, o.webHttp, 'web');
    var out = [];
    em.forEach(function (l) { out.push(wb.indexOf(l) !== -1 ? l : 'Email: ' + l); });
    wb.forEach(function (l) { if (em.indexOf(l) === -1) out.push('Web: ' + l); });
    return out.length ? out : ['The render stopped without a reason.'];
  }

  function b64ToText(b64) {
    var bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (var k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
    return new TextDecoder('utf-8').decode(bytes);
  }

  // ── result rendering ─────────────────────────────────────────
  function sizeMeter(o) {
    var bytes = Number(o.emailBytes), limit = Number(o.emailLimit);
    if (!bytes || !limit) return '';
    var over = bytes > limit;
    var pct = Math.min(100, Math.round(bytes / limit * 100));
    return '<div class="ipp-pub-meter' + (over ? ' is-over' : '') + '">' +
             '<div class="ipp-pub-meter-bar"><span style="width:' + pct + '%"></span></div>' +
             '<div class="ipp-pub-meter-label">Email ' + esc(o.emailSizeKb != null ? o.emailSizeKb : kb(bytes)) +
               ' of ' + esc(Math.round(limit / 1024)) + ' KB</div>' +
           '</div>';
  }

  function showResult(kind, html) {
    var box = document.querySelector('[data-publish-result]');
    if (!box) return;
    box.className = 'ipp-pub-result is-' + kind;
    box.innerHTML = html;
    box.hidden = false;
  }

  // v2.7 — a confirmed compile is shown in the panel's Last compile
  // section (size, blocks, links); only a warning gets its own box.
  function renderOk(o) {
    state.result = o;
    var lines = [];
    var limit = Number(o.emailLimit), bytes = Number(o.emailBytes);
    if (limit && bytes > limit) {
      lines.push('The email is over ' + Math.round(limit / 1024) + ' KB. Gmail clips at about 102 KB, ' +
                 'so readers may see "View entire message". Trim a block, then compile again.');
    }
    var left = Number(o.blocksInPlan) - Number(o.blocks);
    if (left > 0) {                                                  // v2.21 (D2): name each one from the board
      var b = boardData(), outs = ((b && b.slots) || []).filter(leftOut);
      if (outs.length) lines.push(plural(left, 'block') + ' of ' + o.blocksInPlan + ' left out of the email: ' +
        outs.map(function (s) { return cap(tileName(s)) + ': ' + String(s.compile.why || 'compile skipped it').replace(/\.$/, ''); }).join('; ') + '.');
      else lines.push(plural(left, 'block') + ' of ' + o.blocksInPlan + ' left out of the email, but the board here shows none. Reload the page, then compile again.');
    }
    var box = document.querySelector('[data-publish-result]');
    if (!lines.length) { if (box) { box.hidden = true; box.innerHTML = ''; } return; }
    showResult('unclear', '<p class="ipp-pub-result-head">Compiled, with ' + (lines.length === 1 ? 'a warning' : 'warnings') + '</p>' +
      '<ul class="ipp-pub-warn">' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>');
  }

  function renderStop(o, httpStatus) {
    var lines = stopLines(o);
    showResult('stop',
      '<p class="ipp-pub-result-head">' + esc(STAGE[o.stage] || 'Stopped') + '</p>' +
      '<ul class="ipp-pub-problems">' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
      '<p class="ipp-pub-result-sub">' +
        (o.stage === 'publish'
          ? 'The email and web page were saved. Publish the NEWSLETTER item in Webflow, or compile again.'
          : 'Nothing was saved. Fix what is named above, then compile again.') +
        (httpStatus ? ' <span class="mono">HTTP ' + esc(httpStatus) + '</span>' : '') +
      '</p>');
    return lines;
  }

  function renderUnclear(reason) {
    showResult('unclear',
      '<p class="ipp-pub-result-head">No clear answer from 206</p>' +
      '<p class="ipp-pub-result-sub">' + esc(reason) + '. The issue may or may not have been compiled. ' +
      'Open the web page or check Make before compiling again.</p>');
  }

  // v1.3 — the button's look after a result.
  function setButton(btn, compiled) { drawBoard(); }                        // v2.46: the header draws the button from the state

  function setStatus(text) {
    var s = document.querySelector('[data-publish-status]');
    if (s) s.textContent = text || '';
  }

  // ── pre-check (v1.4) ─────────────────────────────────────────

  // ── frame ────────────────────────────────────────────────────
  function frame(view) {                                                   // v2.20: one view at a time
    view = view || 'publish';
    var b = blockers(), dist = view === 'distribution', cx = view === 'compile';   // v2.22: three views
    var head = dist
      ? '<div class="ipp-pub-head"><p class="ipp-pub-kicker">After publish</p>' +                                            // HC-P-GI1-2
        '<div class="ipp-pub-titlerow"><h2 class="ipp-pub-title">Distribute this Issue</h2>' + infoBadge() + '</div></div>'
      : cx
      ? '<div class="ipp-pub-back" data-publish-back hidden><button type="button" class="ix-revert" data-cx-back>' + HX.back + '</button></div>' +   // v2.47: small, above the title, never first
        '<div class="ipp-pub-head"><p class="ipp-pub-kicker">Final step</p>' +                                               // HC-P-PUB22-1
        '<div class="ipp-pub-titlerow"><h2 class="ipp-pub-title" data-publish-title>' + HX.pageTitle + '</h2>' + infoBadge() + '</div></div>'
      : '<div class="ipp-pub-head"><p class="ipp-pub-kicker">Before compile</p>' +                                           // HC-P-PUB22-1
        '<div class="ipp-pub-titlerow"><h2 class="ipp-pub-title">Send Setup</h2>' + infoBadge() + '</div></div>';
    if (b.length) {
      return head + '<div class="ipp-pub-card ipp-pub-blocked"><p class="ipp-pub-blocked-head">' + (dist ? 'Cannot distribute yet' : cx ? 'Cannot compile yet' : 'Cannot set up the send yet') + '</p><ul class="ipp-pub-list">' +
        b.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    }
    var cur = curTab(view), pane = function (k, inner, extra) { return '<div class="ipp-pub-card ipp-pub-pane' + (extra ? ' ' + extra : '') + '" data-pane="' + k + '" role="tabpanel"' + (cur === k ? '' : ' hidden') + '>' + inner + '</div>'; };
    if (dist) return head + '<div class="ipp-pub-card ipp-pub-pane" data-pane="vendor"><div data-publish-vendor></div></div>';   // v2.49: one surface, no tabs
    if (!cx) return head +                                                   // v2.22: Send Setup alone, no bar
      '<div class="ipp-pub-card ipp-pub-pane" data-pane="setup"><p class="ipp-pub-sub">How this issue goes out to readers: what their inbox shows, who receives it, and when. Everything here is required before Compile.</p>' +
        '<div data-publish-setup>' + setupCardHtml() + '</div></div>';
    if (!stepOpen('compile')) return head +                                  // v2.22: Send Setup first
      '<div class="ipp-pub-card ipp-pub-blocked"><p class="ipp-pub-blocked-head">' + esc(lockWhy('compile')) + '</p>' +
      '<p class="ipp-pub-sub">Compile builds the email and the web page from this plan. It needs the subject line, the audience and the send time before it can run.</p>' +
      '<p><button type="button" class="ix-btn ix-btn--secondary" data-pub-go="setup">Open Send Setup</button></p></div>';
    return head +
      pane('compile',
        '<div class="ipp-cx-head" data-publish-head>' +                        // v2.46: three fixed rows (S6 canvas)
          '<div class="ipp-cx-status" data-publish-status-row></div>' +
          '<nav class="ipp-cx-secs" data-publish-secs aria-label="Sections"></nav>' +
          '<div class="ipp-cx-stamp" data-publish-stamp></div>' +
        '</div>' +
        '<div class="ipp-pub-result" data-publish-result hidden></div>' +
        '<div class="ipp-cx-board" data-publish-board></div>' +
        '<div class="ipp-cx-confirm" data-publish-confirm hidden></div>',       // v2.47: the Confirmation in place of the board; the Last compile band is gone (the stamp row has it)
        'ipp-cx-pane');
  }

  // ── pre-check ────────────────────────────────────────────────
  function checkBox() { return document.querySelector('[data-publish-board]'); }
  function goBtn() { return document.querySelector('[data-publish-go]'); }
  function setGoEnabled(on) { var b = goBtn(); if (b && !state.running) b.disabled = !on; }   // v2.46: unused; the header draws the button
  function runCheck() {
    var i = ids();
    if (blockers().length || state.checking) return;
    if (!checkUrl()) { state.lastCheck = { status: 0, body: null, error: 'Pre-check not set up on this page (PP_WEBHOOKS.issueCheck).' }; refreshAll(); return; }
    state.checking = true; refreshAll();
    var url = checkUrl() + (checkUrl().indexOf('?') === -1 ? '?' : '&') + 'contextNlId=' + encodeURIComponent(i.nlId) + '&parentId=' + encodeURIComponent(i.pubplanId);
    fetch(url, { method: 'GET', credentials: 'omit' })
      .then(function (res) { return res.text().then(function (t) { return { status: res.status, body: parse(t) }; }); })
      .then(function (r) { state.checking = false; state.lastCheck = r; state.stopped = !!(r.body && r.body.ok === true && r.body.wouldStop); afterCheck(); })
      .catch(function (e) { state.checking = false; state.lastCheck = { status: 0, body: null, error: String(e && e.message || e) }; afterCheck(); });
  }
  // v2.54 — scroll a Picker tile into view and light it for a moment (the Picker draws [data-slot-key]).
  function goToSlot(slotId) {
    var cssq = function (v) { return window.CSS && CSS.escape ? CSS.escape(v) : v; };
    var el = document.querySelector('[data-slot-key="' + cssq(slotId) + '"]');
    if (!el) return;
    try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { try { el.scrollIntoView(); } catch (e2) {} }
    el.classList.add('ipp-cx-lit'); setTimeout(function () { el.classList.remove('ipp-cx-lit'); }, 2200);
  }
  function afterCheck() {
    refreshAll();
    if (compileDone() && !state.links) runLinkCheck(false);
  }

  function compile(btn) {
    if (state.running || state.stopped) return;
    if (released()) { IxToast.show('This issue is released', 'info', { detail: 'Unlock it to compile again.' }); return; }   // v2.46
    var cb = compileBlockers();
    if (cb.bad || cb.wait || !setupGate().ok) { refreshAll(); return; }   // v2.0 never compile past the board
    var i = ids();
    if (blockers().length) return;
    state.running = true;
    var clickAt = Date.now();
    var key = 'ipp-publish:compile:' + i.nlId;
    if (state.emailUrl) { try { URL.revokeObjectURL(state.emailUrl); } catch (e) {} state.emailUrl = ''; }
    var box = document.querySelector('[data-publish-result]');
    if (box) box.hidden = true;
    drawBoard();                                                             // v2.46: the header shows Compiling… and the status line
    setStatus('Building the email and web page. Usually under 10 seconds.');

    IxToast.submit({
      url: hook(),
      method: 'GET',
      body: { contextNlId: i.nlId, parentId: i.pubplanId, respond: 'json' },
      sent: { nlId: i.nlId },
      button: btn,
      busyLabel: 'Compiling\u2026',
      silent: true,
      timeoutMs: TIMEOUT_MS,
      key: key
    }).then(function (r) {
      state.running = false;
      setStatus('');
      setTimeout(runCheck, 0);   // v1.4: refresh the pre-check after every result
      var o = parse(r.raw);

      // Stopped: 206 answered with a reason.
      if (o && o.ok === false) {
        var lines = renderStop(o, r.httpStatus);
        setButton(btn, false); if (confirmShown()) drawConfirm();   // v2.19
        IxToast.show(STAGE[o.stage] || 'Compile stopped', 'err', { key: key, detail: lines[0] });
        return;
      }

      // Answered ok: prove it before saying so.
      if (r.status === 'ok' && o && o.ok === true) {
        var written = Date.parse(o.written || '');
        if (isNaN(written) || written < clickAt - CLOCK_SLACK_MS) {
          renderUnclear('206 answered, but the save time it sent is older than this click');
          setButton(btn, false);
          IxToast.show('Compile not confirmed', 'unverified', { key: key,
            detail: 'The save time is older than this click. Check the issue before relying on it.' });
          return;
        }
        if (o.emailHtmlB64) {
          try {
            state.emailUrl = URL.createObjectURL(new Blob([b64ToText(o.emailHtmlB64)], { type: 'text/html' }));
          } catch (e) { state.emailUrl = ''; }
        }
        renderOk(o);
        state.compiledOk = true;                                  // v2.0
        state.links = null;                                        // v2.46: the old links never stamp the new compile
        writeCompileStamp(o).then(function () {                   // v2.46: compile{at,basisAt,basisSig,kb}; reloads the board
          runLinkCheck(true);                                      // every link in the new email
          refreshAll(); if (confirmShown()) drawConfirm();   // v2.19
        });
        IxToast.show('Compiled ' + (o.issue || i.issue || ''), 'ok', { key: key });
        return;
      }

      // Anything else: no proof either way.
      var why = r.status === 'failed'
        ? 'The request failed' + (r.httpStatus ? ' (HTTP ' + r.httpStatus + ')' : '')
        : /timed out/.test(r.reason || '')
          ? 'No answer came back within ' + Math.round(TIMEOUT_MS / 1000) + ' seconds'
          : '206 answered, but not in a form this page can read';
      renderUnclear(why);
      setButton(btn, false); if (confirmShown()) drawConfirm();   // v2.19
      IxToast.show('Compile not confirmed', 'unverified', { key: key,
        detail: 'Check the issue before compiling again.' });
    });
  }

  // ── mount ────────────────────────────────────────────────────

  // ── mount ────────────────────────────────────────────────────
  function canvas(view) { return document.querySelector('.ipp-view[data-view="' + (view || 'publish') + '"] .ipp-canvas'); }
  function redraw(view) {
    view = view || 'publish';
    var c = canvas(view); if (!c) return;
    c.innerHTML = frame(view);
    if (view === 'compile') drawBoard();                                   // v2.22: the board lives on Compile
    showPane(curTab(view));
  }
  function mount(view) {                                                   // v2.20: 'publish' or 'distribution'; v2.22: or 'compile'
    if (typeof view !== 'string') view = 'publish';
    var c = canvas(view);
    if (!c) return false;
    if (c.getAttribute(MOUNTED) === '1') return true;
    c.setAttribute(MOUNTED, '1');
    redraw(view);
    if (view === 'compile') { runCheck(); runLinks(false); }               // v2.22
    c.addEventListener('click', function (e) {
      var t = e.target, el;
      if (!t.closest) return;
      if ((el = t.closest('[data-pub-tab]'))) { e.preventDefault(); openStep(el.getAttribute('data-pub-tab')); return; }
      if ((el = t.closest('[data-publish-go]'))) { e.preventDefault(); compile(el); return; }
      if ((el = t.closest('[data-cx-nav]'))) { e.preventDefault(); var nk = el.getAttribute('data-cx-nav'); CX.open = CX.open === nk ? '' : nk; CX.review = false; drawBoard(); return; }   // v2.47: a cell opens its section's checks under the header; again closes them
      if ((el = t.closest('[data-cx-back]'))) { e.preventDefault(); CX.review = false; drawReview(); return; }   // v2.47
      if ((el = t.closest('[data-publish-recheck]'))) { e.preventDefault(); state.links = null; runCheck(); runLinks(true); return; }
      if ((el = t.closest('[data-cor]'))) { e.preventDefault(); openCor(FIXES[Number(el.getAttribute('data-cor'))]); return; }   // v2.33: the greeting is on its own tab
      if ((el = t.closest('[data-pub-go]'))) {
        e.preventDefault(); var g = el.getAttribute('data-pub-go'), slot = el.getAttribute('data-pub-slot') || '';
        if (STEPS.some(function (x) { return x.key === g; })) { openStep(g); return; }   // v2.20: confirm from Distribution's locked card; v2.22: any step
        if (slot && g === 'revenue' && window.IPPRevenue && typeof IPPRevenue.goTo === 'function') { IPPRevenue.goTo(slot); return; }   // v2.54
        var tab = document.querySelector('.ipp-switcher button[data-view="' + g + '"]'); if (tab) tab.click();
        if (slot) setTimeout(function () { goToSlot(slot); }, 250);                                   // v2.54: light the tile on the Picker
        return;
      }
      if ((el = t.closest('[data-cx-unlock]'))) { e.preventDefault(); openUnlock(); return; }   // v2.46
      if ((el = t.closest('[data-cx-review]'))) {                           // v2.47: Review and release opens the Confirmation in place of the board
        e.preventDefault(); if (!stepOpen('confirm')) { IxToast.show(lockWhy('confirm'), 'info'); return; }
        CX.review = true; CX.open = ''; drawReview(); var f0 = c.querySelector('[data-publish-confirm] input'); if (f0) f0.focus({ preventScroll: true });
        return;
      }

      if ((el = t.closest('[data-sec-del]'))) { e.preventDefault(); var sl0 = sectorList(curVal('sectors')); sl0.splice(Number(el.getAttribute('data-sec-del')), 1); setDraft('sectors', sl0.join('; ')); drawSetup(); refreshAll(); return; }   // v2.3
      if ((el = t.closest('[data-sec-add]'))) { e.preventDefault(); addSector(); return; }
      if ((el = t.closest('[data-em-save]'))) { e.preventDefault(); setupSave(); return; }
      if ((el = t.closest('[data-em-cancel-all]'))) { e.preventDefault(); EM.draft = {}; EM.seeded = {}; EM.fails = {}; EM.note = ''; drawSetup(); refreshAll(); if (confirmShown()) drawConfirm(); return; }   // v2.19: the Done link comes back
      if ((el = t.closest('[data-em-cancel]'))) { e.preventDefault(); var k = el.getAttribute('data-em-cancel'); delete EM.draft[k]; delete EM.seeded[k]; delete EM.fails[k]; EM.note = ''; drawSetup(); refreshAll(); if (confirmShown() && !changedKeys().length) drawConfirm(); return; }   // v2.19
      if ((el = t.closest('[data-cf-edit]'))) { e.preventDefault(); CF.edit = true; drawConfirm(); var f1 = c.querySelector('[data-pane="confirm"] [data-em-field="subject"]'); if (f1) f1.focus(); return; }   // v2.19
      if ((el = t.closest('[data-cf-edit-close]'))) { e.preventDefault(); if (changedKeys().length) { IxToast.show('Save or cancel the changes first', 'info'); return; } CF.edit = false; drawConfirm(); return; }   // v2.19
      if ((el = t.closest('[data-cf-go]'))) { e.preventDefault(); if (CF.ticks.every(Boolean)) { if (noWeatherCompile()) openWxAsk(); else setRelease(true); } return; }   // v2.59: the weather question first
      if ((el = t.closest('[data-cf-withdraw]'))) { e.preventDefault(); openUnlock(); return; }   // v2.46: Unlock is the one way back
      if ((el = t.closest('[data-vd-copy]'))) { e.preventDefault(); copyText(el.getAttribute('data-vd-copy')); return; }
      if ((el = t.closest('[data-vd-download]'))) { e.preventDefault(); downloadHtml(); return; }
      if ((el = t.closest('[data-vd-sent]'))) { e.preventDefault(); openSentDialog(); return; }                                   // v2.47: the Mark as sent acknowledgement
      if ((el = t.closest('[data-vd-open]'))) { e.preventDefault(); var ok0 = el.getAttribute('data-vd-open'); VS.open = VS.open === ok0 ? '' : ok0; drawSim(); return; }   // v2.47: the To / CC drop-down
      if ((el = t.closest('[data-vd-reset]'))) { e.preventDefault(); if (el.getAttribute('data-vd-reset') === 'to') VS.to = null; else VS.cc = null; VS.open = ''; drawSim(); return; }
      if ((el = t.closest('[data-vd-drop]'))) { e.preventDefault(); var dp = el.getAttribute('data-vd-drop').split(':'), dk0 = dp[0], de = dp.slice(1).join(':'); var dl = addrPicked(dk0).filter(function (x) { return x !== de; }); if (dk0 === 'to') VS.to = dl; else VS.cc = dl; drawSim(); return; }
      if (t.closest('.vd-dd')) return;                                                                                              // clicks inside the open list are handled on change
      if (VS.open && !t.closest('.vd-pick')) { VS.open = ''; drawSim(); }
      if ((el = t.closest('[data-vs-save]'))) {
        e.preventDefault(); var pt = {}; vsChanged().forEach(function (k) { pt[k] = VS.draft[k] || null; });
        saveVendorState(pt).then(function (ok) { if (ok) { VS.draft = {}; VS.note = ''; IxToast.show('Vendor status saved', 'ok'); drawSim(); } }); return;
      }
      if ((el = t.closest('[data-vs-cancel-all]'))) { e.preventDefault(); VS.draft = {}; VS.note = ''; drawSim(); return; }
      if ((el = t.closest('[data-vs-cancel]'))) { e.preventDefault(); delete VS.draft[el.getAttribute('data-vs-cancel')]; VS.note = ''; drawSim(); return; }
      if ((el = t.closest('[data-publish-view-email]'))) { e.preventDefault(); viewHtml(); return; }                 // v2.21 (D12)
      if ((el = t.closest('[data-publish-download-email]'))) { e.preventDefault(); downloadHtml(); return; }         // v2.21 (D12)
    });
    c.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute && t.hasAttribute('data-vs-tick')) {                    // v2.1
        var vk = t.getAttribute('data-vs-tick'), want = t.checked ? (vsSaved(vk) || new Date().toISOString()) : '';
        if (!!want === !!vsSaved(vk)) delete VS.draft[vk]; else VS.draft[vk] = want;
        VS.note = ''; drawSim(); return;
      }
      if (t.hasAttribute && t.hasAttribute('data-vd-pick')) {                 // v2.47: tick an address in the To / CC list; the pick stays as a chip
        var pp = t.getAttribute('data-vd-pick').split(':'), pk = pp[0], pe = pp.slice(1).join(':'), pl = addrPicked(pk).filter(function (x) { return x !== pe; });
        if (t.checked) pl.push(pe);
        if (pk === 'to') VS.to = pl; else VS.cc = pl;
        drawSim(); return;
      }
      if (t.hasAttribute && t.hasAttribute('data-cf-tick')) { CF.ticks[Number(t.getAttribute('data-cf-tick'))] = t.checked; var go = c.querySelector('[data-cf-go]'); if (go) go.disabled = !CF.ticks.every(Boolean) || CF.saving; return; }
      if (t.hasAttribute && t.hasAttribute('data-em-when')) onSetupInput(t);
    });
    c.addEventListener('input', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-em-field')) onSetupInput(e.target); });
    c.addEventListener('focusout', function (e) {
      if (!e.target.hasAttribute || !e.target.hasAttribute('data-em-field') || EM.drawing) return;
      setTimeout(function () { var a = document.activeElement; if (a && a.closest && a.closest('[data-publish-setup]')) return; drawSetup(); }, 0);
    });
    c.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.hasAttribute && e.target.hasAttribute('data-sec-new')) { e.preventDefault(); addSector(); return; }   // v2.3
      if (e.key === 'Enter' && e.target.hasAttribute && e.target.hasAttribute('data-em-field')) { e.preventDefault(); setupSave(); }
    });
    return true;
  }

  document.addEventListener('ipp:view', function (e) {
    var view = e.detail && e.detail.view;
    if (view !== 'publish' && view !== 'distribution' && view !== 'compile') return;
    var c = canvas(view); if (!c) return;
    if (c.getAttribute(MOUNTED) !== '1') { mount(view); return; }
    if (view === 'distribution' || view === 'publish') { redraw(view); return; }   // v2.20: no board or links to run; v2.22: Send Setup too
    if (state.running) return;
    var box = document.querySelector('[data-publish-result]');
    if (box && !box.hidden) { refreshAll(); return; }
    redraw('compile'); runCheck(); if (!state.rl || state.rl.error) runLinks(false);   // v2.23: the Compile view, not Send Setup
  });
  document.addEventListener('ipp:board', function () {
    if (!document.querySelector('.ipp-canvas[' + MOUNTED + '="1"]') || EM.saving || CF.saving) return;   // v2.25: any mounted canvas (the tab bar is Distribution's only now)
    var a = document.activeElement, typing = a && a.closest && a.closest('[data-publish-setup]');
    if (!typing) drawSetup();
    refreshAll();
    if (confirmShown() && !typing) drawConfirm();   // v2.19: a draft on Confirmation is not redrawn away; v2.22: it sits under Compile
    if (canvas('distribution') && canvas('distribution').getAttribute(MOUNTED) === '1') showPane(curTab('distribution'));   // v2.20
    if (canvas('compile') && canvas('compile').getAttribute(MOUNTED) === '1') showPane('compile');                            // v2.22: Confirmation appears when it unlocks
    corRedraw();
  });
  document.addEventListener('ipp:revenue-gate', function () { if (!state.running) refreshAll(); });
  document.addEventListener('ipp:ready', function () { mount('publish'); mount('compile'); if (shellView() === 'distribution') mount('distribution'); });   // v2.22: Compile mounts with Send Setup so every selector resolves
  if (document.querySelector('[data-ipp-root]')) { mount('publish'); mount('compile'); }

  window.IppPublish = { version: VERSION, setupGate: setupGate, board: boardModel, revenueGate: revenueGate, vendorBody: vendorBody, links: function () { return state.rl; } };
})();
