/* ipp-publish-v2.7.js */
/* ============================================================
   ipp-publish-v2.7.js — Publish view for the IPP · PUBLISH THIS ISSUE
   Companion stylesheet: ipp-publish-v2.4.css (replaces v2.3)

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

  var VERSION = '2.7';
  var DEFAULT_SEND_TIME = '08:00'; // HC-P-S7-17
  var FILE = 'ipp-publish-v2.7.js';
  var MOUNTED = 'data-publish-mounted';
  var TIMEOUT_MS = 150000;
  var CLOCK_SLACK_MS = 300000;

  var STAGE = {
    data:    'Stopped while reading the issue\u2019s data',
    render:  'Stopped while building the email and web page',
    save:    'Stopped while saving the issue',
    publish: 'Saved, but not published'
  };

  var state = { result: null, running: false, last: null, emailUrl: '', checking: false, stopped: false, lastCheck: null, compiledOk: false, tab: null, links: null };

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
  var LABEL = { subject: 'Subject line', preview: 'Preview text', volume: 'Number of sends', sectors: 'Sectors',
                sendAt: 'Send date and time', zips: 'Zip codes' };
  var MAXLEN = { subject: 60, preview: 100, volume: 9 };          // HC-P-PUB7-1
  var SECTORS_FALLBACK = 'Ages 20-80';                             // HC-P-PUB20-1, used only when the title has no default
  var TIMES = []; for (var h = 0; h < 24; h++) for (var m = 0; m < 60; m += 15) TIMES.push(pad(h) + ':' + pad(m));
  var EM = { draft: {}, seeded: {}, saving: false, fails: {}, note: '' };

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
  function fieldMissing(k) { var p = pubBoard(); return !!(p && p.types && p.types[k] === null); }
  function titleInfo() { var p = pubBoard(); return (p && p.title) || { zips: null, sectorsDefault: null, has: {} }; }

  // Defaults offered once, as gold changes waiting for Save.
  function seedDefaults() {
    if (EM.seededOnce || !pubRow()) return;
    EM.seededOnce = true;
    var el = document.querySelector('.pubplan-slot-wrapper[data-section-code="em"]');
    if (el) ['subject', 'preview'].forEach(function (k) {
      var lg = norm(k, el.getAttribute('data-email-' + k));
      if (lg && !savedVal(k) && !fieldMissing(k)) { EM.draft[k] = lg.slice(0, MAXLEN[k]); EM.seeded[k] = 'From the legacy planner. Save to keep it.'; }
    });
    if (!savedVal('sectors') && !fieldMissing('sectors')) {
      var td = sectorsNorm(titleInfo().sectorsDefault);
      EM.draft.sectors = td || SECTORS_FALLBACK;
      EM.seeded.sectors = td ? 'The title\u2019s default sectors. Save to keep them.' : 'The standard Ages 20-80. Save to keep it, or add more.';
    }
    if (!savedVal('sendAt') && !fieldMissing('sendAt')) {
      // HC-P-S7-17: issue date is a calendar date; use it as written
      // (not converted from UTC) with the default send time.
      var rawIss = String(rawVal('issueDate') || ''), dm = rawIss.match(/^(\d{4}-\d\d-\d\d)/);
      var iss = dm ? dm[1] + 'T' + DEFAULT_SEND_TIME : '';
      if (iss) { EM.draft.sendAt = iss; EM.seeded.sendAt = 'The issue date. Save to keep it.'; }
    }
  }

  function setupGate() {
    if (!boardData()) return { ok: false, wait: true, html: 'Reading the send settings\u2026' };
    var p = pubBoard();
    if (!p) return { ok: false, html: 'The plan data has no send settings (needs Data Worker v1.0.29 or later).' };
    if (!pubRow()) return { ok: false, html: 'This plan\u2019s newsletter was not found in the plan data.' };
    var miss = SETUP_KEYS.filter(fieldMissing);
    if (miss.length) return { ok: false, html: 'Create the NEWSLETTER field' + (miss.length > 1 ? 's ' : ' ') + miss.map(function (k) { return p.fields[k]; }).join(', ') + ' (Plain text) in Webflow.' };
    var t = titleInfo();
    if (!t.has || !t.has.zips) return { ok: false, html: 'Create the TITLES-ADMIN field send-zip-codes (Plain text) in Webflow, and fill it for this title.' };
    var ch = changedKeys().length;
    if (ch) return { ok: false, html: 'Send Setup has ' + ch + ' unsaved change' + (ch === 1 ? '' : 's') + '. Save or cancel them first.' };
    var empty = SETUP_KEYS.filter(function (k) { return !savedVal(k); }).map(function (k) { return LABEL[k].toLowerCase(); });
    if (!t.zips) empty.unshift('zip codes (on the title)');
    if (empty.length) return { ok: false, html: 'Still to fill in: ' + empty.join(', ') + '.' };
    return { ok: true, html: 'Send Setup is complete.' };
  }

  function rowHtml(k, inner, extra) {
    var c = isChanged(k), fail = EM.fails[k], miss = fieldMissing(k);
    var cnt = MAXLEN[k] && k !== 'volume' ? '<span class="ipp-pub-em-count" data-em-count="' + k + '">' + curVal(k).length + '/' + MAXLEN[k] + '</span>' : '';
    var note = miss ? '<p class="ipp-pub-em-note is-bad">Create the NEWSLETTER field ' + esc(pubBoard().fields[k]) + ' (Plain text) in Webflow.</p>'
      : fail ? '<p class="ipp-pub-em-note is-bad">Not saved: ' + esc(fail) + '</p>'
      : (c && EM.seeded[k] && norm(k, EM.draft[k]) === curVal(k)) ? '<p class="ipp-pub-em-note">' + esc(EM.seeded[k]) + '</p>'
      : (extra || '');
    return '<div class="ipp-pub-em-row" data-em-row="' + k + '"><div class="ipp-pub-em-labelrow"><span class="ipp-pub-em-label">' + LABEL[k] + '</span>' +
      (c && !EM.saving ? '<button type="button" class="ix-revert" data-em-cancel="' + k + '">Cancel</button>' : '') + cnt + '</div>' + inner + note + '</div>';
  }
  function cls(k) { return 'ix-picker-input' + (isChanged(k) ? ' ix-picker-input--changed ipp-dirty' : ''); }
  function dis(k) { return (planLocked() || EM.saving || fieldMissing(k)) ? ' disabled' : ''; }

  function setupCardHtml() {
    if (!boardData()) return '<p class="ipp-pub-em-wait">Reading the send settings\u2026</p>';
    var p = pubBoard(), row = pubRow();
    if (!p || !row) return '<p class="ipp-pub-em-wait">' + esc(setupGate().html) + '</p>';
    seedDefaults();
    var t = titleInfo();
    var sub = rowHtml('subject', '<input type="text" class="' + cls('subject') + '" data-em-field="subject" maxlength="60" value="' + esc(curVal('subject')) + '" placeholder="What the inbox shows as the subject"' + dis('subject') + '>');
    var pre = rowHtml('preview', '<input type="text" class="' + cls('preview') + '" data-em-field="preview" maxlength="100" value="' + esc(curVal('preview')) + '" placeholder="The grey line after the subject in the inbox"' + dis('preview') + '>');
    var zips = (t.zips || '').split(/[\s,;]+/).filter(Boolean);
    var zipHtml = '<div class="ipp-pub-em-row"><div class="ipp-pub-em-labelrow"><span class="ipp-pub-em-label">Zip codes</span><span class="ipp-pub-em-opt">from the title \u00b7 same every issue</span></div>' +
      (zips.length ? '<div class="ipp-pub-chips">' + zips.map(function (z) { return '<span class="ipp-pub-chip">' + esc(z) + '</span>'; }).join('') + '</div><p class="ipp-pub-em-note is-dim">Set once on the title. Change them there, not per issue.</p>'
        : '<p class="ipp-pub-em-note is-bad">' + (t.has && t.has.zips ? 'No zip codes on the title yet. Fill send-zip-codes on this title\u2019s TITLES-ADMIN item.' : 'Create the TITLES-ADMIN field send-zip-codes (Plain text), then fill it for this title.') + '</p>') + '</div>';
    var vol = rowHtml('volume', '<input type="text" inputmode="numeric" class="' + cls('volume') + '" data-em-field="volume" value="' + esc(commas(curVal('volume'))) + '" placeholder="e.g. 8,500"' + dis('volume') + '>');
    var sl = sectorList(curVal('sectors')), sd = dis('sectors');
    var sec = rowHtml('sectors', '<div class="ipp-pub-secs' + (isChanged('sectors') ? ' is-changed ipp-dirty' : '') + '">' +
      sl.map(function (x, n) { return '<span class="ipp-pub-sec">' + esc(x) + (sd ? '' : '<button type="button" class="ipp-pub-sec-x" data-sec-del="' + n + '" aria-label="Remove ' + esc(x) + '">\u00d7</button>') + '</span>'; }).join('') +
      (sd ? '' : '<span class="ipp-pub-sec-add"><input type="text" class="ix-picker-input" data-sec-new placeholder="Add a sector, e.g. Homeowners" maxlength="60">' +
        '<button type="button" class="ix-btn ix-btn--secondary ix-btn--sm" data-sec-add>Add</button></span>') + '</div>',
      '<p class="ipp-pub-em-note is-dim">The vendor\u2019s targeting segments: age band, homeowners, income and so on. One per chip.</p>');
    var sa = curVal('sendAt'), sd = sa.slice(0, 10), st = sa.slice(11, 16);
    var tOpts = '<option value=""></option>' + TIMES.map(function (x) { var d = new Date('2000-01-01T' + x); return '<option value="' + x + '"' + (x === st ? ' selected' : '') + '>' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) + '</option>'; }).join('');
    var when = rowHtml('sendAt', '<div class="ipp-pub-when"><input type="date" class="' + cls('sendAt') + '" data-em-when="date" value="' + esc(sd) + '"' + dis('sendAt') + '>' +
      '<select class="' + cls('sendAt') + '" data-em-when="time"' + dis('sendAt') + '>' + tOpts + '</select></div>',
      '<p class="ipp-pub-em-note is-dim">In this computer\u2019s time zone. Defaults to the issue date.</p>');
    return '<div class="ipp-pub-grp"><p class="ipp-pub-em-head">Inbox</p>' + sub + pre + '</div>' +
      '<div class="ipp-pub-grp"><p class="ipp-pub-em-head">Audience</p>' + zipHtml + '<div class="ipp-pub-two">' + vol + '<div></div></div>' + sec + '</div>' +
      '<div class="ipp-pub-grp"><p class="ipp-pub-em-head">Schedule</p>' + when + '</div>' + setupFootHtml();
  }
  function setupFootHtml() {
    var ch = changedKeys();
    return planLocked() ? '<p class="ipp-pub-em-note is-dim">This plan is locked. The send settings are read-only.</p>'
      : '<div class="ipp-pub-em-actions">' +
          '<button type="button" class="ix-btn ix-btn--primary ix-btn--sm" data-em-save' + (ch.length && !EM.saving ? '' : ' disabled') + '>' +
            (EM.saving ? 'Saving\u2026' : ch.length ? 'Save ' + ch.length + ' change' + (ch.length === 1 ? '' : 's') : 'Save') + '</button>' +
          (ch.length > 1 && !EM.saving ? '<button type="button" class="ix-revert" data-em-cancel-all>Cancel all</button>' : '') +
          (EM.note ? '<span class="ipp-pub-em-status">' + esc(EM.note) + '</span>' : '') +
        '</div>';
  }
  function drawSetup() {
    var box = document.querySelector('[data-publish-setup]'); if (!box) return;
    var act = document.activeElement, key = act && act.getAttribute && (act.getAttribute('data-em-field') || null), pos = null;
    if (key) { try { pos = act.selectionStart; } catch (e) {} }
    EM.drawing = true;
    try { box.innerHTML = setupCardHtml(); } finally { EM.drawing = false; }
    if (key) { var n = box.querySelector('[data-em-field="' + key + '"]'); if (n) { n.focus(); try { if (pos != null && key !== 'volume') n.setSelectionRange(pos, pos); } catch (e) {} } }
  }
  function setDraft(k, v) {
    delete EM.fails[k]; EM.note = '';
    if (norm(k, v) === savedVal(k)) { delete EM.draft[k]; delete EM.seeded[k]; } else EM.draft[k] = v;
  }
  function liveRefresh(k) {
    var row = document.querySelector('[data-publish-setup] [data-em-row="' + k + '"]');
    if (row) {
      Array.prototype.forEach.call(row.querySelectorAll('input,select'), function (el) {
        el.classList.toggle('ix-picker-input--changed', isChanged(k)); el.classList.toggle('ipp-dirty', isChanged(k));
      });
      var cnt = row.querySelector('[data-em-count]'); if (cnt) cnt.textContent = curVal(k).length + '/' + MAXLEN[k];
      var lr = row.querySelector('.ipp-pub-em-labelrow'), cb = lr && lr.querySelector('[data-em-cancel]');
      if (isChanged(k) && !cb && lr) { var b = document.createElement('button'); b.type = 'button'; b.className = 'ix-revert'; b.setAttribute('data-em-cancel', k); b.textContent = 'Cancel';
        lr.insertBefore(b, lr.querySelector('.ipp-pub-em-count')); }
      else if (!isChanged(k) && cb) cb.parentNode.removeChild(cb);
    }
    var act = document.querySelector('[data-publish-setup] .ipp-pub-em-actions');
    if (act) { var t = document.createElement('div'); t.innerHTML = setupFootHtml(); act.parentNode.replaceChild(t.firstChild, act); }
    refreshAll();
  }
  function onSetupInput(el) {
    var k = el.getAttribute('data-em-field');
    if (k) { var v = k === 'volume' ? digits(el.value).slice(0, MAXLEN.volume) : el.value.slice(0, MAXLEN[k]); setDraft(k, v); liveRefresh(k); return; }
    var box = document.querySelector('[data-publish-setup]');

    if (el.hasAttribute('data-em-when')) {
      var d = box.querySelector('[data-em-when="date"]').value, t = box.querySelector('[data-em-when="time"]').value;
      setDraft('sendAt', d && t ? d + 'T' + t : ''); liveRefresh('sendAt');
    }
  }

  function addSector() {                                         // v2.3
    var inp = document.querySelector('[data-publish-setup] [data-sec-new]'); if (!inp) return;
    var v = inp.value.replace(/[;\n]+/g, ' ').trim(); if (!v) { inp.focus(); return; }
    setDraft('sectors', sectorList(curVal('sectors')).concat([v]).join('; '));
    drawSetup(); refreshAll();
    var again = document.querySelector('[data-publish-setup] [data-sec-new]'); if (again) again.focus();
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
        if (!r.ok) throw new Error('Scenario 124 answered HTTP ' + r.status + (r.status === 400 ? ' (is v2.19, op nlmeta, imported?)' : ''));
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
    var fd = {}, want = {};
    ch.forEach(function (k) {
      var v = norm(k, EM.draft[k]); want[k] = v;
      var slug = p.fields[k];
      if (k === 'volume') fd[slug] = v === '' ? null : (p.types.volume === 'Number' ? Number(v) : v);
      else if (k === 'sendAt') fd[slug] = v === '' ? null : new Date(v).toISOString();
      else fd[slug] = v === '' ? null : v;
    });
    var wasAuthorized = !!rawVal('authorizedAt');
    if (wasAuthorized && p.types.authorizedAt !== null) fd[p.fields.authorizedAt] = null;   // a change clears the release
    var stId = wasAuthorized ? withStatus(fd, 'draft') : null;   // v2.4
    EM.saving = true; EM.fails = {}; EM.note = ''; drawSetup(); refreshAll();
    patchNewsletter(fd).then(function () {
      var bad = ch.filter(function (k) { return savedVal(k) !== want[k]; });
      EM.saving = false;
      bad.forEach(function (k) { EM.fails[k] = 'the newsletter did not keep the change'; });
      ch.forEach(function (k) { if (bad.indexOf(k) < 0) { delete EM.draft[k]; delete EM.seeded[k]; } });
      if (!bad.length) { EM.note = 'Saved'; IxToast.show('Send Setup saved', 'ok', wasAuthorized ? { detail: 'The release for distribution was cleared. Compile and confirm again.' } : undefined); }
      if (wasAuthorized) statusCheck(stId);   // v2.4
      if (bad.length) IxToast.show(bad.length + ' send setting' + (bad.length === 1 ? '' : 's') + ' not saved', 'err', { detail: bad.map(function (k) { return LABEL[k]; }).join(', ') });
      drawSetup(); refreshAll();
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
  var GO = { revenue: 'Open Revenue', picker: 'Open Picker', layout: 'Open Layout', setup: 'Open Send Setup' };

  // ── v2.7 · the Compile check board ───────────────────────────
  // Grouped by what is in the newsletter, never by IPP tab. A tile is
  // a rule that can fail: green passed, red failed (with its own fix
  // button), grey still reading. The facts come from /plan-board
  // (ix-issue-data v1.0.33): blockLabel, designInfo, designFits,
  // items, compile (206 v1.44's three tests), asset.ogSrc.
  var GROUP_ORDER = ['article', 'ad', 'event', 're', 'text-ad', 'greeting', 'other', 'delivery'];
  var GROUP_COPY = { ad: 'Ads', other: 'Other blocks', delivery: 'Delivery' };   // page copy, not section names
  var GROUP_FALLBACK = { article: 'Articles', event: 'Events', re: 'Real Estate', 'text-ad': 'Text ads', greeting: 'Greeting' };
  function T_(s, h, v, c, go, thumb) { return { s: s, h: h, v: v, c: c || '', go: go || null, thumb: thumb || '' }; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function posTxt(s) { return 'Position ' + s.position + (s.blockLabel ? ' (' + s.blockLabel + ')' : ''); }

  function groupOf(s) {
    if (s.compile && s.compile.state === 'not-email') return null;      // SB: never in the email
    if (s.blockLabel === 'GR' || s.blockType === 'GR') return 'greeting';
    if (['article', 'ad', 'event', 're', 'text-ad'].indexOf(s.assetType) >= 0) return s.assetType;
    return 'other';
  }
  // Group names: the title's own section labels (IX_CONFIG.sections),
  // so "The Find" is WLN's word for TXA, not one typed here.
  function groupName(g) {
    if (GROUP_COPY[g]) return GROUP_COPY[g];
    var b = boardData(), secs = (b && b.sections) || [];
    var hit = secs.filter(function (x) { return g === 'greeting' ? x.key === 'greeting' : x.assetType === g; })[0];
    return (hit && hit.label) || GROUP_FALLBACK[g] || g;
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
    if (!s.compile.lane) return 'type';
    if (designWhy(s)) return 'design';
    if (s.compile.lane === 'heavy' && contentEmpty(s)) return 'content';
    return 'design';                                        // its template file is not this type's
  }
  function designOk(s) { return !designWhy(s) && outKind(s) !== 'design'; }

  function designTile(ss) {
    var bad = ss.filter(function (s) { return !designOk(s); });
    if (!bad.length) return T_('ok', 'Designs fit each block', ss.length + ' of ' + ss.length, 'Each block uses a design made for its type.');
    var s = bad[0], w = designWhy(s) || 'has a design whose email file is not made for ' + (s.blockLabel || 'its type');
    return T_('bad', 'Designs fit each block', (ss.length - bad.length) + ' of ' + ss.length, posTxt(s) + ' ' + w + '.', 'layout');
  }
  function leftTile(ss, covered) {                          // anything 206 drops that no other tile names
    var out = ss.filter(function (s) { var k = outKind(s); return k && covered.indexOf(k) < 0; });
    if (!out.length) return null;
    var s = out[0];
    return T_('bad', 'Left out of the email', plural(out.length, 'block'), posTxt(s) + ': ' + String(s.compile.why || 'compile would skip it.').replace(/\.$/, '') + '.', 'layout');
  }
  function sendDay() { var v = savedVal('sendAt'); var d = v ? new Date(v) : null; return d && !isNaN(d) ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null; }
  function dayOf(iso) { var d = iso ? new Date(iso) : null; return d && !isNaN(d) ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null; }
  function shortWhen(local) { var d = new Date(local); return isNaN(d) ? local : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
  function clock(local) { var d = new Date(local); return isNaN(d) ? '' : d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
  function shortDay(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }

  function tilesFor(g, ss) {
    var T = [], b = boardData();
    if (g === 'article') {
      var filled = ss.filter(function (s) { return s.asset && !s.asset.missing; });
      var fa = ss.filter(function (s) { return String(s.blockLabel || '').toUpperCase() === 'FA'; }).sort(function (x, y) { return x.position - y.position; })[0];
      var byL = {}; ss.forEach(function (s) { var k = s.blockLabel || 'untyped'; byL[k] = (byL[k] || 0) + 1; });
      var mix = Object.keys(byL).map(function (k) { return byL[k] + ' ' + k; }).join(', ');
      var empty = ss.filter(function (s) { return !(s.asset && !s.asset.missing); });
      if (!fa) T.push(T_('bad', 'Articles selected', filled.length + ' of ' + ss.length + ' slots', 'This plan has no Feature Article block.', 'layout'));
      else if (empty.length) T.push(T_('bad', 'Articles selected', filled.length + ' of ' + ss.length + ' slots', posTxt(empty[0]) + ' is empty' + (empty.length > 1 ? ', and ' + plural(empty.length - 1, 'more') : '') + '.', 'picker'));
      else T.push(T_('ok', 'Articles selected', filled.length + ' of ' + ss.length + ' slots', mix + '. Feature: \u201c' + (fa.asset.name || '') + '\u201d.'));
      T.push(designTile(ss));
      var noImg = filled.filter(function (s) { return !s.asset.thumb; });
      T.push(noImg.length ? T_('bad', 'Main images', (filled.length - noImg.length) + ' of ' + filled.length, '\u201c' + (noImg[0].asset.name || '') + '\u201d has no main image.', 'picker')
        : T_('ok', 'Main images', filled.length + ' of ' + filled.length, 'Every selected article has a main image.'));
      var og = fa && fa.asset && !fa.asset.missing ? fa.asset.ogSrc : '';
      T.push(og ? T_('ok', 'Share image (OG)', 'Set', 'Made from the Feature article\u2019s main image.', null, og)
        : T_('bad', 'Share image (OG)', 'Missing', fa && fa.asset ? 'The Feature article has no square main image to make it from.' : 'There is no Feature article to make it from.', 'picker'));
      T.push(og ? T_('ok', 'Archive page image', 'Matches', 'The Feature article\u2019s main image, the same as the share image.')
        : T_('bad', 'Archive page image', 'Missing', 'It comes from the Feature article\u2019s main image, which is missing.', 'picker'));
      var lt = leftTile(ss, ['design', 'content']); if (lt) T.push(lt);
    } else if (g === 'ad') {
      var rg = window.IPPRevenue && typeof IPPRevenue.gate === 'function' ? IPPRevenue.gate() : null;
      if (!rg) T.push(T_('bad', 'Banner slots filled', 'Unknown', 'Revenue is not on this page (needs ipp-revenue v1.6.0 or later).'));
      else if (!rg.loaded) T.push(T_('wait', 'Banner slots filled', 'Reading\u2026', 'Reading the banner slots.'));
      else if (rg.empty.length) T.push(T_('bad', 'Banner slots filled', rg.filled + ' of ' + rg.total, plural(rg.empty.length, 'slot is', 'slots are') + ' empty: ' + rg.empty.slice(0, 4).join(', ') + '. Fill or delete ' + (rg.empty.length === 1 ? 'it' : 'them') + '.', 'revenue'));
      else if (rg.unsaved) T.push(T_('bad', 'Banner slots filled', rg.filled + ' of ' + rg.total, 'Revenue has ' + plural(rg.unsaved, 'unsaved change') + '. Save or cancel there first.', 'revenue'));
      else T.push(T_('ok', 'Banner slots filled', rg.filled + ' of ' + rg.total, 'No slot is empty.'));
      var all = (b && b.slots) || [], ack = all.filter(function (s) { return s.needsAck; });
      T.push(ack.length ? T_('bad', 'Cloned ads approved', ack.length + ' not approved', posTxt(ack[0]) + ' was copied by Clone and needs your approval.', 'revenue')
        : T_('ok', 'Cloned ads approved', 'All approved', 'No ad copied by Clone is waiting for approval.'));
      var bySec = {};
      all.forEach(function (s) { if (s.section && s.section.id && s.sponsor && s.sponsor.id) { var k = s.section.id; (bySec[k] = bySec[k] || { name: s.section.name, ids: {} }).ids[s.sponsor.id] = s.sponsor.name || s.sponsor.id; } });
      var secK = Object.keys(bySec), clash = secK.filter(function (k) { return Object.keys(bySec[k].ids).length > 1; });
      T.push(clash.length ? T_('bad', 'Section sponsors', plural(clash.length, 'section') + ' disagree', '\u201c' + bySec[clash[0]].name + '\u201d names ' + Object.keys(bySec[clash[0]].ids).map(function (i) { return bySec[clash[0]].ids[i]; }).join(' and ') + '.', 'revenue')
        : T_('ok', 'Section sponsors', secK.length ? 'All agree' : 'None set', secK.length ? 'Each section names one sponsor on every block in it.' : 'No section in this issue has a sponsor.'));
      var lt2 = leftTile(ss, []); if (lt2) T.push(lt2);
    } else if (g === 'event') {
      var ev = []; ss.forEach(function (s) { ev = ev.concat(found(s)); });
      var none = ss.filter(function (s) { return !found(s).length; });
      var sd = sendDay(), early = sd ? ev.filter(function (e) { var d = dayOf(e.start); return d && d < sd; }) : [];
      var days = ev.map(function (e) { return dayOf(e.start); }).filter(Boolean).sort(function (x, y) { return x - y; });
      if (none.length) T.push(T_('bad', 'Events selected', plural(ev.length, 'event'), posTxt(none[0]) + ' has no events.', 'picker'));
      else if (early.length) T.push(T_('bad', 'Events selected', plural(ev.length, 'event'), '\u201c' + early[0].name + '\u201d is on ' + shortDay(dayOf(early[0].start)) + ', before the ' + shortDay(sd) + ' send.', 'picker'));
      else T.push(T_('ok', 'Events selected', plural(ev.length, 'event'), (days.length ? shortDay(days[0]) + (days.length > 1 ? ' to ' + shortDay(days[days.length - 1]) : '') + '. ' : '') + (sd ? 'All on or after the send date.' : 'The send date is not set yet.')));
      T.push(designTile(ss));
      var lt3 = leftTile(ss, ['design', 'content']); if (lt3) T.push(lt3);
    } else if (g === 're') {
      var li = []; ss.forEach(function (s) { li = li.concat(found(s)); });
      var none2 = ss.filter(function (s) { return !found(s).length; });
      T.push(none2.length ? T_('bad', 'Listings selected', plural(li.length, 'listing'), posTxt(none2[0]) + ' has no listings.', 'picker')
        : T_('ok', 'Listings selected', plural(li.length, 'listing'), li.slice(0, 3).map(function (x) { return x.name; }).join(', ') + (li.length > 3 ? ', \u2026' : '') + '.'));
      T.push(designTile(ss));
      var noPh = li.filter(function (x) { return !x.photo; });
      T.push(noPh.length ? T_('bad', 'Listing photos', (li.length - noPh.length) + ' of ' + li.length, '\u201c' + noPh[0].name + '\u201d has no photo.', 'picker')
        : T_('ok', 'Listing photos', li.length + ' of ' + li.length, 'Every listing has a photo.'));
      var lt4 = leftTile(ss, ['design', 'content']); if (lt4) T.push(lt4);
    } else if (g === 'text-ad') {
      var fx = []; ss.forEach(function (s) { fx = fx.concat(found(s)); });
      var none3 = ss.filter(function (s) { return !found(s).length; });
      var nm = groupName(g);
      T.push(none3.length ? T_('bad', nm + ' selected', plural(fx.length, 'ad'), posTxt(none3[0]) + ' has nothing selected.', 'picker')
        : T_('ok', nm + ' selected', fx.length === 1 ? fx[0].name : plural(fx.length, 'ad'), fx.length === 1 ? 'One is chosen for this issue.' : fx.map(function (x) { return x.name; }).slice(0, 3).join(', ') + '.'));
      T.push(designTile(ss));
      var lt5 = leftTile(ss, ['design', 'content']); if (lt5) T.push(lt5);
    } else if (g === 'greeting') {
      var gr = ss[0], gg = (gr && gr.greeting) || {}, gm = ['title', 'paragraph', 'supershort'].filter(function (k) { return !String(gg[k] || '').trim(); });
      var NAMES = { title: 'title', paragraph: 'paragraph', supershort: 'short version' };
      T.push(gm.length ? T_('bad', 'Greeting written', (3 - gm.length) + ' of 3 parts', 'Missing: ' + gm.map(function (k) { return NAMES[k]; }).join(', ') + '.', 'picker')
        : T_('ok', 'Greeting written', '3 of 3 parts', 'The title, the paragraph and the short version are all written.'));
      var lt6 = leftTile(ss, []); if (lt6) T.push(lt6);
    } else if (g === 'other') {
      var lt7 = leftTile(ss, []); if (lt7) T.push(lt7);
    } else if (g === 'delivery') {
      var sg = setupGate();
      if (sg.wait) { T.push(T_('wait', 'Send setup', 'Reading\u2026', 'Reading the newsletter.')); return T; }
      var sub = savedVal('subject'), pre = savedVal('preview'), at = savedVal('sendAt');
      T.push(!sub ? T_('bad', 'Subject line', 'Not set', 'Write the subject line in Send Setup.', 'setup')
        : sub.length > MAXLEN.subject ? T_('bad', 'Subject line', sub.length + ' of ' + MAXLEN.subject + ' characters', 'Too long: inboxes cut it off. ' + sub, 'setup')
        : T_('ok', 'Subject line', sub.length + ' of ' + MAXLEN.subject + ' characters', sub));
      T.push(!pre ? T_('bad', 'Preview text', 'Not set', 'Write the preview text in Send Setup.', 'setup')
        : pre.length > MAXLEN.preview ? T_('bad', 'Preview text', pre.length + ' of ' + MAXLEN.preview + ' characters', 'Too long. ' + pre, 'setup')
        : T_('ok', 'Preview text', pre.length + ' of ' + MAXLEN.preview + ' characters', pre));
      var when = at ? new Date(at) : null, h = when && !isNaN(when) ? Math.round((when - Date.now()) / 36e5) : null;
      T.push(h == null ? T_('bad', 'Goes out', 'Not set', 'Set the send date and time in Send Setup.', 'setup')
        : h < 0 ? T_('bad', 'Goes out', shortWhen(at), clock(at) + '. This time has passed. Set a time in the future.', 'setup')
        : T_('ok', 'Goes out', shortWhen(at), clock(at) + ', ' + (h < 48 ? 'in ' + plural(h, 'hour') : 'in ' + plural(Math.floor(h / 24), 'day') + ', ' + plural(h % 24, 'hour')) + '. It must be in the future.'));
    }
    return T;
  }

  function boardModel() {
    var b = boardData();
    if (!b) return { wait: true, groups: [], total: 0, compiles: 0 };
    var slots = b.slots || [], by = {};
    slots.forEach(function (s) { var g = groupOf(s); if (g) (by[g] = by[g] || []).push(s); });
    var groups = GROUP_ORDER.filter(function (g) { return g === 'delivery' || by[g]; }).map(function (g) {
      var ss = by[g] || [], tiles = tilesFor(g, ss);
      return { key: g, name: groupName(g), n: ss.length, tiles: tiles,
               bad: tiles.filter(function (t) { return t.s === 'bad'; }).length,
               wait: tiles.some(function (t) { return t.s === 'wait'; }) };
    });
    var inEmail = slots.filter(function (s) { return groupOf(s); });
    var configured = !!(b.compile && b.compile.configured);
    return { wait: false, groups: groups, total: inEmail.length, configured: configured,
             compiles: inEmail.filter(function (s) { return s.compile && s.compile.state === 'compiles'; }).length };
  }
  function compileBlockers() {
    var m = boardModel(), n = 0, wait = m.wait, first = null;
    m.groups.forEach(function (g) { if (g.wait) wait = true; g.tiles.forEach(function (t) { if (t.s === 'bad') { n++; if (!first) first = g.name + ': ' + t.c; } }); });
    if (!m.wait && !m.configured) { n++; first = first || 'The pre-check is not set up (IX_CONFIG.compile on the Data Worker).'; }
    if (!state.lastCheck || state.checking) wait = true;
    return { bad: n, wait: wait, first: first, model: m };
  }

  // host + Uploadcare id, every operation dropped (same as 206 module 25321)
  function ucBase(u) { var p = String(u || '').split('/'); return p.length > 3 && p[2] && p[3] ? 'https://' + p[2] + '/' + p[3] + '/' : ''; }
  function tileHtml(t) {
    return '<div class="ipp-cx-tile is-' + t.s + '"><span class="ipp-cx-i" aria-hidden="true">' + (t.s === 'bad' ? '\u2715' : t.s === 'wait' ? '\u2013' : '\u2713') + '</span>' +
      '<span class="ipp-cx-h" title="' + esc(t.h) + '">' + esc(t.h) + '</span><span class="ipp-cx-v" title="' + esc(t.v) + '">' + esc(t.v) + '</span>' +
      '<span class="ipp-cx-c">' + esc(t.c) + '</span>' +
      (t.thumb && ucBase(t.thumb) ? '<img class="ipp-cx-thumb" alt="" src="' + esc(ucBase(t.thumb)) + '-/scale_crop/96x50/smart_faces/">' : '') +
      (t.go && t.s === 'bad' ? '<button type="button" class="ipp-cx-fix" data-pub-go="' + t.go + '">' + GO[t.go] + '</button>' : '') + '</div>';
  }
  function boardHtml(cb) {
    var m = cb.model;
    if (m.wait) return '<p class="ipp-cx-wait">Reading the plan\u2026</p>';
    var chips = m.groups.filter(function (g) { return g.key !== 'delivery' && g.n; });
    var recon = '<div class="ipp-cx-recon"><div class="ipp-cx-total">' + plural(m.total, 'block') + '<small>in this issue</small></div><span class="ipp-cx-eq">=</span>' +
      '<div class="ipp-cx-chips">' + chips.map(function (g) {
        return '<span class="ipp-cx-chip ipp-cx-g--' + g.key + (g.bad ? ' is-bad' : '') + '" title="' + esc(g.n + ' ' + g.name) + '"><b>' + g.n + '</b><span>' + esc(g.name) + '</span></span>'; }).join('') + '</div></div>';
    return recon + m.groups.filter(function (g) { return g.tiles.length; }).map(function (g) {
      return '<section class="ipp-cx-group ipp-cx-g--' + g.key + '"><h3 class="ipp-cx-gh"><i class="ipp-cx-dot" aria-hidden="true"></i>' + esc(g.name) + '</h3>' +
        '<div class="ipp-cx-tiles">' + g.tiles.map(tileHtml).join('') + '</div></section>';
    }).join('');
  }

  function lastHtml(cb) {
    var r = state.result, o = state.lastCheck && state.lastCheck.body && state.lastCheck.body.ok === true ? state.lastCheck.body : null;
    var lc = o && o.lastCompile ? o.lastCompile : null, rows = [];
    var sizeKb = r && r.emailSizeKb != null ? Number(r.emailSizeKb) : lc && lc.sizeKb != null ? Number(lc.sizeKb) : null;
    var limitKb = r && r.emailLimit ? Math.round(Number(r.emailLimit) / 1024) : lc && lc.limitKb ? Number(lc.limitKb) : null;
    if (sizeKb == null && !r) return '<div class="ipp-cx-sec"><h4>Last compile</h4><p class="ipp-cx-none">Not compiled yet.</p></div>';
    var row = function (ok, name, val, extra) { return '<div class="ipp-cx-row' + (ok === false ? ' is-bad' : '') + '"><i class="' + (ok === false ? 'bad' : ok === null ? 'wait' : 'ok') + '">' + (ok === false ? '\u2715' : ok === null ? '\u2013' : '\u2713') + '</i><span>' + name + '</span><em>' + val + '</em>' + (extra || '') + '</div>'; };
    if (sizeKb != null) {
      var over = limitKb ? sizeKb > limitKb : false, pct = limitKb ? Math.min(100, Math.round(sizeKb / limitKb * 100)) : 0;
      rows.push(row(!over, 'Email size', esc(sizeKb) + (limitKb ? ' of ' + esc(limitKb) + ' KB' : ' KB'), limitKb ? '<span class="ipp-cx-meter' + (over ? ' is-over' : '') + '"><span style="width:' + pct + '%"></span></span>' : ''));
    }
    if (r && r.blocks != null) {
      var inPlan = Number(r.blocksInPlan) || Number(r.blocks);
      rows.push(row(Number(r.blocks) >= inPlan, 'Blocks compiled', esc(r.blocks) + ' of ' + esc(inPlan)));
    }
    var lk = state.links;
    if (!lk || lk.running) rows.push(row(null, 'Links respond', lk && lk.running ? 'checking\u2026' : 'after compile'));
    else if (lk.error) rows.push(row(false, 'Links respond', 'could not check'));
    else {
      var badL = lk.links.filter(function (x) { return !x.ok; }).length, tagged = lk.common && lk.common.tagged != null ? lk.common.tagged : 0;
      rows.push(row(!badL, 'Links respond', (lk.checked - badL) + ' of ' + lk.checked));
      rows.push(row(tagged === lk.checked, 'Links carry tracking', tagged + ' of ' + lk.checked));
    }
    var when = r && r.written ? new Date(r.written) : null, slug = pubRow() && pubRow().slug;
    var links = (state.emailUrl ? '<button type="button" class="ix-btn ix-btn--secondary" data-publish-view-email>View email</button>' : '') +
      (slug ? '<a class="ix-btn ix-btn--secondary" href="/nl/' + esc(slug) + '" target="_blank" rel="noopener">View web page</a>' : '');
    var more = lk && lk.links && lk.links.length ? '<button type="button" class="ipp-cx-more" data-cx-utm>Show the tracking codes and all ' + lk.checked + ' links</button>' : '';
    var err = lk && lk.error ? '<p class="ipp-cx-note is-bad">The link check could not run: ' + esc(lk.error) + '</p>' : '';
    return '<div class="ipp-cx-sec"><h4>Last compile' + (when && !isNaN(when) ? ' \u00b7 ' + esc(when.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })) : '') + '</h4>' +
      rows.join('') + err + (links ? '<div class="ipp-cx-links">' + links + '</div>' : '') + more + '</div>';
  }

  function drawBoard() {
    var box = document.querySelector('[data-publish-board]'); if (!box) return;
    var cb = compileBlockers();
    box.innerHTML = boardHtml(cb);
    var o = state.lastCheck && state.lastCheck.body && state.lastCheck.body.ok === true ? state.lastCheck.body : null;
    var stop = o && o.wouldStop ? o.wouldStop.message : '';
    var v = document.querySelector('[data-publish-verdict]');
    if (v) v.innerHTML = cb.bad ? '<b>' + plural(cb.bad, 'thing') + ' to fix before Compile</b><span>Fix each red tile, then check again.</span>'
      : stop ? '<b>Compile would stop</b><span>' + esc(stop) + '</span>'
      : cb.wait ? '<b class="is-wait">Checking\u2026</b><span>Reading the issue.</span>'
      : '<b class="is-ok">Ready to compile</b><span>' + cb.model.compiles + ' of ' + cb.model.total + ' blocks will compile.</span>';
    setGoEnabled(!state.stopped && !cb.bad && !cb.wait && setupGate().ok);
    var hint = document.querySelector('[data-publish-gohint]');
    if (hint) hint.textContent = cb.bad ? cb.first : '';
    var last = document.querySelector('[data-publish-last]'); if (last) last.innerHTML = lastHtml(cb);
    var u = document.querySelector('[data-publish-utm]'); if (u) { var open = !!(u.querySelector('details') || {}).open; u.innerHTML = utmPanel(); var d = u.querySelector('details'); if (d && open) d.open = true; }
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
      .then(function (j) { state.links = j && j.ok ? j : { error: (j && j.error) || 'no answer' }; drawBoard(); drawTabs(); })
      .catch(function (e) { state.links = { error: (e && e.message) || 'request failed' }; drawBoard(); drawTabs(); });
  }
  function refreshAll() { drawTabs(); drawBoard(); }

  // ── the five steps ───────────────────────────────────────────
  var STEPS = [
    { key: 'setup',   label: 'Send Setup' },
    { key: 'compile', label: 'Compile' },
    { key: 'confirm', label: 'Confirmation' },
    { key: 'vendor',  label: 'Submit to Vendor' },
    { key: 'status',  label: 'Vendor Status' }
  ];
  function setupDone() { return setupGate().ok; }
  function compileDone() {
    if (state.compiledOk) return true;
    var o = state.lastCheck && state.lastCheck.body;
    return !!(o && o.ok === true && o.lastCompile && o.lastCompile.sizeKb != null);
  }
  function linksOk() { var l = state.links; return !!(l && l.ok && !l.links.some(function (x) { return !x.ok; })); }
  function confirmDone() { return !!rawVal('authorizedAt'); }
  function stepOpen(k) {
    if (k === 'setup') return true;
    if (k === 'compile') return setupDone();
    if (k === 'confirm') return setupDone() && compileDone() && linksOk();
    if (k === 'vendor') return stepOpen('confirm') && confirmDone();
    if (k === 'status') return stepOpen('vendor') && !!vs('sentAt');
    return false;
  }
  function stepDone(k) { return k === 'setup' ? setupDone() : k === 'compile' ? (compileDone() && linksOk()) : k === 'confirm' ? confirmDone() : k === 'vendor' ? !!vs('sentAt') : !!vs('readyAt'); }
  function lockWhy(k) {
    return k === 'compile' ? 'Finish Send Setup first' : k === 'confirm' ? (compileDone() ? 'Every link must respond first' : 'Compile the issue first')
      : k === 'vendor' ? 'Confirm and release first' : 'Mark the vendor email as sent first';
  }
  function firstOpenStep() { for (var i = 0; i < STEPS.length; i++) if (!stepDone(STEPS[i].key) || !stepOpen(STEPS[i + 1] ? STEPS[i + 1].key : '')) return STEPS[i].key; return 'status'; }
  function curTab() { if (!state.tab || !stepOpen(state.tab)) state.tab = firstOpenStep(); return state.tab; }
  var LOCK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  function tabsHtml() {
    var cur = curTab();
    return STEPS.map(function (t, n) {
      var open = stepOpen(t.key), on = cur === t.key, done = open && stepDone(t.key);
      return '<button type="button" class="ipp-pub-tab' + (on ? ' is-active' : '') + (open ? '' : ' is-locked') + (done ? ' is-done' : '') + (t.sim ? ' is-sim' : '') + '"' +
        ' role="tab" aria-selected="' + on + '" data-pub-tab="' + t.key + '"' + (open ? '' : ' aria-disabled="true" title="' + lockWhy(t.key) + '"') + '>' +
        '<span class="ipp-pub-tab-n">' + (n + 1) + '</span><span class="ipp-pub-tab-name">' + t.label + '</span>' +
        '<span class="ipp-pub-tab-end">' + (open ? (done ? '\u2713' : '') : LOCK) + '</span></button>';
    }).join('');
  }
  function drawTabs() {
    var bar = document.querySelector('[data-publish-tabs]'); if (!bar) return;
    var before = state.tab, cur = curTab();
    bar.innerHTML = tabsHtml();
    if (before !== cur) showPane(cur);
  }
  function showPane(k) {
    Array.prototype.forEach.call(document.querySelectorAll('.ipp-view[data-view="publish"] .ipp-pub-pane'), function (p) { p.hidden = p.getAttribute('data-pane') !== k; });
    if (k === 'confirm') drawConfirm();
    if (k === 'vendor' || k === 'status') drawSim();
  }
  function openStep(k) {
    if (!stepOpen(k)) { IxToast.show(lockWhy(k), 'info'); return; }
    state.tab = k; drawTabs(); showPane(k);
  }

  // ── step 3 · Confirmation ────────────────────────────────────
  var CF = { ticks: [false, false, false], saving: false };
  function confirmHtml() {
    var t = titleInfo(), b = boardData(), i = ids(), lc = state.lastCheck && state.lastCheck.body;
    var slots = (b && b.slots) || [], fa = slots.filter(function (s) { return s.blockType === 'FA' && s.asset; })[0];
    var bannerG = window.IPPRevenue && IPPRevenue.gate ? IPPRevenue.gate() : null;
    var lead = slots.filter(function (s) { return s.assetType === 'ad'; }).sort(function (x, y) { return x.position - y.position; })[0];
    var sendLocal = savedVal('sendAt'), when = sendLocal ? new Date(sendLocal) : null;
    var days = when ? Math.round((when - Date.now()) / 36e5) : null;
    var inTxt = days == null ? '' : days < 0 ? 'this time has passed' : days < 48 ? 'in ' + days + ' hours' : 'in ' + Math.floor(days / 24) + ' days, ' + (days % 24) + ' hours';
    var row = function (k, v) { return '<div class="cf-row"><span>' + k + '</span><b>' + v + '</b></div>'; };
    var authAt = rawVal('authorizedAt');
    return '<p class="ipp-pub-sub">The last stop before this issue goes to readers. Read it through once more. Nothing is sent until you press the button at the bottom.</p>' +
      '<div class="cf-hero"><div class="cf-what"><div class="cf-k">This issue</div><div class="cf-big">' + esc((b && b.plan && b.plan.titleName) || '') + ' \u00b7 ' + esc(i.issue || '') + '</div>' +
        '<div class="cf-sub">' + (lc && lc.lastCompile && lc.lastCompile.sizeKb != null ? 'Compiled \u00b7 ' + esc(lc.lastCompile.sizeKb) + ' KB' : 'Compiled') +
        (state.emailUrl ? ' \u00b7 <a data-publish-view-email>View the email</a>' : '') + (pubRow() && pubRow().slug ? ' \u00b7 <a href="/nl/' + esc(pubRow().slug) + '" target="_blank" rel="noopener">View the web page</a>' : '') + '</div></div>' +
      '<div class="cf-when"><div class="cf-k">Goes out</div><div class="cf-big">' + esc(sendLocal ? niceWhen(sendLocal) : 'not set') + '</div><div class="cf-sub">' + esc(inTxt) + '</div></div></div>' +
      '<div class="cf-grid"><div class="cf-box"><div class="cf-k">Inbox</div>' + row('Subject', esc(savedVal('subject'))) + row('Preview', esc(savedVal('preview'))) + '</div>' +
        '<div class="cf-box"><div class="cf-k">Audience</div>' + row('Sends', esc(commas(savedVal('volume')))) + row('Zip codes', esc(t.zips || '')) + row('Sectors', esc(sectorsShown(savedVal('sectors')))) + row('Newsletter ID', '<span class="mono">' + esc(i.nlId) + '</span>') + '</div>' +
        '<div class="cf-box"><div class="cf-k">Contents</div>' + row('Feature', esc(fa ? fa.asset.name : '\u2014')) + row('Blocks', esc(String(slots.length))) + '</div>' +
        '<div class="cf-box"><div class="cf-k">Advertisers</div>' + row('Lead banner', esc(lead && lead.asset ? (lead.asset.customer || lead.asset.name) : 'house ad')) + row('Banners', esc(bannerG ? bannerG.filled + ' of ' + bannerG.total + ' filled' : '\u2014')) + '</div></div>' +
      (authAt ? '<div class="cf-done">\u2713 Released for distribution \u00b7 ' + esc(niceWhen(isoToLocal(authAt))) + (planLocked() || vs('sentAt') ? '' : ' \u00b7 <button type="button" class="ix-revert" data-cf-withdraw>Withdraw</button>') + '</div>'
        : '<div class="cf-ack">' + ['The subject line and preview text are right.', 'The audience and the send date and time are right.', 'I opened the email and the web page, and they look right.'].map(function (txt, n) {
            return '<label><input type="checkbox" data-cf-tick="' + n + '"' + (CF.ticks[n] ? ' checked' : '') + (CF.saving ? ' disabled' : '') + '> ' + txt + '</label>'; }).join('') + '</div>' +
          '<button type="button" class="cf-go" data-cf-go' + (CF.ticks.every(Boolean) && !CF.saving ? '' : ' disabled') + '>' + (CF.saving ? 'Recording\u2026' : 'Confirm and release for distribution') + '</button>' +
          '<p class="cf-fine">Pressing this records your release, with the time, on the newsletter, and opens Submit to Vendor. Change Send Setup or compile again afterwards and the release is cleared.</p>');
  }
  function drawConfirm() { var box = document.querySelector('[data-publish-confirm]'); if (box) box.innerHTML = confirmHtml(); }
  function setRelease(on) {
    var p = pubBoard(); if (!p || p.types.authorizedAt === null) { IxToast.show('Can\u2019t record the release', 'err', { detail: 'The NEWSLETTER has no final-send-authorized-at field.' }); return Promise.resolve(); }
    var fd = {}; var stamp = on ? new Date().toISOString() : null; fd[p.fields.authorizedAt] = stamp;
    var stId = withStatus(fd, on ? 'readyToPublish' : 'draft');   // v2.4
    CF.saving = true; drawConfirm();
    return patchNewsletter(fd).then(function () {
      CF.saving = false;
      var got = rawVal('authorizedAt');
      if (on ? !got : !!got) { IxToast.show(on ? 'Release not recorded' : 'Release not withdrawn', 'err', { detail: 'The newsletter did not keep the change.' }); }
      else { IxToast.show(on ? 'Released for distribution' : 'Release withdrawn', 'ok'); if (!on) CF.ticks = [false, false, false]; statusCheck(stId); }
      drawConfirm(); drawTabs();
    }).catch(function (err) { CF.saving = false; IxToast.show(on ? 'Release not recorded' : 'Release not withdrawn', 'err', { detail: (err && err.message) || 'the request failed' }); drawConfirm(); });
  }

  // ── steps 4 and 5 · by hand (v2.1) ──────────────────────────
  // Their state is JSON in NEWSLETTER publish-step-state:
  //   { v:1, vendor:{ sentAt, receivedAt, testingAt, testOkAt, readyAt } }
  var VSTEPS = [
    { k: 'sentAt',     label: 'Sent to the vendor',                 auto: 'Later: the Send button sends it from the send mailbox.' },
    { k: 'receivedAt', label: 'The vendor confirmed they have it',  auto: 'Later: read from the vendor\u2019s first reply.' },
    { k: 'testingAt',  label: 'In testing (a seed or test send is on its way)', auto: 'Later: read from a reply saying \u201cin testing\u201d or \u201cseed test\u201d.' },
    { k: 'testOkAt',   label: 'I checked the test and it looks right', auto: 'Stays a person\u2019s call.' },
    { k: 'readyAt',    label: 'Fully set up: nothing more needed',  auto: 'Later: read from a reply saying \u201cfully scheduled\u201d or \u201cnothing more needed\u201d.' }
  ];
  var VS = { draft: {}, saving: false, fails: '', note: '', copied: '' };
  function stepState() { var r = rawVal('stepState'); if (!r) return {}; try { var o = JSON.parse(r); return o && typeof o === 'object' ? o : {}; } catch (e) { return { _bad: true }; } }
  function vsSaved(k) { var v = (stepState().vendor || {})[k]; return v || ''; }
  function vs(k) { return (k in VS.draft) ? VS.draft[k] : vsSaved(k); }
  function vsChanged() { return Object.keys(VS.draft).filter(function (k) { return !!VS.draft[k] !== !!vsSaved(k); }); }
  function vendorInfo() { var p = pubBoard(); return (p && p.vendor) || { email: null, name: null, signoff: null }; }
  function tzName(d) { try { return new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(d).filter(function (x) { return x.type === 'timeZoneName'; })[0].value; } catch (e) { return ''; } }
  function vendorSubject() {
    var b = boardData(), i = ids(), w = savedVal('sendAt');
    return '[' + i.issue + '] ' + ((b && b.plan && b.plan.titleName) || '') + ' \u00b7 send ' + (w ? niceWhen(w) : '');
  }
  function vendorBody() {
    var t = titleInfo(), i = ids(), v = vendorInfo(), w = savedVal('sendAt'), d = w ? new Date(w) : null;
    return (v.name ? 'Hi ' + v.name + ',' : 'Hi,') + '\n\nPlease schedule the attached newsletter:\n\n' +
      '- Subject line: ' + savedVal('subject') + '\n' +
      '- Preview text: ' + savedVal('preview') + '\n' +
      '- Zip codes: ' + (t.zips || '') + '\n' +
      '- Number of sends: ' + commas(savedVal('volume')) + '\n' +
      '- Sectors:\n' + sectorList(savedVal('sectors')).map(function (x) { return '    - ' + x; }).join('\n') + '\n' +
      '- Send date and time: ' + (d ? niceWhen(w, true) + (tzName(d) ? ' ' + tzName(d) : '') : '') + '\n' +
      '- Newsletter ID: ' + i.nlId + ' (please include it on the performance report)\n\n' +
      'The newsletter is attached as ' + i.issue + '-email.html.\n\n' +
      'Thank you' + (v.signoff ? ',\n' + v.signoff : '');
  }
  function vendorHtml() {
    var v = vendorInfo(), i = ids(), sent = vsSaved('sentAt');
    var copyRow = function (label, key, value, mono) {
      return '<div class="vd-row"><div class="vd-l">' + label + '</div><div class="vd-v' + (mono ? ' mono' : '') + '">' + esc(value || '') + '</div>' +
        '<button type="button" class="vd-copy' + (VS.copied === key ? ' is-done' : '') + '" data-vd-copy="' + key + '">' + (VS.copied === key ? 'Copied' : 'Copy') + '</button></div>';
    };
    var mailto = v.email ? 'mailto:' + encodeURIComponent(v.email) + '?subject=' + encodeURIComponent(vendorSubject()) + '&body=' + encodeURIComponent(vendorBody()) : '';
    return '<p class="ipp-pub-sub">Send this yourself from Outlook for now. Copy each part, or open it as a new email with everything filled in, then attach the HTML file.</p>' +
      (v.email ? '' : '<p class="ipp-pub-em-note is-bad">The vendor\u2019s address is not set: add IX_CONFIG.vendor.email on the Data Worker.</p>') +
      '<div class="vd-mail">' + copyRow('To', 'to', v.email || '') + copyRow('Subject', 'subject', vendorSubject()) +
        '<div class="vd-row is-body"><div class="vd-l">Body</div><pre class="vd-body">' + esc(vendorBody()) + '</pre>' +
        '<button type="button" class="vd-copy' + (VS.copied === 'body' ? ' is-done' : '') + '" data-vd-copy="body">' + (VS.copied === 'body' ? 'Copied' : 'Copy') + '</button></div>' +
        '<div class="vd-row"><div class="vd-l">Attach</div><div class="vd-v mono">' + esc(i.issue) + '-email.html</div>' +
        '<button type="button" class="vd-copy" data-vd-download>Download</button></div></div>' +
      '<div class="vd-actions">' + (mailto ? '<a class="ix-btn ix-btn--secondary" href="' + esc(mailto) + '" data-vd-mail>Open in Outlook</a>' : '') +
        '<span class="ipp-pub-em-opt">Opens a new email with To, Subject and Body filled in. Attach the downloaded file before sending.</span></div>' +
      (sent ? '<div class="cf-done">\u2713 Marked as sent \u00b7 ' + esc(niceWhen(isoToLocal(sent))) + ' \u00b7 <button type="button" class="ix-revert" data-vd-go5>Go to Vendor Status</button></div>'
        : '<button type="button" class="cf-go is-ink" data-vd-sent' + (VS.saving ? ' disabled' : '') + '>' + (VS.saving ? 'Recording\u2026' : 'I sent it') + '</button>' +
          '<p class="cf-fine">Records the time on the newsletter and opens Vendor Status. Nothing is sent from here.</p>');
  }
  function statusHtml() {
    var ch = vsChanged(), ready = !!vsSaved('readyAt');
    var rows = VSTEPS.map(function (st, n) {
      var cur = vs(st.k), c = ch.indexOf(st.k) >= 0, blocked = n > 0 && !vs('sentAt');
      return '<label class="vs-row' + (c ? ' is-changed ipp-dirty' : '') + (cur ? ' is-on' : '') + '">' +
        '<input type="checkbox" data-vs-tick="' + st.k + '"' + (cur ? ' checked' : '') + (VS.saving || blocked ? ' disabled' : '') + '>' +
        '<span class="vs-t"><b>' + st.label + '</b>' +
          '<span class="vs-when">' + (cur ? (c ? 'waiting for Save' : esc(niceWhen(isoToLocal(cur)))) : '') + '</span>' +
          '<span class="vs-auto">' + st.auto + '</span></span>' +
        (c && !VS.saving ? '<button type="button" class="ix-revert" data-vs-cancel="' + st.k + '">Cancel</button>' : '') + '</label>';
    }).join('');
    var done = VSTEPS.filter(function (st) { return vsSaved(st.k); }).length;
    return '<p class="ipp-pub-sub">Tick each step as it happens with the vendor. Each tick keeps its time. The grey line under each says what could do it for you later.</p>' +
      (stepState()._bad ? '<p class="ipp-pub-em-note is-bad">publish-step-state on the newsletter is not valid JSON; saving will replace it.</p>' : '') +
      '<div class="vs-bar' + (ready ? ' is-ready' : '') + '"><b>' + (ready ? 'Fully set up' : vsSaved('testingAt') ? 'In testing' : vsSaved('receivedAt') ? 'The vendor has it' : 'Sent, waiting for the vendor') + '</b>' +
        '<span>' + done + ' of ' + VSTEPS.length + ' steps ticked</span></div>' +
      '<div class="vs-list">' + rows + '</div>' +
      '<div class="ipp-pub-em-actions"><button type="button" class="ix-btn ix-btn--primary ix-btn--sm" data-vs-save' + (ch.length && !VS.saving ? '' : ' disabled') + '>' +
        (VS.saving ? 'Saving\u2026' : ch.length ? 'Save ' + ch.length + ' change' + (ch.length === 1 ? '' : 's') : 'Save') + '</button>' +
        (ch.length > 1 && !VS.saving ? '<button type="button" class="ix-revert" data-vs-cancel-all>Cancel all</button>' : '') +
        (VS.note ? '<span class="ipp-pub-em-status">' + esc(VS.note) + '</span>' : '') + '</div>' +
      (ready ? '<div class="sim-final">\ud83d\udd12 <div><b>This issue is done.</b> The vendor has it fully set up. Next: press <b>Set as Next</b> on its Pub Plans tile (automatic later). On the send date, Scenario 108 promotes it to the current issue and locks the plan.</div></div>' : '');
  }
  function drawSim() {
    var v = document.querySelector('[data-publish-vendor]'), s = document.querySelector('[data-publish-vstatus]');
    if (v) v.innerHTML = vendorHtml(); if (s) s.innerHTML = statusHtml();
    var root = document.querySelector('[data-ipp-root]');
    if (root) root.classList.toggle('ipp-pub-done', !!vsSaved('readyAt'));
  }
  function saveVendorState(patch) {
    var p = pubBoard(); if (!p || p.types.stepState === null) { IxToast.show('Can\u2019t save', 'err', { detail: 'The NEWSLETTER has no publish-step-state field.' }); return Promise.resolve(false); }
    var cur = stepState(); if (cur._bad) cur = {};
    var next = Object.assign({}, cur, { v: 1, vendor: Object.assign({}, cur.vendor || {}) });
    Object.keys(patch).forEach(function (k) { if (patch[k]) next.vendor[k] = patch[k]; else delete next.vendor[k]; });
    var fd = {}; fd[p.fields.stepState] = JSON.stringify(next);
    var stId = null;                                                        // v2.4
    if ('readyAt' in patch) stId = withStatus(fd, patch.readyAt ? 'publishNextAsCurrent' : (rawVal('authorizedAt') ? 'readyToPublish' : 'draft'));
    VS.saving = true; drawSim();
    return patchNewsletter(fd).then(function () {
      VS.saving = false;
      var bad = Object.keys(patch).filter(function (k) { return !!vsSaved(k) !== !!patch[k]; });
      if (bad.length) { IxToast.show('Not saved', 'err', { detail: 'The newsletter did not keep ' + bad.length + ' change' + (bad.length === 1 ? '' : 's') + '.' }); drawSim(); drawTabs(); return false; }
      if (stId !== null) statusCheck(stId);   // v2.4
      drawSim(); drawTabs(); return true;
    }).catch(function (err) { VS.saving = false; IxToast.show('Not saved', 'err', { detail: (err && err.message) || 'the request failed' }); drawSim(); return false; });
  }
  function copyText(key) {
    var txt = key === 'to' ? (vendorInfo().email || '') : key === 'subject' ? vendorSubject() : vendorBody();
    var done = function () { VS.copied = key; drawSim(); setTimeout(function () { if (VS.copied === key) { VS.copied = ''; drawSim(); } }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { IxToast.show('Could not copy', 'err', { detail: 'Select the text and copy it by hand.' }); });
    else IxToast.show('Could not copy', 'err', { detail: 'Select the text and copy it by hand.' });
  }
  function downloadHtml() {
    var name = ids().issue + '-email.html';
    var give = function (url) { var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
    if (state.emailUrl) { give(state.emailUrl); return; }
    var u = linkCheckUrl().replace(/\/link-check.*$/, '/email-html'), nl = ids().nlId;
    if (!u || !nl) { IxToast.show('No file to download', 'err', { detail: 'Compile first.' }); return; }
    fetch(u + '?n=' + encodeURIComponent(nl), { method: 'GET', credentials: 'omit' })
      .then(function (r) { if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || ('HTTP ' + r.status)); }, function () { throw new Error('HTTP ' + r.status); }); return r.blob(); })
      .then(function (b) { var url = URL.createObjectURL(b); give(url); setTimeout(function () { URL.revokeObjectURL(url); }, 4000); })
      .catch(function (e) { IxToast.show('No file to download', 'err', { detail: (e && e.message) || 'the request failed' }); });
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
      file: FILE, version: VERSION, title: 'Publish this Issue',
      blurb: 'Builds the email and the web page from the blocks in this plan, ' +
             'saves both to the issue, and publishes the issue\u2019s web page. ' +
             'Nothing is sent to readers.\n\n' +
             'Before you click, the tiles run 206\u2019s own three tests on every block (its type, ' +
             'its design, its content) and the rules for ads, events, listings, the greeting ' +
             'and delivery. A red tile names the problem and opens the place to fix it.\n\n' +
             'Green means 206 confirmed the save. Red names the stage that stopped ' +
             'and why. Amber means there was no clear answer: check the issue before ' +
             'compiling again.',
      scenarios: [{ name: '206 \u00b7 Modular newsletter compiler', note: 'v1.44+, answers this view in JSON' }],
      companions: 'ipp-publish-v2.4.css \u00b7 ix-success-toast \u00b7 ix-issue-data v1.0.33 (/plan-board compile facts and publish, /link-check, /email-html, /issue-check) \u00b7 124 v2.19 (op nlmeta) \u00b7 ipp-revenue v1.6.0+'
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
    if (left > 0) lines.push(left + ' of ' + o.blocksInPlan + ' blocks were left out. Check again: the tiles name each one.');
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
  function setButton(btn, compiled) {
    if (!btn) return;
    btn.classList.toggle('ix-btn--primary', !compiled);
    btn.classList.toggle('ix-btn--secondary', compiled);
    btn.textContent = compiled ? 'Compile again' : 'Compile issue';
  }

  function setStatus(text) {
    var s = document.querySelector('[data-publish-status]');
    if (s) s.textContent = text || '';
  }

  // ── pre-check (v1.4) ─────────────────────────────────────────

  // ── frame ────────────────────────────────────────────────────
  function frame() {
    var b = blockers();
    var head = '<div class="ipp-pub-head"><p class="ipp-pub-kicker">Final step</p>' +
      '<div class="ipp-pub-titlerow"><h2 class="ipp-pub-title">Publish this Issue</h2>' + infoBadge() + '</div></div>';
    if (b.length) {
      return head + '<div class="ipp-pub-card ipp-pub-blocked"><p class="ipp-pub-blocked-head">Cannot publish yet</p><ul class="ipp-pub-list">' +
        b.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    }
    var cur = curTab(), pane = function (k, inner, extra) { return '<div class="ipp-pub-card ipp-pub-pane' + (extra ? ' ' + extra : '') + '" data-pane="' + k + '" role="tabpanel"' + (cur === k ? '' : ' hidden') + '>' + inner + '</div>'; };
    return head +
      '<div class="ipp-pub-tabs" role="tablist" data-publish-tabs>' + tabsHtml() + '</div>' +
      pane('setup', '<p class="ipp-pub-sub">How this issue goes out to readers: what their inbox shows, who receives it, and when. Everything here is required before Compile.</p>' +
        '<div data-publish-setup>' + setupCardHtml() + '</div>') +
      pane('compile', '<p class="ipp-pub-sub">Builds the email and the web page from the blocks in this plan and saves them to the issue. Nothing is sent to readers. Every tile must be green before Compile switches on.</p>' +
        '<div class="ipp-cx"><div class="ipp-cx-main"><div class="ipp-cx-board" data-publish-board></div><div class="ipp-cx-utm" data-publish-utm></div></div>' +
        '<aside class="ipp-cx-side"><div class="ipp-cx-panel">' +
          '<div class="ipp-cx-verdict" data-publish-verdict></div>' +
          '<div class="ipp-cx-act"><button type="button" class="ix-btn ix-btn--primary ix-btn--lg ipp-cx-go" data-publish-go disabled>Compile issue</button>' +
            '<span class="ipp-pub-status" data-publish-status></span><p class="ipp-cx-hint" data-publish-gohint></p>' +
            '<button type="button" class="ipp-pub-recheck" data-publish-recheck>Check again</button></div>' +
          '<div class="ipp-pub-result" data-publish-result hidden></div>' +
          '<div class="ipp-cx-last" data-publish-last></div>' +
        '</div></aside></div>', 'ipp-cx-pane') +
      pane('confirm', '<div data-publish-confirm></div>') +
      pane('vendor', '<div data-publish-vendor></div>') +
      pane('status', '<div data-publish-vstatus></div>');
  }

  // ── pre-check ────────────────────────────────────────────────
  function checkBox() { return document.querySelector('[data-publish-board]'); }
  function goBtn() { return document.querySelector('[data-publish-go]'); }
  function setGoEnabled(on) { var b = goBtn(); if (b && !state.running) b.disabled = !on; }
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
  function afterCheck() {
    refreshAll();
    if (compileDone() && !state.links) runLinkCheck(false);
  }

  function compile(btn) {
    if (state.running || state.stopped) return;
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
        setButton(btn, false);
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
        setButton(btn, true);
        state.compiledOk = true;                                  // v2.0
        if (rawVal('authorizedAt')) setRelease(false);           // a new compile clears the release
        runLinkCheck(true);                                      // every link in the new email
        refreshAll();
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
      setButton(btn, false);
      IxToast.show('Compile not confirmed', 'unverified', { key: key,
        detail: 'Check the issue before compiling again.' });
    });
  }

  // ── mount ────────────────────────────────────────────────────

  // ── mount ────────────────────────────────────────────────────
  function canvas() { return document.querySelector('.ipp-view[data-view="publish"] .ipp-canvas'); }
  function redraw() {
    var c = canvas(); if (!c) return;
    c.innerHTML = frame();
    drawBoard(); showPane(curTab());
  }
  function mount() {
    var c = canvas();
    if (!c) return false;
    if (c.getAttribute(MOUNTED) === '1') return true;
    c.setAttribute(MOUNTED, '1');
    redraw();
    runCheck();
    c.addEventListener('click', function (e) {
      var t = e.target, el;
      if (!t.closest) return;
      if ((el = t.closest('[data-pub-tab]'))) { e.preventDefault(); openStep(el.getAttribute('data-pub-tab')); return; }
      if ((el = t.closest('[data-publish-go]'))) { e.preventDefault(); compile(el); return; }
      if ((el = t.closest('[data-publish-recheck]'))) { e.preventDefault(); state.links = null; runCheck(); return; }
      if ((el = t.closest('[data-cx-utm]'))) { e.preventDefault(); var ud = c.querySelector('[data-publish-utm] details'); if (ud) { ud.open = true; ud.scrollIntoView({ behavior: 'smooth', block: 'start' }); } return; }
      if ((el = t.closest('[data-pub-go]'))) {
        e.preventDefault(); var g = el.getAttribute('data-pub-go');
        if (g === 'setup') { openStep('setup'); return; }
        var tab = document.querySelector('.ipp-switcher button[data-view="' + g + '"]'); if (tab) tab.click(); return;
      }
      if ((el = t.closest('[data-sec-del]'))) { e.preventDefault(); var sl0 = sectorList(curVal('sectors')); sl0.splice(Number(el.getAttribute('data-sec-del')), 1); setDraft('sectors', sl0.join('; ')); drawSetup(); refreshAll(); return; }   // v2.3
      if ((el = t.closest('[data-sec-add]'))) { e.preventDefault(); addSector(); return; }
      if ((el = t.closest('[data-em-save]'))) { e.preventDefault(); setupSave(); return; }
      if ((el = t.closest('[data-em-cancel-all]'))) { e.preventDefault(); EM.draft = {}; EM.seeded = {}; EM.fails = {}; EM.note = ''; drawSetup(); refreshAll(); return; }
      if ((el = t.closest('[data-em-cancel]'))) { e.preventDefault(); var k = el.getAttribute('data-em-cancel'); delete EM.draft[k]; delete EM.seeded[k]; delete EM.fails[k]; EM.note = ''; drawSetup(); refreshAll(); return; }
      if ((el = t.closest('[data-cf-go]'))) { e.preventDefault(); if (CF.ticks.every(Boolean)) setRelease(true); return; }
      if ((el = t.closest('[data-cf-withdraw]'))) { e.preventDefault(); setRelease(false); return; }
      if ((el = t.closest('[data-vd-copy]'))) { e.preventDefault(); copyText(el.getAttribute('data-vd-copy')); return; }
      if ((el = t.closest('[data-vd-download]'))) { e.preventDefault(); downloadHtml(); return; }
      if ((el = t.closest('[data-vd-sent]'))) { e.preventDefault(); saveVendorState({ sentAt: new Date().toISOString() }).then(function (ok) { if (ok) { IxToast.show('Marked as sent', 'ok'); openStep('status'); } }); return; }
      if ((el = t.closest('[data-vd-go5]'))) { e.preventDefault(); openStep('status'); return; }
      if ((el = t.closest('[data-vs-save]'))) {
        e.preventDefault(); var pt = {}; vsChanged().forEach(function (k) { pt[k] = VS.draft[k] || null; });
        saveVendorState(pt).then(function (ok) { if (ok) { VS.draft = {}; VS.note = 'Saved'; IxToast.show('Vendor Status saved', 'ok'); drawSim(); } }); return;
      }
      if ((el = t.closest('[data-vs-cancel-all]'))) { e.preventDefault(); VS.draft = {}; VS.note = ''; drawSim(); return; }
      if ((el = t.closest('[data-vs-cancel]'))) { e.preventDefault(); delete VS.draft[el.getAttribute('data-vs-cancel')]; VS.note = ''; drawSim(); return; }
      if ((el = t.closest('[data-publish-view-email]')) && state.emailUrl) { e.preventDefault(); window.open(state.emailUrl, '_blank', 'noopener'); }
    });
    c.addEventListener('change', function (e) {
      var t = e.target;
      if (t.hasAttribute && t.hasAttribute('data-vs-tick')) {                    // v2.1
        var vk = t.getAttribute('data-vs-tick'), want = t.checked ? (vsSaved(vk) || new Date().toISOString()) : '';
        if (!!want === !!vsSaved(vk)) delete VS.draft[vk]; else VS.draft[vk] = want;
        VS.note = ''; drawSim(); return;
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
    if (!e.detail || e.detail.view !== 'publish') return;
    var c = canvas(); if (!c) return;
    if (c.getAttribute(MOUNTED) !== '1') { mount(); return; }
    if (state.running) return;
    var box = document.querySelector('[data-publish-result]');
    if (box && !box.hidden) { refreshAll(); return; }
    redraw(); runCheck();
  });
  document.addEventListener('ipp:board', function () {
    if (!document.querySelector('[data-publish-tabs]') || EM.saving || CF.saving) return;
    var a = document.activeElement, typing = a && a.closest && a.closest('[data-publish-setup]');
    if (!typing) drawSetup();
    refreshAll();
    var t = curTab(); if (t === 'confirm' || t === 'vendor' || t === 'status') showPane(t);
  });
  document.addEventListener('ipp:revenue-gate', function () { if (!state.running) refreshAll(); });
  document.addEventListener('ipp:ready', mount);
  if (document.querySelector('[data-ipp-root]')) mount();

  window.IppPublish = { version: VERSION, setupGate: setupGate, board: boardModel, revenueGate: revenueGate, vendorBody: vendorBody };
})();
