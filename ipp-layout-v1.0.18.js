/* ipp-layout-v1.0.18.js */
/* ============================================================
   ipp-layout-v1.0.18.js — Layout view for the IPP
   Companion stylesheet: ipp-layout-v1.0.10.css (unchanged)

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
  var VERSION = '1.0.18', FILE = 'ipp-layout-v1.0.18.js';
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
  var REMOVE = {};         // v1.0.5: id -> 1, the weather block waiting to be deleted on Save

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
    if (!w) return { tone: 'wait', text: 'Weather: the forecast state is not known yet (needs Data Worker v1.0.42).' };
    switch (w.state) {
      case 'ready':    return { tone: 'ok', text: 'Forecast ready from ' + wxDay(w.date) + '. It is fetched again at Compile.' };
      case 'too-far':  return { tone: 'bad', text: 'Too far ahead. The forecast for ' + wxDay(w.date) + ' opens ' + wxDay(w.availableOn) + '. Compile leaves the strip out until then.' };
      case 'past':     return { tone: 'bad', text: 'The publish date (' + wxDay(w.date) + ') has passed. Compile is blocked while this block is in.' };
      case 'no-date':  return { tone: 'bad', text: 'This issue has no publish date, so there is no forecast to fetch.' };
      case 'no-place': return { tone: 'bad', text: 'The title has no weather location (TITLES-ADMIN weather-lat and weather-lon).' };
      case 'off':      return { tone: 'wait', text: 'Weather is off for this issue.' };
      default:         return { tone: 'bad', text: 'The forecast could not be checked' + (w.error ? ': ' + w.error : '') + '.' };
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
  function isArticle(s) { return s && s.assetType === 'article'; }
  // v1.0.8 — the catalog entry a block belongs to (IX_CONFIG.catalog via /plan-board)
  function catEntry(s) {
    var cat = (BOARD && BOARD.catalog) || [], l = String((s && (s.blockType || s.blockLabel)) || '');
    for (var i = 0; i < cat.length; i++) if ((cat[i].labels || []).indexOf(l) >= 0) return cat[i];
    return null;
  }
  function isList(s) { return !!s && (s.listCount != null || !!s.list); }
  function isBanner(s) { return !!s && s.assetType === AD; }
  // The title line names the block, never its kind (ruled 12 Oct).
  function rowTitle(s) {
    if (isGreeting(s)) return (s.greeting && s.greeting.title.trim()) || 'No greeting yet';
    if (isBanner(s)) return (s.asset && (s.asset.customer || s.asset.name)) || 'No ad yet';
    if (isArticle(s)) return (s.asset && s.asset.name) || 'No article yet';
    if (isList(s)) return (s.section && s.section.name) || ((catEntry(s) || {}).name) || s.blockType || 'List';
    var e = catEntry(s);
    return (e && e.name) || (s.section && s.section.name) || s.blockType || 'Block';
  }
  function rowTitleEmpty(s) {
    return (isGreeting(s) && !(s.greeting && s.greeting.title.trim())) || (isBanner(s) && !s.asset) || (isArticle(s) && !s.asset);
  }
  function rowSub(s) {
    if (REMOVE[s.id]) return 'Will be removed when you Save.';
    if (isWeather(s)) return wxSay().text;
    if (isBanner(s)) return (s.asset && s.asset.customer && s.asset.name) ? s.asset.name : '';
    if (isList(s)) return plural(Number(s.listCount) || 0, ['item', 'items']);   // v1.0.9
    if (isArticle(s)) {
      if (!s.asset) return CUR.type[s.id] ? '' : 'No type yet';
      var by = [s.asset.writer, s.asset.customer].filter(Boolean).join(' \u00b7 ');
      return by || 'No business';
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
    return String(s.asset.type || s.asset.sectionType || '').toUpperCase();
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
      if (typeClash(id)) {                                                    // v1.0.17
        var at = artType(s);
        out.push({ id: id, pos: i + 1, text: '\u201c' + (rowTitle(s) || 'This article') + '\u201d is a ' + at + ' article in ' + aOrAn(t) + ' block. Move it to a ' + at + ' block on the Picker.' });
        return;
      }
      if (f.ok) return;
      var line = f.why === 'no-type' ? (isArticle(s) ? 'article has no type yet. Pick one.' : 'block has no type.')
               : f.why === 'no-design' ? (choices(t).length ? 'pick a ' + t + ' design.' : 'no design is made for ' + t + ' blocks for this title.')
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
  function changed(id) { return !!REMOVE[id] || typeChanged(id) || designChanged(id) || moved(id); }
  function changedIds() { return CUR ? CUR.order.filter(changed) : []; }
  function orderChanged() { return CUR && ORIG && CUR.order.join() !== ORIG.order.join(); }

  // ── from the board ────────────────────────────────────────
  function snapshot(b) {
    var slots = ((b && b.slots) || []).slice().sort(function (x, y) { return (Number(x.position) || 0) - (Number(y.position) || 0); });
    var o = { order: [], type: {}, design: {}, pos: {} };
    ROWS = {};
    slots.forEach(function (s) {
      ROWS[s.id] = s; o.order.push(s.id);
      o.type[s.id] = s.blockType || ''; o.design[s.id] = s.design || ''; o.pos[s.id] = Number(s.position) || 0;
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
      var ids = pendCur.order.filter(function (id) { return own(ROWS, id); });
      ORIG.order.forEach(function (id, i) { if (ids.indexOf(id) < 0) ids.splice(Math.min(i, ids.length), 0, id); });
      CUR = { order: ids, type: {}, design: {} };
      ids.forEach(function (id) {
        CUR.type[id] = own(pendCur.type, id) ? pendCur.type[id] : ORIG.type[id];
        CUR.design[id] = own(pendCur.design, id) ? pendCur.design[id] : ORIG.design[id];
      });
    } else {
      CUR = { order: ORIG.order.slice(), type: Object.assign({}, ORIG.type), design: Object.assign({}, ORIG.design) };
    }
    Object.keys(REMOVE).forEach(function (id) { if (!own(ROWS, id) || LOCKED) delete REMOVE[id]; });   // v1.0.5
    if (SEL && !own(ROWS, SEL)) SEL = '';
    paint();
    if (BOARD && BOARD.plan && PV_AUTO !== BOARD.plan.id && !SAVING) { PV_AUTO = BOARD.plan.id; runPreview(); }   // v1.0.12: once per plan
    if (!SAVING && BOARD && BOARD.plan && (Array.isArray(BOARD.editions) || EDS.planId !== BOARD.plan.id || EDS.state === 'idle')) loadEditions(false);   // v1.0.7: every plan read carries editions
  }

  // ── edits ─────────────────────────────────────────────────
  function canMoveTo(id, to) {
    if (pinned(id)) return false;
    var o = CUR.order.filter(function (x) { return x !== id; });
    return to >= 0 && to <= o.length;                       // v1.0.6: any place
  }
  function moveTo(id, to) {
    if (LOCKED || SAVING || !canMoveTo(id, to)) return false;
    var o = CUR.order.filter(function (x) { return x !== id; });
    o.splice(to, 0, id); CUR.order = o; TOUCHED[id] = 1; delete FAILS[id]; NOTE = '';
    paint(); return true;
  }
  function setType(id, label) {
    if (LOCKED || SAVING) return;
    CUR.type[id] = label;
    if (label === ORIG.type[id]) CUR.design[id] = ORIG.design[id];
    else { var c = choices(label); CUR.design[id] = c.length === 1 ? c[0].id : ''; }
    delete FAILS[id]; NOTE = ''; paint();
  }
  function setDesign(id, did) { if (LOCKED || SAVING) return; CUR.design[id] = did; delete FAILS[id]; NOTE = ''; paint(); }
  // v1.0.5 — the weather block waits for Save, back in its saved place
  function removeRow(id) {
    if (LOCKED || SAVING || !isWeather(ROWS[id])) return;
    cancelRow(id); REMOVE[id] = 1; NOTE = ''; paint();
  }
  function cancelRow(id) {
    delete REMOVE[id];
    var o = CUR.order.filter(function (x) { return x !== id; });
    o.splice(Math.min(ORIG.order.indexOf(id), o.length), 0, id);
    CUR.order = o; CUR.type[id] = ORIG.type[id]; CUR.design[id] = ORIG.design[id]; delete FAILS[id]; delete TOUCHED[id];
    paint();
  }
  function cancelAll() {
    if (SAVING) return;
    CUR = { order: ORIG.order.slice(), type: Object.assign({}, ORIG.type), design: Object.assign({}, ORIG.design) };
    FAILS = {}; TOUCHED = {}; REMOVE = {}; NOTE = ''; paint();
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
  function sharedRow(r) { return r && r.assetType !== AD && !!r.slotKey; }
  function editionPlan() {
    // what Save does to the other editions of this issue
    var out = { ops: { reorder: [], layout: [], fill: [] }, open: [], locked: [], missing: [] };
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
      });
      var changedShared = changedIds().filter(function (id) { return sharedRow(ROWS[id]) && !REMOVE[id]; });   // v1.0.5: removal is this edition only
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

  // ── save ──────────────────────────────────────────────────
  function save() {
    if (SAVING || LOCKED || !CUR) return;
    var all = changedIds(); if (!all.length) return;
    var dels = Object.keys(REMOVE).filter(function (id) { return own(ROWS, id); }).map(function (id) { return { op: { id: id }, of: id }; });   // v1.0.5
    var ids = all.filter(function (id) { return !REMOVE[id]; });
    if (EDS.state === 'loading') { toast('One moment', 'info', 'Still reading the other editions of this issue.'); return; }
    if (!blockWriter()) { toast('Can\u2019t save', 'err', 'This page has no PP_WEBHOOKS.blockWriter address (Scenario 124). Nothing was sent.'); return; }
    var need = ids.filter(function (id) { return typeChanged(id) && !CUR.design[id]; });
    if (need.length) {
      need.forEach(function (id) { FAILS[id] = 'pick a design for the new type first'; });
      paint(); toast('Pick a design first', 'err', plural(need.length, ['block has', 'blocks have']) + ' a new type and no design yet. Nothing was sent.'); return;
    }
    if (ids.some(function (id) { return typeChanged(id) && !typeHash(CUR.type[id]); })) { toast('Can\u2019t save', 'err', 'The plan data has no option id for a chosen type (IX_CONFIG.blockTypes). Nothing was sent.'); return; }
    if (ids.some(function (id) { return designChanged(id); }) && !designField()) { toast('Can\u2019t save', 'err', 'The plan data does not name the design field (blockFields.design, Data Worker v1.0.34+). Nothing was sent.'); return; }

    // this plan
    var newPos = orderChanged() ? newPositions(CUR.order, ORIG.pos, looseFrom(), TOUCHED) : {};
    Object.keys(REMOVE).forEach(function (id) { delete newPos[id]; });                     // v1.0.5
    var reorder = [], layout = [], fill = [];
    Object.keys(newPos).forEach(function (id) { if (newPos[id] !== ORIG.pos[id]) reorder.push({ op: { id: id, position: newPos[id] }, of: id }); });
    ids.forEach(function (id) {
      var s = ROWS[id];
      if (typeChanged(id)) layout.push({ op: { id: id, blockTypeJson: JSON.stringify(typeHash(CUR.type[id])), endGroup: !!s.endGroup, blockTextJson: JSON.stringify(s.blockText || '') }, of: id, want: typeHash(CUR.type[id]) });
      if (designChanged(id) || (typeChanged(id) && CUR.design[id] !== ORIG.design[id])) fill.push({ op: { id: id, assetField: designField(), assetId: CUR.design[id] }, of: id, want: CUR.design[id] });
    });
    // the other editions
    var ed = editionPlan();
    reorder = reorder.concat(ed.ops.reorder); layout = layout.concat(ed.ops.layout); fill = fill.concat(ed.ops.fill);

    SAVING = true; FAILS = {}; NOTE = ''; paint();
    var bad = [];
    var note = function (rs) { rs.forEach(function (r) { if (r.why) { bad.push(r); if (!r.item.ed) FAILS[r.item.of] = r.why; } }); };
    stage('reorder', reorder, function (it, fd) { return Number(fd.position) === Number(it.op.position) ? '' : 'did not store the position'; })
      .then(function (rs) { note(rs); return stage('layout', layout, function (it, fd) { return String(fd['block-type'] || '') === String(it.want) ? '' : 'did not store the type'; }); })
      .then(function (rs) { note(rs); return stage('fill', fill, function (it, fd) { return String(fd.asset || '') === String(it.want) ? '' : 'did not store the design'; }); })
      .then(function (rs) { note(rs); return deleteStage(dels); })                          // v1.0.5
      .then(function (rs) {
        note(rs);
        var want = { order: CUR.order.slice(), type: Object.assign({}, CUR.type), design: Object.assign({}, CUR.design) };
        return IPP.board.load({ fresh: true }).then(function () { return loadEditions(true); }, function () {}).then(function () { return want; });
      })
      .then(function (want) {
        SAVING = false;
        // TOAST-TRUTH: what the fresh read shows decides
        var lost = [];
        if (CUR && ORIG) {
          want.order.forEach(function (id) {
            if (!own(ROWS, id)) return;
            var t = (want.type[id] || '') === (ORIG.type[id] || ''), d = (want.design[id] || '') === (ORIG.design[id] || '');
            if (!t) { CUR.type[id] = want.type[id]; FAILS[id] = FAILS[id] || 'the fresh read shows the old type'; lost.push(id); }
            if (!d) { CUR.design[id] = want.design[id]; FAILS[id] = FAILS[id] || 'the fresh read shows the old design'; lost.push(id); }
          });
          var readOrder = ORIG.order.join(), wantOrder = want.order.filter(function (id) { return own(ROWS, id); });
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
        if (!Object.keys(FAILS).length && !edBad.length) {
          TOUCHED = {};
          var also = ed.open.length ? ' Also applied to ' + ed.open.join(', ') + '.' : '';
          if (dels.length) also += ' Weather block removed' + (editions().length ? ' from this edition only.' : '.');
          LAST_SAVE = Date.now();                                                      // v1.0.12: the preview is now behind
          NOTE = 'Saved.' + also + (ed.locked.length ? ' ' + ed.locked.join(', ') + (ed.locked.length === 1 ? ' is' : ' are') + ' locked and was not changed.' : '') +
                 (ed.missing.length ? ' Not in the other edition: ' + ed.missing.join('; ') + '.' : '');
          toast('Layout saved', 'ok', also.trim() || undefined);
        } else {
          NOTE = 'Not everything saved. Gold blocks still wait.' + (edBad.length ? ' ' + plural(edBad.length, ['change', 'changes']) + ' to other editions did not land: ' + edBad.map(function (r) { return r.item.ed + ' (' + r.why + ')'; }).join('; ') + '.' : '');
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
             'Set the design on the tile itself; only the designs made for the block\u2019s type are offered. The type is decided on the Picker; a block with no type yet may be typed here once. Click a tile to open it and check its content: dates, venue, pictures, links. Click it again, press Esc or click empty space to close it.\n\n' +
             'Changes wait with a gold border until you Save. Save also applies the order, types and designs of articles ' +
             'and sections to the other open editions of this issue. Banner spots belong to each edition.\n\n' +
             'The Weather block shows whether the forecast can be fetched for the publish date. Remove weather block takes the strip out of this edition.',
      scenarios: [{ name: '124 \u00b7 PubPlan Block Writer', note: 'reorder (positions), layout (block type), fill (design), delete (weather block)' }],
      companions: 'ipp-layout-v1.0.10.css \u00b7 ix-issue-data v1.0.47 /plan-board and /preview \u00b7 newsletter-render v1.19.0 (block markers)'
    });
  }
  var GRIP = '<svg width="9" height="12" viewBox="0 0 14 18" fill="currentColor" aria-hidden="true"><circle cx="4" cy="3" r="1.7"/><circle cx="10" cy="3" r="1.7"/><circle cx="4" cy="9" r="1.7"/><circle cx="10" cy="9" r="1.7"/><circle cx="4" cy="15" r="1.7"/><circle cx="10" cy="15" r="1.7"/></svg>';
  var LOCK = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  function artHtml(url, cls, alt) {
    return url ? '<img class="' + cls + '" src="' + esc(url) + '" alt="' + esc(alt) + '" loading="lazy">' : '<span class="' + cls + ' is-empty"></span>';
  }
  // v1.0.10 — the dropdowns on the tile (standing rule: a changed one stays gold until Save or Cancel)
  function typeCtl(id, s, off) {
    var t = CUR.type[id], types = articleTypes();
    var clash = typeClash(id), at = artType(s);                                // v1.0.17
    var cls = 'ipp-ly-type' + (t && !clash ? '' : ' is-none') + (clash ? ' is-bad' : '') + (typeChanged(id) ? ' is-changed' : '');
    if (at && types.indexOf(at) >= 0) types = [at];                            // v1.0.17: the stopgap offers only the article's type
    // v1.0.16 stopgap: only an article block with no SAVED type may be typed, once
    if (!isArticle(s) || ORIG.type[id] || !types.length) return '<span class="' + cls + '"' + (clash ? ' title="This is a ' + esc(at) + ' article in a ' + esc(t) + ' block."' : '') + '>' + esc(t || '?') + '</span>';
    var opts = (t ? '' : '<option value="" selected>?</option>') + types.map(function (l) {
      return '<option value="' + esc(l) + '"' + (t === l ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('');
    return '<select class="' + cls + ' ipp-ly-tsel" data-ly-tsel="' + id + '" aria-label="Type (this block has none yet)"' + off + '>' + opts + '</select>';
  }
  function designCtl(id, s, off) {
    var t = CUR.type[id], cur = CUR.design[id], f = fitOf(id);
    var cls = 'ipp-ly-dsel' + (f.ok ? '' : ' is-bad') + (designChanged(id) ? ' is-changed' : '');
    if (!t) return '<span class="ipp-ly-dtx is-bad">Pick a type</span>';
    var list = choices(t);
    if (!list.length) return '<span class="ipp-ly-dtx is-bad" title="No live design is made for ' + esc(t) + ' blocks for this title.">No ' + esc(t) + ' design</span>';
    var opts = '';
    if (!cur) opts += '<option value="" selected>Pick a design</option>';
    else if (!f.ok) opts += '<option value="' + esc(cur) + '" selected>' + esc(designName(cur, s)) + ' (not ' + esc(t) + ')</option>';
    opts += list.map(function (dz) { return '<option value="' + dz.id + '"' + (cur === dz.id ? ' selected' : '') + '>' + esc(dz.name) + '</option>'; }).join('');
    return '<select class="' + cls + '" data-ly-dsel="' + id + '" aria-label="Design" title="' + esc(cur ? designName(cur, s) : 'No design') + '"' + off + '>' + opts + '</select>';
  }
  function rowHtml(id, i) {
    var s = ROWS[id], ch = changed(id), pin = pinned(id) || LOCKED, open = SEL === id;
    var wx = isWeather(s) ? wxSay() : null, ban = isBanner(s), off = LOCKED || SAVING ? ' disabled' : '';
    var cls = 'ipp-ly-tile' + (ban ? ' is-banner' : '') + (ch ? ' ipp-dirty' : '') + (open ? ' is-open' : '') + (FAILS[id] ? ' is-failed' : '') +
      (wx && !REMOVE[id] ? ' is-wx-' + wx.tone : '') + (REMOVE[id] ? ' is-removing' : '');
    var handle = pin
      ? '<span class="ipp-ly-h ipp-ly-lock">' + LOCK + '</span>'
      : '<button type="button" class="ipp-ly-h" data-ly-handle="' + id + '" aria-label="Move ' + esc(rowTitle(s)) + ' (drag, or Arrow Up and Arrow Down)">' + GRIP + '</button>';
    var sub = FAILS[id] ? 'Not saved: ' + FAILS[id] : rowSub(s);
    var ec = isArticle(s) && s.asset && s.asset.ec;
    var fr = isArticle(s) && s.section && s.section.name ? s.section.name : '';
    var inside = (isArticle(s) && s.inside) || [];
    var strip = inside.length
      ? '<span class="ipp-ly-strip"><span class="ipp-ly-sa">' + artHtml(inside[0].thumb, 'ipp-ly-img is-ban', inside[0].customer || '') + '</span>' +
        '<span class="ipp-ly-st' + (inside[0].kind === 'paid' && !inside[0].prints ? ' is-bad' : '') + '">' +
        esc(inside.map(insideText).join('  \u00b7  ')) + '</span></span>'
      : '';
    var right = wx
      ? (!REMOVE[id] && !LOCKED && !SAVING ? '<button type="button" class="ipp-ly-rm" data-ly-rm="' + id + '">Remove weather block</button>' : '')
      : designCtl(id, s, off);
    var h = '<div class="' + cls + '" data-ly-row="' + id + '" role="listitem">' +
      '<div class="ipp-ly-tr">' + handle +
      '<span class="ipp-ly-pos" title="Saved position ' + esc(posText(ORIG.pos[id])) + '">' + (i + 1) + '</span>' +
      '<span class="ipp-ly-tc">' + typeCtl(id, s, off) + '</span>' +
      '<button type="button" class="ipp-ly-main" data-ly-sel="' + id + '" aria-expanded="' + open + '">' +
        '<span class="ipp-ly-grid1">' +
          '<span class="ipp-ly-art' + (iconKey(s) ? ' is-icon is-k-' + iconKey(s) : '') + '">' + (iconOf(s) || artHtml(artUrl(s), 'ipp-ly-img' + (ban ? ' is-ban' : ''), rowTitle(s))) + '</span>' +
          '<span class="ipp-ly-tx">' +
            '<span class="ipp-ly-t' + (ban ? ' is-cust' : '') + (rowTitleEmpty(s) ? ' is-empty' : '') + '">' + esc(rowTitle(s)) + '</span>' +
            '<span class="ipp-ly-l2">' +
              '<span class="ipp-ly-ecs">' + (ec ? '<span class="ipp-ly-ec" title="Expert Contributor">EC</span>' : '') + '</span>' +
              '<span class="ipp-ly-s" title="' + esc(sub) + '">' + esc(sub) + '</span>' +
              '<span class="ipp-ly-fr">' + (fr ? '<span class="ipp-ly-frdot"></span><span class="ipp-ly-frn">' + esc(fr) + '</span>' : '') + '</span>' +
            '</span>' +
          '</span>' +
        '</span>' + strip +
      '</button>' +
      '<span class="ipp-ly-rc">' + right +
        (ch && !SAVING ? '<button type="button" class="ipp-ly-cx" data-ly-cancel="' + id + '">Cancel</button>' : '') +
      '</span>' +
      '</div>';
    if (open) h += openHtml(id);
    return h + '</div>';
  }

  // v1.0.10 — the opened tile is for checking the content (HC-P-LT-5)
  function miss(what) { return '<span class="ipp-ly-miss">No ' + esc(what) + '</span>'; }
  function val(v, what) { return v ? esc(v) : miss(what); }
  function pic(url, cls) { return url ? '<img class="' + cls + '" src="' + esc(url) + '" alt="" loading="lazy">' : '<span class="' + cls + ' is-missing">No picture</span>'; }
  function line(k, v) { return '<span class="ipp-ly-rk">' + esc(k) + '</span><span class="ipp-ly-rv">' + v + '</span>'; }
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
  function openHtml(id) {
    var s = ROWS[id], a = s.asset || null, h = '<div class="ipp-ly-open">';
    if (isWeather(s)) {
      var w = wxSay();
      h += '<p class="ipp-ly-wx is-' + (REMOVE[id] ? 'wait' : w.tone) + '">' + esc(REMOVE[id] ? 'This block will be removed when you Save. The email will have no weather strip.' : w.text) + '</p>';
    } else if (isList(s)) {
      var items = s.items || [];
      if (!items.length) h += '<p class="ipp-ly-msg">' + (Number(s.listCount) ? plural(Number(s.listCount), ['item', 'items']) + ' chosen; this Data Worker does not list them.' : 'Nothing is chosen yet. Choose items on the Picker.') + '</p>';
      items.forEach(function (it) {
        if (it.missing) h += '<p class="ipp-ly-msg is-bad">An item in this block was not found (' + esc(it.id) + ').</p>';
        else h += s.assetType === 'event' ? evHtml(it) : s.assetType === 're' ? reHtml(it)
          : '<div class="ipp-ly-card2">' + pic(it.thumb, 'ipp-ly-rp') + '<div class="ipp-ly-rg"><span class="ipp-ly-rn">' + esc(it.name || 'No name') + '</span></div></div>';
      });
    } else if (isBanner(s)) {
      h += a ? '<div class="ipp-ly-banbig">' + pic(a.thumb, 'ipp-ly-bp') + '</div><div class="ipp-ly-rg">' +
          line('Ad', esc(a.name || '')) + (has(a, 'hasLink') ? line('Link', a.hasLink ? 'Yes' : miss('link')) : '') + '</div>'
        : '<p class="ipp-ly-msg">No ad is placed here yet. Place one on Revenue.</p>';
    } else if (isArticle(s)) {
      h += a ? '<div class="ipp-ly-card2">' + pic(a.ogSrc || a.thumb, 'ipp-ly-rp') + '<div class="ipp-ly-rg">' +
          '<span class="ipp-ly-rn">' + esc(a.name || '') + '</span>' +
          line('By', [a.writer, a.customer].filter(Boolean).map(esc).join(' \u00b7 ') || miss('byline')) +
          (has(a, 'dek') ? line('Summary', a.dek ? esc(a.dek) : miss('summary')) : '') +
          (has(a, 'type') ? line('Type', artType(s) ? (typeClash(id) ? '<span class="ipp-ly-miss">' + esc(artType(s)) + ', but this is ' + aOrAn(CUR.type[id]) + ' block</span>' : esc(artType(s)))
            : 'Not set yet. The Picker decides.') : '') + '</div></div>'
        : '<p class="ipp-ly-msg">No article is placed here yet. Place one on the Picker.</p>';
    } else if (isGreeting(s)) {
      var g = s.greeting || {}, words = String(g.paragraph || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
      var para = words.slice(0, 24).join(' ') + (words.length > 24 ? '\u2026' : '');
      h += '<div class="ipp-ly-rg">' + line('Title', val(g.title && g.title.trim(), 'title')) + line('Opening', para ? esc(para) : miss('paragraph')) + '</div>';
    } else {
      h += '<p class="ipp-ly-msg">Nothing to check in this block.</p>';
    }
    return h + '</div>';
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
  function checkHtml(pr) {
    var hu = headsUp();
    var notes = hu.length ? '<div class="ipp-ly-k ipp-ly-k--hu">Heads up</div><ul class="ipp-ly-hu">' +
      hu.map(function (p) { return '<li><button type="button" data-ly-sel="' + p.id + '"><b>Pos ' + p.pos + '</b> \u00b7 ' + esc(p.text) + '</button></li>'; }).join('') + '</ul>' : '';
    if (!pr.length) return hu.length ? '<div class="ipp-ly-card ipp-ly-check is-note">' + notes.replace('ipp-ly-k ipp-ly-k--hu', 'ipp-ly-k') + '</div>' : '';   // v1.0.14
    return '<div class="ipp-ly-card ipp-ly-check"><div class="ipp-ly-k">Before Publish \u00b7 ' + plural(pr.length, ['block', 'blocks']) + ' to fix</div><ul>' +
      pr.map(function (p) { return '<li><button type="button" data-ly-sel="' + p.id + '"><b>Pos ' + p.pos + '</b> \u00b7 ' + esc(p.text) + '</button></li>'; }).join('') + '</ul>' + notes + '</div>';
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
    var s = Math.min(1, (z.parentNode.clientWidth - 2) / w);
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
    Array.prototype.forEach.call(c.querySelectorAll('.ipp-ly-pvs'), function (el) { PV_RO.observe(el); });
  }

  function paint() {
    var c = canvas(); if (!c) return;
    if (!c.querySelector('.ipp-ly')) {
      c.innerHTML = '<div class="ipp-ly"><div class="ipp-ly-head"><h2 class="ipp-ly-h2">Layout</h2><span class="ipp-ly-hint"></span><span class="ipp-ly-info"></span></div>' +
        '<div class="ipp-ly-msgline" hidden></div><div class="ipp-ly-body"><div class="ipp-ly-stack" role="list"></div><div class="ipp-ly-side"></div></div></div>';
      wire(c);
    }
    var root = c.querySelector('.ipp-ly');
    root.querySelector('.ipp-ly-info').innerHTML = info();
    root.querySelector('.ipp-ly-hint').textContent = LOCKED ? 'This plan is locked. Unlock it in Pub Plans to change its layout.' : 'Top of the email first. Drag a tile by its handle. Click a tile to check its content.';
    var msg = root.querySelector('.ipp-ly-msgline');
    var text = ERR ? 'The plan could not be read: ' + ERR : NOTE;
    msg.hidden = !text; msg.textContent = text; msg.classList.toggle('is-bad', !!ERR || /^Not /.test(NOTE));
    var stack = root.querySelector('.ipp-ly-stack'), keep = stack.scrollTop;
    var side = root.querySelector('.ipp-ly-side'), fresh = false;                          // v1.0.12: Before Publish + Preview
    if (!side.querySelector('.ipp-ly-chk')) { side.innerHTML = '<div class="ipp-ly-chk"></div><div class="ipp-ly-card ipp-ly-pv"></div>'; fresh = true; }
    if (!CUR) { stack.innerHTML = '<p class="ipp-ly-wait">' + (ERR ? '' : 'Reading the plan\u2026') + '</p>'; side.querySelector('.ipp-ly-chk').innerHTML = ''; paintSavebar(); return; }
    stack.innerHTML = CUR.order.map(rowHtml).join('') || '<p class="ipp-ly-wait">This plan has no blocks yet. Add them on the Picker.</p>';
    stack.scrollTop = keep;
    var pr = problems();
    side.querySelector('.ipp-ly-chk').innerHTML = checkHtml(pr);
    paintPreview(fresh); if (fresh) watchPanes(c);
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
    c.addEventListener('keydown', function (e) {
      var h = e.target.closest && e.target.closest('[data-ly-handle]'); if (!h) return;
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      var id = h.getAttribute('data-ly-handle'), i = CUR.order.indexOf(id);
      if (moveTo(id, i + (e.key === 'ArrowUp' ? -1 : 1))) {
        var nh = c.querySelector('[data-ly-handle="' + id + '"]'); if (nh) nh.focus({ preventScroll: true });
      }
    });
    c.addEventListener('pointerdown', function (e) {
      var h = e.target.closest && e.target.closest('[data-ly-handle]'); if (!h || LOCKED || SAVING || e.button !== 0) return;
      var id = h.getAttribute('data-ly-handle'), row = h.closest('.ipp-ly-tile'), stack = c.querySelector('.ipp-ly-stack');
      e.preventDefault();
      var line = document.createElement('div'); line.className = 'ipp-ly-drop'; stack.appendChild(line);
      row.classList.add('is-dragging');
      DRAG = { id: id, to: -1, line: line, stack: stack, row: row };
      try { h.setPointerCapture(e.pointerId); } catch (x) {}
      dragMove(e);
    });
    c.addEventListener('pointermove', function (e) { if (DRAG) dragMove(e); });
    c.addEventListener('pointerup', function () { if (DRAG) dragEnd(true); });
    c.addEventListener('pointercancel', function () { if (DRAG) dragEnd(false); });
  }
  function dragMove(e) {
    var d = DRAG, rows = Array.prototype.slice.call(d.stack.querySelectorAll('.ipp-ly-tile')).filter(function (r) { return r !== d.row; });
    var to = rows.length;
    for (var i = 0; i < rows.length; i++) { var rc = rows[i].getBoundingClientRect(); if (e.clientY < rc.top + rc.height / 2) { to = i; break; } }
    // auto-scroll near the edges
    var sr = d.stack.getBoundingClientRect();
    if (e.clientY < sr.top + 30) d.stack.scrollTop -= 12; else if (e.clientY > sr.bottom - 30) d.stack.scrollTop += 12;
    var ok = canMoveTo(d.id, to);
    d.to = ok ? to : -1;
    if (!ok) { d.line.style.display = 'none'; return; }
    var ref = rows[to] || rows[rows.length - 1], rr = ref.getBoundingClientRect(), y = (rows[to] ? rr.top - 4 : rr.bottom + 2) - sr.top + d.stack.scrollTop;
    d.line.style.display = ''; d.line.style.top = y + 'px';
  }
  function dragEnd(drop) {
    var d = DRAG; DRAG = null;
    if (d.line.parentNode) d.line.parentNode.removeChild(d.line);
    d.row.classList.remove('is-dragging');
    if (drop && d.to >= 0) moveTo(d.id, d.to);
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
    _positions: newPositions };
})();
