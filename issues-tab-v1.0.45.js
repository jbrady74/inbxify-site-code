// issues-tab-v1.0.45.js
// v1.0.45 (Reserved Tiles Build S3 · 23 Oct 2026): REFRESH SENDS ITS OWN ROW LIST. Scenario 126 v2.11 no
//   longer reads the plan from the Data Worker (Make would not accept that module, so 126 could not be
//   switched on). The page already reads the plan and checks it before asking (HC-P-RT-3); it now sends
//   what it read: rowIds (the ids of the blocks it saw, comma separated) and planName (for the new blocks'
//   names). 126 deletes exactly those rows, refuses when the list does not match expectRows, and lays the
//   Default Layout down. The eligibility check therefore runs here only, a moment before the request
//   (ruling asked in S3). The read-back after the refresh (TOAST-TRUTH) is unchanged. Also: a note's
//   Close link sits on its own line, flush with the note's text (it was indented a few pixels).
//   Pairs issues-tab-v1.0.23.css. Needs Scenario 126 v2.11.
//
// ============================================================
// v1.0.44 — FUTURE PLANS FOLD, AND REFRESH SLOTS (Reserved Tiles Build S3 · 22 Oct 2026)
//
//   RT-10. In Planning keeps its soonest-first order, but only plans that
//   send (or, with no send time, publish) within the next 21 days show
//   open. The rest sit under a "Future plans · N" fold, closed when the
//   tab opens; one click opens it, one closes it (HC-P-RT-2, FUTURE_DAYS).
//   A plan with no date at all stays open, so it is never hidden.
//
//   RT-12. Every In Planning and Future plan tile has a small "Refresh
//   slots" link (only when TA_CONFIG.makeAddIssue, the 126 webhook, and
//   TA_CONFIG.planList are set). The link checks first, then asks:
//     1. The page reads that plan through the Data Worker's /plan-board
//        (fresh). A plan qualifies only when no block holds an article,
//        an ad, a reserved print item (allocation), a list or a note,
//        and the plan is not locked (HC-P-RT-3). A plan that does not
//        qualify says why on the tile, in a note with Close; nothing is
//        sent.
//     2. A plan that qualifies opens the tile's confirm box: "Refresh
//        slots from the Default Layout? The N empty blocks on WLN-988A
//        are deleted and the title's Default Layout is laid down again.
//        Nothing is lost: none of them holds anything." Refresh slots /
//        Cancel. Cancel puts the tile back exactly as it was.
//     3. Refresh sends 126 op=refresh with the plan id, the title id and
//        the row count the page saw (expectRows). 126 checks again,
//        deletes the rows, lays the Default Layout down, and answers
//        { ok, deleted, created }; a refusal answers { ok:false, error }.
//     4. TOAST-TRUTH: the page reads the plan again (fresh) and says done
//        only when none of the old rows remain and the new row count is
//        what 126 says it created. Green toast fades; any failure stays
//        on the tile in a red note with Close.
//   The /plan-board address is TA_CONFIG.planBoard when set, else
//   TA_CONFIG.planList with /plans swapped for /plan-board
//   (HC-P-IT44-2, the reverse of HC-P-PK50-1).
//   NEW KEY (optional)  TA_CONFIG.planBoard.
//   Pairs issues-tab-v1.0.22.css (.it-future fold, .it-rf link and
//   notes). Needs Scenario 126 with the op=refresh route (contract in
//   the S3 closure) and ix-issue-data v1.0.75.
//   HARDCODING: HC-P-RT-2 FUTURE_DAYS 21; HC-P-RT-3 the eligibility rule
//   (page and 126 both apply it, by design); HC-P-IT44-1 the English words
//   of the fold and the Refresh flow; HC-P-IT44-2 the address swap.
// ──────────────────────────────────────────────────────────
//
// v1.0.43 — TWO DATES ON A TILE (106 Gap Interview S3 · 19 Oct 2026)
//
//   Ruled by Jeff: the publication date on the plan is the masthead date
//   and does not change; the send time lives on the edition's newsletter
//   and can. Both are shown. WLN-901A read "Sunday, October 18 · Date has
//   passed" after Send Setup moved the send to Oct 21.
//   - The Worker's /plans (ix-issue-data v1.0.65) answers sendAt per
//     plan; S.send keeps it by plan id.
//   - An In Planning tile shows, under the publication date, a line
//     "Sends Wed, Oct 21, 9:45 PM" when the time is known. The relative
//     line ("in 2 days", "Date has passed") follows the send time when
//     there is one and the publication date otherwise, and reads "Send
//     time has passed" in the first case.
//   - Nothing else changed. Archive tiles are as before.
//   Pairs with issues-tab-v1.0.20.css (.it-send).
//
// ---- v1.0.42 header follows ----
// issues-tab-v1.0.42.js
// ============================================================
// v1.0.42 — COMPILE SAYS HOW MUCH IS LEFT TO FIX (IPP Build S20 · step 2)
//
//   Ruled 16 Oct (Jeff): the pill read "Compile" while the Publish page
//   showed 13 red tiles. Now the Worker (ix-issue-data v1.0.60) answers
//   the page's last pre-check count as the compile step's n (of null),
//   recorded by ipp-publish v2.18 each time it checks.
//   1 · A step with n and no of prints the bare number: "COMPILE 13".
//       Zero prints "COMPILE 0". No count (never opened on Publish)
//       prints "COMPILE", as before.
//   2 · Compile with a count above zero is salmon, not gold (CSS
//       v1.0.19, .it-step--bad): things are waiting on you. Hover says
//       when it was last checked.
//   3 · The Worker now lets the newsletter's Publishing Status outrank
//       the tick fields, so a legacy plan in Next reads Ready, as its
//       band does. Nothing changes in this file for that.
//   Pairs with issues-tab-v1.0.19.css. Needs ix-issue-data v1.0.60; on
//   v1.0.59 the count is absent and the pill reads as v1.0.41 did.
// ============================================================
//
// ============================================================
// issues-tab-v1.0.41.js
// ============================================================
// v1.0.41 — THE PUBLISH STEP ON EVERY TILE (IPP Build S20, 16 Oct)
//
//   Ruled 15 Oct (Jeff): each PubPlan tile shows where the plan is on
//   the way out — Setup · Compile · Confirm · Vendor · Sent — with the
//   number that matters inside that step.
//
//   1 · One pill per In Planning tile and per Next band, under the
//       date: the current step's name, and its number when the step
//       has one (Setup 3/5 fields filled; Vendor 2/5 ticks). Compile
//       and Confirm carry no number. "Ready" means the vendor has it
//       fully set up and it goes on the send date; "Sent" is a locked
//       plan. Archive tiles already say Sent and get no pill.
//   2 · The answer comes from the Data Worker: GET TA_CONFIG.planList
//       ?titleAdminId=TA_CONFIG.taItemId (ix-issue-data v1.0.59, the
//       route the Allocator already reads) answers plans[].publish,
//       read from the same NEWSLETTER fields the IPP Publish tab reads.
//       This file holds no step rules: the pill prints what the Worker
//       answers (step, label, n, of). Hover lists every step.
//   3 · The pill is a fixed box (CSS v1.0.18): 112 × 22, never sized to
//       its text, so tiles line up. It is drawn from first paint:
//       dashed "Checking" until the Worker answers, then the step; grey
//       "No email" for a plan with no newsletter; grey "Unknown" with
//       the reason on hover when the Worker cannot be read. No
//       TA_CONFIG.planList: no pill row at all, one console warning.
//   4 · The pill reads the Worker once per page load. A Set as Next
//       redraws the tiles from the same answer (the step does not move
//       with Next). + Edition reloads the page, as before.
//   HARDCODING: HC-P-S20-3 the pill's own words ("Checking", "No email",
//       "Unknown"), en-US page copy, same class as HC-013. The step
//       names are the Worker's (HC-P-S20-1 there).
//   Pairs with issues-tab-v1.0.18.css. Needs ix-issue-data v1.0.59;
//   an older Worker answers no publish, so every pill says "No email".
// ============================================================
//
// ============================================================
// issues-tab-v1.0.40.js
// ============================================================
// v1.0.40 — A DEMOTED PLAN'S NEWSLETTER GOES BACK TO DRAFT (S8, 11 Oct)
//
//   Ruled 11 Oct (Jeff, option A): when Set as Next moves another
//   plan out of Next, that plan's newsletter goes back to Draft, so
//   Scenario 108 can never send an issue that was moved aside.
//   Scenario 107 v5 does the reset and answers resetNlIds.
//
//   1 · The confirm is a salmon warning when another plan leaves
//       Next: a bold line naming it ("WLN-998B leaves Next"), what
//       happens to it and its newsletter, then the question. The
//       tile border turns salmon while it is open. (Jeff: "has to be
//       more prominent".) With nothing else in Next it is the plain
//       confirm, as before.
//   2 · resetNlIds (107 v5) lists the newsletters it set to Draft,
//       24-character ids run together. A moved tile's newsletter is
//       shown as Draft only when its id is in that list.
//   3 · Backstop: an In Planning tile whose newsletter is Ready to
//       Publish or Publish Next as Current shows a salmon note. That
//       state should not exist under one-Next; if it does, 108 would
//       send it on its date.
//   Requires 107 v5 for 2. Pairs with issues-tab-v1.0.17.css.
// ============================================================
//
// ============================================================
// issues-tab-v1.0.39.js
// ============================================================
// v1.0.39 — ONE NEXT PER TITLE (IPP Build S8, 11 Oct)
//
//   Ruled 11 Oct (Jeff): only one plan is in Next at a time, editions
//   included. Setting a plan to Next moves any other Next plan of the
//   title back to In Planning. Scenario 107 v4 does the move.
//
//   1 · The Set as Next confirm names the planned action. When
//       another plan is Next it says which one moves back, e.g.
//       "WLN-998B is Next now and moves back to In Planning."
//   2 · 107 v4 answers titleNextIds: the ids of every plan of this
//       title that is Next after the run, read back from Webflow.
//       The page sends titleNextIds = this plan's id in `sent`, so
//       IxToast goes green only when this plan is the title's one
//       and only Next.
//   3 · On a verified answer, any other tile in Next moves back to
//       In Planning in place (no reload). The move is proven by
//       titleNextIds, not assumed.
//   Requires Scenario 107 v4. With 107 v3 the echo has no
//   titleNextIds, so the toast is amber (unverified) and nothing
//   moves. Ship both together.
//   No CSS change. Pairs with issues-tab-v1.0.16.css.
// ============================================================
//
// ============================================================
// issues-tab-v1.0.38.js
// ============================================================
// v1.0.38 — + EDITION FIXES FROM THE 998C TEST (11 Oct)
//
//   1 · Date was blank. The page's data-publication-date is not an
//       ISO date on the live site, and + Edition only read ISO. It
//       now uses the same date the board sorts by (issueDate), so the
//       default is the source's date + 7 days.
//   2 · Same-day zip check compared that same unreadable date, so it
//       could never refuse. Fixed the same way.
//   3 · Zip hint now says which case it is: the page carries no zips
//       at all (Designer binding missing) vs this edition has none
//       saved.
//   4 · A refusal now shows the Worker's own reason when 126 passes
//       it on (workerError), and the message no longer doubles
//       "Nothing was created" or ends in "..".
//   5 · A changed field keeps its gold border while the cursor is in
//       it; the blue focus ring no longer sits on top of the gold.
//
// v1.0.37 — NEXT COLOURS, SOONEST FIRST, + EDITION ON LIVE PLANS ONLY
//
//   Ruled 10 Oct (Jeff):
//   1 · Next Newsletter tiles take their colour from the linked
//       newsletter's Publishing Status (read from the newsletter list on
//       the page, data-nl-status):
//         gold         anything else (Draft): still being built
//         green        Ready to Publish: released, waiting on the vendor
//         deeper green Publish Next as Current: vendor fully set up
//       A Next plan with a Draft newsletter is normal now, so the old
//       red "newsletter did not change" state and its Retry are gone.
//   2 · Set as Next (Scenario 107) writes only the PubPlan's Next. The
//       tab no longer asks 107 to echo a newsletter status; it checks
//       planning-status and the PubPlan id only.
//   3 · In Planning sorts soonest send date first, like Next.
//       Archive stays most recent first.
//   4 · + Edition shows only on In Planning and Next tiles, never on
//       Archive (and still only on the latest edition of its issue).
//
//   TA_CONFIG needs one new label (listed in the missing-config notice
//   until it is there):
//     optionLabels.nlPublishingStatus.readyToPublish = 'Ready to Publish'
//   optionIds.nlPublishingStatus.publishNextAsCurrent is no longer read.
//   Pairs with issues-tab-v1.0.15.css.
// ============================================================
//
// v1.0.36 — EDITION LETTERS ALWAYS; + EDITION ON THE LATEST ONLY
//
//   Ruled 10 Oct (Jeff):
//   1 · + Edition shows only on the latest edition of each issue (the
//       highest letter; a plan with no letter counts as A). With WLN-998,
//       998B and 998C on the page, only 998C carries it.
//   2 · + Add PubPlan · New always names edition A: typing 122 makes
//       WLN-122A (issue-number-display 122A, edition-letter A). The
//       preview shows the A. Typing a letter yourself still works.
//       + Add PubPlan · Legacy is unchanged.
//   Plans made before this (e.g. WLN-998) keep their name; rename them
//   in Webflow if wanted (name, issue-number-display, edition-letter).
//   Pairs with issues-tab-v1.0.14.css (Set as Next sits at the right).
//   Nothing else changed from v1.0.35.
// ============================================================
//
// v1.0.35 — CLONE OFF THE TILES
//
//   Ruled 10 Oct (Jeff): a new issue starts from + Add PubPlan · New, and
//   a same-issue send is + Edition. Ads run seven days and do not carry
//   over, so copying a whole issue forward has no remaining use. The
//   Clone button is gone from every tile; + Edition is the only one.
//   The clone modal and its submit code stay in this file, unused, and
//   126 / the Worker keep the clone path, which + Edition runs on.
//   Legacy 103-CLONE (TA_CONFIG.makeClonePubplan) is no longer reachable
//   from this page.
//   Nothing else changed from v1.0.34.
// ============================================================
//
// v1.0.34 — + EDITION ON EVERY TILE
//
//   Ruled 10 Oct (Jeff): editions are added one at a time. Each one is
//   the same issue again, a week after the source or to other towns.
//   It shares the source's articles and layout; its ads, sponsors,
//   events, listings and greeting start empty (they are its own).
//
//   A "+ Edition" button sits beside Clone. It opens one small form:
//     Edition    the stem is locked (WLN-122); the letter is the next
//                one not used by any plan of that issue on this page.
//     Date       the source's date + 7 days.
//     Zip codes  the source edition's zips, from the newsletter list's
//                data-nl-zips attribute (bind it to NEWSLETTER
//                send-zip-codes). Blank when the attribute is missing.
//   Each field gets the gold dirty border once changed from what it
//   opened with; Cancel closes without writing anything.
//   Refused before anything is sent:
//     - the letter is already a plan of this issue;
//     - a zip that another edition of this issue sends on the same day
//       (a zip may repeat on different days, never twice on one day).
//   It fires Scenario 126 v2.5 (TA_CONFIG.makeCloneIssue) with the clone
//   fields plus edition=1, editionLetter and sendZipCodes. 126 writes
//   PUBLICATION PLAN edition-letter and NEWSLETTER send-zip-codes; the
//   Worker (ix-issue-data v1.0.31, /clone-rows&edition=1) empties the
//   per-edition fields. Same TOAST-TRUTH check as Clone.
//
//   + Add PubPlan · New now also sends editionLetter: the label's letter,
//   or A when the label has none (122 is edition A).
//
//   HC-P-S7-14  the +7 day default. Ruled by Jeff; a title setting later.
// ============================================================
//
// v1.0.33 — "ACTIVE" IS NOW "IN PLANNING"
//
//   Ruled 10 Oct (Jeff): the middle zone is titled "In Planning". Its
//   plans are In Progress and still being built; "Active" read as if
//   they were live. The empty Next zone's hint now says "Pick a PubPlan
//   that is In Planning and choose Set as Next." The zone itself is
//   unchanged: Planning Status In Progress (or missing). HC-013 copy.
//   Nothing else changed.
//
//
// ──────────────────────────────────────────────────────────
// v1.0.32 — THE PLAN OPENS IN THIS TAB
//
//   Ruled 9 Oct: the IPP is a sheet you open and close, not another
//   browser tab. Active and Next tiles now open the PubPlan page in the
//   same tab (they opened a new one since v1.0.18). Close plan on the
//   IPP (ipp-shell v1.12) brings you back here, to the Pub Plans tab.
//   Cmd/Ctrl-click still opens a new tab, as any link does.
//   The published NEWSLETTER on Archive tiles still opens in a new tab:
//   it is a different site, not a surface of this one.
//   Nothing else changed from v1.0.31.
// ──────────────────────────────────────────────────────────
////
//
// ──────────────────────────────────────────────────────────
// v1.0.31 — ADD · NEW: ONLY THE FIELDS 126 USES
//
//   The Add modal's Edition ("e.g. Holiday") and Name boxes are
//   Scenario 103 fields. 126 never reads them, so on the New path they
//   were blanks that did nothing and confused what to type. Add · New
//   now shows only Issue Number and Publication Date. The plan name is
//   built from them and shown in the preview ("Plan name: WLN-122A"),
//   never typed. The help line says what a letter means: a second
//   edition of the same issue.
//   Add · Legacy gets the same: Scenario 103's blueprint (read 9 Oct)
//   never reads edition or name either, so both boxes are gone from
//   both modals. The form still sends them (empty) so nothing that
//   listens breaks.
// ──────────────────────────────────────────────────────────
////
//
// ──────────────────────────────────────────────────────────
// v1.0.29 — ADD A PUBPLAN: NEW BESIDE LEGACY
//
//   + Add a PubPlan still fires Scenario 103 (TA_CONFIG.makeAddPubplan).
//   A second button fires Scenario 126 v2.3, which builds the issue's
//   NL-BLOCKS slots from the title's Default Layout, each born with its
//   design. Both coexist until the new path is trusted.
//
//   NEW KEY  TA_CONFIG.makeAddIssue   the 126 webhook (same URL as
//            makeCloneIssue).
//
//   makeAddIssue set   → header shows "+ Add PubPlan · New" and
//                        "+ Add PubPlan · Legacy".
//   makeAddIssue unset → one button, "+ Add a PubPlan", exactly as before.
//   Same modal, same fields, same TOAST-TRUTH check for both. The modal
//   title says which one is running. A refusal from 126 (name taken,
//   Webflow refused) is shown in the modal, not as a green check.
//
//   Nothing else changed from v1.0.28.
// ──────────────────────────────────────────────────────────
////
//
// ──────────────────────────────────────────────────────────
// v1.0.28 — CLONE INTO SLOTS (new model) BESIDE LEGACY CLONE
//
//   Legacy Clone (Scenario 103-CLONE, TA_CONFIG.makeClonePubplan)
//   copies the seven old picker records and writes no NL-BLOCKS, so
//   the clone opens with an empty IPP Picker. Scenario 126 v2.3 now
//   clones the new way: every slot of the source issue, contents and
//   all, into the new issue's NL-BLOCKS rows. Ended events are left
//   behind; ads come over flagged for acknowledgement.
//
//   NEW KEY  TA_CONFIG.makeCloneIssue   the 126 webhook (same URL as
//            makeAddPubplan once Add runs through 126).
//   NEW KEY  TA_CONFIG.cloneDefault     'slots' or 'legacy'. Unset =
//            'legacy', so nothing changes until it is set.
//
//   Both URLs set → the Clone modal shows a choice, "Slots" or
//   "Legacy pickers", preset from cloneDefault. One URL set → that
//   one is used, no choice shown. When legacy retires, remove
//   makeClonePubplan and the choice disappears.
//
//   A slots clone answers with what it left behind and what needs an
//   OK. The banner says so and waits for a click before refreshing,
//   so a dropped event is never reported only in passing:
//     "WLN-999 created · 2 ads to approve · 1 past event not carried
//      over: Old fair (ended 2026-10-03)"
//   Banner colour: green when there is nothing to act on, salmon when
//   there is. Verification (TOAST-TRUTH) is unchanged: the echoed
//   name, issue-number and issue-number-display must match.
//
//   Nothing else changed from v1.0.27.
// ──────────────────────────────────────────────────────────
////
// ──────────────────────────────────────────────────────────
// v1.0.27 — NEXT TILE CAN OPEN THE IPP ON A CHOSEN VIEW
//
//   v1.0.26 assumed the PubPlan page had a Webflow "Promote" tab and
//   linked with #ix-tabs=<name> (key TA_CONFIG.ippPromoteTab). It has
//   no such tab: the IPP embed switches its own views (Picker, Layout,
//   Publish), and Promote is a step inside Publish. That code is
//   REMOVED; ippPromoteTab is no longer read.
//
//   Now: set TA_CONFIG.ippNextView to 'publish' (or 'layout') and the
//   Next band's gold button links to the PubPlan page with
//   #ipp-view=<view>, which ipp-shell v1.4 opens on load. The button
//   reads "Open Publish" / "Open Layout". Unset (the default), the
//   button stays "Open PubPlan" and the page opens on Picker.
//
//   Nothing else changed from v1.0.26.
// ──────────────────────────────────────────────────────────
////
// ──────────────────────────────────────────────────────────
// v1.0.26 — THE WHOLE TILE OPENS AGAIN; PROMOTE TAB LINK
//
//   WHOLE-TILE CLICK RESTORED. Before v1.0.23 the entire card was a
//   link. v1.0.23 made only the issue code and the small icon open
//   it. Now a click anywhere on a tile or Next band opens it again,
//   except on its buttons, links and the confirm box. Destinations
//   are unchanged (v1.0.18):
//     Active / Next → PubPlan page, new tab.
//     Archive       → published newsletter, new tab; falls back to
//                     the PubPlan page, same tab.
//   A click that ends a text selection does not navigate, so the
//   code and dates can still be copied. Cmd/Ctrl-click also opens a
//   new tab. The code stays a real link for keyboard users.
//
//   PROMOTE TAB. The Next band's gold button opens the PubPlan page
//   straight on its Promote tab when TA_CONFIG.ippPromoteTab holds
//   that tab's Webflow tab name. The link carries
//   #ix-tabs=<name>, which ix-return (v1.0.1) on the PubPlan page
//   reads on load to click the tab. Button reads "Open Promote tab".
//   Without the key, the button stays "Open PubPlan", unchanged.
//
//   Needs issues-tab-v1.0.11.css (pointer cursor, hover lift).
// ──────────────────────────────────────────────────────────
////
// ──────────────────────────────────────────────────────────
// v1.0.25 — A RETRY CLEARS ITS OWN OLD MESSAGE
//
//   Set as Next now passes a per-PubPlan key to IxToast:
//     key: 'issues-tab:set-next:' + pubplanId
//   With ix-success-toast v1.0.1, a new attempt on an issue closes
//   that issue's earlier failure or "not confirmed" message before
//   it starts. Messages about other issues stay.
//
//   Harmless against ix-success-toast v1.0.0 (it ignores the key).
//   Nothing else changed from v1.0.24.
// ──────────────────────────────────────────────────────────
////
// ──────────────────────────────────────────────────────────
// v1.0.24 — OUT OF THE PUBLISHER-WRAPPER WILDCARD FOR GOOD
//
//   v1.0.23 shipped with invisible buttons: the confirm "Set as
//   Next" rendered white text on a white button, and every tile
//   background (notes, dots, the Next band) came out white.
//
//   Cause: title-admin-page-design carries
//     section.publisher-wrapper * { background-color: white !important }
//   which repaints every element inside the T-A card. v1.0.23 did
//   not follow the ix-tokens neutraliser rule, so it lost.
//
//   Fix, in title-admin-page-design-v1.4.41: the wildcard now skips
//   anything inside an element with class `ix-own`. This file puts
//   `ix-own` on its root (.it-overview). Component CSS then applies
//   normally, with no !important and no specificity games.
//
//   Also:
//     · Confirm question is a <div>, not a <p>. Webflow's site-wide
//       paragraph style (large serif) was overriding it.
//     · The confirm button is no longer auto-focused. The focus
//       ring was the blue border on the empty-looking button.
//     · The "already says Publish Next as Current" note reworded so
//       it says what is out of step and what the button does.
//
//   REQUIRES title-admin-page-design-v1.4.41.css and
//   issues-tab-v1.0.10.css. Ship all three together.
// ──────────────────────────────────────────────────────────
////
// ──────────────────────────────────────────────────────────
// v1.0.23 — THREE ZONES: NEXT NEWSLETTER · ACTIVE · ARCHIVE
//
//   Redesigned tiles, from Pub Plans tile review v0.1 (accepted
//   2026-09-25). Paired with issues-tab-v1.0.9.css and Scenario
//   107 blueprint v2. Ship all three together.
//
//   ZONES, top to bottom:
//     Next Newsletter  Planning Status = Next. Teal band per issue.
//                      More than one is allowed (segmented sends).
//                      Soonest first. Empty state when none.
//     Active           Planning Status = In Progress, or blank, or
//                      anything unrecognised. Latest first.
//     Archive          Planning Status = Locked. Latest 8, then a
//                      "Show all" link. Hidden when empty.
//
//   "PROMOTE TO NEXT" IS NOW "SET AS NEXT". The IPP Promote tab
//   keeps the word Promote for the full hand-off (Mailchimp,
//   Nexstar order, HTML attachment).
//
//   SET AS NEXT, step by step:
//     1. Click opens a question inside the tile, gold border,
//        with a Cancel link that puts the tile back. Escape also
//        cancels. The browser confirm() box is gone.
//     2. Confirm fires Scenario 107 with the PubPlan ID added to
//        the payload. The tile shows "Setting…" until 107 answers.
//     3. 107 v2 writes NEWSLETTERS.publishing-status = Publish
//        Next as Current AND PUBLICATION PLAN.planning-status =
//        Next, then echoes both plus the PubPlan ID.
//     4. IxToast checks all three. Green: the tile moves to Next
//        in place, no reload. Amber: the tile stays in Active and
//        says "not confirmed". Red: the tile goes back to ready.
//     No other Next issue is touched. Several can be Next at once.
//
//   THE CHECK MARK ON EVERY PAGE LOAD. A Next tile reads its
//   newsletter's own status from the hidden newsletter-source list
//   (.newsletter-source [data-nl-id] → data-nl-status), joined on
//   the PubPlan's data-newsletter-id. No new Designer binding.
//     ✓ green  data-nl-status equals the configured label
//     ✗ red    it holds anything else, or no newsletter is linked.
//              Retry fires 107 again.
//     ? grey   the newsletter is not in this page's list, or the
//              label is not configured. We do not claim either way.
//
//   NO LITERALS. Every option label and ID comes from TA_CONFIG:
//     optionIds.planningStatus.next          (sent-vs-echo check)
//     optionIds.nlPublishingStatus.publishNextAsCurrent
//     optionLabels.planningStatus.{inProgress,next,locked}
//     optionLabels.nlPublishingStatus.publishNextAsCurrent
//   The v1.0.20 key optionIds.publishStatus.publishNextAsCurrent is
//   no longer read. publishStatus holds the ARTICLES field (Draft /
//   Live); the NEWSLETTERS option now has its own group. A missing
//   key shows a visible notice at the top of the tab and the action
//   that needs it refuses. It never falls back to a guess.
//
//   HC-014 RETIRED. Zone sorting no longer compares hardcoded
//   labels. It reads TA_CONFIG.optionLabels.planningStatus and also
//   accepts the option IDs, case-insensitive.
//
//   HC-017 CORRECTED. The old entry said the Scenario 107 URL was
//   a PLACEHOLDER bare constant in this file. Stale since v1.0.22:
//   the URL lives in TA_CONFIG.makePromoteNext. Exposure of the
//   URL's CDN history is tracked as HC-049, not here.
//
//   STALE COMMENT REMOVED. The promote section said 107 answers
//   with a 302 redirect. It answers with a JSON echo (v1.0.19 on).
//
//   TILE MARKUP. Cards are no longer one big <a> wrapping buttons.
//   Each tile is an <article>; the issue code is the link (and the
//   small open icon). Destinations are unchanged from v1.0.18:
//     Active / Next → PubPlan page, new tab.
//     Archive       → published newsletter, new tab; falls back to
//                     the PubPlan page, same tab.
//
//   SCROLL. Every re-render restores the window position. Clicking
//   a control never jumps the view.
//
//   Add a PubPlan and Clone are unchanged from v1.0.22 byte for
//   byte, apart from Clone's button copy ("Clone", no arrow) and
//   its new visual class. Its data attributes and handler are the
//   same.
// ──────────────────────────────────────────────────────────
//
// ──────────────────────────────────────────────────────────
// v1.0.22 — THREE WEBHOOK URLS MOVED OUT OF THIS FILE
//
//   This file is served from a PUBLIC GitHub repo via jsDelivr.
//   jsDelivr only serves public repos, so anything hardcoded here
//   is world-readable. Three Make webhook URLs were sitting in it
//   as bare constants:
//
//     MAKE_ADD_PUBPLAN_URL      Scenario 103   (creates PubPlans)
//     MAKE_CLONE_PUBPLAN_URL    Scenario 103-CLONE
//     MAKE_PROMOTE_NEXT_URL     Scenario 107
//
//   The T-A head config block carries the comment "Config: never
//   put this in GitHub" above the webhook list. These three were
//   the exception, and the exception was a mistake I introduced
//   at v1.0.5 and repeated at v1.0.8 and v1.0.11 rather than one
//   Jeff asked for.
//
//   All three now read from TA_CONFIG, matching the ~25 webhooks
//   already there. No literal remains. If a key is missing the
//   action refuses and names the key — no fallback, because a
//   fallback would put the URL back in this file.
//
//   REQUIRES HEAD EDIT — add to TA_CONFIG (see the reply that
//   shipped this version for the exact block).
//
//   ROTATE AFTER DEPLOYING. Moving the URLs does not un-publish
//   them; they have been on the CDN since v1.0.5 (add), v1.0.11
//   (clone) and v1.0.8 (promote). Regenerate all three hooks in
//   Make and put the NEW urls in TA_CONFIG. Until rotation, the
//   old URLs stay callable by anyone.
//
//   NOT FIXED HERE — six other CDN-served files carry one
//   hardcoded webhook each: ta-performance, ta-intake-manager,
//   ta-components-tab, ta-bundles, pubplan-sequencer,
//   pubplan-overview. Same exposure, same fix, separate bumps.
//
//   Nothing else differs from v1.0.21.
// ──────────────────────────────────────────────────────────
//
// ──────────────────────────────────────────────────────────
// v1.0.21 — CLONE: GUARD THE SOURCE PUBPLAN ID
//
//   handleCloneSubmit validated the edition label, the numeric
//   stem and the publication date, but never checked that
//   sourceId was non-empty. An unbound data-clone-pubplan-id
//   went straight onto the query string, and Scenario 103-CLONE
//   died at module 2 with:
//
//     BundleValidationError — Missing value of required
//     parameter 'item_id'
//
//   Two guards added, cheapest first:
//     · openCloneModal refuses to open at all without an id and
//       says why. The operator never reaches a form that cannot
//       succeed.
//     · handleCloneSubmit re-checks before building params, in
//       case the id is lost between open and submit.
//
//   HONEST SCOPE NOTE — this did NOT cause the empty webhook
//   hits seen on 2026-09-05 (8:42:57, 8:52:46, 8:59:17). Module
//   1's output bundle on those runs was EMPTY: no taId, no
//   issueName, no publicationDate, nothing. This client always
//   sends those four alongside sourcePubplanId, so a clone
//   submitted with only a missing id would still have arrived
//   with the rest. Something other than this button is hitting
//   that webhook bare. Guard added because it is correct, not
//   because it explains those runs.
//
//   Nothing else differs from v1.0.20.
// ──────────────────────────────────────────────────────────
//
// ──────────────────────────────────────────────────────────
// v1.0.20 — HC-039 RETIRED BEFORE IT WAS EVER FILED
//
//   v1.0.19 hardcoded the "Publish Next as Current" option ID in
//   this file and proposed a Hardcoding Tracker row for it. Jeff
//   pushed back: why track it instead of fixing it. Correct.
//   TA_CONFIG.optionIds already exists, already holds the whole
//   publishStatus set, already lives in page head rather than
//   GitHub. The ID belonged there from the start.
//
//   REQUIRES A HEAD EDIT — add to TA_CONFIG.optionIds.publishStatus:
//
//       publishNextAsCurrent: '9e7e2a932044010bc7c50840a54c45ba',
//
//   No literal remains in this file. If that key is missing the
//   promote button refuses to fire and says why. Deliberate: a
//   fallback literal here would quietly recreate the hardcoding
//   this version removes, and the operator would never know which
//   value was actually being compared.
//
//   Net effect: one fewer Tracker row, one more config key, and
//   the option ID now sits beside the fifty others it belongs with.
// ──────────────────────────────────────────────────────────
//
// ──────────────────────────────────────────────────────────
// v1.0.19 — PROMOTE-TO-NEXT NOW TELLS THE TRUTH
//
//   The only change in this version. Everything else is v1.0.18
//   byte for byte.
//
//   WHAT WAS WRONG
//     promoteToNext() toasted "promoted to Next-to-Go" on res.ok.
//     Make returns HTTP 200 the instant it RECEIVES a payload —
//     when the scenario is off, when the run is merely queued, and
//     when the run dies partway. The response body was never read.
//     The toast could not tell the truth even in principle.
//
//   WHAT CHANGED
//     The hand-rolled promoteToast() is gone. Promote now goes
//     through IxToast.submit() from ix-success-toast-v1.0.0.js,
//     which reads the response, finds the echoed publishing-status,
//     and compares it to PROMOTE_NEXT_STATUS_ID before it will
//     paint green. Three outcomes now exist where there were two:
//
//       green  echo came back holding "Publish Next as Current"
//       amber  accepted, but the response proved nothing
//       red    HTTP error, or the echo held a different status
//
//     Amber is the new one and it is the whole point. Anything the
//     old code would have called success but could not prove now
//     lands amber.
//
//   REQUIRES ONE MAKE-SIDE EDIT — WITHOUT IT THIS STAYS AMBER
//     Scenario 107's Webhook Response body must echo the UPDATE
//     module's actual output, not a pre-write read and not a hand
//     typed literal. Target shape:
//
//       {"ok":true,
//        "newsletterId":"{{N.id}}",
//        "publishing-status":"{{N.fieldData.`publishing-status`}}",
//        "lastUpdated":"{{N.lastUpdated}}"}
//
//     where N is the Webflow Update Item module. Backticks around
//     the hyphenated slug are required. Until that lands, every
//     promote will toast amber — correctly, because nothing is
//     being proved. No rebuild of 107 is needed for this.
//
//   (The HC-039 proposal in this block was superseded by v1.0.20 —
//    the ID moved into TA_CONFIG instead of being tracked.)
//
//   The it-promote-toast rules in issues-tab-v1.0.8.css are now
//   unused. Harmless; delete them on the next CSS bump rather
//   than cutting a version just for dead rules.
// ──────────────────────────────────────────────────────────
//
// ──────────────────────────────────────────────────────────
// v1.0.18 — Active cards open the PubPlan in a new tab
//
//   Clicking an In Progress card used to navigate the current tab
//   away from Title-Admin. The operator lost the T-A tab state and
//   had to come back and re-find the Pub Plans tab every time.
//
//   Root of the old behaviour: one flag, isExternal, was doing two
//   unrelated jobs — "this link leaves the platform" AND "open this
//   in a new tab". Only Archive cards pointing at a published
//   newsletter ever set it, so Active cards could never get a new
//   tab without also being mislabelled as off-platform.
//
//   v1.0.18 splits them:
//
//     isExternal — Archive card pointing at the published
//                  NEWSLETTER. Unchanged, still Archive-only.
//     newTab     — open in a new tab. True for isExternal AND for
//                  every Active card.
//
//   Destinations are unchanged and stay distinct:
//     Active  → PUBPLAN editing page,        new tab.
//     Archive → published NEWSLETTER,        new tab.
//     Archive with no newsletter URL → PubPlan, same tab (fallback
//                  is untouched; it is not a new-tab case).
//
//   The ↗ glyph now rides newTab, so it appears on Active cards
//   too. Its hover brighten was scoped to .it-card--archive:hover
//   in the CSS — that rule is rescoped to .it-card:hover in the
//   paired issues-tab-v1.0.8.css. Ship both or Active glyphs stay
//   dim on hover.
//
//   Promote to Next and Clone are unaffected. Both delegated
//   handlers already call preventDefault() and stopPropagation(),
//   so neither button can trigger the card's new tab.
//
//   Active cards with no pubplanUrl still render the disabled
//   data-no-detail state. No URL, no target.
//
// ──────────────────────────────────────────────────────────
// v1.0.17 — Clone modal: EDITION nomenclature + stem locked
//
//   The modal header already says "Clone WLN-118". The only thing
//   the operator is actually choosing is the EDITION SUFFIX — the
//   stem is fixed by whatever they cloned from. Asking for the whole
//   issue number invited them to retype (or mistype) 118.
//
//   Changes, copy + affordance only. No behavioural change to the
//   payload: issueNumber is still the stem, issueLabel still the
//   full label, and both are still derived the same way.
//
//     · Label:  "New Issue Number"  →  "New Edition"
//     · The stem is now a LOCKED segment shown alongside the prefix
//       (WLN-118), so the input holds only the suffix ("B").
//     · Preview unchanged in shape: "Preview: WLN-118B".
//     · Shared/copied explainer reworded — all seven pickers are
//       cloned now (Workstream: all-clone), so the old "FA/TS/TXA/
//       RE/EV stay shared" note was actively WRONG after
//       103-CLONE v2.x. It said editing an article would change both
//       editions. It no longer does.
//
//   NOMENCLATURE NOTE (carry into MNA):
//     Today "issue" and "edition" are used interchangeably across
//     the platform and they are not the same thing:
//       ISSUE   = the numbered publication cycle (118)
//       EDITION = one render/send of that issue (118, 118A, 118B)
//     PUBLICATION PLAN.Issue Number holds the ISSUE (118).
//     PUBLICATION PLAN.Issue Number Display holds the EDITION label.
//     NEWSLETTER.Issue No. displays the ISSUE (118) publicly.
//     NEWSLETTER.Recorded NL Name holds the EDITION (WLN-118B),
//       internal only.
//     TD candidate: rename the CMS fields + UI copy to say EDITION
//     where they mean edition. Deferred — MNA's edition model
//     (edition-label / edition-order on NEWSLETTER) supersedes this
//     whole vocabulary, so do it there rather than twice.
//
// ──────────────────────────────────────────────────────────
// v1.0.16 — UNIVERSAL RETURN RULE applied to every reload
//
//   Every post-write reload on this surface dumped the operator on
//   the T-A page's FIRST tab, because window.location.reload()
//   re-runs Webflow's tab widget and it always resets. Clone from
//   the Issues tab, land on the Studio default. Every time.
//
//   THE RULE, from here on: a write that forces a reload must return
//   the operator to the surface they fired it from. Never the page
//   default.
//
//   Implemented in ix-return-v1.0.0.js (shared, so the rule has one
//   implementation rather than one per surface). It stashes the
//   active tab(s) in the URL hash pre-reload and replays them after,
//   then strips the hash.
//
//   Modals are deliberately NOT reopened. The submit succeeded; the
//   modal has nothing left to say and reopening it reads as a
//   failure. Restore the tab underneath, not the overlay.
//
//   All three reload paths converted: clone success, add success,
//   and the unverified-write fallback.
//
//   FALLBACK: if ix-return isn't loaded yet, ixReload() degrades to
//   plain window.location.reload() — same behavior as v1.0.15, no
//   throw. Add the script tag and the rule switches on.
//
// ──────────────────────────────────────────────────────────
// v1.0.15 — Clone button on Locked (Archive) cards too
//
//   Was Active-zone only. Cloning a Locked issue is the common case:
//   last week's edition is finished and locked, and this week's is
//   built from it. Gating it to Active meant the operator had to
//   clone only from an in-progress issue, which is backwards.
//
//   The clone itself is unaffected — Scenario 103-CLONE forces the
//   new PubPlan's planning-status to In Progress regardless of the
//   source's, so a Locked source yields an editable clone.
//
//   Promote to Next stays Active-only. That one flips a live
//   publishing field on an in-flight edition; re-promoting an
//   archived issue is not a thing.
//
// ──────────────────────────────────────────────────────────
// v1.0.14 — Live 103-CLONE webhook URL
//
//   One line: MAKE_CLONE_PUBPLAN_URL placeholder replaced with the
//   real hook. No other change from v1.0.13.
//
// ──────────────────────────────────────────────────────────
// v1.0.13 — Clone scenario renamed 104 → 103-CLONE
//
//   Naming only, no behavioral change. The clone belongs to the
//   103 family (103 creates PubPlans; 103-CLONE duplicates one).
//   104 is createAsset and was never free.
//
//   Touches: the MAKE_CLONE_PUBPLAN_URL placeholder string, the
//   header comments, and the failure-toast text an operator sees
//   when verification fails ("Check Scenario 103-CLONE mappings").
//
// ──────────────────────────────────────────────────────────
// v1.0.12 — Clone scenario renumbered 105 → 104
//
//   Naming only. No behavioral change from v1.0.11. Bumped rather
//   than edited in place because v1.0.11 was shipped to Jeff and
//   the versioning rule treats any version he holds as deployed.
//   Discard v1.0.11; it was never correct about the scenario number.
//
// ──────────────────────────────────────────────────────────
// v1.0.11 — CLONE A PUBPLAN (legacy path)
//
//   New "Clone →" button on Active-zone cards, beside Promote to
//   Next. Duplicates an edition so the operator can swap banner
//   ads and re-render, without rebuilding the issue by hand.
//
//   SHARED vs CLONED (Jeff, 2026-08-11):
//     SHARED  — FA / TS / TXA / RE / EV picker records. The clone
//               points at the SAME 🅿️ records as the source. Same
//               editorial content, zero duplication. Editing one
//               changes both — that is the intent.
//     CLONED  — BA and BA+ picker records. Real duplicates,
//               pre-populated with the source's banner contents,
//               so the operator only touches the slots that
//               actually change between editions.
//
//   Fires Scenario 103-CLONE (Clone PUBPLAN). Payload mirrors the Add
//   flow's dual-write contract: issueNumber = numeric stem,
//   issueLabel = full alphanumeric label.
//
//   Suffix auto-advance: WLN-118A → suggests 118B, 118B → 118C.
//   A bare 118 suggests 118A. Operator can override.
//
//   LEGACY-ONLY. Superseded by the Cloner Workstream (Generator
//   tab) once MNA-B lands; retired with the picker model in
//   Workstream J.
//
//   Toast-truth applies — Scenario 103-CLONE's Respond echoes the
//   written fieldData and we diff it before claiming success.
//
//   NOT AUTOMATED: Scenario 106 module 2's issue-no filter still
//   needs a hand edit before "run the HTML" (HC-017 unchanged).
//
// ──────────────────────────────────────────────────────────
//
// Issues tab on the T-A page — REPLACES pubplan-overview-v1.0.12.js
// as part of MNA Workstream A-4.
//
// ──────────────────────────────────────────────────────────
// v1.0.10 — Alphanumeric issue labels ("WLN-118B") · DUAL-WRITE
//
//   ROOT CAUSE of the "118B" rejection (finally pinned): the issue
//   field was still <input type="number">. A number input does not
//   reject the keystroke — it silently blanks its OWN .value the
//   instant the string stops being a valid number. So typing "118B"
//   left value === "" and the preview fell to "—". The submit path
//   in v1.0.7+ already passed the raw string through untouched;
//   the input element was the whole blocker.
//
//   THE REAL CONSTRAINT (why v1.0.6's free-text flip got reverted):
//   Webflow PUBLICATION PLAN `issue-number` is a **Number** field.
//   Free text alone pushes "118B" at a Number field and the write
//   fails or coerces. Retyping the field to Plain text would mean
//   delete + recreate in Designer, breaking every Make mapping that
//   points at it and killing numeric sort platform-wide.
//
//   RESOLUTION — DUAL-WRITE (approved 2026-08-11):
//     · issueLabel  = the full operator string  ("118B")
//                     → PUBLICATION PLAN `issue-number-display`
//                       (Plain text · already exists · was unused)
//     · issueNumber = the leading numeric stem  ("118")
//                     → PUBLICATION PLAN `issue-number` (Number)
//                       Numeric sort survives everywhere.
//     · issueName   = abbreviation + "-" + issueLabel  ("WLN-118B")
//                     → TITLE-WEEK (Plain text · Name field)
//   Requires Scenario 103 blueprint v1.1 (module 2 remap + module 44
//   issue-no resourced + module 32 echo). Client is backward-safe:
//   against the OLD blueprint it degrades to an unverified toast
//   rather than a false success.
//
//   CHANGES:
//     1. Both issue inputs → type="text" + inputmode="text".
//        min/step dropped (meaningless on text). CSS unchanged —
//        the spinner-suppression rules become inert no-ops.
//     2. Alpha suffix force-uppercased as typed (caret preserved),
//        matching the abbreviation field's existing behavior.
//     3. New `issueLabel` param on the webhook GET. `issueNumber`
//        now carries the stem only. Both sent every time.
//     4. Format guard (NOT a required-field guard — v1.0.7's
//        no-required-fields decision stands): a NON-BLANK issue
//        value must begin with a digit, so the numeric stem is
//        always derivable for the Number field. Blank still
//        submits, unchanged.
//     5. parseNextIssueNumber() FIXED — it read `.pubplan-id`,
//        which was RETIRED in v1.0.4 and is no longer bound in
//        Designer. It has therefore returned null on every render
//        since v1.0.4, silently killing the next-number suggestion.
//        Now reads `.pubplan-name` (TITLE-WEEK) and its regex
//        tolerates a suffix, so "WLN-118B" still yields 119.
//     6. TOAST-TRUTH compliance. Was: any 2xx → green "created".
//        Now: parse the JSON echo, diff the written fieldData
//        field-by-field against what was sent. Match → green.
//        Mismatch → red, no reload, values shown. No echo present
//        (old blueprint still imported) → amber "unverified".
//
//   KNOWN DOWNSTREAM (flagged, NOT fixed here — separate files):
//     · newsletters-tab-v1.0.3.js:138 sorts on parseInt(issueNo),
//       so 118 and 118B tie at 118.
//     · ta-performance-v0.6.9.js:157 parseInt's the issue for
//       bucketing — 118 and 118B can collapse into one bucket.
//     Both need a stem-then-suffix comparator. Separate bumps.
//
// ──────────────────────────────────────────────────────────
// v1.0.8 — "Promote to Next" button on In Progress (Active) cards
//
//   New feature. Fires Scenario 107 (Change Publishing Status: NL
//   Next-To-Go), which flips the linked NEWSLETTER record's
//   publishing-status to "Publish Next as Current" and republishes
//   it. This does NOT touch Planning Status / does NOT create a
//   NEWSLETTER record — it assumes one already exists and is linked
//   via the PubPlan's NEWSLETTER Item ID field.
//
//   - Button renders ONLY on Active-zone (In Progress) cards, and
//     ONLY when data-newsletter-id is present + non-empty on that
//     card's .pubplan-slot-wrapper. Missing binding = no button,
//     one console.warn for the whole render pass (not per-card —
//     avoids log spam on titles where the binding isn't live yet).
//   - Click is intercepted with preventDefault + stopPropagation
//     so it doesn't trigger the wrapping <a> card's navigation.
//   - Native confirm() gate before firing — this flips a live
//     publishing field with no undo affordance in this UI.
//   - Standing async-feedback contract: button disables + relabels
//     "Promoting…" during the fetch; success → green toast +
//     button relabels "Promoted ✓" (stays disabled, prevents
//     double-fire); failure → red toast + button re-enables so the
//     publisher can retry.
//   - Uses the same bare-constant-URL pattern already established
//     in this file for MAKE_ADD_PUBPLAN_URL (not TA_CONFIG — see
//     HC-017 below).
//
//   NEW DOM CONTRACT: [data-newsletter-id] on .pubplan-slot-wrapper
//   — REQUIRES a Designer binding (NEWSLETTER Item ID field on
//   PUBLICATION PLAN). Not present before v1.0.8; must be added in
//   Webflow Designer before this button will appear anywhere.
//
// ──────────────────────────────────────────────────────────
// v1.0.7 — Modal form: Issue Number reverted to number;
//          Edition + Name fields added; no required fields
//
//   - Issue Number is type="number" again (v1.0.6 free-text reverted).
//   - New Edition field (text, data-pp-add-edition).
//   - New Name field (text, data-pp-add-name).
//   - All required-field validation removed — modal submits
//     whatever is entered, blank or filled.
//   - Webhook now also sends: edition, name. issueNumber sent
//     as the numeric string. issueName = ABBR-number when an
//     abbreviation is present, else the bare number.
//   NOTE: edition + name are NOT yet bound in Make scenario 103
//   (Create PUBPLAN module maps only name/title-admin/issue-number/
//   planning-status/publication-date/t-a-3digit). They arrive as
//   bundle items but are ignored until mapped.
//
// ──────────────────────────────────────────────────────────
// v1.0.6 — Issue field is FREE TEXT (fixes "114B" rejection)
//
//   v1.0.5 as deployed still had <input type="number"> on the
//   issue field, so the browser rejected non-numeric input like
//   "114B" or "Holiday". v1.0.6 ships the intended change:
//     - both issue inputs are type="text"
//     - submit takes the raw trimmed value (no parseInt / isNaN)
//     - issueName = abbreviation + '-' + rawValue
//     - webhook issueNumber param carries the raw string
//   New filename per no-reuse rule (do NOT re-push v1.0.5).
//
// ──────────────────────────────────────────────────────────
// v1.0.5 — Add a PubPlan REINSTATED
//
//   v1.0.2 removed the Add-a-PubPlan modal + button. Jeff wants
//   it back. This restores, verbatim from pubplan-overview-v1.0.12:
//     - MAKE_ADD_PUBPLAN_URL constant
//     - + Add a PubPlan button in the header (data-pp-add-btn)
//     - full modal: readTaContext, parseNextIssueNumber,
//       renderModalHtml, openAddPubplanModal, closeAddPubplanModal,
//       handleAddPubplanSubmit, showSuccessAndReload
//     - delegated click handler on [data-pp-add-btn]
//   GET/URLSearchParams submit + data-ta-short auto-fill unchanged.
//   HC-012 (modal English copy) UN-RETIRED.
//   HC-011 stays retired (no issue-ID regex for abbreviation).
//
// ──────────────────────────────────────────────────────────
// v1.0.4 — DOM contract realignment to platform convention
//
//   Designer cleanup completed (Phases 1–3):
//     · pubplan-item stripped clean — no custom attributes
//     · pubplan-slot-wrapper now holds ALL data-* attributes
//       (data-item-id, data-pubplan-url, data-planning-status,
//       data-newsletter-url)
//     · pubplan-name rebound to TITLE-WEEK (yields "WLN-111")
//     · pubplan-date rebound to PUBLICATION DATE (formatted)
//     · pubplan-id retired (still in DOM, no longer read)
//
//   JS changes:
//     · gatherIssues reads data-* from .pubplan-slot-wrapper
//       (was .pubplan-item) — matches the convention used by
//       other hidden CMS collections on the platform.
//     · Card title sourced from .pubplan-name (TITLE-WEEK).
//       .pubplan-id no longer read — the hex Item ID lives on
//       data-item-id for any future tool that needs it.
//     · renderCard drops the small-mono .it-card-id eyebrow line
//       since we only have one identifier per issue; TITLE-WEEK
//       renders prominently in the .it-card-name slot instead.
//     · data-newsletter-url now bound to NEWSLETTER Link (full
//       URL), not a slug — resolveUrl pass-through handles it
//       unchanged. NEWSLETTER_PATH_PREFIX retained as fallback
//       safety only.
//
// ──────────────────────────────────────────────────────────
// v1.0.3 — Path prefixes corrected to live values
//
//   v1.0.2 shipped with placeholder prefixes /pubplan/ and
//   /newsletter/. v1.0.3 sets them to the actual Webflow template
//   paths:
//     PUBPLAN_PATH_PREFIX    = '/publication-plan/'
//     NEWSLETTER_PATH_PREFIX = '/nl/'
//
//   No other changes.
//
// ──────────────────────────────────────────────────────────
// v1.0.2 — Modal removed + URL-from-slug construction
//
//   Two changes from v1.0.1 (pre-deploy ship):
//
//   (1) Add PubPlan modal removed entirely. The modal flow is
//       no longer used. Stripped: renderModalHtml, openAddPubplanModal,
//       closeAddPubplanModal, handleAddPubplanSubmit, showSuccessAndReload,
//       readTaContext, parseNextIssueNumber, wireAddButton,
//       MAKE_ADD_PUBPLAN_URL constant, and the +Add a PubPlan button
//       in the header. HC-012 (modal English copy) RETIRED.
//
//   (2) URL construction from slug. data-pubplan-url and
//       data-newsletter-url are now bound to Webflow Slug fields,
//       not full URLs. resolveUrl() helper prepends a configurable
//       path prefix unless the value is already absolute or
//       path-rooted (starts with "/" or "http"). New constants
//       PUBPLAN_PATH_PREFIX and NEWSLETTER_PATH_PREFIX hold the
//       template paths — tracked as HC-015 and HC-016.
//
// ──────────────────────────────────────────────────────────
// PHILOSOPHY (A-4):
//
//   The vestigial "Publication Planning" tab is replaced by a
//   read-only Issues tab — a card list of every PubPlan owned
//   by this T-A, partitioned by Planning Status:
//
//     ACTIVE zone   — Planning Status = "In Progress" (or missing)
//                     · cards open PubPlan editing page in NEW tab
//                       (v1.0.18 — was same tab; T-A tab state is
//                       preserved behind it)
//     ARCHIVE zone  — Planning Status = "Locked"
//                     · cards open published Newsletter page in NEW tab
//                       (or fall back to PubPlan same-tab if no
//                       newsletter URL bound)
//
//   Card click navigates. No edit affordances anywhere on the
//   tab itself — editability lives inside the PubPlan template
//   page, controlled by the same Planning Status field per the
//   A-5 Δ-5 cascade decision (see MNA WM v1.2 §07).
//
// ──────────────────────────────────────────────────────────
// MULTI-TENANT:
//   All identifiers carry through Webflow CMS bindings on the
//   Collection Item wrapper. No publisher names baked in JS.
//
// ──────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────
// DOM CONTRACT (v1.0.23):
//
//   .pubplan-item                                — Collection Item wrapper · CLASS only
//     .pubplan-slot-wrapper                      — issue-level data home (per platform convention)
//       [data-item-id]                           — (Self) This PUBPLAN ID hex · REQUIRED for Set as Next
//       [data-pubplan-url]                       — PubPlan template SLUG
//       [data-planning-status]                   — Planning Status label ("In Progress" | "Next" | "Locked")
//       [data-publication-date]                  — ISO date · OPTIONAL · sort + weekday
//       [data-newsletter-url]                    — NEWSLETTER Link (full URL)  · OPTIONAL · Archive nav
//       [data-newsletter-id]                     — NEWSLETTER Item ID (hex)    · OPTIONAL
//                                                   Set as Next needs it; the Next check joins on it.
//     .pubplan-name    (text)                    — TITLE-WEEK · tile title (e.g. "WLN-111")
//     .pubplan-date    (text)                    — PUBLICATION DATE · formatted text
//
//   .newsletter-source [data-nl-id]              — NEW READ v1.0.23 (binding already live)
//       [data-nl-id]                             — (Self) NEWSLETTER Item ID
//       [data-nl-status]                         — NEWSLETTERS Publishing Status label
//
//   .pub-plan-scroll-area | .pub-plan-zone       — mount anchors (hidden)
//
// ──────────────────────────────────────────────────────────
// HARDCODED DECISIONS:
//   - HC-011 RETIRED in v1.0.12 (issue-ID regex parse, replaced by data-ta-short)
//   - HC-012 RETIRED in v1.0.2  (modal English copy — modal removed)
//   - HC-013: English UI copy — zone names ("Next Newsletter",
//     "Active", "Archive"), status words, button labels, check
//     sentences, and dates formatted with the en-US locale.
//     i18n out of scope for current platform.
//   - HC-014 RETIRED in v1.0.23. Planning Status labels and IDs
//     come from TA_CONFIG.optionLabels / optionIds.
//   - HC-015 (v1.0.2): PUBPLAN_PATH_PREFIX = "/publication-plan/".
//     Webflow PubPlan template page path. Platform-level, one value
//     for every tenant.
//   - HC-016 (v1.0.2): NEWSLETTER_PATH_PREFIX = "/nl/".
//     Live Webflow Newsletter page path. Fallback only: the bound
//     NEWSLETTER Link is a full URL and passes through unchanged.
//   - HC-017 CORRECTED in v1.0.23. Was: "MAKE_PROMOTE_NEXT_URL
//     hardcoded as a bare constant, PLACEHOLDER value". Since
//     v1.0.22 no webhook URL is in this file. Scenario 107 is read
//     from TA_CONFIG.makePromoteNext. The URL's history on the CDN
//     is HC-049 (rotate in Make to close it).
//   - ARCHIVE_INITIAL = 8. How many Archive tiles show before
//     "Show all". Presentation only, same for every tenant.
//
// COMPANION CSS:  issues-tab-v1.0.11.css
// REQUIRES:       title-admin-page-design-v1.4.41.css (ix-own wildcard exemption)
//                 ix-success-toast-v1.0.1.js (IxToast; v1.0.0 works without the auto-clear)
//                 Scenario 107 blueprint v2 (echoes planning-status + pubplanId)
// COMPANION DOC:  MNA Workstream Master v1.2 §03 A-4 + §07 Δ-7
//
// ============================================================

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // CONFIG (TA_CONFIG, page head — never GitHub)
  // ═══════════════════════════════════════════════════════════════
  //
  // Read at call time, not load time, so a config edit takes effect
  // on the next click or render without a hard reload.

  function cfg() { return window.TA_CONFIG || {}; }

  // ── Make webhooks (v1.0.22) ──
  // No literals and no fallbacks: a fallback would put the URL back
  // into this public file.
  function makeUrl(key) {
    return String(cfg()[key] || '').trim();
  }

  // Returns '' when absent. Every call site checks and refuses.
  function requireMakeUrl(key, actionLabel) {
    var u = makeUrl(key);
    if (!u) {
      console.error('[Issues] TA_CONFIG.' + key + ' is missing. Add it to the T-A page head config.');
      window.alert('Cannot ' + actionLabel + ': the webhook URL is not configured. ' +
                   'Tell Jeff TA_CONFIG.' + key + ' is missing.');
      return '';
    }
    return u;
  }

  // ── Option IDs and labels (v1.0.23) ──
  // IDs are what Make writes and echoes. Labels are what a Webflow
  // Option binding prints into a data attribute. Both are needed:
  // the echo check compares IDs, the page read compares labels.
  function optId(group, key) {
    var g = (cfg().optionIds || {})[group] || {};
    return String(g[key] || '').trim();
  }
  function optLabel(group, key) {
    var g = (cfg().optionLabels || {})[group] || {};
    return String(g[key] || '').trim();
  }

  // Keys the tab needs to show the truth. Missing ones are listed
  // in a visible notice rather than silently guessed.
  var REQUIRED_CONFIG = [
    ['optionLabels', 'planningStatus',     'next'],
    ['optionLabels', 'planningStatus',     'locked'],
    ['optionLabels', 'nlPublishingStatus', 'publishNextAsCurrent'],
    ['optionLabels', 'nlPublishingStatus', 'readyToPublish'],          // v1.0.37
    ['optionIds',    'planningStatus',     'next']
  ];
  function missingConfig() {
    var out = [];
    REQUIRED_CONFIG.forEach(function (k) {
      var v = k[0] === 'optionIds' ? optId(k[1], k[2]) : optLabel(k[1], k[2]);
      if (!v) out.push('TA_CONFIG.' + k.join('.'));
    });
    return out;
  }

  function low(s) { return String(s == null ? '' : s).trim().toLowerCase(); }

  // True when a raw attribute value names the given option, by label
  // or by ID. An unconfigured side never matches (empty never equals
  // a non-empty raw value).
  function isOption(raw, group, key) {
    var v = low(raw);
    if (!v) return false;
    var lab = low(optLabel(group, key));
    var id  = low(optId(group, key));
    return (!!lab && v === lab) || (!!id && v === id);
  }

  // ── Path constants (HC-015 / HC-016) ──
  var PUBPLAN_PATH_PREFIX    = '/publication-plan/';
  var NEWSLETTER_PATH_PREFIX = '/nl/';

  // ── Presentation ──
  var ARCHIVE_INITIAL = 8;

  // ── IPP views (ipp-shell VIEWS) ──
  // Must match ipp-shell's own list. Platform-level, one value for
  // every tenant. Used only to validate TA_CONFIG.ippNextView.
  var IPP_VIEW_NAMES = ['picker', 'layout', 'publish'];

  // ═══════════════════════════════════════════════════════════════
  // URL RESOLUTION
  // ═══════════════════════════════════════════════════════════════

  // Resolve a Webflow CMS field value to a navigable URL.
  //   - Empty → ''
  //   - Absolute (http/https) or path-rooted (/) → as-is
  //   - Otherwise → a slug; prefix is prepended
  function resolveUrl(value, prefix) {
    if (!value) return '';
    var v = String(value).trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    if (v.charAt(0) === '/') return v;
    var sep = (prefix.slice(-1) === '/') ? '' : '/';
    return prefix + sep + v;
  }

  // ═══════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════
  //
  // Rendering is state-driven. Every action changes S, then calls
  // renderZones(). Nothing edits tile DOM in place, so a re-render
  // can never strand a half-updated tile.

  var S = {
    issues: [],        // gathered once, then mutated by verified writes
    nl: {},            // newsletter id → data-nl-status label
    ui: {},            // tile key → 'confirm' | 'busy' | 'unverified'
    showAllArchive: false,
    arrive: '',        // key of a tile that just moved into Next
    pub: {},           // v1.0.41: plan id → Worker's publish answer
    send: {},          // v1.0.43: plan id → the newsletter's send time (ISO) or null
    pubState: 'loading', // 'loading' | 'ok' | 'err' | 'off'
    pubWhy: '',        // reason when pubState is 'err'
    showFuture: false, // v1.0.44: the Future plans fold is open
    rf: {}             // v1.0.44: tile key → { rows, ids, why, done } for Refresh slots
  };
  var FUTURE_DAYS = 21;   // v1.0.44, HC-P-RT-2

  function keyOf(iss) { return iss.itemId || iss.title; }
  function findByKey(k) {
    for (var i = 0; i < S.issues.length; i++) {
      if (keyOf(S.issues[i]) === k) return S.issues[i];
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // GATHERING
  // ═══════════════════════════════════════════════════════════════

  function gatherIssues() {
    var items = document.querySelectorAll('.pubplan-item');
    var issues = [];
    var seen = {};

    items.forEach(function (item) {
      var slot = item.querySelector('.pubplan-slot-wrapper');
      if (!slot) return;

      var nameEl = item.querySelector('.pubplan-name');
      var dateEl = item.querySelector('.pubplan-date');

      var title = nameEl ? nameEl.textContent.trim() : '';
      if (!title || seen[title]) return;
      seen[title] = true;

      var iso = (slot.getAttribute('data-publication-date') || '').trim();

      issues.push({
        title:         title,
        dateText:      dateEl ? dateEl.textContent.trim() : '',
        isoDate:       iso,
        pubplanUrl:    resolveUrl(slot.getAttribute('data-pubplan-url')    || '', PUBPLAN_PATH_PREFIX),
        newsletterUrl: resolveUrl(slot.getAttribute('data-newsletter-url') || '', NEWSLETTER_PATH_PREFIX),
        status:        (slot.getAttribute('data-planning-status') || '').trim(),
        itemId:        (slot.getAttribute('data-item-id') || '').trim(),
        newsletterId:  (slot.getAttribute('data-newsletter-id') || '').trim(),
        echoNext:      false   // set true only by a verified 107 echo
      });
    });

    return issues;
  }

  // Newsletter id → Publishing Status label, from the hidden
  // newsletter-source list already on the T-A page. When the same
  // newsletter renders twice, the first copy with a status wins.
  function gatherNewsletterStatuses() {
    var map = {};
    var els = document.querySelectorAll('.newsletter-source [data-nl-id]');
    Array.prototype.forEach.call(els, function (el) {
      var id = (el.getAttribute('data-nl-id') || '').trim();
      if (!id) return;
      var st = (el.getAttribute('data-nl-status') || '').trim();
      if (!(id in map) || (!map[id] && st)) map[id] = st;
    });
    return map;
  }

  // ═══════════════════════════════════════════════════════════════
  // CLASSIFYING
  // ═══════════════════════════════════════════════════════════════

  // 'next' | 'archive' | 'active'. Anything unrecognised stays
  // Active: the conservative place, where it can still be acted on.
  function zoneOf(iss) {
    if (isOption(iss.status, 'planningStatus', 'next'))   return 'next';
    if (isOption(iss.status, 'planningStatus', 'locked')) return 'archive';
    return 'active';
  }

  // The newsletter's own view of itself.
  //   ok       status is Publish Next as Current
  //   bad      status is something else
  //   nolink   the PubPlan has no newsletter linked
  //   unknown  not in this page's list, or label not configured
  // v1.0.37 — where a Next plan's newsletter stands, from its
  // Publishing Status label on the page.
  //   set       Publish Next as Current (vendor fully set up)
  //   released  Ready to Publish
  //   building  anything else (Draft)
  function nlStage(iss) {
    if (!iss.newsletterId) return { state: 'nolink', got: '' };
    if (!(iss.newsletterId in S.nl)) return { state: 'unknown', got: '', why: 'missing' };
    var got = S.nl[iss.newsletterId];
    if (isOption(got, 'nlPublishingStatus', 'publishNextAsCurrent')) return { state: 'set', got: got };
    if (isOption(got, 'nlPublishingStatus', 'readyToPublish')) return { state: 'released', got: got };
    return { state: 'building', got: got };
  }

  // ═══════════════════════════════════════════════════════════════
  // DATES
  // ═══════════════════════════════════════════════════════════════

  // Local midnight. Date-only ISO strings are built from their parts
  // so a UTC parse can never shift the day.
  function issueDate(iss) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iss.isoDate || '');
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    var t = Date.parse(iss.dateText || '');
    if (isNaN(t)) return null;
    var d = new Date(t);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // v1.0.44 — more than FUTURE_DAYS out by its send time, else its publication date (HC-P-RT-2)
  function isFuture(iss) {
    var d = sendDate(iss) || issueDate(iss); if (!d) return false;
    var cut = todayMidnight(); cut.setDate(cut.getDate() + FUTURE_DAYS + 1);
    return d.getTime() >= cut.getTime();
  }
  function sortValue(iss) {
    var d = issueDate(iss);
    return d ? d.getTime() : 0;
  }

  function todayMidnight() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function formatWhen(iss) {
    var d = issueDate(iss);
    if (!d) return iss.dateText || '';
    var opts = { weekday: 'long', month: 'long', day: 'numeric' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    try { return d.toLocaleDateString('en-US', opts); } catch (e) { return iss.dateText || ''; }
  }

  // v1.0.43 — the edition's send time as a local Date, or null
  function sendDate(iss) {
    var v = iss.itemId ? S.send[iss.itemId] : null; if (!v) return null;
    var d = new Date(v); return isNaN(d) ? null : d;
  }
  function formatSend(iss) {
    var d = sendDate(iss); if (!d) return '';
    var opts = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    try { return d.toLocaleString('en-US', opts); } catch (e) { return ''; }
  }

  // { text, past }  v1.0.43: the send time when known, else the publication date
  function relative(iss) {
    var sd = sendDate(iss);
    if (sd) {
      var h = (sd.getTime() - Date.now()) / 36e5;
      if (h < 0) return { text: 'Send time has passed', past: true, send: true };
      if (h < 1) return { text: 'Sends within the hour', past: false, send: true };
      if (h < 24) return { text: 'Sends in ' + Math.round(h) + ' hours', past: false, send: true };
      var dd = Math.round((new Date(sd.getFullYear(), sd.getMonth(), sd.getDate()).getTime() - todayMidnight().getTime()) / 86400000);
      return { text: dd === 1 ? 'Sends tomorrow' : 'Sends in ' + dd + ' days', past: false, send: true };
    }
    var d = issueDate(iss);
    if (!d) return { text: '', past: false };
    var days = Math.round((d.getTime() - todayMidnight().getTime()) / 86400000);
    if (days === 0)  return { text: 'Today', past: false };
    if (days === 1)  return { text: 'Tomorrow', past: false };
    if (days > 1)    return { text: 'in ' + days + ' days', past: false };
    if (days === -1) return { text: 'Yesterday', past: true };
    return { text: (-days) + ' days ago', past: true };
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  var ICON_OPEN =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M6 3H3.5A.5.5 0 0 0 3 3.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V10M9 3h4v4M13 3 7.5 8.5" ' +
    'stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_CHECK =
    '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">' +
    '<path d="M4 9.5 7.5 13 14 5.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_DOT =                                               // v1.0.37
    '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="4" fill="currentColor"/></svg>';
  var ICON_X =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  var ICON_Q =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M6 6a2 2 0 1 1 2.8 1.8c-.5.2-.8.7-.8 1.2V10M8 12.5v.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  // Where a tile's code links, and how. Unchanged from v1.0.18:
  //   Active / Next → PubPlan page, same tab (v1.0.32).
  //   Archive       → newsletter, new tab; else PubPlan, same tab.
  function linkFor(iss, zone) {
    if (zone === 'archive' && iss.newsletterUrl) return { url: iss.newsletterUrl, newTab: true };
    if (iss.pubplanUrl) return { url: iss.pubplanUrl, newTab: false };   // v1.0.32: same tab
    return { url: '', newTab: false };
  }

  function linkAttrs(l) {
    return ' href="' + esc(l.url) + '"' +
      (l.newTab ? ' target="_blank" rel="noopener noreferrer"' : '');
  }

  // Code + open icon. The icon repeats the link for the mouse; it is
  // skipped by keyboard and screen readers so there is one stop.
  function codeRow(iss, zone, codeClass) {
    var l = linkFor(iss, zone);
    if (!l.url) {
      return '<div class="it-tile-top"><span class="' + codeClass + '">' + esc(iss.title) + '</span></div>';
    }
    var label = l.newTab ? ' aria-label="' + esc(iss.title) + ', opens in a new tab"' : '';
    return '<div class="it-tile-top">' +
      '<a class="' + codeClass + '"' + linkAttrs(l) + label + '>' + esc(iss.title) + '</a>' +
      '<a class="it-open"' + linkAttrs(l) + ' tabindex="-1" aria-hidden="true" title="' +
        (l.newTab ? 'Open in a new tab' : 'Open') + '">' + ICON_OPEN + '</a>' +
    '</div>';
  }

  function cloneBtn(iss, extraClass) {
    if (!iss.itemId) return '';
    return '<button type="button" class="it-clone-btn' + (extraClass ? ' ' + extraClass : '') + '"' +
      ' data-clone-pubplan-id="' + esc(iss.itemId) + '" data-clone-issue-name="' + esc(iss.title) + '">' +
      'Clone</button>';
  }

  // v1.0.34 — + Edition beside Clone. Only when 126 is wired.
  function editionBtn(iss, extraClass) {
    if (!iss.itemId || !makeUrl('makeCloneIssue')) return '';
    // v1.0.36 — only the latest edition of its issue carries the button.
    var me = parseIssueTitle(iss.title);
    if (!me) return '';
    var later = (S.issues || []).some(function (o) {
      var q = parseIssueTitle(o.title);
      return q && q.stem === me.stem && (q.letter.length > me.letter.length ||
        (q.letter.length === me.letter.length && q.letter > me.letter));
    });
    if (later) return '';
    return '<button type="button" class="it-clone-btn it-edition-btn' + (extraClass ? ' ' + extraClass : '') + '"' +
      ' data-ed-key="' + esc(keyOf(iss)) + '">+ Edition</button>';
  }

  // ═══════════════════════════════════════════════════════════════
  // TILES
  // ═══════════════════════════════════════════════════════════════

  // v1.0.39 — the other plans of this title that are Next now.
  // 107 v4 moves each of them back to In Planning.
  function otherNext(iss) {
    var k = keyOf(iss);
    return (S.issues || []).filter(function (o) {
      return keyOf(o) !== k && zoneOf(o) === 'next';
    });
  }

  function joinTitles(list) {
    var t = list.map(function (o) { return o.title; });
    if (t.length < 2) return t.join('');
    return t.slice(0, -1).join(', ') + ' and ' + t[t.length - 1];
  }

  // The confirm names the planned action (ruled 11 Oct). v1.0.40:
  // when another plan leaves Next it is a salmon warning, and the
  // demoted plan's newsletter goes back to Draft (ruling A).
  function confirmHtml(iss) {
    var others = otherNext(iss);
    var q = 'Set ' + iss.title + ' as the next newsletter?';
    if (!others.length) {
      return '<div class="it-confirm-q">' + esc(q +
             ' It moves to Next Newsletter. Its newsletter is not changed.') + '</div>';
    }
    var many = others.length > 1;
    return '<div class="it-confirm-alert" role="alert">' +
             '<div class="it-confirm-alert-h">' + esc(joinTitles(others) + (many ? ' leave' : ' leaves') + ' Next') + '</div>' +
             '<div class="it-confirm-alert-b">' + esc(
               (many ? 'They move' : 'It moves') + ' back to In Planning, and ' +
               (many ? 'their newsletters go' : 'its newsletter goes') + ' back to Draft. ' +
               'Any release or vendor setup on ' + (many ? 'them' : 'it') + ' is undone.') + '</div>' +
           '</div>' +
           '<div class="it-confirm-q">' + esc(q) + '</div>';
  }

  // v1.0.40 — backstop. A plan outside Next whose newsletter is
  // released or set up with the vendor would still be sent by 108.
  function strayNote(iss) {
    var st = nlStage(iss).state;
    if (st !== 'released' && st !== 'set') return '';
    return '<div class="it-note it-note--alert">' +
             '<strong>Newsletter still ' + (st === 'set' ? 'set up with the vendor' : 'released') + '.</strong> ' +
             'Scenario 108 will send it on its date. Set this plan as Next, or set its newsletter back to Draft.' +
           '</div>';
  }

  // ── v1.0.41: the publish-step pill ──────────────────────────
  // Prints what the Worker answered. No step rules live here.
  function stepPill(iss) {
    if (S.pubState === 'off') return '';
    var cls = 'it-step', text = '', num = '', title = '';
    if (S.pubState === 'loading') {
      cls += ' it-step--wait'; text = 'Checking'; title = 'Reading the publish step\u2026';
    } else if (S.pubState === 'err') {
      cls += ' it-step--none'; text = 'Unknown'; title = 'The publish step could not be read: ' + (S.pubWhy || 'no answer');
    } else {
      var p = iss.itemId ? S.pub[iss.itemId] : null;
      if (!p || !p.step) {
        cls += ' it-step--none'; text = 'No email';
        title = iss.itemId ? 'No newsletter is linked to this PubPlan.' : 'This tile has no PubPlan ID bound.';
      } else {
        cls += ' it-step--' + p.step; text = p.label || p.step;
        if (p.n != null) num = p.of != null ? p.n + '/' + p.of : String(p.n);   // v1.0.42: bare count when there is no "of"
        if (p.step === 'compile' && p.n > 0) cls += ' it-step--bad';            // v1.0.42: things to fix
        title = (p.steps || []).map(function (st) {
          var n = st.n == null ? '' : (st.of != null ? ' ' + st.n + '/' + st.of : ' ' + st.n + ' to fix');
          return st.label + n + (st.done ? ' \u2713' : '');
        }).join(' \u00b7 ');
        if (p.step === 'ready') title = 'Vendor fully set up; goes on the send date. ' + title;
        if (p.step === 'compile') {
          title = (p.n == null ? 'Not yet checked on Publish. ' : 'Last checked on Publish' + (p.checkedAt ? ' ' + fmtWhen(p.checkedAt) : '') + '. ') + title;
        }
      }
    }
    return '<div class="it-step-row"><span class="' + cls + '" title="' + esc(title) + '">' +
             '<span class="it-step-l">' + esc(text) + '</span>' +
             (num ? '<span class="it-step-n">' + esc(num) + '</span>' : '') +
           '</span></div>';
  }

  function fmtWhen(iso) {   // v1.0.42
    var d = new Date(iso); if (isNaN(d)) return '';
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  function loadPublishSteps() {
    var base = String(cfg().planList || '').trim();
    var ta = String(cfg().taItemId || '').trim();
    if (!base) {
      S.pubState = 'off';
      console.warn('[Issues] TA_CONFIG.planList is not set, so tiles show no publish step.');
      return;
    }
    if (!/^[0-9a-f]{24}$/.test(ta)) {
      S.pubState = 'err'; S.pubWhy = 'TA_CONFIG.taItemId is not a TITLES-ADMIN id';
      renderZones();
      return;
    }
    var url = base + (base.indexOf('?') < 0 ? '?' : '&') + 'titleAdminId=' + encodeURIComponent(ta);
    fetch(url, { method: 'GET' })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (res) {
        var b = res.body || {};
        if (!b.ok || !Array.isArray(b.plans)) throw new Error(b.error || ('HTTP ' + res.status));
        var map = {}, send = {};
        b.plans.forEach(function (p) { if (p && p.id) { map[p.id] = p.publish || null; send[p.id] = p.sendAt || null; } });   // v1.0.43: sendAt
        S.pub = map; S.send = send; S.pubState = 'ok'; S.pubWhy = '';
        var v = b.meta && b.meta.version;
        if (v && !b.plans.some(function (p) { return 'publish' in p; })) {
          console.warn('[Issues] Data Worker ' + v + ' answers no publish step (needs v1.0.59 or later).');
        }
        renderZones();
      })
      .catch(function (e) {
        S.pubState = 'err'; S.pubWhy = (e && e.message) || String(e);
        console.warn('[Issues] publish step not read: ' + S.pubWhy);
        renderZones();
      });
  }

  // ── v1.0.44 · Refresh slots from the Default Layout (RT-12) ──
  function planBoardUrl() {   // HC-P-IT44-2
    var b = String(cfg().planBoard || '').trim(); if (b) return b.split('?')[0];
    var l = String(cfg().planList || '').trim().split('?')[0];
    return l.indexOf('/plans') >= 0 ? l.replace(/\/plans$/, '/plan-board') : '';
  }
  function refreshOn() { return !!makeUrl('makeAddIssue') && !!planBoardUrl(); }
  function readBoard(planId) {
    var u = planBoardUrl();
    return fetch(u + '?planId=' + encodeURIComponent(planId) + '&fresh=1', { method: 'GET' })
      .then(function (r) { return r.json().catch(function () { throw new Error('the plan data was not JSON (HTTP ' + r.status + ')'); }); })
      .then(function (j) { if (!j || j.ok === false || !j.plan) throw new Error((j && j.error) || 'the plan could not be read'); return j; });
  }
  // HC-P-RT-3: a block that holds anything makes the plan not qualify.
  function busyBlocks(b) {
    return (b.slots || []).filter(function (x) {
      return !!(x.asset && (x.asset.id || x.asset.missing)) || !!x.allocation || !!x.note || Number(x.listCount) > 0;
    });
  }
  function refreshLink(iss) {
    var k = keyOf(iss), ui = S.ui[k] || '';
    if (!refreshOn() || !iss.itemId || /^rf-/.test(ui) || ui === 'busy' || ui === 'confirm') return '';
    return '<button type="button" class="it-rf" data-it-refresh="' + esc(k) + '">Refresh slots</button>';
  }
  function refreshBox(iss) {
    var k = keyOf(iss), ui = S.ui[k] || '', r = S.rf[k] || {};
    if (ui === 'rf-check') return '<div class="it-note it-note--info">Checking this plan\u2026</div>';
    if (ui === 'rf-busy') return '<div class="it-note it-note--info">Refreshing slots\u2026 Scenario 126 is laying the Default Layout down.</div>';
    if (ui === 'rf-no') return '<div class="it-note it-note--bad">' + esc(r.why || 'Not refreshed.') +
      ' <button type="button" class="it-cancel" data-it-cancel="' + esc(k) + '">Close</button></div>';
    if (ui === 'rf-done') return '<div class="it-note it-note--ok">' + esc(r.done || 'Slots refreshed.') +
      ' <button type="button" class="it-cancel" data-it-cancel="' + esc(k) + '">Close</button></div>';
    if (ui !== 'rf-confirm') return '';
    var name = iss.title || 'this plan';
    return '<div class="it-confirm it-confirm--warn" role="group" aria-label="Confirm Refresh slots">' +
      '<p class="it-confirm-q"><strong>Refresh slots from the Default Layout?</strong> ' +
      'The ' + (r.rows === 1 ? '1 empty block' : r.rows + ' empty blocks') + ' on ' + esc(name) + ' ' + (r.rows === 1 ? 'is' : 'are') + ' deleted and the title\u2019s Default Layout is laid down again, each block with its design. ' +
      'Nothing is lost: none of them holds anything.</p>' +
      '<div class="it-confirm-row"><button type="button" class="it-btn it-btn--teal" data-it-rfgo="' + esc(k) + '">Refresh slots</button>' +
      '<button type="button" class="it-cancel" data-it-cancel="' + esc(k) + '">Cancel</button></div></div>';
  }
  function refreshCheck(iss) {
    var k = keyOf(iss);
    S.ui[k] = 'rf-check'; S.rf[k] = {}; renderZones();
    readBoard(iss.itemId).then(function (b) {
      if (S.ui[k] !== 'rf-check') return;                 // cancelled meanwhile
      if (b.plan.locked) { S.rf[k] = { why: 'Not refreshed: this plan is locked.' }; S.ui[k] = 'rf-no'; renderZones(); return; }
      var busy = busyBlocks(b), rows = (b.slots || []).length;
      if (!rows) { S.rf[k] = { why: 'Not refreshed: this plan has no blocks at all, so there is nothing to refresh. Add slots on the Picker instead.' }; S.ui[k] = 'rf-no'; renderZones(); return; }   // v1.0.45: 126 needs at least one row
      if (busy.length) {
        S.rf[k] = { why: 'Not refreshed: ' + (busy.length === 1 ? '1 block already holds' : busy.length + ' blocks already hold') +
          ' an article, an ad, a reserved print item, a list or a note. Refresh only works on a plan where nothing has been placed.' };
        S.ui[k] = 'rf-no'; renderZones(); return;
      }
      S.rf[k] = { rows: rows, ids: (b.slots || []).map(function (x) { return x.id; }) };
      S.ui[k] = 'rf-confirm'; renderZones();
    }, function (e) {
      if (S.ui[k] !== 'rf-check') return;
      S.rf[k] = { why: 'Not refreshed: the plan could not be read (' + ((e && e.message) || e) + ').' };
      S.ui[k] = 'rf-no'; renderZones();
    });
  }
  function refreshGo(iss) {
    var k = keyOf(iss), r = S.rf[k] || {}, url = requireMakeUrl('makeAddIssue', 'refresh slots');
    if (!url || S.ui[k] !== 'rf-confirm') return;
    var ta = String(cfg().taItemId || '').trim();
    S.ui[k] = 'rf-busy'; renderZones();
    var q = 'op=refresh&pubplanId=' + encodeURIComponent(iss.itemId) + '&titleAdminId=' + encodeURIComponent(ta) + '&expectRows=' + encodeURIComponent(r.rows || 0) +
            '&rowIds=' + encodeURIComponent((r.ids || []).join(',')) + '&planName=' + encodeURIComponent(iss.title || '');   // v1.0.45: 126 v2.11 deletes exactly these rows
    var fail = function (why) { S.rf[k] = { why: 'Not refreshed: ' + why }; S.ui[k] = 'rf-no'; renderZones(); };
    fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + q, { method: 'GET' })
      .then(function (res) { return res.text().then(function (t) { var j = null; try { j = JSON.parse(t); } catch (e) {} return { status: res.status, body: j }; }); })
      .then(function (x) {
        var j = x.body;
        if (!j) { fail('Scenario 126 answered HTTP ' + x.status + ' with no JSON. The plan may be half refreshed: open it and check its slots.'); return; }
        if (j.ok !== true) { fail(String(j.error || 'Scenario 126 refused') + (x.status ? ' (HTTP ' + x.status + ').' : '.')); return; }
        var created = Number(j.created) || 0;
        // TOAST-TRUTH: read the plan again and see the change
        return readBoard(iss.itemId).then(function (b) {
          var now = b.slots || [], old = {}; (r.ids || []).forEach(function (id) { old[id] = 1; });
          var left = now.filter(function (s2) { return old[s2.id]; }).length;
          if (left) { fail('126 answered done, but ' + left + ' of the old blocks are still on the plan. Open it and check its slots.'); return; }
          if (!created || now.length !== created) { fail('126 answered ' + created + ' blocks created, but the plan now has ' + now.length + '. Open it and check its slots.'); return; }
          S.rf[k] = { done: 'Slots refreshed from the Default Layout: ' + (created === 1 ? '1 block' : created + ' blocks') + '.' };
          S.ui[k] = 'rf-done'; renderZones();
          if (window.IxToast && IxToast.show) IxToast.show('Slots refreshed on ' + (iss.title || 'the plan'), 'ok', { detail: created + ' blocks from the Default Layout.' });
        }, function (e) { fail('126 answered done, but the plan could not be read back (' + ((e && e.message) || e) + '). Open it and check its slots.'); });
      }, function (e) { fail('the request to Scenario 126 failed (' + ((e && e.message) || e) + '). Open the plan and check its slots.'); });
  }

  function activeTile(iss) {
    var k = keyOf(iss);
    var ui = S.ui[k] || '';
    var rel = relative(iss);
    var canSet = !!iss.newsletterId && !!iss.itemId;

    var warn = ui === 'confirm' && otherNext(iss).length > 0;
    var h = '<article class="it-tile it-tile--active' + (ui === 'confirm' ? ' it-tile--confirm' : '') +
            (warn ? ' it-tile--confirm-warn' : '') +
            '" data-it-key="' + esc(k) + '">';
    h += codeRow(iss, 'active', 'it-code');
    h += '<div class="it-when">' + esc(formatWhen(iss) || 'No publication date') + '</div>';
    var sendTxt = formatSend(iss);                                                   // v1.0.43
    if (sendTxt) h += '<div class="it-send">Sends ' + esc(sendTxt) + '</div>';
    if (rel.text) {
      h += '<div class="it-rel' + (rel.past ? ' it-rel--warn' : '') + '">' +
           esc(rel.past && !rel.send ? 'Date has passed' : rel.text) + '</div>';
    }
    h += stepPill(iss);   // v1.0.41

    if (!iss.newsletterId) {
      h += '<div class="it-note it-note--warn">No newsletter is linked to this PubPlan, so it cannot be set as next. ' +
           'Link one in the PUBLICATION PLAN item.</div>';
    } else if (!iss.itemId) {
      h += '<div class="it-note it-note--warn">This tile has no PubPlan ID bound, so Set as Next cannot confirm its write.</div>';
    } else if (ui === 'unverified') {
      h += '<div class="it-note it-note--warn">Sent to Make, but the reply did not confirm the change. ' +
           'Reload the tab to see the real status.</div>';
    }
    h += strayNote(iss);
    h += refreshBox(iss);                                                            // v1.0.44

    if (ui === 'confirm') {
      h += '<div class="it-confirm' + (warn ? ' it-confirm--warn' : '') + '" role="group" aria-label="Confirm Set as Next">' +
             confirmHtml(iss) +
             '<div class="it-confirm-row">' +
               '<button type="button" class="it-btn it-btn--teal" data-it-confirm="' + esc(k) + '">Set as Next</button>' +
               '<button type="button" class="it-cancel" data-it-cancel="' + esc(k) + '">Cancel</button>' +
             '</div>' +
           '</div>';
    }

    h += '<div class="it-foot">' +
           '<span class="it-status"><span class="it-dot it-dot--progress"></span>In progress</span>' +
           '<span class="it-acts">' + refreshLink(iss) + editionBtn(iss);   // v1.0.44
    if (ui === 'busy') {
      h += '<button type="button" class="it-btn it-btn--busy" disabled data-it-busy="' + esc(k) + '">Setting…</button>';
    } else if (ui !== 'confirm') {
      h += '<button type="button" class="it-btn it-btn--sec" data-it-set="' + esc(k) + '"' +
           (canSet ? '' : ' disabled title="' + (iss.newsletterId ? 'No PubPlan ID bound' : 'No newsletter linked') + '"') +
           '>Set as Next</button>';
    }
    h += '</span></div></article>';
    return h;
  }

  function nextTile(iss) {
    var k = keyOf(iss);
    var ui = S.ui[k] || '';
    var rel = relative(iss);
    var st = nlStage(iss);
    var l = linkFor(iss, 'next');

    var icon, line, sub, cls, band = '';
    if (st.state === 'set') {
      cls = 'ok'; icon = ICON_CHECK; band = 'set';
      line = 'Vendor fully set up';
      sub = 'Goes live on the send date.';
    } else if (st.state === 'released') {
      cls = 'ok'; icon = ICON_CHECK; band = 'released';
      line = 'Released for distribution';
      sub = 'Waiting for the vendor to set it up.';
    } else if (st.state === 'building') {
      cls = 'ok'; icon = ICON_DOT; band = 'building';
      line = 'Still being built';
      sub = 'Newsletter is ' + (st.got || 'Draft') + '. Release it on Publish when it is ready.';
    } else if (st.state === 'nolink') {
      cls = 'bad'; icon = ICON_X;
      line = 'No newsletter is linked to this PubPlan';
      sub = 'Link one in the PUBLICATION PLAN item.';
    } else {
      cls = 'unknown'; icon = ICON_Q;
      line = 'Can\u2019t read the newsletter\u2019s status here';
      sub = 'Its NEWSLETTERS item is not in this page\u2019s newsletter list.';
    }

    var h = '<article class="it-next' + (band ? ' it-next--' + band : '') + (S.arrive === k ? ' it-next--arrive' : '') + '" data-it-key="' + esc(k) + '">';
    h += '<div class="it-next-id">';
    h += l.url
      ? '<a class="it-next-code"' + linkAttrs(l) + (l.newTab ? ' aria-label="' + esc(iss.title) + ', opens in a new tab"' : '') + '>' + esc(iss.title) + '</a>'
      : '<span class="it-next-code">' + esc(iss.title) + '</span>';
    h += '<div class="it-next-when">' + esc(formatWhen(iss) || 'No publication date') + '</div>';
    if (rel.text) h += '<div class="it-next-rel">' + esc(rel.text) + '</div>';
    h += stepPill(iss);   // v1.0.41
    h += '</div>';

    h += '<div class="it-next-side">';
    h += '<div class="it-check it-check--' + cls + '">' +
           '<span class="it-check-icon" role="img" aria-label="' +
             (band === 'building' ? 'In progress' : cls === 'ok' ? 'Done' : cls === 'bad' ? 'Problem' : 'Unknown') + '">' + icon + '</span>' +
           '<div><div class="it-check-line">' + esc(line) + '</div>' +
           '<div class="it-check-sub">' + esc(sub) + '</div></div>' +
         '</div>';
    if (ui === 'unverified') {
      h += '<div class="it-next-note">Retry was sent, but the reply did not confirm it. Reload the tab to see the real status.</div>';
    }
    h += '<div class="it-next-acts">';
    if (l.url) {
      // v1.0.27 — optional IPP view. Only the three IPP view names
      // are accepted; anything else falls back to the plain link.
      var nv = String(cfg().ippNextView || '').trim().toLowerCase();
      if (IPP_VIEW_NAMES.indexOf(nv) < 0) nv = '';
      var pl = nv ? { url: l.url + '#ipp-view=' + nv, newTab: l.newTab } : l;
      h += '<a class="it-btn it-btn--ongold"' + linkAttrs(pl) + '>' +
           (nv ? 'Open ' + nv.charAt(0).toUpperCase() + nv.slice(1) : 'Open PubPlan') + '</a>';
    }
    h += editionBtn(iss, 'it-clone-btn--ondark');
    h += '</div></div></article>';
    return h;
  }

  function archiveTile(iss) {
    return '<article class="it-tile it-tile--archive" data-it-key="' + esc(keyOf(iss)) + '">' +
      codeRow(iss, 'archive', 'it-code it-code--sm') +
      '<div class="it-when it-when--sm">' + esc(formatWhen(iss) || 'No publication date') + '</div>' +
      '<div class="it-foot it-foot--sm">' +
        '<span class="it-status"><span class="it-dot it-dot--sent"></span>Sent</span>' +
      '</div>' +
    '</article>';
  }

  function zoneHead(label, count) {
    return '<div class="it-zone-hdr"><h3 class="it-zone-label">' + esc(label) + '</h3>' +
           '<span class="it-zone-count">' + count + '</span></div>';
  }

  // ═══════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════

  function renderHeader() {
    var nameEl = document.querySelector('.pubplan-slot-wrapper[data-titleadmin-name]');
    var titleName = nameEl ? nameEl.dataset.titleadminName || '' : '';
    // v1.0.29 — new (126) beside legacy (103) while both are in use.
    var _ppAdd = makeUrl('makeAddIssue')
      ? '<button type="button" class="pp-add-btn" data-pp-add-btn data-pp-add-mode="slots">+ Add PubPlan · New</button>' +
        '<button type="button" class="pp-add-btn pp-add-btn--legacy" data-pp-add-btn data-pp-add-mode="legacy">+ Add PubPlan · Legacy</button>'
      : '<button type="button" class="pp-add-btn" data-pp-add-btn data-pp-add-mode="legacy">+ Add a PubPlan</button>';
    var _info = (window.IxInfo && typeof IxInfo.badge === 'function') ? IxInfo.badge({   // v1.0.44: the \u24D8 badge (standing rule)
      file: 'issues-tab-v1.0.45.js', version: '1.0.45', title: 'Pub Plans',
      blurb: 'Every PubPlan for this title. Next Newsletter on top, then In Planning, soonest first. Plans more than ' + FUTURE_DAYS +
             ' days out sit under Future plans, closed until you open it.\n\n' +
             'Refresh slots (on an In Planning or Future tile) lays the title\u2019s Default Layout down again on a plan where nothing has been placed yet. ' +
             'It checks the plan first and asks before it changes anything.',
      scenarios: [{ name: '126 \u00b7 K-4 Hydrate Issue', note: 'Add (New), Clone, + Edition, Refresh slots (op=refresh)' },
                  { name: '107 \u00b7 Promote Next', note: 'Set as Next' }, { name: '103 \u00b7 Add PubPlan', note: 'Add (Legacy)' }],
      companions: 'issues-tab-v1.0.23.css \u00b7 pathways: ix-issue-data v1.0.75 /plans (TA_CONFIG.planList) and /plan-board (TA_CONFIG.planBoard, or the /plans address swapped), Scenario 126 webhook (TA_CONFIG.makeAddIssue), Scenario 107 webhook (TA_CONFIG.makePromoteNext)'
    }) : '';
    return (window.IxHeader && IxHeader.render)
      ? IxHeader.render({ icon: '\uD83D\uDCCB', title: 'Pub Plans', actions: [_info, _ppAdd].filter(Boolean) })
      : '<div class="ix-hdr"><div class="ix-hdr-left">' +
        '<div class="ix-hdr-icon">\uD83D\uDCCB</div>' +
        '<div><h3>Pub Plans</h3><div class="ix-hdr-sub">' + esc(titleName) + '</div></div>' +
        '</div><div class="ix-hdr-right">' + _ppAdd + '</div></div>';
  }

  // ═══════════════════════════════════════════════════════════════
  // ZONES
  // ═══════════════════════════════════════════════════════════════

  function renderZones() {
    var root = document.getElementById('it-overview-root');
    if (!root) return;
    var y = window.scrollY;

    var next = [], active = [], archive = [];
    S.issues.forEach(function (iss) {
      var z = zoneOf(iss);
      if (z === 'next') next.push(iss);
      else if (z === 'archive') archive.push(iss);
      else active.push(iss);
    });
    next.sort(function (a, b) { return sortValue(a) - sortValue(b); });     // soonest first
    active.sort(function (a, b) { return sortValue(a) - sortValue(b); });   // soonest first (v1.0.37)
    archive.sort(function (a, b) { return sortValue(b) - sortValue(a); });

    var html = '';

    var missing = missingConfig();
    if (missing.length) {
      html += '<div class="it-config-warn" role="alert"><strong>Pub Plans is missing config.</strong> ' +
              'Add these to the T-A page head: ' + esc(missing.join(', ')) + '.</div>';
    }

    html += '<section class="it-zone it-zone--next">' + zoneHead('Next Newsletter', next.length);
    html += next.length
      ? '<div class="it-next-stack">' + next.map(nextTile).join('') + '</div>'
      : '<div class="it-next-empty"><strong>No newsletter is set as next</strong>' +
        'Pick a PubPlan that is In Planning and choose Set as Next.</div>';
    html += '</section>';

    // v1.0.44 — plans more than FUTURE_DAYS out sit under a closed fold (RT-10)
    var near = [], future = [];
    active.forEach(function (iss) { (isFuture(iss) ? future : near).push(iss); });
    html += '<section class="it-zone it-zone--active">' + zoneHead('In Planning', active.length);
    html += near.length
      ? '<div class="it-zone-grid it-zone-grid--active">' + near.map(activeTile).join('') + '</div>'
      : '<div class="it-zone-empty">' + (future.length ? 'Nothing in the next ' + FUTURE_DAYS + ' days.' : 'No issues in progress.') + '</div>';
    if (future.length) {
      html += '<div class="it-future"><button type="button" class="it-future-toggle" data-it-future-toggle aria-expanded="' + (S.showFuture ? 'true' : 'false') + '">' +
              '<span class="it-future-chev" aria-hidden="true">' + (S.showFuture ? '\u25BE' : '\u25B8') + '</span>Future plans <span class="it-zone-count">' + future.length + '</span>' +
              '<span class="it-future-sub">more than ' + FUTURE_DAYS + ' days out</span></button>' +
              (S.showFuture ? '<div class="it-zone-grid it-zone-grid--active it-future-grid">' + future.map(activeTile).join('') + '</div>' : '') + '</div>';
    }
    html += '</section>';

    if (archive.length) {
      var shown = S.showAllArchive ? archive : archive.slice(0, ARCHIVE_INITIAL);
      html += '<section class="it-zone it-zone--archive">' + zoneHead('Archive', archive.length) +
              '<div class="it-zone-grid it-zone-grid--archive">' + shown.map(archiveTile).join('') + '</div>';
      if (archive.length > ARCHIVE_INITIAL) {
        html += '<button type="button" class="it-more" data-it-archive-toggle>' +
                (S.showAllArchive ? 'Show fewer' : 'Show all ' + archive.length) + '</button>';
      }
      html += '</section>';
    }

    root.innerHTML = html;
    S.arrive = '';
    window.scrollTo(window.scrollX, y);   // never jump the view
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN
  // ═══════════════════════════════════════════════════════════════

  function render() {
    S.issues = gatherIssues();
    S.nl = gatherNewsletterStatuses();

    var scrollArea = document.querySelector('.pub-plan-scroll-area');
    var planZone   = document.querySelector('.pub-plan-zone');

    // Hide legacy DOM regions.
    var oldWrapper = scrollArea ? scrollArea.querySelector('.pubplan-collection-wrapper') : null;
    if (oldWrapper) oldWrapper.style.display = 'none';
    var firstCol = document.querySelector('.pub-plan-first-column');
    if (firstCol) firstCol.style.display = 'none';
    var legacyModal = document.getElementById('pubplan-modal');
    if (legacyModal) legacyModal.style.display = 'none';
    if (planZone) planZone.style.display = 'none';

    var mountSibling = planZone || scrollArea;
    if (!mountSibling) {
      console.warn('[Issues] no mount point found (.pub-plan-zone or .pub-plan-scroll-area).');
      return;
    }

    if (!S.issues.length) {
      var pubplanItemPresent = !!document.querySelector('.pubplan-item');
      var slotWrapperPresent = !!document.querySelector('.pubplan-item .pubplan-slot-wrapper');
      var nameBindingPresent = !!document.querySelector('.pubplan-item .pubplan-name');
      if (!pubplanItemPresent) {
        console.warn('[Issues] gatherIssues returned 0 issues — no .pubplan-item elements found. Designer class binding likely missing.');
      } else if (!slotWrapperPresent) {
        console.warn('[Issues] gatherIssues returned 0 issues — .pubplan-item present but no .pubplan-slot-wrapper inside.');
      } else if (!nameBindingPresent) {
        console.warn('[Issues] gatherIssues returned 0 issues — .pubplan-name element missing.');
      } else {
        console.warn('[Issues] gatherIssues returned 0 issues — .pubplan-name text is empty on every row. Check the TITLE-WEEK binding.');
      }
      mountSibling.insertAdjacentHTML('beforebegin',
        renderHeader() +
        '<div class="it-overview it-overview-empty ix-own">' +
          '<div class="it-empty-state">No PubPlans yet.</div>' +
        '</div>'
      );
      return;
    }

    if (S.issues.every(function (i) { return !i.newsletterId; })) {
      console.warn('[Issues] No PubPlan has data-newsletter-id bound — Set as Next and the Next check cannot work. ' +
                   'Designer binding (.pubplan-slot-wrapper → NEWSLETTER Item ID) likely missing.');
    }
    if (!document.querySelector('.newsletter-source [data-nl-id]')) {
      console.warn('[Issues] No .newsletter-source [data-nl-id] on this page — Next tiles will show "can\u2019t check".');
    }
    var missing = missingConfig();
    if (missing.length) console.error('[Issues] Missing TA_CONFIG keys: ' + missing.join(', '));

    mountSibling.insertAdjacentHTML('beforebegin',
      renderHeader() + '<div class="it-overview ix-own" id="it-overview-root"></div>');
    renderZones();
    loadPublishSteps();   // v1.0.41

    var counts = { next: 0, active: 0, archive: 0 };
    S.issues.forEach(function (i) { counts[zoneOf(i)]++; });
    console.log('[Issues] Rendered — Next: ' + counts.next + ', In Planning: ' + counts.active + ', Archive: ' + counts.archive);
  }


  // ════════════════════════════════════════════════════════════
  // ADD PUBPLAN MODAL (restored v1.0.5, from pubplan-overview-v1.0.12)
  // ════════════════════════════════════════════════════════════

  function readTaContext() {
    var item = document.querySelector('.ta-item')
            || document.querySelector('[data-ta]');
    if (!item) {
      console.error('[PubPlan Add] ta-item wrapper not found');
      return null;
    }
    var taId        = item.getAttribute('data-ta')       || '';
    var publisherId = item.getAttribute('data-pub')      || '';
    var titleSlug   = item.getAttribute('data-ta-slug')  || '';
    var taShort     = (item.getAttribute('data-ta-short') || '').trim().toUpperCase();

    if (!taId || !publisherId) {
      console.error('[PubPlan Add] missing required IDs', {
        taId: taId, publisherId: publisherId
      });
      return null;
    }
    return {
      taId: taId,
      publisherId: publisherId,
      titleSlug: titleSlug,
      taShort: taShort
    };
  }

  // Parse the suggested next issue number from existing issue names.
  // Returns the next number (max + 1) when at least one issue parses,
  // or null if there are no existing issues (brand-new T-A).
  //
  // v1.0.10 — TWO FIXES:
  //   (a) SOURCE. Read `.pubplan-name` (TITLE-WEEK, e.g. "WLN-118B"),
  //       not `.pubplan-id`. `.pubplan-id` was retired in the v1.0.4
  //       Designer cleanup — the element may still be in the DOM but
  //       nothing is bound to it, so this function has silently
  //       returned null on every render since. The modal has been
  //       falling back to "1" (or blank) the whole time.
  //   (b) SUFFIX TOLERANCE. Old pattern /^([A-Za-z0-9]+)-(\d+)$/
  //       anchors digits to end-of-string, so "WLN-118B" never
  //       matched. A title whose newest issue carried a suffix lost
  //       its suggestion entirely. New pattern captures the stem and
  //       ignores whatever trails it.
  //
  //   Abbreviation is still NOT parsed here — it comes from
  //   data-ta-short on the ta-item wrapper (HC-011 stays retired).
  function parseNextIssueNumber() {
    var nameEls = document.querySelectorAll('.pubplan-name');
    if (!nameEls.length) return null;

    // ABBR "-" <digits> <optional suffix>
    //   WLN-118    → stem 118
    //   WLN-118B   → stem 118
    //   WLN-118-B2 → stem 118
    var pattern = /^(.+)-(\d+)([A-Za-z0-9-]*)$/;
    var maxNum = 0;
    var anyMatched = false;

    Array.prototype.forEach.call(nameEls, function (el) {
      var raw = (el.textContent || '').trim();
      var m = raw.match(pattern);
      if (!m) return;
      anyMatched = true;
      var num = parseInt(m[2], 10);
      if (num > maxNum) maxNum = num;
    });

    if (!anyMatched) {
      console.warn('[PubPlan Add] no .pubplan-name matched ABBR-NNN[suffix] — next-number suggestion unavailable.');
    }
    return anyMatched ? (maxNum + 1) : null;
  }

  // Build modal HTML. Three layouts based on context:
  //   1. Auto-fill (taShort present + existing issues): prefix shown,
  //      number pre-filled to max+1.
  //   2. Auto-fill, fresh T-A (taShort present, zero issues): prefix
  //      shown, number defaults to 1.
  //   3. Manual abbreviation (no taShort, edge case): editable
  //      abbreviation field — only happens if Designer binding is
  //      missing. Logged to console as a deployment warning.
  function renderModalHtml(context, nextNumber) {
    var todayIso = (function () {
      var d = new Date();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return d.getFullYear() + '-' + m + '-' + day;
    })();

    var hasShort = !!context.taShort;
    var defaultNumber = nextNumber || 1;

    var issueRow;
    if (hasShort) {
      // Auto-fill mode (covers both existing-issues and fresh-T-A)
      issueRow =
        '<div class="ppm-field">' +
          '<label class="ppm-label" for="ppm-number">Issue Number</label>' +
          '<div class="ppm-issue-row">' +
            '<span class="ppm-prefix" data-pp-add-prefix>' + esc(context.taShort) + '-</span>' +
            // v1.0.10: type="text". A number input blanks its own value
            // on "118B" — that was the whole alphanumeric blocker.
            '<input type="text" id="ppm-number" class="ppm-input ppm-number-input" ' +
              'data-pp-add-number value="' + esc(String(defaultNumber)) + '" ' +
              'inputmode="text" autocomplete="off" spellcheck="false">' +
          '</div>' +
          '<div class="ppm-help">' + (_addMode === 'slots'
            ? 'Every issue starts as edition A. Add more editions with + Edition on its tile.'
            : 'Add a letter only for a second edition of the same issue — e.g. 118B.') + '</div>' +
          '<div class="ppm-preview" data-pp-add-preview>Plan name: ' +
            esc(context.taShort) + '-' + defaultNumber + (_addMode === 'slots' ? 'A' : '') +
          '</div>' +
        '</div>';
    } else {
      // Manual abbreviation mode (deployment fallback — data-ta-short
      // not bound in Designer). Logs a warning to surface the missing
      // CMS binding to the developer.
      console.warn('[PubPlan Add] data-ta-short missing on ta-item — Designer binding required for auto-fill.');
      issueRow =
        '<div class="ppm-field">' +
          '<label class="ppm-label" for="ppm-abbr">Abbreviation</label>' +
          '<input type="text" id="ppm-abbr" class="ppm-input" data-pp-add-abbr ' +
            'placeholder="e.g. WLN" maxlength="8" autocomplete="off">' +
          '<div class="ppm-help">3–4 letter prefix used for issue IDs</div>' +
        '</div>' +
        '<div class="ppm-field">' +
          '<label class="ppm-label" for="ppm-number">Issue Number</label>' +
          '<input type="text" id="ppm-number" class="ppm-input" ' +
            'data-pp-add-number value="' + esc(String(defaultNumber)) + '" ' +
            'inputmode="text" autocomplete="off" spellcheck="false">' +
          '<div class="ppm-help">Add a letter only for a second edition of the same issue — e.g. 118B.</div>' +
          '<div class="ppm-preview" data-pp-add-preview>Preview: —</div>' +
        '</div>';
    }

    return '' +
      '<div class="ppm-backdrop" data-pp-add-backdrop>' +
        '<div class="ppm-modal" role="dialog" aria-modal="true" aria-labelledby="ppm-title">' +
          '<div class="ppm-hdr">' +
            '<h3 id="ppm-title">' + (_addMode === 'slots' ? 'Add a PubPlan · New' : (makeUrl('makeAddIssue') ? 'Add a PubPlan · Legacy' : 'Add a PubPlan')) + '</h3>' +
            '<button type="button" class="ppm-close" data-pp-add-cancel aria-label="Close">×</button>' +
          '</div>' +
          '<div class="ppm-body">' +
            '<div class="ppm-error" data-pp-add-error hidden></div>' +
            issueRow +
            (true ? '' :    // v1.0.31 — no scenario reads these (103 and 126 checked)
            '<div class="ppm-field">' +
              '<label class="ppm-label" for="ppm-edition">Edition</label>' +
              '<input type="text" id="ppm-edition" class="ppm-input" ' +
                'data-pp-add-edition placeholder="e.g. Holiday, Spring" autocomplete="off">' +
            '</div>' +
            '<div class="ppm-field">' +
              '<label class="ppm-label" for="ppm-name">Name</label>' +
              '<input type="text" id="ppm-name" class="ppm-input" ' +
                'data-pp-add-name autocomplete="off">' +
            '</div>') +
            '<div class="ppm-field">' +
              '<label class="ppm-label" for="ppm-date">Publication Date</label>' +
              '<input type="date" id="ppm-date" class="ppm-input" ' +
                'data-pp-add-date value="' + todayIso + '" autocomplete="off">' +
            '</div>' +
          '</div>' +
          '<div class="ppm-actions">' +
            '<a href="javascript:void(0)" class="ppm-cancel-link" data-pp-add-cancel>Cancel</a>' +
            '<button type="button" class="ppm-create-btn" data-pp-add-submit>Create →</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // Single open instance at a time. Tracks ESC handler ref for clean teardown.
  var _modalEscHandler = null;

  // v1.0.29 — which Add the open modal runs: 'slots' (126) or 'legacy' (103).
  var _addMode = 'legacy';

  function openAddPubplanModal() {
    var context = readTaContext();
    if (!context) {
      window.alert('Cannot add a PubPlan: missing T-A context. Please reload the page.');
      return;
    }

    // Avoid duplicate modals
    var existing = document.querySelector('[data-pp-add-backdrop]');
    if (existing) return;

    var nextNumber = parseNextIssueNumber();
    var html = renderModalHtml(context, nextNumber);
    document.body.insertAdjacentHTML('beforeend', html);

    var backdrop = document.querySelector('[data-pp-add-backdrop]');
    if (!backdrop) return;

    // ESC to close
    _modalEscHandler = function (e) {
      if (e.key === 'Escape') closeAddPubplanModal();
    };
    document.addEventListener('keydown', _modalEscHandler);

    // Click backdrop (but not modal body) to close
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeAddPubplanModal();
    });

    // Cancel buttons (× and text link)
    Array.prototype.forEach.call(
      backdrop.querySelectorAll('[data-pp-add-cancel]'),
      function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          closeAddPubplanModal();
        });
      }
    );

    // Live preview update on number/abbr change
    var numberInput = backdrop.querySelector('[data-pp-add-number]');
    var abbrInput   = backdrop.querySelector('[data-pp-add-abbr]');
    var previewEl   = backdrop.querySelector('[data-pp-add-preview]');

    function updatePreview() {
      var abbr = '';
      if (context.taShort) {
        abbr = context.taShort;
      } else if (abbrInput) {
        abbr = (abbrInput.value || '').trim().toUpperCase();
      }
      var num = numberInput ? (numberInput.value || '').trim() : '';
      if (previewEl) {
        var lead = 'Plan name: ';   // v1.0.31
        var shown = num.toUpperCase();
        if (_addMode === 'slots' && /^\d+$/.test(shown)) shown += 'A';   // v1.0.36
        previewEl.textContent = (abbr && num) ? (lead + abbr + '-' + shown) : lead + '—';
      }
    }
    if (numberInput) {
      // v1.0.10: force-uppercase the alpha suffix as the operator types,
      // preserving caret position — same treatment the abbreviation
      // field has always had. Safe because the value is digit-led.
      numberInput.addEventListener('input', function () {
        var pos = numberInput.selectionStart;
        var up  = numberInput.value.toUpperCase();
        if (up !== numberInput.value) {
          numberInput.value = up;
          try { numberInput.setSelectionRange(pos, pos); } catch (e) {}
        }
        updatePreview();
      });
    }
    if (abbrInput) {
      abbrInput.addEventListener('input', function () {
        // Force uppercase as user types
        var pos = abbrInput.selectionStart;
        abbrInput.value = abbrInput.value.toUpperCase();
        try { abbrInput.setSelectionRange(pos, pos); } catch (e) {}
        updatePreview();
      });
    }

    // Submit button
    var submitBtn = backdrop.querySelector('[data-pp-add-submit]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        handleAddPubplanSubmit(context, backdrop);
      });
    }

    // Focus the most relevant input
    setTimeout(function () {
      var firstInput = abbrInput || numberInput;
      if (firstInput) {
        firstInput.focus();
        if (firstInput === numberInput) firstInput.select();
      }
    }, 50);
  }

  function closeAddPubplanModal() {
    var backdrop = document.querySelector('[data-pp-add-backdrop]');
    if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    if (_modalEscHandler) {
      document.removeEventListener('keydown', _modalEscHandler);
      _modalEscHandler = null;
    }
  }

  // Validate inputs, fire the webhook, handle success/failure.
  //
  // v1.0.12: switched from POST + JSON body to GET + URLSearchParams.
  // Make's Custom Webhook parses query params automatically into
  // separate bundle items, eliminating the need to manually define
  // the data structure or deal with JSON pass-through quirks.
  function handleAddPubplanSubmit(context, backdrop) {
    var errEl     = backdrop.querySelector('[data-pp-add-error]');
    var submitBtn = backdrop.querySelector('[data-pp-add-submit]');
    var cancelLnk = backdrop.querySelector('.ppm-cancel-link');
    var numberInput  = backdrop.querySelector('[data-pp-add-number]');
    var abbrInput    = backdrop.querySelector('[data-pp-add-abbr]');
    var editionInput = backdrop.querySelector('[data-pp-add-edition]');
    var nameInput    = backdrop.querySelector('[data-pp-add-name]');
    var dateInput    = backdrop.querySelector('[data-pp-add-date]');

    function showError(msg) {
      if (!errEl) return;
      errEl.textContent = msg;
      errEl.hidden = false;
    }
    function clearError() {
      if (!errEl) return;
      errEl.hidden = true;
      errEl.textContent = '';
    }
    clearError();

    // Abbreviation: prefer CMS-bound taShort, else manual entry.
    var abbreviation = context.taShort
      || ((abbrInput && abbrInput.value) || '').trim().toUpperCase();

    // v1.0.10 DUAL-WRITE SPLIT.
    //   issueLabel  — the full operator string, "118B". Text-safe.
    //   issueNumber — the leading numeric stem, "118". Number-field-safe.
    // Nothing is required (v1.0.7 decision stands) — blank submits.
    var issueLabel      = numberInput  ? (numberInput.value  || '').trim().toUpperCase() : '';
    var edition         = editionInput ? (editionInput.value || '').trim() : '';
    var name            = nameInput    ? (nameInput.value    || '').trim() : '';
    var publicationDate = dateInput    ? (dateInput.value    || '').trim() : '';

    if (_addMode === 'slots' && /^\d+$/.test(issueLabel)) issueLabel += 'A';   // v1.0.36
    var stemMatch   = issueLabel.match(/^(\d+)/);
    var issueNumber = stemMatch ? stemMatch[1] : '';

    // FORMAT guard, not a required-field guard. A blank issue value is
    // still allowed through. But a NON-BLANK value that doesn't lead
    // with a digit yields no stem, which would push an empty string at
    // Webflow's Number field and blow up the create. Catch it here with
    // a readable message instead of a 400 from Make.
    if (issueLabel && !stemMatch) {
      showError('Issue must start with a number (e.g. 118 or 118B). "' + issueLabel + '" has no numeric part.');
      if (numberInput) { numberInput.focus(); numberInput.select(); }
      return;
    }

    var issueName = abbreviation ? (abbreviation + '-' + issueLabel) : issueLabel;

    // Build query string. Make's Custom Webhook will parse each
    // param into a separate bundle item — no data structure setup
    // needed on the Make side.
    var params = new URLSearchParams({
      taId:            context.taId,
      publisherId:     context.publisherId,
      titleSlug:       context.titleSlug,
      issueName:       issueName,
      issueNumber:     issueNumber,   // stem  → issue-number (Number)
      issueLabel:      issueLabel,    // full  → issue-number-display (Text)
      edition:         edition,
      name:            name,
      abbreviation:    abbreviation,
      publicationDate: publicationDate,
      editionLetter:   (issueLabel.match(/[A-Z]+$/) || ['A'])[0]   // v1.0.34
    });
    var addMode  = _addMode;
    var addUrl   = requireMakeUrl(addMode === 'slots' ? 'makeAddIssue' : 'makeAddPubplan', 'create a PubPlan');
    var addScen  = addMode === 'slots' ? 'Scenario 126' : 'Scenario 103';
    if (!addUrl) return;
    var url = addUrl + '?' + params.toString();

    // Lock UI during the request
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating…';
    }
    if (cancelLnk) cancelLnk.style.pointerEvents = 'none';

    // v1.0.10 TOAST-TRUTH. A 2xx is necessary but not sufficient —
    // we diff the echoed fieldData against what we sent, field by
    // field, before we are allowed to say "created".
    var expected = {
      'name':                 issueName,
      'issue-number':         issueNumber,
      'issue-number-display': issueLabel
    };

    fetch(url, { method: 'GET' })
      .then(function (res) {
        // v1.0.29 — 126 refuses with 409/422 and a JSON reason; read it.
        return res.text().then(function (t) {
          if (res.ok) return t;
          try { var p = JSON.parse(t); if (p && p.ok === false) return t; } catch (e) {}
          throw new Error('HTTP ' + res.status);
        });
      })
      .then(function (raw) {
        var payload = null;
        try { payload = JSON.parse(raw); } catch (e) { payload = null; }

        var echoed = payload && payload.fieldData;

        // v1.0.29 — 126 says no in its body (name taken, Webflow refused).
        if (payload && payload.ok === false) {
          showError('Nothing was created: ' + (payload.error || 'the scenario refused') + '.');
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create →'; }
          if (cancelLnk) cancelLnk.style.pointerEvents = '';
          return;
        }

        // No echo → Scenario 103 blueprint v1.1 not imported yet, or an
        // older response shape. We will NOT claim a verified success.
        if (!echoed) {
          console.warn('[PubPlan Add] no fieldData echo in webhook response — cannot verify the write.', raw);
          showUnverifiedAndReload(issueName);
          return;
        }

        var mismatches = [];
        Object.keys(expected).forEach(function (k) {
          var want = String(expected[k] == null ? '' : expected[k]).trim();
          var got  = String(echoed[k]  == null ? '' : echoed[k]).trim();
          // issue-number comes back from a Webflow Number field, so it
          // may arrive as 118 rather than "118" — String() both sides.
          if (want !== got) mismatches.push(k + ': sent "' + want + '", stored "' + got + '"');
        });

        if (mismatches.length) {
          console.error('[PubPlan Add] write verification FAILED', mismatches);
          showError('PubPlan was created but stored the wrong values — ' +
                    mismatches.join(' · ') + '. Check ' + addScen + ' mappings before retrying.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create →';
          }
          if (cancelLnk) cancelLnk.style.pointerEvents = '';
          return;
        }

        showSuccessAndReload(echoed.name || issueName);
      })
      .catch(function (err) {
        console.error('[PubPlan Add] webhook failed:', err);
        showError('Failed to create PubPlan: ' + (err.message || 'unknown error') + '. Please try again.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create →';
        }
        if (cancelLnk) cancelLnk.style.pointerEvents = '';
      });
  }

  // Universal return rule (v1.0.16). Delegates to ix-return when it's
  // present; falls back to a plain reload when it isn't, so this file
  // never hard-depends on the script tag being added first.
  function ixReload(delayMs) {
    if (window.IxReturn && typeof window.IxReturn.reload === 'function') {
      window.IxReturn.reload({ delay: delayMs || 0 });
      return;
    }
    console.warn('[Issues tab] ix-return-v1.0.0.js not loaded — reloading without tab return.');
    setTimeout(function () { window.location.reload(); }, delayMs || 0);
  }

  // Persistent toast → 1s delay → reload. Mirrors the Studio
  // studioReloadAfterCMSWrite pattern (TD-134 candidate for
  // shared-helper extraction).
  function showSuccessAndReload(issueName) {
    closeAddPubplanModal();
    var toast = document.createElement('div');
    toast.className = 'ppm-success-banner';
    toast.innerHTML = '<span class="ppm-success-icon">✓</span> ' +
      esc(issueName) + ' created — refreshing…';
    document.body.appendChild(toast);
    ixReload(1000);
  }

  // v1.0.10: the request succeeded but the response carried no
  // fieldData echo, so we cannot confirm WHAT was written. Say that
  // plainly rather than showing a green check we haven't earned.
  // Expected only until Scenario 103 blueprint v1.1 is imported.
  function showUnverifiedAndReload(issueName) {
    closeAddPubplanModal();
    var toast = document.createElement('div');
    toast.className = 'ppm-success-banner ppm-success-banner--unverified';
    toast.innerHTML = '<span class="ppm-success-icon">?</span> ' +
      esc(issueName) + ' submitted — could not verify the write. Refreshing…';
    document.body.appendChild(toast);
    ixReload(1400);
  }

  // v1.0.28 — a slots clone reports what it left behind and what needs
  // an OK. Green when nothing to act on (auto refresh); salmon when
  // something is, and then it waits for "Got it".
  function showCloneReport(issueName, p) {
    var acks    = Number(p && p.ackCount) || 0;
    var dropped = (p && Array.isArray(p.dropped)) ? p.dropped : [];
    var bad     = (p && p.rows && Array.isArray(p.rows.results))
                    ? p.rows.results.filter(function (r) { return !r || r.ok !== true; }).length : 0;
    var made    = Number(p && p.blockCount) || 0;
    if (!acks && !dropped.length && !bad) { showSuccessAndReload(issueName); return; }
    var parts = [];
    parts.push(esc(issueName) + ' created · ' + (made - bad) + ' of ' + made + ' slots copied');
    if (bad) parts.push('<strong>' + bad + ' slot' + (bad === 1 ? '' : 's') + ' failed to copy</strong>');
    if (acks) parts.push(acks + ' ad' + (acks === 1 ? '' : 's') + ' to approve');
    var lines = dropped.map(function (d) {
      return esc(d.name || d.eventId) + (d.lastDate ? ' (ended ' + esc(d.lastDate) + ')' : '');
    });
    var toast = document.createElement('div');
    toast.className = 'ppm-success-banner ppm-success-banner--attn';
    toast.innerHTML = '<span class="ppm-success-icon">!</span>' +
      '<span class="ppm-report"><span>' + parts.join(' · ') + '</span>' +
      (lines.length ? '<span class="ppm-report-sub">' + lines.length + ' past event' +
        (lines.length === 1 ? '' : 's') + ' not carried over: ' + lines.join(', ') + '</span>' : '') +
      '</span><button type="button" class="ppm-report-ok">Got it</button>';
    document.body.appendChild(toast);
    toast.querySelector('.ppm-report-ok').addEventListener('click', function () { ixReload(0); });
  }

  // ── Click delegation for the +Add a PubPlan button ──
  // Delegated because renderHeader() rebuilds the button on every
  // render(), so a direct binding would go stale.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-pp-add-btn]');
    if (!btn) return;
    e.preventDefault();
    if (document.querySelector('[data-pp-add-backdrop]')) return;
    _addMode = btn.getAttribute('data-pp-add-mode') === 'slots' ? 'slots' : 'legacy';   // v1.0.29
    openAddPubplanModal();
  });

  // ════════════════════════════════════════════════════════════
  // CLONE A PUBPLAN (NEW v1.0.11) — legacy path
  // ════════════════════════════════════════════════════════════

  // Suggest the next edition suffix from a source title.
  //   WLN-118A → 118B      (advance the letter)
  //   WLN-118  → 118A      (first sibling edition)
  //   WLN-118Z → 118AA     (rare, but don't produce garbage)
  // Returns the LABEL only (no abbreviation prefix).
  function suggestCloneLabel(sourceTitle) {
    var m = String(sourceTitle || '').match(/^(?:.+-)?(\d+)([A-Za-z]*)$/);
    if (!m) return '';
    var stem   = m[1];
    var suffix = (m[2] || '').toUpperCase();
    if (!suffix) return stem + 'A';
    if (suffix.slice(-1) === 'Z') return stem + suffix + 'A';
    var last = suffix.slice(-1);
    return stem + suffix.slice(0, -1) + String.fromCharCode(last.charCodeAt(0) + 1);
  }

  // Split a source title into its fixed stem and the suffix the
  // operator is actually choosing.
  //   "WLN-118"  -> { stem: "WLN-118", suffix: "A" }   (first sibling)
  //   "WLN-118A" -> { stem: "WLN-118", suffix: "B" }   (next letter)
  // Falls back to a free-text whole-label field if the title does not
  // parse, so an odd legacy name can still be cloned.
  function splitCloneTarget(sourceTitle) {
    var m = String(sourceTitle || '').match(/^(.*?)(\d+)([A-Za-z]*)$/);
    if (!m) return null;
    var stem = m[1] + m[2];                 // "WLN-118"
    var suffix = (m[3] || '').toUpperCase();
    var next;
    if (!suffix) {
      next = 'A';
    } else if (suffix.slice(-1) === 'Z') {
      next = suffix + 'A';
    } else {
      next = suffix.slice(0, -1) +
             String.fromCharCode(suffix.charCodeAt(suffix.length - 1) + 1);
    }
    return { stem: stem, suffix: next };
  }

  function renderCloneModalHtml(context, sourceName, suggested, todayIso) {
    var split = splitCloneTarget(sourceName);
    // Locked segment: everything the operator cannot change. Reuses
    // .ppm-prefix so it reads as one continuous identifier.
    var prefixRow = split
      ? '<span class="ppm-prefix">' + esc(split.stem) + '</span>'
      : (context.taShort
          ? '<span class="ppm-prefix">' + esc(context.taShort) + '-</span>'
          : '');
    var fieldValue = split ? split.suffix : suggested;
    var previewNow = split ? (split.stem + split.suffix)
                           : (context.taShort ? context.taShort + '-' + suggested : suggested);
    return '' +
      '<div class="ppm-backdrop" data-pp-clone-backdrop>' +
        '<div class="ppm-modal" role="dialog" aria-modal="true" aria-labelledby="ppc-title">' +
          '<div class="ppm-hdr">' +
            '<h3 id="ppc-title">Clone ' + esc(sourceName) + '</h3>' +
            '<button type="button" class="ppm-close" data-pp-clone-cancel aria-label="Close">&times;</button>' +
          '</div>' +
          '<div class="ppm-body">' +
            '<div class="ppm-error" data-pp-clone-error hidden></div>' +
            '<div class="ppm-clone-note">' +
              'Every section is <strong>copied</strong> from ' + esc(sourceName) + ' &mdash; ' +
              'articles, ads, real estate and events. Edit this edition freely; ' +
              esc(sourceName) + ' is not affected.' +
            '</div>' +
            '<div class="ppm-field">' +
              '<label class="ppm-label" for="ppc-number">New Edition</label>' +
              '<div class="ppm-issue-row">' + prefixRow +
                '<input type="text" id="ppc-number" class="ppm-input ppm-number-input" ' +
                  'data-pp-clone-number value="' + esc(fieldValue) + '" ' +
                  'inputmode="text" autocomplete="off" spellcheck="false" ' +
                  'maxlength="4" style="max-width:80px;">' +
              '</div>' +
              '<div class="ppm-preview" data-pp-clone-preview>Preview: ' +
                esc(previewNow) +
              '</div>' +
            '</div>' +
            '<div class="ppm-field">' +
              '<label class="ppm-label" for="ppc-date">Publication Date</label>' +
              '<input type="date" id="ppc-date" class="ppm-input" ' +
                'data-pp-clone-date value="' + todayIso + '" autocomplete="off">' +
            '</div>' +
          '</div>' +
          cloneModeRow() +
          '<div class="ppm-actions">' +
            '<a href="javascript:void(0)" class="ppm-cancel-link" data-pp-clone-cancel>Cancel</a>' +
            '<button type="button" class="ppm-create-btn" data-pp-clone-submit>Clone &rarr;</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  var _cloneEscHandler = null;

  function closeCloneModal() {
    _cloneSplit = null;
    var b = document.querySelector('[data-pp-clone-backdrop]');
    if (b && b.parentNode) b.parentNode.removeChild(b);
    if (_cloneEscHandler) {
      document.removeEventListener('keydown', _cloneEscHandler);
      _cloneEscHandler = null;
    }
  }

  // Split for the currently-open clone modal. Held at module scope so
  // the preview + submit handlers can recombine stem + suffix without
  // re-parsing the source title on every keystroke.
  var _cloneSplit = null;

  // v1.0.28 — which clone runs. 'slots' = Scenario 126 (NL-BLOCKS),
  // 'legacy' = 103-CLONE (old picker records).
  function cloneModes() {
    var m = [];
    if (makeUrl('makeCloneIssue')) m.push('slots');
    if (makeUrl('makeClonePubplan')) m.push('legacy');
    return m;
  }
  function cloneDefaultMode() {
    var m = cloneModes();
    var want = String((window.TA_CONFIG && window.TA_CONFIG.cloneDefault) || 'legacy').toLowerCase();
    return m.indexOf(want) !== -1 ? want : (m[0] || 'legacy');
  }
  function cloneModeRow() {
    if (cloneModes().length < 2) return '';
    var d = cloneDefaultMode();
    var opt = function (val, label, note) {
      return '<label class="ppm-mode-opt">' +
        '<input type="radio" name="ppc-mode" value="' + val + '" data-pp-clone-mode' + (d === val ? ' checked' : '') + '> ' +
        '<span><strong>' + label + '</strong> <em>' + note + '</em></span></label>';
    };
    return '<div class="ppm-body ppm-mode-row">' +
      '<div class="ppm-label">Copy into</div>' +
      opt('slots', 'Slots', 'the IPP Picker; ended events left out, ads to approve') +
      opt('legacy', 'Legacy pickers', '103-CLONE, as before') +
      '</div>';
  }

  function openCloneModal(sourceId, sourceName) {
    // v1.0.21 — no source, no clone. Without this the modal opens,
    // the operator fills it in, and 103-CLONE dies at module 2 on a
    // missing item_id. Fail before the form, not after the submit.
    if (!sourceId) {
      console.error('[PubPlan Clone] card has no data-clone-pubplan-id — cannot clone.', sourceName);
      window.alert('Cannot clone ' + (sourceName || 'this issue') +
                   ': its PubPlan ID is not bound on the card. Reload the page; if it persists, the Designer binding for data-clone-pubplan-id is missing.');
      return;
    }

    var context = readTaContext();
    if (!context) {
      window.alert('Cannot clone: missing T-A context. Please reload the page.');
      return;
    }
    if (document.querySelector('[data-pp-clone-backdrop]')) return;

    var todayIso = (function () {
      var d = new Date();
      return d.getFullYear() + '-' +
             String(d.getMonth() + 1).padStart(2, '0') + '-' +
             String(d.getDate()).padStart(2, '0');
    })();

    _cloneSplit = splitCloneTarget(sourceName);
    document.body.insertAdjacentHTML('beforeend',
      renderCloneModalHtml(context, sourceName, suggestCloneLabel(sourceName), todayIso));

    var backdrop = document.querySelector('[data-pp-clone-backdrop]');
    if (!backdrop) return;

    _cloneEscHandler = function (e) { if (e.key === 'Escape') closeCloneModal(); };
    document.addEventListener('keydown', _cloneEscHandler);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closeCloneModal();
    });
    Array.prototype.forEach.call(
      backdrop.querySelectorAll('[data-pp-clone-cancel]'),
      function (el) {
        el.addEventListener('click', function (e) { e.preventDefault(); closeCloneModal(); });
      }
    );

    var numberInput = backdrop.querySelector('[data-pp-clone-number]');
    var previewEl   = backdrop.querySelector('[data-pp-clone-preview]');
    if (numberInput) {
      numberInput.addEventListener('input', function () {
        var pos = numberInput.selectionStart;
        var up  = numberInput.value.toUpperCase();
        if (up !== numberInput.value) {
          numberInput.value = up;
          try { numberInput.setSelectionRange(pos, pos); } catch (e) {}
        }
        var v = numberInput.value.trim();
        if (previewEl) {
          // v1.0.17: the input holds only the suffix; the stem is the
          // locked segment to its left. Recombine for the preview so
          // what's shown matches what will actually be written.
          var full = _cloneSplit ? (_cloneSplit.stem + v)
                   : (context.taShort ? context.taShort + '-' + v : v);
          previewEl.textContent = v ? ('Preview: ' + full) : 'Preview: —';
        }
      });
    }

    var submitBtn = backdrop.querySelector('[data-pp-clone-submit]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        handleCloneSubmit(context, backdrop, sourceId);
      });
    }

    setTimeout(function () {
      if (numberInput) { numberInput.focus(); numberInput.select(); }
    }, 50);
  }

  function handleCloneSubmit(context, backdrop, sourceId) {
    var errEl       = backdrop.querySelector('[data-pp-clone-error]');
    var submitBtn   = backdrop.querySelector('[data-pp-clone-submit]');
    var cancelLnk   = backdrop.querySelector('.ppm-cancel-link');
    var numberInput = backdrop.querySelector('[data-pp-clone-number]');
    var dateInput   = backdrop.querySelector('[data-pp-clone-date]');

    function showError(msg) {
      if (!errEl) return;
      errEl.textContent = msg;
      errEl.hidden = false;
    }
    if (errEl) { errEl.hidden = true; errEl.textContent = ''; }

    // v1.0.17: numberInput holds ONLY the edition suffix when the
    // source title parsed (the stem is locked beside it). Rebuild the
    // full label before anything downstream sees it — the webhook
    // contract is unchanged.
    var typed           = numberInput ? (numberInput.value || '').trim().toUpperCase() : '';
    var issueLabel      = _cloneSplit
                            ? (_cloneSplit.stem + typed).replace(/^.*?-/, '')
                            : typed;
    var publicationDate = dateInput   ? (dateInput.value   || '').trim() : '';
    var stemMatch       = issueLabel.match(/^(\d+)/);
    var issueNumber     = stemMatch ? stemMatch[1] : '';

    // Same dual-write format guard as the Add flow — the stem has to
    // exist because issue-number is a Webflow Number field. Unlike
    // Add, a clone MUST have a label: an unnamed clone is useless.
    if (!issueLabel) {
      showError('Give the new edition a letter (e.g. B).');
      if (numberInput) numberInput.focus();
      return;
    }
    if (!stemMatch) {
      showError('Edition must resolve to a number-led label (e.g. 118B). Got "' + issueLabel + '".');
      if (numberInput) { numberInput.focus(); numberInput.select(); }
      return;
    }
    if (!publicationDate) {
      showError('Publication date is required.');
      if (dateInput) dateInput.focus();
      return;
    }

    // v1.0.21 — belt and braces. openCloneModal already refuses to
    // open without an id; this catches the case where it is lost
    // between open and submit.
    if (!sourceId) {
      showError('Lost the source PubPlan ID. Close this and reload the page.');
      return;
    }

    // v1.0.28 — slots (126) or legacy (103-CLONE).
    var modeEl   = backdrop.querySelector('[data-pp-clone-mode]:checked');
    var mode     = modeEl ? modeEl.value : cloneDefaultMode();
    var cloneUrl = requireMakeUrl(mode === 'slots' ? 'makeCloneIssue' : 'makeClonePubplan', 'clone');
    if (!cloneUrl) return;
    var scenario = mode === 'slots' ? 'Scenario 126' : 'Scenario 103-CLONE';

    var abbreviation = context.taShort || '';
    var issueName    = abbreviation ? (abbreviation + '-' + issueLabel) : issueLabel;

    var params = new URLSearchParams({
      sourcePubplanId: sourceId,
      taId:            context.taId,
      issueName:       issueName,
      issueNumber:     issueNumber,   // stem → issue-number (Number)
      issueLabel:      issueLabel,    // full → issue-number-display (Text)
      publicationDate: publicationDate
    });

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Cloning…';
    }
    if (cancelLnk) cancelLnk.style.pointerEvents = 'none';

    // Toast-truth: 2xx is not enough. Diff the echo.
    var expected = {
      'name':                 issueName,
      'issue-number':         issueNumber,
      'issue-number-display': issueLabel
    };

    fetch(cloneUrl + '?' + params.toString(), { method: 'GET' })
      .then(function (res) {
        // v1.0.29 — 126 refuses with 409/422 and a JSON reason; read it.
        return res.text().then(function (t) {
          if (res.ok) return t;
          try { var p = JSON.parse(t); if (p && p.ok === false) return t; } catch (e) {}
          throw new Error('HTTP ' + res.status);
        });
      })
      .then(function (raw) {
        var payload = null;
        try { payload = JSON.parse(raw); } catch (e) { payload = null; }
        var echoed = payload && payload.fieldData;

        if (payload && payload.ok === false) {
          showError('Nothing was cloned: ' + (payload.error || 'the scenario refused') + '.');
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Clone →'; }
          if (cancelLnk) cancelLnk.style.pointerEvents = '';
          return;
        }
        if (!echoed) {
          console.warn('[PubPlan Clone] no fieldData echo — cannot verify the write.', raw);
          showUnverifiedAndReload(issueName);
          return;
        }

        var mismatches = [];
        Object.keys(expected).forEach(function (k) {
          var want = String(expected[k] == null ? '' : expected[k]).trim();
          var got  = String(echoed[k]  == null ? '' : echoed[k]).trim();
          if (want !== got) mismatches.push(k + ': sent "' + want + '", stored "' + got + '"');
        });

        // Belt and braces: the whole point of the clone is that BA and
        // BA+ are NEW records. If the echo hands back the source's IDs,
        // the pickers were shared instead of copied and editing banners
        // would corrupt the source edition. Fail loudly.
        if (echoed['banner-ads'] && String(echoed['banner-ads']).trim() === '') {
          mismatches.push('banner-ads: clone picker was not created');
        }

        if (mismatches.length) {
          console.error('[PubPlan Clone] write verification FAILED', mismatches);
          showError('Clone was created but stored the wrong values — ' +
                    mismatches.join(' · ') + '. Check ' + scenario + ' mappings.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Clone →';
          }
          if (cancelLnk) cancelLnk.style.pointerEvents = '';
          return;
        }

        closeCloneModal();
        if (mode === 'slots') showCloneReport(echoed.name || issueName, payload);
        else showSuccessAndReload(echoed.name || issueName);
      })
      .catch(function (err) {
        console.error('[PubPlan Clone] webhook failed:', err);
        showError('Failed to clone: ' + (err.message || 'unknown error') + '. Please try again.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Clone →';
        }
        if (cancelLnk) cancelLnk.style.pointerEvents = '';
      });
  }

  // ════════════════════════════════════════════════════════════
  // + EDITION (v1.0.34)
  // ════════════════════════════════════════════════════════════

  var ED_DAYS = 7;   // HC-P-S7-14

  function parseIssueTitle(t) {
    var m = String(t || '').match(/^(.*?)(\d+)([A-Za-z]*)$/);
    return m ? { stem: m[1] + m[2], letter: (m[3] || '').toUpperCase() || 'A' } : null;
  }
  function nextLetter(used) {
    for (var c = 65; c <= 90; c++) {
      var L = String.fromCharCode(c);
      if (used.indexOf(L) === -1) return L;
    }
    return '';
  }
  function isoOfIssue(iss) {   // v1.0.38
    if (!iss) return '';
    var raw = String(iss.isoDate || '').trim(), d = null;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
    if (m) d = new Date(+m[1], +m[2] - 1, +m[3]);
    else if (raw && !isNaN(Date.parse(raw))) d = new Date(Date.parse(raw));
    else d = issueDate(iss);
    if (!d || d.getFullYear() < 2020) return '';
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  }
  function addDaysIso(iso, n) {
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + n)).toISOString().slice(0, 10);
  }
  function normZips(v) {
    var seen = {}, out = [];
    String(v || '').split(/[\s;,]+/).forEach(function (z) {
      z = z.trim();
      if (z && !seen[z]) { seen[z] = 1; out.push(z); }
    });
    return out;
  }
  function gatherNewsletterZips() {
    var map = {};
    Array.prototype.forEach.call(document.querySelectorAll('.newsletter-source [data-nl-id]'), function (el) {
      var id = (el.getAttribute('data-nl-id') || '').trim();
      if (!id || map[id]) return;
      var z = el.getAttribute('data-nl-zips');
      if (z != null && z.trim()) map[id] = z.trim();
    });
    return map;
  }
  function edStyles() {
    if (document.getElementById('it-ed-styles')) return;
    var st = document.createElement('style');
    st.id = 'it-ed-styles';
    st.textContent =
      '.ppm-input.ix-dirty,.ppm-input.ix-dirty:focus{border-color:var(--ix-gold,#C4A35A)!important;box-shadow:0 0 0 1px var(--ix-gold,#C4A35A)!important;outline:none;}' +
      '.ppm-hint{font-size:12px;opacity:.75;margin-top:4px;}';
    document.head.appendChild(st);
  }

  var _edEsc = null;
  function closeEditionModal() {
    var b = document.querySelector('[data-ed-backdrop]');
    if (b && b.parentNode) b.parentNode.removeChild(b);
    if (_edEsc) { document.removeEventListener('keydown', _edEsc); _edEsc = null; }
  }

  function openEditionModal(src) {
    var context = readTaContext();
    if (!context) { window.alert('Cannot add an edition: missing T-A context. Please reload the page.'); return; }
    if (!src || !src.itemId) { window.alert('Cannot add an edition: this tile has no PubPlan ID.'); return; }
    var p = parseIssueTitle(src.title);
    if (!p) { window.alert('Cannot add an edition: "' + src.title + '" does not end in an issue number.'); return; }
    if (document.querySelector('[data-ed-backdrop]')) return;
    edStyles();

    var all = gatherIssues();
    var zipsByNl = gatherNewsletterZips();
    var used = all.map(function (i) { var q = parseIssueTitle(i.title); return q && q.stem === p.stem ? q.letter : null; })
                  .filter(Boolean);
    var start = {
      letter: nextLetter(used),
      date: addDaysIso(isoOfIssue(src), ED_DAYS),
      zips: normZips(zipsByNl[src.newsletterId] || '').join('; ')
    };
    var zipsBound = !!document.querySelector('.newsletter-source [data-nl-zips]');   // v1.0.38
    var zipNote = zipsByNl[src.newsletterId] ? '' :
      '<div class="ppm-hint">' + (zipsBound
        ? esc(src.title) + ' has no zip codes saved; type them in.'
        : 'Zip codes are not on this page (the newsletter list has no zip binding); type them in.') + '</div>';

    document.body.insertAdjacentHTML('beforeend',
      '<div class="ppm-backdrop" data-ed-backdrop>' +
        '<div class="ppm-modal" role="dialog" aria-modal="true" aria-labelledby="ped-title">' +
          '<div class="ppm-hdr"><h3 id="ped-title">Add an edition of ' + esc(p.stem) + '</h3>' +
            '<button type="button" class="ppm-close" data-ed-cancel aria-label="Close">&times;</button></div>' +
          '<div class="ppm-body">' +
            '<div class="ppm-error" data-ed-error hidden></div>' +
            '<div class="ppm-clone-note">Same articles and layout as ' + esc(src.title) + '. Ads, sponsors, events, ' +
              'listings and the greeting start empty for this edition.</div>' +
            '<div class="ppm-field"><label class="ppm-label" for="ped-letter">Edition</label>' +
              '<div class="ppm-issue-row"><span class="ppm-prefix">' + esc(p.stem) + '</span>' +
              '<input type="text" id="ped-letter" class="ppm-input" data-ed-letter maxlength="2" style="max-width:64px;" ' +
                'autocomplete="off" spellcheck="false" value="' + esc(start.letter) + '"></div></div>' +
            '<div class="ppm-field"><label class="ppm-label" for="ped-date">Publication Date</label>' +
              '<input type="date" id="ped-date" class="ppm-input" data-ed-date value="' + esc(start.date) + '"></div>' +
            '<div class="ppm-field"><label class="ppm-label" for="ped-zips">Zip codes</label>' +
              '<input type="text" id="ped-zips" class="ppm-input" data-ed-zips autocomplete="off" spellcheck="false" ' +
                'placeholder="07481; 07417" value="' + esc(start.zips) + '">' + zipNote + '</div>' +
          '</div>' +
          '<div class="ppm-actions">' +
            '<a href="javascript:void(0)" class="ppm-cancel-link" data-ed-cancel>Cancel</a>' +
            '<button type="button" class="ppm-create-btn" data-ed-submit>Add edition &rarr;</button>' +
          '</div>' +
        '</div>' +
      '</div>');

    var bd = document.querySelector('[data-ed-backdrop]');
    var f = { letter: bd.querySelector('[data-ed-letter]'), date: bd.querySelector('[data-ed-date]'),
              zips: bd.querySelector('[data-ed-zips]') };
    function mark() {
      f.letter.value = f.letter.value.toUpperCase();
      f.letter.classList.toggle('ix-dirty', f.letter.value.trim() !== start.letter);
      f.date.classList.toggle('ix-dirty', f.date.value !== start.date);
      f.zips.classList.toggle('ix-dirty', normZips(f.zips.value).join('; ') !== start.zips);
    }
    ['input', 'change'].forEach(function (ev) {
      Object.keys(f).forEach(function (k) { f[k].addEventListener(ev, mark); });
    });
    _edEsc = function (e) { if (e.key === 'Escape') closeEditionModal(); };
    document.addEventListener('keydown', _edEsc);
    bd.addEventListener('click', function (e) { if (e.target === bd) closeEditionModal(); });
    Array.prototype.forEach.call(bd.querySelectorAll('[data-ed-cancel]'), function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); closeEditionModal(); });
    });
    bd.querySelector('[data-ed-submit]').addEventListener('click', function () {
      submitEdition(context, bd, src, p, all, zipsByNl, f);
    });
    setTimeout(function () { f.date.focus(); }, 50);
  }

  function submitEdition(context, bd, src, p, all, zipsByNl, f) {
    var errEl = bd.querySelector('[data-ed-error]');
    var btn = bd.querySelector('[data-ed-submit]');
    var cancel = bd.querySelector('.ppm-cancel-link');
    function err(msg, el) { errEl.textContent = msg; errEl.hidden = false; if (el) el.focus(); }
    errEl.hidden = true;

    var letter = f.letter.value.trim().toUpperCase();
    var date = f.date.value;
    var zips = normZips(f.zips.value);
    if (!/^[A-Z]{1,2}$/.test(letter)) return err('Give the edition a letter (e.g. B).', f.letter);
    if (!date) return err('Publication date is required.', f.date);

    var siblings = all.filter(function (i) { var q = parseIssueTitle(i.title); return q && q.stem === p.stem; });
    var taken = siblings.filter(function (i) { return parseIssueTitle(i.title).letter === letter; })[0];
    if (taken) return err(taken.title + ' already exists. Pick another letter.', f.letter);

    var clash = [];
    siblings.forEach(function (i) {
      if (isoOfIssue(i) !== date) return;
      var theirs = normZips(zipsByNl[i.newsletterId] || '');
      zips.forEach(function (z) { if (theirs.indexOf(z) !== -1) clash.push(z + ' (' + i.title + ')'); });
    });
    if (clash.length) return err('Already sent on ' + date + ': ' + clash.join(', ') +
      '. A zip can repeat on another day, never twice on the same day.', f.zips);

    var url = requireMakeUrl('makeCloneIssue', 'add an edition');
    if (!url) return;
    var stemNum = p.stem.match(/(\d+)$/)[1];
    var issueLabel = stemNum + letter;
    var issueName = p.stem + letter;
    var params = new URLSearchParams({
      sourcePubplanId: src.itemId,
      taId:            context.taId,
      issueName:       issueName,
      issueNumber:     stemNum,
      issueLabel:      issueLabel,
      publicationDate: date,
      edition:         '1',
      editionLetter:   letter,
      sendZipCodes:    zips.join(';')
    });
    var expected = { 'name': issueName, 'issue-number': stemNum, 'issue-number-display': issueLabel };

    btn.disabled = true; btn.textContent = 'Adding\u2026';
    if (cancel) cancel.style.pointerEvents = 'none';
    function reset() { btn.disabled = false; btn.textContent = 'Add edition \u2192'; if (cancel) cancel.style.pointerEvents = ''; }

    fetch(url + '?' + params.toString(), { method: 'GET' })
      .then(function (res) {
        return res.text().then(function (t) {
          if (res.ok) return t;
          try { var q = JSON.parse(t); if (q && q.ok === false) return t; } catch (e) {}
          throw new Error('HTTP ' + res.status);
        });
      })
      .then(function (raw) {
        var payload = null;
        try { payload = JSON.parse(raw); } catch (e) {}
        if (payload && payload.ok === false) {   // v1.0.38
          var why = String(payload.error || 'Nothing was created: the scenario refused.').replace(/\.+\s*$/, '.');
          if (!/^nothing was/i.test(why)) why = 'Nothing was created: ' + why;
          var we = String(payload.workerError || '').trim();
          if (we) why += ' Worker said: ' + we.replace(/\.+\s*$/, '') + '.';
          err(why); reset(); return;
        }
        var echoed = payload && payload.fieldData;
        if (!echoed) { closeEditionModal(); showUnverifiedAndReload(issueName); return; }
        var bad = [];
        Object.keys(expected).forEach(function (k) {
          var want = String(expected[k]).trim(), got = String(echoed[k] == null ? '' : echoed[k]).trim();
          if (want !== got) bad.push(k + ': sent "' + want + '", stored "' + got + '"');
        });
        if (bad.length) { err('Created but stored the wrong values \u2014 ' + bad.join(' \u00b7 ') + '. Check Scenario 126.'); reset(); return; }
        closeEditionModal();
        showCloneReport(echoed.name || issueName, payload);
      })
      .catch(function (e) { err('Failed to add the edition: ' + (e.message || 'unknown error') + '. Please try again.'); reset(); });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.it-edition-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();   // the tile opens the plan; this button must not
    openEditionModal(findByKey(btn.getAttribute('data-ed-key') || ''));
  }, true);

  // Delegated — cards are rebuilt on every render().
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.it-clone-btn');
    if (!btn || btn.classList.contains('it-edition-btn')) return;
    e.preventDefault();
    e.stopPropagation();   // card is an <a>; don't navigate
    openCloneModal(
      btn.getAttribute('data-clone-pubplan-id') || '',
      btn.getAttribute('data-clone-issue-name') || 'this issue'
    );
  });

  // ════════════════════════════════════════════════════════════
  // SET AS NEXT (v1.0.23 — replaces Promote to Next)
  // ════════════════════════════════════════════════════════════
  //
  // Fires Scenario 107 v2. Payload: title-admin-id, title,
  // newsletter (NEWSLETTER item ID), pubplan (PUBLICATION PLAN item
  // ID). 107 checks that the newsletter's own publication-plan link
  // equals `pubplan` before writing anything, then writes:
  //   NEWSLETTERS.publishing-status        → Publish Next as Current
  //   PUBLICATION PLAN.planning-status     → Next
  // and answers with a JSON echo of both, plus the PubPlan ID.
  //
  // IxToast goes green only when all three come back matching.
  // v1.0.39: 107 v4 also moves every other Next plan of this title
  // back to In Progress, and answers titleNextIds, which must equal
  // this plan's id alone. One Next per title (ruled 11 Oct).

  function setAsNext(iss) {
    var k = keyOf(iss);

    if (!iss.newsletterId || !iss.itemId) {
      console.error('[Set as Next] tile is missing newsletterId or itemId — should not be reachable.', iss.title);
      return;
    }

    var context = readTaContext();
    if (!context) {
      window.alert('Cannot set as next: missing T-A context. Please reload the page.');
      return;
    }

    // Hard dependency: without IxToast there is no honest result.
    if (!window.IxToast || typeof window.IxToast.submit !== 'function') {
      console.error('[Set as Next] ix-success-toast-v1.0.0.js is not loaded. Add it to the T-A page body, above issues-tab.');
      window.alert('Cannot set as next: a required script is missing. Please reload; if it persists, tell Jeff ix-success-toast is not loading.');
      return;
    }

    var url = requireMakeUrl('makePromoteNext', 'set as next');
    if (!url) return;

    // No ID to compare, no honest toast. Refuse; never guess.
    var ppNextId = optId('planningStatus', 'next');
    if (!ppNextId) {
      console.error('[Set as Next] TA_CONFIG is missing optionIds.planningStatus.next');
      window.alert('Cannot set as next: TA_CONFIG is missing optionIds.planningStatus.next. Tell Jeff.');
      return;
    }

    // Captured before the call: the tiles 107 is about to move back.
    var others = otherNext(iss);
    var movedNote = others.length
      ? ' ' + joinTitles(others) + ' moved' + ' back to In Planning.'
      : '';

    S.ui[k] = 'busy';
    renderZones();
    var btn = document.querySelector('[data-it-busy="' + cssEsc(k) + '"]');

    IxToast.submit({
      url:    url,
      method: 'GET',
      button: btn,
      busyLabel: 'Setting…',
      key:       'issues-tab:set-next:' + iss.itemId,

      body: {
        'title-admin-id': context.taId,
        'title':          context.taShort || context.titleSlug || '',
        'newsletter':     iss.newsletterId,
        'pubplan':        iss.itemId
      },

      // The contract (v1.0.37). 107 writes only the PubPlan's Next;
      // we require it back, plus the PubPlan it actually wrote to.
      // v1.0.39: titleNextIds proves this plan is the title's only Next.
      sent: {
        'planning-status':   ppNextId,
        'pubplanId':         iss.itemId,
        'titleNextIds':      iss.itemId
      },

      success:    iss.title + ' is the next newsletter.' + movedNote,
      failure:    'Set as Next failed for ' + iss.title + '.',
      unverified: 'Sent, but ' + iss.title + ' is not confirmed as next.',

      onVerified: function (r) {
        // Proven by the echo. Move the tile in place: no reload,
        // no lost scroll, no lost tab.
        var lab = optLabel('planningStatus', 'next');
        iss.status = lab || ppNextId;
        iss.echoNext = true;
        // v1.0.39 — titleNextIds named only this plan, so every
        // other Next tile is proven back in In Progress.
        var back = optLabel('planningStatus', 'inProgress') || optId('planningStatus', 'inProgress');
        // v1.0.40 — newsletters 107 v5 proved it set to Draft.
        var reset = {};
        String((r && r.echo && r.echo.resetNlIds) || '').replace(/[0-9a-f]{24}/g, function (id) { reset[id] = true; return id; });
        others.forEach(function (o) {
          o.status = back;
          o.echoNext = false;
          delete S.ui[keyOf(o)];
          if (o.newsletterId && reset[o.newsletterId]) S.nl[o.newsletterId] = '';
        });
        delete S.ui[k];
        S.arrive = k;
        renderZones();
      },
      onFailed: function (r) {
        // Amber keeps a note on the tile; red just returns it to
        // ready. The tile is never repainted as Next on either.
        if (r && r.status === 'unverified') S.ui[k] = 'unverified';
        else delete S.ui[k];
        renderZones();
      }
    });
  }

  // Attribute-selector-safe key (keys are hex IDs or TITLE-WEEK).
  function cssEsc(s) {
    return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&');
  }

  function closeAllConfirms() {
    Object.keys(S.ui).forEach(function (k) { if (S.ui[k] === 'confirm' || S.ui[k] === 'rf-confirm' || S.ui[k] === 'rf-check' || S.ui[k] === 'rf-no' || S.ui[k] === 'rf-done') { delete S.ui[k]; delete S.rf[k]; } });   // v1.0.44 refresh states
  }

  // Delegated — tiles are rebuilt on every renderZones().
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-it-set],[data-it-confirm],[data-it-cancel],[data-it-retry],[data-it-archive-toggle],[data-it-future-toggle],[data-it-refresh],[data-it-rfgo]');   // v1.0.44 future, refresh
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();

    if (t.hasAttribute('data-it-archive-toggle')) {
      S.showAllArchive = !S.showAllArchive;
      renderZones();
      return;
    }
    if (t.hasAttribute('data-it-future-toggle')) {                     // v1.0.44
      S.showFuture = !S.showFuture;
      renderZones();
      return;
    }

    var k = t.getAttribute('data-it-set') || t.getAttribute('data-it-confirm') ||
            t.getAttribute('data-it-cancel') || t.getAttribute('data-it-retry') ||
            t.getAttribute('data-it-refresh') || t.getAttribute('data-it-rfgo') || '';
    var iss = findByKey(k);
    if (!iss) return;

    if (t.hasAttribute('data-it-set')) {
      closeAllConfirms();          // one open question at a time
      S.ui[k] = 'confirm';
      renderZones();
    } else if (t.hasAttribute('data-it-cancel')) {
      if (S.ui[k] === 'rf-busy') return;   // v1.0.44: a running refresh cannot be cancelled
      delete S.ui[k]; delete S.rf[k];      // back exactly as it was
      renderZones();
    } else if (t.hasAttribute('data-it-refresh')) {                     // v1.0.44
      closeAllConfirms();
      refreshCheck(iss);
    } else if (t.hasAttribute('data-it-rfgo')) {
      refreshGo(iss);
    } else if (t.hasAttribute('data-it-confirm') || t.hasAttribute('data-it-retry')) {
      setAsNext(iss);
    }
  });

  // Escape cancels an open question.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (document.querySelector('[data-pp-add-backdrop],[data-pp-clone-backdrop]')) return; // modals own Escape
    var had = Object.keys(S.ui).some(function (k) { return S.ui[k] === 'confirm' || S.ui[k] === 'rf-confirm'; });   // v1.0.44
    if (!had) return;
    closeAllConfirms();
    renderZones();
  });

  // ── Whole-tile click (v1.0.26) ──
  // Anywhere on a tile or Next band opens it, except its own
  // controls. Delegated, because tiles are rebuilt on every render.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    var tile = e.target.closest('#it-overview-root .it-tile, #it-overview-root .it-next');
    if (!tile) return;
    if (e.target.closest('a, button, input, textarea, select, label, .it-confirm')) return;
    var sel = window.getSelection && window.getSelection();
    if (sel && String(sel).length) return;          // finishing a text selection

    var iss = findByKey(tile.getAttribute('data-it-key') || '');
    if (!iss) return;
    var zone = tile.classList.contains('it-next') ? 'next'
             : tile.classList.contains('it-tile--archive') ? 'archive' : 'active';
    var l = linkFor(iss, zone);
    if (!l.url) return;

    if (l.newTab || e.metaKey || e.ctrlKey) {
      window.open(l.url, '_blank', 'noopener');
    } else {
      window.location.href = l.url;
    }
  });

  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

})();
