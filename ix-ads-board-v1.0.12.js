// ix-ads-board-v1.0.12.js
// ============================================================
// INBXIFY · ix-ads-board · the Ads board, shared by the Publisher Portal and the T-A Ads tab
//
// v1.0.12 (25 Nov 2026, Ad Maker Build S4) — THE COVERAGE MARKS SHOW ON THE T-A PAGE. JS only; CSS stays v1.0.11.
//   Found 25 Nov (Test 4): on the T-A page the B · S · Sp · T column showed dashes and blanks only. The green "running"
//   dot was painted white by title-admin-page-design's background wildcard (section.publisher-wrapper *, !important),
//   because the board's root did not carry `ix-own` (that file's standing rule: every JS-rendered T-A surface puts
//   ix-own on its root). The root now does, on both sides (the Portal has no wildcard; no change there).
// v1.0.11 (25 Nov 2026, Ad Maker Build S4) — THE INBXIFY SIDE IN FIVE STAGES, IN THE ORDER OF THE WORK.
//   Ruling (Jeff, 25 Nov, by voice): the page reads like a document's status, not two boxes. Stages, top to bottom:
//     1 Not started                  publisher requests, sold shapes with nothing running
//     2 In progress                  designs in Canva not yet saved (the host's slot: ta-admaker's Drafts in Canva),
//                                    saved ads not sent for approval
//     3 With the publisher, waiting  an approval email out; the advertiser looking at it; the advertiser has answered
//                                    and the publisher decides
//     4 From the publisher, to do    sent back with changes asked for (the note carries the advertiser's words too:
//                                    ix-sales v1.3.18)
//     5 Resolved                     approved in the last {linkDays} days: made current, or approved and held
//   then the Client list. A send-back never goes back to Not started.
//   · Host hooks (inbxify side): O.slot(stage) → a DOM node placed at the top of that stage's box after each render;
//     O.slotCount(stage) → how many rows it holds (added to the box's count). API rerender() redraws without a read.
//   · The Portal side is unchanged (Needs action / Waiting).
//   HARDCODING: HC-P-AMB1-2 gains W.ix.board.stage, W.ix.board.none*, W.ix.board.done*.
// v1.0.10 (25 Nov 2026, Ad Maker Build S4) — A PENDING AD WITH NO APPROVAL EMAIL OUT IS NOT WITH THE PUBLISHER.
//   Ruling (Jeff, 25 Nov, after Test 2: "needs to move back to make, not sent… why would it stay in a state it is not?").
//   · On load, a version ix-sales calls 'needs' (Pending) with no open approval email (v.sent empty: never sent, taken
//     back, or the link ran out) becomes state 'unsent'. Both sides read it:
//     inbxify side: under To make, "New {shape} · not sent for approval", button Send for approval (opens the customer's
//       Pending versions with the send box); the card's pill "Not sent", its line "Pending · no approval email out.",
//       its buttons as before (Approve & make current, Approve & hold, Send for approval, Edit in Ad Maker).
//     Portal side: the publisher is not asked: "inbxify: New {shape} · being prepared" under Waiting, pill With inbxify,
//       no approve buttons, line "inbxify is still preparing this one. Nothing is needed from you yet."
//   · The line after a take-back is shorter ("Email taken back · link closed") and the line's links never wrap.
//   HARDCODING: HC-P-AMB1-2 gains W.ix.board.unsent, W.ix.meta.unsent, W.ix.badge.unsent, W.ix.act.sendRow,
//   W.board.unsent, W.meta.unsent.
// v1.0.9 (25 Nov 2026, Ad Maker Build S4) — TAKE BACK AN APPROVAL EMAIL, KEEP THE AD. JS and CSS v1.0.9. inbxify side only.
//   Ruling (Jeff, 24 Nov, S4 B1; wording 25 Nov: "use a clearer question"): an action that stops an approval link but
//   keeps the ad, asked first.
//   · A card with an approval email out has a small "Take back this email" link on the left of the line that holds
//     "Delete this ad" (same line, so the card does not grow).
//   · It opens a box in the card: "Take back the approval email to <name>?", what happens (the link stops, the page
//     says it is closed, the ad stays pending, a new email can be sent any time), and, when it applies, that two
//     emails are open and both stop, or that the email also carries other ads and stops for them too.
//     Buttons: Take back the email, keep it.
//   · Take back the email calls ix-sales v1.3.17 POST /ads/approval/withdraw { publisher, adId } at once (not staged
//     for Save), reloads, and the card then says "Approval email taken back. Its link is closed." where the link was.
//   HARDCODING: HC-P-AMB1-2 gains W.ix.tb.
//   AD REQUESTS (same version, found 24 Nov: nothing closed a request, so it stayed on To make and in Quill's count):
//   · A "To make" row for a request carries the request: onAction gets { kind:'make', …, request } (the oldest open one),
//     so the host can close it when the ad is saved.
//   · A request for a shape Ad Maker cannot make yet (splash, text ad) gets "Mark this request done" in place of the
//     greyed "Tool coming" (ruling of 10 Nov, Publisher Portal S9): ix-sales POST /ads/request/<id>/done at once,
//     then the board reloads and the row is gone.
//   · New API: findRequest(id) → { customer, shape, request } from the loaded board, or null (Quill's link, v4.12.0).
//   HARDCODING: HC-P-AMB1-2 gains W.ix.act.reqDone, W.ix.reqDone.
// v1.0.8 (23 Nov 2026, Ad Maker Build S3): the deleted notice also counts the picture files ix-sales v1.3.13 removed
//   from Uploadcare (deleted.files). CSS v1.0.8 is a version only. HARDCODING: HC-P-AMB1-2 gains W.ix.del.withFiles*.
// v1.0.7 (23 Nov 2026, Ad Maker Build S3) — THE DELETED NOTICE SITS WHERE THE WORK IS. JS and CSS v1.0.7.
//   Rulings (Jeff, 23 Nov, Test 5 on the live page): the notice was at the top of the page, scrolls away from the
//   customer being worked on, and was not seen; and there was no way to tell which MEDIA row went.
//   · The notice is drawn inside the open customer's area, above its cards. It is at the top of the page only when
//     that customer's row is closed.
//   · It now says what went with the ad, from ix-sales's answer: the ADS row, how many MEDIA rows, how many links
//     were stopped. Each picture still on Uploadcare is a link.
//   HARDCODING: HC-P-AMB1-2 gains W.ix.del.with*, .pic.
// v1.0.6 (23 Nov 2026, Ad Maker Build S3) — DELETE AN AD FOR GOOD. JS and CSS v1.0.6. inbxify side only.
//   Ruling (Jeff, 23 Nov): Delete is a true delete, behind an acknowledgement that says it cannot be undone, and the
//   page then says what is left to do by hand.
//   · Every card that is not the current ad has a small "Delete this ad" link under its buttons.
//   · The link opens a red box in the card: what goes, "This cannot be undone.", Delete for good, cancel.
//   · Delete for good calls ix-sales POST /ads/delete { publisher, adId } at once (it is not staged for Save).
//     ix-sales refuses a current, scheduled or already-run ad and says why in the box.
//   · After it, a notice at the top of the page says what was deleted and what is left: the design in Canva (a link,
//     when the host knows the design: opts.designUrl(adId)), and each line ix-sales answers in "kept". The host is
//     told with opts.onDeleted(adId). The notice stays until closed.
//   HARDCODING: HC-P-AMB1-2 gains W.ix.del.
// v1.0.5 (23 Nov 2026, Ad Maker Build S3) — CARDS IN A ROW ARE ONE HEIGHT. JS and CSS v1.0.5. Card changes are
//   inbxify side only; the folded board rows are both sides.
//   Rulings (Jeff, 23 Nov, Test 2 on the live page): a card must not change height because its line says more;
//   "Send again" was not seen as a small link.
//   · Cards in a row are the same height and their buttons sit on one line across the row (CSS). While a card's
//     Send box is open that card alone is taller.
//   · A pending card always has four buttons. Once an approval email is out the third reads "Send again" (it was
//     a small link beside the line, and the card dropped to three buttons).
//   · To make / With the publisher or advertiser: several versions of one customer waiting at the same step are
//     one row with a count ("3 versions"), not one row each.
//   HARDCODING: HC-P-AMB1-2 gains W.board.count (both sides).
// v1.0.4 (22 Nov 2026, Ad Maker Build S3) — SEND FOR APPROVAL HAPPENS IN THE CARD. JS and CSS v1.0.4.
//   Rulings (Jeff, 19 and 22 Nov): the button must not leave the page; the email is shown and can be changed before
//   it goes; the card must say an email went; an ad already with the publisher looks different when sent again.
//   inbxify side only (the Portal side is unchanged):
//   · A pending card has four buttons on an even grid: Approve & make current, Approve & hold (both staged in gold
//     and sent on Save, as inbxify), Send for approval, Edit in Ad Maker.
//   · Send for approval opens a box inside the card: Send to (the publisher's contact, or the staff login as a
//     test), Subject and Message filled in from ix-sales (POST /ads/send-approval preview:true) and editable, a
//     line saying what is added under the message, Send email, and cancel. Send email sends at once
//     (POST /ads/send-approval with the words), closes the box and reloads the board.
//   · Once an approval email is out, the card's line says so in bold and the third button is gone: a small
//     "Send again" link sits beside that line. Its box is headed "Send again" and says the earlier link keeps working.
//   · onAction no longer gets kind 'send'.
//   HARDCODING: HC-P-AMB1-2 gains W.ix.send (the box's words) and W.ix.act.sendAgain.
// v1.0.3 (19 Nov 2026, Ad Maker Build S3): version only, to pair with ix-ads-board-v1.0.3.css (the inbxify side's sections take
//   the Drafts in Canva card: Jeff, 19 Nov). No code change beyond the names.
// v1.0.2 (18 Nov 2026, Ad Maker Build S3) — INBXIFY'S OWN APPROVAL, AND APPROVAL BY EMAIL. JS only; the CSS stayed v1.0.1.
//   · inbxify side: Save sends as:"inbxify" with every decision, so ix-sales (v1.3.9) logs "inbxify for the publisher"
//     (the same Scenario G / 114 path as the publisher's own decision). The Portal side is unchanged.
//   · inbxify side: a pending version's card gains "Send for approval" (onAction kind 'send': the host opens it on
//     Ad Maker's Check screen, where the What happens choice lives). Its line says when an approval email is out,
//     to whom, and whether the link has been opened ("link not opened yet").
//   · Both sides: an approval made by inbxify reads "Approved by inbxify for <contact>".
//   · onLoad(customers, answer): the whole ix-sales answer is passed too (contact, you).
//   · ctx.publisher.contact is filled from the answer's contact when the host gave none (T-A).
//   HARDCODING: HC-P-AMB1-2 gains W.ix.act.send, W.ix.meta.sent*, W.meta.byInbxify.
// v1.0.1 (18 Nov 2026): version only, so the file pair matches ix-ads-board-v1.0.1.css (tokens). No code change.
// v1.0.0 (18 Nov 2026, Ad Maker Build S1) — LIFTED FROM ps-ads v1.0.12, ONE COPY FOR BOTH SIDES.
//   Everything ps-ads drew is here, unchanged for the Portal: the two boards, the client list with coverage
//   marks (B S Sp T: green dot running, red ring sold with nothing running, dash not sold), the open row's
//   Current · Pending · Other tabs, four equal Current cards, staging in gold, the save bar, the Ask email box,
//   Request new ads and Withdraw. ps-ads v1.0.13 is now a thin file that mounts this with side 'publisher'.
//   Every class keeps its ps-ad- name so the Portal's stylesheet rules apply as before; the stylesheet itself
//   moved to ix-ads-board-v1.0.1.css, which also carries the Portal's --ps-* tokens on .ix-ab for pages that do
//   not load ps-shell (T-A).
//
//   THE TWO SIDES (opts.side)
//   · 'publisher'  The Portal, as before. Needs action · Waiting (fixed height, scrolling inside); the publisher's
//                  actions on cards (approve, hold, ask, send back, make current, restore); Request new ads.
//   · 'inbxify'    The T-A Ads tab (seed rulings 3 and 4, 14 Nov). The same items sorted from inbxify's side:
//                  "To make" (sent back, requested, sold with nothing running) and "With the publisher or
//                  advertiser" (waiting for the publisher's OK, advertiser answered, link out), STACKED full width,
//                  no height cap (the page grows), then the client list. Cards carry inbxify's actions instead:
//                  Edit in Ad Maker on a running or pending version; Make sidebar / Make banner on a sold shape
//                  with nothing running; Approve & make current on a pending version (staged in gold, written by
//                  Save through ix-sales /ads/<id>/decide under the staff login); Open in Ad Maker on a sent-back
//                  version. "To make" rows carry the same action as a button. No Request box, no Ask, no Send back.
//
//   API
//     IxAdsBoard.mount(node, opts) → { refresh(), state(), destroy() }
//       opts.side        'publisher' | 'inbxify'
//       opts.api         function (path, { method, body, label }) → Promise<{ ok, status, json }>  (ix-sales, signed)
//       opts.publisher   { id, name, contact }
//       opts.who         { staff, email, name }
//       opts.info        function (badgeProps) → html, or null (the ⓘ badge belongs to the host surface)
//       opts.placeholder function (rows, cols) → html, optional (ps-shell's)
//       opts.title       the h1 words, or '' for none (T-A draws its own header)
//       opts.onAction    function ({ kind, customer, shape, version }) — 'make' | 'edit' | 'open' (inbxify side)
//       opts.designUrl   function (adId) → the Canva address of that ad's design, or '' (inbxify side, v1.0.6)
//       opts.onDeleted   function (adId, answer) after an ad is deleted for good (inbxify side, v1.0.6)
//       opts.deepCustomer a customer id to open on load (the Portal's ?customer=)
//
//   DATA One read: ix-sales GET /ads?publisher=<id> (v1.3.7 adds brand per customer; this file passes it through
//   in state().customers for the host). Writes: /ads/<id>/decide, /ads/ask, /ads/request, /ads/request/file,
//   /ads/request/<id>/withdraw, exactly as ps-ads v1.0.12.
//
//   HARDCODING (provisional ids; the ps-ads ids carry over)
//     HC-P-PP8-7  W: every word, in one object; W.ix holds the inbxify side's words.
//     HC-P-PP8-8  SH / SHN: the four shapes (ix-sales's shapes[] wins when it answers them).
//     HC-P-PP9-7  BOARD_ROWS_PX: the Portal boards' fixed height (publisher side only).
//     HC-P-AMB1-2 the inbxify side's action words (W.ix.act).
// ============================================================
(function () {
  'use strict';
  var VERSION = '1.0.12', CSS_VERSION = '1.0.11', FILE = 'ix-ads-board-v' + VERSION + '.js';
  var SH = ['banner', 'sidebar', 'splash', 'text'];                        // HC-P-PP8-8
  var SHN = { banner: 'Banner', sidebar: 'Sidebar', splash: 'Splash', text: 'Text ad' };
  var W = {                                                              // HC-P-PP8-7
    title: 'Ads',
    search: 'Find a customer',
    own: { you: 'You', adv: 'Advertiser', ix: 'inbxify' },
    tip: { you: 'Your move: approve, hold, send back or ask the advertiser', adv: 'Waiting on the advertiser',
           ix: 'inbxify’s move: making or fixing this ad', ok: 'Approved and running', dash: 'Not sold', req: 'New ad requested' },
    emptyAll: 'No customers yet. A customer shows here once one of your titles, ads or sales records names it.',
    emptyQ: 'No customer matches that name.',
    badge: { you: 'Needs you', adv: 'With advertiser', ix: 'With inbxify', ok: 'This one is live', ready: 'Approved, ready to run', earlier: 'Earlier' },
    meta: { unsent: 'inbxify is still preparing this one. Nothing is needed from you yet.',
      currentBy: 'Approved by {by}, {on}.', byInbxify: 'inbxify for {by}', runningSince: 'Running since {on}.', runningUnknown: 'Running since before the portal kept dates.',
      needs: 'New version, waiting for your OK.', needsMade: 'Made {on}.',
      answered: '{who} answered on {on}: {answer}{more} It runs once you approve it.',
      ansOk: 'approved it.', ansChange: 'asked for changes.',
      adv: 'With the advertiser. You can still decide now.',
      back: 'Sent back by {by}, {on}: {note} inbxify is making a new version.',
      ready: 'Approved and held{by}. Not running yet.', readyBy: ' by {by}, {on}',
      earlier: 'Ran {from} to {to}.', earlierTo: 'Ran until {to}.', earlierUnknown: 'Ran before the portal kept dates.',
      archived: ' Archived.',
      stale: 'Last ran {ago}. Prices, dates or the offer may have changed, so it comes back through Needs you for a fresh OK.',
      agoMonths: '{n} months ago', agoUnknown: 'at an unknown date'
    },
    act: { current: 'Approve and make current', hold: 'Approve and hold', ask: 'Ask the advertiser', back: 'Send back',
           make: 'Make current', makeAgain: 'Make current again', restore: 'Restore and hold', review: 'Restore for review' },
    onSave: 'On save: {what}',
    cancel: 'Cancel',
    askNote: 'Every ad you mark this way for {name} goes in one link, good for {days} days. Save opens your email with the link; you add the address.',
    noteLabel: 'What should change? inbxify sees this note.',
    notePh: 'For example: use the new logo, make the phone number bigger',
    noteNeed: 'Add a note before you save.',
    rail: { current: 'Current versions', process: 'Pending versions', ready: 'Approved, in inventory', other: 'Other versions', archived: 'Archived' },
    notSoldShort: 'Not sold', noRunShort: 'Nothing running yet',
    colNone: { process: 'Nothing pending.', ready: 'None in inventory.', archived: 'None archived.' },
    linkOut: 'Approval link out: good until {until}', linkOpened: 'Opened {on}', linkNotOpened: 'Not opened yet', copyLink: 'Copy link', copied: 'Link copied.', copyFail: 'Could not copy. The link is: {url}',
    answeredBox: '{who} answered on {on}.',
    save: { n1: '1 change to save', n: '{n} changes to save', need: 'A send-back needs a note.', save: 'Save', saving: 'Saving your changes…',
            steps: ['Checking your login', 'Saving the approvals', 'Pointing the site at the new ads', 'Making the advertiser links', 'Confirming each one was written'],
            line: '{name}, {shape}: {what}' },
    saved: '{n} saved.', savedOne: '1 change saved.', savedPart: '{ok} saved, {bad} not saved. {msg}',
    unconfirmed: 'Saved, but Webflow did not confirm: {list}. Reload to check.',
    loadFail: 'The ads could not be read: {msg}',
    mail: { head: 'Your message to {name}', subject: 'Subject', open: 'Open in my mail program', copy: 'Copy subject and message', copied: 'Message copied.', close: 'Done', note: 'To is left blank: add the advertiser’s address. The link in the message is also under In-process versions.' },
    api: { ads: 'Reading the ads', decide: 'Saving {what}', ask: 'Making the link for {name}', request: 'Sending the request to inbxify', file: 'Uploading {name}', withdraw: 'Withdrawing the {shape} request' },
    board: { count: '{n} versions',
      action: 'Needs action', waiting: 'Waiting', list: 'Client list', since: 'since {on}', more: ' · +{n} more',
      noneAction: 'Nothing needs you.', noneWaiting: 'Nothing is waiting.', ix: 'inbxify:', adv: 'Advertiser:',
      needs: 'Approve the new {shape}', answered: 'Advertiser answered on the {shape}', back: 'New {shape} · you sent it back',
      advIn: 'Reviewing the new {shape}', req: 'New {shape} · you asked for it', gap: '{Shape} · sold, none yet', unsent: 'New {shape} · being prepared',
      cols: { customer: 'Customer', next: 'Next step', since: 'Since' },
      cov: { live: 'Running', gap: 'Sold, nothing running', no: 'Not sold' }
    },
    req: {
      button: 'Request new ads', head: 'Request new ads', sub: '{name}',
      which: 'Which ads', tickAll: 'Tick all four', when: 'Wanted by', optional: 'optional', note: 'Note for inbxify',
      notePh: 'What should the new ad say or show? An offer, an event, a season, new photos, or changes to the current ad. Add files below if the advertiser sent any.',
      noteNeed: 'A note is needed: say what the new ads should say or show.', files: 'Files', addFiles: 'Add photos or files', remove: 'Remove', uploading: 'uploading…',
      fileFail: '{name} did not upload: {msg}', tooBig: '{name} is over 20 MB.',
      whatNone: 'Tick at least one ad and write a note.', whatNote: 'Write a note to send the request.', whatFiles: 'Wait for the files to finish uploading.',
      what: 'Sends a request for a new {list} to inbxify{when}.', whatWhen: ', wanted by {on}', and: ' and ',
      send: 'Send request', sending: 'Sending the request to inbxify…', cancel: 'Cancel',
      sent: 'Request sent to inbxify: new {list} for {name}.', fail: 'The request was not sent: {msg}',
      one: 'New {shape} requested {on}', many: '{n} new {shapes} requested, the latest {on}',
      wanted: 'Wanted by {on}', withIx: 'with inbxify', withIxCap: 'With inbxify', asked: 'Asked by {who}', withdraw: 'Withdraw',
      confirm: 'Withdraw the {shape} request?', keep: 'Keep it', withdrawn: 'The {shape} request for {name} was withdrawn.', wdFail: 'The request was not withdrawn: {msg}',
      plural: { banner: 'banners', sidebar: 'sidebars', splash: 'splashes', text: 'text ads' }
    },
    // ── the inbxify side (T-A Ads tab) · HC-P-AMB1-2 ──
    ix: {
      board: { action: 'To make', waiting: 'With the publisher or advertiser', noneAction: 'Nothing to make.', noneWaiting: 'Nothing is out with the publisher or an advertiser.',
               pub: 'Publisher:', adv: 'Advertiser:',
               back: 'New {shape} · sent back by the publisher', req: 'New {shape} · the publisher asked for it', gap: '{Shape} · sold, nothing running',
               needs: 'Approving the new {shape}', answered: 'Advertiser answered on the {shape}', advIn: 'Reviewing the new {shape}', unsent: 'New {shape} · not sent for approval',
               stage: { 'new': 'Not started', wip: 'In progress', wait: 'With the publisher, waiting', todo: 'From the publisher, to do', done: 'Resolved' },   // v1.0.11
               none: { 'new': 'Nothing waiting to be started.', wip: 'Nothing in progress.', wait: 'Nothing is out with the publisher or an advertiser.', todo: 'Nothing has come back from the publisher.', done: 'Nothing approved in the last {n} days.' },
               doneSub: 'last {n} days', doneCur: '{Shape} approved \u00b7 running now', doneHold: '{Shape} approved \u00b7 on hold' },
      act: { edit: 'Edit in Ad Maker', open: 'Open in Ad Maker', make: 'Make {shape}', approve: 'Approve & make current', makeCurrent: 'Make current', coming: 'Tool coming', send: 'Send for approval', sendAgain: 'Send again', hold: 'Approve & hold', reqDone: 'Mark this request done', sendRow: 'Send for approval' },
        reqDone: { going: 'Closing the request', done: 'Request closed: {shape} for {name}.', fail: 'The request was not closed: {msg}' },
        del: { link: 'Delete this ad', ask: 'Delete this ad for good?', what: 'The ad comes off the site. Any approval link for it stops working.', never: 'This cannot be undone.', go: 'Delete for good', going: 'Deleting\u2026', cancel: 'cancel',
          done: 'Deleted: {name}', withHead: 'Deleted with it:', withAd: 'the ADS row', withMedia1: '1 MEDIA row (the one holding its picture)', withMediaN: '{n} MEDIA rows (the ones holding its pictures)', withMedia0: 'no MEDIA row (none held its picture)', withFiles1: 'its picture file on Uploadcare', withFilesN: '{n} picture files on Uploadcare', withLinks1: '1 open link stopped', withLinksN: '{n} open links stopped', pic: 'picture file', left: 'Left for you to do:', canva: 'Open the design in Canva and move it to trash (File > Move to trash).', close: 'close', fail: 'Not deleted: {msg}', deleting: 'Deleting the ad' },
        tb: { link: 'Take back this email', ask: 'Take back the approval email to {to}?', what: 'The link in it stops working. If it is opened, the page says the link is closed. The ad stays pending, and you can send a new email at any time.',
          two: '{n} approval emails for this ad are open. All of them stop.', others1: 'That email also carries 1 other ad. Its link stops for that ad too.', othersN: 'That email also carries {n} other ads. Its link stops for them too.',
          others1Pl: 'Those emails also carry 1 other ad. Their links stop for that ad too.', othersNPl: 'Those emails also carry {n} other ads. Their links stop for them too.', goPl: 'Take back the emails',
          go: 'Take back the email', going: 'Taking back\u2026', keep: 'keep it', done: 'Email taken back \u00b7 link closed', fail: 'Not taken back: {msg}', label: 'Taking back the approval email' },
        send: { head: 'Send for approval', headAgain: 'Send again', again: '{name} already has a link from {on}. That link keeps working; this sends a new one.', to: 'Send to', test: '(test)', testNote: 'the same email, sent to you', noPub: 'The PUBLISHERS record has no Contact Name or Business Email, so only a test can be sent.',
          subject: 'Subject', message: 'Message', added: 'Added under your message: the {shape}, a \u201c{button}\u201d button, and \u201c{until}\u201d', go: 'Send email', going: 'Sending\u2026', loading: 'Reading the email\u2026', cancel: 'cancel',
          done: 'Approval email sent to {to}.', doneTest: 'Test approval email sent to {to}.', fail: 'The email was not sent: {msg}', need: 'The subject and the message cannot be empty.' },
      meta: { sent: 'Approval email sent to {to} on {on}.', sentTest: 'Test approval email sent to {to} on {on}.', sentUnopened: 'Link not opened yet.', sentOpened: 'Link opened {on}.', sentUntil: 'Good until {until}.',
              unsent: 'Pending · no approval email out.', needs: 'Pending with the publisher since {on}.', answered: 'The advertiser answered on {on}; the publisher decides.', adv: 'Out with the advertiser.', back: 'Sent back by the publisher, {on}: {note}' },
      tip: { you: 'With the publisher: waiting for their OK', adv: 'Waiting on the advertiser', ix: 'To make: inbxify’s move' },
      badge: { you: 'With publisher', adv: 'With advertiser', ix: 'To make', unsent: 'Not sent' },
      save: { steps: ['Checking your login', 'Saving the approvals', 'Pointing the site at the new ads', 'Confirming each one was written'] }
    }
  };
  var PLUS = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>';
  var CHEV = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  var BOARD_ROWS_PX = 268;   // HC-P-PP9-7 (publisher side only)

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function fill(t, o) { return String(t).replace(/\{(\w+)\}/g, function (_, k) { return o[k] == null ? '' : o[k]; }); }
  function day(v) { if (!v) return ''; var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v)); var d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v); if (isNaN(d)) return String(v).slice(0, 10); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

  function create(node, opts) {
    var el = node, O = opts || {}, side = O.side === 'inbxify' ? 'inbxify' : 'publisher', IX = side === 'inbxify';
    var ctx = { api: O.api, publisher: O.publisher || {}, who: O.who || {}, info: O.info || null, placeholder: O.placeholder || null };
    var S;
    function approver() { var p = ctx.publisher || {}; return p.contact || p.name || 'the publisher'; }
    function byWho(d) { return d && d.inbxify ? fill(W.meta.byInbxify, { by: esc(approver()) }) : esc(approver()); }   // v1.0.2
    function toast(msg, v, key) { if (window.IxToast) window.IxToast.show(msg, v, { key: 'ix-ab:' + key }); else console.log('[ix-ads-board]', msg); }
    function B() { return IX ? Object.assign({}, W.board, W.ix.board) : W.board; }

    // ── data shape helpers ──
    function cust(id) { return S.customers.find(function (c) { return c.id === id; }); }
    function vOf(c, sh) { return c.shapes[sh].versions; }
    function curOf(c, sh) { var id = c.shapes[sh].current; return vOf(c, sh).find(function (v) { return v.id === id; }) || null; }
    function findV(id) { for (var i = 0; i < S.customers.length; i++) { var c = S.customers[i]; for (var j = 0; j < SH.length; j++) { var v = vOf(c, SH[j]).find(function (x) { return x.id === id; }); if (v) return { v: v, c: c, sh: SH[j] }; } } return null; }
    function vOwn(v) { return ({ needs: 'you', answered: 'you', adv: 'adv', back: 'ix', unsent: 'ix' })[v.state] || null; }   // v1.0.10: unsent
    function owners(c, sh, forCell) {
      var vs = vOf(c, sh), o = [];
      var has = function (st) { return vs.some(function (v) { return v.state === st; }); };
      if (has('needs') || has('answered')) o.push('you');
      if (has('back') || has('unsent') || (!forCell && reqsOf(c, sh).length) || (!curOf(c, sh) && c.shapes[sh].sold && !has('needs') && !has('answered') && !has('adv'))) o.push('ix');
      if (has('adv')) o.push('adv');
      if (o.length) return o;
      return [curOf(c, sh) ? 'ok' : 'dash'];
    }
    function reqsOf(c, sh) { return (c.shapes[sh] && c.shapes[sh].requests) || []; }
    function anyReq(c) { return SH.some(function (sh) { return reqsOf(c, sh).length; }); }
    function viewing(c, sh) {
      var id = S.view[c.id + '|' + sh], v = id && vOf(c, sh).find(function (x) { return x.id === id; });
      if (v) return v;
      var vs = vOf(c, sh), order = ['needs', 'answered', 'adv', 'back', 'unsent', 'ready'];
      if (curOf(c, sh)) return curOf(c, sh);
      for (var i = 0; i < order.length; i++) { var f = vs.find(function (x) { return x.state === order[i]; }); if (f) return f; }
      return vs[0] || null;
    }
    function art(v, sh, th) {
      var p = v.picture || '';
      if (/^https?:\/\//.test(p)) return '<img class="ps-ad-img' + (th ? ' th' : '') + '" src="' + esc(p) + '" alt="' + esc(SHN[sh] + ': ' + v.name) + '" loading="lazy">';
      return '<div class="ps-ad-textad' + (th ? ' th' : '') + '"><b>' + esc(v.name) + '</b><div>' + esc(p) + '</div></div>';
    }
    function agoWords(v) { return v.monthsAgo == null ? W.meta.agoUnknown : fill(W.meta.agoMonths, { n: v.monthsAgo }); }
    function metaFor(v, c) {
      var d = v.decided || {}, L = v.link || {}, M = W.meta;
      if (IX) {   // the same facts, said from inbxify's side
        var b0 = v.sentBack || {};
        var s0 = v.sent ? fill(v.sent.test ? W.ix.meta.sentTest : W.ix.meta.sent, { to: esc(v.sent.test ? v.sent.to : (v.sent.toName || v.sent.to)), on: day(v.sent.sentAt) }) + ' ' + (v.sent.openedAt ? fill(W.ix.meta.sentOpened, { on: day(v.sent.openedAt) }) : W.ix.meta.sentUnopened) + ' ' + fill(W.ix.meta.sentUntil, { until: day(v.sent.until) }) : '';   // v1.0.2
        if (v.sent && (v.state === 'needs' || v.state === 'answered' || v.state === 'adv')) { var p0 = s0.indexOf('. ') + 1; return '<b>' + s0.slice(0, p0) + '</b>' + s0.slice(p0); }   // v1.0.4
        if (v.state === 'unsent') return W.ix.meta.unsent;   // v1.0.10
        if (v.state === 'needs') return fill(W.ix.meta.needs, { on: day(v.createdOn) });
        if (v.state === 'answered') return fill(W.ix.meta.answered, { on: day(L.answeredAt) }) + (L.answer === 'change' && (L.change || L.like) ? ' <q>' + esc(L.change || L.like) + '</q>' : '');
        if (v.state === 'adv') return W.ix.meta.adv;
        if (v.state === 'back') return fill(W.ix.meta.back, { on: day(b0.at), note: b0.note ? '<q>' + esc(b0.note) + '</q>' : '' });
      }
      switch (v.state) {
        case 'current': return [v.ranFrom ? fill(M.runningSince, { on: day(v.ranFrom) }) : M.runningUnknown, d.at ? fill(M.currentBy, { by: byWho(d), on: day(d.at) }) : ''].filter(Boolean).join(' ');
        case 'unsent': return M.unsent;   // v1.0.10
        case 'needs': return M.needs + (v.createdOn ? ' ' + fill(M.needsMade, { on: day(v.createdOn) }) : '');
        case 'answered': return fill(M.answered, { who: esc(L.answeredBy || 'The advertiser'), on: day(L.answeredAt), answer: L.answer === 'approve' ? M.ansOk : M.ansChange,
          more: L.answer === 'change' ? ' <q>' + esc([L.like && ('Likes: ' + L.like), L.change && ('Change: ' + L.change)].filter(Boolean).join(' ')) + '</q>' : '' });
        case 'adv': return M.adv;
        case 'back': var b = v.sentBack || {}; return fill(M.back, { by: esc(approver()), on: day(b.at), note: b.note ? '<q>' + esc(b.note) + '</q>' : '' });
        case 'ready': return fill(M.ready, { by: d.at ? fill(M.readyBy, { by: byWho(d), on: day(d.at) }) : '' });
        case 'earlier': return (v.ranFrom && v.ranTo ? fill(M.earlier, { from: day(v.ranFrom), to: day(v.ranTo) }) : v.ranTo ? fill(M.earlierTo, { to: day(v.ranTo) }) : M.earlierUnknown) + (v.archived ? M.archived : '');
      }
      return '';
    }
    function stagedWhat(g, v) { return g.act === 'make' && v.state === 'earlier' ? W.act.makeAgain : g.act === 'current' && IX ? W.ix.act.approve : W.act[g.act]; }

    // ── drawing ──
    function infoHTML() {
      if (!ctx.info) return '';
      return ctx.info({ file: FILE, version: VERSION, title: W.title,
        blurb: (IX ? 'To make and With the publisher or advertiser at the top, then the Client list: every customer of the publisher, the next step in words, and coverage per shape. ' : 'Needs action and Waiting at the top (fixed height, scrolling inside), then the Client list: every customer, the next step in words, and coverage per shape. ') +
          'Each customer opens to its versions. Choices are staged (gold) until Save. Reads: ix-sales GET /ads?publisher= (versions from ix-issue-data /customer-ads, sold shapes from sales records, links and decisions from PUBLISHER REVIEWS). Saves: ix-sales POST /ads/<id>/decide (Scenario G for approvals, 114 for current ads, each echo checked; every decision logged in PUBLISHER REVIEWS)' + (IX ? '.' : ' and POST /ads/ask (one PUBLISHER REVIEWS row per link; the email opens in your own mail program). Request new ads: POST /ads/request, files through POST /ads/request/file (Uploadcare), Withdraw through POST /ads/request/<id>/withdraw; Ad Maker closes a request when it saves the job.') + ' Run dates come from ADS Run Log, written by 114 through ix-sales /run-log.',
        scenarios: ['G', '114'], companions: 'ix-ads-board-v' + CSS_VERSION + '.css · ix-sales v1.3.10 · ix-issue-data /customer-ads' });
    }
    function covMark(c, sh) {
      var live = !!curOf(c, sh), sold = !!c.shapes[sh].sold, k = live ? 'live' : sold ? 'gap' : 'no';
      return '<span class="ps-ad-cv ' + k + '" title="' + esc(SHN[sh] + ': ' + W.board.cov[k]) + '"><i></i></span>';
    }
    function covRow(c) { return '<span class="ps-ad-cov">' + SH.map(function (sh) { return covMark(c, sh); }).join('') + '</span>'; }
    function covHead() { return '<span class="ps-ad-covh">' + SH.map(function (sh) { return '<span title="' + esc(SHN[sh]) + '">' + esc({ banner: 'B', sidebar: 'S', splash: 'Sp', text: 'T' }[sh] || SHN[sh].charAt(0)) + '</span>'; }).join('') + '</span>'; }
    function doneOf(c) {   // v1.0.11 · approved in the last linkDays days (inbxify side, Resolved)
      var out = [], Bd = B(), since = Date.now() - (S.linkDays || 14) * 864e5;
      SH.forEach(function (sh) { vOf(c, sh).forEach(function (v) {
        var d = v.decided || {}; if ((v.state !== 'current' && v.state !== 'ready') || !d.at || new Date(d.at).getTime() < since) return;
        out.push({ who: 'done', words: fill(v.state === 'current' ? Bd.doneCur : Bd.doneHold, { Shape: SHN[sh] }), at: d.at, tab: v.state === 'current' ? 'current' : 'process', sh: sh, kind: 'done', v: v }); }); });
      return out;
    }
    function stageOf(it) { return it.kind === 'done' ? 'done' : it.kind === 'back' ? 'todo' : it.kind === 'unsent' ? 'wip' : (it.who === 'you' || it.who === 'adv') ? 'wait' : 'new'; }   // v1.0.11
    function itemsOf(c) {   // every thing in motion for one customer: { who: you|ix|adv, words, at, tab, sh, kind, v }
      var out = [], Bd = B();
      SH.forEach(function (sh) {
        var low = SHN[sh].toLowerCase(), cap = SHN[sh];
        vOf(c, sh).forEach(function (v) {
          var L = v.link || {}, sb = v.sentBack || {};
          if (v.state === 'needs') out.push({ who: 'you', words: fill(Bd.needs, { shape: low }), at: v.createdOn, tab: 'process', sh: sh, kind: 'needs', v: v });
          else if (v.state === 'answered') out.push({ who: 'you', words: fill(Bd.answered, { shape: low }), at: L.answeredAt || v.createdOn, tab: 'process', sh: sh, kind: 'answered', v: v });
          else if (v.state === 'back') out.push({ who: 'ix', words: fill(Bd.back, { shape: low }), at: sb.at || v.createdOn, tab: 'process', sh: sh, kind: 'back', v: v });
          else if (v.state === 'adv') out.push({ who: 'adv', words: fill(Bd.advIn, { shape: low }), at: L.sentAt || v.createdOn, tab: 'process', sh: sh, kind: 'adv', v: v });
          else if (v.state === 'unsent') out.push({ who: 'ix', words: fill(Bd.unsent, { shape: low }), at: v.createdOn, tab: 'process', sh: sh, kind: 'unsent', v: v });   // v1.0.10
        });
        reqsOf(c, sh).forEach(function (r) { out.push({ who: 'ix', words: fill(Bd.req, { shape: low }), at: r.askedAt, tab: 'current', sh: sh, kind: 'req', req: r }); });
        var inPlay = vOf(c, sh).some(function (v) { return ['needs', 'answered', 'back', 'adv', 'unsent'].indexOf(v.state) > -1; });
        if (c.shapes[sh].sold && !curOf(c, sh) && !inPlay && !reqsOf(c, sh).length) out.push({ who: 'ix', words: fill(Bd.gap, { Shape: cap }), at: null, tab: 'current', sh: sh, kind: 'gap' });
      });
      var rank = IX ? { ix: 0, you: 1, adv: 1 } : { you: 0, adv: 1, ix: 1 };
      return out.sort(function (a, b) { return (rank[a.who] - rank[b.who]) || String(a.at || '9').localeCompare(String(b.at || '9')); });
    }
    function stepHTML(it) {
      if (!it) return '';
      var Bd = B(), pre = '';
      if (IX) { if (it.who === 'you') pre = '<span class="pre">' + esc(Bd.pub) + '</span> '; else if (it.who === 'adv') pre = '<span class="pre">' + esc(Bd.adv) + '</span> '; }
      else { if (it.who === 'ix') pre = '<span class="pre">' + esc(Bd.ix) + '</span> '; else if (it.who === 'adv') pre = '<span class="pre">' + esc(Bd.adv) + '</span> '; }
      return '<span class="ps-ad-step s-' + it.who + '"><i aria-hidden="true"></i>' + pre + esc(it.words) + '</span>';
    }
    // the inbxify side: what a "To make" item asks for (HC-P-AMB1-2)
    function ixActionFor(c, it) {
      if (!IX || it.who !== 'ix') return null;
      var tool = it.sh === 'banner' || it.sh === 'sidebar';
      if (it.kind === 'back') return { kind: 'open', label: W.ix.act.open, sh: it.sh, v: it.v, coming: false };
      if (it.kind === 'unsent') return { kind: 'sendrow', label: W.ix.act.sendRow, sh: it.sh, v: it.v, coming: !tool };   // v1.0.10
      if (it.kind === 'req' && !tool) return { kind: 'reqdone', label: W.ix.act.reqDone, sh: it.sh, v: null, req: it.req, coming: false };   // v1.0.9
      if (it.kind === 'gap' || it.kind === 'req') return { kind: 'make', label: tool ? fill(W.ix.act.make, { shape: SHN[it.sh].toLowerCase() }) : W.ix.act.coming, sh: it.sh, v: null, req: it.req || null, coming: !tool };
      return null;
    }
    function actBtn(a, c, kind2) {
      if (!a) return '';
      if (a.kind === 'sendrow') return '<button type="button" class="ix-btn ix-btn--primary ps-ad-sm" data-sendrow="' + esc(c.id + '|' + a.v.id) + '"' + (a.coming ? ' disabled' : '') + '>' + esc(a.label) + '</button>';   // v1.0.10
      if (a.kind === 'reqdone') return '<button type="button" class="ix-btn ix-btn--secondary ps-ad-sm" data-reqdone="' + esc(c.id + '|' + a.sh + '|' + a.req.id) + '">' + esc(a.label) + '</button>';   // v1.0.9
      return '<button type="button" class="ix-btn ' + (kind2 || 'ix-btn--secondary') + ' ps-ad-sm" data-ix="' + esc(a.kind + '|' + c.id + '|' + a.sh + '|' + (a.v ? a.v.id : '') + '|' + (a.req ? a.req.id : '')) + '"' + (a.coming ? ' disabled title="' + esc(W.ix.act.coming) + '"' : '') + '>' + esc(a.label) + '</button>';
    }
    function boardRow(c, it, n) {
      var a = ixActionFor(c, it);
      return '<div class="ps-ad-brow' + (a ? ' has-act' : '') + '" data-go="' + esc(c.id + '|' + it.tab) + '" role="button" tabindex="0"><span class="tx"><span class="cn">' + esc(c.name) + '</span><span class="l2">' + stepHTML(it) +
        (n > 1 ? '<span class="wh">· ' + esc(fill(B().count, { n: n })) + '</span>' : '') + (it.at ? '<span class="wh">· ' + esc(it.kind === 'done' ? day(it.at) : fill(W.board.since, { on: day(it.at) })) + '</span>' : '') + '</span></span>' + (a ? '<span class="act">' + actBtn(a, c, 'ix-btn--primary') + '</span>' : '') + covRow(c) + '<span class="chv">' + CHEV + '</span></div>';
    }
    function renderStages() {   // v1.0.11 · the inbxify side, five stages in the order of the work
      var Bd = B(), by = { 'new': [], wip: [], wait: [], todo: [], done: [] }, n = S.linkDays || 14;
      S.customers.forEach(function (c) { itemsOf(c).concat(doneOf(c)).forEach(function (it) { by[stageOf(it)].push({ c: c, it: it }); }); });
      var byAt = function (a, b) { return String(a.it.at || '9').localeCompare(String(b.it.at || '9')); }, latest = function (a, b) { return String(b.it.at || '').localeCompare(String(a.it.at || '')); };
      var fold = function (list) { var seen = {}, out = []; list.forEach(function (x) { var k = x.c.id + '|' + x.it.tab + '|' + stepHTML(x.it); if (seen[k]) seen[k].n++; else { seen[k] = { c: x.c, it: x.it, n: 1 }; out.push(seen[k]); } }); return out; };
      return '<div class="ps-ad-stages">' + ['new', 'wip', 'wait', 'todo', 'done'].map(function (st) {
        var list = fold(by[st].sort(st === 'done' ? latest : byAt)), extra = O.slotCount ? (+O.slotCount(st) || 0) : 0, count = list.length + extra;
        return '<section class="ps-ad-box st-' + st + '"><div class="bh"><b>' + esc(Bd.stage[st]) + '</b><span class="n">' + count + '</span>' + (st === 'done' ? '<span class="sub">' + esc(fill(Bd.doneSub, { n: n })) + '</span>' : '') + '<span class="sp"></span>' + covHead() + '<span class="chvsp"></span></div>' +
          '<div class="bb">' + (O.slot ? '<div class="ps-ad-slot" data-slot="' + st + '"></div>' : '') + (list.length ? list.map(function (x) { return boardRow(x.c, x.it, x.n); }).join('') : extra ? '' : '<div class="none">' + esc(fill(Bd.none[st], { n: n })) + '</div>') + '</div></section>';
      }).join('') + '</div>';
    }
    function renderBoard() {
      if (IX) return renderStages();   // v1.0.11
      var act = [], wait = [], Bd = B();
      S.customers.forEach(function (c) { itemsOf(c).forEach(function (it) { ((IX ? it.who === 'ix' : it.who === 'you') ? act : wait).push({ c: c, it: it }); }); });
      var byAt = function (a, b) { return String(a.it.at || '9').localeCompare(String(b.it.at || '9')); };
      act.sort(byAt); wait.sort(byAt);
      var fold = function (list) {   // v1.0.5: versions of one customer at the same step are one row
        var seen = {}, out = [];
        list.forEach(function (x) { var k = x.c.id + '|' + x.it.tab + '|' + stepHTML(x.it); if (seen[k]) seen[k].n++; else { seen[k] = { c: x.c, it: x.it, n: 1 }; out.push(seen[k]); } });
        return out;
      };
      act = fold(act); wait = fold(wait);
      var box = function (cls, title, list, none) {
        return '<section class="ps-ad-box ' + cls + '"><div class="bh"><b>' + esc(title) + '</b><span class="n">' + list.length + '</span><span class="sp"></span>' + covHead() + '<span class="chvsp"></span></div>' +
          '<div class="bb"' + (IX ? '' : ' style="height:' + BOARD_ROWS_PX + 'px"') + '>' + (list.length ? list.map(function (x) { return boardRow(x.c, x.it, x.n); }).join('') : '<div class="none">' + esc(none) + '</div>') + '</div></section>';
      };
      return '<div class="ps-ad-two' + (IX ? ' stack' : '') + '">' + box('b-act', Bd.action, act, Bd.noneAction) + box('b-wait', Bd.waiting, wait, Bd.noneWaiting) + '</div>';
    }
    function listRows() {
      var q = S.q.trim().toLowerCase(), rs = S.customers.filter(function (c) { return !q || c.name.toLowerCase().indexOf(q) > -1; });
      if (!rs.length) return '<div class="ps-ad-empty">' + esc(!S.customers.length ? W.emptyAll : W.emptyQ) + '</div>';
      return rs.map(function (c) {
        var open = S.open === c.id, its = itemsOf(c), first = its[0];
        var h = '<div class="ps-ad-lr r' + (open ? ' ps-ad-openrow' : '') + '" data-c="' + esc(c.id) + '" role="button" tabindex="0" aria-expanded="' + open + '"><span class="nm">' + esc(c.name) + '</span>' +
          '<span class="nx">' + stepHTML(first) + (its.length > 1 ? '<span class="more">' + esc(fill(W.board.more, { n: its.length - 1 })) + '</span>' : '') + '</span>' +
          '<span class="wh">' + (first && first.at ? esc(day(first.at)) : '') + '</span>' + covRow(c) + '<span class="chv">' + CHEV + '</span></div>';
        if (open) h += renderOpen(c);
        return h;
      }).join('');
    }
    function renderList() {
      return '<section class="ps-ad-box b-list"><div class="bh"><b>' + esc(W.board.list) + '</b><span class="n">' + S.customers.length + '</span><span class="sp"></span>' +
        '<input type="search" class="ps-ad-search" id="ps-ad-q" placeholder="' + esc(W.search) + '" aria-label="' + esc(W.search) + '" value="' + esc(S.q) + '"></div>' +
        '<div class="ps-ad-lr th"><span>' + esc(W.board.cols.customer) + '</span><span>' + esc(W.board.cols.next) + '</span><span>' + esc(W.board.cols.since) + '</span>' + covHead() + '<span></span></div>' +
        '<div id="ps-ad-list">' + listRows() + '</div></section>';
    }
    function mark(st) {
      if (st === 'dash') return '<i class="ps-ad-dash" aria-hidden="true"></i>';
      if (st === 'ok') return '<i class="ps-ad-dot" aria-hidden="true"></i>';
      return '<span class="ps-ad-own o-' + st + '">' + esc(W.own[st]) + '</span>';
    }
    function badge(o) {
      var BW = IX ? Object.assign({}, W.badge, W.ix.badge) : W.badge;
      if (o === 'ok') return '<span class="ps-ad-badge b-ok" title="' + esc(BW.ok) + '">' + mark('ok') + '<span class="bl">' + esc(BW.ok) + '</span></span>';
      if (o === 'unsent') return '<span class="ps-ad-badge b-ix" title="' + esc(BW.unsent) + '"><span class="bl">' + esc(BW.unsent) + '</span></span>';   // v1.0.10
      if (o === 'you' || o === 'adv' || o === 'ix') return '<span class="ps-ad-badge b-' + o + '" title="' + esc(BW[o]) + '"><span class="bl">' + esc(BW[o]) + '</span></span>';
      return '<span class="ps-ad-badge b-plain" title="' + esc(BW[o] || o) + '"><span class="bl">' + esc(BW[o] || o) + '</span></span>';
    }
    function vBadge(v) { return v.state === 'current' ? badge('ok') : IX && v.state === 'unsent' ? badge('unsent') : vOwn(v) ? badge(vOwn(v)) : badge(v.state === 'ready' ? 'ready' : 'earlier'); }   // v1.0.10: Not sent
    function cardActs(c, sh, v) {   // the buttons on a version card, by side
      var h = '';
      if (IX) {
        var tool = sh === 'banner' || sh === 'sidebar';
        if (v.state === 'current') h += actBtn({ kind: 'edit', label: W.ix.act.edit, sh: sh, v: v, coming: !tool }, c);
        else if (v.state === 'needs' || v.state === 'unsent' || v.state === 'answered' || v.state === 'adv') {   // v1.0.4: both approvals and Send for approval live on the card (v1.0.10: unsent too)
          var sending = S.send && S.send.id === v.id;
          h += '<button type="button" class="ix-btn ix-btn--primary" data-act="current|' + esc(v.id) + '">' + esc(W.ix.act.approve) + '</button><button type="button" class="ix-btn ix-btn--primary" data-act="hold|' + esc(v.id) + '">' + esc(W.ix.act.hold) + '</button>' +
            (!tool ? '' : '<button type="button" class="ix-btn ix-btn--secondary' + (sending ? ' ps-ad-btnon' : '') + '" data-send="' + esc(v.id) + '">' + esc(v.sent ? W.ix.act.sendAgain : W.ix.act.send) + '</button>') + actBtn({ kind: 'edit', label: W.ix.act.edit, sh: sh, v: v, coming: !tool }, c);
          return '<div class="ps-ad-acts' + (!tool ? ' three' : '') + '">' + h + '</div>' + (sending ? sendBox(c, sh, v) : '');
        }
        else if (v.state === 'back') h += actBtn({ kind: 'open', label: W.ix.act.open, sh: sh, v: v, coming: !tool }, c, 'ix-btn--primary');
        else if (v.state === 'ready') h += '<button type="button" class="ix-btn ix-btn--primary" data-act="make|' + esc(v.id) + '">' + esc(W.ix.act.makeCurrent) + '</button>' + actBtn({ kind: 'edit', label: W.ix.act.edit, sh: sh, v: v, coming: !tool }, c);
        else if (v.state === 'earlier') h += '<button type="button" class="ix-btn ix-btn--secondary" data-act="make|' + esc(v.id) + '">' + esc(W.act.makeAgain) + '</button>' + actBtn({ kind: 'edit', label: W.ix.act.edit, sh: sh, v: v, coming: !tool }, c);
        return h ? '<div class="ps-ad-acts">' + h + '</div>' : '';
      }
      if (v.state === 'needs' || v.state === 'answered' || v.state === 'adv') {
        h += '<div class="ps-ad-acts"><button type="button" class="ix-btn ix-btn--primary" data-act="current|' + esc(v.id) + '">' + esc(W.act.current) + '</button><button type="button" class="ix-btn ix-btn--secondary" data-act="hold|' + esc(v.id) + '">' + esc(W.act.hold) + '</button>' +
          (v.state === 'needs' ? '<button type="button" class="ix-btn ix-btn--secondary" data-act="ask|' + esc(v.id) + '">' + esc(W.act.ask) + '</button>' : '') + '<button type="button" class="ps-ad-link" data-act="back|' + esc(v.id) + '">' + esc(W.act.back) + '</button></div>';
      } else if (v.state === 'ready') {
        h += '<div class="ps-ad-acts"><button type="button" class="ix-btn ix-btn--primary" data-act="make|' + esc(v.id) + '">' + esc(W.act.make) + '</button></div>';
      } else if (v.state === 'earlier') {
        if (v.stale) h += '<div class="ps-ad-stale">' + esc(fill(W.meta.stale, { ago: agoWords(v) })) + '</div><div class="ps-ad-acts"><button type="button" class="ix-btn ix-btn--primary" data-act="review|' + esc(v.id) + '">' + esc(W.act.review) + '</button></div>';
        else h += '<div class="ps-ad-acts"><button type="button" class="ix-btn ix-btn--primary" data-act="make|' + esc(v.id) + '">' + esc(W.act.makeAgain) + '</button><button type="button" class="ix-btn ix-btn--secondary" data-act="restore|' + esc(v.id) + '">' + esc(W.act.restore) + '</button></div>';
      }
      return h;
    }
    // ── v1.0.6 · Delete this ad, inside the card (inbxify side) ──
    function delHTML(v) {
      var X = W.ix.del, Dl = S.del && S.del.id === v.id ? S.del : null;
      if (S.tb && S.tb.id === v.id) return tbHTML(v);   // v1.0.9
      if (!Dl) return '<div class="ps-ad-delrow">' + (v.sent ? '<button type="button" class="ps-ad-cancel tb" data-tb="' + esc(v.id) + '">' + esc(W.ix.tb.link) + '</button>' : S.took[v.id] ? '<span class="tbdone">' + esc(W.ix.tb.done) + '</span>' : '<span></span>') +
        '<button type="button" class="ps-ad-cancel" data-del="' + esc(v.id) + '">' + esc(X.link) + '</button></div>';
      return '<div class="ps-ad-delbox" role="alertdialog"><b>' + esc(X.ask) + '</b><div>' + esc(X.what) + '</div><div class="never">' + esc(X.never) + '</div>' + (Dl.err ? '<div class="ps-ad-need">' + esc(Dl.err) + '</div>' : '') +
        '<div class="dba"><button type="button" class="ix-btn ix-btn--danger" data-delgo="1"' + (Dl.busy ? ' disabled' : '') + '>' + esc(Dl.busy ? X.going : X.go) + '</button><button type="button" class="ps-ad-cancel" data-delcancel="1">' + esc(X.cancel) + '</button></div></div>';
    }
    // ── v1.0.9 · Take back this email, inside the card (inbxify side) ──
    function tbHTML(v) {
      var X = W.ix.tb, T = S.tb, sn = v.sent || {}, to = sn.test ? sn.to : (sn.toName || sn.to), n = Number(sn.otherAds) || 0, l = Number(sn.links) || 1;
      var extra = (l > 1 ? '<div>' + esc(fill(X.two, { n: l })) + '</div>' : '') + (n ? '<div>' + esc(n === 1 ? (l > 1 ? X.others1Pl : X.others1) : fill(l > 1 ? X.othersNPl : X.othersN, { n: n })) + '</div>' : '');
      return '<div class="ps-ad-tbbox" role="alertdialog"><b>' + esc(fill(X.ask, { to: to || '' })) + '</b><div>' + esc(X.what) + '</div>' + extra + (T.err ? '<div class="ps-ad-need">' + esc(T.err) + '</div>' : '') +
        '<div class="dba"><button type="button" class="ix-btn ix-btn--secondary" data-tbgo="1"' + (T.busy ? ' disabled' : '') + '>' + esc(T.busy ? X.going : l > 1 ? X.goPl : X.go) + '</button><button type="button" class="ps-ad-cancel" data-tbkeep="1">' + esc(X.keep) + '</button></div></div>';
    }
    async function goTakeBack() {
      var T = S.tb, f = T && findV(T.id); if (!T || !f || T.busy) return;
      T.busy = true; T.err = ''; render();
      var r = await ctx.api('/ads/approval/withdraw', { method: 'POST', body: { publisher: ctx.publisher.id, adId: T.id }, label: W.ix.tb.label });
      if (!r.ok || !r.json || !r.json.ok) { T.busy = false; T.err = fill(W.ix.tb.fail, { msg: (r.json && r.json.error) || ('HTTP ' + r.status) }); render(); return; }
      S.took[T.id] = true; (r.json.otherAds || []).forEach(function (o) { if (o && o.adId) S.took[o.adId] = true; });
      S.tb = null; if (S.send && S.send.id === T.id) S.send = null;
      await load(); render();
    }
    async function reqDone(key, btn) {   // v1.0.9 · a request for a shape Ad Maker cannot make: inbxify closes it by hand
      var p = key.split('|'), c = cust(p[0]); if (!c) return;
      if (btn) { btn.disabled = true; btn.textContent = W.ix.reqDone.going + '\u2026'; }
      var r = await ctx.api('/ads/request/' + encodeURIComponent(p[2]) + '/done', { method: 'POST', body: {}, label: W.ix.reqDone.going });
      if (!r.ok || !r.json || !r.json.ok) { toast(fill(W.ix.reqDone.fail, { msg: (r.json && r.json.error) || ('HTTP ' + r.status) }), 'error', 'reqdone'); await load(); render(); return; }
      await load(); render();
      toast(fill(W.ix.reqDone.done, { shape: SHN[p[1]], name: c.name }), 'ok', 'reqdone');
    }
    async function goDelete() {
      var Dl = S.del, f = Dl && findV(Dl.id); if (!Dl || !f || Dl.busy) return;
      Dl.busy = true; Dl.err = ''; render();
      var url = ''; try { url = (O.designUrl && O.designUrl(Dl.id)) || ''; } catch (e) { url = ''; }
      var r = await ctx.api('/ads/delete', { method: 'POST', body: { publisher: ctx.publisher.id, adId: Dl.id }, label: W.ix.del.deleting });
      if (!r.ok || !r.json || !r.json.ok) { Dl.busy = false; Dl.err = fill(W.ix.del.fail, { msg: (r.json && r.json.error) || ('HTTP ' + r.status) }); render(); return; }
      S.gone = { cust: f.c.id, name: r.json.name || f.v.name || '', kept: r.json.kept || [], url: url, d: r.json.deleted || {}, pics: r.json.pictures || [] }; S.del = null; delete S.staged[Dl.id]; if (S.send && S.send.id === Dl.id) S.send = null;
      try { if (O.onDeleted) O.onDeleted(Dl.id, r.json); } catch (e) { console.error('[ix-ads-board] onDeleted', e); }
      await load(); render();
    }
    function goneHTML() {
      var G = S.gone, X = W.ix.del; if (!G) return '';
      var m = Number(G.d.media) || 0, l = Number(G.d.links) || 0, w = [X.withAd, m === 1 ? X.withMedia1 : m ? fill(X.withMediaN, { n: m }) : X.withMedia0];
      var fl = Number(G.d.files) || 0; if (fl) w.push(fl === 1 ? X.withFiles1 : fill(X.withFilesN, { n: fl }));
      if (l) w.push(l === 1 ? X.withLinks1 : fill(X.withLinksN, { n: l }));
      var li = (G.url ? '<li><a href="' + esc(G.url) + '" target="_blank" rel="noopener">' + esc(X.canva) + '</a></li>' : '') + G.kept.map(function (k) {
        var pics = /Uploadcare/.test(k) ? G.pics.map(function (u, i) { return ' <a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(X.pic + (G.pics.length > 1 ? ' ' + (i + 1) : '')) + '</a>'; }).join('') : '';
        return '<li>' + esc(k) + pics + '</li>'; }).join('');
      return '<div class="ps-ad-gone" role="status"><div class="gh"><b>' + esc(fill(X.done, { name: G.name })) + '</b><button type="button" class="ps-ad-cancel" data-goneclose="1">' + esc(X.close) + '</button></div>' +
        '<div>' + esc(X.withHead) + ' ' + esc(w.join(', ')) + '.</div>' + (li ? '<div class="gl">' + esc(X.left) + '</div><ul>' + li + '</ul>' : '') + '</div>';
    }
    // ── v1.0.4 · the Send for approval box, inside the card (inbxify side) ──
    function sendBox(c, sh, v) {
      var B = S.send, X = W.ix.send, again = !!v.sent;
      var h = '<div class="ps-ad-sendbox"><div class="sbh"><b>' + esc(again ? X.headAgain : X.head) + '</b><button type="button" class="ps-ad-cancel" data-sendcancel="1">' + esc(X.cancel) + '</button></div>';
      if (again) h += '<div class="ps-ad-quiet">' + esc(fill(X.again, { name: v.sent.test ? v.sent.to : (v.sent.toName || v.sent.to), on: day(v.sent.sentAt) })) + '</div>';
      if (B.loading) return h + '<div class="ps-ad-quiet">' + esc(X.loading) + '</div></div>';
      if (B.err && !B.to) return h + '<div class="ps-ad-need">' + esc(B.err) + '</div></div>';
      var P = B.pub, hasPub = !!P;
      h += '<div class="sbf"><span class="sbl">' + esc(X.to) + '</span>' +
        '<label class="sbr"><input type="radio" name="ps-ad-sendto" data-sendto="publisher"' + (B.to === 'publisher' ? ' checked' : '') + (hasPub ? '' : ' disabled') + '> ' + esc(hasPub ? P.name + ' \u00b7 ' + P.email : X.noPub) + '</label>' +
        '<label class="sbr"><input type="radio" name="ps-ad-sendto" data-sendto="test"' + (B.to === 'test' ? ' checked' : '') + '> ' + esc(B.test + ' ' + X.test) + ' <span class="ps-ad-quiet">' + esc(X.testNote) + '</span></label></div>';
      h += '<div class="sbf"><label class="sbl" for="ps-ad-sendsub">' + esc(X.subject) + '</label><input type="text" id="ps-ad-sendsub" class="ps-ad-sendin' + (B.subject !== B.std.subject ? ' chg' : '') + '" data-sendf="subject" maxlength="200" value="' + esc(B.subject) + '"></div>';
      h += '<div class="sbf"><label class="sbl" for="ps-ad-sendmsg">' + esc(X.message) + '</label><textarea id="ps-ad-sendmsg" class="ps-ad-sendin' + (B.message !== B.std.message ? ' chg' : '') + '" data-sendf="message" maxlength="4000">' + esc(B.message) + '</textarea></div>';
      h += '<div class="ps-ad-quiet">' + esc(fill(X.added, { shape: SHN[sh].toLowerCase(), button: (B.added || [])[0] || '', until: (B.added || [])[1] || '' })) + '</div>';
      if (B.err) h += '<div class="ps-ad-need">' + esc(B.err) + '</div>';
      return h + '<div class="sba"><button type="button" class="ix-btn ix-btn--primary" data-sendgo="1"' + (B.busy ? ' disabled' : '') + '>' + esc(B.busy ? X.going : X.go) + '</button></div></div>';
    }
    async function openSend(id) {
      var f = findV(id); if (!f) return;
      var B = S.send = { id: id, loading: true, err: '', busy: false }; render();
      var r = await ctx.api('/ads/send-approval', { method: 'POST', body: { publisher: ctx.publisher.id, items: [{ adId: id, shape: f.sh }], to: 'publisher', preview: true }, label: W.ix.send.loading });
      if (S.send !== B) return;
      B.loading = false;
      if (!r.ok) { B.err = (r.json && r.json.error) || ('HTTP ' + r.status); render(); return; }
      var j = r.json; B.std = { subject: j.subject, message: j.message }; B.subject = j.subject; B.message = j.message; B.pub = j.to && j.to.publisher; B.test = (j.to && j.to.test) || ''; B.added = j.added || []; B.to = B.pub ? 'publisher' : 'test';
      render();
    }
    async function goSend() {
      var B = S.send, f = B && findV(B.id); if (!B || !f || B.busy) return;
      if (!String(B.subject).trim() || !String(B.message).trim()) { B.err = W.ix.send.need; render(); return; }
      B.busy = true; B.err = ''; render();
      var body = { publisher: ctx.publisher.id, items: [{ adId: B.id, shape: f.sh }], to: B.to };
      if (B.subject !== B.std.subject) body.subject = B.subject; if (B.message !== B.std.message) body.message = B.message;
      var r = await ctx.api('/ads/send-approval', { method: 'POST', body: body, label: W.ix.send.going });
      if (!r.ok || !r.json || !r.json.mailId) { B.busy = false; B.err = fill(W.ix.send.fail, { msg: (r.json && r.json.error) || ('HTTP ' + r.status) }); render(); return; }
      delete S.took[B.id]; S.send = null; toast(fill(r.json.test ? W.ix.send.doneTest : W.ix.send.done, { to: r.json.test ? r.json.sentTo : (r.json.sentToName || r.json.sentTo) }), 'ok', 'send');
      await load(); render();
    }
    function vCard(c, sh, v, opts) {
      opts = opts || {};
      var shp = SHN[sh], g = S.staged[v.id], w = 'w-' + (sh === 'text' ? 'banner' : sh), L = v.link || {};
      var h = '<div class="ps-ad-shp' + (g ? ' gold' : '') + (opts.four ? ' four' : '') + (opts.four && S.flash[c.id + '|' + sh] ? ' flash' : '') + '" id="' + (opts.four ? 'shp-' + esc(c.id) + '-' + sh : 'v-' + esc(v.id)) + '"><div class="shead"><span class="sl">' + esc(shp) + '</span><span class="sp"></span>' + (v.state === 'current' ? badge('ok') : opts.badge !== false ? vBadge(v) : '') + '</div><div class="vt">' + esc(v.name) + '</div>';
      h += (opts.four ? '<div class="ps-ad-stage s-' + sh + '">' : '') + '<div class="ps-ad-frame' + (g ? ' chg' : '') + ' ' + (sh === 'text' ? '' : w) + '">' + art(v, sh) + '</div>' + (opts.four ? '</div>' : '');
      var meta = metaFor(v, c); if (meta || opts.four) h += '<div class="ps-ad-meta">' + (meta || '&nbsp;') + '</div>';
      if (IX && v.sent && S.send && S.send.id === v.id && !(v.state === 'needs' || v.state === 'answered' || v.state === 'adv')) S.send = null;
      if (v.state === 'answered' && L.answer === 'change' && (L.change || L.like)) h += '<div class="ps-ad-ans"><b>' + esc(fill(W.answeredBox, { who: L.answeredBy || 'The advertiser', on: day(L.answeredAt) })) + '</b>' + esc(L.change || L.like) + (L.files && L.files.length ? ' <span class="ps-ad-quiet">· ' + L.files.length + (L.files.length === 1 ? ' file' : ' files') + '</span>' : '') + '</div>';
      if (g) {
        h += '<div class="ps-ad-staged"><span class="tag">' + esc(fill(W.onSave, { what: stagedWhat(g, v) })) + '</span><button type="button" class="ps-ad-cancel" data-unstage="' + esc(v.id) + '">' + esc(W.cancel) + '</button></div>';
        if (g.act === 'ask') h += '<div class="ps-ad-quiet" style="margin-top:8px;max-width:60ch">' + esc(fill(W.askNote, { name: c.name, days: S.linkDays })) + '</div>';
        if (g.act === 'back') h += '<div style="margin-top:10px"><label class="ps-ad-quiet" for="note-' + esc(v.id) + '">' + esc(W.noteLabel) + '</label><br><textarea class="ps-ad-note' + (g.note ? ' chg' : '') + '" id="note-' + esc(v.id) + '" data-note="' + esc(v.id) + '" placeholder="' + esc(W.notePh) + '">' + esc(g.note || '') + '</textarea>' + (g.note ? '' : '<div class="ps-ad-need">' + esc(W.noteNeed) + '</div>') + '</div>';
      } else h += cardActs(c, sh, v);
      if (IX && !opts.four && v.state !== 'current' && !g) h += delHTML(v);   // v1.0.6
      if (opts.four && !IX && anyReq(c)) h += reqBand(c, sh);
      return h + '</div>';
    }
    function plainDay(v) { return v ? day(v) : ''; }
    function reqBand(c, sh) {
      var list = reqsOf(c, sh), R = W.req;
      if (!list.length) return '<div class="ps-ad-req blank" aria-hidden="true"></div>';
      var latest = list[list.length - 1], low = SHN[sh].toLowerCase(), key = c.id + '|' + sh;
      if (S.wd && S.wd.key === key) {
        return '<div class="ps-ad-req"><div class="cf">' + esc(fill(R.confirm, { shape: low })) + ' <button type="button" class="ix-btn ix-btn--danger ps-ad-sm" data-wdgo="' + esc(key) + '"' + (S.wd.busy ? ' disabled' : '') + '>' + esc(R.withdraw) + '</button><button type="button" class="ps-ad-cancel" data-wdkeep="1">' + esc(R.keep) + '</button></div></div>';
      }
      var head = list.length > 1 ? fill(R.many, { n: list.length, shapes: R.plural[sh] || (low + 's'), on: plainDay(latest.askedAt) }) : fill(R.one, { shape: low, on: plainDay(latest.askedAt) });
      var wants = list.map(function (r) { return r.wantedBy; }).filter(Boolean).sort();
      var line2 = wants.length ? fill(R.wanted, { on: plainDay(wants[0]) }) + ' · ' + R.withIx : R.withIxCap;
      return '<div class="ps-ad-req"><b>' + esc(head) + '</b><span class="ln">' + esc(line2) + '</span><span class="ln">' + esc(fill(R.asked, { who: approver() })) + ' · <button type="button" class="ps-ad-link" data-wdask="' + esc(key) + '">' + esc(R.withdraw) + '</button></span></div>';
    }
    function renderShape(c, sh) {   // the Current tab: one equal card per shape, always four
      var vs = vOf(c, sh), cur = curOf(c, sh), sold = c.shapes[sh].sold, shp = SHN[sh];
      var tool = sh === 'banner' || sh === 'sidebar';
      var empty = function (line, actHtml) { return '<div class="ps-ad-shp four noad' + (S.flash[c.id + '|' + sh] ? ' flash' : '') + '" id="shp-' + esc(c.id) + '-' + sh + '"><div class="shead"><span class="sl">' + esc(shp) + '</span><span class="sp"></span></div><div class="vt">&nbsp;</div><div class="ps-ad-stage"><span class="ps-ad-holder">' + esc(line) + '</span></div><div class="ps-ad-meta">' + (actHtml || '&nbsp;') + '</div>' + (!IX && anyReq(c) ? reqBand(c, sh) : '') + '</div>'; };
      if (!sold && !vs.length) return empty(W.notSoldShort);
      if (!cur) {   // sold, nothing running: on inbxify's side the card carries Make <shape> (seed ruling 8)
        var mk = IX ? '<div class="ps-ad-acts" style="margin-top:0">' + actBtn({ kind: 'make', label: tool ? fill(W.ix.act.make, { shape: shp.toLowerCase() }) : W.ix.act.coming, sh: sh, v: null, coming: !tool }, c, 'ix-btn--primary') + '</div>' : '';
        return empty(W.noRunShort, mk);
      }
      return vCard(c, sh, cur, { four: true });
    }
    function perShape(list) {
      var n = {}; list.forEach(function (x) { n[x.sh] = (n[x.sh] || 0) + 1; });
      return SH.filter(function (sh) { return n[sh]; }).map(function (sh) { return esc(SHN[sh]) + ' ' + n[sh]; }).join(' · ');
    }
    function renderCols(c) {
      var all = []; SH.forEach(function (sh) { vOf(c, sh).forEach(function (v) { all.push({ v: v, sh: sh }); }); });
      var pend = all.filter(function (x) { return ['needs', 'unsent', 'answered', 'adv', 'back'].indexOf(x.v.state) > -1; });
      var hot = pend.some(function (x) { return IX ? x.v.state === 'back' : (x.v.state === 'needs' || x.v.state === 'answered'); });
      var ready = all.filter(function (x) { return x.v.state === 'ready'; }), old = all.filter(function (x) { return x.v.state === 'earlier'; });
      var tab = S.tab[c.id] || (pend.length ? 'process' : 'current');
      var th = '<div class="ps-ad-tabs" role="tablist">' + [['current', W.rail.current, ''], ['process', W.rail.process, pend.length ? perShape(pend) : ''], ['other', W.rail.other, (ready.length + old.length) ? perShape(ready.concat(old)) : '']].map(function (t) {
        return '<button type="button" role="tab" class="ps-ad-tab' + (tab === t[0] ? ' on' : '') + (t[0] === 'process' && hot ? ' hot' : '') + '" aria-selected="' + (tab === t[0]) + '" data-tab="' + esc(c.id) + '|' + t[0] + '">' + esc(t[1]) + (t[2] ? ' <span class="cnt">' + t[2] + '</span>' : '') + '</button>'; }).join('') + '<span class="sp"></span>' +
        (IX ? '' : '<button type="button" class="ix-btn ix-btn--secondary ps-ad-reqbtn" data-reqopen="' + esc(c.id) + '">' + PLUS + esc(W.req.button) + '</button>') + '</div>';
      var body;
      if (tab === 'current') body = '<div class="ps-ad-four">' + SH.map(function (sh) { return renderShape(c, sh); }).join('') + '</div>';
      else if (tab === 'process') {
        var links = {}; pend.forEach(function (x) { var L = x.v.link; if (L && x.v.state === 'adv' && !links[L.reviewId]) links[L.reviewId] = L; });
        var lh = Object.keys(links).map(function (k) { var L = links[k];
          return '<div class="ps-ad-linkbox"><b>' + esc(fill(W.linkOut, { until: day(L.until) })) + '</b>' + (L.url ? ' · <button type="button" class="ps-ad-link" data-copy="' + esc(L.url) + '">' + esc(W.copyLink) + '</button>' : '') + '<span class="s">' + esc(L.openedAt ? fill(W.linkOpened, { on: day(L.openedAt) }) : W.linkNotOpened) + '</span></div>'; }).join('');
        body = lh + (pend.length ? '<div class="ps-ad-grid' + (S.send || S.del ? ' sending' : '') + '">' + pend.map(function (x) { return vCard(c, x.sh, x.v); }).join('') + '</div>' : '<div class="ps-ad-quiet">' + esc(W.colNone.process) + '</div>');
      } else {
        body = '<div class="ps-ad-sub">' + esc(W.rail.ready) + (ready.length ? ' <span>· ' + perShape(ready) + '</span>' : '') + '</div>' + (ready.length ? '<div class="ps-ad-grid' + (S.del ? ' sending' : '') + '">' + ready.map(function (x) { return vCard(c, x.sh, x.v, { badge: false }); }).join('') + '</div>' : '<div class="ps-ad-quiet">' + esc(W.colNone.ready) + '</div>') +
          '<div class="ps-ad-sub">' + esc(W.rail.archived) + (old.length ? ' <span>· ' + perShape(old) + '</span>' : '') + '</div>' + (old.length ? '<div class="ps-ad-grid' + (S.del ? ' sending' : '') + '">' + old.map(function (x) { return vCard(c, x.sh, x.v, { badge: false }); }).join('') + '</div>' : '<div class="ps-ad-quiet">' + esc(W.colNone.archived) + '</div>');
      }
      return th + '<div class="ps-ad-tabbody" role="tabpanel">' + (IX && S.gone && S.gone.cust === c.id ? goneHTML() : '') + body + '</div>';   // v1.0.7: the notice sits where the work is
    }
    function renderOpen(c) {
      var probs = (c.problems || []).length && ctx.who.staff ? '<div class="ps-ad-probs">' + c.problems.map(esc).join('<br>') + '</div>' : '';
      return '<div class="ps-ad-ex">' + probs + renderCols(c) + '</div>';
    }
    function renderSave() {
      var ids = Object.keys(S.staged);
      if (!ids.length && !S.saving) return '';
      var steps = IX ? W.ix.save.steps : W.save.steps;
      if (S.saving) {
        var st = S.saving;
        return '<div class="ps-ad-savebar" role="status"><div class="what">' + (ctx.who.staff ? '<b>' + esc(W.save.saving) + '</b><ul class="steps">' + steps.map(function (s, i) { return '<li class="' + (i < st.step ? 'done' : i === st.step ? 'on' : '') + '">' + (i < st.step ? '✓ ' : '') + esc(s) + '</li>'; }).join('') + '</ul>' : '<b>' + esc(W.save.saving) + '</b>') + '</div></div>';
      }
      var missing = ids.some(function (id) { return S.staged[id].act === 'back' && !S.staged[id].note; });
      var list = ids.map(function (id) { var f = findV(id); if (!f) return ''; return '<li>' + esc(fill(W.save.line, { name: f.c.name, shape: SHN[f.sh].toLowerCase(), what: stagedWhat(S.staged[id], f.v).toLowerCase() })) + '</li>'; }).join('');
      return '<div class="ps-ad-savebar"><div class="what"><b>' + esc(ids.length > 1 ? fill(W.save.n, { n: ids.length }) : W.save.n1) + '</b><ul>' + list + '</ul>' + (missing ? '<div class="ps-ad-need">' + esc(W.save.need) + '</div>' : '') + '</div><button type="button" class="ps-ad-cancel" id="ps-ad-cancelall">' + esc(W.cancel) + '</button><button type="button" class="ix-btn ix-btn--primary" id="ps-ad-saveall"' + (missing ? ' disabled' : '') + '>' + esc(W.save.save) + '</button></div>';
    }
    function render() {
      var y = window.scrollY, act = document.activeElement, keep = act && act.id === 'ps-ad-q' ? { s: act.selectionStart, e: act.selectionEnd } : null;
      var h = '<div class="ps-ad ix-ab ix-own side-' + side + '">' + (O.title === '' ? '' : '<div class="ps-titlerow"><h1>' + esc(O.title || W.title) + '</h1>' + infoHTML() + '<div class="sp"></div></div>');
      if (!S.loaded) h += ctx.placeholder ? '<div class="ps-ad-tbl"><table style="width:100%"><tbody>' + ctx.placeholder(5, 6) + '</tbody></table></div>' : '<div class="ps-ad-empty">' + esc(W.api.ads) + '…</div>';
      else if (S.loadErr) h += '<div class="ps-err" role="alert">' + esc(fill(W.loadFail, { msg: S.loadErr })) + '</div>';
      else h += (IX && S.gone && S.open !== S.gone.cust ? goneHTML() : '') + renderBoard() + renderList();
      h += renderMail() + '<div id="ps-ad-savewrap">' + renderSave() + '</div>' + renderReq() + '</div>';
      el.innerHTML = h;
      if (IX && O.slot) el.querySelectorAll('[data-slot]').forEach(function (sl) { var node = O.slot(sl.getAttribute('data-slot')); if (node) sl.appendChild(node); });   // v1.0.11
      if (keep) { var q = el.querySelector('#ps-ad-q'); if (q) { q.focus(); try { q.setSelectionRange(keep.s, keep.e); } catch (e) {} } }
      window.scrollTo(0, y);
      if (S.scrollTo) {
        var target = S.scrollTo; S.scrollTo = null;
        [0, 300, 900].forEach(function (ms) { setTimeout(function () {
          var n = el.querySelector('[data-c="' + target + '"]'); if (!n) return;
          var th = el.querySelector('.ps-ad-lr.th'), off = (th ? th.offsetHeight : 0) + 16;
          window.scrollTo(0, Math.max(0, n.getBoundingClientRect().top + window.scrollY - off));
        }, ms); });
      }
    }
    function flashTo(cid, sh, block) {
      requestAnimationFrame(function () { var n = document.getElementById('shp-' + cid + '-' + sh); if (n) { n.scrollIntoView({ behavior: 'smooth', block: block || 'center' }); n.classList.add('flash'); } });
    }

    // ── data ──
    async function load() {
      var r = await ctx.api('/ads?publisher=' + encodeURIComponent(ctx.publisher.id), { label: W.api.ads });
      if (!r.ok) { S.loaded = true; S.loadErr = (r.json && r.json.error) || ('HTTP ' + r.status); return; }
      S.customers = r.json.customers || []; S.linkDays = r.json.linkDays || 14; S.staleMonths = r.json.staleMonths || 6;
      S.customers.forEach(function (c) { Object.keys(c.shapes || {}).forEach(function (k) { (c.shapes[k].versions || []).forEach(function (v) { if (v.state === 'needs' && !v.sent) v.state = 'unsent'; }); }); });   // v1.0.10
      if (Array.isArray(r.json.shapes) && r.json.shapes.length) { SH = r.json.shapes.map(function (s) { return s.key; }); r.json.shapes.forEach(function (s) { SHN[s.key] = s.label; }); }
      S.loaded = true; S.loadErr = '';
      if (S.deep && S.customers.some(function (c) { return c.id === S.deep; })) { S.open = S.deep; S.tab[S.deep] = 'current'; S.scrollTo = S.deep; S.deep = null; }
      if (r.json.contact && ctx.publisher && !ctx.publisher.contact) ctx.publisher.contact = r.json.contact.person || '';   // v1.0.2
      if (O.onLoad) try { O.onLoad(S.customers, r.json); } catch (e) { console.warn('[ix-ads-board] onLoad', e); }
    }

    // ── save ──
    var ACT_API = { current: 'approve-current', hold: 'approve-hold', back: 'send-back', make: 'make-current', restore: 'restore-hold', review: 'restore-review' };
    async function save() {
      var ids = Object.keys(S.staged); if (!ids.length) return;
      S.saving = { step: 0 }; render();
      var ok = 0, bad = 0, msgs = [], unconf = [], mails = [];
      var byCust = {};
      ids.forEach(function (id) { var f = findV(id); if (!f) return; if (S.staged[id].act === 'ask') (byCust[f.c.id] = byCust[f.c.id] || []).push({ adId: id, shape: f.sh, name: f.c.name }); });
      S.saving.step = 1; render();
      for (var i = 0; i < ids.length; i++) {
        var id = ids[i], g = S.staged[id], f = findV(id); if (!f || g.act === 'ask') continue;
        if (g.act === 'current' || g.act === 'make') { S.saving.step = Math.max(S.saving.step, 2); render(); }
        var r = await ctx.api('/ads/' + encodeURIComponent(id) + '/decide', { method: 'POST', body: IX ? { publisher: ctx.publisher.id, shape: f.sh, action: ACT_API[g.act], note: g.note || '', as: 'inbxify' } : { publisher: ctx.publisher.id, shape: f.sh, action: ACT_API[g.act], note: g.note || '' }, label: fill(W.api.decide, { what: f.c.name + ', ' + SHN[f.sh].toLowerCase() }) });
        if (r.ok) { ok++; (r.json.unconfirmed || []).forEach(function (u) { unconf.push(f.c.name + ' ' + u); }); }
        else { bad++; msgs.push(f.c.name + ', ' + SHN[f.sh].toLowerCase() + ': ' + ((r.json && r.json.error) || ('HTTP ' + r.status))); }
      }
      var custIds = Object.keys(byCust);
      if (custIds.length) { S.saving.step = 3; render(); }
      for (var k = 0; k < custIds.length; k++) {
        var items = byCust[custIds[k]], name = items[0].name;
        var ra = await ctx.api('/ads/ask', { method: 'POST', body: { publisher: ctx.publisher.id, items: items.map(function (it) { return { adId: it.adId, shape: it.shape }; }) }, label: fill(W.api.ask, { name: name }) });
        if (ra.ok) { ok += items.length; mails.push({ name: name, subject: ra.json.subject, body: ra.json.message }); (ra.json.unconfirmed || []).forEach(function (u) { unconf.push(name + ' ' + u); }); }
        else { bad += items.length; msgs.push(name + ', ' + W.act.ask.toLowerCase() + ': ' + ((ra.json && ra.json.error) || ('HTTP ' + ra.status))); }
      }
      S.saving.step = IX ? 3 : 4; render();
      S.staged = {};
      await load();
      S.saving = null; render();
      if (bad) toast(fill(W.savedPart, { ok: ok, bad: bad, msg: msgs.join(' ') }), 'error', 'save');
      else toast(ok === 1 ? W.savedOne : fill(W.saved, { n: ok + ' changes' }), 'ok', 'save');
      if (unconf.length) toast(fill(W.unconfirmed, { list: unconf.join(', ') }), 'unverified', 'unconf');
      if (mails.length) { S.mail = mails; render(); }
    }
    function mailHref(m) { return 'mailto:?subject=' + encodeURIComponent(m.subject || '') + '&body=' + encodeURIComponent(m.body || ''); }
    function renderMail() {
      if (!S.mail || !S.mail.length) return '';
      return '<div class="ps-ad-mailwrap">' + S.mail.map(function (m, i) {
        return '<div class="ps-ad-mail"><div class="mh"><b>' + esc(fill(W.mail.head, { name: m.name })) + '</b><button type="button" class="ps-ad-cancel" data-mailclose="' + i + '">' + esc(W.mail.close) + '</button></div>' +
          '<div class="ml"><span>' + esc(W.mail.subject) + '</span><input type="text" readonly value="' + esc(m.subject || '') + '"></div>' +
          '<textarea readonly rows="7">' + esc(m.body || '') + '</textarea>' +
          '<div class="ma"><a class="ix-btn ix-btn--primary" href="' + esc(mailHref(m)) + '">' + esc(W.mail.open) + '</a><button type="button" class="ix-btn ix-btn--secondary" data-mailcopy="' + i + '">' + esc(W.mail.copy) + '</button><span class="ps-ad-quiet">' + esc(W.mail.note) + '</span></div></div>';
      }).join('') + '</div>';
    }

    // ── request new ads (publisher side) ──
    function reqPicked() { var R = S.req; return SH.filter(function (sh) { return R.picks[sh]; }); }
    function listWords(arr) { return arr.length > 1 ? arr.slice(0, -1).join(', ') + W.req.and + arr[arr.length - 1] : (arr[0] || ''); }
    function reqWhat() {
      var R = S.req, n = reqPicked();
      if (!n.length) return W.req.whatNone;
      if (!R.note.trim()) return W.req.whatNote;
      if (R.files.some(function (f) { return f.busy; })) return W.req.whatFiles;
      return fill(W.req.what, { list: listWords(n.map(function (sh) { return SHN[sh].toLowerCase(); })), when: R.when ? fill(W.req.whatWhen, { on: day(R.when) }) : '' });
    }
    function reqReady() { var R = S.req; return reqPicked().length && R.note.trim() && !R.files.some(function (f) { return f.busy; }) && !R.sending; }
    function todayYmd() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function renderReq() {
      var R = S.req; if (!R) return '';
      var c = cust(R.cid); if (!c) return '';
      var Q = W.req;
      var tiles = SH.map(function (sh) { var on = !!R.picks[sh];
        return '<button type="button" class="ps-ad-pick' + (on ? ' on' : '') + '" data-pick="' + sh + '" aria-pressed="' + on + '"' + (R.sending ? ' disabled' : '') + '><span class="box" aria-hidden="true"></span>' + esc(SHN[sh]) + '</button>'; }).join('');
      var files = R.files.map(function (f, i) { return '<span class="ps-ad-fchip">' + esc(f.name) + (f.busy ? ' <em>' + esc(Q.uploading) + '</em>' : '') + (R.sending ? '' : ' <button type="button" class="ps-ad-cancel" data-rmfile="' + i + '">' + esc(Q.remove) + '</button>') + '</span>'; }).join('');
      return '<div class="ps-ad-ov" role="dialog" aria-modal="true" aria-labelledby="ps-ad-reqh"><div class="ps-ad-modal">' +
        '<div class="mh"><h2 id="ps-ad-reqh">' + esc(Q.head) + '</h2><p>' + esc(fill(Q.sub, { name: c.name })) + '</p></div>' +
        '<div class="mb">' +
          '<div class="fld"><div class="fl">' + esc(Q.which) + '<span class="sp"></span><button type="button" class="ps-ad-link" data-tickall="1">' + esc(Q.tickAll) + '</button></div><div class="ps-ad-picks">' + tiles + '</div></div>' +
          '<div class="fld"><label class="fl" for="ps-ad-reqwhen">' + esc(Q.when) + ' <span class="opt">' + esc(Q.optional) + '</span></label><input type="date" id="ps-ad-reqwhen" class="ps-ad-in' + (R.when ? ' chg' : '') + '" min="' + todayYmd() + '" value="' + esc(R.when) + '"' + (R.sending ? ' disabled' : '') + '></div>' +
          '<div class="fld"><label class="fl" for="ps-ad-reqnote">' + esc(Q.note) + '</label><textarea id="ps-ad-reqnote" class="ps-ad-in ps-ad-reqnote' + (R.note.trim() ? ' chg' : '') + '" placeholder="' + esc(Q.notePh) + '"' + (R.sending ? ' disabled' : '') + '>' + esc(R.note) + '</textarea><div class="ps-ad-need" id="ps-ad-reqneed">' + (reqPicked().length && !R.note.trim() ? esc(Q.noteNeed) : '') + '</div></div>' +
          '<div class="fld"><div class="fl">' + esc(Q.files) + ' <span class="opt">' + esc(Q.optional) + '</span></div><div class="ps-ad-files">' + files + (R.sending ? '' : '<button type="button" class="ps-ad-addf" data-addfile="1">' + esc(Q.addFiles) + '</button>') + '</div><input type="file" id="ps-ad-reqfile" multiple hidden></div>' +
        '</div>' +
        '<div class="mf"><div class="what" id="ps-ad-reqwhat">' + (R.sending ? esc(Q.sending) + '<div class="ps-ad-prog"><i></i></div>' : R.err ? '<span class="ps-ad-need">' + esc(R.err) + '</span>' : esc(reqWhat())) + '</div>' +
          (R.sending ? '' : '<button type="button" class="ps-ad-cancel" data-reqcancel="1">' + esc(Q.cancel) + '</button>') +
          '<button type="button" class="ix-btn ix-btn--primary" id="ps-ad-reqsend"' + (reqReady() ? '' : ' disabled') + '>' + esc(Q.send) + '</button></div>' +
      '</div></div>';
    }
    function reqFoot() {
      var R = S.req; if (!R) return;
      var w = el.querySelector('#ps-ad-reqwhat'), b = el.querySelector('#ps-ad-reqsend'), nd = el.querySelector('#ps-ad-reqneed'), nt = el.querySelector('#ps-ad-reqnote'), wh = el.querySelector('#ps-ad-reqwhen');
      if (w && !R.sending) w.textContent = R.err || reqWhat();
      if (b) b.disabled = !reqReady();
      if (nd) nd.textContent = reqPicked().length && !R.note.trim() ? W.req.noteNeed : '';
      if (nt) nt.classList.toggle('chg', !!R.note.trim());
      if (wh) wh.classList.toggle('chg', !!R.when);
    }
    function openReq(cid) { S.req = { cid: cid, picks: {}, when: '', note: '', files: [], sending: false, err: '' }; S.wd = null; render(); requestAnimationFrame(function () { var t = el.querySelector('.ps-ad-pick'); if (t) t.focus(); }); }
    function closeReq() { S.req = null; render(); }
    function addFiles(list) {
      var R = S.req; if (!R) return;
      Array.prototype.forEach.call(list || [], function (file) {
        if (file.size > 20 * 1024 * 1024) { toast(fill(W.req.tooBig, { name: file.name }), 'error', 'file'); return; }
        var f = { name: file.name, busy: true, url: '' }; R.files.push(f); render();
        var rd = new FileReader();
        rd.onload = function () {
          ctx.api('/ads/request/file', { method: 'POST', body: { publisher: ctx.publisher.id, name: file.name, type: file.type || '', data: String(rd.result || '') }, label: fill(W.api.file, { name: file.name }) }).then(function (r) {
            if (!S.req || S.req !== R) return;
            if (r.ok && r.json.url) { f.busy = false; f.url = r.json.url; }
            else { R.files.splice(R.files.indexOf(f), 1); toast(fill(W.req.fileFail, { name: file.name, msg: (r.json && r.json.error) || ('HTTP ' + r.status) }), 'error', 'file'); }
            render();
          });
        };
        rd.onerror = function () { R.files.splice(R.files.indexOf(f), 1); toast(fill(W.req.fileFail, { name: file.name, msg: 'the browser could not read it' }), 'error', 'file'); render(); };
        rd.readAsDataURL(file);
      });
    }
    async function sendReq() {
      var R = S.req; if (!R || !reqReady()) return;
      var c = cust(R.cid), picks = reqPicked();
      R.sending = true; R.err = ''; render();
      var r = await ctx.api('/ads/request', { method: 'POST', label: W.api.request,
        body: { publisher: ctx.publisher.id, customer: R.cid, shapes: picks, wantedBy: R.when || '', note: R.note.trim(), files: R.files.filter(function (f) { return f.url; }).map(function (f) { return { name: f.name, url: f.url }; }) } });
      if (!r.ok) { R.sending = false; R.err = fill(W.req.fail, { msg: (r.json && r.json.error) || ('HTTP ' + r.status) }); render(); return; }
      S.req = null; S.flash = {}; picks.forEach(function (sh) { S.flash[R.cid + '|' + sh] = 1; });
      S.tab[R.cid] = 'current';
      await load(); render();
      setTimeout(function () { S.flash = {}; }, 1600);
      toast(fill(W.req.sent, { list: listWords(picks.map(function (sh) { return SHN[sh].toLowerCase(); })), name: c ? c.name : '' }), 'ok', 'req');
      if ((r.json.unconfirmed || []).length) toast(fill(W.unconfirmed, { list: r.json.unconfirmed.join(', ') }), 'unverified', 'requnconf');
    }
    async function withdraw(key) {
      var p = key.split('|'), c = cust(p[0]); if (!c) return;
      var list = reqsOf(c, p[1]), latest = list[list.length - 1]; if (!latest) { S.wd = null; render(); return; }
      S.wd = { key: key, busy: true }; render();
      var r = await ctx.api('/ads/request/' + encodeURIComponent(latest.id) + '/withdraw', { method: 'POST', body: { publisher: ctx.publisher.id }, label: fill(W.api.withdraw, { shape: SHN[p[1]].toLowerCase() }) });
      S.wd = null;
      if (!r.ok) { render(); toast(fill(W.req.wdFail, { msg: (r.json && r.json.error) || ('HTTP ' + r.status) }), 'error', 'wd'); return; }
      await load(); render();
      toast(fill(W.req.withdrawn, { shape: SHN[p[1]].toLowerCase(), name: c.name }), 'ok', 'wd');
    }

    // ── wiring ──
    var handlers = [];
    function on(target, type, fn) { target.addEventListener(type, fn); handlers.push([target, type, fn]); }
    function wire() {
      on(el, 'click', function (e) {
        var t = e.target.closest('button,[data-c],[data-go]'); if (!t || !el.contains(t)) return;
        var d = t.dataset;
        if (d.send) { if (S.send && S.send.id === d.send) { S.send = null; render(); } else openSend(d.send); return; }   // v1.0.4
        if (d.sendcancel) { S.send = null; render(); return; }
        if (d.del) { S.del = { id: d.del, busy: false, err: '' }; S.tb = null; render(); return; }   // v1.0.6
        if (d.delcancel) { S.del = null; render(); return; }
        if (d.tb) { S.tb = { id: d.tb, busy: false, err: '' }; S.del = null; render(); return; }   // v1.0.9
        if (d.tbkeep) { S.tb = null; render(); return; }
        if (d.tbgo) { goTakeBack(); return; }
        if (d.reqdone) { e.stopPropagation(); reqDone(d.reqdone, t); return; }   // v1.0.9
        if (d.sendrow) { var sr = d.sendrow.split('|'); S.open = sr[0]; S.tab[sr[0]] = 'process'; S.scrollTo = sr[0]; openSend(sr[1]); return; }   // v1.0.10
        if (d.delgo) { goDelete(); return; }
        if (d.goneclose) { S.gone = null; render(); return; }
        if (d.sendgo) { goSend(); return; }
        if (d.ix) {   // inbxify side: hand the action to the host (Ad Maker)
          var ix = d.ix.split('|'), c0 = cust(ix[1]); if (!c0 || !O.onAction) return;
          var v0 = ix[3] ? (vOf(c0, ix[2]).find(function (x) { return x.id === ix[3]; }) || null) : null;
          var q0 = ix[4] ? (reqsOf(c0, ix[2]).find(function (x) { return x.id === ix[4]; }) || null) : null;   // v1.0.9
          O.onAction({ kind: ix[0], customer: c0, shape: ix[2], version: v0, request: q0 }); return;
        }
        if (d.reqopen) { openReq(d.reqopen); return; }
        if (d.reqcancel) { closeReq(); return; }
        if (t.id === 'ps-ad-reqsend') { sendReq(); return; }
        if (d.pick && S.req) { if (S.req.picks[d.pick]) delete S.req.picks[d.pick]; else S.req.picks[d.pick] = 1; render(); return; }
        if (d.tickall && S.req) { SH.forEach(function (sh) { S.req.picks[sh] = 1; }); render(); return; }
        if (d.addfile) { var fi = el.querySelector('#ps-ad-reqfile'); if (fi) fi.click(); return; }
        if (d.rmfile !== undefined && S.req) { S.req.files.splice(+d.rmfile, 1); render(); return; }
        if (d.wdask) { S.wd = { key: d.wdask }; render(); return; }
        if (d.wdkeep) { S.wd = null; render(); return; }
        if (d.wdgo) { withdraw(d.wdgo); return; }
        if (d.go) { var g = d.go.split('|'); S.open = g[0]; S.tab[g[0]] = g[1]; S.scrollTo = g[0]; render(); return; }
        if (d.mailclose !== undefined) { S.mail.splice(+d.mailclose, 1); render(); return; }
        if (d.mailcopy !== undefined) { var mm = S.mail[+d.mailcopy], txt = (mm.subject || '') + '\n\n' + (mm.body || ''); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast(W.mail.copied, 'ok', 'copy'); }, function () { toast(W.copyFail.replace('{url}', ''), 'error', 'copy'); }); return; }
        if (d.tab) { var tt = d.tab.split('|'); S.tab[tt[0]] = tt[1]; render(); return; }
        if (d.copy) { var url = d.copy; (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast(W.copied, 'ok', 'copy'); }, function () { toast(fill(W.copyFail, { url: url }), 'error', 'copy'); }); return; }
        if (d.act) { var a = d.act.split('|'), act = a[0], id = a[1], f0 = findV(id); if (!f0) return;
          if (act === 'current' || act === 'make') Object.keys(S.staged).forEach(function (k) { var x = findV(k); if (x && x.c.id === f0.c.id && x.sh === f0.sh && (S.staged[k].act === 'current' || S.staged[k].act === 'make')) delete S.staged[k]; });
          S.staged[id] = { act: act, note: '' }; render();
          if (act === 'back') requestAnimationFrame(function () { var n = document.getElementById('note-' + id); if (n) n.focus(); });
          return; }
        if (d.unstage) { delete S.staged[d.unstage]; render(); return; }
        if (t.id === 'ps-ad-saveall') { save(); return; }
        if (t.id === 'ps-ad-cancelall') { S.staged = {}; render(); return; }
        if (d.c && !e.target.closest('.ps-ad-ex')) { S.open = S.open === d.c ? null : d.c; render(); return; }
      });
      on(el, 'change', function (e) { if (e.target.id === 'ps-ad-reqfile') { addFiles(e.target.files); e.target.value = ''; } });
      on(document, 'keydown', function (e) { if (e.key === 'Escape' && S.req && !S.req.sending) closeReq(); });
      on(el, 'keydown', function (e) {
        var t = e.target;
        if ((e.key === 'Enter' || e.key === ' ') && t.dataset && (t.dataset.c || t.dataset.go) && (t.classList.contains('r') || t.classList.contains('ps-ad-brow'))) { e.preventDefault(); t.click(); }
      });
      on(el, 'change', function (e) { var t = e.target; if (t.dataset && t.dataset.sendto && S.send) { S.send.to = t.dataset.sendto; } });   // v1.0.4
      on(el, 'input', function (e) {
        var t = e.target;
        if (t.dataset && t.dataset.sendf && S.send) { S.send[t.dataset.sendf] = t.value; S.send.err = ''; t.classList.toggle('chg', t.value !== S.send.std[t.dataset.sendf]); return; }
        if (t.id === 'ps-ad-reqnote' && S.req) { S.req.note = t.value; S.req.err = ''; reqFoot(); return; }
        if (t.id === 'ps-ad-reqwhen' && S.req) { S.req.when = t.value; reqFoot(); return; }
        if (t.id === 'ps-ad-q') { S.q = t.value; var lst = el.querySelector('#ps-ad-list'); if (lst) lst.innerHTML = listRows(); return; }
        if (t.dataset && t.dataset.note) { var g = S.staged[t.dataset.note]; if (!g) return; g.note = t.value; t.classList.toggle('chg', !!t.value);
          var need = t.parentNode.querySelector('.ps-ad-need'); if (need && t.value) need.remove(); else if (!need && !t.value) t.insertAdjacentHTML('afterend', '<div class="ps-ad-need">' + esc(W.noteNeed) + '</div>');
          var sw = el.querySelector('#ps-ad-savewrap'); if (sw) sw.innerHTML = renderSave(); }
      });
    }

    // ── mount ──
    var deep = O.deepCustomer || '';
    S = { customers: [], loaded: false, loadErr: '', q: '', open: null, view: {}, staged: {}, saving: null, mail: [], tab: {}, linkDays: 14, staleMonths: 6,
          req: null, wd: null, tb: null, took: {}, flash: {}, deep: /^[0-9a-f]{24}$/.test(deep) ? deep : null };
    wire(); render();
    load().then(render);
    return {
      refresh: function () { return load().then(render); },
      state: function () { return S; },
      rerender: function () { if (S.loaded) render(); },   // v1.0.11
      findRequest: function (id) {   // v1.0.9
        for (var i = 0; i < S.customers.length; i++) { var c = S.customers[i];
          for (var j = 0; j < SH.length; j++) { var q = reqsOf(c, SH[j]).find(function (x) { return x.id === id; }); if (q) return { customer: c, shape: SH[j], request: q }; } }
        return null;
      },
      open: function (cid, tab) { S.open = cid; if (tab) S.tab[cid] = tab; S.scrollTo = cid; render(); },
      destroy: function () { handlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2]); }); handlers = []; el.innerHTML = ''; }
    };
  }

  window.IxAdsBoard = { VERSION: VERSION, FILE: FILE, mount: create, SHAPES: SH.slice(), words: W };
})();
