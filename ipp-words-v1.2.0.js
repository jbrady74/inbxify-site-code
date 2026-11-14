/* ipp-words-v1.2.0.js */
/* v1.2.0 (14 Nov 2026, Content Home S9, Jeff ruled yes to S9 question 1): THE GREETING ROW SAVES THROUGH ix-content.
   Until now the Words tab wrote the NL-BLOCKS Greeting (GR) row through Make: the words and the basis stamp through
   Scenario 122 block-save gr, then the copy marks through Scenario 124 fill or clear, then the done tick through 124 flag.
   Each was a separate write, each judged by re-reading the plan up to four times, and none moved the row's version in
   ix-content's D1 home, so a Layout save straight after a Words save could meet a stale row (S6 ruling 4).
   1 · ONE UPDATE ON THE GREETING ROW. A top-card Save (and Keep as written, and the quiet re-stamp after another card is
       saved while stale, v1.0.7) sends ONE op to POST {PP_WEBHOOKS.content}/nl-blocks/batch, signed with the staff login:
       { op: 'update', id: <GR row>, version: <the version /plan-board read>, fields: { the three words, greeting-basis,
       the copy marks still owed } }. Every slug comes from /plan-board (blockFields.greetingTitle, greetingParagraph,
       greetingSupershort, greetingBasis; adFields.approval), never from this file. The plan is read fresh first, so the
       basis and the version are today's.
   2 · THE DONE TICK is the same kind of op with one field, blockFields.greetingDone, true or false.
   3 · TOAST-TRUTH from the echoed row: every field the op carried must come back as sent (words folded as the tab folds
       them). The fresh read after the save only repaints. The four-try read-back stays for the NEWSLETTER parts only.
   4 · STALE: when the row changed since it was read, nothing is sent; the page re-reads, keeps every word and Keep in the
       cards, rings the top card gold, and says the S6 words ("Someone else changed this plan" / "We added their change and
       kept yours. Look over the card with the gold ring, then Save again."). The ring clears on the next Save or Cancel.
   5 · LOCKS: a sent, released or held issue gets ix-content's own sentence in an error toast, which stays.
   6 · The inbox and end cards (subject, preview, closing) stay on Scenario 124 nlmeta: they live on the NEWSLETTER, not
       NL-BLOCKS. Scenario 122 is no longer called from this tab. The ⓘ heading reads "Writes through".
   Needs ix-issue-data v1.0.181 (blockFields names the greeting words), ix-content v1.2.2, Memberstack on the page.
   CSS stays ipp-words-v1.0.5.css (the ring style is injected, #ipp-wd-ring-css).
   HARDCODING: HC-P-WD120-1 the stale words (the S6 words, as HC-P-L62-5); HC-P-WD120-2 the part-to-blockFields map
   (title greetingTitle, supershort greetingSupershort, paragraph greetingParagraph). */
/* v1.1.7 (12 Nov 2026, Jeff on WLN-124A: "the AI for writing in IPP sucks; don't we have rules for how to generate subject
   & preview without repeating the topics in each?"): THE SUBJECT AND THE PREVIEW NEVER SHARE AN ITEM, AND CODE CHECKS IT.
   The rules were in the prompt; two things defeated them. (1) A part's Regenerate never saw the subject chosen in the
   window, only saved words (fixed in ix-ai v1.4.1, which this file needs for the check below; with an older ix-ai the
   new spec keys are ignored and nothing breaks). (2) The preview prompt said "names items the subject did not lead
   with", which allows repeating every other item the subject names.
   1. KEEP APART: subject and preview carry apart (each names the other, HC-P-WD7-1) and the spec gives ix-ai shared(a, b),
      the issue items both texts name. An item is matched by its distinctive words: the significant words of its title
      and subtitle (articles), name (events) or title (The Find) that no other item in this issue uses, singular and
      possessive folded ("books" = "book", "children's" = "children"). Words of the title's own name and the plain words
      (HC-P-WD1-9) never count. Words shared by two items are dropped so "holiday" in two titles matches neither.
   2. PROMPTS: the preview names only items the subject does not name at all and finishes the subject's thought; subject
      and preview are sentence case (capital on the first word and proper names only); a neighbour profile in the issue
      is named in the subject, not necessarily first (Jeff, 11 Oct). Copy only; HC-P-WD1-4 holds the prompts.
   CSS stays ipp-words-v1.0.5.css. HARDCODING: HC-P-WD7-1 the apart pairs (subject, preview). */
/* v1.1.6 (7 Nov 2026, same session, Jeff on WLN-123C): MOVEMENT WHILE KEEP AS WRITTEN RUNS, AND THE TICK HAS ITS LABEL BACK.
   Keep as written works (Test on 123C passed). Two finishes: (1) while it runs, the gold strip shows a spinner and says
   "Keeping N as written…" (the strip used to say "Saving 2 cards, one after the other…", Save all's words); (2) the done
   tick's label came off with the verdict sentence in v1.1.4, so the row read as a bare tick. It now says "Marked done",
   the state of the tick, which is not a verdict on the tab; the header still is. Styles injected (#ipp-wd-spin-css).
   CSS stays ipp-words-v1.0.5.css. HARDCODING: none new. */
/* v1.1.5 (7 Nov 2026, same session, Jeff on WLN-123C): KEEP AS WRITTEN IS ONE WRITE, AND THE HEADER CANNOT SAY DONE EARLY.
   v1.1.4's Keep as written saved the inbox card, then the closing card, each writing the NEWSLETTER clone-pending field from
   its own fresh read: two writes to one field in a row, and the first read-back came back short, so the run stopped with
   both cards open and gold while the header already said "Every part written" (it counted only unanswered parts).
   1. Keep as written writes the inbox and closing answers in ONE nlmeta write, then the greeting through Keep's stamp.
   2. The header counts every copied part until its answer is saved ("N to confirm"), kept-but-unsaved included.
   3. When a read-back comes back short, the card says what the plan still lists, so the cause is visible.
   CSS stays ipp-words-v1.0.5.css. HARDCODING: none new. */
/* v1.1.4 (7 Nov 2026, NL Publishing Status · rail dots, Jeff on WLN-123C): ONE COMMAND ON TOP, SURGERY ON THE CARDS.
   Jeff clicked "Keep these words" on the top card: it went green and said "The newsletter is done." while three copied parts
   (subject, preview, closing) sat pink under it, because that button answered only the greeting's copies and "Keep all 3"
   in the header answered the rest. Two keeps, one tab, and a verdict sentence over items still waiting. Now:
   1. The top card carries no verdict. Done shows only the stamp ("Done Nov 7, 8:43 AM · Undo"); the tab header is the one
      verdict ("N to confirm", then "Every part written"). The tick stays for the not-done state only: Compile reads the
      done flag ("Mark the newsletter done first"), so it is still the gate that opens the words.
   2. One button, "Keep as written", on the top card. It answers every copied part still waiting, on every card, in one
      run (the greeting through Keep's stamp, the inbox and closing through their own writes), then ticks the newsletter
      done if it is not. Its label counts what is waiting: "Keep all N as written", or "Keep the other N as written" once
      some were answered by hand. It hides when nothing waits, and it greys out while a card holds an unsaved edit, with
      the hint "Save or cancel the open card first". The stale row's Keep is the same button. "Keep all" leaves the header.
   3. The cards keep their own Keep, Delete, Edit and Save for surgical changes; a hand change never forces the rest by hand.
   CSS stays ipp-words-v1.0.5.css. HARDCODING: HC-P-WD114-1 the button's words. */
/* v1.1.3 (1 Nov 2026, Publishing Status S1, Jeff on WLN-123B): ONE WORDS CARD, EACH FACT AND ACTION ONCE.
   Before, two cards sat over the word cards: the done card and the Words band. Stale, the page said "the issue changed" three
   times (header, done card heading and paragraph, band "older than the issue"), offered Write them again twice, offered hand
   editing three ways (band "Edit by hand", each card's Edit, the paragraph), and showed a tick box that could not be clicked.
   Jeff ruled: one card for every state; built without a mockup.
   Now the done card is the only card and changes with the state:
     · Not done: the tick, "Mark the newsletter done", one line "Tick when the picks and layout are final. This opens the words."
     · Done, nothing written: "The newsletter is done.", the stamp with Undo, Write the words and Type them by hand.
     · Done and written: the same, with Write them again. Edit by hand is gone; each word card's Edit is the way in.
     · Stale: no tick box. Heading "Changed since <when it was done>", the change chips, Keep these words and Write them again.
       The paragraph and the "Changed since" label inside the chips row are gone.
     · The no-Greeting / no-done-field / no-newsletter messages are unchanged.
   The header status is unchanged and stays the one place that says the state. The band's "Written · N of 6" line and the
   "Opens when the newsletter is marked done above." line are gone (the header says what is left to write; each word card shows
   its own problems). The band now only shows when it holds the AI leads or the Save all strip.
   Behaviour, saves and the clone Keep/Delete flow do not change. Styles injected (#ipp-wd-merge-css); CSS stays
   ipp-words-v1.0.5.css. HARDCODING: HC-P-WD113-1 the new words ("Mark the newsletter done", the one-line instruction,
   "Changed since"). */
/* v1.1.2 (31 Oct 2026, Clone Fix S2): "KEEP THESE WORDS" ANSWERS THE COPY TOO. Jeff on WLN-123B: he clicked Keep these words, it saved, and the copied title and short greeting stayed pink. That button re-stamps the saved greeting against the issue, and it sent no answer for the copied parts (it also dropped any Keep waiting on the card). Keeping the words as they are is keeping the copy, so it now answers every copied part of the greeting (title, short greeting, paragraph) in the same Save: the GR row's copy marks are written after the stamp lands, read back fresh, and the pink clears only when the read shows them gone. Nothing else changes. CSS stays ipp-words-v1.0.5.css. */
/* v1.1.1 (31 Oct 2026, Clone Fix S2): NO WORDS ON A PINK PART. Jeff: "Copied by Clone. Keep or delete." is not needed on every tile; the pink and the two links say it. A pink part now shows only Keep and Delete. The gold states keep their words ("Keeps on Save", "Changes on Save", the Delete-to-replace line). Nothing else changes. CSS stays ipp-words-v1.0.5.css. */
/* v1.1.0 (31 Oct 2026, Clone Fix S2, Build 2 step 2): KEEP OR CHANGE THE WORDS A CLONE COPIED.
   The accepted clone-confirm mockup (v0.2), Words view. A clone copies the six parts:
     subject, preview, closing   NEWSLETTER keys in clone-pending (ix-issue-data v1.0.132/133)
     title, short greeting, paragraph   GR row tokens gr-title, gr-short, gr-para
   WHAT YOU SEE. A copied part not yet answered is pink (ix-confirm, ix-form-controls v1.2.0) with
   "Copied by Clone. Keep or delete." and the links Keep and Delete under it.
     · Keep: the part turns gold, "Keeps on Save", with Delete and Cancel beside it. The card opens
       so its Save is in reach.
     · Delete: the box empties and opens for new words ("Copied words removed. Write new ones.").
       The part cannot be saved empty: the Worker refuses an empty or out-of-range subject, preview
       or closing at the write (ix-issue-data v1.0.73, S10 ruling), and the title, short greeting and
       paragraph are required by Compile. So on Words, Delete means "replace", and Save stays off
       until the new words fit, as for any edit. Cancel puts the copied words back, pink.
     · Typing in a pink part answers it too ("Changes on Save").
   The header reads "N to confirm" with a Keep all N link (ipp-shell v1.31); Keep all keeps every
   pink part and opens their cards. Each card's Save writes its answers; Save all still covers
   several cards.
   Keep and Delete work before "The newsletter is done" is ticked: answering a copy is not writing.
   WHAT SAVE WRITES.
     · In the inbox / At the end (Scenario 124 op nlmeta): only the parts that changed, plus the
       NEWSLETTER's remaining clone-pending keys (slug from the board, publish.fields.clonePending),
       in one write. The plan is read fresh first. A Keep alone writes only the keys.
       (Change: a card Save used to resend every part of the card; now only the changed ones.)
     · At the top: the words through Scenario 122 as before when any changed, then the GR row's
       remaining tokens through Scenario 124 fill (the approval field, adFields.approval) or a clear.
       A Keep alone writes only the tokens.
     · Success only when a fresh read shows the words and the answered keys gone (TOAST-TRUTH).
   Needs ix-issue-data v1.0.133, ipp-shell v1.31+, ix-form-controls v1.2.0, ipp-words-v1.0.5.css.
   HARDCODING: HC-P-WD110-1 (provisional) the part-to-token map (title gr-title, supershort
   gr-short, paragraph gr-para), the Worker's token names (HC-P-CF1-2). HC-P-WD110-2 the new words. */
/* v1.0.9 (23 Oct 2026): THE TAB HEADER. Jeff's ruling: every tab opens with one header (ipp-shell v1.28 draws it: title, badge, one line, status). Words' own head (the "Words" title and the two-line lede) is no longer drawn; the header's line says it shorter. Words now has a version badge like every other tab (IxInfo), and hands the header its status: "Mark the newsletter done first", "The issue changed after the words were written", "N of 6 still to write" in red, or "Every part written" in green. Nothing else changes. Needs ipp-shell v1.28. CSS stays ipp-words-v1.0.4.css. */
/* v1.0.8 (21 Oct 2026, 106 Gap Interview S10): THE RANGES COME FROM THE
   WORKER. The six ranges (subject, preview, closing, title, short greeting,
   paragraph) are no longer typed here; ix-issue-data v1.0.74 answers them on
   /plan-board as words.ranges and words.labels, and this tab reads them from
   the shared board on every paint (RANGE is filled from the board; nothing
   is typed as a fallback). The card rule lines, the counts, the input
   maxlength, the AI field specs and every range check use the same numbers.
   When the board carries no ranges (the Worker is behind), every count reads
   "Ranges not answered by the Worker (needs ix-issue-data v1.0.74)", the
   card state says the same, and Save, Save all and the AI writer stay off
   until a reload finds them (Jeff ruled "Save off", S10). HC-P-WD1-1 loses
   its RANGE numbers (they live in the Worker as HC-W-74-1); HC-P-WD8-1 is
   the no-ranges sentence. Body tag only; CSS v1.0.4 unchanged.
   v1.0.7 (20 Oct 2026, 106 Gap Interview S5): saving any card clears the
   stale band. The basis stamp only travelled with the top card (Scenario
   122 block-save carries grBasis); the inbox and end cards save through
   Scenario 124 nlmeta, which carries nothing, so writing a new subject and
   saving it left "The issue changed after you marked it done" red with no
   way out but Keep or Write again (Jeff, S5). Rule now: once the band is
   red, a Save on any card is the review. After an inbox or end card saves
   while stale, save() re-sends the saved greeting words with today's
   basis (the Keep path, quietly); the toast says "stamped". If that
   second write does not read back, the top card says so and offers Keep.
   Band copy gains "or edit any card and save." Body tag only.
   v1.0.6 (20 Oct 2026, 106 Gap Interview S5): three small things.
     1 THE LEADS LINE NO LONGER MATCHES THE COMMUNITY'S OWN NAME. leadsOf()
       keyed every item on its first three words after a typed skip list
       ("with, from, meet, week, town, living, news"), so a subject that
       opened with "Wyckoff" was shown as leading with whatever article
       named Wyckoff. The skip list now comes from the title's own name
       (ctx.plan.titleName, "Wyckoff Living Now" → wyckoff, living, now)
       plus a short list of plain words; the typed "town, living, news"
       are gone (one hardcode retired, HC-P-WD1-9 holds the plain words).
     2 THE PICKER'S LIST CHANGES COUNT AS UNSAVED. unsavedElsewhere() now
       counts pending().lists (ipp-picker v1.44), so added or reordered
       events and listings block "The newsletter is done" like a slot
       change does.
     3 THE WORDS DOT IS PAINTED BY COMPILE. Ruled by Jeff (S5, 20 Oct):
       ipp-publish v2.38 paints every rail dot from its own Compile tiles,
       each of which names the tab that fixes it, so a red on Compile and
       a red on the tab are one fact. This file no longer calls IPP.dot.
   Companion stylesheet: ipp-words-v1.0.4.css (unchanged).
   ---- v1.0.5 header follows ----
/* ============================================================
   ipp-words-v1.0.5.js — the Words tab of the IPP
   Companion stylesheet: ipp-words-v1.0.4.css (the Save all strip)
   v1.0.5 (20 Oct 2026, 106 Gap Interview S4, ruling 3a): ONE SAVE FOR
   SEVERAL CARDS. After "Write them again" fills two or three cards the
   second step was easy to miss: each card needed its own Save and the
   only cue was a line of small text inside the card. The review stop
   stays (Use fills, Save writes; the six parts go through two scenarios,
   so Use is not one atomic act), but when more than one card holds
   unsaved words the band grows a gold strip: "Unsaved words in 3 cards"
   with "Undo all" and "Save all · 3 cards". Save all runs the card saves
   in page order (inbox and end through 124 nlmeta, top through 122
   block-save gr), one after the other, each read back; one toast at the
   end names the cards that read back ("Words saved · 3 cards · Read back
   from the plan"). It stops at the first card that fails and that card
   shows why. Save all is off until every unsaved card is in range, the
   same rule as a card's own Save. Each card keeps its Save and Cancel.
   The strip also appears for hand edits across cards. The card line after
   a fill now says "Read it once more, then Save here or Save all above."
   save() returns a Promise (true when read back) so Save all can chain.
   v1.0.4 kept below.
   v1.0.4 (20 Oct 2026): takes ix-ai v1.3.0's partial result. The modal
   answers only the parts given a new version; the tab fills those,
   opens only their cards, and leaves every other part untouched. The
   Use label is "Use" ("Use · 2 new parts" is the modal's own wording).
   Needs ix-ai v1.3.0.
   v1.0.3 kept below.
   v1.0.3 (20 Oct 2026, Jeff: "why can't I trigger the AI inside this
   box"): a Write button on every card head. It opens the same modal
   with only that card's parts (ix-ai takes any subset of fields); the
   shared prompt names the other saved parts as fixed, so what it writes
   does not repeat them. "Use these" fills that card for Save. The band's
   "Write them again" still does all six.
   v1.0.2 kept below.
   v1.0.2 (20 Oct 2026, Jeff's second run on 901A):
     1. The proxy's model refuses an assistant prefill ("This model does
        not support assistant message prefill"), so ask() sends the user
        turn only; ix-ai v1.2.1's forgiving parser and quoted error stay.
     2. The tab shows the same red Compile shows (Jeff: the tab and the
        board must agree). When a part is missing or outside its range,
        the band turns salmon and names it ("Written 5 of 6 · closing
        missing"; "preview is 101 characters, needs 40 to 90"), and the
        card holding the gap carries the salmon edge and head. The rail
        dot was already salmon; now the page is too.
   v1.0.1 kept below.
   v1.0.1 (20 Oct 2026, Jeff's first session on 901A):
     1. The inbox ranges follow the mail clients, not the old prompt:
        subject 20 to 50 (Litmus best practice 50; Gmail mobile shows
        35 to 40), preview 40 to 90 (iPhone shows about 90; Gmail
        shares the line with the subject). Title stays under 50: the
        web issue bar on a phone holds about 26 characters a line, two
        lines. ipp-publish v2.36 checks the same ranges on Send Setup
        and Compile (HC-P-WD1-1 updated).
     2. The model answer was not readable ("the answer was not the JSON
        asked for"): ask(prompt, kind) now prefills the assistant turn
        with "{" on json calls (ix-ai v1.2.1 passes the kind) and allows
        4,000 output tokens; the subject prompt says the first 35
        characters carry the hook.
     3. niceDate reads a Webflow date at UTC midnight as the calendar
        day (the modal said "Oct 17" for the Oct 18 issue).
   v1.0.0 kept below.
   Succeeds ipp-greeting v1.0.1 (retired). Mockup: ipp-words-tab-mockup
   v0.1 (20 Oct 2026, 106 Gap Interview S4), Jeff: grouping, keep the
   inbox strip, strict lengths, build.

   What it is
   The Greeting tab grown to the six parts a reader meets, written
   together once the newsletter is done, so each pulls the reader to a
   different part of the issue (Jeff's Greetings and Closings process):
     In the inbox   subject line, preview text        NEWSLETTER (124 nlmeta)
     At the top     title, short greeting, paragraph  GR row (122 block-save gr)
     At the end     closing                           NEWSLETTER (124 nlmeta)
   Three cards, grouped by where the words print, each with its own
   Edit, Cancel and Save; a changed box carries the gold border; counts
   show only while editing and go salmon outside the range; Save stays
   off until every box in that card is in range. The inbox card shows a
   mail-client strip (sender, subject, preview) that follows the boxes.

   The done tick (as v1.0.1): NL-BLOCKS greeting-done on the GR row,
   through Scenario 124's flag op. The tick opens the words. Undo clears it.

   The stale rule is a content rule now (Jeff, 20 Oct 2026). The Data
   Worker v1.0.68 stores nothing itself: when the words are saved or
   kept, this tab sends grBasis, the Worker's description of the issue as
   it stands (ordered articles with a content hash, events, The Find),
   with the 122 block-save; the Worker answers, on every board read,
   whether today's issue differs from that stored basis and how
   (greeting.basis.changes: moved 6 → 3, body edited, event added, Find
   changed). Display ads, real estate and block designs never count.
   While stale the tick is off; "Keep these words" re-stamps the basis
   and "Write them again" opens the session with the changes in the
   prompt. With no stored basis (nothing written yet) nothing is stale.

   One session writes all six (ix-ai v1.2.0, six fields in three
   groups) so the vary rule can hold across the set: no two parts lead
   with the same item. The rules, from Jeff's prompt and ruling 5:
     1 the paragraph opens with something from the middle of the page
       (positions 4 to 6), so the reader has a reason to scroll;
     2 the feature (position 1) is always mentioned, never first;
     3 community news items come next in priority;
     4 spread the items across subject, preview, paragraph, title and
       short greeting; vary the concepts; never two parts on one item;
     5 always positive, publisher's voice, a light seasonal note tied to
       the issue date, no weather claims the facts do not give;
     6 strict lengths, checked in code here and in the modal.
   After a session the band shows which item each part leads with
   (session-only, nothing stored).

   Needs: ipp-shell v1.23 (the 'words' view), ix-ai v1.2.0,
   ix-issue-data v1.0.74 (words.ranges on /plan-board; greeting.basis on the GR slot, blockFields.
   greetingBasis, /greeting-context with basis), Scenario 124 (op flag
   and op nlmeta), Scenario 122 block-save gr with grBasis mapped to
   NL-BLOCKS greeting-basis, PP_WEBHOOKS.anthropicProxy.

   HARDCODING (tracker rows)
     HC-P-WD1-1  KEYS and GROUPS (the six parts and their three cards).
                 The RANGE numbers left this file in v1.0.8: they are
                 answered by ix-issue-data on /plan-board (HC-W-74-1)
     HC-P-WD8-1  the no-ranges sentence (v1.0.8)
     HC-P-WD1-2  WD_MODEL 'claude-sonnet-4-6' (HC-P-GR1-2)
     HC-P-WD1-3  WD_COUNT 2/2/3/3/2/2 and WD_TONES (title and short
                 greeting: Warm/Playful/Straight; paragraph: Warm/Straight)
     HC-P-WD1-4  HOUSE_RULES and FIELD_PROMPT text live here (per-title
                 versions on TITLES-ADMIN later)
     HC-P-WD1-5  the done card, band and card wording
     HC-P-WD1-6  the Worker route /greeting-context, from PP_WEBHOOKS.planBoard's origin
     HC-P-WD1-7  the mid-page window: positions 4 to 6, else the last
                 half of the articles (MID_FROM = 4)
     HC-P-WD1-8  the NEWSLETTER values come from board.publish
                 (subject, preview, closing) by their Worker keys
   ============================================================ */
(function () {
  'use strict';
  var VERSION = '1.2.0', FILE = 'ipp-words-v1.2.0.js', VIEW = 'words', MOUNTED = 'data-words-mounted';

  // ── constants ───────────────────────────────────────────────
  var GR = 'GR';                                                            // the Greeting block type (HC-P-S16-1 class)
  var KEYS = ['subject', 'preview', 'title', 'supershort', 'paragraph', 'closing'];                         // HC-P-WD1-1
  var GROUPS = { inbox: ['subject', 'preview'], top: ['title', 'supershort', 'paragraph'], end: ['closing'] };
  var GROUP_ORDER = ['inbox', 'top', 'end'];
  var GROUP_WORD = { inbox: 'In the inbox', top: 'At the top', end: 'At the end' };
  var GROUP_WHAT = { inbox: 'before anyone opens it', top: 'the masthead and the greeting block', end: 'the last line before the footer' };
  var GR_KEYS = GROUPS.top, NL_KEYS = ['subject', 'preview', 'closing'];
  var RANGE = null;                                                        // v1.0.8: filled from the board (words.ranges, ix-issue-data v1.0.74); never typed here
  var NO_RANGES = 'Ranges not answered by the Worker (needs ix-issue-data v1.0.74)';   // HC-P-WD8-1
  function syncRanges() {                                                  // v1.0.8: true when the board carries all six ranges
    var b = boardData(), r = b && b.words && b.words.ranges, ok = !!r && KEYS.every(function (k) { return Array.isArray(r[k]) && r[k].length === 2 && r[k][1] > 0; });
    RANGE = ok ? r : null; return ok;
  }
  function span(k, to) { var r = RANGE && RANGE[k]; if (!r) return ''; return r[0] > 1 ? r[0] + ' ' + to + ' ' + r[1] : 'under ' + (r[1] + 1); }
  function groupRule(g) {                                                  // v1.0.8: the card rule line, from the board's numbers
    if (!RANGE) return NO_RANGES + '.';
    return g === 'inbox' ? 'Subject ' + span('subject', 'to') + ' characters, preview ' + span('preview', 'to') + '. Save stays off until both fit.'
      : g === 'top' ? 'Title ' + span('title', 'to') + ', short greeting ' + span('supershort', 'to') + ', paragraph ' + span('paragraph', 'to') + '.'
      : 'One or two sentences tied to the date, ' + (RANGE.closing[0] > 1 ? span('closing', 'to') : 'up to ' + RANGE.closing[1]) + ' characters.';
  }
  var LABEL = { subject: 'Subject line', preview: 'Preview text', title: 'Title', supershort: 'Short greeting', paragraph: 'Paragraph', closing: 'Closing' };
  var WHERE = { subject: 'the inbox', preview: 'under the subject', title: 'prints in the masthead', supershort: 'prints in the email', paragraph: 'prints on the web page', closing: 'NEWSLETTER \u00b7 Closing Note' };
  var WORD = { subject: 'a subject line', preview: 'preview text', title: 'a title', supershort: 'a short greeting', paragraph: 'a paragraph', closing: 'a closing' };
  var WD_MODEL = 'claude-sonnet-4-6';                                       // HC-P-WD1-2
  var WD_APART = { subject: ['preview'], preview: ['subject'] };              // v1.1.7, HC-P-WD7-1: parts that never share an item
  var WD_COUNT = { subject: 2, preview: 2, title: 3, supershort: 3, paragraph: 2, closing: 2 };            // HC-P-WD1-3
  var WD_TONES = { title: ['Warm', 'Playful', 'Straight'], supershort: ['Warm', 'Playful', 'Straight'], paragraph: ['Warm', 'Straight'] };
  var MID_FROM = 4;                                                         // HC-P-WD1-7
  var TRIES = 4, GAP_MS = 2500;                                             // the read-back wait (HC-P-IPP3-3)
  var HOUSE_RULES = [                                                       // HC-P-WD1-4
    'Written in the publisher\u2019s voice: warm, neighbourly, plain English, speaking to local readers. Always positive. Use only the facts given; never invent names, dates, places, numbers or weather.',
    'The six parts work as a set and the reader meets them in this order: subject line, preview text, title, short greeting, paragraph, closing. Their job is to pull the reader into the issue. Spread the items across them: no two parts open with the same item, and together they should name as many different items as they naturally can.',
    'Articles are numbered in page order. Position 1 is the feature the reader sees first anyway; it is always mentioned, but never as the first thing said in any part. Favor the articles in the middle of the page (positions ' + MID_FROM + ' to 6 when there are that many) for the openings, so the reader has a reason to scroll. Community news items come next in priority. Events get one mention somewhere in the set.',
    'A light seasonal note tied to the issue date is welcome where it fits; make no claim about the weather that the facts do not give.',
    'The Find, when listed, is a paid listing: you may mention its topic, never sell it.',
    'No emoji, no hashtags, no exclamation marks in the paragraph or the closing; one exclamation mark is allowed in the closing only if it is natural.',
    'Lengths are checked by code and rejected outside the range. Count characters.'
  ];
  var FIELD_PROMPT = {                                                      // HC-P-WD1-4
    subject: 'What the inbox shows as the subject. Name two or three items, not one; the first 35 characters carry the hook, because phones cut it there. At least one option names the community (from the newsletter name). Each option leads with a different item. If an article introduces local people (a neighbour profile, often in a Meet or Neighbors section), every option names it somewhere, not necessarily first. Sentence case: a capital on the first word and on proper names only.',
    preview: 'The grey line after the subject in the inbox; it finishes the subject\u2019s thought. It names only items the subject does not name at all: no item, person, place or topic from the subject appears in it, not even reworded. Catchy and specific. Each option leads with a different item. Sentence case: a capital on the first word and on proper names only.',
    title: 'A heading over the greeting; it prints in the masthead. Sentence case, no colon, no item the subject led with.',
    supershort: 'One sentence under the masthead in the email. Name one or two items the subject and preview did not lead with.',
    paragraph: 'The greeting on the web page. Open with an item from the middle of the page (positions ' + MID_FROM + ' to 6), then the feature, then community news and one event, as the facts allow. Name the writers only when given. End with \u201cEnjoy.\u201d',
    closing: 'The last line before the footer: a variation on \u201cThat\u2019s all for this week\u201d plus one sentence tied to the season or the date. Nothing about any article.'
  };

  // ── helpers (the IPP conventions) ───────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function fold(v) { return String(v == null ? '' : v).replace(/\s*[\r\n]+\s*/g, ' ').replace(/[ \t]+/g, ' ').trim(); }
  function hooks() { return window.PP_WEBHOOKS || {}; }
  function workerBase() { var pb = hooks().planBoard || ''; return pb.replace(/\/plan-board.*$/, ''); }   // HC-P-WD1-6
  function boardData() { return (window.IPP && IPP.board && typeof IPP.board.data === 'function') ? IPP.board.data() : null; }
  function reload() { return (window.IPP && IPP.board && IPP.board.load) ? IPP.board.load({ fresh: true }) : Promise.resolve(null); }
  function planLocked() { var b = boardData(); return !!(b && b.plan && b.plan.locked); }
  function grSlot() { var b = boardData(); return ((b && b.slots) || []).filter(function (s) { return s.blockLabel === GR || s.blockType === GR; })[0] || null; }
  function doneField() { var b = boardData(); return (b && b.blockFields && b.blockFields.greetingDone) || ''; }
  function basisField() { var b = boardData(); return (b && b.blockFields && b.blockFields.greetingBasis) || ''; }
  function nlId() { var seen = {}, out = []; Array.prototype.forEach.call(document.querySelectorAll('.newsletter-source [data-nl-id]'), function (el) { var id = (el.getAttribute('data-nl-id') || '').trim(); if (id && !seen[id]) { seen[id] = 1; out.push(id); } }); return out.length === 1 ? out[0] : ''; }
  function pubBoard() { var b = boardData(); return b && b.publish ? b.publish : null; }
  function pubRow() { var p = pubBoard(), nl = nlId(); if (!p || !nl) return null; for (var i = 0; i < (p.newsletters || []).length; i++) if (p.newsletters[i].id === nl) return p.newsletters[i]; return null; }   // HC-P-WD1-8
  function nlFieldSlug(k) { var p = pubBoard(); return p && p.fields ? (p.fields[k] || '') : ''; }
  function nlFieldMissing(k) { var p = pubBoard(); return !!(p && p.types && p.types[k] === null); }
  function canvas() { return document.querySelector('.ipp-view[data-view="' + VIEW + '"] .ipp-canvas'); }
  function page() { var c = canvas(); return c ? c.querySelector('[data-wd-page]') : null; }
  function card(g) { var p = page(); return p ? p.querySelector('[data-wd-card="' + g + '"]') : null; }
  function field(k) { var p = page(); return p ? p.querySelector('[data-wd-field="' + k + '"]') : null; }
  function groupOf(k) { for (var g in GROUPS) if (GROUPS[g].indexOf(k) >= 0) return g; return ''; }
  function niceDate(v) { var sv = String(v || ''), m = sv.match(/^(\d{4}-\d\d-\d\d)(?:T00:00:00(?:\.000)?Z)?$/); var d = new Date(m ? m[1] + 'T12:00:00' : sv); return isNaN(d) ? sv : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }   // v1.0.1: a Webflow date at UTC midnight is a calendar day
  function when(iso) { var d = new Date(iso || ''); return isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function toast(t, kind, detail) { if (window.IxToast && IxToast.show) IxToast.show(t, kind, detail ? { detail: detail } : undefined); else console.warn('[ipp-words] ' + t + (detail ? ' \u00b7 ' + detail : '')); }
  function inRange(k, v) { var r = RANGE && RANGE[k]; if (!r) return false; var n = fold(v).length; return n >= r[0] && n <= r[1]; }   // v1.0.8: no ranges, nothing fits
  function rangeTxt(k) { var r = RANGE && RANGE[k]; if (!r) return '?'; return r[0] > 1 ? r[0] + '\u2013' + r[1] : '' + r[1]; }

  // ── state ───────────────────────────────────────────────────
  var W = { ring: {}, cpSeen: 0, keep: {}, draft: {}, open: {}, saving: '', savingAll: false, aiBusy: false, aiBefore: null, missing: {}, msg: {}, msgKind: {}, doneBusy: false, doneMsg: '', ctx: null, leads: null };

  // ── v1.1.0 what a clone copied ─────────────────────────────
  var GR_TOK = { title: 'gr-title', supershort: 'gr-short', paragraph: 'gr-para' };   // HC-P-WD110-1
  var CL_KEEP = 'Keeps on Save', CL_ACK = 'Copied by Clone. Keep or delete.', CL_DEL = 'Copied words removed. Write new ones, then Save.', CL_CHG = 'Changes on Save';   // HC-P-WD110-2
  function nlPendingNow() { var r = pubRow(); return r && r.values && Array.isArray(r.values.clonePending) ? r.values.clonePending : []; }
  function grPendingNow() { var gs = grSlot(); return gs && Array.isArray(gs.pending) ? gs.pending : []; }
  function copied(k) { return GR_TOK[k] ? grPendingNow().indexOf(GR_TOK[k]) >= 0 : nlPendingNow().indexOf(k) >= 0; }
  function hasDraft(k) { return Object.prototype.hasOwnProperty.call(W.draft, k); }
  function pinkKey(k) { return copied(k) && !W.keep[k] && !hasDraft(k); }
  function answered(k) { return copied(k) && (!!W.keep[k] || hasDraft(k)); }
  function pinkKeys() { return KEYS.filter(pinkKey); }
  function keepsIn(g) { return GROUPS[g].filter(function (k) { return W.keep[k] && copied(k); }); }
  function cpSlug() { var p = pubBoard(); return (p && p.fields && p.fields.clonePending) || ''; }
  function approvalField() { var b = boardData(); return (b && b.adFields && b.adFields.approval) || ''; }
  function keepPart(k) { if (planLocked() || !copied(k)) return; delete W.draft[k]; W.keep[k] = true; W.open[groupOf(k)] = true; setMsg(groupOf(k), '', ''); paint(true); }
  function delPart(k) {
    if (planLocked() || !copied(k)) return;
    delete W.keep[k]; W.draft[k] = ''; W.open[groupOf(k)] = true; setMsg(groupOf(k), '', ''); paint(true);
    var fe = field(k); if (fe) { fe.value = ''; fe.focus({ preventScroll: true }); }
  }
  function keepAll() {
    if (planLocked() || W.saving || W.savingAll) return;
    var ks = pinkKeys(); if (!ks.length) return;
    ks.forEach(function (k) { W.keep[k] = true; W.open[groupOf(k)] = true; });
    paint(true);
  }
  // v1.1.4 — Keep as written: every copied part still waiting, on every card, saved in one run; then the tick.
  var KW = { all: 'Keep all {n} as written', other: 'Keep the other {n} as written', open: 'Save or cancel the open card first', busy: 'Keeping\u2026' };   // HC-P-WD114-1
  function kwLabel(n) { return (W.cpSeen > n ? KW.other : KW.all).replace('{n}', n); }
  function keepAsWritten() {
    if (planLocked() || W.saving || W.savingAll || W.aiBusy || W.doneBusy) return;
    if (dirty().length) { toast('Keep as written', 'info', KW.open); paint(); return; }
    var f = facts(), ks = pinkKeys();
    if (!ks.length && !f.stale) return;
    ks.forEach(function (k) { W.keep[k] = true; });
    var nlAns = NL_KEYS.filter(answered), topTodo = f.stale || keepsIn('top').length > 0;   // v1.1.5: one write for the NEWSLETTER parts
    W.keepRun = ks.length; W.savingAll = true; paint();   // keepRun v1.1.6: the strip's words while it runs
    GROUP_ORDER.forEach(function (g) { if (keepsIn(g).length) W.open[g] = true; });   // v1.1.6: the strip shows for every card in the run
    var nlStep = function () {
      if (!nlAns.length) return Promise.resolve(true);
      var sent = {}; NL_KEYS.forEach(function (k) { sent[k] = saved()[k]; });
      W.saving = 'inbox'; setMsg('inbox', 'Keeping the words, then reading them back\u2026', ''); setMsg('end', '', ''); paint();
      return saveNl([], sent, nlAns).then(function (res) {
        W.saving = '';
        if (res && res.ok) { nlAns.forEach(function (k) { delete W.keep[k]; }); W.open.inbox = false; W.open.end = false; setMsg('inbox', '', ''); setMsg('end', '', ''); paint(true); return true; }
        setMsg('inbox', 'The answers were sent, but the plan still lists ' + (res && res.still ? res.still.join(', ') : 'them') + ' as copied. Your keeps are held here; click Keep as written again in a minute.', 'unverified'); paint(); return false;
      }).catch(function (e) { W.saving = ''; setMsg('inbox', 'The answers did not send: ' + ((e && e.message) || e) + '.', 'err'); paint(); return false; });
    };
    nlStep().then(function (ok) { return ok && topTodo ? save('top', true, true) : ok; }).then(function (all) {
      W.savingAll = false; W.keepRun = 0;
      if (!all) { paint(); return; }
      toast('Kept as written', 'ok', 'Every copied part is answered.');
      var f2 = facts();
      if (!f2.done && !f2.noField && !f2.stale && f2.gs) tick(true); else paint(true);
    }).catch(function () { W.savingAll = false; W.keepRun = 0; paint(); });
  }
  // ── v1.2.0 — the Greeting row through ix-content POST /nl-blocks/batch ──
  var STALE_LINE = 'Changed elsewhere. Look it over, then Save again.';                         // HC-P-WD120-1 (S6 ruling 3 words, as HC-P-L62-5)
  var STALE_HEAD = 'Someone else changed this plan', STALE_DETAIL = 'We added their change and kept yours. Look over the card with the gold ring, then Save again.';
  var GR_BF = { title: 'greetingTitle', supershort: 'greetingSupershort', paragraph: 'greetingParagraph' };   // HC-P-WD120-2
  function contentUrl() { return String(hooks().content || '').replace(/\/+$/, ''); }
  function bfSlug(k) { var b = boardData(); return (b && b.blockFields && b.blockFields[k]) || ''; }
  function versionWhy() { var b = boardData(), v = b && b.meta && b.meta.versions; return (v && v.why) || 'the plan data carries no row versions (it needs ix-issue-data v1.0.176 or later with its D1 binding)'; }
  function normV(v) { if (v === false || v == null || v === '') return ''; if (Array.isArray(v)) return v.slice().sort().join(','); return String(v).trim(); }
  function memberToken() {
    var ms = window.$memberstackDom;
    if (!ms || typeof ms.getMemberCookie !== 'function') return Promise.reject(new Error('Memberstack is not on this page, so the save cannot be signed. Nothing was sent.'));
    return Promise.resolve(ms.getMemberCookie()).then(function (t) { if (!t) throw new Error('You are not signed in (no Memberstack login on this page). Nothing was sent.'); return t; });
  }
  // One op, one batch. Resolves { status, body, res } (res = the op's result); rejects only when no answer came back.
  function sendOne(op, label) {
    var taId = ((boardData() || {}).plan || {}).titleAdminId || '';
    return memberToken().then(function (tok) {
      return fetch(contentUrl() + '/nl-blocks/batch', {
        method: 'POST', credentials: 'omit', ixLabel: label,
        headers: { 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json' },
        body: JSON.stringify({ taId: taId, ops: [op] })
      }).then(function (r) {
        return r.text().then(function (t) { var b = null; try { b = JSON.parse(t); } catch (e) { b = null; } b = b || {}; return { status: r.status, body: b, res: Array.isArray(b.results) ? (b.results[0] || null) : null }; });
      });
    });
  }
  // o = { words: {title, supershort, paragraph} | null, ans: [parts answered], done: true | false | undefined, label }
  // Resolves { ok:true } | { ok:false, stale:true } | { ok:false, lock:true, error } | { ok:false, why } ; rejects on a
  // fault before anything was sent, or when no answer came back (then the fresh read shows what landed).
  function grSave(o) {
    return reload().then(function () {
      var gs = grSlot(); if (!gs) throw new Error('this plan has no Greeting block');
      if (!contentUrl()) throw new Error('this page has no PP_WEBHOOKS.content address (ix-content). Nothing was sent.');
      if (!Number.isInteger(gs.version)) throw new Error('the Greeting block carries no version, so ix-content cannot check it: ' + versionWhy() + '. Reload the page and try again. Nothing was sent.');
      var fields = {}, checks = [], missing = [];
      if (o.words) {
        GR_KEYS.forEach(function (k) { var s = bfSlug(GR_BF[k]); if (!s) missing.push('blockFields.' + GR_BF[k]); else { fields[s] = o.words[k]; checks.push([LABEL[k].toLowerCase(), s, o.words[k], true]); } });
        var basis = (gs.greeting && gs.greeting.basis) || null, now = basis ? basis.now : '';
        if (now && typeof now !== 'string') now = JSON.stringify(now);
        if (basisField() && now) { fields[basisField()] = now; checks.push(['the basis stamp', basisField(), now]); }
      }
      if (o.ans && o.ans.length) {
        var af = approvalField();
        if (!af) missing.push('adFields.approval');
        else {
          var gone = o.ans.map(function (k) { return GR_TOK[k]; }), pend = grPendingNow(), rest = pend.filter(function (t) { return gone.indexOf(t) < 0; });
          if (rest.length !== pend.length) { fields[af] = rest.join(','); checks.push(['the copy marks', af, rest.join(',')]); }
        }
      }
      if (o.done === true || o.done === false) { var df = doneField(); if (!df) missing.push('blockFields.greetingDone'); else { fields[df] = o.done; checks.push(['the done tick', df, o.done]); } }
      if (missing.length) throw new Error('the plan data does not name ' + missing.join(', ') + ' (ix-issue-data v1.0.181 or later). Nothing was sent.');
      if (!Object.keys(fields).length) return { ok: true, nothing: true };
      return sendOne({ op: 'update', id: gs.id, version: gs.version, fields: fields }, o.label || 'Words save').then(function (a) {
        var b = a.body, res = a.res;
        if (res && res.stale) return { ok: false, stale: true };
        if (b.released || b.hold || b.issueSent) return { ok: false, lock: true, error: (typeof b.error === 'string' && b.error.trim()) || 'This issue cannot be changed.' };
        if (!(a.status === 200 || a.status === 207) || !res || res.error || !res.ok || !res.row) {
          var why = (res && res.error) || (typeof b.error === 'string' && b.error.trim()) || ('ix-content answered HTTP ' + a.status);
          return { ok: false, why: why };
        }
        var fd = res.row.fields || {}, bad = '';
        checks.forEach(function (ck) { if (bad) return; var got = fd[ck[1]]; if (ck[3] ? fold(got) !== fold(ck[2]) : normV(got) !== normV(ck[2])) bad = 'did not store ' + ck[0]; });
        return bad ? { ok: false, why: 'the Greeting block ' + bad } : { ok: true };
      }, function (e) {
        throw new Error('ix-content gave no answer (' + ((e && e.message) || 'the request failed') + '). Reload to see what landed');
      });
    }).then(function (r) {
      if (r && r.nothing) return r;
      return reload().then(function () { return r; }, function () { return r; });   // repaint only; the echo has judged
    });
  }
  function ringOff(g) { if (W.ring[g]) { delete W.ring[g]; } }
  function saved() {
    var g = (grSlot() || {}).greeting || {}, r = pubRow(), v = (r && r.values) || {}, o = {};
    GR_KEYS.forEach(function (k) { o[k] = fold(g[k]); });
    NL_KEYS.forEach(function (k) { o[k] = fold(v[k]); });
    return o;
  }
  function val(k) { return Object.prototype.hasOwnProperty.call(W.draft, k) ? W.draft[k] : saved()[k]; }
  function dirty(g) { return Object.keys(W.draft).filter(function (k) { return !g || groupOf(k) === g; }); }
  function dirtyGroups() { return GROUP_ORDER.filter(function (g) { return dirty(g).length > 0 || keepsIn(g).length > 0; }); }   // v1.0.5; v1.1.0 a Keep counts
  function groupBad(g) { return GROUPS[g].some(function (k) { return !inRange(k, val(k)); }); }          // v1.0.5: a card Save would refuse
  function isOpen(g) { return !!W.open[g] || dirty(g).length > 0 || keepsIn(g).length > 0; }
  function writtenKeys() { var s = saved(); return KEYS.filter(function (k) { return !!s[k]; }); }

  // the facts every paint reads
  function facts() {
    var hasRanges = syncRanges();                                           // v1.0.8
    var gs = grSlot(), flag = gs ? gs.greetingDone : null, basis = (gs && gs.greeting && gs.greeting.basis) || null;
    var written = writtenKeys(), empty = written.length === 0;
    var isStale = !!(basis && basis.stale) && !empty;
    var sv = saved(), problems = [];                                      // v1.0.2: what Compile would call red
    if (!hasRanges) problems.push({ key: 'subject', text: NO_RANGES });   // v1.0.8: one line, on the inbox card
    KEYS.forEach(function (k) { var v = sv[k]; if (!hasRanges) return; if (!v) problems.push({ key: k, text: LABEL[k].toLowerCase() + ' missing' }); else if (!inRange(k, v)) problems.push({ key: k, text: LABEL[k].toLowerCase() + ' is ' + v.length + ' characters, needs ' + rangeTxt(k).replace('\u2013', ' to ') }); });
    return { gs: gs, flag: flag, basis: basis, written: written, empty: empty, stale: isStale, changes: (basis && basis.changes) || [], problems: problems,
      done: flag === true && !isStale, noField: !!gs && flag === null, noBasis: !!gs && !(basis && basis.hasField), locked: planLocked(), nl: !!pubRow(), ranges: hasRanges };   // ranges v1.0.8
  }

  // ── the done tick (v1.2.0: one update op on the GR row's greeting-done, through ix-content) ──
  function flagSave(on) {
    if (!grSlot()) return Promise.reject(new Error('this plan has no Greeting block'));
    return grSave({ done: !!on, label: on ? 'Words · mark done' : 'Words · undo done' });
  }
  function unsavedElsewhere() {
    var L = window.IPP && IPP.layout, P = window.IPP && IPP.picker, out = [];
    try { if (L && L.pending && L.pending().length) out.push('Layout has unsaved changes.'); } catch (e) {}
    try { if (P && P.pending) { var p = P.pending(), c = (p.adds || []).length + Object.keys(p.fills || {}).length + Object.keys(p.clears || {}).length + Object.keys(p.removes || {}).length + Object.keys(p.links || {}).length + Object.keys(p.holds || {}).length + Object.keys(p.lists || {}).length; if (c) out.push('The Editorial Picker has unsaved changes.'); } } catch (e) {}   // v1.0.6: lists too (ipp-picker v1.44)
    return out.join(' ');
  }
  function tick(on) {
    var f = facts();
    if (W.doneBusy || W.saving || W.aiBusy) return;
    if (f.locked) { toast('This plan is locked', 'info', 'The words cannot change.'); return; }
    var elsewhere = unsavedElsewhere(); if (elsewhere && on) { W.doneMsg = elsewhere + ' Save or cancel them first.'; paint(); return; }
    if (f.stale && on) { W.doneMsg = 'Keep the words or write them again; that marks the newsletter done again.'; paint(); return; }
    W.doneBusy = true; W.doneMsg = on ? 'Marking it done\u2026' : 'Undoing\u2026'; paint();
    flagSave(on).then(function (res) {
      W.doneBusy = false; W.doneMsg = '';
      if (res && res.ok) { toast(on ? 'Newsletter marked done' : 'Done tick removed', 'ok', on ? 'The words can be written now.' : 'Write the words when the newsletter is done.'); paint(true); return; }   // v1.2.0: judged from the echoed row
      if (res && res.stale) { toast(STALE_HEAD, 'err', 'We added their change. Look it over, then tick again.'); W.doneMsg = STALE_LINE; paint(true); return; }
      if (res && res.lock) { toast('Not saved', 'err', res.error + (/Nothing was sent/.test(res.error) ? '' : ' Nothing was sent.')); paint(true); return; }
      W.doneMsg = 'The tick did not save: ' + ((res && res.why) || 'no result came back') + '.'; paint();
    }).catch(function (e) { W.doneBusy = false; W.doneMsg = 'The tick did not save: ' + ((e && e.message) || e) + '.'; paint(); });
  }

  // ── the issue digest and the prompt ────────────────────────
  function fetchContext() {
    var b = boardData(), planId = b && b.plan && b.plan.id, base = workerBase();
    if (!planId) return Promise.reject(new Error('the plan has not been read yet'));
    if (!base) return Promise.reject(new Error('this page has no PP_WEBHOOKS.planBoard address, so the issue digest cannot be read'));
    return fetch(base + '/greeting-context?planId=' + encodeURIComponent(planId), { method: 'GET', credentials: 'omit' }).then(function (r) {
      return r.text().then(function (t) {
        var o = null; try { o = JSON.parse(t); } catch (e) {}
        if (!r.ok || !o || o.ok !== true) throw new Error((o && o.error) || ('the Data Worker answered HTTP ' + r.status + ' to /greeting-context (v1.0.68 needed)'));
        return o;
      });
    });
  }
  function midWindow(n) { return n >= MID_FROM + 1 ? [MID_FROM, Math.min(6, n)] : [Math.max(2, Math.ceil(n / 2) + 1), n]; }   // HC-P-WD1-7: positions 4 to 6, else the back half
  function digestText(ctx) {
    var out = [], n = ctx.articles.length, mw = midWindow(n);
    out.push('Articles in this issue, in page order (position 1 is the feature; the middle of the page is ' + (n > 1 ? 'positions ' + mw[0] + ' to ' + mw[1] : 'position 1') + '):');
    if (!n) out.push('- none');
    ctx.articles.forEach(function (a, i) {
      out.push('');
      out.push((i + 1) + '. ' + (a.title || 'Untitled') + (a.subTitle ? ' \u2014 ' + a.subTitle : '') + (a.section ? ' [' + a.section + ']' : '') + (i === 0 ? ' (the feature)' : (i + 1 >= mw[0] && i + 1 <= mw[1]) ? ' (middle of the page)' : ''));
      if (a.writer) out.push('   By: ' + a.writer);
      if (a.banner) out.push('   Flag: ' + a.banner);
      if (a.summary) out.push('   Summary: ' + a.summary);
      if (a.body) out.push('   Story: ' + a.body.replace(/\n+/g, ' '));
    });
    out.push(''); out.push('Events in this issue:');
    if (!ctx.events.length) out.push('- none');
    ctx.events.forEach(function (e) {
      out.push('- ' + (e.name || 'Untitled') + [e.when, e.time, e.venue].filter(Boolean).map(function (x) { return ' (' + x + ')'; }).join('') + (e.description ? ': ' + e.description.replace(/\n+/g, ' ') : ''));
    });
    if (ctx.finds && ctx.finds.length) {
      out.push(''); out.push('The Find (a paid listing in this issue):');
      ctx.finds.forEach(function (f) { out.push('- ' + (f.title || 'Untitled') + (f.text ? ': ' + f.text.replace(/\n+/g, ' ') : '')); });
    }
    return out.join('\n');
  }
  function changesText(changes) {
    return (changes || []).map(function (c) {
      var w = c.what === 'find' ? 'The Find' : c.what;
      if (c.kind === 'moved') return c.name + ' moved from position ' + c.from + ' to ' + c.to;
      if (c.kind === 'added') return w + ' added: ' + c.name + (c.to ? ' (position ' + c.to + ')' : '');
      if (c.kind === 'removed') return w + ' removed: ' + c.name;
      return c.name + (c.what === 'find' ? ' (The Find)' : c.what === 'event' ? ' (event)' : '') + ' was edited';
    });
  }
  function sharedPrompt(ctx, f, only) {                                   // only: the keys being written (v1.0.3), else all six
    var b = boardData(), plan = (b && b.plan) || {}, name = ctx.plan.titleName || plan.titleName || 'the newsletter';
    var r = pubRow(), sendAt = r && r.values ? r.values.sendAt : '';
    var cur = saved(), have = KEYS.filter(function (k) { return cur[k] && (!only || only.indexOf(k) < 0); }), redo = KEYS.filter(function (k) { return cur[k] && only && only.indexOf(k) >= 0; });
    return 'Write the words that carry a reader into this issue of a local community newsletter: the subject line and preview text in the inbox, the title, short greeting and paragraph at the top, and the closing at the end.\n\n' +
      'Newsletter: ' + name + '\n' +
      ((ctx.plan.date || plan.date) ? 'Issue date: ' + niceDate(ctx.plan.date || plan.date) + '\n' : '') +
      (sendAt ? 'Email goes out: ' + niceDate(sendAt) + '\n' : '') +
      'Today: ' + niceDate(new Date().toISOString()) + '\n' +
      '\n' + digestText(ctx) +
      (f && f.stale && f.changes.length ? '\n\nSince the words were last written the issue changed: ' + changesText(f.changes).join('; ') + '. The new words must fit the issue as it stands now.' : '') +
      (have.length ? (only ? '\n\nThese parts are already written and stay as they are; the parts you write must not lead with the items they lead with: ' : '\n\nThe current words, for reference (write new ones, do not repeat them): ') + have.map(function (k) { return LABEL[k] + ': \u201c' + cur[k] + '\u201d'; }).join(' ') : '') +
      (redo.length ? '\n\nBeing rewritten (do not repeat): ' + redo.map(function (k) { return LABEL[k] + ': \u201c' + cur[k] + '\u201d'; }).join(' ') : '') +
      '\n\nRules:\n' + HOUSE_RULES.map(function (r) { return '- ' + r; }).join('\n') + '\n';
  }
  function ask(prompt, kind) {                                            // v1.0.1: kind 'json' prefills "{" so the answer starts as JSON
    var json = kind === 'json', msgs = [{ role: 'user', content: prompt }];   // v1.0.2: no prefill (the proxy's model refuses it)
    return fetch(String(hooks().anthropicProxy || ''), { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: WD_MODEL, max_tokens: 4000, messages: msgs }) })
      .then(function (r) { return r.text().then(function (t) {
        var b = null; try { b = JSON.parse(t); } catch (e) {}
        if (!r.ok) throw new Error((b && b.error && (b.error.message || b.error)) || ('the AI service answered HTTP ' + r.status));
        var text = ((b && b.content) || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('');
        if (b && b.stop_reason === 'max_tokens') throw new Error('the answer ran past ' + 4000 + ' tokens and was cut off');
        return text;
      }); });
  }
  function gate(f) {                                                        // '' when the session may open
    if (f.locked) return 'This plan is locked.';
    if (!f.ranges) return NO_RANGES + '.';                                  // v1.0.8
    if (!f.gs) return 'This plan has no Greeting block.';
    if (!f.nl) return 'This plan has no newsletter linked, so the subject, preview and closing have nowhere to save.';
    if (!hooks().anthropicProxy) return 'AI writing is not set up on this page (PP_WEBHOOKS.anthropicProxy).';
    if (!f.done && !f.stale && !f.noField) return 'Mark the newsletter done first.';
    return '';
  }
  function fieldSpec(k, cur) {
    var r = (RANGE && RANGE[k]) || [0, 0], group = groupOf(k);           // v1.0.8: gate() stops the writer before this runs without ranges
    return { key: k, label: LABEL[k], short: LABEL[k].split(' ')[0], group: GROUP_WORD[group], min: r[0] > 1 ? r[0] : 0, max: r[1], count: WD_COUNT[k], tones: WD_TONES[k] || null,
      cols: WD_COUNT[k], rows: k === 'paragraph' ? 6 : (k === 'subject' || k === 'title') ? 1 : 2, value: cur[k], prompt: FIELD_PROMPT[k], apart: WD_APART[k] || null };   // apart v1.1.7
  }
  function generate(group) {                                              // group (v1.0.3): one card's parts; else all six
    var f = facts(), keys = group ? GROUPS[group] : KEYS;
    if (W.aiBusy || W.saving || W.doneBusy) return;
    var g = gate(f); if (g) { toast('Not ready to write', 'info', g); return; }
    if (!window.IxAI || !IxAI.open) { toast('The AI modal is not on this page', 'err', 'ix-ai-v1.4.1.js is missing from the body.'); return; }
    W.aiBusy = true; setMsg('', 'Reading the issue\u2026', ''); paint();
    fetchContext().then(function (ctx) {
      if (!ctx.articles.length && !ctx.events.length) throw new Error('the issue has no articles or events yet; the words are written from them');
      W.ctx = ctx;
      var cur = {}; KEYS.forEach(function (k) { cur[k] = val(k); });
      setMsg('', '', ''); paint();
      return IxAI.open({
        title: group ? 'Write: ' + GROUP_WORD[group].toLowerCase() : f.empty ? 'Write the words' : 'Write the words again',
        context: [ctx.plan.titleName, ctx.plan.date ? niceDate(ctx.plan.date) + ' issue' : '', plural(ctx.articles.length, 'article') + ', ' + plural(ctx.events.length, 'event') + (ctx.finds.length ? ', The Find' : '')].filter(Boolean).join(' \u00b7 '),
        model: WD_MODEL,
        prompt: sharedPrompt(ctx, f, group ? keys : null),
        ask: ask,
        shared: sharedItems(ctx),                                           // v1.1.7: ix-ai v1.4.1 checks subject and preview apart
        useLabel: 'Use',
        fields: keys.map(function (k) { return fieldSpec(k, cur); })
      });
    }).then(function (out) {
      W.aiBusy = false;
      if (!out) { paint(); return; }
      var changed = keys.filter(function (k) { return out.values && out.values[k] != null && fold(out.values[k]); });   // v1.0.4: only the parts given a new version
      if (!changed.length) { paint(); return; }
      var before = {}; KEYS.forEach(function (k) { before[k] = val(k); });
      W.aiBefore = before;
      changed.forEach(function (k) { set(k, out.values[k]); });
      changed.forEach(function (k) { W.open[groupOf(k)] = true; });
      var all = {}; KEYS.forEach(function (k) { all[k] = val(k); }); W.leads = leadsOf(all, W.ctx);
      var opened = GROUP_ORDER.filter(function (gk) { return changed.some(function (k) { return groupOf(k) === gk; }); });
      opened.forEach(function (gk) { setMsg(gk, opened.length > 1 ? 'Read it once more, then Save here or Save all above. Undo puts back what was there.' : 'Read it once more, then Save. Undo puts back what was there.', 'ok'); });   // v1.0.5
      paint(true);
      var fe = field(changed[0]); if (fe) fe.focus({ preventScroll: true });
    }).catch(function (e) { W.aiBusy = false; setMsg(group || 'inbox', 'The words could not be written: ' + ((e && e.message) || e) + '.', 'err'); paint(); });
  }
  // which item each part leads with (the first named item in its text); session-only
  var SKIP_WORDS = ['with', 'from', 'that', 'this', 'your', 'their', 'meet', 'week'];   // v1.0.6, HC-P-WD1-9: plain words that never key a lead
  function leadsOf(values, ctx) {
    if (!ctx) return null;
    var items = [];
    (ctx.articles || []).forEach(function (a, i) { items.push({ name: a.title, pos: i + 1, kind: 'article' }); });
    (ctx.events || []).forEach(function (e) { items.push({ name: e.name, kind: 'event' }); });
    (ctx.finds || []).forEach(function (f) { items.push({ name: f.title, kind: 'find' }); });
    // v1.0.6: words of the title's own name never key a match (the
    // community's name sits in every issue); plus plain words (HC-P-WD1-9)
    var words = function (t) { return String(t || '').toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean); };
    var b = boardData(), plan = (b && b.plan) || {};
    var skip = SKIP_WORDS.concat(words((ctx.plan && ctx.plan.titleName) || plan.titleName || ''));
    var keyOf = function (name) {
      var w = words(name).filter(function (x) { return x.length > 3 && skip.indexOf(x) < 0; });
      return w.slice(0, 3);
    };
    var out = {};
    ['subject', 'preview', 'title', 'supershort', 'paragraph'].forEach(function (k) {
      var txt = String(values[k] || '').toLowerCase(), best = null;
      items.forEach(function (it) {
        var ks = keyOf(it.name); if (!ks.length) return;
        var at = -1; ks.forEach(function (x) { var i = txt.indexOf(x); if (i >= 0 && (at < 0 || i < at)) at = i; });
        if (at >= 0 && (!best || at < best.at)) best = { at: at, it: it };
      });
      if (best) out[k] = best.it;
    });
    return out;
  }

  // v1.1.7: which issue items two texts both name (ix-ai's shared()). An item is known by its distinctive words: significant
  // words of its own name that no other item in this issue uses (singular and possessive folded). Session-only.
  function sharedItems(ctx) {
    var b = boardData(), plan = (b && b.plan) || {};
    var stem = function (w) { w = w.replace(/'s$/, '').replace(/'$/, ''); return w.length > 4 && /s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w; };
    var words = function (t) { return String(t || '').toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).map(stem).filter(Boolean); };
    var skip = {}; SKIP_WORDS.concat(words((ctx.plan && ctx.plan.titleName) || plan.titleName || '')).forEach(function (w) { skip[stem(w)] = 1; });
    var items = [];
    (ctx.articles || []).forEach(function (a) { items.push({ name: a.title || 'an article', text: [a.title, a.subTitle].join(' ') }); });
    (ctx.events || []).forEach(function (e) { items.push({ name: e.name || 'an event', text: e.name }); });
    (ctx.finds || []).forEach(function (f) { items.push({ name: f.title || 'The Find', text: f.title }); });
    var uses = {};
    items.forEach(function (it) { var seen = {}; it.keys = words(it.text).filter(function (w) { return w.length > 3 && !skip[w]; }).filter(function (w) { if (seen[w]) return false; seen[w] = 1; return true; }); it.keys.forEach(function (w) { uses[w] = (uses[w] || 0) + 1; }); });
    items.forEach(function (it) { it.keys = it.keys.filter(function (w) { return uses[w] === 1; }); });
    var named = function (t) { var set = {}; words(t).forEach(function (w) { set[w] = 1; }); return items.filter(function (it) { return it.keys.some(function (w) { return set[w]; }); }); };
    return function (a, b) { var A = named(a); if (!A.length) return []; var B = named(b); return A.filter(function (it) { return B.indexOf(it) >= 0; }).map(function (it) { return it.name; }); };
  }

  // ── the boxes ───────────────────────────────────────────────
  function set(k, v) { v = fold(v); if (v === saved()[k]) delete W.draft[k]; else W.draft[k] = v; delete W.missing[k]; }
  function setMsg(g, text, kind) { if (!g) { GROUP_ORDER.forEach(function (x) { W.msg[x] = text; W.msgKind[x] = kind || ''; }); return; } W.msg[g] = text; W.msgKind[g] = kind || ''; }
  function input(el) {
    var k = el.getAttribute('data-wd-field');
    if (/[\r\n]/.test(el.value)) { var at = el.selectionStart; el.value = el.value.replace(/\r\n|[\r\n]/g, ' '); try { el.setSelectionRange(at, at); } catch (e) {} }
    var g = groupOf(k); set(k, el.value); if (val(k) !== saved()[k]) W.open[g] = true; setMsg(g, '', ''); paint();
  }
  function undo() { if (!W.aiBefore) return; var b = W.aiBefore; W.aiBefore = null; W.leads = null; KEYS.forEach(function (k) { set(k, b[k]); }); if (!dirty().length) W.open = {}; setMsg('', '', ''); paint(true); }
  function revert(g) { GROUPS[g].forEach(function (k) { delete W.keep[k]; }); dirty(g).forEach(function (k) { delete W.draft[k]; delete W.missing[k]; }); W.open[g] = false; ringOff(g); setMsg(g, '', ''); if (!dirty().length) W.aiBefore = null; paint(true); }
  function openCard(g) {
    var f = facts(); if (f.locked) return;
    if (!f.done && !f.stale && !f.noField) { toast('Not ready to write', 'info', 'Mark the newsletter done first.'); return; }
    W.open[g] = true; paint(true);
    var k = GROUPS[g].filter(function (x) { return !fold(val(x)); })[0] || GROUPS[g][0]; var fe = field(k); if (fe) fe.focus({ preventScroll: true });
  }
  function openAll() { var f = facts(); if (f.locked) return; if (!f.done && !f.stale && !f.noField) { toast('Not ready to write', 'info', 'Mark the newsletter done first.'); return; } GROUP_ORDER.forEach(function (g) { W.open[g] = true; }); paint(true); var fe = field('subject'); if (fe) fe.focus({ preventScroll: true }); }

  // ── saves ───────────────────────────────────────────────────
  // NEWSLETTER: Scenario 124 op nlmeta, as Send Setup saves; read back the values
  function saveNl(keys, sent, ans) {                                     // v1.1.0: keys = the parts that changed; ans = the copied parts answered
    ans = ans || [];
    var url = String(hooks().blockWriter || '');
    if (!url) return Promise.reject(new Error('this page has no PP_WEBHOOKS.blockWriter address (Scenario 124)'));
    if (ans.length && !cpSlug()) return Promise.reject(new Error('the plan data does not name the clone-pending field (publish.fields.clonePending, Data Worker v1.0.133)'));
    return (ans.length ? reload() : Promise.resolve()).then(function () {   // v1.1.0: the keys as they are now
    var row = pubRow();
    if (!row) throw new Error('the plan data has no newsletter for this plan');
    var fd = {}, missing = keys.filter(function (k) { return !nlFieldSlug(k) || nlFieldMissing(k); });
    if (missing.length) throw new Error('NEWSLETTER has no field for ' + missing.map(function (k) { return LABEL[k].toLowerCase(); }).join(', ') + ' (the Worker names ' + missing.map(nlFieldSlug).join(', ') + ')');
    keys.forEach(function (k) { fd[nlFieldSlug(k)] = sent[k]; });
    if (ans.length) { var rest = nlPendingNow().filter(function (t) { return ans.indexOf(t) < 0; }); fd[cpSlug()] = rest.length ? rest.join(',') : null; }
    if (!Object.keys(fd).length) return { ok: true };
    var batchId = 'wdn-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    var ops = [{ id: row.id, body: JSON.stringify({ fieldData: fd }) }];
    var u = url + (url.indexOf('?') < 0 ? '?' : '&') + 'op=nlmeta&batchId=' + encodeURIComponent(batchId) + '&batch=' + encodeURIComponent(JSON.stringify({ ops: ops }));
    return fetch(u, { method: 'GET', credentials: 'omit' }).then(function (r) {
      return r.text().then(function (t) {
        if (!r.ok) throw new Error('Scenario 124 answered HTTP ' + r.status + ' to op nlmeta');
        var b; try { b = JSON.parse(t); } catch (x) { throw new Error('Scenario 124 sent a reply that is not JSON (op nlmeta)'); }
        if (b && b.op && b.op !== 'nlmeta') throw new Error('Scenario 124 does not know op nlmeta yet');
        var res = (b && b.results && b.results[0]) || null;
        if (!res || res.ok !== true || !res.id) throw new Error((res && res.err) || 'Webflow refused the write');
      });
    }).then(function () {
      var tries = 0;
      var check = function () {
        tries++;
        return new Promise(function (r) { setTimeout(r, GAP_MS); }).then(reload).then(function () {
          var s = saved(), still = ans.filter(function (k) { return nlPendingNow().indexOf(k) >= 0; }), same = keys.every(function (k) { return s[k] === sent[k]; }) && !still.length;   // v1.1.0 the keys too; v1.1.5 what the plan still lists
          if (same) return { ok: true };
          if (tries < TRIES) return check();
          return { ok: false, still: still.map(function (k) { return LABEL[k].toLowerCase(); }) };
        });
      };
      return check();
    });
    });
  }
  // keep = true re-sends the saved GR words with today's basis, so the
  // stored basis matches the issue again and the done tick is back.
  function save(g, keep, quiet) {                                          // v1.0.5: resolves true when the write read back; quiet = no toast (Save all speaks once)
    if ((W.saving && !quiet) || W.aiBusy || W.doneBusy) return Promise.resolve(false);
    var f = facts();
    if (f.locked) { toast('This plan is locked', 'info', 'The words cannot change.'); return Promise.resolve(false); }
    if (!f.gs) { toast('Can\u2019t save', 'err', 'This plan has no Greeting block.'); return Promise.resolve(false); }
    var keys = GROUPS[g], sent = {}, ans = keep ? GROUPS[g].filter(copied) : GROUPS[g].filter(answered);   // v1.1.0 the copied parts this Save answers; v1.1.2 Keep these words keeps them all
    keys.forEach(function (k) { sent[k] = keep ? saved()[k] : fold(val(k)); });
    if (!keep && !dirty(g).length && !ans.length) return Promise.resolve(false);
    W.missing = {};
    var out = (keep || dirty(g).length) ? keys.filter(function (k) { return !inRange(k, sent[k]); }) : [];   // v1.1.0 a Keep alone writes no words
    if (out.length && !keep) {
      out.forEach(function (k) { W.missing[k] = true; });
      setMsg(g, 'Not saved: ' + out.map(function (k) { return LABEL[k].toLowerCase() + ' needs ' + rangeTxt(k).replace('\u2013', ' to ') + ' characters' + (fold(sent[k]) ? ' (now ' + fold(sent[k]).length + ')' : ''); }).join('; ') + '.', 'err');
      paint(); var fe = field(out[0]); if (fe) fe.focus(); return Promise.resolve(false);
    }
    W.saving = g; ringOff(g); setMsg(g, keep ? 'Keeping the words…' : 'Saving…', ''); paint();
    var wasStale = !!f.stale;                                               // v1.0.7
    var p = g === 'top'
      ? grSave({ words: (keep || dirty('top').length) ? sent : null, ans: ans, label: keep ? 'Words · keep as written' : 'Words · at the top' })   // v1.2.0: words, basis and copy marks in ONE update
      : saveNl(keep ? keys : dirty(g), sent, ans);
    return p.then(function (res) {
      W.saving = '';
      if (res && res.ok) {
        keys.forEach(function (k) { delete W.draft[k]; delete W.keep[k]; });   // v1.1.0
        if (!dirty().length) W.aiBefore = null;
        W.open[g] = false; setMsg(g, '', '');
        if (!keep && g !== 'top' && wasStale) {                              // v1.0.7: a Save on any card is the review; re-stamp the saved greeting words with today's basis
          var gr = {}, sv = saved(); GR_KEYS.forEach(function (k) { gr[k] = sv[k]; });
          W.saving = 'top'; setMsg('top', 'Stamping the words against the issue as it stands…', ''); paint();
          return grSave({ words: gr, label: 'Words · stamp' }).then(function (r2) {
            W.saving = '';
            if (r2 && r2.ok) { setMsg('top', '', ''); if (!quiet) toast(GROUP_WORD[g] + ' saved', 'ok', 'Stamped against the issue as it stands.'); }
            else if (r2 && r2.stale) { W.ring.top = true; setMsg('top', STALE_LINE, 'err'); toast(STALE_HEAD, 'err', 'The ' + GROUP_WORD[g].toLowerCase() + ' saved. The stamp was not sent: ' + STALE_DETAIL.charAt(0).toLowerCase() + STALE_DETAIL.slice(1) + ' Click Keep as written to stamp again.'); }
            else if (r2 && r2.lock) toast('Not saved', 'err', r2.error);
            else setMsg('top', 'The ' + GROUP_WORD[g].toLowerCase() + ' saved, but the stamp did not land' + (r2 && r2.why ? ': ' + r2.why : '') + '. Click Keep as written to stamp again.', 'err');
            paint(true); return true;
          }).catch(function (e) { W.saving = ''; setMsg('top', 'The ' + GROUP_WORD[g].toLowerCase() + ' saved, but the stamp did not send: ' + ((e && e.message) || e) + '. Click Keep as written to stamp again.', 'err'); paint(true); return true; });
        }
        if (!quiet) toast(keep ? 'Words kept' : GROUP_WORD[g] + ' saved', 'ok', keep ? 'Stamped against the issue as it stands.' : (g === 'top' ? 'The Greeting block came back as sent.' : 'Read back from the plan.'));
        paint(true); return true;
      } else if (res && res.stale) {                                          // v1.2.0: nothing was sent; the page re-read, the words stay in the card
        W.ring[g] = true; W.open[g] = true; setMsg(g, STALE_LINE, 'err');
        toast(STALE_HEAD, 'err', STALE_DETAIL); paint(true);
      } else if (res && res.lock) {                                           // v1.2.0: sent, released or held: the Worker's sentence
        setMsg(g, res.error, 'err'); toast('Not saved', 'err', res.error + (/Nothing was sent/.test(res.error) ? '' : ' Nothing was sent.')); paint();
      } else if (res && res.why) {                                            // v1.2.0: the echoed row disagrees, or ix-content refused
        setMsg(g, 'Not saved: ' + res.why + '. Your words are kept here.', 'err'); paint();
      } else { setMsg(g, 'The words were sent, but the plan does not show them yet. Your words are kept here. Check again in a minute.', 'unverified'); paint(); }
      return false;
    }).catch(function (e) { W.saving = ''; setMsg(g, 'The words did not send: ' + ((e && e.message) || e) + '. Your words are kept here.', 'err'); paint(); return false; });
  }
  // v1.0.5 — Save all: the unsaved cards in page order, one after the other, one toast at the end
  function saveAll() {
    if (W.saving || W.savingAll || W.aiBusy || W.doneBusy) return;
    var todo = dirtyGroups(); if (todo.length < 2) return;
    var bad = todo.filter(groupBad); if (bad.length) { setMsg(bad[0], 'Not saved: fix the range here first.', 'err'); paint(); return; }
    W.savingAll = true; paint();
    var done = [];
    var step = function (i) {
      if (i >= todo.length) return Promise.resolve(true);
      return save(todo[i], false, true).then(function (ok) { if (!ok) return false; done.push(GROUP_WORD[todo[i]]); return step(i + 1); });
    };
    step(0).then(function (all) {
      W.savingAll = false;
      if (done.length) toast(all ? 'Words saved \u00b7 ' + plural(done.length, 'card') : 'Saved ' + done.length + ' of ' + todo.length + ' cards', all ? 'ok' : 'info', (all ? 'Read back from the plan.' : done.join(', ') + ' read back; the other card says why it stopped.'));
      paint(true);
    }).catch(function () { W.savingAll = false; paint(); });
  }
  function undoAll() { if (W.aiBefore) { undo(); return; } W.ring = {}; GROUP_ORDER.forEach(function (g) { GROUPS[g].forEach(function (k) { delete W.keep[k]; }); dirty(g).forEach(function (k) { delete W.draft[k]; delete W.missing[k]; }); W.open[g] = false; }); W.leads = null; setMsg('', '', ''); paint(true); }

  // ── markup ──────────────────────────────────────────────────
  function fieldHtml(k, cls) {
    var multi = !(k === 'subject' || k === 'title');                       // v1.0.8: maxlength is set in paint() from the board's ranges
    var ctl = multi
      ? '<textarea class="ix-picker-input ipp-wd-in" id="ipp_wd_' + k + '" data-wd-field="' + k + '" rows="' + (k === 'paragraph' ? 6 : 2) + '" placeholder="' + esc(placeholder(k)) + '" hidden></textarea>'
      : '<input type="text" class="ix-picker-input ipp-wd-in" id="ipp_wd_' + k + '" data-wd-field="' + k + '" placeholder="' + esc(placeholder(k)) + '" hidden>';
    return '<div class="ipp-wd-f ' + (cls || '') + '"><label class="ipp-wd-l" for="ipp_wd_' + k + '">' + esc(LABEL[k]) + ' <span class="ipp-wd-where">' + esc(WHERE[k]) + '</span><span class="ipp-wd-n" data-wd-count="' + k + '"></span></label>' +
      '<p class="ipp-wd-read is-' + k + '" data-wd-read="' + k + '"></p>' + ctl +
      '<p class="ipp-wd-cl" data-wd-cl="' + k + '" hidden></p></div>';   // v1.1.0 the clone line
  }
  function placeholder(k) {
    return { subject: 'What the inbox shows as the subject', preview: 'The grey line after the subject in the inbox', title: 'The heading over the greeting; it prints in the masthead', supershort: 'One line; it prints in the email', paragraph: 'The greeting readers see on the web page', closing: 'The last line before the footer' }[k];
  }
  function cardHtml(g) {
    var body = g === 'inbox'
      ? '<div class="ipp-wd-inbox" data-wd-inbox><div class="ipp-wd-av" data-wd-av></div><div class="ipp-wd-lines"><div class="ipp-wd-from"><span data-wd-from></span><small data-wd-when></small></div><div class="ipp-wd-sl" data-wd-ib="subject"></div><div class="ipp-wd-pv" data-wd-ib="preview"></div></div></div>' +
        '<div class="ipp-wd-row2">' + fieldHtml('subject') + fieldHtml('preview') + '</div>'
      : g === 'top'
      ? '<div class="ipp-wd-row2">' + fieldHtml('title') + fieldHtml('supershort') + fieldHtml('paragraph', 'is-wide') + '</div>'
      : '<div class="ipp-wd-row1">' + fieldHtml('closing') + '</div>';
    return '<section class="ipp-wd-card" data-wd-card="' + g + '">' +
      '<div class="ipp-wd-gh"><span class="ipp-wd-gw">' + esc(GROUP_WORD[g]) + '</span><span class="ipp-wd-gt">' + esc(GROUP_WHAT[g]) + '</span><span class="ipp-wd-sp"></span><span class="ipp-wd-gs" data-wd-state="' + g + '"></span><button type="button" class="ix-btn ix-btn--secondary ix-btn--sm ipp-wd-gai" data-wd-gai="' + g + '"><span aria-hidden="true">\u2728</span> Write</button><button type="button" class="ix-revert" data-wd-edit="' + g + '">Edit</button></div>' +
      '<div class="ipp-wd-gb">' +
        '<p class="ipp-wd-msg" data-wd-msg="' + g + '" hidden></p>' +
        body +
        '<div class="ipp-wd-foot" data-wd-foot="' + g + '" hidden>' +
          '<button type="button" class="ix-revert" data-wd-cancel="' + g + '">Cancel</button>' +
          '<span class="ipp-wd-sp"></span><p class="ipp-wd-rule" data-wd-rule="' + g + '"></p>' +
          '<button type="button" class="ix-btn ix-btn--primary ipp-wd-save" data-wd-save="' + g + '" disabled>Save</button>' +
        '</div>' +
      '</div></section>';
  }
  function html() {
    return '<div class="ipp-wd-page" data-wd-page>' +
      '' +   // v1.0.9: the tab header (ipp-shell v1.28) carries the title and the line
      // the done card (HC-P-WD1-5)
      '<section class="ipp-wd-done" data-wd-done>' +
        '<button type="button" class="ipp-wd-tick" data-wd-tick role="checkbox" aria-checked="false" aria-label="The newsletter is done"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg></button>' +
        '<div class="ipp-wd-dt"><h3 class="ipp-wd-dh" data-wd-done-h></h3><p class="ipp-wd-dp" data-wd-done-p></p><p class="ipp-wd-dm" data-wd-done-m hidden></p></div>' +
        '<div class="ipp-wd-dside"><div class="ipp-wd-stamp" data-wd-done-stamp></div>' +
          '<div class="ipp-wd-acts" data-wd-acts>' +   // v1.1.3: the Words actions live on the one card
            '<button type="button" class="ix-btn ix-btn--primary ipp-wd-keepw" data-wd-keepw hidden>Keep as written</button>' +   // v1.1.4
            '<button type="button" class="ix-revert" data-wd-undo hidden>Undo AI</button>' +
            '<button type="button" class="ix-btn ix-btn--primary ipp-wd-ai" data-wd-ai><span class="ipp-wd-spark" aria-hidden="true">\u2728</span><span data-wd-ai-label>Write the words</span></button>' +
            '<button type="button" class="ix-revert" data-wd-type>Type them by hand</button>' +
          '</div></div>' +
        '<div class="ipp-wd-diff" data-wd-diff hidden><span class="ipp-wd-dk">Changed since</span><span class="ipp-wd-chips" data-wd-chips></span>' +
          '<div class="ipp-wd-dacts"><button type="button" class="ix-btn ix-btn--secondary ipp-wd-keep" data-wd-keep>Keep as written</button><button type="button" class="ix-btn ix-btn--primary ipp-wd-again" data-wd-again><span aria-hidden="true">\u2728</span> Write them again</button></div></div>' +
      '</section>' +
      // the band: one for the whole set
      '<section class="ipp-wd-band" data-wd-band>' +
        '<div class="ipp-wd-leads" data-wd-leads hidden></div>' +
        // v1.0.5: the Save all strip, shown when more than one card holds unsaved words
        '<div class="ipp-wd-all" data-wd-all hidden><span class="ipp-wd-all-t" data-wd-all-t></span><span class="ipp-wd-sp"></span>' +
          '<button type="button" class="ix-revert" data-wd-undo-all>Undo all</button>' +
          '<button type="button" class="ix-btn ix-btn--primary ipp-wd-save-all" data-wd-save-all disabled>Save all</button></div>' +
      '</section>' +
      GROUP_ORDER.map(cardHtml).join('') +
      '<p class="ipp-wd-foot-note" data-wd-note hidden></p>' +
    '</div>';
  }

  // ── paint ───────────────────────────────────────────────────
  function chip(c) {
    var w = c.what === 'find' ? 'The Find' : c.what === 'event' ? 'event' : '';
    var t = c.kind === 'moved' ? '<b>' + esc(c.name) + '</b> moved ' + c.from + ' \u2192 ' + c.to
      : c.kind === 'added' ? (w ? w + ' added: ' : 'added: ') + '<b>' + esc(c.name) + '</b>' + (c.to ? ' (position ' + c.to + ')' : '')
      : c.kind === 'removed' ? (w ? w + ' removed: ' : 'removed: ') + '<b>' + esc(c.name) + '</b>'
      : '<b>' + esc(c.name) + '</b>' + (w ? ' (' + w + ')' : '') + ' edited';
    return '<span class="ipp-wd-chg">' + t + '</span>';
  }
  function wdMergeCss() {                                                  // v1.1.3: one card; styles injected, CSS stays ipp-words-v1.0.5.css
    if (document.getElementById('ipp-wd-merge-css')) return;
    var st = document.createElement('style'); st.id = 'ipp-wd-merge-css';
    st.textContent = '[data-ipp-root] .ipp-wd-dside{display:flex;align-items:center;justify-content:flex-end;gap:14px;flex-wrap:wrap}' +
      '[data-ipp-root] .ipp-wd-dside .ipp-wd-acts{margin-left:0}' +
      '[data-ipp-root] .ipp-wd-dside .ipp-wd-stamp:empty{display:none}' +
      '[data-ipp-root] .ipp-wd-done.is-stale .ipp-wd-tick{display:none}' +
      '[data-ipp-root] .ipp-wd-done.is-stale{grid-template-columns:minmax(0,1fr) auto}' +
      '[data-ipp-root] .ipp-wd-done.is-stale .ipp-wd-diff{grid-column:1 / -1}' +
      '[data-ipp-root] .ipp-wd-done.is-stale .ipp-wd-dk{display:none}';
    document.head.appendChild(st);
  }
  function paint(values) {
    wdMergeCss();
    var c = canvas(), p = page(); if (!c || !p) return;
    var f = facts(), sv = saved(), at = when(f.gs ? f.gs.updatedAt : '');
    var busy = !!W.saving || W.savingAll || W.aiBusy || W.doneBusy;
    var waiting = !f.done && !f.stale && !f.noField && !!f.gs;              // the band and the cards wait for the tick
    // the done card
    var dc = p.querySelector('[data-wd-done]'), tk = p.querySelector('[data-wd-tick]');
    dc.className = 'ipp-wd-done' + (f.done ? ' is-done' : '') + (f.stale ? ' is-stale' : '') + (W.doneBusy ? ' is-busy' : '');
    tk.setAttribute('aria-checked', f.done ? 'true' : 'false');
    tk.disabled = !f.gs || f.locked || busy || f.noField || f.stale;
    tk.title = f.stale ? 'Keep the words or write them again; that marks the newsletter done again.' : f.noField ? 'The plan data has no done field yet.' : f.done ? 'Undo marks the newsletter not done' : 'Tick when editorial and revenue picks are final and the layout is set';
    var h = p.querySelector('[data-wd-done-h]'), dp = p.querySelector('[data-wd-done-p]'), m = p.querySelector('[data-wd-done-m]'), stamp = p.querySelector('[data-wd-done-stamp]'), diff = p.querySelector('[data-wd-diff]');
    if (!f.gs) { h.textContent = 'This plan has no Greeting block.'; dp.textContent = 'Add the Greeting block on the Picker, then come back.'; stamp.innerHTML = ''; }
    else if (f.noField) { h.textContent = 'The plan data has no done field.'; dp.textContent = 'NL-BLOCKS needs a Switch field, greeting-done. Until then the words can be written without the tick.'; stamp.innerHTML = ''; }
    else if (f.stale) { h.textContent = at ? 'Changed since ' + at : 'Changed since the words were done'; dp.textContent = ''; stamp.innerHTML = ''; }   // v1.1.3: the header says it; the chips and two buttons do the rest
    else if (f.done) { h.textContent = 'Marked done'; dp.textContent = f.noBasis ? 'NL-BLOCKS has no greeting-basis field yet, so the stale check is off.' : ''; stamp.innerHTML = (at ? 'Done ' + esc(at) : 'Done') + (f.locked ? '' : ' <button type="button" class="ix-revert ipp-wd-undo-done" data-wd-untick>Undo</button>'); }   // v1.1.3: one line
    else { h.textContent = 'Mark the newsletter done'; dp.textContent = 'Tick when the picks and layout are final. This opens the words.'; stamp.innerHTML = ''; }   // v1.1.3
    m.hidden = !W.doneMsg; m.textContent = W.doneMsg || '';
    dp.hidden = !dp.textContent;                                            // v1.1.3
    diff.hidden = !f.stale;
    if (f.stale) { p.querySelector('[data-wd-chips]').innerHTML = f.changes.slice(0, 6).map(chip).join('') + (f.changes.length > 6 ? '<span class="ipp-wd-chg">and ' + (f.changes.length - 6) + ' more</span>' : ''); }
    var keep = p.querySelector('[data-wd-keep]'), again = p.querySelector('[data-wd-again]');
    if (keep) { keep.disabled = busy || f.locked || dirty().length > 0; keep.title = dirty().length ? KW.open : ''; keep.textContent = W.savingAll || (W.saving === 'top' && !dirty('top').length) ? KW.busy : 'Keep as written'; }   // v1.1.4
    if (again) again.disabled = busy || f.locked || !!gate(f);
    // v1.0.9 — the tab header
    var pinkN = f.locked ? 0 : pinkKeys().length;                          // v1.1.0
    var copN = f.locked ? 0 : KEYS.filter(copied).length;                   // v1.1.5: copied parts whose answer is not saved yet, kept or not
    if (pinkN > W.cpSeen) W.cpSeen = pinkN;                                // v1.1.4: how many were waiting when first seen
    if (window.IPP && IPP.head && copN) IPP.head('words', { badge: wdInfo(), tone: 'bad', status: copN + ' to confirm' + (copN > pinkN ? ' \u00b7 ' + (copN - pinkN) + ' keep on Save' : ''), action: null });   // v1.1.4: Keep as written lives on the top card; v1.1.5 counts the unsaved keeps
    else if (window.IPP && IPP.head) {
      var left = KEYS.length - f.written.length;
      IPP.head('words', { badge: wdInfo(), action: null,
        tone: !f.gs || !f.nl ? '' : (f.stale || (!f.done && !f.noField) || left ? 'bad' : 'ok'),
        status: !f.gs ? 'This plan has no Greeting block.' : !f.nl ? 'No newsletter linked to this plan.'
              : f.stale ? 'The issue changed after the words were written'
              : (!f.done && !f.noField) ? 'Mark the newsletter done first'
              : left ? left + ' of ' + KEYS.length + ' still to write' : 'Every part written' });
    }
    // the band
    var sub = p.querySelector('[data-wd-sub]');
    if (sub) { sub.textContent = !f.gs ? 'This plan has no Greeting block.' : !f.nl ? 'No newsletter linked to this plan.' : f.empty ? 'Not written' : 'Written \u00b7 ' + f.written.length + ' of ' + KEYS.length + (f.stale ? ' \u00b7 older than the issue' : f.problems.length ? ' \u00b7 ' + f.problems.map(function (x) { return x.text; }).join('; ') : (!f.noBasis && f.written.length === KEYS.length && f.basis && f.basis.stored) ? ' \u00b7 fits the issue' : ''); sub.classList.toggle('is-bad', !f.empty && (f.stale || f.problems.length > 0)); }   // v1.0.2
    var g = gate(f);
    var ai = p.querySelector('[data-wd-ai]'), aiL = p.querySelector('[data-wd-ai-label]');
    if (ai) { ai.hidden = f.locked; ai.disabled = !!g || busy; ai.title = g || 'Offers a spread for all six parts, written from the issue'; ai.className = 'ix-btn ' + (f.empty || f.stale ? 'ix-btn--primary' : 'ix-btn--secondary') + ' ipp-wd-ai'; }
    if (aiL) aiL.textContent = W.aiBusy ? 'Writing\u2026' : f.empty ? 'Write the words' : 'Write them again';
    var ty = p.querySelector('[data-wd-type]'); if (ty) { ty.hidden = f.locked || !f.empty; ty.disabled = waiting || busy; ty.textContent = 'Type them by hand'; }   // v1.1.3: once written, each card's Edit is the way in
    var acts = p.querySelector('[data-wd-acts]'); if (acts) acts.hidden = f.locked || (waiting && !pinkN) || f.stale || !f.gs || !f.nl;   // v1.1.3: stale uses Keep / Write them again in the chips row; v1.1.4: open for Keep as written
    var kw = p.querySelector('[data-wd-keepw]');
    if (kw) { kw.hidden = !pinkN || f.locked; kw.disabled = busy || dirty().length > 0; kw.title = dirty().length ? KW.open : 'Keeps every copied part still waiting, on every card'; kw.textContent = W.savingAll ? KW.busy : kwLabel(pinkN); }
    if (ai && waiting) ai.hidden = true;
    if (ty && waiting) ty.hidden = true;
    var un = p.querySelector('[data-wd-undo]'); if (un) un.hidden = !W.aiBefore || f.locked || busy || dirtyGroups().length > 1;   // v1.0.5: the strip's Undo all covers it
    var leads = p.querySelector('[data-wd-leads]');
    if (leads) {
      var L = W.leads, items = [];
      if (L) ['subject', 'preview', 'title', 'supershort', 'paragraph'].forEach(function (k) { if (L[k]) items.push('<span>' + esc(k === 'paragraph' ? 'Paragraph opens with' : LABEL[k]) + ' <b>' + esc(L[k].name) + (L[k].pos ? ' (pos ' + L[k].pos + ')' : L[k].kind === 'event' ? ' (event)' : '') + '</b></span>'); });
      leads.hidden = !items.length || !dirty().length; leads.innerHTML = items.join('');
    }
    // v1.0.5: the Save all strip
    var dg = dirtyGroups(), all = p.querySelector('[data-wd-all]');
    if (all) {
      var many = dg.length > 1 && !f.locked;
      all.hidden = !many;
      if (many) {
        var allBad = dg.some(groupBad), sa = all.querySelector('[data-wd-save-all]'), ua = all.querySelector('[data-wd-undo-all]'), tt = all.querySelector('[data-wd-all-t]');
        if (tt) tt.innerHTML = W.savingAll ? '<span class="ipp-wd-spin" aria-hidden="true"></span>' + (W.keepRun ? 'Keeping ' + W.keepRun + ' as written\u2026' : 'Saving ' + plural(dg.length, 'card') + ', one after the other\u2026') : esc('Unsaved words in ' + plural(dg.length, 'card') + (allBad ? ' \u00b7 one is outside its range' : ''));   // v1.1.6 spinner and the run's words
        if (sa) { sa.disabled = !f.ranges || allBad || busy || !f.gs || (!f.nl && dg.some(function (x) { return x !== 'top'; })); sa.textContent = W.savingAll ? 'Saving\u2026' : 'Save all \u00b7 ' + plural(dg.length, 'card'); }
        if (ua) ua.hidden = busy;
      }
      p.querySelector('[data-wd-band]').classList.toggle('is-pending', many);
    }
    p.querySelector('[data-wd-band]').classList.toggle('is-waiting', waiting);
    var bandEl = p.querySelector('[data-wd-band]'), ldEl = p.querySelector('[data-wd-leads]'), alEl = p.querySelector('[data-wd-all]');
    bandEl.hidden = (!ldEl || ldEl.hidden) && (!alEl || alEl.hidden);       // v1.1.3: the band only holds the AI leads and Save all
    p.querySelector('[data-wd-band]').classList.toggle('is-bad', !f.empty && !waiting && (f.stale || f.problems.length > 0));   // v1.0.2
    // the cards
    var fromEl = p.querySelector('[data-wd-from]'), avEl = p.querySelector('[data-wd-av]'), whenEl = p.querySelector('[data-wd-when]');
    var b = boardData(), tname = (b && b.plan && b.plan.titleName) || 'Newsletter', r = pubRow(), sendAt = r && r.values ? r.values.sendAt : '';
    if (fromEl) fromEl.textContent = tname;
    if (avEl) avEl.textContent = tname.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
    if (whenEl) { var sd = sendAt ? new Date(sendAt) : null; whenEl.textContent = sd && !isNaN(sd) ? sd.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : ''; }
    GROUP_ORDER.forEach(function (gk) {
      var cd = card(gk); if (!cd) return;
      var open = isOpen(gk), d = dirty(gk), bad = false, have = 0;
      GROUPS[gk].forEach(function (k) {
        var fe = field(k), rd = cd.querySelector('[data-wd-read="' + k + '"]'), txt = sv[k];
        if (txt) have++;
        if (rd) { rd.textContent = txt || 'Not written yet.'; rd.classList.toggle('is-none', !txt); rd.hidden = open; }
        if (!fe) return;
        fe.hidden = !open;
        if (values) fe.value = val(k);
        fe.readOnly = f.locked || !!W.saving;
        if (RANGE) fe.maxLength = RANGE[k][1]; else fe.removeAttribute('maxlength');   // v1.0.8
        var on = Object.prototype.hasOwnProperty.call(W.draft, k), v = fold(fe.value), ok = inRange(k, v);
        if (v && !ok) bad = true; if (!v) bad = true;
        // v1.1.0 the clone line and the field's state
        var wrap = fe.closest('.ipp-wd-f'), cl = cd.querySelector('[data-wd-cl="' + k + '"]'), cp = copied(k), pk = cp && pinkKey(k), kp = cp && !!W.keep[k];
        if (wrap) { wrap.classList.toggle('ix-confirm', pk && !f.locked); wrap.classList.toggle('is-kept', kp); }
        if (cl) {
          var lk = f.locked || !!W.saving || W.savingAll, line = '';
          if (cp && !f.locked) {
            if (pk) line = (lk ? '' : '<button type="button" class="ix-revert ix-confirm-keep" data-wd-ckeep="' + k + '">Keep</button><button type="button" class="ix-revert ix-confirm-del" data-wd-cdel="' + k + '">Delete</button>');
            else if (kp) line = '<span class="ipp-wd-cl-gold">' + CL_KEEP + '</span>' + (lk ? '' : '<button type="button" class="ix-revert ix-confirm-del" data-wd-cdel="' + k + '">Delete</button><button type="button" class="ix-revert" data-wd-cundo="' + k + '">Cancel</button>');
            else if (on) line = '<span class="ipp-wd-cl-gold">' + (v ? CL_CHG : CL_DEL) + '</span>' + (lk ? '' : '<button type="button" class="ix-revert ix-confirm-keep" data-wd-ckeep="' + k + '">Keep the copy</button>');
          }
          cl.hidden = !line; cl.innerHTML = line;
        }
        fe.classList.toggle('ix-picker-input--changed', on && ok); fe.classList.toggle('ipp-dirty', on);
        fe.classList.toggle('is-missing', !!W.missing[k] || (!!v && !ok));
        var n = cd.querySelector('[data-wd-count="' + k + '"]'); if (n) { n.textContent = f.ranges ? v.length + ' / ' + rangeTxt(k) : NO_RANGES; n.className = 'ipp-wd-n' + (!f.ranges ? ' is-bad' : v ? (ok ? ' is-ok' : ' is-bad') : ''); }   // v1.0.8
        if (gk === 'inbox') { var ib = cd.querySelector('[data-wd-ib="' + k + '"]'); if (ib) { ib.textContent = (open ? v : txt) || (k === 'subject' ? '(subject line)' : '(preview text)'); ib.classList.toggle('is-none', !(open ? v : txt)); } }
      });
      var rl = cd.querySelector('[data-wd-rule="' + gk + '"]'); if (rl) rl.textContent = groupRule(gk);   // v1.0.8
      var st = cd.querySelector('[data-wd-state="' + gk + '"]'), gp = f.problems.filter(function (x) { return groupOf(x.key) === gk; });   // v1.0.2
      if (st) { var tot = GROUPS[gk].length; st.textContent = !gp.length ? 'Saved' : (f.empty ? (gk === 'inbox' ? 'Not set' : 'Not written') : gp.map(function (x) { return x.text; }).join('; ')); st.className = 'ipp-wd-gs' + (!gp.length ? ' is-ok' : f.empty ? '' : ' is-bad'); }
      var ed = cd.querySelector('[data-wd-edit="' + gk + '"]'); if (ed) { ed.hidden = open || f.locked; ed.disabled = waiting || busy; }
      var ga = cd.querySelector('[data-wd-gai="' + gk + '"]'); if (ga) { ga.hidden = f.locked; ga.disabled = !!g || busy; ga.title = g || 'Writes only this card\u2019s parts, around the others'; }   // v1.0.3
      var ft = cd.querySelector('[data-wd-foot="' + gk + '"]'); if (ft) ft.hidden = !open;
      var cancel = cd.querySelector('[data-wd-cancel="' + gk + '"]'); if (cancel) cancel.hidden = f.locked || W.saving === gk;
      var kg = keepsIn(gk).length;                                         // v1.1.0 a Keep alone can save; edits follow the card's range rule as before
      var sb = cd.querySelector('[data-wd-save="' + gk + '"]'); if (sb) { sb.disabled = !f.ranges || (!d.length && !kg) || (d.length > 0 && bad) || f.locked || busy || !f.gs || (gk !== 'top' && !f.nl); sb.textContent = W.saving === gk ? 'Saving\u2026' : 'Save'; }
      var msg = cd.querySelector('[data-wd-msg="' + gk + '"]'); if (msg) { msg.hidden = !W.msg[gk]; msg.textContent = W.msg[gk] || ''; msg.className = 'ipp-wd-msg' + (W.msgKind[gk] ? ' is-' + W.msgKind[gk] : ''); }
      cd.classList.toggle('is-locked', f.locked); cd.classList.toggle('is-waiting', waiting); cd.classList.toggle('has-copies', !f.locked && GROUPS[gk].some(copied));   // v1.1.0: copies can be answered before the done tick
      cd.classList.toggle('is-dirty', !!d.length); cd.classList.toggle('is-ring', !!W.ring[gk]); cd.classList.toggle('is-open', open); cd.classList.toggle('is-stale', f.stale && gk === 'top'); cd.classList.toggle('is-bad', !f.empty && !waiting && gp.length > 0);   // v1.0.2
    });
    var note = p.querySelector('[data-wd-note]'); if (note) { note.hidden = !f.locked; note.textContent = f.locked ? 'This plan is locked; the words are read-only.' : ''; }
    // v1.0.6: the rail dot is painted by ipp-publish v2.38 from Compile's Words tiles (one painter)
  }

  // ── mount and events ────────────────────────────────────────
  function mount() {
    var c = canvas(); if (!c || c.getAttribute(MOUNTED) === '1') return;
    c.innerHTML = html(); c.setAttribute(MOUNTED, '1');
    if (!document.getElementById('ipp-wd-spin-css')) { var st = document.createElement('style'); st.id = 'ipp-wd-spin-css'; st.textContent =   // v1.1.6
      '[data-ipp-root] .ipp-wd-spin{display:inline-block;width:14px;height:14px;margin:0 8px -2px 0;border-radius:50%;border:2px solid var(--ix-gold,#C4A35A);border-top-color:transparent;animation:ipp-wd-spin .8s linear infinite}' +
      '@keyframes ipp-wd-spin{to{transform:rotate(360deg)}}'; document.head.appendChild(st); }
    if (!document.getElementById('ipp-wd-ring-css')) { var rs = document.createElement('style'); rs.id = 'ipp-wd-ring-css'; rs.textContent =   // v1.2.0: the stale ring
      '[data-ipp-root] .ipp-wd-card.is-ring{box-shadow:0 0 0 2px var(--ix-gold,#C4A35A)}'; document.head.appendChild(rs); }
    c.addEventListener('click', function (e) {
      var t = e.target, el;
      if ((el = t.closest('[data-wd-tick]'))) { e.preventDefault(); tick(facts().done ? false : true); return; }
      if ((el = t.closest('[data-wd-untick]'))) { e.preventDefault(); tick(false); return; }
      if ((el = t.closest('[data-wd-ai]')) || (el = t.closest('[data-wd-again]'))) { e.preventDefault(); generate(); return; }
      if ((el = t.closest('[data-wd-gai]'))) { e.preventDefault(); generate(el.getAttribute('data-wd-gai')); return; }   // v1.0.3
      if ((el = t.closest('[data-wd-undo]'))) { e.preventDefault(); undo(); return; }
      if ((el = t.closest('[data-wd-undo-all]'))) { e.preventDefault(); undoAll(); return; }    // v1.0.5
      if ((el = t.closest('[data-wd-save-all]'))) { e.preventDefault(); saveAll(); return; }    // v1.0.5
      if ((el = t.closest('[data-wd-keep]')) || (el = t.closest('[data-wd-keepw]'))) { e.preventDefault(); keepAsWritten(); return; }   // v1.1.4
      if ((el = t.closest('[data-wd-cancel]'))) { e.preventDefault(); revert(el.getAttribute('data-wd-cancel')); return; }
      if ((el = t.closest('[data-wd-save]'))) { e.preventDefault(); save(el.getAttribute('data-wd-save'), false); return; }
      if ((el = t.closest('[data-wd-edit]'))) { e.preventDefault(); openCard(el.getAttribute('data-wd-edit')); return; }
      if ((el = t.closest('[data-wd-type]'))) { e.preventDefault(); openAll(); return; }
      if ((el = t.closest('[data-wd-ckeep]'))) { e.preventDefault(); keepPart(el.getAttribute('data-wd-ckeep')); return; }   // v1.1.0
      if ((el = t.closest('[data-wd-cdel]'))) { e.preventDefault(); delPart(el.getAttribute('data-wd-cdel')); return; }
      if ((el = t.closest('[data-wd-cundo]'))) { e.preventDefault(); var ck = el.getAttribute('data-wd-cundo'); delete W.keep[ck]; paint(true); return; }
    });
    c.addEventListener('input', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-wd-field')) input(e.target); });
    c.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.hasAttribute && e.target.hasAttribute('data-wd-field')) e.preventDefault(); });   // one line; a line break breaks the render
    paint(true);
  }
  function redraw() {
    var c = canvas(); if (!c || c.getAttribute(MOUNTED) !== '1') return;
    var a = document.activeElement, typing = a && a.hasAttribute && a.hasAttribute('data-wd-field');
    paint(!dirty().length && !typing);
  }
  document.addEventListener('ipp:ready', mount);
  document.addEventListener('ipp:view', function (e) { if (e.detail && e.detail.view === VIEW) { mount(); redraw(); } });
  document.addEventListener('ipp:board', function () { if (W.saving || W.savingAll || W.doneBusy) return; W.doneMsg = ''; Object.keys(W.keep).forEach(function (k) { if (!copied(k)) delete W.keep[k]; }); mount(); redraw(); });   // v1.1.0 a Keep answered elsewhere goes
  document.addEventListener('ipp:head-action', function (e) { if (e && e.detail && e.detail.view === VIEW && e.detail.key === 'keepall') keepAll(); });   // v1.1.0
  if (document.querySelector('[data-ipp-root]')) mount();

  // v1.0.9 — the version badge, as every tab has
  function wdInfo() {
    if (!window.IxInfo || typeof IxInfo.badge !== 'function') return '';
    return IxInfo.badge({ file: FILE, version: VERSION, title: 'Words',
      blurb: 'The subject line, preview text, title, short greeting, paragraph and closing, written together once the newsletter is done, so they pull the reader to different parts of the issue.\n\n' +
             'Tick \u201cThe newsletter is done\u201d when the picks and the layout are final. That opens the words. If an article, its order, an event or The Find changes afterwards, the tick clears and the words are marked stale.\n\n' +
             'Each card saves on its own. The ranges for each part come from the Data Worker.\n\n' +
             'A pink part was copied by Clone: Keep keeps it, Delete clears it so you write new words (a part cannot be saved empty), or just edit it. Keep as written at the top keeps every pink part on every card. Nothing is written until Save.',
      heading: 'Writes through',   // v1.2.0 (ix-info v1.0.2)
      scenarios: [{ name: 'ix-content \u00b7 POST /nl-blocks/batch', note: 'the Greeting block (v1.2.0): one update with its version carries the title, short greeting, paragraph, basis stamp and copy marks; the done tick is its own update; refused whole when the row changed since it was read, or when the issue is sent, released or held (PP_WEBHOOKS.content)' },
                  { name: '124 \u00b7 PubPlan Block Writer', note: 'the NEWSLETTER only: nlmeta for the subject line, preview text, closing and their clone answers (PP_WEBHOOKS.blockWriter)' }],
      companions: 'ipp-words-v1.0.5.css \u00b7 ipp-shell v1.48 \u00b7 ix-form-controls v1.2.0 \u00b7 ix-ai v1.4.1 \u00b7 ix-info v1.0.2 \u00b7 pathways: ix-issue-data v1.0.181 /plan-board (row versions, blockFields greeting words, greetingDone, greetingBasis, adFields.approval, word ranges, clone marks, publish.fields.clonePending), /greeting-context; ix-content v1.2.2 /nl-blocks/batch; Scenario 124 (NEWSLETTER nlmeta)' });
  }
  window.IppWords = { version: VERSION, file: FILE, facts: facts, pending: function () { return dirty().concat(Object.keys(W.keep)); }, pinkCount: function () { return pinkKeys().length; }, keepAll: keepAll };   // v1.1.0
  try { console.log('[ipp-words] ' + FILE + ' ready'); } catch (e) {}
})();
